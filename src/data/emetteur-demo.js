/**
 * « MON ENTREPRISE » EN DÉMONSTRATION — la fiche de devis de l'artisan de démonstration.
 *
 * POURQUOI ELLE EST À MOITIÉ REMPLIE, EXPRÈS
 * ------------------------------------------
 * Une fiche vide montrerait onze manques et rien d'autre ; une fiche
 * complète montrerait « Oui » et rien d'autre. Ni l'une ni l'autre ne fait
 * VIVRE le mécanisme sans fichier `.env` — et ce qui ne vit pas en
 * démonstration ne se vérifie pas ici non plus. Celle-ci laisse
 * exactement CINQ manques, dont trois qui ne valent que pour un particulier :
 *
 *   capital                     une SARL indique son capital (code de commerce, R. 123-238) ;
 *   conso_mediateur             le médiateur, pour un particulier ;
 *   conso_modalites_execution   les modalités d'exécution, pour un particulier ;
 *   conso_reclamations          le traitement des réclamations, pour un particulier ;
 *   frais_deplacement           les frais de déplacement, pour tout devis (choix d'Opus).
 *
 * L'écran dit donc « Il manque 5 choses, dont 3 seulement pour un devis à
 * un particulier », puis « Oui » une fois les cinq complétés.
 * `verifier-emetteur` fait tourner `motifsEmetteur()` sur cette fiche et
 * refuse tout autre résultat.
 *
 * L'ENTREPRISE est celle de la fiche 1 de démonstration
 * (`IDENTITE_DEMO_DU_PRO`, src/data/siret-demo.js) : une SARL (5499), siège,
 * avec un n° de TVA. Ce fichier ne la recopie pas : `emetteur` ne recopie
 * AUCUNE colonne d'`entreprise_registre`, en démonstration comme en base.
 *
 * Les textes sont marqués « Texte de démonstration » : une phrase de
 * garantie qu'on croirait écrite par un juriste finirait copiée telle
 * quelle sur un vrai devis.
 *
 * Les dates sont CALCULÉES depuis `maintenant` : une date figée dans le
 * fichier rendrait l'assurance « expirée » un jour, sans que personne n'ait
 * touché à rien — la leçon des demandes de démonstration du 04/10.
 *
 * UN LIEU DE DÉPÔT DES DÉCHETS (étape 2b-5, cahier T15) : sans lui, la carte
 * « Déchets » d'un devis de démonstration n'aurait aucune case à cocher, et
 * aucun devis ne pourrait se montrer complet sans fichier `.env`. Il est
 * INVENTÉ, comme l'entreprise et l'assureur — une démonstration qui sert à
 * la publicité ne prête rien à personne (26/10/2026). Cherchés le
 * 21/11/2026, et absents tous les deux :
 *   - la raison sociale « Recyclage de démonstration », dans l'annuaire
 *     Sirene (recherche-entreprises.api.gouv.fr : 0 résultat, avec ou sans
 *     accent) ;
 *   - la voie « Chemin de la Démonstration », dans la Base Adresse
 *     Nationale (api-adresse.data.gouv.fr : à Lambesc comme dans toute la
 *     France, elle ne rend que d'AUTRES voies, au score de 0,52 au plus).
 * La commune, elle, est réelle (Lambesc, 13410) : une commune est publique,
 * et c'est celle du second établissement de l'entreprise de démonstration
 * (`siret-demo.js`).
 *
 * UN SIGNE DE QUALITÉ ET UN SOUS-TRAITANT (étape 2b-6, cahier §3.9 et T14) :
 * sans eux, la carte « Énergie et label RGE » d'un devis de démonstration
 * n'aurait ni travail « couvert », ni case de sous-traitant, et les quatre
 * états d'un travail ne se verraient nulle part sans fichier `.env`. Ils
 * vivent DANS la fiche, comme le lieu (ÉCRAN-9). INVENTÉS tous les deux :
 *   - le signe : organisme « Qualifications de démonstration », intitulé
 *     « Label de démonstration — isolation des murs », pour la seule
 *     catégorie `isolation_exterieur` (l'isolation des murs par
 *     l'extérieur), valable 45 jours (calculés), certificat JOINT — un chemin
 *     de démonstration, aucun fichier derrière ;
 *   - le sous-traitant : « Isolations de démonstration », SIRET FICTIF
 *     `00000496000019` (cinq zéros en tête, clé juste — distinct de tous ceux
 *     de `siret-demo.js`, de `demo.js` et des essais SQL), qui ne détient
 *     PAS de label.
 * JAMAIS le nom d'un organisme réel (Qualibat, Qualit’EnR…) : une
 * démonstration qui sert à la publicité ne prête rien à personne, et
 * `verifier-demo` le refuse (CTL-4). Cherchés le 24/11/2026 dans l'annuaire
 * Sirene (recherche-entreprises.api.gouv.fr), avec et sans accent, et
 * absents tous les trois : « Isolations de démonstration », « Qualifications
 * de démonstration », le SIREN 000004960 et le SIRET 00000496000019 —
 * 0 résultat chacun ; la même requête rend « LA POSTE » pour « la poste » et
 * pour 356000000 (le service répondait).
 *
 * Ce fichier n'importe RIEN.
 */

const JOUR_MS = 24 * 3600 * 1000;

/* « AAAA-MM-JJ » au jour local, comme une colonne `date`. */
function jour(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** L'identifiant de la fiche de démonstration qui porte cette entreprise (la fiche 1). */
export const PRO_DEMO_EMETTEUR = '1';

/**
 * L'identifiant du lieu de dépôt de démonstration (2b-5) — FIXE, pour que
 * les devis de démonstration puissent le citer dans `dechetsLieux`. De la
 * forme d'un UUID, comme ceux que la base pose (`devis.dechets_lieux` est un
 * `uuid[]`) : une démonstration plus permissive que la base masquerait ce
 * que l'artisan rencontrera pour de vrai.
 */
export const LIEU_DEPOT_DEMO_ID = '00000000-0000-4000-8000-00000000d0e5';

/**
 * Les identifiants du signe de qualité et du sous-traitant de démonstration
 * (2b-6) — FIXES, de la forme d'un UUID, pour la même raison que le lieu :
 * un devis de démonstration peut citer le sous-traitant dans
 * `energieSousTraitants` (un `uuid[]` en base).
 */
export const LABEL_DEMO_ID = '00000000-0000-4000-8000-0000000a1be1';
export const SOUS_TRAITANT_DEMO_ID = '00000000-0000-4000-8000-0000000057a1';

/** Le SIRET FICTIF du sous-traitant de démonstration (cinq zéros en tête, clé juste). */
export const SIRET_SOUS_TRAITANT_DEMO = '00000496000019';

/**
 * `{ emetteur, assurances, tarifs, lieux, labels, sousTraitants }`, aux noms
 * de la base. `tarifs` vaut `null` : les frais n'ont jamais été déclarés, et
 * c'est un des cinq manques. `lieux` porte UN lieu de dépôt des déchets
 * (2b-5), `labels` UN signe de qualité et `sousTraitants` UN sous-traitant
 * (2b-6) : ils ne changent rien à « Prêt à émettre un devis ? » —
 * `emetteur_incomplet()` ne les lit pas, ils se jugent devis par devis.
 */
export function fabriquerEmetteurDemo(maintenant = new Date()) {
  const t = maintenant instanceof Date ? maintenant.getTime() : new Date(maintenant).getTime();
  const ilYA20Jours = new Date(t - 20 * JOUR_MS).toISOString();
  return {
    emetteur: {
      pro_id: PRO_DEMO_EMETTEUR,
      denomination_ei: null,
      registre: 'rcs',
      greffe_ville: 'Marseille',
      capital_centimes: null,
      capital_variable: false,
      en_liquidation: false,
      locataire_gerant: false,
      etablissement_adresse: null,
      etablissement_code_postal: null,
      etablissement_ville: null,
      siege_adresse: null,
      siege_code_postal: null,
      siege_ville: null,
      telephone: '04 65 71 00 00',
      email: 'contact@exemple-opus.test',
      regime_tva: 'reel',
      regime_tva_declare_le: ilYA20Jours,
      mediateur_nom: null,
      mediateur_adresse: null,
      mediateur_site: null,
      garantie_legale_texte: 'Texte de démonstration — vos garanties légales, écrites en vos mots.',
      garantie_commerciale_texte: null,
      sav_texte: null,
      modalites_paiement_texte: 'Texte de démonstration — vos modalités de paiement.',
      modalites_execution_texte: null,
      reclamations_texte: null,
      modifie_le: ilYA20Jours,
    },
    assurances: [
      {
        id: 'demo-assurance-1',
        pro_id: PRO_DEMO_EMETTEUR,
        nature: 'decennale',
        libelle: null,
        assureur_nom: 'Assureur de démonstration',
        assureur_coordonnees: 'Texte de démonstration — l’adresse et le téléphone de votre assureur',
        couverture: 'France métropolitaine',
        numero_contrat: null,
        valide_jusquau: jour(new Date(t + 200 * JOUR_MS)),
        /* 2b-3 : l'attestation est JOINTE (la forme d'`envoyerAttestationDemo`
           et de `emetteur_assurance_chemin_check`) — avec sa date (+ 200
           jours), elle est valable, et le rang 11 (`devis_attestation`) se
           tait sur les devis de démonstration. Sans elle, « Muret de
           clôture » ne serait plus complet. Aucun fichier n'existe derrière :
           la démonstration n'en ouvre aucun. */
        attestation_chemin: `${PRO_DEMO_EMETTEUR}/attestation-assurance-demo.pdf`,
        created_at: ilYA20Jours,
      },
    ],
    tarifs: null,
    /* Aux noms de la base, comme `emetteur_lieux_depot` les rend : déjà
       NETTOYÉ (la forme que `tient_le_lieu_de_depot()` laisse), et passant
       ses propres contraintes — `verifier-emetteur` le fait tourner. */
    lieux: [
      {
        id: LIEU_DEPOT_DEMO_ID,
        pro_id: PRO_DEMO_EMETTEUR,
        raison_sociale: 'Recyclage de démonstration',
        adresse: '3 Chemin de la Démonstration',
        code_postal: '13410',
        ville: 'Lambesc',
        type_installation: 'decheterie_pro',
        libelle: null,
        created_at: ilYA20Jours,
      },
    ],
    /* 2b-6 : aux noms de la base, comme `emetteur_labels` et
       `emetteur_sous_traitants` les rendent — déjà NETTOYÉS (la forme que
       `tient_le_label()` et `tient_le_sous_traitant()` laissent), et passant
       leurs propres contraintes : `verifier-emetteur` les fait tourner. La
       fin du signe est CALCULÉE (+ 45 jours) : il ne s'éteint pas tout seul
       un jour, et il finit avant la fin de validité d'un devis à 60 jours —
       ce qui fait vivre l'avis du label. */
    labels: [
      {
        id: LABEL_DEMO_ID,
        pro_id: PRO_DEMO_EMETTEUR,
        organisme: 'Qualifications de démonstration',
        intitule: 'Label de démonstration — isolation des murs',
        reference: null,
        categories: ['isolation_exterieur'],
        valide_jusquau: jour(new Date(t + 45 * JOUR_MS)),
        justificatif_chemin: `${PRO_DEMO_EMETTEUR}/certificat-signe-qualite-demo.pdf`,
        created_at: ilYA20Jours,
      },
    ],
    sousTraitants: [
      {
        id: SOUS_TRAITANT_DEMO_ID,
        pro_id: PRO_DEMO_EMETTEUR,
        raison_sociale: 'Isolations de démonstration',
        siret: SIRET_SOUS_TRAITANT_DEMO,
        label_detient: false,
        label_categories: null,
        label_valide_jusquau: null,
        label_justificatif_chemin: null,
        created_at: ilYA20Jours,
      },
    ],
  };
}
