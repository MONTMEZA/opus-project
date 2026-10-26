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
    /* `GENRES_DEMANDE` vit depuis le lot S-b dans `transitions-demandes.js`,
       qui n'importe rien : `api.js` le réexporte, la règle y tourne. */
    verifier(`l’artisan peut répondre « ${r} »`,
      /GENRES_DEMANDE/.test(lire('src/lib/api.js'))
      && new RegExp(`${r}:`).test(lire('src/lib/transitions-demandes.js')));
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

/* ==========================================================================
   LOT S-b (26/10/2026) — une demande reçue ne change que par ses trois
   gestes ; elle naît en attente ; on ne s'en fait pas à soi-même ; une
   urgence ne part que vers qui y répond ; et l'écran ne dit que le vrai.
   ========================================================================== */
const schemaCode = schema.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const sansCommentairesJs = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

console.log('\nLot S-b — une demande naît EN ATTENTE, et pas à soi-même');
{
  for (const [nom, table, statut] of [['creation devis', 'quote_requests', 'en_attente'],
    ['creation rappel', 'callback_requests', 'en_attente'], ['creation sos', 'sos_requests', 'envoyee']]) {
    const pol = [...schemaCode.matchAll(new RegExp(`create policy "${nom}" on public\\.${table}([\\s\\S]*?);`, 'g'))];
    /* LA POLITIQUE ENTIÈRE, normalisée — et non `statut = …` cherché
       « quelque part » : `… and not est_masque(…) or statut = 'en_attente'`
       le satisfaisait, et laissait déposer une demande au nom d'un AUTRE
       client (relecture du 26/10, la priorité de `or`). */
    const forme = pol.length === 1 ? pol[0][1].replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim() : '';
    verifier(`« ${nom} » : créée une seule fois, exactement « le client, en ${statut}, vers qui ne lui est pas masqué »`,
      forme === `for insert to authenticated with check (auth.uid() = client_id and statut = '${statut}' and not public.est_masque(professional_id))`,
      forme || `${pol.length} création(s)`);
  }
  for (const table of ['quote_requests', 'callback_requests', 'sos_requests', 'conversations']) {
    const nom = `${table}_pas_soi_meme_check`;
    /* `not valid` sur les trois tables qui portent DÉJÀ une ligne « à
       soi-même » sur la vraie base — sans lui, le rejeu s'y arrête — et PAS
       sur les urgences, table vide, où la contrainte se vérifie entière
       (relecture du 26/10 : le retirer passait au vert). */
    const nonValide = table !== 'sos_requests';
    verifier(`\`${nom}\` : posée (client ≠ artisan), ${nonValide ? '`not valid`' : 'VALIDE'}, et sa phrase est dans \`erreurs.js\``,
      new RegExp(`add constraint ${nom}\\s+check \\(client_id <> professional_id\\)${nonValide ? ' not valid;' : ';'}`).test(schemaCode)
        && new RegExp(`\\b${nom}: '`).test(lire('src/lib/erreurs.js')));
  }
  /* LE REJEU NE DÉPEND PAS DES DONNÉES (relecture du 26/10) : la section 21
     récrit le métier des demandes de devis ; une ligne « à soi-même »
     modifiée violerait la contrainte `not valid`, et le rejeu s'arrêterait.
     Elle les laisse donc. */
  verifier('la section 21 ne récrit pas le métier d’une demande « à soi-même » (le rejeu ne dépend pas des données)',
    /update public\.quote_requests\s+set metier = public\.metier_depuis_ancien_nom\(metier\)\s+where metier is not null and public\.metier_depuis_ancien_nom\(metier\) <> metier\s+and client_id is distinct from professional_id;/.test(schemaCode));
  verifier('`sos_metier_key_check` : les quatre clés d’urgence, les mêmes que `sos_availability`',
    /add constraint sos_metier_key_check\s+check \(metier_key in \('plomberie', 'electricite', 'serrurerie', 'chauffage'\)\)/.test(schemaCode));
}

console.log('\nLot S-b — les refus de la base, mot pour mot dans `erreurs.js`');
{
  const { REFUS_DEMANDES } = await import('../src/lib/erreurs.js');
  /* Les phrases de la base, prises dans `schema.sql` (code, sans les
     commentaires), `''` dépliés en `'`. Chacune de `REFUS_DEMANDES` doit y
     être à l'octet près : la démonstration refuse avec les mots exacts de
     la base, et l'écran les montre tels quels. */
  const phrasesBase = new Set([...schemaCode.matchAll(/raise exception '((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'")));
  const absentes = Object.entries(REFUS_DEMANDES).filter(([cle, p]) => !cle.startsWith('OP019_annulee') && !phrasesBase.has(p));
  verifier(`les ${Object.keys(REFUS_DEMANDES).length} phrases de \`REFUS_DEMANDES\` sont celles de la base, à l’octet près`,
    absentes.length === 0, absentes.map(([c]) => c).join(', '));
  verifier('…et « annulée » aussi (la seule qu’aucun essai ne provoque : aucun écran n’annule une urgence)',
    phrasesBase.has(REFUS_DEMANDES.OP019_annulee));
  /* LES PHRASES D'OP020 NE NOMMENT JAMAIS UN BLOCAGE (critique « droit ») :
     un artisan qu'on aurait bloqué l'apprendrait. Ni « bloqu », ni
     « masqu », ni dans les copies, ni dans la base. */
  const op020 = Object.entries(REFUS_DEMANDES).filter(([c]) => c.startsWith('OP020')).map(([, p]) => p);
  const op020Base = [...schemaCode.matchAll(/raise exception '((?:[^']|'')*)'\s+using errcode = 'OP020'/g)].map((m) => m[1]);
  verifier(`aucune phrase d’OP020 ne nomme un blocage (${op020.length} copies, ${op020Base.length} dans la base)`,
    op020.length >= 5 && op020Base.length >= 5 && [...op020, ...op020Base].every((p) => !/bloqu|masqu/i.test(p)));
}

console.log('\nLot S-b — les transitions, la même règle dans la base et dans la démonstration');
{
  const { GENRES_DEMANDE, refusDeTransition } = await import('../src/lib/transitions-demandes.js');
  /* LA RÈGLE DE LA BASE, écrite ici en clair : Accepter et Refuser une
     demande EN ATTENTE, Marquer terminée une demande ACCEPTÉE, un statut
     renvoyé inchangé. Tout le reste est refusé. `refusDeTransition` tourne
     sur CHAQUE paire d'états, pour les trois genres. */
  let ecarts = [];
  for (const [genre, r] of Object.entries(GENRES_DEMANDE)) {
    const attente = genre === 'sos' ? 'envoyee' : 'en_attente';
    const etats = genre === 'sos' ? ['envoyee', 'acceptee', 'refusee', 'termine', 'annulee'] : ['en_attente', 'accepte', 'refuse', 'termine'];
    for (const avant of etats) {
      for (const apres of etats) {
        const permis = avant === apres || (avant === attente && [r.accepte, r.refuse].includes(apres))
          || (avant === r.accepte && apres === 'termine');
        if ((refusDeTransition(r, avant, apres) === null) !== permis) ecarts.push(`${genre} ${avant}→${apres}`);
      }
    }
  }
  verifier('`refusDeTransition` : permis exactement Accepter, Refuser (en attente), Terminer (acceptée), et l’inchangé',
    ecarts.length === 0, ecarts.join(', '));
  ecarts = [];
  const r = GENRES_DEMANDE.devis;
  const attendu = { accepte: 'OP019_acceptee', refuse: 'OP019_refusee', termine: 'OP019_terminee' };
  for (const [avant, cle] of Object.entries(attendu)) if (refusDeTransition(r, avant, 'en_attente') !== cle) ecarts.push(avant);
  if (refusDeTransition(r, 'en_attente', 'termine') !== 'OP019_en_attente') ecarts.push('en_attente→termine');
  verifier('…et la phrase rendue dit l’état RÉEL de la demande', ecarts.length === 0, ecarts.join(', '));
  /* La base, de son côté : les MÊMES transitions dans `tient_la_demande`. */
  /* Le corps SEUL, coupé à son `$$;` : la suite du fichier contient d'autres
     fonctions, et un motif trouvé plus bas passerait pour le sien. */
  const corps = (schemaCode.split('create or replace function public.tient_la_demande()')[1] || '').split('$$;')[0];
  verifier('`tient_la_demande` permet exactement les mêmes transitions',
    /if not \(\(old\.statut = attente and new\.statut in \(accepte, refuse\)\)\s+or \(old\.statut = accepte and new\.statut = 'termine'\)\)/.test(corps)
      && /if new\.statut is not distinct from old\.statut then\s+return new;/.test(corps));
  const api = sansCommentairesJs(lire('src/lib/api.js'));
  verifier('la démonstration applique la règle ET le blocage, avec les phrases de la base',
    /const refus = refusDeTransition\(regles, d\.statut, valeur\);/.test(api)
      && /throw new ErreurDeLaBase\('OP019', REFUS_DEMANDES\[refus\]\)/.test(api)
      && /throw new ErreurDeLaBase\('OP020', REFUS_DEMANDES\.OP020_demande\)/.test(api));
}

console.log('\nLot S-b — l’écran ne dit que le vrai');
{
  const app = sansCommentairesJs(lire('src/OpusApp.js'));
  const iRep = app.indexOf('const repondreDemandeRecue = async');
  const corps = iRep < 0 ? '' : app.slice(iRep, app.indexOf('\n  };', iRep));
  /* « Le client est prévenu » sur un REFUS serait faux quand le client a
     bloqué l'artisan : la base tait la notification, et l'artisan ne voit
     pas les blocages des autres. Sur une ACCEPTATION, c'est vrai : la base
     refuse d'accepter sous un blocage. */
  const iRefus = corps.indexOf("statut === 'refuse'");
  const brancheRefus = iRefus < 0 ? '' : corps.slice(iRefus, corps.indexOf('} else {', iRefus));
  /* LE TEXTE EXACT du bandeau, et non une liste de verbes interdits
     (« averti », « informé »… toujours incomplète — relecture du 26/10). */
  verifier('un REFUS dit exactement « Demande refusée. Elle passe dans « Terminées ». » — rien sur le client',
    brancheRefus.length > 0 && /showBanner\('Demande refusée\. Elle passe dans « Terminées »\.'\);/.test(brancheRefus)
      && (brancheRefus.match(/showBanner\(/g) || []).length === 1);
  verifier('OP020 ferme la carte (`demandesFermees`), OP019 RELIT la liste au lieu de remettre l’état d’avant',
    /code === 'OP020'[\s\S]*?setDemandesFermees/.test(corps) && /code === 'OP019'[\s\S]*?chargerDemandesRecues\(\{ silencieux: true \}\)/.test(corps));
  const ecran = sansCommentairesJs(lire('src/screens/DemandesRecuesScreen.js'));
  verifier('…et la carte fermée ne propose plus « Accepter » (elle garde « Refuser »)',
    /\{!fermee && \(\s*<BtnMini\s+label=\{envoi === 'accepte'/.test(ecran)
      && /fermee=\{!!fermees && fermees\.has\(item\.id\)\}/.test(ecran));
  verifier('« Faire un devis » pose ses deux questions par `Promise.allSettled`, et c’est `issueDeFaireUnDevis` qui décide',
    /const \[rListe, rPermis\] = await Promise\.allSettled\(\[\s*api\.devisDeLaDemande\(d\.genre, d\.id\),\s*api\.nouveauDevisPermis\(d\.genre, d\.id\),\s*\]\);/.test(ecran)
      && /const issue = issueDeFaireUnDevis\(rListe, rPermis\);\s*if \(issue\.etat === 'ouvrir'\) \{ setBrouillons\(null\); onFaireDevis\(d\); return; \}\s*setBrouillons\(issue\);/.test(ecran)
      && !/Promise\.all\(\[/.test(ecran));
  /* LA DÉCISION, FAITE TOURNER sur chaque cas (relecture du 26/10) : un
     échec de la seule PERMISSION ne doit ni cacher le brouillon trouvé, ni
     inventer un refus. */
  {
    const { issueDeFaireUnDevis } = await import('../src/lib/transitions-demandes.js');
    const ok = (value) => ({ status: 'fulfilled', value });
    const ko = { status: 'rejected', reason: new Error('réseau') };
    const un = [{ id: 'b1' }];
    const cas = [
      ['liste en échec', ko, ok(true), 'echec'],
      ['liste en échec, permission en échec', ko, ko, 'echec'],
      ['liste vide, permis', ok([]), ok(true), 'ouvrir'],
      ['liste vide, refusé', ok([]), ok(false), 'ferme'],
      ['liste vide, permission en échec : on OUVRE (la base dira OP020)', ok([]), ko, 'ouvrir'],
      ['un brouillon, permis', ok(un), ok(true), 'trouve', true],
      ['un brouillon, refusé', ok(un), ok(false), 'trouve', false],
      ['un brouillon, permission en échec : INCONNUE, jamais « non »', ok(un), ko, 'trouve', null],
    ];
    for (const [nom, l, p, etat, permis] of cas) {
      const r = issueDeFaireUnDevis(l, p);
      verifier(`issueDeFaireUnDevis — ${nom} → ${etat}${permis === undefined ? '' : ` (nouveau devis : ${permis})`}`,
        r.etat === etat && (permis === undefined || (r.nouveauPermis === permis && r.liste === un)),
        JSON.stringify(r));
    }
  }
  verifier('…et la permission passe par `lectureDevis` (8 s, annulable), comme la liste des brouillons',
    /async function nouveauDevisPermisSupabase\(genre, id\) \{[\s\S]*?await lectureDevis\('La vérification de cette demande', \(signal\) => avecSignal\(\s*supabase\.rpc\('peut_faire_un_devis'[\s\S]*?if \(error\) leverLecture\(error\);/.test(sansCommentairesJs(lire('src/lib/api.js'))));
  verifier('…un brouillon déjà commencé se reprend toujours ; « Nouveau devis » disparaît si la base dit non',
    /brouillons\.nouveauPermis !== false && \(/.test(ecran));
  const saisie = sansCommentairesJs(lire('src/screens/SaisieDevisScreen.js'));
  verifier('un refus DÉFINITIF à la création du brouillon (OP013, OP020) ne propose pas « Réessayer »',
    /\{!estUnRefusDefinitif\(attente\.devisErreur\) && \(\s*<BtnOutline label="Réessayer" onPress=\{\(\) => fileRef\.current && fileRef\.current\.reessayer\('devis'\)\}/.test(saisie));

  /* RÉPONDRE À UNE DEMANDE : la réponse part à CHAQUE « Répondre », son
     refus est dit, et le compteur ne monte que si la base vient d'en
     compter une. Avant : un `catch` vide, et « Vous avez répondu ». */
  const iRepondre = app.indexOf('const repondreDemande = async');
  const repondre = iRepondre < 0 ? '' : app.slice(iRepondre, app.indexOf('\n  };', iRepondre));
  verifier('`repondreADemande` n’est jamais dans un `catch` vide, et son refus est montré',
    /resultat = await api\.repondreADemande\(demande\.id, null\);\s*\} catch \(e\) \{/.test(repondre)
      && (repondre.match(/showErreur\(/g) || []).length >= 3
      && !/catch \(e\) \{\s*\}/.test(repondre));
  /* LA RÉPONSE D'ABORD, LA CONVERSATION ENSUITE (relecture du 26/10) : dans
     l'autre ordre, la conversation se créait, la réponse était refusée, et
     chaque appui refaisait le même refus sans rien ouvrir. */
  const iReponse = repondre.indexOf('api.repondreADemande(');
  const iConv = repondre.indexOf('api.createConversationWithClient(');
  verifier('la réponse part AVANT la création de la conversation',
    iReponse > 0 && iConv > iReponse);
  verifier('…un refus de la politique se dit en phrase NEUTRE (`REPONSE_FERMEE`), et la carte quitte la liste',
    /if \(e && e\.code === 'REPONSE_FERMEE'\) \{\s*showErreur\(e\.message\);\s*setDemandes\(\(ds\) => ds\.filter\(\(d\) => d\.id !== demande\.id\)\);\s*return;/.test(repondre));
  {
    const err = await import('../src/lib/erreurs.js');
    const e = new err.ErreurDeLaBase('REPONSE_FERMEE', err.REPONSE_FERMEE);
    verifier('…`REPONSE_FERMEE` ne nomme ni la fermeture ni un blocage, `messageClair` la rend telle quelle, et c’est un refus définitif',
      err.REPONSE_FERMEE === 'Vous ne pouvez plus répondre à cette demande.'
        && err.messageClair(e, 'x') === err.REPONSE_FERMEE && err.estUnRefusDefinitif(e)
        && !/bloqu|masqu|ferm|pourvue/i.test(err.REPONSE_FERMEE));
  }
  verifier('…l’API traduit le 42501 de `demande_reponses` en `REPONSE_FERMEE`, et la démonstration refuse pareil',
    /if \(error\.code === '42501'\) throw new ErreurDeLaBase\('REPONSE_FERMEE', REPONSE_FERMEE\);/.test(sansCommentairesJs(lire('src/lib/api.js')))
      && /if \(d && \(\(d\.statut && d\.statut !== 'ouverte'\) \|\| demoBlocages\.has\(String\(d\.auteurId\)\)\)\) \{\s*throw new ErreurDeLaBase\('REPONSE_FERMEE', REPONSE_FERMEE\);/.test(sansCommentairesJs(lire('src/lib/api.js'))));
  /* LES CARTES FERMÉES SE ROUVRENT quand la liste est relue, et au
     déblocage (relecture du 26/10). */
  verifier('`demandesFermees` se vide à chaque relecture réussie de « Pour moi », et au déblocage',
    /setDemandesRecues\(await api\.chargerDemandesRecues\(\)\);\s*setDemandesFermees\(new Set\(\)\);/.test(app)
      && /onDebloquer=\{debloquerEtRouvrir\}/.test(app));
  verifier('…le compteur ne monte que si une réponse vient d’être COMPTÉE',
    /if \(resultat && resultat\.nouvelle\) \{[\s\S]*?reponses: d\.reponses \+ 1/.test(repondre)
      && (repondre.match(/reponses \+ 1/g) || []).length === 1);
  const api = sansCommentairesJs(lire('src/lib/api.js'));
  verifier('…et l’API insère (jamais d’upsert), un 23505 voulant dire « déjà répondu »',
    /from\('demande_reponses'\)\s*\.insert\(/.test(api) && !/from\('demande_reponses'\)\.upsert/.test(api)
      && /if \(error\.code === '23505'\) return \{ nouvelle: false \};/.test(api));
  verifier('le démarrage ne lit plus TOUTE la table des réponses : le nombre vient de `demandes.nb_reponses`',
    !/from\('demande_reponses'\)\.select\('demande_id'\),/.test(api)
      && /reponses: Number\.isInteger\(d\.nb_reponses\) \? d\.nb_reponses : null,/.test(api));
  const pageDemandes = sansCommentairesJs(lire('src/screens/DemandesScreen.js'));
  verifier('…et un nombre inconnu s’affiche « — », jamais « 0 »',
    /Number\.isInteger\(d\.reponses\)[\s\S]{0,120}: '— réponse'/.test(pageDemandes));
  /* La base, de son côté : le compteur tenu par un déclencheur, sa garde
     R-A, et un rattrapage qui RECALCULE. */
  verifier('la base tient `demandes.nb_reponses` : déclencheur `definer`, garde R-A, rattrapage qui recalcule',
    /alter table public\.demandes add column if not exists nb_reponses int not null default 0;/.test(schemaCode)
      && /create or replace trigger trg_maj_nb_reponses_demande\s+after insert or delete on public\.demande_reponses/.test(schemaCode)
      && /create or replace trigger trg_tient_le_compteur_de_demande\s+before insert or update on public\.demandes/.test(schemaCode)
      && /set nb_reponses = \(select count\(\*\) from public\.demande_reponses r where r\.demande_id = d\.id\)/.test(schemaCode));
  verifier('une réponse ne se déplace pas (OP021), sur les deux tables',
    /create or replace trigger trg_tient_la_reponse\s+before update on public\.demande_reponses/.test(schemaCode)
      && /create or replace trigger trg_tient_la_reponse\s+before update on public\.annonce_reponses/.test(schemaCode));
  verifier('un visiteur ne lit plus aucune réponse : la règle est fermée ET le droit de table retiré',
    /create policy "lecture reponses visiteur" on public\.demande_reponses\s+for select to anon using \(false\);/.test(schemaCode)
      && /revoke all on public\.demande_reponses from anon;/.test(schemaCode));
}

console.log('\nLot S-b — l’urgence ne part que vers qui y répond (OP025)');
{
  /* Chaque corps SEUL, coupé à son `$$;` — sinon `tient_l_urgence` « contient »
     les conditions d'`artisans_urgence`, écrite plus bas dans le fichier, et
     une condition retirée de la garde passait au vert (trouvé en cassant). */
  const corps = (schemaCode.split('create or replace function public.tient_l_urgence()')[1] || '').split('$$;')[0];
  const urgence = (schemaCode.split('create or replace function public.artisans_urgence(')[1] || '').split('$$;')[0];
  /* LES MÊMES CONDITIONS que la recherche, la distance mise à part : un
     artisan absent de la recherche ne doit pas pouvoir recevoir d'urgence,
     et un artisan présent doit pouvoir la recevoir. */
  const conditions = ['sa.actif', 'pp.metiers @> array[public.metier_du_sos(sa.metier_key)]', 't.affiche is true',
    't.frais_deplacement_centimes is not null', 't.taux_horaire_centimes is not null', 't.majoration_pct is not null'];
  verifier('`tient_l_urgence` : `security invoker`, R-A, et les conditions d’`artisans_urgence()` une par une',
    /security invoker/.test(corps) && /current_user not in \('authenticated', 'anon'\)/.test(corps)
      && conditions.every((c) => corps.includes(c) && urgence.includes(c)) && /errcode = 'OP025'/.test(corps),
    conditions.filter((c) => !corps.includes(c) || !urgence.includes(c)).join(' | '));
  /* ET LE LIEN AVEC L'ARTISAN ET LE MÉTIER VISÉS — propres à la garde, que
     la recherche n'a pas : sans eux, elle passait dès qu'UN artisan
     quelconque répondait à UNE urgence (relecture du 26/10). */
  verifier('…et la garde porte sur l’artisan ET le métier VISÉS (`if not exists`)',
    /if not exists \(/.test(corps) && /sa\.professional_id = new\.professional_id/.test(corps)
      && /sa\.metier_key = new\.metier_key/.test(corps));
  verifier('…posé AVANT l’insertion d’une urgence',
    /create or replace trigger trg_tient_l_urgence\s+before insert on public\.sos_requests/.test(schemaCode));
  /* L'ÉCRAN APPREND L'ÉCHEC, et relance la recherche sur OP025. */
  const app = sansCommentairesJs(lire('src/OpusApp.js'));
  const iSos = app.indexOf('const envoyerSos = async');
  const sos = iSos < 0 ? '' : app.slice(iSos, app.indexOf('\n  };', iSos));
  verifier('`envoyerSos` rend son issue — `{ ok: false, code }` sur un échec, `{ ok: true }` sinon',
    /return \{ ok: false, code: String\(\(e && e\.code\) \|\| ''\) \};/.test(sos) && /return \{ ok: true \};\s*$/.test(sos));
  const ecranSos = sansCommentairesJs(lire('src/screens/SosScreen.js'));
  verifier('…et sur OP025 l’écran du SOS RELANCE la recherche ; « Choisir » n’envoie qu’une fois à la fois',
    /if \(r && r\.code === 'OP025'\) chercherArtisans\(\);/.test(ecranSos)
      && /if \(envoi\) return;/.test(ecranSos) && /disabled=\{envoi\}\s+onPress=\{\(\) => envoyer\(\{/.test(ecranSos)
      && !/onPress=\{\(\) => onEnvoyer\(/.test(ecranSos));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Une demande ne peut plus tomber dans un trou. Qu’elle arrive '
  + 'bien sur un iPhone, seul le téléphone le dira.\n');
