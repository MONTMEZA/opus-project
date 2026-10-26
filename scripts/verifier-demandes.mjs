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

console.log('\nCe qui ATTEND passe devant le reste');
{
  const ecran = lire('src/screens/DemandesRecuesScreen.js');
  verifier('le tri est une fonction isolée, donc contrôlable',
    /export function trierDemandes/.test(ecran));
  /* TROIS rangs depuis le 04/10/2026, et pas deux. Avec deux, un devis
     refusé ce matin passait devant un devis en attente d'hier — sur un
     écran qui ne sert QU'À savoir qui attend. */
  verifier('une urgence en attente d’abord, PUIS tout ce qui attend',
    /const rang = \(d\) => \{[\s\S]{0,160}!estEnAttente\(d\)\) return 2;[\s\S]{0,120}'sos' \? 0 : 1/
      .test(ecran),
    'deux rangs seulement laissaient une demande traitée devant une '
    + 'demande en attente');
  /* ====================================================================
     LE 05/10/2026, LE PROPRIÉTAIRE : « si une demande déjà faite ou
     répondue partait dans une page "mes demandes à jour", ça éviterait
     d'avoir des pages et des pages à parcourir pour trouver les
     nouvelles ».

     Chiffré sur la vraie base le jour même : 6 demandes traitées sur 8,
     après trois semaines. Dans un an, c'est 95 % de la liste.
     ==================================================================== */
  verifier('les trois états sont isolés, donc contrôlables',
    /export function etatDe/.test(ecran) && /export function compterParEtat/.test(ecran));

  verifier('une demande ACCEPTÉE n’est pas rangée avec les terminées',
    /if \(estAcceptee\(d\)\) return 'cours';/.test(ecran),
    'c’est un chantier en cours, et c’est là que vit le téléphone du '
    + 'client : la ranger avec les finies la ferait disparaître au moment '
    + 'où on en a besoin');

  verifier('la ligne de pastilles est la MÊME que sur les deux pages voisines',
    /import \{ PastilleBascule \} from '\.\.\/components\/FiltresPlace'/.test(ecran),
    'les trois pages de Découvrir sont jumelles — on ne réinvente pas un '
    + 'troisième motif de filtre');

  verifier('…et chaque pastille porte son COMPTE',
    /label=\{`\$\{v\.label\} \(\$\{compte\[v\.cle\]\}\)`\}/.test(ecran),
    'sans le nombre, il faut ouvrir chaque vue pour savoir s’il y a '
    + 'quelque chose à aller voir');

  /* CE CONTRÔLE VISAIT UN NOM, PAS UN COMPORTEMENT. Il exigeait
     littéralement `const [vue, setVue] = useState('attente')` ; le lot G a
     renommé cet état `vueChoisie`, parce que `vue` est désormais DÉRIVÉE
     (la vue suit la demande que la cloche désigne). Le contrôle a donc
     refusé du code parfaitement juste — sixième fois dans ce projet qu'un
     contrôle vise une PLACE au lieu de viser ce que le code FAIT. */
  verifier('le choix de vue vit DANS l’écran, pas dans OpusApp',
    /const \[vue[A-Za-z]*, setVue[A-Za-z]*\] = useState\('attente'\)/.test(ecran)
    && !/setVue/.test(lire('src/OpusApp.js')),
    'un filtre posé dans OpusApp redessinerait toute l’application à '
    + 'chaque appui — c’est la règle du lot 4');

  verifier('…et la vue affichée est DÉRIVÉE de la demande visée',
    /const vue = ciblee \? etatDe\(ciblee\) : vueChoisie/.test(ecran)
    && !/useEffect\([^)]*setVue/.test(ecran),
    'recopier la cible dans un état par un effet est exactement ce que le '
    + 'linter refuse (react-hooks/set-state-in-effect) : la pastille '
    + 'sauterait d’une vue à l’autre sous les yeux de celui qui ouvre');

  verifier('une vue vide dit LAQUELLE, et où est le reste',
    /Aucune demande dans « \$\{vueCourante\.label\} »/.test(ecran)
    && /Tout ce que vous avez accepté est dans « En cours »/.test(ecran),
    '« Aucune demande » tout court ferait croire que la page est cassée '
    + 'alors qu’on vient de ranger les autres ailleurs');

  verifier('la marge de la liste est dans `contentContainerStyle`',
    /contentContainerStyle=\{\{ paddingHorizontal: GOUTTIERE/.test(ecran),
    'c’est la règle du lot 7 — et c’est elle qui fait tomber l’en-tête, '
    + 'les pastilles et les cartes sur la même verticale');

  verifier('le métier d’une urgence ne passe pas par `nomMetier`',
    /METIERS_SOS/.test(ecran),
    'sos_requests.metier_key porte « plomberie », pas « plombier » — '
    + 'une clé affichée brute ressemble à une faute de frappe');

  /* ====================================================================
     TROUVÉ LE 04/10/2026, EN AUDITANT LE DERNIER ONGLET DE DÉCOUVRIR.
     Trois défauts, et aucun ne faisait planter quoi que ce soit.
     ==================================================================== */
  verifier('un chargement raté ne dit pas « aucune demande »',
    /echec = false/.test(ecran)
    && /echec=\{demandesRecuesEtat === 'echec'\}/.test(lire('src/OpusApp.js')),
    'l’état valait déjà « echec » dans OpusApp et n’était pas transmis : '
    + 'l’écran annonçait une bonne nouvelle. Même famille que le ménage '
    + 'de compte qui répondait « retires: 0 » sans erreur');

  verifier('…et il propose de réessayer',
    /onReessayer/.test(ecran) && /onReessayer=\{\(\) => chargerDemandesRecues\(\)\}/
      .test(lire('src/OpusApp.js')),
    'une impasse sans sortie, c’est le défaut du clavier de l’iPhone');

  /* La borne : la base en rend 200 au plus. Les DEUX valeurs doivent
     rester d'accord, sinon l'écran annonce une troncature qui n'existe
     pas — ou se tait sur une troncature réelle. */
  const plafond = /export const PLAFOND = (\d+);/.exec(ecran);
  const limiteSql = /order by \(d\.statut in \('en_attente', 'envoyee'\)\) desc, d\.created_at desc\s*\n\s*limit (\d+)/
    .exec(schema);
  verifier('`mes_demandes_recues()` est BORNÉE',
    !!limiteSql,
    'elle rendait TOUT, pour toujours — alors que l’écran dit lui-même '
    + 'qu’un artisan en aura des centaines');
  verifier('…et la borne ne coupe jamais que du TRAITÉ',
    !!limiteSql,
    'sans `order by (statut en attente) desc`, 200 demandes closes plus '
    + 'récentes pousseraient dehors un devis en attente');
  verifier('l’écran et la base sont d’accord sur le plafond',
    !!plafond && !!limiteSql && plafond[1] === limiteSql[1],
    `écran ${plafond ? plafond[1] : '?'} / base ${limiteSql ? limiteSql[1] : '?'}`);
  verifier('…et la troncature se DIT',
    /ListFooterComponent=\{liste\.length >= PLAFOND/.test(ecran),
    'une liste tronquée en silence, c’est la règle des « 3 annonces sans '
    + 'lieu précisé » qu’on applique déjà ailleurs');

  /* `schema.sql` ne doit créer une politique qu'à UN endroit — la règle
     posée en section 30, que le contrôle avait raison d'imposer. Les
     trois « creation … » étaient créées deux fois : une version sans le
     blocage, puis la bonne. C'est la première qui se fait oublier. */
  for (const mot of ['devis', 'rappel', 'sos']) {
    const n = (schema.match(new RegExp(`create policy "creation ${mot}"`, 'g')) || []).length;
    verifier(`« creation ${mot} » n’est créée qu’une fois`, n === 1,
      `créée ${n} fois — et c’est la version SANS blocage qui vient en `
      + 'premier dans le fichier');
  }
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

/* RELEVÉ AU TOURNAGE DU 25/10/2026, confirmé deux fois. L'encart disait
   « les professionnels du métier concerné la reçoivent… elle n'est visible
   que d'eux » : la base (section 30.1) l'ouvre à TOUT professionnel connecté,
   aucune notification ne part, et les photos vont dans un espace public. Et
   la démonstration montrait au particulier les demandes des AUTRES, juste
   sous cette phrase. */
console.log('\nCe que l’écran promet au particulier, la base le tient');
{
  const ecran = readFileSync('src/screens/DemandesScreen.js', 'utf8');
  verifier('l’encart ne promet plus qu’une demande n’est vue que du métier concerné',
    !/métier concerné la\s+reçoivent/.test(ecran) && !/visible que d’eux/.test(ecran));
  /* Le même défaut, au message qui suit la publication : « les pros du
     métier vont la recevoir » promettait un envoi qui n'existe pas. */
  const app = readFileSync('src/OpusApp.js', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  verifier('le message de publication ne promet ni envoi ni « métier » seul',
    /Votre demande est publiée\. Les professionnels d’Opus la voient dans leur onglet Demandes\./.test(app)
    && !/vont la recevoir/.test(app));
  verifier('…et il dit que les photos jointes restent lisibles par leur adresse',
    /photos jointes\s+restent lisibles/.test(ecran));
  verifier('un particulier ne voit que SES demandes, comme la base le lui rend',
    /: filtrees\.filter\(estLaMienne\);/.test(ecran));
  const recues = readFileSync('src/screens/DemandesRecuesScreen.js', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  verifier('« jamais lues » s’affiche comme un chargement, jamais comme « aucune demande »',
    /chargement=\{demandesRecuesEtat === 'charge' \|\| demandesRecuesEtat === 'jamais'\}/
      .test(readFileSync('src/OpusApp.js', 'utf8')));
  verifier('aucun texte affiché ne se compare à une marque (« groupe Facebook »)',
    !/Facebook/.test(recues));
}

/* DÉCIDÉ PAR LE PROPRIÉTAIRE LE 26/10/2026 : « Les plus proches » trie
   VRAIMENT par distance. La distance ne venait qu'en troisième, après mes
   métiers et l'urgence : la pastille allumée laissait un chantier à 80 km
   devant un autre à 3 km. La règle vit dans `src/lib/tri-demandes.js` :
   on la FAIT TOURNER.

   ET LES RÈGLES QUE L'ÉCRAN LUI PASSE AUSSI — relecture du 26/10/2026. Ce
   bloc donnait au tri SES propres règles (`d.mien`, un tableau de rangs) :
   trois sabotages de l'écran sur quatre passaient au vert (« mes métiers »
   mort, l'urgence à l'envers, ma ville toujours « placée »). Les règles
   vivent maintenant dans le fichier pur (`reglesDuTri`, `distanceDe`,
   `estPlace`), et c'est ELLES qui tournent ici, avec la VRAIE liste des
   urgences de `annonces.js`. */
console.log('\n« Les plus proches » trie vraiment par distance');
{
  const T = await import(new URL('../src/lib/tri-demandes.js', import.meta.url)).catch(() => ({}));
  const A = await import(new URL('../src/lib/adresse.js', import.meta.url)).catch(() => ({}));
  const {
    trierDemandesOuvertes: trier, phraseDuTriParDistance: phrase, reglesDuTri, distanceDe, estPlace,
  } = T;
  const { distanceLue, libelleDistance } = A;
  const fonctions = [trier, phrase, reglesDuTri, distanceDe, estPlace, distanceLue, libelleDistance];
  verifier('`tri-demandes.js` s’ouvre avec node (il n’importe que `adresse.js`)',
    fonctions.every((f) => typeof f === 'function'));

  /* LA VRAIE LISTE DES URGENCES, dans l'ordre du fichier : `annonces.js`
     importe le thème, `node` ne sait pas l'ouvrir — on lit ses clés. */
  const blocUrgences = (lire('src/data/annonces.js').match(/export const URGENCES = \[([\s\S]*?)\];/) || [])[1] || '';
  const URG = [...blocUrgences.matchAll(/cle: '([a-z_]+)'/g)].map((m) => m[1]);
  verifier('les urgences de `annonces.js` se lisent, de la moins à la plus pressée',
    URG.join(',') === 'quand_possible,ce_mois,urgent', URG.join(','));

  if (fonctions.every((f) => typeof f === 'function')) {
    const reglesPro = reglesDuTri({ estPro: true, mesMetiers: ['macon', 'carreleur'], clesUrgence: URG });
    const reglesPart = reglesDuTri({ estPro: false, mesMetiers: ['macon'], clesUrgence: URG });
    verifier('« mes métiers » : un de mes métiers compte, un autre non',
      reglesPro.pourMoi({ metier: 'macon' }) === true && reglesPro.pourMoi({ metier: 'plombier' }) === false);
    verifier('…et seulement pour un professionnel', reglesPart.pourMoi({ metier: 'macon' }) === false);
    const r = (u) => reglesPro.rangUrgence({ urgence: u });
    verifier('l’urgence : « urgent » avant « ce mois-ci » avant « pas pressé »',
      r('urgent') > r('ce_mois') && r('ce_mois') > r('quand_possible'), `${r('urgent')} ${r('ce_mois')} ${r('quand_possible')}`);
    verifier('une urgence absente ou inconnue vaut « pas pressé », comme à l’écran',
      r(undefined) === r('quand_possible') && r('nimporte') === r('quand_possible'));

    verifier('un lieu placé porte une latitude ET une longitude, en nombres',
      estPlace({ latitude: 43.6, longitude: 5.2 }) && !estPlace({ latitude: 43.6 })
      && !estPlace({ latitude: '43.6', longitude: 5.2 }) && !estPlace({ latitude: NaN, longitude: 5.2 })
      && !estPlace(null));
    const lambesc = { latitude: 43.6539, longitude: 5.2626 };
    verifier('la distance ne se calcule que si les DEUX sont placés',
      typeof distanceDe(lambesc, { latitude: 43.5297, longitude: 5.4474 }) === 'number'
      && distanceDe({ latitude: 43.65 }, { latitude: 43.5297, longitude: 5.4474 }) === null
      && distanceDe(lambesc, { ville: 'Lambesc' }) === null);

    /* LA DISTANCE LUE ne fait que monter : sans ça, le tri sur elle ne
       serait pas un ordre. Et le libellé de la carte est la même règle. */
    let monte = true;
    let precedente = -1;
    for (let k = 0; k <= 3000; k += 1) {
      const lue = distanceLue(k / 10);
      if (lue < precedente) monte = false;
      precedente = lue;
    }
    verifier('la distance lue ne fait que monter avec la distance', monte);
    const memes = [0.2, 0.8, 4.4, 4.6, 12.0, 12.4, 150].every((km) => {
      const lue = distanceLue(km);
      return libelleDistance(km) === (lue === 0 ? 'dans votre commune' : `à ${String(lue).replace('.', ',')} km`);
    });
    verifier('le libellé de la carte et la distance lue sont la même règle', memes);

    const regles = (parDistance) => ({ parDistance, ...reglesPro });
    const ids = (l) => l.map((d) => d.id).join(',');
    /* Le cas du tournage : un chantier URGENT, de MON métier, loin, contre
       un chantier tranquille, d'un autre métier, tout près. */
    const loinUrgentMien = { id: 'loin', km: 80, urgence: 'urgent', metier: 'macon' };
    const presTranquille = { id: 'pres', km: 3, urgence: 'quand_possible', metier: 'plombier' };
    const moyen = { id: 'moyen', km: 25, urgence: 'ce_mois', metier: 'peintre' };
    const sansLieu = { id: 'sans', km: null, urgence: 'urgent', metier: 'macon' };
    const liste = [loinUrgentMien, sansLieu, moyen, presTranquille];

    verifier('pastille allumée : la plus proche d’abord, même tranquille et d’un autre métier',
      ids(trier(liste, regles(true))) === 'pres,moyen,loin,sans', ids(trier(liste, regles(true))));
    verifier('…et une demande SANS distance va à la fin, même urgente et de mon métier',
      trier(liste, regles(true)).at(-1).id === 'sans');
    verifier('pastille éteinte : mes métiers, puis l’urgence — la distance ne compte plus',
      ids(trier(liste, regles(false))) === 'loin,sans,moyen,pres', ids(trier(liste, regles(false))));
    const egal1 = { id: 'e1', km: 10, urgence: 'quand_possible', metier: 'peintre' };
    const egal2 = { id: 'e2', km: 10, urgence: 'urgent', metier: 'peintre' };
    const egal3 = { id: 'e3', km: 10, urgence: 'quand_possible', metier: 'macon' };
    verifier('à distance égale : mes métiers, puis l’urgence',
      ids(trier([egal1, egal2, egal3], regles(true))) === 'e3,e2,e1');

    /* À DISTANCE LUE ÉGALE — deux cartes « à 12 km », « à 4,5 km » ou
       « dans votre commune » : mon urgence passe devant, même un peu plus
       loin au dixième. */
    const paire = (kmMien, kmAutre) => ids(trier([
      { id: 'autre', km: kmAutre, urgence: 'quand_possible', metier: 'peintre' },
      { id: 'mien', km: kmMien, urgence: 'urgent', metier: 'macon' },
    ], regles(true)));
    verifier('à distance LUE égale, mon métier urgent passe devant (12,4 / 12,0 · 4,6 / 4,4 · 0,8 / 0,2)',
      paire(12.4, 12.0) === 'mien,autre' && paire(4.6, 4.4) === 'mien,autre' && paire(0.8, 0.2) === 'mien,autre',
      `${paire(12.4, 12.0)} · ${paire(4.6, 4.4)} · ${paire(0.8, 0.2)}`);
    verifier('…mais un palier de plus reste plus loin (« à 13 km » après « à 12 km »)',
      paire(12.6, 12.4) === 'autre,mien', paire(12.6, 12.4));
    verifier('…et à tout égal, la plus proche au dixième d’abord',
      ids(trier([{ id: 'b', km: 12.4, metier: 'peintre' }, { id: 'a', km: 12.0, metier: 'peintre' }], regles(true))) === 'a,b');

    /* ENTRE ELLES, les demandes sans distance gardent l'ordre de la pastille
       éteinte — le cas réel d'une fiche sans coordonnées (relecture du
       26/10/2026 : aucun cas ne l'éprouvait). */
    const sansAutre = { id: 'sans-autre', km: null, urgence: 'quand_possible', metier: 'peintre' };
    const sansMien = { id: 'sans-mien', km: null, urgence: 'urgent', metier: 'macon' };
    verifier('sans aucune distance, pastille allumée : mes métiers, puis l’urgence',
      ids(trier([sansAutre, sansMien], regles(true))) === 'sans-mien,sans-autre');
    verifier('…et derrière une demande placée, dans le même ordre',
      ids(trier([sansAutre, sansMien, moyen], regles(true))) === 'moyen,sans-mien,sans-autre');

    const a = { id: 'a', km: null, urgence: 'quand_possible', metier: 'peintre' };
    const b = { id: 'b', km: null, urgence: 'quand_possible', metier: 'peintre' };
    verifier('à critères égaux, l’ordre reçu (le plus récent d’abord) est gardé',
      ids(trier([a, b], regles(true))) === 'a,b' && ids(trier([b, a], regles(false))) === 'b,a');
    /* UN VRAI ORDRE : sur des demandes toutes différentes, le résultat ne
       dépend pas de l'ordre d'arrivée — les 120 façons de les recevoir. */
    const cinq = [
      { id: 'c1', km: 12.4, urgence: 'urgent', metier: 'macon' },
      { id: 'c2', km: 12.0, urgence: 'quand_possible', metier: 'peintre' },
      { id: 'c3', km: null, urgence: 'urgent', metier: 'macon' },
      { id: 'c4', km: null, urgence: 'quand_possible', metier: 'peintre' },
      { id: 'c5', km: 3, urgence: 'ce_mois', metier: 'plombier' },
    ];
    const permutations = (l) => (l.length <= 1 ? [l]
      : l.flatMap((x, i) => permutations([...l.slice(0, i), ...l.slice(i + 1)]).map((p) => [x, ...p])));
    /* Pastille éteinte, la distance ne compte plus : cinq demandes qui
       diffèrent par (mon métier, urgence), sinon deux ex aequo gardent
       l'ordre reçu, et c'est voulu. */
    const cinqEteinte = [
      { id: 'd1', urgence: 'urgent', metier: 'macon' },
      { id: 'd2', urgence: 'ce_mois', metier: 'macon' },
      { id: 'd3', urgence: 'quand_possible', metier: 'macon' },
      { id: 'd4', urgence: 'urgent', metier: 'peintre' },
      { id: 'd5', urgence: 'ce_mois', metier: 'peintre' },
    ];
    for (const [parDistance, jeu] of [[true, cinq], [false, cinqEteinte]]) {
      const resultats = new Set(permutations(jeu).map((p) => ids(trier(p, regles(parDistance)))));
      verifier(`le résultat ne dépend pas de l’ordre d’arrivée (pastille ${parDistance ? 'allumée' : 'éteinte'}, 120 ordres)`,
        resultats.size === 1, [...resultats].join(' / '));
    }
    verifier('une distance NaN compte comme absente',
      trier([{ id: 'n', km: NaN }, { id: 'k', km: 5 }], regles(true))[0].id === 'k');
    /* Sur une liste NEUVE : `liste`, triée plus haut, aurait pu revenir
       par hasard dans son ordre de départ. */
    const recue = [moyen, sansLieu, presTranquille, loinUrgentMien];
    const avant = ids(recue);
    const rendue = trier(recue, regles(true));
    verifier('la liste reçue n’est pas modifiée (le tri en rend une nouvelle)',
      ids(recue) === avant && rendue !== recue, `${avant} → ${ids(recue)}`);

    verifier('phrase : rien à dire quand le tri est fait en entier',
      phrase({ parDistance: true, moiLocalise: true, demandes: [moyen, presTranquille] }) === null);
    verifier('phrase : rien à dire pastille éteinte, ni sur une liste vide',
      phrase({ parDistance: false, moiLocalise: false, demandes: liste }) === null
      && phrase({ parDistance: true, moiLocalise: false, demandes: [] }) === null);
    verifier('phrase : ma ville sans coordonnées — le tri NE PEUT PAS se faire, et on le dit',
      /tri par distance ne peut pas se faire/.test(
        phrase({ parDistance: true, moiLocalise: false, demandes: liste }) || ''));
    const NB = ' ';
    verifier('phrase : les demandes non placées sont annoncées en fin de liste',
      phrase({ parDistance: true, moiLocalise: true, demandes: liste })
        === `1 demande n’est pas placée sur la carte${NB}: elle est en fin de liste.`
      && phrase({ parDistance: true, moiLocalise: true, demandes: [sansLieu, { ...sansLieu, id: 's2' }, moyen] })
        === `2 demandes ne sont pas placées sur la carte${NB}: elles sont en fin de liste.`);
    /* Quand AUCUNE ne l'est, il n'y a pas de « fin de liste » (relecture du
       26/10/2026) : la liste entière est dans l'autre ordre. */
    const toutes = phrase({ parDistance: true, moiLocalise: true, demandes: [sansLieu, sansAutre] }) || '';
    const une = phrase({ parDistance: true, moiLocalise: true, demandes: [sansLieu] }) || '';
    verifier('phrase : aucune demande placée — ni « fin de liste », mais l’ordre réellement suivi',
      !/fin de liste/.test(toutes) && /rangées par métier, puis par urgence/.test(toutes)
      && !/fin de liste/.test(une) && /ne se calcule pas/.test(une), `${toutes} / ${une}`);
    /* LA TYPOGRAPHIE : à 320 points, « Modifier mon profil » se coupait
       entre le guillemet et le mot (mesuré dans Chromium). */
    const phrases = [
      phrase({ parDistance: true, moiLocalise: false, demandes: liste }),
      phrase({ parDistance: true, moiLocalise: true, demandes: liste }),
      phrase({ parDistance: true, moiLocalise: true, demandes: [sansLieu, { ...sansLieu, id: 's2' }, moyen] }),
      toutes, une,
    ];
    verifier('aucune espace ordinaire devant « : » ni contre un guillemet',
      phrases.every((t) => t && !/ [:;!?»]|« /.test(t)), phrases.find((t) => !t || / [:;!?»]|« /.test(t)) || '');
  }

  const ecran = readFileSync('src/screens/DemandesScreen.js', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  /* L'ÉCRAN NE FAIT QUE PASSER SES DONNÉES : la forme EXACTE de chaque
     appel, parce que c'est là que les sabotages de la relecture passaient
     (`pourMoi: () => false`, `moiLocalise: true`, l'urgence à l'envers). */
  verifier('l’écran prend ses règles dans le fichier pur, avec la vraie liste des urgences',
    /const regles = reglesDuTri\(\{ estPro, mesMetiers, clesUrgence: URGENCES\.map\(\(u\) => u\.cle\) \}\);/.test(ecran)
    && (ecran.match(/\bregles\s*=/g) || []).length === 1);
  verifier('…le badge « Pour vous » est la MÊME règle que le tri',
    /const estPourMoi = regles\.pourMoi;/.test(ecran) && /mien=\{estPourMoi\(d\)\}/.test(ecran)
    && (ecran.match(/\bestPourMoi\s*=/g) || []).length === 1);
  verifier('…la distance vient de `distanceDe(moi, d)`',
    /km: distanceDe\(moi, d\)/.test(ecran) && !/distanceKm\(/.test(ecran));
  verifier('l’écran trie par la règle commune, avec l’état de la pastille, et rien d’autre',
    /trierDemandesOuvertes\(filtrees, \{ parDistance: triDistance, \.\.\.regles \}\)/.test(ecran));
  verifier('…et il n’a plus de comparateur à lui', !/\.sort\(/.test(ecran));
  verifier('l’écran affiche ce que le tri n’a pas pu faire, avec MA position réelle',
    /phraseDuTriParDistance\(\{/.test(ecran) && /moiLocalise: estPlace\(moi\),/.test(ecran)
    && /\{phraseTri && <Text/.test(ecran));
  verifier('la pastille reste allumée par défaut (la liste s’ouvre par distance)',
    /const \[triDistance, setTriDistance\] = useState\(true\);/.test(ecran));

  /* UNE VILLE TAPÉE SANS TOUCHER DE SUGGESTION n'avait aucune coordonnée,
     et la demande passait derrière un chantier à 300 km (relecture du
     26/10/2026). `publierDemande` la complète AVANT d'écrire, comme
     l'annonce, le profil et la publication. */
  const app = readFileSync('src/OpusApp.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const iDebut = app.indexOf('const publierDemande = async');
  const corps = iDebut < 0 ? '' : app.slice(iDebut, app.indexOf('const repondreDemande', iDebut));
  const iLieu = corps.indexOf('completerLieu(');
  const iEcrire = corps.indexOf('api.createDemande(');
  const appel = iEcrire < 0 ? '' : corps.slice(iEcrire, corps.indexOf('});', iEcrire));
  verifier('une demande complète son lieu AVANT d’être écrite',
    iLieu > 0 && iEcrire > iLieu, `completerLieu à ${iLieu}, createDemande à ${iEcrire}`);
  verifier('…et ce sont les coordonnées complétées qui partent',
    /latitude: lieu\.latitude,/.test(appel) && /longitude: lieu\.longitude,/.test(appel));
  verifier('…sans jamais refuser la demande pour ça',
    /try \{\s*lieu = await completerLieu\(lieu\);\s*\} catch/.test(corps));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Une demande ne peut plus tomber dans un trou. Qu’elle arrive '
  + 'bien sur un iPhone, seul le téléphone le dira.\n');
