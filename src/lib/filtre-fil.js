/**
 * LE FILTRE DU FIL — ce que la loupe règle.
 *
 * CE FICHIER NE CHARGE RIEN DE REACT NATIVE, et c'est délibéré. Sixième
 * application de la leçon de `cloudinary-adresses.js` : un calcul pur rangé
 * dans un composant ne peut pas être FAIT TOURNER par un contrôle, et le
 * contrôle devient alors une lecture de texte qui prouve beaucoup moins.
 *
 * LA RÈGLE, TRANCHÉE PAR LE PROPRIÉTAIRE LE 05/10/2026
 * ----------------------------------------------------
 * « Si par contre il met sur son filtre maçon à 20 km, il lui montre sur le
 * fil que des posts de maçon à 20 km, mais le filtre doit se régler à la
 * main. »
 *
 * Donc un filtre DUR. J'avais proposé l'inverse — un fil qui « pencherait »
 * sans rien retirer — et son objection le dit mieux que moi : un filtre qui
 * laisse passer autre chose ne se VÉRIFIE pas. On pose « maçon », on voit un
 * couvreur, on en conclut que le réglage ne marche pas, et on ne s'en sert
 * plus.
 *
 * CE QUI LE REND ACCEPTABLE
 * -------------------------
 *   1. il se VOIT en permanence (la loupe change d'état, et une ligne
 *      rappelle le réglage) — « un filtre qu'on ne voit pas est un filtre
 *      qu'on oublie d'enlever », règle du 04/10 ;
 *   2. il s'enlève d'un appui ;
 *   3. **le métier ne survit pas à la fermeture de l'application, le
 *      secteur si.** C'est la réponse exacte à sa crainte : « si un jour il
 *      a besoin d'un couvreur il faut pas qu'il soit bloqué que sur des
 *      maçons ». Le secteur, lui, est l'endroit où l'on habite — il ne
 *      change pas, et le redemander tous les matins serait absurde.
 *
 * LA VÉRITÉ EST DANS LA BASE. `fil_filtre()` (section 33 de `schema.sql`)
 * applique tout cela en SQL. `correspond()` ci-dessous ne sert QU'AU MODE
 * DÉMONSTRATION, où il n'y a pas de base — et c'est la seule raison
 * acceptable d'écrire deux fois la même règle. Les deux sont éprouvées sur
 * le même jeu de cas.
 */
import { distanceKm } from './adresse.js';
import { nomMetier } from './metiers.js';

/** Aucun filtre. Le fil montre tout, et c'est l'état par défaut. */
export const FILTRE_VIDE = {
  metier: null,
  secteur: null,   // { ville, latitude, longitude, rayonKm }
  noteMin: null,
  verifies: false,
};

/** Les notes proposées. En dessous de 3, le filtre ne veut plus rien dire. */
export const NOTES_FIL = [3, 4, 4.5];

/** Y a-t-il quelque chose de posé ? C'est ce qui allume la loupe. */
export function filtreActif(f) {
  if (!f) return false;
  return !!(f.metier || (f.secteur && f.secteur.rayonKm) || f.noteMin || f.verifies);
}

/** Combien de réglages sont posés — le petit nombre à côté de la loupe. */
export function nombreDeReglages(f) {
  if (!f) return 0;
  return [f.metier, f.secteur && f.secteur.rayonKm, f.noteMin, f.verifies]
    .filter(Boolean).length;
}

/**
 * Le rappel écrit, celui de la ligne fine sous les onglets.
 *
 * Il NOMME chaque réglage : « Maçon · 20 km autour de Lambesc (13) ·
 * 4/5 et plus · vérifiés ». « 3 filtres » ne dirait pas lesquels, et il
 * faudrait rouvrir la feuille pour le savoir — c'est exactement ce que
 * cette ligne existe pour éviter.
 */
export function resumeFiltre(f) {
  if (!filtreActif(f)) return '';
  const bouts = [];
  if (f.metier) bouts.push(nomMetier(f.metier));
  if (f.secteur && f.secteur.rayonKm) {
    bouts.push(f.secteur.ville
      ? `${f.secteur.rayonKm} km autour de ${f.secteur.ville}`
      : `${f.secteur.rayonKm} km`);
  }
  if (f.noteMin) bouts.push(`${String(f.noteMin).replace('.', ',')}/5 et plus`);
  if (f.verifies) bouts.push('vérifiés');
  return bouts.join(' · ');
}

/**
 * Ce qui part vers `fil_filtre()`. Une seule fonction fabrique ces
 * arguments : deux endroits qui les construisent chacun de leur côté
 * finiraient par ne plus demander la même chose, et la première page du fil
 * ne ressemblerait plus aux suivantes.
 */
export function argumentsDuFil(f = {}, { abonnements = false, videos = false } = {}) {
  const s = f.secteur || {};
  return {
    metier: f.metier || null,
    latitude: s.rayonKm ? s.latitude : null,
    longitude: s.rayonKm ? s.longitude : null,
    rayonKm: s.rayonKm || null,
    noteMin: f.noteMin || null,
    verifies: !!f.verifies,
    abonnements,
    videos,
  };
}

/**
 * LA MÊME RÈGLE, pour le mode démonstration — il n'y a pas de base.
 *
 * `post` est une publication de `demo.js`, `pro` la fiche de son auteur
 * (`undefined` pour une publicité).
 *
 * TOUT FILTRE RETIRE LES PUBLICITÉS, et c'est voulu : une publicité n'a ni
 * auteur, ni métier, ni lieu, ni badge — elle ne peut satisfaire aucun
 * critère. Demander « les maçons vérifiés à 20 km » et recevoir une
 * publicité serait exactement ce qui fait perdre confiance dans un fil.
 * Elle revient dès qu'on enlève le filtre.
 */
export function correspond(post, pro, f = {}, { abonnements = null, videos = false } = {}) {
  const estPub = post.type === 'ad';

  if (videos && (estPub || !FORMATS_PLEIN_ECRAN.has(post.format))) return false;

  /* « Abonnements » garde les publicités : c'est le contrat passé avec
     l'annonceur, il ne dépend de personne. Les retirer reviendrait à ne les
     montrer qu'à ceux qui ne suivent personne. */
  if (abonnements && !estPub && !abonnements.has(post.proId)) return false;

  if (!filtreActif(f)) return true;
  if (estPub || !pro) return false;

  if (f.metier) {
    const siens = pro.metiers && pro.metiers.length ? pro.metiers : [pro.metier];
    if (!siens.includes(f.metier)) return false;
  }
  if (f.verifies && !pro.verifie) return false;

  if (f.noteMin) {
    /* Sans avis, il n'y a pas de note — et « pas de note » n'est pas « une
       mauvaise note ». On écarte quand même, parce qu'on ne va pas prêter
       une note à quelqu'un ; mais l'ÉCRAN doit le dire. Mesuré le
       05/10/2026 sur la vraie base : 4 artisans sur 7 n'ont AUCUN avis. */
    const avis = pro.reviews || [];
    if (!avis.length) return false;
    const moyenne = avis.reduce(
      (t, a) => t + (a.delais + a.qualite + a.tarif) / 3, 0) / avis.length;
    if (moyenne < f.noteMin) return false;
  }

  if (f.secteur && f.secteur.rayonKm) {
    /* « Pas de coordonnées » veut dire « on ne sait pas où » : prétendre que
       c'est à 10 km serait inventer. Même règle que les annonces. */
    if (pro.latitude == null || pro.longitude == null) return false;
    const d = distanceKm(f.secteur.latitude, f.secteur.longitude,
      pro.latitude, pro.longitude);
    if (d == null || d > f.secteur.rayonKm) return false;
  }

  return true;
}

/* La même liste que celle qui décide vers quel fil renvoyer après une
   publication. Deux listes séparées finiraient par diverger — c'est
   exactement ce qui excluait les montages du fil vidéo. */
const FORMATS_PLEIN_ECRAN = new Set(['video', 'montage']);
