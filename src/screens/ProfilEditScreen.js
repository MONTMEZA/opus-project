/**
 * Modifier mon profil — pro ou particulier.
 *
 * Côté professionnel, l'écran contient aussi le miroir du bouton SOS :
 * c'est ici que l'artisan déclare qu'il répond aux urgences et renseigne
 * ses trois chiffres (déplacement, tarif horaire, majoration).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  Avatar, BtnMain, BtnMini, BtnOutline, Chip, Field, TextArea, ProfileBanner, SectionLabel,
} from '../components/ui';
import { Camera, AlertTriangle, FileText, Check, ShieldCheck, ShieldX } from '../components/icons';
import ChampVille from '../components/ChampVille';
import { METIERS } from '../data/demo';
import { METIERS_SOS } from '../data/urgences';
import { choisirImage, choisirDocument } from '../lib/media';

/** Le métier d'urgence correspondant au métier déclaré, s'il existe. */
function metierSosDe(metier) {
  return METIERS_SOS.find((m) => m.metier === metier) || null;
}

export default function ProfilEditScreen({
  userType, profil, sos, onSave, onEnvoyerDocuments, onErreur,
}) {
  const estPro = userType === 'pro';

  const [avatarUrl, setAvatarUrl] = useState(profil.avatarUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profil.bannerUrl || null);
  const [nom, setNom] = useState(profil.nom || '');
  const [entreprise, setEntreprise] = useState(profil.entreprise || '');
  const [metier, setMetier] = useState(profil.metier || METIERS[0]);
  const [lieu, setLieu] = useState({
    affichage: profil.ville || '',
    codePostal: profil.codePostal || null,
    latitude: profil.latitude || null,
    longitude: profil.longitude || null,
  });
  const [bio, setBio] = useState(profil.bio || '');
  const [siret, setSiret] = useState(profil.siret || '');
  const [exp, setExp] = useState(String(profil.exp || ''));

  const [sosActif, setSosActif] = useState(!!(sos && sos.actif));
  const [deplacement, setDeplacement] = useState(String((sos && sos.deplacement) || ''));
  const [horaire, setHoraire] = useState(String((sos && sos.horaire) || ''));
  const [majoration, setMajoration] = useState(String((sos && sos.majoration) || ''));
  const [rayonKm, setRayonKm] = useState(String((sos && sos.rayonKm) || '20'));
  const [delaiMinutes, setDelaiMinutes] = useState(String((sos && sos.delaiMinutes) || '45'));

  const [kbis, setKbis] = useState(null);
  const [assurance, setAssurance] = useState(null);
  const [envoiDocs, setEnvoiDocs] = useState(false);

  const sosMetier = metierSosDe(metier);

  const prendre = async (usage, camera) => {
    try {
      const uri = await choisirImage({ camera, usage });
      if (!uri) return;
      if (usage === 'avatar') setAvatarUrl(uri);
      else setBannerUrl(uri);
    } catch (e) {
      onErreur(e.message || "L'image n'a pas pu être ouverte.");
    }
  };

  const enregistrer = () => {
    onSave({
      profil: estPro
        ? {
            avatarUrl, bannerUrl, entreprise, metier, bio, siret,
            ville: lieu.affichage,
            codePostal: lieu.codePostal,
            codeInsee: lieu.codeInsee,
            latitude: lieu.latitude,
            longitude: lieu.longitude,
            exp: Number(exp) || 0,
          }
        : {
            avatarUrl, nom,
            ville: lieu.affichage,
            codePostal: lieu.codePostal,
            latitude: lieu.latitude,
            longitude: lieu.longitude,
          },
      sos: estPro && sosMetier
        ? {
            actif: sosActif,
            metierKey: sosMetier.key,
            deplacement: Number(deplacement) || 0,
            horaire: Number(horaire) || 0,
            majoration: Number(majoration) || 0,
            rayonKm: Number(rayonKm) || 20,
            delaiMinutes: Number(delaiMinutes) || 45,
          }
        : null,
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      {/* --- bannière (professionnels seulement) ---
           L'aperçu montre exactement ce que verront les visiteurs : la
           bannière choisie si elle existe, sinon la première réalisation. */}
      {estPro && (
        <>
          <ProfileBanner
            uri={bannerUrl || (profil.portfolio && profil.portfolio[0]) || null}
            height={130}
          />
          <View style={s.banniereBarre}>
            <Text style={s.banniereNote}>
              {bannerUrl
                ? 'Bannière personnalisée'
                : 'Par défaut : votre première réalisation'}
            </Text>
            <View style={s.banniereBoutons}>
              {!!bannerUrl && (
                <BtnMini outline label="Retirer" onPress={() => setBannerUrl(null)} />
              )}
              <BtnMini outline onPress={() => prendre('banniere', false)}>
                <Camera size={12} color={C.ink} />
                <Text style={s.mediaBtnText}>
                  {bannerUrl ? 'Changer' : 'Choisir'}
                </Text>
              </BtnMini>
            </View>
          </View>
        </>
      )}

      {/* --- photo de profil --- */}
      <View style={s.avatarZone}>
        <Avatar seed={profil.id || 9} size={88} ring={4} uri={avatarUrl} />
        <View style={{ gap: 6 }}>
          <BtnMini onPress={() => prendre('avatar', true)}>
            <Camera size={12} color="#111" />
            <Text style={s.mediaBtnTextOn}>Prendre une photo</Text>
          </BtnMini>
          <BtnMini outline onPress={() => prendre('avatar', false)}>
            <Text style={s.mediaBtnText}>Choisir dans la galerie</Text>
          </BtnMini>
        </View>
      </View>

      <View style={s.pad}>
        {estPro ? (
          <>
            <Text style={s.label}>Nom de l'entreprise</Text>
            <Field value={entreprise} onChangeText={setEntreprise} placeholder="Belaïd Maçonnerie" />

            <Text style={s.label}>Métier</Text>
            <View style={s.chipRow}>
              {METIERS.map((m) => (
                <Chip key={m} label={m} on={metier === m} onPress={() => setMetier(m)} />
              ))}
            </View>

            <Text style={s.label}>Ville</Text>
            <ChampVille valeur={lieu.affichage} onChange={setLieu} />

            <Text style={s.label}>Présentation</Text>
            <TextArea value={bio} onChangeText={setBio} placeholder="Décrivez votre activité..." />

            <Text style={s.label}>SIRET</Text>
            <Field value={siret} onChangeText={setSiret} placeholder="812 345 678 00019" />

            <Text style={s.label}>Années d'expérience</Text>
            <Field value={exp} onChangeText={setExp} keyboardType="number-pad" placeholder="9" />
          </>
        ) : (
          <>
            <Text style={s.label}>Votre nom</Text>
            <Field value={nom} onChangeText={setNom} placeholder="Dylan M." />

            <Text style={s.label}>Ville</Text>
            <ChampVille valeur={lieu.affichage} onChange={setLieu} />
          </>
        )}
      </View>

      {/* --- justificatifs --- */}
      {estPro && (
        <>
          <SectionLabel>Documents justificatifs</SectionLabel>
          <View style={s.pad}>
            <View style={s.docBloc}>
              <StatutVerification statut={profil.verificationStatut} note={profil.verificationNote} />

              <Text style={s.docIntro}>
                Ces documents ne sont visibles que par vous et par l'équipe Opus.
                Ils ne sont jamais affichés sur votre profil public : seul le
                badge vérifié l'est.
              </Text>

              <LigneDocument
                titre="Extrait Kbis"
                detail="PDF ou photo, de moins de 3 mois"
                fichier={kbis}
                dejaEnvoye={!!profil.kbisPath}
                onChoisir={async () => {
                  try {
                    const doc = await choisirDocument();
                    if (doc) setKbis(doc);
                  } catch (e) { onErreur(e.message || "Le fichier n'a pas pu être ouvert."); }
                }}
              />

              <LigneDocument
                titre="Attestation d'assurance décennale"
                detail="PDF ou photo, en cours de validité"
                fichier={assurance}
                dejaEnvoye={!!profil.assurancePath}
                onChoisir={async () => {
                  try {
                    const doc = await choisirDocument();
                    if (doc) setAssurance(doc);
                  } catch (e) { onErreur(e.message || "Le fichier n'a pas pu être ouvert."); }
                }}
              />

              <BtnMain
                block
                onPress={async () => {
                  if (!kbis && !assurance) {
                    onErreur('Choisissez au moins un document avant de l\'envoyer.');
                    return;
                  }
                  setEnvoiDocs(true);
                  await onEnvoyerDocuments({ kbis, assurance });
                  setEnvoiDocs(false);
                }}
                disabled={envoiDocs}
              >
                {envoiDocs ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={s.btnText}>Envoi en cours...</Text>
                  </>
                ) : (
                  <Text style={s.btnText}>Envoyer pour vérification</Text>
                )}
              </BtnMain>
            </View>
          </View>
        </>
      )}

      {/* --- disponibilité SOS (professionnels des 4 métiers d'urgence) --- */}
      {estPro && (
        <>
          <SectionLabel>Interventions d'urgence</SectionLabel>
          <View style={s.pad}>
            {sosMetier ? (
              <View style={s.sosBloc}>
                <View style={s.sosLigne}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sosTitre}>Je réponds aux urgences</Text>
                    <Text style={s.sosDetail}>
                      Vous apparaîtrez dans les demandes SOS « {sosMetier.label} » près de chez vous.
                    </Text>
                  </View>
                  <Switch
                    value={sosActif}
                    onValueChange={setSosActif}
                    trackColor={{ false: C.line, true: C.sos }}
                    thumbColor="#fff"
                  />
                </View>

                {sosActif && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.label}>Forfait de déplacement (€)</Text>
                    <Field value={deplacement} onChangeText={setDeplacement} keyboardType="decimal-pad" placeholder="45" />

                    <Text style={s.label}>Tarif horaire (€/h)</Text>
                    <Field value={horaire} onChangeText={setHoraire} keyboardType="decimal-pad" placeholder="62" />

                    <Text style={s.label}>Majoration nuit et week-end (%)</Text>
                    <Field value={majoration} onChangeText={setMajoration} keyboardType="number-pad" placeholder="40" />

                    <Text style={s.label}>Rayon d'intervention (km)</Text>
                    <Field value={rayonKm} onChangeText={setRayonKm} keyboardType="number-pad" placeholder="20" />

                    <Text style={s.label}>Délai d'arrivée habituel (minutes)</Text>
                    <Field value={delaiMinutes} onChangeText={setDelaiMinutes} keyboardType="number-pad" placeholder="45" />

                    <View style={s.avert}>
                      <AlertTriangle size={14} color={C.sos} />
                      <Text style={s.avertText}>
                        Ces chiffres servent à calculer une fourchette affichée au client
                        avant votre déplacement. Ce n'est pas un devis : vous restez libre
                        de chiffrer sur place après diagnostic.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={s.sosBloc}>
                <Text style={s.sosDetail}>
                  Les urgences concernent la plomberie, l'électricité, la serrurerie et le
                  chauffage. Votre métier n'est pas concerné par le bouton SOS.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      <View style={[s.pad, { paddingBottom: 34 }]}>
        <BtnMain block label="Enregistrer" onPress={enregistrer} />
      </View>
    </ScrollView>
  );
}

/** Où en est la vérification du profil. */
function StatutVerification({ statut, note }) {
  const etats = {
    non_soumis: { texte: 'Documents non envoyés', couleur: C.muted, Icone: FileText },
    en_attente: { texte: 'En attente de vérification', couleur: C.accent2, Icone: FileText },
    verifie: { texte: 'Profil vérifié', couleur: C.ok, Icone: ShieldCheck },
    refuse: { texte: 'Documents refusés', couleur: C.bad, Icone: ShieldX },
  };
  const e = etats[statut] || etats.non_soumis;
  return (
    <View style={[s.statut, { borderLeftColor: e.couleur }]}>
      <e.Icone size={15} color={e.couleur} />
      <View style={{ flex: 1 }}>
        <Text style={[s.statutTexte, { color: e.couleur }]}>{e.texte}</Text>
        {!!note && <Text style={s.statutNote}>{note}</Text>}
      </View>
    </View>
  );
}

/** Une ligne de justificatif : son état et le bouton pour le choisir. */
function LigneDocument({ titre, detail, fichier, dejaEnvoye, onChoisir }) {
  return (
    <View style={s.docLigne}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.docTitre}>{titre}</Text>
        {fichier ? (
          <View style={s.docChoisi}>
            <Check size={11} color={C.ok} />
            <Text style={s.docChoisiTexte} numberOfLines={1}>{fichier.nom}</Text>
          </View>
        ) : (
          <Text style={s.docDetail}>
            {dejaEnvoye ? 'Déjà envoyé — choisissez un fichier pour le remplacer' : detail}
          </Text>
        )}
      </View>
      <BtnMini outline label={fichier ? 'Changer' : 'Choisir'} onPress={onChoisir} />
    </View>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  banniereBarre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  banniereNote: { flex: 1, fontSize: 11, color: C.muted, fontFamily: F.inter },
  banniereBoutons: { flexDirection: 'row', gap: 6 },
  mediaBtnText: { fontFamily: F.oswald6, fontSize: 11, color: C.ink },
  mediaBtnTextOn: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },

  avatarZone: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingVertical: 16,
  },

  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  sosBloc: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },

  docBloc: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },
  docIntro: { fontSize: 11, color: C.muted, lineHeight: 16, marginBottom: 12, fontFamily: F.inter },
  docLigne: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line,
  },
  docTitre: { fontFamily: F.inter6, fontSize: 12.5, color: C.ink },
  docDetail: { fontSize: 11, color: C.muted, marginTop: 2, fontFamily: F.inter },
  docChoisi: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  docChoisiTexte: { fontSize: 11, color: C.ok, flexShrink: 1, fontFamily: F.inter },

  statut: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: C.bg, borderLeftWidth: 3, padding: 10, marginBottom: 12,
  },
  statutTexte: { fontFamily: F.inter6, fontSize: 12 },
  statutNote: { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 15, fontFamily: F.inter },

  btnText: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },
  sosLigne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sosTitre: { fontFamily: F.inter6, fontSize: 13, color: C.ink },
  sosDetail: { fontSize: 11.5, color: C.muted, marginTop: 3, lineHeight: 16, fontFamily: F.inter },

  avert: {
    flexDirection: 'row', gap: 8, marginTop: 14,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.sos, padding: 10,
  },
  avertText: { flex: 1, fontSize: 11, color: C.muted, lineHeight: 16, fontFamily: F.inter },
});
