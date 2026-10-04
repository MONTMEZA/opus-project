/**
 * LES DEUX CÔTÉS D'UNE RÉPONSE À UNE ANNONCE.
 *
 * CE QUE CE FICHIER RÉPARE — relevé le 04/10/2026
 * -----------------------------------------------
 * La Place des pros écrivait sans jamais relire, exactement comme les
 * demandes de devis du 01/10 :
 *
 *   * l'auteur d'une annonce voyait « 3 réponses » et ne pouvait ni savoir
 *     QUI avait répondu, ni lire quoi que ce soit. Appuyer dessus ne
 *     faisait rien ;
 *   * `annonce_reponses.message` n'était jamais rempli — l'application
 *     appelait `repondreAnnonce(id, null)` ;
 *   * répondre posait une AMORCE dans la conversation, c'est-à-dire un
 *     brouillon. Abandonné — ce que fait la moitié des gens —, le compteur
 *     montait et personne n'appelait jamais.
 *
 * DEUX FEUILLES, ET ELLES NE SE RESSEMBLENT PAS
 * ---------------------------------------------
 *   `EcrireReponse` — ce qu'on dit quand on répond. Une annonce de
 *   sous-traitance se gagne sur trois lignes : « disponible sur ces dates,
 *   28 €/m², j'ai l'échafaudage ». Un « Bonjour » tout seul oblige l'autre
 *   à redemander, et il ne redemande pas.
 *
 *   `ListeReponses` — ce qu'on lit quand on en reçoit. L'auteur trie :
 *   trois réponses, un coup d'œil, et il ouvre la bonne. D'où le message
 *   AFFICHÉ dans la liste, pas seulement un nom — sinon il faut ouvrir
 *   trois conversations pour choisir.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal, View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { C, F, T, S, R, APPUI, interligne, viser } from '../theme';
import { Avatar, BtnMain, BtnMini, TextArea, EmptyState } from './ui';
import { X, BadgeCheck, MessageCircle } from './icons';
import { libelleMetiers } from '../lib/metiers';
import { reponsesAnnonce } from '../lib/api';
import { messageClair } from '../lib/erreurs';
import * as retour from '../lib/retour';

/* La feuille est la même partout dans le projet : voir `Signaler` et
   `ChoixPiece`. Un fond sombre qui ferme au toucher, une surface blanche
   collée en bas, et le titre à gauche avec la croix à droite. */
function Feuille({ titre, onFermer, children }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFermer}>
      <Pressable style={s.fond} onPress={onFermer} accessibilityLabel="Fermer" />
      <View style={s.ancrage}>
        <View style={s.feuille}>
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
          {children}
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------------------------------------------------- */

export function EcrireReponse({ annonce, onEnvoyer, onFermer }) {
  /* L'AMORCE RAPPELLE L'ANNONCE, parce qu'un artisan qui reçoit « Bonjour »
     tout court doit redemander de quoi il s'agit — et il a trois annonces
     en cours. Elle reste effaçable : c'est une amorce, pas un texte
     imposé. */
  const [texte, setTexte] = useState(
    annonce ? `Bonjour, au sujet de votre annonce « ${annonce.titre} ». ` : '',
  );
  const [enCours, setEnCours] = useState(false);

  if (!annonce) return null;

  const envoyer = async () => {
    if (enCours || !texte.trim()) return;
    setEnCours(true);
    try {
      /* ON VIBRE POUR CE QU'ON NE REGARDE PAS : le message part, et
         l'écran change juste après. `decision()` est la secousse des gestes
         qu'on valide — la doctrine est dans `src/lib/retour.js`, et il n'y
         a qu'une porte vers le vibreur. */
      retour.decision();
      await onEnvoyer(texte.trim());
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Feuille titre="Répondre" onFermer={onFermer}>
      <Text style={s.aide}>
        Dites ce qui compte en trois lignes : vos disponibilités, votre prix,
        ce que vous apportez. Votre message part directement dans la
        messagerie.
      </Text>

      <TextArea
        value={texte}
        onChangeText={setTexte}
        placeholder="Disponible sur ces dates, 28 €/m², j’ai l’échafaudage."
        style={{ minHeight: 110 }}
        autoFocus
      />

      <BtnMain block onPress={envoyer} disabled={enCours || !texte.trim()}>
        {enCours
          ? <ActivityIndicator size="small" color={C.surAccent} />
          : <MessageCircle size={14} color={C.surAccent} />}
        <Text style={s.btnTexte}>{enCours ? 'Envoi…' : 'Envoyer'}</Text>
      </BtnMain>
    </Feuille>
  );
}

/* --------------------------------------------------------------------- */

export function ListeReponses({ annonce, onEcrire, onVoirProfil, onFermer, onErreur }) {
  /* L'ÉTAT PORTE L'IDENTIFIANT DE CE QU'IL CONTIENT, et pas seulement la
     liste. Remettre `null` au début de l'effet pour dire « ça charge »
     déclenche un rendu en cascade, que le compilateur React refuse à juste
     titre : on lit donc « ça charge » en comparant l'annonce demandée à
     celle qui est chargée. Rien à remettre à zéro, rien à synchroniser. */
  const [charge, setCharge] = useState({ id: null, liste: [] });
  const annonceId = annonce ? annonce.id : null;
  const enCours = charge.id !== annonceId;

  /* `useCallback` SANS `onErreur` DANS SES DÉPENDANCES : cette fonction est
     recréée à chaque rendu de l'écran parent, et la mettre ici relancerait
     le chargement en boucle. C'est le défaut trouvé le 03/10 dans
     `AdminScreen`, où la liste se chargeait deux fois. */
  const lire = useCallback(async (id) => reponsesAnnonce(id), []);

  useEffect(() => {
    if (!annonceId) return undefined;
    let vivant = true;
    lire(annonceId)
      .then((r) => { if (vivant) setCharge({ id: annonceId, liste: r }); })
      .catch((e) => {
        if (!vivant) return;
        /* On marque quand même l'annonce comme chargée : sinon l'écran
           resterait sur « Chargement… » pour toujours, et c'est le défaut
           des quatre états du 01/10 — un écran qui a l'air vivant pendant
           qu'il ne se passe plus rien. */
        setCharge({ id: annonceId, liste: [] });
        if (onErreur) onErreur(messageClair(e, 'Les réponses n’ont pas pu être chargées'));
      });
    return () => { vivant = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonceId, lire]);

  if (!annonce) return null;

  return (
    <Feuille titre={`Réponses à « ${annonce.titre} »`} onFermer={onFermer}>
      {enCours ? (
        <EmptyState>Chargement…</EmptyState>
      ) : charge.liste.length === 0 ? (
        /* UN VIDE QUI EXPLIQUE. « Aucune réponse » tout court laisse croire
           que l'annonce ne marche pas ; elle vient peut-être d'être
           posée. */
        <EmptyState>
          Personne n’a encore répondu. Les annonces qui donnent des dates et
          un prix reçoivent des réponses plus vite.
        </EmptyState>
      ) : (
        <FlatList
          data={charge.liste}
          keyExtractor={(r) => String(r.id)}
          style={{ maxHeight: 420 }}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          ItemSeparatorComponent={() => <View style={s.trait} />}
          renderItem={({ item: r }) => (
            <Ligne r={r} onEcrire={onEcrire} onVoirProfil={onVoirProfil} />
          )}
        />
      )}
    </Feuille>
  );
}

/* Mémorisée : dans une liste, React redessine chaque ligne visible dès que
   l'écran bouge, même celles qui n'ont pas changé d'un pixel. */
const Ligne = React.memo(function Ligne({ r, onEcrire, onVoirProfil }) {
  const p = r.auteur;
  if (!p) return null;
  return (
    <View style={s.ligne}>
      <Pressable
        style={({ pressed }) => [s.qui, pressed && APPUI.discret]}
        onPress={() => onVoirProfil && onVoirProfil(p.id)}
        accessibilityRole="button"
        accessibilityLabel={`Voir la fiche de ${p.entreprise}`}
      >
        <Avatar uri={p.avatarUrl} seed={p.id} nom={p.entreprise} size={34} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.nomRangee}>
            <Text style={s.nom} numberOfLines={1}>{p.entreprise}</Text>
            {p.verifie && <BadgeCheck size={12} color={C.verif} />}
          </View>
          {/* La VILLE se coupe avant l'heure : « il y a 2 h » est plus utile
              que la fin du nom d'une commune. Règle du lot 5. */}
          <Text style={s.meta} numberOfLines={1}>
            {libelleMetiers(p)} · {p.ville} · {r.time}
          </Text>
        </View>
      </Pressable>

      {!!r.message && <Text style={s.message}>{r.message}</Text>}

      <View style={s.actions}>
        <BtnMini outline label="Écrire" onPress={() => onEcrire && onEcrire(p)} />
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  fond: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  ancrage: { flex: 1, justifyContent: 'flex-end' },
  feuille: {
    backgroundColor: C.surface, width: '100%',
    padding: S.lg, paddingBottom: S.xl, gap: S.sm,
  },
  haut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: S.sm,
  },
  titre: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  aide: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    lineHeight: interligne(T.courant),
  },
  btnTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.surAccent },

  trait: { height: 1, backgroundColor: C.line, marginVertical: S.md },
  ligne: { gap: S.sm },
  qui: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: 44 },
  nomRangee: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  nom: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.courant, color: C.ink },
  meta: { fontFamily: F.inter, fontSize: T.micro, color: C.muted },
  /* Le message PORTE l'information : angle vif, comme toute structure. */
  message: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.line,
    padding: S.md, borderRadius: R.vif,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
