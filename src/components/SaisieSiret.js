/**
 * TAPER UN SIRET, LE FAIRE CONSULTER, ET DIRE CE QUI EST ARRIVÉ.
 *
 * POURQUOI UN SEUL COMPOSANT
 * --------------------------
 * Le même geste a lieu à TROIS endroits : l'inscription d'un professionnel,
 * « Passer en compte professionnel » (un particulier qui devient artisan)
 * et « Modifier mon profil → Mon entreprise ». Écrit trois fois, il dirait
 * trois choses différentes au même artisan — et c'est sur un refus que ça
 * se verrait le plus mal.
 *
 * CE QU'IL FAIT, DANS L'ORDRE
 * ---------------------------
 *   1. le champ ne garde que les CHIFFRES, et les affiche groupés
 *      (« 912 517 935 00033 »). AUCUN `maxLength` : un SIRET collé avec
 *      ses espaces fait 17 caractères, et un `maxLength` de 14 le coupait —
 *      mesuré par la relecture du plan, il devenait « incomplet » ;
 *   2. l'analyse de la saisie (`analyserSaisie`, siret.js) ne s'AFFICHE
 *      qu'au 14e chiffre, à l'appui sur « Vérifier », ou quand le champ
 *      perd la main. Jamais pendant la frappe : au 9e chiffre de TOUT SIRET,
 *      la saisie vaut « c'est un SIREN », et l'écran accuserait quelqu'un
 *      qui n'a pas fini ;
 *   3. au 14e chiffre, si la clé tombe juste, la consultation part TOUTE
 *      SEULE — une fois par numéro — et le clavier se range : le pavé
 *      numérique de l'iPhone n'a pas de touche « OK », et il cacherait la
 *      réponse ;
 *   4. la réponse passe par `messageIssue()` (siret.js) : un seul texte par
 *      issue, partout. Elle est dite à VoiceOver et au vibreur ;
 *   5. « ok » ne remplit RIEN : une carte demande « Est-ce bien votre
 *      entreprise ? ». La clé de Luhn ne voit pas toutes les inversions de
 *      chiffres ; une faute de frappe peut tomber sur l'entreprise d'un
 *      autre, et l'inscrire à sa place l'enfermerait dehors.
 *
 * Et ce que le composant ne fait PAS : décider. `onConfirme(identite)` et
 * `onSecours({ siret, motif })` rendent la main à l'écran qui l'héberge.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, Keyboard, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne,
} from '../theme';
import { Field, BtnMain, BtnMini } from './ui';
import { Check, AlertTriangle, ChevronDown, ChevronRight } from './icons';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import {
  analyserSaisie, chiffresSeuls, formaterSiret, messageIssue, motifDeIssue,
} from '../lib/siret';
import {
  nomDeLEntreprise, titreSansNom, ligneForme, ligneEtablissement, ligneSiret,
  texteSource,
} from '../lib/entreprise';
import { SIRETS_DEMO } from '../data/siret-demo';

/** « 91251793500033 » → « 912 517 935 00033 », au fil de la frappe. */
function grouper(chiffres) {
  return [chiffres.slice(0, 3), chiffres.slice(3, 6), chiffres.slice(6, 9), chiffres.slice(9)]
    .filter(Boolean).join(' ');
}

/** « 14 h 32 », à l'heure du téléphone. */
function heureLocale(ms) {
  const d = new Date(ms);
  const m = d.getMinutes();
  return m === 0 ? `${d.getHours()} h` : `${d.getHours()} h ${String(m).padStart(2, '0')}`;
}

/* Les issues où le service n'a PAS répondu : on n'accuse jamais le numéro,
   et le bord du message n'est pas celui d'un refus. */
const SANS_REPONSE = new Set(['reseau', 'lent', 'service_indisponible', 'injoignable', 'trop_d_essais']);

/* Au-delà de dix minutes, on ne bloque plus le bouton : un en-tête absurde
   ne doit pas figer l'écran pour la soirée. */
const BLOCAGE_MAX_MS = 10 * 60 * 1000;

export default function SaisieSiret({
  onConfirme,
  onSecours = null,
  etiquetteOui = 'Oui, c’est mon entreprise',
  onConnexion = null,
  /* « Mon entreprise » : la consultation est faite POUR LA FICHE de celui
     qui tape. La fonction Edge le sait toute seule (par le jeton) et ne lui
     répond plus « déjà utilisé » pour sa propre entreprise — c'est ce qui
     rend « Mettre à jour » possible après un déménagement (15/10). La
     démonstration, elle, n'a pas de jeton : c'est ce drapeau qui le lui
     dit. */
  pourMaFiche = false,
  /* Là où la porte de secours n'existe pas (un compte DÉJÀ professionnel,
     dans « Mon entreprise »), le message conseille pourtant « demandez une
     vérification à la main ». L'explication se pose JUSTE DESSOUS, dans le
     même cadre — pas dix lignes plus bas, sous les numéros d'essai, où
     personne ne la relie au conseil qu'elle corrige. */
  aideSansSecours = null,
  siretInitial = '',
  resultatInitial = null,
  onResultat = null,
}) {
  const champ = useRef(null);
  const [texte, setTexte] = useState(() => grouper(chiffresSeuls(siretInitial)));
  const [analyse, setAnalyse] = useState(() => analyserSaisie(siretInitial));
  const [montrerEtat, setMontrerEtat] = useState(!!resultatInitial);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState(resultatInitial);
  const [bloqueJusqua, setBloqueJusqua] = useState(0);
  const [aideOuverte, setAideOuverte] = useState(false);

  /* Des RÉFÉRENCES, et pas des états : elles servent aux décisions prises
     dans les gestionnaires, jamais à l'affichage. */
  const dernierAuto = useRef(chiffresSeuls(siretInitial));
  const enVol = useRef(false);
  /* Le numéro tapé PENDANT qu'une consultation était en vol — relecture
     adverse, mesuré : corriger un chiffre pendant l'attente (jusqu'à 15 s
     sur un démarrage à froid) laissait l'écran muet. La consultation du
     premier numéro revenait, était écartée parce qu'elle ne correspondait
     plus au champ, et le second n'était JAMAIS consulté. On le retient, et
     il part dès que le premier est revenu. */
  const enAttente = useRef(null);
  const echecs = useRef(0);
  const vivant = useRef(true);
  useEffect(() => {
    vivant.current = true;
    return () => { vivant.current = false; };
  }, []);

  /* Le bouton se rouvre tout seul à l'heure dite. Le `setState` part d'un
     minuteur, jamais directement de l'effet : le compilateur React refuse
     l'autre forme, à juste titre — un rendu doit pouvoir être rejoué. */
  useEffect(() => {
    if (!bloqueJusqua) return undefined;
    const t = setTimeout(() => setBloqueJusqua(0), Math.max(0, bloqueJusqua - Date.now()));
    return () => clearTimeout(t);
  }, [bloqueJusqua]);

  const chiffres = chiffresSeuls(texte);

  const texteDuResultat = (r) => messageIssue(r.issue, r).texte;

  const verifier = async (demande) => {
    if (enVol.current) {
      enAttente.current = demande;
      return;
    }
    enVol.current = true;
    setEnCours(true);
    setMontrerEtat(true);
    Keyboard.dismiss();

    /* UNE BOUCLE, et pas un second appel de `verifier` depuis lui-même :
       tant qu'un autre numéro a été tapé pendant le vol, c'est LUI qu'on
       consulte, et la réponse du précédent n'a plus rien à dire. */
    let siret = demande;
    let r;
    for (;;) {
      enAttente.current = null;
      try {
        r = await api.verifierSiret(siret, { pourMaFiche });
      } catch (e) {
        /* `verifierSiret` rend toujours une issue ; ceci ne devrait jamais
           servir. Si ça sert, c'est une panne d'Opus, pas un numéro faux. */
        r = { issue: 'service_indisponible' };
      }
      const suivant = enAttente.current;
      if (!suivant || suivant === siret) break;
      siret = suivant;
    }
    enAttente.current = null;
    enVol.current = false;
    if (!vivant.current) return;

    echecs.current = r.issue === 'injoignable' ? echecs.current + 1 : 0;
    const complet = { ...r, pour: siret, echecs: echecs.current };
    setResultat(complet);
    setEnCours(false);

    if (r.issue === 'injoignable' && Number(r.reessayer_dans) > 0) {
      setBloqueJusqua(Date.now() + Math.min(Number(r.reessayer_dans) * 1000, BLOCAGE_MAX_MS));
    } else if (r.issue === 'trop_d_essais') {
      const a = Date.parse(r.reessayer_a || '');
      if (Number.isFinite(a) && a > Date.now()) {
        setBloqueJusqua(Math.min(a, Date.now() + BLOCAGE_MAX_MS));
      }
    }

    /* À VOIX HAUTE, et au vibreur : le résultat apparaît sous le champ,
       souvent hors de la vue de quelqu'un qui regarde le clavier. */
    if (r.issue === 'ok') {
      retour.reussite();
      const nom = nomDeLEntreprise(r.identite) || titreSansNom(r.identite);
      retour.annoncer(`Entreprise trouvée : ${nom}. Est-ce bien la vôtre ?`);
    } else {
      retour.echec();
      retour.annoncer(texteDuResultat(complet));
    }
    if (onResultat) onResultat(complet);
  };

  const changer = (t) => {
    const a = analyserSaisie(t);
    const ch = chiffresSeuls(t);
    setTexte(grouper(ch));
    setAnalyse(a);
    /* Rien n'est dit pendant la frappe — sauf quand on a fini : 14
       chiffres, ou davantage. */
    setMontrerEtat(ch.length >= 14);
    if (resultat && resultat.pour !== ch) setResultat(null);
    if (a.etat === 'pret' && dernierAuto.current !== a.siret) {
      dernierAuto.current = a.siret;
      verifier(a.siret);
    }
  };

  const appuyerVerifier = () => {
    setMontrerEtat(true);
    if (analyse.etat === 'pret') {
      dernierAuto.current = analyse.siret;
      verifier(analyse.siret);
      return;
    }
    retour.echec();
    retour.annoncer(messageIssue(analyse.etat, analyse).texte);
  };

  const agir = (code) => {
    if (code === 'reessayer' && resultat) { verifier(resultat.pour); return; }
    if (code === 'utiliser' && resultat && resultat.siret_ouvert) {
      changer(chiffresSeuls(resultat.siret_ouvert));
      return;
    }
    if (code === 'connexion') { if (onConnexion) onConnexion(); return; }
    if (code === 'autre_numero') changer('');
    if (champ.current) champ.current.focus();
  };

  /* Un nombre, pas une comparaison à l'heure : lire l'horloge pendant le
     rendu donnerait un écran différent à chaque redessin. C'est le
     minuteur ci-dessus qui remet `bloqueJusqua` à zéro à l'heure dite. */
  const bloque = bloqueJusqua > 0;
  const ok = resultat && resultat.issue === 'ok' && resultat.identite
    && resultat.pour === chiffres;

  /* LE MESSAGE À AFFICHER : d'abord ce que le service a répondu pour CE
     numéro, sinon ce que la saisie elle-même dit — et seulement quand on a
     fini de taper. */
  let message = null;
  if (resultat && !ok && resultat.pour === chiffres) {
    const m = messageIssue(resultat.issue, resultat);
    message = {
      texte: m.texte,
      action: m.action,
      secours: m.secours,
      neutre: SANS_REPONSE.has(resultat.issue),
    };
  } else if (!resultat && montrerEtat && analyse.etat !== 'pret') {
    const m = messageIssue(analyse.etat, analyse);
    message = { texte: m.texte, action: m.action, secours: false, neutre: analyse.etat === 'vide' };
  }
  /* « Se connecter » n'a de sens que là où l'on PEUT se connecter : dans
     « Mon entreprise », on l'est déjà. */
  if (message && message.action && message.action.code === 'connexion' && !onConnexion) {
    message.action = null;
  }

  return (
    <View style={s.bloc}>
      <View style={s.ligneChamp}>
        <Field
          ref={champ}
          value={texte}
          onChangeText={changer}
          onBlur={() => setMontrerEtat(true)}
          /* Le pavé numérique, et SANS `returnKeyType` : celui de l'iPhone
             n'a pas de touche retour, et l'annoncer serait mentir. */
          keyboardType="number-pad"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          placeholder="Les 14 chiffres du SIRET"
          accessibilityLabel="Numéro SIRET de votre entreprise, 14 chiffres"
          style={s.champ}
        />
        <BtnMain
          ton="sombre"
          onPress={appuyerVerifier}
          disabled={enCours || bloque}
          accessibilityLabel={bloque ? `Vérifier, possible à ${heureLocale(bloqueJusqua)}` : 'Vérifier ce SIRET'}
          style={s.bouton}
        >
          {enCours ? (
            <ActivityIndicator size="small" color={C.surface} />
          ) : (
            <Text style={s.boutonTexte}>
              {bloque ? `À ${heureLocale(bloqueJusqua)}` : 'Vérifier'}
            </Text>
          )}
        </BtnMain>
      </View>

      {/* CE QUI PART, AVANT TOUTE ACCEPTATION DES CONDITIONS — la relecture
          « droit » l'a exigé : le numéro va vers un service de l'État, et
          rien d'autre. */}
      <Text style={s.aide}>
        Ce numéro est envoyé au service public Recherche d’entreprises pour
        vérifier qu’il existe ; rien d’autre ne part.
      </Text>

      {enCours && (
        <Text style={s.attente} accessibilityLiveRegion="polite">
          Consultation du répertoire Sirene de l’INSEE…
        </Text>
      )}

      {!enCours && !!message && !!message.texte && (
        <View
          style={[s.message, message.neutre ? s.messageNeutre : s.messageRefus]}
          accessibilityLiveRegion="polite"
        >
          <View style={s.messageHaut}>
            <AlertTriangle size={15} color={message.neutre ? C.accent2 : C.bad} />
            <Text style={s.messageTexte}>{message.texte}</Text>
          </View>
          {!!message.action && (
            <BtnMain
              label={message.action.libelle}
              onPress={() => agir(message.action.code)}
              disabled={message.action.code === 'reessayer' && bloque}
            />
          )}
          {!!message.secours && !onSecours && !!aideSansSecours && (
            <Text style={s.aide}>{aideSansSecours}</Text>
          )}
          {!!message.secours && !!onSecours && (
            /* LA PORTE DE SECOURS est un bouton SECONDAIRE, et sa hauteur
               vient de la BOÎTE (`minHeight`), pas de `hitSlop` — que le
               navigateur ignore, donc qu'on ne pourrait pas mesurer. */
            <BtnMini
              outline
              label="Demander une vérification à la main"
              onPress={() => onSecours({ siret: resultat.pour, motif: motifDeIssue(resultat.issue) })}
              style={s.secours}
            />
          )}
        </View>
      )}

      {!enCours && ok && (
        <CarteEntreprise
          identite={resultat.identite}
          etiquetteOui={etiquetteOui}
          onOui={() => { retour.decision(); onConfirme(resultat.identite); }}
          onNon={() => { setResultat(null); agir('corriger'); }}
        />
      )}

      {api.mode === 'demo' && (
        <AideDemo
          ouverte={aideOuverte}
          onBasculer={() => setAideOuverte((v) => !v)}
          onChoisir={(siret) => { dernierAuto.current = null; changer(siret); }}
        />
      )}
    </View>
  );
}

/**
 * « EST-CE BIEN VOTRE ENTREPRISE ? »
 *
 * Une carte à angle VIF : elle porte l'information, c'est de la structure
 * (la règle des bords, theme.js). Pensée pour être reconnue d'un coup
 * d'œil : le nom en grand, puis la forme et l'année, puis le lieu, puis le
 * numéro. Ce qu'elle ne montre PAS : la TVA, le code d'activité brut, la
 * rue, les dirigeants.
 */
export function CarteEntreprise({ identite, etiquetteOui, onOui, onNon }) {
  const nom = nomDeLEntreprise(identite);
  return (
    <View style={s.carte}>
      <Text style={s.carteQuestion}>Est-ce bien votre entreprise ?</Text>
      <Text style={s.carteNom}>{nom || titreSansNom(identite)}</Text>
      {!nom && (
        <Text style={s.carteDetail}>
          Le répertoire ne transmet pas de nom pour cette entreprise : vous écrirez
          celui sous lequel vos clients vous connaissent.
        </Text>
      )}
      {!!ligneForme(identite) && <Text style={s.carteLigne}>{ligneForme(identite)}</Text>}
      {!!ligneEtablissement(identite) && (
        <Text style={s.carteLigne}>{ligneEtablissement(identite)}</Text>
      )}
      <Text style={s.carteSiret}>{ligneSiret(identite)}</Text>

      <View style={s.carteBoutons}>
        <BtnMain block label={etiquetteOui} onPress={onOui} />
        <BtnMini outline label="Non, corriger le numéro" onPress={onNon} style={s.secours} />
      </View>

      <Text style={s.carteSource}>{texteSource(identite)}</Text>
    </View>
  );
}

/**
 * LA LIGNE REPLIÉE — « ✓ Bâti Talvèse · 000 004 002 00010 — Changer ».
 *
 * Après « Oui », la carte se replie : le formulaire qui suit a besoin de la
 * place, et l'artisan doit pouvoir se tromper sans tout recommencer.
 */
export function EntrepriseRepliee({ identite, onChanger }) {
  const nom = nomDeLEntreprise(identite) || titreSansNom(identite);
  return (
    <View style={s.repliee}>
      <Check size={15} color={C.ok} />
      <Text style={s.replieeTexte} numberOfLines={2}>
        {nom} · {formaterSiret(identite.siret)}
      </Text>
      <Pressable
        onPress={onChanger}
        accessibilityRole="button"
        accessibilityLabel="Changer de numéro SIRET"
        style={({ pressed }) => [s.changer, pressed && APPUI.discret]}
      >
        <Text style={s.changerTexte}>Changer</Text>
      </Pressable>
    </View>
  );
}

/**
 * LES NUMÉROS D'ESSAI — en démonstration seulement.
 *
 * Un par issue, et chacun montre exactement ce que l'écran montrerait pour
 * de vrai. Repliés par défaut : douze lignes de 44 points poussent tout le
 * reste sous l'écran.
 */
function AideDemo({ ouverte, onBasculer, onChoisir }) {
  return (
    <View style={s.demo}>
      <Pressable
        onPress={onBasculer}
        accessibilityRole="button"
        accessibilityLabel={ouverte ? 'Replier les numéros d’essai' : 'Afficher les numéros d’essai'}
        style={({ pressed }) => [s.demoTitre, pressed && APPUI.discret]}
      >
        {ouverte
          ? <ChevronDown size={14} color={C.accent2} />
          : <ChevronRight size={14} color={C.accent2} />}
        <Text style={s.demoTitreTexte}>Démonstration — numéros fictifs à essayer</Text>
      </Pressable>
      {ouverte && SIRETS_DEMO.map((l) => (
        <Pressable
          key={l.siret}
          onPress={() => onChoisir(l.siret)}
          accessibilityRole="button"
          accessibilityLabel={`Essayer ${l.libelle}`}
          style={({ pressed }) => [s.demoLigne, pressed && APPUI.discret]}
        >
          <Text style={s.demoLibelle}>{l.libelle}</Text>
          <Text style={s.demoNumero}>{formaterSiret(l.siret)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { gap: S.sm },
  ligneChamp: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  /* `flex: 1, minWidth: 0` : sans eux, le champ pousse le bouton hors de
     l'écran au lieu de se raccourcir (le piège du lot 5). */
  champ: { flex: 1, minWidth: 0, fontSize: T.corps, letterSpacing: 0.5 },
  bouton: { paddingHorizontal: S.lg },
  boutonTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surface },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
  },
  attente: {
    fontFamily: F.inter5, fontSize: T.courant, color: C.accent2, lineHeight: interligne(T.courant),
  },

  /* Le message porte l'information : angle vif, et un BORD qui dit sa
     nature — jamais un fond teinté derrière le texte qu'on vient lire. */
  message: {
    gap: S.sm, padding: S.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, borderLeftWidth: S.xs, borderRadius: R.vif,
  },
  messageNeutre: { borderLeftColor: C.accent2 },
  messageRefus: { borderLeftColor: C.bad },
  messageHaut: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start' },
  messageTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
  /* 44 points par la BOÎTE : `BtnMini` s'arrête à 36 et compte sur
     `hitSlop`, que react-native-web ignore. */
  secours: { minHeight: TOUCHE },

  carte: {
    gap: S.xs, padding: S.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.ink, borderRadius: R.vif,
  },
  carteQuestion: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted, letterSpacing: 0.5 },
  carteNom: { fontFamily: F.oswald6, fontSize: T.titre, color: C.ink },
  carteDetail: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
  },
  carteLigne: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  carteSiret: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  carteBoutons: { gap: S.sm, marginTop: S.sm },
  carteSource: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted, lineHeight: interligne(T.micro),
    marginTop: S.xs,
  },

  repliee: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingLeft: S.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, borderRadius: R.vif,
  },
  replieeTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
  changer: {
    minHeight: TOUCHE, minWidth: TOUCHE, paddingHorizontal: S.md,
    alignItems: 'center', justifyContent: 'center',
  },
  changerTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2 },

  demo: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.xs },
  demoTitre: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE },
  demoTitreTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.accent2 },
  demoLigne: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  demoLibelle: { fontFamily: F.inter, fontSize: T.petit, color: C.ink },
  demoNumero: { fontFamily: F.inter6, fontSize: T.petit, color: C.muted },
});
