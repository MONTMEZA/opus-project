/**
 * LA REMISE EN AVANT — ce que l'écran en dit (lot S-c, 30/10/2026)
 *
 * LA RÈGLE N'EST PAS ICI, ELLE EST DANS LA BASE
 * ---------------------------------------------
 * `remonter_publication()` (section 52.9 de `schema.sql`) décide, sous un
 * verrou, et elle seule : une publication se remet en avant une semaine
 * après sa publication, puis une fois tous les sept jours ; un
 * professionnel n'en remet pas plus de trois sur sept jours, publications
 * supprimées comprises. Elle refuse avec le code OP022, un `detail`
 * (`absente`, `publication`, `artisan`) et un `hint` : l'instant à partir
 * duquel ce sera possible, en UTC, à la seconde supérieure.
 *
 * CE FICHIER NE FAIT QUE TROIS CHOSES
 * -----------------------------------
 *   1. dire un refus avec SA date, à l'heure du téléphone (`phraseDuRefus`).
 *      `erreurs.js` ne le peut pas : il n'importe rien, et c'est un
 *      contrôle (verifier-emetteur). Il garde le repli honnête — la phrase
 *      de la base, sans date — pour une version qui ne passerait pas ici ;
 *   2. rejouer la règle pour la DÉMONSTRATION (`decisionRemontee`), où il
 *      n'y a pas de base. C'est une seconde écriture, assumée et bornée :
 *      `verifier-remontee` compare ses nombres à `schema.sql` et la fait
 *      tourner sur les mêmes cas que `essais-section-51c.sql` ;
 *   3. nommer les nombres (`REGLE_REMONTEE`), que les textes reprennent.
 *
 * PAS DE COMPTEUR « il vous reste N remises en avant » : la règle par
 * professionnel dépend d'un historique que l'écran ne lit pas en entier
 * (les publications supprimées comptent), et la base le dit, avec la date,
 * au moment où ça compte.
 *
 * Ce fichier n'importe que des fichiers qui n'importent pas React Native :
 * `node` le fait tourner.
 */
import { dateFrancaise } from './entreprise.js';

export const REGLE_REMONTEE = Object.freeze({
  /** Une publication : une semaine après sa publication, puis tous les N jours. */
  jours: 7,
  /** Un professionnel : au plus N remises en avant sur `jours` jours glissants. */
  parProfessionnel: 3,
});

const JOUR_MS = 24 * 3600 * 1000;

/* Les phrases de la BASE, au mot près (`remonter_publication()`). La
   démonstration les rend telles quelles, pour qu'une erreur de
   démonstration ressemble trait pour trait à une erreur de la vraie base ;
   `verifier-remontee` les compare à `schema.sql`. */
export const MESSAGES_REFUS_REMONTEE = Object.freeze({
  absente: "Cette publication ne peut pas être remise en avant : elle n'existe plus, ou ce n'est pas l'une des vôtres.",
  publication: 'Cette publication ne peut pas encore être remise en avant : une semaine après sa publication, puis une fois tous les sept jours.',
  artisan: 'Vous avez déjà remis en avant trois publications ces sept derniers jours, publications supprimées comprises.',
});

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ESPACE = String.fromCharCode(0xa0);

/**
 * L'instant d'un `hint` — UNE forme, et une seule : celle que la base écrit
 * (`AAAA-MM-JJTHH:MM:SSZ`), avec ses millisecondes ou un décalage explicite
 * tolérés. Rend `null` pour tout le reste, et SURTOUT pour une heure sans
 * fuseau : lue à l'heure du téléphone, elle serait fausse d'une à deux
 * heures en France, sans un mot (critique du 29/10). Pas de `Date.parse` :
 * Hermes, le moteur du téléphone, n'est tenu de lire qu'une seule forme, et
 * `node` est plus tolérant que lui — il ne peut pas en être juge.
 */
export function lireInstant(texte) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/
    .exec(String(texte || '').trim());
  if (!m) return null;
  const [, a, mo, j, h, mi, s, frac, fuseau] = m;
  let ms = Date.UTC(Number(a), Number(mo) - 1, Number(j), Number(h), Number(mi), Number(s),
    frac ? Math.floor(Number(`0.${frac}`) * 1000) : 0);
  if (fuseau !== 'Z') {
    const signe = fuseau[0] === '-' ? -1 : 1;
    const [fh, fm] = fuseau.slice(1).split(':').map(Number);
    ms -= signe * (fh * 60 + fm) * 60000;
  }
  return Number.isFinite(ms) ? ms : null;
}

/**
 * « jeudi 5 novembre à 14 h 04 », à l'heure du téléphone. La minute est
 * ARRONDIE AU-DESSUS : tronquée, la phrase annonçait « 14 h 03 » pour un
 * instant à 14 h 03 min 12 s, et un appui à 14 h 03 min 05 s était refusé
 * avec la même phrase (critique du 29/10). L'année n'est dite que si elle
 * n'est pas celle de `maintenant`.
 *
 * Ce qu'elle ne sait pas faire, et c'est dit : l'heure qui se répète la
 * nuit du passage à l'heure d'hiver (deux instants, une même phrase). Rare,
 * et sans conséquence — la base reste l'autorité.
 */
export function jourEtHeure(ms, maintenant = Date.now()) {
  const arrondi = Math.ceil(ms / 60000) * 60000;
  const d = new Date(arrondi);
  const quantieme = d.getDate() === 1 ? '1er' : String(d.getDate());
  const annee = d.getFullYear() !== new Date(maintenant).getFullYear() ? ` ${d.getFullYear()}` : '';
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${JOURS[d.getDay()]} ${quantieme} ${MOIS[d.getMonth()]}${annee} à ${d.getHours()}${ESPACE}h${ESPACE}${minutes}`;
}

/**
 * La phrase d'un REFUS de remise en avant, avec sa date, à l'heure du
 * téléphone. Rend `null` si ce n'est pas un OP022 qu'on sait lire — et
 * l'appelant retombe alors sur `messageClair()`, qui rend la phrase de la
 * base, sans date : un repli honnête, jamais une date inventée.
 *
 * `e` a la forme d'une erreur PostgREST : `{ code, message, details, hint }`.
 */
export function phraseDuRefus(e, maintenant = Date.now()) {
  if (!e || e.code !== 'OP022') return null;
  const quelle = e.details;
  if (quelle === 'absente') return MESSAGES_REFUS_REMONTEE.absente;
  if (quelle !== 'publication' && quelle !== 'artisan') return null;

  const ms = lireInstant(e.hint);
  if (ms == null) return null;
  const arrondi = Math.ceil(ms / 60000) * 60000;
  /* Un instant déjà passé, ou à moins d'une minute — un téléphone en
     avance, ou un appui à la toute fin du délai : « dans un instant »,
     jamais une date au passé. */
  const bientot = arrondi - maintenant < 60000;
  if (quelle === 'publication') {
    return bientot
      ? 'Cette publication pourra être remise en avant dans un instant.'
      : `Cette publication pourra être remise en avant à partir du ${jourEtHeure(ms, maintenant)} : une semaine après sa publication, puis une fois tous les sept jours.`;
  }
  return bientot
    ? `${MESSAGES_REFUS_REMONTEE.artisan} Vous pourrez recommencer dans un instant.`
    : `${MESSAGES_REFUS_REMONTEE.artisan} Vous pourrez recommencer à partir du ${jourEtHeure(ms, maintenant)}.`;
}

/** L'instant au format que la base écrit dans le `hint`, à la seconde SUPÉRIEURE. */
export function versHint(ms) {
  const s = Math.ceil(ms / 1000) * 1000;
  return `${new Date(s).toISOString().slice(0, 19)}Z`;
}

/**
 * La règle de `remonter_publication()`, rejouée pour la DÉMONSTRATION.
 *
 *   publication : `{ id, type, proId, publieLe, remonteLe }` ou `null` ;
 *   moi         : l'identifiant de MA fiche ;
 *   historique  : `[{ postId, remonteeLe }]` — mes remises en avant,
 *                 publications supprimées comprises (`postId: null`) ;
 *   maintenant  : en millisecondes.
 *
 * Rend `{ ok: true, instant }` (une chaîne ISO), ou l'erreur que la base
 * aurait rendue : `{ ok: false, code: 'OP022', details, hint, message }`.
 */
export function decisionRemontee({ publication, moi, historique = [], maintenant = Date.now() }) {
  const refus = (details, ms) => ({
    ok: false, code: 'OP022', details,
    hint: ms == null ? null : versHint(ms),
    message: MESSAGES_REFUS_REMONTEE[details],
  });
  if (!publication || publication.type === 'ad'
      || moi == null || String(publication.proId) !== String(moi)) {
    return refus('absente', null);
  }

  const delai = REGLE_REMONTEE.jours * JOUR_MS;
  const depuis = Math.max(
    lireDate(publication.publieLe),
    publication.remonteLe ? lireDate(publication.remonteLe) : -Infinity,
  );
  let pourPub = Number.isFinite(depuis) ? depuis + delai : null;
  if (pourPub != null && pourPub <= maintenant) pourPub = null;

  const recentes = historique
    .map((r) => lireDate(r.remonteeLe))
    .filter((t) => Number.isFinite(t) && t > maintenant - delai)
    .sort((a, b) => b - a);
  const pourArt = recentes.length >= REGLE_REMONTEE.parProfessionnel
    ? recentes[REGLE_REMONTEE.parProfessionnel - 1] + delai
    : null;

  if (pourPub != null || pourArt != null) {
    // La plus TARDIVE des deux ; à égalité, la publication — comme la base.
    if (pourArt == null || (pourPub != null && pourPub >= pourArt)) return refus('publication', pourPub);
    return refus('artisan', pourArt);
  }
  return { ok: true, instant: new Date(maintenant).toISOString() };
}

/**
 * La remise en avant de la DÉMONSTRATION, décidée ET écrite — sur un `etat`
 * de la forme `{ remontees: Map<id, iso>, historique: [{ postId, remonteeLe }] }`.
 * La publication voit sa dernière remise de la séance (`etat.remontees`),
 * et chaque remise acceptée entre dans l'historique : sans cette écriture,
 * la règle des trois par semaine ne mordait jamais sans fichier `.env`.
 */
export function appliquerRemiseDemo(etat, { publication, moi, maintenant = Date.now() }) {
  const cle = publication ? String(publication.id) : null;
  const pub = publication && etat.remontees.has(cle)
    ? { ...publication, remonteLe: etat.remontees.get(cle) }
    : publication;
  const d = decisionRemontee({ publication: pub, moi, historique: etat.historique, maintenant });
  if (!d.ok) return d;
  etat.remontees.set(cle, d.instant);
  etat.historique.push({ postId: publication.id, remonteeLe: d.instant });
  return d;
}

/* Une date de la démonstration (`toISOString()`, donc en UTC avec « Z »),
   lue par `lireInstant` — la même porte que le `hint`. */
function lireDate(iso) {
  const ms = lireInstant(iso);
  return ms == null ? NaN : ms;
}

/* Les deux nombres de la règle, EN LETTRES, pour les phrases. Un nombre qui
   changerait sans sa traduction rendrait « undefined » dans la phrase, et
   `verifier-remontee` le refuse. */
const EN_LETTRES = { 3: 'trois', 7: 'sept' };
const JOURS_LETTRES = EN_LETTRES[REGLE_REMONTEE.jours];
const PAR_PRO_LETTRES = EN_LETTRES[REGLE_REMONTEE.parProfessionnel];

/** La règle, dite au-dessus de « Mes publications ». */
export const NOTE_REMONTEE = '« Remettre en avant » ne crée pas de doublon : la publication '
  + 'reprend sa place parmi les plus récentes du fil, avec sa date de publication, ses '
  + "j'aime et ses commentaires, puis redescend avec les autres. Une semaine après sa "
  + `publication, puis une fois tous les ${JOURS_LETTRES} jours ; ${PAR_PRO_LETTRES} remises en `
  + `avant au plus sur ${JOURS_LETTRES} jours, publications supprimées comprises.`;

/** Ajouté à la confirmation de suppression d'une publication remise en avant
 *  récemment. « Des sept derniers jours », et pas « de la semaine », qui se
 *  lit comme une semaine du calendrier : la règle est GLISSANTE (relecture du
 *  30/10, comme « Cette semaine » de la Place des pros le 04/10). */
export const SUPPRESSION_APRES_REMISE = `Sa remise en avant compte encore parmi vos ${PAR_PRO_LETTRES} `
  + `des ${JOURS_LETTRES} derniers jours.`;

/**
 * LES BANDEAUX D'UNE REMISE EN AVANT RÉUSSIE — décidés sur la page du fil
 * RECHARGÉE, jamais « en tête » : faux dès que quelqu'un publie.
 *
 * Quand le fil n'a pas pu être rechargé, la remise a quand même eu lieu : un
 * bandeau de SUCCÈS, qui dit le geste qui recharge. Il n'est pas le même
 * selon le fil : le fil classique se tire vers le bas, le fil des vidéos n'a
 * pas ce geste — on le quitte pour le fil classique, qui se recharge en
 * changeant de mode (relecture du 30/10 : « tirez le fil vers le bas » était
 * dit aussi en mode vidéo).
 */
export const BANDEAUX_REMISE = Object.freeze({
  dansLeFil: 'Publication remise en avant : elle reprend place parmi les plus récentes du fil, puis redescendra à mesure que d’autres publient.',
  horsDuFiltre: 'Publication remise en avant : elle reprend place parmi les plus récentes du fil. Votre fil, tel qu’il est filtré en ce moment, ne la montre pas.',
  rechargerFil: 'Publication remise en avant. Tirez le fil vers le bas pour la voir à sa nouvelle place.',
  rechargerVideo: 'Publication remise en avant. Repassez au fil classique pour la voir à sa nouvelle place.',
});

/** Le bandeau, d'après la page rechargée (`null` si le rechargement a
 *  échoué), l'identifiant remis en avant et le mode du fil. */
export function bandeauApresRemise(page, id, feedMode) {
  if (!Array.isArray(page)) {
    return feedMode === 'video' ? BANDEAUX_REMISE.rechargerVideo : BANDEAUX_REMISE.rechargerFil;
  }
  return page.some((p) => p && String(p.id) === String(id))
    ? BANDEAUX_REMISE.dansLeFil
    : BANDEAUX_REMISE.horsDuFiltre;
}

/**
 * Cette remise en avant compte-t-elle encore dans la limite par
 * professionnel ? Vrai si elle date de moins de `jours` jours. Appelée dans
 * un GESTE (l'appui sur « Supprimer »), avec l'heure de ce geste.
 */
export function remiseRecente(iso, maintenant) {
  const ms = lireInstant(iso);
  return ms != null && ms > maintenant - REGLE_REMONTEE.jours * JOUR_MS;
}

/** « Remise en avant le 30/10/2026 » — sous la carte de « Mes publications ». */
export function libelleRemise(iso) {
  const date = dateFrancaise(iso);
  return date ? `Remise en avant le ${date}` : null;
}
