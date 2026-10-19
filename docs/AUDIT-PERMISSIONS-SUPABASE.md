# Permissions Supabase — diagnostic et verdict (19/10/2026)

> **Décision du propriétaire, le 19/10/2026 : « les deux pièces »** — un
> second connecteur Supabase en lecture seule (`SupabaseLecture`), plus des
> règles dans `.claude/settings.json` (autoriser les lectures nommées une par
> une, « toujours demander » sur `execute_sql` et tous les outils d'écriture du
> connecteur d'origine). Rien n'est encore changé : le connecteur s'ajoute dans
> claude.ai, et les règles s'écrivent dans une NOUVELLE session, après avoir
> relevé le vrai nom des outils. Voir CLAUDE.md, « Les permissions Supabase ».
>
> Les « sources » de ce document renvoient à la documentation officielle de
> Claude Code (code.claude.com/docs : permissions, permission-modes, mcp, hooks),
> à la documentation Supabase (guides/getting-started/mcp) et au code du serveur
> `supabase-community/supabase-mcp` ; les noms de fichiers de notes qui y
> figurent (cc-*.md, base.md…) étaient des notes de travail de la session, non
> conservées.


**Rien n'a été modifié** : aucun fichier du dépôt, aucune permission, aucun réglage,
aucune écriture sur la vraie base. Les essais ci-dessous tournent sur PGlite
(pur PostgreSQL en mémoire, jetable) et sur la lecture du code, des journaux de
session et de la documentation. Chaque affirmation porte sa source.

---

## 0. Ce que je peux ÉTABLIR en plus des trois relevés (depuis cette session même)

1. **Le vrai nom de l'outil est `mcp__Supabase__execute_sql`** (et
   `mcp__Supabase__list_tables`, etc.). Ce n'est pas `mcp__claude_ai_Supabase__…`.
   Source : la liste des outils différés du prompt système de CETTE session les
   nomme textuellement ainsi, et le journal de session montre 67 appels
   `mcp__Supabase__execute_sql`. Cela LÈVE le « non établi » du relevé Claude Code
   sur le nom.

2. **Il n'y a ni réglage `ask` d'organisation ni marqueur
   `requiresUserInteraction` sur `execute_sql`.** Preuve comportementale : cette
   session tourne en mode `auto` (journal : `permissionMode:"auto"`, 79 entrées)
   et les 67 appels `execute_sql` sont passés **sans aucune confirmation** (0
   erreur de permission, 0 refus). Or la doc dit qu'un `ask` d'organisation ou un
   `requiresUserInteraction` force une invite « même en auto ». Donc ni l'un ni
   l'autre n'est posé sur `execute_sql`.
   Source : journal de session ; cc-mcp.md §« Organization controls » / §« Require
   approval for a specific tool » ; cc-permission-modes §« Actions no mode
   auto-approves ».

3. **D'où vient alors l'invite que voit le propriétaire.** Ce n'est pas le
   classifieur du mode auto (il autorise ou bloque, il ne demande pas), ni une
   garde Supabase pour un SELECT (l'élicitation du serveur ne se déclenche que
   sur du SQL destructif, et un SELECT n'en est pas), ni un `ask`
   d'organisation (écarté ci-dessus). **C'est la boîte de dialogue de permission
   de Claude Code pour l'outil MCP `execute_sql`, montrée parce qu'(a) AUCUNE
   règle `allow` ne le nomme — le dépôt n'a aucun dossier `.claude/`, les
   réglages lanceur n'autorisent que `Skill` — et (b) les sessions interactives
   du propriétaire tournent dans un mode qui demande pour un outil sans règle
   (Manuel/`default`), tandis que cette session-ci, en `auto`, ne demandait pas.**
   La cause du « y compris pour un SELECT » est donc : `execute_sql` est
   indivisible, Claude Code ne distingue pas un SELECT d'une écriture, et sans
   règle `allow` + hors mode auto il demande pour l'outil.
   Source : relevé base.md (« les 17 appels… sont passés sans demande ») ;
   cc-permission-modes §« How the classifier evaluates actions » ; absence de
   `.claude/` (ls : « No such file or directory ») ; launcher-settings.json
   (`permissions.allow = ["Skill"]`).

---

## 1. `execute_sql` est INDIVISIBLE pour les règles de permission — réponse nette

OUI. Un fichier de réglages ne peut pas filtrer sur le CONTENU de l'argument
`query` d'un outil MCP :

- une règle `mcp__…` qui contient des parenthèses est **ignorée au chargement**,
  avec un avertissement ; le seul filtre par paramètre MCP est `--disallowedTools`,
  en `deny` seulement. Source : cc-permissions §« Match by input parameter ».
- La distinction lecture/écriture à l'intérieur d'`execute_sql` ne peut donc venir
  que de TROIS endroits hors règles : un hook `PreToolUse` qui lit `tool_input.query`
  (option B) ; le classifieur du mode auto (jugement de modèle, non déterministe) ;
  ou un rôle Postgres en lecture seule côté Supabase (option C).

Et l'ordre des règles : **deny > ask > allow**, première correspondance gagne ;
une règle `ask` l'emporte sur une `allow` plus précise et **force l'invite même en
auto**. Un `allow` à joker n'est accepté qu'après le préfixe littéral
`mcp__<serveur>__` ; `mcp__*` en allow est ignoré avec avertissement.
Source : cc-permissions §« Manage permissions », §« Tool name wildcards ».

---

## 2. Attaques éprouvées (PGlite, PostgreSQL pur)

Transaction RÉELLEMENT en lecture seule (`begin read only`) :

| forme | résultat |
|---|---|
| `select` simple | OK |
| `with d as (delete … returning …) select * from d` | **refusé** : « cannot execute SELECT in a read-only transaction » |
| `select fonction_qui_ecrit()` | **refusé** : « cannot execute INSERT in a read-only transaction » |
| `begin read only; set transaction read write; insert …` | **ÉCRIT** (1 ligne) |

Sources : essais `permissions/attaque/pglite/t.mjs` et `t2.mjs`.

Ce que ça prouve :
- **Une transaction effectivement en lecture seule bloque** le `WITH … DELETE …
  RETURNING`, le `SELECT … INTO`, et l'écriture d'une fonction appelée dans un
  SELECT (le garde `PreventCommandIfReadOnly` se déclenche au moment de l'écriture,
  quelle que soit la nature de la fonction).
- **Mais `default_transaction_read_only` n'est qu'un DÉFAUT** : `set transaction
  read write` en première instruction le défait. Ce qui empêche vraiment d'écrire,
  ce sont les DROITS du rôle. C'est exactement le constat du relevé « vraie base ».

---

## 3. Les quatre options

### (A) Autoriser par NOM les outils de lecture ; `ask` explicite sur les outils qui écrivent

**Changements exacts** — créer `/home/user/opus-project/.claude/settings.json`,
le committer et le pousser (lu par une PROCHAINE session en nuage à un seul dépôt ;
pas par la session en cours) :

```json
{
  "permissions": {
    "allow": [
      "mcp__Supabase__list_tables",
      "mcp__Supabase__list_extensions",
      "mcp__Supabase__list_migrations",
      "mcp__Supabase__query_logs",
      "mcp__Supabase__get_advisors",
      "mcp__Supabase__search_docs",
      "mcp__Supabase__get_project_url",
      "mcp__Supabase__get_publishable_keys",
      "mcp__Supabase__generate_typescript_types",
      "mcp__Supabase__list_edge_functions",
      "mcp__Supabase__get_edge_function",
      "mcp__Supabase__list_storage_buckets",
      "mcp__Supabase__get_storage_config",
      "mcp__Supabase__list_projects",
      "mcp__Supabase__get_project",
      "mcp__Supabase__list_organizations",
      "mcp__Supabase__get_organization",
      "mcp__Supabase__list_branches"
    ],
    "ask": [
      "mcp__Supabase__execute_sql",
      "mcp__Supabase__apply_migration",
      "mcp__Supabase__deploy_edge_function",
      "mcp__Supabase__create_edge_function_secret",
      "mcp__Supabase__update_storage_config",
      "mcp__Supabase__create_branch",
      "mcp__Supabase__delete_branch",
      "mcp__Supabase__merge_branch",
      "mcp__Supabase__reset_branch",
      "mcp__Supabase__rebase_branch",
      "mcp__Supabase__create_project",
      "mcp__Supabase__pause_project",
      "mcp__Supabase__restore_project"
    ]
  }
}
```

**Ce qui passe sans confirmation** : le schéma (`list_tables`, verbose = colonnes +
clés primaires + clés étrangères, donc les relations), les extensions, les
migrations, les avis de sécurité (`get_advisors`, qui porte les alertes RLS), les
journaux (`query_logs`), les buckets de stockage et leur config, les fonctions
Edge, `search_docs`.

**Ce qui demande toujours** : le **SELECT** (c'est `execute_sql`) et les **corps de
politiques RLS** (ils se lisent par `execute_sql` sur `pg_policies` ; `list_tables`
donne `rls_enabled` mais pas le texte des politiques). Et toutes les écritures.

**Failles** : aucune nouvelle — cette option ne touche JAMAIS `execute_sql`, donc
aucune écriture ne peut s'y glisser. Le `ask` sur `execute_sql`/`apply_migration`
est une ceinture (il l'emporte sur une `allow` posée plus tard). À NE PAS faire :
`mcp__Supabase` ou `mcp__Supabase__*` en allow — ça inclurait `execute_sql` et
`apply_migration`. À savoir : `get_edge_function` rend du CODE, `query_logs` rend
des journaux contenant des adresses IP — lectures, mais pas anodines, désormais
auto-approuvées.

**Verdict : SÛRE.** Mais elle ne couvre PAS le cœur de la demande (SELECT et RLS
restent confirmés). C'est la limite honnête d'une solution par fichier de
réglages seul, puisque `execute_sql` est indivisible.

### (B) Un hook `PreToolUse` qui lit la requête et autorise ce qui « semble » en lecture

**Changements exacts** : committer dans `.claude/settings.json` un hook
`PreToolUse`, matcher `^mcp__Supabase__execute_sql$` (expression régulière), plus un
script qui échoue FERMÉ (`ask` par défaut) et ne répond `allow` que pour une
requête d'une seule instruction, sans `;`, commençant par SELECT/WITH…SELECT, sans
mot-clé d'écriture, sans `INTO`, sans appel de fonction, sans commentaire.

**Ce qui passerait sans confirmation** : les SELECT jugés « purs » par le parseur.

**Ce qui demande** : tout le reste.

**Failles (prouvées ou plausibles)** :
- C'est un parseur SQL d'autorisation = exactement la « frontière par
  contrainte d'arguments » que la doc Claude Code juge FRAGILE et déconseille.
- Le hook tourne contre le connecteur ACTUEL, qui s'exécute en **`postgres` avec
  tous les droits d'écriture** (relevé vraie base). Une faille du parseur = une
  écriture silencieuse. Vecteurs concrets, tous « commençant par SELECT/WITH » :
  `SELECT … INTO nouvelle_table` (crée une table), `SELECT fonction_qui_ecrit()`
  (le connecteur postgres a le droit), `WITH d AS (DELETE … RETURNING …) SELECT …`,
  commentaires `/* */` et sauts de ligne, instructions empilées mal découpées.
- Le champ `mcp_server` des hooks n'existe qu'à partir de 2.1.274 ; la session est
  en 2.1.270 (matcher par nom, donc tolérable). Qu'un `allow` de hook contourne le
  classifieur en auto : NON ÉTABLI (sans effet ici, le classifieur autorise déjà
  les lectures). `updatedInput` pour un outil MCP : NON ÉTABLI.

**Verdict : À ÉCARTER** comme mécanisme principal. Acceptable seulement EMPILÉ sur
(C), où même une faille du parseur ne peut rien écrire — mais alors le parseur est
redondant.

### (C) Un SECOND connecteur Supabase en lecture seule ; le connecteur actuel garde ses confirmations

**Changements exacts** — aucune modification du dépôt par moi. Le propriétaire, dans
claude.ai → Customize → Connectors → Add custom connector :
- nom ASCII sans espace, p. ex. `SupabaseLecture` ;
- URL
  `https://mcp.supabase.com/mcp?project_ref=lqzqdoiiqgqapqldrewg&read_only=true&features=database,debugging,development,docs,functions,storage` ;
- OAuth (enregistrement dynamique), **sans** `skip_elicitations`.

Puis, dans une NOUVELLE session en nuage à un seul dépôt, committer un
`.claude/settings.json` qui autorise les outils de ce connecteur, nommés par
leur vrai préfixe (à vérifier par `/mcp` dans la nouvelle session, probablement
`mcp__SupabaseLecture__…`), chacun listé plutôt qu'un joker de serveur :

```json
{ "permissions": { "allow": [
  "mcp__SupabaseLecture__execute_sql",
  "mcp__SupabaseLecture__list_tables",
  "mcp__SupabaseLecture__list_migrations",
  "mcp__SupabaseLecture__list_extensions",
  "mcp__SupabaseLecture__query_logs",
  "mcp__SupabaseLecture__get_advisors",
  "mcp__SupabaseLecture__list_storage_buckets",
  "mcp__SupabaseLecture__get_storage_config",
  "mcp__SupabaseLecture__list_edge_functions",
  "mcp__SupabaseLecture__get_edge_function",
  "mcp__SupabaseLecture__search_docs"
] } }
```

Le connecteur `Supabase` d'origine reste tel quel : son `execute_sql` et son
`apply_migration` gardent l'invite de Claude Code pour toute écriture.

**Ce qui passe sans confirmation** : TOUTES les lectures par le connecteur de
lecture, **y compris `mcp__SupabaseLecture__execute_sql`** — en `read_only`, cet
outil se déclare `readOnlyHint: true`, s'exécute via l'API de gestion avec
`read_only:true`, refuse les écritures et ne déclenche aucune élicitation. Donc le
SELECT, `pg_policies` (corps des RLS), le schéma, les métadonnées, les relations,
les buckets — enfin couverts.
Sources : database-operation-tools.ts:258,270-277,468-473,551,629 ;
tool-schemas.ts:149-162 ; server.ts:346-352 ; essai server.test.ts:170-200.

**Ce qui demande toujours** : chaque écriture, par le connecteur d'origine.

**Failles** :
- **Divulgation (réelle)** : le rôle de lecture seule LIT TOUT, RLS ignorée
  (`bypassrls` + `pg_read_all_data`) — `auth.users` (mot de passe chiffré,
  `recovery_token`, `refresh_tokens`), `storage`, le carnet de clients, les
  demandes. Auto-approuver les lectures retire le regard humain sur lequel
  reposait « on interroge la FORME de la ligne, jamais son contenu ».
- **Écriture (contournement)** : sur la vraie base AUJOURD'HUI, impossible — 0
  fonction SECURITY DEFINER exécutable par `supabase_read_only_user`, 0 droit
  d'écriture, ni `dblink` ni `pg_net` (relevé vraie base). PGlite confirme que le
  `WITH…DELETE` et le `SELECT`-de-fonction-qui-écrit sont bloqués en transaction
  réellement lecture seule. **Fragile** : la garantie tient au `revoke … from
  public` écrit à la main pour CHAQUE fonction definer de `schema.sql` (seul le
  balayage des déclencheurs est automatique) ; une future fonction definer qui
  écrit, laissée exécutable par PUBLIC, deviendrait une porte si l'API passe le
  texte sans le forcer en READ ONLY. **NON ÉTABLI** : si l'API de gestion
  enveloppe chaque instruction en READ ONLY ou se contente du défaut de rôle (donc
  si `set transaction read write` est atteignable par ce chemin).
- **Montage** : NON ÉTABLI que claude.ai accepte une URL de connecteur avec
  paramètres, qu'on puisse ajouter Supabase deux fois, et le nom exact des outils
  (à vérifier par `/mcp`). Le proxy en nuage réécrit l'URL des connecteurs — sans
  effet ici, on filtre par NOM d'outil, pas par URL. Exige une NOUVELLE session.

**Verdict : SÛRE AVEC RÉSERVE.** Seule option qui répond vraiment au besoin (SELECT
+ RLS sans confirmation) tout en gardant les écritures sous validation humaine, et
dont la sécurité d'écriture repose sur un RÔLE Postgres (pas sur une analyse de
texte) — montage que Supabase recommande lui-même pour un usage sans surveillance.
Réserves : lecture RLS ignorée (divulgation), et un NON ÉTABLI sur l'enforcement de
l'API plus une dépendance fragile aux futurs definer.

### (D) Autoriser `execute_sql` tout entier (connecteur actuel)

Le connecteur actuel tourne en `postgres`, tous droits. `execute_sql` est
indivisible. L'élicitation du serveur ne voit que DROP/DELETE/TRUNCATE/UPDATE sans
WHERE/ALTER DROP COLUMN. Donc INSERT, UPDATE … WHERE, CREATE, ALTER, GRANT/REVOKE,
`create or replace function` passeraient **sans aucun humain** — exactement ce que
le propriétaire interdit.
Source : destructive-sql.ts + essai du relevé Supabase ; relevé vraie base.

**Verdict : À ÉCARTER.** Une requête destructive passerait.

---

## 4. Recommandation

1. **(C) connecteur de lecture seule distinct** comme vraie réponse : il seul rend
   le SELECT et les RLS automatiques tout en laissant TOUTE écriture confirmée par
   le connecteur d'origine, et la barrière d'écriture est un rôle, pas un parseur.
2. **(A) en ceinture** sur le connecteur d'origine : `ask` explicite sur
   `execute_sql`/`apply_migration` et les outils d'écriture, et `allow` sur les
   outils de lecture nommés — belt-and-braces si jamais une allow large était
   ajoutée un jour.
3. **Discipline CLAUDE.md** : lire par le connecteur de lecture, écrire par l'autre,
   et NE JAMAIS rendre le CONTENU des lignes de tiers (clients, demandes, auth) —
   le rôle de lecture ignore la RLS.
4. **Vérification du propriétaire AVANT de s'y fier** (lecture seule, avec son
   accord) : quelles fonctions SECURITY DEFINER de `public` sont exécutables par
   `supabase_read_only_user` — réponse attendue aujourd'hui : zéro.
5. **Si le propriétaire ne veut pas d'un second connecteur** : (A) seule, en
   sachant que SELECT et corps de RLS continueront de demander. C'est la limite
   d'une solution par réglages seuls, `execute_sql` étant indivisible.
6. **Jamais** : (D), ni `skip_elicitations`, ni un hook `Elicitation`
   auto-répondeur, ni (B) comme barrière unique.

**Ne rien changer avant l'accord du propriétaire** (c'est sa consigne), et le
changement du fichier `.claude/settings.json` est de toute façon un chemin protégé :
son écriture passera par une validation.

---

## 5. Ce qui reste NON ÉTABLI

- Le MODE exact des sessions interactives du propriétaire (celui qui déclenche
  l'invite) ; cette session en `auto` n'en voit aucune.
- L'enforcement précis de `read_only` par l'API de gestion Supabase (enveloppe
  READ ONLY par instruction, ou simple rôle), donc si `set transaction read write`
  est atteignable par ce chemin.
- Que claude.ai accepte une URL de connecteur personnalisé AVEC paramètres, qu'on
  puisse ajouter Supabase deux fois, et le nom exact des outils du second
  connecteur (à relever par `/mcp` dans la nouvelle session).
- Si une règle `allow` committée est soumise à une étape de confiance en session en
  nuage (la doc la liste comme appliquée « dans une session à un seul dépôt », sans
  parler de dialogue de confiance en nuage ; le relevé la laissait « non établi »).
- Qu'un `allow` de hook contourne le classifieur du mode auto ; le support de
  `updatedInput` pour un outil MCP ; les versions d'introduction de
  `permissionDecision`/`updatedInput` au regard du 2.1.270 de la session.
