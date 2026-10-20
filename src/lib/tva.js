/**
 * LE N° DE TVA INTRACOMMUNAUTAIRE QUE L'ANNUAIRE NE PUBLIE PAS — tout ce
 * qui se calcule sans demander à personne, et la lecture de VIES.
 *
 * POURQUOI CE FICHIER EXISTE — 20/10/2026
 * ---------------------------------------
 * Le numéro de TVA d'une entreprise vient de l'annuaire des entreprises,
 * qui recopie la liste des numéros ACTIFS de la DGFiP. Quand il n'y en a
 * aucun, l'artisan l'écrit lui-même, et Opus ne le garde que si VIES — le
 * service de la Commission européenne qui dit si un numéro de TVA est
 * actif — le reconnaît (décision du propriétaire, section 48 de
 * `schema.sql`).
 *
 * Mesuré ce jour-là, et c'est ce qui interdit un simple champ : le numéro
 * d'une société se CALCULE depuis son SIREN, et les numéros calculés que
 * la DGFiP ne publie pas sont refusés par VIES. Calculer n'est pas
 * attribuer.
 *
 * CE FICHIER N'IMPORTE RIEN, ET C'EST UNE RÈGLE
 * ---------------------------------------------
 * Il est recopié OCTET POUR OCTET dans `supabase/functions/tva/tva.js` :
 * l'écran et la fonction Edge lisent le numéro et écrivent les messages
 * avec le MÊME code (`npm run verifier-tva` refuse qu'ils divergent). Un
 * seul `import`, et la copie ne tournerait plus dans Deno. C'est aussi la
 * leçon de `cloudinary-adresses.js` : un calcul pur rangé ailleurs ne peut
 * plus être FAIT TOURNER par un contrôle.
 *
 * LE VOCABULAIRE EST UNE RÈGLE
 * ----------------------------
 * VIES « reconnaît » ou « refuse » un numéro ; Opus le « fait contrôler ».
 * Jamais « vérifié » : ce mot appartient au badge. Et jamais « registre »
 * pour VIES : c'est un service qui interroge les administrations fiscales,
 * pas un registre.
 */

/* ================================================================== */
/*  1. LA SAISIE — sans réseau                                          */
/* ================================================================== */

/** Les caractères qu'un numéro collé emporte souvent avec lui. */
const SEPARATEURS = /[\s.\-_/  ]/g;

/**
 * La forme normale : majuscules, sans espaces ni points ni tirets. Onze
 * chiffres seuls (la clé et le SIREN, sans « FR ») reçoivent leur « FR ».
 */
export function normaliserNumeroTva(texte) {
  const t = String(texte == null ? '' : texte).replace(SEPARATEURS, '').toUpperCase();
  return /^\d{11}$/.test(t) ? `FR${t}` : t;
}

/**
 * La clé de deux chiffres d'un SIREN : (12 + 3 × (SIREN mod 97)) mod 97.
 *
 * C'est la formule publique des numéros français à clé CHIFFRÉE. Il existe
 * aussi des clés faites de LETTRES (74 numéros actifs commencent par « K »
 * dans la liste de la DGFiP, relevé du 20/10/2026) : leur algorithme
 * n'est pas publié, et VIES seul peut dire si elles sont justes.
 */
export function cleNumeriqueTva(siren) {
  const s = String(siren == null ? '' : siren);
  if (!/^\d{9}$/.test(s)) return null;
  /* Neuf chiffres tiennent dans un nombre JavaScript sans perte. */
  return String((12 + 3 * (Number(s) % 97)) % 97).padStart(2, '0');
}

/** La forme d'un numéro français : FR, deux caractères, neuf chiffres. */
export const FORME_TVA = /^FR[0-9A-Z]{2}\d{9}$/;

/**
 * Ce que la saisie permet déjà de dire, sans réseau :
 *
 *   vide         rien d'écrit ;
 *   incomplet    moins de 13 caractères utiles ;
 *   mal_forme    pas la forme FR + 2 + 9, ou des caractères qui n'y ont
 *                pas leur place ;
 *   cle_fausse   une clé de deux CHIFFRES qui ne tombe pas juste : ce
 *                numéro n'existe pas, et il est inutile de le demander à
 *                VIES ;
 *   autre_siren  ses 9 chiffres ne sont pas ceux de l'entreprise de
 *                l'appelant (quand on connaît son SIREN) ;
 *   pret         rien à redire : on peut le faire contrôler.
 *
 * `numero` est rendu sous sa forme normale dans tous les cas.
 */
export function analyserNumeroTva(texte, siren = null) {
  const numero = normaliserNumeroTva(texte);
  if (!numero) return { etat: 'vide', numero };
  if (!/^[0-9A-Z]+$/.test(numero) || !numero.startsWith('FR')) {
    /* « F » seul est un début, pas une faute. */
    if (numero === 'F') return { etat: 'incomplet', numero };
    return { etat: 'mal_forme', numero };
  }
  if (numero.length < 13) return { etat: 'incomplet', numero };
  if (!FORME_TVA.test(numero)) return { etat: 'mal_forme', numero };
  const cle = numero.slice(2, 4);
  const sonSiren = numero.slice(4);
  if (siren != null && String(siren) !== '' && sonSiren !== String(siren)) {
    return { etat: 'autre_siren', numero };
  }
  if (/^\d{2}$/.test(cle) && cle !== cleNumeriqueTva(sonSiren)) {
    return { etat: 'cle_fausse', numero };
  }
  return { etat: 'pret', numero };
}

/* ================================================================== */
/*  2. CE QUE VIES RÉPOND                                               */
/* ================================================================== */

/**
 * Les refus « je suis saturé », qui méritent un nouvel essai quelques
 * secondes plus tard.
 *
 * Mesuré le 20/10/2026 : sur une heure, les trois interfaces de VIES
 * (REST documenté, REST du site, SOAP) répondaient
 * `MS_MAX_CONCURRENT_REQ` au même rythme, plus d'une fois sur deux — la
 * file d'attente de la France est partagée. Une réponse réussie, elle,
 * met 8 à 13 secondes.
 */
export const CODES_SATURATION = Object.freeze([
  'MS_MAX_CONCURRENT_REQ', 'MS_MAX_CONCURRENT_REQ_TIME',
  'GLOBAL_MAX_CONCURRENT_REQ', 'GLOBAL_MAX_CONCURRENT_REQ_TIME', 'TIMEOUT',
]);

/** Une date que VIES a écrite, ou null — jamais une date inventée. */
function dateVies(valeur) {
  if (typeof valeur !== 'string') return null;
  /* Seulement la forme que la spécification de JavaScript oblige tout
     moteur à lire (« 2026-10-20T13:51:00.982Z ») : une autre forme lue au
     petit bonheur décalerait la date. */
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(valeur)) return null;
  const t = Date.parse(valeur);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/**
 * La réponse de VIES, lue — `numeroEnvoye` est la forme normale (« FR… »).
 *
 * Rend { etat } parmi :
 *   reconnu       VIES dit ce numéro actif (`vies_le` : la date qu'il a écrite) ;
 *   refuse        VIES dit ce numéro non actif ou non attribué ;
 *   sature        VIES est saturé : un nouvel essai a un sens ;
 *   mal_forme     VIES ne comprend pas le numéro (INVALID_INPUT) ;
 *   indisponible  tout le reste : une panne, une réponse d'une forme
 *                 inconnue, ou un numéro qui ne serait pas celui envoyé.
 *
 * LA RÈGLE QUI COMPTE : UNE FORME INCONNUE N'EST JAMAIS UN REFUS. Le piège
 * est mesuré : l'interface du site rend `isValid: false` avec un HTTP 200
 * quand la France est SATURÉE, alors que rien n'a été contrôlé. Seul le
 * code d'erreur dit la vérité. Dire « refusé » à tort, c'est envoyer un
 * artisan au service des impôts pour un numéro juste.
 *
 * Deux formes sont lues : celle du contrat officiel (`POST
 * /check-vat-number` : `valid`, ou `errorWrappers`), et celle de
 * l'interface du site (`isValid` et `userError`), au cas où.
 *
 * Le nom et l'adresse que VIES renvoie ne sont JAMAIS lus : Opus n'en a
 * pas besoin, et ce qu'on ne lit pas ne peut pas fuir.
 */
export function lireReponseVies(corps, numeroEnvoye) {
  if (!corps || typeof corps !== 'object' || Array.isArray(corps)) return { etat: 'indisponible' };

  /* Les erreurs d'abord : elles peuvent arriver avec un `isValid: false`. */
  const erreurs = [];
  if (Array.isArray(corps.errorWrappers)) {
    for (const e of corps.errorWrappers) if (e && typeof e.error === 'string') erreurs.push(e.error);
  }
  if (typeof corps.userError === 'string' && !['VALID', 'INVALID'].includes(corps.userError)) {
    erreurs.push(corps.userError);
  }
  if (corps.actionSucceed === false || erreurs.length > 0) {
    if (erreurs.length > 0 && erreurs.every((e) => CODES_SATURATION.includes(e))) return { etat: 'sature' };
    if (erreurs.includes('INVALID_INPUT')) return { etat: 'mal_forme' };
    return { etat: 'indisponible' };
  }

  /* Le numéro dont VIES parle doit être celui qu'on a envoyé. */
  const attendu = String(numeroEnvoye || '').slice(2);
  if (typeof corps.vatNumber === 'string' && normaliserNumeroTva(corps.vatNumber).replace(/^FR/, '') !== attendu) {
    return { etat: 'indisponible' };
  }
  if (corps.countryCode !== undefined && corps.countryCode !== 'FR') return { etat: 'indisponible' };

  const vies_le = dateVies(corps.requestDate);
  if (corps.valid === true) return { etat: 'reconnu', vies_le };
  if (corps.valid === false) return { etat: 'refuse' };
  if (corps.isValid === true && corps.userError === 'VALID') return { etat: 'reconnu', vies_le };
  if (corps.isValid === false && corps.userError === 'INVALID') return { etat: 'refuse' };
  return { etat: 'indisponible' };
}

/* ================================================================== */
/*  3. CE QUE LA FONCTION EDGE RENVOIE                                  */
/* ================================================================== */

/** Les issues que la fonction Edge peut rendre — toutes en HTTP 200. */
export const ISSUES_TVA_SERVEUR = Object.freeze([
  'reconnu', 'refuse', 'indisponible', 'mal_forme', 'cle_fausse', 'autre_siren',
  'deja_publie', 'sans_entreprise', 'sans_compte', 'trop_d_essais',
]);

/**
 * Toutes les issues, celles que l'APPLICATION fabrique comprises : `reseau`
 * (la demande n'est pas partie), `lent` (pas de réponse à temps) et
 * `service_indisponible` (une réponse, mais pas en 2xx : une panne d'Opus).
 */
export const ISSUES_TVA = Object.freeze([...ISSUES_TVA_SERVEUR, 'reseau', 'service_indisponible', 'lent']);

/** Les détails qu'une issue a le DROIT d'emporter vers le téléphone. */
const DETAILS_PUBLICS = {
  reconnu: ['numero', 'reconnu_le'],
  refuse: ['numero'],
  deja_publie: ['numero'],
  trop_d_essais: ['reessayer_a', 'portee'],
};

/**
 * La SEULE porte de sortie de la fonction Edge : rien d'imprévu ne sort.
 * Une issue inconnue LÈVE : c'est une faute de programmation, et elle doit
 * devenir une panne visible (HTTP 500), pas une réponse inventée.
 */
export function reponsePubliqueTva(resultat) {
  const issue = resultat && resultat.issue;
  if (!ISSUES_TVA_SERVEUR.includes(issue)) throw new Error(`Issue inconnue : ${String(issue)}`);
  const sortie = { issue };
  for (const k of DETAILS_PUBLICS[issue] || []) {
    if (resultat[k] !== undefined) sortie[k] = resultat[k];
  }
  return sortie;
}

/**
 * La ligne de `preuves_tva`, et RIEN d'autre : ni nom, ni adresse, ni la
 * réponse brute de VIES. `reconnu_le` n'y est PAS, et ne doit pas y être :
 * c'est la BASE qui la pose (`tient_la_preuve_tva`), à chaque écriture.
 */
export function ligneDePreuveTva({ pro_id, siren, numero, vies_le }) {
  if (!pro_id || !/^\d{9}$/.test(String(siren)) || !FORME_TVA.test(String(numero))) return null;
  if (String(numero).slice(4) !== String(siren)) return null;
  return { pro_id, siren: String(siren), numero: String(numero), vies_le: vies_le || null, source: 'vies' };
}

/* ================================================================== */
/*  4. CE QUE L'ÉCRAN DIT                                               */
/* ================================================================== */

/** Une heure locale du téléphone : « 14 h 32 », « 15 h ». */
function heureFrancaise(iso) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const m = d.getMinutes();
  return m === 0 ? `${d.getHours()} h` : `${d.getHours()} h ${String(m).padStart(2, '0')}`;
}

/** « 123 456 789 » : un SIREN se relit par groupes de trois. */
function sirenLisible(siren) {
  const s = String(siren == null ? '' : siren);
  return /^\d{9}$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}` : null;
}

/**
 * Le message d'un état de saisie ou d'une issue : { texte, action }.
 * `action` vaut 'corriger', 'reessayer' ou null — l'écran en tire son
 * bouton.
 *
 * TROIS FAMILLES, comme pour le SIRET, et elles ne se confondent pas :
 * la saisie (on aide à corriger) ; VIES n'a PAS répondu (on n'accuse
 * JAMAIS le numéro) ; VIES a répondu (on dit ce qu'il a dit).
 */
export function messageTva(issue, details) {
  const d = details && typeof details === 'object' ? details : {};
  switch (issue) {
    /* --- LA SAISIE -------------------------------------------------- */
    case 'vide':
      return {
        texte: 'Écrivez votre numéro de TVA intracommunautaire : FR, deux caractères, puis les 9 '
          + 'chiffres de votre SIREN. Il figure dans votre espace professionnel sur impots.gouv.fr.',
        action: null,
      };
    case 'incomplet':
      return {
        texte: 'Il manque des caractères : un numéro de TVA français en a 13 — FR, deux '
          + 'caractères, puis les 9 chiffres de votre SIREN.',
        action: null,
      };
    case 'mal_forme':
      return {
        texte: 'Ce numéro ne peut pas être un numéro de TVA français : il commence par FR, suivi '
          + 'de deux caractères et des 9 chiffres de votre SIREN. Relisez-le.',
        action: 'corriger',
      };
    case 'cle_fausse':
      return {
        texte: 'Les deux chiffres qui suivent FR ne correspondent pas aux 9 chiffres qui les '
          + 'suivent : l’un d’eux est sans doute mal tapé. Relisez-les.',
        action: 'corriger',
      };
    case 'autre_siren': {
      const s = sirenLisible(d.siren);
      return {
        texte: 'Ce numéro désigne une autre entreprise : ses 9 derniers chiffres doivent être '
          + `ceux de votre SIREN${s ? ` (${s})` : ''}.`,
        action: 'corriger',
      };
    }
    case 'pret':
      return { texte: null, action: null };

    /* --- VIES N'A PAS RÉPONDU : on n'accuse jamais le numéro -------- */
    case 'indisponible':
      return {
        texte: 'VIES n’a pas répondu : ce service de la Commission européenne est souvent saturé. '
          + 'Votre numéro n’est pas en cause, et rien n’a changé dans Opus. Réessayez dans '
          + 'quelques minutes.',
        action: 'reessayer',
      };
    case 'reseau':
      return {
        texte: 'Pas de connexion : la demande n’est pas partie. Votre numéro n’est pas en cause. '
          + 'Retrouvez du réseau, puis réessayez.',
        action: 'reessayer',
      };
    case 'lent':
      /* On ne sait pas si la réponse est arrivée après notre départ : on
         ne dit donc PAS « rien n'a changé ». */
      return {
        texte: 'VIES met trop de temps à répondre. Rouvrez « Mon entreprise » dans un instant : si '
          + 'votre numéro a été reconnu entre-temps, il y sera. Sinon, réessayez.',
        action: 'reessayer',
      };
    case 'service_indisponible':
      return {
        texte: 'Opus n’arrive pas à faire contrôler votre numéro pour l’instant. Votre numéro '
          + 'n’est pas en cause. Réessayez dans quelques minutes.',
        action: 'reessayer',
      };
    case 'trop_d_essais': {
      const heure = heureFrancaise(d.reessayer_a);
      const pourquoi = d.portee === 'service'
        ? 'Beaucoup de numéros sont envoyés à VIES en ce moment.'
        : 'Vous avez fait beaucoup d’essais depuis une heure.';
      const quand = heure
        ? `Vous pourrez réessayer à ${heure}.`
        : (d.portee === 'service' ? 'Réessayez dans une minute.' : 'Réessayez dans une heure.');
      return { texte: `${pourquoi} Votre numéro n’est pas en cause. ${quand}`, action: null };
    }

    /* --- VIES A RÉPONDU, OU OPUS SAIT DÉJÀ ------------------------- */
    case 'reconnu':
      return {
        texte: 'VIES reconnaît ce numéro : il s’imprimera sur vos devis, avec la date de ce contrôle.',
        action: null,
      };
    case 'refuse':
      return {
        texte: 'VIES ne reconnaît pas ce numéro aujourd’hui : il ne s’imprimera pas sur vos devis. '
          + 'Un numéro refusé n’est pas attribué, ou pas actif ; c’est votre service des impôts '
          + 'des entreprises qui peut dire pourquoi, et l’activer. Si vous êtes en franchise en '
          + 'base de TVA, choisissez-la dans « TVA ».',
        action: 'corriger',
      };
    case 'deja_publie':
      return {
        texte: 'L’annuaire des entreprises publie déjà le numéro de votre entreprise : c’est lui '
          + 'qui s’imprime. Touchez « Mettre à jour » pour le relire.',
        action: null,
      };
    case 'sans_entreprise':
      return {
        texte: 'Aucune entreprise n’est rattachée à votre compte : rattachez-la d’abord, c’est '
          + 'son SIREN qui dit à quoi ressemble son numéro de TVA.',
        action: null,
      };
    case 'sans_compte':
      return {
        texte: 'Votre session a expiré : reconnectez-vous, puis réessayez.',
        action: null,
      };

    default:
      /* Une issue que cette version ne connaît pas (un serveur plus récent).
         On le DIT, au lieu d'afficher un trou ou un « reconnu » inventé. */
      return {
        texte: 'Opus n’a pas compris la réponse reçue. Votre numéro n’est sans doute pas en '
          + 'cause. Réessayez dans quelques minutes.',
        action: 'reessayer',
      };
  }
}

/* ================================================================== */
/*  5. CE QUI NE SERT QU'À LA FONCTION EDGE                             */
/*                                                                      */
/*  Ici parce qu'un contrôle doit pouvoir les FAIRE TOURNER, et que     */
/*  `node` n'ouvre pas un fichier TypeScript de Deno. Aucun secret.     */
/* ================================================================== */

/**
 * Les limites d'appels — seuls les VRAIS appels à VIES comptent (une
 * réponse sortie de la base ne coûte rien à personne) :
 *
 *   - 6 par HEURE et par compte : un artisan qui se trompe deux fois de
 *     numéro, puis réessaie après une saturation, est loin du compte ;
 *   - 20 par MINUTE pour tout Opus. VIES range parmi les abus « un trafic
 *     élevé de numéros invalides » et bloque alors l'adresse : une seule
 *     personne ne doit pas pouvoir couper VIES à tous les artisans.
 *
 * Les compteurs vivent dans `siret_limites` (section 45.2), sous des clés
 * préfixées `tva-` : jamais celles du SIRET, sinon les contrôles de TVA
 * épuiseraient le budget des inscriptions professionnelles.
 */
export const LIMITES_TVA = Object.freeze({
  compte: Object.freeze({ max: 6, duree_ms: 60 * 60 * 1000 }),
  global: Object.freeze({ max: 20, duree_ms: 60 * 1000 }),
});

/**
 * Les essais auprès de VIES, pour UN appui de l'artisan :
 *
 *   - 4 essais au plus, espacés de 3 secondes, et SEULEMENT après une
 *     saturation : un refus ou une réponse se suffisent à eux-mêmes ;
 *   - 20 secondes par essai : une réponse réussie en met 8 à 13 (mesuré) ;
 *   - 45 secondes en tout : l'application, elle, attend 60 secondes. Un
 *     essai qui ne tiendrait plus dans ce budget ne part pas.
 */
export const ESSAIS_VIES = Object.freeze({
  max: 4,
  pause_ms: 3000,
  delai_ms: 20000,
  budget_ms: 45000,
});

/** Le début de la fenêtre qui contient cet instant : l'heure, ou la minute, pile. */
export function debutDeFenetre(instantMs, dureeMs) {
  return new Date(Math.floor(instantMs / dureeMs) * dureeMs).toISOString();
}

/**
 * Les pages web qui ont le droit d'appeler la fonction depuis un
 * navigateur — la MÊME règle que la fonction `siret` (voir `siret.js`) ;
 * `verifier-tva` compare les deux sur les mêmes origines.
 */
export const ORIGINES_AUTORISEES = Object.freeze([
  'https://opus-project.com',
  'https://www.opus-project.com',
]);

export function origineAutorisee(origine) {
  if (origine == null || origine === '') return true;
  const o = String(origine).trim().toLowerCase();
  if (ORIGINES_AUTORISEES.includes(o)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(o);
}
