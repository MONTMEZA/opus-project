/**
 * 7. Mon profil — différent selon pro / particulier.
 * (ProfilOwnScreen du prototype)
 *
 * On y trouve aussi les deux commandes du compte : modifier le profil
 * et se déconnecter, qui ramène à l'écran d'accueil.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { C, F, T, S } from '../theme';
import { metierPrincipal, nomMetier } from '../lib/metiers';
import MetiersPro from '../components/MetiersPro';
import {
  BtnMini, BtnOutline, EmptyState, SectionLabel,
} from '../components/ui';
import EnteteProfilAuto, { NOM_DANS_ENTETE } from '../components/EnteteProfilAuto';
import ArtisanRow from '../components/ArtisanRow';
import PortfolioGrid from '../components/PortfolioGrid';
import FicheContactPro from '../components/FicheContactPro';
import { BadgeCheck, Lock, ChevronRight } from '../components/icons';
import RappelVerification from '../components/RappelVerification';
import { resumeVerification, toutValide } from '../lib/verification';
import { avgReviews } from '../data/demo';

function Stat({ value, label }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/** Les deux commandes du compte, en bas de page. */
/**
 * Le bas du profil : ce qui relève du compte, et non du métier.
 *
 * « Confidentialité et sécurité » est mis AVANT la déconnexion et bien
 * visible, avec son icône : c'est là que se trouvent les personnes bloquées,
 * les signalements déposés, les textes légaux, la récupération de ses données
 * et la suppression du compte. Les magasins d'applications vérifient que ces
 * choses existent ET qu'on les trouve — enterrer la suppression de compte au
 * fond d'un formulaire de contact est le motif de refus le plus courant.
 */
function Compte({ onLogout, onConfidentialite }) {
  return (
    <View style={s.compte}>
      {!!onConfidentialite && (
        <Pressable style={s.reglage} onPress={onConfidentialite}>
          <Lock size={15} color={C.accent2} />
          <Text style={s.reglageTexte}>Confidentialité et sécurité</Text>
          <ChevronRight size={15} color={C.muted} />
        </Pressable>
      )}
      <Pressable style={s.logout} onPress={onLogout}>
        <Text style={s.logoutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

export default function ProfilOwnScreen({
  userType, pros, myProId, monProfil, followingIds, savedIds,
  demandesPartenariat = [], partenariatsEnvoyes = [],
  onDemanderPartenariat, onRepondrePartenariat, onViewProfile, onEdit,
  onMesPublications, onGererPortfolio, nbPublications = 0, onLogout,
  onConfidentialite,
}) {
  const me = pros[myProId];
  const [showAdd, setShowAdd] = useState(false);
  /* Comme sur la fiche d'un confrère : la bannière suit le doigt, sans
     qu'aucune valeur ne remonte en JavaScript. */
  const defilement = useSharedValue(0);
  const suivreDefilement = useAnimatedScrollHandler((e) => {
    defilement.value = e.contentOffset.y;
  });

  /* --- profil particulier --- */
  if (userType === 'particulier') {
    const followed = [...followingIds];
    return (
      <Animated.ScrollView
        style={{ flex: 1 }}
        onScroll={suivreDefilement}
        scrollEventThrottle={16}
      >
        <EnteteProfilAuto
          defilement={defilement}
          seed={9}
          bannerUrl={monProfil.bannerUrl}
          avatarUrl={monProfil.avatarUrl}
          titre={monProfil.nom || 'Vous'}
          sousTitre={`Particulier${monProfil.ville ? ` · ${monProfil.ville}` : ''}`}
        />
        <View style={s.head}>
          {!NOM_DANS_ENTETE && (
            <>
              <Text style={[s.name, { marginTop: 10 }]}>{monProfil.nom || 'Vous'}</Text>
              <Text style={s.metier}>
                Particulier{monProfil.ville ? ` · ${monProfil.ville}` : ''}
              </Text>
            </>
          )}
          <View style={s.stats}>
            <Stat value={followingIds.size} label="Abonnements" />
            <Stat value={savedIds.size} label="Enregistrés" />
          </View>
          <BtnOutline label="Modifier mon profil" onPress={onEdit} />
        </View>

        <SectionLabel>Professionnels suivis</SectionLabel>
        <View style={s.list}>
          {followed.map((id) => pros[id] && (
            <ArtisanRow
              key={String(id)}
              pro={pros[id]}
              avatarSize={40}
              right={<BtnMini label="Profil" onPress={() => onViewProfile(id)} />}
            />
          ))}
          {followingIds.size === 0 && (
            <EmptyState>Vous ne suivez encore aucun professionnel.</EmptyState>
          )}
        </View>

        <Compte onLogout={onLogout} onConfidentialite={onConfidentialite} />
      </Animated.ScrollView>
    );
  }

  /* --- profil professionnel --- */
  if (!me) return <EmptyState>Profil professionnel introuvable.</EmptyState>;

  const avg = avgReviews(me);
  // On ne propose ni soi-même, ni un partenaire déjà en place, ni quelqu'un
  // dont la demande est déjà en cours dans un sens ou dans l'autre.
  const candidats = Object.values(pros).filter((p) => p.id !== me.id
    && !me.partners.includes(p.id)
    && !demandesPartenariat.includes(p.id));

  return (
    <Animated.ScrollView
      style={{ flex: 1 }}
      onScroll={suivreDefilement}
      scrollEventThrottle={16}
    >
      <EnteteProfilAuto
        defilement={defilement}
        seed={me.id}
        bannerUrl={me.bannerUrl}
        avatarUrl={me.avatarUrl}
        portfolio={me.portfolio}
        titre={me.entreprise}
        sousTitre={`${nomMetier(metierPrincipal(me))} · ${me.ville}`}
        verifie={me.verifie}
      />
      <View style={s.head}>
        {!NOM_DANS_ENTETE && (
          <>
            <View style={s.nameRow}>
              <Text style={s.name}>{me.entreprise}</Text>
              {me.verifie && <BadgeCheck size={16} color={C.verif} />}
            </View>
        {/* Le titre ne porte plus que le métier PRINCIPAL. Il affichait
            « Maçonnerie générale +2 », c'est-à-dire un décompte que
            personne ne pouvait dérouler. Les quatre métiers sont juste en
            dessous, dans leur bloc, avec leurs spécialités. */}
            <Text style={s.metier}>{nomMetier(metierPrincipal(me))} · {me.ville}</Text>
          </>
        )}
        {/* Le texte est déduit des documents réellement validés : il ne peut
            plus annoncer « vérifié » pendant que le rappel juste en dessous
            réclame les mêmes justificatifs. */}
        <Text style={[s.sub, !toutValide(me) && { color: C.muted }]}>
          {resumeVerification(me)}
        </Text>
        <View style={s.stats}>
          <Stat value={me.portfolio.length} label="Réalisations" />
          <Stat value={me.followers} label="Abonnés" />
          <Stat value={avg.count ? avg.global.toFixed(1) : '—'} label="Note" />
        </View>
        <BtnOutline label="Modifier mon profil" onPress={onEdit} />
      </View>

      {/* Le même bloc que voient ses clients : c'est ce qui garantit
          qu'il sait à quoi ressemble sa fiche. */}
      <MetiersPro pro={me} estMoi onEdit={onEdit} />

      <Text style={s.bio}>{me.bio}</Text>

      {/* Exactement le bloc que voient vos clients — et, s'il est vide, la
          seule invitation de tout l'écran à le remplir. */}
      <FicheContactPro pro={me} estMoi onEdit={onEdit} />

      <RappelVerification
        statut={me.verificationStatut}
        note={me.verificationNote}
        onAction={onEdit}
        style={{ marginHorizontal: 16, marginTop: 10 }}
      />

      <SectionLabel
        right={me.portfolio.length > 0
          ? <BtnMini outline label="Organiser" onPress={onGererPortfolio} />
          : null}
      >
        Portfolio de chantiers
      </SectionLabel>
      <PortfolioGrid items={me.portfolio} />

      {/* Le fil mêle nos publications à celles des autres : pour retrouver la
          sienne d'il y a trois semaines, il faut un endroit à part. */}
      <View style={s.pad}>
        <BtnOutline
          label={nbPublications > 0
            ? `Mes publications (${nbPublications})`
            : 'Mes publications'}
          onPress={onMesPublications}
        />
      </View>

      {/* --- demandes de partenariat reçues --- */}
      {demandesPartenariat.length > 0 && (
        <>
          <SectionLabel>Demandes de partenariat</SectionLabel>
          <View style={s.list}>
            {demandesPartenariat.map((id) => pros[id] && (
              <ArtisanRow
                key={String(id)}
                pro={pros[id]}
                avatarSize={40}
                right={(
                  <View style={s.reponse}>
                    <BtnMini label="Accepter" onPress={() => onRepondrePartenariat(id, true)} />
                    <BtnMini outline label="Refuser" onPress={() => onRepondrePartenariat(id, false)} />
                  </View>
                )}
              />
            ))}
          </View>
          <Text style={s.noteSection}>
            Un partenariat engage votre nom autant que le sien : il n'apparaît
            sur vos deux profils qu'une fois accepté.
          </Text>
        </>
      )}

      <SectionLabel
        right={<BtnMini label={showAdd ? 'Fermer' : '+ Ajouter'} onPress={() => setShowAdd((v) => !v)} />}
      >
        Mes partenaires
      </SectionLabel>

      <View style={s.list}>
        {me.partners.map((id) => pros[id] && (
          <ArtisanRow
            key={String(id)}
            pro={pros[id]}
            avatarSize={40}
            right={<BtnMini label="Profil" onPress={() => onViewProfile(id)} />}
          />
        ))}
        {me.partners.length === 0 && !showAdd && (
          <EmptyState>
            Vous n'avez pas encore de partenaire. Développez votre réseau Opus.
          </EmptyState>
        )}

        {/* demandes envoyées, en attente de réponse */}
        {!showAdd && partenariatsEnvoyes.map((id) => pros[id] && (
          <ArtisanRow
            key={`attente-${id}`}
            pro={pros[id]}
            avatarSize={40}
            right={<Text style={s.attente}>En attente</Text>}
          />
        ))}

        {showAdd && candidats.map((c) => {
          const envoyee = partenariatsEnvoyes.includes(c.id);
          return (
            <ArtisanRow
              key={String(c.id)}
              pro={c}
              avatarSize={40}
              right={envoyee
                ? <Text style={s.attente}>Demandé</Text>
                : <BtnMini label="Demander" onPress={() => onDemanderPartenariat(c.id)} />}
            />
          );
        })}
      </View>

      <Compte onLogout={onLogout} onConfidentialite={onConfidentialite} />
    </Animated.ScrollView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  name: { fontFamily: F.oswald6, fontSize: 17, color: C.ink },
  metier: { fontSize: T.corps, color: C.muted, marginTop: 2, fontFamily: F.inter },
  sub: { fontSize: T.petit, color: C.accent2, marginTop: 4, fontFamily: F.inter6, textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginVertical: 14 },
  statValue: { fontFamily: F.oswald6, fontSize: 16, color: C.ink },
  statLabel: { fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  bio: {
    fontSize: T.courant, color: C.muted, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4,
    textAlign: 'center', lineHeight: 18, fontFamily: F.inter,
  },
  list: { gap: 10, paddingHorizontal: 16, paddingBottom: 24 },
  pad: { paddingHorizontal: 16, paddingTop: 10 },
  reponse: { flexDirection: 'row', gap: 6 },
  attente: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6 },
  noteSection: {
    fontSize: T.petit, color: C.muted, fontFamily: F.inter, lineHeight: 16,
    paddingHorizontal: 16, paddingBottom: 6, marginTop: -12,
  },

  compte: { paddingHorizontal: S.lg, paddingBottom: 34, gap: S.md },
  reglage: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: S.md, paddingHorizontal: S.md,
  },
  reglageTexte: { flex: 1, fontFamily: F.inter5, fontSize: T.courant, color: C.ink },
  logout: { paddingVertical: S.md, paddingHorizontal: 20, alignSelf: 'center' },
  logoutText: { fontFamily: F.oswald6, fontSize: T.corps, color: C.bad },
});
