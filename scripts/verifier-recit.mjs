/**
 * LE RÉCIT D'UN CHANTIER — la première action de l'agent.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * C'est la première fois qu'une machine écrit un texte qui ira sur la
 * vitrine publique d'un artisan. Trois choses peuvent se dégrader sans
 * bruit, et aucune ne lèverait d'erreur :
 *
 * 1. **l'agent se met à inventer**, parce qu'on lui a envoyé des étapes
 *    sans texte. Un modèle à qui l'on ne donne rien ne répond pas « je ne
 *    sais pas » : il produit une jolie phrase creuse ;
 * 2. **le brouillon part en base**, et comme `chantiers` est une table
 *    PUBLIQUE et qu'une règle RLS filtre des lignes et non des colonnes,
 *    il devient lisible par tout le monde à la seconde où il est écrit ;
 * 3. **on publie sans relire**, et la permission du §4 disparaît sans que
 *    personne ne s'en aperçoive — le texte s'affiche, donc « ça marche ».
 *
 * ET IL FAIT TOURNER LA RÈGLE, il ne la lit pas. `src/lib/recit.js`
 * n'importe RIEN — onzième application de la leçon de
 * `cloudinary-adresses.js` —, parce que c'est lui qui décide si l'agent a
 * le droit d'écrire, et qu'une décision pareille ne se juge pas à l'œil.
 *
 *   npm run verifier-recit
 */
import { readFileSync } from 'node:fs';

const {
  MIN_ETAPES_RECIT, MIN_TEXTES_RECIT, MIN_LONGUEUR_TEXTE, LONGUEUR_MAX_RECIT,
  LONGUEUR_MAX_ETAPE, texteUtilisable, etapesPourLeRecit, peutEcrireLeRecit,
  recitPerime,
} = await import('../src/lib/recit.js');
const { initialChantiers, initialPosts } = await import('../src/data/demo.js');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Les commentaires partent d'abord : sept fois dans ce projet un contrôle a
   accusé la documentation qui expliquait le défaut qu'il traque. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const schema = lire('supabase/schema.sql').replace(/^\s*--.*$/gm, '');
const edge = sansCommentaires(lire('supabase/functions/ai/index.ts'));
const clientIA = sansCommentaires(lire('src/lib/ai.js'));
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const bloc = sansCommentaires(lire('src/components/RecitChantier.js'));

/* ================================================================== */
console.log('\nL\'AGENT N\'ÉCRIT QUE S\'IL A DE QUOI — on fait tourner la règle');

{
  const long = 'Dépose de l’ancienne couverture, tuiles mises de côté.';

  verifier('un texte trop court n\'est pas une description',
    !texteUtilisable('Fini 💪') && !texteUtilisable('') && !texteUtilisable(null)
    && texteUtilisable(long),
    `Le seuil est ${MIN_LONGUEUR_TEXTE} caractères : en dessous, le modèle `
    + 'n\'aurait d\'autre choix que d\'inventer.');

  verifier('deux étapes ne font pas une histoire',
    peutEcrireLeRecit([{ texte: long }, { texte: long }]).possible === false,
    `Il en faut ${MIN_ETAPES_RECIT} : un avant et un après, la carte les `
    + 'montre déjà.');

  /* LE CAS QUI PORTE TOUT LE LOT. Trois photos sans un mot : l'agent n'a
     rien à raconter, et ce qu'il écrirait irait sur une vitrine publique. */
  const sansMots = [{ texte: '' }, { texte: '🔥' }, { texte: null }];
  const refus = peutEcrireLeRecit(sansMots);
  verifier('trois étapes SANS TEXTE : on refuse',
    refus.possible === false && /description/i.test(refus.raison),
    'Un modèle à qui l\'on ne donne rien produit une jolie phrase creuse.');

  verifier('…et on DIT pourquoi',
    refus.raison.length > 40 && /invent/i.test(refus.raison),
    'Un bouton grisé sans explication : on appuie, rien ne se passe, et on '
    + 'croit l\'application cassée.');

  verifier('une seule étape décrite ne suffit pas',
    peutEcrireLeRecit([{ texte: long }, { texte: '' }, { texte: '' }]).possible === false,
    `Avec un seul texte, l'agent le recopie. Il en faut ${MIN_TEXTES_RECIT}.`);

  verifier('trois étapes dont deux décrites : il peut écrire',
    peutEcrireLeRecit([{ texte: long }, { texte: long }, { texte: '' }]).possible === true);

  verifier('les étapes partent SANS les vides, et dans l\'ordre du chantier',
    (() => {
      const e = etapesPourLeRecit([
        { texte: long, publieLe: '2026-09-21T08:00:00Z' },
        { texte: '', publieLe: '2026-09-22T08:00:00Z' },
        { texte: `${long} 2`, publieLe: '2026-09-23T08:00:00Z' },
      ]);
      return e.length === 2 && e[0].date === '2026-09-21' && e[1].date === '2026-09-23';
    })(),
    'On ne raconte pas une toiture en commençant par les tuiles.');

  verifier('une étape bavarde est bornée',
    etapesPourLeRecit([{ texte: 'a'.repeat(5000) }])[0].texte.length === LONGUEUR_MAX_ETAPE);
}

/* ================================================================== */
console.log('\nLE RÉCIT A-T-IL VIEILLI ?');

{
  verifier('une étape publiée APRÈS le récit le périme',
    recitPerime('2026-10-01T10:00:00Z', '2026-10-05T09:00:00Z') === true,
    'Le texte est toujours là, toujours bien écrit, et il raconte un '
    + 'chantier qui n\'est plus celui d\'en dessous.');

  verifier('…et rien de plus récent ne le périme pas',
    recitPerime('2026-10-06T10:00:00Z', '2026-10-05T09:00:00Z') === false);

  verifier('sans récit, rien à périmer',
    recitPerime(null, '2026-10-05T09:00:00Z') === false
    && recitPerime('2026-10-05T09:00:00Z', null) === false);

  verifier('la comparaison porte sur des CHAÎNES, pas des Date',
    !/new Date\(/.test(lire('src/lib/recit.js')),
    'La leçon des dates de la Place des pros : `new Date(\'2026-10-12\')` '
    + 'est minuit UTC, donc la veille pour qui vit à New York.');
}

/* ================================================================== */
console.log('\nLA BASE — le brouillon n\'y entre JAMAIS');

{
  verifier('les deux colonnes existent',
    /add column if not exists recit text/.test(schema)
    && /add column if not exists recit_ecrit_le timestamptz/.test(schema));

  verifier('…et aucune colonne de brouillon',
    !/recit_brouillon|brouillon_recit/.test(schema),
    '`chantiers` est PUBLIQUE, et une règle RLS filtre des lignes, jamais '
    + 'des colonnes : un brouillon en base serait lisible par tout le monde.');

  verifier('un récit se lit d\'un coup',
    schema.includes(`char_length(recit) <= ${LONGUEUR_MAX_RECIT}`),
    'Et le chiffre est le même qu\'à l\'écran.');

  const i = schema.indexOf('create or replace function public.tient_le_recit');
  const fn = schema.slice(i, schema.indexOf('$$;', i) + 3);
  /* ON REGARDE LES DEUX CHEMINS D'ÉCRITURE, pas la présence du mot.
     Éprouvé en cassant : chercher `clock_timestamp()` quelque part dans la
     fonction laissait passer une branche `insert` qui gardait la valeur
     envoyée par le client. C'est la faute du lot H, refaite — un contrôle
     qui compte les gardes ne garde rien. */
  const brancheInsert = fn.slice(fn.indexOf("tg_op = 'INSERT'"), fn.indexOf('elsif'));
  /* `indexOf('else')` trouve `elsif` — il COMMENCE par « else ». On vise
     donc le `else` qui est seul sur sa ligne. */
  const brancheUpdate = fn.slice(fn.indexOf('elsif'), fn.indexOf('\n  else\n'));
  verifier('la DATE est posée par la base — à l\'insertion…',
    i > 0 && /clock_timestamp\(\)/.test(brancheInsert),
    'Un indicateur de fraîcheur qui dépend de l\'horloge d\'un téléphone '
    + 'peut mentir, et c\'est le seul service qu\'il rend.');

  verifier('…comme à la mise à jour',
    /clock_timestamp\(\)/.test(brancheUpdate) && !/now\(\)/.test(fn),
    '`now()` rend l\'heure de début de transaction.');

  verifier('…et elle ne bouge pas quand le récit ne bouge pas',
    /new\.recit is distinct from old\.recit/.test(fn)
    && /new\.recit_ecrit_le := old\.recit_ecrit_le/.test(fn),
    'Sinon renommer un chantier rajeunirait son récit, et l\'avertissement '
    + 's\'éteindrait tout seul.');

  verifier('une chaîne de blancs n\'est pas un récit',
    /btrim\(coalesce\(new\.recit, ''\)\) = ''/.test(fn),
    'Une seule façon de dire « il n\'y en a pas » : null.');

  verifier('le verrou ne disparaît jamais',
    /create or replace trigger trg_recit_du_chantier/.test(schema),
    'Le connecteur Supabase refuse tout ordre qui commence par `drop`.');

  verifier('aucune politique nouvelle : celle des chantiers suffit',
    !/create policy[^;]*recit/i.test(schema),
    '« ecriture mes chantiers » est `for all` : elle couvre déjà ces '
    + 'colonnes, et c\'est juste — c\'est l\'artisan qui publie son récit.');

  verifier('l\'export RGPD emporte le récit sans qu\'on y pense',
    /'chantiers', coalesce\(\(select jsonb_agg\(to_jsonb\(x\)\)/.test(schema),
    'L\'export rend la LIGNE, pas une liste de colonnes : une colonne '
    + 'ajoutée y entre toute seule.');
}

/* ================================================================== */
console.log('\nLA CONSIGNE — il assemble, il ne raconte pas');

{
  const i = edge.indexOf("payload.action === 'recit'");
  const action = edge.slice(i, edge.indexOf("return json({ recit });", i));

  verifier('l\'action existe',
    i > 0, 'Sans elle, le bouton de l\'écran appellerait dans le vide.');

  verifier('elle refuse d\'écrire sans matière, elle aussi',
    /etapes\.length < 2/.test(action),
    'La garde est déjà posée côté application. On la refait ici : cette '
    + 'fonction est joignable directement.');

  for (const [quoi, motif] of [
    ['n\'inventer RIEN', /N'invente RIEN/],
    ['ne jamais nommer le client', /Ne nomme JAMAIS le client/],
    ['ni prix ni garantie', /Pas de prix[\s\S]{0,80}garantie/],
    ['garder son vocabulaire de métier', /GARDE SON VOCABULAIRE DE MÉTIER/],
    ['suivre l\'ordre des étapes', /suit l'ORDRE des étapes/],
    ['tenir en quelques phrases', /4 à 8 phrases/],
  ]) {
    verifier(`la consigne lui impose de ${quoi}`, motif.test(action));
  }

  verifier('le coût entre au journal, comme les quatre autres',
    /await noter\(entree, sortie, 'ok'\)/.test(action),
    'Sinon cette action-ci serait invisible dans « Mon agent ».');

  verifier('…et l\'appel porte sa cible',
    /cibleType: 'chantier'/.test(clientIA) && /cibleId: chantierId/.test(clientIA));
}

/* ================================================================== */
console.log('\nL\'AGENT ÉCRIT, L\'ARTISAN PUBLIE — la permission du §4');

{
  verifier('ce que l\'agent rend n\'est PAS enregistré',
    /const texte = await onEcrire\(\);/.test(bloc)
    && !/onEnregistrer\([\s\S]{0,40}await onEcrire/.test(bloc),
    'Le texte arrive dans un champ, pas en base.');

  const demander = bloc.slice(bloc.indexOf('const demander'), bloc.indexOf('const publier'));
  verifier('…il va dans le champ, et nulle part ailleurs',
    /setBrouillon\(texte\)/.test(demander) && !/onEnregistrer/.test(demander),
    'C\'est l\'appui sur « Publier » qui l\'envoie, et lui seul.');

  /* MESURÉ AU NAVIGATEUR, SUR LA VRAIE BASE : le premier jet écrivait dans
     le champ par une référence, APRÈS avoir demandé son affichage. La
     référence n'est pas encore attachée à cet instant — le champ arrivait
     VIDE, et « Publier » ne faisait rien. Un écran parfaitement calme qui
     ne fait rien. */
  verifier('…et il est posé AVANT le rendu, pas par une référence',
    /defaut=\{brouillon\}/.test(bloc) && !/setTimeout/.test(bloc),
    'Une référence n\'existe pas encore à l\'instant où le composant est '
    + 'demandé.');

  verifier('« Recommencer » remplace vraiment le texte',
    /key=\{jet\}/.test(bloc) && /setJet\(\(n\) => n \+ 1\)/.test(bloc),
    '`defaut` n\'est lu qu\'au montage : sans une clé qui change, le champ '
    + 'garderait l\'ancien texte.');

  verifier('le champ est un ChampLocal',
    /<ChampLocal/.test(bloc) && /champ\.current\.lire\(\)/.test(bloc),
    'Un champ multiligne de plusieurs centaines de caractères dont le '
    + 'texte remonte à chaque lettre, c\'est le défaut du lot 4 : 203 ms '
    + 'par lettre.');

  verifier('publier lit la valeur EXACTE du moment',
    /const texte = champ\.current \? champ\.current\.lire\(\) : ''/.test(bloc),
    'Pas l\'état React, qui a un rendu de retard.');

  verifier('un visiteur ne voit que le texte',
    /if \(!estLeMien\) \{[\s\S]{0,200}?if \(!recit\) return null;/.test(bloc),
    'Il n\'a pas à savoir qu\'une fonctionnalité existe et n\'a pas servi.');

  verifier('…et jamais un bouton',
    (() => {
      const i = bloc.indexOf('if (!estLeMien)');
      const branche = bloc.slice(i, bloc.indexOf('const demander'));
      return !/Btn/.test(branche);
    })(),
    'Le récit d\'un autre artisan ne se réécrit pas.');

  verifier('le récit périmé se DIT',
    /perime &&/.test(bloc) && /recitPerime/.test(bloc),
    'Rien d\'autre ne le signalerait : le texte est toujours là, et '
    + 'toujours bien écrit.');

  verifier('on peut le retirer',
    /const retirer = async/.test(bloc) && /onEnregistrer\(''\)/.test(bloc),
    'Un geste sans inverse s\'apprend mal.');

  verifier('l\'application n\'envoie JAMAIS la date',
    !/recit_ecrit_le/.test(api) || !/update\(\{[^}]*recit_ecrit_le/.test(api),
    'C\'est la base qui la pose.');

  verifier('enregistrer passe par api.enregistrerRecit',
    /export const enregistrerRecit = !hasSupabase/.test(api)
    && /api\.enregistrerRecit\(chantierOuvert\.id, texte\)/.test(app));

  verifier('…et le mode démonstration FAIT la chose',
    /async function enregistrerRecitDemo/.test(api)
    && /c\.recit = texte \|\| null/.test(api),
    'Un bouton qui ne fait rien sans fichier `.env` ne s\'essaie nulle part.');
}

/* ================================================================== */
console.log('\nLE JEU DE DÉMONSTRATION — sinon rien ne se voit sans `.env`');

{
  const avecRecit = initialChantiers.filter((c) => c.recit);
  verifier('un chantier de démonstration porte un récit',
    avecRecit.length >= 1,
    'La génération passe par la fonction Edge : sans ce texte, l\'affichage '
    + 'd\'un récit publié ne se vérifierait nulle part ici.');

  verifier('…et sa date est postérieure à sa dernière étape',
    avecRecit.every((c) => !recitPerime(c.recitEcritLe, c.fin)),
    'Sinon l\'avertissement « vous avez publié depuis » s\'afficherait en '
    + 'permanence, et il ne voudrait plus rien dire.');

  /* ET IL EST ASSEMBLÉ DE SES ÉTAPES, pas inventé : un exemple qui
     inventerait donnerait une fausse idée de ce que fait l'outil. */
  for (const c of avecRecit) {
    const etapes = initialPosts.filter((p) => p.chantierId === c.id);
    const mots = etapes.flatMap((p) => String(p.texte || '').toLowerCase()
      .split(/[^a-zàâçéèêëîïôûùüÿñæœ]+/).filter((m) => m.length > 6));
    const repris = mots.filter((m) => c.recit.toLowerCase().includes(m));
    verifier(`le récit de « ${c.titre} » vient de SES étapes`,
      repris.length >= 4,
      `${repris.length} mot(s) de ses étapes s'y retrouvent. Un exemple qui `
      + 'inventerait donnerait une fausse idée de ce que fait l\'outil.');
  }

  const mien = initialChantiers.filter((c) => !c.recit);
  verifier('…et un autre n\'en a pas',
    mien.length >= 1,
    'Sinon l\'état « l\'agent peut le raconter » ne se voit nulle part.');
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} contrôle(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Le récit : l’agent assemble ses mots à lui, et c’est lui '
  + 'qui publie.\n');
