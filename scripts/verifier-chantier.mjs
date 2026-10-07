/**
 * LE CHANTIER — coudre les publications, sans rien promettre de faux.
 *
 * CE QUE CE CONTRÔLE TIENT, ET POURQUOI
 * -------------------------------------
 * Trois dangers, et aucun ne ferait planter quoi que ce soit :
 *
 *   1. **deux chantiers du même nom.** Le propriétaire décrivait son usage
 *      ainsi : « je remets chantier Martin ». « Toiture Charleval » tapé
 *      deux fois à une espace près, ce sont deux séries d'une publication
 *      chacune — et rien à l'écran pour dire pourquoi ;
 *   2. **le nom du CLIENT en public.** « Chantier Martin » s'afficherait
 *      sur chaque publication : une donnée personnelle sur quelqu'un qui
 *      n'a rien accepté. La base ne peut pas deviner un nom de famille ;
 *      c'est l'écran qui doit le dire ;
 *   3. **une publication accrochée au chantier d'un autre.** La politique
 *      d'écriture des publications ne regarde que `author_id`.
 *
 *   npm run verifier-chantier
 */
import { readFileSync } from 'node:fs';

const { initialChantiers, initialPosts, proProfiles } = await import('../src/data/demo.js');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Les commentaires partent d'abord : six fois dans ce projet un contrôle a
   accusé la documentation qui expliquait le défaut qu'il traque. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const schema = lire('supabase/schema.sql').replace(/^\s*--.*$/gm, '');
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const creer = sansCommentaires(lire('src/screens/CreerScreen.js'));
const carte = sansCommentaires(lire('src/components/PostCard.js'));
const bande = sansCommentaires(lire('src/components/BandeChantiers.js'));
const page = sansCommentaires(lire('src/screens/ChantierScreen.js'));
const feuille = lire('src/components/NouveauChantier.js');
const fichePro = sansCommentaires(lire('src/screens/ProfilProScreen.js'));
const ficheMoi = sansCommentaires(lire('src/screens/ProfilOwnScreen.js'));

/* ------------------------------------------------------------------ */
console.log('\nL\'APPARTENANCE PASSE PAR UNE FONCTION');

verifier('`est_mon_entreprise()` existe',
  /create or replace function public\.est_mon_entreprise\(p_entreprise uuid\)/.test(schema),
  '`docs/LECTURE-CAHIER-DES-CHARGES.md` l\'attend depuis le 04/10 : elle '
  + 'naît avec la première table de chantier, sinon c\'est une fonction que '
  + 'personne n\'appelle.');

verifier('…elle rend aujourd\'hui exactement `auth.uid() = p_entreprise`',
  /select p_entreprise is not null and auth\.uid\(\) = p_entreprise/.test(schema),
  'Un compte EST une entreprise (décision du 04/10). Le jour où ça change, '
  + 'c\'est CETTE fonction, et elle seule.');

verifier('…et la politique du chantier l\'APPELLE',
  /create policy "ecriture mes chantiers"[\s\S]{0,300}?public\.est_mon_entreprise\(pro_id\)/.test(schema),
  'Une fonction que personne n\'appelle est le « bouton §18 » : du code qui '
  + 'a l\'air de servir et qui ne fait rien.');

verifier('…elle reste exécutable par `authenticated`',
  /grant execute on function public\.est_mon_entreprise\(uuid\) to anon, authenticated/.test(schema),
  'Une policy qui appelle une fonction interdite à l\'appelant ÉCHOUE au '
  + 'lieu de filtrer — la leçon de `horaires_valides()`, le 30/09.');

/* ------------------------------------------------------------------ */
console.log('\nDEUX FOIS LE MÊME NOM NE FONT QU\'UN CHANTIER');

verifier('l\'index unique est posé sur le nom NETTOYÉ',
  /create unique index if not exists idx_chantiers_titre_unique\s*\n\s*on public\.chantiers \(pro_id, lower\(btrim\(titre\)\)\)/.test(schema),
  '« Toiture Charleval », « toiture charleval » et le même avec une espace '
  + 'sont trois chaînes différentes.');

verifier('…mais il est PAR PRO',
  /\(pro_id, lower/.test(schema),
  'Deux couvreurs du même village peuvent très bien avoir chacun leur '
  + '« Toiture Charleval ».');

verifier('un titre vide est refusé',
  /constraint chantier_titre_non_vide check \(btrim\(titre\) <> ''\)/.test(schema));

verifier('et l\'application RETROUVE le chantier au lieu de refuser',
  /error\.code === '23505'/.test(api),
  'Le refus de la base est une garde, pas un message d\'accueil : on rend '
  + 'à l\'artisan le chantier qu\'il vient de renommer à l\'identique.');

/* ------------------------------------------------------------------ */
console.log('\nLE NOM NE DOIT PAS ÊTRE CELUI DU CLIENT');

verifier('l\'écran dit que ce nom sera PUBLIC',
  /visible de tout le monde/i.test(feuille),
  '« Chantier Martin » s\'afficherait sur chaque publication.');

verifier('…et il propose un exemple qui décrit le TRAVAIL',
  /Toiture Charleval/.test(feuille) && /pas votre client/i.test(feuille),
  'Un client cherche un couvreur, pas une connaissance.');

/* ------------------------------------------------------------------ */
console.log('\nUNE PUBLICATION NE REJOINT QUE MON CHANTIER');

verifier('le déclencheur existe',
  /create or replace function public\.tient_le_chantier_du_post\(\)/.test(schema));

verifier('…et il REFUSE avec une phrase, il ne corrige pas en silence',
  /raise exception[\s\S]{0,160}?errcode = 'OP002'/.test(schema),
  'Une politique rend « 0 ligne » sans un mot ; un déclencheur dit '
  + 'pourquoi. Leçon du 05/10 avec la fiche professionnelle.');

verifier('supprimer un chantier NE DÉTRUIT PAS les publications',
  /chantier_id uuid\s*\n?\s*references public\.chantiers\(id\) on delete set null/.test(schema),
  'Un `cascade` jetterait neuf publications avec leurs j\'aime et leurs '
  + 'commentaires pour défaire une couture.');

/* ------------------------------------------------------------------ */
console.log('\nLES COMPTEURS, ET LA COUVERTURE');

verifier('le déclencheur RECALCULE au lieu d\'incrémenter',
  /create or replace function public\.recalcule_chantier/.test(schema)
  && /nb_publications = \(select count\(\*\)/.test(schema),
  'Une publication peut changer de chantier, être supprimée, ou arriver '
  + 'avec une date antérieure. Trois compteurs incrémentés à la main se '
  + 'désaligneraient sans que rien ne le signale.');

verifier('…et il suit les DEUX chantiers lors d\'un déplacement',
  /old\.chantier_id is not null[\s\S]{0,200}?new\.chantier_id is not null/.test(schema),
  'Celui qu\'on quitte ET celui qu\'on rejoint. Sinon le premier reste '
  + 'faux pour toujours.');

verifier('la couverture est la publication la plus RÉCENTE',
  /order by p\.created_at desc limit 1/.test(schema),
  'Personne n\'a envie de commencer par une toiture arrachée : on veut '
  + 'voir ce que c\'est devenu, et ensuite comment.');

/* ------------------------------------------------------------------ */
console.log('\nLA BANDE, ET LE GESTE');

verifier('la bande défile horizontalement',
  /<ScrollView\s*\n?\s*horizontal/.test(bande),
  'Le propriétaire a insisté contre mon avis, et il avait raison : le '
  + 'glissement de retour n\'existe QUE depuis le fil vidéo.');

verifier('…et la carte suivante DÉPASSE du bord',
  /const LARGEUR = \d+;/.test(bande) && /\/\* ?[\s\S]{0,10}$|./.test(bande),
  'Sans débord, personne ne devine qu\'il y en a d\'autres.');

verifier('un chantier sans photo montre une icône, pas un carré gris',
  /imageVide/.test(bande),
  'Un trou gris ressemble à une image qui n\'a pas chargé — troisième '
  + 'application de la leçon du lot C.');

verifier('le bloc n\'existe pas s\'il est vide, sur les DEUX fiches',
  /chantiers\.length > 0 && \(/.test(fichePro)
  && /\(mesChantiers \|\| \[\]\)\.length > 0 && \(/.test(ficheMoi),
  'Personne ne doit lire « Ses chantiers — aucun pour le moment » sur les '
  + 'sept fiches de la base.');

verifier('…et il vient AVANT les réalisations',
  fichePro.indexOf('Ses chantiers') < fichePro.indexOf('<SectionLabel>Réalisations'),
  'Un chantier RACONTE, la grille PROUVE. On lit l\'histoire, puis on '
  + 'regarde le catalogue.');

verifier('…dans le MÊME ordre sur les deux fiches',
  ficheMoi.indexOf('Mes chantiers') < ficheMoi.indexOf('Portfolio de chantiers'),
  'Mesuré au navigateur : la bande arrivait après le portfolio chez son '
  + 'auteur et avant sur la fiche publique. L\'artisan ne verrait pas ce que '
  + 'voient ses clients, et c\'est le seul endroit où il peut le vérifier.');

verifier('la ligne du chantier n\'est QUE du texte',
  !/chantier: \{[^}]*backgroundColor/.test(carte)
  && !/chantier: \{[^}]*borderLeft/.test(carte),
  'Un bloc teinté se lit comme une ÉTIQUETTE — une information posée là. '
  + 'Or cette ligne est un CHEMIN : elle ouvre un dossier. Relevé par le '
  + 'propriétaire sur son iPhone : « un carré beige ».');

verifier('…et elle garde son icône de calques',
  /<Layers size=\{12\} color=\{C\.accentTexte\} \/>/.test(carte),
  'Sans fond ni bordure, c\'est l\'icône qui dit « il y a une suite » et '
  + 'l\'encre orange qui dit « on peut appuyer ».');

verifier('une étape n\'est appuyable QUE si c\'est une vidéo',
  /if \(!onOuvrir \|\| !FORMATS_VIDEO\.has\(post\.format\)\) return contenu;/.test(page),
  'Le `Pressable` posé sur toute l\'étape avalait le geste du carrousel — '
  + 'les photos multiples ne défilaient plus dans le dossier. Et sur une '
  + 'photo il ne faisait RIEN, ce que ce projet interdit depuis le lot 5.');

verifier('la ligne du chantier fait 44 points de haut',
  /minHeight: TOUCHE/.test(carte) && !/paddingVertical[^,}]*,[\s\S]{0,120}borderLeftColor/.test(carte),
  'Mesurée au navigateur, elle faisait 332 × 24. Elle ouvre une PAGE '
  + 'ENTIÈRE : c\'est une cible, et la règle du lot 5 vaut pour elle.');

/* ------------------------------------------------------------------ */
console.log('\nLA PAGE DU CHANTIER');

verifier('les étapes se lisent du plus ANCIEN au plus récent',
  /\.order\('created_at', \{ ascending: true \}\)/.test(api),
  'Tout le reste d\'Opus trie à l\'envers, et c\'est juste partout '
  + 'ailleurs. Ici ce serait un contresens : on ne raconte pas une toiture '
  + 'en commençant par les tuiles.');

verifier('le texte vient AVANT la photo de l\'étape',
  page.indexOf('{!!post.texte &&') < page.indexOf('{aUnVisuel && ('),
  'On lit deux lignes, on voit la photo de ce moment-là, on continue. Une '
  + 'galerie suivie d\'un pavé de texte se regarde puis s\'abandonne.');

verifier('terminer un chantier se DÉFAIT',
  /label=\{enCours \? 'Terminer' : 'Rouvrir'\}/.test(page)
  && /const vers = chantier\.statut === 'en_cours' \? 'termine' : 'en_cours'/.test(app),
  'Le bouton disparaissait une fois le chantier terminé : un appui par '
  + 'erreur, et plus aucune porte. Une action qu\'on atteint d\'un seul '
  + 'appui doit pouvoir se défaire du même endroit.');

/* LE LOT I A REMPLI CETTE PLACE. Le contrôle disait « elle est VIDE, pas
   remplie d'un faux texte » — il gardait une promesse en attendant qu'elle
   soit tenue. Elle l'est : `RecitChantier` (section 39) occupe l'endroit, et
   c'est `verifier-recit` qui en répond maintenant. Ce qui reste ici, c'est
   le lien entre les deux — un bloc branché sans ses deux gestes afficherait
   un bouton qui ne fait rien. */
verifier('la place du récit est tenue par RecitChantier',
  /<RecitChantier/.test(page) && !/Bientôt : le récit/.test(page),
  'Et plus par un texte d\'attente : la promesse est tenue.');

verifier('…et il reçoit de quoi écrire ET de quoi enregistrer',
  /onEcrire=\{onEcrireRecit\}/.test(page)
  && /onEnregistrer=\{onEnregistrerRecit\}/.test(page)
  && /onEcrireRecit=\{ecrireRecitChantier\}/.test(app)
  && /onEnregistrerRecit=\{enregistrerRecitChantier\}/.test(app),
  'Un bloc branché à moitié afficherait un bouton qui ne fait rien.');

/* ------------------------------------------------------------------ */
console.log('\nQUI ÉCRIT, QUI LIT');

verifier('on CHOISIT son chantier, on ne le retape pas',
  /mesChantiers\.map\(\(c\) => \{/.test(creer),
  'C\'est ici que se joue la promesse « un seul chantier par nom ».');

verifier('…et la ligne ne s\'affiche pas pour le portfolio seul',
  /\{dansLeFil && \([\s\S]{0,600}?setCreateChantier/.test(creer),
  'Une publication rangée au seul portfolio ne crée aucune ligne dans '
  + '`posts` : la puce se cocherait et ne toucherait rien.');

verifier('le chantier part avec la publication',
  /chantierId: createChantier,/.test(app) && /chantier_id: chantierId \|\| null,/.test(api));

verifier('…et il RESTE choisi après, à la différence du conseil',
  !/setCreateChantier\(null\);[\s\S]{0,200}setMedias\(\[\]\)/.test(app),
  'On publie deux ou trois étapes du même chantier dans la journée.');

verifier('la carte du fil affiche le titre',
  /\{!!chantier && \(/.test(carte) && /chantier\.titre/.test(carte));

verifier('…et elle reçoit l\'OBJET, pas le dictionnaire',
  /chantier=\{p\.chantierId \? chantiers\[p\.chantierId\] \|\| null : null\}/
    .test(sansCommentaires(lire('src/screens/HomeScreen.js'))),
  '`PostCard` est mémorisée : lui passer le dictionnaire entier la ferait '
  + 'redessiner pour toutes les cartes. C\'est le piège du lot 4.');

/* On ne cherche pas « p_chantier quelque part après le nom de la fonction » :
   un `[\s\S]*?` sans borne court jusqu'au premier `p_chantier` du FICHIER, et
   il a accusé `recalcule_chantier(p_chantier uuid)`, trente sections plus bas.
   Cinquième fois dans ce projet qu'un contrôle vise une POSITION. On découpe
   donc la liste de paramètres de `fil_filtre` elle-même, et on exige qu'elle
   soit EXACTEMENT celle que l'application appelle — n'importe quel paramètre
   ajouté ou retiré surcharge la fonction, pas seulement un `p_chantier`. */
const PARAMS_FIL_FILTRE = [
  'p_metier', 'p_lat', 'p_lon', 'p_rayon_km', 'p_note_min',
  'p_verifies', 'p_abonnements', 'p_videos', 'p_avant', 'p_limite',
];
const decl = schema.match(
  /create or replace function public\.fil_filtre\(([^)]*)\)\s*returns/);
const parametresFilFiltre = decl
  ? (decl[1].match(/\bp_[a-z_]+/g) || []).filter((n, i, t) => t.indexOf(n) === i)
  : null;

verifier('la liste de paramètres de `fil_filtre` a bien été trouvée',
  parametresFilFiltre !== null && parametresFilFiltre.length > 0,
  'Un contrôle qui ne trouve pas sa cible rend le bon résultat pour la '
  + 'mauvaise raison.');

verifier('on ne touche PAS à la signature de `fil_filtre`',
  parametresFilFiltre !== null
  && parametresFilFiltre.join(',') === PARAMS_FIL_FILTRE.join(','),
  'Lui ajouter un paramètre ne la remplace pas : ça la SURCHARGE, et le fil '
  + 'tombe sur « is not unique » — la leçon du lot C. '
  + `Trouvé : ${parametresFilFiltre ? parametresFilFiltre.join(', ') : '(rien)'}`);

verifier('le verrou du texte laisse passer `chantier_id`',
  /to_jsonb\(old\) - 'texte' - 'chantier_id'/.test(schema),
  'Trouvé sur la VRAIE base, pas dans les essais : `tient_le_texte()` '
  + 'remettait `chantier_id` à son ancienne valeur, donc ranger une '
  + 'publication déjà en ligne répondait 204 et ne changeait RIEN. '
  + 'L\'essai 10 tournait sans jeton, donc le verrou ne s\'appliquait pas.');

verifier('…et il ne laisse passer QUE ça',
  !/to_jsonb\(old\) - 'texte'(?: - '(?:chantier_id)')* - '(?!chantier_id)/.test(schema),
  'Ouvrir `media` ou `likes_count` rendrait une publication réécrivable '
  + 'après coup. Le chantier est une exception justifiée : OP002 garde '
  + 'déjà la porte. Rien d\'autre ne l\'est.');

verifier('…et l\'essai du déplacement se fait AVEC un jeton',
  /set local role authenticated;\nset local request\.jwt\.claim\.sub[\s\S]{0,200}update public\.posts set chantier_id/
    .test(lire('supabase/essais-section-36.sql')),
  'Sans jeton, `auth.uid()` est vide et le verrou ne s\'applique pas : '
  + 'l\'essai passait au vert pendant que la vraie base refusait.');

verifier('l\'export RGPD contient mes chantiers',
  /'chantiers', coalesce\(\(select jsonb_agg\(to_jsonb\(x\)\) from public\.chantiers x where x\.pro_id = auth\.uid\(\)\)/.test(schema));

/* ------------------------------------------------------------------ */
console.log('\nLE MODE DÉMONSTRATION DOIT FAIRE VIVRE LE MÉCANISME');

verifier('il y a des chantiers de démonstration',
  initialChantiers.length >= 2);

verifier('…dont un TERMINÉ et un EN COURS',
  initialChantiers.some((c) => c.statut === 'termine')
  && initialChantiers.some((c) => c.statut === 'en_cours'),
  'La pastille « En cours » et l\'ordre de tri ne se vérifient pas sinon.');

/* ON FAIT TOURNER la comparaison, on ne la lit pas. `myProId` vient de
   `Object.keys(pros)[0]` dans OpusApp, donc c'est TOUJOURS une chaîne, et les
   chantiers d'exemple portent un nombre : un `===` strict rendait une liste
   vide et le bloc « Mes chantiers » ne s'affichait JAMAIS sans fichier
   `.env`. Trouvé au navigateur. Ici on refait le calcul exact. */
const monProDemo = Object.keys(proProfiles)[0];
verifier('en démonstration, le pro connecté A des chantiers',
  initialChantiers.filter((c) => String(c.proId) === String(monProDemo)).length > 0,
  'Sinon l\'artisan de démonstration ne voit rien du lot, et c\'est le seul '
  + 'compte qu\'on puisse ouvrir sans fichier `.env`.');

/* …et le calcul qu'on vient de refaire doit être CELUI du code : les deux
   endroits qui comparent un `proId` à l'identifiant du pro connecté passent
   par `String()` des deux côtés. `mesPublications` tenait déjà cette garde,
   les chantiers non — c'est ce qui a fait disparaître le bloc entier. */
verifier('…et AUCUNE comparaison de `proId` n\'est stricte',
  /\.filter\(\(c\) => String\(c\.proId\) === String\(myProId\)\)/.test(app)
  && /String\(chantierOuvert\.proId\) === String\(myProId\)/.test(app)
  && /\.filter\(\(c\) => String\(c\.proId\) === String\(proId\)\)/
    .test(sansCommentaires(lire('src/lib/api.js')))
  /* …et on cherche ce qui RESTE : un `proId` comparé sans `String()` des
     deux côtés, où que ce soit dans OpusApp. */
  && !app.split('\n').some((l) => /chantier/i.test(l) && /\.proId === /.test(l)),
  'Un `===` strict entre un nombre et une chaîne ne lève aucune erreur : il '
  + 'rend une liste vide ou un `false`, et le bloc n\'existe plus. Trois '
  + 'endroits sont tombés dedans dans ce seul lot.');

verifier('créer un chantier FAIT quelque chose en démonstration',
  /creerChantier = !hasSupabase \? creerChantierDemo/.test(api)
  && /changerStatutChantier = !hasSupabase\s*\n?\s*\? changerStatutChantierDemo/.test(api),
  'Avec `noop`, la feuille se refermait sans rien créer : on tapait un nom, '
  + 'on validait, et il ne se passait rien. L\'écran ne mentait pas, il se '
  + 'taisait — et le mécanisme ne s\'essayait nulle part sans fichier `.env`.');

verifier('…et le doublon est refusé du MÊME côté qu\'en base',
  /c\.titre\.trim\(\)\.toLowerCase\(\) === propre\.toLowerCase\(\)/.test(api),
  'L\'index unique porte sur `lower(btrim(titre))`. Deux comportements pour '
  + 'le même geste et la démonstration ne montre pas l\'application.');

verifier('les étapes de démonstration portent une VRAIE date',
  initialPosts.filter((p) => p.chantierId).every((p) => !!p.publieLe)
  && /sort\(\(a, b\) => new Date\(a\.publieLe \|\| 0\) - new Date\(b\.publieLe \|\| 0\)\)/.test(api),
  'Sans date, la page du chantier sortait les étapes dans l\'ordre du '
  + 'FICHIER — donc la dernière d\'abord, puisque le fil range du plus '
  + 'récent au plus ancien. Mesuré au navigateur.');

verifier('…un chantier raconté en au moins QUATRE étapes',
  initialChantiers.some((c) => c.nbPublications >= 4),
  'Avec une seule publication, la page du chantier ne montre pas une '
  + 'histoire — et c\'est tout l\'objet du lot.');

{
  /* ON RECOMPTE. `nbPublications` et `couverture` sont recopiés dans le
     jeu de démonstration alors qu'en base un déclencheur les calcule.
     Sans ce contrôle, ils deviendraient faux au premier exemple ajouté —
     et la démonstration montrerait autre chose que l'application. */
  const reel = {};
  initialPosts.filter((p) => p.chantierId)
    .forEach((p) => { reel[p.chantierId] = (reel[p.chantierId] || 0) + 1; });
  const faux = initialChantiers
    .filter((c) => (reel[c.id] || 0) !== c.nbPublications)
    .map((c) => `${c.titre} annonce ${c.nbPublications}, en porte ${reel[c.id] || 0}`);
  verifier('…et les compteurs de démonstration DISENT VRAI',
    faux.length === 0, faux.join(' · '));
}

verifier('les textes d\'étape nomment de VRAIES étapes de métier',
  initialPosts.filter((p) => p.chantierId && p.texte)
    .some((p) => /couverture|chevrons|sous-toiture|liteaux/i.test(p.texte)),
  'C\'est la matière dont le récit écrit aura besoin : des étapes nommées, '
  + 'dans l\'ordre. Un « Ggggggg » ne raconterait rien.');

/* ------------------------------------------------------------------ */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Les publications se cousent, et personne n\'y met le nom de son client.\n');
