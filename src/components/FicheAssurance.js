/**
 * UNE ASSURANCE POUR VOS DEVIS — le mode « assurance » de « Mon entreprise ».
 *
 * AUCUNE ASSURANCE N'EST EXIGÉE PAR OPUS (réponse du propriétaire du
 * 18/10/2026). Pour un devis à un particulier, la loi demande de
 * COMMUNIQUER au client celles qu'on a souscrites (code de la
 * consommation, R. 111-2 : « communique … ou met à sa disposition ») : on
 * les déclare ici, et Opus le fait en les imprimant. Ce que la loi attache aux TRAVAUX d'un
 * devis — l'attestation de décennale jointe pour un ouvrage — se décidera
 * devis par devis, aux lots 1 et 2. Cet écran ne dit donc jamais « la loi
 * l'exige ».
 *
 * CE QUI EST DEMANDÉ, ET POURQUOI
 * -------------------------------
 * Nature, assureur, ses coordonnées, couverture géographique : c'est ce que
 * le devis doit porter (`emetteur_assurance_complete_check`). Le NUMÉRO DE
 * CONTRAT est facultatif : aucun texte ne l'exige sur un devis, il figure
 * déjà sur l'attestation.
 *
 * L'ORDRE DE L'ENREGISTREMENT, et il n'est pas interchangeable : on valide
 * (`validerAssurance`, les mêmes refus que la base), PUIS on envoie le
 * fichier, PUIS on enregistre la ligne avec son chemin. Une ligne qui
 * pointerait un fichier pas encore arrivé serait un lien mort.
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import { BtnMain, BtnMini } from './ui';
import ChampLocal from './ChampLocal';
import { Calendrier } from './Calendrier';
import { Option } from './FicheEmetteur';
import { Paperclip, Trash } from './icons';
import {
  NATURES_ASSURANCE, LONGUEUR_MAX, validerAssurance,
} from '../lib/emetteur';
import { messageDeContrainte, messageClair } from '../lib/erreurs';
import { assuranceAttendue } from '../data/pieces-justificatives';
import { dateFrancaise } from '../lib/entreprise';
import { SOURCES_PIECE, choisirPieceJointe } from '../lib/media';
import * as retour from '../lib/retour';

const L = LONGUEUR_MAX.emetteur_assurances;

/* Le chemin d'une attestation déjà rangée pour le BADGE, s'il a la forme
   qu'accepte `emetteur_assurance_chemin_check` : un seul niveau, dans le
   dossier de la fiche. Les fiches anciennes rangent parfois une adresse
   complète : on n'en garde que le chemin, comme `urlDocument`. Une autre
   forme n'est pas proposée — la base la refuserait. */
export function attestationReprise(chemin, proId) {
  if (!chemin || !proId) return null;
  const propre = String(chemin).replace(/^.*\/documents\//, '');
  const prefixe = `${String(proId)}/`;
  const reste = propre.slice(prefixe.length);
  return propre.startsWith(prefixe) && reste !== '' && !reste.includes('/') ? propre : null;
}

/* Le texte de départ d'un champ : une chaîne, jamais `null`. */
const texte = (v) => (v == null ? '' : String(v));

const FicheAssurance = forwardRef(function FicheAssurance({
  assurance = null, metiers = [], proId, attestationBadge = null, voirPossible = false,
  onEnregistrer, onRetirer, onAnnuler, onVoir, onOccupe = () => {},
}, ref) {
  const [nature, setNature] = useState(assurance ? assurance.nature : null);
  const [valideJusquau, setValideJusquau] = useState(assurance ? assurance.valide_jusquau : null);
  const [chemin, setChemin] = useState(assurance ? assurance.attestation_chemin : null);
  const [fichier, setFichier] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const [confirmeRetrait, setConfirmeRetrait] = useState(false);
  /* Le garde d'un envoi ou d'un retrait EN COURS, dans une référence : deux
     appuis arrivés dans la même image verraient encore tous les deux
     l'ancien état, et partiraient tous les deux. */
  const enCours = useRef(false);
  /* « Mon entreprise » le sait aussi : pendant un envoi, sa croix attend au
     lieu de proposer de quitter sans enregistrer. */
  const occuper = (oui) => { enCours.current = oui; setOccupe(oui); onOccupe(oui); };

  const libelle = useRef(null);
  const assureur = useRef(null);
  const coordonnees = useRef(null);
  const couverture = useRef(null);
  const contrat = useRef(null);

  const reprise = attestationReprise(attestationBadge, proId);
  const attendue = assuranceAttendue(metiers || []);

  /* Ce que le formulaire dit, aux noms de la base. Les champs non montés
     (le libellé hors « autre ») rendent `null` : le déclencheur le
     viderait de toute façon. */
  const lireValeurs = () => ({
    nature,
    libelle: nature === 'autre' && libelle.current ? libelle.current.lire() : null,
    assureur_nom: assureur.current ? assureur.current.lire() : null,
    assureur_coordonnees: coordonnees.current ? coordonnees.current.lire() : null,
    couverture: couverture.current ? couverture.current.lire() : null,
    numero_contrat: contrat.current ? contrat.current.lire() : null,
    valide_jusquau: valideJusquau || null,
    attestation_chemin: chemin || null,
  });

  /* Des changements non enregistrés ? « Mon entreprise » le demande avant
     de fermer la fenêtre : la bande « Quitter sans enregistrer ». */
  useImperativeHandle(ref, () => ({
    aDesChangements: () => {
      const v = lireValeurs();
      const a = assurance || {};
      const pareil = (x, y) => texte(x).trim() === texte(y).trim();
      return !!fichier || !['nature', 'libelle', 'assureur_nom', 'assureur_coordonnees', 'couverture',
        'numero_contrat', 'valide_jusquau', 'attestation_chemin'].every((c) => pareil(v[c], a[c]));
    },
  }));

  const enregistrer = async () => {
    if (enCours.current) return;
    const v = lireValeurs();
    /* Les MÊMES refus que la base, avant tout envoi. Un fichier choisi mais
       pas encore envoyé n'a pas de chemin : on vérifie la ligne sans lui,
       puis le chemin que l'envoi rendra a la forme attendue. */
    const r = validerAssurance(v, proId);
    if (!r.ok) {
      const message = messageDeContrainte(r.contrainte);
      setErreur({ champ: r.champ, message });
      retour.echec();
      retour.annoncer(message);
      return;
    }
    occuper(true);
    setErreur(null);
    try {
      await onEnregistrer(v, fichier);
    } catch (e) {
      const message = messageClair(e, 'Cette assurance');
      setErreur({ champ: null, message });
      retour.echec();
      retour.annoncer(message);
    }
    occuper(false);
  };

  /* RETIRER DEMANDE DEUX APPUIS, et le second ne part qu'UNE fois. */
  const retirer = async () => {
    if (!confirmeRetrait) { setConfirmeRetrait(true); return; }
    if (enCours.current) return;
    occuper(true);
    try {
      await onRetirer(assurance);
    } finally {
      occuper(false);
    }
  };

  const choisir = async (cle) => {
    try {
      const doc = await choisirPieceJointe(cle);
      if (doc) { setFichier(doc); setErreur(null); }
    } catch (e) {
      setErreur({ champ: 'attestation_chemin', message: e.message || 'Le fichier n’a pas pu être ouvert.' });
    }
  };

  const sous = (champ) => (erreur && erreur.champ === champ
    ? <Text style={s.erreur}>{erreur.message}</Text> : null);

  return (
    <View style={s.fiche}>
      <Text style={s.titre}>{assurance ? 'Modifier cette assurance' : 'Ajouter une assurance'}</Text>
      <Text style={s.aide}>
        Opus n’en exige aucune. Pour un devis à un particulier, la loi demande de communiquer au
        client les assurances professionnelles que vous avez souscrites (code de la consommation,
        R. 111-2) : déclarez celles que vous avez, Opus les imprimera sur vos devis.
      </Text>

      <Text style={s.label}>Nature</Text>
      <View style={s.options}>
        {NATURES_ASSURANCE.map((n) => (
          <Option
            key={n.cle}
            choisi={nature === n.cle}
            libelle={n.libelle}
            onPress={() => { setNature(n.cle); setErreur(null); }}
          />
        ))}
      </View>
      <Text style={s.aide}>{`D’après vos métiers, celle qui compte : ${attendue.nom}. ${attendue.aide}`}</Text>
      {sous('nature')}

      {nature === 'autre' && (
        <>
          <Text style={s.label}>Laquelle ?</Text>
          <ChampLocal
            ref={libelle}
            defaut={texte(assurance && assurance.libelle)}
            placeholder="Par exemple : assurance dommages-ouvrage"
            maxLength={L.libelle}
            returnKeyType="done"
          />
          {sous('libelle')}
        </>
      )}

      <Text style={s.label}>Assureur</Text>
      <ChampLocal
        ref={assureur}
        defaut={texte(assurance && assurance.assureur_nom)}
        placeholder="Le nom de votre assureur"
        maxLength={L.assureur_nom}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => coordonnees.current && coordonnees.current.focus()}
      />
      {sous('assureur_nom')}

      <Text style={s.label}>Ses coordonnées</Text>
      <ChampLocal
        ref={coordonnees}
        defaut={texte(assurance && assurance.assureur_coordonnees)}
        placeholder="Adresse et téléphone de l’assureur"
        maxLength={L.assureur_coordonnees}
        returnKeyType="done"
      />
      {sous('assureur_coordonnees')}

      <Text style={s.label}>Couverture géographique</Text>
      <ChampLocal
        ref={couverture}
        defaut={texte(assurance && assurance.couverture)}
        placeholder="Par exemple : France métropolitaine"
        maxLength={L.couverture}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => contrat.current && contrat.current.focus()}
      />
      {sous('couverture')}

      <Text style={s.label}>Numéro de contrat</Text>
      <ChampLocal
        ref={contrat}
        defaut={texte(assurance && assurance.numero_contrat)}
        placeholder="Facultatif"
        maxLength={L.numero_contrat}
        returnKeyType="done"
      />
      <Text style={s.aide}>Facultatif : il figure déjà sur votre attestation.</Text>
      {sous('numero_contrat')}

      {/* LA GRILLE EN LIGNE, et pas `FeuilleDates` : une feuille posée par-
          dessus une fenêtre plein écran, ce sont deux fenêtres empilées —
          le voile invisible qui avale les touches sur iPhone. */}
      <Text style={s.label}>Valable jusqu’au</Text>
      <Text style={s.aide}>
        {valideJusquau
          ? `Jusqu’au ${dateFrancaise(valideJusquau)}. Opus vous préviendra ici quand la date sera passée.`
          : 'Facultatif. Touchez le dernier jour de validité de votre attestation.'}
      </Text>
      <Calendrier debut={valideJusquau} fin={null} onJour={(iso) => setValideJusquau(iso)} />
      {!!valideJusquau && (
        <BtnMini outline label="Effacer la date" onPress={() => setValideJusquau(null)} style={s.cible} />
      )}

      <Text style={s.label}>Attestation</Text>
      <Text style={s.aide}>
        Celle-ci accompagnera vos devis. Elle reste lisible par vous et, comme vos autres
        documents professionnels, par l’administration d’Opus.
      </Text>
      {(!!fichier || !!chemin) && (
        <View style={s.jointe}>
          <Paperclip size={14} color={C.ok} />
          <Text style={s.jointeTexte} numberOfLines={1}>
            {fichier ? fichier.nom || 'Fichier choisi' : 'Attestation jointe'}
          </Text>
        </View>
      )}
      {!fichier && !!chemin && voirPossible && (
        <BtnMini outline label="Voir l’attestation" onPress={() => onVoir(chemin)} style={s.cible} />
      )}
      {!!reprise && reprise !== chemin && !fichier && (
        <Pressable
          onPress={() => { setChemin(reprise); setErreur(null); }}
          accessibilityRole="button"
          accessibilityLabel="Reprendre l’attestation déjà envoyée pour le badge, sans la renvoyer"
          style={({ pressed }) => [s.source, s.sourceReprise, pressed && APPUI.plein]}
        >
          <Text style={s.sourceTexteReprise}>Reprendre l’attestation envoyée pour le badge</Text>
        </Pressable>
      )}
      <View style={s.sources}>
        {SOURCES_PIECE.map((p) => (
          <Pressable
            key={p.cle}
            onPress={() => choisir(p.cle)}
            accessibilityRole="button"
            accessibilityLabel={`${p.label} : ${p.aide}`}
            style={({ pressed }) => [s.source, pressed && APPUI.plein]}
          >
            <Text style={s.sourceTexte}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      {sous('attestation_chemin')}

      {!!erreur && !erreur.champ && <Text style={s.erreur}>{erreur.message}</Text>}

      <BtnMain
        block
        disabled={occupe}
        label={occupe ? 'Enregistrement…' : 'Enregistrer cette assurance'}
        onPress={enregistrer}
        style={s.principal}
      />
      <BtnMini outline label="Annuler" onPress={onAnnuler} style={s.cible} />

      {/* RETIRER DEMANDE DEUX APPUIS, et le second le DIT. Le fichier, lui,
          reste dans l'espace privé : il peut être aussi celui du badge. */}
      {!!assurance && (
        <Pressable
          onPress={retirer}
          disabled={occupe}
          accessibilityRole="button"
          accessibilityLabel={confirmeRetrait
            ? 'Confirmer le retrait de cette assurance'
            : 'Retirer cette assurance'}
          style={({ pressed }) => [s.retirer, confirmeRetrait && s.retirerConfirme, pressed && APPUI.plein]}
        >
          <Trash size={15} color={confirmeRetrait ? surFond(C.bad) : C.bad} />
          <Text style={[s.retirerTexte, confirmeRetrait && s.retirerTexteConfirme]}>
            {confirmeRetrait ? 'Confirmer le retrait' : 'Retirer cette assurance'}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

export default FicheAssurance;

const s = StyleSheet.create({
  fiche: { gap: S.xs },
  titre: { fontFamily: F.oswald6, fontSize: T.titre, color: C.ink, marginBottom: S.xs },
  label: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink, marginTop: S.md },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  erreur: {
    fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm, marginTop: S.xs,
  },
  options: { gap: S.xs },
  jointe: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.xs },
  jointeTexte: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.courant, color: C.ok },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  /* Des boutons qui FLOTTENT : arrondis, et 44 points de haut. */
  source: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.bordChamp, borderRadius: R.gelule, backgroundColor: C.surface,
  },
  sourceTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
  sourceReprise: { borderColor: C.accentTexte, marginTop: S.sm, alignSelf: 'flex-start' },
  sourceTexteReprise: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accentTexte },
  principal: { marginTop: S.xl },
  cible: { minHeight: TOUCHE, alignSelf: 'flex-start', marginTop: S.sm },
  retirer: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, alignSelf: 'flex-start',
    minHeight: TOUCHE, paddingHorizontal: S.md, marginTop: S.xl,
    borderWidth: 1, borderColor: C.line, borderRadius: R.doux,
  },
  retirerConfirme: { backgroundColor: C.bad, borderColor: C.bad },
  retirerTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.bad },
  /* MESURÉ, pas choisi : le blanc sur #B4432B donne 5,56 : 1. */
  retirerTexteConfirme: { color: surFond(C.bad) },
});
