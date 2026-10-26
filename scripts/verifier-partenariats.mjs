/**
 * UN PARTENARIAT SE DEMANDE, IL NE SE PREND PAS — et il ne se retourne pas.
 *
 * CE QUI S'EST PASSÉ, ET QUI NE DOIT PAS REVENIR
 * ----------------------------------------------
 * Relevé le 19/10/2026 (audit de l'addendum QR), puis prouvé le 26/10 sur
 * un PostgreSQL 16 au schéma réellement appliqué : la seule règle
 * d'écriture des partenariats était « mes partenaires », `for all`, qui
 * demandait seulement d'être l'un des deux. Donc :
 *
 *   1. une demande EN ATTENTE se lisait SANS COMPTE (`using (true)` pour
 *      `anon`) — qui propose quoi à qui ;
 *   2. celui qui la RECEVAIT pouvait en changer l'AUTEUR en l'acceptant
 *      (`professional_id` réécrit) : un partenariat « demandé » par
 *      quelqu'un qui n'a jamais rien demandé ;
 *   3. le demandeur pouvait s'inscrire d'office ACCEPTÉ, sans attendre ;
 *   4. un refus s'effaçait d'un `delete` du demandeur, et la demande
 *      repartait — avec sa notification. En boucle.
 *
 * Aucune erreur, aucun écran cassé : l'application, elle, n'envoyait que
 * des demandes honnêtes. Seul un client modifié s'en servait — c'est
 * exactement ce que les règles de la base doivent tenir.
 *
 * CE QUI SE VÉRIFIE ICI
 * ---------------------
 *   A. les quatre portes de la base, chacune avec SA règle (lot S-b) ;
 *   B. ce qu'un client a le droit d'écrire, colonne par colonne ;
 *   C. le déclencheur : ni changement d'auteur, ni date venue du téléphone,
 *      ni acceptation sous un blocage ;
 *   D. la notification ne se répète pas à chaque relance ;
 *   E. l'application ne propose plus ce que la base refusera, et dit ce
 *      qu'elle refuse.
 *
 * LA PREUVE DE SÉCURITÉ N'EST PAS ICI : elle est dans
 * `supabase/essais-section-51b.sql` (section H), joué sur une base
 * rejouée. Ce contrôle lit le TEXTE ; il garde la forme entre deux essais.
 *
 *   npm run verifier-partenariats
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Un contrôle qui lit du code retire d'abord les commentaires — la leçon
   écrite quatre fois dans CLAUDE.md : sinon il accuse (ou bénit) la
   documentation qui explique le défaut. */
const sansSql = (c) => c.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const sansJs = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const schema = sansSql(lire('supabase/schema.sql'));
const T = 'public\\.professional_partners';

/** Toutes les créations d'une politique de la table, chacune isolée. */
const politiques = (nom) => [...schema.matchAll(
  new RegExp(`create policy "${nom}" on ${T}([\\s\\S]*?);`, 'g'))].map((m) => m[1].replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim());

console.log('\nA. Les quatre portes, chacune avec SA règle');
{
  /* « mes partenaires » était `for all` : quatre portes, dont celle qui
     laissait le destinataire changer l'AUTEUR d'une demande en l'acceptant.
     Elle n'est plus créée nulle part, et elle est retirée d'une base qui
     l'aurait encore (des règles permissives s'additionnent : une seule
     restée ouverte annulerait les quatre ci-dessous). */
  const mes = politiques('mes partenaires');
  verifier('« mes partenaires » (l’ancienne `for all`) : plus créée nulle part, et retirée d’une base qui l’aurait encore',
    mes.length === 0 && new RegExp(`drop policy if exists "mes partenaires" on ${T};`).test(schema), mes.join(' | '));
  const anon = politiques('lecture partenaires');
  verifier('« lecture partenaires » (l’ancienne lecture publique) : `to anon using (false)`',
    anon.length === 1 && /^for select to anon using \(false\)$/.test(anon[0]), anon.join(' | '));

  const lecture = politiques('lecture partenariats');
  verifier('« lecture partenariats » : `to authenticated`, et pas à `anon`',
    lecture.length === 1 && /^for select to authenticated using/.test(lecture[0]));
  /* Un tiers ne lit qu'un partenariat ACCEPTÉ, et ni l'un ni l'autre des
     deux ne doit l'avoir masqué : une demande en attente ou refusée ne
     regarde que les deux intéressés. */
  verifier('…un tiers ne lit qu’un partenariat ACCEPTÉ, et jamais à travers un blocage',
    lecture.length === 1
      && /\(statut = 'accepte' and not public\.est_masque\(professional_id\) and not public\.est_masque\(partner_id\)\)/.test(lecture[0])
      && /auth\.uid\(\) = professional_id or auth\.uid\(\) = partner_id/.test(lecture[0]));

  const demande = politiques('je demande un partenariat');
  verifier('« je demande » : INSERT seulement, à son nom, EN ATTENTE, et pas vers qui l’a masqué',
    demande.length === 1
      && /^for insert to authenticated with check \(auth\.uid\(\) = professional_id and statut = 'en_attente' and not public\.est_masque\(partner_id\)\)$/.test(demande[0]),
    demande.join(' | '));

  const reponse = politiques('je reponds a un partenariat');
  /* Le `using` gouverne la ligne qu'on TOUCHE : seulement une demande en
     attente qui m'est adressée. Le `with check` gouverne ce qu'elle
     DEVIENT : acceptée ou refusée, rien d'autre — pas « en attente »
     encore, ce qui ferait renaître une notification. */
  verifier('« je reponds » : UPDATE du DESTINATAIRE, sur une demande en attente, vers accepté ou refusé',
    reponse.length === 1
      && /^for update to authenticated using \(auth\.uid\(\) = partner_id and statut = 'en_attente'\) with check \(auth\.uid\(\) = partner_id and statut in \('accepte', 'refuse'\)\)$/.test(reponse[0]),
    reponse.join(' | '));

  const rompre = politiques('je romps un partenariat');
  /* LE REFUS RESTE : le demandeur ne l'efface pas. Sinon il le supprime et
     redemande, et la personne qui a dit non reçoit la même notification
     jusqu'à céder. Le destinataire, lui, peut toujours l'effacer : c'est
     SON refus. */
  verifier('« je romps » : DELETE ; le demandeur n’efface pas un REFUS, le destinataire si',
    rompre.length === 1
      && /^for delete to authenticated using \(\(auth\.uid\(\) = professional_id and statut <> 'refuse'\) or auth\.uid\(\) = partner_id\)$/.test(rompre[0]),
    rompre.join(' | '));

  const toutes = [...schema.matchAll(new RegExp(`create policy "([^"]+)" on ${T}`, 'g'))].map((m) => m[1]);
  const attendues = ['lecture partenaires', 'lecture partenariats', 'je demande un partenariat',
    'je reponds a un partenariat', 'je romps un partenariat'];
  verifier('aucune AUTRE politique sur la table (une règle de plus s’additionnerait aux autres)',
    toutes.length === attendues.length && attendues.every((n) => toutes.includes(n)), toutes.join(', '));
  /* `est_masque()` appelée par une politique à laquelle `anon` aurait
     accès ÉCHOUE au lieu de filtrer (CLAUDE.md, « Modération ») : aucune
     politique `to anon` de cette table ne l'appelle. */
  verifier('aucune politique `anon` de la table n’appelle `est_masque`',
    anon.every((p) => !/est_masque/.test(p)));
}

console.log('\nB. Ce qu’un client a le droit d’écrire, colonne par colonne');
{
  verifier('`anon` n’a plus AUCUN droit sur la table',
    new RegExp(`revoke all on ${T} from anon;`).test(schema));
  verifier('`authenticated` perd l’insertion et la modification de TOUTES les colonnes…',
    new RegExp(`revoke insert, update on ${T} from authenticated;`).test(schema));
  /* …puis les récupère colonne par colonne : on ne choisit à l'insertion
     ni la date de création, ni la date de réponse ; on ne modifie que le
     statut (et la date, que le déclencheur réécrit de toute façon). */
  verifier('…puis les récupère pour `professional_id, partner_id, statut` à l’insertion seulement',
    new RegExp(`grant insert \\(professional_id, partner_id, statut\\) on ${T} to authenticated;`).test(schema));
  verifier('…et pour `statut, repondu_le` en modification seulement',
    new RegExp(`grant update \\(statut, repondu_le\\) on ${T} to authenticated;`).test(schema));
  /* L'ordre compte : un `grant` posé APRÈS rouvrirait. TOUS les `grant` qui
     suivent sont relevés — un droit de COLONNE (`grant insert (created_at)`)
     ou `grant all on TABLE` échappaient au premier motif (relecture du
     26/10) — et seuls les deux attendus sont admis. */
  const iRevoke = schema.search(new RegExp(`revoke insert, update on ${T} from authenticated;`));
  const apres = schema.slice(iRevoke);
  const grants = [...apres.matchAll(new RegExp(`grant\\s[^;]*?\\bon\\s+(?:table\\s+)?${T}\\b[^;]*;`, 'g'))]
    .map((m) => m[0].replace(/\s+/g, ' '));
  const attendus = [
    'grant insert (professional_id, partner_id, statut) on public.professional_partners to authenticated;',
    'grant update (statut, repondu_le) on public.professional_partners to authenticated;',
  ];
  verifier('après le `revoke`, EXACTEMENT les deux droits de colonne attendus — rien de plus, sous aucune forme',
    iRevoke >= 0 && JSON.stringify(grants) === JSON.stringify(attendus), grants.join(' | '));
  verifier('le statut naît « en attente » par défaut, même sans la politique',
    new RegExp(`alter table ${T} alter column statut set default 'en_attente';`).test(schema));
}

console.log('\nC. Le déclencheur : ni changement d’auteur, ni date du téléphone');
{
  /* UNE SEULE DÉFINITION (relecture du 26/10) : une seconde, plus bas,
     gagnerait au rejeu — et ce contrôle ne lisait que la première. */
  const morceaux = schema.split('create or replace function public.tient_le_partenariat()');
  verifier('`tient_le_partenariat` n’est défini qu’UNE fois', morceaux.length === 2, `${morceaux.length - 1} définition(s)`);
  const corps = (morceaux[1] || '').split('$$;')[0];
  verifier('`tient_le_partenariat` est `security invoker`, et ne vise que ce qu’écrit un CLIENT (R-A)',
    /security invoker/.test(corps) && /if current_user not in \('authenticated', 'anon'\) then\s+return new;/.test(corps));
  verifier('une PROPOSITION vers qui m’a masqué est refusée (OP020), sans nommer le blocage',
    /if public\.est_masque\(new\.partner_id\) then\s+raise exception '([^']*)'\s+using errcode = 'OP020'/.test(corps)
      && !/bloqu|masqu/i.test((corps.match(/raise exception '([^']*)'\s+using errcode = 'OP020'/) || [])[1] || 'bloqu'));
  verifier('ni le demandeur, ni le destinataire, ni la date de création ne changent (OP021)',
    /new\.professional_id is distinct from old\.professional_id\s+or new\.partner_id is distinct from old\.partner_id\s+or new\.created_at is distinct from old\.created_at then\s+raise exception '[^']*'\s+using errcode = 'OP021'/.test(corps));
  verifier('on n’ACCEPTE pas sous un blocage (OP020) — refuser reste possible',
    /if new\.statut = 'accepte' and old\.statut is distinct from 'accepte'\s+and public\.est_masque\(new\.professional_id\) then\s+raise exception '[^']*'\s+using errcode = 'OP020'/.test(corps));
  /* La date de réponse appartient à la BASE, comme toutes les dates du
     projet : à l'insertion rien, et `clock_timestamp()` quand le statut
     change. Une date venue du téléphone ne prouve rien. */
  /* ET LA DATE DE LA DEMANDE : le droit de colonne la ferme déjà ; le
     déclencheur est la seconde ligne, si un droit était un jour élargi. */
  verifier('la date de la DEMANDE est posée par la base à l’insertion (`clock_timestamp()`)',
    /new\.created_at := clock_timestamp\(\);\s+new\.repondu_le := null;\s+return new;/.test(corps));
  verifier('la date de réponse est posée par la base : vide à l’insertion, `clock_timestamp()` au changement',
    /new\.repondu_le := null;/.test(corps)
      && /new\.repondu_le := case when new\.statut is distinct from old\.statut\s+then clock_timestamp\(\) else old\.repondu_le end;/.test(corps));
  const creations = schema.match(/create (?:or replace )?trigger trg_tient_le_partenariat\b/g) || [];
  verifier('…posé AVANT l’insertion ET la modification, et créé UNE fois',
    new RegExp(`create or replace trigger trg_tient_le_partenariat\\s+before insert or update on ${T}`).test(schema)
      && creations.length === 1, `${creations.length} création(s)`);
}

console.log('\nD. Une notification ne se répète pas à chaque relance');
{
  const morceaux = schema.split('create or replace function public.notifie_partenariat()');
  verifier('`notifie_partenariat` n’est défini qu’UNE fois', morceaux.length === 2, `${morceaux.length - 1} définition(s)`);
  const corps = (morceaux[1] || '').split('$$;')[0];
  /* Réponse du propriétaire (Q2, 25/10) : une seule notification
     « partenaire_demande » par paire et par 24 h. Le refus restant en
     base, la relance n'est plus possible ; la garde tient le reste
     (annuler, redemander, à la main ou par un client modifié). */
  verifier('« partenaire_demande » : pas deux fois en 24 h pour la même paire, à l’horloge réelle',
    /not exists \(select 1 from public\.notifications n\s+where n\.user_id = new\.partner_id\s+and n\.acteur_id = new\.professional_id\s+and n\.type = 'partenaire_demande'\s+and n\.created_at > clock_timestamp\(\) - interval '24 hours'\)/.test(corps),
    'la garde des 24 h n’a pas la forme attendue');
}

console.log('\nE. L’application ne propose plus ce que la base refusera');
{
  const api = sansJs(lire('src/lib/api.js'));
  const iDem = api.indexOf('export const demanderPartenariat');
  const demander = api.slice(iDem, api.indexOf('export const repondrePartenariat'));
  verifier('`demanderPartenariat` insère EN ATTENTE (jamais d’upsert, jamais « accepte »)',
    /from\('professional_partners'\)\.insert\(\{\s*professional_id: currentUserId, partner_id: partnerId, statut: 'en_attente',\s*\}\)/.test(demander)
      && !/upsert|'accepte'/.test(demander));
  verifier('…et la démonstration refuse sous un blocage, avec les mots de la base',
    /if \(demoBlocages\.has\(String\(partnerId\)\)\) \{\s*throw new ErreurDeLaBase\('OP020', REFUS_DEMANDES\.OP020_proposer\);/.test(demander));

  const repondre = api.slice(api.indexOf('export const repondrePartenariat'), api.indexOf('export const retirerPartenariat'));
  /* Une mise à jour que la politique écarte touche ZÉRO ligne sans
     erreur : sans `.select()`, l'écran annoncerait « accepté » pour une
     demande annulée entre-temps. */
  verifier('`repondrePartenariat` relit ce qu’il a écrit, et refuse ZÉRO ligne (OP019)',
    /\.eq\('professional_id', demandeurId\)\.eq\('partner_id', currentUserId\)\s*\.select\('statut'\);/.test(repondre)
      && /if \(!data \|\| !data\.length\) \{\s*throw new ErreurDeLaBase\('OP019'/.test(repondre));
  verifier('…et la démonstration refuse d’ACCEPTER sous un blocage (refuser passe)',
    /if \(accepte && demoBlocages\.has\(String\(demandeurId\)\)\) \{\s*throw new ErreurDeLaBase\('OP020', REFUS_DEMANDES\.OP020_accepter\);/.test(repondre));

  const iCharge = api.indexOf('const partenariatsClos = [];');
  const charge = iCharge < 0 ? '' : api.slice(iCharge, api.indexOf('const pros = {};', iCharge));
  verifier('le chargement range les REFUS (dans les deux sens) à part : `partenariatsClos`',
    /\} else if \(p\.statut === 'refuse'\) \{\s*if \(p\.partner_id === uid\) partenariatsClos\.push\(p\.professional_id\);\s*else if \(p\.professional_id === uid\) partenariatsClos\.push\(p\.partner_id\);/.test(charge)
      && /partenariatsClos,/.test(api));

  const profil = sansJs(lire('src/screens/ProfilOwnScreen.js'));
  verifier('« Mes partenaires » ne propose plus quelqu’un avec qui une demande a été refusée',
    /const candidats = Object\.values\(pros\)\.filter\(\(p\) => [\s\S]*?&& !partenariatsClos\.includes\(p\.id\)\);/.test(profil));

  const app = sansJs(lire('src/OpusApp.js'));
  const r = app.slice(app.indexOf('const repondrePartenariat = async'), app.indexOf('\n  };', app.indexOf('const repondrePartenariat = async')));
  verifier('OP019 retire la demande de la liste ; un refus la range dans `partenariatsClos`',
    /if \(String\(\(e && e\.code\) \|\| ''\) === 'OP019'\) \{\s*setDemandesPartenariat\(\(l\) => l\.filter\(\(id\) => id !== demandeurId\)\);/.test(r)
      && /if \(!accepte\) \{\s*setPartenariatsClos\(\(l\) => \[\.\.\.new Set\(\[\.\.\.l, demandeurId\]\)\]\);/.test(r));
  verifier('…et toute erreur est MONTRÉE, jamais avalée',
    /showErreur\(messageClair\(e, 'Réponse impossible'\)\);\s*return;/.test(r)
      && /showErreur\(messageClair\(e, 'Demande impossible'\)\);\s*return;/.test(app));
  /* OP020 FERME LA RANGÉE (relecture du 26/10) : sans cela, « Accepter »
     restait proposé et refaisait le même refus. Et l'ensemble se VIDE au
     rechargement et au déblocage — sinon un blocage levé laissait la
     rangée fermée pour la session. */
  verifier('OP020 range le demandeur dans `partenariatsFermes`, et la rangée ne garde que « Refuser »',
    /if \(String\(\(e && e\.code\) \|\| ''\) === 'OP020'\) \{\s*setPartenariatsFermes\(\(f\) => new Set\(\[\.\.\.f, demandeurId\]\)\);/.test(r)
      && /partenariatsFermes=\{partenariatsFermes\}/.test(app)
      && /\{!\(partenariatsFermes && partenariatsFermes\.has\(id\)\) && \(\s*<BtnMini\s+label="Accepter"/.test(profil));
  verifier('…et `partenariatsFermes` se vide au rechargement des données et au déblocage',
    /setPartenariatsClos\(data\.partenariatsClos \|\| \[\]\);\s*setPartenariatsFermes\(new Set\(\)\);/.test(app)
      && /const debloquerEtRouvrir = async \(id\) => \{\s*await api\.debloquer\(id\);\s*setDemandesFermees\(new Set\(\)\);\s*setPartenariatsFermes\(new Set\(\)\);/.test(app)
      && /onDebloquer=\{debloquerEtRouvrir\}/.test(app));
  /* UN SEUL ENVOI À LA FOIS PAR RANGÉE : un second appui parti avant que la
     rangée ne disparaisse touchait zéro ligne, et un bandeau rouge
     démentait « Partenariat accepté. ». */
  verifier('« Accepter » et « Refuser » passent par un verrou d’envoi (`envoiPartenariat`)',
    /const repondrePartenariat = async \(id, accepte\) => \{\s*if \(envoiPartenariat\) return;\s*setEnvoiPartenariat\(id\);\s*try \{ await onRepondrePartenariat\(id, accepte\); \} finally \{ setEnvoiPartenariat\(null\); \}/.test(profil)
      && (profil.match(/onPress=\{\(\) => repondrePartenariat\(id, (true|false)\)\}/g) || []).length === 2
      && !/onPress=\{\(\) => onRepondrePartenariat\(/.test(profil));
  verifier('`partenariatsClos` est bien passé à l’écran de son profil',
    /partenariatsClos=\{partenariatsClos\}/.test(app) && /setPartenariatsClos\(data\.partenariatsClos \|\| \[\]\)/.test(app));

  const erreurs = lire('src/lib/erreurs.js');
  verifier('la paire unique (`idx_partenaires_paire`) a sa phrase en français',
    /idx_partenaires_paire: '/.test(erreurs));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Un partenariat se demande, il ne se prend pas — et un refus reste un refus.\n');
