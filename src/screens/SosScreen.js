/**
 * SOS — déclarer une urgence (écran réservé aux particuliers).
 *
 * Quatre étapes : métier → problème → lieu et créneau → choix de l'artisan.
 * Le client compare distance, délai et fourchette de prix, puis CHOISIT.
 * C'est la différence avec les plateformes qui imposent un intervenant.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  Avatar, BtnMain, BtnMini, TextArea, EmptyState,
} from '../components/ui';
import {
  Wrench, Zap, Key, Thermometer, AlertTriangle, Clock, Navigation,
  BadgeCheck, Star, ChevronLeft,
} from '../components/icons';
import {
  METIERS_SOS, PROBLEMES, CRENEAUX_SOS, estimation, estNuitOuWeekend,
} from '../data/urgences';
import ChampVille from '../components/ChampVille';
import { avgReviews } from '../data/demo';

const ICONES = { wrench: Wrench, zap: Zap, key: Key, thermometer: Thermometer };

export default function SosScreen({ pros, onEnvoyer, onChercherArtisans }) {
  const [etape, setEtape] = useState('metier');
  const [metier, setMetier] = useState(null);
  const [probleme, setProbleme] = useState(null);
  const [lieu, setLieu] = useState({ affichage: '' });
  const [details, setDetails] = useState('');
  const [creneau, setCreneau] = useState('immediat');

  const [artisans, setArtisans] = useState([]);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState(null);

  const majore = estNuitOuWeekend();

  /** Cherche les artisans disponibles puis passe à l'étape du choix. */
  const chercherArtisans = async () => {
    setRecherche(true);
    setErreur(null);
    setEtape('artisans');
    try {
      const liste = await onChercherArtisans({
        metierKey: metier.key,
        latitude: lieu.latitude,
        longitude: lieu.longitude,
      });
      setArtisans(liste || []);
    } catch (e) {
      setErreur(e.message || "La recherche d'artisans a échoué.");
      setArtisans([]);
    }
    setRecherche(false);
  };

  const retour = () => {
    if (etape === 'probleme') { setEtape('metier'); setProbleme(null); }
    else if (etape === 'lieu') setEtape('probleme');
    else if (etape === 'artisans') setEtape('lieu');
  };

  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
      {/* bandeau d'urgence */}
      <View style={s.hero}>
        <AlertTriangle size={18} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Intervention d'urgence</Text>
          <Text style={s.heroSub}>
            {majore
              ? 'Nuit ou week-end — une majoration s’applique, elle est comprise dans les prix affichés.'
              : 'Les prix affichés sont des estimations avant diagnostic.'}
          </Text>
        </View>
      </View>

      {etape !== 'metier' && (
        <Pressable style={s.retour} onPress={retour}>
          <ChevronLeft size={14} color={C.accent2} />
          <Text style={s.retourText}>Étape précédente</Text>
        </Pressable>
      )}

      {/* --- 1. le métier --- */}
      {etape === 'metier' && (
        <>
          <Text style={s.question}>De quoi avez-vous besoin ?</Text>
          <View style={s.grid}>
            {METIERS_SOS.map((m) => {
              const Icone = ICONES[m.icon];
              return (
                <Pressable
                  key={m.key}
                  style={s.carte}
                  onPress={() => { setMetier(m); setEtape('probleme'); }}
                >
                  <Icone size={26} color={C.sos} />
                  <Text style={s.carteText}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* --- 2. le problème --- */}
      {etape === 'probleme' && metier && (
        <>
          <Text style={s.question}>{metier.label} — que se passe-t-il ?</Text>
          <View style={{ gap: 8 }}>
            {PROBLEMES[metier.key].map((pb) => (
              <Pressable
                key={pb.key}
                style={s.ligne}
                onPress={() => { setProbleme(pb); setEtape('lieu'); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.ligneTitre}>{pb.label}</Text>
                  {!!pb.detail && <Text style={s.ligneDetail}>{pb.detail}</Text>}
                </View>
                <Text style={s.ligneDuree}>{pb.h[0]}–{pb.h[1]} h</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* --- 3. le lieu et le créneau --- */}
      {etape === 'lieu' && probleme && (
        <>
          <Text style={s.question}>Où et quand ?</Text>
          <Text style={s.rappel}>{metier.label} · {probleme.label}</Text>

          <ChampVille
            style={{ marginBottom: 10 }}
            type="address"
            placeholder="Adresse complète de l'intervention"
            valeur={lieu.affichage}
            onChange={setLieu}
          />
          <TextArea
            placeholder="Précisez la situation (étage, code, ce que vous constatez)..."
            value={details}
            onChangeText={setDetails}
          />

          <Text style={s.sousTitre}>Quand ?</Text>
          <View style={{ gap: 8, marginBottom: 14 }}>
            {CRENEAUX_SOS.map((c) => {
              const on = creneau === c.key;
              return (
                <Pressable
                  key={c.key}
                  style={[s.ligne, on && s.ligneOn]}
                  onPress={() => setCreneau(c.key)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.ligneTitre, on && { color: '#fff' }]}>{c.label}</Text>
                    <Text style={[s.ligneDetail, on && { color: 'rgba(255,255,255,0.75)' }]}>
                      {c.detail}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <BtnMain
            block
            label="Voir les artisans disponibles"
            onPress={chercherArtisans}
            style={{ marginBottom: 30 }}
          />
        </>
      )}

      {/* --- 4. le choix de l'artisan --- */}
      {etape === 'artisans' && probleme && (
        <>
          <Text style={s.question}>Choisissez votre artisan</Text>
          <Text style={s.rappel}>
            {metier.label} · {probleme.label}{lieu.affichage ? ` · ${lieu.affichage}` : ''}
          </Text>

          {recherche && (
            <View style={s.chargement}>
              <ActivityIndicator size="small" color={C.sos} />
              <Text style={s.chargementTexte}>Recherche des artisans disponibles...</Text>
            </View>
          )}

          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

          <View style={{ gap: 10, paddingBottom: 30 }}>
            {artisans.map((a) => {
              const pro = pros[a.proId];
              if (!pro) return null;
              const prix = estimation(a, probleme, majore);
              const note = avgReviews(pro);
              return (
                <View key={a.proId} style={s.artisan}>
                  <View style={s.artisanHaut}>
                    <Avatar seed={pro.id} size={44} uri={pro.avatarUrl} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={s.nomRow}>
                        <Text style={s.nom} numberOfLines={1}>{pro.entreprise}</Text>
                        {pro.verifie && <BadgeCheck size={13} color={C.verif} />}
                      </View>
                      <View style={s.metaRow}>
                        <Star size={11} color={C.accent} />
                        <Text style={s.meta}>
                          {note.count ? note.global.toFixed(1) : '—'} ({note.count})
                        </Text>
                        <Navigation size={11} color={C.muted} />
                        <Text style={s.meta}>{a.distanceKm} km</Text>
                        <Clock size={11} color={C.muted} />
                        <Text style={s.meta}>~{a.delaiMin} min</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.prixBloc}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.prix}>{prix.min} – {prix.max} €</Text>
                      <Text style={s.prixNote}>
                        Estimation avant diagnostic{prix.majore ? ' · majoration incluse' : ''}
                      </Text>
                    </View>
                    <BtnMini
                      label="Choisir"
                      style={{ backgroundColor: C.sos }}
                      onPress={() => onEnvoyer({
                        proId: a.proId,
                        metierKey: metier.key,
                        metier: metier.label,
                        problemeKey: probleme.key,
                        probleme: probleme.label,
                        adresse: lieu.affichage,
                        codePostal: lieu.codePostal,
                        latitude: lieu.latitude,
                        longitude: lieu.longitude,
                        details,
                        creneau,
                        prixMin: prix.min,
                        prixMax: prix.max,
                      })}
                    />
                  </View>

                  <Text style={s.detailTarif}>
                    Déplacement {a.deplacement} € · {a.horaire} €/h
                    {majore ? ` · +${a.majoration} % nuit/week-end` : ''}
                  </Text>
                </View>
              );
            })}

            {!recherche && !erreur && artisans.length === 0 && (
              <EmptyState>
                Aucun artisan disponible pour ce métier autour de cette adresse.
                Essayez une demande de devis classique depuis Découvrir.
              </EmptyState>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },

  hero: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.sos, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14,
  },
  heroTitle: { fontFamily: F.oswald6, fontSize: 14, color: '#fff' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 3, lineHeight: 15, fontFamily: F.inter },

  retour: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  retourText: { color: C.accent2, fontSize: 11.5, fontFamily: F.inter6 },

  question: { fontFamily: F.oswald6, fontSize: 15, color: C.ink, marginBottom: 4 },
  rappel: { fontSize: 11.5, color: C.muted, marginBottom: 12, fontFamily: F.inter },
  sousTitre: { fontFamily: F.oswald6, fontSize: 12.5, color: C.ink, marginBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  carte: {
    width: '47%', flexGrow: 1, alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingVertical: 22,
  },
  carteText: { fontFamily: F.oswald6, fontSize: 13, color: C.ink },

  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 12, paddingHorizontal: 12,
  },
  ligneOn: { backgroundColor: C.ink, borderColor: C.ink },
  ligneTitre: { fontFamily: F.inter6, fontSize: 13, color: C.ink },
  ligneDetail: { fontSize: 11, color: C.muted, marginTop: 2, fontFamily: F.inter },
  ligneDuree: { fontSize: 11, color: C.muted, fontFamily: F.inter },

  chargement: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  chargementTexte: { fontSize: 12, color: C.muted, fontFamily: F.inter },
  erreur: {
    fontSize: 11.5, color: C.bad, lineHeight: 16, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: C.bad, paddingLeft: 8, fontFamily: F.inter,
  },

  artisan: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },
  artisanHaut: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  nomRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nom: { fontFamily: F.inter6, fontSize: 13.5, color: C.ink, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: 11, color: C.muted, marginRight: 4, fontFamily: F.inter },

  prixBloc: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line,
  },
  prix: { fontFamily: F.oswald6, fontSize: 17, color: C.ink },
  prixNote: { fontSize: 10, color: C.muted, marginTop: 1, fontFamily: F.inter },
  detailTarif: { fontSize: 10, color: C.muted, marginTop: 8, fontFamily: F.inter },
});
