/**
 * Espace « Demandes » — l'inverse du fil d'actualité.
 *
 * Ici, c'est le particulier qui publie : un problème, un projet, une photo.
 * Les professionnels y trouvent du travail. Cet espace est volontairement
 * séparé du fil, qui reste une vitrine réservée aux pros.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  Avatar, BtnMain, BtnMini, Chip, TextArea, EmptyState, Gradient,
} from '../components/ui';
import { MapPin, MessageCircle } from '../components/icons';
import ChampVille from '../components/ChampVille';
import { METIERS } from '../data/demo';

export default function DemandesScreen({
  userType, monMetier, demandes, filtreMetier, setFiltreMetier, onPublier, onRepondre,
}) {
  const [formOuvert, setFormOuvert] = useState(false);
  const [metier, setMetier] = useState(METIERS[0]);
  const [lieu, setLieu] = useState({ affichage: '' });
  const [texte, setTexte] = useState('');

  const estPro = userType === 'pro';
  const filtrees = filtreMetier ? demandes.filter((d) => d.metier === filtreMetier) : demandes;

  /* Pour un professionnel, les demandes de SON métier remontent en tête.
     L'ordre d'arrivée est conservé à l'intérieur de chaque groupe. */
  const liste = estPro && monMetier
    ? [...filtrees].sort((a, b) => (b.metier === monMetier) - (a.metier === monMetier))
    : filtrees;

  const publier = () => {
    if (!texte.trim()) return;
    onPublier({
      metier,
      ville: (lieu.affichage || '').trim(),
      codePostal: lieu.codePostal,
      latitude: lieu.latitude,
      longitude: lieu.longitude,
      texte: texte.trim(),
    });
    setTexte(''); setLieu({ affichage: '' }); setFormOuvert(false);
  };

  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
      {/* --- côté particulier : publier une demande --- */}
      {!estPro && (
        <View style={s.encart}>
          <Text style={s.encartTitre}>Décrivez votre besoin</Text>
          <Text style={s.encartTexte}>
            Publiez une demande, les professionnels du métier concerné la reçoivent
            et vous répondent. Vous choisissez qui vous recontacte.
          </Text>
          {!formOuvert ? (
            <BtnMain block label="Publier une demande" onPress={() => setFormOuvert(true)} />
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={s.label}>Métier recherché</Text>
              <View style={s.chipRow}>
                {METIERS.map((m) => (
                  <Chip key={m} label={m} on={metier === m} onPress={() => setMetier(m)} />
                ))}
              </View>
              <TextArea
                placeholder="Décrivez ce dont vous avez besoin..."
                value={texte}
                onChangeText={setTexte}
              />
              <ChampVille valeur={lieu.affichage} onChange={setLieu} placeholder="Ville du chantier" />
              <View style={s.formBtns}>
                <BtnMini outline label="Annuler" onPress={() => setFormOuvert(false)} />
                <BtnMain label="Publier" onPress={publier} />
              </View>
            </View>
          )}
        </View>
      )}

      {/* --- côté pro : rappel du fonctionnement --- */}
      {estPro && (
        <View style={[s.encart, { borderColor: C.accent2 }]}>
          <Text style={s.encartTitre}>Demandes de particuliers</Text>
          <Text style={s.encartTexte}>
            Les demandes correspondant à votre métier apparaissent en premier.
            Répondez pour ouvrir une conversation directe.
          </Text>
        </View>
      )}

      {/* --- filtre par métier --- */}
      <View style={s.chipRow}>
        {METIERS.map((m) => (
          <Chip
            key={m}
            label={m}
            on={filtreMetier === m}
            onPress={() => setFiltreMetier(filtreMetier === m ? null : m)}
          />
        ))}
      </View>

      {/* --- la liste --- */}
      <View style={{ gap: 10, paddingBottom: 24 }}>
        {liste.map((d) => (
          <View key={String(d.id)} style={s.carte}>
            <View style={s.carteHaut}>
              <Avatar seed={String(d.auteur)} size={38} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.auteur}>{d.auteur}</Text>
                <View style={s.metaRow}>
                  <MapPin size={11} color={C.muted} />
                  <Text style={s.meta}>{d.ville} · {d.time}</Text>
                </View>
              </View>
              <View style={[s.badgeMetier, estPro && d.metier === monMetier && s.badgeMetierMien]}>
                <Text style={[s.badgeMetierText, estPro && d.metier === monMetier && { color: '#fff' }]}>
                  {d.metier}
                </Text>
              </View>
            </View>

            <Text style={s.texte}>{d.texte}</Text>
            {!!d.media && <Gradient media={d.media} style={s.media} />}

            <View style={s.carteBas}>
              <Text style={s.reponses}>
                {d.reponses} {d.reponses > 1 ? 'réponses' : 'réponse'}
              </Text>
              {estPro && (
                <BtnMini onPress={() => onRepondre(d)}>
                  <MessageCircle size={12} color="#111" />
                  <Text style={s.repondreText}>Répondre</Text>
                </BtnMini>
              )}
            </View>
          </View>
        ))}

        {liste.length === 0 && (
          <EmptyState>
            {filtreMetier
              ? `Aucune demande en ${filtreMetier} pour le moment.`
              : 'Aucune demande pour le moment.'}
          </EmptyState>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },

  encart: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    padding: 12, marginBottom: 14,
  },
  encartTitre: { fontFamily: F.oswald6, fontSize: 13, color: C.ink, marginBottom: 4 },
  encartTexte: { fontSize: 11.5, color: C.muted, lineHeight: 17, marginBottom: 10, fontFamily: F.inter },
  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginBottom: 6 },
  formBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },

  carte: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },
  carteHaut: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auteur: { fontFamily: F.inter6, fontSize: 13, color: C.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  meta: { fontSize: 11, color: C.muted, fontFamily: F.inter },
  badgeMetier: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, paddingVertical: 3, paddingHorizontal: 8 },
  badgeMetierText: { fontFamily: F.oswald, fontSize: 10.5, color: C.ink },
  badgeMetierMien: { backgroundColor: C.accent2, borderColor: C.accent2 },

  texte: { fontSize: 12.8, lineHeight: 18, color: C.ink, marginTop: 10, fontFamily: F.inter },
  media: { width: '100%', aspectRatio: 16 / 10, marginTop: 10 },

  carteBas: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line,
  },
  reponses: { fontSize: 11, color: C.muted, fontFamily: F.inter },
  repondreText: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },
});
