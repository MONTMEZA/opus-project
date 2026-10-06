/**
 * Carte publication du fil classique (.post-card du prototype).
 * Gère aussi les publications sponsorisées (.ad-card).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, SH, interligne, APPUI, viser, TOUCHE, CARTE,
} from '../theme';
import {
  Gradient, AvatarSuivre, BtnMain, BtnMini, IconBtn,
} from './ui';
import Commentaires, { nbCommentairesDe } from './Commentaires';
import { nomMetier } from '../lib/metiers';
import {
  BadgeCheck, EyeOff, Heart, MessageSquare, Share2, Bookmark,
  MessageCircle, Phone, FileText, User, Maximize, Flag, Lightbulb, Volume2, Layers,
} from './icons';
import { LinearGradient } from 'expo-linear-gradient';
import Media, { EtiquetteVideo } from './Media';
import Carrousel from './Carrousel';
import DoubleAppui from './DoubleAppui';
import { porteUnVisuel } from '../lib/formats-publication';

/** Les formats qui se regardent aussi en plein écran dans le fil « Vidéos ». */
const EST_VIDEO = new Set(['video', 'montage']);

/* Ce que la barre d'actions occupe en bas de la photo. Les points du
   carrousel s'en écartent d'autant. */
const HAUTEUR_BARRE = 56;

/* MÉMORISÉ : ce composant vit dans une liste, et une liste redessine
   chacune de ses lignes visibles dès que l'écran bouge — même celles qui
   n'ont pas changé d'un pixel. */
const PostCard = React.memo(function PostCard({
  post, pro, pros = {}, following, actif = false,
  chantier = null, onOuvrirChantier,
  onLike, onFollow, onView, onHide, onOuvrirVideo, onSignaler,
  commentsOpen, onToggleComments, onAddComment, onVoirCommentateur,
  saved, onSave, contactOpen, onToggleContact, onContact, onShare,
  onSupprimerCommentaire, onModifierCommentaire, moiId,
}) {

  const estVideo = EST_VIDEO.has(post.format);

  /* Les photos de la publication. `medias` porte la série complète ; `media`
     reste la première, gardée pour les anciennes publications et pour les
     aperçus (notifications, partage) qui n'attendent qu'une image. */
  const photos = (post.medias && post.medias.length)
    ? post.medias
    : (post.media ? [post.media] : []);

  /* UNE PUBLICATION SANS VISUEL — le format « Texte », gardé à la demande du
     propriétaire le 05/10/2026. Il existait depuis le premier jour et
     personne ne s'en était jamais servi (zéro ligne sur seize), donc
     personne n'avait vu ce qu'il donnait : `media` étant vide, la carte
     affichait un carré de dégradé VIDE, avec la barre d'actions posée
     dessus. Un bloc de couleur au milieu d'un fil de chantiers.

     Sans visuel, la barre redescend donc sous le texte, en encre sombre :
     elle n'a plus de photo sur laquelle se poser, donc plus de voile pour
     la rendre lisible.

     ET C'EST LE FORMAT QUI TRANCHE, pas le contenu de `media` : une
     publication sans visuel recevait un DÉGRADÉ de couverture, donc un
     `media` non vide, donc un cadre d'image vide. Les publications de
     démonstration, elles, portent de vrais dégradés comme photos : on ne
     peut donc pas trancher sur « est-ce un vrai fichier ». */
  const sansVisuel = !estVideo && (!porteUnVisuel(post.format) || photos.length === 0);

  /* L'encre des commandes dépend de CE QU'IL Y A DERRIÈRE. Sur une photo,
     blanc sur le voile ; sur le fond clair de la carte, l'encre sombre. Un
     blanc sur blanc ne lève aucune erreur et ne se voit qu'à l'écran. */
  const encre = sansVisuel ? C.ink : C.surface;

  /* L'ÉTIQUETTE, pas le format (section 34). Un conseil peut être une
     vidéo, une photo, un avant/après ou du texte : il se repère à ce
     bandeau, où qu'il soit. */
  const estConseil = !!post.conseil;

  /* --- publication sponsorisée --- */
  if (post.type === 'ad') {
    return (
      <View style={s.card}>
        <Gradient media={post.media} style={{ width: '100%', height: 140 }} />
        <View style={s.adTag}><Text style={s.adTagText}>Sponsorisé</Text></View>
        <View>
          <Text style={s.adAnnonceur}>{post.annonceur}</Text>
          <Text style={s.postText}>{post.accroche}</Text>
          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            {/* Une PUBLICITÉ ne porte pas la couleur des actions d'Opus :
                sinon on ne distingue plus ce que propose l'application de
                ce que propose quelqu'un qui a payé pour être là. */}
            <BtnMain
              block
              ton="sombre"
              label={post.cta}
              onPress={() => onShare(`Ouverture de "${post.annonceur}" (simulation).`)}
            />
          </View>
        </View>
      </View>
    );
  }

  if (!pro) return null;

  return (
    <View style={s.card}>
      {/* en-tête */}
      <View style={s.head}>
        {/* « Suivre » est passé SUR la photo le 02/10/2026 : il mangeait la
            largeur de la ligne « métier · ville », coupée sur deux cartes
            sur trois. Et la photo est VOISINE du bloc du nom, pas dedans :
            deux boutons imbriqués ne s'annoncent pas. Voir `AvatarSuivre`. */}
        <AvatarSuivre
          seed={pro.id}
          uri={pro.avatarUrl}
          nom={pro.entreprise}
          suivi={following}
          onVoir={() => onView(pro.id)}
          onSuivre={onFollow ? () => onFollow(pro.id) : null}
        />
        <Pressable
          style={s.headLeft}
          onPress={() => onView(pro.id)}
          accessibilityRole="button"
          accessibilityLabel={`Voir la fiche de ${pro.entreprise}`}
        >
          {/* `flex: 1, minWidth: 0` : sans ça, le nom et la ligne de
              métier poussent la rangée au lieu de se raccourcir, et le
              bouton « Suivre » leur passe dessus. Constaté le 02/10/2026,
              en agrandissant les boutons à 40 points. */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{pro.entreprise}</Text>
              {pro.verifie && <BadgeCheck size={14} color={C.verif} />}
            </View>
            {/* L'HEURE NE SE FAIT PAS COUPER. Sur une ligne unique, c'est
                elle qui sautait la première alors que c'est la plus utile :
                un chantier publié « il y a 2 h » n'a pas le même sens que
                celui d'il y a trois semaines. La ville, elle, se raccourcit
                sans qu'on perde grand-chose. */}
            <View style={s.metaRow}>
              <Text style={s.meta} numberOfLines={1}>
                {nomMetier(pro.metier)} · {pro.ville}
              </Text>
              <Text style={[s.meta, { flexShrink: 0 }]}> · {post.time}</Text>
            </View>
          </View>
        </Pressable>
        <View style={s.headRight}>
          {/* Deux gestes distincts, et deux icônes distinctes. « Masquer »
              range la publication pour soi ; « Signaler » l'envoie à la
              modération. Les cacher tous les deux derrière un « … » ferait
              qu'on ne trouverait ni l'un ni l'autre — or les magasins
              d'applications vérifient qu'un signalement se trouve. */}
          <IconBtn
            onPress={() => onHide(post.id)}
            accessibilityLabel="Masquer cette publication"
          >
            <EyeOff size={15} color={C.ink} />
          </IconBtn>
          {!!onSignaler && (
            <IconBtn
              accessibilityLabel="Signaler cette publication"
              onPress={() => onSignaler({
                cibleType: 'publication',
                cibleId: post.id,
                auteurId: pro.id,
                auteurNom: pro.entreprise,
                extrait: post.texte,
              })}
            >
              <Flag size={14} color={C.muted} />
            </IconBtn>
          )}
        </View>
      </View>

      {/* AU-DESSUS DU TEXTE, et pas sur la photo. Un conseil se reconnaît
          avant d'être lu — c'est tout ce qu'achète l'étiquette : une photo
          de chantier vaut sa journée, un conseil vaut trois ans. Et le
          marine n'est pas l'orange : dans cette application, l'orange veut
          dire « il y a du neuf » ou « appuie ici ». Un conseil n'est ni
          l'un ni l'autre, c'est une INFORMATION. */}
      {estConseil && (
        <View style={s.conseil}>
          <Lightbulb size={12} color={C.surface} />
          <Text style={s.conseilTexte}>Conseil de pro</Text>
        </View>
      )}

      {/* LA LIGNE DU CHANTIER (section 36). Elle ne s'affiche que si le
          titre est CONNU : la publication ne porte que l'identifiant, et
          le titre vient du dictionnaire rempli par `chantiersDeCesPosts`.
          Afficher « Chantier » sans son nom ne dirait rien, et un nom
          recopié sur la publication serait faux le jour d'un renommage. */}
      {!!chantier && (
        <Pressable
          onPress={onOuvrirChantier ? () => onOuvrirChantier(chantier) : null}
          disabled={!onOuvrirChantier}
          hitSlop={viser(32)}
          accessibilityRole="button"
          accessibilityLabel={`Voir le chantier ${chantier.titre}, ${
            chantier.nbPublications} publications`}
          style={({ pressed }) => [s.chantier, pressed && APPUI.discret]}
        >
          <Layers size={12} color={C.accentTexte} />
          <Text style={s.chantierTexte} numberOfLines={1}>
            {chantier.titre}
          </Text>
          <Text style={s.chantierNombre}>
            · {chantier.nbPublications} publication{chantier.nbPublications > 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}

      <Text style={s.postText}>{post.texte}</Text>
      {/* DEUX APPUIS POUR AIMER. Le cœur s'envole même si c'était déjà
          aimé — sinon le geste a l'air de n'avoir rien fait et on
          recommence. Et il n'enlève JAMAIS : on double-appuie parfois par
          accident, et un accident ne doit pas défaire quelque chose. Pour
          retirer, le cœur de la barre du bas est là, et lui bascule. */}
      <DoubleAppui
        onAimer={() => { if (!post.liked) onLike(post.id); }}
        onAppuiSimple={estVideo && onOuvrirVideo ? () => onOuvrirVideo(post) : null}
      >
      {post.format === 'avantapres' && (post.medias || []).length > 1 ? (
        /* Avant/après : les deux photos côte à côte, chacune étiquetée.
           C'est la comparaison qui fait tout l'intérêt du format. */
        <View style={s.avantApres}>
          {post.medias.slice(0, 2).map((m, i) => (
            <View key={i} style={{ flex: 1 }}>
              <Media media={m} style={{ width: '100%', aspectRatio: 3 / 4 }} />
              <View style={s.etiquetteAA}>
                <Text style={s.etiquetteAATexte}>{i === 0 ? 'Avant' : 'Après'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : estVideo ? (
        /* Une vidéo se filme debout : dans un cadre 16/10 on n'en voit qu'une
           bande. Le format 4/5 en montre beaucoup plus sans dévorer le fil —
           c'est le compromis retenu par Instagram.
           Et surtout, on peut la toucher : elle s'ouvre alors en plein écran,
           avec le son, à l'endroit exact où on l'a laissée dans le fil.

           L'appui simple est porté par `DoubleAppui`, au-dessus. S'il
           restait ici, il partirait AVANT que le double ait pu échouer, et
           la vidéo s'ouvrirait au premier des deux appuis.
           (Et ce commentaire reste en forme JS : un commentaire JSX placé
           au début d'une parenthèse se lit comme un objet, pas comme du
           JSX — le piège est déjà consigné dans CLAUDE.md.) */
        <View
          accessibilityRole="button"
          accessibilityLabel={estConseil
            ? 'Écouter ce conseil en plein écran'
            : 'Voir la vidéo en plein écran'}
        >
          <Media
            media={post.media}
            style={{ width: '100%', aspectRatio: 4 / 5, backgroundColor: C.dark }}
            lecture={actif}
            muet
          >
            <EtiquetteVideo />
            {/* LE FIL CLASSIQUE EST MUET — `muet` juste au-dessus, et ce
                n'est pas négociable : une liste qui parle toute seule en
                défilant se coupe au bout de dix secondes.

                Mais un conseil en vidéo, c'est une VOIX qui explique. Sans
                le dire, on regarde des lèvres bouger et on passe. Le plein
                écran, lui, a le son (`Visionneuse`, `muet={false}`). */}
            <View style={s.indicePleinEcran} pointerEvents="none">
              {estConseil ? <Volume2 size={12} color="#fff" /> : <Maximize size={12} color="#fff" />}
              <Text style={s.indicePleinEcranTexte}>
                {estConseil ? 'Conseil — touchez pour écouter' : 'Voir en plein écran'}
              </Text>
            </View>
          </Media>
        </View>
      ) : sansVisuel ? null : (
        /* Une photo, ou plusieurs qu'on fait défiler au doigt. Avec une seule
           image, le carrousel se retire complètement : ni points, ni
           compteur. */
        <Carrousel medias={photos} basReserve={HAUTEUR_BARRE} />
      )}

      {/* LA BARRE D'ACTIONS EST POSÉE SUR LA PHOTO — demandé par le
          propriétaire le 02/10/2026 : « la photo prend tout le post, et les
          boutons en transparence dessus, en dessous ».

          Il a raison, et pour une raison qui n'est pas que de goût : la
          bande blanche sous la photo coupait la carte en deux, alors que
          l'image est la seule chose qu'on regarde. Le fil vidéo faisait
          déjà exactement ça — les deux fils parlent enfin la même langue.

          LE VOILE N'EST PAS DÉCORATIF. Une icône blanche sur une photo de
          mur blanc disparaît. Le dégradé garantit un fond sombre sous les
          commandes, quelle que soit la photo. C'est le même `Scrim` que le
          fil vidéo, pour la même raison. */}
      <View
        style={sansVisuel ? s.barreSousTexte : s.barreSurPhoto}
        pointerEvents="box-none"
      >
        {/* Le voile n'a de sens que s'il y a une image dessous. Posé sur le
            fond clair de la carte, il n'assombrirait rien et grignoterait
            juste le texte au-dessus. */}
        {!sansVisuel && (
          <LinearGradient
            colors={['transparent', 'rgba(26,27,25,0.22)', 'rgba(26,27,25,0.78)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        <View style={s.actions}>
        <Pressable
          style={({ pressed }) => [s.action, pressed && APPUI.discret]}
          hitSlop={viser(36)}
          onPress={() => onLike(post.id)}
          accessibilityRole="button"
          accessibilityLabel={post.liked
            ? `Je n'aime plus. ${post.likes} j'aime`
            : `J'aime cette publication. ${post.likes} j'aime`}
          aria-selected={!!post.liked}
        >
            <Heart size={17} filled={post.liked} color={post.liked ? C.accent : encre} />
            {/* Le NOMBRE reste blanc, seul le cœur devient orange. Le voile
                n'est qu'à 78 % : sur une photo claire, un chiffre orange
                deviendrait illisible, et sa lisibilité dépendrait alors de
                la photo — ce qui n'est pas une règle, c'est un hasard.
                Un cœur rempli dit déjà « c'est aimé ». */}
            <Text style={[s.actionText, sansVisuel && s.actionTexteSombre]}>{post.likes}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.action, pressed && APPUI.discret]}
          hitSlop={viser(36)}
          onPress={() => onToggleComments(post.id)}
          accessibilityRole="button"
          accessibilityLabel={`Commentaires, ${nbCommentairesDe(post)}`}
          aria-expanded={!!commentsOpen}
        >
            <MessageSquare size={17} color={encre} />
            <Text style={[s.actionText, sansVisuel && s.actionTexteSombre]}>{nbCommentairesDe(post)}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.action, pressed && APPUI.discret]}
          hitSlop={viser(36)}
          onPress={() => onShare('Lien de la publication copié.')}
          accessibilityRole="button"
          accessibilityLabel="Partager cette publication"
        >
            <Share2 size={16} color={encre} />
            <Text style={[s.actionText, sansVisuel && s.actionTexteSombre]}>Partager</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.action, pressed && APPUI.discret]}
          hitSlop={viser(36)}
          onPress={() => onSave(post.id)}
          accessibilityRole="button"
          accessibilityLabel={saved
            ? 'Retirer de mes publications enregistrées'
            : 'Enregistrer cette publication'}
          aria-selected={!!saved}
        >
            <Bookmark size={16} filled={saved} color={saved ? C.accent : encre} />
        </Pressable>
          <View style={s.contactWrap}>
            <BtnMini label="Contacter" onPress={() => onToggleContact(post.id)} />
          </View>
        </View>
      </View>
      </DoubleAppui>

      {/* menu Contacter */}
      {contactOpen && (
        <View style={s.contactPop}>
          <ContactItem icon={<MessageCircle size={13} color={C.ink} />} label="Envoyer un message" onPress={() => onContact(pro, 'message')} />
          <ContactItem icon={<Phone size={13} color={C.ink} />} label="Être rappelé" onPress={() => onContact(pro, 'rappel')} />
          <ContactItem icon={<FileText size={13} color={C.ink} />} label="Demander un devis" onPress={() => onContact(pro, 'devis')} />
          <ContactItem icon={<User size={13} color={C.ink} />} label="Voir le profil" onPress={() => onView(pro.id)} last />
        </View>
      )}

      {/* commentaires */}
      {commentsOpen && (
        <View style={s.comments}>
          {/* `null` = pas encore arrivés. On le DIT, au lieu d'afficher un
              blanc qui ressemble à « aucun commentaire ». */}
          {!Array.isArray(post.comments) && (
            <Text style={s.chargement}>Chargement des commentaires…</Text>
          )}
          <Commentaires
            commentaires={post.comments || []}
            pros={pros}
            onVoirProfil={onVoirCommentateur}
            onSignaler={onSignaler}
            moiId={moiId}
            onModifier={onModifierCommentaire
              ? (c, texte) => onModifierCommentaire(post.id, c, texte)
              : undefined}
            onSupprimer={onSupprimerCommentaire
              ? (c) => onSupprimerCommentaire(post.id, c)
              : null}
            onEnvoyer={(texte, parentId) => onAddComment(post.id, texte, parentId)}
          />
        </View>
      )}
    </View>
  );
});

export default PostCard;
function ContactItem({ icon, label, onPress, last }) {
  return (
    <Pressable
      style={[s.contactItem, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={s.contactItemText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* Posé sur l'image, donc flottant, donc arrondi (règle dans theme.js). */
  /* EN HAUT À DROITE, ET PLUS EN BAS — 05/10/2026, vu sur une capture.
     Il était à `bottom: 10`, c'est-à-dire exactement sur la rangée de la
     barre d'actions : le bouton « Contacter », calé à droite, lui passait
     dessus et on lisait « Voi… ». Ça ne lève aucune erreur, et personne ne
     l'avait regardé depuis que la barre est passée SUR la photo, le
     02/10. Le libellé plus long d'un conseil l'a rendu évident.

     En face de l'étiquette « Vidéo », qui est en haut à GAUCHE : les deux
     se partagent la bande du haut, où rien d'autre ne vient. */
  indicePleinEcran: {
    position: 'absolute', right: S.sm, top: S.sm, flexDirection: 'row', alignItems: 'center',
    gap: S.xs, backgroundColor: 'rgba(26,27,25,0.72)',
    paddingVertical: S.xs, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  indicePleinEcranTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
  /* L'étiquette « Conseil de pro ». Arrondie : elle FLOTTE au-dessus du
     contenu, elle ne le porte pas (voir « Les bords » dans CLAUDE.md).
     Le marine #1B4B6B donne 9,27 : 1 avec du blanc — mesuré au lot 5. */
  conseil: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    alignSelf: 'flex-start', marginLeft: S.md, marginTop: S.sm,
    backgroundColor: C.accent2, borderRadius: R.gelule,
    paddingVertical: S.xs, paddingHorizontal: S.sm,
  },
  conseilTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: C.surface },

  /* La ligne du chantier : au-dessus du texte, et RIEN QUE DU TEXTE.
     Le propriétaire l'a vue sur son iPhone le 06/10/2026 : « on voit bien
     écrit le nom du chantier mais il est entouré d'un carré beige, on
     pourrait peut-être garder que l'écriture ». Il a raison, et la raison
     n'est pas esthétique : un bloc teinté se lit comme une ÉTIQUETTE, donc
     comme une information posée là. Or cette ligne est un CHEMIN — elle
     ouvre un dossier. L'icône de calques dit « il y a une suite », l'encre
     orange dit « on peut appuyer », et c'est tout ce qu'il faut.

     La hauteur, elle, ne bouge pas : 44 points, parce qu'elle ouvre une
     page entière (la règle du lot 5). Ce sont ces 44 points qui portent
     l'air autour du texte — d'où plus aucune marge au-dessus. */
  chantier: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    marginHorizontal: S.md,
    minHeight: TOUCHE,
  },
  chantierTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accentTexte, flexShrink: 1 },
  chantierNombre: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, flexShrink: 0 },

  avantApres: { flexDirection: 'row', gap: 2 },
  etiquetteAA: {
    position: 'absolute', left: S.sm, top: S.sm,
    backgroundColor: 'rgba(26,27,25,0.72)',
    paddingVertical: 3, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  etiquetteAATexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
  card: { ...CARTE },

  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 12, paddingBottom: 6, gap: S.xs,
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, marginLeft: 9 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  name: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, flexShrink: 1 },
  meta: { fontSize: T.micro, color: C.muted, marginTop: 1, fontFamily: F.inter, flexShrink: 1 },

  postText: {
    fontSize: T.corps, paddingTop: S.xs, paddingHorizontal: S.md, paddingBottom: S.sm,
    lineHeight: interligne(T.corps), color: C.ink, fontFamily: F.inter,
  },

  /* La barre est POSÉE SUR la photo, calée en bas. `box-none` sur le
     conteneur : le voile ne doit pas intercepter le double-appui, seuls
     les boutons reçoivent la touche. */
  barreSurPhoto: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  /* SANS PHOTO, la barre n'a rien sur quoi se poser : elle reprend sa place
     dans le flux, sous le texte, avec un filet pour la détacher. Un trait
     VIF — c'est de la structure, pas quelque chose qui flotte. */
  barreSousTexte: { borderTopWidth: 1, borderTopColor: C.line },
  actionTexteSombre: { color: C.ink },
  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10, paddingHorizontal: 12,
    /* Plus de `flexWrap` : sur la photo, une barre qui passe à la ligne
       mangerait l'image. Les quatre icônes et le bouton tiennent. */
  },
  /* Une icône de 17 px ne fait pas un bouton : 36 px de haut plus 8 px
     de `hitSlop` donnent les 44 px que réclame un pouce. Mesuré avant :
     17 px de haut, sans aucune marge de visée. */
  action: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs + 1,
    minHeight: 36, paddingHorizontal: S.xs,
  },
  actionText: { fontSize: T.courant, color: C.surface, fontFamily: F.inter },
  contactWrap: { marginLeft: 'auto' },

  /* Ce menu FLOTTE au-dessus de la carte : légèrement arrondi, et une ombre
     de la même famille que partout ailleurs. */
  contactPop: {
    alignSelf: 'flex-end', width: 190, marginRight: S.md, marginBottom: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderRadius: R.doux, overflow: 'hidden',
    ...SH.flottant,
  },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  contactItemText: { fontSize: T.courant, color: C.ink, fontFamily: F.inter },

  comments: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 10 },
  chargement: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, paddingVertical: 6 },

  adTag: {
    position: 'absolute', top: S.sm, left: S.sm, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 3, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  adTagText: { color: '#fff', fontSize: T.micro, fontFamily: F.oswald },
  adAnnonceur: { fontFamily: F.oswald6, fontSize: T.corps, paddingTop: 6, paddingHorizontal: S.md, color: C.ink },
});
