/**
 * Confidentialité et sécurité — tout ce qu'on a le droit de faire sur ses
 * propres données, au même endroit.
 *
 * POURQUOI UN SEUL ÉCRAN
 * ----------------------
 * Le RGPD donne des droits (accès, portabilité, effacement) que la plupart
 * des applications enterrent dans un formulaire de contact, ou pire, dans un
 * courriel à envoyer. Ici tout s'exerce en deux touches, sans demander la
 * permission à personne : c'est la lettre du texte, et c'est aussi ce qu'on
 * ferait par simple honnêteté.
 *
 * LA SUPPRESSION DEMANDE UNE CONFIRMATION ÉCRITE
 * ----------------------------------------------
 * Pas une case à cocher : il faut TAPER le mot. Un geste irréversible ne doit
 * pas pouvoir se faire avec le pouce qui glisse. C'est la seule friction
 * volontaire de cet écran — partout ailleurs, on ne freine pas quelqu'un qui
 * veut partir.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Share, StyleSheet,
} from 'react-native';
import { C, F, T, S, R, interligne } from '../theme';
import {
  Avatar, BtnMain, BtnMini, BtnOutline, Field, EmptyState, SectionLabel,
} from '../components/ui';
import {
  EyeOff, Flag, Download, Trash, ChevronRight, Check, AlertTriangle, Scale,
} from '../components/icons';
import { motifDe, cibleDe, DELAI_EXAMEN_HEURES } from '../data/moderation';
import { TITRES_LEGAUX } from './LegalScreen';

/** Le mot à taper pour supprimer. En majuscules : on ne le tape pas par hasard. */
const MOT_DE_PASSE_DE_SORTIE = 'SUPPRIMER';

export default function ConfidentialiteScreen({
  onCharger, onDebloquer, onExporter, onSupprimer, onLire, onErreur,
}) {
  const [blocages, setBlocages] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [exportEnCours, setExportEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [mot, setMot] = useState('');
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    let vivant = true;
    (async () => {
      try {
        const { blocages: b, signalements: sg } = await onCharger();
        if (!vivant) return;
        setBlocages(b); setSignalements(sg);
      } catch (e) {
        if (vivant) onErreur((e && e.message) || 'Chargement impossible.');
      }
      if (vivant) setChargement(false);
    })();
    return () => { vivant = false; };
  }, []);

  const debloquer = async (id) => {
    try {
      await onDebloquer(id);
      setBlocages((liste) => liste.filter((b) => b.id !== id));
    } catch (e) {
      onErreur((e && e.message) || 'Le déblocage a échoué.');
    }
  };

  /**
   * L'export passe par le partage du système : c'est ce qui permet de
   * l'envoyer où on veut — courriel, notes, stockage en ligne — sans qu'Opus
   * ait à choisir à la place de la personne.
   */
  const exporter = async () => {
    setExportEnCours(true);
    try {
      const donnees = await onExporter();
      await Share.share({
        title: 'Mes données Opus',
        message: JSON.stringify(donnees, null, 2),
      });
    } catch (e) {
      onErreur((e && e.message) || "L'export a échoué.");
    }
    setExportEnCours(false);
  };

  const supprimer = async () => {
    if (mot.trim().toUpperCase() !== MOT_DE_PASSE_DE_SORTIE) return;
    setSuppressionEnCours(true);
    try {
      await onSupprimer();
    } catch (e) {
      onErreur((e && e.message) || 'La suppression a échoué.');
      setSuppressionEnCours(false);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* --- les textes légaux --- */}
      <SectionLabel>Les textes</SectionLabel>
      <View style={s.bloc}>
        {Object.entries(TITRES_LEGAUX).map(([cle, titre], i, tout) => (
          <Pressable
            key={cle}
            style={[s.ligne, i === tout.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => onLire(cle)}
          >
            <Scale size={15} color={C.accent2} />
            <Text style={s.ligneTexte}>{titre}</Text>
            <ChevronRight size={15} color={C.muted} />
          </Pressable>
        ))}
      </View>

      {/* --- personnes bloquées --- */}
      <SectionLabel>Personnes bloquées</SectionLabel>
      <Text style={s.aide}>
        Vous ne voyez plus rien de ces comptes, ils ne voient plus rien du
        vôtre, et aucun message ne passe entre vous. Le blocage se retire
        quand vous le voulez.
      </Text>
      <View style={s.bloc}>
        {chargement && <ActivityIndicator style={{ margin: S.lg }} color={C.muted} />}
        {!chargement && blocages.length === 0 && (
          <EmptyState>Vous n’avez bloqué personne.</EmptyState>
        )}
        {blocages.map((b, i) => (
          <View key={String(b.id)} style={[s.ligne, i === blocages.length - 1 && { borderBottomWidth: 0 }]}>
            <Avatar seed={b.id} uri={b.avatarUrl} size={32} />
            <Text style={s.ligneTexte} numberOfLines={1}>{b.nom}</Text>
            <BtnMini outline label="Débloquer" onPress={() => debloquer(b.id)} />
          </View>
        ))}
      </View>

      {/* --- signalements déposés --- */}
      <SectionLabel>Mes signalements</SectionLabel>
      <Text style={s.aide}>
        Chaque signalement est examiné sous {DELAI_EXAMEN_HEURES} heures par un
        humain. Vous ne recevez pas forcément de réponse — mais il est lu, et
        vous voyez ici où il en est.
      </Text>
      <View style={s.bloc}>
        {!chargement && signalements.length === 0 && (
          <EmptyState>Vous n’avez rien signalé.</EmptyState>
        )}
        {signalements.map((sg, i) => (
          <View key={String(sg.id)} style={[s.ligne, i === signalements.length - 1 && { borderBottomWidth: 0 }]}>
            <Flag size={14} color={C.muted} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.ligneTexte} numberOfLines={1}>
                {motifDe(sg.motif).label} — {cibleDe(sg.cible_type).label}
              </Text>
              <Text style={s.ligneMeta}>{libelleStatut(sg.statut)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* --- récupérer ses données --- */}
      <SectionLabel>Mes données</SectionLabel>
      <Text style={s.aide}>
        Vous pouvez récupérer tout ce qu’Opus conserve à votre sujet, dans un
        fichier lisible et réutilisable ailleurs. C’est votre droit d’accès et
        de portabilité (RGPD, articles 15 et 20).
      </Text>
      <View style={{ paddingHorizontal: S.lg }}>
        <BtnOutline
          label={exportEnCours ? 'Préparation…' : 'Récupérer mes données'}
          onPress={exporter}
        />
      </View>

      {/* --- supprimer son compte --- */}
      <SectionLabel>Supprimer mon compte</SectionLabel>
      <View style={s.danger}>
        <View style={s.dangerHaut}>
          <AlertTriangle size={15} color={C.bad} />
          <Text style={s.dangerTitre}>C’est définitif</Text>
        </View>
        <Text style={s.dangerTexte}>
          Vos publications, vos demandes, vos annonces, vos messages et vos
          fichiers sont effacés immédiatement. Rien n’est récupérable ensuite,
          par personne.
          {'\n\n'}
          Les avis et commentaires que vous avez laissés chez d’autres sont
          CONSERVÉS, mais détachés de votre nom. Les effacer reviendrait à
          faire remonter la note d’un artisan le jour où un client mécontent
          s’en va : ce serait modifier l’historique de quelqu’un qui n’a rien
          demandé.
        </Text>

        {!confirmation ? (
          <BtnMini outline onPress={() => setConfirmation(true)} style={{ alignSelf: 'flex-start' }}>
            <Trash size={12} color={C.bad} />
            <Text style={s.dangerBouton}>Supprimer mon compte</Text>
          </BtnMini>
        ) : (
          <View style={{ gap: S.sm }}>
            <Text style={s.dangerTexte}>
              Pour confirmer, tapez {MOT_DE_PASSE_DE_SORTIE} ci-dessous. Ce
              n’est pas une formalité : un geste sans retour ne doit pas
              pouvoir se faire d’un pouce qui glisse.
            </Text>
            <Field
              value={mot}
              onChangeText={setMot}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={MOT_DE_PASSE_DE_SORTIE}
            />
            <View style={s.dangerBoutons}>
              <BtnMini
                outline
                label="Annuler"
                onPress={() => { setConfirmation(false); setMot(''); }}
              />
              <BtnMain
                disabled={mot.trim().toUpperCase() !== MOT_DE_PASSE_DE_SORTIE || suppressionEnCours}
                onPress={supprimer}
                style={{ backgroundColor: C.bad }}
              >
                {suppressionEnCours
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Check size={13} color="#fff" />}
                <Text style={s.dangerConfirmer}>
                  {suppressionEnCours ? 'Suppression…' : 'Oui, supprimer'}
                </Text>
              </BtnMain>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function libelleStatut(statut) {
  if (statut === 'en_examen') return 'En cours d’examen';
  if (statut === 'traite') return 'Traité';
  if (statut === 'rejete') return 'Examiné, sans suite';
  return 'Reçu, en attente d’examen';
}

const s = StyleSheet.create({
  page: { flex: 1 },

  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), paddingHorizontal: S.lg, paddingBottom: S.sm,
  },

  bloc: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    marginHorizontal: S.lg,
  },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: S.md, paddingHorizontal: S.md,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  ligneTexte: { flex: 1, fontFamily: F.inter5, fontSize: T.courant, color: C.ink },
  ligneMeta: { fontFamily: F.inter, fontSize: T.micro, color: C.muted, marginTop: 2 },

  danger: {
    backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.bad,
    marginHorizontal: S.lg, padding: S.md, gap: S.md,
  },
  dangerHaut: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dangerTitre: { fontFamily: F.oswald6, fontSize: T.courant, color: C.bad },
  dangerTexte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant) + 2,
  },
  dangerBouton: { fontFamily: F.oswald6, fontSize: T.petit, color: C.bad },
  dangerBoutons: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  dangerConfirmer: { fontFamily: F.oswald6, fontSize: T.courant, color: '#fff' },
});
