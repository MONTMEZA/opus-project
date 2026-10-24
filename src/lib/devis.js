/**
 * LE CHIFFRAGE D'UN DEVIS — le calcul, sans rien afficher (lot 1, 21/10/2026).
 *
 * CE QUE CE FICHIER FAIT
 * ----------------------
 * Tout ce qui décide d'une somme d'argent dans un devis : le total d'une
 * ligne, la TVA par taux, les totaux, les refus (les miroirs des contraintes
 * de la section 49 de `schema.sql`), le rangement des lignes pièce par
 * pièce, la mémoire des prix déjà écrits, et les phrases qui disent la loi
 * (la retenue de garantie, le délai d'exécution, la franchise).
 *
 * C'est la BASE qui fait foi : elle recalcule tout, à chaque ligne. Ce
 * fichier sert à trois choses — refuser AVANT d'envoyer, avec la même
 * contrainte que la base citerait ; faire vivre le mode démonstration, où
 * il n'y a pas de base ; et être éprouvé par `verifier-devis` sur le MÊME
 * jeu de cas que PostgreSQL (`supabase/cas-devis.json`). Deux écritures
 * d'une règle ne sont acceptables que tenues ensemble par un contrôle.
 *
 * L'ARGENT, EN ENTIERS, DE BOUT EN BOUT
 * -------------------------------------
 * Un montant en CENTIMES, une quantité en MILLIÈMES de l'unité, un taux en
 * CENTIÈMES DE POINT (5,5 % → 550). Jamais un nombre à virgule, jamais
 * `Math.round`, jamais `toFixed` : `(2.5 * 33.33).toFixed(2)` rend
 * « 83.32 » au lieu de « 83.33 », et `Math.round(euros × taux × 100)` se
 * trompe 447 fois sur les bases de 0 à 2 000 € à trois taux (mesuré par la
 * lecture « argent » du cahier). Les deux arrondis sont des divisions
 * entières de nombres POSITIFS, demi vers le haut — la même formule qu'en
 * SQL, octet pour octet :
 *   - le total d'une ligne : (quantité × prix + 500) / 1000 ;
 *   - la TVA d'un taux :     (base × taux + 5 000) / 10 000, UNE fois sur
 *     la somme des lignes de ce taux (3 × 33,33 € à 10 % : 10,00 € de TVA,
 *     et non 9,99 € ligne par ligne).
 *
 * CE FICHIER N'IMPORTE QUE TROIS FICHIERS PURS
 * --------------------------------------------
 * `./centimes.js` (l'écriture d'un montant, la seule du projet),
 * `./entreprise.js` (pour `dateFrancaise()` et `isoLisible()` : une date
 * d'horodatage se lit à l'heure du téléphone, jamais par ses dix premiers
 * caractères — la leçon de la nuit du lot T) et, depuis le lot P,
 * `./rapprochement.js` (la clé de rapprochement : « Seuil » et « seuils »
 * sont la même phrase, sans `normalize`, sans table Unicode). Aucun des
 * trois ne charge React Native : `node` fait tourner ce fichier, et un
 * contrôle qui plante ne vérifie rien. `verifier-devis` tient cette liste.
 *
 * LES NOMS
 * --------
 * Une ligne et un devis portent ici les noms de leurs colonnes, écrits en
 * camelCase (`prixUnitaireCentimes` pour `prix_unitaire_centimes`) :
 * `api.js` traduit, une fois, à l'aller et au retour.
 */
import { centimesLisibles } from './centimes.js';
import { dateFrancaise, isoLisible } from './entreprise.js';
import { cleDeRapprochement, aPlat } from './rapprochement.js';

/* ================================================================== */
/*  LES CONSTANTES — chacune a son miroir dans la base                  */
/* ================================================================== */

/** Les cinq sortes de ligne (`devis_ligne_type_check`). « Offert » n'en est
 *  pas une : c'est un interrupteur sur un poste. */
export const TYPES_LIGNE = Object.freeze(['zone', 'piece', 'poste', 'option', 'reserve']);

/** Les lignes qui portent un prix (`devis_ligne_forme_check`, `…_total_check`). */
export const TYPES_CHIFFRES = Object.freeze(['poste', 'option']);

/**
 * Les SEPT unités (`devis_ligne_unite_check`), en liste FERMÉE — « jour »
 * ajoutée par le propriétaire le 21/10/2026 (réponse Q2 du cahier du lot 1) :
 * une journée de pose se chiffre à la journée. `verifier-devis` écrit les
 * sept clés et leurs libellés EN DUR, contre cette décision, et non contre
 * une seconde copie qui se tromperait avec celle-ci.
 *   - `court` : ce qu'affichent la rangée et la mémoire (« 45,00 €/m² ») ;
 *   - `pastille` : le mot du bouton — « m linéaire », jamais « ml », qu'on
 *     lit « millilitre » (décret n° 61-501) ; « unité », que la pastille
 *     dit en toutes lettres ;
 *   - `nom` : ce que lit VoiceOver.
 * « u » reste le libellé court : c'est celui des devis du propriétaire
 * (« 270 € / u »), et compter des pièces ne mesure aucune grandeur.
 */
export const UNITES = Object.freeze([
  Object.freeze({ cle: 'm2', court: 'm²', pastille: 'm²', nom: 'mètre carré' }),
  Object.freeze({ cle: 'm', court: 'm', pastille: 'm linéaire', nom: 'mètre linéaire' }),
  Object.freeze({ cle: 'm3', court: 'm³', pastille: 'm³', nom: 'mètre cube' }),
  Object.freeze({ cle: 'u', court: 'u', pastille: 'unité', nom: 'unité' }),
  Object.freeze({ cle: 'h', court: 'h', pastille: 'heure', nom: 'heure' }),
  Object.freeze({ cle: 'jour', court: 'jour', pastille: 'jour', nom: 'jour' }),
  Object.freeze({ cle: 'forfait', court: 'forfait', pastille: 'forfait', nom: 'forfait' }),
]);

/** L'unité PROPOSÉE quand on allume « Main-d'œuvre » — jamais imposée : un
 *  prix au m² est un prix forfaitaire (arrêté du 24/01/2017, art. 2). */
export const UNITE_MAIN_OEUVRE = 'h';

/** Les taux que l'écran du lot 1 produit, en centièmes de point
 *  (`devis_ligne_taux_check`, `devis_tva_taux_check`). `0` = aucune TVA
 *  facturée sur la ligne : la RAISON (la franchise aujourd'hui) est portée
 *  par le régime de l'entreprise, jamais par la ligne. */
export const TAUX_TVA = Object.freeze([0, 550, 1000, 2000]);

/** Les bornes des contraintes : une quantité au plus de 99 999,999 ; un prix,
 *  une ligne, un total au plus de 99 999 999,99 € ; 500 lignes (`OP014`). */
export const QUANTITE_MAX = 99_999_999;
export const PRIX_MAX = 9_999_999_999;
export const PLAFOND = 9_999_999_999;
export const LIGNES_MAX = 500;
/** Une surface, en millièmes de m² — la même échelle que la quantité, puisqu'elle s'y copie. */
export const SURFACE_MAX = 99_999_999;

/** La retenue de garantie : au plus 5 % (loi n° 71-584, art. 1er). */
export const RETENUE_MAX = 500;

/** Les longueurs des textes, en CARACTÈRES (comme `char_length`). */
export const LONGUEURS = Object.freeze({
  designation: 2000,
  objet: 1000,
  lieuAdresse: 200,
  lieuVille: 120,
  delaiExecution: 200,
});

/** Le geste qui a ouvert le brouillon (`devis_source_check`). Jamais `qr`,
 *  `visite` ni `dossier` : le QR n'est jamais une origine (D3). */
export const SOURCES = Object.freeze(['manuelle', 'demande', 'urgence']);
/** Un seul statut au lot 1 (`devis_statut_check`). */
export const STATUTS = Object.freeze(['brouillon']);

/**
 * Les dix contraintes de `devis_lignes`, TRIÉES PAR ORDRE ALPHABÉTIQUE.
 *
 * Ce n'est pas une coquetterie : quand une ligne viole plusieurs
 * contraintes, PostgreSQL nomme la PREMIÈRE dans l'ordre alphabétique de
 * leurs noms (il les trie à la lecture du catalogue). `validerLigne()` teste
 * dans cet ordre-ci, pour nommer la même que la base — la double faute
 * « quantité 0 ET prix 0 sans Offert » rend `devis_ligne_offert_check` des
 * deux côtés.
 */
export const CONTRAINTES_LIGNE = Object.freeze([
  'devis_ligne_designation_check',
  'devis_ligne_forme_check',
  'devis_ligne_offert_check',
  'devis_ligne_prix_check',
  'devis_ligne_quantite_check',
  'devis_ligne_surfaces_check',
  'devis_ligne_taux_check',
  'devis_ligne_total_check',
  'devis_ligne_type_check',
  'devis_ligne_unite_check',
]);

/** Les dix contraintes de `devis`, triées de même. `validerDevis()` teste
 *  celles qui portent sur ce que l'artisan écrit ; `devis_plafond_check` est
 *  tenu par `totauxDevis()`, `devis_totaux_check` par la base seule. */
export const CONTRAINTES_DEVIS = Object.freeze([
  'devis_delai_check',
  'devis_lieu_adresse_check',
  'devis_lieu_code_postal_check',
  'devis_lieu_ville_check',
  'devis_objet_check',
  'devis_plafond_check',
  'devis_retenue_check',
  'devis_source_check',
  'devis_statut_check',
  'devis_totaux_check',
]);

/**
 * Les blancs qu'on retire au bord d'un texte, INVISIBLES compris : un texte
 * fait d'un U+200B n'est pas une désignation. C'est la classe de la section
 * 47 et de `BLANCS_TARIFS` (`emetteur.js`), recopiée ici parce que ce
 * fichier n'importe pas `emetteur.js` : `verifier-devis` compare les copies.
 */
export const BLANCS = ' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff';
const BORDS = new RegExp(`^[${BLANCS}]+|[${BLANCS}]+$`, 'g');

/** La mention d'un franchisé, à la place de la TVA (CGI, art. 293 B et
 *  293 E). UNE constante : la recodification de la TVA (CIBS, 01/01/2027)
 *  changera peut-être ce libellé, et il ne doit changer qu'ici. */
export const MENTION_FRANCHISE = 'TVA non applicable, article 293 B du CGI';

/**
 * La retenue de garantie, dite telle que la loi la dit — et jamais la
 * durée sans sa réserve. Loi n° 71-584 du 16/07/1971, art. 1er (au plus
 * 5 % des acomptes ; la consignation ; la caution qui l'écarte) et art. 2
 * (rendue un an après la réception, SAUF opposition motivée notifiée par
 * lettre recommandée) ; décret n° 71-1058, art. 1er (qui peut se porter
 * caution). Le lot 2 l'imprimera telle quelle.
 */
export const PHRASE_RETENUE = 'Retenue sur les acomptes, au plus 5\u00a0% (loi n°\u00a071-584 du 16/07/1971). '
  + 'Le client consigne la somme retenue chez un consignataire accepté par vous deux — à défaut, '
  + 'désigné par le président du tribunal. Elle n’est pas retenue si vous fournissez une caution '
  + 'd’un montant égal (banque, établissement financier habilité ou société de caution mutuelle). '
  + 'Elle vous revient un an après la réception des travaux, sauf si le client a notifié, par '
  + 'lettre recommandée, une opposition motivée par l’inexécution de vos obligations.';

/**
 * Le délai qu'un appui propose, et POURQUOI : face à un consommateur, sans
 * date ni délai écrits, la loi oblige à livrer « sans retard injustifié et
 * au plus tard trente jours après la conclusion du contrat » (code de la
 * consommation, art. L. 216-1). Elle ne vaut que face à un particulier, et
 * elle compte depuis la conclusion du contrat : la phrase le dit.
 */
export const DELAI_PAR_DEFAUT = Object.freeze({
  texte: 'Dans les 30 jours suivant la signature du devis',
  pourquoi: 'Face à un particulier, si vous n’écrivez ni date ni délai, la loi vous oblige à intervenir '
    + 'sans retard injustifié, et au plus tard 30 jours après la conclusion du contrat (code de la '
    + 'consommation, art. L.\u00a0216-1).',
});

/** « Mes devis » montre les 200 plus récents, et le DIT au-delà. */
export const PLAFOND_LISTE = 200;
/** La mémoire relit les 500 lignes les plus récentes de ses devis. */
export const MEMOIRE_MAX = 500;

/** Vingt devis d'une entreprise au plus pour une même demande, vingt pour
 *  une même urgence (`OP017`, section 49.6 — relecture sécurité de
 *  l'étape 3 : sans borne, un particulier ne pouvait plus supprimer son
 *  compte). Le miroir de `v_plafond` dans `tient_le_devis()` ; la
 *  démonstration refuse le vingt-et-unième, comme la base. */
export const DEVIS_PAR_DEMANDE_MAX = 20;

/**
 * CE QUE L'ARTISAN ÉCRIT — les seules colonnes que le téléphone envoie, en
 * camelCase (étape 4 du lot 1, 22/10/2026).
 *
 * Tout le reste est posé par la BASE : les totaux (relus dans `devis_tva`),
 * les dates (`clock_timestamp()`), le statut (son défaut), le total d'une
 * ligne (le déclencheur) ; et le numéro d'écriture voyage à côté des
 * valeurs (49.5 bis). L'entreprise (`pro_id`), l'identifiant, la `source`
 * et le devis d'une ligne (`devis_id`) ne partent qu'à la CRÉATION : la
 * source est le geste qui a ouvert le brouillon (D3), et une ligne ne
 * change pas de devis par la file d'écriture.
 *
 * `api.js` traduit ces noms vers ceux de la base (`devisVersBase`,
 * `ligneVersBase`) ; la démonstration et la file s'y limitent aussi : une
 * clé de plus — un total recopié, une date — ferait partir une écriture
 * pour rien, ou mentirait sur ce que la base a gardé. `verifier-devis` fait
 * tourner la traduction et la compare à ces deux listes.
 */
export const CHAMPS_DEVIS = Object.freeze([
  'clientId', 'quoteRequestId', 'sosRequestId', 'source', 'objet', 'lieuAdresse', 'lieuCodePostal',
  'lieuVille', 'delaiExecution', 'retenueGarantieCentiemes',
]);
export const CHAMPS_LIGNE = Object.freeze([
  'ordre', 'type', 'designation', 'quantiteMilliemes', 'unite', 'prixUnitaireCentimes', 'tauxTvaCentiemes',
  'offert', 'mainOeuvre', 'fournitureNonComprise', 'surfaceSolMilliemes', 'surfaceMursMilliemes',
]);

/** Les valeurs d'un objet réduites à une liste de champs — seulement ceux
 *  qu'il PORTE : une clé absente reste absente (ne rien dire n'est pas
 *  « vider »). */
export function choisirChamps(v, champs) {
  const r = {};
  if (!v || typeof v !== 'object') return r;
  champs.forEach((c) => { if (Object.prototype.hasOwnProperty.call(v, c) && v[c] !== undefined) r[c] = v[c]; });
  return r;
}

/**
 * ROUVRIR UN DEVIS DONT LA FILE N'A PAS FINI — ce que l'écran doit montrer.
 *
 * La file d'un devis survit à son écran tant qu'elle écrit (une ligne quittée
 * par « Quitter sans elles », une écriture lente). Rouvrir le devis lisait la
 * BASE et s'y fiait : la ligne ajoutée n'était pas à l'écran, le prix changé
 * montrait l'ancien, et l'artisan qui retapait ce qui « manquait » créait un
 * doublon (relecture « données » des étapes 4 à 7, I2, prouvé par la vraie
 * file sur la base de démonstration).
 *
 * Ce qui fait foi, objet par objet : ce que la base a si la file le dit
 * « enregistrée » ; ce que la file VEUT sinon (en cours, en échec, locale) ;
 * rien pour ce que la file retire. `entrees` : `file.entreesVoulues()`.
 * Une fonction pure : `verifier-devis` la fait tourner.
 */
export function fusionnerAvecLaFile({ devis = {}, lignes = [] } = {}, entrees = []) {
  const parId = new Map((lignes || []).map((l) => [l.id, { ...l }]));
  let d = { ...devis };
  (entrees || []).forEach((e) => {
    if (!e || !e.voulu) return;
    const enAttente = e.locale || e.etat !== 'enregistree';
    if (e.cle === 'devis') {
      if (enAttente) d = { ...d, ...choisirChamps(e.voulu, CHAMPS_DEVIS) };
      return;
    }
    if (e.retire) { parId.delete(e.cle); return; }
    if (enAttente) {
      const avant = parId.get(e.cle) || { id: e.cle, devisId: d.id ?? null };
      parId.set(e.cle, { ...avant, ...choisirChamps(e.voulu, CHAMPS_LIGNE), id: e.cle });
    }
  });
  return { devis: d, lignes: [...parId.values()] };
}

/* ================================================================== */
/*  LES OUTILS                                                          */
/* ================================================================== */

/* Le nombre de CARACTÈRES, comme `char_length` — et non d'unités UTF-16. */
const longueur = (s) => [...String(s)].length;
const entier = (n) => Number.isSafeInteger(n);
const present = (v) => v !== null && v !== undefined;
const vrai = (b) => b === true;
/* LE TYPE D'UNE LIGNE, une seule règle partout : sans type, c'est un poste
   (le défaut de la colonne, et ce que fait `nettoyerLigne`). Écrite deux
   fois, elle s'était déjà dédoublée : une ligne sans type comptait dans le
   total du devis et pas dans le sous-total de sa pièce. */
const typeDe = (l) => (l && present(l.type) ? l.type : 'poste');

/** Un texte rogné de ses blancs (invisibles compris), ou `null` s'il ne
 *  reste rien : un blanc n'est pas une valeur. Miroir des déclencheurs. */
export function texteNet(v) {
  if (v == null) return null;
  const s = String(v).replace(BORDS, '');
  return s === '' ? null : s;
}

/* Sans accents ni casse ni pluriel, pour `avertissementDelai`. */
const pourChercher = (s) => cleDeRapprochement(String(s || '')) || '';

/* ================================================================== */
/*  LES DEUX ARRONDIS                                                   */
/* ================================================================== */

/**
 * n / d, arrondi au plus proche, le demi vers le HAUT — en entiers.
 *
 * `n` est un entier positif ou nul, `d` un entier pair et positif ; sinon
 * `null`. La formule est celle de PostgreSQL, `(n + d/2) / d` en division
 * entière, écrite sans `Math.floor` sur un nombre à virgule :
 * `(m − m mod d) / d` est exact pour tout entier sûr. Un nombre NÉGATIF
 * n'entre jamais : PostgreSQL tronque vers zéro, JavaScript arrondirait
 * autrement, et les deux côtés diraient deux choses.
 */
export function diviserArrondi(n, d) {
  if (!entier(n) || n < 0 || !entier(d) || d <= 0 || d % 2 !== 0) return null;
  const m = n + d / 2;
  if (!entier(m)) return null;
  return (m - (m % d)) / d;
}

/* Le miroir de `devis_total_ligne(q, p)` : `null` hors des bornes de la
   fonction SQL, la valeur EXACTE sinon. Quand q × p dépasse ce que
   JavaScript calcule exactement (2^53), la valeur existe en SQL mais pas
   ici : on rend `Infinity`. Ce n'est pas une approximation — un produit
   au-delà de 2^53 vaut, arrondi, plus de 9 000 milliards de centimes, donc
   bien plus que le plafond (mesuré sur quantité et prix au maximum, C07e).
   Le PLAFOND, lui, ne s'écrit qu'à UN endroit : `valeurLigne`. */
function totalSql(q, p) {
  if (!entier(q) || q < 1 || q > QUANTITE_MAX || !entier(p) || p < 0 || p > PRIX_MAX) return null;
  const produit = q * p;
  if (!entier(produit)) return Infinity;
  return diviserArrondi(produit, 1000);
}

/**
 * Ce que VAUT une ligne chiffrée, avant « Offert » : quantité en millièmes ×
 * prix en centimes, ramené au centime. `null` pour un titre, une réserve,
 * ou une ligne irrecevable — dont une valeur au-delà de 99 999 999,99 €.
 */
export function valeurLigne(l) {
  if (!l || !TYPES_CHIFFRES.includes(typeDe(l))) return null;
  const v = totalSql(l.quantiteMilliemes, l.prixUnitaireCentimes);
  return v == null || v > PLAFOND ? null : v;
}

/**
 * Le total d'une ligne : 0 quand elle est OFFERTE — son prix reste écrit, il
 * dit ce qu'on offre (la facture devra porter le prix avant remise, BOFiP
 * BOI-TVA-DECLA-30-20-20-10 §220) —, sa valeur sinon. `null` si elle est
 * irrecevable, même offerte : une valeur offerte au-delà du plafond
 * s'imprimerait un jour.
 */
export function totalLigne(l) {
  const v = valeurLigne(l);
  if (v == null) return null;
  return vrai(l.offert) ? 0 : v;
}

/**
 * Le plus grand taux que la fonction de calcul accepte, en centièmes de
 * point (90 %). Ce n'est pas une règle de TVA — les lignes n'en portent que
 * quatre (`TAUX_TVA`) — mais la borne qui garde `devis_tva_de` d'une erreur :
 * sans elle, `devis_tva_de(999999999999999, 9224)` sort en « 22003 bigint out
 * of range », en anglais (mesuré sur PostgreSQL 16 le 21/10/2026), alors que
 * la fonction promet `NULL` hors de ses bornes. Avec une base de 15 chiffres
 * au plus, base × 9 000 + 5 000 tient dans un `bigint`. La section 49 écrit
 * la MÊME borne (`p_taux between 0 and 9000`), et le contrôle les compare.
 */
export const TAUX_CALCUL_MAX = 9000;

/**
 * La TVA d'un taux : base en centimes × taux en centièmes de point, ramenée
 * au centime, demi vers le haut. `null` hors de 0 ≤ base ≤ 999 999 999 999
 * 999 et de 0 ≤ taux ≤ `TAUX_CALCUL_MAX` (les bornes de `devis_tva_de`), ou
 * quand le produit dépasse ce que JavaScript calcule exactement — ce qui
 * n'arrive qu'au-delà du plafond.
 */
export function tvaDe(base, taux) {
  if (!entier(base) || base < 0 || base > 999_999_999_999_999) return null;
  if (!entier(taux) || taux < 0 || taux > TAUX_CALCUL_MAX) return null;
  return diviserArrondi(base * taux, 10000);
}

/* ================================================================== */
/*  CE QU'ON TAPE                                                       */
/* ================================================================== */

/* Espaces ordinaires, insécables (U+00A0) et fines insécables (U+202F) :
   « 1 000 » collé depuis un tableur doit passer, comme dans `versCentimes`. */
const ESPACES_TAPES = /[\s\u00a0\u202f]/g;

/**
 * Une quantité tapée → des MILLIÈMES de l'unité : « 2,5 » ou « 2.5 » → 2500.
 * Trois décimales au plus ; cinq chiffres avant la virgule au plus (la
 * borne est 99 999,999) ; un négatif est refusé. Une chaîne vide rend
 * `{ ok: true, milliemes: null }` : non renseigné, jamais 0. Le calcul se
 * fait sur la CHAÎNE, sans nombre à virgule.
 */
export function versMilliemes(texte) {
  const brut = String(texte == null ? '' : texte).replace(ESPACES_TAPES, '');
  if (brut === '') return { ok: true, milliemes: null, message: null };
  if (brut.startsWith('-')) {
    return { ok: false, milliemes: null, message: 'Une quantité ne peut pas être négative.' };
  }
  /* « ,5 » vaut 0,5 : sur un pavé décimal, on tape la virgule d'abord. Il
     était refusé avec « une seule virgule » — il n'y en a qu'une (relecture
     « écran » des étapes 4 à 7, C7). Une virgule SEULE reste refusée. */
  const m = brut.match(/^(\d*)(?:[.,](\d*))?$/);
  if (!m || !/\d/.test(brut)) {
    return {
      ok: false, milliemes: null,
      message: 'Écrivez une quantité avec une seule virgule : par exemple 2 ou 2,5.',
    };
  }
  const unites = (m[1] || '0').replace(/^0+(?=\d)/, '');
  const decimales = m[2] || '';
  if (decimales.length > 3) {
    return { ok: false, milliemes: null, message: 'Une quantité s’écrit avec trois chiffres après la virgule au plus.' };
  }
  if (unites.length > 5) {
    return {
      ok: false, milliemes: null,
      message: 'Cette quantité est trop grande : au plus 99 999,999. Il y a sans doute un zéro de trop.',
    };
  }
  return { ok: true, milliemes: Number(`${unites}${decimales.padEnd(3, '0')}`), message: null };
}

/* Un entier en texte, les milliers séparés par une espace INSÉCABLE : un
   nombre ne se coupe pas en fin de ligne. */
const milliers = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

/** 2500 → « 2,5 » ; 1000 → « 1 » ; 1234500 → « 1 234,5 ». `null` pour ce qui n'est pas un entier. */
export function milliemesLisibles(q) {
  if (q == null || !Number.isInteger(Number(q))) return null;
  const v = Number(q);
  const signe = v < 0 ? '-' : '';
  const s = String(Math.abs(v)).padStart(4, '0');
  const decimales = s.slice(-3).replace(/0+$/, '');
  return `${signe}${milliers(s.slice(0, -3))}${decimales ? `,${decimales}` : ''}`;
}

/**
 * CE QU'ON RETAPE, pas ce qu'on imprime (étape 5, 22/10/2026) : un prix en
 * centimes remis dans son champ — 4500 → « 45 », 4550 → « 45,50 », sans
 * « € » ni séparateur de milliers, pour que `versCentimes` relise exactement
 * ce qu'il avait lu. L'AFFICHAGE d'un montant, lui, ne passe que par
 * `centimesLisibles` (le composant `Montant`). `''` pour ce qui n'est pas
 * un entier positif ou nul.
 */
export function centimesEnSaisie(c) {
  if (!entier(c) || c < 0) return '';
  const euros = Math.floor(c / 100);
  const reste = c % 100;
  return reste ? `${euros},${String(reste).padStart(2, '0')}` : String(euros);
}

/** Une quantité (ou une surface) en millièmes, remise dans son champ :
 *  2500 → « 2,5 », sans séparateur de milliers. `''` sinon. */
export function milliemesEnSaisie(q) {
  if (!entier(q) || q < 0) return '';
  const s = String(q).padStart(4, '0');
  const decimales = s.slice(-3).replace(/0+$/, '');
  return `${s.slice(0, -3).replace(/^0+(?=\d)/, '')}${decimales ? `,${decimales}` : ''}`;
}

/** Un taux en centièmes de point remis dans son champ : 500 → « 5 »,
 *  250 → « 2,5 ». `''` sinon. */
export function centiemesEnSaisie(c) {
  if (!entier(c) || c < 0) return '';
  const decimales = String(c % 100).padStart(2, '0').replace(/0+$/, '');
  return `${Math.floor(c / 100)}${decimales ? `,${decimales}` : ''}`;
}

/**
 * Un POURCENTAGE tapé → des centièmes de point : « 5 » → 500, « 2,5 » →
 * 250, « 0,01 » → 1, « 5 % » → 500. Deux décimales au plus ; un négatif
 * refusé ; vide → `null`. Ses messages parlent de pourcentage : la retenue
 * de garantie n'est pas un montant en euros, et `versCentimes` dirait
 * « écrivez un montant en euros ».
 */
export function versCentiemes(texte) {
  const brut = String(texte == null ? '' : texte).replace(ESPACES_TAPES, '').replace(/%$/, '');
  if (brut === '') return { ok: true, centiemes: null, message: null };
  if (brut.startsWith('-')) {
    return { ok: false, centiemes: null, message: 'Un pourcentage ne peut pas être négatif.' };
  }
  const m = brut.match(/^(\d+)(?:[.,](\d*))?$/);
  if (!m) {
    return {
      ok: false, centiemes: null,
      message: 'Écrivez un pourcentage avec une seule virgule : par exemple 5 ou 2,5.',
    };
  }
  const unites = m[1].replace(/^0+(?=\d)/, '');
  const decimales = m[2] || '';
  if (decimales.length > 2) {
    return { ok: false, centiemes: null, message: 'Un pourcentage s’écrit avec deux chiffres après la virgule au plus.' };
  }
  if (unites.length > 3) {
    return { ok: false, centiemes: null, message: 'Ce pourcentage est trop grand.' };
  }
  return { ok: true, centiemes: Number(`${unites}${decimales.padEnd(2, '0')}`), message: null };
}

/**
 * 550 → « 5,5 % », 2000 → « 20 % », 105 → « 1,05 % » — avec une espace
 * insécable avant « % ». **`0` → `null`** : « 0 % » ne s'affiche jamais.
 * Une ligne sans TVA ne dit pas « 0 % » ; en franchise, c'est la mention
 * `MENTION_FRANCHISE` qui parle, à la place de la TVA.
 */
export function tauxLisible(c) {
  if (!entier(c) || c <= 0) return null;
  const decimales = String(c % 100).padStart(2, '0').replace(/0+$/, '');
  return `${milliers(String(Math.floor(c / 100)))}${decimales ? `,${decimales}` : ''}\u00a0%`;
}

/** Un montant de devis, écrit pour être lu : c'est `centimesLisibles`,
 *  sous un second nom — une seule écriture des montants dans tout Opus. */
export const montantDevis = centimesLisibles;

/* ================================================================== */
/*  LES REFUS — les miroirs des contraintes de la base                  */
/* ================================================================== */

/**
 * La ligne telle que la BASE la rangerait : le miroir du déclencheur
 * `tient_la_ligne_de_devis()`. La désignation est rognée (un texte vide
 * devient `null`, et c'est la contrainte qui le refuse) ; le total est
 * POSÉ — 0 pour une ligne offerte, la valeur sinon, `null` pour un titre ;
 * une valeur de total envoyée est ignorée.
 */
export function nettoyerLigne(l) {
  const x = { ...(l || {}) };
  x.type = typeDe(x);
  x.designation = texteNet(x.designation);
  x.offert = vrai(x.offert);
  x.mainOeuvre = vrai(x.mainOeuvre);
  x.fournitureNonComprise = vrai(x.fournitureNonComprise);
  if (TYPES_CHIFFRES.includes(x.type)) {
    const t = totalSql(x.quantiteMilliemes, x.prixUnitaireCentimes);
    x.totalCentimes = t == null || !Number.isFinite(t) ? null : (x.offert ? 0 : t);
  } else {
    x.totalCentimes = null;
  }
  return x;
}

/* Le champ à montrer en rouge pour une ligne mal formée. */
function champDeLaForme(l, chiffree) {
  const prix = ['quantiteMilliemes', 'unite', 'prixUnitaireCentimes', 'tauxTvaCentiemes'];
  if (chiffree) {
    return prix.find((c) => !present(l[c]))
      || ['surfaceSolMilliemes', 'surfaceMursMilliemes'].find((c) => present(l[c])) || 'type';
  }
  return prix.find((c) => present(l[c]))
    || ['offert', 'mainOeuvre', 'fournitureNonComprise'].find((c) => l[c])
    || ['surfaceSolMilliemes', 'surfaceMursMilliemes'].find((c) => present(l[c])) || 'type';
}

/* Chaque contrainte, écrite comme en SQL — une contrainte `check` PASSE
   quand son expression vaut NULL, d'où les `is null or …` des deux côtés.
   Rend `null` si la règle passe, le champ fautif sinon. */
const REGLES_LIGNE = {
  devis_ligne_designation_check: (l) => (
    present(l.designation) && longueur(l.designation) <= LONGUEURS.designation ? null : 'designation'),
  devis_ligne_forme_check: (l) => {
    const chiffree = TYPES_CHIFFRES.includes(l.type);
    const titre = ['zone', 'piece', 'reserve'].includes(l.type);
    if (chiffree) {
      const ok = present(l.quantiteMilliemes) && present(l.unite) && present(l.prixUnitaireCentimes)
        && present(l.tauxTvaCentiemes) && !present(l.surfaceSolMilliemes) && !present(l.surfaceMursMilliemes);
      return ok ? null : champDeLaForme(l, true);
    }
    if (titre) {
      const ok = !present(l.quantiteMilliemes) && !present(l.unite) && !present(l.prixUnitaireCentimes)
        && !present(l.tauxTvaCentiemes) && !present(l.totalCentimes)
        && !l.offert && !l.mainOeuvre && !l.fournitureNonComprise
        && (l.type === 'piece' || (!present(l.surfaceSolMilliemes) && !present(l.surfaceMursMilliemes)));
      return ok ? null : champDeLaForme(l, false);
    }
    /* Un type inconnu passe ici : c'est `devis_ligne_type_check` qui le nomme. */
    return null;
  },
  /* « 0 seulement avec Offert » — et rien de plus : un prix NÉGATIF est
     l'affaire de `devis_ligne_prix_check`, qui dit « un prix ne peut pas
     être négatif ». Écrite `> 0`, cette règle volait le refus d'un prix
     négatif (elle passe avant dans l'alphabet) et lui opposait « un prix de
     0 s'écrit avec Offert » : prouvé sur PostgreSQL 16 le 21/10/2026. */
  devis_ligne_offert_check: (l) => (
    !present(l.prixUnitaireCentimes) || l.prixUnitaireCentimes !== 0 || l.offert ? null : 'prixUnitaireCentimes'),
  devis_ligne_prix_check: (l) => (
    !present(l.prixUnitaireCentimes)
      || (entier(l.prixUnitaireCentimes) && l.prixUnitaireCentimes >= 0 && l.prixUnitaireCentimes <= PRIX_MAX)
      ? null : 'prixUnitaireCentimes'),
  devis_ligne_quantite_check: (l) => (
    !present(l.quantiteMilliemes)
      || (entier(l.quantiteMilliemes) && l.quantiteMilliemes >= 1 && l.quantiteMilliemes <= QUANTITE_MAX)
      ? null : 'quantiteMilliemes'),
  devis_ligne_surfaces_check: (l) => ['surfaceSolMilliemes', 'surfaceMursMilliemes'].find((c) => (
    present(l[c]) && !(entier(l[c]) && l[c] >= 1 && l[c] <= SURFACE_MAX))) || null,
  devis_ligne_taux_check: (l) => (
    !present(l.tauxTvaCentiemes) || TAUX_TVA.includes(l.tauxTvaCentiemes) ? null : 'tauxTvaCentiemes'),
  /* Sur la VALEUR, même pour une ligne offerte : une valeur offerte au-delà
     du plafond est refusée, comme en base (C09e). */
  devis_ligne_total_check: (l) => {
    if (!TYPES_CHIFFRES.includes(l.type)) return null;
    return valeurLigne(l) != null ? null : 'prixUnitaireCentimes';
  },
  devis_ligne_type_check: (l) => (TYPES_LIGNE.includes(l.type) ? null : 'type'),
  devis_ligne_unite_check: (l) => (
    !present(l.unite) || UNITES.some((u) => u.cle === l.unite) ? null : 'unite'),
};

/**
 * Une ligne est-elle recevable ? `{ ok, contrainte, champ }`.
 *
 * `contrainte` est le NOM que la base citerait, testé dans l'ordre de
 * `CONTRAINTES_LIGNE` — l'ordre alphabétique, celui de PostgreSQL. La
 * PHRASE vient de `messageDeContrainte()` (`erreurs.js`) : une seule
 * écriture des phrases. `champ` est celui à montrer.
 */
export function validerLigne(l) {
  const x = nettoyerLigne(l);
  for (const nom of CONTRAINTES_LIGNE) {
    const champ = REGLES_LIGNE[nom](x);
    if (champ) return { ok: false, contrainte: nom, champ };
  }
  return { ok: true, contrainte: null, champ: null };
}

/**
 * Les espaces qu'on retire d'un code postal, en liste EXPLICITE : les
 * espaces ASCII, l'espace insécable (U+00A0) et l'espace fine insécable
 * (U+202F) — un « 13 410 » collé depuis un document mis en forme doit
 * passer, comme un montant dans `versCentimes`.
 *
 * Pourquoi pas `\s`, comme l'écrivait le cahier pour la base : ce que `\s`
 * retire dépend de la LOCALE du serveur. Mesuré sur PostgreSQL 16 (locale
 * C.UTF-8) le 21/10/2026 : il retire U+2002, U+3000, U+2028, U+1680, mais
 * garde U+00A0 et U+202F ; le `\s` de JavaScript fait autre chose encore.
 * « 13 410 » écrit avec U+2002 passait en base et était refusé ici. Une
 * règle écrite deux fois ne tient que si les deux disent EXACTEMENT la même
 * chose : la section 49 écrit cette même classe (`[ \t\n\v\f\r\u00a0\u202f]`),
 * et le contrôle les compare.
 */
export const ESPACES_CODE_POSTAL = ' \t\n\v\f\r\u00a0\u202f';
const ESPACES_CP = new RegExp(`[${ESPACES_CODE_POSTAL}]`, 'g');

/** Le devis tel que la base le rangerait : le miroir de `tient_le_devis()`
 *  pour ce que l'artisan écrit. */
export function nettoyerDevis(d) {
  const x = { ...(d || {}) };
  ['objet', 'lieuAdresse', 'lieuVille', 'delaiExecution'].forEach((c) => { x[c] = texteNet(x[c]); });
  const cp = String(x.lieuCodePostal == null ? '' : x.lieuCodePostal).replace(ESPACES_CP, '');
  x.lieuCodePostal = cp === '' ? null : cp;
  x.source = present(x.source) ? x.source : 'manuelle';
  x.statut = present(x.statut) ? x.statut : 'brouillon';
  return x;
}

const REGLES_DEVIS = {
  devis_delai_check: (d) => (!present(d.delaiExecution) || longueur(d.delaiExecution) <= LONGUEURS.delaiExecution
    ? null : 'delaiExecution'),
  devis_lieu_adresse_check: (d) => (!present(d.lieuAdresse) || longueur(d.lieuAdresse) <= LONGUEURS.lieuAdresse
    ? null : 'lieuAdresse'),
  devis_lieu_code_postal_check: (d) => (!present(d.lieuCodePostal) || /^[0-9]{5}$/.test(d.lieuCodePostal)
    ? null : 'lieuCodePostal'),
  devis_lieu_ville_check: (d) => (!present(d.lieuVille) || longueur(d.lieuVille) <= LONGUEURS.lieuVille
    ? null : 'lieuVille'),
  devis_objet_check: (d) => (!present(d.objet) || longueur(d.objet) <= LONGUEURS.objet ? null : 'objet'),
  devis_retenue_check: (d) => (!present(d.retenueGarantieCentiemes)
    || (entier(d.retenueGarantieCentiemes) && d.retenueGarantieCentiemes >= 1 && d.retenueGarantieCentiemes <= RETENUE_MAX)
    ? null : 'retenueGarantieCentiemes'),
  devis_source_check: (d) => (SOURCES.includes(d.source) ? null : 'source'),
  devis_statut_check: (d) => (STATUTS.includes(d.statut) ? null : 'statut'),
};

/** Un devis est-il recevable ? `{ ok, contrainte, champ }`, sur l'objet, le
 *  lieu, le délai, la retenue — dans l'ordre alphabétique des contraintes. */
export function validerDevis(d) {
  const x = nettoyerDevis(d);
  for (const nom of CONTRAINTES_DEVIS) {
    const regle = REGLES_DEVIS[nom];
    const champ = regle ? regle(x) : null;
    if (champ) return { ok: false, contrainte: nom, champ };
  }
  return { ok: true, contrainte: null, champ: null };
}

/* ================================================================== */
/*  RANGER LES LIGNES                                                   */
/* ================================================================== */

/* Deux identifiants se comparent comme PostgreSQL compare deux `uuid` :
   octet par octet, ce qui revient à comparer leurs chiffres hexadécimaux
   en minuscules. */
function comparerIds(a, b) {
  const x = String(a == null ? '' : a).toLowerCase();
  const y = String(b == null ? '' : b).toLowerCase();
  if (x < y) return -1;
  return x > y ? 1 : 0;
}

/**
 * LA seule façon de ranger des lignes : par `ordre`, PUIS par `id`.
 *
 * Le second critère n'est pas décoratif. Rien n'empêche deux lignes au même
 * `ordre` (deux appareils, une renumérotation interrompue), et sans lui
 * leur rang dépendrait de l'ordre où elles arrivent — différent entre
 * PostgREST et JavaScript, sans erreur. Une ligne serait alors rattachée à
 * une autre pièce selon l'écran qui la lit. `order('ordre').order('id')`
 * côté base, ceci côté écran.
 */
export function trierLignes(lignes) {
  /* Un ordre absent ou illisible range la ligne en fin, et deux lignes au
     même ordre — absent compris — se départagent par l'identifiant. */
  const rang = (l) => (Number.isFinite(Number(l.ordre)) && l.ordre !== null ? Number(l.ordre) : Infinity);
  return [...(lignes || [])].sort((a, b) => {
    const oa = rang(a);
    const ob = rang(b);
    if (oa !== ob) return oa < ob ? -1 : 1;
    return comparerIds(a.id, b.id);
  });
}

/* LA VENTILATION, écrite UNE fois et lue par les deux fonctions qui
   suivent : les POSTES seulement, groupés par taux, la base de chaque taux
   étant la somme des totaux de ses lignes (une ligne offerte compte 0, et
   son taux apparaît quand même, à base 0). Du taux le plus fort au plus
   faible. La TVA n'est pas encore posée : `poserLaTva` le fait, UNE fois
   par taux, sur la somme. */
function regrouperParTaux(tri) {
  const parTaux = new Map();
  for (const l of tri) {
    if (typeDe(l) !== 'poste') continue;
    const e = parTaux.get(l.tauxTvaCentiemes) || { taux: l.tauxTvaCentiemes, base: 0, tva: null, nbLignes: 0 };
    e.base += totalLigne(l);
    e.nbLignes += 1;
    parTaux.set(l.tauxTvaCentiemes, e);
  }
  return [...parTaux.values()].sort((a, b) => b.taux - a.taux);
}
function poserLaTva(ventilation) {
  for (const e of ventilation) e.tva = tvaDe(e.base, e.taux);
  return ventilation.every((e) => e.tva != null);
}

/**
 * La TVA, taux par taux : `[{ taux, base, tva, nbLignes }]`, du taux le plus
 * fort au plus faible. Les POSTES seulement — une option n'est pas
 * comprise —, et un taux présent sur une seule ligne offerte apparaît, à
 * base 0. La TVA est arrondie UNE fois par taux, sur la somme. `null` si une
 * ligne est irrecevable.
 */
export function ventilationParTaux(lignes) {
  const tri = trierLignes(lignes);
  if (!tri.every((l) => validerLigne(l).ok)) return null;
  const ventilation = regrouperParTaux(tri);
  return poserLaTva(ventilation) ? ventilation : null;
}

/**
 * Les totaux d'un devis : `{ ok: true, ht, tva, ttc, ventilation, options }`,
 * ou `{ ok: false, contrainte, champ, ligneId }`.
 *
 * Le HT est la somme des bases ; la TVA, la somme des TVA par taux ; le TTC,
 * les deux — des sommes d'entiers, aucun arrondi de plus. Refusé, comme par
 * `devis_plafond_check`, si le HT PUIS le TTC dépassent 99 999 999,99 €.
 *
 * LES OPTIONS NE SONT DANS AUCUN TOTAL, et cette fonction n'en rend aucun
 * total : une option de 33,33 € à 10 % coûte 36,66 € seule, mais ajoute
 * 36,67 € au devis (C05b). Le TTC « option comprise » se calcule en
 * appelant cette même fonction sur l'UNION des postes et de l'option —
 * jamais en additionnant deux totaux.
 */
export function totauxDevis(lignes) {
  const tri = trierLignes(lignes);
  for (const l of tri) {
    const v = validerLigne(l);
    if (!v.ok) return { ok: false, contrainte: v.contrainte, champ: v.champ, ligneId: l.id ?? null };
  }
  const ventilation = regrouperParTaux(tri);
  const ht = ventilation.reduce((s, e) => s + e.base, 0);
  /* Le HT d'abord : sous le plafond, chaque base × taux reste un entier exact. */
  if (ht > PLAFOND) return { ok: false, contrainte: 'devis_plafond_check', champ: null, ligneId: null };
  poserLaTva(ventilation);
  const tva = ventilation.reduce((s, e) => s + e.tva, 0);
  const ttc = ht + tva;
  if (ttc > PLAFOND) return { ok: false, contrainte: 'devis_plafond_check', champ: null, ligneId: null };
  const options = tri.filter((l) => l.type === 'option').map((l) => ({
    id: l.id ?? null, designation: l.designation ?? null, total: totalLigne(l), taux: l.tauxTvaCentiemes,
  }));
  return { ok: true, ht, tva, ttc, ventilation, options };
}

/* Le niveau d'un titre : une zone contient des pièces, une pièce des lignes. */
const NIVEAU = { zone: 1, piece: 2 };

/* La fin de ce qu'emporte un titre : le prochain titre de même niveau ou
   de niveau supérieur (une zone arrête une pièce ; une pièce n'arrête pas
   une zone). */
function etendue(tri, i) {
  const niveau = NIVEAU[tri[i].type];
  let fin = i + 1;
  while (fin < tri.length && !(NIVEAU[tri[fin].type] && NIVEAU[tri[fin].type] <= niveau)) fin += 1;
  return fin;
}

/**
 * Le sous-total de chaque titre de zone et de pièce : `{ [id]: centimes }`,
 * la somme des POSTES qui le suivent jusqu'au titre suivant de même niveau
 * ou de niveau supérieur. Une option n'y entre pas (elle n'est pas
 * comprise) ; une ligne irrecevable rend le sous-total `null` plutôt
 * qu'une somme qui l'oublierait en silence. Jamais en TTC : la TVA vit par
 * taux, pas par pièce.
 */
export function sousTotaux(lignes) {
  const tri = trierLignes(lignes);
  const res = {};
  tri.forEach((t, i) => {
    if (!NIVEAU[t.type]) return;
    let somme = 0;
    const fin = etendue(tri, i);
    for (let j = i + 1; j < fin; j += 1) {
      const l = tri[j];
      if (typeDe(l) !== 'poste') continue;
      const total = totalLigne(l);
      if (total == null) { somme = null; break; }
      somme += total;
    }
    res[t.id] = somme;
  });
  return res;
}

/**
 * Les lignes qu'emporte un titre — pour la phrase de « Retirer » (« Les 4
 * lignes de cette pièce passeront dans… ») et pour « Retirer la pièce et
 * ses lignes ». Les OPTIONS n'en font pas partie : l'écran les montre à
 * part, sous « Options, non comprises », et l'artisan ne les a pas vues
 * dans la pièce — les retirer avec elle serait une surprise.
 */
export function lignesDeLaPiece(lignes, idTitre) {
  const tri = trierLignes(lignes);
  const i = tri.findIndex((l) => l.id === idTitre);
  if (i < 0 || !NIVEAU[tri[i].type]) return [];
  return tri.slice(i + 1, etendue(tri, i)).filter((l) => l.type !== 'option');
}

/**
 * Le titre qui RECEVRA les lignes d'un titre qu'on retire : le titre de même
 * niveau qui le précède — pour une pièce, seulement s'il n'y a pas de zone
 * entre les deux (sinon ses lignes restent dans leur zone, sans pièce).
 * `null` quand personne ne les reçoit.
 */
export function titreQuiRecoit(lignes, idTitre) {
  const tri = trierLignes(lignes);
  const i = tri.findIndex((l) => l.id === idTitre);
  if (i < 0 || !NIVEAU[tri[i].type]) return null;
  const niveau = NIVEAU[tri[i].type];
  for (let j = i - 1; j >= 0; j -= 1) {
    const n = NIVEAU[tri[j].type];
    if (!n) continue;
    if (n === niveau) return tri[j];
    if (n < niveau) return null;
  }
  return null;
}

/**
 * La PIÈCE qui contient une ligne (le titre `piece` dont elle fait partie),
 * ou `null`. C'est elle qui donne à la carte d'une ligne son titre et son
 * sous-total en tête, et ses surfaces aux deux appuis « Sol » / « Murs ».
 */
export function pieceDeLaLigne(lignes, id) {
  const tri = trierLignes(lignes);
  const i = tri.findIndex((l) => l.id === id);
  if (i < 0) return null;
  for (let j = i - 1; j >= 0; j -= 1) {
    if (tri[j].type === 'piece') return lignesDeLaPiece(tri, tri[j].id).some((l) => l.id === id) ? tri[j] : null;
    if (tri[j].type === 'zone') return null;
  }
  return null;
}

/**
 * Une ligne NEUVE dont on n'a rien écrit : aucune désignation, aucun
 * nombre, aucun interrupteur. Fermer sa carte la fait disparaître sans un
 * mot — elle n'a jamais rien été. Une ligne à moitié écrite, elle, reste
 * « incomplète », et la garde de sortie le dit.
 */
export function ligneVierge(l) {
  if (!l) return true;
  return !texteNet(l.designation)
    && ['quantiteMilliemes', 'unite', 'prixUnitaireCentimes', 'surfaceSolMilliemes', 'surfaceMursMilliemes']
      .every((c) => !present(l[c]))
    && !vrai(l.offert) && !vrai(l.mainOeuvre) && !vrai(l.fournitureNonComprise);
}

/** Ce qu'une rangée de la LISTE du devis reçoit — et rien d'autre. */
export const PROPRIETES_DE_LA_RANGEE = Object.freeze([
  'id', 'type', 'designation', 'total', 'offert', 'fournitureNonComprise', 'quantite', 'unite', 'prix', 'sousTotal',
  'etat', 'erreurTexte', 'incomplete',
]);

/**
 * CE QU'UNE RANGÉE DE LA LISTE DU DEVIS AFFICHE, calculé ICI pour que
 * `verifier-postes` le fasse tourner (lot P, corrections « écran »,
 * 24/10/2026) : la ligne telle qu'elle IRA AU CLIENT — sa phrase, mot pour
 * mot, sa quantité, son prix, son total —, son état d'enregistrement, et
 * rien d'autre.
 *
 * Elle ne reçoit PAS la base de postes, et c'est la réponse du propriétaire
 * du 23/10 (Q3 a) : la liste est l'écran qu'on montre à un client ; la
 * référence, l'écart, « réf. » ne vivent que dans la carte ouverte en grand.
 * La relecture « écran » l'a cassé en une ligne — la phrase de référence
 * ajoutée à `designation` dans la balise de la rangée — sans qu'un contrôle
 * rougisse : il cherchait des NOMS dans la balise, pas ce qui coulait dans
 * la désignation. La rangée reçoit désormais CE QUE REND cette fonction, en
 * entier et seul.
 *   - `sousTotaux` : `sousTotaux(lignes)`, pour une zone ou une pièce ;
 *   - `etats`, `erreurs`, `phrasesEchec` : par identifiant, ceux de la
 *     saisie (`'en_cours'`, `'echec'`, `'locale'`…).
 */
export function proprietesDeLaRangee(l, {
  sousTotaux: sous = {}, etats = {}, erreurs = {}, phrasesEchec = {},
} = {}) {
  const etat = (etats && etats[l.id]) || null;
  return {
    id: l.id,
    type: l.type,
    designation: l.designation,
    total: totalLigne(l),
    offert: !!l.offert,
    fournitureNonComprise: !!l.fournitureNonComprise,
    quantite: l.quantiteMilliemes,
    unite: l.unite,
    prix: l.prixUnitaireCentimes,
    sousTotal: NIVEAU[l.type] && sous ? (sous[l.id] ?? null) : null,
    etat,
    erreurTexte: etat === 'echec' ? ((phrasesEchec && phrasesEchec[l.id]) || null) : null,
    incomplete: !!(erreurs && erreurs[l.id]) || etat === 'locale',
  };
}

/* Le plus grand `ordre` qu'une colonne `integer` accepte. */
const ORDRE_MAX = 2_147_483_647;
/** Le pas entre deux lignes, à la création et à la renumérotation. */
export const PAS_ORDRE = 1000;

/**
 * L'ordre d'une ligne posée entre deux autres : l'entier au milieu, ou
 * `null` quand il n'y a plus de place — il faut alors renuméroter. `avant`
 * à `null` : en tête ; `apres` à `null` : en fin.
 */
export function ordreEntre(avant, apres) {
  if (avant == null && apres == null) return PAS_ORDRE;
  if (apres == null) return avant + PAS_ORDRE <= ORDRE_MAX ? avant + PAS_ORDRE : null;
  const bas = avant == null ? 0 : avant;
  const milieu = Math.floor((bas + apres) / 2);
  return milieu > bas && milieu < apres ? milieu : null;
}

/** Les ordres refaits de 1 000 en 1 000, dans l'ordre de `trierLignes()` :
 *  `[{ id, ordre }]`. */
export function renumeroter(lignes) {
  return trierLignes(lignes).map((l, i) => ({ id: l.id, ordre: (i + 1) * PAS_ORDRE }));
}

/* Les voisines d'une ligne À L'ÉCRAN : une option se déplace parmi les
   options, une autre ligne parmi les autres — les options vivent à part. */
function voisines(lignes, id) {
  const tri = trierLignes(lignes);
  const l = tri.find((x) => x.id === id);
  if (!l) return { liste: [], i: -1 };
  const liste = tri.filter((x) => (x.type === 'option') === (l.type === 'option'));
  return { liste, i: liste.findIndex((x) => x.id === id) };
}

/**
 * « Monter » : le nouvel ordre d'une ligne, posée juste au-dessus de sa
 * voisine — `{ ordre }`, `{ renumeroter: true }` s'il n'y a plus de place,
 * ou `null` si elle est déjà en tête. Pas de glisser-déposer : un geste de
 * plus, concurrent du défilement, qui ne se juge qu'au doigt.
 */
export function monter(lignes, id) {
  const { liste, i } = voisines(lignes, id);
  if (i <= 0) return null;
  const o = ordreEntre(i >= 2 ? liste[i - 2].ordre : null, liste[i - 1].ordre);
  return o == null ? { renumeroter: true } : { ordre: o };
}

/** « Descendre » : juste au-dessous de sa voisine. Même forme que `monter`. */
export function descendre(lignes, id) {
  const { liste, i } = voisines(lignes, id);
  if (i < 0 || i >= liste.length - 1) return null;
  const o = ordreEntre(liste[i + 1].ordre, i + 2 < liste.length ? liste[i + 2].ordre : null);
  return o == null ? { renumeroter: true } : { ordre: o };
}

/* ================================================================== */
/*  LA MÉMOIRE — les prix déjà écrits, jamais une moyenne               */
/* ================================================================== */

/* Le plus récent d'abord : `modifieLe`, puis `id`. */
function horodatage(v) {
  const iso = isoLisible(v);
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}
function plusRecentDAbord(a, b) {
  const d = horodatage(b.modifieLe) - horodatage(a.modifieLe);
  if (d !== 0 && Number.isFinite(d)) return d;
  return comparerIds(a.id, b.id);
}

/**
 * Ce que l'artisan a déjà écrit, à proposer quand il tape une désignation.
 *
 * `lignes` sont les lignes de SES devis (la base les filtre), chacune avec
 * son devis d'origine (`devis: { id, objet, modifieLe }`). On garde les
 * postes et les options que le texte tapé TROUVE (`correspondALaRecherche`,
 * plus bas), jamais un titre ni une réserve, jamais la ligne en cours
 * (`idLigne`), jamais une phrase dont la clé est vide (« — », un U+200B).
 *
 * Elles sont GROUPÉES par `cleDeLigne` : (clé de rapprochement, unité,
 * fourniture non comprise). Une même phrase au m² et au forfait, ou avec et
 * sans fourniture, n'a pas le même prix — deux groupes. Mais « Seuil de
 * porte » et « Seuils de porte », « Chape sèche » et « chape seche », c'est
 * la MÊME phrase écrite deux fois : UN groupe. C'est la réponse du
 * propriétaire du 23/10 (lot P) : « il ne faut pas qu'il y ait trop de
 * propositions, ça pourrait nous perdre ».
 *
 * La mémoire rend donc UNE PROPOSITION PAR GROUPE, titrée par la phrase de
 * sa ligne la plus RÉCENTE — mot pour mot, jamais la clé, qui ne s'affiche
 * nulle part. Elle porte `prix` : les TROIS derniers prix UTILISABLES
 * différents (un entier > 0, la valeur d'une ligne offerte comprise ; une
 * ligne SANS prix ne compte pas, sinon l'artisan qui écrit ses phrases
 * d'abord perdrait le prix d'hier), chacun avec son devis d'origine. Le
 * premier est celui qu'un appui recopie. 50 € et 70 € font une proposition
 * qui porte les deux, jamais 60 € : **aucune moyenne, aucune médiane, aucun
 * minimum, aucun maximum** — un prix que personne n'a écrit n'a rien à faire
 * dans un devis.
 *
 * Une proposition : `{ cle, ligneId, modifieLe, designation, unite,
 * fournitureNonComprise, mainOeuvre, origine, prix: [{ prixUnitaireCentimes,
 * offert, ligneId, modifieLe, origine }], prixUnitaireCentimes, offert }` —
 * `ligneId` et `modifieLe` sont ceux de la ligne la plus récente (le dernier
 * usage) ; `prixUnitaireCentimes`, `offert` et `origine` sont ceux de
 * `prix[0]`, ou `null`, `false` et l'origine de la ligne la plus récente
 * quand aucun prix n'est utilisable. Les propositions se rangent par
 * `degreDeCorrespondance`, puis la plus récente d'abord. Ce qu'un appui
 * RECOPIE : `valeursDeLaSuggestion()`.
 */
/* Les mots de l'objet d'un devis qu'on montre sous une suggestion : quatre au
   plus, puis « … ». */
const MOTS_ORIGINE = 4;

/**
 * D'OÙ VIENT UNE SUGGESTION — ce qu'on en montre SOUS LE CHAMP, pendant
 * qu'on chiffre le devis d'un AUTRE client, peut-être devant lui.
 *
 * L'objet d'un devis ouvert depuis une DEMANDE ou une URGENCE, c'est le texte
 * que le particulier a écrit lui-même (« fuite chez moi au 4 rue …, code de
 * la porte … »), sans limite de longueur : il ne doit JAMAIS sortir de ses
 * devis (relecture « données » des étapes 4 à 7, I5). Une telle origine se
 * nomme par sa DATE — « votre devis du 12/10/2026 ». L'objet d'un devis que
 * l'artisan a ouvert LUI-MÊME (`manuelle`) se montre, réduit à quelques mots :
 * c'est son étiquette de travail. Une source inconnue (une ligne lue sans
 * elle) se traite comme une demande : dans le doute, on se tait.
 *
 * TRANCHÉ ICI, à confirmer avec le propriétaire : le cahier dit « avec leur
 * devis d'origine », sans dire comment le nommer.
 */
export function origineDeSuggestion(d) {
  const date = dateFrancaise(d && d.modifieLe);
  const objet = d && d.source === 'manuelle' ? texteNet(d.objet) : null;
  let court = null;
  if (objet) {
    const mots = objet.split(/\s+/);
    court = mots.length > MOTS_ORIGINE ? `${mots.slice(0, MOTS_ORIGINE).join(' ')}…` : objet;
  }
  return {
    devisId: (d && d.id) ?? null,
    objet: court,
    date,
    libelle: court || (date ? `votre devis du ${date}` : 'un de vos devis'),
  };
}

/* ------------------------------------------------------------------ */
/*  LA CLÉ D'UNE LIGNE, ET LA RECHERCHE PAR MOTS (lot P)                */
/* ------------------------------------------------------------------ */

/* Ce que la recherche sait d'une phrase : sa forme à plat (sans casse, sans
   accents, sans ponctuation — le pluriel encore là), les mots de cette
   forme, et les mots de sa CLÉ (le pluriel retiré). Deux passages par la table de
   `rapprochement.js`, et c'est tout ce qu'une phrase coûte. */
const motsDe = (s) => (s || '').split(' ').filter(Boolean);
function formesDe(phrase) {
  const plat = aPlat(phrase) || '';
  const cle = cleDeRapprochement(phrase);
  return { plat, motsPlat: motsDe(plat), cle, motsCle: new Set(motsDe(cle)) };
}
/* Le texte TAPÉ, préparé une fois par recherche : ses mots à plat, et la
   clé de chacun (le même mot privé de son pluriel). */
function tapeDe(texte) {
  const t = aPlat(texte) || '';
  const mots = motsDe(t);
  return { t, mots, cles: mots.map((w) => cleDeRapprochement(w) || '') };
}

/* LES CLÉS SE CALCULENT UNE FOIS (cahier du lot P, §3.1). La mémoire est
   fouillée à chaque frappe — 500 lignes, deux passages par la table chacune
   — et la base de postes recalcule la clé de chaque ligne de mémoire pour
   dater son dernier usage. Le cache vit sur CHAQUE LIGNE (un `WeakMap`, qui
   s'oublie avec elle), et pas sur le tableau : l'écran reconstruit le
   tableau de la mémoire à chaque ligne enregistrée, alors que les lignes
   lues de la base, elles, restent les mêmes objets. Et il se VÉRIFIE à
   chaque lecture : une phrase, une unité ou une fourniture qui a changé
   sur le même objet recalcule tout — une clé périmée rapprocherait une
   ligne d'un poste qui n'est plus le sien, sans un mot. */
const PREPAREES = new WeakMap();
function preparee(l) {
  const d = l.designation;
  const u = l.unite;
  const f = l.fournitureNonComprise;
  const deja = PREPAREES.get(l);
  if (deja && deja.d === d && deja.u === u && deja.f === f) return deja;
  const net = texteNet(d);
  const brutes = formesDe(d);
  const nettes = net === d ? brutes : formesDe(net);
  const p = { d, u, f, net, brutes, nettes, cle: JSON.stringify([nettes.cle, u ?? null, vrai(f)]) };
  PREPAREES.set(l, p);
  return p;
}

/** La clé d'une ligne ou d'un poste : (clé de rapprochement de la phrase,
 *  unité, fourniture non comprise). C'est elle qui regroupe la mémoire et
 *  qui reconnaît un poste de la base : une règle, un endroit. La phrase,
 *  elle, reste rangée mot pour mot — la clé ne s'affiche nulle part. */
export function cleDeLigne(l) {
  if (l !== null && typeof l === 'object') return preparee(l).cle;
  return JSON.stringify([cleDeRapprochement(texteNet(l && l.designation)), (l && l.unite) ?? null, vrai(l && l.fournitureNonComprise)]);
}

function correspond(f, tape) {
  if (tape.mots.length === 0) return false;
  return tape.mots.every((w, i) => {
    if (f.plat.includes(w)) return true;
    const k = tape.cles[i];
    return k !== w && (k.length >= 3 || tape.mots.length > 1) && f.motsCle.has(k);
  });
}
function degre(f, tape) {
  if (!correspond(f, tape)) return 0;
  if (f.plat.startsWith(tape.t)) return 4;
  if (tape.mots.every((w) => f.motsPlat.some((m) => m.startsWith(w)))) return 3;
  if (tape.mots.every((w) => f.plat.includes(w))) return 2;
  return 1;
}

/** Le texte tapé TROUVE-t-il cette phrase ? Chaque mot tapé, dans n'importe
 *  quel ordre, doit être CONTENU dans la phrase à plat — exactement la
 *  recherche du lot 1, donc rien de ce qu'on trouvait n'est perdu —, ou,
 *  privé de son pluriel, être un MOT ENTIER de la clé de la phrase, pourvu
 *  que cette clé ait trois lettres au moins ou que le texte tapé ait
 *  plusieurs mots. « Dalles » trouve « Dalle béton », « seche chape »
 *  trouve « Chape sèche » ; « Les » ne trouve que ce qui CONTIENT « les » :
 *  sa clé, `le`, est dans presque toutes les phrases, et trois propositions
 *  sans rapport perdraient l'artisan (mesuré par le cahier du lot P, X-6). */
export function correspondALaRecherche(designation, texte) {
  return correspond(formesDe(designation), tapeDe(texte));
}
/** Le degré de pertinence, pour ranger les propositions : 4, la phrase à
 *  plat COMMENCE par le texte tapé ; 3, chaque mot tapé commence un mot de
 *  la phrase ; 2, chaque mot tapé y est contenu ; 1, trouvée par le pluriel
 *  seulement ; 0, non trouvée. « Pos » met « Pose de… » (4) devant
 *  « Dépose de… » (2). */
export function degreDeCorrespondance(designation, texte) {
  return degre(formesDe(designation), tapeDe(texte));
}

/* Un prix qu'un appui peut recopier : un entier > 0 (la valeur d'une ligne
   offerte comprise). Une ligne sans prix, ou offerte à 0, n'en porte pas. */
const prixUtilisable = (l) => entier(l.prixUnitaireCentimes) && l.prixUnitaireCentimes > 0;
export function memoireDesLignes(lignes, texte, { idLigne = null } = {}) {
  const tape = tapeDe(texte);
  if (tape.mots.length === 0) return [];
  const retenues = (lignes || [])
    .filter((l) => TYPES_CHIFFRES.includes(typeDe(l)))
    .filter((l) => l.id !== idLigne)
    .filter((l) => {
      const p = preparee(l);
      return !!p.net && !!p.nettes.cle && correspond(p.brutes, tape);
    })
    .sort(plusRecentDAbord);
  const groupes = new Map();
  /* Le degré d'une proposition, calculé UNE fois, sur la phrase qui la
     titre — et non à chaque comparaison du tri. */
  const degres = new Map();
  for (const l of retenues) {
    const p = preparee(l);
    let g = groupes.get(p.cle);
    if (!g) {
      g = {
        cle: p.cle, ligneId: l.id ?? null, modifieLe: l.modifieLe ?? null, designation: p.net,
        unite: l.unite ?? null, fournitureNonComprise: vrai(l.fournitureNonComprise), mainOeuvre: vrai(l.mainOeuvre),
        origine: origineDeSuggestion(l.devis), prix: [], prixUnitaireCentimes: null, offert: false,
      };
      groupes.set(p.cle, g);
      degres.set(g, degre(p.nettes, tape));
    }
    if (prixUtilisable(l) && g.prix.length < 3 && !g.prix.some((x) => x.prixUnitaireCentimes === l.prixUnitaireCentimes)) {
      g.prix.push({
        prixUnitaireCentimes: l.prixUnitaireCentimes, offert: vrai(l.offert), ligneId: l.id ?? null,
        modifieLe: l.modifieLe ?? null, origine: origineDeSuggestion(l.devis),
      });
    }
  }
  /* Le prix qu'un appui recopie est le plus récent des prix UTILISABLES —
     jamais une ligne sans prix, même plus récente. */
  for (const g of groupes.values()) {
    if (g.prix.length > 0) {
      g.prixUnitaireCentimes = g.prix[0].prixUnitaireCentimes;
      g.offert = g.prix[0].offert;
      g.origine = g.prix[0].origine;
    }
  }
  return [...groupes.values()].sort((a, b) => degres.get(b) - degres.get(a)
    || plusRecentDAbord({ modifieLe: a.modifieLe, id: a.ligneId }, { modifieLe: b.modifieLe, id: b.ligneId }));
}

/**
 * Ce qu'un appui sur une suggestion RECOPIE dans la ligne : la phrase,
 * l'unité, le prix, la fourniture non comprise et la main-d'œuvre.
 *
 * JAMAIS « Offert » — offrir est une décision de CE devis — ni la quantité,
 * qui dépend du chantier. D'une ligne offerte, on recopie la VALEUR qu'elle
 * portait ; une ligne offerte sans valeur (0) ne recopie aucun prix : un 0
 * sans « Offert » serait refusé.
 */
export function valeursDeLaSuggestion(s) {
  if (!s) return null;
  const prix = s.prixUnitaireCentimes;
  return {
    designation: s.designation,
    unite: s.unite,
    prixUnitaireCentimes: entier(prix) && prix > 0 ? prix : null,
    fournitureNonComprise: vrai(s.fournitureNonComprise),
    mainOeuvre: vrai(s.mainOeuvre),
  };
}

/* ================================================================== */
/*  OUVRIR UN DEVIS — depuis un client, depuis une demande              */
/* ================================================================== */

/**
 * « Faire un devis » sur la fiche d'un client : la fiche est rattachée, et
 * son adresse PROPOSÉE comme lieu des travaux — une copie, modifiable : le
 * chantier est souvent ailleurs que la facturation.
 */
export function devisDepuisClient(c) {
  if (!c || !c.id) return null;
  return {
    source: 'manuelle',
    clientId: c.id,
    lieuAdresse: texteNet(c.adresse),
    lieuCodePostal: texteNet(c.codePostal),
    lieuVille: texteNet(c.ville),
  };
}

/**
 * « Faire un devis » sur une demande acceptée : le lien d'origine et la
 * DESCRIPTION seulement (`PLAN-DEVIS` §10.7). Ni client, ni lieu : le client
 * d'une demande est un COMPTE, et le client d'un devis une FICHE du carnet
 * (D1) — l'artisan la choisit, ou la crée. `null` pour un rappel, qui n'a
 * pas de lien d'origine.
 */
/* La description d'une demande devient l'OBJET du brouillon : elle n'a pas de
   limite de longueur (le formulaire du particulier n'en pose pas), l'objet en
   a une (`devis_objet_check`, 1 000 caractères). Au-delà, le brouillon ne se
   créait pas, et toutes ses lignes passaient en échec (relecture « données »
   des étapes 4 à 7, I5) : on la coupe à la borne, au caractère près — comme
   la base les compte. */
const objetDeDemande = (titre) => {
  const net = texteNet(titre);
  if (!net) return net;
  const c = [...net];
  return c.length > LONGUEURS.objet ? `${c.slice(0, LONGUEURS.objet - 1).join('')}…` : net;
};

export function devisDepuisDemande(d) {
  if (!d || !d.id) return null;
  if (d.genre === 'devis') return { source: 'demande', quoteRequestId: d.id, objet: objetDeDemande(d.titre) };
  if (d.genre === 'sos') return { source: 'urgence', sosRequestId: d.id, objet: objetDeDemande(d.titre) };
  return null;
}

/* Les statuts qui ouvrent « Faire un devis », dans l'orthographe de CHAQUE
   table : `quote_requests` écrit `accepte`, `sos_requests` accorde son
   participe (`acceptee`) — on LIT la seconde telle qu'elle est rangée. */
const STATUTS_QUI_OUVRENT = Object.freeze({
  devis: Object.freeze(['accepte', 'termine']),
  sos: Object.freeze(['acceptee', 'termine']),
});

/** Une demande reçue permet-elle « Faire un devis » ? Une demande de devis
 *  ou une urgence, acceptée ou terminée. Jamais un rappel. */
export function peutFaireUnDevis(d) {
  if (!d) return false;
  const statuts = STATUTS_QUI_OUVRENT[d.genre];
  return Boolean(statuts && statuts.includes(d.statut));
}

/* ================================================================== */
/*  LES DATES — à l'heure du téléphone                                  */
/* ================================================================== */

/**
 * « depuis une demande du 15/09/2026 » / « depuis une urgence du … » ;
 * « depuis une demande » quand le lien est devenu vide (la demande a été
 * effacée — `source` garde le geste, D3) ; `null` pour un devis ouvert à
 * la main. La date de la demande (`devis.demande.createdAt`,
 * `devis.urgence.createdAt`) passe par `dateFrancaise()`.
 */
export function origineLisible(devis) {
  if (!devis) return null;
  if (devis.source === 'demande') {
    const date = devis.quoteRequestId && devis.demande ? dateFrancaise(devis.demande.createdAt) : null;
    return date ? `depuis une demande du ${date}` : 'depuis une demande';
  }
  if (devis.source === 'urgence') {
    const date = devis.sosRequestId && devis.urgence ? dateFrancaise(devis.urgence.createdAt) : null;
    return date ? `depuis une urgence du ${date}` : 'depuis une urgence';
  }
  return null;
}

/* Le jour CALENDAIRE, à l'heure du téléphone. */
const jourLocal = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * « à l'instant », « il y a 5 min », « il y a 2 h », « hier », puis la date
 * (`dateFrancaise()`). Les heures ne se comptent que DANS LA JOURNÉE : à
 * 0 h 30, une écriture de 23 h la veille est « hier », pas « il y a 1 h ».
 * L'horodatage passe par `isoLisible()` AVANT `Date.parse` : Hermes, le
 * moteur de l'iPhone, est plus strict que `node`. `maintenant` est un
 * paramètre, pour que le contrôle le fasse tourner à une heure choisie.
 */
export function depuisLisible(iso, maintenant = Date.now()) {
  const lisible = isoLisible(iso);
  const t = lisible ? Date.parse(lisible) : NaN;
  if (!Number.isFinite(t)) return dateFrancaise(iso);
  const m = maintenant instanceof Date ? maintenant.getTime() : Number(maintenant);
  const ecart = m - t;
  if (ecart < 60_000) return 'à l’instant';
  if (ecart < 3_600_000) return `il y a ${Math.floor(ecart / 60_000)}\u00a0min`;
  if (jourLocal(t) === jourLocal(m)) return `il y a ${Math.floor(ecart / 3_600_000)}\u00a0h`;
  const veille = new Date(m);
  veille.setDate(veille.getDate() - 1);
  if (jourLocal(t) === jourLocal(veille.getTime())) return 'hier';
  return dateFrancaise(iso);
}

/**
 * « Mes devis », dans l'ordre : le plus récemment modifié d'abord, puis par
 * `id`. UN SEUL statut existe au lot 1 : trier par date est honnête. Le
 * jour où un second existe, ce qui attend passe devant — et
 * `verifier-devis` l'exigera.
 */
export function trierDevis(liste) {
  return [...(liste || [])].sort((a, b) => {
    const d = horodatage(b.modifieLe) - horodatage(a.modifieLe);
    if (d !== 0 && Number.isFinite(d)) return d;
    return comparerIds(a.id, b.id);
  });
}

/**
 * LA BORNE DE « MES DEVIS », écrite UNE fois : la lecture demande
 * `PLAFOND_LISTE + 1` devis, DÉJÀ TRIÉS (la base par `modifie_le` puis `id`,
 * la démonstration par `trierDevis`) ; on en garde `PLAFOND_LISTE`, et
 * `tronque` dit qu'il en existait d'autres. La Supabase et la démonstration
 * passent toutes deux par ici — et `verifier-devis` la FAIT TOURNER sur 201
 * devis : le pied « Les plus anciens ne sont pas affichés » n'était tenu par
 * rien qui la fasse tourner (relecture « conformité » des étapes 4 à 7, I3).
 */
export function decouperListe(lus) {
  const liste = Array.isArray(lus) ? lus : [];
  return { devis: liste.slice(0, PLAFOND_LISTE), tronque: liste.length > PLAFOND_LISTE };
}

/* ================================================================== */
/*  LE RÉGIME DE TVA — cinq états, et un échec n'est jamais « non déclaré » */
/* ================================================================== */

/*
 * L'état du régime, tel que l'écran le tient :
 *   - `'franchise'` ou `'reel'` : déclaré ;
 *   - `null` : lu, et NON DÉCLARÉ ;
 *   - `{ chargement: true }` : en cours de lecture ;
 *   - `{ echec: true }` : la lecture a échoué.
 * Tout ce qui n'est pas l'un des trois premiers — `undefined` compris — est
 * « on ne sait pas » : on ne juge pas ce qu'on n'a pas pu lire, et on ne
 * dit jamais « non déclaré » d'un régime qu'on n'a pas lu.
 */
function regimeConnu(etat) {
  if (etat === 'franchise' || etat === 'reel') return etat;
  if (etat === null) return 'non_declare';
  return null;
}

/**
 * Les lignes contredisent-elles le régime ? `null` si tout va bien OU si le
 * régime n'est pas connu ; sinon une phrase. RIEN n'est corrigé tout seul :
 * un taux changé en silence est une TVA fausse sur un devis.
 */
export function coherenceRegime(lignes, etatRegime) {
  const regime = regimeConnu(etatRegime);
  if (!regime) return null;
  const chiffrees = (lignes || []).filter((l) => TYPES_CHIFFRES.includes(typeDe(l)));
  if (!chiffrees.length) return null;
  if (regime === 'non_declare') {
    return 'Votre régime de TVA n’est pas déclaré : ce devis porte des lignes chiffrées, mais Opus ne '
      + 'sait pas s’il faut y ajouter la TVA. Déclarez-le dans « Mon entreprise ».';
  }
  /* Une ligne sans taux encore (incomplète, pas enregistrée) ne contredit rien. */
  if (regime === 'franchise' && chiffrees.some((l) => present(l.tauxTvaCentiemes) && l.tauxTvaCentiemes !== 0)) {
    return 'Vous êtes déclaré en franchise de TVA, mais des lignes portent un taux de TVA : en franchise, '
      + 'vous n’en facturez pas. Corrigez ces lignes, ou votre régime dans « Mon entreprise ».';
  }
  if (regime === 'reel' && chiffrees.some((l) => l.tauxTvaCentiemes === 0)) {
    return 'Vous êtes déclaré au régime réel de TVA, mais des lignes n’ont pas de taux : choisissez '
      + '20\u00a0%, 10\u00a0% ou 5,5\u00a0% sur chacune. Ou corrigez votre régime dans « Mon entreprise ».';
  }
  return null;
}

/**
 * Les taux que l'écran PROPOSE : en franchise `[0]` (aucun choix montré) ;
 * au régime réel `[2000, 1000, 550]` (rien de coché d'avance sur la
 * première ligne) ; non déclaré `[]` (aucune ligne chiffrée) ; et `null`
 * quand le régime est en lecture ou en échec — « on ne sait pas », distinct
 * de `[]` : sinon un artisan en franchise verrait, le temps d'une lecture,
 * les taux du régime réel.
 */
export function tauxProposes(etatRegime) {
  const regime = regimeConnu(etatRegime);
  if (regime === 'franchise') return [0];
  if (regime === 'reel') return [2000, 1000, 550];
  if (regime === 'non_declare') return [];
  return null;
}

/* Les tarifs, tels que l'écran les tient (`mesTarifs`) : la ligne de
   `tarifs_pro`, `null` si l'artisan n'en a pas, `{ chargement }` ou
   `{ echec }`. Tout autre chose est « on ne sait pas ». */
function tarifsConnus(etat) {
  if (etat === null) return { ligne: null };
  if (etat && typeof etat === 'object' && !etat.chargement && !etat.echec) return { ligne: etat };
  return null;
}

/**
 * Le taux horaire déclaré dans « Mon entreprise » (lot T, TTC), et ce que
 * l'écran en fait sur une ligne de main-d'œuvre :
 *   - en FRANCHISE, il est PROPOSÉ tel quel (sans TVA, le TTC est ce que
 *     paie le client) ;
 *   - au RÉGIME RÉEL, il est MONTRÉ sous le champ, jamais converti : le
 *     champ est hors taxes, et aucune règle de conversion n'est arrêtée
 *     (12 euros ronds sur 131 ne se retrouvent pas en TTC depuis un HT au
 *     centime) ;
 *   - sans taux déclaré, l'écran le dit ;
 *   - tarifs ou régime en lecture ou en échec : « n'a pas pu être lu » —
 *     jamais « pas déclaré » pour un échec.
 * `{ valeur, phrase }` ; `valeur` en centimes, ou `null`.
 */
export function tauxHorairePropose(etatTarifs, etatRegime) {
  const tarifs = tarifsConnus(etatTarifs);
  const regime = regimeConnu(etatRegime);
  if (!tarifs || !regime) return { valeur: null, phrase: 'Votre taux horaire n’a pas pu être lu.' };
  const taux = tarifs.ligne ? tarifs.ligne.taux_horaire_centimes : null;
  if (!entier(taux) || taux <= 0) {
    return { valeur: null, phrase: 'Vous n’avez pas déclaré de taux horaire dans « Mon entreprise ».' };
  }
  /* « affiché » seulement s'il l'est sur la fiche : un taux que l'artisan
     garde pour lui est « déclaré ». */
  const qualificatif = tarifs.ligne.affiche === true ? 'affiché' : 'déclaré';
  if (regime === 'franchise') {
    return { valeur: taux, phrase: `Votre taux horaire ${qualificatif} : ${centimesLisibles(taux)}. Proposé, modifiable.` };
  }
  if (regime === 'reel') {
    return {
      valeur: null,
      phrase: `Votre taux horaire ${qualificatif} : ${centimesLisibles(taux)} TTC. Ce champ est hors taxes : `
        + 'écrivez le montant HT que vous facturez.',
    };
  }
  return {
    valeur: null,
    phrase: `Votre taux horaire ${qualificatif} : ${centimesLisibles(taux)} TTC. Déclarez votre régime de TVA dans `
      + '« Mon entreprise » pour savoir ce que ce champ doit porter.',
  };
}

/**
 * Un délai « indicatif » : un avertissement, JAMAIS un refus. Face à un
 * consommateur, une date ou un délai indicatif d'exécution est présumé
 * abusif (code de la consommation, art. R. 212-2, 7°). La seule règle plus
 * stricte que la loi que garde Opus est la relecture annuelle du SIRET ;
 * celle-ci n'en ajoute pas.
 */
export function avertissementDelai(texte) {
  if (!pourChercher(texte).includes('indicati')) return null;
  return 'Face à un particulier, une date ou un délai « indicatif » est présumé abusif (code de la '
    + 'consommation, art. R.\u00a0212-2, 7°) : écrivez une date ou un délai ferme.';
}
