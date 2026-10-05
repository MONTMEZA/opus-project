/**
 * « SES CONSEILS » — le LECTEUR de l'étiquette posée au lot C.
 *
 * POURQUOI CE FICHIER EXISTE, ET PAS SEULEMENT LA COLONNE
 * -------------------------------------------------------
 * Le 01/10/2026, trois tables étaient écrites et jamais relues : un client
 * remplissait un formulaire, l'application le remerciait, et la demande
 * tombait dans un trou. Le 04/10, l'inverse : `annonces_pro.medias` était
 * LUE et personne ne l'écrivait.
 *
 * > Chercher qui LIT ce qu'on écrit ne suffit pas : il faut aussi chercher
 * > qui ÉCRIT ce qu'on lit. Les deux sens du même contrôle.
 *
 * Une case « C'est un conseil » sans cet écran serait donc la même panne
 * silencieuse, en plus bête : une colonne cochée que rien ne montre. C'est
 * ici que l'étiquette devient utile — un conseil vaut encore dans trois
 * ans, et il faut pouvoir le retrouver après la centième photo de chantier.
 *
 * CE N'EST PAS LA GRILLE DU PORTFOLIO, ET LA DIFFÉRENCE EST LE TOUT
 * -----------------------------------------------------------------
 * `PortfolioGrid` montre des vignettes carrées de 130 px, sans un mot :
 * c'est juste, une réalisation se regarde. Un conseil, lui, SE LIT. Faire
 * une grille de conseils, c'est mettre à l'écran des carrés de béton
 * indiscernables en cachant la seule chose qui compte.
 *
 * D'où une rangée par conseil : la vignette à gauche, le texte ENTIER à
 * droite. Pas de « … lire la suite » — un conseil tronqué ne conseille
 * rien, et l'artisan a écrit ce texte pour qu'on le lise.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, GOUTTIERE, interligne, APPUI, viser,
} from '../theme';
import Media from './Media';
import Visionneuse from './Visionneuse';
import { apercuDe } from '../lib/cloudinary';
import { Lightbulb, Volume2, Maximize } from './icons';
import { porteUnVisuel } from '../lib/formats-publication';

/** Les formats qui portent une voix : on le DIT, sinon on ne l'écoute pas. */
const AVEC_SON = new Set(['video', 'montage']);

export default function ConseilsPro({ items = [] }) {
  /* L'index du conseil ouvert en grand, ou `null`. La visionneuse ne reçoit
     QUE les conseils qui ont un visuel : lui passer la liste entière
     décalerait les index dès le premier conseil en texte, et on ouvrirait
     la photo du voisin. */
  const [ouvert, setOuvert] = useState(null);

  if (items.length === 0) return null;

  /* LE FORMAT DÉCIDE, et pas seulement `media` — défaut du 05/10/2026 :
     un conseil au format « Texte » publié sur la vraie base portait un
     dégradé de couverture, et s'affichait donc avec une vignette grise et
     une pastille « agrandir ». Voir `formats-publication.js`. */
  const visuels = items.filter((c) => porteUnVisuel(c.format) && !!c.media);

  return (
    <>
      <View style={s.liste}>
        {items.map((c) => {
          const aUnVisuel = porteUnVisuel(c.format) && !!c.media;
          const avecSon = AVEC_SON.has(c.format);
          /* Le rang DANS LA LISTE DES VISUELS, pas dans la liste complète. */
          const rang = aUnVisuel ? visuels.indexOf(c) : -1;

          /* UNE RANGÉE SANS VISUEL NE S'APPUIE PAS, et elle n'en a pas
             l'air : rien à ouvrir en grand, le texte est déjà entier sous
             les yeux. C'est la leçon de la poignée des commentaires, qui
             était dessinée et ne se tirait pas — on appuie, rien ne se
             passe, et on croit l'application cassée. */
          const Rangee = aUnVisuel ? Pressable : View;
          const proprietes = aUnVisuel ? {
            onPress: () => setOuvert(rang),
            accessibilityRole: 'button',
            accessibilityLabel: avecSon
              ? `Écouter ce conseil : ${c.texte}`
              : `Agrandir ce conseil : ${c.texte}`,
            hitSlop: viser(44),
            style: ({ pressed }) => [s.rangee, pressed && APPUI.discret],
          } : { style: s.rangee };

          return (
            <Rangee key={c.id} {...proprietes}>
              {aUnVisuel ? (
                <View style={s.vignetteBoite}>
                  {/* `apercuDe` : une image, pas un lecteur vidéo. Six
                      lecteurs montés pour six images fixes, c'est 4,7 Mo
                      au lieu de 270 Ko — mesuré au lot du portfolio. */}
                  <Media media={apercuDe(c.media)} style={s.vignette} />
                  <View style={s.pastille}>
                    {avecSon
                      ? <Volume2 size={11} color={C.surface} />
                      : <Maximize size={11} color={C.surface} />}
                  </View>
                </View>
              ) : (
                /* Un conseil en texte n'a rien à montrer, et c'est très
                   bien : une mise en garde, une date de réglementation. On
                   met l'ampoule à la place de la vignette plutôt que de
                   laisser un trou gris, qui ressemblerait à une image qui
                   n'a pas chargé. */
                <View style={[s.vignetteBoite, s.vignetteTexte]}>
                  <Lightbulb size={20} color={C.accent2} />
                </View>
              )}

              <View style={s.corps}>
                {/* Le texte EN ENTIER. Pas de `numberOfLines` : un conseil
                    coupé ne conseille rien. */}
                <Text style={s.texte}>{c.texte}</Text>
                <Text style={s.quand}>
                  {c.time}
                  {avecSon ? ' · vidéo, avec le son' : ''}
                </Text>
              </View>
            </Rangee>
          );
        })}
      </View>

      {/* LE SON EST ICI, et nulle part ailleurs. `Visionneuse` lit avec
          `muet={false}` : c'est le seul endroit de l'application où la voix
          off d'un artisan s'entend. Le fil, lui, reste muet — une liste qui
          parle en défilant se coupe au bout de dix secondes. */}
      {ouvert !== null && (
        <Visionneuse
          items={visuels.map((c) => c.media)}
          index={ouvert}
          onClose={() => setOuvert(null)}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  liste: { paddingHorizontal: GOUTTIERE, paddingBottom: S.sm, gap: S.sm },
  /* Angle VIF : chaque rangée PORTE un texte, elle ne flotte pas. */
  rangee: {
    flexDirection: 'row', gap: S.sm, padding: S.sm,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  vignetteBoite: { width: 72, height: 72 },
  vignette: { width: 72, height: 72, backgroundColor: C.line },
  vignetteTexte: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.line, borderStyle: 'dashed',
  },
  /* La pastille dit « il y a autre chose derrière cette image » : du son,
     ou juste du plus grand. Elle FLOTTE sur la photo, donc elle s'arrondit. */
  pastille: {
    position: 'absolute', right: S.xs, bottom: S.xs,
    backgroundColor: 'rgba(26,27,25,0.72)', borderRadius: R.gelule,
    padding: S.xs,
  },
  corps: { flex: 1, minWidth: 0, justifyContent: 'center' },
  /* `T.corps` et non `T.courant` : c'est « le texte qu'on lit vraiment »,
     comme une description de publication ou un message (voir T dans
     theme.js). Un conseil est du contenu, pas une étiquette d'interface. */
  texte: {
    fontFamily: F.inter, fontSize: T.corps, color: C.ink,
    lineHeight: interligne(T.corps),
  },
  quand: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, marginTop: S.xs },
});
