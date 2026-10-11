/**
 * LE CARNET DE CLIENTS — les calculs, et rien d'autre.
 *
 * CE FICHIER N'IMPORTE RIEN, et c'est la douzième fois dans ce projet
 * qu'on applique la leçon de `cloudinary-adresses.js` : un calcul pur
 * rangé dans un composant charge React Native, que `node` ne sait pas
 * ouvrir — donc `npm run verifier-clients` ne pourrait pas le FAIRE
 * TOURNER, et un contrôle qui plante ne vérifie rien (il n'écrit même pas
 * de « ✘ »).
 *
 * Ici c'est indispensable pour une raison de plus : **ce fichier décide ce
 * qui part en base.** Les contraintes de la section 41 sont le garde-fou ;
 * c'est cette validation-ci qui dit à l'artisan CE QU'IL DOIT CORRIGER.
 * Sans elle, un SIRET mal recopié reviendrait sous la forme « la base a
 * refusé cette valeur (contrainte « client_siret_check ») », assortie
 * d'une piste fausse — « schema.sql n'a pas été rejoué » — pour ce qui
 * n'est qu'une faute de frappe (`src/lib/erreurs.js`).
 */

export const TYPES_CLIENT = [
  { cle: 'particulier', label: 'Particulier' },
  { cle: 'entreprise', label: 'Entreprise' },
];

export const LONGUEUR_MAX = {
  nom: 120,
  telephone: 30,
  email: 160,
  adresse: 200,
  ville: 120,
  notes: 2000,
};

/** Le SIRET ne garde que ses chiffres — exactement ce que fait le
 *  déclencheur `tient_le_client()` (section 41.3). On le lit sur un Kbis ou
 *  on le colle depuis un courriel : « 123 456 789 00012 » et
 *  « 12345678900012 » sont le MÊME numéro, et refuser l'un sur deux serait
 *  incompréhensible. */
export function siretPropre(valeur) {
  return String(valeur == null ? '' : valeur).replace(/[^0-9]/g, '');
}

/** Un SIREN fait 9 chiffres, un SIRET 14. Rien d'autre n'est un numéro. */
export function siretValide(valeur) {
  const n = siretPropre(valeur);
  return n.length === 9 || n.length === 14;
}

/** La même garde que la base : on refuse ce qui ne PEUT PAS être une
 *  adresse, on ne prétend pas prouver qu'elle existe. La seule preuve,
 *  c'est qu'un message y arrive. */
export function emailPlausible(valeur) {
  const v = String(valeur == null ? '' : valeur).trim();
  if (!v) return true;
  const bouts = v.split('@');
  if (bouts.length !== 2) return false;
  return bouts[0].length > 0 && bouts[1].includes('.')
    && bouts[1].indexOf('.') > 0 && !bouts[1].endsWith('.');
}

const vide = (v) => String(v == null ? '' : v).trim() === '';
const propre = (v) => {
  const t = String(v == null ? '' : v).trim();
  return t === '' ? null : t;
};

/**
 * CE QUI PART EN BASE, OU CE QU'IL FAUT CORRIGER.
 *
 * Rend `{ ok: true, valeurs }` — prêtes pour l'insertion —, ou
 * `{ ok: false, champ, message }` avec UN SEUL message, en français, qui
 * dit quoi faire. Un formulaire qui signale cinq erreurs d'un coup ne se
 * lit pas sur un téléphone au soleil : on en corrige une, on revalide.
 *
 * **Le SIRET d'un particulier est VIDÉ, pas refusé.** C'est la règle du
 * calendrier du 04/10 — on supprime le défaut au lieu de le contrôler — et
 * c'est aussi ce que fait le déclencheur. Les deux côtés doivent dire la
 * même chose, sinon l'écran annonce un numéro que la base jette.
 */
export function validerClient(fiche = {}) {
  const type = fiche.type === 'entreprise' ? 'entreprise' : 'particulier';
  const nom = String(fiche.nom == null ? '' : fiche.nom).trim();

  if (!nom) {
    return {
      ok: false,
      champ: 'nom',
      message: type === 'entreprise'
        ? "Le nom de l'entreprise est obligatoire."
        : 'Le nom du client est obligatoire.',
    };
  }
  if (nom.length > LONGUEUR_MAX.nom) {
    return { ok: false, champ: 'nom', message: `Le nom ne peut pas dépasser ${LONGUEUR_MAX.nom} caractères.` };
  }

  /* Un particulier n'a pas de SIRET : on le jette sans rien dire, le
     numéro ne veut plus rien dire. */
  const siret = type === 'entreprise' && !vide(fiche.siret) ? siretPropre(fiche.siret) : null;
  if (siret && !siretValide(siret)) {
    return {
      ok: false,
      champ: 'siret',
      message: 'Un SIRET fait 14 chiffres (un SIREN, 9). Les espaces ne '
        + `comptent pas — vous en avez saisi ${siret.length}.`,
    };
  }

  if (!emailPlausible(fiche.email)) {
    return { ok: false, champ: 'email', message: "Cette adresse e-mail ne ressemble pas à une adresse : il faut un « @ » et un point après." };
  }

  const codePostal = propre(fiche.codePostal);
  if (codePostal && !/^[0-9]{5}$/.test(codePostal)) {
    return { ok: false, champ: 'codePostal', message: 'Un code postal fait 5 chiffres.' };
  }

  for (const [champ, cle] of [['telephone', 'telephone'], ['adresse', 'adresse'], ['ville', 'ville'], ['notes', 'notes']]) {
    const v = propre(fiche[champ]);
    if (v && v.length > LONGUEUR_MAX[cle]) {
      return { ok: false, champ, message: `Ce champ ne peut pas dépasser ${LONGUEUR_MAX[cle]} caractères.` };
    }
  }

  return {
    ok: true,
    valeurs: {
      type,
      nom,
      siret,
      telephone: propre(fiche.telephone),
      email: propre(fiche.email) ? String(fiche.email).trim().toLowerCase() : null,
      adresse: propre(fiche.adresse),
      codePostal,
      ville: propre(fiche.ville),
      notes: propre(fiche.notes),
    },
  };
}

/** Pour comparer deux noms : sans accents, sans casse, sans espaces en
 *  trop. « Mme MARTIN » et « mme martin » sont le même client. */
export function nomNormalise(valeur) {
  return String(valeur == null ? '' : valeur)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * LE DOUBLON S'AVERTIT, IL NE SE REFUSE PAS.
 *
 * La section 36.2 pose un index unique sur le titre d'un chantier, parce
 * qu'un titre est une ÉTIQUETTE qu'on retape. Un nom de client est une
 * IDENTITÉ : dans un village il y a souvent trois Martin, et refuser le
 * deuxième, c'est refuser un vrai client au profit d'une base propre.
 *
 * Rend les fiches existantes qui portent ce nom — l'écran les montre et
 * laisse décider. `saufId` sert à ne pas s'avertir de soi-même quand on
 * modifie une fiche.
 */
export function clientsDuMemeNom(nom, liste = [], saufId = null) {
  const cherche = nomNormalise(nom);
  if (!cherche) return [];
  return liste.filter((c) => c && c.id !== saufId && nomNormalise(c.nom) === cherche);
}

/**
 * CE QU'ON TAPE DANS LA RECHERCHE touche le nom, la ville, le téléphone,
 * l'e-mail et l'adresse : sur un chantier, on se souvient du village avant
 * du nom.
 *
 * **UN NUMÉRO SE CHERCHE SANS SES ESPACES**, et c'est le contrôle qui l'a
 * trouvé en faisant tourner cette fonction : « 0612 » ne trouvait pas
 * « 06 12 34 56 78 ». Personne ne tape les espaces d'un numéro dans une
 * recherche — et ça ne lève aucune erreur, la liste revient simplement
 * vide, ce qui ressemble à un carnet qui ne contient pas ce qu'on cherche.
 */
export function clientCorrespond(client, recherche) {
  const q = nomNormalise(recherche);
  if (!q) return true;
  if (!client) return false;

  const champs = [client.nom, client.ville, client.telephone, client.email, client.adresse];
  if (champs.some((v) => nomNormalise(v).includes(q))) return true;

  /* Dès que la recherche contient un chiffre, on compare AUSSI les
     chiffres seuls — du numéro comme du code postal. */
  const chiffres = String(recherche).replace(/[^0-9]/g, '');
  if (!chiffres) return false;
  return [client.telephone, client.codePostal]
    .some((v) => String(v == null ? '' : v).replace(/[^0-9]/g, '').includes(chiffres));
}

/**
 * LA LISTE : les actifs ou les archivés, filtrés, puis par nom.
 *
 * Par NOM et non par date : on vient chercher quelqu'un qu'on connaît, pas
 * voir ce qui est récent. C'est l'inverse du fil, et c'est voulu.
 */
export function clientsVisibles(liste = [], { recherche = '', archives = false } = {}) {
  return liste
    .filter((c) => c && Boolean(c.archive) === Boolean(archives))
    .filter((c) => clientCorrespond(c, recherche))
    .sort((a, b) => nomNormalise(a.nom).localeCompare(nomNormalise(b.nom), 'fr'));
}

/** Ce qu'une demande reçue sait déjà du client, prêt pour le formulaire.
 *
 *  LE TÉLÉPHONE EST CELUI QUE LE CLIENT A ÉCRIT DANS SA DEMANDE, jamais
 *  `users.telephone`, fermé à tout le monde le 29/09/2026 : le remettre à
 *  l'écran par cette porte annulerait ce travail sans bruit. C'est la même
 *  garde que la section 24.
 */
export function clientDepuisDemande(demande = {}) {
  return {
    type: 'particulier',
    nom: String(demande.clientNom || demande.nom || '').trim(),
    telephone: String(demande.telephone || '').trim(),
    ville: String(demande.ville || '').trim(),
    codePostal: String(demande.codePostal || '').trim(),
    email: '',
    adresse: '',
    siret: '',
    notes: '',
  };
}
