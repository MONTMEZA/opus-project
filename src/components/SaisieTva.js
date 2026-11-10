/**
 * LE N° DE TVA QUE L'ANNUAIRE NE TRANSMET PAS — l'écrire, et le faire
 * contrôler par VIES (section 48, 20/10/2026). Un morceau du bloc « Votre
 * entreprise » (`IdentiteEntreprise.js`).
 *
 * POURQUOI UN CONTRÔLE, ET PAS UN SIMPLE CHAMP
 * --------------------------------------------
 * Le numéro d'une société se CALCULE depuis son SIREN : un champ libre
 * aurait presque toujours reçu le numéro calculé. Or calculer n'est pas
 * attribuer — mesuré le 20/10, les numéros que la DGFiP ne publie pas sont
 * refusés par VIES. Le propriétaire a décidé : on l'écrit, et Opus le fait
 * contrôler par VIES, le service de la Commission européenne.
 *
 * POURQUOI UN GESTE IMMÉDIAT, comme « Mettre à jour » le SIRET
 * ------------------------------------------------------------
 * C'est la fonction Edge qui écrit la preuve, au moment où VIES répond. Un
 * numéro tapé dans le formulaire des informations de devis, puis
 * « Enregistrer », ressemblerait à un numéro gardé alors que rien n'aurait
 * été contrôlé.
 *
 * TROIS RÉPONSES, ET ELLES NE SE CONFONDENT PAS : VIES reconnaît, VIES
 * refuse, VIES n'a PAS contrôlé — et dans ce dernier cas, on n'accuse
 * jamais le numéro (`messageTva`, dans `src/lib/tva.js`, la même phrase que
 * la fonction Edge).
 *
 * LA PORTE DE SORTIE (lot 2b-2, cahier §3.7) : après un refus de VIES — ou
 * trois contrôles restés sans réponse en plus d'une heure (P5) —, l'artisan
 * sûr de son numéro peut le DÉCLARER sur l'honneur, en cochant une case dont
 * le texte est celui que le téléphone renvoie (`DECLARATION_TVA`). Ce que
 * l'écran en décide vit dans `src/lib/declaration-tva.js`, que `node` fait
 * tourner : quand la case s'offre (jamais pour le numéro déjà déclaré,
 * jamais quand VIES en reconnaît un), et le TON de chaque issue — un
 * « déclaré » est une réussite, en vert, pas une erreur rouge qui vibre.
 *
 * RIEN DE NOUVEAU N'APPARAÎT AU-DESSUS DU BOUTON QU'ON VIENT DE TOUCHER
 * (critique écran E-I2) : la réponse de VIES et le bloc de la déclaration
 * se posent SOUS le bouton « Faire contrôler par VIES » et sa note. Le
 * bouton ne bouge pas sous le doigt.
 *
 * LA CASE SE DÉCOCHE à chaque nouvelle réponse, à chaque changement du
 * numéro, et au démontage (son état vit ici) ; elle est inerte pendant un
 * envoi.
 *
 * ET L'ENVOI EN VOL SE DIT AU-DESSUS : `onOccupe` remonte à « Mon
 * entreprise » CE qui part (`'controle'`, `'declaration'`, `'retrait'`), qui
 * refuse de se fermer ou de passer en édition tant que la fonction n'a pas
 * répondu (relecture du 20/10/2026), et choisit son message.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, Keyboard, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne,
} from '../theme';
import { Field, BtnMain, BtnMini } from './ui';
import { Check } from './icons';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { analyserNumeroTva, messageTva, DECLARATION_TVA } from '../lib/tva';
import { preuveTvaPour } from '../lib/emetteur';
import { dateFrancaise } from '../lib/entreprise';
import {
  DECLARATION_ECRAN, remplaceraLaDeclaration, noteDUneDeclaration, peutDeclarerTva, declarationOfferte,
  presentationDeLIssueTva,
} from '../lib/declaration-tva';

/* Les états de saisie qui se disent en ROUGE pendant la frappe : une faute
   qu'on peut voir tout de suite. « Incomplet » se dit en gris — on n'a pas
   fini d'écrire, ce n'est pas une faute. */
const FAUTES = ['mal_forme', 'cle_fausse', 'autre_siren'];

export default function SaisieTva({
  entreprise, preuveTva = null, regimeTva = null, onControler, onDeclarer = null, onRetirer = null, onOccupe = null,
}) {
  /* TOUS LES CROCHETS AVANT LA SORTIE ANTICIPÉE (plus bas) : React
     n'appellerait plus le même nombre de crochets d'un rendu à l'autre. */
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState('');
  /* CE QUI PART : `null`, `'controle'`, `'declaration'` ou `'retrait'`. */
  const [enCours, setEnCours] = useState(null);
  /* La dernière réponse, avec le numéro POUR LEQUEL elle a été demandée
     (`pour`) : la case ne s'offre que pour le numéro encore dans le champ. */
  const [reponse, setReponse] = useState(null);
  /* Un appui sur « Envoyer » (ou Entrée) quand le numéro n'est pas prêt :
     on DIT pourquoi, au lieu de ne rien faire en silence. */
  const [motif, setMotif] = useState(null);
  const [coche, setCoche] = useState(false);
  const [motifDeclaration, setMotifDeclaration] = useState(null);
  const [confirmeRetrait, setConfirmeRetrait] = useState(false);
  /* Le garde du VOL, dans une référence : deux appuis arrivés dans la même
     image verraient encore tous les deux `enCours` à faux, et deux envois
     partiraient (le motif de `SaisieSiret`). */
  const enVol = useRef(false);
  /* Ce composant peut disparaître pendant le vol (le numéro de l'annuaire
     arrive, la fiche se relit) : on ne vibre ni n'annonce plus rien après. */
  const monte = useRef(true);
  useEffect(() => () => { monte.current = false; }, []);

  if (!entreprise || entreprise.tva) return null;

  const preuve = preuveTvaPour(entreprise, preuveTva);
  const saisie = analyserNumeroTva(texte, entreprise.siren);
  const pret = saisie.etat === 'pret';
  const details = { siren: entreprise.siren, regime: regimeTva };
  const faute = FAUTES.includes(saisie.etat) ? messageTva(saisie.etat, details).texte : null;
  const aide = !faute && saisie.etat === 'incomplet' ? messageTva('incomplet', details).texte : null;
  /* LA DÉCLARATION PEUT-ELLE S'OFFRIR pour le numéro de la réponse ? — calculé
     à chaque rendu, sur la preuve telle que « Mon entreprise » la tient. */
  const numeroRepondu = reponse ? reponse.pour : null;
  const peutDeclarer = peutDeclarerTva({ entreprise, preuveTva, numero: numeroRepondu });
  const dit = reponse ? messageTva(reponse.issue, { ...reponse, ...details, peutDeclarer }) : null;
  const ton = reponse ? presentationDeLIssueTva(reponse.issue).ton : null;
  const offerte = !!onDeclarer && declarationOfferte({ peutDeclarer, reponse, numero: numeroRepondu });
  const leControle = preuve ? dateFrancaise(preuve.reconnu_le) : null;
  const declaree = !!preuve && preuve.source === 'declaration';

  /* Une réponse, quelle qu'elle soit, et son effet sur le bloc : le ton, la
     vibration et le champ viennent de `presentationDeLIssueTva`. */
  const recevoir = (r, pour) => {
    const p = presentationDeLIssueTva(r.issue);
    setReponse({ ...r, pour });
    setCoche(false);
    setMotifDeclaration(null);
    setConfirmeRetrait(false);
    if (p.champ === 'ferme_vide') { setOuvert(false); setTexte(''); } else if (p.champ === 'ferme') setOuvert(false);
    if (p.retour === 'reussite') retour.reussite();
    else if (p.retour === 'echec') retour.echec();
    const m = messageTva(r.issue, { ...r, ...details, peutDeclarer: peutDeclarerTva({ entreprise, preuveTva, numero: pour }) });
    if (m.texte) retour.annoncer(m.texte);
  };

  /* LE CONTRÔLE — le numéro tapé, ou celui d'une déclaration à recontrôler
     SANS le retaper (`numeroDeclare`). */
  const controler = async (numeroDeclare = null) => {
    const deja = typeof numeroDeclare === 'string' ? numeroDeclare : null;
    if (enVol.current) return;
    if (!deja && !pret) {
      /* Le bouton grisé et Entrée muette laissaient croire l'application
         cassée : on dit ce qui manque. */
      const m = messageTva(saisie.etat, details).texte;
      setMotif(m);
      if (m) retour.annoncer(m);
      return;
    }
    const pour = deja || saisie.numero;
    enVol.current = true;
    Keyboard.dismiss();
    setMotif(null);
    setEnCours('controle');
    setReponse(null);
    setCoche(false);
    if (onOccupe) onOccupe('controle');
    let r;
    try {
      r = await onControler(pour);
    } catch (e) {
      /* `controlerTva` ne lève pas ; si l'écran au-dessus le fait, c'est une
         panne d'Opus, pas un numéro faux. */
      r = { issue: 'service_indisponible' };
    } finally {
      enVol.current = false;
      if (onOccupe) onOccupe(null);
    }
    if (!monte.current) return;
    setEnCours(null);
    recevoir(r, pour);
  };

  /* LA DÉCLARATION — seulement case cochée : sinon on DIT ce qui manque, sans
     vibrer (comme un numéro pas prêt). */
  const declarer = async () => {
    if (enVol.current || !onDeclarer || !numeroRepondu) return;
    if (!coche) {
      const m = messageTva('sans_engagement').texte;
      setMotifDeclaration(m);
      if (m) retour.annoncer(m);
      return;
    }
    const pour = numeroRepondu;
    enVol.current = true;
    Keyboard.dismiss();
    setMotifDeclaration(null);
    setEnCours('declaration');
    if (onOccupe) onOccupe('declaration');
    let r;
    try {
      r = await onDeclarer(pour, { engagement: true });
    } catch (e) {
      r = { issue: 'service_indisponible' };
    } finally {
      enVol.current = false;
      if (onOccupe) onOccupe(null);
    }
    if (!monte.current) return;
    setEnCours(null);
    recevoir(r, pour);
  };

  /* LE RETRAIT, en deux appuis : le second le DIT. */
  const retirer = async () => {
    if (enVol.current || !onRetirer) return;
    if (!confirmeRetrait) { setConfirmeRetrait(true); return; }
    const pour = preuve ? preuve.numero : null;
    enVol.current = true;
    setConfirmeRetrait(false);
    setEnCours('retrait');
    if (onOccupe) onOccupe('retrait');
    let r;
    try {
      r = await onRetirer();
    } catch (e) {
      r = { issue: 'service_indisponible' };
    } finally {
      enVol.current = false;
      if (onOccupe) onOccupe(null);
    }
    if (!monte.current) return;
    setEnCours(null);
    recevoir(r, pour);
  };

  const ouvrir = () => { setOuvert(true); setReponse(null); setCoche(false); setConfirmeRetrait(false); };
  const fermer = () => {
    setOuvert(false); setTexte(''); setReponse(null); setMotif(null); setCoche(false); setMotifDeclaration(null);
  };

  const styleReponse = { reussite: s.reussite, note: s.noteReponse }[ton] || s.erreur;
  /* La réponse, SOUS le bouton qu'on vient de toucher. */
  const laReponse = !!dit && !!dit.texte && (
    <Text style={styleReponse} accessibilityLiveRegion="polite">{dit.texte}</Text>
  );
  /* Une déclaration d'un AUTRE numéro sera remplacée : on le dit avant. */
  const remplace = declaree && numeroRepondu && preuve.numero !== numeroRepondu
    ? remplaceraLaDeclaration({ declare_le: preuve.declare_le, numero: preuve.numero }) : null;

  return (
    <View style={s.bloc}>
      {!!preuve && !ouvert && (
        <View style={s.ligne}>
          <Text style={s.libelle}>N° de TVA intracommunautaire</Text>
          <Text style={s.valeur}>{preuve.numero}</Text>
          <Text style={s.note}>
            {preuve.source === 'essai' && 'Preuve d’essai posée par Opus : ce numéro n’a pas été soumis à VIES.'}
            {declaree && noteDUneDeclaration(preuve.declare_le)}
            {preuve.source === 'vies' && `Écrit par vous. VIES l’a reconnu${leControle ? ` le ${leControle}` : ''}, d’après `
              + 'l’administration fiscale française. Il s’imprime sur vos devis.'}
          </Text>
        </View>
      )}

      {!preuve && !ouvert && (
        <Text style={s.texte}>
          L’annuaire des entreprises (liste de la DGFiP) n’a transmis aucun numéro de TVA
          intracommunautaire pour votre entreprise.
          {regimeTva === 'reel'
            ? ' Au régime réel, la loi demande de le communiquer à vos clients particuliers '
              + '(code de la consommation, R. 111-2) ; Opus l’imprime sur vos devis. Écrivez-le : '
              + `Opus le fera contrôler par VIES, le service de la Commission européenne. ${DECLARATION_ECRAN.accueilReel}`
            : ' Si vous en avez un, écrivez-le : Opus le fera contrôler par VIES, le service de '
              + 'la Commission européenne, avant de l’imprimer.'}
        </Text>
      )}

      {/* UN NUMÉRO DÉCLARÉ : le recontrôler SANS le retaper, en écrire un
          autre, ou retirer la déclaration (en deux appuis). */}
      {declaree && !ouvert && (
        <View style={s.boutons}>
          <BtnMini
            outline
            label={enCours === 'controle' ? 'Contrôle auprès de VIES…' : DECLARATION_ECRAN.recontroler}
            onPress={() => controler(preuve.numero)}
            disabled={!!enCours}
            style={s.cible}
          />
          <BtnMini outline label={DECLARATION_ECRAN.autreNumero} onPress={ouvrir} disabled={!!enCours} style={s.cible} />
          {!!onRetirer && (
            <BtnMini
              outline
              label={confirmeRetrait ? DECLARATION_ECRAN.confirmerRetrait : DECLARATION_ECRAN.retirer}
              accessibilityLabel={confirmeRetrait ? DECLARATION_ECRAN.confirmerRetrait : DECLARATION_ECRAN.retirer}
              onPress={retirer}
              disabled={!!enCours}
              style={[s.cible, confirmeRetrait && s.danger]}
            />
          )}
        </View>
      )}

      {!declaree && !ouvert && (
        <BtnMini
          outline
          label={preuve ? DECLARATION_ECRAN.autreNumero : 'Écrire mon numéro de TVA'}
          onPress={ouvrir}
          style={s.cible}
        />
      )}

      {!ouvert && laReponse}

      {ouvert && (
        <View style={s.saisie}>
          <Text style={s.libelle}>N° de TVA intracommunautaire</Text>
          <Field
            value={texte}
            onChangeText={(t) => {
              setTexte(t); setMotif(null); setCoche(false); setMotifDeclaration(null);
              if (reponse) setReponse(null);
            }}
            placeholder="FR 00 123456789"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            maxLength={24}
            returnKeyType="send"
            onSubmitEditing={() => controler()}
            editable={!enCours}
            accessibilityLabel="Numéro de TVA intracommunautaire"
          />
          {!!faute && <Text style={s.erreur}>{faute}</Text>}
          {!faute && !!motif && <Text style={s.erreur} accessibilityLiveRegion="polite">{motif}</Text>}
          {!faute && !motif && !!aide && <Text style={s.note}>{aide}</Text>}
          {!faute && !motif && !texte && <Text style={s.note}>{messageTva('vide').texte}</Text>}
          <BtnMain
            block
            ton="sombre"
            label="Faire contrôler par VIES"
            accessibilityLabel={enCours === 'controle' ? 'Contrôle auprès de VIES en cours' : 'Faire contrôler par VIES'}
            disabled={!!enCours}
            onPress={() => controler()}
          >
            {enCours === 'controle' ? (
              <View style={s.enCours}>
                <ActivityIndicator size="small" color={C.surface} />
                <Text style={s.enCoursTexte}>Contrôle auprès de VIES…</Text>
              </View>
            ) : null}
          </BtnMain>
          {enCours !== 'controle' && (
            <Text style={s.note}>
              Seul ce numéro est envoyé à VIES, depuis les serveurs d’Opus. VIES met souvent
              de 10 à 30 secondes à répondre.
            </Text>
          )}
          {enCours === 'controle' && (
            <Text style={s.note} accessibilityLiveRegion="polite">
              VIES met souvent de 10 à 30 secondes à répondre : la fenêtre attend sa réponse.
            </Text>
          )}
          {api.mode === 'demo' && <Text style={s.demo}>{DECLARATION_ECRAN.demo}</Text>}

          {laReponse}

          {/* LA DÉCLARATION, SOUS LE BOUTON VIES (E-I2), dans un bloc à son
              propre titre. */}
          {offerte && (
            <View style={s.declaration}>
              <Text style={s.declarationTitre} accessibilityRole="header">{DECLARATION_ECRAN.titre}</Text>
              <Text style={s.texte}>{DECLARATION_ECRAN.explication}</Text>
              {!!remplace && <Text style={s.texte}>{remplace}</Text>}
              <Pressable
                onPress={() => { setCoche((v) => !v); setMotifDeclaration(null); }}
                disabled={!!enCours}
                accessibilityRole="checkbox"
                aria-checked={coche}
                accessibilityState={{ checked: coche, disabled: !!enCours }}
                accessibilityLabel={DECLARATION_TVA}
                style={({ pressed }) => [s.caseLigne, pressed && APPUI.discret]}
              >
                <View style={[s.case, coche && s.caseCochee]}>
                  {coche && <Check size={12} color={C.surAccent} />}
                </View>
                <Text style={s.caseTexte}>{DECLARATION_TVA}</Text>
              </Pressable>
              <BtnMain
                block
                label={DECLARATION_ECRAN.bouton}
                accessibilityLabel={enCours === 'declaration' ? DECLARATION_ECRAN.boutonEnCours : DECLARATION_ECRAN.bouton}
                disabled={!!enCours}
                onPress={declarer}
              >
                {enCours === 'declaration' ? (
                  <View style={s.enCours}>
                    <ActivityIndicator size="small" color={C.surAccent} />
                    <Text style={s.enCoursTexteClair}>{DECLARATION_ECRAN.boutonEnCours}</Text>
                  </View>
                ) : null}
              </BtnMain>
              {!!motifDeclaration && <Text style={s.motif} accessibilityLiveRegion="polite">{motifDeclaration}</Text>}
            </View>
          )}

          <BtnMini outline label="Annuler" onPress={fermer} disabled={!!enCours} style={s.cible} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { gap: S.sm },
  saisie: { gap: S.sm },
  ligne: { gap: S.xs },
  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
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
  /* UNE RÉUSSITE EN VERT (reconnu, déclaré, retiré) : le filet `C.ok`, un
     élément graphique — 5,4 : 1 sur le blanc —, le texte en encre. */
  reussite: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.ok, paddingLeft: S.sm,
  },
  /* UNE NOTE NEUTRE (déjà publié, déjà reconnu, plus rien à retirer). */
  noteReponse: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.line, paddingLeft: S.sm,
  },
  /* Ce qui manque pour déclarer : dit en rouge, sans vibration. */
  motif: { fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant) },
  enCours: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  enCoursTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surface },
  enCoursTexteClair: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surAccent },
  cible: { minHeight: TOUCHE, borderRadius: R.gelule },
  danger: { borderColor: C.bad },
  /* LE BLOC DE LA DÉCLARATION : de la STRUCTURE (angle vif), encadré, sous
     le bouton VIES. */
  declaration: {
    gap: S.sm, padding: S.md, marginTop: S.xs, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface,
  },
  declarationTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  /* La case : la RANGÉE ENTIÈRE est la cible, 44 points au moins. Le carré
     est de la structure (angle vif), comme celle de `PasserProScreen`. */
  caseLigne: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, minHeight: TOUCHE },
  case: {
    width: S.xl - S.xs, height: S.xl - S.xs, borderWidth: 1, borderColor: C.bordChamp,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  caseCochee: { backgroundColor: C.accent, borderColor: C.accent },
  caseTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
});
