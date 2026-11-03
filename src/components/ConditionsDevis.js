/**
 * LA CARTE « CONDITIONS » D'UN DEVIS — la réduction, l'acompte, la
 * validité, la retenue de garantie (lot 2a, 03/11/2026).
 *
 * ELLE EST FAITE EXACTEMENT COMME LA CARTE D'UNE LIGNE (`CarteLigne`) :
 * posée au-dessus de la liste, elle prend l'écran ; sa barre est en HAUT,
 * fixe, hors du défilement (« ‹ Devis » enregistre et ferme), et le contenu
 * défile avec `CLAVIER` — sous le clavier de l'iPhone, une barre du bas
 * serait cachée pendant qu'on tape. Une carte, pas une `Modal` : la saisie
 * tient UN état de carte (`carte`), et il n'y en a jamais deux.
 *
 * QUAND ELLE ENREGISTRE : un champ quitté ; une PASTILLE touchée (une unité,
 * une nature, une durée) ; la carte fermée. À chaque fois, elle LIT tous ses
 * champs (`lire()`) : une pastille touchée pendant qu'on tape le montant
 * enregistre aussi le montant.
 *
 * LES PAIRES PARTENT ENSEMBLE (relecture BASE-2) : la réduction pose ses
 * DEUX colonnes en une écriture (`remiseCentiemes` ou `remiseCentimes`,
 * l'autre à `null`) ; l'acompte aussi, avec sa nature. Changer l'unité ne
 * passe donc jamais par un état que la base refuse (les deux formes à la
 * fois).
 *
 * LES MONTANTS AFFICHÉS SONT CEUX DE LA BASE (`totaux`, relus après chaque
 * écriture) : la carte ne calcule rien. Une réduction ou un acompte plus
 * grand que le total n'est jamais refusé — il est RAMENÉ, et la carte le dit.
 *
 * Ce qui ne se lit pas (« 12,5,3 ») n'est pas envoyé : `lire()` le rend dans
 * `erreurs`, avec le TEXTE tapé (`textes`), que la saisie garde pour qu'une
 * carte rouverte par « Corriger » le montre encore.
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState,
} from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import { Pastille, Interrupteur, Montant } from './ui';
import ChampMontant from './ChampMontant';
import { CLAVIER } from '../lib/clavier';
import {
  NATURES_ACOMPTE, VALIDITES_PROPOSEES, PHRASE_RETENUE,
  AIDE_NATURE_ACOMPTE, ECHEANCE_ACOMPTE, AIDE_REDUCTION, AIDE_ACOMPTE, AIDE_VALIDITE,
  versPourcentDeDevis, versMontantDeDevis, versJours, versCentiemes, centiemesEnSaisie, centimesEnSaisie,
  rangeesDesTotaux, effetDeLaReduction, effetDeLAcompte, libelleAcompte,
} from '../lib/devis';

const present = (v) => v !== null && v !== undefined;

/* Le texte d'un champ à l'ouverture : celui que la saisie a gardé (un texte
   refusé, rouvert par « Corriger »), sinon la valeur enregistrée. */
const texteDe = (textes, cle, valeur) => (textes && present(textes[cle]) ? textes[cle] : valeur);

const ConditionsDevis = forwardRef(function ConditionsDevis({
  devis = {}, totaux = null, regime, nbOptions = 0, erreurs = {}, textes = null,
  onEnregistrer, onFermer,
}, ref) {
  const refReduction = useRef(null);
  const refAcompte = useRef(null);
  const refValidite = useRef(null);
  const refRetenue = useRef(null);

  /* Les choix faits d'un appui : une RÉFÉRENCE (lue par `lire()` dans la
     même boucle que l'appui) ET un état (pour le dessin). */
  const [initial] = useState(() => ({
    uniteReduction: present(devis.remiseCentimes) ? 'montant' : 'pourcent',
    uniteAcompte: present(devis.acompteCentimes) ? 'montant' : 'pourcent',
    nature: devis.acompteNature ?? null,
    validite: present(devis.validiteJours) && VALIDITES_PROPOSEES.includes(devis.validiteJours) ? devis.validiteJours : null,
    validiteAutre: present(devis.validiteJours) && !VALIDITES_PROPOSEES.includes(devis.validiteJours),
    retenue: present(devis.retenueGarantieCentiemes),
  }));
  const choix = useRef(initial);
  const [c, setC] = useState(initial);
  const poser = (x) => { choix.current = { ...choix.current, ...x }; setC(choix.current); };

  /* TOUT CE QUE LA CARTE PORTE À CET INSTANT : `changements` (les paires
     entières), `erreurs` (ce qui ne se lit pas, champ par champ, avec sa
     phrase) et `textes` (ce qui est tapé). */
  const lire = () => {
    /* Les choix DU MOMENT, pas ceux du dernier rendu : un appui pose son
       choix PUIS enregistre, dans la même boucle. */
    const c = choix.current;
    const changements = {};
    const fautes = {};
    const tapes = {};
    const lu = (r) => (r.current ? r.current.lire() : '');

    tapes.reduction = lu(refReduction);
    if (c.uniteReduction === 'montant') {
      const r = versMontantDeDevis(tapes.reduction);
      if (r.ok) Object.assign(changements, { remiseCentimes: r.centimes, remiseCentiemes: null });
      else fautes.remiseCentimes = r.message;
    } else {
      const r = versPourcentDeDevis(tapes.reduction);
      if (r.ok) Object.assign(changements, { remiseCentiemes: r.centiemes, remiseCentimes: null });
      else fautes.remiseCentiemes = r.message;
    }

    tapes.acompte = lu(refAcompte);
    let acompteLu = false;
    if (c.uniteAcompte === 'montant') {
      const r = versMontantDeDevis(tapes.acompte);
      if (r.ok) { Object.assign(changements, { acompteCentimes: r.centimes, acompteCentiemes: null }); acompteLu = r.centimes !== null; }
      else fautes.acompteCentimes = r.message;
    } else {
      const r = versPourcentDeDevis(tapes.acompte);
      if (r.ok) { Object.assign(changements, { acompteCentiemes: r.centiemes, acompteCentimes: null }); acompteLu = r.centiemes !== null; }
      else fautes.acompteCentiemes = r.message;
    }
    /* La nature part AVEC l'acompte ; retirer l'acompte la vide dans la même
       écriture (une nature sans acompte ne veut rien dire). */
    if (!fautes.acompteCentimes && !fautes.acompteCentiemes) {
      changements.acompteNature = acompteLu ? c.nature : null;
    }

    if (c.validiteAutre) {
      tapes.validite = lu(refValidite);
      const r = versJours(tapes.validite);
      if (r.ok) changements.validiteJours = r.jours;
      else fautes.validiteJours = r.message;
    } else {
      changements.validiteJours = c.validite;
    }

    if (c.retenue) {
      /* L'interrupteur vient d'être allumé : le champ n'est pas encore
         monté. Il naît avec la valeur enregistrée, ou 5 % — c'est celle-là
         qui part. */
      tapes.retenue = refRetenue.current ? refRetenue.current.lire()
        : (present(devis.retenueGarantieCentiemes) ? centiemesEnSaisie(devis.retenueGarantieCentiemes) : '5');
      const r = versCentiemes(tapes.retenue);
      if (r.ok) changements.retenueGarantieCentiemes = r.centiemes;
      else fautes.retenueGarantieCentiemes = r.message;
    } else {
      changements.retenueGarantieCentiemes = null;
    }
    return { changements, erreurs: fautes, textes: tapes };
  };

  const enregistrer = () => {
    const l = lire();
    if (onEnregistrer) onEnregistrer(l.changements, l.erreurs, l.textes);
  };
  useImperativeHandle(ref, () => ({ lire, enregistrer }));

  /* Un APPUI change un choix, PUIS la carte s'enregistre entière. */
  const choisir = (x) => { poser(x); enregistrer(); };

  const sous = (...cles) => {
    const cle = cles.find((k) => erreurs && erreurs[k]);
    return cle ? <Text style={s.erreur} accessibilityLiveRegion="polite">{erreurs[cle]}</Text> : null;
  };

  const rangees = rangeesDesTotaux(totaux, regime, { devis, nbOptions });
  const total = rangees.find((r) => r.cle === 'total');
  const reste = rangees.find((r) => r.cle === 'reste');
  const effetR = effetDeLaReduction(totaux, devis, regime);
  const effetA = effetDeLAcompte(totaux, devis, regime);

  return (
    /* MODALE pour VoiceOver, comme la carte d'une ligne : sous elle, la
       liste, le pied et les bandes sont cachés. */
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer les conditions et revenir au devis"
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>‹ Devis</Text>
        </Pressable>
        <View style={s.milieu} accessibilityLabel={[total && total.aDire, reste && reste.aDire].filter(Boolean).join('. ')}>
          <Text style={s.barreTitre} numberOfLines={1}>Conditions</Text>
          {!!total && <Montant centimes={total.centimes} style={s.barreMontant} />}
          {!!reste && (
            <Text style={s.barreReste} numberOfLines={1}>
              {'Reste à payer '}
              <Montant centimes={reste.centimes} enLigne style={s.barreReste} />
            </Text>
          )}
        </View>
        <View style={s.place} />
      </View>

      <ScrollView {...CLAVIER} keyboardDismissMode="on-drag" contentContainerStyle={s.contenu}>
        {/* LA RÉDUCTION — « Réduction », en % ou en € (décision du 03/11). */}
        <Text style={s.titre} accessibilityRole="header">Réduction</Text>
        <View style={s.pastilles}>
          <Pastille label="%" nom="Réduction en pourcentage" choisie={c.uniteReduction === 'pourcent'}
            onPress={() => choisir({ uniteReduction: 'pourcent' })} />
          <Pastille label="€" nom="Réduction en euros" choisie={c.uniteReduction === 'montant'}
            onPress={() => choisir({ uniteReduction: 'montant' })} />
        </View>
        <ChampMontant
          ref={refReduction}
          defaut={texteDe(textes, 'reduction', c.uniteReduction === 'montant'
            ? centimesEnSaisie(devis.remiseCentimes) : centiemesEnSaisie(devis.remiseCentiemes))}
          placeholder={c.uniteReduction === 'montant' ? 'Montant en euros' : 'Pourcentage'}
          accessibilityLabel={c.uniteReduction === 'montant' ? 'Réduction, en euros' : 'Réduction, en pour cent'}
          onBlur={enregistrer}
        />
        {sous('remiseCentiemes', 'remiseCentimes')}
        {!!effetR && <Text style={effetR.ramenee ? s.ramene : s.aide}>{effetR.aDire}</Text>}
        <Text style={s.aide}>{AIDE_REDUCTION}</Text>

        {/* L'ACOMPTE — au choix % ou €, et sa NATURE, sans défaut. */}
        <Text style={s.titre} accessibilityRole="header">Acompte</Text>
        <View style={s.pastilles}>
          <Pastille label="%" nom="Acompte en pourcentage" choisie={c.uniteAcompte === 'pourcent'}
            onPress={() => choisir({ uniteAcompte: 'pourcent' })} />
          <Pastille label="€" nom="Acompte en euros" choisie={c.uniteAcompte === 'montant'}
            onPress={() => choisir({ uniteAcompte: 'montant' })} />
        </View>
        <ChampMontant
          ref={refAcompte}
          defaut={texteDe(textes, 'acompte', c.uniteAcompte === 'montant'
            ? centimesEnSaisie(devis.acompteCentimes) : centiemesEnSaisie(devis.acompteCentiemes))}
          placeholder={c.uniteAcompte === 'montant' ? 'Montant en euros' : 'Pourcentage'}
          accessibilityLabel={c.uniteAcompte === 'montant' ? 'Acompte, en euros' : 'Acompte, en pour cent'}
          onBlur={enregistrer}
        />
        {sous('acompteCentiemes', 'acompteCentimes')}
        {!!effetA && <Text style={effetA.ramene ? s.ramene : s.aide}>{effetA.aDire}</Text>}
        <Text style={s.aide}>{AIDE_ACOMPTE}</Text>
        <Text style={s.etiquette}>Acompte ou arrhes ?</Text>
        <View style={s.pastilles}>
          {NATURES_ACOMPTE.map((n) => (
            <Pastille key={n} label={libelleAcompte(n)} nom={`C’est ${n === 'arrhes' ? 'des arrhes' : 'un acompte'}`}
              choisie={c.nature === n} onPress={() => choisir({ nature: n })} />
          ))}
        </View>
        {sous('acompteNature')}
        <Text style={s.aide}>{AIDE_NATURE_ACOMPTE}</Text>
        <Text style={s.aide}>{ECHEANCE_ACOMPTE}</Text>

        {/* LA VALIDITÉ — 15, 30, 60, 90 jours ou « Autre » ; RIEN de
            pré-choisi : la durée se confirme d'un appui (décision du 03/11). */}
        <Text style={s.titre} accessibilityRole="header">Validité de l’offre</Text>
        <View style={s.pastilles}>
          {VALIDITES_PROPOSEES.map((j) => (
            <Pastille key={j} label={`${j} jours`} nom={`Valable ${j} jours`}
              choisie={!c.validiteAutre && c.validite === j}
              onPress={() => choisir({ validite: c.validite === j && !c.validiteAutre ? null : j, validiteAutre: false })} />
          ))}
          <Pastille label="Autre" nom="Une autre durée de validité" choisie={c.validiteAutre}
            onPress={() => choisir({ validiteAutre: !c.validiteAutre, validite: null })} />
        </View>
        {c.validiteAutre && (
          <ChampMontant
            ref={refValidite}
            defaut={texteDe(textes, 'validite', present(devis.validiteJours) ? String(devis.validiteJours) : '')}
            placeholder="Nombre de jours"
            accessibilityLabel="Durée de validité, en jours"
            onBlur={enregistrer}
            maxLength={4}
          />
        )}
        {sous('validiteJours')}
        <Text style={s.aide}>{AIDE_VALIDITE}</Text>

        {/* LA RETENUE DE GARANTIE — elle vivait dans le bas de la liste ;
            toutes les conditions sont maintenant au même endroit. */}
        <Text style={s.titre} accessibilityRole="header">Retenue de garantie</Text>
        <Interrupteur
          actif={c.retenue}
          libelle="Retenue de garantie"
          /* JAMAIS LA DURÉE SANS SA RÉSERVE (loi n° 71-584, art. 2) : « rendus
             un an après » promettrait à l'artisan un remboursement que le
             client peut bloquer. */
          aide={'Au plus 5 % des acomptes, rendus un an après la réception des travaux, sauf si le client '
            + 'notifie une opposition motivée.'}
          onPress={() => choisir({ retenue: !c.retenue })}
        />
        {c.retenue && (
          <>
            <Text style={s.etiquette}>Taux de la retenue (%)</Text>
            <ChampMontant
              ref={refRetenue}
              defaut={texteDe(textes, 'retenue', present(devis.retenueGarantieCentiemes)
                ? centiemesEnSaisie(devis.retenueGarantieCentiemes) : '5')}
              placeholder="5"
              accessibilityLabel="Taux de la retenue de garantie, en pour cent"
              onBlur={enregistrer}
            />
            {sous('retenueGarantieCentiemes')}
            {/* La phrase de la loi, SANS AUCUN MONTANT : l'assiette de la
                retenue est une question posée au juriste. */}
            <Text style={s.aide}>{PHRASE_RETENUE}</Text>
          </>
        )}

        {/* CE QUE LE DEVIS DIRA — les rangées de la BASE, dites comme la
            ventilation du bas : la réduction se lit en montant POSITIF. */}
        {rangees.length > 0 && (
          <View style={s.recap}>
            {rangees.map((r) => (
              <View key={r.cle} style={s.rangee} accessible accessibilityLabel={r.aDire}>
                <Text style={r.fort ? s.libelleFort : s.libelle}>
                  {r.libelle}
                  {r.base != null && <Text>{' '}<Montant centimes={r.base} enLigne style={s.libelle} /></Text>}
                </Text>
                <Text style={r.fort ? s.libelleFort : s.libelle}>
                  {r.moins ? '− ' : ''}
                  <Montant centimes={r.centimes} enLigne fort={!!r.fort} />
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

export default ConditionsDevis;

const s = StyleSheet.create({
  /* Elle PREND L'ÉCRAN, comme la carte d'une ligne. */
  ecran: { ...StyleSheet.absoluteFillObject, backgroundColor: C.surface, zIndex: 20 },
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.sm, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  retour: { minHeight: TOUCHE, minWidth: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm },
  retourTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  milieu: { flex: 1, minWidth: 0, alignItems: 'center' },
  barreTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  barreMontant: { fontSize: T.petit, color: C.ink, textAlign: 'center' },
  barreReste: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },
  place: { minWidth: TOUCHE },
  contenu: { padding: S.lg, paddingBottom: S.xxl * 3, gap: S.xs },
  titre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.lg },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.md, marginBottom: S.xs },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs, marginBottom: S.xs },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* Une demande RAMENÉE au total : de l'encre, pas le rouge des refus — rien
     n'est refusé, la phrase dit ce que le devis portera. */
  ramene: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit), marginTop: S.xs },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit), marginTop: S.xs },
  recap: { marginTop: S.xl, gap: S.xs, borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.md },
  rangee: { flexDirection: 'row', justifyContent: 'space-between', gap: S.sm },
  libelle: { flexShrink: 1, fontFamily: F.inter, fontSize: T.petit, color: C.ink },
  libelleFort: { flexShrink: 1, fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
});
