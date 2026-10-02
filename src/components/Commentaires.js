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
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, F, T, S, APPUI, interligne, viser } from '../theme';
import { Avatar, Field } from './ui';
import ChampLocal from './ChampLocal';
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
  onSupprimer, onModifier, moiId = null, style, scroll,
}) {
  /* LE BROUILLON NE REDESSINE PLUS TOUS LES COMMENTAIRES.
     Il vivait ici, donc chaque lettre redessinait la liste entière — les
     bulles, les avatars, les réponses dépliées : 72 ms par lettre au
     navigateur, processeur bridé six fois. Une publication populaire en a
     cinquante.
     Le texte vit maintenant dans le champ. Ce composant n'apprend que
     lorsqu'il devient vide ou cesse de l'être — pour éteindre le bouton
     d'envoi, et rien d'autre. */
  const champ = useRef(null);
  const [vide, setVide] = useState(true);
  const [repondA, setRepondA] = useState(null);       // { id, auteur }
  const [deplies, setDeplies] = useState(() => new Set());

  const envoyer = () => {
    const texte = (champ.current ? champ.current.lire() : '').trim();
    if (!texte) return;
    onEnvoyer(texte, repondA ? repondA.id : null);
    champ.current.vider();
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
      /* Répondre pré-remplit le champ avec le nom. On lit l'existant pour
         ne pas l'écraser si l'artisan avait déjà commencé à écrire. */
      if (champ.current) {
        const d = champ.current.lire();
        if (!d.startsWith('@')) champ.current.ecrire(`@${c.auteur} `);
      }
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
              /* Figé dès la première réponse — c'est la base qui tient la
                 règle (section 20.1 bis de schema.sql) ; ici on ne fait
                 que cacher un bouton qui serait refusé. */
              fige={reponses.length > 0}
              onVoirProfil={onVoirProfil}
              onSignaler={onSignaler}
              onSupprimer={onSupprimer}
              onModifier={onModifier}
              onRepondre={() => repondre(c)}
            />

            {reponses.length > 1 && !ouvert && (
              <Pressable
                style={s.voirPlus}
                onPress={() => basculer(c.id)}
                accessibilityRole="button"
                accessibilityLabel={`Voir les ${reponses.length} réponses`}
              >
                <Text style={s.voirPlusTexte}>
                  Voir les {reponses.length} réponses
                </Text>
              </Pressable>
            )}

            {/* Une réponse n'a jamais d'enfant (le fil s'arrête à deux
                niveaux) : ce qui la fige, c'est une réponse PLUS RÉCENTE
                dans le même fil. Les réponses arrivent triées par date,
                donc « il y en a une après moi » se lit sur l'indice. */}
            {ouvert && reponses.map((r, i) => (
              <Ligne
                key={String(r.id)}
                c={r}
                reponse
                pros={pros}
                moiId={moiId}
                fige={i < reponses.length - 1}
                onVoirProfil={onVoirProfil}
                onSignaler={onSignaler}
                onSupprimer={onSupprimer}
                onModifier={onModifier}
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
            hitSlop={viser(24)}
            onPress={() => { setRepondA(null); if (champ.current) champ.current.vider(); }}
            accessibilityRole="button"
            accessibilityLabel="Annuler la réponse"
          >
            <X size={13} color={C.muted} />
          </Pressable>
        </View>
      )}

      <View style={s.saisie}>
        <ChampLocal
          ref={champ}
          style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: T.corps }}
          placeholder={repondA ? `Répondre à ${repondA.auteur}...` : 'Ajouter un commentaire...'}
          surSeuil={({ vide: v }) => setVide(v)}
          onSubmitEditing={envoyer}
          returnKeyType="send"
        />
        <Pressable
          style={({ pressed }) => [s.envoyer, vide && { opacity: 0.4 }, pressed && APPUI.discret]}
          onPress={envoyer}
          disabled={vide}
          aria-disabled={vide}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le commentaire"
        >
          <Send size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * UNE LIGNE DE DISCUSSION — et pourquoi il n'y a plus de cadre.
 *
 * Chaque commentaire était enfermé dans un rectangle beige à liseré. C'est
 * une convention de MESSAGERIE — la bulle de chat — posée sur une
 * discussion publique, et elle coûte deux choses :
 *
 *   - de la largeur. Le cadre mange une douzaine de pixels de chaque côté,
 *     et une réponse indentée les perd une deuxième fois : le texte finit
 *     dans une colonne étroite ;
 *   - de la lisibilité. Dix rectangles empilés, l'œil ne sait plus lequel
 *     répond à lequel — le cadre dit « je suis un bloc à part », alors
 *     qu'on veut lire une conversation.
 *
 * Donc : nom en gras, texte à la suite, à même le fond. Et pour les
 * réponses, un FILET VERTICAL de 2 px à gauche. Un trait suffit à dire
 * « ceci répond à ce qui est au-dessus » ; c'est aussi ce qui s'accorde
 * avec la règle d'Opus — l'angle vif porte l'information, l'arrondi
 * flotte, et une discussion n'est ni l'un ni l'autre : elle se lit.
 *
 * `fige` : on ne peut plus corriger un commentaire auquel on a répondu.
 * Le bouton disparaît, mais ce n'est pas lui qui protège — la base refuse
 * l'écriture (code OP001, section 20.1 bis de schema.sql). Un téléphone
 * modifié se ferait renvoyer.
 */
function Ligne({
  c, reponse, pros, moiId, fige = false,
  onVoirProfil, onSignaler, onSupprimer, onModifier, onRepondre,
}) {
  /* La correction se fait SUR PLACE : ouvrir une fenêtre pour changer
     trois lettres ferait perdre le fil de la conversation. */
  const [enEdition, setEnEdition] = useState(false);
  const [brouillon, setBrouillon] = useState(c.texte);
  /* La confirmation se fait DANS la ligne, pas dans une alerte du système :
     une alerte ne se teste pas au navigateur, et elle coupe la lecture. */
  const [confirme, setConfirme] = useState(false);
  const aMoi = !!moiId && !!c.auteurId && String(c.auteurId) === String(moiId);
  const nbReponses = (c.reponses || []).length;
  const pro = pros[c.auteurId];
  const taille = reponse ? 26 : 32;
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
        hitSlop={viser(24)}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Avatar seed={c.auteurId || c.id} size={taille} uri={c.avatarUrl} nom={c.auteur} />
      </Pressable>

      <View style={s.corps}>
        {/* Le nom ET le moment sur la même ligne : l'identité d'un côté,
            la date de l'autre. La ligne du dessous n'a plus alors que des
            VERBES — répondre, modifier, supprimer —, ce qui la rend
            lisible d'un coup d'œil. */}
        <View style={s.entete}>
          <Pressable
            onPress={ouvrir}
            disabled={!cliquable}
            style={s.nomLigne}
            accessibilityRole={cliquable ? 'button' : 'text'}
            accessibilityLabel={cliquable
              ? `Voir la fiche de ${pro ? pro.entreprise : c.auteur}`
              : (pro ? pro.entreprise : c.auteur)}
          >
            <Text style={[s.nom, cliquable && s.nomCliquable]} numberOfLines={1}>
              {pro ? pro.entreprise : c.auteur}
            </Text>
            {pro && pro.verifie && <BadgeCheck size={12} color={C.verif} />}
          </Pressable>
          {!!c.time && <Text style={s.quand}>{c.time}</Text>}
          {/* Le drapeau vient de la BASE : impossible de corriger un
              commentaire en faisant croire qu'il n'a pas bougé. */}
          {!!c.modifie && <Text style={s.quand}>· modifié</Text>}
        </View>

        {enEdition ? (
          <View style={s.edition}>
            <Field
              value={brouillon}
              onChangeText={setBrouillon}
              autoFocus
              multiline
              style={s.champEdition}
              accessibilityLabel="Corriger mon commentaire"
            />
            <View style={s.editionBtns}>
              <Pressable
                onPress={() => { setBrouillon(c.texte); setEnEdition(false); }}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel="Annuler la correction"
              >
                <Text style={s.confirmeNon}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const propre = brouillon.trim();
                  if (propre && propre !== c.texte) onModifier(c, propre);
                  setEnEdition(false);
                }}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel="Enregistrer la correction"
              >
                <Text style={s.confirmeOui}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={s.texte}>{c.texte}</Text>
        )}

        <View style={s.actions}>
          <Pressable
            onPress={onRepondre}
            hitSlop={viser(24)}
            accessibilityRole="button"
            accessibilityLabel={`Répondre à ${pro ? pro.entreprise : c.auteur}`}
          >
            <Text style={s.action}>Répondre</Text>
          </Pressable>
          {/* Le sien, on le retire. Celui des autres, on le signale — et
              JAMAIS on ne le supprime, même sur sa propre publication : la
              règle est tenue par la base, pas par cet écran. */}
          {aMoi && !!onModifier && !fige && !confirme && !enEdition && (
            <Pressable
              onPress={() => { setBrouillon(c.texte); setEnEdition(true); }}
              hitSlop={viser(24)}
              accessibilityRole="button"
              accessibilityLabel="Corriger mon commentaire"
            >
              <Text style={s.action}>Modifier</Text>
            </Pressable>
          )}
          {aMoi && !!onSupprimer && !confirme && !enEdition && (
            <Pressable
              onPress={() => setConfirme(true)}
              hitSlop={viser(24)}
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
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel="Oui, supprimer ce commentaire"
              >
                <Text style={s.confirmeOui}>Oui</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirme(false)}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel="Annuler la suppression"
              >
                <Text style={s.confirmeNon}>Annuler</Text>
              </Pressable>
            </View>
          )}
          {!aMoi && !!onSignaler && !!c.auteurId && (
            <Pressable
              hitSlop={viser(24)}
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
  ligne: { flexDirection: 'row', gap: S.sm, paddingVertical: S.sm - 2 },
  /* Le filet vertical remplace l'indentation nue : il DIT que ce qui suit
     répond à ce qui précède, là où un décalage se confond avec du hasard.
     Deux pixels suffisent — c'est un repère, pas une bordure. */
  ligneReponse: {
    marginLeft: S.lg, paddingLeft: S.md,
    borderLeftWidth: 2, borderLeftColor: C.line,
  },
  corps: { flex: 1, minWidth: 0 },

  entete: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  nomLigne: { flexDirection: 'row', alignItems: 'center', gap: S.xs, flexShrink: 1 },
  nom: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, flexShrink: 1 },
  nomCliquable: { color: C.accent2 },
  quand: { fontFamily: F.inter, fontSize: T.micro, color: C.muted },

  /* Le texte qu'on lit vraiment : la taille « corps » de l'échelle, et son
     interligne. C'est le seul endroit de la ligne où la lecture compte. */
  texte: {
    fontFamily: F.inter, fontSize: T.corps, lineHeight: interligne(T.corps),
    color: C.ink, marginTop: 2,
  },

  actions: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.xs },
  action: { fontFamily: F.inter6, fontSize: T.petit, color: C.muted },
  supprimer: { fontFamily: F.inter5, fontSize: T.petit, color: C.muted },

  confirme: { flexDirection: 'row', alignItems: 'center', gap: S.sm + 2, flexShrink: 1 },
  confirmeTexte: { fontFamily: F.inter, fontSize: T.micro, color: C.muted, flexShrink: 1 },
  confirmeOui: { fontFamily: F.inter6, fontSize: T.petit, color: C.bad },
  confirmeNon: { fontFamily: F.inter5, fontSize: T.petit, color: C.muted },

  edition: { gap: S.xs + 2, marginTop: S.xs },
  champEdition: {
    minHeight: 40, fontFamily: F.inter, fontSize: T.corps,
    paddingVertical: 6, paddingHorizontal: S.sm,
  },
  editionBtns: { flexDirection: 'row', gap: S.lg - 2, justifyContent: 'flex-end' },

  /* « Voir les 3 réponses » est posé sur le MÊME filet que les réponses
     qu'il va ouvrir : le trait continue, donc on comprend où ça mène. */
  voirPlus: {
    marginLeft: S.lg, paddingLeft: S.md, paddingVertical: S.xs,
    borderLeftWidth: 2, borderLeftColor: C.line,
  },
  voirPlusTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.muted },

  vide: { fontFamily: F.inter, fontSize: T.courant, color: C.muted, paddingVertical: S.sm },

  /* Le rappel « Réponse à X » est de la structure : angle vif. */
  reponseA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: S.sm, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
    paddingVertical: 5, paddingHorizontal: S.sm + 1, marginTop: S.sm,
  },
  reponseATexte: { flex: 1, fontFamily: F.inter6, fontSize: T.petit, color: C.muted },

  saisie: { flexDirection: 'row', gap: S.sm - 1, marginTop: S.sm },
  envoyer: {
    backgroundColor: C.ink, paddingHorizontal: S.md,
    alignItems: 'center', justifyContent: 'center',
  },
});
