/**
 * LES ESSAIS SQL, JOUÉS TOUT SEULS — étape 2c-E (26/11/2026).
 *
 *   npm run essais-sql                         tout, sur une grappe neuve
 *   npm run essais-sql -- essais-section-49 …  seulement ceux-là (il le dit)
 *   npm run essais-sql -- --sorties <dossier>  garder les sorties brutes là
 *   npm run essais-sql -- --figer <nom> …      réécrire l'oracle de ces essais
 *   npm run essais-sql -- --figer --oracle     tout refiger, quand L'ORACLE change
 *   npm run essais-sql -- --comme-github       rejouer depuis un clone propre de HEAD
 *
 * POURQUOI IL MANQUAIT
 * --------------------
 * Les fichiers `supabase/essais-*.sql` ne tournaient qu'à la main, et on les
 * jugeait en comparant leur sortie à « un relevé d'avant » que personne ne
 * gardait. `npm run verifier` ne joue aucun SQL. Ce que ça a coûté, écrit
 * dans CLAUDE.md : la garde de 49.6 ter neutralisée laissait l'essai à 2
 * erreurs au lieu de 4, sans un seul « f » ; sept fichiers d'essais cassés
 * pendant DEUX JOURS par un verrou d'une autre section, sans que rien ne
 * rougisse. Et à partir de 2c-3, un devis remis est FIGÉ : une régression de
 * la base y deviendrait définitive.
 *
 * CE QU'IL FAIT, DANS L'ORDRE
 * ---------------------------
 *  1. la LISTE FERMÉE (plus bas) est comparée à ce qui existe sur le disque :
 *     un essai ajouté demain qui n'est rangé nulle part fait rougir ;
 *  2. il crée SA grappe PostgreSQL 16 (`initdb` dans un dossier temporaire,
 *     une socket privée, aucun port TCP, aucun mot de passe), et la détruit à
 *     la fin, même sur une interruption. Une grappe PARTAGÉE garde les rôles
 *     et leurs attributs d'un passage à l'autre : mesuré par la critique du
 *     cahier, un prélude qui perdait `bypassrls` donnait 0 rouge sur la
 *     grappe du conteneur et 5 sur une grappe neuve. C'est aussi ce qui fait
 *     que GitHub joue EXACTEMENT ce que joue le conteneur de travail ;
 *  3. une base MODÈLE : le prélude, sa SONDE (un prélude qui accorde moins
 *     que la production fait passer des essais de sécurité pour la mauvaise
 *     raison — le défaut du 07/10), `schema.sql` deux fois ;
 *  4. chaque essai, l'un après l'autre, sur un clone neuf du modèle, jugé par
 *     son ORACLE (`supabase/essais-attendus/<essai>.txt`, engendré par
 *     `--figer`, jamais écrit à la main) ;
 *  5. le rattrapage du lot T, sur la base que la vraie base avait reçue ;
 *  6. la famille D, « deux sessions » (la concurrence, la requête tardive, le
 *     plafond par demande), que l'en-tête de l'essai 49 décrit ;
 *  7. la parité de `cas-remise.json` (`generer-cas-remise --verifier`).
 *
 * CE QUE VEUT DIRE SON CODE DE SORTIE
 * -----------------------------------
 *   0  tout ce qui a été joué rend ce qu'il rendait ;
 *   1  un essai ne le rend plus, ou la liste, le prélude, le schéma ;
 *   2  les essais n'ont pas pu se jouer (pas de PostgreSQL 16, clone
 *      superficiel, mauvais réglage) : c'est la machine qu'on corrige.
 *
 * Il n'est PAS dans `npm run verifier` (son nom ne commence pas par
 * `verifier-`) : celui-ci doit passer partout, y compris sans base.
 * `verifier-atelier` lit la liste fermée exportée ici, sans rien lancer.
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  chownSync, closeSync, existsSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = fileURLToPath(import.meta.url);
const RACINE = join(dirname(ICI), '..');

/* La VERSION de l'oracle (critique M3). Elle est écrite dans chaque fichier
   d'attendus. Le jour où la façon de juger change (la normalisation, la
   signature d'une erreur), TOUS les attendus deviennent faux à la fois, et
   rien ne le dirait : on monte ce nombre, et `--figer --oracle` les refige
   d'un coup EN REFUSANT si le sens d'un seul a changé. */
export const ORACLE = 1;
export const DOSSIER_ATTENDUS = 'supabase/essais-attendus';

/* ==========================================================================
   LA LISTE FERMÉE — chaque fichier `supabase/essais-*.sql` est ICI, ou dans
   HORS_LISTE avec sa raison. `verifier-atelier` (donc `npm run verifier`,
   sans base) rougit sinon, et ce script aussi.

   Les champs d'une entrée :
     audit     l'essai écrit « (attendu : ERROR … / UPDATE 0 …) » dans ses
               titres : chaque annonce est revérifiée à chaque passage (M5) ;
     annonce   l'essai écrit lui-même son compte d'erreurs (« FIN — 79 refus
               attendus ») : le compte vu doit égaler le compte LU dans le
               fichier, à chaque passage (M5) ;
     exceptions  une colonne `…_attendu_…` dont le suffixe ne suit pas la
               convention, avec sa valeur exacte ;
     libres    une colonne qui n'est pas un verdict mais un « 1 qui rend le 0
               crédible » : jugée par une règle, masquée dans la sortie figée ;
     procedure l'essai ne se joue pas d'un seul `psql -f`.
   ========================================================================== */
export const ESSAIS = [
  { nom: 'essais-section-25', raison: 'le back-office : les deux files, le badge qui ne se décerne pas soi-même, le journal' },
  { nom: 'essais-section-27', raison: 'le référentiel côté administration : accepter une demande applique VRAIMENT les métiers' },
  { nom: 'essais-section-28', raison: 'les pièces jointes : lisibles des deux seules personnes de la conversation' },
  { nom: 'essais-section-29', raison: 'la Place des pros : le compteur public, le détail des réponses privé' },
  { nom: 'essais-section-31', raison: 'un compte d’artisan ne se crée plus à moitié ; le badge ne se décerne pas à la création' },
  { nom: 'essais-section-32', raison: 'le lieu d’une publication, hérité de la fiche quand l’application n’a pas pu le placer' },
  { nom: 'essais-section-33', raison: 'le fil filtré, tenu par la base, sans contourner le blocage' },
  { nom: 'essais-section-34', raison: '« c’est un conseil » : une étiquette, la signature de fil_filtre inchangée' },
  { nom: 'essais-section-35', raison: 'les vues : l’artisan voit combien, jamais qui' },
  { nom: 'essais-section-36', raison: 'le chantier : le verrou du texte laisse passer chantier_id, et rien d’autre' },
  { nom: 'essais-section-37', raison: 'la cloche : une notification mène à sa cible' },
  { nom: 'essais-section-38', raison: 'le journal de l’IA : la limite, et le revoke à TROIS rôles (le défaut du 07/10)' },
  { nom: 'essais-section-39', raison: 'le récit d’un chantier : la date posée par la base' },
  { nom: 'essais-section-40', raison: 'le nom de l’agent : un nom, pas une permission ; le compteur ne redescend pas' },
  { nom: 'essais-section-41', raison: 'le carnet de clients : privé, nettoyé par la base' },
  {
    nom: 'essais-section-43',
    raison: 'les portes : aucune fonction de déclencheur appelable, et les écritures passent encore',
    /* Le cas 2 COMPTE les fonctions de déclencheur (« il y en a bien, sinon
       l'essai 1 ne prouve rien ») : ce nombre monte à chaque déclencheur
       ajouté au schéma (56 → 60 en quatre lots, mesuré). Figé, il ferait
       rougir l'essai à chaque lot pour une raison qui n'en est pas une. */
    libres: { fonctions_de_declencheur: { regle: 'au moins une', test: (v) => Number(v) >= 1 } },
  },
  { nom: 'essais-section-44', raison: 'être professionnel ne se décide pas soi-même (OP004, OP005)', audit: true },
  { nom: 'essais-section-45', raison: 'le SIRET à l’inscription : la preuve, un SIREN par compte, la porte de secours', audit: true },
  { nom: 'essais-section-45-bis', raison: 'la réserve d’un SIREN survit au compte', audit: true },
  { nom: 'essais-section-46', raison: '« Mon entreprise » : ce qu’un devis remis imprimera' },
  { nom: 'essais-section-47', raison: 'les tarifs réunis : lus des particuliers connectés seulement' },
  {
    nom: 'essais-section-47-rattrapage',
    raison: 'le rattrapage du lot T, rejoué sur la base de d0560e8 : le seul essai d’une base « d’avant »',
    procedure: 'rattrapage-lot-t',
  },
  { nom: 'essais-section-48', raison: 'le n° de TVA : la preuve que seule la fonction écrit, la déclaration sur l’honneur' },
  {
    nom: 'essais-section-49',
    raison: 'le chiffrage : l’argent, les liens, l’horloge, les plafonds, le catalogue',
    annonce: { motif: /FIN — (\d+) refus attendus/ },
    /* Le seul suffixe qui DÉCRIT l'ordre au lieu de l'écrire (l'essai l'abrège
       lui-même pour ne montrer aucun OID). Renommer la colonne toucherait
       l'essai : 2c-E n'en touche aucun. */
    exceptions: {
      ordre_attendu_ri_puis_trg_recalcule_devis:
        'RI_ConstraintTrigger_c_… → RI_ConstraintTrigger_c_… → trg_recalcule_devis',
    },
  },
  {
    nom: 'essais-section-49-conditions',
    raison: 'réduction, acompte, validité : la répartition au plus fort reste',
    annonce: { motif: /EXACTEMENT (\d+) lignes « psql:… ERROR »/ },
  },
  {
    nom: 'essais-section-49-rattrapage',
    raison: 'la garde de 49.6 ter, qui ne se juge QUE par le compte de ses erreurs',
    annonce: { motif: /EXACTEMENT (\d+) lignes « psql:… ERROR », dont (\d+) « P0001/, codeCompte: 'P0001' },
  },
  { nom: 'essais-section-49-remise', raison: 'ce qui empêche la remise d’un devis : le cœur de 2c' },
  {
    nom: 'essais-section-50',
    raison: 'la base de postes, et la parité de la clé de rapprochement',
    annonce: { motif: /FIN — (\d+) refus attendus/ },
  },
  { nom: 'essais-section-51a', raison: 'le stockage, et le badge suspendu', audit: true },
  { nom: 'essais-section-51b', raison: 'les demandes, le blocage, les partenariats, les réponses', audit: true },
  { nom: 'essais-section-51c', raison: 'les compteurs, les dates, la remise en avant', audit: true },
  { nom: 'essais-section-51d', raison: 'ce que chacun lit des autres, et l’export RGPD', audit: true },
  { nom: 'essais-suppression-compte', raison: 'le chemin de sortie, que 2c-3 fera passer par des devis figés' },
];

/* Ce qui n'est PAS joué, et pourquoi. (Hors de `supabase/essais-*.sql`, et
   donc pas dans cette liste : `generer-cas-badge`, qui n'a pas de mode
   `--verifier` — l'ajouter toucherait un générateur dont la sortie est
   commitée, décision Q2 du cahier laissée au propriétaire ; la procédure D
   de l'essai 50, le verrou d'un étranger ; l'empreinte de TOUT Unicode de
   l'essai 50, une cinquantaine de secondes à rejouer à la main quand la table
   de la clé change.) */
export const HORS_LISTE = [
  {
    nom: 'essais-section-49-temoin',
    raison: 'un OUTIL, pas un essai : il pose un déclencheur qui dort 2 s pour la famille D '
      + '(la concurrence, procédure A) ; joué seul, il ne prouve rien. Ce script le pose lui-même.',
  },
];

export const PARITES = [
  {
    nom: 'parite-cas-remise',
    script: 'scripts/generer-cas-remise.mjs',
    raison: 'la moitié « base » de la parité du point de remise : la vraie fonction rejouée sur les '
      + 'situations de supabase/cas-remise.json, dont `verifier-devis` fait tourner le miroir',
  },
];

/* La famille D (critique M1) : les procédures à DEUX sessions de l'en-tête
   de `essais-section-49.sql`. Leur oracle est en VALEURS, écrit ici : il ne
   dépend d'aucun relevé. */
export const PROCEDURES_A_DEUX = [
  { nom: 'concurrence-sans-temoin', titre: 'A, passage 2 : deux insertions simultanées dans le même devis' },
  { nom: 'concurrence-avec-temoin', titre: 'A, passage 4 : la même, la fenêtre élargie par le témoin' },
  { nom: 'requete-tardive', titre: 'B : une modification ancienne (n° 12) arrivée après la récente (n° 13)' },
  { nom: 'plafond-par-demande', titre: 'C : deux 20e devis sur la même demande, en même temps' },
];

/* --------------------------------------------------------------------------
   Les constantes de l'environnement
   -------------------------------------------------------------------------- */
const MAJEURE = 16;
/* Le schéma que la vraie base avait reçu au lot 0a, rejoué par le rattrapage
   du lot T. Son EMPREINTE git est écrite ici (critique m3) : une histoire
   récrite qui ferait pointer `d0560e8` ailleurs ne passerait pas en silence. */
const COMMIT_LOT_0A = 'd0560e8';
const BLOB_SCHEMA_LOT_0A = 'cb5efd1a69791f67db59eae86f1ac5c8b66acd0e';
/* Le plus long essai (50, la clé sous quatre collations) prend 80 s dans le
   conteneur : 600 s laissent sept fois sa durée à une machine plus lente. */
const DELAI_ESSAI_S = 600;
const DELAI_SESSION_S = 120;
const PORT = '5432';
const ANNEE_FENETRE = 2;

/* Les comptes et la demande de l'essai 49, qui sert de DÉCOR à la famille D. */
const D_A = 'a4900000-0000-4000-8000-00000000000a';
const D_QA = 'e4900000-0000-4000-8000-00000000a0a1';
const D_DEVIS = 'd4990000-0000-4000-8000-0000000000c1';
const D_LIGNE = 'f4990000-0000-4000-8000-0000000000c1';

/* ==========================================================================
   LA LISTE, COMPARÉE À CE QUI EXISTE — avant toute base
   ========================================================================== */
export function ecartsDeLaListe(racine = RACINE) {
  const ecarts = [];
  const surLeDisque = readdirSync(join(racine, 'supabase'))
    .filter((f) => /^essais-.*\.sql$/.test(f)).map((f) => f.replace(/\.sql$/, '')).sort();
  const dedans = new Set(ESSAIS.map((e) => e.nom));
  const dehors = new Set(HORS_LISTE.map((e) => e.nom));
  for (const nom of surLeDisque) {
    if (!dedans.has(nom) && !dehors.has(nom)) {
      ecarts.push(`Le fichier supabase/${nom}.sql n’est dans aucune liste : rangez-le dans ESSAIS `
        + `(scripts/jouer-essais-sql.mjs) puis \`npm run essais-sql -- --figer ${nom}\`, ou dans HORS_LISTE avec sa raison.`);
    }
  }
  for (const e of [...ESSAIS, ...HORS_LISTE]) {
    if (!surLeDisque.includes(e.nom)) ecarts.push(`L’entrée « ${e.nom} » de la liste n’a plus de fichier supabase/${e.nom}.sql.`);
    if (!e.raison) ecarts.push(`L’entrée « ${e.nom} » n’a pas de raison.`);
  }
  for (const nom of [...dedans].filter((n) => dehors.has(n))) ecarts.push(`« ${nom} » est à la fois dans la liste et hors de la liste.`);
  const attendus = existsSync(join(racine, DOSSIER_ATTENDUS))
    ? readdirSync(join(racine, DOSSIER_ATTENDUS)).filter((f) => f.endsWith('.txt')).map((f) => f.replace(/\.txt$/, ''))
    : [];
  const doivent = [...ESSAIS.map((e) => e.nom), ...PARITES.map((p) => p.nom)];
  for (const nom of doivent) {
    if (!attendus.includes(nom)) {
      ecarts.push(`« ${nom} » n’a pas d’oracle (${DOSSIER_ATTENDUS}/${nom}.txt) : \`npm run essais-sql -- --figer ${nom}\`.`);
      continue;
    }
    const v = (readFileSync(join(racine, DOSSIER_ATTENDUS, `${nom}.txt`), 'utf8').match(/^oracle: (\d+)$/m) || [])[1];
    if (Number(v) !== ORACLE) {
      ecarts.push(`L’oracle de « ${nom} » est à la version ${v ?? '(aucune)'}, le script à la version ${ORACLE} : `
        + 'la façon de juger a changé — `npm run essais-sql -- --figer --oracle`, puis relire que seule la FORME a bougé.');
    }
  }
  for (const nom of attendus) if (!doivent.includes(nom)) ecarts.push(`Le fichier ${DOSSIER_ATTENDUS}/${nom}.txt n’a plus d’entrée dans la liste : un oracle orphelin.`);
  return ecarts;
}

/* ==========================================================================
   LA LECTURE D'UNE SORTIE DE PSQL — tout ce qui juge est ici, pur
   ========================================================================== */
const RE_UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const RE_HORO = /\b(\d{4})-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:[+-]\d{2}(?::?\d{2})?|Z)?/g;
const RE_JOUR = /\b(\d{4})-\d{2}-\d{2}\b/g;
const RE_JOUR_FR = /\b\d{2}\/\d{2}\/(\d{4})\b/g;
const RE_PREFIXE = /^psql:[^:\n]*:\d+: /;
const RE_MESSAGE = /^psql:[^:\n]*:\d+: (ERROR|WARNING|NOTICE|INFO|LOG|DEBUG\d?|FATAL|PANIC): {2}(.*)$/;
const RE_CHAMP = /^(DETAIL|HINT|QUERY|CONTEXT|STATEMENT|LOCATION|SCHEMA NAME|TABLE NAME|COLUMN NAME|DATATYPE NAME|CONSTRAINT NAME): {2}(.*)$/;
const RE_OUTIL = /^psql:[^:\n]*:\d+: (error|warning|fatal): |^psql: (error|warning|fatal)\b|server closed the connection|could not connect to server|connection to server .* failed/;
const RE_SEPARATEUR = /^-+(\+-+)*$/;
const RE_NOMBRE = /^ *[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?$/i;
const NUL = '∅';
const ESPACE = '␣';

/* Ce que l'essai écrit lui-même : ses titres (les `\echo '…'` LITTÉRAUX, une
   seule chaîne, ses '' rendus en '), sa dernière annonce, les UUID qu'il nomme
   (ils disent QUI : on les garde), et les fichiers qu'il lit. */
export function lireSource(texte) {
  const echos = [];
  for (const l of texte.split('\n')) {
    const m = l.match(/^\s*\\echo\s+'((?:[^']|'')*)'\s*$/);
    if (m) echos.push(m[1].replace(/''/g, '\''));
  }
  const fichiers = [];
  for (const m of texte.matchAll(/^\s*\\(i|ir|include|include_relative)\s+(\S+)/gm)) fichiers.push({ commande: m[1], chemin: m[2] });
  for (const m of texte.matchAll(/`cat\s+([^`\s]+)`/g)) fichiers.push({ commande: 'cat', chemin: m[1] });
  return {
    texte,
    echos,
    titres: new Set(echos.filter((e) => e.trim() !== '')),
    derniere: echos.filter((e) => e.trim() !== '').pop() ?? null,
    uuidFixes: new Set((texte.match(RE_UUID) || []).map((u) => u.toLowerCase())),
    fichiers,
  };
}

/* La normalisation : ce qui bouge d'un passage à l'autre SANS que rien
   n'ait changé. Un UUID tiré au hasard ; un horodatage ou une date dont
   l'année est PROCHE de celle du passage (ceux que pose `now()`, et ses
   relatifs : `now() - interval '8 days'`). Une date dont l'année est loin
   (`2001-01-01`, `2099`), l'essai l'a écrite : elle reste (critique m5). La
   règle « à plus de deux jours de l'heure du passage » a été écartée : une
   date relative changerait chaque jour, et GitHub rougirait un matin sur un
   dépôt immobile. */
export function normaliseur(source, annee) {
  const proche = (a) => Math.abs(Number(a) - annee) <= ANNEE_FENETRE;
  return (s) => s
    .replace(RE_UUID, (u) => (source.uuidFixes.has(u.toLowerCase()) ? u : '<uuid>'))
    .replace(RE_HORO, (h, a) => (proche(a) ? '<horodatage>' : h))
    .replace(RE_JOUR, (j, a) => (proche(a) ? '<jour>' : j))
    .replace(RE_JOUR_FR, (j, a) => (proche(a) ? '<jour>' : j));
}

/* Un message du serveur et ses champs. En mode verbeux, le bloc finit à
   `LOCATION:` (toujours le dernier) ; sans lui, aux champs nommés. */
function lireBloc(lignes, i) {
  const m = lignes[i].match(RE_MESSAGE);
  const niveau = m[1];
  let reste = m[2];
  let code = null;
  const c = reste.match(/^([0-9A-Z]{5}): (.*)$/);
  if (c) { [, code, reste] = c; }
  const champs = { MESSAGE: [reste] };
  let champ = 'MESSAGE';
  let finLocation = -1;
  if (code) {
    for (let k = i + 1; k < Math.min(lignes.length, i + 400); k++) {
      if (/^LOCATION: {2}/.test(lignes[k])) { finLocation = k; break; }
      if (RE_PREFIXE.test(lignes[k])) break;
    }
  }
  let j = i + 1;
  for (; j < lignes.length; j++) {
    const l = lignes[j];
    const f = l.match(RE_CHAMP);
    if (f) {
      champ = f[1];
      (champs[champ] ??= []).push(f[2]);
      if (champ === 'LOCATION') { j += 1; break; }
      continue;
    }
    if (/^LINE \d+: /.test(l) || /^ *\^ *$/.test(l)) { champ = 'LINE'; continue; }
    if (finLocation > j) { (champs[champ] ??= []).push(l); continue; }
    break;
  }
  return { niveau, code, champs, fin: j };
}

export function signature(bloc, norm) {
  const texte = (k) => norm(bloc.champs[k].join('\n')).replace(/\n/g, ' ⏎ ');
  /* Le message ENTIER (critique M4) : trois paires de refus du projet ne
     diffèrent qu'après leur 60e caractère — « Celle-ci » / « Cette ligne »
     (OP015), « pour ce devis » / « pour cette ligne » (OP016), les deux
     branches de la garde de 49.6 ter. Et pour un code du projet, son DETAIL
     et son HINT : c'est là que certains disent quel cas a mordu. */
  let sig = `${bloc.code ?? '—'} ${texte('MESSAGE')}`;
  if (bloc.code && (/^OP/.test(bloc.code) || bloc.code === 'P0001')) {
    for (const k of ['DETAIL', 'HINT']) if (bloc.champs[k]) sig += ` · ${k} : ${texte(k)}`;
  }
  return sig;
}

function lireTable(lignes, i, source) {
  const entete = lignes[i];
  const bornes = [];
  for (let k = 0; k < lignes[i + 1].length; k++) if (lignes[i + 1][k] === '+') bornes.push(k);
  const nb = bornes.length + 1;
  const parPositions = (s) => {
    const c = []; let d = 0;
    for (const b of bornes) { c.push(s.slice(d, b)); d = b + 1; }
    c.push(s.slice(d));
    return c;
  };
  /* On découpe sur « | » encadré d'espaces ; si le compte n'y est pas (un
     « | » dans une valeur), aux positions des « + » du trait. */
  const couper = (s) => {
    let c = s.split(' | ');
    let lisible = true;
    if (c.length !== nb) { c = parPositions(s); lisible = c.length === nb; }
    c[0] = c[0].replace(/^ /, '');
    return { cellules: c.map((x) => x.replace(/ +$/, '')), lisible };
  };
  const noms = couper(entete).cellules.map((x) => x.trim());
  const brutes = [];
  let j = i + 2;
  for (; j < lignes.length; j++) {
    const l = lignes[j];
    if (l === '' || /^\(\d+ rows?\)$/.test(l) || RE_PREFIXE.test(l) || source.titres.has(l)) break;
    brutes.push(couper(l));
  }
  /* psql aligne les NOMBRES à droite : leurs espaces de tête sont du
     bourrage. Une colonne dont toutes les cellules sont des nombres (ou
     NULL) est rognée des deux côtés, et une cellule NULL l'est toujours (dans
     une colonne numérique, psql l'aligne à droite elle aussi : mesuré, cinq
     `…_attendu_null` de l'essai 49) ; ailleurs, un espace de tête est du
     CONTENU — c'est exactement ce que juge un essai de rognage (critique G2). */
  const numerique = noms.map((_, k) => {
    const v = brutes.map((r) => r.cellules[k] ?? '').filter((x) => x.trim() !== '' && x.trim() !== NUL);
    return v.length > 0 && v.every((x) => RE_NOMBRE.test(x));
  });
  const rangees = brutes.map((r) => ({
    lisible: r.lisible,
    cellules: r.cellules.map((x, k) => (numerique[k] || x.trim() === NUL ? x.trim() : x)),
  }));
  /* Les noms tels qu'affichés pour la sortie figée ; en minuscules pour
     reconnaître une colonne jugée ou libre. */
  return { noms, cles: noms.map((n) => n.toLowerCase()), rangees, fin: j };
}

const visible = (s) => s.replace(/^ +/, (x) => ESPACE.repeat(x.length)).replace(/ {2,}/g, (x) => ESPACE.repeat(x.length));
const plat = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
/* La convention de l'en-tête de l'essai 50 : « LES VALEURS ATTENDUES SONT
   DANS LE NOM DES COLONNES ». `null` attend la cellule NULL (affichée ∅) ;
   `vide`, la chaîne vide ; le reste se compare sans casse ni accents. */
const SPECIAUX = { t: 't', f: 'f', true: 't', false: 'f', null: NUL, vide: '', tiret: '—', zero: '0' };

export function juger(nom, valeur, exceptions = {}) {
  if (Object.hasOwn(exceptions, nom)) return valeur === exceptions[nom];
  const m = nom.match(/_attendu_([a-z0-9_]+)$/);
  if (!m) return true;
  /* Un espace de tête, ou deux d'affilée, dans une cellule jugée : la règle
     floue des suffixes les effacerait (« Dupont » = «  Dupont  »). */
  if (/^ | {2}/.test(valeur)) return false;
  if (Object.hasOwn(SPECIAUX, m[1])) return valeur === SPECIAUX[m[1]];
  return plat(valeur) === m[1];
}

/* Une sortie entière : ses erreurs rattachées à leur cas, ses erreurs de
   l'OUTIL, ses cellules jugées, sa projection. */
export function analyser(texte, source, entree, norm) {
  const lignes = texte.replace(/\n$/, '').split('\n');
  const res = { erreurs: [], outil: [], cellules: [], ecarts: [], libres: [], illisibles: 0, projection: [], vues: new Set() };
  const exceptions = entree.exceptions || {};
  const libres = entree.libres || {};
  let cas = '(avant le premier titre)';
  for (let i = 0; i < lignes.length; i++) {
    const s = lignes[i];
    res.vues.add(s);
    /* Aucune ligne figée ne finit par un espace : un éditeur qui les retire à
       l'enregistrement ne doit pas pouvoir changer un oracle (ni `git diff
       --check` le signaler). Une dernière cellule VIDE se lit au « | » final. */
    if (source.titres.has(s)) { cas = s.replace(/ +$/, ''); res.projection.push(norm(s).replace(/ +$/, '')); continue; }
    if (i + 1 < lignes.length && RE_SEPARATEUR.test(lignes[i + 1]) && s.startsWith(' ') && !source.titres.has(lignes[i + 1])) {
      const t = lireTable(lignes, i, source);
      res.projection.push(t.noms.join(' | ').replace(/ +$/, ''), '----');
      for (const r of t.rangees) {
        if (!r.lisible && t.cles.some((n) => /_attendu_/.test(n))) res.illisibles += 1;
        res.projection.push(r.cellules.map((c, k) => (Object.hasOwn(libres, t.cles[k])
          ? `<libre : ${libres[t.cles[k]].regle}>` : visible(norm(c)))).join(' | ').replace(/ +$/, ''));
        r.cellules.forEach((c, k) => {
          const n = t.cles[k];
          if (Object.hasOwn(libres, n)) {
            res.libres.push(n);
            if (!libres[n].test(c)) res.ecarts.push(`la colonne libre « ${n} » vaut « ${c} » : la règle est « ${libres[n].regle} »`);
            return;
          }
          if (!/_attendu_[a-z0-9_]+$/.test(n)) return;
          res.cellules.push(`${n} = ${visible(norm(c))}`.replace(/ +$/, ''));
          if (!juger(n, c, exceptions)) res.ecarts.push(`la valeur \`${n}\` vaut « ${visible(c)} »`);
        });
      }
      i = t.fin - 1;
      continue;
    }
    if (RE_MESSAGE.test(s)) {
      const b = lireBloc(lignes, i);
      if (b.niveau === 'ERROR') {
        const sig = signature(b, norm).replace(/ +$/, '');
        res.erreurs.push({ cas, signature: sig });
        res.projection.push(`ERREUR ${sig}`);
      } else {
        res.projection.push(`${b.niveau} ${norm(b.champs.MESSAGE.join(' ⏎ '))}`.replace(/ +$/, ''));
        if (b.niveau === 'FATAL' || b.niveau === 'PANIC') res.outil.push(s);
      }
      i = b.fin - 1;
      continue;
    }
    if (RE_OUTIL.test(s)) { res.outil.push(s.replace(RE_PREFIXE, 'psql: ')); res.projection.push(norm(s.replace(RE_PREFIXE, 'psql: ')).replace(/ +$/, '')); continue; }
    if (/^Time: [\d.]+ ms/.test(s)) continue;
    res.projection.push(norm(s).replace(/ +$/, ''));
  }
  return res;
}

/* L'audit des annonces (critique M5) : un titre qui annonce « (attendu :
   … ERROR …) » montre une erreur avant le titre suivant ; un titre qui
   annonce « UPDATE 0 », « DELETE 1 », « INSERT 0 1 » le montre. Le titre,
   ici, c'est un `\echo` littéral qui commence par « --- », « === » ou
   « ##### » : l'en-tête d'un tableau commence aussi par des tirets (le piège
   du premier audit du cahier). */
export function auditer(texte, source) {
  const l = texte.split('\n');
  const debuts = [];
  l.forEach((s, i) => { if (source.titres.has(s) && /^(--- |=== |##### )/.test(s)) debuts.push(i); });
  let annoncees = 0;
  const ko = [];
  debuts.forEach((d, k) => {
    const m = l[d].match(/attendu\s*:\s*([^)]*)/i);
    if (!m) return;
    annoncees += 1;
    const att = m[1].split(/—|avant/)[0];
    const corps = l.slice(d + 1, debuts[k + 1] ?? l.length);
    const erreurAttendue = /\bERROR\b/.test(att);
    const erreurVue = corps.some((x) => /^psql:[^:\n]*:\d+: ERROR:/.test(x));
    if (erreurAttendue && !erreurVue) ko.push(`le cas « ${l[d]} » annonce une erreur, et n’en montre aucune`);
    if (!erreurAttendue && erreurVue) ko.push(`le cas « ${l[d]} » n’annonce pas d’erreur, et en montre une`);
    for (const tag of att.match(/\b(UPDATE|DELETE|INSERT 0) \d+\b/g) || []) {
      if (!corps.includes(tag)) ko.push(`le cas « ${l[d]} » annonce « ${tag} », que la sortie ne montre pas`);
    }
  });
  return { annoncees, ko };
}

/* ==========================================================================
   LE FICHIER D'ATTENDUS — du texte, pour qu'un diff se lise
   ========================================================================== */
const ENTETE_ATTENDUS = (nom, quoi) => [
  `# Ce que doit rendre ${quoi}, joué par \`npm run essais-sql\``,
  '# (scripts/jouer-essais-sql.mjs). ENGENDRÉ par',
  `# \`npm run essais-sql -- --figer ${nom}\` : ne s'écrit pas à la main. Un changement`,
  '# se relit dans le diff — [sortie] est la sortie de psql, normalisée, ligne à',
  '# ligne —, puis se commite avec sa raison. Le compte d’erreurs figé ici doit',
  '# rester celui que l’essai ANNONCE quand il en annonce un.',
];

function ecrirePartie(nom, r) {
  const o = [`[partie ${nom}]`, `erreurs: ${r.erreurs.length}`, `valeurs-jugees: ${r.cellules.length}`, '[erreurs]'];
  let cas = null;
  for (const e of r.erreurs) {
    if (e.cas !== cas) { o.push(`| @ ${e.cas}`); cas = e.cas; }
    o.push(`|   ${e.signature}`);
  }
  o.push('[valeurs]', ...r.cellules.map((c) => `| ${c}`), '[sortie]', ...r.projection.map((p) => (p === '' ? '|' : `| ${p}`)));
  return o;
}

export function lireAttendus(texte) {
  const res = { entete: {}, parties: {} };
  let partie = null;
  let bloc = null;
  for (const l of texte.split('\n')) {
    if (l.startsWith('#') || l === '') continue;
    let m;
    if ((m = l.match(/^\[partie (.+)\]$/))) { partie = { erreurs: [], valeurs: [], sortie: [], cles: {} }; res.parties[m[1]] = partie; bloc = null; continue; }
    if ((m = l.match(/^\[(erreurs|valeurs|sortie)\]$/))) { bloc = m[1]; continue; }
    if (l === '|' || l.startsWith('| ')) {
      const t = l === '|' ? '' : l.slice(2);
      if (bloc === 'sortie') partie.sortie.push(t);
      else if (bloc === 'valeurs') partie.valeurs.push(t);
      else if (bloc === 'erreurs') {
        if (t.startsWith('@ ')) partie.cas = t.slice(2);
        else partie.erreurs.push({ cas: partie.cas, signature: t.replace(/^ {2}/, '') });
      }
      continue;
    }
    if ((m = l.match(/^([a-z-]+): (.*)$/))) { (partie ? partie.cles : res.entete)[m[1]] = m[2]; }
  }
  return res;
}

/* La comparaison d'une partie à son oracle : UNE phrase par écart, qui dit
   où et quoi. */
function comparer(nom, r, a) {
  const pb = [];
  if (r.erreurs.length !== a.erreurs.length || r.erreurs.some((e, i) => e.cas !== a.erreurs[i].cas || e.signature !== a.erreurs[i].signature)) {
    const k = r.erreurs.findIndex((e, i) => !a.erreurs[i] || e.cas !== a.erreurs[i].cas || e.signature !== a.erreurs[i].signature);
    const i = k >= 0 ? k : r.erreurs.length;
    const vu = r.erreurs[i];
    const fige = a.erreurs[i];
    const cas = (fige || vu).cas;
    pb.push(`${r.erreurs.length} erreur(s) au lieu de ${a.erreurs.length}. Premier écart, dans le cas « ${cas} » : `
      + `attendu « ${fige ? fige.signature : '(plus aucune erreur)'} », reçu « ${vu ? (vu.cas === cas ? vu.signature : `(aucune ici ; la suivante est au cas « ${vu.cas} »)`) : '(plus aucune erreur)'} ».`);
  }
  if (r.cellules.length !== a.valeurs.length) {
    pb.push(`${r.cellules.length} valeur(s) jugée(s) au lieu de ${a.valeurs.length} — l’essai s’est arrêté avant sa fin, ou des cas ont disparu.`);
  } else {
    const k = r.cellules.findIndex((c, i) => c !== a.valeurs[i]);
    if (k >= 0) pb.push(`la valeur jugée n° ${k + 1} a changé : attendu « ${a.valeurs[k]} », reçu « ${r.cellules[k]} ».`);
  }
  const k = r.projection.findIndex((p, i) => p !== a.sortie[i]);
  if (k >= 0 || r.projection.length !== a.sortie.length) {
    const i = k >= 0 ? k : Math.min(r.projection.length, a.sortie.length);
    pb.push(`la sortie a changé, ligne ${i + 1} : attendu « ${a.sortie[i] ?? '(fin de la sortie)'} », reçu « ${r.projection[i] ?? '(fin de la sortie)'} ». `
      + `Si c’est voulu : \`npm run essais-sql -- --figer ${nom}\`, relire le diff, commiter avec sa raison.`);
  }
  return pb;
}

/* ==========================================================================
   LA MACHINE : les programmes, la grappe, psql
   ========================================================================== */
class Environnement extends Error {}

const ENV_BASE = (() => {
  const env = {};
  /* Aucune variable PG* héritée : ce script ne parle qu'à SA grappe, jamais
     à une base que l'environnement désignerait (la vraie, par exemple). */
  for (const [k, v] of Object.entries(process.env)) if (!/^PG/.test(k) && k !== 'LANGUAGE' && k !== 'PSQLRC') env[k] = v;
  return Object.assign(env, { LC_ALL: 'C.UTF-8', LANG: 'C.UTF-8', PGTZ: 'UTC', PGCLIENTENCODING: 'UTF8', PSQLRC: '/dev/null' });
})();

function trouverPostgres() {
  const candidats = [process.env.PG_BIN, `/usr/lib/postgresql/${MAJEURE}/bin`];
  const pgc = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' });
  if (pgc.status === 0) candidats.push(pgc.stdout.trim());
  for (const dir of candidats.filter(Boolean)) {
    if (!['initdb', 'pg_ctl', 'psql', 'postgres'].every((b) => existsSync(join(dir, b)))) continue;
    const v = (spawnSync(join(dir, 'postgres'), ['--version'], { encoding: 'utf8' }).stdout || '').match(/\(PostgreSQL\) (\d+)\.(\d+)/);
    const c = (spawnSync(join(dir, 'psql'), ['--version'], { encoding: 'utf8' }).stdout || '').match(/\(PostgreSQL\) (\d+)\.(\d+)/);
    if (v && c && Number(v[1]) === MAJEURE && Number(c[1]) === MAJEURE) return { dir, version: `${v[1]}.${v[2]}` };
  }
  throw new Environnement(`PostgreSQL ${MAJEURE} est introuvable (ni PG_BIN, ni /usr/lib/postgresql/${MAJEURE}/bin, ni pg_config) : `
    + `installez-le (\`sudo apt-get install -y postgresql-${MAJEURE}\` sur Ubuntu). Les essais sont figés en ${MAJEURE} : une autre `
    + 'version majeure ne se joue pas en silence.');
}

class Grappe {
  constructor(pg) {
    this.pg = pg;
    this.enRoot = typeof process.getuid === 'function' && process.getuid() === 0;
    /* `/tmp` d'abord : le chemin d'une socket est borné à ~107 octets, et un
       TMPDIR très long la rendrait impossible. */
    const parent = existsSync('/tmp') ? '/tmp' : tmpdir();
    this.dossier = mkdtempSync(join(parent, 'opus-essais-sql-'));
    this.donnees = join(this.dossier, 'grappe');
    this.socket = join(this.dossier, 'sock');
    this.journal = join(this.dossier, 'serveur.log');
    mkdirSync(this.socket);
    if (this.socket.length > 90) throw new Environnement(`Le dossier temporaire ${this.socket} est trop long pour une socket.`);
    if (this.enRoot) {
      /* `initdb` refuse de tourner en root : le serveur tourne sous le compte
         système `postgres` (sur GitHub, sous `runner`, directement). */
      const id = spawnSync('id', ['-u', 'postgres'], { encoding: 'utf8' });
      const gid = spawnSync('id', ['-g', 'postgres'], { encoding: 'utf8' });
      if (id.status !== 0) {
        rmSync(this.dossier, { recursive: true, force: true });
        throw new Environnement('En root, il faut le compte système « postgres » pour faire tourner le serveur.');
      }
      for (const d of [this.dossier, this.socket]) chownSync(d, Number(id.stdout), Number(gid.stdout));
    }
    this.env = { ...ENV_BASE, PGHOST: this.socket, PGPORT: PORT, PGUSER: 'postgres', PGDATABASE: 'postgres', PATH: `${pg.dir}:${process.env.PATH || ''}` };
  }

  serveur(programme, args) {
    const bin = join(this.pg.dir, programme);
    const r = this.enRoot
      ? spawnSync('runuser', ['-u', 'postgres', '--', bin, ...args], { encoding: 'utf8', env: this.env, cwd: this.dossier })
      : spawnSync(bin, args, { encoding: 'utf8', env: this.env, cwd: this.dossier });
    return r;
  }

  demarrer() {
    const i = this.serveur('initdb', ['-D', this.donnees, '--locale=C.UTF-8', '--encoding=UTF8', '-U', 'postgres', '-A', 'trust', '--no-sync', '--no-instructions']);
    if (i.status !== 0) throw new Environnement(`initdb a échoué : ${(i.stderr || i.stdout).trim().split('\n').slice(-3).join(' / ')}`);
    /* Les réglages des essais, IMPOSÉS au serveur puis RELUS (critique m2) :
       ce qu'une session voit d'office ne dépend plus de la machine. `fsync`
       éteint : la grappe meurt avec le passage. */
    appendFileSync(join(this.donnees, 'postgresql.conf'), [
      '', '# --- scripts/jouer-essais-sql.mjs (étape 2c-E) ---',
      "listen_addresses = ''", `unix_socket_directories = '${this.socket}'`, `port = ${PORT}`,
      'fsync = off', 'synchronous_commit = off', 'full_page_writes = off',
      "timezone = 'UTC'", "log_timezone = 'UTC'", "lc_messages = 'C.UTF-8'",
      "datestyle = 'ISO, MDY'", "intervalstyle = 'postgres'", 'extra_float_digits = 1',
      'standard_conforming_strings = on', 'max_connections = 40',
      /* La compilation JIT ne change aucun résultat, mais elle dépend de la
         façon dont PostgreSQL a été construit (LLVM ou non) : éteinte, une
         machine ne diffère pas d'une autre par le temps qu'elle y passe —
         et trois essais mesurent des durées (49, 50, 51d). */
      'jit = off', '',
    ].join('\n'));
    const s = this.serveur('pg_ctl', ['-D', this.donnees, '-l', this.journal, '-w', '-t', '60', 'start']);
    if (s.status !== 0) {
      const fin = existsSync(this.journal) ? readFileSync(this.journal, 'utf8').trim().split('\n').slice(-4).join(' / ') : '';
      throw new Environnement(`le serveur n'a pas démarré : ${fin || (s.stderr || '').trim()}`);
    }
    this.demarre = true;
  }

  arreter() {
    if (this.demarre) this.serveur('pg_ctl', ['-D', this.donnees, '-m', 'immediate', '-w', 'stop']);
    this.demarre = false;
    rmSync(this.dossier, { recursive: true, force: true });
  }

  psql(args, { input, base = 'postgres' } = {}) {
    return spawnSync(join(this.pg.dir, 'psql'), ['-X', '-d', base, ...args], {
      cwd: RACINE, env: this.env, input, encoding: 'utf8', maxBuffer: 1 << 28,
    });
  }

  /* Une requête courte, dont on lit la réponse ; une erreur arrête tout. */
  requete(sql, base = 'postgres') {
    const r = this.psql(['-At', '-F', '\t', '-v', 'ON_ERROR_STOP=1', '-c', sql], { base });
    if (r.status !== 0) throw new Error(`requête refusée (${base}) : ${(r.stderr || '').trim()}\n  ${sql.slice(0, 200)}`);
    return r.stdout.replace(/\n$/, '');
  }

  /* Un fichier, sa sortie standard ET sa sortie d'erreur dans UN SEUL fichier,
     dans l'ordre : c'est l'ordre qui rattache une erreur à son cas. */
  jouer(base, fichier, sortie, { arret = false, verbeux = true, vars = {}, delai = DELAI_ESSAI_S } = {}) {
    const args = ['-X', '-d', base, '-v', `ON_ERROR_STOP=${arret ? 1 : 0}`];
    /* `VERBOSITY=verbose` donne à chaque erreur son code ; `SHOW_CONTEXT=never`
       retire le contexte PL/pgSQL, qui porte des n° de ligne de fonctions et
       bougerait à chaque retouche du schéma ; `null=∅` distingue NULL de la
       chaîne vide (critique G2 : « les blancs deviennent null » est un
       verdict de plusieurs sections). */
    if (verbeux) args.push('-v', 'VERBOSITY=verbose', '-v', 'SHOW_CONTEXT=never', '-P', `null=${NUL}`);
    else args.push('-q');
    for (const [k, v] of Object.entries(vars)) args.push('-v', `${k}=${v}`);
    args.push('-f', fichier);
    const fd = openSync(sortie, 'w');
    const t0 = Date.now();
    const r = spawnSync(join(this.pg.dir, 'psql'), args, {
      cwd: RACINE, env: this.env, stdio: ['ignore', fd, fd], timeout: delai * 1000, killSignal: 'SIGKILL',
    });
    closeSync(fd);
    return {
      code: r.status, duree: Date.now() - t0, delaiDepasse: r.error?.code === 'ETIMEDOUT',
      texte: readFileSync(sortie, 'utf8'),
    };
  }

  creerBase(nom, modele = null) {
    this.requete(modele
      ? `create database "${nom}" template "${modele}"`
      : `create database "${nom}" template template0 encoding 'UTF8' locale 'C.UTF-8'`);
  }

  supprimerBase(nom) {
    this.psql(['-q', '-c', `drop database if exists "${nom}" with (force)`]);
  }

  /* Une session de la famille D, en tâche de fond. */
  session(base, ordres, sortie) {
    return new Promise((fin) => {
      const args = ['-X', '-d', base, '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'];
      for (const o of ordres) args.push('-c', o);
      const fd = openSync(sortie, 'w');
      const p = spawn(join(this.pg.dir, 'psql'), args, { cwd: RACINE, env: this.env, stdio: ['ignore', fd, fd] });
      const minuterie = setTimeout(() => p.kill('SIGKILL'), DELAI_SESSION_S * 1000);
      p.on('close', (code) => { clearTimeout(minuterie); closeSync(fd); fin({ code, texte: readFileSync(sortie, 'utf8') }); });
    });
  }
}

/* ==========================================================================
   LE MODÈLE : le prélude, sa sonde, le schéma deux fois
   ========================================================================== */
/* LA SONDE DU PRÉLUDE (critique G3, sabotage S7 du cahier). Un prélude qui
   accorde MOINS que la production fait passer des essais de sécurité pour la
   mauvaise raison : le 07/10, la section 38 passait au vert pendant que, sur
   la vraie base, n'importe qui pouvait appeler `enregistrer_appel_ia`. Ce que
   Supabase accorde d'office, vérifié AVANT le schéma (qui, lui, retire des
   droits par défaut à sa fin). */
const SONDE = [
  ['les fonctions nées dans public sont exécutables par anon, authenticated, service_role (Supabase les accorde d’office)',
    `select count(distinct a.grantee) = 3 from pg_default_acl d, aclexplode(d.defaclacl) a
      where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole and d.defaclobjtype = 'f'
        and a.privilege_type = 'EXECUTE' and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)`],
  ['les tables nées dans public accordent tous les droits de table aux trois rôles',
    `select count(*) = 21 from pg_default_acl d, aclexplode(d.defaclacl) a
      where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole and d.defaclobjtype = 'r'
        and a.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
        and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)`],
  ['les séquences nées dans public aussi',
    `select count(*) = 9 from pg_default_acl d, aclexplode(d.defaclacl) a
      where d.defaclnamespace = 'public'::regnamespace and d.defaclrole = 'postgres'::regrole and d.defaclobjtype = 'S'
        and a.privilege_type in ('USAGE', 'SELECT', 'UPDATE')
        and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)`],
  ['service_role ignore la RLS (bypassrls), comme la clé de service de Supabase',
    "select rolbypassrls from pg_roles where rolname = 'service_role'"],
  ['anon, authenticated, service_role se connectent pas (nologin) et ont usage sur public, auth, storage',
    `select bool_and(not r.rolcanlogin and has_schema_privilege(r.rolname, 'public', 'usage')
        and has_schema_privilege(r.rolname, 'auth', 'usage') and has_schema_privilege(r.rolname, 'storage', 'usage'))
       and count(*) = 3 from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role')`],
  ['storage.foldername rend {} pour un fichier posé à la racine, {a} pour a/x (la forme de la production)',
    "select storage.foldername('x') = '{}'::text[] and storage.foldername('a/x') = '{a}'::text[]"],
  ['l’index unique objects_bucket_nom existe (l’arbitre de l’upsert de storage-api)',
    "select exists (select 1 from pg_indexes where schemaname = 'storage' and indexname = 'objects_bucket_nom')"],
  ['les trois rôles lisent et écrivent storage.objects et storage.buckets',
    `select bool_and(has_table_privilege(r, t, 'select, insert, update, delete'))
       from unnest(array['anon', 'authenticated', 'service_role']) r, unnest(array['storage.objects', 'storage.buckets']) t`],
  ['auth.uid() lit request.jwt.claim.sub, comme chez Supabase',
    `select auth.uid() = '${D_A}'::uuid from (select set_config('request.jwt.claim.sub', '${D_A}', false)) s`],
];

function construireModele(g, nom, sorties, sonder) {
  g.creerBase(nom);
  const r0 = g.jouer(nom, 'supabase/local-prelude.sql', join(sorties, `${nom}.prelude.sortie`), { arret: true, verbeux: false });
  if (r0.code !== 0) return [`le prélude (supabase/local-prelude.sql) ne passe pas : « ${premiereErreur(r0.texte)} »`];
  if (sonder) {
    const ko = [];
    for (const [quoi, sql] of SONDE) {
      let v;
      try { v = g.requete(sql, nom); } catch (e) { v = e.message; }
      if (v !== 't') ko.push(`la sonde du prélude refuse : ${quoi} (rendu « ${v} »). Un prélude qui accorde MOINS que la production `
        + 'fait passer les essais de sécurité pour la mauvaise raison.');
    }
    if (ko.length) return ko;
  }
  for (const n of [1, 2]) {
    const r = g.jouer(nom, 'supabase/schema.sql', join(sorties, `${nom}.schema-${n}.sortie`), { arret: true, verbeux: false });
    if (r.code !== 0) {
      return [n === 1
        ? `supabase/schema.sql ne passe pas sur une base neuve : « ${premiereErreur(r.texte)} »`
        : `supabase/schema.sql ne se rejoue pas : son second passage a rendu « ${premiereErreur(r.texte)} »`];
    }
  }
  return [];
}

const premiereErreur = (t) => (t.split('\n').find((l) => /ERROR|error:|FATAL/.test(l)) || t.trim().split('\n').pop() || '(rien)')
  .replace(RE_PREFIXE, (p) => p.replace(/^psql:/, '').replace(/: $/, ' : ')).slice(0, 300);

/* ==========================================================================
   UN ESSAI D'UN SEUL `psql -f`
   ========================================================================== */
function verifierFichiersLus(source, nom) {
  const ko = [];
  for (const f of source.fichiers) {
    const chemin = f.commande === 'ir' || f.commande === 'include_relative' ? join(RACINE, 'supabase', f.chemin) : join(RACINE, f.chemin);
    if (!existsSync(chemin)) ko.push(`l’essai lit ${f.chemin} (par \\${f.commande === 'cat' ? '`cat`' : f.commande}), qui n’existe pas : `
      + 'psql ne le dirait que par une ligne « error: » ou une variable vide.');
  }
  if (!ko.length) return ko;
  return ko.map((k) => `${nom} : ${k}`);
}

/* Tout ce qui ne dépend PAS de l'oracle figé : psql rend 0, l'outil n'a pas
   failli, toutes les valeurs jugées sont justes, la fin est là, le compte
   annoncé, l'audit. C'est aussi ce que `--figer` exige avant d'écrire. */
function verdictPropre(entree, source, run, r) {
  const pb = [];
  if (run.delaiDepasse) pb.push(`l’essai n’a pas fini en ${DELAI_ESSAI_S} s : arrêté.`);
  else if (run.code !== 0) pb.push(`psql a rendu le code ${run.code} (un fichier introuvable, une connexion perdue, ou ON_ERROR_STOP).`);
  for (const o of r.outil) pb.push(`erreur de l’outil psql, pas de l’essai : « ${o} » (un \\gset sans ligne, un \\ir introuvable…).`);
  if (r.illisibles) pb.push(`${r.illisibles} ligne(s) d’un tableau jugé n’ont pas pu être lues.`);
  pb.push(...r.ecarts);
  if (entree.libres) {
    for (const n of Object.keys(entree.libres)) if (!r.libres.includes(n)) pb.push(`la colonne libre « ${n} » n’apparaît plus : sa règle n’éprouve plus rien.`);
  }
  if (!entree.procedure && source.derniere && !r.vues.has(source.derniere)) {
    pb.push(`sa dernière annonce (« ${source.derniere} ») n’est pas dans la sortie : l’essai s’est arrêté avant sa fin.`);
  }
  if (entree.annonce) {
    const lus = source.echos.map((e) => e.match(entree.annonce.motif)).filter(Boolean);
    if (lus.length !== 1) pb.push(`l’essai devait annoncer son compte d’erreurs (${entree.annonce.motif}) : trouvé ${lus.length} fois. Un contrôle qui ne trouve pas sa cible ne vérifie rien.`);
    else {
      const n = Number(lus[0][1]);
      if (n !== r.erreurs.length) pb.push(`l’essai annonce ${n} refus, il en a rendu ${r.erreurs.length} : corrigez l’essai OU le schéma, jamais l’attendu seul.`);
      if (entree.annonce.codeCompte) {
        const m = Number(lus[0][2]);
        const vus = r.erreurs.filter((e) => e.signature.startsWith(`${entree.annonce.codeCompte} `)).length;
        if (m !== vus) pb.push(`l’essai annonce ${m} erreur(s) ${entree.annonce.codeCompte}, il en a rendu ${vus}.`);
      }
    }
  }
  if (entree.audit) {
    const a = auditer(run.texte, source);
    if (a.annoncees === 0) pb.push('l’audit des « (attendu : … ) » ne trouve plus aucun titre annoncé : il n’éprouve plus rien.');
    pb.push(...a.ko);
  }
  return pb;
}

function jouerEssai(g, modele, entree, sorties, annee, suffixe = '') {
  const fichier = `supabase/${entree.nom}.sql`;
  const source = lireSource(readFileSync(join(RACINE, fichier), 'utf8'));
  const base = `e_${process.pid}_${entree.nom.replace(/[^a-z0-9]/g, '_')}${suffixe}`;
  g.creerBase(base, modele);
  try {
    const run = g.jouer(base, fichier, join(sorties, `${entree.nom}${suffixe}.sortie`));
    const r = analyser(run.texte, source, entree, normaliseur(source, annee));
    return { run, r, source, propres: verdictPropre(entree, source, run, r) };
  } finally {
    g.supprimerBase(base);
  }
}

/* ==========================================================================
   LE RATTRAPAGE DU LOT T — douze étapes, sur la base de d0560e8
   ========================================================================== */
function ancienSchema() {
  const e = spawnSync('git', ['-C', RACINE, 'cat-file', '-e', `${COMMIT_LOT_0A}^{commit}`], { encoding: 'utf8' });
  if (e.status !== 0) {
    throw new Environnement(`le commit ${COMMIT_LOT_0A} (le schéma que la vraie base avait reçu au lot 0a) manque : clone superficiel ? `
      + '`git fetch --unshallow` (sur GitHub : `fetch-depth: 0` dans actions/checkout).');
  }
  const b = spawnSync('git', ['-C', RACINE, 'rev-parse', `${COMMIT_LOT_0A}:supabase/schema.sql`], { encoding: 'utf8' });
  if (b.status !== 0 || b.stdout.trim() !== BLOB_SCHEMA_LOT_0A) {
    throw new Environnement(`${COMMIT_LOT_0A}:supabase/schema.sql n’est plus le fichier attendu (empreinte ${b.stdout.trim() || '?'}, `
      + `attendue ${BLOB_SCHEMA_LOT_0A}) : l’historique a été récrit.`);
  }
  return spawnSync('git', ['-C', RACINE, 'show', `${COMMIT_LOT_0A}:supabase/schema.sql`], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout;
}

const MOITIES = [
  ['avant', 'avant', true], ['apres-1', 'apres', false], ['apres-2', 'apres', false],
  ['retrait', 'retrait', true], ['apres-retrait', 'apres_retrait', false],
];

function jouerRattrapage(g, entree, sorties, annee, suffixe = '') {
  const fichier = `supabase/${entree.nom}.sql`;
  const source = lireSource(readFileSync(join(RACINE, fichier), 'utf8'));
  const norm = normaliseur(source, annee);
  const ancien = join(g.dossier, `schema-${COMMIT_LOT_0A}.sql`);
  writeFileSync(ancien, ancienSchema());
  const base = `r_${process.pid}${suffixe}`;
  const res = { parties: {}, problemes: [], notice: null, duree: 0 };
  const t0 = Date.now();
  g.creerBase(base);
  try {
    const sortie = (n) => join(sorties, `${entree.nom}${suffixe}.${n}.sortie`);
    const pas = (fichierSql, etiquette, opts) => {
      const r = g.jouer(base, fichierSql, sortie(etiquette), opts);
      if (r.code !== 0) res.problemes.push(`l’étape « ${etiquette} » a rendu le code ${r.code} : « ${premiereErreur(r.texte)} »`);
      return r;
    };
    pas('supabase/local-prelude.sql', 'prelude', { arret: true, verbeux: false });
    pas(ancien, 'ancien-schema-1', { arret: true, verbeux: false });
    pas(ancien, 'ancien-schema-2', { arret: true, verbeux: false });
    const notices = (t) => t.split('\n').map((l) => l.match(/NOTICE: {2}(?:00000: )?(Section 47 .*)$/)).filter(Boolean).map((m) => m[1]);
    let schemaN = 0;
    const schema = () => {
      schemaN += 1;
      return notices(pas('supabase/schema.sql', `schema-${schemaN}`, { arret: true, verbeux: false }).texte);
    };
    const moitie = (nom, valeur, arret) => {
      const run = pas(fichier, nom, { arret, vars: { moitie: valeur } });
      const r = analyser(run.texte, source, entree, norm);
      res.parties[nom] = r;
      for (const p of verdictPropre(entree, source, run, r)) if (!/code \d/.test(p)) res.problemes.push(`moitié « ${nom} » : ${p}`);
    };
    if (!res.problemes.length) {
      moitie(...MOITIES[0]);
      const n1 = schema();
      /* LA NOTICE du premier rejeu dit ce que le rattrapage a fait ; le
         second ne doit RIEN refaire. */
      if (n1.length !== 1) res.problemes.push(`le premier rejeu du nouveau schéma devait écrire UNE notice « Section 47 : … », il en a écrit ${n1.length}.`);
      res.notice = n1.join(' ⏎ ');
      moitie(...MOITIES[1]);
      const n2 = schema();
      if (n2.length) res.problemes.push(`le second rejeu a refait le rattrapage : « ${n2.join(' ⏎ ')} ». Il ne doit tourner qu’une fois.`);
      moitie(...MOITIES[2]);
      const [a, b] = [res.parties['apres-1'], res.parties['apres-2']];
      if (a && b && a.projection.join('\n') !== b.projection.join('\n')) res.problemes.push('les deux moitiés « apres » diffèrent : rejouer le schéma a changé quelque chose.');
      moitie(...MOITIES[3]);
      schema();
      schema();
      moitie(...MOITIES[4]);
    }
  } finally {
    g.supprimerBase(base);
    res.duree = Date.now() - t0;
  }
  return res;
}

/* ==========================================================================
   LA FAMILLE D — deux sessions (critique M1)
   La seconde session ne part qu'une fois la première VUE en `PgSleep` dans
   pg_stat_activity (et non « une seconde après ») : une machine lente ne
   fabrique ainsi ni faux rouge (sur le schéma juste, le résultat ne dépend
   pas du recouvrement), ni faux vert de cette façon.
   ========================================================================== */
const COMME_A = ['begin', 'set local role authenticated', `set local request.jwt.claim.sub = '${D_A}'`];
const ligneSql = (ordre, n) => `insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, `
  + `prix_unitaire_centimes, taux_tva_centiemes, generation) values ('${D_DEVIS}', ${ordre}, 'poste', 'Ligne ${ordre}', 1000, 'u', 1000, 1000, ${n})`;

async function attendreLeSommeil(g, base) {
  const fin = Date.now() + 30000;
  while (Date.now() < fin) {
    const n = g.requete(`select count(*) from pg_stat_activity where datname = '${base}' and wait_event = 'PgSleep'`);
    if (Number(n) >= 1) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

async function jouerProcedure(g, decor, p, sorties) {
  const base = `d_${process.pid}_${p.nom.replace(/-/g, '_')}`;
  const pb = [];
  const t0 = Date.now();
  g.creerBase(base, decor);
  try {
    const q = (sql) => g.requete(sql, base);
    const sortie = (n) => join(sorties, `${p.nom}.${n}.sortie`);
    let s1;
    let s2;
    const deux = async (o1, o2) => {
      const premiere = g.session(base, o1, sortie('session-1'));
      if (!(await attendreLeSommeil(g, base))) pb.push('la première session n’a jamais dormi : la procédure n’a pas eu lieu.');
      s2 = await g.session(base, o2, sortie('session-2'));
      s1 = await premiere;
    };
    if (p.nom.startsWith('concurrence')) {
      q(`insert into public.devis (id, pro_id, generation) values ('${D_DEVIS}', '${D_A}', 10)`);
      if (p.nom === 'concurrence-avec-temoin') {
        const t = g.jouer(base, 'supabase/essais-section-49-temoin.sql', sortie('temoin'), { arret: true, vars: { etape: 'poser' } });
        if (t.code !== 0 || !t.texte.includes('Le témoin est posé')) pb.push(`le témoin n’a pas pu être posé : « ${premiereErreur(t.texte)} »`);
      }
      await deux([...COMME_A, ligneSql(1, 20), 'select pg_sleep(3)', 'commit'], [...COMME_A, ligneSql(2, 21), 'commit']);
      for (const [n, s] of [[1, s1], [2, s2]]) {
        if (/40P01|deadlock detected/.test(s.texte)) pb.push(`session ${n} : « deadlock detected » (40P01) — le verrou de recalcule_devis n’est plus « for no key update ».`);
        else if (s.code !== 0) pb.push(`session ${n} : code ${s.code}, « ${premiereErreur(s.texte)} »`);
      }
      const [lignes, ht, nb] = q(`select (select count(*) from public.devis_lignes where devis_id = '${D_DEVIS}'), d.total_ht_centimes, `
        + `(select nb_lignes from public.devis_tva where devis_id = d.id and taux_tva_centiemes = 1000) from public.devis d where d.id = '${D_DEVIS}'`).split('\t');
      if (lignes !== '2') pb.push(`${lignes} ligne(s) en base au lieu de 2.`);
      if (ht !== '2000') pb.push(`le total HT vaut ${ht} au lieu de 2000 — une ligne enregistrée en même temps qu’une autre a été oubliée par le recalcul.`);
      if (nb !== '2') pb.push(`la ventilation compte ${nb} ligne(s) au lieu de 2.`);
    } else if (p.nom === 'requete-tardive') {
      q(`insert into public.devis (id, pro_id, generation) values ('${D_DEVIS}', '${D_A}', 10)`);
      q(`insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, `
        + `taux_tva_centiemes, generation) values ('${D_LIGNE}', '${D_DEVIS}', 1, 'poste', 'Ligne', 1000, 'u', 4000, 1000, 11)`);
      const maj = (prix, n) => `update public.devis_lignes set prix_unitaire_centimes = ${prix}, generation = ${n} where id = '${D_LIGNE}'`;
      await deux([...COMME_A, maj(6000, 13), 'select pg_sleep(3)', 'commit'], [...COMME_A, maj(5000, 12), 'commit']);
      if (s1.code !== 0) pb.push(`la modification récente (n° 13) a échoué : « ${premiereErreur(s1.texte)} »`);
      if (!/OP015/.test(s2.texte)) pb.push(`la modification tardive (n° 12) n’a pas été refusée par OP015 : « ${premiereErreur(s2.texte)} »`);
      const prix = q(`select prix_unitaire_centimes from public.devis_lignes where id = '${D_LIGNE}'`);
      if (prix !== '6000') pb.push(`la base garde ${prix} au lieu de 6000 : la modification ANCIENNE a écrasé la récente.`);
    } else if (p.nom === 'plafond-par-demande') {
      q(`insert into public.devis (pro_id, quote_request_id, generation) select '${D_A}', '${D_QA}', 1 from generate_series(1, 19)`);
      const vingtieme = `insert into public.devis (pro_id, quote_request_id, generation) values ('${D_A}', '${D_QA}', 1)`;
      await deux([...COMME_A, vingtieme, 'select pg_sleep(3)', 'commit'], [...COMME_A, vingtieme, 'commit']);
      if (s1.code !== 0) pb.push(`le premier 20e devis a échoué : « ${premiereErreur(s1.texte)} »`);
      if (!/OP017/.test(s2.texte)) pb.push(`le second 20e devis n’a pas été refusé par OP017 : « ${premiereErreur(s2.texte)} »`);
      const n = q(`select count(*) from public.devis where quote_request_id = '${D_QA}'`);
      if (n !== '20') pb.push(`${n} devis liés à la demande au lieu de 20 : deux insertions simultanées ont compté chacune 19.`);
    }
  } catch (e) {
    pb.push(`la procédure n’a pas pu se jouer : ${e.message.split('\n')[0]}`);
  } finally {
    g.supprimerBase(base);
  }
  return { problemes: pb, duree: Date.now() - t0 };
}

/* ==========================================================================
   LA PARITÉ DE cas-remise.json
   ========================================================================== */
function jouerParite(g, p, sorties) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(RACINE, p.script), '--verifier'], {
    cwd: RACINE, env: g.env, encoding: 'utf8', timeout: DELAI_ESSAI_S * 1000, killSignal: 'SIGKILL', maxBuffer: 1 << 26,
  });
  const texte = `${r.stdout || ''}${r.stderr || ''}`;
  writeFileSync(join(sorties, `${p.nom}.sortie`), texte);
  const m = texte.match(/✔ .*\((\d+) cas\)/);
  const pb = [];
  if (r.status === 1 && /ne correspond plus/.test(texte)) pb.push('supabase/cas-remise.json ne correspond plus à ce que la base rend : relancer le générateur, relire le diff.');
  else if (r.status !== 0 || !m) pb.push(`le générateur n’a pas pu se lancer (code ${r.status}) : « ${texte.trim().split('\n').slice(-2).join(' / ').slice(0, 300)} »`);
  return { cas: m ? Number(m[1]) : null, problemes: pb, duree: Date.now() - t0 };
}

/* ==========================================================================
   LE PASSAGE
   ========================================================================== */
const s1 = (ms) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
const lire = (nom) => {
  const f = join(RACINE, DOSSIER_ATTENDUS, `${nom}.txt`);
  return existsSync(f) ? lireAttendus(readFileSync(f, 'utf8')) : null;
};

function ceQuiNEstPasCommite() {
  const r = spawnSync('git', ['-C', RACINE, 'status', '--porcelain', '--', 'supabase', 'scripts/jouer-essais-sql.mjs',
    'scripts/generer-cas-remise.mjs', 'src/lib', 'src/data', 'package.json', '.github/workflows/verifier.yml'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.split('\n').filter(Boolean);
}

function comparerSens(ancien, neuf) {
  /* Un changement d'ORACLE change la forme, jamais le sens : la même suite de
     codes d'erreur, les mêmes valeurs jugées (critique M3). */
  const codes = (p) => p.erreurs.map((e) => e.signature.split(' ')[0]).join(',');
  const valeurs = (p) => p.valeurs.map((v) => v.replace(/ +$/, '')).join('\n');
  return codes(ancien) === codes(neuf) && valeurs(ancien) === valeurs(neuf);
}

function versAttendue(r) {
  return { erreurs: r.erreurs, valeurs: r.cellules, sortie: r.projection };
}

/* Les jours d'hier, d'aujourd'hui et de demain, en UTC et à Paris, sous les
   formes qu'un essai pourrait afficher et que la normalisation ne réduirait
   pas : une sortie qui en contient une rougirait le lendemain. */
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function joursProches() {
  const j = new Set();
  for (const d of [-1, 0, 1]) {
    for (const tz of ['UTC', 'Europe/Paris']) {
      const [a, m, jj] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
        .format(new Date(Date.now() + d * 86400000)).split('-');
      j.add(`${a}-${m}-${jj}`).add(`${jj}/${m}/${a}`).add(`${a}/${m}/${jj}`).add(`${Number(jj)} ${MOIS[Number(m) - 1]} ${a}`);
    }
  }
  return [...j];
}

async function principal(argv) {
  const opts = { noms: [], figer: false, oracle: false, sorties: null, commeGithub: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--figer') opts.figer = true;
    else if (a === '--oracle') opts.oracle = true;
    else if (a === '--comme-github') opts.commeGithub = true;
    else if (a === '--sorties') opts.sorties = argv[++i];
    else if (a.startsWith('--')) { console.error(`Option inconnue : ${a}`); return 2; }
    else opts.noms.push(a.replace(/^supabase\//, '').replace(/\.sql$/, ''));
  }
  if (opts.commeGithub) return commeGithub(argv.filter((a) => a !== '--comme-github'));

  console.log('\nOpus — les essais SQL\n');
  /* 1. LA LISTE, avant toute base. */
  const ecarts = ecartsDeLaListe();
  if (opts.figer) {
    /* --figer écrit des oracles : il tolère ceux qui manquent ou qui sont à
       une autre version — c'est pour ça qu'on le lance. */
    const tolere = (e) => /n’a pas d’oracle|est à la version/.test(e);
    const bloquants = ecarts.filter((e) => !tolere(e));
    if (bloquants.length) { bloquants.forEach((e) => console.error(`  ✘ ${e}`)); return 1; }
  } else if (ecarts.length) {
    ecarts.forEach((e) => console.error(`  ✘ ${e}`));
    console.error(`\n✘ La liste fermée ne correspond pas à ce qui existe (${ecarts.length} écart(s)).\n`);
    return 1;
  }
  const tous = [...ESSAIS.map((e) => e.nom), ...PROCEDURES_A_DEUX.map((p) => p.nom), ...PARITES.map((p) => p.nom)];
  const inconnus = opts.noms.filter((n) => !tous.includes(n));
  if (inconnus.length) { console.error(`  ✘ Inconnu(s) : ${inconnus.join(', ')}. Les noms : ${tous.join(', ')}.`); return 2; }
  if (opts.figer) {
    if (process.env.CI) { console.error('  ✘ --figer refuse de tourner en intégration continue : un oracle se fige à la main, et se relit.'); return 2; }
    if (!opts.oracle && !opts.noms.length) { console.error('  ✘ --figer attend le nom d’un essai : on ne fige pas tout d’un coup (sauf --figer --oracle).'); return 2; }
    const sansFichier = opts.noms.filter((n) => PROCEDURES_A_DEUX.some((p) => p.nom === n));
    if (sansFichier.length) { console.error(`  ✘ ${sansFichier.join(', ')} : l’oracle d’une procédure à deux sessions est écrit dans le script, il ne se fige pas.`); return 2; }
  }
  const choisis = new Set(opts.noms.length ? opts.noms : tous);
  const veut = (n) => choisis.has(n);

  let pg;
  let g;
  const propreSorties = !opts.sorties;
  const sorties = opts.sorties ? resolve(opts.sorties) : mkdtempSync(join(tmpdir(), 'opus-essais-sql-sorties-'));
  mkdirSync(sorties, { recursive: true });
  const nettoyer = () => { try { g?.arreter(); } catch { /* déjà parti */ } };
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { nettoyer(); process.exit(130); });

  let rouges = 0;
  let joues = 0;
  try {
    pg = trouverPostgres();
    g = new Grappe(pg);
    g.demarrer();
    /* 2. CE QUE LA MACHINE EST, imprimé : quand GitHub rougit et pas le
       conteneur, c'est la première chose à lire. */
    const [vnum, qui, superu, lcm, tz, ds, is, efd, scs, senc, cenc, coll, version, icu, maintenant] = g.requete(
      "select current_setting('server_version_num'), current_user, (select rolsuper from pg_roles where rolname = current_user), "
      + "current_setting('lc_messages'), current_setting('TimeZone'), current_setting('DateStyle'), current_setting('IntervalStyle'), "
      + "current_setting('extra_float_digits'), current_setting('standard_conforming_strings'), current_setting('server_encoding'), "
      + "current_setting('client_encoding'), (select datcollate || '/' || datctype from pg_database where datname = 'template1'), version(), "
      + "coalesce((select pg_collation_actual_version(oid) from pg_collation where collname = 'und-x-icu'), '—'), "
      + "to_char(now() at time zone 'UTC', 'YYYY')").split('\t');
    const glibc = process.report?.getReport?.()?.header?.glibcVersionRuntime ?? '?';
    console.log(`  ${version}`);
    console.log(`  ICU des collations ${icu} · glibc ${glibc} · Node ${process.version} · template1 ${coll} · ${g.enRoot ? 'serveur sous « postgres » (lancé en root)' : 'serveur sous l’utilisateur courant'}`);
    const attendu = [[vnum.slice(0, 2), String(MAJEURE), 'la version majeure du serveur'], [qui, 'postgres', 'l’utilisateur'],
      [superu, 't', 'superutilisateur'], [lcm, 'C.UTF-8', 'lc_messages'], [tz, 'UTC', 'TimeZone'], [ds, 'ISO, MDY', 'DateStyle'],
      [is, 'postgres', 'IntervalStyle'], [efd, '1', 'extra_float_digits'], [scs, 'on', 'standard_conforming_strings'],
      [senc, 'UTF8', 'server_encoding'], [cenc, 'UTF8', 'client_encoding'], [coll, 'C.UTF-8/C.UTF-8', 'la collation de template1']];
    const faux = attendu.filter(([v, a]) => v !== a);
    if (faux.length) throw new Environnement(`la grappe n’a pas les réglages des essais : ${faux.map(([v, a, q]) => `${q} vaut « ${v} » au lieu de « ${a} »`).join(' ; ')}.`);
    const annee = Number(maintenant);

    /* 3. LE MODÈLE. */
    const modele = `m_${process.pid}`;
    const t0 = Date.now();
    const km = construireModele(g, modele, sorties, true);
    if (km.length) { km.forEach((k) => console.error(`  ✘ ${k}`)); return 1; }
    console.log(`  ✔ le modèle : prélude sondé, schema.sql rejoué deux fois (${s1(Date.now() - t0)})\n`);
    /* Pour --figer : un SECOND modèle, construit après le premier — ses OID
       sont décalés. Une sortie qui en dépendrait ne se figerait pas. */
    let modeleBis = null;
    if (opts.figer) {
      modeleBis = `m_${process.pid}_bis`;
      const kb = construireModele(g, modeleBis, sorties, false);
      if (kb.length) { kb.forEach((k) => console.error(`  ✘ ${k}`)); return 1; }
    }

    const aEcrire = [];
    const refus = [];
    const ligne = (ok, nom, duree, detail, pbs = []) => {
      const f = ok ? console.log : console.error;
      f(`  ${ok ? '✔' : '✘'} ${nom.padEnd(30)} ${duree.padStart(7)}   ${detail}`);
      pbs.forEach((p) => f(`        ${p}`));
    };

    /* 4. LES ESSAIS D'UN `-f`, puis le rattrapage. */
    for (const entree of ESSAIS) {
      if (!veut(entree.nom)) continue;
      joues += 1;
      if (entree.procedure === 'rattrapage-lot-t') {
        const r = jouerRattrapage(g, entree, sorties, annee);
        let pbs = [...r.problemes];
        const a = lire(entree.nom);
        if (opts.figer) {
          const r2 = jouerRattrapage(g, entree, sorties, annee, '_bis');
          const pareil = MOITIES.every(([n]) => r.parties[n] && r2.parties[n] && r.parties[n].projection.join('\n') === r2.parties[n].projection.join('\n'));
          if (!pareil) pbs.push('deux passages de la procédure ne rendent pas la même sortie : rien à figer.');
          if (pbs.length) refus.push([entree.nom, pbs]);
          else aEcrire.push([entree.nom, rattrapageVersTexte(entree.nom, r), a, r]);
          ligne(!pbs.length, entree.nom, s1(r.duree), pbs.length ? 'NON FIGÉ' : 'à figer', pbs);
          if (pbs.length) rouges += 1;
          continue;
        }
        if (a) {
          if (a.entete['notice-premier-rejeu'] !== r.notice) pbs.push(`la notice du rattrapage a changé : attendu « ${a.entete['notice-premier-rejeu']} », reçu « ${r.notice} ».`);
          for (const [n] of MOITIES) {
            if (!r.parties[n]) continue;
            if (!a.parties[n]) { pbs.push(`moitié « ${n} » absente de l’oracle.`); continue; }
            pbs.push(...comparer(entree.nom, r.parties[n], a.parties[n]).map((p) => `moitié « ${n} » : ${p}`));
          }
        }
        const nbc = MOITIES.map(([n]) => r.parties[n]?.cellules.length ?? 0).join(' / ');
        ligne(!pbs.length, entree.nom, s1(r.duree), `12 étapes · valeurs jugées ${nbc}`, pbs);
        if (pbs.length) rouges += 1;
        continue;
      }
      const source = lireSource(readFileSync(join(RACINE, `supabase/${entree.nom}.sql`), 'utf8'));
      const kf = verifierFichiersLus(source, entree.nom);
      if (kf.length) { ligne(false, entree.nom, '—', 'pas joué', kf); rouges += 1; continue; }
      const { run, r, propres } = jouerEssai(g, modele, entree, sorties, annee);
      writeFileSync(join(sorties, `${entree.nom}.projection`), `${r.projection.join('\n')}\n`);
      const detail = `${String(r.erreurs.length).padStart(3)} erreurs attendues · ${String(r.cellules.length).padStart(3)} valeurs jugées`;
      if (opts.figer) {
        const pbs = [...propres];
        const bis = jouerEssai(g, modeleBis, entree, sorties, annee, '_bis');
        if (bis.r.projection.join('\n') !== r.projection.join('\n')) {
          const k = r.projection.findIndex((p, i) => p !== bis.r.projection[i]);
          pbs.push(`deux modèles construits l’un après l’autre ne rendent pas la même sortie (ligne ${k + 1} : « ${r.projection[k]} » / « ${bis.r.projection[k]} ») : rien à figer.`);
        }
        const proches = joursProches().filter((j) => r.projection.some((p) => p.includes(j)));
        if (proches.length) pbs.push(`la sortie contient la date d’hier, d’aujourd’hui ou de demain (${proches.join(', ')}) : figée, elle rougirait demain.`);
        if (pbs.length) { refus.push([entree.nom, pbs]); rouges += 1; } else aEcrire.push([entree.nom, essaiVersTexte(entree.nom, r), lire(entree.nom), { parties: { essai: r } }]);
        ligne(!pbs.length, entree.nom, s1(run.duree), `${detail} · ${pbs.length ? 'NON FIGÉ' : 'à figer'}`, pbs);
        continue;
      }
      const a = lire(entree.nom);
      const pbs = [...propres, ...(a?.parties.essai ? comparer(entree.nom, r, a.parties.essai)
        : [`l’oracle ${DOSSIER_ATTENDUS}/${entree.nom}.txt n’a pas de partie « essai » : refigez-le.`])];
      ligne(!pbs.length, entree.nom, s1(run.duree), detail, pbs);
      if (pbs.length) rouges += 1;
    }

    /* 5. LA FAMILLE D, sur le décor de l'essai 49. */
    const procedures = PROCEDURES_A_DEUX.filter((p) => veut(p.nom));
    if (opts.figer && procedures.length) console.log('\n  (la famille D ne se fige pas : son oracle est écrit dans le script)');
    if (procedures.length && !opts.figer) {
      const decor = `decor_${process.pid}`;
      g.creerBase(decor, modele);
      const d = g.jouer(decor, 'supabase/essais-section-49.sql', join(sorties, 'decor-famille-d.sortie'));
      if (d.code !== 0) {
        procedures.forEach((p) => ligne(false, p.nom, '—', 'pas joué', [`le décor (l’essai 49) a rendu le code ${d.code}`]));
        rouges += procedures.length;
      } else {
        console.log('');
        for (const p of procedures) {
          joues += 1;
          const r = await jouerProcedure(g, decor, p, sorties);
          ligne(!r.problemes.length, p.nom, s1(r.duree), p.titre, r.problemes);
          if (r.problemes.length) rouges += 1;
        }
      }
      g.supprimerBase(decor);
    }

    /* 6. LA PARITÉ. */
    for (const p of PARITES) {
      if (!veut(p.nom)) continue;
      joues += 1;
      console.log('');
      const r = jouerParite(g, p, sorties);
      const a = lire(p.nom);
      const pbs = [...r.problemes];
      if (opts.figer) {
        if (pbs.length) { refus.push([p.nom, pbs]); rouges += 1; } else aEcrire.push([p.nom, pariteVersTexte(p.nom, r.cas), a, null]);
      } else if (a && r.cas !== null && Number(a.entete.cas) !== r.cas) {
        /* Le NOMBRE est figé exprès : retirer des situations du générateur
           PUIS régénérer le fichier laisse `--verifier` vert (« une parité ne
           voit pas ce qui bouge des deux côtés à la fois », 2b-3). */
        pbs.push(`${r.cas} cas au lieu de ${a.entete.cas} : des situations ont été retirées (ou ajoutées) du générateur. Si c’est voulu : \`npm run essais-sql -- --figer ${p.nom}\`.`);
      }
      ligne(!pbs.length, p.nom, s1(r.duree), `${r.cas ?? '?'} cas`, pbs);
      if (pbs.length && !opts.figer) rouges += 1;
    }

    /* 7. --figer : écrire, ou refuser. */
    if (opts.figer) {
      if (opts.oracle) {
        for (const [nom, , ancien, neuf] of aEcrire) {
          if (!ancien || !neuf) continue;
          for (const [n, part] of Object.entries(neuf.parties)) {
            if (ancien.parties[n] && !comparerSens(ancien.parties[n], versAttendue(part))) refus.push([nom, [`le SENS de la partie « ${n} » a changé (codes d’erreur ou valeurs jugées) : ce n’est pas un changement d’oracle.`]]);
          }
        }
      }
      if (refus.length) {
        console.error(`\n✘ Rien n’est écrit : ${refus.length} refus.\n`);
        refus.forEach(([n, pbs]) => pbs.forEach((p) => console.error(`  ${n} : ${p}`)));
        return 1;
      }
      mkdirSync(join(RACINE, DOSSIER_ATTENDUS), { recursive: true });
      console.log('');
      for (const [nom, texte, ancien, neuf] of aEcrire) {
        writeFileSync(join(RACINE, DOSSIER_ATTENDUS, `${nom}.txt`), texte);
        if (ancien && neuf) {
          for (const [n, part] of Object.entries(neuf.parties)) {
            const av = ancien.parties[n];
            if (!av) continue;
            const ap = versAttendue(part);
            const diff = ap.sortie.filter((l, i) => l !== av.sortie[i]).length + Math.abs(ap.sortie.length - av.sortie.length);
            console.log(`  ✎ ${nom}${n === 'essai' ? '' : ` (${n})`} : erreurs ${av.erreurs.length} → ${ap.erreurs.length}, `
              + `valeurs jugées ${av.valeurs.length} → ${ap.valeurs.length}, ${diff} ligne(s) de sortie changée(s)`);
          }
        } else if (ancien && texte.includes('\nparite: ')) {
          console.log(`  ✎ ${nom} : cas ${ancien.entete.cas} → ${(texte.match(/^cas: (\d+)$/m) || [])[1]}`);
        } else console.log(`  ✎ ${nom} : figé pour la première fois`);
      }
      console.log(`\n✔ ${aEcrire.length} oracle(s) écrit(s) dans ${DOSSIER_ATTENDUS}/ : relisez le diff AVANT de commiter.\n`);
      return 0;
    }
  } catch (e) {
    if (e instanceof Environnement) {
      console.error(`\n✘ Les essais n’ont pas pu se jouer : ${e.message}\n`);
      return 2;
    }
    throw e;
  } finally {
    nettoyer();
    /* Un passage qui n'a rien joué (la machine) ne laisse pas de dossier vide. */
    if (propreSorties && existsSync(sorties) && readdirSync(sorties).length === 0) rmSync(sorties, { recursive: true, force: true });
  }

  /* 8. LE BILAN. */
  const total = ESSAIS.length + PROCEDURES_A_DEUX.length + PARITES.length;
  const partiel = joues < total ? ` (${joues} sur ${total} joués : ce n’est PAS le passage complet)` : '';
  const nonCommites = ceQuiNEstPasCommite();
  if (nonCommites && nonCommites.length) {
    console.log(`\n  ⚠ ${nonCommites.length} fichier(s) lu(s) par les essais ne sont pas commités — GitHub jouera la version COMMITÉE :`);
    nonCommites.slice(0, 12).forEach((l) => console.log(`      ${l}`));
    console.log('    Après le commit, avant l’envoi : `npm run essais-sql -- --comme-github`.');
  }
  if (rouges) {
    console.error(`\n✘ ${rouges} essai(s) sur ${joues} ne rendent plus ce qu’ils rendaient${partiel}.`);
    console.error(`  Les sorties brutes : ${sorties}\n`);
    return 1;
  }
  if (propreSorties) rmSync(sorties, { recursive: true, force: true });
  console.log(`\n✔ Les ${joues} essais rendent ce qu’ils rendaient${partiel}.\n`);
  return 0;
}

function essaiVersTexte(nom, r) {
  return [...ENTETE_ATTENDUS(nom, `supabase/${nom}.sql`), `oracle: ${ORACLE}`, `essai: ${nom}`, '', ...ecrirePartie('essai', r), ''].join('\n');
}

function rattrapageVersTexte(nom, r) {
  const o = [...ENTETE_ATTENDUS(nom, `supabase/${nom}.sql (douze étapes, sur le schéma de ${COMMIT_LOT_0A})`),
    `oracle: ${ORACLE}`, `essai: ${nom}`, `notice-premier-rejeu: ${r.notice}`, ''];
  for (const [n] of MOITIES) o.push(...ecrirePartie(n, r.parties[n]), '');
  return o.join('\n');
}

function pariteVersTexte(nom, cas) {
  return [...ENTETE_ATTENDUS(nom, '`node scripts/generer-cas-remise.mjs --verifier`'), `oracle: ${ORACLE}`, `parite: ${nom}`, `cas: ${cas}`, ''].join('\n');
}

/* --comme-github (critique M6) : ce qui est joué ici doit être ce que GitHub
   jouera. Un clone propre de HEAD — l'historique entier, AUCUN fichier non
   commité, AUCUN node_modules —, `CI=true`, la même commande. */
function commeGithub(argv) {
  const sha = spawnSync('git', ['-C', RACINE, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  const dossier = mkdtempSync(join(existsSync('/tmp') ? '/tmp' : tmpdir(), 'opus-comme-github-'));
  try {
    const c = spawnSync('git', ['clone', '--quiet', '--no-checkout', RACINE, join(dossier, 'depot')], { encoding: 'utf8' });
    const k = spawnSync('git', ['-C', join(dossier, 'depot'), 'checkout', '--quiet', '--detach', sha], { encoding: 'utf8' });
    if (c.status !== 0 || k.status !== 0) { console.error(`✘ Le clone de ${sha} a échoué : ${c.stderr}${k.stderr}`); return 2; }
    console.log(`\nComme GitHub : un clone propre de ${sha.slice(0, 7)}, sans node_modules, CI=true\n`);
    const r = spawnSync('npm', ['run', '--silent', 'essais-sql', '--', ...argv], {
      cwd: join(dossier, 'depot'), env: { ...process.env, CI: 'true' }, stdio: 'inherit',
    });
    return r.status ?? 1;
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === ICI) {
  principal(process.argv.slice(2)).then((code) => process.exit(code), (e) => {
    console.error(`\n✘ Le script a planté : ${e.stack || e}\n`);
    process.exit(2);
  });
}
