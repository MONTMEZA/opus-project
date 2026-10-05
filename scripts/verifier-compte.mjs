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
 *   5. un compte déjà cassé se répare à l'ouverture.
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

console.log('\nUn compte déjà cassé se répare à l’ouverture');
{
  verifier('`reparerFichePro()` lit les métadonnées du compte',
    /export async function reparerFichePro/.test(api)
    && /supabase\.auth\.getUser\(\)/.test(api),
    'c’est là que signUp a rangé l’entreprise, les métiers et la ville');

  verifier('…et `start()` l’appelle quand MA fiche manque',
    /if \(!data\.pros\[api\.getUserId\(\)\]\)/.test(app)
    && /api\.reparerFichePro\(\)/.test(app),
    'un seul endroit par lequel passent TOUS les chemins : inscription, '
    + 'connexion, réouverture');

  verifier('la détection ne coûte aucune requête',
    /if \(!data\.pros\[api\.getUserId\(\)\]\)/.test(app),
    '`loadAll()` vient de rendre les fiches — on regarde si la mienne y '
    + 'est, on ne la redemande pas');

  verifier('un échec de réparation ne bloque pas l’entrée',
    /reparerFichePro\(\)[\s\S]{0,260}catch[\s\S]{0,200}showErreur/.test(app),
    'un artisan qui ne peut pas entrer du tout ne peut rien corriger '
    + 'non plus');
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
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Un compte d’artisan naît entier, le badge ne se prend pas, et '
  + 'les avis d’un client survivent à l’artisan qu’ils notent.\n');
