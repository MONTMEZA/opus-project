/**
 * LE SIRET — ce qu'on calcule, ce qu'on lit au répertoire, ce qu'on dit.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Depuis le lot 1 bis, un compte professionnel ne naît qu'avec un SIRET
 * trouvé ACTIF au répertoire Sirene. Tout ce qui décide passe par un seul
 * fichier, `src/lib/siret.js`, recopié OCTET POUR OCTET dans la fonction
 * Edge. Ce contrôle tient quatre choses, et chacune a sa raison :
 *
 *   1. LES DEUX COPIES SONT IDENTIQUES. Sinon l'écran et le serveur ne
 *      calculent plus la même clé, et un numéro « prêt » à l'écran revient
 *      « mal formé » du serveur — sans que personne ne comprenne pourquoi.
 *
 *   2. LA LECTURE DU RÉPERTOIRE, FAITE TOURNER sur des réponses
 *      SYNTHÉTIQUES, construites à la main d'après la forme réelle relevée
 *      le 15/10/2026 (rapports 1 et 3). Aucune donnée réelle d'entrepreneur
 *      individuel n'entre dans le dépôt : pour un EI, le nom de l'entreprise
 *      est celui d'une personne. Les cas sont ceux qui ont été MESURÉS :
 *      un SIRET fermé dont l'entreprise est active (tout artisan qui a
 *      déménagé), une recherche qui rend l'entreprise mais pas
 *      l'établissement, un EI sans raison sociale, un établissement en
 *      diffusion partielle, La Poste.
 *
 *   3. LES MOTS. Sirene est un RÉPERTOIRE, et ce qu'il dit ne fait pas un
 *      artisan « vérifié » — ce mot est au badge humain. Chaque message est
 *      FAIT TOURNER, et ce qu'il affiche est relu.
 *
 *   4. LA FONCTION EDGE, dans l'ordre : clé → déjà utilisé → cache →
 *      limites → répertoire. L'adresse IP vient de l'hébergeur, jamais de
 *      `X-Forwarded-For` (écrit par le client, mesuré) ; aucun en-tête du
 *      téléphone ne repart vers le répertoire ; rien de privé ne revient.
 *      `node` n'ouvre pas un fichier TypeScript de Deno : cette partie lit
 *      le TEXTE, et c'est pourquoi tout ce qui se calcule a été rangé dans
 *      `siret.js`, où il TOURNE.
 *
 *   npm run verifier-siret
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import ts from 'typescript';

import * as S from '../src/lib/siret.js';
import { METIERS_PAR_APE, METIERS_PAR_NAF25, metiersProposes } from '../src/data/ape-metiers.js';
import { MAP_METIERS } from '../src/lib/metiers.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Les commentaires partent avant toute lecture de CODE : NEUF fois dans ce
   projet un contrôle a accusé la documentation qui expliquait le défaut
   qu'il traque — et ce fichier-ci nomme `X-Forwarded-For` pour dire
   pourquoi on ne le lit pas. Les lignes `//` ne partent qu'entières, pour
   ne pas couper une adresse `https://`. */
const sansCommentaires = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const APP = 'src/lib/siret.js';
const COPIE = 'supabase/functions/siret/siret.js';
const EDGE = 'supabase/functions/siret/index.ts';

/* ------------------------------------------------------------------ */
/*  Des numéros FICTIFS, à clé juste — fabriqués, jamais relevés        */
/* ------------------------------------------------------------------ */

/** Complète un préfixe du chiffre qui fait tomber la clé de Luhn juste. */
const avecCle = (prefixe) => {
  for (let d = 0; d <= 9; d += 1) if (S.cleDeLuhn(`${prefixe}${d}`)) return `${prefixe}${d}`;
  throw new Error(`aucune clé pour ${prefixe}`);
};
/** Le numéro de TVA français d'un SIREN : FR + clé + SIREN. */
const tvaDe = (siren) => `FR${String((12 + 3 * (Number(siren) % 97)) % 97).padStart(2, '0')}${siren}`;

const SIREN_A = avecCle('00000901'); // une société
const SIRET_A = avecCle(`${SIREN_A}0001`); // son siège
const SIRET_A2 = avecCle(`${SIREN_A}0002`); // un ancien établissement
const SIRET_A3 = avecCle(`${SIREN_A}0003`); // un établissement secondaire
const SIREN_B = avecCle('00000902'); // un entrepreneur individuel
const SIRET_B = avecCle(`${SIREN_B}0001`);
const SIREN_C = avecCle('00000903'); // une entreprise cessée
const SIRET_C = avecCle(`${SIREN_C}0001`);
const SIREN_D = avecCle('00000904'); // un autre SIREN
const SIRET_D = avecCle(`${SIREN_D}0001`);

/* La Poste : un numéro d'établissement qui ÉCHOUE à la clé de Luhn et dont
   la somme des chiffres est un multiple de 5 — la forme mesurée sur 92 de
   ses établissements réels (commit 3726998). Fabriqué ici, pas relevé. */
const LA_POSTE = (() => {
  for (let nic = 10000; nic < 99999; nic += 1) {
    const s = `${S.SIREN_LA_POSTE}${nic}`;
    const somme = [...s].reduce((n, c) => n + Number(c), 0);
    if (!S.cleDeLuhn(s) && somme % 5 === 0) return s;
  }
  throw new Error('aucun numéro La Poste');
})();
const LA_POSTE_FAUX = (() => {
  for (let nic = 10000; nic < 99999; nic += 1) {
    const s = `${S.SIREN_LA_POSTE}${nic}`;
    const somme = [...s].reduce((n, c) => n + Number(c), 0);
    if (!S.cleDeLuhn(s) && somme % 5 !== 0) return s;
  }
  throw new Error('aucun numéro La Poste faux');
})();

/* Des valeurs repérables : si l'une d'elles apparaît dans une réponse au
   téléphone, quelque chose de privé a fui. */
const ADRESSE_PRIVEE = '12 CHEMIN DE L ESSAI 13999 COMMUNE-FICTIVE';
const NOM_COMPLET_PRIVE = 'PRENOM-FICTIF NOM-FICTIF (ENSEIGNE FICTIVE)';
const DIRIGEANT = 'DIRIGEANT-FICTIF';
const MASQUE = '[NON-DIFFUSIBLE]';

/* ------------------------------------------------------------------ */
/*  Des réponses SYNTHÉTIQUES, sur la forme réelle de l'API             */
/*  (champs et types relevés dans registre-minimal.json, 15/10/2026)    */
/* ------------------------------------------------------------------ */

const etablissement = (siret, plus = {}) => ({
  activite_principale: '43.99C',
  activite_principale_naf25: '43.91Y',
  ancien_siege: false,
  adresse: ADRESSE_PRIVEE,
  code_postal: '13999',
  commune: '13999',
  date_creation: '2023-10-19',
  date_fermeture: null,
  est_siege: true,
  etat_administratif: 'A',
  latitude: '43.7000000001',
  longitude: '5.1900000001',
  libelle_commune: 'COMMUNE-FICTIVE',
  liste_enseignes: ['MACONNERIE FICTIVE'],
  nom_commercial: 'MACONNERIE FICTIVE',
  siret,
  statut_diffusion_etablissement: 'O',
  ...plus,
});

const unite = (siren, matching, plus = {}) => ({
  siren,
  nom_complet: 'SOCIETE FICTIVE (MACONNERIE FICTIVE)',
  nom_raison_sociale: 'SOCIETE FICTIVE',
  sigle: null,
  nombre_etablissements: 3,
  nombre_etablissements_ouverts: 1,
  siege: { ...etablissement(avecCle(`${siren}0001`)), coordonnees: '43.7,5.19', departement: '13' },
  activite_principale: '43.99C',
  activite_principale_naf25: '43.91Y',
  date_creation: '2019-03-01',
  date_fermeture: null,
  date_mise_a_jour_insee: '2025-12-06T08:16:42',
  etat_administratif: 'A',
  nature_juridique: '5499',
  statut_diffusion: 'O',
  matching_etablissements: matching,
  complements: { est_entrepreneur_individuel: false, est_rge: false },
  tva: [tvaDe(siren), 'FR00000000000'],
  /* Absents en vrai (`minimal=true`). Présents ici EXPRÈS : la lecture
     doit les ignorer même le jour où l'API les rendrait. */
  dirigeants: [{ nom: DIRIGEANT, prenoms: 'X' }],
  ...plus,
});

const reponse = (resultats) => ({
  results: resultats, total_results: resultats.length, page: 1, per_page: 5, total_pages: 1,
});

/** Tous les textes et toutes les clés d'un objet, à toute profondeur. */
const aplatir = (o, sortie = []) => {
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) { sortie.push(`clé:${k}`); aplatir(v, sortie); }
  } else sortie.push(String(o));
  return sortie;
};
const INTERDITS_PUBLICS = ['clé:adresse', 'clé:nom_complet', 'clé:nom_complet_registre', 'clé:prive',
  'clé:latitude', 'clé:longitude', 'clé:coordonnees', 'clé:dirigeants',
  ADRESSE_PRIVEE, NOM_COMPLET_PRIVE, DIRIGEANT, 'SOCIETE FICTIVE (MACONNERIE FICTIVE)'];
const fuites = (o) => aplatir(o).filter((x) => INTERDITS_PUBLICS.some((i) => x.includes(i)));

/* ================================================================== */
console.log('\nLes deux copies de siret.js');
{
  const ok = existsSync(APP) && existsSync(COPIE);
  verifier('les deux fichiers existent', ok, `${APP} et ${COPIE}`);
  if (ok) {
    const a = readFileSync(APP);
    const b = readFileSync(COPIE);
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    verifier('ils sont identiques OCTET POUR OCTET', a.equals(b),
      `premier écart à l'octet ${i} — recopiez : cp ${APP} ${COPIE}`);
  }

  const code = sansCommentaires(lire(APP));
  verifier('siret.js n’importe RIEN (sinon la copie ne tourne plus dans Deno)',
    !/^\s*import\s/m.test(code) && !/\brequire\(/.test(code) && !/\bimport\(/.test(code)
    && !/^\s*export\s[^;]*\sfrom\s/m.test(code));
}

/* ================================================================== */
console.log('\nLa saisie : la clé, La Poste, le SIREN, la TVA');
{
  const A = S.analyserSaisie;
  verifier('un SIRET fictif à clé juste est « prêt »', A(SIRET_A).etat === 'pret');
  verifier('…collé avec des espaces, des points, des tirets : « prêt », et normalisé',
    egal(A(S.formaterSiret(SIRET_A)), { etat: 'pret', siret: SIRET_A })
    && A(`${SIRET_A.slice(0, 3)}.${SIRET_A.slice(3, 9)}-${SIRET_A.slice(9)}`).siret === SIRET_A);
  const faux = `${SIRET_A.slice(0, 13)}${(Number(SIRET_A[13]) + 1) % 10}`;
  verifier('un chiffre changé : « cle »', A(faux).etat === 'cle');
  verifier('quatorze zéros passent Luhn, et sont refusés quand même',
    S.cleDeLuhn('00000000000000') && A('00000000000000').etat === 'cle'
    && !S.cleSiretValide('00000000000000') && !S.cleSirenValide('000000000'));
  verifier('La Poste : un établissement hors Luhn, somme multiple de 5 → valide',
    !S.cleDeLuhn(LA_POSTE) && S.cleSiretValide(LA_POSTE) && A(LA_POSTE).etat === 'pret');
  verifier('La Poste : son siège passe la clé ordinaire', S.cleSiretValide('35600000000048'));
  verifier('…mais pas n’importe quel numéro de La Poste',
    !S.cleSiretValide(LA_POSTE_FAUX) && A(LA_POSTE_FAUX).etat === 'cle');
  verifier('…et l’exception ne vaut QUE pour La Poste',
    (() => {
      const s = `${SIREN_D}${LA_POSTE.slice(9)}`;
      const somme = [...s].reduce((n, c) => n + Number(c), 0);
      return S.cleDeLuhn(s) || somme % 5 !== 0 || !S.cleSiretValide(s);
    })());

  verifier('9 chiffres à clé juste : « siren »', egal(A(SIREN_A), { etat: 'siren', siret: SIREN_A }));
  verifier('9 chiffres à clé fausse : « incomplet »',
    A(`${SIREN_A.slice(0, 8)}${(Number(SIREN_A[8]) + 1) % 10}`).etat === 'incomplet');
  /* La règle qui oblige l'écran à se taire pendant la frappe. */
  verifier('au 9e chiffre de TOUT SIRET, la saisie vaut « siren » (d’où : jamais pendant la frappe)',
    [SIRET_A, SIRET_B, SIRET_C].every((s) => A(s.slice(0, 9)).etat === 'siren'));

  const tva = tvaDe(SIREN_A);
  verifier('« FR » + clé + SIREN : « tva », avec le SIREN',
    egal(A(tva), { etat: 'tva', siret: tva.slice(2), siren: SIREN_A }));
  verifier('…écrit avec des espaces et en minuscules : « tva »',
    A(`fr ${tva.slice(2, 4)} ${SIREN_A.slice(0, 3)} ${SIREN_A.slice(3, 6)} ${SIREN_A.slice(6)}`).etat === 'tva');
  verifier('…une clé de TVA en LETTRES ne passe pas pour un SIREN',
    A(`FRXA${SIREN_A}`).etat === 'tva' && A(`FRXA${SIREN_A}`).siren === SIREN_A);
  verifier('11 chiffres dont les 9 derniers sont un SIREN : « tva »',
    A(tva.slice(2)).etat === 'tva' && A(tva.slice(2)).siren === SIREN_A);
  verifier('11 chiffres sans SIREN valide au bout : « incomplet »',
    A(`12${SIREN_A.slice(0, 8)}${(Number(SIREN_A[8]) + 1) % 10}`).etat === 'incomplet');
  verifier('vide, incomplet, trop long',
    A('').etat === 'vide' && A('   ').etat === 'vide' && A(null).etat === 'vide'
    && A('12345').etat === 'incomplet' && A(`${SIRET_A}1`).etat === 'trop_long');
  verifier('les états rendus sont ceux qu’annonce ETATS_SAISIE',
    egal([...S.ETATS_SAISIE].sort(), ['cle', 'incomplet', 'pret', 'siren', 'trop_long', 'tva', 'vide']));
  verifier('formaterSiret : « 000 009 011 00010 »',
    S.formaterSiret(SIRET_A) === `${SIRET_A.slice(0, 3)} ${SIRET_A.slice(3, 6)} ${SIRET_A.slice(6, 9)} ${SIRET_A.slice(9)}`);
}

/* ================================================================== */
console.log('\nnettoyerValeur : ce que l’INSEE masque devient null');
{
  const N = S.nettoyerValeur;
  verifier('« [NON-DIFFUSIBLE] », « NON-DIFFUSIBLE », « [ND] » → null',
    N(MASQUE) === null && N('NON-DIFFUSIBLE') === null && N('[ND]') === null
    && N(' [non-diffusible] ') === null);
  verifier('une chaîne vide ou blanche → null ; une chaîne → sans ses bords',
    N('') === null && N('   ') === null && N('  MACONNERIE  ') === 'MACONNERIE');
  verifier('null, undefined, objet, liste → null', [null, undefined, {}, ['a']].every((v) => N(v) === null));
  verifier('un booléen et un nombre restent', N(true) === true && N(false) === false && N(0) === 0
    && N(Number.NaN) === null);
}

/* ================================================================== */
console.log('\nLa lecture du répertoire — sur des réponses synthétiques');
const L = S.lireReponseRegistre;

const cas = {};
{
  /* A — une société, son siège : le chemin heureux. */
  const etabA = etablissement(SIRET_A);
  cas.societe = L(reponse([unite(SIREN_A, [etabA])]), SIRET_A);
  const id = cas.societe.identite || {};
  verifier('une société active, son siège : « ok »', cas.societe.issue === 'ok');
  verifier('l’identité porte EXACTEMENT les champs énumérés',
    egal(Object.keys(id), [...S.CHAMPS_IDENTITE]), JSON.stringify(Object.keys(id)));
  verifier('dénomination = nom_raison_sociale ; nom commercial = celui de l’établissement',
    id.denomination === 'SOCIETE FICTIVE' && id.nom_commercial === 'MACONNERIE FICTIVE');
  verifier('la date de création est celle de l’ENTREPRISE, pas de l’établissement',
    id.date_creation === '2019-03-01', `rendu : ${id.date_creation}`);
  verifier('la TVA est le PREMIER élément de la liste', id.tva === tvaDe(SIREN_A));
  verifier('forme 5499, APE, NAF 2025, siège, commune, codes, diffusion, mise à jour',
    id.forme_juridique === '5499' && id.ape === '43.99C' && id.naf25 === '43.91Y'
    && id.est_siege === true && id.commune === 'COMMUNE-FICTIVE' && id.code_postal === '13999'
    && id.code_insee === '13999' && id.statut_diffusion === 'O' && id.maj_insee === '2025-12-06'
    && id.est_ei === false && id.siren === SIREN_A && id.siret === SIRET_A);
  verifier('l’adresse et nom_complet sont rendus À PART, pour la preuve',
    cas.societe.prive && cas.societe.prive.adresse === ADRESSE_PRIVEE
    && cas.societe.prive.nom_complet_registre === 'SOCIETE FICTIVE (MACONNERIE FICTIVE)');
  verifier('…et l’identité ne contient ni adresse, ni nom_complet, ni coordonnées, ni dirigeants',
    fuites(id).length === 0, fuites(id).join(' · '));
  verifier('les métiers proposés d’après cette identité : maçon',
    egal(metiersProposes(id.ape, id.naf25), ['macon']));

  /* B — la recherche rend l'entreprise et son siège… mais pas
     l'établissement tapé (mesuré, relecture 1). */
  cas.matchingVide = L(reponse([unite(SIREN_A, [])]), SIRET_A);
  verifier('matching_etablissements VIDE → « introuvable », même si le siège a ce numéro',
    cas.matchingVide.issue === 'introuvable', JSON.stringify(cas.matchingVide));
  cas.autreEtab = L(reponse([unite(SIREN_A, [etablissement(SIRET_A3, { est_siege: false })])]), SIRET_A);
  verifier('un AUTRE établissement de la même entreprise → « introuvable »',
    cas.autreEtab.issue === 'introuvable');
  cas.autreSiren = L(reponse([unite(SIREN_D, [etablissement(SIRET_A)])]), SIRET_A);
  verifier('un résultat d’un AUTRE SIREN, même s’il cite ce SIRET → « introuvable »',
    cas.autreSiren.issue === 'introuvable');
  cas.deuxieme = L(reponse([unite(SIREN_D, [etablissement(SIRET_D)]), unite(SIREN_A, [etabA])]), SIRET_A);
  verifier('plusieurs résultats : on prend CELUI qui porte le SIREN',
    cas.deuxieme.issue === 'ok' && cas.deuxieme.identite.siren === SIREN_A);
  cas.vide = L(reponse([]), SIRET_A);
  verifier('aucun résultat → « introuvable »', cas.vide.issue === 'introuvable');
  verifier('une réponse sans liste `results` → « injoignable », jamais « introuvable »',
    [null, undefined, {}, { results: 'x' }, 'texte', 42].every((j) => L(j, SIRET_A).issue === 'injoignable'));

  /* C — un SIRET fermé dont l'entreprise est ACTIVE : tout artisan qui a
     déménagé (mesuré, rapport 1). */
  const uFerme = unite(SIREN_A, [etablissement(SIRET_A2, { etat_administratif: 'F', est_siege: false,
    date_fermeture: '2023-10-18' })]);
  uFerme.siege = { ...uFerme.siege, siret: SIRET_A, libelle_commune: 'COMMUNE-NOUVELLE' };
  cas.ferme = L(reponse([uFerme]), SIRET_A2);
  verifier('SIRET fermé, entreprise active → « etablissement_ferme », avec le siège ouvert',
    egal(cas.ferme, { issue: 'etablissement_ferme', siret_ouvert: SIRET_A, commune_ouverte: 'COMMUNE-NOUVELLE' }),
    JSON.stringify(cas.ferme));
  const uSiegeFerme = unite(SIREN_A, [etablissement(SIRET_A, { etat_administratif: 'F' })]);
  uSiegeFerme.siege = { ...uSiegeFerme.siege, siret: SIRET_A, etat_administratif: 'F' };
  cas.siegeFerme = L(reponse([uSiegeFerme]), SIRET_A);
  verifier('…le SIRET fermé EST le siège : aucun numéro proposé',
    cas.siegeFerme.issue === 'etablissement_ferme' && cas.siegeFerme.siret_ouvert === null
    && cas.siegeFerme.commune_ouverte === null);
  const uSiegeFaux = unite(SIREN_A, [etablissement(SIRET_A2, { etat_administratif: 'F' })]);
  uSiegeFaux.siege = { ...uSiegeFaux.siege, siret: `${SIRET_A.slice(0, 13)}${(Number(SIRET_A[13]) + 1) % 10}` };
  verifier('…un siège à clé fausse n’est jamais proposé',
    L(reponse([uSiegeFaux]), SIRET_A2).siret_ouvert === null);

  /* D — l'entreprise a cessé : son unité est « C ». */
  cas.cessee = L(reponse([unite(SIREN_C, [etablissement(SIRET_C, { etat_administratif: 'F',
    date_fermeture: '2023-01-01' })], { etat_administratif: 'C', date_fermeture: '2024-06-30' })]), SIRET_C);
  verifier('unité « C » → « cessee », avec la date de l’ENTREPRISE',
    egal(cas.cessee, { issue: 'cessee', date_fermeture: '2024-06-30' }), JSON.stringify(cas.cessee));

  /* E — l'état administratif lui-même illisible : le seul vrai « non diffusible ». */
  cas.uniteMasquee = L(reponse([unite(SIREN_A, [etabA], { etat_administratif: MASQUE })]), SIRET_A);
  cas.etabMasque = L(reponse([unite(SIREN_A, [etablissement(SIRET_A, { etat_administratif: null })])]), SIRET_A);
  verifier('état de l’unité ou de l’établissement illisible → « non_diffusible »',
    cas.uniteMasquee.issue === 'non_diffusible' && cas.etabMasque.issue === 'non_diffusible');

  /* F — un entrepreneur individuel : pas de raison sociale (300 sur 300,
     mesuré), un nom commercial parfois absent. */
  cas.ei = L(reponse([unite(SIREN_B, [etablissement(SIRET_B, { nom_commercial: null,
    liste_enseignes: ['ENSEIGNE FICTIVE', 'AUTRE ENSEIGNE'] })], {
    nature_juridique: '1000', nom_raison_sociale: null, nom_complet: NOM_COMPLET_PRIVE,
    complements: { est_entrepreneur_individuel: true },
  })]), SIRET_B);
  const ei = cas.ei.identite || {};
  verifier('EI sans raison sociale : « ok », dénomination null, est_ei',
    cas.ei.issue === 'ok' && ei.denomination === null && ei.est_ei === true && ei.forme_juridique === '1000');
  verifier('…sans nom commercial : sa PREMIÈRE enseigne', ei.nom_commercial === 'ENSEIGNE FICTIVE');
  verifier('…et son nom civil n’entre JAMAIS dans l’identité',
    fuites(ei).length === 0 && cas.ei.prive.nom_complet_registre === NOM_COMPLET_PRIVE);
  const parComplements = L(reponse([unite(SIREN_B, [etablissement(SIRET_B)], {
    nature_juridique: null, complements: { est_entrepreneur_individuel: true } })]), SIRET_B);
  verifier('…EI reconnu aussi par `complements.est_entrepreneur_individuel`',
    parComplements.identite.est_ei === true && parComplements.identite.forme_juridique === null);

  /* G — un établissement en diffusion PARTIELLE : l'état se lit, le reste
     est masqué (2 sièges sur 300 EI, mesuré). */
  cas.partiel = L(reponse([unite(SIREN_B, [etablissement(SIRET_B, {
    statut_diffusion_etablissement: 'P', adresse: MASQUE, code_postal: MASQUE, latitude: MASQUE,
    longitude: MASQUE, nom_commercial: MASQUE, liste_enseignes: [MASQUE, MASQUE],
  })], { nature_juridique: '1000', nom_raison_sociale: null, nom_complet: NOM_COMPLET_PRIVE })]), SIRET_B);
  const p = cas.partiel.identite || {};
  verifier('diffusion partielle, état lisible : « ok » — on ne refuse pas un droit exercé',
    cas.partiel.issue === 'ok' && p.statut_diffusion === 'P');
  verifier('…les champs masqués valent null, la commune reste',
    p.nom_commercial === null && p.code_postal === null && cas.partiel.prive.adresse === null
    && p.commune === 'COMMUNE-FICTIVE');
  verifier('…et « NON-DIFFUSIBLE » n’entre nulle part dans la preuve',
    !JSON.stringify(S.ligneDePreuve(cas.partiel, Date.now())).includes('DIFFUSIBLE'));

  /* H — La Poste. */
  cas.poste = L(reponse([unite(S.SIREN_LA_POSTE, [etablissement(LA_POSTE, { est_siege: false })], {
    nature_juridique: '5510', nom_raison_sociale: 'LA POSTE' })]), LA_POSTE);
  verifier('La Poste : un établissement hors Luhn se lit « ok »',
    cas.poste.issue === 'ok' && cas.poste.identite.est_siege === false);

  /* I — des valeurs qui ne sont pas ce qu'elles prétendent. */
  const bizarre = L(reponse([unite(SIREN_A, [etablissement(SIRET_A, {
    statut_diffusion_etablissement: 'X', activite_principale: '43.22A' })], {
    nature_juridique: '12', date_creation: '2021-02-31', activite_principale: 'BIDON',
    date_mise_a_jour_insee: 'hier', tva: null })]), SIRET_A).identite;
  verifier('diffusion inconnue, forme sur 2 chiffres, 31 février, date illisible → null',
    bizarre.statut_diffusion === null && bizarre.forme_juridique === null
    && bizarre.date_creation === null && bizarre.maj_insee === null && bizarre.tva === null);
  verifier('…un APE illisible pour l’entreprise : celui de l’établissement', bizarre.ape === '43.22A');
}

/* ================================================================== */
console.log('\nCe qui revient au téléphone — reponsePublique');
{
  const R = S.reponsePublique;
  const tous = Object.entries(cas).filter(([, r]) => r.issue !== 'injoignable');
  const fuyants = tous.filter(([, r]) => fuites(R(r)).length > 0);
  verifier(`aucune des ${tous.length} réponses ne fait fuir adresse, nom_complet, coordonnées, dirigeants`,
    fuyants.length === 0, fuyants.map(([n, r]) => `${n} : ${fuites(R(r)).join(' · ')}`).join('\n      '));
  verifier('« ok » : l’issue et l’identité, rien d’autre',
    egal(Object.keys(R(cas.societe)), ['issue', 'identite'])
    && egal(Object.keys(R(cas.societe).identite), [...S.CHAMPS_IDENTITE]));
  verifier('« deja_utilise » n’emporte RIEN du compte qui tient le numéro',
    egal(R({ issue: 'deja_utilise', nom: 'X', ville: 'Y', compte_id: 'Z' }), { issue: 'deja_utilise' }));
  verifier('chaque issue n’emporte que ses détails prévus',
    egal(R({ issue: 'trop_d_essais', reessayer_a: 'a', portee: 'connexion', ip: '1.2.3.4' }),
      { issue: 'trop_d_essais', reessayer_a: 'a', portee: 'connexion' })
    && egal(R({ issue: 'injoignable', reessayer_dans: 30, statut: 503 }), { issue: 'injoignable', reessayer_dans: 30 })
    && egal(R(cas.ferme), cas.ferme) && egal(R(cas.cessee), cas.cessee));
  let leve = 0;
  for (const i of ['reseau', 'service_indisponible', 'lent', 'inventee', undefined]) {
    try { R({ issue: i }); } catch { leve += 1; }
  }
  verifier('une issue que le serveur ne doit pas rendre LÈVE (panne visible, pas réponse inventée)', leve === 5);

  const ligne = S.ligneDePreuve(cas.societe, Date.UTC(2026, 9, 15, 12, 0, 0));
  const attendues = [...S.CHAMPS_IDENTITE.filter((c) => c !== 'siren'), ...S.CHAMPS_PRIVES,
    'source', 'verifiee_le', 'expire_le'];
  verifier('la ligne de preuve : les colonnes prévues, et PAS `siren` (colonne engendrée)',
    egal(Object.keys(ligne).sort(), [...attendues].sort()) && !('siren' in ligne),
    JSON.stringify(Object.keys(ligne)));
  verifier('…source « registre », expire 24 h après, adresse et nom_complet rangés',
    ligne.source === 'registre' && ligne.verifiee_le === '2026-10-15T12:00:00.000Z'
    && ligne.expire_le === '2026-10-16T12:00:00.000Z' && ligne.adresse === ADRESSE_PRIVEE
    && ligne.nom_complet_registre === 'SOCIETE FICTIVE (MACONNERIE FICTIVE)'
    && S.DUREE_PREUVE_MS === 24 * 60 * 60 * 1000);
  verifier('…et aucune ligne pour une issue qui n’est pas « ok »',
    S.ligneDePreuve(cas.ferme, 0) === null && S.ligneDePreuve(null, 0) === null);

  /* La table est écrite par un autre morceau du lot : si elle est déjà
     dans schema.sql, ses colonnes doivent être exactement celles qu'on
     écrit — deux moitiés d'une même donnée, écrites à deux endroits. */
  const schema = lire('supabase/schema.sql').replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
  const m = schema.match(/create table if not exists public\.preuves_siret\s*\(([\s\S]*?)\n\);/);
  if (!m) {
    console.log('  – colonnes de preuves_siret : la table n’est pas encore dans schema.sql (non éprouvé)');
  } else {
    const colonnes = m[1].split('\n').map((l) => l.trim().match(/^([a-z_][a-z0-9_]*)\s/))
      .filter(Boolean).map((x) => x[1]).filter((c) => !['constraint', 'primary', 'unique', 'check'].includes(c));
    /* `pour_email` (15/10/2026) n'appartient qu'aux preuves d'ESSAI,
       posées à la main : une preuve du répertoire ne nomme personne — la
       contrainte `preuve_essai_check` l'exige VIDE. La fonction ne doit
       donc jamais l'écrire. */
    const attenduesBase = [...attendues, 'siren', 'pour_email'].sort();
    verifier('les colonnes de preuves_siret dans schema.sql sont celles que la fonction écrit (+ siren, + pour_email)',
      egal([...new Set(colonnes)].sort(), attenduesBase),
      `schema : ${[...new Set(colonnes)].sort().join(', ')}\n      écrit : ${attenduesBase.join(', ')}`);
    verifier('…et la fonction n’écrit JAMAIS pour_email : une preuve du répertoire ne nomme personne',
      !attendues.includes('pour_email'));
  }
}

/* ================================================================== */
console.log('\nLes issues et les motifs : les listes du contrat');
{
  verifier('ISSUES_SERVEUR : les 9 de la fonction Edge',
    egal([...S.ISSUES_SERVEUR].sort(), ['cessee', 'deja_utilise', 'etablissement_ferme', 'injoignable',
      'introuvable', 'mal_forme', 'non_diffusible', 'ok', 'trop_d_essais']));
  verifier('ISSUES : les mêmes, plus reseau, service_indisponible, lent',
    egal([...S.ISSUES].sort(), [...S.ISSUES_SERVEUR, 'lent', 'reseau', 'service_indisponible'].sort()));
  verifier('MOTIFS : les 7 du contrat',
    egal([...S.MOTIFS], ['introuvable', 'etablissement_ferme', 'cessee', 'non_diffusible',
      'deja_utilise', 'injoignable', 'autre']));
  const schema = lire('supabase/schema.sql').replace(/--.*$/gm, '');
  const m = schema.match(/demande_pro_motif_check\s+check\s*\(\s*motif\s+in\s*\(([^)]*)\)/);
  if (!m) {
    console.log('  – demande_pro_motif_check : pas encore dans schema.sql (non éprouvé)');
  } else {
    const base = [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort();
    verifier('…et ce sont EXACTEMENT ceux de demande_pro_motif_check',
      egal(base, [...S.MOTIFS].sort()), `base : ${base.join(', ')}`);
  }
  verifier('chaque motif a son libellé, tous différents',
    S.MOTIFS.every((x) => S.libelleMotif(x) && !S.libelleMotif(x).includes('«'))
    && new Set(S.MOTIFS.map(S.libelleMotif)).size === S.MOTIFS.length);
  verifier('un motif inconnu s’affiche sous son code, jamais en trou',
    S.libelleMotif('nouveau_motif').includes('nouveau_motif') && S.libelleMotif(null) === 'Motif non précisé');
  verifier('motifDeIssue : chaque motif vaut lui-même, une panne d’Opus vaut « injoignable »',
    S.MOTIFS.every((x) => S.motifDeIssue(x) === x) && S.motifDeIssue('service_indisponible') === 'injoignable'
    && S.motifDeIssue('reseau') === 'autre');
}

/* ================================================================== */
console.log('\nLes messages — FAITS TOURNER, puis relus');
{
  const M = S.messageIssue;
  const futur = new Date(Date.now() + 37 * 60 * 1000).toISOString();
  const variantes = [
    {},
    { echecs: 0 }, { echecs: 1 }, { echecs: 2 }, { echecs: 5 },
    { siret: '12345' }, { siret: `${SIRET_A}12` },
    { siren: SIREN_A },
    { siret_ouvert: SIRET_A, commune_ouverte: 'SAINT-REMY-DE-PROVENCE' }, { siret_ouvert: null },
    { date_fermeture: '2024-06-30' }, { date_fermeture: null },
    { reessayer_a: futur, portee: 'connexion' }, { reessayer_a: futur, portee: 'service' },
    { reessayer_a: 'jamais' }, { reessayer_dans: 30 }, { reessayer_dans: 600 },
    { nom: 'NOM-SECRET', ville: 'VILLE-SECRETE', email: 'x@y.z' },
  ];
  const sujets = [...new Set([...S.ISSUES, ...S.ETATS_SAISIE, 'une_issue_de_demain'])];
  const textes = [];
  let formes = 0;
  for (const i of sujets) {
    for (const v of variantes) {
      const r = M(i, v);
      const forme = r && 'texte' in r && 'action' in r && typeof r.secours === 'boolean'
        && (r.action === null || (S.ACTIONS[r.action.code] && r.action.libelle === S.ACTIONS[r.action.code]));
      if (!forme) formes += 1;
      if (r && typeof r.texte === 'string') textes.push([i, r.texte]);
    }
  }
  verifier('chaque message a la forme { texte, action: null | { code, libelle }, secours }', formes === 0);
  verifier('seuls « ok » et « pret » n’ont pas de texte',
    sujets.every((i) => (['ok', 'pret'].includes(i) ? M(i).texte === null
      : typeof M(i).texte === 'string' && M(i).texte.length > 20)));

  /* LES MOTS. La seule forme tolérée de « vérifi… » est le nom de la porte
     de secours, une DEMANDE faite à un humain (voir l'en-tête de siret.js). */
  const visibles = [...textes.map(([, t]) => t), ...S.MOTIFS.map(S.libelleMotif),
    ...Object.values(S.ACTIONS), S.libelleMotif('x')];
  const registre = visibles.filter((t) => /registre/i.test(t));
  verifier('aucun texte visible ne dit « registre »', registre.length === 0, registre[0]);
  const verifie = visibles.filter((t) => /v[ée]rifi/i.test(t.replace(/vérification à la main/g, '')));
  verifier('aucun texte visible ne dit « vérifié » ni rien de sa famille (hors « vérification à la main »)',
    verifie.length === 0, verifie[0]);
  /* NI CAUTION PUBLIQUE — 15/10/2026, relecture adverse : « Ce numéro
     n’est pas certifié par l’INSEE » passait. La Licence Ouverte interdit
     de suggérer une reconnaissance de l'INSEE, et le plan interdit
     « vérifié » pour ce niveau : « certifié », « agréé » ou « validé par
     l'État » ne valent pas mieux. */
  const caution = visibles.filter((t) => /certifi|agré[ée]|validée? par l.(État|INSEE)/i.test(t));
  verifier('aucun texte visible ne dit « certifié », « agréé » ni « validé par l’État / l’INSEE »',
    caution.length === 0, caution[0]);
  const trous = textes.filter(([, t]) => /\bundefined\b|\bnull\b|\bNaN\b|\[object/.test(t));
  verifier('aucun texte n’affiche undefined, null ou NaN', trous.length === 0, trous[0] && trous[0].join(' → '));
  verifier('« deja_utilise » ne répète rien de ce qu’on lui passe',
    !/SECRET|x@y/.test(M('deja_utilise', { nom: 'NOM-SECRET', ville: 'VILLE-SECRETE', email: 'x@y.z' }).texte));

  /* LA PORTE DE SECOURS — le contrat, issue par issue. */
  const AVEC = ['introuvable', 'etablissement_ferme', 'cessee', 'non_diffusible', 'deja_utilise',
    'service_indisponible'];
  const JAMAIS = ['cle', 'mal_forme', 'siren', 'tva', 'trop_d_essais'];
  verifier('la porte de secours apparaît pour introuvable, fermé, cessée, non diffusible, déjà utilisé, panne',
    AVEC.every((i) => variantes.every((v) => M(i, v).secours === true)));
  verifier('…JAMAIS pour cle, mal_forme, siren, tva, trop_d_essais',
    JAMAIS.every((i) => variantes.every((v) => M(i, v).secours === false)));
  verifier('…pour « injoignable », seulement après DEUX échecs',
    !M('injoignable', { echecs: 0 }).secours && !M('injoignable', { echecs: 1 }).secours
    && M('injoignable', { echecs: 2 }).secours && M('injoignable').secours === false);

  /* ON N'ACCUSE JAMAIS LE NUMÉRO quand le service n'a pas répondu. */
  const SANS_REPONSE = ['reseau', 'service_indisponible', 'lent', 'injoignable', 'trop_d_essais'];
  verifier('réseau, panne, lenteur, répertoire muet, trop d’essais : « votre numéro n’est pas en cause »',
    SANS_REPONSE.every((i) => M(i).texte.includes('n’est pas en cause')));
  verifier('« introuvable » nomme ses TROIS causes, dont la non-publication',
    /chiffre/.test(M('introuvable').texte) && /quelques jours/.test(M('introuvable').texte)
    && /INSEE/.test(M('introuvable').texte));

  verifier('« incomplet » et « trop_long » comptent les chiffres tapés',
    M('incomplet', { siret: '12345' }).texte.includes('tapé 5')
    && M('trop_long', { siret: `${SIRET_A}12` }).texte.includes('Il y a 16 chiffres'));
  verifier('« tva » montre le SIREN où commence le SIRET',
    M('tva', { siren: SIREN_A }).texte.includes(`${SIREN_A.slice(0, 3)} ${SIREN_A.slice(3, 6)} ${SIREN_A.slice(6)}`));
  const ferme = M('etablissement_ferme', { siret_ouvert: SIRET_A, commune_ouverte: 'SAINT-REMY-DE-PROVENCE' });
  verifier('« etablissement_ferme » propose le numéro ouvert, écrit lisiblement, et sa commune',
    ferme.texte.includes(S.formaterSiret(SIRET_A)) && ferme.texte.includes('(Saint-Remy-de-Provence)')
    && ferme.action.code === 'utiliser');
  verifier('…sans numéro ouvert, il fait corriger',
    M('etablissement_ferme', {}).action.code === 'corriger');
  verifier('« cessee » date la cessation, et se tait sans date',
    M('cessee', { date_fermeture: '2024-06-30' }).texte.includes('le 30/06/2024')
    && /activité\. Opus/.test(M('cessee', {}).texte));
  verifier('« trop_d_essais » donne l’heure, et dit QUELLE limite',
    / h( \d\d)?\.$/.test(M('trop_d_essais', { reessayer_a: futur, portee: 'connexion' }).texte)
    && M('trop_d_essais', { portee: 'connexion' }).texte.includes('cette connexion')
    && !M('trop_d_essais', { portee: 'service' }).texte.includes('cette connexion'));
  verifier('« injoignable » suit le Retry-After',
    M('injoignable', { reessayer_dans: 30 }).texte.includes('dans une minute')
    && M('injoignable', { reessayer_dans: 600 }).texte.includes('dans 10 minutes'));
  verifier('une issue inconnue de cette version : un message, jamais un trou ni un « ok »',
    typeof M('une_issue_de_demain').texte === 'string' && M('une_issue_de_demain').action.code === 'reessayer');

  verifier('communeLisible : capitales du répertoire → nom lisible, particules en minuscules',
    S.communeLisible('SAINT-REMY-DE-PROVENCE') === 'Saint-Remy-de-Provence'
    && S.communeLisible('L\'ISLE-SUR-LA-SORGUE') === 'L\'Isle-sur-la-Sorgue'
    && S.communeLisible('VILLENEUVE-D\'ASCQ') === 'Villeneuve-d\'Ascq'
    && S.communeLisible('LE PUY-EN-VELAY') === 'Le Puy-en-Velay'
    && S.communeLisible('Lambesc') === 'Lambesc' && S.communeLisible(MASQUE) === null);
  verifier('departementDe : 13, Corse en 2A/2B, outre-mer sur trois chiffres, et rien de deviné',
    S.departementDe('13053') === '13' && S.departementDe('2A004') === '2A' && S.departementDe('2b033') === '2B'
    && S.departementDe('97411') === '974' && S.departementDe(null, '13370') === '13'
    && S.departementDe(null, '20000') === null && S.departementDe(MASQUE, MASQUE) === null);
}

/* ================================================================== */
console.log('\nLes métiers proposés d’après l’activité');
{
  const proposes = [...Object.values(METIERS_PAR_APE), ...Object.values(METIERS_PAR_NAF25)].flat();
  const inconnus = [...new Set(proposes.filter((c) => !MAP_METIERS[c]))];
  verifier(`les ${new Set(proposes).size} métiers proposés existent tous au catalogue`,
    inconnus.length === 0, inconnus.join(', '));
  verifier('un code connu propose, la casse n’y fait rien',
    egal(metiersProposes('43.99C'), ['macon']) && egal(metiersProposes('43.99c', null), ['macon'])
    && egal(metiersProposes(null, '43.41H'), ['couvreur']));
  verifier('un code inconnu ne propose RIEN — jamais « maçon » d’office',
    egal(metiersProposes('99.99Z', '99.99Y'), []) && egal(metiersProposes(null, null), []));
  const copie = metiersProposes('43.99C');
  copie.push('peintre-en-batiment');
  verifier('…et la liste rendue est une copie : la modifier ne touche pas la table',
    egal(metiersProposes('43.99C'), ['macon']));
}

/* ================================================================== */
console.log('\nLes calculs de la fonction Edge — limites, IP, empreinte');
{
  verifier('les limites : 20 par heure et par connexion, 120 par minute pour tout Opus',
    S.LIMITES.ip.max === 20 && S.LIMITES.ip.duree_ms === 3600000
    && S.LIMITES.global.max === 120 && S.LIMITES.global.duree_ms === 60000
    && Object.isFrozen(S.LIMITES) && Object.isFrozen(S.LIMITES.ip));
  /* Les deux seaux du 15/10 (relecture adverse) : le /48, sans lequel une
     seule personne épuisait la limite de tout Opus ; les lectures, sans
     lesquelles « ce SIREN a-t-il un compte ? » se posait sans fin. */
  verifier('…plus 100 par heure et par bloc /48, et 200 lectures par heure et par connexion',
    S.LIMITES.bloc && S.LIMITES.bloc.max === 100 && S.LIMITES.bloc.duree_ms === 3600000
    && S.LIMITES.lecture && S.LIMITES.lecture.max === 200 && S.LIMITES.lecture.duree_ms === 3600000
    && Object.isFrozen(S.LIMITES.bloc) && Object.isFrozen(S.LIMITES.lecture)
    && S.LIMITES.bloc.max > S.LIMITES.ip.max && S.LIMITES.lecture.max > S.LIMITES.ip.max);
  const t = Date.UTC(2026, 9, 15, 14, 32, 10, 500);
  verifier('les fenêtres tombent sur l’heure et la minute pile',
    S.debutDeFenetre(t, S.LIMITES.ip.duree_ms) === '2026-10-15T14:00:00.000Z'
    && S.debutDeFenetre(t, S.LIMITES.global.duree_ms) === '2026-10-15T14:32:00.000Z');

  const P = S.prefixeIp;
  verifier('une IPv4 se compte entière', P('203.0.113.7') === '203.0.113.7' && P(' 203.0.113.7 ') === '203.0.113.7');
  verifier('une IPv6 se compte par /64 : deux adresses du même abonné, UN compteur',
    P('2001:db8:85a3:8d3:1319:8a2e:370:7348') === '2001:db8:85a3:8d3::/64'
    && P('2001:0DB8:85a3:08d3:ffff:ffff:ffff:ffff') === '2001:db8:85a3:8d3::/64');
  verifier('…deux abonnés, deux compteurs', P('2001:db8:85a3:8d4::1') !== P('2001:db8:85a3:8d3::1'));
  verifier('…les formes abrégées, entre crochets, avec zone',
    P('2001:db8::1') === '2001:db8:0:0::/64' && P('[2001:db8::1]') === '2001:db8:0:0::/64'
    && P('fe80::1%eth0') === 'fe80:0:0:0::/64');
  verifier('une IPv4 « mappée » est la même connexion que l’IPv4',
    P('::ffff:192.0.2.1') === '192.0.2.1' && P('::ffff:c000:201') === '192.0.2.1');
  verifier('ce qui n’est pas une adresse → null (refusé, jamais compté sous une clé vide)',
    [null, undefined, '', 'abc', '1.2.3.256', '1.2.3', '1:2:3', '1::2::3', 'g::1', '1.2.3.4, 5.6.7.8']
      .every((x) => P(x) === null));

  /* LE BLOC /48 — mesuré par la relecture adverse : deux /64 d'un même
     tunnel gratuit faisaient deux compteurs. Ils doivent tomber dans UN
     bloc. */
  const B = S.blocIpv6;
  verifier('deux /64 du même /48 : UN bloc', typeof B === 'function'
    && B('2001:470:1f0b:1::1') === '2001:470:1f0b::/48'
    && B('2001:470:1f0b:2::1') === '2001:470:1f0b::/48'
    && B('2001:470:1f0c:1::1') !== B('2001:470:1f0b:1::1'));
  verifier('…une IPv4 (mappée comprise) n’a pas de bloc, ni ce qui n’est pas une adresse',
    typeof B === 'function' && B('203.0.113.7') === null && B('::ffff:192.0.2.1') === null
    && B('abc') === null && B(null) === null);

  /* L'ORIGINE — le navigateur de n'importe quelle page faisait envoyer
     des vérifications avec l'adresse IP de ses visiteurs. */
  const O = S.origineAutorisee;
  verifier('aucune origine (l’application installée) passe ; localhost et opus-project.com passent',
    typeof O === 'function' && O(null) && O(undefined) && O('')
    && O('http://localhost:8081') && O('http://127.0.0.1:19006') && O('http://localhost')
    && O('https://opus-project.com') && O('https://www.opus-project.com'));
  verifier('…une autre page web, une origine « null », un faux localhost : refusés',
    typeof O === 'function' && !O('https://evil.example') && !O('null')
    && !O('http://localhost.evil.example') && !O('https://localhost:8081.evil.example')
    && !O('http://localhost:8081/chemin') && !O('http://opus-project.com')
    && !O('https://opus-project.com.evil.example'));
}

/* L'empreinte est asynchrone : elle se vérifie à part, puis on conclut. */
const verifierEmpreinte = async () => {
  console.log('\nL’empreinte : HMAC-SHA-256 par crypto.subtle');
  const secret = 'cle-de-service-fictive';
  const e1 = await S.empreinteIp(secret, '2001:db8:85a3:8d3::/64');
  verifier('elle vaut exactement le HMAC-SHA-256 de node:crypto',
    e1 === createHmac('sha256', secret).update('2001:db8:85a3:8d3::/64').digest('hex'));
  verifier('64 caractères hexadécimaux, et la clé change tout',
    /^[0-9a-f]{64}$/.test(e1) && e1 !== await S.empreinteIp('autre-cle', '2001:db8:85a3:8d3::/64'));
  let refuse = false;
  try { await S.empreinteIp('', '1.2.3.4'); } catch { refuse = true; }
  verifier('…et sans secret, elle refuse (un SHA-256 nu se recalcule pour toutes les IPv4)', refuse);

  const R = S.secondesAvantReessai;
  const maintenant = Date.UTC(2026, 9, 15, 14, 0, 0);
  verifier('Retry-After en secondes ou en date HTTP ; rien d’absurde',
    R('120', maintenant) === 120 && R(' 30 ', maintenant) === 30
    && R(new Date(maintenant + 90000).toUTCString(), maintenant) === 90
    && R(new Date(maintenant - 90000).toUTCString(), maintenant) === 0
    && R('999999', maintenant) === 86400 && R('-5', maintenant) === null
    && R('bientôt', maintenant) === null && R(null, maintenant) === null);
};

/* ================================================================== */
const verifierEdge = () => {
  console.log('\nLa fonction Edge — l’ordre, les en-têtes, ce qui sort');
  if (!existsSync(EDGE)) { verifier('la fonction Edge existe', false, EDGE); return; }
  /* D'abord : se PARSE-t-elle ? Une faute de syntaxe dans un fichier que
     rien ne construit (ni Metro, ni l'export) ne se verrait qu'au
     déploiement. Le compilateur TypeScript du projet la lit ici, sans rien
     écrire. (Le typage complet, lui, demande les types de Deno : il se fait
     à la main avec `tsc`, et le message de commit le dit.) */
  const brutEdge = lire(EDGE);
  const transpile = ts.transpileModule(brutEdge, {
    reportDiagnostics: true,
    fileName: 'index.ts',
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  verifier('elle se parse en TypeScript, sans une erreur de syntaxe',
    transpile.diagnostics.length === 0,
    transpile.diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join(' ; '));

  const code = sansCommentaires(brutEdge);
  const i0 = code.indexOf('Deno.serve(');
  verifier('elle répond par Deno.serve', i0 >= 0);
  /* Le TRAVAIL vit dans `traiter()`, que `Deno.serve` appelle après avoir
     jugé l'origine (15/10/2026) : c'est là qu'on cherche les étapes. */
  const iT = code.indexOf('async function traiter(');
  verifier('…qui appelle `traiter()` : le travail d’une requête permise', iT >= 0 && iT < i0);
  const corps = iT >= 0 && i0 > iT ? code.slice(iT, i0) : '';
  const serve = i0 >= 0 ? code.slice(i0) : '';

  verifier('elle importe ./siret.js — le même code que l’écran',
    /from '\.\/siret\.js'/.test(code));
  verifier('…et supabase-js comme `compte`',
    code.includes("from 'npm:@supabase/supabase-js@2.58.0'")
    && lire('supabase/functions/compte/index.ts').includes("from 'npm:@supabase/supabase-js@2.58.0'"));

  /* L'ORDRE. */
  const pos = [
    ['la clé de contrôle', corps.search(/cleSiretValide\(/)],
    ['les lectures', corps.search(/rpc\('compter_appel_siret',\s*\{\s*p_cle:\s*`lecture:/)],
    ['« déjà utilisé »', corps.search(/from\('entreprise_registre'\)/)],
    ['le cache', corps.search(/from\('preuves_siret'\)\s*\.select\(/)],
    ['la limite par connexion', corps.search(/rpc\('compter_appel_siret',\s*\{\s*p_cle:\s*`ip:/)],
    ['la limite pour tous', corps.search(/rpc\('compter_appel_siret',\s*\{\s*p_cle:\s*'global'/)],
    ['le répertoire', corps.search(/\bfetch\(/)],
    ['la lecture', corps.search(/lireReponseRegistre\(/)],
    ['la preuve', corps.search(/from\('preuves_siret'\)\s*\.upsert\(/)],
  ];
  const absents = pos.filter(([, p]) => p < 0).map(([n]) => n);
  verifier('les neuf étapes sont là', absents.length === 0, `absentes : ${absents.join(', ')}`);
  const desordre = pos.slice(1).filter(([, p], k) => p >= 0 && pos[k][1] >= 0 && p < pos[k][1]);
  verifier('…et dans l’ordre : clé → lectures → déjà utilisé → cache → limites → répertoire → lecture → preuve',
    absents.length === 0 && desordre.length === 0,
    desordre.map(([n]) => `« ${n} » arrive trop tôt`).join(' ; '));
  verifier('le seau des lectures lit LIMITES.lecture, et un dépassement rend trop_d_essais',
    /p_cle:\s*`lecture:\$\{empreinte\}`/.test(corps) && /p_max:\s*LIMITES\.lecture\.max/.test(corps)
    && /debutDeFenetre\(instant,\s*LIMITES\.lecture\.duree_ms\)/.test(corps));

  /* DÉJÀ UTILISÉ : sur une identité ACTIVE ou GELÉE, par le SIREN, sans
     rien dire. */
  const dejaUtilise = corps.slice(pos[2][1], pos[3][1]);
  verifier('« déjà utilisé » se juge sur le SIREN, l’identité active OU gelée par l’administration',
    /\.eq\('siren',\s*siret\.slice\(0,\s*9\)\)/.test(dejaUtilise)
    && /\.or\('retiree_le\.is\.null,gele\.is\.true'\)/.test(dejaUtilise)
    && !/\.is\('retiree_le',\s*null\)/.test(dejaUtilise),
    'sans le gel, l’entreprise retirée à un squatteur lui revenait la minute suivante (section 45.3)');
  verifier('…et la réponse ne porte QUE l’issue', /repondre\(\{\s*issue:\s*'deja_utilise'\s*\}\)/.test(dejaUtilise));
  /* L'EXCEPTION DE L'APPELANT : sa propre fiche, reconnue par SON jeton —
     et jamais pour une entreprise gelée. */
  verifier('…sauf pour la fiche de l’appelant, reconnue par son jeton, et jamais si l’entreprise est gelée',
    /const gelee = porteurs\.some\(\(p\) => p\.gele\)/.test(dejaUtilise)
    && /gelee \? null : await appelant\(admin, req\.headers\.get\('Authorization'\)\)/.test(dejaUtilise)
    && /porteurs\.every\(\(p\) => p\.pro_id === moi\)/.test(dejaUtilise)
    && /admin\.auth\.getUser\(jeton\)/.test(code),
    'un artisan qui a déménagé doit pouvoir faire consulter son nouvel établissement — et un squatteur retiré, jamais');
  verifier('…et le jeton ne sert qu’à ça : lu à UN endroit, passé à `appelant()`',
    (code.match(/req\.headers\.get\('Authorization'\)/g) || []).length === 1
    && (code.match(/appelant\(admin,/g) || []).length === 1);

  /* LE CACHE : la source du répertoire, une preuve fraîche, l'identité seule. */
  const cache = corps.slice(pos[3][1], corps.indexOf('compte = true'));
  verifier('le cache ne prend qu’une preuve du répertoire, et fraîche',
    /\.eq\('source',\s*'registre'\)/.test(cache) && /\.gt\('expire_le',/.test(cache));
  verifier('…et ne relit que les colonnes de l’identité (jamais l’adresse)',
    /\.select\(CHAMPS_IDENTITE\.join\(/.test(cache) && !/select\('\*'\)|adresse/.test(cache));

  /* L'ADRESSE IP. */
  verifier('l’adresse IP vient de cf-connecting-ip, puis x-real-ip',
    /req\.headers\.get\('cf-connecting-ip'\)\s*\?\?\s*req\.headers\.get\('x-real-ip'\)/.test(corps));
  verifier('X-Forwarded-For n’est lu NULLE PART (il est écrit par le client)',
    !/x-forwarded-for/i.test(code) && !/x-forwarded-for/i.test(sansCommentaires(lire(APP))));
  const lectures = code.match(/req\.headers/g) || [];
  const permises = code.match(/req\.headers\.get\('(cf-connecting-ip|x-real-ip|Origin|Authorization)'\)/g) || [];
  verifier('aucun autre en-tête du téléphone n’est lu (l’adresse, l’origine, le jeton)',
    lectures.length === permises.length,
    `${lectures.length - permises.length} lecture(s) de req.headers en trop`);
  verifier('l’adresse est réduite (/64) puis passée au HMAC avec la clé de service',
    /prefixeIp\(ip\)/.test(corps) && /empreinteIp\(cleService,\s*prefixe\)/.test(corps)
    && /if \(!prefixe\)[\s\S]{0,200}issue:\s*'injoignable'/.test(corps));
  verifier('les limites lisent LIMITES (20/heure, 120/minute), sur des fenêtres pile',
    /p_max:\s*LIMITES\.ip\.max/.test(corps) && /p_max:\s*LIMITES\.global\.max/.test(corps)
    && /debutDeFenetre\(instant,\s*LIMITES\.ip\.duree_ms\)/.test(corps)
    && /debutDeFenetre\(instant,\s*LIMITES\.global\.duree_ms\)/.test(corps));
  /* Le second seau, entre la limite par connexion et celle de tout Opus. */
  const iBloc = corps.search(/p_cle:\s*`bloc:/);
  verifier('le bloc /48 d’une IPv6 a son seau (LIMITES.bloc), haché lui aussi, avant la limite pour tous',
    /const bloc = blocIpv6\(prefixe\)/.test(corps) && iBloc > pos[4][1] && iBloc < pos[5][1]
    && /p_cle:\s*`bloc:\$\{await empreinteIp\(cleService,\s*bloc\)\}`/.test(corps)
    && /p_max:\s*LIMITES\.bloc\.max/.test(corps));
  verifier('ni l’adresse ni son empreinte ne vont au journal de la fonction',
    !/console\.\w+\([^;]*\b(ip|prefixe|empreinte)\b/.test(code));

  /* LE RÉPERTOIRE. */
  const fetchAppel = corps.slice(pos[6][1], corps.indexOf('});', pos[6][1]) + 3);
  verifier('l’adresse demandée : le SIRET, minimal, les quatre inclusions, 5 résultats',
    /'https:\/\/recherche-entreprises\.api\.gouv\.fr\/search'/.test(code)
    && /\?q=\$\{siret\}&minimal=true/.test(corps)
    && /&include=siege,complements,tva,matching_etablissements&per_page=5/.test(corps));
  verifier('un User-Agent qui nomme Opus',
    /'User-Agent':\s*USER_AGENT/.test(fetchAppel) && /const USER_AGENT = '[^']*Opus/.test(code));
  /* EXACTEMENT ces deux en-têtes, et rien qui vienne du téléphone — 15/10,
     relecture adverse : chercher seulement `req` laissait partir
     `'X-Client': String(ip)` sans un ✘, alors que les textes légaux
     promettent « jamais votre adresse IP ». */
  const enTetes = (fetchAppel.match(/headers:\s*(\{[^}]*\})/) || [])[1] || '';
  verifier('aucun en-tête du téléphone ne repart vers le répertoire',
    !/\breq\b/.test(fetchAppel) && !/new Headers\(\s*req|\.\.\.req\.headers|headers:\s*req/.test(code));
  verifier('…les en-têtes envoyés sont EXACTEMENT User-Agent et Accept',
    /^\{\s*'User-Agent':\s*USER_AGENT,\s*Accept:\s*'application\/json'\s*\}$/.test(enTetes),
    `en-têtes : ${enTetes || '(introuvables)'}`);
  const constructionAdresse = (corps.match(/const adresse = [\s\S]*?;/) || [''])[0];
  verifier('…et ni l’adresse IP, ni son empreinte, ni la requête n’entrent dans l’appel ou dans l’adresse demandée',
    !!constructionAdresse
    && !/\b(ip|prefixe|empreinte|bloc|req|origine)\b/.test(fetchAppel)
    && !/\b(ip|prefixe|empreinte|bloc|req|origine)\b/.test(constructionAdresse));
  verifier('8 secondes au plus, par AbortController, minuteur levé dans tous les cas',
    /const DELAI_REPERTOIRE_MS = 8000;/.test(code) && /new AbortController\(\)/.test(corps)
    && /setTimeout\(\(\)\s*=>\s*\w+\.abort\(\),\s*DELAI_REPERTOIRE_MS\)/.test(corps)
    && /signal:\s*\w+\.signal/.test(fetchAppel) && /finally\s*\{\s*clearTimeout\(/.test(corps));
  verifier('429 et 5xx → « injoignable », avec le Retry-After lu',
    /status === 429 \|\| \w+\.status >= 500/.test(corps)
    && /secondesAvantReessai\(\w+\.headers\.get\('Retry-After'\)\)/.test(corps));

  /* CE QUI SORT. */
  /* Les appels de la fonction `json`, pas les lectures de corps
     (`req.json()`, `reponse.json()`). */
  const appelsJson = [...code.matchAll(/(?<![.\w])json\(([^)]{0,40})/g)].map((x) => x[1]);
  const horsPorte = appelsJson.filter((a) => a !== 'corps' && !/^\{\s*error:/.test(a));
  verifier('toute issue sort par `repondre` → reponsePublique → HTTP 200',
    horsPorte.length === 0 && /const corps = reponsePublique\(resultat\);/.test(code)
    && !/json\(\{\s*issue/.test(code), `appels hors porte : ${horsPorte.join(' | ')}`);
  verifier('…et la réponse finale aussi', /return await repondre\(resultat\);/.test(corps));
  verifier('la preuve : la ligne de siret.js, un upsert sur le SIRET',
    /ligneDePreuve\(resultat,/.test(corps) && /\.upsert\(ligne,\s*\{\s*onConflict:\s*'siret'\s*\}\)/.test(corps));
  verifier('la purge part par .delete() : preuves expirées, compteurs de plus d’un jour',
    /await purger\(admin\)/.test(code)
    && /from\('preuves_siret'\)\s*\.delete\(\)\s*\.lt\('expire_le'/.test(code)
    && /from\('siret_limites'\)\s*\.delete\(\)\s*\.lt\('fenetre'/.test(code)
    && !/delete from/i.test(code));
  /* …mais seulement après un appel COMPTÉ (15/10, relecture adverse) : un
     POST vide, anonyme et sans limite coûtait deux suppressions. */
  const iCompte = corps.indexOf('compte = true');
  verifier('…et seulement après un appel COMPTÉ : `compte` posé juste avant la limite par connexion',
    /let compte = false;/.test(corps) && /if \(compte\) await purger\(admin\)/.test(corps)
    && (code.match(/await purger\(admin\)/g) || []).length === 1
    && iCompte > pos[3][1] && iCompte < pos[4][1]);
  verifier('POST seulement, et la clé de service ne vient que de l’environnement',
    /req\.method !== 'POST'/.test(corps) && /Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/.test(corps));

  /* L'ORIGINE — 15/10/2026, relecture adverse. */
  verifier('plus d’étoile : l’origine renvoyée est celle de la requête, si elle est permise',
    !/Access-Control-Allow-Origin'?\s*:\s*'\*'/.test(code)
    && /'Access-Control-Allow-Origin':\s*origine/.test(code) && /Vary:\s*'Origin'/.test(code));
  verifier('…et une origine inconnue est refusée AVANT le travail (CORS seul n’empêche pas d’envoyer)',
    /const origine = req\.headers\.get\('Origin'\)/.test(serve)
    && /origineAutorisee\(origine\)\s*\?\s*await traiter\(req\)\s*:\s*json\(\{\s*error:[^}]*\},\s*403\)/.test(serve)
    && (code.match(/traiter\(req\)/g) || []).length === 1);

  /* CE QUE LA FONCTION ATTEND DE LA BASE. Les deux moitiés sont écrites à
     deux endroits : un paramètre renommé d'un côté, et `rpc()` échoue à
     l'exécution — jamais avant. Tant que la section 45 n'est pas dans
     schema.sql, on le DIT au lieu de passer au vert. */
  const schema = lire('supabase/schema.sql').replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
  const f = schema.match(/function public\.compter_appel_siret\(\s*([\s\S]*?)\)\s*returns\s+boolean/);
  if (!f) {
    console.log('  – compter_appel_siret : pas encore dans schema.sql (non éprouvé)');
  } else {
    const params = f[1].split(',').map((x) => x.trim().split(/\s+/)[0]);
    verifier('compter_appel_siret(p_cle, p_fenetre, p_max) — les noms qu’appelle la fonction',
      egal(params, ['p_cle', 'p_fenetre', 'p_max']), `schema : ${params.join(', ')}`);
  }
  const table = (nom) => (schema.match(new RegExp(`create table if not exists public\\.${nom}\\s*\\(([\\s\\S]*?)\\n\\);`)) || [])[1];
  const registre = table('entreprise_registre');
  const limites = table('siret_limites');
  if (!registre || !limites) {
    console.log('  – entreprise_registre / siret_limites : pas encore dans schema.sql (non éprouvé)');
  } else {
    verifier('les colonnes lues et purgées existent : siren, retiree_le, fenetre',
      /^\s*siren\s/m.test(registre) && /^\s*retiree_le\s/m.test(registre) && /^\s*fenetre\s/m.test(limites));
  }
};

/* ================================================================== */
const verifierPaquet = () => {
  console.log('\nLe contrôle est lancé avec les autres');
  const scripts = JSON.parse(lire('package.json')).scripts || {};
  verifier('`npm run verifier-siret` existe', scripts['verifier-siret'] === 'node scripts/verifier-siret.mjs');
};

verifierEmpreinte()
  .then(() => { verifierEdge(); verifierPaquet(); })
  .catch((e) => { echecs += 1; console.error(`  ✘ le contrôle a planté : ${e && e.stack}`); })
  .finally(() => {
    console.log(echecs ? `\n${echecs} échec(s).` : '\nTout est en ordre.');
    process.exit(echecs ? 1 : 0);
  });
