/**
 * LES TARIFS RÉUNIS — le côté PUBLIC (lot T, 19/10/2026).
 *
 * CE QUE CE FICHIER FAIT
 * ----------------------
 * Un artisan déclare UNE seule liste de tarifs, dans « Mon entreprise » :
 * frais de déplacement, taux horaire et son décompte, majoration de nuit et
 * de week-end, prix du devis — tout en centimes, toutes taxes comprises.
 * Le formulaire, ses refus et ses miroirs vivent dans `emetteur.js`. Ici vit
 * ce qui se MONTRE : l'estimation de l'écran SOS, les lignes du bloc
 * « Ses tarifs » de la fiche, l'état du réglage d'urgence de « Modifier mon
 * profil », et le miroir de démonstration de la recherche
 * `artisans_urgence()`.
 *
 * LES DÉCISIONS QUI LE GOUVERNENT
 * -------------------------------
 *   - « au choix de l'artisan » (17/10/2026) : rien n'est affiché tant
 *     qu'il n'a pas allumé « Afficher mes tarifs sur ma fiche » ;
 *   - répondre aux urgences DEMANDE d'afficher ses tarifs (réponse du
 *     propriétaire du 19/10, question 1) : `pretPourLeSos` le tient ;
 *   - les tarifs affichés ne sont lus QUE par les particuliers (question 2) :
 *     la base le tient (`not est_un_pro()`), et `QUI_VOIT_LES_TARIFS` le dit
 *     — une seule écriture de la phrase ;
 *   - la majoration s'applique « comme aujourd'hui » (question 4) : de 20 h
 *     à 7 h et le week-end, au déplacement comme aux heures.
 *
 * TROIS ÉTATS PARTOUT, et c'est le point : `null` = non déclaré ; `0` = un
 * choix, écrit par un interrupteur seulement (« Déplacement offert », « Je
 * ne majore pas », « Mes devis sont gratuits ») ; un montant. Un taux
 * horaire n'a pas de 0. `Number(null)` vaut 0 en JavaScript : aucune
 * fonction d'ici ne convertit un `null` en nombre.
 *
 * IL N'IMPORTE QUE `./emetteur.js` ET `../data/urgences.js`, avec
 * l'extension `.js` : `verifier-tarifs` le FAIT TOURNER avec `node`, et un
 * contrôle qui plante ne vérifie rien. Jamais `erreurs.js`, `theme.js` ni
 * rien qui charge React Native.
 *
 * Et rien d'ici ne compare les tarifs de plusieurs artisans : aucune
 * moyenne, aucun « prix conseillé », aucun « votre tarif face aux autres »
 * (docs/DONNEES-DES-ARTISANS.md). Chaque fonction lit UNE ligne.
 */
import { versCentimes, centimesLisibles } from './emetteur.js';
import { METIERS_SOS, estNuitOuWeekend } from '../data/urgences.js';

/* ================================================================== */
/*  LES PHRASES ÉCRITES UNE SEULE FOIS                                 */
/* ================================================================== */

/**
 * Les heures où Opus applique la majoration dans l'estimation des urgences —
 * EXACTEMENT ce que calcule `estNuitOuWeekend` (src/data/urgences.js), et
 * `verifier-tarifs` compare les deux.
 *
 * C'est une convention d'OPUS : l'artisan ne déclare qu'un pourcentage. On
 * ne la montre donc que dans l'aide du formulaire (« Opus l'applique… »),
 * jamais sur sa fiche publique, qui lui prêterait des heures qu'il n'a pas
 * choisies.
 */
export const HEURES_MAJOREES = 'de 20\u00a0h à 7\u00a0h, le samedi et le dimanche';

/**
 * QUI VOIT LES TARIFS AFFICHÉS — réponse du propriétaire du 19/10/2026.
 *
 * La seule écriture de cette phrase : l'aide de « Afficher mes tarifs sur
 * ma fiche », « Mes tarifs » sur sa propre page et l'aperçu de « Mon
 * entreprise » la lisent ici. « depuis son compte » n'est pas une
 * précaution de style : un artisan peut ouvrir un second compte, en
 * particulier, et Opus ne vérifie pas l'identité des particuliers. La phrase
 * dit la barrière, elle ne promet pas un verrou.
 */
export const QUI_VOIT_LES_TARIFS = 'Visibles des particuliers connectés seulement : un autre artisan '
  + 'ne les voit pas depuis son compte.';

/**
 * LA MÊME PHRASE, AU CONDITIONNEL — pour l'aperçu de « Mon entreprise »
 * quand les tarifs ne sont PAS affichés (relecture du 19/10/2026). Sous
 * « Ce que verraient les particuliers », le présent « Visibles des
 * particuliers… » disait faux : à cet instant, personne ne les voit. Même
 * limite dite : « depuis son compte », pas un verrou.
 */
export const QUI_VERRAIT_LES_TARIFS = 'S’ils étaient affichés, seuls les particuliers connectés les '
  + 'verraient : un autre artisan ne les verrait pas depuis son compte.';

/**
 * CE QUE SONT DES TARIFS NON AFFICHÉS — l'aide de l'interrupteur éteint
 * (« Mon entreprise », section « Afficher mes tarifs ») et le bloc « Vos
 * tarifs » en lecture la lisent ici, une seule écriture.
 *
 * Elle disait « ils ne servent qu'à préparer vos devis » (relecture droit du
 * 19/10/2026) : faux deux fois. La MAJORATION ne sert à aucun devis — elle
 * ne vit que dans l'estimation des urgences, et la même fiche le dit trente
 * lignes plus haut —, et aucun devis n'existe encore : le futur, comme la
 * CGU (« serviront »).
 */
export const TARIFS_NON_AFFICHES = 'Tant qu’ils ne sont pas affichés, aucun écran d’Opus ne les montre '
  + 'à quelqu’un d’autre que vous, et vous n’apparaissez pas dans les urgences. Vos frais de '
  + 'déplacement, votre taux horaire et le prix de vos devis serviront à préparer vos devis ; '
  + 'la majoration, elle, ne sert qu’aux urgences.';

/* ================================================================== */
/*  LES MÉTIERS D'URGENCE                                              */
/* ================================================================== */

/** Miroir de `metier_du_sos()` (section 47) : `'plomberie'` → `'plombier'`, sinon `null`. */
export function metierDuSos(cle) {
  const m = METIERS_SOS.find((x) => x.key === cle);
  return m ? m.metier : null;
}

/**
 * Le métier d'urgence correspondant aux métiers déclarés, s'il en existe un.
 * On les parcourt dans l'ordre : un plombier-chauffagiste peut répondre aux
 * urgences, et c'est son métier principal qui décide lequel.
 *
 * Déménagé de `ProfilEditScreen.js` (`metierSosDe`) pour qu'`OpusApp` et
 * l'écran n'en aient qu'une : deux formules pour une seule vérité finissent
 * par se contredire.
 */
export function metierSosDeLaFiche(metiers) {
  for (const m of Array.isArray(metiers) ? metiers : []) {
    const trouve = METIERS_SOS.find((x) => x.metier === m);
    if (trouve) return trouve;
  }
  return null;
}

const labelDuSos = (cle) => {
  const m = METIERS_SOS.find((x) => x.key === cle);
  return m ? m.label : String(cle);
};

/* ================================================================== */
/*  CE QU'IL FAUT POUR APPARAÎTRE DANS LES URGENCES                    */
/* ================================================================== */

/**
 * Les quatre conditions DE TARIFS du `where` d'`artisans_urgence()`, dans
 * l'ordre où l'écran les dit. Ni plus ni moins : la ligne de disponibilité
 * active, le métier sur la fiche et la position sont l'affaire
 * d'`etatReglageSos`. `verifier-tarifs` compare la liste des colonnes au
 * texte SQL.
 */
export const CONDITIONS_DU_SOS = Object.freeze([
  Object.freeze({ manque: 'affiche', colonne: 'affiche', ok: (t) => t.affiche === true }),
  Object.freeze({ manque: 'deplacement', colonne: 'frais_deplacement_centimes', ok: (t) => t.frais_deplacement_centimes != null }),
  Object.freeze({ manque: 'taux', colonne: 'taux_horaire_centimes', ok: (t) => t.taux_horaire_centimes != null }),
  Object.freeze({ manque: 'majoration', colonne: 'majoration_pct', ok: (t) => t.majoration_pct != null }),
]);

/** `{ pret, manque }`, `manque` dans l'ordre de `CONDITIONS_DU_SOS`. Sans ligne : les quatre. */
export function pretPourLeSos(t) {
  const ligne = t || {};
  const manque = CONDITIONS_DU_SOS.filter((c) => !c.ok(ligne)).map((c) => c.manque);
  return { pret: manque.length === 0, manque };
}

/**
 * Ce qui manque, en mots. Les frais en conditions SEULES ne suffisent pas :
 * « gratuit jusqu'à 20 km, puis 0,50 €/km » ne donne aucun nombre à mettre
 * dans une estimation.
 */
export const MANQUES_SOS = Object.freeze({
  affiche: 'vos tarifs ne sont pas affichés',
  deplacement: 'un montant de frais de déplacement, ou « Je ne facture pas de frais de déplacement » '
    + '— des conditions seules ne permettent pas de calculer une estimation',
  taux: 'votre taux horaire',
  majoration: 'votre majoration de nuit et de week-end, ou « Je ne majore pas la nuit ni le week-end »',
});

/* ================================================================== */
/*  LES MONTANTS                                                       */
/* ================================================================== */

/**
 * 4500 → « 45 € », 4550 → « 45,50 € », 0 → « 0 € » ; `null` ou non entier
 * → `null`. Les espaces sont ceux de `centimesLisibles` (insécables) : un
 * montant ne se coupe pas en fin de ligne. La forme COURTE sert à la carte
 * SOS, où l'on compare d'un coup d'œil ; la fiche garde « 45,00 € ».
 */
export function eurosCourts(c) {
  if (typeof c !== 'number' || !Number.isInteger(c)) return null;
  return centimesLisibles(c).replace(/,00(?=\u00a0€$)/, '');
}

const TTC = '\u00a0TTC';

/* Un texte déclaré, rogné ; une chaîne vide n'est pas un texte. */
const texteDeclare = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

/**
 * Une ligne d'`artisans_urgence()` → les tarifs, en centimes.
 *
 * La fonction rend des EUROS à deux décimales (`numeric`), parce que sa
 * signature ne peut pas changer. On les relit par `versCentimes(String(x))`,
 * JAMAIS par `x * 100` : `8.2 * 100` vaut 819,999… (mesuré), et une facture
 * ne s'arrondit pas au hasard.
 *
 * `null` si un des trois manque ou est illisible, ou si le taux vaut moins
 * d'un euro : une base pas encore migrée rendrait `0.00 / 0.00 / 0` pour
 * tout le monde, et l'écran afficherait « 0 – 0 € » devant une urgence.
 */
export function depuisLaRecherche(ligne) {
  if (!ligne) return null;
  const montant = (x) => {
    if (x == null || x === '') return null;
    const r = versCentimes(String(x));
    return r.ok ? r.centimes : null;
  };
  const frais = montant(ligne.deplacement);
  const taux = montant(ligne.horaire);
  const brute = ligne.majoration;
  const pct = brute == null || brute === '' ? null : Number(brute);
  if (frais == null || taux == null || pct == null) return null;
  if (!Number.isInteger(pct) || pct < 0 || pct > 200) return null;
  if (taux < 100) return null;
  return {
    frais_deplacement_centimes: frais,
    taux_horaire_centimes: taux,
    majoration_pct: pct,
    affiche: true,
  };
}

/* ================================================================== */
/*  L'ESTIMATION DES URGENCES                                          */
/* ================================================================== */

/**
 * La majoration s'applique-t-elle ? `'oui'` / `'non'` / `'selon_heure'`.
 *
 * « Tout de suite » : on juge à l'HEURE D'ARRIVÉE (maintenant + le délai
 * que l'artisan annonce), pas à celle de la recherche — chercher à 19 h 40
 * un artisan qui arrive à 20 h 05, c'est une intervention de nuit.
 * « Dans la journée » et « Demain » : l'heure n'est pas connue. On n'affiche
 * pas une estimation majorée pour une intervention de jour, ni l'inverse :
 * la carte dit « +X % si l'intervention a lieu la nuit ou le week-end ».
 */
export function majorationSos({ creneau, maintenant = Date.now(), delaiMin = 0 } = {}) {
  if (creneau !== 'immediat') return 'selon_heure';
  const depart = maintenant instanceof Date ? maintenant.getTime() : Number(maintenant);
  const delai = Number(delaiMin);
  const arrivee = new Date((Number.isFinite(depart) ? depart : Date.now())
    + (Number.isFinite(delai) && delai > 0 ? delai : 0) * 60000);
  return estNuitOuWeekend(arrivee) ? 'oui' : 'non';
}

/**
 * La fourchette, en EUROS ENTIERS : `{ min, max, majore }`, ou `null`.
 *
 * `null` si les tarifs ne sont pas prêts pour le SOS (`pretPourLeSos`), si le
 * problème manque, ou si le maximum ne dépasse pas 0 : une carte sans prix
 * vaut mieux qu'une carte qui affiche « 0 – 0 € ».
 *
 * `majore` n'est vrai que si la majoration s'applique ET qu'elle vaut plus
 * de 0 % : « majoration de nuit incluse » sous le prix d'un artisan qui ne
 * majore pas serait faux.
 *
 * Le calcul est celui d'avant le lot T, en centimes : la majoration porte
 * sur le déplacement ET sur les heures (réponse du 19/10, question 4 :
 * « Comme aujourd'hui »). 45 € + 62 €/h sur une à deux heures donnent
 * 107 – 169 €, et 150 – 237 € à +40 %.
 */
export function estimationSos(t, probleme, majoration) {
  if (!pretPourLeSos(t).pret) return null;
  if (!probleme || !Array.isArray(probleme.h) || probleme.h.length !== 2) return null;
  const dep = t.frais_deplacement_centimes;
  const taux = t.taux_horaire_centimes;
  const pct = t.majoration_pct;
  if (![dep, taux, pct].every((n) => Number.isInteger(n))) return null;
  const [hMin, hMax] = probleme.h;
  if (!Number.isFinite(hMin) || !Number.isFinite(hMax)) return null;
  const majore = majoration === 'oui' && pct > 0;
  const coef = majore ? 100 + pct : 100;
  const min = Math.round(((dep + taux * hMin) * coef) / 10000);
  const max = Math.round(((dep + taux * hMax) * coef) / 10000);
  if (!(max > 0)) return null;
  return { min, max, majore };
}

/**
 * La ligne de détail sous la fourchette : « Déplacement 45 € · 62 €/h · … ».
 * Jamais `null`, `NaN`, `undefined` ni « +0 % ». « déplacement compris »
 * accompagne tout pourcentage annoncé (« la nuit et le week-end » comme
 * « si l'intervention a lieu la nuit… ») : c'est l'estimation d'Opus qui
 * l'applique au déplacement, la carte le dit.
 */
export function detailSos(t, majoration) {
  if (!t) return '';
  const morceaux = [];
  const dep = t.frais_deplacement_centimes;
  if (dep === 0) morceaux.push('Déplacement offert');
  else if (eurosCourts(dep)) morceaux.push(`Déplacement ${eurosCourts(dep)}`);
  if (eurosCourts(t.taux_horaire_centimes)) morceaux.push(`${eurosCourts(t.taux_horaire_centimes)}/h`);
  const pct = t.majoration_pct;
  if (Number.isInteger(pct)) {
    if (majoration === 'oui' && pct > 0) {
      morceaux.push(`+${pct}\u00a0% la nuit et le week-end, déplacement compris`);
    } else if ((majoration === 'oui' || majoration === 'selon_heure') && pct === 0) {
      morceaux.push('sans majoration la nuit ni le week-end');
    } else if (majoration === 'selon_heure' && pct > 0) {
      /* « déplacement compris » ICI AUSSI (relecture droit du 19/10/2026) :
         pour « Dans la journée » et « Demain », la majoration s'appliquera
         au déplacement comme aux heures si l'intervention tombe la nuit ou
         le week-end — réponse du propriétaire du 19/10, question 4. Sans
         ces deux mots, un particulier qui calcule l'appliquerait aux seules
         heures. */
      morceaux.push(`+${pct}\u00a0% si l’intervention a lieu la nuit ou le week-end, déplacement compris`);
    }
  }
  return morceaux.join(' · ');
}

/**
 * Ce que le particulier doit savoir AVANT de choisir, et que la fourchette
 * ne dit pas : le prix du devis, la façon de compter le temps, les
 * conditions de déplacement. Seulement ce qui est déclaré ; `[]` sinon.
 */
export function conditionsSos(t) {
  if (!t) return [];
  const lignes = [];
  const devis = t.prix_devis_centimes;
  if (devis === 0) lignes.push('Devis : gratuit');
  else if (Number.isInteger(devis) && devis > 0) lignes.push(`Devis : ${eurosCourts(devis)}${TTC}`);
  const decompte = texteDeclare(t.decompte_temps_texte);
  if (decompte) lignes.push(`Temps : ${decompte}`);
  const conditions = texteDeclare(t.frais_deplacement_texte);
  if (conditions) lignes.push(`Déplacement : ${conditions}`);
  return lignes;
}

/**
 * La note sous la fourchette. Elle dit sur QUOI repose l'estimation, et ce
 * qu'elle ne compte pas.
 *
 * « majoration de nuit ET DE WEEK-END incluse », le nom que porte le champ
 * dans « Mon entreprise » : elle s'applique aussi un samedi à 11 h, et
 * « majoration de nuit » sous une intervention de jour faisait douter du
 * prix (relecture application du 19/10/2026).
 */
export function noteSos(t, majore) {
  let note = 'Estimation avant diagnostic, sur des durées moyennes';
  if (majore === true) note += ' · majoration de nuit et de week-end incluse';
  const devis = t ? t.prix_devis_centimes : null;
  if (Number.isInteger(devis) && devis > 0) note += ' · hors prix du devis';
  return note;
}

/* ================================================================== */
/*  LE BLOC « SES TARIFS » DE LA FICHE                                 */
/* ================================================================== */

/**
 * Les lignes du bloc, SEULEMENT celles qui sont déclarées, dans cet ordre :
 * taux horaire, décompte, déplacement, majoration, prix du devis. Chaque
 * montant porte « TTC » : c'est ce que le client paie, et ce qu'il lit.
 *
 * La majoration n'est qu'un POURCENTAGE : ni les heures d'Opus, ni
 * « déplacement compris ». L'artisan n'a déclaré que ce chiffre ; sa fiche
 * ne lui prête pas une convention qui n'est pas la sienne.
 */
export function lignesTarifs(t) {
  if (!t) return [];
  const lignes = [];
  const taux = t.taux_horaire_centimes;
  if (Number.isInteger(taux)) {
    lignes.push({ cle: 'taux', libelle: 'Taux horaire', valeur: `${centimesLisibles(taux)}${TTC} de l’heure` });
  }
  const decompte = texteDeclare(t.decompte_temps_texte);
  if (decompte) lignes.push({ cle: 'decompte', libelle: 'Décompte du temps', valeur: decompte });
  const dep = t.frais_deplacement_centimes;
  const conditions = texteDeclare(t.frais_deplacement_texte);
  if (dep === 0) {
    lignes.push({ cle: 'deplacement', libelle: null, valeur: 'Déplacement offert' });
  } else if (Number.isInteger(dep)) {
    lignes.push({
      cle: 'deplacement',
      libelle: 'Déplacement',
      valeur: `${centimesLisibles(dep)}${TTC}${conditions ? ` — ${conditions}` : ''}`,
    });
  } else if (conditions) {
    lignes.push({ cle: 'deplacement', libelle: 'Déplacement', valeur: conditions });
  }
  const pct = t.majoration_pct;
  if (pct === 0) {
    lignes.push({ cle: 'majoration', libelle: 'Majoration de nuit et de week-end', valeur: 'Aucune' });
  } else if (Number.isInteger(pct) && pct > 0) {
    lignes.push({ cle: 'majoration', libelle: 'Majoration de nuit et de week-end', valeur: `+${pct}\u00a0%` });
  }
  const devis = t.prix_devis_centimes;
  if (devis === 0) {
    lignes.push({ cle: 'devis', libelle: 'Prix du devis', valeur: 'Gratuit' });
  } else if (Number.isInteger(devis) && devis > 0) {
    lignes.push({ cle: 'devis', libelle: 'Prix du devis', valeur: `${centimesLisibles(devis)}${TTC}` });
  }
  return lignes;
}

/* ================================================================== */
/*  LE RÉGLAGE D'URGENCE DE « MODIFIER MON PROFIL »                    */
/* ================================================================== */

/** Les bornes de `sos_rayon_check` et `sos_delai_check` (section 47) : `verifier-tarifs` les compare. */
export const BORNES_SOS = Object.freeze({
  rayonKm: Object.freeze([1, 200]),
  delaiMinutes: Object.freeze([5, 600]),
});
const RAYON_PAR_DEFAUT = 20;
const DELAI_PAR_DEFAUT = 45;

/**
 * L'ÉTAT DE DÉPART du réglage, depuis `mesSos` (`{ lignes }`, ou
 * `{ echec: true }` quand la lecture a échoué) et les métiers de la fiche.
 *
 * C'est le point qui aurait éteint le SOS de tout artisan qui enregistre son
 * profil : lire `sos.actif` sur la nouvelle forme rendrait `undefined`, donc
 * un interrupteur éteint, et « Enregistrer » enverrait `actif: false` — se
 * retirer des urgences en changeant sa présentation, sans un mot.
 *
 *   lisible        faux si la lecture a échoué ou n'a rien rendu ;
 *   ligne          la ligne du métier d'urgence de la fiche, ou `null` ;
 *   actif, rayon, delai   ce que l'écran montre (textes pour les champs) ;
 *   autresActives  les clés des lignes actives d'un AUTRE métier.
 */
export function reglageInitialSos(sos, metiers) {
  const defaut = {
    lisible: false, ligne: null, actif: false,
    rayon: String(RAYON_PAR_DEFAUT), delai: String(DELAI_PAR_DEFAUT), autresActives: [],
  };
  if (!sos || sos.echec || !Array.isArray(sos.lignes)) return defaut;
  const sosMetier = metierSosDeLaFiche(metiers);
  const ligne = sosMetier ? sos.lignes.find((l) => l && l.metierKey === sosMetier.key) || null : null;
  return {
    lisible: true,
    ligne,
    actif: !!(ligne && ligne.actif === true),
    rayon: String(ligne && Number.isInteger(ligne.rayonKm) ? ligne.rayonKm : RAYON_PAR_DEFAUT),
    delai: String(ligne && Number.isInteger(ligne.delaiMinutes) ? ligne.delaiMinutes : DELAI_PAR_DEFAUT),
    autresActives: sos.lignes
      .filter((l) => l && l.actif === true && (!sosMetier || l.metierKey !== sosMetier.key))
      .map((l) => l.metierKey),
  };
}

/* La phrase des disponibilités qu'un enregistrement éteindra. */
function phraseAEteindre(cles) {
  if (!cles || cles.length === 0) return null;
  const noms = cles.map((c) => `« ${labelDuSos(c)} »`);
  if (noms.length === 1) {
    return `En enregistrant, votre disponibilité ${noms[0]} sera désactivée : Opus ne gère qu’un `
      + 'métier d’urgence à la fois.';
  }
  return `En enregistrant, vos disponibilités ${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]} `
    + 'seront désactivées : Opus ne gère qu’un métier d’urgence à la fois.';
}

/**
 * CE QUE LE RÉGLAGE D'URGENCE DIT, en une phrase — la seule écriture, que
 * « Modifier mon profil » et « Mon entreprise » appellent toutes deux.
 *
 * Rend `{ cle, phrase, manque, aEteindre, avertissement }`. Les états, dans
 * l'ordre où ils l'emportent :
 *
 *   sos_echec     la lecture de la disponibilité a échoué — rien n'est
 *                 affirmé, et l'enregistrement n'y touchera pas ;
 *   metier_retire le métier d'urgence est sur la fiche EN BASE, mais le
 *                 formulaire vient de le retirer : rien n'est encore fait,
 *                 la phrase est au FUTUR (« En enregistrant sans ce
 *                 métier… ») — seulement si `sosMetierEnBase` est donné ;
 *   orpheline     une ligne active sur un métier qui n'est plus sur la
 *                 fiche : on n'y apparaît plus, et l'enregistrement l'éteint ;
 *   sans_metier   aucun métier d'urgence ;
 *   eteint        « Je réponds aux urgences » est éteint ;
 *   sans_position la fiche n'a pas de coordonnées ;
 *   tarifs_en_cours  les tarifs sont EN COURS de lecture
 *                 (`{ chargement: true }`) : on ne peut pas ENCORE dire si
 *                 l'artisan apparaît — jamais « non affichés » pendant une
 *                 lecture (relecture application du 19/10/2026) ;
 *   tarifs_echec  la lecture des tarifs a échoué : on ne peut pas dire si
 *                 l'artisan apparaît ;
 *   non_affiches  les tarifs ne sont pas affichés ;
 *   incomplets    il manque un des trois nombres de l'estimation ;
 *   pret          au PRÉSENT si la ligne active est en base (`enregistre`),
 *                 au FUTUR sinon (« En enregistrant, vous apparaîtrez… »).
 *
 * `ecran` : l'écran qui AFFICHE la phrase — `'profil'` (« Modifier mon
 * profil », par défaut) ou `'entreprise'` (le bloc « Vos tarifs » de « Mon
 * entreprise »). Quatre phrases parlent du formulaire où l'on se trouve :
 * « En enregistrant, cette disponibilité sera désactivée », « Allumez « Je
 * réponds aux urgences » », « ce formulaire », « cet enregistrement ». Dans
 * « Mon entreprise », elles disaient FAUX : enregistrer ses informations de
 * devis n'éteint aucune disponibilité, et l'interrupteur n'y est pas
 * (constaté au navigateur le 19/10/2026, sur la ligne orpheline de
 * démonstration, la première chose que lit un artisan qui ouvre ses
 * tarifs). Là, elles disent OÙ agir : « Modifier mon profil ». Les mêmes
 * états, les mêmes priorités, une seule fonction.
 *
 * UN ÉCART AU CAHIER DU LOT T, VOULU : `tarifs_echec` passe APRÈS
 * l'orpheline, l'absence de métier, l'interrupteur éteint et l'absence de
 * position. Dans ces quatre cas la réponse est connue sans les tarifs — on
 * n'apparaît pas — et dire « on ne peut pas dire si vous apparaissez » à
 * un maçon serait faux. Il reste AVANT « non affichés » : un échec de
 * lecture ne doit jamais ressembler à « vos tarifs ne sont pas affichés ».
 */
export function etatReglageSos({
  sos = null, sosMetier = null, sosMetierEnBase, interrupteur = false, enregistre = false,
  tarifs = null, aDesCoordonnees = false, ecran = 'profil',
} = {}) {
  const fin = (cle, phrase, { manque = [], aEteindre = [] } = {}) => ({
    cle, phrase, manque, aEteindre, avertissement: phraseAEteindre(aEteindre),
  });
  /* Ailleurs que dans « Modifier mon profil », on dit où le réglage se fait. */
  const ailleurs = ecran === 'entreprise';
  const PROFIL = '« Modifier mon profil »';

  if (sos && sos.echec) {
    return fin('sos_echec', ailleurs
      ? 'Vos réglages d’urgence n’ont pas pu être lus : on ne peut pas dire ici si vous apparaissez '
        + 'dans les urgences.'
      : 'Vos réglages d’urgence n’ont pas pu être lus. Ils ne seront pas '
        + 'modifiés par cet enregistrement : réessayez plus tard.');
  }
  const lignes = sos && Array.isArray(sos.lignes) ? sos.lignes : [];
  const actives = lignes.filter((l) => l && l.actif === true);

  if (!sosMetier) {
    /* LE MÉTIER RETIRÉ DANS LE FORMULAIRE, PAS ENCORE ENREGISTRÉ : la fiche
       en base le porte toujours, et l'artisan APPARAÎT toujours. Lui dire
       « vous n'y apparaissez plus » serait faux tant qu'il n'a pas
       enregistré — et, s'il abandonne la modification, il croirait s'être
       retiré des urgences (relecture application du 19/10/2026). */
    const retiree = sosMetierEnBase && sosMetierEnBase.key
      ? actives.find((l) => l.metierKey === sosMetierEnBase.key) : null;
    if (retiree) {
      return fin('metier_retire', 'En enregistrant sans ce métier, vous n’apparaîtrez plus dans les '
        + `urgences « ${labelDuSos(retiree.metierKey)} » : cette disponibilité sera désactivée.`);
    }
    if (actives.length > 0) {
      return fin('orpheline', `Vous répondiez aux urgences « ${labelDuSos(actives[0].metierKey)} », `
        + 'mais ce métier n’est plus sur votre fiche : vous n’y apparaissez plus. '
        + (ailleurs
          ? `Pour la désactiver, ouvrez ${PROFIL} et enregistrez.`
          : 'En enregistrant, cette disponibilité sera désactivée.'));
    }
    return fin('sans_metier', 'Les urgences concernent la plomberie, l’électricité, la serrurerie et '
      + 'le chauffage. Votre métier n’est pas concerné par le bouton SOS.');
  }

  const label = sosMetier.label;
  const aEteindre = actives.filter((l) => l.metierKey !== sosMetier.key).map((l) => l.metierKey);

  if (interrupteur !== true) {
    return fin('eteint', ailleurs
      ? `Vous n’apparaissez pas dans les demandes SOS « ${label} » : « Je réponds aux urgences » est `
        + `éteint, dans ${PROFIL}.`
      : `Allumez « Je réponds aux urgences » pour apparaître dans les demandes SOS `
        + `« ${label} » près de chez vous.`, { aEteindre });
  }
  if (aDesCoordonnees !== true) {
    return fin('sans_position', 'Vous n’apparaîtrez pas dans les urgences : votre fiche n’a pas de '
      + (ailleurs
        ? `position. Dans ${PROFIL}, ouvrez votre ville et choisissez-la dans la liste.`
        : 'position. Ouvrez votre ville dans ce formulaire et choisissez-la dans la liste.'), { aEteindre });
  }
  if (tarifs && tarifs.chargement) {
    return fin('tarifs_en_cours', 'Vos tarifs sont en cours de lecture : on ne peut pas encore dire '
      + 'si vous apparaissez dans les urgences.', { aEteindre });
  }
  if (tarifs && tarifs.echec) {
    return fin('tarifs_echec', 'Vos tarifs n’ont pas pu être lus : on ne peut pas dire si vous '
      + 'apparaissez dans les urgences.', { aEteindre });
  }
  const { manque } = pretPourLeSos(tarifs);
  if (manque.includes('affiche')) {
    return fin('non_affiches', 'Vous n’apparaîtrez pas dans les urgences : vos tarifs ne sont pas '
      + 'affichés. Un particulier voit vos tarifs avant de vous choisir ; sans eux, Opus ne peut pas '
      + 'calculer d’estimation.', { manque, aEteindre });
  }
  if (manque.length > 0) {
    return fin('incomplets', `Vous n’apparaîtrez pas dans les urgences : il manque `
      + `${manque.map((m) => MANQUES_SOS[m]).join(' ; ')}.`, { manque, aEteindre });
  }
  if (enregistre === true) {
    return fin('pret', `Vous apparaissez dans les urgences « ${label} » autour de chez vous, avec ces `
      + 'tarifs :', { aEteindre });
  }
  return fin('pret', `En enregistrant, vous apparaîtrez dans les urgences « ${label} », avec ces tarifs :`,
    { aEteindre });
}

/**
 * Le rayon et le délai tapés → `{ ok, valeurs: { rayonKm, delaiMinutes },
 * champ, message }`.
 *
 * INTERRUPTEUR ÉTEINT : RIEN N'EST VALIDÉ. Les valeurs de la ligne (ou 20 et
 * 45) repartent telles quelles : un champ qu'on ne voit plus ne peut pas
 * bloquer l'enregistrement du profil.
 *
 * Allumé : des entiers, dans les bornes de la base. Un champ vide ou « 0 »
 * est REFUSÉ, jamais remplacé en silence par 20 ou 45 — c'était le
 * `Number(x) || 20` d'avant le lot T.
 */
export function reglageSosDepuisSaisie({ actif = false, rayon = '', delai = '', ligne = null } = {}) {
  if (actif !== true) {
    return {
      ok: true,
      champ: null,
      message: null,
      valeurs: {
        rayonKm: ligne && Number.isInteger(ligne.rayonKm) ? ligne.rayonKm : RAYON_PAR_DEFAUT,
        delaiMinutes: ligne && Number.isInteger(ligne.delaiMinutes) ? ligne.delaiMinutes : DELAI_PAR_DEFAUT,
      },
    };
  }
  const lire = (texte, [min, max]) => {
    const brut = String(texte == null ? '' : texte).replace(/[\s\u00a0\u202f]/g, '');
    if (!/^\d+$/.test(brut)) return null;
    const n = Number(brut);
    return n >= min && n <= max ? n : null;
  };
  const [rMin, rMax] = BORNES_SOS.rayonKm;
  const [dMin, dMax] = BORNES_SOS.delaiMinutes;
  const rayonKm = lire(rayon, BORNES_SOS.rayonKm);
  if (rayonKm == null) {
    return {
      ok: false, valeurs: null, champ: 'rayon_km',
      message: `Votre rayon d’intervention s’écrit en kilomètres, un nombre entier entre ${rMin} et ${rMax}.`,
    };
  }
  const delaiMinutes = lire(delai, BORNES_SOS.delaiMinutes);
  if (delaiMinutes == null) {
    return {
      ok: false, valeurs: null, champ: 'delai_minutes',
      message: `Votre délai d’arrivée habituel s’écrit en minutes, un nombre entier entre ${dMin} et ${dMax}.`,
    };
  }
  return { ok: true, champ: null, message: null, valeurs: { rayonKm, delaiMinutes } };
}

/* ================================================================== */
/*  LA RECHERCHE, EN DÉMONSTRATION                                     */
/* ================================================================== */

/* Ce qu'`artisans_urgence()` rend de la fiche, sous les noms de l'écran. */
function ficheDeLaRecherche(p) {
  if (!p) return null;
  return {
    entreprise: p.entreprise || null,
    ville: p.ville || null,
    avatarUrl: p.avatarUrl || null,
    verifie: p.verifie === true,
  };
}

/**
 * Le miroir de démonstration d'`artisans_urgence()` : les lignes de `sos`
 * actives sur ce métier d'urgence, dont le métier est sur la fiche
 * (`pros[id].metiers`, ou à défaut `[pros[id].metier]` — plusieurs fiches de
 * démonstration n'ont que `metier`), dont les tarifs sont AFFICHÉS et
 * complets, triées de la plus proche à la plus lointaine.
 *
 * Rend la forme de `chercherArtisansUrgence` : `{ artisans, nonAffichables }`,
 * chaque artisan `{ proId, metierKey, fiche, tarifs, complements, delaiMin,
 * distanceKm }`. Les clés de `tarifs` sont des CHAÎNES (`String(proId)`).
 *
 * `fiche` : ce que la recherche rend de l'artisan (nom, ville, photo,
 * badge), comme `artisans_urgence()` le rend en base. L'écran SOS s'en sert
 * quand la fiche n'est pas dans `pros` — un artisan inscrit après le
 * démarrage de l'application du particulier.
 */
export function artisansDisponiblesDemo(metierKey, { sos = [], tarifs = {}, pros = {} } = {}) {
  const metier = metierDuSos(metierKey);
  const artisans = (Array.isArray(sos) ? sos : [])
    .filter((a) => a && a.actif === true && a.metierKey === metierKey)
    .filter((a) => {
      const p = pros ? pros[a.proId] : null;
      if (!p || !metier) return false;
      const metiers = Array.isArray(p.metiers) && p.metiers.length > 0 ? p.metiers : [p.metier];
      return metiers.includes(metier);
    })
    .map((a) => ({ a, t: tarifs ? tarifs[String(a.proId)] : null }))
    .filter(({ t }) => pretPourLeSos(t).pret)
    .sort((x, y) => x.a.distanceKm - y.a.distanceKm)
    .map(({ a, t }) => ({
      proId: a.proId,
      metierKey: a.metierKey,
      fiche: ficheDeLaRecherche(pros[a.proId]),
      tarifs: { ...t },
      complements: 'ok',
      delaiMin: a.delaiMin,
      distanceKm: a.distanceKm,
    }));
  return { artisans, nonAffichables: 0 };
}
