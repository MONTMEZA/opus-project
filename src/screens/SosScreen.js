/**
 * SOS — déclarer une urgence (écran réservé aux particuliers).
 *
 * Quatre étapes : métier → problème → lieu et créneau → choix de l'artisan.
 * Le client compare distance, délai et fourchette de prix, puis CHOISIT.
 * C'est la différence avec les plateformes qui imposent un intervenant.
 *
 * LES PRIX VIENNENT DES TARIFS AFFICHÉS DE CHAQUE ARTISAN (lot T, section 47
 * de `schema.sql`) : une seule liste, réglée dans « Mon entreprise », en
 * centimes et toutes taxes comprises. Un artisan n'apparaît ici que s'il a
 * choisi de les afficher (réponse du propriétaire du 19/10/2026). Tout le
 * calcul vit dans `src/lib/tarifs.js`, que `verifier-tarifs` fait tourner :
 * jamais « null € », jamais « 0 – 0 € », jamais « +0 % », et jamais
 * « majoration incluse » pour un artisan qui ne majore pas.
 *
 * LA NUIT SE JUGE ARTISAN PAR ARTISAN, à son HEURE D'ARRIVÉE pour « Tout de
 * suite » : chercher à 19 h 40 un artisan qui arrive à 20 h 05, c'est une
 * intervention de nuit. Pour « Dans la journée » et « Demain », l'heure
 * n'est pas connue : l'estimation n'est pas majorée, et la carte dit
 * « +X % si l'intervention a lieu la nuit ou le week-end ».
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import {
  C, F, T, CARTE_PLEINE, S, GOUTTIERE, TOUCHE, surFond,
} from '../theme';
import {
  Avatar, BtnMain, BtnMini, BtnOutline, TextArea, EmptyState,
} from '../components/ui';
import {
  Wrench, Zap, Key, Thermometer, AlertTriangle, Clock, Navigation,
  BadgeCheck, Star, ChevronLeft,
} from '../components/icons';
import { METIERS_SOS, PROBLEMES, CRENEAUX_SOS } from '../data/urgences';
import {
  estimationSos, detailSos, conditionsSos, noteSos, majorationSos,
} from '../lib/tarifs';
import { messageClair } from '../lib/erreurs';
import ChampVille from '../components/ChampVille';
import { CLAVIER } from '../lib/clavier';
import { avgReviews } from '../data/demo';

const ICONES = { wrench: Wrench, zap: Zap, key: Key, thermometer: Thermometer };

/**
 * UNE ADRESSE TAPÉE SANS CHOISIR DE SUGGESTION N'A PAS DE POSITION, et la
 * recherche d'artisans en a besoin. La phrase est écrite ICI, une fois :
 * l'écran la montre sous le champ, et `OpusApp` la lève en filet.
 *
 * Avant (relecture application du 19/10/2026), elle sortait comme une
 * erreur de recherche : « La recherche d'artisans : Choisissez… », deux
 * deux-points, et un bouton « Réessayer » qui relançait EXACTEMENT la même
 * erreur, puisque l'adresse n'avait pas changé.
 */
export const ADRESSE_SANS_POSITION = 'Choisissez votre adresse dans la liste de suggestions : sans '
  + 'elle, Opus ne connaît pas la position de l’intervention et ne peut pas trouver les artisans '
  + 'les plus proches.';

export default function SosScreen({
  pros, onEnvoyer, onChercherArtisans, exigeCoordonnees = false,
}) {
  const [etape, setEtape] = useState('metier');
  const [metier, setMetier] = useState(null);
  const [probleme, setProbleme] = useState(null);
  const [lieu, setLieu] = useState({ affichage: '' });
  const [details, setDetails] = useState('');
  const [creneau, setCreneau] = useState('immediat');

  const [artisans, setArtisans] = useState([]);
  /* Les artisans que la base a rendus mais dont les tarifs étaient
     illisibles : COMPTÉS, pas jetés. Un particulier en urgence ne doit pas
     croire qu'il n'y a personne quand il y a quelqu'un. */
  const [nonAffichables, setNonAffichables] = useState(0);
  /* L'heure de LA RECHERCHE, gardée : c'est d'elle que part l'heure
     d'arrivée de chaque artisan. Relire l'horloge à chaque rendu ferait
     changer une estimation sous les yeux de celui qui la lit. */
  const [heureRecherche, setHeureRecherche] = useState(() => Date.now());
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState(null);
  /* Le refus de l'ADRESSE, sous son champ — pas une erreur de recherche :
     on reste sur l'étape où l'on peut le corriger. */
  const [erreurAdresse, setErreurAdresse] = useState(null);
  const sansPosition = typeof lieu.latitude !== 'number' || typeof lieu.longitude !== 'number';

  /** Cherche les artisans disponibles puis passe à l'étape du choix. */
  const chercherArtisans = async () => {
    if (exigeCoordonnees && sansPosition) {
      setErreurAdresse(ADRESSE_SANS_POSITION);
      setEtape('lieu');
      return;
    }
    setErreurAdresse(null);
    setRecherche(true);
    setErreur(null);
    setEtape('artisans');
    setHeureRecherche(Date.now());
    try {
      const r = await onChercherArtisans({
        metierKey: metier.key,
        latitude: lieu.latitude,
        longitude: lieu.longitude,
      });
      setArtisans((r && r.artisans) || []);
      setNonAffichables((r && r.nonAffichables) || 0);
    } catch (e) {
      /* L'adresse, refusée par le filet d'`OpusApp` : retour au champ, avec
         la phrase telle quelle — la relancer ne changerait rien. */
      if (e && e.champ === 'adresse') {
        setErreurAdresse(e.message);
        setArtisans([]);
        setNonAffichables(0);
        setRecherche(false);
        setEtape('lieu');
        return;
      }
      /* `messageClair`, jamais `e.message` brut : c'était l'anglais de
         PostgREST à l'écran d'un particulier en urgence. */
      setErreur(messageClair(e, "La recherche d'artisans"));
      setArtisans([]);
      setNonAffichables(0);
    }
    setRecherche(false);
  };

  /* LA LISTE VISIBLE, calculée AVANT le rendu : un artisan dont
     l'estimation ne se calcule pas ne s'affiche pas — et c'est elle, pas la
     réponse brute, qui décide de l'état vide. Sinon une carte invisible
     ferait taire « Aucun artisan… » sans rien montrer à la place.

     UNE FICHE ABSENTE DE `pros` N'EMPÊCHE PLUS LA CARTE (relecture
     application du 19/10/2026) : un artisan inscrit, ou devenu disponible,
     après le démarrage de l'application n'y est pas, et `pros` ne se
     recharge qu'au démarrage. La recherche rend son nom, sa ville, sa
     photo et son badge (`a.fiche`) : la carte s'affiche avec eux, sans
     note — on ne la connaît pas, et « 0 avis » serait faux. */
  const visibles = (etape === 'artisans' && probleme ? artisans : []).map((a) => {
    const connue = pros[a.proId] || null;
    const pro = connue || (a.fiche && a.fiche.entreprise ? { id: a.proId, ...a.fiche } : null);
    if (!pro) return null;
    const majoration = majorationSos({ creneau, maintenant: heureRecherche, delaiMin: a.delaiMin });
    const prix = estimationSos(a.tarifs, probleme, majoration);
    return prix ? {
      a, pro, connue: !!connue, majoration, prix,
    } : null;
  }).filter(Boolean);
  const rendus = artisans.length + nonAffichables;
  const caches = rendus - visibles.length;

  const retour = () => {
    if (etape === 'probleme') { setEtape('metier'); setProbleme(null); }
    else if (etape === 'lieu') setEtape('probleme');
    else if (etape === 'artisans') setEtape('lieu');
  };

  return (
    <ScrollView
      {...CLAVIER}
      style={{ flex: 1 }}
      contentContainerStyle={s.pad}
    >
      {/* bandeau d'urgence */}
      <View style={s.hero}>
        <AlertTriangle size={18} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Intervention d'urgence</Text>
          {/* Le bandeau ne dépend plus de l'heure : la majoration se dit sur
              CHAQUE carte, à l'heure d'arrivée de chaque artisan. */}
          <Text style={s.heroSub}>
            Les prix affichés sont des estimations avant diagnostic, toutes taxes comprises.
          </Text>
        </View>
      </View>

      {/* 44 points de haut, comme toute cible (lot 5) : mesurée au
          navigateur le 19/10/2026, cette rangée n'en faisait que 15 — et
          c'est la seule façon de corriger un choix sans tout recommencer. */}
      {etape !== 'metier' && (
        <Pressable style={s.retour} onPress={retour} accessibilityRole="button">
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
            onChange={(l) => { setLieu(l); setErreurAdresse(null); }}
          />
          {!!erreurAdresse && <Text style={s.erreur}>{erreurAdresse}</Text>}
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

          {/* L'ÉCHEC SE DIT, ET IL SE RÉPARE D'UN APPUI : la phrase dit
              « vous pourrez réessayer » — un mot dans un paragraphe ne se
              touche pas au pouce, un bouton si. Sans lui, il fallait revenir
              à l'étape précédente et relancer la recherche. */}
          {!!erreur && (
            <View style={s.erreurBloc}>
              <Text style={s.erreur}>{erreur}</Text>
              <BtnOutline label="Réessayer" onPress={chercherArtisans} />
            </View>
          )}

          <View style={{ gap: 10, paddingBottom: 30 }}>
            {visibles.map(({
              a, pro, connue, majoration, prix,
            }) => {
              const note = connue ? avgReviews(pro) : null;
              const conditions = conditionsSos(a.tarifs);
              return (
                <View key={a.proId} style={s.artisan}>
                  <View style={s.artisanHaut}>
                    <Avatar seed={pro.id} size={44} uri={pro.avatarUrl} nom={pro.entreprise} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={s.nomRow}>
                        <Text style={s.nom} numberOfLines={1}>{pro.entreprise}</Text>
                        {pro.verifie && <BadgeCheck size={13} color={C.verif} />}
                      </View>
                      <View style={s.metaRow}>
                        {!!note && (
                          <>
                            <Star size={11} color={C.accent} />
                            <Text style={s.meta}>
                              {note.count ? note.global.toFixed(1) : '—'} ({note.count})
                            </Text>
                          </>
                        )}
                        <Navigation size={11} color={C.muted} />
                        <Text style={s.meta}>{a.distanceKm} km</Text>
                        <Clock size={11} color={C.muted} />
                        <Text style={s.meta}>~{a.delaiMin} min</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.prixBloc}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.prix}>{prix.min} – {prix.max} € TTC</Text>
                      <Text style={s.prixNote}>{noteSos(a.tarifs, prix.majore)}</Text>
                    </View>
                    {/* L'ENCRE DU ROUGE BRIQUE EST LE BLANC (`surFond`) : le
                        presque-noir de `BtnMini` n'y donnait que 3,11 : 1,
                        mesuré au navigateur le 19/10/2026. Et la boîte fait
                        44 points : c'est LE geste d'une urgence. */}
                    <BtnMini
                      label="Choisir"
                      style={s.choisir}
                      onPress={() => onEnvoyer({
                        proId: a.proId,
                        entreprise: pro.entreprise,
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
                    >
                      <Text style={s.choisirTexte}>Choisir</Text>
                    </BtnMini>
                  </View>

                  <Text style={s.detailTarif}>{detailSos(a.tarifs, majoration)}</Text>
                  {/* CE QU'IL FAUT SAVOIR AVANT DE CHOISIR, et que la
                      fourchette ne dit pas : le prix du devis, la façon de
                      compter le temps, les conditions de déplacement. */}
                  {a.complements === 'echec' ? (
                    <Text style={s.detailTarif}>
                      Prix du devis et conditions non lus : demandez-les-lui quand il vous appelle.
                    </Text>
                  ) : conditions.map((ligne) => (
                    <Text key={ligne} style={s.detailTarif}>{ligne}</Text>
                  ))}
                </View>
              );
            })}

            {!recherche && !erreur && visibles.length > 0 && caches > 0 && (
              <Text style={s.caches}>
                {caches > 1
                  ? `${caches} artisans disponibles n’ont pas pu être affichés.`
                  : '1 artisan disponible n’a pas pu être affiché.'}
              </Text>
            )}

            {!recherche && !erreur && rendus === 0 && (
              <EmptyState>
                Aucun artisan disponible pour ce métier autour de cette adresse.
                Essayez une demande de devis classique depuis Découvrir.
              </EmptyState>
            )}

            {/* La base a rendu des artisans, et aucun ne s'affiche : ce n'est
                PAS « aucun artisan », et l'écran ne doit pas le laisser
                croire. */}
            {!recherche && !erreur && rendus > 0 && visibles.length === 0 && (
              <EmptyState action={{ label: 'Réessayer', onPress: chercherArtisans }}>
                Des artisans sont disponibles, mais leur fiche n’a pas pu être affichée. Réessayez.
              </EmptyState>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  /* `contentContainerStyle`, pas `style` — voir GOUTTIERE dans theme.js. */
  pad: { paddingTop: S.md, paddingHorizontal: GOUTTIERE },

  hero: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.sos, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14,
  },
  heroTitle: { fontFamily: F.oswald6, fontSize: 14, color: '#fff' },
  heroSub: { fontSize: T.petit, color: 'rgba(255,255,255,0.9)', marginTop: 3, lineHeight: 15, fontFamily: F.inter },

  retour: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10,
    minHeight: TOUCHE, alignSelf: 'flex-start',
  },
  retourText: { color: C.accent2, fontSize: T.courant, fontFamily: F.inter6 },

  question: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink, marginBottom: 4 },
  rappel: { fontSize: T.courant, color: C.muted, marginBottom: 12, fontFamily: F.inter },
  sousTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  carte: {
    width: '47%', flexGrow: 1, alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingVertical: 22,
  },
  carteText: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },

  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 12, paddingHorizontal: 12,
  },
  ligneOn: { backgroundColor: C.ink, borderColor: C.ink },
  ligneTitre: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  ligneDetail: { fontSize: T.petit, color: C.muted, marginTop: 2, fontFamily: F.inter },
  ligneDuree: { fontSize: T.petit, color: C.muted, fontFamily: F.inter },

  chargement: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  chargementTexte: { fontSize: T.courant, color: C.muted, fontFamily: F.inter },
  erreurBloc: { alignItems: 'flex-start', gap: S.sm, marginBottom: S.md },
  erreur: {
    fontSize: T.courant, color: C.bad, lineHeight: 16, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: C.bad, paddingLeft: 8, fontFamily: F.inter,
  },

  artisan: { ...CARTE_PLEINE },
  artisanHaut: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  nomRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nom: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: T.petit, color: C.muted, marginRight: 4, fontFamily: F.inter },

  prixBloc: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line,
  },
  prix: { fontFamily: F.oswald6, fontSize: 17, color: C.ink },
  choisir: { backgroundColor: C.sos, minHeight: TOUCHE, paddingHorizontal: S.lg },
  choisirTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: surFond(C.sos) },
  prixNote: { fontSize: T.micro, color: C.muted, marginTop: 1, fontFamily: F.inter },
  detailTarif: { fontSize: T.micro, color: C.muted, marginTop: S.sm, fontFamily: F.inter },
  caches: { fontSize: T.courant, color: C.muted, fontFamily: F.inter },
});
