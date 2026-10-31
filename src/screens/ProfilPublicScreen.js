/**
 * Fiche publique d'une personne qui n'a pas de page d'artisan.
 *
 * Elle existe pour une raison précise : sous un commentaire, on doit pouvoir
 * toucher un nom et arriver quelque part. Un professionnel a sa page ; un
 * particulier n'avait rien, et son nom n'était donc cliquable nulle part.
 *
 * Ce qu'elle montre, et à qui (lot S-d, 30/10/2026 — `profil-public.js`) :
 *   - le nom et la photo, à tout compte connecté ;
 *   - la VILLE d'un particulier, à lui-même et aux professionnels — la base
 *     ne la rend qu'à eux (`profil_public()`, décision D3 du 25/10) ;
 *   - ses demandes EN COURS, aux professionnels seulement ;
 *   - « Envoyer un message », aux professionnels seulement, jamais sur
 *     sa propre fiche (décision du 30/10 : la base refuse aussi une
 *     conversation entre deux particuliers), ni sur celle d'une personne
 *     qu'on a bloquée ;
 *   - « Signaler », à tous sauf à lui-même.
 * Jamais son adresse, son code postal ni son courriel : ce n'est pas parce
 * qu'une donnée est en base qu'elle a sa place à l'écran.
 *
 * ET CE QUI N'A PAS PU ÊTRE LU SE DIT (relecture du 30/10) : un échec de
 * la fiche n'est pas « Ce profil n'est plus disponible » — c'était laisser
 * croire à un compte supprimé —, et un échec des demandes n'est pas « aucune
 * demande ». Tant que le type de compte n'est pas connu (lecture en cours,
 * ou en échec), ni « Envoyer un message » ni « Ses demandes » : rien plutôt
 * qu'une affirmation devinée.
 */
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, CARTE_PLEINE, TOUCHE, APPUI,
} from '../theme';
import { Avatar, BtnMain, EmptyState, SectionLabel, Gradient } from '../components/ui';
import { MapPin } from '../components/icons';
import { nomMetier } from '../lib/metiers';
import {
  peutEcrireDepuisLaFiche, AUCUNE_DEMANDE_A_MONTRER, FICHE_ILLISIBLE, DEMANDES_ILLISIBLES,
} from '../lib/profil-public';

export default function ProfilPublicScreen({
  profil, chargement, echec = false, onReessayer, onRelireDemandes,
  jeSuisPro = false, monId = null, onContacter, onSignaler,
}) {
  const reessayer = onReessayer ? { label: 'Réessayer', onPress: onReessayer } : undefined;
  /* Sous des demandes illisibles, « Réessayer » ne relit QUE les demandes et
     GARDE la fiche affichée : il relisait tout, remettait le nom seul le
     temps de la lecture, et un échec effaçait ce qui avait été lu (seconde
     relecture du 31/10). */
  const relireDemandes = onRelireDemandes
    ? { label: 'Réessayer', onPress: onRelireDemandes }
    : reessayer;
  if (!profil) {
    if (chargement) {
      return (
        <View style={s.centre}>
          <ActivityIndicator color={C.accent} />
        </View>
      );
    }
    if (echec) return <EmptyState titre="Lecture impossible" action={reessayer}>{FICHE_ILLISIBLE}</EmptyState>;
    return <EmptyState>Ce profil n'est plus disponible.</EmptyState>;
  }

  const demandes = profil.demandes || [];
  const estPro = profil.type === 'pro';
  /* Le type n'est connu qu'une fois la fiche LUE : le nom affiché pendant la
     lecture vient de l'écran d'où l'on arrive (un commentaire). */
  const typeConnu = !!profil.type;
  const cEstMoi = monId != null && String(monId) === String(profil.id);
  const ecrire = !!onContacter && peutEcrireDepuisLaFiche({ profil, monId, jeSuisPro });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={s.entete}>
        <Avatar seed={profil.id} size={84} uri={profil.avatarUrl} ring={4} ringColor={C.bg} nom={profil.nom} />
        <Text style={s.nom}>{profil.nom}</Text>
        {!!profil.ville && (
          <View style={s.ligneVille}>
            <MapPin size={12} color={C.muted} />
            <Text style={s.ville}>{profil.ville}</Text>
          </View>
        )}
        {/* Le type n'est connu qu'une fois la fiche lue : rien plutôt
            qu'un rôle deviné. */}
        {typeConnu && <Text style={s.role}>{estPro ? 'Professionnel' : 'Particulier'}</Text>}

        {ecrire && (
          <BtnMain
            label="Envoyer un message"
            onPress={() => onContacter(profil)}
            style={{ marginTop: 14 }}
          />
        )}
        {!!onSignaler && !cEstMoi && typeConnu && (
          <Pressable
            onPress={() => onSignaler({
              cibleType: 'profil',
              cibleId: profil.id,
              auteurId: profil.id,
              auteurNom: profil.nom,
              extrait: profil.nom,
            })}
            style={({ pressed }) => [s.signaler, pressed && APPUI.discret]}
            accessibilityRole="button"
            accessibilityLabel={`Signaler le profil de ${profil.nom}`}
          >
            <Text style={s.signalerTexte}>Signaler ce profil</Text>
          </Pressable>
        )}
      </View>

      {/* PENDANT LA LECTURE, ou SI ELLE A ÉCHOUÉ : ni demandes ni message,
          puisqu'on ne sait pas encore à qui l'on a affaire. */}
      {!typeConnu && chargement && (
        <View style={s.centre}>
          <ActivityIndicator color={C.accent} />
        </View>
      )}
      {!typeConnu && !chargement && echec && (
        <EmptyState titre="Lecture impossible" action={reessayer}>{FICHE_ILLISIBLE}</EmptyState>
      )}

      {/* SES DEMANDES : aux professionnels seulement — ce sont eux qui y
          répondent. Et jamais « cette personne n'a publié aucune demande » :
          une demande pourvue, ou cachée par un blocage, existe quand même.
          Les cartes vivent DANS le bloc de leur titre : sur la fiche d'un
          compte pro, elles s'affichaient seules, sans titre (seconde
          relecture du 31/10). */}
      {jeSuisPro && profil.type === 'particulier' && (
        <>
          <SectionLabel>Ses demandes en cours</SectionLabel>
          {profil.demandesEchec && chargement ? (
            <View style={s.centre}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : profil.demandesEchec ? (
            <EmptyState action={relireDemandes}>{DEMANDES_ILLISIBLES}</EmptyState>
          ) : demandes.length === 0 && (
            <EmptyState>{AUCUNE_DEMANDE_A_MONTRER}</EmptyState>
          )}
          <View style={s.liste}>
            {demandes.map((d) => (
              <View key={String(d.id)} style={s.carte}>
                <View style={s.carteHaut}>
                  <Text style={s.metier}>{nomMetier(d.metier)}</Text>
                  <Text style={s.temps}>{d.time}</Text>
                </View>
                <Text style={s.texte}>{d.texte}</Text>
                {!!d.media && (
                  <Gradient media={d.media} style={{ width: '100%', aspectRatio: 16 / 10, marginTop: 8 }} />
                )}
                <View style={s.ligneVille}>
                  <MapPin size={11} color={C.muted} />
                  <Text style={s.ville}>{d.ville}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  entete: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 20, paddingBottom: 14 },
  nom: { fontFamily: F.oswald6, fontSize: 19, color: C.ink, marginTop: 10, textAlign: 'center' },
  ligneVille: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ville: { fontSize: T.courant, color: C.muted, fontFamily: F.inter },
  role: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6, marginTop: 6 },
  signaler: { minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: 12, marginTop: 4 },
  signalerTexte: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6, textDecorationLine: 'underline' },

  liste: { gap: 10, paddingHorizontal: 16 },
  carte: { ...CARTE_PLEINE },
  carteHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metier: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.surAccent, backgroundColor: C.accent,
    paddingVertical: 2, paddingHorizontal: 7, overflow: 'hidden',
  },
  temps: { fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  texte: { fontSize: T.corps, lineHeight: 18, color: C.ink, fontFamily: F.inter, marginTop: 8 },
});
