/**
 * « MON ENTREPRISE » — l'identité rattachée à la fiche, et la seule porte
 * pour la changer.
 *
 * POURQUOI UNE FEUILLE À PART, AVEC SON PROPRE BOUTON
 * ---------------------------------------------------
 * Le champ « SIRET » de « Modifier mon profil » était un texte libre, jamais
 * contrôlé — les cinq SIRET de la vraie base ont une clé de contrôle
 * fausse — et son exemple (« 812 345 678 00019 ») était inventé. Il a
 * disparu. Rattacher un SIRET est désormais un geste IMMÉDIAT, que la base
 * tranche (`rattacher_mon_siret`) : il ne peut pas attendre le bouton
 * « Enregistrer » des dix-huit autres champs. Un SIRET tapé puis
 * « Enregistrer » ne doit jamais ressembler à un rattachement fait.
 *
 * Elle vit dans SON fichier, et ce n'est pas un rangement : `FeuilleBas`
 * monte avec le clavier, `ProfilEditScreen` remonte son contenu
 * (`CLAVIER`). Un même fichier qui porterait les deux compterait le clavier
 * deux fois — `verifier-feuilles` le refuse.
 *
 * CE QU'ELLE MONTRE, ET À QUI
 * ---------------------------
 * L'identité en LECTURE SEULE, adresse comprise : pour un entrepreneur
 * individuel, l'adresse de l'établissement est souvent son domicile — elle
 * est « visible de vous seul », et la base le garantit (section 45.3).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, interligne,
} from '../theme';
import { BtnMain, BtnMini } from './ui';
import FeuilleBas from './FeuilleBas';
import SaisieSiret from './SaisieSiret';
import { formaterSiret } from '../lib/siret';
import { nomFormeJuridique } from '../data/formes-juridiques';
import {
  nomDeLEntreprise, titreSansNom, communeEtDepartement, dateFrancaise,
} from '../lib/entreprise';
import { messageClair } from '../lib/erreurs';
import * as retour from '../lib/retour';

/* Pour un compte DÉJÀ professionnel, la demande à la main n'existe pas
   encore (la base la réserve aux particuliers). Le dire, plutôt que de
   laisser croire à un bouton qui manque — et le dire SOUS le conseil qu'il
   corrige (`aideSansSecours`), pas en bas de la feuille. Mesuré au
   navigateur le 15/10 : posé sous les numéros d'essai, il arrivait douze
   lignes après « demandez une vérification à la main ». */
const SANS_SECOURS = 'Pour un compte déjà professionnel, une vérification à la main ne peut '
  + 'pas encore se demander depuis l’application : votre fiche reste rattachée à '
  + 'l’entreprise actuelle.';

/* DEUX FICHES À QUI LE BOUTON « RATTACHER » N'EST PLUS PROPOSÉ — relecture
   adverse du 15/10, et chacune le mesurait : le bouton promettait un geste
   que la base refuse à coup sûr.

     - une fiche dont l'administration a RETIRÉ l'entreprise : elle reste
       réservée (section 45.3, le gel), et l'écran l'y invitait pourtant —
       « SIRET jamais rattaché (Modifier mon profil → Mon entreprise) » ;
     - une fiche qui porte le badge sans entreprise rattachée : OP009, et
       aucune porte d'administration ne sait encore la rattacher.

   Pour ces deux-là, l'écran DIT ce qu'il en est, et ne propose rien. */
const SANS_PORTE_BADGE = 'Votre fiche porte le badge « vérifié », accordé avant que les '
  + 'entreprises soient rattachées : y lier une entreprise ne peut pas se faire depuis '
  + 'l’application, et aucune porte n’existe encore pour le demander.';

function Ligne({ libelle, valeur, note }) {
  if (!valeur) return null;
  return (
    <View style={s.ligne}>
      <Text style={s.libelle}>{libelle}</Text>
      <Text style={s.valeur}>{valeur}</Text>
      {!!note && <Text style={s.note}>{note}</Text>}
    </View>
  );
}

export default function FeuilleEntreprise({
  entreprise, retiree = null, badge = false, etat, onRecharger, onRattacher, onFermer,
}) {
  const [saisie, setSaisie] = useState(false);
  const [aRattacher, setARattacher] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  const rattacher = async () => {
    if (!aRattacher || enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      await onRattacher(aRattacher.siret);
      retour.reussite();
      setSaisie(false);
      setARattacher(null);
    } catch (e) {
      retour.echec();
      const texte = messageClair(e, 'Le rattachement n’a pas abouti');
      setErreur(texte);
      retour.annoncer(texte);
    }
    setEnCours(false);
  };

  const vuLe = entreprise && dateFrancaise(entreprise.verifie_le);

  return (
    <FeuilleBas titre="Mon entreprise" onFermer={onFermer} hauteurMax="90%">
      {(etat === 'jamais' || etat === 'charge') && (
        <Text style={s.texte}>Lecture de votre entreprise…</Text>
      )}

      {etat === 'echec' && (
        <>
          <Text style={s.texte}>
            Votre entreprise n’a pas pu être lue. Ce n’est pas qu’il n’y en a pas :
            réessayez.
          </Text>
          <BtnMini outline label="Réessayer" onPress={onRecharger} style={s.cible} />
        </>
      )}

      {etat === 'pret' && !!entreprise && (
        <View style={s.identite}>
          <Text style={s.nom}>{nomDeLEntreprise(entreprise) || titreSansNom(entreprise)}</Text>
          <Ligne libelle="Forme" valeur={nomFormeJuridique(entreprise.forme_juridique)} />
          <Ligne libelle="SIRET" valeur={formaterSiret(entreprise.siret)} />
          <Ligne
            libelle="Adresse de l’établissement"
            valeur={[entreprise.adresse, communeEtDepartement(entreprise)].filter(Boolean).join(', ')}
            note="Visible de vous seul : elle ne s’affiche nulle part sur votre fiche."
          />
          <Ligne
            libelle="Créée en"
            valeur={/^\d{4}/.test(String(entreprise.date_creation || ''))
              ? String(entreprise.date_creation).slice(0, 4) : null}
          />
          <Text style={s.source}>
            {entreprise.source === 'administration'
              ? `Rattachée par l’administration d’Opus${vuLe ? ` le ${vuLe}` : ''}.`
              : `Vue au répertoire Sirene de l’INSEE (www.insee.fr)${vuLe ? ` le ${vuLe}` : ''}`
                + `${dateFrancaise(entreprise.maj_insee) ? `, fiche mise à jour le ${dateFrancaise(entreprise.maj_insee)}` : ', date de mise à jour non publiée'}. `
                + 'Cela dit que l’entreprise existait et était active à cette date ; ce n’est '
                + 'ni un agrément ni une validation par l’État.'}
          </Text>
        </View>
      )}

      {etat === 'pret' && !entreprise && !!retiree && (
        <Text style={s.texte}>
          L’entreprise rattachée à votre fiche (SIRET {formaterSiret(retiree.siret)}) a été
          retirée par l’administration d’Opus
          {dateFrancaise(retiree.retiree_le) ? ` le ${dateFrancaise(retiree.retiree_le)}` : ''}
          {retiree.retrait_motif ? ` : « ${retiree.retrait_motif} »` : ''}. Elle ne peut pas
          être rattachée de nouveau depuis l’application.
        </Text>
      )}

      {etat === 'pret' && !entreprise && !retiree && badge && (
        <Text style={s.texte}>{SANS_PORTE_BADGE}</Text>
      )}

      {etat === 'pret' && !entreprise && !retiree && !badge && !saisie && (
        <Text style={s.texte}>
          Aucune entreprise n’est rattachée à votre fiche. Rattacher votre SIRET la
          relie à une entreprise active au répertoire Sirene de l’INSEE ; rien n’en
          est affiché publiquement.
        </Text>
      )}

      {etat === 'pret' && !saisie && (entreprise || (!retiree && !badge)) && (
        <>
          {!!entreprise && (
            <Text style={s.texte}>
              Vous avez déménagé ? Votre SIRET change avec l’adresse de l’établissement.
            </Text>
          )}
          <BtnMain
            block
            label={entreprise ? 'Mettre à jour' : 'Rattacher mon SIRET'}
            onPress={() => { setSaisie(true); setErreur(null); }}
          />
        </>
      )}

      {etat === 'pret' && saisie && (
        <>
          {aRattacher ? (
            <View style={s.confirmer}>
              <Text style={s.texte}>
                Rattacher {nomDeLEntreprise(aRattacher) || titreSansNom(aRattacher)} (SIRET
                {' '}{formaterSiret(aRattacher.siret)}) à votre fiche ?
              </Text>
              <BtnMain
                block
                label={enCours ? 'Rattachement…' : 'Rattacher ce SIRET'}
                onPress={rattacher}
                disabled={enCours}
              />
              <BtnMini
                outline
                label="Choisir un autre numéro"
                onPress={() => { setARattacher(null); setErreur(null); }}
                style={s.cible}
              />
            </View>
          ) : (
            <>
              <SaisieSiret
                onConfirme={(id) => { setARattacher(id); setErreur(null); }}
                etiquetteOui="Oui, c’est mon entreprise"
                /* La consultation est faite POUR MA FICHE : la fonction Edge
                   ne me répond pas « déjà utilisé » pour ma propre
                   entreprise — c'est ce qui rend « Mettre à jour » possible
                   après un déménagement. */
                pourMaFiche
                aideSansSecours={SANS_SECOURS}
              />
            </>
          )}
          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}
          <BtnMini
            outline
            label="Annuler"
            onPress={() => { setSaisie(false); setARattacher(null); setErreur(null); }}
            style={s.cible}
          />
        </>
      )}
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  texte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  identite: {
    gap: S.sm, padding: S.md, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.line, borderRadius: R.vif,
  },
  nom: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  ligne: { gap: S.xs },
  libelle: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  valeur: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  note: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  source: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted, lineHeight: interligne(T.micro),
  },
  confirmer: { gap: S.sm },
  erreur: {
    fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm,
  },
  cible: { minHeight: TOUCHE },
});
