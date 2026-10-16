/**
 * UN COMPTE NE SE CRÉE PAS À MOITIÉ, ET UN BADGE NE SE PREND PAS.
 *
 * CE QUI S'EST PASSÉ, ET QUI NE DOIT PAS REVENIR
 * ----------------------------------------------
 * Relevé sur la VRAIE base le 05/10/2026 : un compte y dormait depuis le
 * 14/09 avec `users.type = 'pro'` et AUCUNE ligne dans
 * `professional_profiles`. Il ne pouvait rien faire — invisible dans la
 * Place des pros, incapable de publier ou de recevoir une demande. Et rien
 * ne le signalait : ni erreur, ni écran cassé, ni contrôle rouge.
 *
 * La cause : les deux moitiés d'un compte d'artisan ne venaient pas du même
 * endroit. La ligne `users` d'un déclencheur de la base (donc toujours
 * présente), la fiche professionnelle de l'application — et seulement si
 * `signUp()` rendait une session, ce qu'elle ne fait PAS quand la
 * confirmation par e-mail est demandée.
 *
 * En cherchant comment réparer, DEUX FAILLES ont été trouvées et prouvées
 * sur PostgreSQL 16 :
 *
 *   1. **le badge se décernait à la CRÉATION.** Le verrou de
 *      `tient_le_profil_pro()` ne regardait que `UPDATE` ; la politique
 *      « ecriture mon profil » est `for all`. Un client modifié insérait sa
 *      fiche avec `kbis_valide = true, assurance_valide = true` et
 *      ressortait `verifie = t`. C'est la faille du 29/09 refermée d'un
 *      côté et laissée ouverte de l'autre ;
 *   2. **un pro pouvait effacer les avis écrits SUR LUI.** Onze tables
 *      dépendent de `professional_profiles` en `on delete cascade`, dont
 *      `reviews`. Mesuré : un avis une étoile, le pro supprime sa fiche,
 *      zéro avis restant, compte toujours là. Il recrée sa fiche et repart
 *      à neuf — ce que la règle RGPD du projet interdit formellement.
 *
 * CE QUI SE VÉRIFIE ICI
 * ---------------------
 *   1. le formulaire d'inscription voyage dans les métadonnées ;
 *   2. la BASE crée les deux moitiés, et sans donner de droits ;
 *   3. le badge est verrouillé à la création comme à la modification ;
 *   4. une fiche professionnelle ne se supprime pas, mais la cascade d'une
 *      suppression de compte passe toujours ;
 *   5. (section 45, 15/10/2026) un compte pro ne naît qu'avec une entreprise
 *      trouvée au répertoire Sirene, et son identité vient de la PREUVE ;
 *   6. et plus aucune fiche ne se « répare » depuis l'application.
 *
 * LE 5 DU 05/10 A ÉTÉ RETIRÉ, ET C'EST VOULU. Ce contrôle exigeait que
 * `reparerFichePro()` existe et que `start()` l'appelle : un compte pro sans
 * fiche se réparait à l'ouverture, en relisant les métadonnées du compte.
 * Or ces métadonnées, le client les réécrit (`PUT /auth/v1/user`), et la
 * fiche qui en naissait n'avait AUCUNE entreprise. Depuis la section 45,
 * toute fiche naît dans une fonction de la base qui exige une entreprise, et
 * l'INSERT du client est refusé (OP010) : la réparation ne pouvait plus
 * aboutir. Une fonction qui ne peut plus aboutir est le « bouton §18 ». Ce
 * contrôle exige donc désormais son ABSENCE — et il restera rouge tant que
 * l'application ne l'a pas retirée : c'est l'ordre de livraison du lot.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI : que la confirmation par e-mail se comporte
 * comme prévu sur un vrai iPhone. Les essais de la base sont dans
 * `supabase/essais-section-31.sql`.
 *
 *   npm run verifier-compte
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Un contrôle qui lit du code retire d'abord les commentaires. C'est arrivé
   QUATRE fois dans ce projet qu'un contrôle accuse la documentation qui
   explique le défaut qu'il traque. */
function sansCommentaires(source) {
  let dedans = null;
  let sortie = '';
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const suivant = source[i + 1];
    if (!dedans && c === '/' && suivant === '/') { dedans = 'ligne'; }
    else if (!dedans && c === '/' && suivant === '*') { dedans = 'bloc'; }
    else if (dedans === 'ligne' && c === '\n') { dedans = null; }
    else if (dedans === 'bloc' && c === '*' && suivant === '/') {
      dedans = null; sortie += '  '; i += 1; continue;
    }
    sortie += dedans && c !== '\n' ? ' ' : c;
  }
  return sortie;
}

const lire = (f) => readFileSync(f, 'utf8');
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
/* Et le SQL perd les siens, qui commencent par `--`. CINQUIÈME fois dans ce
   projet qu'un contrôle risque d'accuser la documentation qui EXPLIQUE le
   défaut qu'il traque : le commentaire au-dessus d'un `insert` nomme
   volontiers les colonnes qu'il ne faut surtout pas y mettre. */
const sql = lire('supabase/schema.sql').replace(/--[^\n]*/g, '');

console.log('\nLe formulaire d’inscription survit à la confirmation par e-mail');
{
  verifier('`signUp` emporte l’entreprise, les métiers et la ville',
    /options: \{ data: metadonnees \}/.test(api)
    && /metadonnees\.entreprise/.test(api)
    && /metadonnees\.metiers/.test(api)
    && /metadonnees\.ville/.test(api),
    'sans session, l’application ne peut RIEN écrire — la règle RLS '
    + '« chacun sa fiche » le refuse. Les informations doivent voyager '
    + 'avec le compte, ou elles sont perdues');

  verifier('…et l’acceptation des CGU avec',
    /metadonnees\.cgu = cguVersion/.test(api),
    'elle était enregistrée APRÈS l’inscription, donc jamais quand la '
    + 'confirmation était demandée : une trace légale perdue en silence');

  verifier('l’application ne crée plus la fiche pro à l’inscription',
    !/ensureProProfile/.test(app),
    'c’est ce `await` placé après le `return { confirmationRequise }` qui '
    + 'a produit le compte fantôme du 14/09');
}

console.log('\nLa BASE crée les deux moitiés, et ne donne aucun droit');
{
  const trigger = /create or replace function public\.cree_fiche_utilisateur\(\)[\s\S]*?\$\$;/
    .exec(sql);
  verifier('`cree_fiche_utilisateur()` existe toujours', !!trigger);
  const corps = trigger ? trigger[0] : '';

  verifier('elle crée AUSSI la fiche professionnelle',
    /insert into public\.professional_profiles/.test(corps),
    'la ligne `users` était garantie, la fiche pro non : c’est tout le '
    + 'défaut');

  verifier('…et elle enregistre les CGU',
    /cgu_version/.test(corps) && /cgu_acceptees_le/.test(corps));

  /* LE POINT LE PLUS IMPORTANT DE CE CONTRÔLE. Les métadonnées sont
     écrites par le CLIENT au moment de l'inscription : un client modifié
     peut y mettre ce qu'il veut. L'insertion doit nommer ses colonnes, et
     aucune colonne de vérification ne doit s'y trouver. */
  for (const colonne of ['verifie', 'kbis_valide', 'assurance_valide', 'rge']) {
    /* L'insertion s'arrête à `on conflict`, pas à `);` : il n'y a aucun
       `);` dans cet ordre, et la première version de ce contrôle n'a donc
       rien éprouvé du tout. */
    const insertion = /insert into public\.professional_profiles[\s\S]*?on conflict/
      .exec(corps);
    verifier(`la fiche ne naît jamais avec \`${colonne}\``,
      !!insertion && !new RegExp(`\\b${colonne}\\b`).test(insertion[0]),
      'les métadonnées viennent du client : une colonne nommée là serait '
      + 'un badge distribué à qui le demande');
  }

  verifier('les métiers sont validés par la MÊME fonction que la contrainte',
    /public\.metiers_connus\(mes_metiers\)/.test(corps),
    'deux validations divergent toujours — et celle qui compte est celle '
    + 'de la contrainte');

  verifier('…et un métier inventé ne fait pas ÉCHOUER l’inscription',
    /mes_metiers := array\['macon'\]/.test(corps),
    'refuser la création du compte pour une métadonnée malformée serait '
    + 'pire que le défaut qu’on corrige');
}

console.log('\nLe badge ne se décerne pas soi-même — à la création non plus');
{
  const verrou = /create or replace function public\.tient_le_profil_pro\(\)[\s\S]*?\$\$;/
    .exec(sql);
  const corps = verrou ? verrou[0] : '';

  verifier('le verrou regarde l’INSERT',
    /tg_op = 'INSERT' and auth\.uid\(\) is not null and auth\.uid\(\) = new\.id/
      .test(corps),
    'il ne regardait que UPDATE. Prouvé sur PostgreSQL 16 : un INSERT '
    + 'avec kbis_valide et assurance_valide ressortait verifie = t');

  verifier('…et il regarde toujours l’UPDATE',
    /tg_op = 'UPDATE' and auth\.uid\(\) is not null and auth\.uid\(\) = new\.id/
      .test(corps),
    'c’est la faille du 29/09, elle ne doit pas se rouvrir');

  verifier('le déclencheur est posé sur les DEUX moments',
    /before insert or update on public\.professional_profiles/.test(sql));

  /* Déposer ses documents reste permis : c'est dire « voici mes
     justificatifs », pas « je suis vérifié ». */
  verifier('déposer ses documents dès la création reste permis',
    /not in \('non_soumis', 'en_attente'\)/.test(corps));
}

console.log('\nUne fiche professionnelle ne se supprime pas');
{
  const garde = /create or replace function public\.fiche_pro_indestructible\(\)[\s\S]*?\$\$;/
    .exec(sql);
  verifier('`fiche_pro_indestructible()` existe', !!garde,
    'onze tables en dépendent en cascade, dont les AVIS écrits par des '
    + 'tiers. Mesuré : le pro supprime sa fiche, les avis disparaissent');
  const corps = garde ? garde[0] : '';

  verifier('elle refuse, avec un message qui explique',
    /raise exception/.test(corps) && /avis/.test(corps),
    'une politique rend « 0 ligne supprimée » sans un mot ; un '
    + 'déclencheur DIT pourquoi');

  /* LA CASCADE DOIT PASSER. `preparer_suppression_compte()` finit par
     `delete from public.users`, et supprimer son compte reste un droit. */
  verifier('…mais la cascade d’une suppression de COMPTE passe',
    /not exists \(select 1 from public\.users u where u\.id = old\.id\)/.test(corps),
    'sans cette porte, supprimer son compte deviendrait impossible — et '
    + 'ce chemin-là est vérifié depuis le 01/10');

  verifier('le déclencheur est posé avant la suppression',
    /create or replace trigger trg_fiche_pro_indestructible[\s\S]{0,120}before delete on public\.professional_profiles/
      .test(sql));

  verifier('`create or replace trigger`, pas `drop` + `create`',
    !/drop trigger if exists trg_fiche_pro_indestructible/.test(sql),
    'le connecteur Supabase refuse tout ordre qui COMMENCE par `drop` — '
    + 'il expire au bout d’une minute sans rien appliquer');
}

console.log('\nUn compte pro naît avec une entreprise trouvée au répertoire (section 45)');
{
  const trigger = /create or replace function public\.cree_fiche_utilisateur\(\)[\s\S]*?\$\$;/
    .exec(sql);
  const corps = trigger ? trigger[0] : '';
  const declare = corps.slice(corps.indexOf('declare'), corps.indexOf('begin'));
  const insertUsers = corps.indexOf('insert into public.users');

  /* LA DÉCLARATION, et pas le corps : un corps plpgsql n'est analysé qu'à
     l'exécution, mais une variable du type d'une table qui n'existe pas
     encore lève dès la CRÉATION — mesuré. Les tables de la section 45
     naissent 6 000 lignes plus bas : le premier passage du schéma sur une
     base neuve échouerait, et le second passerait. */
  verifier('aucune variable n’a le type d’une table de la section 45',
    !!declare
    && !/%rowtype|%type/i.test(declare)
    && !/public\.(preuves_siret|entreprise_registre|demandes_pro)/.test(declare),
    '`record` et des variables simples seulement : sinon le schéma ne se '
    + 'rejoue qu’une fois sur deux');

  /* LA GARDE ENTIÈRE, ANCRÉE — 15/10/2026, relecture adverse. La première
     version cherchait des MORCEAUX du texte : `p.expire_le > now()` quelque
     part, `OP006` quelque part. Trois sabotages passaient au vert sans un
     ✘ : la fraîcheur relâchée (`now() - interval '30 days'`), la source
     élargie (`p.source is not null or …`) et le refus rendu mort
     (`if not found and false then`). On exige désormais la garde telle
     qu'elle doit être, d'un seul tenant : la lecture de la preuve, sa
     fraîcheur, ses deux seules sources, puis le refus IMMÉDIAT. */
  const gardePreuve = /select p\.\* into la_preuve\s+from public\.preuves_siret p\s+where p\.siret = le_siret\s+and p\.expire_le > now\(\)\s+and \(p\.source = 'registre'\s+or \(p\.source = 'essai'\s+and p\.pour_email = lower\(coalesce\(new\.email, ''\)\)\)\);\s+if not found then\s+raise exception/;
  verifier('une inscription pro exige une PREUVE fraîche du répertoire, et la refuse aussitôt sans elle (OP006)',
    gardePreuve.test(corps)
    && /if not found then\s+raise exception\s+'Inscription professionnelle impossible[^;]*using errcode = 'OP006';/.test(corps),
    'sans elle, un compte pro naît de ce que le formulaire DÉCLARE — un '
    + 'SIRET inventé, celui d’un autre');

  verifier('…et une preuve `essai` ne vaut que pour l’adresse EXACTE qu’elle nomme',
    /p\.source = 'essai'\s+and p\.pour_email = lower\(coalesce\(new\.email, ''\)\)/.test(corps)
    && !/like '%@exemple-opus\.test'/.test(corps)
    && /constraint preuve_essai_check[\s\S]{0,300}pour_email like '%@exemple-opus\.test'/.test(sql),
    'les SIRET fictifs des essais sont dans le dépôt, et la confirmation par '
    + 'e-mail n’est pas activée : un DOMAINE accepte n’importe quelle adresse '
    + 'inventée (relecture adverse, mesuré). Une preuve d’essai nomme UN compte.');

  verifier('une entreprise déjà rattachée — ou GELÉE par l’administration — est refusée (OP007), par le SIREN',
    /from public\.entreprise_registre e\s+where e\.siren = la_preuve\.siren and \(e\.retiree_le is null or e\.gele\)\) then\s+raise exception/.test(corps)
    && /using errcode = 'OP007'/.test(corps),
    'le SIREN et pas le SIRET : déménager change le SIRET, pas l’entreprise. '
    + 'Et sans le gel, le squatteur à qui l’administration a retiré une '
    + 'entreprise la reprenait en ouvrant un compte neuf (section 45.3)');

  verifier('…et les deux refus passent AVANT toute écriture',
    insertUsers > 0
    && corps.indexOf("errcode = 'OP006'") > 0 && corps.indexOf("errcode = 'OP006'") < insertUsers
    && corps.indexOf("errcode = 'OP007'") > 0 && corps.indexOf("errcode = 'OP007'") < insertUsers,
    'un refus après l’insertion laisserait un compte à moitié — le défaut '
    + 'exact de la section 31');

  /* L'IDENTITÉ VIENT DE LA PREUVE. Les métadonnées sont écrites par le
     client : une seule colonne d'identité lue là-bas, et le formulaire
     décide de ce que dit le répertoire. */
  const identite = /insert into public\.entreprise_registre[\s\S]*?\);/.exec(corps);
  verifier('l’identité légale naît DEPUIS LA PREUVE, jamais depuis les métadonnées',
    !!identite && !/meta\b|->>/.test(identite[0])
    && /la_preuve\.siren/.test(identite[0])
    && /la_preuve\.verifiee_le/.test(identite[0]),
    'le client choisit un numéro ; c’est le répertoire qui dit ce qu’il '
    + 'désigne, et quand il l’a dit');

  /* La porte de secours : une métadonnée malformée ne coûte JAMAIS un
     compte. Le bloc qui avale les erreurs ne doit contenir QUE l'insertion
     de la demande — y glisser OP006 ou OP007 rouvrirait l'inscription pro
     sans preuve. */
  const blocDemande = /begin\s+insert into public\.demandes_pro[\s\S]*?exception when others then\s+null;\s+end;/
    .exec(corps);
  verifier('la demande de secours est insérée dans son propre bloc qui rattrape tout',
    !!blocDemande,
    'une contrainte violée dans ce déclencheur ferait ÉCHOUER la création du '
    + 'compte : une métadonnée malformée ne doit pas coûter un compte');
  verifier('…et ce bloc ne contient QUE cette insertion',
    !!blocDemande && !/OP006|OP007|professional_profiles|entreprise_registre|public\.users/.test(blocDemande[0]),
    'rattraper OP006 ou OP007 ici rouvrirait l’inscription pro sans preuve');

  /* LES CLÉS DES MÉTADONNÉES SONT UN CONTRAT entre l'application et la
     base, et rien d'autre ne le tient : une faute de frappe d'un côté, et
     chaque inscription pro tombe sur OP006 — que GoTrue rend en « Database
     error saving new user », sans un mot de plus. */
  verifier('la base lit `siret` et `demande_pro` dans les métadonnées',
    /meta ->> 'siret'/.test(corps) && /meta -> 'demande_pro'/.test(corps));
  const i = api.indexOf('export async function signUp');
  const j = i < 0 ? -1 : api.indexOf('\nexport ', i + 10);
  const signUp = i < 0 ? '' : api.slice(i, j < 0 ? undefined : j);
  /* LA BRANCHE, pas la fonction entière — 15/10/2026, relecture adverse.
     Le NOM DE LA CLÉ, pas la présence du mot : la variable s'appelle aussi
     `siret`, et un premier jet passait au vert avec
     `metadonnees.numeroSiret = siret`. Le second passait encore avec
     `metadonnees.numero_siret = …` : il trouvait `siret:` dans l'objet de
     la PORTE DE SECOURS (`demande_pro = { siret: … }`), quelques lignes
     plus bas. Chaque clé se cherche donc dans SA branche : `siret` entre
     `if (userType === 'pro')` et `else if (demandePro`, `demande_pro` dans
     la seconde. */
  const iPro = signUp.indexOf("if (userType === 'pro') {");
  const iSecours = signUp.indexOf('} else if (demandePro', iPro);
  const iFin = signUp.indexOf('const { data, error } = await supabase.auth.signUp(', iSecours);
  const branchePro = iPro >= 0 && iSecours > iPro ? signUp.slice(iPro, iSecours) : '';
  const brancheSecours = iSecours >= 0 && iFin > iSecours ? signUp.slice(iSecours, iFin) : '';
  const ecritSiret = /metadonnees(?:\.siret|\[\s*['"]siret['"]\s*\])\s*=/.test(branchePro);
  const ecritDemande = /metadonnees(?:\.demande_pro|\[\s*['"]demande_pro['"]\s*\])\s*=/.test(brancheSecours);
  verifier('…et `signUp` les écrit, sous ces noms-là',
    ecritSiret && ecritDemande,
    'sans le SIRET, toute inscription pro est refusée (OP006) ; sans la '
    + 'demande, la porte de secours ouvre un compte particulier SANS demande, '
    + 'et l’artisan attend une réponse que personne ne lui doit');
}

console.log('\nPlus aucune fiche ne se « répare » depuis l’application');
{
  /* Le contrôle du 05/10 exigeait le contraire, et il avait raison ce
     jour-là. Voir l'en-tête : la réparation relisait des métadonnées que le
     client réécrit, et la fiche naissait sans entreprise. */
  for (const [nom, source] of [['src/lib/api.js', api], ['src/OpusApp.js', app]]) {
    verifier(`\`ensureProProfile\` a disparu de ${nom}`,
      !/ensureProProfile/.test(source),
      'elle insérait la fiche depuis le client : la base la refuse '
      + 'désormais (OP010), et une fiche sans entreprise est ce que la '
      + 'section 45 ferme');
    verifier(`\`reparerFichePro\` a disparu de ${nom}`,
      !/reparerFichePro/.test(source),
      'elle relisait les métadonnées du compte, que le client peut réécrire '
      + 'par PUT /auth/v1/user');
  }

  verifier('la base refuse toute fiche venue du client (OP010)',
    /create or replace function public\.exige_un_compte_pro\(\)[\s\S]*?using errcode = 'OP010'/.test(sql),
    'c’est ce refus qui rend la réparation inutile — et dangereuse si elle '
    + 'revenait par une autre porte');
}

console.log('\nL’adresse du COMPTE ne devient publique que par un geste');
{
  /* ====================================================================
     DEMANDÉ PAR LE PROPRIÉTAIRE LE 05/10/2026 : « quand on crée un
     compte pro on renseigne une adresse e-mail, mais quand on veut
     modifier notre fiche ces informations ne sont pas mises
     automatiquement. On ne pourrait pas les faire rentrer directement ? »

     Il a raison sur la gêne. Mais la recopier TOUTE SEULE rendrait
     publique, par une autre porte, l'adresse que le 29/09 a fermée à
     tout le monde : il suffirait de toucher « Enregistrer » sans y
     penser. D'où un bouton qui MONTRE l'adresse avant de la poser.
     ==================================================================== */
  const edit = sansCommentaires(lire('src/screens/ProfilEditScreen.js'));

  verifier('l’e-mail pro n’est JAMAIS prérempli avec celui du compte',
    /useState\(profil\.emailPro \|\| ''\)/.test(edit)
    && !/useState\(profil\.emailPro \|\| emailCompte/.test(edit),
    'le champ part vide, et il doit partir vide : `email_pro` est une '
    + 'adresse qu’on renseigne POUR qu’elle s’affiche');

  verifier('…mais un bouton la propose, en la MONTRANT',
    /onPress=\{\(\) => setEmailPro\(emailCompte\)\}/.test(edit)
    && /Utiliser l'adresse de mon compte \(\{emailCompte\}\)/.test(edit),
    'sans l’adresse écrite dessus, on appuie sans savoir ce qu’on publie');

  verifier('…et il disparaît une fois le champ rempli',
    /!emailPro\.trim\(\) && !!emailCompte/.test(edit),
    'une proposition qui reste après coup n’est plus une aide');

  verifier('l’adresse du compte vient de `mon_compte()`, pas d’une lecture publique',
    /email: moi\.email \|\| ''/.test(api),
    '`users.email` est fermée à tout le monde depuis le 29/09 ; '
    + '`mon_compte()` est la seule porte, et elle ne rend QUE ma ligne');

  verifier('…et elle n’arrive à l’écran que par cette porte',
    /emailCompte=\{monProfil\.email \|\| ''\}/.test(app)
    && !/pros\[myProId\][^\n]*\.email\b/.test(app),
    '`pros[]` est public : l’adresse du compte ne doit jamais y entrer');
}

console.log('\nEt ce qui ne sert plus a été RETIRÉ');
{
  verifier('`accepterConditions()` n’existe plus',
    !/export const accepterConditions/.test(api),
    'elle n’avait plus aucun appelant : une fonction que personne '
    + 'n’appelle est le « bouton §18 »');

  verifier('les essais de la section 31 sont dans le dépôt',
    (() => { try { return lire('supabase/essais-section-31.sql').length > 0; }
      catch (e) { return false; } })(),
    'onze cas, chacun dans son `begin … rollback`');

  verifier('…et ceux de la section 45, qui éprouvent la preuve et la porte de secours',
    (() => {
      try {
        const e = lire('supabase/essais-section-45.sql');
        return /OP006/.test(e) && /OP007/.test(e) && /demande_pro/.test(e);
      } catch (e) { return false; }
    })());
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Un compte d’artisan naît entier, avec une entreprise que le '
  + 'répertoire connaît ; le badge ne se prend pas, et les avis d’un client '
  + 'survivent à l’artisan qu’ils notent.\n');
