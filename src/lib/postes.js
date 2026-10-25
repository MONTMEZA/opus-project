/**
 * LA BASE DE POSTES — le calcul, sans rien afficher (lot P, 24/10/2026).
 *
 * CE QUE CE FICHIER FAIT
 * ----------------------
 * Un poste, c'est une phrase que l'artisan a chiffrée une fois, rangée d'un
 * appui dans SA base (« Ajouter à ma base »), avec un PRIX DE RÉFÉRENCE
 * qu'il a fixé lui-même. Ici vit tout ce qui en décide, et que `node` fait
 * tourner (`verifier-postes`) :
 *   - les refus, miroirs des cinq contraintes de la section 50 de
 *     `schema.sql`, dans le même ordre que la base ;
 *   - la ligne qui PORTE un poste (même clé : phrase à une variante près,
 *     même unité, même fourniture), sa référence et l'écart (« Vous mettez
 *     52,00 € — c'est voulu ? ») ;
 *   - les propositions pendant la frappe : la base et la mémoire du lot 1
 *     dans UNE liste, une proposition par clé, trois au plus ;
 *   - ce que la feuille d'ajout et la page « Ma base de postes » écrivent.
 *
 * LES RÉPONSES DU PROPRIÉTAIRE QUI LE GOUVERNENT (23/10/2026)
 * -----------------------------------------------------------
 *   - « il faut arriver à reconnaître les phrases, parce que l'artisan pour
 *     le même travail a par exemple rajouté un s ; il ne faut pas qu'il y
 *     ait trop de propositions, ça pourrait nous perdre » : une proposition
 *     par CLÉ, trois au plus, et « ce poste existe déjà » au lieu d'un
 *     second poste ;
 *   - un poste n'entre dans la base que d'un appui ; la feuille PROPOSE le
 *     prix de la ligne comme référence ; la référence ne se montre que dans
 *     la ligne ouverte en grand ; aucun métier sur un poste.
 *
 * LA PHRASE EST RANGÉE MOT POUR MOT. La clé (`cleDeLigne`, dans
 * `devis.js`) ne sert qu'à RAPPROCHER ; elle ne s'affiche nulle part, et
 * tout ce qu'une fonction d'ici rend à l'écran est une phrase RANGÉE.
 *
 * CE QUE CE FICHIER NE FAIT JAMAIS
 * --------------------------------
 * Il ne compare pas les prix de plusieurs artisans, il ne calcule rien sur
 * les prix déjà écrits : chaque prix montré a été écrit par l'artisan
 * lui-même, une fois (docs/DONNEES-DES-ARTISANS.md). Il n'écrit jamais un
 * montant à la main — pas même le signe « € » : `centimesLisibles`
 * (`centimes.js`) est la seule écriture d'un montant du projet. Il n'appelle ni `normalize`, ni de
 * changement de casse, ni de comparaison selon la langue : la clé suffit,
 * et elle est la même sur l'iPhone et dans PostgreSQL.
 *
 * IL N'IMPORTE QUE QUATRE FICHIERS PURS, avec l'extension `.js` :
 * `./devis.js`, `./centimes.js`, `./entreprise.js` et `./rapprochement.js`.
 * Aucun ne charge React Native : `node` le fait tourner, et un contrôle qui
 * plante ne vérifie rien.
 */
import {
  UNITES, TYPES_CHIFFRES, LONGUEURS, PRIX_MAX, texteNet, cleDeLigne, correspondALaRecherche, degreDeCorrespondance,
  memoireDesLignes, valeursDeLaSuggestion, centimesEnSaisie, milliemesEnSaisie,
} from './devis.js';
import { centimesLisibles } from './centimes.js';
import { dateFrancaise, isoLisible } from './entreprise.js';
import { aPlat, cleDeRapprochement } from './rapprochement.js';

/* ================================================================== */
/*  LES CONSTANTES — chacune a son miroir dans la base                  */
/* ================================================================== */

/** Le plafond : 1 000 postes par entreprise. Le même nombre que
 *  `v_plafond_postes` (section 50.4) et que la phrase d'`OP018`. La saisie
 *  lit TOUTE la base d'un coup : une borne la garde petite. */
export const POSTES_MAX = 1000;

/** TROIS PROPOSITIONS AU PLUS pendant la frappe — la réponse du propriétaire
 *  du 23/10 : « il ne faut pas qu'il y ait trop de propositions, ça pourrait
 *  nous perdre ». Le nombre ne vit QU'ICI : `suggestionsPourLaFrappe` ne
 *  rend jamais plus, quoi qu'on lui demande, et l'écran n'en a pas d'autre.
 *  Jusqu'au 24/10 il était recopié dans `ChampDesignation`, où aucun
 *  contrôle ne le faisait tourner (relecture « écran », ECRAN1). */
export const PROPOSITIONS_MAX = 3;

/** TROIS LETTRES AVANT DE PROPOSER (T12) : en deçà, tout ressemble à tout.
 *  Même raison, même place que `PROPOSITIONS_MAX`. */
export const LETTRES_MIN = 3;

/** La limite de lecture par défaut de l'API de Supabase : une réponse est
 *  COUPÉE à ce nombre de lignes, sans erreur. RELEVÉE le 25/10/2026 sur la
 *  vraie base : sans limite demandée, l'API rend les 1 000 postes d'un compte
 *  au plafond. Elle vaut donc AU MOINS 1 000 ; sa valeur exacte n'est pas
 *  connue, et relever le plafond demanderait de la remesurer. Il ne doit jamais
 *  la dépasser, sinon « Ma base » montrerait 1 000 postes sur 1 200 sans un
 *  mot — `verifier-postes` exige `POSTES_MAX <= LIMITE_LECTURE_API`. */
export const LIMITE_LECTURE_API = 1000;

/**
 * Les cinq contraintes de `base_postes`, TRIÉES PAR ORDRE ALPHABÉTIQUE.
 *
 * Quand une écriture en viole plusieurs, PostgreSQL nomme la PREMIÈRE dans
 * l'ordre alphabétique de leurs noms : `validerPoste()` teste dans cet
 * ordre-ci, pour nommer la même. « — » avec un prix de 0 est refusé par le
 * PRIX, des deux côtés ; « — » seul, par la clé vide. `verifier-postes`
 * compare cette liste à la section 50.
 */
export const CONTRAINTES_POSTE = Object.freeze([
  'base_poste_designation_check',
  'base_poste_prix_check',
  'base_poste_prix_date_check',
  'base_poste_rapprochement_check',
  'base_poste_unite_check',
]);

/* ================================================================== */
/*  LES OUTILS                                                          */
/* ================================================================== */

const entier = (n) => Number.isSafeInteger(n);
const present = (v) => v !== null && v !== undefined;
const vrai = (b) => b === true;
const longueur = (s) => [...String(s)].length;
const uniteDe = (cle) => UNITES.find((u) => u.cle === cle) || null;
/* Un montant à montrer : `centimesLisibles`, ou un tiret quand il n'y en a
   pas (le tiret du lot 1 pour une ligne sans prix). */
const montant = (c) => (entier(c) && c > 0 ? centimesLisibles(c) : '—');
/* « 45,00 € / m² » : le montant, puis son unité courte. */
const parUnite = (u) => (u ? ` / ${u.court}` : '');

/* UN HORODATAGE, À L'INSTANT QU'IL DÉSIGNE : réécrit par `isoLisible` avant
   `Date.parse` — la seule forme que tout moteur doit lire (`node` est plus
   tolérant que le moteur de l'iPhone, il ne peut pas en être juge). Une
   date illisible vaut « jamais », et se range en dernier. */
function instant(v) {
  const iso = isoLisible(v);
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}
/* Comparer deux chaînes octet pour octet, comme PostgreSQL compare deux
   `uuid` — jamais selon la langue du téléphone. */
function comparer(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  if (x < y) return -1;
  return x > y ? 1 : 0;
}
/* Le plus récent d'abord : la date, puis l'identifiant (le rangement de la
   mémoire du lot 1, pour que le « dernier prix » d'un poste soit celui que
   la mémoire mettrait en tête). */
function plusRecent(a, b) {
  const ta = instant(a.modifieLe);
  const tb = instant(b.modifieLe);
  if (ta !== tb) return tb > ta ? 1 : -1;
  return comparer(a.id, b.id);
}

/* ================================================================== */
/*  LES REFUS — les miroirs des contraintes de la section 50            */
/* ================================================================== */

/** Un poste tel que la base le rangerait : la phrase rognée de la classe
 *  de blancs du projet (`texteNet`, la même que `tient_le_poste()`), rien
 *  d'autre de récrit ; les deux interrupteurs à `false` par défaut. */
export function nettoyerPoste(v) {
  const x = { ...(v || {}) };
  x.designation = texteNet(x.designation);
  x.fournitureNonComprise = vrai(x.fournitureNonComprise);
  x.mainOeuvre = vrai(x.mainOeuvre);
  x.prixReferenceCentimes = present(x.prixReferenceCentimes) ? x.prixReferenceCentimes : null;
  return x;
}

/* Chaque contrainte, écrite comme en SQL — une contrainte `check` PASSE
   quand son expression vaut NULL. Rend `null` si la règle passe, le champ
   fautif sinon. */
const REGLES_POSTE = {
  base_poste_designation_check: (p) => (
    present(p.designation) && longueur(p.designation) <= LONGUEURS.designation ? null : 'designation'),
  base_poste_prix_check: (p) => (
    !present(p.prixReferenceCentimes)
      || (entier(p.prixReferenceCentimes) && p.prixReferenceCentimes >= 1 && p.prixReferenceCentimes <= PRIX_MAX)
      ? null : 'prixReferenceCentimes'),
  /* La date du prix est posée par la BASE, quand le prix change, et vidée
     avec lui : une écriture de l'application ne l'envoie jamais, donc ne
     peut pas violer cette règle. Le nom reste à sa place dans l'ordre —
     c'est l'ordre de la base qu'on recopie. */
  base_poste_prix_date_check: () => null,
  /* LA CLÉ VIDE : une phrase faite seulement de blancs, de ponctuation, de
     marques ou d'invisibles (« — », une espace idéographique, une suite de
     U+200B) n'est pas un poste. Au-delà de 2 000 caractères,
     la clé n'existe pas (la garde) et cette règle se tait : c'est celle de
     la phrase qui parle, comme en base. */
  base_poste_rapprochement_check: (p) => (cleDeRapprochement(p.designation) === '' ? 'designation' : null),
  base_poste_unite_check: (p) => (present(p.unite) && UNITES.some((u) => u.cle === p.unite) ? null : 'unite'),
};

/**
 * Un poste est-il recevable ? `{ ok, contrainte, champ }`.
 *
 * `contrainte` est le NOM que la base citerait, testé dans l'ordre de
 * `CONTRAINTES_POSTE` ; la PHRASE vient de `messageDeContrainte()`
 * (`erreurs.js`) : une seule écriture des phrases.
 */
export function validerPoste(v) {
  const x = nettoyerPoste(v);
  for (const nom of CONTRAINTES_POSTE) {
    const champ = REGLES_POSTE[nom](x);
    if (champ) return { ok: false, contrainte: nom, champ };
  }
  return { ok: true, contrainte: null, champ: null };
}

/* ================================================================== */
/*  LA LIGNE ET SON POSTE                                               */
/* ================================================================== */

const VIDE = Object.freeze([]);
const PREPARES = new WeakMap();
const INDEX = new WeakMap();

/**
 * Les postes avec leur `cle` (`cleDeLigne`), calculée UNE fois par tableau
 * lu : deux appels sur le même tableau rendent le MÊME objet. Le cache est
 * un `WeakMap` sur le TABLEAU — l'état d'`OpusApp` le remplace à chaque
 * poste rangé (jamais une mutation en place), ce qui l'invalide ; un
 * tableau oublié libère ses clés tout seul.
 */
export function postesPrepares(postes) {
  if (!Array.isArray(postes)) return VIDE;
  let r = PREPARES.get(postes);
  if (!r) {
    r = postes.map((p) => ({ ...p, cle: cleDeLigne(p) }));
    PREPARES.set(postes, r);
  }
  return r;
}

/* UN POSTE PAR CLÉ. Deux postes de même clé ne devraient pas exister (la
   base les refuse, 23505) ; si une application en retard d'une règle en
   rangeait deux, on garde le plus récemment modifié, et une seule
   proposition sort. Calculé une fois par tableau, comme les clés. */
function postesParCle(postes) {
  if (!Array.isArray(postes)) return new Map();
  let m = INDEX.get(postes);
  if (!m) {
    m = new Map();
    for (const p of postesPrepares(postes)) {
      const deja = m.get(p.cle);
      if (!deja || plusRecent(p, deja) < 0) m.set(p.cle, p);
    }
    INDEX.set(postes, m);
  }
  return m;
}

/* Une ligne qui peut porter un poste : un poste ou une option, une phrase,
   une unité, et une clé qui n'est pas vide. Un titre, une réserve, « — »
   ne portent rien. */
function ligneRapprochable(ligne) {
  if (!ligne || !TYPES_CHIFFRES.includes(ligne.type == null ? 'poste' : ligne.type)) return false;
  const net = texteNet(ligne.designation);
  return !!net && present(ligne.unite) && !!cleDeRapprochement(net);
}

/** Le poste de même clé que la ligne, ou `null` — deux postes de même clé :
 *  le plus récemment modifié. */
export function posteDeLaLigne(ligne, postes) {
  if (!ligneRapprochable(ligne)) return null;
  return postesParCle(postes).get(cleDeLigne(ligne)) || null;
}

/* LA FORME VISIBLE d'une phrase : les blancs ramenés à UNE espace, les
   caractères invisibles et de format retirés, les bords rognés. Une
   boucle et deux ensembles, aucune expression régulière : ce qui est
   invisible se dit par son point de code, sans dépendre de la façon dont
   le moteur de l'iPhone lit une classe de caractères. */
const plage = (de, a) => Array.from({ length: a - de + 1 }, (_, i) => de + i);
const ESPACES = new Set([...plage(0x09, 0x0d), 0x20, 0x85, 0xa0, 0x1680, ...plage(0x2000, 0x200a), 0x2028, 0x2029, 0x202f,
  0x205f, 0x3000]);
const INVISIBLES = new Set([0xad, 0x180e, ...plage(0x200b, 0x200f), ...plage(0x202a, 0x202e), ...plage(0x2060, 0x2064),
  ...plage(0x2066, 0x2069), ...plage(0xfe00, 0xfe0f), 0xfeff]);
export function formeVisible(phrase) {
  let r = '';
  let blanc = false;
  for (const c of String(phrase || '')) {
    const n = c.codePointAt(0);
    if (INVISIBLES.has(n)) continue;
    if (ESPACES.has(n)) { blanc = r !== ''; continue; }
    if (blanc) { r += ' '; blanc = false; }
    r += c;
  }
  return r;
}

/** La phrase du POSTE quand la ligne qui le porte ne s'écrit pas pareil à
 *  l'œil (« chape sèche » / « Chape sèche »), sinon `null`. Une espace
 *  insécable ou un U+200B ne se voient pas : ils ne font pas dire « sous ».
 *  Une forme DÉCOMPOSÉE (un « e » suivi d'un accent, copiée d'un PDF) le
 *  fait encore dire — la recomposer demanderait une seconde table, pour un
 *  cas qu'un clavier ne produit pas. */
export function sousQuelPoste(ligne, poste) {
  return poste && ligne && formeVisible(ligne.designation) !== formeVisible(poste.designation) ? poste.designation : null;
}

/**
 * L'ÉTAT D'UNE LIGNE DEVANT LA BASE : `{ etat, poste, sous }`.
 *   - `'sans_objet'` : un titre, une réserve, une phrase ou une unité qui
 *     manque, une clé vide — rien à ajouter, rien à rapprocher ;
 *   - `'en_lecture'` : la base n'est pas encore lue (jamais « Ajouter à ma
 *     base » pendant ce temps : on proposerait un doublon) ;
 *   - `'illisible'` : la lecture a échoué (l'échec et son « Réessayer »
 *     vivent sous la désignation) ;
 *   - `'ajoutable'` ;
 *   - `'dans_la_base'`, avec son `poste`, et `sous` (`sousQuelPoste`).
 * `etat` est l'état de la lecture des postes : `'ok'`, `'echec'`, ou autre
 * chose tant qu'elle n'a pas abouti.
 */
export function etatDansLaBase(ligne, postes, etat) {
  if (!ligneRapprochable(ligne)) return { etat: 'sans_objet', poste: null, sous: null };
  if (etat === 'echec') return { etat: 'illisible', poste: null, sous: null };
  if (etat !== 'ok') return { etat: 'en_lecture', poste: null, sous: null };
  const poste = posteDeLaLigne(ligne, postes);
  if (!poste) return { etat: 'ajoutable', poste: null, sous: null };
  return { etat: 'dans_la_base', poste, sous: sousQuelPoste(ligne, poste) };
}

/* ================================================================== */
/*  LA RÉFÉRENCE ET L'ÉCART                                             */
/* ================================================================== */

/**
 * La référence d'une ligne : `null`, ou `{ poste, reference, unite, fixeLe,
 * avantRegime, mainOeuvre, sous }` quand un poste de même clé a un prix de
 * référence fixé.
 *
 * `avantRegime` : la référence a été fixée AVANT la déclaration du régime
 * de TVA actuel (`regimeDeclareLe`, posée par la base). Le prix d'une ligne
 * est hors taxes au régime réel et sans TVA en franchise : une référence
 * fixée sous l'autre régime ne se compare plus, elle se VÉRIFIE.
 */
export function referenceDuPoste(ligne, postes, { regimeDeclareLe = null } = {}) {
  const poste = posteDeLaLigne(ligne, postes);
  if (!poste || !entier(poste.prixReferenceCentimes) || poste.prixReferenceCentimes <= 0) return null;
  const fixe = instant(poste.prixFixeLe);
  const declare = instant(regimeDeclareLe);
  return {
    poste,
    reference: poste.prixReferenceCentimes,
    unite: poste.unite,
    fixeLe: poste.prixFixeLe ?? null,
    avantRegime: Number.isFinite(fixe) && Number.isFinite(declare) && fixe < declare,
    mainOeuvre: vrai(poste.mainOeuvre),
    sous: sousQuelPoste(ligne, poste),
  };
}

/** « Votre prix de référence : 45,00 € / m², fixé le 14/10/2026. » — et,
 *  quand la ligne ne s'écrit pas comme le poste, elle le NOMME (« … pour
 *  « Dépose fenêtre » : … »). À l'heure : « Votre taux horaire de
 *  référence ». Commence toujours par « Votre » : c'est SON prix, jamais
 *  un prix venu d'ailleurs. */
export function phraseReference(r) {
  if (!r) return null;
  const u = uniteDe(r.unite);
  const quoi = r.unite === 'h' ? 'taux horaire de référence' : 'prix de référence';
  const pour = r.sous ? ` pour « ${r.sous} »` : '';
  const date = dateFrancaise(r.fixeLe);
  const fixe = date ? `, fixé le ${date}` : '';
  const regime = r.avantRegime ? ', avant la déclaration de votre régime de TVA actuel : vérifiez-le' : '';
  return `Votre ${quoi}${pour} : ${montant(r.reference)}${parUnite(u)}${fixe}${regime}.`;
}

/**
 * L'écart : `null`, ou `{ …référence, prix }` quand la ligne est un poste
 * ou une option, NON offerte, avec un prix entier > 0, que sa référence
 * existe, et que les deux prix diffèrent — dès le premier centime.
 * Offrir est un écart VOULU : la question ne se pose pas.
 */
export function ecartAuPoste(ligne, postes, opts = {}) {
  if (!ligne || vrai(ligne.offert) || !entier(ligne.prixUnitaireCentimes) || ligne.prixUnitaireCentimes <= 0) return null;
  const r = referenceDuPoste(ligne, postes, opts);
  if (!r || r.reference === ligne.prixUnitaireCentimes) return null;
  return { ...r, prix: ligne.prixUnitaireCentimes };
}

/** « Vous mettez 52,00 € — c'est voulu ? », la phrase du propriétaire. Une
 *  référence fixée avant le régime actuel ne pose pas cette question : la
 *  ligne de référence dit déjà « vérifiez-le ». */
export function phraseEcart(e) {
  if (!e || e.avantRegime) return null;
  return `Vous mettez ${montant(e.prix)} — c’est voulu ?`;
}

/* « le mètre carré », « l’heure », « l’unité » : l'article d'un nom
   d'unité, pour une phrase lue à voix haute. */
const leNom = (u) => (u ? (/^[aeiouhé]/.test(u.nom) ? `l’${u.nom}` : `le ${u.nom}`) : '');

/** Le libellé VoiceOver de l'écart : la phrase ENTIÈRE, parce qu'on ne
 *  voit pas la ligne de référence au-dessus — « Votre prix de référence
 *  est 45,00 € le mètre carré, vous mettez 52,00 € : c'est voulu ? ». */
export function libelleEcart(e) {
  if (!e || e.avantRegime) return null;
  const u = uniteDe(e.unite);
  const quoi = e.unite === 'h' ? 'taux horaire de référence' : 'prix de référence';
  return `Votre ${quoi} est ${montant(e.reference)}${u ? ` ${leNom(u)}` : ''}, vous mettez ${montant(e.prix)} : c’est voulu ?`;
}

/** La sortie d'un faux rapprochement : « Seuil » et « seuils » sont la
 *  même phrase, mais « Mur bas » et « Mur BA » non (l'exception « bas ») —
 *  et la règle peut se tromper sur deux mots qu'un accent sépare. Montrée
 *  dès que `sous` n'est pas `null`.
 *
 *  LA PARENTHÈSE N'EST PAS UN DÉTAIL (relecture « écran », ECRAN8) : ajouter
 *  un s ou un accent sont JUSTEMENT les retouches qu'on essaierait d'abord —
 *  et elles ne changent rien, puisque la règle les met de côté. Dite sans
 *  elle, la phrase envoyait l'artisan vers un geste qui ne marche pas. La
 *  suite (« elle ne sera plus rapprochée de ce poste ») est partie : elle
 *  se comprend d'elle-même après « Ce poste existe déjà », et « rapprochée »
 *  est un mot qu'un débutant ne connaît pas. La phrase fait ainsi une ligne
 *  de moins à 320 points, là où la carte empilait le plus (ECRAN9). */
export const PHRASE_SORTIE = 'Ce n’est pas le même travail ? Changez un mot de la ligne (un s, un accent ou une majuscule ne '
  + 'suffit pas).';

/* ================================================================== */
/*  L'AJOUT ET LA CORRECTION                                            */
/* ================================================================== */

/**
 * Ce que la feuille d'ajout propose, depuis une ligne :
 * `{ designation, unite, fournitureNonComprise, mainOeuvre, prixPropose }`.
 * `prixPropose` est le prix de la ligne s'il est > 0 — la VALEUR d'une
 * ligne offerte comprise, que la ligne garde —, sinon `null`. Jamais
 * « Offert » (offrir est une décision de CE devis), jamais la quantité
 * (elle dépend du chantier), jamais le taux (il dépend du chantier aussi).
 */
export function posteDepuisLaLigne(ligne) {
  const l = ligne || {};
  const prix = l.prixUnitaireCentimes;
  return {
    designation: texteNet(l.designation),
    unite: l.unite ?? null,
    fournitureNonComprise: vrai(l.fournitureNonComprise),
    mainOeuvre: vrai(l.mainOeuvre),
    prixPropose: entier(prix) && prix > 0 ? prix : null,
  };
}

/** Le poste de même clé que ce qu'on s'apprête à ajouter, ou `null`. La
 *  feuille le RECALCULE à chaque rendu : une base relue entre-temps la fait
 *  passer d'elle-même à « ce poste existe déjà ». */
export function posteExistant(valeurs, postes) {
  if (!valeurs || !present(valeurs.unite) || !cleDeRapprochement(texteNet(valeurs.designation))) return null;
  return postesParCle(postes).get(cleDeLigne(valeurs)) || null;
}

/**
 * Ce que change une phrase CORRIGÉE dans la page : `{ consequence, autre }`.
 *   - `'aucune'` : même clé (un accent, une majuscule, un s) — les lignes
 *     déjà écrites restent reconnues ;
 *   - `'detache'` : une autre clé, libre — elles ne le seront plus ;
 *   - `'doublon'` : la clé d'un AUTRE poste de même unité et fourniture,
 *     nommé dans `autre` — la base refuserait (23505), la feuille refuse
 *     avant d'envoyer.
 */
export function consequenceDeLaCorrection(poste, nouvellePhrase, postes) {
  if (!poste) return { consequence: 'aucune', autre: null };
  const cle = cleDeLigne({ designation: nouvellePhrase, unite: poste.unite, fournitureNonComprise: poste.fournitureNonComprise });
  if (cle === cleDeLigne(poste)) return { consequence: 'aucune', autre: null };
  const autre = postesPrepares(postes).filter((p) => p.cle === cle && p.id !== poste.id).sort(plusRecent)[0] || null;
  return autre ? { consequence: 'doublon', autre } : { consequence: 'detache', autre: null };
}

/**
 * Les postes PROCHES de ce qu'on s'apprête à ajouter : la MÊME phrase (même
 * clé de rapprochement), mais une autre unité ou une autre fourniture —
 * deux au plus, le plus récent d'abord. C'est la vraie confusion (la chape
 * au m² et la chape au forfait) ; une phrase simplement plus longue n'en
 * est pas une, et le poste de même clé complète est « existe déjà », pas
 * « proche ».
 */
export function postesProches(postes, valeurs) {
  if (!valeurs) return [];
  const rapprochement = cleDeRapprochement(texteNet(valeurs.designation));
  if (!rapprochement) return [];
  const cle = cleDeLigne(valeurs);
  const parCle = new Map();
  for (const p of postesPrepares(postes)) {
    if (p.cle === cle || JSON.parse(p.cle)[0] !== rapprochement) continue;
    const deja = parCle.get(p.cle);
    if (!deja || plusRecent(p, deja) < 0) parCle.set(p.cle, p);
  }
  return [...parCle.values()].sort(plusRecent).slice(0, 2);
}

/* ================================================================== */
/*  LES PROPOSITIONS PENDANT LA FRAPPE                                  */
/* ================================================================== */

/* Pour chaque clé de la mémoire : la date de sa ligne la plus récente (le
   DERNIER USAGE, qui range les postes à pertinence égale) et son dernier
   prix UTILISABLE (ce qu'un poste sans référence recopie). Toutes les
   lignes chiffrées, hors la ligne ouverte — et sans regarder le texte
   tapé : un poste trouvé par la recherche garde l'usage de sa clé. */
function usagesDeLaMemoire(memoire, idLigne) {
  const m = new Map();
  const lignes = (Array.isArray(memoire) ? memoire : [])
    .filter((l) => l && TYPES_CHIFFRES.includes(l.type == null ? 'poste' : l.type))
    .filter((l) => l.id !== idLigne && texteNet(l.designation))
    .sort(plusRecent);
  for (const l of lignes) {
    const k = cleDeLigne(l);
    const u = m.get(k) || { dernierUsage: l.modifieLe ?? null, dernierPrix: null };
    if (u.dernierPrix === null && entier(l.prixUnitaireCentimes) && l.prixUnitaireCentimes > 0) u.dernierPrix = l.prixUnitaireCentimes;
    m.set(k, u);
  }
  return m;
}

/**
 * LA LISTE DES PROPOSITIONS : la base et la mémoire du lot 1, UNE liste,
 * une proposition par clé, `max` au plus (trois).
 *
 *   - un poste de la base MASQUE toute proposition de la mémoire de même
 *     clé, quel que soit son prix : son prix est une décision, la mémoire un
 *     souvenir. Et s'il n'a pas de référence, il porte le dernier prix
 *     utilisable de la mémoire (`dernierPrix`), qu'un appui recopie ;
 *   - UN SEUL TRI pour les deux sources : le degré de pertinence d'abord
 *     (`degreDeCorrespondance` — « Pos » met « Pose… » devant « Dépose… »),
 *     puis la base avant la mémoire, puis le DERNIER USAGE (la chape servie
 *     il y a une heure avant celle d'il y a un mois), puis la phrase à plat,
 *     puis l'identifiant. « La base d'abord » ne passe donc jamais devant
 *     une phrase qui COMMENCE par ce que l'artisan tape.
 *
 * Chaque proposition porte `source` (`'base'` ou `'memoire'`), `cle`,
 * `degre` et `dernierUsage` ; celles de la base, `dernierPrix`.
 */
export function suggestionsPourLaFrappe({ postes, memoire, texte, idLigne = null, max = PROPOSITIONS_MAX }) {
  const base = postesParCle(postes);
  const usages = usagesDeLaMemoire(memoire, idLigne);
  const deLaBase = [...base.values()].filter((p) => correspondALaRecherche(p.designation, texte)).map((p) => {
    const u = usages.get(p.cle) || {};
    return {
      source: 'base', ...p, degre: degreDeCorrespondance(p.designation, texte),
      dernierUsage: u.dernierUsage ?? null, dernierPrix: u.dernierPrix ?? null,
    };
  });
  const deLaMemoire = memoireDesLignes(Array.isArray(memoire) ? memoire : [], texte, { idLigne })
    .filter((s) => !base.has(s.cle))
    .map((s) => ({ source: 'memoire', ...s, degre: degreDeCorrespondance(s.designation, texte), dernierUsage: s.modifieLe ?? null }));
  const plats = new Map();
  const plat = (s) => {
    if (!plats.has(s)) plats.set(s, aPlat(s.designation) || '');
    return plats.get(s);
  };
  return [...deLaBase, ...deLaMemoire].sort((a, b) => {
    if (a.degre !== b.degre) return b.degre - a.degre;
    if (a.source !== b.source) return a.source === 'base' ? -1 : 1;
    const ua = instant(a.dernierUsage);
    const ub = instant(b.dernierUsage);
    if (ua !== ub) return ub > ua ? 1 : -1;
    return comparer(plat(a), plat(b)) || comparer(a.id ?? a.ligneId, b.id ?? b.ligneId);
    /* `max` ne peut que RÉDUIRE la liste : demander six propositions en rend
       trois. La promesse au propriétaire est tenue par le calcul, pas par
       l'écran qui l'appelle (relecture « écran », ECRAN1). */
  }).slice(0, Number.isSafeInteger(max) && max >= 0 && max < PROPOSITIONS_MAX ? max : PROPOSITIONS_MAX);
}

/**
 * CE QU'UN APPUI RECOPIE dans la ligne : la phrase rangée, l'unité, la
 * fourniture, la main-d'œuvre et un prix.
 *   - pour la mémoire, `valeursDeLaSuggestion` (le prix le plus récent du
 *     groupe) ;
 *   - pour la base, le prix de référence s'il est fixé, sinon le dernier
 *     prix utilisable de même clé, sinon `null`.
 * Jamais le taux, jamais « Offert », jamais la quantité.
 */
export function valeursDeLaProposition(s) {
  if (!s) return null;
  if (s.source !== 'base') return valeursDeLaSuggestion(s);
  const ref = s.prixReferenceCentimes;
  const prix = entier(ref) && ref > 0 ? ref : (entier(s.dernierPrix) && s.dernierPrix > 0 ? s.dernierPrix : null);
  return {
    designation: s.designation,
    unite: s.unite ?? null,
    fournitureNonComprise: vrai(s.fournitureNonComprise),
    mainOeuvre: vrai(s.mainOeuvre),
    prixUnitaireCentimes: prix,
  };
}

/** Le texte à écrire dans le champ prix, ou `null` — et `null` veut dire
 *  « NE TOUCHEZ PAS AU CHAMP » : une proposition sans prix ne vide jamais
 *  un prix déjà tapé. */
export function prixAEcrire(valeurs) {
  const p = valeurs && valeurs.prixUnitaireCentimes;
  return entier(p) && p > 0 ? centimesEnSaisie(p) : null;
}

/**
 * Le détail d'une proposition, sur UNE ligne — ce qui serait coupé, c'est
 * l'historique ou l'origine, jamais « fourniture non comprise » :
 *   - base : « 45,00 € / m² · réf. du 14/10/2026 », « sans réf. · dernier :
 *     45,00 € / h », ou « votre base, sans prix de référence » ;
 *   - mémoire : le prix recopié et son unité (« (offert) », « · fourniture
 *     non comprise »), puis — aucun autre prix : son origine ; un seul autre
 *     prix sans fourniture : « · aussi 45,00 € » ; sinon « · +2 prix ».
 */
export function detailDeSuggestion(s, { sansFourniture = false } = {}) {
  const u = uniteDe(s.unite);
  if (s.source === 'base') {
    if (entier(s.prixReferenceCentimes) && s.prixReferenceCentimes > 0) {
      const date = dateFrancaise(s.prixFixeLe);
      return `${montant(s.prixReferenceCentimes)}${parUnite(u)} · réf.${date ? ` du ${date}` : ''}`;
    }
    if (entier(s.dernierPrix) && s.dernierPrix > 0) return `sans réf. · dernier : ${montant(s.dernierPrix)}${parUnite(u)}`;
    return 'votre base, sans prix de référence';
  }
  const autres = (s.prix || []).slice(1);
  /* `sansFourniture` : la rangée DIT déjà la fourniture en tête de son détail
     (`distinction`, quand deux propositions portent la même phrase) — on ne
     l'écrit pas deux fois sur la même ligne. */
  let d = `${montant(s.prixUnitaireCentimes)}${parUnite(u)}${s.offert ? ' (offert)' : ''}`
    + `${s.fournitureNonComprise && !sansFourniture ? ' · fourniture non comprise' : ''}`;
  if (autres.length === 0) d += s.origine && s.origine.libelle ? ` · ${s.origine.libelle}` : '';
  else if (autres.length === 1 && !s.fournitureNonComprise) d += ` · aussi ${montant(autres[0].prixUnitaireCentimes)}`;
  else d += ` · +${autres.length} prix`;
  return d;
}

/**
 * Une phrase COUPÉE autour d'un montant : `{ avant, prix, apres }`, tels
 * que `avant`, puis le montant écrit par `Montant`, puis `apres` redonnent
 * la phrase octet pour octet. L'écran ne sait pas écrire un montant
 * (`Montant`, dans `ui.js`, est la seule porte) : sans cette coupe, il
 * devrait soit tout écrire en gris — et le prix qu'on va recopier, ou le
 * prix de référence, se liraient comme une remarque —, soit réécrire le
 * montant lui-même. Pas de montant dans la phrase : tout est dans `avant`,
 * `prix` vaut `null`.
 */
export function coupeAutourDuPrix(phrase, centimes, { dernier = false } = {}) {
  const d = phrase == null ? '' : String(phrase);
  const texte = entier(centimes) && centimes > 0 ? centimesLisibles(centimes) : null;
  /* `dernier` : le montant cherché vient APRÈS une phrase citée, qui peut
     en contenir un (« … pour « Forfait 45,00 € » : 45,00 € / m² »). */
  let i = -1;
  if (texte) i = dernier ? d.lastIndexOf(texte) : d.indexOf(texte);
  if (i < 0) return { avant: d, prix: null, apres: '' };
  return { avant: d.slice(0, i), prix: centimes, apres: d.slice(i + texte.length) };
}

/** Le détail d'une proposition, coupé autour du prix qu'un appui RECOPIE
 *  (`valeursDeLaProposition`) : « sans réf. · dernier : » reste en gris, le
 *  prix dernier écrit à l'encre du texte. `verifier-postes` recoud les
 *  morceaux sur chaque proposition du balayage. */
export function morceauxDuDetail(s, options = {}) {
  const v = valeursDeLaProposition(s);
  return coupeAutourDuPrix(detailDeSuggestion(s, options), v ? v.prixUnitaireCentimes : null);
}

/** La ligne de référence, coupée autour du prix de référence : il vient
 *  après la phrase du poste quand elle est citée (« … pour « … » : »). */
export function morceauxDeLaReference(r) {
  return coupeAutourDuPrix(phraseReference(r), r ? r.reference : null, { dernier: true });
}

/** La question de l'écart, coupée autour du prix de la ligne. */
export function morceauxDeLEcart(e) {
  return coupeAutourDuPrix(phraseEcart(e), e ? e.prix : null);
}

/** Le libellé VoiceOver de « Changer ma référence », sous l'écart : « Faire
 *  de 52,00 € votre prix de référence pour ce poste » — on entend ce que
 *  l'appui fera, pas seulement son nom. */
export function libelleChangerReference(e) {
  if (!e) return 'Changer ma référence';
  const quoi = e.unite === 'h' ? 'taux horaire de référence' : 'prix de référence';
  return `Faire de ${montant(e.prix)} votre ${quoi} pour ce poste`;
}

/**
 * Le libellé VoiceOver d'une proposition : le préfixe COMMUN « Reprendre : »,
 * la phrase, et LE PRIX QU'UN APPUI RECOPIE d'abord — les autres ensuite.
 * Sans lui, on entendait une phrase et aucun prix.
 */
export function libelleDeSuggestion(s, { avecLaFourniture = false } = {}) {
  const u = uniteDe(s.unite);
  /* `avecLaFourniture` : une autre proposition porte la même phrase SANS la
     fourniture — celle-ci doit dire qu'elle la comprend, sinon on entend
     deux fois la même chose. */
  let fourniture = '';
  if (s.fournitureNonComprise) fourniture = ', fourniture non comprise';
  else if (avecLaFourniture) fourniture = ', avec la fourniture';
  let l = `Reprendre : ${s.designation}${u ? `, par ${u.nom}` : ''}${fourniture}`;
  if (s.source === 'base') {
    if (entier(s.prixReferenceCentimes) && s.prixReferenceCentimes > 0) {
      const date = dateFrancaise(s.prixFixeLe);
      return `${l}, de votre base, prix de référence ${montant(s.prixReferenceCentimes)}${date ? `, fixé le ${date}` : ''}`;
    }
    const dernier = entier(s.dernierPrix) && s.dernierPrix > 0 ? `, au dernier prix écrit ${montant(s.dernierPrix)}` : '';
    return `${l}, de votre base, sans prix de référence${dernier}`;
  }
  if (entier(s.prixUnitaireCentimes) && s.prixUnitaireCentimes > 0) l += `, au prix de ${montant(s.prixUnitaireCentimes)}${s.offert ? ' (offert)' : ''}`;
  if (s.origine && s.origine.libelle) l += `, déjà écrit dans ${s.origine.libelle}`;
  const autres = (s.prix || []).slice(1).map((p) => montant(p.prixUnitaireCentimes) + (p.offert ? ' (offert)' : ''));
  if (autres.length) l += ` ; aussi écrit à ${autres.join(' et ')}`;
  return l;
}

/* ================================================================== */
/*  LE NOM D'UN CLIENT DANS UNE PHRASE                                  */
/* ================================================================== */

/* Les mots d'un nom qui ne désignent personne : civilités et formes
   sociales, écrits comme leur clé. */
const CIVILITES = new Set(['m', 'mme', 'mlle', 'mr', 'monsieur', 'madame', 'mademoiselle', 'sci', 'sarl', 'sas', 'eurl']);
/* Les mots d'une adresse qui ne désignent aucun lieu, écrits comme leur clé. */
const VOIES = new Set(['rue', 'avenue', 'chemin', 'impasse', 'route', 'allee', 'place', 'boulevard']);
const motsCle = (s) => (cleDeRapprochement(String(s || '')) || '').split(' ').filter(Boolean);
/* LES MOTIFS QUI DÉSIGNENT UN CLIENT SANS CONNAÎTRE SA FICHE — relecture
   « textes », TEXTES9 : « Mlle Durand », « Mr Durand », « M.Durand »,
   « famille Dupont » et « +33 6 12 34 56 78 » passaient sans un mot. Un
   numéro français s'écrit aussi en +33 ou 0033 ; une civilité s'abrège de
   plus d'une façon, et « M. » se colle parfois au nom. Des faux positifs
   restent possibles (« famille de produits ») : c'est un avertissement,
   jamais un refus. */
const NUMERO = /(?:\+33\s?|0033\s?|(?<![\d+])0)[1-9](?:[\s.-]?\d{2}){4}(?!\d)/;
const CIVILITE = /(?:^|[^\p{L}])(?:(?:chez|mme|mlle|melle|mr|monsieur|madame|mademoiselle|famille)(?![\p{L}\d])|m\.\s)/iu;
const M_COLLE = /(?:^|[^\p{L}])M\.(?=\p{Lu})/u;
/* Un caractère qui SÉPARE deux mots pour la clé (une espace, une virgule,
   un tiret…) : entre « a » et « b », il laisse « a b ». Un accent combinant
   ou un invisible donnent « ab », une lettre « aXb ». */
const separateurs = new Map();
function separe(c) {
  if (!separateurs.has(c)) separateurs.set(c, cleDeRapprochement(`a${c}b`) === 'a b');
  return separateurs.get(c);
}
/* Les mots d'un texte TELS QU'ILS SONT ÉCRITS, coupés là où la clé coupe :
   l'indice montré à l'artisan est le mot de la FICHE (« Durandal »),
   jamais la clé (« durandal »). */
function motsEcrits(texte) {
  const r = [];
  let m = '';
  for (const c of String(texte || '')) {
    if (separe(c)) {
      if (m) r.push(m);
      m = '';
    } else {
      m += c;
    }
  }
  if (m) r.push(m);
  return r;
}

/**
 * La phrase d'un poste contient-elle une donnée du CLIENT du devis d'où
 * elle vient ? `[{ genre, mot }]`, vide si rien — `genre` vaut `'nom'`,
 * `'adresse'` (avec le `mot` de la fiche), `'telephone'` (celui de la
 * fiche), `'numero'` (un numéro de téléphone quelconque), `'email'` ou
 * `'civilite'` (« chez », « M. », « Mme »…).
 *
 * Une phrase de la base est proposée telle quelle sur les devis de TOUS
 * ses clients, et elle survit à la suppression d'un client. C'est un
 * AVERTISSEMENT, jamais un refus : « M. Blanc » et « blanc cassé » font un
 * faux positif, connu et accepté. Les mots se comparent par leur CLÉ :
 * « DURANDAL », « durandal » et « Durandal » sont le même nom.
 */
export function indicesDuClient(phrase, { client = {}, lieu = {} } = {}) {
  const texte = ` ${motsCle(phrase).join(' ')} `;
  const trouves = [];
  const ajouter = (genre, mot = null) => {
    if (!trouves.some((t) => t.genre === genre && t.mot === mot)) trouves.push({ genre, mot });
  };
  const c = client || {};
  const ou = lieu || {};
  for (const mot of motsEcrits(c.nom)) {
    if (motsCle(mot).some((m) => m.length >= 3 && !CIVILITES.has(m) && texte.includes(` ${m} `))) ajouter('nom', mot);
  }
  for (const source of [c.adresse, ou.adresse]) {
    for (const mot of motsEcrits(source)) {
      if (motsCle(mot).some((m) => m.length >= 4 && !VOIES.has(m) && texte.includes(` ${m} `))) ajouter('adresse', mot);
    }
  }
  const brut = String(phrase || '');
  const chiffres = brut.replace(/\D/g, '');
  const tel = String(c.telephone || '').replace(/\D/g, '');
  if (tel.length >= 9 && chiffres.includes(tel.slice(-9))) ajouter('telephone');
  if (NUMERO.test(brut)) ajouter('numero');
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(brut)) ajouter('email');
  if (CIVILITE.test(brut) || M_COLLE.test(brut)) ajouter('civilite');
  return trouves;
}

/* ================================================================== */
/*  LA PAGE « MA BASE DE POSTES »                                       */
/* ================================================================== */

/** « Ajouté le 14/10/2026 depuis un de vos devis », ou « Ajouté le
 *  14/10/2026 » quand le lien est vide (le devis a été supprimé). Jamais un
 *  mot de l'objet d'un devis : celui d'une demande est le texte d'un AUTRE
 *  client. */
export function libelleOrigine(poste) {
  if (!poste) return null;
  const date = dateFrancaise(poste.createdAt);
  const depuis = poste.devisOrigineId ? ' depuis un de vos devis' : '';
  return date ? `Ajouté le ${date}${depuis}` : (depuis ? `Ajouté${depuis}` : null);
}

/** « Au mètre carré · fourniture non comprise · main-d’œuvre » — le nom de
 *  l'unité (`UNITES`), jamais sa clé. */
export function ligneDescriptive(poste) {
  if (!poste) return null;
  const u = uniteDe(poste.unite);
  /* « Unité : unité » se lisait comme une faute (relecture « écran »,
     ECRAN8) ; « Unité : à l’unité » à côté de « Unité : mètre carré »
     disait la même chose de deux façons (relecture « textes », TEXTES16).
     Toutes les unités se disent comme on les dit sur un chantier : « À
     l’unité », « Au mètre carré », « À l’heure » — la préposition que la
     feuille d'ajout emploie déjà (`aLUnite`). */
  const morceaux = [u ? ALUnite(u) : 'Unité : —'];
  if (vrai(poste.fournitureNonComprise)) morceaux.push('fourniture non comprise');
  if (vrai(poste.mainOeuvre)) morceaux.push('main-d’œuvre');
  return morceaux.join(' · ');
}

/** Le libellé du champ prix : hors taxes au régime réel, sans le dire
 *  ailleurs — un régime en franchise, non déclaré, en lecture ou en échec
 *  ne dit pas « HT ». À l'heure, c'est un taux horaire. */
export function etiquettePrixReference(poste, regime) {
  const ht = regime === 'reel';
  if (poste && poste.unite === 'h') return ht ? 'Taux horaire de référence (HT)' : 'Taux horaire de référence';
  return ht ? 'Prix de référence HT' : 'Prix de référence';
}

/* « au forfait », « au mètre carré », « à l’heure », « à l’unité » : la
   préposition d'un nom d'unité. */
const aLUnite = (u) => (u ? (/^[aeiouhé]/.test(u.nom) ? `à l’${u.nom}` : `au ${u.nom}`) : '');
/* La même, en tête de phrase — écrite, et non mise en capitale par le code :
   rien ici ne change la casse d'un texte (`verifier-postes`). */
const ALUnite = (u) => (u ? (/^[aeiouhé]/.test(u.nom) ? `À l’${u.nom}` : `Au ${u.nom}`) : '');

/** « Son prix de référence : 45,00 € / m², fixé le 14/10/2026. » — la
 *  phrase du prix d'un poste, après le `debut` que choisit la feuille
 *  (« Son prix de référence », « Il a déjà ce prix de référence »). `null`
 *  si le poste n'a pas de prix de référence. */
export function phrasePrixDuPoste(poste, debut) {
  if (!poste || !entier(poste.prixReferenceCentimes) || poste.prixReferenceCentimes <= 0) return null;
  const date = dateFrancaise(poste.prixFixeLe);
  return `${debut} : ${montant(poste.prixReferenceCentimes)}${parUnite(uniteDe(poste.unite))}${date ? `, fixé le ${date}` : ''}.`;
}

/** « fixé le 14/10/2026 », et — fixé AVANT la déclaration du régime de TVA
 *  actuel — « …, avant la déclaration de votre régime de TVA actuel :
 *  vérifiez-le ». Pour la page, qui montre des POSTES, pas des lignes.
 *  `null` sans prix de référence. */
export function phraseFixeLe(poste, { regimeDeclareLe = null } = {}) {
  if (!poste || !entier(poste.prixReferenceCentimes) || poste.prixReferenceCentimes <= 0) return null;
  const date = dateFrancaise(poste.prixFixeLe);
  const fixe = instant(poste.prixFixeLe);
  const declare = instant(regimeDeclareLe);
  const avant = Number.isFinite(fixe) && Number.isFinite(declare) && fixe < declare
    ? ', avant la déclaration de votre régime de TVA actuel : vérifiez-le' : '';
  return date ? `fixé le ${date}${avant}` : (avant ? `prix fixé${avant}` : null);
}

/** La SEULE ligne de « postes proches » de la feuille d'ajout : « Déjà dans
 *  votre base, au forfait : « … » (900,00 € / forfait). » — « au <unité> »
 *  pour une autre unité, « avec la fourniture » ou « fourniture non
 *  comprise » pour l'autre fourniture. C'est la vraie confusion (la chape
 *  au m² et la chape au forfait), dite une fois. */
export function phraseProche(proche, valeurs) {
  if (!proche) return null;
  const u = uniteDe(proche.unite);
  const comment = valeurs && proche.unite !== valeurs.unite
    ? aLUnite(u)
    : (vrai(proche.fournitureNonComprise) ? 'fourniture non comprise' : 'avec la fourniture');
  const prix = entier(proche.prixReferenceCentimes) && proche.prixReferenceCentimes > 0
    ? ` (${montant(proche.prixReferenceCentimes)}${parUnite(u)})` : '';
  return `Déjà dans votre base, ${comment} : « ${proche.designation} »${prix}.`;
}

/**
 * L'AVERTISSEMENT d'un nom de client dans une phrase, depuis les indices de
 * `indicesDuClient` : « Cette phrase contient « Durandal », le nom du client
 * de ce devis. Elle resterait dans votre base même si vous supprimez ce
 * client. » Dans la page (`page`), il n'y a plus de devis : la phrase dit ce
 * qui arrivera à la phrase, pour tous les clients. `null` si rien.
 */
export function phraseIndices(indices, { page = false } = {}) {
  const liste = Array.isArray(indices) ? indices : [];
  if (!liste.length) return null;
  /* NE RIEN DIRE DEUX FOIS (relecture « textes », TEXTES10) : « « Durand »,
     le nom du client de ce devis et « Lefèvre », le nom du client de ce
     devis » ; « le numéro de téléphone du client de ce devis et un numéro de
     téléphone » — le MÊME numéro, deux fois. Les mots d'un même genre se
     regroupent, le numéro quelconque se tait quand c'est celui du client, et
     une énumération dont un élément porte déjà une virgule prend une
     virgule avant le dernier « et ». Un mot d'adresse vient de la fiche OU du
     lieu des travaux (souvent une copie l'une de l'autre) : on dit les deux. */
  const motsDe = (genre) => [...new Set(liste.filter((i) => i.genre === genre && i.mot).map((i) => i.mot))];
  const aUn = (genre) => liste.some((i) => i.genre === genre);
  const enListe = (xs, lien) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')}${lien}${xs[xs.length - 1]}` : xs[0]);
  const cites = (xs) => enListe(xs.map((m) => `« ${m} »`), ' et ');
  const morceaux = [];
  const noms = motsDe('nom');
  if (noms.length) morceaux.push(`${cites(noms)}, ${noms.length > 1 ? 'des mots du nom' : 'le nom'} du client de ce devis`);
  const adresses = motsDe('adresse');
  if (adresses.length) {
    morceaux.push(`${cites(adresses)}, ${adresses.length > 1 ? 'des mots' : 'un mot'} de l’adresse du client ou du chantier`);
  }
  if (aUn('telephone')) morceaux.push('le numéro de téléphone du client de ce devis');
  else if (aUn('numero')) morceaux.push('un numéro de téléphone');
  if (aUn('email')) morceaux.push('une adresse e-mail');
  if (aUn('civilite')) morceaux.push('une formule comme « chez » ou « Mme », qui désigne souvent un client');
  if (!morceaux.length) return null;
  const enumeres = enListe(morceaux, morceaux.some((m) => m.includes(',')) ? ', et ' : ' et ');
  return page
    ? `Cette phrase contient ${enumeres} : elle vous est proposée telle quelle sur vos devis, pour tous vos clients.`
    : `Cette phrase contient ${enumeres}. Elle resterait dans votre base même si vous supprimez ce client.`;
}

/** Une proposition a changé l'unité d'une ligne qui avait une quantité :
 *  « L'unité est passée de m² à forfait : la quantité 27 est restée,
 *  vérifiez-la. » — 27 m² à 900 € le forfait, sinon, font 24 300 € sans un mot.
 *  `null` si rien n'a changé ou s'il n'y a pas de quantité. */
export function changementDUnite(avant, apres) {
  const a = uniteDe(avant && avant.unite);
  const b = uniteDe(apres && apres.unite);
  const q = avant && avant.quantiteMilliemes;
  if (!a || !b || a.cle === b.cle || !entier(q) || q <= 0) return null;
  /* Entre guillemets (relecture « textes », TEXTES16) : « passée de heure »
     et « de unité » manquaient l'élision ; cité, le nom de l'unité n'en
     demande pas. */
  return `L’unité est passée de « ${a.pastille} » à « ${b.pastille} » : la quantité ${milliemesEnSaisie(q)} est restée, vérifiez-la.`;
}

/** Les postes de la page, rangés par leur phrase à plat puis leur
 *  identifiant — une comparaison de chaînes, jamais selon la langue. */
export function trierPostes(postes) {
  return (Array.isArray(postes) ? postes : []).map((p) => [aPlat(p.designation) || '', p])
    .sort((a, b) => comparer(a[0], b[0]) || comparer(a[1].id, b[1].id))
    .map((x) => x[1]);
}

/* ================================================================== */
/*  CE QUE LES ÉCRANS MONTRENT — décidé ICI, et fait tourner par        */
/*  `verifier-postes` (corrections « écran », 24/10/2026)               */
/* ================================================================== */
/*
 * POURQUOI CES FONCTIONS EXISTENT. La relecture « écran » du lot P a posé
 * quinze défauts sur une copie des écrans — six propositions au lieu de
 * trois, des propositions dès une lettre, la phrase de T11 qui s'efface au
 * premier champ quitté, « Ajouter à ma base » pendant la lecture, une porte
 * masquée, une page qui cherche « à la lettre », la référence écrite dans la
 * liste du devis… — et QUATORZE passaient au vert. Les contrôles lisaient la
 * FORME du code des écrans ; aucun ne pouvait le faire TOURNER, parce qu'un
 * écran charge React Native, que `node` ne sait pas ouvrir.
 *
 * Ce que les écrans montrent est donc DÉCIDÉ ici, dans un fichier que
 * `node` fait tourner, et les écrans ne font plus que l'afficher.
 * `verifier-postes` fait tourner chacune de ces fonctions sur les cas qui
 * comptent, et refuse un écran qui ne passe plus par elles ou qui contourne
 * leur résultat. Ce qui ne se voit qu'à l'écran — une position, une
 * couleur calculée, un geste — reste à `mesure-devis`, au navigateur.
 */

/** La base telle qu'un écran a le droit de s'en servir : le tableau LU, ou
 *  `null` tant que la lecture n'a pas abouti — en lecture comme en échec.
 *  Une base illisible ne propose rien et ne juge aucun doublon : on
 *  jugerait sur une liste peut-être périmée. */
export function postesLus(postes, etat) {
  return etat === 'ok' && Array.isArray(postes) ? postes : null;
}

/**
 * LES PROPOSITIONS À MONTRER SOUS LE CHAMP DE LA DÉSIGNATION, rangée par
 * rangée : `[{ cle, proposition, titre, distinction, morceaux, libelle }]`.
 *   - rien tant que ni la mémoire ni la base ne sont lues ;
 *   - rien quand le texte est celui qu'on vient de CHOISIR, ou celui de
 *     l'ouverture (`choisi`) : les propositions répondent à une FRAPPE,
 *     jamais à l'ouverture d'une ligne existante (B1 du lot 1 : un appui
 *     distrait changeait son prix) ;
 *   - rien sous `LETTRES_MIN` lettres, jamais plus de `PROPOSITIONS_MAX`.
 * `titre` est la phrase rangée, mot pour mot — ce qu'un appui recopie
 * (`proposition`). `morceaux` : le détail coupé autour du prix recopié
 * (`Montant` l'écrit à l'encre du texte). `libelle` : ce que VoiceOver lit.
 *
 * `distinction` (ECRAN9) : deux propositions de la MÊME phrase — une autre
 * unité, une autre fourniture — montraient deux titres identiques, et la
 * différence n'était écrite, en gris, qu'au milieu du détail de l'une des
 * deux. Elle est désormais dite EN TÊTE du détail, des deux côtés (« avec la
 * fourniture » / « fourniture non comprise », « au mètre carré » / « au
 * forfait »), et la fourniture n'y est pas répétée plus loin. La rangée ne
 * grandit pas : c'est la même ligne, dans un autre ordre.
 */
export function propositionsAMontrer({
  postes = null, postesEtat = 'vide', memoire = null, texte = '', choisi = null, idLigne = null,
} = {}) {
  const base = postesLus(postes, postesEtat);
  const souvenirs = Array.isArray(memoire) ? memoire : null;
  if ((!souvenirs && !base) || choisi === texte) return [];
  if (String(texte || '').trim().length < LETTRES_MIN) return [];
  const liste = suggestionsPourLaFrappe({
    postes: base || VIDE, memoire: souvenirs || VIDE, texte, idLigne, max: PROPOSITIONS_MAX,
  });
  /* Les propositions de même PHRASE, à une variante d'écriture près (la
     première moitié de leur clé). */
  const phraseDe = (p) => JSON.parse(p.cle)[0];
  const groupes = new Map();
  liste.forEach((p) => groupes.set(phraseDe(p), [...(groupes.get(phraseDe(p)) || []), p]));
  return liste.map((p) => {
    const freres = groupes.get(phraseDe(p));
    const parUnite = new Set(freres.map((x) => x.unite)).size > 1;
    const parFourniture = new Set(freres.map((x) => vrai(x.fournitureNonComprise))).size > 1;
    const dits = [];
    if (parUnite) dits.push(aLUnite(uniteDe(p.unite)));
    if (parFourniture) dits.push(vrai(p.fournitureNonComprise) ? 'fourniture non comprise' : 'avec la fourniture');
    return {
      cle: `${p.source}-${p.cle}`,
      proposition: p,
      titre: p.designation,
      distinction: dits.length ? dits.join(', ') : null,
      morceaux: morceauxDuDetail(p, { sansFourniture: parFourniture }),
      libelle: libelleDeSuggestion(p, { avecLaFourniture: parFourniture }),
    };
  });
}

/** La phrase de T11 et le texte de la quantité qu'elle demande de vérifier :
 *  rien. */
export const PHRASE_UNITE_VIDE = Object.freeze({ phrase: null, quantite: null });

/**
 * LA PHRASE DE T11 APRÈS UN GESTE — « L'unité est passée de heure à
 * forfait : la quantité 12 est restée, vérifiez-la. » `etat` est
 * `{ phrase, quantite }` (`PHRASE_UNITE_VIDE` au départ) ; `geste` :
 *   - `{ type: 'proposition', avant, unite, quantite }` : une proposition
 *     choisie. Si elle change l'unité d'une ligne qui a une quantité, la
 *     phrase paraît, et retient le TEXTE de la quantité à cet instant. Une
 *     proposition qui GARDE l'unité ne la fait pas taire (ECRAN7 : 12 h → un
 *     forfait → un second forfait, et la phrase disparaissait, la quantité
 *     toujours à 12 : 2 160 € sans un mot) ;
 *   - `{ type: 'quantite_quittee', quantite }` : la quantité perd le focus ;
 *     la phrase ne s'efface que si son texte a CHANGÉ. « Retouchée » veut
 *     dire changée, pas quittée : fermer le clavier pour relire effaçait la
 *     phrase qui demande de relire (le défaut corrigé à l'étape 7) ;
 *   - `{ type: 'unite' }` (une unité rechoisie) et `{ type: 'surface' }`
 *     (une surface recopiée dans la quantité) : elle s'efface.
 */
export function phraseUniteApres(etat, geste) {
  const e = etat && typeof etat === 'object' ? etat : PHRASE_UNITE_VIDE;
  const g = geste || {};
  if (g.type === 'proposition') {
    const phrase = changementDUnite(g.avant, { unite: g.unite });
    return phrase ? { phrase, quantite: g.quantite ?? null } : e;
  }
  if (g.type === 'quantite_quittee') return e.phrase && g.quantite !== e.quantite ? PHRASE_UNITE_VIDE : e;
  if (g.type === 'unite' || g.type === 'surface') return PHRASE_UNITE_VIDE;
  return e;
}

/** « Ce poste existe déjà dans votre base, sous « … ». » suivi de la sortie
 *  d'un faux rapprochement, en UN paragraphe. Quand la ligne de référence,
 *  au-dessus du prix, NOMME déjà le poste (`citeeAuDessus` : « Votre prix
 *  de référence pour « … » »), sa phrase n'est pas recopiée une seconde
 *  fois (ECRAN9 : à 320 points, la carte empilait quatre phrases et citait
 *  deux fois la même). */
export function phraseExisteDeja(sous, { citeeAuDessus = false } = {}) {
  if (!sous) return null;
  return `Ce poste existe déjà dans votre base${citeeAuDessus ? '' : `, sous « ${sous} »`}. ${PHRASE_SORTIE}`;
}

/**
 * CE QUE LA CARTE D'UNE LIGNE MONTRE DE LA BASE, prêt à afficher :
 * `{ etat, reference, existe, ecart, phraseEtat, action }`.
 *   - `reference` : la ligne de référence, AU-DESSUS du prix, en morceaux ;
 *   - `existe` : la ligne est une VARIANTE d'un poste — `phraseExisteDeja`,
 *     sans recopier la phrase du poste quand la référence la cite déjà ;
 *   - `ecart` : `{ morceaux, libelle }`, « Vous mettez 52,00 € — c'est
 *     voulu ? », et le libellé VoiceOver entier ;
 *   - `phraseEtat` : « Dans votre base de postes. », « Dans votre base, sans
 *     prix de référence. », « Il n'a pas encore de prix de référence. » ;
 *   - `action` : l'UNIQUE bouton du bloc, `{ cle, label, nom,
 *     avecLePrixDeLaLigne }` — `cle` vaut `'ajouter'`, `'changer'`,
 *     `'modifier'` ou `'fixer'` —, ou `null`. Sans `peutAjouter` (l'écran
 *     n'a pas de feuille d'ajout à ouvrir), jamais « Ajouter » : un bouton
 *     qui ne fait rien est pire que pas de bouton.
 * Rien de tout cela d'une base qui n'est pas LUE : ni une référence
 * peut-être périmée, ni « Ajouter à ma base » pendant la lecture (on
 * proposerait un doublon). L'échec et son « Réessayer » vivent sous la
 * désignation.
 */
export function vueDeLaBase(ligne, postes, postesEtat, { regimeDeclareLe = null, peutAjouter = true } = {}) {
  const base = etatDansLaBase(ligne, postes, postesEtat);
  const vue = { etat: base.etat, reference: null, existe: null, ecart: null, phraseEtat: null, action: null };
  if (base.etat === 'ajoutable' && peutAjouter) {
    vue.action = { cle: 'ajouter', label: 'Ajouter à ma base', nom: 'Ajouter cette ligne à ma base de postes', avecLePrixDeLaLigne: true };
    return vue;
  }
  if (base.etat !== 'dans_la_base') return vue;
  const opts = { regimeDeclareLe };
  const reference = referenceDuPoste(ligne, postes, opts);
  const ecart = ecartAuPoste(ligne, postes, opts);
  if (reference) vue.reference = morceauxDeLaReference(reference);
  vue.existe = phraseExisteDeja(base.sous, { citeeAuDessus: !!reference });
  const modifier = { cle: 'modifier', label: 'Modifier', nom: 'Modifier le prix de référence de ce poste', avecLePrixDeLaLigne: false };
  if (reference && reference.avantRegime) {
    /* La ligne de référence dit déjà « vérifiez-le » : pas de question. */
    vue.action = modifier;
  } else if (ecart) {
    vue.ecart = { morceaux: morceauxDeLEcart(ecart), libelle: libelleEcart(ecart) };
    vue.action = { cle: 'changer', label: 'Changer ma référence', nom: libelleChangerReference(ecart), avecLePrixDeLaLigne: true };
  } else if (reference) {
    if (!base.sous) vue.phraseEtat = 'Dans votre base de postes.';
    vue.action = modifier;
  } else {
    vue.phraseEtat = base.sous ? 'Il n’a pas encore de prix de référence.' : 'Dans votre base, sans prix de référence.';
    vue.action = { cle: 'fixer', label: 'Fixer le prix', nom: 'Fixer le prix de référence de ce poste', avecLePrixDeLaLigne: true };
  }
  return vue;
}

/**
 * L'ÉTAT DE LA FEUILLE « AJOUTER À MA BASE », recalculé à chaque rendu :
 * `{ etat, existant, sous, aUneReference, memePrix, champ, action }`.
 *   - `'invisible'` : la base a refusé un doublon qu'elle ne montre pas ;
 *   - `'saisie'` : rien de cette clé dans la base — le champ, « Ajouter » ;
 *   - `'existe'` : la base (relue) a ce poste. « Même prix » — « Fermer »
 *     seul, ni champ ni bouton — ne se dit que si le prix PORTÉ est un vrai
 *     montant égal à la référence, ET que l'artisan n'a pas retouché le
 *     champ depuis (`prixTouche`) : un prix en train d'être tapé n'est pas
 *     encore porté. ECRAN4 : il tapait 24 sans quitter le champ, la base
 *     arrivait, la feuille passait d'elle-même à « Il a déjà ce prix de
 *     référence » et le champ disparaissait avec ses 24. Un prix VIDE n'est
 *     jamais « le même ».
 * `postes` est la base LUE (`postesLus`) : un doublon ne se juge pas sur
 * une liste peut-être périmée.
 */
export function etatDeLaFeuilleAjout({
  valeurs, postes = null, prixTape = null, prixTouche = false, doublonInvisible = false,
} = {}) {
  const existant = posteExistant(valeurs, postes);
  if (!existant) {
    return doublonInvisible
      ? { etat: 'invisible', existant: null, sous: null, aUneReference: false, memePrix: false, champ: false, action: null }
      : { etat: 'saisie', existant: null, sous: null, aUneReference: false, memePrix: false, champ: true, action: 'ajouter' };
  }
  const aUneReference = entier(existant.prixReferenceCentimes) && existant.prixReferenceCentimes > 0;
  const memePrix = aUneReference && !prixTouche && entier(prixTape) && prixTape === existant.prixReferenceCentimes;
  let action = null;
  if (!memePrix) action = aUneReference ? 'changer' : 'fixer';
  return {
    etat: 'existe', existant, sous: sousQuelPoste({ designation: valeurs.designation }, existant), aUneReference, memePrix,
    champ: !memePrix, action,
  };
}

/** « Le prix de référence 45,00 € / m², fixé le 21/10/2026, sera effacé :
 *  Opus n'en garde aucune trace. » — ce que dit le SECOND appui de
 *  « Retirer le prix de référence », en morceaux autour du montant. `null`
 *  sans prix. */
export function phraseRetraitDuPrix(poste) {
  if (!poste || !entier(poste.prixReferenceCentimes) || poste.prixReferenceCentimes <= 0) return null;
  const ref = poste.prixReferenceCentimes;
  const date = dateFrancaise(poste.prixFixeLe);
  return coupeAutourDuPrix(
    `Le prix de référence ${montant(ref)}${parUnite(uniteDe(poste.unite))}${date ? `, fixé le ${date},` : ''} sera effacé : `
      + 'Opus n’en garde aucune trace.',
    ref,
  );
}

/** Ce que la fiche d'un client dit, au SECOND appui de « Supprimer cette
 *  fiche », de la base de postes — TOUJOURS, qu'il ait des devis ou non.
 *
 *  LA RELECTURE « TEXTES » (TEXTES1) : le texte opposable disait déjà de
 *  chercher son nom dans « Ma base de postes », mais l'écran où l'on
 *  supprime la fiche n'en disait rien — et son seul avertissement ne
 *  paraissait que si le client avait des devis. Or c'est quand il n'en a
 *  plus qu'une phrase de la base peut être la DERNIÈRE copie de son nom :
 *  un ménage incomplet ressemblait à un ménage fait, à l'endroit précis où
 *  l'on fait le ménage. Et la phrase reprise dans le devis d'un AUTRE
 *  client (TEXTES3) y reste aussi. `verifier-legal` exige que la fiche la
 *  rende sous la seule condition de la confirmation. */
export const PHRASE_POSTES_D_UN_CLIENT = 'Une phrase de votre base de postes qui le nommerait n’est pas supprimée avec '
  + 'sa fiche : cherchez son nom dans « Ma base de postes ». Si vous avez repris une de ces phrases dans le devis '
  + 'd’un autre client, elle y reste aussi : corrigez-la dans ce devis.';

/** Ce que dit le SECOND appui de « Retirer ce poste ».
 *
 *  LA PHRASE D'AVANT ÉTAIT FAUSSE (relecture « textes », TEXTES2) : « Il ne
 *  sera plus proposé sur vos devis ». Un poste naît TOUJOURS d'une ligne de
 *  devis, et la mémoire des prix (lot 1) relit ces lignes : tant que le
 *  poste est là, il la masque ; retiré, la même phrase revient, au dernier
 *  prix écrit. C'est justement le geste d'un artisan qui veut qu'un nom de
 *  client cesse d'apparaître sur les devis des autres — la promesse le
 *  rassurait à tort. « Si un de vos devis porte cette phrase », et non
 *  « tant que » : la mémoire ne relit que les lignes les plus récentes
 *  (`MEMOIRE_MAX`), une durée serait une promesse. `verifier-postes` FAIT
 *  TOURNER le cas : poste retiré, la mémoire repropose la phrase, donc la
 *  phrase doit le dire. */
export const PHRASE_RETRAIT_DU_POSTE = 'Il ne sera plus proposé comme poste de votre base. Si un de vos devis porte '
  + 'cette phrase, Opus peut encore vous la proposer, au dernier prix écrit. Les lignes déjà écrites gardent leur '
  + 'phrase et leur prix.';

/**
 * CE QUE DIT LE SECOND APPUI DE « SUPPRIMER CE BROUILLON » (relecture
 * « textes », TEXTES8). Le texte opposable dit « supprimer un devis ne
 * retire pas les phrases que vous en avez rangées dans votre base », et
 * c'est sur cet écran qu'on supprime un devis pour effacer un client (la
 * fiche du client y envoie) : l'écran doit le dire aussi.
 *   - base LUE, et un poste a ce devis pour origine : ses postes restent ;
 *   - base lue, aucun : rien de plus à dire ;
 *   - base pas lue : « s'il y en a ».
 * Ce que l'origine ne sait pas, et c'est dit plutôt que promis : un poste
 * ajouté avant que le devis soit en base n'a pas de lien d'origine (la
 * saisie ne l'attend pas) — il ne compte pas ici. Le texte opposable, lui,
 * ne dépend d'aucun lien.
 */
export function phraseSuppressionDuBrouillon({ postes = null, postesEtat = 'vide', devisId = null } = {}) {
  const debut = 'Définitif : le brouillon et toutes ses lignes partent. Rien n’avait été envoyé au client.';
  const lus = postesLus(postes, postesEtat);
  if (!lus) return `${debut} S’il y en a, les postes que vous en avez rangés dans votre base de postes restent.`;
  const siens = devisId != null && lus.some((x) => x && x.devisOrigineId != null && String(x.devisOrigineId) === String(devisId));
  return siens ? `${debut} Les postes que vous en avez rangés dans votre base de postes restent.` : debut;
}

/** Ce que dit la feuille d'un poste qui n'est plus dans la base RELUE. */
export const PHRASE_POSTE_ABSENT = 'Ce poste n’est plus dans votre base : il a été retiré, peut-être depuis un autre '
  + 'appareil. Rien n’a été enregistré.';

/**
 * CE QUE DIT UNE FEUILLE APRÈS UN « MODIFIÉ ENTRE-TEMPS » — `{ phrase,
 * absent }`, d'après ce que la relecture a rendu (`liste` : la base relue, ou
 * `null` si la relecture a échoué) et l'identifiant du poste.
 *
 * LA RELECTURE « TEXTES » (TEXTES5) : les deux feuilles affichaient « Il a
 * été relu : vérifiez, puis recommencez si besoin » MÊME quand la relecture
 * avait échoué (`onRelire` rend `null`) — un travail qui n'a pas pu se faire
 * présenté comme fait ; et « modifié » quand le poste avait été RETIRÉ. Une
 * écriture conditionnelle qui ne touche aucune ligne ne dit pas lequel des
 * deux : la base relue, elle, le dit.
 *   - relecture ratée : on ne sait pas — « modifié ou retiré », et la
 *     base n'a pas pu être relue ;
 *   - poste absent de la base relue : il a été retiré (`absent`) ;
 *   - poste présent : il a été modifié, la base est relue.
 */
export function issueDuModifieEntreTemps(liste, posteId) {
  if (!Array.isArray(liste)) {
    return {
      absent: false,
      phrase: 'Ce poste a été modifié ou retiré entre-temps — peut-être depuis un autre appareil. Rien n’a été '
        + 'enregistré, et votre base de postes n’a pas pu être relue : vérifiez votre connexion, puis rouvrez ce poste.',
    };
  }
  if (!liste.some((x) => x && String(x.id) === String(posteId))) return { absent: true, phrase: PHRASE_POSTE_ABSENT };
  return {
    absent: false,
    phrase: 'Ce poste a été modifié entre-temps — peut-être depuis un autre appareil. Rien n’a été enregistré. Votre '
      + 'base a été relue : vérifiez, puis recommencez si besoin.',
  };
}

/**
 * CE QUE LA FEUILLE D'UN POSTE MONTRE : `{ prixDepart, phrasePrix,
 * retirerLePrix, retirerLePoste, renvoiALaPage }`.
 *   - `prixDepart` : ce que le champ porte à l'ouverture — le prix de la
 *     LIGNE après « Changer ma référence » ou « Fixer le prix », sinon la
 *     référence ;
 *   - `phrasePrix` (morceaux, ou `null`) : quand le champ porte un AUTRE
 *     nombre que la référence, elle DIT la référence — « Votre prix de
 *     référence actuel : 45,00 € / m², fixé le 21/10/2026. » (ECRAN3 : « Le
 *     prix actuel a été fixé le 21/10 », sous un champ qui montrait 52, se
 *     lisait « 52 € est déjà la référence ») ; sinon « Le prix actuel a été
 *     fixé le … » ;
 *   - depuis la CARTE, seul « Enregistrer » (ECRAN2) : la feuille ouverte
 *     depuis une ligne offrait trois gestes, dont deux qui détruisent, à huit
 *     points l'un de l'autre. Retirer un prix ou un poste se fait dans « Ma
 *     base de postes », où l'on vient pour ça (`renvoiALaPage`) ;
 *   - depuis la PAGE, « Retirer le prix de référence » (seulement s'il y en
 *     a un) et « Retirer ce poste » — l'écran les fait tous deux en DEUX
 *     appuis ;
 *   - `absent` (TEXTES5) : le poste n'est plus dans la base relue. La feuille
 *     ne propose plus RIEN — ni « Enregistrer », qui repartirait sur un poste
 *     qui n'existe plus, ni retrait — et dit pourquoi (`phraseAbsent`). Dans
 *     la page, elle disparaissait sans un mot ; dans la saisie, elle
 *     retombait sur le poste disparu et redisait « modifié entre-temps ».
 */
export function vueDeLaFeuillePoste({
  poste, prixPropose = null, depuisLaPage = false, regimeDeclareLe = null, absent = false,
} = {}) {
  if (!poste) return null;
  if (absent) {
    return {
      prixDepart: null, phrasePrix: null, retirerLePrix: false, retirerLePoste: false, renvoiALaPage: false,
      enregistrer: false, phraseAbsent: PHRASE_POSTE_ABSENT,
    };
  }
  const ref = entier(poste.prixReferenceCentimes) && poste.prixReferenceCentimes > 0 ? poste.prixReferenceCentimes : null;
  const prixDepart = prixPropose != null ? prixPropose : ref;
  let phrasePrix = null;
  if (ref != null) {
    const fixe = phraseFixeLe(poste, { regimeDeclareLe });
    if (prixDepart !== ref) {
      phrasePrix = coupeAutourDuPrix(
        `Votre prix de référence actuel : ${montant(ref)}${parUnite(uniteDe(poste.unite))}${fixe ? `, ${fixe}` : ''}.`,
        ref,
        { dernier: true },
      );
    } else if (fixe) {
      phrasePrix = coupeAutourDuPrix(`Le prix actuel a été ${fixe}.`, null);
    }
  }
  return {
    prixDepart, phrasePrix, retirerLePrix: !!depuisLaPage && ref != null, retirerLePoste: !!depuisLaPage, renvoiALaPage: !depuisLaPage,
    enregistrer: true, phraseAbsent: null,
  };
}

/** La recherche SANS ses civilités, s'il reste un autre mot : « Mme
 *  Martin » cherche « Martin ». Un artisan recopie le nom tel que la fiche
 *  l'écrit, et « Mme » n'est presque jamais dans la phrase d'un poste —
 *  « Reprise fissures maison MARTIN » ne contient pas « Mme » : la page
 *  répondait « Aucun poste ne contient « Mme Martin ». », la preuve
 *  apparente qu'il n'y avait rien à effacer (relecture « textes »,
 *  TEXTES12). Une recherche faite SEULEMENT d'une civilité reste telle
 *  quelle. */
function rechercheUtile(recherche) {
  const mots = String(recherche || '').trim().split(/\s+/).filter(Boolean);
  const utiles = mots.filter((m) => !CIVILITES.has(cleDeRapprochement(m) || ''));
  return utiles.length && utiles.length < mots.length ? utiles.join(' ') : String(recherche || '').trim();
}

/** Les postes de la page, rangés (`trierPostes`), et filtrés par les mots
 *  de leur CLÉ (`correspondALaRecherche`) : « seuils », « beton »,
 *  « seche chape » trouvent « Seuil », « béton », « Chape sèche » — jamais
 *  une recherche « à la lettre ». Les civilités ne comptent pas
 *  (`rechercheUtile`). */
export function postesDeLaPage(postes, recherche) {
  const tries = trierPostes(postes);
  const utile = rechercheUtile(recherche);
  return utile ? tries.filter((p) => correspondALaRecherche(p.designation, utile)) : tries;
}

/* Un nombre de postes, les milliers séparés par une espace insécable,
   comme les montants (`centimesLisibles`) : « 1 200 » ne se coupe pas en
   fin de ligne. */
const nombreLisible = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, String.fromCharCode(0xa0));

/**
 * CE QUE LA PAGE « MA BASE DE POSTES » MONTRE : `{ enAttente, echec,
 * garderLaListe, visibles, vide, recherche, compte }`.
 *   - `garderLaListe` : une relecture ratée ne VIDE pas l'écran ;
 *   - `vide` : ce que dit une liste vide — `'illisible'` (« Lecture
 *     impossible ») SEULEMENT
 *     quand rien n'a jamais été lu ; `'recherche'` (« Aucun poste ne
 *     contient « … ». ») dès qu'une recherche est tapée, même sous une liste
 *     gardée ; sinon `'base_vide'`. ECRAN6 : après une relecture ratée, une
 *     recherche sans résultat disait « Lecture impossible » — et un second
 *     « Réessayer » — sous une liste qui avait bel et bien été lue ;
 *   - `compte` : « 8 postes », ou `null` tant qu'on ne sait pas ;
 *   - `bandeIncomplete` (relecture « textes », TEXTES12) : une liste coupée
 *     (`incomplete`) le DIT, avec le vrai total quand la base l'a donné
 *     (`total`) — et dit que la recherche ne porte que sur les postes lus :
 *     c'est le chemin d'effacement promis par les textes, il ne doit pas
 *     ressembler à une base vérifiée. Le compte de l'en-tête est alors le
 *     total, pas le nombre lu ;
 *   - `aideRecherche` : une recherche de plusieurs mots qui ne trouve rien
 *     conseille de chercher le nom de famille, seul.
 */
export function vueDeLaPage({
  postes = [], etat = 'vide', lus = false, recherche = '', incomplete = false, total = null,
} = {}) {
  const liste = Array.isArray(postes) ? postes : [];
  const echec = etat === 'echec';
  const garderLaListe = echec && !!lus;
  const cherche = String(recherche || '').trim();
  let vide = 'base_vide';
  if (echec && !garderLaListe) vide = 'illisible';
  else if (cherche) vide = 'recherche';
  const coupe = !!incomplete;
  const totalConnu = coupe && Number.isSafeInteger(total) && total > liste.length ? total : null;
  const nombre = totalConnu ?? liste.length;
  let bandeIncomplete = null;
  if (coupe) {
    bandeIncomplete = totalConnu
      ? `Liste incomplète : votre base compte ${nombreLisible(totalConnu)} postes, Opus n’en a lu que ${nombreLisible(liste.length)}. `
        + 'La recherche ne porte que sur ceux-là.'
      : `Liste incomplète : votre base compte plus de postes qu’Opus n’en a lu (${nombreLisible(liste.length)}). `
        + 'La recherche ne porte que sur ceux-là.';
  }
  return {
    enAttente: (etat === 'chargement' || etat === 'vide') && !lus,
    echec,
    garderLaListe,
    visibles: echec && !garderLaListe ? [] : postesDeLaPage(liste, cherche),
    vide,
    recherche: cherche,
    compte: etat === 'ok' || garderLaListe ? `${nombreLisible(nombre)} ${nombre > 1 ? 'postes' : 'poste'}` : null,
    bandeIncomplete,
    aideRecherche: vide === 'recherche' && cherche.split(/\s+/).length > 1
      ? 'Pour retrouver un client, cherchez son nom de famille, seul.' : null,
  };
}

/** L'état de la base au DÉPART d'une lecture : une base déjà lue reste
 *  `'ok'` pendant qu'on la relit (ce qui a été lu continue de servir — la
 *  feuille « existe déjà » ne repasse pas en « saisie »), sinon
 *  `'chargement'`. */
export function etatAuDepartDeLaLecture(etat) {
  return etat === 'ok' ? 'ok' : 'chargement';
}

/**
 * CE QU'UNE LECTURE DE LA BASE LAISSE derrière elle : `{ etat, prendre,
 * relancer }` — `etat` à poser (ou `null` : n'y touchez pas), `prendre` (la
 * liste lue remplace celle de l'écran), `relancer` (une seconde lecture).
 *   - `depassee` : une lecture PLUS RÉCENTE est partie ; c'est elle qui
 *     décidera ;
 *   - `jetee` : un poste a été RANGÉ pendant la lecture (`rangerPoste`) — sa
 *     liste ne doit pas l'écraser. La première fois, on relance ; la
 *     seconde, on pose l'état sans prendre la liste.
 * AUCUNE ISSUE NE LAISSE LA BASE « EN LECTURE » sans qu'une autre lecture
 * soit en route. ECRAN5 : une lecture jetée revenait sans rien poser ; la
 * base restait `'chargement'` pour toujours, et elle disparaissait des
 * devis sans un mot — ni référence, ni « Ajouter », ni « Réessayer ».
 */
export function issueDeLaLecture({ reussie = false, depassee = false, jetee = false, relancee = false } = {}) {
  if (depassee) return { etat: null, prendre: false, relancer: false };
  if (!jetee) return { etat: reussie ? 'ok' : 'echec', prendre: !!reussie, relancer: false };
  if (!relancee) return { etat: null, prendre: false, relancer: true };
  return { etat: reussie ? 'ok' : 'echec', prendre: false, relancer: false };
}
