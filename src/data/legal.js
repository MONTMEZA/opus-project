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
export const VERSION = '2026-09-21';

/** À remplir. Les valeurs nulles font apparaître l'avertissement. */
export const EDITEUR = {
  denomination: null,      // ex. « Opus SAS » ou « Dylan Montmeza, entrepreneur individuel »
  formeJuridique: null,    // ex. « SAS au capital de 1 000 € », ou « entrepreneur individuel »
  siren: null,             // 9 chiffres (ou SIRET à 14)
  adresse: null,           // siège social — obligatoire, même pour un particulier
  email: 'contact@opus-project.fr',   // À VÉRIFIER : cette adresse doit exister et être relevée
  directeurPublication: null,
  hebergeur: {
    nom: 'Supabase Inc.',
    adresse: '970 Toa Payoh North, #07-04, Singapour 318992',
    site: 'https://supabase.com',
    // La base du projet est hébergée dans une région à confirmer dans le
    // tableau de bord Supabase (Project Settings → General → Region).
    region: null,
  },
};

export function editeurComplet() {
  return Boolean(
    EDITEUR.denomination && EDITEUR.siren && EDITEUR.adresse
    && EDITEUR.directeurPublication && EDITEUR.hebergeur.region,
  );
}

/** Ce qui manque, listé pour que ce soit une corvée de dix minutes. */
export function manquesEditeur() {
  const manques = [];
  if (!EDITEUR.denomination) manques.push('la dénomination (nom de l’entreprise ou nom et prénom)');
  if (!EDITEUR.formeJuridique) manques.push('la forme juridique et le capital');
  if (!EDITEUR.siren) manques.push('le numéro SIREN ou SIRET');
  if (!EDITEUR.adresse) manques.push('l’adresse du siège');
  if (!EDITEUR.directeurPublication) manques.push('le directeur de la publication');
  if (!EDITEUR.hebergeur.region) manques.push('la région d’hébergement Supabase');
  return manques;
}

const ou = (valeur, defaut) => valeur || defaut;

/* ------------------------------------------------------------------ */
/*  1. MENTIONS LÉGALES                                                */
/* ------------------------------------------------------------------ */

export const MENTIONS = [
  {
    titre: 'Éditeur',
    texte: `${ou(EDITEUR.denomination, '[à compléter : dénomination]')}\n`
      + `${ou(EDITEUR.formeJuridique, '[à compléter : forme juridique]')}\n`
      + `SIREN ${ou(EDITEUR.siren, '[à compléter]')}\n`
      + `${ou(EDITEUR.adresse, '[à compléter : adresse du siège]')}\n`
      + `Contact : ${EDITEUR.email}`,
  },
  {
    titre: 'Directeur de la publication',
    texte: ou(EDITEUR.directeurPublication, '[à compléter]'),
  },
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
    texte: "Chaque publication, commentaire, profil, demande et annonce porte "
      + 'un bouton de signalement. Les signalements sont examinés sous '
      + '48 heures. Vous pouvez aussi écrire à ' + EDITEUR.email + '.',
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
    texte: "Le badge n'est accordé qu'après contrôle humain d'un extrait Kbis "
      + "et d'une attestation d'assurance décennale en cours de validité. Il "
      + "dit que ces documents ont été vus, et rien d'autre : il ne garantit "
      + "ni la qualité d'un chantier, ni le respect d'un délai. Un badge "
      + 'obtenu avec de faux documents entraîne la fermeture immédiate du '
      + 'compte.',
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
    texte: `${ou(EDITEUR.denomination, '[à compléter : dénomination]')}, `
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
      + 'annonces. Pour un compte professionnel : votre extrait Kbis et votre '
      + 'attestation d’assurance.',
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
