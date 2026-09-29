/**
 * 3. Découvrir — assistant IA de mise en relation, puis recherche classique.
 * (.screen-pad + .ai-match-box du prototype)
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMain, BtnMini, Chip, EmptyState, TextArea, Field } from '../components/ui';
import ArtisanRow from '../components/ArtisanRow';
import { Sparkles, Search } from '../components/icons';
import { METIERS, avgReviews } from '../data/demo';
import { exerce } from '../lib/metiers';
import { correspond, texteDePro } from '../lib/recherche';
import { useRechercheDifferee } from '../lib/frappe';

/**
 * L'assistant IA, dans son propre composant — et ce n'est PAS un rangement.
 *
 * `aiQuery` vivait dans DecouvrirScreen, qui affiche aussi la liste des
 * artisans et les douze puces de métier. Chaque lettre tapée redessinait
 * donc tout cela. Ici, une lettre ne redessine que ce cadre.
 *
 * Mesuré au navigateur avec le processeur bridé six fois, pour imiter un
 * téléphone : 219 ms par lettre au départ (l'état était à la racine de
 * l'application), 152 ms une fois descendu dans l'écran, et le reste après
 * cette séparation. Sur un iPhone, le champ paraissait ne pas répondre du
 * tout — c'est ce qui a été constaté le 29/09/2026.
 */
function AssistantIA({ askAiMatch, aiMatches, aiMatchLoading, aiMatchError, pros, onView }) {
  const [aiQuery, setAiQuery] = useState('');

  return (
    <View style={s.aiBox}>
      <View style={s.aiHead}>
        <Sparkles size={14} color={C.accent2} />
        <Text style={s.aiHeadText}>Assistant IA — trouver le bon pro</Text>
      </View>
      <TextArea
        style={{ minHeight: 50 }}
        placeholder="Décrivez votre besoin : « je veux refaire ma salle de bain, carrelage et plomberie »..."
        value={aiQuery}
        onChangeText={setAiQuery}
      />
      <BtnMain block onPress={() => askAiMatch(aiQuery)} disabled={aiMatchLoading}>
        {aiMatchLoading ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={s.btnMainText}>L'IA analyse votre besoin...</Text>
          </>
        ) : (
          <Text style={s.btnMainText}>Demander à l'IA</Text>
        )}
      </BtnMain>

      {!!aiMatchError && <Text style={s.aiError}>{aiMatchError}</Text>}

      {aiMatches && (
        <View style={{ gap: 8, marginTop: 10 }}>
          {aiMatches.length === 0 && (
            <EmptyState>Aucun artisan pertinent trouvé pour ce besoin.</EmptyState>
          )}
          {aiMatches.map((r) => {
            const p = pros[r.proId];
            if (!p) return null;
            return (
              <ArtisanRow
                key={String(r.proId)}
                pro={p}
                avatarSize={40}
                raison={r.raison}
                right={<BtnMini label="Profil" onPress={() => onView(p.id)} />}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

/** La barre de recherche. Le filtrage est différé — voir src/lib/frappe.js. */
function BarreRecherche({ valeur, onChange }) {
  const [texte, setTexte] = useRechercheDifferee(valeur, onChange);

  return (
    <View style={s.searchBar}>
      <Search size={16} color={C.muted} />
      <Field
        style={s.searchInput}
        placeholder="Rechercher un métier, une entreprise, une ville..."
        value={texte}
        onChangeText={setTexte}
      />
    </View>
  );
}

export default function DecouvrirScreen({
  pros, askAiMatch, aiMatches, aiMatchLoading, aiMatchError, onView, onContact,
}) {
  /* CE QUE CES DEUX LIGNES CORRIGENT
     --------------------------------
     `search` et `filterMetier` étaient dans OpusApp, à la racine de
     l'application : chaque lettre tapée ici re-rendait TOUS les écrans.
     Elles ne servaient nulle part ailleurs.

     Effet de bord assumé : quitter « Découvrir » puis y revenir repart d'une
     recherche vide. C'est ce que font la plupart des applications, et c'est
     préférable à un filtre oublié qui cache des résultats sans qu'on
     comprenne pourquoi. */
  const [search, setSearch] = useState('');
  const [filterMetier, setFilterMetier] = useState(null);
  /* La recherche porte sur TOUS les métiers exercés, pas seulement le
     principal : un plombier-chauffagiste doit sortir sur « chauffagiste ».
     C'était la première raison d'ouvrir le champ à plusieurs métiers.
     Elle porte aussi sur les SPÉCIALITÉS, qui sont les mots que les gens
     tapent réellement — « douche à l'italienne » plutôt que « Carreleur ».

     Et elle passe par `correspond()`, le même moteur que la Place des
     pros : accents ignorés, synonymes de chantier reconnus (placo = BA13 =
     plaque de plâtre), et tous les mots tapés exigés. Un simple
     `includes()` échouait sur « maçon » tapé sans cédille. */
  const results = useMemo(
    () => Object.values(pros).filter(
      (p) => correspond(texteDePro(p), search) && exerce(p, filterMetier),
    ),
    [pros, search, filterMetier],
  );

  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
      <AssistantIA
        askAiMatch={askAiMatch}
        aiMatches={aiMatches}
        aiMatchLoading={aiMatchLoading}
        aiMatchError={aiMatchError}
        pros={pros}
        onView={onView}
      />

      {/* --- recherche classique --- */}
      <BarreRecherche valeur={search} onChange={setSearch} />

      <View style={s.chipRow}>
        {METIERS.map((m) => (
          <Chip
            key={m}
            label={m}
            on={filterMetier === m}
            onPress={() => setFilterMetier(filterMetier === m ? null : m)}
          />
        ))}
      </View>

      <View style={{ gap: 10, paddingBottom: 24 }}>
        {results.map((a) => {
          const avg = avgReviews(a);
          return (
            <ArtisanRow
              key={String(a.id)}
              pro={a}
              note={{ value: avg.count ? avg.global.toFixed(1) : '—', count: avg.count }}
              right={(
                <View style={{ gap: 5 }}>
                  <BtnMini label="Profil" onPress={() => onView(a.id)} />
                  <BtnMini outline label="Devis" onPress={() => onContact(a, 'devis')} />
                </View>
              )}
            />
          );
        })}
        {results.length === 0 && <EmptyState>Aucun résultat pour cette recherche.</EmptyState>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  aiBox: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent2, padding: 12, marginBottom: 14 },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiHeadText: { fontFamily: F.oswald6, fontSize: 12, color: C.accent2 },
  btnMainText: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },
  aiError: { fontSize: 11, color: C.bad, marginTop: 4, fontFamily: F.inter },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 2, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', fontSize: 13, paddingHorizontal: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 16 },
});
