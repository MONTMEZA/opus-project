/**
 * LA CARTE « ÉNERGIE ET LABEL RGE » D'UN DEVIS (étape 2b-6, cahier §3.8,
 * annexe A.3, 24/11/2026).
 *
 * CE QUE LA LOI DEMANDE (C. conso. L. 224-114 et L. 224-115) : quand un
 * professionnel propose à un client qui commande à titre privé des travaux
 * d'économies d'énergie ou d'énergie renouvelable dans un logement, le devis
 * doit dire s'il détient un label RGE « pour les catégories de travaux
 * concernés », et s'il fera faire tout ou partie des travaux par une autre
 * entreprise — laquelle, et si elle-même détient un label. Sans ces
 * informations, le contrat est nul (L. 242-51).
 *
 * ELLE EST FAITE EXACTEMENT COMME « DÉCHETS DU CHANTIER » (`DechetsDevis.js`) :
 * une carte posée au-dessus de la liste, qui prend l'écran ; sa barre en
 * HAUT, fixe (« ‹ Devis » enregistre et ferme) ; sa ligne d'état réservée
 * dessous (la carte couvre les bandes du bas : elle dit elle-même l'envoi et
 * l'échec) ; un contenu qui défile avec `CLAVIER`. Une valeur de plus de
 * l'état UNIQUE `carte` de la saisie (`CARTE_ENERGIE`), jamais une `Modal`.
 * Elle n'a AUCUN champ tapé : chaque appui écrit, comme « Le chantier ».
 *
 * LA VOIE UNIQUE (le modèle de `etatInitialDechets` → `poser` →
 * `lireDechets`) : l'état de départ vient de `etatInitialEnergie` (`devis.js`,
 * que `verifier-devis` fait tourner) — il ne lit QUE les quatre champs du
 * devis : jamais son origine, jamais son objet, jamais les signes de qualité
 * de « Mon entreprise » (un devis venu d'une urgence « isolation des
 * combles », chez un artisan dont un label couvre les combles, ne coche
 * rien : CTL-10). Un APPUI pose son choix (`poser`, dans un gestionnaire
 * d'appui NOMMÉ, jamais dans un `useEffect`), puis la carte se lit ENTIÈRE
 * (`lireEnergie`) et s'enregistre. Les tableaux posés sont toujours NEUFS
 * (les fonctions d'appui de `devis.js` les fabriquent).
 *
 * L'ORDRE DES BLOCS (§3.8) — et pourquoi « Aucun de ces travaux » est EN
 * TÊTE (ÉCRAN-3) : dix-neuf cases font plus d'un écran d'iPhone ; posée après
 * elles, la réponse la plus fréquente serait hors de l'écran à l'ouverture.
 * Elle est donc JUSTE SOUS la question, avant les cases ; les rubriques du
 * label et de la sous-traitance tombent DESSOUS, et rien au-dessus ne bouge :
 *   1. l'introduction (et, par prudence, la phrase d'une association ou
 *      d'une réponse « à quel titre » vide ; pour un client « entreprise »,
 *      la seule phrase qui dit que la loi ne demande rien — rien d'autre ne
 *      s'affiche, RIEN n'est effacé) ;
 *   2. la question, la pastille « Aucun de ces travaux » et ses phrases, puis
 *      les dix-neuf cases ;
 *   3. « Votre label RGE », dès qu'une case est cochée : pour CHAQUE travail
 *      coché, la phrase de son état (`etatsDesTravaux`, la SEULE écriture de
 *      la règle) ; sous un travail expiré ou absent, la case « Je ne détiens
 *      pas de label RGE pour ces travaux » (`declarationMontree`) ;
 *   4. « Sous-traitance », dès qu'une case est cochée : « Non » · « Oui »,
 *      rien de choisi ; sous « Oui », une case par sous-traitant rangé ;
 *   5. l'aide de la loi et l'amende (réponse P14).
 *
 * TROIS RÈGLES, et aucune n'est cosmétique :
 *   - JAMAIS DE TABLEAU VIDE : la dernière case décochée écrit VIDE DE
 *     VALEUR (`travauxApresAppui`, `sansLabelApresAppui`,
 *     `sousTraitantsApresAppui`) ; « Aucun de ces travaux » est EXCLUSIVE et
 *     s'ANNONCE quand elle retire des cases (« un champ qui change sans geste
 *     doit s'annoncer ») ;
 *   - RIEN N'EST EFFACÉ SANS LE DOIGT SUR CETTE RUBRIQUE (T23) : toucher un
 *     travail ne touche ni les déclarations ni les sous-traitants ; « Non » à
 *     la sous-traitance garde les sous-traitants cochés ; un sous-traitant
 *     choisi ne s'efface qu'en touchant une case, sur une liste LUE ;
 *   - LES DEUX LISTES ONT QUATRE ÉTATS (`etatDesLieux`, la règle des lieux de
 *     2b-5) : en lecture, rien n'est dit ; en échec, la phrase et
 *     « Réessayer » ; vide, la phrase ; lue, les cases. Sur une liste de
 *     signes de qualité EN LECTURE OU EN ÉCHEC, ni la phrase d'état d'un
 *     travail ni une case de déclaration NON COCHÉE ne se montrent : on ne
 *     sait pas ce qui est couvert (ÉCRAN-10). Une case déjà cochée, si : on
 *     doit pouvoir la décocher.
 *
 * LES DEUX PORTES (« Mes signes de qualité », « Mes sous-traitants ») :
 * la carte s'ENREGISTRE d'abord, puis la saisie ouvre « Mon entreprise » sur
 * la section voulue ; à la fermeture, les listes reviennent par les props,
 * et la carte — restée ouverte — montre ce qui vient d'être rangé.
 *
 * OUVERTE DEPUIS « POUR LE REMETTRE » : SUR la rubrique que vise le point
 * (`rubriqueInitiale` : la question, le label, la sous-traitance), et son
 * retour dit « ‹ Liste ». Le défilement se pose UNE fois, à la mise en page
 * du titre visé — un enfant DIRECT du contenu défilant.
 *
 * TOUS LES MOTS VIENNENT DE `devis.js` (`LE_LABEL`, `phraseDuTravail`,
 * `introductionDeLEnergie`), d'`emetteur.js` (le libellé d'un travail, le
 * SIRET et l'état d'un sous-traitant) et de `travaux-energie.js` (les
 * exemples d'un travail) : la carte ne compose aucune phrase.
 */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import {
  Pastille, Interrupteur, BtnOutline,
} from './ui';
import { CLAVIER } from '../lib/clavier';
import * as retour from '../lib/retour';
import {
  LE_LABEL, ENERGIE_AUCUN, etatInitialEnergie, lireEnergie, travauxApresAppui, annonceDesTravaux,
  sansLabelApresAppui, sousTraitantsApresAppui, energieConcerne, travauxCoches, etatsDesTravaux,
  phraseDuTravail, declarationMontree, introductionDeLEnergie, pourQuiValable, etatDesLieux, ligneDEtatDeLaCarte,
} from '../lib/devis';
import { libelleDuTravail, siretDuSousTraitant, libelleEtatDuSousTraitant } from '../lib/emetteur';
import { TRAVAUX_ENERGIE } from '../data/travaux-energie';

const EnergieDevis = forwardRef(function EnergieDevis({
  devis = {}, regime,
  /* LES LISTES VIVANTES de « Mon entreprise » (les signes de qualité, les
     sous-traitants), SANS valeur par défaut : `undefined` tant qu'elles ne
     sont pas lues, `null` si elles n'ont pas pu l'être, un tableau sinon —
     jamais un `[]` inventé (« aucun signe de qualité » à qui en a un
     l'inviterait à déclarer ne pas en détenir). */
  labels, sousTraitants,
  etatEcriture = null, onReessayer, onEnregistrer, onFermer,
  rubriqueInitiale = null, depuisLaListe = false,
  /* « Réessayer » sous une liste non lue : la MÊME lecture que le régime
     (`onRelireRegime` de la saisie). */
  onRelireListes = null,
  /* Les deux portes : la saisie enregistre la carte, puis ouvre « Mon
     entreprise » sur la section des signes de qualité, ou des
     sous-traitants. */
  onMesSignes = null, onMesSousTraitants = null,
}, ref) {
  /* LA RUBRIQUE SUR LAQUELLE LA CARTE S'OUVRE : le défilement se pose UNE
     fois — après, c'est l'artisan qui défile. */
  const refDefile = useRef(null);
  const place = useRef(false);
  const ancre = (cle) => (e) => {
    if (place.current || cle !== rubriqueInitiale || !refDefile.current) return;
    place.current = true;
    refDefile.current.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - S.md), animated: false });
  };

  /* Les choix faits d'un appui : une RÉFÉRENCE (lue par `lire()` dans la
     même boucle que l'appui) ET un état (pour le dessin). L'état de départ
     vient de `etatInitialEnergie` : rien n'est coché à la place de
     l'artisan. */
  const [initial] = useState(() => etatInitialEnergie(devis));
  const choix = useRef(initial);
  const [c, setC] = useState(initial);
  const poser = (x) => { choix.current = { ...choix.current, ...x }; setC(choix.current); };
  /* LE PLAFOND DES SOUS-TRAITANTS (la leçon du onzième lieu) : un onzième ne
     s'ajoute pas, et la carte le DIT juste sous les cases — rien n'est
     écrit. Retombe au premier appui qui passe, ou à une réponse. */
  const [plafond, setPlafond] = useState(false);

  /* TOUT CE QUE LA CARTE PORTE À CET INSTANT — la règle vit dans
     `lireEnergie` (`devis.js`). */
  const lire = () => lireEnergie({ choix: choix.current, devis });

  /* `geste` : la rubrique touchée — la saisie ne vibre que pour un refus
     NOUVEAU (la carte n'a aucun champ tapé : rien ne s'y refuse). */
  const enregistrer = (geste = 'fermer') => {
    const l = lire();
    if (onEnregistrer) onEnregistrer(l.changements, l.erreurs, { ...l.textes, choix: choix.current }, geste);
    return l;
  };
  useImperativeHandle(ref, () => ({ lire, enregistrer }));

  /* Un APPUI change un choix, PUIS la carte s'enregistre entière. */
  const choisir = (x, geste) => { poser(x); enregistrer(geste); };

  /* LES GESTIONNAIRES D'APPUI — les SEULS qui posent un choix. */

  /* Une case des travaux : elle se coche ou se décoche, la pastille « Aucun
     de ces travaux » tombe — sans annonce : c'est l'objet même de l'appui. */
  const toucherTravail = (cle) => {
    choisir({ travaux: travauxApresAppui(choix.current.travaux, cle) }, 'travaux');
  };
  /* La pastille « Aucun de ces travaux » : allumée, elle RETIRE les travaux
     cochés, dans le même geste — et le DIT. */
  const toucherAucun = () => {
    const avant = choix.current.travaux;
    const apres = travauxApresAppui(avant, ENERGIE_AUCUN);
    choisir({ travaux: apres }, 'travaux');
    const dire = annonceDesTravaux(avant, apres);
    if (dire) retour.annoncer(dire);
  };
  /* La case « Je ne détiens pas de label RGE pour ces travaux », sous UN
     travail : elle ajoute ou retire CETTE clé, et elle seule. */
  const toucherDeclaration = (cle) => {
    choisir({ sansLabel: sansLabelApresAppui(choix.current.sansLabel, cle) }, 'sansLabel');
  };
  /* La question de la sous-traitance : « Non » écrit `false`, « Oui »
     `true` ; une pastille déjà choisie, retouchée « pour valider », ne fait
     rien. Les sous-traitants cochés sont GARDÉS sous « Non » (T23). */
  const repondreSousTraitance = (valeur) => {
    if (choix.current.sousTraitance === valeur) return;
    setPlafond(false);
    choisir({ sousTraitance: valeur }, 'sousTraitance');
  };
  /* Un sous-traitant : rebâti depuis la liste LUE, dans son ordre
     (`sousTraitantsApresAppui`) — le SEUL endroit où les sous-traitants
     choisis se récrivent. Un sous-traitant de trop (`plafond`) n'écrit RIEN :
     la phrase se MONTRE, s'annonce, et la carte vibre. */
  const toucherSousTraitant = (id) => {
    const apres = sousTraitantsApresAppui(choix.current.sousTraitants, sousTraitants, id);
    if (apres.plafond) {
      setPlafond(true);
      retour.echec();
      retour.annoncer(LE_LABEL.sousTraitance.plafond);
      return;
    }
    setPlafond(false);
    choisir({ sousTraitants: apres.sousTraitants }, 'sousTraitants');
  };
  /* LES PORTES vers « Mon entreprise » : la carte s'enregistre d'abord. */
  const allerAMesSignes = () => {
    enregistrer('fermer');
    if (onMesSignes) onMesSignes();
  };
  const allerAMesSousTraitants = () => {
    enregistrer('fermer');
    if (onMesSousTraitants) onMesSousTraitants();
  };

  const L = LE_LABEL.label;
  const ST = LE_LABEL.sousTraitance;
  const valable = pourQuiValable(devis);
  const concerne = energieConcerne(valable);
  const intro = introductionDeLEnergie(valable);
  const travaux = Array.isArray(c.travaux) ? c.travaux : [];
  const aucun = travaux.includes(ENERGIE_AUCUN);
  /* Les travaux COCHÉS par la carte, et leur état — la SEULE écriture de la
     règle (`etatsDesTravaux`) : `null` tant que les signes de qualité ne
     sont pas LUS. */
  const coches = travauxCoches({ energieTravaux: c.travaux });
  const etats = etatsDesTravaux({ ...devis, energieTravaux: c.travaux }, labels);
  const declares = Array.isArray(c.sansLabel) ? c.sansLabel : [];
  const etatLabels = etatDesLieux(regime, labels);
  const etatSousTraitants = etatDesLieux(regime, sousTraitants);
  const sousTraitantsMontres = Array.isArray(sousTraitants) ? sousTraitants : [];
  const choisis = Array.isArray(c.sousTraitants) ? c.sousTraitants : [];
  const etat = ligneDEtatDeLaCarte({
    echec: etatEcriture && etatEcriture.echec,
    reessayable: !!(etatEcriture && etatEcriture.reessayable),
    enCours: !!(etatEcriture && etatEcriture.enCours),
  });

  return (
    /* MODALE pour VoiceOver, comme les autres cartes : sous elle, la liste,
       le pied et les bandes sont cachés. */
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel={depuisLaListe
            ? 'Enregistrer l’énergie et le label RGE et revenir à ce qu’il manque pour remettre ce devis'
            : 'Enregistrer l’énergie et le label RGE et revenir au devis'}
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>{depuisLaListe ? '‹ Liste' : '‹ Devis'}</Text>
        </Pressable>
        <View style={s.milieu}>
          <Text style={s.barreTitre} numberOfLines={1}>{LE_LABEL.titre}</Text>
        </View>
        <View style={s.place} />
      </View>

      {/* LA LIGNE D'ÉTAT, sous la barre et hors du défilement : la carte
          couvre les bandes du bas, elle dit donc elle-même l'envoi en cours
          et l'échec (« Réessayer »). Sa place est réservée même au repos. */}
      <View style={s.etat} accessibilityLiveRegion="polite">
        <Text style={etat.ton === 'echec' ? s.etatEchec : s.etatTexte}>{etat.texte}</Text>
        {etat.action === 'reessayer' && (
          <BtnOutline label={L.reessayer} accessibilityLabel="Réessayer l’enregistrement de l’énergie et du label RGE"
            onPress={onReessayer} />
        )}
      </View>

      <ScrollView ref={refDefile} {...CLAVIER} keyboardDismissMode="on-drag" contentContainerStyle={s.contenu}>
        {/* 1. L'INTRODUCTION — pour un client « entreprise », la seule phrase
            qui dit que la loi ne demande rien : ce qui est écrit est gardé. */}
        {intro.map((p) => <Text key={p} style={s.aide}>{p}</Text>)}

        {concerne && (
          <>
            {/* 2. LA QUESTION, et « Aucun de ces travaux » EN TÊTE (ÉCRAN-3) :
                juste sous la question, avant les dix-neuf cases. */}
            <Text style={s.sousTitre} onLayout={ancre('travaux')} accessibilityRole="header">{LE_LABEL.sousTitre}</Text>
            <Text style={s.enonce}>{LE_LABEL.travaux.question}</Text>
            <View style={s.pastilles}>
              <Pastille label={LE_LABEL.travaux.aucun} choisie={aucun} onPress={toucherAucun} />
            </View>
            <Text style={s.aide}>{LE_LABEL.travaux.sousAucun}</Text>
            <Text style={s.aide}>{LE_LABEL.travaux.sousAucunSousTraitance}</Text>
            <Text style={s.aide}>{LE_LABEL.travaux.aide}</Text>
            {/* Des `Interrupteur` TELS QUELS : rôle `switch`, lu par iOS dans sa
                langue. Le libellé, qui s'imprimera, est séparé de ses
                exemples, qui aident à l'écran (et la consigne du 17°). */}
            {TRAVAUX_ENERGIE.map((t) => (
              <Interrupteur
                key={t.cle}
                actif={travaux.includes(t.cle)}
                libelle={t.libelle}
                aide={t.exemples || t.aide || undefined}
                onPress={() => toucherTravail(t.cle)}
              />
            ))}

            {coches.length > 0 && (
              <>
                {/* 3. VOTRE LABEL RGE — travail par travail. */}
                <Text style={s.titre} onLayout={ancre('label')} accessibilityRole="header">{L.sousTitre}</Text>
                {etatLabels === 'echec' && (
                  <>
                    <Text style={s.erreur} accessibilityLiveRegion="polite">{L.echec}</Text>
                    <View style={s.boutons}>
                      <BtnOutline label={L.reessayer} accessibilityLabel="Relire vos signes de qualité" onPress={onRelireListes} />
                    </View>
                  </>
                )}
                {etatLabels === 'vide' && <Text style={s.etiquette}>{L.vide}</Text>}
                {coches.map((cle) => {
                  const e = etats ? etats.find((x) => x.cle === cle) || null : null;
                  const declaree = declares.includes(cle);
                  const montree = declarationMontree({ etat: e ? e.etat : null, declaree });
                  if (!e && !montree) return null;
                  return (
                    <View key={cle} style={s.travail}>
                      <Text style={s.etiquette}>{libelleDuTravail(cle)}</Text>
                      {!!e && <Text style={s.aide}>{phraseDuTravail(e)}</Text>}
                      {montree && (
                        <Interrupteur
                          actif={declaree}
                          libelle={L.declaration}
                          aide={L.aideDeclaration}
                          onPress={() => toucherDeclaration(cle)}
                        />
                      )}
                    </View>
                  );
                })}
                <View style={s.boutons}>
                  <BtnOutline label={L.porte}
                    accessibilityLabel="Mes signes de qualité : ouvrir « Mon entreprise » sur vos signes de qualité"
                    onPress={allerAMesSignes} />
                </View>

                {/* 4. LA SOUS-TRAITANCE — « Non » à GAUCHE, rien de choisi. */}
                <Text style={s.titre} onLayout={ancre('sousTraitance')} accessibilityRole="header">{ST.sousTitre}</Text>
                <Text style={s.enonce}>{ST.question}</Text>
                <View style={s.pastilles}>
                  <Pastille label={ST.non} nom={`${ST.sousTitre} : ${ST.non}`} choisie={c.sousTraitance === false}
                    onPress={() => repondreSousTraitance(false)} />
                  <Pastille label={ST.oui} nom={`${ST.sousTitre} : ${ST.oui}`} choisie={c.sousTraitance === true}
                    onPress={() => repondreSousTraitance(true)} />
                </View>
                {c.sousTraitance === true && (
                  <>
                    <Text style={s.etiquette}>{ST.lesquelles}</Text>
                    {etatSousTraitants === 'echec' && (
                      <>
                        <Text style={s.erreur} accessibilityLiveRegion="polite">{ST.echec}</Text>
                        <View style={s.boutons}>
                          <BtnOutline label={ST.reessayer} accessibilityLabel="Relire vos sous-traitants" onPress={onRelireListes} />
                          <BtnOutline label={ST.porte}
                            accessibilityLabel="Mes sous-traitants : ouvrir « Mon entreprise » sur vos sous-traitants"
                            onPress={allerAMesSousTraitants} />
                        </View>
                      </>
                    )}
                    {etatSousTraitants === 'vide' && (
                      <>
                        <Text style={s.etiquette}>{ST.vide}</Text>
                        <View style={s.boutons}>
                          <BtnOutline label={ST.ajouter}
                            accessibilityLabel="Ajouter un sous-traitant : ouvrir « Mon entreprise » sur vos sous-traitants"
                            onPress={allerAMesSousTraitants} />
                        </View>
                      </>
                    )}
                    {etatSousTraitants === 'lus' && (
                      <>
                        {sousTraitantsMontres.map((st) => (
                          <Interrupteur
                            key={String(st.id)}
                            actif={choisis.includes(st.id)}
                            libelle={st.raison_sociale || ''}
                            aide={[siretDuSousTraitant(st), libelleEtatDuSousTraitant(st)].filter(Boolean).join(' · ')}
                            onPress={() => toucherSousTraitant(st.id)}
                          />
                        ))}
                        {/* LE PLAFOND, JUSTE SOUS LES CASES (la leçon du onzième
                            lieu) : rien AU-DESSUS ne bouge. */}
                        {plafond && <Text style={s.erreur} accessibilityLiveRegion="polite">{ST.plafond}</Text>}
                        <View style={s.boutons}>
                          <BtnOutline label={ST.porte}
                            accessibilityLabel="Mes sous-traitants : ouvrir « Mon entreprise » sur vos sous-traitants"
                            onPress={allerAMesSousTraitants} />
                        </View>
                      </>
                    )}
                  </>
                )}

                {/* 5. L'AIDE DE LA LOI ET L'AMENDE (réponse P14) — dans l'aide de
                    la carte, jamais dans une phrase du point. */}
                <Text style={s.aide}>{ST.aide}</Text>
                <Text style={s.amende}>{LE_LABEL.amende}</Text>
                <Text style={s.amendeSuite}>{LE_LABEL.amendeSousTraitance}</Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
});

export default EnergieDevis;

const s = StyleSheet.create({
  /* Elle PREND L'ÉCRAN, comme « Conditions », « Le chantier » et
     « Déchets ». */
  ecran: { ...StyleSheet.absoluteFillObject, backgroundColor: C.surface, zIndex: 20 },
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.sm, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  retour: { minHeight: TOUCHE, minWidth: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm },
  retourTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  milieu: { flex: 1, minWidth: 0, alignItems: 'center' },
  barreTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  place: { minWidth: TOUCHE },
  contenu: { padding: S.lg, paddingBottom: S.xxl * 3, gap: S.xs },
  sousTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2, marginTop: S.md },
  enonce: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  titre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.lg },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.xs, marginBottom: S.xs },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs, marginBottom: S.xs },
  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* Un travail coché, dans « Votre label RGE » : son nom, son état, sa case. */
  travail: { gap: S.xs, marginTop: S.sm },
  /* L'amende : une aide, à l'encre du texte — elle dit ce qui se joue. */
  amende: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit), marginTop: S.xl },
  amendeSuite: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit), marginTop: S.xs },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* LA LIGNE D'ÉTAT : une ligne réservée même au repos — l'envoi qui
     commence ne pousse pas la carte. */
  etat: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.sm,
    minHeight: interligne(T.petit) + 2 * S.xs, paddingHorizontal: S.lg, paddingVertical: S.xs,
    borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  etatTexte: { flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  etatEchec: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },
});
