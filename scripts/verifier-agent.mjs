/**
 * L'AGENT — qui l'appelle, ce que ça coûte, et QUI LIT le journal.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Section 38 de `schema.sql` : la première pierre de l'agent Opus (§21, §23
 * du cahier des charges). Elle a corrigé une porte grande ouverte — la
 * fonction Edge `ai` appelait Anthropic pour quiconque détenait la clé
 * publiable, c'est-à-dire pour n'importe qui — et elle pose un journal
 * d'audit.
 *
 * Un journal d'audit est exactement le genre de chose qui se dégrade sans
 * bruit : une politique d'écriture ajoutée « pour le back-office », un
 * `revoke` qui ne révoque rien, un `raise` qui annule la ligne qu'on venait
 * d'écrire, un lecteur qu'on retire en croyant nettoyer. Aucun de ces
 * défauts ne lève d'erreur, et les quatre ont été commis pendant ce lot.
 *
 * CE QU'IL TIENT, ET DANS LES DEUX SENS
 * -------------------------------------
 * 1. la base : aucune écriture possible, le bon `revoke`, pas de question ni
 *    de réponse conservée, un refus qui SURVIT à sa transaction ;
 * 2. la fonction Edge : elle identifie, elle note AVANT de payer, elle
 *    s'arrête sur un refus ;
 * 3. **l'application : quelqu'un LIT ce journal.** Sans ce bout, section 38
 *    serait une table qu'on écrit et que personne ne relit — le défaut que
 *    ce projet traque depuis le 01/10, et un comble pour un journal d'audit.
 *
 * ET IL FAIT TOURNER LES LIBELLÉS, il ne les lit pas. `src/lib/journal-ia.js`
 * n'importe RIEN — dixième application de la leçon de
 * `cloudinary-adresses.js` —, parce que la règle qui compte ici ne se voit
 * qu'à l'exécution : **une action que l'application ne connaît pas encore
 * doit s'afficher quand même.**
 *
 *   npm run verifier-agent
 */
import { readFileSync } from 'node:fs';

const {
  LIMITE_IA_PAR_JOUR, ACTIONS_IA, CIBLES_IA,
  libelleAction, detailAction, libelleCible, libelleResultat, estUnEchec,
  savoirFaireAgent, AGENT_PLUS_TARD,
} = await import('../src/lib/journal-ia.js');

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
const edge = sansCommentaires(lire('supabase/functions/ai/index.ts'));
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const ecran = sansCommentaires(lire('src/screens/ConfidentialiteScreen.js'));
const clientIA = sansCommentaires(lire('src/lib/ai.js'));

/* ================================================================== */
console.log('\nLes LIBELLÉS — on les fait tourner');

{
  verifier('les quatre actions connues ont un libellé lisible',
    Object.keys(ACTIONS_IA).every((c) => {
      const l = libelleAction(c);
      return l && l !== c && !l.includes('«');
    }),
    'Une clé brute à l\'écran ressemble à une faute de frappe, donc '
    + 'personne ne la signale. La règle de `nomMetier`.');

  verifier('…et une explication',
    Object.keys(ACTIONS_IA).every((c) => detailAction(c).length > 20));

  /* LE CONTRÔLE LE PLUS IMPORTANT DE CE FICHIER. L'agent gagnera des
     actions (devis, facture, planning) ; une application pas encore mise à
     jour doit rendre compte de ce qui s'est passé, pas afficher une ligne
     vide. Un journal d'audit troué par une version en retard ne prouve
     plus rien. */
  const inconnue = libelleAction('devis');
  verifier('une action INCONNUE s\'affiche quand même',
    inconnue.length > 0 && inconnue.includes('devis'),
    `libelleAction('devis') rend « ${inconnue} ».`);

  verifier('…et elle n\'invente aucune explication',
    detailAction('devis') === '');

  verifier('une action vide ne rend pas une ligne vide',
    libelleAction('').length > 0 && libelleAction(null).length > 0,
    `libelleAction('') rend « ${libelleAction('')} ».`);

  /* Un nom lisible porte un ARTICLE — « sur une publication », jamais
     « sur publication », et encore moins « sur publication_v2 ». C'est le
     plus simple des signes qu'on a bien écrit une phrase et pas recopié une
     clé. */
  verifier('une cible connue se dit en français',
    Object.keys(CIBLES_IA).every((c) => /^sur (la|le|les|un|une|votre|vos) /
      .test(libelleCible(c))),
    Object.keys(CIBLES_IA).map((c) => `${c} -> ${libelleCible(c)}`).join(' ; '));

  verifier('une cible inconnue se TAIT',
    libelleCible('devis_2027') === '' && libelleCible(null) === '',
    'Afficher la clé brute serait pire que ne rien dire.');

  verifier('« ok » n\'affiche aucun résultat',
    libelleResultat('ok') === '' && !estUnEchec('ok'),
    'Écrire « Réussi » sur chaque ligne ferait du bruit là où l\'on '
    + 'cherche justement l\'exception.');

  verifier('un refus et une erreur se VOIENT',
    libelleResultat('refuse').length > 10 && libelleResultat('erreur').length > 10
    && estUnEchec('refuse') && estUnEchec('erreur'),
    'Une limite qui mord en silence ressemble à une panne.');
}

/* ================================================================== */
console.log('\nLes DEUX ÉCRITURES de la même vérité ne peuvent pas se séparer');

{
  /* `LIMITE_IA_PAR_JOUR` ne sert qu'à composer une phrase, mais une phrase
     fausse sur une limite est exactement ce qui fait conclure « l'appli est
     cassée ». */
  const m = schema.match(/p_limite_jour\s+int\s+default\s+(\d+)/);
  verifier('la limite annoncée à l\'écran est celle de la base',
    !!m && Number(m[1]) === LIMITE_IA_PAR_JOUR,
    `schema.sql dit ${m ? m[1] : '(introuvable)'}, journal-ia.js dit `
    + `${LIMITE_IA_PAR_JOUR}.`);

  /* Les actions que la fonction Edge sait faire, lues chez l'APPELANT :
     c'est lui qui décide ce qui entre au journal. */
  const envoyees = [...clientIA.matchAll(/action:\s*'([a-z_]+)'/g)].map((x) => x[1]);
  verifier('…et chaque action envoyée a son libellé',
    envoyees.length >= 4 && envoyees.every((a) => ACTIONS_IA[a]),
    `Envoyées : ${envoyees.join(', ')}. Nommées : `
    + `${Object.keys(ACTIONS_IA).join(', ')}.`);

  /* ET DANS L'AUTRE SENS : une cible nommée que personne n'envoie est le
     « bouton §18 » — du décor qu'un contrôle couvre consciencieusement. */
  const contextes = [...lire('src/screens/ProfilEditScreen.js').matchAll(/contexte="([a-z]+)"/g)]
    .concat([...lire('src/screens/CreerScreen.js').matchAll(/contexte="([a-z]+)"/g)])
    .map((x) => x[1]);
  const ciblesEnvoyees = new Set([
    ...[...clientIA.matchAll(/cibleType:\s*'([a-z_]+)'/g)].map((x) => x[1]),
    ...contextes,
  ]);
  verifier('chaque cible ENVOYÉE est nommée',
    [...ciblesEnvoyees].every((c) => CIBLES_IA[c]),
    `Envoyées : ${[...ciblesEnvoyees].join(', ')}. Nommées : `
    + `${Object.keys(CIBLES_IA).join(', ')}.`);
}

/* ================================================================== */
console.log('\nLa BASE — un journal qu\'on peut récrire ne prouve rien');

{
  const section = schema.slice(schema.indexOf('create table if not exists public.journal_ia'));
  const table = section.slice(0, section.indexOf(');') + 2);

  verifier('aucune politique d\'écriture sur journal_ia',
    !/create policy[^;]*on public\.journal_ia[^;]*for (insert|update|delete|all)/i.test(schema),
    'Seule la fonction Edge, avec la clé de service, peut y ajouter une '
    + 'ligne. C\'est ce qui rend ce journal crédible.');

  verifier('…et une seule politique de lecture, à SOI',
    /create policy "lecture mon journal ia"[\s\S]{0,200}?user_id = auth\.uid\(\)/.test(schema));

  verifier('la politique est créée SOUS CONDITION',
    /pg_policies[\s\S]{0,300}?journal_ia/.test(schema),
    'Le connecteur Supabase refuse tout ordre qui commence par `drop`.');

  verifier('le journal ne garde NI la question NI la réponse',
    !/\b(question|reponse|prompt|texte|contenu)\s+text/.test(table),
    'Ce qu\'on n\'écrit pas ne peut pas fuir : une demande à l\'IA contient '
    + 'le nom d\'un client, un prix, parfois une adresse.');

  verifier('l\'heure est celle de l\'ACTE, pas de la transaction',
    /created_at\s+timestamptz not null default clock_timestamp\(\)/.test(table),
    '`now()` rend l\'heure de début de transaction : deux actes portent '
    + 'alors le même horodatage et `order by` en sort un au hasard.');

  verifier('le journal d\'un compte supprimé part avec lui',
    /user_id\s+uuid not null references public\.users\(id\) on delete cascade/.test(table));

  verifier('les trois résultats sont tenus par une contrainte',
    /resultat[\s\S]{0,120}check \(resultat in \('ok', 'refuse', 'erreur'\)\)/.test(table));
}

/* ================================================================== */
console.log('\nLa LIMITE — et le refus qui doit SURVIVRE à sa transaction');

{
  const i = schema.indexOf('create or replace function public.enregistrer_appel_ia');
  const fn = schema.slice(i, schema.indexOf('$$;', i) + 3);

  verifier('la fonction existe et est `security definer`',
    i > 0 && /security definer/.test(fn),
    'La table n\'a aucune politique d\'écriture : c\'est le seul chemin.');

  verifier('on ne compte QUE les appels qui ont abouti',
    /count\(\*\)[\s\S]{0,200}?resultat = 'ok'[\s\S]{0,120}?24 hours/.test(fn),
    'Compter les refus ferait qu\'un compte bloqué le reste la journée '
    + 'entière à cause de ses propres tentatives.');

  /* LE DÉFAUT QUE L'ESSAI A DÉMOLI EN UNE LIGNE : `raise` ANNULE la
     transaction, donc l'insertion du refus qu'on venait d'écrire était
     effacée avec elle. Le journal n'aurait gardé aucune trace des limites
     atteintes — l'inverse exact de ce qu'on voulait. */
  const brancheLimite = fn.slice(fn.indexOf('faits >= p_limite_jour'));
  const avantLeRetour = brancheLimite.slice(0, brancheLimite.indexOf('return ligne;'));
  verifier('un refus est INSCRIT, il ne lève pas d\'exception',
    /insert into public\.journal_ia/.test(avantLeRetour)
    && !/raise exception/.test(avantLeRetour),
    '`raise` annule la transaction : la ligne du refus partirait avec elle.');

  verifier('…et la fonction REND toujours une ligne',
    /returns public\.journal_ia/.test(fn),
    'C\'est son `resultat` qui dit ce qui s\'est passé. L\'appelant le lit.');

  verifier('un appel sans utilisateur, lui, CASSE',
    /p_user is null[\s\S]{0,200}?raise exception/.test(fn),
    'Ce n\'est pas un cas métier mais une faute de programmation.');

  /* LE DÉFAUT MESURÉ SUR LA VRAIE BASE LE 07/10, et pas sur la base
     d'essai : PostgreSQL accorde `execute` à PUBLIC sur toute fonction
     neuve, ET Supabase l'accorde EN PLUS directement aux deux rôles. Il
     faut révoquer les trois. */
  const revoke = schema.match(/revoke all on function public\.enregistrer_appel_ia[\s\S]{0,200}?;/);
  const cible = revoke ? revoke[0] : '';
  verifier('la fonction est révoquée à PUBLIC et aux DEUX rôles',
    /from public, anon, authenticated/.test(cible),
    'Un `revoke` sur les rôles seuls ne touche pas le droit de PUBLIC ; un '
    + '`revoke` sur PUBLIC seul ne touche pas le grant direct de Supabase. '
    + 'Mesuré : un appel anonyme a répondu 409, donc la fonction s\'était '
    + 'exécutée.');

  verifier('…et accordée au seul rôle de service',
    /grant execute on function public\.enregistrer_appel_ia[\s\S]{0,200}?to service_role/.test(schema),
    'Un artisan qui pourrait l\'appeler écrirait ce qu\'il veut dans son '
    + 'propre journal d\'audit.');

  verifier('le journal part dans l\'export RGPD',
    /'journal_ia', coalesce\(\(select jsonb_agg/.test(schema),
    'C\'est une donnée personnelle sur CET utilisateur.');
}

/* ================================================================== */
console.log('\nLa fonction EDGE — identifier, puis noter AVANT de payer');

{
  verifier('elle identifie l\'appelant',
    /auth\.getUser\(jeton\)/.test(edge),
    'La clé publiable EST un jeton valide, mais elle ne désigne personne.');

  verifier('…et refuse en 401 sans utilisateur',
    /if \(!user\)[\s\S]{0,300}?401/.test(edge));

  /* L'ORDRE EST LE SUJET : refuser après avoir payé l'appel ne protège
     rien. */
  const posJournal = edge.indexOf("rpc('enregistrer_appel_ia'");
  const posAnthropic = edge.indexOf('client.messages.create');
  verifier('le journal part AVANT Anthropic',
    posJournal > 0 && posAnthropic > posJournal,
    'Refuser après avoir payé l\'appel ne protège rien.');

  const entreLesDeux = edge.slice(posJournal, posAnthropic);
  verifier('un refus s\'arrête là, en 429',
    /resultat === 'refuse'[\s\S]{0,400}?429/.test(entreLesDeux),
    'Et il se DIT : une limite qui mord en silence ressemble à une panne.');

  verifier('le coût réel est inscrit après coup',
    /\.from\('journal_ia'\)[\s\S]{0,200}?\.update\(\{ jetons_entree/.test(edge),
    'Sans ce second temps, les deux colonnes de jetons resteraient à zéro '
    + 'pour toujours.');

  const noteOk = (edge.match(/noter\([^)]*'ok'\)/g) || []).length;
  verifier('chaque action note son coût',
    noteOk >= 4, `${noteOk} appels à noter(…, 'ok') pour 4 actions.`);

  verifier('…et une panne du modèle aussi',
    /catch[\s\S]{0,400}?noter\(0, 0, 'erreur'\)/.test(edge),
    'Une erreur qui n\'entre pas au journal rend le journal faux.');

  /* TROUVÉ LE 07/10 EN LISANT LE JOURNAL d'un vrai appel : un refus pour
     demande malformée (« une seule étape ») s'y inscrivait `ok`, avec zéro
     jeton. L'écran l'aurait montré comme un travail fait, et il aurait
     consommé un des soixante appels de la journée. */
  const corps = edge.slice(edge.indexOf('const client = new Anthropic'));
  const refusNus = [...corps.matchAll(/return json\(\{[\s\S]{0,200}?\}, 400\)/g)];
  verifier('aucun refus précoce ne passe pour une réussite',
    refusNus.length === 0 && /const refuser = async/.test(edge),
    `${refusNus.length} refus rendent un 400 sans passer par refuser(). Un `
    + 'travail qui n\'a pas pu se faire ne doit jamais ressembler à un '
    + 'travail fait.');

  verifier('…et un refus ne punit pas celui qui l\'envoie',
    /const refuser = async[\s\S]{0,200}?await noter\(0, 0, 'erreur'\)/.test(edge),
    '`enregistrer_appel_ia()` ne compte que les `ok` : marquer `erreur` sort '
    + 'la ligne du décompte de la limite.');

  verifier('un journal incomplet ne fait pas échouer la réponse',
    /if \(error\) console\.error\('journal_ia \(mise à jour\)/.test(edge),
    'L\'artisan a sa réponse, c\'est l\'essentiel.');
}

/* ================================================================== */
console.log('\nL’ARTISAN SAIT CE QUE SON AGENT SAIT FAIRE — et OÙ le lui demander');

/* Demandé par le propriétaire le 07/10/2026 : « il faut que la personne qui
   voit cette page comprenne à quoi cet agent va lui servir, ça va être son
   plus fidèle assistant et il faut qu'il s'en rende compte ».

   Le vrai enjeu n'est pas la page d'aujourd'hui, c'est CELLE DE DEMAIN : le
   jour où l'agent apprend à rédiger un devis, sa ligne doit s'écrire dans le
   MÊME lot. Ces contrôles-là sont ce qui le force. */
{
  const toutes = Object.entries(ACTIONS_IA);
  const sans = toutes.filter(([, a]) => !a.sait || !a.ou);
  verifier('CHAQUE action dit ce qu’elle sait faire, et OÙ',
    sans.length === 0,
    `Il manque \`sait\` ou \`ou\` à : ${sans.map(([c]) => c).join(', ')}. `
    + 'Une action qu’on ne sait pas trouver n’existe pas pour celui qui la '
    + 'cherche — et c’est ce contrôle qui oblige le prochain lot à écrire sa '
    + 'ligne sur la page « Mon agent ».');

  verifier('…au PRÉSENT, pas au passé comme le journal',
    toutes.every(([, a]) => !/^(Vous avez|L’agent a|L\'agent a)/.test(a.sait || '')),
    '`detail` raconte ce qui s’est passé, `sait` dit ce qu’il sait faire. '
    + 'Recopier l’un dans l’autre donnerait une liste de capacités écrite au '
    + 'passé, qui se lit comme un historique.');

  verifier('…et assez pour être comprise',
    toutes.every(([, a]) => (a.sait || '').length > 40 && (a.ou || '').length >= 6));

  /* LA LISTE EST DÉRIVÉE, JAMAIS RECOPIÉE. Deux listes pour une seule
     vérité se contredisent toujours — et ici la seconde promettrait des
     choses que la première ne fait pas. */
  const liste = savoirFaireAgent();
  verifier('la liste affichée EST le catalogue, pas une copie',
    liste.length === toutes.length
    && liste.every((f, i) => f.cle === toutes[i][0] && f.sait === toutes[i][1].sait),
    'Leçon des voyants du 04/10.');

  verifier('l’écran la rend en la PARCOURANT',
    /savoirFaireAgent\(\)\.map\(/.test(ecran)
    && /\{f\.sait\}/.test(ecran) && /Depuis : \$\{f\.ou\}/.test(ecran),
    'Écrite à la main dans le JSX, elle ne suivrait pas la prochaine action.');

  verifier('…et aucun libellé n’y est recopié en dur',
    !Object.values(ACTIONS_IA).some((a) => ecran.includes(a.sait)),
    'Le contrôle ne vaut que si l’écran n’a pas sa propre version.');

  /* UNE SEULE PHRASE SUR L'AVENIR. Une LISTE de fonctionnalités à venir
     serait le « bouton §18 » en pire : un menu de promesses que rien ne
     tient, et qui vieillit mal. */
  verifier('l’avenir tient en UNE phrase, et elle est à l’écran',
    typeof AGENT_PLUS_TARD === 'string'
    && AGENT_PLUS_TARD.split('.').filter((x) => x.trim()).length === 1
    && /\{AGENT_PLUS_TARD\}/.test(ecran),
    'Une liste de fonctionnalités à venir est un menu de promesses que rien '
    + 'ne tient.');

  verifier('…et elle ne promet aucune DATE',
    !/\b(bientôt|prochainement|dans \d|cet? (?:semaine|mois|année)|202\d)\b/i
      .test(AGENT_PLUS_TARD),
    'Une date annoncée est une date qu’on tiendra mal.');

  /* Le nom de l'agent sert ICI aussi : « Ce que Margot sait faire » plutôt
     que « Ce que l'assistant sait faire ». C'est tout l'intérêt de l'avoir
     nommé. */
  verifier('le journal aussi l’appelle par son nom',
    /Chaque fois que \$\{nomAgent\} travaille pour vous/.test(ecran),
    'Deux paragraphes qui se suivent, l’un disant « Margot » et l’autre '
    + '« l’assistant » : le réglage ne sert alors à rien.');

  verifier('l’en-tête de la liste appelle l’agent par son nom',
    /Ce que \$\{nomAgent\} sait faire/.test(ecran),
    'Nommer son agent et ne jamais l’appeler par son nom, c’est un réglage '
    + 'qui ne sert à rien.');
}

/* ================================================================== */
console.log('\nQUELQU\'UN LIT CE JOURNAL — sinon tout ce qui précède est du décor');

{
  verifier('l\'application sait lire le journal',
    /export const mesActionsIA = !hasSupabase/.test(api),
    'Une table qu\'on écrit sans jamais la lire est une panne silencieuse.');

  const i = api.indexOf('export const mesActionsIA');
  const fn = api.slice(i, i + 1200);
  verifier('…la lecture est BORNÉE',
    /\.limit\(TAILLE_JOURNAL_IA\)/.test(fn),
    'Un artisan qui se sert de l\'agent tous les jours en aura des '
    + 'milliers.');

  verifier('…triée du plus récent au plus ancien',
    /\.order\('created_at', \{ ascending: false \}\)/.test(fn));

  verifier('…et elle n\'écrit AUCUN filtre sur l\'utilisateur',
    !/\.eq\('user_id'/.test(fn),
    'La politique RLS dit `user_id = auth.uid()`, et c\'est tout ce '
    + 'qu\'elle dit : il n\'y a donc aucun filtre à oublier d\'écrire ici.');

  verifier('le mode démonstration fait VIVRE le mécanisme',
    /function journalIADemo/.test(api) && /Date\.now\(\) - heures/.test(api),
    'Des dates CALCULÉES : figées dans le fichier, elles seraient justes le '
    + 'premier jour et fausses ensuite.');

  /* Le jeu de démonstration doit contenir les quatre cas, sinon rien ne se
     vérifie au navigateur sans fichier `.env`. */
  const demo = api.slice(api.indexOf('function journalIADemo'));
  const jeu = demo.slice(0, demo.indexOf('\n}'));
  verifier('…avec un refus, une erreur, ET une action inconnue',
    /resultat: 'refuse'/.test(jeu) && /resultat: 'erreur'/.test(jeu)
    && [...jeu.matchAll(/action: '([a-z_]+)'/g)].some((x) => !ACTIONS_IA[x[1]]),
    'C\'est le seul endroit où la règle « une action inconnue s\'affiche '
    + 'quand même » se voit à l\'écran.');

  verifier('l\'écran est branché',
    /onChargerActionsIA=\{api\.mesActionsIA\}/.test(app));

  verifier('…et il affiche les libellés, jamais les clés',
    /libelleAction\(a\.action\)/.test(ecran) && /libelleCible\(a\.cible_type\)/.test(ecran));

  verifier('…jamais l\'identifiant de la cible',
    !/a\.cible_id/.test(ecran),
    'Un journal n\'a pas à exposer le nom d\'un TIERS : il sert à rendre '
    + 'compte, pas à naviguer.');

  verifier('la limite est annoncée à l\'artisan',
    /LIMITE_IA_PAR_JOUR/.test(ecran),
    'Sinon elle mord sans prévenir.');

  /* L'ÉCHEC NE DOIT PAS RESSEMBLER À UNE LISTE VIDE — le défaut de « Pour
     moi » du 05/10, où un chargement raté annonçait « Aucune demande ». */
  verifier('un échec de lecture se DIT',
    /echecIA/.test(ecran) && /Lecture impossible/.test(ecran),
    '« Votre agent n\'a encore rien fait » devant une lecture ratée serait '
    + 'une bonne nouvelle annoncée à tort.');

  /* ET IL EST CONTENU : cet écran porte l'export RGPD et la suppression de
     compte. Un journal d'audit ajouté hier ne doit pas pouvoir fermer la
     porte de sortie de quelqu'un. */
  /* Le premier jet de ce contrôle cherchait `blocages: await` dans l'écran.
     Il n'y est PAS — c'est `OpusApp` qui compose cet objet —, donc il passait
     au vert sans rien éprouver. Septième fois dans ce projet. On regarde
     maintenant les deux endroits où la solidarité pourrait naître. */
  const effets = ecran.split('useEffect(');
  const effetIA = effets.find((e) => e.includes('onChargerActionsIA()'));
  verifier('…dans son PROPRE effet',
    !!effetIA && !effetIA.includes('onCharger()'),
    'Deux chargements dans le même effet tombent ensemble.');

  const debutObjet = app.indexOf('onCharger={async () => ({');
  const objet = app.slice(debutObjet, app.indexOf('})}', debutObjet) + 3);
  verifier('…et hors de l\'objet que compose OpusApp',
    !objet.includes('onChargerActionsIA')
    && /setEchecIA\(true\)/.test(ecran) && /catch/.test(effetIA || ''),
    'Le ranger avec les deux autres le rendrait solidaire : une table '
    + 'absente, et c\'est l\'export RGPD et la suppression de compte qui '
    + 'tombent avec lui.');

  verifier('la troncature se dit',
    /actionsIA\.length >= TAILLE_JOURNAL_IA/.test(ecran),
    'Une liste coupée en silence laisse croire que l\'agent n\'a rien fait '
    + 'de plus.');
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} contrôle(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ L’agent : personne d’autre ne l’appelle, tout est noté, et '
  + 'quelqu’un le lit.\n');
