/**
 * Fil de commentaires, partagé par la carte du fil classique et par le
 * panneau du fil vidéo. Un seul composant : la même discussion se lit de la
 * même façon aux deux endroits.
 *
 * Deux niveaux, pas davantage — un commentaire, et ses réponses. Facebook,
 * Instagram et TikTok s'arrêtent tous là, et ce n'est pas un hasard : à
 * chaque niveau le texte s'indente, et sur un téléphone la troisième réponse
 * se lirait dans une colonne de six mots de large. Répondre à une réponse
 * reste possible : elle rejoint le même fil, précédée d'un « @Nom ».
 *
 * Le nom et la photo sont tactiles. Ils mènent à la page du professionnel,
 * ou à la fiche publique du particulier.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { Avatar, Field } from './ui';
import { BadgeCheck, Send, X, Flag } from './icons';

/** Le compteur affiché sous un post : les commentaires ET leurs réponses. */
export function nombreCommentaires(commentaires = []) {
  return (commentaires || []).reduce((n, c) => n + 1 + ((c.reponses || []).length), 0);
}

/**
 * Combien de commentaires porte cette publication ?
 *
 * Deux sources, et l'ordre compte :
 *   - si les commentaires sont CHARGÉS, on les compte. C'est ce qui fait que
 *     le nombre bouge tout de suite quand on en écrit un ;
 *   - sinon, on prend `nbCommentaires`, le compteur tenu par la base.
 *
 * `comments` vaut `null` tant qu'on ne les a pas ouverts : depuis que le fil
 * se charge par pages, on ne les télécharge plus d'avance. Distinguer `null`
 * (pas chargés) de `[]` (chargés, aucun) est exactement ce qui évite
 * d'afficher « 0 » sur une publication qui a trois commentaires.
 */
export function nbCommentairesDe(post) {
  if (!post) return 0;
  if (Array.isArray(post.comments)) return nombreCommentaires(post.comments);
  return post.nbCommentaires || 0;
}

/**
 * `scroll` : la liste défile dans sa propre zone et la barre de saisie reste
 * collée en bas. C'est ce qu'il faut dans le panneau du fil vidéo, dont la
 * hauteur est fixe. Dans la carte du fil classique, la page défile déjà, et
 * une zone de défilement imbriquée piégerait le geste.
 */
export default function Commentaires({
  commentaires = [], pros = {}, onEnvoyer, onVoirProfil, onSignaler,
  onSupprimer, moiId = null, style, scroll,
}) {
  const [draft, setDraft] = useState('');
  const [repondA, setRepondA] = useState(null);       // { id, auteur }
  const [deplies, setDeplies] = useState(() => new Set());

  const envoyer = () => {
    const texte = draft.trim();
    if (!texte) return;
    onEnvoyer(texte, repondA ? repondA.id : null);
    setDraft('');
    setRepondA(null);
  };

  /**
   * Répondre à un commentaire vise ce commentaire ; répondre à une réponse
   * vise le commentaire d'origine, et le nom part dans le texte. C'est ce
   * qui permet de continuer indéfiniment sans jamais indenter davantage.
   */
  const repondre = (c, parentId) => {
    if (parentId) {
      setRepondA({ id: parentId, auteur: c.auteur });
      setDraft((d) => (d.startsWith('@') ? d : `@${c.auteur} `));
    } else {
      setRepondA({ id: c.id, auteur: c.auteur });
    }
  };

  const basculer = (id) => setDeplies((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const Zone = scroll ? ScrollView : View;
  const zoneProps = scroll
    ? { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 10 }, keyboardShouldPersistTaps: 'handled' }
    : {};

  return (
    <View style={style}>
      <Zone {...zoneProps}>
      {commentaires.map((c) => {
        const reponses = c.reponses || [];
        const ouvert = deplies.has(c.id) || reponses.length <= 1;
        return (
          <View key={String(c.id)}>
            <Ligne
              c={c}
              pros={pros}
              moiId={moiId}
              onVoirProfil={onVoirProfil}
              onSignaler={onSignaler}
              onSupprimer={onSupprimer}
              onRepondre={() => repondre(c)}
            />

            {reponses.length > 1 && !ouvert && (
              <Pressable
                style={s.voirPlus}
                onPress={() => basculer(c.id)}
                accessibilityRole="button"
                accessibilityLabel={`Voir les ${reponses.length} réponses`}
              >
                <View style={s.trait} />
                <Text style={s.voirPlusTexte}>
                  Voir les {reponses.length} réponses
                </Text>
              </Pressable>
            )}

            {ouvert && reponses.map((r) => (
              <Ligne
                key={String(r.id)}
                c={r}
                reponse
                pros={pros}
                moiId={moiId}
                onVoirProfil={onVoirProfil}
                onSignaler={onSignaler}
                onSupprimer={onSupprimer}
                onRepondre={() => repondre(r, c.id)}
              />
            ))}
          </View>
        );
      })}

      {commentaires.length === 0 && (
        <Text style={s.vide}>Aucun commentaire — lancez la discussion.</Text>
      )}
      </Zone>

      {/* --- barre de saisie --- */}
      {!!repondA && (
        <View style={s.reponseA}>
          <Text style={s.reponseATexte} numberOfLines={1}>
            Réponse à {repondA.auteur}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => { setRepondA(null); setDraft(''); }}
            accessibilityRole="button"
            accessibilityLabel="Annuler la réponse"
          >
            <X size={13} color={C.muted} />
          </Pressable>
        </View>
      )}

      <View style={s.saisie}>
        <Field
          style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: 12.5 }}
          placeholder={repondA ? `Répondre à ${repondA.auteur}...` : 'Ajouter un commentaire...'}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={envoyer}
          returnKeyType="send"
        />
        <Pressable
          style={s.envoyer}
          onPress={envoyer}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le commentaire"
        >
          <Send size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function Ligne({ c, reponse, pros, moiId, onVoirProfil, onSignaler, onSupprimer, onRepondre }) {
  /* La confirmation se fait DANS la ligne, pas dans une alerte du système :
     une alerte ne se teste pas au navigateur, et elle coupe la lecture. */
  const [confirme, setConfirme] = useState(false);
  const aMoi = !!moiId && !!c.auteurId && String(c.auteurId) === String(moiId);
  const nbReponses = (c.reponses || []).length;
  const pro = pros[c.auteurId];
  const taille = reponse ? 24 : 30;
  const cliquable = !!c.auteurId;

  const ouvrir = () => cliquable && onVoirProfil(c);

  return (
    <View style={[s.ligne, reponse && s.ligneReponse]}>
      {/* L'avatar et le nom mènent au même endroit : un lecteur d'écran
          annoncerait deux fois la même chose. On efface donc l'avatar et on
          laisse parler le nom, juste à côté. */}
      <Pressable
        onPress={ouvrir}
        disabled={!cliquable}
        hitSlop={6}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Avatar seed={c.auteurId || c.id} size={taille} uri={c.avatarUrl} />
      </Pressable>

      <View style={s.corps}>
        <View style={s.bulle}>
          <Pressable
            onPress={ouvrir}
            disabled={!cliquable}
            style={s.nomLigne}
            accessibilityRole={cliquable ? 'button' : 'text'}
            accessibilityLabel={cliquable
              ? `Voir la fiche de ${pro ? pro.entreprise : c.auteur}`
              : (pro ? pro.entreprise : c.auteur)}
          >
            <Text style={[s.nom, cliquable && s.nomCliquable]}>
              {pro ? pro.entreprise : c.auteur}
            </Text>
            {pro && pro.verifie && <BadgeCheck size={12} color={C.verif} />}
          </Pressable>
          <Text style={s.texte}>{c.texte}</Text>
        </View>

        <View style={s.meta}>
          {!!c.time && <Text style={s.metaTexte}>{c.time}</Text>}
          <Pressable
            onPress={onRepondre}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Répondre à ${pro ? pro.entreprise : c.auteur}`}
          >
            <Text style={s.repondre}>Répondre</Text>
          </Pressable>
          {/* Le sien, on le retire. Celui des autres, on le signale — et
              JAMAIS on ne le supprime, même sur sa propre publication : la
              règle est tenue par la base, pas par cet écran. */}
          {aMoi && !!onSupprimer && !confirme && (
            <Pressable
              onPress={() => setConfirme(true)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Supprimer mon commentaire"
            >
              <Text style={s.supprimer}>Supprimer</Text>
            </Pressable>
          )}
          {aMoi && !!onSupprimer && confirme && (
            <View style={s.confirme}>
              <Text style={s.confirmeTexte}>
                {nbReponses > 0
                  ? `Supprimer ? Les ${nbReponses} réponse${nbReponses > 1 ? 's' : ''} partiront aussi.`
                  : 'Supprimer ?'}
              </Text>
              <Pressable
                onPress={() => { setConfirme(false); onSupprimer(c); }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Oui, supprimer ce commentaire"
              >
                <Text style={s.confirmeOui}>Oui</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirme(false)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Annuler la suppression"
              >
                <Text style={s.confirmeNon}>Annuler</Text>
              </Pressable>
            </View>
          )}
          {!aMoi && !!onSignaler && !!c.auteurId && (
            <Pressable
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Signaler ce commentaire"
              onPress={() => onSignaler({
                cibleType: 'commentaire',
                cibleId: c.id,
                auteurId: c.auteurId,
                auteurNom: (pro ? pro.entreprise : c.auteur),
                extrait: c.texte,
              })}
            >
              <Flag size={11} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ligne: { flexDirection: 'row', gap: 8, paddingVertical: 6 },
  ligneReponse: { paddingLeft: 26 },
  corps: { flex: 1, minWidth: 0 },
  bulle: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, paddingVertical: 6, paddingHorizontal: 9 },
  nomLigne: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nom: { fontFamily: F.inter6, fontSize: 11.5, color: C.ink },
  nomCliquable: { color: C.accent2 },
  supprimer: { fontFamily: F.inter5, fontSize: 11, color: C.muted },
  confirme: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  confirmeTexte: { fontFamily: F.inter, fontSize: 10.5, color: C.muted, flexShrink: 1 },
  confirmeOui: { fontFamily: F.inter6, fontSize: 11, color: C.bad },
  confirmeNon: { fontFamily: F.inter5, fontSize: 11, color: C.muted },
  texte: { fontSize: 12.5, lineHeight: 18, color: C.ink, fontFamily: F.inter, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 3, paddingLeft: 2 },
  metaTexte: { fontSize: 10.5, color: C.muted, fontFamily: F.inter },
  repondre: { fontSize: 10.5, color: C.muted, fontFamily: F.inter6 },

  voirPlus: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 26, paddingVertical: 4 },
  trait: { width: 16, height: 1, backgroundColor: C.line },
  voirPlusTexte: { fontSize: 11, color: C.muted, fontFamily: F.inter6 },

  vide: { fontSize: 12, color: C.muted, fontFamily: F.inter, paddingVertical: 8 },

  reponseA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
    paddingVertical: 5, paddingHorizontal: 9, marginTop: 8,
  },
  reponseATexte: { flex: 1, fontSize: 11, color: C.muted, fontFamily: F.inter6 },

  saisie: { flexDirection: 'row', gap: 7, marginTop: 8 },
  envoyer: {
    backgroundColor: C.ink, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
