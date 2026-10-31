/**
 * SE DÉCONNECTER, C'EST REPARTIR DE ZÉRO.
 *
 * CE QUI S'EST PASSÉ — 17/10/2026, sur l'iPhone du propriétaire
 * -------------------------------------------------------------
 * Il crée un second compte professionnel pour essayer l'inscription par
 * SIRET, s'en déconnecte, revient sur son compte principal — le seul
 * administrateur de la base — et « Administration » a disparu de son
 * profil.
 *
 * La cause : l'application ne demande « suis-je administrateur ? » qu'UNE
 * fois par session (`adminDemande`), et la déconnexion ne remettait pas ce
 * drapeau à zéro. Elle vidait vingt-cinq états à la main ; OpusApp en
 * compte quatre-vingt-dix. En les comparant un par un, pire que le bouton :
 *
 *   - le CARNET DE CLIENTS du compte d'avant restait en mémoire, et le
 *     carnet ne se recharge que s'il est « vide » : le compte suivant
 *     voyait à l'écran les noms, numéros et adresses des clients d'un
 *     autre (section 41 : ce sont des personnes qui n'ont rien accepté) ;
 *   - les DEMANDES REÇUES s'affichaient le temps du rechargement ;
 *   - un BROUILLON de publication (photos choisies, ville) passait au
 *     compte suivant.
 *
 * La base ne laissait rien passer : la RLS a tenu. C'est l'écran qui
 * montrait ce qu'il avait gardé.
 *
 * LA PARADE, ET POURQUOI CE N'EST PAS UNE LISTE PLUS LONGUE
 * ---------------------------------------------------------
 * Une liste écrite à la main oublie toujours le prochain état. `App.js`
 * donne donc à OpusApp une CLÉ qui change à chaque sortie : React démonte
 * et remonte le composant entier — états, références, abonnements. C'est
 * une application qu'on relance, l'animation d'ouverture en moins.
 *
 * CE QUI SE VÉRIFIE ICI
 * ---------------------
 *   1. `App.js` remonte OpusApp à chaque sortie (une clé qui change) ;
 *   2. la déconnexion rend la main à `App.js` au lieu de vider des états ;
 *   3. aucun appelant ne lui glisse un ÉVÉNEMENT d'appui en guise de
 *      message — `onPress={deconnexion}` le ferait ;
 *   4. le message d'après suppression de compte passe PAR la déconnexion,
 *      et pas par un bandeau posé sur l'instance qui s'en va.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI : le remontage lui-même. Il se vérifie au
 * navigateur (se connecter, ouvrir un écran, se déconnecter, revenir) et,
 * pour le bouton « Administration », avec le seul compte administrateur
 * de la vraie base.
 *
 *   npm run verifier-sortie
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Un contrôle qui lit du code retire d'abord les commentaires : celui-ci
   EXPLIQUE `onPress={deconnexion}` dans une phrase, et le lui reprocher
   serait la cinquième fois qu'un contrôle accuse sa propre documentation. */
function sansCommentaires(source) {
  let dedans = null;
  let sortie = '';
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const suivant = source[i + 1];
    if (!dedans && c === '/' && suivant === '/') { dedans = 'ligne'; }
    else if (!dedans && c === '/' && suivant === '*') { dedans = 'bloc'; }
    else if (dedans === 'ligne' && c === '\n') { dedans = null; }
    else if (dedans === 'bloc' && c === '*' && suivant === '/') {
      dedans = null; sortie += '  '; i += 1; continue;
    }
    sortie += dedans && c !== '\n' ? ' ' : c;
  }
  return sortie;
}

const lire = (f) => readFileSync(f, 'utf8');
const racine = sansCommentaires(lire('App.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));

/** Le corps d'une fonction fléchée `const nom = async (…) => { … };`. */
function corps(source, nom) {
  const debut = source.search(new RegExp(`const ${nom} = (async )?\\([^)]*\\) => \\{`));
  if (debut < 0) return '';
  const ouvrante = source.indexOf('{', debut);
  let profondeur = 0;
  for (let i = ouvrante; i < source.length; i += 1) {
    if (source[i] === '{') profondeur += 1;
    else if (source[i] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(ouvrante, i + 1);
    }
  }
  return '';
}

console.log('\n1. App.js remonte OpusApp à chaque sortie');
{
  const balise = (racine.match(/<OpusApp\b[^>]*\/>/) || [''])[0];
  verifier('OpusApp porte une clé', /\bkey=\{(\w+)\}/.test(balise),
    `balise trouvée : ${balise || '(aucune)'}`);
  const cle = (balise.match(/\bkey=\{(\w+)\}/) || [])[1];
  verifier('…qui est un état d’App.js',
    !!cle && new RegExp(`const \\[${cle}, (set\\w+)\\] = React\\.useState\\(`).test(racine));
  const setter = cle && (racine.match(new RegExp(`const \\[${cle}, (set\\w+)\\]`)) || [])[1];
  const sortir = (racine.match(/const sortir = React\.useCallback\(\(([^)]*)\) => \{([\s\S]*?)\}, \[\]\)/) || []);
  verifier('…et que `sortir` fait CHANGER (sinon React ne remonte rien)',
    !!setter && !!sortir[2] && new RegExp(`${setter}\\(\\((\\w+)\\) => \\1 \\+ 1\\)`).test(sortir[2]),
    'une clé qui garde sa valeur ne démonte rien : la déconnexion ne viderait plus aucun état.');
  verifier('OpusApp reçoit `onSortie={sortir}`', /onSortie=\{sortir\}/.test(balise));
  verifier('…et le message à afficher en arrivant', /messageInitial=\{\w+\}/.test(balise));
}

console.log('\n2. La déconnexion rend la main au lieu de vider des états');
{
  verifier('OpusApp accepte `onSortie`',
    /export default function OpusApp\(\{[^}]*\bonSortie\b[^}]*\}\)/.test(app));
  const deco = corps(app, 'deconnexion');
  verifier('`deconnexion` existe', deco.length > 0);
  verifier('…ferme la session', /api\.signOut\(\)/.test(deco));
  verifier('…et appelle `onSortie`', /\bonSortie\(/.test(deco));
  const ordre = deco.indexOf('api.signOut') < deco.indexOf('onSortie(');
  verifier('…APRÈS la fermeture de session', ordre,
    'remonter avant de fermer la session : la nouvelle instance la retrouverait ouverte et rentrerait aussitôt.');
  /* LES PHOTOS GARDÉES SUR LE TÉLÉPHONE (seconde relecture du 31/10,
     R2-APP-1) : la politique de confidentialité promet qu'elles sont
     « effacées elles aussi à la déconnexion ». Seules deux lignes de
     `deconnexion` tiennent cette promesse : tant que le texte la fait, ces
     deux lignes doivent y être, ATTENDUES, et AVANT de rendre la main. */
  const { CONFIDENTIALITE } = await import('../src/data/legal.js');
  const cookies = (CONFIDENTIALITE.find((b) => b.titre === 'Cookies et traceurs') || { texte: '' }).texte;
  const promet = /effacées elles\s+aussi à la déconnexion/.test(cookies);
  const iDisque = deco.indexOf('await Image.clearDiskCache()');
  const iMemoire = deco.indexOf('await Image.clearMemoryCache()');
  verifier('la politique promet l’effacement des photos à la déconnexion (sinon cette garde n’a plus d’objet)', promet,
    'si la phrase change, cette vérification et la suivante changent AVEC elle.');
  verifier('…et `deconnexion` ATTEND l’effacement des deux caches d’images AVANT de rendre la main',
    !promet || (iDisque > 0 && iMemoire > 0 && iDisque < deco.indexOf('onSortie(') && iMemoire < deco.indexOf('onSortie(')
      && /^import \{[^}]*\bImage\b[^}]*\} from 'expo-image';$/m.test(app)));
  const setters = deco.match(/\bset[A-Z]\w*\(/g) || [];
  verifier('…sans revenir à une liste d’états vidés à la main', setters.length === 0,
    `trouvé : ${setters.join(', ')} — une liste à la main oublie toujours le prochain état.`);
  verifier('…et ne laisse passer qu’un TEXTE comme message',
    /typeof message === 'string'/.test(deco));
}

console.log('\n3. Aucun appelant ne glisse un événement d’appui en guise de message');
{
  const nues = app.match(/=\{\s*deconnexion\s*\}/g) || [];
  verifier('aucun `={deconnexion}` passé tel quel', nues.length === 0,
    'un Pressable passe son ÉVÉNEMENT en premier argument : il deviendrait le « message » de l’instance suivante.');
  const appels = [...app.matchAll(/deconnexion\(([^)]*)\)/g)].map((m) => m[1].trim());
  const permis = appels.every((a) => a === '' || /^'[^']*'$/.test(a) || a === 'e.message');
  verifier('chaque appel passe rien, un texte écrit, ou le message d’une erreur', permis,
    `appels : ${appels.map((a) => `deconnexion(${a})`).join(', ')}`);
}

console.log('\n4. Le message d’après suppression passe PAR la déconnexion');
{
  const supp = corps(app, 'supprimerMonCompte');
  verifier('`supprimerMonCompte` existe', supp.length > 0);
  verifier('le « compte supprimé » est remis à la déconnexion',
    /deconnexion\('Votre compte a été supprimé/.test(supp));
  verifier('aucun bandeau posé après la déconnexion (il partirait avec l’instance)',
    !/deconnexion\([^)]*\);?\s*\n\s*showBanner\(/.test(supp));
  verifier('OpusApp naît avec ce bandeau quand il y en a un',
    /useState\(\s*\(\) => \(messageInitial \?/.test(app));

  /* Le bandeau ne vivait que dans l'application CONNECTÉE : le message
     d'après suppression, adressé par définition à quelqu'un de déconnecté,
     n'était jamais affiché. Trouvé au navigateur le 17/10/2026. */
  const debut = app.indexOf('if (!userType) {');
  const branche = debut < 0 ? '' : app.slice(debut, app.indexOf('const showBack', debut));
  verifier('…et l’écran d’accueil sait l’afficher (branche « pas de compte »)',
    /<ConfirmBanner\b/.test(branche),
    'sans lui, « Votre compte a été supprimé » est écrit, annoncé à VoiceOver, et jamais vu.');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Se déconnecter remonte l’application entière : rien du compte '
  + 'd’avant ne reste à l’écran pour le suivant.\n');
