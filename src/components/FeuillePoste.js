/**
 * LA FEUILLE D'UN POSTE — changer son prix de référence, le retirer,
 * corriger sa phrase (lot P du module devis, 24/10/2026).
 *
 * DEUX PORTES, UNE FEUILLE : la carte d'une ligne de devis (« Changer ma
 * référence », « Modifier », « Fixer le prix »), qu'elle recouvre sans la
 * quitter — la carte n'est pas une `Modal`, il n'y en a donc jamais qu'une
 * à l'écran —, et la page « Ma base de postes ».
 *
 * LA PHRASE NE SE CORRIGE QUE DEPUIS LA PAGE (`depuisLaPage`). Depuis la
 * carte, une phrase corrigée détacherait le poste de la ligne ouverte, sans
 * que l'artisan voie pourquoi la référence disparaît. Dans la page, la
 * conséquence se CALCULE au lieu de s'écrire toujours
 * (`consequenceDeLaCorrection`) : une majuscule, un accent, un s ne changent
 * rien, et rien n'est dit ; une autre phrase détache les lignes déjà
 * écrites, et c'est dit ; la phrase d'un AUTRE poste est refusée avant
 * d'envoyer — la base la refuserait de toute façon.
 *
 * TOUTE ÉCRITURE PART SOUS CONDITION sur la date lue (`modifieLe`) : un
 * poste modifié entre-temps — depuis un autre appareil, ou par une requête
 * partie plus tôt — ne change pas, et ça se DIT ; la base est relue. Une
 * garde par référence empêche deux appuis de partir deux fois.
 *
 * « Retirer le prix de référence » le remet À VIDE, et c'est la seule façon
 * de ne plus voir d'écart sur ce poste : il n'y a pas de réglage pour faire
 * taire la question, elle a sa réponse ici. Les DEUX retraits se font en
 * DEUX appuis, comme « Retirer » d'une ligne de devis — le second dit ce qui
 * part : le lot n'a aucun historique, un prix effacé ne se retrouve que de
 * mémoire (relecture « écran », ECRAN2 : un seul appui, à huit points sous
 * « Enregistrer », effaçait 45,00 € et sa date).
 *
 * CE QU'ELLE MONTRE est décidé par `vueDeLaFeuillePoste` (`postes.js`, que
 * `verifier-postes` fait tourner) : depuis la CARTE d'une ligne, seul
 * « Enregistrer » — retirer un prix ou un poste se fait dans la page, où
 * l'on vient pour ça, et une phrase le dit ; et quand le champ porte un
 * autre nombre que la référence, la phrase du prix DIT la référence
 * (ECRAN3).
 *
 * DANS SON PROPRE FICHIER : `verifier-feuilles` juge PAR FICHIER, et une
 * feuille du bas ne se cumule jamais avec `{...CLAVIER}`.
 */
import React, {
  forwardRef, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import FeuilleBas from './FeuilleBas';
import ChampMontant from './ChampMontant';
import { BtnMain, BtnOutline, TextArea, Montant } from './ui';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { useRechercheDifferee } from '../lib/frappe';
import { messageClair, messageDeContrainte, ErreurPoste } from '../lib/erreurs';
import { versCentimes } from '../lib/centimes';
import { centimesEnSaisie, texteNet, LONGUEURS } from '../lib/devis';
import {
  consequenceDeLaCorrection, indicesDuClient, phraseIndices, ligneDescriptive, etiquettePrixReference, validerPoste,
  libelleOrigine, vueDeLaFeuillePoste, phraseRetraitDuPrix, PHRASE_RETRAIT_DU_POSTE, issueDuModifieEntreTemps,
} from '../lib/postes';

/* Une phrase qui porte un montant : le montant par `Montant` (chiffres
   alignés, à l'encre du texte), le reste dans le style de la phrase. */
function Phrase({ morceaux, style }) {
  if (!morceaux || (!morceaux.avant && morceaux.prix == null)) return null;
  return (
    <Text style={style}>
      {morceaux.avant}
      {morceaux.prix != null && <Montant centimes={morceaux.prix} enLigne style={s.montant} />}
      {morceaux.apres}
    </Text>
  );
}

/* LA PHRASE, DANS SON PROPRE COMPOSANT, avec son texte à lui : une lettre ne
   redessine que lui. La feuille n'apprend la phrase que quand la frappe
   RETOMBE (pour dire la conséquence d'une correction), et la lit EXACTE au
   moment d'enregistrer (`lire()`). Correcteur ACTIF : c'est le texte que le
   client lira sur ses devis. */
const ChampPhrase = forwardRef(function ChampPhrase({ valeur, onPause }, ref) {
  const vif = useRef(valeur || '');
  const [texte, setTexte] = useRechercheDifferee(valeur, onPause);
  useImperativeHandle(ref, () => ({ lire: () => vif.current }), []);
  return (
    <TextArea
      value={texte}
      onChangeText={(t) => { vif.current = t; setTexte(t); }}
      autoCorrect
      spellCheck
      autoCapitalize="sentences"
      maxLength={LONGUEURS.designation}
      accessibilityLabel="Phrase du poste"
      style={s.phrase}
    />
  );
});

export default function FeuillePoste({
  poste, prixPropose = null, depuisLaPage = false, postes = null, regime = null, regimeDeclareLe = null, absent = false,
  onRanger, onRelire, onFermer,
}) {
  const refPrix = useRef(null);
  const refPhrase = useRef(null);
  const enVol = useRef(false);
  const vivant = useRef(true);
  useEffect(() => () => { vivant.current = false; }, []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [confirmeRetrait, setConfirmeRetrait] = useState(false);
  const [confirmeRetraitPrix, setConfirmeRetraitPrix] = useState(false);
  /* La phrase une fois la frappe retombée : c'est elle qui décide de la
     conséquence affichée. */
  const [phrase, setPhrase] = useState(poste ? poste.designation : '');

  if (!poste) return null;

  const consequence = depuisLaPage ? consequenceDeLaCorrection(poste, phrase, postes) : { consequence: 'aucune', autre: null };
  /* Dans la page, il n'y a plus de devis : on ne cherche que les MOTIFS
     (un numéro, une adresse e-mail, « chez », une civilité). */
  const avertissement = depuisLaPage ? phraseIndices(indicesDuClient(phrase), { page: true }) : null;
  const origine = libelleOrigine(poste);
  /* CE QUE LA FEUILLE MONTRE : le prix de départ, la phrase du prix, les
     retraits — `vueDeLaFeuillePoste`, jamais une condition écrite ici. */
  const vue = vueDeLaFeuillePoste({ poste, prixPropose, depuisLaPage, regimeDeclareLe, absent });

  const refuser = (message) => {
    setErreur(message);
    retour.echec();
  };

  /* UNE ÉCRITURE, sous condition — et ce qu'elle dit. */
  const ecrire = async (faire, annonce, { retire = false } = {}) => {
    if (enVol.current) return;
    enVol.current = true;
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await faire();
      onRanger(r, { retire });
      retour.reussite();
      retour.annoncer(annonce);
      if (vivant.current) onFermer();
    } catch (e) {
      /* « Modifié entre-temps » : la base est relue, la feuille reste
         ouverte, et la phrase dit ce que la relecture a VRAIMENT rendu —
         relue ou non, le poste toujours là ou retiré (TEXTES5). */
      const message = e instanceof ErreurPoste
        ? issueDuModifieEntreTemps(await onRelire(), poste.id).phrase
        : messageClair(e, 'Pas enregistré');
      if (vivant.current) refuser(message);
      else {
        retour.echec();
        retour.annoncer(e instanceof ErreurPoste ? message : messageClair(e, 'Ce poste n’a pas pu être enregistré'));
      }
    } finally {
      enVol.current = false;
      if (vivant.current) setEnvoi(false);
    }
  };

  const enregistrer = () => {
    const lu = versCentimes(refPrix.current ? refPrix.current.lire() : '');
    if (!lu.ok) { refuser(lu.message); return; }
    const changements = {};
    if (lu.centimes !== (poste.prixReferenceCentimes ?? null)) changements.prixReferenceCentimes = lu.centimes;
    if (depuisLaPage && refPhrase.current) {
      const nouvelle = texteNet(refPhrase.current.lire());
      if (nouvelle !== poste.designation) {
        /* LA PHRASE D'UN AUTRE POSTE est refusée avant d'envoyer. */
        const c = consequenceDeLaCorrection(poste, nouvelle, postes);
        if (c.consequence === 'doublon') {
          refuser(`Un autre poste de votre base porte presque la même phrase : « ${c.autre.designation} ».`);
          return;
        }
        changements.designation = nouvelle;
      }
    }
    if (!Object.keys(changements).length) {
      retour.annoncer('Rien n’a changé.');
      onFermer();
      return;
    }
    const v = validerPoste({ ...poste, ...changements });
    if (!v.ok) { refuser(messageDeContrainte(v.contrainte)); return; }
    const annonce = changements.designation ? 'Le poste est enregistré.' : 'Votre prix de référence est changé.';
    ecrire(() => api.modifierPoste(poste.id, changements, { modifieLe: poste.modifieLe }), annonce);
  };

  /* RETIRER LE PRIX, EN DEUX APPUIS : le premier demande et dit ce qui part. */
  const retirerLePrix = () => {
    if (!confirmeRetraitPrix) { setConfirmeRetraitPrix(true); return; }
    ecrire(
      () => api.modifierPoste(poste.id, { prixReferenceCentimes: null }, { modifieLe: poste.modifieLe }),
      'Le prix de référence est retiré.',
    );
  };

  const retirerLePoste = () => {
    if (!confirmeRetrait) { setConfirmeRetrait(true); return; }
    ecrire(async () => {
      await api.retirerPoste(poste.id, { modifieLe: poste.modifieLe });
      return poste;
    }, 'Le poste est retiré de votre base.', { retire: true });
  };

  /* UN POSTE QUI N'EST PLUS DANS LA BASE RELUE (TEXTES5) : rien à
     enregistrer, rien à retirer — la phrase, pourquoi, et « Fermer ». */
  if (vue.phraseAbsent) {
    return (
      <FeuilleBas titre={depuisLaPage ? 'Ce poste' : 'Prix de référence'} onFermer={onFermer}>
        <Text style={s.phraseLue}>{poste.designation}</Text>
        <Text style={s.erreur} accessibilityLiveRegion="polite">{vue.phraseAbsent}</Text>
        <BtnOutline label="Fermer" onPress={onFermer} />
      </FeuilleBas>
    );
  }

  return (
    <FeuilleBas titre={depuisLaPage ? 'Ce poste' : 'Prix de référence'} onFermer={onFermer}>
      <Text style={s.etiquette}>{depuisLaPage ? 'La phrase' : 'Mot pour mot'}</Text>
      {depuisLaPage ? (
        <ChampPhrase ref={refPhrase} valeur={phrase} onPause={setPhrase} />
      ) : (
        <Text style={s.phraseLue}>{poste.designation}</Text>
      )}
      {consequence.consequence === 'detache' && (
        <Text style={s.aide}>Les lignes déjà écrites avec l’ancienne phrase ne seront plus reconnues comme ce poste.</Text>
      )}
      {consequence.consequence === 'doublon' && (
        <Text style={s.aide}>{`Un autre poste de votre base porte presque la même phrase : « ${consequence.autre.designation} ».`}</Text>
      )}
      {!!avertissement && (
        <View style={s.avertissement}>
          <Text style={s.avertissementTexte}>{avertissement}</Text>
        </View>
      )}
      <Text style={s.aide}>{ligneDescriptive(poste)}</Text>
      {!!origine && <Text style={s.aide}>{origine}</Text>}

      <Text style={s.etiquette}>{etiquettePrixReference(poste, regime)}</Text>
      <ChampMontant
        ref={refPrix}
        defaut={centimesEnSaisie(vue.prixDepart)}
        placeholder="0,00"
        accessibilityLabel={etiquettePrixReference(poste, regime)}
      />
      <Phrase morceaux={vue.phrasePrix} style={s.aide} />
      {erreur ? <Text style={s.erreur} accessibilityLiveRegion="polite">{erreur}</Text> : null}

      <BtnMain
        label={envoi ? 'Enregistrement…' : 'Enregistrer'}
        disabled={envoi || consequence.consequence === 'doublon'}
        onPress={enregistrer}
      />
      {vue.renvoiALaPage && (
        <Text style={s.aide}>Pour retirer ce prix ou ce poste, ouvrez « Ma base de postes ».</Text>
      )}

      {/* LES RETRAITS, DANS LA PAGE SEULEMENT, CHACUN EN DEUX APPUIS — un appui
          distrait ne doit pas faire disparaître un prix qu'on a mis du temps
          à fixer. Le second appui dit ce qui part. */}
      {(vue.retirerLePrix || vue.retirerLePoste) && (
        <View style={s.retrait}>
          {vue.retirerLePrix && (
            <Pressable
              onPress={retirerLePrix}
              disabled={envoi}
              accessibilityRole="button"
              accessibilityLabel={confirmeRetraitPrix ? 'Confirmer : retirer le prix de référence' : 'Retirer le prix de référence'}
              style={({ pressed }) => [s.action, confirmeRetraitPrix && s.actionDanger, pressed && APPUI.plein]}
            >
              <Text style={[s.actionTexte, confirmeRetraitPrix && s.actionDangerTexte]}>
                {confirmeRetraitPrix ? 'Confirmer le retrait du prix' : 'Retirer le prix de référence'}
              </Text>
            </Pressable>
          )}
          {vue.retirerLePrix && confirmeRetraitPrix && <Phrase morceaux={phraseRetraitDuPrix(poste)} style={s.aide} />}
          {vue.retirerLePoste && (
            <Pressable
              onPress={retirerLePoste}
              disabled={envoi}
              accessibilityRole="button"
              accessibilityLabel={confirmeRetrait ? 'Confirmer : retirer ce poste de ma base' : 'Retirer ce poste de ma base'}
              style={({ pressed }) => [s.action, confirmeRetrait && s.actionDanger, pressed && APPUI.plein]}
            >
              <Text style={[s.actionTexte, confirmeRetrait && s.actionDangerTexte]}>
                {confirmeRetrait ? 'Confirmer le retrait' : 'Retirer ce poste'}
              </Text>
            </Pressable>
          )}
          {/* CE QUI PART, ET CE QUI RESTE (TEXTES2) : la mémoire des prix
              peut reproposer la phrase — `PHRASE_RETRAIT_DU_POSTE` le dit. */}
          {vue.retirerLePoste && confirmeRetrait && <Text style={s.aide}>{PHRASE_RETRAIT_DU_POSTE}</Text>}
        </View>
      )}
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.xs },
  phrase: { minHeight: TOUCHE * 2 },
  phraseLue: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  /* Le montant d'une phrase : à l'encre du texte, chiffres alignés. */
  montant: { color: C.ink },
  /* L'avertissement : encre du texte, filet orange DE LECTURE (4,52 : 1). */
  avertissement: { borderLeftWidth: 3, borderLeftColor: C.accentTexte, paddingLeft: S.sm },
  avertissementTexte: { fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit) },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },
  retrait: { marginTop: S.md, gap: S.sm, borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.md },
  /* Un bouton FLOTTE : arrondi doux, 44 points par sa boîte. */
  action: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.line, borderRadius: R.doux,
  },
  actionTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  actionDanger: { backgroundColor: C.bad, borderColor: C.bad },
  actionDangerTexte: { color: surFond(C.bad) },
});
