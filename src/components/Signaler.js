/**
 * Signaler un contenu, et bloquer son auteur.
 *
 * DEUX GESTES DIFFÉRENTS, DANS LE MÊME ENDROIT
 * --------------------------------------------
 *   - SIGNALER dit « ce contenu pose un problème », et part chez celui qui
 *     modère. C'est un acte public dont on ne voit pas l'effet tout de suite ;
 *   - BLOQUER dit « je ne veux plus voir cette personne », et agit
 *     immédiatement, rien que pour soi.
 *
 * Les confondre est l'erreur la plus courante des applications. Quelqu'un
 * qui subit du harcèlement veut d'abord que ça S'ARRÊTE — donc bloquer — et
 * ensuite, peut-être, que ce soit puni. Les deux sont donc proposés
 * ensemble, mais nommés distinctement, avec ce que chacun fait vraiment.
 *
 * ON ANNONCE UN DÉLAI, ET ON LE TIENT
 * -----------------------------------
 * « Nous examinons sous 48 heures » est une promesse contrôlée par Apple et
 * Google. Elle est écrite une seule fois, dans src/data/moderation.js, pour
 * que l'écran et la réalité ne puissent pas diverger.
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { C, F, T, S, R } from '../theme';
import { BtnMain, BtnMini, TextArea } from './ui';
import { X, Check, Flag, EyeOff } from './icons';
import { MOTIFS, cibleDe, DELAI_EXAMEN_HEURES } from '../data/moderation';

export default function Signaler({
  ouvert, cibleType = 'publication', cibleId, auteurId, auteurNom, extrait,
  onFermer, onSignaler, onBloquer,
}) {
  const [motif, setMotif] = useState(null);
  const [details, setDetails] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [fait, setFait] = useState(null);
  const [erreur, setErreur] = useState(null);

  if (!ouvert) return null;

  const cible = cibleDe(cibleType);
  const choisi = MOTIFS.find((m) => m.cle === motif);
  /* « Autre » sans explication ne dit rien à celui qui modère : c'est le
     seul motif où le texte est exigé. */
  const manqueTexte = motif === 'autre' && details.trim().length < 5;

  const fermer = () => {
    setMotif(null); setDetails(''); setFait(null); setErreur(null);
    onFermer();
  };

  const envoyer = async () => {
    if (!motif || manqueTexte) return;
    setEnCours(true); setErreur(null);
    try {
      await onSignaler({
        cibleType, cibleId, cibleAuteurId: auteurId, extrait, motif, details: details.trim() || null,
      });
      setFait('signale');
    } catch (e) {
      setErreur((e && e.message) || "Le signalement n'a pas pu être envoyé.");
    }
    setEnCours(false);
  };

  const bloquer = async () => {
    setEnCours(true); setErreur(null);
    try {
      await onBloquer(auteurId);
      setFait('bloque');
    } catch (e) {
      setErreur((e && e.message) || "Le blocage n'a pas pu être enregistré.");
    }
    setEnCours(false);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={fermer}>
      <View style={s.fond}>
        <View style={s.feuille}>
          <View style={s.haut}>
            <Text style={s.titre}>
              {fait ? 'C’est fait' : `Signaler ${cible.label}`}
            </Text>
            <Pressable onPress={fermer} hitSlop={12}><X size={18} color={C.muted} /></Pressable>
          </View>

          {fait === 'signale' && (
            <View style={s.confirmation}>
              <Check size={18} color={C.ok} />
              <Text style={s.confirmationTexte}>
                Votre signalement est parti. Il sera examiné sous
                {' '}{DELAI_EXAMEN_HEURES} heures. Vous ne recevrez pas
                forcément de réponse, mais il sera lu.
              </Text>
              {!!auteurId && (
                <BtnMini outline onPress={bloquer} disabled={enCours}>
                  <EyeOff size={12} color={C.ink} />
                  <Text style={s.bloquerTexte}>
                    Bloquer aussi {auteurNom || 'cette personne'}
                  </Text>
                </BtnMini>
              )}
            </View>
          )}

          {fait === 'bloque' && (
            <View style={s.confirmation}>
              <Check size={18} color={C.ok} />
              <Text style={s.confirmationTexte}>
                {auteurNom || 'Cette personne'} est bloquée. Vous ne verrez plus
                rien de ce compte, il ne verra plus rien du vôtre, et aucun
                message ne peut plus passer entre vous. Vous pouvez revenir sur
                ce blocage à tout moment depuis Profil → Confidentialité et
                sécurité.
              </Text>
            </View>
          )}

          {!fait && (
            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              <Text style={s.aide}>
                Dites ce qui ne va pas. Plus c’est précis, plus c’est traité
                vite — c’est un humain qui lira.
              </Text>

              <View style={s.motifs}>
                {MOTIFS.map((m) => {
                  const on = motif === m.cle;
                  return (
                    <Pressable
                      key={m.cle}
                      style={[s.motif, on && s.motifOn]}
                      onPress={() => setMotif(on ? null : m.cle)}
                    >
                      <Text style={[s.motifLabel, on && { color: '#fff' }]}>{m.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {!!choisi && <Text style={s.motifAide}>{choisi.aide}</Text>}

              {!!motif && (
                <TextArea
                  value={details}
                  onChangeText={setDetails}
                  placeholder={motif === 'autre'
                    ? 'Expliquez en quelques mots (obligatoire).'
                    : 'Ajoutez un détail, si vous en avez un.'}
                  style={{ marginTop: S.sm }}
                />
              )}

              {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

              <BtnMain
                block
                disabled={!motif || manqueTexte || enCours}
                onPress={envoyer}
              >
                {enCours
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Flag size={13} color="#fff" />}
                <Text style={s.envoyerTexte}>
                  {enCours ? 'Envoi…' : 'Envoyer le signalement'}
                </Text>
              </BtnMain>

              {!!auteurId && (
                <>
                  <View style={s.separation} />
                  <Text style={s.aide}>
                    Vous voulez surtout que ça s’arrête ? Bloquer agit tout de
                    suite, rien que pour vous, et n’a pas besoin d’être examiné.
                  </Text>
                  <BtnMini outline onPress={bloquer} disabled={enCours} style={{ alignSelf: 'flex-start' }}>
                    <EyeOff size={12} color={C.ink} />
                    <Text style={s.bloquerTexte}>
                      Bloquer {auteurNom || 'cette personne'}
                    </Text>
                  </BtnMini>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  feuille: {
    backgroundColor: C.surface, width: '100%',
    padding: S.lg, paddingBottom: 26, gap: S.sm,
  },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },

  aide: { fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: 18, marginTop: S.xs },

  motifs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.md },
  motif: {
    paddingVertical: 7, paddingHorizontal: S.md, borderRadius: R.gelule,
    borderWidth: 1, borderColor: C.line, backgroundColor: C.bg,
  },
  motifOn: { backgroundColor: C.ink, borderColor: C.ink },
  motifLabel: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  motifAide: { fontFamily: F.inter, fontSize: T.petit, color: C.accent2, lineHeight: 17, marginTop: S.sm },

  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: 17, marginTop: S.sm },
  envoyerTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: '#fff' },

  separation: { height: 1, backgroundColor: C.line, marginVertical: S.lg },
  bloquerTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },

  confirmation: {
    backgroundColor: C.okBg, borderLeftWidth: 3, borderLeftColor: C.ok,
    padding: S.md, gap: S.sm, marginTop: S.sm,
  },
  confirmationTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: 19 },
});
