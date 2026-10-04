/**
 * Mise en forme des dates et des prix de la Place des pros.
 *
 * Ce fichier n'importe RIEN : ni React, ni le thème. C'est volontaire — il
 * se teste avec node (`npm run verifier-annonces`), et ces deux fonctions
 * sont écrites à la main, donc exactement le genre de code qui se casse en
 * silence.
 */

const UNITES_LABEL = {
  total: '',
  jour: 'par jour',
  semaine: 'par semaine',
  mois: 'par mois',
};

const MOIS = [
  'janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/** « du 12 au 20 mars », « du 28 févr. au 3 mars », « à partir du 12 mars ». */
export function libelleDates(debut, fin) {
  const d = debut ? new Date(debut) : null;
  const f = fin ? new Date(fin) : null;
  if (!d && !f) return null;
  if (d && !f) return `à partir du ${d.getDate()} ${MOIS[d.getMonth()]}`;
  if (!d && f) return `jusqu'au ${f.getDate()} ${MOIS[f.getMonth()]}`;
  // Même mois : on ne le répète pas — « du 12 au 20 mars ».
  if (d.getMonth() === f.getMonth() && d.getFullYear() === f.getFullYear()) {
    return `du ${d.getDate()} au ${f.getDate()} ${MOIS[f.getMonth()]}`;
  }
  return `du ${d.getDate()} ${MOIS[d.getMonth()]} au ${f.getDate()} ${MOIS[f.getMonth()]}`;
}

/** « 180 € », « 95 € / jour ». Les centimes à zéro ne s'écrivent pas. */
export function libellePrix(prix, unite = 'total') {
  if (prix === null || prix === undefined || prix === '') return null;
  const n = Number(prix);
  if (!Number.isFinite(n)) return null;
  const montant = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
  if (unite === 'total') return `${montant} €`;
  return `${montant} € ${UNITES_LABEL[unite] || ''}`.trim();
}

/* ==========================================================================
 *  LES CRÉNEAUX — ajouté le 04/10/2026
 *
 *  POURQUOI CE BLOC EXISTE
 *  -----------------------
 *  L'en-tête de `PlaceProScreen` revendique depuis le début :
 *
 *    « Un chantier se joue sur une semaine précise. "Je cherche un
 *      plaquiste du 12 au 20 octobre" est une information exploitable ;
 *      "je cherche un plaquiste" ne l'est pas. Aucune des places de marché
 *      existantes ne fait correspondre les annonces sur les dates — c'est
 *      ce qui nous distingue le plus sûrement. »
 *
 *  Et ce n'était pas construit. Les dates étaient AFFICHÉES, jamais
 *  utilisées : ni pour filtrer, ni pour trier, ni pour faire sortir de la
 *  liste une annonce dont le chantier est passé. Un « plaquiste du 12 au
 *  20 octobre » restait en tête de liste en décembre.
 *
 *  POURQUOI DES CHAÎNES, ET PAS DES `Date`
 *  ---------------------------------------
 *  `date_debut` et `date_fin` sont des colonnes `date` : la base rend
 *  « 2026-10-12 », sans heure. `new Date('2026-10-12')` est interprété à
 *  MINUIT UTC — donc le 11 octobre à 19 h pour qui vit à New York, et
 *  `getDate()` rend 11. Le projet est français, donc ça ne mord pas
 *  aujourd'hui ; mais une comparaison de chaînes « AAAA-MM-JJ » est exacte
 *  partout, et ne coûte rien.
 *
 *  Tout ce bloc compare donc des CHAÎNES, et c'est volontaire.
 * ========================================================================== */

/** Le jour courant en « AAAA-MM-JJ », dans le fuseau de celui qui regarde. */
export function jourCourant(maintenant = new Date()) {
  const d = maintenant;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${j}`;
}

/**
 * « 12/10 » ou « 12/10/26 » vers « 2026-10-12 ».
 *
 * Écrit à la main, donc exactement le genre de code qui se casse en
 * silence — d'où sa place ici plutôt que dans l'écran, où `node` ne
 * pouvait pas le faire tourner (la leçon de `cloudinary-adresses.js`).
 *
 * Rend `null` sur tout ce qui n'est pas une date : on ne devine pas. Un
 * « 32/13 » refusé vaut mieux qu'un 1er février inventé.
 */
export function versISO(saisie, maintenant = new Date()) {
  const m = String(saisie || '').trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const jour = Number(m[1]);
  const mois = Number(m[2]);
  if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return null;
  let annee = m[3] ? Number(m[3]) : maintenant.getFullYear();
  if (annee < 100) annee += 2000;
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/**
 * DEUX CRÉNEAUX SE CHEVAUCHENT-ILS ?
 *
 * C'est le cœur du filtre, et toute la subtilité tient aux bornes
 * ABSENTES :
 *
 *   - une annonce sans aucune date (une bétonnière à vendre) est
 *     disponible n'importe quand : elle chevauche TOUT. La retirer d'une
 *     recherche par dates ferait disparaître du matériel qui n'a jamais
 *     cessé d'être à vendre ;
 *   - « à partir du 12 » n'a pas de fin : elle chevauche tout ce qui se
 *     termine le 12 ou après ;
 *   - « jusqu'au 20 » n'a pas de début.
 *
 * Deux créneaux ne se manquent donc que dans deux cas : l'un finit avant
 * que l'autre commence, ou l'inverse.
 */
export function chevauche(aDebut, aFin, bDebut, bFin) {
  if (aFin && bDebut && aFin < bDebut) return false;
  if (bFin && aDebut && bFin < aDebut) return false;
  return true;
}

/**
 * Une annonce dont le chantier est PASSÉ.
 *
 * `fin` seule décide. Une annonce « à partir du 12 octobre », sans fin, ne
 * se termine jamais toute seule — on ne devine pas à la place de celui qui
 * l'a écrite.
 */
export function estTerminee(dateFin, jour = jourCourant()) {
  return !!dateFin && dateFin < jour;
}

/**
 * CE QUI FAIT AGIR : « commence dans 3 jours », pas « du 12 au 20 ».
 *
 * La date brute oblige à calculer de tête, et sur un chantier on ne calcule
 * pas. Au-delà d'une dizaine de jours on se tait : « dans 3 mois » n'est
 * pas une urgence, et un bandeau sur chaque annonce ne dirait plus rien.
 */
export const BIENTOT_JOURS = 10;

const MS_JOUR = 24 * 60 * 60 * 1000;

/** Le nombre de jours entre deux dates « AAAA-MM-JJ ». */
export function joursEntre(a, b) {
  if (!a || !b) return null;
  /* `Date.UTC` sur les trois nombres : aucune heure, aucun fuseau, donc
     aucun décalage d'un jour selon l'endroit où l'on se trouve. */
  const n = (x) => {
    const p = String(x).split('-').map(Number);
    if (p.length !== 3 || p.some((v) => !Number.isFinite(v))) return null;
    return Date.UTC(p[0], p[1] - 1, p[2]);
  };
  const x = n(a);
  const y = n(b);
  if (x === null || y === null) return null;
  return Math.round((y - x) / MS_JOUR);
}

export function libelleProximite(debut, fin, jour = jourCourant()) {
  if (estTerminee(fin, jour)) return { texte: 'Terminée', etat: 'terminee' };

  if (debut) {
    const dans = joursEntre(jour, debut);
    if (dans === null) return null;
    if (dans < 0) return { texte: 'En cours', etat: 'encours' };
    if (dans === 0) return { texte: 'Commence aujourd’hui', etat: 'bientot' };
    if (dans === 1) return { texte: 'Commence demain', etat: 'bientot' };
    if (dans <= BIENTOT_JOURS) return { texte: `Dans ${dans} jours`, etat: 'bientot' };
    return null;
  }

  /* Pas de début, mais une fin : ce qui compte est le temps qu'il reste. */
  if (fin) {
    const reste = joursEntre(jour, fin);
    if (reste !== null && reste >= 0 && reste <= BIENTOT_JOURS) {
      return { texte: reste === 0 ? 'Dernier jour' : `Plus que ${reste} jours`, etat: 'bientot' };
    }
  }
  return null;
}

/**
 * Les deux raccourcis du filtre — et ils ne se définissent PAS pareil.
 *
 * « CETTE SEMAINE » EST GLISSANTE : aujourd'hui, et les sept jours qui
 * suivent. Ce n'est pas la semaine du calendrier, et c'est voulu.
 *
 * La première version allait jusqu'au dimanche, « parce que c'est la
 * semaine telle qu'on la dit en France ». Essayée au navigateur un
 * DIMANCHE : le filtre ne couvrait plus que la journée, et un chantier qui
 * commençait trois jours plus tard disparaissait. Or le dimanche soir est
 * exactement le moment où l'on prépare la semaine. Un raccourci qui ne
 * veut plus rien dire un jour sur sept n'est pas un raccourci.
 *
 * « CE MOIS-CI » reste du calendrier, et rétrécit en fin de mois. C'est ce
 * que les mots veulent dire : le 29 octobre, « ce mois-ci » n'est pas
 * novembre. Personne n'est surpris.
 */
export function creneauSemaine(maintenant = new Date()) {
  const fin = new Date(maintenant.getTime() + 7 * MS_JOUR);
  return { debut: jourCourant(maintenant), fin: jourCourant(fin) };
}

export function creneauMois(maintenant = new Date()) {
  const dernier = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);
  return { debut: jourCourant(maintenant), fin: jourCourant(dernier) };
}
