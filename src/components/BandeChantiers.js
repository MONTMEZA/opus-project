/**
 * LA BANDE DES CHANTIERS — une rangée, et elle se tire au doigt.
 *
 * POURQUOI HORIZONTALE, ALORS QUE J'AVAIS DIT NON
 * -----------------------------------------------
 * J'avais écarté cette forme devant le propriétaire, au motif que la fiche
 * se quitte par un glissement latéral et que deux défilements horizontaux
 * ne peuvent pas répondre au même doigt. **Il a insisté, et il avait
 * raison.** Vérifié dans le code avant de revenir dessus :
 *
 *     if (!onRetourFilVideo) return contenu;   // ProfilProScreen
 *
 * Le geste n'existe QUE si la fiche a été ouverte depuis le fil vidéo, et
 * il n'y a qu'un seul appel dans toute l'application qui le fasse. Depuis
 * le fil classique, la Place des pros, une notification ou une recherche,
 * la fiche n'a aucun geste latéral — la bande n'y coûte donc rien. Et dans
 * le seul cas où il existe, le coût est local : le retour ne marche pas
 * pendant que le doigt est SUR la bande, et marche partout ailleurs.
 *
 * C'est exactement le compromis déjà accepté deux fois dans ce projet — la
 * rangée de pastilles de la Place des pros, et le carrousel de photos
 * d'une annonce —, et mesuré le 04/10 : « doigt parti d'une zone
 * imbriquée : la page ne change pas ».
 *
 * ET C'EST AUSSI PLUS LÉGER. Trois rangées empilées pesaient environ
 * 210 px sur une fiche qui est déjà la page la plus chargée d'Opus — la
 * grille de réalisations du propriétaire en occupe à elle seule plus de
 * 800. Une bande en fait une seule.
 *
 * LA COUVERTURE EST LE RÉSULTAT, PAS LE DÉBUT
 * --------------------------------------------
 * Elle vient de la publication la plus RÉCENTE qui porte une image
 * (section 36.5). Personne n'a envie de commencer par une toiture
 * arrachée : on veut voir ce que c'est devenu, et ensuite comment.
 */
import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, GOUTTIERE, APPUI, interligne,
} from '../theme';
import Media from './Media';
import { apercuDe } from '../lib/cloudinary';
import { Layers } from './icons';

/* Assez large pour qu'une photo de chantier se lise, assez étroit pour que
   la SUIVANTE dépasse du bord — sans ce débord, personne ne devine qu'il
   y en a d'autres, et la bande devient une carte unique. */
const LARGEUR = 164;
const HAUTEUR_IMAGE = 110;

export default function BandeChantiers({ chantiers = [], onOuvrir }) {
  if (chantiers.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.bande}
    >
      {chantiers.map((c) => {
        const enCours = c.statut === 'en_cours';
        return (
          <Pressable
            key={c.id}
            onPress={() => onOuvrir(c)}
            accessibilityRole="button"
            accessibilityLabel={`Chantier ${c.titre}, ${c.nbPublications} publication${
              c.nbPublications > 1 ? 's' : ''}${enCours ? ', en cours' : ''}`}
            style={({ pressed }) => [s.carte, pressed && APPUI.plein]}
          >
            {c.couverture ? (
              <Media media={apercuDe(c.couverture)} style={s.image} />
            ) : (
              /* Un chantier sans aucune photo : l'icône plutôt qu'un carré
                 gris, qui ressemblerait à une image qui n'a pas chargé.
                 C'est la leçon du lot C, appliquée une troisième fois. */
              <View style={[s.image, s.imageVide]}>
                <Layers size={20} color={C.muted} />
              </View>
            )}

            {enCours && (
              <View style={s.pastille}>
                <Text style={s.pastilleTexte}>En cours</Text>
              </View>
            )}

            <Text style={s.titre} numberOfLines={2}>{c.titre}</Text>
            <Text style={s.detail} numberOfLines={1}>
              {c.nbPublications > 0
                ? `${c.nbPublications} publication${c.nbPublications > 1 ? 's' : ''}`
                : 'Rien encore'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bande: { paddingHorizontal: GOUTTIERE, paddingBottom: S.sm, gap: S.sm },
  /* Angle VIF : une carte de chantier PORTE une information, elle ne
     flotte pas (voir « Les bords » dans CLAUDE.md). */
  carte: {
    width: LARGEUR,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingBottom: S.sm,
  },
  image: { width: LARGEUR - 2, height: HAUTEUR_IMAGE, backgroundColor: C.line },
  imageVide: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  /* La pastille, elle, FLOTTE sur l'image : elle s'arrondit. */
  pastille: {
    position: 'absolute', left: S.sm, top: S.sm,
    backgroundColor: C.accent, borderRadius: R.gelule,
    paddingVertical: S.xs, paddingHorizontal: S.sm,
  },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: C.surAccent },
  titre: {
    fontFamily: F.oswald6, fontSize: T.courant, color: C.ink,
    paddingHorizontal: S.sm, paddingTop: S.sm, lineHeight: interligne(T.courant),
  },
  detail: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    paddingHorizontal: S.sm, paddingTop: S.xs,
  },
});
