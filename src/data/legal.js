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
export const VERSION = '2026-10-22';
/* 22/10/2026 — LE CHIFFRAGE D'UN DEVIS (lot 1 du module devis, section 49
   de `schema.sql`). Ce qui a changé DE FOND :
     - la collecte s'allonge : les devis en préparation d'un artisan — leur
       objet, le lieu et le délai des travaux, une retenue de garantie,
       leurs lignes, leurs prix et leurs totaux, le client du carnet auquel
       ils se rattachent, la demande ou l'urgence d'où ils viennent ;
     - ces devis portent souvent l'ADRESSE DES TRAVAUX, c'est-à-dire le
       domicile d'une personne qui n'a pas de compte : ils entrent dans
       « Les clients que vous enregistrez », avec les mêmes rôles (l'artisan
       responsable, Opus sous-traitant) et les mêmes garanties ;
     - LA VÉRITÉ SUR L'EFFACEMENT, dans les deux sens (critique « droit » du
       cahier, I5 et I6) : supprimer la fiche d'un client NE supprime PAS
       ses devis — la v1 du cahier écrivait « sans son nom », qui faisait
       croire à une anonymisation qui n'a pas lieu ; et ce qu'un particulier
       a écrit dans une demande, et qu'un artisan a repris dans un devis ou
       dans son carnet, SURVIT à la suppression du compte du particulier —
       c'est voulu (un devis ne perd pas son objet), et c'était déjà vrai du
       carnet depuis la section 41. Le texte le dit, et dit à qui
       s'adresser ;
     - « à trois exceptions près » est retiré : une énumération qui annonce
       son nombre se trompe le jour où elle s'allonge, et elle venait de
       s'allonger.

   CE QUI N'EST PAS ÉCRIT, ET POURQUOI : aucune durée de conservation d'un
   devis (la purge à un an est une décision du 17/10, son MÉCANISME est au
   lot 4 — promettre une durée qu'aucun code ne tient serait faux) ; aucune
   clause de sous-traitance (l'acte de l'article 28.3 n'existe pas).

   LA MÊME LIMITE QUE LES 19 ET 20/10 : aucun écran ne fait ré-accepter un
   compte existant. Elle doit être construite avant que `STATUT` quitte
   « essai » (`docs/A-FAIRE.md`, « Après le lot T »). */
/* 20/10/2026 — LE N° DE TVA QUE L'ANNUAIRE NE PUBLIE PAS (section 48 de
   `schema.sql`). Ce qui a changé DE FOND :
     - un DESTINATAIRE nouveau : VIES, le service de la Commission
       européenne, reçoit le numéro de TVA que l'artisan écrit — ce numéro
       seul, depuis les serveurs d'Opus ;
     - la collecte s'allonge : ce numéro, et la date à laquelle VIES l'a
       reconnu. Pour un entrepreneur individuel, il désigne une personne ;
     - une DÉCISION AUTOMATIQUE de plus, et c'est une règle d'Opus, pas
       « la réponse de l'administration » : un numéro que VIES ne reconnaît
       pas ne s'imprime pas, et un devis à un particulier en dépendra. Aucune
       révision par un humain n'existe encore pour elle, et le texte le DIT
       (`docs/A-FAIRE.md` : à ouvrir avant la mise en ligne publique) ;
     - une base légale de plus (le contrôle), et deux compteurs sous
       empreinte, dont la durée se dit comme celle du SIRET.

   LA MÊME LIMITE QUE LE 19/10, et elle se dit encore : aucun écran ne fait
   ré-accepter un compte existant. Ce qui rend ce lot honnête quand même :
   le numéro ne part à VIES que par un geste explicite, « Faire contrôler
   par VIES », avec la phrase « Seul ce numéro est envoyé à VIES » sous les
   yeux. */
/* 19/10/2026 — LES TARIFS RÉUNIS (lot T, section 47 de `schema.sql`). Ce
   qui a changé DE FOND :
     - des tarifs peuvent devenir LISIBLES, au choix de l'artisan, par les
       PARTICULIERS qui ont un compte Opus, et par eux seuls — ni par les
       autres artisans, ni par l'espace d'administration (réponse du
       propriétaire du 19/10/2026) ; la base DATE ce geste (`affiche_le`) ;
     - répondre aux urgences demande de les afficher (réponse du 19/10) ;
     - LA LIMITE EST DITE, dans le texte opposable lui-même : Opus ne vérifie
       pas l'identité des particuliers, et un artisan qui ouvre un second
       compte, en particulier, lit ce qu'un particulier lit. Une barrière,
       pas un verrou ;
     - l'engagement de l'éditeur de ne pas consulter les prix porte sur ceux
       que l'artisan N'AFFICHE PAS — les autres, tout particulier connecté
       les lit déjà ;
     - la majoration de nuit et de week-end est dite pour ce qu'elle sert :
       l'estimation des urgences, aucun devis ;
     - la collecte s'allonge : taux horaire et son décompte, majoration,
       prix du devis ; et la disponibilité aux urgences (métier, rayon,
       délai), lisible de tous depuis le premier jour et dite nulle part.

   LA LIMITE DE CE CHANGEMENT, et elle se dit : AUCUN écran ne fait
   ré-accepter un compte existant. Mesuré le 19/10/2026 : 11 comptes sur 15
   n'ont aucune version enregistrée, aucun n'a accepté celle du 18/10. Ce
   qui rend ce lot honnête quand même : la seule publicité nouvelle passe
   par un geste explicite, l'interrupteur « Afficher mes tarifs sur ma
   fiche », avec la phrase sous les yeux, et la base date ce geste. Le
   mécanisme de ré-acceptation est à construire avant que `STATUT` quitte
   `'essai'` (docs/A-FAIRE.md).

   L'AVIS D'UN AVOCAT sur des tarifs affichés dans un petit marché est un
   simple RAPPEL (réponse du 19/10) : il vit dans `docs/A-FAIRE.md`, pas
   ici, et aucun contrôle n'en fait une condition. */
/* 18/10/2026 — « Mon entreprise » pour les devis (lot 0a, section 46 de
   `schema.sql`). Ce qui a changé DE FOND : ce qui est collecté pour les
   devis (immatriculation, assurances et attestations, médiateur,
   garanties, conditions, frais de déplacement) ; la SOURCE du n° de TVA,
   qui n'est pas le répertoire Sirene mais la liste de la DGFiP ; la
   finalité de l'attestation d'assurance, qui accompagne désormais les
   devis ; et un ENGAGEMENT nouveau de l'éditeur, opposable : il ne
   consulte pas les tarifs et les prix qu'un artisan enregistre pour ses
   devis (réponse du propriétaire, 18/10/2026). Un engagement de plus est un
   changement de fond : une acceptation ancienne ne le couvre pas.

   LA VERSION D'AVANT, et pourquoi elle est gardée en mémoire ci-dessous :
   le 15/10, le SIRET devenait la condition de l'inscription pro. */
/* 15/10/2026 — le SIRET devient la condition de l'inscription
   professionnelle (section 45 de `schema.sql`). Ce qui a changé DE FOND :
   qui peut ouvrir un compte pro, la décision automatique et la façon de la
   faire revoir, l'usurpation d'une entreprise, ce qui est collecté (le
   SIRET, ce que le répertoire Sirene en dit, une empreinte d'adresse IP), à
   qui le numéro est envoyé, et la phrase FAUSSE sur les journaux techniques
   (« six mois, comme la loi l'impose » : l'offre gratuite de Supabase les
   garde un jour). Une nouvelle version, parce que ces textes ont changé
   d'engagement — pas seulement de forme.

   CE QUI NE S'Y TROUVE PAS, et c'est voulu : aucune mention publique
   « SIRET actif » ou « entreprise vérifiée » sur les fiches. Un SIRET est
   public ; une mention obtenue en trente secondes avec le numéro d'un autre
   serait un outil d'hameçonnage. Le plan du lot l'a écartée, et les textes
   ne doivent pas décrire ce qui n'existe pas. */

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
 * LE DOMAINE D'OPUS — et pourquoi il est écrit ici.
 *
 * `opus-project.com`, enregistré chez IONOS le 27/01/2025 au nom du
 * propriétaire. Vérifié au registre du `.com` le 12/10/2026, et ses serveurs
 * de noms sont bien ceux d'IONOS.
 *
 * Il est nommé ici pour une raison précise, et c'est une cicatrice : jusqu'au
 * 12/10/2026, `EDITEUR.email` valait `contact@opus-project.fr` — un domaine
 * qui appartient à **ÉLECTRICITÉ DE FRANCE**, enregistré en 2008 et géré par
 * un prestataire de surveillance de marques. L'adresse était affichée à onze
 * endroits des textes légaux, dont « nous répondons sous un mois », et
 * `verifier-legal` la laissait passer parce qu'elle contenait un `@`.
 *
 * `npm run verifier-legal` exige désormais qu'une adresse de contact soit SUR
 * ce domaine. Contrairement à « est-elle relevée », ça se vérifie
 * mécaniquement — et ça aurait attrapé l'adresse d'EDF tout seul.
 */
export const DOMAINE = 'opus-project.com';

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
  /**
   * L'ADRESSE DE CONTACT — et pourquoi elle est VIDE.
   *
   * Elle valait `contact@opus-project.fr` jusqu'au 12/10/2026. Ce domaine
   * appartient à **ÉLECTRICITÉ DE FRANCE** : vérifié au registre du .fr,
   * enregistré en 2008, géré par un prestataire de protection de marques.
   * Personne n'aurait jamais relevé cette boîte, et personne n'aurait PU.
   *
   * Or cette adresse était affichée à ONZE endroits des textes légaux, dont
   * « Opposition et limitation : écrivez à … Nous répondons sous un mois. »
   * Une promesse de réponse sur une adresse injoignable, c'est le défaut que
   * ce projet traque depuis le 01/10 — sauf qu'ici elle est écrite dans un
   * document qui engage.
   *
   * Le propriétaire a un nom de domaine (`opus-project.com`, voir `DOMAINE`)
   * et une marque déposée, mais **aucune boîte aux lettres créée**. Tant
   * qu'elle n'existe pas, le champ est `null` et les textes le DISENT, au
   * lieu d'afficher une adresse morte.
   *
   * Mesuré le 12/10/2026, et c'est une bonne nouvelle : le domaine porte
   * déjà les serveurs de courrier d'IONOS (`mx00.ionos.fr`,
   * `mx01.ionos.fr`). Il n'y a donc RIEN à configurer techniquement — créer
   * la boîte dans l'espace client IONOS suffit, et l'adresse fonctionnera
   * aussitôt. Il reste à l'écrire ici, et à cocher `emailReleve`.
   */
  email: null,
  /**
   * Et le drapeau qui va avec, sur le modèle d'`identiteRemiseALHebergeur` :
   * une adresse écrite ici est PUBLIÉE. Elle doit donc exister ET être
   * relevée, et ça, seul un humain le sait. `npm run verifier-legal` refuse
   * une adresse posée sans que ce drapeau soit coché.
   */
  emailReleve: false,
  /**
   * Statut 'particulier' : la loi ne dispense d'afficher son identité que si
   * on l'a REMISE à l'hébergeur. Tant que ce n'est pas fait, la dispense ne
   * s'applique pas — d'où ce drapeau, qu'on ne coche qu'une fois la chose
   * faite (Supabase → Support, ou les informations de facturation du compte).
   */
  identiteRemiseALHebergeur: false,
  /**
   * LE CONTRAT DE SOUS-TRAITANCE DU CARNET DE CLIENTS (art. 28 du RGPD).
   *
   * À passer à `true` UNIQUEMENT quand l'acte juridique existe vraiment et
   * qu'il est opposable : les huit obligations de l'article 28.3 écrites,
   * accessibles à l'artisan, et acceptées par lui.
   *
   * POURQUOI UN DRAPEAU ET PAS UNE PHRASE DANS LE TEXTE. Le premier jet de
   * ce garde-fou vérifiait que les mots « contrat de sous-traitance »
   * figuraient quelque part. Il est passé au VERT aussitôt — parce que le
   * texte que je venais d'écrire les contenait. Un contrôle satisfait par
   * sa propre documentation ne garde rien, et c'est le défaut que ce projet
   * traque depuis `verifier-montage`. Une phrase n'est pas un contrat ;
   * seul un humain sait si l'acte existe, et ce drapeau est l'endroit où il
   * le dit.
   */
  contratSousTraitance: false,
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
/*  L'ADRESSE DE CONTACT — ou la VÉRITÉ à sa place                     */
/*                                                                     */
/*  Le 12/10/2026, onze textes légaux affichaient une adresse sur un    */
/*  domaine appartenant à ÉLECTRICITÉ DE FRANCE. Aucun de ces onze      */
/*  endroits n'avait prévu qu'elle puisse manquer — alors que les       */
/*  autres champs de l'éditeur passent tous par `ou()` depuis le        */
/*  premier jour.                                                      */
/*                                                                     */
/*  D'où ces deux fonctions, et la règle qu'elles tiennent :           */
/*                                                                     */
/*    UN TEXTE LÉGAL N'AFFICHE JAMAIS « null », et il ne promet        */
/*    jamais une réponse à une adresse qui n'existe pas.               */
/*                                                                     */
/*  `npm run verifier-legal` relit les textes ENGENDRÉS et refuse d'y  */
/*  trouver « null » ou « undefined ».                                 */
/* ------------------------------------------------------------------ */

/** La ligne « Contact : … » des mentions légales. */
function ligneContact() {
  if (EDITEUR.email) return `Contact : ${EDITEUR.email}`;
  if (STATUT === 'essai') {
    return 'Contact : aucune adresse n’est publiée pour le moment — Opus '
      + 'n’est pas ouverte au public. Elle le sera avant la première mise en '
      + 'ligne, en même temps que l’identité de l’éditeur.';
  }
  return 'Contact : [à compléter : adresse de contact]';
}

/**
 * Une phrase qui dit « écrivez à telle adresse ».
 *
 * Quand l'adresse manque, on ne laisse PAS un trou : on dit où aller à la
 * place. Et il y a presque toujours un chemin DANS l'application — c'est
 * d'ailleurs le meilleur, puisqu'il ne dépend d'aucune boîte aux lettres.
 *
 * @param avec  (adresse) => la phrase quand l'adresse existe
 * @param sans  la phrase quand elle manque. Elle doit rester VRAIE : si
 *              aucun chemin n'existe, elle le dit plutôt que de l'inventer.
 */
function parEcrit(avec, sans) {
  return EDITEUR.email ? avec(EDITEUR.email) : sans;
}

/**
 * « Pour toute question sur vos données : … » — à trois endroits de la
 * politique de confidentialité, un par statut.
 *
 * Sans adresse, on ne se contente pas de retirer la phrase : on rappelle que
 * l'essentiel des droits s'exerce DANS l'application, sans écrire à personne.
 * C'est vrai depuis le 21/09 — l'export, la rectification et la suppression
 * de compte sont trois boutons — et c'est même mieux qu'une adresse.
 */
function questionDonnees() {
  return parEcrit(
    (adresse) => `Pour toute question sur vos données : ${adresse}.`,
    'Vos droits d’accès, de rectification et d’effacement s’exercent '
      + 'directement dans l’application : Profil → Confidentialité et '
      + 'sécurité. Aucune adresse de contact n’est encore publiée pour le '
      + 'reste.',
  );
}

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
        + ligneContact(),
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
        + ligneContact(),
    };
  }

  if (STATUT === 'micro') {
    return {
      titre: 'Éditeur',
      texte: `${ou(EDITEUR.denomination, '[à compléter : nom et prénom]')}\n`
        + `Entrepreneur individuel (micro-entreprise)\n`
        + `SIRET ${ou(EDITEUR.siren, '[à compléter]')}\n`
        + `${ou(EDITEUR.adresse, '[à compléter : adresse]')}\n`
        + ligneContact(),
    };
  }

  return {
    titre: 'Éditeur',
    texte: `${ou(EDITEUR.denomination, '[à compléter : dénomination]')}\n`
      + `${ou(EDITEUR.formeJuridique, '[à compléter : forme juridique]')}\n`
      + `SIREN ${ou(EDITEUR.siren, '[à compléter]')}\n`
      + `${ou(EDITEUR.adresse, '[à compléter : adresse du siège]')}\n`
      + ligneContact(),
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
    /* LA LICENCE OUVERTE DE L'INSEE L'EXIGE : « www.insee.fr » et la date
       de dernière mise à jour, et elle interdit de suggérer une caution
       publique.

       « La date accompagne CHAQUE donnée affichée » était faux (relecture
       adverse du 15/10) : le rappel de vérification et la ligne sous le nom
       n'en portent pas, ou portent celle de la CONSULTATION, et le
       répertoire ne publie pas toujours la sienne. La phrase dit donc OÙ
       elle accompagne la présentation — la carte de l'inscription et « Mon
       entreprise » —, et que l'écran le dit quand elle manque. */
    titre: 'Sources',
    texte: 'Données d’entreprise : répertoire Sirene de l’INSEE (www.insee.fr), '
      + 'réutilisées sous Licence Ouverte 2.0 ; numéros de TVA : DGFiP ; via l’API '
      + 'Recherche d’entreprises. Un numéro de TVA que cette API ne publie pas, écrit par '
      + 'l’entreprise elle-même, n’est gardé que si VIES, le service de la Commission '
      + 'européenne qui interroge l’administration fiscale de chaque pays, le reconnaît, '
      + 'et la date de ce contrôle l’accompagne. La date de mise à jour du répertoire accompagne la '
      + 'présentation de l’entreprise, à l’inscription et dans « Mon entreprise » — ou '
      + 'la mention qu’il n’en publie pas. Cette réutilisation ne vaut ni agrément ni '
      + 'caution de l’INSEE, de l’État ou de la Commission européenne.',
  },
  {
    titre: 'Signaler un contenu',
    texte: "Chaque publication, commentaire, message, profil, demande et "
      + 'annonce porte un bouton de signalement. Les signalements sont '
      + 'examinés sous 48 heures. '
      + parEcrit(
        (adresse) => `Vous pouvez aussi écrire à ${adresse}.`,
        'Ce bouton est aujourd’hui le seul chemin : aucune adresse de '
          + 'contact n’est encore publiée.',
      ),
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
    /* RÉÉCRIT LE 15/10/2026 (section 45). « Suppose une activité réellement
       déclarée » était une DÉCLARATION, que rien ne contrôlait — et
       l'unicité n'y était pas. Ce texte est celui de la relecture « droit »
       du plan, adapté : il ne parle d'aucune mention publique, puisqu'il
       n'y en a pas. */
    texte: 'Il faut avoir 18 ans révolus. Un compte professionnel s’ouvre pour une '
      + 'entreprise dont le numéro SIRET correspond à un établissement ouvert d’une '
      + 'entreprise active au répertoire Sirene de l’INSEE ; une entreprise n’a qu’un '
      + 'seul compte professionnel. En donnant ce numéro, vous déclarez être le titulaire '
      + 'de l’entreprise ou habilité à la représenter. Si la consultation automatique '
      + 'n’aboutit pas, ou si le numéro est déjà rattaché à un autre compte, vous pouvez '
      + 'demander une vérification à la main depuis l’application ; Opus peut alors vous '
      + 'demander un justificatif. Les publications dans le fil sont réservées aux '
      + 'comptes professionnels. Un particulier peut aimer, commenter, partager et '
      + 'publier des demandes de travaux.',
  },
  {
    titre: 'Le badge vérifié',
    /* « CETTE CONSULTATION NE S'AFFICHE NULLE PART » ÉTAIT FAUX — relecture
       adverse du 15/10, et c'est un texte opposable : « Mon profil », le
       rappel de vérification, « Mon entreprise » et l'administration
       l'affichent. Ce qui est vrai, c'est qu'elle n'apparaît pas sur la
       fiche PUBLIQUE. Et le contrôle avait été relâché pour laisser passer
       la phrase fausse (`verifier-legal`) : il ne l'est plus.

       CE TEXTE A ÉTÉ CORRIGÉ LE 04/10/2026, et c'était une vraie
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
      + 'avec de faux documents entraîne la fermeture immédiate du compte. Il est '
      + 'distinct de la consultation du répertoire Sirene faite à l’ouverture d’un '
      + 'compte professionnel, qui dit seulement que l’entreprise existait et était '
      + 'active à cette date : cette consultation n’apparaît jamais sur votre fiche '
      + 'publique — seuls vous et l’administration d’Opus la voyez —, et elle ne '
      + 'prouve pas que le compte appartient à l’entreprise.',
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
    /* L'ENGAGEMENT DE L'ÉDITEUR SUR LES PRIX DES ARTISANS — réponse du
       propriétaire du 18/10/2026 au préalable de `DONNEES-DES-ARTISANS.md`
       §5.2 : « personne ne lit les prix d'un autre artisan, éditeur SQL
       compris ». Il a choisi l'ENGAGEMENT ÉCRIT.

       DANS LES CONDITIONS, ET PAS DANS LA POLITIQUE DE CONFIDENTIALITÉ :
       c'est une promesse de l'éditeur envers l'artisan, sur des données
       d'entreprise autant que personnelles — un contrat, donc. La politique
       de confidentialité y renvoie, depuis « Ce que nous collectons ».

       LE LOT T (19/10/2026) A CHANGÉ CE QUI EST PRIVÉ, et la clause le suit
       — `verifier-legal` compare ce texte au schéma, dans les deux sens :
         - « ne sont montrés à personne d'autre que vous » ne vise plus que
           ce qui N'EST PAS affiché, et la liste nomme « ni à un
           particulier », puisque les tarifs affichés, eux, vont aux
           particuliers ;
         - LES LECTEURS DES TARIFS AFFICHÉS sont les particuliers qui ont un
           compte (réponse du 19/10) : ils ne s'affichent ni aux autres
           artisans, ni dans l'espace d'administration, et l'éditeur ne les
           voit pas DEPUIS SON COMPTE, qui est professionnel. « dans
           l'application » disait plus que la vérité (relecture du
           19/10/2026) : l'éditeur peut ouvrir un compte particulier — pour
           essayer la carte SOS, justement —, et la phrase suivante, la
           limite, le couvre. L'engagement du 18/10, « aucun écran ne montre
           les prix d'un artisan à un autre », reste vrai TEL QUEL ;
         - LA LIMITE EST DITE, ici même : Opus ne vérifie pas l'identité des
           particuliers, et un second compte particulier lit ce qu'un
           particulier lit. Une barrière, pas un verrou — l'écrire autrement
           serait faux, et un texte opposable qui ment engage son auteur ;
         - l'engagement de ne pas consulter porte sur « ceux que vous
           n'affichez pas » : il protège ce que personne d'autre ne lit ;
         - « personnes sans compte » n'y est PAS : aucun visiteur ne lit une
           ligne de tarifs (la base n'accorde rien à `anon`) ;
         - la majoration n'est plus rangée parmi ce qui « sert aux devis » :
           aucun devis ne la porte ;
         - « Répondre aux urgences demande de les afficher » suit la réponse
           du 19/10 à la question 1.

       CE QUI NE CHANGE PAS : l'éditeur PEUT techniquement les lire avec les
       outils de l'hébergeur — un engagement, PAS une impossibilité
       technique ; aucun journal des lectures n'existe, et le texte ne dit
       pas « encore » ; rien d'autre n'est promis. */
    titre: 'Vos tarifs et vos prix',
    texte: 'Les tarifs que vous enregistrez dans « Mon entreprise » ne sont utilisés que par '
      + 'vous tant que vous ne choisissez pas de les afficher : vos frais de déplacement, votre '
      + 'taux horaire et son décompte, et le prix de vos devis serviront à préparer vos devis ; '
      + 'votre majoration de nuit et de week-end ne sert qu’à l’estimation des urgences, donc '
      + 'seulement si vous les affichez. Si vous touchez « Afficher mes tarifs sur ma fiche », '
      + 'ils deviennent lisibles par les particuliers qui ont un compte Opus : ils s’affichent '
      + 'sur votre fiche et, si vous répondez aux urgences, servent à l’estimation que le '
      + 'bouton SOS montre aux particuliers. Ils ne s’affichent pas aux autres artisans, ni dans '
      + 'l’espace d’administration : l’éditeur d’Opus ne les voit pas non plus depuis son '
      + 'compte, qui est professionnel. C’est une barrière, pas un verrou : '
      + 'Opus ne vérifie pas l’identité des particuliers, et quelqu’un qui ouvre un compte '
      + 'particulier avec une autre adresse e-mail, un artisan compris, peut les lire. Répondre '
      + 'aux urgences demande de les afficher. Opus enregistre la date à laquelle vous les '
      + 'affichez. Vous pouvez cesser de les afficher à tout moment. Les tarifs que vous '
      + 'n’affichez pas, et les autres prix que vous enregistrez pour vos devis, ne sont montrés '
      + 'à personne d’autre que vous par aucun écran d’Opus : ni à un autre artisan, ni à un '
      + 'particulier, ni à un visiteur, ni dans l’espace d’administration. Vos devis portent '
      + 'ceux qui leur servent, pour le client à qui vous les adressez. La base de données le '
      + 'garantit pour les autres utilisateurs. L’éditeur d’Opus, qui administre cette base, '
      + 'pourrait techniquement les lire avec les outils d’administration de l’hébergeur : il '
      + 's’engage à ne pas consulter ceux que vous n’affichez pas. C’est un engagement, pas une '
      + 'impossibilité technique, et aucun journal n’enregistre une telle lecture. Pour faire '
      + 'fonctionner le service, il peut compter les lignes ou vérifier la structure de la base '
      + 'sans lire vos prix. Seule une obligation légale pourrait l’amener à les communiquer.',
  },
  {
    titre: 'Ce qui est interdit',
    /* « Demandez une vérification à la main » est IMPOSSIBLE depuis un
       compte déjà professionnel (la base réserve la demande aux
       particuliers, et l'application le dit dans « Mon entreprise ») :
       relecture adverse du 15/10. Le texte nomme les deux chemins qui
       existent, et dit celui qui n'existe pas encore. */
    texte: 'Se faire passer pour quelqu’un d’autre ou pour une entreprise qui '
      + "n'est pas la sienne. Proposer des travaux sans assurance ni facture. "
      + 'Insulter, menacer, harceler. Publier du contenu sexuel ou violent. '
      + 'Publier des photos qui ne sont pas les siennes. Collecter les '
      + 'coordonnées des autres utilisateurs pour les démarcher ailleurs. Utiliser le '
      + 'numéro SIRET d’une entreprise qui n’est pas la sienne : l’entreprise est alors '
      + 'retirée du compte, et le compte peut être fermé. Si votre entreprise est '
      + 'rattachée à un compte qui n’est pas le vôtre, demandez une vérification à la '
      + 'main, depuis un compte particulier ou à l’inscription : chacun pourra être '
      + 'invité à justifier qu’il en est le titulaire. Un compte déjà professionnel ne '
      + 'peut pas encore la demander depuis l’application.',
  },
  {
    titre: 'Modération',
    texte: 'Tout contenu peut être signalé. Les signalements sont examinés '
      + 'sous 48 heures. Un contenu contraire à ces conditions est retiré, et '
      + "son auteur averti ; en cas de récidive ou de faute grave, le compte "
      + 'est fermé. '
      + parEcrit(
        (adresse) => `Vous pouvez contester une décision en écrivant à ${adresse}.`,
        'Aucune adresse de contact n’est encore publiée : une voie de '
          + 'contestation sera ouverte avant la mise en ligne publique.',
      ),
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
    texte: 'Ces conditions sont soumises au droit français. '
      + parEcrit(
        (adresse) => `En cas de difficulté, adressez-vous d’abord à ${adresse} : `
          + 'la plupart des différends se règlent ainsi. À défaut, les ',
        'En cas de difficulté, les ',
      )
      + 'tribunaux français sont compétents. Un consommateur peut saisir '
      + 'gratuitement un médiateur de la consommation.',
  },
];

/* ------------------------------------------------------------------ */
/*  3. POLITIQUE DE CONFIDENTIALITÉ                                    */
/* ------------------------------------------------------------------ */

/* CE QU'UNE SUPPRESSION DE FICHE N'EFFACE PAS — lot 1 du devis, 22/10/2026.
   La clé `devis.client_id` est `on delete set null` (section 49) : supprimer
   la fiche d'un client détache ses devis, elle ne les efface pas, et ils
   gardent l'adresse des travaux et l'objet. La v1 du cahier écrivait « sans
   son nom », qui faisait croire à une anonymisation : il n'y en a aucune, et
   l'objet ou l'adresse suffisent souvent à reconnaître quelqu'un. La phrase
   est écrite UNE fois et servie aux DEUX branches de « Les clients que vous
   enregistrez » : le jour où le contrat de sous-traitance existera, cette
   vérité ne doit pas disparaître avec l'ancienne branche.
   `npm run verifier-legal` refuse « sans son nom » dans cette section. */
const CE_QUI_RESTE_D_UN_CLIENT = 'Supprimer la fiche d’un client ne supprime pas ses '
  + 'devis : ils restent, avec l’adresse des travaux et ce que vous y avez écrit. Pour '
  + 'effacer les données de ce client, supprimez aussi ses devis.';

export const CONFIDENTIALITE = [
  {
    titre: 'Qui traite vos données',
    texte: STATUT === 'essai'
      ? "Opus est en cours de développement et n'est pas ouverte au public. "
        + "Le responsable du traitement est l'auteur de l'application ; son "
        + 'identité complète sera publiée ici avant la première mise en ligne '
        + 'publique.\n\n' + questionDonnees()
      : STATUT === 'particulier'
        ? 'Opus est éditée à titre non professionnel par une personne '
          + 'physique, dont l’identité a été communiquée à l’hébergeur. '
          + questionDonnees()
        : `${ou(EDITEUR.denomination, '[à compléter : dénomination]')}, `
          + `${ou(EDITEUR.adresse, '[à compléter : adresse]')}. `
          + questionDonnees(),
  },
  {
    titre: 'Ce que nous collectons',
    /* LE NOM COMPLET DU RÉPERTOIRE MANQUAIT À CETTE LISTE (relecture
       adverse du 15/10) : il est recopié dans l'identité privée, et pour un
       entrepreneur individuel c'est son nom civil — une donnée obtenue
       auprès d'une autre source que la personne, qu'il faut nommer.

       LES TARIFS AFFICHÉS, relecture du 19/10/2026 (lot T) : le texte
       disait « par eux seuls — ni par les autres artisans », puis, une
       phrase plus loin, qu'un artisan peut les lire. Il dit maintenant ce
       qui est vrai, dans le même ordre que la CGU : ils ne S'AFFICHENT pas
       aux autres artisans, c'est une barrière, pas un verrou. Et la
       disponibilité aux urgences reste lisible de tous APRÈS qu'on a cessé
       d'y répondre — une ligne éteinte n'est pas supprimée : on le dit.

       LES DEVIS EN PRÉPARATION, lot 1 (22/10/2026) : ce qui est collecté
       est nommé colonne par colonne de la section 49 — l'objet, le lieu et
       le délai, la retenue de garantie, les lignes et leurs prix, les
       totaux que la base calcule, la fiche du carnet et la demande d'origine.
       « Aucun écran d'Opus ne les montre » couvre ces devis aussi : la
       section « Les clients que vous enregistrez » le dit en entier. */
    texte: 'Votre adresse électronique et votre mot de passe (chiffré : '
      + 'personne, chez Opus, ne peut le lire). Votre nom, votre ville et '
      + 'votre code postal. Les coordonnées géographiques APPROXIMATIVES de '
      + 'votre commune — celles de la mairie, pas de votre domicile — qui '
      + 'servent au tri par distance. Votre téléphone, si vous le renseignez. '
      + 'Vos photos, vidéos, textes, commentaires, avis, messages, demandes et '
      + 'annonces. Pour un compte professionnel : votre justificatif '
      + 'd’existence légale et votre attestation d’assurance ; le numéro SIRET de '
      + 'votre entreprise, et ce que le répertoire Sirene de l’INSEE en dit au moment '
      + 'de la consultation — dénomination, nom commercial, le nom complet tel que le '
      + 'répertoire le publie (pour un entrepreneur individuel : vos nom et prénoms), '
      + 'forme juridique, date de création, code d’activité, commune et adresse de '
      + 'l’établissement — ; et le numéro de TVA intracommunautaire que publie la DGFiP, '
      + 's’il en existe un — sinon, celui que vous écrivez vous-même, et la date à laquelle '
      + 'VIES, le service de la Commission européenne, l’a reconnu. Ces informations sont rangées '
      + 'à part de votre fiche : '
      + 'seuls vous et l’administration d’Opus pouvez les lire. Un numéro saisi à la '
      + 'main dans l’ancien champ « SIRET » de la fiche, avant le 15/10/2026, reste '
      + 'lisible par l’interface publique d’Opus, même s’il ne s’affiche plus nulle '
      + 'part dans l’application. Si vous demandez l’ouverture d’un compte '
      + 'professionnel à la main : le numéro saisi, la raison pour laquelle la '
      + 'consultation automatique n’a pas abouti, votre message, et le justificatif '
      + 'que vous choisissez de joindre. Quand un numéro SIRET est consulté au '
      + 'répertoire, une empreinte chiffrée de l’adresse IP de l’appareil est '
      + 'enregistrée pour limiter le nombre d’essais ; l’adresse elle-même n’est pas '
      + 'rangée dans la base d’Opus. Si vous êtes professionnel, pour vos devis : votre '
      + 'immatriculation, votre capital, vos assurances et leurs attestations, votre '
      + 'médiateur, vos garanties, vos conditions de paiement, d’exécution et de '
      + 'réclamation, et vos tarifs (frais de déplacement, taux horaire et son décompte, '
      + 'majoration de nuit et de week-end, prix du devis) ; et vos devis en préparation '
      + 'eux-mêmes : leur objet, le lieu et le délai des travaux, une éventuelle retenue de '
      + 'garantie, leurs lignes, leurs prix et leurs totaux, le client de votre carnet auquel ils '
      + 'sont rattachés et, s’il y a lieu, la demande ou l’urgence d’où ils viennent. Aucun '
      + 'écran d’Opus ne les montre '
      + 'à quelqu’un d’autre que vous, sauf vos tarifs si vous choisissez de les afficher : ils '
      + 'deviennent alors lisibles par les particuliers qui ont un compte Opus ; ils ne '
      + 's’affichent ni aux autres artisans, ni dans l’espace d’administration, et la date à '
      + 'laquelle vous les affichez est enregistrée. C’est une barrière, pas un verrou : Opus ne '
      + 'vérifie pas l’identité des particuliers, et quelqu’un qui ouvre un compte particulier, '
      + 'un artisan compris, peut les lire. Les attestations jointes, comme vos autres documents '
      + 'professionnels, sont aussi lisibles par l’administration d’Opus. Si vous répondez ou '
      + 'avez répondu aux urgences : votre métier d’urgence, votre rayon d’intervention et votre '
      + 'délai d’arrivée habituel, lisibles par tous, même après avoir cessé d’y répondre ; ce '
      + 'délai s’affiche avec vos tarifs aux personnes qui cherchent une urgence près de chez '
      + 'elles. Pour vos tarifs et vos prix, l’éditeur prend en plus un engagement '
      + 'écrit dans les conditions d’utilisation (« Vos tarifs et vos prix »).',
  },
  {
    titre: 'Ce que nous ne collectons pas',
    texte: 'Aucune publicité ciblée, aucun traceur publicitaire, aucun outil '
      + 'de mesure d’audience tiers. Opus ne vend ni ne loue vos données à '
      + 'personne. Votre position n’est jamais relevée par votre téléphone, et la carte '
      + 'ne connaît que votre commune. Pour un compte professionnel, l’adresse de votre '
      + 'établissement telle que le répertoire Sirene la publie est conservée dans un '
      + 'espace privé, lisible par vous et l’administration d’Opus ; elle ne s’affiche '
      + 'qu’à vous, dans « Mon entreprise ».',
  },
  {
    titre: 'Vos documents professionnels',
    texte: 'Le Kbis, l’extrait d’immatriculation et l’attestation d’assurance sont '
      + 'rangés dans un espace PRIVÉ, lisible par vous et par l’administration d’Opus '
      + 'seulement. Ils ne sont jamais affichés publiquement et servent au contrôle du '
      + 'badge vérifié, à l’examen d’une demande d’ouverture de compte professionnel — '
      + 'dont le justificatif suit les mêmes règles, et ne passe jamais par la '
      + 'messagerie — et, pour l’attestation d’assurance que vous joignez dans « Mon '
      + 'entreprise », à accompagner vos devis.',
  },
  {
    titre: 'Pourquoi, et sur quelle base',
    texte: 'Faire fonctionner le service et votre compte : exécution du '
      + 'contrat. Modérer les contenus et prévenir les fraudes : intérêt '
      + 'légitime, et obligation légale pour un service en ligne ouvert au '
      + 'public. Contrôler les documents du badge vérifié : votre '
      + 'consentement, que vous donnez en les envoyant. Consulter le répertoire Sirene '
      + 'pour un compte professionnel : exécution du contrat — c’est la condition '
      + 'd’ouverture d’un compte professionnel — et intérêt légitime à prévenir les faux '
      + 'profils. Examiner une demande d’ouverture à la main : mesures précontractuelles '
      + 'prises à votre demande. Limiter le nombre de consultations par appareil : '
      + 'intérêt légitime, protéger le service contre les abus. Faire contrôler par VIES '
      + 'le numéro de TVA que vous écrivez, et le garder : exécution du contrat — c’est ce '
      + 'qui permet de l’imprimer sur vos devis — et intérêt légitime à ce qu’un devis ne '
      + 'porte pas un numéro qu’aucune administration ne reconnaît. Limiter le nombre de '
      + 'ces contrôles par compte : intérêt légitime, protéger le service et VIES contre '
      + 'les abus.',
  },
  {
    /* L'ARTICLE 22 DU RGPD — relecture « droit » du plan, constat 5. Refuser
       un compte professionnel est une décision automatisée qui peut
       affecter quelqu'un : il faut l'annoncer, et dire comment la faire
       revoir par un humain. Vrai dès ce lot, puisque la porte de secours
       existe ; aucun délai n'est promis, parce qu'aucun n'est tenu. */
    titre: 'Une décision automatique, et comment la faire revoir',
    texte: 'Quand vous ouvrez un compte professionnel, le numéro SIRET est consulté '
      + 'automatiquement au répertoire Sirene de l’INSEE : s’il n’y est pas trouvé, si '
      + 'l’établissement est fermé ou si l’entreprise a cessé son activité, le compte '
      + 'professionnel n’est pas ouvert. Cette décision peut toujours être revue par un '
      + 'humain : « Demander une vérification à la main » dépose votre demande dans '
      + 'l’application, où l’administrateur d’Opus la lit et vous répond par vos '
      + 'notifications et par la messagerie d’Opus. Vous pouvez y expliquer votre '
      + 'situation. Le numéro de TVA que vous écrivez suit une autre règle, et c’est une '
      + 'règle d’Opus : Opus le fait contrôler par VIES, le service de la Commission '
      + 'européenne qui interroge l’administration fiscale française, et ne le garde que '
      + 'si VIES le reconnaît. S’il ne le reconnaît pas, Opus ne l’imprime pas sur vos '
      + 'devis ; au régime réel de TVA, « Mon entreprise » vous signale alors qu’il manque '
      + 'une information pour vos devis à des particuliers, et, quand Opus permettra de '
      + 'remettre des devis, il ne vous laissera pas en remettre un à un particulier tant '
      + 'qu’elle manque. Aucune vérification par un humain n’existe encore pour cette '
      + 'décision : seul votre service des impôts des entreprises peut activer ou corriger '
      + 'votre numéro auprès de l’administration fiscale, et vous pouvez le faire contrôler '
      + 'de nouveau dès qu’il l’a fait. Si vous relevez en réalité de la franchise en base '
      + 'de TVA, choisissez-la dans « Mon entreprise » : ce numéro n’est alors pas demandé.',
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
    /* LE RENVERSEMENT QUE LE CARNET DE CLIENTS APPORTE (section 41 de
       `schema.sql`, 11/10/2026).

       Partout ailleurs dans Opus, c'est l'éditeur qui est responsable du
       traitement : les données sont celles que ses utilisateurs ont écrites
       SUR EUX-MÊMES. Un carnet de clients, non — il porte le nom, le
       téléphone et l'adresse de personnes qui n'ont pas de compte et qui
       n'ont rien accepté. L'artisan en est donc le responsable, et Opus son
       SOUS-TRAITANT au sens de l'article 28 du RGPD.

       ON NE PEUT PAS ÉCRIRE CE CONTRAT ICI, et il ne faut pas essayer :
       l'article 28.3 énumère huit obligations à faire figurer dans un acte
       juridique, et une clause inventée engagerait la responsabilité du
       propriétaire. CLAUDE.md est formel : « ne jamais lui écrire des
       mentions légales de société ».

       Ce qu'on fait donc, et c'est honnête : on dit le droit, on dit ce qui
       manque, et on dit ce qui est VRAI techniquement — vérifié par les
       seize essais de la section 41. Et `npm run verifier-legal` refuse de
       passer si le statut quitte « essai » sans que cette clause existe. */
    titre: 'Les clients que vous enregistrez',
    /* LES DEVIS ENTRENT ICI — lot 1, 22/10/2026. Un devis rattache une fiche
       du carnet et porte souvent l'adresse des travaux, c'est-à-dire le
       domicile du client : les mêmes rôles (l'artisan responsable, Opus
       sous-traitant), les mêmes garanties — vérifiées par l'essai 49 : aucun
       autre artisan, aucun visiteur, aucun compte sans fiche, AUCUN
       administrateur ne lit un devis (cas 12, 28, 33). « Ni à votre client »
       est vrai par construction : une fiche du carnet n'a aucun lien vers un
       compte Opus (pas de `compte_id`, section 41).

       « Le seul artisan qui y tient un carnet ou y prépare des devis » :
       relevé par la forme le 21/10 (1 ligne dans `clients`, aucun devis — la
       section 49 n'est pas encore sur la vraie base). À RELIRE sur la vraie
       base avant d'appliquer (étape 9 du lot 1), par le nombre de `pro_id`
       distincts dans `clients` ET dans `devis` : le frère du propriétaire
       peut l'avoir rendue fausse. « Ou y prépare des devis » ajouté le 22/10
       (relecture « conformité » des étapes 4 à 7, mineur 3) : la phrase ne
       parlait que du carnet. */
    texte: !EDITEUR.contratSousTraitance
      ? 'Si vous êtes artisan, Opus vous permet de tenir un carnet de '
        + 'clients et de préparer des devis. Un devis se rattache à une fiche '
        + 'de votre carnet et porte souvent l’adresse des travaux, c’est-à-dire '
        + 'le domicile de votre client. Ces informations concernent des personnes qui, le '
        + 'plus souvent, n’ont pas de compte Opus : vous en êtes le responsable du traitement, et '
        + 'Opus n’en est que le sous-traitant (article 28 du RGPD). Le '
        + 'contrat qui doit encadrer cette relation n’est pas encore '
        + 'publié : Opus n’est pas ouverte au public, et le seul artisan '
        + 'qui y tient un carnet ou y prépare des devis est l’auteur de '
        + 'l’application lui-même.\n\nCe qui est déjà garanti '
        + 'par la base de données, et vérifié : parmi les utilisateurs d’Opus, '
        + 'votre carnet et vos devis ne sont lisibles que de vous ; aucun écran '
        + 'd’Opus ne les montre à '
        + 'quelqu’un d’autre — ni à un autre artisan, ni à votre client, ni à '
        + 'un visiteur, ni dans l’espace d’administration ; rien de leur '
        + 'contenu n’apparaît sur votre fiche publique, dans le fil ou dans '
        + 'une notification ; vous pouvez les exporter et les supprimer à '
        + 'tout moment ; et ils partent entièrement avec votre compte.\n\n'
        + CE_QUI_RESTE_D_UN_CLIENT
        + '\n\nUne exception à dire clairement : quand vous tapez '
        + 'l’adresse d’un client, ou le lieu des travaux d’un devis, et que '
        + 'l’application vous propose des '
        + 'suggestions, le texte en cours de saisie est envoyé à la Base '
        + 'Adresse Nationale, le service public français des adresses. Ce '
        + 'qui part, c’est l’adresse que vous tapez, et rien d’autre : '
        + 'jamais le nom de votre client, jamais son téléphone, jamais le '
        + 'fait que ce soit un client.'
      : 'Le carnet de clients d’un artisan, et les devis qu’il prépare, '
        + 'contiennent des données '
        + 'personnelles sur des tiers. L’artisan en est le responsable du '
        + 'traitement ; l’éditeur d’Opus agit comme sous-traitant au sens '
        + 'de l’article 28 du RGPD, dans les limites fixées par le contrat '
        + 'de sous-traitance qui lui est opposable. L’éditeur ne traite ces '
        + 'données que pour fournir le service, ne les transmet à personne '
        + 'd’autre — sauf l’adresse tapée dans un champ de lieu (l’adresse d’un '
        + 'client, le lieu des travaux d’un devis), envoyée à la Base Adresse '
        + 'Nationale pour proposer des suggestions —, et les restitue ou les '
        + 'efface sur demande. '
        + CE_QUI_RESTE_D_UN_CLIENT,
  },
  {
    titre: 'À qui vos données sont transmises',
    /* LA BASE ADRESSE NATIONALE MANQUAIT À CETTE LISTE depuis le premier
       jour, et ce n'était déjà pas juste : chaque champ de ville du projet
       l'interroge — l'inscription, le profil, une annonce, une demande, le
       SOS. Le lot du 11/10/2026 l'a rendu plus net en faisant proposer
       l'ADRESSE D'UN CLIENT, c'est-à-dire d'une personne qui n'a pas de
       compte et qui n'a rien accepté. Une section qui s'appelle « à qui vos
       données sont transmises » et qui oublie un destinataire ne vaut rien,
       même quand ce destinataire est un service public français. */
    texte: 'Supabase, pour l’hébergement de la base et des fichiers. '
      + 'Cloudinary, pour la compression des vidéos et le montage — les vidéos '
      + 'publiées y transitent. L’API Recherche d’entreprises de l’État '
      + '(recherche-entreprises.api.gouv.fr), qui publie le répertoire Sirene de '
      + 'l’INSEE, quand vous faites consulter un numéro SIRET : seul ce numéro y est '
      + 'envoyé, depuis les serveurs d’Opus — jamais votre nom, jamais votre adresse '
      + 'électronique, jamais votre adresse IP. La Base Adresse Nationale '
      + '(api-adresse.data.gouv.fr), le service public français des adresses, '
      + 'chaque fois qu’un champ de lieu vous propose des suggestions : seul '
      + 'le texte que vous êtes en train de taper y est envoyé — jamais votre '
      + 'nom, jamais celui de votre client, et rien n’y est conservé qui vous '
      + 'désigne. VIES (ec.europa.eu), le service de la Commission européenne qui '
      + 'interroge l’administration fiscale de chaque pays, quand vous faites contrôler le '
      + 'numéro de TVA de votre entreprise que l’annuaire ne publie pas : seul ce numéro y '
      + 'est envoyé, depuis les serveurs d’Opus — jamais votre nom, jamais votre adresse '
      + 'électronique, jamais votre adresse IP. C’est l’administration fiscale française '
      + 'qui y répond ; Opus ne garde de sa réponse que « reconnu » ou « refusé », et sa '
      + 'date, jamais le nom ni l’adresse qu’elle renvoie. Anthropic (États-Unis), UNIQUEMENT quand vous '
      + 'appuyez sur « Améliorer avec l’IA » ou sur l’assistant de '
      + 'présentation : le texte que vous avez écrit est alors envoyé pour '
      + 'être relu, et n’est pas utilisé pour entraîner de modèle. Ces '
      + 'transferts hors Union européenne reposent sur les clauses '
      + 'contractuelles types de la Commission européenne.',
  },
  {
    titre: 'Combien de temps',
    /* « SIX MOIS, COMME LA LOI L'IMPOSE » ÉTAIT FAUX (relecture « droit »,
       constat 10) : en offre gratuite, Supabase garde ses journaux UN jour,
       et rien dans le dépôt ne fondait « la loi l'impose ». La phrase dit
       maintenant ce qui est vrai aujourd'hui. Et l'empreinte d'adresse IP
       n'a AUCUNE durée promise : le ménage n'a lieu qu'à l'occasion d'une
       consultation, donc personne ne peut garantir « 24 heures ».

       LOT 1 DU DEVIS (22/10/2026), critique « droit » I6 : le texte d'une
       demande est recopié dans l'objet d'un devis (`devisDepuisDemande`), et
       le nom, le téléphone et la commune d'un demandeur dans un carnet
       (« Ajouter à mes clients », section 41). Ces copies SURVIVENT à la
       suppression du compte du particulier — c'est voulu (l'essai 49, cas
       23, l'exige : un devis ne perd pas son objet), et elles relèvent de
       l'artisan, responsable de son carnet. Le texte le dit, et dit à qui
       s'adresser. « À trois exceptions près » est retiré : une énumération
       qui annonce son nombre se trompe le jour où elle s'allonge. Et AUCUNE
       durée de conservation d'un devis n'est promise : la purge à un an est
       une décision du 17/10 dont le mécanisme est au lot 4.

       LES TROIS GENRES DE DEMANDE, et pas deux (relecture « conformité » des
       étapes 4 à 7, important 1) : « Ajouter à mes clients » est offert sur
       TOUTE demande reçue acceptée ou terminée, rappels compris — et une
       demande de rappel porte le nom et le téléphone écrits par le
       particulier. « De devis ou d'urgence » disait moins que la vérité ;
       `verifier-legal` tire désormais la liste des genres du CODE. */
    texte: 'Vos données sont conservées tant que votre compte existe. À sa '
      + 'suppression, elles sont effacées immédiatement, sauf ce qui '
      + 'suit : les avis et commentaires laissés chez d’autres sont conservés '
      + 'sans votre nom ; les signalements sont conservés un an, sans le nom '
      + 'de celui qui les a déposés ; les décisions de l’administration qui vous '
      + 'concernent restent à son journal — la décision, le motif écrit par '
      + 'l’administrateur et, pour une entreprise, son numéro SIREN ; et ce que '
      + 'vous avez écrit à un artisan dans une demande — de devis, de rappel ou '
      + 'd’urgence — et '
      + 'qu’il a repris dans son carnet de clients ou dans un devis, relève de lui : '
      + 'la suppression de votre compte ne l’efface pas de ses documents — pour '
      + 'cela, adressez-vous à lui. Si vous êtes artisan, vos devis en préparation '
      + 'sont conservés tant que vous ne les supprimez pas, et partent avec votre '
      + 'compte. Si '
      + 'l’administration a retiré une entreprise à votre compte, son numéro SIREN '
      + 'reste en outre réservé, sans aucune autre information, jusqu’à ce que son '
      + 'titulaire en obtienne le rattachement : sans cela, il suffirait de '
      + 'supprimer son compte pour le reprendre. Une demande '
      + 'd’ouverture de compte professionnel, '
      + 'acceptée ou refusée, reste attachée à votre compte, apparaît dans « Récupérer '
      + 'mes données », et disparaît avec lui. Si elle est refusée, votre compte reste '
      + 'un compte particulier ; vous pouvez le supprimer à tout moment. Le résultat '
      + 'd’une consultation du répertoire et l’empreinte d’adresse IP qui l’accompagne '
      + 'sont effacés une fois leur durée d’usage passée, lors d’une consultation '
      + 'suivante : ce ménage n’a lieu qu’à cette occasion, aucune durée maximale ne '
      + 'peut donc être promise. Le numéro de TVA que VIES a reconnu, et la date de ce '
      + 'contrôle, restent attachés à votre compte et partent avec lui. Pour limiter les '
      + 'contrôles auprès de VIES, Opus compte ceux de chaque compte, et retient quelques '
      + 'heures qu’un numéro vient d’être refusé, sous une empreinte qui ne laisse lire ni '
      + 'le compte ni le numéro ; ces compteurs sont effacés lors d’un contrôle suivant, '
      + 'plus d’un jour après, y compris si le compte a été supprimé entre-temps : comme '
      + 'pour la consultation du répertoire, aucune durée maximale ne peut donc être '
      + 'promise. Les journaux techniques de l’hébergeur, qui contiennent '
      + 'l’adresse IP des appareils, sont effacés par lui au bout d’un jour, selon '
      + 'l’offre souscrite aujourd’hui.',
  },
  {
    titre: 'Vos droits, et comment les exercer ICI',
    texte: 'Accès et portabilité : Profil → Confidentialité et sécurité → '
      + '« Récupérer mes données » vous rend tout ce que nous avons, en '
      + 'JSON. Rectification : Profil → Modifier mon profil. Effacement : '
      + 'Profil → Confidentialité et sécurité → « Supprimer mon compte », '
      + 'immédiat et sans intermédiaire. '
      + parEcrit(
        (adresse) => `Opposition et limitation : écrivez à ${adresse}. `
          + 'Nous répondons sous un mois.',
        'Opposition et limitation : aucune adresse de contact n’est encore '
          + 'publiée, ces deux droits ne peuvent donc pas s’exercer par '
          + 'écrit aujourd’hui. C’est à corriger avant toute ouverture au '
          + 'public.',
      ),
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
