/**
 * LE N° DE TVA QUE L'ANNUAIRE NE PUBLIE PAS — l'écrire, et le faire
 * contrôler par VIES (section 48, 20/10/2026). Un morceau du bloc « Votre
 * entreprise » (`IdentiteEntreprise.js`).
 *
 * POURQUOI UN CONTRÔLE, ET PAS UN SIMPLE CHAMP
 * --------------------------------------------
 * Le numéro d'une société se CALCULE depuis son SIREN : un champ libre
 * aurait presque toujours reçu le numéro calculé. Or calculer n'est pas
 * attribuer — mesuré le 20/10, les numéros que la DGFiP ne publie pas sont
 * refusés par VIES. Le propriétaire a décidé : on l'écrit, et Opus ne le
 * garde que si VIES, le service de la Commission européenne, le reconnaît.
 *
 * POURQUOI UN GESTE IMMÉDIAT, comme « Mettre à jour » le SIRET
 * ------------------------------------------------------------
 * C'est la fonction Edge qui écrit la preuve, au moment où VIES répond. Un
 * numéro tapé dans le formulaire des informations de devis, puis
 * « Enregistrer », ressemblerait à un numéro gardé alors que rien n'aurait
 * été contrôlé.
 *
 * TROIS RÉPONSES, ET ELLES NE SE CONFONDENT PAS : VIES reconnaît, VIES
 * refuse, VIES n'a PAS répondu — et dans ce dernier cas, on n'accuse jamais
 * le numéro (`messageTva`, dans `src/lib/tva.js`, la même phrase que la
 * fonction Edge).
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, ActivityIndicator, Keyboard, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, interligne,
} from '../theme';
import { Field, BtnMain, BtnMini } from './ui';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { analyserNumeroTva, messageTva } from '../lib/tva';
import { preuveTvaPour } from '../lib/emetteur';
import { dateFrancaise } from '../lib/entreprise';

/* Les états de saisie qui méritent d'être dits PENDANT la frappe : une
   faute qu'on peut voir tout de suite. « Incomplet » se tait — on n'a pas
   fini d'écrire. */
const A_DIRE_PENDANT = ['mal_forme', 'cle_fausse', 'autre_siren'];

export default function SaisieTva({ entreprise, preuveTva = null, regimeTva = null, onControler }) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [reponse, setReponse] = useState(null);
  /* Le garde du VOL, dans une référence : deux appuis arrivés dans la même
     image verraient encore tous les deux `enCours` à faux, et deux
     contrôles partiraient (le motif de `SaisieSiret`). */
  const enVol = useRef(false);

  if (!entreprise || entreprise.tva) return null;

  const preuve = preuveTvaPour(entreprise, preuveTva);
  const saisie = analyserNumeroTva(texte, entreprise.siren);
  const pret = saisie.etat === 'pret';
  const aide = A_DIRE_PENDANT.includes(saisie.etat)
    ? messageTva(saisie.etat, { siren: entreprise.siren }).texte : null;
  const dit = reponse ? messageTva(reponse.issue, { ...reponse, siren: entreprise.siren }) : null;

  const controler = async () => {
    if (!pret || enVol.current) return;
    enVol.current = true;
    Keyboard.dismiss();
    setEnCours(true);
    setReponse(null);
    const r = await onControler(saisie.numero);
    enVol.current = false;
    setEnCours(false);
    setReponse(r);
    const m = messageTva(r.issue, { ...r, siren: entreprise.siren });
    if (r.issue === 'reconnu') {
      retour.reussite();
      setOuvert(false);
      setTexte('');
    } else {
      retour.echec();
    }
    if (m.texte) retour.annoncer(m.texte);
  };

  const fermer = () => { setOuvert(false); setTexte(''); setReponse(null); };

  return (
    <View style={s.bloc}>
      {!!preuve && !ouvert && (
        <View style={s.ligne}>
          <Text style={s.libelle}>N° de TVA intracommunautaire</Text>
          <Text style={s.valeur}>{preuve.numero}</Text>
          <Text style={s.note}>
            {`Écrit par vous, reconnu par VIES (Commission européenne)${
              dateFrancaise(preuve.reconnu_le) ? ` le ${dateFrancaise(preuve.reconnu_le)}` : ''}. `
              + 'Il s’imprime sur vos devis, avec la date de ce contrôle.'}
          </Text>
        </View>
      )}

      {!preuve && !ouvert && (
        <Text style={s.texte}>
          L’annuaire des entreprises (liste de la DGFiP) ne publie aucun numéro de TVA
          intracommunautaire actif pour votre entreprise.
          {regimeTva === 'reel'
            ? ' Au régime réel, vos devis à des particuliers doivent le porter : écrivez-le, '
              + 'Opus le fera contrôler par VIES, le service de la Commission européenne.'
            : ' Si vous en avez un, écrivez-le : Opus le fera contrôler par VIES, le service de '
              + 'la Commission européenne, avant de l’imprimer.'}
        </Text>
      )}

      {!!dit && !!dit.texte && (
        <Text
          style={reponse.issue === 'reconnu' ? s.reussite : s.erreur}
          accessibilityLiveRegion="polite"
        >
          {dit.texte}
        </Text>
      )}

      {!ouvert && (
        <BtnMini
          outline
          label={preuve ? 'Écrire un autre numéro' : 'Écrire mon numéro de TVA'}
          onPress={() => { setOuvert(true); setReponse(null); }}
          style={s.cible}
        />
      )}

      {ouvert && (
        <View style={s.saisie}>
          <Text style={s.libelle}>N° de TVA intracommunautaire</Text>
          <Field
            value={texte}
            onChangeText={(t) => { setTexte(t); if (reponse) setReponse(null); }}
            placeholder="FR 00 123456789"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            maxLength={24}
            returnKeyType="send"
            onSubmitEditing={controler}
            editable={!enCours}
            accessibilityLabel="Numéro de TVA intracommunautaire"
          />
          {!!aide && <Text style={s.erreur}>{aide}</Text>}
          {!aide && !texte && <Text style={s.note}>{messageTva('vide').texte}</Text>}
          <BtnMain
            block
            ton="sombre"
            label="Faire contrôler par VIES"
            accessibilityLabel={enCours ? 'Contrôle auprès de VIES en cours' : 'Faire contrôler par VIES'}
            disabled={!pret || enCours}
            onPress={controler}
          >
            {enCours ? (
              <View style={s.enCours}>
                <ActivityIndicator size="small" color={C.surface} />
                <Text style={s.enCoursTexte}>Contrôle auprès de VIES…</Text>
              </View>
            ) : null}
          </BtnMain>
          {!enCours && (
            <Text style={s.note}>
              Seul ce numéro est envoyé à VIES, depuis les serveurs d’Opus. VIES met souvent
              de 10 à 30 secondes à répondre.
            </Text>
          )}
          {enCours && (
            <Text style={s.note} accessibilityLiveRegion="polite">
              VIES met souvent de 10 à 30 secondes à répondre. Restez sur cet écran.
            </Text>
          )}
          {api.mode === 'demo' && (
            <Text style={s.demo}>
              Démonstration : une clé de deux chiffres juste est reconnue ; une clé en lettres
              qui commence par Z trouve VIES saturé ; toute autre clé en lettres est refusée.
            </Text>
          )}
          <BtnMini outline label="Annuler" onPress={fermer} disabled={enCours} style={s.cible} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { gap: S.sm },
  saisie: { gap: S.sm },
  ligne: { gap: S.xs },
  libelle: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  valeur: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  texte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  note: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  demo: {
    fontFamily: F.inter, fontSize: T.petit, color: C.accent2, lineHeight: interligne(T.petit),
  },
  erreur: {
    fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm,
  },
  reussite: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.accent2, paddingLeft: S.sm,
  },
  enCours: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  enCoursTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surface },
  cible: { minHeight: TOUCHE, borderRadius: R.gelule },
});
