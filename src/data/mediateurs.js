/**
 * LES MÉDIATEURS DE LA CONSOMMATION DU BÂTIMENT — relevés, jamais écrits de mémoire.
 *
 * POURQUOI CETTE LISTE EXISTE
 * ---------------------------
 * Un devis adressé à un particulier doit nommer le médiateur de la
 * consommation auquel l'artisan adhère (code de la consommation, L. 111-1 6°
 * et R. 111-1 7°), et ce médiateur doit être RÉFÉRENCÉ par la Commission
 * d'évaluation et de contrôle de la médiation de la consommation (CECMC).
 * Une saisie libre laisserait écrire n'importe quel nom — y compris celui
 * d'un organisme qui n'est pas référencé, ce qui ne vaut rien. Le plan du
 * devis (10.3) le demande en propres termes : « proposer la liste officielle
 * plutôt qu'une saisie libre ». La saisie libre reste un REPLI, pour un
 * médiateur référencé après la date du relevé.
 *
 * D'OÙ ELLE VIENT, ET CE QUI A ÉTÉ ESSAYÉ (18/10/2026)
 * ---------------------------------------------------
 * La page de la CECMC sur economie.gouv.fr répond 403 depuis le conteneur
 * de travail : un défi anti-robots (« Just a moment… ») que ni `curl` ni
 * l'outil de lecture ne franchissent. La MÊME liste est publiée en données
 * ouvertes, et son éditeur déclaré est la CECMC elle-même :
 *
 *   « Annuaire des médiateurs de la consommation », data.economie.gouv.fr,
 *   jeu `mediation-consommation-annuaire-des-mediateurs`, modifié le
 *   07/10/2026, 1 350 lignes (un médiateur par secteur), Licence Ouverte
 *   v2.0 (Etalab). Téléchargé le 18/10/2026 par l'export JSON de l'API.
 *
 * Ce qui est recopié, à l'octet près, depuis ce fichier : le nom, le site,
 * le type, la catégorie et le libellé de chaque secteur — apostrophes
 * droites et coquilles comprises (« Dépannage urgents à domicile »). On ne
 * corrige pas une source officielle qu'on cite : on la recopie.
 *
 * L'ADRESSE POSTALE N'Y EST PAS — et elle n'est donc pas ici
 * ---------------------------------------------------------
 * Le jeu publié n'a que six colonnes : médiateur, type, URL, code et
 * libellé du secteur, catégorie. Aucune adresse. Une adresse écrite de
 * mémoire, ou recopiée d'un site tiers, finirait un jour sur des devis sans
 * que personne ne sache d'où elle sort. `adresse` vaut donc `null` partout,
 * et c'est voulu : choisir un médiateur dans la liste remplit son nom et son
 * site, et l'artisan recopie l'adresse depuis son contrat d'adhésion — il en
 * a forcément un, puisqu'il faut ADHÉRER (`ADRESSE_A_RECOPIER`). La
 * contrainte `emetteur_mediateur_check` refuse un médiateur sans adresse :
 * rien ne peut donc s'imprimer à moitié.
 *
 * CE QUI A ÉTÉ RETENU
 * -------------------
 * Les médiateurs référencés pour au moins un des secteurs de
 * `SECTEURS_RETENUS` : la catégorie « Travaux du bâtiment, travaux
 * d'aménagement extérieur et intérieur » (sauf E06, réparation
 * d'électroménager, et E08, location de matériels), la construction,
 * l'architecture et l'ingénierie (C01 à C03 : Opus accueille architectes et
 * géomètres), et l'aménagement paysager (M03). Seuls ces secteurs-là sont
 * recopiés pour chacun.
 *
 * Deux médiateurs sont ÉCARTÉS, et la raison tient dans leur type :
 * « Médiateur d'entreprise » (le médiateur du groupe ENGIE, celui du groupe
 * ARCADE VYV). Un médiateur d'entreprise ne traite que les litiges de SON
 * entreprise : un artisan ne peut pas y adhérer, et le proposer serait un
 * piège. Le « médiateur adossé à une fédération » est gardé, avec son type
 * écrit en toutes lettres.
 *
 * LE RELEVÉ VIEILLIT, ET L'ÉCRAN LE DIT
 * -------------------------------------
 * La CECMC référence et retire des médiateurs. `avisEmetteur()`
 * (src/lib/emetteur.js) affiche un avis quand ce relevé a plus d'un an ; un
 * contrôle, lui, ne rougit JAMAIS avec le temps. Le relevé annuel est
 * inscrit dans `docs/A-FAIRE.md`.
 *
 * Ce fichier n'importe RIEN : `verifier-emetteur` le fait tourner.
 */

/** Le jour où cette liste a été téléchargée. */
export const MEDIATEURS_RELEVES_LE = '2026-10-18';

/** Le jour où la CECMC l'avait mise à jour (métadonnée « modified » du jeu). */
export const MEDIATEURS_LISTE_DU = '2026-10-07';

/** Où la relire — la page du jeu de données, qui répondait 200 le 18/10/2026. */
export const LISTE_MEDIATEURS_URL = 'https://data.economie.gouv.fr/explore/assets/mediation-consommation-annuaire-des-mediateurs/';

/** La mention de la source, que la Licence Ouverte demande avec la date de mise à jour. */
export const SOURCE_MEDIATEURS = 'Annuaire des médiateurs de la consommation, publié par la '
  + 'Commission d’évaluation et de contrôle de la médiation de la consommation (CECMC) sur '
  + 'data.economie.gouv.fr (Licence Ouverte v2.0)';

/** Ce que l'écran dit quand un médiateur de la liste est choisi : l'adresse reste à écrire. */
export const ADRESSE_A_RECOPIER = 'La liste publiée par la CECMC ne donne pas l’adresse postale des '
  + 'médiateurs : recopiez celle qui figure sur votre contrat d’adhésion.';

/** Les secteurs de la liste officielle qui concernent le bâtiment (voir l'en-tête). */
export const SECTEURS_RETENUS = Object.freeze([
  'E01', 'E02', 'E03', 'E04', 'E05', 'E07', 'C01', 'C02', 'C03', 'M03',
]);

/* Les 24 médiateurs, dans l'ordre alphabétique de leur nom. `cle` est
   fabriquée depuis le nom (sans accents) : elle ne sert qu'à l'écran, et
   rien ne la range en base — une fiche garde le NOM et le SITE, et
   `mediateurDeLaListe()` reconnaît l'entrée à partir d'eux. */
export const MEDIATEURS = Object.freeze([
  Object.freeze({
    cle: 'anm-consommation',
    nom: 'ANM Consommation',
    adresse: null,
    site: 'http://www.anmconso.com',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d\'architecture, maîtrise d\'œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannage urgents à domicile' }),
    ]),
  }),
  Object.freeze({
    cle: 'association-de-mediateurs-de-bretagne-ouest-ambo',
    nom: 'Association de médiateurs de Bretagne Ouest (AMBO)',
    adresse: null,
    site: 'https://www.mediation-consommation.ambo.bzh',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'association-des-mediateurs-independants-d-ile-de-france-amidif',
    nom: 'Association des Médiateurs Indépendants d’Ile de France (AMIDIF)',
    adresse: null,
    site: 'http://www.amidif.com/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
    ]),
  }),
  Object.freeze({
    cle: 'atlantique-mediation',
    nom: 'Atlantique Médiation',
    adresse: null,
    site: 'http://consommation.atlantique-mediation.org/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'avenir-conso-anciennement-ame-conso',
    nom: 'Avenir Conso (anciennement AME Conso)',
    adresse: null,
    site: 'https://www.avenir-conso.com/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'batirmediation-conso',
    nom: 'BATIRMEDIATION CONSO',
    adresse: null,
    site: 'http://batirmediation-conso.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
    ]),
  }),
  Object.freeze({
    cle: 'c-c-mediation',
    nom: 'C&C-médiation',
    adresse: null,
    site: 'http://www.cc-mediateurconso-bfc.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'centre-de-mediation-de-la-consommation-d-opale-cmco',
    nom: 'Centre de Médiation de la consommation d\'Opale (CMCO)',
    adresse: null,
    site: 'https://www.cmco-mediation.fr',
    type: 'Association ou société de médiateurs',
    secteur: 'Bricolage, jardinage, animaux',
    secteurs: Object.freeze([
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'centre-de-mediation-de-la-consommation-des-conciliateurs-de-justice-cm2c',
    nom: 'Centre de Médiation de la Consommation des Conciliateurs de justice (CM2C)',
    adresse: null,
    site: 'https://www.cm2c.net/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'centre-de-mediation-de-la-drome-mediation-conso-drome',
    nom: 'Centre de Médiation de la Drôme (Médiation Conso Drôme)',
    adresse: null,
    site: 'https://mediation-conso-drome.org',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
    ]),
  }),
  Object.freeze({
    cle: 'centre-de-mediation-et-d-arbitrage-de-paris-cmap',
    nom: 'Centre de Médiation et d’Arbitrage de Paris (CMAP)',
    adresse: null,
    site: 'https://www.cmap.fr/la-mediation-de-la-consommation/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'confluence-mediations',
    nom: 'Confluence Médiations',
    adresse: null,
    site: 'https://confluence-mediations-consommation.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
    ]),
  }),
  Object.freeze({
    cle: 'gie-medimmoconso',
    nom: 'GIE MEDIMMOCONSO',
    adresse: null,
    site: 'https://medimmoconso.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’oeuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'immomediateurs',
    nom: 'IMMOMEDIATEURS',
    adresse: null,
    site: 'https://conso.immomediateurs.com/',
    type: 'Association ou société de médiateurs',
    secteur: 'Immobilier, logement',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
    ]),
  }),
  Object.freeze({
    cle: 'institut-d-expertise-d-arbitrage-et-de-mediation-ieam',
    nom: 'Institut d\'Expertise, d\'Arbitrage et de Médiation (IEAM)',
    adresse: null,
    site: 'https://www.ieam.eu/demande-de-mediation',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediateur-du-commerce-cooperatif-et-associe',
    nom: 'Médiateur du Commerce Coopératif et Associé',
    adresse: null,
    site: 'http://www.mcca-mediation.fr/',
    type: 'Médiateur adossé à une fédération ou à une association',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediation-vivons-mieux-ensemble',
    nom: 'Médiation - vivons mieux ensemble',
    adresse: null,
    site: 'https://www.mediation-vivons-mieux-ensemble.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Immobilier, logement',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediation-cmfm',
    nom: 'Médiation CMFM',
    adresse: null,
    site: 'https://mediationcmfm.eu',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediation-consommation-developpement-med-conso-dev',
    nom: 'Médiation Consommation développement (Med Conso Dev)',
    adresse: null,
    site: 'http://www.medconsodev.eu',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediation-de-la-consommation-patrimoine-mcp',
    nom: 'Médiation de la Consommation & Patrimoine (MCP)',
    adresse: null,
    site: 'http://www.mcpmediation.org/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediation-en-seine',
    nom: 'Médiation en Seine',
    adresse: null,
    site: 'https://mediation-en-seine.fr/mediation-de-la-consommation/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'mediation-solution',
    nom: 'Médiation Solution',
    adresse: null,
    site: 'https://sasmediationsolution-conso.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'notreaccord',
    nom: 'NotreAccord',
    adresse: null,
    site: 'https://www.mediation-consommation.notreaccord.com/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E02', libelle: 'Installation de piscines' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
  Object.freeze({
    cle: 'societe-de-la-mediation-professionnelle-smp',
    nom: 'Société de la Médiation Professionnelle (SMP)',
    adresse: null,
    site: 'https://www.mediateur-consommation-smp.fr/',
    type: 'Association ou société de médiateurs',
    secteur: 'Travaux du bâtiment, travaux d\'aménagement extérieur et intérieur',
    secteurs: Object.freeze([
      Object.freeze({ code: 'C01', libelle: 'Promotion, construction' }),
      Object.freeze({ code: 'C02', libelle: 'Travaux d’architecture, maîtrise d’œuvre' }),
      Object.freeze({ code: 'C03', libelle: 'Ingénierie, expertises (géomètres-expert, expertise technique, diagnostics immobiliers...)' }),
      Object.freeze({ code: 'E01', libelle: 'Installation de cuisines et salles de bains' }),
      Object.freeze({ code: 'E03', libelle: 'Installation et réparation d’équipements (chauffage, climatisation, efficacité énergétique...)' }),
      Object.freeze({ code: 'E04', libelle: 'Aménagement de l’habitat, travaux d’installation, de réparation, de rénovation et activités de décoration' }),
      Object.freeze({ code: 'E05', libelle: 'Aménagement extérieur (gros travaux)' }),
      Object.freeze({ code: 'E07', libelle: 'Dépannages urgents à domicile' }),
      Object.freeze({ code: 'M03', libelle: 'Aménagement paysager (y compris élagage et abattage)' }),
    ]),
  }),
]);
