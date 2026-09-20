/**
 * 8. Profil d'un autre professionnel — l'écran le plus riche.
 * Informations vérifiées, notation sur 3 critères, résumé IA des avis,
 * formulaire d'avis, liste des avis, réalisations, partenaires.
 * (ProfilProScreen du prototype)
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { C, F } from '../theme';
import { libelleMetiers } from '../lib/metiers';
import {
  Avatar, BtnMain, BtnMini, BtnOutline, EmptyState, SectionLabel, TextArea,
} from '../components/ui';
import EnteteProfilAuto, { NOM_DANS_ENTETE } from '../components/EnteteProfilAuto';
import ArtisanRow from '../components/ArtisanRow';
import PortfolioGrid from '../components/PortfolioGrid';
import {
  BadgeCheck, ShieldCheck, ShieldX, FileText, Sparkles, ClipboardCheck, MessageCircle,
} from '../components/icons';
import { EtatVerificationPublic } from '../components/RappelVerification';
import {
  detailDocument, VALIDE, ATTENTE, REFUSE, ABSENT,
} from '../lib/verification';
import { avgReviews } from '../data/demo';
import { aiSummarizeReviews } from '../lib/ai';

/* --- .crit-row : un critère + sa barre de progression --- */
function CritereBar({ label, value }) {
  return (
    <View style={s.critRow}>
      <Text style={s.critLabel}>{label}</Text>
      <View style={s.critBar}>
        <View style={[s.critFill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text style={s.critVal}>{value ? value.toFixed(1) : '—'}</Text>
    </View>
  );
}

/* --- une ligne du bloc "Informations vérifiées" --- */
/* Trois états et non deux : « reçu, en cours de vérification » n'est ni un
   feu vert ni un feu rouge, et l'afficher en rouge découragerait à tort. */
const APPARENCE = {
  [VALIDE]: { couleur: C.ok, Icone: ShieldCheck },
  [ATTENTE]: { couleur: C.accent2, Icone: FileText },
  [REFUSE]: { couleur: C.bad, Icone: ShieldX },
  [ABSENT]: { couleur: C.bad, Icone: ShieldX },
};

function VerifRow({ etat, label, value }) {
  const { couleur, Icone } = APPARENCE[etat] || APPARENCE[ABSENT];
  return (
    <View style={s.verifRow}>
      <Icone size={16} color={couleur} />
      <Text style={s.verifLabel}>{label}</Text>
      <Text style={[s.verifValue, { color: couleur }]}>{value}</Text>
    </View>
  );
}

export default function ProfilProScreen({
  pro, pros, following, onFollow, onContact, onViewProfile, onSubmitReview,
}) {
  const [showForm, setShowForm] = useState(false);
  const [rDelais, setRDelais] = useState(5);
  const [rQualite, setRQualite] = useState(5);
  const [rTarif, setRTarif] = useState(5);
  const [rTexte, setRTexte] = useState('');

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const reviews = pro.reviews || [];
  const avg = avgReviews(pro);
  const kbisDetail = detailDocument(pro, 'kbis');
  const assuranceDetail = detailDocument(pro, 'assurance');

  const submitReview = () => {
    if (!rTexte.trim()) return;
    onSubmitReview(pro.id, {
      delais: rDelais, qualite: rQualite, tarif: rTarif, commentaire: rTexte.trim(),
    });
    setRTexte('');
    setShowForm(false);
  };

  const generateSummary = async () => {
    if (reviews.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const texte = await aiSummarizeReviews(pro, reviews);
      setAiSummary(texte);
    } catch (e) {
      setAiError(e && e.message ? e.message : "Le résumé IA n'a pas pu être généré. Réessayez.");
    }
    setAiLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      <EnteteProfilAuto
        seed={pro.id}
        bannerUrl={pro.bannerUrl}
        avatarUrl={pro.avatarUrl}
        portfolio={pro.portfolio}
        titre={pro.entreprise}
        sousTitre={`${libelleMetiers(pro)} · ${pro.ville}`}
        verifie={pro.verifie}
      />

      {/* --- en-tête --- */}
      <View style={s.head}>
        {!NOM_DANS_ENTETE && (
          <>
            <View style={s.nameRow}>
              <Text style={s.name}>{pro.entreprise}</Text>
              {pro.verifie && <BadgeCheck size={16} color={C.verif} />}
            </View>
            <Text style={s.metier}>{libelleMetiers(pro, { max: 3 })} · {pro.ville}</Text>
          </>
        )}
        <Text style={s.sub}>{pro.exp} ans d'expérience · {avg.count} avis vérifiés</Text>

        <View style={s.stats}>
          <Stat value={pro.portfolio.length} label="Réalisations" />
          <Stat value={pro.followers + (following ? 1 : 0)} label="Abonnés" />
          <Stat value={avg.count ? avg.global.toFixed(1) : '—'} label="Note" />
        </View>

        <View style={s.headBtns}>
          <BtnMain label="Demander un devis" onPress={() => onContact(pro, 'devis')} />
          <BtnOutline label={following ? 'Suivi ✓' : 'Suivre'} on={following} onPress={() => onFollow(pro.id)} />
        </View>

        <Pressable style={s.linkBtn} onPress={() => onContact(pro, 'message')}>
          <MessageCircle size={13} color={C.accent2} />
          <Text style={s.linkBtnText}>Envoyer un message</Text>
        </Pressable>
      </View>

      <Text style={s.bio}>{pro.bio}</Text>

      {/* --- informations vérifiées --- */}
      <SectionLabel>Informations vérifiées</SectionLabel>
      <EtatVerificationPublic pro={pro} />
      <View style={s.verifBlock}>
        <VerifRow
          etat={assuranceDetail.etat}
          label="Assurance décennale"
          value={assuranceDetail.valeur}
        />
        <VerifRow
          etat={kbisDetail.etat}
          label="Extrait Kbis"
          value={kbisDetail.valeur}
        />
        <VerifRow
          etat={pro.rge ? VALIDE : ABSENT}
          label="Certification RGE"
          value={pro.rge ? 'Certifié' : 'Non certifié'}
        />
      </View>

      {/* --- réalisations --- */}
      <SectionLabel>Réalisations</SectionLabel>
      <PortfolioGrid items={pro.portfolio} />

      {/* --- avis --- */}
      <SectionLabel
        right={<BtnMini label={showForm ? 'Fermer' : 'Laisser un avis'} onPress={() => setShowForm((v) => !v)} />}
      >
        Avis clients vérifiés
      </SectionLabel>

      {avg.count > 0 && (
        <View style={s.ratingBlock}>
          <CritereBar label="Respect des délais" value={avg.delais} />
          <CritereBar label="Qualité du travail" value={avg.qualite} />
          <CritereBar label="Rapport qualité-prix" value={avg.tarif} />
        </View>
      )}

      {avg.count > 0 && (
        <View style={s.aiBox}>
          <View style={s.aiHead}>
            <Sparkles size={14} color={C.accent2} />
            <Text style={s.aiHeadText}>Résumé IA des avis</Text>
          </View>
          {aiSummary ? (
            <Text style={s.aiText}>{aiSummary}</Text>
          ) : (
            <BtnMini outline onPress={generateSummary} disabled={aiLoading} style={{ alignSelf: 'flex-start' }}>
              {aiLoading ? (
                <>
                  <ActivityIndicator size="small" color={C.ink} />
                  <Text style={s.aiBtnText}>Génération...</Text>
                </>
              ) : (
                <Text style={s.aiBtnText}>Générer un résumé IA</Text>
              )}
            </BtnMini>
          )}
          {!!aiError && <Text style={s.aiError}>{aiError}</Text>}
        </View>
      )}

      {showForm && (
        <View style={s.form}>
          <SliderRow label="Respect des délais" value={rDelais} onChange={setRDelais} />
          <SliderRow label="Qualité du travail" value={rQualite} onChange={setRQualite} />
          <SliderRow label="Rapport qualité-prix" value={rTarif} onChange={setRTarif} />
          <TextArea
            placeholder="Votre expérience avec cet artisan..."
            value={rTexte}
            onChangeText={setRTexte}
          />
          <BtnMain block label="Publier l'avis" onPress={submitReview} />
        </View>
      )}

      <View style={s.reviewList}>
        {reviews.map((r) => (
          <View key={String(r.id)} style={s.reviewCard}>
            <View style={s.reviewTop}>
              <Text style={s.reviewAuteur}>{r.auteur}</Text>
              {r.verifie && (
                <View style={s.reviewBadge}>
                  <ClipboardCheck size={11} color={C.ok} />
                  <Text style={s.reviewBadgeText}>Client vérifié</Text>
                </View>
              )}
              <Text style={s.reviewDate}>{r.date}</Text>
            </View>
            <View style={s.reviewScores}>
              <Text style={s.reviewScore}>Délais {r.delais}/5</Text>
              <Text style={s.reviewScore}>Qualité {r.qualite}/5</Text>
              <Text style={s.reviewScore}>Tarif {r.tarif}/5</Text>
            </View>
            <Text style={s.reviewTexte}>{r.commentaire}</Text>
          </View>
        ))}
        {reviews.length === 0 && (
          <EmptyState>Aucun avis pour le moment — soyez le premier à en laisser un.</EmptyState>
        )}
      </View>

      {/* --- partenaires --- */}
      <SectionLabel>Partenaires</SectionLabel>
      <View style={s.partners}>
        {pro.partners.map((id) => pros[id] && (
          <ArtisanRow
            key={String(id)}
            pro={pros[id]}
            avatarSize={40}
            right={<BtnMini label="Profil" onPress={() => onViewProfile(id)} />}
          />
        ))}
        {pro.partners.length === 0 && <EmptyState>Aucun partenaire pour le moment.</EmptyState>}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* --- .slider-row : un curseur de 1 à 5 --- */
function SliderRow({ label, value, onChange }) {
  return (
    <View style={s.sliderRow}>
      <Text style={s.sliderLabel}>{label}</Text>
      <Slider
        style={{ flex: 1, height: 32 }}
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={C.accent}
        maximumTrackTintColor={C.line}
        thumbTintColor={C.ink}
      />
      <Text style={s.sliderValue}>{value}/5</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  name: { fontFamily: F.oswald6, fontSize: 17, color: C.ink },
  metier: { fontSize: 12.5, color: C.muted, marginTop: 2, fontFamily: F.inter },
  sub: { fontSize: 11, color: C.accent2, marginTop: 4, fontFamily: F.inter6 },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginVertical: 14 },
  statValue: { fontFamily: F.oswald6, fontSize: 16, color: C.ink },
  statLabel: { fontSize: 11, color: C.muted, fontFamily: F.inter },
  headBtns: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  linkBtnText: { color: C.accent2, fontSize: 11.5, fontFamily: F.inter6 },
  bio: {
    fontSize: 12, color: C.muted, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4,
    textAlign: 'center', lineHeight: 18, fontFamily: F.inter,
  },

  verifBlock: { gap: 6, paddingHorizontal: 16, paddingBottom: 6 },
  verifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 8, paddingHorizontal: 10,
  },
  verifLabel: { flex: 1, color: C.muted, fontSize: 11.5, fontFamily: F.inter },
  verifValue: { fontSize: 11, fontFamily: F.inter6 },

  ratingBlock: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10, gap: 7 },
  critRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  critLabel: { fontSize: 11, color: C.muted, width: 120, fontFamily: F.inter },
  critBar: { flex: 1, height: 6, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden' },
  critFill: { height: '100%', backgroundColor: C.accent },
  critVal: { fontSize: 11, fontFamily: F.inter6, width: 26, textAlign: 'right', color: C.ink },

  aiBox: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.accent2, paddingVertical: 10, paddingHorizontal: 12,
  },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiHeadText: { fontFamily: F.oswald6, fontSize: 12, color: C.accent2 },
  aiText: { fontSize: 12, lineHeight: 18, color: C.ink, fontFamily: F.inter },
  aiBtnText: { fontFamily: F.oswald6, fontSize: 11, color: C.ink },
  aiError: { fontSize: 11, color: C.bad, marginTop: 4, fontFamily: F.inter },

  form: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, padding: 12, gap: 8,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { width: 120, fontSize: 11, color: C.muted, fontFamily: F.inter },
  sliderValue: { width: 32, textAlign: 'right', color: C.ink, fontSize: 11, fontFamily: F.inter6 },

  reviewList: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  reviewCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  reviewAuteur: { fontFamily: F.inter6, fontSize: 12, color: C.ink },
  reviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.okBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8,
  },
  reviewBadgeText: { fontSize: 9.5, color: C.ok, fontFamily: F.inter },
  reviewDate: { fontSize: 10.5, color: C.muted, marginLeft: 'auto', fontFamily: F.inter },
  reviewScores: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  reviewScore: { fontSize: 10, color: C.muted, fontFamily: F.inter },
  reviewTexte: { fontSize: 12, lineHeight: 17, color: C.ink, fontFamily: F.inter },

  partners: { gap: 10, paddingHorizontal: 16, paddingBottom: 24 },
});
