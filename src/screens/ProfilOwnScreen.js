/**
 * 7. Mon profil — différent selon pro / particulier.
 * (ProfilOwnScreen du prototype)
 *
 * On y trouve aussi les deux commandes du compte : modifier le profil
 * et se déconnecter, qui ramène à l'écran d'accueil.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  BtnMini, BtnOutline, EmptyState, SectionLabel,
} from '../components/ui';
import EnteteProfilAuto, { NOM_DANS_ENTETE } from '../components/EnteteProfilAuto';
import ArtisanRow from '../components/ArtisanRow';
import PortfolioGrid from '../components/PortfolioGrid';
import { BadgeCheck } from '../components/icons';
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
function Compte({ onLogout }) {
  return (
    <View style={s.compte}>
      <Pressable style={s.logout} onPress={onLogout}>
        <Text style={s.logoutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

export default function ProfilOwnScreen({
  userType, pros, myProId, monProfil, followingIds, savedIds,
  onAddPartner, onViewProfile, onEdit, onLogout,
}) {
  const me = pros[myProId];
  const [showAdd, setShowAdd] = useState(false);

  /* --- profil particulier --- */
  if (userType === 'particulier') {
    const followed = [...followingIds];
    return (
      <ScrollView style={{ flex: 1 }}>
        <EnteteProfilAuto
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

        <Compte onLogout={onLogout} />
      </ScrollView>
    );
  }

  /* --- profil professionnel --- */
  if (!me) return <EmptyState>Profil professionnel introuvable.</EmptyState>;

  const avg = avgReviews(me);
  const candidats = Object.values(pros).filter(
    (p) => p.id !== me.id && !me.partners.includes(p.id),
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <EnteteProfilAuto
        seed={me.id}
        bannerUrl={me.bannerUrl}
        avatarUrl={me.avatarUrl}
        portfolio={me.portfolio}
        titre={me.entreprise}
        sousTitre={`${me.metier} · ${me.ville}`}
        verifie={me.verifie}
      />
      <View style={s.head}>
        {!NOM_DANS_ENTETE && (
          <>
            <View style={s.nameRow}>
              <Text style={s.name}>{me.entreprise}</Text>
              {me.verifie && <BadgeCheck size={16} color={C.verif} />}
            </View>
            <Text style={s.metier}>{me.metier} · {me.ville}</Text>
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

      <Text style={s.bio}>{me.bio}</Text>

      <RappelVerification
        statut={me.verificationStatut}
        note={me.verificationNote}
        onAction={onEdit}
        style={{ marginHorizontal: 16, marginTop: 10 }}
      />

      <SectionLabel>Portfolio de chantiers</SectionLabel>
      <PortfolioGrid items={me.portfolio} />

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
            Vous n'avez pas encore ajouté de partenaire. Développez votre réseau Opus.
          </EmptyState>
        )}
        {showAdd && candidats.map((c) => (
          <ArtisanRow
            key={String(c.id)}
            pro={c}
            avatarSize={40}
            right={<BtnMini label="Ajouter" onPress={() => onAddPartner(me.id, c.id)} />}
          />
        ))}
      </View>

      <Compte onLogout={onLogout} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  name: { fontFamily: F.oswald6, fontSize: 17, color: C.ink },
  metier: { fontSize: 12.5, color: C.muted, marginTop: 2, fontFamily: F.inter },
  sub: { fontSize: 11, color: C.accent2, marginTop: 4, fontFamily: F.inter6, textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginVertical: 14 },
  statValue: { fontFamily: F.oswald6, fontSize: 16, color: C.ink },
  statLabel: { fontSize: 11, color: C.muted, fontFamily: F.inter },
  bio: {
    fontSize: 12, color: C.muted, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4,
    textAlign: 'center', lineHeight: 18, fontFamily: F.inter,
  },
  list: { gap: 10, paddingHorizontal: 16, paddingBottom: 24 },

  compte: { paddingHorizontal: 16, paddingBottom: 34, alignItems: 'center' },
  logout: { paddingVertical: 12, paddingHorizontal: 20 },
  logoutText: { fontFamily: F.oswald6, fontSize: 12.5, color: C.bad },
});
