/**
 * Panneau de commentaires qui monte du bas de l'écran.
 * Utilisé par le fil vidéo plein écran, où il n'y a pas la place
 * de déplier les commentaires dans la carte comme sur le fil classique.
 *
 * LA POIGNÉE ÉTAIT UN DÉCOR — corrigé le 02/10/2026.
 * --------------------------------------------------
 * Le petit trait gris en haut du panneau était dessiné, et rien d'autre :
 * aucun geste n'était branché dessus. Or ce trait EST une promesse —
 * partout ailleurs, il veut dire « tire-moi vers le bas ». Un objet qui
 * ressemble à une poignée et qui ne s'attrape pas est pire que pas de
 * poignée du tout : on tire, il ne se passe rien, et on en conclut que
 * l'application est cassée.
 *
 * Trois décisions en le branchant :
 *   - **on ne tire que vers le BAS.** Tirer vers le haut agrandirait le
 *     panneau, donc il faudrait deux hauteurs, donc deux mises en page.
 *     Ce n'est pas le sujet aujourd'hui ;
 *   - **la zone qui s'attrape est la bande entière du haut**, pas le trait
 *     de 4 px. Viser 4 px au pouce est impossible — c'est la leçon du
 *     lot 5, et celle du rayon de la carte ;
 *   - **un tiers de la hauteur, ou un geste vif, et ça se ferme.** En
 *     deçà, le panneau revient en place. Au moindre doute, on ne ferme
 *     pas : rouvrir coûte un geste de plus que de continuer à lire.
 */
import React from 'react';
import {
  Modal, View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  C, F, T, M, RESSORT, viser,
} from '../theme';
import { IconBtn } from './ui';
import Commentaires, { nbCommentairesDe } from './Commentaires';
import { X } from './icons';

export default function CommentsSheet({
  visible, post, pros = {}, onClose, onAddComment, onVoirCommentateur, onSignaler,
  onSupprimerCommentaire, onModifierCommentaire, moiId,
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const bas = useSharedValue(0);

  /* La remise à zéro est indispensable : le panneau est démonté puis
     remonté, mais la valeur partagée, elle, survit à la fermeture — sans
     ça, il rouvrirait déjà tiré vers le bas. */
  React.useEffect(() => { if (visible) bas.value = 0; }, [visible, bas]);

  const fermerDouce = React.useCallback(() => {
    bas.value = 0;
    if (onClose) onClose();
  }, [bas, onClose]);

  const SEUIL = height * 0.62 * 0.33;
  const tirer = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => { bas.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > SEUIL || e.velocityY > 900) {
        bas.value = withTiming(height, { duration: M.bref }, (ok) => {
          if (ok) runOnJS(fermerDouce)();
        });
        return;
      }
      bas.value = withSpring(0, RESSORT);
    });

  const stylePanneau = useAnimatedStyle(() => ({
    transform: [{ translateY: bas.value }],
  }));

  if (!visible || !post) return null;
  const comments = post.comments || [];
  const total = nbCommentairesDe(post);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Le voile : on ferme en touchant à côté. Pour un lecteur
          d'écran, en revanche, il n'existe pas — on ferme par la croix, qui
          est nommée. L'annoncer ferait un « bouton » de plus, occupant tout
          l'écran, avant d'arriver au contenu. */}
      <Pressable
        style={s.overlay}
        onPress={onClose}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.sheetWrap}
        >
          {/* Le corps n'est pas un bouton : il n'est là que pour empêcher
              la touche de traverser jusqu'au voile. `accessibilityViewIsModal`
              retient VoiceOver à l'intérieur, comme le fait la fenêtre elle-même
              pour le doigt. */}
          <Animated.View style={stylePanneau}>
          <Pressable
            style={[s.sheet, { paddingBottom: insets.bottom + 10 }]}
            onPress={(e) => e.stopPropagation()}
            accessibilityViewIsModal
            accessibilityRole="none"
          >
            <GestureDetector gesture={tirer}>
              <View
                style={s.zonePoignee}
                hitSlop={viser(26)}
                accessibilityRole="button"
                accessibilityLabel="Fermer les commentaires"
                onAccessibilityTap={onClose}
              >
                <View style={s.grabber} />
              </View>
            </GestureDetector>

            <View style={s.head}>
              <Text style={s.headText}>
                {total} {total > 1 ? 'commentaires' : 'commentaire'}
              </Text>
              <IconBtn onPress={onClose} accessibilityLabel="Fermer les commentaires">
                <X size={16} color={C.ink} />
              </IconBtn>
            </View>

            <Commentaires
              scroll
              style={s.list}
              commentaires={comments}
              pros={pros}
              onVoirProfil={(c) => { onClose(); onVoirCommentateur(c); }}
              onSignaler={onSignaler ? (cible) => { onClose(); onSignaler(cible); } : null}
              moiId={moiId}
              onModifier={onModifierCommentaire
                ? (c, texte) => onModifierCommentaire(post.id, c, texte)
                : undefined}
              onSupprimer={onSupprimerCommentaire
                ? (c) => onSupprimerCommentaire(post.id, c)
                : null}
              onEnvoyer={(texte, parentId) => onAddComment(post.id, texte, parentId)}
            />
          </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  // flex:1 est indispensable : sans hauteur connue, le « 62% » du panneau
  // ne se résout pas et le panneau s'écrase sur son contenu.
  sheetWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, width: '100%', height: '62%',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  /* La zone qui s'attrape, et non le trait : 4 px ne se visent pas au
     pouce. C'est toute la bande du haut qui répond. */
  zonePoignee: { paddingTop: 2, paddingBottom: 8, alignItems: 'center' },
  grabber: {
    width: 44, height: 5, borderRadius: 3, backgroundColor: C.line,
    alignSelf: 'center',
  },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  headText: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  list: { flex: 1, paddingHorizontal: 16 },
});
