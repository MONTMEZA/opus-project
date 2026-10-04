/**
 * TROIS PAGES CÔTE À CÔTE, QU'ON FAIT DÉFILER AU DOIGT.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Demandé par le propriétaire le 04/10/2026 :
 *
 *   « J'aimerais qu'on puisse directement scroller pour passer de "Pour
 *     moi" à "Place des pros" à "Demandes" et ainsi de suite. On
 *     conserverait le bouton en haut qui se déplace pour dire sur quelle
 *     page on se trouve, mais c'est plus simple de scroller je trouve. »
 *
 * POURQUOI UN `ScrollView` NATIF, ET AUCUNE DÉPENDANCE
 * ---------------------------------------------------
 * `react-native-pager-view` existe et est fourni dans Expo Go. Il n'a pas
 * été pris, pour la raison déjà écrite dans `Carrousel.js` : **le système
 * sait déjà départager un glissement horizontal d'un défilement vertical,
 * et il le fait côté natif** — donc toujours mieux qu'un arbitrage écrit en
 * JavaScript, et sans ajouter un paquet de plus à l'inventaire d'Expo Go.
 * Ce composant est le même mécanisme que le carrousel de photos, à l'échelle
 * de l'écran.
 *
 * CE QUI EST MONTÉ, ET CE QUI NE L'EST PAS
 * ----------------------------------------
 * **C'est le point qui décide de tout.** Un `ScrollView` monte TOUS ses
 * enfants d'un coup. Poser les trois écrans dedans triplerait donc le
 * premier rendu de « Découvrir » — chacun porte une liste, un en-tête, une
 * barre de recherche. C'est exactement le défaut qui bloquait l'iPhone
 * plusieurs secondes au démarrage le 29/09/2026, et que tout le lot 4 a
 * servi à corriger.
 *
 * > **Une page n'est montée qu'une fois VISITÉE, et elle le reste ensuite.**
 * > Avant, elle n'est qu'une boîte vide de la largeur de l'écran — ce qui
 * > suffit au défilement, qui ne connaît que des largeurs. On ne paie donc
 * > que ce qu'on regarde, et revenir en arrière est instantané.
 *
 * COMMENT ON SAIT OÙ L'ON EST ARRIVÉ
 * ----------------------------------
 * `onScroll` ET `onMomentumScrollEnd`, avec `scrollEventThrottle={32}` :
 * exactement ce que fait déjà `Carrousel.js`, et pour la raison qui y est
 * écrite — **un glissement lent se termine sans élan, et l'événement de fin
 * d'élan n'arrive alors jamais.** La pastille resterait bloquée sur l'onglet
 * de départ. Mesuré ici le 04/10/2026 : un défilement posé par programme ne
 * déclenche AUCUNE fin d'élan au navigateur. Une seule des deux portes ne
 * suffit donc pas.
 *
 * Ce que cela coûte, et pourquoi ce n'est pas la bannière du lot 6 : le
 * gestionnaire lit un nombre et compare. Il ne REDESSINE rien tant qu'on n'a
 * pas franchi la moitié d'une page — l'état change **une fois par
 * glissement**, pas une fois par pixel. La règle du lot 6 vise ce qui anime
 * depuis JavaScript, pas ce qui observe.
 *
 * Et le franchissement à MI-COURSE est un bénéfice, pas un compromis : la
 * pastille bascule quand la page suivante occupe plus de la moitié de
 * l'écran, et c'est aussi à cet instant-là que cette page se monte — donc
 * avant qu'on la voie en entier.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI
 * ----------------------------
 * Le geste. Sur ordinateur, une zone défilante répond à la molette, pas au
 * glissement : l'arbitrage réel entre « je fais défiler la liste » et « je
 * change de page » ne se juge que sur le téléphone. Ce qui SE vérifie au
 * navigateur : que les pages se montent au bon moment, que la pastille suit
 * la page, et que changer d'onglet par la pastille déplace bien le
 * défilement.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';

export default function PagesGlissantes({ pages, index, onIndex }) {
  const { width } = useWindowDimensions();
  const ref = useRef(null);
  const pageAffichee = useRef(index);

  /* LES PAGES DÉJÀ VISITÉES, mises à jour PENDANT LE RENDU.
     C'est le procédé que React documente pour ajuster un état quand une
     propriété change : il relance le rendu aussitôt, sans rien peindre
     entre les deux. Le faire depuis un `useEffect` demanderait un second
     rendu APRÈS affichage — on verrait donc la page arriver vide pendant
     une image, ce qui est exactement ce qu'on veut éviter. */
  const [vues, setVues] = useState(() => new Set([index]));
  if (!vues.has(index)) setVues(new Set(vues).add(index));

  useEffect(() => {
    /* On ne redemande pas un défilement vers la page où l'on est déjà :
       ce serait annuler celui que le doigt vient de faire. */
    if (pageAffichee.current === index) return;
    pageAffichee.current = index;
    if (ref.current) ref.current.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  /* La largeur change à la rotation de l'écran : sans ce recalage, on se
     retrouve entre deux pages. */
  useEffect(() => {
    if (ref.current) ref.current.scrollTo({ x: index * width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  /* LE PLACEMENT DE DÉPART SE FAIT À LA MISE EN PAGE, pas seulement par
     `contentOffset`. « Place des pros » est le deuxième onglet : on doit y
     arriver directement, sans voir passer le premier. Et `contentOffset`
     n'est pas honoré partout — `react-native-web` l'ignore. Un défilement
     posé au premier `onLayout`, lui, marche des deux côtés. */
  const place = useRef(false);
  const auPremierRendu = () => {
    if (place.current || !ref.current) return;
    place.current = true;
    ref.current.scrollTo({ x: index * width, animated: false });
  };

  const arrivee = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / Math.max(1, width));
    if (page === pageAffichee.current) return;
    pageAffichee.current = page;
    if (pages[page]) onIndex(pages[page].key, page);
  };

  return (
    <ScrollView
      ref={ref}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      /* Sans lui, le premier appui sur un bouton alors que le clavier est
         ouvert ne fait que refermer le clavier — la leçon de `FeuilleBas`,
         et elle vaut pour tout conteneur défilant qui porte des champs. */
      keyboardShouldPersistTaps="handled"
      /* Les deux portes appellent la même fonction, qui ne fait rien tant
         que la page n'a pas changé. Voir l'en-tête : une seule des deux ne
         suffit pas. */
      onScroll={arrivee}
      onMomentumScrollEnd={arrivee}
      scrollEventThrottle={32}
      style={s.cadre}
      contentOffset={{ x: index * width, y: 0 }}
      onLayout={auPremierRendu}
    >
      {pages.map((p, i) => (
        <View key={p.key} style={[s.page, { width }]}>
          {vues.has(i) ? p.rendu() : null}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  cadre: { flex: 1 },
  page: { flex: 1 },
});
