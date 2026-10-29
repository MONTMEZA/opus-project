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

/**
 * « Lambesc (13) » → « Lambesc ».
 *
 * Le numéro entre parenthèses DÉPARTAGE les communes de même nom dans une
 * recherche (`decouperAffichage`, `adresse.js`) ; sur une fiche de client,
 * il s'imprimerait tel quel sur une facture. La même règle, recopiée ici
 * parce que ce fichier n'importe rien (`verifier-clients` la fait tourner
 * sur les mêmes cas).
 */
export function villeSansDepartement(texte) {
  const brut = String(texte == null ? '' : texte).trim();
  const m = brut.match(/^(.*?)\s*\((\d{2,3}|2[AB])\)\s*$/i);
  return m ? m[1].trim() : brut;
}

/**
 * Les chiffres d'un numéro de téléphone, sous leur forme NATIONALE (dix
 * chiffres, un « 0 » devant) : « +33 6 12 34 56 78 », « 0033 (0)6 12 34 56
 * 78 », « +33 (0)6… », « 06.12.34.56.78 » et « 6 12 34 56 78 » sont le
 * même numéro — c'est ce qui décide qu'une demande vient d'un client DÉJÀ
 * dans le carnet, donc ce qui évite un doublon (relecture du 29/10/2026 :
 * « +33 (0)6… » rendait douze chiffres, et une seconde fiche se créait en
 * silence). Un numéro étranger garde ses chiffres. Vide si l'on n'a pas au
 * moins neuf chiffres : un numéro incomplet ne prouve pas qu'on parle de la
 * même personne.
 */
export function chiffresDuTelephone(valeur) {
  const c = String(valeur == null ? '' : valeur).replace(/[^0-9]/g, '');
  let reste = null;
  if (c.startsWith('0033')) reste = c.slice(4);
  else if (c.startsWith('33') && (c.length === 11 || c.length === 12)) reste = c.slice(2);
  else if (c.length === 9 && c[0] !== '0') reste = c;
  if (reste !== null) {
    if (reste.length === 10 && reste[0] === '0') return reste;
    if (reste.length === 9 && reste[0] !== '0') return `0${reste}`;
  }
  return c.length >= 9 ? c : '';
}

/** Les fiches qui portent ce numéro — les actives d'abord. */
export function clientsDuMemeNumero(telephone, liste = []) {
  const cherche = chiffresDuTelephone(telephone);
  if (!cherche) return [];
  return liste
    .filter((c) => c && chiffresDuTelephone(c.telephone) === cherche)
    .sort((a, b) => Number(Boolean(a.archive)) - Number(Boolean(b.archive)));
}

/* Le nom de repli que la base rend quand ni la demande ni le compte n'en
   portent (`mes_demandes_recues()`, section 24). Ce n'est PAS un nom : une
   fiche « Un client » créée en silence serait un client qu'on ne retrouve
   plus. */
const NOM_DE_REPLI = 'Un client';

const net = (v) => String(v == null ? '' : v).trim();
const CODE_POSTAL = /^[0-9]{5}$/;

/**
 * LE LIEU ÉCRIT DANS UNE DEMANDE DE DEVIS, en trois cases — et s'il est SÛR.
 *
 * `quote_requests.ville` est un champ LIBRE (« Ville ou adresse du
 * chantier », prérempli depuis le compte) : on y lit « Lambesc (13) », mais
 * aussi « 13410 Lambesc » ou « 12 chemin des Pins, 13410 Lambesc ». On ne
 * découpe que ce qui se découpe SÛREMENT :
 *   - « Commune (dd) » → la commune, sans son « (13) » ;
 *   - « Commune (13410) » → la commune et son code postal ;
 *   - « …, 13410 Commune » → la rue (s'il y en a une), le code postal, la
 *     commune ;
 *   - un texte SANS chiffre → une commune ;
 *   - tout le reste (« 12 chemin des Pins ») → `sur: false` : on ne range
 *     pas une rue dans la case « ville » d'une facture. Le texte va dans
 *     « N° et rue », et c'est l'artisan qui vérifie.
 * Le CODE POSTAL ne se devine jamais d'une commune (Paris rendrait 75001 à
 * tout le monde) : il n'est repris que s'il est ÉCRIT.
 */
export function decouperLieuLibre(texte) {
  const brut = net(texte);
  if (!brut) return { adresse: '', codePostal: '', ville: '', sur: true };
  let m = brut.match(/^(.*?)\s*\((\d{2,3}|2[AB])\)$/i);
  if (m && !/\d/.test(m[1])) return { adresse: '', codePostal: '', ville: m[1].trim(), sur: true };
  m = brut.match(/^(.*?)\s*\((\d{5})\)$/);
  if (m && !/\d/.test(m[1])) return { adresse: '', codePostal: m[2], ville: m[1].trim(), sur: true };
  m = brut.match(/^(?:(.*?)[\s,]+)?(\d{5})\s+(\D.*)$/);
  if (m) return { adresse: net(m[1]).replace(/[\s,]+$/, ''), codePostal: m[2], ville: m[3].trim(), sur: true };
  if (!/\d/.test(brut)) return { adresse: '', codePostal: '', ville: brut, sur: true };
  return { adresse: brut, codePostal: '', ville: '', sur: false };
}

/**
 * L'ADRESSE D'UNE URGENCE, en trois cases — et si elle est SÛRE.
 *
 * Depuis le 29/10/2026, l'écran SOS range une adresse COMPLÈTE
 * (`adresseDUrgence`, `adresse.js`) : « 4 Rue des Acacias 13350 Charleval »
 * pour un numéro ou une rue, « Charleval (13) » pour une commune. Avant, il
 * ne rangeait que la RUE (« 4 Rue des Acacias », sans la commune) ou le nom
 * seul de la commune (« Charleval ») : ces urgences-là ne se découpent pas
 * sûrement (`sur: false`), et l'artisan vérifie.
 *
 * Le code postal d'une COMMUNE choisie dans la liste est le plus PETIT de la
 * commune (Marseille rend 13001) : il n'est pas repris. Celui d'un numéro ou
 * d'une rue, si.
 */
export function lieuDepuisUrgence({ adresse = null, codePostal = null } = {}) {
  const brut = net(adresse);
  const cp = CODE_POSTAL.test(net(codePostal)) ? net(codePostal) : '';
  if (!brut) return { adresse: '', codePostal: '', ville: '', sur: true };
  const commune = brut.match(/^(.*?)\s*\((\d{2,3}|2[AB])\)$/i);
  if (commune && !/\d/.test(commune[1])) {
    return { adresse: '', codePostal: '', ville: commune[1].trim(), sur: true };
  }
  if (cp) {
    const i = brut.lastIndexOf(` ${cp} `);
    if (i > 0) {
      return {
        adresse: brut.slice(0, i).trim().replace(/,$/, ''), codePostal: cp,
        ville: brut.slice(i + cp.length + 2).trim(), sur: true,
      };
    }
  }
  return { adresse: brut, codePostal: cp, ville: '', sur: false };
}

/**
 * LE LIEU QU'UNE DEMANDE CONNAÎT, quelle qu'elle soit — UNE seule porte pour
 * les trois gestes qui préremplissent une fiche (« Faire un devis »,
 * « Ajouter à mes clients », « Pour qui ? → Nouveau client ») : deux
 * façons d'arriver à la même fiche doivent faire le même travail
 * (relecture du 29/10/2026).
 *
 * Une urgence porte son adresse à part (`adresse`, `codePostal` — relus par
 * `api.lieuDeLUrgence`) ; une demande de devis, sa « ville » libre.
 */
export function lieuDeLaDemande(demande = {}) {
  if (demande.genre === 'sos') {
    return lieuDepuisUrgence({ adresse: demande.adresse, codePostal: demande.codePostal });
  }
  return decouperLieuLibre(demande.ville);
}

/**
 * CE QU'UNE DEMANDE REÇUE SAIT DÉJÀ DU CLIENT, prêt pour sa fiche.
 *
 * LE TÉLÉPHONE EST CELUI QUE LE CLIENT A ÉCRIT DANS SA DEMANDE, jamais
 * `users.telephone`, fermé à tout le monde le 29/09/2026 : le remettre à
 * l'écran par cette porte annulerait ce travail sans bruit. C'est la même
 * garde que la section 24.
 *
 * LE LIEU EST CELUI DU CHANTIER : il va AUSSI sur la fiche — décision du
 * propriétaire, 29/10/2026 —, découpé par `lieuDeLaDemande()`.
 */
export function clientDepuisDemande(demande = {}) {
  const nom = net(demande.clientNom || demande.nom);
  const lieu = lieuDeLaDemande(demande);
  return {
    type: 'particulier',
    nom: nom === NOM_DE_REPLI ? '' : nom,
    telephone: net(demande.telephone),
    ville: lieu.ville,
    codePostal: lieu.codePostal,
    email: '',
    adresse: lieu.adresse,
    siret: '',
    notes: '',
  };
}

/**
 * « FAIRE UN DEVIS » SUR UNE DEMANDE : la fiche du client se CRÉE TOUTE
 * SEULE, sauf s'il y a un doute — décision du propriétaire, 29/10/2026
 * (« création directe » ; « proposer la fiche existante » quand le numéro
 * est déjà dans le carnet).
 *
 *   - `{ geste: 'existante', fiche, raison }` : le MÊME NUMÉRO est déjà dans
 *     le carnet — on montre cette fiche, et l'artisan la choisit d'un appui.
 *     Pas de doublon, et il voit de qui il s'agit. `raison` vaut
 *     `'archivee'` quand cette fiche est archivée : il faut le DIRE ;
 *   - `{ geste: 'formulaire', raison }` : la fiche s'ouvre pré-remplie, et
 *     c'est l'artisan qui l'enregistre — le carnet n'a pas pu être lu (on
 *     ne crée pas à l'aveugle), la demande ne porte aucun vrai nom, un
 *     client du MÊME NOM existe (« le doublon s'avertit », section 41 : dans
 *     un village il y a souvent trois Martin), l'adresse de l'urgence n'a
 *     pas pu être lue, le lieu ne se découpe pas sûrement, ou une valeur ne
 *     passerait pas `validerClient()` ;
 *   - `{ geste: 'creer', valeurs }` : rien n'est douteux, la fiche se crée,
 *     avec les valeurs que `validerClient()` rend — celles qu'il aurait
 *     enregistrées lui-même.
 *
 * Le NUMÉRO passe avant tout le reste : une fiche qui existe déjà vaut
 * mieux qu'un formulaire, même quand la demande n'a pas de nom.
 */
/* Ce que la fiche DIT quand elle s'affiche au lieu du devis — sinon on
   touche « Faire un devis », une fiche apparaît, et l'on ne sait pas
   pourquoi. Une phrase par raison, écrite ici une fois. */
export const POURQUOI_LA_FICHE = Object.freeze({
  existante: 'Ce numéro de téléphone est déjà dans votre carnet : choisissez ce client pour le devis.',
  archivee: 'Ce numéro de téléphone est celui d’un client que vous avez archivé : choisissez-le pour le devis, ou remettez-le d’abord dans votre liste.',
  homonyme: 'Un client de ce nom est déjà dans votre carnet : vérifiez, puis enregistrez la fiche pour ouvrir le devis.',
  sans_nom: 'La demande ne donne pas le nom du client : écrivez-le, puis enregistrez la fiche pour ouvrir le devis.',
  carnet: 'Votre carnet n’a pas pu être lu : vérifiez que ce client n’y est pas déjà, puis enregistrez la fiche pour ouvrir le devis.',
  lieu: 'L’adresse de l’urgence n’a pas pu être lue : complétez-la si vous la connaissez, puis enregistrez la fiche pour ouvrir le devis.',
  adresse: 'L’adresse de la demande ne se range pas toute seule : vérifiez la rue, le code postal et la commune, puis enregistrez la fiche pour ouvrir le devis.',
  invalide: 'Une information de la demande ne peut pas aller telle quelle sur la fiche : corrigez-la, puis enregistrez la fiche pour ouvrir le devis.',
});

export function ficheAPartirDeLaDemande(valeurs, carnet, { lieuLu = true, lieuSur = true } = {}) {
  if (!Array.isArray(carnet)) return { geste: 'formulaire', raison: 'carnet' };
  const memeNumero = clientsDuMemeNumero(valeurs && valeurs.telephone, carnet);
  if (memeNumero.length) {
    return { geste: 'existante', fiche: memeNumero[0], raison: memeNumero[0].archive ? 'archivee' : 'existante' };
  }
  if (!valeurs || !String(valeurs.nom || '').trim()) return { geste: 'formulaire', raison: 'sans_nom' };
  if (clientsDuMemeNom(valeurs.nom, carnet).length) return { geste: 'formulaire', raison: 'homonyme' };
  if (!lieuLu) return { geste: 'formulaire', raison: 'lieu' };
  if (!lieuSur) return { geste: 'formulaire', raison: 'adresse' };
  /* La MÊME validation que le formulaire : ce qui part en base sans que
     l'artisan l'ait relu doit passer par la porte de ce qu'il aurait
     enregistré lui-même — sinon une valeur trop longue revient en refus de
     la base, et le devis s'ouvre sans client. Ce qui ne passe pas ouvre le
     formulaire, et c'est lui qui DIT quoi corriger. */
  const v = validerClient(valeurs);
  if (!v.ok) return { geste: 'formulaire', raison: 'invalide' };
  return { geste: 'creer', valeurs: v.valeurs };
}
