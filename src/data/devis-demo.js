/**
 * LE CHIFFRAGE EN DÉMONSTRATION — lot 1 du module devis (étape 4, 22/10/2026).
 *
 * POURQUOI CE FICHIER FAIT PLUS QUE RANGER DES DONNÉES
 * ----------------------------------------------------
 * Sans fichier `.env`, `api.js` n'a pas de base : chaque écriture finirait
 * en `noop`, et l'écran de saisie aurait l'air parfait pendant que la vraie
 * base refuserait l'enregistrement — la règle qui a déjà coûté cher
 * (CLAUDE.md, le format « montage »). La démonstration du devis doit donc
 * FAIRE VIVRE le mécanisme, pas le simuler :
 *   - les écritures passent par la MÊME file d'écriture que sur la vraie
 *     base (`file-ecriture.js`), avec ses états (« enregistrement… »,
 *     « non enregistrée », « Réessayer ») — c'est la seule façon de les voir
 *     sans `.env` ;
 *   - ce qui suit joue le rôle de la BASE : les miroirs des déclencheurs
 *     (`nettoyerDevis`, `nettoyerLigne`), des contraintes (`validerDevis`,
 *     `validerLigne`, dans l'ordre alphabétique de PostgreSQL), du
 *     recalcul (`totauxDevis`), et des refus écrits par la section 49.6
 *     (OP013 à OP017) — AVEC LES MOTS DE LA BASE (`REFUS_DEVIS`, comparés à
 *     `schema.sql` par `verifier-devis`). Jamais plus aimable que le
 *     serveur ;
 *   - les totaux ne sont PAS écrits dans les données : ils sont calculés au
 *     chargement, et `verifier-devis` refait le calcul ;
 *   - les dates sont CALCULÉES depuis l'heure où l'on regarde (« il y a
 *     2 h », « il y a 3 jours ») : une date figée dans ce fichier vieillirait
 *     (la leçon des demandes de démonstration du 04/10).
 *
 * Ce fichier n'importe que des fichiers purs (`devis.js`, `postes.js`,
 * `erreurs.js`, `demo.js`) : `verifier-devis` et `verifier-postes` le FONT
 * TOURNER sous `node` — il écrit des lignes et des postes, en refuse, en
 * retire, et compare ce qu'il rend à ce que la base rendrait. Et il ne
 * retouche AUCUNE donnée de démonstration existante : `initialDemandesRecues`,
 * `emetteur-demo.js` et `tarifs-demo.js` sont lus par d'autres contrôles.
 *
 * LA BASE DE POSTES (lot P, section 50) vit dans la même base de
 * démonstration : huit postes (`fabriquerPostesDemo`), les mêmes refus que
 * la base — dans le même ordre, avec les mêmes noms —, le doublon reconnu à
 * une variante près, le plafond (OP018, avec la phrase de la base),
 * l'écriture SOUS CONDITION sur la date lue, et un devis supprimé qui vide
 * le lien d'origine de ses postes. UNE REQUÊTE DE POSTES À LA FOIS : la
 * seconde attend la première, comme sur la vraie base où le plafond se
 * compte sous un verrou — c'est ce qui fait vivre « ce poste existe déjà »
 * sans `.env`.
 *
 * LE JEU, ET CE QU'IL PERMET DE VOIR SANS `.env`
 * ----------------------------------------------
 *   1. « Rénovation salle de bains » pour Mme Martin (`cl-martin`), ouvert
 *      depuis sa fiche (`devisDepuisClient` : le lieu des travaux est la
 *      COPIE de son adresse) : une zone, une pièce AVEC ses surfaces, quatre
 *      postes à DEUX taux (10 % et 20 %) — dont une main-d'œuvre à l'heure,
 *      une « Chape sèche avant carrelage collé » à 45,00 € le m², et une
 *      ligne « fourniture non comprise » —, un poste « Offert » QUI GARDE SA
 *      VALEUR, une réserve, une option, une retenue de garantie de 5 % ;
 *   2. un brouillon SANS client (« Pour qui ? — à choisir ») : la même
 *      chape à 52,00 €, et sa variante « fourniture non comprise » à
 *      38,00 €. Sans eux, « deux prix → UNE proposition qui porte les deux »
 *      (la réponse du 23/10, lot P) et « avec et sans fourniture → deux
 *      propositions » ne se verraient nulle part sans `.env` (ce paragraphe
 *      disait « deux prix → deux suggestions » jusqu'au lot P) ;
 *   3. le lien vers une DEMANDE se vit par le geste, pas par une donnée
 *      truquée : la demande de devis de démonstration est « en attente »
 *      (`demo.js`) ; on l'ACCEPTE dans « Pour moi », et « Faire un devis »
 *      apparaît — le brouillon qu'il ouvre porte son lien, et la base de
 *      démonstration vérifie qu'elle vous est adressée (OP013) et qu'il n'y
 *      en a pas déjà vingt (OP017) ;
 *   4. depuis le lot P, le second devis porte trois lignes de plus (des
 *      orthographes qui se regroupent, une ligne qui porte un poste écrit
 *      autrement) : la mémoire, sur « chape », rend désormais DEUX
 *      propositions (52 € puis 45 € dans la même, et 38 € « fourniture non
 *      comprise »), la base de postes en tête quand elle les connaît.
 *
 * L'artisan est la fiche `1` — un NOMBRE ici, une CHAÎNE ailleurs
 * (`Object.keys()`) : toute comparaison passe par `String()`, le piège des
 * trois `===` du lot E.
 */
import {
  nettoyerDevis, validerDevis, nettoyerLigne, validerLigne, totauxDevis, trierLignes, trierDevis,
  devisDepuisClient, choisirChamps, CHAMPS_DEVIS, CHAMPS_LIGNE, TYPES_CHIFFRES, LIGNES_MAX,
  DEVIS_PAR_DEMANDE_MAX, PLAFOND_LISTE, MEMOIRE_MAX, DELAI_PAR_DEFAUT, cleDeLigne,
} from '../lib/devis.js';
import { nettoyerPoste, validerPoste, POSTES_MAX } from '../lib/postes.js';
import { REFUS_DEVIS, SUPPRESSION_DEPASSEE, REFUS_POSTES } from '../lib/erreurs.js';
import { initialClients } from './demo.js';

/** L'artisan de démonstration : la fiche 1 (`Object.keys(proProfiles)[0]`). */
export const PRO_DEMO_DEVIS = 1;

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

/** Les identifiants des deux devis de démonstration — des UUID v4, comme
 *  ceux que le téléphone fabrique (`identifiant.js`). */
export const DEVIS_DEMO_IDS = Object.freeze({
  renovation: 'de000001-0000-4000-8000-000000000001',
  sejour: 'de000002-0000-4000-8000-000000000002',
});

/* L'identifiant d'une ligne de démonstration : le devis, puis son rang. */
const idLigne = (devis, rang) => `${devis === 1 ? 'de0001a0' : 'de0002a0'}-0000-4000-8000-${String(rang).padStart(12, '0')}`;

/**
 * L'ANCIENNETÉ DES DEMANDES DE DÉMONSTRATION.
 *
 * `initialDemandesRecues` (`demo.js`) dit son ancienneté en TEXTE (« Il y a
 * 12 min », « Il y a 2 h », « Hier ») et ne porte aucune date — et on n'y
 * touche pas : d'autres contrôles la lisent. Or « depuis une demande du
 * 15/09/2026 » (`origineLisible`) a besoin de la date qu'elle aurait en
 * base. Elle est donc calculée ICI, au moment où l'on regarde, d'après ce
 * même texte. Sans elle, un devis ouvert depuis une demande dirait
 * « depuis une demande » tout court — la phrase réservée au lien devenu
 * vide, c'est-à-dire un mensonge.
 */
const ANCIENNETE_DEMANDES = Object.freeze({
  'dr-sos-1': 12 * MINUTE,
  'dr-devis-1': 2 * HEURE,
  'dr-rappel-1': 26 * HEURE,
});

/** La date « en base » d'une demande de démonstration, ou `null`. */
export function dateDeDemandeDemo(id, maintenant = new Date()) {
  const ecart = ANCIENNETE_DEMANDES[id];
  return ecart === undefined ? null : new Date(maintenant.getTime() - ecart).toISOString();
}

/**
 * Les deux devis et leurs lignes, AUX NOMS DE L'APPLICATION (camelCase),
 * datés depuis `maintenant`. Aucun total : la base de démonstration les
 * calcule (`creerBaseDevisDemo`), et `verifier-devis` vérifie qu'aucun
 * n'est écrit ici.
 */
export function fabriquerDevisDemo(maintenant = new Date()) {
  const t = maintenant.getTime();
  const il = (ms) => new Date(t - ms).toISOString();
  /* Le numéro d'écriture d'une ligne ancienne : l'heure de son écriture en
     millisecondes, comme la file le fabrique (49.5 bis). Toujours au plus
     l'horloge de son devis. */
  const num = (ms) => t - ms;
  const martin = initialClients.find((c) => c.id === 'cl-martin') || { id: 'cl-martin' };

  const devis = [
    {
      id: DEVIS_DEMO_IDS.renovation,
      proId: PRO_DEMO_DEVIS,
      quoteRequestId: null,
      sosRequestId: null,
      ...devisDepuisClient(martin),
      statut: 'brouillon',
      objet: 'Rénovation salle de bains',
      delaiExecution: DELAI_PAR_DEFAUT.texte,
      retenueGarantieCentiemes: 500,
      generation: num(3 * JOUR),
      createdAt: il(5 * JOUR),
      modifieLe: il(3 * JOUR),
    },
    {
      id: DEVIS_DEMO_IDS.sejour,
      proId: PRO_DEMO_DEVIS,
      clientId: null,
      quoteRequestId: null,
      sosRequestId: null,
      source: 'manuelle',
      statut: 'brouillon',
      objet: 'Sol du séjour',
      lieuAdresse: null,
      lieuCodePostal: null,
      lieuVille: null,
      delaiExecution: null,
      retenueGarantieCentiemes: null,
      generation: num(2 * HEURE),
      createdAt: il(26 * HEURE),
      modifieLe: il(2 * HEURE),
    },
  ];

  /* Une ligne, toutes colonnes dites : ce que la base rangerait. */
  const ligne = (devisNo, rang, valeurs, age) => ({
    id: idLigne(devisNo, rang),
    devisId: devisNo === 1 ? DEVIS_DEMO_IDS.renovation : DEVIS_DEMO_IDS.sejour,
    ordre: rang * 1000,
    type: 'poste',
    designation: null,
    quantiteMilliemes: null,
    unite: null,
    prixUnitaireCentimes: null,
    tauxTvaCentiemes: null,
    offert: false,
    mainOeuvre: false,
    fournitureNonComprise: false,
    surfaceSolMilliemes: null,
    surfaceMursMilliemes: null,
    ...valeurs,
    generation: num(age),
    modifieLe: il(age),
  });
  /* Les lignes du premier devis, écrites il y a 3 jours, une minute
     d'écart chacune (la plus ancienne d'abord) — toujours au plus
     l'horloge du devis. */
  const vieux = (rang) => 3 * JOUR + (10 - rang) * MINUTE;
  const lignes = [
    ligne(1, 1, { type: 'zone', designation: 'R+1' }, vieux(1)),
    ligne(1, 2, { type: 'piece', designation: 'Salle de bains', surfaceSolMilliemes: 6200, surfaceMursMilliemes: 18500 }, vieux(2)),
    ligne(1, 3, {
      designation: 'Pose de faïence murale', mainOeuvre: true, unite: 'h',
      quantiteMilliemes: 12000, prixUnitaireCentimes: 4500, tauxTvaCentiemes: 1000,
    }, vieux(3)),
    ligne(1, 4, {
      designation: 'Chape sèche avant carrelage collé', unite: 'm2',
      quantiteMilliemes: 6200, prixUnitaireCentimes: 4500, tauxTvaCentiemes: 1000,
    }, vieux(4)),
    ligne(1, 5, {
      designation: 'Pose d’un meuble vasque', unite: 'u', fournitureNonComprise: true,
      quantiteMilliemes: 1000, prixUnitaireCentimes: 18000, tauxTvaCentiemes: 1000,
    }, vieux(5)),
    /* Le second taux : une fourniture SEULE, sans pose, est au taux normal. */
    ligne(1, 6, {
      designation: 'Sèche-serviettes électrique (fourniture seule, sans pose)', unite: 'u',
      quantiteMilliemes: 1000, prixUnitaireCentimes: 32000, tauxTvaCentiemes: 2000,
    }, vieux(6)),
    /* « Offert » GARDE SON PRIX : le total de la ligne vaut 0, la valeur
       reste (150,00 €), et éteindre l'interrupteur la fait revenir. */
    ligne(1, 7, {
      designation: 'Évacuation des gravats en déchetterie', unite: 'forfait', offert: true,
      quantiteMilliemes: 1000, prixUnitaireCentimes: 15000, tauxTvaCentiemes: 1000,
    }, vieux(7)),
    ligne(1, 8, {
      type: 'reserve',
      designation: 'Les reprises de plomberie derrière la cloison existante ne sont pas comprises.',
    }, vieux(8)),
    ligne(1, 9, {
      type: 'option', designation: 'Niche murale carrelée', unite: 'u',
      quantiteMilliemes: 1000, prixUnitaireCentimes: 24000, tauxTvaCentiemes: 1000,
    }, vieux(9)),

    /* Le second devis : la même chape, à un autre prix, et sa variante sans
       la fourniture. Écrites il y a deux heures : elles sont les plus
       récentes de la mémoire. */
    ligne(2, 1, {
      designation: 'Chape sèche avant carrelage collé', unite: 'm2',
      quantiteMilliemes: 24000, prixUnitaireCentimes: 5200, tauxTvaCentiemes: 1000,
    }, 2 * HEURE + 3 * MINUTE),
    ligne(2, 2, {
      designation: 'Chape sèche avant carrelage collé', unite: 'm2', fournitureNonComprise: true,
      quantiteMilliemes: 10000, prixUnitaireCentimes: 3800, tauxTvaCentiemes: 1000,
    }, 2 * HEURE + 2 * MINUTE),
    ligne(2, 3, {
      designation: 'Seuil de porte en aluminium (fourniture seule, sans pose)', unite: 'u',
      quantiteMilliemes: 2000, prixUnitaireCentimes: 2500, tauxTvaCentiemes: 2000,
    }, 2 * HEURE + MINUTE),

    /* LES TROIS LIGNES DE LA BASE DE POSTES (lot P), dans ce devis-ci et
       pas dans le premier : `mesure-devis` compte EXACTEMENT quatre postes
       chiffrés dans « Rénovation salle de bains », alors que le total de
       celui-ci est toujours recalculé. Chacune fait voir une réponse du
       propriétaire du 23/10 (« reconnaître les phrases… pas trop de
       propositions ») sans fichier `.env`, et chacune reste au plus
       l'horloge du devis (deux heures).
         - « Seuils » à 23 €, écrite AVANT « Seuil » à 25 € : deux
           orthographes, UNE proposition, titrée par la plus récente, qui
           porte les deux prix — et plus tard le chemin « ce poste existe
           déjà » ;
         - « Depose… » sans accent : une ligne qui PORTE un poste écrit
           autrement (« Dépose… ») — la référence le nomme, et l'écart
           (20 € contre 18 €) pose sa question ;
         - « evacuation… » tapée vite, la plus récente : elle titre la
           proposition qui regroupe aussi « Évacuation… » offerte à 150 €
           du premier devis. C'est la règle de la phrase la plus RÉCENTE, et
           sa conséquence, sous les yeux. */
    ligne(2, 4, {
      designation: 'Seuils de porte en aluminium (fourniture seule, sans pose)', unite: 'u',
      quantiteMilliemes: 1000, prixUnitaireCentimes: 2300, tauxTvaCentiemes: 2000,
    }, 2 * HEURE + 4 * MINUTE),
    ligne(2, 5, {
      designation: 'Depose de l’ancien carrelage au sol', unite: 'm2',
      quantiteMilliemes: 24000, prixUnitaireCentimes: 2000, tauxTvaCentiemes: 1000,
    }, 2 * HEURE + 30 * 1000),
    ligne(2, 6, {
      designation: 'evacuation des gravats en dechetterie', unite: 'forfait',
      quantiteMilliemes: 1000, prixUnitaireCentimes: 18000, tauxTvaCentiemes: 1000,
    }, 2 * HEURE),
  ];

  return { devis, lignes };
}

/** Les identifiants des postes de démonstration — des UUID v4 à chiffres
 *  hexadécimaux, comme ceux que la base fabrique (`gen_random_uuid()`). */
const idPoste = (rang) => `ba5e${String(rang).padStart(4, '0')}-0000-4000-8000-${String(rang).padStart(12, '0')}`;

/**
 * LA BASE DE POSTES DE DÉMONSTRATION — huit postes (lot P, section 50).
 *
 * AUX NOMS DE L'APPLICATION, comme `rowToPoste` les rend, plus l'entreprise
 * (`proId`). Les prix sont INVENTÉS, jamais ceux des devis du propriétaire,
 * et le mot « chape » n'apparaît que dans le premier poste. Chacun fait
 * VOIR quelque chose sans fichier `.env` :
 *   1. la chape à 45 € : la référence sur la ligne du premier devis (pas
 *      d'écart), l'ÉCART sur celle du second (52 €), et la base en tête sur
 *      « chape », qui masque la mémoire à 52 € et 45 € ;
 *   2. la faïence à l'heure, SANS prix : « dans votre base, sans prix de
 *      référence », et sa proposition reprend le dernier prix écrit (45 €) ;
 *   3. la faïence au forfait : choisie sur la ligne de faïence (12 h),
 *      « l'unité est passée de heure à forfait » ;
 *   4. le ragréage : une phrase longue, coupée à trois lignes dans la page ;
 *   5. la dépose : son devis d'origine a été supprimé — « Ajouté le … » sans
 *      origine ; et la ligne « Depose… » du second devis la fait reconnaître ;
 *   6. les plinthes, fixées il y a quarante jours : AVANT la déclaration du
 *      régime de démonstration (vingt jours, `emetteur-demo.js`) — « …
 *      vérifiez-le » ;
 *   7. le meuble vasque « fourniture non comprise » : la ligne du premier
 *      devis est dans la base, sans écart ;
 *   8. la dalle : aucune ligne ne la porte — taper « Dalles » ou « beton »
 *      la propose, la réponse du propriétaire mise à l'épreuve.
 *
 * LES DATES SONT COHÉRENTES AVEC LES DEVIS : un poste rangé depuis le
 * premier devis l'a été APRÈS que ses lignes ont été écrites (il y a trois
 * jours), jamais avant que le devis existe. Toutes, sauf les plinthes, sont
 * postérieures à la déclaration du régime. Calculées depuis `maintenant`,
 * comme le reste de ce fichier.
 */
export function fabriquerPostesDemo(maintenant = new Date()) {
  const t = maintenant.getTime();
  const il = (ms) => new Date(t - ms).toISOString();
  const poste = (rang, valeurs, age, origine = null) => ({
    id: idPoste(rang),
    proId: PRO_DEMO_DEVIS,
    designation: null,
    unite: null,
    fournitureNonComprise: false,
    mainOeuvre: false,
    prixReferenceCentimes: null,
    ...valeurs,
    prixFixeLe: valeurs.prixReferenceCentimes == null ? null : il(age),
    devisOrigineId: origine,
    createdAt: il(age),
    modifieLe: il(age),
  });
  /* Juste après les lignes du premier devis (écrites il y a 3 jours et
     quelques minutes). */
  const apresLeDevis1 = (minutes) => 3 * JOUR - minutes * MINUTE;
  return [
    poste(1, { designation: 'Chape sèche avant carrelage collé', unite: 'm2', prixReferenceCentimes: 4500 },
      apresLeDevis1(20), DEVIS_DEMO_IDS.renovation),
    poste(2, { designation: 'Pose de faïence murale', unite: 'h', mainOeuvre: true },
      apresLeDevis1(25), DEVIS_DEMO_IDS.renovation),
    poste(3, { designation: 'Faïence murale, forfait pour une salle d’eau complète', unite: 'forfait', prixReferenceCentimes: 90000 },
      7 * JOUR),
    poste(4, {
      designation: 'Ragréage autolissant fibré sur plancher bois, après pose d’un primaire d’accrochage et d’une bande '
        + 'périphérique, épaisseur moyenne 5 mm, nettoyage compris',
      unite: 'm2',
      prixReferenceCentimes: 2800,
    }, 12 * JOUR),
    poste(5, { designation: 'Dépose de l’ancien carrelage au sol', unite: 'm2', prixReferenceCentimes: 1800 }, 15 * JOUR),
    poste(6, { designation: 'Pose de plinthes carrelées', unite: 'm', prixReferenceCentimes: 1200 }, 40 * JOUR),
    poste(7, { designation: 'Pose d’un meuble vasque', unite: 'u', fournitureNonComprise: true, prixReferenceCentimes: 18000 },
      apresLeDevis1(30), DEVIS_DEMO_IDS.renovation),
    poste(8, { designation: 'Dalle béton armé, épaisseur 12 cm, sur hérisson', unite: 'm2', prixReferenceCentimes: 8500 },
      5 * JOUR),
  ];
}

/* ================================================================== */
/*  LA BASE DE DÉMONSTRATION                                            */
/* ================================================================== */

/* Le plus grand numéro d'écriture que la base accepte (49.5 bis, OP016). */
const NUMERO_MAX = 9007199254740991;
const numeroValable = (g) => Number.isSafeInteger(g) && g >= 1 && g <= NUMERO_MAX;
/* Une colonne `integer` : au-delà, PostgreSQL rend 22003. */
const ENTIER_MAX = 2147483647;

/* LES ERREURS, À LA FORME DE POSTGREST : un `code`, un `message` (celui de
   PostgreSQL 16, mot pour mot), des `details`. `messageClair()` les
   traduit des deux côtés — vraie base ou démonstration — par le même
   chemin. */
function refus(code, message, details = null) {
  const e = new Error(message);
  e.code = code;
  e.details = details;
  e.hint = null;
  return e;
}
const refusCheck = (table, nom) => refus('23514', `new row for relation "${table}" violates check constraint "${nom}"`);
const refusAcces = (table) => refus('42501', `new row violates row-level security policy for table "${table}"`);
const refusCle = (table, id) => refus('23505', `duplicate key value violates unique constraint "${table}_pkey"`,
  `Key (id)=(${id}) already exists.`);
const refusNul = (colonne, table) => refus('23502',
  `null value in column "${colonne}" of relation "${table}" violates not-null constraint`);
const refusEntier = () => refus('22003', 'integer out of range');
/* LA BASE DE POSTES, AUX MOTS DE POSTGRESQL 16 (relevés sur l'essai 50). Le
   nom de la table n'est écrit qu'ICI, une fois : `verifier-postes` (D)
   refuse ce nom partout dans `src/` hors des quatre fonctions de `api.js` —
   et ce fichier ne charge aucun client Supabase, il ne peut que l'imiter. */
const TABLE_POSTES = 'base_postes';
/* Le doublon : la table a la RLS, donc PostgreSQL ne détaille PAS la clé
   (mesuré) — aucune valeur dans `details`. */
const refusDoublon = () => refus('23505', 'duplicate key value violates unique constraint "idx_base_postes_rapprochement"');
/* La clé composée du lien d'origine : le devis d'un autre et un devis
   inexistant rendent le MÊME refus, sans valeur — aucun oracle. */
const refusLienOrigine = () => refus('23503',
  `insert or update on table "${TABLE_POSTES}" violates foreign key constraint "base_postes_devis_origine_fkey"`,
  'Key is not present in table "devis".');
/* Une modification qui n'a touché AUCUNE ligne — la règle d'accès ne la
   montre pas, ou elle n'existe plus. PostgREST rend 204 sans rien dire ;
   `api.js` le DIT, avec le code que `messageClair()` traduit par « cet
   enregistrement n'existe plus… rechargez l'écran ». */
const introuvable = () => refus('PGRST116', 'JSON object requested, multiple (or no) rows returned',
  'La ligne visée n’existe plus en base : aucune ligne modifiée.');
/* Une requête annulée (le délai de la file) n'est jamais partie. */
function annulee() {
  const e = new Error('The operation was aborted.');
  e.name = 'AbortError';
  return e;
}

const estAMoi = (d, proId) => Boolean(d) && String(d.proId) === String(proId);
const copie = (x) => (x ? { ...x } : null);
const videDevis = () => Object.fromEntries(CHAMPS_DEVIS.map((c) => [c, null]));
const videLigne = () => Object.fromEntries(CHAMPS_LIGNE.map((c) => [c, null]));

/* « Le plus récent d'abord », comme `order('modifie_le', { ascending:
   false }).order('id')`. */
function plusRecentDAbord(a, b) {
  const ta = Date.parse(a.modifieLe || '') || 0;
  const tb = Date.parse(b.modifieLe || '') || 0;
  if (ta !== tb) return tb - ta;
  return String(a.id).toLowerCase() < String(b.id).toLowerCase() ? -1 : 1;
}

/**
 * Une base de devis EN MÉMOIRE, qui se comporte comme la section 49.
 *
 * @param {object} o
 * @param {Function} [o.maintenant]  l'heure (remplaçable pour les contrôles)
 * @param {Function} [o.demandeDe]   (genre, id) → la demande reçue, ou `null` —
 *                                   `api.js` lit sa copie vivante des demandes,
 *                                   pour qu'une demande acceptée dans l'écran
 *                                   le soit aussi ici
 * @param {number}   [o.pauseMs]     le temps d'une écriture : sans lui, les états
 *                                   « enregistrement… » ne se verraient pas
 * @param {object}   [o.donnees]     un autre jeu que celui de démonstration
 *
 * Chaque fonction prend l'artisan (`proId`) en premier : ce qui n'est pas à
 * lui n'existe pas pour lui, comme sous la règle d'accès de la base.
 */
export function creerBaseDevisDemo({
  maintenant = () => new Date(),
  demandeDe = () => null,
  pauseMs = 0,
  donnees = null,
} = {}) {
  const jeu = donnees || fabriquerDevisDemo(maintenant());
  const devis = new Map();
  const lignes = new Map();
  (jeu.devis || []).forEach((d) => devis.set(d.id, { ...d }));
  (jeu.lignes || []).forEach((l) => lignes.set(l.id, { ...l }));

  const lignesDe = (devisId) => [...lignes.values()].filter((l) => l.devisId === devisId);
  const horodatage = () => maintenant().toISOString();
  const poserTotaux = (d, t) => {
    d.totalHtCentimes = t.ht;
    d.totalTvaCentimes = t.tva;
    d.totalTtcCentimes = t.ttc;
  };

  /* LES TOTAUX DU JEU, CALCULÉS — jamais lus dans les données. */
  devis.forEach((d) => {
    const t = totauxDevis(lignesDe(d.id));
    if (!t.ok) throw new Error(`Devis de démonstration irrecevable (${t.contrainte}) : corrigez devis-demo.js.`);
    poserTotaux(d, t);
  });

  const pause = () => (pauseMs > 0 ? new Promise((r) => { setTimeout(r, pauseMs); }) : Promise.resolve());

  /* Une fiche du carnet est-elle à moi ? Le carnet de démonstration est
     VIVANT (`api.js` y ajoute, en modifie, en retire). */
  const clientAMoi = (proId, id) => initialClients.some((c) => String(c.id) === String(id)
    && String(c.proId) === String(proId));

  /* LES LIENS (OP013) : vérifiés quand ils CHANGENT et ne sont pas vides —
     un lien qui passe à vide passe toujours (D3, D11). */
  function verifierLiens(proId, x, ancien) {
    const change = (col) => x[col] != null && (!ancien || x[col] !== ancien[col]);
    if (change('clientId') && !clientAMoi(proId, x.clientId)) throw refus('OP013', REFUS_DEVIS.OP013_client);
    if (change('quoteRequestId') && !demandeDe('devis', x.quoteRequestId)) throw refus('OP013', REFUS_DEVIS.OP013_demande);
    if (change('sosRequestId') && !demandeDe('sos', x.sosRequestId)) throw refus('OP013', REFUS_DEVIS.OP013_urgence);
  }

  /* LE PLAFOND PAR DEMANDE ET PAR URGENCE (OP017), quand le lien change. */
  function verifierPlafond(proId, x, ancien, id) {
    [['quoteRequestId', 'OP017_demande'], ['sosRequestId', 'OP017_urgence']].forEach(([col, phrase]) => {
      if (x[col] == null || (ancien && x[col] === ancien[col])) return;
      const n = [...devis.values()].filter((d) => estAMoi(d, proId) && d[col] === x[col] && d.id !== id).length;
      if (n >= DEVIS_PAR_DEMANDE_MAX) throw refus('OP017', REFUS_DEVIS[phrase]);
    });
  }

  /* L'ordre d'une ligne : une colonne `integer not null`. */
  function verifierOrdre(x) {
    if (x.ordre === null || x.ordre === undefined) throw refusNul('ordre', 'devis_lignes');
    if (!Number.isSafeInteger(x.ordre) || Math.abs(x.ordre) > ENTIER_MAX) throw refusEntier();
  }

  /* LE RECALCUL (49.6), sur les lignes telles qu'elles seraient : l'horloge
     d'abord (OP015), puis le plafond de lignes (OP014) — une suppression ne
     porte pas de numéro et n'est jamais refusée —, puis le plafond du
     devis, que la base refuse sur le DEVIS (`devis_plafond_check`). */
  function recalculer(d, generation, finales) {
    if (generation != null && generation <= d.generation) throw refus('OP015', REFUS_DEVIS.OP015_ligne);
    if (generation != null && finales.length > LIGNES_MAX) throw refus('OP014', REFUS_DEVIS.OP014);
    const t = totauxDevis(finales);
    if (!t.ok) throw refusCheck(t.contrainte === 'devis_plafond_check' ? 'devis' : 'devis_lignes', t.contrainte);
    return t;
  }
  function appliquerAuDevis(d, t, generation) {
    poserTotaux(d, t);
    d.modifieLe = horodatage();
    if (generation != null) d.generation = generation;
  }

  /* ---------------------------------------------------------------- */
  /*  LES ÉCRITURES — le contrat de `file-ecriture.js`                  */
  /* ---------------------------------------------------------------- */

  function insererDevis(proId, op) {
    const x = nettoyerDevis({ ...videDevis(), ...choisirChamps(op.valeurs, CHAMPS_DEVIS) });
    /* Le déclencheur d'abord (OP016, OP013, OP017), puis les contraintes,
       puis la clé : l'ordre de PostgreSQL. */
    if (!numeroValable(op.generation)) throw refus('OP016', REFUS_DEVIS.OP016_devis);
    verifierLiens(proId, x, null);
    verifierPlafond(proId, x, null, op.id);
    const c = validerDevis(x);
    if (!c.ok) throw refusCheck('devis', c.contrainte);
    if (devis.has(op.id)) throw refusCle('devis', op.id);
    const n = horodatage();
    devis.set(op.id, {
      ...choisirChamps(x, CHAMPS_DEVIS),
      id: op.id,
      proId,
      statut: 'brouillon',
      totalHtCentimes: 0,
      totalTvaCentimes: 0,
      totalTtcCentimes: 0,
      generation: op.generation,
      createdAt: n,
      modifieLe: n,
    });
  }

  function modifierDevis(proId, op) {
    const d = devis.get(op.id);
    if (!estAMoi(d, proId)) throw introuvable();
    if (!numeroValable(op.generation)) throw refus('OP016', REFUS_DEVIS.OP016_devis);
    /* Une écriture DIRECTE du devis fait monter l'horloge, ou elle est
       refusée — y compris la « levée » sans valeur (49.5 bis, point 13). */
    if (op.generation <= d.generation) throw refus('OP015', REFUS_DEVIS.OP015_devis);
    const x = nettoyerDevis({ ...choisirChamps(d, CHAMPS_DEVIS), ...choisirChamps(op.valeurs, CHAMPS_DEVIS) });
    x.source = d.source;   // le geste qui a ouvert le brouillon ne se récrit pas (D3)
    verifierLiens(proId, x, d);
    verifierPlafond(proId, x, d, d.id);
    const c = validerDevis(x);
    if (!c.ok) throw refusCheck('devis', c.contrainte);
    Object.assign(d, choisirChamps(x, CHAMPS_DEVIS), { source: d.source, generation: op.generation, modifieLe: horodatage() });
  }

  function supprimerDevis(proId, op) {
    if (!numeroValable(op.generationMax)) throw refus('OP016', REFUS_DEVIS.OP016_devis);
    const d = devis.get(op.id);
    if (estAMoi(d, proId) && d.generation < op.generationMax) {
      lignesDe(d.id).forEach((l) => lignes.delete(l.id));   // la cascade
      devis.delete(d.id);
      viderLeLienDOrigine(d.id);
      return;
    }
    /* Rien de supprimé : déjà parti, ou retouché depuis par une écriture
       plus récente — et ça, il faut le DIRE. */
    if (estAMoi(d, proId)) throw refus('OP015', SUPPRESSION_DEPASSEE.devis);
  }

  function insererLigne(proId, op) {
    const v = op.valeurs || {};
    if (!numeroValable(op.generation)) throw refus('OP016', REFUS_DEVIS.OP016_ligne);
    const x = nettoyerLigne({ ...videLigne(), ...choisirChamps(v, CHAMPS_LIGNE) });
    const d = devis.get(v.devisId);
    if (!estAMoi(d, proId)) throw refusAcces('devis_lignes');
    verifierOrdre(x);
    const c = validerLigne(x);
    if (!c.ok) throw refusCheck('devis_lignes', c.contrainte);
    if (lignes.has(op.id)) throw refusCle('devis_lignes', op.id);
    const neuve = { ...x, id: op.id, devisId: d.id, generation: op.generation, modifieLe: horodatage() };
    const t = recalculer(d, op.generation, [...lignesDe(d.id), neuve]);
    lignes.set(op.id, neuve);
    appliquerAuDevis(d, t, op.generation);
  }

  function modifierLigne(proId, op) {
    const l = lignes.get(op.id);
    const d = l && devis.get(l.devisId);
    if (!l || !estAMoi(d, proId)) throw introuvable();
    if (!numeroValable(op.generation)) throw refus('OP016', REFUS_DEVIS.OP016_ligne);
    const x = nettoyerLigne({ ...choisirChamps(l, CHAMPS_LIGNE), ...choisirChamps(op.valeurs, CHAMPS_LIGNE) });
    verifierOrdre(x);
    const c = validerLigne(x);
    if (!c.ok) throw refusCheck('devis_lignes', c.contrainte);
    const neuve = { ...l, ...x, id: l.id, devisId: l.devisId, generation: op.generation, modifieLe: horodatage() };
    const t = recalculer(d, op.generation, lignesDe(d.id).map((y) => (y.id === l.id ? neuve : y)));
    lignes.set(l.id, neuve);
    appliquerAuDevis(d, t, op.generation);
  }

  function supprimerLigne(proId, op) {
    if (!numeroValable(op.generationMax)) throw refus('OP016', REFUS_DEVIS.OP016_ligne);
    const l = lignes.get(op.id);
    const d = l && devis.get(l.devisId);
    if (l && estAMoi(d, proId) && l.generation < op.generationMax) {
      const t = recalculer(d, null, lignesDe(d.id).filter((y) => y.id !== l.id));
      lignes.delete(l.id);
      appliquerAuDevis(d, t, null);
      return;
    }
    if (l && estAMoi(d, proId)) throw refus('OP015', SUPPRESSION_DEPASSEE.ligne);
  }

  const ECRITURES = {
    'devis:inserer': insererDevis,
    'devis:modifier': modifierDevis,
    'devis:supprimer': supprimerDevis,
    'ligne:inserer': insererLigne,
    'ligne:modifier': modifierLigne,
    'ligne:supprimer': supprimerLigne,
  };

  /* ---------------------------------------------------------------- */
  /*  LA BASE DE POSTES — le miroir de la section 50 (lot P)            */
  /*                                                                    */
  /*  Elle REÇOIT ce que l'application envoie (`posteVersBase`, dans    */
  /*  `api.js` : les noms de la base, `designation`, `pro_id`…) et rend */
  /*  ce que `rowToPoste` rendrait (les noms de l'application). Les      */
  /*  deux côtés passent donc par la MÊME traduction, en démonstration  */
  /*  comme sur la vraie base.                                          */
  /* ---------------------------------------------------------------- */
  const postes = new Map();
  (donnees ? (donnees.postes || []) : fabriquerPostesDemo(maintenant())).forEach((p) => postes.set(p.id, { ...p }));
  let numeroPoste = 100;
  const posteAMoi = (p, proId) => Boolean(p) && String(p.proId) === String(proId);
  const postesDe = (proId) => [...postes.values()].filter((p) => posteAMoi(p, proId));
  /* Ce que la lecture rend : les dix colonnes de `COLONNES_POSTE`, ni
     l'entreprise ni la clé de rapprochement. */
  const posteLu = (p) => ({
    id: p.id,
    designation: p.designation,
    unite: p.unite,
    fournitureNonComprise: p.fournitureNonComprise === true,
    mainOeuvre: p.mainOeuvre === true,
    prixReferenceCentimes: p.prixReferenceCentimes,
    prixFixeLe: p.prixFixeLe,
    devisOrigineId: p.devisOrigineId,
    createdAt: p.createdAt,
    modifieLe: p.modifieLe,
  });
  /* Les colonnes que la base connaît, et leur nom dans l'application. */
  const COLONNES_ECRITES = {
    designation: 'designation',
    unite: 'unite',
    fourniture_non_comprise: 'fournitureNonComprise',
    main_oeuvre: 'mainOeuvre',
    prix_reference_centimes: 'prixReferenceCentimes',
  };
  const aLaColonne = (o, c) => Boolean(o) && Object.prototype.hasOwnProperty.call(o, c) && o[c] !== undefined;

  /* LA CASCADE `on delete set null (devis_origine_id)` d'un devis supprimé :
     elle tourne plus profond que l'écriture directe, donc `modifieLe` NE
     BOUGE PAS (section 50.4, `pg_trigger_depth()`) — un poste que personne
     n'a touché ne doit pas devenir « modifié entre-temps ». */
  function viderLeLienDOrigine(devisId) {
    postes.forEach((p) => {
      if (p.devisOrigineId === devisId) p.devisOrigineId = null;
    });
  }

  /* UNE REQUÊTE DE POSTES À LA FOIS, comme sur la vraie base où le
     plafond se compte sous un verrou (section 50.4) : la seconde attend
     que la première ait fini. C'est ce qui fait qu'un second ajout du même
     poste, parti pendant que le premier est en route, reçoit le 23505 au
     lieu de faire un doublon. */
  let tourDesPostes = Promise.resolve();
  function unALaFois(faire) {
    const tour = tourDesPostes.then(faire);
    tourDesPostes = tour.then(() => undefined, () => undefined);
    return tour;
  }
  /* LA PAUSE NOMMÉE (`PAUSE_POSTES_DEMO`, dans `api.js`) : elle s'arrête
     dès que la requête est annulée (le délai de 8 s), pour qu'une requête
     abandonnée ne fasse pas attendre la suivante. */
  function attendrePostes(ms, signal) {
    if (!(ms > 0) || (signal && signal.aborted)) return Promise.resolve();
    return new Promise((fini) => {
      let minuteur = null;
      const arreter = () => {
        clearTimeout(minuteur);
        if (signal && typeof signal.removeEventListener === 'function') signal.removeEventListener('abort', arreter);
        fini();
      };
      minuteur = setTimeout(arreter, ms);
      if (signal && typeof signal.addEventListener === 'function') signal.addEventListener('abort', arreter);
    });
  }
  function requeteDePostes({ signal = null, pauseMs: p = 0 } = {}, faire) {
    return unALaFois(async () => {
      if (signal && signal.aborted) throw annulee();
      await attendrePostes(p, signal);
      /* Une requête annulée pendant sa pause n'est jamais partie. */
      if (signal && signal.aborted) throw annulee();
      return faire();
    });
  }

  /* Le doublon, sur la clé COMPLÈTE (`cleDeLigne` : la phrase à une
     variante près, l'unité, la fourniture) — donc aussi pour une VARIANTE
     d'un poste existant, comme `idx_base_postes_rapprochement`. */
  function doublon(proId, x, sauf = null) {
    const cle = cleDeLigne(x);
    return postesDe(proId).some((q) => q.id !== sauf && cleDeLigne(q) === cle);
  }

  /** Ma base : les postes triés par l'identifiant, bornés au plafond, et
   *  leur nombre (le `count: 'exact'` de la vraie lecture). */
  function lirePostes(proId, opts) {
    return requeteDePostes(opts, () => {
      const miens = postesDe(proId).sort((a, b) => (a.id < b.id ? -1 : 1));
      return { postes: miens.slice(0, POSTES_MAX).map(posteLu), compte: miens.length };
    });
  }

  /** Un ajout, dans l'ordre de PostgreSQL : le déclencheur (la phrase
   *  rognée, les dates, le plafond OP018 sous verrou), puis la règle
   *  d'accès, puis les contraintes dans l'ordre alphabétique, puis l'index
   *  du doublon, puis la clé étrangère du lien d'origine. */
  function ajouterUnPoste(proId, ligne, opts) {
    return requeteDePostes(opts, () => {
      /* Seules les colonnes que l'artisan écrit sont lues ; les dates, la
         base les pose. La colonne GÉNÉRÉE de la clé n'est pas imitée (la
         vraie base refuserait sa valeur par 428C9) : son nom n'a rien à
         faire dans `src/` (`verifier-postes` D), et `posteVersBase` — que
         D fait tourner — ne l'envoie jamais. */
      const r = ligne || {};
      const x = nettoyerPoste(Object.fromEntries(Object.entries(COLONNES_ECRITES).map(([c, k]) => [k, aLaColonne(r, c) ? r[c] : null])));
      /* Le plafond ne se compte que pour SA propre entreprise (section
         50.4) : un étranger qui écrit au nom d'un autre n'apprend pas que
         sa base est pleine — il reçoit le refus de la règle d'accès. */
      const aMoi = String(r.pro_id) === String(proId);
      if (aMoi && postesDe(proId).length >= POSTES_MAX) throw refus('OP018', REFUS_POSTES.OP018);
      if (!aMoi) throw refusAcces(TABLE_POSTES);
      const c = validerPoste(x);
      if (!c.ok) throw refusCheck(TABLE_POSTES, c.contrainte);
      if (doublon(proId, x)) throw refusDoublon();
      const lien = r.devis_origine_id == null ? null : r.devis_origine_id;
      if (lien !== null && !estAMoi(devis.get(lien), proId)) throw refusLienOrigine();
      const n = horodatage();
      numeroPoste += 1;
      const p = {
        ...x,
        id: aLaColonne(r, 'id') ? r.id : idPoste(numeroPoste),
        proId: r.pro_id,
        devisOrigineId: lien,
        prixFixeLe: x.prixReferenceCentimes == null ? null : n,
        createdAt: n,
        modifieLe: n,
      };
      postes.set(p.id, p);
      return posteLu(p);
    });
  }

  /** Une modification SOUS CONDITION : sur la date lue (`modifieLe`). Ce qui
   *  n'est pas à moi, ce qui n'existe plus, ce qui a changé depuis : aucune
   *  ligne — `[]`, comme PostgREST. Le déclencheur fige l'identifiant,
   *  l'entreprise et la date de création, ne laisse le lien d'origine que
   *  disparaître, et pose les dates. */
  function modifierUnPoste(proId, id, patch, opts = {}) {
    return requeteDePostes(opts, () => {
      const r = patch || {};
      const p = postes.get(id);
      if (!posteAMoi(p, proId) || String(p.modifieLe) !== String(opts.modifieLe)) return [];
      const x = nettoyerPoste(Object.fromEntries(Object.entries(COLONNES_ECRITES).map(([c, k]) => [k, aLaColonne(r, c) ? r[c] : p[k]])));
      const c = validerPoste(x);
      if (!c.ok) throw refusCheck(TABLE_POSTES, c.contrainte);
      if (doublon(proId, x, p.id)) throw refusDoublon();
      const n = horodatage();
      const prixChange = x.prixReferenceCentimes !== p.prixReferenceCentimes;
      Object.assign(p, x, {
        devisOrigineId: aLaColonne(r, 'devis_origine_id') && r.devis_origine_id === null ? null : p.devisOrigineId,
        prixFixeLe: prixChange ? (x.prixReferenceCentimes == null ? null : n) : p.prixFixeLe,
        modifieLe: n,
      });
      return [posteLu(p)];
    });
  }

  /** Un retrait sous la même condition : `[{ id }]`, ou `[]`. */
  function retirerUnPoste(proId, id, opts = {}) {
    return requeteDePostes(opts, () => {
      const p = postes.get(id);
      if (!posteAMoi(p, proId) || String(p.modifieLe) !== String(opts.modifieLe)) return [];
      postes.delete(id);
      return [{ id }];
    });
  }

  /* ---------------------------------------------------------------- */
  /*  CE QUE LA BASE REND                                               */
  /* ---------------------------------------------------------------- */

  /* Un devis avec ce que la requête de `api.js` y joint : le nom du client
     (si la fiche est à moi — la règle d'accès du carnet), la date et le
     budget de la demande, la date de l'urgence. */
  function avecLiens(d) {
    const client = d.clientId
      ? initialClients.find((c) => String(c.id) === String(d.clientId) && String(c.proId) === String(d.proId))
      : null;
    const dem = d.quoteRequestId ? demandeDe('devis', d.quoteRequestId) : null;
    const urg = d.sosRequestId ? demandeDe('sos', d.sosRequestId) : null;
    const date = (x) => x.createdAt || dateDeDemandeDemo(x.id, maintenant());
    return {
      ...d,
      client: client ? { nom: client.nom } : null,
      demande: dem ? { createdAt: date(dem), budget: dem.budget ?? null } : null,
      urgence: urg ? { createdAt: date(urg) } : null,
    };
  }

  function ventilationDe(devisId) {
    const t = totauxDevis(lignesDe(devisId));
    return t.ok ? t.ventilation.filter((v) => v.nbLignes > 0) : [];
  }

  return {
    /** Une écriture de la file. Rejette avec l'erreur que la base rendrait. */
    async ecrire(proId, op) {
      await pause();
      if (op && op.signal && op.signal.aborted) throw annulee();
      const f = ECRITURES[`${op && op.quoi}:${op && op.action}`];
      if (!f) throw new Error(`Écriture de devis inconnue : ${op && op.quoi} / ${op && op.action}.`);
      f(proId, op);
      return true;
    },

    /** Le devis ou la ligne, tels qu'en base (numéro compris), ou `null`. */
    async relireUn(proId, { quoi, id }) {
      if (quoi === 'devis') {
        const d = devis.get(id);
        return estAMoi(d, proId) ? copie(d) : null;
      }
      const l = lignes.get(id);
      return l && estAMoi(devis.get(l.devisId), proId) ? copie(l) : null;
    },

    /** Les totaux et la ventilation (les taux qui ont des lignes), ou `null`. */
    async relireTotaux(proId, devisId) {
      const d = devis.get(devisId);
      if (!estAMoi(d, proId)) return null;
      return {
        ht: d.totalHtCentimes, tva: d.totalTvaCentimes, ttc: d.totalTtcCentimes,
        ventilation: ventilationDe(d.id), generation: d.generation, modifieLe: d.modifieLe,
      };
    },

    /** « Mes devis » : les 201 plus récents (201 : pour savoir s'il y en a plus de 200). */
    async liste(proId) {
      return trierDevis([...devis.values()].filter((d) => estAMoi(d, proId))).slice(0, PLAFOND_LISTE + 1).map(avecLiens);
    },

    /** Un devis, ses lignes (rangées par `ordre`, puis `id`) et sa ventilation. */
    async un(proId, id) {
      const d = devis.get(id);
      if (!estAMoi(d, proId)) return null;
      return { devis: avecLiens(d), lignes: trierLignes(lignesDe(id).map(copie)), ventilation: ventilationDe(id) };
    },

    /** Les devis d'une fiche du carnet : 21 au plus, pour dire « et d'autres ». */
    async duClient(proId, clientId) {
      return trierDevis([...devis.values()].filter((d) => estAMoi(d, proId) && String(d.clientId) === String(clientId)))
        .slice(0, 21).map(avecLiens);
    },

    /** Les brouillons déjà ouverts depuis une demande (« Reprendre ») : 5 au plus. */
    async deLaDemande(proId, genre, id) {
      const col = genre === 'sos' ? 'sosRequestId' : 'quoteRequestId';
      return trierDevis([...devis.values()].filter((d) => estAMoi(d, proId) && d[col] === id))
        .slice(0, 5).map((d) => ({ id: d.id, objet: d.objet, modifieLe: d.modifieLe }));
    },

    /* La base de postes (lot P) — voir plus haut. Chaque fonction prend
       l'artisan en premier, puis `{ signal, pauseMs }` en dernier : la
       pause NOMMÉE de `api.js`, et l'annulation de son délai. Leurs noms ne
       sont PAS ceux de `api.js` (`ajouterPoste`…) : ce sont les gestes de
       la BASE, et `verifier-postes` (D) cherche le nom `ajouterPoste` pour
       savoir qui, dans les écrans, range un poste. */
    lirePostes,
    ajouterUnPoste,
    modifierUnPoste,
    retirerUnPoste,

    /** La mémoire : les postes et options de MES devis, avec leur devis
     *  d'origine, la plus récente d'abord — 500 au plus. */
    async memoire(proId) {
      return [...lignes.values()]
        .filter((l) => TYPES_CHIFFRES.includes(l.type) && estAMoi(devis.get(l.devisId), proId))
        .sort(plusRecentDAbord)
        .slice(0, MEMOIRE_MAX)
        .map((l) => {
          const d = devis.get(l.devisId);
          return { ...l, devis: { id: d.id, objet: d.objet, source: d.source, modifieLe: d.modifieLe } };
        });
    },
  };
}
