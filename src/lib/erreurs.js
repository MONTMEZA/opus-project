/**
 * DIRE CE QUI S'EST PASSÉ, EN FRANÇAIS, ET CE QU'IL FAUT FAIRE.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * La traduction des erreurs vivait ENFERMÉE dans `AuthScreen.js`. Un
 * échec de connexion disait donc « Email ou mot de passe incorrect » —
 * très bien —, mais partout ailleurs dans l'application, le même défaut
 * sortait en anglais, tel que Supabase l'avait écrit :
 *
 *     « Failed to fetch »
 *     « new row violates row-level security policy for table "posts" »
 *     « JWT expired »
 *
 * Un propriétaire qui débute lit ça et ne peut rien en faire. Pire : il ne
 * peut même pas savoir si c'est SON réseau, SA faute, ou un défaut du
 * programme.
 *
 * LE CAS LE PLUS FRÉQUENT N'ÉTAIT PAS TRAITÉ DU TOUT
 * ---------------------------------------------------
 * Le réseau. Un artisan travaille dans une cave, dans un sous-sol, dans un
 * hameau. Perdre la 4G est la situation NORMALE, pas l'exception — et
 * l'application répondait « Failed to fetch », ce qui ressemble à une
 * panne du logiciel alors que c'est l'ascenseur.
 *
 * LA RÈGLE TENUE ICI
 * ------------------
 *   1. on dit ce qui s'est passé, en français ;
 *   2. on dit ce qu'il faut FAIRE, quand il y a quelque chose à faire ;
 *   3. on garde le motif technique quand on ne sait pas traduire — c'est
 *      souvent la seule chose exploitable, et la jeter serait pire.
 *
 * Ce qu'on ne fait PAS : inventer une explication rassurante. « Une erreur
 * est survenue » tout seul ne vaut rien.
 */

/**
 * CE QUE CHAQUE CONTRAINTE DE LA BASE VEUT DIRE, À L'ÉCRAN — 18/10/2026.
 *
 * POURQUOI UNE TABLE, ET PAS UNE PHRASE GÉNÉRALE
 * ----------------------------------------------
 * Jusqu'ici, toute contrainte `check` refusée rendait la même phrase : « la
 * base a refusé cette valeur (contrainte « x »). Le plus souvent,
 * `schema.sql` n'a pas été rejoué. » C'était juste pour la panne du format
 * « montage » (une valeur que l'APPLICATION envoie sans l'avoir déclarée) ;
 * c'est FAUX pour une contrainte qui garde ce qu'un artisan tape. Un médiateur
 * à moitié rempli, un nom d'entrepreneur individuel sans « EI » : ce n'est ni
 * un schéma oublié ni une panne, c'est une saisie à corriger — et la phrase
 * l'envoyait chercher dans un fichier qu'il n'ouvrira jamais.
 *
 * Une contrainte qui garde une SAISIE a donc sa phrase ici, qui dit quoi
 * corriger. La piste « schema.sql » ne reste que pour une contrainte
 * INCONNUE de cette table, c'est-à-dire une faute de développeur.
 *
 * Les phrases commencent par une minuscule : `messageClair` les pose après
 * « Vos informations de devis : », et `messageDeContrainte` leur met la
 * majuscule quand elles s'affichent seules, sous un champ.
 *
 * LES NOMS SONT CEUX DE LA BASE, au caractère près. `verifier-emetteur`,
 * `verifier-clients`, `verifier-devis` et `verifier-postes` le comparent :
 * une phrase rangée sous un nom qui n'existe pas ne s'afficherait jamais,
 * et rien ne le dirait.
 */
const TEXTE_TROP_LONG = 'un de vos textes dépasse la longueur prévue : le formulaire indique la '
  + 'limite de chaque champ.';
/* Une valeur que CETTE version de l'application n'envoie jamais : la
   contrainte existe, c'est l'envoi qui ne vient pas d'ici. La piste juste
   est la mise à jour, pas le schéma. */
const APPLICATION_EN_RETARD = 'la base a reçu une valeur que cette version d’Opus n’envoie jamais : mettez '
  + 'l’application à jour, puis réessayez. Rien n’a été enregistré.';
export const MESSAGES_CONTRAINTE = Object.freeze({
  /* --- « Mon entreprise » pour les devis : section 46 de `schema.sql` --- */
  emetteur_denomination_ei_check: 'votre nom d’entrepreneur individuel s’écrit avec votre nom suivi '
    + 'de « EI » ou de « entrepreneur individuel » (« EIRL » pour une EIRL) : la mention seule ne '
    + 'suffit pas, c’est la règle du code de commerce (R. 526-27).',
  emetteur_registre_check: 'choisissez où votre entreprise est immatriculée : RCS, RNE seulement, '
    + 'ou aucun registre.',
  emetteur_greffe_check: 'une entreprise immatriculée au RCS indique la ville de son greffe : '
    + 'écrivez-la, ou choisissez un autre registre.',
  emetteur_capital_check: 'le capital s’écrit comme un montant positif.',
  emetteur_capital_variable_check: 'une société à capital variable n’indique pas de montant : '
    + '« à capital variable » le remplace.',
  emetteur_tva_check: 'choisissez la franchise en base ou le régime réel.',
  emetteur_email_check: 'cette adresse e-mail n’en est pas une : il manque l’arobase, ou le point '
    + 'du domaine.',
  emetteur_telephone_check: 'ce numéro de téléphone n’a pas le bon nombre de chiffres.',
  emetteur_code_postal_check: 'un code postal fait cinq chiffres.',
  emetteur_mediateur_check: 'un médiateur s’indique en entier (son nom, son adresse et son site) '
    + 'ou pas du tout : une mention incomplète vaut moins qu’une absence.',
  emetteur_mediateur_site_check: 'le site du médiateur doit être une adresse web, qui commence '
    + 'par « https:// » ou « www. ».',
  emetteur_longueurs_check: TEXTE_TROP_LONG,
  emetteur_assurance_nature_check: 'choisissez décennale, responsabilité civile professionnelle, '
    + 'ou autre.',
  emetteur_assurance_complete_check: 'une assurance s’écrit avec sa nature, le nom de l’assureur, '
    + 'ses coordonnées et sa couverture géographique : c’est ce que le devis doit porter. Le '
    + 'numéro de contrat, lui, est facultatif.',
  emetteur_assurance_libelle_check: 'nommez cette assurance : « autre » ne dit rien au client.',
  emetteur_assurance_chemin_check: 'cette attestation n’est pas rangée dans votre espace : '
    + 'envoyez-la depuis ce formulaire.',
  emetteur_assurance_longueurs_check: TEXTE_TROP_LONG,
  tarif_frais_check: 'les frais de déplacement s’écrivent comme un montant entre 0 et 10 000 €.',
  tarif_frais_zero_check: 'vous avez indiqué 0 € et des conditions. Si vous facturez selon des '
    + 'conditions, laissez le montant vide et écrivez-les ; si vous ne facturez jamais de '
    + 'déplacement, touchez « Je ne facture pas de frais de déplacement ».',
  tarif_frais_texte_check: TEXTE_TROP_LONG,

  /* --- Les tarifs réunis — devis, fiche et SOS : section 47 (lot T) ---
     Ce sont aussi des SAISIES : un taux horaire à 0 €, une majoration à
     250 %, des tarifs affichés sans aucun prix. Le formulaire refuse avant
     d'envoyer (`tarifsDepuisFormulaire`, `validerTarifs`) ; ces phrases ne
     sortent donc que d'une version en retard ou d'un client modifié, et
     ce jour-là elles doivent dire quoi toucher, pas « schema.sql ». */
  tarif_affiche_check: 'pour afficher vos tarifs, déclarez au moins vos frais de déplacement, '
    + 'votre taux horaire ou le prix de vos devis. Pour tout retirer, éteignez d’abord « Afficher '
    + 'mes tarifs sur ma fiche ».',
  tarif_taux_horaire_check: 'un taux horaire s’écrit comme un montant entre 1 € et 1 000 € TTC de '
    + 'l’heure. Si vous ne travaillez qu’au forfait, laissez-le vide.',
  tarif_majoration_check: 'la majoration de nuit et de week-end s’écrit en pourcentage, entre 0 et '
    + '200 %.',
  tarif_devis_check: 'le prix d’un devis s’écrit comme un montant entre 0 et 1 000 € TTC.',
  tarif_decompte_texte_check: TEXTE_TROP_LONG,

  /* --- La disponibilité aux urgences : sections 10 et 47 ---
     Le rayon et le délai n'avaient AUCUNE borne jusqu'au lot T : un client
     modifié qui écrivait 100 000 km apparaissait dans la recherche de tous
     les particuliers. Les deux anciennes contraintes de la section 10
     n'avaient pas de phrase non plus : elles sortaient avec la piste
     « schema.sql », fausse pour une saisie. */
  sos_rayon_check: 'votre rayon d’intervention s’écrit en kilomètres, entre 1 et 200.',
  sos_delai_check: 'votre délai d’arrivée habituel s’écrit en minutes, entre 5 et 600.',
  sos_availability_majoration_check: 'la majoration s’écrit en pourcentage, entre 0 et 200 %.',
  sos_availability_metier_key_check: 'ce métier n’a pas d’urgence dans Opus : choisissez plomberie, '
    + 'électricité, serrurerie ou chauffage.',

  /* --- Le carnet de clients : section 41 ---
     Ces contraintes gardent elles aussi une SAISIE. Le formulaire refuse
     avant d'envoyer (`validerClient`), donc ces phrases ne sortent que
     d'une version en retard de l'application ou d'un client modifié — mais
     ce jour-là, « schema.sql n'a pas été rejoué » serait une piste fausse
     pour une faute de frappe dans un SIRET. */
  client_type_check: 'choisissez « particulier » ou « entreprise » pour ce client.',
  client_nom_check: 'le nom du client est obligatoire, et ne dépasse pas 120 caractères.',
  client_siret_check: 'un SIREN fait 9 chiffres, un SIRET 14 : le numéro saisi n’a pas cette '
    + 'longueur.',
  client_siret_particulier_check: 'un particulier n’a pas de SIRET : passez ce client en '
    + '« entreprise », ou retirez le numéro.',
  client_email_check: 'cette adresse e-mail n’en est pas une : il manque l’arobase, ou le point '
    + 'du domaine.',
  client_code_postal_check: 'un code postal fait cinq chiffres.',
  client_telephone_check: TEXTE_TROP_LONG,
  client_notes_check: TEXTE_TROP_LONG,
  client_adresse_check: TEXTE_TROP_LONG,
  client_ville_check: TEXTE_TROP_LONG,

  /* --- Le chiffrage d'un devis : section 49 (lot 1 du module devis) ---
     LES VINGT-TROIS, et pas seulement celles qu'on tape. L'écran refuse
     AVANT d'envoyer (`validerLigne`, `validerDevis`, dans `devis.js`, avec
     les mêmes noms) : ces phrases sortent donc d'une version en retard,
     d'un client modifié — ou de la base qui voit ce que l'écran ne voit
     pas, comme le plafond d'un devis atteint par la somme de lignes toutes
     recevables. Celles que l'application n'envoie JAMAIS (la source, le
     statut, les totaux, le type d'une ligne, la ventilation qu'aucun client
     n'écrit) disent « mettez Opus à jour », et surtout pas « schema.sql n'a
     pas été rejoué » : la contrainte existe, c'est la valeur reçue qui ne
     vient pas de cette version. `verifier-devis` compare cette liste aux
     contraintes de la section 49, dans les deux sens. */
  devis_delai_check: TEXTE_TROP_LONG,
  devis_lieu_adresse_check: TEXTE_TROP_LONG,
  devis_lieu_code_postal_check: 'un code postal fait cinq chiffres.',
  devis_lieu_ville_check: TEXTE_TROP_LONG,
  devis_objet_check: TEXTE_TROP_LONG,
  devis_plafond_check: 'ce devis dépasserait 99\u00a0999\u00a0999,99\u00a0€ : il y a sans doute un zéro de trop dans '
    + 'une ligne. Rien n’a été enregistré pour cette ligne.',
  /* LES DEUX BORNES, et le moyen de ne pas en mettre : « au plus 5 % »
     seul serait FAUX pour un « 0 » tapé, que la base refuse aussi (la
     retenue va de 0,01 % à 5 %). Sans retenue, le champ reste vide —
     relecture des étapes 0-2 du lot 1, mineur 9. */
  devis_retenue_check: 'une retenue de garantie s’écrit entre 0,01\u00a0% et 5\u00a0% (loi n°\u00a071-584 du 16/07/1971, '
    + 'art. 1er). Si vous n’en prévoyez pas, laissez le champ vide.',
  devis_source_check: APPLICATION_EN_RETARD,
  devis_statut_check: APPLICATION_EN_RETARD,
  devis_totaux_check: APPLICATION_EN_RETARD,
  devis_ligne_designation_check: 'écrivez ce que comprend cette ligne (2\u00a0000 caractères au plus).',
  devis_ligne_forme_check: 'une ligne chiffrée a une quantité, une unité, un prix et un taux de TVA ; un titre ou '
    + 'une réserve n’en a pas.',
  devis_ligne_offert_check: 'un prix de 0 s’écrit avec l’interrupteur « Offert » : sinon, écrivez le prix.',
  devis_ligne_prix_check: 'un prix ne peut pas être négatif ; au-delà de 99\u00a0999\u00a0999,99\u00a0€, il y a un zéro '
    + 'de trop.',
  devis_ligne_quantite_check: 'une quantité est plus grande que zéro, et au plus 99\u00a0999,999.',
  devis_ligne_surfaces_check: 'une surface est plus grande que zéro, et au plus 99\u00a0999,999\u00a0m².',
  devis_ligne_taux_check: 'choisissez un taux de TVA de la liste : 20\u00a0%, 10\u00a0% ou 5,5\u00a0% (aucun en '
    + 'franchise).',
  devis_ligne_total_check: 'le total de cette ligne (ou la valeur offerte) dépasse 99\u00a0999\u00a0999,99\u00a0€ : il '
    + 'y a sans doute un zéro de trop dans la quantité ou le prix.',
  devis_ligne_type_check: APPLICATION_EN_RETARD,
  devis_ligne_unite_check: 'choisissez une unité dans la liste.',
  devis_tva_arrondi_check: APPLICATION_EN_RETARD,
  devis_tva_nb_check: APPLICATION_EN_RETARD,
  devis_tva_taux_check: APPLICATION_EN_RETARD,

  /* --- La base de postes : section 50 (lot P du module devis) ---
     LES CINQ CONTRAINTES, ET L'INDEX DU DOUBLON. Un 23505 se reconnaît au
     nom de son index, que `messageClair` lit après « constraint » : la
     phrase est donc rangée ici sous `idx_base_postes_rapprochement`, comme
     une contrainte. La feuille d'ajout refuse AVANT d'envoyer
     (`validerPoste`, `postes.js`, dans l'ordre alphabétique de la base) et,
     sur un 23505, elle relit la base et MONTRE le poste qui existe : ces
     phrases ne sortent donc que d'une version en retard, d'un autre
     appareil, ou d'une relecture ratée — et ce jour-là elles disent quoi
     faire, jamais « schema.sql n'a pas été rejoué ».

     La phrase de `base_poste_designation_check` est aussi celle d'une
     phrase de plus de 2 000 caractères : au-delà, la clé de
     rapprochement n'existe pas (la garde de la section 50.0), la
     contrainte de la clé se tait, et c'est celle de la phrase qui parle.
     `verifier-postes` (D) compare ces six noms à la section 50. */
  base_poste_designation_check: 'la phrase du poste est vide ou dépasse 2\u00a0000 caractères : écrivez-la, ou '
    + 'raccourcissez-la.',
  base_poste_prix_check: 'un prix de référence s’écrit au centime, entre 0,01\u00a0€ et 99\u00a0999\u00a0999,99\u00a0€. '
    + 'Pour ne pas en fixer, laissez le champ vide.',
  base_poste_prix_date_check: 'la date du prix de référence est posée par la base : mettez Opus à jour, puis '
    + 'réessayez.',
  base_poste_rapprochement_check: 'la phrase du poste ne contient ni lettre ni chiffre : écrivez ce que vous '
    + 'faites, puis ajoutez-la.',
  base_poste_unite_check: 'un poste a toujours une unité, une des sept de vos devis : choisissez-la sur la '
    + 'ligne, puis ajoutez-la.',
  idx_base_postes_rapprochement: 'ce poste est déjà dans votre base, sous une phrase presque identique — même '
    + 'unité, même fourniture. Son prix de référence se change depuis la ligne (« Changer ma référence ») ou '
    + 'dans « Ma base de postes ».',
});

/**
 * LES REFUS QUE LA BASE ÉCRIT ELLE-MÊME POUR UN DEVIS (section 49.6 de
 * `schema.sql`), AU MOT PRÈS — OP013 à OP017.
 *
 * `messageClair` rend la phrase de la base TELLE QUELLE (un code `OP…` porte
 * déjà son français) : pour la vraie base, ces copies ne servent à rien.
 * Elles servent à la DÉMONSTRATION (`src/data/devis-demo.js`), qui doit
 * refuser avec les mots exacts de la base — une démonstration plus aimable
 * que le serveur masquerait ce que l'artisan rencontrera pour de vrai (la
 * première règle de CLAUDE.md). Deux écritures d'une même phrase ne valent
 * que tenues ensemble : `verifier-devis` les compare à `schema.sql`, octet
 * pour octet (les `''` du SQL y deviennent `'`, et le `%` d'OP017 le
 * plafond écrit à côté, 20).
 *
 * Les apostrophes sont DROITES ici, contrairement au reste de ce fichier :
 * ce sont celles que la base écrit.
 */
export const REFUS_DEVIS = Object.freeze({
  OP013_client: "Cette fiche n'est pas dans votre carnet : un devis ne se rattache qu'à vos propres clients.",
  OP013_demande: "Cette demande de devis ne vous a pas été adressée : un devis ne se rattache qu'à vos propres "
    + 'demandes.',
  OP013_urgence: "Cette urgence ne vous a pas été adressée : un devis ne se rattache qu'à vos propres urgences.",
  OP014: 'Un devis porte au plus 500 lignes : celui-ci est plein. Commencez-en un second, ou regroupez des lignes.',
  OP015_devis: 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. '
    + "Celle-ci, plus ancienne, n'a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui est "
    + "enregistré n'est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.",
  OP015_ligne: 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. '
    + "Cette ligne, plus ancienne, n'a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui "
    + "est enregistré n'est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.",
  OP016_devis: "Cette version d'Opus n'envoie pas de numéro d'écriture valable pour ce devis : rien n'a été "
    + "enregistré. Mettez l'application à jour, puis réessayez.",
  OP016_ligne: "Cette version d'Opus n'envoie pas de numéro d'écriture valable pour cette ligne : rien n'a été "
    + "enregistré. Mettez l'application à jour, puis réessayez.",
  OP017_demande: "Vous avez déjà 20 devis pour cette demande : supprimez un brouillon dont vous n'avez plus besoin "
    + "avant d'en commencer un autre.",
  OP017_urgence: "Vous avez déjà 20 devis pour cette urgence : supprimez un brouillon dont vous n'avez plus besoin "
    + "avant d'en commencer un autre.",
});

/**
 * LE REFUS QUE LA BASE ÉCRIT ELLE-MÊME POUR UN POSTE (section 50.4 de
 * `schema.sql`), AU MOT PRÈS — OP018, le plafond de 1 000 postes par
 * entreprise.
 *
 * La même raison que `REFUS_DEVIS` : `messageClair` rend la phrase de la
 * base TELLE QUELLE (un code `OP…` porte déjà son français) ; cette copie
 * sert à la DÉMONSTRATION (`src/data/devis-demo.js`), qui doit refuser avec
 * les mots exacts de la base. « 1 000 » s'écrit ici avec une espace
 * ORDINAIRE, contrairement aux autres nombres de ce fichier : c'est celle
 * de `schema.sql`, dont la section 50 ne porte aucun caractère invisible,
 * pas même une espace insécable. `verifier-postes` compare les deux, octet
 * pour octet, et compare ses chiffres au plafond (`v_plafond_postes`).
 */
export const REFUS_POSTES = Object.freeze({
  OP018: 'Votre base compte déjà 1 000 postes : retirez-en un dont vous ne vous servez plus, puis réessayez.',
});

/**
 * UN POSTE MODIFIÉ OU RETIRÉ ENTRE-TEMPS — et ça, ce n'est PAS la base qui
 * l'écrit (section 50.2 de `schema.sql`).
 *
 * Modifier ou retirer un poste part avec une CONDITION : « si sa date de
 * dernière écriture (`modifie_le`) est encore celle que j'ai lue ». Une
 * écriture partie avec une date périmée — le réseau a traîné, l'artisan a
 * corrigé depuis un autre appareil — ne trouve aucune ligne : la base ne
 * refuse rien, elle ne touche simplement rien. Laissée là, l'écran croirait
 * l'écriture faite : un échec qui ressemble à un succès. `api.js` lève donc
 * `ErreurPoste` avec cette phrase dès qu'une telle écriture n'a touché
 * aucune ligne, et l'écran RELIT la base — d'où « il a été relu ».
 *
 * Pas d'horloge `generation` comme pour un devis : un poste s'écrit
 * rarement, une écriture à la fois, et chacune attend sa réponse. La date
 * que la base pose suffit à reconnaître une écriture partie trop tôt.
 */
export const MODIFIE_ENTRE_TEMPS = 'Ce poste a été modifié entre-temps — peut-être depuis un autre appareil. '
  + 'Il a été relu : vérifiez, puis recommencez si besoin.';

/** L'erreur du « modifié entre-temps » : déjà en français, `messageClair` la
 *  rend telle quelle (comme `ErreurAssistant`). Elle vit ici, et pas dans
 *  `api.js`, parce que `node` sait ouvrir ce fichier : `verifier-postes` la
 *  fait tourner. */
export class ErreurPoste extends Error {
  constructor(message = MODIFIE_ENTRE_TEMPS) {
    super(message);
    this.name = 'ErreurPoste';
  }
}

/**
 * UNE SUPPRESSION QUI N'A RIEN SUPPRIMÉ PARCE QU'UN AUTRE APPAREIL A ÉCRIT
 * PLUS TARD — et ça, ce n'est PAS la base qui l'écrit.
 *
 * Une suppression de devis ou de ligne part avec une CONDITION (« si son
 * numéro d'écriture est plus ancien que le mien », section 49.5 bis) : elle
 * ne porte pas de valeur, donc la base ne peut pas la refuser — elle ne
 * supprime simplement rien. Laissée là, la file d'écriture croirait la
 * ligne partie alors qu'elle est toujours en base, retouchée ailleurs : un
 * échec qui ressemble à un succès. `api.js` RELIT donc après une
 * suppression qui n'a touché aucune ligne, et si la ligne est toujours là,
 * lève cette phrase avec le code OP015 — celui de l'horloge, pour que la
 * file relise l'horloge du devis et que « Réessayer » reparte au-dessus.
 * Effacer ce que l'autre appareil vient d'écrire reste le choix de
 * l'artisan, jamais celui de la file.
 */
export const SUPPRESSION_DEPASSEE = Object.freeze({
  devis: 'Ce devis a été modifié entre-temps — peut-être depuis un autre appareil : il n’a pas été supprimé, pour '
    + 'ne pas effacer la modification la plus récente. Rouvrez-le pour voir sa dernière version, puis réessayez.',
  ligne: 'Cette ligne a été modifiée entre-temps — peut-être depuis un autre appareil : elle n’a pas été supprimée, '
    + 'pour ne pas effacer la modification la plus récente. Rouvrez le devis pour voir sa dernière version, puis '
    + 'réessayez.',
});

/* « Vos informations de devis : » suivi de la phrase, ou la phrase seule
   avec sa majuscule. */
function phrase(sujet, message) {
  if (sujet) return `${sujet}${message}`;
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * La phrase d'une contrainte, prête à s'afficher SEULE sous un champ.
 *
 * L'écran l'appelle avec le nom que lui rend un validateur de démonstration
 * ou de formulaire (`validerEmetteur`, `validerTarifs`…), qui sont les
 * miroirs des contraintes de la base : les deux côtés disent ainsi la même
 * chose avec les mêmes mots. Un nom inconnu est une faute de développeur —
 * `verifier-emetteur` refuse qu'il en existe —, mais il ne doit jamais
 * laisser un champ en rouge sans explication.
 */
export function messageDeContrainte(nom) {
  const m = MESSAGES_CONTRAINTE[nom];
  if (m) return phrase('', m);
  return `Cette valeur n’est pas acceptée (règle « ${String(nom)} »).`;
}

/**
 * UNE REQUÊTE QUE LA BASE A ARRÊTÉE — 57014, « canceling statement due to
 * statement timeout ». Relecture sécurité du lot 1 du devis (étape 3,
 * 21/10/2026), mesuré : quand une opération dépassait les 8 s que la vraie
 * base accorde à un compte connecté, le message contenait « timeout »,
 * `estUnProblemeDeReseau()` le prenait pour une coupure, et l'écran disait
 * « pas de connexion » — à quelqu'un dont la connexion allait très bien, et
 * qui réessayait pour rien. La base a RÉPONDU : ce n'est pas le réseau.
 */
export function estUneRequeteArreteeParLaBase(e) {
  const code = String((e && e.code) || '');
  const m = String((e && e.message) || e || '').toLowerCase();
  return code === '57014' || m.includes('statement timeout') || m.includes('canceling statement');
}

/** Vrai quand l'erreur vient manifestement du réseau, pas du programme. */
export function estUnProblemeDeReseau(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  const nom = String((e && e.name) || '').toLowerCase();
  /* « timeout » ci-dessous vise le DÉLAI DU TÉLÉPHONE ; celui de la base
     (57014) n'est pas une coupure — voir juste au-dessus. */
  if (estUneRequeteArreteeParLaBase(e)) return false;
  return (
    m.includes('failed to fetch')
    /* Une requête ANNULÉE (par le délai du téléphone) : `postgrest-js` la
       rend sous la forme `{ message: 'AbortError: …', code: '' }`, sans
       `name` — elle sortait telle quelle, en anglais (relecture « données »
       des étapes 4 à 7). */
    || m.startsWith('aborterror')
    || m.includes('network request failed')
    || m.includes('load failed')
    || m.includes('networkerror')
    || m.includes('timeout')
    || m.includes('timed out')
    || nom === 'typeerror' && m.includes('fetch')
    || nom === 'aborterror'
    /* UNE FONCTION EDGE QU'ON N'A PAS PU JOINDRE — 15/10/2026.
       `supabase.functions.invoke` n'arrive jamais ici avec « Failed to
       fetch » : il ENVELOPPE l'échec dans une `FunctionsFetchError` dont le
       message est « Failed to send a request to the Edge Function ».
       Mesuré par la relecture du lot SIRET en faisant tourner ce fichier :
       un téléphone sans réseau affichait cette phrase en anglais, au moment
       précis où il ne fallait SURTOUT PAS laisser croire que le numéro
       était en cause. */
    || nom === 'functionsfetcherror'
  );
}

/**
 * CE QUE LA VÉRIFICATION D'UN SIRET A RENCONTRÉ, quand ce n'est pas une
 * réponse du serveur.
 *
 * La fonction Edge `siret` rend TOUTES ses issues en HTTP 200 — un numéro
 * introuvable est une réponse, pas une panne. Une erreur levée par
 * `functions.invoke` veut donc dire que la réponse n'est PAS arrivée, et
 * il y a trois façons de ne pas arriver, qui ne se disent pas pareil :
 *
 *   reseau                le téléphone n'a pas pu envoyer la demande
 *                         (`FunctionsFetchError`) ;
 *   lent                  la demande est partie, rien n'est revenu dans le
 *                         délai — `invoke` l'interrompt lui-même et la rend
 *                         en `FunctionsFetchError` aussi, avec une
 *                         `AbortError` dans `context`. C'est pourquoi on
 *                         regarde AUSSI le temps écoulé : selon la
 *                         plateforme, l'interruption ne porte pas toujours
 *                         son nom ;
 *   service_indisponible  le serveur a répondu, mais pas en 2xx
 *                         (`FunctionsHttpError`, `FunctionsRelayError`) :
 *                         une panne d'Opus.
 *
 * Aucune des trois n'accuse le numéro, et c'est toute la raison d'être de
 * cette fonction. Elle n'importe rien : `verifier-etats` la FAIT TOURNER
 * sur les trois erreurs de `functions-js`.
 */
export function issueDeVerification(erreur, ecouleMs = 0, delaiMs = 15000) {
  const nom = String((erreur && erreur.name) || '');
  const contexte = erreur && erreur.context;
  const interrompue = !!contexte && String(contexte.name || '') === 'AbortError';
  if (nom === 'FunctionsHttpError' || nom === 'FunctionsRelayError') {
    return { issue: 'service_indisponible' };
  }
  if (interrompue || (Number(ecouleMs) >= Number(delaiMs) && delaiMs > 0)) {
    return { issue: 'lent' };
  }
  if (nom === 'FunctionsFetchError' || estUnProblemeDeReseau(erreur)) {
    return { issue: 'reseau' };
  }
  /* Ce qu'on ne sait pas classer : une panne, pas un numéro faux. */
  return { issue: 'service_indisponible' };
}

/**
 * CE QU'UNE FONCTION EDGE A RÉPONDU, MÊME EN NON-2xx — 18/10/2026.
 *
 * `supabase.functions.invoke` transforme toute réponse non-2xx en
 * `FunctionsHttpError` dont le message est « Edge Function returned a
 * non-2xx status code », et ne lit PAS le corps. Mesuré ce jour-là avec le
 * vrai paquet, sans compte, sur la fonction `ai` : le corps disait
 * « L'assistant n'est accessible qu'une fois connecté », l'écran affichait
 * l'anglais. Le corps reste pourtant lisible, dans `context`.
 *
 * Rend une phrase en français, toujours :
 *   1. la phrase du serveur (`{ error }`), quand il en a écrit une ;
 *   2. pour un 401 sans phrase — la passerelle de Supabase refuse un jeton
 *      expiré avant que la fonction ne tourne, en anglais —, la session ;
 *   3. sinon `messageClair()` : le réseau, ou une panne d'Opus.
 *
 * `quoi` sert au troisième cas seulement : la phrase du serveur est déjà
 * complète, la préfixer la rendrait bancale.
 */
export async function messageDeFonctionEdge(erreur, quoi = '') {
  const nom = String((erreur && erreur.name) || '');
  const reponse = erreur && erreur.context;
  if ((nom === 'FunctionsHttpError' || nom === 'FunctionsRelayError')
    && reponse && typeof reponse.text === 'function') {
    let corps = null;
    try {
      corps = JSON.parse(await reponse.text());
    } catch (e) {
      corps = null;
    }
    const phraseServeur = corps && typeof corps.error === 'string' ? corps.error.trim() : '';
    if (phraseServeur) return phraseServeur;
    if (reponse.status === 401) {
      return phrase(quoi ? `${quoi} : ` : '', 'votre session a expiré. Fermez et rouvrez '
        + 'l\'application pour vous reconnecter.');
    }
  }
  return messageClair(erreur, quoi);
}

/** Vrai quand la session a expiré : il faut se reconnecter, rien d'autre. */
export function estUneSessionExpiree(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  /* PGRST301 à PGRST303 : PostgREST n'a pas pu valider le jeton (expiré,
     illisible, « JWT issued at future » quand les horloges divergent). Le
     message sortait en anglais (relecture « données » des étapes 4 à 7). */
  return /^PGRST30\d$/.test(String((e && e.code) || ''))
    || m.includes('jwt expired')
    || m.includes('invalid refresh token')
    || m.includes('refresh_token_not_found')
    || m.includes('aucune session ouverte');
}

/**
 * LE SERVICE D'OPUS N'A PAS RÉPONDU CORRECTEMENT — 22/10/2026.
 *
 * Relevé par la relecture « données » des étapes 4 à 7 en faisant tourner
 * `messageClair` sur les formes que PostgREST, PostgreSQL et la passerelle
 * de Supabase rendent PENDANT UNE PANNE : toutes sortaient en anglais sur
 * chaque rangée d'un devis — « Could not query the database for the schema
 * cache. Retrying. », « An invalid response was received from the upstream
 * server », une page HTML de Cloudflare entière. C'est exactement la panne
 * vécue le 02/10 (la couche API qui redémarre). Et `PGRST003` (« Timed out
 * acquiring connection from connection pool ») passait pour une coupure du
 * TÉLÉPHONE : la faute était mise sur le réseau de l'artisan.
 *
 * Lu par le CODE d'abord : PGRST000 à PGRST009 (PostgREST ne joint pas la
 * base), 08xxx (connexion perdue), 53xxx (ressources épuisées), 57P0x (la
 * base s'arrête ou redémarre), 40001 et 55P03 (une transaction annulée ou un
 * verrou pas obtenu : rien n'a été écrit) ; puis par le TEXTE, pour ce qui
 * arrive sans code — une passerelle (« upstream », une page HTML,
 * « bad gateway », « service unavailable »), « too many requests ».
 */
export function estUnePanneDuService(e) {
  const code = String((e && e.code) || '');
  const m = String((e && e.message) || e || '').toLowerCase();
  if (/^PGRST00\d$/.test(code) || /^08[0-9A-Z]{3}$/.test(code) || /^53[0-9A-Z]{3}$/.test(code)
    || /^57P0\d$/.test(code) || code === '40001' || code === '55P03' || code === '429') return true;
  return /too many requests|upstream|<!doctype|<html|bad gateway|service unavailable|gateway time-?out|\berror 52\d\b/.test(m);
}

/**
 * Le message à montrer. Toujours en français, toujours utilisable.
 *
 * `quoi` dit ce qu'on était en train de faire — « Votre publication »,
 * « Votre profil ». Sans lui, « Impossible » ne dit pas impossible de quoi.
 *
 * `rienAffiche` : l'écran n'a RIEN à montrer (une première lecture ratée).
 * La phrase du réseau ne promet alors pas que « ce qui est déjà affiché
 * reste lisible » — c'était faux sous « Lecture impossible » (relecture
 * « écran » des étapes 4 à 7, C9).
 */
export function messageClair(e, quoi = '', { rienAffiche = false } = {}) {
  const brut = String((e && e.message) || e || '').trim();
  const m = brut.toLowerCase();
  const sujet = quoi ? `${quoi} : ` : '';

  /* LES CODES MAISON DE LA BASE (OP001 et suivants — OP011 naît avec la
     section 46, OP012 avec la section 47 : une version ancienne de
     l'application qui écrit encore des tarifs dans `sos_availability` ;
     OP013 à OP017 avec la section 49, OP018 — le plafond de la base de
     postes — avec la section 50 ; OP003 reste réservé au devis remis)
     PORTENT DÉJÀ LEUR PHRASE,
     en français, et elle dit quoi faire : « touchez « Vérifier » à
     nouveau », « Profil → Passer en compte professionnel ». La reformuler
     ici, c'est écrire la même règle à deux endroits — et la première des
     deux qu'on oublie de corriger est celle qui ment. On la rend telle
     quelle, AVANT tout le reste : un mot comme « permission » dans l'une
     d'elles ne doit pas la faire passer pour un droit manquant. */
  const code = String((e && e.code) || '');
  if (/^OP\d{3}$/.test(code) && brut) return brut;

  /* Même raison pour l'ASSISTANT (`ErreurAssistant`, `src/lib/ai.js`) : son
     message a déjà été traduit, une fois, par `messageDeFonctionEdge`. Le
     repasser ici le ferait relire par les règles du réseau — « connexion »
     ou « délai » dans une phrase du serveur ne disent pas que le téléphone
     est hors ligne. */
  if (String((e && e.name) || '') === 'ErreurAssistant' && brut) return brut;

  /* Même raison pour un POSTE modifié ou retiré entre-temps (`ErreurPoste`,
     levée par `api.js`) : sa phrase dit déjà ce qui s'est passé et quoi
     faire. Repassée par les règles qui suivent, « appareil » ou « relu »
     n'y changeraient rien — mais la règle est la même : traduite une fois. */
  if (String((e && e.name) || '') === 'ErreurPoste' && brut) return brut;

  /* La base a répondu qu'elle avait ARRÊTÉ l'opération (57014) : ce n'est
     pas le réseau, et le dire serait envoyer chercher la panne au mauvais
     endroit. Rien n'a été enregistré — la transaction est annulée en
     entier. Avant le réseau, puisque son message contient « timeout ». */
  if (estUneRequeteArreteeParLaBase(e)) {
    return phrase(sujet, 'l’opération a pris trop de temps du côté d’Opus, et la base l’a arrêtée. '
      + 'Ce n’est pas votre connexion, et rien n’a été enregistré : réessayez dans quelques minutes.');
  }

  /* LE SERVICE D'OPUS EN PANNE — avant le réseau : `PGRST003` contient
     « timed out », et ce n'est pas le téléphone qui a lâché. */
  if (estUnePanneDuService(e)) {
    return phrase(sujet, 'le service d’Opus n’a pas répondu correctement. Ce n’est ni de votre fait ni de '
      + 'votre connexion : réessayez dans un instant.');
  }

  /* Le réseau d'abord : c'est le cas le plus fréquent sur un chantier, et
     celui où l'utilisateur n'a rien fait de mal. */
  /* `phrase()` partout où le message commence par une minuscule : appelé
     SANS sujet, « pas de connexion. » ouvrait une phrase par une minuscule
     (relecture du 18/10/2026, sous le champ des frais de déplacement). */
  if (estUnProblemeDeReseau(e)) {
    if (rienAffiche) return phrase(sujet, 'pas de connexion. Vérifiez votre réseau, puis réessayez.');
    return phrase(sujet, 'pas de connexion. Vérifiez votre réseau — '
      + 'ce qui est déjà affiché reste lisible, et vous pourrez réessayer.');
  }
  if (estUneSessionExpiree(e)) {
    return phrase(sujet, 'votre session a expiré. Fermez et rouvrez l\'application '
      + 'pour vous reconnecter.');
  }

  /* Une fonction Edge qui a RÉPONDU, mais pas en 2xx : une panne d'Opus,
     pas une faute de celui qui l'appelle. Sans cette ligne, l'écran
     affichait « Edge Function returned a non-2xx status code ». */
  const nomErreur = String((e && e.name) || '');
  if (nomErreur === 'FunctionsHttpError' || nomErreur === 'FunctionsRelayError') {
    return phrase(sujet, 'le service d’Opus n’a pas répondu correctement. Ce n’est pas '
      + 'de votre fait : réessayez dans quelques minutes.');
  }

  /* --- TROIS REFUS DE LA BASE QUI SORTAIENT EN ANGLAIS — 18/10/2026 ---
     Lus par le CODE d'abord (PostgREST le transmet, la démonstration le
     pose), puis par le texte. Les textes ci-dessous sont ceux de
     PostgreSQL 16, relevés tels quels ; `verifier-emetteur` fait tourner
     cette fonction dessus. */

  /* 428C9 — UNE VALEUR ENVOYÉE DANS UNE COLONNE QUE LA BASE CALCULE
     ELLE-MÊME : une colonne GÉNÉRÉE, comme la clé de rapprochement d'un
     poste (`base_postes.cle_rapprochement`, section 50). Aucune version
     d'Opus ne l'envoie : seul un client modifié ou une version en retard le
     fait. Le texte de PostgreSQL 16, relevé tel quel — « cannot insert a
     non-DEFAULT value into column … », « column … can only be updated to
     DEFAULT » — sortait en anglais ; et ce n'est pas une saisie à corriger,
     c'est l'application à mettre à jour. */
  if (code === '428C9' || m.includes('non-default value into column') || m.includes('can only be updated to default')) {
    return phrase(sujet, 'Opus a envoyé une valeur que la base calcule elle-même : mettez Opus à jour, puis '
      + 'réessayez.');
  }

  /* 23503 — une clé étrangère. Deux sens, qui ne se disent pas pareil :
     on écrit une ligne qui désigne quelque chose qui a disparu, ou l'on
     supprime quelque chose que d'autres lignes désignent encore. */
  if (code === '23503' || m.includes('violates foreign key constraint')) {
    if (m.includes('update or delete on table')) {
      return phrase(sujet, 'cet enregistrement est encore utilisé ailleurs (par exemple sur '
        + 'un devis) : il ne peut pas être supprimé.');
    }
    return phrase(sujet, 'cet enregistrement désigne quelque chose qui n’existe plus (une '
      + 'fiche, un client) : rechargez l’écran.');
  }
  /* 22003 — un nombre trop grand pour sa colonne. JAMAIS « out of range »
     seul : la date impossible du 22008 (« date/time field value out of
     range », le 31 février du 04/10) le contient aussi, et elle n'a rien à
     voir avec un zéro de trop. */
  if (code === '22003' || m.includes('numeric field overflow')
    || m.includes('out of range for type') || /\b(big|small)?int(eger)? out of range/.test(m)) {
    return phrase(sujet, 'ce nombre est trop grand pour être enregistré : il y a sans doute un '
      + 'zéro de trop.');
  }
  /* 23502 — une colonne obligatoire laissée vide. Ce n'est jamais la faute
     de celui qui tape : le formulaire aurait dû la demander. */
  if (code === '23502' || m.includes('violates not-null constraint')) {
    const colonne = (brut.match(/column "([^"]+)"/i) || [])[1];
    return phrase(sujet, 'une information obligatoire manque'
      + (colonne ? ` (« ${colonne} »)` : '')
      + '. Le formulaire aurait dû la demander : c’est un défaut d’Opus, pas le vôtre.');
  }
  /* PGRST116 — PostgREST rend cette erreur quand `.single()` attend UNE
     ligne et n'en reçoit aucune : on modifie ce qu'un autre appareil vient
     de retirer (une assurance, par exemple). Elle sortait en anglais, alors
     que la démonstration disait déjà « n’existe plus : rechargez l’écran »
     (relecture du 18/10/2026) — une démonstration plus aimable que la base,
     la première règle de CLAUDE.md. */
  if (code === 'PGRST116' || m.includes('multiple (or no) rows returned')
    || m.includes('cannot coerce the result to a single json object')) {
    return phrase(sujet, 'cet enregistrement n’existe plus, ou il vient de changer depuis un '
      + 'autre appareil : rechargez l’écran.');
  }

  /* 22P02 ET PGRST1xx — UNE REQUÊTE MAL FORMÉE (une valeur qui n'a pas la
     forme de sa colonne, un JSON vide) : c'est l'application qui a envoyé
     de travers, jamais celui qui tape. Elles sortaient en anglais
     (« invalid input syntax for type uuid », « Empty or invalid json »).
     PGRST116 (« n'existe plus ») est traité juste au-dessus. */
  if (code === '22P02' || /^PGRST1\d\d$/.test(code)) {
    return phrase(sujet, 'l’application a envoyé une valeur que la base ne sait pas lire. C’est un défaut '
      + 'd’Opus, pas le vôtre : réessayez, et si cela revient, signalez-le.');
  }

  /* 40P01 — UN INTERBLOCAGE : deux enregistrements se sont attendus l'un
     l'autre, et PostgreSQL a annulé l'un des deux EN ENTIER (« deadlock
     detected », en anglais). Rien n'est perdu — la transaction annulée n'a
     rien écrit, ce qui était enregistré l'est toujours, et ce qui est à
     l'écran y reste. La file d'écriture d'un devis le retente une fois
     d'elle-même (`file-ecriture.js`) : cette phrase ne sort qu'au second
     échec, c'est-à-dire, avec le verrou `for no key update` de la section
     49.6, presque seulement de deux appareils à la fois. */
  if (code === '40P01' || m.includes('deadlock detected')) {
    return phrase(sujet, 'deux enregistrements se sont croisés au même instant, et la base a annulé '
      + 'celui-ci. Rien n’est perdu : réessayez.');
  }

  /* PGRST204 et 42703 — UNE COLONNE QUE LA BASE N'A PAS : l'application est
     en avance sur la base, `schema.sql` n'a pas été rejoué (la panne des six
     commits qui tournaient contre une base ignorant `metiers`, CLAUDE.md).
     Le message de PostgREST sortait tel quel, en anglais — « Could not find
     the 'affiche' column of 'tarifs_pro' in the schema cache » — sous
     « … mais pas vos tarifs » (relecture du 19/10/2026, lot T). */
  /* PGRST205 et 42P01 — UNE TABLE QUE LA BASE N'A PAS, même famille : la
     base où la section 49 (les devis) n'est pas encore posée. « relation
     "public.devis" does not exist » sortait tel quel, en anglais ; et
     surtout, une liste de devis qui ne peut pas se lire ne doit jamais
     ressembler à « Aucun devis » (lot 1 du module devis). */
  if (code === 'PGRST204' || code === '42703' || code === 'PGRST205' || code === '42P01'
    || m.includes('in the schema cache')
    || /column "?[a-z0-9_.]+"? does not exist/.test(m) || /relation "?[a-z0-9_.]+"? does not exist/.test(m)) {
    const colonne = (brut.match(/the '([a-z0-9_]+)' column/i)
      || brut.match(/column "?(?:[a-z0-9_]+\.)?([a-z0-9_]+)"? does not exist/i) || [])[1];
    const table = colonne ? null : (brut.match(/the table '(?:[a-z0-9_]+\.)?([a-z0-9_]+)'/i)
      || brut.match(/relation "?(?:[a-z0-9_]+\.)?([a-z0-9_]+)"? does not exist/i) || [])[1];
    return phrase(sujet, 'la base d’Opus n’a pas encore reçu la mise à jour de l’application'
      + (colonne ? ` (la colonne « ${colonne} » lui manque)` : '')
      + (table ? ` (la table « ${table} » lui manque)` : '')
      + ' : ce n’est pas de votre fait. Le plus souvent, `supabase/schema.sql` n’a pas été rejoué.');
  }

  /* --- l'authentification, reprise d'AuthScreen où elle était enfermée --- */
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';

  /* L'INSCRIPTION REFUSÉE PAR LA BASE — section 45 de `schema.sql`.
     Quand le déclencheur qui crée le compte lève OP006 ou OP007, GoTrue ne
     transmet PAS notre texte : il rend « Database error saving new user »,
     en HTTP 500. L'application revérifie le SIRET juste avant de créer le
     compte, donc ce cas est rare — il ne tombe que si la vérification a
     expiré pendant qu'on remplissait le formulaire, ou si quelqu'un vient
     de prendre l'entreprise. Et c'est exactement la phrase à dire. */
  if (m.includes('database error saving new user')) {
    return 'Votre compte n’a pas été créé : la vérification de votre entreprise a '
      + 'expiré, ou elle vient d’être rattachée à un autre compte. Touchez '
      + '« Vérifier » à nouveau.';
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    /* « Connectez-vous » ne doit pas être la SEULE issue : quelqu'un qui a
       déjà un compte particulier avec cette adresse peut le faire passer en
       professionnel depuis son profil, sans en recréer un. */
    return 'Un compte existe déjà avec cet email. Utilisez « Se connecter » : '
      + 'si c’est un compte particulier, vous pourrez le passer en compte '
      + 'professionnel depuis votre profil.';
  }
  if (m.includes('email not confirmed')) {
    return "Votre email n'est pas encore confirmé. Regardez votre boîte mail.";
  }
  if (m.includes('password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return "Cette adresse email n'est pas valide.";
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return 'Les inscriptions sont désactivées dans les réglages Supabase.';
  }

  /* --- ce que la BASE refuse, et qui a déjà coûté des heures --- */

  /* Le cas du 30/09 : le format « montage » envoyé sans avoir été ajouté à
     `posts_type_check`. La base refusait, le mode démo n'y voyait rien, et
     le message ne parlait que de contrainte. */
  if (m.includes('violates check constraint') || m.includes('check constraint')) {
    /* `_check\d*` : une contrainte qu'on n'a pas nommée reçoit de
       PostgreSQL le nom `<table>_<colonne>_check`, puis `…_check1`,
       `…_check2` pour les suivantes (mesuré). Sans le `\d*`, elle sortait
       sans aucun nom. */
    const nom = (brut.match(/"([a-z0-9_]+_check\d*)"/i) || [])[1];
    /* Une contrainte qui garde une SAISIE dit quoi corriger, sans parler de
       schéma : ce n'est pas une panne. */
    if (nom && MESSAGES_CONTRAINTE[nom]) return phrase(sujet, MESSAGES_CONTRAINTE[nom]);
    /* Sinon, la piste d'aujourd'hui, et elle ne vaut plus que pour une
       contrainte INCONNUE de la table ci-dessus : une valeur que
       l'application envoie sans l'avoir déclarée à la base, c'est-à-dire
       une faute de développeur. */
    return `${sujet}la base a refusé cette valeur`
      + (nom ? ` (contrainte « ${nom} »)` : '')
      + '. Le plus souvent, `supabase/schema.sql` n’a pas été rejoué.';
  }
  if (m.includes('row-level security') || m.includes('violates row-level')) {
    return `${sujet}la base a refusé l’enregistrement : vous n’avez pas le `
      + 'droit d’écrire cette ligne. Ce n’est pas une panne, c’est une règle.';
  }
  /* UNE DEMANDE DE COMPTE PRO DÉJÀ OUVERTE — l'index « une seule ouverte
     par compte » (section 45.4). « Cela existe déjà » ne disait ni quoi, ni
     quoi faire ; la démonstration le disait mieux que la vraie base
     (relecture adverse, mesuré). */
  if (m.includes('idx_demandes_pro_une_ouverte')) {
    return `${sujet}vous avez déjà une demande de compte professionnel en attente. `
      + 'Elle se suit sur votre profil, où vous pouvez joindre un justificatif — ou '
      + 'l’annuler pour en faire une autre.';
  }
  /* 23505 — « cela existe déjà » ne disait ni quoi, ni quoi faire. Une
     contrainte d'unicité qui garde une saisie aura sa phrase dans
     `MESSAGES_CONTRAINTE` ; sinon, le cas le plus fréquent : la même ligne
     enregistrée deux fois, depuis deux appareils ou par un double appui. */
  if (code === '23505' || m.includes('duplicate key') || m.includes('already exists')) {
    const nom = (brut.match(/constraint "([a-z0-9_]+)"/i) || [])[1];
    if (nom && MESSAGES_CONTRAINTE[nom]) return phrase(sujet, MESSAGES_CONTRAINTE[nom]);
    return phrase(sujet, 'cet enregistrement existe déjà : il a sans doute été créé '
      + 'entre-temps, depuis un autre appareil. Rechargez l’écran.');
  }
  if (m.includes('permission denied for function')) {
    const nom = (brut.match(/function ([a-z0-9_]+)/i) || [])[1];
    return `${sujet}la base refuse d’exécuter ${nom ? `« ${nom} »` : 'une fonction'}. `
      + 'Il manque un `grant execute … to authenticated` dans `schema.sql`.';
  }
  if (m.includes('permission denied') || m.includes('42501')) {
    return `${sujet}la base refuse cet accès.`;
  }
  /* Le code maison du 30/09 : un commentaire auquel on a répondu se fige. */
  if (m.includes('op001') || m.includes('ne peut plus être corrigé')) {
    return brut;
  }
  if (m.includes('payload too large') || m.includes('entity too large')) {
    return `${sujet}le fichier est trop lourd.`;
  }

  /* On ne sait pas traduire : on rend le motif tel quel plutôt qu'une
     phrase creuse. C'est souvent la seule chose exploitable. */
  return brut ? `${sujet}${brut}` : `${sujet}une erreur est survenue. Réessayez.`;
}

/**
 * NE JAMAIS ATTENDRE LE RÉSEAU INDÉFINIMENT.
 *
 * CONSTATÉ LE 01/10/2026, en coupant la liaison pour de vrai.
 * ---------------------------------------------------------
 * Avec une session valide et la base injoignable, l'application restait
 * bloquée sur son squelette de démarrage — **pour toujours**. Pas d'erreur,
 * pas de message : les blocs gris battaient doucement, et c'est tout.
 *
 * La cause n'est pas une faute de logique : `setDemarrage(false)` est bien
 * écrit après l'attente. Mais une requête qui ne revient JAMAIS n'atteint
 * jamais la ligne suivante. Un `catch` ne protège de rien quand rien
 * n'échoue — il ne se passe simplement rien.
 *
 * C'est le défaut le plus trompeur de cette famille : l'écran a l'air
 * vivant (le squelette bat), donc on attend. Puis on attend encore. Puis on
 * ferme l'application.
 *
 * > **Tout appel réseau sur le chemin du démarrage porte un délai.** Au
 * > bout, on considère que c'est le réseau — ce qui est vrai dans
 * > l'immense majorité des cas — et on ouvre quand même l'application.
 *
 * Douze secondes : assez pour une 4G faible sur un chantier, trop peu pour
 * qu'on se demande si c'est cassé.
 */
export function avecDelai(promesse, ms = 12000, quoi = 'La base') {
  let minuteur;
  const limite = new Promise((_, rejeter) => {
    minuteur = setTimeout(() => {
      const e = new Error(`${quoi} ne répond pas (plus de ${Math.round(ms / 1000)} secondes).`);
      /* `AbortError` : `estUnProblemeDeReseau()` le reconnaît, donc le
         message affiché parlera de connexion et pas de panne. */
      e.name = 'AbortError';
      rejeter(e);
    }, ms);
  });
  return Promise.race([promesse, limite]).finally(() => clearTimeout(minuteur));
}

/**
 * UN SERVEUR QUI SE RÉVEILLE N'EST PAS UN SERVEUR EN PANNE.
 *
 * CONSTATÉ LE 02/10/2026, sur la vraie base, par le propriétaire.
 * --------------------------------------------------------------
 * « Plus rien ne fonctionne, plus de contenu, et une phrase d'erreur. »
 * Rien n'était cassé : à cet instant précis, la couche API du projet
 * Supabase REDÉMARRAIT. Les journaux le disent à la seconde près —
 * « Successfully connected to PostgreSQL », « Connection Pool
 * initialized », « Schema cache loaded 26 Relations » — deux fois de
 * suite. Aucune requête refusée (zéro réponse 4xx, zéro erreur
 * PostgreSQL) : il n'y avait simplement personne au bout du fil.
 *
 * L'application a fait exactement ce qu'on lui avait appris : elle a
 * attendu, échoué, et affiché « Le chargement a échoué ». Ce qu'elle n'a
 * PAS fait, c'est redemander. Or un serveur qui démarre répond deux
 * secondes plus tard. Le propriétaire a dû fermer et rouvrir — ce qui,
 * du point de vue du réseau, est exactement ce qu'un simple nouvel essai
 * aurait fait.
 *
 * > **Un échec réseau sur le chemin du démarrage se retente UNE fois**,
 * > après une courte pause. Une seule : au deuxième échec, c'est une vraie
 * > panne, et la taire derrière un sablier serait pire que de le dire.
 *
 * Ce qu'on ne retente PAS : une session expirée, un droit refusé, une
 * contrainte violée. Ces trois-là donneront la même réponse mille fois —
 * les retenter ne fait qu'ajouter de l'attente à une mauvaise nouvelle.
 */
export const PAUSE_REPRISE = 2500;

export function estDefinitif(e) {
  if (estUneSessionExpiree(e)) return true;
  const m = String((e && (e.message || e.error_description)) || e).toLowerCase();
  const code = String((e && e.code) || '');
  /* Un refus de la base est une réponse, pas une absence de réponse. */
  return m.includes('permission denied')
    || m.includes('row-level security')
    || m.includes('violates')
    || code.startsWith('23')   // contraintes
    /* La classe 22, « donnée invalide » : un nombre trop grand (22003), une
       date impossible (22008), un texte qui n'est pas un nombre (22P02).
       Ce code ne commence ni par 23 ni par 42, et sans cette ligne
       `avecReprise` retentait un zéro de trop deux secondes et demie plus
       tard — pour la même réponse. */
    || code.startsWith('22')
    || code.startsWith('42')   // droits, syntaxe
    || /^OP\d{3}$/.test(code); // un refus écrit par la base : elle a répondu
}

export async function avecReprise(faire, { pause = PAUSE_REPRISE, quoi = 'La base' } = {}) {
  try {
    return await avecDelai(faire(), 12000, quoi);
  } catch (e) {
    if (estDefinitif(e)) throw e;
    await new Promise((r) => setTimeout(r, pause));
    /* Le second essai n'est pas enveloppé d'un `try` : s'il échoue aussi,
       c'est l'appelant qui doit le dire à l'utilisateur. */
    return avecDelai(faire(), 12000, quoi);
  }
}
