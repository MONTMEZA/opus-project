/**
 * Couche de données de l'app.
 *
 * Deux modes, la même interface :
 *  - MODE DÉMO   : pas de .env → tout vit en mémoire (comportement du prototype).
 *  - MODE SUPABASE : .env rempli → lectures/écritures réelles dans la base.
 *
 * Les écrans n'appellent jamais Supabase directement : ils appellent ce fichier.
 * Ça permet de lancer l'app dans Expo Go avant même d'avoir créé la base.
 */
import { supabase, hasSupabase } from './supabase';
import {
  proProfiles as demoPros, initialPosts, initialConversations, initialNotifications,
  initialDemandes, initialAnnonces, initialDemandesRecues, initialChantiers,
  initialClients, initialReponsesAnnonces,
} from '../data/demo';
import { correspond } from './filtre-fil';
import { relativeTime } from './formats';
import { decouperPage, finDemo } from './page-fil';
import { photoActeur } from './notifications';

/* En HAUT, jamais en `await import()` : la règle du 01/10 — Metro découpe
   alors le paquet et va chercher le morceau manquant auprès du serveur de
   développement, au moment où la ligne s'exécute. */
import { envoyerFichier } from './storage';
import { morceauDeChemin } from './types-fichiers';
import { reduireImage, TAILLE_MAX_MO } from './media';
/* Le SIRET (section 45). `siret.js` n'importe rien, `erreurs.js` non plus,
   et `siret-demo.js` pas davantage : aucun cycle possible avec ce fichier. */
import { chiffresSeuls, communeLisible, departementDe } from './siret';
import { analyserNumeroTva, ESSAIS_VIES } from './tva';
import { NOM_ENTREPRISE_MAX } from './entreprise';
import {
  issueDeVerification, avecDelai, REFUS_DEVIS, SUPPRESSION_DEPASSEE, ErreurPoste, REFUS_DEMANDES, ErreurDeLaBase, REPONSE_FERMEE,
} from './erreurs';
import { GENRES_DEMANDE, refusDeTransition } from './transitions-demandes';
import { reponseDemo, IDENTITE_DEMO_DU_PRO } from '../data/siret-demo';
/* « Mon entreprise » pour les devis (section 46). `emetteur.js` et
   `emetteur-demo.js` n'importent que des fichiers purs : aucun cycle avec
   ce fichier, et `verifier-emetteur` peut les faire tourner. */
import {
  pourLaBase, nettoyerEmetteur, nettoyerAssurance, nettoyerTarifs,
  validerEmetteur, validerAssurance, validerTarifs, motifsEmetteur, lireMotifs,
} from './emetteur';
import { fabriquerEmetteurDemo, PRO_DEMO_EMETTEUR } from '../data/emetteur-demo';
/* Les tarifs réunis (section 47, lot T). `tarifs.js` n'importe que
   `emetteur.js` et `urgences.js`, `tarifs-demo.js` rien du tout : aucun
   cycle avec ce fichier, et `verifier-tarifs` peut les faire tourner. */
import { depuisLaRecherche } from './tarifs';
import { TARIFS_DEMO, MES_SOS_DEMO } from '../data/tarifs-demo';
import { SOS_ARTISANS, envoiSosDemo, sosDisponiblesDemo } from '../data/urgences';
/* Le chiffrage d'un devis (section 49, lot 1 du module devis). Les quatre
   fichiers n'importent que des fichiers purs — `devis.js` (`centimes.js`,
   `entreprise.js`), `file-ecriture.js` et `identifiant.js` rien du tout,
   `devis-demo.js` les deux premiers, `erreurs.js` et `demo.js` : aucun
   cycle avec ce fichier, et `verifier-devis` peut les faire tourner. */
import { creerFileEcriture, DELAI_ECRITURE } from './file-ecriture';
import { nouvelIdentifiant } from './identifiant';
import {
  choisirChamps, CHAMPS_DEVIS, CHAMPS_LIGNE, PLAFOND_LISTE, MEMOIRE_MAX, decouperListe,
  texteDUrgence,
} from './devis';
import { creerBaseDevisDemo, creerLienFermeDemo } from '../data/devis-demo';
/* La base de postes (section 50, lot P). `postes.js` n'importe que quatre
   fichiers purs (`devis.js`, `centimes.js`, `entreprise.js`,
   `rapprochement.js`) : aucun cycle avec ce fichier. Seul le plafond en
   vient — la lecture demande exactement ce nombre de lignes. */
import { POSTES_MAX } from './postes';

export const mode = hasSupabase ? 'supabase' : 'demo';

/* LES ABONNEMENTS DU MODE DÉMONSTRATION, À UN SEUL ENDROIT : le chargement
   initial les rend à l'écran, et le filtre « Abonnements » s'en sert. Deux
   listes séparées se contrediraient, et l'onglet paraîtrait cassé.

   Et déclarée ICI, tout en haut : ce projet a déjà perdu deux écrans
   blancs sur une `const` lue avant sa déclaration (`noop`, puis les trois
   voyants). */
export const ABONNEMENTS_DEMO = [4];

/* ------------------------------------------------------------------ */
/*  L'ENTREPRISE, EN MODE DÉMONSTRATION (section 45)                   */
/*                                                                     */
/*  Déclaré ICI, tout en haut, pour la même raison qu'au-dessus : ce   */
/*  fichier a déjà livré deux écrans blancs pour une `const` lue avant  */
/*  sa déclaration, et ni le linter ni `expo export` ne l'avaient vu.  */
/*                                                                     */
/*  La démonstration doit FAIRE VIVRE « Mon entreprise » et « Passer   */
/*  en compte professionnel » : sans base, ces deux écrans ne se        */
/*  verraient nulle part, et ne se vérifieraient pas ici non plus.     */
/*  Et elle applique les MÊMES refus que la base (OP006 à OP009) —     */
/*  une démonstration plus aimable que le serveur masquerait ce que    */
/*  l'artisan rencontrera pour de vrai.                                */
/* ------------------------------------------------------------------ */

/* Les identités rattachées, par fiche. L'artisan de démonstration (la
   fiche 1) a déjà la sienne. */
const entreprisesDemo = {
  1: { ...IDENTITE_DEMO_DU_PRO, verifie_le: new Date(Date.now() - 20 * 24 * 3600e3).toISOString() },
};
/* Les SIRET que la démonstration a « trouvés » pendant la session : la
   preuve fraîche de la base, en mémoire. Sans elle, rattacher ou devenir
   pro échoue en OP006 — exactement comme sur la vraie base. */
const preuvesDemo = new Map();
/* Les n° de TVA « reconnus par VIES » pendant la session (section 48), par
   fiche : la ligne de `preuves_tva`, en mémoire. */
const preuvesTvaDemo = {};
/* La fiche créée quand un particulier de démonstration passe pro. */
const prosAjoutesDemo = {};
let demandeProDemo = null;

/* « MON ENTREPRISE » POUR LES DEVIS, EN DÉMONSTRATION (section 46).
   Déclaré ICI, en haut, pour la même raison que les deux blocs du dessus.

   Par fiche, `{ emetteur, assurances, tarifs }` aux noms de la base. La
   fiche 1 part de `fabriquerEmetteurDemo()` — à moitié remplie EXPRÈS :
   cinq manques, pour que le mécanisme vive sans fichier `.env` et s'y
   vérifie. Fabriquée à la PREMIÈRE lecture, et pas au chargement du
   module : ses dates se calculent depuis l'heure où l'on regarde. Les
   identifiants sont des CHAÎNES (`String()`) : `Object.keys()` en rend, et
   les fiches de démonstration portent des nombres — le défaut des trois
   `===` du lot E. */
const emetteursDemo = {};

/* LE CHIFFRAGE D'UN DEVIS, EN DÉMONSTRATION (section 49, lot 1). Déclaré
   ICI, en haut, pour la même raison que les blocs du dessus. La base de
   devis en mémoire (`src/data/devis-demo.js`) naît à la PREMIÈRE lecture :
   ses dates partent de l'heure où l'on regarde. */
let baseDevisDemo = null;
/* LES FILES D'ÉCRITURE OUVERTES — UNE PAR DEVIS, gardées ici et nulle part
   ailleurs (`fileDuDevis`). Deux files pour le même devis — l'écran de
   saisie, et la liste qui le supprime — enverraient chacune « une requête
   à la fois », donc deux à la fois : exactement ce que la file empêche. */
const filesDevis = new Map();

/* ------------------------------------------------------------------ */
/*  Session                                                            */
/* ------------------------------------------------------------------ */

let currentUserId = null;

/** Mode démo : pas de vrai compte, un identifiant fictif suffit.
 *  (Le type de compte ne sert plus ici : il se lit dans les métadonnées de
 *  la session, sans réseau — voir `sessionLocale()`.) */
export async function ensureSession() {
  if (!hasSupabase) { currentUserId = 'demo-user'; return currentUserId; }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Aucune session ouverte.');
  currentUserId = session.user.id;
  return currentUserId;
}

/**
 * Reprend la session déjà ouverte sur ce téléphone, s'il y en a une.
 * Évite de redemander le mot de passe à chaque ouverture de l'app.
 * Renvoie { userId, userType } ou null.
 *
 * ELLE DOIT MARCHER SANS RÉSEAU, et elle ne le faisait pas.
 * ---------------------------------------------------------
 * `supabase.auth.getSession()` lit la session rangée sur le téléphone : il
 * répond même dans une cave. Mais la requête qui suivait — chercher le
 * TYPE de compte dans la table `users` — a besoin du réseau. Sans 4G, elle
 * échouait, la fonction levait, et l'application renvoyait à
 * « Choisissez votre profil » : un artisan déjà connecté se retrouvait
 * devant l'écran d'accueil comme s'il n'avait pas de compte.
 *
 * Le type est pourtant DÉJÀ sur le téléphone : `signUp()` l'écrit dans les
 * métadonnées du compte, et elles voyagent avec la session. On s'en sert
 * quand la base est injoignable, et la requête ne sert plus qu'à corriger
 * le tir quand le réseau est là.
 */
export async function restoreSession() {
  const locale = await sessionLocale();
  if (!locale) return null;

  try {
    const { data } = await supabase.from('users').select('type')
      .eq('id', currentUserId).maybeSingle();
    const enBase = data && data.type;
    /* LES MÉTADONNÉES SE RÉALIGNENT SUR LA BASE, UNE FOIS — section 45.
       Un compte qui passe pro par l'administration, ou par `devenir_pro()`,
       ne change que `users.type`. Le téléphone, lui, lit le type dans les
       métadonnées de la session : sans ce réalignement, il démarrait en
       particulier À CHAQUE LANCEMENT, puis basculait en pro — deux
       chargements complets, et l'interface particulier sans réseau.
       Mesuré par la relecture du plan. Après ce geste, la bascule n'arrive
       qu'une fois. Ce champ ne donne aucun droit (la base tient les
       siens) : on l'écrit sans crainte, et sans attendre la réponse. */
    if (enBase && enBase !== locale.userType) alignerTypeDuCompte(enBase);
    return { ...locale, userType: enBase || locale.userType };
  } catch (e) {
    /* Pas de réseau : on garde ce que le téléphone sait déjà. */
    return { ...locale, horsLigne: true };
  }
}

/**
 * LA PARTIE QUI NE DEMANDE RIEN À PERSONNE.
 *
 * `supabase.auth.getSession()` lit la session rangée sur le téléphone : elle
 * répond dans une cave, en avion, partout. Le TYPE de compte est dans les
 * métadonnées, que `signUp()` y écrit — donc il est là aussi.
 *
 * C'est elle qu'on appelle en premier au démarrage. La requête à la base
 * qui suit (`restoreSession`) ne sert plus qu'à corriger le tir si le type
 * a changé — et si elle ne revient pas, on a déjà de quoi ouvrir
 * l'application.
 */
export async function sessionLocale() {
  if (!hasSupabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  currentUserId = session.user.id;
  const metadonnees = (session.user && session.user.user_metadata) || {};
  return {
    userId: currentUserId,
    userType: metadonnees.type === 'pro' ? 'pro' : 'particulier',
  };
}

/**
 * Création de compte. Le type et le nom voyagent dans les métadonnées :
 * un trigger côté base crée la fiche dans `users` à partir de là
 * (voir cree_fiche_utilisateur dans schema.sql).
 *
 * Renvoie { session } — session vaut null quand Supabase exige une
 * confirmation par email avant d'ouvrir le compte.
 */
/**
 * Création de compte.
 *
 * LE FORMULAIRE PART AVEC LE COMPTE, ET C'EST TOUT LE LOT DU 05/10/2026.
 * ---------------------------------------------------------------------
 * Avant, la fiche professionnelle était créée par l'application, juste
 * après, et SEULEMENT si `signUp()` rendait une session. Avec la
 * confirmation par e-mail — qu'il faudra activer avant d'ouvrir au
 * public — il n'y a pas de session : l'artisan se retrouvait avec un
 * demi-compte, et les informations qu'il venait de saisir étaient perdues
 * dès qu'il fermait l'application pour aller lire son courriel.
 *
 * Elles voyagent donc dans les MÉTADONNÉES du compte, que PostgreSQL voit
 * au moment d'insérer la ligne : le déclencheur `cree_fiche_utilisateur()`
 * (section 31 de `schema.sql`) crée les deux moitiés d'un coup, sans
 * session et sans RLS.
 *
 * Ce qu'on y met ne donne AUCUN droit : un client modifié peut écrire ce
 * qu'il veut dans ces métadonnées, mais le déclencheur nomme ses colonnes
 * une par une et `verifie` n'en fait pas partie. Un métier inventé retombe
 * sur le premier du catalogue au lieu de faire échouer l'inscription.
 */
export async function signUp({
  email, password, userType, nom, entreprise, metiers, cguVersion,
  ville, codePostal, latitude, longitude, siret = null, demandePro = null,
}) {
  if (!hasSupabase) {
    currentUserId = 'demo-user';
    /* FIDÈLE à la base : la porte de secours crée un compte PARTICULIER et,
       dans la même transaction, sa demande (le déclencheur de la section
       45 la lit dans les métadonnées). Sans cette ligne, la démonstration
       dirait « passer en compte professionnel » à quelqu'un qui vient de
       le demander. */
    if (demandePro && demandePro.siret && !siret) {
      demandeProDemo = {
        id: `demo-demande-${Date.now()}`,
        siret: chiffresSeuls(demandePro.siret),
        motif: demandePro.motif || 'autre',
        entreprise: (demandePro.entreprise || '').trim().slice(0, NOM_ENTREPRISE_MAX) || null,
        metiers: (demandePro.metiers || []).slice(0, 4),
        message: null,
        justificatif: null,
        statut: 'nouvelle',
        note: null,
        created_at: new Date().toISOString(),
        traitee_le: null,
      };
    }
    return { session: true };
  }

  const metadonnees = { type: userType, nom: nom.trim() };
  if (cguVersion) metadonnees.cgu = cguVersion;

  /* LE LIEU, POUR TOUT LE MONDE — 05/10/2026.
     Il n'était emporté que pour un artisan : un particulier ne donnait que
     son nom, donc il n'avait ni commune ni coordonnées, et aucune recherche
     « autour de moi » ne pouvait fonctionner pour lui. Mesuré avant ce lot :
     1 particulier sur 5 avait des coordonnées. */
  if (ville) metadonnees.ville = ville;
  if (codePostal) metadonnees.code_postal = codePostal;

  /* LES COORDONNÉES ARRIVENT DÉJÀ COMPLÉTÉES.
     PostgreSQL ne sait pas appeler la Base Adresse Nationale : le
     déclencheur `cree_fiche_utilisateur()` ne peut donc PAS les calculer.
     C'est `handleSignUp` qui appelle `completerLieu()` juste avant, au même
     endroit et pour la même raison que l'enregistrement du profil et la
     publication d'une annonce — là où il y a déjà une attente visible.

     Les deux ou aucune : une latitude seule ne situe rien, et laisserait
     une ligne à moitié placée que tout calcul de distance ignorerait en
     silence. La base tient la même règle, et c'est voulu — elle reçoit
     aussi d'autres clients que cette application. */
  if (latitude != null && longitude != null) {
    metadonnees.latitude = latitude;
    metadonnees.longitude = longitude;
  }

  if (userType === 'pro') {
    if (entreprise) metadonnees.entreprise = entreprise.trim();
    if (metiers && metiers.length) metadonnees.metiers = metiers.slice(0, 4);
    /* LE SIRET, ET C'EST LA BASE QUI DÉCIDE CE QU'IL VAUT — section 45.
       Ce numéro ne prouve rien par lui-même : le déclencheur cherche une
       PREUVE fraîche que la fonction Edge `siret` a écrite après avoir
       interrogé le répertoire Sirene, et refuse le compte sans elle
       (OP006). L'identité de l'entreprise vient de cette preuve, jamais
       de ce que ce formulaire prétend. La CLÉ s'appelle `siret`, et
       `verifier-compte` le tient : une faute de frappe ici, et chaque
       inscription pro tomberait sur « Database error saving new user ». */
    metadonnees.siret = chiffresSeuls(siret);
  } else if (demandePro && demandePro.siret) {
    /* LA PORTE DE SECOURS : le compte naît PARTICULIER, et la demande
       avec lui. Seuls ces quatre champs voyagent dans les métadonnées —
       elles suivent chaque jeton et restent dans `auth.users`, hors de
       l'export RGPD. Le message et le justificatif s'ajoutent ensuite par
       `completer_ma_demande_pro()`. Une valeur malformée ici ne coûte
       jamais le compte : la base l'avale, et la demande se refait depuis
       le profil.

       Mais « avaler » veut dire PERDRE la demande, sans un mot : d'où la
       longueur coupée ici au nombre de `demande_pro_entreprise_check`. Un
       nom de 121 caractères créait le compte et rien d'autre (prouvé sur
       PostgreSQL le 15/10/2026). */
    metadonnees.demande_pro = {
      siret: chiffresSeuls(demandePro.siret),
      motif: demandePro.motif || 'autre',
      entreprise: (demandePro.entreprise || '').trim().slice(0, NOM_ENTREPRISE_MAX) || null,
      metiers: (demandePro.metiers || []).slice(0, 4),
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: metadonnees },
  });
  if (error) throw error;

  /* UN COMPTE QUI EXISTE DÉJÀ NE LÈVE PAS TOUJOURS D'ERREUR. Avec la
     confirmation par e-mail activée, Supabase rend un utilisateur SANS
     identité, et aucun message : l'écran annoncerait « regardez votre
     boîte » pour un courriel qui ne partira jamais. On le dit comme
     Supabase le dirait sans la confirmation — `messageClair` sait le
     traduire. */
  if (data && data.user && Array.isArray(data.user.identities)
      && data.user.identities.length === 0) {
    throw new Error('User already registered');
  }

  if (data.session) currentUserId = data.session.user.id;
  return { session: data.session };
}

/** Connexion à un compte existant. */
export async function signIn({ email, password }) {
  if (!hasSupabase) { currentUserId = 'demo-user'; return { userType: null }; }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  currentUserId = data.session.user.id;

  const { data: fiche } = await supabase.from('users')
    .select('type').eq('id', currentUserId).maybeSingle();
  const type = (fiche && fiche.type) || 'particulier';
  /* Même réalignement qu'à la réouverture : sinon le prochain lancement
     repartirait du type d'avant. */
  const meta = (data.session.user && data.session.user.user_metadata) || {};
  if (fiche && fiche.type && meta.type !== fiche.type) alignerTypeDuCompte(fiche.type);
  return { userType: type };
}

/**
 * Recopie le type de compte dans les métadonnées de la session.
 *
 * Une `function` déclarée, et pas une `const` : elle est appelée depuis
 * plus haut dans ce fichier (`restoreSession`, `signIn`). Le résultat
 * n'est pas attendu, et un échec n'est pas une panne — la base tient les
 * droits, et le prochain lancement réalignera.
 */
export function alignerTypeDuCompte(type) {
  if (!hasSupabase || (type !== 'pro' && type !== 'particulier')) return Promise.resolve();
  return supabase.auth.updateUser({ data: { type } })
    .then(() => undefined)
    .catch(() => undefined);
}

/* `ensureProProfile()` A ÉTÉ RETIRÉE LE 15/10/2026 (section 45).
   Elle insérait la fiche professionnelle DEPUIS L'APPLICATION, sans
   entreprise. La base refuse désormais cet INSERT (OP010) : toute fiche
   naît dans une fonction de la base qui exige une entreprise trouvée au
   répertoire Sirene — l'inscription, `devenir_pro()`, ou l'acceptation
   d'une demande par l'administration. Une fonction qui ne peut plus
   aboutir est le « bouton §18 » : `verifier-compte` exige son absence. */

/**
 * Envoi des justificatifs. Le profil passe en « en attente » : c'est VOUS
 * qui basculerez verification_statut sur 'verifie' depuis Supabase, après
 * avoir regardé les documents. Le badge vérifié ne s'obtient pas tout seul.
 */
export async function submitDocuments({ kbisPath, assurancePath, rgePath, rge }) {
  if (!hasSupabase) return null;
  /* « Voici mes documents » (`en_attente`) ne part qu'avec une pièce qui
     FAIT le badge — l'existence ou l'assurance (lot S-a). Envoyé avec un RGE
     seul, il laissait l'ÉCRAN afficher « en attente » sur une fiche vérifiée
     (la base, elle, remettait « vérifié » : mesuré par la relecture
     « écran ») ; on n'envoie plus ce statut pour une pièce qui ne fait pas
     le badge. */
  const patch = {};
  if (kbisPath || assurancePath) patch.verification_statut = 'en_attente';
  if (kbisPath) patch.kbis_url = kbisPath;
  if (assurancePath) patch.assurance_url = assurancePath;
  if (rgePath) patch.rge_url = rgePath;
  /* La déclaration RGE part avec les documents, et pas avec le reste du
     profil : c'est le même geste — « voici mes justificatifs » — et il
     serait déroutant qu'une moitié parte avec « Enregistrer » et l'autre
     avec « Envoyer pour vérification ». La base refusera de toute façon
     que `rge` passe à true depuis ici : c'est vous qui le basculez. */
  if (rge) {
    patch.rge_declare = !!rge.declare;
    patch.rge_numero = rge.numero || null;
    patch.rge_expire = rge.expire || null;
  }
  if (!Object.keys(patch).length) return null;

  const { error } = await supabase.from('professional_profiles')
    .update(patch).eq('id', currentUserId);
  if (error) throw error;
}

/* `reparerFichePro()` A ÉTÉ RETIRÉE LE MÊME JOUR, pour la même raison, et
   une de plus : elle relisait les MÉTADONNÉES du compte — que le client
   réécrit à volonté (`PUT /auth/v1/user`) — pour en tirer une fiche. Le
   seul compte pro sans fiche de la vraie base est la session anonyme du
   14/09, que le propriétaire supprimera. */

export function getUserId() { return currentUserId; }

/** Ferme la session. En mode démo, il n'y a rien à fermer côté serveur. */
export async function signOut() {
  if (hasSupabase && supabase) await supabase.auth.signOut();
  currentUserId = null;
  /* Les files d'écriture des devis appartiennent au compte qui s'en va :
     le suivant n'a rien à y trouver (la leçon du carnet resté en mémoire,
     17/10/2026). La garde de sortie d'`OpusApp` a déjà dit ce qui n'était
     pas enregistré. */
  filesDevis.clear();
}

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

/** Transforme une ligne `professional_profiles` en objet utilisé par les écrans. */
/**
 * Les colonnes d'une fiche professionnelle utiles DANS UNE LISTE.
 *
 * `bio` et `portfolio` n'y sont pas, et c'est tout l'intérêt : ce sont les
 * deux colonnes lourdes, et elles ne servent que sur la page d'un artisan.
 * Elles arrivent avec chargerProfilPro().
 */
const COLONNES_PRO_LISTE = [
  'id', 'nom', 'entreprise', 'metier', 'metiers', 'ville', 'verifie',
  /* `siret` N'Y EST PLUS (section 45) : l'ancien champ libre, jamais
     contrôlé, était lisible par TOUT LE MONDE — y compris sans compte.
     Plus aucun écran ne le lit ; l'identité légale vit à part, privée,
     dans `entreprise_registre`. */
  'experience_annees', 'followers_count',
  'assurance_valide', 'assurance_expire', 'kbis_valide', 'kbis_maj',
  'avatar_url', 'banner_url', 'kbis_url', 'assurance_url',
  'verification_statut', 'verification_note', 'verifie_le',
  /* `badge_suspendu_le` N'Y EST PAS (lot S-a, relecture « écran ») : elle ne
     sert qu'à SA propre fiche, et ici elle partirait vers tous les
     téléphones — la date à laquelle un artisan a remplacé un justificatif.
     Elle se lit à part, avec `demandes_vues_le`, dans `loadAll()`. */
  'code_postal', 'latitude', 'longitude',
  'avis_count', 'note_delais', 'note_qualite', 'note_tarif',
  /* La fiche de contact : téléphone, zone d'intervention, spécialités.
     Elles sont courtes et s'affichent dans les listes de la Place des
     pros, donc elles voyagent avec le reste. */
  'telephone', 'email_pro', 'zone_km', 'specialites', 'horaires',
  /* La certification RGE. `rge` est la seule vérifiée ; les trois autres
     sont ce que l'artisan a déclaré, et n'affichent pas de badge. */
  'rge', 'rge_declare', 'rge_numero', 'rge_expire', 'rge_url',
  /* LE NOM DE L'AGENT voyage avec la fiche, et il est PUBLIC — une règle
     RLS filtre des lignes, jamais des colonnes (section 18). C'est écrit
     et assumé en section 40 : aucun écran d'Opus n'affiche le nom de
     l'agent de quelqu'un d'autre. Il est ici parce que l'artisan doit lire
     LE SIEN sans une requête de plus au démarrage. */
  'agent_nom', 'agent_propositions',
].join(', ');

function rowToPro(row, reviews = [], partners = []) {
  return {
    id: row.id,
    nom: row.nom || '',
    entreprise: row.entreprise,
    metier: row.metier,
    /* Les métiers exercés. Le premier est le principal, celui qui s'affiche
       partout ; un profil créé avant la nouveauté n'en a qu'un. */
    metiers: (row.metiers && row.metiers.length) ? row.metiers : [row.metier].filter(Boolean),
    ville: row.ville,
    verifie: !!row.verifie,
    exp: row.experience_annees || 0,
    followers: row.followers_count || 0,
    bio: row.bio || '',
    partners,
    assurance: { valide: !!row.assurance_valide, expire: row.assurance_expire },
    kbis: { valide: !!row.kbis_valide, maj: row.kbis_maj },
    telephone: row.telephone || '',
    /* L'adresse de CONTACT, déclarée pour être publique — jamais celle du
       compte, qui n'est lisible par personne. */
    emailPro: row.email_pro || '',
    /* `null` et 0 ne veulent pas dire la même chose : null = « il ne l'a
       pas renseigné », et l'écran n'affiche alors rien du tout. */
    zoneKm: row.zone_km == null ? null : Number(row.zone_km),
    specialites: row.specialites || [],
    /* `null` veut dire « non renseigné », et ce n'est PAS « fermé » :
       l'écran n'affiche alors rien du tout. */
    horaires: row.horaires || null,
    /* La certification vérifiée par l'équipe — c'est elle qui fait le
       badge — et, à côté, ce que l'artisan a déclaré lui-même. */
    rge: !!row.rge,
    rgeDeclare: !!row.rge_declare,
    rgeNumero: row.rge_numero || '',
    rgeExpire: row.rge_expire || '',
    rgePath: row.rge_url || null,
    portfolio: row.portfolio || [],
    avatarUrl: row.avatar_url || null,
    bannerUrl: row.banner_url || null,
    kbisPath: row.kbis_url || null,
    assurancePath: row.assurance_url || null,
    verificationStatut: row.verification_statut || 'non_soumis',
    verificationNote: row.verification_note || null,
    /* La note tenue par la base : elle permet d'afficher une moyenne dans
       les listes SANS télécharger les avis. Voir avgReviews(). */
    /* Le petit nom que l'artisan a donné à son agent, et le nombre de fois
       où on lui a proposé de le faire. `doitProposerLeNom()` (src/lib/agent.js)
       est la seule à décider ce qu'on en fait. */
    agentNom: row.agent_nom || null,
    agentPropositions: row.agent_propositions || 0,
    avisCount: row.avis_count || 0,
    noteDelais: row.note_delais || 0,
    noteQualite: row.note_qualite || 0,
    noteTarif: row.note_tarif || 0,
    verifieLe: row.verifie_le || null,
    codePostal: row.code_postal || null,
    latitude: row.latitude || null,
    longitude: row.longitude || null,
    reviews,
  };
}

function rowToReview(row) {
  return {
    id: row.id,
    auteur: row.auteur || 'Client',
    verifie: !!row.client_verifie,
    date: formatDate(row.created_at),
    delais: row.delais,
    qualite: row.qualite,
    tarif: row.tarif,
    commentaire: row.commentaire,
  };
}

function formatDate(iso) {
  if (!iso) return '';
  const MOIS = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  const d = new Date(iso);
  return `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/* `relativeTime` vit dans `formats.js`, qui n'importe rien : la
   démonstration écrit ses anciennetés à la main (« Il y a 21 j »), et
   `verifier-demo` les compare à ce que CETTE fonction écrirait — elle ne
   pouvait pas tourner ici, où l'on charge Supabase (relecture du 26/10). */
export { relativeTime };

/**
 * LES CONSEILS D'UN ARTISAN — version démonstration.
 *
 * `function` et non `const` : ce fichier a déjà livré un écran blanc le
 * 04/10/2026 pour une `const` lue mille lignes au-dessus de sa déclaration
 * (« Cannot access 'noop' before initialization »), que ni le linter ni
 * `expo export` n'avaient signalée. Une fonction déclarée, elle, est
 * hissée : elle se lit d'où qu'on l'appelle.
 *
 * Ils se DÉDUISENT des publications de démonstration, ils ne sont pas
 * recopiés à côté. Une liste écrite à la main se désaligne au premier
 * conseil ajouté, et personne ne s'en aperçoit — le défaut du 01/10 vu
 * dans sa version la plus bête.
 */
/**
 * LES CHANTIERS D'UN ARTISAN — version démonstration.
 *
 * `function` et non `const`, comme `conseilsDemoDe` : une fonction
 * déclarée est hissée, donc elle se lit d'où qu'on l'appelle. Ce fichier a
 * déjà livré un écran blanc pour une `const` lue trop tôt.
 */
function chantiersDemoDe(proId) {
  return initialChantiers
    /* Comparaison par chaîne : l'identifiant du pro connecté vient de
       `Object.keys(pros)`, donc c'est une chaîne, et les chantiers
       d'exemple portent un nombre. Voir `mesChantiers` dans OpusApp. */
    .filter((c) => String(c.proId) === String(proId))
    /* Le même ordre que `chantiers_du_pro()` en base : les chantiers EN
       COURS passent devant. Deux tris différents pour la même liste
       feraient que la démonstration ne montre pas l'application. */
    .sort((a, b) => (a.statut === 'en_cours' ? 0 : 1) - (b.statut === 'en_cours' ? 0 : 1))
    .map((c) => ({ ...c }));
}

function conseilsDemoDe(proId) {
  return initialPosts
    .filter((p) => p.type !== 'ad' && p.conseil && p.proId === proId)
    .map((p) => ({
      id: p.id, format: p.format || 'photo', texte: p.texte,
      media: p.media || null, time: p.time,
    }));
}

/**
 * Charge tout ce dont l'app a besoin au démarrage.
 * Retourne toujours la même forme, quel que soit le mode.
 */
export async function loadAll() {
  if (!hasSupabase) {
    // En démonstration, l'état de vérification découle du drapeau `verifie`
    // des données d'exemple : un pro vérifié n'a pas de rappel à voir.
    /* La fiche d'un particulier de démonstration passé pro (section 45)
       rejoint les autres : sans elle, `start('pro')` le ferait atterrir
       sur la fiche d'un AUTRE artisan. */
    const pros = JSON.parse(JSON.stringify({ ...demoPros, ...prosAjoutesDemo }));
    Object.values(pros).forEach((p) => {
      p.verificationStatut = p.verifie ? 'verifie' : 'non_soumis';
      /* EN DÉMONSTRATION, LA FICHE EST DÉJÀ COMPLÈTE — et personne ne le
         disait. `chargerProfilPro()` rend `null` ici (tout est en mémoire),
         donc `portfolioCharge` restait indéfini et le squelette des
         réalisations tournait POUR TOUJOURS sur chaque fiche. Trouvé en
         posant le bloc des conseils, qui dépend du même drapeau. */
      p.portfolioCharge = true;
      p.conseils = conseilsDemoDe(p.id);
    });
    return {
      pros,
      posts: initialPosts.slice(0, TAILLE_PAGE_FIL).map((p, i) => ({
        ...p,
        comments: p.comments ? [...p.comments] : [],
        nbCommentaires: p.comments ? p.comments.length : 0,
        curseur: String(i + 1),
      })),
      finDuFil: finDemo(0, TAILLE_PAGE_FIL, initialPosts.length),
      /* Le mode démonstration doit se comporter EXACTEMENT comme la base :
         un dernier message, un nombre de non-lus, et les messages déjà là
         (ici on les garde, il n'y en a que quelques-uns). Sans cela, la
         liste des conversations s'afficherait vide au navigateur et on
         croirait à un défaut. */
      conversations: initialConversations.map((c) => {
        const messages = [...c.messages];
        const dernierMessage = messages[messages.length - 1] || null;
        return {
          ...c,
          messages,
          dernier: dernierMessage
            ? { texte: dernierMessage.texte, heure: dernierMessage.heure, de: null }
            : null,
          nonLus: messages.filter((m) => m.from !== 'moi' && !m.lu).length,
        };
      }),
      demandes: initialDemandes.map((d) => ({ ...d })),
      /* EN DÉMONSTRATION, « vu » ne peut venir d'aucune base. On fait comme
         si la dernière visite datait de 24 h : deux demandes sont alors
         nouvelles, une ne l'est plus. Sans ça, le mécanisme ne se verrait
         jamais pour qui lance Opus sans fichier `.env` — et il ne se
         vérifierait pas non plus ici. */
      demandesVuesLe: new Date(Date.now() - 24 * 3600e3).toISOString(),
      /* LE RÉGLAGE D'URGENCE DE LA FICHE 1, tel qu'il est sur la vraie base
         le 19/10/2026 : une ligne « Électricité » active sur un compte dont
         aucun métier n'est d'urgence — une ligne ORPHELINE. Sans elle, le
         réglage de « Modifier mon profil » ne montrerait aucun de ses états
         sans fichier `.env`. Une copie : l'écran la remplace après un
         enregistrement, et le fichier de démonstration reste intact. */
      mesSos: { lignes: MES_SOS_DEMO.lignes.map((l) => ({ ...l })) },
      notifications: initialNotifications.map((n) => ({ ...n })),
      followingIds: ABONNEMENTS_DEMO,
      savedIds: [],
      monCompte: { nom: 'Vous', ville: '', telephone: '', avatarUrl: null },
      // En démo, une demande en attente pour montrer le mécanisme.
      demandesPartenariat: [3],
      partenariatsEnvoyes: [5],
      partenariatsClos: [],
    };
  }

  const uid = currentUserId;

  /* Ce qui part en une seule fois au démarrage. Deux absents remarquables,
     et c'est le cœur de la pagination :
       - les PUBLICATIONS ne viennent plus toutes : seulement la première
         page (voir chargerPageFil) ;
       - les COMMENTAIRES ne viennent plus du tout : on les charge quand
         quelqu'un les ouvre. La plupart n'étaient jamais lus. */
  const [profilesRes, partnersRes, postsRes,
         likesRes, savesRes, followsRes, convRes, notifRes,
         demandesRes, masosRes, moiRes, vuesRes] = await Promise.all([
    /* SANS `bio` NI `portfolio` : ce sont les deux colonnes lourdes, et
       elles ne servent QUE sur la page d'un artisan — jamais dans une
       liste. Un portfolio, c'est un tableau d'adresses de photos ; multiplié
       par cinq cents artisans, c'est l'essentiel du poids du démarrage.
       Elles arrivent avec chargerProfilPro(), à l'ouverture du profil. */
    supabase.from('professional_profiles').select(COLONNES_PRO_LISTE),
    /* Les avis ne sont plus chargés du tout au démarrage : la note affichée
       dans les listes vient de `avis_count` / `note_*`, tenus par un
       trigger. Les avis eux-mêmes arrivent à l'ouverture d'un profil. */
    supabase.from('professional_partners').select('*'),
    /* LE FIL PASSE PAR `fil_filtre()`, MÊME SANS FILTRE — 05/10/2026.
       Une seule porte. Deux requêtes différentes pour la même liste —
       l'une ici, l'autre dans `chargerPageFil` — finiraient par ne plus
       rendre la même chose, et la première page du fil ne ressemblerait
       plus aux suivantes. Sans argument, la fonction rend exactement ce
       que rendait ce `select`.

       UNE DE PLUS que la page (15/10/2026) : c'est la seule façon de savoir
       s'il en reste sans aller chercher une page vide — voir `page-fil.js`. */
    supabase.rpc('fil_filtre', { p_limite: TAILLE_PAGE_FIL + 1 }),
    supabase.from('post_likes').select('post_id').eq('user_id', uid),
    supabase.from('saved_posts').select('post_id').eq('user_id', uid),
    supabase.from('follows').select('following_id').eq('follower_id', uid),
    /* La liste des conversations en UNE requête : interlocuteur, dernier
       message et nombre de non-lus. Avant, on téléchargeait TOUS les
       messages de TOUTES les conversations juste pour afficher un aperçu. */
    supabase.rpc('mes_conversations'),
    supabase.from('notifications')
      /* `fiche:professional_profiles(avatar_url)` : la photo d'un ARTISAN
         vit sur sa fiche, pas sur son compte — voir `photoActeur`. Sans
         cette jointure, les deux seuls artisans de la base qui ont une
         photo apparaissaient en rond vide. */
      .select('*, acteur:acteur_id(nom, avatar_url, fiche:professional_profiles(avatar_url))')
      .eq('user_id', uid).order('created_at', { ascending: false }),
    /* DEUX CHOSES MANQUAIENT ICI, relevées le 04/10/2026.
       `statut` : la colonne vaut « ouverte » par défaut depuis le premier
       jour, et RIEN ne la lisait — une demande pourvue restait donc en tête
       de liste pour toujours. On ne charge plus que ce qui est ouvert, sauf
       les siennes : leur auteur doit continuer de les voir, pourvues ou pas.
       La LIMITE : le fil en a une, la Place des pros aussi (200). Les
       demandes n'en avaient aucune — le jour où il y en a cinq mille,
       l'application les télécharge toutes au démarrage. */
    supabase.from('demandes')
      .select('*, users:client_id(nom, avatar_url)')
      .or(`statut.eq.ouverte,client_id.eq.${uid}`)
      .order('created_at', { ascending: false })
      .limit(TAILLE_PAGE_DEMANDES),
    /* PLUS DE LECTURE DE `demande_reponses` ICI (lot S-b, 26/10/2026). On
       téléchargeait TOUTE la table — chaque réponse de chaque artisan à
       chaque demande — pour en compter les lignes. Le nombre vit désormais
       sur la demande (`demandes.nb_reponses`, tenu par un déclencheur,
       section 30.3), et il arrive avec le `select('*')` ci-dessus. */
    /* MA DISPONIBILITÉ AUX URGENCES — TOUTES mes lignes, une par métier
       d'urgence (la clé de la table est `(professional_id, metier_key)`).
       `maybeSingle()` plantait dès qu'il y en avait deux, et l'écran ne
       voyait jamais une ligne restée active sur un AUTRE métier. Et
       seulement ces quatre colonnes : `deplacement`, `horaire` et
       `majoration` sont MORTES depuis la section 47 — les tarifs vivent
       dans `tarifs_pro`. */
    supabase.from('sos_availability')
      .select('metier_key, actif, rayon_km, delai_minutes').eq('professional_id', uid),
    /* Ma propre fiche, avec mon téléphone — que `select *` ne sait plus
       lire depuis que ces colonnes sont fermées à tout le monde (section
       18 de schema.sql). La fonction, elle, ne renvoie QUE ma ligne. */
    supabase.rpc('mon_compte').maybeSingle(),
    /* MA date de dernière visite de l'onglet Demandes, et la mienne seule :
       elle ne sert qu'à moi, et l'ajouter à `COLONNES_PRO_LISTE` la ferait
       voyager pour les cinq cents autres artisans. La requête part en
       parallèle des autres : elle ne coûte pas une attente de plus. */
    supabase.from('professional_profiles')
      .select('demandes_vues_le, badge_suspendu_le').eq('id', uid).maybeSingle(),
  ]);

  const err = [profilesRes, partnersRes, postsRes].find((r) => r.error);
  if (err) throw err.error;


  /* Une ligne décrit une relation entre deux artisans. Acceptée, elle vaut
     dans les deux sens : chacun apparaît chez l'autre. En attente, elle ne
     regarde que les deux intéressés — d'un côté une demande à traiter, de
     l'autre une demande envoyée. */
  const partnersByPro = {};
  const demandesRecues = [];
  const demandesEnvoyees = [];
  /* LES PAIRES CLOSES (lot S-b) : un REFUS reste en base, dans un sens ou
     dans l'autre, et la paire est unique (`idx_partenaires_paire`). Les
     proposer comme candidates faisait toucher « Demander » pour recevoir
     un refus de la base. Elles ne sont plus proposées. */
  const partenariatsClos = [];
  (partnersRes.data || []).forEach((p) => {
    if (p.statut === 'accepte') {
      if (!partnersByPro[p.professional_id]) partnersByPro[p.professional_id] = [];
      if (!partnersByPro[p.partner_id]) partnersByPro[p.partner_id] = [];
      partnersByPro[p.professional_id].push(p.partner_id);
      partnersByPro[p.partner_id].push(p.professional_id);
    } else if (p.statut === 'en_attente') {
      if (p.partner_id === uid) demandesRecues.push(p.professional_id);
      else if (p.professional_id === uid) demandesEnvoyees.push(p.partner_id);
    } else if (p.statut === 'refuse') {
      if (p.partner_id === uid) partenariatsClos.push(p.professional_id);
      else if (p.professional_id === uid) partenariatsClos.push(p.partner_id);
    }
  });

  const pros = {};
  (profilesRes.data || []).forEach((row) => {
    /* Liste vide, pas `null` : « aucun avis chargé » se comporte comme
       « aucun avis » pour l'affichage, et avgReviews() se rabat alors sur
       la moyenne tenue par la base. */
    pros[row.id] = rowToPro(row, [], partnersByPro[row.id] || []);
  });
  /* LE BADGE SUSPENDU DE MA fiche, et de la mienne seule (lot S-a) : il fige
     mes métiers à l'écran et explique pourquoi le badge a disparu. Sans
     lui, après un redémarrage, l'écran rouvrait des métiers que la base
     refuse (`tient_les_metiers`). */
  if (pros[uid] && vuesRes && vuesRes.data) {
    pros[uid].badgeSuspenduLe = vuesRes.data.badge_suspendu_le || null;
  }

  const likedSet = new Set((likesRes.data || []).map((l) => l.post_id));

  /* Première page du fil. `null` pour les commentaires : « pas encore
     chargés », à distinguer de « chargés, aucun ».

     `fin` se déduit de la ligne DE TROP, pas d'une page incomplète : avec
     exactement vingt publications en base, « moins de vingt » répondait
     non, et le bas du fil partait chercher une page vide. */
  const premiere = decouperPage(postsRes.data, TAILLE_PAGE_FIL);
  const posts = premiere.lignes.map((p) => rowToPost(p, likedSet, null));
  const finDuFil = premiere.fin;

  /* Les conversations arrivent déjà résumées par la base. `messages` reste
     vide : on charge le fil d'une conversation quand on l'ouvre, pas avant.
     `null` signifie « pas encore chargés », `[]` « chargés, aucun ». */
  const conversations = (convRes.data || []).map((c) => ({
    id: c.id,
    proId: c.autre_id,
    autre: {
      id: c.autre_id, nom: c.autre_nom, avatarUrl: c.autre_avatar, type: c.autre_type,
    },
    dernier: c.dernier_texte
      ? { texte: c.dernier_texte, heure: relativeTime(c.dernier_le), de: c.dernier_de }
      : null,
    nonLus: c.non_lus || 0,
    messages: null,
  }));

  const demandes = (demandesRes.data || []).map((d) => ({
    id: d.id,
    auteurId: d.client_id,
    auteur: d.users ? d.users.nom : 'Un particulier',
    avatarUrl: d.users ? d.users.avatar_url : null,
    metier: d.metier,
    ville: d.ville || 'Non précisée',
    codePostal: d.code_postal,
    latitude: d.latitude,
    longitude: d.longitude,
    texte: d.texte,
    media: d.media,
    medias: (d.medias && d.medias.length) ? d.medias : (d.media ? [d.media] : []),
    time: relativeTime(d.created_at),
    /* LA DATE BRUTE EN PLUS DU « il y a 2 h ». C'est elle qui dit si une
       demande est NOUVELLE — c'est-à-dire déposée après la dernière visite
       de l'onglet. « il y a 2 h » est un texte, il ne se compare pas. */
    deposeeLe: d.created_at,
    statut: d.statut || 'ouverte',
    /* `null` quand la colonne manque — une base où la section 30.3 n'est
       pas encore passée — et l'écran affiche alors « — ». Pas « 0 » : ce
       serait annoncer qu'aucun artisan n'a répondu, ce qu'on ne sait pas. */
    reponses: Number.isInteger(d.nb_reponses) ? d.nb_reponses : null,
    budget: d.budget || null,
    urgence: d.urgence || 'quand_possible',
  }));

  /* UN ÉCHEC DE LECTURE N'EST PAS « RIEN D'ENREGISTRÉ ». `null` voulait
     dire les deux : un artisan dont la lecture avait échoué voyait son
     interrupteur éteint, et « Enregistrer » l'aurait retiré des urgences.
     `{ echec: true }` le dit, et le réglage ne touche alors à rien. */
  const mesSos = masosRes.error
    ? { echec: true }
    : {
      lignes: (masosRes.data || []).map((l) => ({
        metierKey: l.metier_key,
        actif: l.actif === true,
        rayonKm: l.rayon_km,
        delaiMinutes: l.delai_minutes,
      })),
    };

  const moi = moiRes.data || {};

  return {
    pros,
    posts,
    conversations,
    demandes,
    mesSos,
    monCompte: {
      nom: moi.nom || '',
      ville: moi.ville || '',
      telephone: moi.telephone || '',
      /* L'ADRESSE DU COMPTE, et elle ne sort pas d'ici. Elle vient de
         `mon_compte()`, qui ne rend que MA ligne — c'est la seule porte
         restée ouverte depuis le 29/09, où `users.email` a été fermée à
         tout le monde. Elle sert à UNE chose : proposer à l'artisan de la
         recopier dans son e-mail PUBLIC, en lui montrant laquelle. Elle ne
         s'affiche nulle part ailleurs, et surtout pas sur une fiche. */
      email: moi.email || '',
      avatarUrl: moi.avatar_url || null,
      codePostal: moi.code_postal || null,
      latitude: moi.latitude || null,
      longitude: moi.longitude || null,
    },
    /* LA DATE DE MA DERNIÈRE VISITE de l'onglet Demandes. `null` pour qui
       n'y est jamais allé — et dans ce cas TOUT est nouveau, ce qui est la
       bonne réponse le premier jour. */
    demandesVuesLe: vuesRes && vuesRes.data ? vuesRes.data.demandes_vues_le : null,
    demandesPartenariat: demandesRecues,
    partenariatsEnvoyes: demandesEnvoyees,
    partenariatsClos,
    /* `acteurNom` EST LA LIGNE QUI MANQUAIT, et elle valait douze ronds
       beiges vides. La requête va chercher `acteur:acteur_id(nom,
       avatar_url)` depuis le début ; seule l'adresse de la photo était
       reportée. Or `Avatar` affiche les INITIALES quand il n'a pas
       d'image — mesuré sur la vraie base le 06/10/2026 : 13 acteurs sur
       13 ont un nom, 1 seul a une photo.

       Et les quatre identifiants de cible (section 37) : sans eux,
       toucher onze notifications sur quinze ne faisait rien. */
    notifications: (notifRes.data || []).map(notificationDepuisLigne),
    followingIds: (followsRes.data || []).map((f) => f.following_id),
    savedIds: (savesRes.data || []).map((s) => s.post_id),
    finDuFil,
  };
}

/**
 * UNE LIGNE DE `notifications`, telle que l'écran la lit — et c'est la
 * SEULE traduction, pour le chargement comme pour le temps réel.
 *
 * Le 15/10/2026, la relecture adverse a mesuré ce que coûtaient deux
 * traductions écrites à deux endroits : celle du temps réel, dans
 * `OpusApp`, ne recopiait ni `demande_pro_id` ni les autres cibles. Une
 * notification « votre compte professionnel est ouvert : touchez ici »
 * arrivée en direct répondait « cette notification n'a plus rien à
 * montrer » — et le particulier ne passait pas en pro. Après un
 * rechargement, la même ligne marchait. Deux formules pour une seule
 * vérité finissent toujours par se contredire : la leçon des voyants du
 * 04/10.
 *
 * `acteurNom` EST LA LIGNE QUI MANQUAIT le 06/10, et elle valait douze
 * ronds beiges vides : `Avatar` affiche les INITIALES quand il n'a pas
 * d'image. Une ligne venue du temps réel n'a pas la jointure `acteur` :
 * elle s'affiche sans nom ni photo jusqu'au prochain chargement — c'est
 * moins bien, ce n'est pas faux.
 *
 * Et les identifiants de cible (sections 37 et 45) : sans eux, toucher
 * une notification ne mène nulle part.
 */
export function notificationDepuisLigne(n) {
  return {
    id: n.id, texte: n.texte, lue: !!n.lue, type: n.type || 'info',
    postId: n.post_id || null, commentId: n.comment_id || null,
    annonceId: n.annonce_id || null,
    devisId: n.devis_id || null,
    rappelId: n.rappel_id || null,
    sosId: n.sos_id || null,
    demandeProId: n.demande_pro_id || null,
    acteurId: n.acteur_id || null,
    acteurNom: n.acteur ? n.acteur.nom : null,
    avatarUrl: photoActeur(n.acteur),
    time: relativeTime(n.created_at),
  };
}

/**
 * Combien de conseils une fiche montre.
 *
 * Douze, soit deux ou trois écrans : au-delà on ne lit plus, on cherche —
 * et chercher dans les conseils de quelqu'un est un autre écran, à faire
 * le jour où il y aura de quoi chercher.
 *
 * Déclarée ICI, juste au-dessus de son unique lecteur, et pas à mille
 * lignes de là avec les autres bornes : c'est le genre de distance qui a
 * déjà coûté un écran blanc dans ce fichier le 04/10/2026.
 */
const TAILLE_CONSEILS = 12;

/**
 * La fiche COMPLÈTE d'un artisan, à l'ouverture de son profil : sa
 * présentation, ses réalisations, et ses avis.
 *
 * Ces trois choses ne servent nulle part ailleurs. Les charger pour tout le
 * monde à chaque ouverture de l'application, c'était télécharger cinq cents
 * portfolios pour en regarder un.
 */
async function profilProDeSupabase(id) {
  const [ficheRes, avisRes, conseilsRes] = await Promise.all([
    supabase.from('professional_profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('reviews').select('*, users:author_id(nom)')
      .eq('professional_id', id).order('created_at', { ascending: false }),
    /* SES CONSEILS — une requête ordinaire, pas une fonction de plus.
       La politique « lecture posts » applique déjà le blocage, et
       `idx_posts_conseils` (section 34) sert exactement cette requête.

       BORNÉE, comme tout le reste depuis le 04/10 : un artisan qui publie
       un conseil par semaine pendant trois ans en a cent cinquante, et une
       fiche n'est pas une archive. Les plus récents d'abord. */
    supabase.from('posts')
      .select('id, type, texte, media, created_at')
      .eq('author_id', id).eq('conseil', true)
      .order('created_at', { ascending: false })
      .limit(TAILLE_CONSEILS),
  ]);
  if (ficheRes.error) throw ficheRes.error;
  if (!ficheRes.data) return null;

  const avis = (avisRes.data || []).map((r) => rowToReview({
    ...r,
    /* Un avis dont l'auteur a supprimé son compte est conservé mais
       anonymisé : on le DIT, au lieu d'afficher « Client » comme s'il était
       toujours là. */
    auteur: r.auteur_supprime ? 'Compte supprimé' : (r.users ? r.users.nom : 'Client'),
  }));
  /* Une erreur sur les conseils ne coûte pas la fiche : on affiche ce
     qu'on a. Un bloc absent se remarque beaucoup moins qu'une page
     vide. */
  const conseils = (conseilsRes.error ? [] : (conseilsRes.data || [])).map((c) => ({
    id: c.id, format: c.type || 'photo', texte: c.texte,
    media: c.media || null, time: relativeTime(c.created_at),
  }));
  return { fiche: ficheRes.data, avis, conseils };
}

async function profilProDeDemo() { return null; }

/**
 * Renvoie ce qu'il faut fusionner dans la fiche déjà connue : la
 * présentation, les réalisations et les avis. `null` en démonstration, où
 * tout est déjà en mémoire.
 */
export const chargerProfilPro = hasSupabase
  ? async (id) => {
    const complet = await profilProDeSupabase(id);
    if (!complet) return null;
    return {
      bio: complet.fiche.bio || '',
      portfolio: complet.fiche.portfolio || [],
      reviews: complet.avis,
      conseils: complet.conseils,
    };
  }
  : profilProDeDemo;

/* ------------------------------------------------------------------ */
/*  Le fil, par pages                                                   */
/* ------------------------------------------------------------------ */

/**
 * Combien de publications par page.
 *
 * Vingt, c'est environ trois écrans de fil : assez pour qu'on ait le temps
 * de lire avant que la page suivante n'arrive, assez peu pour que le premier
 * affichage soit immédiat même en 4G sur un chantier.
 */
export const TAILLE_PAGE_FIL = 20;

/* LES DEMANDES N'AVAIENT AUCUNE LIMITE — relevé le 04/10/2026. Le fil en a
   une, la Place des pros aussi (200), les demandes téléchargeaient tout.
   Deux cents, comme les annonces : au-delà, on ne lit plus, on cherche. */
export const TAILLE_PAGE_DEMANDES = 200;

/**
 * Une publication de démonstration, avec son repère de pagination.
 *
 * Sortie de la fonction asynchrone À DESSEIN : voir le commentaire de
 * `chargerPageFil` — un objet construit par étalement (`...p`) à l'intérieur
 * d'une fonction asynchrone fait échouer la construction sous Metro.
 */
/* LES « J'AIME » DE LA DÉMONSTRATION VIVENT EN MÉMOIRE — 26/10/2026.
   `setLike` valait `noop` sans fichier `.env`, et poser un filtre recharge
   le fil depuis les données de démonstration : le j'aime qu'on venait de
   donner disparaissait (vu sur la publicité : 215 dans le fil, 214 dans le
   fil filtré, cœur vide). Avec la vraie base, le compteur vient de
   `likes_count`, tenu par un déclencheur, et rien ne se perd : la
   démonstration doit se comporter pareil. Clé : l'identifiant, en chaîne. */
const jaimesDemo = new Map();

function postDemo(p, rang) {
  const commentaires = p.comments ? p.comments.slice() : [];
  const cle = String(p.id);
  const jaime = jaimesDemo.has(cle) ? jaimesDemo.get(cle) : !!p.liked;
  return Object.assign({}, p, {
    comments: commentaires,
    nbCommentaires: commentaires.length,
    curseur: String(rang),
    liked: jaime,
    likes: (p.likes || 0) + (jaime ? 1 : 0) - (p.liked ? 1 : 0),
  });
}

/**
 * Une ligne de la table `posts` devient une publication de l'application.
 *
 * `commentaires` vaut `null` quand ils n'ont PAS été chargés — ce qui est
 * désormais le cas normal, on ne les charge qu'à l'ouverture. Le nombre
 * affiché vient alors de `comments_count`, tenu par un trigger côté base.
 * Distinguer `null` (pas chargés) de `[]` (chargés, aucun) est ce qui permet
 * à l'écran de savoir s'il faut aller les chercher.
 */
function rowToPost(p, likedSet, commentaires = null) {
  if (p.is_ad) {
    return {
      id: p.id, type: 'ad', annonceur: p.annonceur, accroche: p.accroche,
      cta: p.cta, media: p.media,
      /* UNE PUBLICITÉ A AUSSI UN CURSEUR (17/10/2026). Sans lui, une page
         qui finissait sur une publicité faisait croire au bout du fil :
         `chargerPlusDeFil` ne savait pas d'où repartir, et posait
         « fin ». Relevé sur la vraie base : les deux publicités aux rangs
         16 et 17 — trois publications de plus, et elles fermaient la
         première page. */
      curseur: p.created_at,
    };
  }
  return {
    id: p.id, type: 'post', proId: p.author_id, time: relativeTime(p.created_at),
    // « type » dit si c'est une publication ou une publicité ; « format »
    // dit ce qu'on regarde. Les deux étaient confondus, si bien qu'une
    // photo se retrouvait dans le fil des vidéos.
    format: p.type || 'photo',
    /* L'INTENTION, à côté du SUPPORT. `type` dit ce qu'on regarde (photo,
       vidéo, montage) ; `conseil` dit pourquoi c'est là. Les deux se
       combinent — une vidéo-conseil est les deux à la fois. */
    conseil: !!p.conseil,
    /* LE CHANTIER AUQUEL ELLE APPARTIENT (section 36), ou `null`. Le TITRE
       ne voyage pas ici : il vit dans la table `chantiers`, et l'écran le
       lit dans le dictionnaire que `chantiersDeCesPosts()` remplit. Le
       recopier sur chaque publication ferait deux sources pour une seule
       vérité — et un chantier renommé laisserait l'ancien nom dans le
       fil, pour toujours. */
    chantierId: p.chantier_id || null,
    texte: p.texte, media: p.media,
    medias: (p.medias && p.medias.length) ? p.medias : (p.media ? [p.media] : []),
    musique: p.musique || null,
    // Le montage assemblé en un seul fichier, quand Cloudinary l'a fabriqué.
    montageUrl: p.montage_url || null,
    likes: p.likes_count || 0,
    /* COMBIEN DE PERSONNES ONT VU (section 35). Jamais QUI : la table du
       détail n'est lisible que par celui qui a regardé. */
    vues: p.vues_count || 0,
    liked: likedSet.has(p.id),
    comments: commentaires,
    nbCommentaires: p.comments_count || 0,
    // Le repère de pagination : on redemande « ce qui est plus ancien que ».
    modifie: !!p.modifie_le,
    curseur: p.created_at,
  };
}

/**
 * La page suivante du fil.
 *
 * Pagination PAR CURSEUR et non par numéro de page : entre deux pages,
 * quelqu'un publie, et tout se décale. Avec un numéro de page, on reverrait
 * la même publication deux fois ou on en sauterait une. Avec « ce qui est
 * plus ancien que telle date », rien ne bouge sous les pieds.
 *
 * Renvoie `{ posts, fin }` — `fin` dit qu'il n'y a plus rien à charger, pour
 * que l'écran cesse de redemander chaque fois qu'on touche le bas.
 */
/**
 * DEUX FONCTIONS NOMMÉES, ET SURTOUT PAS UN TERNAIRE.
 *
 * Le reste de ce fichier écrit `export const x = !hasSupabase ? … : …`.
 * Ici, c'est impossible : une fonction ASYNCHRONE qui a un PARAMÈTRE PAR
 * DÉFAUT et un CORPS EN BLOC, placée dans la première branche d'un
 * ternaire, fait échouer la construction avec
 *
 *     Property id of VariableDeclarator expected node to be of a type
 *     ["LVal","VoidPattern"] but instead got "AssignmentExpression"
 *
 * Le même code passe avec Babel seul, y compris avec le préréglage d'Expo :
 * l'erreur ne sort que de Metro, et elle ne dit ni la ligne ni la cause.
 * Trouvé par dichotomie — `async (o = {}) => (expression)` construit,
 * `async (o = {}) => { bloc }` non.
 *
 * Deux fonctions nommées, et le choix fait à la fin. C'est plus lisible, et
 * ça construit.
 */

/**
 * Le fil en mode démonstration : on découpe la liste en mémoire.
 *
 * ET LE FILTRE S'Y APPLIQUE AUSSI — règle du projet depuis le 01/10 : le
 * mode démonstration doit faire VIVRE le mécanisme. Une loupe qui ne
 * filtrerait rien sans fichier `.env` ne se vérifierait pas ici, et c'est
 * précisément ce qu'on vient corriger ailleurs.
 *
 * `correspond()` tient la même règle que `fil_filtre()` en SQL. Écrire deux
 * fois la même chose est un risque assumé et borné : il n'y a pas de base
 * en démonstration, et `verifier-filtre` éprouve les deux sur les mêmes cas.
 */
async function pageFilDemo(options = {}) {
  const depart = options.curseur ? Number(options.curseur) : 0;
  const f = options.filtre || {};
  const abonnements = f.abonnements ? new Set(ABONNEMENTS_DEMO) : null;

  const retenus = initialPosts.filter(
    (p) => correspond(p, demoPros[p.proId], f, { abonnements, videos: !!f.videos }));

  const page = retenus
    .slice(depart, depart + TAILLE_PAGE_FIL)
    .map((p, i) => postDemo(p, depart + i + 1));
  return { posts: page, fin: finDemo(depart, TAILLE_PAGE_FIL, retenus.length) };
}

/**
 * Le fil depuis la base, page par page.
 *
 * Pagination PAR CURSEUR et non par numéro de page : entre deux pages,
 * quelqu'un publie, et tout se décale. Avec un numéro de page on reverrait
 * la même publication deux fois ou on en sauterait une. Avec « ce qui est
 * plus ancien que telle date », rien ne bouge sous les pieds.
 */
async function pageFilSupabase(options = {}) {
  const curseur = options.curseur || null;
  const f = options.filtre || {};

  /* LE FILTRE EST APPLIQUÉ PAR LA BASE, JAMAIS SUR CE QUI REVIENT.
     C'est tout le lot du 05/10/2026, et le défaut était déjà là :
     `feedAbonnements` filtrait À L'ÉCRAN, sur les vingt publications déjà
     téléchargées. Avec trois abonnements et seize publications, personne
     ne le voit. Avec mille artisans, les vingt dernières publications de
     toute la France n'en contiennent AUCUN : l'onglet affiche une page
     vide, et la suivante aussi. */
  const reponse = await supabase.rpc('fil_filtre', {
    p_metier: f.metier || null,
    p_lat: f.latitude != null ? f.latitude : null,
    p_lon: f.longitude != null ? f.longitude : null,
    p_rayon_km: f.rayonKm || null,
    p_note_min: f.noteMin || null,
    p_verifies: !!f.verifies,
    p_abonnements: !!f.abonnements,
    p_videos: !!f.videos,
    p_avant: curseur || null,
    /* Une de plus que la page, comme au chargement : les deux portes du
       fil doivent répondre pareil à « y en a-t-il d'autres ? ». */
    p_limite: TAILLE_PAGE_FIL + 1,
  });
  if (reponse.error) throw reponse.error;

  const { lignes, fin } = decouperPage(reponse.data, TAILLE_PAGE_FIL);
  /* Les « j'aime » UNIQUEMENT pour les publications de cette page. C'est
     tout l'intérêt : on ne redemande plus la totalité de la table. */
  const ids = lignes.filter((p) => !p.is_ad).map((p) => p.id);
  let likedSet = new Set();
  if (ids.length) {
    const reponseLikes = await supabase.from('post_likes')
      .select('post_id').eq('user_id', currentUserId).in('post_id', ids);
    likedSet = new Set((reponseLikes.data || []).map((l) => l.post_id));
  }

  return {
    posts: lignes.map((p) => rowToPost(p, likedSet, null)),
    fin,
  };
}

/**
 * La page suivante du fil. Renvoie `{ posts, fin }` — `fin` dit qu'il n'y a
 * plus rien à charger, pour que l'écran cesse de redemander chaque fois
 * qu'on touche le bas.
 */
export const chargerPageFil = hasSupabase ? pageFilSupabase : pageFilDemo;


/**
 * Les commentaires d'UNE publication, chargés au moment où on les ouvre.
 *
 * Avant, ils étaient tous chargés d'avance, pour toutes les publications, à
 * chaque ouverture de l'application. La plupart n'étaient jamais lus.
 */
export const chargerCommentaires = !hasSupabase
  ? async () => []
  : async (postId) => {
    const { data, error } = await supabase.from('comments')
      /* Même défaut que la cloche, et il se voit tout autant : un
         commentaire d'artisan portait un rond vide. */
      .select('*, users:author_id(nom, avatar_url, type, fiche:professional_profiles(avatar_url))')
      .eq('post_id', postId)
      .order('created_at');
    if (error) throw error;
    return arbreCommentaires(data || []);
  };

/**
 * Les commentaires sont à plat en base, avec un `parent_id`. L'écran les
 * veut en arbre à deux niveaux.
 */
function arbreCommentaires(lignes) {
  const parIdentifiant = {};
  const racines = [];
  lignes.forEach((c) => {
    const noeud = {
      id: c.id,
      auteurId: c.author_id,
      auteur: c.users ? c.users.nom : 'Client',
      auteurType: c.users ? c.users.type : 'particulier',
      avatarUrl: photoActeur(c.users),
      texte: c.texte,
      time: relativeTime(c.created_at),
      /* Posé par la BASE, jamais par l'application : on ne peut donc pas
         récrire un commentaire en faisant croire qu'il n'a pas bougé.
         Quelqu'un à qui on a répondu doit pouvoir le constater. */
      modifie: !!c.modifie_le,
      reponses: [],
    };
    parIdentifiant[c.id] = noeud;
    const parent = c.parent_id ? parIdentifiant[c.parent_id] : null;
    if (parent) parent.reponses.push(noeud);
    else racines.push(noeud);
  });
  return racines;
}


/* ------------------------------------------------------------------ */
/*  Écriture                                                           */
/*  Toutes ces fonctions ne font rien en mode démo : l'état local de    */
/*  l'app a déjà été mis à jour par l'écran (mise à jour optimiste).    */
/* ------------------------------------------------------------------ */

const noop = async () => null;

/**
 * J'AI OUVERT L'ONGLET DEMANDES : on note l'heure.
 *
 * Avant, « vu » était un booléen en mémoire, remis à faux à chaque
 * ouverture de l'application : le point revenait au lancement suivant, pour
 * des demandes déjà lues dix fois. Une date en base survit au redémarrage,
 * au changement de téléphone, et à la réinstallation.
 *
 * `noop` côté démonstration, et l'échec n'est PAS remonté : ne pas réussir
 * à éteindre un point n'est pas une raison de montrer un message d'erreur à
 * quelqu'un qui vient simplement de changer d'onglet.
 */
export const marquerDemandesVues = !hasSupabase ? noop : async () => {
  await supabase.from('professional_profiles')
    .update({ demandes_vues_le: new Date().toISOString() })
    .eq('id', currentUserId);
};

/**
 * LE NOM DE L'AGENT — l'artisan le donne, et personne d'autre.
 *
 * La politique « ecriture mon profil » exige `auth.uid() = id` : un autre
 * professionnel qui essaie reçoit zéro ligne modifiée. Vérifié sur la
 * vraie base (essais 6 et 7 de `supabase/essais-section-40.sql`).
 *
 * L'erreur EST remontée, contrairement à `marquerDemandesVues` : éteindre
 * un point en silence est une chose, laisser croire qu'un nom est
 * enregistré alors qu'il ne l'est pas en est une autre — c'est le « X est
 * prévenu » du 01/10, en plus petit.
 */
async function nommerAgentDemo(nom) {
  const fiche = demoPros[currentUserId] || demoPros[Object.keys(demoPros)[0]];
  if (!fiche) throw new Error("Aucune fiche professionnelle à laquelle donner un agent.");
  fiche.agentNom = String(nom || '').trim() || null;
  return fiche.agentNom;
}

export const nommerAgent = !hasSupabase ? nommerAgentDemo : async (nom) => {
  const propre = String(nom || '').trim();
  const { data, error } = await supabase.from('professional_profiles')
    .update({ agent_nom: propre || null })
    .eq('id', currentUserId)
    .select('agent_nom').single();
  if (error) throw error;
  return data ? data.agent_nom : null;
};

/**
 * « PLUS TARD » — on compte le refus, et c'est ce compteur qui nous fera
 * nous taire.
 *
 * Le propriétaire a demandé que la fenêtre revienne « de temps en temps »
 * pour qu'on ne saute pas l'étape ; le §2 interdit d'insister. Le compteur
 * tient les deux, et il est en BASE : gardé sur le téléphone, il repartirait
 * à zéro au prochain démarrage et la fenêtre reviendrait à chaque
 * lancement. C'est exactement le défaut du point orange des Demandes,
 * corrigé le 04/10.
 *
 * On lit la valeur AVANT d'écrire — PostgREST ne sait pas incrémenter —, et
 * `greatest()` dans `tient_l_agent()` (section 40.1) garantit que le
 * compteur ne redescend jamais, quoi qu'envoie le client.
 *
 * L'échec n'est PAS remonté : ne pas réussir à noter un refus ne mérite pas
 * un message d'erreur à quelqu'un qui vient de toucher « Plus tard ». Le
 * pire qui arrive, c'est que la question revienne une fois de plus.
 */
async function noterRefusAgentDemo() {
  const fiche = demoPros[currentUserId] || demoPros[Object.keys(demoPros)[0]];
  if (!fiche) return 0;
  fiche.agentPropositions = (fiche.agentPropositions || 0) + 1;
  return fiche.agentPropositions;
}

export const noterRefusAgent = !hasSupabase ? noterRefusAgentDemo : async () => {
  const { data: avant } = await supabase.from('professional_profiles')
    .select('agent_propositions').eq('id', currentUserId).maybeSingle();
  const suivant = ((avant && avant.agent_propositions) || 0) + 1;
  const { data, error } = await supabase.from('professional_profiles')
    .update({ agent_propositions: suivant })
    .eq('id', currentUserId)
    .select('agent_propositions').maybeSingle();
  if (error) return suivant;
  return data ? data.agent_propositions : suivant;
};

/**
 * « J'AI TROUVÉ » — l'auteur referme sa demande.
 *
 * Seul lui le peut : la politique « mes demandes » exige
 * `auth.uid() = client_id`, et un autre compte qui essaie reçoit zéro
 * ligne modifiée. Vérifié sur la vraie base le 04/10/2026.
 */
export const changerStatutDemande = !hasSupabase ? noop : async (id, statut) => {
  const { error } = await supabase.from('demandes')
    .update({ statut })
    .eq('id', id)
    .eq('client_id', currentUserId);
  if (error) throw error;
};

async function setLikeDemo(postId, liked) {
  jaimesDemo.set(String(postId), !!liked);
}

export const setLike = !hasSupabase ? setLikeDemo : async (postId, liked) => {
  if (liked) {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId });
  } else {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
  }
};

export const setSaved = !hasSupabase ? noop : async (postId, saved) => {
  if (saved) {
    await supabase.from('saved_posts').insert({ post_id: postId, user_id: currentUserId });
  } else {
    await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', currentUserId);
  }
};

/* L'ERREUR SE LIT. `postgrest-js` ne lève rien par défaut
   (`shouldThrowOnError = false`) : sans ces lignes, un abonnement refusé
   par la base laissait « Suivi ✓ » à l'écran jusqu'au rechargement —
   relevé le 26/10/2026 sur sa PROPRE fiche, où la base refuse
   (`pas_sabonner_a_soi_meme`). Un abonnement déjà en base (23505) n'est
   pas un échec : c'est l'état demandé. */
export const setFollow = !hasSupabase ? noop : async (proId, following) => {
  const { error } = following
    ? await supabase.from('follows').insert({ follower_id: currentUserId, following_id: proId })
    : await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', proId);
  if (!error || (following && error.code === '23505')) return;
  if (error.code === '23514') throw new Error('on ne s’abonne pas à sa propre page.');
  throw error;
};

export const addComment = !hasSupabase ? noop : async (postId, texte, parentId = null) => {
  const { data } = await supabase.from('comments')
    .insert({ post_id: postId, author_id: currentUserId, texte, parent_id: parentId })
    .select().single();
  return data;
};

/**
 * Fiche publique d'un particulier : ce qu'on voit en touchant son nom sous
 * un commentaire. Un professionnel a déjà sa page ; un particulier n'avait
 * rien, et son nom n'était donc cliquable nulle part.
 *
 * On ne montre que ce qu'il a lui-même rendu public : son nom, sa ville, et
 * les demandes qu'il a publiées. Jamais son adresse ni son courriel.
 */
export const chargerProfilPublic = !hasSupabase ? noop : async (userId) => {
  const [uRes, dRes] = await Promise.all([
    supabase.from('users').select('id, nom, avatar_url, ville, type, created_at')
      .eq('id', userId).maybeSingle(),
    supabase.from('demandes').select('*').eq('client_id', userId)
      .order('created_at', { ascending: false }),
  ]);
  if (uRes.error) throw uRes.error;
  if (!uRes.data) return null;
  return {
    id: uRes.data.id,
    nom: uRes.data.nom,
    avatarUrl: uRes.data.avatar_url,
    ville: uRes.data.ville,
    type: uRes.data.type,
    inscritLe: uRes.data.created_at,
    demandes: (dRes.data || []).map((d) => ({
      id: d.id, metier: d.metier, ville: d.ville || 'Non précisée',
      texte: d.texte, media: d.media, time: relativeTime(d.created_at),
    })),
  };
};

export const createPost = !hasSupabase ? noop : async ({
  type, texte, media, medias = [], musique = null, montageUrl = null, metier, ville,
  latitude = null, longitude = null, conseil = false, chantierId = null,
}) => {
  const { data, error } = await supabase.from('posts')
    .insert({
      author_id: currentUserId, type, texte, media,
      medias, musique, montage_url: montageUrl, metier, ville,
      conseil: !!conseil,
      chantier_id: chantierId || null,
      /* Les deux ou aucune. Avec une seule, le déclencheur
         `pose_le_lieu_du_post()` repart de la fiche — une latitude seule ne
         situe rien et ressemblerait pourtant à un lieu. */
      latitude: (latitude != null && longitude != null) ? latitude : null,
      longitude: (latitude != null && longitude != null) ? longitude : null,
    })
    .select().single();
  if (error) throw error;
  return data;
};

/* ------------------------------------------------------------------ */
/*  LES CHANTIERS (section 36)                                          */
/* ------------------------------------------------------------------ */

/** Une ligne de `chantiers` devient un chantier de l'application. */
function rowToChantier(c) {
  return {
    id: c.id,
    proId: c.pro_id,
    titre: c.titre,
    ville: c.ville || null,
    statut: c.statut || 'en_cours',
    nbPublications: c.nb_publications || 0,
    couverture: c.couverture || null,
    debut: c.debut || null,
    fin: c.fin || null,
    /* LE RÉCIT (section 39), et la date que la BASE a posée. Les deux
       ensemble : sans la date, rien ne peut dire que le texte raconte un
       chantier qui a bougé depuis. */
    recit: c.recit || null,
    recitEcritLe: c.recit_ecrit_le || null,
  };
}

/**
 * LES CHANTIERS D'UN ARTISAN — la bande de sa fiche.
 *
 * `security invoker` côté base : le blocage s'applique. Un artisan qu'on a
 * bloqué n'a pas de chantiers.
 */
export const chantiersDuPro = !hasSupabase
  ? async (proId) => chantiersDemoDe(proId)
  : async (proId) => {
    const { data, error } = await supabase.rpc('chantiers_du_pro', { p_pro: proId });
    if (error) throw error;
    return (data || []).map(rowToChantier);
  };

/**
 * LES CHANTIERS DES PUBLICATIONS QU'ON VIENT DE CHARGER.
 *
 * UNE SEULE REQUÊTE pour toute une page de fil, et seulement pour les
 * publications qui appartiennent à un chantier — c'est-à-dire presque
 * aucune au début. C'est le même procédé que `pros` : l'écran a besoin du
 * TITRE, la publication ne porte que l'identifiant.
 *
 * Et surtout : **on ne touche pas à `fil_filtre()`**. Lui ajouter une
 * jointure voudrait dire changer sa signature, donc la SURCHARGER — et le
 * fil tomberait sur « is not unique », sans réparation possible depuis une
 * session de travail. C'est la leçon du lot C, éprouvée sur PostgreSQL 16.
 */
export const chantiersDeCesPosts = !hasSupabase
  ? async (posts) => {
    const ids = new Set((posts || []).map((p) => p.chantierId).filter(Boolean));
    return initialChantiers.filter((c) => ids.has(c.id)).map((c) => ({ ...c }));
  }
  : async (posts) => {
    const ids = [...new Set((posts || []).map((p) => p.chantierId).filter(Boolean))];
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from('chantiers').select('*').in('id', ids);
    if (error) throw error;
    return (data || []).map(rowToChantier);
  };

/**
 * LES PUBLICATIONS D'UN CHANTIER, dans l'ordre où elles ont été faites.
 *
 * Du plus ancien au plus récent : c'est une HISTOIRE, elle se lit dans le
 * sens où elle s'est passée. Tout le reste d'Opus trie du plus récent au
 * plus ancien, et c'est le seul endroit où ce serait un contresens.
 */
export const publicationsDuChantier = !hasSupabase
  ? async (chantierId) => initialPosts
    .filter((p) => p.chantierId === chantierId)
    /* DU PLUS ANCIEN AU PLUS RÉCENT, comme la requête ci-dessous. En
       démonstration, les publications sortaient dans l'ordre du FICHIER —
       le fil les y range du plus récent au plus ancien, donc la page du
       chantier commençait par la dernière étape. Mesuré au navigateur : la
       pose de la charpente s'affichait avant la dépose de la couverture.
       Deux tris pour une même liste, et la démonstration ne montrait pas
       l'application. */
    .slice()
    .sort((a, b) => new Date(a.publieLe || 0) - new Date(b.publieLe || 0))
    .map((p, i) => postDemo(p, i))
  : async (chantierId) => {
    const { data, error } = await supabase.from('posts').select('*')
      .eq('chantier_id', chantierId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return (data || []).map((p) => rowToPost(p, new Set(), null));
  };

/**
 * UNE PUBLICATION PAR SON IDENTIFIANT.
 *
 * Sert aux notifications (section 37), et c'est sa seule raison d'être.
 * `ouvrirNotification` cherchait la publication dans `posts` — la page du
 * fil déjà chargée, vingt lignes au plus, et filtrée par la loupe depuis
 * le lot B. Un commentaire du 21/09 répondait donc « Cette publication
 * n'est plus disponible » alors qu'elle existait parfaitement.
 *
 * > **La politique de lecture reste l'autorité.** Cette fonction ne
 * > contourne rien : un `select` ordinaire, donc filtré par « lecture
 * > posts », donc par le BLOCAGE. Si la publication vient de quelqu'un
 * > qu'on a bloqué entre-temps, elle ne revient pas — et le message « plus
 * > disponible » est alors exactement vrai.
 *
 * `maybeSingle()` et pas `single()` : une publication absente est un cas
 * NORMAL ici (supprimée, masquée, bloquée), pas une erreur à remonter.
 */
export const publicationParId = !hasSupabase
  ? async (id) => initialPosts.map((p, i) => postDemo(p, i))
    .find((p) => String(p.id) === String(id)) || null
  : async (id) => {
    const { data, error } = await supabase.from('posts').select('*')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToPost(data, new Set(), null) : null;
  };

/**
 * CRÉER UN CHANTIER, ou retrouver celui qui porte déjà ce nom.
 *
 * L'index unique de la section 36 fait qu'on ne peut pas en créer deux du
 * même nom. Plutôt que de rendre une erreur à l'artisan qui vient de
 * retaper « Toiture Charleval », **on lui rend le sien**. Le refus de la
 * base est une garde, pas un message d'accueil.
 */
/**
 * EN DÉMONSTRATION, le chantier existe VRAIMENT — en mémoire.
 *
 * `noop` refermait la feuille sans rien créer : on tapait « Toiture
 * Rognes », on validait, et il ne se passait rien. Mesuré au navigateur.
 * C'est la famille de défaut que la bande noire « MODE DÉMONSTRATION »
 * sert à éviter, et ici elle ne suffisait pas : l'écran ne mentait pas,
 * il se taisait. Un mécanisme qu'on ne peut pas essayer sans fichier
 * `.env` ne se vérifie nulle part.
 *
 * Le doublon est refusé ICI comme la base le refuse (index unique sur
 * `(pro_id, lower(btrim(titre)))`) : on rend le chantier existant, pas
 * une erreur. Deux comportements différents pour le même geste et la
 * démonstration ne montrerait pas l'application.
 */
async function creerChantierDemo({ titre, ville = null }) {
  const propre = String(titre || '').trim();
  if (!propre) throw new Error('Donnez un nom à ce chantier.');
  const monPro = Object.keys(demoPros)[0];
  const deja = initialChantiers.find((c) => String(c.proId) === String(monPro)
    && c.titre.trim().toLowerCase() === propre.toLowerCase());
  if (deja) return { ...deja };
  const neuf = {
    id: `ch-demo-${Date.now()}`, proId: monPro, titre: propre, ville,
    statut: 'en_cours', nbPublications: 0, couverture: null,
    debut: null, fin: null,
  };
  initialChantiers.push(neuf);
  return { ...neuf };
}

export const creerChantier = !hasSupabase ? creerChantierDemo : async ({ titre, ville = null }) => {
  const propre = String(titre || '').trim();
  if (!propre) throw new Error('Donnez un nom à ce chantier.');

  const { data, error } = await supabase.from('chantiers')
    .insert({ pro_id: currentUserId, titre: propre, ville })
    .select().single();

  if (error) {
    /* 23505 : l'index unique. Le chantier existe déjà — on le rend. */
    if (error.code === '23505') {
      const { data: deja, error: e2 } = await supabase.from('chantiers')
        .select('*').eq('pro_id', currentUserId).ilike('titre', propre).maybeSingle();
      if (e2) throw e2;
      if (deja) return rowToChantier(deja);
    }
    throw error;
  }
  return rowToChantier(data);
};

async function changerStatutChantierDemo(chantierId, statut) {
  const c = initialChantiers.find((x) => x.id === chantierId);
  if (!c) throw new Error('Ce chantier n\'existe plus.');
  c.statut = statut;
  return { ...c };
}

/** Marquer un chantier terminé, ou le rouvrir. */
export const changerStatutChantier = !hasSupabase
  ? changerStatutChantierDemo
  : async (chantierId, statut) => {
  const { data, error } = await supabase.from('chantiers')
    .update({ statut }).eq('id', chantierId).eq('pro_id', currentUserId)
    .select().single();
  if (error) throw error;
  return rowToChantier(data);
};

/**
 * ENREGISTRER LE RÉCIT — une fois que l'artisan l'a LU.
 *
 * C'est la première permission du §4, et elle est ici, dans ce seul appel :
 * **l'agent écrit, l'artisan publie.** Le brouillon rendu par
 * `aiRecitChantier()` ne passe par la base que lorsqu'on arrive ici, et il
 * n'y a donc rien à protéger : `chantiers` est une table PUBLIQUE, et une
 * règle RLS filtre des lignes, jamais des colonnes.
 *
 * On n'envoie PAS `recit_ecrit_le` : c'est la base qui la pose
 * (section 39.2). Un indicateur de fraîcheur qui dépendrait de l'horloge
 * du téléphone pourrait mentir, et c'est le seul service qu'il rend.
 *
 * `null` efface le récit — et la date avec, par le même déclencheur.
 */
async function enregistrerRecitDemo(chantierId, recit) {
  const c = initialChantiers.find((x) => String(x.id) === String(chantierId));
  if (!c) throw new Error('Ce chantier n\'existe plus.');
  const texte = String(recit || '').trim();
  c.recit = texte || null;
  c.recitEcritLe = texte ? new Date().toISOString() : null;
  return { ...c };
}

export const enregistrerRecit = !hasSupabase
  ? enregistrerRecitDemo
  : async (chantierId, recit) => {
    const texte = String(recit || '').trim();
    const { data, error } = await supabase.from('chantiers')
      .update({ recit: texte || null })
      .eq('id', chantierId).eq('pro_id', currentUserId)
      .select().single();
    if (error) throw error;
    return rowToChantier(data);
  };


/* ==================================================================== */
/*  LE CARNET DE CLIENTS — section 41                                    */
/*                                                                       */
/*  PRIVÉ, et c'est la première table d'Opus dont le contenu concerne des */
/*  TIERS qui n'ont pas de compte. Rien de ce qui est ici ne part dans    */
/*  `pros[]`, qui est public, ni dans une notification, ni sur une fiche. */
/* ==================================================================== */

function rowToClient(c) {
  return {
    id: c.id,
    proId: c.pro_id,
    type: c.type || 'particulier',
    nom: c.nom,
    siret: c.siret || null,
    telephone: c.telephone || null,
    email: c.email || null,
    adresse: c.adresse || null,
    codePostal: c.code_postal || null,
    ville: c.ville || null,
    notes: c.notes || null,
    archive: Boolean(c.archive),
    creeLe: c.created_at || null,
    modifieLe: c.modifie_le || null,
  };
}

/** Ce que l'écran envoie vers les colonnes de la base. Les valeurs sont
 *  déjà passées par `validerClient()` : ici on ne fait que renommer. */
function clientVersBase(v) {
  return {
    type: v.type,
    nom: v.nom,
    siret: v.siret,
    telephone: v.telephone,
    email: v.email,
    adresse: v.adresse,
    code_postal: v.codePostal,
    ville: v.ville,
    notes: v.notes,
  };
}

async function mesClientsDemo() {
  /* LE MÊME PROPRIÉTAIRE QUE LES DEVIS DE DÉMONSTRATION (`moiEnDemo()`) :
     avec `Object.keys(demoPros)[0]`, un compte passé professionnel en
     démonstration voyait le carnet d'un AUTRE, et choisir une de ses fiches
     pour un devis rendait OP013 (relecture « données » des étapes 4 à 7,
     mineur 3). Pour le compte de démonstration ordinaire, rien ne change :
     les deux valent « 1 ». */
  const monPro = moiEnDemo();
  /* `String()` DES DEUX CÔTÉS : `Object.keys()` rend toujours une chaîne,
     et les fiches de démonstration portent un nombre. Un `===` strict
     rendrait une liste vide, et le carnet paraîtrait vide sans fichier
     `.env` — exactement le défaut des trois `===` du lot E. */
  return initialClients.filter((c) => String(c.proId) === String(monPro)).map((c) => ({ ...c }));
}

/**
 * MON CARNET.
 *
 * Pas de borne : un artisan a des dizaines de clients, pas des milliers,
 * et la liste se cherche — elle ne se fait pas défiler comme un fil. Le
 * jour où ça pèsera, c'est la RECHERCHE qui ira dans la base, pas une
 * limite qui cacherait des clients en silence (la règle des « 3 annonces
 * sans lieu précisé ne sont pas affichées »).
 *
 * `select('*')` est permis ici, contrairement à `public.users` : aucune
 * colonne de cette table n'est fermée, puisque la politique « mes
 * clients » ne rend QUE mes lignes. Une règle RLS filtre des lignes ; ici
 * il n'y a rien à filtrer de plus.
 */
async function mesClientsSupabase() {
  const { data, error } = await supabase.from('clients')
    .select('*').eq('pro_id', currentUserId).order('nom');
  if (error) throw error;
  return (data || []).map(rowToClient);
}

export const mesClients = hasSupabase ? mesClientsSupabase : mesClientsDemo;

async function enregistrerClientDemo(valeurs, id, { idNeuf = null } = {}) {
  const monPro = moiEnDemo();
  if (id) {
    const deja = initialClients.find((c) => String(c.id) === String(id));
    if (!deja) throw new Error("Cette fiche n'existe plus.");
    Object.assign(deja, valeurs, { modifieLe: new Date().toISOString() });
    return { ...deja };
  }
  const neuf = {
    id: idNeuf || `cl-demo-${Date.now()}`,
    proId: monPro,
    ...valeurs,
    archive: false,
    creeLe: new Date().toISOString(),
    modifieLe: new Date().toISOString(),
  };
  initialClients.push(neuf);
  return { ...neuf };
}

/**
 * CRÉER OU MODIFIER UNE FICHE.
 *
 * `valeurs` sort de `validerClient()` (`src/lib/clients.js`), qui a déjà
 * vidé le SIRET d'un particulier et refusé ce qui ne pouvait pas partir.
 * Les contraintes de la section 41 restent le garde-fou de ce qui
 * n'entrerait pas par l'écran.
 *
 * On n'envoie PAS `modifie_le` : c'est la base qui la pose, avec
 * `clock_timestamp()`. L'horloge d'un téléphone peut mentir, et c'est le
 * seul service que rend cette colonne. Même règle que `recit_ecrit_le`.
 */
async function enregistrerClientSupabase(valeurs, id, { idNeuf = null } = {}) {
  const ligne = clientVersBase(valeurs);
  if (id) {
    const { data, error } = await supabase.from('clients')
      .update(ligne).eq('id', id).eq('pro_id', currentUserId)
      .select().single();
    if (error) throw error;
    return rowToClient(data);
  }
  const { data, error } = await supabase.from('clients')
    .insert({ ...ligne, pro_id: currentUserId, ...(idNeuf ? { id: idNeuf } : {}) })
    .select().single();
  if (error) throw error;
  return rowToClient(data);
}

/* `idNeuf` : l'identifiant CHOISI PAR LE TÉLÉPHONE (« Faire un devis »,
   29/10/2026). Un délai dépassé n'annule pas une insertion déjà partie :
   sans lui, on ne saurait pas dire si la fiche a été créée — et l'écran
   annoncerait un échec pendant que la fiche arrive en base. Avec lui, on la
   RELIT (`ficheDuCarnet`). La même parade que les devis (lot 1). */
export const enregistrerClient = hasSupabase
  ? enregistrerClientSupabase
  : enregistrerClientDemo;

/** UNE fiche du carnet, par son identifiant — `null` si elle n'y est pas. */
async function ficheDuCarnetSupabase(id) {
  const { data, error } = await avecDelai(
    supabase.from('clients').select('*').eq('id', id).eq('pro_id', currentUserId).maybeSingle(),
    8000, 'La relecture de la fiche',
  );
  if (error) throw error;
  return data ? rowToClient(data) : null;
}
async function ficheDuCarnetDemo(id) {
  const c = initialClients.find((x) => String(x.id) === String(id));
  return c ? { ...c } : null;
}
export const ficheDuCarnet = hasSupabase ? ficheDuCarnetSupabase : ficheDuCarnetDemo;

async function archiverClientDemo(id, archive) {
  const c = initialClients.find((x) => String(x.id) === String(id));
  if (!c) throw new Error("Cette fiche n'existe plus.");
  c.archive = Boolean(archive);
  c.modifieLe = new Date().toISOString();
  return { ...c };
}

/**
 * ARCHIVER, et le défaire.
 *
 * Un client archivé n'est PAS supprimé : ses devis et ses factures devront
 * continuer de le nommer. Et le geste se défait — un appui par erreur ne
 * doit pas enterrer une fiche, c'est la leçon du bouton « Terminer » d'un
 * chantier (lot E).
 */
async function archiverClientSupabase(id, archive) {
  const { data, error } = await supabase.from('clients')
    .update({ archive: Boolean(archive) }).eq('id', id).eq('pro_id', currentUserId)
    .select().single();
  if (error) throw error;
  return rowToClient(data);
}

export const archiverClient = hasSupabase ? archiverClientSupabase : archiverClientDemo;

async function supprimerClientDemo(id) {
  const i = initialClients.findIndex((x) => String(x.id) === String(id));
  if (i >= 0) initialClients.splice(i, 1);
  return true;
}

/**
 * SUPPRIMER UNE FICHE — et pourquoi c'est permis.
 *
 * La politique « mes clients » est `for all`, donc elle ouvre bien la
 * porte du `delete`. Ce fichier porte trois cicatrices de `for all` (le
 * badge décerné à l'INSERT, la fiche pro qui emportait ses avis, la ligne
 * `users` qui sautait tout le ménage de compte) : les trois fois, la porte
 * donnait sur quelque chose qui ENGAGEAIT QUELQU'UN D'AUTRE.
 *
 * Ici, non. Une faute de frappe doit pouvoir partir, et un client qui
 * demande à être oublié doit pouvoir l'être — c'est la façon dont le droit
 * à l'effacement s'exerce, et non une façon de le contourner.
 *
 * Le jour où une facture pointera ce client, c'est sa clé étrangère qui
 * refusera la suppression, et ce sera la bonne raison : la loi impose de
 * conserver dix ans une facture avec l'identité de son destinataire.
 */
async function supprimerClientSupabase(id) {
  const { error } = await supabase.from('clients')
    .delete().eq('id', id).eq('pro_id', currentUserId);
  if (error) throw error;
  return true;
}

export const supprimerClient = hasSupabase ? supprimerClientSupabase : supprimerClientDemo;

/* ==========================================================================
   « MON ENTREPRISE » POUR LES DEVIS — ce qui rend un devis légal
   (section 46 de `schema.sql`, lot 0a du module devis)

   Trois tables PRIVÉES — `emetteur`, `emetteur_assurances`, `tarifs_pro` —
   que seul leur titulaire lit et écrit (`est_mon_entreprise()`), et une
   fonction qui dit ce qui manque (`emetteur_incomplet()`).

   LA FORME DE CE CODE, et ce n'est pas un goût : chaque fonction existe en
   DEUX versions NOMMÉES, et le choix se fait à la fin. La forme
   `!hasSupabase ? async (o = {}) => { … } : …` fait échouer Metro sans
   dire ni la ligne ni la cause (CLAUDE.md).

   LA DÉMONSTRATION REFUSE AVEC LES MOTS DE LA BASE : les miroirs des
   déclencheurs (`nettoyer*`) puis des contraintes (`valider*`), et un
   refus lève l'erreur EXACTE de PostgreSQL (`refusDeLaBase`). C'est
   `messageClair` qui la traduit, des deux côtés — une démonstration plus
   aimable que la base masquerait ce que l'artisan rencontrera pour de vrai.
   ========================================================================== */

/** La fiche « devis » de démonstration de cette fiche pro, créée à la première lecture. */
function ficheEmetteurDemo(moi) {
  const cle = String(moi);
  if (!emetteursDemo[cle]) {
    emetteursDemo[cle] = cle === String(PRO_DEMO_EMETTEUR)
      ? fabriquerEmetteurDemo(new Date())
      : { emetteur: null, assurances: [], tarifs: null };
  }
  return emetteursDemo[cle];
}

/** Le refus d'une contrainte `check`, au mot près de PostgreSQL 16. */
function refusDeContrainte(table, contrainte) {
  return refusDeLaBase('23514',
    `new row for relation "${table}" violates check constraint "${contrainte}"`);
}

const copieEmetteur = (f) => ({
  emetteur: f.emetteur ? { ...f.emetteur } : null,
  assurances: f.assurances.map((a) => ({ ...a })),
  tarifs: f.tarifs ? { ...f.tarifs } : null,
});

/* --------------------------------------------------------------------------
   LIRE MA FICHE — trois lectures en parallèle.

   UNE ERREUR EST LEVÉE, jamais avalée : l'écran affiche alors l'état
   d'échec, et surtout PAS un formulaire vide. Un formulaire vide après un
   échec de lecture ferait croire que rien n'est enregistré — et un
   « Enregistrer » touché là effacerait ce qui l'était (cahier 9.1-29).
   -------------------------------------------------------------------------- */
async function monEmetteurSupabase() {
  /* La quatrième : le n° de TVA reconnu par VIES (section 48). Elle se lit
     avec les trois autres, parce que l'en-tête et ce qui manque en
     dépendent ; et elle échoue avec elles — un numéro qu'on n'a pas pu
     lire ne doit pas ressembler à un numéro absent. */
  const [e, a, t, v] = await Promise.all([
    supabase.from('emetteur').select('*').eq('pro_id', currentUserId).maybeSingle(),
    supabase.from('emetteur_assurances').select('*').eq('pro_id', currentUserId)
      .order('created_at', { ascending: true }),
    supabase.from('tarifs_pro').select('*').eq('pro_id', currentUserId).maybeSingle(),
    supabase.from('preuves_tva').select('siren, numero, reconnu_le, source').eq('pro_id', currentUserId)
      .maybeSingle(),
  ]);
  for (const r of [e, a, t]) if (r.error) throw r.error;
  /* UNE SEULE ERREUR N'EN EST PAS UNE : la table qui n'existe pas encore.
     Sur une base où la section 48 n'est pas posée, il n'y a AUCUN numéro
     reconnu — c'est vrai, et la fiche doit se lire quand même. Le
     20/10/2026, une version en avance sur la base (311f739) avait cassé
     « Mon entreprise » entière. Toute autre erreur lève. */
  if (v.error && !tableAbsente(v.error)) throw v.error;
  return {
    emetteur: e.data || null,
    assurances: a.data || [],
    tarifs: t.data || null,
    preuveTva: v.error ? null : (v.data || null),
  };
}

/** « Cette table n'existe pas » : PGRST205 (PostgREST récent) ou 42P01 (PostgreSQL). */
function tableAbsente(erreur) {
  return !!erreur && (erreur.code === 'PGRST205' || erreur.code === '42P01');
}

async function monEmetteurDemo() {
  const moi = moiEnDemo();
  const preuve = preuvesTvaDemo[String(moi)];
  return { ...copieEmetteur(ficheEmetteurDemo(moi)), preuveTva: preuve ? { ...preuve } : null };
}

export const monEmetteur = hasSupabase ? monEmetteurSupabase : monEmetteurDemo;

/* --------------------------------------------------------------------------
   ENREGISTRER MA FICHE ET MES FRAIS.

   `emetteur` sort de `fusionnerFormulaire()` : il part de la ligne CHARGÉE,
   pour qu'une section que l'écran n'affiche pas ne s'efface pas. Puis
   `pourLaBase()` ne garde que les colonnes que le client a le droit
   d'envoyer — jamais `pro_id` (posé ici, depuis la session), jamais
   `regime_tva_declare_le` ni `modifie_le` (posées par la BASE).

   Deux tables, donc deux écritures. Si la seconde échoue, la première est
   faite : l'erreur le DIT (`e.etape = 'tarifs'`), et l'écran aussi.
   -------------------------------------------------------------------------- */
async function enregistrerEmetteurSupabase({ emetteur, tarifs } = {}) {
  const { data: e, error: refus } = await supabase.from('emetteur')
    .upsert({ ...pourLaBase('emetteur', emetteur || {}), pro_id: currentUserId }, { onConflict: 'pro_id' })
    .select().single();
  if (refus) throw refus;
  let t = null;
  if (tarifs !== undefined) {
    /* LA LIGNE ENTIÈRE, TOUJOURS. PostgreSQL vérifie les contraintes sur la
       ligne PROPOSÉE d'un `insert … on conflict`, AVANT de résoudre le
       conflit : un envoi partiel (`{ affiche: true }` seul) serait refusé
       par `tarif_affiche_check` même si la ligne en base porte des prix
       (mesuré le 19/10/2026). `MonEntreprise` envoie les sept colonnes de
       `tarifsDepuisFormulaire`, et `verifier-tarifs` le tient ; la
       démonstration fait la même vérification, plus bas. */
    const { data, error } = await supabase.from('tarifs_pro')
      .upsert({ ...pourLaBase('tarifs_pro', tarifs || {}), pro_id: currentUserId }, { onConflict: 'pro_id' })
      .select().single();
    if (error) { error.etape = 'tarifs'; throw error; }
    t = data;
  }
  return { emetteur: e, tarifs: t };
}

async function enregistrerEmetteurDemo({ emetteur, tarifs } = {}) {
  const moi = moiEnDemo();
  const f = ficheEmetteurDemo(moi);
  /* L'upsert de la base : les colonnes envoyées remplacent, les autres restent. */
  const ligne = { ...(f.emetteur || {}), ...pourLaBase('emetteur', emetteur || {}) };
  const refus = validerEmetteur(ligne);
  if (!refus.ok) throw refusDeContrainte('emetteur', refus.contrainte);
  f.emetteur = { ...nettoyerEmetteur(ligne, f.emetteur, new Date()), pro_id: moi };
  if (tarifs !== undefined) {
    /* COMME POSTGRESQL : d'abord la ligne PROPOSÉE, seule — c'est elle que
       la base vérifie avant de voir qu'une ligne existe déjà —, puis la
       ligne qui resterait. Valider seulement la fusion acceptait ici un
       envoi partiel que la vraie base refuse : exactement le mode
       démonstration qui masque une erreur de la base (CLAUDE.md). */
    const proposee = pourLaBase('tarifs_pro', tarifs || {});
    const lt = { ...(f.tarifs || {}), ...proposee };
    const refusP = validerTarifs(proposee);
    const refusT = refusP.ok ? validerTarifs(lt) : refusP;
    if (!refusT.ok) {
      const e = refusDeContrainte('tarifs_pro', refusT.contrainte);
      e.etape = 'tarifs';
      throw e;
    }
    /* LA DATE DU GESTE « Afficher », comme la pose `tient_les_tarifs_publics()`
       (section 47) : elle naît quand `affiche` passe à vrai, se garde tant
       qu'il le reste, s'efface quand il s'éteint. Ici, c'est cette fonction
       qui joue le rôle de la base — jamais l'écran, jamais `nettoyerTarifs`,
       qui ne fabrique pas de date. */
    const avant = f.tarifs || null;
    const n = nettoyerTarifs(lt);
    let afficheLe = null;
    if (n.affiche) afficheLe = avant && avant.affiche === true ? avant.affiche_le : new Date().toISOString();
    f.tarifs = { ...n, affiche_le: afficheLe, pro_id: moi };
  }
  return { emetteur: { ...f.emetteur }, tarifs: f.tarifs ? { ...f.tarifs } : null };
}

export const enregistrerEmetteur = hasSupabase ? enregistrerEmetteurSupabase : enregistrerEmetteurDemo;

/* --------------------------------------------------------------------------
   MES TARIFS — et ceux qu'un artisan AFFICHE (section 47, lot T).

   `mesTarifs()` : ma propre ligne, affichée ou non. Le réglage d'urgence de
   « Modifier mon profil », « Mes tarifs » sur ma page et « Mon entreprise »
   la lisent : UNE source pour les trois, sinon ils finiraient par dire des
   choses différentes. `OpusApp` ne l'appelle que pour un compte pro — un
   particulier n'a pas de tarifs, et la lecture ne part pas pour lui.

   `tarifsAffichesDe(proId)` : la ligne d'un AUTRE artisan, s'il l'affiche.
   `.eq('affiche', true)` n'est pas une précaution : sans lui, un artisan
   qui s'ouvrirait sa propre fiche lirait sa ligne NON affichée (« mes
   tarifs » la lui rend toujours), et la croirait publique. La politique
   « tarifs affiches » ne rend une ligne affichée qu'aux PARTICULIERS
   (réponse du propriétaire du 19/10/2026) : un compte pro reçoit `null`,
   et `OpusApp` ne l'appelle de toute façon que pour un particulier.

   Une erreur est LEVÉE, jamais avalée : « je n'ai pas pu lire » et « il
   n'y en a pas » ne se disent pas pareil.
   -------------------------------------------------------------------------- */
async function mesTarifsSupabase() {
  const { data, error } = await supabase.from('tarifs_pro')
    .select('*').eq('pro_id', currentUserId).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function mesTarifsDemo() {
  const t = ficheEmetteurDemo(moiEnDemo()).tarifs;
  return t ? { ...t } : null;
}

export const mesTarifs = hasSupabase ? mesTarifsSupabase : mesTarifsDemo;

async function tarifsAffichesDeSupabase(proId) {
  const { data, error } = await supabase.from('tarifs_pro')
    .select('*').eq('pro_id', proId).eq('affiche', true).maybeSingle();
  if (error) throw error;
  return data || null;
}

/* En démonstration : la ligne enregistrée dans « Mon entreprise » pendant
   la session si cette fiche en a une, sinon celle du jeu de démonstration —
   et seulement si elle est AFFICHÉE, comme la base. Les clés sont des
   CHAÎNES (`String(proId)`) : un `===` entre `4` et `'4'` rend faux. */
async function tarifsAffichesDeDemo(proId) {
  const enSession = emetteursDemo[String(proId)];
  const t = enSession && enSession.tarifs ? enSession.tarifs : TARIFS_DEMO[String(proId)];
  return t && t.affiche === true ? { ...t } : null;
}

export const tarifsAffichesDe = hasSupabase ? tarifsAffichesDeSupabase : tarifsAffichesDeDemo;

/* --------------------------------------------------------------------------
   CE QUI MANQUE — la base le dit, au mot près.

   C'est la phrase DE LA BASE qui s'affiche (`lireMotifs`) : une version de
   l'application en retard sur `emetteur_incomplet()` montre quand même un
   motif qu'elle ne connaît pas. La démonstration fait tourner son miroir,
   `motifsEmetteur()`, sur les mêmes données — y compris les MÉTIERS de la
   fiche, seule chose qu'on lit de `professional_profiles`.
   -------------------------------------------------------------------------- */
async function emetteurIncompletSupabase() {
  const { data, error } = await supabase.rpc('emetteur_incomplet', { p_pro: currentUserId });
  if (error) throw error;
  return lireMotifs(Array.isArray(data) ? data : []);
}

async function emetteurIncompletDemo() {
  const moi = moiEnDemo();
  const f = ficheEmetteurDemo(moi);
  const fiche = prosAjoutesDemo[moi] || demoPros[moi] || {};
  return lireMotifs(motifsEmetteur({
    entreprise: entreprisesDemo[moi] || null,
    emetteur: f.emetteur,
    tarifs: f.tarifs,
    metiers: fiche.metiers || [],
    maintenant: new Date(),
    preuveTva: preuvesTvaDemo[String(moi)] || null,
  }));
}

export const emetteurIncomplet = hasSupabase ? emetteurIncompletSupabase : emetteurIncompletDemo;

/* --------------------------------------------------------------------------
   UNE ASSURANCE — la liste est une table fille : une décennale ET une RC
   pro chez deux assureurs, ça existe.

   L'ATTESTATION D'ABORD, LA LIGNE ENSUITE : c'est l'écran qui envoie le
   fichier (`envoyerAttestation`) puis enregistre la ligne avec son chemin.
   Une ligne qui pointerait un fichier pas encore arrivé serait un lien mort.
   -------------------------------------------------------------------------- */
async function enregistrerAssuranceSupabase(valeurs, id = null) {
  const ligne = pourLaBase('emetteur_assurances', valeurs || {});
  if (id) {
    const { data, error } = await supabase.from('emetteur_assurances')
      .update(ligne).eq('id', id).eq('pro_id', currentUserId)
      .select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('emetteur_assurances')
    .insert({ ...ligne, pro_id: currentUserId })
    .select().single();
  if (error) throw error;
  return data;
}

async function enregistrerAssuranceDemo(valeurs, id = null) {
  const moi = moiEnDemo();
  const f = ficheEmetteurDemo(moi);
  const ancien = id ? f.assurances.find((a) => String(a.id) === String(id)) : null;
  if (id && !ancien) throw new Error('Cette assurance n’existe plus : rechargez l’écran.');
  const ligne = { ...(ancien || {}), ...pourLaBase('emetteur_assurances', valeurs || {}) };
  /* `moiEnDemo()` et pas `currentUserId` (« demo-user ») : la contrainte
     du chemin d'attestation compare au dossier de la FICHE. */
  const refus = validerAssurance(ligne, moi);
  if (!refus.ok) throw refusDeContrainte('emetteur_assurances', refus.contrainte);
  const propre = {
    ...nettoyerAssurance(ligne, ancien, new Date()),
    id: ancien ? ancien.id : `demo-assurance-${Date.now()}`,
    pro_id: moi,
  };
  if (ancien) f.assurances = f.assurances.map((a) => (String(a.id) === String(id) ? propre : a));
  else f.assurances = [...f.assurances, propre];
  return { ...propre };
}

export const enregistrerAssurance = hasSupabase ? enregistrerAssuranceSupabase : enregistrerAssuranceDemo;

/* RETIRER UNE ASSURANCE — et le fichier RESTE dans `documents`, exprès :
   il peut être aussi l'attestation du badge, et le lot 2 doit d'abord
   décider si un devis remis copie l'attestation ou la référence. La
   suppression du compte, elle, vide cet espace. */
async function retirerAssuranceSupabase(id) {
  const { error } = await supabase.from('emetteur_assurances')
    .delete().eq('id', id).eq('pro_id', currentUserId);
  if (error) throw error;
  return true;
}

async function retirerAssuranceDemo(id) {
  const f = ficheEmetteurDemo(moiEnDemo());
  f.assurances = f.assurances.filter((a) => String(a.id) !== String(id));
  return true;
}

export const retirerAssurance = hasSupabase ? retirerAssuranceSupabase : retirerAssuranceDemo;

/* L'ATTESTATION, dans l'espace PRIVÉ `documents`, sous
   `<compte>/attestation-assurance-<horodatage>.<ext>` : un seul niveau, dans
   son dossier — exactement la forme qu'exige `emetteur_assurance_chemin_check`. */
async function envoyerAttestationSupabase(doc) {
  if (!doc || !doc.uri) return null;
  return envoyerFichier({
    uri: doc.uri, bucket: 'documents', nom: 'attestation-assurance', userId: currentUserId,
    nomOrigine: doc.nom || null, typeMime: doc.type || null,
  });
}

/* En démonstration, `envoyerFichier` rendrait l'adresse LOCALE du fichier,
   que la contrainte du chemin refuse. On fabrique donc un chemin dans le
   dossier de la fiche — `moiEnDemo()`, jamais « demo-user » —, qui passe le
   miroir de la contrainte comme passerait le vrai. */
async function envoyerAttestationDemo(doc) {
  if (!doc) return null;
  return `${moiEnDemo()}/attestation-assurance-demo-${Date.now()}.pdf`;
}

export const envoyerAttestation = hasSupabase ? envoyerAttestationSupabase : envoyerAttestationDemo;

/* « Voir l'attestation » : une adresse SIGNÉE de cinq minutes, comme tous
   les documents privés. En démonstration, il n'y a pas de fichier : `null`,
   et l'écran n'affiche pas le bouton. */
async function lienAttestationSupabase(chemin) {
  return urlDocumentSupabase(chemin);
}

async function lienAttestationDemo() { return null; }

export const lienAttestation = hasSupabase ? lienAttestationSupabase : lienAttestationDemo;

/**
 * ENREGISTRER LES PUBLICATIONS QU'ON VIENT DE REGARDER.
 *
 * Un seul appel pour tout un paquet : une requête par publication, ce
 * serait vingt allers-retours pendant qu'on fait défiler. La fonction
 * `enregistrer_vues` (section 35) est `security invoker`, donc le blocage
 * et la règle « pas ma propre publication » s'appliquent dans la base — ce
 * que l'écran envoie n'a pas besoin d'être propre, il a juste besoin
 * d'être court.
 *
 * `noop` en mode démonstration : il n'y a pas de base, et un compteur de
 * vues qui monterait sans rien enregistrer serait exactement le mensonge
 * que la bande noire « MODE DÉMONSTRATION » sert à éviter.
 */
export const enregistrerVues = !hasSupabase ? noop : async (ids) => {
  if (!ids || ids.length === 0) return 0;
  const { data, error } = await supabase.rpc('enregistrer_vues', { p_ids: ids });
  if (error) throw error;
  return data || 0;
};

/**
 * Ajoute une réalisation au portfolio du professionnel connecté.
 *
 * On ajoute à la fin : la première photo reste la première, et la bannière
 * par défaut du profil ne change donc pas à chaque publication.
 */
export const ajouterAuPortfolio = !hasSupabase ? noop : async (media) => {
  const { data, error } = await supabase.rpc('ajoute_au_portfolio', { media });
  if (error) throw error;
  return data;
};

/** Supprimer une de mes publications. Les règles RLS n'autorisent que les miennes. */
export const supprimerPost = !hasSupabase ? noop : async (postId) => {
  const { error } = await supabase.from('posts')
    .delete().eq('id', postId).eq('author_id', currentUserId);
  if (error) throw error;
};

/**
 * Remettre une publication en tête du fil.
 *
 * On ne la recopie pas : une copie perdrait ses j'aime et ses commentaires,
 * et laisserait deux fois la même chose dans le fil. On change sa date, ce
 * qui la fait remonter — le fil étant trié par date.
 */
export const republierPost = !hasSupabase ? noop : async (postId) => {
  const { data, error } = await supabase.from('posts')
    .update({ created_at: new Date().toISOString() })
    .eq('id', postId).eq('author_id', currentUserId)
    .select().single();
  if (error) throw error;
  return data;
};

/** Remplacer la liste des réalisations : suppression et réordonnancement. */
export const definirPortfolio = !hasSupabase ? noop : async (liste) => {
  const { error } = await supabase.from('professional_profiles')
    .update({ portfolio: liste }).eq('id', currentUserId);
  if (error) throw error;
};

export const createConversation = !hasSupabase ? noop : async (proId) => {
  const { data, error } = await supabase.from('conversations')
    .insert({ client_id: currentUserId, professional_id: proId })
    .select().single();
  if (error) throw error;
  return data;
};

/** Côté professionnel : ouvrir une conversation avec le particulier auteur d'une demande. */
export const createConversationWithClient = !hasSupabase ? noop : async (clientId) => {
  const { data, error } = await supabase.from('conversations')
    .insert({ client_id: clientId, professional_id: currentUserId })
    .select().single();
  if (error) throw error;
  return data;
};

/**
 * Relire la conversation qui existe déjà avec ce particulier (seconde
 * relecture du 27/10) : la création répond 23505 quand elle existe côté
 * base sans être dans la liste de l'écran — créée sur un autre appareil,
 * ou dont la réponse s'est perdue. Sans cette relecture, chaque appui
 * suivant recevait le même 23505, jusqu'au redémarrage.
 */
export const conversationAvecClient = !hasSupabase ? noop : async (clientId) => {
  const { data, error } = await supabase.from('conversations')
    .select('id').eq('client_id', clientId).eq('professional_id', currentUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const sendMessage = !hasSupabase ? noop : async (conversationId, texte) => {
  const { data, error } = await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_id: currentUserId, texte })
    .select().single();
  if (error) throw error;
  return data;
};

/* ==========================================================================
   LES DEMANDES REÇUES — devis, rappels et urgences adressés à MOI
   --------------------------------------------------------------------------
   LE DÉFAUT QUE CECI CORRIGE, et il était grave
   ---------------------------------------------
   Jusqu'au 01/10/2026, `quote_requests`, `callback_requests` et
   `sos_requests` n'apparaissaient dans tout `src/` qu'aux TROIS `insert`
   ci-dessus. On écrivait, on ne relisait jamais. Un client remplissait un
   formulaire, l'application le remerciait, et la demande tombait dans un
   trou — pendant qu'un bandeau affirmait « X est prévenu ».

   POURQUOI UNE SEULE FONCTION POUR TROIS TABLES
   ---------------------------------------------
   Un artisan ne range pas sa journée par type de formulaire. Il veut
   savoir QUI veut le faire travailler, dans l'ordre où c'est arrivé. La
   base rend donc une liste unique (`mes_demandes_recues`, section 24 de
   `schema.sql`) avec un champ `genre` pour la couleur du bandeau.

   ET POURQUOI ELLE N'EST PAS CHARGÉE AU DÉMARRAGE
   -----------------------------------------------
   `loadAll()` est déjà le point sensible du démarrage. Ces demandes
   n'intéressent que l'artisan, et seulement quand il ouvre l'onglet : on
   les charge à ce moment-là, comme les commentaires depuis le 29/09.
   Le SIGNAL, lui, ne coûte rien — c'est la notification que la base vient
   d'écrire.
   ========================================================================== */

/* Les trois genres, et ce qu'ils valent côté base — et les transitions
   permises : dans `transitions-demandes.js`, qui n'importe rien, pour qu'un
   contrôle puisse les faire tourner (lot S-b). */
export { GENRES_DEMANDE, refusDeTransition };

/* Une copie VIVANTE : accepter une demande en mode démo doit se voir, comme
   sur la vraie base. Sans cela, l'écran paraît cassé alors qu'il ne l'est
   pas — c'est le genre de détail qui fait perdre une heure. */
const DEMANDES_RECUES_DEMO = initialDemandesRecues.map((d) => ({ ...d }));

async function demandesRecuesDemo() {
  return DEMANDES_RECUES_DEMO.map((d) => ({ ...d }));
}

async function demandesRecuesSupabase() {
  const { data, error } = await supabase.rpc('mes_demandes_recues');
  if (error) throw error;
  return (data || []).map((d) => ({
    id: d.id,
    genre: d.genre,
    statut: d.statut,
    clientId: d.client_id,
    nom: d.nom,
    /* Celui que le client a ÉCRIT dans sa demande. JAMAIS `users.telephone`,
       fermé à tout le monde depuis le 29/09 — la fonction de la base ne le
       rend pas, et il ne faut pas aller le chercher ailleurs. */
    telephone: d.telephone || null,
    metier: d.metier || null,
    titre: d.titre || null,
    details: d.details || null,
    ville: d.ville || null,
    budget: d.budget || null,
    creneau: d.creneau || null,
    prixMin: d.prix_min != null ? Number(d.prix_min) : null,
    prixMax: d.prix_max != null ? Number(d.prix_max) : null,
    avatarUrl: d.avatar_url || null,
    quand: relativeTime(d.created_at),
    createdAt: d.created_at,
  }));
}

/** Tout ce qu'on m'a adressé, les trois origines mêlées, du plus récent. */
export const chargerDemandesRecues = hasSupabase ? demandesRecuesSupabase : demandesRecuesDemo;

/* LA DÉMONSTRATION REND LE MOT DE LA BASE, comme Supabase (`valeur`) —
   lot 1 du devis, trouvé par `mesure-devis` le 22/10/2026. Elle rendait le
   mot de l'APPLICATION (« accepte ») : une urgence acceptée en
   démonstration portait donc « accepte » au lieu de « acceptee », et
   `peutFaireUnDevis()`, qui lit le mot de la base genre par genre, ne lui
   proposait pas « Faire un devis ». Deux formes pour une même réponse se
   contredisent toujours un jour. */
async function repondreDemandeDemo(genre, id, statut) {
  const regles = GENRES_DEMANDE[genre] || GENRES_DEMANDE.devis;
  const valeur = regles[statut] || statut;
  const d = DEMANDES_RECUES_DEMO.find((x) => x.id === id);
  if (d) {
    /* LES MÊMES REFUS QUE LA BASE (lot S-b) — la transition, puis le
       blocage —, avec ses mots exacts (`REFUS_DEMANDES`). Une
       démonstration plus aimable que la base masquerait ce que l'artisan
       rencontrera pour de vrai (la première règle de CLAUDE.md). */
    const refus = refusDeTransition(regles, d.statut, valeur);
    if (refus) throw new ErreurDeLaBase('OP019', REFUS_DEMANDES[refus]);
    if (valeur === regles.accepte && valeur !== d.statut && demoBlocages.has(String(d.clientId))) {
      throw new ErreurDeLaBase('OP020', REFUS_DEMANDES.OP020_demande);
    }
    d.statut = valeur;
  }
  return { id, statut: valeur };
}

async function repondreDemandeSupabase(genre, id, statut) {
  const regles = GENRES_DEMANDE[genre];
  if (!regles) throw new Error(`Genre de demande inconnu : ${genre}`);
  const valeur = regles[statut];
  if (!valeur) throw new Error(`Réponse inconnue : ${statut}`);
  /* `.select('statut')` : une mise à jour que la politique écarte touche
     ZÉRO ligne, sans erreur — l'écran aurait affiché « acceptée » pour une
     demande qui ne l'est pas. On relit ce que la base a vraiment écrit. */
  const { data, error } = await supabase.from(regles.table)
    .update({ statut: valeur })
    .eq('id', id)
    .eq('professional_id', currentUserId)
    .select('statut');
  if (error) throw error;
  if (!data || !data.length) {
    throw new ErreurDeLaBase('OP019', 'Cette demande n’a pas pu être mise à jour : elle n’est plus dans '
      + 'votre liste, ou elle vient de changer. Votre liste va être relue.');
  }
  return { id, statut: data[0].statut };
}

/**
 * UN NOUVEAU DEVIS PEUT-IL SE RATTACHER À CETTE DEMANDE ? (lot S-b)
 *
 * Demandé AVANT d'ouvrir la saisie : sinon l'artisan tape sa première
 * ligne, et c'est elle qui reçoit le refus (OP020). La base répond
 * `true` / `false` sans dire pourquoi (`peut_faire_un_devis`, section
 * 49.6 bis). Un rappel n'a pas de lien de devis : `true` (on n'y propose
 * de toute façon pas « Faire un devis »).
 */
async function nouveauDevisPermisSupabase(genre, id) {
  if (genre !== 'devis' && genre !== 'sos') return true;
  /* Par `lectureDevis` (relecture du 26/10) : 8 s et une annulation, comme
     la liste des brouillons qui part avec elle. Sans délai, une requête qui
     ne revenait pas laissait « Vérification… » grisé indéfiniment. */
  const { data, error } = await lectureDevis('La vérification de cette demande', (signal) => avecSignal(
    supabase.rpc('peut_faire_un_devis', {
      p_demande: genre === 'devis' ? id : null,
      p_urgence: genre === 'sos' ? id : null,
    }), signal));
  if (error) leverLecture(error);
  return data === true;
}
/* Le blocage d'un client de démonstration ferme les NOUVEAUX liens — la
   même règle pour la question posée avant la saisie et pour la base de
   devis de démonstration, qui refuse alors l'écriture (OP020). */
/* UNE FONCTION, PAS UNE CONSTANTE : `demoBlocages` est déclaré bien plus
   bas dans ce fichier, et le lire au chargement serait un ReferenceError —
   un écran blanc au démarrage, que ni l'export ni le linter ne signalent. */
function lienFermeDemo(genre, id) {
  return creerLienFermeDemo(DEMANDES_RECUES_DEMO, demoBlocages)(genre, id);
}
async function nouveauDevisPermisDemo(genre, id) {
  return !lienFermeDemo(genre, id);
}
export const nouveauDevisPermis = hasSupabase ? nouveauDevisPermisSupabase : nouveauDevisPermisDemo;

/**
 * Accepter, refuser ou clore une demande.
 *
 * `statut` vaut 'accepte', 'refuse' ou 'termine' — les mots de
 * l'APPLICATION. La traduction vers ceux de la base vit dans
 * `GENRES_DEMANDE`, à un seul endroit.
 *
 * Le `.eq('professional_id', …)` fait doublon avec la règle RLS « le pro
 * traite le devis », et c'est voulu : une règle de base qui échoue rend
 * une erreur, un filtre qui échoue ne touche aucune ligne. Mieux vaut les
 * deux — et surtout, ACCEPTER est ce qui rend un avis « client vérifié »
 * (déclencheur `calcule_client_verifie`). Ce n'est pas un bouton anodin.
 */
export const repondreDemandeRecue = hasSupabase ? repondreDemandeSupabase : repondreDemandeDemo;

/* ==========================================================================
   LE CHIFFRAGE D'UN DEVIS — section 49 de `schema.sql`, lot 1 du module devis
   (étape 4, 22/10/2026)

   Trois tables PRIVÉES — `devis` (un brouillon), `devis_lignes`, `devis_tva`
   (la ventilation, que seule la base écrit). Ce qui suit les lit, et les
   écrit PAR LA FILE D'ÉCRITURE (`file-ecriture.js`), JAMAIS autrement :
   une requête à la fois par devis, des identifiants choisis par le
   téléphone, un délai sur chaque écriture — et la parade de la requête
   tardive (49.5 bis : un numéro d'écriture qui ne fait que monter, une
   condition sur chaque suppression).

   LA FORME DE CE CODE, et ce n'est pas un goût : chaque fonction existe en
   DEUX versions NOMMÉES, et le choix se fait à la fin. La forme
   `!hasSupabase ? async (o = {}) => { … } : …` fait échouer Metro sans dire
   ni la ligne ni la cause (CLAUDE.md). Et tout ce bloc vit APRÈS
   `const noop` : une `const` lue avant sa déclaration, c'est un écran blanc
   que ni le linter ni l'export ne signalent.

   LES ERREURS DE LA BASE REMONTENT TELLES QUELLES à la file : son code
   (23505, 40P01, OP015…) et le nom de la contrainte. Une erreur déjà
   traduite perdrait son code — un 23505 ne serait plus reconnu comme
   « déjà enregistré » (un doublon affiché), un 40P01 ne serait plus
   retenté. La phrase de l'écran se fait APRÈS, par `messageClair()`.

   LA DÉMONSTRATION écrit dans une base EN MÉMOIRE (`src/data/devis-demo.js`)
   qui refuse avec les mots de la base, par la MÊME file : les états
   « enregistrement… » et « non enregistrée » se voient sans `.env`.
   ========================================================================== */

/* Un nombre de la base (un `bigint` arrive en nombre JSON, exact jusqu'à
   2^53 — les montants s'arrêtent à 10^10, les numéros d'écriture à 2^53 − 1). */
const nombreOuNul = (v) => (v === null || v === undefined ? null : Number(v));

/** Un devis de la base, aux noms de l'application — avec ce que la requête y
 *  a joint : le nom du client, la date et le budget de la demande, la date
 *  de l'urgence. */
function rowToDevis(d) {
  if (!d) return null;
  return {
    id: d.id,
    proId: d.pro_id,
    clientId: d.client_id ?? null,
    quoteRequestId: d.quote_request_id ?? null,
    sosRequestId: d.sos_request_id ?? null,
    source: d.source,
    statut: d.statut,
    objet: d.objet ?? null,
    lieuAdresse: d.lieu_adresse ?? null,
    lieuCodePostal: d.lieu_code_postal ?? null,
    lieuVille: d.lieu_ville ?? null,
    delaiExecution: d.delai_execution ?? null,
    retenueGarantieCentiemes: nombreOuNul(d.retenue_garantie_centiemes),
    totalHtCentimes: nombreOuNul(d.total_ht_centimes),
    totalTvaCentimes: nombreOuNul(d.total_tva_centimes),
    totalTtcCentimes: nombreOuNul(d.total_ttc_centimes),
    generation: nombreOuNul(d.generation),
    createdAt: d.created_at ?? null,
    modifieLe: d.modifie_le ?? null,
    client: d.client ? { nom: d.client.nom ?? null } : null,
    /* Le TEXTE de la demande (sa description) et le problème de l'urgence
       n'arrivent qu'avec `unDevis` (`LIENS_DU_DEVIS_OUVERT`) : l'en-tête de la
       saisie les affiche, jamais recopiés dans le devis (29/10/2026). */
    demande: d.demande ? {
      createdAt: d.demande.created_at ?? null,
      budget: d.demande.budget ?? null,
      texte: d.demande.description ?? null,
    } : null,
    urgence: d.urgence ? {
      createdAt: d.urgence.created_at ?? null,
      texte: texteDUrgence({ libelle: d.urgence.probleme_label, details: d.urgence.details }),
    } : null,
  };
}

/** Une ligne de la base, aux noms de l'application. Les nombres en nombres et
 *  les booléens en booléens : la file compare ce qu'on veut à ce que la base
 *  a gardé (`Object.is`), et `4500` n'est pas `'4500'`. */
function rowToLigne(l) {
  if (!l) return null;
  const x = {
    id: l.id,
    devisId: l.devis_id ?? null,
    ordre: nombreOuNul(l.ordre),
    type: l.type ?? 'poste',
    designation: l.designation ?? null,
    quantiteMilliemes: nombreOuNul(l.quantite_milliemes),
    unite: l.unite ?? null,
    prixUnitaireCentimes: nombreOuNul(l.prix_unitaire_centimes),
    tauxTvaCentiemes: nombreOuNul(l.taux_tva_centiemes),
    totalCentimes: nombreOuNul(l.total_centimes),
    offert: l.offert === true,
    mainOeuvre: l.main_oeuvre === true,
    fournitureNonComprise: l.fourniture_non_comprise === true,
    surfaceSolMilliemes: nombreOuNul(l.surface_sol_milliemes),
    surfaceMursMilliemes: nombreOuNul(l.surface_murs_milliemes),
    generation: nombreOuNul(l.generation),
    modifieLe: l.modifie_le ?? null,
  };
  if (l.devis) {
    x.devis = {
      id: l.devis.id, objet: l.devis.objet ?? null, source: l.devis.source ?? null, modifieLe: l.devis.modifie_le ?? null,
    };
  }
  return x;
}

/**
 * CE QUE LE TÉLÉPHONE ENVOIE D'UN DEVIS — la liste FERMÉE, et rien d'autre.
 *
 * Jamais les totaux (la base les RELIT dans `devis_tva`), jamais les dates
 * (`clock_timestamp()`), jamais le statut (son défaut), jamais le numéro
 * d'écriture (il voyage à côté, et `ecrireDevisSupabase` le pose). L'id,
 * l'entreprise et la `source` partent à la CRÉATION seulement : la source
 * est le geste qui a ouvert le brouillon, et la base la fige (D3).
 *
 * Une clé ABSENTE n'est pas envoyée (ne rien dire n'est pas « vider »).
 * Cette fonction ne lit RIEN d'autre que ses arguments : `verifier-devis` la
 * fait tourner telle qu'elle est écrite ici, et la compare à `CHAMPS_DEVIS`.
 */
function devisVersBase(v, { creation = false, proId = null } = {}) {
  const r = {};
  const poser = (colonne, cle) => {
    if (v && Object.prototype.hasOwnProperty.call(v, cle) && v[cle] !== undefined) r[colonne] = v[cle];
  };
  poser('client_id', 'clientId');
  poser('quote_request_id', 'quoteRequestId');
  poser('sos_request_id', 'sosRequestId');
  poser('objet', 'objet');
  poser('lieu_adresse', 'lieuAdresse');
  poser('lieu_code_postal', 'lieuCodePostal');
  poser('lieu_ville', 'lieuVille');
  poser('delai_execution', 'delaiExecution');
  poser('retenue_garantie_centiemes', 'retenueGarantieCentiemes');
  if (creation) {
    poser('id', 'id');
    poser('source', 'source');
    r.pro_id = proId;
  }
  return r;
}

/**
 * CE QUE LE TÉLÉPHONE ENVOIE D'UNE LIGNE — la liste FERMÉE.
 *
 * Jamais le total (le déclencheur le pose : 0 pour une ligne offerte, la
 * valeur sinon), jamais la date, jamais le numéro (à côté). À la CRÉATION, la
 * ligne part ENTIÈRE — l'id, le devis, et chaque colonne, `null` ou `false`
 * quand l'écran n'a rien dit — puis elle ne se MODIFIE que par ce qui a
 * changé. Jamais d'« upsert » : PostgreSQL juge la ligne PROPOSÉE avant de
 * la fusionner (le piège du lot T), et un upsert arrivé en retard après une
 * suppression RECRÉERAIT la ligne (49.5 bis).
 *
 * Elle ne lit rien d'autre que ses arguments : `verifier-devis` la fait
 * tourner telle qu'elle est écrite ici.
 */
function ligneVersBase(v, { creation = false } = {}) {
  const r = {};
  const colonnes = [
    ['ordre', 'ordre'], ['type', 'type'], ['designation', 'designation'],
    ['quantite_milliemes', 'quantiteMilliemes'], ['unite', 'unite'],
    ['prix_unitaire_centimes', 'prixUnitaireCentimes'], ['taux_tva_centiemes', 'tauxTvaCentiemes'],
    ['offert', 'offert'], ['main_oeuvre', 'mainOeuvre'], ['fourniture_non_comprise', 'fournitureNonComprise'],
    ['surface_sol_milliemes', 'surfaceSolMilliemes'], ['surface_murs_milliemes', 'surfaceMursMilliemes'],
  ];
  colonnes.forEach(([colonne, cle]) => {
    if (v && Object.prototype.hasOwnProperty.call(v, cle) && v[cle] !== undefined) r[colonne] = v[cle];
  });
  if (creation) {
    if (v && v.id !== undefined) r.id = v.id;
    if (v && v.devisId !== undefined) r.devis_id = v.devisId;
    /* ENTIÈRE : une colonne que l'écran n'a pas dite part vide — sauf
       l'ordre, que l'écran doit toujours donner (sans lui, la base refuse,
       et c'est un défaut de l'écran qu'il faut voir). */
    const booleens = ['offert', 'main_oeuvre', 'fourniture_non_comprise'];
    colonnes.forEach(([colonne]) => {
      if (colonne === 'ordre' || Object.prototype.hasOwnProperty.call(r, colonne)) return;
      if (colonne === 'type') r.type = 'poste';
      else r[colonne] = booleens.includes(colonne) ? false : null;
    });
  }
  return r;
}

/* Un numéro d'écriture que la base accepte (49.5 bis, OP016) : un entier de
   1 à 2^53 − 1. */
const numeroEcritureValable = (g) => Number.isSafeInteger(g) && g >= 1 && g <= 9007199254740991;

/* Une modification qui n'a touché AUCUNE ligne. PostgREST rend 204, sans un
   mot : la ligne n'existe plus (retirée depuis un autre appareil), ou la
   règle d'accès ne la montre pas. La laisser passer ferait croire la ligne
   enregistrée — un échec qui ressemble à un succès. Le code PGRST116 est
   celui que `messageClair()` traduit par « cet enregistrement n'existe plus,
   ou il vient de changer depuis un autre appareil : rechargez l'écran ». */
function ligneIntrouvable() {
  const e = refusDeLaBase('PGRST116', 'JSON object requested, multiple (or no) rows returned');
  e.details = 'La ligne visée n’existe plus en base : aucune ligne modifiée.';
  return e;
}

/* La ventilation telle que la base l'a calculée : les taux qui ont des
   lignes (un taux disparu reste à zéro dans `devis_tva`, faute de pouvoir
   y écrire `delete`), du plus fort au plus faible. */
function totauxDepuisBase(d) {
  return {
    ht: nombreOuNul(d.total_ht_centimes),
    tva: nombreOuNul(d.total_tva_centimes),
    ttc: nombreOuNul(d.total_ttc_centimes),
    generation: nombreOuNul(d.generation),
    /* L'heure de la BASE, pour ranger la carte dans « Mes devis » : sans
       elle, la carte était datée à l'heure du téléphone (relecture
       « données » des étapes 4 à 7, mineur 6). */
    modifieLe: d.modifie_le ?? null,
    ventilation: (d.devis_tva || [])
      .filter((t) => Number(t.nb_lignes) > 0)
      .map((t) => ({
        taux: Number(t.taux_tva_centiemes), base: Number(t.base_centimes),
        tva: Number(t.tva_centimes), nbLignes: Number(t.nb_lignes),
      }))
      .sort((a, b) => b.taux - a.taux),
  };
}

/* UNE LECTURE PORTE UN DÉLAI ET S'ANNULE, comme une écriture : une requête
   qui ne revient jamais n'atteint jamais le `catch` (l'incident du 01/10),
   et l'écran resterait sur son squelette. Le délai est celui des écritures
   (8 s) — la borne que la vraie base impose elle-même à une requête. */
async function lectureDevis(quoi, construire) {
  const controle = typeof AbortController === 'function' ? new AbortController() : null;
  try {
    return await avecDelai(Promise.resolve().then(() => construire(controle ? controle.signal : null)),
      DELAI_ECRITURE, quoi);
  } catch (e) {
    if (controle) {
      try { controle.abort(); } catch (x) { /* rien à annuler */ }
    }
    throw e;
  }
}
const avecSignal = (requete, signal) => (signal ? requete.abortSignal(signal) : requete);

/* Une lecture qui échoue LÈVE, jamais ne rend une liste vide : « je n'ai
   pas pu lire » et « il n'y en a pas » ne se disent pas pareil. Une base où
   la section 49 n'est pas encore posée le dit (`baseEnRetard`) : l'écran
   affiche « Lecture impossible — la base n'est pas à jour », jamais
   « Aucun devis ». */
function leverLecture(error) {
  if (tableAbsente(error)) error.baseEnRetard = true;
  throw error;
}

/* --------------------------------------------------------------------------
   ÉCRIRE — le contrat de `file-ecriture.js` (son en-tête, points 1 à 15)

   `op` : `{ quoi: 'devis' | 'ligne', action: 'inserer' | 'modifier' |
   'supprimer', id, valeurs, signal, generation, generationMax }`.
     - `signal` part avec la requête (`.abortSignal`) : c'est lui qui
       annule une requête hors délai — sans lui, une écriture « perdue »
       pouvait arriver APRÈS la suivante ;
     - `generation` (insérer, modifier) part dans la colonne du même nom,
       AVEC les valeurs ; une modification du devis sans valeur (la
       « levée » de l'horloge) n'envoie que lui ;
     - `generationMax` (supprimer) devient une CONDITION :
       `generation < N`. Une suppression partie tard ne supprime rien de
       ce qui a été retouché depuis ;
     - UN ORDRE = UNE LIGNE : chaque requête vise une ligne par son `id`.
   Rien ne s'écrit sur `devis` ni `devis_lignes` ailleurs que dans cette
   fonction : `verifier-devis` le tient.
   -------------------------------------------------------------------------- */
async function ecrireDevisSupabase(op) {
  const { quoi, action, id, valeurs = {}, signal = null, generation, generationMax } = op || {};
  if (quoi !== 'devis' && quoi !== 'ligne') throw new Error(`Écriture de devis inconnue : ${quoi}.`);
  const table = quoi === 'devis' ? 'devis' : 'devis_lignes';
  let requete;
  if (action === 'inserer') {
    const ligne = quoi === 'devis'
      ? devisVersBase(valeurs, { creation: true, proId: currentUserId })
      : ligneVersBase(valeurs, { creation: true });
    requete = supabase.from(table).insert({ ...ligne, id, generation });
  } else if (action === 'modifier') {
    const changements = quoi === 'devis' ? devisVersBase(valeurs) : ligneVersBase(valeurs);
    /* `.select('id')` : pour SAVOIR qu'une ligne a été modifiée. */
    requete = supabase.from(table).update({ ...changements, generation }).eq('id', id).select('id');
  } else if (action === 'supprimer') {
    /* Une suppression sans condition passerait par-dessus une écriture
       plus récente : cette version de l'application écrirait mal, et elle
       doit le voir (le même refus que la base pour un numéro hors bornes). */
    if (!numeroEcritureValable(generationMax)) {
      throw refusDeLaBase('OP016', quoi === 'devis' ? REFUS_DEVIS.OP016_devis : REFUS_DEVIS.OP016_ligne);
    }
    requete = supabase.from(table).delete().eq('id', id).lt('generation', generationMax).select('id');
  } else {
    throw new Error(`Écriture de devis inconnue : ${action}.`);
  }
  if (signal) requete = requete.abortSignal(signal);
  const { data, error } = await requete;
  /* L'erreur de PostgREST TELLE QUELLE : son code et sa contrainte. */
  if (error) throw error;
  if (action === 'modifier' && !(Array.isArray(data) && data.length)) throw ligneIntrouvable();
  if (action === 'supprimer' && !(Array.isArray(data) && data.length)) {
    /* Rien de supprimé : déjà parti — c'était fait —, ou retouché depuis
       par une écriture plus récente. Le second cas se DIT (OP015 : la file
       relit l'horloge, et « Réessayer » repart au-dessus). */
    const encore = await relireUnDevisSupabase({ quoi, id });
    if (encore) throw refusDeLaBase('OP015', quoi === 'devis' ? SUPPRESSION_DEPASSEE.devis : SUPPRESSION_DEPASSEE.ligne);
  }
  return true;
}

/* La démonstration : la base en mémoire, qui refuse avec les mots de la
   base. Une écriture y prend un tiers de seconde : sans ce temps, les états
   « enregistrement… » ne se verraient jamais, et ne se vérifieraient pas ici. */
const PAUSE_ECRITURE_DEMO = 300;
function demandeRecueDemo(genre, id) {
  return DEMANDES_RECUES_DEMO.find((d) => d.genre === genre && d.id === id) || null;
}
function baseDevisDeDemo() {
  if (!baseDevisDemo) {
    baseDevisDemo = creerBaseDevisDemo({
      demandeDe: demandeRecueDemo, lienFerme: lienFermeDemo, pauseMs: PAUSE_ECRITURE_DEMO,
    });
  }
  return baseDevisDemo;
}
async function ecrireDevisDemo(op) {
  return baseDevisDeDemo().ecrire(moiEnDemo(), op);
}

const ecrireDevis = hasSupabase ? ecrireDevisSupabase : ecrireDevisDemo;

/* RELIRE UN OBJET PAR SON IDENTIFIANT — après un 23505 (« déjà
   enregistré ? »), pour l'horloge après un refus OP015, et après une
   suppression qui n'a rien supprimé. `null` : il n'existe pas, ou il n'est
   pas à moi (la règle d'accès le cache). */
async function relireUnDevisSupabase({ quoi, id }) {
  if (quoi === 'devis') {
    const { data, error } = await supabase.from('devis').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return rowToDevis(data);
  }
  const { data, error } = await supabase.from('devis_lignes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return rowToLigne(data);
}
async function relireUnDevisDemo(q) {
  return baseDevisDeDemo().relireUn(moiEnDemo(), q);
}
const relireUnDevis = hasSupabase ? relireUnDevisSupabase : relireUnDevisDemo;

/* LES TOTAUX QUE LA BASE A CALCULÉS, et sa ventilation, EN UNE requête.
   L'écran affiche CEUX-LÀ, pas ceux du téléphone. */
async function relireTotauxDevisSupabase(devisId) {
  const { data, error } = await supabase.from('devis')
    .select('total_ht_centimes, total_tva_centimes, total_ttc_centimes, generation, modifie_le, '
      + 'devis_tva(taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes)')
    .eq('id', devisId)
    .maybeSingle();
  if (error) throw error;
  return data ? totauxDepuisBase(data) : null;
}
async function relireTotauxDevisDemo(devisId) {
  return baseDevisDeDemo().relireTotaux(moiEnDemo(), devisId);
}
const relireTotauxDevis = hasSupabase ? relireTotauxDevisSupabase : relireTotauxDevisDemo;

/* --------------------------------------------------------------------------
   LA FILE D'UN DEVIS — une par devis, et l'écran n'écrit que par elle.

   `fileDuDevis({ devisId, devis, devisEnBase, lignesEnBase, horloge })` rend
   la file de ce devis — la MÊME si elle existe déjà : une liste qui
   supprime un brouillon pendant que sa saisie enregistre encore une ligne
   passe par la même file, donc après elle. Ses méthodes sont celles de
   `file-ecriture.js` — `devis()`, `ligne()`, `modifierLigne()`,
   `retirerLigne()`, `marquerLocale()`, `reessayer()`, `supprimerDevis()`,
   `etatDe()`, `enAttente()`, `attendre()`, `abonner()`… — et ce qui y entre
   est d'abord réduit à ce que l'artisan écrit (`CHAMPS_DEVIS`,
   `CHAMPS_LIGNE`) : un total ou une date recopiés de l'écran feraient
   partir une écriture pour rien.

   `horloge` : le numéro d'écriture du devis lu à l'ouverture
   (`devis.generation`), 0 pour un brouillon neuf. L'identifiant d'un
   brouillon neuf vient de `nouvelIdentifiant()` (`identifiant.js`) — et
   s'il rend `null`, l'écran le dit (`IDENTIFIANT_IMPOSSIBLE`) au lieu
   d'enregistrer de travers.
   -------------------------------------------------------------------------- */
export function fileDuDevis({ devisId, devis = {}, devisEnBase = false, lignesEnBase = [], horloge = 0 } = {}) {
  if (!devisId) throw new Error('Un devis s’enregistre avec son identifiant.');
  const deja = filesDevis.get(devisId);
  if (deja) return deja;
  const file = creerFileEcriture({
    devisId,
    devis: choisirChamps(devis, CHAMPS_DEVIS),
    devisEnBase,
    lignesEnBase: (lignesEnBase || []).map((l) => ({
      ...choisirChamps(l, CHAMPS_LIGNE), id: l.id, devisId: l.devisId || devisId,
    })),
    ecrire: ecrireDevis,
    relireUn: relireUnDevis,
    relireTotaux: relireTotauxDevis,
    avecDelai,
    nouvelIdentifiant,
    horloge: Number(horloge) || 0,
  });
  const enveloppe = {
    ...file,
    devis: (v) => file.devis(choisirChamps(v, CHAMPS_DEVIS)),
    ligne: (v) => file.ligne({ ...choisirChamps(v, CHAMPS_LIGNE), id: v ? v.id : undefined }),
    modifierLigne: (id, changements) => file.modifierLigne(id, choisirChamps(changements, CHAMPS_LIGNE)),
    marquerLocale: (id, v = null) => file.marquerLocale(id, v ? choisirChamps(v, CHAMPS_LIGNE) : null),
  };
  let cle = devisId;
  file.abonner((ev) => {
    /* Le brouillon n'existe plus : sa file non plus. */
    if (ev.type === 'supprimee' && ev.cle === 'devis' && filesDevis.get(cle) === enveloppe) filesDevis.delete(cle);
    /* L'identifiant était pris ailleurs (en pratique jamais) : la file suit. */
    if (ev.type === 'renomme' && ev.quoi === 'devis' && filesDevis.get(cle) === enveloppe) {
      filesDevis.delete(cle);
      cle = ev.nouveau;
      filesDevis.set(cle, enveloppe);
    }
  });
  filesDevis.set(devisId, enveloppe);
  return enveloppe;
}

/** L'écran de saisie se ferme : sa file est oubliée dès qu'elle n'a plus
 *  rien en vol ni en attente — pas avant. Une écriture partie finit, et
 *  rouvrir le devis entre-temps retrouve la MÊME file. */
export function laisserFileDuDevis(devisId) {
  const f = filesDevis.get(devisId);
  if (!f) return;
  const oublier = () => {
    if (filesDevis.get(devisId) === f && f.vide()) filesDevis.delete(devisId);
  };
  if (f.vide()) oublier();
  else f.attendre().then(oublier);
}

/** La file de ce devis, SI ELLE EXISTE ENCORE — sans en créer une. Rouvrir un
 *  devis dont la file écrit encore (on l'a quitté par « Quitter sans elles »,
 *  ou la garde n'a pas attendu la fin) : l'écran attend qu'elle finisse, et
 *  se construit sur ce qu'elle VEUT, jamais sur une photo de la base prise
 *  pendant qu'elle écrit (relecture « données » des étapes 4 à 7, I2).
 *
 *  (`supprimerDevis(d)`, exporté ici jusqu'au 22/10, n'avait AUCUN appelant :
 *  la saisie supprime par SA file. Utilisée un jour depuis la liste, elle
 *  aurait inscrit une file sans ses lignes qu'aucun `laisserFileDuDevis` ne
 *  retirait après un échec — retirée plutôt que laissée à mentir.) */
export function fileExistante(devisId) {
  return (devisId && filesDevis.get(devisId)) || null;
}

/* --------------------------------------------------------------------------
   LIRE

   « Mes devis » : bornée à 200, triée par date — il n'y a qu'un statut au
   lot 1. 201 lignes demandées pour SAVOIR s'il y en a plus de 200 : la
   liste le DIT (`tronque`), une liste coupée en silence cache du travail.
   Le jour où un second statut existe, ce qui attend passe devant, côté
   base — `verifier-devis` l'exigera.
   -------------------------------------------------------------------------- */
const LIENS_DU_DEVIS = '*, client:client_id(nom), demande:quote_request_id(created_at, budget), '
  + 'urgence:sos_request_id(created_at)';
/* UN DEVIS OUVERT montre aussi ce que le client a demandé (« Ce que le client
   a demandé », 29/10/2026) : la description de la demande, le problème de
   l'urgence. Lus par le lien — la politique « lecture mes devis » / « lecture
   mes sos » laisse l'artisan lire ce qui lui est adressé —, et seulement pour
   le devis ouvert : une liste de 200 devis n'a pas à transporter 200 textes. */
const LIENS_DU_DEVIS_OUVERT = '*, client:client_id(nom), demande:quote_request_id(created_at, budget, description), '
  + 'urgence:sos_request_id(created_at, probleme_label, details)';

async function mesDevisSupabase() {
  const { data, error } = await lectureDevis('La lecture de vos devis', (signal) => avecSignal(
    supabase.from('devis')
      .select(LIENS_DU_DEVIS)
      .eq('pro_id', currentUserId)
      .order('modifie_le', { ascending: false })
      .order('id')
      .limit(PLAFOND_LISTE + 1), signal));
  if (error) leverLecture(error);
  return decouperListe((data || []).map(rowToDevis));
}
async function mesDevisDemo() {
  return decouperListe(await baseDevisDeDemo().liste(moiEnDemo()));
}
export const mesDevis = hasSupabase ? mesDevisSupabase : mesDevisDemo;

/** Un devis, ses lignes et sa ventilation — EN UNE SEULE requête, donc un
 *  seul instantané. Trois lectures parallèles étaient trois transactions :
 *  une ligne écrite entre la première et les deux autres donnait « Total HT
 *  100,00 € » au-dessus de deux taux qui faisaient 300,00 € (relecture
 *  « données » des étapes 4 à 7, I3, prouvé sur PostgreSQL 16). La forme est
 *  celle de `relireTotauxDevisSupabase`, qui l'était déjà.
 *  `null` s'il n'existe plus (ou n'est pas à moi). Les lignes sont rangées
 *  par `ordre`, PUIS par `id` : sans le second critère, deux lignes au même
 *  rang se rangeraient selon l'ordre physique, et une ligne changerait de
 *  pièce selon l'écran qui la lit. */
async function unDevisSupabase(id) {
  const { data, error } = await lectureDevis('La lecture de ce devis', (signal) => avecSignal(
    supabase.from('devis')
      .select(`${LIENS_DU_DEVIS_OUVERT}, devis_lignes(*), `
        + 'devis_tva(taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes)')
      .eq('id', id)
      .order('ordre', { referencedTable: 'devis_lignes' })
      .order('id', { referencedTable: 'devis_lignes' })
      .maybeSingle(), signal));
  if (error) leverLecture(error);
  if (!data) return null;
  const { devis_lignes: lignes, ...devis } = data;
  return {
    devis: rowToDevis(devis),
    lignes: (lignes || []).map(rowToLigne),
    ventilation: totauxDepuisBase(data).ventilation,
  };
}
async function unDevisDemo(id) {
  return baseDevisDeDemo().un(moiEnDemo(), id);
}
export const unDevis = hasSupabase ? unDevisSupabase : unDevisDemo;

/** Les devis d'une fiche du carnet — 21 au plus : la fiche en montre 20, et
 *  dit qu'il y en a d'autres. */
async function devisDuClientSupabase(clientId) {
  const { data, error } = await lectureDevis('La lecture des devis de ce client', (signal) => avecSignal(
    supabase.from('devis')
      .select(LIENS_DU_DEVIS)
      .eq('pro_id', currentUserId)
      .eq('client_id', clientId)
      .order('modifie_le', { ascending: false })
      .order('id')
      .limit(21), signal));
  if (error) leverLecture(error);
  return (data || []).map(rowToDevis);
}
async function devisDuClientDemo(clientId) {
  return baseDevisDeDemo().duClient(moiEnDemo(), clientId);
}
export const devisDuClient = hasSupabase ? devisDuClientSupabase : devisDuClientDemo;

/** Les brouillons déjà ouverts depuis une demande ou une urgence — pour
 *  « Reprendre » au lieu d'en commencer un second sans le savoir. 5 au plus. */
async function devisDeLaDemandeSupabase(genre, id) {
  const colonne = genre === 'sos' ? 'sos_request_id' : 'quote_request_id';
  const { data, error } = await lectureDevis('La lecture des devis de cette demande', (signal) => avecSignal(
    supabase.from('devis')
      .select('id, objet, modifie_le')
      .eq('pro_id', currentUserId)
      .eq(colonne, id)
      .order('modifie_le', { ascending: false })
      .order('id')
      .limit(5), signal));
  if (error) leverLecture(error);
  return (data || []).map((d) => ({ id: d.id, objet: d.objet ?? null, modifieLe: d.modifie_le ?? null }));
}
async function devisDeLaDemandeDemo(genre, id) {
  return baseDevisDeDemo().deLaDemande(moiEnDemo(), genre, id);
}
export const devisDeLaDemande = hasSupabase ? devisDeLaDemandeSupabase : devisDeLaDemandeDemo;

/** L'ADRESSE D'UNE URGENCE, pour la fiche du client et le lieu des travaux,
 *  et son TEXTE — le problème et ce que la personne a écrit (« Faire un
 *  devis », 29/10/2026). `mes_demandes_recues()` colle les deux dans ses
 *  détails ; on les relit à part, par la table :
 *  la politique « lecture mes sos » laisse l'artisan lire les urgences qui
 *  lui sont adressées. Changer les colonnes que rend la fonction aurait
 *  demandé de la supprimer, ce que le connecteur refuse (section 34).
 *  `null` si l'urgence n'est plus lisible. */
async function lieuDeLUrgenceSupabase(id) {
  const { data, error } = await avecDelai(
    supabase.from('sos_requests').select('adresse, code_postal, probleme_label, details').eq('id', id).maybeSingle(),
    8000, 'La lecture de l’adresse de l’urgence',
  );
  if (error) throw error;
  return data ? {
    adresse: data.adresse ?? null,
    codePostal: data.code_postal ?? null,
    texte: texteDUrgence({ libelle: data.probleme_label, details: data.details }),
  } : null;
}
async function lieuDeLUrgenceDemo(id) {
  const d = DEMANDES_RECUES_DEMO.find((x) => x.genre === 'sos' && String(x.id) === String(id));
  return d ? {
    adresse: d.adresse ?? null,
    codePostal: d.codePostal ?? null,
    texte: texteDUrgence({ libelle: d.titre, details: d.detailsEcrits }),
  } : null;
}
export const lieuDeLUrgence = hasSupabase ? lieuDeLUrgenceSupabase : lieuDeLUrgenceDemo;

/**
 * LA MÉMOIRE — les postes et options de MES devis, brouillons compris, la plus
 * récente d'abord, avec leur devis d'origine. La recherche se fait sur le
 * téléphone (`memoireDesLignes` de `devis.js`) : aucune fonction SQL de plus.
 *
 * FILTRÉE PAR MES DEVIS CÔTÉ BASE (`!inner` et `devis.pro_id`), jamais par la
 * seule règle d'accès : mesuré par la relecture « base » du cahier, la règle
 * seule faisait lire TOUTES les lignes de TOUS les artisans pour en garder
 * 21 (306 ms sur 200 000 lignes, contre 2,9 ms filtrée) — et la vraie base
 * coupe à 8 s. Triée par date, et non par `ordre` : elle ne range pas les
 * lignes d'un devis, elle cherche ce qu'on a écrit le plus récemment.
 */
async function memoireDesLignesSupabase() {
  const { data, error } = await lectureDevis('La lecture de vos prix déjà écrits', (signal) => avecSignal(
    supabase.from('devis_lignes')
      .select('id, type, designation, unite, prix_unitaire_centimes, offert, main_oeuvre, '
        + 'fourniture_non_comprise, modifie_le, devis:devis_id!inner(id, objet, source, modifie_le)')
      .eq('devis.pro_id', currentUserId)
      .in('type', ['poste', 'option'])
      .order('modifie_le', { ascending: false })
      .order('id')
      .limit(MEMOIRE_MAX), signal));
  if (error) leverLecture(error);
  return (data || []).map(rowToLigne);
}
async function memoireDesLignesDemo() {
  return baseDevisDeDemo().memoire(moiEnDemo());
}
export const memoireDesLignes = hasSupabase ? memoireDesLignesSupabase : memoireDesLignesDemo;

/**
 * MON RÉGIME DE TVA — `'franchise'`, `'reel'`, ou `null` (non déclaré). Lu
 * par la fonction qui lit déjà « Mon entreprise » : aucune lecture nouvelle
 * des tables de l'émetteur, aucune fonction SQL qui les lise.
 *
 * UNE ERREUR LÈVE : l'écran tient cinq états, et un régime qu'on n'a pas pu
 * lire n'est JAMAIS « non déclaré » (`tauxProposes` rend `null`, pas `[]`).
 */
/* Le régime et la date de sa déclaration, lus dans la fiche que rend
   `monEmetteur…` : UNE écriture de cette lecture, pour `monRegime` comme
   pour `monRegimeEtSaDate` — deux lectures écrites à part finiraient par
   ne plus dire la même chose. */
function regimeEtSaDate(f) {
  const e = f && f.emetteur;
  return {
    regime: e ? (e.regime_tva ?? null) : null,
    declareLe: e ? (e.regime_tva_declare_le ?? null) : null,
  };
}
async function monRegimeSupabase() {
  return regimeEtSaDate(await monEmetteurSupabase()).regime;
}
async function monRegimeDemo() {
  return regimeEtSaDate(await monEmetteurDemo()).regime;
}
export const monRegime = hasSupabase ? monRegimeSupabase : monRegimeDemo;

/**
 * MON RÉGIME ET LA DATE DE SA DÉCLARATION — `{ regime, declareLe }` (lot P,
 * section 50 ; la date est `regime_tva_declare_le`, posée par la BASE au
 * changement de régime, section 46).
 *
 * POURQUOI LA DATE : un prix de référence est dans la convention de la
 * LIGNE — hors taxes au régime réel, sans TVA en franchise. Fixé AVANT le
 * changement de régime, il ne se compare plus au prix d'aujourd'hui sans
 * réfléchir : la référence le DIT (« …, avant la déclaration de votre
 * régime de TVA actuel : vérifiez-le. ») au lieu de poser la question de
 * l'écart. La même lecture que `monRegime` — aucune lecture nouvelle des
 * tables de l'émetteur —, et `monRegime` reste : les cinq états du régime
 * ne changent pas, et une erreur LÈVE (un régime qu'on n'a pas pu lire
 * n'est jamais « non déclaré »).
 */
async function monRegimeEtSaDateSupabase() {
  return regimeEtSaDate(await monEmetteurSupabase());
}
async function monRegimeEtSaDateDemo() {
  return regimeEtSaDate(await monEmetteurDemo());
}
export const monRegimeEtSaDate = hasSupabase ? monRegimeEtSaDateSupabase : monRegimeEtSaDateDemo;

/* ==========================================================================
   LA BASE DE POSTES — section 50 de `schema.sql` (lot P du module devis)

   Un poste, c'est une phrase que l'artisan a chiffrée une fois et rangée
   d'un APPUI (« Ajouter à ma base »), avec un prix de référence qu'il a
   fixé lui-même. Il ne passe PAS par la file d'écriture du devis : ce n'est
   pas une ligne, et la file ne connaît que `devis` et `ligne`. Ses quatre
   fonctions tiennent pourtant le même contrat :
     - UNE REQUÊTE À LA FOIS (`uneRequeteDePosteALaFois`) : la seconde
       attend la première. Un double appui, ou un ajout et une correction
       partis ensemble, arrivent dans l'ordre où ils sont partis ;
     - UN DÉLAI DE 8 s ET UNE ANNULATION sur chacune (`lectureDevis`) : une
       requête qui ne revient jamais n'atteint jamais le `catch` (l'incident
       du 01/10). Le délai court à partir du tour de la requête, pas de sa
       mise en file : sinon une écriture qui attend la précédente
       épuiserait le sien à attendre ;
     - JAMAIS D'`upsert` : PostgreSQL juge la ligne PROPOSÉE avant de la
       fusionner (le piège du lot T), et le déclencheur compte le plafond
       avant de savoir qu'elle fusionnerait ;
     - une lecture qui échoue LÈVE (jamais une liste vide), avec
       `baseEnRetard` quand la table manque (`leverLecture`) ;
     - pas d'horloge `generation` : modifier et retirer se font SOUS
       CONDITION sur `modifie_le`, la date LUE. Une écriture partie avec
       une date périmée ne touche aucune ligne, et ça se DIT
       (`ErreurPoste`, « modifié entre-temps ») au lieu de ressembler à un
       travail fait.

   AUCUNE AUTRE FONCTION N'ÉCRIT `base_postes`, et c'est un contrat :
   `verifier-postes` (D) refuse le nom de la table hors de ces quatre
   fonctions, sous toutes ses formes. Rien ne s'ajoute tout seul : un poste
   n'entre dans la base que par l'appui de l'artisan (sa réponse du 23/10).

   LA CLÉ DE RAPPROCHEMENT N'EST NI LUE NI ENVOYÉE : la base la calcule
   (son déclencheur la pose — l'envoyer rendrait 428C9), et l'application
   calcule la même par son miroir (`cleDeLigne`), comme pour une ligne qui
   n'est pas encore en base.
   ========================================================================== */

/* Les dix colonnes qu'on lit, et rien d'autre — aucun plongeon dans
   `devis` (l'objet d'un devis peut nommer un client, et l'origine d'un
   poste se dit par sa DATE), pas la clé de rapprochement. La saisie et la
   page lisent les mêmes. */
const COLONNES_POSTE = 'id, designation, unite, fourniture_non_comprise, main_oeuvre, prix_reference_centimes, '
  + 'prix_fixe_le, devis_origine_id, created_at, modifie_le';

/** Un poste de la base, aux noms de l'application — ceux que `postes.js`
 *  lit. `modifieLe` reste la CHAÎNE reçue : elle repart TELLE QUELLE dans
 *  la condition d'une modification ; la reformater ferait rater l'égalité,
 *  et dire « modifié entre-temps » sur un poste que personne n'a touché. */
function rowToPoste(p) {
  if (!p) return null;
  return {
    id: p.id,
    designation: p.designation ?? null,
    unite: p.unite ?? null,
    fournitureNonComprise: p.fourniture_non_comprise === true,
    mainOeuvre: p.main_oeuvre === true,
    prixReferenceCentimes: nombreOuNul(p.prix_reference_centimes),
    prixFixeLe: p.prix_fixe_le ?? null,
    devisOrigineId: p.devis_origine_id ?? null,
    createdAt: p.created_at ?? null,
    modifieLe: p.modifie_le ?? null,
  };
}

/**
 * CE QUE LE TÉLÉPHONE ENVOIE D'UN POSTE — la liste FERMÉE, et rien d'autre.
 *
 * À la CRÉATION : la phrase, l'unité, les deux interrupteurs, le prix de
 * référence (vide permis : « à fixer plus tard »), l'entreprise et le lien
 * d'origine — la ligne part ENTIÈRE, un interrupteur non dit vaut `false`.
 * En MODIFICATION : la phrase (corrigée dans la page) et le prix de
 * référence, SEULEMENT — l'unité et la fourniture font la clé du poste, et
 * la feuille d'ajout ne corrige jamais la phrase.
 *
 * Jamais `id`, `created_at`, `modifie_le`, `prix_fixe_le` (la base les
 * pose), jamais `cle_rapprochement` (428C9). Un nom INCONNU n'est pas
 * ignoré : il lève. Un champ mal nommé (`prix_reference_centimes` au lieu
 * de `prixReferenceCentimes`) partirait sinon sans rien changer, et
 * l'écran annoncerait un prix changé qui ne l'est pas.
 *
 * Elle ne lit rien d'autre que ses arguments : `verifier-postes` (D) la
 * FAIT TOURNER telle qu'elle est écrite ici.
 */
function posteVersBase(v, { creation = false, proId = null, devisOrigineId = null } = {}) {
  const colonnes = creation
    ? [['designation', 'designation'], ['unite', 'unite'], ['fourniture_non_comprise', 'fournitureNonComprise'],
      ['main_oeuvre', 'mainOeuvre'], ['prix_reference_centimes', 'prixReferenceCentimes']]
    : [['designation', 'designation'], ['prix_reference_centimes', 'prixReferenceCentimes']];
  const dites = Object.keys(v || {}).filter((cle) => v[cle] !== undefined);
  const inconnues = dites.filter((cle) => !colonnes.some(([, c]) => c === cle));
  if (inconnues.length) {
    throw new Error(`Opus a voulu ${creation ? 'ranger' : 'modifier'} « ${inconnues.join(', ')} » sur un poste : `
      + `seuls ${colonnes.map(([, c]) => c).join(', ')} s’écrivent ${creation ? 'à l’ajout' : 'en modification'}. `
      + 'C’est un défaut d’Opus, pas le vôtre : rien n’a été enregistré.');
  }
  if (!creation && !dites.length) {
    throw new Error('Opus a voulu modifier un poste sans rien changer : c’est un défaut d’Opus, pas le vôtre.');
  }
  const r = {};
  colonnes.forEach(([colonne, cle]) => {
    if (v && Object.prototype.hasOwnProperty.call(v, cle) && v[cle] !== undefined) r[colonne] = v[cle];
  });
  if (creation) {
    if (!Object.prototype.hasOwnProperty.call(r, 'designation')) r.designation = null;
    if (!Object.prototype.hasOwnProperty.call(r, 'unite')) r.unite = null;
    r.fourniture_non_comprise = r.fourniture_non_comprise === true;
    r.main_oeuvre = r.main_oeuvre === true;
    if (!Object.prototype.hasOwnProperty.call(r, 'prix_reference_centimes')) r.prix_reference_centimes = null;
    r.pro_id = proId;
    r.devis_origine_id = devisOrigineId || null;
  }
  return r;
}

/* UNE REQUÊTE DE POSTE À LA FOIS : la seconde part quand la première a
   fini — réussi, échoué ou dépassé son délai. Le délai et l'annulation
   (`lectureDevis`) s'appliquent au TOUR de la requête. */
let tourDesPostes = Promise.resolve();
function uneRequeteDePosteALaFois(quoi, construire) {
  const tour = tourDesPostes.then(() => lectureDevis(quoi, construire));
  tourDesPostes = tour.then(() => undefined, () => undefined);
  return tour;
}

/* LE LIEN D'ORIGINE REFUSÉ — et lui seul : le devis cité a été supprimé
   entre l'ouverture de la feuille et l'appui (ou il n'a jamais été en
   base). L'origine n'est qu'une information — la cascade l'aurait vidée de
   toute façon — : l'ajout repart UNE fois, sans elle. Toute autre clé
   étrangère, tout autre refus remontent tels quels : « cet enregistrement
   désigne quelque chose qui n'existe plus » serait FAUX pour un poste
   refusé pour une autre raison. */
function lienOrigineRefuse(e) {
  return Boolean(e) && String(e.code || '') === '23503'
    && String(e.message || '').includes('base_postes_devis_origine_fkey');
}

/* Une modification ou un retrait conditionnés qui n'ont touché AUCUNE
   ligne : le poste a été modifié, ou retiré, depuis qu'on l'a lu. */
function unPosteTouche(lignes) {
  if (!(Array.isArray(lignes) && lignes.length)) throw new ErreurPoste();
  return lignes[0];
}

/* Un poste se modifie et se retire AVEC la date lue : sans elle, la
   condition ne garderait rien — ce serait une faute d'Opus, et elle doit
   se voir. */
function exigerDateLue(modifieLe) {
  if (typeof modifieLe !== 'string' || !modifieLe) {
    throw new Error('Opus a voulu écrire un poste sans la date de sa dernière lecture : c’est un défaut d’Opus, '
      + 'pas le vôtre, et rien n’a été enregistré.');
  }
}

/**
 * MA BASE DE POSTES — `{ postes, incomplete, total }`.
 *
 * FILTRÉE PAR MON ENTREPRISE CÔTÉ BASE (`.eq('pro_id', …)`), jamais par la
 * seule règle d'accès : une politique RLS se paie PAR LIGNE, et elle ne
 * trie pas (CLAUDE.md, lot 1). TRIÉE par l'identifiant et BORNÉE au
 * plafond, AVEC son compte : l'API de Supabase coupe chaque réponse à sa
 * limite de lignes, SANS erreur. Sans ordre, une base au-delà de la limite
 * rendrait des postes pris au hasard ; sans compte, rien ne le dirait.
 * `incomplete` le dit, et `total` (le compte de la base, ou `null`) dit
 * combien : la page écrit le vrai nombre, et que sa recherche ne porte que
 * sur les postes lus (relecture « textes », TEXTES12).
 */
async function mesPostesSupabase() {
  const { data, error, count } = await uneRequeteDePosteALaFois('La lecture de votre base de postes', (signal) => avecSignal(
    supabase.from('base_postes')
      .select(COLONNES_POSTE, { count: 'exact' })
      .eq('pro_id', currentUserId)
      .order('id')
      .limit(POSTES_MAX), signal));
  if (error) leverLecture(error);
  const postes = (data || []).map(rowToPoste);
  const total = Number.isSafeInteger(Number(count)) ? Number(count) : null;
  return { postes, incomplete: Number(count) > postes.length, total };
}

/**
 * AJOUTER UN POSTE — le poste rangé, tel que la base l'a gardé (sa phrase
 * rognée, ses dates).
 *
 * `devisOrigineId` : le devis d'où vient la ligne, SEULEMENT s'il est déjà
 * en base au moment de l'appui (l'écran le sait par la file, sans
 * l'attendre). Refusé (le devis a disparu entre-temps), l'ajout repart une
 * fois sans lui. Un 23505 (`idx_base_postes_rapprochement`) remonte TEL
 * QUEL : ce poste existe déjà, presque mot pour mot — la feuille relit la
 * base et le MONTRE.
 */
async function ajouterPosteSupabase(valeurs, { devisOrigineId = null } = {}) {
  const essayer = (lien) => uneRequeteDePosteALaFois('L’ajout à votre base de postes', (signal) => avecSignal(
    supabase.from('base_postes')
      .insert(posteVersBase(valeurs, { creation: true, proId: currentUserId, devisOrigineId: lien }))
      .select(COLONNES_POSTE)
      .single(), signal));
  let { data, error } = await essayer(devisOrigineId);
  if (error && devisOrigineId && lienOrigineRefuse(error)) ({ data, error } = await essayer(null));
  if (error) throw error;
  return rowToPoste(data);
}

/**
 * MODIFIER UN POSTE — sa phrase (depuis la page) ou son prix de référence,
 * SOUS CONDITION : `modifieLe` est la date LUE. Zéro ligne touchée →
 * `ErreurPoste` (« modifié entre-temps ») : l'écran relit la base.
 */
async function modifierPosteSupabase(id, changements, { modifieLe } = {}) {
  exigerDateLue(modifieLe);
  const patch = posteVersBase(changements);
  const { data, error } = await uneRequeteDePosteALaFois('La modification de ce poste', (signal) => avecSignal(
    supabase.from('base_postes')
      .update(patch)
      .eq('id', id)
      .eq('modifie_le', modifieLe)
      .select(COLONNES_POSTE), signal));
  if (error) throw error;
  return rowToPoste(unPosteTouche(data));
}

/** RETIRER UN POSTE, sous la même condition. Ce qui concerne un tiers
 *  s'anonymise ; ici rien n'engage personne d'autre — c'est SA phrase et SON
 *  prix —, donc le poste part vraiment. */
async function retirerPosteSupabase(id, { modifieLe } = {}) {
  exigerDateLue(modifieLe);
  const { data, error } = await uneRequeteDePosteALaFois('Le retrait de ce poste', (signal) => avecSignal(
    supabase.from('base_postes')
      .delete()
      .eq('id', id)
      .eq('modifie_le', modifieLe)
      .select('id'), signal));
  if (error) throw error;
  return { id: unPosteTouche(data).id };
}

/* LA DÉMONSTRATION : la base de postes en mémoire (`creerBaseDevisDemo`),
   qui REÇOIT ce que l'application envoie (`posteVersBase`, les noms de la
   base) et refuse avec les mots de la base. Chaque requête y prend une
   pause NOMMÉE, passée par les quatre fonctions : un script l'allonge pour
   voir « Lecture impossible » et « Pas enregistré » (au-delà des 8 s), et
   la course de « ce poste existe déjà » (5 s, sous le délai). Elle n'est
   pas celle des devis : allonger l'une ne doit pas changer l'autre. */
const PAUSE_POSTES_DEMO = 250;

async function mesPostesDemo() {
  const { postes, compte } = await uneRequeteDePosteALaFois('La lecture de votre base de postes',
    (signal) => baseDevisDeDemo().lirePostes(moiEnDemo(), { signal, pauseMs: PAUSE_POSTES_DEMO }));
  return { postes, incomplete: compte > postes.length, total: Number.isSafeInteger(compte) ? compte : null };
}
async function ajouterPosteDemo(valeurs, { devisOrigineId = null } = {}) {
  const essayer = (lien) => uneRequeteDePosteALaFois('L’ajout à votre base de postes',
    (signal) => baseDevisDeDemo().ajouterUnPoste(moiEnDemo(),
      posteVersBase(valeurs, { creation: true, proId: moiEnDemo(), devisOrigineId: lien }),
      { signal, pauseMs: PAUSE_POSTES_DEMO }));
  try {
    return await essayer(devisOrigineId);
  } catch (e) {
    if (devisOrigineId && lienOrigineRefuse(e)) return essayer(null);
    throw e;
  }
}
async function modifierPosteDemo(id, changements, { modifieLe } = {}) {
  exigerDateLue(modifieLe);
  const patch = posteVersBase(changements);
  return unPosteTouche(await uneRequeteDePosteALaFois('La modification de ce poste',
    (signal) => baseDevisDeDemo().modifierUnPoste(moiEnDemo(), id, patch, { modifieLe, signal, pauseMs: PAUSE_POSTES_DEMO })));
}
async function retirerPosteDemo(id, { modifieLe } = {}) {
  exigerDateLue(modifieLe);
  return { id: unPosteTouche(await uneRequeteDePosteALaFois('Le retrait de ce poste',
    (signal) => baseDevisDeDemo().retirerUnPoste(moiEnDemo(), id, { modifieLe, signal, pauseMs: PAUSE_POSTES_DEMO }))).id };
}

export const mesPostes = hasSupabase ? mesPostesSupabase : mesPostesDemo;
export const ajouterPoste = hasSupabase ? ajouterPosteSupabase : ajouterPosteDemo;
export const modifierPoste = hasSupabase ? modifierPosteSupabase : modifierPosteDemo;
export const retirerPoste = hasSupabase ? retirerPosteSupabase : retirerPosteDemo;

export const markNotificationRead = !hasSupabase ? noop : async (id) => {
  await supabase.from('notifications').update({ lue: true }).eq('id', id);
};

/**
 * Tout marquer comme lu.
 *
 * POURQUOI CETTE FONCTION
 * -----------------------
 * Le point orange de la cloche ne tombait qu'en ouvrant les notifications
 * UNE PAR UNE. Après une semaine d'absence, il fallait toucher vingt
 * lignes pour faire disparaître une pastille — alors qu'on voulait juste
 * dire « j'ai vu ». La plupart des gens renoncent, et la pastille ne veut
 * plus rien dire du tout : c'est ainsi qu'une notification cesse d'être
 * lue.
 *
 * `.eq('lue', false)` n'est pas une coquetterie : sans lui, la requête
 * récrit TOUTES les lignes à chaque appel, y compris les centaines déjà
 * lues. La règle RLS limite déjà cela à ses propres notifications.
 */
export const marquerToutesNotificationsLues = !hasSupabase ? noop : async () => {
  const { error } = await supabase.from('notifications')
    .update({ lue: true })
    .eq('user_id', currentUserId)
    .eq('lue', false);
  if (error) throw error;
};

/**
 * Enregistre un avis. `client_verifie` n'est PAS envoyé par l'app :
 * c'est un trigger Postgres qui le calcule à partir des devis / demandes
 * de rappel réellement acceptés (voir supabase/schema.sql).
 */
export const createReview = !hasSupabase ? noop : async ({ proId, delais, qualite, tarif, commentaire }) => {
  const { data, error } = await supabase.from('reviews')
    .insert({ professional_id: proId, author_id: currentUserId, delais, qualite, tarif, commentaire })
    .select().single();
  if (error) throw error;
  return data;
};

export const createQuoteRequest = !hasSupabase ? noop : async ({
  proId, metier, description, ville, budget, nom, telephone,
}) => {
  const { error } = await supabase.from('quote_requests').insert({
    client_id: currentUserId, professional_id: proId,
    metier, description, ville, budget, nom, telephone,
  });
  if (error) throw error;
};

/** Mémoriser les coordonnées saisies dans un formulaire, pour la fois d'après. */
export const enregistrerCoordonnees = !hasSupabase ? noop : async ({ nom, telephone, ville }) => {
  const patch = {};
  if (nom) patch.nom = nom;
  if (telephone) patch.telephone = telephone;
  if (ville) patch.ville = ville;
  if (!Object.keys(patch).length) return;
  const { error } = await supabase.from('users').update(patch).eq('id', currentUserId);
  if (error) throw error;
};

export const createCallbackRequest = !hasSupabase ? noop : async ({ proId, nom, telephone, creneau }) => {
  const { error } = await supabase.from('callback_requests')
    .insert({ client_id: currentUserId, professional_id: proId, nom, telephone, creneau });
  if (error) throw error;
};

/**
 * Dépose une demande de modification des métiers.
 *
 * Un profil vérifié a ses métiers figés — c'est ce qui donne sa valeur au
 * badge. Pour en changer, l'artisan explique pourquoi, et c'est un humain
 * qui tranche depuis Supabase. La base n'accepte qu'UNE demande en attente
 * par artisan : sans cela on reçoit quinze demandes contradictoires.
 */
export const demanderChangementMetiers = !hasSupabase ? noop
  : async ({ metiersActuels = [], metiersVoulus, motif }) => {
    const { data, error } = await supabase.from('metier_demandes').insert({
      professional_id: currentUserId,
      metiers_actuels: metiersActuels,
      metiers_voulus: metiersVoulus,
      motif: motif || null,
    }).select().single();
    if (error) throw error;
    return data;
  };

/** La demande en attente de l'artisan connecté, s'il en a une. */
export const chargerDemandeMetiers = !hasSupabase ? async () => null : async () => {
  const { data, error } = await supabase.from('metier_demandes')
    .select('*').eq('professional_id', currentUserId).eq('statut', 'en_attente')
    .maybeSingle();
  if (error) throw error;
  return data || null;
};

/** Enregistre les modifications du profil (pro ou particulier). */
export const updateProfile = !hasSupabase ? noop : async ({ userType, profil }) => {
  if (userType === 'pro') {
    const { error } = await supabase.from('professional_profiles').update({
      entreprise: profil.entreprise,
      metier: profil.metier,
      /* Sur un profil vérifié, la base refuse tout changement de métiers.
         L'écran n'en propose d'ailleurs pas : envoyer la liste inchangée ne
         déclenche rien. */
      metiers: profil.metiers && profil.metiers.length ? profil.metiers : undefined,
      ville: profil.ville,
      bio: profil.bio,
      /* `siret` n'est plus envoyé (section 45) : la base le fige de toute
         façon quand c'est son titulaire qui écrit. Le SIRET se RATTACHE,
         par « Mon entreprise », avec son propre bouton. */
      experience_annees: profil.exp,
      avatar_url: profil.avatarUrl,
      banner_url: profil.bannerUrl,
      code_postal: profil.codePostal || null,
      code_insee: profil.codeInsee || null,
      latitude: profil.latitude || null,
      longitude: profil.longitude || null,
      /* Le téléphone d'un artisan est PUBLIC : il est sur sa fiche pour
         qu'on l'appelle. Vide, il redevient null et ne s'affiche plus. */
      telephone: profil.telephone || null,
      email_pro: profil.emailPro || null,
      zone_km: profil.zoneKm || null,
      specialites: profil.specialites || [],
      horaires: profil.horaires || null,
    }).eq('id', currentUserId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('users').update({
      nom: profil.nom,
      ville: profil.ville,
      telephone: profil.telephone || null,
      avatar_url: profil.avatarUrl,
      code_postal: profil.codePostal || null,
      latitude: profil.latitude || null,
      longitude: profil.longitude || null,
    }).eq('id', currentUserId);
    if (error) throw error;
  }
};

/**
 * Disponibilité aux urgences d'un artisan : `{ metierKey | null, actif,
 * rayonKm, delaiMinutes }`.
 *
 * PLUS AUCUN TARIF ICI (section 47, lot T). Les trois colonnes
 * `deplacement`, `horaire`, `majoration` de `sos_availability` sont MORTES :
 * la base REFUSE toute valeur non nulle (OP012), et les tarifs se règlent
 * dans « Mon entreprise » (`tarifs_pro`). Et plus d'`updated_at` venu de
 * l'horloge du téléphone : une date que le client écrit ne prouve rien.
 * Depuis le lot T, PERSONNE ne tient plus cette colonne — elle garde la date
 * de création de la ligne, ou celle qu'une version plus ancienne a envoyée,
 * et la base le dit dans son commentaire de colonne (section 47.7). Un seul
 * lecteur, et il ne tourne qu'une fois : le rattrapage de la section 47.2,
 * qui s'en sert pour départager deux lignes d'un même artisan.
 *
 * DEUX TEMPS :
 *   1. si un métier d'urgence est sur la fiche, sa ligne est écrite ;
 *   2. TOUJOURS, les AUTRES lignes encore actives sont éteintes. Opus ne
 *      gère qu'un métier d'urgence à la fois, et une ligne restée active
 *      sur un métier qui n'est plus sur la fiche (« orpheline ») ne pouvait
 *      plus être éteinte par l'application — c'était le cas, sur la vraie
 *      base, de la ligne « Électricité » du propriétaire. `metierKey: null`
 *      les éteint toutes. L'écran le DIT avant l'enregistrement.
 */
export const updateSosAvailability = !hasSupabase ? noop : async (sos) => {
  if (!sos) return;
  if (sos.metierKey) {
    const { error } = await supabase.from('sos_availability').upsert({
      professional_id: currentUserId,
      metier_key: sos.metierKey,
      actif: sos.actif === true,
      rayon_km: sos.rayonKm,
      delai_minutes: sos.delaiMinutes,
    }, { onConflict: 'professional_id,metier_key' });
    if (error) throw error;
  }
  let autres = supabase.from('sos_availability').update({ actif: false })
    .eq('professional_id', currentUserId).eq('actif', true);
  if (sos.metierKey) autres = autres.neq('metier_key', sos.metierKey);
  const { error: refus } = await autres;
  if (refus) throw refus;
};

/** Publication d'une demande par un particulier. */
export const createDemande = !hasSupabase ? noop : async (
  {
    metier, ville, texte, media, medias = [], codePostal, latitude, longitude,
    budget = null, urgence = 'quand_possible',
  },
) => {
  const { data, error } = await supabase.from('demandes').insert({
    client_id: currentUserId,
    metier, ville, texte, media: media || null, medias,
    code_postal: codePostal || null,
    latitude: latitude || null,
    longitude: longitude || null,
    budget, urgence,
  }).select().single();
  if (error) throw error;
  return data;
};

/**
 * Un professionnel répond à une demande — `{ nouvelle }` dit si une réponse
 * vient d'être COMPTÉE.
 *
 * Une INSERTION, plus un `upsert` (lot S-b, 26/10/2026) : répondre une
 * seconde fois ne crée rien, et la base le dit par un 23505 — c'est alors
 * « déjà répondu », pas une erreur, et le compteur ne monte PAS. Tout autre
 * refus est RENDU : une demande fermée, ou d'un particulier avec qui l'on
 * est en blocage (section 13.5 bis). Avant, l'appelant avalait l'erreur et
 * l'écran disait « Vous avez répondu » quand la base avait refusé.
 */
async function repondreADemandeSupabase(demandeId, message) {
  const { error } = await supabase.from('demande_reponses')
    .insert({ demande_id: demandeId, professional_id: currentUserId, message: message || null });
  if (!error) return { nouvelle: true };
  if (error.code === '23505') return { nouvelle: false };
  /* 42501 : la politique « mes reponses » refuse — la demande n'est plus
     ouverte, ou son auteur est en blocage avec l'artisan. On ne dit pas
     lequel (relecture du 26/10) : « plus ouverte » serait faux dans le
     second cas, et apprendrait un blocage. */
  if (error.code === '42501') throw new ErreurDeLaBase('REPONSE_FERMEE', REPONSE_FERMEE);
  throw error;
}
/* La démonstration n'a pas de table : chaque demande ne se compte qu'UNE
   fois par session, comme la base le ferait par sa clé unique. Et elle
   refuse comme la base une demande qui n'est plus ouverte, ou dont
   l'auteur est en blocage. */
const REPONSES_DEMANDES_DEMO = new Set();
async function repondreADemandeDemo(demandeId) {
  const cle = String(demandeId);
  const d = initialDemandes.find((x) => String(x.id) === cle);
  if (d && ((d.statut && d.statut !== 'ouverte') || d.fermeeApresChargement
    || demoBlocages.has(String(d.auteurId)))) {
    throw new ErreurDeLaBase('REPONSE_FERMEE', REPONSE_FERMEE);
  }
  if (REPONSES_DEMANDES_DEMO.has(cle)) return { nouvelle: false };
  REPONSES_DEMANDES_DEMO.add(cle);
  return { nouvelle: true };
}
export const repondreADemande = hasSupabase ? repondreADemandeSupabase : repondreADemandeDemo;

/* ------------------------------------------------------------------ */
/*  La Place des pros                                                  */
/* ------------------------------------------------------------------ */

/**
 * Les annonces entre professionnels, la plus récente en tête.
 *
 * La lecture est déjà réservée aux comptes pro par une règle RLS : un
 * particulier qui bricolerait l'application ne recevrait rien, et c'est
 * volontaire — les prix entre artisans ne sont pas les prix au particulier.
 */
export const chargerAnnonces = !hasSupabase ? async () => (
  /* En démo, les annonces viennent du jeu d'essai, et leur auteur est
     recomposé depuis les profils de démonstration : l'écran reçoit
     exactement la même forme que depuis Supabase. */
  initialAnnonces.map((a) => {
    const p = demoPros[a.auteurId] || null;
    return {
      ...a,
      medias: a.medias || (a.media ? [a.media] : []),
      aMoi: false,
      jyAiRepondu: false,
      auteur: p ? {
        id: p.id,
        entreprise: p.entreprise,
        metier: p.metier,
        metiers: p.metiers || [p.metier],
        ville: p.ville,
        verifie: !!p.verifie,
        avatarUrl: p.avatarUrl || null,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
      } : null,
    };
  })
) : async () => {
  const { data, error } = await supabase
    .from('annonces_pro')
    .select('*, auteur:professional_profiles(id, entreprise, metier, metiers, ville, verifie, avatar_url, latitude, longitude)')
    .eq('statut', 'ouverte')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  const ids = (data || []).map((a) => a.id);
  /* Qui a déjà répondu à quoi : c'est ce qui permet d'afficher « vous avez
     déjà répondu » plutôt que de laisser l'artisan se répéter. */
  const { data: miennes } = ids.length
    ? await supabase.from('annonce_reponses')
        .select('annonce_id').eq('professional_id', currentUserId).in('annonce_id', ids)
    : { data: [] };
  const dejaRepondu = new Set((miennes || []).map((r) => r.annonce_id));

  /* LE NOMBRE DE RÉPONSES VIENT DE L'ANNONCE, plus d'un comptage des
     lignes. Deux raisons, et la première n'est pas la performance :
     depuis la section 29, une réponse ne se lit qu'entre les deux
     personnes concernées — un comptage côté appelant rendrait donc 0 pour
     tout le monde sauf l'auteur. `nb_reponses` est tenu par un
     déclencheur, comme les « j'aime ».
     Au passage, c'est une requête de moins au chargement de l'écran. */

  return (data || []).map((a) => ({
    id: a.id,
    type: a.type,
    titre: a.titre,
    texte: a.texte,
    metier: a.metier,
    ville: a.ville,
    latitude: a.latitude,
    longitude: a.longitude,
    dateDebut: a.date_debut,
    dateFin: a.date_fin,
    prix: a.prix === null ? null : Number(a.prix),
    unite: a.unite,
    medias: a.medias || [],
    time: relativeTime(a.created_at),
    auteurId: a.auteur_id,
    auteur: a.auteur ? {
      id: a.auteur.id,
      entreprise: a.auteur.entreprise,
      metier: a.auteur.metier,
      metiers: a.auteur.metiers || [],
      ville: a.auteur.ville,
      verifie: !!a.auteur.verifie,
      avatarUrl: a.auteur.avatar_url,
      latitude: a.auteur.latitude,
      longitude: a.auteur.longitude,
    } : null,
    reponses: a.nb_reponses || 0,
    jyAiRepondu: dejaRepondu.has(a.id),
    aMoi: a.auteur_id === currentUserId,
  }));
};

export const publierAnnonce = !hasSupabase ? noop : async ({
  type, titre, texte, metier = null, ville = null, codePostal = null,
  latitude = null, longitude = null, dateDebut = null, dateFin = null,
  prix = null, unite = 'total', medias = [],
}) => {
  const { data, error } = await supabase.from('annonces_pro').insert({
    auteur_id: currentUserId,
    type, titre, texte, metier, ville,
    code_postal: codePostal,
    latitude, longitude,
    date_debut: dateDebut, date_fin: dateFin,
    prix, unite, medias,
  }).select().single();
  if (error) throw error;
  return data;
};

/** Répondre à une annonce. `upsert` : répondre deux fois ne crée pas deux lignes. */
export const repondreAnnonce = !hasSupabase ? noop : async (annonceId, message) => {
  const { error } = await supabase.from('annonce_reponses').upsert(
    { annonce_id: annonceId, professional_id: currentUserId, message: message || null },
    { onConflict: 'annonce_id,professional_id' },
  );
  if (error) throw error;
};

/**
 * QUI A RÉPONDU À MON ANNONCE, ET CE QU'IL A DIT.
 *
 * C'est le trou que cette section bouche. Jusqu'au 04/10/2026, l'auteur
 * d'une annonce voyait « 3 réponses » et rien d'autre : pas de nom, pas de
 * message, et appuyer dessus ne faisait rien. Un `insert` sans `select`
 * quelque part — exactement le défaut des demandes de devis du 01/10.
 *
 * Aucun contrôle d'accès ICI, et c'est VOULU : c'est la politique de la
 * section 29.2 qui tient la règle. Une vérification écrite dans
 * l'application ne protégerait personne, puisqu'un client modifié
 * l'enlèverait. Si `annonceId` n'est pas la mienne, la base rend une liste
 * vide — pas une erreur, parce qu'il n'y a rien de secret dans le fait
 * qu'une annonce existe.
 */
/* En démonstration, les réponses viennent du jeu d'essai, avec la même
   forme que celle que rend la vraie base : la feuille ne sait pas d'où elles
   viennent. Une annonce sans réponse rend une liste vide, comme en base. */
async function reponsesAnnonceDemo(annonceId) {
  return (initialReponsesAnnonces[annonceId] || []).map((r) => {
    const p = demoPros[r.proId];
    return {
      id: r.id,
      message: r.message,
      time: r.time,
      proId: r.proId,
      auteur: p ? {
        id: p.id,
        entreprise: p.entreprise,
        metier: p.metier,
        metiers: p.metiers || [p.metier],
        ville: p.ville,
        verifie: !!p.verifie,
        avatarUrl: null,
      } : null,
    };
  });
}

async function reponsesAnnonceSupabase(annonceId) {
  if (!annonceId) return [];
  const { data, error } = await supabase
    .from('annonce_reponses')
    .select('id, message, created_at, professional_id, '
      + 'auteur:professional_profiles(id, entreprise, metier, metiers, ville, verifie, avatar_url)')
    .eq('annonce_id', annonceId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((r) => ({
    id: r.id,
    message: r.message || '',
    time: relativeTime(r.created_at),
    proId: r.professional_id,
    auteur: r.auteur ? {
      id: r.auteur.id,
      entreprise: r.auteur.entreprise,
      metier: r.auteur.metier,
      metiers: r.auteur.metiers || [],
      ville: r.auteur.ville,
      verifie: !!r.auteur.verifie,
      avatarUrl: r.auteur.avatar_url,
    } : null,
  }));
}

export const reponsesAnnonce = hasSupabase ? reponsesAnnonceSupabase : reponsesAnnonceDemo;

/** Retirer son annonce : elle est pourvue, ou elle n'a plus lieu d'être. */
export const fermerAnnonce = !hasSupabase ? noop : async (annonceId, statut = 'pourvue') => {
  const { error } = await supabase.from('annonces_pro')
    .update({ statut }).eq('id', annonceId).eq('auteur_id', currentUserId);
  if (error) throw error;
};

/** Les demandes de particuliers auxquelles j'ai déjà répondu. */
export const mesReponsesDemandes = !hasSupabase ? async () => [] : async () => {
  const { data, error } = await supabase.from('demande_reponses')
    .select('demande_id').eq('professional_id', currentUserId);
  if (error) throw error;
  return (data || []).map((r) => r.demande_id);
};

/**
 * Les artisans disponibles autour d'une urgence — `{ artisans, nonAffichables }`.
 *
 * Le tri par distance, le rayon d'intervention, le métier sur la fiche et
 * les tarifs AFFICHÉS et complets sont tenus par la base
 * (`artisans_urgence()`, section 47), pas par le téléphone.
 *
 * LES TARIFS ARRIVENT EN EUROS (la signature de la fonction ne peut pas
 * changer) : `depuisLaRecherche` les relit en centimes, jamais par
 * `x * 100`. Une ligne illisible n'est PAS jetée en silence : elle est
 * COMPTÉE, et l'écran dit combien d'artisans disponibles n'ont pas pu
 * s'afficher. Si AUCUNE ne l'est, c'est une erreur, pas « aucun
 * artisan » : un particulier en urgence ne doit pas croire qu'il n'y a
 * personne quand il y a quelqu'un.
 *
 * UNE SECONDE LECTURE, sur les seuls artisans rendus : le prix du devis, le
 * décompte du temps et les conditions de déplacement, que la signature
 * figée d'`artisans_urgence` ne peut pas transporter. Ce qu'un particulier
 * doit savoir AVANT de choisir. Filtrée par « tarifs affiches », avec
 * `.eq('affiche', true)` écrit en plus. En échec, l'estimation reste, et la
 * carte dit que ces compléments n'ont pas pu être lus (`complements`).
 */
export const chercherArtisansUrgence = !hasSupabase ? noop : async (
  { metierKey, latitude, longitude },
) => {
  const { data, error } = await supabase.rpc('artisans_urgence', {
    p_metier_key: metierKey,
    p_lat: latitude,
    p_lon: longitude,
  });
  if (error) throw error;
  const lignes = data || [];
  let nonAffichables = 0;
  const lues = [];
  lignes.forEach((a) => {
    const tarifs = depuisLaRecherche(a);
    if (tarifs) lues.push({ a, tarifs });
    else nonAffichables += 1;
  });
  if (lignes.length > 0 && lues.length === 0) {
    /* Minuscule en tête : l'écran la préfixe de « La recherche d'artisans : ». */
    throw new Error('des artisans sont disponibles, mais leurs tarifs n’ont pas pu être lus. '
      + 'Réessayez dans un instant.');
  }

  const complementsDe = {};
  let complementsLus = lues.length === 0;
  if (lues.length > 0) {
    const { data: comp, error: refus } = await supabase.from('tarifs_pro')
      .select('pro_id, frais_deplacement_texte, decompte_temps_texte, prix_devis_centimes')
      .in('pro_id', lues.map(({ a }) => a.professional_id))
      .eq('affiche', true);
    if (!refus) {
      complementsLus = true;
      (comp || []).forEach((c) => { complementsDe[c.pro_id] = c; });
    }
  }

  const artisans = lues.map(({ a, tarifs }) => {
    const c = complementsDe[a.professional_id] || null;
    return {
      proId: a.professional_id,
      metierKey,
      /* CE QUE LA RECHERCHE REND DE LA FICHE : un artisan inscrit (ou
         devenu disponible) APRÈS le démarrage de l'application du
         particulier n'est pas dans `pros`. Sans ceci, sa carte ne pouvait
         pas s'afficher, et « Réessayer » relançait une recherche qui
         rendait le même artisan, toujours inconnu (relecture application
         du 19/10/2026). */
      fiche: {
        entreprise: a.entreprise || null,
        ville: a.ville || null,
        avatarUrl: a.avatar_url || null,
        verifie: a.verifie === true,
      },
      tarifs: {
        ...tarifs,
        frais_deplacement_texte: c ? c.frais_deplacement_texte : null,
        decompte_temps_texte: c ? c.decompte_temps_texte : null,
        prix_devis_centimes: c ? c.prix_devis_centimes : null,
      },
      /* « non lus » aussi pour un artisan absent de la seconde lecture (il
         vient d'éteindre ses tarifs entre les deux) : on ne sait pas, donc
         on ne dit pas « rien de déclaré ». */
      complements: complementsLus && c ? 'ok' : 'echec',
      delaiMin: a.delai_minutes,
      distanceKm: a.distance,
    };
  });
  return { artisans, nonAffichables };
};

/**
 * Enregistre la demande d'urgence envoyée à un artisan.
 *
 * LE NOM ET LE TÉLÉPHONE PARTENT AVEC, et c'est un choix, pas un oubli
 * corrigé : une urgence sans numéro ne sert à rien — l'artisan ne peut ni
 * confirmer, ni demander le code de l'immeuble, ni dire qu'il arrive dans
 * vingt minutes.
 *
 * Ce n'est PAS une brèche dans la fermeture de `users.telephone` du
 * 29/09 : le numéro ne part qu'à l'artisan que le client vient de choisir,
 * pour cette intervention-là, et l'écran du SOS l'écrit noir sur blanc
 * juste au-dessus du bouton. Un numéro transmis en le sachant n'est pas un
 * numéro divulgué.
 */
/* LA DÉMONSTRATION REFUSE COMME LA BASE (seconde relecture du 27/10) :
   OP025 vers un artisan dont la ligne d'urgence n'est pas active pour ce
   métier — et le chauffagiste de démonstration coupe la sienne juste après
   la recherche (`envoiSosDemo`, `urgences.js`, que `verifier-demandes` fait
   tourner). */
const SOS_RETIRES_DEMO = new Set();
export function sosArtisansDemo() {
  return sosDisponiblesDemo(SOS_ARTISANS, SOS_RETIRES_DEMO);
}
async function createSosRequestDemo(d) {
  if (envoiSosDemo(SOS_ARTISANS, SOS_RETIRES_DEMO, d.proId, d.metierKey) === 'OP025') {
    throw new ErreurDeLaBase('OP025', REFUS_DEMANDES.OP025);
  }
  return null;
}
export const createSosRequest = !hasSupabase ? createSosRequestDemo : async (d) => {
  const { data, error } = await supabase.from('sos_requests').insert({
    client_id: currentUserId,
    professional_id: d.proId,
    nom: d.nom || null,
    telephone: d.telephone || null,
    metier_key: d.metierKey,
    probleme_key: d.problemeKey,
    probleme_label: d.probleme,
    adresse: d.adresse || null,
    details: d.details || null,
    creneau: d.creneau || 'immediat',
    code_postal: d.codePostal || null,
    latitude: d.latitude || null,
    longitude: d.longitude || null,
    prix_min: d.prixMin,
    prix_max: d.prixMax,
  }).select().single();
  if (error) throw error;
  return data;
};

/**
 * Proposer un partenariat. Une seule ligne, en attente : c'est l'autre qui
 * décidera. Les règles de la base refusent tout le reste — on ne peut pas
 * s'inscrire d'office chez un confrère.
 */
/* LA DÉMONSTRATION REFUSE COMME LA BASE (lot S-b) : sous un blocage, on ne
   propose ni n'accepte un partenariat (OP020, ses mots exacts). Sans cela,
   le mécanisme ne s'essaierait nulle part sans fichier `.env`. */
export const demanderPartenariat = !hasSupabase
  ? async (partnerId) => {
    if (demoBlocages.has(String(partnerId))) {
      throw new ErreurDeLaBase('OP020', REFUS_DEMANDES.OP020_proposer);
    }
    return null;
  }
  : async (partnerId) => {
    const { error } = await supabase.from('professional_partners').insert({
      professional_id: currentUserId, partner_id: partnerId, statut: 'en_attente',
    });
    if (error) throw error;
  };

/**
 * Répondre à une demande reçue. Seul le destinataire y parvient.
 *
 * `.select('statut')` (lot S-b) : la base ne laisse plus répondre qu'à une
 * demande EN ATTENTE, et une mise à jour que la politique écarte touche
 * ZÉRO ligne, sans erreur — l'écran aurait dit « Partenariat accepté » pour
 * une demande refusée depuis un autre appareil. `repondu_le` part encore
 * (une version plus ancienne de la base l'attendait) ; la base pose la
 * sienne.
 */
export const repondrePartenariat = !hasSupabase
  ? async (demandeurId, accepte) => {
    if (accepte && demoBlocages.has(String(demandeurId))) {
      throw new ErreurDeLaBase('OP020', REFUS_DEMANDES.OP020_accepter);
    }
    return null;
  }
  : async (demandeurId, accepte) => {
    const { data, error } = await supabase.from('professional_partners')
      .update({ statut: accepte ? 'accepte' : 'refuse', repondu_le: new Date().toISOString() })
      .eq('professional_id', demandeurId).eq('partner_id', currentUserId)
      .select('statut');
    if (error) throw error;
    if (!data || !data.length) {
      throw new ErreurDeLaBase('OP019', 'Cette demande de partenariat n’est plus en attente : elle a '
        + 'peut-être été annulée, ou déjà traitée depuis un autre appareil.');
    }
  };

/** Annuler une demande envoyée, ou rompre un partenariat. */
export const retirerPartenariat = !hasSupabase ? noop : async (autreId) => {
  const { error } = await supabase.from('professional_partners').delete()
    .or(`and(professional_id.eq.${currentUserId},partner_id.eq.${autreId}),`
      + `and(professional_id.eq.${autreId},partner_id.eq.${currentUserId})`);
  if (error) throw error;
};

/* ------------------------------------------------------------------ */
/*  Modération : signaler, bloquer                                     */
/*                                                                     */
/*  En mode démo, ces fonctions gardent leur effet EN MÉMOIRE au lieu   */
/*  de ne rien faire. C'est volontaire : ce sont des écrans qu'il faut  */
/*  pouvoir essayer sans base, et un bouton « Bloquer » qui ne bloque   */
/*  rien ne se teste pas.                                              */
/* ------------------------------------------------------------------ */

const demoBlocages = new Set();
const demoSignalements = [];

/**
 * Signaler un contenu.
 *
 * On recopie l'auteur et un extrait AU MOMENT du signalement : le contenu
 * peut disparaître ensuite (son auteur l'efface, justement), et un
 * signalement qui ne dit plus ce qui a été signalé est inexploitable.
 */
export const signaler = !hasSupabase
  ? async (s) => { demoSignalements.push({ ...s, id: `demo-${Date.now()}` }); return true; }
  : async ({ cibleType, cibleId, cibleAuteurId = null, extrait = null, motif, details = null }) => {
    const { error } = await supabase.from('signalements').insert({
      auteur_id: currentUserId,
      cible_type: cibleType,
      cible_id: cibleId,
      cible_auteur_id: cibleAuteurId,
      extrait: extrait ? String(extrait).slice(0, 500) : null,
      motif,
      details: details ? String(details).slice(0, 1000) : null,
      statut: 'nouveau',
    });
    /* 23505 = la clé unique (auteur, type, cible). On a déjà signalé ce
       contenu : ce n'est pas une erreur, c'est une bonne nouvelle. */
    if (error && error.code !== '23505') throw error;
    return true;
  };

/** Les signalements que J'AI déposés. Personne d'autre ne les voit. */
export const mesSignalements = !hasSupabase
  ? async () => demoSignalements
  : async () => {
    const { data, error } = await supabase.from('signalements')
      .select('id, cible_type, motif, statut, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

/* ------------------------------------------------------------------ */
/*  Ce que mon agent a fait — le journal d'audit de l'IA (section 38)  */
/* ------------------------------------------------------------------ */

/**
 * Combien de lignes on charge.
 *
 * Il en faut une BORNE, comme le fil, la Place des pros et les demandes :
 * un artisan qui se sert de l'agent tous les jours en aura des milliers.
 * Et la troncature SE DIT à l'écran — une liste coupée en silence est la
 * règle des « 3 annonces sans lieu précisé ne sont pas affichées ».
 */
export const TAILLE_JOURNAL_IA = 50;

/**
 * Le journal de démonstration — et il doit faire VIVRE le mécanisme.
 *
 * Sans lui, l'écran serait vide pour qui lance Opus sans fichier `.env`, et
 * surtout : **rien ne s'y vérifierait ici**. C'est la leçon des badges
 * « Nouveau » du 04/10 — des dates CALCULÉES, pas figées dans le fichier,
 * sinon elles sont justes le premier jour et fausses ensuite.
 *
 * Les quatre lignes sont choisies pour montrer les quatre cas qui existent :
 * une action courante, un refus par la limite, une erreur, et **une action
 * que `journal-ia.js` ne connaît pas** — celle qui prouve qu'une version en
 * retard rend quand même compte de ce qui s'est passé.
 */
function journalIADemo() {
  const ilYA = (heures) => new Date(Date.now() - heures * 3600 * 1000).toISOString();
  return [
    { id: 'demo-ia-1', action: 'ameliorer', cible_type: 'publication', cible_id: null,
      jetons_entree: 412, jetons_sortie: 260, resultat: 'ok', created_at: ilYA(2) },
    { id: 'demo-ia-2', action: 'match', cible_type: null, cible_id: null,
      jetons_entree: 1180, jetons_sortie: 190, resultat: 'ok', created_at: ilYA(5) },
    { id: 'demo-ia-3', action: 'summary', cible_type: 'pro', cible_id: 'demo-pro',
      jetons_entree: 0, jetons_sortie: 0, resultat: 'refuse', created_at: ilYA(26) },
    { id: 'demo-ia-4', action: 'devis', cible_type: 'chantier', cible_id: 'demo-chantier',
      jetons_entree: 0, jetons_sortie: 0, resultat: 'erreur', created_at: ilYA(50) },
  ];
}

/**
 * Les actions de MON agent. Celles de personne d'autre.
 *
 * La politique de lecture de `journal_ia` dit `user_id = auth.uid()`, et
 * c'est tout ce qu'elle dit : il n'y a donc pas de filtre à écrire ici, et
 * surtout aucun à OUBLIER d'écrire. On trie par date, et on borne.
 */
export const mesActionsIA = !hasSupabase
  ? async () => journalIADemo().map((l) => ({ ...l, time: relativeTime(l.created_at) }))
  : async () => {
    const { data, error } = await supabase.from('journal_ia')
      .select('id, action, cible_type, cible_id, jetons_entree, jetons_sortie, resultat, created_at')
      .order('created_at', { ascending: false })
      .limit(TAILLE_JOURNAL_IA);
    if (error) throw error;
    /* `relativeTime` comme partout ailleurs : « il y a 2 h » se lit, une
       date ISO non. On garde `created_at` à côté — c'est lui qui se
       compare, et c'est lui qui part dans l'export. */
    return (data || []).map((l) => ({ ...l, time: relativeTime(l.created_at) }));
  };

/**
 * Bloquer quelqu'un. Le masquage est SYMÉTRIQUE et tenu par la base : ce
 * n'est pas l'écran qui cache, ce sont les règles RLS qui refusent.
 */
export const bloquer = !hasSupabase
  ? async (userId) => { demoBlocages.add(String(userId)); return true; }
  : async (userId) => {
    const { error } = await supabase.from('blocages')
      .insert({ bloqueur_id: currentUserId, bloque_id: userId });
    if (error && error.code !== '23505') throw error;
    return true;
  };

export const debloquer = !hasSupabase
  ? async (userId) => { demoBlocages.delete(String(userId)); return true; }
  : async (userId) => {
    const { error } = await supabase.from('blocages').delete()
      .eq('bloqueur_id', currentUserId).eq('bloque_id', userId);
    if (error) throw error;
    return true;
  };

/**
 * Les personnes que j'ai bloquées, avec de quoi les reconnaître.
 *
 * Attention : `users` reste lisible même pour une personne bloquée — c'est
 * volontaire. Masquer jusqu'à la fiche rendrait cette liste illisible, avec
 * des lignes vides à la place des noms, et on ne saurait plus qui
 * débloquer.
 */
export const chargerBlocages = !hasSupabase
  ? async () => [...demoBlocages].map((id) => ({ id, nom: 'Compte de démonstration' }))
  : async () => {
    const { data, error } = await supabase.from('blocages')
      .select('bloque_id, created_at, users:bloque_id (id, nom, avatar_url)')
      .eq('bloqueur_id', currentUserId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((b) => ({
      id: b.bloque_id,
      nom: (b.users && b.users.nom) || 'Compte supprimé',
      avatarUrl: b.users ? b.users.avatar_url : null,
      depuis: b.created_at,
    }));
  };

/** Est-ce que j'ai bloqué cette personne ? Sert à l'affichage du bouton. */
export const aiJeBloque = !hasSupabase
  ? async (userId) => demoBlocages.has(String(userId))
  : async (userId) => {
    const { data } = await supabase.from('blocages')
      .select('bloque_id')
      .eq('bloqueur_id', currentUserId).eq('bloque_id', userId)
      .maybeSingle();
    return !!data;
  };

/* ------------------------------------------------------------------ */
/*  Droits sur ses propres données (RGPD)                              */
/* ------------------------------------------------------------------ */

/**
 * Récupérer TOUTES ses données, en JSON.
 *
 * Articles 15 et 20 du RGPD : droit d'accès et droit à la portabilité. Il
 * ne suffit pas de montrer les données à l'écran — il faut les rendre dans
 * un format réutilisable, que la personne puisse emporter ailleurs.
 */
export const exporterMesDonnees = !hasSupabase
  ? async () => ({
    export_du: new Date().toISOString(),
    mode: 'démonstration',
    note: "Sans base de données connectée, il n'y a rien de réel à exporter.",
  })
  : async () => {
    const { data, error } = await supabase.rpc('mes_donnees');
    if (error) throw error;
    return data;
  };

/**
 * Supprimer son compte. En DEUX temps, et c'est nécessaire :
 *
 *   1. `preparer_suppression_compte()` fait le ménage dans les données et
 *      anonymise ce qui concerne des tiers (avis, commentaires) ;
 *   2. la fonction Edge `compte` supprime les fichiers du stockage puis le
 *      compte d'authentification lui-même — `auth.users` appartient à
 *      Supabase et ne se touche qu'avec la clé de service, qui ne doit
 *      JAMAIS se trouver dans l'application.
 *
 * Si la seconde étape échoue, la première a déjà eu lieu : les données sont
 * parties, seul le compte de connexion subsiste. On le dit franchement
 * plutôt que de laisser croire à un échec complet.
 */
export const supprimerMonCompte = !hasSupabase
  ? async () => ({ mode: 'démonstration', supprime: false })
  : async () => {
    const { data: resume, error: erreurDonnees } = await supabase.rpc('preparer_suppression_compte');
    if (erreurDonnees) throw erreurDonnees;

    let reponse = null;
    try {
      const { data, error } = await supabase.functions.invoke('compte', {
        body: { action: 'supprimer' },
      });
      if (error) throw error;
      reponse = data;
    } catch (e) {
      await supabase.auth.signOut();
      currentUserId = null;
      /* Lot S-a (relecture « textes ») : « Vos données ont bien été
         supprimées » était faux — c'est la fonction `compte` qui vide le
         stockage, Kbis et attestation compris, et elle n'a pas tourné. Et
         « écrivez-nous sous 48 heures » visait une adresse qui n'existe
         pas : aucune promesse sur un canal injoignable. */
      const err = new Error(
        'Vos données ont été retirées de la base d’Opus, mais vos fichiers et votre '
        + 'compte de connexion n’ont peut-être pas pu l’être.',
      );
      err.partiel = true;
      err.resume = resume;
      throw err;
    }

    await supabase.auth.signOut();
    currentUserId = null;
    /* La fonction rend, espace par espace, ce qu'elle a retiré et ce qui
       a résisté (`erreur`, y compris une arborescence trop profonde). Un
       ménage incomplet ne doit pas ressembler à un ménage fait : la leçon
       du 04/10, que l'application jetait. */
    const fichiersRestes = ((reponse && reponse.fichiers) || []).some((f) => f && f.erreur);
    return { supprime: true, resume, fichiersRestes };
  };

/**
 * `accepterConditions()` A ÉTÉ RETIRÉE LE 05/10/2026, et c'est volontaire.
 *
 * Elle écrivait `cgu_version` et `cgu_acceptees_le` APRÈS l'inscription,
 * donc jamais quand la confirmation par e-mail était demandée — une trace
 * légale perdue sans que rien ne le dise. L'acceptation est désormais
 * enregistrée par la base, au moment même où le compte naît (section 31 de
 * `schema.sql`), à partir des métadonnées.
 *
 * Elle n'avait plus aucun appelant : une fonction que personne n'appelle
 * est le « bouton §18 » — du code qui a l'air de servir et qui ne fait
 * rien. Le jour où les conditions changeront et qu'il faudra les faire
 * ré-accepter, ce sera un écran et une fonction neufs, pas celle-ci.
 */

/**
 * Supprimer un commentaire.
 *
 * QUI A LE DROIT : SON AUTEUR, ET PERSONNE D'AUTRE.
 * Ce n'est pas l'écran qui le décide — la règle RLS « mes comments » ne
 * laisse passer que `auth.uid() = author_id`. Vérifié sur PostgreSQL :
 * l'auteur de la PUBLICATION lui-même se fait refuser la suppression du
 * commentaire de quelqu'un d'autre. Un client modifié n'y changerait rien.
 *
 * ATTENTION : supprimer un commentaire emporte ses RÉPONSES
 * (`on delete cascade` sur `parent_id`). C'est voulu — une réponse sans la
 * question ne veut plus rien dire — mais l'écran doit le dire avant.
 */
/**
 * Corriger SON texte — le sien seulement, et le texte seulement.
 *
 * La base s'en assure de deux façons : la règle RLS limite aux lignes dont
 * on est l'auteur, et le déclencheur `tient_le_texte()` remet toutes les
 * autres colonnes à leur valeur d'avant (section 20 de schema.sql). Envoyer
 * `likes_count` d'ici ne servirait donc à rien — et c'est exactement le
 * but : l'écran n'a pas à être le gardien.
 */
/**
 * « Cette spécialité n'est pas dans la liste » — on la fait remonter.
 *
 * Elle est DÉJÀ sur la fiche quand cette fonction part : rien n'attend
 * ici, et un échec ne doit donc rien casser. C'est pour cela qu'elle
 * avale ses erreurs au lieu de les lever — l'artisan n'a pas à voir un
 * message rouge parce qu'une table d'administration était indisponible.
 *
 * `ignoreDuplicates` : le même mot proposé cent fois ferait cent lignes,
 * et la file deviendrait illisible au moment précis où elle servirait.
 * L'index unique de la section 22 s'en charge ; ici on évite juste de
 * faire remonter l'erreur de conflit.
 */
export const proposerSpecialite = !hasSupabase ? noop : async (texte, metier) => {
  try {
    await supabase.from('specialites_proposees')
      .upsert({ texte, metier: metier || null, propose_par: currentUserId },
        { onConflict: 'texte,metier', ignoreDuplicates: true });
  } catch (e) {
    /* Silence volontaire : voir le commentaire ci-dessus. */
  }
};

export const modifierCommentaire = !hasSupabase ? noop : async (id, texte) => {
  const { error } = await supabase.from('comments')
    .update({ texte }).eq('id', id).eq('author_id', currentUserId);
  if (error) throw error;
};

export const modifierPost = !hasSupabase ? noop : async (id, texte) => {
  const { error } = await supabase.from('posts')
    .update({ texte }).eq('id', id).eq('author_id', currentUserId);
  if (error) throw error;
};

export const supprimerCommentaire = !hasSupabase ? noop : async (id) => {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
};

/* ------------------------------------------------------------------ */
/*  La messagerie : à la demande, et en temps réel                     */
/* ------------------------------------------------------------------ */

/**
 * Les messages d'UNE conversation, chargés au moment où on l'ouvre.
 *
 * Avant, l'application téléchargeait tous les messages de toutes ses
 * conversations à chaque ouverture — pour n'en afficher qu'un aperçu.
 */
async function messagesDeSupabase(conversationId) {
  const { data, error } = await supabase.from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map((m) => rowToMessage(m, currentUserId));
}

async function messagesDeDemo() { return []; }

export const chargerMessages = hasSupabase ? messagesDeSupabase : messagesDeDemo;

/** Une ligne de `messages` telle que l'écran l'attend. */
function rowToMessage(m, moi) {
  return {
    id: m.id,
    auteurId: m.sender_id,
    from: m.sender_id === moi ? 'moi' : 'pro',
    texte: m.texte,
    heure: relativeTime(m.created_at),
    lu: !!m.lu,
    /* La pièce jointe voyage avec le message : son CHEMIN dans l'espace
       privé, jamais une adresse ouverte. L'écran demande une adresse signée
       au moment où on touche la bulle. */
    piece: m.piece_url
      ? { chemin: m.piece_url, nom: m.piece_nom, taille: m.piece_taille, type: m.piece_type }
      : null,
  };
}

/**
 * Marquer comme lus les messages REÇUS d'une conversation.
 *
 * Renvoie combien ont changé — l'écran s'en sert pour savoir de combien
 * faire baisser le compteur, sans recharger toute la liste.
 */
export const marquerLus = !hasSupabase ? async () => 0 : async (conversationId) => {
  const { data, error } = await supabase.rpc('marquer_lus', { p_conversation: conversationId });
  if (error) throw error;
  return data || 0;
};

/**
 * Écouter ce qui arrive : nouveaux messages, nouvelles notifications.
 *
 * POURQUOI C'EST NÉCESSAIRE
 * Sans cela, un message reçu n'apparaît qu'en refermant et rouvrant
 * l'application. Pour une messagerie, c'est rédhibitoire.
 *
 * LES RÈGLES D'ACCÈS S'APPLIQUENT AUSSI À LA DIFFUSION : chacun ne reçoit
 * que les lignes qu'il aurait le droit de lire. On ne reçoit donc pas les
 * messages des autres, et une conversation avec quelqu'un qu'on a bloqué ne
 * remonte plus.
 *
 * ATTENTION, panne classique : une table absente de la publication
 * `supabase_realtime` ne diffuse rien, et l'abonnement ne renvoie AUCUNE
 * erreur — il se connecte et attend indéfiniment. L'inscription est faite
 * dans supabase/schema.sql, section 15.
 *
 * Renvoie une fonction à appeler pour se désabonner.
 */
export function ecouterMessagerie({ onMessage, onNotification }) {
  if (!hasSupabase || !currentUserId) return () => {};

  const moi = currentUserId;
  const canal = supabase.channel(`opus-${moi}`);

  if (onMessage) {
    canal.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (charge) => {
        const m = charge.new;
        if (!m) return;
        /* Les siens reviennent aussi par ce canal : l'écran les a déjà
           affichés au moment de l'envoi, les rajouter ferait un doublon. */
        if (m.sender_id === moi) return;
        onMessage({ conversationId: m.conversation_id, message: rowToMessage(m, moi) });
      },
    );
  }

  if (onNotification) {
    canal.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${moi}` },
      (charge) => charge.new && onNotification(charge.new),
    );
  }

  canal.subscribe();
  return () => { supabase.removeChannel(canal); };
}

/* ==========================================================================
   LE BACK-OFFICE  (section 25 de `schema.sql`)

   POURQUOI TOUT PASSE PAR DES FONCTIONS DE LA BASE
   ------------------------------------------------
   Aucune de ces écritures n'est une requête ordinaire, et c'est voulu : le
   verrou `tient_le_profil_pro()` remet les colonnes de vérification à leur
   ancienne valeur dès que c'est le professionnel lui-même qui écrit. Un
   `update` depuis l'application ne POURRAIT donc pas poser un badge — et il
   échouerait EN SILENCE, sans la moindre erreur.

   Les six appels ci-dessous sont des `rpc`. La règle reste dans la base,
   là où un client modifié ne l'atteint pas.

   ET POURQUOI `admin_resume()` NE LÈVE PAS D'ERREUR
   -------------------------------------------------
   Elle est appelée par l'écran de profil de TOUT LE MONDE, pour savoir s'il
   doit afficher le bouton. Faire échouer la requête chez chaque utilisateur
   ordinaire remplirait les journaux d'erreurs qui n'en sont pas. Elle rend
   donc `{ admin: false }`, et c'est tout.
   ========================================================================== */

/** Les compteurs du bouton d'entrée. `{ admin: false }` pour tout le monde. */
async function resumeAdminDemo() {
  /* En mode démonstration, personne n'administre : il n'y a pas de base à
     administrer. Afficher le back-office sur des données en mémoire
     donnerait l'illusion d'avoir validé un artisan qui n'existe pas. */
  return { admin: false };
}

async function resumeAdminSupabase() {
  const { data, error } = await supabase.rpc('admin_resume');
  if (error) throw error;
  return data || { admin: false };
}

export const resumeAdmin = hasSupabase ? resumeAdminSupabase : resumeAdminDemo;

/** La file des fiches à contrôler. */
async function fileVerificationsDemo() { return []; }

async function fileVerificationsSupabase() {
  const { data, error } = await supabase.rpc('admin_file_verifications');
  if (error) throw error;
  /* LE BADGE SUSPENDU (lot S-a) se lit À CÔTÉ de la file, pas dedans : la
     fonction rend un `returns table` figé, et lui ajouter une colonne
     demanderait de la supprimer d'abord — ce que le connecteur refuse.
     `professional_profiles` est lisible par tous (même sans compte : c'est
     la règle « lecture profils », et fermer cette colonne-là est une
     décision du lot S-d, écrite dans A-FAIRE), donc cette lecture n'ouvre
     rien de plus. Le jour où elle sera fermée, l'administration devra la
     recevoir par une fonction à elle. Un échec n'empêche pas la file de
     s'afficher : la carte ne dit alors rien de la suspension (`null`),
     plutôt que d'affirmer « pas suspendu ». */
  const ids = (data || []).map((p) => p.id);
  let suspendus = null;
  if (ids.length) {
    const lu = await supabase.from('professional_profiles')
      .select('id, badge_suspendu_le').in('id', ids);
    if (!lu.error) suspendus = new Map((lu.data || []).map((r) => [r.id, r.badge_suspendu_le]));
  }
  return (data || []).map((p) => ({
    id: p.id,
    entreprise: p.entreprise,
    nom: p.nom,
    ville: p.ville,
    /* L'ancien SIRET déclaré n'est plus affiché : la carte montre
       l'entreprise rattachée, lue par `entrepriseDe()` (section 45). */
    metiers: p.metiers || [],
    specialites: p.specialites || [],
    statut: p.verification_statut,
    note: p.verification_note,
    kbisValide: p.kbis_valide,
    kbisUrl: p.kbis_url,
    kbisMaj: p.kbis_maj,
    assuranceValide: p.assurance_valide,
    assuranceUrl: p.assurance_url,
    assuranceExpire: p.assurance_expire,
    rge: p.rge,
    rgeDeclare: p.rge_declare,
    rgeNumero: p.rge_numero,
    rgeExpire: p.rge_expire,
    rgeUrl: p.rge_url,
    /* `email_pro` est une adresse de CONTACT, que le professionnel a
       renseignée pour qu'elle s'affiche. Ce n'est jamais `users.email`,
       fermée à tout le monde depuis le 29/09 — et la fonction de la base ne
       la rend pas. */
    emailPro: p.email_pro,
    telephone: p.telephone,
    aEnvoye: p.a_envoye,
    estMoi: p.est_moi,
    inscritLe: p.inscrit_le,
    badgeSuspenduLe: suspendus ? (suspendus.get(p.id) || null) : undefined,
  }));
}

export const fileVerifications = hasSupabase ? fileVerificationsSupabase : fileVerificationsDemo;

/** La file des signalements. */
async function signalementsAdminDemo() { return []; }

async function signalementsAdminSupabase() {
  const { data, error } = await supabase.rpc('admin_signalements');
  if (error) throw error;
  return (data || []).map((s) => ({
    id: s.id,
    cibleType: s.cible_type,
    cibleId: s.cible_id,
    cibleAuteurId: s.cible_auteur_id,
    cibleAuteur: s.cible_auteur,
    auteur: s.auteur,
    extrait: s.extrait,
    motif: s.motif,
    details: s.details,
    statut: s.statut,
    note: s.note,
    jours: s.jours,
    creeLe: s.created_at,
    traiteLe: s.traite_at,
  }));
}

export const signalementsAdmin = hasSupabase ? signalementsAdminSupabase : signalementsAdminDemo;

/* --------------------------------------------------------------------------
   LES TROIS ÉCRITURES.

   Elles ne rendent rien : l'écran recharge la file. Deux vérités côte à côte
   (ce que l'écran croit, ce que la base dit) finissent toujours par diverger,
   et c'est sur un badge que ça se verrait le plus mal.
   -------------------------------------------------------------------------- */
const refuseEnDemo = async () => {
  throw new Error('Le back-office a besoin de la vraie base : il n’y a rien à administrer en mode démonstration.');
};

/* `admin_valider_pieces` et pas `admin_verifier_pro` (lot S-a) : l'écran
   envoie les CHEMINS des pièces qu'il a montrées, et la base refuse (OP024)
   si l'artisan les a changées depuis. Sans ça, l'administration validait la
   pièce qui avait remplacé celle qu'elle venait d'ouvrir. */
async function verifierProSupabase({
  id, kbis, assurance, rge = null, note = null, kbisVu = null, assuranceVu = null,
}) {
  const { error } = await supabase.rpc('admin_valider_pieces', {
    p_pro: id, p_kbis_vu: kbisVu, p_assurance_vu: assuranceVu,
    p_kbis: !!kbis, p_assurance: !!assurance, p_rge: rge, p_note: note,
  });
  if (error) throw error;
}

export const verifierPro = hasSupabase ? verifierProSupabase : refuseEnDemo;

async function refuserProSupabase({ id, note }) {
  const { error } = await supabase.rpc('admin_refuser_pro', { p_pro: id, p_note: note });
  if (error) throw error;
}

export const refuserPro = hasSupabase ? refuserProSupabase : refuseEnDemo;

async function traiterSignalementSupabase({ id, statut, note = null }) {
  const { error } = await supabase.rpc('admin_traiter_signalement', {
    p_signalement: id, p_statut: statut, p_note: note,
  });
  if (error) throw error;
}

export const traiterSignalement = hasSupabase ? traiterSignalementSupabase : refuseEnDemo;

/* --------------------------------------------------------------------------
   OUVRIR UN DOCUMENT JUSTIFICATIF.

   L'espace `documents` est PRIVÉ, et doit le rester : un Kbis porte le nom
   et l'adresse du dirigeant. On ne rend donc pas une adresse publique mais
   une adresse SIGNÉE, valable cinq minutes.

   Cinq minutes et pas une heure : l'adresse se retrouve dans l'historique
   du navigateur, et quiconque l'aurait n'aurait pas besoin de compte. Le
   temps de regarder un document, pas celui de l'oublier quelque part.
   -------------------------------------------------------------------------- */
const DUREE_LIEN_DOCUMENT = 300;

async function urlDocumentDemo() { return null; }

async function urlDocumentSupabase(chemin) {
  if (!chemin) return null;
  /* Les fiches anciennes rangent parfois une adresse complète ; on ne garde
     que le chemin dans l'espace. */
  const propre = String(chemin).replace(/^.*\/documents\//, '');
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(propre, DUREE_LIEN_DOCUMENT);
  if (error) throw error;
  return data ? data.signedUrl : null;
}

export const urlDocument = hasSupabase ? urlDocumentSupabase : urlDocumentDemo;

/* ==========================================================================
   LE RÉFÉRENTIEL, CÔTÉ ADMINISTRATION  (section 27 de `schema.sql`)

   DEUX FILES QU'ON ÉCRIVAIT SANS JAMAIS LES LIRE
   ----------------------------------------------
   `metier_demandes` existe depuis le début : un professionnel VÉRIFIÉ ne
   peut pas changer ses métiers lui-même, il doit demander. La table était
   là, et rien ne la relisait — le défaut exact du 01/10 avec les demandes
   de devis.

   `specialites_proposees` se remplit toute seule à chaque mot écrit à la
   main, et sert à faire entrer au référentiel ce que les artisans écrivent
   vraiment. Encore faut-il quelqu'un pour le lire.

   ET CE QU'ACCEPTER VEUT DIRE
   ---------------------------
   Accepter une demande de métiers APPLIQUE vraiment les métiers sur la
   fiche. Un bouton qui se contenterait de passer le statut à « acceptée »
   serait un tampon : l'artisan verrait sa demande acceptée et sa fiche
   inchangée.

   Retenir une spécialité, au contraire, n'insère RIEN au catalogue — qui
   n'a qu'une source, le fichier du catalogue dans `src/data/`. L'écran
   l'écrit en toutes lettres : laisser croire qu'un bouton enrichit le
   référentiel serait pire que pas de bouton.
   ========================================================================== */

async function metierDemandesDemo() { return []; }

async function metierDemandesSupabase() {
  const { data, error } = await supabase.rpc('admin_metier_demandes');
  if (error) throw error;
  return (data || []).map((d) => ({
    id: d.id,
    proId: d.professional_id,
    entreprise: d.entreprise,
    actuels: d.metiers_actuels || [],
    voulus: d.metiers_voulus || [],
    motif: d.motif,
    statut: d.statut,
    note: d.note,
    jours: d.jours,
    creeLe: d.created_at,
    traiteLe: d.traite_le,
    estMoi: d.est_moi,
  }));
}

export const metierDemandes = hasSupabase ? metierDemandesSupabase : metierDemandesDemo;

async function specialitesProposeesDemo() { return []; }

async function specialitesProposeesSupabase() {
  const { data, error } = await supabase.rpc('admin_specialites');
  if (error) throw error;
  return (data || []).map((s) => ({
    id: s.id,
    texte: s.texte,
    metier: s.metier,
    metierNom: s.metier_nom,
    proposePar: s.propose_par,
    statut: s.statut,
    creeLe: s.created_at,
  }));
}

export const specialitesProposees = hasSupabase
  ? specialitesProposeesSupabase : specialitesProposeesDemo;

async function traiterMetierDemandeSupabase({ id, statut, note = null }) {
  const { error } = await supabase.rpc('admin_traiter_metier_demande', {
    p_demande: id, p_statut: statut, p_note: note,
  });
  if (error) throw error;
}

export const traiterMetierDemande = hasSupabase ? traiterMetierDemandeSupabase : refuseEnDemo;

async function traiterSpecialiteSupabase({ id, statut }) {
  const { error } = await supabase.rpc('admin_traiter_specialite', {
    p_specialite: id, p_statut: statut,
  });
  if (error) throw error;
}

export const traiterSpecialite = hasSupabase ? traiterSpecialiteSupabase : refuseEnDemo;

/* ==========================================================================
   LES PIÈCES JOINTES DE LA MESSAGERIE  (section 28 de `schema.sql`)

   L'idée vient du propriétaire, le 01/10/2026 : « des pièces jointes dans
   la messagerie ». C'est le vrai besoin derrière l'e-mail de contact —
   recevoir un plan, un devis signé, une attestation.

   LE RANGEMENT, ET POURQUOI IL EST COMME ÇA
   -----------------------------------------
   `<uid>/<conversation>/<alea>-<nom>`. Le premier dossier porte
   l'identifiant de celui qui envoie, comme partout ailleurs dans le
   stockage — c'est ce qui permet à la fonction Edge `compte` de faire le
   ménage quand un compte se ferme. Le second porte la conversation, parce
   que la pièce doit être lisible par DEUX personnes, et que la règle de
   sécurité doit pouvoir le vérifier sans découper un nom de fichier.
   ========================================================================== */

/** 10 Mo. Un devis scanné tient dedans, une vidéo non. */
export const TAILLE_MAX_PIECE = 10 * 1024 * 1024;

/**
 * Ce qu'on refuse AVANT d'envoyer.
 *
 * Le serveur refuserait de toute façon — l'espace porte sa propre limite —
 * mais il le ferait au bout de la montée, après trois minutes d'attente sur
 * un chantier en 4G, avec un message que personne ne lit. Un refus immédiat
 * et en français vaut mieux.
 */
export function refusPiece(piece) {
  if (!piece) return null;
  if (!piece.taille) return null;

  /* UNE PHOTO N'EST PAS JUGÉE SUR SON POIDS BRUT, et c'est important : un
     iPhone récent rend des photos de 5 à 12 Mo, et elles passent toutes
     par `reduireImage()` avant de partir — 2,65 Mo devenaient 232 Ko,
     mesuré le 29/09. Refuser sur le poids d'origine écarterait des photos
     qui, une fois réduites, tiennent dix fois dans la limite.
     `TAILLE_MAX_MO` reste la borne, la même que pour une publication :
     au-delà, c'est la réduction elle-même qui fait ramer le téléphone. */
  const image = (piece.type || '').startsWith('image/');
  const limite = image ? TAILLE_MAX_MO * 1024 * 1024 : TAILLE_MAX_PIECE;
  if (piece.taille <= limite) return null;

  return image
    ? `Cette photo fait ${Math.round(piece.taille / 1024 / 1024)} Mo, et c’est `
      + `trop pour être réduite sur le téléphone (${TAILLE_MAX_MO} Mo maximum).`
    : `Ce fichier fait ${Math.round(piece.taille / 1024 / 1024)} Mo. `
      + 'La limite est de 10 Mo — au-delà, mieux vaut un lien de téléchargement.';
}

async function envoyerPieceSupabase(conversationId, piece) {
  const refus = refusPiece(piece);
  if (refus) throw new Error(refus);

  /* Une photo passe par la même réduction que les publications : 2,65 Mo
     → 232 Ko mesurés le 29/09. Un PDF, lui, ne se touche pas — le
     recompresser abîmerait un devis sans rien gagner. */
  let uri = piece.uri;
  let nom = piece.nom;
  let type = piece.type || null;
  let taille = piece.taille || null;

  if (type && type.startsWith('image/')) {
    try {
      const reduite = await reduireImage(piece.uri, 'photo');
      if (reduite && reduite !== piece.uri) {
        /* `reduireImage()` ENREGISTRE EN JPEG. Un PNG réduit reste donc
           annoncé « image/png » sous une extension `.png`, alors que ce
           sont des octets JPEG : le fichier se télécharge au lieu de
           s'afficher, et personne ne comprend pourquoi. On suit ce que le
           fichier est DEVENU, pas ce qu'il était. */
        uri = reduite;
        type = 'image/jpeg';
        nom = `${String(piece.nom || 'photo').replace(/\.[^.]*$/, '')}.jpg`;
      }
    } catch (e) { /* on envoie l'original : une photo lourde vaut mieux que rien */ }
  }

  /* LE DOSSIER DE CONVERSATION PASSE PAR `nom` : `envoyerFichier` range
     sous `<userId>/<nom>-<horodatage>.<ext>`, donc un `nom` qui contient
     une barre oblique crée le second niveau. C'est ce que la politique de
     la section 28 attend : le premier dossier est celui qui envoie, le
     second la conversation. Au-delà, plus rien ne tient : ni la politique,
     qui compte les niveaux, ni le ménage de compte, qui les descend.
     `morceauDeChemin()` retire donc tout ce qui pourrait en creuser un
     troisième — et `nomOrigine` donne la vraie extension, que l'adresse du
     fichier ne porte pas au navigateur. */
  const propre = morceauDeChemin(nom);
  /* LE POIDS RANGÉ EN BASE EST CELUI DU FICHIER RÉELLEMENT ENVOYÉ, pas
     celui qu'on avait choisi. Une photo d'iPhone de 5,9 Mo part à 1,3 Mo
     une fois réduite ; annoncer 5,9 dans la bulle serait faux pour
     toujours. Mesuré au navigateur le 04/10/2026 — et `poidsDe()` ne
     pouvait pas le dire, `expo-file-system` n'ayant pas de fichiers là-bas.
     `envoyerFichier` le sait, lui : il compte les octets de toute façon. */
  const chemin = await envoyerFichier({
    uri,
    bucket: 'pieces-jointes',
    nom: `${conversationId}/${propre}`,
    userId: currentUserId,
    nomOrigine: nom,
    typeMime: type,
    onTaille: (octets) => { if (octets) taille = octets; },
  });
  if (!chemin) throw new Error('Le fichier n’a pas pu être envoyé.');
  return {
    piece_url: chemin,
    piece_nom: nom || propre,
    piece_taille: taille,
    piece_type: type,
  };
}

async function envoyerMessageDemo() { return null; }

async function envoyerMessageSupabase(conversationId, texte, piece = null) {
  const colonnes = piece ? await envoyerPieceSupabase(conversationId, piece) : {};
  const { data, error } = await supabase.from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      texte: texte || '',
      ...colonnes,
    })
    .select().single();
  if (error) throw error;
  return data;
}

/** Remplace `sendMessage`, qui ne savait envoyer que du texte. */
export const envoyerMessage = hasSupabase ? envoyerMessageSupabase : envoyerMessageDemo;

/**
 * Ouvrir une pièce jointe.
 *
 * L'espace est PRIVÉ : on ne rend donc pas une adresse publique mais une
 * adresse SIGNÉE, valable cinq minutes. Même durée que pour les documents
 * de vérification, et pour la même raison : le temps de regarder, pas celui
 * de l'oublier dans un historique de navigation.
 */
const DUREE_LIEN_PIECE = 300;

/**
 * POUR AFFICHER, C'EST PLUS LONG — et ce n'est pas un relâchement.
 *
 * Les cinq minutes ci-dessus valent pour le lien qu'on REMET AU TÉLÉPHONE
 * quand on touche une pièce : il part dans le visualiseur du système, donc
 * dans un historique, donc il peut traîner. Une vignette affichée DANS
 * l'application ne traîne nulle part — et si elle expirait pendant qu'on
 * lit la conversation, la photo disparaîtrait sous les yeux de son
 * destinataire.
 */
const DUREE_APERCU = 3600;

async function urlPieceDemo() { return null; }

async function urlPieceSupabase(chemin) {
  if (!chemin) return null;
  const { data, error } = await supabase.storage
    .from('pieces-jointes')
    .createSignedUrl(chemin, DUREE_LIEN_PIECE);
  if (error) throw error;
  return data ? data.signedUrl : null;
}

export const urlPiece = hasSupabase ? urlPieceSupabase : urlPieceDemo;

/**
 * LES APERÇUS DE TOUTE UNE CONVERSATION, EN UNE SEULE REQUÊTE.
 *
 * C'est le point qui décide si montrer les photos est raisonnable ou non.
 * Une adresse signée par photo, demandée au montage de chaque bulle,
 * ferait vingt requêtes sur une conversation de vingt photos — et sur un
 * chantier, en 4G, ça se sent. `createSignedUrls` (au pluriel) en fait
 * UNE.
 *
 * Elle rend un tableau dans l'ORDRE DEMANDÉ, avec une entrée par chemin ;
 * une entrée peut porter une erreur — fichier retiré, droit refusé — sans
 * que les autres échouent. On range donc par chemin, et ce qui manque
 * manque : la bulle retombe alors sur la ligne « nom + poids », qui reste
 * parfaitement utilisable.
 */
async function urlsPiecesDemo() { return {}; }

async function urlsPiecesSupabase(chemins) {
  const liste = [...new Set((chemins || []).filter(Boolean))];
  if (liste.length === 0) return {};

  const { data, error } = await supabase.storage
    .from('pieces-jointes')
    .createSignedUrls(liste, DUREE_APERCU);
  if (error) throw error;

  const par = {};
  (data || []).forEach((entree, i) => {
    /* `entree.path` n'est pas toujours rendu : on garde l'indice, qui l'est
       toujours. */
    const chemin = entree.path || liste[i];
    if (entree.signedUrl) par[chemin] = entree.signedUrl;
  });
  return par;
}

export const urlsPieces = hasSupabase ? urlsPiecesSupabase : urlsPiecesDemo;

/* ==========================================================================
   LE SIRET ET L'ENTREPRISE  (section 45 de `schema.sql`, 15/10/2026)

   CE QUE LA VÉRIFICATION PROUVE, ET CE QU'ELLE NE PROUVE PAS
   ----------------------------------------------------------
   Un SIRET est PUBLIC. Le répertoire Sirene dit qu'une entreprise EXISTE et
   qu'elle est ACTIVE ; il ne dit jamais que celui qui tape le numéro en est
   le titulaire. D'où la règle des textes de l'écran : jamais « vérifié »
   ni « registre » pour ce niveau — ce mot appartient au badge, posé par un
   humain. Et d'où une identité PRIVÉE, que rien n'affiche sur la fiche
   publique dans ce lot.

   TOUTES LES ÉCRITURES PASSENT PAR LA BASE. L'application ne crée plus
   aucune fiche professionnelle (OP010) et n'écrit jamais dans
   `entreprise_registre` : elle appelle les fonctions qui exigent une
   preuve fraîche — et la preuve, seule la fonction Edge l'écrit.

   LA FORME DE CE CODE, et ce n'est pas un goût : chaque fonction existe en
   DEUX versions NOMMÉES, et le choix se fait à la fin
   (`hasSupabase ? x : xDemo`). La forme `!hasSupabase ? async (o = {}) =>
   { … } : …` fait échouer la construction de Metro sans dire ni la ligne
   ni la cause — le piège qui a coûté une heure (CLAUDE.md).
   ========================================================================== */

/** Quinze secondes : plus que les 8 s du répertoire, plus le réveil à froid de la fonction. */
export const DELAI_VERIFICATION_SIRET_MS = 15000;

/** Une pause, pour que la démonstration ait le rythme d'un vrai appel. */
function patienter(ms) {
  return new Promise((r) => { setTimeout(r, ms); });
}

/** Une erreur qui porte un code de la base, comme celles que PostgREST rend. */
function refusDeLaBase(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

/* --------------------------------------------------------------------------
   VÉRIFIER UN NUMÉRO.

   Rend TOUJOURS un objet `{ issue, … }`, jamais une exception : un écran
   qui doit choisir entre un `catch` et une issue finit par oublier l'un
   des deux. Les trois issues fabriquées ici (`reseau`, `lent`,
   `service_indisponible`) sont calculées par `issueDeVerification()`
   (`erreurs.js`), qui n'importe rien et que `verifier-etats` fait tourner.
   -------------------------------------------------------------------------- */
/* Le second argument (`{ pourMaFiche }`) n'est PAS lu ici, et ne part pas
   au serveur : la fonction Edge reconnaît la fiche de l'appelant à son
   jeton, que `functions.invoke` envoie de lui-même. Il ne sert qu'à la
   démonstration, qui n'a pas de jeton — c'est l'écran « Mon entreprise »
   qui le lui dit. */
async function verifierSiretSupabase(siret) {
  const debut = Date.now();
  let reponse;
  try {
    reponse = await supabase.functions.invoke('siret', {
      /* Les chiffres seuls : c'est la forme que la fonction Edge attend,
         et rien d'autre ne part — ni le nom, ni l'e-mail. */
      body: { siret: chiffresSeuls(siret) },
      timeout: DELAI_VERIFICATION_SIRET_MS,
    });
  } catch (e) {
    return issueDeVerification(e, Date.now() - debut, DELAI_VERIFICATION_SIRET_MS);
  }
  const { data, error } = reponse || {};
  if (error) return issueDeVerification(error, Date.now() - debut, DELAI_VERIFICATION_SIRET_MS);
  /* Une réponse sans issue n'est pas une réponse : on ne devine pas. */
  if (!data || typeof data !== 'object' || typeof data.issue !== 'string') {
    return { issue: 'service_indisponible' };
  }
  return data;
}

/** Les SIREN déjà rattachés dans la démonstration — le `deja_utilise` de la base. */
function sirensPrisDemo() {
  return Object.values(entreprisesDemo).filter((e) => e && !e.retiree_le).map((e) => e.siren);
}

/* La fonction Edge ne répond plus « déjà utilisé » à la fiche qui tient
   l'entreprise (section 45, 15/10). Sans jeton, la démonstration se fie à
   l'écran : seul « Mon entreprise » dit `pourMaFiche`. */
async function verifierSiretDemo(siret, { pourMaFiche = false } = {}) {
  const miens = pourMaFiche && entreprisesDemo[moiEnDemo()]
    ? [entreprisesDemo[moiEnDemo()].siren] : [];
  const r = reponseDemo(siret, sirensPrisDemo().filter((x) => !miens.includes(x)));
  /* « Trop lent » doit se SENTIR : c'est le bouton qui dit ce qu'il
     attend qu'on veut voir. Pas quinze secondes pour autant. */
  await patienter(r.issue === 'lent' ? 1500 : 500);
  if (r.issue === 'ok') preuvesDemo.set(r.identite.siret, r.identite);
  return r;
}

export const verifierSiret = hasSupabase ? verifierSiretSupabase : verifierSiretDemo;

/* --------------------------------------------------------------------------
   FAIRE CONTRÔLER SON N° DE TVA PAR VIES — section 48, 20/10/2026.

   Le même contrat que `verifierSiret` : TOUJOURS `{ issue, … }`, jamais une
   exception. Seul le numéro part — ni le nom, ni l'e-mail : la fonction
   Edge reconnaît l'appelant à son jeton, que `functions.invoke` envoie.

   Soixante secondes : la fonction se donne 45 s pour VIES (une réponse
   réussie en met 8 à 13, et la France est souvent saturée), plus le réveil
   à froid. En deçà, l'écran dirait « trop lent » à une réponse en route.
   -------------------------------------------------------------------------- */
export const DELAI_CONTROLE_TVA_MS = ESSAIS_VIES.budget_ms + 15000;

async function controlerTvaSupabase(numero) {
  const debut = Date.now();
  let reponse;
  try {
    reponse = await supabase.functions.invoke('tva', {
      body: { numero: analyserNumeroTva(numero).numero },
      timeout: DELAI_CONTROLE_TVA_MS,
    });
  } catch (e) {
    return issueDeVerification(e, Date.now() - debut, DELAI_CONTROLE_TVA_MS);
  }
  const { data, error } = reponse || {};
  if (error) return issueDeVerification(error, Date.now() - debut, DELAI_CONTROLE_TVA_MS);
  if (!data || typeof data !== 'object' || typeof data.issue !== 'string') {
    return { issue: 'service_indisponible' };
  }
  return data;
}

/* LA DÉMONSTRATION fait vivre les trois réponses de VIES, sans réseau :
   une clé de deux CHIFFRES juste est reconnue ; une clé en lettres
   commençant par « Z » trouve VIES saturé ; toute autre clé en lettres est
   refusée. Le reste — la forme, la clé, le SIREN, le numéro déjà publié —
   suit les mêmes règles que la fonction Edge, dans le même ordre. */
async function controlerTvaDemo(numero) {
  const saisie = analyserNumeroTva(numero);
  if (saisie.etat === 'cle_fausse') return { issue: 'cle_fausse' };
  if (saisie.etat !== 'pret') return { issue: 'mal_forme' };
  const moi = String(moiEnDemo());
  const r = entreprisesDemo[moi];
  if (!r || r.retiree_le) return { issue: 'sans_entreprise' };
  if (r.tva) return { issue: 'deja_publie', numero: r.tva };
  if (analyserNumeroTva(saisie.numero, r.siren).etat !== 'pret') return { issue: 'autre_siren' };
  await patienter(1500);
  const cle = saisie.numero.slice(2, 4);
  if (/^\d{2}$/.test(cle)) {
    preuvesTvaDemo[moi] = {
      siren: r.siren, numero: saisie.numero, reconnu_le: new Date().toISOString(), source: 'vies',
    };
    return { issue: 'reconnu', numero: saisie.numero, reconnu_le: preuvesTvaDemo[moi].reconnu_le };
  }
  if (cle.startsWith('Z')) return { issue: 'indisponible', cause: 'sature' };
  if (preuvesTvaDemo[moi] && preuvesTvaDemo[moi].numero === saisie.numero) delete preuvesTvaDemo[moi];
  return { issue: 'refuse', numero: saisie.numero };
}

export const controlerTva = hasSupabase ? controlerTvaSupabase : controlerTvaDemo;

/* --------------------------------------------------------------------------
   MON ENTREPRISE — l'identité rattachée à MA fiche, et elle seule.

   Les colonnes sont NOMMÉES : `nom_complet_registre` n'y est pas. Pour un
   entrepreneur individuel, c'est son nom civil brut, et il n'a rien à
   faire à l'écran (section 45.1). L'adresse, elle, y est : « Modifier mon
   profil » la montre à son titulaire, « visible de vous seul ».
   -------------------------------------------------------------------------- */
const COLONNES_ENTREPRISE = [
  'id', 'siren', 'siret', 'denomination', 'sigle', 'nom_commercial', 'est_ei',
  'forme_juridique', 'date_creation', 'tva', 'ape', 'naf25', 'est_siege',
  'adresse', 'code_postal', 'commune', 'code_insee', 'statut_diffusion',
  'maj_insee', 'source', 'verifie_le',
];

/** Une identité rendue par une fonction de la base : sans le nom brut, jamais. */
function sansNomBrut(ligne) {
  if (!ligne || typeof ligne !== 'object') return null;
  const { nom_complet_registre: _brut, ...reste } = ligne;
  return reste;
}

async function monEntrepriseSupabase() {
  const { data, error } = await supabase.from('entreprise_registre')
    .select(COLONNES_ENTREPRISE.join(', '))
    .eq('pro_id', currentUserId)
    .is('retiree_le', null)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** La fiche de démonstration qui est « moi » : celle créée en passant pro, sinon la 1. */
function moiEnDemo() {
  return prosAjoutesDemo[currentUserId] ? String(currentUserId) : '1';
}

async function monEntrepriseDemo() {
  const e = entreprisesDemo[moiEnDemo()];
  return e && !e.retiree_le ? { ...e } : null;
}

export const monEntreprise = hasSupabase ? monEntrepriseSupabase : monEntrepriseDemo;

/* LA DERNIÈRE ENTREPRISE RETIRÉE DE MA FICHE, quand il n'y en a plus
   d'active — 15/10/2026, relecture adverse.

   Une fiche sans entreprise active, mais avec une identité retirée, n'a
   pas « jamais rattaché » de SIRET : l'administration la lui a RETIRÉE.
   Les retraits qui viennent du titulaire (un déménagement, une mise à jour
   depuis le répertoire) en rattachent une nouvelle dans le même geste ; il
   ne reste donc sans entreprise active que ce que l'administration a
   retiré. L'écran ne propose alors plus de la rattacher — la base le
   refuserait (section 45.3, le gel) —, et dit pourquoi. */
async function monEntrepriseRetireeSupabase() {
  const { data, error } = await supabase.from('entreprise_registre')
    .select('siret, retiree_le, retrait_motif')
    .eq('pro_id', currentUserId)
    .not('retiree_le', 'is', null)
    .order('retiree_le', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/* La démonstration n'administre rien : aucune entreprise n'y est jamais
   retirée. */
async function monEntrepriseRetireeDemo() { return null; }

export const monEntrepriseRetiree = hasSupabase
  ? monEntrepriseRetireeSupabase : monEntrepriseRetireeDemo;

/* L'entreprise d'une AUTRE fiche, pour la carte du badge. Seule
   l'administration la lit (la règle RLS : sa propre fiche, ou
   `est_admin()`), et l'adresse n'y est PAS : pour décider d'un badge, elle
   ne sert à rien. */
async function entrepriseDeSupabase(proId) {
  const { data, error } = await supabase.from('entreprise_registre')
    .select(COLONNES_ENTREPRISE.filter((c) => c !== 'adresse').join(', '))
    .eq('pro_id', proId)
    .is('retiree_le', null)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function entrepriseDeDemo(proId) {
  const e = entreprisesDemo[String(proId)];
  if (!e || e.retiree_le) return null;
  const { adresse: _adresse, ...sansAdresse } = e;
  return sansAdresse;
}

export const entrepriseDe = hasSupabase ? entrepriseDeSupabase : entrepriseDeDemo;

/* --------------------------------------------------------------------------
   RATTACHER MON SIRET — un pro inscrit avant ce lot, ou qui a déménagé.

   IMMÉDIAT, et c'est pour ça que « Mon entreprise » a son propre bouton :
   les dix-huit autres champs de « Modifier mon profil » attendent
   « Enregistrer ». Un SIRET tapé puis « Enregistrer » ne doit jamais
   ressembler à un rattachement fait.
   -------------------------------------------------------------------------- */
async function rattacherMonSiretSupabase(siret) {
  const { data, error } = await supabase.rpc('rattacher_mon_siret', {
    p_siret: chiffresSeuls(siret),
  });
  if (error) throw error;
  return sansNomBrut(data);
}

/* Les MÊMES refus que la base, dans le même ordre, avec les mêmes mots :
   la démonstration ne doit pas laisser croire qu'un geste passe alors que
   la base le refuserait. */
async function rattacherMonSiretDemo(siret) {
  await patienter(400);
  const s = chiffresSeuls(siret);
  const preuve = preuvesDemo.get(s);
  if (!preuve) {
    throw refusDeLaBase('OP006', 'Ce SIRET n’a pas été retrouvé au répertoire Sirene depuis '
      + 'moins de 24 heures : touchez « Vérifier » à nouveau.');
  }
  const moi = moiEnDemo();
  const actuelle = entreprisesDemo[moi];
  const fiche = prosAjoutesDemo[moi] || demoPros[moi] || {};
  if (!actuelle) {
    /* Même règle que la base (lot S-a) : un badge SUSPENDU garde le verrou. */
    if (fiche.verifie || fiche.badgeSuspenduLe) {
      throw refusDeLaBase('OP009', 'Votre fiche porte le badge « vérifié » (ou l’attend, le temps '
        + 'd’un examen), accordé avant que les '
        + 'entreprises soient rattachées : y lier une entreprise ne peut pas se faire '
        + 'automatiquement, et ne peut pas encore se demander depuis l’application.');
    }
    if (sirensPrisDemo().includes(preuve.siren)) {
      throw refusDeLaBase('OP007', 'Cette entreprise est déjà rattachée à un autre compte Opus.');
    }
  } else if (actuelle.siren !== preuve.siren) {
    throw refusDeLaBase('OP008', 'Ce numéro désigne une autre entreprise que celle de votre '
      + 'compte. Un compte Opus correspond à une seule entreprise : en changer ne peut pas '
      + 'encore se faire depuis l’application.');
  }
  /* L'ADRESSE DE RUE NE SE PERD PAS À LA RELECTURE — 18/10/2026, lot 0a.
     En base, la preuve garde l'adresse CÔTÉ SERVEUR (`preuves_siret.adresse`,
     que la fonction Edge n'envoie jamais au téléphone), et
     `rattacher_mon_siret()` la recopie. Ici, la preuve est l'identité du
     TÉLÉPHONE, sans adresse : relire son propre SIRET effaçait donc
     l'adresse, et « Mon entreprise » inventait un manque (« l'adresse de
     votre établissement n'a pas été transmise ») que la base n'aurait pas —
     sur le chemin même que le motif « relire le SIRET chaque année »
     conseille. Le même SIRET désigne le même établissement, donc la même
     adresse : on la garde. Un AUTRE établissement repart sans, comme une
     démonstration qui ne connaît pas sa rue. */
  const memeEtablissement = actuelle && actuelle.siret === preuve.siret && actuelle.adresse
    ? { adresse: actuelle.adresse } : {};
  entreprisesDemo[moi] = {
    ...preuve, ...memeEtablissement, source: 'registre', verifie_le: new Date().toISOString(),
  };
  return { ...entreprisesDemo[moi] };
}

export const rattacherMonSiret = hasSupabase ? rattacherMonSiretSupabase : rattacherMonSiretDemo;

/* --------------------------------------------------------------------------
   PASSER EN COMPTE PROFESSIONNEL — un particulier dont le répertoire
   connaît l'entreprise.

   La signature de la fonction de la base est FIGÉE (`p jsonb`) : un
   paramètre de plus créerait une surcharge, que seul un `drop` — refusé
   par le connecteur — réparerait. On ajoute donc des CLÉS, jamais des
   arguments.

   APRÈS : on réaligne les métadonnées de la session. Sans ça, l'écran
   redémarrerait en particulier à chaque lancement, puis basculerait —
   deux chargements complets, mesurés par la relecture du plan.
   -------------------------------------------------------------------------- */
async function devenirProSupabase({ siret, entreprise, metiers, cguVersion }) {
  const { data, error } = await supabase.rpc('devenir_pro', {
    p: {
      siret: chiffresSeuls(siret),
      entreprise: (entreprise || '').trim() || null,
      metiers: (metiers || []).slice(0, 4),
      cgu_version: cguVersion || null,
    },
  });
  if (error) throw error;
  await alignerTypeDuCompte('pro');
  return { type: 'pro', identite: sansNomBrut(data && data.identite) };
}

async function devenirProDemo({ siret, entreprise, metiers }) {
  await patienter(500);
  const s = chiffresSeuls(siret);
  const preuve = preuvesDemo.get(s);
  if (!preuve) {
    throw refusDeLaBase('OP006', 'Ce SIRET n’a pas été retrouvé au répertoire Sirene depuis '
      + 'moins de 24 heures : touchez « Vérifier » à nouveau.');
  }
  if (sirensPrisDemo().includes(preuve.siren)) {
    throw refusDeLaBase('OP007', 'Cette entreprise est déjà rattachée à un autre compte Opus. Si '
      + 'c’est la vôtre, demandez une vérification à la main : l’administration examinera '
      + 'votre demande.');
  }
  const id = String(currentUserId || 'demo-user');
  const liste = (metiers || []).filter(Boolean).slice(0, 4);
  /* Le même repli que la base : un métier manquant retombe sur « maçon »
     plutôt que de faire échouer le passage. */
  const mes = liste.length ? liste : ['macon'];
  const dep = departementDe(preuve.code_insee, preuve.code_postal);
  const commune = communeLisible(preuve.commune);
  prosAjoutesDemo[id] = {
    id,
    nom: 'Vous',
    entreprise: (entreprise || '').trim() || 'Mon entreprise',
    metier: mes[0],
    metiers: mes,
    /* En démonstration, le particulier n'a pas de commune : on prend celle
       de l'établissement. La base, elle, reprend la commune du compte. */
    ville: commune ? `${commune}${dep ? ` (${dep})` : ''}` : '',
    verifie: false,
    exp: 0,
    followers: 0,
    bio: '',
    partners: [],
    assurance: { valide: false, expire: null },
    kbis: { valide: false, maj: null },
    portfolio: [],
    reviews: [],
  };
  entreprisesDemo[id] = { ...preuve, source: 'registre', verifie_le: new Date().toISOString() };
  if (demandeProDemo && demandeProDemo.statut === 'nouvelle') {
    demandeProDemo = {
      ...demandeProDemo,
      statut: 'acceptee',
      note: 'Ouverte automatiquement : l’entreprise est active au répertoire Sirene (INSEE).',
      traitee_le: new Date().toISOString(),
    };
  }
  return { type: 'pro', identite: { ...entreprisesDemo[id] } };
}

export const devenirPro = hasSupabase ? devenirProSupabase : devenirProDemo;

/* --------------------------------------------------------------------------
   LA PORTE DE SECOURS — une demande que l'administration examinera.

   L'insertion passe par la POLITIQUE (« envoi de ma demande pro ») : un
   particulier, pour lui-même, une demande neuve et sans réponse. Le statut,
   la note et la date de traitement ne s'écrivent que par l'administration.
   -------------------------------------------------------------------------- */
const COLONNES_DEMANDE_PRO = 'id, siret, motif, entreprise, metiers, message, justificatif, '
  + 'statut, note, created_at, traitee_le';

async function demanderCompteProSupabase({ siret, motif, entreprise, metiers, message }) {
  /* SANS `.select()` À LA SUITE, et ce n'est pas un oubli. Depuis le 15/10,
     le client n'a sur `demandes_pro` que des droits de COLONNE (section
     45.4 : la date de dépôt et l'identité de l'administrateur lui sont
     fermées). Une insertion qui demande à la base de RENVOYER la ligne la
     relit ; la relire en entier échouerait. On insère sans rien demander
     en retour (`return=minimal`, la forme par défaut), puis on relit par la
     liste nommée — la même que la carte du profil. */
  const { error } = await supabase.from('demandes_pro').insert({
    compte_id: currentUserId,
    siret: chiffresSeuls(siret),
    motif: motif || 'autre',
    /* Coupé au nombre de la contrainte : sinon la base refuse, et le
       message parle d'un `schema.sql` pas rejoué — une piste fausse. */
    entreprise: (entreprise || '').trim().slice(0, NOM_ENTREPRISE_MAX) || null,
    metiers: (metiers || []).slice(0, 4),
    message: (message || '').trim() || null,
  });
  if (error) throw error;
  return maDemandePro();
}

async function demanderCompteProDemo({ siret, motif, entreprise, metiers, message }) {
  await patienter(400);
  if (demandeProDemo && demandeProDemo.statut === 'nouvelle') {
    /* L'index « une seule demande ouverte » de la base, en mémoire — avec
       le MÊME texte que PostgreSQL : c'est `messageClair` qui le traduit,
       des deux côtés. Une démonstration plus aimable que la base masquait
       que la vraie disait « cela existe déjà » (relecture adverse). */
    throw refusDeLaBase('23505', 'duplicate key value violates unique constraint '
      + '"idx_demandes_pro_une_ouverte"');
  }
  demandeProDemo = {
    id: `demo-demande-${Date.now()}`,
    siret: chiffresSeuls(siret),
    motif: motif || 'autre',
    entreprise: (entreprise || '').trim().slice(0, NOM_ENTREPRISE_MAX) || null,
    metiers: (metiers || []).slice(0, 4),
    message: (message || '').trim() || null,
    justificatif: null,
    statut: 'nouvelle',
    note: null,
    created_at: new Date().toISOString(),
    traitee_le: null,
  };
  return { ...demandeProDemo };
}

export const demanderComptePro = hasSupabase ? demanderCompteProSupabase : demanderCompteProDemo;

/* LA DERNIÈRE demande du compte, quel que soit son statut : la carte du
   profil doit pouvoir dire « refusée, et pourquoi » autant qu'« en
   attente ». Lue EN BASE, jamais déduite de l'état local : une demande
   perdue en silence ne doit pas avoir l'air envoyée. */
async function maDemandeProSupabase() {
  const { data, error } = await supabase.from('demandes_pro')
    .select(COLONNES_DEMANDE_PRO)
    .eq('compte_id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function maDemandeProDemo() {
  return demandeProDemo ? { ...demandeProDemo } : null;
}

export const maDemandePro = hasSupabase ? maDemandeProSupabase : maDemandeProDemo;

/* UNE CLÉ ABSENTE GARDE LA VALEUR ACTUELLE (règle de la base) : joindre un
   justificatif ne doit pas effacer le message. On n'envoie donc que ce
   qu'on veut changer. */
function completerDemande(message, justificatif) {
  const p = {};
  if (message !== undefined) p.message = message;
  if (justificatif !== undefined) p.justificatif = justificatif;
  return p;
}

async function completerMaDemandeProSupabase({ message, justificatif } = {}) {
  const { data, error } = await supabase.rpc('completer_ma_demande_pro', {
    p: completerDemande(message, justificatif),
  });
  if (error) throw error;
  return data;
}

async function completerMaDemandeProDemo({ message, justificatif } = {}) {
  await patienter(300);
  if (!demandeProDemo || demandeProDemo.statut !== 'nouvelle') {
    throw new Error('Vous n’avez aucune demande de compte professionnel en attente : il n’y '
      + 'a rien à compléter.');
  }
  const p = completerDemande(message, justificatif);
  demandeProDemo = {
    ...demandeProDemo,
    ...(p.message !== undefined ? { message: String(p.message || '').trim() || null } : {}),
    ...(p.justificatif !== undefined ? { justificatif: p.justificatif || null } : {}),
  };
  return { ...demandeProDemo };
}

export const completerMaDemandePro = hasSupabase
  ? completerMaDemandeProSupabase : completerMaDemandeProDemo;

async function annulerMaDemandeProSupabase() {
  const { data, error } = await supabase.rpc('annuler_ma_demande_pro');
  if (error) throw error;
  return data;
}

async function annulerMaDemandeProDemo() {
  await patienter(300);
  if (!demandeProDemo || demandeProDemo.statut !== 'nouvelle') {
    throw new Error('Vous n’avez aucune demande de compte professionnel en attente : il n’y '
      + 'a rien à annuler.');
  }
  demandeProDemo = { ...demandeProDemo, statut: 'annulee', traitee_le: new Date().toISOString() };
  return { ...demandeProDemo };
}

export const annulerMaDemandePro = hasSupabase
  ? annulerMaDemandeProSupabase : annulerMaDemandeProDemo;

/* --------------------------------------------------------------------------
   L'ADMINISTRATION — trancher une demande, retirer une entreprise.

   Trois `rpc`, comme le reste du back-office : la règle reste dans la
   base. En démonstration, personne n'administre (voir `resumeAdminDemo`) :
   la file est vide et les gestes sont refusés.
   -------------------------------------------------------------------------- */
async function demandesProAdminSupabase() {
  const { data, error } = await supabase.rpc('admin_demandes_pro');
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((d) => ({
    id: d.id,
    creeLe: d.created_at,
    statut: d.statut,
    motif: d.motif,
    siret: d.siret,
    entreprise: d.entreprise,
    metiers: d.metiers || [],
    message: d.message,
    justificatif: d.justificatif,
    note: d.note,
    traiteeLe: d.traitee_le,
    /* Le nombre de jours d'attente, calculé ICI, à la lecture : le
       calculer pendant l'affichage lirait l'horloge à chaque redessin, et
       deux cartes voisines pourraient ne pas dire la même chose. */
    jours: d.created_at
      ? Math.max(0, Math.floor((Date.now() - Date.parse(d.created_at)) / (24 * 3600e3))) : 0,
    /* `compte`, `preuve` et `detenteur` arrivent tels que la base les
       compose — et elle n'y met ni e-mail, ni téléphone, ni adresse. */
    compte: d.compte || null,
    preuve: d.preuve || null,
    detenteur: d.detenteur || null,
    /* L'entreprise a été retirée par l'administration et reste réservée
       (section 45.3) : celui qui accepte doit savoir qu'il la rend. */
    reserveeLe: d.reservee_le || null,
  }));
}

async function demandesProAdminDemo() { return []; }

export const demandesProAdmin = hasSupabase ? demandesProAdminSupabase : demandesProAdminDemo;

async function traiterDemandeProSupabase(id, decision, note) {
  const { data, error } = await supabase.rpc('admin_traiter_demande_pro', {
    p_id: id, p_decision: decision, p_note: note || null,
  });
  if (error) throw error;
  return data;
}

export const traiterDemandePro = hasSupabase ? traiterDemandeProSupabase : refuseEnDemo;

async function retirerEntrepriseSupabase(proId, motif) {
  const { data, error } = await supabase.rpc('admin_retirer_entreprise', {
    p_pro: proId, p_motif: motif || null,
  });
  if (error) throw error;
  return data;
}

export const retirerEntreprise = hasSupabase ? retirerEntrepriseSupabase : refuseEnDemo;
