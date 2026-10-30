/**
 * « Mes publications » — tout ce que le professionnel a publié, au même
 * endroit, avec de quoi agir dessus.
 *
 * Le fil montre les publications mêlées à celles des autres, et dans l'ordre
 * du fil. Pour retrouver la sienne d'il y a trois semaines et la supprimer,
 * il fallait faire défiler indéfiniment. D'où cet écran.
 *
 * Trois actions, et une seule est irréversible — c'est la seule qui demande
 * confirmation.
 *
 * LUE EN BASE, PAGE PAR PAGE — lot S-c, 30/10/2026
 * ------------------------------------------------
 * Jusque-là, cet écran filtrait les vingt publications du FIL chargé : celle
 * d'il y a trois semaines n'y était donc presque jamais, et le compte du
 * profil (« Mes publications (3) ») disait trois quand la base en avait
 * dix-sept. Il lit maintenant ses propres pages (`api.mesPublications`), et
 * un échec le DIT — jamais « Vous n'avez encore rien publié ».
 *
 * ET « REMETTRE EN AVANT » FAIT ENFIN QUELQUE CHOSE
 * -------------------------------------------------
 * Avant, ce geste récrivait la date de publication ; la base la remettait
 * aussitôt (le texte seul se corrige), et l'écran annonçait « remise en tête
 * du fil ». Le bouton ne faisait RIEN. C'est désormais la base qui décide
 * (`remonter_publication()`, section 52.9) : une semaine après la
 * publication, puis une fois tous les sept jours, et trois au plus par
 * semaine. Un refus reste écrit SOUS la carte, avec sa date.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, R, S, CARTE, GOUTTIERE, TOUCHE, APPUI, interligne,
} from '../theme';
import { BtnMini, BtnOutline, EmptyState, TextArea } from '../components/ui';
import Vignette from '../components/Vignette';
import { porteUnVisuel } from '../lib/formats-publication';
import { nbCommentairesDe } from '../components/Commentaires';
import { CLAVIER } from '../lib/clavier';
import {
  NOTE_REMONTEE, SUPPRESSION_APRES_REMISE, libelleRemise, remiseRecente,
} from '../lib/remontee';
import { CE_QUE_LA_SUPPRESSION_GARDE } from '../data/legal';
import {
  Heart, MessageSquare, Share2, Trash, RefreshCw, Grid, VideoIcon, Layers, TypeIcon,
  Edit, Lightbulb, Eye,
} from '../components/icons';

const ICONE_FORMAT = {
  photo: Grid, video: VideoIcon, montage: Layers, avantapres: Layers,
  texte: TypeIcon, conseil: TypeIcon,
};

/* `conseil` reste dans les deux tables ci-dessus, et il le faut : c'était un
   FORMAT jusqu'au 05/10/2026 (section 34), et des lignes anciennes peuvent
   encore le porter. Un libellé retiré afficherait « Publication » à la place,
   sans erreur et sans que personne ne comprenne pourquoi. */
const NOM_FORMAT = {
  photo: 'Photo', video: 'Vidéo', montage: 'Montage',
  avantapres: 'Avant/Après', texte: 'Texte', conseil: 'Conseil',
};

/* Déclaré au niveau du MODULE : écrit dans le composant, ce serait un type
   neuf à chaque rendu, et React démonterait tous les séparateurs
   (`verifier-fil`, 17/10). */
function Intervalle() {
  return <View style={s.intervalle} />;
}

/**
 * UNE carte, mémorisée. Le texte qu'on corrige vit ICI, pas dans l'écran :
 * une lettre tapée ne redessine que sa carte, pas toute la liste (« un champ
 * de saisie ne re-rend que LUI », 29/09). Et le refus qu'elle reçoit est une
 * CHAÎNE, pas le dictionnaire des refus : sinon toutes les cartes se
 * croiraient changées à chaque refus (le piège de `jyAiRepondu`, lot 4).
 */
const CartePublication = React.memo(function CartePublication({
  p, enSuppression, remiseCompteEncore, enModification, refus,
  onDemanderSuppression, onAnnulerSuppression,
  onDemanderModification, onAnnulerModification,
  onSupprimer, onModifier, onRepublier, onPartager, onOuvrir,
}) {
  const [brouillon, setBrouillon] = useState('');
  const Icone = ICONE_FORMAT[p.format] || Grid;
  const remise = p.remonteLe ? libelleRemise(p.remonteLe) : null;

  return (
    <View style={s.carte}>
      <Pressable
        style={({ pressed }) => [s.haut, pressed && APPUI.discret]}
        onPress={() => onOuvrir && onOuvrir(p)}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir cette publication : ${p.texte || NOM_FORMAT[p.format] || 'publication'}`}
      >
        {/* UNE PUBLICATION SANS VISUEL N'A PAS DE VIGNETTE — vu sur une
            capture le 05/10/2026, en relisant « Mes publications » avec une
            publication « Texte » : elle affichait un carré gris, c'est-à-dire
            l'image d'une image qui n'existe pas. C'est le même défaut que le
            fil du lot C, à un autre endroit : le FORMAT décide, pas le
            contenu de `media`. */}
        {porteUnVisuel(p.format)
          ? <Vignette media={p.media} style={s.vignette} />
          : (
            <View style={[s.vignette, s.vignetteTexte]}>
              <Icone size={18} color={C.muted} />
            </View>
          )}

        <View style={s.infos}>
          <View style={s.formatLigne}>
            <Icone size={12} color={C.muted} />
            <Text style={s.format}>{NOM_FORMAT[p.format] || 'Publication'}</Text>
            {/* L'ÉTIQUETTE SE VOIT ICI AUSSI. C'est l'écran où l'artisan
                relit ce qu'il a publié : si rien ne distingue un conseil
                d'une photo de chantier, la case cochée dix minutes plus tôt
                n'a laissé aucune trace visible, et on arrête de la cocher. */}
            {!!p.conseil && (
              <View style={s.conseil}>
                <Lightbulb size={10} color={C.surface} />
                <Text style={s.conseilTexte}>Conseil</Text>
              </View>
            )}
            <Text style={s.temps} numberOfLines={1}>· {p.time}</Text>
          </View>

          <Text style={s.texte} numberOfLines={2}>
            {p.texte || '(sans description)'}
            {p.modifie ? '  · modifié' : ''}
          </Text>

          {/* La date de PUBLICATION reste celle de la carte (« · il y a
              3 sem. ») ; la remise en avant se dit à part, pour qu'on ne
              prenne pas l'une pour l'autre. */}
          {!!remise && <Text style={s.remise}>{remise}</Text>}

          <View style={s.chiffres}>
            <View style={s.chiffre}>
              <Heart size={12} color={C.muted} />
              <Text style={s.chiffreTexte}>{p.likes}</Text>
            </View>
            <View style={s.chiffre}>
              <MessageSquare size={12} color={C.muted} />
              <Text style={s.chiffreTexte}>{nbCommentairesDe(p)}</Text>
            </View>
            {/* LES VUES — le chiffre le plus utile, et le seul qui manquait.
                Relevé sur la vraie base le 05/10/2026 : 14 publications pour
                5 j'aime et 5 commentaires. Un artisan publiait et
                n'apprenait RIEN — « 5 j'aime » ne dit pas si on l'a regardé.

                Il n'apparaît QUE sur cet écran, qui est le sien : un compteur
                de vues sur chaque carte du fil transformerait le fil en
                classement, et c'est exactement ce que ce lot refuse de
                faire. */}
            <View style={s.chiffre}>
              <Eye size={12} color={C.muted} />
              <Text style={s.chiffreTexte}>{p.vues || 0}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* LE REFUS RESTE SOUS LA CARTE. Le bandeau s'efface au bout de
          quelques secondes ; la date à laquelle ce sera possible, elle, doit
          rester lisible tant qu'on regarde cette publication. */}
      {!!refus && (
        <Text style={s.refus} accessibilityLiveRegion="polite">{refus}</Text>
      )}

      {enModification ? (
        <View style={s.confirmation}>
          <Text style={s.confirmationTexte}>
            Corriger le texte. Les photos, elles, ne changent pas :
            ce serait une autre publication.
          </Text>
          <TextArea
            value={brouillon}
            onChangeText={setBrouillon}
            autoFocus
            accessibilityLabel="Corriger le texte de ma publication"
          />
          <View style={s.confirmationBoutons}>
            <BtnMini outline label="Annuler" onPress={onAnnulerModification} />
            <BtnMini
              label="Enregistrer"
              disabled={!brouillon.trim() || brouillon === p.texte}
              onPress={() => {
                onAnnulerModification();
                onModifier(p, brouillon.trim());
              }}
            />
          </View>
        </View>
      ) : enSuppression ? (
        /* La confirmation remplace la barre d'actions : impossible
           d'appuyer sur « Supprimer » en croyant viser autre chose. */
        <View style={s.confirmation}>
          <Text style={s.confirmationTexte}>
            {/* Ce que la suppression ne retire pas est écrit dans
                `legal.js` (lot S-a) : « définitivement » laissait croire
                que les fichiers partaient aussi. */}
            Supprimer cette publication du fil ? Les commentaires et
            les j'aime partiront avec. {CE_QUE_LA_SUPPRESSION_GARDE}
            {/* Supprimer ne REND pas la place : la base compte les
                publications supprimées (section 52.9). Le taire, et
                l'artisan croirait récupérer une de ses trois remises. */}
            {remiseCompteEncore ? ` ${SUPPRESSION_APRES_REMISE}` : ''}
          </Text>
          <View style={s.confirmationBoutons}>
            <BtnMini outline label="Annuler" onPress={onAnnulerSuppression} />
            <BtnMini
              label="Supprimer"
              style={{ backgroundColor: C.bad, borderColor: C.bad }}
              onPress={() => { onAnnulerSuppression(); onSupprimer(p); }}
            />
          </View>
        </View>
      ) : (
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.action, pressed && APPUI.discret]}
            onPress={() => onRepublier(p)}
            accessibilityRole="button"
            accessibilityLabel="Remettre en avant cette publication dans le fil"
          >
            <RefreshCw size={14} color={C.accent2} />
            <Text style={[s.actionTexte, { color: C.accent2 }]}>Remettre en avant</Text>
          </Pressable>

          {!!onModifier && (
            <Pressable
              style={({ pressed }) => [s.action, pressed && APPUI.discret]}
              onPress={() => { setBrouillon(p.texte || ''); onDemanderModification(p.id); }}
              accessibilityRole="button"
              accessibilityLabel="Corriger le texte de cette publication"
            >
              <Edit size={14} color={C.muted} />
              <Text style={s.actionTexte}>Modifier</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [s.action, pressed && APPUI.discret]}
            onPress={() => onPartager(p)}
            accessibilityRole="button"
            accessibilityLabel="Partager cette publication"
          >
            <Share2 size={14} color={C.muted} />
            <Text style={s.actionTexte}>Partager</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.action, pressed && APPUI.discret]}
            /* L'heure se lit dans le GESTE, jamais pendant le rendu. */
            onPress={() => onDemanderSuppression(p.id, remiseRecente(p.remonteLe, Date.now()))}
            accessibilityRole="button"
            accessibilityLabel="Supprimer cette publication"
          >
            <Trash size={14} color={C.bad} />
            <Text style={[s.actionTexte, { color: C.bad }]}>Supprimer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

export default function MesPublicationsScreen({
  posts = [], etat = 'jamais', echecDe = 'debut', fin = true, total = null, refus = {},
  onPlus, onRecharger,
  onSupprimer, onModifier, onRepublier, onPartager, onOuvrir,
}) {
  /* Une seule confirmation, une seule correction à la fois. `aSupprimer`
     retient aussi si sa remise en avant compte encore (lu à l'appui). */
  const [aSupprimer, setASupprimer] = useState(null);
  const [aModifier, setAModifier] = useState(null);
  const demanderSuppression = useCallback((id, recente) => setASupprimer({ id, recente }), []);
  const annulerSuppression = useCallback(() => setASupprimer(null), []);
  const annulerModification = useCallback(() => setAModifier(null), []);

  /* Rien encore lu : on ATTEND, on ne dit pas « rien publié ». */
  if ((etat === 'jamais' || etat === 'chargement') && posts.length === 0) {
    return (
      <View style={s.attente}>
        <ActivityIndicator color={C.accent} />
        <Text style={s.attenteTexte}>Lecture de vos publications…</Text>
      </View>
    );
  }

  /* UN ÉCHEC N'EST PAS UNE LISTE VIDE. « Lecture impossible » plein écran,
     seulement quand rien n'a jamais été lu. */
  if (etat === 'echec' && posts.length === 0) {
    return (
      <EmptyState
        icone={Grid}
        titre="Lecture impossible"
        action={onRecharger ? { label: 'Réessayer', onPress: onRecharger } : null}
      >
        Vos publications n’ont pas pu être lues. Ce n’est pas que vous n’en avez
        pas : la base n’a pas répondu.
      </EmptyState>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState>
        Vous n'avez encore rien publié. Vos photos et vidéos de chantier
        apparaîtront ici.
      </EmptyState>
    );
  }

  /* Le COMPTE vient de la base (`total`), pas de la longueur de la page :
     vingt cartes chargées ne sont pas vingt publications. Illisible, il ne
     s'affiche pas. */
  const entete = (
    <View style={s.entete}>
      {typeof total === 'number' && (
        <Text style={s.compte}>
          {total} {total > 1 ? 'publications' : 'publication'}
        </Text>
      )}
      {etat === 'echec' && echecDe === 'debut' && (
        <View style={s.nonActualisee} accessibilityLiveRegion="polite">
          <Text style={s.nonActualiseeTexte}>
            Liste non actualisée : vos publications n’ont pas pu être relues.
            Ce qui est affiché date de votre dernière lecture.
          </Text>
          {!!onRecharger && <BtnOutline label="Réessayer" onPress={onRecharger} />}
        </View>
      )}
      <Text style={s.note}>{NOTE_REMONTEE}</Text>
    </View>
  );

  const pied = etat === 'chargement'
    ? <ActivityIndicator color={C.accent} style={s.piedAttente} />
    : etat === 'echec' && echecDe === 'suite'
      ? (
        <View style={s.piedEchec} accessibilityLiveRegion="polite">
          <Text style={s.pied}>Les publications plus anciennes n’ont pas pu être lues.</Text>
          {!!onPlus && <BtnOutline label="Réessayer" onPress={onPlus} />}
        </View>
      )
      : null;

  return (
    <FlatList
      {...CLAVIER}
      data={posts}
      keyExtractor={(p) => String(p.id)}
      extraData={{ aSupprimer, aModifier, refus }}
      renderItem={({ item }) => (
        <CartePublication
          p={item}
          enSuppression={!!aSupprimer && aSupprimer.id === item.id}
          remiseCompteEncore={!!aSupprimer && aSupprimer.id === item.id && aSupprimer.recente}
          enModification={aModifier === item.id}
          refus={refus[item.id] || null}
          onDemanderSuppression={demanderSuppression}
          onAnnulerSuppression={annulerSuppression}
          onDemanderModification={setAModifier}
          onAnnulerModification={annulerModification}
          onSupprimer={onSupprimer}
          onModifier={onModifier}
          onRepublier={onRepublier}
          onPartager={onPartager}
          onOuvrir={onOuvrir}
        />
      )}
      ListHeaderComponent={entete}
      ListHeaderComponentStyle={s.enteteBoite}
      ListFooterComponent={pied}
      ItemSeparatorComponent={Intervalle}
      /* LES TROIS RÉGLAGES, la règle du lot 4 : une page fait vingt cartes,
         et chacune porte une vignette. */
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      windowSize={5}
      onEndReachedThreshold={0.5}
      onEndReached={() => { if (!fin && etat === 'pret' && onPlus) onPlus(); }}
      contentContainerStyle={s.contenu}
    />
  );
}

const s = StyleSheet.create({
  intervalle: { height: S.sm },
  contenu: { paddingHorizontal: GOUTTIERE, paddingTop: S.md, paddingBottom: S.xxl },
  enteteBoite: { marginBottom: S.md },
  entete: { gap: S.sm },
  compte: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  /* De la STRUCTURE posée sur la liste : angle vif, un filet rouge brique —
     la même famille que « Mes devis ». */
  nonActualisee: {
    backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.bad, padding: S.md, gap: S.sm,
  },
  nonActualiseeTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  carte: { ...CARTE },
  haut: { flexDirection: 'row', gap: S.md, padding: S.md },
  vignette: { width: 64, height: 80, backgroundColor: C.line },
  infos: { flex: 1, minWidth: 0 },
  vignetteTexte: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed',
  },
  formatLigne: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  format: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  /* La même étiquette que dans le fil, en plus petit : même couleur, même
     forme. Deux dessins pour la même chose, et on ne reconnaît ni l'un ni
     l'autre. */
  conseil: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    backgroundColor: C.accent2, borderRadius: R.gelule,
    paddingHorizontal: S.xs,
  },
  conseilTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: C.surface },
  temps: { flexShrink: 1, fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  texte: {
    fontSize: T.corps, color: C.ink, fontFamily: F.inter, lineHeight: interligne(T.corps), marginTop: S.xs,
  },
  remise: { fontSize: T.petit, color: C.accent2, fontFamily: F.inter6, marginTop: S.xs },
  chiffres: { flexDirection: 'row', gap: S.md, marginTop: S.sm },
  chiffre: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  chiffreTexte: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6 },

  refus: {
    fontSize: T.petit, color: C.bad, fontFamily: F.inter6, lineHeight: interligne(T.petit),
    paddingHorizontal: S.md, paddingBottom: S.sm,
  },

  actions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line,
  },
  /* 44 points de haut : la mesure d'un pouce, ganté ou non (lot 5). */
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.xs, minHeight: TOUCHE,
  },
  actionTexte: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6 },

  confirmation: {
    borderTopWidth: 1, borderTopColor: C.line, padding: S.md, gap: S.sm,
    backgroundColor: C.bg,
  },
  confirmationTexte: { fontSize: T.courant, color: C.ink, fontFamily: F.inter, lineHeight: interligne(T.courant) },
  confirmationBoutons: { flexDirection: 'row', gap: S.sm, justifyContent: 'flex-end' },

  note: {
    fontSize: T.petit, color: C.muted, fontFamily: F.inter, lineHeight: interligne(T.petit),
  },
  pied: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, textAlign: 'center',
    lineHeight: interligne(T.petit),
  },
  piedAttente: { marginTop: S.md },
  piedEchec: { marginTop: S.md, gap: S.sm, alignItems: 'center' },
  attente: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.bg },
  attenteTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.muted },
});
