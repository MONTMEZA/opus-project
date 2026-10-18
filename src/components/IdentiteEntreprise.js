/**
 * « VOTRE ENTREPRISE » — l'identité rattachée à la fiche, et la seule porte
 * pour la changer. Un bloc de « Mon entreprise » (`MonEntreprise.js`).
 *
 * D'OÙ IL VIENT
 * -------------
 * C'était la feuille du bas `FeuilleEntreprise.js`, ouverte depuis
 * « Modifier mon profil » (lot 1 bis du SIRET, 15/10/2026). Le lot 0a du
 * devis en a fait une fenêtre PLEIN ÉCRAN, parce qu'elle porte désormais
 * une vingtaine de champs pour les devis : une feuille collée au bas de
 * l'écran se fait recouvrir par le clavier de l'iPhone, champ ET croix
 * (le défaut du 04/10). Jamais deux écrans du même nom (plan 10.1) : la
 * feuille a disparu, son contenu vit ici, sans `FeuilleBas`.
 *
 * POURQUOI LE SIRET A SON PROPRE BOUTON
 * -------------------------------------
 * Rattacher un SIRET est un geste IMMÉDIAT, que la base tranche
 * (`rattacher_mon_siret`) : il ne peut pas attendre le bouton
 * « Enregistrer » des informations de devis. Un SIRET tapé puis
 * « Enregistrer » ne doit jamais ressembler à un rattachement fait.
 *
 * CE QU'IL MONTRE, ET À QUI
 * -------------------------
 * L'identité en LECTURE SEULE, adresse comprise : pour un entrepreneur
 * individuel, l'adresse de l'établissement est souvent son domicile — elle
 * ne s'affiche que sur ses devis, et la base le garantit (section 45.3). Le
 * n° de TVA s'y lit AVEC SA SOURCE : la liste de la DGFiP, par l'annuaire
 * des entreprises — jamais le répertoire Sirene, qui ne le publie pas.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, interligne,
} from '../theme';
import { BtnMain, BtnMini } from './ui';
import SaisieSiret from './SaisieSiret';
import { formaterSiret } from '../lib/siret';
import { nomFormeJuridique } from '../data/formes-juridiques';
import {
  nomDeLEntreprise, titreSansNom, communeEtDepartement, dateFrancaise,
} from '../lib/entreprise';
import { messageClair } from '../lib/erreurs';
import { adresseImprimee } from '../lib/emetteur';
import * as retour from '../lib/retour';

/* Pour un compte DÉJÀ professionnel, la demande à la main n'existe pas
   encore (la base la réserve aux particuliers). Le dire, plutôt que de
   laisser croire à un bouton qui manque — et le dire SOUS le conseil qu'il
   corrige (`aideSansSecours`). */
const SANS_SECOURS = 'Pour un compte déjà professionnel, une vérification à la main ne peut '
  + 'pas encore se demander depuis l’application : votre fiche reste rattachée à '
  + 'l’entreprise actuelle.';

/* DEUX FICHES À QUI LE BOUTON « RATTACHER » N'EST PAS PROPOSÉ — relecture
   adverse du 15/10 : le bouton promettait un geste que la base refuse à
   coup sûr. Une fiche dont l'administration a RETIRÉ l'entreprise (elle
   reste réservée, section 45.3 bis), et une fiche qui porte le badge sans
   entreprise rattachée (OP009, aucune porte d'administration ne sait encore
   la rattacher). Pour ces deux-là, l'écran DIT ce qu'il en est. */
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

export default function IdentiteEntreprise({
  entreprise, retiree = null, badge = false, etat, onRecharger, onRattacher, onLayout,
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
  const majLe = entreprise && dateFrancaise(entreprise.maj_insee);

  return (
    <View style={s.bloc} onLayout={onLayout}>
      <Text style={s.titre}>Votre entreprise</Text>

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
            /* La MÊME coupe que l'aperçu de l'en-tête : sur la vraie base,
               `adresse` contient déjà le code postal et la commune (mesuré
               le 18/10/2026), et les recoller les imprimait deux fois.
               Sans adresse diffusée, la commune seule. */
            valeur={entreprise.adresse
              ? adresseImprimee(entreprise, null).etablissement.join(', ')
              : communeEtDepartement(entreprise)}
            note="Visible de vous seul et de vos clients sur vos devis : elle ne s’affiche pas sur votre fiche."
          />
          <Ligne
            libelle="Créée en"
            valeur={/^\d{4}/.test(String(entreprise.date_creation || ''))
              ? String(entreprise.date_creation).slice(0, 4) : null}
          />
          {/* LE N° DE TVA, AVEC SA SOURCE — et ce n'est pas le répertoire.
              L'annuaire des entreprises le reprend de la liste de la DGFiP :
              l'attribuer à l'INSEE serait faux, et c'est ce que ce lot
              corrige aussi dans les textes légaux. */}
          <Ligne
            libelle="N° de TVA intracommunautaire"
            valeur={entreprise.tva || null}
            note={entreprise.tva
              ? 'Numéro de TVA intracommunautaire transmis par l’annuaire des entreprises '
                + '(liste de la DGFiP). Il s’imprime sur vos devis, quel que soit votre régime.'
              : null}
          />
          <Text style={s.source}>
            {entreprise.source === 'administration'
              ? `Rattachée par l’administration d’Opus${vuLe ? ` le ${vuLe}` : ''}.`
              : `Lue au répertoire Sirene de l’INSEE (www.insee.fr)${vuLe ? ` le ${vuLe}` : ''}`
                + `${majLe ? `, fiche mise à jour le ${majLe}` : ', date de mise à jour non publiée'}. `
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
          est affiché publiquement. C’est aussi ce qui permettra d’émettre des devis :
          un devis porte le nom, l’adresse et le SIRET de l’entreprise qui l’émet.
        </Text>
      )}

      {etat === 'pret' && !saisie && (entreprise || (!retiree && !badge)) && (
        <>
          {!!entreprise && (
            <Text style={s.texte}>
              Vous avez déménagé, ou votre entreprise a changé ? « Mettre à jour » la relit
              au répertoire : votre SIRET vous sera redemandé. Votre SIRET change avec
              l’adresse de l’établissement.
            </Text>
          )}
          <BtnMain
            block
            ton="sombre"
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
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { gap: S.sm },
  titre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
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
