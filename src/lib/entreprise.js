/**
 * CE QUE L'ÉCRAN DIT D'UNE ENTREPRISE TROUVÉE AU RÉPERTOIRE SIRENE.
 *
 * POURQUOI UN FICHIER À PART
 * --------------------------
 * Les mêmes phrases s'affichent à QUATRE endroits : la carte « Est-ce bien
 * votre entreprise ? » de l'inscription, « Passer en compte
 * professionnel », « Modifier mon profil → Mon entreprise » et la ligne
 * sous le nom, sur « Mon profil ». Écrites quatre fois, elles finiraient
 * par se contredire — c'est la leçon des voyants du 04/10.
 *
 * Et ce fichier ne charge ni React ni React Native : `verifier-etats` FAIT
 * TOURNER chaque phrase et refuse les deux mots interdits. Dixième
 * application de la leçon de `cloudinary-adresses.js`.
 *
 * LES DEUX MOTS QU'ON N'ÉCRIT JAMAIS ICI
 * --------------------------------------
 * « Vérifié » appartient au badge, posé par un humain après avoir regardé
 * des pièces. « Registre » désigne le RCS ou le RNE ; Sirene est un
 * RÉPERTOIRE, tenu par l'INSEE. Ce que dit ce fichier, c'est qu'une
 * entreprise EXISTE et qu'elle est ACTIVE, à une date — jamais que le
 * compte en est le titulaire : un SIRET est public, n'importe qui peut
 * taper celui d'un autre.
 *
 * L'IDENTITÉ est l'objet que rend la fonction Edge `siret` (ou une ligne
 * d'`entreprise_registre`) : les noms de champs sont ceux de la base,
 * `nom_commercial`, `code_insee`… On ne les renomme pas : deux écritures du
 * même objet finissent par diverger.
 */
import {
  communeLisible, departementDe, formaterSiret,
} from './siret.js';
import { formeCourte } from '../data/formes-juridiques.js';
import { metiersProposes } from '../data/ape-metiers.js';

/**
 * LA LONGUEUR D'UN NOM D'ENTREPRISE DANS UNE DEMANDE — 120 caractères.
 *
 * C'est le nombre de la contrainte `demande_pro_entreprise_check`
 * (section 45.4 de `schema.sql`), et il doit rester le MÊME des deux côtés.
 * Trouvé en vérifiant la jonction des trois morceaux le 15/10/2026 : le
 * champ « Nom de l'entreprise » n'avait aucune limite. Écrit plus long,
 *   - à l'inscription par la porte de secours, le compte se créait et la
 *     demande SE PERDAIT EN SILENCE — le déclencheur avale exprès son refus,
 *     pour qu'une métadonnée malformée ne coûte jamais un compte (prouvé sur
 *     PostgreSQL 16 : 121 caractères → 1 compte, 0 demande) ;
 *   - depuis le profil, la base refusait avec « le plus souvent,
 *     `schema.sql` n'a pas été rejoué » : une piste fausse.
 * Le champ s'arrête donc à 120, et `api.js` coupe au même nombre ce qu'un
 * préremplissage aurait pu apporter de plus. `verifier-etats` compare ce
 * nombre à celui de la base.
 */
export const NOM_ENTREPRISE_MAX = 120;

/** « 2026-09-02 » ou un horodatage → « 02/09/2026 ». Rien d'inventé sinon. */
export function dateFrancaise(valeur) {
  const m = String(valeur == null ? '' : valeur).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/**
 * LE NOM À AFFICHER — le nom commercial, sinon la dénomination.
 *
 * Rend `null` quand il n'y en a aucun, et c'est fréquent : pour un
 * entrepreneur individuel, la dénomination est VIDE (300 sur 300, mesuré
 * le 15/10), et 38 % n'ont pas de nom commercial non plus. On ne compose
 * JAMAIS un nom à partir du nom civil brut (`nom_complet_registre`), qui
 * ne sort d'ailleurs pas de la base.
 */
export function nomDeLEntreprise(identite) {
  if (!identite) return null;
  return identite.nom_commercial || identite.denomination || null;
}

/** Le titre de la carte quand il n'y a pas de nom : on dit pourquoi, on n'invente rien. */
export function titreSansNom(identite) {
  if (identite && identite.statut_diffusion === 'P') return 'Nom non publié par l’INSEE';
  if (identite && identite.est_ei) return 'Entreprise individuelle';
  return 'Entreprise sans nom publié';
}

/** « SARL · créée en 2022 » — la forme et l'année de l'ENTREPRISE. */
export function ligneForme(identite) {
  if (!identite) return '';
  const forme = formeCourte(identite.forme_juridique);
  const annee = /^\d{4}/.test(String(identite.date_creation || ''))
    ? String(identite.date_creation).slice(0, 4) : null;
  return [forme, annee ? `créée en ${annee}` : null].filter(Boolean).join(' · ');
}

/** « Lambesc (13) » — la commune en casse normale, et son département. */
export function communeEtDepartement(identite) {
  if (!identite) return '';
  const commune = communeLisible(identite.commune);
  if (!commune) return '';
  const dep = departementDe(identite.code_insee, identite.code_postal);
  return dep ? `${commune} (${dep})` : commune;
}

/** « Établissement de Lambesc (13) · siège », ou « · établissement secondaire ». */
export function ligneEtablissement(identite) {
  const lieu = communeEtDepartement(identite);
  const role = identite && identite.est_siege === true ? 'siège'
    : identite && identite.est_siege === false ? 'établissement secondaire' : null;
  if (!lieu) return role ? `Établissement · ${role}` : '';
  return `Établissement de ${lieu}${role ? ` · ${role}` : ''}`;
}

/** « SIRET 912 517 935 00033 ». */
export function ligneSiret(identite) {
  return identite && identite.siret ? `SIRET ${formaterSiret(identite.siret)}` : '';
}

/**
 * LA SOURCE, et ce qu'elle ne dit pas — la phrase en petit sous la carte.
 *
 * La Licence Ouverte de l'INSEE exige deux choses : « www.insee.fr » et la
 * date de dernière mise à jour. Elle interdit aussi de suggérer une
 * caution publique. D'où la seconde moitié : cela ne prouve pas que vous
 * êtes le titulaire, et ce n'est ni un agrément ni une validation par
 * l'État.
 */
export function texteSource(identite) {
  const maj = dateFrancaise(identite && identite.maj_insee);
  /* Le répertoire ne publie pas toujours sa date (`date_mise_a_jour_insee`
     peut manquer) : on le DIT, au lieu de laisser un trou que la Licence
     Ouverte demande de remplir — et les mentions légales l'annoncent. */
  return 'Source : répertoire Sirene de l’INSEE (www.insee.fr)'
    + (maj ? `, fiche mise à jour le ${maj}` : ', date de mise à jour non publiée')
    + ', consultée via l’API Recherche d’entreprises. Cela dit que l’entreprise '
    + 'existe et qu’elle est en activité ; cela ne prouve pas que vous en êtes le '
    + 'titulaire, et ce n’est ni un agrément ni une validation par l’État.';
}

/**
 * LE NOM PRÉREMPLI DANS LE FORMULAIRE — et il peut être VIDE, exprès.
 *
 * Le nom commercial, sinon la dénomination d'une SOCIÉTÉ. Pour un
 * entrepreneur individuel sans nom commercial, rien : le répertoire ne
 * connaît alors que son nom civil, et le champ « entreprise » est PUBLIC.
 * On le lui demande, avec une aide qui dit pourquoi.
 */
export function entreprisePreremplie(identite) {
  if (!identite) return '';
  if (identite.nom_commercial) return identite.nom_commercial;
  if (identite.est_ei) return '';
  return identite.denomination || '';
}

/** L'aide sous le champ, quand il arrive vide pour un entrepreneur individuel. */
export const AIDE_NOM_EI = 'Le nom sous lequel vos clients vous connaissent : celui de '
  + 'votre enseigne, ou votre nom. Il sera public.';

/** L'aide sous la ville préremplie. */
export const AIDE_VILLE = 'Commune de votre établissement. Si votre entreprise est '
  + 'domiciliée ailleurs que là où vous travaillez, mettez votre commune de travail.';

/**
 * LES MÉTIERS PROPOSÉS, et la phrase qui dit d'où ils viennent.
 *
 * `phrase` est `null` quand rien n'est proposé : le bloc des métiers s'ouvre
 * alors VIDE, avec « Choisissez votre métier » — jamais un « Maçon »
 * d'office, qui passerait pour une proposition du répertoire.
 */
export function propositionMetiers(identite) {
  if (!identite) return { metiers: [], phrase: null };
  const metiers = metiersProposes(identite.ape, identite.naf25);
  if (!metiers.length) return { metiers: [], phrase: null };
  const code = identite.ape || identite.naf25;
  return {
    metiers,
    phrase: `Proposé d’après votre activité déclarée (${code}) — corrigez si ce `
      + 'n’est pas le bon.',
  };
}

/**
 * LA LIGNE SOUS LE NOM, SUR « MON PROFIL ».
 *
 * La date est TOUJOURS écrite : une mention sans date laisserait croire
 * qu'elle vaut encore aujourd'hui, alors que rien ne reconsulte le
 * répertoire. Et une identité ouverte À LA MAIN par l'administration ne
 * dit pas « au répertoire » : personne ne l'y a vue.
 */
export function resumeEntreprise(identite) {
  /* « Aucune », et pas « jamais » : une fiche dont l'administration a
     retiré l'entreprise en a eu une. « SIRET jamais rattaché » l'affirmait
     à tort — relecture adverse du 15/10. */
  if (!identite) return 'Aucune entreprise rattachée';
  const le = dateFrancaise(identite.verifie_le);
  if (identite.source === 'administration') {
    return `Entreprise rattachée par l’administration d’Opus${le ? ` le ${le}` : ''}`;
  }
  return `Entreprise active au répertoire Sirene${le ? ` (vu le ${le})` : ''}`;
}
