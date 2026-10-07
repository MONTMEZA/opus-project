/**
 * LE NOM DE L'AGENT — et la promesse de ne pas insister.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Le propriétaire a demandé que la fenêtre revienne « de temps en temps »
 * pour qu'on ne saute pas l'étape. Son propre cahier des charges interdit
 * l'inverse en propres termes : « les suggestions de l'IA ne doivent pas
 * être insistantes » (§2). Les deux tirent en sens contraire, et c'est
 * précisément le genre de règle qui se dégrade sans bruit :
 *
 *   1. **la fenêtre revient pour toujours** — il suffit qu'un compteur
 *      cesse de monter, ou qu'une sortie ne le compte pas ;
 *   2. **la fenêtre ne revient jamais** — il suffit qu'elle se taise au
 *      premier refus, et l'étape est sautée pour de bon ;
 *   3. **on ne peut plus nommer son agent du tout**, parce que la fenêtre
 *      s'est tue et que rien d'autre ne mène au réglage.
 *
 * Aucun des trois ne lève d'erreur, aucun ne casse un écran, et aucun ne
 * se juge à l'œil : on ne va pas ouvrir l'application cent fois pour voir
 * si elle finit par se taire.
 *
 * ET IL FAIT TOURNER LA RÈGLE, il ne la lit pas. `src/lib/agent.js`
 * n'importe RIEN — douzième application de la leçon de
 * `cloudinary-adresses.js`.
 *
 *   npm run verifier-agent-nom
 */
import { readFileSync } from 'node:fs';

const {
  LONGUEUR_MIN_NOM_AGENT, LONGUEUR_MAX_NOM_AGENT, MAX_PROPOSITIONS_NOM,
  AGENT_SANS_NOM, NOMS_SUGGERES, nomAgent, aUnNom, validerNomAgent,
  doitProposerLeNom,
} = await import('../src/lib/agent.js');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Les commentaires partent d'abord : HUIT fois dans ce projet un contrôle a
   accusé la documentation qui expliquait le défaut qu'il traque. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const schema = lire('supabase/schema.sql').replace(/^\s*--.*$/gm, '');
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const fenetre = sansCommentaires(lire('src/components/FenetreAgent.js'));
const clientIA = sansCommentaires(lire('src/lib/ai.js'));
const recitBloc = sansCommentaires(lire('src/components/RecitChantier.js'));
const confid = sansCommentaires(lire('src/screens/ConfidentialiteScreen.js'));

/* ================================================================== */
console.log('\nLA RÈGLE, FAITE TOURNER — trois propositions, et au bon moment');

{
  const pro = { estPro: true, agentNom: null };

  verifier('la première fois, on propose sans rien attendre',
    doitProposerLeNom({ ...pro, propositions: 0, vientDeTravailler: false }) === true);

  verifier('au deuxième tour, on attend que l’agent ait travaillé',
    doitProposerLeNom({ ...pro, propositions: 1, vientDeTravailler: false }) === false
    && doitProposerLeNom({ ...pro, propositions: 1, vientDeTravailler: true }) === true,
    'Une fenêtre qui s’ouvre « au bout d’un certain temps » interrompt '
    + 'quelqu’un au milieu d’autre chose.');

  verifier('au troisième tour aussi',
    doitProposerLeNom({ ...pro, propositions: 2, vientDeTravailler: false }) === false
    && doitProposerLeNom({ ...pro, propositions: 2, vientDeTravailler: true }) === true);

  /* LE CŒUR DU CONTRÔLE : au-delà, on se tait, même si l'agent vient de
     travailler. C'est le §2, et c'est ce qu'aucun essai à la main ne
     prouverait — il faudrait refuser trois fois de suite. */
  verifier(`après ${MAX_PROPOSITIONS_NOM} refus, on se tait POUR TOUJOURS`,
    [MAX_PROPOSITIONS_NOM, MAX_PROPOSITIONS_NOM + 1, 99]
      .every((n) => doitProposerLeNom({ ...pro, propositions: n, vientDeTravailler: true }) === false),
    '« les suggestions de l’IA ne doivent pas être insistantes » (§2).');

  verifier('un agent déjà nommé ne se redemande jamais',
    doitProposerLeNom({ estPro: true, agentNom: 'Léon', propositions: 0, vientDeTravailler: true }) === false
    && doitProposerLeNom({ estPro: true, agentNom: '  Léon  ', propositions: 1 }) === false);

  verifier('un particulier n’a pas d’agent, donc aucune fenêtre',
    doitProposerLeNom({ estPro: false, agentNom: null, propositions: 0 }) === false
    && doitProposerLeNom({ estPro: false, propositions: 0, vientDeTravailler: true }) === false,
    'Le §3 décrit l’agent comme celui de l’ARTISAN.');

  verifier('un compteur absent ou absurde ne rouvre pas la porte',
    doitProposerLeNom({ ...pro, propositions: undefined }) === true
    && doitProposerLeNom({ ...pro, propositions: 'beaucoup' }) === true
    && doitProposerLeNom({ ...pro, propositions: -5 }) === true
    && doitProposerLeNom({}) === false,
    'Un compteur illisible doit se comporter comme un zéro, pas faire planter.');
}

/* ================================================================== */
console.log('\nLE NOM — une seule valeur de repli, et une seule validation');

{
  verifier('le repli est en minuscules',
    AGENT_SANS_NOM === AGENT_SANS_NOM.toLowerCase(),
    'Tous les textes placent le nom au MILIEU d’une phrase : « par votre '
    + 'agent ». Une majuscule donnerait « par Votre agent ».');

  verifier('nomAgent() rend le nom, ou le repli',
    nomAgent('Léon') === 'Léon' && nomAgent('  Margot ') === 'Margot'
    && nomAgent(null) === AGENT_SANS_NOM && nomAgent('') === AGENT_SANS_NOM
    && nomAgent('   ') === AGENT_SANS_NOM && nomAgent(undefined) === AGENT_SANS_NOM);

  verifier('aUnNom() ne se laisse pas prendre par des blancs',
    aUnNom('Léon') === true && aUnNom('  ') === false
    && aUnNom(null) === false && aUnNom(undefined) === false);

  const bons = ['Léon', 'Jean-Baptiste', 'Marie Claire', "L'Ami", 'Bob'];
  verifier('un nom normal passe',
    bons.every((n) => validerNomAgent(n).erreur === null),
    `Refusés à tort : ${bons.filter((n) => validerNomAgent(n).erreur).join(', ')}`);

  verifier('les blancs sont réduits et rognés',
    validerNomAgent('  Marie   Claire ').valeur === 'Marie Claire');

  verifier('un nom vide est refusé, et le message dit quoi faire',
    validerNomAgent('').erreur && validerNomAgent('   ').erreur
    && /Plus tard/.test(validerNomAgent('').erreur));

  verifier('une seule lettre est refusée',
    validerNomAgent('L').erreur !== null,
    `La contrainte pro_agent_nom_check exige ${LONGUEUR_MIN_NOM_AGENT} caractères.`);

  verifier('un nom trop long est refusé AVANT la base',
    validerNomAgent('x'.repeat(LONGUEUR_MAX_NOM_AGENT)).erreur === null
    && validerNomAgent('x'.repeat(LONGUEUR_MAX_NOM_AGENT + 1)).erreur !== null,
    'Sinon la base répond 23514, et un code SQL n’explique rien à personne.');

  /* « 12 » et « ??? » ne sont pas des noms, et la base les accepterait
     sans broncher : la contrainte ne regarde que la longueur. */
  verifier('ce qui ne contient aucune lettre n’est pas un nom',
    validerNomAgent('12').erreur !== null && validerNomAgent('???').erreur !== null
    && validerNomAgent('42 Léon').erreur === null);

  verifier(`les ${NOMS_SUGGERES.length} noms suggérés passent leur propre validation`,
    NOMS_SUGGERES.length >= 2 && NOMS_SUGGERES.every((n) => validerNomAgent(n).erreur === null),
    'Une puce qui propose un nom que le bouton refuse est le pire des défauts.');
}

/* ================================================================== */
console.log('\nLA BASE — les deux colonnes, et le compteur qui ne redescend pas');

verifier('les deux colonnes sont déclarées',
  /add column if not exists agent_nom text/.test(schema)
  && /add column if not exists agent_propositions int not null default 0/.test(schema));

verifier('la contrainte de longueur dit la MÊME chose que le code',
  schema.includes(`char_length(agent_nom) between ${LONGUEUR_MIN_NOM_AGENT} and ${LONGUEUR_MAX_NOM_AGENT}`),
  'Deux bornes pour une seule vérité finissent toujours par se contredire.');

verifier('…et elle laisse passer `null`',
  /agent_nom is null or char_length\(agent_nom\)/.test(schema),
  'Sinon une fiche ne peut plus naître sans agent nommé.');

verifier('les deux contraintes sont créées SOUS CONDITION',
  /pg_constraint[\s\S]{0,400}pro_agent_nom_check/.test(schema)
  && /pg_constraint[\s\S]{0,400}pro_agent_propositions_check/.test(schema),
  'Le connecteur Supabase refuse tout ordre qui commence par `drop`, donc '
  + 'la paire drop + add ne passe pas depuis une session de travail.');

{
  const i = schema.indexOf('function public.tient_l_agent()');
  verifier('le déclencheur existe', i > 0);
  const fin = schema.indexOf('$$;', i);
  const fn = i > 0 ? schema.slice(i, fin) : '';

  verifier('il nettoie le nom et vide les blancs',
    /new\.agent_nom\s*:=\s*nullif\(btrim\(coalesce\(new\.agent_nom, ''\)\), ''\)/.test(fn),
    'Une seule façon de dire « il n’y en a pas ».');

  /* LE VERROU. On regarde ce qu'il y a ENTRE la condition et l'affectation :
     chercher `greatest` « quelque part » dans la fonction laisserait passer
     un verrou dont la condition a été changée — c'est la faute du lot H,
     refaite au lot I, et on ne la refait pas une troisième fois. */
  const j = fn.indexOf("tg_op = 'UPDATE'");
  const k = fn.indexOf('new.agent_propositions :=');
  verifier('le compteur ne redescend jamais, et c’est `greatest` qui le tient',
    j > 0 && k > j && /greatest\(/.test(fn.slice(k, k + 220)),
    'Sans lui, un client qui renvoie 0 rouvre la fenêtre pour toujours.');

  verifier('…et l’administration garde son échappatoire',
    /auth\.uid\(\) is not null and auth\.uid\(\) = new\.id/.test(fn.slice(j, k)),
    '`auth.uid()` vide — l’éditeur SQL — doit pouvoir remettre à zéro, '
    + 'comme pour tient_le_profil_pro() et tient_les_metiers().');

  verifier('il est posé par `create or replace trigger`',
    /create or replace trigger trg_tient_l_agent\s+before insert or update on public\.professional_profiles/
      .test(schema),
    'La paire drop + create laisse un instant où la table est sans verrou — '
    + 'et le connecteur Supabase la refuse de toute façon.');
}

verifier('le nom de l’agent entre dans l’export RGPD',
  /'fiche_professionnelle',[\s\S]{0,200}to_jsonb\(p\)/.test(schema),
  'L’export rend la ligne entière, donc une colonne ajoutée y entre toute '
  + 'seule. C’est voulu.');

/* ================================================================== */
console.log('\nL’APPLICATION — qui écrit, et surtout QUI LIT');

verifier('les deux colonnes voyagent avec la fiche',
  /'agent_nom', 'agent_propositions',/.test(api));

verifier('…et arrivent dans l’objet que les écrans lisent',
  /agentNom: row\.agent_nom \|\| null/.test(api)
  && /agentPropositions: row\.agent_propositions \|\| 0/.test(api));

verifier('nommerAgent et noterRefusAgent existent, avec leur version démonstration',
  /export const nommerAgent = !hasSupabase \? nommerAgentDemo/.test(api)
  && /export const noterRefusAgent = !hasSupabase \? noterRefusAgentDemo/.test(api),
  'Sans version démonstration, le mécanisme ne s’essaie nulle part sans '
  + 'fichier `.env` — et il ne se vérifierait pas au navigateur.');

verifier('nommerAgent REMONTE son échec',
  /nommerAgent[\s\S]{0,420}if \(error\) throw error;/.test(api),
  'Laisser croire qu’un nom est enregistré alors qu’il ne l’est pas, c’est '
  + 'le « X est prévenu » du 01/10 en plus petit.');

/* LE SIGNAL : une seule porte, et elle est dans ai.js, APRÈS la réussite. */
{
  verifier('le signal « l’agent a travaillé » est une seule porte',
    /export function surTravailAgent/.test(clientIA)
    && (clientIA.match(/temoinsTravail\.forEach/g) || []).length === 1,
    'Brancher chaque écran, c’est cinq branchements aujourd’hui et un oubli '
    + 'silencieux au prochain lot.');

  const i = clientIA.indexOf('async function callAiFunction');
  const corps = clientIA.slice(i, clientIA.indexOf('\n}', i));
  const posErreur = corps.lastIndexOf('throw');
  const posSignal = corps.indexOf('temoinsTravail.forEach');
  verifier('…et il part APRÈS la réussite, jamais avant',
    posSignal > posErreur && posErreur > 0,
    'Une demande refusée ou en panne n’est pas un travail fait, et ne doit '
    + 'pas en avoir l’air — la règle du journal d’audit du lot H.');
}

verifier('OpusApp écoute ce signal, une seule fois',
  (app.match(/surTravailAgent\(/g) || []).length === 1
  && /setAgentATravaille\(true\)/.test(app));

/* LA FENÊTRE NE RECOUVRE PAS LE TRAVAIL QU'ELLE ANNONCE. Trouvé sur une
   capture de la vraie base : elle s'ouvrait par-dessus les trois
   propositions que l'agent venait d'écrire, donc on demandait « comment
   voulez-vous l'appeler ? » à quelqu'un qui n'avait pas encore pu lire son
   travail. Elle attend qu'il quitte l'écran. */
verifier('…et elle attend qu’il ait fini de lire',
  /vientDeTravailler: agentATravaille && screen !== ecranAuTravail/.test(app)
  && /setEcranAuTravail\(ecranCourant\.current\)/.test(app),
  'Ouvrir la fenêtre à l’instant où le résultat s’affiche la pose par-dessus.');

verifier('…et les deux repères se remettent à zéro en se fermant',
  (app.match(/setEcranAuTravail\(null\)/g) || []).length === 2,
  'Sinon un seul travail rouvrirait la fenêtre à chaque changement d’écran.');

/* LA RÈGLE N'EST PAS RÉÉCRITE DANS L'ÉCRAN. C'est la leçon des voyants du
   04/10 : deux formules pour une seule vérité finissent par se contredire. */
verifier('l’écran ne réinvente pas la règle : il appelle doitProposerLeNom()',
  /doitProposerLeNom\(\{/.test(app)
  && !/agentPropositions\s*[<>]=?\s*\d/.test(app),
  'Une seconde écriture de « trois propositions au plus » se tromperait un '
  + 'jour, et la fenêtre deviendrait insistante sans que rien ne le dise.');

verifier('elle ne s’ouvre pas pendant le démarrage',
  /!demarrage && !renommerAgent && doitProposerLeNom/.test(app),
  'Une feuille posée par-dessus les barrières de l’ouverture serait la '
  + 'première chose qu’un artisan verrait d’Opus.');

/* « PLUS TARD » DOIT COMPTER. C'est le défaut qui annulerait toute la
   section en silence : la fenêtre se fermerait, et reviendrait à chaque
   démarrage. */
{
  const i = app.indexOf('const plusTardPourLAgent');
  const corps = app.slice(i, i + 600);
  verifier('« Plus tard » compte le refus, en base ET en mémoire',
    i > 0 && /api\.noterRefusAgent\(\)/.test(corps) && /setPros\(/.test(corps),
    'Sans l’écriture en base, le compteur repart à zéro au prochain '
    + 'démarrage ; sans la mise à jour en mémoire, la fenêtre se rouvre au '
    + 'rendu suivant.');

  const j = app.indexOf('const nommerMonAgent');
  const corps2 = app.slice(j, j + 700);
  verifier('nommer l’agent range le nom dans `pros` tout de suite',
    j > 0 && /setPros\(/.test(corps2) && /agentNom:/.test(corps2),
    'Sinon la fenêtre se refermerait et se rouvrirait au rendu suivant, la '
    + 'fiche en mémoire n’ayant toujours pas de nom.');
}

verifier('le voile et la croix de la fenêtre comptent le refus',
  /onFermer=\{renommage \? onFermer : onPlusTard\}/.test(fenetre),
  'Fermer la fenêtre EST un refus. Une sortie qui ne le compte pas la fait '
  + 'revenir à chaque démarrage.');

/* L'EN-TÊTE NE PROMET PAS UN TRAVAIL QUI N'A PAS EU LIEU. À la première
   ouverture l'agent n'a encore rien fait ; quand la fenêtre revient, c'est
   précisément parce qu'il vient de travailler. */
verifier('l’en-tête dit la vérité dans les deux cas',
  /vientDeTravailler$/m.test(fenetre.replace(/\s+$/gm, ''))
  && /Il vient de travailler pour vous/.test(fenetre)
  && /Il est prêt à travailler pour vous/.test(fenetre),
  'Écrire « il travaille déjà pour vous » à la toute première ouverture '
  + 'serait un travail annoncé qui n’a pas eu lieu.');

verifier('…et OpusApp lui transmet le signal',
  /vientDeTravailler=\{agentATravaille\}/.test(app));

verifier('la fenêtre est posée sur `FeuilleBas`',
  /import FeuilleBas from '\.\/FeuilleBas'/.test(fenetre)
  && /<FeuilleBas/.test(fenetre),
  'Elle porte un champ de saisie : c’est exactement la forme du défaut du '
  + '04/10, où le clavier de l’iPhone recouvrait le champ ET la croix.');

/* ================================================================== */
console.log('\nQUELQU’UN LIT CE NOM — sinon c’est une colonne écrite pour rien');

verifier('le récit du chantier l’écrit',
  /nomAgent = AGENT_SANS_NOM/.test(recitBloc)
  && /\$\{nomAgent\}/.test(recitBloc),
  'Une colonne qu’on écrit sans jamais la relire est une panne silencieuse '
  + '— le défaut du 01/10.');

verifier('…et il ne réécrit pas le repli à la main',
  !/'votre agent'/.test(recitBloc) && !/'Votre agent'/.test(recitBloc),
  'Deux valeurs de repli pour une seule vérité : la leçon des voyants.');

verifier('« Mon agent » affiche son nom et ouvre le réglage',
  /nomAgent, onRenommerAgent,/.test(confid)
  && /onPress=\{onRenommerAgent\}/.test(confid),
  'La fenêtre se tait après trois refus. Sans cette porte, un artisan qui a '
  + 'touché « Plus tard » trois fois ne pourrait plus JAMAIS nommer son '
  + 'agent : la proposition serait devenue une porte fermée.');

verifier('…et cette rangée est une vraie cible au doigt',
  /nomAgent: \{[\s\S]{0,200}minHeight: TOUCHE/.test(confid),
  'Elle ouvre une fenêtre : la règle des 44 points du lot 5 vaut pour elle. '
  + 'Et `minHeight`, pas `paddingVertical` — React Native aplatit par '
  + 'précision.');

verifier('OpusApp passe le nom aux deux lecteurs',
  (app.match(/nomAgent=\{nomDeMonAgent\}/g) || []).length === 2,
  'Un lecteur oublié, et la colonne redevient un décor.');

verifier('un particulier ne voit pas la rangée du nom',
  /onRenommerAgent=\{canPublish \? \(\) => setRenommerAgent\(true\) : null\}/.test(app),
  'Il n’a pas d’agent (§3).');

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} contrôle(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Le nom de l’agent : on propose trois fois, au bon moment, '
  + 'et le réglage reste ouvert pour toujours.\n');
