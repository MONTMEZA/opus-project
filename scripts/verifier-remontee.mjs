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
  const { rowToPost: ligneVersPost } = await import('../src/lib/publication.js');
  const { etapesPourLeRecit: etapes } = await import('../src/lib/recit.js');
  const maintenant = Date.UTC(2026, 9, 30, 9, 0, 0); // 30/10/2026, 9 h UTC
  const sortie = {
    // 5 novembre 2026, 13 h 03 min 12 s UTC — la minute s'arrondit AU-DESSUS.
    publication: phraseDuRefus({ code: 'OP022', details: 'publication', hint: '2026-11-05T13:03:12Z' }, maintenant),
    artisan: phraseDuRefus({ code: 'OP022', details: 'artisan', hint: '2026-11-05T13:03:00Z' }, maintenant),
    // Juste avant minuit UTC : le jour change selon le fuseau.
    minuit: jourEtHeure(Date.UTC(2026, 10, 1, 23, 30, 0), maintenant),
    // Un an plus tard : l'année se dit.
    annee: jourEtHeure(Date.UTC(2027, 0, 4, 10, 0, 0), maintenant),
    // Une étape publiée le 21/09 à 22 h 30 UTC — le 22 à 0 h 30 à Paris :
    // le récit la date au jour du TÉLÉPHONE (relecture du 30/10).
    recit: (etapes([ligneVersPost({
      id: 'e', author_id: 'a', texte: 'Dépose de l’ancienne couverture, liteaux changés.',
      created_at: '2026-09-21T22:30:00+00:00',
    }, new Set(), null)])[0] || {}).date || null,
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
  BANDEAUX_REMISE, bandeauApresRemise, appliquerRemiseDemo,
  lireInstant, phraseDuRefus, versHint, decisionRemontee, remiseRecente, libelleRemise,
} = await import('../src/lib/remontee.js');
const { apresPage, apresEchec } = await import('../src/lib/mes-publications.js');
const { filVideo, seRegardeEnPleinEcran } = await import('../src/lib/fil-video.js');
const { relativeTime } = await import('../src/lib/formats.js');
const { memoireCommentaires, commentairesEnSeance, retenirCommentaire } = await import('../src/lib/commentaires-demo.js');
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

/* Les ARGUMENTS de chaque appel `nom(…)`, par comptage des parenthèses. */
function argumentsDe(texte, appel) {
  const sortie = [];
  let i = texte.indexOf(appel);
  while (i >= 0) {
    let niveau = 0;
    let k = i + appel.length - 1;
    for (; k < texte.length; k += 1) {
      if (texte[k] === '(') niveau += 1;
      else if (texte[k] === ')') { niveau -= 1; if (niveau === 0) break; }
    }
    sortie.push(texte.slice(i + appel.length, k).trim());
    i = texte.indexOf(appel, k);
  }
  return sortie;
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
      recit: '2026-09-22',
    },
    'America/Martinique': {
      publication: `à partir du ${h('jeudi 5 novembre à 9 h 04')}`,
      artisan: `à partir du ${h('jeudi 5 novembre à 9 h 03')}`,
      minuit: h('dimanche 1er novembre à 19 h 30'),
      annee: h('lundi 4 janvier 2027 à 6 h 00'),
      recit: '2026-09-21',
    },
    'Pacific/Kiritimati': {
      publication: `à partir du ${h('vendredi 6 novembre à 3 h 04')}`,
      artisan: `à partir du ${h('vendredi 6 novembre à 3 h 03')}`,
      minuit: h('lundi 2 novembre à 13 h 30'),
      annee: h('mardi 5 janvier 2027 à 0 h 00'),
      recit: '2026-09-22',
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
    /* Le récit d'un chantier date une étape au jour du TÉLÉPHONE : les dix
       premiers caractères d'un horodatage sont la date UTC, la veille pour
       une étape publiée entre minuit et 1 h ou 2 h en France (relecture du
       30/10 — le §6 ne la faisait tourner qu'à 8 h UTC). */
    verifier(`${tz} : une étape publiée le 21/09 à 22 h 30 UTC est racontée au ${att.recit}`,
      !!s && s.recit === att.recit, s ? `reçu : ${s.recit}` : 'rien');
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

  /* LA DÉMONSTRATION ÉCRIT SON HISTORIQUE, et la règle des trois MORD
     (relecture du 30/10) : retirer l'écriture de l'historique passait au
     vert, et la quatrième remise de la semaine n'était plus jamais refusée
     sans fichier `.env`. On la JOUE : quatre publications anciennes, l'une
     après l'autre, puis la première une seconde fois. */
  const etat = { remontees: new Map(), historique: [] };
  const vieille = (id) => ({ id, type: 'post', proId: 'moi', publieLe: iso(m - 30 * J), remonteLe: null });
  const issues = [1, 2, 3, 4].map((id, k) => sur(() => appliquerRemiseDemo(etat, {
    publication: vieille(id), moi: 'moi', maintenant: m + k * 60000,
  })));
  verifier('la démonstration rejouée : trois remises acceptées, la QUATRIÈME refusée « artisan », l’historique tenu',
    issues.slice(0, 3).every((x) => x && x.ok === true)
      && issues[3] && issues[3].ok === false && issues[3].details === 'artisan'
      && etat.historique.length === 3 && etat.remontees.size === 3,
    JSON.stringify(issues.map((x) => (x && x.ok ? 'ok' : x && x.details))));
  const etat2 = { remontees: new Map(), historique: [] };
  const une = sur(() => appliquerRemiseDemo(etat2, { publication: vieille(9), moi: 'moi', maintenant: m }));
  const deux = sur(() => appliquerRemiseDemo(etat2, { publication: vieille(9), moi: 'moi', maintenant: m + 60000 }));
  verifier('…et la même publication, deux fois de suite : la seconde refusée « publication » (la séance s’en souvient)',
    une && une.ok === true && deux && deux.ok === false && deux.details === 'publication');
  verifier('`api.js` passe par `appliquerRemiseDemo(publicationsDemo, …)`, et n’écrit pas l’historique à côté',
    /appliquerRemiseDemo\(publicationsDemo, \{/.test(api) && !/publicationsDemo\.historique\.push\(/.test(api));
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
  /* L'ÂGE AFFICHÉ est celui de la PUBLICATION (décision Q2 du 29/10, et la
     CGU : « elle garde sa date de publication ») — `relativeTime(remonte_le
     || created_at)` affichait « À l'instant » sur une publication de trois
     semaines, au vert (relecture du 30/10). */
  const il21j = new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString();
  const remiseAujourdhui = rowToPost({
    id: 'y', author_id: 'a', created_at: il21j, remonte_le: new Date().toISOString(),
  }, new Set(), null);
  verifier('…et l’âge affiché (`time`) est celui de la PUBLICATION : « Il y a 21 j », jamais « À l’instant »',
    remiseAujourdhui.time === relativeTime(il21j) && remiseAujourdhui.time === 'Il y a 21 j',
    `reçu : ${remiseAujourdhui.time}`);

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

  /* L'ÉTAT DE « MES PUBLICATIONS » — FAIT TOURNER (relecture du 30/10) : un
     échec qui rendait `{ liste: [], etat: 'pret' }` passait au vert, et
     l'écran aurait dit « Vous n'avez encore rien publié ». */
  const lue = { liste: [{ id: 1 }, { id: 2 }], fin: false, etat: 'pret' };
  const echecSuite = apresEchec(lue, true);
  const echecDebut = apresEchec({ liste: [], fin: false, etat: 'chargement' }, false);
  verifier('un échec GARDE la liste déjà lue et le DIT (`echec`, début ou suite) — jamais « prête » et vide',
    echecSuite.etat === 'echec' && echecSuite.echecDe === 'suite' && echecSuite.liste.length === 2
      && echecDebut.etat === 'echec' && echecDebut.echecDe === 'debut');
  const suite = apresPage(lue, { page: [{ id: 2 }, { id: 3 }], fin: true, suite: true });
  const debut = apresPage(lue, { page: [{ id: 9 }], fin: false, suite: false });
  verifier('…et une page s’ajoute SANS DOUBLON à la suite, ou remplace la liste au début',
    suite.liste.map((p) => p.id).join() === '1,2,3' && suite.fin === true && suite.etat === 'pret'
      && debut.liste.map((p) => p.id).join() === '9');
  verifier('…et `OpusApp` passe par ces deux fonctions, et seulement elles',
    /setMesPubs\(\(m\) => apresPage\(m, \{ page, fin, suite \}\)\);/.test(app)
      && /setMesPubs\(\(m\) => apresEchec\(m, suite\)\);/.test(app)
      && !/etat: 'echec'/.test(app) && !/etat: 'pret'/.test(app));

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

  /* LE GESTE EST EN DEUX : `republierPublication` tient le VERROU, du
     premier appui à la fin du bandeau ; `remettreEnAvant` fait le travail.
     Le verrou était relâché dès la réponse de la base, avant le
     rechargement du fil et le bandeau (relecture du 30/10). */
  const verrou = corpsJs(app, 'const republierPublication = async (post) =>');
  const geste = corpsJs(app, 'const remettreEnAvant = async (post) =>');
  const iPhrase = geste.indexOf('phraseDuRefus(e)');
  const iClair = geste.indexOf("messageClair(e, 'Remise en avant impossible')");
  verifier('le refus passe par `phraseDuRefus` AVANT `messageClair` (qui ne connaît pas la date)',
    iPhrase >= 0 && iClair > iPhrase && /phraseDuRefus\(e\) \|\| messageClair\(e,/.test(geste));
  verifier('…et il reste SOUS la carte (`refusRemontee`)',
    /setRefusRemontee\(\(r\) => \(\{ \.\.\.r, \[post\.id\]: phrase \}\)\);/.test(geste)
      && /refus=\{refusRemontee\}/.test(app) && /refus=\{refus\[item\.id\] \|\| null\}/.test(mesPubs));
  verifier('un geste à la fois : le verrou est pris, MONTRÉ (`setRemiseEnCours`), et rendu dans un `finally` — à la FIN du geste',
    /^\{\s*if \(remonteeEnCours\.current\) return;\s*remonteeEnCours\.current = post\.id;\s*setRemiseEnCours\(post\.id\);\s*try \{\s*await remettreEnAvant\(post\);\s*\} finally \{\s*remonteeEnCours\.current = null;\s*setRemiseEnCours\(null\);\s*\}\s*\}$/.test(verrou)
      && !/remonteeEnCours|setRemiseEnCours/.test(geste),
    verrou.slice(0, 200));
  verifier('…et le bouton le DIT : occupé sur sa carte (« Remise en avant… », `busy`), éteint sur les autres',
    /enRemise=\{remiseEnCours\}/.test(app)
      && /remiseOccupee=\{enRemise != null && String\(enRemise\) === String\(item\.id\)\}/.test(mesPubs)
      && /remiseBloquee=\{enRemise != null && String\(enRemise\) !== String\(item\.id\)\}/.test(mesPubs)
      && /disabled=\{remiseOccupee \|\| remiseBloquee\}/.test(mesPubs)
      && /accessibilityState=\{\{ busy: remiseOccupee, disabled: remiseOccupee \|\| remiseBloquee \}\}/.test(mesPubs)
      && /\{remiseOccupee \? 'Remise en avant…' : 'Remettre en avant'\}/.test(mesPubs));

  /* LES BANDEAUX, MOT POUR MOT, et le choix entre eux FAIT TOURNER : « la
     première du fil, pour tout le monde » passait au vert (seul « en
     tête » était interdit), et « tirez le fil vers le bas » était dit
     aussi dans le fil des vidéos, qui n'a pas ce geste. */
  const BANDEAUX_DECIDES = {
    dansLeFil: 'Publication remise en avant : elle reprend place parmi les plus récentes du fil, puis redescendra à mesure que d’autres publient.',
    horsDuFiltre: 'Publication remise en avant : elle reprend place parmi les plus récentes du fil. Votre fil, tel qu’il est filtré en ce moment, ne la montre pas.',
    rechargerFil: 'Publication remise en avant. Tirez le fil vers le bas pour la voir à sa nouvelle place.',
    rechargerVideo: 'Publication remise en avant. Repassez au fil classique pour la voir à sa nouvelle place.',
  };
  verifier('les quatre bandeaux de succès sont, MOT POUR MOT, ceux qui ont été décidés',
    JSON.stringify(BANDEAUX_REMISE) === JSON.stringify(BANDEAUX_DECIDES), JSON.stringify(BANDEAUX_REMISE));
  verifier('…le bon, selon la page rechargée et le fil : présente, absente, pas rechargée (classique ou vidéos)',
    sur(() => bandeauApresRemise([{ id: 'x' }], 'x', 'classic')) === BANDEAUX_DECIDES.dansLeFil
      && sur(() => bandeauApresRemise([{ id: 'y' }], 'x', 'video')) === BANDEAUX_DECIDES.horsDuFiltre
      && sur(() => bandeauApresRemise(null, 'x', 'classic')) === BANDEAUX_DECIDES.rechargerFil
      && sur(() => bandeauApresRemise(null, 'x', 'video')) === BANDEAUX_DECIDES.rechargerVideo);
  verifier('…et le geste n’en affiche AUCUN autre : un seul bandeau de succès, celui de `bandeauApresRemise`',
    (geste.match(/showBanner\(/g) || []).length === 1
      && /const page = await changerCeQuOnVoit\(\{ silencieux: true \}\);\s*showBanner\(bandeauApresRemise\(page, post\.id, feedMode\)\);/.test(geste));
  verifier('…et la carte garde sa date : le geste n’écrit ni `time` ni « À l’instant »',
    !/time:/.test(geste) && !/À l'instant|À l’instant/.test(geste)
      && /majPost\(post\.id, \(p\) => \(\{ \.\.\.p, remonteLe: quand \}\)\);/.test(geste));
  verifier('la note et la phrase de suppression sont, MOT POUR MOT, celles qui ont été décidées',
    NOTE_REMONTEE === '« Remettre en avant » ne crée pas de doublon : la publication reprend sa place parmi les plus récentes du fil, avec sa date de publication, ses j\'aime et ses commentaires, puis redescend avec les autres. Une semaine après sa publication, puis une fois tous les sept jours ; trois remises en avant au plus sur sept jours, publications supprimées comprises.'
      && SUPPRESSION_APRES_REMISE === 'Sa remise en avant compte encore parmi vos trois des sept derniers jours.',
    `${NOTE_REMONTEE} | ${SUPPRESSION_APRES_REMISE}`);

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
  /* …RENDUE SANS CONDITION, et qui BASCULE : `{false && <OrdreDuFil />}` et
     un appui qui referme sans jamais ouvrir passaient au vert (relecture du
     30/10). Ce qui précède la balise est la fin d'une autre balise (`>`),
     jamais `&&`, `?`, `:` ni `(`. */
  const precede = (texte) => {
    const i = texte.indexOf('<OrdreDuFil ');
    /* Un commentaire JSX retiré laisse `{}` : ce n'est pas du code. */
    return i < 0 ? null : texte.slice(0, i).replace(/\{\s*\}/g, '').trimEnd().slice(-1);
  };
  verifier('…rendue SANS condition à ces deux endroits, et un appui l’ouvre ET la referme',
    precede(feuille) === '>' && precede(rappel) === '>'
      && (feuille.match(/<OrdreDuFil /g) || []).length === 1 && (rappel.match(/<OrdreDuFil /g) || []).length === 1
      && /onPress=\{\(\) => setOuvert\(\(o\) => !o\)\}/.test(composant)
      && /const \[ouvert, setOuvert\] = useState\(false\);/.test(composant),
    `avant la balise : « ${precede(feuille)} » (loupe), « ${precede(rappel)} » (filtre)`);

  /* LE TEXTE ENTIER, MOT POUR MOT (relecture du 30/10) : « contre
     paiement » à la place de « gratuitement », un ordre selon les « j'aime »,
     les publicités absentes d'« Abonnements » — tous passaient au vert. Ce
     texte est opposable (règlement 2019/1150) : le changer est une DÉCISION,
     qui touche ce contrôle, `legal.js` et `VERSION` dans le même lot. */
  const ORDRE_RELU = "Le fil montre les publications des professionnels de la plus récente à la plus ancienne. Il n’est pas personnalisé : l’onglet « Tout » montre le même fil à tout le monde, sauf les publications des personnes que vous avez bloquées ou qui vous ont bloqué, et celles que vous avez masquées ; rien n’y est classé selon les « j’aime », les vues, le nombre d’abonnés ou la note. L’ordre par date ne favorise ni les comptes les plus suivis, ni ceux qui paieraient : c’est ce qui laisse sa chance à un professionnel qui vient d’arriver. Les réglages de la loupe — métier, secteur, note, professionnels vérifiés —, l’onglet « Abonnements » et le fil des vidéos retirent ce qui ne leur répond pas ; ils ne changent pas l’ordre. Un professionnel peut remettre en avant l’une de ses publications, gratuitement : elle reprend sa place parmi les plus récentes, à la date de cette remise en avant, puis redescend à mesure que d’autres arrivent. Elle garde sa date de publication, ses « j’aime » et ses commentaires, et porte la mention « Remise en avant ». Une publication ne se remet en avant qu’une semaine après sa publication, puis une fois tous les sept jours ; et un professionnel n’en remet pas en avant plus de trois sur sept jours, même s’il en supprime une ensuite. Ces limites empêchent un même professionnel d’occuper le haut du fil. Aucun professionnel ne paie pour être mieux placé dans le fil. Opus ne vend pas encore de publicité : les publications marquées « Sponsorisé » que vous pouvez voir aujourd’hui sont des exemples placés par l’éditeur pendant l’essai. Elles n’apparaissent ni dans le fil des vidéos, ni quand vous utilisez la loupe, mais elles restent dans l’onglet « Abonnements ».";
  verifier('« L’ordre du fil » a EXACTEMENT le texte relu contre la base (30/10/2026)',
    ORDRE_DU_FIL === ORDRE_RELU, ORDRE_DU_FIL);

  /* …ET SES PHRASES SUR LES PUBLICITÉS SONT VRAIES DE `fil_filtre` : chaque
     proposition est reliée à sa clause. Retirer `or p.is_ad` d'« Abonnements »,
     ou `not p.is_ad` du filtre métier ou secteur, passait au vert. */
  const fil = espaces(corpsSql('fil_filtre').corps);
  verifier('« elles restent dans l’onglet Abonnements » : `fil_filtre` garde `or p.is_ad` dans « Abonnements »',
    /and \(not p_abonnements or p\.is_ad or exists \(select 1 from public\.follows f where f\.follower_id = auth\.uid\(\) and f\.following_id = p\.author_id\)\)/.test(fil));
  verifier('« ni dans le fil des vidéos » : le filtre vidéo exige `p.is_ad = false`',
    /and \(not p_videos or \(p\.is_ad = false and p\.type in \('video', 'montage'\)\)\)/.test(fil));
  verifier('« ni quand vous utilisez la loupe » : métier et secteur écartent `p.is_ad` ; note et badge, par la fiche (vide)',
    /and \(p_metier is null or \(not p\.is_ad and p\.metier = p_metier\)\)/.test(fil)
      && /or \(not p\.is_ad and p\.latitude is not null and p\.longitude is not null/.test(fil)
      && /and \(not p_verifies or coalesce\(pp\.verifie, false\)\)/.test(fil)
      && /coalesce\(pp\.avis_count, 0\) > 0/.test(fil)
      && /left join public\.professional_profiles pp on pp\.id = p\.author_id/.test(fil));
}

/* ================================================================== */
console.log('\n9. Le fil des vidéos ne montre que des vidéos, et s’ouvre sur CELLE qu’on a touchée — FAIT TOURNER');
{
  /* Relecture du 30/10 : entré en TOUCHANT une vidéo, le plein écran
     montrait la page du fil entière (photos et publicités, contre ce que dit
     la CGU), et une vidéo absente de la page (plus ancienne que les vingt
     chargées) retombait sur la première diapositive — une publicité. */
  const pub = { id: 'ad1', type: 'ad' };
  const photo = { id: 1, type: 'post', format: 'photo' };
  const video = { id: 2, type: 'post', format: 'video' };
  const montage = { id: 3, type: 'post', format: 'montage' };
  const ancienne = { id: 99, type: 'post', format: 'video' };
  const page = [photo, pub, video, montage];
  const r0 = sur(() => filVideo(page, null));
  const r1 = sur(() => filVideo(page, montage));
  const r2 = sur(() => filVideo(page, ancienne));
  const r3 = sur(() => filVideo(page, photo));
  const r4 = sur(() => filVideo(page, { ...pub, format: 'video' }));
  const ids = (r) => (r && r.liste ? r.liste.map((p) => p.id).join() : String(r));
  verifier('la liste ne garde que les vidéos et les montages — ni photo, ni publicité, même « vidéo »',
    ids(r0) === '2,3' && r0.index === 0 && seRegardeEnPleinEcran(video) && !seRegardeEnPleinEcran(pub)
      && !seRegardeEnPleinEcran({ ...pub, format: 'video' }) && !seRegardeEnPleinEcran(photo), ids(r0));
  verifier('la vidéo touchée PRÉSENTE : on s’ouvre sur elle',
    ids(r1) === '2,3' && r1.index === 1);
  verifier('la vidéo touchée ABSENTE de la page : elle est posée en tête, et on s’ouvre sur ELLE — jamais l’index 0 d’une autre',
    ids(r2) === '99,2,3' && r2.index === 0);
  verifier('…et ce qui ne se regarde pas en plein écran n’est jamais ajouté (une photo, une publicité)',
    ids(r3) === '2,3' && ids(r4) === '2,3');

  const accueil = sansCommentaires(lire('src/screens/HomeScreen.js'));
  verifier('`HomeScreen` montre `filVideo(posts, videoCible)` en plein écran — plus `posts`, plus `Math.max(0, findIndex…)`',
    /const \{ liste: postsVideo, index: indexCible \} = useMemo\(\s*\(\) => filVideo\(posts, videoCible\),/.test(accueil)
      && /<FlatList\s+data=\{postsVideo\}\s+keyExtractor=\{\(p\) => String\(p\.id\)\}\s+pagingEnabled/.test(accueil)
      && /initialScrollIndex=\{indexCible\}/.test(accueil)
      && !/Math\.max\(0, posts\.findIndex/.test(accueil)
      && /const courant = postsVideo\[slideActive\];/.test(accueil));
  const ouvrir = corpsJs(app, 'const ouvrirVideoEnGrand = (post) =>');
  const poses = argumentsDe(app, 'setVideoCible(');
  verifier('UNE porte vers le plein écran : `ouvrirVideoEnGrand` reçoit la PUBLICATION, et QUITTE la page où l’on est',
    /setVideoCible\(post\);/.test(ouvrir) && /setFeedMode\('video'\);/.test(ouvrir) && /setScreen\('home'\);/.test(ouvrir)
      && poses.length === 2 && poses.includes('post') && poses.includes('null'),
    `setVideoCible reçoit : ${poses.join(' | ')}`);
  const ouvrirMienne = corpsJs(app, 'const ouvrirMaPublication = (p) =>');
  verifier('« Mes publications » et l’étape d’un chantier passent par elle',
    /if \(FORMATS_VIDEO\.has\(p\.format\)\) \{\s*ouvrirVideoEnGrand\(p\);\s*return;\s*\}/.test(ouvrirMienne)
      && /onOuvrirPublication=\{\(p\) => \{\s*if \(!FORMATS_VIDEO\.has\(p\.format\)\) return;\s*ouvrirVideoEnGrand\(p\);\s*\}\}/.test(app)
      && (app.match(/onOuvrirVideo=\{ouvrirVideoEnGrand\}/g) || []).length === 2);
}


/* ================================================================== */
console.log('\n10. La base du lot S-c : les formes ENTIÈRES, les déclencheurs, les tables, les droits');
{
  /* POURQUOI CETTE PARTIE (relecture du 30/10) : de la section 52, ce
     contrôle ne lisait que les nombres, l'ordre verrou/lecture, le `hint` et
     l'écriture finale. Quinze altérations passaient au vert sur les 55
     contrôles — remettre en avant la publication d'un AUTRE, compter les
     trois de la semaine sur tout Opus, rendre la table `remontees` à tout le
     monde, ne plus poser la date d'un avis… Seul l'essai 51 c les voyait,
     et `npm run verifier` ne joue aucun SQL (A-FAIRE §2.3).

     Une règle se compare donc ENTIÈRE, commentaires retirés et espaces
     réduits — le procédé de `verifier-moderation` pour le lot S-b. Changer
     l'une d'elles se DÉCIDE : la base, l'essai 51 c et la forme ici, dans
     le même lot, en disant pourquoi. */
  const sqlCode = SCHEMA.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const fonction = (nom) => {
    const morceaux = sqlCode.split(`create or replace function public.${nom}(`);
    if (morceaux.length !== 2) return null;
    const t = morceaux[1];
    const debut = t.indexOf('$$');
    const fin = debut < 0 ? -1 : t.indexOf('$$', debut + 2);
    return fin < 0 ? null : t.slice(0, fin);
  };
  const forme = (texte) => (texte || '').replace(/\s+/g, ' ').trim();
  const FORMES = {
    "remonter_publication": "p_id uuid) returns timestamptz language plpgsql volatile security definer set search_path = public as $$ declare moi uuid := auth.uid(); pub record; maintenant timestamptz; pour_pub timestamptz; pour_art timestamptz; bloquant timestamptz; quelle text; n int; begin if moi is null then raise exception 'Connectez-vous pour remettre une publication en avant.' using errcode = '42501'; end if; perform pg_advisory_xact_lock(hashtextextended('remontee:' || moi::text, 0)); select p.id, p.author_id, p.is_ad, p.created_at, p.remonte_le into pub from public.posts p where p.id = p_id; if not found or pub.author_id is distinct from moi or pub.is_ad then raise exception 'Cette publication ne peut pas être remise en avant : elle n''existe plus, ou ce n''est pas l''une des vôtres.' using errcode = 'OP022', detail = 'absente'; end if; maintenant := clock_timestamp(); pour_pub := greatest(pub.created_at, pub.remonte_le) + interval '7 days'; if pour_pub <= maintenant then pour_pub := null; end if; select count(*) into n from public.remontees r where r.auteur_id = moi and r.remontee_le > maintenant - interval '7 days'; if n >= 3 then select r.remontee_le + interval '7 days' into pour_art from public.remontees r where r.auteur_id = moi and r.remontee_le > maintenant - interval '7 days' order by r.remontee_le desc offset 2 limit 1; end if; if pour_pub is not null or pour_art is not null then if pour_art is null or (pour_pub is not null and pour_pub >= pour_art) then bloquant := pour_pub; quelle := 'publication'; else bloquant := pour_art; quelle := 'artisan'; end if; if date_trunc('second', bloquant) < bloquant then bloquant := date_trunc('second', bloquant) + interval '1 second'; end if; if quelle = 'publication' then raise exception 'Cette publication ne peut pas encore être remise en avant : une semaine après sa publication, puis une fois tous les sept jours.' using errcode = 'OP022', detail = quelle, hint = to_char(bloquant at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'); else raise exception 'Vous avez déjà remis en avant trois publications ces sept derniers jours, publications supprimées comprises.' using errcode = 'OP022', detail = quelle, hint = to_char(bloquant at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'); end if; end if; insert into public.remontees (post_id, auteur_id, remontee_le) values (pub.id, moi, maintenant); update public.posts set remonte_le = maintenant where id = pub.id; return maintenant; end;",
    "tient_le_texte": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if tg_op = 'UPDATE' and auth.uid() is not null and auth.uid() = new.author_id and pg_trigger_depth() = 1 and current_user in ('authenticated', 'anon') then new := jsonb_populate_record(new, to_jsonb(old) - 'texte' - 'chantier_id'); if new.texte is distinct from old.texte then if tg_table_name = 'comments' and public.a_deja_une_reponse(old.id) then raise exception 'Ce commentaire ne peut plus être corrigé : quelqu''un a répondu après lui.' using errcode = 'OP001'; end if; new.modifie_le := now(); end if; end if; return new; end;",
    "pose_la_date": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then if tg_op = 'INSERT' then new.created_at := clock_timestamp(); else new.created_at := old.created_at; end if; end if; return new; end;",
    "tient_la_publication_neuve": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then new.likes_count := 0; new.comments_count := 0; new.vues_count := 0; new.is_ad := false; new.annonceur := null; new.accroche := null; new.cta := null; new.modifie_le := null; new.remonte_le := null; end if; return new; end;",
    "tient_la_reputation": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then if tg_op = 'INSERT' then new.avis_count := 0; new.note_delais := 0; new.note_qualite := 0; new.note_tarif := 0; new.followers_count := 0; else new.avis_count := old.avis_count; new.note_delais := old.note_delais; new.note_qualite := old.note_qualite; new.note_tarif := old.note_tarif; new.followers_count := old.followers_count; if new.demandes_vues_le is distinct from old.demandes_vues_le then new.demandes_vues_le := clock_timestamp(); end if; end if; end if; return new; end;",
    "tient_le_commentaire_neuf": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then new.modifie_le := null; new.auteur_supprime := false; end if; return new; end;",
    "tient_les_compteurs_du_chantier": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then if tg_op = 'INSERT' then new.nb_publications := 0; new.couverture := null; new.debut := null; new.fin := null; else new.nb_publications := old.nb_publications; new.couverture := old.couverture; new.debut := old.debut; new.fin := old.fin; end if; end if; return new; end;",
    "tient_l_avis_neuf": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then new.auteur_supprime := false; end if; return new; end;",
    "tient_le_compte": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin if current_user in ('authenticated', 'anon') then if tg_op = 'INSERT' then new.cgu_version := null; new.cgu_acceptees_le := null; new.email := null; elsif new.cgu_version is distinct from old.cgu_version or new.cgu_acceptees_le is distinct from old.cgu_acceptees_le or new.email is distinct from old.email then raise exception 'Ces informations du compte ne se changent pas ici. Si vous voyez ce message, mettez Opus à jour.' using errcode = 'OP023'; end if; end if; return new; end;",
    "tient_le_client": ") returns trigger language plpgsql security invoker set search_path = public as $$ begin new.nom := btrim(coalesce(new.nom, '')); new.telephone := nullif(btrim(coalesce(new.telephone, '')), ''); new.email := lower(nullif(btrim(coalesce(new.email, '')), '')); new.adresse := nullif(btrim(coalesce(new.adresse, '')), ''); new.code_postal := nullif(btrim(coalesce(new.code_postal, '')), ''); new.ville := nullif(btrim(coalesce(new.ville, '')), ''); new.notes := nullif(btrim(coalesce(new.notes, '')), ''); new.siret := nullif(regexp_replace(coalesce(new.siret, ''), '[^0-9]', '', 'g'), ''); if new.type is distinct from 'entreprise' then new.siret := null; end if; new.modifie_le := clock_timestamp(); if tg_op = 'INSERT' then new.created_at := clock_timestamp(); else new.created_at := old.created_at; end if; return new; end;",
    "fil_filtre": "p_metier text default null, p_lat double precision default null, p_lon double precision default null, p_rayon_km int default null, p_note_min numeric default null, p_verifies boolean default false, p_abonnements boolean default false, p_videos boolean default false, p_avant timestamptz default null, p_limite int default 20 ) returns setof public.posts language sql stable security invoker set search_path = public as $$ select p.* from public.posts p left join public.professional_profiles pp on pp.id = p.author_id where (p_avant is null or p.remonte_le < p_avant or (p.remonte_le is null and p.created_at < p_avant)) and (not p_videos or (p.is_ad = false and p.type in ('video', 'montage'))) and (not p_abonnements or p.is_ad or exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.author_id)) and (p_metier is null or (not p.is_ad and p.metier = p_metier)) and (not p_verifies or coalesce(pp.verifie, false)) and (p_note_min is null or (coalesce(pp.avis_count, 0) > 0 and (pp.note_delais + pp.note_qualite + pp.note_tarif) / 3.0 >= p_note_min)) and (p_rayon_km is null or p_lat is null or p_lon is null or (not p.is_ad and p.latitude is not null and p.longitude is not null and public.distance_km(p_lat, p_lon, p.latitude, p.longitude) <= p_rayon_km)) order by coalesce(p.remonte_le, p.created_at) desc, p.id desc limit least(coalesce(p_limite, 20), 50)",
  };
  for (const [nom, attendu] of Object.entries(FORMES)) {
    const vu = forme(fonction(nom));
    verifier(`\`${nom}\` a exactement la forme relue et éprouvée par l’essai 51 c`, vu === attendu,
      vu ? `reçu : ${vu.slice(0, 300)}…` : 'fonction introuvable, ou créée plusieurs fois');
  }

  /* LES DÉCLENCHEURS DE `pose_la_date()`, en liste FERMÉE avec leurs
     verbes — et TOUTE table qui a une colonne `created_at` est soit posée
     ici, soit exclue avec sa raison (section 52.1 de `schema.sql`). Une
     table oubliée passait au vert : rien ne refusait « ni posée ni exclue ». */
  const POSEES = {
    posts: 'insert', comments: 'insert', quote_requests: 'insert', callback_requests: 'insert',
    sos_requests: 'insert', demande_reponses: 'insert', annonce_reponses: 'insert', messages: 'insert',
    post_vues: 'insert', reviews: 'insert',
    annonces_pro: 'insert or update', demandes: 'insert or update', chantiers: 'insert or update',
    professional_profiles: 'insert or update', users: 'insert or update',
  };
  const EXCLUES = ['devis', 'devis_lignes', 'base_postes', 'emetteur', 'emetteur_assurances', 'tarifs_pro',
    'clients', 'professional_partners', 'demandes_pro', 'entreprise_registre', 'journal_admin', 'journal_ia',
    'remontees', 'signalements', 'metier_demandes', 'specialites_proposees', 'notifications', 'blocages',
    'saved_posts', 'follows', 'post_likes', 'conversations', 'sos_availability'];
  const declencheurs = [...sqlCode.matchAll(/create or replace trigger trg_pose_la_date_(\w+)\s+before (insert(?: or update)?) on public\.(\w+)\s+for each row execute function public\.pose_la_date\(\);/g)]
    .map((m) => ({ nom: m[1], verbe: m[2], table: m[3] }));
  const vus = Object.fromEntries(declencheurs.map((d) => [d.table, d.verbe]));
  verifier(`\`pose_la_date()\` est posée sur EXACTEMENT ${Object.keys(POSEES).length} tables, chacune sous son nom et avec son verbe`,
    declencheurs.length === Object.keys(POSEES).length
      && declencheurs.every((d) => d.nom === d.table)
      && JSON.stringify(Object.keys(vus).sort()) === JSON.stringify(Object.keys(POSEES).sort())
      && Object.entries(POSEES).every(([t, v]) => vus[t] === v)
      && (sqlCode.match(/execute function public\.pose_la_date\(\)/g) || []).length === Object.keys(POSEES).length,
    JSON.stringify(vus));
  const avecDate = new Set();
  for (const m of sqlCode.matchAll(/create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
    if (/\bcreated_at\b/.test(m[2])) avecDate.add(m[1]);
  }
  for (const m of sqlCode.matchAll(/alter table (?:only )?public\.(\w+)\s+add column if not exists created_at\b/g)) avecDate.add(m[1]);
  const orphelines = [...avecDate].filter((t) => !(t in POSEES) && !EXCLUES.includes(t));
  verifier(`toute table qui a une date de création (${avecDate.size}) est soit posée, soit exclue AVEC sa raison`,
    avecDate.size >= 30 && orphelines.length === 0, `ni posées ni exclues : ${orphelines.join(', ')}`);
  const raisons = SCHEMA.slice(SCHEMA.indexOf('--  52.1  La date d'), SCHEMA.indexOf('create or replace function public.pose_la_date()'));
  const sansRaison = EXCLUES.filter((t) => !raisons.includes(`\`${t}\``) && !raisons.includes(`\`${t}.`));
  verifier('…et chaque table exclue a sa RAISON écrite dans la section 52.1',
    sansRaison.length === 0, `sans raison : ${sansRaison.join(', ')}`);

  /* LA TABLE `remontees` : l'historique survit à une publication supprimée
     (`set null` — « publications supprimées comprises »), et part avec le
     compte (`cascade` — la CGU le dit). Une seule politique, lisible par
     son auteur seul ; et le client n'y écrit RIEN, pas même `truncate`. */
  const table = espaces((sqlCode.match(/create table if not exists public\.remontees \(([\s\S]*?)\n\);/) || [])[1] || '').trim();
  verifier('`remontees` : `post_id … on delete set null`, `auteur_id … on delete cascade`, la date posée par la base',
    table === 'id uuid primary key default gen_random_uuid(), post_id uuid references public.posts(id) on delete set null, auteur_id uuid not null references public.users(id) on delete cascade, remontee_le timestamptz not null default clock_timestamp()', table);
  const politiques = [...sqlCode.matchAll(/create policy "([^"]+)"\s+on\s+(?:public\.)?remontees\b([\s\S]*?);/g)];
  verifier('…UNE seule politique, « lecture mes remontees », lisible par son auteur SEUL',
    politiques.length === 1 && politiques[0][1] === 'lecture mes remontees'
      && espaces(politiques[0][2]).trim() === 'for select to authenticated using (auth.uid() = auteur_id)',
    politiques.map((x) => `${x[1]} ${espaces(x[2])}`).join(' | '));

  /* LES DROITS RETIRÉS, ET QUE RIEN NE REND PLUS BAS — `grant all` et
     `grant … on all tables in schema` compris (relecture du 30/10 : un
     `grant all on public.reviews` posé après le `revoke` rendait l'UPDATE
     des avis, au vert). */
  const apres = (motif) => {
    const i = sqlCode.search(motif);
    return i < 0 ? null : sqlCode.slice(i);
  };
  const DROITS = [
    ['remontees, pour `anon`', /revoke all on public\.remontees from anon;/, /\bgrant\b[^;]*\bon (?:table )?public\.remontees\b/],
    ['remontees, pour `authenticated` (écriture et `truncate`)', /revoke insert, update, delete, truncate on public\.remontees from authenticated;/, /\bgrant\b[^;]*\bon (?:table )?public\.remontees\b/],
    ['reviews (un avis ne se modifie plus)', /revoke update on public\.reviews from anon, authenticated;/, /\bgrant\b(?![^;]*\bgrant select\b)[^;]*\bon (?:table )?public\.reviews\b/],
    ['signalements (colonnes)', /revoke insert on public\.signalements from anon, authenticated;/, /\bgrant (?:all|insert)\b(?!\s*\()[^;]*\bon (?:table )?public\.signalements\b/],
    ['metier_demandes (colonnes)', /revoke insert on public\.metier_demandes from anon, authenticated;/, /\bgrant (?:all|insert)\b(?!\s*\()[^;]*\bon (?:table )?public\.metier_demandes\b/],
    ['specialites_proposees (colonnes)', /revoke insert on public\.specialites_proposees from anon, authenticated;/, /\bgrant (?:all|insert)\b(?!\s*\()[^;]*\bon (?:table )?public\.specialites_proposees\b/],
  ];
  for (const [nom, retrait, rendu] of DROITS) {
    const suite = apres(retrait);
    verifier(`le droit retiré — ${nom} — l’est, et rien ne le rend plus bas`,
      suite !== null && !rendu.test(suite.slice(1)) && !/\bgrant\b[^;]*\bon all tables in schema public\b/.test(suite),
      suite === null ? 'le `revoke` a disparu' : 'un `grant` le rend plus bas');
  }

  /* L'EXPORT RGPD porte l'historique (la CGU le dit). */
  const md = espaces(corpsSql('mes_donnees').corps);
  verifier('l’export RGPD porte `mes_remontees` — MES lignes, toutes',
    /'mes_remontees', coalesce\(\(select jsonb_agg\(to_jsonb\(x\) order by x\.remontee_le, x\.id\) from public\.remontees x where x\.auteur_id = auth\.uid\(\)\), '\[\]'::jsonb\)/.test(md));
}


/* ================================================================== */
console.log('\n11. Ce que la relecture du 30/10 a corrigé à l’écran — et qu’aucun contrôle ne tenait');
{
  /* Les commentaires de la DÉMONSTRATION, retenus en séance — FAIT TOURNER.
     Le fil disait 4, « Mes publications » et la page 3. */
  const m = memoireCommentaires();
  const p = { id: 7, comments: [{ id: 1, texte: 'Bravo', reponses: [{ id: 11, texte: 'Merci' }] }] };
  retenirCommentaire(m, { postId: 7, texte: 'Racine', local: { id: 'l1', texte: 'Racine', reponses: [] } });
  retenirCommentaire(m, { postId: 7, texte: 'Réponse', parentId: 1, local: { id: 'l2', texte: 'Réponse', reponses: [] } });
  retenirCommentaire(m, { postId: 8, texte: 'Ailleurs' });
  m.textes.set('1', 'Bravo !');
  m.retires.add('11');
  const arbre = sur(() => commentairesEnSeance(p, m));
  verifier('la démonstration retient en séance : une racine, une réponse sous SA racine, une correction, un retrait — et rien d’une autre publication',
    Array.isArray(arbre) && arbre.length === 2 && arbre[0].texte === 'Bravo !' && arbre[0].modifie === true
      && arbre[0].reponses.map((r) => r.id).join() === 'l2' && arbre[1].id === 'l1'
      && p.comments[0].reponses.length === 1 && p.comments[0].texte === 'Bravo',
    JSON.stringify(arbre));
  verifier('…et `api.js` les branche : `postsDemo` les applique, écrire / corriger / retirer un commentaire les retient',
    /return \{ \.\.\.q, comments: commentairesEnSeance\(q, commentairesDemo\) \};/.test(api)
      && /export const addComment = !hasSupabase \? addCommentDemo :/.test(api)
      && /retenirCommentaire\(commentairesDemo, \{\s*postId, texte, parentId, local,\s*\}\);/.test(api)
      && /export const modifierCommentaire = !hasSupabase\s*\? async \(id, texte\) => \{ commentairesDemo\.textes\.set\(String\(id\), texte\); \}/.test(api)
      && /export const supprimerCommentaire = !hasSupabase\s*\? async \(id\) => \{ commentairesDemo\.retires\.add\(String\(id\)\); \}/.test(api)
      && /api\.addComment\(postId, texte, parentId, nouveau\)/.test(app));
  verifier('…et les conseils de la fiche se lisent dans les publications DE LA SÉANCE (`postsDemo`), par date de publication',
    /function conseilsDemoDe\(proId\) \{\s*return postsDemo\(\)\s*\.filter\(\(p\) => p\.type !== 'ad' && p\.conseil && String\(p\.proId\) === String\(proId\)\)\s*\.sort\(\(a, b\) => String\(b\.publieLe \|\| ''\)\.localeCompare\(String\(a\.publieLe \|\| ''\)\)\)/.test(api));

  /* « MES CONSEILS », la quatrième copie : une correction l'atteint, et
     une suppression refusée la rend. */
  const modifier = corpsJs(app, 'const modifierPublication = async (post, texte) =>');
  const supprimer = corpsJs(app, 'const supprimerPublication = async (post) =>');
  verifier('corriger une publication corrige aussi « Mes conseils » — et l’ancien texte revient si la base refuse',
    /majPost\(post\.id, \(p\) => \(\{ \.\.\.p, texte, modifie: true \}\)\);\s*majMesConseils\(post\.id, \{ texte \}\);/.test(modifier)
      && /\} catch \(e\) \{\s*majPost\(post\.id, \(p\) => \(\{ \.\.\.p, texte: post\.texte, modifie: post\.modifie \}\)\);\s*majMesConseils\(post\.id, \{ texte: post\.texte \}\);/.test(modifier));
  verifier('…et une suppression refusée rend le conseil retiré de « Mes conseils »',
    /const avantConseils = myProId && pros\[myProId\] \? pros\[myProId\]\.conseils : undefined;/.test(supprimer)
      && /\} catch \(e\) \{[\s\S]*?conseils: avantConseils[\s\S]*?showErreur\(messageClair\(e, 'Suppression impossible'\)\);/.test(supprimer));

  /* Le formulaire d'avis ne reste pas ouvert sous « Retirer mon avis ». */
  const fiche = sansCommentaires(lire('src/screens/ProfilProScreen.js'));
  verifier('le formulaire d’avis se ferme dès que MON avis est là (calculé, pas posé par un effet)',
    /const formulaireOuvert = showForm && !monAvis;/.test(fiche)
      && /\{formulaireOuvert && \(/.test(fiche) && !/\{showForm && \(/.test(fiche)
      && /actif=\{!formulaireOuvert\}/.test(fiche));

  /* VoiceOver lit l'ÉTIQUETTE, pas le contenu : l'âge et « remise en avant »
     y entrent, sur la carte du fil comme dans « Mes publications ». */
  const carte = sansCommentaires(lire('src/components/PostCard.js'));
  verifier('l’étiquette de la carte du fil dit l’âge et « remise en avant » ; celle de « Mes publications » aussi',
    /accessibilityLabel=\{`Voir la fiche de \$\{pro\.entreprise\}\$\{post\.time \? `, \$\{minusculeInitiale\(post\.time\)\}` : ''\}\$\{post\.remonteLe \? ', remise en avant' : ''\}`\}/.test(carte)
      && /\$\{p\.time \? `, \$\{p\.time\}` : ''\}\$\{remise \? `, \$\{remise\}` : ''\}`\}/.test(mesPubs));
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ La remise en avant : une règle dans la base, et des phrases qui la disent vraie.\n');
