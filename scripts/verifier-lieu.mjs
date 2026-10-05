/**
 * OÙ SE PASSE UNE PUBLICATION — le socle du filtre du fil.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Le fil n'avait aucun filtre. Pas « un filtre perfectible » : la requête
 * était
 *
 *     select * from posts order by created_at desc limit 20
 *
 * Tant qu'il y a sept artisans, personne ne s'en aperçoit. À mille, un
 * particulier de Marseille regarde les chantiers de Lille.
 *
 * Et le relevé sur la vraie base, le 05/10/2026, disait que RIEN ne
 * pourrait fonctionner même en écrivant l'écran parfaitement :
 *
 *     posts                    : aucune colonne de coordonnées
 *     particuliers localisés   : 1 sur 5
 *     un artisan qui s'inscrit : aucune coordonnée
 *
 * C'est la même famille que les trois tables du 01/10 écrites et jamais
 * relues, et que `annonces_pro.medias` du 04/10 lue et jamais écrite : un
 * bout de chaîne qui ne touche rien, et rien pour le dire — aucune erreur,
 * aucun écran cassé, aucun contrôle rouge.
 *
 * LES TROIS CHOSES QUI COMPTENT LE PLUS ICI
 * -----------------------------------------
 *   1. **Le lieu ne peut PAS être calculé par PostgreSQL.** Il ne sait pas
 *      appeler la Base Adresse Nationale. C'est l'application qui appelle
 *      `completerLieu()` juste avant d'écrire — à l'inscription et à la
 *      publication —, et un déclencheur qui sert de PLANCHER quand elle
 *      n'a pas pu.
 *   2. **`posts.ville` ne filtre rien.** C'est un champ de texte libre du
 *      formulaire, vide par défaut. Filtrer à 20 km sur ce que quelqu'un a
 *      tapé à la main, ce n'est pas filtrer.
 *   3. **Les deux coordonnées ou aucune.** Une latitude seule ne situe
 *      rien, et laisserait une ligne qui a l'air placée.
 *
 *   npm run verifier-lieu
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

/* Cinq fois déjà, un contrôle a accusé la DOCUMENTATION qui expliquait le
   défaut qu'il traque. On retire les commentaires avant de lire du code. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const sqlSansCommentaires = (c) => c.replace(/^\s*--.*$/gm, '');

const sql    = lire('supabase/schema.sql');
const sqlNu  = sqlSansCommentaires(sql);
const api    = sansCommentaires(lire('src/lib/api.js'));
const app    = sansCommentaires(lire('src/OpusApp.js'));
const auth   = sansCommentaires(lire('src/screens/AuthScreen.js'));
const creer  = sansCommentaires(lire('src/screens/CreerScreen.js'));

console.log('\nUne publication porte son lieu');
{
  verifier('posts.latitude existe',
    /alter table public\.posts add column if not exists latitude\s+double precision;/.test(sqlNu));
  verifier('posts.longitude existe',
    /alter table public\.posts add column if not exists longitude\s+double precision;/.test(sqlNu));
  verifier('et elles sont indexées',
    /create index if not exists idx_posts_lieu[\s\S]{0,120}?latitude, longitude/.test(sqlNu),
    'sans index, un cadre de 20 km parcourt toute la table');
  verifier('le métier avec la date aussi',
    /create index if not exists idx_posts_metier_date[\s\S]{0,120}?metier, created_at desc/.test(sqlNu),
    'c’est l’autre moitié du filtre : « les maçons, du plus récent au plus ancien »');
}

console.log('\nLe lieu est posé par la BASE quand l’application n’a pas pu');
{
  const i = sqlNu.indexOf('create or replace function public.pose_le_lieu_du_post()');
  const fn = i === -1 ? '' : sqlNu.slice(i, sqlNu.indexOf('$$;', i));

  verifier('le déclencheur existe', i !== -1);
  verifier('il se déclenche AVANT l’insertion',
    /create or replace trigger trg_pose_le_lieu_du_post\s+before insert on public\.posts/.test(sqlNu),
    'après l’insertion, il faudrait un second UPDATE — et un instant où la '
    + 'publication n’est nulle part');
  verifier('…et par `create or replace`, jamais `drop` + `create`',
    !/drop trigger if exists trg_pose_le_lieu_du_post/.test(sqlNu),
    'le connecteur Supabase refuse tout ordre qui COMMENCE par `drop` (section 24), '
    + 'et la paire laisserait un instant sans déclencheur');

  verifier('une publicité est laissée tranquille',
    /if new\.author_id is null then\s*return new;/.test(fn),
    '`is_ad` n’a pas d’auteur : il n’y a rien à hériter');
  verifier('ce que l’application a envoyé n’est pas écrasé',
    /if new\.latitude is not null and new\.longitude is not null then\s*return new;/.test(fn),
    'l’application sait placer un chantier sur une AUTRE commune que la fiche');
  verifier('les DEUX coordonnées, jamais une seule',
    /fiche\.latitude is not null and fiche\.longitude is not null/.test(fn));
  verifier('la commune affichée suit quand le formulaire l’a laissée vide',
    /new\.ville\s*:=\s*nullif\(btrim\(coalesce\(fiche\.ville/.test(fn),
    'une publication placée à 43,6° / 5,3° qui n’affiche aucune ville est illisible');
}

console.log('\nUne coordonnée illisible ne coûte pas un compte');
{
  const i = sqlNu.indexOf('create or replace function public.coord_ou_null(');
  const fn = i === -1 ? '' : sqlNu.slice(i, sqlNu.indexOf('$$;', i));

  verifier('coord_ou_null existe', i !== -1);
  verifier('elle refuse ce qui n’est pas un nombre', /!~\s*'\^-\?\[0-9\]/.test(fn));
  verifier('…et ce qui sort des bornes', /abs\(btrim\(brut\)::double precision\) > borne/.test(fn));
  verifier('elle rend null, elle ne lève JAMAIS',
    !/raise/.test(fn),
    'une métadonnée malformée ne doit pas faire échouer une inscription — '
    + 'même règle que les métiers inventés de la section 31');

  /* L'ORDRE DU FICHIER COMPTE : une fonction est contrôlée à sa création. */
  const j = sqlNu.indexOf('create or replace function public.cree_fiche_utilisateur()');
  verifier('elle est déclarée AVANT celle qui l’appelle',
    i !== -1 && j !== -1 && i < j,
    'c’est la leçon de mon_compte() / mes_donnees() : une fonction SQL est '
    + 'contrôlée au moment où on la crée');
}

console.log('\nLe compte naît placé — et c’est l’application qui le place');
{
  const i = sqlNu.indexOf('create or replace function public.cree_fiche_utilisateur()');
  const fn = i === -1 ? '' : sqlNu.slice(i, sqlNu.indexOf('$$;', i));

  verifier('la ligne `users` reçoit la commune et les coordonnées',
    /insert into public\.users[\s\S]{0,400}?ville, code_postal, latitude, longitude\)/.test(fn));
  verifier('la fiche pro aussi',
    /insert into public\.professional_profiles[\s\S]{0,300}?code_postal, latitude, longitude\)/.test(fn));
  verifier('les coordonnées passent par coord_ou_null',
    /public\.coord_ou_null\(meta ->> 'latitude', 90\)/.test(fn)
    && /public\.coord_ou_null\(meta ->> 'longitude', 180\)/.test(fn));
  verifier('les deux ou aucune, tenu par la base aussi',
    /if la_lat is null or la_lon is null then\s*la_lat := null;\s*la_lon := null;/.test(fn),
    'la base reçoit d’autres clients que cette application');
  verifier('le badge n’est toujours pas dans les colonnes nommées',
    !/\bverifie\b/.test(fn.slice(fn.indexOf('insert into public.professional_profiles'))),
    'ces métadonnées sont écrites par le CLIENT : l’insertion nomme ses colonnes');
}

console.log('\nLa ville est demandée aux DEUX, à l’inscription');
{
  /* Elle était dans la branche `estPro ? (…) : (…)`, donc jamais proposée à
     un particulier. On vérifie qu'elle est SORTIE de cette branche.

     ET ON VISE LE JSX, PAS LA VALIDATION. `mode === 'inscription'` apparaît
     neuf fois dans ce fichier : la première est dans `valider()`, mille
     lignes au-dessus du formulaire. Le premier jet de ce contrôle a donc
     cherché `<ChampVille` dans du code de validation, ne l'a pas trouvé, et
     a crié au défaut. Un contrôle qui ne trouve pas sa cible rend un
     résultat pour la mauvaise raison — ici dans le bon sens, ce qui est le
     plus rare ; cinq fois déjà, c'était dans l'autre. */
  const i = auth.indexOf("{mode === 'inscription' && (");
  const bloc = i === -1 ? '' : auth.slice(i, i + 2600);
  const posEstPro = bloc.indexOf('estPro ? (');
  const posChamp  = bloc.indexOf('<ChampVille');
  const posFinBranche = bloc.indexOf(')}', bloc.indexOf(') : ('));

  verifier('le formulaire demande une ville', posChamp !== -1);
  /* ET IL FAUT REGARDER CE QU'IL Y A ENTRE LES DEUX, pas seulement l'ordre.
     Le premier jet se contentait de « le champ vient APRÈS la branche ».
     Éprouvé en remettant le défaut à la main — un `{estPro && …}` posé
     juste après la branche —, il passait au vert : le champ était bien
     après, et toujours réservé aux pros. Un contrôle se vérifie en cassant
     ce qu'il surveille. */
  const entre = (posChamp !== -1 && posFinBranche !== -1)
    ? bloc.slice(posFinBranche, posChamp) : 'estPro';
  verifier('…en dehors de la branche réservée aux pros',
    posChamp !== -1 && posEstPro !== -1 && posChamp > posFinBranche,
    'dans la branche `estPro`, un particulier n’a ni commune ni coordonnées, '
    + 'et aucune recherche « autour de moi » ne peut fonctionner pour lui');
  verifier('…et sans aucune condition `estPro` devant',
    !/estPro/.test(entre),
    'la réserver aux pros par une autre porte revient exactement au même : '
    + 'un particulier sans commune ne peut rien chercher autour de lui');
  verifier('elle est obligatoire',
    /if \(!lieu\.affichage\.trim\(\)\)/.test(auth),
    'sans elle, le fil montre les chantiers de toute la France');
  verifier('et on dit POURQUOI on la demande',
    /style=\{s\.aide\}/.test(auth),
    'un champ sans raison reste vide, ou fait abandonner');
}

console.log('\nLe lieu se complète dans l’application, jamais dans la base');
{
  verifier('signUp emporte la commune pour TOUT LE MONDE',
    /if \(ville\) metadonnees\.ville = ville;/.test(api)
    && !/userType === 'pro'[\s\S]{0,200}?metadonnees\.ville/.test(api),
    'elle était dans le `if (userType === \'pro\')`');
  verifier('…et le code postal', /metadonnees\.code_postal = codePostal/.test(api));
  verifier('les deux coordonnées ou aucune',
    /if \(latitude != null && longitude != null\) \{\s*metadonnees\.latitude/.test(api));

  verifier('handleSignUp appelle completerLieu',
    /handleSignUp[\s\S]{0,1200}?await completerLieu\(/.test(app),
    'PostgreSQL ne sait pas appeler la Base Adresse Nationale : sans cet '
    + 'appel, un artisan qui vient de s’inscrire n’apparaît dans AUCUNE '
    + 'recherche par secteur');
  verifier('…et un échec ne bloque pas l’inscription',
    /handleSignUp[\s\S]{0,1400}?catch \{[^}]*\}\s*\}\s*\n\s*const \{ session \}/.test(app),
    'un réseau coupé ne doit pas empêcher de créer un compte — même règle '
    + 'que le vibreur de retour.js');

  verifier('la publication complète son lieu elle aussi',
    /completerLieu\(\{ affichage: createVille \}\)/.test(app));
  verifier('…et createPost les transmet',
    /latitude: \(latitude != null && longitude != null\) \? latitude : null/.test(api));
}

console.log('\nLa ville du chantier ne se retape pas à chaque photo');
{
  verifier('elle est pré-remplie depuis la fiche',
    /villePosee\.current = true;\s*if \(!createVille\.trim\(\)\) setCreateVille\(moi\.ville\)/.test(creer));
  verifier('…une seule fois par ouverture de l’écran',
    /if \(villePosee\.current \|\| !moi \|\| !moi\.ville\) return;/.test(creer),
    'sans ce verrou, effacer le champ volontairement le remplirait à nouveau '
    + 'au rendu suivant, et on ne pourrait plus publier sans ville');
  verifier('et elle n’est pas vidée après une publication',
    !/setCreateVille\(''\)/.test(app),
    'on publie trois photos du même chantier à la suite ; un champ qu’on '
    + 'retape est un champ qu’on finit par laisser vide');
}

console.log('\nLe rattrapage des publications déjà en base');
{
  /* `update public.posts p` apparaît DEUX fois : le rattrapage des
     compteurs de commentaires (section 20) le fait déjà. On prend le
     dernier — celui de la section 32. Le premier jet prenait le premier, et
     accusait donc le mauvais ordre SQL. */
  const i = sqlNu.lastIndexOf('update public.posts p');
  const ordre = i === -1 ? '' : sqlNu.slice(i, sqlNu.indexOf(';', i));

  verifier('il existe', i !== -1,
    'seize publications sans coordonnées existaient : sans rattrapage, poser '
    + 'le filtre ferait disparaître TOUT le contenu, et ça ressemblerait à un '
    + 'filtre cassé');
  verifier('…et il ne touche que ce qui n’est pas placé',
    /p\.latitude is null/.test(ordre),
    'schema.sql est rejoué deux fois, toujours : le second passage doit être '
    + 'un no-op');
  verifier('…sans écraser une commune déjà écrite',
    /coalesce\(nullif\(btrim\(coalesce\(p\.ville/.test(ordre));
}

console.log('');
if (echecs) {
  console.error(`${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('Tout est bon.\n');
