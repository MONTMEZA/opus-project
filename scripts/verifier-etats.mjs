/**
 * LES QUATRE ÉTATS QU'ON OUBLIE : vide, en cours, cassé, et SANS RÉSEAU.
 *
 * CE QUE L'AUDIT DU 01/10/2026 A TROUVÉ
 * ------------------------------------
 * L'application savait très bien dire « ça a marché ». Elle ne savait pas
 * dire le reste :
 *
 *   - **elle mentait en mode démonstration.** Sans fichier `.env`,
 *     `api.js` remplace chaque écriture par rien — et l'écran répondait
 *     « Votre publication est en ligne ». `api.mode` valait `'demo'`
 *     depuis le début et n'était LU nulle part. C'est la panne qui a
 *     laissé passer le format `montage` refusé par la base pendant
 *     plusieurs jours ;
 *   - **un échec s'affichait en vert, avec une coche** — trois appels à
 *     `showBanner` sans le drapeau d'erreur ;
 *   - **les messages d'erreur sortaient en anglais**, tels que Supabase les
 *     écrit. La traduction existait, enfermée dans `AuthScreen.js` ;
 *   - **sans réseau, l'application renvoyait à « Choisissez votre
 *     profil »** : un artisan déjà connecté se retrouvait devant l'écran
 *     d'accueil comme s'il n'avait pas de compte ;
 *   - **un message qui n'était pas parti ressemblait à un message envoyé** ;
 *   - **la fiche d'un artisan annonçait « Aucun avis »** pendant qu'elle
 *     chargeait — sur un artisan qui en a trente ;
 *   - **tirer vers le bas ne faisait rien**, sauf sur le fil.
 *
 * Aucun de ces défauts ne faisait planter quoi que ce soit. C'est bien le
 * problème : ils se voient à l'usage, jamais dans un journal d'erreurs.
 *
 *   npm run verifier-etats
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
/* Un contrôle qui lit du code retire d'abord les commentaires : sinon il
   accuse la documentation qui EXPLIQUE le défaut (CLAUDE.md, lot 8). */
const sansCommentaires = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const app = lire('src/OpusApp.js');
const ui = lire('src/components/ui.js');

console.log('\nLe mode démonstration ne peut plus se faire passer pour la réalité');
{
  verifier('une bande permanente le dit', /export function BandeDemo/.test(ui));
  verifier('…et elle est posée dans l’application',
    /<BandeDemo visible=\{api\.mode === 'demo'\}/.test(app),
    'src/OpusApp.js — `api.mode` était calculé puis jamais lu');
  verifier('le message de publication dit la vérité selon le mode',
    /api\.mode === 'demo' \? \{[\s\S]{0,400}rien n’est enregistré/.test(app),
    '« Votre publication est en ligne » était FAUX sans .env');
}

console.log('\nUn échec ne s’affiche plus comme une réussite');
{
  /* `showBanner` sans second argument sort en VERT, avec une coche. Un
     message qui annonce un échec ne doit jamais passer par là. */
  const suspects = [...app.matchAll(/showBanner\(([^;]*?)\);/gs)]
    .map((m) => m[1])
    .filter((arg) => /non enregistr|impossible|échou|echou|erreur|pas pu/i.test(arg));
  verifier('aucun échec annoncé par `showBanner`',
    suspects.length === 0,
    suspects.map((x) => x.replace(/\s+/g, ' ').slice(0, 90)).join('\n      '));
}

console.log('\nLes erreurs sont en français, et disent quoi faire');
{
  verifier('`src/lib/erreurs.js` existe', fichiers.includes('src/lib/erreurs.js'));
  const err = lire('src/lib/erreurs.js');
  verifier('le cas du RÉSEAU est traité', /estUnProblemeDeReseau/.test(err)
    && /pas de connexion/i.test(err));
  verifier('le cas de la SESSION EXPIRÉE est traité', /estUneSessionExpiree/.test(err));
  verifier('une contrainte refusée renvoie à `schema.sql`',
    /violates check constraint/.test(err) && /schema\.sql/.test(err),
    'c’est la panne du format « montage » : la base refuse, personne ne sait pourquoi');
  verifier('le motif technique n’est jamais jeté quand on ne sait pas traduire',
    /return brut \? /.test(err));

  /* On cherche ce qui part À L'ÉCRAN, pas tout usage de `e.message`.
     `storage.js` s'en sert pour NOMMER l'étape qui a lâché
     (« [envoi vers Supabase] … ») — c'est l'inverse d'un message brut :
     ça enrichit la cause, et c'est `messageClair` qui l'affiche ensuite. */
  const AFFICHE = /(showErreur|showBanner|setErreur|onErreur)\([^;]{0,200}?(\$\{e\.message \|\| e\}|\(e && e\.message\) \|\|)/s;
  const brut = fichiers.filter((f) => f !== 'src/lib/erreurs.js')
    .filter((f) => AFFICHE.test(lire(f)));
  verifier('plus aucun message d’erreur brut montré à l’utilisateur',
    brut.length === 0,
    `${brut.join(', ')}\n      → passe par messageClair()`);
}

console.log('\nSans réseau, l’application s’ouvre quand même');
{
  const api = lire('src/lib/api.js');
  verifier('le type de compte se lit dans les métadonnées, sans réseau',
    /user_metadata/.test(api) && /export async function sessionLocale/.test(api),
    'la requête qui cherchait le type de compte a besoin du réseau');
  verifier('on entre AVANT de charger',
    app.indexOf("setScreen('home');") < app.indexOf('api.loadAll()')
    && app.indexOf("await api.ensureSession(type);") < app.indexOf("setScreen('home');"),
    'sinon un échec de chargement renvoie à « Choisissez votre profil »');
  /* UNE REQUÊTE QUI NE REVIENT JAMAIS N'ATTEINT JAMAIS LE `catch`.
     Sans délai, l'application restait figée sur son squelette de démarrage
     pour toujours : l'écran avait l'air vivant, et on finissait par fermer
     l'application. Mesuré en coupant la liaison le 01/10/2026. */
  /* Le délai est désormais DANS `avecReprise`, qui l'applique aux deux
     essais. On vérifie donc les deux bouts : que le démarrage y passe, et
     qu'`avecReprise` s'appuie bien sur `avecDelai` — sinon la reprise
     aurait réintroduit l'attente infinie par la porte de derrière. */
  verifier('le démarrage porte un délai',
    /avecReprise\(\(\) => api\.loadAll\(\)/.test(app)
    && /avecDelai\(faire\(\), 12000, quoi\)/.test(lire('src/lib/erreurs.js')),
    'src/OpusApp.js — sinon une base muette fige l’application');
  verifier('la session se lit d’abord SANS réseau',
    /await api\.sessionLocale\(\)/.test(app) && /export async function sessionLocale/.test(lire('src/lib/api.js')),
    'le type de compte est dans les métadonnées, déjà sur le téléphone');
  verifier('et `setDemarrage(false)` est dans un `finally`',
    /finally \{[\s\S]{0,400}setDemarrage\(false\)/.test(app));

  verifier('une bande « pas de connexion » avec un bouton Réessayer',
    /export function BandeHorsLigne/.test(ui) && /onReessayer/.test(ui));
  verifier('…et elle est posée dans l’application',
    /<BandeHorsLigne/.test(app) && /raison=\{echecChargement\}/.test(app));
}

console.log('\nUn message qui n’est pas parti se voit, et se renvoie');
{
  verifier('chaque message porte son état',
    /etat: 'envoi'/.test(app) && /majEtat\('envoye'\)/.test(app) && /majEtat\('echec'\)/.test(app));
  verifier('on peut le renvoyer sans le retaper',
    /const renvoyerMessage/.test(app));
  const conv = lire('src/screens/ConversationScreen.js');
  verifier('la bulle le montre',
    /m\.etat === 'envoi'/.test(conv) && /m\.etat === 'echec'/.test(conv));
  verifier('et elle reste lisible en échec',
    /bubbleEchec/.test(conv),
    'griser au point de ne plus pouvoir relire serait pire');
}

console.log('\nOn ne dit pas « il n’y a rien » pendant qu’on cherche');
{
  const fiche = lire('src/screens/ProfilProScreen.js');
  verifier('la fiche d’un artisan attend d’être complète pour dire « aucun avis »',
    /\{charge && reviews\.length === 0/.test(fiche));
  verifier('…et montre la forme de ce qui arrive',
    /SqueletteAvis/.test(fiche) && /SquelettePortfolio/.test(fiche));
  verifier('le drapeau vient de l’application',
    /charge=\{!!pros\[viewedProId\]\.portfolioCharge\}/.test(app));
}

console.log('\nTirer vers le bas marche partout');
{
  const ecrans = [
    'src/screens/HomeScreen.js',
    'src/screens/NotificationsScreen.js',
    'src/screens/MessagesScreen.js',
    'src/screens/DemandesScreen.js',
    'src/screens/PlaceProScreen.js',
  ];
  ecrans.forEach((f) => {
    verifier(`${f.split('/').pop()} se rafraîchit`, /RefreshControl/.test(lire(f)));
  });
  verifier('un rafraîchissement réussi éteint la bande « pas de connexion »',
    /const rafraichirEcran[\s\S]{0,900}setEchecChargement\(null\)/.test(app));
}

console.log('\nLe bandeau d’erreur reste lisible');
{
  /* LE PIÈGE : un composant animé de Reanimated ignore SILENCIEUSEMENT un
     style en forme de fonction. Le bandeau s'est retrouvé sans aucun style
     — texte blanc sur fond beige — et c'est le seul canal par lequel
     l'application parle. Trouvé en coupant le réseau, pas en lisant. */
  verifier('aucun style en forme de fonction sur un composant animé',
    !/<Animated\.\w+[^>]*style=\{\(\{ pressed \}\)/s.test(ui)
    && !/<BandeauAnime[^>]*style=\{\(\{ pressed \}\)/s.test(ui),
    'src/components/ui.js — Reanimated ignore `style={({pressed}) => …}` sans rien dire');
  verifier('le bandeau garde son fond', /style=\{s\.bannerPort\}/.test(ui)
    && /\[s\.banner, erreur && s\.bannerErreur/.test(ui));
}

console.log('\nUne photo qui ne charge pas ne laisse plus un trou');
{
  const media = lire('src/components/Media.js');
  verifier('il y a une matière sous la photo', /backgroundColor: C\.line \}, style\]/.test(media));
  verifier('et la vue n’est pas réutilisée pour la voisine', /recyclingKey=\{media\}/.test(media));
}

console.log('\nUn serveur qui se réveille n’est pas un serveur en panne');
{
  /* Constaté le 02/10/2026 sur la vraie base : la couche API de Supabase a
     redémarré pendant que le propriétaire essayait l'application. Aucune
     requête refusée, personne au bout du fil — et « Le chargement a
     échoué ». Rouvrir l'application a suffi ; or rouvrir, côté réseau,
     c'est exactement redemander. On le fait donc tout seul, UNE fois.
     Ce contrôle ne lit pas le code : il FAIT TOURNER la fonction. */
  const { avecReprise } = await import('../src/lib/erreurs.js');
  const app = lire('src/OpusApp.js');

  verifier('le démarrage passe par `avecReprise`',
    /const data = await avecReprise\(\(\) => api\.loadAll\(\)/.test(app),
    'src/OpusApp.js — sinon un redémarrage du serveur ressemble à une panne');

  let n = 0;
  const r = await avecReprise(() => {
    n += 1;
    return n === 1 ? Promise.reject(new Error('Failed to fetch')) : Promise.resolve('le fil');
  }, { pause: 60 });
  verifier('un échec réseau se retente, et le second essai passe',
    r === 'le fil' && n === 2, `${n} essai(s), « ${r} »`);

  let m = 0;
  let leve = false;
  try {
    await avecReprise(() => { m += 1; return Promise.reject(new Error('Network request failed')); },
      { pause: 20 });
  } catch (e) { leve = true; }
  verifier('…mais une seule fois : au second échec on le DIT',
    m === 2 && leve, `${m} essai(s)`,);

  for (const [quoi, faire] of [
    ['un droit refusé', () => Promise.reject(new Error('permission denied for table users'))],
    ['une contrainte refusée', () => {
      const e = new Error('new row violates check constraint');
      e.code = '23514';
      return Promise.reject(e);
    }],
  ]) {
    let k = 0;
    try { await avecReprise(() => { k += 1; return faire(); }, { pause: 20 }); } catch (e) { /* attendu */ }
    verifier(`${quoi} ne se retente pas`, k === 1,
      'la base a RÉPONDU — insister n’ajoute que de l’attente à une mauvaise nouvelle');
  }

  let p = 0;
  const t = Date.now();
  await avecReprise(() => { p += 1; return Promise.resolve(1); }, { pause: 3000 });
  verifier('quand tout va bien : un seul appel, aucune attente ajoutée',
    p === 1 && Date.now() - t < 200);
}

/* ==================================================================
   LA CONSULTATION D'UN SIRET — 15/10/2026 (section 45)

   Le moment précis où il ne faut SURTOUT PAS accuser le numéro : un
   artisan dans une cave qui lit « numéro introuvable » recommence dix
   fois un numéro juste. Mesuré par la relecture du plan en faisant tourner
   `messageClair` sur les VRAIES erreurs de `functions-js` : l'écran
   affichait « Failed to send a request to the Edge Function ».

   Ce bloc FAIT TOURNER le code — `erreurs.js`, `siret-demo.js`,
   `entreprise.js` n'importent ni React ni React Native — sur les classes
   d'erreur RÉELLES du paquet installé, pas sur des imitations.
   ================================================================== */
console.log('\nUne consultation qui n’aboutit pas n’accuse jamais le numéro');
{
  const { createRequire } = await import('node:module');
  const exiger = createRequire(import.meta.url);
  const {
    FunctionsFetchError, FunctionsHttpError, FunctionsRelayError,
  } = exiger('@supabase/functions-js');
  const { messageClair, issueDeVerification } = await import('../src/lib/erreurs.js');

  const sansReseau = new FunctionsFetchError(new TypeError('Network request failed'));
  const interrompue = new FunctionsFetchError(Object.assign(new Error('aborted'), { name: 'AbortError' }));
  const panne = new FunctionsHttpError({ status: 500 });
  const relais = new FunctionsRelayError({ status: 502 });

  verifier('pas de réseau → « reseau »', issueDeVerification(sansReseau, 300).issue === 'reseau');
  verifier('délai dépassé (AbortError) → « lent »', issueDeVerification(interrompue, 300).issue === 'lent',
    'invoke() interrompt lui-même au bout de `timeout` et le rend en FunctionsFetchError');
  verifier('…et même sans son nom, au bout de quinze secondes → « lent »',
    issueDeVerification(new FunctionsFetchError({}), 15000, 15000).issue === 'lent');
  verifier('une réponse non-2xx → « service_indisponible »',
    issueDeVerification(panne, 200).issue === 'service_indisponible');
  verifier('…et le relais aussi', issueDeVerification(relais, 200).issue === 'service_indisponible');

  const anglais = /Edge Function|non-2xx|Relay Error|Failed to send/;
  verifier('messageClair ne rend jamais l’anglais de functions-js',
    [sansReseau, panne, relais].every((e) => !anglais.test(messageClair(e, 'Vérification'))),
    [sansReseau, panne, relais].map((e) => messageClair(e, 'Vérification')).join(' | '));
  /* Insensible à la casse depuis le 18/10/2026 : appelée SANS sujet, la
     phrase prend désormais sa majuscule (« Pas de connexion. »), au lieu
     d'ouvrir une phrase par une minuscule. Ce qui est vérifié ici, c'est
     qu'on parle de RÉSEAU, pas la casse de la première lettre. */
  verifier('…et une fonction injoignable est reconnue comme une perte de réseau',
    /pas de connexion/i.test(messageClair(sansReseau)));

  /* LE CORPS D'UNE RÉPONSE NON-2xx — 18/10/2026. `invoke()` ne le lit pas :
     la fonction `ai` disait « L'assistant n'est accessible qu'une fois
     connecté », l'écran affichait « Edge Function returned a non-2xx status
     code ». On le fait tourner sur de VRAIES réponses HTTP (`Response`,
     celle de Node), enveloppées par les vraies classes du paquet. */
  const { messageDeFonctionEdge } = await import('../src/lib/erreurs.js');
  const reponse = (statut, corps) => new FunctionsHttpError(new Response(corps, { status: statut }));
  const phraseServeur = "L'assistant n'est accessible qu'une fois connecté. Reconnectez-vous.";
  const lus = {
    francais: await messageDeFonctionEdge(reponse(401, JSON.stringify({ error: phraseServeur }))),
    limite: await messageDeFonctionEdge(reponse(429, JSON.stringify({ error: 'Vous avez atteint la limite' }))),
    /* Le corps EXACT relevé le 18/10 sur la vraie passerelle, avec un jeton
       invalide : elle refuse avant que la fonction ne tourne. */
    passerelle: await messageDeFonctionEdge(reponse(401,
      JSON.stringify({ code: 'UNAUTHORIZED_LEGACY_JWT', message: 'Invalid JWT' }))),
    pasDuJson: await messageDeFonctionEdge(reponse(500, '<html>Internal Server Error</html>')),
    reseau: await messageDeFonctionEdge(sansReseau),
  };
  verifier('la phrase du serveur arrive à l’écran, même en 401',
    lus.francais === phraseServeur, lus.francais);
  verifier('…et en 429', lus.limite === 'Vous avez atteint la limite', lus.limite);
  verifier('un 401 de la passerelle (jeton expiré, en anglais) → la session',
    /session a expiré/.test(lus.passerelle) && !/Invalid JWT/.test(lus.passerelle), lus.passerelle);
  verifier('un corps illisible → une panne d’Opus, en français',
    /service d’Opus/.test(lus.pasDuJson) && !anglais.test(lus.pasDuJson), lus.pasDuJson);
  verifier('…et sans réseau → « pas de connexion »', /pas de connexion/i.test(lus.reseau), lus.reseau);
  verifier('aucune des cinq ne rend l’anglais de functions-js',
    Object.values(lus).every((m) => !anglais.test(m) && !/Invalid JWT|Internal Server/.test(m)));

  /* Et une erreur de l'assistant, déjà traduite, ne repasse pas par les
     règles du réseau : « timeout » dans une phrase du serveur ne dit pas
     que le téléphone est hors ligne. */
  const dejaTraduite = Object.assign(new Error('Le service a dépassé son délai (timeout). Réessayez.'),
    { name: 'ErreurAssistant' });
  verifier('messageClair rend telle quelle une erreur de l’assistant',
    messageClair(dejaTraduite, "L'agent n'a pas pu écrire ce récit") === dejaTraduite.message,
    messageClair(dejaTraduite, "L'agent n'a pas pu écrire ce récit"));

  const gotrue = messageClair(new Error('Database error saving new user'));
  verifier('« Database error saving new user » dit quoi faire, en français',
    /n’a pas été créé/.test(gotrue) && /« Vérifier »/.test(gotrue), gotrue);

  const codes = ['OP004', 'OP005', 'OP006', 'OP007', 'OP008', 'OP009', 'OP010'];
  verifier('les refus de la base (OP004 à OP010) sont rendus TELS QUELS',
    codes.every((c) => messageClair(Object.assign(new Error(`Texte ${c} — permission`), { code: c }), 'X')
      === `Texte ${c} — permission`),
    'la base écrit déjà la phrase, en français, avec le geste à faire ; la '
    + 'reformuler ici serait écrire la même règle deux fois');

  const deja = messageClair(new Error('User already registered'));
  verifier('« already registered » n’enferme pas dans « connectez-vous »',
    /Se connecter/.test(deja) && /professionnel/.test(deja), deja);
}

console.log('\nLa démonstration fait vivre CHAQUE issue, sans un vrai SIRET');
{
  const {
    SIRETS_DEMO, reponseDemo, IDENTITE_DEMO_DU_PRO,
  } = await import('../src/data/siret-demo.js');
  const { cleSiretValide, ISSUES } = await import('../src/lib/siret.js');

  verifier('chaque numéro d’essai passe la clé de contrôle',
    SIRETS_DEMO.every((l) => cleSiretValide(l.siret)),
    'sinon l’écran le refuserait avant même de « demander », et l’issue ne se verrait pas');
  verifier('…et ils sont tous différents',
    new Set(SIRETS_DEMO.map((l) => l.siret)).size === SIRETS_DEMO.length);
  verifier('…et ce sont des numéros FICTIFS (cinq zéros en tête)',
    SIRETS_DEMO.every((l) => l.siret.startsWith('00000')),
    'un vrai SIRET affiché en exemple dans une application, c’est l’usurpation que ce lot ferme');

  /* Distincts de ceux des essais SQL : un numéro partagé ferait croire que
     l'un éprouve l'autre. On les relit dans les fichiers, on ne les recopie
     pas ici. */
  const essais = new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'supabase'],
    { encoding: 'utf8' }).split('\n').filter((f) => /essais-.*\.sql$/.test(f))
    .flatMap((f) => lire(f).match(/\b\d{14}\b/g) || []));
  const partages = SIRETS_DEMO.filter((l) => essais.has(l.siret)).map((l) => l.siret);
  verifier(`…et aucun n’est un SIRET des essais SQL (${essais.size} relevés)`,
    essais.size > 10 && partages.length === 0, partages.join(', '));

  const attendues = ISSUES.filter((i) => i !== 'mal_forme');
  const couvertes = new Set(SIRETS_DEMO.map((l) => l.issue));
  verifier('toutes les issues ont leur numéro (sauf « mal_forme », que la clé suffit à produire)',
    attendues.every((i) => couvertes.has(i)),
    `manquent : ${attendues.filter((i) => !couvertes.has(i)).join(', ')}`);

  const pris = [IDENTITE_DEMO_DU_PRO.siren];
  verifier('chaque numéro rend SON issue',
    SIRETS_DEMO.every((l) => reponseDemo(l.siret, pris).issue === l.issue),
    SIRETS_DEMO.filter((l) => reponseDemo(l.siret, pris).issue !== l.issue)
      .map((l) => `${l.siret} → ${reponseDemo(l.siret, pris).issue}`).join(', '));
  const ferme = SIRETS_DEMO.find((l) => l.issue === 'etablissement_ferme');
  verifier('« Utiliser ce numéro » mène à une entreprise trouvée',
    reponseDemo(reponseDemo(ferme.siret, pris).siret_ouvert, pris).issue === 'ok');
  verifier('une clé fausse rend « mal_forme », un numéro inconnu « introuvable »',
    reponseDemo('00000400200011').issue === 'mal_forme'
    && reponseDemo('00000504100017').issue === 'introuvable');
  const ok = SIRETS_DEMO.find((l) => l.issue === 'ok');
  verifier('FIDÈLE à la fonction Edge : une entreprise rattachée à un AUTRE rend « deja_utilise »',
    reponseDemo(ok.siret, [ok.siret.slice(0, 9)]).issue === 'deja_utilise',
    'une démonstration plus aimable que le serveur masquerait ce que l’artisan '
    + 'rencontrera pour de vrai');
  /* …et, depuis le 15/10, la fonction Edge reconnaît la fiche de
     l'APPELANT : sa propre entreprise ne lui répond plus « déjà utilisé »
     — sans quoi « Mon entreprise → Mettre à jour » n'avait aucun chemin de
     réussite (relecture adverse). Les numéros marqués `aMoi` le montrent. */
  const aMoi = SIRETS_DEMO.filter((l) => l.aMoi);
  verifier('…et pour SA propre entreprise, ses numéros rendent ce que le répertoire dirait',
    aMoi.length >= 2 && aMoi.every((l) => reponseDemo(l.siret, []).issue === l.aMoi)
    && aMoi.every((l) => reponseDemo(l.siret, [l.siret.slice(0, 9)]).issue === 'deja_utilise')
    && aMoi.every((l) => !('adresse' in (reponseDemo(l.siret, []).identite || {}))),
    'un nouvel établissement de sa propre entreprise : « ok » pour lui, « déjà utilisé » '
    + 'pour tout autre — et jamais l’adresse, que la fonction Edge ne rend pas');
}

/* LE MOT « VÉRIFIÉ », ENFIN VU — corrigé avec « Mon entreprise » (lot 0a
   du devis, 18/10/2026).

   Le motif d'avant, `/v[ée]rifi[ée]e?s?\b/i`, NE VOYAIT PAS « vérifié » :
   `\b` est une limite de mot au sens ASCII, et « é » n'y est pas une
   lettre. Mesuré : `/v[ée]rifi[ée]e?s?\b/i.test('le badge « vérifié »')`
   rend `false`. Ce contrôle passait donc au vert depuis le 15/10 sur le
   mot même qu'il devait interdire — la onzième fois dans ce projet qu'un
   contrôle rend le bon résultat pour la mauvaise raison.

   Le motif juste borne le mot par « ce qui n'est ni une lettre ni un
   souligné » (`(?![\p{L}_])`, avec le drapeau `u`) : « Vérifier », nom
   d'un bouton, et « vérification » restent permis ; `verifie_le`, nom de
   colonne, aussi. UNE SEULE exception, écrite : « badge « vérifié » », le
   NOM du badge, qu'emploie `IdentiteEntreprise.js` pour dire qu'une fiche
   badgée n'a pas de porte. */
const VERIFIE = /v[ée]rifi[ée]e?s?(?![\p{L}_])/iu;
const sansNomDuBadge = (t) => String(t).replace(/badge « vérifié »/g, '');

console.log('\nCe que l’écran dit d’une entreprise : jamais « vérifiée », jamais « registre »');
{
  const ent = await import('../src/lib/entreprise.js');
  const { reponseDemo, SIRETS_DEMO } = await import('../src/data/siret-demo.js');
  const identites = SIRETS_DEMO.filter((l) => l.issue === 'ok')
    .map((l) => reponseDemo(l.siret).identite);
  const phrases = identites.flatMap((id) => [
    ent.nomDeLEntreprise(id) || ent.titreSansNom(id), ent.ligneForme(id), ent.ligneEtablissement(id),
    ent.ligneSiret(id), ent.texteSource(id), ent.resumeEntreprise({ ...id, verifie_le: '2026-10-15' }),
    ent.propositionMetiers(id).phrase || '',
  ]).concat([ent.AIDE_NOM_EI, ent.AIDE_VILLE, ent.resumeEntreprise(null),
    ent.resumeEntreprise({ source: 'administration', verifie_le: '2026-10-15' })]);
  /* « vérifié(e) » est le mot du BADGE ; « Vérifier », le nom d'un bouton,
     reste permis. Le motif vise le statut, pas le verbe. */
  const interdites = phrases.filter((t) => VERIFIE.test(sansNomDuBadge(t)) || /registre/i.test(t));
  verifier('aucune phrase ne dit « vérifié(e) » ni « registre »',
    phrases.length > 15 && interdites.length === 0, interdites.join(' | '));
  /* Ni « certifié », « agréé » ou « validé par l'État » — sauf dans la
     phrase qui le NIE (« ni un agrément ni une validation par l’État »),
     qu'on retire avant de chercher (relecture adverse du 15/10). */
  const cautions = phrases.map((t) => t.replace(/ni un agrément ni une validation par l’État/g, ''))
    .filter((t) => /certifi|agré[ée]|agrément|validée? par l.(État|INSEE)|validation par l.(État|INSEE)/i.test(t));
  verifier('…ni « certifié », « agréé », « validé par l’État » — hors la phrase qui le nie',
    cautions.length === 0, cautions.join(' | '));
  verifier('la source cite www.insee.fr ET la date de mise à jour',
    identites.every((id) => /www\.insee\.fr/.test(ent.texteSource(id))
      && /\d{2}\/\d{2}\/\d{4}/.test(ent.texteSource(id))),
    'la Licence Ouverte de l’INSEE exige les deux');
  /* …et quand le répertoire n'en publie PAS (`date_mise_a_jour_insee` est
     facultative) : la phrase le dit, au lieu d'un trou. Toutes les identités
     de démonstration avaient une date : sans ce cas fabriqué, rien ne
     l'éprouvait (relecture adverse du 15/10). */
  const sansDate = ent.texteSource({ ...identites[0], maj_insee: null });
  verifier('…et dit « date de mise à jour non publiée » quand le répertoire n’en donne pas',
    /date de mise à jour non publiée/.test(sansDate) && !/null|undefined/.test(sansDate), sansDate);
  verifier('…et dit que ce n’est ni un agrément ni une validation par l’État',
    /ni un agrément ni une validation par l’État/.test(ent.texteSource(identites[0])));
  verifier('un entrepreneur sans nom commercial ne reçoit AUCUN nom prérempli',
    identites.some((id) => id.est_ei && !id.nom_commercial)
    && identites.filter((id) => id.est_ei && !id.nom_commercial)
      .every((id) => ent.entreprisePreremplie(id) === '')
    /* …et MÊME si une dénomination arrivait pour un EI : c'est alors son nom
       civil, et le champ « entreprise » s'affiche sur sa fiche publique. Les
       identités de démonstration n'en portent pas — sans ce cas fabriqué, la
       règle ne serait éprouvée par rien (sabotage du 15/10, passé au vert). */
    && ent.entreprisePreremplie({ est_ei: true, denomination: 'DUPONT JEAN', nom_commercial: null }) === ''
    && ent.entreprisePreremplie({ est_ei: true, denomination: 'DUPONT JEAN', nom_commercial: 'Toits du Sud' })
      === 'Toits du Sud',
    'le répertoire ne connaît alors que son nom civil, et le champ « entreprise » est public');
  verifier('pas de métier inventé quand le code d’activité ne propose rien',
    identites.some((id) => ent.propositionMetiers(id).metiers.length === 0)
    && identites.filter((id) => ent.propositionMetiers(id).metiers.length === 0)
      .every((id) => ent.propositionMetiers(id).phrase === null));
  verifier('une ligne sans date n’existe pas : la date est toujours écrite',
    /\(vu le 15\/10\/2026\)/.test(ent.resumeEntreprise({ source: 'registre', verifie_le: '2026-10-15T10:00:00Z' })));

  /* Les fichiers d'écran du niveau « répertoire ». Les textes de la porte
     de secours (« Opus va vérifier votre entreprise… ») parlent d'un
     HUMAIN, et vivent ailleurs, exprès.

     `FeuilleEntreprise.js` a disparu avec le lot 0a du devis : son contenu
     vit dans `IdentiteEntreprise.js`, un bloc de « Mon entreprise ». La
     cible change, la règle non — un contrôle qui garderait l'ancien nom
     planterait, et un contrôle qui plante ne vérifie rien. */
  const ecrans = ['src/components/SaisieSiret.js', 'src/components/IdentiteEntreprise.js',
    'src/components/CarteDemandePro.js', 'src/lib/entreprise.js'];
  const fautifs = ecrans.filter((f) => {
    const c = sansCommentaires(lire(f));
    return VERIFIE.test(sansNomDuBadge(c)) || /registre/i.test(c);
  });
  verifier('…ni dans les écrans qui parlent du répertoire', fautifs.length === 0, fautifs.join(', '));

  /* LES ÉCRANS DU DEVIS, eux, ont le droit d'écrire « registre » — mais
     seulement dans ses deux noms complets, « registre du commerce et des
     sociétés » et « registre national des entreprises », qui sont la loi.
     Jamais « registre Sirene », jamais « registre de l'INSEE » : le
     répertoire n'est pas un registre. On lit les TEXTES (chaînes et texte
     JSX, recollées quand elles sont coupées par un `+`) : `registre` est
     aussi un nom de colonne, et l'accuser serait accuser du code juste. */
  const textesDe = (code) => {
    const recolle = code.replace(/(['`])\s*\+\s*(['`])/g, '');
    const chaines = [
      ...recolle.matchAll(/'((?:[^'\\\n]|\\.)*)'/g),
      ...recolle.matchAll(/"((?:[^"\\\n]|\\.)*)"/g),
      ...recolle.matchAll(/`([^`]*)`/g),
      /* Le texte JSX : entre la fin d'une balise et la suivante — mais pas
         le `>` d'une flèche `=>`, qui a d'abord fait accuser `REGISTRES`,
         un nom de constante. */
      ...recolle.matchAll(/(?<![=\-])>([^<>{}=;]+)</g),
    ].map((m) => m[1]);
    /* Un texte HUMAIN a une espace ; `'registre'` seul est une valeur. */
    return chaines.filter((t) => /\s/.test(t.trim()));
  };
  const DEVIS = ['src/components/FicheEmetteur.js', 'src/components/PretAEmettre.js',
    'src/components/ApercuEntete.js', 'src/lib/emetteur.js'];
  const fautifsDevis = [];
  DEVIS.forEach((f) => {
    const c = sansCommentaires(lire(f));
    if (VERIFIE.test(sansNomDuBadge(c))) fautifsDevis.push(`${f} : « vérifié »`);
    textesDe(c).forEach((t) => {
      /* « registre » en MOT ENTIER : « quand vous enregistrerez » contient
         les lettres r-e-g-i-s-t-r-e, et la phrase du lot T (19/10/2026)
         s'est fait accuser pour un verbe. Une frontière posée à la main —
         `\b` ne voit pas une lettre accentuée. */
      if (/(^|[^\p{L}])registres?(?![\p{L}])(?! du commerce et des sociétés| national des entreprises)/iu.test(t)) {
        fautifsDevis.push(`${f} : « ${t.slice(0, 70)} »`);
      }
    });
  });
  verifier('…ni dans les écrans du devis : « registre » seulement pour le RCS et le RNE',
    fautifsDevis.length === 0, fautifsDevis.join(' | '));

  /* Le motif lui-même, éprouvé : s'il redevenait aveugle à l'accent, tout
     ce qui précède passerait au vert sans rien voir. */
  verifier('le motif voit « vérifié », « vérifiée », « VÉRIFIÉS » — et laisse « Vérifier », « vérification », `verifie_le`',
    ['le badge « vérifié » est', 'Entreprise vérifié', 'entreprise vérifiée', 'SIRET VÉRIFIÉS']
      .every((t) => VERIFIE.test(t))
    && ['Touchez « Vérifier »', 'une vérification à la main', 'r.verifie_le']
      .every((t) => !VERIFIE.test(t))
    && !VERIFIE.test(sansNomDuBadge('porte le badge « vérifié », accordé')));
}

console.log('\nLe champ SIRET ne coupe rien, et la porte de secours ne démarre pas en pro');
{
  const saisie = sansCommentaires(lire('src/components/SaisieSiret.js'));
  const champ = (saisie.match(/<Field[\s\S]*?\/>/) || [''])[0];
  verifier('le champ n’a NI `maxLength` NI `returnKeyType`',
    !!champ && !/maxLength/.test(champ) && !/returnKeyType/.test(champ),
    'un SIRET collé avec ses espaces fait 17 caractères : `maxLength={14}` le coupait. '
    + 'Et le pavé numérique de l’iPhone n’a pas de touche retour à annoncer');
  verifier('…c’est le pavé numérique',
    /keyboardType="number-pad"/.test(champ));
  verifier('au 14e chiffre, la consultation part et le clavier se range',
    /a\.etat === 'pret' && dernierAuto\.current !== a\.siret/.test(saisie)
    && /Keyboard\.dismiss\(\)/.test(saisie));
  verifier('le résultat est dit à VoiceOver',
    /retour\.annoncer\(/.test(saisie));

  const api = lire('src/lib/api.js');
  verifier('l’appel porte un délai de 15 s',
    /DELAI_VERIFICATION_SIRET_MS = 15000/.test(api)
    && /timeout: DELAI_VERIFICATION_SIRET_MS/.test(api));
  verifier('…et la démonstration est une fonction NOMMÉE, choisie à la fin',
    /export const verifierSiret = hasSupabase \? verifierSiretSupabase : verifierSiretDemo;/.test(api)
    && !/=\s*!?hasSupabase\s*\?\s*async\s*\([^)]*=/.test(api),
    'la forme `!hasSupabase ? async (o = {}) => { … } : …` fait échouer Metro sans '
    + 'dire ni la ligne ni la cause (CLAUDE.md)');

  const hs = app.slice(app.indexOf('const handleSignUp'), app.indexOf('const handleSignIn'));
  verifier('l’inscription démarre avec le type EFFECTIF, jamais `typeChoisi`',
    /await start\(inscription === 'pro' \? 'pro' : 'particulier'\)/.test(hs)
    && !/start\(typeChoisi\)/.test(hs) && !/userType: typeChoisi/.test(hs),
    'la porte de secours part du bouton « professionnel » et crée un compte '
    + 'PARTICULIER : y démarrer en pro affichait « Ce compte est un compte '
    + 'particulier » en rouge au premier écran');
  verifier('…et le SIRET est revérifié JUSTE AVANT la création du compte',
    hs.indexOf('api.verifierSiret(siret)') > 0
    && hs.indexOf('api.verifierSiret(siret)') < hs.indexOf('api.signUp('),
    'la réponse sort du cache : elle transforme le « Database error saving new '
    + 'user » de GoTrue en une issue précise');

  /* LIRE LES CONDITIONS NE DOIT RIEN COÛTER. Mesuré au navigateur le
     15/10/2026 : un `return` anticipé démontait l'écran d'inscription
     pendant la lecture, et au retour le SIRET vérifié, le nom, la ville et
     l'e-mail étaient perdus — alors que le commentaire juste au-dessus
     affirmait le contraire. */
  const avantConnexion = app.slice(app.indexOf('if (!userType) {'), app.indexOf('<AuthScreen'));
  verifier('un texte légal lu depuis l’inscription se pose PAR-DESSUS, sans la démonter',
    avantConnexion.length > 0 && !/if \(legalAvantConnexion\)\s*\{[\s\S]*?return/.test(avantConnexion)
    && /!!legalAvantConnexion && \(\s*<View style=\{s\.legalPleinEcran\}>/.test(app),
    'au retour des conditions, tout était à refaire — consultation du répertoire comprise');
}

/* UNE DEMANDE NE SE PERD PAS EN SILENCE — trouvé en vérifiant la jonction
   des trois morceaux du lot SIRET, le 15/10/2026. La base borne le nom
   d'entreprise d'une demande à 120 caractères ; le champ de l'écran
   n'avait aucune limite. À l'inscription par la porte de secours, le
   déclencheur avale exprès le refus (une métadonnée ne coûte jamais un
   compte) : le compte naissait, la demande disparaissait. Prouvé sur
   PostgreSQL 16 : 121 caractères → 1 compte, 0 demande.

   Ce contrôle compare le NOMBRE des deux côtés, puis vérifie que chaque
   chemin qui écrit une demande le respecte — il vise les blocs qui
   écrivent, pas une place dans le fichier. */
console.log('\nUne demande de compte pro ne se perd pas pour un nom trop long');
{
  const schema = lire('supabase/schema.sql').replace(/--[^\n]*/g, '');
  const enBase = (schema.match(/constraint demande_pro_entreprise_check\s+check \(entreprise is null or char_length\(entreprise\) <= (\d+)\)/) || [])[1];
  const ent = sansCommentaires(lire('src/lib/entreprise.js'));
  const aLEcran = (ent.match(/export const NOM_ENTREPRISE_MAX = (\d+);/) || [])[1];
  verifier('la limite de l’écran est CELLE de la base (`demande_pro_entreprise_check`)',
    !!enBase && !!aLEcran && enBase === aLEcran,
    `base : ${enBase || 'introuvable'}, écran : ${aLEcran || 'introuvable'}`);

  for (const f of ['src/screens/AuthScreen.js', 'src/screens/PasserProScreen.js']) {
    const code = sansCommentaires(lire(f));
    const champs = code.match(/<Field[^>]*?value=\{entreprise\}[\s\S]*?\/>/g) || [];
    verifier(`${f.split('/').pop()} : le champ « Nom de l’entreprise » s’arrête à cette limite`,
      champs.length > 0 && champs.every((c) => /maxLength=\{NOM_ENTREPRISE_MAX\}/.test(c)),
      champs.length ? 'un champ sans `maxLength={NOM_ENTREPRISE_MAX}`' : 'champ introuvable');
  }

  const api = sansCommentaires(lire('src/lib/api.js'));
  const coupe = /entreprise:\s*\([^)]*\)\.trim\(\)\.slice\(0, NOM_ENTREPRISE_MAX\)/;
  const bloc = (debut, fin) => {
    const i = api.indexOf(debut);
    return i < 0 ? '' : api.slice(i, api.indexOf(fin, i));
  };
  const metas = bloc('metadonnees.demande_pro = {', '};');
  verifier('…et `signUp` coupe au même nombre ce qui part dans les métadonnées',
    !!metas && coupe.test(metas), 'le déclencheur avalerait le refus, et la demande avec');
  /* Jusqu'à son `return`, et plus jusqu'au `.select(…)` qui la suivait :
     depuis les droits de colonne du 15/10, l'insertion ne relit plus la
     ligne — et chercher le `.select` aurait fait déborder le bloc sur la
     fonction voisine, où le test aurait passé par hasard. */
  const insertion = bloc('async function demanderCompteProSupabase', 'return maDemandePro();');
  verifier('…comme la demande déposée depuis le profil',
    !!insertion && coupe.test(insertion));
  const demos = (api.match(/demandeProDemo = \{[\s\S]*?\};/g) || []).filter((b) => /entreprise:/.test(b));
  verifier('…et la démonstration, qui doit dire la même chose que la base',
    demos.length >= 2 && demos.every((b) => coupe.test(b)),
    `${demos.length} bloc(s) de démonstration qui écrivent une entreprise`);

  /* UNE DEMANDE DÉJÀ OUVERTE — l'index `idx_demandes_pro_une_ouverte`.
     Relecture adverse du 15/10, mesuré : la base disait « cela existe
     déjà », la démonstration disait mieux, et l'écran « Revérifier mon
     SIRET » poussait à envoyer une seconde demande vouée à l'échec. La
     phrase vient de `messageClair`, des deux côtés : on la FAIT TOURNER sur
     l'erreur exacte de PostgreSQL, et la démonstration lève cette erreur-là. */
  const doublon = Object.assign(new Error('duplicate key value violates unique constraint '
    + '"idx_demandes_pro_une_ouverte"'), { code: '23505' });
  const { messageClair: traduire } = await import('../src/lib/erreurs.js');
  const phrase = traduire(doublon, 'La demande n’est pas partie');
  verifier('une seconde demande ouverte se dit en clair, et dit quoi faire',
    /déjà une demande de compte professionnel en attente/.test(phrase)
    && /profil/.test(phrase) && !/cela existe déjà/.test(phrase), phrase);
  verifier('…et la démonstration lève l’erreur EXACTE de la base, pas une phrase à elle',
    /refusDeLaBase\('23505', 'duplicate key value violates unique constraint '\s*\+\s*'"idx_demandes_pro_une_ouverte"'\)/
      .test(api));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ L’application sait dire ce qui ne va pas. Ce qu’elle dit sur un '
  + 'iPhone sans réseau, seul le téléphone le confirmera.\n');
