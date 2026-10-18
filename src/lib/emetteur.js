/**
 * « MON ENTREPRISE » POUR LES DEVIS — ce qui rend un devis légal (lot 0a).
 *
 * CE QUE CE FICHIER FAIT, ET POURQUOI IL EST À PART
 * -------------------------------------------------
 * Il porte TOUT le calcul de la fiche d'entreprise du devis, sans rien
 * afficher : ce qui manque (`motifsEmetteur`, miroir de la fonction SQL
 * `emetteur_incomplet()`), les refus (`CONTRAINTES`, miroirs des contraintes
 * de la section 46 de `schema.sql`), le nettoyage (`nettoyer*`, miroirs des
 * déclencheurs), l'en-tête tel qu'il s'imprimera (`enteteImprime`), et les
 * avis qui ne bloquent rien (`avisEmetteur`).
 *
 * Il n'importe QUE des fichiers que `node` sait ouvrir — `entreprise.js`,
 * `formes-juridiques.js`, `siret.js`, `mediateurs.js`, et
 * `pieces-justificatives.js` pour le NOM des assurances —, jamais `erreurs.js`,
 * `theme.js` ni rien qui charge React Native : `verifier-emetteur` le FAIT
 * TOURNER, et un contrôle qui plante ne vérifie rien (treizième application
 * de la leçon de `cloudinary-adresses.js`). Le contrôle tient cette liste.
 *
 * LES NOMS SONT CEUX DE LA BASE, partout — `denomination_ei`,
 * `frais_deplacement_centimes` —, comme `src/lib/entreprise.js`. Deux
 * écritures du même objet finissent par diverger.
 *
 * LES RÉPONSES DU PROPRIÉTAIRE DU 18/10/2026, appliquées ici
 * ---------------------------------------------------------
 *   1. Le code de la CONSOMMATION ne vaut que face à un consommateur. Ce
 *      qu'il exige — téléphone, e-mail, adresse de l'établissement, garantie
 *      légale, modalités de paiement, d'exécution et de réclamation, n° de
 *      TVA au régime réel, médiateur, profession réglementée — devient un
 *      motif préfixé `conso_` : il ne bloque qu'un devis à un particulier
 *      (le filtrage par destinataire vient au lot 2). Le code de COMMERCE,
 *      lui, vaut pour tout document : mention EI (R. 526-27), capital d'une
 *      SARL ou d'une société par actions (R. 123-238), et, pour une
 *      entreprise immatriculée au RCS, la mention RCS, la ville du greffe et
 *      le LIEU DU SIÈGE (R. 123-237, qui ne vise que le RCS : relu le
 *      18/10/2026). Ce n'est pas un choix. Un artisan inscrit au seul RNE
 *      ne doit son adresse qu'au particulier : `conso_`.
 *   2. AUCUNE assurance n'est exigée en général : la table et l'écran
 *      restent, l'assurance est facultative. Ce qui est dû selon les
 *      travaux d'un devis (la décennale jointe pour un ouvrage) relève des
 *      lots 1 et 2 ; ici, un AVIS seulement (`avisEmetteur`).
 *   3. La seule règle plus stricte que la loi qu'il garde : relire le SIRET
 *      chaque année (`entreprise_ancienne`), présentée comme une règle
 *      d'Opus. Les frais de déplacement restent à déclarer pour tout devis :
 *      c'est le choix déjà fait par le plan (10.3), et la phrase le dit.
 *   4. Ce qui s'imprime quand l'artisan touche « Je ne facture pas de frais
 *      de déplacement » : « Déplacement offert ».
 */
import { dateFrancaise } from './entreprise.js';
import { formeCourte } from '../data/formes-juridiques.js';
import { formaterSiret } from './siret.js';
import { MEDIATEURS, MEDIATEURS_RELEVES_LE } from '../data/mediateurs.js';
import { DECENNALE, RC_PRO } from '../data/pieces-justificatives.js';

/* ================================================================== */
/*  CE QUE LE CLIENT A LE DROIT D'ENVOYER                              */
/* ================================================================== */

/**
 * Les colonnes que l'application écrit, table par table.
 *
 * Exclues, et c'est le point : `pro_id` (posé par l'API depuis la session),
 * `regime_tva_declare_le` et `modifie_le` (posées par la BASE, toute valeur
 * du client est ignorée), `id` et `created_at` d'une assurance. Le contrôle
 * compare cette liste aux trois `create table`, dans les deux sens : une
 * colonne écrite par personne, ou envoyée sans exister, se voit tout de suite.
 */
export const COLONNES_ECRITES = Object.freeze({
  emetteur: Object.freeze([
    'denomination_ei', 'registre', 'greffe_ville', 'capital_centimes', 'capital_variable',
    'en_liquidation', 'locataire_gerant',
    'etablissement_adresse', 'etablissement_code_postal', 'etablissement_ville',
    'siege_adresse', 'siege_code_postal', 'siege_ville',
    'telephone', 'email', 'regime_tva',
    'mediateur_nom', 'mediateur_adresse', 'mediateur_site',
    'garantie_legale_texte', 'garantie_commerciale_texte', 'sav_texte',
    'modalites_paiement_texte', 'modalites_execution_texte', 'reclamations_texte',
  ]),
  emetteur_assurances: Object.freeze([
    'nature', 'libelle', 'assureur_nom', 'assureur_coordonnees', 'couverture',
    'numero_contrat', 'valide_jusquau', 'attestation_chemin',
  ]),
  tarifs_pro: Object.freeze(['frais_deplacement_centimes', 'frais_deplacement_texte']),
});

/** Une chaîne vide ou faite de blancs ne dit rien : `null`. Il n'y a qu'UNE façon de dire « vide ». */
function videEnNull(v) {
  return typeof v === 'string' && v.trim() === '' ? null : v;
}

/**
 * Ce qui part vers la base : les seules colonnes écrites, `''` → `null`.
 * Une clé absente (`undefined`) n'est PAS envoyée : un `upsert` qui la
 * nommerait l'écraserait.
 */
export function pourLaBase(table, objet) {
  const colonnes = COLONNES_ECRITES[table];
  if (!colonnes) throw new Error(`Table inconnue : ${table}`);
  const sortie = {};
  for (const c of colonnes) {
    if (objet && objet[c] !== undefined) sortie[c] = videEnNull(objet[c]);
  }
  return sortie;
}

/**
 * LA LIGNE CHARGÉE, CORRIGÉE DE CE QUE LE FORMULAIRE A LU — et rien d'autre.
 *
 * Une section que l'écran n'affiche pas (le nom d'EI pour une société, le
 * capital pour un EI, les adresses quand le répertoire les donne) n'a aucun
 * champ monté : sa lecture rend `undefined`. Sans cette fusion, l'`upsert`
 * enverrait ces colonnes vides et EFFACERAIT ce qui était enregistré —
 * sans un mot, puisque rien n'aurait échoué. On part donc de la ligne
 * chargée, et on ne remplace que les clés réellement lues.
 */
export function fusionnerFormulaire(charge, lu) {
  const sortie = { ...(charge || {}) };
  for (const [cle, valeur] of Object.entries(lu || {})) {
    if (valeur === undefined) continue;
    sortie[cle] = videEnNull(valeur);
  }
  return sortie;
}

/** Les choix du formulaire — des `Option`, jamais des champs texte. */
export const CHOIX_DU_FORMULAIRE = Object.freeze(['registre', 'regime_tva', 'capital', 'frais']);

/**
 * LES CHOIX DE DÉPART — et RIEN de pré-coché.
 *
 * Une ligne `null` (fiche jamais enregistrée) donne les quatre choix à
 * `null`. C'est la règle du plan (10.1) : un franchisé présumé à tort
 * émettrait des devis sans TVA, et Opus ne coche jamais à la place de
 * l'artisan. Les deux drapeaux « en liquidation » et « locataire-gérant »
 * ne sont pas des choix mais des interrupteurs, lus sur la ligne chargée.
 *
 *   capital   'montant' | 'variable' | null
 *   frais     'aucun' (« Je ne facture pas de frais de déplacement »)
 *             | 'facture' (un montant ou des conditions) | null
 */
export function etatInitialFormulaire(emetteur, tarifs = null) {
  const e = emetteur || null;
  let capital = null;
  if (e && e.capital_variable === true) capital = 'variable';
  else if (e && e.capital_centimes != null) capital = 'montant';
  let frais = null;
  if (tarifs && tarifs.frais_deplacement_centimes === 0) frais = 'aucun';
  else if (tarifs && (tarifs.frais_deplacement_centimes != null || tarifs.frais_deplacement_texte != null)) {
    frais = 'facture';
  }
  return {
    registre: e && e.registre != null ? e.registre : null,
    regime_tva: e && e.regime_tva != null ? e.regime_tva : null,
    capital,
    frais,
  };
}

/* ================================================================== */
/*  LES LONGUEURS, LES CHOIX, LES LIBELLÉS                             */
/* ================================================================== */

/**
 * Les longueurs maximales, IDENTIQUES des deux côtés : le formulaire les
 * pose en `maxLength`, et `emetteur_longueurs_check`,
 * `emetteur_assurance_longueurs_check` et `tarif_frais_texte_check` les
 * tiennent en base. `telephone` (30) est tenu par `emetteur_telephone_check`.
 */
export const LONGUEUR_MAX = Object.freeze({
  emetteur: Object.freeze({
    denomination_ei: 160,
    greffe_ville: 80,
    etablissement_adresse: 200,
    siege_adresse: 200,
    etablissement_ville: 120,
    siege_ville: 120,
    telephone: 30,
    email: 254,
    mediateur_nom: 160,
    mediateur_adresse: 300,
    mediateur_site: 200,
    garantie_legale_texte: 2000,
    garantie_commerciale_texte: 2000,
    sav_texte: 1000,
    modalites_paiement_texte: 1000,
    modalites_execution_texte: 1000,
    reclamations_texte: 1000,
  }),
  emetteur_assurances: Object.freeze({
    libelle: 80,
    assureur_nom: 160,
    assureur_coordonnees: 300,
    couverture: 120,
    numero_contrat: 60,
    attestation_chemin: 300,
  }),
  tarifs_pro: Object.freeze({ frais_deplacement_texte: 300 }),
});

/** Où l'entreprise est immatriculée. « Registre » ne désigne ici que le RCS et le RNE. */
export const REGISTRES = Object.freeze([
  Object.freeze({
    cle: 'rcs',
    libelle: 'Au registre du commerce et des sociétés (RCS)',
    aide: 'Le devis portera « RCS » suivi de la ville du greffe et de votre numéro SIREN.',
  }),
  Object.freeze({
    cle: 'rne',
    libelle: 'Au registre national des entreprises (RNE) seulement',
    aide: 'C’est le cas d’un artisan qui n’est pas commerçant : le devis portera votre numéro SIREN.',
  }),
  Object.freeze({
    cle: 'aucun',
    libelle: 'Nulle part (ni RCS ni RNE)',
    aide: 'Rare depuis 2023 : presque toutes les entreprises sont inscrites au registre national '
      + 'des entreprises.',
  }),
]);

/** La phrase posée quand seule l'option RCS est proposée (forme de catégorie 5 ou 6). */
export const REGISTRE_D_UNE_SOCIETE = 'Pour une société, commerciale ou civile, c’est le RCS.';

/** Le régime de TVA. Rien n'est coché d'avance (voir `etatInitialFormulaire`). */
export const REGIMES_TVA = Object.freeze([
  Object.freeze({
    cle: 'franchise',
    libelle: 'Franchise en base de TVA',
    aide: 'Vos devis porteront « TVA non applicable, article 293 B du CGI », sans aucune TVA.',
  }),
  Object.freeze({
    cle: 'reel',
    libelle: 'Régime réel : je facture la TVA',
    aide: 'Chaque ligne de vos devis portera son taux de TVA.',
  }),
]);

/**
 * La nature d'une assurance. « Autre » demande un libellé : il ne dit rien au client.
 *
 * Les deux NOMS viennent de `pieces-justificatives.js`, qui les porte déjà
 * pour le badge : un nom de pièce recopié ailleurs se périme sans bruit
 * (c'est ainsi que « extrait Kbis » est resté affiché à des
 * micro-entrepreneurs), et `verifier-pieces` refuse qu'on l'écrive deux
 * fois. Les CLÉS, elles, sont celles de la contrainte
 * `emetteur_assurance_nature_check` (`rc_pro`, avec un souligné).
 */
export const NATURES_ASSURANCE = Object.freeze([
  Object.freeze({ cle: 'decennale', libelle: DECENNALE.nom }),
  Object.freeze({ cle: 'rc_pro', libelle: RC_PRO.nom }),
  Object.freeze({ cle: 'autre', libelle: 'Autre assurance' }),
]);

/**
 * Les deux libellés que l'aperçu imprime dès le 0a. Ils DÉMÉNAGERONT dans
 * `mentions-devis.js` au lot 2, avec les libellés recopiés depuis
 * Légifrance. « Déplacement offert » est le choix du propriétaire
 * (18/10/2026), à la place de « Frais de déplacement : non facturés ».
 */
export const LIBELLES_IMPRIMES = Object.freeze({
  franchise: 'TVA non applicable, article 293 B du CGI',
  fraisNonFactures: 'Déplacement offert',
});

/**
 * Les métiers dont l'appartenance à une profession réglementée ne fait pas
 * de doute (R. 111-2 6°). IDENTIQUE au tableau SQL d'`emetteur_incomplet()` :
 * le contrôle compare les deux, et vérifie que chaque clé existe au
 * catalogue des métiers. La liste est à confirmer avec un juriste.
 */
export const METIERS_PROFESSION_REGLEMENTEE = Object.freeze([
  'architecte', 'geometre-expert', 'avocat-construction', 'avocat-immobilier', 'expert-comptable-btp',
]);

/* ================================================================== */
/*  CE QUE L'ON SAIT DE LA FORME JURIDIQUE                             */
/* ================================================================== */

/* LA LOGIQUE À TROIS VALEURS DE POSTGRESQL, écrite une fois.
   `emetteur_incomplet()` produit un motif seulement quand sa condition vaut
   VRAI — une condition qui vaut `null` n'en produit pas. Le miroir doit
   rendre la même chose sur les mêmes données, `null` compris : une forme
   juridique inconnue ne doit ni réclamer un capital, ni s'en dispenser par
   accident. `null` = « on ne sait pas ». */
const et3 = (...v) => (v.some((x) => x === false) ? false : v.some((x) => x == null) ? null : true);
const ou3 = (...v) => (v.some((x) => x === true) ? true : v.some((x) => x == null) ? null : false);
const egal3 = (a, b) => (a == null || b == null ? null : a === b);
const premiereLettre = (forme) => (forme == null ? null : String(forme).charAt(0));

/** `coalesce(r.est_ei, r.forme_juridique = '1000')`, en trois valeurs. */
function eiSql(r) {
  if (!r) return null;
  if (r.est_ei === true || r.est_ei === false) return r.est_ei;
  return egal3(r.forme_juridique == null ? null : String(r.forme_juridique), '1000');
}
const socSql = (r) => (r ? egal3(premiereLettre(r.forme_juridique), '5') : null);
/* LE CAPITAL N'EST DÛ QUE PAR UNE SARL OU UNE SOCIÉTÉ PAR ACTIONS
   (code de commerce, R. 123-238 3° et 4°, relu le 18/10/2026) : une SNC ou
   une SCS indique sa forme, pas son capital. Les codes de l'INSEE : 54
   (SARL), 55 et 56 (SA), 57 (SAS), 58 (SE), et les sociétés en commandite
   PAR ACTIONS 5308, 5309, 5370, 5385. Le tableau est le MÊME en SQL
   (`emetteur_incomplet`), et le contrôle compare les deux. Les coopératives
   particulières (51xx) n'y sont pas : aucun artisan n'en relève, et leur
   forme ne se lit pas dans le code. */
export const CAPITAL_DU_PREFIXES = Object.freeze(['54', '55', '56', '57', '58']);
export const CAPITAL_DU_FORMES = Object.freeze(['5308', '5309', '5370', '5385']);
const capitalDuSql = (r) => {
  if (!r || r.forme_juridique == null) return null;
  const f = String(r.forme_juridique);
  return CAPITAL_DU_PREFIXES.includes(f.slice(0, 2)) || CAPITAL_DU_FORMES.includes(f);
};
const rcsObligeSql = (r) => {
  if (!r) return null;
  const l = premiereLettre(r.forme_juridique);
  return l == null ? null : l === '5' || l === '6';
};

/** Entrepreneur individuel (une EIRL est rangée sous le même code 1000 : l'écran ne peut pas la distinguer). */
export function estEI(entreprise) {
  return eiSql(entreprise) === true;
}

/**
 * Société commerciale (catégorie INSEE 5) : le formulaire lui montre le
 * capital, et l'aperçu l'imprime s'il est écrit — une SNC « à capital
 * variable » le dit aussi (L. 231-2). Mais seules une SARL ou une société
 * par actions le DOIVENT : c'est `doitIndiquerSonCapital`.
 */
export function estSocieteCommerciale(entreprise) {
  return socSql(entreprise) === true;
}

/** SARL ou société par actions : le capital est dû sur tout devis (R. 123-238). */
export function doitIndiquerSonCapital(entreprise) {
  return capitalDuSql(entreprise) === true;
}

/** Catégorie 5 ou 6 (dont SCI, SCM, GIE, SCP d'architectes et de géomètres) : immatriculée au RCS. */
export function rcsOblige(entreprise) {
  return rcsObligeSql(entreprise) === true;
}

/**
 * IMMATRICULÉE AU RCS : la forme l'impose (catégorie 5 ou 6), ou l'artisan
 * l'a déclaré (un entrepreneur individuel commerçant). Vrai ou faux, jamais
 * « on ne sait pas » — tant que rien n'est déclaré, le motif `registre`
 * bloque de toute façon. C'est ce qui décide si l'adresse du siège est due
 * sur TOUT devis (R. 123-237, qui ne vise que le RCS) ou seulement face à
 * un particulier (`conso_`). Même expression en SQL (`n.rcs`).
 */
export function soumisAuRcs(entreprise, emetteur) {
  return (emetteur || {}).registre === 'rcs' || rcsObligeSql(entreprise) === true;
}

/* ================================================================== */
/*  LES MONTANTS — en centimes, et sans jamais un nombre à virgule     */
/* ================================================================== */

/**
 * « 35 », « 35,50 », « 1 234.5 », « 10 000 € » → des centimes ENTIERS.
 *
 * Le calcul se fait SUR LA CHAÎNE : les euros et les centimes sont recollés
 * en texte avant de devenir un nombre. `35.1 * 100` vaut 3509.9999999999995
 * en JavaScript ; une facture ne s'arrondit pas au hasard. Virgule ou point
 * (un seul), espaces, espaces insécables (U+00A0, U+202F) et « € » sont
 * acceptés ; deux séparateurs (« 1.000,50 ») sont refusés plutôt que
 * devinés. Une chaîne vide rend `{ ok: true, centimes: null }` : « non
 * renseigné », jamais 0.
 */
export function versCentimes(texte) {
  const brut = String(texte == null ? '' : texte).replace(/[\s  ]/g, '').replace(/€$/, '');
  if (brut === '') return { ok: true, centimes: null, message: null };
  if (brut.startsWith('-')) {
    return { ok: false, centimes: null, message: 'Un montant ne peut pas être négatif.' };
  }
  const m = brut.match(/^(\d+)(?:[.,](\d*))?$/);
  if (!m) {
    return {
      ok: false, centimes: null,
      message: 'Écrivez un montant en euros, avec une seule virgule : par exemple 35 ou 35,50.',
    };
  }
  const euros = m[1].replace(/^0+(?=\d)/, '');
  const decimales = m[2] || '';
  if (decimales.length > 2) {
    return { ok: false, centimes: null, message: 'Un montant s’écrit avec deux chiffres après la virgule au plus.' };
  }
  const chiffres = `${euros}${decimales.padEnd(2, '0')}`.replace(/^0+(?=\d)/, '');
  /* 15 chiffres de centimes, c'est la borne de `emetteur_capital_check`
     (999 999 999 999 999) — et un nombre JavaScript reste exact jusque-là. */
  if (chiffres.length > 15) {
    return { ok: false, centimes: null, message: 'Ce montant est trop grand : il y a sans doute un zéro de trop.' };
  }
  return { ok: true, centimes: Number(chiffres), message: null };
}

/** 1000000 → « 10 000,00 € », avec des espaces insécables : un montant ne se coupe pas en fin de ligne. */
export function centimesLisibles(n) {
  if (n == null || !Number.isInteger(Number(n))) return null;
  const v = Number(n);
  const signe = v < 0 ? '-' : '';
  const s = String(Math.abs(v)).padStart(3, '0');
  const euros = s.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${signe}${euros},${s.slice(-2)} €`;
}

/** La phrase du refus de « 0 » tapé dans le montant : elle renvoie à l'interrupteur. */
export const MESSAGE_ZERO_TAPE = 'Pour dire que vous ne facturez pas de déplacement, touchez « Je ne '
  + 'facture pas de frais de déplacement » ; pour des conditions sans forfait, laissez le montant vide.';

/**
 * LES FRAIS DE DÉPLACEMENT, tels que le formulaire les rend à la base.
 *
 * Trois états, et ils ne se ressemblent pas : `null` (non déclaré), `0`
 * (l'artisan a touché « Je ne facture pas de frais de déplacement »), et un
 * montant et/ou des conditions. CETTE FONCTION EST LE SEUL ENDROIT QUI ÉCRIT
 * LE 0 — et un « 0 » TAPÉ dans le montant est refusé, parce qu'à côté de
 * conditions (« gratuit jusqu'à 20 km, puis 0,50 €/km ») il ferait imprimer
 * « Déplacement offert », ce qui est faux. La base refuse le même cas
 * (`tarif_frais_zero_check`) : ici, on le refuse AVANT l'envoi.
 */
export function fraisDepuisFormulaire({ aucun, montant, texte } = {}) {
  if (aucun === true) {
    return { ok: true, valeurs: { frais_deplacement_centimes: 0, frais_deplacement_texte: null }, message: null };
  }
  const m = versCentimes(montant);
  if (!m.ok) return { ok: false, champ: 'frais_deplacement_centimes', valeurs: null, message: m.message };
  if (m.centimes === 0) {
    return { ok: false, champ: 'frais_deplacement_centimes', valeurs: null, message: MESSAGE_ZERO_TAPE };
  }
  const t = videEnNull(texte == null ? null : String(texte));
  return {
    ok: true,
    valeurs: { frais_deplacement_centimes: m.centimes, frais_deplacement_texte: t },
    message: null,
  };
}

/* ================================================================== */
/*  LES MIROIRS DES DÉCLENCHEURS — pour la démonstration seulement     */
/* ================================================================== */

/* Rognage d'un texte : espaces, tabulations et retours à la ligne aux deux
   bouts, et un texte qui ne contient que cela devient `null`. Le
   déclencheur fait la même chose — `btrim(x, E' \t\r\n')` : un champ
   multiligne fait d'un seul retour à la ligne ne doit pas compter comme une
   garantie écrite. */
function rogner(v) {
  if (v == null) return null;
  const s = String(v).replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '');
  return s === '' ? null : s;
}

const TEXTES_EMETTEUR = [
  'denomination_ei', 'registre', 'greffe_ville',
  'etablissement_adresse', 'etablissement_code_postal', 'etablissement_ville',
  'siege_adresse', 'siege_code_postal', 'siege_ville',
  'telephone', 'email', 'regime_tva',
  'mediateur_nom', 'mediateur_adresse', 'mediateur_site',
  'garantie_legale_texte', 'garantie_commerciale_texte', 'sav_texte',
  'modalites_paiement_texte', 'modalites_execution_texte', 'reclamations_texte',
];
const enIso = (d) => (d instanceof Date ? d : new Date(d)).toISOString();

/**
 * Miroir de `tient_l_emetteur()`. `ancien` est la ligne avant écriture
 * (`null` pour une insertion), `maintenant` l'heure de l'écriture.
 *
 * La DATE DU RÉGIME est posée ici comme en base, dans les deux branches :
 * à l'insertion si un régime est choisi ; à la mise à jour seulement s'il
 * CHANGE — sinon l'ancienne date reste. Toute date envoyée par le client
 * est ignorée : « déclaré le … » ne doit dépendre d'aucune horloge de
 * téléphone.
 */
export function nettoyerEmetteur(v, ancien = null, maintenant = new Date()) {
  const n = { ...(v || {}) };
  for (const c of TEXTES_EMETTEUR) n[c] = rogner(n[c]);
  if (n.email) n.email = n.email.toLowerCase();
  if (n.capital_variable === true) n.capital_centimes = null;
  if (n.registre !== 'rcs') {
    n.greffe_ville = null;
    n.en_liquidation = false;
    n.locataire_gerant = false;
  }
  n.en_liquidation = n.en_liquidation === true;
  n.locataire_gerant = n.locataire_gerant === true;
  n.capital_variable = n.capital_variable == null ? null : n.capital_variable === true;
  if (n.capital_centimes === undefined) n.capital_centimes = null;
  const date = n.regime_tva != null ? enIso(maintenant) : null;
  if (!ancien) n.regime_tva_declare_le = date;
  else if (n.regime_tva !== (ancien.regime_tva == null ? null : ancien.regime_tva)) n.regime_tva_declare_le = date;
  else n.regime_tva_declare_le = ancien.regime_tva_declare_le == null ? null : ancien.regime_tva_declare_le;
  n.modifie_le = enIso(maintenant);
  return n;
}

const TEXTES_ASSURANCE = [
  'nature', 'libelle', 'assureur_nom', 'assureur_coordonnees', 'couverture', 'numero_contrat',
  'valide_jusquau', 'attestation_chemin',
];

/**
 * Miroir de `tient_l_assurance()` : rognage, libellé effacé hors « autre »,
 * et `created_at` POSÉ PAR LA BASE — à la création, l'heure de l'écriture,
 * quoi que le client envoie (relecture du 18/10/2026 : une date forcée à
 * l'insertion faisait passer une assurance en tête de la liste et de
 * l'en-tête) ; ensuite, jamais récrite.
 */
export function nettoyerAssurance(a, ancien = null, maintenant = new Date()) {
  const n = { ...(a || {}) };
  for (const c of TEXTES_ASSURANCE) n[c] = rogner(n[c]);
  if (n.nature !== 'autre') n.libelle = null;
  n.created_at = ancien ? ancien.created_at : enIso(maintenant);
  return n;
}

/**
 * Miroir de `tient_les_tarifs()` : le rognage du texte, RIEN D'AUTRE.
 *
 * Il ne vide surtout pas les conditions quand le montant vaut 0 : la
 * version précédente le faisait, et un artisan qui tapait « 0 » et
 * « gratuit jusqu'à 20 km, puis 0,50 €/km » perdait ses conditions sans un
 * mot. C'est la contrainte qui refuse, avec une phrase qui dit quoi faire.
 */
export function nettoyerTarifs(t) {
  const n = { ...(t || {}) };
  n.frais_deplacement_texte = rogner(n.frais_deplacement_texte);
  if (n.frais_deplacement_centimes === undefined) n.frais_deplacement_centimes = null;
  return n;
}

/* ================================================================== */
/*  LES MIROIRS DES CONTRAINTES                                         */
/* ================================================================== */

/* Le nombre de CARACTÈRES, comme `char_length` — et non d'unités UTF-16. */
const longueur = (s) => [...String(s)].length;
const tropLong = (objet, maxima) => Object.keys(maxima)
  .find((c) => objet[c] != null && longueur(objet[c]) > maxima[c]) || null;

/* Les motifs de la section 46, recopiés. PostgreSQL : `\m…\M` sont les
   bornes d'un mot (lettres, chiffres, soulignés, accents compris) ; `~*`
   ignore la casse. */
const MOTIF_EI = /(^|[^\p{L}\p{N}_])(EI|EIRL)(?![\p{L}\p{N}_])|entrepreneur individuel/iu;
/* LA MENTION SEULE NE FAIT PAS UN NOM — relecture du 18/10/2026 : « EI »,
   « EIRL » ou « entrepreneur individuel » tout court passaient, et l'en-tête
   s'imprimait « EI ». R. 526-27 demande le NOM suivi de la mention. Une fois
   la mention retirée, il doit rester au moins DEUX caractères qui ne sont ni
   une ponctuation, ni un chiffre, ni un blanc. Les lettres accentuées de « à
   responsabilité limitée » sont écrites `.` : aucune expression ne dépend de
   la casse d'une lettre accentuée, ni ici ni dans la contrainte SQL, qui
   porte la même chose. La recherche du mot se fait par un regard en ARRIÈRE
   (sans consommer le caractère d'avant), comme `\m` en SQL. */
const MENTION_EI = /(?<![\p{L}\p{N}_])(EI|EIRL)(?![\p{L}\p{N}_])|entrepreneur individuel( . responsabilit. limit.e)?/giu;
const SEPARATEURS_NOM = /[ \t\r\n0-9,.;:'’"«»()/&+–—\u00a0\u202f-]/g;
function nomSansLaMention(nom) {
  return [...String(nom).replace(MENTION_EI, '').replace(SEPARATEURS_NOM, '')].length;
}
const MOTIF_SITE = /^(https?:\/\/)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/\S*)?$/i;

/** `client_email_check` : une arobase qui n'est pas la première lettre, et un point dans le domaine, pas en tête. */
function emailAcceptable(email) {
  if (email == null) return true;
  const s = String(email);
  const domaine = s.split('@')[1] || '';
  return s.indexOf('@') > 0 && domaine.indexOf('.') > 0;
}

/**
 * Les contraintes de la section 46, une par NOM de la base.
 *
 * Chacune rend `null` quand la ligne passe, sinon la COLONNE fautive — pour
 * que l'écran défile jusqu'à elle. Elles reproduisent la logique de
 * PostgreSQL, `null` compris : une contrainte `check` dont l'expression vaut
 * `null` LAISSE PASSER. Elles s'appliquent à une ligne déjà nettoyée
 * (`valider*` s'en charge), comme en base, où le déclencheur `before`
 * passe avant les contraintes.
 */
export const CONTRAINTES = Object.freeze({
  emetteur: Object.freeze({
    emetteur_capital_check: (e) => (e.capital_centimes == null
      || (Number.isInteger(e.capital_centimes) && e.capital_centimes >= 1 && e.capital_centimes <= 999999999999999)
      ? null : 'capital_centimes'),
    emetteur_capital_variable_check: (e) => (e.capital_variable === true && e.capital_centimes != null
      ? 'capital_centimes' : null),
    emetteur_code_postal_check: (e) => (['etablissement_code_postal', 'siege_code_postal']
      .find((c) => e[c] != null && !/^[0-9]{5}$/.test(e[c])) || null),
    emetteur_denomination_ei_check: (e) => (e.denomination_ei == null
      || (MOTIF_EI.test(e.denomination_ei) && nomSansLaMention(e.denomination_ei) >= 2)
      ? null : 'denomination_ei'),
    emetteur_email_check: (e) => (emailAcceptable(e.email) ? null : 'email'),
    emetteur_greffe_check: (e) => {
      const ok = ou3(
        et3(egal3(e.registre, 'rcs'), e.greffe_ville != null),
        et3(e.registre !== 'rcs', e.greffe_ville == null),
      );
      return ok === false ? 'greffe_ville' : null;
    },
    emetteur_longueurs_check: (e) => tropLong(e, Object.fromEntries(Object.entries(LONGUEUR_MAX.emetteur)
      .filter(([c]) => c !== 'telephone'))),
    emetteur_mediateur_check: (e) => {
      const champs = ['mediateur_nom', 'mediateur_adresse', 'mediateur_site'];
      const remplis = champs.filter((c) => e[c] != null).length;
      return remplis === 0 || remplis === 3 ? null : champs.find((c) => e[c] == null);
    },
    emetteur_mediateur_site_check: (e) => (e.mediateur_site == null || MOTIF_SITE.test(e.mediateur_site)
      ? null : 'mediateur_site'),
    emetteur_registre_check: (e) => (e.registre == null || ['rcs', 'rne', 'aucun'].includes(e.registre)
      ? null : 'registre'),
    emetteur_telephone_check: (e) => {
      if (e.telephone == null) return null;
      const chiffres = String(e.telephone).replace(/\D/g, '').length;
      return longueur(e.telephone) <= 30 && chiffres >= 6 && chiffres <= 15 ? null : 'telephone';
    },
    emetteur_tva_check: (e) => (e.regime_tva == null || ['franchise', 'reel'].includes(e.regime_tva)
      ? null : 'regime_tva'),
  }),
  emetteur_assurances: Object.freeze({
    /* La croisée n° 2 : nature, assureur, coordonnées, couverture. Le n° de
       contrat N'Y EST PAS : aucun texte ne l'exige sur un devis, il figure
       dans l'attestation (A. 243-3). */
    emetteur_assurance_chemin_check: (a, proId) => {
      if (a.attestation_chemin == null) return null;
      const prefixe = `${String(proId)}/`;
      const reste = String(a.attestation_chemin).slice(prefixe.length);
      return String(a.attestation_chemin).startsWith(prefixe) && reste !== '' && !reste.includes('/')
        ? null : 'attestation_chemin';
    },
    emetteur_assurance_complete_check: (a) => (['nature', 'assureur_nom', 'assureur_coordonnees', 'couverture']
      .find((c) => a[c] == null) || null),
    emetteur_assurance_libelle_check: (a) => (a.nature !== 'autre' || a.libelle != null ? null : 'libelle'),
    emetteur_assurance_longueurs_check: (a) => tropLong(a, LONGUEUR_MAX.emetteur_assurances),
    emetteur_assurance_nature_check: (a) => (a.nature == null || ['decennale', 'rc_pro', 'autre'].includes(a.nature)
      ? null : 'nature'),
  }),
  tarifs_pro: Object.freeze({
    tarif_frais_check: (t) => (t.frais_deplacement_centimes == null
      || (Number.isInteger(t.frais_deplacement_centimes)
        && t.frais_deplacement_centimes >= 0 && t.frais_deplacement_centimes <= 1000000)
      ? null : 'frais_deplacement_centimes'),
    tarif_frais_texte_check: (t) => tropLong(t, LONGUEUR_MAX.tarifs_pro),
    tarif_frais_zero_check: (t) => (t.frais_deplacement_centimes === 0 && t.frais_deplacement_texte != null
      ? 'frais_deplacement_texte' : null),
  }),
});

/* PostgreSQL vérifie les contraintes `check` d'une table dans l'ORDRE
   ALPHABÉTIQUE de leur nom, et s'arrête à la première qui refuse : c'est
   elle que nomme son message. On fait pareil, pour que la démonstration et
   la vraie base refusent la MÊME ligne avec la MÊME phrase. */
function premierRefus(table, ligne, proId) {
  const noms = Object.keys(CONTRAINTES[table]).sort();
  for (const nom of noms) {
    const champ = CONTRAINTES[table][nom](ligne, proId);
    if (champ) return { ok: false, contrainte: nom, champ };
  }
  return { ok: true, contrainte: null, champ: null };
}

/**
 * `{ ok, contrainte, champ }`, SANS message : l'écran appelle
 * `messageDeContrainte(contrainte)` (src/lib/erreurs.js), la même table de
 * phrases que celle qui traduit un refus de la vraie base.
 */
export function validerEmetteur(v) {
  return premierRefus('emetteur', nettoyerEmetteur(v), null);
}

export function validerAssurance(a, proId) {
  return premierRefus('emetteur_assurances', nettoyerAssurance(a), proId);
}

export function validerTarifs(t) {
  return premierRefus('tarifs_pro', nettoyerTarifs(t), null);
}

/* ================================================================== */
/*  CE QUI MANQUE — les motifs d'`emetteur_incomplet()`                */
/* ================================================================== */

/**
 * LES MOTIFS, dans l'ordre d'affichage, AU MOT PRÈS de la fonction SQL.
 *
 * `emetteur_incomplet()` rend des chaînes « cle: phrase », et c'est SA
 * phrase que l'écran affiche (`lireMotifs`) : une version de l'application
 * en retard sur la base montre quand même un motif qu'elle ne connaît pas.
 * Cette table sert au miroir de démonstration et au contrôle, qui compare
 * les deux écritures à l'octet. La section 46 de `schema.sql` reprend ces
 * phrases telles quelles.
 *
 * Ce que les phrases respectent, et que le contrôle vérifie :
 *   - « répertoire Sirene (INSEE) », jamais « registre » pour Sirene ;
 *   - « registre » seulement dans « registre du commerce et des sociétés »
 *     et « registre national des entreprises » ;
 *   - une phrase qui parle de « TVA intracommunautaire » nomme la DGFiP,
 *     jamais le répertoire ;
 *   - aucun « vérifié », « certifié » ni « agréé » ;
 *   - une obligation du code de la consommation est toujours dite « pour un
 *     devis à un particulier », et son motif porte le préfixe `conso_` ;
 *   - un choix d'Opus se dit comme tel, jamais comme la loi ;
 *   - l'apostrophe typographique ’ seulement, et aucune date interpolée.
 *
 * `section` est l'ancre de l'écran qui permet de compléter : une section du
 * formulaire, ou `entreprise` pour le bloc « Votre entreprise » (rattacher,
 * « Mettre à jour »). `null` : rien à compléter dans Opus aujourd'hui.
 */
export const MOTIFS = Object.freeze([
  Object.freeze({
    cle: 'entreprise',
    section: 'entreprise',
    phrase: 'Aucune entreprise n’est rattachée à votre compte. Un devis porte le nom, l’adresse et '
      + 'le SIRET de l’entreprise qui l’émet : le bloc « Votre entreprise » dit comment la rattacher.',
  }),
  /* LE NOM LÉGAL, quand l'entreprise n'est pas (ou pas sûrement) un
     entrepreneur individuel — un EI écrit le sien (`nom_ei`). Une identité
     ouverte par l'administration n'a que son SIREN et son SIRET, et sa
     nature est inconnue : elle réclame un nom aussi (relecture du
     18/10/2026), sinon l'écran disait « Oui » au-dessus d'un en-tête sans
     nom. D'où « le nom légal de votre entreprise », vrai dans les deux cas. */
  Object.freeze({
    cle: 'identite',
    section: 'entreprise',
    phrase: 'Le nom légal de votre entreprise manque à l’entreprise rattachée à votre compte : il '
      + 'doit figurer sur un devis. Si votre entreprise a été lue au répertoire Sirene (INSEE), '
      + '« Mettre à jour » la relit (votre SIRET vous sera redemandé) ; sinon, cela ne peut pas '
      + 'encore se corriger depuis l’application.',
  }),
  /* L'ADRESSE DE L'ÉTABLISSEMENT QUAND ELLE N'A PAS ÉTÉ TRANSMISE — deux
     motifs, qui ne s'excluent jamais l'un l'autre par erreur : ils se
     partagent `est_siege` et l'immatriculation au RCS.
     - L'établissement EST le siège ET l'entreprise est au RCS : son adresse
       est le « lieu du siège social » que le code de COMMERCE demande sur
       tous les papiers d'affaires (R. 123-237 3°). Dû sur tout devis : pas
       de préfixe.
     - Sinon : seul le code de la consommation la demande (L. 111-1,
       R. 111-1 1°) → `conso_`. R. 123-237 ne vise que « toute personne
       immatriculée » au RCS (son 2° : « la mention RCS »), dans le
       chapitre des commerçants : un artisan inscrit au seul RNE n'en
       relève pas (relu dans le texte le 18/10/2026, après une relecture
       qui avait raison contre la première version de ce lot).
     C'est le cas le plus fréquent d'une adresse non diffusée : un
     entrepreneur individuel qui travaille chez lui s'est opposé à la
     diffusion de son domicile, et son établissement est son siège. */
  Object.freeze({
    cle: 'adresse_etablissement',
    section: 'adresses',
    phrase: 'L’adresse de votre établissement, qui est aussi le siège de votre entreprise, n’a pas '
      + 'été transmise — c’est le cas quand son titulaire s’est opposé à sa diffusion. Une entreprise '
      + 'immatriculée au registre du commerce et des sociétés porte le lieu de son siège sur tous ses '
      + 'devis (code de commerce, R. 123-237) : écrivez-la. Elle ne s’affiche que sur vos devis.',
  }),
  Object.freeze({
    cle: 'conso_adresse_etablissement',
    section: 'adresses',
    phrase: 'Pour un devis à un particulier : l’adresse de votre établissement n’a pas été transmise '
      + '— c’est le cas quand son titulaire s’est opposé à sa diffusion —, et la loi demande de '
      + 'l’écrire sur le devis (code de la consommation, L. 111-1). Écrivez-la : elle ne s’affiche '
      + 'que sur vos devis.',
  }),
  Object.freeze({
    cle: 'entreprise_ancienne',
    section: 'entreprise',
    phrase: 'Votre entreprise a été lue au répertoire Sirene (INSEE) il y a plus d’un an : une '
      + 'entreprise déménagée ou cessée depuis imprimerait une identité fausse. Touchez « Mettre à '
      + 'jour » dans « Votre entreprise » pour la relire (votre SIRET vous sera redemandé). C’est une '
      + 'règle d’Opus, pas une obligation de la loi.',
  }),
  Object.freeze({
    cle: 'nom_ei',
    section: 'identite',
    phrase: 'Vous êtes entrepreneur individuel : votre devis doit porter votre nom suivi de « EI » ou '
      + 'de « entrepreneur individuel » (code de commerce, R. 526-27) ; une EIRL écrit « EIRL » ou '
      + '« entrepreneur individuel à responsabilité limitée ». Écrivez-le tel qu’il doit s’imprimer : '
      + 'Opus ne le compose pas à votre place.',
  }),
  /* Le SIÈGE, quand l'établissement ne l'est pas — même partage que
     l'établissement : au RCS, le code de commerce le demande sur tout devis
     (R. 123-237 3°) ; hors RCS, seul le code de la consommation le demande,
     face à un particulier (R. 111-1 1° : « si elle est différente, celle du
     siège social »). */
  Object.freeze({
    cle: 'adresse_siege',
    section: 'adresses',
    phrase: 'Votre établissement n’est pas le siège de votre entreprise : une entreprise '
      + 'immatriculée au registre du commerce et des sociétés porte aussi le lieu de son siège sur '
      + 'tous ses devis (code de commerce, R. 123-237). Opus ne l’a pas encore enregistrée : '
      + 'écrivez-la telle qu’elle figure sur votre extrait d’immatriculation.',
  }),
  Object.freeze({
    cle: 'conso_adresse_siege',
    section: 'adresses',
    phrase: 'Pour un devis à un particulier : votre établissement n’est pas le siège de votre '
      + 'entreprise, et la loi demande d’indiquer aussi l’adresse du siège (code de la consommation, '
      + 'R. 111-1). Opus ne l’a pas encore enregistrée : écrivez-la telle qu’elle figure sur votre '
      + 'attestation d’immatriculation.',
  }),
  Object.freeze({
    cle: 'registre',
    section: 'immatriculation',
    phrase: 'Dites où votre entreprise est immatriculée : au registre du commerce et des sociétés '
      + '(RCS) avec la ville du greffe, au registre national des entreprises (RNE) seulement, ou '
      + 'nulle part. Une entreprise immatriculée au RCS doit l’écrire sur ses devis, avec la ville '
      + 'du greffe (code de commerce, R. 123-237) : Opus a besoin de le savoir. Pour une société, '
      + 'commerciale ou civile, c’est le RCS.',
  }),
  Object.freeze({
    cle: 'capital',
    section: 'capital',
    phrase: 'Une SARL ou une société par actions (SA, SAS, société en commandite par actions) '
      + 'indique son capital social sur ses devis, ou « à capital variable » si c’est son cas (code '
      + 'de commerce, R. 123-238 et L. 231-2).',
  }),
  Object.freeze({
    cle: 'conso_telephone',
    section: 'contact',
    phrase: 'Pour un devis à un particulier : indiquez un numéro de téléphone, pour que le client '
      + 'puisse vous joindre ; la loi demande de l’écrire sur le devis (code de la consommation, '
      + 'L. 111-1).',
  }),
  Object.freeze({
    cle: 'conso_email',
    section: 'contact',
    phrase: 'Pour un devis à un particulier : indiquez une adresse e-mail de contact ; la loi demande '
      + 'des coordonnées électroniques sur le devis (code de la consommation, L. 111-1). Elle ne '
      + 's’affiche pas sur votre fiche publique.',
  }),
  Object.freeze({
    cle: 'regime_tva',
    section: 'tva',
    phrase: 'Déclarez votre régime de TVA. En franchise, vos devis porteront « TVA non applicable, '
      + 'article 293 B du CGI » ; au régime réel, la TVA de chaque ligne. Opus ne peut pas le '
      + 'deviner : votre chiffre d’affaires n’est pas dans Opus.',
  }),
  Object.freeze({
    cle: 'conso_tva_intra',
    section: 'entreprise',
    phrase: 'Pour un devis à un particulier : vous avez déclaré le régime réel, mais l’annuaire des '
      + 'entreprises (liste de la DGFiP) n’a transmis aucun numéro de TVA intracommunautaire pour '
      + 'votre entreprise. La loi demande de le communiquer au client (code de la consommation, '
      + 'R. 111-2) ; Opus le fait en l’imprimant sur le devis, et ne l’invente pas. Touchez « Mettre à '
      + 'jour » dans « Votre entreprise » pour le relire (votre SIRET vous sera redemandé) ; s’il '
      + 'manque toujours, ou si votre entreprise '
      + 'a été rattachée par l’administration d’Opus, cela ne peut pas encore se corriger depuis '
      + 'l’application.',
  }),
  Object.freeze({
    cle: 'conso_mediateur',
    section: 'mediateur',
    phrase: 'Pour un devis à un particulier : indiquez le médiateur de la consommation auquel vous '
      + 'adhérez, avec son nom, son adresse et son site (code de la consommation, L. 111-1 et '
      + 'R. 111-1). Ce n’est pas une information à trouver : il faut adhérer à un médiateur '
      + 'référencé. Un devis à un professionnel n’en a généralement pas besoin, sauf pour un petit '
      + 'professionnel démarché hors de son activité principale.',
  }),
  Object.freeze({
    cle: 'conso_garantie_legale',
    section: 'garanties',
    phrase: 'Pour un devis à un particulier : décrivez, en vos mots, les garanties légales qui '
      + 'couvrent vos travaux ; la loi demande de les rappeler sur le devis (code de la consommation, '
      + 'L. 111-1). Opus ne rédige pas cette mention à votre place.',
  }),
  Object.freeze({
    cle: 'conso_modalites_paiement',
    section: 'conditions',
    phrase: 'Pour un devis à un particulier : indiquez vos modalités de paiement, c’est-à-dire quand '
      + 'et comment le client paie (code de la consommation, R. 111-1). L’acompte et sa date se '
      + 'fixeront sur chaque devis.',
  }),
  Object.freeze({
    cle: 'conso_modalites_execution',
    section: 'conditions',
    phrase: 'Pour un devis à un particulier : indiquez vos modalités d’exécution des travaux (code '
      + 'de la consommation, R. 111-1). Le délai, lui, s’écrira sur chaque devis.',
  }),
  Object.freeze({
    cle: 'conso_reclamations',
    section: 'conditions',
    phrase: 'Pour un devis à un particulier : indiquez comment un client peut vous adresser une '
      + 'réclamation, et comment vous la traitez (code de la consommation, R. 111-1).',
  }),
  Object.freeze({
    cle: 'frais_deplacement',
    section: 'frais',
    phrase: 'Déclarez vos frais de déplacement : un montant, vos conditions, ou « je n’en facture '
      + 'pas ». Pour un dépannage, une réparation ou un entretien chez un particulier, la loi demande '
      + 'de les écrire sur le devis quand vous en facturez (arrêté du 24 janvier 2017) ; Opus demande '
      + 'que vous le disiez pour tous vos devis, parce qu’un champ vide et « aucun » ne se '
      + 'distinguent pas.',
  }),
  Object.freeze({
    cle: 'conso_profession_reglementee',
    section: null,
    phrase: 'Votre métier est une profession réglementée : pour un devis à un particulier, la loi '
      + 'demande de communiquer au client votre titre professionnel, l’État où il vous a été délivré '
      + 'et l’ordre ou l’organisme auquel vous appartenez (code de la consommation, R. 111-2). Opus '
      + 'les imprimerait sur le devis, mais ne sait pas encore les écrire : vos devis à des '
      + 'particuliers attendront qu’il le sache.',
  }),
]);

/** Chaque clé de motif → l'ancre de l'écran qui permet de le compléter. */
export const SECTION_DU_MOTIF = Object.freeze(Object.fromEntries(MOTIFS.map((m) => [m.cle, m.section])));

const UN_AN_MS = 365 * 24 * 3600 * 1000;
const tempsDe = (valeur) => (valeur instanceof Date ? valeur.getTime() : new Date(valeur).getTime());

/**
 * MIROIR DE DÉMONSTRATION d'`emetteur_incomplet()` — même entrée, même sortie.
 *
 * `entreprise` est l'identité ACTIVE (`retiree_le` vide), comme la jointure
 * SQL ; on peut aussi passer toutes les identités de la fiche, et seule
 * l'active compte — une identité retirée qui avait un n° de TVA ne prête
 * pas ce numéro à la suivante. `metiers` vient de la fiche pro, et c'est la
 * seule chose qu'on y lit : jamais `verifie`, jamais `entreprise` (le nom
 * public, libre). `nbAssurances` n'est plus lu pour bloquer — aucune
 * assurance n'est exigée (réponse du 18/10) — et reste accepté pour que les
 * appelants n'aient pas à changer.
 *
 * Rend des chaînes « cle: phrase », dans l'ordre de `MOTIFS`.
 */
export function motifsEmetteur({
  entreprise = null, emetteur = null, tarifs = null, metiers = null, maintenant = new Date(),
} = {}) {
  const identites = Array.isArray(entreprise) ? entreprise : [entreprise];
  const r = identites.find((x) => x && x.retiree_le == null) || null;
  const e = emetteur || {};
  const t = tarifs || {};
  const ei = eiSql(r);
  const incomplete = (prefixe) => e[`${prefixe}_adresse`] == null || e[`${prefixe}_code_postal`] == null
    || e[`${prefixe}_ville`] == null;
  const adresseInconnue = !!r && r.adresse == null && incomplete('etablissement');
  /* Au RCS — la forme l'impose ou l'artisan l'a déclaré : l'adresse du
     siège est due sur TOUT devis (R. 123-237). Hors RCS, seulement face à un
     particulier. `soumisAuRcs` rend vrai ou faux, jamais `null`. */
  const rcs = soumisAuRcs(r, e);
  const siegeInconnu = !!r && r.est_siege === false && incomplete('siege');
  const reglemente = Array.isArray(metiers)
    ? metiers.some((m) => METIERS_PROFESSION_REGLEMENTEE.includes(m)) : null;

  const conditions = {
    entreprise: !r,
    identite: !!r && ei !== true && r.denomination == null,
    adresse_etablissement: adresseInconnue && r.est_siege === true && rcs,
    conso_adresse_etablissement: adresseInconnue && (r.est_siege !== true || !rcs),
    entreprise_ancienne: !!r && ['registre', 'essai'].includes(r.source)
      && tempsDe(r.verifie_le) < tempsDe(maintenant) - UN_AN_MS,
    nom_ei: et3(ei, e.denomination_ei == null),
    adresse_siege: siegeInconnu && rcs,
    conso_adresse_siege: siegeInconnu && !rcs,
    registre: ou3(e.registre == null, et3(rcsObligeSql(r), e.registre !== 'rcs')),
    capital: et3(capitalDuSql(r), e.capital_centimes == null, e.capital_variable !== true),
    conso_telephone: e.telephone == null,
    conso_email: e.email == null,
    regime_tva: e.regime_tva == null,
    conso_tva_intra: e.regime_tva === 'reel' && !!r && r.tva == null,
    conso_mediateur: e.mediateur_nom == null,
    conso_garantie_legale: e.garantie_legale_texte == null,
    conso_modalites_paiement: e.modalites_paiement_texte == null,
    conso_modalites_execution: e.modalites_execution_texte == null,
    conso_reclamations: e.reclamations_texte == null,
    frais_deplacement: t.frais_deplacement_centimes == null && t.frais_deplacement_texte == null,
    conso_profession_reglementee: reglemente,
  };
  return MOTIFS.filter((m) => conditions[m.cle] === true).map((m) => `${m.cle}: ${m.phrase}`);
}

/**
 * CE QUE LA BASE A RENDU, prêt pour l'écran : `[{ cle, phrase, conso, section }]`.
 *
 * C'est la phrase DE LA BASE qui s'affiche. Un élément mal formé ou une clé
 * inconnue s'affiche QUAND MÊME, et ne compte jamais comme « réservé au
 * particulier » : une version de l'application en retard sur la base ne
 * doit pas pouvoir faire passer un motif nouveau pour une absence de motif.
 */
export function lireMotifs(liste) {
  if (!Array.isArray(liste)) return [];
  return liste.map((brut) => {
    if (brut && typeof brut === 'object' && typeof brut.cle === 'string') return brut;
    const texte = brut == null ? '' : String(brut);
    const m = texte.match(/^([a-z_]+): ([\s\S]+)$/);
    if (!m) {
      return {
        cle: null,
        phrase: texte.trim() || 'Un élément manque, mais il n’a pas pu être lu : réessayez.',
        conso: false,
        section: null,
      };
    }
    const cle = m[1];
    const connue = Object.prototype.hasOwnProperty.call(SECTION_DU_MOTIF, cle);
    return {
      cle,
      phrase: m[2],
      conso: connue && cle.startsWith('conso_'),
      section: connue ? SECTION_DU_MOTIF[cle] : null,
    };
  });
}

/** `{ pret, pretPourPro, manque, manqueParticulier }` — ce qu'un devis peut faire aujourd'hui. */
export function etatPreparation(motifs) {
  const lus = lireMotifs(motifs);
  const manque = lus.filter((m) => !m.conso);
  const manqueParticulier = lus.filter((m) => m.conso);
  return {
    pret: lus.length === 0,
    pretPourPro: manque.length === 0,
    manque,
    manqueParticulier,
  };
}

const choses = (n) => (n > 1 ? `${n} choses` : `${n} chose`);

/**
 * LE TITRE DU BLOC « PRÊT À ÉMETTRE UN DEVIS ? ».
 *
 * `etat` vaut `charge` (lecture en cours), `echec` (la lecture a échoué) ou
 * `pret` (la base a répondu). Tout autre état est traité comme un échec.
 * UN ÉCHEC NE REND JAMAIS « OUI » : un travail qui n'a pas pu se
 * faire ne doit jamais ressembler à un travail fait — la règle de « Pour
 * moi » du 05/10. Le contrôle le fait tourner.
 *
 * `ton` : `neutre` | `echec` | `pret` | `partiel` | `manque`.
 */
export function titrePreparation(etat, motifs) {
  if (etat === 'charge') return { titre: 'Lecture de ce qui manque…', detail: null, ton: 'neutre' };
  if (etat !== 'pret') {
    return {
      titre: 'Impossible de savoir ce qui manque pour l’instant. Ce n’est pas que tout est prêt : '
        + 'réessayez.',
      detail: null,
      ton: 'echec',
    };
  }
  const p = etatPreparation(motifs);
  if (p.pret) {
    return {
      titre: 'Oui : vos informations d’entreprise sont complètes',
      detail: 'Chaque devis demandera encore ce qui lui est propre : le client, les travaux, le délai.',
      ton: 'pret',
    };
  }
  if (p.pretPourPro) {
    return {
      titre: 'Prêt pour un devis à un professionnel. Pour un particulier, il manque :',
      detail: null,
      ton: 'partiel',
    };
  }
  const total = p.manque.length + p.manqueParticulier.length;
  return {
    titre: `Il manque ${choses(total)}`,
    detail: p.manqueParticulier.length
      ? `dont ${p.manqueParticulier.length} seulement pour un devis à un particulier`
      : null,
    ton: 'manque',
  };
}

/* ================================================================== */
/*  L'EN-TÊTE TEL QU'IL S'IMPRIMERA                                    */
/* ================================================================== */

/**
 * Une ligne « à compléter », posée à la place de ce qui manque — et DEUX
 * sortes : ce qui manque à tout devis, et ce qui ne manque qu'à un devis
 * pour un particulier (le code de la consommation). Sans la seconde
 * étiquette, l'aperçu laissait croire que téléphone, médiateur ou
 * garanties manquaient aussi à un devis entre professionnels, juste sous
 * « Prêt pour un devis à un professionnel » (relecture du 18/10/2026).
 */
export const PREFIXE_MANQUE = '[à compléter : ';
export const PREFIXE_MANQUE_PARTICULIER = '[pour un particulier : ';
const aCompleter = (quoi) => `${PREFIXE_MANQUE}${quoi}]`;
const aCompleterParticulier = (quoi) => `${PREFIXE_MANQUE_PARTICULIER}${quoi}]`;
export const estUnManque = (ligne) => typeof ligne === 'string'
  && (ligne.startsWith(PREFIXE_MANQUE) || ligne.startsWith(PREFIXE_MANQUE_PARTICULIER));

const sirenLisible = (siren) => {
  const s = String(siren || '').replace(/\D/g, '');
  return s.length === 9 ? `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}` : s;
};

/**
 * LES ADRESSES — et le répertoire gagne.
 *
 * Le format d'`entreprise_registre.adresse`, MESURÉ sur la vraie base le
 * 18/10/2026 (une entreprise active, trois booléens, sans lire l'adresse) :
 * la colonne CONTIENT déjà le code postal et la commune — c'est l'adresse
 * complète que rend l'API Recherche d'entreprises (« 12 RUE … 13410
 * LAMBESC »). La démonstration, elle, range la rue seule. Les deux formats
 * sont gérés : quand le code postal figure dans l'adresse, on la coupe là ;
 * sinon on ajoute « code postal + commune ».
 *
 * L'adresse saisie dans `emetteur` ne sert QUE quand le répertoire ne la
 * donne pas. Quand il la donne, c'est lui qui s'imprime, partout.
 */
export function adresseImprimee(entreprise, emetteur) {
  const r = entreprise || null;
  const e = emetteur || {};
  let etablissement = [];
  if (r && r.adresse) {
    const adresse = String(r.adresse).trim();
    const cp = r.code_postal ? String(r.code_postal) : null;
    const i = cp ? adresse.lastIndexOf(cp) : -1;
    if (i > 0) {
      etablissement = [adresse.slice(0, i).replace(/[\s,]+$/, ''), adresse.slice(i).trim()];
    } else if (i === 0) {
      etablissement = [adresse];
    } else {
      const commune = r.commune ? String(r.commune) : '';
      const finit = commune && adresse.toLowerCase().endsWith(commune.toLowerCase());
      const derniere = finit ? '' : [cp, commune].filter(Boolean).join(' ');
      etablissement = [adresse, derniere].filter(Boolean);
    }
  } else if (e.etablissement_adresse && e.etablissement_code_postal && e.etablissement_ville) {
    etablissement = [e.etablissement_adresse, `${e.etablissement_code_postal} ${e.etablissement_ville}`];
  }
  let siege = null;
  if (r && r.est_siege !== true && e.siege_adresse && e.siege_code_postal && e.siege_ville) {
    siege = [e.siege_adresse, `${e.siege_code_postal} ${e.siege_ville}`];
  }
  return { etablissement, siege };
}

/**
 * LA SOURCE DE L'IDENTITÉ, imprimée en petit sous l'en-tête.
 *
 * C'est la date de CONSULTATION du répertoire (`verifie_le`), jamais une
 * « date de vérification » : ce mot appartient au badge. La Licence
 * Ouverte demande la source et la date de mise à jour de la fiche. Le n° de
 * TVA a une autre source — la liste de la DGFiP, par l'annuaire des
 * entreprises — et la ligne le dit dès qu'il est imprimé. Une identité
 * ouverte par l'administration (`administration`) ne vient pas du
 * répertoire : rien n'est imprimé.
 */
export function ligneSource(entreprise) {
  const r = entreprise || null;
  if (!r || !['registre', 'essai'].includes(r.source)) return null;
  const maj = dateFrancaise(r.maj_insee);
  const vu = dateFrancaise(r.verifie_le);
  return 'Identité : répertoire Sirene (INSEE), '
    + (maj ? `fiche mise à jour le ${maj}` : 'date de mise à jour non publiée')
    + (vu ? `, consultée le ${vu}` : '')
    + (r.tva ? ' ; n° de TVA : liste de la DGFiP, par l’annuaire des entreprises' : '');
}

const libelleNature = (a) => {
  if (a.nature === 'autre') return a.libelle || 'Autre assurance';
  const n = NATURES_ASSURANCE.find((x) => x.cle === a.nature);
  return n ? n.libelle : 'Assurance';
};

/**
 * L'EN-TÊTE DU DEVIS, tel qu'il s'imprimera : `{ identite, mentions, source, manques }`.
 *
 * Les noms sont ceux de la base, pour que le lot 2 lui passe l'instantané
 * figé au moment de la remise. Ce qui manque s'imprime À SA PLACE,
 * « [à compléter : …] », et les mots portent l'information, pas la
 * couleur. JAMAIS imprimé : le badge, une juridiction, le mot « vérifié »,
 * le nom brut du répertoire, « garantie contractuelle », « extension de
 * garantie ». Aucune assurance n'est réclamée : celles qui sont déclarées
 * s'impriment, aucune ligne « à compléter » n'en tient lieu.
 */
export function enteteImprime({ entreprise = null, emetteur = null, assurances = [], tarifs = null } = {}) {
  const r = entreprise || null;
  const e = emetteur || {};
  const t = tarifs || {};
  const identite = [];
  const mentions = [];
  const manques = [];
  const manque = (quoi) => { manques.push(quoi); return aCompleter(quoi); };
  const manqueParticulier = (quoi) => { manques.push(quoi); return aCompleterParticulier(quoi); };
  /* Même partage que les motifs : au RCS, l'adresse du siège est due sur
     tout devis ; hors RCS, seulement face à un particulier. */
  const rcs = soumisAuRcs(r, e);
  if (!r) {
    identite.push(manque('l’entreprise rattachée à votre compte'));
  } else if (estEI(r)) {
    identite.push(e.denomination_ei || manque('votre nom suivi de « EI »'));
  } else {
    /* Une société, ou une entreprise de nature INCONNUE (ouverte par
       l'administration, SIREN et SIRET seuls) : le motif `identite` la
       réclame, et l'aperçu ne dit « société » que quand c'en est une. */
    /* Une ligne « à compléter » est TOUJOURS une ligne à elle : l'écran la
       repère à son début (`estUnManque`), et un manque collé au milieu
       d'une phrase passerait inaperçu. */
    const forme = formeCourte(r.forme_juridique);
    let capital = '';
    let capitalManque = false;
    if (estSocieteCommerciale(r)) {
      if (e.capital_variable === true) capital = ' à capital variable';
      else if (e.capital_centimes != null) capital = ` au capital de ${centimesLisibles(e.capital_centimes)}`;
      else capitalManque = doitIndiquerSonCapital(r);
    }
    if (r.denomination) {
      identite.push(`${r.denomination}${forme ? ` — ${forme}` : ''}${capital}`);
    } else {
      identite.push(manque(eiSql(r) === false ? 'la dénomination de votre société' : 'le nom légal de votre entreprise'));
      if (forme) identite.push(`${forme}${capital}`);
    }
    if (capitalManque) identite.push(manque('votre capital social'));
  }
  if (r && r.nom_commercial && r.nom_commercial !== r.denomination) {
    identite.push(`Nom commercial : ${r.nom_commercial}`);
  }

  if (r) {
    const adr = adresseImprimee(r, e);
    if (adr.etablissement.length) identite.push(...adr.etablissement);
    else if (r.est_siege === true && rcs) identite.push(manque('l’adresse de votre établissement'));
    else identite.push(manqueParticulier('l’adresse de votre établissement'));
    if (adr.siege) identite.push(`Siège : ${adr.siege.join(', ')}`);
    else if (r.est_siege === false) {
      identite.push(rcs ? manque('l’adresse du siège') : manqueParticulier('l’adresse du siège'));
    }
    if (r.siret) identite.push(`SIRET ${formaterSiret(r.siret)}`);
  }

  if (e.registre === 'rcs' && !e.greffe_ville) {
    identite.push(manque('la ville du greffe'));
  } else if (e.registre === 'rcs') {
    let ligne = `RCS ${e.greffe_ville}${r ? ` ${sirenLisible(r.siren)}` : ''}`;
    if (e.en_liquidation === true) ligne += ' — en liquidation';
    if (e.locataire_gerant === true) ligne += ' — locataire-gérant';
    identite.push(ligne);
  } else if (e.registre === 'rne') {
    identite.push(r ? `RNE · SIREN ${sirenLisible(r.siren)}` : 'RNE');
  } else if (e.registre == null) {
    identite.push(manque('où votre entreprise est immatriculée'));
  }

  /* LE N° DE TVA S'IMPRIME DÈS QU'IL EXISTE, quel que soit le régime :
     R. 111-2 5° vise tout assujetti identifié, et un franchisé peut avoir
     un numéro. En franchise, la mention 293 B s'ajoute, elle ne le remplace
     pas. */
  if (r && r.tva) identite.push(`N° de TVA intracommunautaire : ${r.tva}`);
  if (e.regime_tva === 'franchise') identite.push(LIBELLES_IMPRIMES.franchise);
  else if (e.regime_tva == null) identite.push(manque('votre régime de TVA'));
  else if (e.regime_tva === 'reel' && r && !r.tva) {
    identite.push(manqueParticulier('votre numéro de TVA intracommunautaire'));
  }

  identite.push(e.telephone ? `Tél. ${e.telephone}` : manqueParticulier('votre téléphone'));
  identite.push(e.email ? `E-mail : ${e.email}` : manqueParticulier('votre adresse e-mail'));

  for (const a of [...(assurances || [])].sort((x, y) => String(x.created_at || '').localeCompare(String(y.created_at || '')))) {
    mentions.push(`${libelleNature(a)} — ${a.assureur_nom}, ${a.assureur_coordonnees}. `
      + `Couverture : ${a.couverture}${a.numero_contrat ? `. Contrat n° ${a.numero_contrat}` : ''}`);
  }
  mentions.push(e.mediateur_nom
    ? `Médiateur de la consommation : ${e.mediateur_nom}, ${e.mediateur_adresse}, ${e.mediateur_site}`
    : manqueParticulier('votre médiateur de la consommation'));
  mentions.push(e.garantie_legale_texte
    ? `Garantie légale : ${e.garantie_legale_texte}` : manqueParticulier('vos garanties légales'));
  if (e.garantie_commerciale_texte) mentions.push(`Garantie commerciale : ${e.garantie_commerciale_texte}`);
  if (e.sav_texte) mentions.push(`Service après-vente : ${e.sav_texte}`);
  mentions.push(e.modalites_paiement_texte
    ? `Modalités de paiement : ${e.modalites_paiement_texte}` : manqueParticulier('vos modalités de paiement'));
  mentions.push(e.modalites_execution_texte
    ? `Modalités d’exécution : ${e.modalites_execution_texte}`
    : manqueParticulier('vos modalités d’exécution'));
  mentions.push(e.reclamations_texte
    ? `Réclamations : ${e.reclamations_texte}` : manqueParticulier('le traitement des réclamations'));

  if (t.frais_deplacement_centimes === 0) {
    mentions.push(LIBELLES_IMPRIMES.fraisNonFactures);
  } else if (t.frais_deplacement_centimes != null) {
    mentions.push(`Frais de déplacement : ${centimesLisibles(t.frais_deplacement_centimes)}`
      + (t.frais_deplacement_texte ? ` — ${t.frais_deplacement_texte}` : ''));
  } else if (t.frais_deplacement_texte) {
    mentions.push(`Frais de déplacement : ${t.frais_deplacement_texte}`);
  } else {
    mentions.push(manque('vos frais de déplacement'));
  }

  return { identite, mentions, source: ligneSource(r), manques };
}

/* ================================================================== */
/*  LES AVIS — ce qui mérite d'être dit, et ne bloque rien             */
/* ================================================================== */

/**
 * « À LA SIGNATURE », repéré sur des LIMITES DE MOT.
 *
 * Ne sert qu'à un avis. La version précédente était une contrainte de la
 * base, et elle refusait « … au plus tôt le 8e jour après la signature » :
 * le « a » final de « la » suffisait. C'est pourtant la formule à
 * conseiller. Le détecteur exige donc une préposition ENTIÈRE (« à »,
 * « dès », « lors de ») suivie directement de « la signature », « la
 * commande » ou « l'acceptation ».
 */
export const A_LA_SIGNATURE = Object.freeze([
  /(^|[^\p{L}])(à|a)\s+(la\s+)?(signature|commande)(?!\p{L})/iu,
  /(^|[^\p{L}])dès\s+(la\s+|l['’]\s*)?(signature|commande|acceptation)(?!\p{L})/iu,
  /(^|[^\p{L}])lors\s+de\s+la\s+signature(?!\p{L})/iu,
  /(^|[^\p{L}])(à|a)\s+l['’]\s*acceptation(?!\p{L})/iu,
]);

export function parleDUnPaiementALaSignature(texte) {
  if (texte == null) return false;
  return A_LA_SIGNATURE.some((r) => r.test(String(texte)));
}

/* « aujourd'hui » en AAAA-MM-JJ, au jour LOCAL : une attestation valable
   jusqu'au 18 l'est encore toute la journée du 18, quelle que soit l'heure
   UTC. Les dates se comparent comme des chaînes, la leçon du 04/10. */
function jourLocal(valeur) {
  if (typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valeur)) return valeur.slice(0, 10);
  const d = valeur instanceof Date ? valeur : new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function plusUnAn(jour) {
  const [a, m, j] = jour.split('-');
  return `${Number(a) + 1}-${m}-${j}`;
}

/**
 * LES AVIS : `[{ cle, texte }]`, des remarques qui NE BLOQUENT PAS.
 *
 * Aucun ne dit « la loi l'exige » quand ce n'est pas dans tous les cas. Ils
 * s'affichent en encre discrète, sous le bloc de préparation.
 *
 *   sans_assurance              aucune assurance déclarée (rien n'est exigé
 *                               en général, mais celles qu'on a se déclarent) ;
 *   decennale_sans_attestation  une décennale sans attestation jointe ;
 *   attestation_expiree         une date de validité dépassée ;
 *   liste_mediateurs_ancienne   la liste des médiateurs d'Opus a plus d'un an ;
 *   a_la_signature              « à la signature » dans les modalités de paiement.
 */
export function avisEmetteur({ assurances = [], emetteur = null, aujourdhui = new Date() } = {}) {
  const jour = jourLocal(aujourdhui);
  const e = emetteur || {};
  const liste = assurances || [];
  const avis = [];
  if (!liste.length) {
    avis.push({
      cle: 'sans_assurance',
      texte: 'Aucune assurance déclarée. Opus n’en exige aucune ; mais pour un devis à un '
        + 'particulier, la loi demande de communiquer au client les assurances professionnelles que '
        + 'vous avez souscrites (code de la consommation, R. 111-2) — Opus le fait en les imprimant '
        + 'sur le devis : si vous en avez, déclarez-les.',
    });
  }
  for (const a of liste) {
    /* L'ASSUREUR EST NOMMÉ : deux décennales sans attestation donnaient deux
       avis identiques, sans dire de laquelle il s'agissait. Et `id` voyage
       avec l'avis, pour que l'écran lui donne une clé unique. */
    const chez = a.assureur_nom ? ` (${a.assureur_nom})` : '';
    if (a.nature === 'decennale' && !a.attestation_chemin) {
      /* L. 243-2 joint l'attestation « aux devis et factures des
         professionnels assurés » — QUEL QUE SOIT LE CLIENT (relu le
         18/10/2026). La première version la réservait au particulier, et un
         artisan l'aurait crue facultative pour une SCI ou un promoteur. */
      avis.push({
        cle: 'decennale_sans_attestation',
        id: a.id == null ? null : a.id,
        texte: `Votre décennale${chez} n’a pas d’attestation jointe. Pour des travaux de `
          + 'construction, l’attestation de votre décennale est jointe au devis, quel que soit le '
          + 'client (code des assurances, L. 243-2) : chaque devis le demandera selon ses travaux.',
      });
    }
    if (a.valide_jusquau && String(a.valide_jusquau).slice(0, 10) < jour) {
      avis.push({
        cle: 'attestation_expiree',
        id: a.id == null ? null : a.id,
        texte: `L’assurance « ${libelleNature(a)} »${chez} était valable jusqu’au `
          + `${dateFrancaise(a.valide_jusquau)} : mettez-la à jour avec votre nouvelle attestation.`,
      });
    }
  }
  if (plusUnAn(MEDIATEURS_RELEVES_LE) < jour) {
    avis.push({
      cle: 'liste_mediateurs_ancienne',
      texte: `La liste des médiateurs proposée par Opus a été relevée le `
        + `${dateFrancaise(MEDIATEURS_RELEVES_LE)}, il y a plus d’un an : un médiateur a pu être `
        + 'référencé ou retiré depuis par la CECMC.',
    });
  }
  if (parleDUnPaiementALaSignature(e.modalites_paiement_texte)) {
    avis.push({
      cle: 'a_la_signature',
      texte: 'Vos modalités de paiement parlent d’un paiement à la signature (ou à la commande). '
        + 'Elles s’imprimeront sur tous vos devis. Sur un devis signé le jour de votre passage chez '
        + 'le client, aucun paiement ne peut être exigé avant le 8e jour (code de la consommation, '
        + 'L. 221-10) ; sur un devis envoyé après la visite et accepté plus tard, la formule est '
        + 'permise. Chaque devis dira, au moment de le remettre, comment il est signé.',
    });
  }
  return avis;
}

/* ================================================================== */
/*  LA LISTE DES MÉDIATEURS                                            */
/* ================================================================== */

/* Sans accents, sans casse : « mediation » trouve « Médiation ». */
const sansAccents = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase();
/* Un site se compare sans son protocole, son « www. » ni sa barre finale. */
const siteNu = (s) => sansAccents(s).trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

/** Les médiateurs dont le nom, le site ou un secteur contient le texte cherché ; tous si rien n'est tapé. */
export function chercherMediateur(texte) {
  const q = sansAccents(texte).trim();
  if (!q) return [...MEDIATEURS];
  return MEDIATEURS.filter((m) => [m.nom, m.site, m.secteur, ...m.secteurs.map((s) => s.libelle)]
    .some((champ) => sansAccents(champ).includes(q)));
}

/**
 * L'entrée de la liste qu'une fiche a choisie, reconnue à son NOM et à son
 * SITE — sans colonne de plus en base. `null` pour un médiateur saisi à la
 * main, ou retiré de la liste depuis.
 */
export function mediateurDeLaListe(nom, site) {
  if (!nom || !site) return null;
  const n = sansAccents(nom).trim();
  const s = siteNu(site);
  return MEDIATEURS.find((m) => sansAccents(m.nom).trim() === n && siteNu(m.site) === s) || null;
}
