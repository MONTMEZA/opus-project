/**
 * CE QU'ON DEMANDE À QUI — les pièces justificatives, par catégorie.
 *
 * LA DÉCISION DU PROPRIÉTAIRE, PRISE LE 30/09/2026
 * ------------------------------------------------
 * « Qui peut s'inscrire : tout l'écosystème, avec des pièces justificatives
 * PAR CATÉGORIE — un avocat n'a pas d'assurance décennale, et son badge
 * vérifié ne voudrait rien dire. »
 *
 * Jusqu'au 04/10/2026, l'application réclamait à TOUT LE MONDE un extrait
 * Kbis et une attestation décennale. Conséquences, et les deux sont des
 * défauts réels :
 *
 *   1. **un avocat, un courtier, un expert-comptable ne pouvaient JAMAIS
 *      obtenir le badge.** La base exige `kbis_valide AND assurance_valide`
 *      pour l'allumer ; sans décennale, impossible. On ouvrait l'inscription
 *      à tout l'écosystème et on fermait le badge à un tiers de celui-ci ;
 *   2. **« extrait Kbis » est faux pour un micro-entrepreneur**, qui n'en a
 *      pas : son équivalent est l'avis de situation au répertoire SIRENE.
 *      Le propriétaire lui-même est dans ce cas. Demander un document qui
 *      n'existe pas, c'est faire croire à l'artisan qu'il n'a pas le droit
 *      d'être là.
 *
 * CE QUI NE CHANGE PAS, ET POURQUOI C'EST IMPORTANT
 * -------------------------------------------------
 * **Il y a toujours DEUX pièces, et le schéma ne bouge pas.** C'est leur
 * NATURE qui dépend du métier, pas leur nombre :
 *
 *   - pièce 1 — **l'existence légale** : l'entreprise existe, elle a un
 *     SIRET. Kbis pour une société, avis SIRENE pour un micro-entrepreneur ;
 *   - pièce 2 — **la couverture** : décennale pour qui CONSTRUIT,
 *     responsabilité civile professionnelle pour qui CONSEILLE.
 *
 * `synchronise_verification()` en base continue donc d'exiger
 * `kbis_valide AND assurance_valide`, sans une ligne de SQL changée. Le §19
 * de la demande du propriétaire le dit : « ne pas remplacer inutilement des
 * composants fonctionnels ».
 *
 * CE QUI A ÉTÉ VÉRIFIÉ, ET CE QUI NE L'EST PAS
 * --------------------------------------------
 * Vérifié le 04/10/2026 : la décennale ne concerne pas que les artisans du
 * chantier. **Architectes, bureaux d'études et géomètres y sont soumis
 * aussi** — ce sont des « constructeurs » au sens de l'article 1792 du Code
 * civil, et c'était ma première erreur de conception. Seul le conseil
 * (juridique, comptable, assurance, financement) y échappe.
 *
 * ⚠️ **Ce fichier n'est pas un avis juridique.** Les `complementaires`
 * ci-dessous (ORIAS, COFRAC, Ordre, certification amiante) correspondent à
 * des obligations réelles de ces professions, mais le propriétaire doit les
 * faire confirmer avant d'ouvrir Opus au public. Une exigence inventée
 * écarterait des artisans légitimes ; une exigence oubliée donnerait un
 * badge à quelqu'un qui n'y a pas droit.
 */
/* LE CATALOGUE NE SE LIT PAS DIRECTEMENT — `verifier-metiers` l'interdit, et
   il a raison : une seule porte, `lib/metiers.js`. `MAP_CATEGORIES` donne
   les mêmes quinze catégories, clé et nom. */
import { cleCategorieDe, MAP_CATEGORIES } from '../lib/metiers.js';

/* --------------------------------------------------------------------------
   LES DEUX NATURES D'ASSURANCE
   -------------------------------------------------------------------------- */
export const DECENNALE = {
  cle: 'decennale',
  nom: 'Assurance décennale',
  court: 'Décennale',
  aide: 'Elle couvre pendant dix ans les dommages qui compromettent la solidité '
      + 'de l’ouvrage. Obligatoire pour tout ce qui touche à la construction.',
};

export const RC_PRO = {
  cle: 'rcpro',
  nom: 'Responsabilité civile professionnelle',
  court: 'RC professionnelle',
  aide: 'Elle couvre les conséquences d’une erreur de conseil. C’est l’équivalent '
      + 'de la décennale pour un métier qui ne construit pas.',
};

/* --------------------------------------------------------------------------
   LA PIÈCE D'EXISTENCE — la même pour tout le monde, mais pas sous le même nom

   Un micro-entrepreneur n'a pas de Kbis. Lui en réclamer un l'arrête net :
   il cherche un document qui n'existe pas, et finit par croire qu'Opus n'est
   pas pour lui. Les deux noms sont donc écrits côte à côte, partout.
   -------------------------------------------------------------------------- */
export const EXISTENCE = {
  cle: 'kbis',
  nom: 'Extrait Kbis ou avis SIRENE',
  court: 'Existence légale',
  aide: 'L’extrait Kbis si vous avez une société, l’avis de situation au '
      + 'répertoire SIRENE si vous êtes micro-entrepreneur. Les deux prouvent '
      + 'la même chose : votre entreprise existe et porte ce SIRET.',
};

/* --------------------------------------------------------------------------
   LES CATÉGORIES QUI NE CONSTRUISENT PAS

   Une LISTE D'EXCEPTIONS, et non une table de quinze lignes : il n'y en a
   qu'une aujourd'hui, et une table recopiant quatorze fois « décennale »
   finirait par diverger d'elle-même. Si une catégorie s'ajoute au catalogue
   demain, elle demande une décennale — ce qui est le bon défaut dans une
   application du bâtiment.
   -------------------------------------------------------------------------- */
const SANS_DECENNALE = ['conseil'];

/* --------------------------------------------------------------------------
   LES PIÈCES COMPLÉMENTAIRES

   Elles ne commandent PAS le badge, et c'est un choix. Le badge dit « cette
   entreprise existe et elle est assurée » — pas « elle a tous les agréments
   de sa profession ». Mélanger les deux rendrait le badge illisible : un
   artisan sans RGE paraîtrait moins sérieux qu'un autre, ce que ce projet
   refuse déjà pour le RGE (voir `verification.js`).

   Elles servent à l'administration, qui sait alors QUOI demander en plus
   avant de valider. Elles n'ont pas encore d'emplacement d'envoi dédié :
   on en construira un le jour où quelqu'un de ces métiers s'inscrira. Un
   emplacement que personne ne remplit est exactement le défaut que ce
   projet traque depuis le 01/10 — on écrit sans jamais relire.
   -------------------------------------------------------------------------- */
const COMPLEMENTAIRES = {
  demolition: [{
    cle: 'amiante',
    nom: 'Certification amiante',
    aide: 'Le retrait d’amiante exige une certification délivrée par un organisme '
        + 'accrédité. Sans elle, le chantier est illégal.',
  }],
  mesure: [{
    cle: 'cofrac',
    nom: 'Certification du diagnostiqueur',
    aide: 'Un diagnostiqueur immobilier est certifié par un organisme accrédité '
        + 'COFRAC, domaine par domaine (DPE, amiante, plomb, gaz, électricité).',
  }, {
    cle: 'oge',
    nom: 'Inscription à l’Ordre des géomètres-experts',
    aide: 'Un géomètre-expert ne peut exercer qu’inscrit au tableau de l’Ordre.',
  }],
  conception: [{
    cle: 'ordre-architectes',
    nom: 'Inscription à l’Ordre des architectes',
    aide: 'Le titre d’architecte est protégé : il suppose une inscription à '
        + 'l’Ordre.',
  }],
  conseil: [{
    cle: 'orias',
    nom: 'Immatriculation ORIAS',
    aide: 'Obligatoire pour un courtier en assurance ou en financement, et à '
        + 'renouveler chaque année.',
  }, {
    cle: 'barreau',
    nom: 'Inscription au barreau',
    aide: 'Pour un avocat.',
  }],
};

/* --------------------------------------------------------------------------
   CE QU'ON DEMANDE À CE PROFESSIONNEL-LÀ
   -------------------------------------------------------------------------- */

/** Les catégories d'un professionnel, d'après ses métiers. */
export function categoriesDe(metiers = []) {
  const vues = [];
  (metiers || []).forEach((m) => {
    /* La CLÉ, pas le nom : `categorieDe()` rend « Conseil, juridique,
       assurance, finance », et la comparaison avec `conseil` échouait en
       silence — un avocat se voyait réclamer une décennale. */
    const c = cleCategorieDe(m);
    if (c && !vues.includes(c)) vues.push(c);
  });
  return vues;
}

/**
 * L'assurance attendue.
 *
 * ⚠️ **Un seul métier qui construit suffit à exiger la décennale.** Un
 * professionnel porte jusqu'à quatre métiers, et rien n'empêche un courtier
 * en assurance construction d'être aussi maçon. Prendre la catégorie du
 * PREMIER métier aurait laissé passer une entreprise de gros œuvre sans
 * décennale — exactement ce que le badge est censé empêcher.
 *
 * Donc : RC professionnelle seulement si AUCUN des métiers ne construit.
 */
export function assuranceAttendue(metiers = []) {
  const cats = categoriesDe(metiers);
  if (!cats.length) return DECENNALE;   // on ne sait pas : on exige le plus
  const construit = cats.some((c) => !SANS_DECENNALE.includes(c));
  return construit ? DECENNALE : RC_PRO;
}

/** Les pièces complémentaires de ses catégories, sans doublon. */
export function complementairesDe(metiers = []) {
  const vues = new Map();
  categoriesDe(metiers).forEach((c) => {
    (COMPLEMENTAIRES[c] || []).forEach((p) => { if (!vues.has(p.cle)) vues.set(p.cle, p); });
  });
  return [...vues.values()];
}

/** Tout ce qu'on demande à ce professionnel, en une fois. */
export function piecesDe(metiers = []) {
  return {
    existence: EXISTENCE,
    assurance: assuranceAttendue(metiers),
    complementaires: complementairesDe(metiers),
  };
}

/** Pour les écrans d'administration : le résumé d'une catégorie. */
export function piecesDeCategorie(cle) {
  return {
    existence: EXISTENCE,
    assurance: SANS_DECENNALE.includes(cle) ? RC_PRO : DECENNALE,
    complementaires: COMPLEMENTAIRES[cle] || [],
  };
}

/** Les quinze catégories et ce qu'elles demandent — pour la documentation. */
export function tableauDesPieces() {
  return Object.entries(MAP_CATEGORIES)
    .map(([cle, nom]) => ({ cle, nom, ...piecesDeCategorie(cle) }));
}
