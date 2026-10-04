/**
 * LE BACK-OFFICE — deux files, et aucune décision sans trace.
 *
 * POURQUOI CET ÉCRAN EXISTE
 * -------------------------
 * Jusqu'au 03/10/2026, vérifier un artisan ou trancher un signalement se
 * faisait à la main, dans l'éditeur SQL de Supabase. Deux conséquences, et
 * la seconde est pire que la première :
 *
 *   1. le propriétaire débute en développement. Lui demander d'écrire du
 *      SQL pour poser un badge, c'est garantir que ce ne sera pas fait ;
 *   2. relevé sur sa vraie base le 02/10/2026 : un signalement
 *      « contrefaçon » déposé le 29/09 était encore au statut `nouveau`
 *      TROIS JOURS après — alors que l'application promet un « examen sous
 *      48 heures » (`src/data/moderation.js`).
 *
 * Une promesse que rien ne tient, c'est la même famille de défaut que le
 * « X est prévenu » de la section 24.
 *
 * CE QUE CET ÉCRAN NE FAIT PAS, ET NE DOIT PAS FAIRE
 * --------------------------------------------------
 * Il ne décide rien. Chaque bouton appelle une fonction de la BASE
 * (section 25 de `schema.sql`), qui vérifie le droit, journalise l'acte et
 * prévient l'artisan. L'écran n'est qu'une poignée.
 *
 * C'est la seule façon qui marche, d'ailleurs : le verrou
 * `tient_le_profil_pro()` annule toute écriture des colonnes de
 * vérification venue du professionnel lui-même — EN SILENCE, sans erreur.
 * Un `update` depuis l'application paraîtrait réussir et ne ferait rien.
 *
 * DEUX FILES, PAS DEUX ÉCRANS
 * ---------------------------
 * On ouvre le back-office pour « voir ce qui attend », pas pour consulter
 * une rubrique. Les deux compteurs sont donc visibles ensemble, et le
 * bascule est un `PillToggle` comme dans Découvrir.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, Pressable, Linking, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, APPUI, interligne, surFond, CARTE, GOUTTIERE, viser,
} from '../theme';
import {
  BtnMain, BtnMini, EmptyState, PillToggle, SectionLabel,
} from '../components/ui';
import ChampLocal from '../components/ChampLocal';
import {
  ShieldCheck, FileText, Flag, Clock, AlertTriangle, Check, Hammer,
} from '../components/icons';
import { nomMetier } from '../lib/metiers';
/* Les deux pièces ne s'appellent pas pareil selon le métier : un
   micro-entrepreneur n'a pas de Kbis, un avocat pas de décennale. */
import { EXISTENCE, assuranceAttendue, complementairesDe } from '../data/pieces-justificatives.js';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { messageClair } from '../lib/erreurs';

/* LES LIBELLÉS VIENNENT DE `src/data/moderation.js`, et le délai promis
   aussi. Recopier « 48 » ici, ou réécrire la liste des motifs, c'est
   garantir qu'un jour l'écran et la promesse diront deux choses
   différentes — et `npm run verifier-moderation` compare déjà cette liste
   aux contraintes de la base. Une clé affichée brute (« travail_dissimule »)
   ressemble d'ailleurs à une faute de frappe, donc personne ne la signale. */
import { motifDe, cibleDe, DELAI_EXAMEN_HEURES } from '../data/moderation';

const JOURS_LIMITE = Math.ceil(DELAI_EXAMEN_HEURES / 24);

/* ==========================================================================
   L'ÉCRAN
   ========================================================================== */
export default function AdminScreen({ onRafraichirResume, onErreur }) {
  const [onglet, setOnglet] = useState('verifications');
  const [pros, setPros] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [chargement, setChargement] = useState(true);

  /* LA LECTURE NE TOUCHE À AUCUN ÉTAT, et c'est ce qui la rend réutilisable :
     l'effet de montage et le rechargement d'après-acte en ont besoin tous
     les deux, mais pas au même moment ni avec les mêmes garde-fous. */
  const lire = useCallback(async () => {
    const [p, sg, dm, sp] = await Promise.all([
      api.fileVerifications(),
      api.signalementsAdmin(),
      api.metierDemandes(),
      api.specialitesProposees(),
    ]);
    return { p, sg, dm, sp };
  }, []);

  /* `onErreur` passe par une RÉFÉRENCE, et ce n'est pas du zèle. Mesuré au
     navigateur le 03/10/2026 : `showErreur` est recréée à chaque rendu
     d'`OpusApp`, donc en la mettant dans les dépendances de l'effet, celui-ci
     repartait à CHAQUE rendu du parent. Les appels relayés le montraient :
     cinq requêtes après un enregistrement au lieu de trois.
     C'est le repère que CLAUDE.md retient depuis le 02/10 — « si ce nombre
     double un jour, quelque chose relance le chargement ». */
  /* La mise à jour se fait dans un EFFET, pas pendant le rendu : le
     compilateur React refuse qu'on écrive dans une référence pendant un
     rendu (`Cannot access refs during render`), et il a raison — un rendu
     doit pouvoir être rejoué sans rien changer au monde. */
  const signaler = useRef(onErreur);
  useEffect(() => { signaler.current = onErreur; }, [onErreur]);

  /* `vivant` n'est pas de la prudence décorative : on quitte le back-office
     pendant que les deux requêtes sont en route, et poser l'état après coup
     écrirait dans un composant démonté. Et tous les `setState` sont dans un
     `.then` — donc après un `await`, donc pas synchrones dans l'effet, ce
     que le compilateur React refuse (`react-hooks/set-state-in-effect`). */
  useEffect(() => {
    let vivant = true;
    lire()
      .then(({ p, sg, dm, sp }) => {
        if (!vivant) return;
        setPros(p);
        setSignalements(sg);
        setDemandes(dm);
        setSpecialites(sp);
      })
      .catch((e) => { if (vivant && signaler.current) signaler.current(messageClair(e)); })
      .finally(() => { if (vivant) setChargement(false); });
    return () => { vivant = false; };
  }, [lire]);

  /* Après chaque acte : on relit la base plutôt que de corriger l'écran à
     la main. Deux vérités côte à côte finissent toujours par diverger, et
     c'est sur un badge que ça se verrait le plus mal. */
  const rafraichirResume = useRef(onRafraichirResume);
  useEffect(() => { rafraichirResume.current = onRafraichirResume; }, [onRafraichirResume]);

  const apresActe = useCallback(async () => {
    try {
      const { p, sg, dm, sp } = await lire();
      setPros(p);
      setSignalements(sg);
      setDemandes(dm);
      setSpecialites(sp);
    } catch (e) {
      if (signaler.current) signaler.current(messageClair(e));
    }
    if (rafraichirResume.current) rafraichirResume.current();
  }, [lire]);

  const nbPros = pros.filter((p) => p.aEnvoye).length;
  const nbSig = signalements.filter((x) => x.statut === 'nouveau' || x.statut === 'en_examen').length;
  const nbRef = demandes.filter((d) => d.statut === 'en_attente').length
    + specialites.filter((x) => x.statut === 'en_attente').length;

  return (
    <View style={s.ecran}>
      <View style={s.onglets}>
        <PillToggle
          small
          value={onglet}
          onChange={setOnglet}
          options={[
            { key: 'verifications', label: nbPros ? `Vérifications (${nbPros})` : 'Vérifications' },
            { key: 'signalements', label: nbSig ? `Signalements (${nbSig})` : 'Signalements' },
            { key: 'referentiel', label: nbRef ? `Référentiel (${nbRef})` : 'Référentiel' },
          ]}
        />
      </View>

      {onglet === 'verifications' && (
        <FileVerifications
          pros={pros}
          chargement={chargement}
          onActe={apresActe}
          onErreur={onErreur}
        />
      )}
      {onglet === 'signalements' && (
        <FileSignalements
          signalements={signalements}
          chargement={chargement}
          onActe={apresActe}
          onErreur={onErreur}
        />
      )}
      {onglet === 'referentiel' && (
        <FileReferentiel
          demandes={demandes}
          specialites={specialites}
          chargement={chargement}
          onActe={apresActe}
          onErreur={onErreur}
        />
      )}

    </View>
  );
}

/* LE RAPPEL DU JOURNAL VOYAGE AVEC LA LISTE, il n'est pas posé en bas de
   l'écran. Mesuré au navigateur le 03/10/2026 : en pied d'écran, il
   RECOUVRAIT la dernière carte — on lisait « Faure Charpente » à travers
   une phrase grise. Un texte d'explication n'a de toute façon rien à faire
   en garniture permanente : on le lit une fois. */
function PiedDuJournal() {
  return (
    <Text style={s.piedPage}>
      Chaque décision prise ici est écrite dans le journal
      d&apos;administration, avec son avant et son après. Personne ne peut
      l&apos;y modifier, pas même vous.
    </Text>
  );
}

/* ==========================================================================
   LA FILE DES VÉRIFICATIONS
   ========================================================================== */
function FileVerifications({ pros, chargement, onActe, onErreur }) {
  if (chargement) {
    return <EmptyState>Chargement de la file…</EmptyState>;
  }
  if (!pros.length) {
    return (
      <EmptyState icone={ShieldCheck} titre="Aucune fiche à contrôler">
        Toutes les fiches professionnelles de la base portent leur badge.
      </EmptyState>
    );
  }

  const aContoler = pros.filter((p) => p.aEnvoye).length;

  return (
    <FlatList
      style={s.liste}
      data={pros}
      keyExtractor={(p) => p.id}
      /* Les trois réglages que CLAUDE.md impose à toute liste longue. Avec
         cent artisans, la valeur par défaut en monterait dix d'un coup. */
      initialNumToRender={3}
      maxToRenderPerBatch={5}
      windowSize={5}
      contentContainerStyle={{ paddingBottom: S.xxl }}
      ListHeaderComponentStyle={{ marginBottom: S.sm }}
      ListFooterComponent={PiedDuJournal}
      ListHeaderComponent={(
        <SectionLabel>
          {aContoler > 0
            ? `${aContoler} fiche${aContoler > 1 ? 's' : ''} avec des documents à contrôler`
            : 'Aucun document envoyé — rien n’attend de vous'}
        </SectionLabel>
      )}
      renderItem={({ item }) => (
        <CarteVerification pro={item} onActe={onActe} onErreur={onErreur} />
      )}
    />
  );
}

const CarteVerification = React.memo(function CarteVerification({ pro, onActe, onErreur }) {
  const [kbis, setKbis] = useState(pro.kbisValide);
  const [assuranceOk, setAssuranceOk] = useState(pro.assuranceValide);
  const [rge, setRge] = useState(pro.rge);
  const [envoi, setEnvoi] = useState(null);
  const note = useRef(null);
  const assurance = assuranceAttendue(pro.metiers || []);
  const complementaires = complementairesDe(pro.metiers || []);

  const agir = async (quoi) => {
    if (envoi) return;
    setEnvoi(quoi);
    retour.decision();
    try {
      const texte = note.current ? note.current.lire() : '';
      if (quoi === 'refus') {
        await api.refuserPro({ id: pro.id, note: texte });
      } else {
        await api.verifierPro({
          id: pro.id, kbis, assurance: assuranceOk, rge, note: texte || null,
        });
      }
      retour.reussite();
      await onActe();
    } catch (e) {
      retour.echec();
      if (onErreur) onErreur(messageClair(e));
    } finally {
      setEnvoi(null);
    }
  };

  const ouvrir = async (chemin, quoi) => {
    try {
      const url = await api.urlDocument(chemin);
      if (!url) throw new Error(`Aucun ${quoi} n’est joint à cette fiche.`);
      Linking.openURL(url).catch(() => {});
    } catch (e) {
      if (onErreur) onErreur(messageClair(e));
    }
  };

  return (
    <View style={s.carte}>
      <View style={s.entete}>
        <View style={s.enteteTexte}>
          <Text style={s.entreprise} numberOfLines={1}>{pro.entreprise}</Text>
          <Text style={s.meta} numberOfLines={1}>
            {[pro.ville, (pro.metiers || []).map(nomMetier).join(' · ')]
              .filter(Boolean).join(' — ')}
          </Text>
        </View>
        <Etiquette statut={pro.statut} />
      </View>

      {!!pro.siret && <Text style={s.ligne}>SIRET déclaré : {pro.siret}</Text>}
      {!!pro.note && <Text style={s.noteAncienne}>Dernière note : {pro.note}</Text>}

      {/* LES DOCUMENTS. Ils vivent dans l'espace PRIVÉ de Supabase, et
          l'adresse rendue n'est valable que cinq minutes : un Kbis porte le
          nom et l'adresse du dirigeant. */}
      <View style={s.documents}>
        <Document
          libelle={EXISTENCE.nom}
          complement={pro.kbisMaj}
          present={!!pro.kbisUrl}
          onOuvrir={() => ouvrir(pro.kbisUrl, EXISTENCE.court.toLowerCase())}
        />
        <Document
          libelle={assurance.nom}
          complement={pro.assuranceExpire}
          present={!!pro.assuranceUrl}
          onOuvrir={() => ouvrir(pro.assuranceUrl, 'attestation d’assurance')}
        />
        {!!pro.rgeDeclare && (
          <Document
            libelle={`RGE${pro.rgeNumero ? ` nº ${pro.rgeNumero}` : ''}`}
            complement={pro.rgeExpire}
            present={!!pro.rgeUrl}
            onOuvrir={() => ouvrir(pro.rgeUrl, 'attestation RGE')}
          />
        )}
      </View>

      {pro.estMoi ? (
        /* LE POINT LE PLUS IMPORTANT DE CET ÉCRAN, et il n'est pas
           technique. La base refuse qu'un administrateur valide sa propre
           fiche — « le badge ne se décerne pas soi-même ». Sans ce bloc, le
           propriétaire appuierait sur « Valider » et verrait une erreur
           incompréhensible : il est le seul vrai professionnel de sa base,
           donc c'est le PREMIER geste qu'il tenterait. */
        <View style={s.bloqueMoi}>
          <AlertTriangle size={15} color={C.accent2} />
          <Text style={s.bloqueMoiTexte}>
            C&apos;est votre propre fiche. Un badge atteste qu&apos;un humain
            a contrôlé les documents de quelqu&apos;un d&apos;autre : la base
            refuse le geste, et c&apos;est voulu. Si vous voulez vraiment
            vous vérifier, il faut passer par Supabase → SQL Editor.
          </Text>
        </View>
      ) : (
        <>
          {!!complementaires.length && (
            /* CE QU'IL FAUT DEMANDER EN PLUS, selon le métier. Ces pièces ne
               commandent PAS le badge — il dit « cette entreprise existe et
               elle est assurée », pas « elle a tous les agréments de sa
               profession ». Mais sans ce rappel, personne ne penserait à
               réclamer son immatriculation ORIAS à un courtier. */
            <View style={s.complementaires}>
              <Text style={s.complementairesTitre}>À demander aussi, pour ce métier</Text>
              {complementaires.map((c) => (
                <Text key={c.cle} style={s.complementaire}>• {c.nom} — {c.aide}</Text>
              ))}
            </View>
          )}

          <View style={s.cases}>
            <Case libelle={`${EXISTENCE.court} contrôlée`} on={kbis} onPress={() => setKbis(!kbis)} />
            <Case libelle={`${assurance.court} contrôlée`} on={assuranceOk} onPress={() => setAssuranceOk(!assuranceOk)} />
            {/* Le RGE n'entre PAS dans le badge « vérifié » : un carreleur
                n'a aucune raison d'être RGE, et il serait absurde qu'il
                paraisse moins sérieux pour autant. */}
            <Case libelle="RGE certifié" on={rge} onPress={() => setRge(!rge)} />
          </View>

          <Text style={s.aideBadge}>
            Le badge « vérifié » s&apos;affiche quand le Kbis ET
            l&apos;assurance sont cochés. C&apos;est la base qui le calcule.
          </Text>

          <ChampLocal
            ref={note}
            multiligne
            placeholder="Note — ce qui a été contrôlé, ou ce qui manque. Obligatoire pour refuser (dix caractères au moins)."
            style={s.champ}
            accessibilityLabel="Note de vérification"
          />

          <View style={s.boutons}>
            <BtnMain
              label={envoi === 'validation' ? 'Enregistrement…' : 'Enregistrer'}
              onPress={() => agir('validation')}
              disabled={!!envoi}
            />
            {/* En ORANGE PLEIN comme « Enregistrer », les deux boutons se
                valaient à l'œil — et refuser des documents n'est pas le
                geste ordinaire. Le contour dit « c'est l'autre voie ». */}
            <BtnMini
              outline
              label={envoi === 'refus' ? 'Refus…' : 'Refuser les documents'}
              onPress={() => agir('refus')}
              disabled={!!envoi}
            />
          </View>

          <Text style={s.aide}>
            Un refus demande un motif : l&apos;artisan doit savoir QUOI
            corriger, sinon il ne revient pas. Dans les deux cas, il reçoit
            une notification.
          </Text>
        </>
      )}
    </View>
  );
});

function Document({ libelle, complement, present, onOuvrir }) {
  if (!present) {
    return (
      <View style={s.document}>
        <FileText size={15} color={C.line} />
        <Text style={s.documentAbsent}>{libelle} — non envoyé</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onOuvrir}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${libelle}`}
      style={({ pressed }) => [s.document, s.documentOuvrable, pressed && APPUI.discret]}
    >
      <FileText size={15} color={C.accentTexte} />
      <Text style={s.documentTexte}>
        {libelle}
        {complement ? ` · ${complement}` : ''}
      </Text>
    </Pressable>
  );
}

function Case({ libelle, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={libelle}
      aria-checked={!!on}
      hitSlop={viser(24)}
      style={({ pressed }) => [s.case, pressed && APPUI.discret]}
    >
      <View style={[s.boite, on && s.boiteOn]}>
        {!!on && <Check size={13} color={C.surAccent} />}
      </View>
      <Text style={[s.caseTexte, on && s.caseTexteOn]}>{libelle}</Text>
    </Pressable>
  );
}

function Etiquette({ statut }) {
  const TONS = {
    verifie: { fond: C.ok, texte: 'Vérifié' },
    en_attente: { fond: C.accent, texte: 'En attente' },
    refuse: { fond: C.bad, texte: 'Refusé' },
    non_soumis: { fond: C.muted, texte: 'Rien d’envoyé' },
  };
  const t = TONS[statut] || TONS.non_soumis;
  /* L'encre se CALCULE : le fond vient d'une donnée, et le blanc sur
     l'orange ne donne que 3,51 : 1. Voir `surFond()` dans theme.js. */
  return (
    <View style={[s.etiquette, { backgroundColor: t.fond }]}>
      <Text style={[s.etiquetteTexte, { color: surFond(t.fond) }]}>
        {t.texte}
      </Text>
    </View>
  );
}

/* ==========================================================================
   LA FILE DES SIGNALEMENTS
   ========================================================================== */
function FileSignalements({ signalements, chargement, onActe, onErreur }) {
  if (chargement) {
    return <EmptyState>Chargement de la file…</EmptyState>;
  }
  if (!signalements.length) {
    return (
      <EmptyState icone={Flag} titre="Aucun signalement">
        Rien n&apos;a été signalé sur Opus.
      </EmptyState>
    );
  }

  const enRetard = signalements.filter(
    (x) => (x.statut === 'nouveau' || x.statut === 'en_examen') && x.jours >= JOURS_LIMITE,
  ).length;

  return (
    <FlatList
      style={s.liste}
      data={signalements}
      keyExtractor={(x) => x.id}
      initialNumToRender={3}
      maxToRenderPerBatch={5}
      windowSize={5}
      contentContainerStyle={{ paddingBottom: S.xxl }}
      ListHeaderComponentStyle={{ marginBottom: S.sm }}
      ListFooterComponent={PiedDuJournal}
      ListHeaderComponent={(
        <SectionLabel>
          {enRetard > 0
            ? `${enRetard} au-delà des ${DELAI_EXAMEN_HEURES} heures promises`
            : `Dans les ${DELAI_EXAMEN_HEURES} heures promises`}
        </SectionLabel>
      )}
      renderItem={({ item }) => (
        <CarteSignalement
          sig={item}
          enRetard={(item.statut === 'nouveau' || item.statut === 'en_examen')
            && item.jours >= JOURS_LIMITE}
          onActe={onActe}
          onErreur={onErreur}
        />
      )}
    />
  );
}

const CarteSignalement = React.memo(function CarteSignalement({
  sig, enRetard, onActe, onErreur,
}) {
  const [envoi, setEnvoi] = useState(null);
  const note = useRef(null);
  const tranche = sig.statut === 'traite' || sig.statut === 'rejete';

  const agir = async (statut) => {
    if (envoi) return;
    setEnvoi(statut);
    retour.decision();
    try {
      await api.traiterSignalement({
        id: sig.id, statut, note: note.current ? note.current.lire() : null,
      });
      retour.reussite();
      await onActe();
    } catch (e) {
      retour.echec();
      if (onErreur) onErreur(messageClair(e));
    } finally {
      setEnvoi(null);
    }
  };

  return (
    <View style={s.carte}>
      <View style={s.entete}>
        <View style={s.enteteTexte}>
          <Text style={s.entreprise} numberOfLines={2}>
            {motifDe(sig.motif).label}
          </Text>
          <Text style={s.meta} numberOfLines={1}>
            sur {cibleDe(sig.cibleType).label} de {sig.cibleAuteur}
          </Text>
        </View>
        <View style={[s.etiquette, { backgroundColor: enRetard ? C.bad : C.muted }]}>
          <Text style={[s.etiquetteTexte, { color: C.surface }]}>
            {sig.jours === 0 ? 'aujourd’hui' : `${sig.jours} j`}
          </Text>
        </View>
      </View>

      {!!sig.extrait && <Text style={s.extrait}>« {sig.extrait} »</Text>}
      {!!sig.details && <Text style={s.ligne}>Précisions : {sig.details}</Text>}
      <Text style={s.meta}>Signalé par {sig.auteur}</Text>

      {enRetard && (
        <View style={s.retard}>
          <Clock size={14} color={C.bad} />
          <Text style={s.retardTexte}>
            Au-delà des {DELAI_EXAMEN_HEURES} heures annoncées dans
            l&apos;application.
          </Text>
        </View>
      )}

      {tranche ? (
        <View style={s.clos}>
          <Check size={14} color={C.ok} />
          <Text style={s.closTexte}>
            {sig.statut === 'traite' ? 'Traité' : 'Classé sans suite'}
            {sig.note ? ` — ${sig.note}` : ''}
          </Text>
        </View>
      ) : (
        <>
          <ChampLocal
            ref={note}
            multiligne
            placeholder="Ce qui a été décidé, et pourquoi. C’est la seule chose qu’on voudra relire dans six mois."
            style={s.champ}
            accessibilityLabel="Note de modération"
          />
          <View style={s.boutons}>
            {sig.statut === 'nouveau' && (
              <BtnMini
                outline
                label={envoi === 'en_examen' ? '…' : 'J’examine'}
                onPress={() => agir('en_examen')}
                disabled={!!envoi}
              />
            )}
            <BtnMain
              label={envoi === 'traite' ? 'Enregistrement…' : 'Traité'}
              onPress={() => agir('traite')}
              disabled={!!envoi}
            />
            <BtnMini
              outline
              label={envoi === 'rejete' ? '…' : 'Rien à signaler'}
              onPress={() => agir('rejete')}
              disabled={!!envoi}
            />
          </View>
          <Text style={s.aide}>
            « Traité » et « Rien à signaler » ne sont pas la même chose, et
            le journal garde les deux : « j&apos;ai agi » n&apos;est pas
            « il n&apos;y avait rien ».
          </Text>
        </>
      )}
    </View>
  );
});


/* ==========================================================================
   LA FILE DU RÉFÉRENTIEL

   Deux choses très différentes dans un même onglet, et c'est voulu : on
   l'ouvre pour « voir ce qui attend du côté des métiers », pas pour
   consulter une rubrique. Mais leurs boutons ne promettent PAS la même
   chose, et l'écran doit le dire :

     - accepter une demande de métiers APPLIQUE les métiers sur la fiche.
       L'artisan vérifié ne peut pas le faire lui-même, c'est toute la
       raison d'être de cette file ;
     - retenir une spécialité n'ajoute RIEN au catalogue. Celui-ci n'a
       qu'une source — le fichier du catalogue — et
       `npm run verifier-metiers` refuse qu'ils divergent. « Retenue » dit
       « celle-ci entrera au prochain passage », et le journal en garde la
       trace. Laisser croire autre chose serait pire que pas de bouton.
   ========================================================================== */
function FileReferentiel({ demandes, specialites, chargement, onActe, onErreur }) {
  if (chargement) return <EmptyState>Chargement du référentiel…</EmptyState>;

  const enAttente = demandes.filter((d) => d.statut === 'en_attente');
  const motsEnAttente = specialites.filter((x) => x.statut === 'en_attente');

  if (!demandes.length && !specialites.length) {
    return (
      <EmptyState icone={Hammer} titre="Rien n’attend">
        Aucune demande de changement de métier, aucune spécialité proposée.
        Ces deux files se remplissent toutes seules quand les artisans
        écrivent.
      </EmptyState>
    );
  }

  /* UNE SEULE LISTE pour les deux familles : deux `FlatList` imbriquées
     perdent la virtualisation, et c'est exactement ce que le lot 4 a
     corrigé ailleurs. On aplatit, avec un en-tête par famille. */
  const lignes = [
    ...(demandes.length
      ? [{ type: 'titre', id: 't-metiers',
        texte: enAttente.length
          ? `${enAttente.length} demande${enAttente.length > 1 ? 's' : ''} de changement de métier`
          : 'Demandes de métier — tout est traité' }]
      : []),
    ...demandes.map((d) => ({ type: 'demande', id: `d-${d.id}`, d })),
    ...(specialites.length
      ? [{ type: 'titre', id: 't-spe',
        texte: motsEnAttente.length
          ? `${motsEnAttente.length} spécialité${motsEnAttente.length > 1 ? 's' : ''} proposée${motsEnAttente.length > 1 ? 's' : ''}`
          : 'Spécialités proposées — tout est traité' }]
      : []),
    ...specialites.map((x) => ({ type: 'specialite', id: `s-${x.id}`, x })),
  ];

  return (
    <FlatList
      style={s.liste}
      data={lignes}
      keyExtractor={(l) => l.id}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={5}
      contentContainerStyle={{ paddingBottom: S.xxl }}
      ListFooterComponent={PiedDuJournal}
      renderItem={({ item }) => {
        if (item.type === 'titre') return <SectionLabel>{item.texte}</SectionLabel>;
        if (item.type === 'demande') {
          return <CarteDemandeMetier d={item.d} onActe={onActe} onErreur={onErreur} />;
        }
        return <CarteSpecialite x={item.x} onActe={onActe} onErreur={onErreur} />;
      }}
    />
  );
}

const CarteDemandeMetier = React.memo(function CarteDemandeMetier({ d, onActe, onErreur }) {
  const [envoi, setEnvoi] = useState(null);
  const note = useRef(null);
  const tranchee = d.statut !== 'en_attente';

  const agir = async (statut) => {
    if (envoi) return;
    setEnvoi(statut);
    retour.decision();
    try {
      await api.traiterMetierDemande({
        id: d.id, statut, note: note.current ? note.current.lire() : null,
      });
      retour.reussite();
      await onActe();
    } catch (e) {
      retour.echec();
      if (onErreur) onErreur(messageClair(e));
    } finally { setEnvoi(null); }
  };

  /* Ce qui CHANGE, et rien d'autre. Afficher deux listes complètes
     obligerait à les comparer à l'œil, et c'est là qu'on se trompe. */
  const ajoutes = d.voulus.filter((m) => !d.actuels.includes(m));
  const retires = d.actuels.filter((m) => !d.voulus.includes(m));

  return (
    <View style={s.carte}>
      <View style={s.entete}>
        <View style={s.enteteTexte}>
          <Text style={s.entreprise} numberOfLines={1}>{d.entreprise}</Text>
          <Text style={s.meta}>veut changer ses métiers</Text>
        </View>
        <View style={[s.etiquette, { backgroundColor: tranchee ? C.muted : C.accent }]}>
          <Text style={[s.etiquetteTexte, { color: surFond(tranchee ? C.muted : C.accent) }]}>
            {d.jours === 0 ? 'aujourd’hui' : `${d.jours} j`}
          </Text>
        </View>
      </View>

      {!!ajoutes.length && (
        <Text style={s.ligne}>+ {ajoutes.map(nomMetier).join(', ')}</Text>
      )}
      {!!retires.length && (
        <Text style={s.noteAncienne}>− {retires.map(nomMetier).join(', ')}</Text>
      )}
      {!!d.motif && <Text style={s.extrait}>« {d.motif} »</Text>}

      {d.estMoi ? (
        <View style={s.bloqueMoi}>
          <AlertTriangle size={15} color={C.accent2} />
          <Text style={s.bloqueMoiTexte}>
            C&apos;est votre propre demande. La base la refuse — le verrou des
            métiers annulerait l&apos;opération en silence. Passez par
            Supabase → SQL Editor.
          </Text>
        </View>
      ) : tranchee ? (
        <View style={s.clos}>
          <Check size={14} color={C.ok} />
          <Text style={s.closTexte}>
            {d.statut === 'acceptee' ? 'Acceptée — la fiche est à jour' : 'Refusée'}
            {d.note ? ` — ${d.note}` : ''}
          </Text>
        </View>
      ) : (
        <>
          <ChampLocal
            ref={note}
            multiligne
            placeholder="Motif — obligatoire pour refuser (dix caractères au moins)."
            style={s.champ}
            accessibilityLabel="Motif de la décision"
          />
          <View style={s.boutons}>
            <BtnMain
              label={envoi === 'acceptee' ? 'Application…' : 'Accepter'}
              onPress={() => agir('acceptee')}
              disabled={!!envoi}
            />
            <BtnMini
              outline
              label={envoi === 'refusee' ? '…' : 'Refuser'}
              onPress={() => agir('refusee')}
              disabled={!!envoi}
            />
          </View>
          <Text style={s.aide}>
            Accepter applique vraiment les métiers sur sa fiche : il ne peut
            pas le faire lui-même tant qu&apos;il est vérifié.
          </Text>
        </>
      )}
    </View>
  );
});

const CarteSpecialite = React.memo(function CarteSpecialite({ x, onActe, onErreur }) {
  const [envoi, setEnvoi] = useState(null);
  const tranchee = x.statut !== 'en_attente';

  const agir = async (statut) => {
    if (envoi) return;
    setEnvoi(statut);
    retour.decision();
    try {
      await api.traiterSpecialite({ id: x.id, statut });
      retour.reussite();
      await onActe();
    } catch (e) {
      retour.echec();
      if (onErreur) onErreur(messageClair(e));
    } finally { setEnvoi(null); }
  };

  return (
    <View style={s.carte}>
      <View style={s.entete}>
        <View style={s.enteteTexte}>
          <Text style={s.entreprise} numberOfLines={2}>« {x.texte} »</Text>
          <Text style={s.meta} numberOfLines={1}>
            écrite sous {x.metierNom}, par {x.proposePar}
          </Text>
        </View>
      </View>

      {tranchee ? (
        <View style={s.clos}>
          <Check size={14} color={C.ok} />
          <Text style={s.closTexte}>
            {x.statut === 'ajoutee' ? 'Retenue pour le catalogue' : 'Écartée'}
          </Text>
        </View>
      ) : (
        <>
          <View style={s.boutons}>
            <BtnMain
              label={envoi === 'ajoutee' ? '…' : 'Retenir'}
              onPress={() => agir('ajoutee')}
              disabled={!!envoi}
            />
            <BtnMini
              outline
              label={envoi === 'refusee' ? '…' : 'Écarter'}
              onPress={() => agir('refusee')}
              disabled={!!envoi}
            />
          </View>
          <Text style={s.aide}>
            « Retenir » marque une décision — ça n&apos;ajoute rien au
            catalogue tout de suite. Le catalogue des métiers n&apos;a
            qu&apos;une seule source, dans le code, et un contrôle refuse
            qu&apos;elle diverge de la base : l&apos;ajout se fait donc en
            modifiant le code.
          </Text>
        </>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.bg },
  onglets: { paddingHorizontal: GOUTTIERE, paddingVertical: S.sm },
  liste: { flex: 1 },

  /* Une carte PORTE l'information : angle vif, comme partout ailleurs. */
  carte: {
    ...CARTE,
    marginHorizontal: GOUTTIERE,
    marginBottom: S.md,
    padding: S.md,
    gap: S.sm,
  },

  entete: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  /* `flex: 1, minWidth: 0` : sans eux, un nom long POUSSE l'étiquette hors
     de l'écran au lieu de se raccourcir. Le piège du lot 5. */
  enteteTexte: { flex: 1, minWidth: 0 },
  entreprise: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  meta: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },

  etiquette: {
    paddingHorizontal: S.sm, paddingVertical: S.xs,
    borderRadius: R.gelule,
  },
  etiquetteTexte: {
    fontFamily: F.oswald6, fontSize: T.micro, letterSpacing: 0.4,
  },

  ligne: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
  noteAncienne: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit),
  },
  extrait: {
    fontFamily: F.inter, fontSize: T.corps, color: C.ink,
    lineHeight: interligne(T.corps), fontStyle: 'italic',
  },

  documents: { gap: S.xs },
  document: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    minHeight: 44, paddingHorizontal: S.sm,
    borderWidth: 1, borderColor: C.line, borderRadius: R.vif,
  },
  documentOuvrable: { borderColor: C.bordChamp },
  documentTexte: { fontFamily: F.inter5, fontSize: T.courant, color: C.accentTexte },
  documentAbsent: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },

  complementaires: {
    backgroundColor: C.okBg, borderWidth: 1, borderColor: C.line,
    borderRadius: R.vif, padding: S.sm, gap: S.xs,
  },
  complementairesTitre: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.ink, letterSpacing: 0.3,
  },
  complementaire: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted,
    lineHeight: interligne(T.micro),
  },

  cases: { gap: S.xs, paddingTop: S.xs },
  case: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: 44 },
  boite: {
    width: 20, height: 20, borderRadius: R.vif,
    borderWidth: 1, borderColor: C.bordChamp,
    alignItems: 'center', justifyContent: 'center',
  },
  boiteOn: { backgroundColor: C.accent, borderColor: C.accent },
  caseTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.muted },
  caseTexteOn: { fontFamily: F.inter6, color: C.ink },

  aideBadge: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted,
    lineHeight: interligne(T.micro),
  },
  champ: { minHeight: 72 },

  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, alignItems: 'center' },
  aide: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted,
    lineHeight: interligne(T.micro),
  },

  bloqueMoi: {
    flexDirection: 'row', gap: S.sm, alignItems: 'flex-start',
    backgroundColor: C.okBg, borderWidth: 1, borderColor: C.line,
    borderRadius: R.vif, padding: S.sm,
  },
  bloqueMoiTexte: {
    flex: 1, minWidth: 0,
    fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },

  retard: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  retardTexte: {
    flex: 1, minWidth: 0,
    fontFamily: F.inter5, fontSize: T.petit, color: C.bad,
    lineHeight: interligne(T.petit),
  },

  clos: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start' },
  closTexte: {
    flex: 1, minWidth: 0,
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    lineHeight: interligne(T.courant),
  },

  piedPage: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted,
    lineHeight: interligne(T.micro),
    paddingHorizontal: GOUTTIERE, paddingBottom: S.sm,
  },
});
