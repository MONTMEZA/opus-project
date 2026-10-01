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

const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
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

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Une demande ne peut plus tomber dans un trou. Qu’elle arrive '
  + 'bien sur un iPhone, seul le téléphone le dira.\n');
