/**
 * LES VUES — un signal, et quelqu'un qui le LIT.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Ce lot a failli être une faute. L'intention de départ — « enregistrer les
 * signaux maintenant, pour classer le fil plus tard » — est mot pour mot le
 * défaut que ce projet traque depuis le 01/10/2026 : une table qu'on écrit
 * sans jamais la lire est une panne silencieuse.
 *
 * > **Un signal enregistré « pour plus tard » n'a pas de lecteur, donc rien
 * > ne dit s'il est juste.** Il peut compter double, compter l'auteur
 * > lui-même, compter quelqu'un qu'on a bloqué : personne ne le saura avant
 * > le jour où l'on s'en servira, c'est-à-dire trop tard.
 *
 * Ce contrôle tient donc les DEUX bouts, comme celui du lot C : ce qui
 * écrit (le fil, le compte à rebours, la base) et ce qui lit (« Mes
 * publications », et l'export RGPD).
 *
 * ET IL FAIT TOURNER LE CALCUL, il ne le lit pas. `src/lib/vues.js`
 * n'importe RIEN, donc `node` sait l'ouvrir — huitième application de la
 * leçon de `cloudinary-adresses.js`. C'est indispensable ici : ce calcul
 * dépend du TEMPS, et une règle de temps ne se juge ni à l'œil ni à
 * l'écran.
 *
 *   npm run verifier-vues
 */
import { readFileSync } from 'node:fs';

const {
  aRetenir, prochainPaquet, vuesPossibles, DUREE_VUE, DELAI_ENVOI, PAQUET_MAX,
} = await import('../src/lib/vues.js');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Les commentaires partent d'abord : cinq fois dans ce projet un contrôle a
   accusé la documentation qui expliquait le défaut qu'il traque. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const schema = lire('supabase/schema.sql').replace(/^\s*--.*$/gm, '');
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const accueil = sansCommentaires(lire('src/screens/HomeScreen.js'));
const mesPubs = sansCommentaires(lire('src/screens/MesPublicationsScreen.js'));
const crochet = sansCommentaires(lire('src/lib/compteur-vues.js'));
const demo = sansCommentaires(lire('src/data/demo.js'));

/* ------------------------------------------------------------------ */
console.log('\nLe CALCUL — on le fait tourner, on ne le lit pas');

{
  const arrivees = new Map();
  const vus = new Set();
  const visibles = ['a', 'b'];

  const t0 = aRetenir(arrivees, visibles, vus, 1000);
  verifier('une publication qui vient d\'arriver ne compte pas',
    t0.length === 0 && arrivees.size === 2,
    'Sinon une publication traversée en descendant compterait comme vue.');

  const t1 = aRetenir(arrivees, visibles, vus, 1000 + DUREE_VUE - 1);
  verifier('…ni une milliseconde avant la durée', t1.length === 0);

  const t2 = aRetenir(arrivees, visibles, vus, 1000 + DUREE_VUE);
  verifier('…et elle compte pile à la durée',
    t2.length === 2 && t2.includes('a') && t2.includes('b'));
}

{
  /* LE CAS QUI DÉCIDE DE TOUT : trois passages courts ne font pas une vue.
     C'est exactement ce qui arrive quand on cherche quelque chose en
     montant et descendant le fil. */
  const arrivees = new Map();
  const vus = new Set();
  aRetenir(arrivees, ['a'], vus, 0);
  aRetenir(arrivees, [], vus, 400);          // elle sort de l'écran
  aRetenir(arrivees, ['a'], vus, 500);       // elle revient
  aRetenir(arrivees, [], vus, 900);          // elle ressort
  const dus = aRetenir(arrivees, ['a'], vus, 1000);
  verifier('trois passages courts ne font PAS une vue',
    dus.length === 0,
    'Une vue, c\'est une seconde D\'AFFILÉE. Sans la remise à zéro en '
    + 'sortant de l\'écran, chercher quelque chose en montant et descendant '
    + 'le fil compterait des vues partout.');
}

{
  const arrivees = new Map();
  const vus = new Set(['a']);
  aRetenir(arrivees, ['a'], vus, 0);
  const dus = aRetenir(arrivees, ['a'], vus, 10000);
  verifier('ce qui a déjà été envoyé ne repart pas', dus.length === 0);
}

{
  const file = ['a', 'b', 'c'];
  const paquet = prochainPaquet(file, 2);
  verifier('le paquet prend les plus anciens et VIDE la file',
    paquet.join(',') === 'a,b' && file.join(',') === 'c',
    'La file est modifiée en place : la ranger dans un état redessinerait '
    + 'le fil pendant qu\'on le fait défiler.');
}

verifier('une publication qu\'on vient de poser n\'est pas envoyée',
  vuesPossibles([{ id: 'local-1791', proId: 'x' }, { id: 'vrai', proId: 'x' }], 'moi')
    .join(',') === 'vrai',
  'Tant que la base n\'a pas répondu, elle porte un identifiant local.');

verifier('…et sa PROPRE publication non plus',
  vuesPossibles([{ id: 'a', proId: 'moi' }, { id: 'b', proId: 'autre' }], 'moi')
    .join(',') === 'b',
  'Sinon le chiffre mesure l\'anxiété de l\'artisan, pas l\'intérêt du public.');

verifier('les trois réglages ont des valeurs défendables',
  DUREE_VUE === 1000 && DELAI_ENVOI >= 1000 && PAQUET_MAX <= 50,
  'PAQUET_MAX ne doit pas dépasser la borne de la base (50, section 35) : '
  + 'au-delà, l\'écran enverrait des identifiants qui seraient jetés.');

/* ------------------------------------------------------------------ */
console.log('\nLa BASE — et ce qu\'elle refuse');

verifier('`post_vues` existe, avec sa clé primaire à deux colonnes',
  /create table if not exists public\.post_vues[\s\S]{0,900}?primary key \(post_id, spectateur_id\)/.test(schema),
  'C\'est elle qui garantit qu\'une personne ne compte qu\'une fois — '
  + 'aucun minuteur côté écran ne peut tenir cette promesse.');

verifier('…et la RLS y est activée',
  /alter table public\.post_vues enable row level security/.test(schema));

verifier('on ne lit QUE ses propres lignes',
  /create policy "lecture mes vues" on public\.post_vues\s*\n\s*for select to authenticated using \(spectateur_id = auth\.uid\(\)\)/.test(schema),
  'L\'artisan voit COMBIEN, jamais QUI. Ouvrir cette table « pour les '
  + 'statistiques » rendrait la liste de ceux qui ont regardé.');

verifier('l\'écriture pose les TROIS questions',
  /create policy "enregistrer une vue"[\s\S]{0,500}?spectateur_id = auth\.uid\(\)[\s\S]{0,500}?author_id is distinct from auth\.uid\(\)[\s\S]{0,500}?not public\.est_masque/.test(schema),
  'Moi, pas la mienne, pas quelqu\'un que j\'ai bloqué. En oublier une ne '
  + 'lève aucune erreur.');

verifier('il n\'y a NI `update` NI `delete` sur `post_vues`',
  !/create policy[^\n]*on public\.post_vues\s*\n\s*for (update|delete)/.test(schema),
  'Une vue ne se retire pas et ne se corrige pas — même raison qu\'une '
  + 'pièce jointe envoyée.');

verifier('le compteur ne fait que MONTER',
  /create or replace function public\.maj_vues_count\(\)[\s\S]{0,400}?vues_count = vues_count \+ 1/.test(schema)
  && !/vues_count = greatest\(vues_count - 1/.test(schema),
  'Une vue a EU LIEU. La supprimer ferait disparaître des vues sous les '
  + 'yeux de l\'artisan, sans explication possible.');

verifier('…et le rattrapage ne le fait jamais descendre',
  /set vues_count = greatest\(/.test(schema));

verifier('la porte d\'entrée est `security invoker`',
  /create or replace function public\.enregistrer_vues\(p_ids uuid\[\]\)[\s\S]{0,300}?security invoker/.test(schema),
  'C\'est ce qui fait que le `select` sur `posts` est filtré par le '
  + 'blocage, gratuitement et par la même règle que le reste.');

verifier('…elle PRÉ-FILTRE au lieu de laisser la politique refuser',
  /insert into public\.post_vues[\s\S]{0,300}?from public\.posts p[\s\S]{0,200}?author_id is distinct from auth\.uid\(\)/.test(schema),
  'Un `insert … select` dont UNE ligne viole la politique échoue '
  + 'ENTIÈREMENT : un seul auteur bloqué ferait perdre les dix-neuf autres.');

verifier('…et elle est bornée',
  /p_ids\[1:50\]/.test(schema),
  'Ces identifiants viennent du CLIENT.');

verifier('`mes_donnees()` n\'est définie qu\'à UN endroit',
  (schema.match(/create or replace function public\.mes_donnees\(\)/g) || []).length === 1,
  'C\'est la PREMIÈRE des deux qui se fait oublier le jour où la règle '
  + 'change — la leçon de `cree_fiche_utilisateur`, le 05/10.');

verifier('…et l\'export RGPD contient ce que j\'ai regardé',
  /'publications_vues',[\s\S]{0,200}?public\.post_vues x where x\.spectateur_id = auth\.uid\(\)/.test(schema),
  '« Ce que j\'ai regardé » est une donnée personnelle sur MOI.');

verifier('…avec son droit posé AVEC elle',
  /grant execute on function public\.mes_donnees\(\) to authenticated/.test(schema)
  && !/'public\.mes_donnees\(\)'/.test(schema),
  'Le `foreach` de la section 13.8 avale `undefined_function` : le droit '
  + 'aurait été passé sous silence sur une base neuve, et accordé seulement '
  + 'au second rejouage.');

/* ------------------------------------------------------------------ */
console.log('\nQui ÉCRIT — et sans redessiner le fil');

verifier('le fil classique signale ce qu\'il montre',
  /signalerVues\(vuesPossibles\(posts\.filter/.test(accueil));

verifier('…le fil VIDÉO aussi',
  /feedMode !== 'video'[\s\S]{0,300}?signalerVues\(courant/.test(accueil),
  'Il n\'a pas d\'ensemble visible : il n\'y a qu\'une diapositive, et '
  + 'c\'est `slideActive`.');

verifier('le compte à rebours ne vit PAS dans l\'écran',
  /useCompteurDeVues/.test(accueil) && !/setInterval/.test(accueil),
  'Il est appelé plusieurs fois par seconde pendant qu\'on fait défiler.');

verifier('…et le crochet n\'a aucun `useState`',
  !/useState/.test(crochet),
  'Un état ici, c\'est un rendu plusieurs fois par seconde — exactement ce '
  + 'que le lot 6 interdit.');

/* IL NE SUFFIT PAS QUE `vider()` SOIT ÉCRIT QUELQUE PART. Éprouvé en
   remettant le défaut à la main — un `return;` glissé juste après
   `clearInterval` —, la première version de ce contrôle PASSAIT : elle
   cherchait la présence du texte, pas s'il était atteignable. C'est le
   défaut que ce projet traque depuis `verifier-montage`, et il m'a eu une
   fois de plus. On regarde donc ce qu'il y a ENTRE les deux. */
{
  const nettoyage = crochet.match(/clearInterval\(battement\);([\s\S]{0,300}?)vider\(\);/);
  verifier('il vide la file en QUITTANT l\'écran',
    !!nettoyage && !/\breturn\b/.test(nettoyage[1]),
    'Sans ça, les dernières publications regardées avant de changer d\'onglet '
    + 'seraient perdues — et ce sont celles qu\'on a regardées le plus '
    + 'longtemps.');
}

verifier('un envoi qui échoue ne casse rien',
  /try \{ await envoiRef\.current\(paquet\); \} catch/.test(crochet),
  'Même règle que le vibreur de `retour.js` : personne ne doit voir une '
  + 'erreur parce qu\'un compteur n\'a pas pu monter.');

verifier('`OpusApp` branche l\'API telle quelle',
  /onVues=\{api\.enregistrerVues\}/.test(app));

verifier('…et elle est un `noop` en démonstration',
  /export const enregistrerVues = !hasSupabase \? noop :/.test(api),
  'Un compteur qui monterait sans rien enregistrer serait le mensonge que '
  + 'la bande noire sert à éviter.');

/* ------------------------------------------------------------------ */
console.log('\nQui LIT — l\'autre bout de la chaîne');

verifier('le compteur voyage avec la publication',
  /vues: p\.vues_count \|\| 0,/.test(api));

verifier('« Mes publications » l\'affiche',
  /<Eye size=\{12\}[\s\S]{0,120}?\{p\.vues \|\| 0\}/.test(mesPubs),
  'Sans lecteur, la table est écrite et jamais relue — le défaut du 01/10.');

verifier('…et le fil, LUI, ne l\'affiche pas',
  !/\.vues\b/.test(sansCommentaires(lire('src/components/PostCard.js'))),
  'Un compteur de vues sur chaque carte transformerait le fil en '
  + 'classement, et c\'est exactement ce que ce lot refuse de faire.');

verifier('le mode démonstration porte des vues',
  (demo.match(/vues: \d+/g) || []).length >= 6);

verifier('…et elles sont d\'un ordre de grandeur réaliste',
  (() => {
    const couples = [...demo.matchAll(/likes: (\d+), vues: (\d+)/g)];
    return couples.length >= 6 && couples.every(([, j, v]) => Number(v) > Number(j) * 5);
  })(),
  'On regarde beaucoup, on aime peu. Des chiffres du même ordre que les '
  + 'j\'aime donneraient une fausse idée de ce que le compteur raconte.');

/* ------------------------------------------------------------------ */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Le signal s\'écrit, quelqu\'un le lit, et le fil ne se redessine pas.\n');
