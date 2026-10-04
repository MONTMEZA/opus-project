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
 * LE DÉFAUT DE LA PREMIÈRE VERSION, ET IL EST INSTRUCTIF
 * -----------------------------------------------------
 * Essayée sur l'iPhone, elle s'arrêtait ENTRE DEUX PAGES :
 *
 *   « Quand je scrolle j'arrive entre deux pages, ce n'est pas bon, je
 *     n'arrive pas proprement sur une page comme le fait le bouton. »
 *
 * Et au navigateur, elle paraissait parfaite. La raison tient à ce que
 * `pagingEnabled` N'EST PAS LA MÊME CHOSE des deux côtés :
 *
 *   - `react-native-web` le traduit en `scroll-snap-type: x mandatory`,
 *     qui s'accroche au BORD DE CHAQUE ENFANT, quelle que soit sa
 *     largeur. Tout défaut de largeur est donc invisible ;
 *   - **iOS, lui, avance d'une LARGEUR DE CADRE à la fois.** Si les pages
 *     ne font pas exactement la largeur du cadre qui défile, on s'arrête
 *     entre deux, et le décalage s'accumule de page en page.
 *
 * Deux erreurs produisaient ce décalage, et `Carrousel.js` — qui fait la
 * même chose à l'échelle d'une photo depuis le lot 0 — ne les faisait ni
 * l'une ni l'autre :
 *
 *   1. **la largeur venait de la FENÊTRE** (`useWindowDimensions`), pas du
 *      cadre qui défile. Les deux coïncident souvent, et « souvent » ne
 *      suffit pas : il suffit d'une marge posée un jour au-dessus pour que
 *      la pagination se décale partout, sans la moindre erreur ;
 *   2. **chaque page portait `flex: 1` EN PLUS de sa largeur.** Dans un
 *      conteneur horizontal, `flex: 1` vaut `flexBasis: 0` — donc la
 *      largeur explicite ne décide plus de rien, et c'est le partage de
 *      l'espace qui s'en charge.
 *
 * > **La largeur d'une page se MESURE sur le cadre qui défile, jamais sur
 * > la fenêtre. Et une page ne porte aucun `flex` : seulement sa largeur
 * > et `height: '100%'`.** C'est mot pour mot ce que fait `Carrousel.js`.
 *
 * POURQUOI UN `ScrollView` NATIF, ET AUCUNE DÉPENDANCE
 * ---------------------------------------------------
 * `react-native-pager-view` existe et est fourni dans Expo Go. Il n'a pas
 * été pris, pour la raison déjà écrite dans `Carrousel.js` : **le système
 * sait déjà départager un glissement horizontal d'un défilement vertical,
 * et il le fait côté natif** — donc toujours mieux qu'un arbitrage écrit en
 * JavaScript, et sans ajouter un paquet de plus à l'inventaire d'Expo Go.
 *
 * CE QUI EST MONTÉ, ET CE QUI NE L'EST PAS
 * ----------------------------------------
 * Un `ScrollView` monte TOUS ses enfants d'un coup. Poser les trois écrans
 * dedans triplerait donc le premier rendu de « Découvrir » — chacun porte
 * une liste, un en-tête, une barre de recherche. C'est exactement le défaut
 * qui bloquait l'iPhone plusieurs secondes au démarrage le 29/09/2026, et
 * que tout le lot 4 a servi à corriger.
 *
 * > **Une page n'est montée qu'une fois VISITÉE, et elle le reste ensuite.**
 * > Avant, elle n'est qu'une boîte vide de la bonne largeur — ce qui suffit
 * > au défilement, qui ne connaît que des largeurs.
 *
 * RIEN NE BOUGE PENDANT LE GESTE — troisième cause possible, et la plus
 * sournoise
 * ---------------------------------------------------------------------
 * La première version changeait l'onglet **à mi-course**. Or cet onglet vit
 * dans `OpusApp` : le changer redessine toute l'application, et surtout
 * **monte la page d'arrivée** — un écran entier, avec sa liste — au beau
 * milieu du freinage. Un `ScrollView` dont la mise en page change pendant
 * qu'il décélère peut s'arrêter là où il en est.
 *
 * > **On ne lit la page d'arrivée que lorsque le défilement s'est ARRÊTÉ.**
 * > Pendant le geste, le seul travail fait en JavaScript est de ranger un
 * > nombre dans une référence — aucun rendu, aucun montage. C'est la règle
 * > de la bannière du lot 6, appliquée à la lettre.
 *
 * Et pour que la page d'arrivée ne soit pas vide pendant qu'on glisse vers
 * elle, **les voisines se montent quand l'écran est AU REPOS**, une
 * demi-seconde après l'arrivée. Jamais pendant le geste. C'est le même
 * raisonnement que `Carrousel.js` — « la voisine est toujours prête avant
 * qu'on l'atteigne » — mais décalé dans le temps plutôt que fait d'emblée,
 * pour que l'ouverture de « Découvrir » ne monte toujours qu'UN écran.
 *
 * COMMENT ON SAIT QUE ÇA S'EST ARRÊTÉ — et pourquoi pas « fin d'élan »
 * -------------------------------------------------------------------
 * `onMomentumScrollEnd` et `onScrollEndDrag` sont des notions de DOIGT.
 * Mesuré ici le 04/10/2026 : au navigateur, un défilement à la molette
 * déplace bien les pages et les accroche — et n'émet **ni l'un ni
 * l'autre**. S'y fier seul rendrait la pastille muette sur toute une
 * plateforme, et surtout m'empêcherait de vérifier quoi que ce soit ici.
 *
 * > **On attend simplement que les événements de défilement CESSENT.**
 * > Un minuteur de 150 ms, remis à zéro à chaque `onScroll`. Toute façon de
 * > faire défiler en produit — le doigt, la molette, une position posée par
 * > programme —, donc la règle est la même partout et elle se vérifie.
 *
 * `onMomentumScrollEnd` est gardé en plus, parce que sur iPhone il arrive
 * à l'instant exact de l'arrêt : c'est 150 ms de gagnées quand il est là.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI
 * ----------------------------
 * Le geste, et **la qualité de l'accrochage** — c'est précisément ce qui a
 * échappé à la première version. Sur ordinateur, une zone défilante répond
 * à la molette, pas au glissement, et l'accrochage y est fait par le
 * navigateur, pas par iOS. Ce qui SE vérifie au navigateur : que les pages
 * font EXACTEMENT la largeur du cadre, qu'elles se montent au bon moment,
 * et que la pastille suit la page.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';

export default function PagesGlissantes({ pages, index, onIndex }) {
  const ref = useRef(null);
  const pageAffichee = useRef(index);

  /* LA LARGEUR VIENT DU CADRE QUI DÉFILE, mesurée à la mise en page — pas
     de la fenêtre. C'est elle que `pagingEnabled` utilise comme pas. */
  const [largeur, setLargeur] = useState(0);
  const place = useRef(false);

  /* LES PAGES MONTÉES, mises à jour PENDANT LE RENDU.
     C'est le procédé que React documente pour ajuster un état quand une
     propriété change : il relance le rendu aussitôt, sans rien peindre
     entre les deux. */
  const [vues, setVues] = useState(() => new Set([index]));
  if (!vues.has(index)) setVues(new Set(vues).add(index));

  /* LES VOISINES, UNE DEMI-SECONDE PLUS TARD — et jamais pendant le geste.
     À l'ouverture de « Découvrir », un seul écran est monté : c'est ce qui
     garde le premier affichage léger. Puis, une fois que plus rien ne
     bouge, on prépare celles d'à côté, pour qu'un glissement ne montre
     jamais de page vide et surtout ne monte rien en pleine course. */
  useEffect(() => {
    const t = setTimeout(() => {
      setVues((v) => {
        const n = new Set(v);
        [index - 1, index + 1].forEach((i) => { if (pages[i]) n.add(i); });
        return n.size === v.size ? v : n;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [index, pages]);

  const mesurer = (e) => {
    const l = Math.round(e.nativeEvent.layout.width);
    if (l > 0 && l !== largeur) setLargeur(l);
  };

  /* LE PLACEMENT DE DÉPART attend de connaître la largeur : « Place des
     pros » est le deuxième onglet, on doit y arriver directement, sans voir
     passer le premier. Et une rotation d'écran change la largeur : on se
     recale, sinon on se retrouve entre deux pages. */
  useEffect(() => {
    if (!largeur || !ref.current) return;
    ref.current.scrollTo({ x: pageAffichee.current * largeur, animated: false });
    place.current = true;
  }, [largeur]);

  useEffect(() => {
    /* On ne redemande pas un défilement vers la page où l'on est déjà : ce
       serait interrompre l'accrochage que le doigt vient de lancer, et
       s'arrêter entre deux pages — le défaut même qu'on corrige ici. */
    if (pageAffichee.current === index) return;
    pageAffichee.current = index;
    if (largeur && ref.current) {
      ref.current.scrollTo({ x: index * largeur, animated: true });
    }
  }, [index, largeur]);

  /* PENDANT LE GESTE, on ne fait QUE ranger un nombre : pas de rendu, pas
     de montage, rien qui puisse interrompre le freinage. */
  const offset = useRef(0);
  const minuteur = useRef(null);
  const annuler = () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
  };

  const arrete = () => {
    annuler();
    if (!largeur) return;
    const page = Math.round(offset.current / largeur);
    if (page === pageAffichee.current) return;
    pageAffichee.current = page;
    if (pages[page]) onIndex(pages[page].key, page);
  };

  /* À CHAQUE ÉVÉNEMENT DE DÉFILEMENT : on note la position, et on repousse
     le moment de conclure. Tant que ça bouge, rien ne se décide. */
  const enDefilement = (e) => {
    offset.current = e.nativeEvent.contentOffset.x;
    annuler();
    minuteur.current = setTimeout(arrete, 150);
  };

  useEffect(() => annuler, []);

  return (
    <View style={s.cadre} onLayout={mesurer}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        /* L'accrochage se décide plus vite : sans ça, un petit coup de
           pouce fait glisser longtemps avant de se poser. */
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        /* Sans lui, le premier appui sur un bouton alors que le clavier est
           ouvert ne fait que refermer le clavier — la leçon de
           `FeuilleBas`, et elle vaut pour tout conteneur défilant qui porte
           des champs. */
        keyboardShouldPersistTaps="handled"
        /* `onScroll` ne fait RIEN d'autre que noter la position et
           repousser le minuteur : aucun rendu pendant le geste. */
        onScroll={enDefilement}
        onMomentumScrollEnd={arrete}
        scrollEventThrottle={32}
        style={s.cadre}
      >
        {pages.map((p, i) => (
          /* AUCUN `flex` ICI : dans un conteneur horizontal, `flex: 1`
             vaut `flexBasis: 0` et la largeur explicite ne décide plus de
             rien. C'est ce qui faisait arriver entre deux pages. */
          <View key={p.key} style={{ width: largeur || 1, height: '100%' }}>
            {largeur > 0 && vues.has(i) ? p.rendu() : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  cadre: { flex: 1 },
});
