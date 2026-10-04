/**
 * Les textes légaux : mentions, conditions d'utilisation, confidentialité.
 *
 * POURQUOI ILS SONT ICI ET PAS SUR UN SITE
 * ----------------------------------------
 * Apple et Google exigent que ces textes soient accessibles DEPUIS
 * l'application, sans compte et sans connexion. Un lien vers un site qui
 * tombe en panne fait refuser la mise à jour. Les garder dans le code, c'est
 * aussi les versionner avec le reste : on sait quel texte était affiché à
 * quelle date.
 *
 * ⚠️  CE QUI DOIT ÊTRE COMPLÉTÉ AVANT TOUTE PUBLICATION
 * ----------------------------------------------------
 * `EDITEUR` ci-dessous contient des trous. Ce ne sont pas des oublis : ce
 * sont des informations que SEUL le propriétaire connaît (forme juridique,
 * SIREN, adresse, hébergeur exact). Les inventer serait une faute — une
 * mention légale fausse engage la responsabilité de celui qui la publie.
 *
 * Tant que `editeurComplet()` renvoie faux, l'écran affiche un bandeau
 * d'avertissement bien visible. C'est volontaire : un texte légal à moitié
 * rempli qui passe inaperçu est le pire des deux mondes.
 */

/**
 * La VERSION des conditions. Elle est consignée dans `users.cgu_version`
 * quand quelqu'un accepte.
 *
 * Sans elle, la trace ne vaut rien : on saurait que la personne a accepté
 * « quelque chose », sans savoir quoi. À changer à chaque modification de
 * fond des textes ci-dessous.
 */
export const VERSION = '2026-09-29';

/**
 * OÙ EN EST LE PROJET, JURIDIQUEMENT.
 *
 * Ce n'est pas un détail de présentation : ce que la loi exige d'afficher
 * dépend entièrement de ce champ. Écrire des mentions de société quand on
 * n'en a pas est aussi faux que de n'en écrire aucune.
 *
 *   'essai'      — l'application n'est PAS ouverte au public. Elle tourne sur
 *                  le téléphone du propriétaire, ou auprès de quelques
 *                  testeurs invités (TestFlight interne, canal fermé Google
 *                  Play). Il n'y a alors rien à publier : les mentions
 *                  légales s'adressent au public, et il n'y a pas de public.
 *                  C'est l'état actuel.
 *
 *   'particulier'— publiée, mais à titre NON PROFESSIONNEL : aucune recette,
 *                  aucune intention commerciale. La loi (LCEN, article 6-III-2)
 *                  permet alors de ne pas exposer son nom ni son adresse au
 *                  public, À CONDITION de les avoir communiqués à
 *                  l'hébergeur. Les mentions ne nomment que l'hébergeur.
 *
 *   'micro'      — micro-entrepreneur. Nom, SIRET et adresse deviennent
 *                  obligatoires et publics. Pas de forme juridique ni de
 *                  capital : une entreprise individuelle n'en a pas.
 *
 *   'societe'    — SAS, SARL… Tout devient obligatoire, capital et directeur
 *                  de la publication compris.
 *
 * ⚠️  LE PASSAGE DE 'essai' À AUTRE CHOSE N'EST PAS AUTOMATIQUE.
 * Dès qu'Opus est ouverte au public ET qu'elle peut rapporter de l'argent
 * (annonces de fournisseurs, publicité, abonnement), l'activité devient
 * professionnelle : 'particulier' ne suffit plus, il faut un SIRET.
 */
export const STATUT = 'essai';

/**
 * À remplir selon le STATUT ci-dessus. Les valeurs nulles font apparaître
 * l'avertissement dans l'application.
 */
export const EDITEUR = {
  // Statuts 'particulier', 'micro' et 'societe'
  denomination: null,      // « Dylan Montmeza » ou « Opus SAS »
  // Statut 'societe' seulement
  formeJuridique: null,    // ex. « SAS au capital de 1 000 € »
  directeurPublication: null,
  // Statuts 'micro' et 'societe'
  siren: null,             // SIREN (9 chiffres) ou SIRET (14)
  adresse: null,
  // Toujours : c'est par là qu'on signale et qu'on exerce ses droits.
  // À VÉRIFIER : cette adresse doit exister et être relevée.
  email: 'contact@opus-project.fr',
  /**
   * Statut 'particulier' : la loi ne dispense d'afficher son identité que si
   * on l'a REMISE à l'hébergeur. Tant que ce n'est pas fait, la dispense ne
   * s'applique pas — d'où ce drapeau, qu'on ne coche qu'une fois la chose
   * faite (Supabase → Support, ou les informations de facturation du compte).
   */
  identiteRemiseALHebergeur: false,
  hebergeur: {
    nom: 'Supabase Inc.',
    adresse: '970 Toa Payoh North, #07-04, Singapour 318992',
    site: 'https://supabase.com',
    /**
     * Relevé directement dans le projet Supabase : `eu-west-2`, c'est-à-dire
     * LONDRES.
     *
     * ⚠️  Londres n'est plus dans l'Union européenne. Les données y sont
     * transférées au titre de la décision d'adéquation de la Commission
     * européenne concernant le Royaume-Uni — transfert donc autorisé, sans
     * formalité supplémentaire, mais cette décision est renouvelée
     * périodiquement : à revérifier avant l'ouverture au public.
     *
     * Le plus simple resterait d'héberger DANS l'Union (Supabase propose
     * Paris, `eu-west-3`, et Francfort, `eu-central-1`). Changer de région
     * impose de recréer le projet et de tout transférer : c'est aujourd'hui,
     * avec presque aucune donnée, que ça coûte le moins cher.
     */
    region: 'eu-west-2 (Londres, Royaume-Uni)',
  },
};

/**
 * Ce que chaque statut exige RÉELLEMENT. Une seule table, pour que la
 * question « qu'est-ce qui me manque ? » ait une réponse unique.
 */
const EXIGENCES = {
  essai: [],
  particulier: [
    ['hebergeur.region', 'la région d’hébergement Supabase'],
    ['identiteRemiseALHebergeur',
      'la confirmation que votre identité a été communiquée à l’hébergeur '
      + '(sans elle, la dispense d’anonymat ne s’applique pas)'],
  ],
  micro: [
    ['denomination', 'votre nom et prénom'],
    ['siren', 'votre numéro SIRET'],
    ['adresse', 'l’adresse de l’entreprise'],
    ['hebergeur.region', 'la région d’hébergement Supabase'],
  ],
  societe: [
    ['denomination', 'la dénomination sociale'],
    ['formeJuridique', 'la forme juridique et le capital'],
    ['siren', 'le numéro SIREN ou SIRET'],
    ['adresse', 'l’adresse du siège'],
    ['directeurPublication', 'le directeur de la publication'],
    ['hebergeur.region', 'la région d’hébergement Supabase'],
  ],
};

function valeurDe(chemin) {
  return chemin.split('.').reduce((o, cle) => (o ? o[cle] : null), EDITEUR);
}

/** Ce qui manque POUR LE STATUT ACTUEL, et rien d'autre. */
export function manquesEditeur() {
  return (EXIGENCES[STATUT] || EXIGENCES.societe)
    .filter(([chemin]) => !valeurDe(chemin))
    .map(([, libelle]) => libelle);
}

export function editeurComplet() {
  return manquesEditeur().length === 0;
}

/**
 * Le rappel affiché en tête des textes, même quand rien ne manque.
 *
 * En statut 'essai', rien ne manque — et c'est justement là qu'un mot
 * d'avertissement est le plus utile : tout est en ordre POUR UN ESSAI, et
 * seulement pour un essai. Sans cette phrase, on croirait le sujet réglé.
 */
export function rappelStatut() {
  if (STATUT === 'essai') {
    return 'Application en essai — non ouverte au public. Avant la première '
      + 'mise en ligne sur l’App Store ou Google Play, changez STATUT dans '
      + 'src/data/legal.js : la loi exigera alors votre identité, et un SIRET '
      + 'dès que l’application pourra rapporter de l’argent.';
  }
  if (STATUT === 'particulier') {
    return 'Publication à titre non professionnel. Cette dispense tombe dès '
      + 'qu’Opus rapporte de l’argent — annonce de fournisseur, publicité, '
      + 'abonnement : il faut alors un SIRET et le statut « micro ».';
  }
  return null;
}

const ou = (valeur, defaut) => valeur || defaut;

/* ------------------------------------------------------------------ */
/*  1. MENTIONS LÉGALES                                                */
/*                                                                     */
/*  Elles changent AVEC LE STATUT. Une entreprise individuelle n'a ni   */
/*  forme juridique ni capital : afficher « SAS au capital de… » quand  */
/*  on est micro-entrepreneur est aussi faux que de ne rien afficher.   */
/* ------------------------------------------------------------------ */

function blocEditeur() {
  if (STATUT === 'essai') {
    return {
      titre: 'Éditeur',
      texte: "Opus est en cours de développement et n'est pas ouverte au "
        + 'public. Elle est utilisée par son auteur et par quelques testeurs '
        + "invités.\n\nLes mentions légales complètes — identité de l'éditeur, "
        + 'numéro d’immatriculation, directeur de la publication — seront '
        + "renseignées avant la première mise en ligne publique.\n\n"
        + `Contact : ${EDITEUR.email}`,
    };
  }

  if (STATUT === 'particulier') {
    return {
      titre: 'Éditeur',
      texte: "Opus est éditée à titre NON PROFESSIONNEL par une personne "
        + 'physique. Conformément à l’article 6-III-2 de la loi pour la '
        + 'confiance dans l’économie numérique, son identité n’est pas '
        + 'publiée ici : elle a été communiquée à l’hébergeur, qui la tient '
        + `à la disposition de l’autorité judiciaire.\n\n`
        + `Contact : ${EDITEUR.email}`,
    };
  }

  if (STATUT === 'micro') {
    return {
      titre: 'Éditeur',
      texte: `${ou(EDITEUR.denomination, '[à compléter : nom et prénom]')}\n`
        + `Entrepreneur individuel (micro-entreprise)\n`
        + `SIRET ${ou(EDITEUR.siren, '[à compléter]')}\n`
        + `${ou(EDITEUR.adresse, '[à compléter : adresse]')}\n`
        + `Contact : ${EDITEUR.email}`,
    };
  }

  return {
    titre: 'Éditeur',
    texte: `${ou(EDITEUR.denomination, '[à compléter : dénomination]')}\n`
      + `${ou(EDITEUR.formeJuridique, '[à compléter : forme juridique]')}\n`
      + `SIREN ${ou(EDITEUR.siren, '[à compléter]')}\n`
      + `${ou(EDITEUR.adresse, '[à compléter : adresse du siège]')}\n`
      + `Contact : ${EDITEUR.email}`,
  };
}

const BLOC_DIRECTEUR = STATUT === 'societe'
  ? [{
    titre: 'Directeur de la publication',
    texte: ou(EDITEUR.directeurPublication, '[à compléter]'),
  }]
  : [];

export const MENTIONS = [
  blocEditeur(),
  ...BLOC_DIRECTEUR,
  {
    titre: 'Hébergement',
    texte: `${EDITEUR.hebergeur.nom}\n${EDITEUR.hebergeur.adresse}\n`
      + `${EDITEUR.hebergeur.site}\n`
      + `Données hébergées dans la région : ${ou(EDITEUR.hebergeur.region, '[à compléter]')}.`,
  },
  {
    titre: 'Propriété intellectuelle',
    texte: "Le nom Opus, son identité visuelle et le code de l'application "
      + "appartiennent à l'éditeur. Les photos, vidéos et textes publiés par "
      + 'les utilisateurs restent la propriété de leurs auteurs : Opus ne '
      + "reçoit qu'une autorisation de les afficher dans l'application, le "
      + 'temps qu’ils y sont publiés.',
  },
  {
    titre: 'Signaler un contenu',
    texte: "Chaque publication, commentaire, message, profil, demande et "
      + 'annonce porte un bouton de signalement. Les signalements sont '
      + 'examinés sous 48 heures. Vous pouvez aussi écrire à '
      + EDITEUR.email + '.',
  },
];

/* ------------------------------------------------------------------ */
/*  2. CONDITIONS GÉNÉRALES D'UTILISATION                              */
/* ------------------------------------------------------------------ */

export const CGU = [
  {
    titre: "Ce qu'est Opus",
    texte: "Opus met en relation des professionnels du bâtiment entre eux, et "
      + 'avec des particuliers. Opus n’est ni une entreprise de travaux, ni un '
      + "intermédiaire au contrat : les devis, les chantiers, les paiements et "
      + 'les litiges se règlent directement entre les personnes concernées. '
      + "Opus ne perçoit aucune commission sur les chantiers et n'en est jamais "
      + 'partie.',
  },
  {
    titre: 'Qui peut s’inscrire',
    texte: 'Il faut avoir 18 ans révolus. Un compte professionnel suppose une '
      + 'activité réellement déclarée : les publications dans le fil sont '
      + "réservées aux comptes professionnels. Un particulier peut aimer, "
      + 'commenter, partager et publier des demandes de travaux.',
  },
  {
    titre: 'Le badge vérifié',
    /* CE TEXTE A ÉTÉ CORRIGÉ LE 04/10/2026, et c'était une vraie
       incohérence : il promettait un badge « après contrôle d'un Kbis et
       d'une décennale ». Un micro-entrepreneur n'a pas de Kbis, un avocat
       pas de décennale — les CGU excluaient donc du badge des gens que
       l'application accepte d'inscrire. Deux documents, oui ; mais lesquels
       dépend du métier (`src/data/pieces-justificatives.js`). */
    texte: "Le badge n'est accordé qu'après contrôle humain de deux pièces : "
      + "un justificatif d'existence légale de l'entreprise (extrait Kbis, ou "
      + 'avis de situation au répertoire SIRENE pour un micro-entrepreneur) '
      + "et une attestation d'assurance adaptée au métier exercé — garantie "
      + 'décennale pour les activités de construction, responsabilité civile '
      + "professionnelle pour les activités de conseil. Il dit que ces "
      + "documents ont été vus, et rien d'autre : il ne garantit ni la "
      + "qualité d'un chantier, ni le respect d'un délai. Un badge obtenu "
      + 'avec de faux documents entraîne la fermeture immédiate du compte.',
  },
  {
    titre: 'Ce que vous publiez',
    texte: 'Vous restez propriétaire de vos photos, vidéos et textes. En les '
      + "publiant, vous autorisez Opus à les afficher dans l'application. Vous "
      + 'garantissez que vous en avez le droit : publier les photos de chantier '
      + "d'un confrère comme si c'étaient les vôtres est une contrefaçon, et "
      + "un motif de signalement à part entière.",
  },
  {
    titre: 'Ce qui est interdit',
    texte: 'Se faire passer pour quelqu’un d’autre ou pour une entreprise qui '
      + "n'est pas la sienne. Proposer des travaux sans assurance ni facture. "
      + 'Insulter, menacer, harceler. Publier du contenu sexuel ou violent. '
      + 'Publier des photos qui ne sont pas les siennes. Collecter les '
      + 'coordonnées des autres utilisateurs pour les démarcher ailleurs.',
  },
  {
    titre: 'Modération',
    texte: 'Tout contenu peut être signalé. Les signalements sont examinés '
      + 'sous 48 heures. Un contenu contraire à ces conditions est retiré, et '
      + "son auteur averti ; en cas de récidive ou de faute grave, le compte "
      + 'est fermé. Vous pouvez contester une décision en écrivant à '
      + EDITEUR.email + '.',
  },
  {
    titre: 'Bloquer quelqu’un',
    texte: 'Bloquer une personne masque ses contenus des deux côtés et empêche '
      + 'tout message entre vous. Le blocage se retire quand vous le '
      + 'souhaitez, depuis Profil → Confidentialité et sécurité.',
  },
  {
    titre: 'Fermer son compte',
    texte: 'Vous pouvez supprimer votre compte à tout moment depuis '
      + 'l’application, sans avoir à le demander à qui que ce soit. Vos '
      + 'données sont effacées. Les avis et commentaires que vous avez laissés '
      + 'chez d’autres sont conservés mais détachés de votre nom : les '
      + 'supprimer reviendrait à modifier l’historique de quelqu’un qui n’a '
      + 'rien demandé.',
  },
  {
    titre: 'Responsabilité',
    texte: "Opus fournit un service en l'état et met tout en œuvre pour qu'il "
      + 'fonctionne, sans garantir une disponibilité ininterrompue. Opus n’est '
      + 'pas responsable des travaux réalisés, des devis émis, ni des '
      + 'différends entre utilisateurs.',
  },
  {
    titre: 'Droit applicable',
    texte: 'Ces conditions sont soumises au droit français. En cas de '
      + 'difficulté, adressez-vous d’abord à ' + EDITEUR.email + ' : la plupart '
      + 'des différends se règlent ainsi. À défaut, les tribunaux français sont '
      + 'compétents. Un consommateur peut saisir gratuitement un médiateur de '
      + 'la consommation.',
  },
];

/* ------------------------------------------------------------------ */
/*  3. POLITIQUE DE CONFIDENTIALITÉ                                    */
/* ------------------------------------------------------------------ */

export const CONFIDENTIALITE = [
  {
    titre: 'Qui traite vos données',
    texte: STATUT === 'essai'
      ? "Opus est en cours de développement et n'est pas ouverte au public. "
        + "Le responsable du traitement est l'auteur de l'application ; son "
        + 'identité complète sera publiée ici avant la première mise en ligne '
        + `publique.\n\nPour toute question sur vos données : ${EDITEUR.email}.`
      : STATUT === 'particulier'
        ? 'Opus est éditée à titre non professionnel par une personne '
          + 'physique, dont l’identité a été communiquée à l’hébergeur. '
          + `Pour toute question sur vos données : ${EDITEUR.email}.`
        : `${ou(EDITEUR.denomination, '[à compléter : dénomination]')}, `
          + `${ou(EDITEUR.adresse, '[à compléter : adresse]')}. `
          + `Pour toute question sur vos données : ${EDITEUR.email}.`,
  },
  {
    titre: 'Ce que nous collectons',
    texte: 'Votre adresse électronique et votre mot de passe (chiffré : '
      + 'personne, chez Opus, ne peut le lire). Votre nom, votre ville et '
      + 'votre code postal. Les coordonnées géographiques APPROXIMATIVES de '
      + 'votre commune — celles de la mairie, pas de votre domicile — qui '
      + 'servent au tri par distance. Votre téléphone, si vous le renseignez. '
      + 'Vos photos, vidéos, textes, commentaires, avis, messages, demandes et '
      + 'annonces. Pour un compte professionnel : votre justificatif '
      + 'd’existence légale et votre attestation d’assurance.',
  },
  {
    titre: 'Ce que nous ne collectons pas',
    texte: 'Aucune publicité ciblée, aucun traceur publicitaire, aucun outil '
      + 'de mesure d’audience tiers. Opus ne vend ni ne loue vos données à '
      + 'personne. Votre position exacte n’est jamais relevée : seule la '
      + 'commune que vous saisissez est utilisée.',
  },
  {
    titre: 'Vos documents professionnels',
    texte: 'Le Kbis et l’attestation d’assurance sont rangés dans un espace '
      + 'PRIVÉ, protégé par des règles d’accès côté serveur. Ils ne sont '
      + 'jamais affichés publiquement et servent uniquement au contrôle du '
      + 'badge vérifié.',
  },
  {
    titre: 'Pourquoi, et sur quelle base',
    texte: 'Faire fonctionner le service et votre compte : exécution du '
      + 'contrat. Modérer les contenus et prévenir les fraudes : intérêt '
      + 'légitime, et obligation légale pour un service en ligne ouvert au '
      + 'public. Contrôler les documents du badge vérifié : votre '
      + 'consentement, que vous donnez en les envoyant.',
  },
  {
    titre: 'Où vos données sont hébergées',
    texte: 'La base et les fichiers sont hébergés par Supabase à Londres '
      + '(Royaume-Uni). Le Royaume-Uni ne fait plus partie de l’Union '
      + 'européenne, mais la Commission européenne a reconnu qu’il offre un '
      + 'niveau de protection équivalent : le transfert est donc autorisé '
      + 'sans formalité supplémentaire.',
  },
  {
    titre: 'À qui vos données sont transmises',
    texte: 'Supabase, pour l’hébergement de la base et des fichiers. '
      + 'Cloudinary, pour la compression des vidéos et le montage — les vidéos '
      + 'publiées y transitent. Anthropic (États-Unis), UNIQUEMENT quand vous '
      + 'appuyez sur « Améliorer avec l’IA » ou sur l’assistant de '
      + 'présentation : le texte que vous avez écrit est alors envoyé pour '
      + 'être relu, et n’est pas utilisé pour entraîner de modèle. Ces '
      + 'transferts hors Union européenne reposent sur les clauses '
      + 'contractuelles types de la Commission européenne.',
  },
  {
    titre: 'Combien de temps',
    texte: 'Vos données sont conservées tant que votre compte existe. À sa '
      + 'suppression, elles sont effacées immédiatement, à trois exceptions '
      + 'près : les avis et commentaires laissés chez d’autres sont conservés '
      + 'sans votre nom ; les signalements sont conservés un an, sans le nom '
      + 'de celui qui les a déposés ; les journaux techniques de connexion '
      + 'sont conservés six mois, comme la loi l’impose.',
  },
  {
    titre: 'Vos droits, et comment les exercer ICI',
    texte: 'Accès et portabilité : Profil → Confidentialité et sécurité → '
      + '« Récupérer mes données » vous rend tout ce que nous avons, en '
      + 'JSON. Rectification : Profil → Modifier mon profil. Effacement : '
      + 'Profil → Confidentialité et sécurité → « Supprimer mon compte », '
      + 'immédiat et sans intermédiaire. Opposition et limitation : écrivez à '
      + EDITEUR.email + '. Nous répondons sous un mois.',
  },
  {
    titre: 'Réclamation',
    texte: 'Si une réponse ne vous satisfait pas, vous pouvez saisir la CNIL '
      + '(Commission nationale de l’informatique et des libertés), '
      + '3 place de Fontenoy, 75007 Paris — www.cnil.fr.',
  },
  {
    titre: 'Cookies et traceurs',
    texte: 'Opus est une application mobile : elle n’utilise pas de cookies. '
      + 'Un seul élément est conservé sur votre téléphone, votre jeton de '
      + 'connexion — c’est ce qui vous évite de retaper votre mot de passe à '
      + 'chaque ouverture. Il est strictement nécessaire au service, ne suit '
      + 'rien, et disparaît quand vous vous déconnectez. C’est pourquoi aucun '
      + 'bandeau de consentement ne vous est présenté : il n’y a rien à '
      + 'consentir. Si une version web d’Opus voit le jour, ce même jeton y '
      + 'sera rangé dans le stockage local du navigateur, avec le même statut.',
  },
  {
    titre: 'Sécurité',
    texte: 'Les échanges sont chiffrés. Les règles d’accès sont appliquées par '
      + 'la base de données elle-même, et non par l’application : une version '
      + 'modifiée de l’application ne permettrait pas d’y accéder davantage. '
      + 'Les clés des services extérieurs ne se trouvent jamais dans '
      + 'l’application installée sur votre téléphone.',
  },
];
