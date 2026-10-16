/**
 * PASSER EN COMPTE PROFESSIONNEL — un particulier qui est aussi artisan.
 *
 * POURQUOI CET ÉCRAN EXISTE
 * -------------------------
 * Le type d'un compte ne se change pas par la main de son titulaire
 * (section 44, OP004) : sans cette porte, un particulier qui devient
 * artisan — ou qui s'est inscrit en particulier par erreur — n'avait
 * AUCUN moyen de passer pro, et le message d'OP004 lui disait « contactez
 * Opus » alors qu'aucune adresse n'est publiée. Le message désigne
 * désormais cet écran : « Profil → Passer en compte professionnel ».
 *
 * Deux chemins, et ce sont les mêmes qu'à l'inscription :
 *
 *   - le répertoire Sirene connaît l'entreprise : `devenir_pro()` fait
 *     tout côté base — le type, la fiche, l'identité DEPUIS LA PREUVE — et
 *     l'application redémarre en pro. Le compte garde ses abonnements, ses
 *     messages et ses enregistrements ;
 *   - il ne la connaît pas, ou ne répond pas : une DEMANDE, que
 *     l'administration examinera. Le compte reste particulier en
 *     attendant, et la demande se suit sur le profil.
 *
 * C'est un ÉCRAN, et pas une feuille du bas : il porte un sélecteur de
 * métiers qui ouvre sa propre fenêtre, et deux fenêtres empilées laissent
 * sur iPhone un voile invisible qui avale les touches (CLAUDE.md, 04/10).
 * Le conteneur qui défile porte `{...CLAVIER}` : le champ actif y remonte
 * au-dessus du clavier.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, GOUTTIERE, interligne,
} from '../theme';
import { Field, BtnMain, TextArea } from '../components/ui';
import { Check } from '../components/icons';
import SaisieSiret, { EntrepriseRepliee } from '../components/SaisieSiret';
import ChoixMetiers from '../components/ChoixMetiers';
import { BackBar } from '../components/TopBar';
import LegalScreen from './LegalScreen';
import { CLAVIER } from '../lib/clavier';
import { messageClair } from '../lib/erreurs';
import { formaterSiret, libelleMotif } from '../lib/siret';
import {
  entreprisePreremplie, propositionMetiers, AIDE_NOM_EI, NOM_ENTREPRISE_MAX,
} from '../lib/entreprise';
import * as retour from '../lib/retour';

/* La même limite que la base (`demande_pro_message_check`). */
const MESSAGE_MAX = 500;

/* Ouvert depuis une demande DÉJÀ en attente (« Revérifier mon SIRET ») :
   la porte de secours n'est pas proposée — la base n'accepte qu'une
   demande ouverte par compte, et l'envoi échouait à coup sûr après qu'on
   avait tout rempli (relecture adverse, mesuré au navigateur). Ce qui
   reste utile, c'est le justificatif : on le dit à la place. */
const AIDE_DEMANDE_EN_ATTENTE = 'Votre demande est déjà entre les mains d’Opus : il n’y a rien à '
  + 'renvoyer. Pour l’aider, joignez plutôt un justificatif depuis votre profil (carte « Compte '
  + 'professionnel en attente »).';

export default function PasserProScreen({
  siretInitial = '', demandeEnAttente = false, onDevenirPro, onDemander, onErreur,
}) {
  const defilement = useRef(null);
  const [etape, setEtape] = useState('siret');            // 'siret' | 'formulaire' | 'secours'
  const [identite, setIdentite] = useState(null);
  const [secours, setSecours] = useState(null);
  const [entreprise, setEntreprise] = useState('');
  const [aideNom, setAideNom] = useState(null);
  const [metiers, setMetiers] = useState([]);
  const [proposition, setProposition] = useState(null);
  const [message, setMessage] = useState('');
  const [declaration, setDeclaration] = useState(false);
  const [lecture, setLecture] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [saisie, setSaisie] = useState({ cle: 0, siret: siretInitial || '' });
  /* Ce que l'artisan a corrigé à la main ne se remplace pas en changeant de
     numéro — même règle qu'à l'inscription. */
  const touche = useRef({ entreprise: false, metiers: false });

  const enHaut = () => {
    if (defilement.current) defilement.current.scrollTo({ y: 0, animated: true });
  };

  const confirmer = (id) => {
    setIdentite(id);
    setErreur(null);
    if (!touche.current.entreprise) {
      const n = entreprisePreremplie(id);
      setEntreprise(n);
      setAideNom(n ? null : AIDE_NOM_EI);
    }
    if (!touche.current.metiers) {
      const p = propositionMetiers(id);
      setMetiers(p.metiers);
      setProposition(p.phrase);
    }
    setEtape('formulaire');
    enHaut();
  };

  /* CE QUE LE RÉPERTOIRE A PRÉREMPLI NE SURVIT PAS À UN CHANGEMENT DE
     NUMÉRO — relecture adverse, mesuré au navigateur. « Changer », puis un
     numéro introuvable, puis la porte de secours : la demande partait avec
     le nom (« Bâti Démo »), les métiers « proposés d'après votre activité »
     et la phrase d'une AUTRE entreprise, et l'administration lisait une
     entreprise qui n'avait rien à voir avec le numéro. Ce que l'artisan a
     corrigé lui-même (`touche`) reste ; le reste repart de zéro. */
  const oublierPreremplissage = () => {
    if (!touche.current.entreprise) {
      setEntreprise('');
      setAideNom(null);
    }
    if (!touche.current.metiers) setMetiers([]);
    /* La phrase « Proposé d'après votre activité » ne survit JAMAIS : même
       si l'artisan a retouché les métiers, elle parlait d'une autre
       entreprise. */
    setProposition(null);
  };

  const revenirAuSiret = (siret) => {
    setIdentite(null);
    setSecours(null);
    oublierPreremplissage();
    setEtape('siret');
    setSaisie((x) => ({ cle: x.cle + 1, siret: siret || '' }));
    enHaut();
  };

  const ouvrirSecours = (x) => {
    oublierPreremplissage();
    setSecours(x);
    setEtape('secours');
    setErreur(null);
    enHaut();
  };

  const valider = async () => {
    setErreur(null);
    if (!entreprise.trim()) { setErreur('Indiquez le nom de votre entreprise.'); return; }
    if (metiers.length === 0) {
      setErreur('Choisissez au moins un métier : c’est par lui que les clients vous trouvent.');
      return;
    }
    if (etape === 'formulaire' && !declaration) {
      setErreur('Cochez la déclaration : elle engage celui qui donne le numéro.');
      return;
    }
    setEnCours(true);
    try {
      if (etape === 'formulaire') {
        await onDevenirPro({ siret: identite.siret, entreprise, metiers });
      } else {
        await onDemander({
          siret: secours.siret, motif: secours.motif, entreprise, metiers, message,
        });
      }
    } catch (e) {
      retour.echec();
      const texte = messageClair(e, etape === 'formulaire'
        ? 'Le passage en compte professionnel n’a pas abouti'
        : 'La demande n’est pas partie');
      setErreur(texte);
      if (onErreur) onErreur(texte);
      /* OP006 : la vérification a expiré — on revient là où « Vérifier »
         se trouve, avec le numéro déjà tapé. */
      if (e && e.code === 'OP006' && identite) revenirAuSiret(identite.siret);
    }
    setEnCours(false);
  };

  return (
    <ScrollView
      ref={defilement}
      {...CLAVIER}
      style={s.ecran}
      contentContainerStyle={s.contenu}
    >
      <Text style={s.intro}>
        Votre compte devient professionnel dès que votre entreprise est trouvée
        active au répertoire Sirene de l’INSEE. Vous gardez vos abonnements, vos
        messages et vos enregistrements.
      </Text>

      {etape === 'siret' && (
        <>
          <Text style={s.label}>Votre entreprise</Text>
          <SaisieSiret
            key={saisie.cle}
            siretInitial={saisie.siret}
            onConfirme={confirmer}
            onSecours={demandeEnAttente ? null : ouvrirSecours}
            aideSansSecours={demandeEnAttente ? AIDE_DEMANDE_EN_ATTENTE : null}
          />
        </>
      )}

      {etape === 'formulaire' && !!identite && (
        <EntrepriseRepliee identite={identite} onChanger={() => revenirAuSiret(identite.siret)} />
      )}

      {etape === 'secours' && !!secours && (
        <View style={s.secours}>
          <Text style={s.secoursTitre}>Vérification à la main</Text>
          <Text style={s.secoursTexte}>
            Opus va vérifier votre entreprise lui-même. En attendant, votre compte
            reste un compte particulier : vous pouvez tout regarder et écrire des
            messages. Dès que votre entreprise est vérifiée, ce même compte devient
            professionnel : vous ne perdez rien.
          </Text>
          <Text style={s.secoursRappel}>
            SIRET {formaterSiret(secours.siret)} · {libelleMotif(secours.motif)}
          </Text>
          <Pressable
            onPress={() => revenirAuSiret(secours.siret)}
            accessibilityRole="button"
            accessibilityLabel="Revenir à la vérification automatique du SIRET"
            style={({ pressed }) => [s.lien, pressed && APPUI.discret]}
          >
            <Text style={s.lienTexte}>Revenir au SIRET</Text>
          </Pressable>
        </View>
      )}

      {etape !== 'siret' && (
        <>
          <Text style={s.label}>Nom de l’entreprise</Text>
          <Field
            value={entreprise}
            onChangeText={(t) => { touche.current.entreprise = true; setEntreprise(t); }}
            placeholder="Le nom que vos clients connaissent"
            maxLength={NOM_ENTREPRISE_MAX}
          />
          {!!aideNom && <Text style={s.aide}>{aideNom}</Text>}

          <Text style={s.label}>Vos métiers</Text>
          <ChoixMetiers
            valeurs={metiers}
            onChange={(m) => { touche.current.metiers = true; setMetiers(m); }}
            proposition={proposition}
          />

          {etape === 'secours' && (
            <>
              <Text style={s.label}>Un mot pour Opus (facultatif)</Text>
              <TextArea
                value={message}
                onChangeText={setMessage}
                maxLength={MESSAGE_MAX}
                placeholder="Ce qui peut aider : entreprise toute neuve, non publiée par l’INSEE, numéro déjà pris…"
              />
              <Text style={s.aide}>
                {message.length} sur {MESSAGE_MAX}. Un justificatif pourra être joint
                ensuite depuis votre profil — jamais par la messagerie.
              </Text>
            </>
          )}

          {etape === 'formulaire' && (
            /* UNE DÉCLARATION, PAS UNE CASE DE CONFORT. Un SIRET est public :
               la consultation dit que l'entreprise existe, jamais que celui
               qui tape le numéro en est le titulaire. Les conditions le
               disent, et c'est ici qu'on s'y engage. */
            <View style={s.declaration}>
              <Pressable
                onPress={() => setDeclaration((v) => !v)}
                accessibilityRole="checkbox"
                aria-checked={declaration}
                accessibilityLabel="Je déclare être le titulaire de cette entreprise ou habilité à la représenter, et j’accepte les conditions d’utilisation"
                style={({ pressed }) => [s.declarationLigne, pressed && APPUI.discret]}
              >
                <View style={[s.case, declaration && s.caseCochee]}>
                  {declaration && <Check size={12} color={C.surAccent} />}
                </View>
                <Text style={s.declarationTexte}>
                  Je déclare être le titulaire de cette entreprise ou habilité à la
                  représenter, et j’accepte les conditions d’utilisation.
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLecture(true)}
                accessibilityRole="button"
                accessibilityLabel="Lire les conditions d’utilisation"
                style={({ pressed }) => [s.lien, pressed && APPUI.discret]}
              >
                <Text style={s.lienTexte}>Lire les conditions d’utilisation</Text>
              </Pressable>
            </View>
          )}

          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

          <BtnMain
            block
            label={enCours ? 'Un instant…'
              : etape === 'formulaire' ? 'Passer en compte professionnel' : 'Envoyer la demande'}
            onPress={valider}
            disabled={enCours}
          />
        </>
      )}

      {/* LES CONDITIONS SE LISENT SANS QUITTER L'ÉCRAN. Les ouvrir dans un
          autre écran démontait celui-ci, et la vérification du SIRET était
          à refaire en revenant. Une fenêtre PLEIN ÉCRAN, sans champ : elle
          n'a rien à craindre du clavier. */}
      {lecture && (
        <Modal visible animationType="slide" onRequestClose={() => setLecture(false)}>
          <View style={s.lecture}>
            <BackBar title="Conditions d’utilisation" onBack={() => setLecture(false)} />
            <LegalScreen texte="cgu" />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.bg },
  /* La gouttière dans `contentContainerStyle`, jamais dans `style` — le
     16 + 16 = 32 du 02/10. */
  contenu: { paddingHorizontal: GOUTTIERE, paddingTop: S.md, paddingBottom: S.xxl, gap: S.sm },
  intro: {
    fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps),
  },
  label: { fontFamily: F.oswald6, fontSize: T.courant, color: C.muted, marginTop: S.sm },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  erreur: {
    fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm,
  },

  secours: {
    gap: S.xs, padding: S.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, borderLeftWidth: S.xs, borderLeftColor: C.accent2,
    borderRadius: R.vif,
  },
  secoursTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  secoursTexte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  secoursRappel: {
    fontFamily: F.inter6, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
  },
  lien: { minHeight: TOUCHE, justifyContent: 'center', alignSelf: 'flex-start' },
  lienTexte: {
    fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2, textDecorationLine: 'underline',
  },

  declaration: { gap: S.xs, marginTop: S.sm },
  declarationLigne: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, minHeight: TOUCHE },
  /* La case est CARRÉE : c'est de la structure, pas un bouton (theme.js). */
  case: {
    width: S.xl - S.xs, height: S.xl - S.xs, borderWidth: 1, borderColor: C.bordChamp,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  caseCochee: { backgroundColor: C.accent, borderColor: C.accent },
  declarationTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
  lecture: { flex: 1, backgroundColor: C.bg },
});
