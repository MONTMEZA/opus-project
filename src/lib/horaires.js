/**
 * Les horaires d'ouverture, et surtout : « c'est ouvert LÀ, maintenant ? »
 *
 * CE QU'ON CHERCHE VRAIMENT
 * -------------------------
 * Personne ne lit un tableau de sept lignes. Au moment où on tient son
 * téléphone, on veut une seule phrase : « Ouvert · ferme à 18 h », ou
 * « Fermé · rouvre à 14 h ». Le tableau sert ensuite, pour préparer.
 *
 * LA COUPURE DE MIDI
 * ------------------
 * Un artisan ferme entre midi et deux. Avec une seule plage par jour, on
 * dirait « ouvert de 8 h à 18 h » à quelqu'un qui appelle à 12 h 30 et
 * tombera sur un répondeur — c'est pire que pas d'horaires du tout. D'où
 * deux plages possibles, et la distinction entre « rouvre » (tout à
 * l'heure) et « ouvre » (un autre jour).
 *
 * LA FORME
 * --------
 *   { "lun": [["08:00","12:00"], ["14:00","18:00"]], "dim": [] }
 *
 * Tableau vide ou clé absente = fermé ce jour-là. `horaires` absent = non
 * renseigné, et ce n'est PAS la même chose que fermé : on n'affiche alors
 * rien du tout. La base tient la même règle (section 19 de schema.sql).
 */

/** L'ordre de la semaine, à la française : lundi d'abord. */
export const JOURS = [
  { cle: 'lun', nom: 'Lundi', court: 'lun.' },
  { cle: 'mar', nom: 'Mardi', court: 'mar.' },
  { cle: 'mer', nom: 'Mercredi', court: 'mer.' },
  { cle: 'jeu', nom: 'Jeudi', court: 'jeu.' },
  { cle: 'ven', nom: 'Vendredi', court: 'ven.' },
  { cle: 'sam', nom: 'Samedi', court: 'sam.' },
  { cle: 'dim', nom: 'Dimanche', court: 'dim.' },
];

/* `Date.getDay()` met le dimanche à 0 : on remet lundi en tête. */
const INDEX_DEPUIS_DATE = [6, 0, 1, 2, 3, 4, 5];

/** « 08:00 » → 480. Le calcul se fait en minutes, pas en chaînes. */
export function minutes(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ''));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * « 08:00 » → « 8 h », « 14:30 » → « 14 h 30 ».
 *
 * La typographie française met une espace autour du « h », et n'écrit pas
 * les minutes quand il n'y en a pas. « 8h00 » est un horaire de train
 * allemand.
 */
export function heureTexte(hhmm) {
  /* On passe par `minutes()` : elle seule sait qu'une heure s'arrête à 23
     et les minutes à 59. Sans cela, « 25:00 » s'écrivait « 25 h » — une
     expression régulière qui compte les chiffres ne dit rien de leur
     valeur. */
  if (minutes(hhmm) === null) return '';
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm));
  const h = Number(m[1]);
  return m[2] === '00' ? `${h} h` : `${h} h ${m[2]}`;
}

/** Les plages d'un jour, toujours sous forme de tableau. */
export function plagesDe(horaires, cle) {
  if (!horaires || typeof horaires !== 'object') return [];
  const p = horaires[cle];
  return Array.isArray(p) ? p.filter((x) => Array.isArray(x) && x.length === 2) : [];
}

/** Quelque chose a-t-il été renseigné ? Un objet vide ne compte pas. */
export function horairesRenseignes(horaires) {
  if (!horaires || typeof horaires !== 'object') return false;
  return JOURS.some(({ cle }) => Array.isArray(horaires[cle]));
}

/**
 * L'état maintenant : `{ ouvert, texte }`, ou `null` si rien n'est
 * renseigné.
 *
 * `maintenant` est un paramètre pour que ce soit testable : sans lui, on ne
 * pourrait vérifier qu'à l'heure où l'on passe le test.
 */
export function etatMaintenant(horaires, maintenant = new Date()) {
  if (!horairesRenseignes(horaires)) return null;

  const jourIndex = INDEX_DEPUIS_DATE[maintenant.getDay()];
  const instant = maintenant.getHours() * 60 + maintenant.getMinutes();
  const aujourdhui = plagesDe(horaires, JOURS[jourIndex].cle);

  for (const [debut, fin] of aujourdhui) {
    const d = minutes(debut);
    const f = minutes(fin);
    if (d === null || f === null) continue;
    if (instant >= d && instant < f) {
      return { ouvert: true, texte: `Ouvert · ferme à ${heureTexte(fin)}` };
    }
  }

  /* Fermé pour l'instant. Reste-t-il une plage aujourd'hui ? C'est la
     coupure de midi : on dit « rouvre », pas « ouvre demain ». */
  const plusTard = aujourdhui
    .map(([debut]) => ({ debut, m: minutes(debut) }))
    .filter((x) => x.m !== null && x.m > instant)
    .sort((a, b) => a.m - b.m)[0];
  if (plusTard) {
    return { ouvert: false, texte: `Fermé · rouvre à ${heureTexte(plusTard.debut)}` };
  }

  /* Sinon, le prochain jour ouvert. On regarde les sept suivants : au
     huitième, on serait revenu au même jour. */
  for (let saut = 1; saut <= 7; saut += 1) {
    const suivant = JOURS[(jourIndex + saut) % 7];
    const plages = plagesDe(horaires, suivant.cle);
    if (!plages.length) continue;
    const debut = plages[0][0];
    const quand = saut === 1 ? 'demain' : suivant.nom.toLowerCase();
    return { ouvert: false, texte: `Fermé · ouvre ${quand} à ${heureTexte(debut)}` };
  }

  return { ouvert: false, texte: 'Fermé' };
}

/**
 * La semaine, prête à afficher — et regroupée.
 *
 * « Lundi 8 h - 12 h, 14 h - 18 h » répété cinq fois se lit mal et occupe
 * un écran entier. Les jours qui se suivent ET se ressemblent deviennent
 * « Lundi au vendredi ». C'est ce que font les vitrines, pour la même
 * raison.
 */
export function semaineGroupee(horaires) {
  if (!horairesRenseignes(horaires)) return [];

  const texteDuJour = (cle) => {
    const plages = plagesDe(horaires, cle);
    if (!plages.length) return 'Fermé';
    return plages.map(([d, f]) => `${heureTexte(d)} - ${heureTexte(f)}`).join(', ');
  };

  const lignes = [];
  for (const jour of JOURS) {
    const texte = texteDuJour(jour.cle);
    const derniere = lignes[lignes.length - 1];
    if (derniere && derniere.texte === texte) {
      derniere.fin = jour;
    } else {
      lignes.push({ debut: jour, fin: jour, texte });
    }
  }

  return lignes.map(({ debut, fin, texte }) => ({
    jours: debut === fin
      ? debut.nom
      : `${debut.nom} au ${fin.nom.toLowerCase()}`,
    texte,
  }));
}
