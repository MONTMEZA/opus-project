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

/* `versISO` A QUITTÉ CE FICHIER LE 04/10/2026 — et c'est une suppression
   voulue, pas un oubli.

   Elle traduisait « 12/10 » en « 2026-10-12 », parce que les dates se
   tapaient à la main. Depuis que les quatre champs de date de la Place des
   pros sont des boutons qui ouvrent un calendrier
   (`src/components/Calendrier.js`), plus personne ne l'appelait.

   Une fonction sans appelant est le « bouton §18 » de CLAUDE.md : du code
   qui a l'air de servir, qu'un contrôle couvre consciencieusement, et qui
   ne fait rien. Et celle-ci avait en plus un DÉFAUT : elle vérifiait que
   le jour tenait entre 1 et 31, pas qu'il existe dans ce mois-là. « 31/02 »
   sortait donc « 2026-02-31 », que PostgreSQL refuse — un refus de la base
   pour une faute de frappe. Le calendrier ne peut pas proposer ce jour. */

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


/* ==========================================================================
 *  LA GRILLE D'UN MOIS — pour choisir une date au doigt plutôt qu'à la main
 * ==========================================================================
 *
 * Demandé par le propriétaire le 04/10/2026 :
 *
 *   « Quand on doit sélectionner des dates il faut les taper à la main. Je
 *     pense que ce serait mieux que quand on sélectionne l'espace pour
 *     rentrer la date, un petit calendrier s'ouvre et qu'on puisse
 *     sélectionner directement dessus. Ce serait plus ludique et il y
 *     aurait moins d'erreurs. »
 *
 * POURQUOI CES CALCULS SONT ICI, ET PAS DANS LE COMPOSANT
 * ------------------------------------------------------
 * Cinquième application de la leçon de `cloudinary-adresses.js` : un
 * calcul rangé dans un fichier qui charge React Native ne peut pas être
 * FAIT TOURNER par un contrôle — `node` ne sait pas l'ouvrir. Or une
 * grille de calendrier est exactement le genre de code qui se trompe d'un
 * jour sans que ça se voie : un décalage d'une case en février, et toutes
 * les dates sont fausses d'un cran pendant un mois.
 *
 * POURQUOI PAS `@react-native-community/datetimepicker`
 * ----------------------------------------------------
 * Vérifié dans les docs du SDK 57 : il EST fourni dans Expo Go, donc
 * techniquement disponible. Il n'a pourtant pas été pris, et c'est le même
 * raisonnement que pour la carte (`src/lib/tuiles.js`) :
 *
 *   1. **il ne s'affiche pas au navigateur.** `react-native-web` n'a pas
 *      d'implémentation : je ne pourrais donc pas VOIR ce que je livre, et
 *      le propriétaire n'a qu'Expo Go pour juger. On ne livre pas à
 *      l'aveugle quelque chose qu'on peut écrire soi-même ;
 *   2. il ne connaît pas la notion d'INTERVALLE. Or ici on ne choisit pas
 *      une date, on choisit un créneau de chantier — « du 12 au 20 ». Deux
 *      sélecteurs ouverts l'un après l'autre ne montrent jamais la durée,
 *      qui est précisément l'information qui décide ;
 *   3. une dépendance de moins, c'est un risque de moins de devoir quitter
 *      Expo Go — le seul moyen d'essai du propriétaire.
 *
 * TOUT SE COMPTE EN ENTIERS, JAMAIS AVEC `Date`
 * ---------------------------------------------
 * `moisDecale` fait de l'arithmétique sur des nombres de mois, pas sur un
 * objet `Date` : `new Date(2026, 12, 31)` « marche » et rend le 31 janvier
 * 2027, ce qui est juste par accident et faux dès qu'on s'en sert pour
 * autre chose. Et `indexJourSemaine` passe par `Date.UTC`, comme
 * `joursEntre` : un midi local au changement d'heure décale le jour de la
 * semaine d'un cran, une fois par an, dans un sens qui dépend du fuseau.
 */

/** Les jours de la semaine, LUNDI d'abord — c'est la semaine française. */
export const JOURS_COURTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MOIS_LONGS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Le mois d'un jour : « 2026-10-12 » → « 2026-10 ». */
export function moisDe(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** « 2026-10 » → « octobre 2026 ». */
export function nomMois(am) {
  const m = String(am || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const i = Number(m[2]) - 1;
  if (i < 0 || i > 11) return null;
  return `${MOIS_LONGS[i]} ${m[1]}`;
}

/**
 * Le mois voisin — en comptant des MOIS, pas des jours.
 *
 * `moisDecale('2026-12', 1)` rend « 2027-01 », et `('2026-01', -1)`
 * « 2025-12 ». Le passage d'année est la seule chose qui casse dans ce
 * genre de fonction, donc elle ne fait que des divisions entières.
 */
export function moisDecale(am, pas) {
  const m = String(am || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + Number(pas || 0);
  const annee = Math.floor(total / 12);
  const mois = total - annee * 12;
  return `${String(annee).padStart(4, '0')}-${String(mois + 1).padStart(2, '0')}`;
}

/**
 * Combien de jours dans ce mois.
 *
 * Le jour 0 du mois SUIVANT est le dernier du mois courant : les années
 * bissextiles se règlent toutes seules, y compris 2100 qui n'en est pas
 * une.
 */
export function joursDuMois(am) {
  const m = String(am || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return 0;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate();
}

/** Le jour de la semaine, 0 = lundi … 6 = dimanche. */
export function indexJourSemaine(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (d.getUTCDay() + 6) % 7;   // getUTCDay() rend 0 pour DIMANCHE
}

/**
 * La grille : des semaines de SEPT cases, `null` pour les trous.
 *
 * Les cases vides sont vraiment vides — pas les jours du mois voisin en
 * gris. Un chiffre qu'on voit et qui ne répond pas est la pire des deux
 * solutions : on appuie, rien ne se passe, et on croit l'application
 * cassée. C'est la même famille que la poignée des commentaires qui ne
 * s'attrapait pas.
 *
 * Un mois tient sur 4 semaines (février de 28 jours commençant un lundi)
 * à 6 (31 jours commençant un dimanche). Le composant réserve donc la
 * hauteur de SIX semaines : sans ça, le bouton « Valider » remonte de
 * 50 px en changeant de mois, et on appuie à côté.
 */
export function grilleMois(am) {
  const n = joursDuMois(am);
  if (!n) return [];
  const cases = new Array(indexJourSemaine(`${am}-01`)).fill(null);
  for (let j = 1; j <= n; j += 1) cases.push(`${am}-${String(j).padStart(2, '0')}`);
  while (cases.length % 7) cases.push(null);
  const semaines = [];
  for (let i = 0; i < cases.length; i += 7) semaines.push(cases.slice(i, i + 7));
  return semaines;
}

/** Le nombre de semaines qu'un mois peut occuper : la hauteur à réserver. */
export const SEMAINES_MAX = 6;

/** « 2026-10-12 » → « 12/10 » : ce qu'on écrit dans un bouton étroit. */
export function jourCourt(iso) {
  const m = String(iso || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
  return m ? `${m[2]}/${m[1]}` : null;
}

/**
 * Ce jour est-il DANS l'intervalle choisi, bornes comprises ?
 *
 * Sert à teinter les jours entre les deux bouts. Avec un seul bout posé,
 * seul ce bout est dedans : on ne devine pas une fin que personne n'a
 * donnée — même règle que `chevauche`.
 */
export function dansIntervalle(iso, debut, fin) {
  if (!iso || !debut) return false;
  if (!fin) return iso === debut;
  return iso >= debut && iso <= fin;
}
