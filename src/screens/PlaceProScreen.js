/**
 * La Place des pros — les annonces entre professionnels.
 *
 * CE QUE CETTE PAGE REMPLACE
 * --------------------------
 * Un artisan connecté voyait « Assistant IA — trouver le bon pro ». Il n'a
 * pas besoin qu'on lui trouve un artisan : il en est un. C'était un onglet
 * principal gâché.
 *
 * POURQUOI ELLE PEUT MARCHER
 * --------------------------
 * La sous-traitance se traite aujourd'hui par bouche-à-oreille et par
 * groupes Facebook, où la question « ce plaquiste est-il vraiment assuré ? »
 * reste toujours sans réponse. Ici elle en a une : le badge vérifié est
 * adossé au Kbis et à l'attestation d'assurance décennale, contrôlés par un
 * humain. D'où le filtre « artisans vérifiés uniquement », qui n'a de sens
 * que dans une application qui vérifie vraiment.
 *
 * ET LES DATES
 * ------------
 * Un chantier se joue sur une semaine précise. « Je cherche un plaquiste du
 * 12 au 20 octobre » est une information exploitable ; « je cherche un
 * plaquiste » ne l'est pas. Aucune des places de marché existantes ne fait
 * correspondre les annonces sur les dates — c'est ce qui nous distingue le
 * plus sûrement.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  Avatar, BtnMain, BtnMini, Chip, Field, TextArea, EmptyState, SectionLabel,
} from '../components/ui';
import Media from '../components/Media';
import ChampVille from '../components/ChampVille';
import {
  MapPin, BadgeCheck, MessageCircle, Calendar, Check, X, Plus,
} from '../components/icons';
import {
  TYPES_ANNONCE, UNITES, typeAnnonce, libelleDates, libellePrix,
} from '../data/annonces';
import { METIERS } from '../data/demo';
import { distanceKm } from '../lib/adresse';
import { libelleMetiers } from '../lib/metiers';

/** Une date au format que la base attend : 2026-10-12. */
function versISO(saisie) {
  const m = String(saisie || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const jour = Number(m[1]);
  const mois = Number(m[2]);
  if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return null;
  let annee = m[3] ? Number(m[3]) : new Date().getFullYear();
  if (annee < 100) annee += 2000;
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

export default function PlaceProScreen({
  annonces = [], moi, onPublier, onRepondre, onFermer, onVoirProfil, onErreur,
}) {
  const [filtreType, setFiltreType] = useState(null);
  const [filtreMetier, setFiltreMetier] = useState(null);
  const [verifiesSeulement, setVerifiesSeulement] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);

  /* --- le formulaire --- */
  const [type, setType] = useState(TYPES_ANNONCE[0].cle);
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [metier, setMetier] = useState(null);
  const [lieu, setLieu] = useState({ affichage: moi ? moi.ville || '' : '' });
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [prix, setPrix] = useState('');
  const [unite, setUnite] = useState('total');

  const reglages = typeAnnonce(type);

  const liste = useMemo(() => {
    const avecDistance = annonces.map((a) => {
      const laLat = a.latitude ?? (a.auteur ? a.auteur.latitude : null);
      const laLon = a.longitude ?? (a.auteur ? a.auteur.longitude : null);
      const km = (moi && moi.latitude && laLat)
        ? distanceKm(moi.latitude, moi.longitude, laLat, laLon)
        : null;
      return { ...a, km };
    });

    return avecDistance
      .filter((a) => (!filtreType || a.type === filtreType))
      .filter((a) => (!filtreMetier || a.metier === filtreMetier))
      .filter((a) => (!verifiesSeulement || (a.auteur && a.auteur.verifie)))
      /* À distance connue, le plus proche d'abord : un chantier à 150 km
         n'intéresse personne. Les annonces sans coordonnées restent à leur
         place plutôt que d'être reléguées à la fin. */
      .sort((a, b) => {
        if (a.km === null || b.km === null) return 0;
        return a.km - b.km;
      });
  }, [annonces, filtreType, filtreMetier, verifiesSeulement, moi]);

  const publier = () => {
    if (!titre.trim() || !texte.trim()) return;

    const dateDebut = reglages.avecDates ? versISO(du) : null;
    const dateFin = reglages.avecDates ? versISO(au) : null;
    if (reglages.avecDates && du.trim() && !dateDebut) {
      onErreur('La date de début se note 12/10 ou 12/10/2026.');
      return;
    }
    if (reglages.avecDates && au.trim() && !dateFin) {
      onErreur('La date de fin se note 20/10 ou 20/10/2026.');
      return;
    }
    if (dateDebut && dateFin && dateFin < dateDebut) {
      onErreur('La date de fin est avant la date de début.');
      return;
    }

    onPublier({
      type,
      titre: titre.trim(),
      texte: texte.trim(),
      metier: reglages.avecMetier ? metier : null,
      ville: (lieu.affichage || '').trim() || null,
      codePostal: lieu.codePostal || null,
      latitude: lieu.latitude || null,
      longitude: lieu.longitude || null,
      dateDebut,
      dateFin,
      prix: reglages.avecPrix && prix.trim() ? Number(prix.replace(',', '.')) : null,
      unite: reglages.avecUnite ? unite : 'total',
    });

    setTitre(''); setTexte(''); setDu(''); setAu(''); setPrix('');
    setFormOuvert(false);
  };

  const manque = !titre.trim() || !texte.trim()
    || (reglages.avecMetier && !metier);

  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
      <View style={s.entete}>
        <Text style={s.enteteTitre}>La Place des pros</Text>
        <Text style={s.enteteTexte}>
          Sous-traitance, matériel, coups de main. Entre professionnels
          seulement : un particulier ne voit rien de cette page.
        </Text>
        {!formOuvert && (
          <BtnMain block onPress={() => setFormOuvert(true)}>
            <Plus size={13} color="#fff" />
            <Text style={s.btnTexte}>Poser une annonce</Text>
          </BtnMain>
        )}
      </View>

      {/* --- le formulaire --- */}
      {formOuvert && (
        <View style={s.form}>
          <View style={s.formHaut}>
            <Text style={s.formTitre}>Nouvelle annonce</Text>
            <Pressable onPress={() => setFormOuvert(false)} hitSlop={10}>
              <X size={16} color={C.muted} />
            </Pressable>
          </View>

          <Text style={s.label}>De quoi s'agit-il ?</Text>
          <View style={s.chipRow}>
            {TYPES_ANNONCE.map((t) => (
              <Chip key={t.cle} label={t.label} on={type === t.cle} onPress={() => setType(t.cle)} />
            ))}
          </View>
          <Text style={s.aide}>{reglages.aide}</Text>

          <Text style={s.label}>Titre</Text>
          <Field
            value={titre}
            onChangeText={setTitre}
            placeholder="Ex. : plaquiste recherché — chantier de 180 m²"
          />

          <Text style={s.label}>Détails</Text>
          <TextArea
            value={texte}
            onChangeText={setTexte}
            placeholder="Ce qu'il faut savoir pour se décider : surface, accès, matériel fourni..."
          />

          {reglages.avecMetier && (
            <>
              <Text style={s.label}>Métier concerné</Text>
              <View style={s.chipRow}>
                {METIERS.map((m) => (
                  <Chip key={m} label={m} on={metier === m} onPress={() => setMetier(m)} />
                ))}
              </View>
            </>
          )}

          <Text style={s.label}>Où</Text>
          <ChampVille valeur={lieu.affichage} onChange={setLieu} placeholder="Ville du chantier" />

          {reglages.avecDates && (
            <>
              <Text style={s.label}>Quand</Text>
              <Text style={s.aide}>
                C'est ce qui fait toute la différence : un artisan disponible
                cette semaine-là vous trouvera.
              </Text>
              <View style={s.deuxChamps}>
                <View style={{ flex: 1 }}>
                  <Field value={du} onChangeText={setDu} placeholder="Du 12/10" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field value={au} onChangeText={setAu} placeholder="Au 20/10" />
                </View>
              </View>
            </>
          )}

          {reglages.avecPrix && (
            <>
              <Text style={s.label}>Prix (euros)</Text>
              <View style={s.deuxChamps}>
                <View style={{ flex: 1 }}>
                  <Field
                    value={prix}
                    onChangeText={setPrix}
                    keyboardType="decimal-pad"
                    placeholder="180"
                  />
                </View>
              </View>
              {reglages.avecUnite && (
                <View style={s.chipRow}>
                  {UNITES.map((u) => (
                    <Chip key={u.cle} label={u.label} on={unite === u.cle} onPress={() => setUnite(u.cle)} />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={s.formBtns}>
            <BtnMini outline label="Annuler" onPress={() => setFormOuvert(false)} />
            <BtnMain label="Publier l'annonce" disabled={manque} onPress={publier} />
          </View>
          {manque && (
            <Text style={s.aide}>
              Il manque {!titre.trim() ? 'le titre' : ''}
              {!titre.trim() && !texte.trim() ? ' et ' : ''}
              {!texte.trim() ? 'les détails' : ''}
              {reglages.avecMetier && !metier ? ((!titre.trim() || !texte.trim()) ? ' et le métier' : 'le métier') : ''}.
            </Text>
          )}
        </View>
      )}

      {/* --- filtres --- */}
      <SectionLabel>
        {liste.length} {liste.length > 1 ? 'annonces' : 'annonce'}
      </SectionLabel>

      <View style={s.chipRow}>
        {TYPES_ANNONCE.map((t) => (
          <Chip
            key={t.cle}
            label={t.label}
            on={filtreType === t.cle}
            onPress={() => setFiltreType(filtreType === t.cle ? null : t.cle)}
          />
        ))}
      </View>

      <Pressable
        style={[s.verifies, verifiesSeulement && s.verifiesOn]}
        onPress={() => setVerifiesSeulement((v) => !v)}
      >
        <View style={[s.case, verifiesSeulement && s.caseOn]}>
          {verifiesSeulement && <Check size={11} color="#fff" />}
        </View>
        <BadgeCheck size={14} color={verifiesSeulement ? C.verif : C.muted} />
        <Text style={[s.verifiesTexte, verifiesSeulement && { color: C.ink }]}>
          Artisans vérifiés uniquement
        </Text>
      </Pressable>

      {filtreType && typeAnnonce(filtreType).avecMetier && (
        <View style={[s.chipRow, { marginTop: 10 }]}>
          {METIERS.map((m) => (
            <Chip
              key={m}
              label={m}
              on={filtreMetier === m}
              onPress={() => setFiltreMetier(filtreMetier === m ? null : m)}
            />
          ))}
        </View>
      )}

      {/* --- les annonces --- */}
      <View style={{ gap: 10, paddingBottom: 24, marginTop: 12 }}>
        {liste.map((a) => (
          <Annonce
            key={String(a.id)}
            annonce={a}
            onRepondre={() => onRepondre(a)}
            onFermer={() => onFermer(a)}
            onVoirProfil={onVoirProfil}
          />
        ))}

        {liste.length === 0 && (
          <EmptyState>
            {verifiesSeulement
              ? 'Aucune annonce d’artisan vérifié pour ce filtre.'
              : 'Aucune annonce pour le moment. Posez la première.'}
          </EmptyState>
        )}
      </View>
    </ScrollView>
  );
}

function Annonce({ annonce: a, onRepondre, onFermer, onVoirProfil }) {
  const t = typeAnnonce(a.type);
  const dates = libelleDates(a.dateDebut, a.dateFin);
  const prix = libellePrix(a.prix, a.unite);
  const auteur = a.auteur;

  return (
    <View style={s.carte}>
      <View style={[s.bandeau, { backgroundColor: t.couleur }]}>
        <Text style={s.bandeauTexte}>{t.long}</Text>
        {a.metier && <Text style={s.bandeauMetier}>{a.metier}</Text>}
      </View>

      <View style={s.carteCorps}>
        <Text style={s.titre}>{a.titre}</Text>

        <View style={s.reperes}>
          {!!dates && (
            <View style={s.repere}>
              <Calendar size={11} color={C.accent} />
              <Text style={[s.repereTexte, { color: C.accent }]}>{dates}</Text>
            </View>
          )}
          {!!prix && (
            <View style={s.repere}>
              <Text style={s.prix}>{prix}</Text>
            </View>
          )}
          {!!a.ville && (
            <View style={s.repere}>
              <MapPin size={11} color={C.muted} />
              <Text style={s.repereTexte}>
                {a.ville}{a.km !== null && a.km !== undefined ? ` · ${Math.round(a.km)} km` : ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={s.texte}>{a.texte}</Text>

        {(a.medias || []).slice(0, 2).map((m, i) => (
          <Media key={i} media={m} style={s.media} />
        ))}

        {auteur && (
          <Pressable style={s.auteur} onPress={() => onVoirProfil && onVoirProfil(auteur.id)}>
            <Avatar seed={auteur.id} uri={auteur.avatarUrl} size={30} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={s.auteurNom}>
                <Text style={s.auteurTexte} numberOfLines={1}>{auteur.entreprise}</Text>
                {auteur.verifie && <BadgeCheck size={12} color={C.verif} />}
              </View>
              <Text style={s.auteurMeta} numberOfLines={1}>
                {libelleMetiers(auteur)} · {a.time}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={s.bas}>
          <Text style={s.reponses}>
            {a.reponses} {a.reponses > 1 ? 'réponses' : 'réponse'}
          </Text>

          {a.aMoi ? (
            <BtnMini outline label="Retirer" onPress={onFermer} />
          ) : a.jyAiRepondu ? (
            <View style={s.dejaRepondu}>
              <Check size={12} color={C.accent2} />
              <Text style={s.dejaReponduTexte}>Vous avez répondu</Text>
            </View>
          ) : (
            <BtnMini onPress={onRepondre}>
              <MessageCircle size={12} color="#111" />
              <Text style={s.repondreTexte}>Répondre</Text>
            </BtnMini>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },

  entete: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent2,
    padding: 12, marginBottom: 14, gap: 8,
  },
  enteteTitre: { fontFamily: F.oswald6, fontSize: 14, color: C.ink },
  enteteTexte: { fontFamily: F.inter, fontSize: 11.5, color: C.muted, lineHeight: 17 },
  btnTexte: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },

  form: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    padding: 12, marginBottom: 14,
  },
  formHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formTitre: { fontFamily: F.oswald6, fontSize: 13, color: C.ink },
  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginTop: 12, marginBottom: 6 },
  aide: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deuxChamps: { flexDirection: 'row', gap: 8 },
  formBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 14 },

  verifies: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  verifiesOn: { borderColor: C.verif },
  case: {
    width: 17, height: 17, borderWidth: 1.5, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  caseOn: { backgroundColor: C.verif, borderColor: C.verif },
  verifiesTexte: { fontFamily: F.inter, fontSize: 12, color: C.muted },

  carte: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  bandeau: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 5, paddingHorizontal: 10,
  },
  bandeauTexte: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },
  bandeauMetier: { fontFamily: F.oswald6, fontSize: 10.5, color: 'rgba(255,255,255,0.85)' },
  carteCorps: { padding: 12, gap: 8 },
  titre: { fontFamily: F.oswald6, fontSize: 14, color: C.ink, lineHeight: 19 },

  reperes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  repere: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repereTexte: { fontFamily: F.inter, fontSize: 11.5, color: C.muted },
  prix: { fontFamily: F.oswald6, fontSize: 13, color: C.ink },

  texte: { fontFamily: F.inter, fontSize: 12.8, color: C.ink, lineHeight: 18 },
  media: { width: '100%', aspectRatio: 16 / 10 },

  auteur: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  auteurNom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  auteurTexte: { fontFamily: F.inter6, fontSize: 12.5, color: C.ink },
  auteurMeta: { fontFamily: F.inter, fontSize: 11, color: C.muted, marginTop: 1 },

  bas: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  reponses: { fontFamily: F.inter, fontSize: 11, color: C.muted },
  repondreTexte: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },
  dejaRepondu: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dejaReponduTexte: { fontFamily: F.oswald6, fontSize: 11, color: C.accent2 },
});
