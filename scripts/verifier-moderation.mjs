/**
 * Les motifs de signalement et les types de cible existent à DEUX endroits :
 * dans l'application (src/data/moderation.js) et dans les contraintes
 * `check (... in (...))` de supabase/schema.sql.
 *
 * Une divergence fait refuser l'enregistrement par la base sans que rien ne
 * le montre en mode démo — exactement ce qui s'était passé avec le format
 * « montage ». Et un signalement refusé, c'est un signalement perdu.
 *
 * node scripts/verifier-moderation.mjs
 */
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/schema.sql', 'utf8');
const app = readFileSync('src/data/moderation.js', 'utf8');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const entreApostrophes = (t) => [...t.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const memesElements = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function contrainte(nom, colonne) {
  const bloc = sql.match(
    new RegExp(`add constraint ${nom}[\\s\\S]*?check \\(${colonne} in \\(([\\s\\S]*?)\\n?\\s*\\)\\)`),
  );
  if (!bloc) throw new Error(`contrainte introuvable : ${nom}`);
  return entreApostrophes(bloc[1].replace(/--[^\n]*/g, ''));
}

function liste(nom) {
  const bloc = app.match(new RegExp(`export const ${nom} = \\[([\\s\\S]*?)\\n\\];`));
  if (!bloc) throw new Error(`${nom} introuvable dans src/data/moderation.js`);
  return [...bloc[1].matchAll(/cle: '([^']+)'/g)].map((m) => m[1]);
}

console.log('\nMotifs de signalement');
const motifsSql = contrainte('signalements_motif_check', 'motif');
const motifsApp = liste('MOTIFS');
verifier(`${motifsApp.length} motifs identiques`, memesElements(motifsApp, motifsSql),
  `app: ${motifsApp.join(', ')}\n      sql: ${motifsSql.join(', ')}`);

console.log('\nTypes de contenu signalable');
const ciblesSql = contrainte('signalements_cible_type_check', 'cible_type');
const ciblesApp = liste('CIBLES');
verifier(`${ciblesApp.length} types identiques`, memesElements(ciblesApp, ciblesSql),
  `app: ${ciblesApp.join(', ')}\n      sql: ${ciblesSql.join(', ')}`);

console.log('\nCe que la base doit protéger');
verifier('la table des blocages existe', /create table if not exists public\.blocages/.test(sql));
verifier('un blocage ne peut pas viser soi-même',
  /blocage_pas_soi_meme[\s\S]*?check \(bloqueur_id <> bloque_id\)/.test(sql));
verifier('le masquage est symétrique (les deux sens sont testés)',
  /b\.bloqueur_id = auth\.uid\(\) and b\.bloque_id\s+= p_autre[\s\S]*?b\.bloqueur_id = p_autre\s+and b\.bloque_id\s+= auth\.uid\(\)/.test(sql));
verifier('on ne peut pas lister qui vous a bloqué',
  /create policy "mes blocages"[\s\S]*?using \(auth\.uid\(\) = bloqueur_id\)/.test(sql));
verifier('un signalement ne se modifie pas après coup',
  !/create policy[^\n]*signalement[^\n]*for update/i.test(sql));
verifier('les avis survivent à la suppression de leur auteur',
  /reviews_author_id_fkey[\s\S]*?on delete set null/.test(sql));
verifier('les commentaires aussi',
  /comments_author_id_fkey[\s\S]*?on delete set null/.test(sql));
verifier('les signalements aussi',
  /signalements_auteur_id_fkey[\s\S]*?on delete set null/.test(sql));
verifier('`anon` ne peut pas appeler les fonctions à privilèges',
  /revoke execute on function %s from anon/.test(sql));

/* ==========================================================================
   LOT S-b (26/10/2026) — « CLORE OUI, OUVRIR NON » : le blocage ferme aussi
   ce qu'on ÉCRIT, et la cloche se tait (décisions D2, Q1, Q2).
   Les commentaires SQL sont retirés avant de lire : un contrôle qui lit du
   code retire d'abord la documentation, sinon il accuse le commentaire qui
   explique le défaut (la leçon des lots 5 et 8).
   ========================================================================== */
const sqlCode = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const politiques = (nom, table) => [...sqlCode.matchAll(
  new RegExp(`create policy "${nom}" on public\\.${table}\\b([\\s\\S]*?);`, 'g'))].map((m) => m[1]);
const unePolitique = (nom, table) => {
  const toutes = politiques(nom, table);
  return toutes.length === 1 ? toutes[0].replace(/\s+/g, ' ') : null;
};
/* Le corps s'arrête au `$$` qui FERME, où qu'il soit (seconde relecture du
   27/10) : couper à la première ligne qui commence par `$$;` lisait bien
   au-delà d'une fonction qui finit par `end; $$;` sur la même ligne — la
   suivante entrait dans « son » corps, et un motif y trouvait ce qu'il
   cherchait. Toutes les fonctions de `schema.sql` sont écrites `as $$`. */
const fonction = (nom) => {
  const morceaux = sqlCode.split(`create or replace function public.${nom}(`);
  if (morceaux.length !== 2) return null;
  const t = morceaux[1];
  const debut = t.indexOf('$$');
  const fin = debut < 0 ? -1 : t.indexOf('$$', debut + 2);
  return fin < 0 ? null : t.slice(0, fin);
};
const forme = (texte) => (texte || '').replace(/\s+/g, ' ').trim();
const checkDe = (pol) => (pol && pol.includes(' with check ') ? pol.split(' with check ')[1] : '');
const usingDe = (pol) => (pol && pol.includes(' using ') ? pol.split(' using ')[1].split(' with check ')[0] : '');

console.log('\nLot S-b — le blocage ferme aussi ce qu’on écrit (R-B)');
{
  const ecritures = [
    /* Des sous-requêtes CORRÉLÉES — elles cherchent LA ligne visée, par sa
       clé (relecture du 26/10) : écrites `x in (select id from t)`, elles
       relisaient toute la table à chaque écriture, `est_masque()` une fois
       par ligne — 0,7 s par « j'aime » à 50 000 publications. */
    ['mes likes', 'post_likes', /exists \(select 1 from public\.posts p where p\.id = post_likes\.post_id\)/],
    ['mes comments', 'comments', /exists \(select 1 from public\.posts p where p\.id = comments\.post_id\)/],
    ['mes follows', 'follows', /not public\.est_masque\(following_id\)/],
    ['mes reviews', 'reviews', /not public\.est_masque\(professional_id\)/],
    ['mes reponses', 'demande_reponses', /exists \(select 1 from public\.demandes d where d\.id = demande_reponses\.demande_id and d\.statut = 'ouverte' and d\.client_id <> auth\.uid\(\)\)/],
    ['annonce reponses ecriture', 'annonce_reponses', /exists \(select 1 from public\.annonces_pro a where a\.id = annonce_reponses\.annonce_id and a\.statut = 'ouverte' and a\.auteur_id <> auth\.uid\(\)\)/],
  ];
  for (const [nom, table, regle] of ecritures) {
    const pol = unePolitique(nom, table);
    /* La règle est dans le `with check`, JAMAIS dans le `using` : `using`
       gouverne aussi la SUPPRESSION, et l'on retire toujours ce qu'on a
       posé (« clore, oui »). Et la politique n'est créée qu'à UN endroit. */
    verifier(`« ${nom} » : créée une seule fois, \`to authenticated\`, la règle dans le \`with check\` et pas dans le \`using\``,
      !!pol && /\bto authenticated\b/.test(pol) && regle.test(checkDe(pol)) && !regle.test(usingDe(pol))
        && !/est_masque|in \(select|exists \(/.test(usingDe(pol)),
      pol || `${politiques(nom, table).length} création(s)`);
  }
  /* DÉCISION Q2 : l'artisan lit TOUJOURS les avis qui le concernent. */
  const lecture = unePolitique('lecture reviews', 'reviews');
  verifier('« lecture reviews » : créée une seule fois, et l’artisan lit les avis qui le visent malgré le blocage',
    !!lecture && /\bto authenticated\b/.test(lecture)
      && /not public\.est_masque\(author_id\) or professional_id = auth\.uid\(\)/.test(lecture),
    lecture || `${politiques('lecture reviews', 'reviews').length} création(s)`);
  /* Une réponse sous un commentaire masqué : `limite_profondeur_commentaire`
     cherche le parent AVEC LES DROITS DE CELUI QUI ÉCRIT. Si elle devenait
     `security definer`, elle le trouverait — et la porte se rouvrirait. */
  const profondeur = fonction('limite_profondeur_commentaire') || '';
  verifier('la réponse à un commentaire masqué reste refusée : `limite_profondeur_commentaire` n’est pas `security definer`',
    profondeur.length > 0 && !/security\s+definer/i.test(profondeur.split('$$')[0])
      && /if not found/.test(profondeur)
      /* Et rien ne la rend `security definer` après coup (seconde relecture
         du 27/10) : un `alter function` posé plus bas ne touchait pas
         l'en-tête que lit la ligne précédente. */
      && !/alter\s+function\s+(public\.)?"?limite_profondeur_commentaire\b/i.test(sqlCode));
  /* ET LE COMMENTAIRE D'ORIGINE AUSSI (relecture du 26/10) : répondre à la
     réponse d'un TIERS rangeait la réponse sous le commentaire de la
     personne en blocage — le parent immédiat était lisible, la racine non.
     La seconde recherche suit DIRECTEMENT le rattachement (seconde relecture
     du 27/10 : un `return new;` glissé entre les deux la rendait
     inatteignable, au vert). */
  const rattache = profondeur.indexOf('new.parent_id := grand_parent;');
  const apres = rattache >= 0 ? profondeur.slice(rattache) : '';
  /* Lisible ET sous la même publication (troisième relecture du 27/10) :
     une réponse incohérente écrite avant la règle servait de marchepied,
     le parent direct était bien sous la publication déclarée, le
     commentaire d'origine non. */
  verifier('…et le commentaire d’ORIGINE du fil doit être lisible ET sous la même publication : relu JUSTE APRÈS le rattachement, refusé sinon',
    rattache > 0 && /^new\.parent_id := grand_parent;\s+select post_id into post_d_origine\s+from public\.comments where id = grand_parent;\s+if not found or post_d_origine is distinct from new\.post_id then\s+raise exception 'Le commentaire parent n''existe pas';/.test(apres));
  /* ET LA MÊME PUBLICATION (seconde relecture du 27/10) : la lecture des
     commentaires ne filtre que leur auteur ; une réponse qui déclarait une
     autre publication que son parent s'accrochait au fil d'une publication
     cachée. Comparé à l'écriture qui pose le lien, pas à l'anonymisation. */
  /* Une écriture qui ne touche pas au lien (corriger son texte,
     l'anonymisation) sort AVANT la recherche — et seulement elle : le
     test porte sur les DEUX colonnes du lien (troisième relecture). */
  verifier('…et une réponse vit sous la publication de son parent : seule une modification qui ne touche pas au lien sort avant, puis `post_du_parent is distinct from new.post_id` refuse',
    /if new\.parent_id is null then return new; end if;\s+if tg_op = 'UPDATE'\s+and new\.post_id is not distinct from old\.post_id\s+and new\.parent_id is not distinct from old\.parent_id then\s+return new;\s+end if;\s+select parent_id, post_id into grand_parent, post_du_parent\s+from public\.comments where id = new\.parent_id;\s+if not found or post_du_parent is distinct from new\.post_id then\s+raise exception/.test(profondeur));
  /* UN « J'AIME » ET UN ABONNEMENT NE SE DÉPLACENT PAS : la porte UPDATE de
     `for all` gonflait les compteurs sans limite (relecture du 26/10). */
  const revokeLikes = sqlCode.indexOf('revoke update on public.post_likes, public.follows from anon, authenticated;');
  verifier('`post_likes` et `follows` : plus de droit UPDATE pour `anon` ni `authenticated`, et aucun `grant` ne le rend plus bas',
    revokeLikes > 0 && !/grant\s[^;]*\bon\s+(table\s+)?public\.(post_likes|follows)\b/.test(sqlCode.slice(revokeLikes)));
  /* AUCUNE politique ne relit une table ENTIÈRE à chaque écriture. */
  const nonCorrelees = [...sqlCode.matchAll(/create policy "([^"]+)" on public\.(\w+)([\s\S]*?);/g)]
    .filter((m) => /\bin \(select [a-z]\.id from public\.(posts|demandes|annonces_pro)\b/.test(m[3]))
    .map((m) => `${m[2]}.${m[1]}`);
  verifier('aucune politique n’écrit `x in (select id from posts|demandes|annonces_pro)` : la sous-requête cherche LA ligne visée',
    nonCorrelees.length === 0, nonCorrelees.join(', '));
  /* Toute politique qui appelle `est_masque()` est `to authenticated` :
     appelée pour un visiteur, à qui son exécution est retirée, elle ÉCHOUE
     au lieu de filtrer (section 13.1). */
  const toutes = [...sqlCode.matchAll(/create policy "([^"]+)" on public\.(\w+)([\s\S]*?);/g)];
  const sansRole = toutes.filter((m) => /est_masque/.test(m[3]) && !/\bto authenticated\b/.test(m[3])).map((m) => `${m[2]}.${m[1]}`);
  verifier(`toute politique qui appelle \`est_masque()\` est \`to authenticated\` (${toutes.filter((m) => /est_masque/.test(m[3])).length} relevées)`,
    sansRole.length === 0, sansRole.join(', '));
}

console.log('\nLot S-b — les demandes reçues, les urgences, les devis, sous blocage');
{
  const demande = fonction('tient_la_demande');
  verifier('`tient_la_demande` : `security invoker`, R-A, tout figé sauf le statut (OP019), le blocage à l’acceptation (OP020)',
    !!demande && /security invoker/.test(demande) && /current_user not in \('authenticated', 'anon'\)/.test(demande)
      && /\(to_jsonb\(new\) - 'statut'\) is distinct from \(to_jsonb\(old\) - 'statut'\)/.test(demande)
      && /new\.statut = accepte and public\.est_masque\(new\.client_id\)/.test(demande)
      && /errcode = 'OP020'/.test(demande));
  for (const [table, nom] of [['quote_requests', 'devis'], ['callback_requests', 'rappel'], ['sos_requests', 'sos']]) {
    verifier(`…posé AVANT toute mise à jour de \`${table}\``,
      new RegExp(`create or replace trigger trg_tient_la_demande_${nom}\\s+before update on public\\.${table}\\s+for each row execute function public\\.tient_la_demande\\(\\)`).test(sqlCode));
  }
  const lien = fonction('tient_le_lien_du_devis');
  verifier('`tient_le_lien_du_devis` : `security definer` — il doit voir le blocage posé par le CLIENT —, lit les DEUX sens, ne lit jamais `auth.uid()`',
    /* DEUX BRANCHES (la demande, l'urgence), et CHACUNE lit les deux sens :
       un motif cherché « quelque part » laissait une branche perdre un sens
       pendant que l'autre le gardait (trouvé en cassant, 26/10). */
    !!lien && /security definer/.test(lien) && !/auth\.uid\(\)/.test(lien)
      && (lien.match(/b\.bloqueur_id = new\.pro_id and b\.bloque_id = v_client/g) || []).length === 2
      && (lien.match(/b\.bloqueur_id = v_client and b\.bloque_id = new\.pro_id/g) || []).length === 2
      && /new\.quote_request_id is not null/.test(lien) && /new\.sos_request_id is not null/.test(lien));
  /* PostgreSQL déclenche les `before` d'une table dans l'ordre ALPHABÉTIQUE
     de leurs noms. On relève donc les VRAIS noms posés sur `devis` — une
     comparaison de deux chaînes écrites ici serait toujours vraie, quoi que
     dise le schéma (c'était le cas jusqu'au 26/10). */
  const avantDevis = [...sqlCode.matchAll(/create (?:or replace )?trigger (\w+)\s+before [^;]*? on public\.devis\s/g)]
    .map((m) => m[1]).sort();
  verifier('…posé sur `devis` APRÈS `trg_tient_le_devis` (ordre alphabétique) : « pas à vous » (OP013) est décidé avant le blocage',
    /create or replace trigger trg_tient_le_lien_du_devis\s+before insert or update of quote_request_id, sos_request_id on public\.devis/.test(sqlCode)
      && avantDevis.includes('trg_tient_le_devis')
      && avantDevis.indexOf('trg_tient_le_devis') < avantDevis.indexOf('trg_tient_le_lien_du_devis'),
    avantDevis.join(', '));
  const peut = fonction('peut_faire_un_devis');
  verifier('`peut_faire_un_devis` : `security definer`, seulement pour les demandes ADRESSÉES à l’appelant, exécutable par `authenticated` seul',
    !!peut && /security definer/.test(peut) && /q\.professional_id = auth\.uid\(\)/.test(peut)
      && /s\.professional_id = auth\.uid\(\)/.test(peut)
      && /\(b\.bloqueur_id = auth\.uid\(\) and b\.bloque_id = c\.client_id\)\s+or \(b\.bloqueur_id = c\.client_id and b\.bloque_id = auth\.uid\(\)\)/.test(peut)
      && /\(p_demande is null\) <> \(p_urgence is null\)/.test(peut)
      && /revoke all on function public\.peut_faire_un_devis\(uuid, uuid\) from public, anon;/.test(sqlCode)
      && /grant execute on function public\.peut_faire_un_devis\(uuid, uuid\) to authenticated;/.test(sqlCode));
}

console.log('\nLot S-b — la cloche se tait (décision Q1)');
{
  const tait = fonction('tait_les_notifications_bloquees');
  /* Q1 : on ne tait QUE ce que le destinataire reçoit de quelqu'un qu'IL a
     bloqué. Le sens inverse (l'artisan qui a bloqué refuse : le client est
     prévenu) doit passer — un test « dans les deux sens » le casserait. */
  /* L'AUTRE SENS, POUR UN COMMENTAIRE SEULEMENT (relecture du 26/10) : une
     notification qui désigne un commentaire que la lecture cache à son
     destinataire. Une seule occurrence, et sous la condition
     `new.comment_id is not null` — sans elle, le refus d'une demande
     n'arriverait plus au client bloqué (décision Q1). */
  const autreSens = (tait || '').match(/b\.bloqueur_id = new\.acteur_id/g) || [];
  verifier('`tait_les_notifications_bloquees` : `security definer`, `return null` ; le destinataire a bloqué l’acteur ; l’autre sens pour un COMMENTAIRE seulement',
    !!tait && /security definer/.test(tait) && /return null;/.test(tait)
      /* LA SÉQUENCE ENTIÈRE du premier sens, jusqu'à son `return null` : la
         branche du commentaire porte AUSSI un `return null`, et « il y a un
         `return null` quelque part » laissait neutraliser le premier sens au
         vert (trouvé en cassant, 26/10). */
      && /if exists \(select 1 from public\.blocages b\s+where b\.bloqueur_id = new\.user_id and b\.bloque_id = new\.acteur_id\) then\s+return null;\s+end if;/.test(tait)
      && autreSens.length === 1
      && /if new\.comment_id is not null\s+and exists \(select 1 from public\.blocages b\s+where b\.bloqueur_id = new\.acteur_id and b\.bloque_id = new\.user_id\) then\s+return null;/.test(tait),
    `${autreSens.length} occurrence(s) de l’autre sens`);
  verifier('…posé AVANT l’insertion d’une notification',
    /create or replace trigger trg_tait_les_notifications_bloquees\s+before insert on public\.notifications/.test(sqlCode));
  /* LA LISTE FERMÉE DES TYPES JAMAIS TUS = tous les types ADRESSÉS À
     L'ADMINISTRATION. On les trouve dans la base elle-même : une insertion
     dans `notifications` qui lit `public.administrateurs`. Un type ajouté
     demain pour l'administration, et oublié dans la liste, rougit ici. */
  const jamaisTus = ((tait || '').match(/new\.type in \(([^)]*)\)/) || [])[1] || '';
  const listeJamais = entreApostrophes(jamaisTus);
  const versAdmin = [...sqlCode.matchAll(/insert into public\.notifications[^;]*?select[^;]*?'([a-z_]+)'[^;]*?from public\.administrateurs/g)]
    .map((m) => m[1]);
  /* L'ÉGALITÉ, pas l'inclusion (relecture du 26/10) : y glisser
     « commentaire » rendait sonores les notifications de la personne
     bloquée, au vert. La liste ne contient QUE ce qui va à l'administration. */
  const admin = [...new Set(versAdmin)].sort();
  verifier(`la liste des jamais tus est EXACTEMENT celle des types adressés à l’administration (${admin.join(', ') || 'aucun trouvé'})`,
    admin.length >= 1 && JSON.stringify([...new Set(listeJamais)].sort()) === JSON.stringify(admin),
    `liste : ${listeJamais.join(', ')}`);
  /* Et l'administration le LIT là où elle travaille (relecture du 26/10) :
     la phrase de la file existe tant que la liste des jamais tus contient
     `demande_pro_nouvelle` — et pas au-delà. */
  /* Les commentaires retirés d'abord (seconde relecture du 27/10) : une
     phrase rangée dans un commentaire JSX n'est plus AFFICHÉE, et la
     trouver là passait au vert. */
  const ecranAdmin = readFileSync('src/screens/AdminScreen.js', 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+/g, ' ');
  verifier('…et l’écran d’administration dit qu’une demande de compte pro arrive même de quelqu’un qu’on a bloqué',
    listeJamais.includes('demande_pro_nouvelle')
      === ecranAdmin.includes('Une demande arrive même de quelqu’un que vous avez bloqué : vous devez pouvoir l’examiner.'));
  verifier('…et ce qui n’a pas d’acteur (les décisions de l’administration) passe toujours',
    /if new\.acteur_id is null\s+or new\.type in/.test(tait || ''));
}

console.log('\nLot S-b — ce qu’un contrôle de texte doit pouvoir voir (relecture du 26/10)');
{
  /* LES FORMES QUI CHANGENT UNE RÈGLE SANS LA RÉÉCRIRE. Un `alter policy`
     posé plus bas rouvrait un `with check` sans qu'aucun contrôle ne relise
     la politique ; un `disable trigger` éteignait un verrou. Aucune n'existe
     dans `schema.sql` : `alter policy` est réservé aux migrations de la
     vraie base, qui se prouvent par empreinte. */
  const interdits = [
    ['alter policy', /\balter policy\b/],
    ['disable row level security', /\bdisable row level security\b/],
    ['no force row level security', /\bno force row level security\b/],
    ['disable trigger', /\bdisable trigger\b/],
    ['session_replication_role', /\bsession_replication_role\b/],
  ];
  for (const [nom, motif] of interdits) {
    verifier(`\`schema.sql\` ne contient aucun \`${nom}\``, !motif.test(sqlCode));
  }
  /* UNE FONCTION NE SE CRÉE QU'À UN ENDROIT : un contrôle qui lit la
     PREMIÈRE définition ne voit pas la seconde, qui gagne au rejeu.
     `notifie_demande` est la seule exception connue (sa seconde définition
     est celle que lit `verifier-demo`) — à résorber, pas à imiter. */
  const nbFonctions = {};
  for (const m of sqlCode.matchAll(/create or replace function public\.(\w+)\(/g)) nbFonctions[m[1]] = (nbFonctions[m[1]] || 0) + 1;
  const doublesF = Object.entries(nbFonctions).filter(([n, k]) => k > 1 && n !== 'notifie_demande').map(([n, k]) => `${n} ×${k}`);
  verifier('aucune fonction n’est créée deux fois dans `schema.sql` (sauf `notifie_demande`, connue)',
    doublesF.length === 0 && nbFonctions.notifie_demande === 2, doublesF.join(', '));
  /* UN DÉCLENCHEUR, UNE TABLE, UNE CRÉATION : une redéfinition plus bas
     (`before update of statut`) ne se déclenchait plus quand seule la
     description changeait. */
  const nbDecl = {};
  for (const m of sqlCode.matchAll(/create (?:or replace )?trigger (\w+)\s+(?:before|after|instead of)[^;]*?\son\s+(\w+\.\w+)/g)) {
    const cle = `${m[1]} sur ${m[2]}`;
    nbDecl[cle] = (nbDecl[cle] || 0) + 1;
  }
  const doublesD = Object.entries(nbDecl).filter(([, k]) => k > 1).map(([n, k]) => `${n} ×${k}`);
  verifier(`aucun déclencheur n’est créé deux fois sur la même table (${Object.keys(nbDecl).length} relevés)`,
    Object.keys(nbDecl).length > 40 && doublesD.length === 0, doublesD.join(', '));
  /* LA LISTE FERMÉE DES POLITIQUES, table par table : une politique de plus
     — même sous un autre nom, même sans `public.` — s'ADDITIONNE en OU et
     annule ce que le blocage ferme. Un nom nouveau sur ces tables se
     décide, et se met dans cette liste. */
  const ATTENDUES = {
    posts: ['ecriture mes posts', 'lecture posts', 'lecture posts visiteur'],
    post_likes: ['lecture likes', 'mes likes'],
    follows: ['lecture follows', 'mes follows'],
    comments: ['lecture comments', 'lecture comments visiteur', 'mes comments'],
    reviews: ['lecture reviews', 'lecture reviews visiteur', 'mes reviews'],
    demande_reponses: ['lecture reponses', 'lecture reponses visiteur', 'mes reponses'],
    annonce_reponses: ['annonce reponses ecriture', 'annonce reponses lecture pro'],
    professional_partners: ['je demande un partenariat', 'je reponds a un partenariat', 'je romps un partenariat',
      'lecture partenaires', 'lecture partenariats'],
    quote_requests: ['creation devis', 'le pro traite le devis', 'lecture mes devis'],
    callback_requests: ['creation rappel', 'le pro traite le rappel', 'lecture mes rappels'],
    sos_requests: ['creation sos', 'le pro traite le sos', 'lecture mes sos'],
    annonces_pro: ['annonces ecriture auteur', 'annonces lecture pro'],
    demandes: ['lecture demandes', 'mes demandes'],
    notifications: ['mes notifications'],
    blocages: ['mes blocages'],
    /* Les conversations, les messages et les pièces jointes ENTRENT dans la
       liste (seconde relecture du 27/10) : la phrase « vos conversations …
       masquées des deux côtés » ne tient que par elles, et une seconde
       lecture sous un autre nom la rendait fausse au vert. La double
       création historique de « mes conversations » (sections 7 et 13.5) ne
       gêne pas : on compare des NOMS. */
    conversations: ['creation conversation', 'mes conversations'],
    messages: ['envoi message', 'lecture mes messages'],
    objects: ['envoi de mes fichiers', 'envoi piece jointe', 'lecture de mes documents',
      'lecture des documents par l administration', 'lecture piece jointe', 'lecture publique des medias',
      'remplacement de mes fichiers', 'suppression de mes fichiers'],
  };
  const creations = [...sqlCode.matchAll(/create policy "([^"]+)"\s+on\s+(?:(\w+)\.)?(\w+)/g)]
    .map((m) => ({ nom: m[1], schema: m[2] || null, table: m[3] }));
  const sansSchema = creations.filter((c) => !c.schema).map((c) => `${c.table}.${c.nom}`);
  verifier(`toute politique nomme son schéma (\`on public.x\`, \`on storage.objects\`) — ${creations.length} relevées`,
    creations.length > 90 && sansSchema.length === 0, sansSchema.join(', '));
  for (const [table, noms] of Object.entries(ATTENDUES)) {
    if (!noms) continue;
    const vus = [...new Set(creations.filter((c) => c.table === table).map((c) => c.nom))].sort();
    verifier(`\`${table}\` : exactement ${noms.length} politique(s) — ${noms.join(', ')}`,
      JSON.stringify(vus) === JSON.stringify([...noms].sort()), vus.join(', '));
  }
}

console.log('\nLot S-b — les formes ENTIÈRES des règles nouvelles (seconde relecture du 27/10)');
{
  /* Une règle se compare ENTIÈRE, espaces réduits, et non par morceaux
     cherchés « quelque part » : un `and` devenu `or`, un `exists` devenu
     `not exists` (qui contient toujours « exists ( »), un `return new;`
     glissé avant la garde — chacun rouvrait une règle au vert. Changer une
     de ces règles se DÉCIDE : on change la base, l'essai 51 b, et la forme
     attendue ici, dans le même lot, en disant pourquoi. */
  const FORMES = {
    "tait_les_notifications_bloquees": ") returns trigger language plpgsql security definer set search_path = public as $$ begin if new.acteur_id is null or new.type in ('demande_pro_nouvelle') then return new; end if; if exists (select 1 from public.blocages b where b.bloqueur_id = new.user_id and b.bloque_id = new.acteur_id) then return null; end if; if new.comment_id is not null and exists (select 1 from public.blocages b where b.bloqueur_id = new.acteur_id and b.bloque_id = new.user_id) then return null; end if; return new; end;",
    "calcule_client_verifie": ") returns trigger language plpgsql security definer set search_path = public as $$ begin if tg_op = 'UPDATE' and new.author_id is null then new.client_verifie := old.client_verifie; return new; end if; new.client_verifie := exists ( select 1 from public.quote_requests q where q.client_id = new.author_id and q.professional_id = new.professional_id and q.statut in ('accepte', 'termine') ) or exists ( select 1 from public.callback_requests c where c.client_id = new.author_id and c.professional_id = new.professional_id and c.statut in ('accepte', 'termine') ) or exists ( select 1 from public.sos_requests s where s.client_id = new.author_id and s.professional_id = new.professional_id and s.statut in ('acceptee', 'termine') ); return new; end;",
    "limite_profondeur_commentaire": ") returns trigger language plpgsql set search_path = public as $$ declare grand_parent uuid; post_du_parent uuid; post_d_origine uuid; begin if new.parent_id is null then return new; end if; if tg_op = 'UPDATE' and new.post_id is not distinct from old.post_id and new.parent_id is not distinct from old.parent_id then return new; end if; select parent_id, post_id into grand_parent, post_du_parent from public.comments where id = new.parent_id; if not found or post_du_parent is distinct from new.post_id then raise exception 'Le commentaire parent n''existe pas'; end if; if grand_parent is not null then new.parent_id := grand_parent; select post_id into post_d_origine from public.comments where id = grand_parent; if not found or post_d_origine is distinct from new.post_id then raise exception 'Le commentaire parent n''existe pas'; end if; end if; return new; end;",
    "tient_l_urgence": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user not in ('authenticated', 'anon') then return new; end if; if not exists ( select 1 from public.sos_availability sa join public.professional_profiles pp on pp.id = sa.professional_id join public.tarifs_pro t on t.pro_id = sa.professional_id where sa.professional_id = new.professional_id and sa.metier_key = new.metier_key and sa.actif and pp.metiers @> array[public.metier_du_sos(sa.metier_key)] and t.affiche is true and t.frais_deplacement_centimes is not null and t.taux_horaire_centimes is not null and t.majoration_pct is not null) then raise exception 'Cet artisan ne répond plus aux urgences de ce métier en ce moment : relancez la recherche pour voir ceux qui sont disponibles.' using errcode = 'OP025'; end if; return new; end;",
    "tient_le_compteur_d_annonce": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then if tg_op = 'INSERT' then new.nb_reponses := 0; else new.nb_reponses := old.nb_reponses; end if; end if; return new; end;",
    "tient_le_compteur_de_demande": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then if tg_op = 'INSERT' then new.nb_reponses := 0; else new.nb_reponses := old.nb_reponses; end if; end if; return new; end;",
  };
  for (const [nom, attendu] of Object.entries(FORMES)) {
    const vu = forme(fonction(nom));
    verifier(`\`${nom}\` a exactement la forme relue et éprouvée par l’essai 51 b`, vu === attendu,
      vu ? `reçu : ${vu.slice(0, 240)}…` : 'fonction introuvable, ou créée plusieurs fois');
  }
  const POLITIQUES = [
    ["mes likes", "post_likes", "for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.posts p where p.id = post_likes.post_id))"],
    ["mes comments", "comments", "for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id and exists (select 1 from public.posts p where p.id = comments.post_id))"],
    ["mes reponses", "demande_reponses", "for all to authenticated using (auth.uid() = professional_id) with check ( auth.uid() = professional_id and exists (select 1 from public.demandes d where d.id = demande_reponses.demande_id and d.statut = 'ouverte' and d.client_id <> auth.uid()) )"],
    ["annonce reponses ecriture", "annonce_reponses", "for all to authenticated using (auth.uid() = professional_id) with check ( auth.uid() = professional_id and public.est_un_pro() and exists (select 1 from public.annonces_pro a where a.id = annonce_reponses.annonce_id and a.statut = 'ouverte' and a.auteur_id <> auth.uid()) )"],
  ];
  for (const [nom, table, attendu] of POLITIQUES) {
    const vu = forme(unePolitique(nom, table));
    verifier(`« ${nom} » a exactement la forme relue et éprouvée par l’essai 51 b`, vu === attendu,
      vu ? `reçu : ${vu}` : `${politiques(nom, table).length} création(s)`);
  }
  /* LES LECTURES QUE LE BLOCAGE MASQUE, entières (troisième relecture du
     27/10) : la présence de `not public.est_masque(...)` « quelque part »
     laissait passer un `or true` ajouté au bout, ou une seconde branche
     `or auth.uid() in (…)` — et les textes promettent « masquées des deux
     côtés ». Ces politiques sont créées deux fois dans le fichier (l'ancienne
     forme, puis la nouvelle) : c'est la DERNIÈRE qui compte dans la base. */
  const derniereForme = (nom, cible) => {
    const toutes = [...sqlCode.matchAll(new RegExp(`create policy "${nom}" on ${cible.replace('.', '\\.')}\\b([\\s\\S]*?);`, 'g'))];
    return toutes.length ? forme(toutes[toutes.length - 1][1]) : null;
  };
  const LECTURES = [
    ['lecture posts', 'public.posts', 'for select to authenticated using (not public.est_masque(author_id))'],
    ['lecture comments', 'public.comments', 'for select to authenticated using (not public.est_masque(author_id))'],
    ['mes conversations', 'public.conversations', 'for select to authenticated using ( (auth.uid() = client_id and not public.est_masque(professional_id)) or (auth.uid() = professional_id and not public.est_masque(client_id)) )'],
    ['lecture mes messages', 'public.messages', 'for select to authenticated using ( not public.est_masque(sender_id) and exists ( select 1 from public.conversations c where c.id = messages.conversation_id and (c.client_id = auth.uid() or c.professional_id = auth.uid())))'],
    ['lecture piece jointe', 'storage.objects', "for select to authenticated using ( bucket_id = 'pieces-jointes' and exists ( select 1 from public.conversations c where c.id::text = (storage.foldername(name))[2] and (c.client_id = auth.uid() or c.professional_id = auth.uid()) and not public.est_masque(c.client_id) and not public.est_masque(c.professional_id)))"],
  ];
  for (const [nom, cible, attendu] of LECTURES) {
    const vu = derniereForme(nom, cible);
    verifier(`« ${nom} » (la dernière créée) a exactement la forme qui masque sous blocage`, vu === attendu,
      vu ? `reçu : ${vu}` : 'introuvable');
  }
  /* LES DÉCLENCHEURS, entiers (troisième relecture du 27/10) : les formes
     ci-dessus comparaient les FONCTIONS, jamais ce qui les appelle. Une
     clause `when (…)`, un événement retiré (`before update` seul) éteignait
     la règle — et tout restait au vert. */
  const DECLENCHEURS = [
    'create or replace trigger trg_tient_le_partenariat before insert or update on public.professional_partners for each row execute function public.tient_le_partenariat();',
    'create or replace trigger trg_tait_les_notifications_bloquees before insert on public.notifications for each row execute function public.tait_les_notifications_bloquees();',
    'create or replace trigger trg_tient_la_demande_devis before update on public.quote_requests for each row execute function public.tient_la_demande();',
    'create or replace trigger trg_tient_la_demande_rappel before update on public.callback_requests for each row execute function public.tient_la_demande();',
    'create or replace trigger trg_tient_la_demande_sos before update on public.sos_requests for each row execute function public.tient_la_demande();',
    'create or replace trigger trg_tient_l_urgence before insert on public.sos_requests for each row execute function public.tient_l_urgence();',
    'create or replace trigger trg_tient_le_compteur_d_annonce before insert or update on public.annonces_pro for each row execute function public.tient_le_compteur_d_annonce();',
    'create or replace trigger trg_maj_nb_reponses_demande after insert or delete on public.demande_reponses for each row execute function public.maj_nb_reponses_demande();',
    'create or replace trigger trg_tient_le_compteur_de_demande before insert or update on public.demandes for each row execute function public.tient_le_compteur_de_demande();',
    'create or replace trigger trg_tient_la_reponse before update on public.demande_reponses for each row execute function public.tient_la_reponse();',
    'create or replace trigger trg_tient_la_reponse before update on public.annonce_reponses for each row execute function public.tient_la_reponse();',
    'create or replace trigger trg_tient_le_lien_du_devis before insert or update of quote_request_id, sos_request_id on public.devis for each row execute function public.tient_le_lien_du_devis();',
    'create trigger trg_limite_profondeur_commentaire before insert or update on public.comments for each row execute function public.limite_profondeur_commentaire();',
    'create trigger trg_reviews_client_verifie before insert or update on public.reviews for each row execute function public.calcule_client_verifie();',
  ];
  for (const attendu of DECLENCHEURS) {
    const [, nom, table] = attendu.match(/trigger (\w+) .* on public\.(\w+) for each row/);
    const vus = [...sqlCode.matchAll(new RegExp(`create\\s+(?:or\\s+replace\\s+)?trigger\\s+"?${nom}"?\\b[^;]*;`, 'gi'))]
      .map((m) => forme(m[0])).filter((d) => new RegExp(`\\son\\s+(?:"?public"?\\s*\\.\\s*)?"?${table}"?\\s`, 'i').test(d));
    verifier(`le déclencheur \`${nom}\` sur \`${table}\` a exactement sa forme (événements, aucune clause \`when\`)`,
      vus.length === 1 && vus[0] === attendu, vus.join(' | ') || 'introuvable');
  }
}

console.log('\nLot S-b — une lecture TOLÉRANTE du même SQL (seconde relecture du 27/10)');
{
  /* Les motifs plus haut lisent une ORTHOGRAPHE : minuscules, une espace,
     des guillemets, `public.` collé au nom. Le même ordre SQL s'écrit
     autrement — `ALTER POLICY` en majuscules ou sur deux lignes, une
     politique sans guillemets, `"public"."post_likes"`, une espace avant
     « ( », `enable replica trigger` (qui éteint sans dire « disable ») — et
     chacune de ces formes rouvrait une règle du lot sans qu'aucun contrôle
     ne rougisse. Cette lecture-ci ne remplace pas les motifs : elle ignore
     la casse, accepte tous les blancs, rend guillemets et schéma facultatifs,
     et compte. Un faux refus ici se corrige en relisant le SQL, pas en
     assouplissant le motif. */
  const t = sqlCode;
  const interditsI = [
    ['alter policy', /\balter\s+policy\b/i],
    ['alter function', /\balter\s+function\b/i],
    ['disable row level security', /\bdisable\s+row\s+level\s+security\b/i],
    ['no force row level security', /\bno\s+force\s+row\s+level\s+security\b/i],
    ['disable / enable replica / enable always trigger', /\b(disable|enable\s+(replica|always))\s+trigger\b/i],
    ['session_replication_role', /\bsession_replication_role\b/i],
  ];
  for (const [nom, motif] of interditsI) verifier(`(tolérant) \`schema.sql\` ne contient aucun \`${nom}\`, quelle que soit sa casse`, !motif.test(t));
  /* TOUT LE SQL DE `schema.sql` EST EN MINUSCULES (troisième relecture du
     27/10) : une politique recréée en MAJUSCULES sous le même nom, plus
     bas, remplaçait la règle sans qu'aucun motif ne la voie. Plutôt que de
     rendre chaque motif insensible à la casse, on refuse la casse : un mot
     clé du DDL écrit autrement qu'en minuscules, hors des chaînes. */
  const sansChaines = t.replace(/'(?:[^']|'')*'/g, "''");
  const enCapitales = [...sansChaines.matchAll(/\b(create|drop|alter|grant|revoke|policy|trigger|function|routine|procedure|security|definer|disable|enable|replica|execute|on|to|using)\b/gi)]
    .filter((m) => m[0] !== m[0].toLowerCase()).map((m) => sansChaines.slice(m.index, m.index + 40).replace(/\s+/g, ' '));
  verifier('(tolérant) aucun mot clé SQL n’est écrit autrement qu’en minuscules (hors chaînes et commentaires)',
    enCapitales.length === 0, enCapitales.slice(0, 3).join(' | '));
  /* …et leurs SYNONYMES : `alter routine`, `drop routine`, une procédure. */
  verifier('(tolérant) aucun `alter`/`drop`/`create` de `routine` ou de `procedure`',
    !/\b(alter|drop|create(\s+or\s+replace)?)\s+(routine|procedure)\b/i.test(t));
  /* …et aucun droit accordé « sur toutes les tables » : il rouvrirait d'un
     coup chaque `revoke` du fichier. */
  verifier('(tolérant) aucun `grant … on all tables|sequences|functions|routines in schema`',
    !/\bgrant\s[^;]*\bon\s+all\s+(tables|sequences|functions|routines|procedures)\s+in\s+schema\b/i.test(t));
  const ID = '(?:"([^"]+)"|(\\w+))';
  const SCH = '(?:(?:"\\w+"|\\w+)\\s*\\.\\s*)?';
  /* les déclencheurs : nom et table, schéma facultatif ; et aucun `drop
     trigger` APRÈS la dernière création du même déclencheur */
  const decl = [...t.matchAll(new RegExp(`create\\s+(?:or\\s+replace\\s+)?trigger\\s+${ID}\\s+(?:before|after|instead\\s+of)[^;]*?\\son\\s+${SCH}"?(\\w+)"?`, 'gi'))]
    .map((m) => ({ nom: (m[1] || m[2]).toLowerCase(), table: m[3].toLowerCase(), i: m.index }));
  const nbD = {};
  for (const d of decl) nbD[`${d.nom} sur ${d.table}`] = (nbD[`${d.nom} sur ${d.table}`] || 0) + 1;
  const doublesD = Object.entries(nbD).filter(([, k]) => k > 1).map(([n, k]) => `${n} ×${k}`);
  verifier(`(tolérant) aucun déclencheur n’est créé deux fois sur la même table (${decl.length} relevés)`,
    decl.length > 40 && doublesD.length === 0, doublesD.join(', '));
  const derniere = {};
  for (const d of decl) derniere[d.nom] = Math.max(derniere[d.nom] || 0, d.i);
  const dropsApres = [...t.matchAll(new RegExp(`drop\\s+trigger\\s+(?:if\\s+exists\\s+)?${ID}`, 'gi'))]
    .map((m) => ({ nom: (m[1] || m[2]).toLowerCase(), i: m.index }))
    .filter((d) => derniere[d.nom] !== undefined && d.i > derniere[d.nom]);
  verifier('(tolérant) aucun `drop trigger` ne vient après la dernière création du même déclencheur',
    dropsApres.length === 0, dropsApres.map((d) => d.nom).join(', '));
  /* les fonctions : schéma et guillemets facultatifs, espace avant « ( » */
  const nbF = {};
  const derniereF = {};
  for (const m of t.matchAll(new RegExp(`create\\s+(?:or\\s+replace\\s+)?function\\s+${SCH}${ID}\\s*\\(`, 'gi'))) {
    const n = (m[1] || m[2]).toLowerCase();
    nbF[n] = (nbF[n] || 0) + 1;
    derniereF[n] = Math.max(derniereF[n] || 0, m.index);
  }
  const doublesF = Object.entries(nbF).filter(([n, k]) => k > 1 && n !== 'notifie_demande').map(([n, k]) => `${n} ×${k}`);
  verifier('(tolérant) aucune fonction n’est créée deux fois (sauf `notifie_demande`, connue)',
    doublesF.length === 0 && nbF.notifie_demande === 2, doublesF.join(', '));
  /* Un `drop function` AVANT la création (une signature qui change, sur une
     base ancienne — `artisans_urgence`) est légitime ; APRÈS la dernière
     création, il retire la règle sans que rien d'autre ne le voie. */
  const dropsF = [...t.matchAll(new RegExp(`drop\\s+function\\s+(?:if\\s+exists\\s+)?${SCH}${ID}`, 'gi'))]
    .map((m) => ({ nom: (m[1] || m[2]).toLowerCase(), i: m.index }))
    .filter((d) => derniereF[d.nom] !== undefined && d.i > derniereF[d.nom]);
  verifier('(tolérant) aucun `drop function` ne vient après la dernière création de la même fonction',
    dropsF.length === 0, dropsF.map((d) => d.nom).join(', '));
  /* les politiques : nom avec ou sans guillemets, schéma facultatif — le
     NOMBRE de noms par table, celui de la liste fermée plus haut */
  const pols = [...t.matchAll(new RegExp(`create\\s+policy\\s+${ID}\\s+on\\s+${SCH}"?(\\w+)"?`, 'gi'))]
    .map((m) => ({ nom: m[1] || m[2].toLowerCase(), table: m[3].toLowerCase() }));
  const ATT = { posts: 3, post_likes: 2, follows: 2, comments: 3, reviews: 3, demande_reponses: 3, annonce_reponses: 2,
    professional_partners: 5, quote_requests: 3, callback_requests: 3, sos_requests: 3, annonces_pro: 2, demandes: 2,
    notifications: 1, blocages: 1, conversations: 2, messages: 2, objects: 8 };
  for (const [table, k] of Object.entries(ATT)) {
    const vus = [...new Set(pols.filter((x) => x.table === table).map((x) => x.nom))];
    verifier(`(tolérant) \`${table}\` : ${k} nom(s) de politique, guillemets et schéma facultatifs`, vus.length === k, vus.join(', '));
  }
  /* les droits : plusieurs tables dans le même `grant` */
  const ap = t.indexOf('revoke update on public.post_likes, public.follows from anon, authenticated;');
  verifier('(tolérant) aucun `grant` ne rend une écriture sur `post_likes` ou `follows`, même cité parmi d’autres tables',
    ap > 0 && !new RegExp(`grant\\s[^;]*?\\bon\\s+(?:table\\s+)?(?:[\\w."]+\\s*,\\s*)*${SCH}"?(post_likes|follows)"?\\b`, 'i').test(t.slice(ap)));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Tout est cohérent.\n');
