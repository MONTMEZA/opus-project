/**
 * 8. Profil d'un autre professionnel — l'écran le plus riche.
 * Informations vérifiées, notation sur 3 critères, résumé IA des avis,
 * formulaire d'avis, liste des avis, réalisations, partenaires.
 * (ProfilProScreen du prototype)
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import {
  C, F, T, S, GOUTTIERE, CARTE_PLEINE,
} from '../theme';
import GlissementLateral from '../components/GlissementLateral';
import { metierPrincipal, nomMetier } from '../lib/metiers';
import MetiersPro from '../components/MetiersPro';
import {
  BtnMain, BtnMini, BtnOutline, EmptyState, SectionLabel, TextArea,
} from '../components/ui';
import EnteteProfilAuto, { NOM_DANS_ENTETE } from '../components/EnteteProfilAuto';
import ArtisanRow from '../components/ArtisanRow';
import PortfolioGrid from '../components/PortfolioGrid';
import { SqueletteAvis, SquelettePortfolio } from '../components/Squelette';
import FicheContactPro from '../components/FicheContactPro';
import {
  BadgeCheck, ShieldCheck, ShieldX, FileText, Sparkles, ClipboardCheck, MessageCircle, Flag,
  Play, ChevronLeft,
} from '../components/icons';
import { EtatVerificationPublic } from '../components/RappelVerification';
import {
  detailDocument, detailRge, VALIDE, ATTENTE, REFUSE, ABSENT,
  pieceExistence, pieceAssurance,
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

function VerifRow({ etat, label, value, neutre }) {
  const { couleur, Icone } = APPARENCE[etat] || APPARENCE[ABSENT];
  /* `neutre` sert à un seul cas : une certification qu'on n'a aucune raison
     d'avoir. L'afficher en rouge ferait passer pour un manquement ce qui
     n'en est pas un. */
  if (neutre) {
    return (
      <View style={s.verifRow}>
        <FileText size={16} color={C.muted} />
        <Text style={s.verifLabel}>{label}</Text>
        <Text style={[s.verifValue, { color: C.muted }]}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={s.verifRow}>
      <Icone size={16} color={couleur} />
      <Text style={s.verifLabel}>{label}</Text>
      <Text style={[s.verifValue, { color: couleur }]}>{value}</Text>
    </View>
  );
}

export default function ProfilProScreen({
  pro, pros, following, onFollow, onContact, onViewProfile, onSubmitReview, onSignaler,
  charge = true, onRetourFilVideo = null,
}) {
  const [showForm, setShowForm] = useState(false);
  const [rDelais, setRDelais] = useState(5);
  const [rQualite, setRQualite] = useState(5);
  const [rTarif, setRTarif] = useState(5);
  const [rTexte, setRTexte] = useState('');

  /* Le défilement vit sur le fil natif : la bannière le suit sans qu'une
     seule valeur ne remonte en JavaScript. */
  const defilement = useSharedValue(0);
  const suivreDefilement = useAnimatedScrollHandler((e) => {
    defilement.value = e.contentOffset.y;
  });

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const reviews = pro.reviews || [];
  const avg = avgReviews(pro);
  const kbisDetail = detailDocument(pro, 'kbis');
  const assuranceDetail = detailDocument(pro, 'assurance');
  const rgeDetail = detailRge(pro);

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

  /* LE GESTE DE RETOUR — et pourquoi il ne s'affiche pas toujours.
     Il n'a de sens que si la fiche a été ouverte DEPUIS le fil vidéo :
     ailleurs, le fil vidéo n'est pas « derrière », et y arriver d'un coup
     de pouce serait une téléportation. C'est `OpusApp` qui s'en souvient.
     Et il se tait pendant le formulaire d'avis : trois curseurs s'y
     tirent horizontalement, comme ce geste. */
  const contenu = (
    <Animated.ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      onScroll={suivreDefilement}
      scrollEventThrottle={16}
    >
      <EnteteProfilAuto
        defilement={defilement}
        seed={pro.id}
        bannerUrl={pro.bannerUrl}
        avatarUrl={pro.avatarUrl}
        portfolio={pro.portfolio}
        titre={pro.entreprise}
        sousTitre={`${nomMetier(metierPrincipal(pro))} · ${pro.ville}`}
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
        {/* Le titre ne porte plus que le métier PRINCIPAL. Il affichait
            « Maçonnerie générale +2 », c'est-à-dire un décompte que
            personne ne pouvait dérouler. Les quatre métiers sont juste en
            dessous, dans leur bloc, avec leurs spécialités. */}
            <Text style={s.metier}>{nomMetier(metierPrincipal(pro))} · {pro.ville}</Text>
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

        {/* Signaler ou bloquer ce profil. Discret — on ne le cherche que
            lorsqu'on en a besoin — mais toujours au même endroit, sous les
            boutons de contact, comme sur tous les réseaux. */}
        {!!onSignaler && (
          <Pressable
            style={s.linkBtn}
            onPress={() => onSignaler({
              cibleType: 'profil',
              cibleId: pro.id,
              auteurId: pro.id,
              auteurNom: pro.entreprise,
              extrait: pro.bio,
            })}
          >
            <Flag size={12} color={C.muted} />
            <Text style={[s.linkBtnText, { color: C.muted }]}>
              Signaler ou bloquer ce profil
            </Text>
          </Pressable>
        )}
      </View>

      {/* La première question d'un client : « est-ce qu'il fait ce dont
          j'ai besoin ? » Elle passe donc avant la présentation, et avant
          le téléphone. */}
      <MetiersPro pro={pro} />

      <Text style={s.bio}>{pro.bio}</Text>

      {/* --- informations vérifiées --- */}
      <SectionLabel>Informations vérifiées</SectionLabel>
      <EtatVerificationPublic pro={pro} />
      <View style={s.verifBlock}>
        <VerifRow
          etat={assuranceDetail.etat}
          label={pieceAssurance(pro).nom}
          value={assuranceDetail.valeur}
        />
        <VerifRow
          etat={kbisDetail.etat}
          label={pieceExistence().court}
          value={kbisDetail.valeur}
        />
        {/* Trois états, pas deux. « Déclarée, en cours de vérification »
            n'est pas la même chose que « non certifié » : la première dit
            que l'attestation est arrivée et qu'un humain doit la regarder.
            Et l'absence de RGE reste NEUTRE — grise, pas rouge : un
            carreleur n'a aucune raison d'en avoir une. */}
        <VerifRow
          etat={rgeDetail.etat}
          label="Certification RGE"
          value={rgeDetail.valeur}
          neutre={rgeDetail.neutre}
        />
      </View>

      {/* La fiche de contact — téléphone, zone, spécialités. Le même
          composant sert sur « mon profil » : c'est ce qui garantit que
          l'artisan voit exactement ce que voient ses clients. */}
      <FicheContactPro pro={pro} />

      {/* --- réalisations --- */}
      <SectionLabel>Réalisations</SectionLabel>
      {charge
        ? <PortfolioGrid items={pro.portfolio} />
        : <SquelettePortfolio />}

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
        {/* « Aucun avis » est une affirmation. On ne l'écrit donc qu'une
            fois la fiche complète arrivée — avant, on montre la forme de ce
            qui vient. */}
        {!charge && <SqueletteAvis />}
        {charge && reviews.length === 0 && (
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
    </Animated.ScrollView>
  );

  if (!onRetourFilVideo) return contenu;

  return (
    <GlissementLateral
      style={{ flex: 1 }}
      fond={C.bg}
      actif={!showForm}
      onVersDroite={onRetourFilVideo}
      apercuGauche={<ApercuFilVideo />}
    >
      {contenu}
    </GlissementLateral>
  );
}

/**
 * Ce qui attend derrière la fiche quand le doigt part à droite.
 *
 * Son contenu est calé contre le bord DROIT : c'est par là qu'il entre, et
 * c'est donc la première chose qu'on en voit. Centré, il resterait caché
 * par la fiche pendant tout le geste — on ne verrait qu'une bande vide, et
 * le glissement paraîtrait ne mener nulle part. L'erreur a déjà été faite
 * une fois, sur l'aperçu du fil vidéo.
 */
function ApercuFilVideo() {
  return (
    <View style={s.apercu}>
      <View style={s.apercuCorps}>
        <View style={s.apercuRond}><Play size={30} color="#fff" /></View>
        <Text style={s.apercuTitre}>Le fil vidéo</Text>
        <View style={s.apercuRetour}>
          <ChevronLeft size={14} color="rgba(255,255,255,0.72)" />
          <Text style={s.apercuMeta}>Retour</Text>
        </View>
      </View>
    </View>
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
  /* L'APERÇU DU FIL VIDÉO — sur le noir du fil, pas sur le béton : ce
     qu'on annonce doit ressembler à ce qu'on va trouver. */
  apercu: { flex: 1, backgroundColor: C.dark, justifyContent: 'center' },
  apercuCorps: { alignItems: 'flex-end', alignSelf: 'flex-end', paddingHorizontal: 28, gap: 6 },
  apercuRond: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
  },
  apercuTitre: { fontFamily: F.oswald7, fontSize: 21, color: '#fff', marginTop: 6 },
  apercuRetour: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  apercuMeta: { fontFamily: F.inter, fontSize: T.corps, color: 'rgba(255,255,255,0.72)' },


  head: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  name: { fontFamily: F.oswald6, fontSize: 17, color: C.ink },
  metier: { fontSize: T.corps, color: C.muted, marginTop: 2, fontFamily: F.inter },
  sub: { fontSize: T.petit, color: C.accent2, marginTop: 4, fontFamily: F.inter6 },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginVertical: 14 },
  statValue: { fontFamily: F.oswald6, fontSize: 16, color: C.ink },
  statLabel: { fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  headBtns: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  linkBtnText: { color: C.accent2, fontSize: T.courant, fontFamily: F.inter6 },
  bio: {
    fontSize: T.courant, color: C.muted, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4,
    textAlign: 'center', lineHeight: 18, fontFamily: F.inter,
  },

  verifBlock: { gap: 6, paddingHorizontal: 16, paddingBottom: 6 },
  verifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 8, paddingHorizontal: 10,
  },
  verifLabel: { flex: 1, color: C.muted, fontSize: T.courant, fontFamily: F.inter },
  verifValue: { fontSize: T.petit, fontFamily: F.inter6 },

  ratingBlock: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10, gap: 7 },
  critRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  critLabel: { fontSize: T.petit, color: C.muted, width: 120, fontFamily: F.inter },
  critBar: { flex: 1, height: 6, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden' },
  critFill: { height: '100%', backgroundColor: C.accent },
  critVal: { fontSize: T.petit, fontFamily: F.inter6, width: 26, textAlign: 'right', color: C.ink },

  aiBox: {
    ...CARTE_PLEINE,
    borderColor: C.accent2,
    marginHorizontal: GOUTTIERE, marginBottom: S.md + 2,
  },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiHeadText: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2 },
  aiText: { fontSize: T.courant, lineHeight: 18, color: C.ink, fontFamily: F.inter },
  aiBtnText: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  aiError: { fontSize: T.petit, color: C.bad, marginTop: 4, fontFamily: F.inter },

  form: {
    marginHorizontal: 16, marginBottom: 14, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, padding: 12, gap: 8,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { width: 120, fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  sliderValue: { width: 32, textAlign: 'right', color: C.ink, fontSize: T.petit, fontFamily: F.inter6 },

  reviewList: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  reviewCard: { ...CARTE_PLEINE },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  reviewAuteur: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },
  reviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.okBg, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8,
  },
  reviewBadgeText: { fontSize: 9.5, color: C.ok, fontFamily: F.inter },
  reviewDate: { fontSize: T.petit, color: C.muted, marginLeft: 'auto', fontFamily: F.inter },
  reviewScores: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  reviewScore: { fontSize: T.micro, color: C.muted, fontFamily: F.inter },
  reviewTexte: { fontSize: T.courant, lineHeight: 17, color: C.ink, fontFamily: F.inter },

  partners: { gap: 10, paddingHorizontal: 16, paddingBottom: 24 },
});
