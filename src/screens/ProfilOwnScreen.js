/**
 * 7. Mon profil — différent selon pro / particulier.
 * (ProfilOwnScreen du prototype)
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, GRAD_120 } from '../theme';
import { Avatar, BtnMini, EmptyState, SectionLabel } from '../components/ui';
import ArtisanRow from '../components/ArtisanRow';
import PortfolioGrid from '../components/PortfolioGrid';
import { BadgeCheck } from '../components/icons';
import { avgReviews } from '../data/demo';

function Cover() {
  return (
    <LinearGradient
      colors={['#1B4B6B', '#3a3a38']}
      start={GRAD_120.start}
      end={GRAD_120.end}
      style={{ height: 100 }}
    />
  );
}

export default function ProfilOwnScreen({
  userType, pros, myProId, followingIds, savedIds, onAddPartner, onViewProfile,
}) {
  const me = pros[myProId];
  const [showAdd, setShowAdd] = useState(false);

  /* --- profil particulier --- */
  if (userType === 'particulier') {
    const followed = [...followingIds];
    return (
      <ScrollView style={{ flex: 1 }}>
        <Cover />
        <View style={s.head}>
          <Avatar seed={9} size={76} />
          <Text style={[s.name, { marginTop: 8 }]}>Vous</Text>
          <Text style={s.metier}>Particulier</Text>
          <View style={s.stats}>
            <Stat value={followingIds.size} label="Abonnements" />
            <Stat value={savedIds.size} label="Enregistrés" />
          </View>
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
      <Cover />
      <View style={s.head}>
        <Avatar seed={me.id} size={76} />
        <View style={s.nameRow}>
          <Text style={s.name}>{me.entreprise}</Text>
          {me.verifie && <BadgeCheck size={16} color={C.verif} />}
        </View>
        <Text style={s.metier}>{me.metier} · {me.ville}</Text>
        <Text style={s.sub}>
          SIRET {me.siret} vérifié · {me.assurance.valide ? 'Assurance décennale à jour' : 'Assurance non renseignée'}
        </Text>
        <View style={s.stats}>
          <Stat value={me.portfolio.length} label="Réalisations" />
          <Stat value={me.followers} label="Abonnés" />
          <Stat value={avg.count ? avg.global.toFixed(1) : '—'} label="Note" />
        </View>
      </View>

      <Text style={s.bio}>{me.bio}</Text>

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

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingBottom: 6, alignItems: 'center', marginTop: -34 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
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
});
