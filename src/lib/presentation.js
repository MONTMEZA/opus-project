/**
 * L'assistant de présentation : les questions, et de quoi écrire un texte.
 *
 * POURQUOI CE N'EST PAS UNE DISCUSSION
 * ------------------------------------
 * Un artisan remplit son profil sur un chantier, debout, souvent avec les
 * mains sales. Une conversation libre avec un robot lui demande de trouver
 * ses mots — exactement ce qu'il ne sait pas faire, et la raison pour
 * laquelle la case « Présentation » reste vide sur la moitié des profils.
 *
 * Cinq questions, des réponses à toucher, deux champs libres courts. Trente
 * secondes montre en main.
 *
 * POURQUOI LE TEXTE S'ÉCRIT AUSSI SANS IA
 * ---------------------------------------
 * L'IA passe par une Edge Function Supabase, qui peut ne pas être branchée,
 * être hors service, ou le téléphone hors réseau. Une fonction qui ne marche
 * qu'à moitié du temps n'est pas utilisée. Les réponses au questionnaire
 * suffisent à rédiger quelque chose de correct ici même : l'IA améliore le
 * texte, elle n'est pas ce qui le rend possible.
 *
 * Ce fichier ne contient aucune dépendance React : il se teste avec node.
 */

/** Le nom de l'activité, pour écrire « maçonnerie » et pas « maçon ». */
export const ACTIVITES = {
  'Maçon': 'maçonnerie',
  'Électricien': 'électricité',
  'Plombier': 'plomberie',
  'Charpentier': 'charpente',
  'Peintre': 'peinture',
  'Carreleur': 'carrelage',
  'Couvreur': 'couverture',
  'Menuisier': 'menuiserie',
  'Plaquiste': 'plâtrerie',
  'Terrassier': 'terrassement',
  'Serrurier': 'serrurerie',
  'Chauffagiste': 'chauffage',
};

export const QUESTIONS = [
  {
    cle: 'anciennete',
    titre: 'Depuis combien de temps exercez-vous ?',
    choix: [
      { cle: 'debut', label: 'Moins de 2 ans' },
      { cle: 'quelques', label: '2 à 5 ans' },
      { cle: 'solide', label: '5 à 10 ans' },
      { cle: 'longue', label: 'Plus de 10 ans' },
    ],
  },
  {
    cle: 'equipe',
    titre: 'Vous travaillez...',
    choix: [
      { cle: 'seul', label: 'Seul' },
      { cle: 'deux', label: 'À deux' },
      { cle: 'petite', label: 'Une équipe de 3 à 5' },
      { cle: 'grande', label: 'Plus de 5 personnes' },
    ],
  },
  {
    cle: 'chantiers',
    titre: 'Vos chantiers les plus fréquents ?',
    libre: true,
    exemple: 'Ex. : rénovation de façades, dalles béton, ouvertures dans le mur porteur',
  },
  {
    cle: 'qualites',
    titre: 'Que vous disent le plus souvent vos clients ?',
    multiple: true,
    choix: [
      { cle: 'ponctuel', label: 'Ponctuel' },
      { cle: 'propre', label: 'Chantier propre' },
      { cle: 'prix', label: 'Prix clairs' },
      { cle: 'conseil', label: 'Bon conseil' },
      { cle: 'finitions', label: 'Finitions soignées' },
      { cle: 'dispo', label: 'Joignable' },
      { cle: 'delais', label: 'Délais tenus' },
    ],
  },
  {
    cle: 'particularite',
    titre: 'Une chose que vous faites et que peu font ?',
    libre: true,
    facultatif: true,
    exemple: "Ex. : je passe toujours revoir le chantier un mois après la fin",
  },
];

const ANCIENNETE = {
  debut: { phrase: 'depuis moins de deux ans', court: 'jeune entreprise' },
  quelques: { phrase: 'depuis plus de deux ans', court: 'plus de 2 ans de métier' },
  solide: { phrase: 'depuis plus de cinq ans', court: 'plus de 5 ans de métier' },
  longue: { phrase: 'depuis plus de dix ans', court: 'plus de 10 ans de métier' },
};

/**
 * L'équipe décide aussi de la PERSONNE du texte : seul, on dit « je » ;
 * à plusieurs, on dit « nous ». Mélanger les deux dans la même présentation
 * est la faute qui se voit le plus — et c'est ce que faisait la première
 * version de ce fichier.
 */
const EQUIPE = {
  seul: { pluriel: false, sansPersonne: 'artisan seul', court: 'artisan seul' },
  deux: { pluriel: true, sansPersonne: 'équipe de deux personnes', court: 'équipe de deux' },
  petite: { pluriel: true, sansPersonne: 'équipe de trois à cinq personnes', court: 'équipe de 3 à 5' },
  grande: { pluriel: true, sansPersonne: 'équipe de plus de cinq personnes', court: 'équipe de plus de 5' },
};

const QUALITES = {
  ponctuel: 'la ponctualité',
  propre: 'un chantier laissé propre',
  prix: 'des prix annoncés clairement',
  conseil: 'le conseil avant de commencer',
  finitions: 'des finitions soignées',
  dispo: "la facilité à me joindre",
  delais: 'des délais tenus',
};

/** « maçonnerie et carrelage », « plomberie, chauffage et électricité ». */
export function activitesDe(metiers = []) {
  const noms = metiers.map((m) => ACTIVITES[m] || String(m).toLowerCase());
  if (noms.length === 0) return '';
  if (noms.length === 1) return noms[0];
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

/** « maçon et carreleur ». */
export function metiersEnToutesLettres(metiers = []) {
  const noms = metiers.map((m) => String(m).toLowerCase());
  if (noms.length === 0) return 'artisan';
  if (noms.length === 1) return noms[0];
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

function listeDeQualites(cles = []) {
  const noms = cles.map((c) => QUALITES[c]).filter(Boolean);
  if (noms.length === 0) return '';
  if (noms.length === 1) return noms[0];
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}

/** Une phrase commence par une majuscule et se termine par un point. */
function phrase(texte) {
  const t = String(texte || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const avecMajuscule = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(avecMajuscule) ? avecMajuscule : `${avecMajuscule}.`;
}

/**
 * La phrase libre de l'artisan est écrite avec SES mots, donc à SA personne.
 * Dans une présentation au « nous », un « je repasse voir le chantier »
 * détonne. On la garde telle quelle — c'est ce qu'elle a de précieux — mais
 * on ne la met pas dans la variante qui jure avec elle.
 */
function ditJe(texte) {
  return /^(je |j'|mon |ma |mes )/i.test(String(texte || '').trim());
}

/** Après deux points, le français garde la minuscule. */
function minuscule(texte) {
  const t = String(texte || '').trim();
  if (!t) return '';
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * Trois présentations écrites ici même, à partir des réponses.
 * Trois, parce qu'un texte unique se lit comme une obligation : devant trois
 * propositions, on choisit, et on se met à corriger — ce qui est le but.
 */
export function redigerLocalement({ profil = {}, reponses = {} }) {
  const metiers = (profil.metiers && profil.metiers.length)
    ? profil.metiers
    : [profil.metier].filter(Boolean);

  const entreprise = (profil.entreprise || '').trim();
  const ville = (profil.ville || '').trim();
  const anciennete = ANCIENNETE[reponses.anciennete] || null;
  const equipe = EQUIPE[reponses.equipe] || null;
  const chantiers = String(reponses.chantiers || '').trim();
  const qualites = listeDeQualites(reponses.qualites || []);
  const plus = String(reponses.particularite || '').trim();

  const lieu = ville ? ` à ${ville}` : '';
  const activites = activitesDe(metiers);
  const metiersMots = metiersEnToutesLettres(metiers);

  /* 1. Factuelle — sans « je » ni « nous ». Celle qui convient aux artisans
     qui n'aiment pas se mettre en avant. Seule la phrase écrite par
     l'artisan lui-même garde ses mots, et donc sa personne. */
  const reperesFactuels = [
    anciennete ? `en activité ${anciennete.phrase}` : '',
    equipe ? equipe.sansPersonne : '',
  ].filter(Boolean).join(', ');

  const factuelle = [
    phrase(`${entreprise || 'Notre entreprise'} — ${activites}${lieu}`),
    reperesFactuels ? phrase(reperesFactuels) : '',
    chantiers ? phrase(`Chantiers les plus fréquents : ${minuscule(chantiers)}`) : '',
    qualites ? phrase(`Ce que les clients retiennent : ${minuscule(qualites)}`) : '',
    plus ? phrase(plus) : '',
  ].filter(Boolean).join(' ');

  /* 2. À la première personne — « je » ou « nous », selon la taille de
     l'équipe, et jamais les deux dans le même texte. */
  const pluriel = equipe ? equipe.pluriel : false;
  const jeNous = pluriel ? 'Nous sommes' : 'Je suis';
  const monMes = pluriel ? 'Nos' : 'Mes';
  const jInterviens = pluriel ? 'Nous intervenons' : "J'interviens";
  const apprecient = pluriel ? 'apprécient' : 'apprécient';
  const decrivez = pluriel
    ? 'Décrivez-nous votre projet, nous vous répondons rapidement'
    : 'Décrivez-moi votre projet, je vous réponds rapidement';

  const ouverture = [
    `${jeNous} ${pluriel ? 'une ' : ''}${pluriel ? equipe.sansPersonne : metiersMots}${lieu}`,
    anciennete ? `, ${anciennete.phrase}` : '',
  ].join('');

  const personnelle = [
    phrase(ouverture),
    pluriel ? phrase(`Notre métier : ${minuscule(activites)}`) : '',
    !pluriel && equipe ? phrase('Je travaille seul') : '',
    chantiers ? phrase(`${jInterviens} surtout sur ${minuscule(chantiers)}`) : '',
    qualites ? phrase(`${monMes} clients ${apprecient} ${minuscule(qualites)}`) : '',
    plus && !(pluriel && ditJe(plus)) ? phrase(plus) : '',
    phrase(decrivez),
  ].filter(Boolean).join(' ');

  /* 3. Courte — pour un profil qu'on lit sur un téléphone, en vitesse. */
  const repere = [
    anciennete ? anciennete.court : '',
    equipe ? equipe.court : '',
  ].filter(Boolean).join(' · ');

  const courte = [
    phrase(`${metiersMots}${lieu}`),
    repere ? phrase(repere) : '',
    chantiers ? phrase(chantiers) : '',
    qualites ? phrase(qualites) : '',
  ].filter(Boolean).join(' ');

  return [
    { cle: 'factuelle', titre: 'Factuelle', texte: factuelle },
    { cle: 'personnelle', titre: 'À la première personne', texte: personnelle },
    { cle: 'courte', titre: 'Courte', texte: courte },
  ].filter((p) => p.texte.length > 0);
}

/**
 * Les réponses TRADUITES, pour l'assistant IA.
 *
 * Le questionnaire enregistre des clés internes : « longue », « petite »,
 * « propre ». Envoyées telles quelles au modèle, elles ne veulent rien dire —
 * et le premier essai réel l'a montré : l'artisan avait coché « plus de
 * 10 ans », le texte revenait avec « depuis de nombreuses années ». Le modèle
 * n'inventait pas, il devinait, faute de savoir.
 *
 * On lui envoie donc exactement ce que l'artisan a lu à l'écran, plus le seul
 * renseignement qu'il ne peut pas déduire : travaille-t-il seul, ce qui décide
 * entre « je » et « nous ».
 */
export function reponsesLisibles(reponses = {}) {
  const anciennete = ANCIENNETE[reponses.anciennete] || null;
  const equipe = EQUIPE[reponses.equipe] || null;

  return {
    anciennete: anciennete ? anciennete.phrase : null,
    equipe: equipe ? equipe.sansPersonne : null,
    travailleSeul: equipe ? !equipe.pluriel : null,
    chantiers: String(reponses.chantiers || '').trim() || null,
    qualites: (reponses.qualites || []).map((c) => QUALITES[c]).filter(Boolean),
    particularite: String(reponses.particularite || '').trim() || null,
  };
}

/** Le questionnaire est-il assez rempli pour écrire quelque chose ? */
export function assezRempli(reponses = {}) {
  return Boolean(reponses.anciennete && reponses.equipe
    && String(reponses.chantiers || '').trim().length >= 3);
}
