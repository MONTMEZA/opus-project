/**
 * LA PAGE D'UN CHANTIER — l'histoire, dans le sens où elle s'est passée.
 *
 * POURQUOI DU PLUS ANCIEN AU PLUS RÉCENT
 * ---------------------------------------
 * Tout le reste d'Opus trie du plus récent au plus ancien, et c'est juste
 * partout ailleurs : un fil montre ce qui vient d'arriver. **Ici ce serait
 * un contresens** — on ne raconte pas une toiture en commençant par les
 * tuiles. C'est le seul écran du projet qui remonte le temps à l'endroit.
 *
 * CE QU'IL NE FAIT PAS ENCORE, ET QUI EST PRÉVU
 * ----------------------------------------------
 * Le bloc du haut porte une place vide pour **l'histoire écrite par
 * l'IA** : « Nous avons commencé par déposer l'ancienne couverture… »,
 * assemblée à partir des textes ci-dessous. C'est le lot suivant, et il
 * ne pouvait pas venir avant celui-ci : il n'y avait rien à raconter tant
 * que les publications n'étaient pas cousues ensemble.
 *
 * La place est laissée VIDE et non remplie d'un texte provisoire : un faux
 * résumé serait exactement ce que ce projet refuse — une promesse que rien
 * ne tient.
 *
 * ET LES TEXTES DE L'ARTISAN RESTENT SOUS CHAQUE PHOTO, quoi qu'il arrive.
 * Le jour où l'IA écrira l'introduction, elle n'effacera pas ses mots :
 * « dépose de la couverture » est le vocabulaire qui prouve qu'il est du
 * métier, et c'est ce qu'un autre artisan vient lire.
 */
import React from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, GOUTTIERE, CARTE, interligne, viser, APPUI,
} from '../theme';
import { BtnMini, EmptyState, SectionLabel } from '../components/ui';
import Media from '../components/Media';
import Carrousel from '../components/Carrousel';
import { ArrowLeft, Layers } from '../components/icons';
import { porteUnVisuel } from '../lib/formats-publication';
import { joursEntre } from '../lib/formats';

/**
 * « Six jours » est plus parlant que « du 28/09 au 04/10 ».
 *
 * Une durée est la preuve la plus concrète qu'un travail a été fait, et
 * elle ne coûte rien : les dates sont déjà là. Le calcul vit dans
 * `src/lib/formats.js`, qui n'importe rien — c'est lui qui est éprouvé
 * par le contrôle, pas cet écran.
 */
function dureeLisible(debut, fin) {
  if (!debut || !fin) return null;
  const jours = joursEntre(String(debut).slice(0, 10), String(fin).slice(0, 10));
  if (jours === null) return null;
  if (jours <= 0) return 'en une journée';
  if (jours === 1) return 'en 2 jours';
  return `en ${jours + 1} jours`;
}

export default function ChantierScreen({
  chantier, publications = [], pro, chargement = false,
  estLeMien = false, onRetour, onBasculerStatut, onOuvrirPublication,
}) {
  if (!chantier) return null;

  const duree = dureeLisible(chantier.debut, chantier.fin);
  const enCours = chantier.statut === 'en_cours';

  const entete = (
    <View>
      <View style={s.entete}>
        <View style={s.titreLigne}>
          <Layers size={16} color={C.accentTexte} />
          <Text style={s.titre}>{chantier.titre}</Text>
        </View>

        <Text style={s.sousTitre}>
          {[
            pro ? pro.entreprise : null,
            chantier.ville,
            chantier.nbPublications > 0
              ? `${chantier.nbPublications} publication${chantier.nbPublications > 1 ? 's' : ''}`
              : null,
            duree,
          ].filter(Boolean).join(' · ')}
        </Text>

        {enCours && (
          <View style={s.pastille}>
            <Text style={s.pastilleTexte}>Chantier en cours</Text>
          </View>
        )}
      </View>

      {/* LA PLACE DE L'HISTOIRE ÉCRITE. Elle n'apparaît qu'à l'artisan,
          et seulement pour dire ce qui arrive — personne d'autre n'a
          besoin de savoir qu'une fonctionnalité manque. */}
      {estLeMien && publications.length >= 3 && (
        <View style={s.aVenir}>
          <Text style={s.aVenirTitre}>Bientôt : le récit de ce chantier</Text>
          <Text style={s.aVenirTexte}>
            Opus pourra assembler vos {publications.length} étapes en un texte
            que vos clients liront d&apos;un coup — à partir de vos mots, jamais
            en inventant. Plus vous décrivez en publiant, meilleur il sera.
          </Text>
        </View>
      )}

      <SectionLabel>Les étapes</SectionLabel>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={s.barre}>
        <Pressable
          onPress={onRetour}
          hitSlop={viser(40)}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <ArrowLeft size={18} color={C.ink} />
        </Pressable>
        <Text style={s.barreTitre} numberOfLines={1}>{chantier.titre}</Text>
        {/* UN SEUL bouton, qui bascule. Un chantier terminé par erreur
            n'avait aucun chemin de retour : le bouton disparaissait, et
            rien ne disait comment le rouvrir. Une action irréversible
            qu'on atteint d'un seul appui doit pouvoir se défaire. */}
        {estLeMien && !!onBasculerStatut && (
          <BtnMini
            outline
            label={enCours ? 'Terminer' : 'Rouvrir'}
            onPress={() => onBasculerStatut(chantier)}
          />
        )}
      </View>

      <FlatList
        data={publications}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={entete}
        contentContainerStyle={s.liste}
        ItemSeparatorComponent={() => <View style={{ height: S.md }} />}
        ListEmptyComponent={chargement ? null : (
          <EmptyState icone={Layers} titre="Ce chantier est vide">
            Publiez une photo en la rattachant à ce chantier, et elle
            apparaîtra ici.
          </EmptyState>
        )}
        /* Mêmes réglages que les autres listes du projet : une liste longue
           ne monte pas dix éléments d'un coup (voir CLAUDE.md). */
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
        renderItem={({ item: p, index }) => (
          <Etape
            post={p}
            rang={index + 1}
            total={publications.length}
            onOuvrir={onOuvrirPublication ? () => onOuvrirPublication(p) : null}
          />
        )}
      />
    </View>
  );
}

/**
 * UNE ÉTAPE : le texte PUIS la photo, et pas l'inverse.
 *
 * C'est ce qui fait descendre — on lit deux lignes, on voit la photo de ce
 * moment-là, on continue. Une galerie suivie d'un pavé de texte se regarde
 * puis s'abandonne.
 */
const Etape = React.memo(function Etape({ post, rang, total, onOuvrir }) {
  const photos = (post.medias && post.medias.length)
    ? post.medias
    : (post.media ? [post.media] : []);
  const aUnVisuel = porteUnVisuel(post.format) && photos.length > 0;

  const contenu = (
    <View style={s.etape}>
      <View style={s.rangLigne}>
        <Text style={s.rang}>{rang} / {total}</Text>
        <Text style={s.quand}>{post.time}</Text>
      </View>
      {!!post.texte && <Text style={s.texte}>{post.texte}</Text>}
      {aUnVisuel && (
        photos.length > 1
          ? <Carrousel medias={photos} />
          : <Media media={photos[0]} style={s.photo} />
      )}
    </View>
  );

  if (!onOuvrir) return contenu;
  return (
    <Pressable
      onPress={onOuvrir}
      accessibilityRole="button"
      accessibilityLabel={`Étape ${rang} sur ${total} : ${post.texte || 'sans description'}`}
      style={({ pressed }) => [pressed && APPUI.discret]}
    >
      {contenu}
    </Pressable>
  );
});

const s = StyleSheet.create({
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: GOUTTIERE, paddingVertical: S.sm,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  retour: { padding: S.xs },
  barreTitre: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },

  /* `contentContainerStyle`, pas `style` — voir GOUTTIERE dans theme.js. */
  liste: { paddingHorizontal: GOUTTIERE, paddingTop: S.md, paddingBottom: S.xxl },

  entete: { marginBottom: S.sm },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  titre: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.titre, color: C.ink },
  sousTitre: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    marginTop: S.xs, lineHeight: interligne(T.courant),
  },
  pastille: {
    alignSelf: 'flex-start', marginTop: S.sm,
    backgroundColor: C.accent, borderRadius: R.gelule,
    paddingVertical: S.xs, paddingHorizontal: S.sm,
  },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: C.surAccent },

  aVenir: {
    ...CARTE, padding: S.md, marginTop: S.md,
    borderLeftWidth: 3, borderLeftColor: C.accent2,
  },
  aVenirTitre: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2 },
  aVenirTexte: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    marginTop: S.xs, lineHeight: interligne(T.petit),
  },

  etape: { ...CARTE, overflow: 'hidden' },
  rangLigne: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.md, paddingTop: S.md,
  },
  rang: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accentTexte },
  quand: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },
  texte: {
    fontFamily: F.inter, fontSize: T.corps, color: C.ink,
    paddingHorizontal: S.md, paddingVertical: S.sm,
    lineHeight: interligne(T.corps),
  },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: C.line },
});
