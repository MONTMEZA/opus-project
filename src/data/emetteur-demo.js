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
 * `{ emetteur, assurances, tarifs }`, aux noms de la base. `tarifs` vaut
 * `null` : les frais n'ont jamais été déclarés, et c'est un des cinq manques.
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
      telephone: '04 91 00 00 00',
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
        attestation_chemin: null,
        created_at: ilYA20Jours,
      },
    ],
    tarifs: null,
  };
}
