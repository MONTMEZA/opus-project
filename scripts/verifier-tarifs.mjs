/**
 * LES TARIFS RÉUNIS — lot T (19/10/2026) : devis, fiche et SOS.
 *
 * CE QUE CE CONTRÔLE GARDE
 * ------------------------
 * Un artisan déclare UNE liste de tarifs dans « Mon entreprise ». Elle sert
 * à ses devis, et — s'il choisit de les afficher — à sa fiche et à
 * l'estimation du bouton SOS, lues par les particuliers seulement. Tout ce
 * qui décide vit dans des fichiers que `node` sait ouvrir :
 * `src/lib/tarifs.js`, `src/lib/emetteur.js`, `src/data/urgences.js`,
 * `src/data/tarifs-demo.js`. Ce contrôle les FAIT TOURNER : il ne relit pas
 * le code, il regarde ce qu'il rend. S'il plante, c'est un échec.
 *
 * Il est construit par parties, une par étape du lot (cahier §9.2) :
 *   A. CE QU'IL FAIT TOURNER — l'estimation, la nuit jugée à l'heure
 *      d'arrivée, les lignes de la fiche, le réglage d'urgence, le
 *      formulaire et ses refus, la démonstration, les phrases (étape 1) ;
 *   B. LA LISTE FERMÉE des colonnes de `tarifs_pro` : chaque colonne devient
 *      lisible par les particuliers pour l'artisan qui affiche (étape 1 ;
 *      elle ne passe qu'une fois la section 47 posée, étape 2) ;
 *   C. SQL ↔ JAVASCRIPT et D. LES PROPRIÉTÉS DU SCHÉMA (étape 2) ;
 *   E. LES PROPRIÉTÉS DE L'APPLICATION — l'API (30), l'écran SOS (31), le
 *      réglage d'urgence (32), « Mon entreprise » (33), le bloc des tarifs
 *      et ses gardes (34, 35), le formulaire (36), aucun 0 hors des
 *      interrupteurs (37), « TTC » partout où la fourchette s'affiche (38).
 *
 * LES RÉPONSES DU PROPRIÉTAIRE DU 19/10/2026 sont tenues ici : répondre aux
 * urgences demande d'afficher ses tarifs ; la majoration s'applique « comme
 * aujourd'hui », au déplacement comme aux heures ; les tarifs affichés ne
 * vont qu'aux particuliers (la base le tient, partie D).
 *
 * Il retire les commentaires avant de lire un texte : dans ce projet, un
 * contrôle a déjà accusé dix fois la documentation qui expliquait le défaut.
 *
 *   npm run verifier-tarifs
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as T from '../src/lib/tarifs.js';
import * as E from '../src/lib/emetteur.js';
import * as U from '../src/data/urgences.js';
import { dateFrancaise, isoLisible } from '../src/lib/entreprise.js';
import { TARIFS_DEMO, MES_SOS_DEMO } from '../src/data/tarifs-demo.js';
import { proProfiles } from '../src/data/demo.js';
import { messageClair, MESSAGES_CONTRAINTE } from '../src/lib/erreurs.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const sansCommentaires = (c) => c
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const egalListes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const egalEnsembles = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
const json = (x) => JSON.stringify(x);
const SALE = /null|undefined|NaN/;

/* Un mardi, un samedi, un dimanche d'octobre 2026, à l'heure locale — comme
   `estNuitOuWeekend`, qui lit l'heure du téléphone. */
const jourDe = (jourSemaine, h, m = 0) => {
  for (let d = 1; d <= 31; d += 1) {
    const date = new Date(2026, 9, d, h, m);
    if (date.getDay() === jourSemaine) return date;
  }
  throw new Error('aucun jour trouvé');
};
const MARDI = 2;
const SAMEDI = 6;
const DIMANCHE = 0;

/* Les tarifs d'essai, aux noms de la base, en centimes. */
const COMPLET = { frais_deplacement_centimes: 4500, taux_horaire_centimes: 6200, majoration_pct: 40, affiche: true };
const OFFERT = { ...COMPLET, frais_deplacement_centimes: 0 };
const SANS_MAJ = { ...COMPLET, majoration_pct: 0 };
const MINIMAL = { frais_deplacement_centimes: 0, taux_horaire_centimes: 100, majoration_pct: 0, affiche: true };
const MINIMAL_MAJ = { ...MINIMAL, majoration_pct: 40 };
const AVEC_DEVIS = { ...COMPLET, prix_devis_centimes: 3000 };
const MAJORATIONS = ['oui', 'non', 'selon_heure'];
const TOUS_LES_PROBLEMES = Object.values(U.PROBLEMES).flat();
const FUITE = U.PROBLEMES.plomberie.find((p) => p.key === 'fuite');

/* ================================================================== */
/*  A. CE QU'IL FAIT TOURNER                                           */
/* ================================================================== */
console.log('\nA. CE QU’IL FAIT TOURNER — l’estimation, la fiche, le réglage, le formulaire');

console.log('\n  1. l’estimation des urgences');
{
  const cas = [COMPLET, OFFERT, SANS_MAJ, MINIMAL, MINIMAL_MAJ, AVEC_DEVIS];
  const fautes = [];
  for (const t of cas) {
    for (const p of TOUS_LES_PROBLEMES) {
      for (const m of MAJORATIONS) {
        const e = T.estimationSos(t, p, m);
        if (!e || !Number.isInteger(e.min) || !Number.isInteger(e.max) || e.min < 1 || e.max < e.min) {
          fautes.push(`${json(t)} ${p.key} ${m} → ${json(e)}`);
        }
      }
    }
  }
  verifier('sur chaque problème, chaque majoration, chaque tarif complet : min ≥ 1 — « 0 – 0 € » ne peut plus sortir',
    fautes.length === 0, fautes.slice(0, 3).join(' | '));

  const incomplets = [
    ['sans taux', { ...COMPLET, taux_horaire_centimes: null }],
    ['sans majoration', { ...COMPLET, majoration_pct: null }],
    ['sans déplacement', { ...COMPLET, frais_deplacement_centimes: null }],
    ['conditions seules', { ...COMPLET, frais_deplacement_centimes: null, frais_deplacement_texte: 'gratuit à 20 km' }],
    ['non affiché', { ...COMPLET, affiche: false }],
    ['aucune ligne', null],
  ];
  const nonNuls = incomplets.filter(([, t]) => MAJORATIONS.some((m) => T.estimationSos(t, FUITE, m) !== null));
  verifier('des tarifs incomplets ou non affichés → `null`, jamais une fourchette',
    nonNuls.length === 0, nonNuls.map(([n]) => n).join(', '));
  verifier('sans problème choisi → `null`',
    MAJORATIONS.every((m) => T.estimationSos(COMPLET, null, m) === null && T.estimationSos(COMPLET, undefined, m) === null));

  const non = T.estimationSos(COMPLET, FUITE, 'non');
  const selon = T.estimationSos(COMPLET, FUITE, 'selon_heure');
  const oui = T.estimationSos(COMPLET, FUITE, 'oui');
  verifier('45 € + 62 €/h sur une fuite (1 à 2 h) : 107 – 169 sans majoration, 150 – 237 à +40 % — '
    + 'les nombres d’avant le lot T : seule l’unité a changé',
    non && non.min === 107 && non.max === 169 && non.majore === false
    && selon && selon.min === 107 && selon.max === 169 && selon.majore === false
    && oui && oui.min === 150 && oui.max === 237 && oui.majore === true,
    `non ${json(non)}, selon_heure ${json(selon)}, oui ${json(oui)}. La majoration porte sur le `
    + 'déplacement ET les heures : réponse du propriétaire du 19/10, question 4, « Comme aujourd’hui ».');

  const zero = T.estimationSos(SANS_MAJ, FUITE, 'oui');
  verifier('majoration à 0 % avec « oui » → `majore` FAUX, et la fourchette d’un jour ordinaire',
    zero && zero.majore === false && zero.min === 107 && zero.max === 169, json(zero));
}

console.log('\n  2. la nuit se juge à l’HEURE D’ARRIVÉE');
{
  const at = (date, delai, creneau = 'immediat') => T.majorationSos({ creneau, maintenant: date.getTime(), delaiMin: delai });
  verifier('un mardi à 19 h 40, arrivée dans 25 min (20 h 05) → « oui »',
    at(jourDe(MARDI, 19, 40), 25) === 'oui', at(jourDe(MARDI, 19, 40), 25));
  verifier('…dans 15 min (19 h 55) → « non »', at(jourDe(MARDI, 19, 40), 15) === 'non');
  verifier('un mardi à 6 h 40, arrivée dans 25 min (7 h 05) → « non »', at(jourDe(MARDI, 6, 40), 25) === 'non');
  const heures = [jourDe(MARDI, 3, 0), jourDe(MARDI, 12, 0), jourDe(SAMEDI, 12, 0), jourDe(MARDI, 22, 0)];
  verifier('« Dans la journée » et « Demain » → « selon_heure », quelle que soit l’heure',
    heures.every((d) => at(d, 25, 'journee') === 'selon_heure' && at(d, 25, 'demain') === 'selon_heure'));
}

console.log('\n  3. la ligne de détail de la carte');
{
  const sorties = [];
  for (const t of [COMPLET, OFFERT, SANS_MAJ, MINIMAL, MINIMAL_MAJ, AVEC_DEVIS]) {
    for (const m of MAJORATIONS) sorties.push({ t, m, d: T.detailSos(t, m) });
  }
  const sales = sorties.filter((s) => typeof s.d !== 'string' || SALE.test(s.d) || /\+0\s*%/.test(s.d));
  verifier('jamais `null`, `undefined`, `NaN` ni « +0 % »', sales.length === 0,
    sales.slice(0, 2).map((s) => `${json(s.t)} ${s.m} → « ${s.d} »`).join(' | '));
  const offert = sorties.filter((s) => /Déplacement offert/.test(s.d) !== (s.t.frais_deplacement_centimes === 0));
  verifier('« Déplacement offert » si et seulement si le déplacement vaut 0', offert.length === 0);
  /* « déplacement compris » accompagne TOUT pourcentage annoncé, « oui »
     comme « selon l'heure » (relecture droit du 19/10/2026) : pour
     « Demain », la majoration s'appliquera aussi au déplacement si
     l'intervention tombe la nuit — réponse du 19/10, question 4. */
  const compris = sorties.filter((s) => /déplacement compris/.test(s.d)
    !== ((s.m === 'oui' || s.m === 'selon_heure') && s.t.majoration_pct > 0));
  verifier('« déplacement compris » avec tout pourcentage annoncé (« oui » ou « selon l’heure », plus de 0 %), et seulement là',
    compris.length === 0, compris.slice(0, 2).map((s) => `${s.m} ${s.t.majoration_pct} % → « ${s.d} »`).join(' | '));
  const si = sorties.filter((s) => /si l’intervention a lieu la nuit ou le week-end/.test(s.d)
    !== (s.m === 'selon_heure' && s.t.majoration_pct > 0));
  verifier('« +X % si l’intervention a lieu la nuit ou le week-end » seulement quand l’heure n’est pas connue',
    si.length === 0, si.slice(0, 2).map((s) => `${s.m} → « ${s.d} »`).join(' | '));
  const sans = sorties.filter((s) => /sans majoration/.test(s.d)
    !== (s.m !== 'non' && s.t.majoration_pct === 0));
  verifier('« sans majoration la nuit ni le week-end » pour qui ne majore pas, quand la nuit est en jeu',
    sans.length === 0);
  const nonRien = sorties.filter((s) => s.m === 'non' && /%|majoration/.test(s.d));
  verifier('de jour (« non ») : aucune mention de majoration', nonRien.length === 0,
    nonRien.map((s) => `« ${s.d} »`).join(' | '));
}

console.log('\n  4. la note et le complément de la carte');
{
  verifier('« majoration de nuit et de week-end incluse » seulement si `majore`',
    /majoration de nuit et de week-end incluse/.test(T.noteSos(COMPLET, true)) && !/incluse/.test(T.noteSos(COMPLET, false)));
  /* UN SAMEDI À 11 H, la majoration s'applique — et la carte disait
     « majoration de NUIT incluse » sous une intervention de jour (relecture
     application du 19/10/2026). Le nom entier, celui du champ. */
  const samedi = T.estimationSos(COMPLET, FUITE,
    T.majorationSos({ creneau: 'immediat', maintenant: jourDe(SAMEDI, 11, 0).getTime(), delaiMin: 25 }));
  const noteSamedi = T.noteSos(COMPLET, samedi && samedi.majore);
  verifier('…un samedi à 11 h : « de nuit et de week-end », jamais « de nuit » seul',
    !!samedi && samedi.majore === true && /majoration de nuit et de week-end incluse/.test(noteSamedi)
    && !/majoration de nuit incluse/.test(noteSamedi), noteSamedi);
  const zero = T.estimationSos(SANS_MAJ, FUITE, 'oui');
  verifier('…donc jamais pour un artisan qui ne majore pas, même de nuit',
    !/incluse/.test(T.noteSos(SANS_MAJ, zero.majore)));
  verifier('« hors prix du devis » seulement pour un devis payant',
    /hors prix du devis/.test(T.noteSos(AVEC_DEVIS, false))
    && !/hors prix/.test(T.noteSos({ ...COMPLET, prix_devis_centimes: 0 }, false))
    && !/hors prix/.test(T.noteSos(COMPLET, false)) && !/hors prix/.test(T.noteSos(null, false)));
  verifier('`conditionsSos` rend `[]` pour des tarifs sans texte ni devis, et pour rien',
    egalListes(T.conditionsSos(COMPLET), []) && egalListes(T.conditionsSos(null), []));
  const tout = T.conditionsSos({ ...COMPLET, prix_devis_centimes: 3000, decompte_temps_texte: 'Toute heure commencée est due',
    frais_deplacement_texte: 'au-delà de 20 km' });
  verifier('…et sinon les lignes déclarées : le devis, le temps, les conditions de déplacement',
    egalListes(tout, ['Devis : 30\u00a0€\u00a0TTC', 'Temps : Toute heure commencée est due',
      'Déplacement : au-delà de 20 km']) && tout.every((l) => !SALE.test(l)), json(tout));
  verifier('un devis gratuit se dit « Devis : gratuit »',
    T.conditionsSos({ ...COMPLET, prix_devis_centimes: 0 })[0] === 'Devis : gratuit');
}

console.log('\n  5. une ligne de la recherche, relue en centimes');
{
  const r = T.depuisLaRecherche({ deplacement: 45, horaire: 62, majoration: 40 });
  verifier('{ 45, 62, 40 } → 4 500 / 6 200 / 40, affichés',
    r && r.frais_deplacement_centimes === 4500 && r.taux_horaire_centimes === 6200 && r.majoration_pct === 40
    && r.affiche === true, json(r));
  const s = T.depuisLaRecherche({ deplacement: '35.10', horaire: '62.50', majoration: 40 });
  /* « 35.10 », l'exemple du cahier, ne suffit PAS à attraper `x * 100` :
     mesuré, `35.1 * 100` vaut exactement 3510 en JavaScript. `8.2 * 100`
     vaut 819,999…, `64.35 * 100` vaut 6434,999…, `19.99 * 100` vaut
     1998,999… : ce sont eux qui disent si le calcul passe par la chaîne. */
  const n = T.depuisLaRecherche({ deplacement: 8.2, horaire: '64.35', majoration: 40 });
  const m = T.depuisLaRecherche({ deplacement: '19.99', horaire: 64.35, majoration: 40 });
  verifier('« 35.10 » → 3 510 ; 8.2 → 820, et non 819,999… ; « 64.35 » → 6 435 : jamais `x * 100`',
    s && s.frais_deplacement_centimes === 3510 && s.taux_horaire_centimes === 6250
    && n && n.frais_deplacement_centimes === 820 && n.taux_horaire_centimes === 6435
    && m && m.frais_deplacement_centimes === 1999 && m.taux_horaire_centimes === 6435,
    `${json(s)} ${json(n)} ${json(m)}`);
  verifier('0 / 0 / 0 (une base pas encore migrée) → `null`',
    T.depuisLaRecherche({ deplacement: 0, horaire: 0, majoration: 0 }) === null);
  verifier('une clé absente, une valeur illisible → `null`',
    T.depuisLaRecherche({ deplacement: 45, horaire: 62 }) === null
    && T.depuisLaRecherche({ horaire: 62, majoration: 40 }) === null
    && T.depuisLaRecherche({ deplacement: -5, horaire: 62, majoration: 40 }) === null
    && T.depuisLaRecherche({ deplacement: 45, horaire: 62, majoration: 4.5 }) === null
    && T.depuisLaRecherche(null) === null);
  verifier('un déplacement offert (0) reste lisible',
    (T.depuisLaRecherche({ deplacement: 0, horaire: 70, majoration: 50 }) || {}).frais_deplacement_centimes === 0);
}

console.log('\n  6. le bloc « Ses tarifs » de la fiche');
{
  const complet = {
    taux_horaire_centimes: 6200, decompte_temps_texte: 'Toute heure commencée est due',
    frais_deplacement_centimes: 4500, frais_deplacement_texte: 'au-delà de 20 km',
    majoration_pct: 40, prix_devis_centimes: 3000, affiche: true,
  };
  const l = T.lignesTarifs(complet);
  verifier('les cinq lignes d’un tarif complet, dans l’ordre : taux, décompte, déplacement, majoration, devis',
    egalListes(l.map((x) => x.cle), ['taux', 'decompte', 'deplacement', 'majoration', 'devis']), json(l.map((x) => x.cle)));
  const offert = T.lignesTarifs({ frais_deplacement_centimes: 0 });
  verifier('un déplacement à 0 : UNE ligne « Déplacement offert », sans libellé',
    offert.length === 1 && offert[0].libelle === null && offert[0].valeur === 'Déplacement offert', json(offert));
  const conditions = T.lignesTarifs({ frais_deplacement_texte: 'gratuit jusqu’à 20 km' });
  verifier('des conditions seules : une ligne « Déplacement » qui les dit',
    conditions.length === 1 && conditions[0].libelle === 'Déplacement' && conditions[0].valeur === 'gratuit jusqu’à 20 km');
  verifier('rien de déclaré → aucune ligne', T.lignesTarifs({}).length === 0 && T.lignesTarifs(null).length === 0);
  const toutes = [...l, ...T.lignesTarifs({ ...complet, majoration_pct: 0, prix_devis_centimes: 0 }), ...offert];
  const pretees = toutes.filter((x) => /20\s*h|week-end|déplacement compris/i.test(x.valeur));
  verifier('aucune VALEUR ne prête à l’artisan les heures d’Opus : ni « 20 h », ni « week-end », ni « déplacement compris »',
    pretees.length === 0, pretees.map((x) => x.valeur).join(' | '));
  const montants = [
    [l.find((x) => x.cle === 'taux').valeur, `${E.centimesLisibles(6200)}\u00a0TTC de l’heure`],
    [l.find((x) => x.cle === 'deplacement').valeur, `${E.centimesLisibles(4500)}\u00a0TTC — au-delà de 20 km`],
    [l.find((x) => x.cle === 'devis').valeur, `${E.centimesLisibles(3000)}\u00a0TTC`],
  ];
  verifier('chaque montant porte « TTC » (« TTC de l’heure » pour le taux)',
    montants.every(([a, b]) => a === b) && toutes.every((x) => !/€(?!\u00a0TTC)/.test(x.valeur)),
    montants.map(([a]) => a).join(' | '));
  verifier('la majoration se lit en pourcentage seul : « +40 % », ou « Aucune »',
    l.find((x) => x.cle === 'majoration').valeur === '+40\u00a0%'
    && T.lignesTarifs({ majoration_pct: 0 })[0].valeur === 'Aucune');
}

console.log('\n  7. prêt pour le SOS — les seize combinaisons');
{
  const ORDRE = ['affiche', 'deplacement', 'taux', 'majoration'];
  const fautes = [];
  for (let masque = 0; masque < 16; masque += 1) {
    const a = (bit) => (masque & (1 << bit)) !== 0;
    const t = {
      affiche: a(0),
      frais_deplacement_centimes: a(1) ? 4500 : null,
      taux_horaire_centimes: a(2) ? 6200 : null,
      majoration_pct: a(3) ? 40 : null,
    };
    const attendu = ORDRE.filter((_, i) => !a(i));
    const r = T.pretPourLeSos(t);
    if (r.pret !== (attendu.length === 0) || !egalListes(r.manque, attendu)) fautes.push(`${json(t)} → ${json(r)}`);
  }
  verifier('`pret` si et seulement si les quatre conditions tiennent ; `manque` dans l’ordre',
    fautes.length === 0, fautes.slice(0, 2).join(' | '));
  verifier('sans ligne : les quatre manquent', egalListes(T.pretPourLeSos(null).manque, ORDRE));
  verifier('des conditions de déplacement SEULES ne font pas un déplacement',
    T.pretPourLeSos({ ...COMPLET, frais_deplacement_centimes: null, frais_deplacement_texte: 'x' }).manque[0] === 'deplacement');
}

console.log('\n  8. l’état de départ du réglage d’urgence');
{
  const ligne = { metierKey: 'plomberie', actif: true, rayonKm: 35, delaiMinutes: 30 };
  const r = T.reglageInitialSos({ lignes: [ligne] }, ['plombier']);
  verifier('une ligne active du métier de la fiche, rayon 35 → interrupteur ALLUMÉ, « 35 »',
    r.lisible === true && r.actif === true && r.rayon === '35' && r.delai === '30' && r.ligne === ligne, json(r));
  const echec = T.reglageInitialSos({ echec: true }, ['plombier']);
  const rien = T.reglageInitialSos(null, ['plombier']);
  verifier('lecture en échec, ou rien → illisible et éteint',
    echec.lisible === false && echec.actif === false && rien.lisible === false && rien.actif === false
    && echec.rayon === '20' && echec.delai === '45');
  const autre = T.reglageInitialSos({ lignes: [{ metierKey: 'chauffage', actif: true, rayonKm: 10, delaiMinutes: 20 }] },
    ['plombier']);
  verifier('une ligne active d’un AUTRE métier → éteint, et `autresActives` la nomme',
    autre.actif === false && egalListes(autre.autresActives, ['chauffage']), json(autre));
}

console.log('\n  9. ce que dit le réglage d’urgence — les états et leurs priorités');
{
  const PLOMB = U.METIERS_SOS.find((m) => m.key === 'plomberie');
  const base = { sos: { lignes: [] }, sosMetier: PLOMB, interrupteur: true, enregistre: true,
    tarifs: COMPLET, aDesCoordonnees: true };
  const e = (x) => T.etatReglageSos({ ...base, ...x });
  const orpheline = { sos: { lignes: [{ metierKey: 'electricite', actif: true }] }, sosMetier: null };
  const cles = {
    sos_echec: e({ sos: { echec: true }, tarifs: { echec: true } }).cle,
    tarifs_echec: e({ tarifs: { echec: true } }).cle,
    orpheline: e({ ...orpheline, aDesCoordonnees: false }).cle,
    sans_metier: e({ sosMetier: null }).cle,
    eteint: e({ interrupteur: false }).cle,
    sans_position: e({ aDesCoordonnees: false }).cle,
    non_affiches: e({ tarifs: { ...COMPLET, affiche: false } }).cle,
    incomplets: e({ tarifs: { ...COMPLET, majoration_pct: null } }).cle,
    pret: e({}).cle,
  };
  const fautives = Object.entries(cles).filter(([attendu, obtenu]) => attendu !== obtenu);
  verifier('chaque état du tableau, et les priorités : `sos.echec` d’abord ; `tarifs.echec` avant « non affichés » ; '
    + 'l’orpheline avant l’absence de position', fautives.length === 0,
    fautives.map(([a, o]) => `${a} → ${o}`).join(', '));
  verifier('un maçon dont les tarifs n’ont pas pu être lus lit « pas concerné », jamais « on ne peut pas dire »',
    e({ sosMetier: null, tarifs: { echec: true } }).cle === 'sans_metier');
  verifier('« prêt » au PRÉSENT quand la ligne est en base, au FUTUR sinon',
    /^Vous apparaissez dans les urgences « Plomberie »/.test(e({}).phrase)
    && /^En enregistrant, vous apparaîtrez dans les urgences « Plomberie »/.test(e({ enregistre: false }).phrase));
  const inc = e({ tarifs: { ...COMPLET, frais_deplacement_centimes: null, frais_deplacement_texte: 'x', majoration_pct: null } });
  verifier('« incomplets » nomme ce qui manque, avec les mots de `MANQUES_SOS`',
    egalListes(inc.manque, ['deplacement', 'majoration']) && inc.phrase.includes(T.MANQUES_SOS.deplacement)
    && inc.phrase.includes(T.MANQUES_SOS.majoration), inc.phrase);
  const deux = e({ sos: { lignes: [{ metierKey: 'chauffage', actif: true }, { metierKey: 'plomberie', actif: true }] } });
  verifier('une autre disponibilité active → `aEteindre` la nomme, et la phrase le dit',
    egalListes(deux.aEteindre, ['chauffage']) && /« Chauffage » sera désactivée/.test(deux.avertissement || ''),
    json(deux));
  const phrases = Object.keys(cles).map((k) => (k === 'pret' ? e({}) : null)).filter(Boolean)
    .concat([e({ sos: { echec: true } }), e({ ...orpheline }), e({ sosMetier: null }), e({ interrupteur: false }),
      e({ aDesCoordonnees: false }), e({ tarifs: { echec: true } }), e({ tarifs: null }), inc, deux]);
  verifier('aucune phrase ne contient `null`, `undefined` ni `NaN`',
    phrases.every((x) => typeof x.phrase === 'string' && x.phrase.length > 0 && !SALE.test(x.phrase)
      && (x.avertissement == null || !SALE.test(x.avertissement))));

  /* DANS « MON ENTREPRISE », la même phrase disait FAUX (constaté au
     navigateur le 19/10/2026) : « En enregistrant, cette disponibilité sera
     désactivée » au-dessus d'un bouton qui n'éteint rien, « Allumez … »
     là où l'interrupteur n'est pas. Avec `ecran: 'entreprise'`, mêmes
     états, mêmes priorités — et chaque phrase dit OÙ agir. */
  const ent = (x) => T.etatReglageSos({ ...base, ecran: 'entreprise', ...x });
  const LIEES = [ent({ sos: { echec: true } }), ent({ ...orpheline }), ent({ interrupteur: false }),
    ent({ aDesCoordonnees: false })];
  const fausses = LIEES.filter((x) => /En enregistrant|cet enregistrement|ce formulaire|^Allumez/.test(x.phrase));
  verifier('dans « Mon entreprise », aucune phrase ne parle d’un enregistrement ni d’un interrupteur qui n’y sont pas',
    fausses.length === 0, fausses.map((x) => x.phrase).join(' / '));
  verifier('…et l’orpheline, l’interrupteur éteint et la position manquante y disent OÙ agir : « Modifier mon profil »',
    LIEES.slice(1).every((x) => x.phrase.includes('« Modifier mon profil »')), LIEES.map((x) => x.phrase).join(' / '));
  const memesCles = [[{ sos: { echec: true } }, 'sos_echec'], [orpheline, 'orpheline'], [{ interrupteur: false }, 'eteint'],
    [{ aDesCoordonnees: false }, 'sans_position'], [{ tarifs: { ...COMPLET, affiche: false } }, 'non_affiches'], [{}, 'pret']]
    .filter(([x, cle]) => ent(x).cle !== cle || e(x).cle !== cle);
  verifier('…avec les MÊMES états et les mêmes priorités que dans « Modifier mon profil »',
    memesCles.length === 0, memesCles.map(([, c]) => c).join(', '));
  verifier('…et « Modifier mon profil » garde ses phrases à lui (l’écran par défaut)',
    /En enregistrant, cette disponibilité sera désactivée\.$/.test(e({ ...orpheline }).phrase)
    && /^Allumez « Je réponds aux urgences »/.test(e({ interrupteur: false }).phrase));
}

console.log('\n  10. le rayon et le délai tapés');
{
  const s = (x) => T.reglageSosDepuisSaisie(x);
  verifier('allumé : « 0 » refusé pour le rayon comme pour le délai — jamais changé en 20 ou 45',
    s({ actif: true, rayon: '0', delai: '45' }).ok === false && s({ actif: true, rayon: '0', delai: '45' }).valeurs === null
    && s({ actif: true, rayon: '20', delai: '0' }).ok === false);
  verifier('allumé : vide refusé ; « 2,5 » refusé',
    s({ actif: true, rayon: '', delai: '45' }).ok === false && s({ actif: true, rayon: '20', delai: '' }).ok === false
    && s({ actif: true, rayon: '2,5', delai: '45' }).ok === false);
  const ok = s({ actif: true, rayon: '20', delai: '45' });
  verifier('allumé : « 20 » et « 45 » acceptés', ok.ok && ok.valeurs.rayonKm === 20 && ok.valeurs.delaiMinutes === 45);
  verifier('allumé : hors des bornes de la base (201 km, 4 min) refusé',
    s({ actif: true, rayon: '201', delai: '45' }).ok === false && s({ actif: true, rayon: '20', delai: '4' }).ok === false
    && s({ actif: true, rayon: '200', delai: '600' }).ok && s({ actif: true, rayon: '1', delai: '5' }).ok);
  const eteint = s({ actif: false, rayon: '', delai: 'n’importe quoi', ligne: { rayonKm: 35, delaiMinutes: 30 } });
  verifier('ÉTEINT, rayon vide → accepté, avec les valeurs de la ligne : un champ caché ne bloque rien',
    eteint.ok && eteint.valeurs.rayonKm === 35 && eteint.valeurs.delaiMinutes === 30, json(eteint));
  const eteintSansLigne = s({ actif: false });
  verifier('…et sans ligne, 20 km et 45 minutes',
    eteintSansLigne.ok && eteintSansLigne.valeurs.rayonKm === 20 && eteintSansLigne.valeurs.delaiMinutes === 45);
}

console.log('\n  11. le formulaire des tarifs — seuls les interrupteurs écrivent 0');
{
  const f = (x) => E.tarifsDepuisFormulaire(x);
  const inter = f({ frais: { aucun: true }, majoration: { aucune: true }, devis: { gratuit: true }, taux: '62' });
  verifier('les trois interrupteurs écrivent 0 : « Déplacement offert », « Je ne majore pas », « Mes devis sont gratuits »',
    inter.ok && inter.valeurs.frais_deplacement_centimes === 0 && inter.valeurs.majoration_pct === 0
    && inter.valeurs.prix_devis_centimes === 0, json(inter));
  const t0 = f({ taux: '0' });
  const t00 = f({ taux: '0,00' });
  const m0 = f({ majoration: { pct: '0' } });
  const d0 = f({ devis: { montant: '0' } });
  verifier('un « 0 » TAPÉ est refusé, avec SA phrase et SON champ — taux, majoration, devis',
    !t0.ok && t0.champ === 'taux_horaire_centimes' && t0.message === E.MESSAGE_TAUX_ZERO
    && !t00.ok && t00.message === E.MESSAGE_TAUX_ZERO
    && !m0.ok && m0.champ === 'majoration_pct' && m0.message === E.MESSAGE_MAJORATION_ZERO
    && !d0.ok && d0.champ === 'prix_devis_centimes' && d0.message === E.MESSAGE_DEVIS_ZERO,
    `${json(t0)} ${json(m0)} ${json(d0)}`);
  const lu = f({ taux: '62,50', majoration: { pct: '40 %' }, devis: { montant: '30' } });
  verifier('« 62,50 » → 6 250 ; « 40 % » → 40 ; « 30 » → 3 000',
    lu.ok && lu.valeurs.taux_horaire_centimes === 6250 && lu.valeurs.majoration_pct === 40
    && lu.valeurs.prix_devis_centimes === 3000, json(lu));
  const gagne = f({ frais: { aucun: true, montant: '35', texte: 'x' } });
  verifier('l’interrupteur des frais l’emporte sur un montant tapé',
    gagne.ok && gagne.valeurs.frais_deplacement_centimes === 0 && gagne.valeurs.frais_deplacement_texte === null);
  const vide = f({});
  verifier('rien de tapé → tout `null`, et `affiche` faux : un `null` n’est pas un `0`',
    vide.ok && E.COLONNES_ECRITES.tarifs_pro.filter((c) => c !== 'affiche').every((c) => vide.valeurs[c] === null)
    && vide.valeurs.affiche === false, json(vide));
  verifier('les valeurs rendues sont exactement les colonnes écrites de `tarifs_pro`',
    egalEnsembles(Object.keys(lu.valeurs), E.COLONNES_ECRITES.tarifs_pro), json(Object.keys(lu.valeurs)));
  verifier('un pourcentage à virgule ou en lettres est refusé avec une phrase',
    !f({ majoration: { pct: '40,5' } }).ok && /pourcentage/.test(f({ majoration: { pct: 'quarante' } }).message || ''));
}

console.log('\n  12. les refus, miroirs des contraintes de la base');
{
  const v = (t) => E.validerTarifs(t);
  const refuse = (r, nom) => r.ok === false && r.contrainte === nom;
  verifier('afficher sans AUCUN tarif → `tarif_affiche_check`', refuse(v({ affiche: true }), 'tarif_affiche_check'));
  verifier('afficher le SEUL prix du devis (même gratuit) → passe : un dépanneur au forfait peut afficher',
    v({ affiche: true, prix_devis_centimes: 0 }).ok && v({ affiche: true, prix_devis_centimes: 3000 }).ok);
  verifier('afficher la seule majoration, ou le seul décompte → refusé : ils ne disent pas un prix',
    refuse(v({ affiche: true, majoration_pct: 40 }), 'tarif_affiche_check')
    && refuse(v({ affiche: true, decompte_temps_texte: 'au quart d’heure' }), 'tarif_affiche_check'));
  verifier('afficher des conditions seules, ou un taux seul → passe',
    v({ affiche: true, frais_deplacement_texte: 'gratuit à 20 km' }).ok && v({ affiche: true, taux_horaire_centimes: 6200 }).ok);
  verifier('taux 99 centimes → `tarif_taux_horaire_check` ; 1 000 € passe, un centime de plus non',
    refuse(v({ taux_horaire_centimes: 99 }), 'tarif_taux_horaire_check')
    && refuse(v({ taux_horaire_centimes: 0 }), 'tarif_taux_horaire_check')
    && v({ taux_horaire_centimes: 100000 }).ok && refuse(v({ taux_horaire_centimes: 100001 }), 'tarif_taux_horaire_check'));
  verifier('majoration 201 % → `tarif_majoration_check` ; 0 et 200 passent',
    refuse(v({ majoration_pct: 201 }), 'tarif_majoration_check') && v({ majoration_pct: 0 }).ok && v({ majoration_pct: 200 }).ok);
  verifier('un devis à -1 ou à plus de 1 000 € → `tarif_devis_check`',
    refuse(v({ prix_devis_centimes: -1 }), 'tarif_devis_check') && refuse(v({ prix_devis_centimes: 100001 }), 'tarif_devis_check'));
  const long = v({ decompte_temps_texte: 'x'.repeat(201) });
  verifier('un décompte de 201 caractères → `tarif_decompte_texte_check`, et PAS `tarif_frais_texte_check`',
    refuse(long, 'tarif_decompte_texte_check') && long.champ === 'decompte_temps_texte'
    && v({ decompte_temps_texte: 'x'.repeat(200) }).ok, json(long));
  /* L'ordre alphabétique fait passer `tarif_decompte_texte_check` en
     premier : la vérification ci-dessus ne verrait donc pas un miroir des
     FRAIS qui regarderait aussi le décompte. On l'interroge seul. */
  verifier('…et le miroir de `tarif_frais_texte_check` ne regarde QUE le texte des frais',
    E.CONTRAINTES.tarifs_pro.tarif_frais_texte_check({ decompte_temps_texte: 'x'.repeat(301) }) === null
    && E.CONTRAINTES.tarifs_pro.tarif_frais_texte_check({ frais_deplacement_texte: 'x'.repeat(301) })
      === 'frais_deplacement_texte');
  verifier('`affiche` envoyé `null` devient faux, et un décompte de blancs devient `null`',
    E.nettoyerTarifs({ affiche: null }).affiche === false
    && E.nettoyerTarifs({ decompte_temps_texte: ' \n ' }).decompte_temps_texte === null);
}

console.log('\n  13. les heures majorées, dites et calculées');
{
  const m = T.HEURES_MAJOREES.match(/de (\d+)\s*h à (\d+)\s*h/);
  const debut = m ? Number(m[1]) : NaN;
  const fin = m ? Number(m[2]) : NaN;
  const n = U.estNuitOuWeekend;
  verifier('19 h 59 un mardi → jour ; 20 h → nuit ; 6 h 59 → nuit ; 7 h → jour ; samedi et dimanche midi → week-end',
    n(jourDe(MARDI, 19, 59)) === false && n(jourDe(MARDI, 20, 0)) === true && n(jourDe(MARDI, 6, 59)) === true
    && n(jourDe(MARDI, 7, 0)) === false && n(jourDe(SAMEDI, 12, 0)) === true && n(jourDe(DIMANCHE, 12, 0)) === true);
  verifier('`HEURES_MAJOREES` dit EXACTEMENT ce que calcule `estNuitOuWeekend`',
    Number.isInteger(debut) && Number.isInteger(fin)
    && n(jourDe(MARDI, debut - 1, 59)) === false && n(jourDe(MARDI, debut, 0)) === true
    && n(jourDe(MARDI, fin - 1, 59)) === true && n(jourDe(MARDI, fin, 0)) === false
    && /samedi/.test(T.HEURES_MAJOREES) && /dimanche/.test(T.HEURES_MAJOREES),
    `« ${T.HEURES_MAJOREES} » : l’aide du formulaire dirait des heures qu’Opus n’applique pas.`);
}

console.log('\n  14. la démonstration, et `urgences.js` allégé');
{
  const d = (cle, pros = proProfiles) => T.artisansDisponiblesDemo(cle, { sos: U.SOS_ARTISANS, tarifs: TARIFS_DEMO, pros });
  const plomb = d('plomberie');
  verifier('plomberie → UN artisan, la fiche 4 : la fiche 8 n’affiche pas ses tarifs',
    plomb.artisans.length === 1 && String(plomb.artisans[0].proId) === '4' && plomb.nonAffichables === 0, json(plomb));
  const serr = d('serrurerie').artisans;
  verifier('serrurerie → un déplacement offert (0)', serr.length === 1 && serr[0].tarifs.frais_deplacement_centimes === 0);
  verifier('chauffage → une majoration à 0 ; électricité → un devis à 30 €',
    d('chauffage').artisans[0].tarifs.majoration_pct === 0
    && d('electricite').artisans[0].tarifs.prix_devis_centimes === 3000);
  const maconne = { ...proProfiles, 4: { ...proProfiles[4], metier: 'macon', metiers: ['macon'] } };
  verifier('une fiche dont le métier ne correspond pas est écartée', d('plomberie', maconne).artisans.length === 0);
  const brut = sansCommentaires(lire('src/data/tarifs-demo.js'));
  const bloc = (brut.match(/export const TARIFS_DEMO = Object\.freeze\(\{([\s\S]*?)\n\}\);/) || [])[1] || '';
  const clesEcrites = [...bloc.matchAll(/^\s{2}([^\s:]+):/gm)].map((x) => x[1]);
  verifier('aucune clé de `TARIFS_DEMO` n’est un nombre, et chaque `pro_id` est la chaîne de sa clé',
    clesEcrites.length >= 5 && clesEcrites.every((k) => /^'\d+'$/.test(k))
    && Object.entries(TARIFS_DEMO).every(([k, t]) => typeof t.pro_id === 'string' && t.pro_id === k),
    `${clesEcrites.join(', ')} — un \`===\` entre 4 et '4' rend faux, et le bloc ne s’afficherait jamais.`);
  verifier('les fiches 2, 4, 6, 7 affichent des tarifs complets ; la 8 n’affiche pas',
    ['2', '4', '6', '7'].every((k) => T.pretPourLeSos(TARIFS_DEMO[k]).pret) && TARIFS_DEMO['8'].affiche === false);
  const moi = proProfiles[1];
  const etat = T.etatReglageSos({ sos: MES_SOS_DEMO, sosMetier: T.metierSosDeLaFiche(moi.metiers || [moi.metier]),
    interrupteur: false, tarifs: null, aDesCoordonnees: true });
  verifier('`mesSos` de démonstration porte la ligne orpheline « electricite », et l’état dit « orpheline »',
    MES_SOS_DEMO.lignes.some((l) => l.metierKey === 'electricite' && l.actif === true) && etat.cle === 'orpheline',
    json(etat));
  verifier('`urgences.js` n’exporte plus `estimation` ni `artisansDisponibles`',
    !('estimation' in U) && !('artisansDisponibles' in U)
    && egalEnsembles(Object.keys(U), ['CRENEAUX_SOS', 'METIERS_SOS', 'PROBLEMES', 'SOS_ARTISANS', 'estNuitOuWeekend']),
    `exports : ${Object.keys(U).join(', ')}`);
  const AUTORISEES = ['proId', 'metierKey', 'distanceKm', 'delaiMin', 'actif'];
  verifier('`SOS_ARTISANS` ne porte plus aucun chiffre de tarif',
    U.SOS_ARTISANS.every((a) => Object.keys(a).every((k) => AUTORISEES.includes(k))));
  const urg = sansCommentaires(lire('src/data/urgences.js'));
  const demo = sansCommentaires(lire('src/data/tarifs-demo.js'));
  verifier('`urgences.js` et `tarifs-demo.js` n’importent RIEN',
    !/^\s*import\s/m.test(urg) && !/\brequire\(/.test(urg) && !/^\s*import\s/m.test(demo),
    '`tarifs.js` importe `urgences.js` : l’inverse ferait une boucle.');
  const tar = sansCommentaires(lire('src/lib/tarifs.js'));
  const imports = [...tar.matchAll(/^\s*import[\s\S]*?from\s+'([^']+)'/gm)].map((x) => x[1]);
  verifier('`tarifs.js` n’importe que `./emetteur.js` et `../data/urgences.js`, avec l’extension',
    egalEnsembles(imports, ['./emetteur.js', '../data/urgences.js']) && !/\brequire\(/.test(tar),
    `${imports.join(', ')} — un import qui tire React Native ferait planter ce contrôle.`);
}

console.log('\n  et les phrases des refus de la base (cahier §3)');
{
  const NOMS = ['tarif_affiche_check', 'tarif_taux_horaire_check', 'tarif_majoration_check', 'tarif_devis_check',
    'tarif_decompte_texte_check', 'sos_rayon_check', 'sos_delai_check',
    'sos_availability_majoration_check', 'sos_availability_metier_key_check'];
  const table = (n) => (n.startsWith('tarif_') ? 'tarifs_pro' : 'sos_availability');
  const muettes = NOMS.filter((n) => {
    const err = Object.assign(new Error(`new row for relation "${table(n)}" violates check constraint "${n}"`),
      { code: '23514' });
    const m = messageClair(err, 'Vos tarifs');
    return !MESSAGES_CONTRAINTE[n] || /schema\.sql/.test(m) || m !== `Vos tarifs : ${MESSAGES_CONTRAINTE[n]}`;
  });
  verifier('les contraintes du lot et les deux anciennes du SOS DISENT quoi corriger, sans parler de schéma',
    muettes.length === 0, muettes.join(', '));
  const sansPhrase = Object.keys(E.CONTRAINTES.tarifs_pro).filter((n) => !MESSAGES_CONTRAINTE[n]);
  verifier('chaque miroir de `tarifs_pro` a sa phrase', sansPhrase.length === 0, sansPhrase.join(', '));
}

/* ================================================================== */
/*  B. LA LISTE FERMÉE DES COLONNES DE `tarifs_pro`                    */
/* ================================================================== */
console.log('\nB. LA LISTE FERMÉE — chaque colonne de `tarifs_pro` est lisible par les particuliers quand on affiche');

/* Le même petit lecteur que `verifier-emetteur` : il retire `-- …` et
   `/* … *​/` SANS toucher à ce qui est entre apostrophes. */
function sqlSansCommentaires(sql) {
  let sortie = '';
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === '\'') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === '\'' && sql[j + 1] === '\'') { j += 2; continue; }
        if (sql[j] === '\'') break;
        j += 1;
      }
      sortie += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
    } else if (c === '/' && sql[i + 1] === '*') {
      const fin = sql.indexOf('*/', i + 2);
      i = fin < 0 ? sql.length : fin + 2;
    } else {
      sortie += c;
      i += 1;
    }
  }
  return sortie;
}

/* Le contenu entre une parenthèse ouvrante et SA fermante. */
function entreParentheses(texte, iOuvrante) {
  let profondeur = 0;
  for (let i = iOuvrante; i < texte.length; i += 1) {
    if (texte[i] === '(') profondeur += 1;
    else if (texte[i] === ')') {
      profondeur -= 1;
      if (profondeur === 0) return texte.slice(iOuvrante + 1, i);
    }
  }
  return null;
}

{
  const SCHEMA = sqlSansCommentaires(lire('supabase/schema.sql'));
  const colonnes = new Set();
  /* 1. toutes les formes `create table … public.tarifs_pro ( … )` */
  for (const m of SCHEMA.matchAll(/create table (?:if not exists )?public\.tarifs_pro\s*\(/gi)) {
    const corps = entreParentheses(SCHEMA, m.index + m[0].length - 1) || '';
    let profondeur = 0;
    let morceau = '';
    const morceaux = [];
    for (const c of corps) {
      if (c === '(') profondeur += 1;
      if (c === ')') profondeur -= 1;
      if (c === ',' && profondeur === 0) { morceaux.push(morceau); morceau = ''; } else morceau += c;
    }
    morceaux.push(morceau);
    for (const p of morceaux) {
      const nom = (p.trim().match(/^([a-z_][a-z0-9_]*)\s+\S/i) || [])[1];
      if (nom && !/^(constraint|primary|unique|check|foreign|exclude|like)$/i.test(nom)) colonnes.add(nom.toLowerCase());
    }
  }
  /* 2. tous les `alter table … public.tarifs_pro … add column [if not exists] x`,
        où qu'ils soient — y compris dans un bloc `do` de la section 47. */
  for (const m of SCHEMA.matchAll(/alter table (?:if exists )?(?:only )?public\.tarifs_pro\b([^;]*);/gi)) {
    for (const a of m[1].matchAll(/add column (?:if not exists )?([a-z_][a-z0-9_]*)/gi)) colonnes.add(a[1].toLowerCase());
  }
  const schema = [...colonnes];
  const attendues = [...E.COLONNES_ECRITES.tarifs_pro, 'pro_id', 'affiche_le'];
  const enTrop = schema.filter((c) => !attendues.includes(c));
  const manquantes = attendues.filter((c) => !schema.includes(c));
  verifier('15. les colonnes de `tarifs_pro` dans le schéma = `COLONNES_ECRITES.tarifs_pro` + `pro_id` + `affiche_le`',
    schema.length > 0 && enTrop.length === 0 && manquantes.length === 0,
    `dans le schéma sans être dans la liste : ${enTrop.join(', ') || 'aucune'} ; dans la liste sans exister dans `
    + `le schéma : ${manquantes.join(', ') || 'aucune'}. Toute colonne de \`tarifs_pro\` devient lisible par tous `
    + 'les particuliers connectés pour l’artisan qui affiche ses tarifs.');
  verifier('…et `affiche_le` n’est PAS écrite par l’application : c’est la base qui date le geste',
    !E.COLONNES_ECRITES.tarifs_pro.includes('affiche_le'));
  const INTERNES = /(marge|achat|reference|cout_revient|debourse)/i;
  const internes = [...new Set([...schema, ...E.COLONNES_ECRITES.tarifs_pro])].filter((c) => INTERNES.test(c));
  verifier('16. aucune colonne ne porte un nom de prix INTERNE (marge, achat, référence, coût de revient, déboursé)',
    internes.length === 0, `${internes.join(', ')} : un prix interne n’entre JAMAIS dans une table qu’on affiche. `
    + 'Il vivra dans une table à lui, privée.');
}

/* ================================================================== */
/*  C. SQL ↔ JAVASCRIPT                                                */
/* ================================================================== */
console.log('\nC. SQL ↔ JAVASCRIPT — la base et la démonstration disent la même chose');

/* Le schéma, lu UNE fois, sans ses commentaires — et ses morceaux, isolés
   d'un début à SA fin. Une propriété se vérifie DANS l'objet, jamais
   « quelque part dans les 300 caractères » (la faute du 11/10). */
const SCHEMA_BRUT = lire('supabase/schema.sql');
const SCHEMA = sqlSansCommentaires(SCHEMA_BRUT);
const morceau = (texte, debut, fin) => {
  const i = texte.indexOf(debut);
  if (i < 0) return '';
  const j = texte.indexOf(fin, i + debut.length);
  return texte.slice(i, j < 0 ? undefined : j + fin.length);
};
const TETE_47 = '--  47. LES TARIFS RÉUNIS';
const sectionDuSchema = (brut, tete) => {
  const i = brut.indexOf(tete);
  if (i < 0) return '';
  const suite = /^--  \d+\. /gm;
  suite.lastIndex = i + tete.length;
  const m = suite.exec(brut);
  return sqlSansCommentaires(brut.slice(i, m ? m.index : undefined));
};
const SECTION_46 = sectionDuSchema(SCHEMA_BRUT, '--  46. MON ENTREPRISE POUR MES DEVIS');
const SECTION_47 = sectionDuSchema(SCHEMA_BRUT, TETE_47);
const fonctionSql = (nom) => morceau(SCHEMA, `create or replace function public.${nom}(`, '$$;');
const URGENCE = fonctionSql('artisans_urgence');
const RATTRAPAGE = morceau(SECTION_47, 'do $tarifs_47$', '$tarifs_47$;');
const bornesDe = (nom) => {
  const c = morceau(SECTION_46 + SECTION_47, `add constraint ${nom}\n`, ';');
  const m = c.match(/between (\d+) and (\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};

{
  /* 17. Les quatre paires d'urgence : `metier_du_sos()` = `METIERS_SOS` =
         les quatre clés de `sos_availability.metier_key`. Une clé ajoutée
         d'un seul côté éteindrait au rattrapage une disponibilité juste,
         ou ferait apparaître un artisan sur le mauvais métier. */
  const sql = [...fonctionSql('metier_du_sos').matchAll(/when '([a-z_]+)'\s+then '([a-z_-]+)'/g)]
    .map((m) => `${m[1]}→${m[2]}`);
  const js = U.METIERS_SOS.map((m) => `${m.key}→${m.metier}`);
  const cle = SCHEMA.match(/metier_key\s+text not null\s+check \(metier_key in \(([^)]*)\)\)/);
  const cles = cle ? [...cle[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
  verifier('17. `metier_du_sos()` = `METIERS_SOS` = les clés de `sos_availability.metier_key`',
    sql.length === 4 && egalEnsembles(sql, js) && egalEnsembles(cles, U.METIERS_SOS.map((m) => m.key))
    && js.every((p) => T.metierDuSos(p.split('→')[0]) === p.split('→')[1]),
    `SQL : ${sql.join(', ') || '(introuvable)'} ; JS : ${js.join(', ')} ; clés de la table : ${cles.join(', ')}.`);
}

{
  /* 18. Le `where` d'`artisans_urgence` et `pretPourLeSos` testent les
         MÊMES colonnes de tarifs : sinon la démonstration montrerait un
         artisan que la base cache, ou l'inverse — et le réglage d'urgence
         dirait « vous apparaissez » à quelqu'un qui n'apparaît pas. */
  const where = (URGENCE.match(/\bwhere\b([\s\S]*?)\border by\b/) || [])[1] || '';
  const sql = [...new Set([...where.matchAll(/\bt\.(\w+)\s+is\s+(?:not null|true)\b/g)].map((m) => m[1]))];
  const js = T.CONDITIONS_DU_SOS.map((c) => c.colonne);
  verifier('18. le `where` d’`artisans_urgence` : la ligne active, le métier sur la FICHE, les tarifs affichés et complets',
    /\bsa\.actif\b/.test(where) && /\bt\.affiche is true\b/.test(where)
    && ['frais_deplacement_centimes', 'taux_horaire_centimes', 'majoration_pct'].every((c) => new RegExp(`\\bt\\.${c} is not null\\b`).test(where))
    && /pp\.metiers @> array\[public\.metier_du_sos\(sa\.metier_key\)\]/.test(where),
    'Répondre aux urgences exige d’afficher ses tarifs (réponse du 19/10, question 1) ; sans un montant '
    + 'de déplacement, un taux et une majoration, aucune estimation n’est calculable.');
  verifier('…et `pretPourLeSos` teste EXACTEMENT les mêmes colonnes de tarifs',
    sql.length === 4 && egalEnsembles(sql, js),
    `SQL : ${sql.join(', ') || '(introuvable)'} ; JS : ${js.join(', ')}.`);
}

{
  /* 19. Les bornes du rattrapage = celles des contraintes de 47.3, en
         centimes. Elles sont écrites deux fois parce que les contraintes
         n'existent pas encore quand le rattrapage tourne : une valeur copiée
         hors des bornes ferait échouer la migration de la vraie base. */
  const frais = RATTRAPAGE.match(/sa\.deplacement > 0 and sa\.deplacement <= (\d+)/);
  const taux = RATTRAPAGE.match(/sa\.horaire >= (\d+) and sa\.horaire <= (\d+)/);
  const maj = RATTRAPAGE.match(/sa\.majoration between (\d+) and (\d+)/);
  const bFrais = bornesDe('tarif_frais_check');
  const bTaux = bornesDe('tarif_taux_horaire_check');
  const bMaj = bornesDe('tarif_majoration_check');
  verifier('19. les bornes du rattrapage = celles des contraintes, converties en centimes',
    !!(frais && taux && maj && bFrais && bTaux && bMaj)
    && Number(frais[1]) * 100 === bFrais[1]
    && Number(taux[1]) * 100 === bTaux[0] && Number(taux[2]) * 100 === bTaux[1]
    && Number(maj[2]) === bMaj[1] && Number(maj[1]) === Math.max(1, bMaj[0]),
    `rattrapage : frais ≤ ${frais && frais[1]} €, taux ${taux && `${taux[1]}–${taux[2]}`} €, majoration `
    + `${maj && `${maj[1]}–${maj[2]}`} % ; contraintes : ${JSON.stringify({ bFrais, bTaux, bMaj })}. Et seul ce qui `
    + 'est STRICTEMENT positif se copie : un 0 du SOS ne prouve rien.');
}

{
  /* 20. Les bornes des contraintes = celles des miroirs, éprouvées aux deux
         bords : le miroir rend la MÊME décision que la base, au centime. */
  const bords = [
    ['tarif_taux_horaire_check', 'taux_horaire_centimes'],
    ['tarif_majoration_check', 'majoration_pct'],
    ['tarif_devis_check', 'prix_devis_centimes'],
    ['tarif_frais_check', 'frais_deplacement_centimes'],
  ];
  const fautes = [];
  for (const [nom, col] of bords) {
    const b = bornesDe(nom);
    if (!b) { fautes.push(`${nom} introuvable`); continue; }
    const v = (x) => E.validerTarifs({ [col]: x });
    if (!v(b[0]).ok) fautes.push(`${col}=${b[0]} refusé`);
    if (!v(b[1]).ok) fautes.push(`${col}=${b[1]} refusé`);
    if (v(b[0] - 1).contrainte !== nom) fautes.push(`${col}=${b[0] - 1} → ${v(b[0] - 1).contrainte}`);
    if (v(b[1] + 1).contrainte !== nom) fautes.push(`${col}=${b[1] + 1} → ${v(b[1] + 1).contrainte}`);
  }
  verifier('20. les bornes de `tarifs_pro` = celles des miroirs `CONTRAINTES.tarifs_pro`, aux deux bords',
    fautes.length === 0, fautes.join(' ; '));
  const bR = bornesDe('sos_rayon_check');
  const bD = bornesDe('sos_delai_check');
  const s = (rayon, delai) => T.reglageSosDepuisSaisie({ actif: true, rayon: String(rayon), delai: String(delai) });
  verifier('…et celles du rayon et du délai = `BORNES_SOS` = ce que `reglageSosDepuisSaisie` accepte',
    !!(bR && bD) && egalListes(bR, [...T.BORNES_SOS.rayonKm]) && egalListes(bD, [...T.BORNES_SOS.delaiMinutes])
    && s(bR[0], 45).ok && s(bR[1], 45).ok && !s(bR[0] - 1, 45).ok && !s(bR[1] + 1, 45).ok
    && s(20, bD[0]).ok && s(20, bD[1]).ok && !s(20, bD[0] - 1).ok && !s(20, bD[1] + 1).ok,
    `SQL : rayon ${json(bR)}, délai ${json(bD)} ; JS : ${json(T.BORNES_SOS)}.`);
}

{
  /* 20 bis. « Un bloc affiché n'est jamais vide » : les colonnes que
     `tarif_affiche_check` accepte comme un prix = celles qui, seules,
     passent le miroir. Les bornes ne suffisent pas à relier les deux
     côtés : une contrainte qui exigerait un taux (la règle de la version 1)
     fermerait l'affichage aux dépanneurs au forfait, en base seulement, et
     la démonstration dirait le contraire. */
  const c = morceau(SECTION_47, 'add constraint tarif_affiche_check\n', ';').replace(/\s+/g, ' ');
  const sql = /check \(affiche is not true or [\w ]+\)/.test(c)
    ? [...c.matchAll(/\bor (\w+) is not null\b/g)].map((m) => m[1]) : [];
  const SEULS = {
    frais_deplacement_centimes: 4500, frais_deplacement_texte: 'Gratuit jusqu’à 20 km',
    taux_horaire_centimes: 6200, prix_devis_centimes: 0, majoration_pct: 40, decompte_temps_texte: 'Au quart d’heure',
  };
  const js = Object.entries(SEULS).filter(([col, v]) => E.validerTarifs({ affiche: true, [col]: v }).ok).map(([col]) => col);
  verifier('20 bis. ce que `tarif_affiche_check` accepte comme un prix = ce que le miroir accepte, seul',
    sql.length === 4 && egalEnsembles(sql, js) && !sql.includes('majoration_pct') && !sql.includes('decompte_temps_texte'),
    `SQL : ${sql.join(', ') || '(introuvable)'} ; miroir : ${js.join(', ')}. Afficher n’exige qu’UN tarif : `
    + 'des frais, un taux ou le prix d’un devis — jamais la majoration seule.');
}

/* ================================================================== */
/*  D. LES PROPRIÉTÉS DU SCHÉMA, lues dans le texte                    */
/* ================================================================== */
console.log('\nD. LE SCHÉMA — la section 47, lue comme des propriétés');

{
  /* 21. La place : après le dernier objet de la 46, avant l'export RGPD. */
  const i46 = SCHEMA_BRUT.indexOf('comment on function public.emetteur_incomplet(uuid) is');
  const i47 = SCHEMA_BRUT.indexOf(TETE_47);
  const i42 = SCHEMA_BRUT.indexOf('--  42. L\'EXPORT RGPD');
  const iPortes = SCHEMA_BRUT.indexOf('do $portes$');
  verifier('21. la section 47 vient après le dernier objet de la 46, et avant l’export RGPD ; aucun déclencheur après le balayage',
    i46 > 0 && i47 > i46 && i42 > i47 && iPortes > i42
    && !/create (or replace )?trigger/.test(sqlSansCommentaires(SCHEMA_BRUT.slice(iPortes))),
    'L’export RGPD (42) et le balayage des portes (43) restent les deux derniers blocs : une fonction '
    + 'de déclencheur née après le balayage resterait appelable par `/rest/v1/rpc`, sans compte.');
}

{
  /* 22. `artisans_urgence` : une seule définition, en section 47, même
         signature et même type de retour qu'hier, `security invoker`, un
         `join` et pas un `left join`, et des droits pour les connectés
         seulement. Le type exact rendu (`integer` au lieu d'`int`) est relevé
         dans le catalogue par l'essai (cas 9). */
  const RETOUR_D_HIER = 'professional_id uuid, entreprise text, metier text, ville text, avatar_url text, '
    + 'verifie boolean, deplacement numeric, horaire numeric, majoration int, delai_minutes int, distance double precision';
  const normal = (x) => x.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
  const definitions = (SCHEMA.match(/create or replace function public\.artisans_urgence\(/g) || []).length;
  const retour = (URGENCE.match(/\)\s*returns table \(([\s\S]*?)\)\s*language/) || [])[1] || '';
  const tete = URGENCE.slice(0, URGENCE.indexOf(' as $$'));
  const droits = (nom, signature) => {
    const s = signature.replace(/[()]/g, '\\$&');
    const apres = SCHEMA.slice(SCHEMA.indexOf(`create or replace function public.${nom}(`));
    const fin = apres.indexOf('$$;');
    const suite = apres.slice(fin + 3, fin + 600);
    return new RegExp(`^\\s*revoke all on function public\\.${nom}${s}\\s+from public, anon;\\s*`
      + `grant execute on function public\\.${nom}${s}\\s+to authenticated;`).test(suite)
      && !new RegExp(`grant [^;]*public\\.${nom}\\b[^;]*to [^;]*\\b(anon|public)\\b`, 'i').test(SCHEMA);
  };
  verifier('22. `artisans_urgence` : définie UNE fois, en section 47, `language sql stable`, jamais `security definer`',
    definitions === 1 && SECTION_47.includes('create or replace function public.artisans_urgence(')
    && /language sql stable/.test(tete) && !/security definer/i.test(URGENCE),
    'Elle lit `tarifs_pro` à travers « tarifs affiches » : en `security definer`, elle rendrait les tarifs '
    + 'affichés à n’importe quel compte, artisans compris — la réponse du 19/10 tomberait sans un mot.');
  verifier('…sa signature et son type de retour sont ceux d’HIER, colonne pour colonne',
    /artisans_urgence\(\s*p_metier_key text, p_lat double precision, p_lon double precision\s*\)/.test(URGENCE)
    && normal(retour) === RETOUR_D_HIER,
    `Trouvé : ${normal(retour) || '(introuvable)'}. L’icône « preview » du 17/10 l’appelle encore, et le connecteur `
    + 'refuse le `drop function` qu’un changement de type exigerait.');
  verifier('…un `join public.tarifs_pro`, pas un `left join` : un artisan sans tarifs n’a rien à montrer',
    /\bjoin public\.tarifs_pro t\b/.test(URGENCE) && !/left\s+join public\.tarifs_pro/i.test(URGENCE),
    'avec un `left join`, ses `null` deviendraient des `0` par `Number(null)`');
  verifier('…et juste après elle : `revoke all … from public, anon`, `grant execute … to authenticated` seulement',
    droits('artisans_urgence', '(text, double precision, double precision)'),
    'PostgreSQL accorde `execute` à PUBLIC sur toute fonction neuve, et Supabase l’accorde à `anon` : '
    + '`from anon` seul ne retire rien (section 38).');
  const metier = fonctionSql('metier_du_sos');
  verifier('…même règle pour `metier_du_sos` : une définition, en section 47, `immutable`, droits aux connectés seulement',
    (SCHEMA.match(/create or replace function public\.metier_du_sos\(/g) || []).length === 1
    && SECTION_47.includes('create or replace function public.metier_du_sos(')
    && /\bimmutable\b/.test(metier) && !/security definer/i.test(metier)
    && droits('metier_du_sos', '(text)'));
  verifier('…et elle naît AVANT le rattrapage, qui l’appelle',
    SECTION_47.indexOf('create or replace function public.metier_du_sos(') < SECTION_47.indexOf('do $tarifs_47$')
    && /public\.metier_du_sos\(sa\.metier_key\)/.test(RATTRAPAGE),
    'Une fonction appelée par un bloc qui tourne doit exister quand il tourne.');
}

{
  /* 23. Le `foreach` de la section 11 bis ne la nomme plus : elle y était
         accordée avant d'exister (section 14), donc seulement au second
         rejouage. Ses droits vivent avec elle, en 47. */
  verifier('23. la section 11 bis ne nomme plus `artisans_urgence`',
    !/'public\.artisans_urgence\(/.test(SCHEMA),
    'Un droit accordé dans une boucle qui avale `undefined_function` ne l’est qu’au second passage.');
}

{
  /* 24. Le rattrapage ne tourne qu'UNE fois, n'écrase rien, n'allume rien. */
  const iGarde = RATTRAPAGE.search(/if exists \(select 1 from information_schema\.columns[\s\S]*?column_name = 'taux_horaire_centimes'\) then\s+return;/);
  const iAlter = RATTRAPAGE.indexOf('alter table public.tarifs_pro');
  const ajouts = [...RATTRAPAGE.matchAll(/add column (if not exists )?(\w+)/g)];
  const conflit = (RATTRAPAGE.match(/on conflict \(pro_id\) do update set([\s\S]*?);/) || [])[1] || '';
  const affectations = [...conflit.matchAll(/(\w+)\s*=\s*([\s\S]*?)(?=,\s*\w+\s*=|$)/g)].map((m) => [m[1], m[2].trim()]);
  const iZero = RATTRAPAGE.search(/update public\.sos_availability\s+set deplacement = 0, horaire = 0, majoration = 0/);
  const iEteint = RATTRAPAGE.search(/update public\.sos_availability sa\s+set actif = false/);
  verifier('24. le rattrapage commence par sa garde (la colonne existe → `return`), AVANT son `alter table`',
    iGarde >= 0 && iAlter > iGarde,
    'Rejoué, il ressusciterait un taux que l’artisan a retiré depuis : `schema.sql` se rejoue.');
  verifier('…chaque `add column` porte `if not exists`, et il y en a six',
    ajouts.length === 6 && ajouts.every((m) => m[1]),
    'Une base où une seule des colonnes existe déjà ne doit pas faire échouer tout le schéma.');
  verifier('…il n’allume JAMAIS `affiche` : rendre public est un geste de l’artisan',
    !/\baffiche\s*=\s*true\b/i.test(RATTRAPAGE) && !/\bset\s+affiche\b/i.test(RATTRAPAGE)
    && !/\baffiche\s*=\s*excluded/i.test(RATTRAPAGE));
  verifier('…il n’écrase jamais une valeur déclarée : chaque colonne passe par `coalesce(t.…` ou par le `case` des frais',
    affectations.length === 3
    && affectations.every(([col, val]) => (col === 'frais_deplacement_centimes'
      ? /^case\s+when t\.frais_deplacement_centimes is null and t\.frais_deplacement_texte is null\s+then excluded\.frais_deplacement_centimes\s+else t\.frais_deplacement_centimes end$/.test(val)
      : new RegExp(`^coalesce\\(t\\.${col}, excluded\\.${col}\\)$`).test(val))),
    json(affectations));
  verifier('…et il remet les colonnes mortes à 0 AVANT d’éteindre les disponibilités orphelines',
    iZero >= 0 && iEteint > iZero,
    'Aucune ligne ne doit jamais être réécrite avec un chiffre non nul.');
}

{
  /* 25. Aucun agrégat sur les tarifs de plusieurs artisans — en MOT ENTIER :
         `min(` en sous-chaîne accuserait `est_admin(` (relecture base, 10). */
  const fonctions = [...SCHEMA.matchAll(
    /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\bas\s+(\$\w*\$)([\s\S]*?)\3/gi,
  )].map((m) => ({ nom: m[1], corps: m[4] }));
  const AGREGAT = /(?<![\w$])(avg|sum|min|max|stddev|median)\s*\(|percentile_|\bgroup\s+by\b/i;
  const lisent = fonctions.filter((f) => /\btarifs_pro\b/.test(f.corps));
  const agregent = lisent.filter((f) => AGREGAT.test(f.corps)).map((f) => f.nom);
  verifier(`25. aucune fonction qui lit \`tarifs_pro\` ne calcule une moyenne, un minimum ou un regroupement (${lisent.length} la lisent)`,
    fonctions.length >= 60 && lisent.length >= 3 && agregent.length === 0,
    `${agregent.join(', ')} — pas de prix conseillé, pas de « votre tarif face aux autres » `
    + '(docs/DONNEES-DES-ARTISANS.md) : même un agrégat révèle qui s’écarte, sur un marché de huit fiches.');
}

{
  /* 26. L'export RGPD : la disponibilité de l'artisan, et les urgences des
         DEUX côtés — comme 'devis' et 'rappels'. */
  const md = fonctionSql('mes_donnees');
  verifier('26. `mes_donnees()` exporte `ma_disponibilite_urgences` et `urgences`, des deux côtés',
    /'ma_disponibilite_urgences',\s*coalesce\(\(select jsonb_agg\(to_jsonb\(x\) order by x\.metier_key\)\s+from public\.sos_availability x\s+where x\.professional_id = auth\.uid\(\)\), '\[\]'::jsonb\)/.test(md)
    && /'urgences',\s*coalesce\(\(select jsonb_agg\(to_jsonb\(x\)\) from public\.sos_requests x\s+where x\.client_id = auth\.uid\(\) or x\.professional_id = auth\.uid\(\)\), '\[\]'::jsonb\)/.test(md),
    'Une demande d’urgence porte l’adresse et les coordonnées du particulier : c’est une donnée sur lui '
    + '(article 15), et sur l’artisan à qui elle est adressée. Elles manquaient depuis le premier jour.');
}

{
  /* 27. `sos_availability` : ses droits, ses bornes, et ses colonnes MORTES. */
  const refus = fonctionSql('refuse_les_colonnes_mortes_du_sos');
  const sansDo = SCHEMA.replace(/\bdo\s+(\$\w*\$)[\s\S]*?\1\s*;/g, '');
  const mortes = morceau(SECTION_47, 'do $mortes_47$', '$mortes_47$;');
  verifier('27. `anon` ne fait plus que lire `sos_availability`, et `authenticated` perd `truncate`',
    /revoke insert, update, delete, truncate on public\.sos_availability from anon;/.test(SECTION_47)
    && /revoke truncate on public\.sos_availability from authenticated;/.test(SECTION_47),
    'Un `truncate` ignore la RLS : un seul ordre viderait les disponibilités de tous les artisans.');
  verifier('…`sos_rayon_check` et `sos_delai_check` sont posées',
    !!bornesDe('sos_rayon_check') && !!bornesDe('sos_delai_check'),
    '« ma dispo sos » est `for all` : un rayon de 100 000 km ferait apparaître un artisan dans la '
    + 'recherche de tous les particuliers.');
  verifier('…le refus des colonnes mortes lit la ligne par `to_jsonb(new)`, jamais `new.deplacement`, et lève OP012',
    /to_jsonb\(new\)/.test(refus) && !/\bnew\.(deplacement|horaire|majoration)\b/.test(refus)
    && /errcode = 'OP012'/.test(refus),
    'Le jour où ces colonnes seront retirées, `new.deplacement` ferait échouer TOUTE écriture sur la table.');
  verifier('…son déclencheur est `before insert or update on public.sos_availability`',
    /create or replace trigger trg_refuse_les_colonnes_mortes_du_sos\s+before insert or update on public\.sos_availability\s+for each row execute function public\.refuse_les_colonnes_mortes_du_sos\(\);/.test(SECTION_47));
  verifier('…et leurs commentaires vivent DANS un bloc qui teste l’existence de la colonne',
    !/comment on column public\.sos_availability\.(deplacement|horaire|majoration)\b/.test(sansDo)
    && /information_schema\.columns[\s\S]*table_name = 'sos_availability'/.test(mortes)
    && /execute format\('comment on column public\.sos_availability\.%I is %L'/.test(mortes),
    'Un `comment on column` sur une colonne retirée échouerait : le schéma ne se rejouerait plus.');
}

{
  /* 28. La date du geste, branche par branche — chacune ISOLÉE : une
         vérification « quelque part dans la fonction » laisse passer une
         branche cassée (la faute du lot I). */
  const f = fonctionSql('tient_les_tarifs_publics');
  const i1 = f.indexOf('if not new.affiche then');
  const i2 = f.indexOf('elsif tg_op = \'UPDATE\' and old.affiche is true then', i1);
  const i3 = f.indexOf('else', i2 + 5);
  const i4 = f.indexOf('end if;', i3);
  const eteint = i1 < 0 || i2 < 0 ? '' : f.slice(i1, i2);
  const reste = i2 < 0 || i3 < 0 ? '' : f.slice(i2, i3);
  const allume = i3 < 0 || i4 < 0 ? '' : f.slice(i3, i4);
  verifier('28. `affiche_le` : vidée quand on éteint, gardée tant que c’est allumé, posée par `clock_timestamp()` quand on allume',
    /^if not new\.affiche then\s+new\.affiche_le := null;\s*$/.test(eteint.trim())
    && /^elsif tg_op = 'UPDATE' and old\.affiche is true then\s+new\.affiche_le := old\.affiche_le;\s*$/.test(reste.trim())
    && /^else\s+new\.affiche_le := clock_timestamp\(\);\s*$/.test(allume.trim())
    && (f.match(/new\.affiche_le :=/g) || []).length === 3 && !/\bnow\(\)/.test(f),
    'Une date que le téléphone peut écrire ne prouve rien ; et une date qui bouge à chaque mise à jour '
    + 'du taux ne dirait plus QUAND l’artisan a choisi d’afficher.');
  verifier('…et elle naît d’un déclencheur `before insert or update on public.tarifs_pro`, `security invoker`',
    /create or replace trigger trg_tient_les_tarifs_publics\s+before insert or update on public\.tarifs_pro\s+for each row execute function public\.tient_les_tarifs_publics\(\);/.test(SECTION_47)
    && /security invoker/.test(f.slice(0, f.indexOf(' as $$'))));
}

/* Les politiques de `tarifs_pro`, partout dans le fichier, sans
   commentaires : la même lecture pour 29 et 29 bis. */
const POLITIQUES_TARIFS = [...SCHEMA.matchAll(/create policy "([^"]+)" on public\.tarifs_pro\b[^;]*;/g)]
  .map((m) => ({ nom: m[1], texte: m[0].replace(/\s+/g, ' ') }));

{
  /* 29. `anon` n'a toujours rien sur `tarifs_pro` (section 46.5). */
  verifier('29. aucun `grant` à `anon` sur `tarifs_pro`, aucune politique `to anon` ni `to public`',
    !/grant [^;]*on [^;]*public\.tarifs_pro\b[^;]*to [^;]*\b(anon|public)\b/i.test(SCHEMA)
    && POLITIQUES_TARIFS.length > 0 && POLITIQUES_TARIFS.every((p) => !/\bto (anon|public)\b/.test(p.texte)),
    'Aucun écran ne s’ouvre sans session : un droit pour `anon` n’aurait aucun lecteur, et rendrait les '
    + 'tarifs de tous les artisans qui les affichent à une seule requête sans compte.');
}

{
  /* 29 bis. LES TARIFS AFFICHÉS NE VONT QU'AUX PARTICULIERS — réponse du
     propriétaire du 19/10. (a) « mes tarifs » est la seule à nommer
     `est_mon_entreprise`, et la seule qui n'est pas `for select` ; (b) toute
     autre est `for select to authenticated`, et son `using`, normalisé, est
     EXACTEMENT la conjonction des trois termes, dans n'importe quel ordre,
     sans `or` ; (c) il y en a UNE et une seule. Les politiques `select`
     s'additionnent en OU : une seconde `using (affiche is true)` posée à
     côté de la bonne rouvrirait les lignes affichées aux artisans. */
  const ecriture = POLITIQUES_TARIFS.filter((p) => !/\bfor select\b/.test(p.texte));
  const lecture = POLITIQUES_TARIFS.filter((p) => /\bfor select\b/.test(p.texte));
  const termes = (p) => {
    const u = (p.texte.match(/\busing \((.*)\) ?;$/) || [])[1];
    if (u == null || /\bor\b/i.test(u) || /\bwith check\b/i.test(p.texte)) return null;
    return u.trim().split(/\s+and\s+/i).map((t) => t.trim()).sort();
  };
  const ATTENDUS = ['affiche is true', 'not public.est_masque(pro_id)', 'not public.est_un_pro()'].sort();
  const fautives = lecture.filter((p) => !/for select to authenticated using/.test(p.texte)
    || json(termes(p)) !== json(ATTENDUS));
  verifier('29 bis. les tarifs AFFICHÉS ne sont lus que par les PARTICULIERS : une seule politique de lecture, et exactement ses trois termes',
    ecriture.length === 1 && ecriture[0].nom === 'mes tarifs'
    && POLITIQUES_TARIFS.filter((p) => /est_mon_entreprise/.test(p.texte)).length === 1
    && /est_mon_entreprise/.test(ecriture[0].texte)
    && lecture.length === 1 && fautives.length === 0,
    `${POLITIQUES_TARIFS.length} politique(s) : ${POLITIQUES_TARIFS.map((p) => p.nom).join(', ')} ; fautives : `
    + `${fautives.map((p) => p.nom).join(', ') || 'aucune'}. Les tarifs affichés ne sont lus que par les particuliers `
    + '(décision du 19/10) : une politique qui ne dit pas `not est_un_pro()` les ouvre aux autres artisans.');
}

/* ================================================================== */
/*  E. LES PROPRIÉTÉS DE L'APPLICATION                                 */
/* ================================================================== */
console.log('\nE. L’APPLICATION — ce qui s’écrit, et où');

/* Le corps d'une fonction, accolades comprises : on saute la liste de
   paramètres (qui porte ses propres accolades), puis on compte. */
function corpsDeFonction(texte, nom) {
  const i = texte.indexOf(`function ${nom}(`);
  if (i < 0) return null;
  let j = texte.indexOf('(', i);
  let p = 0;
  for (; j < texte.length; j += 1) {
    if (texte[j] === '(') p += 1;
    else if (texte[j] === ')') { p -= 1; if (p === 0) break; }
  }
  const debut = texte.indexOf('{', j);
  let a = 0;
  for (let k = debut; k < texte.length; k += 1) {
    if (texte[k] === '{') a += 1;
    else if (texte[k] === '}') { a -= 1; if (a === 0) return { debut: i, fin: k + 1 }; }
  }
  return null;
}

/* Le corps d'une fonction FLÉCHÉE exportée (`export const x = … => { … }`),
   accolades comprises : on part du nom, on prend la première flèche, et on
   compte. `null` si on ne la trouve pas — et la vérification le dit. */
function corpsFleche(texte, nom) {
  const i = texte.indexOf(`export const ${nom} =`);
  if (i < 0) return null;
  const f = texte.indexOf('=> {', i);
  if (f < 0) return null;
  const debut = texte.indexOf('{', f);
  let a = 0;
  for (let k = debut; k < texte.length; k += 1) {
    if (texte[k] === '{') a += 1;
    else if (texte[k] === '}') { a -= 1; if (a === 0) return texte.slice(i, k + 1); }
  }
  return null;
}
const corpsDe = (texte, nom) => {
  const c = corpsDeFonction(texte, nom);
  return c ? texte.slice(c.debut, c.fin) : null;
};
/* Le bloc qui suit `debut` (une condition `if (…) {`), accolades comprises. */
function blocApres(texte, debut, depuis = 0) {
  const i = texte.indexOf(debut, depuis);
  if (i < 0) return null;
  const o = texte.indexOf('{', i + debut.length - 1);
  let a = 0;
  for (let k = o; k < texte.length; k += 1) {
    if (texte[k] === '{') a += 1;
    else if (texte[k] === '}') { a -= 1; if (a === 0) return { debut: i, fin: k + 1, texte: texte.slice(i, k + 1) }; }
  }
  return null;
}
const plat = (x) => (x || '').replace(/\s+/g, ' ');

const API = sansCommentaires(lire('src/lib/api.js'));
const SOS = sansCommentaires(lire('src/screens/SosScreen.js'));
const EDIT = sansCommentaires(lire('src/screens/ProfilEditScreen.js'));
const ENTREPRISE = sansCommentaires(lire('src/components/MonEntreprise.js'));
const FICHE = sansCommentaires(lire('src/components/FicheEmetteur.js'));
const BLOC = existsSync('src/components/TarifsPublics.js') ? sansCommentaires(lire('src/components/TarifsPublics.js')) : '';
const PRO = sansCommentaires(lire('src/screens/ProfilProScreen.js'));
const OWN = sansCommentaires(lire('src/screens/ProfilOwnScreen.js'));
const APP = sansCommentaires(lire('src/OpusApp.js'));
const RECUES = sansCommentaires(lire('src/screens/DemandesRecuesScreen.js'));

{
  /* 30. L'API. Les tarifs du SOS arrivent en EUROS et se relisent en
     centimes par `depuisLaRecherche`, jamais `Number(x) * 100` ; une ligne
     illisible est COMPTÉE, et si aucune ne l'est, c'est une ERREUR — jamais
     « aucun artisan » devant une urgence ; la seconde lecture ne prend que
     des lignes AFFICHÉES ; plus aucun tarif n'est écrit dans
     `sos_availability`, dont les autres lignes sont éteintes ; la lecture
     de sa disponibilité rend une LISTE ; et `mesTarifs` n'alourdit pas le
     démarrage d'un particulier. */
  const cherche = corpsFleche(API, 'chercherArtisansUrgence') || '';
  const seconde = (cherche.match(/from\('tarifs_pro'\)[\s\S]*?;/) || [''])[0];
  const lance = /if \(lignes\.length > 0 && lues\.length === 0\) \{\s*throw new Error\(/.test(cherche);
  verifier('30. `chercherArtisansUrgence` relit par `depuisLaRecherche`, COMPTE les lignes illisibles, et LÈVE quand aucune ne l’est',
    cherche.length > 0 && /depuisLaRecherche\(a\)/.test(cherche)
    && /nonAffichables \+= 1/.test(cherche) && /return \{ artisans, nonAffichables \}/.test(cherche)
    && lance && !/Number\(a\.(deplacement|horaire|majoration)\)/.test(API),
    'une ligne jetée en silence ferait dire « aucun artisan » à un écran où il y en a — devant une urgence');
  verifier('30. …sa seconde lecture ne prend que des lignes AFFICHÉES (`.eq(\'affiche\', true)`), en lecture seule',
    /\.in\('pro_id', /.test(seconde) && /\.eq\('affiche', true\)/.test(seconde)
    && !/\.(upsert|insert|update|delete)\(/.test(seconde),
    'sans elle, le titulaire relirait sa ligne non affichée — et la croirait publique');
  const maj = corpsFleche(API, 'updateSosAvailability') || '';
  verifier('30. `updateSosAvailability` n’écrit plus aucun tarif ni `updated_at`, et éteint les autres lignes',
    maj.length > 0 && !/\b(deplacement|horaire|majoration|updated_at)\s*:/.test(maj)
    && /\.update\(\{ actif: false \}\)/.test(maj) && /\.neq\('metier_key', sos\.metierKey\)/.test(maj),
    'les colonnes mortes REFUSENT toute valeur non nulle (OP012) ; une ligne restée active sur un autre métier '
    + 'ne s’éteignait plus');
  const charge = corpsDe(API, 'loadAll') || '';
  const iSos = charge.indexOf("from('sos_availability')");
  const lectureSos = iSos < 0 ? '' : charge.slice(iSos, charge.indexOf("eq('professional_id', uid)", iSos) + 40);
  const selectsSos = [];
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js') && existsSync(f)).forEach((f) => {
      const c = sansCommentaires(lire(f));
      [...c.matchAll(/from\('sos_availability'\)\s*\.select\(([^)]*)\)/g)].forEach((m) => {
        if (/deplacement|horaire|majoration|'\*'/.test(m[1])) selectsSos.push(`${f} : ${m[1]}`);
      });
    });
  verifier('30. `loadAll` lit SA disponibilité comme une liste, sans tarif mort, et ne lit pas `mesTarifs`',
    lectureSos.length > 0 && !/maybeSingle|single\(/.test(lectureSos) && selectsSos.length === 0
    && !/mesTarifs/.test(charge),
    `${selectsSos.join(' | ') || ''} — un \`select('*')\` relirait les colonnes mortes ; \`mesTarifs\` dans \`loadAll\` `
    + 'ferait partir une lecture de tarifs pour chaque particulier');
}

{
  /* 31. L'ÉCRAN SOS : le calcul vit dans `tarifs.js`, l'erreur passe par
     `messageClair`, et l'état vide porte sur ce que l'écran MONTRE. */
  const importsUrgences = (SOS.match(/import \{([^}]*)\} from '\.\.\/data\/urgences'/) || [])[1] || '';
  verifier('31. `SosScreen` calcule par `tarifs.js` : ni `estimation` ni `estNuitOuWeekend` d’`urgences.js`',
    !/\bestimation\b|\bestNuitOuWeekend\b/.test(importsUrgences)
    && ['estimationSos', 'detailSos', 'conditionsSos', 'noteSos', 'majorationSos'].every((f) => new RegExp(`\\b${f}\\(`).test(SOS))
    && !/\{a\.(deplacement|horaire|majoration)\}/.test(SOS),
    'deux formules pour une estimation finissent par dire deux prix');
  verifier('31. …son erreur passe par `messageClair`, jamais `e.message` brut',
    /setErreur\(messageClair\(e, /.test(SOS) && !/setErreur\(\s*e\.message/.test(SOS),
    'c’était l’anglais de PostgREST à l’écran d’un particulier en urgence');
  /* Trouvés au navigateur le 19/10/2026 (étape 5 du lot T) : « Choisir »
     portait le presque-noir de `BtnMini` sur le rouge brique — 3,11 : 1 —
     dans une boîte de 36 points ; « Étape précédente » en faisait 15 ; et
     l'échec disait « vous pourrez réessayer » sans bouton pour le faire. */
  const style = (nom) => (SOS.match(new RegExp(`\\n\\s*${nom}:\\s*\\{([^}]*)\\}`)) || [])[1] || '';
  verifier('31. …« Choisir » : l’encre du rouge brique (`surFond(C.sos)`, le blanc), et 44 points de haut',
    /backgroundColor: C\.sos/.test(style('choisir')) && /minHeight: TOUCHE/.test(style('choisir'))
    && /color: surFond\(C\.sos\)/.test(style('choisirTexte'))
    && /<BtnMini\s+label="Choisir"\s+style=\{s\.choisir\}[\s\S]*?<Text style=\{s\.choisirTexte\}>Choisir<\/Text>\s*<\/BtnMini>/.test(SOS),
    'le presque-noir sur #B4432B ne donne que 3,11 : 1 — c’est LE geste d’une urgence');
  verifier('31. …« Étape précédente » fait 44 points, et un échec se relance d’un bouton « Réessayer »',
    /minHeight: TOUCHE/.test(style('retour'))
    && /\{!!erreur && \(\s*<View style=\{s\.erreurBloc\}>\s*<Text style=\{s\.erreur\}>\{erreur\}<\/Text>\s*<BtnOutline label="Réessayer" onPress=\{chercherArtisans\} \/>/.test(SOS),
    'un mot dans un paragraphe ne se touche pas au pouce');
  verifier('31. …et l’état vide porte sur la liste VISIBLE et sur ce que la base a rendu',
    /\bvisibles\.map\(/.test(SOS) && /rendus === 0/.test(SOS) && /rendus > 0 && visibles\.length === 0/.test(SOS)
    && !/artisans\.length === 0/.test(SOS),
    'une carte invisible ferait taire « Aucun artisan… » sans rien montrer à la place');
}

{
  /* 32. LE RÉGLAGE D'URGENCE de « Modifier mon profil » : il ne lit plus la
     forme d'avant (qui aurait éteint le SOS de tout artisan à
     l'enregistrement), ne remplace jamais un rayon vide en silence, dit son
     état par `etatReglageSos`, et rappelle que le devis reste dû. */
  const rangee = (EDIT.match(/\n\s*rangee:\s*\{([^}]*)\}/) || [])[1] || '';
  verifier('32. « Modifier mon profil » part de `reglageInitialSos`, plus de la forme d’avant',
    /const depart = reglageInitialSos\(\s*sos,/.test(EDIT) && /useState\(depart\.actif\)/.test(EDIT)
    && !/\bsos\.(actif|rayonKm|delaiMinutes)\b/.test(EDIT)
    && !/\bset(Deplacement|Horaire|Majoration)\b/.test(EDIT),
    'lire `sos.actif` sur une liste rend `undefined` : l’interrupteur s’éteint, et « Enregistrer » retire '
    + 'l’artisan des urgences sans un mot');
  verifier('32. …aucun `|| 20` ni `|| 45` : un rayon ou un délai vide est REFUSÉ, jamais remplacé',
    !/Number\([^)]*\)\s*\|\|\s*(20|45)\b/.test(EDIT) && /reglageSosDepuisSaisie\(\{/.test(EDIT));
  verifier('32. …son état vient d’`etatReglageSos`, ses rangées font 44 points, et le devis reste dû',
    /etatReglageSos\(\{/.test(EDIT) && /\{etatSos\.phrase\}/.test(EDIT)
    && /minHeight: TOUCHE/.test(rangee) && /style=\{\(\{ pressed \}\) => \[s\.rangee, s\.rangeeSos/.test(EDIT)
    && /un devis écrit reste dû dès le premier euro/.test(plat(EDIT)),
    'une estimation n’est pas un devis : après diagnostic, un devis écrit reste dû (relecture droit, I11)');
}

{
  /* 33. « MON ENTREPRISE » : la phrase du réglage d'urgence est REÇUE, jamais
     réécrite ; le bloc « Vos tarifs » attend la fiche LUE ; et les tarifs
     remontent à `OpusApp` après la lecture ET après l'enregistrement. */
  const bloc = ENTREPRISE.indexOf('<View style={s.blocTarifs}>');
  verifier('33. `MonEntreprise` reçoit la phrase d’`etatReglageSos`, et n’en écrit aucune à la main',
    (/\{etatSos\.phrase\}/.test(ENTREPRISE) || /etatReglageSos\(/.test(ENTREPRISE))
    && !/apparaîtrez|apparaissez|n’apparaissez/.test(ENTREPRISE),
    'deux phrases pour un seul état finissent par se contredire');
  const pourEntreprise = (APP.match(/const etatSosDeMaFiche = \(\(\) => \{[\s\S]*?\}\)\(\);/) || [''])[0];
  verifier('33. …et `OpusApp` la demande pour CET écran (`ecran: \'entreprise\'`)',
    /etatReglageSos\(\{[\s\S]*?ecran: 'entreprise',?[\s\S]*?\}\)/.test(pourEntreprise),
    'sans lui, « Mon entreprise » affichait « En enregistrant, cette disponibilité sera désactivée » au-dessus '
    + 'd’un bouton qui n’éteint rien');
  verifier('33. …son bloc « Vos tarifs » attend la fiche LUE (`donnees.etat === \'pret\'`)',
    bloc > 0 && /\{donnees\.etat === 'pret' && \(\s*<View style=\{s\.blocTarifs\}>/.test(ENTREPRISE),
    'pendant la lecture, `tarifs` vaut `null` : le bloc dirait « Non affichés » de tarifs qu’on n’a pas lus');
  verifier('33. …et `onTarifs` remonte les tarifs après la LECTURE et après l’ENREGISTREMENT',
    /if \(surTarifs\) surTarifs\(d\.tarifs \|\| null\);/.test(ENTREPRISE)
    /* `onTarifs` en SECOND argument, quel que soit ce qui suit : le lot 1 du
       devis y ajoute `surEmetteur` (le régime de TVA de la saisie). Le
       motif exigeait la parenthèse fermante juste après — une SYNTAXE, pas
       la propriété « les tarifs lus remontent ». */
    && /lireFiche\(setDonnees, onTarifs\b/.test(ENTREPRISE)
    && /if \(onTarifs\) onTarifs\(r\.tarifs/.test(ENTREPRISE),
    'sans elle, le réglage d’urgence garderait « vos tarifs n’ont pas pu être lus » après une lecture réussie');
}

{
  /* 34. LE BLOC DES TARIFS ET SES GARDES. Il ne teste pas `affiche` (il sert
     d'aperçu quand ils ne sont pas affichés) ; les deux fiches le gardent
     par `affiche === true`, JUSTE APRÈS le contact, dans le même ordre ;
     « Mes tarifs » dit QUI les voit, par la phrase de `tarifs.js` ; et
     aucun écran n'a de texte de remplacement. */
  const garde = (code) => /<FicheContactPro[^>]*\/>\s*\{tarifs && tarifs\.affiche === true && \(?\s*<TarifsPublics/.test(code);
  verifier('34. `TarifsPublics` ne teste pas `affiche` — la garde vit chez les fiches',
    BLOC.length > 0 && !/\baffiche\b/.test(BLOC) && /lignesTarifs\(tarifs\)/.test(BLOC),
    'il sert aussi d’aperçu dans « Mon entreprise » (« Ce que verraient les particuliers »), précisément '
    + 'quand ils ne sont pas affichés');
  verifier('34. …les deux fiches le gardent par `affiche === true`, juste après le contact',
    garde(PRO) && garde(OWN),
    'l’artisan voit sa page comme les particuliers : même composant, même ordre, même garde');
  const ecrites = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js') && f !== 'src/lib/tarifs.js' && existsSync(f))
    .filter((f) => /Visibles des particuliers connectés/.test(lire(f)));
  verifier('34. …« Mes tarifs » dit QUI les voit, par `QUI_VOIT_LES_TARIFS` — écrite UNE fois',
    /<TarifsPublics[^>]*titre="Mes tarifs"[^>]*quiLesVoit=\{QUI_VOIT_LES_TARIFS\}/.test(plat(OWN))
    && /import \{ QUI_VOIT_LES_TARIFS \} from '\.\.\/lib\/tarifs'/.test(OWN) && ecrites.length === 0,
    `${ecrites.join(', ')} — ses confrères ne voient pas ce bloc ; sans la phrase, il croirait que tout le monde le voit`);
  const REMPLACEMENT = /aucun tarif|prix non communiqu|tarifs non renseign/i;
  verifier('34. …et aucun texte de remplacement quand il n’y a rien à montrer',
    !REMPLACEMENT.test(PRO) && !REMPLACEMENT.test(BLOC),
    'à un autre artisan, « prix non communiqués » serait faux : ils existent peut-être, ils ne sont pas pour lui');
}

{
  /* 35. `OpusApp` : les tarifs d'un autre se relisent à CHAQUE ouverture,
     avant la sortie anticipée, et pour un PARTICULIER seulement — à la
     lecture ET à la transmission ; « Mes tarifs » vient de `mesTarifs`, lue
     dans la branche pro seulement. */
  const vue = (() => {
    const i = APP.indexOf('const viewProfile = async (proId, origine = null) => {');
    return i < 0 ? '' : (blocApres(APP, 'const viewProfile = async (proId, origine = null) => {') || { texte: '' }).texte;
  })();
  const iLecture = vue.indexOf("if (userType === 'particulier') chargerTarifsDuPro(proId);");
  const iSortie = vue.indexOf('if (connu && connu.portfolioCharge) return;');
  verifier('35. `viewProfile` relit les tarifs AVANT la sortie anticipée, pour un particulier seulement',
    iLecture > 0 && iSortie > iLecture && (vue.match(/chargerTarifsDuPro\(/g) || []).length === 1,
    'après la sortie anticipée, un artisan qui éteint ses tarifs resterait affiché pour la session ; sans la '
    + 'garde, un artisan lirait ce que la base lui refuse');
  verifier('35. …`ProfilProScreen` ne reçoit des tarifs que pour un particulier ; `ProfilOwnScreen`, `mesTarifs`',
    /tarifs=\{userType === 'particulier' \? tarifsAffiches\[viewedProId\] : null\}/.test(APP)
    && /<ProfilOwnScreen[\s\S]{0,400}tarifs=\{mesTarifs\}/.test(APP),
    'un particulier devenu pro dans la session (`devenirPro` ne remonte pas `OpusApp`) garderait l’ancien bloc');
  const pro = blocApres(APP, "if (type === 'pro') {");
  const appelsMesTarifs = [...APP.matchAll(/api\.mesTarifs\(/g)].map((m) => m.index);
  verifier('35. …et `api.mesTarifs` n’est appelée que dans la branche pro du démarrage',
    !!pro && appelsMesTarifs.length === 1 && appelsMesTarifs[0] > pro.debut && appelsMesTarifs[0] < pro.fin,
    'un particulier n’a pas de tarifs : la lecture ne part pas pour lui');
}

{
  /* 36. LE FORMULAIRE : quatre interrupteurs ; l'affichage dit QUI voit,
     par la phrase de `tarifs.js`, sans la formule de la version 2 ; tout
     part par `tarifsDepuisFormulaire` ; les quatre champs nouveaux sont lus
     (sinon fermer perdrait la saisie sans prévenir) ; un refus défile
     jusqu'à SA section ; la phrase de l'arrêté dit ce qu'on ne sait pas. */
  const f = plat(FICHE);
  verifier('36. `FicheEmetteur` : les quatre interrupteurs, dont « Afficher mes tarifs sur ma fiche »',
    ['Je ne facture pas de frais de déplacement', 'Je ne majore pas la nuit ni le week-end',
      'Mes devis sont gratuits', 'Afficher mes tarifs sur ma fiche']
      .every((l) => new RegExp(`<Interrupteur[^>]*libelle="${l}"`).test(f)));
  const affiche = (FICHE.match(/<Section ancre="affiche"[\s\S]*?<\/Section>/) || [''])[0];
  const phrasesAffiche = plat(affiche).split(/(?<=[.!?])\s+/);
  verifier('36. …la section « Afficher » dit QUI les voit par `QUI_VOIT_LES_TARIFS`, sans la formule de la version 2',
    affiche.length > 0 && /\{QUI_VOIT_LES_TARIFS\}/.test(affiche)
    && !/toute personne qui a un compte/.test(affiche)
    && phrasesAffiche.every((ph) => !/y compris[^.]*artisan/.test(ph)),
    'réponse du propriétaire du 19/10 : les particuliers connectés seulement');
  const memeEtat = corpsDe(FICHE, 'memeEtat') || '';
  const lit = corpsFleche(FICHE, 'lireTextes') || (FICHE.match(/const lireTextes = \(\) => \{[\s\S]*?\n {2}\};/) || [''])[0];
  verifier('36. …tout part par `tarifsDepuisFormulaire`, les quatre champs sont lus, l’affichage compte dans « a changé ? »',
    /const tarifs = tarifsDepuisFormulaire\(\{/.test(FICHE)
    && ['taux_montant', 'decompte', 'majoration_pct', 'devis_montant'].every((c) => new RegExp(`lu\\.${c} = `).test(lit))
    && /afficheTarifs: !!\(x && x\.afficheTarifs\)/.test(memeEtat),
    'sans les lectures, un taux tapé se perdrait à la fermeture sans « Quitter sans enregistrer » ; sans la '
    + 'normalisation, allumer puis éteindre ferait apparaître une fausse bande');
  const sectionDuChamp = (FICHE.match(/export const SECTION_DU_CHAMP = Object\.freeze\(\{([\s\S]*?)\}\);/) || [])[1] || '';
  verifier('36. …un refus défile jusqu’à SA section : `SECTION_DU_CHAMP` connaît les cinq colonnes',
    ['taux_horaire_centimes', 'majoration_pct', 'decompte_temps_texte', 'prix_devis_centimes']
      .every((c) => new RegExp(`${c}: 'frais'`).test(sectionDuChamp)) && /affiche: 'affiche'/.test(sectionDuChamp));
  verifier('36. …et la phrase de l’arrêté dit ce qu’on ne sait pas, sans « prudent » ni « pages en ligne »',
    /arrêté du 24 janvier 2017 \(art\. 3\)/.test(f) && /On ne sait pas encore si votre fiche Opus en est un\./.test(f)
    && !/prudent|pages en ligne/.test(f)
    && !/ceux de vos devis, ne sont montrés à personne|se règlent encore à part|Ceux-là s’affichent aux particuliers/.test(f),
    'le plan cite « tout espace en ligne » ; et les trois phrases de l’écart décrivaient un état fermé par ce lot');
}

{
  /* 37. Le 0 d'un taux, d'une majoration ou d'un prix de devis ne s'écrit
     QUE par un interrupteur, donc QUE dans `tarifsDepuisFormulaire`. Un
     écran qui l'écrirait ailleurs ferait dire « Mes devis sont gratuits »
     à un artisan qui n'a rien touché. La démonstration (`tarifs-demo.js`)
     DÉCLARE l'état d'une fiche, elle n'écrit rien : elle est hors de cette
     règle. */
  const ZERO_ECRIT = /\b(taux_horaire_centimes|majoration_pct|prix_devis_centimes)['"]?\s*:\s*0(?![\d.,])|\.(taux_horaire_centimes|majoration_pct|prix_devis_centimes)\s*=\s*0(?![\d.,=])/;
  const fichiers = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'],
    { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.js') && existsSync(f));
  const fautifs = [];
  let corpsTrouve = false;
  for (const f of fichiers) {
    if (f === 'src/data/tarifs-demo.js') continue;
    let texte = sansCommentaires(lire(f));
    if (f === 'src/lib/emetteur.js') {
      const c = corpsDeFonction(texte, 'tarifsDepuisFormulaire');
      if (c) { corpsTrouve = true; texte = texte.slice(0, c.debut) + texte.slice(c.fin); }
    }
    texte.split('\n').forEach((ligne, i) => { if (ZERO_ECRIT.test(ligne)) fautifs.push(`${f}:${i + 1}`); });
  }
  verifier('37. aucun écran n’écrit un taux, une majoration ou un prix de devis à 0 hors de `tarifsDepuisFormulaire`',
    corpsTrouve && fautifs.length === 0,
    corpsTrouve ? `${fautifs.join(', ')} — seul un interrupteur écrit 0.` : '`tarifsDepuisFormulaire` introuvable : '
      + 'ce contrôle a perdu sa cible.');
}

{
  /* 38. « TTC » suit la fourchette partout où elle s'affiche : la carte,
     le bandeau d'envoi, la demande reçue par l'artisan. Les tarifs sont
     déclarés toutes taxes comprises ; une fourchette sans unité se lirait
     hors taxes chez un artisan au régime réel. */
  verifier('38. « TTC » suit la fourchette : carte SOS, bandeau d’envoi, demande reçue',
    /\{prix\.min\} – \{prix\.max\} € TTC/.test(SOS)
    && /Estimation \$\{demande\.prixMin\}–\$\{demande\.prixMax\} € TTC/.test(APP)
    && /Estimation \{d\.prixMin\}–\{d\.prixMax\} € TTC/.test(RECUES));
}

/* ================================================================== */
/*  F. CE QUE LES RELECTURES DU 19/10/2026 ONT TROUVÉ                  */
/* ================================================================== */
/* Chaque vérification ci-dessous tient un défaut REPRODUIT par une des
   trois relectures adverses du lot T, puis corrigé. Elle vise la
   propriété, pas la phrase du jour, et s'éprouve en remettant le défaut. */
console.log('\nF. Ce que les relectures du 19/10/2026 ont trouvé');

/* Les propositions d'un texte, et qui y lit : la même règle que
   `verifier-legal` (les deux contrôles relisent des phrases sur QUI voit
   les tarifs). Une négation, un « artisan » ou « éditeur », un verbe de
   lecture, chacun en mot entier — `\b` ne voit pas une lettre accentuée. */
const propositionsDe = (texte) => String(texte || '').split(/\s*[.;:!?](?:\s+|$)|\s+—\s+/).filter(Boolean);
const NEGATION = /(^|[^\p{L}])(ne|ni|jamais|aucune?|personne)(?![\p{L}])|(^|[^\p{L}])n’/u;
const ARTISAN_OU_EDITEUR = /(^|[^\p{L}])(artisans?|éditeur)(?![\p{L}])/u;
const LIRE_OU_VOIR = /(^|[^\p{L}])(lire|lisent|lit|lisibles?|voir|voit|voient|verrait|verraient|consult\p{L}*|affich\p{L}*|montr\p{L}*)(?![\p{L}])/u;
const lecteursEnTrop = (texte) => propositionsDe(texte)
  .filter((p) => ARTISAN_OU_EDITEUR.test(p) && LIRE_OU_VOIR.test(p) && !NEGATION.test(p));

{
  /* 39. QUI VOIT, DIT SANS PROMETTRE UN VERROU — les phrases d'écran sur
     les lecteurs (relecture droit) : « depuis son compte » est la limite
     du second compte particulier, que ces phrases ne doivent pas nier ; et
     aucun artisan n'y est rangé parmi les lecteurs. */
  const quiVoit = [['QUI_VOIT_LES_TARIFS', T.QUI_VOIT_LES_TARIFS], ['QUI_VERRAIT_LES_TARIFS', T.QUI_VERRAIT_LES_TARIFS]];
  const fautes = quiVoit.filter(([, ph]) => typeof ph !== 'string' || !/particuliers connectés/.test(ph)
    || !/depuis son compte/.test(ph) || /aucun artisan ne (peut|pourra|pourrait)/.test(ph) || lecteursEnTrop(ph).length > 0);
  verifier('39. `QUI_VOIT_LES_TARIFS` et `QUI_VERRAIT_LES_TARIFS` : « particuliers connectés », « depuis son compte », aucun verrou promis',
    fautes.length === 0,
    `${fautes.map(([n]) => n).join(', ')} — un artisan peut ouvrir un second compte particulier : la phrase dit la `
    + 'barrière (« depuis son compte »), jamais « aucun artisan ne peut les voir »');
  const affiche = (FICHE.match(/<Section ancre="affiche"[\s\S]*?<\/Section>/) || [''])[0];
  const aideAllumee = plat((affiche.match(/\{afficheTarifs \? \(([\s\S]*?)\) : \(/) || [])[1] || '')
    .replace(/<\/?Aide>|\{QUI_VOIT_LES_TARIFS\}/g, ' ');
  const enTrop = lecteursEnTrop(aideAllumee);
  verifier('39. …et l’aide « allumé » de « Afficher mes tarifs » ne range aucun artisan parmi les lecteurs',
    aideAllumee.trim().length > 0 && enTrop.length === 0,
    `${enTrop.join(' | ') || 'aide « allumé » introuvable'} — les tarifs affichés ne vont qu’aux particuliers`);
  const ecritesVerrait = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js') && f !== 'src/lib/tarifs.js' && existsSync(f))
    .filter((f) => /seuls les particuliers connectés les\s+verraient|ils ne servent qu’à\s+préparer vos devis/.test(lire(f)));
  verifier('39. …l’aperçu NON affiché dit QUI les verrait, au conditionnel (`QUI_VERRAIT_LES_TARIFS`)',
    /quiLesVoit=\{tarifsAffiches \? QUI_VOIT_LES_TARIFS : QUI_VERRAIT_LES_TARIFS\}/.test(plat(ENTREPRISE))
    && ecritesVerrait.length === 0,
    `${ecritesVerrait.join(', ')} — sous « Ce que verraient les particuliers », le présent « Visibles des `
    + 'particuliers… » disait faux : à cet instant, personne ne les voit');
  /* LA PHRASE DE L'ARRÊTÉ, sans guillemets : le texte n'a pas été relu sur
     Légifrance (le propriétaire ne l'a pas recopié, le 19/10). Des
     guillemets en feraient une citation qu'on n'a pas vérifiée. */
  const f = plat(FICHE);
  const arrete = (f.match(/\(art\. 3\)([\s\S]*?)On ne sait pas encore/) || [])[1];
  verifier('39. …la phrase de l’arrêté reste SANS guillemets : la citation n’a pas été relue sur Légifrance',
    typeof arrete === 'string' && !/[«»"“”]/.test(arrete),
    'une citation entre guillemets qu’on n’a pas recopiée depuis le texte officiel engagerait l’éditeur');
}

{
  /* 40. CE QUE SONT DES TARIFS NON AFFICHÉS — une phrase, `TARIFS_NON_AFFICHES`,
     et la MAJORATION jamais rangée parmi ce qui sert aux devis (relecture
     droit : « ils ne servent qu'à préparer vos devis » y comptait la
     majoration, qui ne sert qu'aux urgences). */
  const ph = T.TARIFS_NON_AFFICHES || '';
  const majo = ph.split(/[.;]/).filter((p) => /majoration/.test(p));
  verifier('40. `TARIFS_NON_AFFICHES` : la majoration ne sert qu’aux urgences, jamais aux devis',
    ph.length > 0 && majo.length > 0 && majo.every((p) => /urgences/.test(p) && !/devis/.test(p))
    && !/ne servent qu’à préparer vos devis/.test(ph) && lecteursEnTrop(ph).length === 0, ph);
  verifier('40. …et les deux écrans la lisent, sans la réécrire',
    /Vos tarifs ne s’affichent nulle part\. \$\{TARIFS_NON_AFFICHES\}/.test(FICHE)
    && /Non affichés\. \$\{TARIFS_NON_AFFICHES\}/.test(ENTREPRISE),
    '« Mon entreprise » en lecture et l’aide de l’interrupteur éteint disent la même chose, une fois');
}

{
  /* 41. LES BLANCS INVISIBLES (relecture base) : des conditions faites d'un
     U+200B passaient `tarif_affiche_check` sans aucun prix. Les deux
     déclencheurs de `tarifs_pro` et le miroir rognent le MÊME jeu. */
  const decoder = (e) => e.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  const jeuDe = (fonction, colonne) => {
    const m = fonctionSql(fonction).match(new RegExp(
      `new\\.${colonne} := nullif\\(btrim\\(coalesce\\(new\\.${colonne}, ''\\),\\s*E'((?:[^'\\\\]|\\\\.)*)'\\), ''\\);`));
    return m ? [...new Set(decoder(m[1]))].sort().join('') : null;
  };
  const js = [...new Set(E.BLANCS_TARIFS || '')].sort().join('');
  const frais = jeuDe('tient_les_tarifs', 'frais_deplacement_texte');
  const decompte = jeuDe('tient_les_tarifs_publics', 'decompte_temps_texte');
  const invisibles = ['\u00a0', '\u200b', '\u200c', '\u200d', '\u2060', '\ufeff'];
  verifier('41. les textes des tarifs rognent les blancs INVISIBLES — même jeu dans les deux déclencheurs et le miroir',
    !!frais && frais === decompte && frais === js && invisibles.every((c) => js.includes(c)),
    `SQL frais ${JSON.stringify(frais)}, SQL décompte ${JSON.stringify(decompte)}, JS ${JSON.stringify(js)} — un `
    + 'tarif fait d’un caractère invisible ne doit pas s’afficher comme déclaré');
  const invisible = E.validerTarifs({ frais_deplacement_texte: '\u200b', decompte_temps_texte: '\ufeff\u00a0', affiche: true });
  verifier('41. …et le miroir refuse d’afficher des conditions invisibles sans aucun prix',
    invisible.ok === false && invisible.contrainte === 'tarif_affiche_check', json(invisible));
}

{
  /* 42. LA LIGNE ENTIÈRE (relecture base) : PostgreSQL vérifie les
     contraintes sur la ligne PROPOSÉE d'un upsert, avant de résoudre le
     conflit. Le formulaire envoie donc toujours les sept colonnes, et la
     démonstration valide la ligne proposée, seule, comme la base. */
  const r = E.tarifsDepuisFormulaire({ frais: {}, taux: '62', decompte: '', majoration: { aucune: true },
    devis: { gratuit: true }, affiche: true });
  const cles = r.ok ? Object.keys(r.valeurs).sort() : [];
  verifier('42. `tarifsDepuisFormulaire` rend la ligne ENTIÈRE — les colonnes de `COLONNES_ECRITES.tarifs_pro`, toutes',
    r.ok && egalListes(cles, [...E.COLONNES_ECRITES.tarifs_pro].sort()), json(cles));
  const demo = corpsDe(API, 'enregistrerEmetteurDemo') || '';
  verifier('42. …et la démonstration valide la ligne PROPOSÉE avant la fusion, comme PostgreSQL',
    /const proposee = pourLaBase\('tarifs_pro', tarifs \|\| \{\}\);/.test(demo)
    && /const refusP = validerTarifs\(proposee\);/.test(demo)
    && demo.indexOf('validerTarifs(proposee)') < demo.indexOf('validerTarifs(lt)'),
    'valider seulement la fusion acceptait un envoi partiel que la vraie base refuse : le mode démonstration '
    + 'masquerait l’erreur (CLAUDE.md)');
}

{
  /* 43. « MES TARIFS » PENDANT LA LECTURE (relecture application) : un
     état qui le DIT, jamais « non affichés » ; une lecture qui ne bloque
     pas le démarrage et qui a un délai ; et une réponse tardive qui
     n'écrase pas ce que « Mon entreprise » vient d'écrire. */
  const PLOMB = U.METIERS_SOS.find((m) => m.key === 'plomberie');
  const base = { sos: { lignes: [{ metierKey: 'plomberie', actif: true }] }, sosMetier: PLOMB, interrupteur: true,
    enregistre: true, aDesCoordonnees: true };
  const pendant = T.etatReglageSos({ ...base, tarifs: { chargement: true } });
  verifier('43. `etatReglageSos` : des tarifs EN COURS de lecture → « en cours », jamais « non affichés »',
    pendant.cle === 'tarifs_en_cours' && !/pas affichés/.test(pendant.phrase), pendant.phrase);
  const pro = blocApres(APP, "if (type === 'pro') {");
  const branche = pro ? pro.texte : '';
  verifier('43. …le démarrage n’ATTEND pas `mesTarifs`, la lit avec un délai, et dit « en cours » pendant ce temps',
    !/await api\.mesTarifs\(/.test(APP) && /const lecture = api\.mesTarifs\(\);/.test(branche)
    && /avecDelai\(lecture, \d+/.test(branche)
    && /setMesTarifs\(\{ chargement: true \}\)/.test(branche),
    'une requête qui ne revient jamais laissait l’artisan sur le squelette de démarrage pour toujours');
  verifier('43. …et une réponse plus ancienne que la dernière écriture est JETÉE (génération)',
    /generationMesTarifs\.current === generation/.test(branche) && /onTarifs=\{recevoirMesTarifs\}/.test(APP)
    && /const recevoirMesTarifs = useCallback\(\(t\) => \{\s*generationMesTarifs\.current \+= 1;/.test(APP),
    'une lecture de démarrage lente rendait à l’écran des tarifs que l’artisan venait de retirer');
  const lit = (APP.match(/const chargerTarifsDuPro = useCallback\(async \(proId\) => \{[\s\S]*?\n {2}\}, \[\]\);/) || [''])[0];
  verifier('43. …la fiche d’un autre : aucun ancien tarif pendant la relecture, un délai, la dernière lecture seule',
    lit.indexOf('retirer();') > 0 && lit.indexOf('retirer();') < lit.indexOf('await ')
    && /avecDelai\(api\.tarifsAffichesDe\(proId\), \d+/.test(lit) && /if \(derniere\(\)\)/.test(lit),
    'la fiche montrait l’ancien prix pendant la relecture, et pour toujours si elle ne revenait pas');
}

{
  /* 44. LE MÉTIER RETIRÉ SANS ENREGISTRER (relecture application) : la
     fiche en base le porte encore ; la phrase est au FUTUR. */
  const ligne = { sos: { lignes: [{ metierKey: 'plomberie', actif: true }] }, sosMetier: null,
    interrupteur: true, aDesCoordonnees: true };
  const PLOMB = U.METIERS_SOS.find((m) => m.key === 'plomberie');
  const retire = T.etatReglageSos({ ...ligne, sosMetierEnBase: PLOMB });
  const orpheline = T.etatReglageSos({ ...ligne });
  verifier('44. un métier d’urgence retiré DANS LE FORMULAIRE : « En enregistrant sans ce métier… », jamais « vous n’y apparaissez plus »',
    retire.cle === 'metier_retire' && /^En enregistrant sans ce métier/.test(retire.phrase)
    && !/n’y apparaissez plus/.test(retire.phrase) && orpheline.cle === 'orpheline',
    `${retire.phrase} / ${orpheline.cle}`);
  verifier('44. …et « Modifier mon profil » lui donne le métier d’urgence de la fiche ENREGISTRÉE',
    /sosMetierEnBase: metierSosDeLaFiche\(metiersDeDepart\)/.test(EDIT)
    && /const depart = reglageInitialSos\(sos, metiersDeDepart\);/.test(EDIT));
}

{
  /* 45. L'ÉCRAN SOS (relecture application) : un artisan absent de `pros`
     s'affiche avec ce que la recherche rend de lui ; une adresse sans
     position est refusée SOUS SON CHAMP, sans « Réessayer » qui tourne en
     rond ; et la note dit « de nuit et de week-end ». */
  const demo = T.artisansDisponiblesDemo('plomberie', { sos: U.SOS_ARTISANS, tarifs: TARIFS_DEMO, pros: proProfiles });
  verifier('45. la recherche rend la FICHE de chaque artisan (nom, ville, photo, badge), en base comme en démonstration',
    demo.artisans.length > 0 && demo.artisans.every((a) => a.fiche && typeof a.fiche.entreprise === 'string')
    && /fiche: \{\s*entreprise: a\.entreprise/.test(corpsFleche(API, 'chercherArtisansUrgence') || ''),
    json(demo.artisans.map((a) => a.fiche)));
  verifier('45. …et la carte ne disparaît plus quand la fiche manque à `pros` — sans note, qu’on ne connaît pas',
    /const pro = connue \|\| \(a\.fiche && a\.fiche\.entreprise \? \{ id: a\.proId, \.\.\.a\.fiche \} : null\);/.test(SOS)
    && /const note = connue \? avgReviews\(pro\) : null;/.test(SOS) && !/if \(!pros\[a\.proId\]\)/.test(SOS),
    'un artisan inscrit après le démarrage restait invisible, et « Réessayer » relançait la même recherche');
  const cherche = corpsDe(SOS, 'chercherArtisans') || (SOS.match(/const chercherArtisans = async \(\) => \{[\s\S]*?\n {2}\};/) || [''])[0];
  verifier('45. une adresse sans position est refusée SOUS SON CHAMP, avant de chercher, et le filet ramène au champ',
    /if \(exigeCoordonnees && sansPosition\) \{\s*setErreurAdresse\(ADRESSE_SANS_POSITION\);/.test(cherche)
    && cherche.indexOf('exigeCoordonnees && sansPosition') < cherche.indexOf("setEtape('artisans')")
    && /if \(e && e\.champ === 'adresse'\)/.test(cherche)
    && /exigeCoordonnees=\{hasSupabase\}/.test(APP)
    && /throw Object\.assign\(new Error\(ADRESSE_SANS_POSITION\), \{ champ: 'adresse' \}\)/.test(APP),
    'avant : « La recherche d’artisans : Choisissez… », et un « Réessayer » qui relançait la même erreur');
}

{
  /* 46. UNE COLONNE QUE LA BASE N'A PAS (relecture application) : en
     français, jamais l'anglais de PostgREST — l'application en avance sur
     la base, la panne que CLAUDE.md raconte. */
  const m1 = messageClair({ code: 'PGRST204', message: "Could not find the 'affiche' column of 'tarifs_pro' in the schema cache" });
  const m2 = messageClair({ code: '42703', message: 'column tarifs_pro.affiche does not exist' });
  verifier('46. `messageClair` : PGRST204 et 42703 en français, la colonne nommée, la piste du schéma',
    [m1, m2].every((m) => /n’a pas encore reçu la mise à jour/.test(m) && /« affiche »/.test(m)
      && !/could not find|does not exist|schema cache/i.test(m)), `${m1} / ${m2}`);
}

{
  /* 47. LES PHRASES QUI DATENT LE GESTE (relecture application) : la date
     « Affichés depuis le … » suit l'interrupteur du FORMULAIRE, et le vert
     qui la porte se lit sur le fond (`okTexte`, recalculé par
     `verifier-cibles`). */
  verifier('47. « Affichés depuis le … » ne contredit pas l’interrupteur éteint sans enregistrer',
    /\{afficheTarifs\s*\?\s*`Affichés depuis le \$\{afficheLe\}\.`\s*:\s*`Affichés depuis le \$\{afficheLe\} : ils cesseront de l’être quand vous enregistrerez\.`\s*\}/.test(FICHE),
    'la phrase « ne s’affichent nulle part » et « Affichés depuis le … » se suivaient');
  verifier('47. …et elle est écrite dans le vert LISIBLE (`C.okTexte`)',
    /declare: \{[^}]*color: C\.okTexte/.test(FICHE));
}

{
  /* 48. LA COLONNE QUE PERSONNE NE TIENT (relecture base) : `updated_at`
     de `sos_availability` est figée depuis le lot T, et la base le DIT. */
  verifier('48. `sos_availability.updated_at` : la base dit qu’elle n’est plus tenue',
    /comment on column public\.sos_availability\.updated_at is\s*'NON TENUE/.test(SECTION_47));
}

{
  /* 49. LA DATE D'UN HORODATAGE se lit à l'heure du téléphone (trouvé sur la
     vraie base dans la nuit du 19 au 20/10/2026, vers 1 h 20 : « Affichés
     depuis le 19/10 »). La base rend `affiche_le` en UTC ; ses dix premiers
     caractères donnaient la veille toute la nuit. Une colonne `date`, elle,
     reste une chaîne. On FAIT TOURNER la fonction dans TROIS fuseaux : Paris
     (été ET hiver), les Antilles (à l'ouest de Greenwich, là où une date lue
     comme un instant tomberait la veille) et Kiritimati (UTC+14). Un seul
     fuseau laissait passer deux défauts plausibles (relecture du 20/10). */
  const CAS = {
    'Europe/Paris': [
      ['2026-10-19T23:18:21.716617+00:00', '20/10/2026'],
      ['2026-10-19 23:18:21+00', '20/10/2026'],
      ['2026-10-19T21:59:59.999+00:00', '19/10/2026'],
      ['2026-12-19T22:30:00Z', '19/12/2026'],
      ['2026-12-19T23:30:00Z', '20/12/2026'],
    ],
    'America/Martinique': [
      ['2026-10-20T02:30:00+00:00', '19/10/2026'],
      ['2026-10-19 23:18:21-05', '20/10/2026'],
    ],
    'Pacific/Kiritimati': [
      ['2026-10-19T09:59:00Z', '19/10/2026'],
      ['2026-10-19T10:00:00Z', '20/10/2026'],
    ],
  };
  // Les mêmes dans tous les fuseaux : une date seule, une heure murale.
  const PARTOUT = [['2026-09-02', '02/09/2026'], ['2026-10-19T23:18:21', '19/10/2026'], [null, null], ['demain', null]];
  const avant = process.env.TZ;
  const faux = [];
  try {
    for (const [tz, cas] of Object.entries(CAS)) {
      process.env.TZ = tz;
      for (const [v, att] of cas.concat(PARTOUT)) {
        if (dateFrancaise(v) !== att) faux.push(`${tz} : ${v} → ${dateFrancaise(v)}, attendu ${att}`);
      }
    }
  } finally {
    if (avant === undefined) delete process.env.TZ; else process.env.TZ = avant;
  }
  verifier('49. `dateFrancaise` lit un horodatage à l’heure du téléphone (Paris été et hiver, Antilles, '
    + 'Kiritimati), et une date ou une heure murale comme elles sont écrites', !faux.length, faux.join(' ; '));

  /* …et la forme passée à `Date.parse` est celle que la spécification
     OBLIGE tout moteur à lire. `node` est plus tolérant que Hermes : il ne
     peut pas servir de juge, la forme si. */
  const STRICTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})?$/;
  const FORMES = ['2026-10-19T23:18:21.716617+00:00', '2026-10-19 23:18:21+00', '2026-10-19T23:18:21.5+00:00',
    '2026-10-19T23:18:21Z', '2026-10-19 23:18:21-05', '2026-10-19T23:18:21', '2026-10-19T23:18:21+0530',
    '2026-10-19 23:18'];
  const horsForme = FORMES.filter((f) => !STRICTE.test(isoLisible(f) || '')).map((f) => `${f} → ${isoLisible(f)}`);
  verifier('49 bis. Chaque forme d’horodatage est réécrite en « AAAA-MM-JJTHH:MM:SS.sss±hh:mm » avant Date.parse',
    !horsForme.length && isoLisible('2026-09-02') === null, horsForme.join(' ; '));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Les tarifs réunis : l’estimation, la fiche, le réglage d’urgence, le formulaire et la démonstration '
  + 'disent juste. Ce que le doigt en fera sur un iPhone, seul l’iPhone le dira.\n');
