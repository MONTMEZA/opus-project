/**
 * UN SIGNE DE QUALITÉ (LABEL RGE) — le mode « label » de « Mon entreprise »
 * (étape 2b-6 du module devis, section 46.2 ter de `schema.sql`).
 *
 * POURQUOI ICI, ET PAS DANS CHAQUE DEVIS
 * --------------------------------------
 * Quand un artisan propose à un particulier des travaux d'économies
 * d'énergie que les aides réservent aux entreprises qualifiées, le devis
 * doit dire s'il détient un signe de qualité « pour les catégories de
 * travaux concernés », avec son justificatif (code de la consommation,
 * L. 224-114 ; sans lui, le contrat est nul : L. 242-51). Un artisan a le
 * même signe pour tous ses devis : il le range UNE fois ici — l'organisme,
 * l'intitulé, le numéro, les travaux qu'il couvre, sa date de fin et son
 * certificat —, et la carte « Énergie et label RGE » de chaque devis le
 * retrouve, travail par travail (réponse Q5 du propriétaire, 23/11/2026).
 * Rien n'est imprimé avant le lot 2c.
 *
 * CE N'EST PAS LE BADGE DU PROFIL (T29) : le bloc « Certification RGE » de
 * « Modifier mon profil » et le badge public `rge` restent à part. Ce
 * formulaire ne les lit ni ne les écrit, et son certificat ne porte jamais
 * le nom « rge » (`envoyerCertificat`, `api.js`) — `verifier-devis` le
 * tient (CTL-5).
 *
 * LE MODÈLE EXACT DE `FicheAssurance.js`, et pour les mêmes raisons :
 *   - on VALIDE d'abord (`validerLabel`, les mêmes refus que la base, dans
 *     le même ordre), PUIS « Mon entreprise » envoie le certificat, PUIS la
 *     ligne avec son chemin : une ligne qui pointerait un fichier pas encore
 *     arrivé serait un lien mort ;
 *   - RIEN N'EST COCHÉ D'OFFICE : les travaux partent de ce qui est
 *     enregistré, et d'aucun autre endroit (ni du métier, ni d'un devis) —
 *     « Opus propose, l'artisan confirme ». La dernière case décochée rend
 *     vide de valeur, jamais un tableau vide (`categoriesApresAppui`) ;
 *   - LA DATE DE FIN PAR LE CALENDRIER, en ligne (jamais une feuille posée
 *     par-dessus : deux fenêtres empilées laissent sur iPhone un voile
 *     invisible qui avale les touches), AVEC SES FLÈCHES « ANNÉE » (T30) :
 *     un signe de qualité vaut jusqu'à quatre ans ;
 *   - RETIRER DEMANDE DEUX APPUIS, et le second ne part qu'une fois ;
 *   - « Mon entreprise » SAIT quand un envoi est en cours (`onOccupe`) : sa
 *     croix attend au lieu de proposer de « quitter sans enregistrer ».
 *
 * LES TEXTES vivent dans `TEXTES_SIGNES_DE_QUALITE` (`emetteur.js`), écrits
 * une fois, comparés mot pour mot à l'annexe A.5 du cahier par
 * `verifier-emetteur`. Les textes d'exemple ne ressemblent à aucune donnée
 * (la règle du 29/10/2026) : « Nom de l’organisme », jamais le nom d'un
 * organisme réel, qu'on lirait comme déjà rempli.
 *
 * Hors d'`ECRANS_DEVIS` (`verifier-devis`) : c'est un écran de « Mon
 * entreprise », tenu par la partie 5 de `verifier-emetteur`.
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import { BtnMain, BtnMini, Interrupteur } from './ui';
import ChampLocal from './ChampLocal';
import { Calendrier } from './Calendrier';
import { Paperclip, Trash } from './icons';
import {
  LONGUEUR_MAX, COLONNES_ECRITES, TEXTES_SIGNES_DE_QUALITE, validerLabel, categoriesApresAppui,
} from '../lib/emetteur';
import { messageDeContrainte, messageClair } from '../lib/erreurs';
import { dateFrancaise } from '../lib/entreprise';
import { SOURCES_PIECE, choisirPieceJointe } from '../lib/media';
import { TRAVAUX_ENERGIE } from '../data/travaux-energie';
import * as retour from '../lib/retour';

const L = LONGUEUR_MAX.emetteur_labels;
const X = TEXTES_SIGNES_DE_QUALITE;

/* Le texte de départ d'un champ : une chaîne, jamais `null`. */
const texte = (v) => (v == null ? '' : String(v));
/* Deux listes de travaux disent-elles la même chose ? (une valeur absente
   et une liste vide ne se distinguent pas : aucune des deux ne coche rien) */
const memesTravaux = (a, b) => JSON.stringify(Array.isArray(a) ? a : []) === JSON.stringify(Array.isArray(b) ? b : []);

const FicheLabel = forwardRef(function FicheLabel({
  label = null, proId, voirPossible = false,
  onEnregistrer, onRetirer, onAnnuler, onVoir, onOccupe = () => {},
}, ref) {
  /* RIEN DE COCHÉ D'OFFICE : ce qui est enregistré, ou rien. */
  const [categories, setCategories] = useState(label && Array.isArray(label.categories) ? [...label.categories] : null);
  const [valideJusquau, setValideJusquau] = useState(label ? label.valide_jusquau : null);
  const [chemin] = useState(label ? label.justificatif_chemin : null);
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

  const organisme = useRef(null);
  const intitule = useRef(null);
  const reference = useRef(null);

  /* Ce que le formulaire dit, aux noms de la base — les colonnes que le
     client a le droit d'écrire, une seule liste (`COLONNES_ECRITES`). */
  const lireValeurs = () => ({
    organisme: organisme.current ? organisme.current.lire() : null,
    intitule: intitule.current ? intitule.current.lire() : null,
    reference: reference.current ? reference.current.lire() : null,
    categories: categories && categories.length ? [...categories] : null,
    valide_jusquau: valideJusquau || null,
    justificatif_chemin: chemin || null,
  });

  /* Des changements non enregistrés ? « Mon entreprise » le demande avant
     de fermer la fenêtre : la bande « Quitter sans enregistrer ». */
  useImperativeHandle(ref, () => ({
    aDesChangements: () => {
      const v = lireValeurs();
      const a = label || {};
      const pareil = (x, y) => texte(x).trim() === texte(y).trim();
      return !!fichier || !COLONNES_ECRITES.emetteur_labels.every((c) => (c === 'categories'
        ? memesTravaux(v[c], a[c]) : pareil(v[c], a[c])));
    },
  }));

  const toucherTravail = (cle) => {
    setCategories((liste) => categoriesApresAppui(liste, cle));
    setErreur(null);
  };
  /* L'état d'UNE case du formulaire : ce que l'artisan a coché, rien de
     plus. Ce n'est pas un jugement de couverture — celui-là n'a qu'une
     écriture, `etatsDesTravaux` (`devis.js`), qui confronte un signe aux
     travaux d'un devis. */
  const estCouvert = (cle) => Array.isArray(categories) && categories.indexOf(cle) >= 0;

  const enregistrer = async () => {
    if (enCours.current) return;
    const v = lireValeurs();
    /* Les MÊMES refus que la base, avant tout envoi, dans l'ordre où elle
       les nommerait (`premierRefus`, l'ordre alphabétique des contraintes).
       Un certificat choisi mais pas encore envoyé n'a pas de chemin : on
       vérifie la ligne sans lui ; le chemin que l'envoi rendra a la forme
       attendue (`envoyerCertificat`). */
    const r = validerLabel(v, proId);
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
      const message = messageClair(e, 'Ce signe de qualité');
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
      await onRetirer(label);
    } finally {
      occuper(false);
    }
  };

  const choisir = async (cle) => {
    try {
      const doc = await choisirPieceJointe(cle);
      if (doc) { setFichier(doc); setErreur(null); }
    } catch (e) {
      setErreur({ champ: 'justificatif_chemin', message: e.message || 'Le fichier n’a pas pu être ouvert.' });
    }
  };

  const sous = (champ) => (erreur && erreur.champ === champ
    ? <Text style={s.erreur}>{erreur.message}</Text> : null);

  return (
    <View style={s.fiche}>
      <Text style={s.titre}>{X.formulaire}</Text>
      {/* Les mots de L. 121-4 2° (DROIT-16) : ce qui engage, AVANT les champs. */}
      <Text style={s.aide}>{X.trompeuse}</Text>

      <Text style={s.label}>{X.organisme}</Text>
      <ChampLocal
        ref={organisme}
        defaut={texte(label && label.organisme)}
        placeholder={X.organismePlaceholder}
        maxLength={L.organisme}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => intitule.current && intitule.current.focus()}
      />
      {sous('organisme')}

      <Text style={s.label}>{X.intitule}</Text>
      <ChampLocal
        ref={intitule}
        defaut={texte(label && label.intitule)}
        placeholder={X.intitulePlaceholder}
        maxLength={L.intitule}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => reference.current && reference.current.focus()}
      />
      {sous('intitule')}

      <Text style={s.label}>{X.reference}</Text>
      <ChampLocal
        ref={reference}
        defaut={texte(label && label.reference)}
        maxLength={L.reference}
        returnKeyType="done"
        accessibilityLabel={X.reference}
      />
      {sous('reference')}

      {/* LES TRAVAUX COUVERTS : dix-neuf cases, aucune cochée d'office, les
          exemples en aide (à l'écran seulement). Les mêmes clés que la carte
          « Énergie et label RGE » d'un devis — une seule source. */}
      <Text style={s.label}>{X.travaux}</Text>
      <Text style={s.aide}>{X.travauxAide}</Text>
      <View style={s.options}>
        {TRAVAUX_ENERGIE.map((t) => (
          <Interrupteur
            key={t.cle}
            actif={estCouvert(t.cle)}
            libelle={t.libelle}
            aide={t.exemples || undefined}
            onPress={() => toucherTravail(t.cle)}
          />
        ))}
      </View>
      {sous('categories')}

      <Text style={s.label}>{X.fin}</Text>
      <Text style={s.aide}>{X.finAide}</Text>
      {!!valideJusquau && <Text style={s.dateChoisie}>{`Jusqu’au ${dateFrancaise(valideJusquau)}`}</Text>}
      <Calendrier debut={valideJusquau} fin={null} onJour={(iso) => { setValideJusquau(iso); setErreur(null); }} annees />
      {sous('valide_jusquau')}

      <Text style={s.label}>{X.joindre}</Text>
      <Text style={s.aide}>{X.joindreAide}</Text>
      {(!!fichier || !!chemin) && (
        <View style={s.jointe}>
          <Paperclip size={14} color={C.ok} />
          <Text style={s.jointeTexte} numberOfLines={1}>
            {fichier ? fichier.nom || 'Fichier choisi' : X.joint}
          </Text>
        </View>
      )}
      {!fichier && !!chemin && voirPossible && (
        <BtnMini outline label={X.voir} onPress={() => onVoir(chemin)} style={s.cible} />
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
      {sous('justificatif_chemin')}

      {!!erreur && !erreur.champ && <Text style={s.erreur}>{erreur.message}</Text>}

      <BtnMain
        block
        disabled={occupe}
        label={occupe ? 'Enregistrement…' : X.enregistrer}
        onPress={enregistrer}
        style={s.principal}
      />
      <BtnMini outline label="Annuler" onPress={onAnnuler} style={s.cible} />

      {/* RETIRER DEMANDE DEUX APPUIS, et le second le DIT. Le certificat,
          lui, reste dans l'espace privé : aucun client ne retire un fichier
          de `documents` (lot S-a) — il part avec le compte. */}
      {!!label && (
        <Pressable
          onPress={retirer}
          disabled={occupe}
          accessibilityRole="button"
          accessibilityLabel={confirmeRetrait
            ? 'Confirmer le retrait de ce signe de qualité'
            : X.retirer}
          style={({ pressed }) => [s.retirer, confirmeRetrait && s.retirerConfirme, pressed && APPUI.plein]}
        >
          <Trash size={15} color={confirmeRetrait ? surFond(C.bad) : C.bad} />
          <Text style={[s.retirerTexte, confirmeRetrait && s.retirerTexteConfirme]}>
            {confirmeRetrait ? 'Confirmer le retrait' : X.retirer}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

export default FicheLabel;

const s = StyleSheet.create({
  fiche: { gap: S.xs },
  titre: { fontFamily: F.oswald6, fontSize: T.titre, color: C.ink, marginBottom: S.xs },
  label: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink, marginTop: S.md },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  dateChoisie: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, marginTop: S.xs },
  erreur: {
    fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm, marginTop: S.xs,
  },
  options: { gap: S.xs, marginTop: S.xs },
  jointe: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.xs },
  jointeTexte: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.courant, color: C.ok },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  /* Des boutons qui FLOTTENT : arrondis, et 44 points de haut. */
  source: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.bordChamp, borderRadius: R.gelule, backgroundColor: C.surface,
  },
  sourceTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
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
