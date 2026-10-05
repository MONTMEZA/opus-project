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
  initialDemandes, initialAnnonces, initialDemandesRecues,
} from '../data/demo';
import { METIER_PAR_DEFAUT } from './metiers';
/* En HAUT, jamais en `await import()` : la règle du 01/10 — Metro découpe
   alors le paquet et va chercher le morceau manquant auprès du serveur de
   développement, au moment où la ligne s'exécute. */
import { envoyerFichier } from './storage';
import { morceauDeChemin } from './types-fichiers';
import { reduireImage, TAILLE_MAX_MO } from './media';

export const mode = hasSupabase ? 'supabase' : 'demo';

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
    return { ...locale, userType: (data && data.type) || locale.userType };
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
  email, password, userType, nom, entreprise, metiers, ville, cguVersion,
}) {
  if (!hasSupabase) { currentUserId = 'demo-user'; return { session: true }; }

  const metadonnees = { type: userType, nom: nom.trim() };
  if (cguVersion) metadonnees.cgu = cguVersion;
  if (userType === 'pro') {
    if (entreprise) metadonnees.entreprise = entreprise.trim();
    if (metiers && metiers.length) metadonnees.metiers = metiers.slice(0, 4);
    if (ville) metadonnees.ville = ville;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: metadonnees },
  });
  if (error) throw error;

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
  return { userType: (fiche && fiche.type) || 'particulier' };
}

/**
 * Crée la fiche professionnelle si elle n'existe pas encore.
 * Appelée juste après l'inscription d'un pro : sans elle, l'artisan n'a
 * pas de profil public et n'apparaît nulle part.
 */
export async function ensureProProfile({
  entreprise, metier, metiers, ville, nom, codePostal, codeInsee, latitude, longitude,
}) {
  if (!hasSupabase) return null;

  /* La ligne ENTIÈRE, et pas seulement `id` : `reparerFichePro()` la rend
     aux écrans par `rowToPro()`, qui a besoin de toutes les colonnes. Avec
     un `select('id')`, une fiche déjà présente ressortait comme une fiche
     vide — sans erreur, ce qui est le pire des deux.

     `'*'` et non `COLONNES_PRO_LISTE` : cette constante est déclarée plus
     bas dans le fichier, et ce projet a déjà perdu une soirée sur un écran
     blanc pour une `const` lue avant sa déclaration. C'est MA fiche, une
     seule ligne, sur un chemin de rattrapage : le poids ne compte pas. */
  const { data: existante } = await supabase.from('professional_profiles')
    .select('*').eq('id', currentUserId).maybeSingle();
  if (existante) return existante;

  const { data, error } = await supabase.from('professional_profiles').insert({
    id: currentUserId,
    nom: nom || '',
    entreprise: entreprise || 'Mon entreprise',
    metier: metier || (metiers && metiers[0]) || METIER_PAR_DEFAUT,
    metiers: (metiers && metiers.length ? metiers : [metier || METIER_PAR_DEFAUT]),
    ville: ville || '',
    code_postal: codePostal || null,
    code_insee: codeInsee || null,
    latitude: latitude || null,
    longitude: longitude || null,
    verification_statut: 'non_soumis',
  }).select().single();
  if (error) throw error;
  return data;
}

/**
 * Envoi des justificatifs. Le profil passe en « en attente » : c'est VOUS
 * qui basculerez verification_statut sur 'verifie' depuis Supabase, après
 * avoir regardé les documents. Le badge vérifié ne s'obtient pas tout seul.
 */
export async function submitDocuments({ kbisPath, assurancePath, rgePath, rge }) {
  if (!hasSupabase) return null;
  const patch = { verification_statut: 'en_attente' };
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

  const { error } = await supabase.from('professional_profiles')
    .update(patch).eq('id', currentUserId);
  if (error) throw error;
}

/**
 * Recrée la fiche professionnelle d'un compte qui n'en a pas.
 *
 * POUR QUI : les comptes créés AVANT le lot du 05/10/2026, et ceux d'une
 * base où la section 31 n'a pas encore été rejouée — « l'application peut
 * prendre de l'avance sur la base », et c'est déjà arrivé six fois.
 *
 * Les informations sont lues dans les métadonnées du compte, là où
 * `signUp()` les a rangées. Un compte plus ancien n'en a pas : la fiche
 * naît alors avec les valeurs par défaut, et l'artisan la complète dans
 * « Modifier mon profil ». Une fiche à compléter vaut mieux qu'un compte
 * qui n'existe nulle part.
 */
export async function reparerFichePro() {
  if (!hasSupabase) return null;
  const { data } = await supabase.auth.getUser();
  const meta = (data && data.user && data.user.user_metadata) || {};
  const liste = Array.isArray(meta.metiers) ? meta.metiers.slice(0, 4) : null;
  const ligne = await ensureProProfile({
    entreprise: meta.entreprise,
    metiers: liste,
    metier: liste ? liste[0] : null,
    ville: meta.ville,
    nom: meta.nom,
  });
  return ligne ? rowToPro(ligne) : null;
}

export function getUserId() { return currentUserId; }

/** Ferme la session. En mode démo, il n'y a rien à fermer côté serveur. */
export async function signOut() {
  if (hasSupabase && supabase) await supabase.auth.signOut();
  currentUserId = null;
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
  'experience_annees', 'siret', 'followers_count',
  'assurance_valide', 'assurance_expire', 'kbis_valide', 'kbis_maj',
  'avatar_url', 'banner_url', 'kbis_url', 'assurance_url',
  'verification_statut', 'verification_note', 'verifie_le',
  'code_postal', 'latitude', 'longitude',
  'avis_count', 'note_delais', 'note_qualite', 'note_tarif',
  /* La fiche de contact : téléphone, zone d'intervention, spécialités.
     Elles sont courtes et s'affichent dans les listes de la Place des
     pros, donc elles voyagent avec le reste. */
  'telephone', 'email_pro', 'zone_km', 'specialites', 'horaires',
  /* La certification RGE. `rge` est la seule vérifiée ; les trois autres
     sont ce que l'artisan a déclaré, et n'affichent pas de badge. */
  'rge', 'rge_declare', 'rge_numero', 'rge_expire', 'rge_url',
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
    siret: row.siret || '',
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

/** Temps relatif simple, comme "Il y a 2 h" dans le prototype. */
export function relativeTime(iso) {
  if (!iso) return "À l'instant";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Hier';
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

/**
 * Charge tout ce dont l'app a besoin au démarrage.
 * Retourne toujours la même forme, quel que soit le mode.
 */
export async function loadAll() {
  if (!hasSupabase) {
    // En démonstration, l'état de vérification découle du drapeau `verifie`
    // des données d'exemple : un pro vérifié n'a pas de rappel à voir.
    const pros = JSON.parse(JSON.stringify(demoPros));
    Object.values(pros).forEach((p) => {
      p.verificationStatut = p.verifie ? 'verifie' : 'non_soumis';
    });
    return {
      pros,
      posts: initialPosts.slice(0, TAILLE_PAGE_FIL).map((p, i) => ({
        ...p,
        comments: p.comments ? [...p.comments] : [],
        nbCommentaires: p.comments ? p.comments.length : 0,
        curseur: String(i + 1),
      })),
      finDuFil: initialPosts.length <= TAILLE_PAGE_FIL,
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
      mesSos: null,
      notifications: initialNotifications.map((n) => ({ ...n })),
      followingIds: [4],
      savedIds: [],
      monCompte: { nom: 'Vous', ville: '', telephone: '', avatarUrl: null },
      // En démo, une demande en attente pour montrer le mécanisme.
      demandesPartenariat: [3],
      partenariatsEnvoyes: [5],
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
         demandesRes, reponsesRes, masosRes, moiRes, vuesRes] = await Promise.all([
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
    supabase.from('posts').select('*')
      .order('created_at', { ascending: false }).limit(TAILLE_PAGE_FIL),
    supabase.from('post_likes').select('post_id').eq('user_id', uid),
    supabase.from('saved_posts').select('post_id').eq('user_id', uid),
    supabase.from('follows').select('following_id').eq('follower_id', uid),
    /* La liste des conversations en UNE requête : interlocuteur, dernier
       message et nombre de non-lus. Avant, on téléchargeait TOUS les
       messages de TOUTES les conversations juste pour afficher un aperçu. */
    supabase.rpc('mes_conversations'),
    supabase.from('notifications').select('*, acteur:acteur_id(nom, avatar_url)').eq('user_id', uid).order('created_at', { ascending: false }),
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
    supabase.from('demande_reponses').select('demande_id'),
    supabase.from('sos_availability').select('*').eq('professional_id', uid).maybeSingle(),
    /* Ma propre fiche, avec mon téléphone — que `select *` ne sait plus
       lire depuis que ces colonnes sont fermées à tout le monde (section
       18 de schema.sql). La fonction, elle, ne renvoie QUE ma ligne. */
    supabase.rpc('mon_compte').maybeSingle(),
    /* MA date de dernière visite de l'onglet Demandes, et la mienne seule :
       elle ne sert qu'à moi, et l'ajouter à `COLONNES_PRO_LISTE` la ferait
       voyager pour les cinq cents autres artisans. La requête part en
       parallèle des autres : elle ne coûte pas une attente de plus. */
    supabase.from('professional_profiles')
      .select('demandes_vues_le').eq('id', uid).maybeSingle(),
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
  (partnersRes.data || []).forEach((p) => {
    if (p.statut === 'accepte') {
      if (!partnersByPro[p.professional_id]) partnersByPro[p.professional_id] = [];
      if (!partnersByPro[p.partner_id]) partnersByPro[p.partner_id] = [];
      partnersByPro[p.professional_id].push(p.partner_id);
      partnersByPro[p.partner_id].push(p.professional_id);
    } else if (p.statut === 'en_attente') {
      if (p.partner_id === uid) demandesRecues.push(p.professional_id);
      else if (p.professional_id === uid) demandesEnvoyees.push(p.partner_id);
    }
  });

  const pros = {};
  (profilesRes.data || []).forEach((row) => {
    /* Liste vide, pas `null` : « aucun avis chargé » se comporte comme
       « aucun avis » pour l'affichage, et avgReviews() se rabat alors sur
       la moyenne tenue par la base. */
    pros[row.id] = rowToPro(row, [], partnersByPro[row.id] || []);
  });

  const likedSet = new Set((likesRes.data || []).map((l) => l.post_id));

  /* Première page du fil. `null` pour les commentaires : « pas encore
     chargés », à distinguer de « chargés, aucun ». */
  const posts = (postsRes.data || []).map((p) => rowToPost(p, likedSet, null));
  const finDuFil = (postsRes.data || []).length < TAILLE_PAGE_FIL;

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

  // Nombre de réponses par demande, compté ici plutôt qu'en interrogeant
  // la base une fois par demande.
  const nbReponses = {};
  (reponsesRes.data || []).forEach((r) => {
    nbReponses[r.demande_id] = (nbReponses[r.demande_id] || 0) + 1;
  });

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
    reponses: nbReponses[d.id] || 0,
    budget: d.budget || null,
    urgence: d.urgence || 'quand_possible',
  }));

  const ligne = masosRes.data;
  const mesSos = ligne ? {
    actif: ligne.actif,
    metierKey: ligne.metier_key,
    deplacement: Number(ligne.deplacement),
    horaire: Number(ligne.horaire),
    majoration: ligne.majoration,
    rayonKm: ligne.rayon_km,
    delaiMinutes: ligne.delai_minutes,
  } : null;

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
    notifications: (notifRes.data || []).map((n) => ({
      id: n.id, texte: n.texte, lue: n.lue, type: n.type || 'info',
      postId: n.post_id || null, commentId: n.comment_id || null,
      acteurId: n.acteur_id || null,
      avatarUrl: n.acteur ? n.acteur.avatar_url : null,
      time: relativeTime(n.created_at),
    })),
    followingIds: (followsRes.data || []).map((f) => f.following_id),
    savedIds: (savesRes.data || []).map((s) => s.post_id),
    finDuFil,
  };
}

/**
 * La fiche COMPLÈTE d'un artisan, à l'ouverture de son profil : sa
 * présentation, ses réalisations, et ses avis.
 *
 * Ces trois choses ne servent nulle part ailleurs. Les charger pour tout le
 * monde à chaque ouverture de l'application, c'était télécharger cinq cents
 * portfolios pour en regarder un.
 */
async function profilProDeSupabase(id) {
  const [ficheRes, avisRes] = await Promise.all([
    supabase.from('professional_profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('reviews').select('*, users:author_id(nom)')
      .eq('professional_id', id).order('created_at', { ascending: false }),
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
  return { fiche: ficheRes.data, avis };
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
function postDemo(p, rang) {
  const commentaires = p.comments ? p.comments.slice() : [];
  return Object.assign({}, p, {
    comments: commentaires,
    nbCommentaires: commentaires.length,
    curseur: String(rang),
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
    };
  }
  return {
    id: p.id, type: 'post', proId: p.author_id, time: relativeTime(p.created_at),
    // « type » dit si c'est une publication ou une publicité ; « format »
    // dit ce qu'on regarde. Les deux étaient confondus, si bien qu'une
    // photo se retrouvait dans le fil des vidéos.
    format: p.type || 'photo',
    texte: p.texte, media: p.media,
    medias: (p.medias && p.medias.length) ? p.medias : (p.media ? [p.media] : []),
    musique: p.musique || null,
    // Le montage assemblé en un seul fichier, quand Cloudinary l'a fabriqué.
    montageUrl: p.montage_url || null,
    likes: p.likes_count || 0,
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

/** Le fil en mode démonstration : on découpe la liste en mémoire. */
async function pageFilDemo(options = {}) {
  const depart = options.curseur ? Number(options.curseur) : 0;
  const page = initialPosts
    .slice(depart, depart + TAILLE_PAGE_FIL)
    .map((p, i) => postDemo(p, depart + i + 1));
  return { posts: page, fin: depart + TAILLE_PAGE_FIL >= initialPosts.length };
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
  let requete = supabase.from('posts').select('*')
    .order('created_at', { ascending: false })
    .limit(TAILLE_PAGE_FIL);
  if (curseur) requete = requete.lt('created_at', curseur);

  const reponse = await requete;
  if (reponse.error) throw reponse.error;

  const lignes = reponse.data || [];
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
    fin: lignes.length < TAILLE_PAGE_FIL,
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
      .select('*, users:author_id(nom, avatar_url, type)')
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
      avatarUrl: c.users ? c.users.avatar_url : null,
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

export const setLike = !hasSupabase ? noop : async (postId, liked) => {
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

export const setFollow = !hasSupabase ? noop : async (proId, following) => {
  if (following) {
    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: proId });
  } else {
    await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', proId);
  }
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
}) => {
  const { data, error } = await supabase.from('posts')
    .insert({
      author_id: currentUserId, type, texte, media,
      medias, musique, montage_url: montageUrl, metier, ville,
    })
    .select().single();
  if (error) throw error;
  return data;
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

/** Les trois genres, et ce qu'ils valent côté base. */
export const GENRES_DEMANDE = {
  devis:  { table: 'quote_requests',    accepte: 'accepte',  refuse: 'refuse',  termine: 'termine' },
  rappel: { table: 'callback_requests', accepte: 'accepte',  refuse: 'refuse',  termine: 'termine' },
  /* Les urgences accordent leurs participes : 'acceptee', 'refusee'. On ne
     les aligne PAS — des lignes existent déjà, et la contrainte `check` de
     la table les impose. On traduit ici, une fois pour toutes. */
  sos:    { table: 'sos_requests',      accepte: 'acceptee', refuse: 'refusee', termine: 'termine' },
};

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

async function repondreDemandeDemo(genre, id, statut) {
  const d = DEMANDES_RECUES_DEMO.find((x) => x.id === id);
  if (d) d.statut = (GENRES_DEMANDE[genre] || {})[statut] || statut;
  return { id, statut };
}

async function repondreDemandeSupabase(genre, id, statut) {
  const regles = GENRES_DEMANDE[genre];
  if (!regles) throw new Error(`Genre de demande inconnu : ${genre}`);
  const valeur = regles[statut];
  if (!valeur) throw new Error(`Réponse inconnue : ${statut}`);
  const { error } = await supabase.from(regles.table)
    .update({ statut: valeur })
    .eq('id', id)
    .eq('professional_id', currentUserId);
  if (error) throw error;
  return { id, statut: valeur };
}

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
      siret: profil.siret,
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
 * Disponibilité aux urgences d'un artisan : l'interrupteur « je réponds aux
 * urgences » et les trois chiffres qui servent à calculer la fourchette.
 */
export const updateSosAvailability = !hasSupabase ? noop : async (sos) => {
  if (!sos) return;
  const { error } = await supabase.from('sos_availability').upsert({
    professional_id: currentUserId,
    metier_key: sos.metierKey,
    actif: sos.actif,
    deplacement: sos.deplacement,
    horaire: sos.horaire,
    majoration: sos.majoration,
    rayon_km: sos.rayonKm,
    delai_minutes: sos.delaiMinutes || 45,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'professional_id,metier_key' });
  if (error) throw error;
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

/** Un professionnel répond à une demande. */
export const repondreADemande = !hasSupabase ? noop : async (demandeId, message) => {
  const { error } = await supabase.from('demande_reponses').upsert(
    { demande_id: demandeId, professional_id: currentUserId, message: message || null },
    { onConflict: 'demande_id,professional_id' },
  );
  if (error) throw error;
};

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
async function reponsesAnnonceDemo() { return []; }

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
 * Les artisans disponibles autour d'une urgence.
 * Le tri par distance et le filtrage par rayon d'intervention sont faits
 * par la base (fonction artisans_urgence), pas par le téléphone.
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
  return (data || []).map((a) => ({
    proId: a.professional_id,
    metierKey,
    deplacement: Number(a.deplacement),
    horaire: Number(a.horaire),
    majoration: a.majoration,
    delaiMin: a.delai_minutes,
    distanceKm: a.distance,
    actif: true,
  }));
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
export const createSosRequest = !hasSupabase ? noop : async (d) => {
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
export const demanderPartenariat = !hasSupabase ? noop : async (partnerId) => {
  const { error } = await supabase.from('professional_partners').insert({
    professional_id: currentUserId, partner_id: partnerId, statut: 'en_attente',
  });
  if (error) throw error;
};

/** Répondre à une demande reçue. Seul le destinataire y parvient. */
export const repondrePartenariat = !hasSupabase ? noop : async (demandeurId, accepte) => {
  const { error } = await supabase.from('professional_partners')
    .update({ statut: accepte ? 'accepte' : 'refuse', repondu_le: new Date().toISOString() })
    .eq('professional_id', demandeurId).eq('partner_id', currentUserId);
  if (error) throw error;
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

    try {
      const { error } = await supabase.functions.invoke('compte', {
        body: { action: 'supprimer' },
      });
      if (error) throw error;
    } catch (e) {
      await supabase.auth.signOut();
      currentUserId = null;
      const err = new Error(
        'Vos données ont bien été supprimées, mais le compte de connexion n’a '
        + 'pas pu être fermé. Écrivez-nous et nous le ferons sous 48 heures.',
      );
      err.partiel = true;
      err.resume = resume;
      throw err;
    }

    await supabase.auth.signOut();
    currentUserId = null;
    return { supprime: true, resume };
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
  return (data || []).map((p) => ({
    id: p.id,
    entreprise: p.entreprise,
    nom: p.nom,
    ville: p.ville,
    siret: p.siret,
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

async function verifierProSupabase({ id, kbis, assurance, rge = null, note = null }) {
  const { error } = await supabase.rpc('admin_verifier_pro', {
    p_pro: id, p_kbis: !!kbis, p_assurance: !!assurance, p_rge: rge, p_note: note,
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
