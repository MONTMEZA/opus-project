/**
 * UNE FEUILLE QUI MONTE DU BAS — et qui monte AUSSI avec le clavier.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Signalé par le propriétaire le 04/10/2026, depuis son iPhone, en
 * répondant à une annonce :
 *
 *   « Le clavier de l'iPhone cache la partie où on écrit le texte et en
 *     même temps la croix pour le fermer. Et même si j'écris un texte et
 *     que je valide avec le clavier de l'iPhone, la fenêtre ne se ferme
 *     pas, donc je suis bloqué. »
 *
 * Trois défauts en une phrase, et le troisième explique les deux autres :
 *
 *   1. une feuille collée en bas de l'écran ne bouge PAS quand le clavier
 *      s'ouvre. Il la recouvre, champ compris ;
 *   2. la croix de fermeture est en haut de la feuille, donc elle passe
 *      sous le clavier elle aussi — il n'y a plus de sortie ;
 *   3. sur un champ MULTILIGNE, la touche « Entrée » insère un retour à la
 *      ligne. Elle ne valide rien, et elle ne peut pas : c'est ainsi que se
 *      comporte un champ de plusieurs lignes, partout.
 *
 * Résultat : l'application a l'air plantée alors qu'elle fonctionne très
 * bien. C'est le pire genre de défaut — celui qui donne tort au programme.
 *
 * CE QUE CE COMPOSANT GARANTIT
 * ----------------------------
 *   - la feuille **monte avec le clavier** (`KeyboardAvoidingView`), donc
 *     le champ ET la croix restent visibles ;
 *   - le voile sombre ferme la feuille : au-dessus du clavier il reste
 *     toujours une bande de voile à toucher, donc il y a TOUJOURS une
 *     sortie ;
 *   - le contenu DÉFILE. Sur un petit écran avec un grand clavier, une
 *     feuille qui ne défile pas cache son propre bouton.
 *
 * `keyboardShouldPersistTaps="handled"` n'est pas un détail : sans lui, le
 * premier appui sur un bouton alors que le clavier est ouvert ne fait que
 * refermer le clavier. On appuie, « rien ne se passe », on recommence.
 *
 * ET POURQUOI C'EST UNE BRIQUE PARTAGÉE
 * -------------------------------------
 * Le défaut existait à DEUX endroits le jour où il a été trouvé — la
 * réponse à une annonce, et le signalement, qui est pourtant le chemin de
 * la modération. `QuoteModal` et `CommentsSheet`, eux, géraient déjà le
 * clavier chacun à leur façon. Écrire le bon comportement une fois est la
 * seule manière d'empêcher la troisième.
 */
import React from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform,
  StyleSheet,
} from 'react-native';
import { C, F, T, S, viser } from '../theme';
import { X } from './icons';

/**
 * `defile = false` quand le contenu apporte SA PROPRE liste.
 *
 * Une `FlatList` posée dans un `ScrollView` de même orientation casse le
 * défilement — React Native le dit, et on ne le voit qu'au doigt. Une
 * feuille qui affiche une liste virtualisée prend donc la hauteur, et
 * c'est la liste qui défile.
 */
export default function FeuilleBas({
  titre, onFermer, children, hauteurMax = '80%', defile = true,
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFermer}>
      {/* LE VOILE FERME LA FEUILLE. C'est la sortie de secours : quoi qu'il
          arrive à la mise en page, il reste une bande sombre à toucher
          au-dessus de la feuille. */}
      <Pressable style={s.fond} onPress={onFermer} accessibilityLabel="Fermer" />

      <KeyboardAvoidingView
        /* `padding` sur iOS : la vue se réduit de la hauteur du clavier, et
           la feuille remonte avec. Android gère ça tout seul — lui imposer
           un comportement y fait sauter la mise en page. */
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.ancrage}
        pointerEvents="box-none"
      >
        <View style={[s.feuille, { maxHeight: hauteurMax }]}>
          <View style={s.haut}>
            <Text style={s.titre} numberOfLines={2}>{titre}</Text>
            <Pressable
              onPress={onFermer}
              hitSlop={viser(24)}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={18} color={C.muted} />
            </Pressable>
          </View>

          {defile ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.contenu}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={s.contenu}>{children}</View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  fond: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  /* `box-none` : l'ancrage occupe tout l'écran pour pouvoir pousser la
     feuille vers le bas, mais il ne doit RIEN intercepter — sinon il
     avalerait les touches destinées au voile, et la sortie de secours
     disparaîtrait. */
  ancrage: { flex: 1, justifyContent: 'flex-end' },
  /* La feuille PORTE l'information : angle vif, comme toute structure du
     projet (règle des bords, `src/theme.js`). */
  feuille: {
    backgroundColor: C.surface, width: '100%',
    paddingTop: S.lg, paddingHorizontal: S.lg, paddingBottom: S.xl,
  },
  haut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: S.sm, marginBottom: S.sm,
  },
  titre: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  contenu: { gap: S.sm, paddingBottom: S.sm },
});
