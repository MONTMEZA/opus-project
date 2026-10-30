/**
 * LA REMISE EN AVANT — une règle, une seule écriture, et des phrases vraies
 * (lot S-c, 30/10/2026).
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Jusqu'au lot S-c, « Remettre en avant » récrivait la date de publication ;
 * la base la remettait aussitôt (seul le texte se corrige), et l'écran
 * annonçait « remise en tête du fil ». Le bouton ne faisait RIEN, et rien ne
 * le disait. La règle vit désormais dans la base (`remonter_publication()`,
 * section 52.9) ; ce qui peut se dégrader sans bruit, c'est tout le reste :
 *
 * 1. **les nombres** : l'écran et les textes disent « sept jours » et
 *    « trois », la base compte autre chose ;
 * 2. **le refus** : une date lue à la mauvaise heure (un `hint` sans fuseau
 *    lu à l'heure du téléphone a une à deux heures d'écart en France), une
 *    minute tronquée qui annonce « 14 h 03 » pour un instant à 14 h 03 min
 *    12 s, une date au passé ;
 * 3. **la démonstration**, seconde écriture de la règle, qui divergerait ;
 * 4. **le fil** : la clé de tri et le curseur doivent être la même chose,
 *    sinon une page qui finit sur une publication remise en avant perd ou
 *    double des publications ;
 * 5. **le récit d'un chantier**, qui doit dater une étape par sa
 *    PUBLICATION, jamais par sa remise en avant — ce serait un texte public
 *    faux ;
 * 6. **les phrases** : « en tête » (faux dès que quelqu'un publie), un
 *    bandeau de succès sur un refus, le texte de l'ordre du fil écrit deux
 *    fois.
 *
 * IL FAIT TOURNER ce qui décide : `phraseDuRefus` dans TROIS fuseaux
 * (Paris, la Martinique, Kiritimati — une date se trompe d'un jour à
 * l'ouest comme à l'est), `decisionRemontee` sur les cas de
 * `essais-section-51c.sql` (J3 à J7), la clé de tri et la pagination de la
 * démonstration, `rowToPost` et `etapesPourLeRecit`.
 *
 *   npm run verifier-remontee
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ICI = fileURLToPath(import.meta.url);

/* ------------------------------------------------------------------ */
/*  LE MODE « FUSEAU » : appelé par le contrôle lui-même, dans un      */
/*  processus dont TZ est posé. `node` lit TZ à son démarrage : on ne   */
/*  peut pas changer de fuseau en cours de route.                       */
/* ------------------------------------------------------------------ */
if (process.argv[2] === '--fuseau') {
  const { phraseDuRefus, jourEtHeure } = await import('../src/lib/remontee.js');
  const maintenant = Date.UTC(2026, 9, 30, 9, 0, 0); // 30/10/2026, 9 h UTC
  const sortie = {
    // 5 novembre 2026, 13 h 03 min 12 s UTC — la minute s'arrondit AU-DESSUS.
    publication: phraseDuRefus({ code: 'OP022', details: 'publication', hint: '2026-11-05T13:03:12Z' }, maintenant),
    artisan: phraseDuRefus({ code: 'OP022', details: 'artisan', hint: '2026-11-05T13:03:00Z' }, maintenant),
    // Juste avant minuit UTC : le jour change selon le fuseau.
    minuit: jourEtHeure(Date.UTC(2026, 10, 1, 23, 30, 0), maintenant),
    // Un an plus tard : l'année se dit.
    annee: jourEtHeure(Date.UTC(2027, 0, 4, 10, 0, 0), maintenant),
  };
  process.stdout.write(JSON.stringify(sortie));
  process.exit(0);
}

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Les commentaires partent d'abord : plusieurs fois dans ce projet un
   contrôle a accusé la documentation qui expliquait le défaut qu'il traque. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const sqlSansCommentaires = (c) => c.replace(/^\s*--.*$/gm, '').replace(/[ \t]+--[^\n']*$/gm, '');
const espaces = (t) => t.replace(/\s+/g, ' ');
/* Une fonction qui PLANTE sur un cas doit rendre ce cas faux, pas arrêter le
   contrôle : un contrôle qui plante ne vérifie plus rien du tout. */
const sur = (f) => { try { return f(); } catch (e) { return `PLANTE : ${e.message}`; } };

const {
  REGLE_REMONTEE, MESSAGES_REFUS_REMONTEE, NOTE_REMONTEE, SUPPRESSION_APRES_REMISE,
  lireInstant, phraseDuRefus, versHint, decisionRemontee, remiseRecente, libelleRemise,
} = await import('../src/lib/remontee.js');
const { cleDeTri, cleDemo, trierDemo, decouperPage } = await import('../src/lib/page-fil.js');
const { rowToPost } = await import('../src/lib/publication.js');
const { etapesPourLeRecit } = await import('../src/lib/recit.js');
const { ORDRE_DU_FIL, CGU } = await import('../src/data/legal.js');

const SCHEMA = lire('supabase/schema.sql');
const sql = sqlSansCommentaires(SCHEMA);
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const mesPubs = sansCommentaires(lire('src/screens/MesPublicationsScreen.js'));
const erreurs = sansCommentaires(lire('src/lib/erreurs.js'));

/* Le corps d'une fonction SQL, du `create or replace` au `$$;` qui la
   ferme. Une seule définition, sinon la seconde gagne au rejeu. */
function corpsSql(nom) {
  const debut = `create or replace function public.${nom}(`;
  const morceaux = sql.split(debut);
  if (morceaux.length !== 2) return { n: morceaux.length - 1, corps: '' };
  const reste = morceaux[1];
  const ouvre = reste.indexOf('$$');
  const ferme = reste.indexOf('$$', ouvre + 2);
  return { n: 1, entete: reste.slice(0, ouvre), corps: reste.slice(ouvre + 2, ferme) };
}
/* Le corps d'une fonction JavaScript `const nom = async (…) => { … };` ou
   `function nom(…) { … }`, par comptage des accolades. */
function corpsJs(texte, marque) {
  const i = texte.indexOf(marque);
  if (i < 0) return '';
  const debut = texte.indexOf('{', i + marque.length - 1);
  let niveau = 0;
  for (let k = debut; k < texte.length; k += 1) {
    if (texte[k] === '{') niveau += 1;
    else if (texte[k] === '}') { niveau -= 1; if (niveau === 0) return texte.slice(debut, k + 1); }
  }
  return '';
}

/* ================================================================== */
console.log('\n1. Les nombres : la base, l’écran et les textes disent la même règle');
{
  const r = corpsSql('remonter_publication');
  verifier('`remonter_publication` est définie UNE fois', r.n === 1, `${r.n} définition(s)`);
  const jours = [...r.corps.matchAll(/interval '(\d+) days'/g)].map((m) => Number(m[1]));
  verifier(`la base compte ${REGLE_REMONTEE.jours} jours, partout (publication ET professionnel)`,
    jours.length >= 4 && jours.every((j) => j === REGLE_REMONTEE.jours), `relevé : ${jours.join(', ')}`);
  const parPro = (r.corps.match(/if n >= (\d+) then/) || [])[1];
  const offset = (r.corps.match(/offset (\d+) limit 1/) || [])[1];
  verifier(`…et ${REGLE_REMONTEE.parProfessionnel} par professionnel (le seuil, et la place qui se libère après la ${REGLE_REMONTEE.parProfessionnel}e)`,
    Number(parPro) === REGLE_REMONTEE.parProfessionnel && Number(offset) === REGLE_REMONTEE.parProfessionnel - 1,
    `seuil ${parPro}, offset ${offset}`);

  const messagesSql = [...r.corps.matchAll(/raise exception\s+'((?:[^']|'')*)'\s+using errcode = 'OP022', detail = (?:'(\w+)'|quelle)/g)]
    .map((m) => m[1].replace(/''/g, "'"));
  verifier('les trois phrases de refus de la base sont, MOT POUR MOT, celles de `MESSAGES_REFUS_REMONTEE`',
    messagesSql.length === 3
      && Object.values(MESSAGES_REFUS_REMONTEE).every((m) => messagesSql.includes(m)),
    'la démonstration doit refuser exactement comme la vraie base');

  const lettres = { 3: 'trois', 7: 'sept' };
  verifier('la note de « Mes publications » dit les nombres en lettres, sans « undefined »',
    !/undefined/.test(NOTE_REMONTEE + SUPPRESSION_APRES_REMISE)
      && NOTE_REMONTEE.includes(`tous les ${lettres[REGLE_REMONTEE.jours]} jours`)
      && NOTE_REMONTEE.includes(`${lettres[REGLE_REMONTEE.parProfessionnel]} remises en avant au plus`)
      && /Une semaine après sa publication/.test(NOTE_REMONTEE)
      && SUPPRESSION_APRES_REMISE.includes(lettres[REGLE_REMONTEE.parProfessionnel]));
  verifier('l’ordre du fil (CGU) dit la même règle : une semaine, sept jours, trois',
    /une semaine après sa publication, puis une fois tous les sept jours/.test(ORDRE_DU_FIL)
      && /plus de trois sur sept jours, même s’il en supprime une ensuite/.test(ORDRE_DU_FIL)
      && REGLE_REMONTEE.jours === 7 && REGLE_REMONTEE.parProfessionnel === 3);
}

/* ================================================================== */
console.log('\n2. La base : un verrou, puis la lecture ; refusée à qui n’est pas connecté');
{
  const r = corpsSql('remonter_publication');
  const entete = espaces(r.entete || '');
  verifier('`security definer`, `set search_path`, et VOLATILE (jamais stable ni immutable)',
    /returns timestamptz language plpgsql volatile security definer set search_path = public as/.test(entete)
      && !/\b(stable|immutable)\b/.test(entete));
  const iVerrou = r.corps.indexOf("pg_advisory_xact_lock(hashtextextended('remontee:' || moi::text, 0))");
  const iLecture = r.corps.indexOf('from public.remontees');
  const iMoi = r.corps.indexOf('if moi is null then');
  verifier('l’ordre : « pas connecté » refusé, PUIS le verrou du compte, PUIS la première lecture de l’historique',
    iMoi >= 0 && iVerrou > iMoi && iLecture > iVerrou,
    `moi ${iMoi}, verrou ${iVerrou}, lecture ${iLecture} — sans verrou, deux appuis simultanés passent tous les deux`);
  verifier('le `hint` est arrondi à la seconde SUPÉRIEURE, en UTC, avec son « Z »',
    /if date_trunc\('second', bloquant\) < bloquant then\s+bloquant := date_trunc\('second', bloquant\) \+ interval '1 second';/.test(r.corps)
      && (r.corps.match(/hint = to_char\(bloquant at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'\)/g) || []).length === 2);
  verifier('à égalité des deux instants, c’est la PUBLICATION qui est dite (`>=`)',
    /if pour_art is null or \(pour_pub is not null and pour_pub >= pour_art\) then/.test(r.corps));
  verifier('la remise en avant ÉCRIT l’historique et la date — et rien d’autre de la publication',
    /insert into public\.remontees \(post_id, auteur_id, remontee_le\)\s+values \(pub\.id, moi, maintenant\);\s+update public\.posts set remonte_le = maintenant where id = pub\.id;\s+return maintenant;/.test(r.corps));
  const droits = espaces(sql);
  verifier('exécutable par `authenticated` seul (PUBLIC et `anon` retirés)',
    /revoke all on function public\.remonter_publication\(uuid\) from public, anon;/.test(droits)
      && /grant execute on function public\.remonter_publication\(uuid\) to authenticated;/.test(droits));

  const fil = corpsSql('fil_filtre');
  verifier('le fil s’ordonne par `coalesce(remonte_le, created_at)`, puis l’identifiant',
    /order by coalesce\(p\.remonte_le, p\.created_at\) desc, p\.id desc/.test(fil.corps));
  verifier('…et son curseur s’écrit SANS `coalesce` (sinon la politique tourne sur chaque ligne sautée)',
    /\(p_avant is null\s+or p\.remonte_le < p_avant\s+or \(p\.remonte_le is null and p\.created_at < p_avant\)\)/.test(fil.corps)
      && !/coalesce\([^)]*\)\s*<\s*p_avant/.test(fil.corps));
}

/* ================================================================== */
console.log('\n3. Le refus, à l’heure du téléphone — FAIT TOURNER dans trois fuseaux');
{
  verifier('un refus qui n’est pas OP022 rend `null` (l’appelant retombe sur `messageClair`)',
    sur(() => phraseDuRefus({ code: '42501', details: 'publication', hint: '2026-11-05T13:03:12Z' })) === null
      && sur(() => phraseDuRefus(null)) === null);
  verifier('« absente » rend la phrase de la base, sans date',
    sur(() => phraseDuRefus({ code: 'OP022', details: 'absente', hint: null })) === MESSAGES_REFUS_REMONTEE.absente);
  verifier('un `hint` SANS fuseau est refusé (lu à l’heure du téléphone, il serait faux d’une à deux heures)',
    sur(() => lireInstant('2026-11-05T13:03:12')) === null
      && sur(() => phraseDuRefus({ code: 'OP022', details: 'publication', hint: '2026-11-05T13:03:12' })) === null);
  verifier('…un `hint` illisible aussi, et un `detail` inconnu',
    sur(() => phraseDuRefus({ code: 'OP022', details: 'publication', hint: 'demain' })) === null
      && sur(() => phraseDuRefus({ code: 'OP022', details: 'autre', hint: '2026-11-05T13:03:12Z' })) === null);
  verifier('…et un `hint` avec un décalage explicite se lit à son vrai instant',
    sur(() => lireInstant('2026-11-05T14:03:12+01:00')) === Date.UTC(2026, 10, 5, 13, 3, 12));
  const m = Date.UTC(2026, 9, 30, 9, 0, 0);
  verifier('un instant déjà passé, ou à moins d’une minute : « dans un instant », jamais une date au passé',
    /dans un instant/.test(phraseDuRefus({ code: 'OP022', details: 'publication', hint: '2026-10-30T08:59:00Z' }, m))
      && /dans un instant/.test(phraseDuRefus({ code: 'OP022', details: 'artisan', hint: '2026-10-30T09:00:00Z' }, m))
      /* 30 secondes plus tard s'arrondit à la minute suivante, une minute
         pile après « maintenant » : là, la date se dit (elle est vraie). */
      && /à partir du/.test(phraseDuRefus({ code: 'OP022', details: 'artisan', hint: '2026-10-30T09:00:30Z' }, m)));
  verifier('`versHint` écrit exactement la forme de la base, à la seconde supérieure',
    versHint(Date.UTC(2026, 10, 5, 13, 3, 11, 200)) === '2026-11-05T13:03:12Z'
      && versHint(Date.UTC(2026, 10, 5, 13, 3, 12, 0)) === '2026-11-05T13:03:12Z');

  const NBSP = String.fromCharCode(0xa0);
  const h = (x) => x.replace(/ h /g, `${NBSP}h${NBSP}`);
  const attendus = {
    'Europe/Paris': {
      publication: `à partir du ${h('jeudi 5 novembre à 14 h 04')}`,
      artisan: `à partir du ${h('jeudi 5 novembre à 14 h 03')}`,
      minuit: h('lundi 2 novembre à 0 h 30'),
      annee: h('lundi 4 janvier 2027 à 11 h 00'),
    },
    'America/Martinique': {
      publication: `à partir du ${h('jeudi 5 novembre à 9 h 04')}`,
      artisan: `à partir du ${h('jeudi 5 novembre à 9 h 03')}`,
      minuit: h('dimanche 1er novembre à 19 h 30'),
      annee: h('lundi 4 janvier 2027 à 6 h 00'),
    },
    'Pacific/Kiritimati': {
      publication: `à partir du ${h('vendredi 6 novembre à 3 h 04')}`,
      artisan: `à partir du ${h('vendredi 6 novembre à 3 h 03')}`,
      minuit: h('lundi 2 novembre à 13 h 30'),
      annee: h('mardi 5 janvier 2027 à 0 h 00'),
    },
  };
  for (const [tz, att] of Object.entries(attendus)) {
    const r = spawnSync(process.execPath, [ICI, '--fuseau'], {
      encoding: 'utf8', env: { ...process.env, TZ: tz },
    });
    let s = null;
    try { s = JSON.parse(r.stdout); } catch { s = null; }
    verifier(`${tz} : la date du refus, la minute ARRONDIE au-dessus, le jour du bon côté de minuit, l’année quand elle change`,
      !!s && s.publication.includes(att.publication)
        && s.publication.endsWith(': une semaine après sa publication, puis une fois tous les sept jours.')
        && s.artisan.startsWith(MESSAGES_REFUS_REMONTEE.artisan) && s.artisan.includes(att.artisan)
        && s.minuit === att.minuit && s.annee === att.annee,
      s ? JSON.stringify(s) : `le processus n’a rien rendu (${r.stderr.slice(0, 200)})`);
  }
}

/* ================================================================== */
console.log('\n4. La démonstration refuse comme la base — les cas J3 à J7 de l’essai 51 c');
{
  const J = 24 * 3600 * 1000;
  const m = Date.UTC(2026, 9, 30, 12, 0, 0);
  const iso = (t) => new Date(t).toISOString();
  const pub = (age, remise = null) => ({
    id: 'p', type: 'post', proId: 'moi', publieLe: iso(m - age), remonteLe: remise == null ? null : iso(m - remise),
  });

  const j1 = decisionRemontee({ publication: pub(10 * J), moi: 'moi', historique: [], maintenant: m });
  verifier('J1 — une publication de dix jours se remet en avant, à l’instant présent',
    j1.ok === true && j1.instant === iso(m));

  const j3 = decisionRemontee({ publication: pub(2 * J + 500), moi: 'moi', historique: [], maintenant: m });
  verifier('J3 — moins de sept jours : « publication », hint = publication + 7 jours, à la seconde supérieure',
    !j3.ok && j3.code === 'OP022' && j3.details === 'publication'
      && j3.hint === versHint(m - 2 * J - 500 + 7 * J) && j3.message === MESSAGES_REFUS_REMONTEE.publication);

  const j4 = decisionRemontee({ publication: pub(10 * J, 1 * J), moi: 'moi', historique: [], maintenant: m });
  verifier('J4 — déjà remise en avant hier : « publication », hint = remise + 7 jours',
    !j4.ok && j4.details === 'publication' && j4.hint === versHint(m - J + 7 * J));

  const trois = [{ postId: 1, remonteeLe: iso(m - 1 * J) }, { postId: 2, remonteeLe: iso(m - 2 * J) },
    { postId: 3, remonteeLe: iso(m - 3 * J) }];
  const j5 = decisionRemontee({ publication: pub(30 * J), moi: 'moi', historique: trois, maintenant: m });
  verifier('J5 — la quatrième de la semaine : « artisan », hint = la plus ancienne des trois + 7 jours',
    !j5.ok && j5.details === 'artisan' && j5.hint === versHint(m - 3 * J + 7 * J)
      && j5.message === MESSAGES_REFUS_REMONTEE.artisan);

  const supprimee = [{ postId: null, remonteeLe: iso(m - 1 * J) }, ...trois.slice(1)];
  const j6 = decisionRemontee({ publication: pub(30 * J), moi: 'moi', historique: supprimee, maintenant: m });
  verifier('J6 — une publication supprimée compte toujours (`postId: null`)',
    !j6.ok && j6.details === 'artisan');

  const vieilles = trois.map((r) => ({ ...r, remonteeLe: iso(lireInstant(r.remonteeLe) - 8 * J) }));
  verifier('…et une remise de plus de sept jours ne compte plus',
    decisionRemontee({ publication: pub(30 * J), moi: 'moi', historique: vieilles, maintenant: m }).ok === true);

  const egal = decisionRemontee({
    publication: pub(10 * J, 3 * J), moi: 'moi', historique: trois, maintenant: m,
  });
  verifier('à égalité des deux instants, c’est « publication » qui est dite, comme la base',
    !egal.ok && egal.details === 'publication' && egal.hint === versHint(m + 4 * J));

  const autre = decisionRemontee({ publication: { ...pub(30 * J), proId: 'autre' }, moi: 'moi', maintenant: m });
  const pubAd = decisionRemontee({ publication: { ...pub(30 * J), type: 'ad' }, moi: 'moi', maintenant: m });
  const rien = decisionRemontee({ publication: null, moi: 'moi', maintenant: m });
  verifier('J7 — la publication d’un autre, une publicité, une publication inconnue : « absente », la MÊME phrase, sans date',
    [autre, pubAd, rien].every((x) => !x.ok && x.details === 'absente' && x.hint === null
      && x.message === MESSAGES_REFUS_REMONTEE.absente));
  verifier('…et sans fiche à moi (un particulier) : « absente » aussi',
    decisionRemontee({ publication: pub(30 * J), moi: null, maintenant: m }).details === 'absente');

  verifier('`remiseRecente` : la confirmation de suppression dit qu’une remise de moins de sept jours compte encore',
    remiseRecente(iso(m - 6 * J), m) === true && remiseRecente(iso(m - 8 * J), m) === false
      && remiseRecente(null, m) === false);
  verifier('`libelleRemise` date la remise en avant, et se tait sans elle',
    libelleRemise('2026-10-30T10:00:00Z') === 'Remise en avant le 30/10/2026' && libelleRemise(null) === null);
}

/* ================================================================== */
console.log('\n5. Le fil : la clé de tri EST le curseur — FAIT TOURNER');
{
  verifier('`cleDeTri` : la remise en avant, sinon la publication',
    cleDeTri({ created_at: 'A', remonte_le: 'B' }) === 'B' && cleDeTri({ created_at: 'A', remonte_le: null }) === 'A');
  verifier('`cleDemo`, la même règle en démonstration',
    cleDemo({ publieLe: 'A', remonteLe: 'B' }) === 'B' && cleDemo({ publieLe: 'A' }) === 'A');

  const ligne = rowToPost({
    id: 'x', author_id: 'a', created_at: '2026-09-01T10:00:00Z', remonte_le: '2026-10-29T10:00:00Z',
  }, new Set(), null);
  verifier('`rowToPost` : le curseur est la clé de tri, `publieLe` la date de PUBLICATION, `remonteLe` la remise',
    ligne.curseur === '2026-10-29T10:00:00Z' && ligne.publieLe === '2026-09-01T10:00:00Z'
      && ligne.remonteLe === '2026-10-29T10:00:00Z');

  /* La pagination de la démonstration, sur le cas K2 : une publication
     remise en avant posée au bout d'une page. */
  const base = Date.UTC(2026, 9, 1);
  const liste = Array.from({ length: 45 }, (_, i) => ({
    id: i + 1, publieLe: new Date(base + i * 3600 * 1000).toISOString(),
  }));
  liste[3].remonteLe = new Date(base + 30 * 3600 * 1000 + 1800 * 1000).toISOString();
  liste[7].remonteLe = new Date(base + 100 * 3600 * 1000).toISOString();
  const triee = trierDemo(liste);
  const pages = [];
  let reste = triee;
  while (reste.length) {
    const { lignes } = decouperPage(reste, 20, cleDemo);
    pages.push(...lignes.map((l) => l.id));
    reste = reste.slice(lignes.length);
  }
  verifier('`trierDemo` ordonne par la clé, et les pages ne perdent ni ne doublent rien (45 sur 45)',
    pages.length === 45 && new Set(pages).size === 45 && triee[0].id === 8
      && triee.every((p, i) => i === 0 || cleDemo(triee[i - 1]) >= cleDemo(p)));

  verifier('« Mes publications » se pagine par la date de PUBLICATION brute, jamais par le curseur du fil',
    /\.order\('created_at', \{ ascending: false \}\)\s*\.order\('id', \{ ascending: false \}\)/.test(api)
      && /decouperPage\(data, TAILLE_PAGE_FIL, \(l\) => \(l \? l\.created_at : null\)\)/.test(api)
      && /curseur: derniere \? derniere\.created_at : null,/.test(api));
}

/* ================================================================== */
console.log('\n6. Le récit d’un chantier date une étape par sa PUBLICATION');
{
  const long = 'Dépose de l’ancienne couverture, liteaux changés.';
  const etape = rowToPost({
    id: 'e', author_id: 'a', texte: long,
    created_at: '2026-09-21T08:00:00Z', remonte_le: '2026-10-29T08:00:00Z',
  }, new Set(), null);
  const [e] = etapesPourLeRecit([etape]);
  verifier('une étape remise en avant le 29/10 reste racontée au 21/09',
    !!e && e.date === '2026-09-21',
    'le récit est public : une étape datée de sa remise en avant serait un texte faux');
}

/* ================================================================== */
console.log('\n7. L’application : la base décide, l’écran dit vrai');
{
  verifier('l’ancien geste qui récrivait la date de publication a disparu',
    !/republierPost/.test(api) && !/republierPost/.test(app));
  const rpc = corpsJs(api, 'export const remonterPublication = !hasSupabase ? remonterPublicationDemo : async (postId) =>');
  verifier('`remonterPublication` appelle `remonter_publication` avec `p_id`, et JETTE l’erreur de la base',
    /supabase\.rpc\('remonter_publication', \{ p_id: postId \}\)/.test(rpc) && /if \(error\) throw error;/.test(rpc));

  const geste = corpsJs(app, 'const republierPublication = async (post) =>');
  const iPhrase = geste.indexOf('phraseDuRefus(e)');
  const iClair = geste.indexOf("messageClair(e, 'Remise en avant impossible')");
  verifier('le refus passe par `phraseDuRefus` AVANT `messageClair` (qui ne connaît pas la date)',
    iPhrase >= 0 && iClair > iPhrase && /phraseDuRefus\(e\) \|\| messageClair\(e,/.test(geste));
  verifier('…et il reste SOUS la carte (`refusRemontee`)',
    /setRefusRemontee\(\(r\) => \(\{ \.\.\.r, \[post\.id\]: phrase \}\)\);/.test(geste)
      && /refus=\{refusRemontee\}/.test(app) && /refus=\{refus\[item\.id\] \|\| null\}/.test(mesPubs));
  verifier('un geste à la fois (verrou)', /if \(remonteeEnCours\.current\) return;/.test(geste));
  const bandeaux = [...geste.matchAll(/showBanner\('([^']*)'\)/g)].map((x) => x[1]);
  verifier('les bandeaux de succès ne disent JAMAIS « en tête » (faux dès que quelqu’un publie)',
    bandeaux.length === 3 && bandeaux.every((b) => !/en tête/i.test(b)),
    `${bandeaux.length} bandeau(x)`);
  verifier('…et la carte garde sa date : le geste n’écrit ni `time` ni « À l’instant »',
    !/time:/.test(geste) && !/À l'instant|À l’instant/.test(geste)
      && /majPost\(post\.id, \(p\) => \(\{ \.\.\.p, remonteLe: quand \}\)\);/.test(geste));
  verifier('le bandeau se décide sur la page RECHARGÉE (présente, absente, ou pas rechargée)',
    /const page = await changerCeQuOnVoit\(\{ silencieux: true \}\);/.test(geste)
      && /if \(page === null\)/.test(geste) && /page\.some\(\(p\) => String\(p\.id\) === String\(post\.id\)\)/.test(geste));

  verifier('« Mes publications » se lit en BASE, plus dans le fil chargé',
    !/const mesPublications = posts\.filter/.test(app)
      && /await api\.mesPublications\(\{/.test(app) && /posts=\{mesPubs\.liste\}/.test(app));
  verifier('…et le compte du profil vient de la base (`nbMesPublications`), illisible = rien',
    /setNbMesPubs\(await api\.nbMesPublications\(\)\)/.test(app) && /nbPublications=\{nbMesPubs\}/.test(app)
      && /setNbMesPubs\(null\)/.test(app));
  verifier('l’écran affiche la note de la règle, la date de la remise, et la phrase de suppression',
    /<Text style=\{s\.note\}>\{NOTE_REMONTEE\}<\/Text>/.test(mesPubs)
      && /libelleRemise\(p\.remonteLe\)/.test(mesPubs)
      && /SUPPRESSION_APRES_REMISE/.test(mesPubs)
      && /remiseRecente\(p\.remonteLe, Date\.now\(\)\)/.test(mesPubs));
  /* La garde ENTIÈRE, jusqu'à son titre : un `false &&` glissé devant la
     condition laissait l'ancienne vérification au vert (banc S30). */
  verifier('un échec de lecture n’est jamais « Vous n’avez encore rien publié »',
    /\n {2}if \(etat === 'echec' && posts\.length === 0\) \{\s*return \(\s*<EmptyState\s+icone=\{Grid\}\s+titre="Lecture impossible"/.test(mesPubs)
      && mesPubs.indexOf("titre=\"Lecture impossible\"") < mesPubs.indexOf("Vous n'avez encore rien publié"));

  const carte = sansCommentaires(lire('src/components/PostCard.js'));
  const diapo = sansCommentaires(lire('src/components/VideoSlide.js'));
  verifier('la carte du fil ET la diapositive vidéo portent « Remise en avant » quand `remonteLe` est posé',
    /\{!!post\.remonteLe && \(\s*<Text[^>]*>Remise en avant<\/Text>/.test(carte)
      && /\{!!post\.remonteLe && <Text[^>]*>Remise en avant<\/Text>\}/.test(diapo));
  verifier('`erreurs.js` reste sans import (la date est composée par `remontee.js`)',
    !/^import /m.test(lire('src/lib/erreurs.js')) && !/phraseDuRefus/.test(erreurs));
}

/* ================================================================== */
console.log('\n8. L’ordre du fil, écrit UNE fois');
{
  const section = CGU.find((b) => b.titre === 'L’ordre du fil');
  verifier('la CGU « L’ordre du fil » EST la constante', !!section && section.texte === ORDRE_DU_FIL);
  verifier('…qui dit l’onglet « Tout » — le libellé réel de l’onglet',
    /l’onglet « Tout »/.test(ORDRE_DU_FIL)
      && /\{ key: 'pourvous', label: 'Tout' \}/.test(lire('src/screens/HomeScreen.js')));
  verifier('…qui donne les RAISONS de l’ordre, et ne promet ni « en tête » ni un classement',
    /c’est ce qui laisse sa chance à un professionnel qui vient d’arriver/.test(ORDRE_DU_FIL)
      && /Aucun professionnel ne paie pour être mieux placé dans le fil/.test(ORDRE_DU_FIL)
      && !/en tête/.test(ORDRE_DU_FIL));
  const composant = sansCommentaires(lire('src/components/OrdreDuFil.js'));
  verifier('la ligne « Comment le fil est ordonné » DÉPLIE la constante, sur place',
    /\{ouvert && <Text style=\{s\.texte\}>\{ORDRE_DU_FIL\}<\/Text>\}/.test(composant)
      && /accessibilityState=\{\{ expanded: ouvert \}\}/.test(composant)
      && /minHeight: TOUCHE/.test(composant));
  const feuille = sansCommentaires(lire('src/components/FeuilleRecherche.js'));
  const accueil = sansCommentaires(lire('src/screens/HomeScreen.js'));
  const rappel = corpsJs(accueil, 'function RappelFiltre({ resume, onOuvrir, onEffacer })');
  verifier('…dans la feuille de la loupe ET sur la ligne « Filtre : … » (la page des résultats)',
    /<OrdreDuFil /.test(feuille) && /<OrdreDuFil /.test(rappel) && /if \(!resume\) return null;/.test(rappel));
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ La remise en avant : une règle dans la base, et des phrases qui la disent vraie.\n');
