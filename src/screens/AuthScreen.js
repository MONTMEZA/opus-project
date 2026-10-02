/**
 * Création de compte et connexion.
 *
 * L'écran s'adapte au type choisi juste avant : un professionnel donne aussi
 * le nom de son entreprise, son métier et sa ville, pour que sa fiche publique
 * existe dès l'inscription.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, T, S, R, GRAD_160 } from '../theme';
/* La traduction des erreurs vivait ICI, enfermée : partout ailleurs dans
   l'application, le même défaut sortait en anglais. Elle est devenue
   `src/lib/erreurs.js`, et elle sait aussi reconnaître une perte de réseau —
   le cas le plus fréquent sur un chantier. */
import { messageClair as traduire } from '../lib/erreurs';
import { HazardStrip, Field, BtnMain, ChampMotDePasse } from '../components/ui';
import ChampVille from '../components/ChampVille';
import ChoixMetiers from '../components/ChoixMetiers';
import { ChevronLeft, Check, ShieldCheck } from '../components/icons';
import { METIER_PAR_DEFAUT } from '../lib/metiers';
import { VERSION } from '../data/legal';

export default function AuthScreen({ userType, onSignUp, onSignIn, onRetour, onLireLegal }) {
  /* Le clavier doit mener quelque part : « Suivant » saute d'un champ à
     l'autre au lieu de se refermer. */
  const champMotDePasse = useRef(null);
  const insets = useSafeAreaInsets();
  const estPro = userType === 'pro';

  const [mode, setMode] = useState('inscription');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [metiers, setMetiers] = useState([METIER_PAR_DEFAUT]);
  const [lieu, setLieu] = useState({ affichage: '' });

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [mailEnvoye, setMailEnvoye] = useState(false);
  /* L'acceptation des conditions. Décochée au départ, sans exception : une
     case pré-cochée ne vaut rien juridiquement — c'est le point que la CNIL
     rappelle le plus souvent. */
  const [conditions, setConditions] = useState(false);

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
      if (!conditions) {
        setErreur('Il faut accepter les conditions d’utilisation pour créer un compte.');
        return;
      }
    }

    setEnCours(true);
    try {
      if (mode === 'inscription') {
        const resultat = await onSignUp({
          email, motDePasse,
          nom: estPro ? entreprise : nom,
          entreprise, metiers, metier: metiers[0],
          ville: lieu.affichage,
          codePostal: lieu.codePostal,
          codeInsee: lieu.codeInsee,
          latitude: lieu.latitude,
          longitude: lieu.longitude,
          /* La VERSION acceptée voyage avec l'inscription : sans elle, on
             saurait que la personne a accepté « quelque chose », sans savoir
             quoi — et des conditions modifiées après coup ne prouveraient
             rien. */
          cguVersion: VERSION,
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

                <Text style={s.label}>Vos métiers</Text>
                <ChoixMetiers valeurs={metiers} onChange={setMetiers} />

                <Text style={s.label}>Ville</Text>
                <ChampVille valeur={lieu.affichage} onChange={setLieu} />
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
              /* Le trousseau du téléphone propose alors l'adresse déjà
                 enregistrée, au lieu de la faire retaper. */
              autoComplete="email"
              textContentType="emailAddress"
              /* LE CLAVIER MÈNE QUELQUE PART. Sans ça, « Suivant » n'existe
                 pas et il faut refermer le clavier pour viser le champ
                 d'après — six fois à l'inscription. */
              returnKeyType="next"
              onSubmitEditing={() => champMotDePasse.current && champMotDePasse.current.focus()}
              blurOnSubmit={false}
            />

            <Text style={s.label}>Mot de passe</Text>
            <ChampMotDePasse
              ref={champMotDePasse}
              value={motDePasse}
              onChangeText={setMotDePasse}
              placeholder={mode === 'inscription' ? '6 caractères minimum' : 'Votre mot de passe'}
              nouveau={mode === 'inscription'}
              returnKeyType={mode === 'inscription' ? 'next' : 'go'}
              onSubmitEditing={mode === 'inscription' ? undefined : valider}
            />

            {mode === 'inscription' && (
              <Pressable style={s.conditions} onPress={() => setConditions((v) => !v)}>
                <View style={[s.case, conditions && s.caseCochee]}>
                  {conditions && <Check size={12} color={C.surAccent} />}
                </View>
                <Text style={s.conditionsTexte}>
                  J’ai lu et j’accepte les{' '}
                  <Text
                    style={s.conditionsLien}
                    onPress={() => onLireLegal && onLireLegal('cgu')}
                  >
                    conditions d’utilisation
                  </Text>
                  {' '}et la{' '}
                  <Text
                    style={s.conditionsLien}
                    onPress={() => onLireLegal && onLireLegal('confidentialite')}
                  >
                    politique de confidentialité
                  </Text>.
                </Text>
              </Pressable>
            )}

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
              <View style={s.encart}>
                <ShieldCheck size={15} color={C.accent2} />
                <View style={{ flex: 1 }}>
                  <Text style={s.encartTitre}>Le badge vérifié, en deux étapes</Text>
                  <Text style={s.encartTexte}>
                    Vous entrez tout de suite et pouvez publier. Ensuite, depuis votre
                    profil, vous enverrez votre <Text style={s.gras}>extrait Kbis</Text> et
                    votre <Text style={s.gras}>attestation d'assurance décennale</Text>.
                    Après contrôle, le badge vérifié apparaît sur votre profil — sans lui,
                    les particuliers voient que vos justificatifs n'ont pas été fournis.
                  </Text>
                </View>
              </View>
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

const s = StyleSheet.create({
  /* L'acceptation des conditions. La case est CARRÉE : c'est de la
     structure, pas un bouton (voir la règle des bords dans theme.js). */
  conditions: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    marginTop: S.lg, paddingRight: S.xs,
  },
  case: {
    width: 20, height: 20, borderWidth: 1.5, borderColor: C.line,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  caseCochee: { backgroundColor: C.accent, borderColor: C.accent },
  conditionsTexte: {
    flex: 1, fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: 17,
  },
  conditionsLien: { color: C.accent2, fontFamily: F.inter6 },

  scroll: { padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },

  retour: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  retourText: { color: '#fff', opacity: 0.8, fontSize: 11.5, fontFamily: F.inter6 },

  carte: { backgroundColor: C.surface, padding: 18 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: C.accent, color: C.surAccent,
    fontFamily: F.oswald6, fontSize: 10.5, paddingVertical: 3, paddingHorizontal: 9,
    marginBottom: 14, overflow: 'hidden',
  },

  onglets: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 20, padding: 3, marginBottom: 6 },
  onglet: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  ongletOn: { backgroundColor: C.ink },
  ongletText: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted },

  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginTop: 14, marginBottom: 6 },

  erreur: {
    fontSize: 11.5, color: C.bad, marginTop: 12, lineHeight: 16,
    fontFamily: F.inter, borderLeftWidth: 3, borderLeftColor: C.bad, paddingLeft: 8,
  },
  btnText: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },
  encart: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.accent2,
    padding: 11, marginTop: 14,
  },
  encartTitre: { fontFamily: F.oswald6, fontSize: 12, color: C.accent2, marginBottom: 4 },
  encartTexte: { fontSize: 11, color: C.muted, lineHeight: 16, fontFamily: F.inter },
  gras: { fontFamily: F.inter6, color: C.ink },

  titre: { fontFamily: F.oswald6, fontSize: 17, color: C.ink, marginBottom: 8, textAlign: 'center' },
  texte: { fontSize: 12.5, color: C.muted, lineHeight: 19, textAlign: 'center', marginBottom: 16, fontFamily: F.inter },
  checkRond: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.ok,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14,
  },
});
