/**
 * L'assistant qui écrit la présentation de l'artisan.
 *
 * CE QU'IL RÉSOUT
 * ---------------
 * La case « Présentation » reste vide sur la moitié des profils, et c'est
 * précisément elle qui décide un particulier qui hésite entre deux devis.
 * Ce n'est pas de la paresse : personne n'aime parler de soi, et un artisan
 * remplit ce champ debout sur un chantier.
 *
 * CE QUE CE N'EST PAS
 * -------------------
 * Pas une discussion avec un robot. Cinq questions, des réponses à toucher,
 * deux champs libres courts. On répond en trente secondes, et on obtient
 * trois textes au choix — pas un seul, parce qu'un texte unique se lit comme
 * une obligation, alors que devant trois on choisit et on corrige.
 *
 * SANS IA, ÇA MARCHE QUAND MÊME
 * -----------------------------
 * Les trois textes sont écrits par l'application elle-même (voir
 * src/lib/presentation.js). Quand l'Edge Function Anthropic est branchée,
 * elle les remplace par des versions mieux tournées — et l'écran dit
 * lequel des deux a écrit. Une fonction qui ne marche qu'à moitié du temps
 * n'est pas utilisée : l'IA améliore, elle ne conditionne pas.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMain, BtnMini, Chip, TextArea } from './ui';
import { Sparkles, Check, X } from './icons';
import { QUESTIONS, redigerLocalement, assezRempli } from '../lib/presentation';
import { aiRedigerPresentation } from '../lib/ai';

export default function AssistantPresentation({ profil, onUtiliser, onFermer }) {
  const [reponses, setReponses] = useState({ qualites: [] });
  const [propositions, setPropositions] = useState(null);
  const [parIA, setParIA] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [noteIA, setNoteIA] = useState(null);

  const repondre = (cle, valeur) => setReponses((r) => ({ ...r, [cle]: valeur }));

  const basculerQualite = (cle) => setReponses((r) => {
    const actuelles = r.qualites || [];
    return {
      ...r,
      qualites: actuelles.includes(cle)
        ? actuelles.filter((q) => q !== cle)
        : [...actuelles, cle].slice(0, 4),   // au-delà de quatre, la phrase ne se lit plus
    };
  });

  const rediger = async () => {
    /* On écrit D'ABORD la version locale : même si l'IA échoue, l'artisan
       repart avec quelque chose. C'est tout l'intérêt de cet ordre. */
    const locales = redigerLocalement({ profil, reponses });
    setPropositions(locales);
    setParIA(false);
    setNoteIA(null);

    setEnCours(true);
    try {
      const mieux = await aiRedigerPresentation({ profil, reponses });
      if (mieux.length) { setPropositions(mieux); setParIA(true); }
    } catch (e) {
      setNoteIA(
        "L'assistant IA n'est pas joignable — voici les textes écrits par "
        + "l'application. Ils sont modifiables, comme les autres.",
      );
    } finally {
      setEnCours(false);
    }
  };

  const pret = assezRempli(reponses);

  return (
    <View style={s.cadre}>
      <View style={s.entete}>
        <Sparkles size={14} color={C.accent2} />
        <Text style={s.enteteTexte}>Écrire ma présentation</Text>
        <Pressable onPress={onFermer} hitSlop={10} style={{ marginLeft: 'auto' }}>
          <X size={15} color={C.muted} />
        </Pressable>
      </View>

      <Text style={s.intro}>
        Cinq questions, trente secondes. Rien de ce que vous répondez n'est
        publié tel quel : vous relisez et vous corrigez avant d'enregistrer.
      </Text>

      {QUESTIONS.map((q) => (
        <View key={q.cle} style={s.question}>
          <Text style={s.questionTitre}>
            {q.titre}
            {q.facultatif && <Text style={s.facultatif}>  facultatif</Text>}
          </Text>

          {q.libre ? (
            <TextArea
              style={{ minHeight: 44 }}
              value={reponses[q.cle] || ''}
              onChangeText={(t) => repondre(q.cle, t)}
              placeholder={q.exemple}
            />
          ) : (
            <View style={s.chipRow}>
              {q.choix.map((c) => (
                <Chip
                  key={c.cle}
                  label={c.label}
                  on={q.multiple
                    ? (reponses.qualites || []).includes(c.cle)
                    : reponses[q.cle] === c.cle}
                  onPress={() => (q.multiple ? basculerQualite(c.cle) : repondre(q.cle, c.cle))}
                />
              ))}
            </View>
          )}
        </View>
      ))}

      <BtnMain block onPress={rediger} disabled={!pret || enCours}>
        {enCours ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={s.btnTexte}>L'assistant met en forme...</Text>
          </>
        ) : (
          <Text style={s.btnTexte}>
            {propositions ? 'Réécrire' : 'Écrire ma présentation'}
          </Text>
        )}
      </BtnMain>

      {!pret && (
        <Text style={s.manque}>
          Répondez au moins aux trois premières questions.
        </Text>
      )}

      {propositions && (
        <View style={s.resultats}>
          <Text style={s.resultatsTitre}>
            {parIA
              ? 'Trois propositions, mises en forme par l’assistant IA'
              : 'Trois propositions, écrites par l’application'}
          </Text>
          {!!noteIA && <Text style={s.note}>{noteIA}</Text>}

          {propositions.map((p) => (
            <View key={p.titre} style={s.proposition}>
              <Text style={s.propositionTitre}>{p.titre}</Text>
              <Text style={s.propositionTexte}>{p.texte}</Text>
              <View style={s.propositionBas}>
                <BtnMini onPress={() => onUtiliser(p.texte)}>
                  <Check size={12} color="#111" />
                  <Text style={s.utiliserTexte}>Utiliser ce texte</Text>
                </BtnMini>
              </View>
            </View>
          ))}

          <Text style={s.rappel}>
            Le texte choisi arrive dans le champ « Présentation ». Relisez-le :
            c'est vous qu'il décrit, et c'est lui qu'on lira avant de vous
            appeler.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  cadre: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent2,
    padding: 12, marginTop: 8,
  },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  enteteTexte: { fontFamily: F.oswald6, fontSize: 12.5, color: C.accent2 },
  intro: { fontFamily: F.inter, fontSize: 11.5, color: C.muted, lineHeight: 17, marginBottom: 12 },

  question: { marginBottom: 12 },
  questionTitre: { fontFamily: F.oswald6, fontSize: 12, color: C.ink, marginBottom: 6 },
  facultatif: { fontFamily: F.inter, fontSize: 10.5, color: C.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  btnTexte: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },
  manque: { fontFamily: F.inter, fontSize: 11, color: C.muted, marginTop: 6 },

  resultats: { marginTop: 14, gap: 10 },
  resultatsTitre: { fontFamily: F.oswald6, fontSize: 12, color: C.ink },
  note: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16 },

  proposition: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, padding: 10, gap: 6 },
  propositionTitre: { fontFamily: F.oswald6, fontSize: 11, color: C.accent },
  propositionTexte: { fontFamily: F.inter, fontSize: 12.5, color: C.ink, lineHeight: 18 },
  propositionBas: { flexDirection: 'row', justifyContent: 'flex-end' },
  utiliserTexte: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },

  rappel: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16 },
});
