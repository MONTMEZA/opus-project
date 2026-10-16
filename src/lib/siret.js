/**
 * LE SIRET D'UN ARTISAN — TOUT CE QUI SE CALCULE SANS DEMANDER À PERSONNE.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Depuis la décision du 12/10/2026, un SIRET trouvé ACTIF au répertoire
 * Sirene de l'INSEE est la condition de l'inscription professionnelle
 * (docs/SIRET-ET-CLAUSES.md §8). Avant d'interroger qui que ce soit, une
 * bonne partie des erreurs se reconnaît sur place, sans réseau :
 *
 *   - un chiffre mal tapé (la clé de contrôle ne tombe pas juste) ;
 *   - le SIREN (9 chiffres) tapé à la place du SIRET (14) — c'est l'erreur
 *     la plus probable : les deux figurent sur le même document ;
 *   - le numéro de TVA tapé à la place du SIRET — il contient le SIREN ;
 *   - un numéro collé avec des espaces, des points ou des tirets.
 *
 * Relevé sur la vraie base le 15/10/2026 : les cinq SIRET inventés qui y
 * dormaient échouent TOUS à la clé de contrôle. Ce calcul les aurait
 * refusés sans appeler le répertoire.
 *
 * CE FICHIER N'IMPORTE RIEN, ET C'EST UNE RÈGLE
 * ---------------------------------------------
 * Il est recopié OCTET POUR OCTET dans `supabase/functions/siret/siret.js` :
 * la fonction Edge et l'application calculent donc la clé, lisent la
 * réponse du répertoire et écrivent les messages avec le MÊME code
 * (`npm run verifier-siret` refuse qu'ils divergent). Un seul `import`, et
 * la copie ne tournerait plus dans Deno. C'est aussi la leçon de
 * `cloudinary-adresses.js` : un calcul pur rangé ailleurs ne peut plus être
 * FAIT TOURNER par un contrôle.
 *
 * LES MOTS — ET POURQUOI ILS NE SONT PAS LIBRES
 * ---------------------------------------------
 * Sirene est un RÉPERTOIRE (tenu par l'INSEE), pas un registre. Et ce qu'il
 * répond prouve qu'une entreprise EXISTE et est ACTIVE, jamais que celui
 * qui tape le numéro en est le titulaire : un SIRET est public. D'où deux
 * interdits dans tout texte que ce fichier fait LIRE à quelqu'un :
 *
 *   - jamais « registre » ;
 *   - jamais « vérifié(e) » : ce mot appartient au badge, posé par un
 *     humain après contrôle des pièces. Le donner à une consultation de
 *     trente secondes, faite avec le numéro de n'importe qui, en ferait un
 *     outil d'hameçonnage.
 *
 * `verifier-siret` FAIT TOURNER chaque message et refuse les deux. La seule
 * forme de la famille tolérée est le nom de la porte de secours,
 * « vérification à la main » — c'est une DEMANDE faite à un humain, pas un
 * statut.
 *
 * (Les noms de code — `lireReponseRegistre`, la source `'registre'` d'une
 * preuve — gardent le mot : ils ne s'affichent jamais, et la base les
 * connaît déjà sous ce nom.)
 *
 * L'API — CE QUE L'APPLICATION ET LA FONCTION EDGE APPELLENT
 * ===========================================================
 * La saisie, sur le téléphone, sans réseau :
 *
 *   chiffresSeuls(texte)      → '91251793500033'
 *   cleDeLuhn(chiffres)       → booléen
 *   cleSiretValide(siret)     → booléen (exception de La Poste comprise)
 *   cleSirenValide(siren)     → booléen
 *   formaterSiret(siret)      → '912 517 935 00033'
 *   analyserSaisie(texte)     → { etat, siret } (+ `siren` pour l'état 'tva')
 *       etat ∈ ETATS_SAISIE : vide · tva · trop_long · siren · incomplet · cle · pret
 *       L'ÉCRAN n'affiche l'état qu'au 14e chiffre, à l'appui sur
 *       « Vérifier », ou quand le champ perd la main — JAMAIS pendant la
 *       frappe : au 9e chiffre de TOUT SIRET, la saisie vaut 'siren'.
 *
 * Ce que le répertoire a répondu (appelé par la fonction Edge) :
 *
 *   nettoyerValeur(v)                 → la valeur, ou null si masquée ou vide
 *   lireReponseRegistre(json, siret)  → { issue, … }
 *       'ok'                  { identite, prive }
 *       'introuvable'         {}
 *       'etablissement_ferme' { siret_ouvert, commune_ouverte }
 *       'cessee'              { date_fermeture }
 *       'non_diffusible'      {}
 *       'injoignable'         {}   (une réponse qui n'a pas la forme attendue)
 *   CHAMPS_IDENTITE, identiteDepuis(objet)
 *       l'identité qui part vers le téléphone : JAMAIS l'adresse de rue,
 *       jamais `nom_complet`, jamais les coordonnées ni les dirigeants.
 *   CHAMPS_PRIVES                     ce que la preuve range en plus
 *                                     (adresse, nom_complet_registre)
 *   reponsePublique(resultat)         → ce que la fonction Edge RENVOIE
 *       (la seule porte de sortie : elle retire tout ce qui n'est pas prévu)
 *   ligneDePreuve(resultat, instantMs) → la ligne de `preuves_siret`
 *   DUREE_PREUVE_MS                   24 heures
 *
 * Ce que l'écran dit :
 *
 *   ISSUES                 les 12 issues (les 9 de la fonction Edge, plus
 *                          reseau, service_indisponible, lent, fabriquées
 *                          par l'application)
 *   ISSUES_SERVEUR         les 9 que la fonction Edge peut rendre
 *   MOTIFS                 les 7 motifs d'une demande (contrainte
 *                          `demande_pro_motif_check`)
 *   libelleMotif(motif)    → 'Numéro absent du répertoire Sirene'
 *   motifDeIssue(issue)    → le motif d'une demande ouverte depuis cette issue
 *   messageIssue(issue, details) → { texte, action, secours }
 *       issue   : une issue OU un état de saisie.
 *       texte   : la phrase, ou null pour 'ok' (l'écran montre la carte) et
 *                 'pret' (rien à dire).
 *       action  : null, ou { code, libelle } — UN seul bouton principal.
 *                 code ∈ ACTIONS : reessayer · corriger · completer ·
 *                 utiliser · autre_numero · connexion.
 *       secours : vrai quand la porte « Demander une vérification à la
 *                 main » doit apparaître : introuvable, etablissement_ferme,
 *                 cessee, non_diffusible, deja_utilise, service_indisponible,
 *                 et injoignable après DEUX échecs (`details.echecs >= 2`).
 *                 JAMAIS pour cle, mal_forme, siren, tva, trop_d_essais.
 *       details : ce que la fonction Edge a rendu avec l'issue
 *                 (siret_ouvert, commune_ouverte, date_fermeture,
 *                 reessayer_a, portee, reessayer_dans), ou le résultat
 *                 d'`analyserSaisie` pour un état de saisie ; plus `echecs`,
 *                 le nombre d'échecs `injoignable` d'affilée.
 *   communeLisible('SAINT-REMY-DE-PROVENCE') → 'Saint-Remy-de-Provence'
 *   departementDe(codeInsee, codePostal)     → '13', '2A', '974'
 *
 * Ce qui ne sert qu'à la fonction Edge, et vit ICI pour qu'un contrôle le
 * fasse tourner (`node` n'ouvre pas un fichier TypeScript de Deno) :
 *
 *   LIMITES                              20 par heure et par connexion,
 *                                        100 par heure et par bloc /48,
 *                                        120 par minute pour tout Opus,
 *                                        200 lectures par heure et par
 *                                        connexion, cache compris
 *   debutDeFenetre(instantMs, dureeMs)   → '2026-10-15T14:00:00.000Z'
 *   prefixeIp(ip)                        → l'IPv4, ou le /64 d'une IPv6
 *   blocIpv6(ip)                         → le /48 d'une IPv6, ou null
 *   origineAutorisee(origine)            → la page web peut-elle appeler ?
 *   empreinteIp(secret, ip)              → HMAC-SHA-256 en hexadécimal
 *   secondesAvantReessai(retryAfter, maintenantMs) → secondes, ou null
 */

/* ================================================================== */
/*  1. LA SAISIE                                                       */
/* ================================================================== */

/** Le SIREN de La Poste : ses établissements ne suivent pas la clé de Luhn. */
export const SIREN_LA_POSTE = '356000000';

/** Ne garde que les chiffres : « 912 517 935 00033 », « 912.517.935-00033 ». */
export function chiffresSeuls(texte) {
  return String(texte == null ? '' : texte).replace(/\D/g, '');
}

/** L'algorithme de Luhn, celui du SIREN et du SIRET. */
export function cleDeLuhn(chiffres) {
  let total = 0;
  for (let i = 0; i < chiffres.length; i += 1) {
    let d = Number(chiffres[chiffres.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

/**
 * Un SIRET dont la clé tombe juste.
 *
 * LE PIÈGE DE LA POSTE : ses établissements (SIREN 356000000) ont des
 * numéros qui échouent à la clé de Luhn — la règle de La Poste est que la
 * somme des quatorze chiffres soit un multiple de 5. Son siège, lui, passe
 * la clé ordinaire (mesuré : 35600000000048). Sans cette exception, Opus
 * refuserait un bureau de poste parfaitement immatriculé en l'accusant
 * d'une faute de frappe.
 *
 * Et une suite de zéros passe la clé de Luhn (0 est un multiple de 10) :
 * elle est refusée à part.
 */
export function cleSiretValide(siret) {
  const s = String(siret == null ? '' : siret);
  if (!/^\d{14}$/.test(s) || /^0+$/.test(s)) return false;
  if (cleDeLuhn(s)) return true;
  if (!s.startsWith(SIREN_LA_POSTE)) return false;
  let somme = 0;
  for (const c of s) somme += Number(c);
  return somme % 5 === 0;
}

/** Un SIREN (9 chiffres) dont la clé tombe juste. */
export function cleSirenValide(siren) {
  const s = String(siren == null ? '' : siren);
  return /^\d{9}$/.test(s) && !/^0+$/.test(s) && cleDeLuhn(s);
}

/** « 912 517 935 00033 » : l'écriture qu'on lit sur un avis de situation. */
export function formaterSiret(siret) {
  const s = chiffresSeuls(siret);
  if (s.length !== 14) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
}

/** Les états possibles d'une saisie (voir `analyserSaisie`). */
export const ETATS_SAISIE = Object.freeze(['vide', 'tva', 'trop_long', 'siren', 'incomplet', 'cle', 'pret']);

/**
 * Ce que l'on peut dire d'une saisie AVANT d'appeler le répertoire.
 *
 *   vide       rien de tapé
 *   tva        un numéro de TVA : « FR » + 2 caractères + 9 chiffres, ou
 *              11 chiffres dont les 9 derniers forment un SIREN valide
 *   trop_long  plus de 14 chiffres
 *   siren      9 chiffres dont la clé tombe juste : c'est le SIREN, pas le SIRET
 *   incomplet  moins de 14 chiffres, et ce n'est ni un SIREN ni une TVA
 *   cle        14 chiffres, mais un chiffre est probablement mal tapé
 *   pret       14 chiffres, clé juste : on peut interroger le répertoire
 *
 * Le SIRET rendu est toujours la forme NORMALISÉE (chiffres seuls, sans
 * espaces) : c'est elle, et elle seule, qui part vers le serveur.
 *
 * LA TVA, ET POURQUOI ELLE SE LIT SUR LE TEXTE BRUT
 * -------------------------------------------------
 * « FR29912517935 » collé dans le champ ne garde que ses chiffres :
 * « 29912517935 », onze chiffres. Sans ce cas, l'écran disait « il manque
 * des chiffres » — ce qui pousse à en AJOUTER à un numéro qui n'est pas le
 * bon (mesuré, relecture 4). Le préfixe « FR » se lit donc sur le texte
 * BRUT, avant qu'on ne jette les lettres — et une clé de TVA faite de
 * lettres (« FRXA… ») ne laisse que les neuf chiffres du SIREN : sans ce
 * test, elle passerait pour un SIREN.
 *
 * Et onze chiffres tapés pendant la frappe d'un SIRET tombent une fois sur
 * dix sur un SIREN valide : c'est pourquoi l'écran n'affiche l'état
 * qu'au 14e chiffre ou quand on a fini (voir l'en-tête).
 */
export function analyserSaisie(texte) {
  const brut = String(texte == null ? '' : texte).toUpperCase().replace(/[\s.\-_/]/g, '');
  const s = chiffresSeuls(texte);
  if (/^FR[0-9A-Z]{2}\d{9}$/.test(brut)) {
    return { etat: 'tva', siret: s, siren: brut.slice(4) };
  }
  if (!s) return { etat: 'vide', siret: '' };
  if (s.length > 14) return { etat: 'trop_long', siret: s };
  if (s.length === 9 && cleSirenValide(s)) return { etat: 'siren', siret: s };
  if (s.length === 11 && cleSirenValide(s.slice(2))) {
    return { etat: 'tva', siret: s, siren: s.slice(2) };
  }
  if (s.length < 14) return { etat: 'incomplet', siret: s };
  if (!cleSiretValide(s)) return { etat: 'cle', siret: s };
  return { etat: 'pret', siret: s };
}

/* ================================================================== */
/*  2. CE QUE LE RÉPERTOIRE A RÉPONDU                                  */
/* ================================================================== */

/**
 * Une valeur du répertoire, ou null.
 *
 * L'INSEE MASQUE, IL NE RETIRE PAS. Un établissement en diffusion partielle
 * (statut « P » : son titulaire a exercé son droit d'opposition) arrive
 * avec ses champs remplacés par « [NON-DIFFUSIBLE] » — son adresse, son
 * code postal, ses coordonnées, son nom commercial, ses enseignes (mesuré :
 * 5 établissements sur 363, relecture 3). Ranger ce texte en base, ou
 * l'afficher comme un nom d'entreprise, serait faux deux fois : ce n'est
 * pas une valeur, et c'est précisément ce que la personne a demandé à ne
 * pas voir diffusé.
 *
 *   - une chaîne : sans ses espaces de bord ; vide ou masquée → null ;
 *   - un nombre fini ou un booléen : tel quel ;
 *   - tout le reste (objet, liste, undefined) → null. Une liste n'est pas
 *     une valeur : c'est l'appelant qui choisit son élément.
 */
export function nettoyerValeur(v) {
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t || /NON[-\s]?DIFFUSIBLE|\[ND\]/i.test(t)) return null;
    return t;
  }
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

/** « 2025-12-06T08:16:42 » → « 2025-12-06 », et seulement une date qui existe. */
function dateOuNull(v) {
  const t = nettoyerValeur(v);
  const m = typeof t === 'string' ? t.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (!m) return null;
  const a = Number(m[1]);
  const mo = Number(m[2]);
  const j = Number(m[3]);
  const d = new Date(Date.UTC(a, mo - 1, j));
  /* Le 31/02 ne doit pas partir vers une colonne `date` : la base le
     refuserait, et la preuve entière avec (la leçon du calendrier du
     04/10/2026). */
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Un code d'activité : « 43.99C », « 43.91Y ». Rien d'autre. */
function codeActivite(v) {
  const t = nettoyerValeur(v);
  return typeof t === 'string' && /^\d{2}\.\d{2}[A-Z]$/.test(t.toUpperCase()) ? t.toUpperCase() : null;
}

/** Le premier élément d'une liste, nettoyé — la première enseigne, la TVA. */
function premierDe(liste) {
  if (Array.isArray(liste)) return liste.length ? nettoyerValeur(liste[0]) : null;
  return nettoyerValeur(liste);
}

/**
 * L'IDENTITÉ — ce qui part vers le téléphone, et RIEN d'autre.
 *
 * C'est la liste blanche qui protège la règle la plus importante de ce lot :
 * l'adresse de rue d'un établissement est, pour un entrepreneur individuel,
 * presque toujours son DOMICILE. Elle va dans la preuve (privée, écrite et
 * lue par la fonction Edge seule), jamais dans la réponse. Même chose pour
 * `nom_complet` — pour un EI, c'est le nom et le prénom d'une personne —,
 * les coordonnées GPS (le point de l'ADRESSE, pas le centre de la commune :
 * mesuré) et les dirigeants (des tiers ; exclus dès la requête par
 * `minimal=true`).
 *
 * Une liste qu'on ÉNUMÈRE plutôt qu'une liste qu'on retire : un champ
 * ajouté demain par le répertoire n'arrive pas tout seul sur le téléphone.
 */
export const CHAMPS_IDENTITE = Object.freeze([
  'siret', 'siren', 'denomination', 'sigle', 'nom_commercial', 'est_ei',
  'forme_juridique', 'date_creation', 'tva', 'ape', 'naf25', 'est_siege',
  'commune', 'code_postal', 'code_insee', 'statut_diffusion', 'maj_insee',
]);

/** Ce que la preuve range EN PLUS, et qui ne part jamais vers le téléphone. */
export const CHAMPS_PRIVES = Object.freeze(['adresse', 'nom_complet_registre']);

/** Ne garde d'un objet que les champs de l'identité ; un champ absent vaut null. */
export function identiteDepuis(objet) {
  const o = objet && typeof objet === 'object' ? objet : {};
  const sortie = {};
  for (const k of CHAMPS_IDENTITE) sortie[k] = o[k] === undefined ? null : o[k];
  return sortie;
}

/**
 * Lit la réponse de l'API Recherche d'entreprises pour UN SIRET.
 *
 * LA RÈGLE QUI PORTE TOUT : L'ÉGALITÉ EXACTE
 * ------------------------------------------
 * Une preuve n'existe que si un résultat porte EXACTEMENT ce SIREN, ET si
 * un élément de ses `matching_etablissements` porte EXACTEMENT ce SIRET.
 * Mesuré (relecture 1) : chercher un SIREN rend l'entreprise, son siège…
 * et `matching_etablissements = []`. Prendre `results[0]` et son siège
 * quand la liste est vide écrirait une preuve pour un AUTRE établissement
 * que celui qu'on a tapé. Liste vide, ou sans égalité → `introuvable`.
 *
 * DEUX ÉTATS, ET IL FAUT LES DEUX
 * -------------------------------
 * Mesuré (rapport 1) : le répertoire rend une entreprise ACTIVE même quand
 * l'ÉTABLISSEMENT tapé est fermé — c'est le cas de tout artisan qui a
 * déménagé, puisque le SIRET change avec l'adresse. On regarde donc
 * l'unité légale (« C » → `cessee`), PUIS l'établissement (« F » →
 * `etablissement_ferme`, avec le siège s'il est ouvert et d'un autre SIRET :
 * c'est très probablement le nouveau numéro de la personne).
 *
 * `non_diffusible` ne sort que si l'ÉTAT ADMINISTRATIF lui-même est
 * illisible. Une entreprise totalement non diffusible est ABSENTE de l'API
 * (documentation) : elle tombe en `introuvable`, dont le message nomme
 * cette cause. Et un établissement en diffusion partielle dont l'état se
 * lit donne `ok` : refuser quelqu'un parce qu'il a exercé un droit
 * d'opposition n'aurait aucune raison technique.
 *
 * Une réponse qui n'a pas la FORME attendue (pas de liste `results`) n'est
 * pas une réponse : elle donne `injoignable`, jamais `introuvable` — ce
 * dernier ferait relire son numéro à quelqu'un qui n'y est pour rien.
 */
export function lireReponseRegistre(json, siret) {
  const s = chiffresSeuls(siret);
  const siren = s.slice(0, 9);
  if (!json || typeof json !== 'object' || !Array.isArray(json.results)) {
    return { issue: 'injoignable' };
  }

  let unite = null;
  let etab = null;
  for (const r of json.results) {
    if (!r || typeof r !== 'object' || String(r.siren) !== siren) continue;
    const liste = Array.isArray(r.matching_etablissements) ? r.matching_etablissements : [];
    const trouve = liste.find((e) => e && typeof e === 'object' && String(e.siret) === s);
    if (trouve) { unite = r; etab = trouve; break; }
  }
  if (!unite || s.length !== 14) return { issue: 'introuvable' };

  const etatUnite = nettoyerValeur(unite.etat_administratif);
  if (etatUnite === 'C') {
    return { issue: 'cessee', date_fermeture: dateOuNull(unite.date_fermeture) };
  }
  if (etatUnite !== 'A') return { issue: 'non_diffusible' };

  const etatEtab = nettoyerValeur(etab.etat_administratif);
  if (etatEtab === 'F') {
    const siege = unite.siege && typeof unite.siege === 'object' ? unite.siege : {};
    const siretSiege = String(siege.siret == null ? '' : siege.siret);
    const siegeOuvert = nettoyerValeur(siege.etat_administratif) === 'A'
      && siretSiege !== s
      && siretSiege.startsWith(siren)
      && cleSiretValide(siretSiege);
    return {
      issue: 'etablissement_ferme',
      siret_ouvert: siegeOuvert ? siretSiege : null,
      commune_ouverte: siegeOuvert ? nettoyerValeur(siege.libelle_commune) : null,
    };
  }
  if (etatEtab !== 'A') return { issue: 'non_diffusible' };

  const nature = nettoyerValeur(unite.nature_juridique);
  const natureTexte = nature == null ? '' : String(nature);
  const complements = unite.complements && typeof unite.complements === 'object' ? unite.complements : {};
  const diffusion = nettoyerValeur(etab.statut_diffusion_etablissement);

  return {
    issue: 'ok',
    identite: {
      siret: s,
      siren,
      /* `nom_raison_sociale` : null pour un EI (300 sur 300, mesuré). On ne
         le compose JAMAIS à partir de `nom_complet` dans ce lot. */
      denomination: nettoyerValeur(unite.nom_raison_sociale),
      sigle: nettoyerValeur(unite.sigle),
      /* Le nom commercial de l'ÉTABLISSEMENT tapé, sinon sa première
         enseigne. Jamais celui du siège : un artisan qui a deux
         établissements peut les avoir nommés différemment. */
      nom_commercial: nettoyerValeur(etab.nom_commercial) ?? premierDe(etab.liste_enseignes),
      est_ei: natureTexte === '1000' || complements.est_entrepreneur_individuel === true,
      forme_juridique: /^\d{4}$/.test(natureTexte) ? natureTexte : null,
      /* La date de l'ENTREPRISE, pas celle de l'établissement : « créée en
         2022 » parle de l'entreprise, et un déménagement ne la rajeunit pas. */
      date_creation: dateOuNull(unite.date_creation),
      tva: premierDe(unite.tva),
      ape: codeActivite(unite.activite_principale) ?? codeActivite(etab.activite_principale),
      naf25: codeActivite(unite.activite_principale_naf25)
        ?? codeActivite(etab.activite_principale_naf25),
      est_siege: typeof etab.est_siege === 'boolean' ? etab.est_siege : null,
      commune: nettoyerValeur(etab.libelle_commune),
      code_postal: nettoyerValeur(etab.code_postal),
      code_insee: nettoyerValeur(etab.commune),
      statut_diffusion: diffusion === 'O' || diffusion === 'P' ? diffusion : null,
      maj_insee: dateOuNull(unite.date_mise_a_jour_insee),
    },
    prive: {
      adresse: nettoyerValeur(etab.adresse),
      nom_complet_registre: nettoyerValeur(unite.nom_complet),
    },
  };
}

/** Les issues que la fonction Edge peut rendre — toutes en HTTP 200. */
export const ISSUES_SERVEUR = Object.freeze([
  'mal_forme', 'deja_utilise', 'trop_d_essais', 'injoignable', 'introuvable',
  'etablissement_ferme', 'cessee', 'non_diffusible', 'ok',
]);

/**
 * Toutes les issues, celles que l'APPLICATION fabrique comprises :
 *
 *   reseau                le téléphone n'a pas pu joindre la fonction
 *   service_indisponible  la fonction a répondu, mais pas en 2xx : une panne
 *   lent                  aucune réponse au bout de 15 s
 *
 * Ces trois-là ne viennent jamais du serveur : un serveur qui ne répond
 * pas ne peut pas le dire lui-même.
 */
export const ISSUES = Object.freeze([...ISSUES_SERVEUR, 'reseau', 'service_indisponible', 'lent']);

/** Les détails qu'une issue a le DROIT d'emporter vers le téléphone. */
const DETAILS_PUBLICS = {
  etablissement_ferme: ['siret_ouvert', 'commune_ouverte'],
  cessee: ['date_fermeture'],
  trop_d_essais: ['reessayer_a', 'portee'],
  injoignable: ['reessayer_dans'],
};

/**
 * Ce que la fonction Edge RENVOIE — la seule porte de sortie.
 *
 * Toute réponse passe par ici, et rien d'autre ne sort : l'identité par
 * sa liste blanche, les autres issues avec leurs seuls détails prévus.
 * C'est ce qui garantit que `deja_utilise` ne dit RIEN du compte qui tient
 * le numéro — ni nom, ni ville, ni date (relecture 3) : pour un EI, le
 * SIREN désigne une personne.
 *
 * Une issue inconnue LÈVE : c'est une faute de programmation, et elle doit
 * devenir une panne visible (HTTP 500), pas une réponse inventée.
 */
export function reponsePublique(resultat) {
  const issue = resultat && resultat.issue;
  if (!ISSUES_SERVEUR.includes(issue)) {
    throw new Error(`Issue inconnue : ${String(issue)}`);
  }
  if (issue === 'ok') return { issue, identite: identiteDepuis(resultat.identite) };
  const sortie = { issue };
  for (const k of DETAILS_PUBLICS[issue] || []) {
    if (resultat[k] !== undefined) sortie[k] = resultat[k];
  }
  return sortie;
}

/** Une preuve vaut 24 heures : de quoi remplir le formulaire et créer le compte. */
export const DUREE_PREUVE_MS = 24 * 60 * 60 * 1000;

/**
 * La ligne de `preuves_siret` tirée d'une réponse `ok`.
 *
 * `siren` n'y est PAS, et il ne doit pas y être : c'est une colonne
 * ENGENDRÉE par la base (`left(siret, 9)`). L'écrire ferait échouer
 * l'insertion, donc la preuve, donc l'inscription — après un « ok » déjà
 * annoncé à l'écran.
 *
 * Et `verifiee_le` est écrite à la main : sur une preuve qui existe déjà,
 * l'`upsert` est une mise à jour, et la valeur par défaut de la colonne ne
 * s'applique qu'à une insertion — la preuve garderait sa date d'hier.
 */
export function ligneDePreuve(resultat, instantMs) {
  if (!resultat || resultat.issue !== 'ok') return null;
  const { siren: _siren, ...identite } = identiteDepuis(resultat.identite);
  const prive = resultat.prive && typeof resultat.prive === 'object' ? resultat.prive : {};
  const ligne = { ...identite };
  for (const k of CHAMPS_PRIVES) ligne[k] = prive[k] === undefined ? null : prive[k];
  ligne.source = 'registre';
  ligne.verifiee_le = new Date(instantMs).toISOString();
  ligne.expire_le = new Date(instantMs + DUREE_PREUVE_MS).toISOString();
  return ligne;
}

/* ================================================================== */
/*  3. CE QUE L'ÉCRAN DIT                                              */
/* ================================================================== */

/** Les motifs d'une demande de compte professionnel faite à la main. */
export const MOTIFS = Object.freeze([
  'introuvable', 'etablissement_ferme', 'cessee', 'non_diffusible',
  'deja_utilise', 'injoignable', 'autre',
]);

const LIBELLES_MOTIFS = {
  introuvable: 'Numéro absent du répertoire Sirene',
  etablissement_ferme: 'Établissement fermé au répertoire Sirene',
  cessee: 'Entreprise cessée selon le répertoire Sirene',
  non_diffusible: 'Entreprise non publiée par l’INSEE',
  deja_utilise: 'Entreprise déjà rattachée à un autre compte',
  injoignable: 'Répertoire injoignable au moment de la demande',
  autre: 'Autre raison',
};

/**
 * Le motif en clair, pour la carte de l'administration.
 *
 * Un motif INCONNU s'affiche quand même, sous son code : une application
 * pas encore mise à jour doit montrer ce qui est arrivé, pas une ligne
 * vide (la leçon de `libelleAction` du journal de l'agent).
 */
export function libelleMotif(motif) {
  if (Object.prototype.hasOwnProperty.call(LIBELLES_MOTIFS, motif)) return LIBELLES_MOTIFS[motif];
  const brut = String(motif == null ? '' : motif).trim();
  return brut ? `Motif « ${brut} »` : 'Motif non précisé';
}

/**
 * Le motif d'une demande ouverte depuis une issue. Une panne d'Opus
 * (`service_indisponible`) ressemble, pour l'administration, à un
 * répertoire qu'on n'a pas pu joindre : le geste est le même, interroger
 * à nouveau.
 */
export function motifDeIssue(issue) {
  if (MOTIFS.includes(issue)) return issue;
  if (issue === 'service_indisponible') return 'injoignable';
  return 'autre';
}

/** Les boutons principaux qu'un message peut proposer. */
export const ACTIONS = Object.freeze({
  reessayer: 'Réessayer',
  corriger: 'Corriger le numéro',
  completer: 'Compléter le numéro',
  utiliser: 'Utiliser ce numéro',
  autre_numero: 'Taper un autre numéro',
  connexion: 'Se connecter',
});

const action = (code) => ({ code, libelle: ACTIONS[code] });

/** Les mots qui restent en minuscules au milieu d'un nom de commune. */
const PARTICULES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'en', 'sur', 'sous', 'lès', 'lez',
  'aux', 'au', 'et', 'arrondissement',
]);

/**
 * « SAINT-REMY-DE-PROVENCE » → « Saint-Remy-de-Provence ».
 *
 * Le répertoire écrit les communes EN CAPITALES. Recopiées telles quelles
 * dans une phrase, elles crient ; mises en minuscules d'un bloc, elles
 * perdent leurs majuscules. Un nom déjà écrit en casse mixte n'est pas
 * retouché : quelqu'un l'a écrit ainsi exprès.
 *
 * Les accents perdus par le répertoire ne reviennent pas : on ne devine
 * pas « Rémy » à partir de « REMY ».
 */
export function communeLisible(libelle) {
  const t = nettoyerValeur(libelle);
  if (typeof t !== 'string') return null;
  if (t !== t.toUpperCase()) return t;
  let premier = true;
  return t.toLowerCase().split(/([\s-]+)/).map((morceau) => {
    if (!morceau || /^[\s-]+$/.test(morceau)) return morceau;
    const estPremier = premier;
    premier = false;
    /* « D'ASCQ », « L'ISLE » : la particule élidée, puis le nom. */
    const elision = morceau.match(/^([dl])['’](.+)$/);
    if (elision) {
      const particule = estPremier ? elision[1].toUpperCase() : elision[1];
      return `${particule}'${elision[2].charAt(0).toUpperCase()}${elision[2].slice(1)}`;
    }
    if (!estPremier && PARTICULES.has(morceau)) return morceau;
    return morceau.charAt(0).toUpperCase() + morceau.slice(1);
  }).join('');
}

/**
 * Le département, pour « Établissement de Mallemort (13) ».
 *
 * Il se lit dans le code INSEE de la commune — deux caractères, TROIS en
 * outre-mer (974, La Réunion), et « 2A » / « 2B » en Corse, ce que le code
 * postal (20xxx) ne dit pas. Le code postal ne sert qu'à défaut — et il est
 * masqué pour un établissement en diffusion partielle.
 */
export function departementDe(codeInsee, codePostal) {
  const i = String(nettoyerValeur(codeInsee) ?? '').toUpperCase();
  if (/^9[78]\d{3}$/.test(i)) return i.slice(0, 3);
  if (/^2[AB]\d{3}$/.test(i)) return i.slice(0, 2);
  if (/^\d{5}$/.test(i)) return i.slice(0, 2);
  const p = String(nettoyerValeur(codePostal) ?? '');
  if (/^9[78]\d{3}$/.test(p)) return p.slice(0, 3);
  /* 20xxx : la Corse, sans dire laquelle des deux. On se tait plutôt que
     d'écrire un département faux. */
  if (/^\d{5}$/.test(p) && !p.startsWith('20')) return p.slice(0, 2);
  return null;
}

/** « 2026-03-14 » → « 14/03/2026 ». */
function dateFrancaise(iso) {
  const d = dateOuNull(iso);
  return d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : null;
}

/** Une heure locale du téléphone : « 14 h 32 », « 15 h ». */
function heureFrancaise(iso) {
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const m = d.getMinutes();
  return m === 0 ? `${d.getHours()} h` : `${d.getHours()} h ${String(m).padStart(2, '0')}`;
}

/**
 * Le message d'une issue ou d'un état de saisie : { texte, action, secours }.
 *
 * TROIS FAMILLES, ET ELLES NE SE CONFONDENT PAS
 * ---------------------------------------------
 *   - AVANT le répertoire : la saisie. On aide à corriger, sans porte de
 *     secours — une faute de frappe ne se règle pas par un humain.
 *   - le service n'a PAS répondu : on n'accuse JAMAIS le numéro. Un artisan
 *     dans une cave, sans réseau, qui lit « numéro introuvable », recommence
 *     dix fois un numéro juste.
 *   - le répertoire a répondu : on dit ce qu'il a dit, et la porte de
 *     secours est là pour le cas où il se trompe ou ne publie pas.
 *
 * UN seul bouton principal par message (`action`). La porte de secours est
 * à part (`secours`), et c'est l'écran qui l'affiche en bouton secondaire.
 */
export function messageIssue(issue, details) {
  const d = details && typeof details === 'object' ? details : {};
  const n = chiffresSeuls(d.siret).length;
  const echecs = Number(d.echecs) || 0;

  switch (issue) {
    /* --- AVANT LE RÉPERTOIRE --------------------------------------- */
    case 'vide':
      return {
        texte: 'Tapez le numéro SIRET de votre entreprise : 14 chiffres. Vous le trouvez sur '
          + 'votre avis de situation INSEE ou votre attestation URSSAF.',
        action: null,
        secours: false,
      };
    case 'incomplet':
      return {
        texte: `Il manque des chiffres : vous en avez tapé ${n}, un SIRET en a 14.`,
        action: null,
        secours: false,
      };
    case 'trop_long':
      return {
        texte: `Il y a ${n} chiffres, un SIRET en a 14. Regardez si un autre numéro `
          + 'ne s’est pas collé avec.',
        action: action('corriger'),
        secours: false,
      };
    case 'siren':
      return {
        texte: 'Ces 9 chiffres sont votre SIREN, le numéro de l’entreprise. Opus a besoin du '
          + 'SIRET : les mêmes 9 chiffres, suivis de 5 autres. Il est écrit sur votre avis de '
          + 'situation INSEE.',
        action: action('completer'),
        secours: false,
      };
    case 'tva': {
      const siren = chiffresSeuls(d.siren);
      const debut = siren.length === 9
        ? `il commence par ${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6)}, `
          + 'les 9 derniers chiffres de ce numéro.'
        : 'il commence par les 9 derniers chiffres de ce numéro.';
      return {
        texte: `Ceci est votre numéro de TVA. Opus a besoin du SIRET, 14 chiffres : ${debut}`,
        action: action('corriger'),
        secours: false,
      };
    }
    case 'cle':
    case 'mal_forme':
      return {
        texte: 'Un chiffre est sans doute mal tapé : ce numéro ne peut pas être un SIRET. '
          + 'Relisez-le chiffre par chiffre.',
        action: action('corriger'),
        secours: false,
      };
    case 'pret':
    case 'ok':
      /* 'pret' : rien à dire, on peut interroger. 'ok' : l'écran montre la
         carte « Est-ce bien votre entreprise ? », pas une phrase. */
      return { texte: null, action: null, secours: false };

    /* --- LE SERVICE N'A PAS RÉPONDU : on n'accuse jamais le numéro --- */
    case 'reseau':
      return {
        texte: 'Pas de connexion : la demande n’est pas partie. Votre numéro n’est pas en '
          + 'cause. Retrouvez du réseau, puis réessayez.',
        action: action('reessayer'),
        secours: false,
      };
    case 'service_indisponible':
      return {
        texte: 'Opus n’arrive pas à consulter le répertoire des entreprises pour l’instant. '
          + 'Votre numéro n’est pas en cause. Réessayez dans quelques minutes.',
        action: action('reessayer'),
        secours: true,
      };
    case 'lent':
      return {
        texte: 'Le répertoire des entreprises met trop de temps à répondre. Votre numéro '
          + 'n’est pas en cause. Réessayez dans un instant.',
        action: action('reessayer'),
        secours: false,
      };
    case 'injoignable': {
      const s = Number(d.reessayer_dans);
      const quand = Number.isFinite(s) && s > 0
        ? (s <= 60 ? 'dans une minute' : `dans ${Math.ceil(s / 60)} minutes`)
        : 'dans quelques minutes';
      return {
        texte: 'Le répertoire des entreprises ne répond pas en ce moment. Votre numéro n’est '
          + `pas en cause : c’est le service public qui est indisponible. Réessayez ${quand}.`,
        action: action('reessayer'),
        /* La porte n'apparaît qu'après DEUX échecs : une panne de quelques
           secondes ne doit pas pousser vers une demande à la main, qui
           attendrait un humain pendant des jours. */
        secours: echecs >= 2,
      };
    }
    case 'trop_d_essais': {
      const heure = heureFrancaise(d.reessayer_a);
      /* Deux limites, et la phrase doit dire LAQUELLE : « cette connexion »
         serait faux quand c'est tout Opus qui reçoit trop de demandes. Et
         jamais « vous » : une adresse IP est souvent partagée (relecture 4). */
      const pourquoi = d.portee === 'service'
        ? 'Opus reçoit trop de demandes à la fois en ce moment.'
        : 'Trop de demandes sont parties de cette connexion depuis une heure.';
      const quand = heure
        ? `Vous pourrez réessayer à ${heure}.`
        : (d.portee === 'service' ? 'Réessayez dans une minute.' : 'Réessayez dans une heure.');
      return {
        texte: `${pourquoi} Votre numéro n’est pas en cause. ${quand}`,
        action: null,
        secours: false,
      };
    }

    /* --- LE RÉPERTOIRE A RÉPONDU ----------------------------------- */
    case 'introuvable':
      return {
        texte: 'Ce numéro n’est pas dans le répertoire public des entreprises. Trois raisons '
          + 'possibles : un chiffre inversé, une entreprise créée il y a quelques jours, ou une '
          + 'entreprise qui a demandé à l’INSEE de ne pas publier ses informations. Relisez le '
          + 'numéro ; s’il est juste, demandez une vérification à la main.',
        action: action('corriger'),
        secours: true,
      };
    case 'etablissement_ferme': {
      const ouvert = chiffresSeuls(d.siret_ouvert);
      if (ouvert.length === 14) {
        const commune = communeLisible(d.commune_ouverte);
        return {
          texte: 'Ce SIRET est celui d’un ancien établissement de votre entreprise, aujourd’hui '
            + 'fermé — c’est ce qui arrive après un déménagement. Votre entreprise est active, '
            + `avec ce numéro : ${formaterSiret(ouvert)}${commune ? ` (${commune})` : ''}. `
            + 'C’est le vôtre ?',
          action: action('utiliser'),
          secours: true,
        };
      }
      return {
        texte: 'Ce SIRET correspond à un établissement fermé, et le répertoire n’indique pas '
          + 'd’autre établissement ouvert pour cette entreprise. Si vous avez déménagé, votre '
          + 'SIRET a changé : le nouveau est sur votre dernier avis de situation.',
        action: action('corriger'),
        secours: true,
      };
    }
    case 'cessee': {
      const le = dateFrancaise(d.date_fermeture);
      return {
        texte: 'Le répertoire Sirene indique que cette entreprise a cessé son activité'
          + `${le ? ` le ${le}` : ''}. Opus n’ouvre un compte professionnel qu’à une entreprise `
          + 'en activité. Vous avez créé une nouvelle entreprise ? Tapez son SIRET.',
        action: action('autre_numero'),
        secours: true,
      };
    }
    case 'non_diffusible':
      return {
        texte: 'Le répertoire ne publie pas l’état de cette entreprise : c’est le cas quand elle '
          + 'a demandé à l’INSEE de ne pas diffuser ses informations, ce qui est son droit. Opus '
          + 'ne peut donc pas la contrôler tout seul. Demandez une vérification à la main : vous '
          + 'enverrez un justificatif, que seul Opus verra.',
        action: null,
        secours: true,
      };
    case 'deja_utilise':
      /* On ne révèle RIEN du compte qui tient le numéro : ni nom, ni ville,
         ni date. Pour un EI, le SIREN désigne une personne. */
      return {
        texte: 'Cette entreprise a déjà un compte professionnel sur Opus. Si c’est le vôtre, '
          + 'connectez-vous. Si ce n’est pas vous, ou si vous n’y avez plus accès, demandez une '
          + 'vérification à la main : Opus examinera qui est le titulaire.',
        action: action('connexion'),
        secours: true,
      };

    default:
      /* Une issue que cette version ne connaît pas (un serveur plus récent).
         On le DIT, au lieu d'afficher un trou ou un « ok » inventé. */
      return {
        texte: 'Opus n’a pas compris la réponse reçue. Votre numéro n’est sans doute pas en '
          + 'cause. Réessayez ; si cela se reproduit, demandez une vérification à la main.',
        action: action('reessayer'),
        secours: true,
      };
  }
}

/* ================================================================== */
/*  4. CE QUI NE SERT QU'À LA FONCTION EDGE                            */
/*                                                                     */
/*  Ces calculs vivent ICI parce qu'un contrôle doit pouvoir les FAIRE */
/*  TOURNER, et que `node` n'ouvre pas un fichier TypeScript de Deno.  */
/*  L'application les embarque sans jamais les appeler : ils ne        */
/*  contiennent aucun secret (la clé arrive en paramètre).             */
/* ================================================================== */

/**
 * Les limites d'appels.
 *
 *   - 20 par HEURE et par connexion : un artisan qui se trompe trois fois
 *     de numéro est loin du compte ; un script qui essaie des SIRET en
 *     boucle, non ;
 *   - 100 par HEURE et par BLOC /48 d'IPv6 — 15/10/2026, relecture
 *     adverse. Le /64 compte par abonné ; mais un /48 se distribue
 *     gratuitement (tunnels, hébergeurs), et il contient 65 536 /64, donc
 *     65 536 compteurs de 20. Sans ce second seau, une seule personne
 *     épuisait la limite de tout Opus, et fermait l'inscription pro à tous
 *     les vrais artisans pendant toute la durée de l'attaque. Une IPv4 n'a
 *     pas de bloc : une adresse coûte, et une box partagée ne doit pas
 *     bloquer ses voisins ;
 *   - 120 par MINUTE pour tout Opus : le répertoire limite à environ 7
 *     appels par seconde et par adresse sortante, partagée avec les autres
 *     projets de l'hébergeur. Le faire tomber fermerait TOUTES les
 *     inscriptions professionnelles, puisque `injoignable` les bloque.
 *
 * Seuls les appels qui partent VRAIMENT vers le répertoire comptent dans
 * ces trois-là : une réponse sortie du cache ne coûte rien à personne
 * (relecture 4).
 *
 *   - 200 LECTURES par heure et par connexion, cache et « déjà utilisé »
 *     compris — 15/10/2026, relecture adverse. Sans elle, la question « ce
 *     SIREN a-t-il un compte sur Opus ? » se posait sans fin et sans
 *     compte ; or pour un entrepreneur individuel le SIREN désigne une
 *     personne. Le seau est large exprès : il ne ferme jamais une
 *     inscription, il borne seulement l'énumération.
 */
export const LIMITES = Object.freeze({
  ip: Object.freeze({ max: 20, duree_ms: 60 * 60 * 1000 }),
  bloc: Object.freeze({ max: 100, duree_ms: 60 * 60 * 1000 }),
  global: Object.freeze({ max: 120, duree_ms: 60 * 1000 }),
  lecture: Object.freeze({ max: 200, duree_ms: 60 * 60 * 1000 }),
});

/** Le début de la fenêtre qui contient cet instant : l'heure, ou la minute, pile. */
export function debutDeFenetre(instantMs, dureeMs) {
  return new Date(Math.floor(instantMs / dureeMs) * dureeMs).toISOString();
}

/** « 192.0.2.1 » normalisée, ou null si ce n'est pas une IPv4. */
function ipv4(texte) {
  const o = String(texte).split('.');
  if (o.length !== 4 || o.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return o.map(Number).join('.');
}

/** Les huit groupes de 16 bits d'une IPv6, ou null si ce n'en est pas une. */
function groupesIpv6(texte) {
  const morceaux = texte.split('::');
  if (morceaux.length > 2) return null;
  const compresse = morceaux.length === 2;
  const lire = (partie) => (partie ? partie.split(':') : []);
  let gauche = lire(morceaux[0]);
  let droite = compresse ? lire(morceaux[1]) : [];
  /* Une IPv4 écrite à la fin (« ::ffff:192.0.2.1 ») vaut deux groupes. */
  const cote = compresse ? droite : gauche;
  const dernier = cote.length ? cote[cote.length - 1] : '';
  if (dernier.includes('.')) {
    const v4 = ipv4(dernier);
    if (!v4) return null;
    const o = v4.split('.').map(Number);
    const deux = [((o[0] << 8) | o[1]).toString(16), ((o[2] << 8) | o[3]).toString(16)];
    if (compresse) droite = [...droite.slice(0, -1), ...deux];
    else gauche = [...gauche.slice(0, -1), ...deux];
  }
  const manquants = 8 - gauche.length - droite.length;
  if (compresse ? manquants < 1 : manquants !== 0) return null;
  const groupes = [...gauche, ...Array(compresse ? manquants : 0).fill('0'), ...droite];
  if (groupes.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groupes.map((g) => parseInt(g, 16));
}

/**
 * Ce qu'on compte, pour une adresse IP : l'IPv4 entière, ou le /64 d'une IPv6.
 *
 * POURQUOI LE /64 : un abonné IPv6 reçoit un bloc /64 entier, c'est-à-dire
 * 2^64 adresses qu'il peut changer à volonté. Compter par adresse ne
 * limiterait rien ; compter par /64 compte par abonné.
 *
 * Une IPv4 « mappée » (::ffff:192.0.2.1) est la MÊME connexion que
 * 192.0.2.1 : elle est ramenée à son IPv4, sinon un même client aurait
 * deux compteurs.
 *
 * Rend null pour tout ce qui n'est pas une adresse : la fonction Edge
 * répond alors `injoignable` plutôt que de compter sous une clé vide,
 * partagée par tous ceux dont l'adresse manque.
 */
export function prefixeIp(ip) {
  let t = String(ip == null ? '' : ip).trim().toLowerCase();
  if (!t) return null;
  if (!t.includes(':')) return ipv4(t);
  t = t.replace(/^\[/, '').replace(/\]$/, '').replace(/%.*$/, '');
  if (!/^[0-9a-f:.]+$/.test(t)) return null;
  const g = groupesIpv6(t);
  if (!g) return null;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255].join('.');
  }
  return `${g.slice(0, 4).map((x) => x.toString(16)).join(':')}::/64`;
}

/**
 * Le BLOC /48 d'une IPv6, ou null pour une IPv4 (une IPv4 « mappée »
 * comprise) et pour ce qui n'est pas une adresse.
 *
 * C'est le second seau (voir LIMITES) : un /48 se distribue gratuitement,
 * et il contient 65 536 abonnés /64 — autant de compteurs, pour une seule
 * personne, sans lui.
 */
export function blocIpv6(ip) {
  const p = prefixeIp(ip);
  if (!p || !p.endsWith('::/64')) return null;
  return `${p.split(':').slice(0, 3).join(':')}::/48`;
}

/**
 * Les pages web qui ont le droit d'appeler la fonction depuis un
 * navigateur — 15/10/2026, relecture adverse.
 *
 * `Access-Control-Allow-Origin: *` laissait n'importe quelle page faire
 * envoyer des vérifications par le navigateur de ses visiteurs, chacun avec
 * sa propre adresse IP : autant de compteurs neufs, et la limite de tout
 * Opus épuisée sans que personne ne le sache. Et CORS seul n'y suffit
 * pas : une requête « simple » (un POST en text/plain) part SANS
 * vérification préalable, le navigateur ne fait que cacher la réponse. La
 * fonction refuse donc elle-même, avant tout travail, une origine qu'elle
 * ne connaît pas.
 *
 * L'application installée sur un téléphone n'envoie PAS d'en-tête Origin
 * (ce n'est pas un navigateur) : elle passe. Le serveur Expo de
 * développement tourne sur `localhost` — c'est par lui que l'application
 * est essayée au navigateur.
 */
export const ORIGINES_AUTORISEES = Object.freeze([
  'https://opus-project.com',
  'https://www.opus-project.com',
]);

export function origineAutorisee(origine) {
  if (origine == null || origine === '') return true;
  const o = String(origine).trim().toLowerCase();
  if (ORIGINES_AUTORISEES.includes(o)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(o);
}

/**
 * L'empreinte d'une adresse : HMAC-SHA-256, en hexadécimal.
 *
 * HMAC, et pas SHA-256(ip + secret) : c'est la construction faite pour
 * ça (relecture 3). Et un SHA-256 sans secret ne protégerait rien : il n'y
 * a que 4 milliards d'IPv4, on les recalcule toutes en quelques minutes.
 *
 * La clé est passée en paramètre — la fonction Edge donne la clé de
 * service, qui ne quitte jamais le serveur. Cette fonction n'est jamais
 * appelée par l'application (et le téléphone n'aurait pas `crypto.subtle`).
 */
export async function empreinteIp(secret, ip) {
  const sousTle = globalThis.crypto && globalThis.crypto.subtle;
  if (!sousTle) throw new Error('crypto.subtle est absent : empreinte impossible.');
  if (!secret) throw new Error('Empreinte sans secret : refusée.');
  const encodeur = new globalThis.TextEncoder();
  const cle = await sousTle.importKey(
    'raw', encodeur.encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await sousTle.sign('HMAC', cle, encodeur.encode(String(ip)));
  return Array.from(new Uint8Array(signature), (o) => o.toString(16).padStart(2, '0')).join('');
}

/**
 * L'en-tête Retry-After, en secondes : « 120 » ou une date HTTP.
 *
 * Plafonné à un jour : une valeur absurde ne doit pas afficher « réessayez
 * dans 3 000 minutes ». Rend null quand il n'y a rien d'utilisable — le
 * message dit alors « dans quelques minutes ».
 */
export function secondesAvantReessai(valeur, maintenantMs = Date.now()) {
  const t = String(valeur == null ? '' : valeur).trim();
  if (!t) return null;
  let s = null;
  if (/^\d+$/.test(t)) s = Number(t);
  else if (/^[A-Za-z]{3}/.test(t)) {
    /* Une date HTTP commence par le jour (« Wed, 21 Oct 2026 07:28:00
       GMT »). Sans ce garde, `Date.parse('-5')` rend une date de l'an -5,
       et un en-tête absurde deviendrait « réessayez maintenant ». */
    const date = Date.parse(t);
    if (Number.isFinite(date)) s = Math.max(0, Math.ceil((date - maintenantMs) / 1000));
  }
  if (s == null || !Number.isFinite(s)) return null;
  return Math.min(s, 24 * 60 * 60);
}
