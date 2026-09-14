/**
 * Création de compte et connexion.
 *
 * L'écran s'adapte au type choisi juste avant : un professionnel donne aussi
 * le nom de son entreprise, son métier et sa ville, pour que sa fiche publique
 * existe dès l'inscription.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, GRAD_160 } from '../theme';
import { HazardStrip, Field, Chip, BtnMain } from '../components/ui';
import { ChevronLeft, Check } from '../components/icons';
import { METIERS } from '../data/demo';

export default function AuthScreen({ userType, onSignUp, onSignIn, onRetour }) {
  const insets = useSafeAreaInsets();
  const estPro = userType === 'pro';

  const [mode, setMode] = useState('inscription');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [metier, setMetier] = useState(METIERS[0]);
  const [ville, setVille] = useState('');

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [mailEnvoye, setMailEnvoye] = useState(false);

  const valider = async () => {
    setErreur(null);

    if (!email.trim() || !motDePasse) {
      setErreur('Renseignez votre email et votre mot de passe.');
      return;
    }
    if (mode === 'inscription') {
      if (motDePasse.length < 6) {
        setErreur('Le mot de passe doit faire au moins 6 caractères.');
        return;
      }
      if (estPro && !entreprise.trim()) {
        setErreur("Indiquez le nom de votre entreprise.");
        return;
      }
      if (!estPro && !nom.trim()) {
        setErreur('Indiquez votre nom.');
        return;
      }
    }

    setEnCours(true);
    try {
      if (mode === 'inscription') {
        const resultat = await onSignUp({
          email, motDePasse,
          nom: estPro ? entreprise : nom,
          entreprise, metier, ville,
        });
        if (resultat && resultat.confirmationRequise) setMailEnvoye(true);
      } else {
        await onSignIn({ email, motDePasse });
      }
    } catch (e) {
      setErreur(traduire(e));
    }
    setEnCours(false);
  };

  /* --- confirmation par email demandée par Supabase --- */
  if (mailEnvoye) {
    return (
      <Fond insets={insets}>
        <View style={s.carte}>
          <View style={s.checkRond}><Check size={22} color="#fff" /></View>
          <Text style={s.titre}>Vérifiez votre boîte mail</Text>
          <Text style={s.texte}>
            Un message vient d'être envoyé à {email.trim()}. Cliquez sur le lien
            qu'il contient pour activer votre compte, puis revenez ici pour vous
            connecter.
          </Text>
          <BtnMain
            block
            label="J'ai confirmé, je me connecte"
            onPress={() => { setMailEnvoye(false); setMode('connexion'); }}
          />
        </View>
      </Fond>
    );
  }

  return (
    <Fond insets={insets}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={s.retour} onPress={onRetour}>
            <ChevronLeft size={14} color="#fff" />
            <Text style={s.retourText}>Changer de type de compte</Text>
          </Pressable>

          <View style={s.carte}>
            <Text style={s.badge}>
              {estPro ? 'COMPTE PROFESSIONNEL' : 'COMPTE PARTICULIER'}
            </Text>

            <View style={s.onglets}>
              {[
                { key: 'inscription', label: 'Créer un compte' },
                { key: 'connexion', label: 'Se connecter' },
              ].map((o) => (
                <Pressable
                  key={o.key}
                  style={[s.onglet, mode === o.key && s.ongletOn]}
                  onPress={() => { setMode(o.key); setErreur(null); }}
                >
                  <Text style={[s.ongletText, mode === o.key && { color: '#fff' }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'inscription' && (estPro ? (
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
                <Field value={ville} onChangeText={setVille} placeholder="Marseille (13)" />
              </>
            ) : (
              <>
                <Text style={s.label}>Votre nom</Text>
                <Field value={nom} onChangeText={setNom} placeholder="Dylan M." />
              </>
            ))}

            <Text style={s.label}>Email</Text>
            <Field
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.fr"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.label}>Mot de passe</Text>
            <Field
              value={motDePasse}
              onChangeText={setMotDePasse}
              placeholder={mode === 'inscription' ? '6 caractères minimum' : 'Votre mot de passe'}
              secureTextEntry
              autoCapitalize="none"
            />

            {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

            <BtnMain block onPress={valider} disabled={enCours} style={{ marginTop: 14 }}>
              {enCours ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.btnText}>Un instant...</Text>
                </>
              ) : (
                <Text style={s.btnText}>
                  {mode === 'inscription' ? 'Créer mon compte' : 'Se connecter'}
                </Text>
              )}
            </BtnMain>

            {mode === 'inscription' && estPro && (
              <Text style={s.note}>
                Après l'inscription, vous pourrez envoyer votre Kbis et votre
                attestation d'assurance pour obtenir le badge vérifié.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Fond>
  );
}

function Fond({ insets, children }) {
  return (
    <LinearGradient
      colors={['#1A1B19', '#3a3a38', '#1B4B6B']}
      locations={[0, 0.6, 1]}
      start={GRAD_160.start}
      end={GRAD_160.end}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: insets.top }}>
        <HazardStrip height={6} dark="#111" />
      </View>
      {children}
    </LinearGradient>
  );
}

/** Traduit les messages d'erreur techniques de Supabase en français clair. */
function traduire(e) {
  const m = ((e && e.message) || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email. Utilisez « Se connecter ».';
  }
  if (m.includes('email not confirmed')) {
    return "Votre email n'est pas encore confirmé. Regardez votre boîte mail.";
  }
  if (m.includes('password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return "Cette adresse email n'est pas valide.";
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return "Les inscriptions sont désactivées dans les réglages Supabase.";
  }
  return (e && e.message) || 'Une erreur est survenue. Réessayez.';
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },

  retour: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  retourText: { color: '#fff', opacity: 0.8, fontSize: 11.5, fontFamily: F.inter6 },

  carte: { backgroundColor: C.surface, padding: 18 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: C.accent, color: '#111',
    fontFamily: F.oswald6, fontSize: 10.5, paddingVertical: 3, paddingHorizontal: 9,
    marginBottom: 14, overflow: 'hidden',
  },

  onglets: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 20, padding: 3, marginBottom: 6 },
  onglet: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  ongletOn: { backgroundColor: C.ink },
  ongletText: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted },

  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginTop: 14, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  erreur: {
    fontSize: 11.5, color: C.bad, marginTop: 12, lineHeight: 16,
    fontFamily: F.inter, borderLeftWidth: 3, borderLeftColor: C.bad, paddingLeft: 8,
  },
  btnText: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },
  note: { fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 16, fontFamily: F.inter },

  titre: { fontFamily: F.oswald6, fontSize: 17, color: C.ink, marginBottom: 8, textAlign: 'center' },
  texte: { fontSize: 12.5, color: C.muted, lineHeight: 19, textAlign: 'center', marginBottom: 16, fontFamily: F.inter },
  checkRond: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.ok,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14,
  },
});
