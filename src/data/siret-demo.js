/**
 * LA VÉRIFICATION D'UN SIRET, EN MODE DÉMONSTRATION.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Sans fichier `.env`, il n'y a ni fonction Edge, ni répertoire Sirene, ni
 * base : `api.js` répond depuis la mémoire. Or le lot du 15/10/2026 a
 * DOUZE issues possibles pour une vérification — dont trois que seul le
 * téléphone fabrique (pas de réseau, panne d'Opus, réponse trop lente). Si
 * la démonstration ne savait répondre que « ok », onze messages ne se
 * verraient nulle part sans la vraie base, et ne se vérifieraient pas ici
 * non plus.
 *
 * D'où UN NUMÉRO FICTIF PAR ISSUE, affiché en aide sous le champ en mode
 * démonstration : on le touche, et l'écran montre exactement ce qu'il
 * montrerait pour de vrai.
 *
 * LES NUMÉROS SONT FICTIFS, ET C'EST VÉRIFIÉ
 * ------------------------------------------
 * Tous passent la clé de contrôle (sinon l'écran les refuserait avant même
 * de « demander »), tous commencent par cinq zéros, et AUCUN ne désigne
 * une entreprise réelle : interrogés un par un sur l'API Recherche
 * d'entreprises le 15/10/2026 — SIRET et SIREN —, ils rendent 0 résultat,
 * quand le témoin réel (912 517 935 00033) en rend 1. Ils sont aussi
 * DISTINCTS de ceux des essais SQL (00000001800010 à 00000027300011) : un
 * numéro partagé entre la démonstration et un essai finirait par faire
 * croire que l'un éprouve l'autre.
 *
 * Utiliser le SIRET d'une vraie entreprise ici reviendrait à l'afficher
 * dans une application publique comme exemple d'inscription : c'est
 * l'usurpation que ce lot ferme.
 *
 * FIDÈLE À LA FONCTION EDGE, MÊME QUAND ÇA DÉRANGE
 * ------------------------------------------------
 * `reponseDemo` suit le MÊME ordre que `supabase/functions/siret/index.ts` :
 * la clé, puis l'entreprise déjà rattachée (`deja_utilise`), puis le reste.
 * « Le mode démo masque toutes les erreurs de base de données » est la
 * règle qui a déjà coûté le plus cher à ce projet ; une démonstration plus
 * aimable que le serveur en serait la récidive.
 *
 * Et depuis le 15/10/2026, la fonction Edge reconnaît la fiche de
 * l'APPELANT (par son jeton) : son PROPRE SIREN ne lui répond plus
 * « déjà utilisé » — sans quoi « Mon entreprise → Mettre à jour » n'avait
 * aucun chemin de réussite (relecture adverse). La démonstration fait
 * pareil : l'appelant lui passe la liste des SIREN pris PAR D'AUTRES. Le
 * nouvel établissement de l'artisan de démonstration est là pour que ce
 * chemin se voie, et se vérifie, sans la vraie base.
 *
 * Ce fichier n'importe RIEN : `verifier-etats` le fait tourner.
 */

/* L'ENTREPRISE DE L'ARTISAN DE DÉMONSTRATION (« Maçonnerie Ferlane », la
   fiche 1). Elle est déjà rattachée à son compte : c'est elle que montre
   « Modifier mon profil → Mon entreprise ». L'adresse est INVENTÉE — dans
   la vraie base, c'est souvent le domicile d'un entrepreneur individuel, et
   elle n'est visible que de lui. */
export const IDENTITE_DEMO_DU_PRO = Object.freeze({
  siret: '00000488700014',
  siren: '000004887',
  denomination: 'MACONNERIE FERLANE',
  sigle: null,
  nom_commercial: 'Maçonnerie Ferlane',
  est_ei: false,
  forme_juridique: '5499',
  date_creation: '2015-02-02',
  tva: 'FR26000004887',
  ape: '43.99C',
  naf25: '43.91Y',
  est_siege: true,
  adresse: '12 RUE DE LA DEMONSTRATION',
  commune: 'MARSEILLE',
  code_postal: '13004',
  code_insee: '13204',
  statut_diffusion: 'O',
  maj_insee: '2026-09-02',
  source: 'registre',
});

/* UN SECOND ÉTABLISSEMENT DE LA MÊME ENTREPRISE — le déménagement de
   l'artisan de démonstration. Même SIREN, autre SIRET : pour quelqu'un
   d'autre, « déjà utilisé » ; pour lui, « Mettre à jour ». */
const NOUVEL_ETABLISSEMENT_DU_PRO = Object.freeze({
  ...Object.fromEntries(Object.entries(IDENTITE_DEMO_DU_PRO)
    .filter(([cle]) => !['adresse', 'source'].includes(cle))),
  siret: '00000488700022',
  est_siege: true,
  commune: 'AIX-EN-PROVENCE',
  code_postal: '13100',
  code_insee: '13001',
});

/* Les deux entreprises qu'on peut « trouver » : une société, et un
   entrepreneur individuel SANS nom commercial — le cas de 38 % des EI
   mesurés par la relecture du 15/10, où le répertoire ne transmet aucun
   nom. Sans lui, le champ « Nom de l'entreprise » vide et son aide ne se
   verraient jamais. Son code d'activité (43.29B) ne propose AUCUN métier :
   c'est l'autre cas qu'il fallait pouvoir montrer. */
const SOCIETE = Object.freeze({
  siret: '00000400200010',
  siren: '000004002',
  denomination: 'BATI TALVESE PROVENCE',
  sigle: null,
  nom_commercial: 'Bâti Talvèse',
  est_ei: false,
  forme_juridique: '5499',
  date_creation: '2022-03-14',
  tva: 'FR87000004002',
  ape: '43.99C',
  naf25: '43.91Y',
  est_siege: true,
  commune: 'LAMBESC',
  code_postal: '13410',
  code_insee: '13050',
  statut_diffusion: 'O',
  maj_insee: '2026-09-02',
});

const ENTREPRENEUR = Object.freeze({
  siret: '00000424200012',
  siren: '000004242',
  denomination: null,
  sigle: null,
  nom_commercial: null,
  est_ei: true,
  forme_juridique: '1000',
  date_creation: '2019-05-06',
  tva: null,
  ape: '43.29B',
  naf25: null,
  est_siege: true,
  commune: 'CHARLEVAL',
  code_postal: '13350',
  code_insee: '13024',
  statut_diffusion: 'O',
  maj_insee: '2026-07-11',
});

/**
 * Le numéro à essayer pour chaque issue, et ce qu'on lit à côté.
 *
 * `issue` est celle que la démonstration rend ; le libellé ne dit jamais
 * « vérifié » ni « registre » — c'est la règle de tout texte qui parle de
 * ce niveau (siret.js, en-tête).
 */
export const SIRETS_DEMO = Object.freeze([
  { issue: 'ok', siret: SOCIETE.siret, libelle: 'Entreprise active (société)' },
  { issue: 'ok', siret: ENTREPRENEUR.siret, libelle: 'Entreprise active (entrepreneur individuel, sans nom)' },
  { issue: 'etablissement_ferme', siret: '00000400200028', libelle: 'Ancien établissement, fermé' },
  { issue: 'introuvable', siret: '00000408500015', libelle: 'Absent du répertoire' },
  { issue: 'cessee', siret: '00000416800019', libelle: 'Entreprise cessée' },
  { issue: 'non_diffusible', siret: '00000432500015', libelle: 'État non publié' },
  /* `aMoi` : ce que rend le numéro à la fiche qui tient déjà cette
     entreprise — « ok » —, quand toute autre lit « déjà utilisé ».
     Exactement la règle de la fonction Edge. */
  {
    issue: 'deja_utilise', aMoi: 'ok', siret: IDENTITE_DEMO_DU_PRO.siret,
    libelle: 'Déjà rattachée à un compte',
  },
  {
    issue: 'deja_utilise', aMoi: 'ok', siret: NOUVEL_ETABLISSEMENT_DU_PRO.siret,
    libelle: 'Nouvel établissement de l’entreprise de démonstration',
  },
  { issue: 'injoignable', siret: '00000448100016', libelle: 'Répertoire qui ne répond pas' },
  { issue: 'trop_d_essais', siret: '00000456400019', libelle: 'Trop de demandes' },
  { issue: 'reseau', siret: '00000464800010', libelle: 'Pas de réseau (simulé)' },
  { issue: 'service_indisponible', siret: '00000472100015', libelle: 'Panne d’Opus (simulée)' },
  { issue: 'lent', siret: '00000480400019', libelle: 'Réponse trop lente (simulée)' },
]);

/** Les identités que la démonstration sait rendre, par SIRET. */
export const IDENTITES_DEMO = Object.freeze({
  [SOCIETE.siret]: SOCIETE,
  [ENTREPRENEUR.siret]: ENTREPRENEUR,
  [NOUVEL_ETABLISSEMENT_DU_PRO.siret]: NOUVEL_ETABLISSEMENT_DU_PRO,
  /* L'établissement ACTUEL de l'artisan, pour SA propre mise à jour : sans
     l'adresse, que la fonction Edge ne rend jamais. */
  [IDENTITE_DEMO_DU_PRO.siret]: Object.freeze(Object.fromEntries(Object.entries(IDENTITE_DEMO_DU_PRO)
    .filter(([cle]) => !['adresse', 'source'].includes(cle)))),
});

/** Ne garde que les chiffres — recopié ici pour que ce fichier n'importe rien. */
function chiffres(t) {
  return String(t == null ? '' : t).replace(/\D/g, '');
}

/** La clé de Luhn, recopiée pour la même raison (siret.js fait foi ; le contrôle compare). */
function cleJuste(s) {
  if (!/^\d{14}$/.test(s) || /^0+$/.test(s)) return false;
  let total = 0;
  for (let i = 0; i < s.length; i += 1) {
    let d = Number(s[s.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    total += d;
  }
  return total % 10 === 0;
}

/**
 * Ce que la fonction Edge répondrait — sans réseau, sans base.
 *
 * `sirensPris` : les SIREN déjà rattachés à un AUTRE compte que
 * l'appelant, DANS la démonstration. Un numéro inconnu de la table, mais
 * dont la clé tombe juste, est `introuvable` : c'est ce que rendrait le
 * répertoire pour un numéro inventé. Un numéro de l'entreprise de
 * l'appelant (absent de `sirensPris`) passe au répertoire, comme sur la
 * vraie fonction : il est trouvé.
 *
 * `maintenant` sert à `trop_d_essais`, qui annonce une heure.
 */
export function reponseDemo(siret, sirensPris = [], maintenant = Date.now()) {
  const s = chiffres(siret);
  if (!cleJuste(s)) return { issue: 'mal_forme' };
  if (sirensPris.includes(s.slice(0, 9))) return { issue: 'deja_utilise' };

  const ligne = SIRETS_DEMO.find((l) => l.siret === s);
  if (!ligne) return { issue: 'introuvable' };

  /* Une entreprise que la démonstration tient pour prise, mais que
     l'appelant n'a PAS dans `sirensPris` : c'est la sienne. Le répertoire
     la connaît. */
  if (ligne.issue === 'deja_utilise' && IDENTITES_DEMO[s]) {
    return { issue: 'ok', identite: { ...IDENTITES_DEMO[s] } };
  }

  switch (ligne.issue) {
    case 'ok': return { issue: 'ok', identite: { ...IDENTITES_DEMO[s] } };
    case 'etablissement_ferme':
      return { issue: 'etablissement_ferme', siret_ouvert: SOCIETE.siret, commune_ouverte: SOCIETE.commune };
    case 'cessee': return { issue: 'cessee', date_fermeture: '2024-06-30' };
    case 'injoignable': return { issue: 'injoignable', reessayer_dans: 60 };
    case 'trop_d_essais':
      return {
        issue: 'trop_d_essais',
        portee: 'connexion',
        reessayer_a: new Date(maintenant + 40 * 60 * 1000).toISOString(),
      };
    default: return { issue: ligne.issue };
  }
}
