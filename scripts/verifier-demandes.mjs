/**
 * LES DEMANDES NE DOIVENT PLUS JAMAIS TOMBER DANS UN TROU.
 *
 * CE QUI S'EST PASSÉ, ET QUI NE DOIT PAS REVENIR
 * ----------------------------------------------
 * Constaté le 01/10/2026, en relisant tout `src/` : `quote_requests`,
 * `callback_requests` et `sos_requests` n'apparaissaient qu'aux TROIS
 * `insert` de `api.js`. On écrivait, on ne relisait jamais. Un client
 * remplissait un formulaire, l'application le remerciait, et la demande
 * disparaissait — pendant qu'un bandeau affirmait « l'artisan est prévenu ».
 *
 * Deux semaines de demandes réelles dormaient ainsi dans la base du
 * propriétaire, dont une du 15 septembre.
 *
 * Le défaut n'était visible NULLE PART : aucune erreur, aucun écran cassé,
 * aucun test rouge. C'est exactement le genre de panne silencieuse qu'un
 * contrôle doit attraper.
 *
 * CE QUI SE VÉRIFIE ICI
 * ---------------------
 *   1. les trois tables sont LUES, pas seulement écrites ;
 *   2. la base prévient toute seule (déclencheur + fonction de lecture) ;
 *   3. l'application ne promet plus ce qu'elle ne tient pas ;
 *   4. le téléphone du COMPTE ne passe jamais par cette porte ;
 *   5. une urgence passe devant le reste.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI : qu'une notification arrive vraiment sur un
 * iPhone. Ça, c'est le téléphone qui le dira.
 *
 *   npm run verifier-demandes
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const fichiers = execFileSync('git',
  /* `--others` : un fichier NEUF, pas encore ajouté à git, échappait à
     tous les contrôles — constaté le 02/10/2026 avec `Ouverture.js`,
     qui est passé vert sans jamais avoir été lu. */
  ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js'));
const lire = (f) => readFileSync(f, 'utf8');
const tout = fichiers.map((f) => [f, lire(f)]);
const schema = lire('supabase/schema.sql');

console.log('\nLes trois tables sont LUES, pas seulement écrites');
{
  /* Le cœur du contrôle. Un `insert` sans `select` nulle part, c'est une
     demande qui tombe dans un trou — et ça ne se voit pas à l'écran. */
  const lecture = tout.filter(([, c]) => /mes_demandes_recues/.test(c));
  verifier('`mes_demandes_recues` est appelée par l’application',
    lecture.length > 0,
    'aucun fichier de src/ ne lit les demandes reçues');

  const ecran = fichiers.includes('src/screens/DemandesRecuesScreen.js');
  verifier('l’écran « Pour moi » existe', ecran);

  const branche = tout.some(([f, c]) => f === 'src/OpusApp.js'
    && /DemandesRecuesScreen/.test(c) && /pourmoi/.test(c));
  verifier('il est branché dans la navigation', branche,
    'un écran qu’on ne peut pas ouvrir ne sert à rien');

  ['accepte', 'refuse', 'termine'].forEach((r) => {
    verifier(`l’artisan peut répondre « ${r} »`,
      /GENRES_DEMANDE/.test(lire('src/lib/api.js'))
      && new RegExp(`${r}:`).test(lire('src/lib/api.js')));
  });
}

console.log('\nLa base prévient toute seule — pas l’écran');
{
  verifier('`notifie_demande()` existe dans schema.sql',
    /create or replace function public\.notifie_demande\(\)/.test(schema));
  ['trg_notifie_devis', 'trg_notifie_rappel', 'trg_notifie_sos'].forEach((t) => {
    verifier(`le déclencheur ${t} est posé`,
      new RegExp(`create or replace trigger ${t}`).test(schema));
  });
  verifier('`mes_demandes_recues()` est `security definer`',
    /create or replace function public\.mes_demandes_recues\(\)[\s\S]{0,900}security definer/.test(schema));
  verifier('…et elle refuse de travailler sans session',
    (schema.match(/auth\.uid\(\) is not null and \w+\.professional_id = auth\.uid\(\)/g) || []).length >= 3,
    'le garde-fou doit couvrir les TROIS origines');

  /* Une fausse notification poussée dans l'état local n'existait que sur le
     téléphone qui l'avait écrite. C'est ce qu'on vient de retirer. */
  const app = lire('src/OpusApp.js');
  verifier('plus aucune fausse notification locale pour un SOS',
    !/id: `sos-\$\{Date\.now\(\)\}`/.test(app),
    'src/OpusApp.js — la base s’en charge désormais');
}

console.log('\nL’application ne promet plus ce qu’elle ne tient pas');
{
  const app = lire('src/OpusApp.js');
  verifier('plus de « est prévenu » affirmé sans preuve',
    !/est prévenu\. Estimation/.test(app),
    'src/OpusApp.js — dire ce qui est vrai, pas ce qui rassure');
  verifier('on annonce la suite, et elle arrive vraiment',
    (app.match(/Vous serez prévenu dès qu'il répond/g) || []).length >= 3,
    'devis, rappel et urgence doivent le dire tous les trois');
}

console.log('\nLe téléphone du COMPTE ne passe pas par cette porte');
{
  /* `users.telephone` a été fermé à tout le monde le 29/09. Le numéro
     affiché à l'artisan est celui que le client a ÉCRIT dans sa demande.
     Les confondre annulerait ce travail sans que personne ne s'en aperçoive. */
  const fn = schema.slice(schema.indexOf('create or replace function public.mes_demandes_recues()'));
  const corps = fn.slice(0, fn.indexOf('$$;') + 3);
  verifier('la fonction ne lit QUE le numéro écrit dans la demande',
    !/u\.telephone/.test(corps),
    'schema.sql — `u.telephone` est le numéro du compte, pas celui de la demande');
  verifier('…et elle ne rend aucune autre colonne de `users` que le nom et la photo',
    (corps.match(/\bu\.\w+/g) || []).every((c) => ['u.nom', 'u.avatar_url', 'u.id'].includes(c)),
    `colonnes lues : ${[...new Set(corps.match(/\bu\.\w+/g) || [])].join(', ')}`);
}

console.log('\nUne urgence passe devant le reste');
{
  const ecran = lire('src/screens/DemandesRecuesScreen.js');
  verifier('le tri est une fonction isolée, donc contrôlable',
    /export function trierDemandes/.test(ecran));
  verifier('une urgence EN ATTENTE remonte en tête',
    /d\.genre === 'sos' && estEnAttente\(d\)/.test(ecran));
  verifier('le métier d’une urgence ne passe pas par `nomMetier`',
    /METIERS_SOS/.test(ecran),
    'sos_requests.metier_key porte « plomberie », pas « plombier » — '
    + 'une clé affichée brute ressemble à une faute de frappe');
}

console.log('\nUne demande déjà vue, une demande pourvue, et une liste bornée');
{
  /* ====================================================================
     LE 04/10/2026, LE PROPRIÉTAIRE : « j'aimerais qu'une demande déjà vue
     n'affiche plus de point sur Découvrir, et un petit texte "vu" serait
     bien ».

     Le point était pire que ça : `demandesVues` était un BOOLÉEN EN
     MÉMOIRE, remis à faux à chaque ouverture de l'application, et il
     s'allumait sur `demandes.length > 0` — sur l'EXISTENCE d'une demande,
     pas sur sa nouveauté. Avec une seule demande vieille de trois semaines
     dans la base, il était allumé en permanence.
     ==================================================================== */
  const sql = lire('supabase/schema.sql');
  const api2 = lire('src/lib/api.js');
  const app2 = lire('src/OpusApp.js');
  const ecran = lire('src/screens/DemandesScreen.js');

  verifier('la dernière visite est retenue PAR LA BASE',
    /demandes_vues_le timestamptz/.test(sql)
    && /demandes_vues_le: new Date\(\)\.toISOString\(\)/.test(api2),
    'un booléen en mémoire repart à zéro à chaque lancement : le point '
    + 'revenait pour des demandes lues dix fois');

  verifier('le point ne s’allume que pour du NEUF',
    /nbDemandesNouvelles > 0/.test(app2)
    && !/!demandesVues && demandes\.length > 0/.test(app2),
    '« il existe une demande » n’est pas « il y a du nouveau »');

  /* LE PIÈGE DE CE LOT : si les badges se calculaient sur l'heure qu'on
     vient d'écrire, ils s'effaceraient SOUS LES YEUX de celui qui ouvre
     l'onglet pour les lire. */
  verifier('les badges « Nouveau » ne s’effacent pas sous les yeux',
    /vuesLe = null/.test(ecran) && /setDemandesVuesMaj\(true\)/.test(app2)
    && /vuesLe=\{demandesVuesLe\}/.test(app2),
    'le POINT s’éteint tout de suite, les BADGES tiennent jusqu’au '
    + 'prochain chargement — ce ne sont pas les mêmes dates');

  /* `statut` valait « ouverte » par défaut depuis le premier jour et RIEN
     ne le lisait. Une demande ne se fermait donc jamais. */
  verifier('une demande pourvue sort de la liste des artisans',
    /statut\.eq\.ouverte/.test(api2) && /changerStatutDemande/.test(api2),
    'c’est la colonne écrite que personne ne relisait — et ce qui '
    + 'transforme une place de marché en cimetière');

  verifier('…et seul son AUTEUR peut la fermer',
    /\.eq\('client_id', currentUserId\)/.test(api2)
    && /estLaMienne\(d\) \? onChangerStatut : null/.test(ecran),
    'la base le tient déjà, mais un bouton qui ne fait rien est pire '
    + 'qu’un bouton absent');

  verifier('le chargement des demandes est BORNÉ',
    /TAILLE_PAGE_DEMANDES/.test(api2),
    'le fil en a une limite, la Place des pros aussi : les demandes '
    + 'téléchargeaient tout');

  /* DÉCIDÉ PAR LE PROPRIÉTAIRE LE 04/10 : une demande s'adresse aux
     artisans. Avant, n'importe qui pouvait la lire SANS COMPTE — texte,
     commune, prénom, et l'adresse des photos. */
  verifier('une demande ne se lit qu’entre son auteur et les pros',
    /create policy "lecture demandes"[\s\S]{0,160}est_un_pro\(\)/.test(sql)
    && !/create policy "lecture demandes visiteur"/.test(sql),
    'la lecture sans compte est supprimée — l’ABSENCE de règle suffit à '
    + 'tout refuser, comme pour `annonces_pro`');

  /* Le mode démonstration doit MONTRER le mécanisme : celui qui lance Opus
     sans fichier `.env` n'a que lui, et c'est aussi le seul endroit où ça
     se vérifie ici. */
  verifier('la démonstration fait vivre le « Nouveau »',
    /deposeeLe: ilYA\(/.test(lire('src/data/demo.js'))
    && /demandesVuesLe: new Date\(Date\.now\(\) - 24/.test(api2),
    'des dates figées dans le fichier seraient « nouvelles » le premier '
    + 'jour puis plus jamais');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Une demande ne peut plus tomber dans un trou. Qu’elle arrive '
  + 'bien sur un iPhone, seul le téléphone le dira.\n');
