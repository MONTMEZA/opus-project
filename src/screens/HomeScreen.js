/**
 * 2. Accueil — bascule "Fil" / "Vidéos" et sous-onglets "Pour vous" / "Abonnements".
 * (.home-wrap du prototype)
 *
 * En mode "Vidéos", les diapositives occupent toute la hauteur de l'écran et
 * la bascule Fil/Vidéos flotte par-dessus, comme sur TikTok.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  C, F, T, S, GOUTTIERE, TOUCHE, R,
} from '../theme';
import { PillToggle, EmptyState } from '../components/ui';
import PostCard from '../components/PostCard';
import VideoSlide from '../components/VideoSlide';
import { Search, X } from '../components/icons';
import useCompteurDeVues from '../lib/compteur-vues';
import { vuesPossibles } from '../lib/vues';
import { CLAVIER } from '../lib/clavier';
import { FORMATS_VIDEO } from '../lib/formats-publication';
import CompteurImages, { MESURE_ACTIVE } from '../components/CompteurImages';

const MODES = [{ key: 'classic', label: 'Fil' }, { key: 'video', label: 'Vidéos' }];

/* Combien de temps sans le moindre défilement avant de dire « au repos ».
   Assez pour qu'un élan soit vraiment fini, assez peu pour qu'une vidéo
   arrêtée sous les yeux démarre sans qu'on attende. */
const ATTENTE_REPOS = 200;

/**
 * Le bas du fil : il dit toujours quelque chose.
 *
 * Trois états, et chacun répond à une question que l'utilisateur se pose
 * vraiment en arrivant en bas : « ça charge ? », « c'est tout ? », ou rien
 * du tout quand le fil est vide — l'écran a déjà son message à lui.
 */
function BasDuFil({ chargement, fin, vide }) {
  if (vide) return null;
  if (chargement) {
    return (
      <View style={s.bas}>
        <ActivityIndicator size="small" color={C.muted} />
        <Text style={s.basTexte}>Chargement…</Text>
      </View>
    );
  }
  if (fin) {
    return (
      <View style={s.bas}>
        <Text style={s.basTexte}>Vous êtes à jour.</Text>
      </View>
    );
  }
  return <View style={{ height: 20 }} />;
}
/**
 * LA LIGNE QUI DIT CE QUI EST FILTRÉ.
 *
 * Le propriétaire ne voulait pas de rangée de pastilles sur le fil, et il a
 * raison : c'est le seul écran d'Opus où l'on vient pour REGARDER. Mais un
 * filtre DUR qui ne se voit pas est un piège — on cherche ensuite pendant
 * cinq minutes pourquoi « il n'y a rien ». C'est la règle du 04/10 : un
 * filtre qu'on ne voit pas est un filtre qu'on oublie d'enlever.
 *
 * D'où une seule ligne, qui n'existe QUE quand un filtre est posé : elle
 * NOMME le réglage (« Maçon · 20 km autour de Lambesc (13) »), elle ouvre
 * la feuille si on la touche, et sa croix l'enlève. Trois gestes en 44 px
 * de haut, et rien du tout le reste du temps.
 */
function RappelFiltre({ resume, onOuvrir, onEffacer }) {
  if (!resume) return null;
  return (
    <View style={s.rappelFiltre}>
      <Pressable
        onPress={onOuvrir}
        style={({ pressed }) => [s.rappelTouche, pressed && s.rappelPressee]}
        accessibilityRole="button"
        accessibilityLabel={`Filtre : ${resume}. Modifier`}
      >
        <Search size={14} color={C.accentTexte} />
        <Text style={s.rappelTexte} numberOfLines={1}>{resume}</Text>
      </Pressable>
      <Pressable
        onPress={onEffacer}
        style={({ pressed }) => [s.rappelCroix, pressed && s.rappelPressee]}
        accessibilityRole="button"
        accessibilityLabel="Enlever le filtre"
      >
        <X size={16} color={C.accentTexte} />
      </Pressable>
    </View>
  );
}

const TABS = [
  { key: 'pourvous', label: 'Pour vous' },
  { key: 'abonnements', label: 'Abonnements' },
];

/* L'ESPACE ENTRE DEUX CARTES VIT DANS LA CELLULE — 17/10/2026.
   Il était un `gap` du conteneur de la liste. Or la liste mesure chaque
   cellule par son `onLayout` : un `gap` laisse donc des TROUS de 10 pt
   entre deux cellules mesurées. Quand un bord de la fenêtre de rendu
   tombe dans un trou, il ne correspond à aucune carte, et la fenêtre
   retombe sur la première ou la dernière (VirtualizeUtils.js, rejoué avec
   le vrai code de React Native 0.86) : des cartes lointaines montées puis
   démontées pendant l'élan, et au repos une fenêtre qui court jusqu'au
   bout de la liste pour tout démonter d'un coup au geste suivant.

   Un séparateur, lui, est dessiné DANS la cellule mesurée : plus de trou.
   Déclaré ici, hors du composant : une fonction fléchée passée en prop
   serait un TYPE neuf à chaque rendu, et React remonterait les vingt
   séparateurs. */
function Intervalle() {
  return <View style={s.intervalle} />;
}

export default function HomeScreen({
  posts, pros, feedMode, setFeedMode, feedTab, setFeedTab,
  followingIds, savedIds, openCommentsId, openContactId, commentaireCible = null,
  bottomInset = 0, rappel,
  videoCible,
  onLike, onFollow, onView, onHide, onToggleComments, onAddComment,
  onSave, onToggleContact, onContact, onShare, onComment, onVoirCommentateur,
  onOuvrirVideo, onVoirDepuisVideo, onSignaler,
  onChargerPlus, chargePage = false, finDuFil = false,
  resumeFiltre = '', onEffacerFiltre, onOuvrirFiltre,
  rafraichit = false, onRafraichir, onSupprimerCommentaire, onModifierCommentaire, moiId,
  onVues, chantiers = {}, onOuvrirChantier,
}) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /* Une seule vidéo joue à la fois : en laisser tourner cinq en arrière-plan
     vide la batterie et sature les décodeurs du téléphone. */
  const [slideActive, setSlideActive] = useState(0);

  /* Dans le fil classique, la vidéo se lance quand la carte arrive à l'écran,
     et s'arrête quand elle en sort. Le son reste coupé : une vidéo qui parle
     toute seule pendant qu'on fait défiler est insupportable — Instagram et
     Facebook font pareil, le son ne vient qu'en plein écran. */
  /* Quand on arrive depuis une vidéo touchée dans le fil, le plein écran
     s'ouvre directement sur elle plutôt qu'au début de la liste. */
  const indexCible = videoCible
    ? Math.max(0, posts.findIndex((p) => p.id === videoCible))
    : 0;

  useEffect(() => {
    if (feedMode === 'video') setSlideActive(indexCible);
  }, [feedMode, indexCible]);

  /* CE QUI EST À L'ÉCRAN NE REDESSINE PLUS LE FIL — 15/10/2026.
     L'ensemble visible était un ÉTAT : chaque carte qui franchissait le
     seuil de 65 % — vingt fois pour douze gestes — redessinait cet écran,
     puis la liste, qui refabrique alors chacune de ses cellules, et la
     carte qui entrait ou sortait en entier, photo comprise. C'était le
     premier poste de rendu mesuré pendant un défilement (76 ms par commit
     en développement, processeur bridé quatre fois), et il retardait le
     montage des cartes suivantes.

     Or une seule chose à l'écran en dépend : QUELLE VIDÉO JOUE. L'ensemble
     complet vit donc dans une référence, qui sert aux vues ; seules les
     VIDÉOS visibles restent un état, et on ne l'écrit que quand elles
     changent. Faire défiler des photos ne redessine plus rien ici. */
  const visibles = useRef(new Set());
  const [videosVisibles, setVideosVisibles] = useState(() => new Set());

  /* LE COMPTEUR D'ARRÊTS — 17/10/2026. Il monte chaque fois que le fil
     s'immobilise, et seulement là. Une carte vidéo le reçoit, et son lecteur
     ne naît qu'au premier arrêt qui suit son montage (Media.js) : jamais
     pendant un élan, où un contrôleur de lecture d'iOS créé sur le fil
     principal fait saccader le défilement.

     « S'immobiliser » se mesure en attendant que les événements de
     défilement CESSENT, et pas sur une « fin d'élan » : c'est la leçon de
     `PagesGlissantes` (04/10). Un glissement lent finit sans élan, et le
     navigateur n'en émet aucune à la molette ; une attente remise à zéro à
     chaque `onScroll`, elle, marche partout.

     Et le minuteur part aussi quand la LISTE change sous un fil immobile
     (ouverture, rafraîchissement, retour du fil Vidéos) : sinon une vidéo
     visible dès l'ouverture attendrait qu'on fasse défiler pour naître. */
  const [repos, setRepos] = useState(0);
  const minuteurRepos = useRef(null);
  const armerRepos = useCallback(() => {
    if (minuteurRepos.current) clearTimeout(minuteurRepos.current);
    minuteurRepos.current = setTimeout(() => {
      minuteurRepos.current = null;
      setRepos((n) => n + 1);
    }, ATTENTE_REPOS);
  }, []);
  useEffect(() => { armerRepos(); }, [posts, feedMode, armerRepos]);
  useEffect(() => () => {
    if (minuteurRepos.current) clearTimeout(minuteurRepos.current);
  }, []);
  const cleVideos = useRef('');
  const reglesVisibilite = useRef({ itemVisiblePercentThreshold: 65 });

  /* LE DÉFILEMENT JUSQU'À LA PUBLICATION VISÉE A ÉTÉ RETIRÉ le 07/10.
     Il a été tenté deux fois et a échoué deux fois sur l'iPhone, pour une
     raison de fond : `scrollToIndex` ne sait pas sauter à une carte qui
     n'est pas montée, et ce fil n'en monte que deux au départ. Une
     notification ouvre désormais `PublicationScreen` — la publication
     seule sur sa page —, donc il n'y a plus rien à chercher dans le fil.
     Son en-tête porte le raisonnement complet.

     Et on ne garde pas le code « au cas où » : une fonction que personne
     n'appelle est le « bouton §18 », du code qui a l'air de servir. */

  /* LES VUES (section 35). `signaler` n'écrit QUE dans une référence : on
     est appelé plusieurs fois par seconde pendant qu'on fait défiler, et
     poser un état ici redessinerait le fil à chaque fois. C'est le calcul
     de `src/lib/vues.js` qui décide ensuite ce qui a vraiment été regardé —
     une publication traversée en descendant n'est pas une vue. */
  const signalerVues = useCompteurDeVues({ envoyer: onVues, actif: !!onVues });

  /* `surVisibilite` est une RÉFÉRENCE figée au premier rendu — une
     `FlatList` refuse qu'on change `onViewableItemsChanged` en cours de
     route. Elle ne voit donc ni la liste, ni qui je suis, ni le mode : elle
     les lit ici, dans une référence qu'on tient à jour.

     Elle part des valeurs du premier rendu, pour qu'un rappel arrivé avant
     le premier effet lise déjà la vraie liste. Elle est récrite ensuite
     dans un EFFET, jamais pendant le rendu : le linter de React le refuse,
     et il a raison — deux rendus ne doivent pas laisser deux valeurs
     différentes. */
  const lecture = useRef({ posts, moiId, feedMode, signalerVues });

  /* LA SEULE ÉCRITURE de « ce qui est à l'écran peut compter une vue ».
     Le rappel la lance quand l'écran change, l'effet ci-dessous quand la
     LISTE change sous un écran immobile — une page qui arrive, un retour
     du fil Vidéos. Deux formules pour la même vérité finiraient par se
     contredire : c'est la leçon des voyants du 04/10.

     Rien ici ne redessine : `signalerVues` n'écrit que dans une référence
     (`compteur-vues.js`), et c'est le calcul de `vues.js` qui décide
     ensuite ce qui a vraiment été regardé. */
  const signalerCeQuiEstAffiche = useRef(() => {
    const {
      posts, moiId, feedMode, signalerVues,
    } = lecture.current;
    if (feedMode === 'video') return;
    signalerVues(vuesPossibles(posts.filter((p) => visibles.current.has(p.id)), moiId));
  });

  const surVisibilite = useRef(({ viewableItems }) => {
    visibles.current = new Set(viewableItems.map((v) => v.item.id));
    signalerCeQuiEstAffiche.current();

    /* L'état, seulement quand les VIDÉOS à l'écran changent — et aucun
       `setState` sinon : un nouvel ensemble est un nouvel objet pour React,
       même s'il contient les mêmes vidéos, et il redessinerait à chaque
       fois. On compare donc une CLÉ, qui suit l'ordre de la liste : la même
       composition donne toujours la même. */
    const videos = viewableItems
      .filter((v) => FORMATS_VIDEO.has(v.item.format))
      .map((v) => v.item.id);
    const cle = videos.join('|');
    if (cle === cleVideos.current) return;
    cleVideos.current = cle;
    setVideosVisibles(new Set(videos));
  });

  useEffect(() => {
    lecture.current = {
      posts, moiId, feedMode, signalerVues,
    };
    signalerCeQuiEstAffiche.current();
  }, [posts, moiId, feedMode, signalerVues]);

  /* LE FIL VIDÉO N'A PAS D'ENSEMBLE VISIBLE : il n'y a qu'une diapositive à
     l'écran, et c'est `slideActive`. Une vidéo qu'on laisse tourner une
     seconde est bien plus sûrement « vue » qu'une carte aperçue en
     descendant. */
  useEffect(() => {
    if (feedMode !== 'video') return;
    const courant = posts[slideActive];
    signalerVues(courant ? vuesPossibles([courant], moiId) : []);
  }, [feedMode, slideActive, posts, moiId, signalerVues]);

  /* ---------- mode vidéo : plein écran ---------- */
  if (feedMode === 'video') {
    return (
      <View style={s.videoWrap}>
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={indexCible}
          snapToInterval={windowHeight}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: windowHeight, offset: windowHeight * index, index,
          })}
          onMomentumScrollEnd={(e) => {
            setSlideActive(Math.round(e.nativeEvent.contentOffset.y / windowHeight));
          }}
          /* CE QUI FIGEAIT L'APPLICATION AU DÉMARRAGE
             -----------------------------------------
             Sans ces trois réglages, une FlatList monte DIX éléments d'un
             coup. Ici, dix diapositives plein écran — et chacune crée un
             lecteur vidéo qui se met à télécharger aussitôt (voir le
             commentaire de VideoMedia : le lecteur charge dès le montage,
             même en pause). Dix vidéos qui démarrent ensemble, sur un
             téléphone : l'écran répond aux appuis, mais le défilement reste
             bloqué plusieurs secondes. C'est exactement ce qui a été
             constaté le 29/09/2026 sur iPhone.

             `windowSize` 3 = la précédente, celle qu'on regarde, la
             suivante. C'est ce qu'il faut pour qu'un fil façon TikTok
             enchaîne sans attendre — et pas une de plus. */
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          ListEmptyComponent={
            <View style={[s.videoVide, { height: windowHeight }]}>
              <Text style={s.videoVideTexte}>
                Aucune vidéo pour le moment.
              </Text>
              <Text style={s.videoVideDetail}>
                Les photos et les publications texte restent dans l'onglet « Fil ».
              </Text>
            </View>
          }
          renderItem={({ item: p, index }) => (
            <VideoSlide
              post={p}
              actif={index === slideActive}
              onGlisserVersProfil={(pro) => onVoirDepuisVideo(pro.id)}
              onGlisserVersFil={() => setFeedMode('classic')}
              pro={p.proId ? pros[p.proId] : null}
              following={p.proId ? followingIds.has(p.proId) : false}
              saved={savedIds.has(p.id)}
              height={windowHeight}
              bottomInset={bottomInset}
              onLike={onLike}
              onFollow={onFollow}
              onSave={onSave}
              /* Le MÊME chemin que le glissement, et c'est voulu : qu'on
                 appuie sur le nom de l'artisan ou qu'on pousse la vidéo de
                 côté, on arrive de la même page — donc le geste de retour
                 doit marcher dans les deux cas. */
              onView={onVoirDepuisVideo}
              onShare={onShare}
              onContact={onContact}
              onComment={onComment}
            />
          )}
        />

        {/* bascule flottante par-dessus la vidéo */}
        <View style={[s.floatingToggle, { top: insets.top + 10 }]}>
          <PillToggle value={feedMode} onChange={setFeedMode} options={MODES} />
        </View>
      </View>
    );
  }

  /* ---------- mode fil classique ---------- */
  return (
    <View style={s.wrap}>
      <View style={s.modeRow}>
        <PillToggle value={feedMode} onChange={setFeedMode} options={MODES} />
        <PillToggle small value={feedTab} onChange={setFeedTab} options={TABS} />
      </View>

      <RappelFiltre
        resume={resumeFiltre}
        onOuvrir={onOuvrirFiltre}
        onEffacer={onEffacerFiltre}
      />

      <View style={{ flex: 1 }}>
        {/* L'instrument du diagnostic des saccades : absent de toute
            version qui n'a pas `EXPO_PUBLIC_MESURE_FIL` (CompteurImages.js). */}
        {MESURE_ACTIVE && <CompteurImages />}
        <FlatList
          {...CLAVIER}
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={s.classicContent}
          ItemSeparatorComponent={Intervalle}
          ListHeaderComponent={rappel || null}
          /* Les deux bords que le `gap` donnait aussi : sous l'en-tête et
             au-dessus du pied. Le séparateur ne passe qu'ENTRE deux cartes. */
          ListHeaderComponentStyle={s.enteteListe}
          ListFooterComponentStyle={s.piedListe}
          /* UN MESSAGE DE LISTE VIDE QUI DONNE TORT À L'APPLICATION.
             Celui d'avant disait « Suis des professionnels pour voir leurs
             publications ici » — y compris dans « Pour vous », où il n'y
             avait rien à suivre, et désormais y compris avec un filtre qui
             écarte tout. On en conclut qu'Opus est désert, et on n'y revient
             pas. C'est le défaut trouvé le 04/10 sur la Place des pros, à
             l'identique.

             Et il NOMME le filtre, parce qu'un filtre dur qui ne dit pas
             qu'il filtre est un piège. Avec plusieurs réglages posés, on
             reste général : « un message précis et faux est pire qu'un
             message général et juste ». */
          ListEmptyComponent={
            resumeFiltre ? (
              <EmptyState
                titre="Rien avec ce filtre"
                action={onEffacerFiltre ? { label: 'Tout voir', onPress: onEffacerFiltre } : null}
              >
                {`Aucune publication pour « ${resumeFiltre} ». Élargissez le rayon, `
                 + 'changez de métier, ou enlevez le filtre.'}
              </EmptyState>
            ) : feedTab === 'abonnements' ? (
              <EmptyState>
                Vous ne suivez personne pour l’instant. Abonnez-vous à des
                artisans pour retrouver leurs publications ici.
              </EmptyState>
            ) : (
              <EmptyState>Aucune publication pour le moment.</EmptyState>
            )
          }
          viewabilityConfig={reglesVisibilite.current}
          onViewableItemsChanged={surVisibilite.current}
          /* La page suivante arrive quand il reste la moitié d'un écran à
             défiler : assez tôt pour qu'elle soit là avant qu'on y soit,
             assez tard pour ne pas charger ce que personne ne lira. */
          onEndReached={onChargerPlus}
          onEndReachedThreshold={0.5}
          onScroll={armerRepos}
          onMomentumScrollEnd={armerRepos}
          /* Même raison que pour le fil vidéo : par défaut, dix cartes se
             montaient ensemble — mesuré à 5,8 écrans de contenu au premier
             affichage, photos comprises. On en monte deux au départ.

             UNE PAR UNE ENSUITE — 17/10/2026. Elles se montaient trois par
             trois, toutes les 80 ms. Or un montage s'exécute en UN bloc sur
             le fil principal du téléphone (RCTMountingManager.mm), celui qui
             anime aussi l'élan : trois cartes dans le même bloc, c'est trois
             fois le travail dans la même image, et l'élan saccade. Mesuré au
             navigateur ce jour-là : 11 à 14 cartes montées PENDANT chaque
             élan vers le bas. Une par bloc, toutes les 50 ms (la valeur par
             défaut), cela fait encore 20 cartes par seconde — plus qu'un
             lancer n'en traverse.

             `windowSize` RESTE À 5, et c'est voulu : depuis le même jour,
             une photo du fil garde son image ENTIÈRE (`pleineResolution`,
             voir Media.js). Une fenêtre plus large tiendrait davantage de
             ces images en mémoire, sans réduire le nombre de montages sur un
             fil long : chaque carte franchie en monte une devant et en
             démonte une derrière.

             Et `removeClippedSubviews` reste FAUX, écrit en toutes lettres :
             il ne retire aucun montage, il ajoute des détachements de vues
             sur le fil principal à chaque déplacement. */
          initialNumToRender={2}
          maxToRenderPerBatch={1}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          removeClippedSubviews={false}
          refreshControl={onRafraichir ? (
            <RefreshControl
              refreshing={rafraichit}
              onRefresh={onRafraichir}
              tintColor={C.muted}
              colors={[C.accent]}
            />
          ) : undefined}
          ListFooterComponent={<BasDuFil chargement={chargePage} fin={finDuFil} vide={posts.length === 0} />}
          renderItem={({ item: p }) => (
            <PostCard
              post={p}
              /* `actif` ne sert qu'à une VIDÉO : jouer quand elle est à
                 l'écran, s'arrêter quand elle en sort. Le passer à une
                 photo faisait céder la mémorisation de sa carte à chaque
                 franchissement de seuil — elle se redessinait en entier,
                 double-appui compris, pour rien. */
              actif={videosVisibles.has(p.id)}
              /* Le compteur d'arrêts aux seules cartes VIDÉO : passé à une
                 photo, il ferait céder sa mémorisation à chaque arrêt du
                 fil. Même raison que `actif` juste au-dessus. */
              repos={FORMATS_VIDEO.has(p.format) ? repos : undefined}
              onOuvrirVideo={onOuvrirVideo}
              pro={p.proId ? pros[p.proId] : null}
              pros={pros}
              onVoirCommentateur={onVoirCommentateur}
              following={p.proId ? followingIds.has(p.proId) : false}
              onLike={onLike}
              onFollow={onFollow}
              onView={onView}
              onHide={onHide}
              onSignaler={onSignaler}
              onSupprimerCommentaire={onSupprimerCommentaire}
              onModifierCommentaire={onModifierCommentaire}
              moiId={moiId}
              /* LE CHANTIER DE CETTE CARTE, ou `null`. On passe l'OBJET et
                 pas le dictionnaire : `PostCard` est mémorisée, et lui
                 donner le dictionnaire entier la ferait redessiner pour
                 toutes les cartes dès qu'un chantier arrive. C'est le piège
                 du lot 4 avec `jyAiRepondu`, à l'identique. */
              chantier={p.chantierId ? chantiers[p.chantierId] || null : null}
              onOuvrirChantier={onOuvrirChantier}
              commentsOpen={openCommentsId === p.id}
              /* `PostCard` est MÉMORISÉE : on ne lui passe la cible que
                 pour la publication concernée, sinon les vingt cartes se
                 redessineraient à chaque notification touchée. C'est le
                 piège du lot 4 avec `jyAiRepondu`. */
              commentaireCible={openCommentsId === p.id ? commentaireCible : null}
              onToggleComments={onToggleComments}
              onAddComment={onAddComment}
              saved={savedIds.has(p.id)}
              onSave={onSave}
              contactOpen={openContactId === p.id}
              onToggleContact={onToggleContact}
              onContact={onContact}
              onShare={onShare}
            />
          )}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* ANGLE VIF : cette ligne est de la STRUCTURE — elle PORTE l'information
     « voilà ce que vous regardez », elle ne flotte pas. Les deux zones
     appuyables qu'elle contient, elles, sont arrondies. */
  rappelFiltre: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: GOUTTIERE, marginBottom: S.sm,
    backgroundColor: C.accentBg,
    borderWidth: 1, borderColor: C.accentTexte,
  },
  rappelTouche: {
    flex: 1, minWidth: 0, minHeight: TOUCHE,
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.md,
  },
  /* `flex: 1, minWidth: 0` sur la zone de texte : sans lui, un long résumé
     POUSSE la croix hors de l'écran au lieu de se couper. Leçon du lot 5. */
  rappelTexte: {
    flex: 1, minWidth: 0,
    fontFamily: F.oswald6, fontSize: T.petit, color: C.ink,
  },
  /* 44 points, et une boîte pleine : c'est la sortie de secours d'un filtre
     dur, elle ne doit pas se rater. */
  rappelCroix: {
    width: TOUCHE, height: TOUCHE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule,
  },
  rappelPressee: { opacity: 0.7 },

  bas: { alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 8 },
  basTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  wrap: { flex: 1 },
  videoWrap: { flex: 1, backgroundColor: C.dark },
  videoVide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 8 },
  videoVideTexte: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: '#fff', textAlign: 'center' },
  videoVideDetail: {
    fontFamily: F.inter, fontSize: T.courant, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 18,
  },
  floatingToggle: { position: 'absolute', left: 14, zIndex: 5 },
  modeRow: {
    gap: 8, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  /* LA MÊME gouttière que partout ailleurs : le Fil posait ses cartes à
     12 px du bord et les autres écrans à 16 (32 par le défaut doublé).
     On changeait d'onglet et le contenu sautait de côté. */
  classicContent: {
    paddingTop: S.md, paddingHorizontal: GOUTTIERE, paddingBottom: S.lg,
  },
  /* Les 10 pt qu'apportait le `gap`, au même endroit au pixel près :
     entre deux cartes, sous l'en-tête, au-dessus du pied. */
  intervalle: { height: S.md - 2 },
  enteteListe: { marginBottom: S.md - 2 },
  piedListe: { marginTop: S.md - 2 },
});
