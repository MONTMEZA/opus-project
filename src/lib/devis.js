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
 * CE FICHIER N'IMPORTE QUE SIX FICHIERS PURS
 * ------------------------------------------
 * `./centimes.js` (l'écriture d'un montant, la seule du projet),
 * `./entreprise.js` (pour `dateFrancaise()` et `isoLisible()` : une date
 * d'horodatage se lit à l'heure du téléphone, jamais par ses dix premiers
 * caractères — la leçon de la nuit du lot T), depuis le lot P,
 * `./rapprochement.js` (la clé de rapprochement : « Seuil » et « seuils »
 * sont la même phrase, sans `normalize`, sans table Unicode) et, depuis
 * 2b-4, `./formats.js` (pour `joursEntre()` seulement : l'avis de
 * l'attestation qui arrive à sa fin compte des jours, et l'arithmétique des
 * jours, par `Date.UTC` et sans fuseau, n'est écrite qu'à UN endroit du
 * projet — une seconde copie ici serait la faute que le projet traque ;
 * `formats.js` n'importe RIEN) et, depuis 2b-5, `./meme-valeur.js` (pour
 * `memeValeur()` : l'en-tête d'un devis porte désormais trois LISTES — les
 * déchets triés, ce qui reste sur le chantier, les lieux de dépôt —, et deux
 * listes égales ne sont jamais `Object.is` l'une à l'autre ; la règle n'est
 * écrite qu'à UN endroit, que la file d'écriture et la saisie importent
 * aussi ; `meme-valeur.js` n'importe RIEN) et, depuis 2b-6,
 * `../data/travaux-energie.js` (pour `TRAVAUX_ENERGIE` : les dix-neuf
 * travaux d'économies d'énergie que le devis coche et que les signes de
 * qualité de « Mon entreprise » couvrent, avec les MÊMES clés — une seule
 * source, que `emetteur.js` importe aussi, puisque ces deux fichiers ne
 * s'importent pas l'un l'autre ; il n'importe RIEN). Aucun des six ne charge
 * React Native : `node` fait tourner ce fichier, et un contrôle qui plante ne
 * vérifie rien. `verifier-devis` tient cette liste.
 *
 * LES NOMS
 * --------
 * Une ligne et un devis portent ici les noms de leurs colonnes, écrits en
 * camelCase (`prixUnitaireCentimes` pour `prix_unitaire_centimes`) :
 * `api.js` traduit, une fois, à l'aller et au retour.
 */
import { centimesLisibles, versCentimes } from './centimes.js';
import { dateFrancaise, isoLisible } from './entreprise.js';
import { cleDeRapprochement, aPlat } from './rapprochement.js';
import { joursEntre } from './formats.js';
import { memeValeur } from './meme-valeur.js';
import { TRAVAUX_ENERGIE } from '../data/travaux-energie.js';

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

/** LE PRIX DU DEVIS LUI-MÊME (2b-4, section 49.4 quinquies,
 *  `devis_cout_check`) : en centimes TTC, de 0 (gratuit) à 100 000
 *  (1 000,00 €) — la borne de `tarif_devis_check` des tarifs (lot T), parce
 *  que la proposition se recopie depuis « Mes tarifs » sans conversion. Vide
 *  = pas encore dit : le motif `devis_cout` (rang 12, par prudence). La même
 *  borne que la base, écrite UNE fois ici. */
export const COUT_DEVIS_MAX = 100000;

/** LES CONDITIONS DU DEVIS (lot 2a, section 49.4 bis). Un pourcentage de
 *  réduction ou d'acompte, en centièmes de point : de 0,01 % à 100 %
 *  (`devis_remise_check`, `devis_acompte_check`). */
export const POURCENT_MAX = 10000;
/** L'acompte a une NATURE, choisie à chaque devis, sans défaut : la loi ne
 *  traite pas un acompte et des arrhes pareil (C. conso. L. 214-1). */
export const NATURES_ACOMPTE = Object.freeze(['acompte', 'arrhes']);
/** La validité, en jours (`devis_validite_check`), et les durées que les
 *  pastilles proposent — rien n'est choisi d'avance (décision du 03/11). */
export const VALIDITE_MAX = 365;
export const VALIDITES_PROPOSEES = Object.freeze([15, 30, 60, 90]);

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
 * « À QUEL TITRE CE CLIENT COMMANDE » (lot 2b-2, `devis_pour_qui_check`) —
 * les quatre réponses, dans l'ORDRE PROTECTEUR de la feuille : celle qui
 * RETIRE des mentions dues à un particulier vient en DERNIER (cahier 2b-2,
 * annexe A.3 ; critique droit B3). La base garde la réponse BRUTE ; elle ne
 * vaut que pour le client à qui elle a été donnée (`pourQuiValable`).
 */
export const POUR_QUI = Object.freeze(['consommateur', 'non_professionnel', 'professionnel_hors_activite', 'professionnel']);

/**
 * Les onze contraintes de `devis_lignes`, TRIÉES PAR ORDRE ALPHABÉTIQUE
 * (dix au lot 1 ; une à 2b-3 : `devis_ligne_urgence_check`, « seul un poste
 * peut être marqué réparation urgente » — `unite` < `urgence`, elle vient en
 * DERNIER : une zone urgente ET chiffrée est nommée par
 * `devis_ligne_forme_check`, des deux côtés).
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
  'devis_ligne_urgence_check',
]);

/** Les vingt-neuf contraintes de `devis`, triées de même (dix au lot 1, sept
 *  au lot 2a, une à 2b-2 : la réponse « à quel titre » ; une à 2b-4 : le
 *  prix du devis lui-même, `devis_cout_check`, rangée entre `calculs` et
 *  `delai` — PostgreSQL nomme la première dans cet ordre, et une ligne à
 *  « −1 » ET une validité fausse est nommée `devis_cout_check` des deux
 *  côtés ; sept à 2b-5 : les déchets du chantier, `devis_dechets_…_check`,
 *  rangées entre `cout` et `delai` — « dec » vient avant « del » ; trois à
 *  2b-6 : les travaux d'énergie et le label RGE, `devis_energie_…_check`,
 *  rangées entre `delai` et `lieu` — « de » vient avant « en », et « sa »,
 *  « so », « tr » dans cet ordre).
 *  `validerDevis()` teste celles qui portent sur ce que l'artisan écrit ;
 *  `devis_plafond_check` est tenu par `totauxDevis()` ;
 *  `devis_totaux_check` et `devis_calculs_check` par la base seule. */
export const CONTRAINTES_DEVIS = Object.freeze([
  'devis_acompte_check',
  'devis_acompte_nature_check',
  'devis_acompte_une_forme_check',
  'devis_calculs_check',
  'devis_cout_check',
  'devis_dechets_cout_check',
  'devis_dechets_flux_check',
  'devis_dechets_lieux_check',
  'devis_dechets_quantite_check',
  'devis_dechets_sans_depot_check',
  'devis_dechets_sur_place_check',
  'devis_dechets_unite_check',
  'devis_delai_check',
  'devis_energie_sans_label_check',
  'devis_energie_sous_traitants_check',
  'devis_energie_travaux_check',
  'devis_lieu_adresse_check',
  'devis_lieu_code_postal_check',
  'devis_lieu_ville_check',
  'devis_objet_check',
  'devis_plafond_check',
  'devis_pour_qui_check',
  'devis_remise_check',
  'devis_remise_une_forme_check',
  'devis_retenue_check',
  'devis_source_check',
  'devis_statut_check',
  'devis_totaux_check',
  'devis_validite_check',
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
 * 5 % des acomptes ; la consignation ; la caution « personnelle et
 * solidaire » qui l'écarte) et art. 2 (rendue un an après la réception,
 * SAUF opposition motivée notifiée « à la caution ou au consignataire, par
 * lettre recommandée ») ; décret n° 71-1058, art. 1er (qui peut se porter
 * caution).
 *
 * C'EST UNE AIDE POUR L'ARTISAN, PAS LE TEXTE DU DEVIS (relecture finale
 * du lot 2a, TC-6). Ce commentaire disait « Le lot 2 l'imprimera telle
 * quelle ». Or la phrase parle à l'ARTISAN : « accepté par vous deux »,
 * « si vous fournissez une caution », « vous revient », « vos
 * obligations ». Imprimée sur un devis — que lit le CLIENT —, « vous »
 * désignerait le client : elle lui dirait que la somme retenue lui revient.
 * Le texte imprimé nommera « l'entrepreneur » et « le maître de l'ouvrage » ;
 * il s'écrit en 2c, avec le juriste, dans une constante À PART, comparée
 * mot pour mot à son tour.
 *
 * POURQUOI LE DESTINATAIRE DE L'OPPOSITION EST ÉCRIT (relecture CONTROLES-11
 * du lot 2a) : la phrase disait « sauf si le client a notifié, par lettre
 * recommandée, une opposition », sans dire À QUI. L'artisan pouvait croire
 * qu'une lettre reçue par LUI suffisait, ou qu'aucune lettre ne lui étant
 * arrivée, la somme lui revenait d'office. La loi dit l'inverse : c'est le
 * consignataire (ou la caution) qui reçoit l'opposition, et qui garde alors
 * la somme. Et la caution est « personnelle et solidaire » : une simple
 * promesse de payer ne l'écarte pas. Relu dans la version en vigueur de
 * l'art. 1er (depuis le 01/01/2020, « tribunal judiciaire ») et de l'art. 2.
 *
 * LES DEUX CAS DE L'ART. 2 (contre-vérification du lot 2a) : la fin disait
 * « Elle vous revient … sauf si le client a notifié au consignataire (ou à
 * la caution) », juste après « Elle n'est pas retenue si vous fournissez une
 * caution ». Quand il y a caution, rien n'a été retenu : rien ne « revient ».
 * La loi dit « la caution est libérée OU les sommes consignées sont versées
 * à l'entrepreneur ». La phrase nomme donc les deux : l'artisan qui la lit
 * doit la comprendre juste dans les deux cas.
 */
export const PHRASE_RETENUE = 'Retenue sur les acomptes, au plus 5\u00a0% (loi n°\u00a071-584 du 16/07/1971). '
  + 'Le client consigne la somme retenue chez un consignataire accepté par vous deux — à défaut, '
  + 'désigné par le président du tribunal. Elle n’est pas retenue si vous fournissez une caution '
  + 'personnelle et solidaire d’un montant égal (banque, établissement financier habilité ou société '
  + 'de caution mutuelle). La somme retenue vous revient (ou la caution est libérée) un an après la '
  + 'réception des travaux, sauf si le client a '
  + 'notifié au consignataire (ou à la caution), par lettre recommandée, une opposition motivée par '
  + 'l’inexécution de vos obligations.';

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
  'remiseCentiemes', 'remiseCentimes', 'acompteCentiemes', 'acompteCentimes', 'acompteNature', 'validiteJours',
  /* 2b-2 : à quel titre le client commande (la réponse, et le client à qui
     elle a été donnée), et les deux questions du chantier. La date du « Oui »
     au chantier neuf (`chantierNeufConsoLe`) n'y est PAS : la base seule la
     pose (49.7 ne l'accorde à personne). */
  'pourQui', 'pourQuiClient', 'chantierNeufConso', 'chantierNeufTva',
  /* 2b-3 : deux réponses de plus, HORS de toute paire (aucune ne viole une
     contrainte seule) — « Ces travaux peuvent-ils engager votre garantie
     décennale ? » (« Le chantier », vide = « Oui » compté par prudence) et
     « Quand le client paie-t-il cette somme ? » (« Conditions », vide ou
     faux = dès le 8e jour). Aucune date : personne ne la lirait. */
  'engageDecennale', 'acompteALaSignature',
  /* 2b-4 : le prix du devis LUI-MÊME (« Conditions », en dernier), en
     centimes TTC — vide = pas encore dit (le motif du rang 12), 0 = gratuit
     (écrit par la seule pastille « Gratuit »), un montant = payant. HORS de
     toute paire : il ne viole aucune contrainte seul, et ne lie rien. */
  'coutDevisCentimes',
  /* 2b-5 (49.4 sexies) : LES DÉCHETS DU CHANTIER, huit faits de la carte
     « Déchets » — la réponse à « S’agit-il de travaux sur un bâtiment, ou de
     jardinage ? » (vide = « Oui », par prudence), la quantité estimée et son
     unité (une PAIRE), les déchets collectés à part (une LISTE fermée, jamais
     vide : vide de valeur = rien de dit, `aucune` = aucune collecte
     séparée), ce qui reste sur le chantier (une liste, jamais vide), les
     lieux de dépôt choisis (des identifiants, jamais vide) et « Aucun
     dépôt » (une PAIRE avec eux), le coût estimé (hors des totaux). Trois
     listes : la file et la saisie les comparent par `memeValeur`, jamais
     par `Object.is`. Aucune date. */
  'dechetsConcerne', 'dechetsQuantiteMilliemes', 'dechetsUnite', 'dechetsFlux', 'dechetsSurPlace', 'dechetsLieux',
  'dechetsSansDepot', 'dechetsCoutCentimes',
  /* 2b-6 (49.4 septies) : LES TRAVAUX D'ÉNERGIE ET LE LABEL RGE, quatre faits
     de la carte « Énergie et label RGE » — les travaux d'économies d'énergie
     ou d'énergie renouvelable que ce devis comporte (une LISTE fermée,
     jamais vide : vide de valeur = rien de dit, `aucun` = « Aucun de ces
     travaux », exclusif), ceux pour lesquels l'artisan déclare, SUR CE
     DEVIS, ne pas détenir de label (une liste de clés : une déclaration ne
     vaut que pour ce qu'elle nomme), la réponse à « Une autre entreprise
     fera-t-elle une partie, ou la totalité, des travaux de ce devis ? »
     (vide = rien de dit), et les sous-traitants choisis (des identifiants,
     jamais vide). AUCUNE PAIRE (T23) : « Aucun de ces travaux » ne vide ni
     les déclarations ni les sous-traitants, décocher un travail ne retire
     pas sa déclaration, « Non » ne vide pas les sous-traitants — tout reste
     gardé, sans effet. Trois listes : la file et la saisie les comparent par
     `memeValeur`. Aucune date. */
  'energieTravaux', 'energieSansLabel', 'energieSousTraitance', 'energieSousTraitants',
]);
/** LES PAIRES qui s'écrivent ENSEMBLE, en une écriture (relecture BASE-2) :
 *  la réduction (pourcentage OU montant), l'acompte (pourcentage OU montant,
 *  et sa nature). Écrites champ par champ, l'une avant l'autre, elles
 *  passeraient par un état que la base refuse — les deux formes à la fois. */
export const PAIRES_DEVIS = Object.freeze([
  Object.freeze(['remiseCentiemes', 'remiseCentimes']),
  Object.freeze(['acompteCentiemes', 'acompteCentimes', 'acompteNature']),
  /* 2b-2 — EN FIN, jamais en tête : `PAIRES_DEVIS[0]` est lue comme la paire
     de la RÉDUCTION (le plafond, ses renvois ; critique écran E-M7). La
     réponse et le client pour lequel elle a été donnée partent ensemble :
     écrites l'une sans l'autre, une réponse arrivée seule vaudrait pour le
     client d'AVANT, ou pour personne. */
  Object.freeze(['pourQui', 'pourQuiClient']),
  /* 2b-5 — EN FIN, elles aussi. La quantité et son unité : « 2,5 » sans
     unité ne dit rien, et une unité changée sans sa quantité repartirait
     seule après une écriture d'issue inconnue (le défaut que la paire de la
     réduction a fermé au lot 2a). Les lieux et « Aucun dépôt » : la pastille
     retire les lieux cochés et cocher un lieu la retire, dans le MÊME geste
     — écrits l'un sans l'autre, un devis porterait un instant des lieux ET
     « rien ne quitte le chantier ». */
  Object.freeze(['dechetsQuantiteMilliemes', 'dechetsUnite']),
  Object.freeze(['dechetsLieux', 'dechetsSansDepot']),
]);
/* 2b-3 : `urgence` — « Réparation urgente expressément demandée par le
   client », posée par l'artisan, sur un POSTE seulement
   (`devis_ligne_urgence_check`), jamais déduite de l'origine du devis ni
   reprise d'une autre ligne. Treize champs. */
export const CHAMPS_LIGNE = Object.freeze([
  'ordre', 'type', 'designation', 'quantiteMilliemes', 'unite', 'prixUnitaireCentimes', 'tauxTvaCentiemes',
  'offert', 'mainOeuvre', 'fournitureNonComprise', 'surfaceSolMilliemes', 'surfaceMursMilliemes', 'urgence',
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
/*  LES CONDITIONS — la réduction, l'acompte (lot 2a, section 49.4 bis)  */
/* ================================================================== */

/* Les entiers de la répartition, en BigInt : le produit total × poids
   dépasse ce que JavaScript calcule exactement dès quelques millions
   d'euros (mesuré : le reste devient faux vers 3 M€ pour une réduction de
   10 %). `BigInt(0)` et non le littéral : une seule écriture, lisible par
   tout outil qui lit ce fichier. */
const ZERO = BigInt(0);
const UN = BigInt(1);
function enGrand(v) {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return Number.isSafeInteger(v) ? BigInt(v) : null;
  if (typeof v === 'string' && /^-?[0-9]+$/.test(v)) return BigInt(v);
  return null;
}

/**
 * LA RÉPARTITION AU PLUS FORT RESTE — le miroir EXACT de
 * `repartir_au_plus_fort_reste(total, poids)` (section 49.1).
 *
 * Partage `total` entre les `poids`, au centime près : chaque part reçoit
 * d'abord sa part entière, total × poids ÷ somme ; les centimes qui restent
 * vont un par un aux plus GRANDS RESTES, et à reste égal à la PREMIÈRE part
 * du tableau — les appelants passent les taux du plus fort au plus faible.
 * Une part de poids nul reste nulle.
 *
 * Les bords, écrits comme en SQL : un tableau vide rend `[]` si le total
 * est nul, `null` sinon ; une somme de poids nulle rend des zéros ; un
 * total négatif, un poids négatif ou absent, un total plus grand que la
 * somme des poids : `null`, jamais une erreur.
 *
 * Des NOMBRES en entrée rendent des nombres (chaque part est plus petite
 * que le total, donc exacte) ; un BigInt ou une chaîne de chiffres en
 * entrée rendent des BigInt — c'est ainsi qu'un cas au-delà de 2^53 se
 * compare à PostgreSQL.
 */
export function repartirAuPlusFortReste(total, poids) {
  if (!Array.isArray(poids)) return null;
  const t = enGrand(total);
  if (t === null || t < ZERO) return null;
  const p = poids.map(enGrand);
  if (p.some((x) => x === null || x < ZERO)) return null;
  const enNombres = typeof total === 'number' && poids.every((x) => typeof x === 'number');
  const rendre = (parts) => (enNombres ? parts.map(Number) : parts);
  if (p.length === 0) return t === ZERO ? [] : null;
  const somme = p.reduce((s, x) => s + x, ZERO);
  if (t > somme) return null;
  if (somme === ZERO) return rendre(p.map(() => ZERO));
  /* Tout est positif : la division entière de BigInt tronque, c'est donc
     la partie entière, comme `div()` en SQL. */
  const parts = p.map((x) => (t * x) / somme);
  const restes = p.map((x) => (t * x) % somme);
  let manque = t - parts.reduce((s, x) => s + x, ZERO);
  while (manque > ZERO) {
    let choix = -1;
    for (let i = 0; i < p.length; i += 1) {
      if (restes[i] > ZERO && (choix < 0 || restes[i] > restes[choix])) choix = i;
    }
    /* Impossible : la somme des restes vaut `manque` × somme, et chacun est
       plus petit que la somme. Écrit plutôt que de boucler. */
    if (choix < 0) return null;
    parts[choix] += UN;
    restes[choix] = ZERO;
    manque -= UN;
  }
  return rendre(parts);
}

/**
 * LA RÉDUCTION EFFECTIVE, comme `recalcule_devis()` la pose : sur le BRUT
 * (les postes ; jamais une option), `{ forme, demande, effectif, borne }`.
 *   - en MONTANT (`remiseCentimes`) : ce montant, RAMENÉ au brut s'il le
 *     dépasse — `borne` le dit, et l'écran aussi (« Ramenée à … ») : une
 *     réduction valable à la saisie dépasse le total dès qu'on retire une
 *     ligne, et la refuser empêcherait de retirer la ligne ;
 *   - en POURCENTAGE (`remiseCentiemes`, en centièmes de point) : le brut ×
 *     ce taux, au centime, demi vers le haut ; jamais plus que le brut ;
 *   - rien de demandé : `{ forme: null, demande: null, effectif: 0 }`.
 * Le montant l'emporte si les deux sont écrits, comme en SQL — mais la
 * base refuse les deux ensemble (`devis_remise_une_forme_check`), et
 * `totauxDevis` aussi. `null` pour une entrée hors des bornes.
 */
export function remiseEffective(brut, conditions = null) {
  if (!entier(brut) || brut < 0) return null;
  const c = conditions || {};
  if (present(c.remiseCentimes)) {
    const d = c.remiseCentimes;
    if (!entier(d) || d < 1) return null;
    return { forme: 'montant', demande: d, effectif: Math.min(d, brut), borne: d > brut };
  }
  if (present(c.remiseCentiemes)) {
    const d = c.remiseCentiemes;
    if (!entier(d) || d < 1 || d > POURCENT_MAX) return null;
    const e = diviserArrondi(brut * d, 10000);
    return e == null ? null : { forme: 'pourcent', demande: d, effectif: e, borne: false };
  }
  return { forme: null, demande: null, effectif: 0, borne: false };
}

/**
 * L'ACOMPTE EFFECTIF, comme `tient_le_devis()` le pose : sur le TTC HORS
 * options (une option n'est pas commandée), `{ forme, demande, effectif,
 * borne }` — en montant, ramené au TTC s'il le dépasse ; en pourcentage, au
 * centime, demi vers le haut. Jamais refusé : 2b fera d'un acompte ramené
 * un motif de refus de la remise du devis, pas la base.
 */
export function acompteEffectif(ttc, conditions = null) {
  if (!entier(ttc) || ttc < 0) return null;
  const c = conditions || {};
  if (present(c.acompteCentimes)) {
    const d = c.acompteCentimes;
    if (!entier(d) || d < 1) return null;
    return { forme: 'montant', demande: d, effectif: Math.min(d, ttc), borne: d > ttc };
  }
  if (present(c.acompteCentiemes)) {
    const d = c.acompteCentiemes;
    if (!entier(d) || d < 1 || d > POURCENT_MAX) return null;
    const e = diviserArrondi(ttc * d, 10000);
    return e == null ? null : { forme: 'pourcent', demande: d, effectif: Math.min(e, ttc), borne: false };
  }
  return { forme: null, demande: null, effectif: 0, borne: false };
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
  /* « ,5 » vaut 0,5 % : sur un pavé décimal, on tape la virgule d'abord —
     la correction C7 de `versCentimes`, portée ici au lot 2a (ECRAN-13).
     Une virgule SEULE reste refusée. */
  const m = brut.match(/^(\d*)(?:[.,](\d*))?$/);
  if (!m || !/\d/.test(brut)) {
    return {
      ok: false, centiemes: null,
      message: 'Écrivez un pourcentage avec une seule virgule : par exemple 5 ou 2,5.',
    };
  }
  const unites = (m[1] || '0').replace(/^0+(?=\d)/, '');
  const decimales = m[2] || '';
  if (decimales.length > 2) {
    return { ok: false, centiemes: null, message: 'Un pourcentage s’écrit avec deux chiffres après la virgule au plus.' };
  }
  if (unites.length > 3) {
    return { ok: false, centiemes: null, message: POURCENT_TROP_GRAND };
  }
  return { ok: true, centiemes: Number(`${unites}${decimales.padEnd(2, '0')}`), message: null };
}
const POURCENT_TROP_GRAND = 'Ce pourcentage est trop grand.';

/**
 * Le pourcentage d'une RÉDUCTION ou d'un ACOMPTE : `versCentiemes`, puis
 * les bornes de `devis_remise_check` et `devis_acompte_check` — au plus
 * 100 %, et jamais 0. « 0 » ne veut pas dire « aucune réduction » : c'est
 * le champ VIDE qui le dit, et la base refuserait 0. Les deux refus ont
 * leur phrase, à l'écran, avant tout envoi.
 */
export function versPourcentDeDevis(texte) {
  const r = versCentiemes(texte);
  if (!r.ok) {
    return r.message === POURCENT_TROP_GRAND
      ? { ok: false, centiemes: null, message: 'Un pourcentage ne dépasse pas 100 %.' }
      : r;
  }
  if (r.centiemes === null) return r;
  if (r.centiemes === 0) {
    return { ok: false, centiemes: null, message: '0 % ne s’écrit pas : pour ne rien demander, laissez le champ vide.' };
  }
  if (r.centiemes > POURCENT_MAX) {
    return { ok: false, centiemes: null, message: 'Un pourcentage ne dépasse pas 100 %.' };
  }
  return r;
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
  /* 2b-3 : `not null default false` en base — l'absence est « non ». */
  x.urgence = vrai(x.urgence);
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
  /* 2b-3 : `type = 'poste' or not urgence` — ni une option (« strictement
     nécessaire à l'urgence » s'accorde mal avec un travail que le client peut
     refuser), ni un titre, ni une réserve. La MÊME contrainte pour les trois ;
     `devis_ligne_forme_check`, elle, ne regarde pas l'urgence. */
  devis_ligne_urgence_check: (l) => (l.type === 'poste' || !l.urgence ? null : 'urgence'),
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

/* Un pourcentage de condition : un entier de 1 à 10 000. Un montant : de 1 au
   plafond. `null` passe (rien de demandé). */
const pourcentOk = (v) => !present(v) || (entier(v) && v >= 1 && v <= POURCENT_MAX);
const montantOk = (v) => !present(v) || (entier(v) && v >= 1 && v <= PLAFOND);

const REGLES_DEVIS = {
  devis_acompte_check: (d) => (!pourcentOk(d.acompteCentiemes) ? 'acompteCentiemes'
    : (!montantOk(d.acompteCentimes) ? 'acompteCentimes' : null)),
  devis_acompte_nature_check: (d) => (!present(d.acompteNature) || NATURES_ACOMPTE.includes(d.acompteNature)
    ? null : 'acompteNature'),
  devis_acompte_une_forme_check: (d) => (present(d.acompteCentiemes) && present(d.acompteCentimes)
    ? 'acompteCentimes' : null),
  devis_remise_check: (d) => (!pourcentOk(d.remiseCentiemes) ? 'remiseCentiemes'
    : (!montantOk(d.remiseCentimes) ? 'remiseCentimes' : null)),
  devis_remise_une_forme_check: (d) => (present(d.remiseCentiemes) && present(d.remiseCentimes)
    ? 'remiseCentimes' : null),
  devis_validite_check: (d) => (!present(d.validiteJours)
    || (entier(d.validiteJours) && d.validiteJours >= 1 && d.validiteJours <= VALIDITE_MAX) ? null : 'validiteJours'),
  /* 2b-4 : le prix du devis lui-même, de 0 à `COUT_DEVIS_MAX`, ou vide. Sans
     cette règle, `validerDevis` laisserait passer −1 en silence (`regle ?
     regle(x) : null`), et la démonstration accepterait ce que la base refuse
     (critique BASE-7, mesuré). */
  devis_cout_check: (d) => (!present(d.coutDevisCentimes)
    || (entier(d.coutDevisCentimes) && d.coutDevisCentimes >= 0 && d.coutDevisCentimes <= COUT_DEVIS_MAX)
    ? null : 'coutDevisCentimes'),
  /* 2b-5 (49.5) : les sept contraintes des déchets, LES MIROIRS EXACTS de la
     base — y compris ce qu'elle accepte : un doublon (`{papier,papier}`,
     `{broyage,broyage}`) passe, comme en base ; un tableau VIDE est refusé,
     comme en base (la forme `case … else false` de la section 49.5). La
     démonstration refuse ainsi ce que la base refuserait, avec le même nom.
     Elles n'ont pas à vérifier la forme d'un tableau à deux dimensions :
     un élément qui est lui-même une liste n'est dans aucune liste fermée. */
  devis_dechets_cout_check: (d) => (!present(d.dechetsCoutCentimes)
    || (entier(d.dechetsCoutCentimes) && d.dechetsCoutCentimes >= 1 && d.dechetsCoutCentimes <= COUT_DECHETS_MAX)
    ? null : 'dechetsCoutCentimes'),
  devis_dechets_flux_check: (d) => (!present(d.dechetsFlux) || fluxRecevable(d.dechetsFlux) ? null : 'dechetsFlux'),
  devis_dechets_lieux_check: (d) => (!present(d.dechetsLieux) || lieuxRecevables(d.dechetsLieux) ? null : 'dechetsLieux'),
  devis_dechets_quantite_check: (d) => (!present(d.dechetsQuantiteMilliemes)
    || (entier(d.dechetsQuantiteMilliemes) && d.dechetsQuantiteMilliemes >= 1
      && d.dechetsQuantiteMilliemes <= QUANTITE_DECHETS_MAX)
    ? null : 'dechetsQuantiteMilliemes'),
  devis_dechets_sans_depot_check: (d) => (!present(d.dechetsSansDepot) || d.dechetsSansDepot === true
    ? null : 'dechetsSansDepot'),
  devis_dechets_sur_place_check: (d) => (!present(d.dechetsSurPlace) || surPlaceRecevable(d.dechetsSurPlace)
    ? null : 'dechetsSurPlace'),
  devis_dechets_unite_check: (d) => (!present(d.dechetsUnite) || UNITES_DECHETS.some((u) => u.cle === d.dechetsUnite)
    ? null : 'dechetsUnite'),
  devis_delai_check: (d) => (!present(d.delaiExecution) || longueur(d.delaiExecution) <= LONGUEURS.delaiExecution
    ? null : 'delaiExecution'),
  /* 2b-6 (49.5) : les trois contraintes des travaux d'énergie, LES MIROIRS
     EXACTS de la base — un tableau VIDE refusé (la forme `case … else
     false`), `aucun` seul ou absent, une clé hors de la liste refusée, un
     doublon accepté (le rang 14 compte les travaux DISTINCTS). */
  devis_energie_sans_label_check: (d) => (!present(d.energieSansLabel) || sansLabelRecevable(d.energieSansLabel)
    ? null : 'energieSansLabel'),
  devis_energie_sous_traitants_check: (d) => (!present(d.energieSousTraitants)
    || sousTraitantsRecevables(d.energieSousTraitants) ? null : 'energieSousTraitants'),
  devis_energie_travaux_check: (d) => (!present(d.energieTravaux) || travauxRecevables(d.energieTravaux)
    ? null : 'energieTravaux'),
  devis_lieu_adresse_check: (d) => (!present(d.lieuAdresse) || longueur(d.lieuAdresse) <= LONGUEURS.lieuAdresse
    ? null : 'lieuAdresse'),
  devis_lieu_code_postal_check: (d) => (!present(d.lieuCodePostal) || /^[0-9]{5}$/.test(d.lieuCodePostal)
    ? null : 'lieuCodePostal'),
  devis_lieu_ville_check: (d) => (!present(d.lieuVille) || longueur(d.lieuVille) <= LONGUEURS.lieuVille
    ? null : 'lieuVille'),
  devis_objet_check: (d) => (!present(d.objet) || longueur(d.objet) <= LONGUEURS.objet ? null : 'objet'),
  devis_pour_qui_check: (d) => (!present(d.pourQui) || POUR_QUI.includes(d.pourQui) ? null : 'pourQui'),
  devis_retenue_check: (d) => (!present(d.retenueGarantieCentiemes)
    || (entier(d.retenueGarantieCentiemes) && d.retenueGarantieCentiemes >= 1 && d.retenueGarantieCentiemes <= RETENUE_MAX)
    ? null : 'retenueGarantieCentiemes'),
  devis_source_check: (d) => (SOURCES.includes(d.source) ? null : 'source'),
  devis_statut_check: (d) => (STATUTS.includes(d.statut) ? null : 'statut'),
};

/** Un devis est-il recevable ? `{ ok, contrainte, champ }`, sur l'objet, le
 *  lieu, le délai, la retenue et les conditions (lot 2a) — dans l'ordre
 *  alphabétique des contraintes. */
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
    const e = parTaux.get(l.tauxTvaCentiemes) || { taux: l.tauxTvaCentiemes, base: 0, remise: 0, tva: null, nbLignes: 0 };
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

/* Les contraintes de `devis` que le CALCUL lit, ou qui accompagnent ce qu'il
   lit — dans l'ordre alphabétique, comme `CONTRAINTES_DEVIS`. */
const CONTRAINTES_DES_CONDITIONS = Object.freeze(CONTRAINTES_DEVIS.filter((n) => [
  'devis_acompte_check', 'devis_acompte_nature_check', 'devis_acompte_une_forme_check',
  'devis_remise_check', 'devis_remise_une_forme_check', 'devis_validite_check',
].includes(n)));

/**
 * Les totaux d'un devis : `{ ok: true, brut, ht, tva, ttc, ventilation,
 * options, reduction, acompte, ttcOptions }`, ou `{ ok: false, contrainte,
 * champ, ligneId }`.
 *
 * `conditions` (lot 2a) : la réduction et l'acompte du devis, tels qu'ils
 * sont rangés (`remiseCentiemes` ou `remiseCentimes`, `acompteCentiemes`
 * ou `acompteCentimes`). Sans eux, rien ne change au calcul du lot 1 : les
 * 44 premiers cas communs le prouvent.
 *
 * LE CALCUL, dans l'ordre de `recalcule_devis()` puis `tient_le_devis()` :
 *   1. le BRUT par taux (les postes seulement ; une ligne offerte compte 0) ;
 *      refusé, comme par `devis_plafond_check`, au-delà de 99 999 999,99 € :
 *      le HT est borné sur le BRUT, avant la réduction — des lignes qui
 *      dépassent la borne n'y passent pas grâce à une réduction. Le TTC (3)
 *      et le total toutes options (4), eux, sont bornés NETS de la réduction,
 *      comme dans la base : une réduction peut faire tenir sous la borne un
 *      TTC qui, sans elle, la dépasserait, et la retirer (ou la baisser) est
 *      alors REFUSÉ — c'est juste, un devis ne dépasse pas 99 999 999,99 €,
 *      avec ou sans réduction. Cette ligne disait « une réduction
 *      contournerait le plafond » : c'était vrai du HT seul (relecture BASE-4
 *      du lot 2a) ;
 *   2. la RÉDUCTION effective (`remiseEffective`), répartie entre les taux
 *      AU PLUS FORT RESTE, au prorata des bruts, du taux le plus fort au plus
 *      faible ; la base de chaque taux est NETTE de sa part
 *      (`ventilation[i].remise`), et sa TVA se calcule sur ce net, une fois
 *      par taux ;
 *   3. HT = brut − réduction ; TVA = somme des TVA ; TTC = les deux ;
 *   4. le TOTAL TOUTES OPTIONS COMPRISES (`ttcOptions`) : sur l'UNION des
 *      bases nettes et des options, taux par taux, la TVA arrondie une fois
 *      par taux — jamais l'addition de deux totaux (une option de 33,33 € à
 *      10 % coûte 36,66 € seule, mais 36,67 € de plus sur le devis, C05b) ;
 *      la réduction ne porte jamais sur une option ;
 *   5. l'ACOMPTE effectif (`acompteEffectif`), sur le TTC HORS options.
 *
 * LES OPTIONS NE SONT PAS DANS LE TTC : elles ne sont pas commandées tant
 * que le client ne les a pas choisies. `ttcOptions` dit ce que coûterait le
 * devis s'il les prenait toutes — c'est ce qu'il faut savoir avant de
 * dépasser un plafond, ou un budget.
 */
export function totauxDevis(lignes, conditions = null) {
  const tri = trierLignes(lignes);
  for (const l of tri) {
    const v = validerLigne(l);
    if (!v.ok) return { ok: false, contrainte: v.contrainte, champ: v.champ, ligneId: l.id ?? null };
  }
  if (conditions) {
    for (const nom of CONTRAINTES_DES_CONDITIONS) {
      const champ = REGLES_DEVIS[nom](conditions);
      if (champ) return { ok: false, contrainte: nom, champ, ligneId: null };
    }
  }
  const refus = { ok: false, contrainte: 'devis_plafond_check', champ: null, ligneId: null };
  const ventilation = regrouperParTaux(tri);
  const brut = ventilation.reduce((s, e) => s + e.base, 0);
  /* Le BRUT d'abord : sous le plafond, chaque base × taux reste un entier exact. */
  if (brut > PLAFOND) return refus;
  const reduction = remiseEffective(brut, conditions);
  const parts = repartirAuPlusFortReste(reduction.effectif, ventilation.map((e) => e.base));
  ventilation.forEach((e, i) => { e.remise = parts[i]; e.base -= parts[i]; });
  poserLaTva(ventilation);
  const ht = brut - reduction.effectif;
  const tva = ventilation.reduce((s, e) => s + e.tva, 0);
  const ttc = ht + tva;
  if (ttc > PLAFOND) return refus;
  const options = tri.filter((l) => l.type === 'option').map((l) => ({
    id: l.id ?? null, designation: l.designation ?? null, total: totalLigne(l), taux: l.tauxTvaCentiemes,
  }));
  /* L'union, taux par taux. La somme des bases d'abord : sous le plafond,
     chaque TVA reste exacte ; au-dessus, le total toutes options le
     dépasserait de toute façon (il vaut au moins cette somme). */
  const union = new Map(ventilation.map((e) => [e.taux, e.base]));
  options.forEach((o) => union.set(o.taux, (union.get(o.taux) || 0) + o.total));
  if ([...union.values()].reduce((s, b) => s + b, 0) > PLAFOND) return refus;
  const ttcOptions = [...union].reduce((s, [taux, base]) => s + base + tvaDe(base, taux), 0);
  if (ttcOptions > PLAFOND) return refus;
  const acompte = acompteEffectif(ttc, conditions);
  return { ok: true, brut, ht, tva, ttc, ventilation, options, reduction, acompte, ttcOptions };
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
    && !vrai(l.offert) && !vrai(l.mainOeuvre) && !vrai(l.fournitureNonComprise)
    /* 2b-3 : comme les trois autres interrupteurs — une ligne où l'on n'a
       touché QUE « Réparation urgente » ne disparaît pas sans un mot : elle
       reste « incomplète », et la garde de sortie le dit. */
    && !vrai(l.urgence);
}

/** Ce qu'une rangée de la LISTE du devis reçoit — et rien d'autre. Quinze
 *  propriétés depuis 2b-3 : `urgence`, pour « · réparation urgente » (la
 *  liste est l'écran qu'on montre à un client, et l'urgence S'IMPRIMERA sur
 *  le devis remis, en 2c : la montrer n'en dit pas plus). */
export const PROPRIETES_DE_LA_RANGEE = Object.freeze([
  'id', 'type', 'designation', 'total', 'offert', 'fournitureNonComprise', 'urgence', 'quantite', 'unite', 'prix',
  'sousTotal', 'etat', 'erreurTexte', 'incomplete', 'definitif',
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
 *     saisie (`'en_cours'`, `'echec'`, `'locale'`…) ;
 *   - `definitifs` : par identifiant, ce qui est refusé DÉFINITIVEMENT
 *     (`refusDeLaLigne` : `'ligne'` ou `'brouillon'`) — la rangée ne propose
 *     alors plus « Réessayer », qui échouerait à l'identique (reprise
 *     « écran » du lot 2a, point 1). Il ne vaut que pour une rangée en échec.
 *     (Pas « refus » : la clé serait lue comme une référence par le contrôle
 *     de Q3 a, qui cherche « réf » dans tout ce que rend la rangée.)
 */
export function proprietesDeLaRangee(l, {
  sousTotaux: sous = {}, etats = {}, erreurs = {}, phrasesEchec = {}, definitifs = {},
} = {}) {
  const etat = (etats && etats[l.id]) || null;
  return {
    id: l.id,
    type: l.type,
    designation: l.designation,
    total: totalLigne(l),
    offert: !!l.offert,
    fournitureNonComprise: !!l.fournitureNonComprise,
    urgence: !!l.urgence,
    quantite: l.quantiteMilliemes,
    unite: l.unite,
    prix: l.prixUnitaireCentimes,
    sousTotal: NIVEAU[l.type] && sous ? (sous[l.id] ?? null) : null,
    etat,
    erreurTexte: etat === 'echec' ? ((phrasesEchec && phrasesEchec[l.id]) || null) : null,
    incomplete: !!(erreurs && erreurs[l.id]) || etat === 'locale',
    definitif: etat === 'echec' && definitifs && (definitifs[l.id] === 'ligne' || definitifs[l.id] === 'brouillon')
      ? definitifs[l.id] : null,
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
  const motsCle = motsDe(cle);
  return { plat, motsPlat: motsDe(plat), cle, motsCle: new Set(motsCle), motsCleListe: motsCle };
}
/* Le texte TAPÉ, préparé une fois par recherche : ses mots à plat, la clé
   de chacun (le même mot privé de son pluriel), et la clé du texte entier. */
function tapeDe(texte) {
  const t = aPlat(texte) || '';
  const mots = motsDe(t);
  return { t, mots, cles: mots.map((w) => cleDeRapprochement(w) || ''), cle: cleDeRapprochement(texte) || '' };
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
/* LE DEGRÉ SE MESURE AUSSI SANS LES PLURIELS — corrigé le 25/10/2026, sur la
   vraie base. « creation de la dalles » trouvait bien « Création de la dalle
   en béton… », mais par sa clé seulement (degré 1) : « CREATION DES DALLES
   EN BETON… », une AUTRE phrase, contenait toutes les lettres tapées (degré
   2) et passait devant. Un « s » de trop rangeait la bonne phrase derrière
   une voisine — exactement ce que le propriétaire demandait d'éviter. Les
   degrés 4 et 3 se lisent donc deux fois : sur les phrases à plat, puis sur
   leurs CLÉS (la même règle que `cleDeRapprochement`). Le degré ne fait que
   RANGER ce que `correspond` a déjà trouvé : il n'ajoute aucune proposition. */
function degre(f, tape) {
  if (!correspond(f, tape)) return 0;
  if (f.plat.startsWith(tape.t) || (tape.cle && f.cle && f.cle.startsWith(tape.cle))) return 4;
  if (tape.mots.every((w) => f.motsPlat.some((m) => m.startsWith(w)))) return 3;
  if (tape.cles.every((k) => k && f.motsCleListe.some((m) => m.startsWith(k)))) return 3;
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
/** Le degré de pertinence, pour ranger les propositions : 4, la phrase
 *  COMMENCE par le texte tapé (à plat, ou les deux privés de leurs
 *  pluriels) ; 3, chaque mot tapé commence un mot de la phrase (à plat, ou
 *  privés de leurs pluriels) ; 2, chaque mot tapé y est contenu ; 1, trouvée
 *  par le pluriel seulement ; 0, non trouvée. « Pos » met « Pose de… » (4)
 *  devant « Dépose de… » (2) ; « Dalles » met « Dalle béton » au degré 4. */
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
 * « Faire un devis » sur une demande acceptée : le LIEN D'ORIGINE, et rien
 * d'autre. Ni client (le client d'une demande est un COMPTE, celui d'un
 * devis une FICHE du carnet, D1), ni lieu, ni objet. `null` pour un rappel,
 * qui n'a pas de lien d'origine.
 *
 * L'OBJET N'EST PLUS LE TEXTE DE LA DEMANDE — décision du propriétaire,
 * 29/10/2026, après l'avoir essayé : « dans objet il y a écrit le texte de
 * la demande ». L'objet s'imprimera sur le devis ; c'est l'artisan qui
 * l'écrit. Le texte du client reste AFFICHÉ au-dessus (« Ce que le client a
 * demandé », `texteDeLaDemande`), lu par le lien, jamais recopié.
 */
export function devisDepuisDemande(d) {
  if (!d || !d.id) return null;
  if (d.genre === 'devis') return { source: 'demande', quoteRequestId: d.id };
  if (d.genre === 'sos') return { source: 'urgence', sosRequestId: d.id };
  return null;
}

/* Une copie dans un champ du devis est bornée comme la base la borne (au
   caractère près) : au-delà, le brouillon ne se créerait pas — la leçon de
   l'objet trop long (relecture « données » des étapes 4 à 7, I5). */
const borne = (v, max) => {
  const net = texteNet(v);
  if (!net) return null;
  const c = [...net];
  return c.length > max ? `${c.slice(0, max - 1).join('')}…` : net;
};

/**
 * « Faire un devis » sur une demande, LA FICHE DU CLIENT TROUVÉE OU CRÉÉE
 * (décision du propriétaire, 29/10/2026 : « créer un client avec toutes les
 * informations de la personne, et ensuite le diriger sur le devis »).
 *
 * Le lien d'origine est GARDÉ — `devisDepuisClient` dirait `'manuelle'`, et
 * la composition dans l'autre sens ferait perdre « depuis une demande du … »
 * sans la moindre erreur. Le LIEU DES TRAVAUX est ce que le client a écrit
 * dans sa demande (le chantier) ; à défaut, l'adresse de la fiche. Un code
 * postal qui n'a pas cinq chiffres n'est pas un code postal : il n'est pas
 * repris.
 */
export function devisDepuisDemandeEtFiche(d, fiche = null, lieu = {}) {
  const base = devisDepuisDemande(d);
  if (!base) return null;
  const v = { ...base };
  if (fiche && fiche.id) v.clientId = fiche.id;
  const source = (lieu && (lieu.adresse || lieu.codePostal || lieu.ville))
    ? lieu
    : { adresse: fiche && fiche.adresse, codePostal: fiche && fiche.codePostal, ville: fiche && fiche.ville };
  const cp = texteNet(source.codePostal);
  const l = {
    lieuAdresse: borne(source.adresse, LONGUEURS.lieuAdresse),
    lieuCodePostal: cp && /^[0-9]{5}$/.test(cp) ? cp : null,
    lieuVille: borne(source.ville, LONGUEURS.lieuVille),
  };
  Object.keys(l).forEach((k) => { if (l[k]) v[k] = l[k]; });
  return v;
}

/** Ce qu'une URGENCE dit d'elle-même : le problème choisi dans la liste ET
 *  ce que la personne a écrit (`sos_requests.details`). UNE écriture, pour
 *  l'ouverture depuis « Pour moi » comme pour la relecture du devis
 *  (relecture du 29/10/2026 : les deux ne lisaient pas la même colonne, et
 *  « Le disjoncteur saute dès qu'on branche le four » n'apparaissait
 *  nulle part). */
export function texteDUrgence({ libelle = null, details = null } = {}) {
  const l = texteNet(libelle);
  const d = texteNet(details);
  if (l && d) return `${l} — ${d}`;
  return l || d || null;
}

/* CE QUE LA REQUÊTE D'UN DEVIS Y JOINT. La liste de « Mes devis » n'a besoin
   que des dates et du budget ; un devis OUVERT montre aussi ce que le client
   a demandé (« Ce que le client a demandé », 29/10/2026) : la description de
   la demande, le problème de l'urgence et ce que la personne a écrit — lus
   par le lien, jamais rangés dans le devis. Écrits ICI, avec leur lecture
   (`originesDuDevis`), pour que `verifier-devis` FASSE TOURNER la lecture :
   un devis ouvert sans ces colonnes, ou une lecture qui prenait le budget
   pour le texte, passaient tous les contrôles (relecture des contrôles du
   29/10/2026, sabotages F16 et F17). */
export const LIENS_DU_DEVIS = '*, client:client_id(nom), demande:quote_request_id(created_at, budget), '
  + 'urgence:sos_request_id(created_at)';
/* 2b-2 : le devis OUVERT lit aussi le TYPE et le SIRET de la fiche — le
   type choisit la PHRASE de la proposition « à titre privé » (jamais la
   réponse : rien n'est déduit de `clients.type`, décision du 09/11), le SIRET
   nourrit un AVIS. La liste « Mes devis » n'en a pas besoin. */
export const LIENS_DU_DEVIS_OUVERT = '*, client:client_id(nom, type, siret), demande:quote_request_id(created_at, budget, description), '
  + 'urgence:sos_request_id(created_at, probleme_label, details)';

/** La demande et l'urgence jointes à un devis de la base, aux noms de
 *  l'application : leur date, le budget écrit par le client, et le TEXTE —
 *  la description de la demande, ou « problème — ce qu'elle a écrit » pour
 *  une urgence. Une colonne absente (la liste ne la demande pas) vaut `null`. */
export function originesDuDevis(d) {
  const demande = d && d.demande;
  const urgence = d && d.urgence;
  return {
    demande: demande ? {
      createdAt: demande.created_at ?? null,
      budget: demande.budget ?? null,
      texte: demande.description ?? null,
    } : null,
    urgence: urgence ? {
      createdAt: urgence.created_at ?? null,
      texte: texteDUrgence({ libelle: urgence.probleme_label, details: urgence.details }),
    } : null,
  };
}

/** Ce que le client a demandé, pour l'en-tête du devis — le texte de sa
 *  demande ou le problème de son urgence. Lu par le lien d'origine, JAMAIS
 *  rangé dans le devis : la demande effacée, il disparaît avec elle. */
export function texteDeLaDemande(devis) {
  if (!devis) return null;
  if (devis.quoteRequestId && devis.demande) return texteNet(devis.demande.texte);
  if (devis.sosRequestId && devis.urgence) return texteNet(devis.urgence.texte);
  return null;
}

/* ==========================================================================
   LE DEVIS TEL QUE LA BASE LE REND — `rowToDevis` et `totauxDepuisBase`,
   déménagées d'`api.js` sans rien changer à ce qu'elles font (relecture
   CONTROLES-5 du lot 2a). `api.js` charge Supabase : `node` ne savait pas
   les ouvrir, et la lecture des CONDITIONS par la vraie base n'était
   éprouvée que par la démonstration — trois défauts remis à la main
   (l'acompte effectif retiré du `select`, la validité non relue, l'acompte
   relu dans la colonne du total toutes options comprises) passaient au
   vert, sur la vraie base seulement. Ici, `verifier-devis` les FAIT
   TOURNER sur une ligne fabriquée comme PostgREST la rend, et compare le
   `select` aux colonnes qu'elles lisent, dans les deux sens.
   ========================================================================== */

/* Un nombre de la base (un `bigint` arrive en nombre JSON, exact jusqu'à
   2^53 — les montants s'arrêtent à 10^10, les numéros d'écriture à 2^53 − 1).
   La MÊME écriture que celle d'`api.js`, qui la garde pour ses autres
   lectures : `verifier-devis` compare les deux. */
const nombreOuNul = (v) => (v === null || v === undefined ? null : Number(v));

/** Un devis de la base, aux noms de l'application — avec ce que la requête y
 *  a joint : le nom du client, la date et le budget de la demande, la date
 *  de l'urgence. */
export function rowToDevis(d) {
  if (!d) return null;
  return {
    id: d.id,
    proId: d.pro_id,
    clientId: d.client_id ?? null,
    quoteRequestId: d.quote_request_id ?? null,
    sosRequestId: d.sos_request_id ?? null,
    source: d.source,
    statut: d.statut,
    objet: d.objet ?? null,
    lieuAdresse: d.lieu_adresse ?? null,
    lieuCodePostal: d.lieu_code_postal ?? null,
    lieuVille: d.lieu_ville ?? null,
    delaiExecution: d.delai_execution ?? null,
    retenueGarantieCentiemes: nombreOuNul(d.retenue_garantie_centiemes),
    /* LES CONDITIONS (lot 2a), relues comme le reste : un devis rouvert dont
       on a retiré la réduction doit la montrer retirée — sans ces lignes,
       la file la croirait toujours là, et l'annoncerait enregistrée. */
    remiseCentiemes: nombreOuNul(d.remise_centiemes),
    remiseCentimes: nombreOuNul(d.remise_centimes),
    acompteCentiemes: nombreOuNul(d.acompte_centiemes),
    acompteCentimes: nombreOuNul(d.acompte_centimes),
    acompteNature: d.acompte_nature ?? null,
    validiteJours: nombreOuNul(d.validite_jours),
    totalHtCentimes: nombreOuNul(d.total_ht_centimes),
    totalTvaCentimes: nombreOuNul(d.total_tva_centimes),
    totalTtcCentimes: nombreOuNul(d.total_ttc_centimes),
    /* Ce que la BASE a calculé des conditions : la réduction effective, l'acompte
       effectif, le total toutes options comprises. Jamais envoyés. */
    remiseHtCentimes: nombreOuNul(d.remise_ht_centimes),
    acompteTtcCentimes: nombreOuNul(d.acompte_ttc_centimes),
    totalTtcOptionsCentimes: nombreOuNul(d.total_ttc_options_centimes),
    /* « À QUEL TITRE » ET « LE CHANTIER » (2b-2, 49.4 ter), relus tels que
       la base les garde : la réponse BRUTE et le client pour lequel elle a
       été donnée (elle ne vaut que pour lui : `pourQuiValable`), les deux
       questions du chantier, et la date du « Oui », que la base seule pose. */
    pourQui: d.pour_qui ?? null,
    pourQuiClient: d.pour_qui_client ?? null,
    chantierNeufConso: d.chantier_neuf_conso ?? null,
    chantierNeufConsoLe: d.chantier_neuf_conso_le ?? null,
    chantierNeufTva: d.chantier_neuf_tva ?? null,
    /* 2b-3 (49.4 quater) : la question de la décennale (vide = « Oui », par
       prudence) et le moment où le client paie l'acompte (vide = le 8e
       jour). Relues telles que la base les garde, `null` compris. */
    engageDecennale: d.engage_decennale ?? null,
    acompteALaSignature: d.acompte_a_la_signature ?? null,
    /* 2b-4 (49.4 quinquies) : le prix du devis lui-même, en centimes TTC —
       `null` (pas dit), 0 (gratuit) ou un montant (payant). Un `bigint`
       arrive en nombre ; `nombreOuNul` garde le 0, qui n'est PAS un vide. */
    coutDevisCentimes: nombreOuNul(d.cout_devis_centimes),
    /* 2b-5 (49.4 sexies) : les déchets du chantier, relus tels que la base
       les garde — `null` compris (vide de valeur = rien de dit). Les trois
       listes arrivent en tableaux (PostgREST rend un `text[]` et un `uuid[]`
       en tableaux JSON, les identifiants en minuscules) ; deux `bigint`
       arrivent en nombres. */
    dechetsConcerne: d.dechets_concerne ?? null,
    dechetsQuantiteMilliemes: nombreOuNul(d.dechets_quantite_milliemes),
    dechetsUnite: d.dechets_unite ?? null,
    dechetsFlux: d.dechets_flux ?? null,
    dechetsSurPlace: d.dechets_sur_place ?? null,
    dechetsLieux: d.dechets_lieux ?? null,
    dechetsSansDepot: d.dechets_sans_depot ?? null,
    dechetsCoutCentimes: nombreOuNul(d.dechets_cout_centimes),
    /* 2b-6 (49.4 septies) : les travaux d'énergie et le label RGE, relus tels
       que la base les garde — `null` compris (vide de valeur = rien de dit).
       Les trois listes arrivent en tableaux (un `text[]` et un `uuid[]`,
       les identifiants en minuscules), la réponse en booléen. */
    energieTravaux: d.energie_travaux ?? null,
    energieSansLabel: d.energie_sans_label ?? null,
    energieSousTraitance: d.energie_sous_traitance ?? null,
    energieSousTraitants: d.energie_sous_traitants ?? null,
    generation: nombreOuNul(d.generation),
    createdAt: d.created_at ?? null,
    modifieLe: d.modifie_le ?? null,
    /* Le TYPE et le SIRET de la fiche, SANS valeur par défaut : un type que
       la requête n'a pas joint (« Mes devis ») reste `null` — inconnu —,
       jamais « particulier » (le `|| 'particulier'` de `rowToClient` ferait
       PROPOSER « à titre privé » à une entreprise ; piège B.6 du cahier). */
    client: d.client ? { nom: d.client.nom ?? null, type: d.client.type ?? null, siret: d.client.siret ?? null } : null,
    /* Le TEXTE de la demande (sa description) et le problème de l'urgence
       n'arrivent qu'avec `unDevis` (`LIENS_DU_DEVIS_OUVERT`) : l'en-tête de la
       saisie les affiche, jamais recopiés dans le devis (29/10/2026). La
       lecture vit dans `devis.js`, que `verifier-devis` fait tourner. */
    ...originesDuDevis(d),
  };
}

/* La ventilation telle que la base l'a calculée : les taux qui ont des
   lignes (un taux disparu reste à zéro dans `devis_tva`, faute de pouvoir
   y écrire `delete`), du plus fort au plus faible. */
export function totauxDepuisBase(d) {
  const ht = nombreOuNul(d.total_ht_centimes);
  const reduction = nombreOuNul(d.remise_ht_centimes);
  return {
    ht,
    tva: nombreOuNul(d.total_tva_centimes),
    ttc: nombreOuNul(d.total_ttc_centimes),
    /* Les conditions telles que la BASE les a calculées (lot 2a) : la
       réduction et l'acompte EFFECTIFS — ramenés au total quand ils le
       dépassent —, le brut, et le total toutes options comprises. */
    reduction,
    brut: ht === null || reduction === null ? null : ht + reduction,
    acompte: nombreOuNul(d.acompte_ttc_centimes),
    ttcOptions: nombreOuNul(d.total_ttc_options_centimes),
    /* LA DEMANDE QUE LA BASE A VUE, relue AVEC les totaux (relecture ÉCRAN-1
       du lot 2a) : la carte « Conditions » ne dit « Ramenée à … » que contre
       ELLE. Comparée à la demande de l'écran — changée AVANT l'envoi —, une
       réduction encore en route se lisait « ramenée à 0,00 € », et pour
       toujours après un envoi raté. Les quatre colonnes sont dans le
       `select` de `relireTotauxDevisSupabase` : `verifier-devis` compare les
       deux listes. */
    demande: {
      remiseCentimes: nombreOuNul(d.remise_centimes),
      remiseCentiemes: nombreOuNul(d.remise_centiemes),
      acompteCentimes: nombreOuNul(d.acompte_centimes),
      acompteCentiemes: nombreOuNul(d.acompte_centiemes),
      /* …et ce qui NOMME les rangées, relu dans la même photo : la nature de
         l'acompte et la retenue (contre-vérification du lot 2a — après une
         écriture ratée, la rangée disait « Arrhes » quand la base avait
         gardé un acompte). La forme de `demandeDuDevis` (devis.js). */
      acompteNature: d.acompte_nature === 'acompte' || d.acompte_nature === 'arrhes' ? d.acompte_nature : null,
      retenueGarantieCentiemes: nombreOuNul(d.retenue_garantie_centiemes),
      /* …et « À QUEL TITRE » ET « LE CHANTIER » TELS QUE LA BASE LES A VUS
         (2b-2, cahier §3.3 et §3.6) : la sous-partie « Mentions dues à un
         particulier » dit la phrase de la réponse que la base a COMPTÉE, dans
         la même photo que la liste — jamais celle de l'écran, en avance d'un
         envoi. Le client y est, pour juger la réponse valable. La forme de
         `demandeDuDevis`. */
      clientId: d.client_id ?? null,
      pourQui: d.pour_qui ?? null,
      pourQuiClient: d.pour_qui_client ?? null,
      chantierNeufConso: d.chantier_neuf_conso ?? null,
      chantierNeufConsoLe: d.chantier_neuf_conso_le ?? null,
      chantierNeufTva: d.chantier_neuf_tva ?? null,
    },
    generation: nombreOuNul(d.generation),
    /* L'heure de la BASE, pour ranger la carte dans « Mes devis » : sans
       elle, la carte était datée à l'heure du téléphone (relecture
       « données » des étapes 4 à 7, mineur 6). */
    modifieLe: d.modifie_le ?? null,
    ventilation: (d.devis_tva || [])
      .filter((t) => Number(t.nb_lignes) > 0)
      .map((t) => ({
        taux: Number(t.taux_tva_centiemes), base: Number(t.base_centimes),
        remise: Number(t.remise_centimes ?? 0), tva: Number(t.tva_centimes), nbLignes: Number(t.nb_lignes),
      }))
      .sort((a, b) => b.taux - a.taux),
  };
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
  /* Une ligne sans taux encore (incomplète, pas enregistrée) ne contredit rien.
     La règle de chaque ligne est `ligneContreditLeRegime` (plus bas) : UNE
     écriture, que les motifs `devis_taux_franchise` et `devis_taux_sans_tva`
     (lot 2b-1) lisent aussi —
     cette phrase et la liste « Ce qu'il manque » ne doivent jamais se
     contredire. */
  if (regime === 'franchise' && chiffrees.some((l) => ligneContreditLeRegime(l, 'franchise'))) {
    return 'Vous êtes déclaré en franchise de TVA, mais des lignes portent un taux de TVA : en franchise, '
      + 'vous n’en facturez pas. Corrigez ces lignes, ou votre régime dans « Mon entreprise ».';
  }
  if (regime === 'reel' && chiffrees.some((l) => ligneContreditLeRegime(l, 'reel'))) {
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

/**
 * LES LIBELLÉS DES TOTAUX — la seule source du pied, de la ventilation et
 * de la carte « Conditions » (cahier du lot 2, §2.7, règle C2 du lot 1).
 *
 * L'écran ne NOMME la taxe qu'au régime réel. En franchise, en lecture, en
 * échec ou non déclaré, « Total », sans « HT », sans « TTC » et sans
 * « TVA » : un régime qu'on n'a pas pu lire ne permet pas de dire qu'il y a
 * une TVA, et un artisan en franchise n'en facture pas.
 *
 * Le rabais s'appelle « Réduction » (décision du 03/11) : « remise » veut
 * déjà dire « remettre le devis au client », et la remise en avant d'une
 * publication.
 */
export function libellesDesTotaux(etatRegime) {
  const reel = regimeConnu(etatRegime) === 'reel';
  return Object.freeze(reel ? {
    taxe: true,
    brut: 'Total HT avant réduction',
    reduction: 'Réduction',
    net: 'Total HT',
    tva: 'TVA',
    total: 'Total TTC',
    totalOptions: 'Total TTC, options comprises',
    unite: 'TTC',
    option: 'HT',
  } : {
    taxe: false,
    brut: 'Total avant réduction',
    reduction: 'Réduction',
    net: null,
    tva: null,
    total: 'Total',
    totalOptions: 'Total, options comprises',
    unite: null,
    option: null,
  });
}

/* ================================================================== */
/*  CE QUE L'ÉCRAN MONTRE DES CONDITIONS (lot 2a)                      */
/* ================================================================== */

/* LES PHRASES DE LA CARTE « CONDITIONS » QUI PORTENT DU DROIT — écrites
   UNE fois, ici. Les articles ont été relus dans les données LEGI de la
   DILA (la base dont Légifrance est tirée) : le dump local du 17/10/2026,
   et ses différentiels jusqu'au 02/11/2026, où aucun article cité n'a
   changé. PAS sur Légifrance en direct : le site répond 403 depuis le
   conteneur de travail, et la relecture « avec le navigateur du
   propriétaire » reste à faire (docs/A-FAIRE.md). Rien n'a été revérifié
   après le 02/11.
   (Ce commentaire disait « relues sur Légifrance le 03/11/2026 » : c'était
   faux — relecture finale du lot 2a, TC-5.)
   Ce sont des AIDES pour l'artisan : le texte qui s'imprimera sur le devis
   s'écrit en 2c, avec le juriste (DROIT-10). */

/** Code de la consommation, art. L. 214-1 : « Sauf stipulation contraire
 *  […], les sommes versées d'avance sont des arrhes […]. Dans ce cas, chacun
 *  des contractants peut revenir sur son engagement, le consommateur en
 *  perdant les arrhes, le professionnel en les restituant au double. »
 *
 *  DEUX RÉSERVES, dites depuis la relecture CONTROLES-9 du lot 2a :
 *  - LA PRÉSOMPTION D'ARRHES N'EST PAS UNE CERTITUDE pour un devis du
 *    bâtiment. L. 214-3 écarte tout ce chapitre pour les « commandes
 *    spéciales sur devis » ; l'administration (service-public.fr, fiche
 *    F31144) l'applique pourtant aux devis de travaux. L'aide dit donc
 *    « l'administration considère », pas « vaut » : c'est une position,
 *    pas la loi. La question est posée au juriste (docs/A-FAIRE.md,
 *    « Après le lot 2a ») avant le texte IMPRIMÉ (2c) ;
 *  - HORS DES LOCAUX OU À DISTANCE, la rétractation passe AVANT : 14 jours
 *    (L. 221-18), et tout ce qui a été versé est rendu, acompte ou arrhes
 *    (L. 221-24). « Un acompte engage les deux » et « le client renonce en
 *    les perdant » sont faux pendant ce délai — et l'aide d'en dessous
 *    (`ECHEANCE_ACOMPTE`) parle justement du devis signé hors des locaux.
 *    « Sauf exceptions » : L. 221-28 8° (le dépannage urgent expressément
 *    demandé par le client) et L. 221-2 12° (la construction neuve, la transformation
 *    importante) l'écartent — l'artisan qui se croit tenu de rendre se
 *    trompe dans le sens prudent, le contraire l'exposerait.
 *
 *  L'EXEMPLE PORTE SA LIMITE (contre-vérification du lot 2a). L'aide disait
 *  « (un dépannage urgent, par exemple) ». Or L. 221-28 8° n'écarte la
 *  rétractation que « dans la limite des pièces de rechange et travaux
 *  strictement nécessaires pour répondre à l'urgence ». Sans cette limite,
 *  l'exemple laissait croire que TOUT un devis « de dépannage » échappe à
 *  la rétractation — le sens qui expose l'artisan : sans le formulaire de
 *  rétractation, le délai du client s'allonge de douze mois (L. 221-20), et
 *  ne pas le remettre est puni (L. 242-6). Et « : vous lui rendez alors »,
 *  juste après l'exception, se lisait « dans ce cas d'exception, vous
 *  rendez tout » : la phrase dit maintenant « s'il se rétracte ».
 *  Ce qu'elle ne dit pas, à dessein (trop long pour une aide ; posé au
 *  juriste, docs/A-FAIRE.md) : si le client a EXPRESSÉMENT demandé que
 *  les travaux commencent avant la fin du délai, il doit la part déjà
 *  faite (L. 221-25). « Tout » se trompe alors dans le sens prudent.
 *
 *  « EXPRESSÉMENT DEMANDÉ » (relecture finale du lot 2a, TC-8). L'exemple
 *  disait « qu'il vous a demandé chez lui ». L. 221-28 8° dit « expressément
 *  sollicités par lui » — le même critère que L. 221-10 4°, que l'aide du
 *  8e jour (`ECHEANCE_ACOMPTE`) écrivait déjà en entier. Sans ce mot,
 *  l'exception s'élargit : un dépannage que l'artisan a lui-même proposé
 *  (le démarchage) et que le client a accepté a été « demandé », mais pas
 *  « expressément sollicité ». C'est le sens qui expose l'artisan. */
export const AIDE_NATURE_ACOMPTE = 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui '
  + 'rendant le double. Un acompte engage les deux. Si rien n’est écrit, l’administration considère qu’une '
  + 'somme versée d’avance par un particulier vaut des arrhes (Code de la consommation, art. L.\u00a0214-1). '
  + 'Mais un devis signé hors de vos locaux ou à distance laisse au client 14\u00a0jours pour se rétracter, '
  + 'sauf exceptions (par exemple, le strict nécessaire d’un dépannage urgent qu’il vous a expressément demandé '
  + 'chez lui) : '
  + 's’il se rétracte, vous lui rendez tout ce qu’il a versé, '
  + 'acompte ou arrhes (art. L.\u00a0221-18 et L.\u00a0221-24).';

/** Code de la consommation, art. L. 221-10, premier alinéa : « Le
 *  professionnel ne peut recevoir aucun paiement ou aucune contrepartie,
 *  sous quelque forme que ce soit, de la part du consommateur avant
 *  l'expiration d'un délai de sept jours à compter de la conclusion du
 *  contrat hors établissement. » — sauf, notamment (4°), « des travaux
 *  d'entretien ou de réparation à réaliser en urgence au domicile du
 *  consommateur et expressément sollicités par lui, dans la limite des
 *  pièces de rechange et travaux strictement nécessaires pour répondre à
 *  l'urgence ». 2a ne sait pas encore où le devis sera signé (2b le
 *  demandera) : la phrase dit la règle, pas une date, et dit pourquoi elle
 *  est rappelée.
 *
 *  CE QUE LA PHRASE DISAIT DE MOINS QUE LA LOI, DANS LE SENS QUI EXPOSE
 *  L'ARTISAN (relecture CONTROLES-8 du lot 2a) :
 *  - « encaisser » : la loi dit RECEVOIR, sous quelque forme que ce soit.
 *    Un chèque reçu le jour de la signature et encaissé le 10e jour est
 *    déjà interdit ; « encaisser » laissait croire le contraire. Le plan
 *    (docs/PLAN-DEVIS.md) rattache ce paiement anticipé à L. 242-7 (deux
 *    ans, 150 000 €) — non relu ici, l'article manque au dump local ;
 *  - « un particulier » : L. 221-3 étend la règle à une entreprise de cinq
 *    salariés au plus, quand l'objet du contrat n'entre pas dans son
 *    activité principale (la boulangerie qui fait refaire sa vitrine) ;
 *  - « des travaux urgents » : l'exception ne vaut que pour l'entretien ou
 *    la réparation demandés expressément, au domicile, et seulement pour
 *    les pièces et travaux strictement nécessaires — pas pour tout
 *    l'acompte d'un devis « urgent ». « À l'urgence » est écrit en toutes
 *    lettres (contre-vérification du lot 2a) : « strictement nécessaires »
 *    tout court se lisait « nécessaires au chantier », c'est-à-dire tout le
 *    devis — exactement l'erreur que la phrase veut éviter.
 *
 *  LES EXCEPTIONS (réécrite à 2b-2, critique droit B4 et B3). La phrase
 *  disait « Seule exception : » le dépannage urgent, et « hors de son
 *  métier ». Deux erreurs, dans le sens qui égare l'artisan :
 *  - « seule » était FAUX depuis que « Le chantier » existe : la construction
 *    d'un bâtiment neuf ou la transformation importante d'un bâtiment
 *    existant sort du champ des contrats hors établissement (L. 221-2 12°),
 *    donc de la règle du 8e jour ; la phrase le dit, et renvoie à la carte ;
 *  - L. 221-3 parle de l'« activité principale » de la petite entreprise,
 *    pas de son « métier » : une boulangerie qui fait refaire sa vitrine est
 *    hors de son activité principale, et une entreprise peut avoir plusieurs
 *    métiers.
 *  Les trois autres exceptions de L. 221-10 (l'abonnement à un quotidien,
 *  les services à la personne d'un organisme agréé payés au fil d'un contrat
 *  continu, les ventes en réunion à domicile) restent tues : un devis de
 *  travaux ne les rencontre pas, et les taire fait attendre là où l'artisan
 *  pourrait être payé — le sens prudent. Cachée pour une réponse
 *  « professionnel » (`aidesDeLAcompte`). */
export const ECHEANCE_ACOMPTE = 'Devis signé hors de vos locaux (chez le client, sur le chantier) par un particulier, '
  + 'ou par une entreprise de 5\u00a0salariés au plus pour des travaux hors de son activité principale : vous ne '
  + 'pouvez recevoir aucun paiement avant le 8e jour après la signature — pas même un chèque à encaisser plus tard. '
  + 'Exceptions : des travaux d’entretien ou de réparation urgents qu’il vous a expressément demandés chez lui, et '
  + 'seulement pour les pièces et travaux strictement nécessaires à l’urgence ; et la construction d’un bâtiment neuf '
  + 'ou la transformation importante d’un bâtiment existant, à indiquer dans « Le chantier » (Code de la '
  + 'consommation, art. L.\u00a0221-10, L.\u00a0221-2 et L.\u00a0221-3). Opus ne sait pas encore où ce devis sera '
  + 'signé : comptez ce délai.';

/* La suite commune des deux formes de `echeanceAcompteChantierNeuf`.
   RÉÉCRITE LE 13/11 (décision R1 du propriétaire, « Interdire « à la
   signature » », relecture droit D1) : elle disait « la règle du 8e jour ne
   s'applique pas à ces chantiers », et laissait croire qu'on pouvait être
   payé à la signature. C'est vrai du code de la consommation (L. 221-2 12°),
   pas du code de la construction : pour un acte qui a pour objet la
   construction d'un immeuble à usage d'habitation, l'acquéreur non
   professionnel peut se rétracter pendant dix jours à compter du lendemain
   de la première présentation de la lettre recommandée qui lui notifie
   l'acte, et nul ne peut recevoir de lui aucun versement avant (CCH,
   L. 271-1 et L. 271-2, relus dans le dump LEGI local, en vigueur). C'est
   donc désormais une aide de cas NON permis : `signaturePermise` ne compte
   plus le bâtiment neuf. */
const SUITE_CHANTIER_NEUF = 'ce devis porte sur la construction d’un bâtiment neuf ou la transformation importante d’un '
  + 'bâtiment existant : la règle du 8e jour du code de la consommation ne vaut pas pour ces chantiers. Mais pour la '
  + 'construction d’un logement, le code de la construction peut laisser à votre client dix jours pour se rétracter, à '
  + 'compter du lendemain de la première présentation du contrat par lettre recommandée, et interdire tout paiement '
  + 'ou engagement de payer avant (art. L.\u00a0271-1 et '
  + 'L.\u00a0271-2) : Opus ne permet pas le paiement à la signature, et l’échéance à écrire sur ces devis sera fixée '
  + 'avec un juriste avant leur envoi. Si ce n’est pas vraiment le cas, revenez à « Non » dans « Le chantier ».';

/**
 * L'aide du 8e jour quand l'artisan a répondu « Oui » à la première question
 * du chantier (2b-2, annexe A.6 : `ECHEANCE_ACOMPTE_CHANTIER_NEUF`) — avec la
 * date de la confirmation que la BASE a posée (`chantierNeufConsoLe`), ou,
 * pas encore relue, « Vous venez d'indiquer ». Une FONCTION : la phrase porte
 * une date. L. 221-2 12° (le champ), L. 221-10 (le 8e jour) ; depuis le
 * 13/11, CCH L. 271-1 et L. 271-2 (les dix jours, et aucun versement avant).
 */
export function echeanceAcompteChantierNeuf(confirmeLe = null) {
  const date = confirmeLe ? dateFrancaise(confirmeLe) : null;
  return date ? `Vous avez indiqué le ${date} que ${SUITE_CHANTIER_NEUF}` : `Vous venez d’indiquer que ${SUITE_CHANTIER_NEUF}`;
}

/** Pour une association, une copropriété, une société civile : la règle du
 *  8e jour n'est peut-être pas due (L. 221-10 vise le consommateur), Opus la
 *  compte par prudence (critique droit I5). */
export const ECHEANCE_ACOMPTE_PRUDENCE = 'Pour une association, une copropriété ou une société civile sans activité '
  + 'professionnelle, la loi ne pose peut-être pas cette règle ; Opus la compte, par prudence : ne recevez aucun '
  + 'paiement avant le 8e jour après la signature.';

/** L'aide de la nature pour un client qui commande pour son entreprise, dans
 *  son activité principale : sans la partie « rétractation » ni la
 *  présomption d'arrhes, qui ne valent que pour un consommateur (critique
 *  droit M9). */
export const AIDE_NATURE_ACOMPTE_PRO = 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui '
  + 'rendant le double. Un acompte engage les deux. Écrivez lequel des deux vous demandez.';

/** 2b-3 (annexe A.4) — toutes les lignes chiffrées sont marquées
 *  « réparation urgente », pour un client à titre privé ou une association,
 *  une copropriété, une société civile : la règle du 8e jour ne s'applique
 *  pas à ces lignes (L. 221-10 4°). Elle dit le risque d'une marque fausse,
 *  jamais « marquez ». */
export const ECHEANCE_ACOMPTE_URGENCE = 'Toutes les lignes chiffrées de ce devis sont marquées « réparation urgente » : '
  + 'pour elles, la règle du 8e jour ne s’applique pas. Si une ligne ne l’est pas vraiment, retirez sa marque : un '
  + 'paiement reçu trop tôt permettrait au client d’annuler le contrat.';

/** 2b-3, T7 (`docs/A-FAIRE.md` : l'aide de la nature affirmait 14 jours de
 *  rétractation à une association) — pour une association, une copropriété,
 *  une société civile : la loi ne prévoit peut-être pas de délai de
 *  rétractation, Opus le compte par prudence. */
export const AIDE_NATURE_ACOMPTE_PRUDENCE = 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui '
  + 'rendant le double. Un acompte engage les deux. Pour une association, une copropriété ou une société civile, la loi '
  + 'ne prévoit peut-être pas de délai de rétractation ; Opus le compte, par prudence : si le client se rétracte, '
  + 'rendez-lui tout ce qu’il a versé.';

/**
 * LES AIDES DE L'ACOMPTE, selon la réponse « à quel titre » DE L'ÉCRAN, la
 * première question du chantier (cahier 2b-2, §3.5) et, depuis 2b-3, les
 * lignes toutes marquées « réparation urgente » — ce sont des AIDES, pas des
 * comptes : elles suivent ce que l'artisan voit, comme les autres aides de la
 * carte. `{ nature, echeance }`, `echeance` à `null` quand elle n'a pas lieu
 * d'être. Dans cet ordre (D8, refait le 13/11 — décision R1) :
 *   1. `professionnel` : ni le 8e jour, ni la rétractation — `AIDE_NATURE_ACOMPTE_PRO` ;
 *   2. tout urgent ET `consommateur` : `ECHEANCE_ACOMPTE_URGENCE` ;
 *   3. tout urgent ET `non_professionnel` : `AIDE_NATURE_ACOMPTE_PRO` (ni
 *      « rendez-lui tout », ni « 14 jours », pour des lignes qui n'ont pas
 *      de rétractation) et `ECHEANCE_ACOMPTE_URGENCE` ;
 *   4. le chantier neuf (« Oui » à la question des droits du client) :
 *      `echeanceAcompteChantierNeuf`, avec la date de la base — le 8e jour
 *      du code de la consommation n'y vaut pas, mais le code de la
 *      construction peut interdire tout paiement avant dix jours : une aide
 *      de cas NON permis depuis le 13/11, qui passe APRÈS les deux cas qui
 *      permettent (« tout urgent » permet toujours, même sur ce chantier) ;
 *      elle passe encore avant la prudence d'une association ;
 *   5. `non_professionnel` : `AIDE_NATURE_ACOMPTE_PRUDENCE` et
 *      `ECHEANCE_ACOMPTE_PRUDENCE` ;
 *   6. sinon (une petite entreprise hors de son activité, ou pas de
 *      réponse) : `ECHEANCE_ACOMPTE` — la ligne « pourquoi »
 *      (`pourquoiPasALaSignature`) dit la prudence d'Opus quand « À la
 *      signature » est choisi.
 * L'aide dit « permis » (`ECHEANCE_ACOMPTE_URGENCE` ou `null`) SI ET
 * SEULEMENT SI `signaturePermise` est vraie : la même règle (`verifier-devis`
 * la fait tourner sur toutes les combinaisons). L'aide du chantier neuf est
 * une aide de cas NON permis, comme `ECHEANCE_ACOMPTE`. `toutUrgent` :
 * `toutUrgent(lignes)`, calculé par l'écran.
 */
export function aidesDeLAcompte({
  reponse = null, chantierNeufConso = null, chantierNeufConsoLe = null, toutUrgent: tout = false,
} = {}) {
  if (reponse === 'professionnel') return { nature: AIDE_NATURE_ACOMPTE_PRO, echeance: null };
  if (tout === true && reponse === 'consommateur') return { nature: AIDE_NATURE_ACOMPTE, echeance: ECHEANCE_ACOMPTE_URGENCE };
  if (tout === true && reponse === 'non_professionnel') {
    return { nature: AIDE_NATURE_ACOMPTE_PRO, echeance: ECHEANCE_ACOMPTE_URGENCE };
  }
  if (chantierNeufConso === true) return { nature: AIDE_NATURE_ACOMPTE, echeance: echeanceAcompteChantierNeuf(chantierNeufConsoLe) };
  if (reponse === 'non_professionnel') return { nature: AIDE_NATURE_ACOMPTE_PRUDENCE, echeance: ECHEANCE_ACOMPTE_PRUDENCE };
  return { nature: AIDE_NATURE_ACOMPTE, echeance: ECHEANCE_ACOMPTE };
}

/** LA QUESTION DE L'ÉCHÉANCE, dans la carte « Conditions » (2b-3, réponse P2
 *  du 12/11, annexe A.4) : « Dès le 8e jour (par défaut) » tant que la
 *  valeur est vide — vide = le 8e jour —, puis « Dès le 8e jour ». */
export const ECHEANCE_DE_L_ACOMPTE = Object.freeze({
  etiquette: 'Quand le client paie-t-il cette somme ?',
  huitiemeJourParDefaut: 'Dès le 8e jour (par défaut)',
  huitiemeJour: 'Dès le 8e jour',
  aLaSignature: 'À la signature',
});

/** Les deux pastilles de l'échéance, « Dès le 8e jour » à GAUCHE. */
export function pastillesDeLEcheance(valeur) {
  const E = ECHEANCE_DE_L_ACOMPTE;
  return [valeur === null || valeur === undefined ? E.huitiemeJourParDefaut : E.huitiemeJour, E.aLaSignature];
}

/** La réduction et l'acompte ne regardent jamais les OPTIONS (DROIT-6) :
 *  une option n'est pas commandée tant que le client ne l'a pas choisie. */
export const AIDE_REDUCTION = 'Elle porte sur les postes, jamais sur une option : une option n’est pas commandée '
  + 'tant que le client ne l’a pas choisie.';
export const AIDE_ACOMPTE = 'Calculé sur le total sans les options : avant la signature, on ne sait pas '
  + 'lesquelles le client prendra.';
/** La validité court à partir de la DATE DU DEVIS (réponse du 03/11).
 *
 *  QUELLE DATE (relecture CONTROLES-12 du lot 2a) : le lot 2a n'en a pas
 *  encore. Le devis ne porte que `created_at` — la naissance du BROUILLON —
 *  et `modifie_le`. La date qui s'imprimera est celle de la REMISE
 *  (`remis_le`, posée par la base à la remise, lots 2b-2c ;
 *  docs/PLAN-DEVIS.md §2.0 : « `created_at` ne s'imprime JAMAIS »). Dire
 *  seulement « la date du devis » laissait croire qu'un brouillon commencé
 *  en septembre et remis en novembre, « valable 30 jours », serait périmé
 *  en arrivant chez le client. L'aide nomme donc la date imprimée et le
 *  geste qui la pose ; la règle qui passe des JOURS à une DATE s'écrit en
 *  2c (docs/A-FAIRE.md, « Après le lot 2a »). */
export const AIDE_VALIDITE = 'À compter de la date du devis, celle qui sera imprimée dessus : le jour où vous le '
  + 'remettrez au client, pas celui où vous l’avez commencé.';

/** L'aide de l'interrupteur « Retenue de garantie », sous son libellé.
 *
 *  JAMAIS LA DURÉE SANS SA RÉSERVE (loi n° 71-584, art. 2) : « rendue un an
 *  après » sans l'opposition promettrait à l'artisan un remboursement que le
 *  client peut bloquer. Et l'aide dit À QUI le client notifie l'opposition —
 *  au consignataire (ou à la caution), par lettre recommandée —, pas « à
 *  vous » : l'artisan qui n'a rien reçu ne doit pas en conclure que la somme
 *  lui revient (relecture CONTROLES-11 du lot 2a). « RendUE » s'accorde avec
 *  la RETENUE : « des acomptes, rendus » se lisait « les acomptes sont
 *  rendus ».
 *
 *  POURQUOI ELLE VIT ICI ET PLUS DANS L'ÉCRAN (relecture finale du lot 2a,
 *  TC-3). Elle était écrite en attribut JSX dans `ConditionsDevis.js`, et le
 *  contrôle « mot pour mot » ne recousait que les littéraux entre
 *  apostrophes : une constante concaténée au bout (« Sans lettre reçue de
 *  vous, elle vous revient d’office. ») ou une prop étalée après elle
 *  (« …que le client vous adresse par courriel ») lui faisaient dire le
 *  contraire de la loi, au vert. Ici, elle est comparée par sa VALEUR, comme
 *  les autres aides ; et l'écran doit porter exactement `aide={AIDE_RETENUE}`,
 *  une fois, sans prop étalée (`verifier-devis`). */
export const AIDE_RETENUE = 'Au plus 5\u00a0% des acomptes, rendue un an après la réception des travaux, sauf '
  + 'opposition motivée que le client notifie au consignataire (ou à la caution) par lettre recommandée.';

/* CE QU'UNE CONTRAINTE DU DEVIS NOMME, pour dire QUEL champ n'est pas parti
   (cahier du lot 2, ECRAN-15) : « Le brouillon n'a pas pu être enregistré »
   ne sert plus qu'à un échec de CRÉATION. */
const ECHEC_PAR_CONTRAINTE = Object.freeze({
  devis_acompte_check: 'L’acompte n’a pas pu être enregistré.',
  devis_acompte_nature_check: 'La nature de l’acompte n’a pas pu être enregistrée.',
  devis_acompte_une_forme_check: 'L’acompte n’a pas pu être enregistré.',
  devis_cout_check: 'Le prix du devis lui-même n’a pas pu être enregistré.',
  /* 2b-5 : les sept contraintes des déchets du chantier (carte « Déchets
     du chantier »), chacune nommant SON champ. */
  devis_dechets_cout_check: 'Le coût estimé des déchets n’a pas pu être enregistré.',
  devis_dechets_flux_check: 'Les déchets triés n’ont pas pu être enregistrés.',
  devis_dechets_lieux_check: 'Les lieux de dépôt des déchets n’ont pas pu être enregistrés.',
  devis_dechets_quantite_check: 'La quantité estimée des déchets n’a pas pu être enregistrée.',
  devis_dechets_sans_depot_check: 'La réponse « Aucun dépôt » n’a pas pu être enregistrée.',
  devis_dechets_sur_place_check: 'Ce qui reste sur le chantier n’a pas pu être enregistré.',
  devis_dechets_unite_check: 'L’unité des déchets n’a pas pu être enregistrée.',
  devis_delai_check: 'Le délai d’exécution n’a pas pu être enregistré.',
  /* 2b-6 : les trois contraintes de la carte « Énergie et label RGE »
     (annexe A.7 du cahier 2b-6), chacune nommant SON champ. */
  devis_energie_sans_label_check: 'Votre déclaration sur le label RGE n’a pas pu être enregistrée.',
  devis_energie_sous_traitants_check: 'Les sous-traitants de ce devis n’ont pas pu être enregistrés.',
  devis_energie_travaux_check: 'Les travaux d’énergie n’ont pas pu être enregistrés.',
  devis_lieu_adresse_check: 'Le lieu des travaux n’a pas pu être enregistré.',
  devis_lieu_code_postal_check: 'Le lieu des travaux n’a pas pu être enregistré.',
  devis_lieu_ville_check: 'Le lieu des travaux n’a pas pu être enregistré.',
  devis_objet_check: 'L’objet du devis n’a pas pu être enregistré.',
  /* SUR L'EN-TÊTE, LE PLAFOND NE PEUT VENIR QUE DE LA RÉDUCTION (relecture BASE-4
     du lot 2a, mesuré) : une écriture d'en-tête relit les totaux tels que le
     dernier recalcul les a laissés, sous la borne — sauf quand elle change la
     réduction, qui refait la ventilation. Et la base borne le TTC NET de la
     réduction : la retirer, ou la baisser, peut le faire repasser. Avant, la
     bande disait « l'objet, le lieu, le délai ou les conditions », puis « Rien
     n'a été enregistré pour cette ligne » — à quelqu'un qui n'avait touché
     que la réduction. */
  devis_plafond_check: 'La réduction n’a pas pu être changée.',
  devis_pour_qui_check: 'La réponse à « À quel titre ? » n’a pas pu être enregistrée.',
  devis_remise_check: 'La réduction n’a pas pu être enregistrée.',
  devis_remise_une_forme_check: 'La réduction n’a pas pu être enregistrée.',
  devis_retenue_check: 'La retenue de garantie n’a pas pu être enregistrée.',
  devis_validite_check: 'La validité de l’offre n’a pas pu être enregistrée.',
});

/**
 * LA PHRASE D'UN ÉCHEC DE L'EN-TÊTE DU DEVIS : avant que le brouillon existe
 * en base, c'est lui qui n'a pas pu être enregistré ; après, c'est un CHAMP
 * — celui que nomme la contrainte refusée, ou, quand on ne sait pas lequel
 * (une coupure de réseau), tous ceux de l'en-tête : « l'objet, le lieu, le
 * délai, « À quel titre ? », « Le chantier », les déchets ou les
 * conditions » (2b-3, E2 : « À quel titre ? » manquait depuis 2b-2, et « Le
 * chantier » gagne une colonne ; 2b-5 : la carte « Déchets du chantier »
 * écrit aussi l'en-tête — sans « les déchets », une coupure pendant son
 * enregistrement aurait nommé tout SAUF ce que l'artisan venait de toucher ;
 * 2b-6 : la carte « Énergie et label RGE » aussi — « les travaux d'énergie »).
 */
export function phraseEchecDuDevis({ enBase = false, erreur = null, retenue = null } = {}) {
  if (!enBase) return 'Le brouillon n’a pas pu être enregistré.';
  const p = ECHEC_PAR_CONTRAINTE[contrainteDuDevis(erreur)]
    || 'L’en-tête du devis n’a pas pu être enregistré : l’objet, le lieu, le délai, « À quel titre ? », « Le chantier », '
      + 'les déchets, les travaux d’énergie ou les conditions.';
  /* CE QUI RESTE TENU À PART (relecture finale, ÉCRAN-F1) : une autre
     écriture de l'en-tête a échoué depuis (une coupure) — la réduction que
     le plafond a refusée n'est toujours pas en base, et la phrase le dit
     encore. */
  const q = retenue && retenue !== erreur ? ECHEC_PAR_CONTRAINTE[contrainteDuDevis(retenue)] : null;
  return q && q !== p ? `${p} ${q}` : p;
}

/* La contrainte du devis qu'une erreur de la base cite — dans son message,
   son détail ou son champ `constraint` (PostgREST, la démonstration). */
function contrainteDuDevis(erreur) {
  const brut = erreur && typeof erreur === 'object'
    ? `${erreur.message || ''} ${erreur.details || ''} ${erreur.constraint || ''}` : '';
  return (brut.match(/\b(devis_[a-z0-9_]+_check)\b/) || [])[1] || null;
}

/* ------------------------------------------------------------------------ */
/*  LE PLAFOND REFUSÉ — ce qu'on dit, ce qu'on renvoie (reprise « écran »   */
/*  du lot 2a, 04/11/2026)                                                  */
/* ------------------------------------------------------------------------ */

/**
 * UN REFUS DU PLAFOND : 23514 sur `devis_plafond_check` — par une ligne, une
 * option ou le changement de la réduction. C'est un refus DÉFINITIF pour
 * l'écriture qui l'a reçu (`estUnRefusDefinitif`, erreurs.js : renvoyée
 * telle quelle, elle est refusée pareil), mais pas pour TOUJOURS : il tient
 * aux AUTRES écritures du devis. Baisser la ligne trop chère, et la
 * réduction retirée passe ; baisser une autre ligne, et celle-ci passe.
 * `erreurs.js` reconnaît le même refus pour en choisir la phrase
 * (`messageDEcritureDuDevis`) : `verifier-devis` fait tourner les deux sur
 * les mêmes erreurs, et elles doivent répondre pareil.
 */
export function estUnRefusDuPlafond(erreur) {
  return !!erreur && String(erreur.code || '') === '23514' && contrainteDuDevis(erreur) === 'devis_plafond_check';
}

/**
 * LE CHEMIN D'UNE ÉCRITURE, pour sa phrase (`messageDEcritureDuDevis`) : le
 * devis lui-même (`'entete'`), une OPTION, ou une autre ligne. Une option ne
 * dépasse que le total toutes options comprises : sa phrase n'est pas celle
 * d'un poste.
 */
export function cheminDeLEcriture(cle, ligne = null) {
  if (cle === 'devis') return 'entete';
  return ligne && ligne.type === 'option' ? 'option' : 'ligne';
}

/**
 * LA NATURE D'UN ÉCHEC DÉFINITIF D'UNE LIGNE (point 1) — `null` quand
 * l'échec se réessaie (une coupure, un délai, un interblocage) :
 *   - `'ligne'` : c'est CETTE écriture qui a été refusée (le devis est en
 *     base) — la rangée dit « La corriger » et ouvre la carte ;
 *   - `'brouillon'` : la ligne attend un brouillon dont la CRÉATION a été
 *     refusée (`file-ecriture.js` lui donne l'erreur du devis) — la corriger
 *     n'y changerait rien, et « Réessayer » renverrait la même création : la
 *     rangée ne propose ni l'un ni l'autre, la bande du bas dit pourquoi.
 */
export function refusDeLaLigne({ definitif = false, devisEnBase = false } = {}) {
  if (!definitif) return null;
  return devisEnBase ? 'ligne' : 'brouillon';
}

/**
 * RENVOYER UNE LIGNE QUE L'ÉCRAN ENREGISTRE ? Oui, sauf une ligne refusée
 * DÉFINITIVEMENT dont rien n'a changé depuis l'écriture refusée : fermer sa
 * carte, toucher « Poste suivant » ou la barre du bas la renvoyait telle
 * quelle — refusée pareil, une vibration et une annonce de plus pour rien
 * (mesuré au navigateur : une écriture partie en fermant la carte sans rien
 * toucher). Une ligne CHANGÉE part toujours : c'est la correction qu'on
 * attend, et la file doit la connaître même si elle ne passe pas.
 */
export function renvoyerLaLigne({
  valeurs = null, derniere = null, etat = null, refus = null,
} = {}) {
  if (etat !== 'echec' || !refus || !derniere || !valeurs) return true;
  const a = choisirChamps(valeurs, CHAMPS_LIGNE);
  const b = choisirChamps(derniere, CHAMPS_LIGNE);
  return CHAMPS_LIGNE.some((c) => !Object.is(a[c] ?? null, b[c] ?? null));
}

/* LA VERSION D'UN OBJET QUE LA BASE AURA quand le renvoi y arrivera
   (relecture finale du lot 2a, ÉCRAN-F2). La prédiction se faisait sur ce
   que l'écran VEUT, et oubliait ce que la base GARDE : une ligne en base
   rendue incomplète (« locale » : son prix effacé pour le retaper), ou
   baissée sans réponse (une coupure), n'était pas comptée — l'en-tête
   « tiendrait », repartait, et la base le refusait de nouveau, APRÈS CHAQUE
   écriture réussie, avec une vibration et une annonce (reproduit par la
   vraie file). Désormais :
     - ce qui PART avant le renvoi, ou avec lui, compte pour ce que l'écran
       veut : enregistré, en cours d'envoi, ou refusé par le plafond (le
       renvoi le renvoie) ;
     - un retrait en cours d'envoi part avant : il ne compte pas ;
     - ce que rien ne renverra compte pour ce que la BASE a : une ligne
       « locale », une ligne en échec pour une autre raison, un retrait qui
       n'a pas pu se faire — sa version confirmée ; une insertion partie
       sans réponse, la ligne telle qu'envoyée (absente ou présente : la plus
       chère des deux, puisqu'un total n'est jamais négatif) ; rien, si elle
       n'a jamais été en base ;
     - une colonne partie sans réponse (la base a PEUT-ÊTRE l'une, peut-être
       l'autre valeur) : on ne sait pas, et l'on ne renvoie RIEN. */
const VERSION_INCONNUE = Symbol('version inconnue en base');
function versionAuRenvoi(e, colonnesQuiComptent = null) {
  /* L'en-tête n'est jamais « locale » : un brouillon qui n'existe pas
     encore part avant ses lignes (`enfiler`, file-ecriture.js). */
  const locale = e.cle !== 'devis' && (!!e.locale || e.etat === 'locale');
  if (!e.retire && !locale && (e.etat !== 'echec' || estUnRefusDuPlafond(e.erreur))) return e.voulu;
  if (e.retire && e.etat !== 'echec') return null;
  const inconnues = (Array.isArray(e.inconnues) ? e.inconnues : [])
    .filter((c) => !colonnesQuiComptent || colonnesQuiComptent.includes(c));
  if (inconnues.length) return VERSION_INCONNUE;
  if (e.confirme) return e.confirme;
  if (e.peutEtreInseree) return e.voulu;
  return null;
}

/**
 * LE DEVIS TIENDRAIT-IL SOUS LA BORNE, une fois renvoyé ce que le plafond a
 * refusé ? Le calcul de la base (`totauxDevis`, le même au centime —
 * `verifier-devis` le joue sur les cas de PostgreSQL), fait sur la version
 * que la base AURA de chaque objet (`versionAuRenvoi`, ci-dessus) : ce que
 * l'écran veut pour ce qui part, ce que la base garde pour le reste — et
 * NON quand on ne peut pas le savoir. Une ligne irrecevable ne compte pas.
 * `entrees` : ce que rend `entreesVoulues()` de la file, chacune avec son
 * `erreur` (`erreurDe`).
 */
export function tiendraitSousLePlafond(entrees) {
  const liste = Array.isArray(entrees) ? entrees : [];
  const d = liste.find((e) => e && e.cle === 'devis');
  /* L'en-tête : seule la réduction change les totaux (BASE-4). */
  const entete = d && d.voulu ? versionAuRenvoi(d, PAIRES_DEVIS[0]) : null;
  if (entete === VERSION_INCONNUE) return false;
  const lignes = [];
  for (const e of liste) {
    if (e && e.cle !== 'devis' && e.voulu) {
      const v = versionAuRenvoi(e);
      if (v === VERSION_INCONNUE) return false;
      if (v && validerLigne(v).ok) lignes.push(v);
    }
  }
  return totauxDevis(lignes, entete && d ? { ...d.voulu, ...entete } : null).ok === true;
}

/**
 * CE QU'IL FAUT RENVOYER APRÈS UNE ÉCRITURE RÉUSSIE (point 2) : chaque
 * écriture en échec par un refus du plafond — l'en-tête comme une ligne ou
 * une option —, mais SEULEMENT si le devis voulu tiendrait sous la borne.
 * Sinon rien : renvoyer ce qui serait refusé pareil ferait vibrer et
 * clignoter l'écran à chaque ligne enregistrée, et ne réparerait rien.
 * `entrees` : `entreesVoulues()`, chacune avec son `erreur` (`erreurDe`).
 */
export function clesARejouerApresLePlafond(entrees) {
  const liste = Array.isArray(entrees) ? entrees : [];
  const refusees = liste.filter((e) => e && e.etat === 'echec' && !e.retire && estUnRefusDuPlafond(e.erreur))
    .map((e) => e.cle);
  if (!refusees.length || !tiendraitSousLePlafond(liste)) return [];
  return refusees;
}

/**
 * RENVOYER LES REFUS DU PLAFOND QUI PASSERAIENT MAINTENANT — UNE fois par
 * écriture réussie, et jamais en boucle (point 2). L'écran l'appelle quand
 * la file a relu ses totaux (l'événement `totaux` : elle est au repos, et
 * une écriture vient d'être confirmée) et quand il retire une ligne. Un
 * renvoi qui échoue encore ne rappelle rien : un refus 23514 ne fait pas
 * relire les totaux (`file-ecriture.js` ne relit qu'après une écriture
 * confirmée, ou dont l'issue est inconnue) — il reste définitif, et sa phrase
 * le dit. Rend les clés renvoyées.
 *
 * POURQUOI RENVOYER, ET NE PAS SEULEMENT LE DIRE : l'écran MONTRE déjà la
 * valeur voulue (la réduction retirée, la ligne corrigée) ; la base, elle,
 * garde l'ancienne. Tant que rien ne repart, l'écran affiche une valeur que
 * la base n'a pas — et « touchez la réduction pour l'enregistrer de
 * nouveau » serait faux : la reporter à l'identique n'envoie rien (l'écran
 * ne renvoie que ce qui CHANGE, mesuré au navigateur).
 */
export function rejouerLesRefusDuPlafond(file) {
  if (!file || typeof file.entreesVoulues !== 'function' || typeof file.reessayer !== 'function') return [];
  const entrees = file.entreesVoulues().map((e) => ({ ...e, erreur: file.erreurDe(e.cle) }));
  const cles = clesARejouerApresLePlafond(entrees);
  /* `retenues` : ce que le plafond avait mis à part (la réduction refusée)
     repart cette fois avec le reste — c'est tout l'objet du renvoi. */
  /* `automatique` : ce renvoi n'est pas un geste de l'artisan (`gestesDe`,
     file-ecriture.js). */
  cles.forEach((c) => file.reessayer(c, { retenues: true, automatique: true }));
  return cles;
}

/**
 * LES RENVOIS AUTOMATIQUES EN COURS, et leur issue (relecture finale du lot
 * 2a, N1). `rejouer(file)` renvoie le plafond (`rejouerLesRefusDuPlafond`)
 * et retient chaque clé partie — sauf une déjà « enregistrée » au retour,
 * qui n'avait rien à envoyer : rien ne passera « enfin » — avec le nombre
 * de gestes de l'artisan sur elle à cet instant (`gestesDe`).
 *
 * `issue(file, ev)`, à l'arrivée d'un état : vrai si c'est CE renvoi qui
 * finit, sans que l'artisan ait écrit sur la clé depuis. La clé est oubliée
 * à son premier état qui n'est pas « en cours ».
 *
 * POURQUOI LE COMPTE DES GESTES : sans lui, une ligne que l'artisan
 * remontait pendant que le plafond la renvoyait tout seul était refusée
 * SANS vibration ni annonce — la clé était encore « renvoyée tout seul »,
 * et `echecASignaler` taisait l'échec d'un geste (reproduit par la vraie
 * file : la rangée disait « Non enregistrée », VoiceOver ne disait rien).
 */
export function creerRenvoisAutomatiques() {
  const partis = new Map();
  const gestes = (file, c) => (file && typeof file.gestesDe === 'function' ? file.gestesDe(c) : 0);
  return {
    rejouer(file) {
      const cles = rejouerLesRefusDuPlafond(file);
      cles.forEach((c) => { if (file.etatDe(c) !== 'enregistree') partis.set(c, gestes(file, c)); });
      return cles;
    },
    issue(file, ev) {
      if (!ev || ev.etat === 'en_cours' || !partis.has(ev.cle)) return false;
      const avant = partis.get(ev.cle);
      partis.delete(ev.cle);
      return gestes(file, ev.cle) === avant;
    },
  };
}

/**
 * CE QUE LES RANGÉES DOIVENT DIRE À L'OUVERTURE, quand la saisie se rouvre
 * sur une file qui avait encore de quoi écrire (`fileExistante`) : ses
 * échecs y sont toujours, et les rangées les montraient « Non enregistrée —
 * Réessayer », SANS phrase et SANS savoir qu'un refus était définitif — le
 * mensonge du point 1, par la porte de la réouverture. `entrees` :
 * `entreesVoulues()`, chacune avec son `erreur` ; `estDefinitif` et
 * `phraseDe(erreur, chemin)` viennent d'`erreurs.js` (ce fichier n'importe
 * pas `erreurs.js`). Rend `{ phrases, definitifs }`, par clé.
 */
export function echecsDeLaFile(entrees, { devisEnBase = false, estDefinitif = () => false, phraseDe = () => null } = {}) {
  const phrases = {};
  const definitifs = {};
  (Array.isArray(entrees) ? entrees : []).filter((e) => e && e.etat === 'echec').forEach((e) => {
    phrases[e.cle] = phraseDe(e.erreur, cheminDeLEcriture(e.cle, e.voulu));
    if (e.cle === 'devis') return;
    const r = refusDeLaLigne({ definitif: !!estDefinitif(e.erreur), devisEnBase });
    if (r) definitifs[e.cle] = r;
  });
  return { phrases, definitifs };
}

/** Ce qu'on annonce à VoiceOver quand un refus du plafond, renvoyé tout
 *  seul, passe enfin : la bande s'efface, et ça doit s'entendre.
 *
 *  DEUX PHRASES POUR L'EN-TÊTE (relecture finale du lot 2a, ÉCRAN-F3) : le
 *  plafond ne refuse l'en-tête que quand la réduction BAISSE ou est RETIRÉE
 *  — et le cas même pour lequel le renvoi a été écrit est le RETRAIT.
 *  « La réduction est maintenant enregistrée » faisait croire, à qui
 *  n'entend que VoiceOver, qu'une réduction figurait au devis : il n'y en
 *  avait plus. La phrase se choisit par `phraseDuRejeu`. */
export const PHRASES_DU_REJEU = Object.freeze({
  entete: 'La réduction est maintenant enregistrée.',
  enteteSansReduction: 'La réduction est maintenant retirée du devis.',
  ligne: 'Une ligne refusée tout à l’heure est maintenant enregistrée.',
  option: 'Une option refusée tout à l’heure est maintenant enregistrée.',
});

/** La phrase du renvoi qui passe, selon son chemin — et, pour l'en-tête,
 *  selon ce qui est parti : une réduction RETIRÉE (les deux formes vides)
 *  ne se dit pas « enregistrée ». `devis` : l'en-tête tel que l'écran le
 *  veut (ce qui vient de partir). */
export function phraseDuRejeu(chemin, devis = null) {
  if (chemin === 'entete') {
    const sans = !devis || PAIRES_DEVIS[0].every((c) => devis[c] === null || devis[c] === undefined);
    return sans ? PHRASES_DU_REJEU.enteteSansReduction : PHRASES_DU_REJEU.entete;
  }
  return Object.prototype.hasOwnProperty.call(PHRASES_DU_REJEU, chemin) && chemin !== 'enteteSansReduction'
    ? PHRASES_DU_REJEU[chemin] : null;
}

/**
 * CE QU'UN REFUS DE L'EN-TÊTE VISE — les colonnes que la file d'écriture
 * TIENT À PART (`aPart`, file-ecriture.js, points 16 et 17), pour que le
 * reste de l'en-tête parte sans elles (relecture finale du lot 2a,
 * ÉCRAN-F1 et TC-4). Sur l'en-tête, `devis_plafond_check` ne peut venir que
 * de la RÉDUCTION (BASE-4) : la contrainte ne juge que les totaux, et seule
 * la paire de la réduction les change. Avant, l'objet tapé après une
 * réduction refusée partait AVEC elle, était refusé avec elle, et n'était
 * nommé nulle part. Les autres contraintes de l'en-tête jugent un champ que
 * l'écran a déjà validé par la même règle (`validerDevis`) : rien de plus
 * n'est tenu — `null`.
 */
export function colonnesDuRefus(erreur) {
  return estUnRefusDuPlafond(erreur) ? [...PAIRES_DEVIS[0]] : null;
}

/**
 * « RÉESSAYER » DES LIGNES RETIRÉES ne renvoie QUE les retraits (relecture
 * finale du lot 2a, TC-1). La bande appelait `reessayer()` SANS clé, qui
 * renvoie tout ce qui a échoué — l'en-tête et les lignes refusés
 * DÉFINITIVEMENT compris, que tous les autres boutons venaient d'apprendre à
 * ne plus renvoyer : une vibration, une annonce et un refus de plus, pour
 * rien (reproduit par la vraie file). `estDefinitif` vient de l'écran
 * (`estUnRefusDefinitif`, erreurs.js : ce fichier ne l'importe pas) ; un
 * retrait refusé pour de bon ne repart pas non plus. `entrees` :
 * `entreesVoulues()`, chacune avec son `erreur`.
 */
export function retraitsARenvoyer(entrees, { estDefinitif = () => false } = {}) {
  return (Array.isArray(entrees) ? entrees : [])
    .filter((e) => e && e.cle !== 'devis' && e.retire && e.etat === 'echec' && !estDefinitif(e.erreur))
    .map((e) => e.cle);
}

/** Le geste de la bande : renvoie les retraits à renvoyer, un par un, par
 *  leur clé. Rend les clés renvoyées. */
export function renvoyerLesRetraits(file, { estDefinitif = () => false } = {}) {
  if (!file || typeof file.entreesVoulues !== 'function' || typeof file.reessayer !== 'function') return [];
  const cles = retraitsARenvoyer(file.entreesVoulues().map((e) => ({ ...e, erreur: file.erreurDe(e.cle) })), { estDefinitif });
  cles.forEach((c) => file.reessayer(c));
  return cles;
}

/**
 * UN ÉCHEC SE SIGNALE-T-IL — une vibration, une annonce à VoiceOver ? Celui
 * d'un GESTE de l'artisan, oui. Pas (relecture finale du lot 2a, ÉCRAN-F2) :
 *   - celui d'un renvoi AUTOMATIQUE du plafond (`automatique` : la clé est
 *     dans ce que la saisie a renvoyé toute seule) — l'artisan n'a rien
 *     fait, la bande suffit ;
 *   - un refus TENU à part, re-posé par la file après que le reste de
 *     l'en-tête est parti (`retenu`, file-ecriture.js, 16) — rien de neuf
 *     n'a échoué : l'objet, lui, vient d'être enregistré.
 */
export function echecASignaler({ etat = null, automatique = false, retenu = false } = {}) {
  return etat === 'echec' && automatique !== true && retenu !== true;
}

/**
 * CE QUE DIT LA GARDE EN PARTANT, et le nom de son bouton (relecture finale
 * du lot 2a, ÉCRAN-F1) — exactement ce qui n'est pas en base :
 *   - les lignes qui n'ont pas pu être enregistrées ;
 *   - celles dont l'envoi continue, SANS garantie (jamais un renvoi promis
 *     après le départ : R1d) ;
 *   - l'en-tête, s'il n'est pas en base — `entete` : sa phrase, déjà faite
 *     par l'écran. Il n'était dit que quand AUCUNE ligne n'était en cause :
 *     un objet perdu avec une ligne refusée partait sans un mot.
 * Le bouton : « Quitter sans elles » quand ce sont des lignes, et elles
 * seules ; « Quitter sans l’enregistrer » quand c'est l'en-tête seul, refusé
 * (il disait « sans elles » sans qu'aucune ligne soit en cause) ; « Quitter
 * quand même » quand un envoi continue — l'en-tête encore en route compris
 * (`ENTETE_EN_COURS`) —, ou que les deux sont en cause.
 */
export function bilanDeLaGarde({ enEchec = 0, enCours = 0, entete = null } = {}) {
  const phrases = [
    enEchec > 1 ? `${enEchec} lignes n’ont pas pu être enregistrées.` : null,
    enEchec === 1 ? 'Une ligne n’a pas pu être enregistrée.' : null,
    enCours > 1 ? `${enCours} lignes ne sont pas encore enregistrées : l’envoi continue, mais rien ne garantit qu’il aboutira.` : null,
    enCours === 1 ? 'Une ligne n’est pas encore enregistrée : l’envoi continue, mais rien ne garantit qu’il aboutira.' : null,
    entete || null,
  ].filter(Boolean);
  /* L'en-tête encore en route se dit comme une ligne en cours : l'envoi continue. */
  const enteteRefuse = !!entete && entete !== ENTETE_EN_COURS;
  let quitter = 'Quitter quand même';
  if (enEchec > 0 && !enCours && !entete) quitter = 'Quitter sans elles';
  else if (!enEchec && !enCours && enteteRefuse) quitter = 'Quitter sans l’enregistrer';
  return { phrase: phrases.join(' '), quitter };
}

/** L'en-tête qui n'est pas encore en base parce que son envoi CONTINUE :
 *  la garde ne dit pas qu'il « n'a pas pu » l'être. */
export const ENTETE_EN_COURS = 'L’en-tête du devis n’est pas encore enregistré : l’envoi continue, mais rien ne garantit '
  + 'qu’il aboutira.';

/**
 * CE QUE « MES DEVIS » MONTRE D'UN BROUILLON EN SAISIE — ce que la BASE a,
 * jamais ce que l'écran voudrait (relecture finale du lot 2a, ÉCRAN-F1) :
 * après un refus, l'objet tapé à l'écran partait vers la liste comme s'il
 * était enregistré, et « Mes devis » affichait un objet que la base n'avait
 * pas. `confirme` : ce que la file sait de la base (`entreesVoulues()`,
 * une colonne inconnue y manque — la liste garde alors ce qu'elle avait) ;
 * `local` : l'en-tête de l'écran ; `client` : la fiche que l'écran montre.
 * Le nom du client n'est donné que si c'est bien le client CONFIRMÉ.
 */
export function devisPourMesDevis({ confirme = null, local = null, client = null } = {}) {
  const c = confirme || {};
  const r = choisirChamps(c, CHAMPS_DEVIS);
  const l = local || {};
  const memeClient = Object.prototype.hasOwnProperty.call(c, 'clientId')
    && String(c.clientId ?? '') === String(l.clientId ?? '');
  if (memeClient) r.client = c.clientId && client ? { nom: client.nom } : (l.client || null);
  return r;
}

/* Un nombre de jours tapé dans « Autre » : un entier de 1 à `VALIDITE_MAX`,
   vide = rien. Pas de virgule : une offre ne vaut pas « 30,5 jours ». */
export function versJours(texte) {
  const brut = String(texte == null ? '' : texte).replace(ESPACES_TAPES, '').replace(/jours?$/i, '');
  if (brut === '') return { ok: true, jours: null, message: null };
  if (!/^[0-9]+$/.test(brut)) {
    return { ok: false, jours: null, message: 'Écrivez un nombre de jours entier : par exemple 45.' };
  }
  const n = Number(brut);
  if (n < 1 || n > VALIDITE_MAX) {
    return { ok: false, jours: null, message: `Une durée de validité va de 1 à ${VALIDITE_MAX} jours.` };
  }
  return { ok: true, jours: n, message: null };
}

/* Un montant de condition (réduction ou acompte en euros) : `versCentimes`,
   puis les bornes de la base — jamais 0 (le champ VIDE dit « rien »), jamais
   au-delà du plafond. */
export function versMontantDeDevis(texte) {
  const r = versCentimes(texte);
  if (!r.ok || r.centimes === null) return r;
  if (r.centimes === 0) {
    return { ok: false, centimes: null, message: 'Un montant de 0 ne s’écrit pas : pour ne rien demander, laissez le champ vide.' };
  }
  if (r.centimes > PLAFOND) {
    return { ok: false, centimes: null, message: `Ce montant dépasse ce qu’un devis peut porter (${centimesLisibles(PLAFOND)}).` };
  }
  return r;
}

/* Une condition, dite en clair : « 5 % » ou « 50,00 € ». */
function valeurDeCondition(pourcent, montant) {
  if (present(montant)) return centimesLisibles(montant);
  if (present(pourcent)) return tauxLisible(pourcent);
  return null;
}

/**
 * LE RÉSUMÉ DES CONDITIONS, la rangée qui ouvre la carte « Conditions » :
 * ce qui MANQUE d'abord (un acompte sans sa nature, une validité pas
 * choisie), puis ce qui est posé — « Réduction 5 % · Acompte 30 % · Valable
 * 30 jours ». Une phrase, que l'écran coupe à deux lignes.
 *
 * RIEN DE POSÉ : « Validité à choisir » (lot 2b-1, critique E-12). Ce résumé
 * disait « Aucune condition — touchez pour en poser » : une invitation
 * facultative, juste au-dessus de la liste « Ce qu'il manque pour remettre
 * ce devis », qui compte la validité comme un point à compléter. Deux
 * rangées voisines se contredisaient. Le cas « rien de posé » n'a plus de
 * phrase à lui : sans validité, elle MANQUE, et le résumé le dit comme il le
 * disait déjà quand une autre condition était posée — il n'est donc jamais
 * vide.
 *
 * 2b-3 (M6 écran) : « Acompte 30 % à la signature » quand l'artisan a
 * choisi « À la signature » (`acompteALaSignature === true`) et qu'un
 * acompte est posé — sinon ce choix ne se verrait qu'en ouvrant la carte.
 *
 * 2b-4 (T15, critique ÉCRAN-15) : LE PRIX DU DEVIS LUI-MÊME. Tant qu'il n'est
 * pas dit, il MANQUE, et le résumé le dit en tête, après la validité —
 * « Devis lui-même : gratuit ou payant ? à choisir » — sinon la rangée ferait
 * croire les conditions complètes sous un point « Pour le remettre » qui dit
 * le contraire (la décision E-12, encore). Dit, il vient EN FIN, à la place
 * où le bloc vit dans la carte : « Devis lui-même gratuit » ou « Devis
 * lui-même payant 30,00 € ». « lui-même » partout : « devis gratuit » se
 * lirait comme le TOTAL (T19).
 */
export function resumeDesConditions(d) {
  const x = d || {};
  const reduction = valeurDeCondition(x.remiseCentiemes, x.remiseCentimes);
  const acompte = valeurDeCondition(x.acompteCentiemes, x.acompteCentimes);
  const retenue = present(x.retenueGarantieCentiemes) ? tauxLisible(x.retenueGarantieCentiemes) : null;
  const manque = [];
  if (acompte && !present(x.acompteNature)) manque.push('Acompte ou arrhes ? à choisir');
  if (!present(x.validiteJours)) manque.push('Validité à choisir');
  if (!present(x.coutDevisCentimes)) manque.push('Devis lui-même : gratuit ou payant ? à choisir');
  const pose = [];
  if (reduction) pose.push(`Réduction ${reduction}`);
  if (acompte) pose.push(`${libelleAcompte(x.acompteNature)} ${acompte}${x.acompteALaSignature === true ? ' à la signature' : ''}`);
  if (present(x.validiteJours)) pose.push(`Valable ${x.validiteJours} jour${x.validiteJours > 1 ? 's' : ''}`);
  if (retenue) pose.push(`Retenue ${retenue}`);
  if (x.coutDevisCentimes === 0) pose.push('Devis lui-même gratuit');
  else if (present(x.coutDevisCentimes)) pose.push(`Devis lui-même payant ${centimesLisibles(x.coutDevisCentimes)}`);
  return [...manque, ...pose].join(' · ');
}

/**
 * LES RANGÉES DES TOTAUX — la seule source de la ventilation du bas du
 * devis et du haut de la carte « Conditions ». Des rangées `{ cle, libelle,
 * centimes, fort, moins, aDire }`, dans l'ordre où elles se lisent :
 *   - avec une RÉDUCTION : le total avant réduction, puis la réduction ;
 *   - au régime réel : le total HT, la TVA de chaque taux (sur sa base
 *     NETTE), la TVA, le total TTC ; sinon « Total » seul (règle C2 : un
 *     régime qu'on ne connaît pas ne fait pas nommer la taxe) ;
 *   - avec des OPTIONS : le total toutes options comprises ;
 *   - avec un ACOMPTE : l'acompte (ou les arrhes) et le reste à payer —
 *     « avant la retenue de garantie » quand il y en a une (DROIT-7).
 * `moins` : la réduction s'affiche « − 50,00 € », mais se DIT comme un
 * montant positif sous son libellé (`aDire`) — jamais avec un trait
 * d'union, que VoiceOver lit « tiret ». Les montants sont ceux que la BASE
 * a calculés (`totaux`), jamais refaits ici.
 */
export function rangeesDesTotaux(totaux, etatRegime, { nbOptions = 0 } = {}) {
  if (!totaux) return [];
  const L = libellesDesTotaux(etatRegime);
  /* LE DEVIS DE L'ÉCRAN N'EST PLUS LU ICI : pourcentages, nature, retenue,
     tout vient de la demande RELUE (`totaux.demande`), comme les montants —
     l'écran précède la base pendant un envoi, et après un envoi raté. */
  /* LE POURCENTAGE DU LIBELLÉ VIENT DE LA DEMANDE QUE LA BASE A VUE
     (`totaux.demande`), comme le montant à côté de lui : pendant un envoi,
     ou après un envoi raté, la demande de l'écran le précède, et la rangée
     disait « Réduction 20 %, 65,95 € » — 65,95 €, c'était 5 % (relecture
     ÉCRAN-2 du lot 2a, mesuré). Les totaux sans demande (une forme
     ancienne) ne disent pas de pourcentage. */
  const vue = totaux.demande && typeof totaux.demande === 'object' ? totaux.demande : {};
  const r = [];
  const reduction = Number(totaux.reduction) || 0;
  /* « Total avant réduction » est un montant HORS TAXE : quand l'écran ne
     nomme pas la taxe et que les lignes en portent (un régime en lecture,
     ou illisible), le comparer au « Total », qui la comprend, ferait lire
     deux montants qui ne se soustraient pas. La réduction ne se montre alors
     que dans la carte « Conditions ». */
  if (reduction > 0 && (L.taxe || !(Number(totaux.tva) > 0))) {
    const brut = present(totaux.brut) ? totaux.brut : (Number(totaux.ht) || 0) + reduction;
    r.push({ cle: 'brut', libelle: L.brut, centimes: brut });
    const pct = present(vue.remiseCentiemes) && !present(vue.remiseCentimes) ? ` ${tauxLisible(vue.remiseCentiemes)}` : '';
    r.push({ cle: 'reduction', libelle: `${L.reduction}${pct}`, centimes: reduction, moins: true });
  }
  if (L.taxe) {
    r.push({ cle: 'net', libelle: L.net, centimes: totaux.ht });
    (totaux.ventilation || []).forEach((v) => {
      const taux = tauxLisible(v.taux);
      r.push({
        cle: `tva:${v.taux}`, libelle: taux ? `TVA ${taux} sur` : 'Sans TVA, sur', base: v.base, centimes: v.tva,
      });
    });
    r.push({ cle: 'tva', libelle: L.tva, centimes: totaux.tva });
  }
  r.push({ cle: 'total', libelle: L.total, centimes: totaux.ttc, fort: true });
  if (nbOptions > 0 && present(totaux.ttcOptions)) {
    r.push({ cle: 'options', libelle: L.totalOptions, centimes: totaux.ttcOptions });
  }
  const acompte = Number(totaux.acompte) || 0;
  if (acompte > 0) {
    const pct = present(vue.acompteCentiemes) && !present(vue.acompteCentimes) ? ` ${tauxLisible(vue.acompteCentiemes)}` : '';
    /* La NATURE et la RETENUE, elles aussi, de la demande RELUE : un libellé
       et le montant à côté de lui viennent de la même photo de la base. */
    r.push({ cle: 'acompte', libelle: `${libelleAcompte(vue.acompteNature)}${pct}`, centimes: acompte });
    r.push({
      cle: 'reste',
      libelle: present(vue.retenueGarantieCentiemes) ? 'Reste à payer, avant la retenue de garantie' : 'Reste à payer',
      centimes: (Number(totaux.ttc) || 0) - acompte,
    });
  }
  return r.map((e) => ({ ...e, aDire: `${e.libelle}${e.base != null ? ` ${centimesLisibles(e.base)}` : ''}, ${centimesLisibles(e.centimes) || 'montant inconnu'}` }));
}

/**
 * LE SUFFIXE DU PIED, qui reste UNE rangée (décision du lot 1) : ce qui
 * n'est pas parti passe avant tout, puis l'envoi en cours, puis « réduction
 * comprise ». Une seule mention à la fois : à 320 points, deux se coupaient.
 */
export function suffixeDuPied({ nbNonEnregistrees = 0, enCours = false, reduction = 0 } = {}) {
  if (nbNonEnregistrees > 0) {
    return ` · ${nbNonEnregistrees} ${nbNonEnregistrees > 1 ? 'lignes non enregistrées' : 'ligne non enregistrée'}`;
  }
  if (enCours) return ' · enregistrement en cours';
  if (reduction > 0) return ' · réduction comprise';
  return '';
}

/* ------------------------------------------------------------------ */
/*  LA DEMANDE QUE LA BASE A VUE (relecture ÉCRAN-1 du lot 2a)          */
/* ------------------------------------------------------------------ */

/** Les quatre colonnes de la DEMANDE — ce que l'artisan a écrit dans la
 *  carte « Conditions » —, à côté de ce que la base en a fait (la réduction
 *  et l'acompte EFFECTIFS, ramenés au total quand ils le dépassent). */
export const COLONNES_DE_LA_DEMANDE = Object.freeze(['remiseCentimes', 'remiseCentiemes', 'acompteCentimes', 'acompteCentiemes']);

/**
 * LA DEMANDE D'UN DEVIS, telle qu'une ligne la porte : ces quatre colonnes,
 * `null` pour une absente. Les totaux relus la portent (`totaux.demande`,
 * `totauxDepuisBase` dans `api.js`, et la démonstration) : c'est CONTRE
 * ELLE qu'un montant se juge « ramené ».
 *
 * POURQUOI : l'écran change sa demande AVANT l'envoi (`changerDevis`), et
 * les totaux ne sont relus qu'APRÈS (quand la file devient inactive).
 * Comparer la demande de l'écran aux totaux relus faisait dire « Ramenée à
 * 0,00 € : le total des postes est plus petit que la réduction demandée »
 * pendant chaque envoi — et POUR TOUJOURS après un envoi raté : la base
 * n'avait simplement pas encore vu la demande (relecture ÉCRAN-1, mesuré).
 */
export function demandeDuDevis(d) {
  const x = d || {};
  return {
    ...Object.fromEntries(COLONNES_DE_LA_DEMANDE.map((c) => [c, present(x[c]) ? Number(x[c]) : null])),
    /* …ET CE QUI NOMME LES RANGÉES (contre-vérification de la relecture
       ÉCRAN-2 du lot 2a, mesurée au navigateur) : la NATURE de l'acompte et
       la RETENUE ne changent aucun montant, mais elles changent les libellés
       — « Arrhes 30 % », « reste à payer, avant la retenue de garantie ».
       Lus dans le devis de l'écran, ils précédaient la base : après une
       écriture ratée, la rangée disait « Arrhes 30 %, 444,87 € » quand la
       base avait gardé un ACOMPTE, et taisait une retenue que la base avait
       encore. Une rangée dit ce que la base a, libellé ET montant. */
    acompteNature: NATURES_ACOMPTE.includes(x.acompteNature) ? x.acompteNature : null,
    retenueGarantieCentiemes: present(x.retenueGarantieCentiemes) ? Number(x.retenueGarantieCentiemes) : null,
    /* 2b-2 : la réponse « à quel titre », son client, et le chantier — les
       clés de `totauxDepuisBase`, valeurs telles quelles (la base n'en range
       pas d'autres). */
    clientId: x.clientId ?? null,
    pourQui: x.pourQui ?? null,
    pourQuiClient: x.pourQuiClient ?? null,
    chantierNeufConso: x.chantierNeufConso ?? null,
    chantierNeufConsoLe: x.chantierNeufConsoLe ?? null,
    chantierNeufTva: x.chantierNeufTva ?? null,
  };
}

/** Les deux colonnes de la demande relue qui ne servent qu'aux LIBELLÉS. */
export const LIBELLES_DE_LA_DEMANDE = Object.freeze(['acompteNature', 'retenueGarantieCentiemes']);

/* La paire `remise` ou `acompte` est-elle LA MÊME dans la demande de
   l'écran et dans celle que la base a vue ? Sans demande relue (une forme
   ancienne des totaux), on ne sait pas : non. */
function memePaire(locale, vue, prefixe) {
  if (!vue || typeof vue !== 'object') return false;
  return [`${prefixe}Centimes`, `${prefixe}Centiemes`].every((c) => {
    const a = present(locale[c]) ? Number(locale[c]) : null;
    const b = present(vue[c]) ? Number(vue[c]) : null;
    return a === b;
  });
}

/** Ce que dit la carte tant que la base n'a pas encore vu la demande. */
export const CALCUL_EN_COURS = 'Calcul en cours…';

/**
 * CE QUE LA CARTE DIT DE LA RÉDUCTION ET DE L'ACOMPTE, sous chaque champ :
 * l'effet en clair, et le mot qui dit qu'une demande a été RAMENÉE au total
 * (elle n'est jamais refusée : retirer une ligne doit rester possible).
 * VoiceOver lit `aDire`.
 *
 * TROIS RÈGLES, et aucune n'est décorative (relecture ÉCRAN-1 et ÉCRAN-10
 * du lot 2a) :
 *   - on ne juge QUE contre la demande que la base a vue (`totaux.demande`).
 *     Tant que la demande de l'écran en diffère, l'envoi n'est pas fini :
 *     « Calcul en cours… » ;
 *   - APRÈS UN ÉCHEC (`enEchec` : l'écriture n'est pas partie, ou les totaux
 *     n'ont pas pu être relus), on se TAIT plutôt que de dire une phrase
 *     fausse : la ligne d'état de la carte dit l'échec, et « Réessayer » ;
 *   - la phrase suit la règle de `rangeesDesTotaux` : quand l'écran ne
 *     nomme pas la taxe (régime en lecture, en échec, non déclaré, ou une
 *     franchise dont des lignes portent quand même de la TVA), elle ne
 *     compare pas un montant HORS TAXE au « Total » affiché au-dessus, qui
 *     la comprend. Elle dit la réduction appliquée, sans « avant » ni
 *     « après ».
 */
export function effetDeLaReduction(totaux, devis = {}, etatRegime = undefined, { enEchec = false } = {}) {
  if (!totaux) return null;
  const x = devis || {};
  if (!present(x.remiseCentiemes) && !present(x.remiseCentimes)) return null;
  if (!memePaire(x, totaux.demande, 'remise')) {
    return enEchec ? null : { enCours: true, ramenee: false, aDire: CALCUL_EN_COURS };
  }
  const vue = totaux.demande;
  const reduction = Number(totaux.reduction) || 0;
  if (present(vue.remiseCentimes) && reduction < vue.remiseCentimes) {
    return {
      ramenee: true,
      aDire: `Ramenée à ${centimesLisibles(reduction)} : le total des postes est plus petit que la réduction demandée.`,
    };
  }
  const L = libellesDesTotaux(etatRegime);
  if (!L.taxe && Number(totaux.tva) > 0) {
    return { ramenee: false, aDire: `Réduction appliquée aux postes : ${centimesLisibles(reduction)}.` };
  }
  const brut = present(totaux.brut) ? totaux.brut : (Number(totaux.ht) || 0) + reduction;
  return {
    ramenee: false,
    aDire: `Le total${L.taxe ? ' HT' : ''} des postes passe de ${centimesLisibles(brut)} à ${centimesLisibles(brut - reduction)}.`,
  };
}
export function effetDeLAcompte(totaux, devis = {}, etatRegime = undefined, { enEchec = false } = {}) {
  if (!totaux) return null;
  const x = devis || {};
  if (!present(x.acompteCentiemes) && !present(x.acompteCentimes)) return null;
  if (!memePaire(x, totaux.demande, 'acompte')) {
    return enEchec ? null : { enCours: true, ramene: false, aDire: CALCUL_EN_COURS };
  }
  const vue = totaux.demande;
  const acompte = Number(totaux.acompte) || 0;
  const ttc = Number(totaux.ttc) || 0;
  /* « Avant la retenue » selon la BASE, comme les montants de la phrase. */
  const reste = present(vue.retenueGarantieCentiemes) ? 'reste à payer, avant la retenue de garantie' : 'reste à payer';
  if (present(vue.acompteCentimes) && acompte < vue.acompteCentimes) {
    return {
      ramene: true,
      aDire: `Ramené à ${centimesLisibles(acompte)} : le total est plus petit que le montant demandé.`,
    };
  }
  /* Le reste se compte sur le « Total » affiché au-dessus (le TTC) : il se
     soustrait toujours à lui, quel que soit le régime. */
  const unite = libellesDesTotaux(etatRegime).taxe ? ' TTC' : '';
  return { ramene: false, aDire: `${centimesLisibles(acompte)}${unite} — ${reste} ${centimesLisibles(ttc - acompte)}${unite}.` };
}

/** Le nom d'un acompte selon sa NATURE — jamais l'un pour l'autre : des
 *  arrhes permettent de se dédire en les perdant, un acompte engage
 *  (C. conso. L. 214-1). SANS NATURE, UN NOM NEUTRE, « Acompte ou arrhes »
 *  (relecture ÉCRAN-8 et CONTROLES-10 du lot 2a) : la carte refuse de
 *  pré-choisir la nature, et l'écran ne doit pas la nommer à sa place —
 *  face à un particulier, à défaut d'écrit, la somme versée d'avance vaut
 *  même des ARRHES, l'inverse de « Acompte ». */
export function libelleAcompte(nature) {
  if (nature === 'arrhes') return 'Arrhes';
  if (nature === 'acompte') return 'Acompte';
  return 'Acompte ou arrhes';
}

/* ================================================================== */
/*  LE PRIX DU DEVIS LUI-MÊME (étape 2b-4, 16/11/2026)                  */
/* ================================================================== */
/*
 * CE QUE C'EST : le prix de l'ÉTABLISSEMENT du devis, pas celui des travaux
 * (`devis.cout_devis_centimes`, section 49.4 quinquies). L'arrêté du
 * 24/01/2017 (art. 4-I) demande de dire sur le devis s'il est gratuit ou
 * payant, au moins pour un dépannage, une réparation ou un entretien signé
 * dans les locaux de l'artisan ; Opus ne sait pas où le devis sera signé, et
 * compte donc le vide comme un point « Par prudence » (rang 12, réponse Q2
 * du 16/11). TROIS ÉTATS dans une seule colonne, comme
 * `tarifs_pro.prix_devis_centimes` (lot T) : vide (pas dit), 0 (gratuit), un
 * montant (payant, en centimes TTC, jusqu'à `COUT_DEVIS_MAX`).
 *
 * HORS DES TOTAUX (T5) : c'est le prix d'un AUTRE contrat que les travaux ;
 * son imputation sur les travaux (« déduit si vous acceptez ») et son taux
 * de TVA sont des questions de 2c et du juriste (J13, J50). L'aide le dit.
 *
 * OPUS PROPOSE, L'ARTISAN CONFIRME (T3, T6, ÉCRAN-2) : la proposition vient
 * de « Mes tarifs », À L'ÉCRAN — jamais de la base, dont la fonction ne lit
 * pas `tarifs_pro` (la porte étroite). Elle est une PHRASE (« Dans vos
 * tarifs : … ») et, seulement quand les tarifs disent PAYANT, un champ
 * pré-rempli APRÈS un appui sur « Payant ». Rien n'est écrit sans appui ; le
 * 0 ne s'écrit que par « Gratuit ».
 */

/** Les deux choix de la carte, dans l'ordre des pastilles. */
const CHOIX_DU_COUT = Object.freeze(['gratuit', 'payant']);

/* Le choix qu'un prix ENREGISTRÉ représente : 0 → « Gratuit », un montant →
   « Payant », vide (ou illisible) → rien de choisi. */
function choixDuCout(v) {
  if (v === 0) return 'gratuit';
  if (entier(v) && v > 0) return 'payant';
  return null;
}

/** LES MOTS DU BLOC, dans la carte « Conditions » (cahier 2b-4, annexe A.2)
 *  — tous ici : `ConditionsDevis.js` les importe, jamais ne les recopie.
 *  « Le devis lui-même » partout (T19, critique ÉCRAN-5) : « ce devis est
 *  gratuit » se lirait comme le TOTAL des travaux, et `avis_gratuit` (le
 *  TOTAL à 0) peut sortir à côté. Le `placeholder` est un MOT, jamais un
 *  nombre : un texte d'exemple qui ressemble à une donnée est lu comme une
 *  donnée. */
export const LE_COUT_DU_DEVIS = Object.freeze({
  titre: 'Le devis lui-même : gratuit ou payant ?',
  gratuit: 'Gratuit',
  payant: 'Payant',
  nomGratuit: 'Le devis lui-même est gratuit',
  nomPayant: 'Le devis lui-même est payant',
  placeholder: 'Montant',
});

/** L'AIDE FIXE du bloc, sous les pastilles (annexe A.2). La première phrase
 *  vient de l'arrêté du 24/01/2017 (art. 2) et de L. 111-1 2° ; la deuxième
 *  dit le calcul d'Opus (T5 : le bloc est juste au-dessus du récapitulatif
 *  des totaux) ; la troisième vient de l'arrêté du 17/03/2015 (art. 6) — la
 *  seule chose qu'Opus dit des services à la personne (réponse Q3 du 16/11 :
 *  aucune question, aucune case, aucun motif). */
export const AIDE_COUT_DEVIS = 'Un particulier doit savoir, avant de s’engager, si le devis lui-même est gratuit ou '
  + 'payant, et ce qu’il coûte. Ce prix ne s’ajoute pas au total des travaux. Pour des services à la personne chez un '
  + 'particulier (petit jardinage, petit bricolage), le devis est toujours gratuit.';

/**
 * UN PRIX DE DEVIS TAPÉ dans le champ de « Payant » : `versCentimes`, puis
 * les bornes de `devis_cout_check`.
 *   - VIDE → `null`, SANS ERREUR (T18, critique ÉCRAN-1) : rien de dit ;
 *   - « 0 » → une erreur qui renvoie à « Gratuit » (T3 : le 0 ne s'écrit que
 *     par la pastille) ;
 *   - au-delà de `COUT_DEVIS_MAX` → une erreur, le plafond écrit par
 *     `centimesLisibles` (jamais « € » écrit dans ce fichier) ;
 *   - illisible → le message de `versCentimes`.
 * À ne pas confondre avec `versMontantDeDevis` (la réduction et l'acompte en
 * euros), dont le 0 se refuse avec une autre phrase et la borne est le
 * plafond d'un devis.
 */
export function versCoutDeDevis(texte) {
  const r = versCentimes(texte);
  if (!r.ok) return r;
  if (r.centimes === null) return { ok: true, centimes: null, message: null };
  if (r.centimes === 0) {
    return { ok: false, centimes: null, message: 'Pour dire que ce devis est gratuit, touchez « Gratuit ».' };
  }
  if (r.centimes > COUT_DEVIS_MAX) {
    return { ok: false, centimes: null, message: `Le prix d’un devis s’écrit jusqu’à ${centimesLisibles(COUT_DEVIS_MAX)}.` };
  }
  return r;
}

/**
 * CE QUE « PAYANT » ÉCRIT quand son champ n'est pas encore monté (on vient
 * de toucher la pastille) : le prix déjà ENREGISTRÉ s'il est payant, sinon
 * le prix PROPOSÉ par les tarifs (`coutPropose`, des centimes plus grands
 * que 0 — `coutAProposer` le tire), sinon `null`. JAMAIS 0 (critique
 * ÉCRAN-2), quoi qu'on lui passe : un 0 enregistré (« Gratuit ») ou proposé
 * n'est pas un prix payant. `depuisLesTarifs` dit si c'est la proposition
 * qui part — l'écran l'annonce alors (`annonceDuCoutPropose`).
 */
export function coutQuePayantEcrit({ devis = {}, coutPropose = null } = {}) {
  const enregistre = (devis || {}).coutDevisCentimes;
  if (entier(enregistre) && enregistre > 0) return { centimes: enregistre, depuisLesTarifs: false };
  if (entier(coutPropose) && coutPropose > 0 && coutPropose <= COUT_DEVIS_MAX) {
    return { centimes: coutPropose, depuisLesTarifs: true };
  }
  return { centimes: null, depuisLesTarifs: false };
}

/**
 * CE QUE DISENT LES TARIFS du prix des devis (`tarifs_pro.prix_devis_centimes`,
 * déclaré dans « Mon entreprise ») : `{ etat, centimes }`, `etat` parmi
 * `'gratuit'`, `'payant'`, `'rien'` (lus, rien de déclaré — ou aucune
 * ligne), `'illisible'` (la lecture a échoué) et `null` (en lecture, ou pas
 * transmis : on se tait). Jamais « rien » pour un échec : la règle de
 * `tauxHorairePropose`.
 */
export function coutDuDevisPropose(etatTarifs) {
  const t = tarifsConnus(etatTarifs);
  if (!t) {
    return etatTarifs && typeof etatTarifs === 'object' && etatTarifs.echec
      ? { etat: 'illisible', centimes: null } : { etat: null, centimes: null };
  }
  const v = t.ligne ? t.ligne.prix_devis_centimes : null;
  if (v === 0) return { etat: 'gratuit', centimes: 0 };
  if (entier(v) && v > 0) return { etat: 'payant', centimes: v };
  return { etat: 'rien', centimes: null };
}

/** LE PRIX QUE « PAYANT » PEUT REPRENDRE, écrit UNE fois (critique ÉCRAN-2) :
 *  seulement quand les tarifs disent PAYANT. Des tarifs « gratuit » rendent
 *  `null` — un appui sur « Payant » n'écrit pas 0 —, comme « rien »,
 *  « illisible » et la lecture. */
export function coutAProposer(propose) {
  return propose && propose.etat === 'payant' && entier(propose.centimes) && propose.centimes > 0
    ? propose.centimes : null;
}

/**
 * LA PHRASE DE LA PROPOSITION, sous les pastilles (annexe A.2). « TTC »
 * partout SAUF en franchise : les tarifs se déclarent TTC dans « Mon
 * entreprise » quel que soit le régime (`FicheEmetteur.js`), et en franchise
 * l'écran ne nomme pas la taxe (`libellesDesTotaux`). La même règle que le
 * libellé du champ (`libellesDesConditions`). `null` quand les tarifs sont
 * en lecture : on se tait.
 */
export function phraseDuCoutPropose(propose, etatRegime) {
  const etat = propose ? propose.etat : null;
  if (etat === 'gratuit') return 'Dans vos tarifs : vos devis sont gratuits.';
  if (etat === 'payant') {
    const franchise = regimeConnu(etatRegime) === 'franchise';
    return `Dans vos tarifs : ${centimesLisibles(propose.centimes)}${franchise ? '' : ' TTC'}.`;
  }
  if (etat === 'rien') return 'Vos tarifs ne disent pas encore le prix de vos devis.';
  if (etat === 'illisible') return 'Vos tarifs n’ont pas pu être lus.';
  return null;
}

/** CE QUE VOICEOVER ENTEND quand « Payant » vient d'écrire le prix des
 *  tarifs (critique ÉCRAN-14, point 3) : un champ qui se remplit tout seul
 *  doit le dire, sur le modèle de « Ramenée à … ». */
export function annonceDuCoutPropose(centimes) {
  return `Prix du devis : ${centimesLisibles(centimes)}, d’après vos tarifs.`;
}

/* ================================================================== */
/*  LA CARTE « CONDITIONS » : SON ÉTAT, SA LECTURE (relecture du lot 2a) */
/* ================================================================== */
/* Tout ce que la carte DÉCIDE vit ici, en fonctions pures, pour que
   `verifier-devis` les fasse TOURNER (la leçon de `cloudinary-adresses.js`) :
   un composant React ne se fait pas tourner par `node`. */

const UNITES_DE_CONDITION = Object.freeze(['pourcent', 'montant']);
const estVide = (t) => String(t == null ? '' : t).replace(ESPACES_TAPES, '') === '';

/* L'unité de la valeur ENREGISTRÉE (la demande de l'écran) : 'montant',
   'pourcent', ou `null` quand il n'y en a pas. `prefixe` : 'remise' ou
   'acompte'. */
function uniteEnregistree(devis, prefixe) {
  const x = devis || {};
  if (present(x[`${prefixe}Centimes`])) return 'montant';
  if (present(x[`${prefixe}Centiemes`])) return 'pourcent';
  return null;
}

/** Le texte d'un champ de la carte pour UNE unité : la valeur enregistrée
 *  quand elle est dans cette unité, sinon le champ vide. C'est ce qu'écrit
 *  une pastille d'unité dans le champ (ÉCRAN-9) : jamais le nombre tapé
 *  dans l'autre unité, qui voudrait dire autre chose. */
export function texteEnregistreDans(devis, prefixe, unite) {
  const x = devis || {};
  if (unite === 'montant') return centimesEnSaisie(x[`${prefixe}Centimes`]);
  return centiemesEnSaisie(x[`${prefixe}Centiemes`]);
}

/**
 * L'ÉTAT DE LA CARTE À SON OUVERTURE (relecture CONTROLES-2, ÉCRAN-3 et
 * ÉCRAN-4 du lot 2a) : les unités, la nature, la validité, la retenue.
 *
 * - SUR UN DEVIS VIERGE, RIEN N'EST CHOISI À LA PLACE DE L'ARTISAN : ni
 *   nature (`null`), ni validité (`null`), ni « Autre », ni retenue
 *   (décisions du 03/11). Seules les UNITÉS ont une position de départ, le
 *   pourcentage : une unité n'est pas une valeur.
 * - `textes` : ce que la saisie a GARDÉ d'une carte refusée (`lireConditions`
 *   le rend, la saisie le garde tant qu'une valeur est refusée) — les
 *   textes tapés, et les CHOIX de la carte (`textes.choix`). « Corriger »
 *   rouvre donc la carte comme on l'a laissée : un montant refusé en euros
 *   revient sous la pastille « € », pas sous « % », où « 35,50 » serait
 *   devenu 35,5 % (ÉCRAN-3, mesuré). Un champ resté VIDE n'a rien à
 *   corriger : il rouvre dans l'unité de la valeur enregistrée (ÉCRAN-9).
 * - Un texte de validité refusé rouvre « Autre », avec son champ ; un texte
 *   de retenue refusé rouvre l'interrupteur (ÉCRAN-4 : le message « de 1 à
 *   365 jours » s'affichait sans le champ qu'il visait).
 * - 2b-3 (E-B1) : `echeance`, le moment où le client paie l'acompte — `true`
 *   (« À la signature ») si `acompteALaSignature === true`, `false` (« Dès
 *   le 8e jour ») s'il vaut `false`, `null` (rien de choisi : le 8e jour par
 *   défaut) sinon. « Corriger » le rouvre comme on l'a laissé.
 * - 2b-4 : `cout`, le prix du devis LUI-MÊME — `'gratuit'` si
 *   `coutDevisCentimes` vaut 0, `'payant'` s'il est plus grand, `null` s'il
 *   est vide. JAMAIS d'après les tarifs (« Opus propose, l'artisan
 *   confirme ») : des tarifs qui disent « gratuit » ne choisissent pas la
 *   pastille « Gratuit » à sa place. Conséquence assumée (T18) : une carte
 *   rouverte sur un « Payant » resté SANS prix ne montre aucune pastille
 *   choisie — rien n'est dit, et le point de « Pour le remettre » le dit.
 *   Un prix tapé et refusé (« 0 », « 2000 ») rouvre « Payant » avec son
 *   champ, comme la retenue.
 */
export function etatInitialConditions(devis, textes = null) {
  const x = devis || {};
  const t = textes && typeof textes === 'object' ? textes : null;
  const proposee = present(x.validiteJours) && VALIDITES_PROPOSEES.includes(x.validiteJours);
  const etat = {
    uniteReduction: uniteEnregistree(x, 'remise') || 'pourcent',
    uniteAcompte: uniteEnregistree(x, 'acompte') || 'pourcent',
    nature: NATURES_ACOMPTE.includes(x.acompteNature) ? x.acompteNature : null,
    validite: proposee ? x.validiteJours : null,
    validiteAutre: present(x.validiteJours) && !proposee,
    retenue: present(x.retenueGarantieCentiemes),
    echeance: x.acompteALaSignature === true ? true : (x.acompteALaSignature === false ? false : null),
    cout: choixDuCout(x.coutDevisCentimes),
  };
  const garde = t && t.choix && typeof t.choix === 'object' ? t.choix : null;
  if (garde) {
    if (UNITES_DE_CONDITION.includes(garde.uniteReduction) && !estVide(t.reduction)) etat.uniteReduction = garde.uniteReduction;
    if (UNITES_DE_CONDITION.includes(garde.uniteAcompte) && !estVide(t.acompte)) etat.uniteAcompte = garde.uniteAcompte;
    if (garde.nature === null || NATURES_ACOMPTE.includes(garde.nature)) etat.nature = garde.nature;
    if (garde.validite === null || VALIDITES_PROPOSEES.includes(garde.validite)) etat.validite = garde.validite;
    if (typeof garde.validiteAutre === 'boolean') etat.validiteAutre = garde.validiteAutre;
    if (typeof garde.retenue === 'boolean') etat.retenue = garde.retenue;
    if (garde.echeance === null || typeof garde.echeance === 'boolean') etat.echeance = garde.echeance;
    if (garde.cout === null || CHOIX_DU_COUT.includes(garde.cout)) etat.cout = garde.cout;
  }
  if (t && !estVide(t.validite)) { etat.validiteAutre = true; etat.validite = null; }
  if (t && !estVide(t.retenue)) etat.retenue = true;
  if (t && !estVide(t.cout)) etat.cout = 'payant';
  return etat;
}

/**
 * LA RETENUE DE GARANTIE TAPÉE dans la carte : `versCentiemes`, puis les
 * bornes de `devis_retenue_check` — de 0,01 % à 5 % (loi n° 71-584,
 * art. 1er). Bornée ICI, la faute se dit sous le champ, avec le texte
 * tapé ; laissée à `validerDevis`, « 6 » était refusé AILLEURS, son texte
 * jeté, et « Corriger » rouvrait la carte sur « 5 » avec, dessous, le
 * message du refus — on lisait que « 5 » était refusé (relecture ÉCRAN-5).
 */
export function versRetenueDeDevis(texte) {
  const r = versCentiemes(texte);
  if (!r.ok || r.centiemes === null) return r;
  if (r.centiemes < 1 || r.centiemes > RETENUE_MAX) {
    return {
      ok: false,
      centiemes: null,
      message: `Une retenue de garantie s’écrit entre ${tauxLisible(1)} et ${tauxLisible(RETENUE_MAX)} (loi n°\u00a071-584, art. 1er). `
        + 'Si vous n’en prévoyez pas, éteignez l’interrupteur.',
    };
  }
  return r;
}

/**
 * CE QUE LA CARTE PORTE À CET INSTANT : `changements` (les PAIRES entières),
 * `erreurs` (ce qui ne se lit pas, champ par champ, avec sa phrase) et
 * `textes` (ce qui est tapé). `tapes` : le texte de chaque champ MONTÉ —
 * `undefined` pour un champ qui ne l'est pas encore (on vient de toucher
 * « Autre », ou d'allumer la retenue).
 *
 * TROIS RÈGLES, chacune née d'un défaut mesuré (relecture du lot 2a) :
 *   - UNE PASTILLE D'UNITÉ N'ÉCRIT RIEN (ÉCRAN-9). Elle vide le champ (ou y
 *     remet la valeur enregistrée dans cette unité) ; un champ VIDE dans une
 *     autre unité que la valeur enregistrée ne dit rien, et la valeur RESTE
 *     jusqu'à ce qu'un nombre soit tapé. Avant, « 10 % » puis la pastille
 *     « € » enregistrait 10,00 €, sans rien retaper. Retirer une réduction
 *     reste possible : on vide le champ DANS l'unité de la valeur ;
 *   - « AUTRE » N'EFFACE PAS UNE VALIDITÉ (ÉCRAN-4) : le champ n'est pas
 *     encore monté au moment de l'appui ; il naît avec la valeur
 *     enregistrée, et c'est elle qui part — comme la retenue rallumée ;
 *   - LA RETENUE SE BORNE ICI (ÉCRAN-5, `versRetenueDeDevis`).
 *
 * 2b-4 — LE PRIX DU DEVIS LUI-MÊME (`c.cout`, T3, T18, critiques ÉCRAN-1,
 * ÉCRAN-2, ÉCRAN-4). `coutPropose` : le prix que les tarifs PROPOSENT, des
 * centimes plus grands que 0, ou `null` (`coutAProposer`, qui rend `null`
 * quand les tarifs disent « gratuit »). Selon le choix :
 *   - `undefined` (un `choix` d'avant 2b-4) : RIEN, aucune clé — comme
 *     l'échéance ;
 *   - « Gratuit » : 0 — la SEULE porte du 0 dans tout le devis ;
 *   - rien de choisi (`null`) : `null` (la saisie n'envoie que ce qui
 *     DIFFÈRE de l'en-tête : rien ne part) ;
 *   - « Payant », champ MONTÉ : le texte, par `versCoutDeDevis` — VIDE =
 *     `null`, SANS erreur (ÉCRAN-1 : une erreur deviendrait un refus
 *     d'en-tête, et la garde dirait « ce que vous avez écrit n'est pas
 *     enregistré » à quelqu'un qui n'a rien écrit ; c'est le point de
 *     « Pour le remettre » qui dit ce qui manque) ; « 0 » tapé, une erreur
 *     qui renvoie à « Gratuit » ; au-delà de la borne, une erreur ;
 *   - « Payant », champ PAS ENCORE MONTÉ (on vient de toucher la pastille) :
 *     `coutQuePayantEcrit` — le prix déjà enregistré s'il est payant, sinon
 *     le prix proposé, sinon `null`. JAMAIS 0 (ÉCRAN-2 : chez le
 *     propriétaire, dont les tarifs disent « gratuit », un 0 écrit sous
 *     « Payant » aurait dit « gratuit » sous la pastille « Payant »).
 */
export function lireConditions({ choix = null, tapes = {}, devis = {}, coutPropose = null } = {}) {
  const x = devis || {};
  const c = choix || etatInitialConditions(x);
  const changements = {};
  const erreurs = {};
  const textes = {};

  /* Une paire — la réduction ou l'acompte. Rend `null` quand la paire ne
     dit rien (le champ vide d'une unité en attente), sinon `{ lu }` ou
     `{ faute }`. */
  const paire = (prefixe, unite, texte) => {
    const enregistree = uniteEnregistree(x, prefixe);
    if (estVide(texte) && enregistree && enregistree !== unite) return null;
    if (unite === 'montant') {
      const r = versMontantDeDevis(texte);
      if (!r.ok) { erreurs[`${prefixe}Centimes`] = r.message; return { faute: true }; }
      Object.assign(changements, { [`${prefixe}Centimes`]: r.centimes, [`${prefixe}Centiemes`]: null });
      return { lu: r.centimes !== null };
    }
    const r = versPourcentDeDevis(texte);
    if (!r.ok) { erreurs[`${prefixe}Centiemes`] = r.message; return { faute: true }; }
    Object.assign(changements, { [`${prefixe}Centiemes`]: r.centiemes, [`${prefixe}Centimes`]: null });
    return { lu: r.centiemes !== null };
  };

  textes.reduction = tapes.reduction == null ? '' : String(tapes.reduction);
  paire('remise', c.uniteReduction, textes.reduction);

  textes.acompte = tapes.acompte == null ? '' : String(tapes.acompte);
  const acompte = paire('acompte', c.uniteAcompte, textes.acompte);
  /* La nature part AVEC l'acompte ; retirer l'acompte la vide dans la même
     écriture (une nature sans acompte ne veut rien dire). Une unité en
     attente garde l'acompte enregistré : sa nature peut changer. */
  if (acompte === null) changements.acompteNature = c.nature;
  else if (!acompte.faute) changements.acompteNature = acompte.lu ? c.nature : null;
  /* 2b-3 (E-B1) : l'échéance part TOUJOURS, que l'acompte soit là ou non —
     un acompte retiré GARDE l'échéance, à l'inverse de la nature : elle ne
     dit rien sans acompte (le rang 10 exige un acompte), et la retrouver le
     jour où l'acompte revient évite de la redemander. La saisie n'envoie que
     ce qui DIFFÈRE de l'en-tête : rouvrir puis fermer la carte n'écrit rien.
     Un `choix` qui ne la porte pas (`undefined`) ne dit rien. */
  if (c.echeance !== undefined) changements.acompteALaSignature = c.echeance;

  if (c.validiteAutre) {
    textes.validite = tapes.validite == null
      ? (present(x.validiteJours) ? String(x.validiteJours) : '') : String(tapes.validite);
    const r = versJours(textes.validite);
    if (r.ok) changements.validiteJours = r.jours;
    else erreurs.validiteJours = r.message;
  } else {
    changements.validiteJours = c.validite;
  }

  if (c.retenue) {
    /* L'interrupteur vient d'être allumé : le champ n'est pas encore monté.
       Il naît avec la valeur enregistrée, ou 5 % — c'est celle-là qui part. */
    textes.retenue = tapes.retenue == null
      ? (present(x.retenueGarantieCentiemes) ? centiemesEnSaisie(x.retenueGarantieCentiemes) : '5') : String(tapes.retenue);
    const r = versRetenueDeDevis(textes.retenue);
    if (r.ok) changements.retenueGarantieCentiemes = r.centiemes;
    else erreurs.retenueGarantieCentiemes = r.message;
  } else {
    changements.retenueGarantieCentiemes = null;
  }

  /* 2b-4 : le prix du devis lui-même (voir l'en-tête). */
  if (c.cout === 'gratuit') {
    changements.coutDevisCentimes = 0;
  } else if (c.cout === null) {
    changements.coutDevisCentimes = null;
  } else if (c.cout === 'payant') {
    if (tapes.cout == null) {
      /* La pastille vient d'être touchée : le champ n'est pas encore monté.
         Il naîtra avec ce qui part ici, et c'est ce texte qu'on lui donne. */
      const { centimes } = coutQuePayantEcrit({ devis: x, coutPropose });
      changements.coutDevisCentimes = centimes;
      textes.cout = present(centimes) ? centimesEnSaisie(centimes) : '';
    } else {
      textes.cout = String(tapes.cout);
      const r = versCoutDeDevis(textes.cout);
      if (r.ok) changements.coutDevisCentimes = r.centimes;
      else erreurs.coutDevisCentimes = r.message;
    }
  }
  return { changements, erreurs, textes };
}

/**
 * LA PHRASE D'UNE UNITÉ EN ATTENTE (ÉCRAN-9) : la pastille a vidé le champ,
 * et la valeur de l'écran — dans l'AUTRE unité — reste. La carte le DIT,
 * pour qu'un appui par erreur ne laisse pas croire la réduction retirée.
 * `null` quand l'unité choisie est celle de la valeur, ou qu'il n'y en a pas.
 *
 * « ENREGISTRÉE » SEULEMENT QUAND C'EST VRAI (contre-vérification du lot 2a,
 * mesurée au navigateur) : `demandeVue`, la demande que la BASE a relue
 * (`totaux.demande`). La phrase disait « Enregistrée : 60,00 € » pendant
 * l'envoi, et APRÈS UN ÉCHEC — juste sous la ligne d'état qui disait
 * « n'a pas pu être enregistré », pendant que la base gardait 50 €. Tant
 * que la base n'a pas vu cette valeur : « Pas encore enregistrée ». La
 * règle de `effetDeLaReduction` : on ne juge que contre la demande relue.
 */
export function phraseUniteEnAttente(devis, prefixe, unite, nature = null, demandeVue = null) {
  const x = devis || {};
  const enregistree = uniteEnregistree(x, prefixe);
  if (!enregistree || enregistree === unite) return null;
  const valeur = enregistree === 'montant' ? centimesLisibles(x[`${prefixe}Centimes`]) : tauxLisible(x[`${prefixe}Centiemes`]);
  const quoi = unite === 'montant' ? 'un montant en euros' : 'un pourcentage';
  const vue = memePaire(x, demandeVue, prefixe);
  const mot = (e) => (vue ? `Enregistr${e}` : `Pas encore enregistr${e}`);
  if (prefixe === 'remise') return `${mot('ée')} : ${valeur} — écrivez ${quoi} pour la remplacer.`;
  if (nature === 'arrhes') return `${mot('ées')} : ${valeur} — écrivez ${quoi} pour les remplacer.`;
  return `${mot('é')} : ${valeur} — écrivez ${quoi} pour le remplacer.`;
}

/** Ce qu'ajoutent les aides au RÉGIME RÉEL (relecture ÉCRAN-7 du lot 2a) :
 *  la base range une réduction en euros HORS TAXES (elle baisse la base de
 *  TVA, `remise_centimes`) et un acompte en euros TOUTES TAXES COMPRISES
 *  (`acompte_centimes`). Les deux champs se présentaient pareil, et un
 *  artisan qui tapait la remise promise au client (100 €, un montant TTC
 *  pour un particulier) en accordait 110 ou 120 € TTC. En franchise, il n'y
 *  a pas de TVA : rien à ajouter. */
export const AIDE_REDUCTION_HT = 'En euros, la réduction est hors taxes : elle baisse le total HT, et la TVA avec lui.';
export const AIDE_ACOMPTE_TTC = 'En euros, la somme est toutes taxes comprises : c’est ce que le client verse.';

/**
 * LES NOMS DES CHAMPS ET DES PASTILLES DE LA CARTE, selon le régime et la
 * nature :
 *   - au régime réel, « Réduction HT, en euros » et « … TTC, en euros »
 *     (ÉCRAN-7) ; hors du réel, on ne nomme pas la taxe (règle C2) ;
 *   - l'acompte porte le nom de sa NATURE, et « Acompte ou arrhes » tant
 *     qu'elle n'est pas choisie (ÉCRAN-8, CONTROLES-10) — jamais
 *     « Acompte » seul.
 */
export function libellesDesConditions(etatRegime, nature = null) {
  const reel = libellesDesTotaux(etatRegime).taxe;
  const sansTaxeNommee = regimeConnu(etatRegime) === 'franchise';
  const nom = libelleAcompte(nature);
  return {
    reductionPourcent: 'Réduction, en pour cent',
    reductionMontant: reel ? 'Réduction HT, en euros' : 'Réduction, en euros',
    reductionExemple: reel ? 'Montant HT' : 'Montant en euros',
    acompte: nom,
    acomptePourcent: `${nom}, en pour cent`,
    acompteMontant: reel ? `${nom} TTC, en euros` : `${nom}, en euros`,
    acompteExemple: reel ? 'Montant TTC' : 'Montant en euros',
    acompteEnPourcentage: `${nom} en pourcentage`,
    acompteEnEuros: `${nom} en euros`,
    aideReductionMontant: reel ? AIDE_REDUCTION_HT : null,
    aideAcompteMontant: reel ? AIDE_ACOMPTE_TTC : null,
    /* 2b-4 : le prix du devis lui-même. « TTC » partout SAUF en franchise —
       une règle À PART de celle des deux champs du dessus (qui ne nomment la
       taxe qu'au réel) : un prix de devis se déclare TTC dans « Mon
       entreprise » quel que soit le régime, et c'est lui que le champ
       reprend (critique ÉCRAN-14, points 1 et 4). */
    cout: sansTaxeNommee ? 'Prix du devis' : 'Prix du devis TTC',
    coutParle: sansTaxeNommee ? 'Prix du devis lui-même, en euros' : 'Prix du devis lui-même TTC, en euros',
  };
}

/** La ligne d'état de la carte quand rien ne se passe. */
export const CARTE_AU_REPOS = 'Chaque champ s’enregistre quand vous le quittez.';
/** …et celle d'une carte SANS AUCUN CHAMP À TAPER, dont chaque appui écrit
 *  aussitôt — la carte « Énergie et label RGE », et elle seule aujourd'hui
 *  (décision du propriétaire du 24/11/2026, relecture 2b-6, ÉCRAN-4) : sous
 *  elle, « Chaque champ s’enregistre quand vous le quittez. » promettait un
 *  geste qui n'existe pas. « Conditions » et « Déchets » ont des champs
 *  tapés (`onBlur`) : elles gardent `CARTE_AU_REPOS`. */
export const CARTE_AU_REPOS_SANS_CHAMP = 'Chaque choix s’enregistre aussitôt.';

/**
 * LA LIGNE D'ÉTAT DE LA CARTE, sous sa barre (relecture ÉCRAN-2 du lot 2a) :
 * la carte prend l'écran, par-dessus la liste ET le pied, et elle cachait
 * tout ce qui disait l'écriture — l'envoi en cours, l'échec, « Réessayer »,
 * « Relire ». Une écriture ratée se lisait « Ramenée à … ».
 * `{ ton: 'neutre' | 'echec', texte, action: 'reessayer' | 'relire' | null }`.
 * `sansChampTape` (faux par défaut) ne change QUE la phrase au repos :
 * `CARTE_AU_REPOS_SANS_CHAMP` pour une carte où rien ne se tape (ÉCRAN-4) ;
 * l'envoi, l'échec et les totaux disent la même chose partout.
 */
export function ligneDEtatDeLaCarte({
  echec = null, reessayable = false, enCours = false, totauxIllisibles = false, sansChampTape = false,
} = {}) {
  if (echec) return { ton: 'echec', texte: String(echec), action: reessayable ? 'reessayer' : null };
  if (totauxIllisibles) {
    return { ton: 'echec', texte: 'Les totaux n’ont pas pu être relus : ceux-ci peuvent dater.', action: 'relire' };
  }
  if (enCours) return { ton: 'neutre', texte: 'Enregistrement en cours…', action: null };
  return { ton: 'neutre', texte: sansChampTape === true ? CARTE_AU_REPOS_SANS_CHAMP : CARTE_AU_REPOS, action: null };
}

/* Les champs que vise chaque geste de la carte. */
const CLES_DU_GESTE = Object.freeze({
  reduction: Object.freeze(['remiseCentiemes', 'remiseCentimes']),
  acompte: Object.freeze(['acompteCentiemes', 'acompteCentimes', 'acompteNature']),
  nature: Object.freeze(['acompteCentiemes', 'acompteCentimes', 'acompteNature']),
  validite: Object.freeze(['validiteJours']),
  retenue: Object.freeze(['retenueGarantieCentiemes']),
  /* 2b-4 : le prix du devis lui-même — sans cette clé, une faute ancienne
     du prix ne vibrait pas au geste qui la vise (critique ÉCRAN-11, mesuré). */
  cout: Object.freeze(['coutDevisCentimes']),
});

/**
 * VIBRER, OU PAS (relecture ÉCRAN-13 du lot 2a) : la carte relit TOUS ses
 * champs à chaque appui, et vibrait dès qu'il restait une faute — une
 * validité « 400 » laissée en l'état faisait vibrer chaque appui sur une
 * AUTRE pastille. La règle de `retour.js` : on vibre pour ce qu'on VIENT
 * de faire. `geste` : le champ quitté, ou la pastille touchée ; `cles` :
 * les champs en faute.
 *
 * `deja` : les champs DÉJÀ en faute avant ce geste. Une faute NOUVELLE
 * vibre, quel que soit le geste (contre-vérification du lot 2a) : la règle
 * disait « fermer la carte ne revibre pas, la faute a été signalée quand on
 * a quitté son champ » — mais on peut fermer SANS avoir quitté le champ.
 * Sur l'iPhone, « ‹ Devis » est dans la barre, hors du défilement : le
 * toucher ne retire pas le clavier, le champ garde sa saisie refusée, et
 * la faute naît à la fermeture — sans une vibration. Une faute ancienne,
 * elle, ne revibre que quand on quitte SON champ.
 */
export function vibrerPourLaCarte(geste, cles, deja = null) {
  return vibrerSelon(CLES_DU_GESTE, geste, cles, deja);
}

/* LA RÈGLE, écrite UNE fois, pour les deux cartes plein écran qui ont des
   champs tapés (« Conditions », lot 2a ; « Déchets », 2b-5) : chacune a SA
   table des gestes, la règle est la même. */
function vibrerSelon(table, geste, cles, deja) {
  const liste = Array.isArray(cles) ? cles : [];
  if (Array.isArray(deja) && liste.some((k) => !deja.includes(k))) return true;
  const visees = table[geste];
  if (!visees) return false;
  return liste.some((k) => visees.includes(k));
}

/**
 * LES NOMS DE LA BANDE DE LA GARDE, une fois chacun (relecture ÉCRAN-6) —
 * et l'ACOMPTE sous le nom de sa nature (contre-vérification d'ÉCRAN-8 :
 * la bande disait « « Acompte » : ce que vous avez écrit n'est pas
 * enregistré » sous une carte titrée « Acompte ou arrhes », ou « Arrhes »).
 * `noms` : le nom de chaque champ de l'en-tête ; `nature` : celle que la
 * carte montrait (son choix gardé avec les textes refusés, sinon celle du
 * devis).
 */
export function nomsDesRefus(cles, { noms = {}, nature = null } = {}) {
  const montantsDAcompte = ['acompteCentiemes', 'acompteCentimes'];
  return [...new Set((Array.isArray(cles) ? cles : [])
    .map((c) => (montantsDAcompte.includes(c) ? libelleAcompte(nature) : (noms[c] || c))))];
}

/**
 * CE QUE VOICEOVER DIT D'UN BROUILLON DANS « MES DEVIS » (relecture
 * ÉCRAN-14 du lot 2a) : sur iOS, l'étiquette d'une carte qu'on touche
 * REMPLACE celles de ses enfants. Elle ne disait que l'objet et le client
 * — ni le total, ni « réduction comprise », écrits dessous.
 */
export function libelleCarteDevis({
  objet = null, client = null, libelleTotal = 'Total', total = null, reduction = false,
} = {}) {
  const montant = present(total) ? centimesLisibles(total) : 'montant inconnu';
  return `Ouvrir le brouillon ${objet || 'sans objet'}, ${client || 'client à choisir'}, ${libelleTotal} ${montant}`
    + `${reduction ? ', réduction comprise' : ''}`;
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
 * abusif (code de la consommation, art. R. 212-2, 7°). Ce n'est pas une
 * règle d'Opus de plus : les règles plus strictes que la loi sont celles que
 * le propriétaire a choisies le 05/11 (le SIRET relu chaque année, le n° de
 * TVA reconnu par VIES, les frais de déplacement, le délai d'exécution, un
 * client choisi et au moins un poste, sur tous les devis —
 * `NATURE_DU_MOTIF_ENTREPRISE`, `MOTIFS_DEVIS`).
 * Cette phrase disait « la seule … est la relecture annuelle du SIRET » :
 * c'était vrai avant le lot 2b.
 */
export function avertissementDelai(texte) {
  if (!pourChercher(texte).includes('indicati')) return null;
  return 'Face à un particulier, une date ou un délai « indicatif » est présumé abusif (code de la '
    + 'consommation, art. R.\u00a0212-2, 7°) : écrivez une date ou un délai ferme.';
}

/* ================================================================== */
/*  CE QU'IL MANQUE POUR REMETTRE CE DEVIS (lot 2b-1, 05/11/2026)      */
/* ================================================================== */
/*
 * LA BASE EST LA SEULE AUTORITÉ. `motifs_refus_remise(p_devis)` (section
 * 49.9 de `schema.sql`) dit ce qui manque pour remettre un devis au client ;
 * la remise elle-même (lot 2c) refusera tant qu'elle rend une ligne. Ce qui
 * suit sert aux trois mêmes choses que le reste de ce fichier :
 *   - faire VIVRE la démonstration, où il n'y a pas de base
 *     (`motifsDeRemise`, le miroir de la fonction) ;
 *   - être éprouvé par `verifier-devis` sur les MÊMES entrées que la vraie
 *     fonction (`supabase/cas-remise.json`, joué par PostgreSQL : zéro écart
 *     exigé, comme les 768 cas du badge) ;
 *   - préparer pour l'écran la liste que la BASE a rendue
 *     (`lireMotifsDeRemise`) : c'est sa phrase qui s'affiche, jamais une
 *     copie d'ici.
 * Le contrat — clés, rangs, natures, phrases — est l'annexe B du cahier du
 * lot 2b, figée avant la construction. Une phrase changée ici sans l'être
 * en SQL fait rougir le contrôle : la règle d'une écriture tenue à deux
 * endroits ne vaut que si un contrôle tient les deux.
 *
 * TROIS SORTES DE MOTIFS, et l'écran dit laquelle (§2.1 du cahier) :
 *   - `loi` : la loi le demande, dans le cas que la phrase dit ;
 *   - `prudence` : Opus ne sait pas encore si le devis est dans le cas qui
 *     décide (quel travail c'est, où il est signé), ou il ne sait pas encore
 *     imprimer ce que la loi permet (une ligne sans TVA au régime réel) : il
 *     compte le plus protecteur. « Pour qui le client commande » n'est PAS
 *     une prudence de nature : les mentions dues à un particulier sont de
 *     la loi (leur phrase le dit), et c'est l'ÉCRAN qui les range à part,
 *     par prudence (relecture de 2b-1, BASE-2) ;
 *   - `regle_opus` : une règle plus stricte que la loi, que le propriétaire
 *     a CHOISIE le 05/11 (le SIRET relu chaque année, le n° de TVA reconnu
 *     par VIES, les frais de déplacement et le délai d'exécution dits sur
 *     tous les devis ; puis, le soir même, un client choisi et au moins un
 *     poste sur tous les devis — six en tout). Elle se dit comme un choix
 *     d'Opus, jamais comme la loi : une règle d'Opus présentée comme la loi
 *     serait une information fausse donnée à l'artisan.
 * UN AVIS N'EST PAS UN MOTIF : il ne bloque rien. C'est pour ça qu'il ne
 * vit PAS dans la fonction de la base (critique B6) : aucun avis ne doit
 * pouvoir, un jour, bloquer une remise par erreur. `avisDuDevis`, plus bas.
 */

/** Les trois natures d'un motif — la colonne `nature` de la base. */
export const NATURES_DE_MOTIF = Object.freeze(['loi', 'prudence', 'regle_opus']);

/**
 * LES VINGT-DEUX MOTIFS DU DEVIS, SUR QUATORZE RANGS (annexe B.2 du cahier 2b,
 * A.1 du cahier 2b-2, et A.1 du cahier 2b-3 : le rang 10, « à la signature »,
 * et le rang 11, l'attestation décennale — trois clés EXCLUSIVES, comme le
 * rang 1 ; A.1 du cahier 2b-4 : le rang 12, le prix du devis lui-même ; A.1
 * du cahier 2b-5 : le rang 13, les déchets du chantier, deux clés
 * EXCLUSIVES ; A.1 du cahier 2b-6 : le rang 14, les travaux d'énergie et le
 * label RGE, trois clés EXCLUSIVES),
 * recopiés OCTET POUR OCTET de la fonction de la base : le
 * rang (l'ordre de la liste), la nature, la phrase. Le rang 1 porte DEUX clés,
 * exclusives (2b-2) : sans client, `devis_client` ; avec un client mais sans
 * réponse VALABLE à « À quel titre ? », `devis_pour_qui`. Le rang 3 en porte
 * TROIS, une par ligne fautive (relecture de 2b-1, TXT-1, puis 2b-2) : la loi
 * ne dit pas la même chose d'une ligne taxée en franchise, d'une ligne sans
 * TVA au régime réel, et d'une ligne à taux réduit d'un chantier qui crée un
 * bâtiment neuf.
 *
 * Trois règles de forme, et aucune n'est cosmétique :
 *   - AUCUN montant dans une phrase : la base ne met pas d'euros en forme,
 *     et une phrase de la base avec « 1234.5 » serait pire que pas de
 *     montant. L'écran affiche le montant à côté ;
 *   - l'apostrophe TYPOGRAPHIQUE ’, comme dans `emetteur_incomplet()` ;
 *   - des espaces ORDINAIRES, avant « : » aussi : c'est ainsi que
 *     `emetteur.js` recopie les phrases de la base (`MOTIFS`), et
 *     `schema.sql` ne porte aucune espace insécable — le transport du
 *     connecteur Supabase change une séquence d'échappement écrite dans le
 *     SQL (CLAUDE.md).
 *
 * LES RÈGLES D'OPUS DU DEVIS (réponses du propriétaire du 05/11) :
 *   - `devis_delai` : la loi demande le délai pour la plupart des devis à
 *     un particulier (code de la consommation, L. 111-1 3° et L. 221-5 I
 *     3°), pas pour tous ; sa phrase le dit, et 2b-2 ne la lèvera pas ;
 *   - `devis_client` et `devis_lignes` (le soir du 05/11, relecture de
 *     2b-1, TXT-4) : la loi demande le nom du client pour un dépannage, une
 *     réparation ou un entretien signé dans vos locaux et pour les services
 *     à la personne (arrêté du 24/01/2017, art. 4-I ; arrêté du 17/03/2015,
 *     art. 7 4°), la description des travaux et leur prix pour un
 *     particulier (L. 111-1 1° et 2°) ; Opus les demande pour tous les devis,
 *     et chaque phrase le dit.
 * LES PRUDENCES : `devis_lieu` et `devis_validite` — l'arrêté du 24/01/2017
 * ne les demande que pour un dépannage, une réparation ou un entretien
 * SIGNÉ DANS VOS LOCAUX (art. 4-I : « conclue en établissement
 * commercial » ; le 4-II, hors établissement, ne les nomme pas), et l'arrêté
 * du 17/03/2015 pour les services à la personne (art. 7 1° et 5°) : Opus ne
 * sait pas encore si le devis en est un (2b-4) ; `devis_taux_sans_tva` —
 * la loi permet une ligne sans TVA au régime réel dans quelques cas
 * (l'autoliquidation de la sous-traitance, CGI art. 283 2 nonies), qu'Opus
 * ne sait pas encore imprimer ; et la nature de l'acompte et les deux
 * « ramenés », où Opus ne sait pas ce que l'artisan voulait.
 */
export const MOTIFS_DEVIS = Object.freeze({
  devis_client: Object.freeze({
    rang: 1,
    nature: 'regle_opus',
    phrase: 'Ce devis ne s’adresse encore à personne : choisissez le client. La loi demande son nom pour un '
      + 'dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus '
      + 'le demande pour tous vos devis.',
  }),
  /* 2b-2 : la 7e règle d'Opus (réponse P1 du 09/11 au soir, « Oui,
     bloquer ») — EXCLUSIVE avec `devis_client` : on ne demande pas à quel
     titre commande un client qui n'est pas choisi. Une phrase de 200
     caractères au plus, la consigne d'abord (`premierePhrase` ne la coupe
     pas). */
  devis_pour_qui: Object.freeze({
    rang: 1,
    nature: 'regle_opus',
    phrase: 'Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le '
      + 'devis. Opus le demande pour tous vos devis.',
  }),
  devis_lignes: Object.freeze({
    rang: 2,
    nature: 'regle_opus',
    phrase: 'Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste. La loi demande de décrire les '
      + 'travaux et leur prix pour un devis à un particulier ; Opus le demande pour tous vos devis.',
  }),
  devis_taux_franchise: Object.freeze({
    rang: 3,
    nature: 'loi',
    phrase: 'En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne.',
  }),
  devis_taux_sans_tva: Object.freeze({
    rang: 3,
    nature: 'prudence',
    phrase: 'Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en '
      + 'autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne.',
  }),
  /* 2b-2 : une ligne à 10 % ou 5,5 % quand l'artisan a répondu « Oui » à la
     question TVA du chantier (« Ces travaux font-ils partie d’un chantier qui
     crée un bâtiment neuf ? ») — CGI 279-0 bis 2 et 278-0 bis A, recodifiés
     au CIBS le 01/01/2027 (non lu). Une PRUDENCE jusqu'au lot 3 : d'autres
     5,5 % (CGI 278-0 bis N et P, non lus) restent peut-être possibles sur un
     bâtiment neuf. Aucun article cité, aucun pourcentage dans la phrase. */
  devis_taux_reduit_neuf: Object.freeze({
    rang: 3,
    nature: 'prudence',
    phrase: 'Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez répondu que '
      + 'ces travaux font partie d’un chantier qui crée un bâtiment neuf.',
  }),
  devis_lieu: Object.freeze({
    rang: 4,
    nature: 'prudence',
    phrase: 'Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien signé '
      + 'dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.',
  }),
  devis_delai: Object.freeze({
    rang: 5,
    nature: 'regle_opus',
    phrase: 'Écrivez le délai d’exécution des travaux. La loi le demande pour la plupart des devis à un particulier ; '
      + 'Opus le demande pour tous vos devis.',
  }),
  devis_validite: Object.freeze({
    rang: 6,
    nature: 'prudence',
    phrase: 'Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un '
      + 'entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en '
      + 'est un.',
  }),
  devis_acompte_nature: Object.freeze({
    rang: 7,
    nature: 'prudence',
    phrase: 'Dites si la somme demandée d’avance est un acompte ou des arrhes : leurs effets ne sont pas les mêmes, '
      + 'et Opus ne choisit pas à votre place.',
  }),
  devis_acompte_ramene: Object.freeze({
    rang: 8,
    nature: 'prudence',
    phrase: 'L’acompte en euros dépasse le total du devis : Opus l’a ramené. Corrigez-le pour que le devis dise ce '
      + 'que vous voulez.',
  }),
  devis_reduction_ramenee: Object.freeze({
    rang: 9,
    nature: 'prudence',
    phrase: 'La réduction en euros dépasse le total des postes : Opus l’a ramenée. Corrigez-la pour que le devis dise '
      + 'ce que vous voulez.',
  }),
  /* 2b-3 (réponse P2 du 12/11 : « oui ») — « À la signature » choisi, un
     acompte demandé, et aucun des deux cas qu'Opus permet (`signaturePermise`,
     la MÊME règle que l'aide et la ligne « pourquoi » ; le bâtiment neuf n'en
     est plus un depuis la décision du 13/11) : une PRUDENCE, parce
     que la règle du 8e jour n'est la loi que hors établissement (L. 221-10,
     L. 242-7) et qu'Opus ne sait pas où le devis sera signé. « Dès le 8e
     jour » est le nom de la pastille : la seule phrase qui porte un chiffre. */
  devis_acompte_signature: Object.freeze({
    rang: 10,
    nature: 'prudence',
    phrase: 'Choisissez « Dès le 8e jour » pour l’acompte ou les arrhes : signé chez le client, ce devis pourrait '
      + 'n’autoriser aucun paiement avant, et Opus ne sait pas où il le sera.',
  }),
  /* 2b-3 (réponse P1 du 12/11 : « A ») — le rang 11, au plus UNE de ces trois
     clés : pas de réponse à « Ces travaux peuvent-ils engager votre garantie
     décennale ? » (vide = « Oui », par prudence) ; « Oui » et une attestation
     jointe SANS date de fin écrite dans Opus (Opus ne sait pas si elle court
     encore : prudence) ; « Oui » et rien de joint, ou seulement des dates
     passées (LA LOI : L. 243-2 al. 2 demande de JOINDRE l'attestation —
     « la loi » ne porte que sur ce geste, D7). Aucun article cité : le corps
     SQL ne porte aucune espace insécable. */
  devis_decennale: Object.freeze({
    rang: 11,
    nature: 'prudence',
    phrase: 'Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin, ou répondez « Non » dans '
      + '« Le chantier » si ces travaux ne peuvent pas engager votre décennale.',
  }),
  devis_attestation_date: Object.freeze({
    rang: 11,
    nature: 'prudence',
    phrase: 'Écrivez dans « Mon entreprise » la date de fin de votre attestation décennale : sans elle, Opus ne sait '
      + 'pas si l’attestation jointe est encore valable.',
  }),
  devis_attestation: Object.freeze({
    rang: 11,
    nature: 'loi',
    phrase: 'Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin : la loi demande de la '
      + 'joindre à ce devis, puisque ses travaux peuvent engager cette garantie.',
  }),
  /* 2b-4 (réponse Q2 du 16/11 : « Point par prudence ») — le prix du devis
     LUI-MÊME n'est pas encore dit (`cout_devis_centimes` vide). Une PRUDENCE,
     pas une huitième règle d'Opus : l'arrêté du 24/01/2017 demande « gratuit »
     ou « payant » sur le devis AU MOINS pour un dépannage, une réparation ou
     un entretien signé dans les locaux de l'artisan (et l'administration
     l'attend ailleurs aussi, à confirmer par le juriste, J3), et Opus ne sait
     pas où ce devis sera signé. 0 (gratuit) et un montant (payant) le taisent
     pareil. « Le devis lui-même », jamais « ce devis » (T19) ; « au moins »,
     jamais « pour » seul, qui se lirait « seulement pour » (DROIT-12). 197
     caractères : ne rien y ajouter. Octet pour octet celle de la base. */
  devis_cout: Object.freeze({
    rang: 12,
    nature: 'prudence',
    phrase: 'Dites si le devis lui-même est gratuit ou payant. La loi le demande au moins pour un dépannage, une '
      + 'réparation ou un entretien signé dans vos locaux ; Opus ne sait pas encore si ce devis en est un.',
  }),
  /* 2b-5 (décision Q4 = 1 du 17/11, réponses P1 à P6 du 21/11) — le rang 13,
     au plus UNE de ces deux clés : la réponse à « S’agit-il de travaux sur un
     bâtiment, ou de jardinage ? » n'est pas « Non », et une des quatre
     rubriques que la loi demande manque (la quantité et son unité, le tri,
     un lieu de dépôt — ou « Aucun dépôt » —, le coût ; code de
     l'environnement, L. 541-21-2-3 I et D. 541-45-1 I). Réponse VIDE : une
     PRUDENCE, Opus ne sait pas si ce devis relève de la loi (le précédent de
     la décennale sans réponse) ; réponse « Oui » : LA LOI, sur le modèle
     « puisque » de l'attestation décennale. PAS une règle d'Opus : elle ne
     finit donc pas par « pour tous vos devis ». Aucun montant, aucune
     quantité dans la phrase (l'amende vit dans l'aide de la carte,
     `AMENDE_DES_DECHETS`). 199 et 186 caractères ; octet pour octet celles
     de la base (annexe A.1). LA RÈGLE est `motifDesDechets`, plus bas : UNE
     écriture, que le résumé de la rangée et la rubrique visée par le point
     lisent aussi (`rubriquesDesDechets`). */
  devis_dechets: Object.freeze({
    rang: 13,
    nature: 'prudence',
    phrase: 'Dites ce que deviendront les déchets : quantité, tri, lieux, coût. La loi le demande pour construire, '
      + 'rénover ou démolir un bâtiment, ou pour jardiner ; Opus ne sait pas encore si ce devis en relève.',
  }),
  devis_dechets_rubriques: Object.freeze({
    rang: 13,
    nature: 'loi',
    phrase: 'Dites ce que deviendront les déchets : quantité, tri, lieux, coût. La loi le demande pour construire, '
      + 'rénover ou démolir un bâtiment, ou pour jardiner, puisque vous avez répondu « Oui ».',
  }),
  /* 2b-6 (réponses du 23/11 et du 24/11 ; annexe A.1 du cahier 2b-6) — le
     rang 14, au plus UNE de ces trois clés, et seulement pour un client qui
     commande à titre privé, pour une association, une copropriété ou une
     société civile, ou sans réponse VALABLE à « À quel titre ? » (L. 224-114
     vit dans une section que L. 221-3 n'étend pas aux petites entreprises) :
       - `devis_energie` (PRUDENCE) : les travaux d'énergie ne sont pas dits
         (vide) — Opus ne sait pas si ce devis en relève ;
       - `devis_energie_mentions` (LA LOI) : à titre privé, et ce qui manque
         touche un travail du décret (le label n'est ni couvert ni déclaré
         absent, ou un signe valable n'a pas son certificat) ou la
         sous-traitance (pas de réponse, « Oui » sans sous-traitant choisi
         chez l'entreprise, ou un choisi incomplet) ;
       - `devis_energie_mentions_prudence` (PRUDENCE) : une association, une
         copropriété, une société civile, une réponse vide — ou, à titre
         privé, quand seules les deux lignes comptées par prudence (les
         panneaux photovoltaïques, le désembouage) manquent de label.
     La nature se choisit par la CLÉ (une nature par clé, que la base écrit).
     Aucun montant, aucun chiffre ; la première dit « si vous détenez »,
     jamais « votre label » (la loi : « s'il détient ou non »). 188, 187 et
     194 caractères ; octet pour octet celles de la base. LA RÈGLE est
     `motifDeLEnergie`, plus bas, sur `rubriquesDeLEnergie` : UNE écriture,
     que la rangée et le point lisent aussi. */
  devis_energie: Object.freeze({
    rang: 14,
    nature: 'prudence',
    phrase: 'Dites quels travaux d’énergie de la liste ce devis comporte, ou « Aucun de ces travaux ». La loi demande '
      + 'alors si vous détenez un label RGE ; Opus ne sait pas encore si ce devis en relève.',
  }),
  devis_energie_mentions: Object.freeze({
    rang: 14,
    nature: 'loi',
    phrase: 'Dites si vous détenez un label RGE pour les travaux d’énergie cochés, et si un sous-traitant fera tout ou '
      + 'partie de ce devis : la loi le demande pour un client qui commande à titre privé.',
  }),
  devis_energie_mentions_prudence: Object.freeze({
    rang: 14,
    nature: 'prudence',
    phrase: 'Dites si vous détenez un label RGE pour les travaux cochés, et si un sous-traitant fera tout ou partie de '
      + 'ce devis. La loi le demande à titre privé ; Opus ne sait pas encore si elle vise ce cas.',
  }),
});

/**
 * LES MOTIFS DE L'ENTREPRISE (annexe B.3) — ceux de `emetteur_incomplet()`,
 * que la fonction de la base APPELLE et range après ceux du devis : rang
 * `100 + position` (1 à 21), dans l'ordre où elle les rend.
 *
 * Seules les EXCEPTIONS sont écrites ici ; tout autre motif est `loi`.
 * Trois règles d'Opus (le SIRET relu chaque année, le n° de TVA reconnu par
 * VIES, les frais de déplacement dits sur tous les devis — gardées par le
 * propriétaire le 05/11), et deux PRUDENCES :
 *   - la profession réglementée : la loi demande titre, État et ordre
 *     (R. 111-2), Opus ne sait pas encore les écrire ; ce n'est pas la loi
 *     qui bloque, c'est ce qu'Opus ne sait pas ;
 *   - le régime de TVA (`regime_tva`, relecture de 2b-1, TXT-7) : aucune loi
 *     ne demande de DÉCLARER son régime à Opus ; c'est Opus qui en a besoin
 *     pour imprimer la TVA ou la mention de franchise. « La loi — Déclarez
 *     votre régime de TVA » aurait attribué à la loi ce qu'Opus demande.
 * `registre` reste `loi` (la loi demande la mention quand l'entreprise est
 * immatriculée, et la phrase le dit) ; `conso_tva_intra` reste une règle
 * d'Opus (réponse du 05/11), même quand AUCUN numéro n'est écrit — cas où
 * c'est la loi qui le demande : à présenter au propriétaire, pas à trancher
 * seul.
 */
export const NATURE_DU_MOTIF_ENTREPRISE = Object.freeze({
  entreprise_ancienne: 'regle_opus',
  conso_tva_intra: 'regle_opus',
  frais_deplacement: 'regle_opus',
  conso_profession_reglementee: 'prudence',
  regime_tva: 'prudence',
});

/** Le rang du premier motif de l'entreprise, moins un : les rangs du devis
 *  restent sous 100, ceux de l'entreprise au-dessus. */
export const RANG_DE_L_ENTREPRISE = 100;

const aLaCle = (o, cle) => cle != null && Object.prototype.hasOwnProperty.call(o, cle);

/**
 * La nature d'un motif de l'entreprise : l'exception écrite, ou `loi` — et,
 * depuis 2b-2, selon la réponse VALABLE à « À quel titre ? » (`valable`) :
 * pour une association, une copropriété, une société civile
 * (`non_professionnel`), ou une entreprise qui commande dans son activité
 * principale (`professionnel`, pour les deux adresses gardées), une mention
 * due à un particulier (`conso_`) n'est pas imposée par la loi — L. 111-1,
 * R. 111-1 et R. 111-2 visent le consommateur, personne physique — : Opus la
 * compte « Par prudence » (critique droit I4). Les règles d'Opus le restent
 * partout, `conso_tva_intra` compris (décision du 05/11). Dans l'ordre du
 * `case` de la base (49.9).
 */
export function natureDuMotifEntreprise(cle, valable = null) {
  if (aLaCle(NATURE_DU_MOTIF_ENTREPRISE, cle) && NATURE_DU_MOTIF_ENTREPRISE[cle] === 'regle_opus') return 'regle_opus';
  if ((valable === 'non_professionnel' || valable === 'professionnel') && estUneMentionConso(cle)) return 'prudence';
  return aLaCle(NATURE_DU_MOTIF_ENTREPRISE, cle) ? NATURE_DU_MOTIF_ENTREPRISE[cle] : 'loi';
}

/* Une mention due à un particulier : une clé qui commence EXACTEMENT par
   `conso_` — `left(cle, 6) = 'conso_'` dans la base, jamais un `like`, dont
   le `_` vaut n'importe quel caractère. Une clé absente n'en est pas une. */
const estUneMentionConso = (cle) => typeof cle === 'string' && cle.startsWith('conso_');

/** Les deux mentions `conso_` qu'un client « pour son entreprise » garde,
 *  par prudence : l'adresse de l'établissement et celle du siège (R. 123-237
 *  les demande peut-être sur tous les devis — question ouverte au juriste ;
 *  critique droit I3). */
export const MENTIONS_GARDEES_POUR_UN_PRO = Object.freeze(['conso_adresse_etablissement', 'conso_adresse_siege']);

/**
 * UNE MENTION DE L'ENTREPRISE COMPTE-T-ELLE pour ce devis ? Toujours, sauf
 * une mention due à un particulier (hors les deux adresses) quand la réponse
 * VALABLE est `professionnel` — le filtre de 49.9, appliqué APRÈS le calcul
 * du rang : un motif filtré laisse un TROU, jamais une renumérotation. Une
 * réponse vide, inconnue, ou donnée pour un autre client : tout compte (le
 * cas protecteur ; en SQL, la condition vaut `null` et rien ne saute).
 */
export function mentionComptee(cle, valable) {
  return !(valable === 'professionnel' && estUneMentionConso(cle) && !MENTIONS_GARDEES_POUR_UN_PRO.includes(cle));
}

/**
 * LA RÉPONSE « À QUEL TITRE » VALABLE (2b-2, cahier §2.1 et §3.1) — la SEULE
 * écriture de la règle côté téléphone, le miroir de `v_valable` (49.9) : la
 * réponse ne vaut que si elle a été donnée POUR le client du devis
 * (`pourQuiClient` = `clientId`, et un client choisi). Changer de client la
 * rend sans effet, d'elle-même ; revenir au client d'avant la rend valable ;
 * la fiche supprimée (le lien passe à vide) aussi la rend sans effet. La base
 * ne modifie JAMAIS la réponse : elle ne la lit qu'à travers cette règle.
 *
 * Jamais `a === b` nu, qui rendrait vrai quand les deux MANQUENT (critique
 * base M8) : un client est exigé. Et la comparaison ignore la casse, comme
 * l'égalité de deux `uuid` en PostgreSQL. Marche aussi sur le bloc `demande`
 * des totaux relus (`totauxDepuisBase`) : la réponse que la BASE a vue.
 */
export function pourQuiValable(devis) {
  const d = devis || {};
  if (!present(d.clientId) || !present(d.pourQuiClient)) return null;
  return String(d.pourQuiClient).toLowerCase() === String(d.clientId).toLowerCase() ? (d.pourQui ?? null) : null;
}

/* « cle: phrase », la forme d'`emetteur_incomplet()`, coupée EXACTEMENT
   comme la base la coupe (section 49.9) : au PREMIER « : » SUIVI D'UNE
   ESPACE — `split_part(v_motif, ': ', 1)` pour la clé, et la phrase à partir
   du troisième caractère après elle (`substr(v_motif, char_length(cle) +
   3)`). La clé n'a jamais de deux-points (`[a-z_]+`), la phrase souvent
   (« Pour un devis à un particulier : … ») : sur tout motif réel, couper au
   premier « : » seul rendait la même chose. Mais pas sur « a:b: phrase »
   (« a » / « b: phrase » contre « a:b » / « phrase ») ni sur un élément
   sans « : » (la base rend tout le texte en clé et une phrase VIDE) : le
   miroir rend ce que la base rend, même là où elle n'ira jamais
   (vérification de construction du lot 2b-1, écart 4 ; `verifier-devis`,
   section 40, départage les deux règles). Un élément déjà lu (`{ cle,
   phrase }`, ce que rend `lireMotifs` d'`emetteur.js`) passe tel quel : la
   démonstration et les cas de parité ne passent pas par le même chemin. */
export function couperMotifEntreprise(brut) {
  if (brut && typeof brut === 'object') {
    return { cle: typeof brut.cle === 'string' ? brut.cle : null, phrase: brut.phrase == null ? '' : String(brut.phrase) };
  }
  /* Un élément vide (`null`) : `split_part` et `substr` rendent `null`. */
  if (brut == null) return { cle: null, phrase: null };
  const texte = String(brut);
  const i = texte.indexOf(': ');
  if (i < 0) return { cle: texte, phrase: '' };
  return { cle: texte.slice(0, i), phrase: texte.slice(i + 2) };
}

/**
 * UNE LIGNE CONTREDIT-ELLE LE RÉGIME DE TVA ? — la règle des motifs de
 * rang 3, ligne par ligne, et celle de `coherenceRegime`, qui l'appelle :
 * UNE écriture. Un poste OU une option (une option non commandée porte quand
 * même un taux qui s'imprimera), offerte comprise :
 *   - en franchise, tout taux autre que 0 (CGI 293 E II : pas de TVA sur
 *     une facture ni sur un document qui en tient lieu) — `devis_taux_franchise`,
 *     la loi ;
 *   - au régime réel, un taux de 0 — `devis_taux_sans_tva`, une PRUDENCE :
 *     la loi le permet dans quelques cas (l'autoliquidation de la
 *     sous-traitance, CGI 283 2 nonies), qu'Opus ne sait pas encore
 *     imprimer (relecture de 2b-1, TXT-1) ;
 *   - régime non déclaré, en lecture ou en échec : jamais — on ne juge pas
 *     ce qu'on ne connaît pas, et le motif `regime_tva` de l'entreprise dit
 *     déjà qu'il manque.
 * Une ligne SANS taux (incomplète, pas encore enregistrée) ne contredit
 * rien : la base, où une ligne chiffrée porte toujours un taux, dirait
 * `null` — ni vrai ni faux.
 */
export function ligneContreditLeRegime(l, regime) {
  if (!l || !TYPES_CHIFFRES.includes(typeDe(l)) || !present(l.tauxTvaCentiemes)) return false;
  const t = Number(l.tauxTvaCentiemes);
  if (regime === 'franchise') return t !== 0;
  if (regime === 'reel') return t === 0;
  return false;
}

/**
 * LA CLÉ DE RANG 3 D'UNE LIGNE — au plus UNE par ligne (la borne de 508
 * motifs ne bouge pas), ou `null` : la règle du régime d'abord
 * (`ligneContreditLeRegime`, une seule écriture), puis, au régime réel, une
 * ligne à 10 % ou 5,5 % d'un chantier qui crée un bâtiment neuf, quand
 * l'artisan a répondu « Oui » à la question TVA du chantier
 * (`chantierNeufTva` VRAI : `null` et `false` disent « Non »). La question
 * des droits du client (`chantierNeufConso`) n'y joue AUCUN rôle — ses
 * « Oui » vont dans l'autre sens. En franchise, la ligne taxée porte la clé de
 * la franchise, jamais celle du neuf. Le miroir des deux tableaux alignés de
 * 49.9.
 */
export function cleDuTauxDeLaLigne(l, regime, chantierNeufTva = null) {
  if (ligneContreditLeRegime(l, regime)) return regime === 'franchise' ? 'devis_taux_franchise' : 'devis_taux_sans_tva';
  if (regime !== 'reel' || chantierNeufTva !== true) return null;
  if (!l || !TYPES_CHIFFRES.includes(typeDe(l)) || !present(l.tauxTvaCentiemes)) return null;
  const t = Number(l.tauxTvaCentiemes);
  return t === 550 || t === 1000 ? 'devis_taux_reduit_neuf' : null;
}

/**
 * LE JOUR DU TÉLÉPHONE, « AAAA-MM-JJ » (2b-3) — le défaut du `jour` de
 * `motifsDeRemise` et d'`etatDeLAttestation` (M10 écran : sans défaut, un
 * appelant qui l'oublie comparerait à `undefined`, et aucune attestation ne
 * serait jamais valable). À l'heure LOCALE, avec ses zéros : il se compare
 * comme une CHAÎNE à une colonne `date`. Le cahier l'appelle `jourLocal()` ;
 * ce nom est déjà pris dans ce fichier par le jour calendaire SANS zéros de
 * `depuisLisible` (une clé de comparaison, jamais affichée), et
 * `entreprise.js` exporte un `jourLocal(valeur)` qui lit une date donnée.
 * La base, elle, juge au jour de PARIS (49.9) : outre-mer, les deux peuvent
 * différer quelques heures — dit au cahier §3.2, noté dans `A-FAIRE`.
 */
export function jourDuTelephone(maintenant = new Date()) {
  const d = maintenant instanceof Date && Number.isFinite(maintenant.getTime()) ? maintenant : new Date();
  const deux = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/**
 * TOUTES LES LIGNES CHIFFRÉES SONT-ELLES MARQUÉES « RÉPARATION URGENTE » ?
 * (2b-3, rang 10) — le miroir de `bool_and(l.urgence) filter (where l.type
 * in ('poste', 'option'))`, puis `coalesce(…, false)` : les postes ET les
 * options, offertes comprises ; vrai si et seulement s'il y en a AU MOINS
 * UNE et que TOUTES portent `urgence === true`. Aucune ligne chiffrée : faux.
 * Une option ne peut pas être marquée (`devis_ligne_urgence_check`) : un
 * devis qui en porte une n'est jamais « tout urgent ».
 */
export function toutUrgent(lignes) {
  const chiffrees = (Array.isArray(lignes) ? lignes : []).filter((l) => l && TYPES_CHIFFRES.includes(typeDe(l)));
  return chiffrees.length > 0 && chiffrees.every((l) => l.urgence === true);
}

/**
 * « À LA SIGNATURE » EST-IL PERMIS ? (2b-3, réponse P2 du 12/11) — LA règle,
 * écrite UNE fois côté téléphone, la même que le rang 10 de la base
 * (`devis_acompte_signature`) et que `aidesDeLAcompte` : DEUX cas, un client
 * qui commande pour son entreprise, dans son activité principale (réponse
 * VALABLE `professionnel`) ; toutes les lignes chiffrées marquées
 * « réparation urgente », pour un client à titre privé ou une association,
 * une copropriété, une société civile (L. 221-10 4°). Pour une petite
 * entreprise hors de son activité principale, ou sans réponse, l'urgence ne
 * lève pas le 8e jour : le cas le plus protecteur. `reponse` est la réponse
 * VALABLE (`pourQuiValable`), jamais `devis.pourQui` nu.
 *
 * LE BÂTIMENT NEUF N'EN FAIT PLUS PARTIE (décision R1 du propriétaire, le
 * 13/11 : « Interdire « à la signature » » ; relecture droit D1). Le « Oui »
 * à la question des DROITS (`chantierNeufConso`) écarte la règle du 8e jour
 * du code de la consommation (L. 221-2 12°), pas le code de la
 * construction : pour la construction d'un logement, le client peut avoir
 * dix jours pour se rétracter, à compter de la réception du contrat par
 * lettre recommandée, et nul ne peut rien recevoir de lui avant — jusqu'à
 * 30 000 euros d'amende (CCH, L. 271-1 et L. 271-2). Opus ne sait ni s'il
 * s'agit d'un logement, ni quand la lettre sera présentée : la règle ne lit
 * plus cette réponse, et la base non plus. La ligne « pourquoi » la nomme
 * (`POURQUOI_PAS_A_LA_SIGNATURE.chantier_neuf`).
 */
export function signaturePermise({ reponse = null, toutUrgent: tout = false } = {}) {
  return reponse === 'professionnel'
    || (tout === true && (reponse === 'consommateur' || reponse === 'non_professionnel'));
}

/**
 * POURQUOI « À LA SIGNATURE » N'EST PAS PERMIS (2b-3, annexe A.4) — `null`
 * quand `signaturePermise` est vraie, sinon LA première cause, dans cet
 * ordre : pas de réponse « à quel titre » ; le bâtiment neuf (« Oui » à la
 * question des droits du client — depuis la décision du 13/11, il ne permet
 * plus « à la signature » : le code de la construction) ; une petite
 * entreprise hors de son activité principale ; aucune ligne chiffrée
 * marquée ; une option ; la première ligne non marquée (dans l'ordre du
 * devis), nommée par sa désignation. Elle dit ce qui EST, jamais « marquez
 * la ligne » : marquer une ligne qui n'est pas une vraie urgence engage
 * l'artisan (E-I7, D4). `lignes` : celles du devis, aux noms de
 * l'application.
 */
/* L'AMENDE DU CODE DE LA CONSTRUCTION (L. 271-2 : « exiger ou recevoir un
   versement ou un engagement de versement » pendant le délai de
   rétractation) — écrite UNE fois, comme `AMENDE_DE_LA_LOI` : `devis.js`
   n'écrit jamais « € » lui-même ailleurs (`verifier-devis`, section 8).
   Déclarée AVANT `POURQUOI_PAS_A_LA_SIGNATURE`, qui la lit au chargement du
   module : une `const` lue avant sa déclaration est un écran blanc. */
const AMENDE_DU_CODE_DE_LA_CONSTRUCTION = 'jusqu’à 30\u00a0000\u00a0€ d’amende, bien plus pour une société';
export const POURQUOI_PAS_A_LA_SIGNATURE = Object.freeze({
  sans_reponse: 'Dites d’abord à quel titre ce client commande : sans réponse, Opus compte le 8e jour.',
  chantier_neuf: 'Pour la construction d’un logement, le code de la construction peut laisser à votre client dix jours '
    + 'pour se rétracter, à compter du lendemain de la première présentation du contrat par lettre recommandée, et '
    + 'interdire tout paiement ou engagement de payer avant : ' + AMENDE_DU_CODE_DE_LA_CONSTRUCTION + ' (art. L.\u00a0271-1 et L.\u00a0271-2). Opus ne permet donc pas le '
    + 'paiement à la signature sur ce devis.',
  professionnel_hors_activite: 'Pour une entreprise, Opus n’applique pas l’exception des réparations urgentes, par '
    + 'prudence : la loi la prévoit au domicile d’un particulier.',
  aucune_marquee: 'Aucune ligne chiffrée de ce devis n’est marquée « réparation urgente ».',
  option: 'Une option n’est jamais une réparation urgente : tant que ce devis en porte une, comptez le 8e jour.',
  ligne_sans_nom: 'Une ligne de ce devis n’est pas marquée « réparation urgente ».',
});

export function pourquoiPasALaSignature({ reponse = null, chantierNeufConso = null, lignes = [] } = {}) {
  const tri = trierLignes(Array.isArray(lignes) ? lignes : []);
  if (signaturePermise({ reponse, toutUrgent: toutUrgent(tri) })) return null;
  const P = POURQUOI_PAS_A_LA_SIGNATURE;
  if (reponse !== 'consommateur' && reponse !== 'non_professionnel' && reponse !== 'professionnel_hors_activite') {
    return P.sans_reponse;
  }
  /* `=== true` : comme `is true` côté base — un « Oui » confirmé, rien d'autre. */
  if (chantierNeufConso === true) return P.chantier_neuf;
  if (reponse === 'professionnel_hors_activite') return P.professionnel_hors_activite;
  const chiffrees = tri.filter((l) => l && TYPES_CHIFFRES.includes(typeDe(l)));
  if (!chiffrees.some((l) => l.urgence === true)) return P.aucune_marquee;
  if (chiffrees.some((l) => typeDe(l) === 'option')) return P.option;
  const premiere = chiffrees.find((l) => l.urgence !== true);
  const nom = premiere ? texteNet(premiere.designation) : null;
  return nom ? `La ligne « ${nom} » n’est pas marquée « réparation urgente ».` : P.ligne_sans_nom;
}

/* Un chemin d'attestation ÉCRIT : la règle de `tient_l_assurance()`, qui
   ramène à `null` ce qui n'est fait que d'espaces, de tabulations et de
   retours à la ligne (`btrim(…, E' \t\r\n')`). Un chemin écrit dit qu'un
   fichier est désigné, pas qu'il existe (2c le vérifiera). */
const BORDS_DU_CHEMIN = /^[ \t\r\n]+|[ \t\r\n]+$/g;
const cheminEcrit = (c) => c != null && String(c).replace(BORDS_DU_CHEMIN, '') !== '';
/* Les dix premiers caractères d'une date « AAAA-MM-JJ » (une colonne `date`
   rendue par PostgREST), ou `null` : comparée comme une CHAÎNE, jamais par
   `new Date(…)` (la leçon des dates de la Place des pros). */
const jourEcrit = (v) => {
  const m = String(v == null ? '' : v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

/**
 * L'ÉTAT DE L'ATTESTATION DÉCENNALE de l'entreprise (2b-3, rang 11) — le
 * miroir de la lecture 3 bis de 49.9 : parmi les assurances `nature ===
 * 'decennale'` dont le chemin d'attestation est ÉCRIT (« jointes »),
 *   - `'valable'` s'il en existe une dont la date de fin est au moins `jour` ;
 *   - sinon `'sans_date'` s'il en existe une sans date de fin ;
 *   - sinon `'absente'` — aucune jointe, ou seulement des dates passées.
 * Une RC professionnelle ne compte jamais. `assurances` : les lignes de
 * `emetteur_assurances`, aux noms de la base (snake_case), comme
 * `ficheEmetteur()` les rend. `proId` (facultatif) : l'entreprise du devis —
 * le miroir de `a.pro_id = v_pro` ; une ligne qui ne dit pas son entreprise
 * n'est pas écartée (la démonstration et la lecture de l'application ne
 * rendent que les assurances de l'artisan).
 */
export function etatDeLAttestation(assurances, jour = jourDuTelephone(), { proId = null } = {}) {
  const auJour = jourEcrit(jour) || jourDuTelephone();
  const jointes = (Array.isArray(assurances) ? assurances : []).filter((a) => a
    && a.nature === 'decennale'
    && cheminEcrit(a.attestation_chemin)
    && (proId == null || a.pro_id == null || String(a.pro_id) === String(proId)));
  if (jointes.some((a) => { const fin = jourEcrit(a.valide_jusquau); return fin !== null && fin >= auJour; })) {
    return 'valable';
  }
  if (jointes.some((a) => a.valide_jusquau == null)) return 'sans_date';
  return 'absente';
}

/**
 * LE MIROIR DE `motifs_refus_remise()` — même entrée, même sortie.
 *
 * Entrée (annexe B.4) : le devis et ses lignes AUX NOMS DE L'APPLICATION
 * (`rowToDevis`, `rowToLigne`), le régime de TVA (`'franchise'`, `'reel'`
 * ou `null`, la colonne `emetteur.regime_tva`), ce que rend
 * `emetteur_incomplet()` (« cle: phrase », dans son ordre), et, depuis
 * 2b-3, les assurances de l'entreprise (`assurances`, aux noms de la base)
 * et le jour où l'on juge l'attestation (`jour`, celui du TÉLÉPHONE par
 * défaut ; la base juge au jour de Paris). Depuis 2b-5, `lieux` : les lieux
 * de dépôt de l'entreprise, des OBJETS `{ id, proId }` (ou les lignes de la
 * base, `{ id, pro_id, … }`) — le miroir ne compte que ceux du devis
 * (`proId`), comme `l.pro_id = v_pro` dans la base. `undefined` = pas
 * transmis : comme si aucun lieu n'existait (seuls la démonstration et
 * `cas-remise.json` les passent). Depuis 2b-6, `labels` et `sousTraitants` :
 * les signes de qualité et les sous-traitants de l'entreprise, des LIGNES de
 * la base (`emetteur_labels`, `emetteur_sous_traitants`, aux noms de la
 * base : `{ id, pro_id, categories, valide_jusquau, justificatif_chemin }`,
 * `{ id, pro_id, label_detient, label_categories, label_valide_jusquau,
 * label_justificatif_chemin }`) — le miroir ne compte que ceux de
 * l'entreprise du devis (`v.pro_id = v_pro` dans la base). `undefined` = pas
 * transmis : comme si aucun n'existait, la règle des lieux.
 *
 * Sortie : `[{ rang, cle, phrase, nature, ligneId }]`, rangée comme la
 * base — le rang croissant, puis, pour les lignes fautives, l'ordre des
 * lignes (`ordre`, puis `id`). `ligneId` désigne la ligne fautive, `null`
 * pour tout autre motif.
 *
 * « VIDE » VEUT DIRE CE QUE LA BASE RANGE : `null`, ou un texte fait de
 * blancs (invisibles compris), ou un code postal fait d'espaces. La base ne
 * range jamais un blanc (`tient_le_devis()` le change en `null`) : le
 * miroir lit donc le devis à travers `nettoyerDevis`, le même nettoyage, et
 * un devis de l'écran pas encore relu se juge comme la base le jugera.
 *
 * « RAMENÉ » se juge comme la carte « Conditions » (`effetDeLaReduction`,
 * `effetDeLAcompte`) : la demande EN EUROS que la base a vue dépasse ce
 * qu'elle a appliqué. En pourcentage, jamais : une réduction ou un acompte
 * de 100 % au plus ne dépasse pas ce sur quoi il porte (prouvé sur 140 007
 * cas, critique B8). Un effectif ABSENT ne se compare pas (en SQL, `null <
 * x` n'est pas vrai) : la base en porte toujours un (`not null default 0`).
 */
export function motifsDeRemise({
  devis = null, lignes = [], regime = null, motifsEmetteur = [], assurances = [], jour = jourDuTelephone(), lieux = undefined,
  labels = undefined, sousTraitants = undefined,
} = {}) {
  const d = nettoyerDevis(devis || {});
  const sortie = [];
  const motif = (cle, ligneId = null) => {
    const m = MOTIFS_DEVIS[cle];
    sortie.push({ rang: m.rang, cle, phrase: m.phrase, nature: m.nature, ligneId });
  };
  const tri = trierLignes(Array.isArray(lignes) ? lignes : []);
  const ramene = (demande, effectif) => present(d[demande]) && present(d[effectif])
    && Number(d[effectif]) < Number(d[demande]);

  /* LA RÉPONSE VALABLE, calculée UNE fois (2b-2) : le rang 1, le filtre et
     les natures la lisent, comme `v_valable` dans la base. */
  const valable = pourQuiValable(d);
  if (!present(d.clientId)) motif('devis_client');
  else if (valable === null) motif('devis_pour_qui');
  if (!tri.some((l) => typeDe(l) === 'poste')) motif('devis_lignes');
  /* UNE clé par ligne fautive, dans l'ordre des lignes (`ordre`, puis `id`)
     — UNE boucle, comme la base. Depuis 2b-2, deux clés de rang 3 peuvent
     ALTERNER dans un même devis au réel (une ligne sans TVA, une ligne à
     taux réduit d'un chantier qui crée un bâtiment neuf). */
  tri.forEach((l) => {
    const cle = cleDuTauxDeLaLigne(l, regime, d.chantierNeufTva);
    if (cle) motif(cle, l.id ?? null);
  });
  if (!present(d.lieuAdresse) && !present(d.lieuCodePostal) && !present(d.lieuVille)) motif('devis_lieu');
  if (!present(d.delaiExecution)) motif('devis_delai');
  if (!present(d.validiteJours)) motif('devis_validite');
  if ((present(d.acompteCentiemes) || present(d.acompteCentimes)) && !present(d.acompteNature)) motif('devis_acompte_nature');
  if (ramene('acompteCentimes', 'acompteTtcCentimes')) motif('devis_acompte_ramene');
  if (ramene('remiseCentimes', 'remiseHtCentimes')) motif('devis_reduction_ramenee');
  /* 2b-3, rang 10 : « à la signature », un acompte, et aucun des deux cas
     qu'Opus permet — `signaturePermise`, LA règle, la même que l'aide de la
     carte et que la ligne « pourquoi ». Le bâtiment neuf n'en est plus un
     (décision du 13/11) : comme la base, le miroir ne lit plus
     `chantierNeufConso` ici. `=== true` : comme `is true`. */
  if (d.acompteALaSignature === true
    && (present(d.acompteCentiemes) || present(d.acompteCentimes))
    && !signaturePermise({ reponse: valable, toutUrgent: toutUrgent(tri) })) {
    motif('devis_acompte_signature');
  }
  /* 2b-3, rang 11 : la réponse n'est pas « Non » (vide = « Oui », par
     prudence) et aucune attestation n'est valable — UNE clé au plus. */
  if (d.engageDecennale !== false) {
    const etat = etatDeLAttestation(assurances, jour, { proId: d.proId ?? null });
    if (etat !== 'valable') {
      if (d.engageDecennale !== true) motif('devis_decennale');
      else if (etat === 'sans_date') motif('devis_attestation_date');
      else motif('devis_attestation');
    }
  }
  /* 2b-4, rang 12 : le prix du devis lui-même pas encore dit — vide, comme
     `v_cout is null` dans la base. 0 (gratuit) et un montant le taisent
     pareil ; le motif ne lit ni la réponse « à quel titre », ni les tarifs
     (la porte étroite, T6). */
  if (!present(d.coutDevisCentimes)) motif('devis_cout');
  /* 2b-5, rang 13 : les déchets du chantier — `motifDesDechets`, LA règle,
     écrite une fois (la même que le résumé de la rangée « Déchets »). Une
     liste de lieux pas transmise (`undefined`) ne prouve aucun lieu : un
     lieu choisi n'y est alors jamais compté, comme si aucun n'existait. */
  const cleDechets = motifDesDechets(d, lieux);
  if (cleDechets) motif(cleDechets);
  /* 2b-6, rang 14 : les travaux d'énergie et le label RGE —
     `motifDeLEnergie`, LA règle (la même que la rangée « Énergie (label
     RGE) »), avec la réponse VALABLE déjà calculée. Des listes pas
     transmises ne prouvent rien : comme si aucun signe de qualité ni aucun
     sous-traitant n'existait. */
  const cleEnergie = motifDeLEnergie(d, labels, sousTraitants, jour, valable);
  if (cleEnergie) motif(cleEnergie);

  /* Les motifs de l'entreprise : le rang garde sa position d'ORIGINE
     (`100 + position`), PUIS le filtre de la réponse valable — un trou,
     jamais une renumérotation —, PUIS la nature selon la même réponse. */
  (Array.isArray(motifsEmetteur) ? motifsEmetteur : []).forEach((brut, i) => {
    const { cle, phrase } = couperMotifEntreprise(brut);
    const rang = RANG_DE_L_ENTREPRISE + i + 1;
    if (!mentionComptee(cle, valable)) return;
    sortie.push({ rang, cle, phrase, nature: natureDuMotifEntreprise(cle, valable), ligneId: null });
  });

  /* Le rang d'abord, puis l'ordre d'arrivée — celui des lignes rangées pour
     les lignes fautives. L'indice départage : le tri ne dépend pas de la
     stabilité de `sort` du moteur (Hermes, `node`). */
  return sortie.map((m, i) => ({ m, i })).sort((a, b) => (a.m.rang - b.m.rang) || (a.i - b.i)).map((x) => x.m);
}

/**
 * Une ligne rendue par `motifs_refus_remise()`, aux noms de l'application.
 * Ici, et pas dans `api.js` : `node` fait tourner ce fichier, et
 * `verifier-devis` peut éprouver la traduction sur une ligne fabriquée comme
 * PostgREST la rend (la leçon de `rowToDevis`, relecture CONTROLES-5 du
 * lot 2a).
 */
export function rowToMotifDeRemise(m) {
  const x = m && typeof m === 'object' ? m : {};
  return {
    rang: nombreOuNul(x.rang),
    cle: x.cle ?? null,
    phrase: x.phrase ?? null,
    nature: x.nature ?? null,
    ligneId: x.ligne_id ?? null,
  };
}

/** Ce que l'écran dit de la NATURE d'un motif (annexe B.8). */
export const ETIQUETTE_DE_NATURE = Object.freeze({
  loi: 'La loi',
  prudence: 'Par prudence',
  regle_opus: 'Règle d’Opus',
});

/**
 * OÙ L'ÉCRAN MÈNE L'ARTISAN pour chaque motif du devis : le choix du client,
 * la liste des lignes, LA ligne fautive, le lieu, le délai (qui prend le
 * focus), ou la carte « Conditions » ouverte SUR SON CHAMP — la validité, la
 * nature de l'acompte, l'acompte, la réduction (critique E-13 : la carte
 * s'ouvrait en haut, et la validité était hors de l'écran sur les trois
 * tailles mesurées).
 *
 * Les motifs de l'ENTREPRISE ne sont pas écrits ici : ils mènent à « Mon
 * entreprise », sur la section que dit la table d'`emetteur.js`
 * (`SECTION_DU_MOTIF`). Ce fichier n'importe pas `emetteur.js` — sa liste
 * d'imports est tenue par `verifier-devis` —, et une COPIE de cette table
 * divergerait le jour où un motif change de section : l'écran la passe
 * (`endroitDuMotif(motif, { sections: SECTION_DU_MOTIF })`).
 */
export const ENDROIT_DU_MOTIF = Object.freeze({
  devis_client: Object.freeze({ endroit: 'client' }),
  /* 2b-2 : la feuille « À quel titre ? », la même que « Répondre » sous le
     choix du client. */
  devis_pour_qui: Object.freeze({ endroit: 'pour_qui' }),
  devis_lignes: Object.freeze({ endroit: 'lignes' }),
  devis_taux_franchise: Object.freeze({ endroit: 'ligne' }),
  devis_taux_sans_tva: Object.freeze({ endroit: 'ligne' }),
  /* 2b-2 : LA ligne fautive, ET la carte « Le chantier » (un second bouton,
     « Revoir « Le chantier » ») — la phrase dit qu'on peut corriger l'un ou
     l'autre. */
  devis_taux_reduit_neuf: Object.freeze({ endroit: 'ligne', aussi: 'chantier' }),
  devis_lieu: Object.freeze({ endroit: 'lieu' }),
  devis_delai: Object.freeze({ endroit: 'delai' }),
  devis_validite: Object.freeze({ endroit: 'conditions', champ: 'validite' }),
  devis_acompte_nature: Object.freeze({ endroit: 'conditions', champ: 'nature' }),
  devis_acompte_ramene: Object.freeze({ endroit: 'conditions', champ: 'acompte' }),
  devis_reduction_ramenee: Object.freeze({ endroit: 'conditions', champ: 'reduction' }),
  /* 2b-3 : la carte « Conditions », SUR la question « Quand le client
     paie-t-il cette somme ? » (le champ `echeance`). */
  devis_acompte_signature: Object.freeze({ endroit: 'conditions', champ: 'echeance' }),
  /* 2b-3 : « Mon entreprise », section « Assurances ». L'attestation absente
     ou sans date : SANS second bouton — l'artisan a déjà répondu « Oui »
     (E-I4). La réponse vide : un second bouton, « Répondre dans « Le
     chantier » », qui ouvre la carte SUR la question de la décennale. Une
     section écrite ICI, et pas dans la table d'`emetteur.js` : ce sont des
     motifs du DEVIS, qu'aucun motif de l'entreprise n'envoie aux assurances
     (`emetteur_incomplet()` ne les lit pas). */
  devis_decennale: Object.freeze({ endroit: 'entreprise', section: 'assurances', aussi: 'chantier' }),
  devis_attestation_date: Object.freeze({ endroit: 'entreprise', section: 'assurances' }),
  devis_attestation: Object.freeze({ endroit: 'entreprise', section: 'assurances' }),
  /* 2b-4 : la carte « Conditions », SUR le bloc « Le devis lui-même :
     gratuit ou payant ? » (le champ `cout`, le DERNIER de la carte). */
  devis_cout: Object.freeze({ endroit: 'conditions', champ: 'cout' }),
  /* 2b-5 : la carte « Déchets ». UN SEUL bouton (« Compléter les déchets »,
     T8) : `devis_dechets` l'ouvre EN HAUT, sur la question — la sortie
     naturelle d'une réponse vide est de répondre, comme la décennale sans
     réponse ; `devis_dechets_rubriques` l'ouvre sur la PREMIÈRE rubrique qui
     manque, en haut à défaut (`rubriqueDuPoint`, plus bas). Aucun second
     bouton : la porte vers « Mes lieux de dépôt » vit DANS la carte (T25),
     et `secondeActionDuPoint` ne change pas. */
  devis_dechets: Object.freeze({ endroit: 'dechets' }),
  devis_dechets_rubriques: Object.freeze({ endroit: 'dechets' }),
  /* 2b-6 : la carte « Énergie et label RGE ». UN SEUL bouton (« Compléter :
     énergie et label RGE », annexe A.1) : `devis_energie` l'ouvre sur la
     question des travaux ; les deux autres sur la PREMIÈRE rubrique qui
     manque, la question à défaut (`rubriqueDeLEnergieDuPoint`, plus bas).
     Les portes vers « Mes signes de qualité » et « Mes sous-traitants »
     vivent DANS la carte : aucun second bouton. */
  devis_energie: Object.freeze({ endroit: 'energie' }),
  devis_energie_mentions: Object.freeze({ endroit: 'energie' }),
  devis_energie_mentions_prudence: Object.freeze({ endroit: 'energie' }),
});

/**
 * L'endroit d'UN motif : `{ endroit, champ?, ligneId?, section? }`, ou
 * `null` quand l'écran ne sait mener nulle part — une clé inconnue (une base
 * plus récente que l'application) s'affiche quand même, sans bouton.
 *   - une ligne fautive SANS identifiant mène à la liste des lignes ;
 *   - un motif de l'entreprise mène à « Mon entreprise », sur sa section ;
 *     une section `null` veut dire, comme dans `emetteur.js`, « rien à
 *     compléter dans Opus aujourd'hui » (la profession réglementée).
 */
export function endroitDuMotif(motif, { sections = null } = {}) {
  const cle = motif && typeof motif.cle === 'string' ? motif.cle : null;
  if (aLaCle(ENDROIT_DU_MOTIF, cle)) {
    const e = ENDROIT_DU_MOTIF[cle];
    if (e.endroit === 'ligne') {
      const id = motif.ligneId ?? null;
      const aussi = e.aussi ? { aussi: e.aussi } : {};
      return id ? { endroit: 'ligne', ligneId: id, ...aussi } : { endroit: 'lignes', ...aussi };
    }
    return { ...e };
  }
  if (sections && typeof sections === 'object' && aLaCle(sections, cle)) {
    return { endroit: 'entreprise', section: sections[cle] ?? null };
  }
  return null;
}

/** Les trois parties de la liste, dans l'ordre de l'écran (§3.1 du cahier).
 *  « Mentions dues à un particulier » : les motifs `conso_` de l'entreprise,
 *  tous gardés à l'étape 2b-1 — Opus ne sait pas encore pour qui le client
 *  commande (2b-2). */
export const PARTIES_DE_LA_LISTE = Object.freeze([
  Object.freeze({ cle: 'devis', titre: 'Ce devis' }),
  Object.freeze({ cle: 'entreprise', titre: 'Votre entreprise' }),
  Object.freeze({ cle: 'particulier', titre: 'Mentions dues à un particulier' }),
]);

/* Ce que l'écran montre d'un élément qu'il ne sait pas lire : la règle de
   `lireMotifs` (emetteur.js), mot pour mot. */
const MOTIF_ILLISIBLE = 'Un élément manque, mais il n’a pas pu être lu : réessayez.';

/**
 * CE QUE LA BASE A RENDU, prêt pour l'écran — rangé en trois parties, avec
 * le compte de CHACUNE (critique E-4 : un compte unique ne s'éteindrait
 * jamais chez le propriétaire, dont le n° de TVA est refusé par VIES).
 *
 * `liste` : ce que rend `api.motifsRefusRemise` (`[{ rang, cle, phrase,
 * nature, ligneId }]`). `sections` : la table `SECTION_DU_MOTIF`
 * d'`emetteur.js`, que l'écran passe (voir `ENDROIT_DU_MOTIF`).
 *
 * Rend `{ parties: { devis, entreprise, particulier }, comptes: { devis,
 * entreprise, particulier }, total }` ; chaque élément porte `{ rang, cle,
 * phrase, nature, etiquette, ligneId, endroit, partie, connu }`.
 *
 * LA RÈGLE DE `lireMotifs` (emetteur.js), tenue ici aussi : c'est la phrase
 * DE LA BASE qui s'affiche, et une clé INCONNUE — une base plus récente que
 * l'application — s'affiche QUAND MÊME, et ne compte JAMAIS parmi les
 * mentions dues à un particulier : une version en retard ne doit pas
 * pouvoir faire passer un motif nouveau pour une mention secondaire. Elle va
 * dans « Votre entreprise » si son rang le dit (100 et au-delà), dans « Ce
 * devis » sinon. Sans `sections`, aucun motif de l'entreprise n'est
 * « connu » : tous restent dans « Votre entreprise », sans bouton — la
 * forme prudente de l'oubli.
 *
 * L'ordre est celui de la base, jamais refait ici : elle range déjà par
 * rang, et l'ordre des lignes fautives ne se lit pas dans cette liste.
 */
export function lireMotifsDeRemise(liste, { sections = null } = {}) {
  const table = sections && typeof sections === 'object' ? sections : null;
  const parties = { devis: [], entreprise: [], particulier: [] };
  (Array.isArray(liste) ? liste : []).forEach((brut) => {
    const m = brut && typeof brut === 'object' ? brut : { phrase: brut };
    const cle = typeof m.cle === 'string' && m.cle !== '' ? m.cle : null;
    const rang = Number.isSafeInteger(m.rang) ? m.rang : null;
    const duDevis = aLaCle(MOTIFS_DEVIS, cle);
    const deLEntreprise = !duDevis && table !== null && aLaCle(table, cle);
    const texte = m.phrase == null ? '' : String(m.phrase).trim();
    const phrase = texte || (duDevis ? MOTIFS_DEVIS[cle].phrase : MOTIF_ILLISIBLE);
    const natureLue = NATURES_DE_MOTIF.includes(m.nature) ? m.nature : null;
    const nature = natureLue || (duDevis ? MOTIFS_DEVIS[cle].nature : (deLEntreprise ? natureDuMotifEntreprise(cle) : null));
    let partie = 'devis';
    if (deLEntreprise && cle.startsWith('conso_')) partie = 'particulier';
    else if (deLEntreprise || (!duDevis && rang !== null && rang > RANG_DE_L_ENTREPRISE)) partie = 'entreprise';
    const ligneId = m.ligneId ?? null;
    parties[partie].push({
      rang,
      cle,
      phrase,
      nature,
      etiquette: nature ? ETIQUETTE_DE_NATURE[nature] : null,
      ligneId,
      endroit: endroitDuMotif({ cle, ligneId }, { sections: table }),
      partie,
      connu: duDevis || deLEntreprise,
    });
  });
  const comptes = {
    devis: parties.devis.length,
    entreprise: parties.entreprise.length,
    particulier: parties.particulier.length,
  };
  return { parties, comptes, total: comptes.devis + comptes.entreprise + comptes.particulier };
}

/* ------------------------------------------------------------------ */
/*  LES AVIS — jamais bloquants (annexe B.7)                            */
/* ------------------------------------------------------------------ */

/**
 * LES PLAFONDS DE LA FRANCHISE EN BASE DE TVA pour des PRESTATIONS DE
 * SERVICES (2b-4, l'avis au franchisé ; T10) — écrits UNE fois, en
 * centimes, avec leur source et la date de leur relecture : la loi les a
 * changés trois fois en 2025, et ils se recopieraient faux ailleurs.
 *   - `servicesAnneeEnCours` : au-delà sur l'année civile en cours, la
 *     franchise cesse à partir du jour du dépassement ;
 *   - `servicesAnneePrecedente` : au-delà sur l'année précédente, plus de
 *     franchise à partir du 1er janvier suivant. C'est le SEUIL de l'avis :
 *     un seul niveau, une phrase qui dit les deux plafonds (critique K2 —
 *     le plus haut seul ne dit pas le cas du 1er janvier).
 * Relu dans CGI, art. 293 B, I (version en vigueur au 16/11/2026), repris
 * au CIBS, art. L. 233-9, le 01/01/2027. Le plafond réduit de la première
 * année (CGI 293 D III) n'est pas suivi : Opus ne connaît pas la date de
 * création (DROIT-18, rangé).
 */
export const PLAFONDS_FRANCHISE = Object.freeze({
  servicesAnneeEnCours: 4125000,
  servicesAnneePrecedente: 3750000,
  reluLe: '2026-11-16',
  source: 'CGI, art. 293 B, I ; repris au CIBS, art. L. 233-9, le 01/01/2027',
});

/** LA SUITE DES DEUX AVIS AU FRANCHISÉ, écrite UNE fois (critique ÉCRAN-17) :
 *  « En franchise de TVA, … ». Les deux plafonds viennent de
 *  `PLAFONDS_FRANCHISE`, par `centimesLisibles` (ce fichier n'écrit jamais
 *  « € » lui-même). Jamais « HT » : en franchise, l'écran ne nomme pas la
 *  taxe (`libellesDesTotaux`), et le montant de l'avis n'est un chiffre
 *  d'affaires que quand aucune ligne ne porte de taux (T11). */
export const SUITE_AVIS_FRANCHISE = 'En franchise de TVA, les travaux comptent en principe comme des prestations de '
  + 'services : au-delà de '
  + `${centimesLisibles(PLAFONDS_FRANCHISE.servicesAnneeEnCours)} sur une même année civile, la franchise `
  + 'cesse à partir du jour du dépassement ; au-delà de '
  + `${centimesLisibles(PLAFONDS_FRANCHISE.servicesAnneePrecedente)}, vous n’y avez plus droit à partir `
  + 'du 1er janvier suivant. D’autres plafonds peuvent s’appliquer selon les matériaux que vous '
  + 'fournissez, ou si votre entreprise a été créée cette année. Opus ne connaît pas votre chiffre '
  + 'd’affaires : vérifiez avec votre comptable avant de remettre ce devis.';

/** Le délai par défaut, compté en jours : « Dans les 30 jours suivant la
 *  signature du devis » (`DELAI_PAR_DEFAUT.texte`). L'avis de l'attestation
 *  (2b-4) ajoute ces jours à la validité quand le délai écrit est
 *  EXACTEMENT celui-là — jamais en cherchant « 30 » dans un texte (M7) :
 *  un autre délai, Opus ne sait pas le compter. */
export const JOURS_DU_DELAI_PAR_DEFAUT = 30;

/** LA PHRASE FINALE DE L'AVIS DU DEVIS PAYANT pour une association, une
 *  copropriété ou une société civile (`reponseVue` `non_professionnel`) — D3
 *  de la relecture du 17/11/2026. L'avis dit le droit du CONSOMMATEUR :
 *  L. 221-18 ne vise que lui, et L. 221-3 n'étend les sections 2, 3 et 6
 *  qu'aux contrats HORS ÉTABLISSEMENT avec une petite entreprise hors de son
 *  activité principale. Pour ce client-là, Opus le dit par prudence, avec les
 *  mots d'`AIDE_NATURE_ACOMPTE_PRUDENCE` (2b-3, T7). Rien pour
 *  `professionnel_hors_activite` : chez lui, l'avis EST la loi (seule la
 *  demi-phrase « au téléphone ou par messages » déborde, et c'est voulu). */
export const SUITE_AVIS_DEVIS_PAYANT_PRUDENCE = 'Pour une association, une copropriété ou une société civile, la loi ne '
  + 'prévoit peut-être ni ce délai de rétractation ni ces règles ; Opus les dit, par prudence.';

/**
 * Les avis : ils s'affichent SOUS la liste, à part. Deux depuis 2b-1, deux
 * de plus à 2b-2 (annexe A.3) — quand le client commande pour son
 * entreprise, ce qu'il manque à SA fiche pour la facture.
 *
 * SIX DE PLUS À 2b-4 (annexe A.3 du cahier 2b-4), et aucun ne bloque rien :
 *   - le prix du devis LUI-MÊME : payant (DROIT-1, DROIT-3 : il nomme les
 *     quatorze jours, le cas où le client « ne vous devra rien s'il se
 *     rétracte » — la condition de L. 221-25 al. 3, D2 de la relecture du
 *     17/11 —, l'écrit ou le support durable, « pas même un chèque », le
 *     téléphone et les messages ; pour une association, une copropriété ou
 *     une société civile, `avisDuDevis` y ajoute
 *     `SUITE_AVIS_DEVIS_PAYANT_PRUDENCE`, D3) ; payant alors que les tarifs
 *     AFFICHÉS disent gratuit (DROIT-11) ; dit gratuit alors que les tarifs
 *     comptent des frais de déplacement (L. 121-4 19°) ;
 *   - l'attestation décennale qui finit avant que le devis puisse être
 *     accepté et les travaux commencer (`{fin}`, une date) ; un chantier
 *     « déjà ouvert » s'y dit selon le permis de construire (A. 243-1,
 *     annexe I : avec un permis, la déclaration d'ouverture seule ; sans
 *     permis, le premier ordre de service ou, à défaut, le commencement des
 *     travaux — D4 de la relecture du 17/11). La phrase n'est PAS
 *     définitive : J18, au juriste (un professionnel qui « établit son
 *     activité » après l'ouverture a sa propre date, et la clause « sauf si
 *     ce chantier est déjà ouvert » pourrait changer de sens) ;
 *   - le franchisé au-delà du plafond, sur le total net (`{montant}`) ou
 *     avec ses options — deux MODÈLES à trous, composés d'une SUITE écrite
 *     une fois.
 * Les modèles à trous (`{fin}`, `{montant}`) se remplissent dans
 * `avisDuDevis` ; ce que `verifier-devis` compare mot pour mot, ce sont ces
 * modèles. « Le devis lui-même » dans les trois premiers (T19) :
 * `avis_gratuit` parle du TOTAL à 0, et les deux peuvent sortir ensemble.
 */
export const AVIS_DU_DEVIS = Object.freeze({
  avis_objet: 'Ce devis n’a pas de titre : le document dira seulement « Devis ».',
  avis_gratuit: 'Ce devis ne coûte rien au client : vérifiez que c’est voulu.',
  avis_siret_client: 'Ce client commande pour son entreprise : ajoutez son SIRET à sa fiche, il vous servira pour la '
    + 'facture.',
  avis_fiche_particulier: 'Ce client commande pour son entreprise, mais votre carnet le range parmi les particuliers : '
    + 'passez sa fiche en « Entreprise » pour y écrire son SIRET.',
  /* D2 de la relecture (17/11) : « s’il se rétracte » — L. 221-25 al. 3 ne
     libère que le client « ayant exercé son droit de rétractation ». */
  avis_devis_payant:
    'Le devis lui-même est payant : convenu chez votre client, au téléphone ou par messages, il peut être un '
    + 'contrat à lui seul. Votre client peut alors se rétracter pendant quatorze jours ; si vous lui remettez '
    + 'le devis avant, sans sa demande écrite de le recevoir tout de suite, il ne vous devra rien s’il se '
    + 'rétracte. Convenu chez lui, il faut aussi un écrit signé (ou un support durable qu’il accepte) avec le '
    + 'formulaire de rétractation, et rien ne se reçoit avant le 8e jour, pas même un chèque. Opus ne prépare '
    + 'pas encore ce contrat : faites-le relire avant de faire payer un devis.',
  avis_devis_payant_tarifs_gratuits:
    'Le devis lui-même est payant, mais vos tarifs affichés disent que vos devis sont gratuits : un client '
    + 'peut y voir une annonce trompeuse. Changez vos tarifs dans « Mon entreprise », ou faites ce devis '
    + 'gratuitement.',
  avis_devis_gratuit_deplacement:
    'Le devis lui-même est dit gratuit, mais vos tarifs comptent des frais de déplacement : si vous les '
    + 'faites payer pour venir établir ce devis, ne le présentez pas comme gratuit — la loi peut y voir une '
    + 'pratique trompeuse.',
  /* D4 de la relecture (17/11) : A. 243-1, annexe I — avec un permis de
     construire, la seule date est celle de la déclaration d’ouverture ; sans
     permis, celle du premier ordre de service ou, à défaut, du commencement
     effectif. À faire relire (J18) : la phrase n’est pas définitive. */
  avis_attestation_echeance:
    'Votre attestation décennale est valable jusqu’au {fin}. Si elle vaut pour l’ensemble de vos chantiers, '
    + 'elle ne couvre en principe que ceux qui s’ouvrent jusqu’à cette date ; selon la date où ce devis sera '
    + 'accepté, ce chantier pourrait s’ouvrir après. C’est alors en principe l’attestation suivante qui '
    + 'comptera, sauf si ce chantier est déjà ouvert : avec un permis de construire, une déclaration '
    + 'd’ouverture déposée ; sans permis, un premier ordre de service donné, ou, à défaut, des travaux déjà '
    + 'commencés. Demandez-la à votre assureur, et pensez à la donner à votre client.',
  /* 2b-6 (annexe A.6, T31) — le signe de qualité qui couvre un travail coché
     finit avant que ce devis puisse être signé : le jumeau de
     `avis_attestation_echeance`. `{intitule}` et `{fin}` se remplissent dans
     `avisDuDevis`, depuis `finDuLabel`.
     SA SECONDE PHRASE est celle du propriétaire, du 24/11/2026 (relecture
     2b-6, DROIT6-6) : l'avis sonne ou se tait selon le délai d'exécution
     (les trente jours de `finDuLabel`), et ne parlait que de la SIGNATURE
     — or MaPrimeRénov' regarde la date des TRAVAUX. La règle qui le fait
     sonner ne change PAS ; un délai écrit à la main (« Fin mars ») n'est
     toujours pas lu. */
  avis_label_echeance:
    'Votre signe de qualité « {intitule} » est valable jusqu’au {fin}. Si ce devis est signé, ou ses travaux réalisés, '
    + 'après cette date sans que vous l’ayez renouvelé, votre client peut perdre des aides : renouvelez-le à temps.',
  avis_franchise_plafond: `Ce devis atteint à lui seul {montant}. ${SUITE_AVIS_FRANCHISE}`,
  avis_franchise_plafond_options: `Avec ses options, ce devis atteint {montant}. ${SUITE_AVIS_FRANCHISE}`,
});

/**
 * Les AVIS d'un devis : `[{ cle, phrase }]`. Calculés ici et nulle part en
 * base : un avis ne bloque rien, et une fonction de la base qui les rendrait
 * mêlés aux motifs pourrait un jour en faire bloquer un (critique B6).
 *   - `avis_objet` : un devis sans objet s'intitulera « Devis » tout court ;
 *   - `avis_gratuit` : au moins un poste, et un total TTC de 0 — tout est
 *     offert (ou réduit à rien). Le TTC est celui que la BASE a calculé
 *     (`totaux.ttc`, sinon `devis.totalTtcCentimes`) ; inconnu, on se tait :
 *     on n'avertit pas sur un total qu'on n'a pas lu.
 * Sans devis (un brouillon pas encore en base), aucun avis.
 *
 * `avis_gratuit` SE TAIT tant que la liste n'est pas SÛRE : l'état de la
 * liste (`etat`, celui d'`etatDeLaListe`) n'est pas `liste`, ou quelque
 * chose n'y est pas compté (`pasCompte`). POURQUOI (relecture de 2b-1,
 * PAR-8) : les lignes de l'écran comptent une ligne pas encore enregistrée,
 * le TTC de la base, lui, ne la connaît pas encore — il vaut 0. La même
 * carte disait alors, en même temps, « 1 ligne n’est pas enregistrée »,
 * « Ce devis ne chiffre encore aucun travail » et « Ce devis ne coûte rien
 * au client : vérifiez que c’est voulu. ». C'est la règle des motifs : on ne
 * juge que la dernière liste sûre. Sans `etat`, on se tait aussi : un appel
 * qui l'oublie ne doit pas ramener le défaut.
 *
 * LES DEUX AVIS DE LA FICHE (2b-2) ne parlent que quand la BASE a vu le client
 * commander pour son entreprise (`reponseVue` : `professionnel` ou
 * `professionnel_hors_activite` — la réponse VALABLE du bloc `demande` des
 * totaux relus, jamais celle de l'écran, en avance d'un envoi). `client` :
 * la fiche lue avec le devis (`devis.client` : `{ nom, type, siret }`) ;
 * un type INCONNU (`null`, une liste qui ne le joint pas) ne dit rien — on
 * n'avertit pas sur une fiche qu'on n'a pas lue.
 *   - `avis_siret_client` : une fiche « entreprise » sans SIRET ;
 *   - `avis_fiche_particulier` : une fiche « particulier ».
 *
 * LES SIX AVIS DE 2b-4, et TROIS ENTRÉES DE PLUS (T7) : `regime`,
 * `assurances` et `tarifs`, `undefined` PAR DÉFAUT — « pas transmis » : on se
 * tait. Pas `null` : `null` veut déjà dire « non déclaré » pour le régime et
 * « lus, aucune ligne » pour les tarifs (`tarifsConnus(null)`), le piège que
 * `client = undefined` évite déjà (critique ÉCRAN-16). Et `jour`, celui du
 * TÉLÉPHONE par défaut (deux jours, deux horloges : la base juge au jour de
 * Paris). Ceux qui dépendent de la BASE attendent la liste SÛRE ; ceux qui
 * ne dépendent que de l'artisan suivent l'écran, comme `avis_objet` (T16) :
 *   - `avis_devis_payant` (liste sûre) : le prix du devis lui-même est
 *     PAYANT, et la réponse que la base a vue n'est pas « pour son
 *     entreprise, dans son activité principale » — un consommateur, une
 *     association, une copropriété ou une société civile (prudence, DROIT-3),
 *     une petite entreprise hors de son activité, ou pas de réponse. Pour
 *     `non_professionnel` SEULEMENT, la phrase gagne
 *     `SUITE_AVIS_DEVIS_PAYANT_PRUDENCE` (D3 de la relecture du 17/11) : la
 *     loi qu'elle cite ne vise peut-être pas ce client. La CLÉ ne change
 *     pas ;
 *   - `avis_devis_payant_tarifs_gratuits` (suit l'écran) : les tarifs LUS,
 *     AFFICHÉS (`affiche === true`), disent un prix de devis à 0, et ce devis
 *     est payant (DROIT-11) ;
 *   - `avis_devis_gratuit_deplacement` (suit l'écran) : ce devis est dit
 *     gratuit, et les tarifs LUS comptent des frais de déplacement > 0 ;
 *   - `avis_attestation_echeance` (suit l'écran) : la décennale n'est pas
 *     « Non » ; les assurances sont LUES (une liste) ; la validité est dite ;
 *     parmi les décennales jointes (chemin écrit, la règle
 *     d'`etatDeLAttestation`) et valables au `jour`, la fin la PLUS TARDIVE
 *     (une entreprise qui a renouvelé en a deux) ; l'horizon est la validité,
 *     plus `JOURS_DU_DELAI_PAR_DEFAUT` quand le délai écrit est EXACTEMENT le
 *     délai par défaut (M7) ; l'avis parle si la fin tombe AVANT l'horizon
 *     (`joursEntre`, par `Date.UTC`, sans fuseau). Aucune attestation
 *     valable : on se tait, le rang 11 parle déjà. L'avis SOUS-ESTIME : la
 *     validité court de la date de REMISE (2c le recalculera, S8) ;
 *   - `avis_franchise_plafond` et `…_options` (liste sûre, T11) : le régime
 *     est « franchise » (une chaîne : en lecture ou en échec, on se tait),
 *     AUCUNE ligne ne contredit la franchise (`coherenceRegime` se tait —
 *     sinon la bande de cohérence dit déjà quoi corriger, et un total qui
 *     porte de la TVA ne se lit pas comme un chiffre d'affaires ; mesuré par
 *     la critique droit : 35 000 € à 20 % SANS option faisaient dire « Avec
 *     ses options, ce devis atteint 42 000,00 € HT ») ; puis le total NET hors
 *     options de la BASE (`totaux.ht`) au-delà du seuil → le premier ; sinon,
 *     AU MOINS UNE OPTION et le total toutes options (`totaux.ttcOptions`)
 *     au-delà → le second. Dans ce seul cas (aucun taux non nul),
 *     `ttcOptions` vaut le net plus les options, sans taxe (`tvaDe(base,
 *     null)` rend `null`, compté zéro). Jamais « HT » (DROIT-2, ÉCRAN-6).
 *
 * UN AVIS DE PLUS À 2b-6, et une entrée de plus : `labels` (les signes de
 * qualité de « Mon entreprise », aux noms de la base), `undefined` par
 * défaut — pas transmis, on se tait :
 *   - `avis_label_echeance` (SUIT L'ÉCRAN, le modèle de l'attestation, T31 :
 *     jamais la liste sûre) : un signe de qualité couvre un travail coché, et
 *     la fin qui compte — le MINIMUM, sur les travaux cochés et couverts, de
 *     la fin la plus TARDIVE qui couvre chacun — tombe avant l'horizon de
 *     l'attestation (`finDuLabel`). Il lit la réponse « à quel titre » DE
 *     L'ÉCRAN (`pourQuiValable`), et se tait pour une réponse « entreprise ».
 */
export function avisDuDevis({
  devis = null, lignes = [], totaux = null, etat = null, pasCompte = null, client = undefined, reponseVue = null,
  regime = undefined, assurances = undefined, tarifs = undefined, jour = jourDuTelephone(), labels = undefined,
} = {}) {
  if (!devis) return [];
  const avis = [];
  if (texteNet(devis.objet) === null) avis.push({ cle: 'avis_objet', phrase: AVIS_DU_DEVIS.avis_objet });
  const sure = etat === 'liste' && !pasCompte;
  const aUnPoste = (Array.isArray(lignes) ? lignes : []).some((l) => typeDe(l) === 'poste');
  let ttc = null;
  if (totaux && present(totaux.ttc)) ttc = Number(totaux.ttc);
  else if (present(devis.totalTtcCentimes)) ttc = Number(devis.totalTtcCentimes);
  if (sure && aUnPoste && ttc === 0) avis.push({ cle: 'avis_gratuit', phrase: AVIS_DU_DEVIS.avis_gratuit });
  const fiche = client !== undefined ? client : (devis.client || null);
  if ((reponseVue === 'professionnel' || reponseVue === 'professionnel_hors_activite') && fiche && typeof fiche === 'object') {
    if (fiche.type === 'entreprise' && texteNet(fiche.siret) === null) {
      avis.push({ cle: 'avis_siret_client', phrase: AVIS_DU_DEVIS.avis_siret_client });
    } else if (fiche.type === 'particulier') {
      avis.push({ cle: 'avis_fiche_particulier', phrase: AVIS_DU_DEVIS.avis_fiche_particulier });
    }
  }

  /* 2b-4 — le prix du devis LUI-MÊME. */
  const cout = devis.coutDevisCentimes;
  const payant = entier(cout) && cout > 0;
  if (sure && payant && reponseVue !== 'professionnel') {
    /* D3 : pour une association, une copropriété ou une société civile, la
       phrase de la loi, puis celle de la prudence — et pour elle seule. */
    const phrase = reponseVue === 'non_professionnel'
      ? `${AVIS_DU_DEVIS.avis_devis_payant} ${SUITE_AVIS_DEVIS_PAYANT_PRUDENCE}`
      : AVIS_DU_DEVIS.avis_devis_payant;
    avis.push({ cle: 'avis_devis_payant', phrase });
  }
  const t = tarifsConnus(tarifs);
  const ligneTarifs = t && t.ligne && typeof t.ligne === 'object' ? t.ligne : null;
  if (payant && ligneTarifs && ligneTarifs.affiche === true && ligneTarifs.prix_devis_centimes === 0) {
    avis.push({ cle: 'avis_devis_payant_tarifs_gratuits', phrase: AVIS_DU_DEVIS.avis_devis_payant_tarifs_gratuits });
  }
  if (cout === 0 && ligneTarifs && entier(ligneTarifs.frais_deplacement_centimes) && ligneTarifs.frais_deplacement_centimes > 0) {
    avis.push({ cle: 'avis_devis_gratuit_deplacement', phrase: AVIS_DU_DEVIS.avis_devis_gratuit_deplacement });
  }

  /* 2b-4 — l'attestation décennale qui arrive à sa fin. */
  const fin = finDeLAttestation({ devis, assurances, jour });
  if (fin) {
    avis.push({ cle: 'avis_attestation_echeance', phrase: AVIS_DU_DEVIS.avis_attestation_echeance.replace('{fin}', dateFrancaise(fin)) });
  }

  /* 2b-6 — le signe de qualité qui arrive à sa fin (T31) : UN appel, sans
     la liste sûre. */
  const label = finDuLabel({ devis, labels, jour });
  if (label) {
    avis.push({
      cle: 'avis_label_echeance',
      /* UN SEUL PASSAGE, par une FONCTION (relecture ÉCRAN-3) : remplacé par
         une chaîne, un « $' », « $& » ou « $` » de l'intitulé tapé par
         l'artisan était interprété, et un « {fin} » venu de l'intitulé
         remplacé à son tour — l'avis devenait du charabia. */
      phrase: AVIS_DU_DEVIS.avis_label_echeance.replace(/\{(intitule|fin)\}/g,
        (_, k) => (k === 'intitule' ? (label.intitule ?? '') : (dateFrancaise(label.fin) ?? ''))),
    });
  }

  /* 2b-4 — le franchisé au-delà du plafond. */
  const franchise = avisDeLaFranchise({ lignes, totaux, regime, sure });
  if (franchise) avis.push(franchise);
  return avis;
}

/**
 * LA FIN D'ATTESTATION QUI FAIT PARLER L'AVIS `avis_attestation_echeance`
 * (2b-4), « AAAA-MM-JJ », ou `null` quand l'avis se tait — écrite à part pour
 * que `verifier-devis` en fasse tourner chaque bord (voir `avisDuDevis`).
 * `assurances` : les lignes d'`emetteur_assurances`, aux noms de la base ;
 * tout ce qui n'est pas une LISTE (`undefined`, pas lues ; `null`) se tait.
 */
export function finDeLAttestation({ devis = null, assurances = undefined, jour = jourDuTelephone() } = {}) {
  const d = devis || {};
  if (d.engageDecennale === false) return null;
  if (!Array.isArray(assurances)) return null;
  if (!entier(d.validiteJours) || d.validiteJours < 1) return null;
  const auJour = jourEcrit(jour) || jourDuTelephone();
  const proId = d.proId ?? null;
  let fin = null;
  assurances.forEach((a) => {
    if (!a || a.nature !== 'decennale' || !cheminEcrit(a.attestation_chemin)) return;
    if (proId != null && a.pro_id != null && String(a.pro_id) !== String(proId)) return;
    const f = jourEcrit(a.valide_jusquau);
    if (f !== null && f >= auJour && (fin === null || f > fin)) fin = f;
  });
  if (fin === null) return null;
  const parDefaut = texteNet(d.delaiExecution) === DELAI_PAR_DEFAUT.texte;
  const horizon = d.validiteJours + (parDefaut ? JOURS_DU_DELAI_PAR_DEFAUT : 0);
  const reste = joursEntre(auJour, fin);
  return reste !== null && reste < horizon ? fin : null;
}

/**
 * L'AVIS AU FRANCHISÉ (2b-4, T11) — `{ cle, phrase }`, ou `null`. Écrit à
 * part pour que `verifier-devis` en fasse tourner chaque bord ; la règle est
 * dite dans l'en-tête d'`avisDuDevis`. `sure` : la liste est-elle sûre
 * (`etat === 'liste'` et rien de pas compté) ?
 */
export function avisDeLaFranchise({ lignes = [], totaux = null, regime = undefined, sure = false } = {}) {
  if (regime !== 'franchise' || !sure || !totaux) return null;
  if (coherenceRegime(lignes, regime) !== null) return null;
  const seuil = PLAFONDS_FRANCHISE.servicesAnneePrecedente;
  if (entier(totaux.ht) && totaux.ht > seuil) {
    return {
      cle: 'avis_franchise_plafond',
      phrase: AVIS_DU_DEVIS.avis_franchise_plafond.replace('{montant}', centimesLisibles(totaux.ht)),
    };
  }
  const aUneOption = (Array.isArray(lignes) ? lignes : []).some((l) => typeDe(l) === 'option');
  if (aUneOption && entier(totaux.ttcOptions) && totaux.ttcOptions > seuil) {
    return {
      cle: 'avis_franchise_plafond_options',
      phrase: AVIS_DU_DEVIS.avis_franchise_plafond_options.replace('{montant}', centimesLisibles(totaux.ttcOptions)),
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  LES PHRASES DE L'ÉCRAN (annexe B.8) — une seule écriture de chacune */
/* ------------------------------------------------------------------ */

/** En tête des « Mentions dues à un particulier » quand on ne sait pas à
 *  quel titre le client commande — pas de réponse VALABLE vue par la base, ou
 *  une réponse qu'Opus ne connaît pas. Depuis 2b-2, c'est la phrase de
 *  repli de `phraseDesMentionsParticulier`. */
export const MENTIONS_PARTICULIER_PAR_PRUDENCE = 'Opus ne sait pas encore pour qui le client commande : dans le '
  + 'doute, il compte ce qu’on doit à un particulier.';

/** La phrase de la sous-partie, réponse par réponse (cahier 2b-2, annexe
 *  A.3). « 5 salariés » porte une espace insécable. */
export const MENTIONS_PARTICULIER_SELON_LA_REPONSE = Object.freeze({
  consommateur: 'Ce client commande à titre privé : la loi demande de lui communiquer ces informations, et Opus les '
    + 'imprime sur le devis.',
  non_professionnel: 'Une association, une copropriété ou une société civile sans activité professionnelle : la loi ne '
    + 'demande peut-être pas ces mentions pour elle ; Opus les compte, par prudence.',
  professionnel_hors_activite: 'Ce client commande pour son entreprise de 5\u00a0salariés au plus, hors de son activité '
    + 'principale : quand le devis est signé hors de vos locaux, la loi lui doit ces mentions comme à un particulier '
    + '(sauf pour un bâtiment neuf ou une transformation importante). Opus les compte toutes, par prudence.',
  professionnel: 'Ce client commande pour son entreprise : Opus ne garde que l’adresse de votre établissement ou de '
    + 'votre siège, par prudence — la loi la demande peut-être sur tous vos devis.',
});

/**
 * LA PHRASE SOUS « MENTIONS DUES À UN PARTICULIER » (2b-2, cahier §3.6) —
 * choisie par la réponse que la BASE a vue DANS LA MÊME PHOTO que la liste
 * (`reponseVue`, la réponse valable du bloc `demande` relu avec elle),
 * JAMAIS par celle de l'écran : la liste dit ce que la base a compté, et la
 * phrase qui l'explique doit parler du même devis. Inconnue : la phrase de
 * prudence.
 */
export function phraseDesMentionsParticulier(reponseVue) {
  return aLaCle(MENTIONS_PARTICULIER_SELON_LA_REPONSE, reponseVue)
    ? MENTIONS_PARTICULIER_SELON_LA_REPONSE[reponseVue] : MENTIONS_PARTICULIER_PAR_PRUDENCE;
}

/**
 * CE QU'OPUS NE VÉRIFIE PAS ENCORE — dit sous « rien ne manque » (critique
 * D2 : sans cette phrase, « rien ne manque » mentirait). Aucune date, aucun
 * « prochain lot » (critique E-11) : on dit ce qui manque, pas quand.
 *
 * HUIT FAITS depuis la relecture de 2b-1 (TXT-2, 05/11/2026) : le label RGE
 * (ses obligations, C. consom. L. 224-114 et L. 224-115) et l'immeuble neuf
 * (qui écarte le taux réduit, CGI 279-0 bis 2) manquaient — une ligne à 10 %
 * sur un immeuble neuf affichait « rien ne manque ». Et « le prix du devis »
 * se lisait comme le TOTAL : la loi parle du caractère payant ou gratuit du
 * devis LUI-MÊME (arrêté du 24/01/2017, art. 4-I).
 *
 * SEPT FAITS depuis 2b-2 (annexe A.6) : « pour qui le client commande » est
 * vérifié (le motif `devis_pour_qui`), et le chantier neuf aussi, par la
 * réponse de l'artisan (`devis_taux_reduit_neuf`) ; restent, pour le taux
 * réduit, ses AUTRES conditions — l'ancienneté du logement et la
 * certification du client (critique droit I6). Le moment de la signature
 * reste : aucune question ne le pose (décision du 09/11).
 *
 * 2b-3 (annexe A.6) : « la garantie décennale » sort — le rang 11 lit
 * désormais la réponse de l'artisan et l'attestation jointe. Ce qui reste
 * de la décennale, et qu'Opus ne lit pas : si l'attestation COUVRE ces
 * travaux (ses activités, la date où le chantier s'ouvrira). « L'urgence »
 * reste, sous la forme « si une ligne marquée « réparation urgente » l'est
 * vraiment » (D9) : Opus ne vérifie aucune de ses conditions.
 *
 * 2b-4 (annexe A.4) : « si le devis lui-même est payant » SORT — le point
 * `devis_cout` (rang 12) demande désormais s'il est gratuit ou payant. « Si
 * ce devis relève des services à la personne » ENTRE (réponse Q3 du 16/11 :
 * aucune question, aucune case, aucun motif ; pour eux, le devis est
 * toujours gratuit, et l'aide du bloc le dit). Les déchets et le label RGE
 * restent : ce sont les étapes 2b-5 et 2b-6. Ni chiffre, ni date, ni
 * « lot », ni « le prix du devis ». Copiée en toutes lettres dans
 * `verifier-devis` (B8) et `mesure-devis` : les trois changent ensemble.
 *
 * 2b-5 (annexe A.6, décision T18) : « les déchets de chantier » SORT — le
 * rang 13 demande désormais la quantité, le tri, les lieux et le coût. Ce
 * qu'Opus ne vérifie pas des déchets ENTRE, à sa place : « si vos lieux de
 * dépôt acceptent ces déchets » (la loi demande de s'assurer que le
 * repreneur est autorisé ; Opus ne le sait pas). TOUJOURS SEPT faits : il
 * vient en DERNIER, et le « et » se déplace devant lui.
 *
 * 2b-6 (annexe A.8, décision T12) : « le label RGE pour des travaux
 * d’énergie » SORT — le rang 14 demande désormais les travaux, le label
 * travail par travail et la sous-traitance. Ce qu'Opus ne vérifie pas des
 * labels ENTRE, à sa place (le quatrième) : « si les labels RGE déclarés,
 * les vôtres et ceux de vos sous-traitants, existent, couvrent ces travaux
 * et sont toujours en vigueur » — Opus constate une catégorie cochée, un
 * chemin et une date ; il ne vérifie ni l'existence du signe, ni que le
 * certificat nomme ces travaux, ni un retrait par l'organisme (DROIT-10).
 * TOUJOURS SEPT faits, trois copies (ici, `verifier-devis`, `mesure-devis`).
 */
export const PAS_ENCORE_VERIFIE = 'Pas encore vérifié : le moment de la signature, si une ligne marquée « réparation urgente » l’est '
  + 'vraiment, si ce devis relève des services à la personne, si les labels RGE déclarés, les vôtres et ceux de vos '
  + 'sous-traitants, existent, couvrent ces travaux et sont toujours en vigueur, les conditions du taux réduit de '
  + 'TVA (l’ancienneté du logement, la certification du client), si votre attestation décennale couvre ces travaux '
  + '(ses activités, la date où le chantier s’ouvrira), et si vos lieux de dépôt acceptent ces déchets.';

/** Rien ne manque pour CE devis — jamais « rien ne manque » tout court. */
export const RIEN_NE_MANQUE_POUR_CE_DEVIS = 'Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui.';

/** Le brouillon n'est pas encore en base : AUCUN appel (la fonction
 *  rendrait OP027 pour un devis qu'elle ne trouve pas — critique E-2/N1). */
export const LISTE_AVANT_LA_PREMIERE_LIGNE = 'Écrivez une première ligne : la liste se calculera ensuite.';

/** Des écritures en route : la dernière liste sûre reste affichée. */
export const LISTE_EN_ROUTE = 'Des changements partent : la liste sera à jour juste après.';

/** Une lecture ratée — jamais « Rien ne manque ». */
export const LISTE_NON_LUE = 'Liste non lue — Réessayer';

/* ------------------------------------------------------------------ */
/*  « POUR LE REMETTRE » — ce que l'écran DÉCIDE (lot 2b-1)             */
/* ------------------------------------------------------------------ */
/* Ces constantes et ces fonctions vivaient dans `PourRemettre.js`, qui
   charge React Native : `node` ne pouvait pas les faire tourner, et
   `verifier-devis` les EXTRAYAIT par leur texte (`new Function`) — un
   contrôle qui lit un morceau de fichier perd sa cible au premier
   déménagement (vérification de construction du lot 2b-1, écart 9 ; la
   leçon de `cloudinary-adresses.js`). Elles vivent ici, sans JSX, et
   `verifier-devis` les IMPORTE. `PourRemettre.js` ne garde que le dessin. */

/** La valeur de l'état `carte` de la saisie quand la liste est ouverte —
 *  jamais `'remise'`, qui désigne déjà la RÉDUCTION dans le code (E-18). */
export const CARTE_POUR_REMETTRE = 'pour_remettre';

/** Le titre de la ligne et de la carte. */
export const TITRE_POUR_REMETTRE = 'Pour le remettre';

/** La première lecture, pas encore revenue. */
export const LISTE_EN_LECTURE = 'Lecture de la liste…';

/** Une RELECTURE dont on ne sait pas si quelque chose a changé : celle qui
 *  suit la fermeture de « Mon entreprise » (on a pu y écrire, ou seulement
 *  la regarder), ou une relecture sans cause notée. Ce n'est PAS « des
 *  changements partent » : rien ne part forcément, on relit — la phrase est
 *  vraie dans les deux cas (`phraseEnRoute`). */
export const LISTE_MISE_A_JOUR = 'Mise à jour de la liste…';

/* La même chose sur la ligne, à la suite du compte : une MENTION, qui ne
   change pas la hauteur de la ligne (E-6). */
const MISE_A_JOUR_DE_LA_LIGNE = ' · mise à jour…';

/**
 * CE QUE LA CARTE DIT À LA PLACE D'UNE PARTIE QUE LA LISTE RELIT (relecture
 * de 2b-1, ECR-1). Pendant qu'une écriture DU DEVIS part, puis pendant la
 * lecture qui la suit, la partie « Ce devis » de la dernière liste peut
 * mentir : « Ce devis ne chiffre encore aucun travail » sous un poste qu'on
 * vient d'écrire, « Ce devis : rien ne manque » juste après avoir vidé le
 * délai (mesuré au navigateur, 300 ms en démonstration — jusqu'à 8 s sur la
 * vraie base). Au retour de « Mon entreprise », les DEUX parties se taisent
 * (relecture 4 de 2b-1, 06/11/2026) : « Votre entreprise » date d'avant ce
 * qu'on vient peut-être d'y écrire, et « Ce devis » aussi — le régime de TVA,
 * qui s'écrit là, décide de ses points (relecture 2, REL-2). La partie
 * périmée ne se LIT pas — ni ses
 * points, ni leurs boutons, ni « rien ne manque » —, cette phrase la
 * remplace. Mais elle GARDE SA PLACE (relecture 2, REL-3) : la dernière
 * liste sûre de cette partie reste montée, INVISIBLE (opacité nulle, aucun
 * toucher, cachée à VoiceOver), et la phrase est posée par-dessus — sinon
 * tout ce qui suit remontait puis redescendait sous le doigt (70 points
 * mesurés au navigateur, liste revenue identique). Jamais estompée : une
 * liste estompée montrerait encore des points périmés (ECR-1).
 */
export const CE_DEVIS_SE_MET_A_JOUR = 'Ce devis : la liste se met à jour.';
export const ENTREPRISE_SE_MET_A_JOUR = 'Votre entreprise : la liste se met à jour.';

/** Un champ de l'EN-TÊTE refusé (par l'écran ou par la base) : la base a
 *  gardé l'ancienne valeur, que la liste juge. */
export const ENTETE_PAS_COMPTE = 'Un champ du devis n’est pas enregistré : il n’est pas compté dans cette liste.';

/** …et la même chose sur un brouillon que la base n'a pas encore : il n'y a
 *  aucune liste, elle se calculera quand il sera enregistré. */
export const ENTETE_PAS_ENCORE_ENREGISTRE = 'Un champ du devis n’est pas encore enregistré : la liste se calculera ensuite.';

/**
 * CE QUE LA LISTE NE COMPTE PAS, dit en toutes lettres — ou `null`.
 *   `nbLignes` : les lignes NON ENREGISTRÉES — LE MÊME COMPTE que le pied
 *                (`suffixeDuPied`) et la garde de sortie : incomplètes,
 *                refusées ou en échec. On n'en invente pas un second : deux
 *                comptes d'une même vérité finissent par se contredire (la
 *                leçon des voyants du 04/10) ;
 *   `entete`   : un champ de l'en-tête refusé ;
 *   `enBase`   : le brouillon est-il en base ? Sinon il n'y a AUCUNE liste
 *                (aucun appel tant qu'il n'est pas en base) : la phrase dit
 *                que la liste se calculera ensuite. Avant (relecture de
 *                2b-1, ECR-3), un brouillon neuf qui portait une ligne
 *                incomplète disait « Écrivez une première ligne » sous une
 *                ligne visible — la phrase du brouillon où rien n'est tapé.
 *
 * POURQUOI (vérification de construction du lot 2b-1, écart 8) : la base ne
 * voit pas une ligne qu'elle a refusée. Le seul poste d'un devis refusé, la
 * liste dit « Ce devis ne chiffre encore aucun travail » SOUS une ligne
 * visible — vrai pour la base, faux pour l'artisan qui la regarde, s'il
 * n'est pas DIT pourquoi. Les lignes passent avant l'en-tête : ce sont elles
 * que la liste juge le plus (le poste, le taux).
 */
export function ceQueLaListeNeComptePas({ nbLignes = 0, entete = false, enBase = true } = {}) {
  const n = Number.isSafeInteger(nbLignes) && nbLignes > 0 ? nbLignes : 0;
  if (!enBase) {
    if (n === 1) return '1 ligne n’est pas encore enregistrée : la liste se calculera ensuite.';
    if (n > 1) return `${n} lignes ne sont pas encore enregistrées : la liste se calculera ensuite.`;
    return entete ? ENTETE_PAS_ENCORE_ENREGISTRE : null;
  }
  if (n === 1) return '1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste.';
  if (n > 1) return `${n} lignes ne sont pas enregistrées : elles ne sont pas comptées dans cette liste.`;
  return entete ? ENTETE_PAS_COMPTE : null;
}

/**
 * L'ÉTAT DE LA LISTE — l'ordre du cahier (§3.1), et rien d'autre ne décide :
 *   1. `pas_en_base` : le brouillon n'existe pas encore en base — AUCUN
 *      appel (la fonction rendrait OP027) ;
 *   2. `en_route`    : des changements DU DEVIS partent — une écriture en
 *      vol ou en attente (`enRoute`), un champ de l'en-tête ouvert et tapé
 *      mais pas encore quitté (`champOuvert`) —, OU une RELECTURE qui suit
 *      un changement (`relecture`, l'une ou l'autre cause) : ce temps-là
 *      n'est fini qu'au retour de la liste (relecture de 2b-1, ECR-1 — sinon
 *      la ligne disait « ce devis — aucun point · mise à jour… » juste après
 *      qu'on avait vidé le délai) ;
 *   3. `echec`       : la DERNIÈRE lecture a échoué ;
 *   4. `lecture`     : rien de lu encore ;
 *   5. `liste`.
 * `relecture` : `{ devis, entreprise }` — ce que la lecture EN COURS relit
 * parce que cela vient de changer (la saisie le note en lançant la lecture :
 * une écriture du devis confirmée, `devis` ; « Mon entreprise » refermée, les
 * DEUX — elle peut avoir changé le régime de TVA, qui décide des points du
 * devis, relecture 2 de 2b-1, REL-2). Depuis le 06/11/2026 (relecture 4),
 * rien ne relit plus l'entreprise SEULE : toute relecture notée est un temps
 * « en route », et la phrase qui le dit vient de `phraseEnRoute`.
 * Ce qui n'est PAS ENREGISTRÉ (une ligne refusée, rien ne part) n'est pas
 * un état : rien ne le relira tout seul, la liste lue reste juste pour ce
 * que la base a — `ceQueLaListeNeComptePas` le DIT à côté, dans n'importe
 * quel état où une liste ou un échec s'affiche.
 *
 * UN ÉCHEC QUI SUIT UNE LISTE SÛRE l'EFFACE (`lireLaListe` pose `motifs:
 * null`) : cette liste date d'avant l'écriture qui a lancé la lecture
 * ratée, elle n'est plus sûre. La garder sous « Liste non lue » montrerait
 * peut-être « Ce devis : rien ne manque… » pour un devis qui vient de
 * perdre son seul poste — un travail qui n'a pas pu se faire ressemblerait
 * à un travail fait. D'où `echec` AVANT `lecture` et `liste`, et la carte
 * qui ne montre aucune partie sur un échec.
 */
export function etatDeLaListe({
  enBase = false, enRoute = false, champOuvert = false, erreur = null, lue = null, relecture = null,
} = {}) {
  if (!enBase) return 'pas_en_base';
  if (enRoute || champOuvert || !!(relecture && (relecture.devis || relecture.entreprise))) return 'en_route';
  if (erreur) return 'echec';
  if (!lue) return 'lecture';
  return 'liste';
}

/**
 * LA PHRASE D'UN TEMPS « EN ROUTE » (relecture 4 de 2b-1, 06/11/2026) — sur
 * la ligne, et en tête de la carte quand aucune liste ne s'y montre :
 *   - la relecture qui suit la fermeture de « Mon entreprise »
 *     (`relecture.entreprise`) : `LISTE_MISE_A_JOUR`, « Mise à jour de la
 *     liste… ». RIEN NE PROUVE qu'un changement a eu lieu — on a pu
 *     seulement regarder « Mon entreprise » : « Des changements partent »
 *     serait faux dans ce cas, « Mise à jour de la liste… » est vrai dans
 *     les deux (et aussi quand une écriture du devis part en même temps) ;
 *   - sinon (une écriture du devis, un champ de l'en-tête tapé, la lecture
 *     qui suit une écriture) : `LISTE_EN_ROUTE`, « Des changements partent :
 *     la liste sera à jour juste après. » (annexe B.8).
 */
export function phraseEnRoute(relecture = null) {
  return relecture && relecture.entreprise ? LISTE_MISE_A_JOUR : LISTE_EN_ROUTE;
}

/** « aucun point », « 1 point », « 3 points ». */
export function points(n) {
  if (!n) return 'aucun point';
  return n > 1 ? `${n} points` : '1 point';
}

/** Le compte PAR ENDROIT : le devis, et l'entreprise (ses mentions dues à
 *  un particulier comprises — elles se corrigent au même endroit), avec
 *  combien de ces points sont dus à un particulier (`dontParticulier`,
 *  décision D-B du propriétaire, le 05/11/2026 au soir). Les AVIS ne
 *  comptent jamais. UNE seule écriture de ce compte : la ligne, le titre de
 *  la carte et l'étiquette parlée le lisent tous ici. */
export function comptesParEndroit(lue) {
  const c = (lue && lue.comptes) || {};
  const dontParticulier = c.particulier || 0;
  return { devis: c.devis || 0, entreprise: (c.entreprise || 0) + dontParticulier, dontParticulier };
}

/** « ce devis — 2 points · votre entreprise — 1 point ». Le compte « dont N
 *  dus à un particulier » (D-B) ne s'y dit jamais : il est dans le titre de
 *  la carte seulement (`titresDesParties`). */
export function phraseDesEndroits(lue) {
  const c = comptesParEndroit(lue);
  return `ce devis — ${points(c.devis)} · votre entreprise — ${points(c.entreprise)}`;
}

/**
 * LES TITRES DES PARTIES DE LA CARTE : `{ devis, entreprise }`.
 * DÉCISION D-B DU PROPRIÉTAIRE (05/11/2026 au soir, relecture ECR-6) : le
 * titre de l'entreprise dit combien de ses points sont dus à un particulier
 * — « Votre entreprise — 5 points, dont 3 dus à un particulier » —, parce
 * que ces trois-là s'affichent sous un sous-titre à eux : on comptait 2
 * points sous un titre qui en annonçait 5. Le 5 reste le compte de la ligne
 * (une seule écriture, `comptesParEndroit`) ; jamais un titre à 2.
 * Accords : « 1 point, dont 1 dû », « 2 points, dont 1 dû », « dont 3 dus ».
 */
export function titresDesParties(lue) {
  const c = comptesParEndroit(lue);
  const m = c.dontParticulier;
  const dont = m > 0 ? `, dont ${m} ${m > 1 ? 'dus' : 'dû'} à un particulier` : '';
  return {
    devis: `Ce devis — ${points(c.devis)}`,
    entreprise: `Votre entreprise — ${points(c.entreprise)}${dont}`,
  };
}

/**
 * LE CHIFFRE LE PLUS LARGE de la police de la ligne (Inter, `F.inter`) :
 * le 4 — mesuré au navigateur le 06/11/2026, à la taille du texte de la
 * ligne : 7,75 points en haut (12 points ; le 0, 7,57 ; le 1, 4,88), 7,11 en
 * bas (11 points). Inter n'a pas des chiffres de largeur égale : un nombre
 * écrit avec des 4 est au moins aussi large que tout nombre du même nombre
 * de chiffres. `mesure-devis` le remesure dans la page à chaque passage, à
 * la police de chaque ligne.
 */
export const CHIFFRE_LE_PLUS_LARGE = '4';

/* Combien de chiffres au plus, sur la ligne :
     - les lignes non enregistrées et les points du devis : TROIS — un devis
       porte 500 lignes au plus (`OP014`), et ses points sont onze motifs plus
       un par ligne fautive (511 au plus depuis 2b-4 : un motif pour chacun
       des rangs 1, 2, 4 à 12 ; ce commentaire disait « huit … 508 », faux
       depuis 2b-3, critique ÉCRAN-12). Mille lignes non enregistrées
       demanderaient d'en avoir tapé mille à la main ;
     - les points de l'entreprise (mentions dues à un particulier comprises) :
       DEUX — `emetteur_incomplet()` en rend 21 au plus. */
const LE_PLUS_LARGE_EN_TROIS_CHIFFRES = Number(CHIFFRE_LE_PLUS_LARGE.repeat(3));
const LE_PLUS_LARGE_EN_DEUX_CHIFFRES = Number(CHIFFRE_LE_PLUS_LARGE.repeat(2));

/**
 * LES GABARITS DE LA LIGNE — UNE LISTE FIXE, la même dans TOUS les états où
 * quelque chose n'est pas compté sur un devis en base (liste, en route,
 * lecture, échec, OP027, la relecture qui suit « Mon entreprise »), qu'une
 * liste ait été lue ou non, quels que soient les nombres et la phrase — et
 * pendant qu'une écriture renvoyée après un échec est en route (la règle :
 * `garderLaPlace`, plus bas).
 * DÉCISION D-A BIS DU PROPRIÉTAIRE (06/11/2026, « garder la grande place ») :
 * la ligne réserve la hauteur du PLUS LONG des textes qu'elle peut prendre
 * dans ces états, même si cela lui fait 110 points au lieu de 92 sur son
 * iPhone 16. Ces textes sont posés INVISIBLES dans son flux ; la ligne prend
 * la hauteur du plus grand, à toute largeur. Le prix, mesuré au navigateur
 * le 06/11 de 320 à 440 points d'écran (`mesure-devis`) : en haut, 128 points
 * de 320 à 323 (« 444 lignes… » y prend une ligne de plus), 110 de 324 à 402,
 * 92 au-delà ; en bas, 104 jusqu'à 347, 88 au-delà.
 *
 * CE QU'ELLE CONTIENT, ET POURQUOI CELA SUFFIT. Le texte d'un de ces états
 * est l'un de ceux-ci :
 *   - « phrase + décompte » (état `liste`) : la phrase de
 *     `ceQueLaListeNeComptePas` (une ligne, N lignes, ou le champ de
 *     l'en-tête), à la ligne, puis « ce devis — X · votre entreprise — Y » ;
 *   - la phrase seule (`lecture`) ; `LISTE_EN_ROUTE` ou `LISTE_MISE_A_JOUR`
 *     (`en_route`) ; `LISTE_NON_LUE` ou la phrase d'un refus définitif
 *     (`echec`).
 * Une ligne se coupe en mots, le plus de mots possible par ligne : un mot
 * plus large ne fait jamais moins de lignes. Les gabarits prennent donc, pour
 * chaque mot qui change, sa forme la PLUS LARGE : « aucun point » et un
 * nombre de trois (ou deux) chiffres les plus larges suivi de « points »
 * (aucun des deux n'est plus large que l'autre mot pour mot : « aucun » et
 * « point » contre « 444 » et « points ») ; « 444 lignes » pour N lignes ;
 * et chacune des trois phrases, qui n'ont pas les mêmes mots. Tous les
 * couples phrase + décompte (3 × 4), puis les phrases d'état. Rien n'en
 * dépend des nombres du moment : « 1 point » qui devient « aucun point »,
 * « 1 ligne » qui devient « 2 lignes », la première lecture, un échec — la
 * place ne bouge pas. (Relecture 3 de 2b-1, RELIRE3-1 : les gabarits étaient
 * faits avec les nombres de la dernière liste lue — la ligne du haut passait
 * de 92 à 110 points à 393 quand le dernier point du devis était corrigé, et
 * aucune liste lue, aucun gabarit.)
 *
 * LE TEXTE LU est la dernière couche de la même superposition
 * (`PourRemettre.js`) : la place est donc la plus grande des gabarits ET de
 * ce qu'on lit — ce qu'on lit n'est jamais plus haut que la place. Un texte
 * qu'aucun gabarit ne prévoit (une phrase de refus définitif plus longue que
 * prévu) agrandirait la place, sans jamais déborder.
 */
const PHRASES_PAS_COMPTE_LES_PLUS_LONGUES = Object.freeze([
  ceQueLaListeNeComptePas({ nbLignes: 1 }),
  ceQueLaListeNeComptePas({ nbLignes: LE_PLUS_LARGE_EN_TROIS_CHIFFRES }),
  ceQueLaListeNeComptePas({ entete: true }),
]);
const DECOMPTES_LES_PLUS_LONGS = Object.freeze([0, LE_PLUS_LARGE_EN_TROIS_CHIFFRES].flatMap((devis) => [0, LE_PLUS_LARGE_EN_DEUX_CHIFFRES]
  .map((entreprise) => phraseDesEndroits({ comptes: { devis, entreprise, particulier: 0 } }))));
export const GABARITS_DE_LA_LIGNE = Object.freeze([
  ...PHRASES_PAS_COMPTE_LES_PLUS_LONGUES.flatMap((p) => DECOMPTES_LES_PLUS_LONGS.map((d) => `${p}\n${d}`)),
  LISTE_EN_ROUTE, LISTE_MISE_A_JOUR, LISTE_NON_LUE,
]);

/**
 * LA RÈGLE DE LA PLACE, SANS MÉMOIRE (relecture 6 de 2b-1, 07/11/2026) : la
 * ligne réserve ses gabarits (`GABARITS_DE_LA_LIGNE`) SI ET SEULEMENT SI le
 * devis est EN BASE et que
 *   - quelque chose n'est pas compté (`pasCompte` : une ligne incomplète ou
 *     refusée par l'écran, une écriture en échec — un retrait compris —, un
 *     champ de l'en-tête refusé ou en échec), OU
 *   - une écriture RENVOYÉE APRÈS UN ÉCHEC est en route (`renvoi` : la file
 *     le dit, `renvoisEnRoute()`, file-ecriture.js, point 18 — « Réessayer »
 *     sur une ligne, sur l'en-tête, sur un retrait, le renvoi automatique du
 *     plafond ; et, depuis la relecture 7 (08/11/2026), la même écriture
 *     renvoyée par une autre porte : la carte d'une ligne en échec fermée
 *     sans rien changer, un retrait en échec retiré de nouveau, le reste
 *     d'un refus partiel de l'en-tête, une écriture de l'en-tête pendant
 *     qu'un refus du plafond est tenu à part).
 * Elle se calcule à CHAQUE RENDU, sur ce que la saisie et la file savent
 * déjà : rien ne se retient d'un rendu au suivant.
 *
 * POURQUOI LE RENVOI. `pasCompte` ne voit que ce qui n'est pas enregistré
 * MAINTENANT : « Réessayer » remet l'écriture « en cours », la phrase « pas
 * compté » se tait — et la ligne tombait de 110 à 74 points à 393 avant de
 * remonter, la rangée qu'on venait de toucher bougeant sous le doigt
 * (relecture 5, RELIRE4-C). Un renvoi en route compte donc comme ce qui
 * n'est pas compté : échec → « Réessayer » → échec, la place ne bouge pas.
 *
 * POURQUOI PLUS DE MÉMOIRE. La relecture 5 gardait la place jusqu'au RETOUR
 * d'une liste neuve (une mémoire tenue par la saisie). Or rien ne relit la
 * liste quand ce qui n'était pas compté disparaît SANS écriture — une ligne
 * jamais envoyée qu'on retire, une valeur remise à celle de la base, un champ
 * de l'en-tête rétabli : la place restait réservée, puis se rendait au retour
 * d'une liste SANS RAPPORT, sous le doigt (le champ « Délai d'exécution »
 * qu'on venait de quitter montait de 36 points ; relecture 6, RELIRE5-R1).
 * Sans mémoire, elle se rend AU GESTE, comme avant le 07/11, et aucune liste
 * qui revient ensuite ne la fait plus bouger.
 *
 * LES SAUTS QUI RESTENT, et c'est tout — ils sont HORS de la décision D-A bis
 * (« plus rien ne bouge », TANT QUE quelque chose n'est pas compté), parce
 * qu'ils sont le passage même de « tout compté » à « quelque chose n'est pas
 * compté », et le retour :
 *   - DEVENIR « pas compté » (une ligne laissée incomplète ou refusée, une
 *     écriture qui échoue, un champ refusé) : la place se RÉSERVE (74 → 110
 *     points à 393 en haut, 128 à 320) ;
 *   - CESSER de l'être : la place se REND (110 → 74) — AU GESTE quand rien ne
 *     part (la ligne retirée, la valeur remise, le champ rétabli) ou quand une
 *     nouvelle écriture part (la ligne complétée, le champ corrigé — une
 *     VRAIE correction, qui change une valeur) ; QUAND L'ENTRÉE RENVOYÉE
 *     QUITTE « EN COURS » (« Réessayer », le renvoi du plafond, ou la même
 *     écriture renvoyée par une autre porte) — à la réussite du renvoi, ou à
 *     la fin de ce qui a été voulu PENDANT son vol (une correction ou un
 *     retrait faits pendant le renvoi : la marque les suit, et une
 *     correction qui échoue ne fait aucun rebond ; relecture 7, RELIRE6-3) ;
 *   - un brouillon « pas encore en base » qui y ENTRE avec une ligne
 *     incomplète saute une fois à la place réservée (rien n'est réservé tant
 *     qu'il n'est pas en base : il n'a pas de liste).
 * Rien d'autre ne la change : ni l'état de la liste (en route, lecture,
 * échec, OP027, la relecture qui suit « Mon entreprise »), ni ses nombres, ni
 * sa phrase, ni le retour d'une liste, ni une carte ou une feuille ouverte
 * par-dessus. Et une écriture renvoyée TELLE QUELLE après un échec, par
 * quelque porte que ce soit, n'est pas une « nouvelle écriture » : c'est un
 * renvoi (relecture 7, RELIRE6-1).
 */
export function garderLaPlace({ enBase = false, pasCompte = null, renvoi = false } = {}) {
  return !!enBase && (!!pasCompte || renvoi === true);
}

/**
 * CE QUE DIT LA LIGNE (en haut et en bas) : `{ contenu, compte, gabarits,
 * action, aDire }`.
 *   `contenu`  : la phrase (ou le compte, quand tout est compté) ;
 *   `compte`   : le DÉCOMPTE affiché SOUS la phrase, ou `null` ;
 *   `gabarits` : `GABARITS_DE_LA_LIGNE` quand `garderLaPlace` le dit — sur
 *                un devis en base, quelque chose n'est pas compté, ou une
 *                écriture renvoyée après un échec est en route (`renvoi`) —
 *                ils donnent la hauteur de la ligne, le plus grand ; posés
 *                invisibles dans son flux, le texte lu par-dessus —, sinon
 *                `null` : la ligne réserve alors ses deux lignes ordinaires ;
 *   `action`   : `'ouvrir'` (la carte), `'reessayer'` (relire) ou `null` (pas
 *                une cible : il n'y a rien à ouvrir) ;
 *   `aDire`    : l'étiquette pour VoiceOver.
 *
 * QUAND QUELQUE CHOSE N'EST PAS COMPTÉ, sur un devis EN BASE (`pasCompte`,
 * état `liste`) : la phrase ET le décompte de la dernière liste sûre —
 * DÉCISION D-A DU PROPRIÉTAIRE (05/11/2026 au soir, relecture ECR-4). Cet
 * état DURE (une ligne incomplète est l'état ordinaire d'un chiffrage en
 * cours), et le compte disparaissait de l'écran pendant tout ce temps.
 *
 * …ET LA PLACE NE DÉPEND NI DE L'ÉTAT, NI DES NOMBRES, NI DE LA PHRASE
 * (relecture 2 de 2b-1, REL-1 ; décision D-A bis du propriétaire, 06/11/2026 ;
 * relecture 4, RELIRE3-1) : tant que `pasCompte` persiste sur un devis en
 * base — liste, en route, lecture, échec, la relecture qui suit « Mon
 * entreprise », première lecture comprise —, les gabarits sont la liste FIXE
 * `GABARITS_DE_LA_LIGNE`. Mesuré au navigateur de 320 à 440 points d'écran,
 * point par point : une seule hauteur par largeur dans tous ces états (450
 * cas par ligne), avec 0, 1, 2, 10, 100 et 508 points pour le devis, 0, 5 et
 * 21 pour l'entreprise, et les phrases de 1 à 500 lignes et de l'en-tête
 * (`mesure-devis`) ; et à 393, la vraie transition « 1 point » → « aucun
 * point » ne la fait pas bouger. ET UN RENVOI NE LA REND PAS (relecture 5,
 * RELIRE4-C ; règle sans mémoire de la relecture 6, `garderLaPlace`) :
 * « Réessayer » sur une ligne, sur l'en-tête ou sur un retrait en échec, le
 * renvoi automatique du plafond, et la même écriture renvoyée par une autre
 * porte (la carte d'une ligne en échec fermée sans rien changer, le reste
 * d'un refus partiel de l'en-tête ; relecture 7) — la phrase « pas compté »
 * se tait, mais la place reste réservée tant que l'écriture renvoyée est en
 * route (`renvoi`), ce qui a été voulu pendant son vol compris. Ce qui la
 * change encore, et c'est tout (les sauts nommés de `garderLaPlace`) : elle
 * se RÉSERVE quand quelque chose devient « pas compté » (une ligne laissée
 * incomplète ou refusée, une écriture qui échoue, un champ refusé : 74 → 110
 * points à 393 en haut) ; elle se REND
 * quand rien ne l'est plus — au geste (une ligne retirée, une valeur remise,
 * un champ rétabli ; une ligne complétée ou un champ corrigé qui partent),
 * ou quand une entrée renvoyée quitte « en cours » (à la réussite du renvoi,
 * ou à la fin de ce qui a été voulu pendant son vol) ; et un brouillon « pas
 * encore en base » qui y entre avec une ligne incomplète saute une fois à
 * la place réservée (sa phrase n'est pas la même, et il n'a pas de liste). Le retour
 * d'une liste, lui, ne la change jamais. Ce que la ligne DIT ne change pas
 * (D-A, ECR-1).
 *
 * EN `en_route`, LA PHRASE SEULE, à l'écran ET dans l'étiquette parlée
 * (`phraseEnRoute` : « Des changements partent : la liste sera à jour juste
 * après. », ou « Mise à jour de la liste… » pour la relecture qui suit « Mon
 * entreprise ») : le compte d'avant pourrait dire « ce devis — aucun point »
 * juste après qu'on a vidé le délai (relecture de 2b-1, ECR-1) — c'est le
 * défaut que la carte ne montre plus, VoiceOver ne doit pas le dire non plus.
 * Les gabarits, eux, ne se lisent ni ne se disent.
 *
 * Ce que la liste ne compte pas (`pasCompte`) passe devant le compte. Sur un
 * brouillon PAS ENCORE EN BASE, il dit que la liste se calculera ensuite
 * (`ceQueLaListeNeComptePas({ enBase: false })`, ECR-3) ; « Écrivez une
 * première ligne » reste pour le brouillon où rien n'est tapé. Aucun
 * gabarit : il n'y a aucune liste.
 */
export function texteDeLaLigneRemise({
  etat, lue = null, enLecture = false, erreurReessayable = true, erreurPhrase = null, pasCompte = null, relecture = null,
  renvoi = false,
} = {}) {
  let contenu;
  let compte = null;
  let action = 'ouvrir';
  let aDire = null;
  if (etat === 'pas_en_base') {
    contenu = pasCompte || LISTE_AVANT_LA_PREMIERE_LIGNE;
    action = null;
  } else if (etat === 'echec') {
    if (erreurReessayable) {
      contenu = LISTE_NON_LUE;
      action = 'reessayer';
      aDire = 'Liste de ce qu’il manque non lue. Réessayer';
    } else {
      contenu = erreurPhrase || LISTE_NON_LUE;
    }
  } else if (etat === 'lecture') {
    contenu = pasCompte || LISTE_EN_LECTURE;
  } else if (etat === 'en_route') {
    contenu = phraseEnRoute(relecture);
  } else if (pasCompte) {
    contenu = pasCompte;
    compte = lue ? phraseDesEndroits(lue) : null;
  } else {
    contenu = `${phraseDesEndroits(lue)}${enLecture ? MISE_A_JOUR_DE_LA_LIGNE : ''}`;
  }
  if (!aDire) {
    /* Une phrase qui finit déjà par un point, ou par « … », n'en reçoit pas
       un second. */
    const fin = (t) => (/[.…]$/.test(t) ? ' ' : '. ');
    let dit = contenu;
    if (compte) dit = `${dit}${fin(dit)}Dernière liste : ${compte}`;
    aDire = `${TITRE_POUR_REMETTRE} : ${action ? `${dit}${fin(dit)}Ouvrir la liste` : dit}`;
  }
  /* LES GABARITS (REL-1, D-A bis, RELIRE3-1) : la liste FIXE, quand
     `garderLaPlace` le dit — sans regarder ni la liste lue, ni les nombres,
     ni la phrase, ni l'état (hors « pas en base ») —, une seule écriture de
     la règle (relecture 6). */
  const gabarits = garderLaPlace({ enBase: etat !== 'pas_en_base', pasCompte, renvoi }) ? GABARITS_DE_LA_LIGNE : null;
  /* LE VERT (demande du propriétaire, 25/11/2026) : une seule écriture de
     la règle, `ligneRemisePrete`. */
  const pret = ligneRemisePrete({
    etat, lue, enLecture, pasCompte, renvoi,
  });
  return {
    contenu, compte, gabarits, action, aDire, pret,
  };
}

/**
 * LA LIGNE « POUR LE REMETTRE » PASSE AU VERT — demande du propriétaire, le
 * 25/11/2026 : « quand tout est ok c'est écrit ce devis 0 point votre
 * entreprise 0 point, c'est très bien, mais la case reste toujours en
 * orange ; on pourrait la faire passer en vert quand tout est ok, comme ça en
 * un coup d'œil on sait que c'est bon ».
 *
 * Vrai SI ET SEULEMENT SI la ligne affiche, à cet instant, un compte SÛR de
 * zéro point partout :
 *   - l'état est `liste` — une liste LUE, rien en route (une écriture du
 *     devis, un champ tapé, la relecture qui suit « Mon entreprise » sont
 *     `en_route`), pas un échec, pas une première lecture, pas un brouillon
 *     hors de la base ;
 *   - aucune relecture n'est en cours (`enLecture`) : la ligne dit alors
 *     « · mise à jour… », et le vert attend son retour ;
 *   - rien n'est « pas compté » (`pasCompte`) : une ligne non enregistrée
 *     n'est pas jugée par la base ;
 *   - aucune écriture renvoyée après un échec n'est en route (`renvoi`) ;
 *   - la liste lue porte un TOTAL entier, et il vaut 0 : aucun point du
 *     devis, de l'entreprise, ni des mentions dues à un particulier — une
 *     clé que l'écran ne connaît pas compte aussi (`lireMotifsDeRemise` range
 *     tout motif dans une partie). Une liste sans `total` lisible n'est
 *     JAMAIS verte : la règle se ferme quand elle doute.
 * Sinon, l'orange de lecture, comme avant. Une valeur douteuse (un `renvoi`
 * ou un `enLecture` qui ne vaut pas `false`) ÉTEINT le vert : il ne s'allume
 * que sur ce qui est sûr.
 *
 * CE QUE LE VERT NE DIT PAS : que le devis est « conforme ». Il dit ce que
 * dit le texte de la ligne — aucun point de ce qu'Opus vérifie aujourd'hui —,
 * et la carte garde « Pas encore vérifié : … » sous « rien ne manque ». Les
 * AVIS (« À vérifier ») ne l'éteignent pas : ils ne bloquent jamais la
 * remise. Et la couleur ne porte pas l'information seule : le texte dit
 * « aucun point », et une coche se pose devant le titre (on distingue mal
 * l'orange du vert quand on voit mal le rouge et le vert).
 */
export function ligneRemisePrete({
  etat, lue = null, enLecture = false, pasCompte = null, renvoi = false,
} = {}) {
  if (etat !== 'liste' || !!enLecture || !!pasCompte || !!renvoi) return false;
  if (!lue || typeof lue !== 'object' || !Number.isSafeInteger(lue.total)) return false;
  return lue.total === 0;
}

/**
 * CE QUE DIT LA CARTE, au-dessus des parties et à leur place :
 * `{ phrases, montrerLaListe, parties: { devis, entreprise } }`.
 *   `phrases` : `[{ texte, ton }]`, dans l'ordre — `ton` vaut `'etat'` (une
 *               phrase d'état), `'aide'` (discrète) ou `'erreur'` ;
 *   `montrerLaListe` : quelque chose de la dernière liste sûre s'affiche —
 *               en `liste` et en `en_route`, jamais sur un échec, ni avant
 *               la première lecture, ni sur un brouillon pas en base ;
 *   `parties.devis`, `parties.entreprise` : `{ montrer, phrase, garder }` —
 *               la partie se lit (`montrer`), ou cette `phrase` se lit à sa
 *               place ; `garder` : la partie de la dernière liste sûre reste
 *               MONTÉE, INVISIBLE et cachée à VoiceOver, sous la phrase, pour
 *               garder sa place. `entreprise` porte aussi les mentions dues à
 *               un particulier.
 *
 * UNE PARTIE PÉRIMÉE NE SE LIT PAS (relecture de 2b-1, ECR-1) :
 *   - en `en_route` (une écriture du devis part, ou la lecture qui la
 *     suit), « Ce devis » cède la place à « Ce devis : la liste se met à
 *     jour. » — ni ses points, ni leurs boutons, ni « rien ne manque » ;
 *     « Votre entreprise » reste : une écriture du devis ne la change pas ;
 *   - pendant la relecture qui suit « Mon entreprise » (`relecture.entreprise`,
 *     un temps `en_route` lui aussi), les DEUX se taisent : « Votre
 *     entreprise » (et les mentions dues à un particulier) cède la place à
 *     « Votre entreprise : la liste se met à jour. », et « Ce devis » à sa
 *     phrase — le régime de TVA, qui s'écrit dans « Mon entreprise », décide
 *     de ses points (relecture 2 de 2b-1, REL-2 ; depuis le 06/11/2026,
 *     relecture 4, cette relecture lit toujours les deux causes).
 *
 * MAIS ELLE GARDE SA PLACE (relecture 2 de 2b-1, REL-3) : quand une liste
 * sûre existe (`montrerLaListe`), la partie périmée reste montée, invisible
 * (`garder`), et sa phrase est posée par-dessus. Avant, la partie était
 * RETIRÉE : tout ce qui la suivait remontait puis redescendait au retour de
 * la liste — le premier bouton de « Votre entreprise » passait de y = 400 à
 * y = 470 au moment où l'on pouvait appuyer dessus (mesuré au navigateur,
 * liste revenue IDENTIQUE). Jamais estompée : elle montrerait des points
 * périmés (ECR-1). Sans liste sûre, rien n'est monté : il n'y a rien à
 * garder. Quand la liste revient VRAIMENT différente, ce qui suit bouge
 * encore d'autant : c'est un vrai changement, il ne se corrige pas.
 *
 * LA PHRASE D'UN TEMPS « EN ROUTE » N'EST EN TÊTE QUE SANS LISTE À MONTRER
 * (REL-3, le même mouvement) : avec une liste, ce sont les phrases posées À
 * LA PLACE des parties qui le disent. Une phrase d'en-tête qui paraissait
 * puis disparaissait au retour de la liste faisait remonter tout ce qui la
 * suit de sa hauteur. Sans liste (un échec avant, puis une écriture ou un
 * retour de « Mon entreprise »), elle reste en tête (`phraseEnRoute`) :
 * c'est la seule chose à dire.
 *
 * L'échec lui-même (« Réessayer », la phrase de l'erreur) est dessiné par la
 * carte : ce n'est pas une phrase, c'est un bouton.
 */
export function ceQueDitLaCarte({
  etat, lue = null, enLecture = false, pasCompte = null, relecture = null,
} = {}) {
  const relitEntreprise = !!(relecture && relecture.entreprise);
  const montrerLaListe = !!lue && (etat === 'liste' || etat === 'en_route');
  const phrases = [];
  if (etat === 'pas_en_base') phrases.push({ texte: pasCompte || LISTE_AVANT_LA_PREMIERE_LIGNE, ton: 'etat' });
  else if (etat === 'lecture') phrases.push({ texte: LISTE_EN_LECTURE, ton: 'etat' });
  else if (etat === 'en_route' && !montrerLaListe) phrases.push({ texte: phraseEnRoute(relecture), ton: 'etat' });
  else if (etat === 'liste' && enLecture) phrases.push({ texte: LISTE_MISE_A_JOUR, ton: 'aide' });
  if (pasCompte && etat !== 'pas_en_base') phrases.push({ texte: pasCompte, ton: 'etat' });
  const partie = (perimee, phrase) => {
    if (!montrerLaListe) return { montrer: false, phrase: null, garder: false };
    return perimee ? { montrer: false, phrase, garder: true } : { montrer: true, phrase: null, garder: false };
  };
  return {
    phrases,
    montrerLaListe,
    parties: {
      devis: partie(etat === 'en_route', CE_DEVIS_SE_MET_A_JOUR),
      entreprise: partie(relitEntreprise, ENTREPRISE_SE_MET_A_JOUR),
    },
  };
}

/**
 * LA PREMIÈRE PHRASE d'un texte long, et s'il en reste : `{ debut, suite }`.
 * Une phrase finit sur « . », « ! » ou « ? » suivi d'un blanc et d'une
 * MAJUSCULE (ou d'un guillemet ouvrant) — jamais sur « L. 111-1 » ni
 * « R. 123-237 » (un chiffre suit), ni sur une initiale seule. Un texte
 * court se montre en entier : on ne coupe pas une phrase de 150 caractères
 * pour économiser deux lignes.
 */
export const SEUIL_LIRE_LA_SUITE = 200;
export function premierePhrase(texte) {
  const t = texte == null ? '' : String(texte);
  if (t.length <= SEUIL_LIRE_LA_SUITE) return { debut: t, suite: false };
  const re = /[.!?](?=\s+[«A-ZÀ-ÖØ-Þ])/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    const avant = t.slice(Math.max(0, m.index - 2), m.index);
    /* Une initiale seule (« M. », « L. ») n'est pas une fin de phrase. */
    if (/(^|\s)[A-ZÀ-ÖØ-Þ]$/.test(avant)) continue;
    const debut = t.slice(0, m.index + 1);
    if (t.slice(m.index + 1).trim()) return { debut, suite: true };
    break;
  }
  return { debut: t, suite: false };
}

/**
 * LES NOMS DES SECTIONS DE « MON ENTREPRISE », tels que leurs titres les
 * écrivent (`<Section ancre="…" titre="…">` dans `FicheEmetteur.js` ; le
 * bloc d'identité, `entreprise`, s'intitule « Votre entreprise » dans
 * `IdentiteEntreprise.js`). Ils servent l'étiquette parlée d'un bouton
 * « Compléter dans « Mon entreprise » » (relecture de 2b-1, ECR-5 : les cinq
 * points de l'entreprise portaient la MÊME étiquette, et au rotor
 * « Boutons » rien ne disait lequel corrige quoi). Une COPIE, parce que ce
 * fichier n'importe pas les écrans : `verifier-devis` la compare aux titres
 * des deux fichiers, et refuse qu'elle diverge.
 */
export const NOM_DES_SECTIONS = Object.freeze({
  entreprise: 'Votre entreprise',
  identite: 'Votre nom sur le devis',
  immatriculation: 'Où votre entreprise est immatriculée',
  capital: 'Capital social',
  adresses: 'Adresses',
  contact: 'Pour vous joindre',
  tva: 'TVA',
  assurances: 'Assurances',
  /* 2b-5 : la section des lieux de dépôt des déchets — la porte « Mes lieux
     de dépôt » de la carte « Déchets » y mène (`ouvrirMonEntreprise('lieux')`). */
  lieux: 'Vos lieux de dépôt des déchets',
  /* 2b-6 : les deux sections nouvelles de « Mon entreprise », après les
     lieux — les portes « Mes signes de qualité » et « Mes sous-traitants » de
     la carte « Énergie et label RGE » y mènent. */
  labels: 'Vos signes de qualité (label RGE)',
  sousTraitants: 'Vos sous-traitants',
  mediateur: 'Médiateur de la consommation',
  garanties: 'Garanties',
  conditions: 'Vos conditions',
  frais: 'Vos tarifs',
  affiche: 'Afficher mes tarifs',
});

/**
 * LE CHAMP VISÉ, quand plusieurs motifs mènent à la MÊME section de « Mon
 * entreprise » (relecture de 2b-1, ECR-5, mesuré au navigateur le 05/11 :
 * « Vos conditions » revenait deux fois dans la liste du « Muret de
 * clôture », pour les modalités de paiement et pour les réclamations). Le
 * nom du champ tel que son libellé l'écrit à l'écran, en minuscule après la
 * virgule — « Compléter dans « Mon entreprise » : Vos conditions, modalités
 * de paiement ». Les deux paires d'adresses (`adresse_etablissement` et
 * `conso_adresse_etablissement`, `adresse_siege` et `conso_adresse_siege`)
 * mènent au même champ, et `emetteur.js` ne les rend jamais ensemble : même
 * étiquette, et c'est juste. Une section qu'un seul motif vise (le capital,
 * la TVA, le médiateur…) n'en a pas besoin. `verifier-devis` exige qu'aucun
 * motif de l'entreprise ne partage son étiquette avec un autre, hors de ces
 * deux paires.
 */
export const CHAMP_DU_MOTIF = Object.freeze({
  entreprise: 'la rattacher',
  identite: 'nom légal',
  entreprise_ancienne: '« Mettre à jour »',
  conso_tva_intra: 'n° de TVA intracommunautaire',
  adresse_etablissement: 'adresse de votre établissement',
  conso_adresse_etablissement: 'adresse de votre établissement',
  adresse_siege: 'adresse du siège',
  conso_adresse_siege: 'adresse du siège',
  conso_telephone: 'téléphone',
  conso_email: 'e-mail',
  conso_modalites_paiement: 'modalités de paiement',
  conso_modalites_execution: 'modalités d’exécution',
  conso_reclamations: 'réclamations',
});

/**
 * L'ACTION D'UN POINT — `{ libelle, aDire }`, ou `null` quand l'écran ne
 * sait mener nulle part (une clé inconnue, la profession réglementée, ou un
 * poste à ajouter alors que le régime de TVA ne permet pas encore de
 * chiffrer). `ligneExiste` : la ligne fautive est-elle à l'écran ? Sinon,
 * aucune cible : ouvrir une carte sur une ligne absente montrerait un écran
 * vide. `designation` : celle de la ligne fautive, pour l'étiquette parlée.
 *
 * `aDire` (relecture de 2b-1, ECR-5) : l'étiquette pour VoiceOver. Deux
 * boutons qui mènent à deux endroits ne portent jamais la même : le libellé,
 * plus le NOM de la section visée de « Mon entreprise » (« Compléter dans
 * « Mon entreprise » : Capital social »), plus le CHAMP quand la section en
 * porte plusieurs (`CHAMP_DU_MOTIF`), ou la ligne visée. Elle COMMENCE
 * par le libellé affiché : qui dit à voix haute ce qu'il voit doit être
 * compris (Contrôle vocal). Jamais la phrase entière du point — celle de la
 * TVA fait 672 caractères. Les deux corrections des conditions, elles,
 * disent leur champ À L'ÉCRAN aussi : « Corriger l’acompte », « Corriger la
 * réduction ».
 */
export function actionDuPoint(point, { chiffrerPossible = false, ligneExiste = () => false, designation = null } = {}) {
  const e = point && point.endroit;
  if (!e) return null;
  const seul = (libelle) => ({ libelle, aDire: libelle });
  switch (e.endroit) {
    case 'client': return seul('Choisir le client');
    case 'pour_qui': return { libelle: 'Répondre', aDire: 'Répondre : à quel titre ce client commande' };
    case 'lignes': return chiffrerPossible ? seul('Ajouter un poste') : null;
    case 'ligne':
      if (!ligneExiste(e.ligneId)) return null;
      return { libelle: 'Ouvrir cette ligne', aDire: designation ? `Ouvrir cette ligne : « ${designation} »` : 'Ouvrir cette ligne' };
    case 'lieu': return seul('Écrire le lieu');
    case 'delai': return seul('Écrire le délai');
    case 'conditions':
      if (e.champ === 'validite') return seul('Choisir la validité');
      if (e.champ === 'nature') return seul('Choisir : acompte ou arrhes');
      if (e.champ === 'acompte') return seul('Corriger l’acompte');
      if (e.champ === 'reduction') return seul('Corriger la réduction');
      if (e.champ === 'echeance') return seul('Choisir le moment du paiement');
      /* 2b-4 : « le devis lui-même » est dans le POINT ; le bouton dit le
         geste, en 33 caractères (annexe A.1). */
      if (e.champ === 'cout') return seul('Choisir : devis gratuit ou payant');
      return seul('Corriger dans les conditions');
    /* 2b-5 (annexe A.1) : un seul bouton, pour les deux clés du rang 13 ;
       ce qu'il ouvre, `rubriqueDuPoint` le dit. */
    case 'dechets': return seul(LES_DECHETS.bouton);
    /* 2b-6 (annexe A.1) : un seul bouton, pour les trois clés du rang 14 ;
       ce qu'il ouvre, `rubriqueDeLEnergieDuPoint` le dit. */
    case 'energie': return seul(LE_LABEL.bouton);
    case 'entreprise': {
      if (!e.section) return null;
      const libelle = 'Compléter dans « Mon entreprise »';
      const nom = aLaCle(NOM_DES_SECTIONS, e.section) ? NOM_DES_SECTIONS[e.section] : null;
      const champ = point && aLaCle(CHAMP_DU_MOTIF, point.cle) ? CHAMP_DU_MOTIF[point.cle] : null;
      if (!nom) return { libelle, aDire: libelle };
      return { libelle, aDire: champ ? `${libelle} : ${nom}, ${champ}` : `${libelle} : ${nom}` };
    }
    default: return null;
  }
}

/** Le libellé du second bouton d'un point `aussi: 'chantier'` (2b-2). */
export const REVOIR_LE_CHANTIER = 'Revoir « Le chantier »';
/** Le libellé du second bouton de la décennale sans réponse (2b-3). */
export const REPONDRE_DANS_LE_CHANTIER = 'Répondre dans « Le chantier »';

/**
 * LA QUESTION DE « LE CHANTIER » sur laquelle le second bouton d'un point
 * ouvre la carte (2b-3, E-I1, E-I4) — écrite UNE fois : la ligne à taux
 * réduit d'un chantier neuf, la question TVA (`q2`) ; la décennale sans
 * réponse, la question de la décennale (`q3`).
 */
export const QUESTION_DU_CHANTIER = Object.freeze({
  devis_taux_reduit_neuf: 'q2',
  devis_decennale: 'q3',
});

/**
 * LE SECOND BOUTON D'UN POINT (2b-2, cahier §3.1 et §3.6 ; 2b-3) — `{
 * libelle, aDire, endroit, question }`, ou `null`. Deux motifs en portent,
 * et c'est leur CLÉ qui dit lequel :
 *   - la ligne à taux réduit d'un chantier qui crée un bâtiment neuf, qu'on
 *     corrige sur la ligne (« Ouvrir cette ligne ») OU dans la carte « Le
 *     chantier », si la réponse était fausse : « Revoir « Le chantier » »,
 *     sur la question TVA ;
 *   - la décennale sans réponse, qu'on règle en joignant l'attestation (le
 *     premier bouton) OU en répondant « Non » : « Répondre dans « Le
 *     chantier » », sur la question de la décennale.
 * Il existe même quand la ligne n'est pas à l'écran : la carte, elle, est
 * toujours là. Un point `aussi: 'chantier'` d'une clé inconnue garde le
 * libellé de 2b-2, sans question.
 */
export function secondeActionDuPoint(point) {
  const e = point && point.endroit;
  if (!e || e.aussi !== 'chantier') return null;
  const cle = point && typeof point.cle === 'string' ? point.cle : null;
  const question = aLaCle(QUESTION_DU_CHANTIER, cle) ? QUESTION_DU_CHANTIER[cle] : null;
  const libelle = cle === 'devis_decennale' ? REPONDRE_DANS_LE_CHANTIER : REVOIR_LE_CHANTIER;
  return { libelle, aDire: libelle, endroit: 'chantier', question };
}

/**
 * L'aide sous un taux de 10 % ou de 5,5 % (réponse 3 du propriétaire, le
 * 05/11 : « tout permettre ») : le client certifiera, SUR le devis, que les
 * conditions du taux réduit sont remplies (CGI 279-0 bis 3 et 278-0 bis A
 * IV) ; Opus imprimera cette certification, avec la place de signer, à la
 * remise (2c). Aucun motif ne bloque un taux réduit.
 *
 * RÉÉCRITE LE 05/11/2026 (relecture de 2b-1, TXT-3) : elle ne nommait que
 * « le logement a plus de deux ans ». À 10 %, le client certifie aussi que
 * les travaux ne créent pas un immeuble neuf et n'agrandissent pas la
 * surface de plus de 10 % (279-0 bis 2 et 3) ; à 5,5 %, des travaux de
 * rénovation énergétique (278-0 bis A I). Un artisan pouvait en déduire le
 * 10 % pour une extension. Et « Opus imprimera cette phrase » engageait le
 * texte de 2c : c'est « la certification prévue par la loi ». Le texte est à
 * soumettre au juriste (cahier §8) ; le CIBS (2027) n'a pas été lu.
 * Les espaces entre un nombre et « % » sont INSÉCABLES, comme toutes les
 * aides de ce fichier qui écrivent un pourcentage : « 10 » ne doit pas
 * finir une ligne et « % » commencer la suivante.
 */
export const AIDE_TAUX_REDUIT = 'À 10\u00a0% ou 5,5\u00a0%, le client devra certifier sur le devis que les conditions du '
  + 'taux réduit sont remplies : un logement achevé depuis plus de deux ans, des travaux qui ne créent pas un immeuble '
  + 'neuf et n’agrandissent pas la surface de plus de 10\u00a0% ; à 5,5\u00a0%, des travaux de rénovation énergétique. '
  + 'Opus imprimera la certification prévue par la loi, avec la place de signer.';

/* ================================================================== */
/*  « À QUEL TITRE ? » ET « LE CHANTIER » (lot 2b-2, cahier §3.4-§3.5)  */
/* ================================================================== */
/*
 * Ce que l'écran DIT de la réponse « à quel titre » et du chantier, et ce
 * qu'il décide — des fonctions PURES, ici et pas dans `EnteteDevis.js` ni dans
 * la carte : `node` les fait tourner (`verifier-devis`, `mesure-devis`), la
 * leçon de `cloudinary-adresses.js`. Les textes sont ceux des annexes A.3 et
 * A.4 du cahier 2b-2, mot pour mot ; « 5 salariés », « 14 jours »,
 * « 150 000 € » et « 10 % » portent des espaces insécables.
 *
 * DEUX RÈGLES, et aucune n'est cosmétique :
 *   - RIEN N'EST JAMAIS ÉCRIT SANS APPUI. Une fiche « particulier » PROPOSE
 *     « à titre privé » ; la réponse ne part que sur « Oui, à titre privé »
 *     (décision du 09/11 : Opus propose, l'artisan confirme). Le type de la
 *     fiche ne choisit que la PHRASE de la proposition ;
 *   - UN BOUTON QUI ÉCRIT N'APPARAÎT JAMAIS LÀ OÙ ÉTAIT UN BOUTON QUI N'ÉCRIT
 *     PAS : la moitié gauche n'écrit jamais (« Répondre », « Autre réponse »,
 *     « Changer » ouvrent la même feuille) ; seule la moitié droite écrit, et
 *     seulement dans la proposition. Un appui visé sur « Répondre » au moment
 *     où le type de la fiche arrive tombe sur « Autre réponse », qui ouvre la
 *     même feuille (critique écran E-I1).
 */

/** Les textes du bloc « À quel titre ? » (annexe A.3). */
export const A_QUEL_TITRE = Object.freeze({
  sousTitre: 'À quel titre ?',
  question: 'À quel titre ce client commande-t-il ?',
  proposition: 'Au carnet : particulier. Commande-t-il à titre privé ?',
  prefixeReponse: 'Commande : ',
  repondre: 'Répondre',
  autreReponse: 'Autre réponse',
  ouiATitrePrive: 'Oui, à titre privé',
  changer: 'Changer',
  titreFeuille: 'À quel titre ce client commande-t-il ?',
});

/** Ce qui suit un résumé dont l'écriture est en route, ou a échoué (§3.8). */
export const SUFFIXE_EN_ROUTE = ' — enregistrement…';
export const SUFFIXE_EN_ECHEC = ' — pas enregistré';

/**
 * LES QUATRE RANGÉES DE LA FEUILLE, dans l'ORDRE PROTECTEUR (annexe A.3 ;
 * critique droit B3, écran E-I9) : celle qui RETIRE des mentions dues à un
 * particulier vient en DERNIER, avec « Dans le doute, choisissez une autre
 * réponse : c’est la plus sûre. ». `resume` suit « Commande : ».
 */
export const REPONSES_A_QUEL_TITRE = Object.freeze([
  /* 2b-6 (T27, annexe A.9 ; DROIT-19) : une aide, parce qu'un artisan ou un
     commerçant qui fait faire des travaux CHEZ LUI commande à titre privé —
     sans elle, il se rangerait « pour son entreprise », et la question des
     travaux d'énergie ne lui serait jamais posée. */
  Object.freeze({
    valeur: 'consommateur',
    rangee: 'À titre privé, pour lui-même',
    aide: 'Y compris un artisan ou un commerçant pour son propre logement.',
    resume: 'à titre privé',
  }),
  Object.freeze({
    valeur: 'non_professionnel',
    rangee: 'Pour une association, une copropriété ou une société civile',
    aide: 'Sans activité professionnelle : une SCI familiale, un syndicat de copropriétaires (même représenté par un '
      + 'syndic professionnel), une association. Opus leur compte, par prudence, les mentions dues à un particulier.',
    resume: 'pour une association, une copropriété ou une société civile',
  }),
  Object.freeze({
    valeur: 'professionnel_hors_activite',
    rangee: 'Pour son entreprise de 5\u00a0salariés au plus, hors de son activité principale',
    /* 2b-6 (T27, annexe A.9 ; DROIT-8) : « sauf celles du label RGE » — la
       section où vit L. 224-114 n'est pas de celles que L. 221-3 étend à
       une petite entreprise hors de son activité principale ; sans ces
       mots, l'aide dirait « toutes les mentions », faux dès 2b-6. */
    aide: 'Par exemple, une boulangerie qui fait refaire sa vitrine. Quand le devis est signé hors de vos locaux, la loi '
      + 'la protège comme un particulier (sauf pour un bâtiment neuf ou une transformation importante) ; Opus lui '
      + 'compte, par prudence, les mentions dues à un particulier, sauf celles du label RGE, que la loi ne lui étend pas.',
    resume: 'pour son entreprise (5\u00a0salariés au plus), hors de son activité principale',
  }),
  Object.freeze({
    valeur: 'professionnel',
    rangee: 'Pour son entreprise, dans son activité principale, ou une entreprise de plus de 5\u00a0salariés',
    aide: 'Par exemple, un autre artisan qui vous sous-traite une partie de son chantier, ou un commerce de plus de '
      + '5\u00a0salariés. La plupart des mentions dues à un particulier ne sont alors plus comptées. Dans le doute, '
      + 'choisissez une autre réponse : c’est la plus sûre.',
    resume: 'pour son entreprise, dans son activité principale (ou plus de 5\u00a0salariés)',
  }),
]);

/** Le résumé d'une réponse (« à titre privé »…), ou `null` pour une réponse
 *  vide ou inconnue. */
export function resumeDeLaReponse(valeur) {
  const r = REPONSES_A_QUEL_TITRE.find((x) => x.valeur === valeur);
  return r ? r.resume : null;
}

/** Le suffixe d'un résumé selon l'état de son écriture : en route d'abord
 *  (elle part maintenant), puis en échec. */
export function suffixeDEtat({ enRoute = false, enEchec = false } = {}) {
  if (enRoute) return SUFFIXE_EN_ROUTE;
  if (enEchec) return SUFFIXE_EN_ECHEC;
  return '';
}

/** Les champs de l'en-tête qui font « à quel titre », et ceux du chantier :
 *  ce que `etatDesChampsDuDevis` regarde. */
export const CHAMPS_A_QUEL_TITRE = Object.freeze(['clientId', 'pourQui', 'pourQuiClient']);
export const CHAMPS_DU_CHANTIER = Object.freeze(['chantierNeufConso', 'chantierNeufTva', 'engageDecennale']);

/**
 * EN ROUTE, EN ÉCHEC — CALCULÉS À CHAQUE RENDU, JAMAIS MÉMORISÉS (cahier
 * §3.8, critique écran E-B2 : un état « en cours » gardé en mémoire survivait
 * à un échec). Depuis `file.entreesVoulues()`, l'entrée du devis, pour une
 * liste de champs :
 *   - en route ⇔ l'entrée part (`en_cours`) ET, pour un de ces champs, ce
 *     qui est voulu diffère de ce que la base a confirmé (ou la base n'a pas
 *     répondu : le champ est dans `inconnues`) ;
 *   - en échec ⇔ l'entrée est `echec` ET la même différence ;
 *   - `local` ⇔ le brouillon n'est pas encore en base (`locale`) ET la même
 *     différence : rien n'est parti, rien n'a échoué — l'écran le dit à sa
 *     façon (`ENTETE_PAS_ENCORE_ENREGISTRE`).
 * Une valeur `undefined` ne dit rien ; `null` et une valeur absente de la
 * base se valent.
 *
 * DEPUIS 2b-5, LA COMPARAISON EST `memeValeur` (T4) : les déchets triés, ce
 * qui reste sur le chantier et les lieux sont des LISTES, et une liste
 * revenue à sa valeur confirmée par un tableau NEUF n'est pas « en route ».
 * Avec `Object.is`, la rangée « Déchets » disait « — enregistrement… »
 * pendant qu'un AUTRE champ partait (mesuré, CTL-3) : la file, elle, ne
 * renvoyait rien des déchets. Les deux comparent de la même façon.
 */
export function etatDesChampsDuDevis(entrees, champs) {
  const e = (Array.isArray(entrees) ? entrees : []).find((x) => x && x.cle === 'devis');
  const rien = { enRoute: false, enEchec: false, local: false };
  if (!e || !e.voulu || !Array.isArray(champs)) return rien;
  const inconnues = Array.isArray(e.inconnues) ? e.inconnues : [];
  const differe = champs.some((c) => {
    if (inconnues.includes(c)) return true;
    const v = e.voulu[c];
    if (v === undefined) return false;
    const conf = e.confirme && e.confirme[c] !== undefined ? e.confirme[c] : null;
    return !memeValeur(v ?? null, conf ?? null);
  });
  if (!differe) return rien;
  return { enRoute: e.etat === 'en_cours', enEchec: e.etat === 'echec', local: e.etat === 'locale' };
}

/**
 * LE BLOC « À QUEL TITRE ? » — `{ etat, reponse, texte, gauche, droite }`, ou
 * `null` quand aucun client n'est choisi (le bloc n'existe pas). `devis` :
 * celui de l'ÉCRAN (ce qui est voulu, la file fusionnée) ; `client` : la fiche
 * jointe au devis (`{ nom, ville, type, siret }`), `devis.client` par défaut.
 *   - une réponse VALABLE : « Commande : » + son résumé (+ le suffixe
 *     d'état), « Changer » à gauche, rien à droite ;
 *   - pas de réponse, fiche LUE « particulier » : la proposition, « Autre
 *     réponse » à gauche, « Oui, à titre privé » à droite — le SEUL bouton
 *     qui écrit (`droite.pourQui`), et l'écran lit le client À L'INSTANT de
 *     l'appui, jamais celui de l'affichage (critique écran E-M8) ;
 *   - sinon (type pas lu, « entreprise », inconnu) : la question,
 *     « Répondre » à gauche, la moitié droite vide — sa place reste.
 * Les trois boutons de gauche ouvrent LA MÊME feuille.
 */
export function resumeAQuelTitre({ devis = null, client = undefined, enRoute = false, enEchec = false } = {}) {
  if (!devis || !present(devis.clientId)) return null;
  const valable = pourQuiValable(devis);
  const r = REPONSES_A_QUEL_TITRE.find((x) => x.valeur === valable) || null;
  if (r) {
    return {
      etat: 'reponse',
      reponse: r.valeur,
      texte: `${A_QUEL_TITRE.prefixeReponse}${r.resume}${suffixeDEtat({ enRoute, enEchec })}`,
      gauche: Object.freeze({ libelle: A_QUEL_TITRE.changer, ecrit: false }),
      droite: null,
    };
  }
  const fiche = client !== undefined ? client : (devis.client || null);
  const type = fiche && typeof fiche === 'object' ? fiche.type : null;
  if (type === 'particulier') {
    return {
      etat: 'proposition',
      reponse: null,
      texte: A_QUEL_TITRE.proposition,
      gauche: Object.freeze({ libelle: A_QUEL_TITRE.autreReponse, ecrit: false }),
      droite: Object.freeze({ libelle: A_QUEL_TITRE.ouiATitrePrive, ecrit: true, pourQui: 'consommateur' }),
    };
  }
  return {
    etat: 'question',
    reponse: null,
    texte: A_QUEL_TITRE.question,
    gauche: Object.freeze({ libelle: A_QUEL_TITRE.repondre, ecrit: false }),
    droite: null,
  };
}

/** TOUS les textes que le bloc peut afficher, suffixes compris : les
 *  GABARITS invisibles qui fixent sa hauteur (règle « garder la grande
 *  place », comme la ligne « Pour le remettre »). */
export const GABARITS_A_QUEL_TITRE = Object.freeze([
  A_QUEL_TITRE.question,
  A_QUEL_TITRE.proposition,
  ...REPONSES_A_QUEL_TITRE.flatMap((r) => [SUFFIXE_EN_ROUTE, SUFFIXE_EN_ECHEC, '']
    .map((suffixe) => `${A_QUEL_TITRE.prefixeReponse}${r.resume}${suffixe}`)),
]);

/* L'AMENDE QUE LA LOI PRÉVOIT (L. 242-5, L. 242-7) — écrite UNE fois, et
   lue par deux phrases de droit : la confirmation du chantier neuf (2b-2) et
   l'avertissement d'une ligne « réparation urgente » (2b-3). `devis.js`
   n'écrit jamais « € » lui-même ailleurs : un montant ne s'écrit qu'à UN
   endroit (`verifier-devis`, section 8) — et l'amende du code de la
   construction (`AMENDE_DU_CODE_DE_LA_CONSTRUCTION`), écrite une fois elle
   aussi.
   COMPLÉTÉE LE 13/11 (décision R3 du propriétaire, « Oui, compléter » ;
   relecture droit P5) : elle disait moins que la loi. L. 242-8 ajoute
   l'interdiction d'exercer (jusqu'à cinq ans pour une personne) et, pour
   une société, l'amende de l'article 131-38 du code pénal (le quintuple —
   cet article n'est pas recopié dans le dump local) et les peines de
   131-39 : d'où « bien plus pour une société, et une interdiction
   d'exercer », sans chiffre que les textes recopiés ne donnent pas. Les
   deux phrases qui la lisent changent donc avec elle. */
const AMENDE_DE_LA_LOI = 'deux ans d’emprisonnement et 150\u00a0000\u00a0€ d’amende, bien plus pour une société, et une interdiction d’exercer.';

/* LA LIGNE « RÉPARATION URGENTE » (2b-3, réponse P2 du 12/11, annexe A.2) —
   un FAIT DE LIGNE posé par l'artisan, sur un poste seulement, jamais
   déduit de l'origine du devis (D4-c). Sources : L. 221-28 8° (pas de
   rétractation), L. 221-10 4° (le 8e jour), L. 221-20 (douze mois de plus),
   L. 221-25 al. 3 (« sans forcément » : DÉDUIT pour une ligne faussement
   urgente), L. 242-1, L. 242-7, L. 121-9 5° (« peut être » : l'infraction
   est d'ABUSER de la faiblesse). Au juriste (J10). Comparées par leur
   VALEUR (le modèle d'`AIDE_RETENUE`). */
export const LIBELLE_URGENCE = 'Réparation urgente expressément demandée par le client';
/** L'aide FIXE de l'interrupteur, sous son libellé. PRÉCISÉE LE 13/11
 *  (décision R2 du propriétaire, « Oui, préciser la phrase » ; relecture
 *  droit P3) : « le strict nécessaire d'un entretien ou d'une réparation
 *  urgents » pouvait se lire « toute la réparation ». La loi dit « pour
 *  répondre à l'urgence » (L. 221-28 8°, L. 221-10 4°), comme
 *  `ECHEANCE_ACOMPTE` (« nécessaires à l'urgence »). */
export const AIDE_URGENCE = 'Seulement le strict nécessaire pour répondre à l’urgence, dans un entretien ou une '
  + 'réparation que votre client vous a expressément demandés, chez lui : s’il commande à titre privé, il n’aura pas '
  + 'de droit de rétractation pour cette ligne.';
/** Sous la rangée, l'interrupteur ALLUMÉ seulement (et annoncée à VoiceOver
 *  à l'allumage) : la structure de la confirmation du chantier neuf,
 *  approuvée le 09/11. */
export const URGENCE_SI_ALLUMEE = 'Si ce n’est pas vraiment le cas, c’est vous qui prenez le risque : le client peut '
  + 'se rétracter jusqu’à douze mois de plus, sans forcément vous devoir les travaux déjà faits ; un paiement reçu '
  + 'avant le 8e jour permet d’annuler le contrat, et l’exiger ou le recevoir est puni jusqu’à ' + AMENDE_DE_LA_LOI
  + ' Profiter de l’urgence pour faire signer davantage peut être un abus de faiblesse (code de la consommation, '
  + 'L.\u00a0121-9).';
/** Au-dessus de l'interrupteur, quand le devis vient d'une demande
 *  d'urgence : FIXE, jamais une invitation à marquer. */
export const DEPUIS_UNE_URGENCE = 'Ce devis vient d’une demande d’urgence : ne marquez une ligne que si elle remplit '
  + 'les conditions ci-dessous, et seulement le strict nécessaire.';
/** Le détail d'une ligne marquée, dans la liste du devis (« · réparation
 *  urgente »). */
export const DETAIL_URGENCE = 'réparation urgente';
/* …et seule sur sa rangée, quand la ligne n'a pas encore de quantité (comme
   « Fourniture non comprise ») : écrite à part plutôt que capitalisée par
   l'écran — aucun écran de la base ne change la casse d'un texte
   (`verifier-postes`). */
export const DETAIL_URGENCE_SEUL = 'Réparation urgente';

/** Les textes de la rangée et de la carte « Le chantier » (annexe A.4 ;
 *  2b-3 : une TROISIÈME question, « Pour votre assurance », annexe A.3). */
export const LE_CHANTIER = Object.freeze({
  titre: 'Le chantier',
  introduction: 'Ces questions sont indépendantes : on peut répondre « Oui » à l’une et « Non » à une autre.',
  ordinaire: 'Chantier ordinaire',
  q1: Object.freeze({
    sousTitre: 'Pour les droits de votre client',
    question: 'Ce devis porte-t-il sur la construction d’un bâtiment neuf, ou sur la transformation importante d’un '
      + 'bâtiment existant ?',
    non: 'Non',
    oui: 'Oui',
    aide: 'Ces chantiers échappent aux règles du devis signé hors de vos locaux : 14\u00a0jours pour se rétracter, '
      + 'formulaire de rétractation, aucun paiement avant le 8e jour. Mais pour la construction d’un logement, le code '
      + 'de la construction peut laisser au client dix jours pour se rétracter et interdire tout paiement ou engagement '
      + 'de payer avant (art. '
      + 'L.\u00a0271-1 et L.\u00a0271-2). Une réparation, un entretien ou une rénovation '
      + 'ordinaire n’en font pas partie. Si vous ne faites qu’une partie des travaux d’un bâtiment neuf (l’électricité, '
      + 'la plomberie…), la loi ne dit pas clairement que votre devis en fait partie. Dans le doute, gardez « Non » : '
      + 'c’est le cas le plus sûr.',
  }),
  /* La feuille de confirmation du « Oui » à la première question (J7) :
     rien n'est écrit avant « Je confirme ». Sources : L. 221-2 12°,
     L. 221-10, L. 221-20, L. 242-1, L. 242-5, L. 242-7, L. 242-8 ; et,
     depuis le 13/11 (décision R1), le code de la construction, L. 271-1 et
     L. 271-2 : l'aide de la question et le premier paragraphe disaient
     moins que la loi (« ne laissera pas 14 jours », sans dire les dix jours
     qu'un logement à construire peut laisser au client). */
  confirmation: Object.freeze({
    titre: 'Bâtiment neuf ou transformation importante',
    paragraphes: Object.freeze([
      'Dans ce cas, le devis n’aura pas de formulaire de rétractation, ne laissera pas 14\u00a0jours au client pour '
        + 'changer d’avis, et la règle du 8e jour ne s’appliquera pas. Pour la construction d’un logement, le code de la '
        + 'construction peut toutefois laisser au client dix jours pour se rétracter, à compter du lendemain de la '
        + 'première présentation du contrat par lettre recommandée, et interdire tout paiement ou engagement de payer '
        + 'avant.',
      'Si ce n’est pas vraiment le cas, c’est vous qui prenez le risque : le client garde le droit de se rétracter '
        + 'pendant douze mois de plus ; un paiement reçu avant le 8e jour permet d’annuler le contrat ; et la loi punit '
        + 'ces manquements jusqu’à ' + AMENDE_DE_LA_LOI,
      'La loi ne définit pas la « transformation importante », et ne dit pas clairement qu’un devis pour une partie '
        + 'seulement des travaux d’un bâtiment neuf en fait partie. Dans le doute, gardez « Non ».',
    ]),
    garder: 'Garder « Non »',
    confirmer: 'Je confirme',
  }),
  q2: Object.freeze({
    sousTitre: 'Pour la TVA',
    question: 'Ces travaux font-ils partie d’un chantier qui crée un bâtiment neuf ?',
    nonParDefaut: 'Non (par défaut)',
    non: 'Non',
    oui: 'Oui',
    aide: 'C’est le cas si vos travaux font partie, même pour un seul corps d’état, d’un chantier qui construit un '
      + 'bâtiment ou le surélève, qui refait la majorité de ses fondations, de sa structure ou de ses façades (hors '
      + 'ravalement), ou la plus grande partie de chacun des éléments de son second œuvre, ou qui augmente sa surface '
      + 'de plancher de plus de 10\u00a0% — en comptant tous les travaux faits sur deux ans, par vous ou par d’autres. '
      + 'La TVA est alors au taux normal. Ce sont les travaux qui comptent, pas l’âge du bâtiment — mais le taux réduit '
      + 'demande, en plus, un logement achevé depuis plus de deux ans.',
  }),
  /* 2b-3 (réponse P1 du 12/11 : « A ») — UNE question par devis. Vide =
     « Oui », par prudence (la pastille le dit : « Oui (par défaut) ») ;
     « Non » à gauche, comme les deux autres. Sources : C. civ. 1792,
     1792-1 1°, 1792-2 ; C. assur. L. 243-2 al. 2 ; L. 243-1-1 I. « Non » :
     lecture étroite (J1) ; « même sur un bâtiment existant » (J4) ; la
     sous-traitance (J3). */
  q3: Object.freeze({
    sousTitre: 'Pour votre assurance',
    question: 'Ces travaux peuvent-ils engager votre garantie décennale ?',
    non: 'Non',
    ouiParDefaut: 'Oui (par défaut)',
    oui: 'Oui',
    aide: '« Oui » si ces travaux construisent ou refont un ouvrage, ou un élément qui fait corps avec lui — un mur, '
      + 'une dalle, une charpente, une toiture… —, même sur un bâtiment existant : la loi demande alors de joindre votre '
      + 'attestation décennale au devis, et pas seulement pour un particulier (code des assurances, L.\u00a0243-2). '
      + '« Non » pour un dépannage ou un entretien qui ne crée ni ne refait aucun ouvrage. En sous-traitance, ou pour '
      + 'certains ouvrages que la loi exclut (voirie, réseaux…), elle ne la demande peut-être pas. Dans le doute, gardez '
      + '« Oui » : c’est le cas le plus sûr.',
  }),
});

/**
 * QUELLES QUESTIONS DU CHANTIER SONT MONTRÉES (cahier §3.5 ; critique écran
 * E-M2 ; 2b-3) — `{ q1, q2, q3, rangee }` :
 *   - la première, sauf quand la réponse « à quel titre » DE L'ÉCRAN est
 *     `professionnel` : elle est alors sans objet (sa valeur gardée n'a aucun
 *     effet sur la liste) ;
 *   - la seconde, quand le régime de TVA LU est le réel, OU quand sa valeur
 *     est vraie — on ne renvoie jamais vers une question invisible (le motif
 *     `devis_taux_reduit_neuf` dit « Le chantier »). Un régime pas lu
 *     (`null`) n'est jamais « non déclaré » : la question est cachée, sauf
 *     valeur vraie ;
 *   - la troisième (2b-3, la décennale), TOUJOURS : la loi demande
 *     l'attestation quel que soit le client (L. 243-2), et le rang 11 la lit
 *     pour tout devis ;
 *   - la rangée existe donc toujours.
 */
export function questionsDuChantier({ devis = null, regime = null } = {}) {
  const d = devis || {};
  const q1 = pourQuiValable(d) !== 'professionnel';
  const q2 = regime === 'reel' || d.chantierNeufTva === true;
  return { q1, q2, q3: true, rangee: true };
}

/**
 * LE RÉSUMÉ DE LA RANGÉE « LE CHANTIER » (annexe A.4), ou `null` quand la
 * rangée n'existe pas. La date du « Oui » est celle que la BASE a posée
 * (`chantierNeufConsoLe`) ; pas encore relue, la rangée se tait sur la date.
 * Une question cachée ne compte pas : sa valeur gardée n'a aucun effet.
 *
 * 2b-3 (annexe A.3) : la partie de la décennale vient APRÈS celle des deux
 * premières questions — vide : rien ; « Oui » : « ; décennale : oui » ;
 * « Non » : « ; décennale : non ». Quand la première ET la seconde sont
 * cachées (réponse `professionnel` en franchise), la rangée ne dit QUE la
 * décennale (M1 écran) : « Décennale : oui (par défaut) », « Décennale :
 * oui », « Décennale : non ». Puis le suffixe d'état.
 */
export function resumeDuChantier({ devis = null, regime = null, enRoute = false, enEchec = false } = {}) {
  const d = devis || {};
  const { q1, q2, rangee } = questionsDuChantier({ devis: d, regime });
  if (!rangee) return null;
  const suffixe = suffixeDEtat({ enRoute, enEchec });
  if (!q1 && !q2) {
    let seule = 'Décennale : oui (par défaut)';
    if (d.engageDecennale === true) seule = 'Décennale : oui';
    else if (d.engageDecennale === false) seule = 'Décennale : non';
    return `${seule}${suffixe}`;
  }
  const oui1 = q1 && d.chantierNeufConso === true;
  const oui2 = q2 && d.chantierNeufTva === true;
  const date = oui1 && d.chantierNeufConsoLe ? dateFrancaise(d.chantierNeufConsoLe) : null;
  const confirme = date ? `, confirmé le ${date}` : '';
  let texte = LE_CHANTIER.ordinaire;
  if (oui1 && oui2) texte = `Bâtiment neuf${confirme} ; taux normal de TVA`;
  else if (oui1) texte = `Bâtiment neuf ou transformation importante${confirme}`;
  else if (oui2) texte = 'Crée un bâtiment neuf : taux normal de TVA';
  let decennale = '';
  if (d.engageDecennale === true) decennale = ' ; décennale : oui';
  else if (d.engageDecennale === false) decennale = ' ; décennale : non';
  return `${texte}${decennale}${suffixe}`;
}

/** Le libellé du « Oui » de la première question, dans la carte :
 *  « Oui — confirmé le JJ/MM/AAAA » (la date de la base), « Oui —
 *  enregistrement… », « Oui — pas enregistré », ou « Oui » tant que la date
 *  n'est pas relue. */
export function libelleOuiDuChantier({ confirmeLe = null, enRoute = false, enEchec = false } = {}) {
  const suffixe = suffixeDEtat({ enRoute, enEchec });
  if (suffixe) return `${LE_CHANTIER.q1.oui}${suffixe}`;
  const date = confirmeLe ? dateFrancaise(confirmeLe) : null;
  return date ? `${LE_CHANTIER.q1.oui} — confirmé le ${date}` : LE_CHANTIER.q1.oui;
}

/** Les deux pastilles de la seconde question : « Non (par défaut) » tant que
 *  la valeur est vide, puis « Non » (critique écran E-M10). */
export function pastillesDeLaQuestionTva(valeur) {
  return [valeur === null || valeur === undefined ? LE_CHANTIER.q2.nonParDefaut : LE_CHANTIER.q2.non, LE_CHANTIER.q2.oui];
}

/** Les deux pastilles de la question de la décennale (2b-3, annexe A.3) :
 *  « Non » à GAUCHE, comme les deux autres (E-I3) ; « Oui (par défaut) »
 *  tant que la valeur est vide — vide = « Oui », par prudence —, puis
 *  « Oui ». */
export function pastillesDeLaQuestionDecennale(valeur) {
  return [LE_CHANTIER.q3.non, valeur === null || valeur === undefined ? LE_CHANTIER.q3.ouiParDefaut : LE_CHANTIER.q3.oui];
}

/* La date la plus LARGE qu'un résumé peut porter, pour les gabarits. */
const DATE_LA_PLUS_LARGE = `${CHIFFRE_LE_PLUS_LARGE.repeat(2)}/${CHIFFRE_LE_PLUS_LARGE.repeat(2)}/${CHIFFRE_LE_PLUS_LARGE.repeat(4)}`;

/** TOUS les résumés de la rangée, suffixes compris, avec la date la plus
 *  large : les GABARITS qui fixent sa hauteur. 2b-3 : chaque résumé des deux
 *  premières questions, avec chacune des trois parties de la décennale
 *  (rien, « ; décennale : oui », « ; décennale : non »), et les trois
 *  résumés de la décennale seule — puis les trois suffixes. */
export const GABARITS_DU_CHANTIER = Object.freeze([
  ...[
    LE_CHANTIER.ordinaire,
    `Bâtiment neuf ou transformation importante, confirmé le ${DATE_LA_PLUS_LARGE}`,
    'Bâtiment neuf ou transformation importante',
    'Crée un bâtiment neuf : taux normal de TVA',
    `Bâtiment neuf, confirmé le ${DATE_LA_PLUS_LARGE} ; taux normal de TVA`,
    'Bâtiment neuf ; taux normal de TVA',
  ].flatMap((t) => ['', ' ; décennale : oui', ' ; décennale : non'].map((dec) => `${t}${dec}`)),
  'Décennale : oui (par défaut)',
  'Décennale : oui',
  'Décennale : non',
].flatMap((t) => ['', SUFFIXE_EN_ROUTE, SUFFIXE_EN_ECHEC].map((suffixe) => `${t}${suffixe}`)));

/* ================================================================== */
/*  LES DÉCHETS DU CHANTIER (lot 2b, étape 2b-5, cahier §3.2)          */
/* ================================================================== */
/*
 * CE QUE LA LOI DEMANDE (code de l'environnement, L. 541-21-2-3 I et
 * D. 541-45-1 I) : sur tout devis de travaux de construction, de
 * rénovation ou de démolition d'un bâtiment, et sur tout devis de
 * jardinage, quel que soit le client, quatre informations — une estimation
 * de la QUANTITÉ de déchets, le TRI (les déchets collectés à part), les
 * LIEUX où l'entreprise prévoit de les déposer (raison sociale, adresse,
 * type d'installation), et une estimation des COÛTS. Il suffit qu'une seule
 * manque pour exposer à une amende administrative.
 *
 * CE QU'OPUS EN FAIT (décision Q4 = 1 du 17/11, réponses P1 à P6 du 21/11) :
 * une carte « Déchets du chantier » par devis, qui range des FAITS FERMÉS,
 * chacun dans les mots des textes — jamais une phrase qui tire une
 * conclusion de droit (T20) ; les lieux, rangés une fois dans « Mon
 * entreprise » et choisis dans chaque devis ; un point au rang 13 de « Pour
 * le remettre » tant qu'une rubrique manque. Rien n'est imprimé avant 2c.
 *
 * TROIS RÈGLES, et aucune n'est cosmétique :
 *   - RIEN N'EST COCHÉ, CHOISI NI REMPLI SANS UN APPUI (« Opus propose,
 *     l'artisan confirme ») : ni l'unité, ni un déchet, ni un lieu — même
 *     s'il n'y en a qu'un —, ni la réponse à la question. `etatInitialDechets`
 *     ne lit que le devis (T27) ;
 *   - JAMAIS DE TABLEAU VIDE (T3, T10) : « rien de dit » s'écrit VIDE DE
 *     VALEUR (`null`). Décocher la dernière case rend `null` ; « aucune
 *     collecte séparée » est une VALEUR à elle (`aucune`), exclusive des
 *     autres ; « Aucun dépôt » est une colonne à elle (`dechetsSansDepot`).
 *     La base refuse un tableau vide (49.5) : une case décochée qui
 *     l'écrirait finirait en « Non enregistrée » ;
 *   - LES LIEUX CHOISIS NE S'EFFACENT QUE SOUS LE DOIGT (T10) : la carte
 *     garde les identifiants TELS QUE LUS, orphelins compris (un lieu retiré
 *     de « Mon entreprise » laisse le sien) ; ce qu'elle MONTRE est
 *     l'intersection avec la liste vivante. Le nouveau tableau ne se
 *     construit que dans l'appui sur une case de lieu, à partir d'une liste
 *     LUE (`lieuxApresAppui`). Une liste non lue n'est jamais « aucun lieu ».
 *
 * LA RÈGLE DU RANG 13 EST ÉCRITE ICI, UNE FOIS (T26) : `rubriquesDesDechets`
 * dit quelles rubriques sont présentes ; `motifDesDechets` (le miroir de la
 * base), `resumeDesDechets` (la rangée) et `rubriqueDuPoint` (où le point
 * ouvre la carte) la lisent. Une seconde écriture finirait par dire autre
 * chose, et `verifier-devis` la refuse.
 *
 * Toutes ces fonctions sont PURES : `node` les fait tourner, la carte
 * (`DechetsDevis.js`) ne fait que les appeler.
 */

/** LES BORNES DES CONTRAINTES (49.5), écrites UNE fois de ce côté :
 *  la quantité, en millièmes de l'unité, de 1 à 99 999 999 (99 999,999 m³ ou
 *  tonnes — la borne de la quantité d'une ligne) ; le coût, en centimes, de
 *  1 à 999 999 999 (9 999 999,99 €, jamais 0 : réponse P2) ; 14 sortes de
 *  déchets au plus (la liste élargie, réponse P4) ; 10 lieux au plus par
 *  devis (T11). */
export const QUANTITE_DECHETS_MAX = 99_999_999;
export const COUT_DECHETS_MAX = 999_999_999;
export const FLUX_DECHETS_MAX = 14;
export const LIEUX_DECHETS_MAX = 10;

/** Les deux unités de la quantité (`devis_dechets_unite_check`) : la clé que
 *  la base garde, et le nom de la pastille. Aucune n'est choisie d'office. */
export const UNITES_DECHETS = Object.freeze([
  Object.freeze({ cle: 'm3', pastille: 'm³', nom: 'mètres cubes' }),
  Object.freeze({ cle: 't', pastille: 'tonnes', nom: 'tonnes' }),
]);

/** « Aucune collecte séparée » — une VALEUR de `dechetsFlux`, exclusive des
 *  autres, écrite par sa SEULE pastille (jamais un tableau vide). */
export const AUCUNE_COLLECTE = 'aucune';

/**
 * LES DÉCHETS COLLECTÉS À PART, dans l'ORDRE CANONIQUE (annexe A.4, la liste
 * élargie de la réponse P4) : les huit du décret (papier et carton, métal,
 * plastique, verre, textiles, bois, fraction minérale, plâtre — D. 543-281),
 * plus les familles que les textes nomment (menuiseries et vitrages,
 * membranes bitumineuses, laines minérales — R. 543-289 II —, terres
 * excavées), les déchets verts et les déchets dangereux.
 *
 * LE LIBELLÉ, QUI S'IMPRIMERA, EST SÉPARÉ DE SES EXEMPLES, QUI AIDENT À
 * L'ÉCRAN (T21) : « Déchets dangereux » s'imprime seul ; « amiante,
 * solvants… » se lit dessous, à l'écran seulement. Un libellé imprimé
 * « Déchets dangereux (amiante, …) » se lirait « ce chantier contient de
 * l'amiante » — `verifier-devis` refuse « amiante » dans un libellé.
 * La liste est celle de `devis_dechets_flux_check` (plus `aucune`),
 * comparée par `verifier-devis`.
 */
export const FLUX_DECHETS = Object.freeze([
  Object.freeze({ cle: 'papier', libelle: 'Papier et carton', exemples: null }),
  Object.freeze({ cle: 'metal', libelle: 'Métal', exemples: null }),
  Object.freeze({ cle: 'plastique', libelle: 'Plastique', exemples: null }),
  Object.freeze({ cle: 'verre', libelle: 'Verre', exemples: null }),
  Object.freeze({ cle: 'textiles', libelle: 'Textiles', exemples: null }),
  Object.freeze({ cle: 'bois', libelle: 'Bois', exemples: null }),
  Object.freeze({ cle: 'mineral', libelle: 'Fraction minérale (béton, briques, tuiles et céramiques, pierres)', exemples: null }),
  Object.freeze({ cle: 'platre', libelle: 'Plâtre', exemples: null }),
  Object.freeze({ cle: 'menuiseries', libelle: 'Menuiseries et vitrages', exemples: null }),
  Object.freeze({ cle: 'membranes', libelle: 'Membranes bitumineuses', exemples: null }),
  Object.freeze({ cle: 'laines', libelle: 'Laines minérales (verre, roche)', exemples: null }),
  Object.freeze({ cle: 'terres', libelle: 'Terres excavées', exemples: null }),
  Object.freeze({ cle: 'verts', libelle: 'Déchets verts', exemples: null }),
  Object.freeze({
    cle: 'dangereux',
    libelle: 'Déchets dangereux',
    exemples: 'Chacun à part, sans les mélanger entre eux : amiante, solvants, peintures qui en contiennent…',
  }),
]);

/** CE QUI RESTE SUR LE CHANTIER (T3 bis) — un fait À PART, montré toujours,
 *  jamais exigé, qui ne complète JAMAIS la rubrique du tri : le broyage n'est
 *  pas une collecte séparée (la loi pose valorisation sur place et collecte
 *  séparée comme des alternatives). La liste de
 *  `devis_dechets_sur_place_check`, dans son ordre. */
export const SUR_PLACE_DECHETS = Object.freeze([
  Object.freeze({ cle: 'broyage', libelle: 'Broyage sur le chantier' }),
  Object.freeze({ cle: 'compostage', libelle: 'Compostage ou paillage sur place' }),
]);

/** La valeur que l'écran passe à `lieuxApresAppui` pour un appui sur la
 *  pastille « Aucun dépôt : rien ne quittera le chantier » (réponse P6). */
export const AUCUN_DEPOT = 'aucun_depot';

/**
 * CE TRI NOMME-T-IL UNE SORTE QUI PART À PART ? (décision du propriétaire du
 * 21/11, question DROIT-R2 : « Le signaler ») — VRAI quand la liste des
 * déchets collectés à part contient autre chose qu'« Aucune collecte
 * séparée » (du bois, du plâtre, des déchets dangereux…) ; FAUX pour une
 * liste vide de valeur (rien de dit) et pour `['aucune']`. Écrite UNE fois
 * de ce côté : la règle du rang 13 (`rubriquesDesDechets`), la phrase de la
 * carte (`aucunDepotContredit`) et l'annonce du tri (`annonceDuTri` : « des
 * déchets cochés ») la lisent.
 * Le miroir de `not (v_dechets_flux is null or v_dechets_flux =
 * array['aucune'])` (49.9), sur les seules listes que la base accepte :
 * jamais `[]` (la base le refuse), et `aucune` toujours seule.
 */
export function triNommeUneSorte(flux) {
  return Array.isArray(flux) && flux.some((c) => c !== AUCUNE_COLLECTE);
}

/**
 * « AUCUN DÉPÔT » CONTREDIT PAR LE TRI (DROIT-R2) — `choix` : `{ flux,
 * sansDepot }`, la valeur de la carte. VRAI quand la pastille « Aucun
 * dépôt : rien ne quittera le chantier » est choisie ET que le tri nomme une
 * sorte qui part à part : ces déchets-là PARTIRONT, et leur lieu de dépôt
 * doit être nommé — « Aucun dépôt » ne remplit alors plus la rubrique des
 * lieux (le rang 13 la compte comme un lieu qui manque). La carte le DIT
 * sous la pastille (`LES_DECHETS.lieux.partentAPart`), et la phrase tombe
 * dès que la contradiction tombe : « Aucune collecte séparée » choisie
 * (`fluxApresAppui` rend `['aucune']`), la dernière sorte décochée (`null`),
 * un lieu coché ou « Aucun dépôt » retouché (`lieuxApresAppui` rend
 * `sansDepot: null`).
 */
export function aucunDepotContredit(choix) {
  const x = choix && typeof choix === 'object' ? choix : {};
  return x.sansDepot === true && triNommeUneSorte(x.flux);
}

/** Les quatre rubriques que la loi demande, dans l'ordre de la carte et du
 *  résumé. */
export const RUBRIQUES_DES_DECHETS = Object.freeze(['quantite', 'tri', 'lieu', 'cout']);

/** Les huit champs de l'en-tête que la carte écrit — ce que
 *  `etatDesChampsDuDevis` regarde pour la rangée « Déchets ». */
export const CHAMPS_DES_DECHETS = Object.freeze([
  'dechetsConcerne', 'dechetsQuantiteMilliemes', 'dechetsUnite', 'dechetsFlux', 'dechetsSurPlace', 'dechetsLieux',
  'dechetsSansDepot', 'dechetsCoutCentimes',
]);

const CLES_FLUX = Object.freeze([AUCUNE_COLLECTE, ...FLUX_DECHETS.map((f) => f.cle)]);
const CLES_SUR_PLACE = Object.freeze(SUR_PLACE_DECHETS.map((x) => x.cle));

/* LES MIROIRS DES TROIS CONTRAINTES DE TABLEAU (49.5) — y compris ce que la
   base ACCEPTE (un doublon passe : le téléphone n'en envoie jamais, et le
   rang 13 compte les lieux DISTINCTS) et ce qu'elle REFUSE (le tableau vide,
   par la forme `case … else false`). `validerDevis` les lit. */
function fluxRecevable(v) {
  return Array.isArray(v) && v.length >= 1 && v.length <= FLUX_DECHETS_MAX
    && v.every((c) => CLES_FLUX.includes(c))
    && (v.length === 1 || !v.includes(AUCUNE_COLLECTE));
}
function surPlaceRecevable(v) {
  return Array.isArray(v) && v.length >= 1 && v.length <= CLES_SUR_PLACE.length && v.every((c) => CLES_SUR_PLACE.includes(c));
}
function lieuxRecevables(v) {
  return Array.isArray(v) && v.length >= 1 && v.length <= LIEUX_DECHETS_MAX
    && v.every((x) => typeof x === 'string' && x !== '');
}

/** L'ORDRE CANONIQUE d'une liste de déchets : `aucune`, puis l'ordre de
 *  `FLUX_DECHETS` ; sans doublon ; une clé inconnue est écartée. Elle peut
 *  rendre `[]` : c'est `fluxApresAppui` qui ne l'écrit jamais. */
export function ordonnerFlux(liste) {
  const vus = new Set(Array.isArray(liste) ? liste : []);
  return CLES_FLUX.filter((c) => vus.has(c));
}

/**
 * CE QU'ÉCRIT UN APPUI dans le bloc du tri — `flux` : la valeur de la carte ;
 * `cle` : la case touchée, ou `AUCUNE_COLLECTE` pour la pastille.
 *   - la pastille « Aucune collecte séparée » : allumée, elle s'éteint
 *     (`null`, rien de dit) ; éteinte, elle s'allume (`['aucune']`) et RETIRE
 *     les déchets cochés — dans le même geste, et la carte l'annonce
 *     (`annonceDuTri`, T28) ;
 *   - une case : elle se coche ou se décoche, la pastille tombe (sans
 *     annonce : c'est l'objet même de l'appui), l'ordre canonique est remis ;
 *     la DERNIÈRE case décochée rend `null`, jamais `[]` ;
 *   - une clé inconnue ne change rien (un tableau vide, que la carte ne
 *     tient jamais, se rend vide de valeur : aucun chemin ne rend `[]`).
 * Toujours un tableau NEUF : la carte ne fait jamais `push`.
 */
export function fluxApresAppui(flux, cle) {
  const avant = Array.isArray(flux) ? flux : [];
  if (cle === AUCUNE_COLLECTE) return avant.includes(AUCUNE_COLLECTE) ? null : [AUCUNE_COLLECTE];
  if (!FLUX_DECHETS.some((f) => f.cle === cle)) return avant.length ? flux : null;
  const sans = avant.filter((c) => c !== AUCUNE_COLLECTE);
  const apres = sans.includes(cle) ? sans.filter((c) => c !== cle) : [...sans, cle];
  const range = ordonnerFlux(apres);
  return range.length ? range : null;
}

/** CE QU'ÉCRIT UN APPUI dans « Sur le chantier » : la case se coche ou se
 *  décoche, dans l'ordre de `SUR_PLACE_DECHETS` ; la dernière décochée rend
 *  `null`, jamais `[]` ; une clé inconnue ne change rien (un tableau vide
 *  se rend vide de valeur). */
export function surPlaceApresAppui(surPlace, cle) {
  if (!CLES_SUR_PLACE.includes(cle)) return Array.isArray(surPlace) && surPlace.length ? surPlace : null;
  const avant = Array.isArray(surPlace) ? surPlace.filter((c) => CLES_SUR_PLACE.includes(c)) : [];
  const apres = avant.includes(cle) ? avant.filter((c) => c !== cle) : [...avant, cle];
  const range = CLES_SUR_PLACE.filter((c) => apres.includes(c));
  return range.length ? range : null;
}

/* Les identifiants d'une liste de lieux LUE (des objets `{ id, … }`), dans
   son ordre, sans doublon. */
const idsDesLieux = (lieuxLus) => [...new Set((Array.isArray(lieuxLus) ? lieuxLus : [])
  .map((l) => (l && typeof l === 'object' ? l.id : null)).filter((x) => x != null))];

/**
 * CE QU'ÉCRIT UN APPUI dans le bloc des lieux (T10, réponse P6) — `choix` :
 * `{ lieux, sansDepot }`, la valeur de la carte ; `lieuxLus` : la liste de
 * « Mon entreprise » TELLE QU'ELLE EST LUE (ses objets `{ id, … }`), ou
 * `undefined`/`null` tant qu'elle ne l'est pas ; `id` : le lieu touché, ou
 * `AUCUN_DEPOT` pour la pastille. Rend `{ lieux, sansDepot }`.
 *   - LISTE NON LUE : RIEN ne change, identifiants gardés, orphelins
 *     compris — la carte ne montre d'ailleurs aucune case (T12 bis) ; une
 *     liste qu'on n'a pas lue n'est jamais « aucun lieu » ;
 *   - la pastille « Aucun dépôt » : allumée, elle s'éteint ; éteinte, elle
 *     s'allume et RETIRE les lieux cochés (`lieux: null`), annoncé par la
 *     carte (`annonceDesLieux`, T28) ;
 *   - un lieu de la liste : il se coche ou se décoche, la pastille tombe ; le
 *     tableau se REBÂTIT depuis la liste lue, dans SON ordre — ce qui retire
 *     d'un seul geste les identifiants orphelins (ils n'ont jamais été
 *     montrés : leur retrait ne s'annonce pas) ; le dernier décoché rend
 *     `null`, jamais `[]` ;
 *   - un identifiant qui n'est pas dans la liste lue ne change rien ;
 *   - LE PLAFOND (relecture BASE-R1 / ÉCRAN-1 du 21/11) : un lieu de PLUS,
 *     quand la liste rebâtie dépasserait `LIEUX_DECHETS_MAX`, ne s'ajoute
 *     pas — le choix est rendu INCHANGÉ (orphelins compris), avec
 *     `plafond: true`, et la carte dit pourquoi (`LES_DECHETS.lieux.plafond`)
 *     sans rien écrire. Sans cette garde, un onzième lieu partait vers la
 *     base, qui le refuse, et la carte disait « mettez Opus à jour » à
 *     quelqu'un qui a la dernière version. On compte la liste REBÂTIE (dans
 *     l'ordre de la liste lue, sans orphelins), jamais ce que la carte
 *     garde : un devis qui cite dix identifiants dont trois orphelins
 *     montre sept cases cochées, et un huitième lieu doit passer. Décocher
 *     reste toujours possible.
 * C'est le SEUL endroit où `dechetsLieux` se récrit : jamais à l'ouverture
 * de la carte, jamais sur un appui ailleurs (un déchet, l'unité, « Non »).
 */
export function lieuxApresAppui(choix, lieuxLus, id) {
  const x = choix && typeof choix === 'object' ? choix : {};
  const tel = {
    lieux: Array.isArray(x.lieux) && x.lieux.length ? x.lieux : null,
    sansDepot: x.sansDepot === true ? true : null,
  };
  if (!Array.isArray(lieuxLus)) return tel;
  if (id === AUCUN_DEPOT) return tel.sansDepot ? { lieux: tel.lieux, sansDepot: null } : { lieux: null, sansDepot: true };
  const ids = idsDesLieux(lieuxLus);
  if (!ids.includes(id)) return tel;
  const choisis = new Set(tel.lieux || []);
  const ajout = !choisis.has(id);
  if (ajout) choisis.add(id); else choisis.delete(id);
  const range = ids.filter((v) => choisis.has(v));
  if (ajout && range.length > LIEUX_DECHETS_MAX) return { lieux: tel.lieux, sansDepot: tel.sansDepot, plafond: true };
  return { lieux: range.length ? range : null, sansDepot: null };
}

/** CE QUE LA CARTE ANNONCE quand la pastille « Aucune collecte séparée »
 *  vient de retirer des déchets cochés (T28) : « un champ qui change sans
 *  geste doit s'annoncer ». `null` sinon — décocher une case, ou allumer la
 *  pastille quand rien n'était coché, ne retire rien qu'on n'ait touché. */
export function annonceDuTri(avant, apres) {
  const retire = triNommeUneSorte(avant);
  const pastille = Array.isArray(apres) && apres.length === 1 && apres[0] === AUCUNE_COLLECTE;
  return retire && pastille ? LES_DECHETS.tri.retires : null;
}

/** CE QUE LA CARTE ANNONCE quand « Aucun dépôt » vient de retirer des lieux
 *  cochés ET MONTRÉS : un identifiant orphelin n'a jamais été montré, son
 *  retrait ne s'annonce pas (T28). `avant`, `apres` : `{ lieux, sansDepot }`. */
export function annonceDesLieux(avant, apres, lieuxLus) {
  const ids = idsDesLieux(lieuxLus);
  const montres = (avant && Array.isArray(avant.lieux) ? avant.lieux : []).filter((v) => ids.includes(v));
  return montres.length > 0 && apres && apres.sansDepot === true ? LES_DECHETS.lieux.retires : null;
}

/* L'entreprise d'un lieu : `proId` (la forme de `cas-remise.json`) ou
   `pro_id` (une ligne de la base, telle que « Mon entreprise » la lit). */
function entrepriseDuLieu(l) {
  return l ? (l.proId ?? l.pro_id ?? null) : null;
}

/**
 * LES QUATRE RUBRIQUES, PRÉSENTES OU NON — LA règle du rang 13, écrite ICI
 * UNE FOIS (T26), la même que `motifs_refus_remise()` (49.9). Rend
 * `{ quantite, tri, lieu, cout }` :
 *   - `quantite` : la quantité ET son unité ;
 *   - `tri` : la liste des déchets collectés à part (`['aucune']` compte) —
 *     ce qui reste sur le chantier n'y compte JAMAIS ;
 *   - `lieu` : VRAI si « Aucun dépôt » ET que le tri ne nomme aucune sorte
 *     qui part à part (`triNommeUneSorte` : DROIT-R2, décision du 21/11 —
 *     « Aucun dépôt » avec du bois ou du plâtre à part ne dit pas où ces
 *     déchets iront), ou si un lieu choisi existe dans
 *     `lieux` CHEZ L'ENTREPRISE DU DEVIS (le miroir de `l.pro_id = v_pro` :
 *     un lieu qui ne dit pas son entreprise n'est pas écarté, comme une
 *     assurance dans `etatDeLAttestation`) ; FAUX si aucun lieu n'est choisi
 *     (vrai même sans lire la liste), ou si aucun choisi n'est dans la liste
 *     LUE (des orphelins, le lieu d'un autre) ; `null` — INCONNU — quand des
 *     lieux sont choisis mais que la liste n'est pas lue (`lieux` n'est pas
 *     un tableau) : le seul cas où la rangée dit « Lieux de dépôt non lus » ;
 *   - `cout` : le coût estimé.
 * Le miroir (`motifDesDechets`) compte un `null` comme absent : une liste
 * qu'on n'a pas transmise ne prouve aucun lieu.
 */
export function rubriquesDesDechets(devis, lieux) {
  const d = devis || {};
  const choisis = Array.isArray(d.dechetsLieux) ? d.dechetsLieux.filter((v) => v != null) : [];
  let lieu;
  if (d.dechetsSansDepot === true && !triNommeUneSorte(d.dechetsFlux)) lieu = true;
  else if (choisis.length === 0) lieu = false;
  else if (!Array.isArray(lieux)) lieu = null;
  else {
    const pro = d.proId ?? null;
    lieu = lieux.some((l) => l && l.id != null && choisis.includes(l.id)
      && (pro == null || entrepriseDuLieu(l) == null || String(entrepriseDuLieu(l)) === String(pro)));
  }
  return {
    quantite: present(d.dechetsQuantiteMilliemes) && present(d.dechetsUnite),
    tri: Array.isArray(d.dechetsFlux) && d.dechetsFlux.length > 0,
    lieu,
    cout: present(d.dechetsCoutCentimes),
  };
}

/** La première rubrique qui n'est pas PRÉSENTE (absente, ou inconnue faute
 *  de liste lue), dans l'ordre de la carte — ou `null` quand les quatre le
 *  sont. */
export function premiereRubriqueManquante(devis, lieux) {
  const r = rubriquesDesDechets(devis, lieux);
  return RUBRIQUES_DES_DECHETS.find((k) => r[k] !== true) || null;
}

/**
 * LE MIROIR DU RANG 13 — la clé, ou `null` : la réponse n'est pas « Non »
 * (`dechetsConcerne !== false` : vide = « Oui », par prudence) et une
 * rubrique n'est pas présente → `devis_dechets_rubriques` quand la réponse
 * est « Oui », `devis_dechets` quand elle est vide. UNE clé au plus.
 */
export function motifDesDechets(devis, lieux) {
  const d = devis || {};
  if (d.dechetsConcerne === false) return null;
  const r = rubriquesDesDechets(d, lieux);
  if (RUBRIQUES_DES_DECHETS.every((k) => r[k] === true)) return null;
  return d.dechetsConcerne === true ? 'devis_dechets_rubriques' : 'devis_dechets';
}

/**
 * OÙ LE POINT DU RANG 13 OUVRE LA CARTE (T8) : `'question'` pour
 * `devis_dechets` (la réponse est vide : on répond d'abord) ; la première
 * rubrique qui manque pour `devis_dechets_rubriques`, et `'question'` — en
 * haut — à défaut (la liste de la base peut être plus récente que celle des
 * lieux à l'écran) ; `null` pour tout autre point.
 */
export function rubriqueDuPoint(point, { devis = null, lieux = undefined } = {}) {
  const cle = point && typeof point.cle === 'string' ? point.cle : null;
  if (cle === 'devis_dechets') return 'question';
  if (cle === 'devis_dechets_rubriques') return premiereRubriqueManquante(devis, lieux) || 'question';
  return null;
}

/**
 * LES TROIS ÉTATS DE LA LISTE DES LIEUX À L'ÉCRAN (T12 bis) — `'lecture'`,
 * `'echec'`, `'vide'` ou `'lus'`. La liste arrive par la MÊME lecture que le
 * régime de TVA (`monRegimeEtSaDate`) : son état se déduit du sien.
 *   - un tableau : `'vide'` s'il n'a aucun lieu, `'lus'` sinon ;
 *   - le régime en ÉCHEC (`{ echec: true }`) : `'echec'` — « Vos lieux de
 *     dépôt n'ont pas pu être lus », et « Réessayer » ;
 *   - le régime LU (franchise, réel, ou non déclaré) et la liste LUE À VIDE
 *     DE VALEUR (`null` : la table absente — un cache de PostgREST pas encore
 *     rechargé après la migration rend `null`, jamais `[]`) : `'echec'`
 *     aussi ;
 *   - le régime LU mais la liste PAS ENCORE LUE (`undefined`) : `'lecture'`
 *     (relecture ÉCRAN-3 du 21/11). « Mon entreprise » pose le régime qu'elle
 *     vient de lire, et la lecture des lieux peut être en route : la dire en
 *     échec affichait « n'ont pas pu être lus » et « Réessayer » sur un
 *     réseau lent, puis remplaçait ce bouton par une case, sans transition.
 *     C'est sûr parce qu'aucun régime posé ne laisse la liste sans lecture
 *     en route : « Mon entreprise » remonte AUSSI les lieux qu'elle vient de
 *     lire (`recevoirEmetteur`, OpusApp) ;
 *   - sinon (en lecture, pas encore demandé) : `'lecture'` — rien n'est
 *     dit, aucune case.
 * JAMAIS « vide » d'une liste qu'on n'a pas lue : montrer « aucun lieu » à
 * qui en a inviterait au doublon (la règle de 2b-1).
 */
export function etatDesLieux(etatRegime, lieux) {
  if (Array.isArray(lieux)) return lieux.length ? 'lus' : 'vide';
  if (etatRegime && typeof etatRegime === 'object' && etatRegime.echec) return 'echec';
  if (regimeConnu(etatRegime) !== null && lieux === null) return 'echec';
  return 'lecture';
}

/** LE LIBELLÉ DU COÛT ESTIMÉ (T16, réponse P2) : « HT » au seul régime réel,
 *  comme les lignes ; « en euros » sinon — en franchise, non déclaré, en
 *  lecture ou en échec, on ne nomme pas la taxe (la règle de
 *  `libellesDesTotaux`, le précédent de la réduction en euros). Le champ
 *  reste ouvert quel que soit le régime ; un changement de régime ne
 *  convertit rien. */
export function libelleDuCout(etatRegime) {
  return libellesDesTotaux(etatRegime).taxe ? LES_DECHETS.cout.libelleHt : LES_DECHETS.cout.libelleEuros;
}

/** CE QUE VOICEOVER DIT DU CHAMP DU COÛT (relecture ÉCRAN-6 et DROIT-R9 du
 *  21/11) — composé À PART du titre : « Coût estimé, en euros » suivi de
 *  « des déchets » se lisait « Coût estimé, en euros des déchets ». La
 *  même règle que `libelleDuCout` (« HT » au seul régime réel), le modèle
 *  de « Quantité estimée des déchets, en mètres cubes ». */
export function libelleParleDuCout(etatRegime) {
  return libellesDesTotaux(etatRegime).taxe ? LES_DECHETS.cout.parleHt : LES_DECHETS.cout.parleEuros;
}

/**
 * L'AMENDE QUE LA LOI PRÉVOIT (L. 541-21-2-3 III ; réponse P3 du 21/11 :
 * « Oui, cette phrase ») — écrite UNE fois, et seulement dans l'aide de la
 * carte, jamais dans une phrase du point. La troisième constante de ce
 * fichier qui écrit « € » (après `AMENDE_DE_LA_LOI` et
 * `AMENDE_DU_CODE_DE_LA_CONSTRUCTION`), tenue par `verifier-devis` : une
 * phrase de droit, pas un montant d'un devis. « Personne morale » se dit
 * « une société » (au juriste, J55). Espaces insécables entre les chiffres
 * et devant « € » : un montant ne se coupe pas en fin de ligne.
 */
export const AMENDE_DES_DECHETS = 'Il suffit qu’une seule de ces informations manque pour exposer à une amende administrative '
  + 'pouvant aller jusqu’à 3\u00a0000\u00a0€, 15\u00a0000\u00a0€ pour une société.';

/**
 * LES TEXTES DE LA CARTE « DÉCHETS DU CHANTIER », DE SA RANGÉE ET DE SON
 * POINT (annexes A.1 à A.3 du cahier 2b-5), mot pour mot. Les questions et
 * les aides parlent à l'ARTISAN : ce ne sont pas les textes imprimés (2c).
 * Aucun « vérifié », « agréé », « registre », « bordereau », « brûlage »,
 * « dispensé », « sans frais » — `verifier-devis` les refuse, avec une seule
 * exception nommée : « Opus ne peut pas le vérifier », une NÉGATION qui dit
 * à l'artisan ce qu'Opus ne fait pas.
 * Espaces insécables entre un nombre et son unité (« 10 m³ », « 40 m² ») :
 * la règle des aides de ce fichier.
 */
export const LES_DECHETS = Object.freeze({
  titre: 'Déchets du chantier',
  introduction: 'Ce que deviendront les déchets de ce chantier. Rien ne s’ajoute au total du devis.',
  /* Le bouton du point, pour les deux clés du rang 13 (annexe A.1). */
  bouton: 'Compléter les déchets',
  /* La question (réponse P1 du 21/11), en tête de la carte (T7). « Non » à
     GAUCHE, comme les trois questions de « Le chantier ». */
  question: Object.freeze({
    sousTitre: 'Pour la loi',
    question: 'S’agit-il de travaux sur un bâtiment, ou de jardinage ?',
    non: 'Non, ni l’un ni l’autre',
    ouiParDefaut: 'Oui (par défaut)',
    oui: 'Oui',
    aide: 'La loi demande, sur un devis de construction, de rénovation ou de démolition d’un bâtiment, et sur un '
      + 'devis de jardinage, ce que deviendront les déchets — même s’il y en a très peu. Répondez Non seulement si ce '
      + 'devis n’est ni l’un ni l’autre : une étude ou une fourniture sans pose (ce ne sont pas des travaux), une route ou '
      + 'un réseau sans rapport avec un bâtiment. Dans le doute (un dépannage, une réparation, une terrasse ou une allée '
      + 'contre la maison, l’entretien d’espaces verts, un élagage), gardez Oui : c’est le cas le plus sûr.',
    /* Sous « Non » : les rubriques se taisent, rien n'est effacé. */
    sousNon: 'Ce devis ne dira rien des déchets. Ce que vous avez déjà écrit est gardé, au cas où vous changeriez d’avis.',
  }),
  quantite: Object.freeze({
    titre: 'Quantité estimée',
    question: 'Combien de déchets vos travaux produiront-ils, en tout ?',
    placeholder: 'Quantité',
    aide: 'Une estimation suffit. Comptez tous les déchets que vos travaux produiront, même très peu.',
    /* Une quantité sans unité (T23) : dit à la place réservée sous le champ,
       sans rien refuser — la quantité, elle, s'enregistre. */
    sansUnite: 'Choisissez m³ ou tonnes.',
    zero: 'La quantité estimée des déchets doit être positive.',
  }),
  tri: Object.freeze({
    titre: 'Le tri',
    question: 'Quels déchets partiront à part ?',
    aucune: 'Aucune collecte séparée',
    sousAucune: 'Seulement si rien ne partira à part.',
    aide: 'Le plâtre, les déchets dangereux et les déchets verts triés ne se mélangent pas aux autres. Sur un petit '
      + 'chantier (moins de 10\u00a0m³ de déchets, ou sans 40\u00a0m² pour les stocker), les règles de tri du décret ne '
      + 's’appliquent pas ; la loi demande quand même un tri à la source et, pour les déchets qui ne sont pas traités sur '
      + 'place, une collecte séparée ; et le devis doit dire ce que vous faites.',
    /* Annoncé quand la pastille retire des cases cochées (T28). */
    retires: 'Les déchets cochés ont été retirés.',
  }),
  surPlace: Object.freeze({
    titre: 'Sur le chantier',
    question: 'Ce qui y restera, s’il y en a. Pour des travaux de jardinage, si vous broyez, compostez ou paillez sur place, '
      + 'la loi demande de le dire.',
  }),
  lieux: Object.freeze({
    titre: 'Où les déposerez-vous ?',
    echec: 'Vos lieux de dépôt n’ont pas pu être lus.',
    reessayer: 'Réessayer',
    vide: 'Vous n’avez encore aucun lieu de dépôt.',
    ajouter: 'Ajouter un lieu de dépôt',
    /* La porte permanente vers « Mon entreprise », section des lieux (T25). */
    porte: 'Mes lieux de dépôt',
    aucunDepot: 'Aucun dépôt : rien ne quittera le chantier',
    sousAucunDepot: 'Seulement si tous les déchets restent sur place, broyés ou compostés : choisissez alors aussi « Aucune '
      + 'collecte séparée » et, dans « Sur le chantier », ce que vous en faites.',
    /* « Aucun dépôt » choisi ET un tri qui nomme une sorte qui part à part
       (DROIT-R2, décision du 21/11 : « Le signaler ») : MONTRÉE sous la
       pastille, tant que la contradiction dure (`aucunDepotContredit`) — le
       rang 13 compte alors le lieu comme manquant. Sa seconde phrase est
       conditionnée par ce qui garde « Aucun dépôt » VRAI — rien ne quitte le
       chantier —, jamais par « rien ne partira à part » (relecture R2-1) :
       des déchets qui partent MÉLANGÉS à la déchèterie ne partent pas « à
       part », et l'artisan qui aurait suivi l'ancienne phrase gardait
       « rien ne quittera le chantier » sans aucun point de collecte
       (D. 541-45-1, I, 3°). */
    partentAPart: 'Des déchets partiront à part : choisissez où vous les déposerez. Si en fait rien ne quitte le chantier, '
      + 'choisissez « Aucune collecte séparée ».',
    retires: 'Les lieux cochés ont été retirés.',
    /* Un lieu de plus que `LIEUX_DECHETS_MAX` (relecture BASE-R1 / ÉCRAN-1) :
       MONTRÉ à la place de la faute des lieux, annoncé, rien n'est écrit. */
    plafond: 'Dix lieux au plus par devis : décochez-en un pour en choisir un autre.',
    aide: 'Si vous les remettez à quelqu’un d’autre, la loi vous demande de vous assurer qu’il est autorisé à les '
      + 'prendre en charge ; Opus ne peut pas le vérifier. Pour votre propre dépôt, nommez aussi, si vous la '
      + 'connaissez, l’installation où ils finiront.',
  }),
  cout: Object.freeze({
    libelleHt: 'Coût estimé HT',
    libelleEuros: 'Coût estimé, en euros',
    /* Ce que VoiceOver dit du champ (`libelleParleDuCout`). */
    parleHt: 'Coût estimé HT des déchets',
    parleEuros: 'Coût estimé des déchets, en euros',
    question: 'Combien coûteront le tri, le chargement, le transport et le dépôt ?',
    placeholder: 'Montant',
    aide: 'Une estimation, qui ne s’ajoute pas au total. Si ce coût est déjà compris dans vos prix, n’ajoutez pas de '
      + 'ligne : écrivez quand même son estimation ici. S’il ne l’est pas et que vous le faites payer, ajoutez une ligne au '
      + 'devis.',
    zero: 'Le coût estimé des déchets doit être un montant positif.',
  }),
  amende: AMENDE_DES_DECHETS,
  /* La rangée « Déchets » de la saisie (annexe A.3) : son titre, que le
     résumé ne répète pas (VoiceOver dit « Titre : résumé. Ouvrir »). */
  rangee: 'Déchets',
});

/** Les deux pastilles de la question : « Non, ni l’un ni l’autre » à gauche,
 *  et « Oui (par défaut) » tant que la réponse est vide — vide = « Oui », par
 *  prudence —, puis « Oui ». */
export function pastillesDeLaQuestionDesDechets(valeur) {
  const q = LES_DECHETS.question;
  return [q.non, valeur === null || valeur === undefined ? q.ouiParDefaut : q.oui];
}

/** LA QUANTITÉ TAPÉE : `versMilliemes` (la virgule d'abord, trois décimales
 *  au plus, cinq chiffres avant la virgule au plus — donc jamais au-delà de
 *  `QUANTITE_DECHETS_MAX`, la même borne que la quantité d'une ligne), puis
 *  « jamais 0 » — vide = `null`, sans erreur (rien de dit). */
export function versQuantiteDesDechets(texte) {
  const r = versMilliemes(texte);
  if (!r.ok || r.milliemes === null) return r;
  if (r.milliemes < 1) return { ok: false, milliemes: null, message: LES_DECHETS.quantite.zero };
  return r;
}

/** LE COÛT TAPÉ : `versCentimes`, puis « jamais 0 » (réponse P2 : toujours un
 *  montant) et la borne de `devis_dechets_cout_check` — vide = `null`, sans
 *  erreur (rien de dit : c'est le point de « Pour le remettre » qui le dit). */
export function versCoutDesDechets(texte) {
  const r = versCentimes(texte);
  if (!r.ok) return r;
  if (r.centimes === null) return { ok: true, centimes: null, message: null };
  if (r.centimes === 0) return { ok: false, centimes: null, message: LES_DECHETS.cout.zero };
  if (r.centimes > COUT_DECHETS_MAX) {
    return { ok: false, centimes: null, message: `Le coût estimé des déchets s’écrit jusqu’à ${centimesLisibles(COUT_DECHETS_MAX)}.` };
  }
  return r;
}

/**
 * LES DEUX TEXTES DE LA CARTE À SON OUVERTURE (relecture CTL-9 du 21/11) —
 * `{ quantite, cout }`, ce que les deux champs affichent d'abord. Le texte
 * que la saisie a GARDÉ (une valeur refusée, rouverte par « Corriger »)
 * passe d'abord ; un texte gardé VIDE n'a rien à corriger, la valeur
 * enregistrée revient. Sinon : la quantité du devis en saisie
 * (`milliemesEnSaisie` : 2 500 millièmes → « 2,5 »), le coût DES DÉCHETS en
 * saisie (`centimesEnSaisie` : 12 000 centimes → « 120 ») — jamais le prix
 * du devis lui-même (`coutDevisCentimes`, un AUTRE montant : 2b-4) —, ou
 * rien. Écrits ici, et pas dans la carte, pour que `verifier-devis` les
 * FASSE TOURNER : au premier « quitter », la carte enregistre ce qu'ils
 * affichent, et une valeur fausse partirait en base.
 */
export function textesInitiauxDesDechets(devis, textes = null) {
  const x = devis || {};
  const garde = (cle) => (textes && typeof textes === 'object' && present(textes[cle]) && String(textes[cle]).trim() !== ''
    ? String(textes[cle]) : null);
  return {
    quantite: garde('quantite') ?? (present(x.dechetsQuantiteMilliemes) ? milliemesEnSaisie(x.dechetsQuantiteMilliemes) : ''),
    cout: garde('cout') ?? (present(x.dechetsCoutCentimes) && x.dechetsCoutCentimes > 0 ? centimesEnSaisie(x.dechetsCoutCentimes) : ''),
  };
}

/* Un tableau de la base, recopié NEUF — ou `null` (vide de valeur). Un
   tableau vide n'est pas une réponse : il devient `null` à l'OUVERTURE de la
   carte (la base n'en garde jamais). */
const tableauLu = (v) => (Array.isArray(v) && v.length ? [...v] : null);

/**
 * L'ÉTAT DE LA CARTE À SON OUVERTURE (T23, T27) — `{ concerne, unite, flux,
 * surPlace, lieux, sansDepot }`, lu dans le DEVIS SEUL : jamais dans les
 * lieux de « Mon entreprise » (un artisan qui n'en a qu'un ne le voit pas
 * coché d'office), jamais dans le métier, jamais dans l'origine du devis.
 * Sur un devis vierge, TOUT est vide, l'unité comprise. Les lieux sont gardés
 * TELS QUE LUS, orphelins compris (T10).
 * `textes` : ce que la saisie a GARDÉ d'une carte refusée (`lireDechets` le
 * rend) — ses `choix` rouvrent la carte comme on l'a laissée.
 */
export function etatInitialDechets(devis, textes = null) {
  const x = devis || {};
  const etat = {
    concerne: x.dechetsConcerne === true ? true : (x.dechetsConcerne === false ? false : null),
    unite: UNITES_DECHETS.some((u) => u.cle === x.dechetsUnite) ? x.dechetsUnite : null,
    flux: tableauLu(x.dechetsFlux),
    surPlace: tableauLu(x.dechetsSurPlace),
    lieux: tableauLu(x.dechetsLieux),
    sansDepot: x.dechetsSansDepot === true ? true : null,
  };
  const garde = textes && typeof textes === 'object' && textes.choix && typeof textes.choix === 'object' ? textes.choix : null;
  if (garde) {
    if (garde.concerne === null || typeof garde.concerne === 'boolean') etat.concerne = garde.concerne;
    if (garde.unite === null || UNITES_DECHETS.some((u) => u.cle === garde.unite)) etat.unite = garde.unite;
    if (garde.flux === null || Array.isArray(garde.flux)) etat.flux = tableauLu(garde.flux);
    if (garde.surPlace === null || Array.isArray(garde.surPlace)) etat.surPlace = tableauLu(garde.surPlace);
    if (garde.lieux === null || Array.isArray(garde.lieux)) etat.lieux = tableauLu(garde.lieux);
    if (garde.sansDepot === null || garde.sansDepot === true) etat.sansDepot = garde.sansDepot;
  }
  return etat;
}

/**
 * CE QUE LA CARTE PORTE À CET INSTANT (le modèle exact de `lireConditions`) :
 * `changements` (ce qui part — les PAIRES entières), `erreurs` (ce qui ne se
 * lit pas, champ par champ, avec sa phrase : RIEN n'en part), `textes` (ce
 * qui est tapé, et les `choix` de la carte) et `rappels` (ce qui se dit sans
 * rien refuser). `tapes` : le texte de chaque champ MONTÉ — `undefined` pour
 * un champ qui ne l'est pas (sous « Non », les rubriques se taisent : leur
 * valeur reste, rien n'est effacé).
 *   - les choix (la réponse, l'unité, les trois listes, « Aucun dépôt »)
 *     partent TELS QUE LA CARTE LES TIENT : la saisie n'envoie que ce qui
 *     DIFFÈRE de l'en-tête, par `memeValeur` — rouvrir puis fermer la carte
 *     n'écrit rien ;
 *   - la quantité : vide = `null` ; « 0 » = une erreur ; au-delà de la
 *     borne = une erreur. Avec une quantité sans unité, le rappel « Choisissez
 *     m³ ou tonnes. » (la quantité, elle, part) ;
 *   - le coût : vide = `null`, SANS erreur (le point de « Pour le remettre »
 *     dit ce qui manque) ; « 0 » = une erreur (jamais 0, réponse P2) ;
 *     au-delà de la borne = une erreur.
 * AUCUNE normalisation des listes ici : un tableau vide (que les fonctions
 * d'appui n'écrivent jamais) partirait tel quel, et la base le REFUSERAIT —
 * un défaut visible, jamais un silence.
 */
export function lireDechets({ choix = null, tapes = {}, devis = {} } = {}) {
  const x = devis || {};
  const c = choix || etatInitialDechets(x);
  const t = tapes || {};
  const changements = {};
  const erreurs = {};
  const textes = {};
  const rappels = {};
  if (c.concerne !== undefined) changements.dechetsConcerne = c.concerne;
  if (t.quantite !== undefined) {
    textes.quantite = t.quantite == null ? '' : String(t.quantite);
    const r = versQuantiteDesDechets(textes.quantite);
    if (r.ok) changements.dechetsQuantiteMilliemes = r.milliemes;
    else erreurs.dechetsQuantiteMilliemes = r.message;
  }
  if (c.unite !== undefined) changements.dechetsUnite = c.unite;
  if (c.flux !== undefined) changements.dechetsFlux = c.flux;
  if (c.surPlace !== undefined) changements.dechetsSurPlace = c.surPlace;
  if (c.lieux !== undefined) changements.dechetsLieux = c.lieux;
  if (c.sansDepot !== undefined) changements.dechetsSansDepot = c.sansDepot;
  if (t.cout !== undefined) {
    textes.cout = t.cout == null ? '' : String(t.cout);
    const r = versCoutDesDechets(textes.cout);
    if (r.ok) changements.dechetsCoutCentimes = r.centimes;
    else erreurs.dechetsCoutCentimes = r.message;
  }
  const quantite = Object.prototype.hasOwnProperty.call(changements, 'dechetsQuantiteMilliemes')
    ? changements.dechetsQuantiteMilliemes : x.dechetsQuantiteMilliemes;
  const unite = Object.prototype.hasOwnProperty.call(changements, 'dechetsUnite') ? changements.dechetsUnite : x.dechetsUnite;
  if (present(quantite) && !present(unite)) rappels.dechetsUnite = LES_DECHETS.quantite.sansUnite;
  textes.choix = { ...c };
  return { changements, erreurs, textes, rappels };
}

/* Les champs que vise chaque geste de la carte « Déchets » (T23) : on ne
   vibre que pour le geste qui vise la faute (la règle de `retour.js`). */
const CLES_DU_GESTE_DES_DECHETS = Object.freeze({
  concerne: Object.freeze(['dechetsConcerne']),
  quantite: Object.freeze(['dechetsQuantiteMilliemes', 'dechetsUnite']),
  unite: Object.freeze(['dechetsQuantiteMilliemes', 'dechetsUnite']),
  tri: Object.freeze(['dechetsFlux']),
  surPlace: Object.freeze(['dechetsSurPlace']),
  lieux: Object.freeze(['dechetsLieux', 'dechetsSansDepot']),
  cout: Object.freeze(['dechetsCoutCentimes']),
});

/** VIBRER, OU PAS, pour la carte « Déchets » — la règle de
 *  `vibrerPourLaCarte`, avec la table des gestes de cette carte. */
export function vibrerPourLesDechets(geste, cles, deja = null) {
  return vibrerSelon(CLES_DU_GESTE_DES_DECHETS, geste, cles, deja);
}

/** Les résumés de la rangée « Déchets » (annexe A.3) : son titre est déjà
 *  dit par la rangée, le résumé ne le répète pas. */
const RESUMES_DES_DECHETS = Object.freeze({
  nonConcernes: 'Non concernés',
  remplies: 'Les quatre rubriques sont remplies',
  aCompleter: 'À compléter : ',
  nonLus: 'Lieux de dépôt non lus',
});
const NOMS_DES_RUBRIQUES = Object.freeze({ quantite: 'quantité', tri: 'tri', lieu: 'lieu', cout: 'coût' });

/**
 * LE RÉSUMÉ DE LA RANGÉE « DÉCHETS » (T24, annexe A.3) — un des DIX-HUIT
 * résumés, suivi d'un des trois suffixes d'état :
 *   - « Non concernés » sous « Non » ;
 *   - « Lieux de dépôt non lus » quand la rubrique des lieux est INCONNUE
 *     (des lieux choisis, la liste pas lue) — jamais « remplies », jamais
 *     « à compléter (lieu) » sur une liste qu'on n'a pas lue (T12 bis) ;
 *   - « Les quatre rubriques sont remplies » ;
 *   - « À compléter : » suivi de ce qui manque SEULEMENT, dans l'ordre
 *     quantité, tri, lieu, coût (quinze formes).
 * Le suffixe : « — pas enregistré » quand un champ de la carte est REFUSÉ
 * PAR L'ÉCRAN (`refuse` : un « 0 » tapé ne part jamais dans la file, et la
 * rangée doit le dire — critique ÉCRAN-9 d, corrigée par la contradiction) ;
 * sinon l'état de l'écriture (`enRoute`, `enEchec`, que
 * `etatDesChampsDuDevis` calcule sur `CHAMPS_DES_DECHETS`). Les gabarits
 * (`GABARITS_DES_DECHETS`) comptent les trois : la hauteur ne bouge jamais.
 * L'état de la liste des lieux se lit dans `lieux` seul — non lue
 * (`undefined`, `null`), qu'elle soit en lecture ou en échec, le résumé dit
 * la même chose.
 */
export function resumeDesDechets({
  devis = null, lieux = undefined, enRoute = false, enEchec = false, refuse = false,
} = {}) {
  const d = devis || {};
  const suffixe = refuse ? SUFFIXE_EN_ECHEC : suffixeDEtat({ enRoute, enEchec });
  if (d.dechetsConcerne === false) return `${RESUMES_DES_DECHETS.nonConcernes}${suffixe}`;
  const r = rubriquesDesDechets(d, lieux);
  if (r.lieu === null) return `${RESUMES_DES_DECHETS.nonLus}${suffixe}`;
  const manquent = RUBRIQUES_DES_DECHETS.filter((k) => r[k] !== true);
  if (!manquent.length) return `${RESUMES_DES_DECHETS.remplies}${suffixe}`;
  return `${RESUMES_DES_DECHETS.aCompleter}${manquent.map((k) => NOMS_DES_RUBRIQUES[k]).join(', ')}${suffixe}`;
}

/* Les quinze listes de ce qui peut manquer (toute partie non vide des quatre
   rubriques, dans leur ordre). */
const MANQUES_POSSIBLES = Object.freeze(Array.from({ length: 15 }, (_, i) => i + 1)
  .map((masque) => RUBRIQUES_DES_DECHETS.filter((_, j) => masque & (1 << j))));

/** LES CINQUANTE-QUATRE GABARITS de la rangée : les dix-huit résumés × les
 *  trois suffixes (rien, « — enregistrement… », « — pas enregistré ») — la
 *  règle « garder la grande place » : la rangée ne saute jamais. */
export const GABARITS_DES_DECHETS = Object.freeze([
  RESUMES_DES_DECHETS.nonConcernes,
  RESUMES_DES_DECHETS.remplies,
  ...MANQUES_POSSIBLES.map((m) => `${RESUMES_DES_DECHETS.aCompleter}${m.map((k) => NOMS_DES_RUBRIQUES[k]).join(', ')}`),
  RESUMES_DES_DECHETS.nonLus,
].flatMap((t) => ['', SUFFIXE_EN_ROUTE, SUFFIXE_EN_ECHEC].map((suffixe) => `${t}${suffixe}`)));

/* ================================================================== */
/*  LES TRAVAUX D'ÉNERGIE ET LE LABEL RGE (étape 2b-6, 24/11/2026)      */
/* ================================================================== */
/*
 * CE QUE LA LOI DEMANDE (code de la consommation, L. 224-114 et L. 224-115 ;
 * décret n° 2014-812) — quand un professionnel propose à un particulier des
 * travaux d'économies d'énergie ou d'énergie renouvelable dans un logement,
 * dont les aides exigent un label ou un signe de qualité, le contrat dit :
 * s'il détient ou non un signe de qualité « pour les catégories de travaux
 * concernés » (avec le justificatif, fourni avant la signature), et s'il
 * fait réaliser tout ou partie du contrat par un sous-traitant — l'identité
 * de chacun, et son signe de qualité. Sans ces informations, le contrat
 * conclu avec un consommateur est NUL (L. 242-51), et l'entreprise s'expose
 * à une amende administrative pour la première.
 *
 * CE QUE 2b-6 CONSTRUIT ICI (cahier 2b-6, §3.2) : les quatre faits de la
 * carte « Énergie et label RGE » d'un devis (les travaux cochés, ceux pour
 * lesquels l'artisan déclare ne pas détenir de label, la sous-traitance, les
 * sous-traitants choisis), l'état de chaque travail coché d'après les signes
 * de qualité rangés dans « Mon entreprise », et le point du rang 14 de
 * « Pour le remettre ». Rien n'est imprimé avant 2c.
 *
 * QUATRE RÈGLES, et aucune n'est cosmétique :
 *   - RIEN N'EST COCHÉ SANS UN APPUI (« Opus propose, l'artisan confirme ») :
 *     ni un travail (pas d'après le métier, les lignes, l'origine du devis
 *     ni son objet), ni la déclaration, ni un sous-traitant (même s'il n'y
 *     en a qu'un), ni la réponse à la sous-traitance. `etatInitialEnergie`
 *     ne lit QUE les quatre champs du devis (CTL-10) ;
 *   - JAMAIS DE TABLEAU VIDE : « rien de dit » s'écrit VIDE DE VALEUR
 *     (`null`) ; « Aucun de ces travaux » est une VALEUR à elle (`aucun`),
 *     exclusive ; la dernière case décochée rend `null` ;
 *   - UNE DÉCLARATION NE VAUT QUE POUR CE QU'ELLE NOMME (la leçon du témoin
 *     `pour_qui_client`, BASE-1) : `energieSansLabel` est une liste de
 *     travaux, une case par travail ; cocher un autre travail ne l'étend pas,
 *     et un label valable SANS son certificat garde le point même déclaré
 *     (on ne déclare pas « je n'en détiens pas » d'un signe qu'on détient :
 *     on joint le certificat, ou on retire le signe) ;
 *   - RIEN NE S'EFFACE SANS LE DOIGT SUR CETTE RUBRIQUE (T23) : « Aucun de
 *     ces travaux » ne vide ni les déclarations ni les sous-traitants,
 *     décocher un travail ne retire pas sa déclaration, « Non » à la
 *     sous-traitance ne vide pas les sous-traitants choisis ; tout reste
 *     gardé, sans effet. Un identifiant de sous-traitant ne s'efface que sous
 *     le doigt, sur une liste LUE.
 *
 * LA RÈGLE DU RANG 14 EST ÉCRITE ICI, UNE FOIS (T26) : `etatsDesTravaux` dit
 * l'état de chaque travail coché (couvert, sans certificat, expiré,
 * absent) ; `rubriquesDeLEnergie` en tire les trois rubriques ;
 * `motifDeLEnergie` (le miroir de la base), `resumeDeLEnergie` (la rangée),
 * `rubriqueDeLEnergieDuPoint` (où le point ouvre la carte) et `finDuLabel`
 * (l'avis) les lisent. Aucune autre fonction ne compare un signe de qualité
 * à un travail : une seconde écriture finirait par dire autre chose, et
 * `verifier-devis` la refuse. `etatDuLabel` (`emetteur.js`), qui dit l'état
 * d'UNE ligne dans « Mon entreprise », est faite tourner d'accord avec
 * `etatsDesTravaux` sur un même jeu (CTL-8).
 *
 * LA GARDE TVA (T9, §2.6 du cahier) : rien ici ne lit un taux, le régime de
 * TVA ni la ventilation, et `tauxProposes` / `cleDuTauxDeLaLigne` ne
 * reçoivent jamais un champ de l'énergie. Le label RGE n'est la condition
 * d'aucun taux réduit de rénovation énergétique : un contrôle le tient.
 *
 * LA GARDE DU BADGE (CTL-5) : rien ici ne lit le badge public « Certification
 * RGE » de la fiche (`rge`, `rgeDeclare`, `rgeExpire`, `rgePath`,
 * `rgeNumero`) : un badge public ne dit rien des travaux de CE devis, et
 * `motifs_refus_remise()` ne lit pas `professional_profiles`.
 *
 * Toutes ces fonctions sont PURES : `node` les fait tourner, la carte
 * (`EnergieDevis.js`) ne fait que les appeler.
 */

/** « Aucun de ces travaux » — une VALEUR de `energieTravaux`, exclusive des
 *  autres, écrite par sa SEULE pastille (jamais un tableau vide). Jamais une
 *  catégorie d'un signe de qualité. */
export const ENERGIE_AUCUN = 'aucun';
/** Dix sous-traitants au plus par devis (`devis_energie_sous_traitants_check`). */
export const SOUS_TRAITANTS_MAX = 10;
/** Dix-neuf travaux au plus (la borne de `cardinality` des trois listes de
 *  clés) : autant que de catégories dans `TRAVAUX_ENERGIE`. */
export const TRAVAUX_ENERGIE_MAX = 19;
/** Les deux lignes comptées PAR PRUDENCE (réponse P12 du 24/11 : les
 *  panneaux photovoltaïques, le désembouage) — lues dans `TRAVAUX_ENERGIE`,
 *  jamais recopiées : quand elles seules manquent, le point dit « Par
 *  prudence ». La liste de prudence du rang 14 de la base est comparée à
 *  celle-ci par `verifier-devis`. */
export const CLES_PRUDENCE = Object.freeze(TRAVAUX_ENERGIE.filter((t) => t.prudence).map((t) => t.cle));
/* Les dix-neuf clés, dans l'ORDRE CANONIQUE (celui du décret, puis les deux
   lignes de prudence) ; et celles que le DEVIS accepte, `aucun` en tête — la
   liste de `devis_energie_travaux_check`. */
const CLES_TRAVAUX = Object.freeze(TRAVAUX_ENERGIE.map((t) => t.cle));
const CLES_TRAVAUX_DU_DEVIS = Object.freeze([ENERGIE_AUCUN, ...CLES_TRAVAUX]);

/** Les quatre champs de l'en-tête que la carte écrit — ce que
 *  `etatDesChampsDuDevis` regarde pour la rangée « Énergie (label RGE) ». */
export const CHAMPS_DE_L_ENERGIE = Object.freeze([
  'energieTravaux', 'energieSansLabel', 'energieSousTraitance', 'energieSousTraitants',
]);
/** Les trois rubriques de la carte, dans son ordre. */
export const RUBRIQUES_DE_L_ENERGIE = Object.freeze(['travaux', 'label', 'sousTraitance']);
/** LA RUBRIQUE DE CHAQUE CHAMP — une table À PART de `RUBRIQUE_DU_CHAMP` (la
 *  saisie), qui doit rester EXACTEMENT celle des déchets : « Corriger » un
 *  champ de l'énergie ouvre la carte SUR sa rubrique. */
export const RUBRIQUE_DE_L_ENERGIE = Object.freeze({
  energieTravaux: 'travaux',
  energieSansLabel: 'label',
  energieSousTraitance: 'sousTraitance',
  energieSousTraitants: 'sousTraitance',
});

/* LES MIROIRS DES TROIS CONTRAINTES DE TABLEAU (49.5) — y compris ce que la
   base ACCEPTE (un doublon passe : le rang 14 compte les travaux DISTINCTS)
   et ce qu'elle REFUSE (le tableau vide, par la forme `case … else false`).
   `validerDevis` les lit. */
function travauxRecevables(v) {
  return Array.isArray(v) && v.length >= 1 && v.length <= TRAVAUX_ENERGIE_MAX
    && v.every((c) => CLES_TRAVAUX_DU_DEVIS.includes(c))
    && (v.length === 1 || !v.includes(ENERGIE_AUCUN));
}
function sansLabelRecevable(v) {
  return Array.isArray(v) && v.length >= 1 && v.length <= TRAVAUX_ENERGIE_MAX && v.every((c) => CLES_TRAVAUX.includes(c));
}
function sousTraitantsRecevables(v) {
  return Array.isArray(v) && v.length >= 1 && v.length <= SOUS_TRAITANTS_MAX
    && v.every((x) => typeof x === 'string' && x !== '');
}

/** L'ORDRE CANONIQUE d'une liste de travaux : celui de `TRAVAUX_ENERGIE` ;
 *  sans doublon ; `aucun` et une clé inconnue sont écartés. Elle peut rendre
 *  `[]` : ce sont les fonctions d'appui qui ne l'écrivent jamais. */
export function ordonnerTravaux(liste) {
  const vus = new Set(Array.isArray(liste) ? liste : []);
  return CLES_TRAVAUX.filter((c) => vus.has(c));
}

/* « Aucun de ces travaux », et rien d'autre. */
const estAucun = (v) => Array.isArray(v) && v.length === 1 && v[0] === ENERGIE_AUCUN;

/**
 * CE QU'ÉCRIT UN APPUI dans la question des travaux — `valeur` : la valeur
 * de la carte ; `cle` : la case touchée, ou `ENERGIE_AUCUN` pour la pastille.
 *   - la pastille « Aucun de ces travaux » : allumée, elle s'éteint (`null`,
 *     rien de dit) ; éteinte, elle s'allume (`['aucun']`) et RETIRE les
 *     travaux cochés — dans le même geste, et la carte l'annonce
 *     (`annonceDesTravaux`) ;
 *   - une case : elle se coche ou se décoche, la pastille tombe, l'ordre
 *     canonique est remis ; la DERNIÈRE case décochée rend `null`, jamais
 *     `[]` ;
 *   - une clé inconnue ne change rien (un tableau vide se rend vide de
 *     valeur : aucun chemin ne rend `[]`).
 * Elle ne touche JAMAIS la liste des déclarations, ni les sous-traitants
 * (T23). Toujours un tableau NEUF.
 */
export function travauxApresAppui(valeur, cle) {
  const avant = Array.isArray(valeur) ? valeur : [];
  if (cle === ENERGIE_AUCUN) return avant.includes(ENERGIE_AUCUN) ? null : [ENERGIE_AUCUN];
  if (!CLES_TRAVAUX.includes(cle)) return avant.length ? valeur : null;
  const sans = avant.filter((c) => c !== ENERGIE_AUCUN);
  const apres = sans.includes(cle) ? sans.filter((c) => c !== cle) : [...sans, cle];
  const range = ordonnerTravaux(apres);
  return range.length ? range : null;
}

/** CE QUE LA CARTE ANNONCE quand la pastille « Aucun de ces travaux » vient
 *  de retirer des travaux cochés : « un champ qui change sans geste doit
 *  s'annoncer ». `null` sinon. */
export function annonceDesTravaux(avant, apres) {
  const retire = Array.isArray(avant) && avant.some((c) => c !== ENERGIE_AUCUN);
  return retire && estAucun(apres) ? LE_LABEL.travaux.retires : null;
}

/**
 * CE QU'ÉCRIT UN APPUI sur la case « Je ne détiens pas de label RGE pour ces
 * travaux » sous UN travail — `liste` : la déclaration de la carte ; `cle` :
 * le travail. Ajoute ou retire CETTE clé, et elle seule ; l'ordre canonique ;
 * la dernière retirée rend `null`, jamais `[]` ; une clé inconnue ne change
 * rien. Une clé déclarée pour un travail DÉCOCHÉ reste (T23) : elle est sans
 * effet, et reviendra cochée si le travail est coché de nouveau — visible,
 * sous lui (mesuré, V11).
 */
export function sansLabelApresAppui(liste, cle) {
  if (!CLES_TRAVAUX.includes(cle)) return Array.isArray(liste) && liste.length ? liste : null;
  const avant = Array.isArray(liste) ? liste.filter((c) => CLES_TRAVAUX.includes(c)) : [];
  const apres = avant.includes(cle) ? avant.filter((c) => c !== cle) : [...avant, cle];
  const range = ordonnerTravaux(apres);
  return range.length ? range : null;
}

/* Les identifiants d'une liste LUE (des objets `{ id, … }`), dans son ordre,
   sans doublon. */
const idsDeLaListe = (lus) => [...new Set((Array.isArray(lus) ? lus : [])
  .map((x) => (x && typeof x === 'object' ? x.id : null)).filter((x) => x != null))];

/**
 * CE QU'ÉCRIT UN APPUI sur la case d'un sous-traitant — `choix` : les
 * identifiants que la carte tient (orphelins compris) ; `lus` : la liste de
 * « Mon entreprise » TELLE QU'ELLE EST LUE, ou `undefined`/`null` tant
 * qu'elle ne l'est pas ; `id` : le sous-traitant touché. Rend
 * `{ sousTraitants, plafond }` :
 *   - LISTE NON LUE : RIEN ne change (une liste qu'on n'a pas lue n'est
 *     jamais « aucun sous-traitant ») ;
 *   - un sous-traitant de la liste : il se coche ou se décoche ; le tableau
 *     se REBÂTIT depuis la liste lue, dans SON ordre, ce qui retire les
 *     orphelins (jamais montrés : leur retrait ne s'annonce pas) ; le
 *     dernier décoché rend `null`, jamais `[]` ;
 *   - un identifiant qui n'est pas dans la liste lue ne change rien ;
 *   - LE PLAFOND (la leçon du onzième lieu) : un sous-traitant de PLUS,
 *     quand la liste REBÂTIE dépasserait `SOUS_TRAITANTS_MAX`, ne s'ajoute
 *     pas — le choix est rendu INCHANGÉ, avec `plafond: true`, et la carte
 *     dit pourquoi sans rien écrire. On compte la liste rebâtie, jamais ce
 *     que la carte garde : des orphelins ne comptent pas.
 * C'est le SEUL endroit où `energieSousTraitants` se récrit.
 */
export function sousTraitantsApresAppui(choix, lus, id) {
  const tel = Array.isArray(choix) && choix.length ? choix : null;
  if (!Array.isArray(lus)) return { sousTraitants: tel, plafond: false };
  const ids = idsDeLaListe(lus);
  if (!ids.includes(id)) return { sousTraitants: tel, plafond: false };
  const choisis = new Set(tel || []);
  const ajout = !choisis.has(id);
  if (ajout) choisis.add(id); else choisis.delete(id);
  const range = ids.filter((v) => choisis.has(v));
  if (ajout && range.length > SOUS_TRAITANTS_MAX) return { sousTraitants: tel, plafond: true };
  return { sousTraitants: range.length ? range : null, plafond: false };
}

/**
 * LE RANG 14 PARLE-T-IL POUR CETTE RÉPONSE ? — vrai pour une réponse
 * « à quel titre » VALABLE vide (par prudence), « à titre privé » (la loi),
 * ou « une association, une copropriété ou une société civile » (par
 * prudence) ; faux pour les deux réponses « pour son entreprise » : L. 224-114
 * vit dans la section 21 du chapitre IV, et L. 221-3 n'étend aux petites
 * entreprises hors de leur activité principale que les sections 2, 3 et 6
 * (T6). Le miroir de `v_valable is null or v_valable in ('consommateur',
 * 'non_professionnel')` — jamais un `not in`.
 */
export function energieConcerne(valable) {
  return valable === null || valable === undefined || valable === 'consommateur' || valable === 'non_professionnel';
}

/** LES TRAVAUX COCHÉS d'un devis : ses clés DISTINCTES, dans l'ordre où il
 *  les porte ; `[]` pour « Aucun de ces travaux » ou rien de dit. */
export function travauxCoches(devis) {
  const v = devis && Array.isArray(devis.energieTravaux) ? devis.energieTravaux : null;
  if (!v || !v.length || estAucun(v)) return [];
  return [...new Set(v.filter((c) => c != null))];
}

/* L'entreprise d'une ligne de « Mon entreprise » : `proId` ou `pro_id`. Une
   ligne qui ne dit pas son entreprise n'est pas écartée (la règle de
   `etatDeLAttestation` : la démonstration et la lecture de l'application ne
   rendent que les lignes de l'artisan). */
const entrepriseDeLaLigne = (x) => (x ? (x.proId ?? x.pro_id ?? null) : null);
const deLEntreprise = (x, pro) => pro == null || entrepriseDeLaLigne(x) == null
  || String(entrepriseDeLaLigne(x)) === String(pro);

/** Les quatre états d'un travail coché (T26). */
export const ETATS_DU_TRAVAIL = Object.freeze(['couvert', 'sans_certificat', 'expire', 'absent']);

/**
 * L'ÉTAT DE CHAQUE TRAVAIL COCHÉ (T26) — `[{ cle, etat, intitule, fin }]`
 * dans l'ordre des travaux du devis, ou `null` quand la liste des signes de
 * qualité n'est pas LUE (`labels` n'est pas un tableau). `labels` : les
 * lignes d'`emetteur_labels`, aux noms de la base ; seules celles de
 * l'entreprise du devis comptent (`proId`, celui du devis par défaut — le
 * miroir de `g.pro_id = v_pro`). Un signe « porte » un travail quand ses
 * `categories` le nomment ; il est VALABLE quand sa date de fin est au moins
 * `jour` (le jour du TÉLÉPHONE par défaut ; la base juge au jour de Paris) ;
 * son certificat est JOINT quand son chemin est écrit.
 *   - `couvert` : un signe valable et joint le porte — `fin` est la PLUS
 *     TARDIVE de ces signes, `intitule` le sien ;
 *   - `sans_certificat` : un signe valable le porte, mais aucun n'a son
 *     certificat — le point reste, déclaré ou non (DROIT-1) ;
 *   - `expire` : un signe le porte, mais aucun n'est valable (fin passée,
 *     certificat joint ou non) — `fin`, la plus tardive ; la déclaration
 *     reste possible : un signe à date passée n'est plus détenu ;
 *   - `absent` : aucun signe de l'entreprise ne le porte.
 */
export function etatsDesTravaux(devis, labels, { proId = undefined, jour = jourDuTelephone() } = {}) {
  if (!Array.isArray(labels)) return null;
  const d = devis || {};
  const pro = proId !== undefined ? proId : (d.proId ?? null);
  const auJour = jourEcrit(jour) || jourDuTelephone();
  const lesSiens = labels.filter((l) => l && typeof l === 'object' && deLEntreprise(l, pro));
  const fin = (l) => jourEcrit(l.valide_jusquau);
  /* Le plus tardif d'une liste : une fin absente compte la plus petite ; à
     égalité, le premier de la liste. */
  const plusTardif = (liste) => liste.reduce((m, l) => {
    if (m === null) return l;
    const a = fin(l); const b = fin(m);
    return a !== null && (b === null || a > b) ? l : m;
  }, null);
  return travauxCoches(d).map((cle) => {
    const portent = lesSiens.filter((l) => Array.isArray(l.categories) && l.categories.includes(cle));
    const valables = portent.filter((l) => { const f = fin(l); return f !== null && f >= auJour; });
    const joints = valables.filter((l) => cheminEcrit(l.justificatif_chemin));
    let etat = 'absent';
    let qui = null;
    if (joints.length) { etat = 'couvert'; qui = plusTardif(joints); }
    else if (valables.length) { etat = 'sans_certificat'; qui = plusTardif(valables); }
    else if (portent.length) { etat = 'expire'; qui = plusTardif(portent); }
    return { cle, etat, intitule: qui ? (qui.intitule ?? null) : null, fin: qui ? fin(qui) : null };
  });
}

/**
 * UN SOUS-TRAITANT EST-IL COMPLET ? (T20) — la question de son label a une
 * réponse : « Non » (`label_detient === false`), ou « Oui » avec une date de
 * fin au moins égale à `jour` et, si `justificatifExige` (réponse P13 du
 * 24/11 : « Oui, dans Opus »), son justificatif joint. La date se juge « pas
 * `fin >= jour` », jamais `fin < jour` : une date vide ne compte jamais
 * valable (CTL-7). `proId` : l'entreprise du devis ; un sous-traitant d'une
 * AUTRE entreprise n'est jamais complet (`rubriquesDeLEnergie` ne les lui
 * passe pas : elle les écarte d'abord, comme la base).
 *
 * SON IDENTITÉ (nom ou raison sociale, SIRET) N'EST PAS JUGÉE ICI par
 * défaut, et c'est la parité qui l'impose : le rang 14 de la base ne la lit
 * pas, parce que la contrainte `emetteur_sous_traitant_complet_check` la
 * GARANTIT — une ligne sans identité n'existe pas en base. L'exiger ici
 * rendait « incomplet » chaque sous-traitant que la base lit sans ces deux
 * colonnes (mesuré sur `cas-remise.json`, cas 213, 215 et 219 : le miroir
 * disait `devis_energie_mentions`, la base rien). Un écran qui juge une
 * fiche PAS ENCORE enregistrée passe `identiteExigee: true`.
 */
export function sousTraitantComplet(st, {
  proId = null, jour = jourDuTelephone(), justificatifExige = true, identiteExigee = false,
} = {}) {
  if (!st || typeof st !== 'object') return false;
  if (!deLEntreprise(st, proId)) return false;
  if (identiteExigee && (texteNet(st.raison_sociale) === null || texteNet(st.siret) === null)) return false;
  if (st.label_detient === false) return true;
  if (st.label_detient !== true) return false;
  const auJour = jourEcrit(jour) || jourDuTelephone();
  const f = jourEcrit(st.label_valide_jusquau);
  if (!(f !== null && f >= auJour)) return false;
  return !justificatifExige || cheminEcrit(st.label_justificatif_chemin);
}

/**
 * LES TROIS RUBRIQUES, PRÉSENTES OU NON — LA règle du rang 14, écrite ICI
 * UNE FOIS (T26), la même que `motifs_refus_remise()` (49.9). Rend
 * `{ travaux, label, sousTraitance, labelLoi, labelPrudence }` :
 *   - `travaux` : la liste est dite (`['aucun']` compte) ;
 *   - `label` : VRAI quand aucun travail coché ne MANQUE — un travail manque
 *     quand il n'est pas couvert ET (qu'il est porté par un signe valable
 *     sans certificat, OU qu'il n'est pas déclaré sans label) ; `labelLoi`
 *     et `labelPrudence` comptent les travaux qui manquent, hors et parmi
 *     les deux lignes de prudence ; `null` (INCONNU) quand la liste des
 *     signes de qualité n'est pas lue ;
 *   - `sousTraitance` : VRAI pour « Non », ou pour « Oui » quand au moins un
 *     sous-traitant choisi existe CHEZ L'ENTREPRISE DU DEVIS et que TOUS
 *     ceux-là sont complets (les identifiants DISTINCTS, un orphelin ou celui
 *     d'une autre entreprise ne compte jamais) ; FAUX sans réponse, ou pour
 *     « Oui » sans aucun identifiant ; `null` (INCONNU) pour « Oui » avec des
 *     identifiants et une liste pas lue.
 * Sous « Aucun de ces travaux », ou sans réponse aux travaux, `label` et
 * `sousTraitance` sont vrais : la base ne fait alors pas la lecture 3 quater
 * (ses compteurs restent à zéro). Le miroir (`motifDeLEnergie`) passe des
 * listes LUES : une liste non transmise y vaut une liste vide.
 */
export function rubriquesDeLEnergie(devis, labels, sousTraitants, jour = jourDuTelephone()) {
  const d = devis || {};
  const travaux = Array.isArray(d.energieTravaux) && d.energieTravaux.length > 0;
  if (!travaux || estAucun(d.energieTravaux)) {
    return { travaux, label: true, sousTraitance: true, labelLoi: 0, labelPrudence: 0 };
  }
  const etats = etatsDesTravaux(d, labels, { jour });
  let label = null;
  let labelLoi = null;
  let labelPrudence = null;
  if (etats !== null) {
    const declares = Array.isArray(d.energieSansLabel) ? d.energieSansLabel : [];
    labelLoi = 0;
    labelPrudence = 0;
    etats.forEach((e) => {
      const manque = e.etat !== 'couvert' && (e.etat === 'sans_certificat' || !declares.includes(e.cle));
      if (!manque) return;
      if (CLES_PRUDENCE.includes(e.cle)) labelPrudence += 1; else labelLoi += 1;
    });
    label = labelLoi + labelPrudence === 0;
  }
  let sousTraitance;
  if (d.energieSousTraitance === false) sousTraitance = true;
  else if (d.energieSousTraitance !== true) sousTraitance = false;
  else {
    const ids = Array.isArray(d.energieSousTraitants) ? d.energieSousTraitants.filter((v) => v != null) : [];
    if (!ids.length) sousTraitance = false;
    else if (!Array.isArray(sousTraitants)) sousTraitance = null;
    else {
      const pro = d.proId ?? null;
      const vus = new Set();
      const choisis = sousTraitants.filter((s) => {
        if (!s || typeof s !== 'object' || s.id == null || !ids.includes(s.id) || !deLEntreprise(s, pro)) return false;
        if (vus.has(String(s.id))) return false;
        vus.add(String(s.id));
        return true;
      });
      sousTraitance = choisis.length > 0 && choisis.every((s) => sousTraitantComplet(s, { proId: pro, jour }));
    }
  }
  return { travaux, label, sousTraitance, labelLoi, labelPrudence };
}

/**
 * LE MIROIR DU RANG 14 — la clé, ou `null`. `valable` : la réponse « à quel
 * titre » VALABLE (celle de `pourQuiValable`, calculée par `motifsDeRemise`).
 *   - la réponse n'est pas de celles où le rang parle (`energieConcerne`) :
 *     rien ;
 *   - les travaux ne sont pas dits : `devis_energie` (prudence) ;
 *   - une rubrique manque : `devis_energie_mentions` (la loi) quand le
 *     client commande à titre privé ET que ce qui manque touche un travail
 *     du décret ou la sous-traitance ; `devis_energie_mentions_prudence`
 *     sinon (une association, une copropriété, une société civile, une
 *     réponse vide — ou seules les deux lignes de prudence qui manquent).
 * UNE clé au plus. Des listes non transmises (`undefined`, `null`) valent
 * des listes vides : un signe de qualité qu'on n'a pas lu ne couvre rien, la
 * règle des lieux de 2b-5.
 */
export function motifDeLEnergie(devis, labels, sousTraitants, jour = jourDuTelephone(), valable = pourQuiValable(devis)) {
  if (!energieConcerne(valable)) return null;
  const r = rubriquesDeLEnergie(devis, Array.isArray(labels) ? labels : [],
    Array.isArray(sousTraitants) ? sousTraitants : [], jour);
  if (!r.travaux) return 'devis_energie';
  const stManque = r.sousTraitance !== true;
  if (r.labelLoi === 0 && r.labelPrudence === 0 && !stManque) return null;
  return valable === 'consommateur' && (r.labelLoi > 0 || stManque)
    ? 'devis_energie_mentions' : 'devis_energie_mentions_prudence';
}

/**
 * OÙ LE POINT DU RANG 14 OUVRE LA CARTE : `'travaux'` pour `devis_energie`
 * (la question, en haut : on répond d'abord) ; la PREMIÈRE rubrique qui
 * manque (le label, puis la sous-traitance) pour les deux autres, et
 * `'travaux'` à défaut (la liste de la base peut être plus récente que
 * celles de l'écran) ; `null` pour tout autre point. Une rubrique INCONNUE
 * (une liste pas lue) compte comme manquante.
 */
export function rubriqueDeLEnergieDuPoint(point, {
  devis = null, labels = undefined, sousTraitants = undefined, jour = jourDuTelephone(),
} = {}) {
  const cle = point && typeof point.cle === 'string' ? point.cle : null;
  if (cle === 'devis_energie') return 'travaux';
  if (cle !== 'devis_energie_mentions' && cle !== 'devis_energie_mentions_prudence') return null;
  const r = rubriquesDeLEnergie(devis, labels, sousTraitants, jour);
  if (r.label !== true) return 'label';
  if (r.sousTraitance !== true) return 'sousTraitance';
  return 'travaux';
}

/**
 * LA CASE « JE NE DÉTIENS PAS DE LABEL RGE POUR CES TRAVAUX » EST-ELLE
 * MONTRÉE sous un travail ? (§3.8 du cahier) — `etat` : celui que rend
 * `etatsDesTravaux` (`null` quand la liste n'est pas lue) ; `declaree` : la
 * clé est déjà dans la déclaration.
 *   - une case DÉJÀ COCHÉE est toujours montrée, quel que soit l'état : on
 *     doit pouvoir la décocher (ses travaux viennent du devis) ;
 *   - sinon, seulement sous un travail `expire` ou `absent` : jamais sous un
 *     travail `sans_certificat` (on joint le certificat, ou on retire le
 *     signe), ni `couvert`, ni sur une liste en lecture ou en échec — on ne
 *     sait pas alors ce qui est couvert (ÉCRAN-10).
 */
export function declarationMontree({ etat = null, declaree = false } = {}) {
  if (declaree === true) return true;
  return etat === 'expire' || etat === 'absent';
}

/**
 * LA FIN DE SIGNE DE QUALITÉ QUI FAIT PARLER L'AVIS `avis_label_echeance`
 * (T31) — `{ fin, intitule }` (« AAAA-MM-JJ »), ou `null` quand l'avis se
 * tait. Le jumeau de `finDeLAttestation` :
 *   - il se tait pour une réponse « entreprise » (celle de l'ÉCRAN,
 *     `pourQuiValable(devis)`, ou `valable` si on la passe), sous « Aucun de
 *     ces travaux » ou sans travaux, si la liste des signes de qualité n'est
 *     pas LUE, ou si la validité n'est pas dite ;
 *   - la fin qui parle est le MINIMUM, sur les travaux cochés et COUVERTS, de
 *     la fin la plus TARDIVE qui couvre chacun (`etatsDesTravaux`) — deux
 *     signes qui couvrent le même travail ne font pas sonner un avis faux
 *     (ÉCRAN-7) ; l'intitulé est celui du signe qui donne cette fin ;
 *   - l'horizon est celui de l'attestation : la validité, plus
 *     `JOURS_DU_DELAI_PAR_DEFAUT` quand le délai écrit est EXACTEMENT le
 *     délai par défaut ; l'avis parle si la fin tombe AVANT.
 * Un travail qui n'est pas couvert ne la fait pas parler : le point le dit
 * déjà.
 */
export function finDuLabel({ devis = null, labels = undefined, jour = jourDuTelephone(), valable = undefined } = {}) {
  const d = devis || {};
  if (!energieConcerne(valable !== undefined ? valable : pourQuiValable(d))) return null;
  if (!Array.isArray(labels)) return null;
  if (!entier(d.validiteJours) || d.validiteJours < 1) return null;
  const auJour = jourEcrit(jour) || jourDuTelephone();
  const couverts = (etatsDesTravaux(d, labels, { jour: auJour }) || []).filter((e) => e.etat === 'couvert' && e.fin !== null);
  if (!couverts.length) return null;
  const premier = couverts.reduce((m, e) => (m === null || e.fin < m.fin ? e : m), null);
  const parDefaut = texteNet(d.delaiExecution) === DELAI_PAR_DEFAUT.texte;
  const horizon = d.validiteJours + (parDefaut ? JOURS_DU_DELAI_PAR_DEFAUT : 0);
  const reste = joursEntre(auJour, premier.fin);
  return reste !== null && reste < horizon ? { fin: premier.fin, intitule: premier.intitule } : null;
}

/**
 * L'AMENDE QUE LA LOI PRÉVOIT pour les informations du label (L. 242-51 :
 * le contrat conclu avec un consommateur est nul ; et, pour L. 224-114,
 * l'amende administrative ; réponse P14 du 24/11 : « Les deux ») — écrite
 * UNE fois, et seulement dans l'aide de la carte, jamais dans une phrase du
 * point. La QUATRIÈME constante de ce fichier qui écrit « € » (après
 * `AMENDE_DE_LA_LOI`, `AMENDE_DU_CODE_DE_LA_CONSTRUCTION` et
 * `AMENDE_DES_DECHETS`), tenue par `verifier-devis` : une phrase de droit,
 * pas un montant d'un devis. Espaces insécables entre les chiffres et devant
 * « € » : un montant ne se coupe pas en fin de ligne.
 * Et celle de la sous-traitance, qui ne nomme AUCUNE amende : la loi n'en
 * prévoit pas pour L. 224-115 (DROIT-23).
 */
export const AMENDE_DU_LABEL = 'Pour un client qui commande à titre privé, sans ces informations, le contrat est nul, et votre '
  + 'entreprise s’expose à une amende administrative '
  + 'pouvant aller jusqu’à 15\u00a0000\u00a0€, 75\u00a0000\u00a0€ pour une société.';
export const AMENDE_DE_LA_SOUS_TRAITANCE = 'Pour un client qui commande à titre privé, sans ces informations, le contrat est nul.';

/**
 * LES TEXTES DE LA CARTE « ÉNERGIE ET LABEL RGE », DE SA RANGÉE ET DE SON
 * POINT (annexes A.1, A.3 et A.4 du cahier 2b-6), mot pour mot. Ils parlent
 * à l'ARTISAN : ce ne sont pas les textes imprimés (2c).
 * LE VOCABULAIRE (T10) : « signe de qualité (label RGE) », « vous détenez »,
 * « vous déclarez » ; jamais « certifié », « agréé », « vérifié »,
 * « garanti », « Reconnu garant de l’environnement » — `verifier-devis` les
 * refuse dans ces constantes. « Certificat » est permis : c'est la pièce.
 * Les modèles à trous (`{intitule}`, `{fin}`) se remplissent dans
 * `phraseDuTravail`.
 */
export const LE_LABEL = Object.freeze({
  titre: 'Énergie et label RGE',
  /* La rangée de la saisie (annexe A.4) : son titre, que le résumé ne répète
     pas (VoiceOver dit « Titre : résumé. Ouvrir »). */
  rangee: 'Énergie (label RGE)',
  /* Le bouton du point, pour les trois clés du rang 14 (annexe A.1). */
  bouton: 'Compléter : énergie et label RGE',
  introduction: 'Pour des travaux d’économies d’énergie ou d’énergie renouvelable chez un client qui commande à titre '
    + 'privé, la loi demande de dire sur le devis si vous détenez un label RGE, et qui fera les travaux.',
  /* Pour une association, une copropriété, une société civile (DROIT-9). */
  prudenceAssociation: 'Pour une association, une copropriété ou une société civile, la loi ne prévoit peut-être pas ces '
    + 'mentions ; Opus les demande, par prudence.',
  /* Pour une réponse « à quel titre » vide. */
  prudenceSansReponse: 'Tant que vous n’avez pas dit à quel titre ce client commande, Opus les demande, par prudence.',
  /* Pour un client « entreprise » : la seule phrase ; rien n'est effacé. */
  entreprise: 'Ce client commande pour son entreprise : la loi ne demande pas ces mentions. Ce que vous avez déjà écrit '
    + 'est gardé.',
  /* Le sous-titre des rubriques : jamais « Pour la loi », qui ne vise qu'à
     titre privé (DROIT-9). */
  sousTitre: 'Pour les droits de votre client',
  travaux: Object.freeze({
    question: 'Quels travaux d’économies d’énergie ou d’énergie renouvelable ce devis comporte-t-il ?',
    /* La pastille, EN TÊTE, sous la question (ÉCRAN-3), et sa phrase. */
    aucun: 'Aucun de ces travaux',
    sousAucun: 'Seulement si ce devis ne comporte aucun des travaux ci-dessous.',
    /* P12 = 1 : la sous-traitance d'AUTRES travaux d'économies d'énergie
       (L. 224-115 I ne pose pas la condition d'aide, DROIT-6).
       RÉCRITE par la décision du propriétaire du 24/11/2026 (relecture
       2b-6, DROIT6-3) : L. 224-115 III veut ces informations « dans le
       contrat » — « dites-le à votre client » se contentait de l'oral —, et
       L. 224-115 I vise aussi l'énergie renouvelable. Une ligne « Réserve »
       du devis porte déjà un texte libre : c'est la place que la phrase
       nomme. Mot pour mot, sa phrase à lui. */
    sousAucunSousTraitance: 'Même alors, si une autre entreprise fait une partie de travaux d’économies d’énergie ou '
      + 'd’énergie renouvelable de ce devis, écrivez-le sur le devis, par exemple dans une réserve : la loi peut le '
      + 'demander.',
    /* « Ce que ce devis comporte, même fait par un sous-traitant » (relecture
       DROIT6-11, c) : la question et la loi visent les travaux du CONTRAT,
       sous-traités compris. « Ce que vous ferez » laissait un artisan qui
       sous-traite toute la VMC choisir « Aucun », et la question de la
       sous-traitance disparaissait. */
    aide: 'Cochez ce que ce devis comporte dans un logement, même fait par un sous-traitant, même une petite partie : un '
      + 'doublage isolé, une VMC, une fenêtre. Les deux dernières lignes sont comptées par prudence. Dans le doute, '
      + 'cochez : c’est le cas le plus sûr.',
    /* Annoncé quand la pastille retire des cases cochées. */
    retires: 'Les travaux cochés ont été retirés.',
  }),
  label: Object.freeze({
    sousTitre: 'Votre label RGE',
    /* Les quatre états d'un travail coché (`phraseDuTravail`). « Déclaré
       dans », jamais « Couvert par » : Opus ne vérifie pas le signe
       (DROIT-16). */
    couvert: 'Déclaré dans « Mon entreprise » : {intitule}, valable jusqu’au {fin}',
    sansCertificat: 'Votre signe de qualité « {intitule} » porte ces travaux, mais son certificat n’est pas joint : '
      + 'joignez-le dans « Mon entreprise », ou retirez-le si vous ne le détenez plus.',
    expire: 'Votre signe de qualité « {intitule} » portait ces travaux jusqu’au {fin} : renouvelez-le dans « Mon '
      + 'entreprise » si vous le détenez encore.',
    absent: 'Aucun de vos signes de qualité ne porte ces travaux.',
    /* La case, sous un travail expiré ou absent, et son aide — sans
       promesse sur les aides (DROIT-13). La seconde phrase (relecture
       DROIT6-8) dit ce qu'Opus ne fait PAS : L. 224-114 I demande aussi de
       dire au client ce que l'absence de label change pour ses aides, et
       rien, après la case, ne le disait à l'artisan. */
    declaration: 'Je ne détiens pas de label RGE pour ces travaux',
    aideDeclaration: 'Cochez seulement si c’est vrai : le devis le dira à votre client. Ce que cela change pour ses aides, '
      + 'Opus ne l’écrit pas encore.',
    echec: 'Vos signes de qualité n’ont pas pu être lus.',
    reessayer: 'Réessayer',
    vide: 'Vous n’avez déclaré aucun signe de qualité.',
    /* La porte vers « Mon entreprise », section des signes de qualité. */
    porte: 'Mes signes de qualité',
  }),
  sousTraitance: Object.freeze({
    sousTitre: 'Sous-traitance',
    /* « des travaux de ce devis » : la loi dit « l'exécution du contrat »
       (DROIT-7). « Non » à GAUCHE, rien de choisi. */
    question: 'Une autre entreprise fera-t-elle une partie, ou la totalité, des travaux de ce devis ?',
    non: 'Non',
    oui: 'Oui',
    lesquelles: 'Laquelle, ou lesquelles ?',
    echec: 'Vos sous-traitants n’ont pas pu être lus.',
    reessayer: 'Réessayer',
    vide: 'Vous n’avez encore aucun sous-traitant.',
    ajouter: 'Ajouter un sous-traitant',
    /* La porte vers « Mon entreprise », section des sous-traitants. */
    porte: 'Mes sous-traitants',
    /* Un sous-traitant de plus que `SOUS_TRAITANTS_MAX` : MONTRÉ juste sous
       les cases, annoncé, rien n'est écrit. */
    plafond: 'Dix sous-traitants au plus par devis : décochez-en un pour en choisir un autre.',
    /* BORNÉE au client qui commande à titre privé (relecture DROIT6-5) :
       L. 224-115 ne vise que le consommateur, et la carte d'une association
       dit en tête « la loi ne prévoit peut-être pas ces mentions » — une
       aide qui disait « La loi demande » tout court la contredisait sur le
       même écran (la forme de DROIT-R4, 2b-5). */
    aide: 'Pour un client qui commande à titre privé, la loi demande de nommer, avant la signature, chaque entreprise '
      + 'qui fera une partie des travaux de ce devis, et de dire si elle détient un label RGE.',
  }),
  amende: AMENDE_DU_LABEL,
  amendeSousTraitance: AMENDE_DE_LA_SOUS_TRAITANCE,
});

/** CE QUE LA CARTE DIT D'UN TRAVAIL COCHÉ, selon son état (`etatsDesTravaux`)
 *  — `null` pour un état inconnu (une liste pas lue : rien n'est dit). La
 *  date s'écrit « JJ/MM/AAAA ». */
export function phraseDuTravail(e) {
  if (!e || typeof e !== 'object') return null;
  const L = LE_LABEL.label;
  /* Un seul passage, par une fonction (relecture ÉCRAN-3) : l'intitulé est
     TAPÉ par l'artisan, et un « $' » ou un « {fin} » qu'il contient ne doit
     rien remplacer. */
  const remplir = (modele) => modele.replace(/\{(intitule|fin)\}/g,
    (_, k) => (k === 'intitule' ? (e.intitule ?? '') : (dateFrancaise(e.fin) ?? '')));
  if (e.etat === 'couvert') return remplir(L.couvert);
  if (e.etat === 'sans_certificat') return remplir(L.sansCertificat);
  if (e.etat === 'expire') return remplir(L.expire);
  if (e.etat === 'absent') return L.absent;
  return null;
}

/** L'INTRODUCTION DE LA CARTE selon la réponse « à quel titre » VALABLE de
 *  l'écran (§3.8, DROIT-9) — une liste de phrases : à titre privé,
 *  l'introduction ; pour une association, une copropriété ou une société
 *  civile, l'introduction et la prudence ; sans réponse, l'introduction et
 *  la prudence de la réponse vide ; pour un client « entreprise », la seule
 *  phrase qui dit que la loi ne demande rien (rien n'est effacé). */
export function introductionDeLEnergie(valable) {
  if (!energieConcerne(valable)) return [LE_LABEL.entreprise];
  if (valable === 'non_professionnel') return [LE_LABEL.introduction, LE_LABEL.prudenceAssociation];
  if (valable === 'consommateur') return [LE_LABEL.introduction];
  return [LE_LABEL.introduction, LE_LABEL.prudenceSansReponse];
}

/**
 * L'ÉTAT DE LA CARTE À SON OUVERTURE (CTL-10) — `{ travaux, sansLabel,
 * sousTraitance, sousTraitants }`, lu dans les QUATRE champs du devis, et
 * rien d'autre : jamais `source`, `quoteRequestId`, `sosRequestId` ni
 * `objet` (un devis venu d'une urgence « isolation des combles » ne coche
 * rien), jamais le métier, jamais les signes de qualité de « Mon
 * entreprise » (un artisan dont un label couvre les combles ne les voit pas
 * cochés d'office). Sur un devis vierge, TOUT est vide. Les listes sont
 * recopiées NEUVES, un tableau vide devient `null`.
 */
export function etatInitialEnergie(devis) {
  const x = devis || {};
  return {
    travaux: tableauLu(x.energieTravaux),
    sansLabel: tableauLu(x.energieSansLabel),
    sousTraitance: x.energieSousTraitance === true ? true : (x.energieSousTraitance === false ? false : null),
    sousTraitants: tableauLu(x.energieSousTraitants),
  };
}

/**
 * CE QUE LA CARTE PORTE À CET INSTANT (le modèle de `lireDechets`) —
 * `changements` (les quatre champs TELS QUE LA CARTE LES TIENT : la saisie
 * n'envoie que ce qui DIFFÈRE de l'en-tête, par `memeValeur`) et `textes`
 * (les `choix` de la carte). La carte n'a AUCUN champ tapé : rien ne s'y
 * refuse, donc aucune `erreurs`. AUCUNE normalisation des listes : un
 * tableau vide (que les fonctions d'appui n'écrivent jamais) partirait tel
 * quel, et la base le REFUSERAIT — un défaut visible, jamais un silence.
 */
export function lireEnergie({ choix = null, devis = {} } = {}) {
  const c = choix || etatInitialEnergie(devis);
  const changements = {};
  if (c.travaux !== undefined) changements.energieTravaux = c.travaux;
  if (c.sansLabel !== undefined) changements.energieSansLabel = c.sansLabel;
  if (c.sousTraitance !== undefined) changements.energieSousTraitance = c.sousTraitance;
  if (c.sousTraitants !== undefined) changements.energieSousTraitants = c.sousTraitants;
  return { changements, erreurs: {}, textes: { choix: { ...c } } };
}

/** Les résumés de la rangée « Énergie (label RGE) » (annexe A.4) : son titre
 *  est déjà dit par la rangée, le résumé ne le répète pas. */
const RESUMES_DE_L_ENERGIE = Object.freeze({
  sansObjet: 'Sans objet pour ce client',
  aucun: 'Aucun de ces travaux',
  aDire: 'Travaux d’énergie : à dire',
  dits: 'Label et sous-traitance : dits',
  aCompleter: 'À compléter : ',
  nonLus: 'Labels ou sous-traitants non lus',
});
const NOMS_DES_RUBRIQUES_DE_L_ENERGIE = Object.freeze({ label: 'label', sousTraitance: 'sous-traitance' });

/**
 * LE RÉSUMÉ DE LA RANGÉE « ÉNERGIE (LABEL RGE) » (T25, annexe A.4) — un des
 * HUIT résumés, suivi d'un des trois suffixes d'état :
 *   - « Sans objet pour ce client » pour une réponse « entreprise » (la
 *     rangée reste à sa place : elle ne saute pas) ;
 *   - « Travaux d’énergie : à dire » quand la liste est vide ;
 *   - « Aucun de ces travaux » ;
 *   - « Labels ou sous-traitants non lus » quand une rubrique est INCONNUE —
 *     jamais « dits », jamais « à compléter » sur une liste qu'on n'a pas
 *     lue ;
 *   - « Label et sous-traitance : dits » ;
 *   - « À compléter : » suivi de ce qui manque SEULEMENT (label,
 *     sous-traitance).
 * Le suffixe : « — pas enregistré » quand un champ est refusé par l'écran
 * (`refuse`), sinon l'état de l'écriture (`enRoute`, `enEchec`, que
 * `etatDesChampsDuDevis` calcule sur `CHAMPS_DE_L_ENERGIE`). Les gabarits
 * (`GABARITS_DE_L_ENERGIE`) comptent les trois : la hauteur ne bouge jamais.
 */
export function resumeDeLEnergie({
  devis = null, labels = undefined, sousTraitants = undefined, enRoute = false, enEchec = false, refuse = false,
  jour = jourDuTelephone(),
} = {}) {
  const d = devis || {};
  const suffixe = refuse ? SUFFIXE_EN_ECHEC : suffixeDEtat({ enRoute, enEchec });
  if (!energieConcerne(pourQuiValable(d))) return `${RESUMES_DE_L_ENERGIE.sansObjet}${suffixe}`;
  const r = rubriquesDeLEnergie(d, labels, sousTraitants, jour);
  if (!r.travaux) return `${RESUMES_DE_L_ENERGIE.aDire}${suffixe}`;
  if (estAucun(d.energieTravaux)) return `${RESUMES_DE_L_ENERGIE.aucun}${suffixe}`;
  if (r.label === null || r.sousTraitance === null) return `${RESUMES_DE_L_ENERGIE.nonLus}${suffixe}`;
  const manquent = ['label', 'sousTraitance'].filter((k) => r[k] !== true);
  if (!manquent.length) return `${RESUMES_DE_L_ENERGIE.dits}${suffixe}`;
  return `${RESUMES_DE_L_ENERGIE.aCompleter}${manquent.map((k) => NOMS_DES_RUBRIQUES_DE_L_ENERGIE[k]).join(', ')}${suffixe}`;
}

/** LES VINGT-QUATRE GABARITS de la rangée : les huit résumés × les trois
 *  suffixes (rien, « — enregistrement… », « — pas enregistré ») — la règle
 *  « garder la grande place » : la rangée ne saute jamais. Le plus long fait
 *  53 caractères, moins que ceux des déchets. */
export const GABARITS_DE_L_ENERGIE = Object.freeze([
  RESUMES_DE_L_ENERGIE.sansObjet,
  RESUMES_DE_L_ENERGIE.aucun,
  RESUMES_DE_L_ENERGIE.aDire,
  RESUMES_DE_L_ENERGIE.dits,
  `${RESUMES_DE_L_ENERGIE.aCompleter}${NOMS_DES_RUBRIQUES_DE_L_ENERGIE.label}`,
  `${RESUMES_DE_L_ENERGIE.aCompleter}${NOMS_DES_RUBRIQUES_DE_L_ENERGIE.sousTraitance}`,
  `${RESUMES_DE_L_ENERGIE.aCompleter}${NOMS_DES_RUBRIQUES_DE_L_ENERGIE.label}, ${NOMS_DES_RUBRIQUES_DE_L_ENERGIE.sousTraitance}`,
  RESUMES_DE_L_ENERGIE.nonLus,
].flatMap((t) => ['', SUFFIXE_EN_ROUTE, SUFFIXE_EN_ECHEC].map((suffixe) => `${t}${suffixe}`)));
