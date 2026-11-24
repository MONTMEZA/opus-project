/**
 * UN SOUS-TRAITANT — le mode « sousTraitant » de « Mon entreprise » (étape
 * 2b-6 du module devis, section 46.2 quater de `schema.sql`).
 *
 * POURQUOI ICI, ET PAS DANS CHAQUE DEVIS
 * --------------------------------------
 * Quand une AUTRE entreprise fera une partie, ou la totalité, des travaux
 * d'économies d'énergie d'un devis pour un particulier, la loi demande de
 * la nommer avant la signature, et de dire si elle détient un signe de
 * qualité (code de la consommation, L. 224-115 ; sans ces informations, le
 * contrat est nul : L. 242-51). Un artisan travaille souvent avec les mêmes :
 * il les range UNE fois ici, et les coche ensuite dans la carte « Énergie et
 * label RGE » de chaque devis (réponse P3 du propriétaire, 23/11/2026).
 *
 * UN SOUS-TRAITANT N'EST PAS UN COMPTE OPUS : ni un lien vers un compte, ni
 * un partenariat (`professional_partners` relie deux comptes, avec
 * consentement). C'est une autre entreprise, que l'artisan nomme seul, sous
 * sa responsabilité : ses données partent avec SON compte (DROIT-11), et le
 * formulaire le dit.
 *
 * LE MODÈLE EXACT DE `FicheLieuDepot.js` (et de `FicheAssurance.js` pour le
 * justificatif joint), et pour les mêmes raisons :
 *   - on VALIDE d'abord (`validerSousTraitant`, les mêmes refus que la base,
 *     dans le même ordre, PLUS la clé du SIRET, que l'écran refuse et la
 *     base non — l'exception de La Poste), PUIS « Mon entreprise » envoie le
 *     justificatif, PUIS la ligne avec son chemin ;
 *   - LE SIRET AU PAVÉ NUMÉRIQUE, sans touche retour : un clavier numérique
 *     d'iOS n'en a pas, l'annoncer serait mentir. Les espaces tapés sont
 *     retirés par la base comme par le miroir (« 000 049 600 00019 ») ;
 *   - RIEN N'EST CHOISI D'OFFICE : « Détient-il un label RGE ? » part de ce
 *     qui est enregistré — vide, « Non » ou « Oui » —, et d'aucun autre
 *     endroit. Ses travaux non plus ;
 *   - SOUS « NON », les champs du label se TAISENT mais restent dans le
 *     formulaire jusqu'à l'enregistrement : un appui hésitant sur « Non »
 *     puis « Oui » ne perd rien. Et si un label était rangé, la phrase dit
 *     AVANT d'enregistrer qu'il sera retiré (BASE-7, ÉCRAN-13) : le
 *     déclencheur `tient_le_sous_traitant()` l'efface hors « Oui » ;
 *   - LA DATE PAR LE CALENDRIER, en ligne, avec ses flèches « année » (T30) ;
 *   - RETIRER DEMANDE DEUX APPUIS, et le second dit ce qu'il coûte : un
 *     brouillon qui citait ce sous-traitant garde son identifiant, que plus
 *     rien ne compte — son point revient ;
 *   - « Mon entreprise » SAIT quand un envoi est en cours (`onOccupe`).
 *
 * LES TEXTES vivent dans `TEXTES_SOUS_TRAITANTS` (`emetteur.js`), comparés
 * mot pour mot à l'annexe A.5 du cahier par `verifier-emetteur`. Les textes
 * d'exemple ne ressemblent à aucune donnée : « Quatorze chiffres », jamais
 * un numéro.
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
import { Option } from './FicheEmetteur';
import { Paperclip, Trash } from './icons';
import {
  LONGUEUR_MAX, TEXTES_SOUS_TRAITANTS, validerSousTraitant, categoriesApresAppui,
} from '../lib/emetteur';
import { formaterSiret } from '../lib/siret';
import { messageDeContrainte, messageClair } from '../lib/erreurs';
import { dateFrancaise } from '../lib/entreprise';
import { SOURCES_PIECE, choisirPieceJointe } from '../lib/media';
import { TRAVAUX_ENERGIE } from '../data/travaux-energie';
import * as retour from '../lib/retour';

const L = LONGUEUR_MAX.emetteur_sous_traitants;
const X = TEXTES_SOUS_TRAITANTS;

/* Le texte de départ d'un champ : une chaîne, jamais `null`. */
const texte = (v) => (v == null ? '' : String(v));
/* Les chiffres d'un SIRET — ce que la base range (« 000 049 … » → « 000049… »). */
const chiffres = (v) => texte(v).replace(/[^0-9]/g, '');
/* La réponse enregistrée : `true`, `false`, ou rien — jamais une chaîne. */
const reponseDe = (st) => (st && (st.label_detient === true || st.label_detient === false) ? st.label_detient : null);
const memesTravaux = (a, b) => JSON.stringify(Array.isArray(a) ? a : []) === JSON.stringify(Array.isArray(b) ? b : []);

const FicheSousTraitant = forwardRef(function FicheSousTraitant({
  sousTraitant = null, proId, voirPossible = false,
  onEnregistrer, onRetirer, onAnnuler, onVoir, onOccupe = () => {},
}, ref) {
  const st0 = sousTraitant || {};
  /* RIEN DE CHOISI D'OFFICE : ce qui est enregistré, ou rien. */
  const [detient, setDetient] = useState(reponseDe(sousTraitant));
  const [categories, setCategories] = useState(Array.isArray(st0.label_categories) ? [...st0.label_categories] : null);
  const [valideJusquau, setValideJusquau] = useState(st0.label_valide_jusquau || null);
  const [chemin] = useState(st0.label_justificatif_chemin || null);
  const [fichier, setFichier] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const [confirmeRetrait, setConfirmeRetrait] = useState(false);
  /* Le garde d'un envoi ou d'un retrait EN COURS, dans une référence. */
  const enCours = useRef(false);
  const occuper = (oui) => { enCours.current = oui; setOccupe(oui); onOccupe(oui); };

  const nom = useRef(null);
  const siret = useRef(null);

  /* Ce que le formulaire dit, aux noms de la base. Hors « Oui », les champs
     du label partent VIDES : le déclencheur les viderait de toute façon, et
     le miroir (`nettoyerSousTraitant`) aussi. Ce qui était tapé reste dans
     le formulaire tant qu'il est ouvert. */
  const lireValeurs = () => {
    const oui = detient === true;
    return {
      raison_sociale: nom.current ? nom.current.lire() : null,
      siret: siret.current ? siret.current.lire() : null,
      label_detient: detient,
      label_categories: oui && categories && categories.length ? [...categories] : null,
      label_valide_jusquau: oui ? valideJusquau || null : null,
      label_justificatif_chemin: oui ? chemin || null : null,
    };
  };

  /* Des changements non enregistrés ? Le SIRET se compare par ses CHIFFRES :
     « 000 049 … » affiché n'est pas un changement de « 000049… » rangé. */
  useImperativeHandle(ref, () => ({
    aDesChangements: () => {
      const v = lireValeurs();
      const pareil = (x, y) => texte(x).trim() === texte(y).trim();
      return (detient === true && !!fichier)
        || !pareil(v.raison_sociale, st0.raison_sociale)
        || chiffres(v.siret) !== chiffres(st0.siret)
        || v.label_detient !== reponseDe(sousTraitant)
        || !memesTravaux(v.label_categories, reponseDe(sousTraitant) === true ? st0.label_categories : null)
        || !pareil(v.label_valide_jusquau, reponseDe(sousTraitant) === true ? st0.label_valide_jusquau : null)
        || !pareil(v.label_justificatif_chemin, reponseDe(sousTraitant) === true ? st0.label_justificatif_chemin : null);
    },
  }));

  const repondre = (oui) => {
    setDetient(oui);
    setErreur(null);
  };

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
    /* Les MÊMES refus que la base, dans l'ordre où elle les nommerait —
       PUIS la clé du SIRET, que seul l'écran refuse (`cleSiretValide`).
       Le justificatif choisi mais pas encore envoyé n'a pas de chemin : la
       ligne se vérifie sans lui. */
    const r = validerSousTraitant(v, proId);
    if (!r.ok) {
      const message = r.message || messageDeContrainte(r.contrainte);
      setErreur({ champ: r.champ, message });
      retour.echec();
      retour.annoncer(message);
      return;
    }
    occuper(true);
    setErreur(null);
    try {
      await onEnregistrer(v, detient === true ? fichier : null);
    } catch (e) {
      const message = messageClair(e, 'Ce sous-traitant');
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
      await onRetirer(sousTraitant);
    } finally {
      occuper(false);
    }
  };

  const choisir = async (cle) => {
    try {
      const doc = await choisirPieceJointe(cle);
      if (doc) { setFichier(doc); setErreur(null); }
    } catch (e) {
      setErreur({ champ: 'label_justificatif_chemin', message: e.message || 'Le fichier n’a pas pu être ouvert.' });
    }
  };

  const sous = (champ) => (erreur && erreur.champ === champ
    ? <Text style={s.erreur}>{erreur.message}</Text> : null);

  const avaitUnLabel = reponseDe(sousTraitant) === true;

  return (
    <View style={s.fiche}>
      <Text style={s.titre}>{X.formulaire}</Text>
      {/* Des données d'une AUTRE entreprise, sous la responsabilité de
          l'artisan (DROIT-11) — dit AVANT les champs. */}
      <Text style={s.aide}>{X.tiers}</Text>

      <Text style={s.label}>{X.nom}</Text>
      <ChampLocal
        ref={nom}
        defaut={texte(st0.raison_sociale)}
        placeholder={X.nomPlaceholder}
        maxLength={L.raison_sociale}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => siret.current && siret.current.focus()}
      />
      {sous('raison_sociale')}

      <Text style={s.label}>{X.siret}</Text>
      <ChampLocal
        ref={siret}
        defaut={st0.siret ? formaterSiret(st0.siret) : ''}
        placeholder={X.siretPlaceholder}
        keyboardType="number-pad"
        maxLength={17}
      />
      {sous('siret')}

      <Text style={s.label}>{X.detient}</Text>
      <View style={s.options}>
        <Option choisi={detient === false} libelle={X.non} onPress={() => repondre(false)} />
        <Option choisi={detient === true} libelle={X.oui} onPress={() => repondre(true)} />
      </View>
      {sous('label_detient')}
      {detient === false && avaitUnLabel && <Text style={s.avis}>{X.retraitDuLabel}</Text>}

      {detient === true && (
        <>
          <Text style={s.label}>{X.travaux}</Text>
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
          {sous('label_categories')}

          <Text style={s.label}>{X.fin}</Text>
          {!!valideJusquau && <Text style={s.dateChoisie}>{`Jusqu’au ${dateFrancaise(valideJusquau)}`}</Text>}
          <Calendrier
            debut={valideJusquau}
            fin={null}
            onJour={(iso) => { setValideJusquau(iso); setErreur(null); }}
            annees
          />
          {sous('label_valide_jusquau')}

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
          {sous('label_justificatif_chemin')}
        </>
      )}

      {!!erreur && !erreur.champ && <Text style={s.erreur}>{erreur.message}</Text>}

      <BtnMain
        block
        disabled={occupe}
        label={occupe ? 'Enregistrement…' : X.enregistrer}
        onPress={enregistrer}
        style={s.principal}
      />
      <BtnMini outline label="Annuler" onPress={onAnnuler} style={s.cible} />

      {/* RETIRER DEMANDE DEUX APPUIS, et le second DIT ce qu'il coûte : un
          brouillon qui citait ce sous-traitant garde son identifiant, que
          plus rien ne compte — son point revient. Aucun devis n'est récrit,
          et le justificatif reste dans l'espace privé (`X.tiers` le dit). */}
      {!!sousTraitant && (
        <>
          <Pressable
            onPress={retirer}
            disabled={occupe}
            accessibilityRole="button"
            accessibilityLabel={confirmeRetrait
              ? `Confirmer le retrait de ce sous-traitant. ${X.retirerCoute}`
              : X.retirer}
            style={({ pressed }) => [s.retirer, confirmeRetrait && s.retirerConfirme, pressed && APPUI.plein]}
          >
            <Trash size={15} color={confirmeRetrait ? surFond(C.bad) : C.bad} />
            <Text style={[s.retirerTexte, confirmeRetrait && s.retirerTexteConfirme]}>
              {confirmeRetrait ? 'Confirmer le retrait' : X.retirer}
            </Text>
          </Pressable>
          {confirmeRetrait && <Text style={s.aide}>{X.retirerCoute}</Text>}
        </>
      )}
    </View>
  );
});

export default FicheSousTraitant;

const s = StyleSheet.create({
  fiche: { gap: S.xs },
  titre: { fontFamily: F.oswald6, fontSize: T.titre, color: C.ink, marginBottom: S.xs },
  label: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink, marginTop: S.md },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  /* Ce que l'enregistrement va retirer : un avis, pas une erreur — le
     filet bleu des avis en ligne de « Mon entreprise ». */
  avis: {
    fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit),
    borderLeftWidth: S.xs, borderLeftColor: C.accent2, paddingLeft: S.sm, marginTop: S.xs,
  },
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
