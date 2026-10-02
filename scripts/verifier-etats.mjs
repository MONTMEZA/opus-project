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

const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js'));
const lire = (f) => readFileSync(f, 'utf8');
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
  const anime = ui.slice(ui.indexOf('export function ConfirmBanner'));
  const bloc = anime.slice(0, anime.indexOf('const s = StyleSheet') > 0
    ? Math.min(anime.indexOf('}\n'), 2000) : 2000);
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

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ L’application sait dire ce qui ne va pas. Ce qu’elle dit sur un '
  + 'iPhone sans réseau, seul le téléphone le confirmera.\n');
