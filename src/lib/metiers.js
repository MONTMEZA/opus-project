/**
 * Un seul endroit pour répondre à « quels métiers fait cet artisan ? ».
 *
 * La question se pose partout : la recherche, le tri des demandes, le
 * badge du profil, les publications. Si chaque écran y répond à sa façon,
 * les réponses finissent par diverger — c'est exactement ce qui était
 * arrivé avec « qu'est-ce qui compte comme vidéo », où deux listes
 * distinctes faisaient disparaître les montages du fil vidéo.
 */

import { CATALOGUE, CATEGORIES } from '../data/catalogue-metiers.js';
import { normaliser } from './texte.js';

/* ------------------------------------------------------------------ */
/*  LE CATALOGUE, mis en forme une fois pour toutes                    */
/*                                                                     */
/*  Ces tables se construisent au chargement du module, donc UNE SEULE */
/*  fois. Les reconstruire à chaque recherche coûterait un parcours    */
/*  complet du catalogue par lettre tapée — et on a déjà vu ce que     */
/*  coûte un calcul par lettre sur un téléphone (219 ms dans           */
/*  l'assistant IA).                                                   */
/* ------------------------------------------------------------------ */

/**
 * Le métier proposé quand rien n'est choisi.
 *
 * Il en faut un : la base exige au moins un métier
 * (`pro_metiers_check`). C'est le premier du catalogue, et c'est le seul
 * endroit où cette valeur est écrite.
 */
export const METIER_PAR_DEFAUT = CATALOGUE[0].cle;

/** cle → le métier entier. */
export const MAP_METIERS = Object.fromEntries(CATALOGUE.map((m) => [m.cle, m]));

/** cle → le nom lisible d'une catégorie. */
export const MAP_CATEGORIES = Object.fromEntries(CATEGORIES.map((c) => [c.cle, c.nom]));

/** cle d'une spécialité → { cle, nom, metier }. */
export const MAP_SPECIALITES = Object.fromEntries(
  CATALOGUE.flatMap((m) => (m.spe || []).map((s) => [s.cle, { ...s, metier: m.cle }])),
);

/**
 * Le texte dans lequel on cherche un métier : son nom, ses synonymes, ET
 * le nom de ses spécialités.
 *
 * Les spécialités comptent, et c'est le §13 de la demande : quelqu'un qui
 * tape « mur de soutènement » cherche un maçon. Sans elles, il ne trouve
 * rien — alors que le métier existe et qu'un artisan le fait.
 */
const FOIN = Object.fromEntries(CATALOGUE.map((m) => [
  m.cle,
  normaliser([
    m.nom,
    ...(m.syn || []),
    ...(m.spe || []).flatMap((s) => [s.nom, ...(s.syn || [])]),
  ].join(' ')),
]));

/**
 * Le nom à afficher. JAMAIS la clé directement à l'écran.
 *
 * Si la clé est inconnue — un métier désactivé, une sauvegarde ancienne —
 * on rend la clé plutôt que rien : une fiche à moitié vide est pire qu'un
 * mot un peu technique, et cela se voit tout de suite au lieu de passer
 * inaperçu.
 */
export function nomMetier(cle) {
  if (!cle) return '';
  const m = MAP_METIERS[cle];
  return m ? m.nom : String(cle);
}

/**
 * Le nom d'une spécialité.
 *
 * Une spécialité peut être ÉCRITE À LA MAIN par l'artisan — c'est voulu,
 * aucune liste ne prévoit tout. Elle n'est alors pas dans le catalogue, et
 * on la rend telle quelle.
 */
export function nomSpecialite(cle) {
  if (!cle) return '';
  const s = MAP_SPECIALITES[cle];
  return s ? s.nom : String(cle);
}

/** Le nom de la catégorie d'un métier. */
export function categorieDe(cle) {
  const m = MAP_METIERS[cle];
  return m ? MAP_CATEGORIES[m.categorie] || '' : '';
}

/**
 * Tous les mots par lesquels on peut trouver ce métier : son nom, ses
 * synonymes, et le nom de ses spécialités.
 *
 * C'est ce qu'on donne à la recherche À LA PLACE de la clé. Une fiche
 * enregistre `peintre-en-batiment` ; personne ne tape cela.
 *
 * Une clé inconnue — un métier retiré du catalogue, une vieille donnée —
 * est rendue telle quelle : mieux vaut un mot technique trouvable que rien
 * du tout.
 */
export function motsDuMetier(cle) {
  if (!cle) return '';
  const m = MAP_METIERS[cle];
  if (!m) return String(cle);
  return [m.nom, ...(m.syn || []), ...(m.spe || []).map((x) => x.nom)].join(' ');
}

/** Les métiers proposables aujourd'hui, dans l'ordre du catalogue. */
export function metiersActifs() {
  return CATALOGUE.filter((m) => m.actif !== false);
}

/**
 * Chercher un métier — sans accent, sans casse, sur tous les mots.
 *
 * Tous les mots tapés doivent être trouvés, dans n'importe quel ordre :
 * « avocat construction » rend l'avocat en droit de la construction, et
 * pas tous les avocats ni tous les constructeurs.
 *
 * Le classement : ceux dont le NOM commence par ce qu'on a tapé d'abord.
 * « maç » doit rendre Maçon avant Maçon paysagiste, sinon on doute d'avoir
 * bien cherché.
 */
export function chercherMetiers(texte, { limite = 40 } = {}) {
  const mots = normaliser(texte).split(' ').filter(Boolean);
  if (!mots.length) return [];

  const trouves = metiersActifs().filter((m) => mots.every((mot) => FOIN[m.cle].includes(mot)));
  const debut = normaliser(texte);

  return trouves
    .map((m) => ({ m, rang: normaliser(m.nom).startsWith(debut) ? 0 : 1 }))
    .sort((a, b) => a.rang - b.rang || a.m.nom.localeCompare(b.m.nom, 'fr'))
    .slice(0, limite)
    .map((x) => x.m);
}

/**
 * Les spécialités proposées à quelqu'un qui exerce ces métiers.
 *
 * Elles sont RATTACHÉES au métier (§9 de la demande) : un couvreur ne se
 * voit pas proposer « ouverture de mur porteur ». Et elles ne consomment
 * aucun des quatre emplacements de métier.
 */
export function specialitesProposees(cles = []) {
  return (cles || [])
    .map((cle) => MAP_METIERS[cle])
    .filter(Boolean)
    .flatMap((m) => (m.spe || []).map((s) => ({ ...s, metier: m.cle })));
}

/** Les métiers d'un artisan, principal en tête. Toujours un tableau. */
export function metiersDe(pro) {
  if (!pro) return [];
  if (Array.isArray(pro.metiers) && pro.metiers.length) return pro.metiers;
  return pro.metier ? [pro.metier] : [];
}

/** Le métier principal : celui qui s'affiche sur les publications. */
export function metierPrincipal(pro) {
  return metiersDe(pro)[0] || '';
}

/** Cet artisan exerce-t-il ce métier ? */
export function exerce(pro, metier) {
  if (!metier) return true;
  return metiersDe(pro).includes(metier);
}

/**
 * Ce qu'on affiche sous le nom : « Plombier · Chauffagiste ».
 * Au-delà de deux, on abrège — une ligne de quatre métiers ne se lit plus
 * et pousse le reste de la carte hors de l'écran.
 */
export function libelleMetiers(pro, { max = 2 } = {}) {
  /* Les clés sont traduites ICI, jamais laissées telles quelles : le
     profil enregistre `macon`, l'écran doit lire « Maçon ». */
  const liste = metiersDe(pro).map(nomMetier);
  if (liste.length <= max) return liste.join(' · ');
  return `${liste.slice(0, max).join(' · ')} +${liste.length - max}`;
}
