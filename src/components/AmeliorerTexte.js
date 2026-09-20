/**
 * « Améliorer avec l'IA » — le même bloc partout où l'artisan écrit.
 *
 * L'IDÉE
 * ------
 * L'artisan écrit avec ses mots, comme il parle, souvent debout sur un
 * chantier. Il appuie sur le bouton, et l'IA lui rend le même propos remis
 * d'aplomb : les fautes corrigées, la ponctuation en place, l'ordre revu.
 * Elle ne remplace pas son texte, elle le relit.
 *
 * CE QUI FAIT TOUTE LA DIFFÉRENCE
 * -------------------------------
 * La consigne, côté serveur, lui interdit la phrase passe-partout. « Un
 * travail soigné dans les règles de l'art » pourrait servir à n'importe
 * lequel des artisans de l'application : ça ne met personne en avant.
 * « Dalle de 40 m² coulée et lissée, béton lissé » ne parle que de lui.
 * Son vocabulaire de métier — IPN, chape, mur porteur — est conservé tel
 * quel : c'est son autorité.
 *
 * SANS IA, LE BOUTON FAIT QUAND MÊME QUELQUE CHOSE
 * ------------------------------------------------
 * Hors réseau ou si le service est indisponible, la mise en forme
 * typographique s'applique seule : majuscules, espaces, ponctuation
 * française. C'est modeste, mais c'est ce qui distingue le plus visiblement
 * un texte soigné d'un texte tapé au pouce. Et l'écran DIT que l'IA n'est
 * pas intervenue — annoncer une amélioration qui n'a pas eu lieu est la
 * meilleure façon de perdre la confiance de quelqu'un.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMini } from './ui';
import { Sparkles, Check, X } from './icons';
import { nettoyerTypographie, aChange } from '../lib/typographie';
import { aiAmeliorerTexte } from '../lib/ai';

/** En dessous, il n'y a pas de matière : on ne réécrit pas trois mots. */
export const MINIMUM = 10;

export default function AmeliorerTexte({
  texte, contexte = 'publication', profil = {}, onRemplacer, compact = false,
}) {
  const [propositions, setPropositions] = useState(null);
  const [parIA, setParIA] = useState(false);
  const [note, setNote] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const assezEcrit = String(texte || '').trim().length >= MINIMUM;

  const ameliorer = async () => {
    setEnCours(true);
    setNote(null);

    /* On applique D'ABORD la mise en forme locale. Même si l'IA échoue,
       l'artisan repart avec quelque chose — c'est tout l'intérêt de cet
       ordre, et c'est ce qui rend le bouton fiable. */
    const propre = nettoyerTypographie(texte);
    const locales = aChange(texte, propre)
      ? [{ titre: 'Mise en forme', texte: propre }]
      : [];
    setPropositions(locales);
    setParIA(false);

    try {
      const mieux = await aiAmeliorerTexte({ texte, contexte, profil });
      if (mieux.length) {
        setPropositions(mieux);
        setParIA(true);
      } else {
        setNote("L'assistant n'a rien trouvé à reprendre.");
      }
    } catch (e) {
      const message = (e && e.message) ? e.message : '';
      setNote(locales.length
        ? `${message || "L'assistant IA n'est pas joignable."} Voici la mise en forme seule.`
        : `${message || "L'assistant IA n'est pas joignable."} Votre texte est déjà bien présenté.`);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <View style={compact ? null : s.bloc}>
      <View style={s.ligne}>
        <BtnMini outline onPress={ameliorer} disabled={!assezEcrit || enCours}>
          {enCours ? (
            <ActivityIndicator size="small" color={C.accent2} />
          ) : (
            <Sparkles size={12} color={assezEcrit ? C.accent2 : C.muted} />
          )}
          <Text style={[s.boutonTexte, !assezEcrit && { color: C.muted }]}>
            {enCours ? 'Relecture...' : 'Améliorer avec l’IA'}
          </Text>
        </BtnMini>

        {propositions && (
          <Pressable onPress={() => { setPropositions(null); setNote(null); }} hitSlop={10}>
            <X size={14} color={C.muted} />
          </Pressable>
        )}
      </View>

      {!assezEcrit && (
        <Text style={s.aide}>
          Écrivez d'abord quelques mots, comme vous le diriez. L'assistant
          part de VOS mots — il ne remplace pas votre texte, il le relit.
        </Text>
      )}

      {propositions && propositions.length > 0 && (
        <View style={s.resultats}>
          <Text style={s.resultatsTitre}>
            {parIA
              ? `${propositions.length} versions de VOTRE texte`
              : 'Mise en forme seule, sans l’IA'}
          </Text>
          {!!note && <Text style={s.note}>{note}</Text>}

          {propositions.map((p) => (
            <View key={p.titre} style={s.proposition}>
              <Text style={s.propositionTitre}>{p.titre}</Text>
              <Text style={s.propositionTexte}>{p.texte}</Text>
              <View style={s.propositionBas}>
                <BtnMini onPress={() => { onRemplacer(p.texte); setPropositions(null); setNote(null); }}>
                  <Check size={12} color="#111" />
                  <Text style={s.utiliserTexte}>Utiliser</Text>
                </BtnMini>
              </View>
            </View>
          ))}

          <Text style={s.rappel}>
            Rien n'est remplacé tant que vous n'avez pas choisi. Votre texte
            reste modifiable après.
          </Text>
        </View>
      )}

      {propositions && propositions.length === 0 && !!note && (
        <Text style={s.note}>{note}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { marginTop: 8 },
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  boutonTexte: { fontFamily: F.oswald6, fontSize: 11, color: C.accent2 },
  aide: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16, marginTop: 6 },

  resultats: { marginTop: 10, gap: 8 },
  resultatsTitre: { fontFamily: F.oswald6, fontSize: 11.5, color: C.ink },
  note: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16, marginTop: 6 },

  proposition: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, padding: 10, gap: 6 },
  propositionTitre: { fontFamily: F.oswald6, fontSize: 10.5, color: C.accent },
  propositionTexte: { fontFamily: F.inter, fontSize: 12.5, color: C.ink, lineHeight: 18 },
  propositionBas: { flexDirection: 'row', justifyContent: 'flex-end' },
  utiliserTexte: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },

  rappel: { fontFamily: F.inter, fontSize: 10.5, color: C.muted, lineHeight: 15 },
});
