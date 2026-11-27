/**
 * L'INSTANTANÉ D'UN DEVIS — les FAITS qu'un aperçu imprime, pris au moment du
 * geste (étape 2c-1, cahier §3).
 *
 * CE QUE CE FICHIER FAIT
 * ----------------------
 * Il reçoit ce que les lectures existantes rendent — le devis lu
 * (`api.unDevis`), l'entreprise (`api.monEntreprise`), la fiche « Mon
 * entreprise » (`api.monEmetteur`), la fiche du client (`api.ficheDuCarnet`)
 * —, et il en garde une LISTE FERMÉE de faits, aux noms des colonnes de la
 * base, rangés par table d'origine. Rien d'autre : ni phrase, ni HTML. Les
 * phrases sont la composition (`document-devis.js`), la page le gabarit.
 *
 * Trois séparations, et chacune a sa raison (D1) : un fait se vérifie contre
 * la base ; une phrase se relit ; une page se mesure. Mêlés, aucun des trois
 * ne se vérifie.
 *
 * LA LISTE FERMÉE VIT DANS UN FICHIER : `supabase/champs-instantane.json`
 * (K10). Les clés produites ici sont celles du fichier, dans les deux sens —
 * `verifier-apercu` le fait tourner —, et l'essai SQL de 2c-3a la relira :
 * c'est ce que la base FIGERA à la remise.
 *
 * CE QUI N'Y ENTRE JAMAIS (§3.9) : le téléphone, l'e-mail et les NOTES d'un
 * client — une fiche passée avec ces champs ressort sans eux —, la source du
 * devis, le texte d'une demande ou d'une urgence (décision du 29/10), les
 * dates du devis, son numéro d'écriture, un badge, un prix de référence.
 *
 * CE FICHIER N'IMPORTE QUE DEUX FICHIERS PURS (`devis.js`, `formats.js`) :
 * `node` le fait tourner, dans trois fuseaux et sous deux horloges fausses,
 * et exige la MÊME sortie (A.6). Il ne lit aucune horloge : `maintenant` est
 * donné par l'appelant, et le jour se résout à PARIS (`jourAParis`, D28).
 */

import { coherenceRegime, pourQuiValable, trierLignes } from './devis.js';
import { jourAParis } from './formats.js';

/** Le numéro de la forme de l'instantané : 2c-3 le figera avec lui. */
export const VERSION_INSTANTANE = 1;

/**
 * LES VERSIONS DU RENDU qu'un instantané porte (`versions`) : celle de la
 * composition (`VERSION_COMPOSITION`, `document-devis.js`) et celle du
 * gabarit (`VERSION_GABARIT`, `devis-html.js`). Ce fichier n'importe ni l'un
 * ni l'autre — la composition le lit, le gabarit n'importe rien — : les
 * nombres sont écrits ici une seconde fois, et `verifier-apercu` les compare.
 */
export const VERSIONS_DU_RENDU = Object.freeze({ composition: 1, gabarit: 1 });

/**
 * LES MODES, en liste FERMÉE qui ferme par défaut (K-m7) : un mode hors de
 * la liste LÈVE. Aucun ne retire la marque « APERÇU » : `remis` n'existe pas
 * encore (2c-3).
 */
export const MODES = Object.freeze(['apercu', 'exemple']);

/** Les statuts de l'éditeur (`STATUT`, `src/data/legal.js`), écrits ici : ce
 *  fichier n'importe pas les textes légaux. « Document d'essai — sans
 *  valeur » tant que `STATUT` vaut `essai`. Un statut inconnu LÈVE : une
 *  faute de frappe ne doit pas retirer la marque d'essai en silence. */
export const STATUTS_EDITEUR = Object.freeze(['essai', 'particulier', 'micro', 'societe']);

/* Les colonnes gardées, table par table — le CONTENU INITIAL du fichier de la
   liste (`champs-instantane.json`) ; c'est le fichier qui fait foi, et le
   contrôle compare. `[nom de la base, nom de l'application]` quand la
   source est une conversion de l'application (`rowToDevis`,
   `ligneDepuisBase`, `clientDepuisBase`) ; le nom seul quand la source est
   déjà une ligne brute de la base. */
const DEVIS = Object.freeze([
  ['id', 'id'],
  ['objet', 'objet'],
  ['lieu_adresse', 'lieuAdresse'],
  ['lieu_code_postal', 'lieuCodePostal'],
  ['lieu_ville', 'lieuVille'],
  ['delai_execution', 'delaiExecution'],
  ['validite_jours', 'validiteJours'],
  ['cout_devis_centimes', 'coutDevisCentimes'],
  ['retenue_garantie_centiemes', 'retenueGarantieCentiemes'],
  ['remise_centiemes', 'remiseCentiemes'],
  ['remise_centimes', 'remiseCentimes'],
  ['remise_ht_centimes', 'remiseHtCentimes'],
  ['acompte_centiemes', 'acompteCentiemes'],
  ['acompte_centimes', 'acompteCentimes'],
  ['acompte_nature', 'acompteNature'],
  ['acompte_ttc_centimes', 'acompteTtcCentimes'],
  ['total_ht_centimes', 'totalHtCentimes'],
  ['total_tva_centimes', 'totalTvaCentimes'],
  ['total_ttc_centimes', 'totalTtcCentimes'],
  ['total_ttc_options_centimes', 'totalTtcOptionsCentimes'],
  ['client_id', 'clientId'],
  /* Trois faits qui ne s'impriment PAS encore, mais qui décident des places
     de 2c-2 (D24, relecture « contenu » du 27/11) : sans eux, la page ne
     pouvait pas marquer les déchets, le label RGE ni l'attestation
     décennale, et l'écran disait pourtant « ce qui viendra est marqué ». */
  ['dechets_concerne', 'dechetsConcerne'],
  ['energie_travaux', 'energieTravaux'],
  ['engage_decennale', 'engageDecennale'],
]);
const VENTILATION = Object.freeze([
  ['taux_tva_centiemes', 'taux'],
  ['base_centimes', 'base'],
  ['remise_centimes', 'remise'],
  ['tva_centimes', 'tva'],
  ['nb_lignes', 'nbLignes'],
]);
const LIGNES = Object.freeze([
  ['id', 'id'],
  ['ordre', 'ordre'],
  ['type', 'type'],
  ['designation', 'designation'],
  ['quantite_milliemes', 'quantiteMilliemes'],
  ['unite', 'unite'],
  ['prix_unitaire_centimes', 'prixUnitaireCentimes'],
  ['taux_tva_centiemes', 'tauxTvaCentiemes'],
  ['total_centimes', 'totalCentimes'],
  ['offert', 'offert'],
  ['fourniture_non_comprise', 'fournitureNonComprise'],
  ['urgence', 'urgence'],
]);
const CLIENT = Object.freeze([
  ['nom', 'nom'],
  ['type', 'type'],
  ['siret', 'siret'],
  ['adresse', 'adresse'],
  ['code_postal', 'codePostal'],
  ['ville', 'ville'],
]);
const ENTREPRISE = Object.freeze([
  'siren', 'siret', 'denomination', 'nom_commercial', 'est_ei', 'forme_juridique', 'tva',
  'est_siege', 'adresse', 'code_postal', 'commune', 'maj_insee', 'verifie_le', 'source',
]);
/* Les deux JOURS de l'entreprise, résolus à Paris (D28) : `maj_insee` est
   une date (rendue telle quelle), `verifie_le` un horodatage — lu à l'heure
   du téléphone, « consultée le » changeait de jour selon le fuseau. */
const JOURS_DE_L_ENTREPRISE = Object.freeze(['maj_insee', 'verifie_le']);
const EMETTEUR = Object.freeze([
  'denomination_ei', 'registre', 'greffe_ville', 'capital_centimes', 'capital_variable',
  'en_liquidation', 'locataire_gerant',
  'etablissement_adresse', 'etablissement_code_postal', 'etablissement_ville',
  'siege_adresse', 'siege_code_postal', 'siege_ville',
  'telephone', 'email', 'regime_tva',
  'mediateur_nom', 'mediateur_adresse', 'mediateur_site',
  'garantie_legale_texte', 'garantie_commerciale_texte', 'sav_texte',
  'modalites_paiement_texte', 'modalites_execution_texte', 'reclamations_texte',
]);
const ASSURANCES = Object.freeze([
  'nature', 'libelle', 'assureur_nom', 'assureur_coordonnees', 'couverture', 'numero_contrat',
  'valide_jusquau', 'created_at', 'attestation_chemin',
]);
const TARIFS = Object.freeze(['frais_deplacement_centimes', 'frais_deplacement_texte']);
const PREUVE_TVA = Object.freeze(['numero', 'siren', 'source', 'reconnu_le', 'declare_le']);

/** Les colonnes, par table : lues par `verifier-apercu` pour comparer au
 *  fichier de la liste. */
export const COLONNES_DE_L_INSTANTANE = Object.freeze({
  devis: Object.freeze(DEVIS.map(([b]) => b)),
  ventilation: Object.freeze(VENTILATION.map(([b]) => b)),
  lignes: Object.freeze(LIGNES.map(([b]) => b)),
  client: Object.freeze(CLIENT.map(([b]) => b)),
  entreprise: ENTREPRISE,
  emetteur: EMETTEUR,
  assurances: ASSURANCES,
  tarifs: TARIFS,
  preuve_tva: PREUVE_TVA,
});

/* Une valeur absente de la ligne source vaut `null` : une clé de la liste
   existe toujours quand sa table existe. */
const valeur = (o, cle) => (o && Object.prototype.hasOwnProperty.call(o, cle) && o[cle] !== undefined ? o[cle] : null);
const depuisLApplication = (o, colonnes) => Object.fromEntries(colonnes.map(([base, appli]) => [base, valeur(o, appli)]));
const depuisLaBase = (o, colonnes) => Object.fromEntries(colonnes.map((c) => [c, valeur(o, c)]));

/* Comparaison PAR POINTS DE CODE (jamais `localeCompare`, §3.6). */
const parPointsDeCode = (a, b) => {
  if (a < b) return -1;
  return a > b ? 1 : 0;
};

/* Un instant de l'appelant : une `Date` (ou ce qui en a la forme) ou un
   nombre de millisecondes. Rien d'autre : une chaîne se lirait selon le
   moteur. */
function instantValable(m) {
  if (m && typeof m === 'object' && typeof m.getTime === 'function') return Number.isFinite(m.getTime());
  return typeof m === 'number' && Number.isFinite(m);
}

const ENTREES = Object.freeze([
  'devisLu', 'entreprise', 'emetteur', 'assurances', 'tarifs', 'preuveTva', 'client', 'maintenant', 'statut', 'mode',
]);

/**
 * L'INSTANTANÉ D'UN DEVIS (§3.10).
 *
 * `entrees` = `{ devisLu, entreprise, emetteur, assurances, tarifs,
 * preuveTva, client, maintenant, statut, mode }`, TOUTES obligatoires : une
 * absence se passe en `null` EXPLICITE (une clé oubliée LÈVE — un appelant
 * qui oublie le client ne doit pas fabriquer un devis « sans client »).
 *   - `devisLu` : ce que rend `api.unDevis(id)` (`{ devis, lignes,
 *     ventilation }`, aux noms de l'application) ;
 *   - `entreprise` : la ligne de `entreprise_registre` (`api.monEntreprise`) ;
 *   - `emetteur`, `assurances`, `tarifs`, `preuveTva` : les lignes brutes de
 *     `api.monEmetteur()` ;
 *   - `client` : la fiche du carnet (`clientDepuisBase`), ou `null` ;
 *   - `maintenant` : une `Date` ou des millisecondes, donnée par l'appelant ;
 *   - `statut` : `STATUT` (`legal.js`) ; `mode` : `apercu` ou `exemple`.
 *
 * Rend `{ ok: true, instantane }`, ou :
 *   - `{ ok: false, raison: 'devis_absent' }` quand il n'y a pas de devis ;
 *   - `{ ok: false, raison: 'regime_contradictoire', phrase }` dans les DEUX
 *     cas de D13 seulement — la franchise avec des lignes taxées, le régime
 *     non déclaré avec des lignes chiffrées —, avec la phrase EXACTE de
 *     `coherenceRegime`. Au régime réel, une ligne à 0 n'empêche PAS
 *     l'aperçu (C-m1) : elle imprime « sans TVA » et un marqueur.
 * LÈVE sur un mode hors liste, un `maintenant` absent ou illisible, un statut
 * inconnu, une clé d'entrée manquante, ou une fiche de client qui n'est pas
 * celle du devis : des fautes de programmation, pas des états de l'écran.
 */
export function instantaneDuDevis(entrees) {
  const e = entrees && typeof entrees === 'object' ? entrees : {};
  const manquantes = ENTREES.filter((c) => !Object.prototype.hasOwnProperty.call(e, c) || e[c] === undefined);
  if (manquantes.length) throw new Error(`instantaneDuDevis : entrée absente (${manquantes.join(', ')}) — passez null`);
  if (!MODES.includes(e.mode)) throw new Error(`instantaneDuDevis : mode inconnu « ${String(e.mode)} »`);
  if (!instantValable(e.maintenant)) throw new Error('instantaneDuDevis : « maintenant » absent ou illisible');
  if (!STATUTS_EDITEUR.includes(e.statut)) throw new Error(`instantaneDuDevis : statut inconnu « ${String(e.statut)} »`);

  const lu = e.devisLu;
  const d = lu && lu.devis;
  if (!d) return { ok: false, raison: 'devis_absent' };
  const lignesLues = Array.isArray(lu.lignes) ? lu.lignes : [];

  const emetteur = e.emetteur ? depuisLaBase(e.emetteur, EMETTEUR) : null;
  /* D13 : deux cas seulement. `coherenceRegime` écrit aussi une phrase pour
     le régime réel (une ligne à 0) : là, pas de refus. */
  const regime = emetteur ? emetteur.regime_tva : null;
  if (regime !== 'reel') {
    const phrase = coherenceRegime(lignesLues, regime === 'franchise' ? 'franchise' : null);
    if (phrase) return { ok: false, raison: 'regime_contradictoire', phrase };
  }

  /* La fiche du client ne vaut que pour le client du DEVIS. Sans client au
     devis, aucune fiche ; une fiche d'un AUTRE client est une faute de
     l'appelant. La comparaison ignore la casse, comme deux `uuid`. */
  let client = null;
  if (d.clientId != null && e.client) {
    if (String(e.client.id).toLowerCase() !== String(d.clientId).toLowerCase()) {
      throw new Error('instantaneDuDevis : la fiche passée n’est pas celle du client du devis');
    }
    client = depuisLApplication(e.client, CLIENT);
  }

  const entreprise = e.entreprise ? depuisLaBase(e.entreprise, ENTREPRISE) : null;
  if (entreprise) {
    for (const c of JOURS_DE_L_ENTREPRISE) entreprise[c] = entreprise[c] == null ? null : jourAParis(entreprise[c]);
  }

  /* Les assurances, DANS L'ORDRE D'IMPRESSION (§3.6) — par la date de
     création comparée par points de code, puis par l'identifiant —, et
     sans l'identifiant, qui ne s'imprime pas : l'ordre suffit. */
  const assurances = [...(Array.isArray(e.assurances) ? e.assurances : [])]
    .sort((x, y) => parPointsDeCode(String(valeur(x, 'created_at') ?? ''), String(valeur(y, 'created_at') ?? ''))
      || parPointsDeCode(String(valeur(x, 'id') ?? ''), String(valeur(y, 'id') ?? '')))
    .map((a) => depuisLaBase(a, ASSURANCES));

  const jour = jourAParis(e.maintenant);
  const instantane = {
    version: VERSION_INSTANTANE,
    devis: {
      ...depuisLApplication(d, DEVIS),
      /* La ventilation telle que la BASE l'a calculée : les taux qui ont des
         lignes, du plus fort au plus faible. */
      ventilation: (Array.isArray(lu.ventilation) ? lu.ventilation : [])
        .filter((v) => Number(v && v.nbLignes) > 0)
        .map((v) => depuisLApplication(v, VENTILATION))
        .sort((a, b) => Number(b.taux_tva_centiemes) - Number(a.taux_tva_centiemes)),
      /* LA RÉPONSE « À QUEL TITRE » VALABLE, jamais imprimée (J9) : elle
         choisit les mentions (D7) et les places de 2c-2 (D24). */
      pour_qui_valable: pourQuiValable(d),
    },
    /* Les lignes, par `ordre` puis `id` (`trierLignes`) : la même règle que
       la base et que l'écran. */
    lignes: trierLignes(lignesLues).map((l) => depuisLApplication(l, LIGNES)),
    entreprise,
    emetteur,
    assurances,
    tarifs: e.tarifs ? depuisLaBase(e.tarifs, TARIFS) : null,
    preuve_tva: e.preuveTva ? depuisLaBase(e.preuveTva, PREUVE_TVA) : null,
    client,
    jour,
    annee: Number(jour.slice(0, 4)),
    statut: e.statut,
    mode: e.mode,
    versions: { composition: VERSIONS_DU_RENDU.composition, gabarit: VERSIONS_DU_RENDU.gabarit },
  };
  return { ok: true, instantane };
}

/**
 * LES CHEMINS DES CLÉS d'un instantané, pour les comparer au fichier de la
 * liste : `devis.objet`, `lignes[].designation`, `devis.ventilation[].tva_centimes`…
 * Un tableau d'OBJETS se dit `[]` (vide, il ne produit rien) ; un tableau
 * de VALEURS SIMPLES est une feuille — c'est une colonne `text[]` de la base
 * (`devis.energie_travaux`), pas une table ; un objet `null` (pas
 * d'entreprise, pas de client) ne produit que son propre chemin. Les
 * feuilles seulement.
 */
export function cheminsDeLInstantane(instantane) {
  const chemins = new Set();
  const simple = (x) => x === null || typeof x !== 'object';
  const parcourir = (v, prefixe) => {
    if (Array.isArray(v) && v.length > 0 && v.every(simple)) {
      chemins.add(prefixe);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((x) => parcourir(x, `${prefixe}[]`));
      return;
    }
    if (v && typeof v === 'object') {
      Object.keys(v).forEach((k) => parcourir(v[k], prefixe ? `${prefixe}.${k}` : k));
      return;
    }
    chemins.add(prefixe);
  };
  parcourir(instantane, '');
  return chemins;
}
