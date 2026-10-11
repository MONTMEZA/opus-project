/**
 * LE CARNET DE CLIENTS — section 41.
 *
 * CE QUE CE CONTRÔLE GARDE, ET POURQUOI CHAQUE POINT A COÛTÉ QUELQUE CHOSE
 * ------------------------------------------------------------------------
 * C'est la première table d'Opus dont le contenu concerne des TIERS qui
 * n'ont pas de compte. Tout le reste du projet ne contient que ce que ses
 * utilisateurs ont écrit SUR EUX-MÊMES. Trois invariants en découlent, et
 * aucun ne se voit à l'œil :
 *
 *   1. le carnet est PRIVÉ — aucune politique pour `anon`, et rien de son
 *      contenu ne part ailleurs dans l'application ;
 *   2. toutes les contraintes se terminent par `_check`, sinon
 *      `src/lib/erreurs.js` rend un message anonyme ET une piste FAUSSE ;
 *   3. un particulier n'a pas de SIRET, et le vider doit se VOIR à l'écran
 *      autant qu'être garanti par la base.
 *
 * Et il FAIT TOURNER le calcul au lieu de le lire — `src/lib/clients.js`
 * n'importe rien, douzième application de la leçon de
 * `cloudinary-adresses.js`.
 *
 *   npm run verifier-clients
 */
import { readFileSync } from 'node:fs';
import {
  validerClient, siretPropre, siretValide, emailPlausible, clientsDuMemeNom,
  clientsVisibles, clientCorrespond, clientDepuisDemande, nomNormalise,
  TYPES_CLIENT, LONGUEUR_MAX,
} from '../src/lib/clients.js';
import { initialClients, proProfiles } from '../src/data/demo.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Les commentaires `--` et `//` partent d'abord : NEUF fois dans ce projet
   un contrôle a accusé la documentation qui expliquait le défaut qu'il
   traque. */
const sansLignesCommentees = (t) => t.replace(/^\s*(--|\/\/).*$/gm, '');
/* ET DANS DU JSX, LES COMMENTAIRES SONT DES BLOCS. Celui de `FicheClient`
   est lu brut depuis le lot précédent, et il affirme `!/FeuilleBas/` : une
   seule phrase de documentation expliquant « ce n'est PAS une feuille du
   bas » suffisait à faire échouer le contrôle sur du code juste. Dixième
   fois dans ce projet qu'un contrôle accuserait la documentation. */
const sansCommentaires = (c) => c
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const schema = sansLignesCommentees(readFileSync('supabase/schema.sql', 'utf8'));
const essais = sansLignesCommentees(readFileSync('supabase/essais-section-41.sql', 'utf8'));
const ecran = readFileSync('src/screens/ClientsScreen.js', 'utf8');
const forme = sansCommentaires(readFileSync('src/components/FicheClient.js', 'utf8'));
const api = readFileSync('src/lib/api.js', 'utf8');
const appli = readFileSync('src/OpusApp.js', 'utf8');

/* ================================================================== */
console.log('\nLE CALCUL — il TOURNE, on ne le relit pas');

verifier('un nom vide est refusé', validerClient({}).ok === false);
verifier('…et le message dit lequel',
  /nom du client/i.test(validerClient({}).message)
  && /entreprise/i.test(validerClient({ type: 'entreprise' }).message),
  'Le libellé doit suivre le type : « nom du client » ou « nom de '
  + 'l’entreprise ». Un message qui parle d’autre chose que de ce qu’on voit '
  + 'à l’écran ne se comprend pas.');

verifier('un SIRET garde ses chiffres et perd le reste',
  siretPropre('123 456 789 00012') === '12345678900012'
  && siretPropre('12-34-56') === '123456'
  && siretPropre(null) === '');

verifier('9 ou 14 chiffres, et rien d’autre',
  siretValide('123456789') && siretValide('12345678900012')
  && !siretValide('123') && !siretValide('1234567890') && !siretValide(''),
  'Un SIREN fait 9 chiffres, un SIRET 14. Ce qui n’a pas cette longueur '
  + 'n’est pas un numéro : c’est autre chose qu’on vient de coller.');

{
  /* LE CŒUR DU LOT : un particulier n'a pas de SIRET, et on le VIDE au
     lieu de le refuser — la règle du calendrier du 04/10, « le meilleur
     message d'erreur est celui qu'on ne peut plus déclencher ». */
  const r = validerClient({ type: 'particulier', nom: 'Mme Dupont', siret: '12345678900012' });
  verifier('un PARTICULIER perd son SIRET, sans refus',
    r.ok === true && r.valeurs.siret === null,
    'Refuser aurait obligé à vider le champ à la main pour un numéro qui ne '
    + 'veut plus rien dire. Et le déclencheur `tient_le_client()` le vide de '
    + 'toute façon : les deux côtés doivent dire la même chose.');

  const e = validerClient({ type: 'entreprise', nom: 'SCI', siret: '123' });
  verifier('…mais une ENTREPRISE avec un numéro faux est refusée',
    e.ok === false && e.champ === 'siret' && /14 chiffres/.test(e.message)
    && /3/.test(e.message),
    'Et le message COMPTE les chiffres saisis : « il en faut 14 » sans dire '
    + 'combien on en a mis oblige à les compter soi-même.');
}

verifier('une adresse sans arobase ni point est refusée',
  !emailPlausible('pas-une-adresse') && !emailPlausible('a@b')
  && emailPlausible('contact@exemple.fr') && emailPlausible(''),
  'On refuse ce qui ne PEUT PAS être une adresse ; on ne prétend pas prouver '
  + 'qu’elle existe — la seule preuve, c’est qu’un message y arrive.');

verifier('un code postal fait 5 chiffres',
  validerClient({ nom: 'X', codePostal: '1341' }).champ === 'codePostal'
  && validerClient({ nom: 'X', codePostal: '13410' }).ok === true);

verifier('l’e-mail part en minuscules, les blancs deviennent `null`',
  validerClient({ nom: 'X', email: ' Contact@EXEMPLE.FR ' }).valeurs.email === 'contact@exemple.fr'
  && validerClient({ nom: 'X', telephone: '   ' }).valeurs.telephone === null,
  'Il ne doit exister qu’UNE façon de dire « ce champ est vide », sinon '
  + 'l’écran affiche une ligne « Téléphone » suivie de rien, et le bouton '
  + '« Appeler » compose une chaîne d’espaces.');

{
  /* L'AVERTISSEMENT, ET PAS UN REFUS. Contraste voulu avec le titre d'un
     chantier, qui porte un index unique (section 36.2). */
  const liste = [{ id: 'a', nom: 'mme  martin', ville: 'Charleval' }, { id: 'b', nom: 'Autre' }];
  verifier('deux noms identiques se RECONNAISSENT, accents et casse mis à part',
    clientsDuMemeNom('Mme MARTIN', liste).length === 1
    && clientsDuMemeNom('Mme Martin', liste, 'a').length === 0,
    '`saufId` évite de s’avertir de soi-même quand on modifie une fiche.');

  verifier('…et rien dans le code ne les REFUSE',
    !/unique index[^;]*clients/i.test(schema)
    && !/clients_nom_key|client_nom_unique/i.test(schema),
    'Un nom de client est une IDENTITÉ : dans un village il y a souvent '
    + 'trois Martin. Un index unique refuserait un vrai client au profit '
    + 'd’une base propre. C’est l’écran qui avertit.');
}

verifier('la recherche touche le nom, la ville, le numéro et l’e-mail',
  clientCorrespond({ nom: 'Martin', ville: 'Charleval' }, 'charlev')
  && clientCorrespond({ nom: 'X', email: 'contact@sci.fr' }, 'sci')
  && !clientCorrespond({ nom: 'Martin' }, 'zzz'),
  'Sur un chantier, on se souvient du village avant du nom.');

/* ET UN NUMÉRO SE CHERCHE SANS SES ESPACES. C'est ce contrôle qui l'a
   trouvé, en faisant tourner la fonction : « 0612 » ne trouvait pas
   « 06 12 34 56 78 », et ça ne levait aucune erreur — la liste revenait
   simplement vide. */
verifier('…et un numéro se cherche SANS ses espaces',
  clientCorrespond({ nom: 'Martin', telephone: '06 12 34 56 78' }, '0612')
  && clientCorrespond({ nom: 'Martin', telephone: '06 12 34 56 78' }, '06 12')
  && clientCorrespond({ nom: 'Martin', codePostal: '13350' }, '13350')
  && !clientCorrespond({ nom: 'Martin', telephone: '0612345678' }, '99'),
  'Personne ne tape les espaces d’un numéro dans une recherche.');

{
  const liste = [
    { id: 1, nom: 'Zoé', archive: false }, { id: 2, nom: 'Albert', archive: false },
    { id: 3, nom: 'Ancien', archive: true },
  ];
  const actifs = clientsVisibles(liste);
  verifier('la liste est triée par NOM, et non par date',
    actifs.length === 2 && actifs[0].nom === 'Albert',
    'On vient chercher quelqu’un qu’on connaît. Un carnet rangé du plus '
    + 'récent au plus ancien ne se consulte pas, il se fait défiler.');
  verifier('…et les archivés sont une AUTRE liste, pas un mélange',
    clientsVisibles(liste, { archives: true }).length === 1);
}

{
  const d = clientDepuisDemande({ clientNom: 'Julie M.', telephone: '0612345678', ville: 'Lambesc' });
  verifier('une demande reçue pré-remplit le formulaire',
    d.nom === 'Julie M.' && d.telephone === '0612345678'
    && d.ville === 'Lambesc' && d.type === 'particulier',
    'C’est ce qui remplace le lien vers un compte Opus que la section 41 a '
    + 'refusé d’écrire : un geste utile aujourd’hui plutôt qu’une colonne '
    + 'que personne ne lirait.');
}

verifier('les deux types sont nommés une seule fois',
  TYPES_CLIENT.length === 2
  && TYPES_CLIENT.map((t) => t.cle).join(',') === 'particulier,entreprise'
  && LONGUEUR_MAX.nom === 120);

/* ================================================================== */
console.log('\nLA BASE — un carnet PRIVÉ, et des contraintes qui se nomment');

verifier('la table existe et porte `pro_id` en cascade',
  /create table if not exists public\.clients/.test(schema)
  && /pro_id\s+uuid not null references public\.professional_profiles\(id\) on delete cascade/.test(schema),
  'La cascade fait que `preparer_suppression_compte()` emporte le carnet '
  + 'sans avoir à le nommer : clients → fiche pro → users.');

{
  const i = schema.indexOf('create table if not exists public.clients');
  const fin = schema.indexOf('alter table public.clients enable row level security');
  const bloc = i < 0 ? '' : schema.slice(i, fin > i ? fin : i + 4000);
  const contraintes = [...bloc.matchAll(/constraint\s+([a-z0-9_]+)\s+check/g)].map((m) => m[1]);

  verifier('toutes les contraintes se terminent par `_check`',
    contraintes.length >= 8 && contraintes.every((c) => c.endsWith('_check')),
    `Trouvées : ${contraintes.join(', ') || '(aucune)'}. `
    + '`src/lib/erreurs.js` extrait le nom avec /"([a-z0-9_]+_check)"/i : une '
    + 'contrainte nommée autrement rend « la base a refusé cette valeur » '
    + 'PLUS une piste fausse — « schema.sql n’a pas été rejoué » — pour ce '
    + 'qui n’est qu’une faute de frappe.');

  verifier('…et `erreurs.js` lit bien ce motif-là',
    /"\(\[a-z0-9_\]\+_check\)"/.test(readFileSync('src/lib/erreurs.js', 'utf8')),
    'Si ce motif change, la règle ci-dessus ne protège plus rien.');
}

verifier('le carnet est PRIVÉ : aucune politique pour `anon`',
  /create policy "mes clients" on public\.clients[\s\S]{0,200}for all to authenticated/.test(schema)
  && !/on public\.clients[\s\S]{0,120}to anon/.test(schema),
  'Le motif à DEUX politiques de la section 18 existe parce qu’une policy '
  + 'qui appelle une fonction interdite à l’appelant ÉCHOUE au lieu de '
  + 'filtrer. Il est juste pour une vitrine (un chantier, une publication) ; '
  + 'ici un visiteur doit lire ZÉRO. C’est le modèle de la section 30.');

{
  /* ON ISOLE LA POLITIQUE, et on compte DANS ELLE. Le premier jet cherchait
     `est_mon_entreprise` « quelque part dans les 300 caractères qui
     suivent » : un sabotage qui ne remplaçait que la clause `using` passait
     au vert, puisque le `with check` la contenait encore. Troisième fois
     dans ce projet qu'un contrôle vise une PLACE au lieu de viser la
     CHOSE — éprouvé en cassant, et il m'a eu. */
  const i = schema.indexOf('create policy "mes clients"');
  const pol = i < 0 ? '' : schema.slice(i, schema.indexOf(';', i));
  const combien = (pol.match(/est_mon_entreprise\(pro_id\)/g) || []).length;

  verifier('l’appartenance passe par `est_mon_entreprise()`, DES DEUX CÔTÉS',
    combien === 2 && !/auth\.uid\(\)/.test(pol),
    `Trouvé ${combien} appel(s) dans la politique, et `
    + `${/auth\.uid\(\)/.test(pol) ? 'un `auth.uid()` écrit à la main' : 'aucun `auth.uid()`'}. `
    + 'Il en faut deux — `using` ET `with check` —, et aucune comparaison '
    + 'écrite à la main : la discipline posée le 04/10 dans '
    + '`docs/LECTURE-CAHIER-DES-CHARGES.md`. C’est le seul endroit à changer '
    + 'le jour où un salarié aura son propre accès ; en oublier un côté, et '
    + 'ce jour-là la moitié de la règle resterait fausse.');
}

verifier('…et `anon` n’a AUCUN droit de table sur le carnet',
  /revoke all on public\.clients from anon;/.test(schema),
  'La RLS suffirait — `anon` n’a pas de politique. Mais Supabase accorde '
  + 'les quatre droits d’office, et la section 18.2 a montré le matin même '
  + 'ce que coûte un droit qu’on laisse en comptant sur une politique pour '
  + 'le rattraper. Le jour où quelqu’un ajoutera une politique `anon` ici, '
  + 'c’est la seconde ligne de défense.');

verifier('…et `authenticated`, lui, garde les siens',
  !/revoke all on public\.clients from [^;]*authenticated/.test(schema),
  'La politique « mes clients » limite déjà chacun à ses lignes. Retirer le '
  + 'droit de table casserait tout le carnet — c’est l’incident '
  + '`horaires_valides` du 30/09, sous une autre forme.');

{
  const i = schema.indexOf('function public.tient_le_client()');
  const corps = i < 0 ? '' : schema.slice(i, schema.indexOf('$$;', i));

  verifier('le déclencheur vide le SIRET d’un particulier',
    /type is distinct from 'entreprise'[\s\S]{0,80}new\.siret := null/.test(corps),
    'La garde doit être posée DES DEUX CÔTÉS : l’écran pour que ça se voie, '
    + 'la base pour que ce soit garanti.');

  verifier('…il ne garde que les chiffres du numéro',
    /regexp_replace\(coalesce\(new\.siret[^)]*\), '\[\^0-9\]', ''/.test(corps));

  verifier('…les blancs deviennent `null`, et l’e-mail passe en minuscules',
    /new\.telephone\s*:=\s*nullif\(btrim/.test(corps)
    && /new\.email\s*:=\s*lower\(nullif\(btrim/.test(corps));

  verifier('…et `modifie_le` vient de `clock_timestamp()`, pas du téléphone',
    /new\.modifie_le\s*:=\s*clock_timestamp\(\)/.test(corps),
    'L’horloge d’un téléphone peut mentir, et c’est le seul service que rend '
    + 'cette colonne. `now()` rendrait l’heure de DÉBUT DE TRANSACTION — la '
    + 'leçon du journal d’administration (section 25).');

  verifier('…et il vit AVEC ses colonnes, pas dans `tient_le_profil_pro()`',
    !/function public\.tient_le_profil_pro\(\)[\s\S]{0,3000}new\.siret/.test(schema),
    'Un corps plpgsql n’est pas analysé à sa création : y nommer une colonne '
    + 'née 4 800 lignes plus bas ne dirait RIEN sur une base neuve, et '
    + 'casserait sur une base qui a des lignes à corriger (la leçon du '
    + 'lot J).');
}

verifier('`create or replace trigger`, et aucun `drop trigger`',
  /create or replace trigger trg_tient_le_client/.test(schema),
  'Avec la paire `drop` + `create`, il existe un instant où le déclencheur '
  + 'est absent — et le connecteur Supabase refuse de toute façon tout ordre '
  + 'qui commence par `drop`.');

verifier('le carnet entre dans l’export RGPD',
  /'clients_de_mon_entreprise'[\s\S]{0,200}from public\.clients x where x\.pro_id = auth\.uid\(\)/.test(schema),
  'Ce n’est pas l’article 15 — ces lignes concernent des tiers — mais '
  + 'l’article 28.3.g : mon sous-traitant doit me RENDRE mes données. Sans '
  + 'cela, le carnet est enfermé dans Opus.');

verifier('…et `mes_donnees()` reste la DERNIÈRE fonction du fichier',
  schema.lastIndexOf('clients_de_mon_entreprise') > schema.lastIndexOf('create table if not exists public.clients'),
  'PostgreSQL contrôle le corps d’une fonction SQL à sa CRÉATION : elle ne '
  + 'peut pas nommer une table née plus bas.');

/* ================================================================== */
console.log('\nLES ESSAIS — ils doivent montrer des REFUS, et une donnée qui EXISTE');

verifier('les essais passent par `set local role`, hors de tout bloc `do`',
  /set local role authenticated/.test(essais)
  && /set local request\.jwt\.claim\.sub/.test(essais)
  && !/do \$\$/.test(essais),
  'Dans un bloc `do`, les politiques RLS ne sont PAS appliquées : un essai '
  + 'de sécurité y passe au vert sans rien éprouver (01/10/2026).');

verifier('…ils prouvent d’abord que la donnée EXISTE',
  /vraiment_en_base_attendu_1/.test(essais),
  'Sans ce compte-là, le « 0 » que lit un tiers serait le bon résultat pour '
  + 'la mauvaise raison — le défaut de `essais-section-29.sql`.');

verifier('…un autre pro lit zéro, et un visiteur est REFUSÉ',
  /ce_que_B_lit_attendu_0/i.test(essais)
  && /set local role anon;\s*\n\s*select count\(\*\) from public\.clients;/.test(essais),
  'Deux gardes différentes : pour un professionnel connecté, la politique '
  + 'filtre et rend zéro ; pour un visiteur, il n’y a même plus de droit de '
  + 'table — donc un refus. L’essai doit montrer les deux, parce que ce ne '
  + 'sont pas les mêmes mécanismes.');

verifier('…et la suppression de compte emporte le carnet',
  /preparer_suppression_compte\(\)[\s\S]{0,400}carnet_restant_attendu_0/.test(essais));

/* ================================================================== */
console.log('\nL’ÉCRAN — ce qu’on a appris des huit lots précédents');

verifier('le champ de recherche est son PROPRE composant',
  /function BarreRecherche/.test(ecran) && /useRechercheDifferee/.test(ecran),
  'Un champ qui vit dans l’écran fait re-rendre l’écran à chaque lettre : '
  + '93 ms mesurés contre 29 une fois isolé (29/09). Et le différé SEUL ne '
  + 'sert à rien — 180 ms.');

verifier('la liste règle ses TROIS paramètres',
  /initialNumToRender=\{\d+\}/.test(ecran) && /maxToRenderPerBatch=\{\d+\}/.test(ecran)
  && /windowSize=\{\d+\}/.test(ecran),
  'Une FlatList monte DIX éléments d’un coup par défaut : c’est ce qui '
  + 'bloquait l’iPhone plusieurs secondes au démarrage (lot 4).');

verifier('la gouttière va dans `contentContainerStyle`',
  /contentContainerStyle=\{s\.contenu\}/.test(ecran)
  && /contenu: \{ padding: GOUTTIERE/.test(ecran),
  'Un ScrollView a DEUX boîtes : une marge dans `style` rétrécit AUSSI le '
  + 'cadre qui reçoit le doigt (lot 7).');

verifier('la carte est mémorisée et ne reçoit que des VALEURS',
  /React\.memo\(function CarteClient/.test(ecran)
  && /React\.useCallback\(\(c\) => onOuvrir/.test(ecran),
  '`React.memo` ne sert à rien si on lui passe des fonctions recréées à '
  + 'chaque rendu : chaque carte se croit différente (lot 4).');

verifier('« Appeler » n’existe que s’il y a un numéro',
  /\{!!client\.telephone && \([\s\S]{0,400}tel:\$\{/.test(ecran),
  'Un bouton qui composerait une chaîne vide : on appuie, rien ne se passe, '
  + 'et on croit l’application cassée (lot E).');

verifier('…et c’est aussi vrai sur la fiche',
  /\{!!fiche && \(!!fiche\.telephone \|\| !!fiche\.email\)/.test(forme)
  && /!!fiche\.email && \([\s\S]{0,300}mailto:/.test(forme));

verifier('un échec n’annonce pas une bonne nouvelle',
  /Lecture impossible/.test(ecran) && /action=\{onRecharger/.test(ecran),
  '« Aucun client pour le moment » devant une lecture qui a échoué : la '
  + 'règle de « Pour moi » du 05/10. Et le bouton est un BOUTON.');

/* ================================================================== */
console.log('\nLE FORMULAIRE — plein écran, parce que le clavier enferme une feuille');

verifier('c’est une fenêtre PLEIN ÉCRAN, pas une feuille du bas',
  /transparent=\{false\}/.test(forme) && !/FeuilleBas/.test(forme),
  'Une feuille transparente collée au bas de l’écran se fait recouvrir par '
  + 'le clavier de l’iPhone — le champ ET la croix. L’application a l’air '
  + 'plantée alors qu’elle fonctionne (04/10). Ici la croix est en HAUT.');

verifier('…et la croix est bien en haut, dans l’en-tête',
  /<View style=\{s\.entete\}>[\s\S]{0,400}accessibilityLabel="Fermer"/.test(forme));

verifier('passer en « Particulier » VIDE le SIRET à l’écran',
  /const changerType = \(type\) =>[\s\S]{0,200}siret: type === 'entreprise' \? x\.siret : ''/.test(forme),
  'Le déclencheur le vide de toute façon. Mais si l’écran le laissait '
  + 'affiché, on enregistrerait en croyant l’avoir gardé, et on le '
  + 'retrouverait vide au rechargement sans comprendre pourquoi.');

verifier('…et le champ SIRET n’apparaît que pour une entreprise',
  /\{estEntreprise && \([\s\S]{0,600}SIRET/.test(forme),
  'Le demander à un particulier, c’est demander un numéro qui n’existe '
  + 'pas — et c’est le genre de champ devant lequel on abandonne.');

verifier('les champs portent `maxLength` et le bon clavier',
  /keyboardType="number-pad"[\s\S]{0,200}maxLength=\{5\}/.test(forme)
  && /keyboardType="phone-pad"/.test(forme)
  && /keyboardType="email-address"/.test(forme)
  && /autoCapitalize="none"/.test(forme),
  'Sans `phone-pad`, on tape un numéro sur un clavier de lettres ; sans '
  + '`autoCapitalize="none"`, iOS met une majuscule à l’adresse e-mail.');

verifier('la suppression demande DEUX appuis, et le second le dit',
  /confirmeSuppression \? 'Confirmer la suppression'/.test(forme)
  && /Définitif\./.test(forme),
  'Elle est définitive et la base ne la retient pas : c’est ainsi que le '
  + 'droit à l’effacement s’exerce.');

verifier('…et l’archivage se DÉFAIT',
  /fiche\.archive \? 'Remettre dans ma liste' : 'Archiver'/.test(forme),
  'Un appui par erreur ne doit pas enterrer une fiche — la leçon du bouton '
  + '« Terminer » d’un chantier (lot E).');

/* ================================================================== */
console.log('\nL’ADRESSE SE PROPOSE — et elle ne se remplit pas toute seule');

verifier('le champ adresse propose des suggestions officielles',
  /<ChampVille[\s\S]{0,400}type="rue"/.test(forme),
  'Demandé par le propriétaire le 11/10 : « comme les autres endroits de '
  + 'l’application ». C’était un `<Field>` nu.');

verifier('…en mode `rue`, et pas en mode `address`',
  !/<ChampVille[\s\S]{0,400}type="address"/.test(forme),
  'Le mode `address` garde les COMMUNES, et le code postal d’une commune '
  + 'est le plus petit de cette commune — Paris rend 75001. Posé sur une '
  + 'facture, c’est faux à chaque fois.');

verifier('…un appui remplit les TROIS cases',
  /adresse: lieu\.rue \|\| lieu\.affichage/.test(forme)
  && /codePostal: lieu\.codePostal \|\| x\.codePostal/.test(forme)
  && /ville: lieu\.ville \|\| x\.ville/.test(forme),
  'La rue ici, le code postal et la ville juste en dessous. Et le `||` '
  + 'n’est pas décoratif : une frappe libre ne rend que `affichage`, donc '
  + 'sans lui le code postal déjà saisi s’effacerait sous les doigts de '
  + 'celui qui corrige sa rue.');

verifier('…et la longueur maximale voyage jusqu’au champ',
  /maxLength=\{LONGUEUR_MAX\.adresse\}/.test(forme),
  '`validerClient()` REFUSE au-delà de 200 caractères au lieu de '
  + 'tronquer : un refus pour une longueur qu’aucun compteur n’annonçait '
  + 'est le genre de message devant lequel on abandonne.');

/* ================================================================== */
console.log('\nLE CLAVIER NE RECOUVRE PLUS LES CHAMPS DU BAS');

verifier('le conteneur porte la brique du clavier',
  /\{\.\.\.CLAVIER\}/.test(forme) && /from '\.\.\/lib\/clavier'/.test(forme),
  'Signalé par le propriétaire le 11/10 depuis son iPhone : « le clavier '
  + 'bloque un peu les champs du bas du formulaire ». Voir '
  + 'src/lib/clavier.js, et `npm run verifier-feuilles`.');

verifier('…et « Suivant » va quelque part',
  /onSubmitEditing=\{\(\) => \{[\s\S]{0,200}\.focus\(\)/.test(forme)
  && /blurOnSubmit=\{false\}/.test(forme),
  'Les huit champs portaient `returnKeyType="next"` et AUCUN '
  + '`onSubmitEditing` : la touche affichait « Suivant » et ne faisait que '
  + 'refermer le clavier.');

verifier('…et aucun clavier numérique ne promet un « Suivant » qu’il ne peut pas afficher',
  !/keyboardType="(number-pad|phone-pad)"[^>]{0,200}returnKeyType/.test(forme),
  'Un clavier `number-pad` ou `phone-pad` d’iOS n’a PAS de touche retour. '
  + 'Le SIRET, le téléphone et le code postal ne peuvent donc pas '
  + 'enchaîner, quoi qu’on écrive.');

verifier('l’encre du rouge brique vient de `surFond()`, pas d’une couleur écrite',
  /color: surFond\(C\.bad\)/.test(forme) && !/color: '#fff'/.test(forme),
  'Mesuré : le blanc sur #B4432B donne 5,56 : 1 et l’encre sombre 3,11. '
  + '`surFond()` tranche par le calcul (lot 5).');

/* ================================================================== */
console.log('\nQUI ÉCRIT, QUI LIT — les deux sens du même contrôle');

verifier('l’API sait créer, modifier, archiver et supprimer',
  /export const mesClients/.test(api) && /export const enregistrerClient/.test(api)
  && /export const archiverClient/.test(api) && /export const supprimerClient/.test(api));

verifier('…et la forme à DEUX FONCTIONS NOMMÉES, pas un ternaire asynchrone',
  /async function enregistrerClientDemo/.test(api)
  && /async function enregistrerClientSupabase/.test(api)
  && /export const enregistrerClient = hasSupabase/.test(api),
  'Le piège Metro : `async (o = {}) => { bloc }` dans la première branche '
  + 'd’un ternaire fait échouer la construction sans indiquer la ligne.');

verifier('`modifie_le` n’est jamais envoyée par l’application',
  !/modifie_le:/.test(api),
  'C’est la base qui la pose. L’envoyer d’ici la rendrait dépendante de '
  + 'l’horloge du téléphone.');

verifier('QUELQU’UN LIT le carnet : il a son écran, et une porte pour y aller',
  /screen === 'clients'/.test(appli) && /ClientsScreen/.test(appli)
  && /onClients=\{canPublish \? ouvrirCarnet : null\}/.test(appli),
  'Une table qu’on écrit sans jamais la lire est une panne silencieuse '
  + '(01/10). Et un particulier n’a pas de clients : la rangée n’existe pas '
  + 'pour lui.');

verifier('…et QUELQU’UN L’ÉCRIT depuis ce qu’Opus sait déjà',
  /onAjouterClient=\{ajouterClientDepuisDemande\}/.test(appli)
  && /Ajouter à mes clients/.test(readFileSync('src/screens/DemandesRecuesScreen.js', 'utf8')),
  'L’autre sens du même contrôle (04/10, les photos d’annonce) : chercher '
  + 'qui ÉCRIT ce qu’on lit. Sans cette porte, le carnet serait un '
  + 'formulaire vide devant lequel on renonce.');

verifier('la fiche s’ouvre avec une CLÉ qui change',
  /key=\{`fiche-client-\$\{cleFiche\}`\}/.test(appli),
  'Le formulaire lit son état de départ au MONTAGE : sans cette clé, ouvrir '
  + 'une deuxième fiche afficherait la première (le piège de `defaut` sur '
  + '`ChampLocal`, lot I).');

verifier('…et les crochets du carnet sont AVANT les sorties anticipées',
  appli.indexOf('const [clients, setClients] = useState') < appli.indexOf('if (demarrage) {')
  && appli.indexOf('const [clients, setClients] = useState') > 0,
  'Un `useState` sous un `return` anticipé fait que React n’appelle plus le '
  + 'même nombre de crochets d’un rendu à l’autre : l’écran casserait au '
  + 'moment précis où les données arrivent (05/10).');

verifier('RIEN du carnet ne part dans `pros[]` ni dans une notification',
  !/clients/.test(api.slice(api.indexOf('function rowToPro'), api.indexOf('function rowToPro') + 2500))
  && !/clients/i.test(readFileSync('src/lib/notifications.js', 'utf8')),
  'C’est la première table d’Opus dont le contenu concerne des tiers sans '
  + 'compte. Le titre d’un chantier publiait un nom de famille sans le '
  + 'vouloir (section 36.2) : ici, rien ne sort.');

/* ================================================================== */
console.log('\nLA DÉMONSTRATION — le mécanisme doit VIVRE sans fichier `.env`');

{
  const monPro = Object.keys(proProfiles)[0];
  /* ON REFAIT LE CALCUL sur les données de démonstration au lieu de lire le
     code : c'est le piège des trois `===` du lot E — `Object.keys()` rend
     TOUJOURS une chaîne, les fiches d'exemple portent un nombre, et un
     `===` strict rendait une liste vide sans que rien ne le dise. */
  const miens = initialClients.filter((c) => String(c.proId) === String(monPro));
  verifier('les fiches de démonstration sont bien les MIENNES',
    miens.length >= 3,
    `Trouvé ${miens.length} fiche(s) pour le pro « ${monPro} » sur `
    + `${initialClients.length}. Un \`===\` strict entre un nombre et une `
    + 'chaîne rendrait zéro, et le carnet paraîtrait vide.');

  verifier('…dont un particulier, une entreprise AVEC SIRET, et un archivé',
    miens.some((c) => c.type === 'particulier' && !c.siret)
    && miens.some((c) => c.type === 'entreprise' && c.siret)
    && miens.some((c) => c.archive),
    'Sans l’archivé, la pastille « Archivés » afficherait toujours « (0) » et '
    + 'personne ne saurait à quoi elle sert.');

  verifier('…et elles passent leur propre validation',
    miens.every((c) => validerClient({ ...c, codePostal: c.codePostal }).ok),
    'Une donnée d’exemple que le formulaire refuserait est le pire des '
    + 'défauts : on la corrige en croyant corriger l’application.');

  verifier('…et aucune n’a de nom en doublon par accident',
    new Set(miens.map((c) => nomNormalise(c.nom))).size === miens.length,
    'Sinon l’avertissement « vous avez déjà un client de ce nom » s’afficherait '
    + 'en démonstration sans qu’on l’ait cherché.');
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} contrôle(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Le carnet de clients : privé, nommé, et quelqu’un le lit.\n');
