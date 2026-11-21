/**
 * UN LIEU DE DÉPÔT DES DÉCHETS — le mode « lieu » de « Mon entreprise »
 * (étape 2b-5 du module devis, section 46.2 bis de `schema.sql`).
 *
 * POURQUOI ICI, ET PAS DANS CHAQUE DEVIS
 * --------------------------------------
 * Sur un devis de construction, de rénovation ou de démolition d'un
 * bâtiment, ou de jardinage, la loi demande
 * le ou les points de collecte où l'entreprise prévoit de déposer les
 * déchets : leur raison sociale, leur adresse, leur type d'installation
 * (code de l'environnement, D. 541-45-1 I 3°). Un artisan dépose presque
 * toujours aux mêmes endroits : il les range UNE fois ici, et les choisit
 * ensuite d'un appui dans la carte « Déchets » de chaque devis (décision Q4
 * du 17/11/2026). Rien n'est imprimé avant le lot 2c.
 *
 * LE MODÈLE EXACT DE `FicheAssurance.js`, et pour les mêmes raisons :
 *   - on VALIDE d'abord (`validerLieuDepot`, les mêmes refus que la base,
 *     dans le même ordre), PUIS on envoie : un refus se voit sous SON champ,
 *     avant toute requête ;
 *   - RIEN N'EST COCHÉ D'OFFICE : le type part de ce qui est enregistré, et
 *     d'aucun autre endroit (`useState(lieu ? lieu.type_installation :
 *     null)`) — même pour un lieu nouveau, même s'il n'y a qu'un type qui
 *     semblerait aller de soi. « Opus propose, l'artisan confirme » ;
 *   - RETIRER DEMANDE DEUX APPUIS, et le second dit ce qu'il coûte : un
 *     brouillon qui citait ce lieu le perd (son point revient) ;
 *   - « Mon entreprise » SAIT quand un envoi est en cours (`onOccupe`) : sa
 *     croix attend au lieu de proposer de « quitter sans enregistrer » — un
 *     renoncement qui n'en serait pas un, l'écriture partie aboutirait
 *     quand même.
 *
 * L'ADRESSE passe par `ChampVille type="rue"`, comme les adresses de
 * « Mon entreprise » et du carnet de clients : la liste montre l'adresse
 * ENTIÈRE (la Base Adresse ne dit jamais « introuvable », elle rend une
 * AUTRE adresse — c'est le libellé entier qui le montre), le champ ne garde
 * que la rue, et un appui remplit le code postal et la commune. Une
 * déchèterie se trouve souvent dans une zone d'activités, sous un lieu-dit
 * ou sans numéro : le mode « rue » ne la proposera pas, et c'est voulu —
 * l'aide dit de taper l'adresse telle qu'elle est.
 *
 * LES TEXTES D'EXEMPLE ne ressemblent à aucune donnée (la règle du
 * 29/10/2026) : « Code postal », « Commune », jamais « 13410 » ni
 * « Lambesc », qu'on lirait comme déjà remplis.
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
import { BtnMain, BtnMini } from './ui';
import ChampLocal from './ChampLocal';
import ChampVille from './ChampVille';
import { Option } from './FicheEmetteur';
import { Trash } from './icons';
import {
  TYPES_INSTALLATION, LONGUEUR_MAX, COLONNES_ECRITES, validerLieuDepot,
} from '../lib/emetteur';
import { messageDeContrainte, messageClair } from '../lib/erreurs';
import * as retour from '../lib/retour';

const L = LONGUEUR_MAX.emetteur_lieux_depot;

/* Le texte de départ d'un champ : une chaîne, jamais `null`. */
const texte = (v) => (v == null ? '' : String(v));

const FicheLieuDepot = forwardRef(function FicheLieuDepot({
  lieu = null, onEnregistrer, onRetirer, onAnnuler, onOccupe = () => {},
}, ref) {
  const [type, setType] = useState(lieu ? lieu.type_installation : null);
  const [erreur, setErreur] = useState(null);
  const [occupe, setOccupe] = useState(false);
  const [confirmeRetrait, setConfirmeRetrait] = useState(false);
  /* Le garde d'un envoi ou d'un retrait EN COURS, dans une référence : deux
     appuis arrivés dans la même image verraient encore tous les deux
     l'ancien état, et partiraient tous les deux. */
  const enCours = useRef(false);
  const occuper = (oui) => { enCours.current = oui; setOccupe(oui); onOccupe(oui); };

  const raison = useRef(null);
  const champAdresse = useRef(null);
  /* La rue vit dans `ChampVille`, qui ne se lit pas : son texte est tenu
     ici, à chaque frappe comme à chaque suggestion choisie. */
  const adresse = useRef(texte(lieu && lieu.adresse));
  const codePostal = useRef(null);
  const ville = useRef(null);
  const libelle = useRef(null);
  /* « Précisez » n'est monté que pour le type « Autre » : choisir un autre
     type le démonte. Ce qu'on y avait tapé est GARDÉ ici, et revient si
     l'on rechoisit « Autre » — sinon un appui hésitant effaçait la saisie. */
  const libelleGarde = useRef(texte(lieu && lieu.libelle));

  /* Ce que le formulaire dit, aux noms de la base. Le libellé hors
     « autre » rend `null` : le déclencheur le viderait de toute façon. */
  const lireValeurs = () => ({
    raison_sociale: raison.current ? raison.current.lire() : null,
    adresse: adresse.current,
    code_postal: codePostal.current ? codePostal.current.lire() : null,
    ville: ville.current ? ville.current.lire() : null,
    type_installation: type,
    libelle: type === 'autre' && libelle.current ? libelle.current.lire() : null,
  });

  /* Des changements non enregistrés ? « Mon entreprise » le demande avant
     de fermer la fenêtre : la bande « Quitter sans enregistrer ». Les
     colonnes comparées sont celles que le client a le droit d'écrire —
     une seule liste, `COLONNES_ECRITES`. */
  useImperativeHandle(ref, () => ({
    aDesChangements: () => {
      const v = lireValeurs();
      const a = lieu || {};
      const pareil = (x, y) => texte(x).trim() === texte(y).trim();
      return !COLONNES_ECRITES.emetteur_lieux_depot.every((c) => pareil(v[c], a[c]));
    },
  }));

  const choisirType = (cle) => {
    if (type === 'autre' && libelle.current) libelleGarde.current = libelle.current.lire();
    setType(cle);
    setErreur(null);
  };

  const enregistrer = async () => {
    if (enCours.current) return;
    const v = lireValeurs();
    /* Les MÊMES refus que la base, avant tout envoi, dans l'ordre où elle
       les nommerait (`premierRefus`, l'ordre alphabétique des contraintes). */
    const r = validerLieuDepot(v);
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
      await onEnregistrer(v);
    } catch (e) {
      const message = messageClair(e, 'Ce lieu de dépôt');
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
      await onRetirer(lieu);
    } finally {
      occuper(false);
    }
  };

  const sous = (champ) => (erreur && erreur.champ === champ
    ? <Text style={s.erreur}>{erreur.message}</Text> : null);

  return (
    <View style={s.fiche}>
      <Text style={s.titre}>{lieu ? 'Modifier ce lieu de dépôt' : 'Ajouter un lieu de dépôt'}</Text>
      {/* Ce que la loi demande, et pour QUELS devis (D. 541-45-1 I 3°) — sans
          promettre d'impression : rien ne s'imprime avant le lot 2c. */}
      <Text style={s.aide}>
        {'Sur un devis de construction, de rénovation ou de démolition d’un bâtiment, ou de jardinage, la loi demande '
          + 'où iront les déchets : la raison sociale, l’adresse et le type d’installation de chaque lieu où vous les '
          + 'déposerez. Rangé ici une fois, ce lieu se choisit ensuite dans chaque devis.'}
      </Text>

      <Text style={s.label}>Raison sociale</Text>
      <ChampLocal
        ref={raison}
        defaut={texte(lieu && lieu.raison_sociale)}
        placeholder="Le nom de l’exploitant"
        maxLength={L.raison_sociale}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => champAdresse.current && champAdresse.current.focus()}
      />
      <Text style={s.aide}>Le nom de l’entreprise ou de la collectivité qui exploite le lieu, pas seulement le nom du lieu.</Text>
      {sous('raison_sociale')}

      <Text style={s.label}>Adresse</Text>
      <ChampVille
        ref={champAdresse}
        type="rue"
        placeholder="N° et rue"
        valeur={texte(lieu && lieu.adresse)}
        maxLength={L.adresse}
        onChange={(trouve) => {
          adresse.current = trouve.rue || trouve.affichage || '';
          if (trouve.codePostal && codePostal.current) codePostal.current.ecrire(trouve.codePostal);
          if (trouve.ville && ville.current) ville.current.ecrire(trouve.ville);
        }}
      />
      <Text style={s.aide}>Si aucune suggestion ne correspond, tapez l’adresse telle qu’elle est.</Text>
      {sous('adresse')}

      <View style={s.ligneCp}>
        <View style={s.cp}>
          <Text style={s.label}>Code postal</Text>
          <ChampLocal
            ref={codePostal}
            defaut={texte(lieu && lieu.code_postal)}
            placeholder="Code postal"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={s.ville}>
          <Text style={s.label}>Commune</Text>
          <ChampLocal
            ref={ville}
            defaut={texte(lieu && lieu.ville)}
            placeholder="Commune"
            maxLength={L.ville}
            returnKeyType="done"
          />
        </View>
      </View>
      {sous('code_postal')}
      {sous('ville')}

      <Text style={s.label}>Type d’installation</Text>
      <View style={s.options}>
        {TYPES_INSTALLATION.map((t) => (
          <Option
            key={t.cle}
            choisi={type === t.cle}
            libelle={t.libelle}
            onPress={() => choisirType(t.cle)}
          />
        ))}
      </View>
      {sous('type_installation')}

      {type === 'autre' && (
        <>
          <Text style={s.label}>Précisez</Text>
          <ChampLocal
            ref={libelle}
            defaut={libelleGarde.current}
            placeholder="Le type d’installation"
            maxLength={L.libelle}
            returnKeyType="done"
          />
          {sous('libelle')}
        </>
      )}

      {!!erreur && !erreur.champ && <Text style={s.erreur}>{erreur.message}</Text>}

      <BtnMain
        block
        disabled={occupe}
        label={occupe ? 'Enregistrement…' : 'Enregistrer ce lieu'}
        onPress={enregistrer}
        style={s.principal}
      />
      <BtnMini outline label="Annuler" onPress={onAnnuler} style={s.cible} />

      {/* RETIRER DEMANDE DEUX APPUIS, et le second DIT ce qu'il coûte : un
          brouillon qui citait ce lieu garde son identifiant, que plus rien
          ne compte — son point revient. Aucun devis n'est récrit. */}
      {!!lieu && (
        <>
          <Pressable
            onPress={retirer}
            disabled={occupe}
            accessibilityRole="button"
            accessibilityLabel={confirmeRetrait
              ? 'Confirmer le retrait de ce lieu. Les brouillons qui le citent le perdront.'
              : 'Retirer ce lieu'}
            style={({ pressed }) => [s.retirer, confirmeRetrait && s.retirerConfirme, pressed && APPUI.plein]}
          >
            <Trash size={15} color={confirmeRetrait ? surFond(C.bad) : C.bad} />
            <Text style={[s.retirerTexte, confirmeRetrait && s.retirerTexteConfirme]}>
              {confirmeRetrait ? 'Confirmer le retrait' : 'Retirer ce lieu'}
            </Text>
          </Pressable>
          {confirmeRetrait && <Text style={s.aide}>Les brouillons qui le citent le perdront.</Text>}
        </>
      )}
    </View>
  );
});

export default FicheLieuDepot;

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
  ligneCp: { flexDirection: 'row', gap: S.md },
  cp: { width: 112 },
  ville: { flex: 1, minWidth: 0 },
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
