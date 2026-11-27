/**
 * LE DOCUMENT D'UN DEVIS — l'instantané devenu des PHRASES (étape 2c-1,
 * cahier §4.2 à §4.8).
 *
 * CE QUE CE FICHIER FAIT
 * ----------------------
 * Il reçoit un instantané (`instantane-devis.js` : des FAITS aux noms de la
 * base) et rend un objet de CHAÎNES, bloc par bloc, dans l'ordre de la page
 * (§4.3). Le gabarit (`devis-html.js`) ne fera que les ranger et les
 * échapper : il ne calcule rien. Rien ici ne lit une horloge, un fuseau ou
 * la base : une même entrée donne la même sortie, partout (A.6).
 *
 * IL N'ÉCRIT AUCUNE PHRASE QU'UNE FONCTION EXISTANTE ÉCRIT DÉJÀ (§4.2) :
 * l'identité, les mentions et la source viennent d'`enteteImprimeDetaille` ;
 * les totaux de `rangeesImprimees` ; les montants de `centimesLisibles`, le
 * seul formateur d'argent de la chaîne ; les taux de `tauxLisible`, les
 * quantités de `milliemesLisibles`, le pluriel de `nombreDe`, la TVA d'une
 * option de `tvaDe` (le miroir de `devis_tva_de`). Ce qu'il écrit de neuf
 * est une LISTE FERMÉE de libellés (annexe A.1 du cahier), que
 * `verifier-apercu` relit en toutes lettres.
 *
 * LES TROIS SORTES DE CROCHETS, et aucune ne se confond :
 *   - « [à compléter : …] » (`PREFIXE_MANQUE`) : ce que l'artisan doit encore
 *     dire. Chacun porte la CLÉ du point de la liste « Pour le remettre »
 *     qu'il montre ; les clés posées sont dans `marqueursVus` ;
 *   - « [pour un particulier : …] » : la même chose, due à un particulier
 *     seulement (`enteteImprimeDetaille`) ;
 *   - « [prochaine version d’Opus : …] » (`PREFIXE_A_VENIR`, D24) : la PLACE
 *     de ce que 2c-2 imprimera. Ce n'est pas à l'artisan de le remplir : pas
 *     de clé.
 *
 * Deux « [à compléter : …] » ne montrent AUCUN point de la liste, et n'ont
 * donc pas de clé : la désignation vide (la base l'interdit,
 * `devis_ligne_designation_check` ; le marqueur n'est qu'un filet de
 * sécurité) et une attestation d'assurance échue (D8 : la liste juge la
 * décennale autrement, au rang 11).
 *
 * LE MOT « ARTISAN » (décision du propriétaire, Q1, recommandation A) : Opus
 * ne l'écrit jamais de lui-même ; la forme juridique telle que l'INSEE la
 * nomme, le nom de l'entreprise et ce que l'artisan tape s'impriment TELS
 * QUELS.
 *
 * CE FICHIER N'IMPORTE QUE DES FICHIERS PURS (`devis.js`, `emetteur.js`,
 * `centimes.js`, `formats.js`) : `node` le fait tourner.
 */

import {
  UNITES_IMPRIMEES, tauxLisible, milliemesLisibles, tvaDe, lignesDeLaPiece, sommeDesLignesLues,
  totauxDuDevisLu, rangeesImprimees, mentionComptee, DETAIL_URGENCE, texteNet, typeDe, travauxCoches, energieConcerne,
} from './devis.js';
import {
  enteteImprimeDetaille, PREFIXE_MANQUE, LIBELLES_IMPRIMES, avisEmetteur, formaterSiret, NATURES_ASSURANCE,
} from './emetteur.js';
import { centimesLisibles } from './centimes.js';
import { nombreDe } from './formats.js';

/** Le numéro de la composition : `verifier-apercu` fige l'empreinte de chaque
 *  document SOUS ce numéro. Une phrase qui change sans lui est refusée. */
export const VERSION_COMPOSITION = 1;

/** La place de ce que la prochaine version imprimera (D24). */
export const PREFIXE_A_VENIR = '[prochaine version d’Opus : ';

/** Les trois marques de la page (D14, P2, P6, D19). */
export const MARQUES = Object.freeze({
  apercu: 'APERÇU — ce document n’est pas remis',
  essai: 'Document d’essai — sans valeur',
  exemple: 'Exemple — données inventées',
});

/** Les quatre points médians du rang en attente (U+00B7) : la place du
 *  numéro, à la largeur de quatre chiffres (§4.6). */
export const RANG_EN_ATTENTE = '····';

/** La ligne de source d'un exemple (C-M10) : jamais « répertoire Sirene »,
 *  jamais « DGFiP » — rien de l'exemple ne vient d'eux. */
export const SOURCE_EXEMPLE = 'Identité inventée pour l’exemple';

/** La phrase qui suit les frais de déplacement (D25) : le total du devis ne
 *  les contient pas, la page le dit. */
export const FRAIS_HORS_DU_TOTAL = 'Facturé seulement s’il figure dans le détail des travaux.';

const aCompleter = (quoi) => `${PREFIXE_MANQUE}${quoi}]`;
const aVenir = (quoi) => `${PREFIXE_A_VENIR}${quoi}]`;

/* Le nom de la décennale DANS une phrase, tiré de `NATURES_ASSURANCE` (donc
   de `pieces-justificatives.js`), jamais recopié — la règle de
   `verifier-pieces` ; sa première lettre en minuscule. */
const DECENNALE_DANS_LA_PHRASE = (() => {
  const n = NATURES_ASSURANCE.find((x) => x.cle === 'decennale');
  return n ? `${n.libelle.charAt(0).toLowerCase()}${n.libelle.slice(1)}` : 'assurance';
})();

/**
 * Les places marquées de 2c-2 (D24), écrites une fois. CHAQUE bloc que 2c-2
 * imprimera a la sienne (relecture « contenu » du 27/11) : l'écran dit
 * « ce qui viendra est marqué dans la page », et c'était faux pour les
 * déchets, le label RGE, l'attestation décennale, la demande de commencer
 * avant la fin du délai de rétractation et les pièces remplacées. Le mot
 * « attestation » ne dit plus le taux réduit : depuis le 01/03/2025, le
 * client le certifie sur le devis (CGI, art. 279-0 bis, 3, et 278-0 bis A,
 * IV), il ne signe plus d'attestation à part. Et la somme demandée d'avance
 * ne dit ni « acompte » ni « arrhes » : sa place suit l'une comme l'autre.
 */
export const A_VENIR = Object.freeze({
  retenue: aVenir('ce que la loi dit de la retenue de garantie'),
  acompte: aVenir('quand la somme demandée d’avance se paie'),
  tauxReduit: aVenir('la mention de TVA à taux réduit que votre client signera sur le devis'),
  urgence: aVenir('ce que la réparation urgente change pour votre client'),
  dechets: aVenir('ce que deviendront les déchets du chantier'),
  energie: aVenir('les travaux d’économies d’énergie et le label RGE'),
  decennale: aVenir(`l’attestation de votre ${DECENNALE_DANS_LA_PHRASE}, jointe au devis`),
  finConsommateur: aVenir('la rétractation et son formulaire, la demande de commencer avant la fin du délai, '
    + 'les pièces remplacées (dépannage, réparation, entretien), les signatures'),
  finProfessionnel: aVenir('les signatures'),
});

/** Les marqueurs « [à compléter : …] » que la composition pose elle-même
 *  (les autres viennent d'`enteteImprimeDetaille`), avec la clé du point de
 *  la liste qu'ils montrent. */
export const MARQUEURS = Object.freeze({
  client: Object.freeze({ texte: aCompleter('le client de ce devis'), cle: 'devis_client' }),
  lieu: Object.freeze({ texte: aCompleter('le lieu des travaux'), cle: 'devis_lieu' }),
  delai: Object.freeze({ texte: aCompleter('le délai d’exécution'), cle: 'devis_delai' }),
  validite: Object.freeze({ texte: aCompleter('la durée de validité'), cle: 'devis_validite' }),
  cout: Object.freeze({ texte: aCompleter('gratuit ou payant'), cle: 'devis_cout' }),
  lignes: Object.freeze({ texte: aCompleter('au moins un poste chiffré'), cle: 'devis_lignes' }),
  designation: Object.freeze({ texte: aCompleter('la désignation'), cle: null }),
  nature: Object.freeze({ texte: aCompleter('acompte ou arrhes'), cle: 'devis_acompte_nature' }),
  tauxDeLaLigne: Object.freeze({ texte: aCompleter('le taux de TVA de cette ligne'), cle: 'devis_taux_sans_tva' }),
});

/* Le nombre et son mot, sur le PAPIER : une espace INSÉCABLE entre les deux
   (« 30 jours », « 12,5 m² » ne se coupent pas en fin de ligne). `nombreDe`
   choisit le singulier ou le pluriel ; le nombre écrit n'a jamais d'espace
   ordinaire (`milliemesLisibles` sépare les milliers par une insécable). */
const nombreSurLePapier = (n, singulier, pluriel, ecrit = null) => nombreDe(n, singulier, pluriel, ecrit).replace(' ', ' ');

/* Un montant ; `null` ne s'imprime jamais (une page qui dirait « null »). */
const montant = (c) => centimesLisibles(c) || '—';

/* « AAAA-MM-JJ » → « JJ/MM/AAAA », sans horloge : une date seule. */
function jourFrancais(jour) {
  const m = String(jour || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/* La vue d'une ligne de l'instantané aux noms de l'application : les
   fonctions de `devis.js` (`lignesDeLaPiece`, `sommeDesLignesLues`) lisent
   ceux-là. Un simple renommage, rien n'est calculé. */
const vueDeLaLigne = (l) => ({
  id: l.id, ordre: l.ordre, type: typeDe(l), designation: l.designation, totalCentimes: l.total_centimes,
});

/* Les totaux de l'instantané, lus par `totauxDuDevisLu` (la même fonction que
   la saisie) : un renommage des colonnes de la base vers les noms de
   `rowToDevis`, et la ventilation vers ceux de `totauxDepuisBase`. */
function totauxDeLInstantane(i) {
  const d = i.devis || {};
  return totauxDuDevisLu({
    devis: {
      totalHtCentimes: d.total_ht_centimes,
      totalTvaCentimes: d.total_tva_centimes,
      totalTtcCentimes: d.total_ttc_centimes,
      remiseHtCentimes: d.remise_ht_centimes,
      acompteTtcCentimes: d.acompte_ttc_centimes,
      totalTtcOptionsCentimes: d.total_ttc_options_centimes,
      remiseCentimes: d.remise_centimes,
      remiseCentiemes: d.remise_centiemes,
      acompteCentimes: d.acompte_centimes,
      acompteCentiemes: d.acompte_centiemes,
      acompteNature: d.acompte_nature,
      retenueGarantieCentiemes: d.retenue_garantie_centiemes,
    },
    ventilation: (d.ventilation || []).map((v) => ({
      taux: v.taux_tva_centiemes, base: v.base_centimes, remise: v.remise_centimes, tva: v.tva_centimes, nbLignes: v.nb_lignes,
    })),
  });
}

/* La nature d'une assurance dans la phrase de D8 : « de votre assurance
   décennale », « … responsabilité civile professionnelle », « … assurance
   « Bris de machine » » — le libellé d'une « autre » assurance, tel que
   l'artisan l'a écrit, entre guillemets. Les deux NOMS viennent de
   `NATURES_ASSURANCE` (donc de `pieces-justificatives.js`), jamais recopiés :
   un nom de pièce écrit deux fois se périme sans bruit (`verifier-pieces`).
   En milieu de phrase, sa première lettre passe en minuscule. */
const enMinuscule = (s) => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;
function natureDansLaPhrase(a) {
  if (a.nature === 'autre') return `assurance « ${a.libelle || 'Autre assurance'} »`;
  const n = NATURES_ASSURANCE.find((x) => x.cle === a.nature);
  return n ? enMinuscule(n.libelle) : 'assurance';
}

/**
 * LE DÉTAIL D'UNE LIGNE CHIFFRÉE (D4) : « 12,5 m² × 45,00 € HT · TVA 10 % »,
 * puis « · fourniture non comprise », « · réparation urgente ». Au réel, un
 * taux 0 dit « sans TVA » (et la ligne porte un marqueur, D13) ; hors du
 * réel, rien de la TVA.
 */
function detailDeLaLigne(l, reel) {
  const q = milliemesLisibles(l.quantite_milliemes);
  const u = UNITES_IMPRIMEES[l.unite];
  const quantite = q && u ? nombreSurLePapier(Number(l.quantite_milliemes) / 1000, u.singulier, u.pluriel, q) : q;
  const prix = centimesLisibles(l.prix_unitaire_centimes);
  const morceaux = [];
  if (quantite && prix) morceaux.push(`${quantite} × ${prix}${reel ? ' HT' : ''}`);
  if (reel && l.taux_tva_centiemes != null) {
    const taux = tauxLisible(l.taux_tva_centiemes);
    morceaux.push(taux ? `TVA ${taux}` : 'sans TVA');
  }
  if (l.fourniture_non_comprise === true) morceaux.push('fourniture non comprise');
  if (l.urgence === true) morceaux.push(DETAIL_URGENCE);
  return morceaux.join(' · ');
}

/**
 * LA PHRASE DES FRAIS DE DÉPLACEMENT (D25) : « Tarif de déplacement :
 * 35,00 € TTC — au-delà de 20 km. Facturé seulement s’il figure dans le
 * détail des travaux. » — « TTC » au réel seulement (les tarifs se déclarent
 * TTC, lot T). Le texte de l'artisan s'imprime tel quel ; la phrase ne
 * double pas son point final.
 */
function phraseDesFrais(t, reel) {
  const texte = texteNet(t.frais_deplacement_texte);
  const debut = t.frais_deplacement_centimes != null
    ? `${montant(t.frais_deplacement_centimes)}${reel ? ' TTC' : ''}${texte ? ` — ${texte}` : ''}`
    : texte;
  return `Tarif de déplacement : ${debut}${/[.!?…]$/.test(debut) ? ' ' : '. '}${FRAIS_HORS_DU_TOTAL}`;
}

/**
 * LE DOCUMENT COMPOSÉ (§4.2) — un objet de CHAÎNES (et `version`, un entier ;
 * `numero.enAttente`, un booléen ; des `null`). Aucun objet venu de la base,
 * aucun autre nombre (B.1).
 *
 * `instantane` : la sortie d'`instantaneDuDevis` (`.instantane`). Un
 * instantané absent LÈVE : la composition ne se fait que sur un aperçu
 * possible.
 */
export function documentDuDevis(instantane) {
  const i = instantane;
  if (!i || typeof i !== 'object' || !i.devis) throw new Error('documentDuDevis : instantané absent');
  const d = i.devis;
  const e = i.emetteur || {};
  const regime = e.regime_tva === 'reel' || e.regime_tva === 'franchise' ? e.regime_tva : null;
  const reel = regime === 'reel';
  const valable = d.pour_qui_valable ?? null;
  const lignes = Array.isArray(i.lignes) ? i.lignes : [];
  const vues = lignes.map(vueDeLaLigne);
  const vus = [];
  const poser = (m) => { if (m.cle) vus.push(m.cle); return m.texte; };

  /* LES MARQUES (D14) : l'aperçu toujours ; l'essai tant que `STATUT` vaut
     « essai » (P6) ; l'exemple en mode exemple (D19). */
  const marques = {
    apercu: MARQUES.apercu,
    essai: i.statut === 'essai' ? MARQUES.essai : null,
    exemple: i.mode === 'exemple' ? MARQUES.exemple : null,
  };
  const prefixe = `DEV-${i.annee}-`;

  /* L'EN-TÊTE DE DROITE (§4.3, bloc 2). */
  let validite;
  if (d.validite_jours != null) {
    validite = `Validité de l’offre : ${nombreSurLePapier(d.validite_jours, 'jour', 'jours')} à compter de la date du devis`;
  } else validite = poser(MARQUEURS.validite);
  let cout;
  if (d.cout_devis_centimes === 0) cout = 'Devis gratuit';
  else if (d.cout_devis_centimes != null) cout = `Devis payant : ${montant(d.cout_devis_centimes)}${reel ? ' TTC' : ''}`;
  else cout = poser(MARQUEURS.cout);

  /* L'ÉMETTEUR (D7) : chaque ligne de l'en-tête, sauf une ligne qui MANQUE
     et que la liste ne compte pas pour cette réponse (`mentionComptee`) —
     rangée par son GENRE, jamais par son texte. */
  const entete = enteteImprimeDetaille({
    entreprise: i.entreprise, emetteur: i.emetteur, assurances: i.assurances, tarifs: i.tarifs, preuveTva: i.preuve_tva,
  });
  const garder = (l) => !(l.cle && !mentionComptee(l.cle, valable));
  const texteDe = (l) => { if (l.cle) vus.push(l.cle); return l.texte; };
  const identite = entete.identite.filter(garder).map(texteDe);
  const exemple = i.mode === 'exemple' || (i.entreprise && i.entreprise.source === 'exemple');
  const source = exemple ? SOURCE_EXEMPLE : (entete.source || null);

  /* LE CLIENT (§4.3, bloc 4) : le SIRET d'une entreprise seulement ; jamais
     son type (J9), son téléphone, son e-mail ni ses notes (l'instantané ne
     les a pas). */
  let client;
  if (i.client) {
    const c = i.client;
    const ville = [texteNet(c.code_postal), texteNet(c.ville)].filter(Boolean).join(' ');
    client = [texteNet(c.nom) || MARQUEURS.client.texte, texteNet(c.adresse), ville || null,
      c.type === 'entreprise' && texteNet(c.siret) ? `SIRET ${formaterSiret(c.siret)}` : null].filter(Boolean);
  } else {
    client = [d.client_id == null ? poser(MARQUEURS.client) : MARQUEURS.client.texte];
  }

  /* LE CHANTIER (§4.3, bloc 5). L'objet vide ne s'imprime pas : c'est un
     AVIS de la liste, pas un point. */
  const chantier = [];
  const objet = texteNet(d.objet);
  if (objet) chantier.push(`Objet : ${objet}`);
  const villeDuLieu = [texteNet(d.lieu_code_postal), texteNet(d.lieu_ville)].filter(Boolean).join(' ');
  const lieu = [texteNet(d.lieu_adresse), villeDuLieu || null].filter(Boolean).join(', ');
  chantier.push(lieu ? `Lieu d’exécution : ${lieu}` : poser(MARQUEURS.lieu));
  const delai = texteNet(d.delai_execution);
  chantier.push(delai ? `Délai d’exécution : ${delai}` : poser(MARQUEURS.delai));

  /* LE DÉTAIL DES TRAVAUX (§4.3, bloc 6) et LES OPTIONS (bloc 7). */
  const designation = (l) => texteNet(l.designation) || MARQUEURS.designation.texte;
  /* Le marqueur d'une ligne sans TVA au réel (D13) : un taux ÉCRIT à 0 —
     une ligne sans taux du tout ne contredit rien (`ligneContreditLeRegime`). */
  const marqueursDeLaLigne = (l) => (reel && l.taux_tva_centiemes != null && Number(l.taux_tva_centiemes) === 0
    ? [poser(MARQUEURS.tauxDeLaLigne)] : []);
  const decompte = [];
  const options = [];
  /* Le TYPE d'une ligne se lit par `typeDe` (sans type, c'est un poste) :
     la règle que la liste « Pour le remettre » applique, écrite une fois. */
  for (const l of lignes) {
    const type = typeDe(l);
    if (type === 'zone' || type === 'piece') {
      const postes = lignesDeLaPiece(vues, l.id).filter((x) => x.type === 'poste');
      const somme = postes.length ? sommeDesLignesLues(postes) : null;
      decompte.push({
        genre: type,
        titre: designation(l),
        sousTotal: somme == null ? null : `Sous-total : ${montant(somme)}${reel ? ' HT' : ''}`,
      });
    } else if (type === 'reserve') {
      decompte.push({ genre: 'reserve', texte: `Réserve : ${designation(l)}` });
    } else if (type === 'option') {
      let total;
      if (l.offert === true) total = 'Offert';
      else if (reel) {
        const tva = tvaDe(l.total_centimes, l.taux_tva_centiemes);
        total = `${montant(l.total_centimes)} HT, soit ${montant(tva == null ? null : l.total_centimes + tva)} TTC`;
      } else total = montant(l.total_centimes);
      options.push({
        genre: 'ligne', designation: designation(l), detail: detailDeLaLigne(l, reel), total, marqueurs: marqueursDeLaLigne(l),
      });
    } else {
      decompte.push({
        genre: 'ligne',
        designation: designation(l),
        detail: detailDeLaLigne(l, reel),
        total: l.offert === true ? 'Offert' : `${montant(l.total_centimes)}${reel ? ' HT' : ''}`,
        marqueurs: marqueursDeLaLigne(l),
      });
    }
  }
  const decompteVide = lignes.some((l) => typeDe(l) === 'poste') ? null : poser(MARQUEURS.lignes);
  /* Les places de 2c-2 au bout du décompte (D24) : ce que la réparation
     urgente change (sauf pour un client professionnel), la mention de TVA à
     taux réduit (au réel, une ligne à 10 % ou 5,5 %), ce que deviendront
     les déchets (tant que la réponse n'est pas « Non » : vide vaut « Oui »,
     la règle du rang 13), et les travaux d'énergie (des travaux cochés, et
     un client pour qui la loi les demande : `energieConcerne`, la règle du
     rang 14, écrite une fois). */
  const decompteAVenir = [];
  if (lignes.some((l) => l.urgence === true) && valable !== 'professionnel') decompteAVenir.push(A_VENIR.urgence);
  if (reel && lignes.some((l) => ['poste', 'option'].includes(typeDe(l)) && [550, 1000].includes(Number(l.taux_tva_centiemes)))) {
    decompteAVenir.push(A_VENIR.tauxReduit);
  }
  if (d.dechets_concerne !== false) decompteAVenir.push(A_VENIR.dechets);
  if (travauxCoches({ energieTravaux: d.energie_travaux }).length > 0 && energieConcerne(valable)) {
    decompteAVenir.push(A_VENIR.energie);
  }

  /* LES TOTAUX (§4.3, bloc 8 ; D12, D27) : ceux de la BASE. */
  const totaux = totauxDeLInstantane(i);
  const { rangees, notes } = rangeesImprimees(totaux, regime, {
    nbOptions: options.length, sansNature: MARQUEURS.nature.texte,
  });
  const tableau = reel && totaux.ventilation.length ? {
    colonnes: ['Taux', Number(totaux.reduction) > 0 ? 'Base HT après réduction' : 'Base HT', 'TVA'],
    lignes: totaux.ventilation.map((v) => [tauxLisible(v.taux) || 'Sans TVA', montant(v.base), montant(v.tva)]),
  } : null;
  const rangeesImprimeesTexte = rangees.map((r) => {
    if (r.natureManque) vus.push(MARQUEURS.nature.cle);
    return {
      cle: r.cle, libelle: r.libelle, montant: r.moins ? `− ${montant(r.centimes)}` : montant(r.centimes),
      ton: r.fort ? 'fort' : 'normal',
    };
  });

  /* LES CONDITIONS (§4.3, bloc 9) et LES INFORMATIONS (bloc 10), rangées par
     le GENRE de la ligne de l'en-tête. Les frais montrent la phrase de D25,
     jamais la ligne de « Mon entreprise » ; « Déplacement offert » et le
     marqueur restent. */
  const conditions = [];
  const informations = [];
  const t = i.tarifs || {};
  const acompteDemande = d.acompte_centiemes != null || d.acompte_centimes != null;
  /* La place de l'acompte suit les modalités de paiement — et elle ne
     disparaît pas avec elles : face à un client professionnel, la ligne qui
     manque est retirée (`mentionComptee`), la place reste, en tête des
     conditions. La même demande donne la même page. */
  let acomptePose = false;
  /* L'attestation décennale se place après les assurances (L. 243-2 : elle
     est jointe au devis, quel que soit le client) — en tête des
     informations s'il n'y en a aucune. */
  let apresLesAssurances = 0;
  for (const l of entete.mentions) {
    if (!garder(l)) continue;
    if (l.genre === 'modalites_paiement') {
      conditions.push(texteDe(l));
      if (acompteDemande) { conditions.push(A_VENIR.acompte); acomptePose = true; }
    } else if (l.genre === 'modalites_execution') {
      conditions.push(texteDe(l));
    } else if (l.genre === 'frais') {
      const montre = l.cle == null && l.texte !== LIBELLES_IMPRIMES.fraisNonFactures;
      conditions.push(montre ? phraseDesFrais(t, reel) : texteDe(l));
    } else {
      informations.push(texteDe(l));
      if (l.genre === 'assurance' && l.assurance && l.assurance.valideJusquau
        && l.assurance.valideJusquau.slice(0, 10) < i.jour) {
        informations.push(aCompleter(`la nouvelle attestation de votre ${natureDansLaPhrase(l.assurance)}, la précédente était `
          + `valable jusqu’au ${jourFrancais(l.assurance.valideJusquau)}`));
      }
      if (l.genre === 'assurance') apresLesAssurances = informations.length;
    }
  }
  if (acompteDemande && !acomptePose) conditions.unshift(A_VENIR.acompte);
  if (d.engage_decennale !== false) informations.splice(apresLesAssurances, 0, A_VENIR.decennale);
  if (d.retenue_garantie_centiemes != null) {
    conditions.push(`Retenue de garantie : ${tauxLisible(d.retenue_garantie_centiemes)}`);
    conditions.push(A_VENIR.retenue);
  }

  /* CE QUE L'ÉCRAN DIT, jamais la page (C-M8) : l'avis des modalités qui
     parlent d'un paiement à la signature — la phrase d'`avisEmetteur`, au
     jour de l'instantané (aucune horloge). */
  const avisEcran = avisEmetteur({ assurances: [], emetteur: i.emetteur, aujourdhui: i.jour })
    .filter((a) => a.cle === 'a_la_signature').map((a) => a.texte);

  return {
    version: VERSION_COMPOSITION,
    marques,
    numero: { libelle: 'N°', prefixe, enAttente: true },
    titre: 'DEVIS',
    titres: { client: 'Client', decompte: 'Détail des travaux' },
    enTete: { date: 'Date : le jour où ce devis sera remis', validite, cout },
    emetteur: { identite, source },
    client,
    chantier,
    decompte,
    decompteVide,
    decompteAVenir,
    options: options.length ? { titre: 'Options, non comprises dans le total', lignes: options } : null,
    totaux: { tableau, rangees: rangeesImprimeesTexte, notes },
    conditions,
    informations,
    aVenir: valable === 'professionnel' ? A_VENIR.finProfessionnel : A_VENIR.finConsommateur,
    avisEcran,
    marqueursVus: vus,
    numeroAffiche: `${prefixe}${RANG_EN_ATTENTE}`,
  };
}
