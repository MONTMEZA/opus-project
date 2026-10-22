/**
 * L'EN-TÊTE DE LA SAISIE D'UN DEVIS — le bandeau, le régime de TVA, « Pour
 * qui ? », l'objet, le lieu des travaux, le délai (lot 1, 22/10/2026).
 *
 * UN COMPOSANT À LUI, POSÉ COMME UN ÉLÉMENT dans la liste des lignes
 * (`ListHeaderComponent={entete}`), jamais une fonction écrite dans le rendu
 * de l'écran : elle serait un TYPE de composant neuf à chaque rendu, React
 * la démonterait et la remonterait, et le champ en cours de frappe perdrait
 * le focus — le piège que `ClientsScreen` évite déjà.
 *
 * IL TIENT SON PROPRE ÉTAT ET NE REMONTE QU'À LA FIN D'UNE SAISIE : un champ
 * quitté (`onBlur`), une suggestion d'adresse choisie, un appui (le délai par
 * défaut). `ChampVille` n'a pas d'`onBlur` et remonte CHAQUE lettre — c'est
 * ce composant-ci qui absorbe ces appels : il est petit, l'écran entier ne se
 * redessine pas. `ChampVille` n'est pas modifié (six écrans et
 * `verifier-adresse` en dépendent).
 *
 * L'écran le LIT aussi (`lire()`, `enregistrer()`) au moment où l'on ouvre
 * une carte et à la garde de sortie : un lieu tapé sans choisir de
 * suggestion, puis l'écran quitté, ne doit pas se perdre.
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState,
} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  C, F, T, S, interligne,
} from '../theme';
import { BtnOutline, HazardStrip, Pastille } from './ui';
import ChampLocal from './ChampLocal';
import ChampVille from './ChampVille';
import { libelleBudget } from '../data/annonces';
import {
  DELAI_PAR_DEFAUT, LONGUEURS, avertissementDelai, origineLisible,
} from '../lib/devis';

/** Le texte du bandeau, une fois : `verifier-devis` le cherche ici. */
export const BANDEAU_CHIFFRAGE = 'Chiffrage — ce brouillon ne part pas encore.';

const texte = (v) => (v == null ? '' : String(v));

const EnteteDevis = forwardRef(function EnteteDevis({
  devis, client = null, avisRegime = null, erreurs = {}, phraseLieu = null,
  onEnregistrer, onChoisirClient, onNouveauClient, onMonEntreprise, onRelireRegime,
}, ref) {
  /* Le lieu, tenu ICI : `ChampVille` remonte chaque lettre, et l'écran n'a
     pas à le savoir. */
  const [lieu, setLieu] = useState({
    lieuAdresse: texte(devis.lieuAdresse),
    lieuCodePostal: texte(devis.lieuCodePostal),
    lieuVille: texte(devis.lieuVille),
  });
  const lieuVif = useRef(lieu);
  const [avertissement, setAvertissement] = useState(() => avertissementDelai(devis.delaiExecution));
  const refObjet = useRef(null);
  const refDelai = useRef(null);
  const refCp = useRef(null);
  const refVille = useRef(null);

  const poserLieu = (v) => {
    lieuVif.current = { ...lieuVif.current, ...v };
    setLieu(lieuVif.current);
  };

  /* Ce que l'en-tête porte À CET INSTANT, champs ouverts compris. */
  const lire = () => ({
    objet: refObjet.current ? refObjet.current.lire() : texte(devis.objet),
    delaiExecution: refDelai.current ? refDelai.current.lire() : texte(devis.delaiExecution),
    lieuAdresse: lieuVif.current.lieuAdresse,
    lieuCodePostal: refCp.current ? refCp.current.lire() : lieuVif.current.lieuCodePostal,
    lieuVille: refVille.current ? refVille.current.lire() : lieuVif.current.lieuVille,
  });

  useImperativeHandle(ref, () => ({
    lire,
    /** Tout ce qui est tapé, envoyé d'un coup (la carte qui s'ouvre, la garde). */
    enregistrer: () => onEnregistrer(lire()),
    /** L'adresse du client PROPOSÉE comme lieu (le lieu était vide). */
    poserLieu: (v) => {
      poserLieu({
        lieuAdresse: texte(v.lieuAdresse), lieuCodePostal: texte(v.lieuCodePostal), lieuVille: texte(v.lieuVille),
      });
      if (refCp.current) refCp.current.ecrire(texte(v.lieuCodePostal));
      if (refVille.current) refVille.current.ecrire(texte(v.lieuVille));
    },
  }));

  const enregistrerLieu = () => {
    const l = lire();
    onEnregistrer({ lieuAdresse: l.lieuAdresse, lieuCodePostal: l.lieuCodePostal, lieuVille: l.lieuVille });
  };

  /* Chaque champ refusé a SA phrase, et elle reste tant qu'il est refusé :
     enregistrer un AUTRE champ ne l'efface plus (relecture « données » des
     étapes 4 à 7, I1). */
  const sous = (champ) => (erreurs && erreurs[champ]
    ? <Text style={s.erreur} accessibilityLiveRegion="polite">{erreurs[champ]}</Text> : null);

  const origine = origineLisible(devis);
  const budget = devis.demande && devis.demande.budget ? libelleBudget(devis.demande.budget) : null;

  return (
    <View style={s.boite}>
      {/* LE BANDEAU — et il DÉFILE avec l'en-tête : chaque point de hauteur
          fixe se paie sur un iPhone SE. Un demi-produit qui s'annonce vaut
          mieux qu'un document qui a l'air conforme. */}
      <View style={s.bandeau}>
        <HazardStrip height={5} />
        <Text style={s.bandeauTexte} accessibilityRole="header">{BANDEAU_CHIFFRAGE}</Text>
        {!!origine && <Text style={s.origine}>{origine}</Text>}
        {/* Le budget est un TEXTE écrit par le client : il ne sert à aucun
            calcul, et ne s'additionne à rien. */}
        {!!budget && <Text style={s.origine}>{`Budget indiqué par le client : ${budget}`}</Text>}
      </View>

      {/* LE RÉGIME DE TVA, en trois messages DISTINCTS. Un échec de lecture
          n'est JAMAIS « non déclaré » : un artisan en franchise à qui l'on
          dirait de déclarer un régime qu'il a déclaré cesserait de croire
          l'écran. Pendant la lecture, rien. */}
      {!!avisRegime && avisRegime.type === 'echec' && (
        <View style={s.avis}>
          <Text style={s.avisTexte}>
            Votre régime de TVA n’a pas pu être lu. Les taux attendent : réessayez dans un instant.
          </Text>
          <BtnOutline label="Réessayer" onPress={onRelireRegime} />
        </View>
      )}
      {!!avisRegime && avisRegime.type !== 'echec' && (
        <View style={s.avis}>
          <Text style={s.avisTexte}>{avisRegime.phrase}</Text>
          <BtnOutline label="Mon entreprise" accessibilityLabel="Ouvrir Mon entreprise, section TVA" onPress={onMonEntreprise} />
        </View>
      )}

      <Text style={s.titre} accessibilityRole="header">Pour qui ?</Text>
      <Text style={s.client}>
        {client && client.nom ? `${client.nom}${client.ville ? ` · ${client.ville}` : ''}` : 'À choisir'}
      </Text>
      <View style={s.deux}>
        <View style={s.moitie}>
          <BtnOutline label="Choisir dans mon carnet" onPress={onChoisirClient} />
        </View>
        <View style={s.moitie}>
          <BtnOutline label="Nouveau client" onPress={onNouveauClient} />
        </View>
      </View>
      {sous('clientId')}

      <Text style={s.titre}>Objet</Text>
      <ChampLocal
        ref={refObjet}
        defaut={texte(devis.objet)}
        placeholder="Rénovation de la salle de bains"
        maxLength={LONGUEURS.objet}
        accessibilityLabel="Objet du devis"
        returnKeyType="done"
        onBlur={() => onEnregistrer({ objet: refObjet.current ? refObjet.current.lire() : '' })}
      />
      {sous('objet')}

      <Text style={s.titre}>Lieu des travaux</Text>
      {/* La liste montre l'adresse ENTIÈRE : la Base Adresse ne dit jamais
          « introuvable », elle rend une AUTRE adresse — on lit, et on sait.
          Un choix remplit les trois cases, et s'enregistre aussitôt. */}
      <ChampVille
        type="rue"
        placeholder="4 rue des Lilas"
        valeur={lieu.lieuAdresse}
        maxLength={LONGUEURS.lieuAdresse}
        onChange={(l) => {
          const choisi = !!(l && (l.codePostal || l.ville));
          poserLieu({
            lieuAdresse: (l && (l.rue || l.affichage)) || '',
            lieuCodePostal: (l && l.codePostal) || lieuVif.current.lieuCodePostal,
            lieuVille: (l && l.ville) || lieuVif.current.lieuVille,
          });
          if (choisi) {
            if (refCp.current) refCp.current.ecrire(lieuVif.current.lieuCodePostal);
            if (refVille.current) refVille.current.ecrire(lieuVif.current.lieuVille);
            enregistrerLieu();
          }
        }}
      />
      {sous('lieuAdresse')}
      {!!phraseLieu && <Text style={s.aide}>{phraseLieu}</Text>}
      <View style={s.deux}>
        <View style={s.cp}>
          <Text style={s.etiquette}>Code postal</Text>
          {/* LE PAVÉ NUMÉRIQUE, comme le code postal du carnet de clients
              (`FicheClient`) : cinq chiffres ne se tapent pas sur le clavier
              des lettres (relecture « écran » des étapes 4 à 7, C1). Il n'a
              pas de touche retour — d'où aucun `returnKeyType` : on quitte le
              champ en touchant ailleurs, et le lieu s'enregistre. C'est la
              SEULE exception à « `keyboardType` seulement dans
              `ChampMontant` », et `verifier-devis` la nomme. */}
          <ChampLocal
            ref={refCp}
            defaut={lieu.lieuCodePostal}
            placeholder="13350"
            keyboardType="number-pad"
            maxLength={5}
            accessibilityLabel="Code postal du lieu des travaux"
            onBlur={enregistrerLieu}
          />
        </View>
        <View style={s.ville}>
          <Text style={s.etiquette}>Ville</Text>
          <ChampLocal
            ref={refVille}
            defaut={lieu.lieuVille}
            placeholder="Charleval"
            maxLength={LONGUEURS.lieuVille}
            accessibilityLabel="Ville du lieu des travaux"
            returnKeyType="done"
            onBlur={enregistrerLieu}
          />
        </View>
      </View>
      {sous('lieuCodePostal')}
      {sous('lieuVille')}

      <Text style={s.titre}>Délai d’exécution</Text>
      <ChampLocal
        ref={refDelai}
        defaut={texte(devis.delaiExecution)}
        placeholder="Du 12 au 20 novembre"
        maxLength={LONGUEURS.delaiExecution}
        accessibilityLabel="Délai d’exécution"
        returnKeyType="done"
        onBlur={() => {
          const t = refDelai.current ? refDelai.current.lire() : '';
          setAvertissement(avertissementDelai(t));
          onEnregistrer({ delaiExecution: t });
        }}
      />
      {sous('delaiExecution')}
      <View style={s.appui}>
        <Pastille
          label={DELAI_PAR_DEFAUT.texte}
          onPress={() => {
            if (refDelai.current) refDelai.current.ecrire(DELAI_PAR_DEFAUT.texte);
            setAvertissement(null);
            onEnregistrer({ delaiExecution: DELAI_PAR_DEFAUT.texte });
          }}
        />
      </View>
      <Text style={s.aide}>{DELAI_PAR_DEFAUT.pourquoi}</Text>
      {/* Un avertissement, JAMAIS un refus : la seule règle plus stricte que
          la loi que garde Opus est la relecture annuelle du SIRET. */}
      {!!avertissement && <Text style={s.avertissement}>{avertissement}</Text>}
    </View>
  );
});

export default EnteteDevis;

const s = StyleSheet.create({
  boite: { gap: S.xs },
  /* Le bandeau est de la STRUCTURE : angle vif. */
  bandeau: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, marginBottom: S.md },
  bandeauTexte: {
    fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink,
    paddingHorizontal: S.md, paddingTop: S.md, paddingBottom: S.xs,
  },
  origine: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
    paddingHorizontal: S.md, paddingBottom: S.sm,
  },
  avis: {
    backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.accentTexte,
    padding: S.md, gap: S.sm, marginBottom: S.md,
  },
  avisTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  titre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.md },
  client: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, marginBottom: S.xs },
  deux: { flexDirection: 'row', gap: S.sm },
  moitie: { flex: 1, minWidth: 0 },
  cp: { width: 112 },
  ville: { flex: 1, minWidth: 0 },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.sm, marginBottom: S.xs },
  appui: { flexDirection: 'row', flexWrap: 'wrap', marginTop: S.sm },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  avertissement: {
    fontFamily: F.inter6, fontSize: T.petit, color: C.accentTexte, lineHeight: interligne(T.petit), marginTop: S.xs,
  },
  /* Une erreur en `C.bad` sur la carte blanche, pas sur le beige du fond :
     5,56 : 1 contre 4,37. D'où le fond blanc posé sous le texte. */
  erreur: {
    fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit),
    backgroundColor: C.surface, padding: S.xs,
  },
});
