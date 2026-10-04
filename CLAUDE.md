# Opus-Project — règles du projet

Réseau social des professionnels du bâtiment. React Native + Expo (SDK 57),
JavaScript, Supabase. Le propriétaire du projet **débute en développement** :
tout ce qui est écrit pour lui — messages d'erreur, README, commentaires —
doit être en **français** et expliquer le pourquoi, pas seulement le comment.

## La règle qui a déjà coûté cher

**Le mode démo masque toutes les erreurs de base de données.**

Sans fichier `.env`, `src/lib/api.js` remplace chaque écriture par `noop`.
Un écran peut donc paraître parfait dans les tests pendant que la base
refuserait l'enregistrement.

Conséquence, sans exception :

> Toute écriture nouvelle ou modifiée doit être **insérée pour de vrai dans
> PostgreSQL** avant d'être annoncée comme fonctionnelle.

C'est précisément ce qui a manqué le jour où le format `montage` a été ajouté
à l'application sans être ajouté à la contrainte `posts_type_check` : la base
refusait chaque montage, et les essais en mode démo n'y voyaient rien.

### L'application peut prendre de l'avance sur la base

Écrire `schema.sql` ne l'applique nulle part. Le propriétaire doit le rejouer
dans Supabase → SQL Editor, et il ne le fait pas forcément : six commits ont
ainsi tourné contre une base qui ignorait `metiers`, `budget`, `annonces_pro`
et `metier_demandes`. L'enregistrement du profil échouait en silence, la Place
des pros restait vide.

**Après toute modification de `schema.sql`, vérifier l'état RÉEL avec le
connecteur Supabase** — une requête sur `information_schema` suffit — et
appliquer la migration soi-même plutôt que de compter sur un copier-coller.

Pour reproduire fidèlement une panne, la bonne base de départ n'est pas
`schema.sql` d'aujourd'hui mais **celle de la version que le propriétaire a
réellement appliquée** (`git show <commit>:supabase/schema.sql`).

### `await import(...)` : interdit dans `src/`, et ça a coûté deux incidents

Constaté le 01/10/2026. « **Envoi de la photo de profil impossible :
cannot read property 'reload' of undefined** », au moment d'enregistrer
une photo de profil ou une bannière, depuis l'iPhone.

`reload` n'existe nulle part dans ce projet. Il vient du **mécanisme de
découpage de paquet** d'Expo : `expo/src/async-require/hmrUtils.native.ts`
contient `DevSettings.reload('Bundle Splitting – Metro disconnected')`.

**Ce qu'un `await import()` fait vraiment sur téléphone** : Metro découpe
le paquet et va chercher le morceau manquant **auprès du serveur de
développement, au moment où la ligne s'exécute**. Tant que la liaison
tient, personne ne voit la différence. Le jour où elle a bougé —
téléphone en veille, Wi-Fi qui change, serveur redémarré —, la ligne
échoue sur une erreur qui ne parle ni du fichier ni du réseau.

**Mesuré**, sur le paquet de développement iOS servi par Metro
(`/index.bundle?platform=ios&dev=true`), les deux versions construites
chacune sur un serveur neuf :

| | occurrences de `asyncRequire` |
|---|---|
| avec les 7 `await import()` | **15** |
| avec les mêmes imports en haut | **0** |

La machinerie entre dans le paquet à cause de ces sept lignes, et en sort
quand on les remonte. L'export de PRODUCTION, lui, ne montre rien : il
range tout dans un seul fichier. Il ne faut donc pas chercher là.

> **Aucun `await import(...)` dans `src/`.** `npm run verifier-imports`
> le refuse. Ces modules sont des dépendances directes : ils sont dans le
> paquet de toute façon, les charger en haut ne coûte rien.

**Ce que ça explique en plus** : l'épisode du 29/09/2026, resté sans
explication — « Enregistrement impossible » sur la photo de profil, puis
plus rien après un `npm start -- --clear`, sans qu'aucune correction
n'ait touché à l'envoi. Un paquet redécoupé proprement, et le morceau
redevient joignable. CLAUDE.md attribuait alors la guérison à « un ancien
paquet resté en mémoire » ; c'était la bonne intuition, pas la bonne
cause.

Ce qui n'est **pas** prouvé, et doit être dit : je n'ai pas pu reproduire
l'erreur elle-même, faute d'iPhone et d'Expo Go dans le conteneur. Ce qui
est mesuré, c'est la présence de la machinerie, et sa disparition.

Et pour la prochaine fois : `envoiTelephone` **nomme chaque étape**
(`[lecture du fichier]`, `[session]`, `[envoi vers Supabase]`). Sur un
défaut qu'on ne peut pas reproduire, le message de l'utilisateur est la
seule donnée dont on dispose.

### Le piège Metro qui a coûté une heure : asynchrone + ternaire

Cette forme **fait échouer la construction**, sans indiquer ni la ligne ni la
cause :

```js
export const x = !hasSupabase
  ? async (options = {}) => { … }   // <- paramètre par défaut ET corps en bloc
  : async (options = {}) => { … };
```

    SyntaxError: src/lib/api.js: Property id of VariableDeclarator expected
    node to be of a type ["LVal","VoidPattern"] but instead got
    "AssignmentExpression"

Le même fichier passe pourtant **avec Babel seul**, y compris avec le
préréglage d'Expo et le greffon `react-native-worklets` : l'erreur ne sort
que de Metro. Trouvé par dichotomie — `async (o = {}) => (expression)`
construit, `async (o = {}) => { bloc }` dans la PREMIÈRE branche d'un
ternaire, non.

**La parade : deux fonctions nommées, et le choix à la fin.**

```js
async function xDemo(options = {}) { … }
async function xSupabase(options = {}) { … }
export const x = hasSupabase ? xSupabase : xDemo;
```

C'est de toute façon plus lisible. Le reste du fichier garde sa forme
`!hasSupabase ? noop : async () => {…}` — elle n'a pas de paramètre par
défaut, donc elle ne déclenche rien.

### `npm audit fix --force` DÉTRUIRAIT le projet

Le propriétaire lance `npm install`, lit « 26 vulnerabilities » en rouge,
et npm lui propose deux commandes. **La seconde détruirait le projet.**

**Le nombre monte tout seul, et ça ne veut rien dire :**

| | alertes | ce que `--force` installerait |
|---|---|---|
| 30/09/2026 | 11 | expo@46.0.21 |
| **04/10/2026** | **26** (19 hautes) | **expo@44.0.6** |

Pas une ligne du projet n'a changé entre les deux : ce sont de NOUVEAUX
avis publiés sur des paquets déjà installés. Et la « correction » proposée
empire — Expo 44 est une version de 2021.

> **La bonne question n'est jamais « combien ? ».** C'est : **est-ce que ce
> paquet part sur le téléphone ?**

Les 26 alertes du 04/10 se ramènent à **trois causes**, et les trois
vivent dans les outils d'Expo qui tournent sur l'ORDINATEUR pendant
`npm start` :

```
expo > @expo/cli > @expo/code-signing-certificates > node-forge
expo > @expo/cli > @expo/metro-file-map > micromatch > braces
expo > @expo/cli > node-forge
expo > @expo/config-plugins > xcode > uuid
```

Aucune n'entre dans l'application installée. `@expo/cli`, c'est le serveur
de développement et le surveillant de fichiers ; `xcode` ne sert qu'au
`prebuild`, que ce projet ne fait jamais puisqu'il tourne dans Expo Go.

**Et il n'y a RIEN à faire** — mesuré le 04/10 : `npm audit fix` tout court
ne corrige **aucune** des 26 (`--dry-run` ne propose rien), parce qu'elles
demandent toutes un changement cassant. Expo est déjà à la dernière version
publiée (57.0.26) et `npx expo install --check` répond « up to date ». La
seule action possible est destructrice.

> **`npm audit fix` tout court : sans danger, mais inutile aujourd'hui.**
> Le 30/09 il corrigeait une ligne du verrou ; le 04/10 il ne corrige plus
> rien.
>
> **`npm audit fix --force` : JAMAIS.** Ces alertes se corrigeront quand
> Expo mettra ses propres outils à jour, pas avant.

`npm run verifier-dependances` tient les deux bouts, et il a été éprouvé en
simulant la panne :

1. **Expo n'a pas été ramené en arrière** — le garde-fou contre un
   `--force` lancé un jour de fatigue. Il tourne même sans réseau ;
2. **aucune alerte ne touche un paquet qui part sur le téléphone.** Tant
   que tout passe par `@expo/cli` ou `@expo/config-plugins`, il n'y a rien
   à faire. Le jour où une alerte apparaît ailleurs — `react-native`,
   `@supabase/supabase-js`, `expo-image` —, il rougit, **et là il faut
   agir**.

### Les versions de paquets Expo se désalignent toutes seules

`npm install` d'un nouveau paquet peut laisser les autres en arrière.
`npx expo install --check` le dit, `--fix` le répare. Un `expo-image-picker`
en retard sur la version attendue par Expo Go casse le choix des photos sans
qu'aucune ligne de code n'ait changé. **À lancer après chaque ajout de
dépendance.**

### En particulier : les contraintes `check (... in (...))`

`schema.sql` en contient une dizaine (types de publication, statuts de devis,
métiers d'urgence, statuts de vérification…). **Toute nouvelle valeur envoyée
par l'application doit être ajoutée à la contrainte correspondante**, et sur
une base déjà en place il faut la refaire explicitement :

```sql
alter table public.x drop constraint if exists x_champ_check;
alter table public.x add constraint x_champ_check check (champ in (...));
```

`alter table ... add column if not exists` ne touche pas aux contraintes.

## Ce qu'il reste à faire

`docs/A-FAIRE.md` tient la liste, par ordre de priorité. **À relire au début
d'une session qui parle de la suite du projet**, et à mettre à jour quand un
point est traité.

### Le cahier des charges du propriétaire (remis le 29/09/2026)

`docs/CAHIER-DES-CHARGES.md` — sa vision complète, en 28 sections et
12 phases : logiciel de gestion du bâtiment piloté par un agent IA, dont le
réseau social est le module 9. L'original PDF est à côté et **fait foi**.

`docs/LECTURE-CAHIER-DES-CHARGES.md` — mon analyse, à ne pas confondre avec
le document. **À lire avant de construire quoi que ce soit de nouveau.**
Trois points en sortent, à ne pas redécouvrir :

1. **Un compte = un artisan = UNE ENTREPRISE.** Tranché par le propriétaire
   le 04/10/2026 : « un artisan est vérifié avec un numéro de SIRET, donc un
   artisan détient une entreprise ». C'était déjà vrai dans le code sans
   qu'on l'ait écrit — `professional_profiles.siret` existe depuis le début,
   et le badge vérifié atteste une ENTREPRISE, pas une personne.

   > **Une fiche professionnelle EST une entreprise.** Il n'y a pas de table
   > `entreprises` à créer : la fiche pro en tient lieu. Un chantier
   > appartiendra donc au compte, et la sous-traitance du §18 marche
   > nativement — elle se passe entre deux SIRET, c'est-à-dire deux comptes.

   Ce que ça ferme, et qui est un CHOIX, pas un oubli : pas de salarié avec
   son propre accès, pas de rôles. Un patron de trois compagnons aura un
   accès, pas quatre.

   **Et la discipline qui va avec, pour tout ce qui sera construit à partir
   de maintenant** (chantiers, devis, factures, clients) : l'appartenance
   passe par une FONCTION — qui rend aujourd'hui exactement
   `auth.uid() = x` —, jamais par une comparaison écrite à la main. Même
   procédé que `est_masque()` et `est_un_pro()`. Si ce choix devait être
   revu, on changerait UNE fonction au lieu des **56 règles** qui disent
   `auth.uid() = …` dans `schema.sql`. Elle naîtra avec la première table de
   chantier : une fonction que personne n'appelle serait le « bouton §18 »
   retiré avant d'être livré. **Les 56 règles existantes ne bougent pas** —
   avec « un compte = une entreprise », elles sont justes.
2. **Le côté particulier n'apparaît NULLE PART** dans le cahier des charges
   (demandes de travaux, SOS, profil public particulier). Le propriétaire a
   tranché le 29/09/2026 : **c'est un oubli du document, on les garde.**
   Conséquence à retenir : le cahier des charges décrit le côté PRO, ce n'est
   pas une description exhaustive d'Opus — ne jamais déduire qu'une
   fonctionnalité absente du document est abandonnée, demander.
3. **Ne plus ajouter d'action IA « à la main »** dans la fonction Edge `ai`.
   La prochaine se construit avec le journal d'audit et les permissions du
   §21, ou elle sera à refaire.

### Le référentiel des métiers — fait le 30/09/2026

`docs/DEMANDE-METIERS.md` — le texte du propriétaire, qui fait foi.
`docs/RAPPORT-METIERS.md` — ce qui a été construit, et ce qui reste.

**Il n'y a plus qu'une source : `src/data/catalogue-metiers.js`.**
15 catégories, 92 métiers, 124 spécialités. Le SQL du catalogue est
**engendré** depuis ce fichier (`npm run generer-catalogue`), et
`npm run verifier-metiers` refuse de passer s'ils ont divergé.

> **Une fiche enregistre `macon`, jamais « Maçon ».** Le nom ne s'obtient
> que par `nomMetier(cle)` — écrire la clé à l'écran ressemble à une faute
> de frappe, donc personne ne la signale. `captures-metiers.mjs` parcourt
> trois écrans et vérifie qu'aucune clé ne s'affiche.

Les trois décisions du propriétaire, prises le 30/09/2026 :

1. **Spécialités** : les deux — construit le 01/10/2026. La liste du
   catalogue d'abord, proposée selon les métiers choisis, et le texte libre
   pour ce qu'aucune liste n'avait prévu. Un mot écrit à la main part dans
   `specialites_proposees` (section 22) : **ce n'est pas une modération**,
   la spécialité est sur la fiche tout de suite. La file sert à faire
   entrer au référentiel ce que les artisans écrivent vraiment.
   Une fiche range la CLÉ quand la spécialité vient du catalogue, le texte
   sinon ; les deux cohabitent et `nomSpecialite()` rend le nom.
2. **Rangement** : `metiers text[]` reste — passer à des tables de liaison
   aurait voulu dire réécrire toutes les règles RLS. C'est le CATALOGUE qui
   est sorti dans une vraie table.
3. **Qui peut s'inscrire** : tout l'écosystème, avec des pièces
   justificatives **par catégorie** — un avocat n'a pas d'assurance
   décennale, et son badge « vérifié » ne voudrait rien dire.

**Le 01/10/2026, le propriétaire a trouvé deux défauts en l'utilisant :**

- **63 métiers sur 92 n'avaient AUCUNE spécialité** — dont le sien. Le
  catalogue en compte désormais **367**, et `verifier-metiers` refuse de
  passer si un seul métier n'en propose aucune.
- **« Maçonnerie générale » n'aurait pas dû être un métier séparé de
  « Maçon »** : c'est une façon de nommer son entreprise. On ne le
  supprime pas — des comptes y sont rattachés —, il **hérite** (`herite`
  dans le catalogue, `herite_de` en base). Avant d'ajouter un métier
  proche d'un autre, se demander si ce n'en est pas le même.

> **Métiers et spécialités s'affichent ENSEMBLE.** Le bloc
> `MetiersPro` les montre groupés, en haut de la fiche, avant la
> présentation et avant le téléphone. Ils étaient séparés par quarante
> lignes, et on ne comprenait plus de quel métier venait quelle
> spécialité. Même règle dans « Modifier mon profil » : les spécialités
> viennent juste sous les métiers, parce qu'elles en dépendent.

Trois pièges rencontrés en le construisant, à ne pas redécouvrir :

- **La contrainte ne vérifie PAS `actif`.** Désactiver un métier (§18 de la
  demande) empêcherait sinon l'artisan concerné d'enregistrer son téléphone
  ou ses horaires. On le retire de ce qui est PROPOSÉ, on ne casse pas son
  compte.
- **Elle n'accepte que `parent is null`.** Une spécialité rangée dans
  `metiers` consommerait un des quatre emplacements, ce que le §9 interdit.
- **Le verrou des métiers d'un profil vérifié n'avait pas d'échappatoire.**
  `tient_les_metiers()` refusait la migration elle-même, lancée depuis
  l'éditeur SQL. Il suit désormais la règle déjà tenue par
  `tient_le_profil_pro()` : `auth.uid() = new.id` reconnaît le
  professionnel, et `auth.uid()` vide laisse passer l'administration.
  C'est aussi par là que passera le back-office.

Les trois points bloquants — signalement et blocage, suppression de compte,
textes légaux — sont **faits** (21/09/2026).

### L'e-mail affiché n'est JAMAIS celui du compte

Ajouté le 01/10/2026. `professional_profiles.email_pro` est une adresse de
**contact**, que le professionnel renseigne POUR qu'elle s'affiche, comme
son téléphone. Elle est vide par défaut.

> `users.email` est l'adresse du COMPTE. Elle a été retirée le 29/09/2026
> de ce que tout le monde pouvait lire. **La remettre à l'écran par une
> autre porte — « on affiche l'e-mail du pro » — annulerait ce travail
> sans que personne ne s'en aperçoive.**

Le déclencheur `tient_le_profil_pro()` la met en minuscules et la vide
(`null`) quand elle ne contient que des espaces. La contrainte
`pro_email_check` refuse ce qui ne peut PAS être une adresse — pas
d'arobase, pas de point après. Elle ne cherche pas à prouver qu'une
adresse existe : la seule preuve, c'est qu'un message y arrive.

Le propriétaire a proposé mieux, pour plus tard : **des pièces jointes
dans la messagerie**. C'est le vrai besoin — recevoir un plan, un devis
signé. L'e-mail reste utile en attendant, et après : tout le monde n'a
pas Opus.

### Le propriétaire n'a PAS de société ni de SIRET (constaté le 29/09/2026)

Ne jamais lui écrire des mentions légales de société : ce serait faux, et une
mention légale fausse engage sa responsabilité. `src/data/legal.js` porte un
champ **`STATUT`** (`essai` · `particulier` · `micro` · `societe`) qui décide
de ce que la loi exige et de ce que les écrans affichent. Il vaut `'essai'` :
l'application n'est pas ouverte au public, il n'y a donc rien à publier.

`npm run verifier-legal` refuse de passer si le statut change sans que les
champs correspondants soient remplis. **À lancer avant toute mise en ligne.**

L'autre geste qui n'appartient qu'à lui : activer la protection contre les
mots de passe compromis dans Supabase → Authentication → Policies.

## Modération : ce qui ne se discute plus

Une règle a été ajoutée au projet le jour où le blocage a été construit, et
elle vaut pour tout ce qui suivra :

> **Un blocage est symétrique, et il est tenu par la BASE.**
> Si A bloque B, aucun des deux ne voit plus les contenus de l'autre et aucun
> des deux ne peut plus écrire à l'autre. Filtrer côté écran ne protège
> personne : un client modifié verrait tout.

Deux pièges rencontrés, à ne pas redécouvrir :

1. **Une règle RLS qui appelle une fonction interdite à l'appelant ÉCHOUE**,
   elle ne filtre pas. « permission denied for function ». Vérifié sur
   PostgreSQL. `est_masque()` doit donc rester exécutable par
   `authenticated`.

   **Et cela vaut AUSSI pour les contraintes `check`** — reconstaté le
   30/09/2026 avec `horaires_valides()`, révoquée « par prudence » parce
   qu'elle ne sert qu'à une contrainte. Résultat : plus aucun horaire ne
   s'enregistrait. Une contrainte s'exécute avec les droits de CELUI QUI
   ÉCRIT, pas avec ceux du propriétaire de la table.

   > **Toute fonction appelée par une policy ou une contrainte reste
   > exécutable par `authenticated`.** Ce n'est pas un relâchement : une
   > fonction qui ne lit aucune table et n'est pas `security definer` ne
   > donne accès à rien.
2. Supabase signale alors, à juste titre, les fonctions `security definer`
   appelables **sans être connecté**. D'où deux politiques de lecture par
   table de contenu : la vraie règle `to authenticated`, et la lecture
   publique `to anon` qui n'appelle pas la fonction. Un visiteur n'a bloqué
   personne : il n'a rien à masquer.

### Un essai de RLS écrit dans un bloc `do $$ … $$` ne prouve RIEN

Constaté le 01/10/2026, sur la vraie base, en construisant la file des
spécialités. Deux contrôles ont « échoué » alors que la règle était juste.

```sql
do $$ begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', moi, true);
  insert into t (…, propose_par) values (…, QUELQU_UN_D_AUTRE);  -- passe !
end $$;
```

`current_user` vaut pourtant bien `authenticated` à l'intérieur du bloc —
vérifié. Mais la politique `with check` n'est pas appliquée. Le MÊME ordre,
écrit directement, est refusé comme il doit l'être :

```sql
set local role authenticated;
set local request.jwt.claim.sub = '…';
insert into t (…) values (…);
-- ERROR 42501: new row violates row-level security policy
```

> **Pour vérifier une règle RLS : `set local role` puis l'ordre, chacun
> dans son propre appel.** Jamais dans un `do`.

Ce qui reste valable dans un bloc `do`, et qui a servi tout au long de ce
projet : les **déclencheurs** et les **contraintes `check`**. Ils
s'exécutent quoi qu'il arrive — c'est ainsi qu'ont été vérifiés le verrou
du commentaire (`OP001`) et `pro_metiers_check`. Seule la RLS est
concernée par ce piège.

### Une règle RLS filtre des LIGNES, jamais des COLONNES

Constaté le 29/09/2026, sur la vraie base : `public.users` est lisible par
tout le monde (`for select using (true)`) parce que le fil affiche des noms
et des photos. La même autorisation laissait lire **l'adresse e-mail, le
téléphone et les coordonnées GPS** de chacun, avec la clé publiable, sans
même avoir de compte — alors que l'écran promet au particulier : « il ne
s'affiche nulle part ».

Ce qui protège une colonne, ce sont les **droits de colonne** (`grant
select (col)`), pas la politique RLS. Et deux pièges :

1. **`revoke select (colonne)` ne retire RIEN** tant que le rôle possède le
   droit de lire la table entière — ce que Supabase accorde d'office. Il
   faut `revoke select on <table>`, **puis** rendre colonne par colonne.
   Le premier essai est passé sans erreur en ne protégeant rien.
2. **`select *` cesse alors de fonctionner** pour ces rôles, et c'est voulu.
   Pour lire SA PROPRE ligne entière, une fonction `security definer` avec
   `where id = auth.uid()` — c'est ce que fait `mon_compte()`.
   Attention à toute fonction `security invoker` qui fait `to_jsonb(u)` :
   elle lit toutes les colonnes et échoue. `mes_donnees()` (l'export RGPD)
   est passée par `mon_compte()` pour cette raison.

Et l'ordre du fichier compte : une fonction SQL est contrôlée à sa création,
donc `mon_compte()` est déclarée **avant** `mes_donnees()`, pas dans la
section qui l'explique.

### Le badge ne se décerne pas soi-même

Même journée, même famille de défaut : la règle d'écriture d'un profil pro
était « chacun sa fiche », toutes colonnes confondues. Un client modifié
pouvait donc s'envoyer `kbis_valide = true, assurance_valide = true`, et le
déclencheur en tirait consciencieusement `verifie = true`.

Le déclencheur `tient_le_profil_pro()` remet les colonnes de vérification à
leur ancienne valeur **dès que c'est le professionnel lui-même qui écrit**.
On le reconnaît à `auth.uid() = new.id` ; depuis l'éditeur SQL ou une Edge
Function, `auth.uid()` est `null` et le verrou laisse passer.

> **Toute colonne qu'un humain doit valider se protège par un déclencheur.**
> Aujourd'hui : `verifie`, `kbis_valide`, `assurance_valide`, `rge`,
> `verification_note`.

### Un commentaire auquel on a répondu ne se récrit plus

Ajouté le 30/09/2026, à la demande du propriétaire, et c'est la même famille
que les deux précédentes : ce qui engage quelqu'un d'AUTRE se ferme.

Pouvoir corriger son texte pour toujours permet de réécrire une conversation
entière — j'écris « ce prix me paraît trop bas », on me répond « d'accord »,
je remplace ma phrase, et la réponse cautionne ce que son auteur n'a jamais
lu. La mention « · modifié » dit QUE le texte a bougé, jamais CE QUI a bougé.

Interdire toute correction ne réglait rien non plus : supprimer un
commentaire emporte ses réponses (`on delete cascade`), donc réparer une
faute de frappe aurait détruit la discussion. D'où la règle tenue par la
base :

> **Le texte d'un commentaire est libre tant que personne n'a écrit après
> lui dans le même fil, et figé pour toujours ensuite.** Code d'erreur
> `OP001`, section 20.1 bis de `schema.sql`.

Deux détails à ne pas redécouvrir :

1. **Le fil n'a que deux niveaux, donc une réponse n'a jamais d'enfant.**
   Regarder par `parent_id` laisserait toutes les réponses modifiables à
   vie. On raisonne par FIL : racine = `coalesce(parent_id, id)`, et on
   cherche un message plus récent dans le même fil.
2. **La fonction est `security definer`, et il le faut.** La politique de
   lecture masque les commentaires des personnes bloquées : avec les droits
   de l'appelant, **bloquer celui qui a répondu aurait ROUVERT le texte**.
   Vérifié sur PostgreSQL — la réponse devient bien invisible à l'auteur, et
   le verrou tient quand même.

La publication, elle, reste corrigeable : sa légende n'est pas un tour de
parole.

Et une règle RGPD qui a la même force :

> **Ce qui concerne des TIERS s'anonymise, il ne se supprime pas.**
> Avis, commentaires, signalements : `on delete set null` plus un drapeau
> `auteur_supprime`. Effacer un avis parce que son auteur s'en va ferait
> remonter la note d'un artisan qui n'a rien demandé.

Les listes de motifs et de cibles sont contrôlées par la base :
`npm run verifier-moderation`.

## Où je tourne, et ce que le propriétaire a réellement

Les sessions de travail s'exécutent **dans le cloud**, dans un conteneur qui a
cloné le dépôt — pas sur l'ordinateur du propriétaire. Celui-ci travaille
**depuis son navigateur**, avec **PowerShell** pour lancer l'application, et
**n'a pas la commande `claude`** installée.

Conséquence : ne jamais lui donner une instruction de ligne de commande sans
avoir vérifié qu'elle s'applique à SON poste, et ne jamais supposer qu'une
configuration faite chez lui change quelque chose ici. Une erreur déjà commise
deux fois de suite.

Ce qui fonctionne pour lui : les connecteurs de **claude.ai** (Paramètres →
Connecteurs). Le connecteur **Supabase** y est installé : il donne accès à la
vraie base du projet — schéma, contraintes, données, fichiers du stockage,
journaux et alertes de sécurité. **S'en servir pour vérifier** plutôt que de
lui faire coller des résultats de requêtes.

## Comment vérifier

```bash
# 1. le SQL, sur un vrai PostgreSQL, DEUX FOIS (il doit être rejouable)
psql ... -f supabase/schema.sql      # puis une seconde fois : aucune erreur

# 2. insérer réellement la ligne que l'application produira

# 3. l'application, dans un navigateur
npx expo export --platform android   # le bundle doit passer
npx expo start --web                 # puis Playwright + /opt/pw-browsers
```

**Un contrôle qui PLANTE ne vérifie rien** — et ça ne se voit pas, puisqu'il
n'écrit aucun « ✘ ». Constaté le 02/10/2026 : `npm run verifier-montage`
tombait sur `Cannot find module '.../src/lib/supabase'` depuis le jour où les
`await import(...)` ont été interdits dans `src/` — `cloudinary.js` chargeait
dès lors React Native, que `node` ne sait pas ouvrir. Les adresses de montage
Cloudinary n'étaient donc plus contrôlées, et personne ne l'avait remarqué.
Le calcul des adresses vit maintenant seul, dans `src/lib/cloudinary-adresses.js`,
qui n'importe rien. **Lancer les contrôles en lisant leur code de sortie, pas
leur sortie à l'écran.**

Les captures d'écran valent mieux qu'une affirmation. Ce qui n'a pas pu être
vérifié ici (appareil photo, lecture vidéo réelle, notifications push) doit
être **dit explicitement** dans la réponse et dans le message de commit.

### Essayer l'application sur la VRAIE base, depuis ce conteneur

Acquis le 01/10/2026, à la demande du propriétaire : « je voulais que toi tu
puisse tester réellement l'app, créer des comptes, pour qu'on puisse voir la
même chose ».

Jusque-là je ne voyais que le **mode démo** — des données en mémoire. Je ne
pouvais donc jamais constater ce qu'il constate, lui : une vraie fiche, un
vrai fil, un enregistrement réellement refusé par la base.

Ce qui bloquait : le conteneur n'a aucun accès direct à Internet, tout passe
par un mandataire qui n'accepte que des tunnels HTTPS. `curl` sait s'en
servir, le navigateur non — et le lancer AVEC le mandataire lui fait perdre
le serveur Expo en local.

**La parade : `scripts/relais-supabase.mjs`.** Playwright intercepte tout ce
qui part vers Supabase (`page.route`), `curl` le rejoue, et la réponse
revient au navigateur, qui ne voit aucune différence.

```js
import { poserRelais, adresseEssai } from './relais-supabase.mjs';
await poserRelais(page, {
  hote: 'lqzqdoiiqgqapqldrewg.supabase.co',
  onAppel: ({ methode, chemin, statut }) => console.log(methode, chemin, statut),
});
```

Il faut un fichier `.env` à la racine (`EXPO_PUBLIC_SUPABASE_URL` et
`EXPO_PUBLIC_SUPABASE_ANON_KEY`) : sans lui, `api.js` repasse en mode démo et
le relais ne sert à rien. **`.env` n'est jamais versionné.**

#### Ce que ça ne couvre pas

Le **temps réel** passe par un WebSocket, qui ne s'intercepte pas de cette
façon : les messages s'envoient et se lisent au rechargement, ils n'arrivent
pas tout seuls. Tout le reste — comptes, profils, fil, commentaires,
demandes, envoi de fichiers — passe par le relais.

#### Et la prudence qui va avec

C'est la base du propriétaire. **Tout compte créé là existe pour de bon**, et
il le voit. D'où `adresseEssai()`, qui fabrique une adresse reconnaissable
(`…@exemple-opus.test`), et la règle : on supprime derrière soi, dans la même
session.

> **Pour supprimer un compte d'essai, prendre le chemin de l'application**,
> pas la base. `delete from auth.users` par le connecteur Supabase **expire**
> au bout d'une minute — l'ordre destructeur attend une confirmation que
> personne ne donne ici. Les deux étapes réelles, en revanche, marchent très
> bien avec `curl` : connexion par
> `/auth/v1/token?grant_type=password`, puis `rpc/preparer_suppression_compte`
> (les données, et l'anonymisation de ce qui concerne des tiers), puis
> `/functions/v1/compte` avec `{"action":"supprimer"}` (les fichiers du
> stockage et le compte d'authentification).
>
> C'est aussi, au passage, le seul moyen d'essayer pour de vrai la
> suppression de compte — et elle a été vérifiée ainsi le 01/10/2026 :
> plus aucune ligne portant l'identifiant du compte d'essai, dans aucune
> table de `public`, ni dans `auth.users`.

### Les gestes : `PanResponder` ne voit rien au-dessus d'une vue native

`VideoView` (expo-video), comme toute vue native, reçoit la touche **avant**
JavaScript. Un `PanResponder` posé autour ne reçoit donc jamais le geste : le
glissement du fil vidéo n'a jamais fonctionné pour cette seule raison, alors
qu'il marchait au-dessus des dégradés de démonstration — d'où l'impression
d'un bug capricieux.

Pour tout geste : **`react-native-gesture-handler`**, qui arbitre côté natif,
avec `GestureHandlerRootView` à la racine (`App.js`). Et `pointerEvents="none"`
sur les `VideoView`, qui n'ont de toute façon aucune commande.

Pour départager un geste horizontal d'une liste qui défile verticalement :
`activeOffsetX` (px avant de prendre la main) et `failOffsetY` (px verticaux
qui rendent la main). Au moindre doute, c'est le défilement qui doit gagner.

Le SENS attendu, celui de TikTok et d'Instagram : le doigt part à **gauche**
pour découvrir la page de l'artisan, à **droite** pour revenir au fil. On
pousse le contenu de côté pour voir ce qu'il y a derrière.

Et un écran qui arrive doit être posé **juste à côté**, comme la page suivante
d'un carrousel, avec son contenu calé contre le bord par lequel il entre.
Centré, ce contenu reste caché par la vidéo pendant tout le geste : on ne voit
qu'une bande noire, et le glissement paraît vide.

#### Un geste sans inverse s'apprend mal — 02/10/2026

Signalé par le propriétaire : on glissait du fil vidéo vers la fiche de
l'artisan, et on ne pouvait pas repartir en sens inverse. Il faut les deux.
On pousse le fil de côté pour voir la fiche, donc on doit pouvoir repousser
la fiche pour retrouver le fil — sans aller chercher la flèche en haut à
gauche, qui est à l'autre bout du pouce.

Trois choses à ne pas redécouvrir en le construisant :

1. **Le geste de retour n'existe que si l'écran d'avant est VRAIMENT
   derrière.** `OpusApp` retient d'où la fiche a été ouverte
   (`origineProfil`), et `viewProfile(id, origine = null)` remet le compteur
   à zéro par défaut : tous les autres chemins ferment le geste sans qu'on
   ait à y penser. Ouverte depuis le fil classique ou la Place des pros, le
   même geste téléporterait l'artisan dans un fil qu'il n'a pas demandé.
   **Vérifié au navigateur** : depuis le fil classique, le glissement ne
   quitte pas la fiche.
2. **Un curseur se tire horizontalement, exactement comme ce geste.** La
   fiche porte trois curseurs (la note sur trois critères) ; le geste se
   tait pendant que le formulaire d'avis est ouvert (`actif={!showForm}`).
   Sans ça, noter « 3/5 » ferait quitter la page.
3. **Appuyer sur le nom et glisser mènent au même endroit, donc le retour
   doit marcher dans les deux cas.** Un geste qui ne marche qu'une fois sur
   deux ne s'apprend jamais.

Ce que le navigateur ne dit PAS : l'en-tête (la flèche et le nom) ne glisse
pas avec la fiche, il reste posé pendant les 190 ms de la course. On le voit
sur `captures/g4-apercu-mi-course.png`. Sur iPhone, c'est à juger au doigt.

### Une FlatList monte DIX éléments d'un coup

Constaté sur iPhone le 29/09/2026, et impossible à voir ici : au démarrage,
« le clic marche mais plus rien ne défile », pendant quelques secondes, puis
tout revient. Ce n'est pas le défilement qui est cassé — c'est le premier
rendu qui bloque le téléphone.

`initialNumToRender` vaut **10** par défaut. Dans le fil vidéo, cela faisait
dix diapositives plein écran, donc **dix lecteurs vidéo** créés ensemble — et
`VideoMedia` charge la vidéo dès le montage, même en pause. Dans le fil
classique, 5,8 écrans de contenu montés avant le premier affichage, photos
comprises.

> **Toute liste longue règle `initialNumToRender`, `maxToRenderPerBatch` et
> `windowSize`.** Pour un fil façon TikTok : `windowSize={3}` — la
> précédente, celle qu'on regarde, la suivante.

Même principe pour un carrousel : les emplacements restent tous là (sinon il
ne sait plus où s'arrêter), mais on ne **monte** que la photo affichée et ses
voisines.

Et le corollaire : un écran qui répond aux appuis n'est pas un écran prêt.
Le navigateur de test, lui, ne montre rien de tout cela — il a la mémoire et
le processeur d'un ordinateur. Ce qui se mesure ici, c'est le **nombre de
nœuds et d'écrans de contenu montés** ; c'est un bon indicateur indirect.

### Un champ de saisie ne re-rend que LUI

Constaté sur iPhone le 29/09/2026 : « dans Découvrir, on ne peut pas écrire
dans le champ de l'assistant IA ». Au navigateur, il se remplissait
parfaitement. La différence : le processeur.

On peut la reproduire — **Playwright sait brider le processeur** :

```js
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
```

Ce que cela a donné, en millisecondes par lettre :

| | avant | après |
|---|---|---|
| Assistant IA | **219** | 26 |
| Découvrir, recherche | 74 | 21 |
| Place des pros | 93 | 29 |

Deux causes, et la seconde est la moins évidente :

1. **L'état de saisie vivait trop haut.** `aiQuery`, `search` et
   `filterMetier` étaient dans `OpusApp` : chaque lettre re-rendait TOUS les
   écrans. Descendus dans l'écran : 219 → 152 ms. Mieux, toujours
   inutilisable.
2. **Un écran entier se re-rend pour une lettre.** Il faut que le champ soit
   dans SON PROPRE composant, avec son texte. C'est ce qui fait passer de
   152 à 26 ms.

> **Un champ de recherche = un composant, avec son texte à lui.** Le
> filtrage part quand la frappe retombe (`useRechercheDifferee`,
> `src/lib/frappe.js`), jamais à chaque lettre.

Et le piège rencontré en corrigeant : poser le différé **dans l'écran** ne
sert à rien — l'écran se redessine quand même, et le minuteur en plus coûte
du temps. Mesuré : 93 ms avant, **180 ms** avec le différé seul, 29 ms une
fois le champ isolé. Ce qui compte, c'est **où vit le texte**.

### La carte : une image, pas une bibliothèque de cartographie

Ajoutée le 30/09/2026. `react-native-maps` existe et fonctionne dans Expo
Go (vérifié dans les docs du SDK 57) — il n'a pourtant pas été pris, et il
faut savoir pourquoi avant de le proposer à nouveau :

> **Une carte qu'on peut agrandir finit par montrer la rue.** Beaucoup
> d'artisans déclarent l'adresse de leur MAISON. « Se déplace jusqu'à
> 30 km » ne dit pas où ils habitent ; une carte zoomable, si.

`src/lib/tuiles.js` fabrique donc le damier d'images à la main, avec un
`ZOOM_MAX` qui est **un verrou, pas un réglage** — et un point au centre,
jamais une épingle. Trois bénéfices en plus : aucune dépendance (donc aucun
risque de devoir quitter Expo Go), le même rendu au navigateur et sur le
téléphone (donc ça se vérifie ici), et des calculs purs contrôlés par
`npm run verifier-carte`.

Le piège que ces calculs contiennent : **le cosinus de la latitude**. La
projection Web Mercator étire les distances vers les pôles, donc un rayon
de 30 km sans ce cosinus serait juste à l'équateur et faux partout en
France. Et le zoom s'arrondit **vers le bas**, sinon le cercle déborde du
cadre une fois sur deux.

Les fonds viennent de la **Géoplateforme de l'IGN** (`data.geopf.fr`) :
données publiques, sans clé depuis la bascule des géoservices. La mention
« © IGN » sur la carte est la condition d'usage — ne pas la retirer.

Et pour modifier le rayon : **un curseur, pas le bord du cercle.** Sur un
téléphone, viser un trait de 2 px pendant que la carte interprète le doigt
comme un déplacement, c'est le même piège que le glissement du fil vidéo.

#### Les tuiles ne partent pas depuis le conteneur de travail

Le navigateur de test n'a aucun accès direct à l'extérieur : tout passe par
le mandataire de l'agent, qui n'accepte que des tunnels HTTPS. Sans rien
faire, **les tuiles ne partent jamais et la carte reste grise** — ce qui
ressemble beaucoup à un bug du code. Lancer Chromium AVEC le mandataire ne
marche pas davantage : son option de contournement pour `localhost` est
ignorée, et c'est alors le serveur Expo qu'on n'atteint plus.

La seule voie qui marche, et c'est celle de `scripts/captures-carte.mjs` :
laisser le navigateur tranquille et **intercepter les seules adresses de
l'IGN** (`page.route`), qu'on va chercher avec `curl`. Prévoir des essais
répétés : le mandataire coupe environ une connexion sur cinq — vérifié en
appelant la même adresse cinq fois, quatre 200 et un échec.

### Ce qui se vérifie au navigateur, et ce qui ne s'y vérifie pas

Playwright reproduit **les gestes à la souris** : un glissement latéral, un
appui long suivi d'un déplacement, tout cela se teste et doit être testé —
c'est ainsi qu'a été trouvé le point de départ qui se recalculait à chaque
mouvement et faisait filer la photo hors de l'écran.

#### CETTE SECTION DISAIT FAUX DEPUIS LE LOT 5 — corrigé le 04/10/2026

Elle affirmait : « Playwright ne reproduit pas le défilement au doigt ;
l'arbitrage entre un glissement horizontal et un défilement vertical ne peut
donc **pas** être vérifié ici. » C'est vrai **de la souris** — sur
ordinateur, une zone défilante répond à la molette, pas au glissement. Ce
n'est pas vrai du navigateur.

Le propriétaire me l'a rappelé après avoir trouvé un défaut de geste sur son
iPhone : « n'oublie pas que toi aussi tu peux tester réellement Opus ». Il
avait raison.

> **Le protocole de Chrome envoie de VRAIS événements tactiles** —
> `Input.dispatchTouchEvent` : un `touchStart`, une série de `touchMove`
> espacés dans le temps, un `touchEnd`. Le navigateur arbitre alors tout
> seul, exactement comme un téléphone. `scripts/gestes-tactiles.mjs`,
> `npm run gestes-tactiles`.

Deux portes, et **une seule marche** :

| | résultat |
|---|---|
| `Input.synthesizeScrollGesture` (geste « tout fait », avec inertie) | **ne déplace rien** |
| `Input.dispatchTouchEvent` posé à la main | **marche** |

Et il faut espacer les `touchMove` de quelques millisecondes : un geste
instantané ne ressemble à rien, et le navigateur l'ignore.

**Mesuré le 04/10 sur les trois pages de Découvrir** : un doigt vers la
gauche passe à la page suivante et tombe exactement dessus, la pastille
suit, la liste ne défile pas ; un doigt vers le haut fait défiler la liste
de 361 px **sans** changer de page. C'est exactement l'arbitrage que cette
section déclarait invérifiable.

#### Ce qui reste vrai, et qu'il ne faut pas confondre

**Chromium n'est pas iOS.** L'accrochage des pages y est fait par le
navigateur (`scroll-snap`), pas par la pagination d'iOS. Le défaut du
04/10 — « j'arrive entre deux pages » — venait précisément de cette
différence : **ce contrôle ne l'aurait pas attrapé**, et il ne l'attrapera
pas davantage demain.

> **Ce qui se vérifie désormais : QUEL geste gagne, et où il tombe.**
> Ce qui ne se vérifie toujours pas : ce que l'accrochage natif d'iOS fait
> de ce geste, et ce que le doigt RESSENT. Les deux restent à l'iPhone.

### Ce que le navigateur de test ne sait PAS faire

Le Chromium fourni avec Playwright est une version allégée, **sans les codecs
propriétaires**. Vérifié : `canPlayType` renvoie « rien » pour
`video/quicktime` ET pour `video/mp4; codecs=avc1`, et « maybe » seulement
pour WebM.

Conséquence : **aucune vidéo du projet ne se lit dans ce navigateur.** Un
lecteur y reste à `readyState 0`, et les erreurs « play() interrupted by
pause() » qui en découlent sont des artefacts du test, pas des défauts du
code. Ne pas chercher à les corriger.

Ce qu'on peut y vérifier malgré tout : qu'un lecteur est bien monté, quelle
source il porte, et combien il y en a. C'est déjà beaucoup. La fluidité
réelle, elle, ne se juge que sur le téléphone.

## Principes tenus depuis le début

- **Les secrets ne vivent jamais dans l'application.** La clé Anthropic est
  dans une Edge Function Supabase. Même règle pour toute clé à venir.
- **Les règles métier sont tenues par la base, pas par l'écran.** Badge
  vérifié, partenariats consentis, profondeur des commentaires, notifications :
  des triggers et des règles RLS, pour qu'un client modifié ne puisse pas les
  contourner.
- **Les documents (Kbis, assurance) restent privés** dans l'espace `documents`
  de Supabase Storage, protégé par RLS. Ne jamais les déplacer ailleurs.
- **`schema.sql` est rejouable**, toujours : `drop policy if exists` avant
  chaque policy, `add column if not exists`, aucune donnée perdue.
- **Le fil d'actualité est réservé aux professionnels.** Les particuliers
  aiment, commentent, partagent, publient des demandes — mais ne publient pas.

## Identité visuelle — ne pas réinterpréter

```
--ink: #1A1B19   --bg: #E7E4DC   --surface: #FFFFFF   --line: #CFC9BB
--accent: #E85C1F   --accent-2: #1B4B6B   --muted: #726E63
```

Titres et boutons en **Oswald**, textes en **Inter**. La bande de chantier
diagonale
(`repeating-linear-gradient(135deg, #E85C1F 0 10px, #1A1B19 10px 20px)`,
5–6 px) est la signature de l'application.

### Les bords : une règle, pas un goût

La règle « angles vifs partout sauf les avatars » a été précisée avec le
propriétaire, parce qu'elle empêchait une chose qu'il voulait — des boutons
plus arrondis — sans protéger ce qu'elle servait vraiment à protéger.

> **Angle vif = la STRUCTURE.** Cartes, champs de saisie, blocs, sections,
> bandeaux, listes. Tout ce qui PORTE l'information.
>
> **Arrondi = ce qui FLOTTE au-dessus, et sur quoi on appuie.** Boutons,
> puces de filtre, pastilles, étiquettes posées sur une image, menus
> surgissants. Avatars toujours ronds.

Ce n'est pas un assouplissement : c'est ce qui rend l'interface lisible au
doigt. Un bord arrondi dit « je suis détaché du fond, appuie sur moi » ; un
bord vif dit « je suis le fond, lis-moi ». Arrondir une carte ou un champ
reste interdit — c'est là que se perdrait l'identité.

Les valeurs sont dans `src/theme.js` (`R.vif`, `R.doux`, `R.gelule`) : ne pas
écrire un rayon en dur.

### Ce qu'on pose SUR une couleur — décidé le 02/10/2026

L'orange de signature ne bouge pas. Ce qui bouge, c'est l'encre posée
dessus : **le blanc sur `#E85C1F` ne donne que 3,51 : 1**, sous le seuil de
4,5. Le presque-noir donne **4,92**. Mesuré, puis vérifié dans le navigateur
sur les quatre écrans : plus un seul texte blanc sur l'orange, le pire cas
est à 4,92.

> **`C.surAccent` est l'encre de l'orange.** Et la règle ne se généralise
> PAS :
>
> | remplissage | blanc | noir | |
> |---|---|---|---|
> | `accent` #E85C1F | 3,51 | **4,92** | → noir |
> | `sos` / `bad` #B4432B | **5,56** | 3,11 | → blanc |
> | `accent2` #1B4B6B | **9,27** | 1,86 | → blanc |
> | `ink` #1A1B19 | **17,29** | 1,00 | → blanc |

Et pour tout ce dont le fond vient des **données** — le type d'une annonce,
le degré d'urgence d'une demande, l'origine d'une demande reçue —
**`surFond(couleur)`** tranche par le calcul. C'est ce qui rend lisible une
étiquette dont la couleur sera ajoutée plus tard à `annonces.js` sans que
personne n'y repense.

`npm run verifier-cibles` tient les deux sens, refuse un `'#fff'` écrit dans
le même objet de style qu'un remplissage orange, et refuse `'#111'` : il n'y
a qu'une encre sombre, et elle a un nom.

### Les échelles : `src/theme.js` fait foi

Un relevé sur `src/` avait trouvé **20 tailles de police**, **24 valeurs
d'espacement** (dont 97 usages sur des nombres impairs), **14 rayons** et
**5 opacités d'ombre utilisées chacune une seule fois**.

`theme.js` porte désormais `T` (8 tailles), `interligne()`, `S` (grille de
4 px), `R` (3 rayons) et `SH` (3 ombres). **Toute nouvelle valeur passe par
ces échelles.** Les fichiers déjà écrits migrent au fur et à mesure : une
valeur en dur qui traîne encore continue de fonctionner, elle n'est pas une
urgence.

### Le mouvement et le toucher — quatrième échelle, ajoutée le 01/10/2026

Un relevé sur tout `src/` a trouvé **106 zones appuyables et zéro
occurrence du mot `pressed`** : aucun bouton ne montrait qu'on l'avait
touché. `expo-haptics` était installé depuis le début et appelé à UN seul
endroit. `react-native-reanimated` (4.5.1) n'était importé que dans deux
fichiers sur soixante-treize. Et les deux fichiers qui animaient quelque
chose avaient chacun écrit SON ressort, 230 et 190 de raideur.

C'est ce qui fait dire « ça ne réagit pas » d'une application qui marche :
l'écran ne change qu'une fois l'action terminée, donc le doigt doute
pendant tout le traitement.

`theme.js` porte désormais `M` (trois durées), `RESSORT` et
`RESSORT_PORTE`, et `APPUI` (`plein` pour ce qui a une forme propre,
`discret` pour une icône ou une ligne). `src/lib/retour.js` porte la
doctrine haptique en six fonctions. `npm run verifier-retour` tient les
deux.

> **Une seule porte vers le vibreur : `src/lib/retour.js`.** Chaque appel y
> est enveloppé d'un `try`/`catch` — un vibreur absent, coupé dans les
> réglages, ou inexistant au navigateur n'est PAS une panne, et une
> publication qui échouerait pour cette raison serait absurde.
>
> **On ne vibre pas pour ce qu'on voit déjà** (ouvrir un écran, choisir
> dans une liste). **On vibre pour ce qu'on ne regarde pas** : un geste qui
> vient d'être validé, un envoi qui part, un refus. Une application qui
> vibre partout finit par être coupée entièrement.

**Et les trois interdits, écrits dans `theme.js` :**

1. **Jamais d'`entering` dans un `renderItem` de liste.** Le fil, le fil
   vidéo et le sélecteur de métiers montent déjà le strict minimum ; animer
   chaque arrivée annulerait ce réglage — et c'est exactement le défaut qui
   bloquait l'iPhone plusieurs secondes au démarrage.
2. **Jamais d'animation sur un écran tant qu'il charge.** On anime ce qui
   est prêt, pas ce qui attend.
3. **Jamais d'`exiting` sur un élément démontable en masse** (une liste
   qu'on filtre) : chaque sortie garde son nœud vivant le temps de
   l'animation.

### Le lot 6 — le mouvement visible (02/10/2026)

#### L'ouverture occupe un temps qui existe, elle ne l'ajoute pas

Mesuré au navigateur, processeur bridé six fois : **1,24 s** entre la page
servie et le premier écran — les polices et la session. Jusque-là, une roue
qui tournait. Maintenant, deux barrières de chantier qui s'écartent
(`src/components/Ouverture.js`).

> **Une intro se juge à ce qu'elle REMPLACE, pas à sa durée.** Celle-ci
> reste fermée tant que le travail réel n'est pas fini, et s'ouvre quand il
> l'est. Un doigt l'interrompt. Complète au premier lancement, courte
> ensuite — une intro de 1,7 s est magnifique la première fois et
> détestable la vingtième.

Trois pièges rencontrés, les trois trouvés par la MESURE et non à l'œil :

1. **`skewX` penche autour du CENTRE** et décale donc de la moitié de la
   hauteur. Inoffensif sur la bande de 5 px de l'en-tête, destructeur sur
   844 px : le motif laissait le tiers bas nu. Une bande fait exactement la
   hauteur du panneau, et le nombre de bandes en tient compte.
2. **Le mot-symbole sautait de 22 px** au fondu : il s'affichait d'abord
   dans la police de secours du système. Il n'est monté qu'une fois Oswald
   là. Et il est au PIXEL celui de l'écran d'accueil — mêmes mots, même
   taille, même place : quand les barrières sortent, il ne bouge pas, seul
   le reste de l'écran arrive. Mesuré : 112,0 contre 112,0.
3. **Ralentir n'est pas étirer.** Passée de 1,13 à 1,73 s à la demande du
   propriétaire, la course des panneaux et l'angle du pivot ont grandi en
   même temps — sinon on obtient de la lenteur, pas de l'ampleur. Et à
   8 degrés un panneau penché découvre ses coins, ce qui ne se voyait pas
   à 5 : il déborde donc en hauteur.

#### Un bouton ne se met pas dans un bouton

En posant « Suivre » sur la photo, le navigateur l'a dit tout de suite :
« button cannot be a descendant of button ». La photo vivait dans le bloc
appuyable qui ouvre la fiche, et la pastille est un bouton à son tour.

> **Deux cibles voisines, jamais imbriquées.** Pour un lecteur d'écran, une
> cible qui en contient une autre ne s'annonce pas : on ne sait plus
> laquelle on actionne. Le conteneur, lui, n'est pas un bouton.

#### Le double-appui aime, il n'enlève jamais

`src/components/DoubleAppui.js`. Trois règles, et aucune n'est cosmétique :

- **il AIME, il ne retire pas.** On double-appuie parfois par accident, et
  un accident ne doit pas défaire quelque chose. Pour retirer, le cœur de
  la barre est là, et lui bascule ;
- **le cœur s'envole même si c'était déjà aimé** — sinon le geste a l'air
  de n'avoir rien fait, et on recommence ;
- **l'appui simple attend que le double ait échoué**, environ 250 ms, et
  cette attente ne se paie QUE là où un appui simple fait quelque chose
  (ouvrir une vidéo). Sur une photo, aucune attente.

Vérifié au navigateur : 214 → 215, puis 215 → 215 au second double-appui,
puis 215 → 214 par le cœur de la barre.

#### Et la nuance qui sauve les trois interdits de `theme.js`

`DoubleAppui` vit dans le `renderItem` d'une liste, là où `entering` est
interdit. **Mais son animation ne part qu'au doigt, jamais au montage** —
et c'est toute la différence. L'interdit vise ce qui s'anime en arrivant,
pas ce qui s'anime quand on le touche.

Même raisonnement pour la transition d'écran (`FadeInDown`, 120 ms) : elle
se tait pendant le démarrage, parce qu'on anime ce qui est prêt, pas ce qui
attend.

#### La bannière de profil suit le doigt — et ce qu'on a ÉCARTÉ

L'audit disait : la bannière prend environ 600 px sur 900, il faut
descendre avant de voir quoi que ce soit d'utile. On ne peut pas la
supprimer — c'est la vitrine de l'artisan — mais on peut la faire
travailler : elle part **deux fois moins vite** que le reste en
descendant, et **s'agrandit** quand on tire vers le bas au lieu de laisser
un trou. Mesuré : 240 px de défilement, 120 px de déplacement. Exactement
la moitié.

`defilement` est une valeur partagée qui vit sur le **fil natif** : aucune
valeur ne remonte en JavaScript à chaque pixel. Sans ça, descendre une
fiche redessinerait tout l'écran soixante fois par seconde — et c'est le
genre d'animation qui fait dire que l'application rame.

> **Ce qui a été ÉCARTÉ du lot 6, et pourquoi.** Les apparitions en
> cascade dans les listes courtes. Elles supposent de distinguer à
> l'exécution une liste « courte » d'une liste « longue », alors que les
> trois interdits de `theme.js` viennent précisément d'un défaut de cette
> famille. Une règle qui dépend du nombre d'éléments se trompera le jour
> où il y aura du monde — c'est-à-dire le jour où ça compte.

#### Le cadre d'une photo suit la PHOTO — 02/10/2026

Signalé par le propriétaire : « sur le fil photo, les photos ne prennent
plus tout le post, une bande blanche est en dessous, ce n'est pas joli ».

Mesuré sur SES photos, et c'était pire que la bande : trois sont carrées
(1179 × 1179), une est très verticale (1600 × 2845), et le cadre était
fixé à 16:10.

| | 16:10 | 4:5 | adaptatif |
|---|---|---|---|
| carrée 1179×1179 | **37,5 % de hauteur perdue** | 20 % de largeur | **0 %** |
| verticale 1600×2845 | **64,9 % de hauteur** | 29,7 % | **29,7 %** |
| paysage 1600×900 | 10 % de largeur | **55 % de largeur** | **10 %** |

> **Aucune valeur FIXE ne convient à tout le monde** — passer en 4:5
> aurait simplement déplacé la perte sur les photos de chantier en
> paysage. C'est la photo qui décide, entre deux bornes.

Les bornes (`src/lib/cadre.js`) ne sont pas un compromis esthétique :
sans elles, une panoramique ferait une bande de 40 px et une capture
d'écran de téléphone un mur de deux écrans de haut à franchir avant la
publication suivante. Elles tiennent le RYTHME du fil.

Et le calcul vit dans un fichier qui **n'importe rien** — c'est la leçon
de `cloudinary-adresses.js`, appliquée le jour même : rangé dans le
composant, `node` ne pouvait pas l'ouvrir, donc le contrôle ne pouvait
plus le FAIRE TOURNER. La vraie forme de l'image ne s'obtient que par
`onLoad` : elle n'est écrite nulle part en base.

#### La barre d'actions est posée SUR la photo

Même demande : « les boutons en transparence sur la photo, en dessous ».
La bande blanche coupait la carte en deux alors que l'image est la seule
chose qu'on regarde — et le fil vidéo faisait déjà exactement ça. Les deux
fils parlent enfin la même langue. Mesuré après : **bas de la carte et bas
de la photo au même pixel**.

Trois choses à ne pas redécouvrir :

1. **Le voile n'est pas décoratif.** Une icône blanche sur une photo de
   mur blanc disparaît. Le dégradé garantit un fond sombre sous les
   commandes, quelle que soit la photo.
2. **Mais il ne va qu'à 78 %**, donc tout ce qui s'y pose doit rester
   lisible sur la photo la plus claire. Le compteur « aimé » était passé
   en orange : `verifier-cibles` l'a refusé, et il avait raison — sa
   lisibilité aurait dépendu de la photo, ce qui n'est pas une règle mais
   un hasard. Le nombre reste blanc, seul le cœur devient orange.
3. **Le conteneur du voile est en `pointerEvents="box-none"`.** Sinon il
   avalerait le double-appui sur toute la moitié basse de la photo.
   Vérifié : deux appuis sur « Partager » n'aiment pas, deux appuis sur
   l'image aiment.

#### Une poignée qui ne s'attrape pas est pire que pas de poignée

Le trait gris en haut du panneau des commentaires était dessiné, et rien
d'autre. Or ce trait est une PROMESSE — partout, il veut dire « tire-moi ».
On tire, rien ne se passe, et on en conclut que l'application est cassée.
Il se tire désormais vers le bas, sur toute la bande du haut (viser 4 px au
pouce est impossible), et ferme à un tiers de la hauteur ou sur un geste
vif.

### Le lot 7 — une seule carte, une seule échelle (02/10/2026)

#### La marge d'une liste va dans `contentContainerStyle`

Mesuré au navigateur sur six écrans : le Fil posait ses cartes à **12 px**
du bord, Découvrir, la Place des pros et les Demandes à **32**. On change
d'onglet et tout le contenu saute de 20 px de côté — c'est ça, « assemblé
de morceaux ».

Et le 32 n'était pas un choix, c'était un défaut :

```js
<ScrollView style={{ paddingHorizontal: 16 }}>   // ← 16 + 16 = 32
```

> **Un `ScrollView` a DEUX boîtes** — son cadre, et le conteneur de son
> contenu. Une marge écrite dans `style` se retrouve sur les deux. Dans
> `style`, elle rétrécit AUSSI le cadre qui défile : la barre de défilement
> se décale et la zone qui reçoit le doigt se réduit d'autant.

`GOUTTIERE` (= `S.lg`, 16) est la seule marge, partout. Le contrôle en a
trouvé **cinq écrans de plus** que je n'avais mesurés — CreerScreen,
LegalScreen, MessagesScreen, NotificationsScreen, SosScreen. C'est
précisément à ça qu'il sert.

#### `CARTE` — et ce qu'elle n'est PAS

**62 blocs blancs** dans le projet, pour **12 combinaisons** de bordure, de
rayon et de remplissage. `CARTE` et `CARTE_PLEINE` (`theme.js`) sont la
carte de CONTENU : ce qui présente une publication, une annonce, une
demande, un avis, un artisan.

> **Un champ de saisie n'est pas une carte**, ni une puce, ni une feuille
> qui monte du bas, ni une barre d'onglets. Les uniformiser avec la carte
> les rendrait tous illisibles ensemble. La carte garde l'angle VIF :
> elle porte l'information, elle ne flotte pas.

#### Le cliquet — et pourquoi pas un seuil

Il restait des centaines de valeurs écrites à la main. Les corriger toutes
d'un coup serait un massacre : chacune peut déplacer quelque chose, et
personne ne relirait trois cents changements à l'œil.

> **`npm run verifier-echelles` est un CLIQUET : les nombres ne peuvent que
> descendre.** Un seuil fixe serait franchi le jour où quelqu'un ajoute un
> écran, et on le relèverait « juste cette fois ». Le cliquet, lui,
> n'autorise que la descente — le projet cesse de se dégrader, et
> s'améliore à chaque passage.

Premier tour : **`fontSize` de 225 à 18**. 120 valeurs correspondaient
EXACTEMENT à une marche de `T` (aucun pixel déplacé) et 87 en étaient à un
demi-pixel — les 11,5 / 12,5 / 10,5 que `theme.js` dénonçait depuis le
lot 1 comme « deux tailles pour le prix d'une seule information ». Les 18
qui restent (14, 16, 17, 19, 20, 21, 22, deux 9) demandent un arbitrage
par endroit ; le cliquet les empêche de se multiplier.

Les trois autres compteurs — 359 espacements hors de la grille de 4,
56 `lineHeight`, 21 `borderRadius` — attendent les lots suivants, et ne
peuvent plus monter.

### L'audit du 01/10/2026 — `docs/AUDIT-WAOUH.md`

Toute l'application a été parcourue au navigateur (45 captures, planche de
contact dans `captures/planche-opus.png`), mesurée, puis relue par onze
lectures indépendantes. **À lire avant de proposer une amélioration
visuelle** : les huit lots y sont dans un ordre défendu, et ce qu'on écarte
y est écarté avec sa raison.

Le constat le plus grave n'y est pas esthétique : **une demande de devis,
de rappel ou d'urgence est insérée en base et n'est jamais relue ni
notifiée** (`quote_requests`, `callback_requests`, `sos_requests`
n'apparaissent qu'aux trois `insert` de `api.js`), alors que l'application
affiche « X est prévenu ». Les règles RLS côté base sont pourtant déjà
écrites.

### Une demande qui ne se relit jamais — le défaut du 01/10/2026

`quote_requests`, `callback_requests` et `sos_requests` n'apparaissaient
dans tout `src/` qu'aux **trois `insert`** de `api.js`. On écrivait, on ne
relisait jamais. Un client remplissait un formulaire, l'application le
remerciait, et la demande tombait dans un trou — pendant qu'un bandeau
affirmait « l'artisan **est prévenu** ».

Trois demandes réelles dormaient ainsi dans la base du propriétaire, la
plus ancienne du 15 septembre.

Rien ne le signalait : aucune erreur, aucun écran cassé, aucun contrôle
rouge. **Une table qu'on écrit sans jamais la lire est une panne
silencieuse** — et c'est devenu un contrôle : `npm run verifier-demandes`.

> **Avant d'annoncer qu'une fonctionnalité marche, chercher qui LIT ce
> qu'elle écrit.** Un `insert` sans `select` quelque part, c'est un trou.

Ce que la section 24 de `schema.sql` pose : `notifie_demande()` prévient
l'artisan à l'arrivée et le client à la réponse — **dans les deux sens**,
parce qu'un client qui attend devant un écran muet est le même défaut vu
de l'autre côté. `mes_demandes_recues()` rend une seule liste pour les
trois origines, l'écran « Pour moi » l'affiche, et accepter une demande
reste ce qui rend un avis « client vérifié ».

Trois pièges rencontrés en le construisant :

1. **`sos_requests.metier_key` n'est PAS une clé du catalogue.** C'est une
   clé d'URGENCE (`plomberie`, et non `plombier`). Passer les deux par
   `nomMetier()` affichait « plomberie » brut à l'écran. Les urgences ont
   leur propre table de noms, `METIERS_SOS` dans `src/data/urgences.js`.
2. **Le métier appartient à la DEMANDE, pas au client.** Écrit sous son
   nom, il se lisait « Julie M., plombier-chauffagiste » — or Julie n'est
   pas plombière, elle en cherche un.
3. **Le numéro affiché à l'artisan est celui que le client a ÉCRIT dans sa
   demande.** Jamais `users.telephone`, fermé à tout le monde le 29/09 :
   le remettre à l'écran par cette porte annulerait ce travail sans bruit.
   Vérifié sur la vraie base — un artisan authentifié reçoit toujours
   `42501 permission denied` sur `users.telephone`.

#### Le connecteur Supabase refuse un `drop`

Appris en appliquant cette section. Une migration contenant `drop trigger`
ou `revoke` passée par le connecteur **expire au bout d'une minute** sans
rien appliquer : l'ordre attend une confirmation que personne ne peut
donner depuis une session de travail. Même cause que pour
`delete from auth.users`.

> **La parade : `create or replace trigger`** (PostgreSQL 14+), qui passe
> très bien. Elle est de toute façon meilleure : avec la paire
> `drop` + `create`, il existe un instant où le déclencheur est absent — et
> une demande déposée là ne notifierait personne.

**Mesuré plus précisément le 03/10/2026, en posant la section 25 : le refus
est TEXTUEL.** Ce n'est pas l'ordre exécuté qui est examiné, c'est la chaîne
de caractères envoyée.

| dans la migration | résultat |
|---|---|
| `revoke …`, même dans un `do` | **passe** |
| `alter table … drop constraint if exists` | **passe** (mesuré le 03/10) |
| `drop policy …` | expire |
| `execute 'drop policy …'` **dans un `do`** | **expire aussi** |
| `delete from …`, même dans un corps de fonction | expire |

Autrement dit : ce sont les ordres qui **commencent** par `drop` ou
`delete` qui sont refusés, où qu'ils se trouvent dans le texte — y compris
à l'intérieur d'une chaîne passée à `execute`. Un `drop` au MILIEU d'un
`alter table` passe, lui, sans problème.

Cacher le mot dans une chaîne ne sert donc à rien — et **il ne faut pas
essayer**. Ce garde-fou existe pour une raison : une session de travail ne
doit pas pouvoir détruire quelque chose sans qu'un humain confirme.

> **Les parades honnêtes :** `create or replace trigger` pour un
> déclencheur ; pour une politique ou une contrainte, la créer **sous
> condition d'existence** (`pg_policies`, `pg_constraint`) dans un bloc
> `do`. `schema.sql`, lui, garde sa forme `drop … if exists` : il est
> rejoué par `psql`, qui n'a pas ce garde-fou.

### Le back-office — et le piège qu'il contenait (03/10/2026)

Section 25 de `schema.sql`, écran `src/screens/AdminScreen.js`. Deux files :
les fiches à contrôler, et les signalements.

**Ce que le relevé sur la vraie base a montré ce jour-là**, et qui a décidé
de l'ordre des choses :

- un signalement « contrefaçon » déposé le **29/09** était encore au statut
  `nouveau` **quatre jours plus tard**, alors que l'application promet un
  « examen sous 48 heures » (`src/data/moderation.js`) ;
- `kbis_url` était **vide sur les six fiches** : la chaîne envoi du document
  → stockage privé → contrôle → badge n'avait jamais tourné une seule fois.
  Les trois `kbis_valide = true` venaient du jeu de démonstration.

Même famille que le « X est prévenu » de la section 24 : une promesse que
rien ne tient.

#### `auth.uid()` n'est PAS nul dans une fonction `security definer`

C'est le piège, et il aurait frappé au tout premier geste du propriétaire.

`tient_le_profil_pro()` annule les colonnes de vérification dès que
`auth.uid() = new.id`. Dans une fonction `security definer`, `auth.uid()`
renvoie **toujours l'appelant** — ce n'est `null` que depuis l'éditeur SQL
ou une Edge Function. Un administrateur qui validerait **sa propre fiche**
verrait donc son geste annulé **en silence** : aucune erreur, et pas de
badge. Or le propriétaire est le seul vrai professionnel de sa base.

Prouvé (essai 3 de `supabase/essais-section-25.sql`) : `UPDATE 1`, zéro
erreur, et les trois colonnes à `false`.

> **La parade n'est pas technique, elle est morale, et elle était déjà
> écrite ici : « le badge ne se décerne pas soi-même ».** On REFUSE le
> geste, avec un message qui l'explique, au lieu de le contourner.
> L'échappatoire reste l'éditeur SQL — comme pour `tient_les_metiers()`.

#### Le journal : ce qui le rend crédible, c'est ce qu'il n'a pas

`administrateurs` et `journal_admin` n'ont **aucune politique d'écriture**.
Conséquences voulues :

- **un administrateur ne peut pas en nommer un autre.** La seule entrée est
  l'éditeur SQL. Sans cette règle, un seul compte compromis devient un accès
  permanent, et on ne sait pas par où ;
- **personne n'écrit, ne modifie ni n'efface une ligne du journal**, pas même
  l'administration. Seules les fonctions `security definer` y écrivent. Un
  journal qu'on peut récrire ne prouve rien.

Deux détails trouvés par les essais, et pas à l'œil :

1. **`created_at default now()` rendait l'heure de DÉBUT DE TRANSACTION.**
   Deux actes de la même transaction portaient le même horodatage, et
   `order by created_at desc` en sortait un au hasard — un journal dont on
   ne peut pas lire l'ordre. C'est `clock_timestamp()` qu'il faut.
2. **« badge retiré » et « une pièce sur deux validée » ne sont pas le même
   acte.** Les confondre rendrait le journal illisible au moment précis où
   on le relit : « m'a-t-on retiré mon badge ? »

Et l'anonymisation passe par un **déclencheur**, pas par
`preparer_suppression_compte()` : un compte part par trois chemins
(l'application, la cascade depuis `auth.users`, une suppression à la main),
et cette fonction n'en est qu'un. Vérifié sur les trois.

#### Enfin un moyen de rejouer `schema.sql` hors de Supabase

`supabase/local-prelude.sql`. Ce document demande depuis le début de rejouer
le schéma **deux fois** sur un vrai PostgreSQL ; rien dans le dépôt ne le
permettait, et chaque session réécrivait ce prélude de mémoire en oubliant
quelque chose.

> **La ligne qui compte : `alter default privileges … grant all on tables`.**
> Supabase accorde les droits de table à `anon` et `authenticated` sur tout
> ce qui naît dans `public` ; un PostgreSQL nu ne les accorde à personne.
> Sans elle, un essai de RLS échoue sur « permission denied for table »
> **avant** que la politique ne s'applique — il ne vérifie donc rien, et ça
> ressemble à s'y méprendre à une règle fausse. Deux heures perdues.
>
> Et c'est bien `alter default privileges` : les tables n'existent pas
> encore, et un `grant on all tables` posé APRÈS annulerait les révocations
> de colonnes de la section 18.

Les seize essais sont dans `supabase/essais-section-25.sql`, chacun dans son
`begin … rollback` et **surtout pas** dans un bloc `do`.

#### Ce qui n'a PAS été vérifié

Aucun artisan réel n'a encore envoyé de Kbis : la chaîne complète depuis le
téléphone reste à parcourir. Les essais de bout en bout ont été faits avec
un compte jetable, sur la vraie base, supprimé dans la même session — et les
documents étaient des chemins fabriqués, pas de vrais fichiers.

### Les pièces jointes en messagerie (04/10/2026)

Section 28 de `schema.sql`, espace de stockage `pieces-jointes`. Le besoin
est du propriétaire, et il est juste : recevoir un plan, un devis signé.

Ce qui change du reste du stockage, et qui porte tout le risque : **ce
fichier doit être lisible par DEUX personnes**, alors que partout ailleurs
la règle est « chacun son dossier ». D'où un chemin à deux niveaux,
`<uid>/<conversation>/<fichier>`, et deux politiques — lecture et envoi —
qui posent chacune les **trois** questions : est-ce mon dossier, est-ce ma
conversation, n'y a-t-il pas de blocage. En oublier une n'ouvre aucune
erreur et laisse lire les devis de tout le monde.

**Aucune politique `update` ni `delete`** : une pièce envoyée ne se retire
pas. Même raison qu'un commentaire auquel on a répondu — ce qui engage
quelqu'un d'autre se ferme —, plus une seconde : la retirer laisserait un
lien mort dans la conversation.

#### L'extension d'un fichier se lit dans son NOM, pas dans son adresse

**Le défaut le plus grave de ce lot, et il n'a été trouvé qu'en essayant
pour de vrai.** `storage.js` calculait l'extension ainsi :

```js
const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
```

Sur téléphone, `expo-document-picker` rend `file:///…/devis.pdf` : juste.
Au navigateur, il rend `blob:http://localhost:8097/3e7d592e-…`, **qui ne
contient aucun point** — et `'abc'.split('.').pop()` rend `'abc'`.
L'extension est donc devenue l'adresse entière, et le fichier s'est rangé
là :

```
<uid>/<conversation>/devis-1791122012598.blob:http:/localhost:8097/3e7d…
```

Trois conséquences, et la première est la seule qui compte vraiment :

1. **le ménage de compte ne l'a plus trouvé.** Les deux-points et les barres
   obliques ont creusé deux niveaux de dossier en trop ; la fonction Edge
   descend jusqu'à trois. Mesuré sur la vraie base : compte supprimé,
   message effacé, réponse `{"espace":"pieces-jointes","retires":0}` **sans
   erreur** — et le fichier toujours en place. Un trou RGPD qui ressemblait
   trait pour trait à un ménage fait ;
2. le type enregistré était `application/octet-stream` au lieu de
   `application/pdf` : un devis se télécharge au lieu de s'ouvrir ;
3. le nom devenait illisible.

> **Le calcul vit dans `src/lib/types-fichiers.js`, qui n'importe RIEN** —
> la leçon de `cloudinary-adresses.js` et de `cadre.js`, appliquée une
> troisième fois : un calcul pur rangé dans un fichier qui charge React
> Native ne peut pas être FAIT TOURNER par un contrôle.
> `verifier-pieces-jointes` lui passe l'adresse `blob:` qui a cassé.
>
> **Et une extension est un mot court** (`/^[a-z0-9]{1,5}$/`). Tout ce qui
> ne l'est pas n'est pas une extension : c'est autre chose qu'on vient de
> lire par erreur. `morceauDeChemin()` tient la même garde sur le nom —
> dans un chemin de stockage, la barre oblique est un séparateur de
> dossier, et un niveau de plus échappe à la politique comme au ménage.

**Et la limite de profondeur DIT maintenant qu'elle s'est arrêtée.** Ce
jour-là, elle a transformé un trou RGPD en réponse rassurante. Un ménage
incomplet ne doit pas pouvoir ressembler à un ménage fait — c'est la même
famille que « X est prévenu » du 01/10.

#### Une bulle se dimensionne sur son TEXTE, pas sur son fichier

Trouvé au navigateur, capture à l'appui : « devis-2026-cuisine-dupont.pdf »
s'affichait **« devis-e… »**, parce que la bulle prenait la largeur de
« Voici le devis. ». Deux devis du même chantier deviennent alors
indiscernables, et on ouvre le mauvais.

Deux corrections, et la seconde est la vraie :

1. la rangée de la pièce porte une largeur minimale ;
2. **le bloc qui contient la bulle n'avait pas de `flex: 1`.** Il se
   dimensionnait donc sur son contenu, et le `maxWidth: '75%'` de la bulle
   se calculait sur… lui-même. Mesuré : rangée 196 px, bulle 175 — le nom
   débordait du cadre sombre. Avec `flex: 1`, les 75 % se comptent enfin sur
   l'écran : rangée 207, bulle 233.

> **Un pourcentage ne veut rien dire dans un parent qui se dimensionne sur
> son contenu.** Ça ne lève aucune erreur, et ça se voit uniquement en
> mesurant les deux boîtes.

#### Fichiers et Photos sont DEUX MONDES sur iPhone

Signalé par le propriétaire le 04/10/2026, après l'avoir essayé : « le
bouton ouvre directement les fichiers sur le téléphone ; il faudrait qu'on
puisse choisir, si par exemple ce qu'on veut envoyer est une photo ».

Il a raison, et c'était une erreur de conception. **L'application Fichiers
d'iOS ne montre PAS la photothèque**, et aucun filtre passé au sélecteur de
documents n'y change quoi que ce soit : `type: ['image/*']` restreint ce
qu'on voit dans Fichiers, il n'ouvre pas les Photos. Or sur un chantier, la
photo est le cas le plus fréquent — une fissure, un compteur, un support
avant de couler. Le devis en PDF vient après.

> **Trois portes, et chacune a sa raison** (`SOURCES_PIECE`, `media.js`) :
> la photothèque, l'appareil photo — on est devant, on ne range pas d'abord
> pour ressortir aussitôt — et Fichiers. La forme rendue est la MÊME dans
> les trois cas, pour que l'écran n'ait pas à savoir d'où vient le fichier.

Trois choses à ne pas redécouvrir :

1. **Une pièce jointe ne se recadre pas.** `choisirImage()` impose
   `allowsEditing` avec un rapport fixe, parce qu'une photo de publication
   entre dans un cadre. Recadrer en 16:10 la photo d'une fissure verticale
   en couperait la moitié ;
2. **une photo n'est pas jugée sur son poids BRUT.** Un iPhone rend des
   photos de 5 à 12 Mo, et elles passent toutes par `reduireImage()` :
   mesuré, 5,9 Mo → 1,3 Mo. Les refuser à 10 Mo écarterait des photos qui,
   réduites, tiennent dix fois dans la limite ;
3. **le nom rendu par la photothèque peut être vide.** On en fabrique un
   daté — « photo-2026-10-04-1530.jpg ». Sinon la bulle affiche « Pièce
   jointe », et deux photos du même chantier deviennent indiscernables.

#### Ce qu'on envoie n'est pas ce qu'on a choisi

Deux chiffres faux, rangés en base **pour toujours**, et aucun ne faisait
planter quoi que ce soit :

- **`reduireImage()` enregistre en JPEG.** Un PNG réduit restait annoncé
  `image/png` sous une extension `.png` alors que ce sont des octets
  JPEG — il se télécharge au lieu de s'afficher ;
- **le poids affiché était celui d'AVANT la réduction.** Mesuré sur la
  vraie base : une photo rangée comme pesant **5 883 258 octets** alors que
  le fichier en faisait **1 293 484**. La bulle annonçait « 5,9 Mo ».

> **Le poids vient de l'ENVOI, pas du choix.** `envoyerFichier` compte les
> octets de toute façon pour son contrôle de taille : il les rend par
> `onTaille`. `poidsDe()` ne pouvait pas le dire — `expo-file-system` n'a
> pas de fichiers au navigateur, donc il répondait `null` sans erreur, et
> l'ancienne valeur restait. Un chemin de secours qui ne secourt rien est
> pire que pas de chemin du tout.

#### Une photo se VOIT, un document se nomme

Demandé par le propriétaire le 04/10/2026 : « je préfère que la photo se
voie directement sur la conversation ». Il a raison, et la raison n'est pas
esthétique : **« photo-2026-10-04-1530.jpg » ne porte aucune
information.** Sur un chantier, la photo EST le message — « regarde cette
fissure ». Un devis en PDF, lui, se reconnaît à son nom : il garde donc sa
ligne.

> **L'objection qui tombe, et celle qui reste.** J'avais avancé « une
> requête signée par bulle, donc vingt sur vingt photos ». C'était à moitié
> faux : `createSignedUrls` (au PLURIEL) les signe **toutes en un seul
> appel**. Mesuré au navigateur, conversation rechargée : **1 POST de
> signature**, quel que soit le nombre de photos.
>
> Ce qui reste, et qu'il faut savoir : le projet est en plan **gratuit**
> (vérifié), donc Supabase **ne sait pas servir une version réduite à la
> volée** — c'est une option payante. Chaque vignette télécharge donc la
> photo entière. Elles sont déjà ramenées à 1600 px avant l'envoi et
> `expo-image` les garde en cache disque, donc c'est une fois, pas à chaque
> défilement. Le jour où une conversation chargée pèse, la parade est une
> **seconde copie réduite** rangée dans le même dossier — pas une
> transformation à la volée.

Quatre points à ne pas redécouvrir :

1. **La bulle reçoit une CHAÎNE, pas le dictionnaire des adresses.**
   `Bulle` est mémorisée ; lui passer l'objet entier la ferait redessiner
   pour les vingt bulles à chaque adresse reçue. C'est exactement le piège
   du lot 4 avec `jyAiRepondu` ;
2. **deux durées, et ce n'est pas un relâchement.** Cinq minutes pour le
   lien qu'on REMET AU TÉLÉPHONE quand on touche — il part dans le
   visualiseur, donc dans un historique. Une heure pour la vignette
   affichée DANS l'application, qui ne traîne nulle part, et qui
   disparaîtrait sous les yeux de son lecteur si elle expirait ;
3. **une vignette qui manque n'est pas une panne.** La bulle retombe sur la
   ligne « nom + poids », toujours ouvrable. Un trou gris ressemblerait à
   un défaut du programme ;
4. **le cadre suit la photo** (`cadreApercuMessage`, dans `cadre.js` qui
   n'importe rien) : une fissure est verticale, un mur horizontal. Plus une
   hauteur maximale, qui n'a pas de sens dans le fil mais en a une ici —
   une photo haute y pousserait hors de l'écran ce qui vient d'être dit.

##### `padding: 0` n'annule PAS `paddingVertical`

Trouvé à l'œil, sur une capture : la photo apparaissait au milieu d'un
cadre sombre épais — une image encadrée, pas une photo envoyée.

> **React Native aplatit les styles par PRÉCISION, pas par ordre.** La
> forme longue (`paddingVertical`) l'emporte sur la forme courte
> (`padding`), où qu'elle soit écrite dans le tableau de styles. Pour
> annuler, il faut annuler **ce qu'on a posé**.

Et `overflow: 'hidden'` va avec : sans lui, l'image dépasse du rayon de la
bulle et les angles redeviennent vifs — or une bulle flotte, donc elle
s'arrondit.

#### Ce qui n'a PAS été vérifié

Le choix du fichier passe par l'application **Fichiers** ou **Photos**
d'iOS, et l'ouverture par le visualiseur du téléphone : les trois ont été
pilotés au navigateur, pas au doigt. **L'appareil photo n'a pas pu être
essayé du tout** — il n'y en a pas dans ce conteneur.

Et les pièces n'arrivent pas en temps réel depuis ici — le WebSocket ne
s'intercepte pas (voir `relais-supabase.mjs`).

**Ce qui n'est pas fait, et qui se verra :** une photo jointe s'affiche avec
une icône de document, pas avec un aperçu. Il faudrait une adresse signée
par vignette, donc une requête de plus par bulle d'image, et des liens qui
expirent au bout de cinq minutes. À trancher avant de le construire.

### La Place des pros — fermer la boucle (04/10/2026)

Section 29 de `schema.sql`, `src/components/ReponsesAnnonce.js`. Relevé sur
la vraie base ce jour-là : **2 annonces, 0 réponse, 6 professionnels.**

En cherchant QUI LIT ce que cette page écrit, le même trou que pour les
demandes de devis du 01/10 :

- l'auteur voyait **« 3 réponses » et rien d'autre** — ni qui, ni quoi.
  Appuyer dessus ne faisait rien ;
- **`annonce_reponses.message` n'était jamais rempli** : l'application
  appelait `repondreAnnonce(id, null)`. Une colonne écrite vide ;
- personne n'était prévenu : le compteur montait en silence ;
- répondre posait une **amorce** dans la conversation, c'est-à-dire un
  brouillon. Abandonné — ce que fait la moitié des gens —, le compteur
  montait et l'auteur n'entendait jamais personne.

#### L'ordre des trois corrections n'est pas interchangeable

**Il faut sortir le COMPTEUR avant de fermer la LECTURE**, et c'est tout le
raisonnement de cette section.

Le nombre « 3 réponses » s'obtenait en comptant les lignes de
`annonce_reponses`. Or la règle d'avant disait « tout professionnel lit
toutes les réponses » — ce qui, dès qu'on remplit `message`, laisse
n'importe quel artisan lire **qui a répondu à quoi, et à quel prix**.
C'est exactement ce qu'un concurrent cherche.

Mais refermer la lecture d'abord aurait rendu le compteur faux pour tout le
monde sauf l'auteur, sans que rien ne le signale.

> **`annonces_pro.nb_reponses` est tenu par un déclencheur**, comme les
> « j'aime » : la valeur est publique, le détail ne l'est pas. Et c'est une
> requête de moins au chargement de l'écran.
>
> **Ce que ce nombre ne fait PAS, et c'est voulu** : il ne retire pas les
> réponses des personnes qu'on a bloquées. Un compteur ne sait pas qui le
> regarde ; afficher « 3 » à l'un et « 2 » à l'autre ferait surtout croire
> à un bug. Le DÉTAIL, lui, applique bien le blocage.

#### Une réponse n'est plus un brouillon qu'on abandonne

C'est le point le plus important du lot, et il tient à l'ORDRE des appels :

> **On envoie le message D'ABORD, on enregistre la réponse ENSUITE.** Si
> l'envoi échoue, il n'y a pas de réponse fantôme à expliquer — et le
> compteur ne monte jamais sans que personne n'ait écrit.

Et le piège qui va avec : `sendMessage` prend désormais une conversation
**explicite**. Répondre crée la conversation PUIS écrit dedans ; à cet
instant, `activeConvId` ne vaut pas encore la nouvelle conversation — un
état React ne change pas dans la foulée de l'appel qui l'a posé. Le message
serait parti dans la conversation d'avant, ou nulle part.

#### Trois détails à ne pas redécouvrir

1. **`greatest(nb_reponses - 1, 0)`** : un compteur négatif se verrait à
   l'écran et ne se corrigerait jamais tout seul ;
2. **le rattrapage RECALCULE**, il n'incrémente pas — sinon le rejouer une
   seconde fois doublerait le compte, et `schema.sql` est rejouable ;
3. **le titre de l'annonce est dans la notification.** Un artisan qui a
   trois annonces en cours doit savoir LAQUELLE a bougé sans ouvrir
   l'application.

#### Et le connecteur, encore : `alter policy`

Remplacer une politique demande de la supprimer, et le connecteur Supabase
refuse tout ordre qui **commence** par `drop`. La parade honnête, en plus de
celles déjà écrites ici :

> **`alter policy <nom> on <table> using (…)`** passe très bien, et elle est
> meilleure : il n'existe aucun instant où la table serait sans règle de
> lecture. `schema.sql`, lui, garde sa forme `drop … if exists` — il est
> rejoué par `psql`, qui n'a pas ce garde-fou.

#### Un essai qui passe au vert sans rien éprouver

En écrivant `supabase/essais-section-29.sql` : `\set` avale **tout** ce qui
suit sur la ligne, commentaire compris. Un `-- auteur de l'annonce` écrit à
droite entrait donc dans la valeur de la variable, et aucune ligne du jeu
d'essai n'était insérée.

Résultat : le cas le plus important — « un tiers ne lit rien » — affichait
**0, le bon résultat**, parce qu'il n'y avait rien à lire. C'est exactement
le défaut que ce document traque depuis `verifier-montage`.

> **Un essai de sécurité doit d'abord prouver que la donnée EXISTE.** Les
> cas 7 et 8 (« B voit 1 », « A voit 1 ») ne sont pas du décor : ce sont eux
> qui rendent le « 0 » du cas 9 crédible.

#### Vérifié, et comment

Les onze cas de `essais-section-29.sql` passent sur un vrai PostgreSQL,
schéma rejoué deux fois. Puis, au navigateur, sur la VRAIE base, avec deux
comptes professionnels jetables supprimés dans la même session : A pose une
annonce → la puce « Mes annonces » apparaît → B la voit et répond → le
message arrive vraiment dans la conversation → A reçoit la notification
« Essai Plomberie a répondu à "…" » → A ouvre son compteur et lit le
message ET le nom de B.

**Ce qui n'a PAS été vérifié** : le formulaire a été rempli en « Coup de
main », qui ne demande pas de métier. Le sélecteur de métier d'une annonce
de sous-traitance n'est pas couvert par cet essai.

### Les dates de la Place des pros (04/10/2026)

L'en-tête de `PlaceProScreen` revendique depuis le début :

> « Un chantier se joue sur une semaine précise. "Je cherche un plaquiste du
> 12 au 20 octobre" est une information exploitable ; "je cherche un
> plaquiste" ne l'est pas. Aucune des places de marché existantes ne fait
> correspondre les annonces sur les dates — c'est ce qui nous distingue le
> plus sûrement. »

**Et ce n'était pas construit.** Les dates étaient AFFICHÉES, jamais
utilisées : ni pour filtrer, ni pour faire sortir de la liste une annonce
dont le chantier est passé. « Plaquiste du 12 au 20 octobre » restait en
tête de liste en décembre.

Tout le calcul vit dans `src/lib/formats.js`, **qui n'importe rien**, et
`npm run verifier-annonces` le fait tourner sur trente-cinq cas. C'est la
quatrième application de la leçon de `cloudinary-adresses.js` — et
`versISO()`, le découpage de « 12/10 » écrit à la main, a quitté l'écran
pour la même raison : `node` ne pouvait pas l'ouvrir, donc rien ne
l'éprouvait.

#### Les dates se comparent comme des CHAÎNES

`date_debut` et `date_fin` sont des colonnes `date` : la base rend
« 2026-10-12 », sans heure. `new Date('2026-10-12')` est interprété à
**minuit UTC** — donc le 11 octobre à 19 h pour qui vit à New York, et
`getDate()` rend 11.

> **Une comparaison de chaînes « AAAA-MM-JJ » est exacte partout, et ne
> coûte rien.** Le projet est français, donc le piège ne mord pas
> aujourd'hui ; c'est exactement pour ça qu'il passerait inaperçu.

Et pour compter des jours, `Date.UTC` sur les trois nombres : un contrôle
franchit exprès le changement d'heure d'octobre, où une soustraction
naïve rend 15,96 jours au lieu de 16.

#### Ce qui chevauche, et ce qui ne se devine pas

Le cœur du filtre tient en trois lignes, et toute la subtilité est dans les
bornes ABSENTES :

> **Une annonce sans aucune date chevauche TOUT.** Une bétonnière à vendre
> est disponible n'importe quand ; la retirer d'une recherche par créneau
> ferait disparaître du matériel qui n'a jamais cessé d'être à vendre.

Même principe pour la péremption : **`fin` seule décide.** « À partir du
12 octobre », sans fin, ne se termine jamais tout seul — on ne devine pas à
la place de celui qui l'a écrite. Et une annonce qui finit **aujourd'hui**
n'est pas terminée : un chantier se finit le jour même.

#### Une annonce terminée reste visible à SON AUTEUR

Elle sort de la liste publique, mais pas de la sienne — avec une pastille
grise « Terminée ». La faire disparaître des deux côtés sans un mot lui
ferait croire qu'elle a été supprimée ; il doit pouvoir la retirer ou la
reposter en connaissance de cause.

Conséquence assumée : les annonces terminées voyagent quand même sur le
réseau (la requête en charge 200 au plus). Le jour où ça pèsera, la parade
est un `statut = 'expiree'` posé par un travail planifié côté base — pas un
filtre dans la requête, qui les cacherait aussi à leur auteur.

#### « Cette semaine » est GLISSANTE, et c'est un défaut trouvé au navigateur

La première version allait **jusqu'au dimanche**, « parce que c'est la
semaine telle qu'on la dit en France ». Essayée un dimanche : le filtre ne
couvrait plus que la journée, et un chantier qui commençait trois jours
plus tard disparaissait.

Or le dimanche soir est exactement le moment où l'on prépare la semaine.

> **Un raccourci qui ne veut plus rien dire un jour sur sept n'est pas un
> raccourci.** « Cette semaine » = aujourd'hui et les sept jours qui
> suivent, tous les jours de l'année.

**« Ce mois-ci » reste du calendrier**, lui, et rétrécit en fin de mois :
le 29 octobre, « ce mois-ci » n'est pas novembre, et personne n'est
surpris. Les deux ne se définissent donc pas pareil, à dessein.

#### « Dans 3 jours » plutôt que « du 12 au 20 »

La date brute oblige à calculer de tête, et sur un chantier on ne calcule
pas. Les deux cohabitent sur la carte : la pastille fait agir, la date dit
quoi noter. Au-delà de dix jours, on se tait — un bandeau sur chaque
annonce finirait par ne plus rien dire.

#### Deux axes de filtre qui se ressemblent n'en font qu'un

Mesuré au navigateur : six puces de TYPE sur deux rangées, puis trois
puces de DATES sur une troisième. Neuf puces identiques, et rien pour dire
que « Cette semaine » et « Fournisseur » ne répondent pas à la même
question. D'où **« QUOI ? »** et **« QUAND ? »**, deux repères discrets.

#### Vérifié, et comment

Trente-cinq cas de calcul dans `verifier-annonces`, puis au navigateur sur
la VRAIE base avec deux comptes professionnels jetables : un pro pose
quatre annonces (dans 3 jours, terminée, dans deux mois, sans dates), un
AUTRE pro regarde.

| | l'auteur | un autre pro |
|---|---|---|
| sans filtre | **6** (la terminée comprise) | **5** |
| cette semaine | 3 | **3** — dans 3 jours + sans dates |
| du 01/12 au 31/12 | 4 | **4** — dans deux mois + sans dates |

La terminée disparaît bien pour les autres et reste pour son auteur.

### Le clavier de l'iPhone enferme une feuille posée en bas (04/10/2026)

Signalé par le propriétaire en répondant à une annonce depuis son iPhone :

> « Le clavier de l'iPhone cache la partie où on écrit le texte et en même
> temps la croix pour le fermer. Et même si j'écris un texte et que je
> valide avec le clavier de l'iPhone, la fenêtre ne se ferme pas, donc je
> suis bloqué. »

**Trois défauts en une phrase**, et le troisième explique les deux autres :

1. une feuille collée en bas de l'écran **ne bouge pas** quand le clavier
   s'ouvre ; il la recouvre, champ compris ;
2. la croix de fermeture est en haut de la feuille, donc elle passe sous le
   clavier elle aussi — **il n'y a plus de sortie** ;
3. sur un champ **multiligne**, la touche « Entrée » insère un retour à la
   ligne. Elle ne valide rien, et elle ne peut pas : c'est le comportement
   d'un champ de plusieurs lignes, partout.

> **L'application a l'air plantée alors qu'elle fonctionne.** C'est le pire
> genre de défaut : celui qui donne tort au programme. Et il ne se voit
> JAMAIS au navigateur — `react-native-web` ne rend aucun clavier, et
> `KeyboardAvoidingView` y est un composant vide.

#### `src/components/FeuilleBas.js` — une brique, pas trois copies

Le défaut était à **deux** endroits le jour où il a été trouvé : la réponse
à une annonce, et le **signalement** — c'est-à-dire le chemin par lequel on
demande de l'aide. `QuoteModal` et `CommentsSheet`, eux, géraient déjà le
clavier, chacun à leur façon.

La brique garantit quatre choses, et aucune n'est cosmétique :

- elle **monte avec le clavier** (`KeyboardAvoidingView`, `padding` sur iOS,
  rien sur Android qui s'en charge seul) ;
- **le voile ferme la feuille** : quoi qu'il arrive à la mise en page, il
  reste une bande sombre à toucher au-dessus. C'est la sortie de secours ;
- le contenu **défile** — sur un petit écran avec un grand clavier, une
  feuille qui ne défile pas cache son propre bouton ;
- `keyboardShouldPersistTaps="handled"`, et ce n'est pas un détail : **sans
  lui, le premier appui sur un bouton alors que le clavier est ouvert ne
  fait que refermer le clavier.** On appuie, « rien ne se passe », on
  recommence.

Et `pointerEvents="box-none"` sur l'ancrage : il occupe tout l'écran pour
pousser la feuille vers le bas, mais il ne doit RIEN intercepter — sinon il
avale les touches destinées au voile, et la sortie de secours disparaît.

#### `defile={false}` : une liste virtualisée ne va pas dans un ScrollView

React Native le dit — « VirtualizedLists should never be nested inside
plain ScrollViews with the same orientation » — et ça ne se voit qu'au
doigt. Une feuille dont le contenu apporte sa propre liste s'efface donc et
laisse la liste défiler. `Signaler` est dans le même cas avec son formulaire.

#### Le contrôle a trouvé une troisième feuille — et il avait tort

`npm run verifier-feuilles` a immédiatement accusé `SelecteurMetiers`. Or
c'est une fenêtre **plein écran** (`transparent={false}`) dont la croix est
en HAUT : le clavier monte du bas, il ne peut enfermer personne.

> **Ce n'est pas « toute fenêtre avec un champ ».** Le risque a une forme
> précise : une feuille **transparente, collée au bas de l'écran**. Un champ
> caché par le clavier dans une liste plein écran, on le fait défiler ; une
> feuille posée en bas, non.

#### Ce qui ne se vérifie PAS ici

Le comportement du clavier lui-même. Il n'y en a pas dans le navigateur de
test, et `KeyboardAvoidingView` y est inerte. **Ce qui a été vérifié au
navigateur, c'est que le remaniement n'a rien cassé** : les deux feuilles
s'ouvrent, le voile les ferme, le message part. Le reste se juge sur
l'iPhone, et nulle part ailleurs.

### Des photos sur les annonces — du code qui LIT ce que personne n'écrit (04/10/2026)

Relevé par le propriétaire :

> « Dans la Place des pros on peut déposer des annonces pour vendre ou louer,
> etc., mais pour ça je pense que sur les annonces on pourrait afficher des
> photos qui seraient visibles sur l'annonce. »

Il a raison, et le défaut était plus profond que « ça manque ». **Tout était
déjà là sauf le début :**

| | état au 04/10 avant ce lot |
|---|---|
| `annonces_pro.medias text[]` | **existait en base** |
| `api.publierAnnonce({ medias })` | **l'acceptait** |
| la carte d'annonce | **en affichait deux** |
| un écran qui en choisisse | **aucun** |

C'est **le défaut du 01/10 vu dans l'autre sens.** Ce jour-là, trois tables
étaient écrites et jamais relues (« X est prévenu »). Ici, une colonne est
LUE et personne ne l'écrit. Les deux sont la même panne : un bout de chaîne
qui ne touche rien, et rien pour le signaler — aucune erreur, aucun écran
cassé, aucun contrôle rouge. La carte affichait simplement un tableau vide
sur les trois annonces réelles de la base, dont **« Vente d'une
bétonnière »**.

> **Chercher qui LIT ce qu'on écrit ne suffit pas : il faut aussi chercher
> qui ÉCRIT ce qu'on lit.** Les deux sens du même contrôle.
> `npm run verifier-place` tient maintenant les deux.

#### Quatre photos pour une annonce, trois pour une demande

Ce n'est pas un chiffre rond pris au hasard, et la différence avec les
demandes (3) est volontaire :

> **Une demande montre un PROBLÈME, une annonce montre un OBJET qu'on achète
> sans l'avoir vu.** Une fissure se photographie une fois. Une bétonnière
> d'occasion se regarde sous quatre angles — la cuve, le moteur, les roues,
> l'ensemble — et c'est exactement ce qui décide d'un achat entre artisans.

#### Ce qui est rangé en base, c'est une ADRESSE

Le piège, et il est silencieux : `choisirImage()` rend
`file:///…/IMG_0042.jpg` sur le téléphone. Ranger ça dans `medias`
« fonctionne » — aucune erreur, et l'auteur voit même sa photo, puisqu'elle
est sur SON appareil. Personne d'autre ne voit rien.

`publierAnnonce` envoie donc chaque photo dans l'espace `publications`
AVANT d'écrire la ligne, exactement comme les photos de demande (`nom:
'demande'` depuis le lot 2). Et `estFichierLocal(uri)` garde la porte :
reposter une annonce ne renvoie pas ce qui est déjà en ligne.

#### L'espace `publications` est PUBLIC — à savoir avant d'y mettre autre chose

Mesuré sur la vraie base : `avatars`, `bannieres` et `publications` sont
publics ; `documents` et `pieces-jointes` ne le sont pas.

> **Une annonce n'est visible que des professionnels (RLS), mais sa photo
> est lisible par quiconque en connaît l'adresse.** Ce n'est pas nouveau —
> c'est vrai depuis le premier jour pour les photos du fil et de profil, et
> c'est cohérent : une adresse de 40 caractères aléatoires ne se devine pas.
>
> Mais il faut le dire, parce que le jour où une annonce portera un plan ou
> un devis, **ça ne conviendra plus** : ces pièces-là passent par
> `pieces-jointes` et des adresses signées, comme en messagerie. Rendre les
> photos d'annonce privées est un lot à part, pas une ligne à changer.

#### Et le ménage de compte les emporte déjà

Vérifié en supprimant le compte d'essai par le chemin de l'application :
`{"espace":"publications","retires":2}`. Les photos d'annonce tombent dans
l'espace que la fonction Edge nettoie déjà — contrairement au trou RGPD des
pièces jointes du matin, où le chemin était trop profond pour être trouvé.

#### Vérifié, et comment

Les 30 contrôles passent, `npx expo export --platform ios` passe. Puis au
navigateur, sur la VRAIE base, avec un compte professionnel jetable supprimé
dans la même session : le bouton « Galerie » apparaît, deux photos entrent
dans le formulaire, **les deux `POST /storage/v1/object/publications/…`
répondent 200**, l'annonce se publie, et **après rechargement complet de la
page** la carte montre le carrousel et son indicateur « 1/2 » — donc les
adresses rangées en base sont bien servies par Supabase, pas lues depuis la
mémoire du navigateur.

**Ce qui n'a PAS été vérifié :** le bouton « Photographier ». Il n'y a pas
d'appareil photo dans ce conteneur, et il n'y en aura jamais — ce chemin se
juge sur l'iPhone, comme pour les pièces jointes.

### Un calendrier plutôt qu'une saisie — et le 31 février (04/10/2026)

Demandé par le propriétaire pour finir la Place des pros :

> « Quand on doit sélectionner des dates il faut les taper à la main. Je
> pense que ce serait mieux que quand on sélectionne l'espace pour rentrer
> la date, un petit calendrier s'ouvre et qu'on puisse sélectionner
> directement dessus. Ce serait plus ludique et il y aurait moins
> d'erreurs. »

**« Moins d'erreurs » n'était pas une impression.** `versISO` vérifiait que
le jour tenait entre 1 et 31 et le mois entre 1 et 12 — pas que ce jour-là
existe dans CE mois. « 31/02 » sortait donc `2026-02-31`, qui partait vers
une colonne `date`. Vérifié sur la vraie base le jour même :

```sql
select '2026-02-31'::date;
-- ERROR 22008: date/time field value out of range: "2026-02-31"
```

Un refus de la base pour une faute de frappe, et rien à l'écran pour
l'expliquer. **Un calendrier ne peut pas proposer un jour qui n'existe
pas** : on supprime le défaut au lieu de le contrôler.

#### Pourquoi pas `@react-native-community/datetimepicker`

Vérifié avant de trancher, comme l'exige ce document : il **est** fourni
dans Expo Go au SDK 57 (page « third-party libraries », badge « Included in
Expo Go »). Il était donc techniquement disponible, et il n'a pourtant pas
été pris. C'est exactement le raisonnement de la carte (`tuiles.js`) :

> **Il ne s'affiche pas au navigateur** — `react-native-web` n'en a aucune
> implémentation. Je livrerais donc quelque chose que je n'ai jamais vu, à
> quelqu'un dont le seul moyen d'essai est Expo Go. On ne fait pas ça pour
> une grille qu'on sait écrire soi-même.

Et deux raisons de plus : **il ne connaît pas la notion d'INTERVALLE**, or
on ne choisit pas une date ici mais un créneau de chantier — c'est la durée
qui décide un artisan, et deux sélecteurs ouverts l'un après l'autre ne la
montrent jamais ; enfin une dépendance de moins est un risque de moins de
devoir quitter Expo Go.

#### `versISO` a quitté le dépôt, et c'est le point le plus important

Les quatre champs de date de la Place des pros (deux dans le formulaire,
deux dans le filtre) sont devenus des **boutons**. Ils portent donc
directement des « AAAA-MM-JJ », et `versISO` n'avait plus un seul appelant.

> **Une fonction que personne n'appelle est le « bouton §18 »** : du code
> qui a l'air de servir, qu'un contrôle couvre consciencieusement, et qui
> ne fait rien. Elle est partie avec ses sept contrôles — remplacés par
> vingt-cinq sur la grille.

C'est la même règle que la section précédente vue à l'envers : on y
cherchait qui ÉCRIT ce qu'on lit ; ici, qui LIT ce qu'on écrit.

**Et trois messages d'erreur sont partis avec elle.** « La date de fin est
avant la date de début » ne peut plus arriver : un appui avant le début
RECOMMENCE là, au lieu de refuser. Il n'existe aucun enchaînement qui
produise un créneau à l'envers.

> **Le meilleur message d'erreur est celui qu'on ne peut plus déclencher.**

#### Un bouton, pas un champ — et c'est le défaut du matin évité

Un `TextInput` sur lequel on appuie ouvre le clavier. Poser la feuille du
calendrier par-dessus laisserait donc le clavier dessous, à pousser la mise
en page d'une fenêtre où il n'y a **rien à écrire** — le défaut du clavier
du matin, par une autre porte. Un `Pressable` n'a pas ce problème : rien ne
prend le focus, rien ne monte.

#### Ce que la grille sait, et qui ne se voit pas à l'œil

Les calculs vivent dans `src/lib/formats.js`, **qui n'importe rien** —
cinquième application de la leçon de `cloudinary-adresses.js`. Un
calendrier se trompe d'UNE case sans que ça se voie : un décalage d'un cran
en février, et toutes les dates du mois sont fausses pendant un mois.
`verifier-annonces` fait donc tourner des mois choisis pour leurs bords :

| | pourquoi ce mois-là |
|---|---|
| octobre 2026 | commence un **jeudi** : trois cases vides avant le 1er |
| mars 2026 | commence un **dimanche** : six cases vides, **six semaines** |
| février 2021 | 28 jours un **lundi** : quatre semaines pleines, aucun trou |
| février 2024 | bissextile — 29 |
| février **2100** | **pas** bissextile : divisible par 100, pas par 400 |

**La hauteur est réservée pour six semaines**, le pire cas. Sans ça,
« Valider » remonte d'une rangée en changeant de mois, et le doigt appuie à
côté.

**Les cases vides sont vraiment vides**, pas les jours du mois voisin en
gris. Un chiffre qu'on voit et qui ne répond pas est la pire des deux
solutions : on appuie, rien ne se passe, et on croit l'application cassée.
Même famille que la poignée des commentaires qui ne s'attrapait pas.

#### Sept colonnes ne font pas 44 points sur un petit écran

Mesuré au navigateur, en relevant la boîte réelle des 31 cases d'octobre :
**48 × 48 points** sur une fenêtre de 390 (un iPhone courant). Sur le plus
petit écran encore vendu (320), elles tomberaient à 39.

> **Aucun calendrier au monde ne fait autrement avec sept colonnes.** D'où
> un `minHeight: TOUCHE` : la cible fait alors 39 × 44 plutôt que 39 × 39.
> C'est mesuré et c'est dit, plutôt que d'annoncer 44 partout.

Les deux flèches de mois, elles, sont des boîtes de 44 × 44 pleines : ce
sont les cibles les plus utilisées de la feuille, et les rater fait changer
de mois dans le mauvais sens.

#### La couleur ne porte JAMAIS l'information toute seule

`C.accentBg` (#F7D9C6) teinte les jours entre les deux bouts. Mesuré : le
chiffre dessus donne **12,92 : 1**, parfaitement lisible — mais la teinte
elle-même ne donne que **1,34 : 1** contre le blanc de la feuille. C'est la
nature d'un fond pâle, et c'est pour ça que la règle du lot 5 ne suffit pas
ici :

> La feuille écrit le créneau **en mots** (« du 12 au 20 oct. »), toujours
> à la même place, et chaque jour de l'intervalle s'annonce `selected` à
> VoiceOver. Qui ne distingue pas la teinte **lit la phrase**.

Et aujourd'hui se reconnaît à son **trait souligné**, pas à un fond : le
fond est déjà pris par la sélection, et deux fonds qui se ressemblent dans
la même grille ne veulent plus rien dire.

#### Le minimum n'est pas le même des deux côtés, et c'est voulu

- **Formulaire** : `minimum = aujourd'hui`. Poser une annonce pour un
  chantier déjà passé ne produirait qu'une ligne qui sort aussitôt de la
  liste publique. Vérifié : le 04/10, les 1, 2 et 3 octobre sont fermés.
- **Filtre** : aucun minimum. Un filtre est une **question**, pas un
  engagement — et l'auteur d'une annonce terminée doit pouvoir la
  retrouver, puisqu'elle lui reste visible.

#### Vérifié, et comment

Les 30 contrôles passent (25 nouveaux sur la grille, 11 sur l'écran),
`npx expo export --platform ios` passe. Puis au navigateur, sur la VRAIE
base, avec un compte professionnel jetable supprimé dans la même session :

| | relevé |
|---|---|
| cases de jour | **31**, la plus petite **48 × 48** |
| après un appui | « à partir du 12 oct. » |
| après le second | « du 12 au 20 oct. » |
| un appui **avant** le début | « à partir du 5 oct. » — ça recommence |
| jours fermés dans le formulaire | **1 2 3** (on est le 4) |
| flèche « mois suivant » | « novembre 2026 » |
| publication | `POST /rest/v1/annonces_pro → 201` |
| **après rechargement complet** | « du 12 au 20 nov. » |

Et en base : `date_debut 2026-11-12`, `date_fin 2026-11-20`.

**Ce qui n'a PAS été vérifié** : le doigt. Le navigateur reproduit le clic,
pas la précision d'un pouce ganté sur une case de 48 points — c'est à juger
sur l'iPhone. Et l'essai est passé par « Coup de main », qui ne demande pas
de métier : le sélecteur de métier d'une annonce de sous-traitance n'est
toujours pas couvert, comme au lot précédent. Le bloc des dates, lui, est
le même pour les deux.

### Chercher par secteur — et une ligne au lieu de quatre rangées (04/10/2026)

Deux remarques du propriétaire, dans la même phrase, et les deux justes :

> « Quand il y aura beaucoup de monde de toute la France, une annonce de
> bétonnière n'intéressera pas quelqu'un de Marseille alors que la
> bétonnière est à Paris. Il faudrait ajouter un filtre pour le secteur.
> Par contre là on a "quoi ?" avec les propositions de choix en dessous,
> "quand ?" avec les propositions… si on ajoute "où ?" je trouve que ça va
> faire beaucoup et désordonné. »

#### L'encombrement, mesuré avant de toucher quoi que ce soit

Au navigateur, fenêtre d'iPhone 390 × 900 :

| | hauteur des filtres | visible de la 1re annonce |
|---|---|---|
| avant, filtres repliés | **233 px** | 131 px |
| avant, « Dates précises » ouvert | **285 px** | **79 px** |
| **après, les quatre pastilles** | **104 px** | **339 px** |

Une rangée « OÙ ? » de plus (≈ 85 px) aurait poussé la première annonce
**entièrement sous l'écran**. Et le pire cas, les quatre pastilles réglées :
toujours **une** rangée, de 44 px.

#### Mais le filtre ne pouvait PAS fonctionner — troisième fois, même famille

Avant d'écrire une ligne d'interface, le relevé sur la vraie base :

| | coordonnées GPS |
|---|---|
| `annonces_pro` | **0 sur 4** |
| `professional_profiles` | **1 sur 7** — celle du propriétaire |

Les colonnes existaient, `publierAnnonce` les envoyait, `distanceKm` était
écrite, et la liste se disait triée par proximité. **Presque rien ne les
remplissait.** Aucune distance ne s'affichait sur les annonces des autres,
et le tri ne triait rien — sans la moindre erreur, puisque `distanceKm`
rend simplement `null`.

> **La cause : `ChampVille` ne rend les coordonnées QUE si l'on touche une
> suggestion.** Taper sa ville à la main renvoie `{ affichage }` tout
> court — et c'est volontaire, une suggestion qui n'arrive pas ne doit
> jamais bloquer personne. Mais dans le formulaire d'annonce le champ est
> **pré-rempli depuis le profil** : personne ne le touche, donc personne ne
> choisit de suggestion, donc aucune annonce n'a jamais eu de coordonnées.

La parade est `completerLieu()` (`src/lib/adresse.js`), appelée **au moment
d'enregistrer** — l'annonce et la fiche pro —, là où il y a déjà une attente
visible et un contexte asynchrone. Pas dans le champ : compléter en
arrière-plan pendant la frappe ferait bouger la valeur du parent sans que
personne ne l'ait demandé.

Trois règles, et chacune a sa raison :

1. **un lieu qui a déjà des coordonnées n'est pas retouché** — elles
   viennent d'une suggestion choisie, donc d'un point précis ;
2. **on ne devine jamais la commune.** Pas de réponse de la Base Adresse
   Nationale, ou rien dans le bon département : on rend le lieu tel quel.
   Une annonce sans coordonnées est gênante ; une annonce placée dans la
   mauvaise ville est pire, et personne ne s'en apercevrait ;
3. **l'échec ne bloque RIEN.** Un réseau coupé n'empêche pas de publier —
   même règle que le vibreur de `retour.js`.

> **Le numéro entre parenthèses n'est pas décoratif : il DÉPARTAGE.** Il y
> a une Sainte-Marie dans quinze départements. `decouperAffichage()` sort
> le « (13) » de « Lambesc (13) » et ne retient qu'un résultat dont le code
> postal commence pareil. Sans ça, un artisan atterrit à six cents
> kilomètres de chez lui, sans la moindre alerte.
>
> Et le cas de la **Corse** : le département « 2A » a des codes postaux en
> **20**. La comparaison littérale échouerait, et la fonction rendrait le
> lieu sans coordonnées, en silence.

**Les lignes déjà en base ont été rattrapées**, sur décision du
propriétaire : coordonnées du **centre de la commune** que chacun a
lui-même déclarée, jamais une adresse précise — la règle posée avec la
carte le 30/09. Après : **4 annonces sur 4** et **7 fiches sur 7**.

#### Ce filtre ressemble à celui des dates et ne se comporte PAS pareil

C'est le piège de ce lot, et il ne lèverait aucune erreur :

> **« Pas de dates » veut dire disponible n'importe quand** — une
> bétonnière à vendre l'est vraiment, elle passe.
> **« Pas de coordonnées » veut dire qu'on ne sait pas où** — prétendre
> qu'elle est à 10 km serait inventer, elle sort.

Et l'écran le DIT : « 3 annonces sans lieu précisé ne sont pas affichées ».
Un filtrage incomplet ne doit pas ressembler à un filtrage fait — c'est la
leçon du ménage de compte des pièces jointes, où un trou RGPD s'était
présenté comme un succès.

#### Pourquoi des pastilles, et pas un bouton « Filtrer »

Le standard des sites d'annonces est un bouton unique qui ouvre tout. Il a
été écarté :

> **Un filtre qu'on ne voit pas est un filtre qu'on oublie d'enlever.** On
> cherche ensuite pendant cinq minutes pourquoi « il n'y a rien ». Même
> famille que le voyant du 04/10 : un signal doit dire OÙ.

Donc quatre pastilles — **Quoi, Où, Quand, Vérifiés** — et chacune
**affiche son choix** à la place de son nom : on lit « Matériel »,
« Lille (59) · 50 km », « Cette semaine » sans rien ouvrir. « Quoi : Matériel »
prendrait deux fois la place pour la même information, et la place est
exactement ce qui manquait.

Trois détails qui ne sont pas cosmétiques :

1. **« Mes annonces » n'est pas un filtre, c'est une VUE** : on y va pour
   lire ses réponses, pas pour affiner une recherche. Elle reste donc à
   côté du compte, pas dans la ligne des pastilles ;
2. **un seul panneau à la fois**, tenu par une chaîne (`panneau`) et non par
   trois booléens. Avec trois booléens, deux peuvent être vrais ensemble —
   et deux `Modal` empilées laissent sur iPhone un voile invisible qui
   avale les touches. C'est le défaut qui a fait dire « je suis bloqué » le
   matin même ;
3. **les raccourcis et le calendrier sont dans le MÊME panneau.** Avant,
   « Dates précises » faisait apparaître deux champs sous la rangée : la
   mise en page sautait de 52 px au moment précis où l'on cherchait à lire.
   Maintenant, toucher « Cette semaine » remplit la grille — **on voit ce
   que le raccourci veut dire**, ce qu'aucune puce ne disait.

Et `creneau` ne porte plus qu'une ÉTIQUETTE (`'semaine' | 'mois' | null`) :
les bornes réelles sont toujours dans `creneauDu` / `creneauAu`, quel que
soit le chemin par lequel on les a posées. Trois modes se partageaient le
travail, il n'en reste qu'un.

#### Un message de liste vide qui donne tort à l'application

Trouvé à l'écran, pas en relisant : en cherchant à 50 km de Lille, la liste
affichait **« Aucune annonce pour le moment. Posez la première. »** alors
que la base en contenait quatre, toutes dans les Bouches-du-Rhône. On en
conclut que la Place des pros est déserte, et on n'y revient pas.

Elle dit maintenant « Aucune annonce à 50 km de Lille (59). Élargissez le
rayon, ou cherchez partout en France. »

> **Mais seulement quand ce filtre est SEUL.** Mesuré avec quatre filtres
> posés : le message accusait « aucune annonce d'artisan vérifié », alors
> que trois autres pouvaient tout aussi bien être en cause. **Un message
> précis et faux est pire qu'un message général et juste.**

#### La Base Adresse Nationale ne part pas non plus du conteneur

Comme les tuiles de l'IGN : sans rien faire, le navigateur d'essai répond
`ERR_CERT_AUTHORITY_INVALID` et le champ ville tourne indéfiniment. Ça
ressemble beaucoup à un défaut du code. La parade est la même —
`poserRelais(page, { hote: 'api-adresse.data.gouv.fr' })`, en plus de celui
de Supabase. **Deux relais sur la même page fonctionnent.**

#### Vérifié, et comment

Les 30 contrôles passent — 13 nouveaux sur l'écran et le secteur, 13 sur les
calculs purs (`verifier-adresse`). `npx expo export --platform ios` passe.
Puis au navigateur, sur la VRAIE base, avec un compte professionnel jetable
supprimé dans la même session :

| | résultat |
|---|---|
| la ligne | **4 pastilles, 1 rangée, 44 px** |
| zone de filtres | **104 px** (contre 233) |
| « Où » → ma ville reconnue | Lambesc (13) |
| 25 km autour de moi | 4 annonces (toutes dans le 13) |
| **50 km autour de Lille** | **0 annonce** — le filtre filtre |
| la pastille | « Lille (59) · 50 km » |
| « Quand » → Cette semaine | la grille se remplit du 4 au 11 oct. |
| « Quoi » → À vendre | 2 annonces |
| « Tout effacer » | 4 annonces, et la pastille disparaît |

**Ce qui n'a PAS été vérifié** : le défilement horizontal de la rangée au
doigt. Sur ordinateur, une zone défilante répond à la molette, pas au
glissement — c'est écrit dans ce document depuis le lot 5, et ça vaut ici.
Avec quatre pastilles réglées la rangée dépasse l'écran : **c'est à juger
sur l'iPhone.**

Et un rappel : `verifier-adresse` appelle la vraie Base Adresse Nationale à
travers le mandataire, qui coupe environ une connexion sur cinq. **Un échec
isolé de ce contrôle n'est pas un défaut du code** — il faut le relancer
avant de chercher ailleurs. C'est arrivé une fois pendant ce lot.

### Glisser entre les trois pages de Découvrir (04/10/2026)

Demandé par le propriétaire :

> « J'aimerais qu'on puisse directement scroller pour passer de "Pour moi" à
> "Place des pros" à "Demandes" et ainsi de suite. On conserverait le bouton
> en haut qui se déplace pour dire sur quelle page on se trouve, mais c'est
> plus simple de scroller je trouve. »

#### Le risque de ce lot n'est PAS le geste, c'est le montage

Un `ScrollView` monte **tous** ses enfants d'un coup. Poser les trois écrans
dedans aurait donc triplé le premier rendu de « Découvrir » — trois listes,
trois en-têtes, trois barres de recherche —, c'est-à-dire exactement le
défaut qui bloquait l'iPhone plusieurs secondes au démarrage le 29/09 et que
tout le lot 4 a servi à corriger. Une fonctionnalité de confort qui annule
une correction de fond est une mauvaise affaire.

> **Une page n'est montée qu'une fois VISITÉE, et elle le reste ensuite.**
> Avant, ce n'est qu'une boîte vide de la largeur de l'écran — ce qui suffit
> au défilement, qui ne connaît que des largeurs.

Mesuré au navigateur : à l'ouverture de « Découvrir », **trois pages de
390 px (1170 au total) et une seule montée** (`○ ● ○`). Après un passage sur
chacune : `● ● ●`, et revenir est instantané.

Et le franchissement à **mi-course** est un bénéfice, pas un compromis : la
page suivante se monte quand elle occupe plus de la moitié de l'écran, donc
avant qu'on la voie en entier.

#### Aucune dépendance : le système arbitre déjà

`react-native-pager-view` existe et est fourni dans Expo Go. Il n'a pas été
pris, et c'est la raison déjà écrite dans `Carrousel.js` : **le système sait
départager un glissement horizontal d'un défilement vertical, et il le fait
côté natif** — donc toujours mieux qu'un arbitrage écrit en JavaScript.
`PagesGlissantes` est le même mécanisme que le carrousel de photos, à
l'échelle de l'écran.

#### Une seule fonction pour la pastille ET pour le doigt

C'est le point qui aurait cassé en silence. `onChange` de la pastille
faisait trois choses : recharger les demandes reçues, éteindre le point,
marquer les demandes vues. Un glissement qui aurait seulement changé
`decouvrirTab` **aurait affiché le bon écran sans rien faire de tout ça** —
et personne ne l'aurait remarqué, puisque l'écran, lui, s'affiche. Le point
orange serait resté allumé pour toujours, ce qui est précisément le défaut
réparé le matin même.

> **Deux façons d'arriver au même écran doivent faire exactement le même
> travail.** `changerOngletDecouvrir` est la seule porte, et
> `ongletsDecouvrir` la seule liste — deux listes séparées se
> désaligneraient le jour où l'on ajoute un onglet : la pastille dirait
> « Demandes » et le doigt ouvrirait autre chose.

**Vérifié au navigateur, en glissant et non en appuyant** : avant,
`["Demandes, nouveautés", "Découvrir, nouveautés", "Messages, nouveautés"]` ;
après être arrivé sur « Demandes » **par le défilement**,
`["Messages, nouveautés"]`. Les deux niveaux s'éteignent ensemble.

#### Il faut les DEUX portes pour savoir où l'on est arrivé

`onMomentumScrollEnd` seul ne suffit pas — et `Carrousel.js` le disait déjà
depuis le lot 0 : **un glissement lent se termine sans élan**, l'événement
de fin d'élan n'arrive jamais, et la pastille reste bloquée sur l'onglet de
départ. Reconstaté ici le 04/10, dans l'autre sens : **un défilement posé
par programme ne déclenche aucune fin d'élan au navigateur** — la première
version a donc affiché la bonne page avec la mauvaise pastille.

D'où `onScroll` **et** `onMomentumScrollEnd`, avec `scrollEventThrottle={32}` :
exactement le réglage du carrousel.

> **Ce n'est pas la bannière du lot 6.** Le gestionnaire lit un nombre et
> compare ; il ne redessine rien tant qu'on n'a pas franchi la moitié d'une
> page. L'état change **une fois par glissement**, pas une fois par pixel.
> La règle du lot 6 vise ce qui ANIME depuis JavaScript, pas ce qui observe.

#### `contentOffset` est ignoré par `react-native-web`

« Place des pros » est le deuxième onglet : on doit y arriver directement.
La propriété `contentOffset` ne suffit pas — le placement se fait au premier
`onLayout`, qui marche des deux côtés. Mesuré : offset 390 à l'ouverture,
donc la bonne page, sans voir passer la première.

#### LE DÉFAUT DE LA PREMIÈRE VERSION — et il n'était pas visible ici

Essayée sur l'iPhone, elle s'arrêtait **entre deux pages** :

> « Quand je scrolle j'arrive entre deux pages, ce n'est pas bon, je
> n'arrive pas proprement sur une page comme le fait le bouton. »

Au navigateur, la même version paraissait parfaite. **Et la mesure ne la
dénonçait pas non plus** : vérifié en remettant l'ancien fichier en place,
elle donnait exactement les mêmes nombres — trois pages de 390 px, total
1170. Ce n'est donc pas « j'avais oublié de mesurer », c'est **mesurable
nulle part ici**.

> **`pagingEnabled` n'est PAS la même chose des deux côtés.**
> `react-native-web` le traduit en `scroll-snap`, qui s'accroche au bord de
> chaque enfant quelle que soit sa largeur — tout défaut de largeur y est
> donc invisible. **iOS, lui, avance d'une LARGEUR DE CADRE à la fois** : si
> les pages ne font pas exactement cette largeur, on s'arrête entre deux, et
> le décalage s'accumule de page en page.

Faute de pouvoir reproduire, trois causes plausibles ont été corrigées — et
les trois sont des améliorations quelle qu'ait été la vraie. Les deux
premières étaient déjà évitées par `Carrousel.js`, qui fait la même chose à
l'échelle d'une photo depuis le lot 0 :

1. **la largeur venait de la FENÊTRE** (`useWindowDimensions`), pas du cadre
   qui défile. Les deux coïncident souvent, et « souvent » ne suffit pas :
   une marge posée un jour au-dessus décalerait la pagination partout, sans
   la moindre erreur ;
2. **chaque page portait `flex: 1` EN PLUS de sa largeur.** Dans un
   conteneur horizontal, `flex: 1` vaut `flexBasis: 0` — la largeur
   explicite ne décide donc plus de rien, et `react-native-web` et Yoga ne
   résolvent pas ce conflit pareil ;
3. **l'onglet changeait à MI-COURSE**, et cet onglet vit dans `OpusApp` :
   le changer redessinait toute l'application et **montait la page
   d'arrivée** — un écran entier avec sa liste — au milieu du freinage. Un
   `ScrollView` dont la mise en page change pendant qu'il décélère peut
   s'arrêter là où il en est.

> **La largeur d'une page se MESURE sur le cadre qui défile, jamais sur la
> fenêtre. Une page ne porte aucun `flex` : seulement sa largeur et
> `height: '100%'`. Et rien ne se rend ni ne se monte pendant le geste.**

#### Et « fin d'élan » n'est pas une notion fiable

La correction du point 3 s'appuyait d'abord sur `onMomentumScrollEnd` et
`onScrollEndDrag`. Mesuré aussitôt : **au navigateur, un défilement à la
molette déplace bien les pages, les accroche, et n'émet ni l'un ni
l'autre.** Ce sont des notions de DOIGT. S'y fier seul rendait la pastille
muette sur toute une plateforme — et m'enlevait toute possibilité de
vérifier quoi que ce soit ici.

> **On attend que les événements de défilement CESSENT** : un minuteur de
> 150 ms, remis à zéro à chaque `onScroll`. Le doigt, la molette, une
> position posée par programme : tout en produit. La règle est donc la même
> partout, et elle se vérifie. `onMomentumScrollEnd` reste en plus, parce
> que sur iPhone il arrive à l'instant exact de l'arrêt.

#### Les voisines se montent AU REPOS

Si rien ne se monte pendant le geste, la page vers laquelle on glisse doit
être prête AVANT. Mais tout monter d'emblée, c'est le défaut qu'on voulait
éviter. D'où le décalage dans le temps — mesuré au navigateur :

| | pages montées | nœuds |
|---|---|---|
| 0,4 s après l'ouverture | **○ ● ○** | 1 / **214** / 1 |
| 2 s après, au repos | ● ● ● | 2 / 214 / 94 |

Le premier affichage ne porte qu'UN écran ; les deux autres se préparent
une demi-seconde plus tard, quand plus rien ne bouge. C'est le raisonnement
de `Carrousel.js` — « la voisine est toujours prête avant qu'on
l'atteigne » — décalé dans le temps plutôt que fait d'emblée.

#### Ce qu'il faut savoir, et qui ne se corrigera pas

**Un glissement qui commence sur une zone qui défile déjà horizontalement
déplace CETTE zone, pas la page.** Il y en a deux dans la Place des pros :
la rangée de pastilles de filtre, et le carrousel de photos d'une annonce.
C'est le comportement d'Instagram, et c'est le seul possible : deux
défilements imbriqués dans le même axe ne peuvent pas répondre tous les deux
au même doigt. En pratique la carte occupe une grande partie de l'écran —
donc pour changer de page, on glisse sur une marge, un en-tête, ou on touche
la pastille du haut, qui reste là pour ça.

#### Le geste, finalement vérifié — mais pas tout le geste

Ce paragraphe disait d'abord : « le geste lui-même ne se juge que sur le
téléphone ». Le propriétaire a répondu « n'oublie pas que toi aussi tu peux
tester réellement Opus », et il avait raison : le protocole de Chrome envoie
de vrais événements tactiles. La doctrine du projet a été corrigée plus haut
(« Ce qui se vérifie au navigateur »), et `npm run gestes-tactiles` mesure
désormais :

| | mesuré |
|---|---|
| doigt vers la gauche | page suivante, offset **780**, exactement dessus |
| la pastille | suit (« Demandes ») |
| la liste pendant ce geste | **ne défile pas** |
| doigt vers le haut | liste à **361 px**, page **inchangée** |
| doigt parti d'une zone imbriquée | la page **ne change pas** |

Le dernier cas éteint une affirmation que j'avais écrite sans la mesurer —
« un glissement qui démarre sur un carrousel déplace le carrousel, pas la
page ». Elle est juste pour la moitié qui compte : la page ne change pas.

**Ce qui reste hors de portée**, et il ne faut pas le confondre avec ce qui
précède : Chromium accroche les pages avec `scroll-snap`, iOS avec sa propre
pagination. Le défaut du 04/10 venait de cette différence — **ce contrôle ne
l'aurait pas attrapé**. Et le RESSENTI au pouce ne se mesure nulle part.

Ce qui SE vérifie, et qui a été vérifié **à la molette**, c'est-à-dire par
un vrai défilement d'utilisateur et non par une position posée par
programme : les trois pages font exactement la largeur du cadre (390 /
390 / 390, total 1170 pour un cadre de 390), l'accrochage tombe juste
(780 → 390 → 0), **la pastille suit à chaque fois**, une seule page est
montée au premier affichage, et les voyants s'éteignent par les deux
chemins.

Et la leçon de méthode, qui vaut pour la suite : **un défilement posé par
programme n'est pas un essai.** Il ne déclenche pas les mêmes événements
qu'un geste, et il m'avait fait conclure que tout allait bien.

### La page Demandes — « je la trouve trop triste » (04/10/2026)

Le propriétaire, après avoir essayé le glissement sur son iPhone :

> « J'aimerais qu'on se penche sur la page Demandes, je la trouve trop
> triste. Et j'aimerais qu'une demande déjà vue n'affiche plus de point sur
> Découvrir ; un petit texte écrit "vu" ou quelque chose comme ça serait
> bien. Vérifie déjà la page et dis-moi comment on peut l'améliorer autant
> visuellement que fonctionnellement. »

En vérifiant, trois défauts, et aucun ne faisait planter quoi que ce soit.

#### Le point ne s'éteignait JAMAIS

```js
const [demandesVues, setDemandesVues] = useState(false);
const voyantDemandes = canPublish && !demandesVues && demandes.length > 0;
```

Deux erreurs dans deux lignes :

1. **un booléen en mémoire**, remis à faux **à chaque ouverture de
   l'application**. On avait beau tout lire, le point revenait au lancement
   suivant ;
2. **il s'allumait sur `demandes.length > 0`** — sur l'EXISTENCE d'une
   demande, pas sur sa nouveauté. La base du propriétaire en contient
   **une seule, et pas de cette semaine** : le point était donc allumé en
   permanence, depuis des jours, pour quelque chose de déjà vu dix fois.

> **Ce qu'il faut retenir, c'est la DATE DE LA DERNIÈRE VISITE**, et elle
> doit survivre au redémarrage. Une colonne suffit :
> `professional_profiles.demandes_vues_le`. Une demande déposée après est
> nouvelle, les autres sont vues.

**Et le piège de ce lot, qui aurait tout gâché** : si les badges se
calculaient sur l'heure qu'on vient d'écrire, ils **s'effaceraient sous les
yeux** de celui qui ouvre l'onglet pour les lire.

> **Deux dates, et ce n'est pas un doublon.** Celle qui vient de la base au
> chargement ne bouge pas de la session : c'est elle qui décide des badges.
> Celle posée à l'ouverture de l'onglet n'éteint que le POINT, tout de
> suite. Vérifié au navigateur : après ouverture, les voyants tombent de
> trois à un, **et les badges « Nouveau » sont toujours là**.

Ce que ce choix ne fait pas, et il faut le savoir : ouvrir l'onglet marque
tout comme vu, même ce qu'on n'a pas fait défiler. Le vrai « lu par
article » demanderait une ligne par (artisan, demande) — beaucoup de lignes
pour éteindre un point. On commence par la date.

#### `demandes.statut` : encore une colonne que personne ne relisait

Elle vaut `'ouverte'` par défaut **depuis le premier jour**, la contrainte
accepte déjà `'pourvue'` et `'fermee'`, et **rien dans tout `src/` ne la
lisait**. Une demande ne se refermait donc jamais : le particulier a trouvé
son maçon il y a six mois, sa demande est toujours en tête de liste.

C'est la même famille que les trois tables du 01/10 — et c'est **la vraie
cause de la tristesse à venir** : une liste où rien ne meurt finit en
cimetière. Le particulier a maintenant « J'ai trouvé », et seul lui :
vérifié sur la vraie base, un autre compte qui tente reçoit **zéro ligne
modifiée**.

#### Et le chargement n'avait aucune limite

Le fil en a une, la Place des pros 200, les demandes : rien. Le jour où il
y en a cinq mille, l'application les télécharge toutes au démarrage. Elles
sont désormais bornées comme le reste, et on ne charge plus que les
demandes **ouvertes** — plus les siennes, que leur auteur doit continuer de
voir, pourvues ou non.

#### Une demande s'adresse aux ARTISANS — décidé par le propriétaire

La règle de lecture était :

```sql
"lecture demandes visiteur"  to anon  using (true)
```

**N'importe qui, sans compte, pouvait lire toutes les demandes** — le
texte, la commune, le prénom, et l'adresse des photos, qui vivent dans un
espace de stockage public.

Ce n'était pas une faute d'inattention : c'est le motif à deux politiques
de la section 18, qui existe parce qu'une policy appelant une fonction
interdite à l'appelant ÉCHOUE au lieu de filtrer. Il est juste pour une
publication de professionnel — une vitrine est faite pour être vue. Il ne
l'est pas pour « fissure dans mon mur », une photo de sa maison, et sa
commune.

**Vérifié sur la vraie base, les quatre cas :**

| | ce qu'il lit |
|---|---|
| sans compte | **0** |
| un particulier qui n'est pas l'auteur | **0** |
| l'auteur | **sa demande**, pourvue ou non |
| un professionnel connecté | **toutes les ouvertes** |

> **Et `schema.sql` ne doit créer une politique qu'à UN endroit.** La
> section 18 créait encore `lecture demandes visiteur` ; la section 30 la
> supprimait trente lignes plus loin. Rejouable, mais c'est le premier des
> deux qui se fait oublier le jour où la règle change. Le contrôle l'a
> refusé, et il avait raison.

#### Le visuel : 45 % de l'écran avant le premier contenu

Mesuré au navigateur, écran de 844 px :

| | avant | après |
|---|---|---|
| l'encadré explicatif commence à | 160 px | **supprimé** |
| le filtre par métier commence à | 325 px | — |
| **la première demande commence à** | **~380 px (45 %)** | **258 px** |
| hauteur de l'en-tête | **165 px** | **76 px** |

L'encadré prenait 165 px pour dire toujours la même phrase, et les deux
réglages étaient deux rectangles gris. Même traitement que la Place des
pros deux heures plus tôt : **une ligne de pastilles**, et le sélecteur de
métiers s'ouvre depuis une pastille au lieu d'occuper cinquante pixels en
permanence. Les deux pages sont jumelles — elles doivent se ressembler.

Et dans la carte, deux choses qu'on doit voir **sans lire** :

> **« Nouveau » et « Pour vous ».** Avant, « c'est un de vos métiers » ne
> changeait qu'une petite pastille de bleu à marine, en haut à droite —
> autant dire rien. Et rien du tout ne disait qu'une demande venait
> d'arriver.
>
> **Le neuf se marque au BORD, pas au fond** : un fond teinté derrière le
> texte le rendrait moins lisible, et c'est le texte qu'on vient lire. Un
> trait orange de 3 px se repère en descendant sans rien gêner.

#### Le défaut que SEUL le fait de lancer l'application a trouvé

Les deux nouvelles fonctions d'API avaient été posées à côté de
`TAILLE_PAGE_FIL`… **mille lignes au-dessus de la déclaration de `noop`** :

```
ERROR  [ReferenceError: Cannot access 'noop' before initialization]
```

Écran blanc au démarrage. **Les 30 contrôles passaient. Le linter n'a rien
dit. `npx expo export` a réussi.** C'est la deuxième fois dans ce projet
(après les trois voyants du matin) qu'une `const` lue avant sa déclaration
passe tout, et c'est le rappel du propriétaire — « n'oublie pas que toi
aussi tu peux tester réellement Opus » — qui l'a attrapée.

> **Un export qui passe ne prouve pas qu'une application démarre.** Il
> construit le paquet ; il ne l'exécute pas. Seul `npx expo start --web` et
> un navigateur le font.

#### Le mode démonstration doit faire VIVRE le mécanisme

Les demandes de démonstration n'avaient pas de date de dépôt : le badge
« Nouveau » ne se serait jamais affiché pour qui lance Opus sans fichier
`.env` — et il ne se serait pas vérifié ici non plus. Elles portent
maintenant des dates **calculées** (il y a 3 h, 26 h, 50 h) et la dernière
visite est simulée à 24 h : une demande est nouvelle, deux ne le sont plus.
Une date figée dans le fichier serait « nouvelle » le premier jour puis
plus jamais.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un vrai PostgreSQL : aucune erreur, et
il ne reste bien que deux politiques sur `demandes`. Les 30 contrôles
passent (8 nouveaux dans `verifier-demandes`), `npx expo export --platform
ios` passe. Sur la vraie base : les quatre cas de lecture ci-dessus,
l'écriture de `demandes_vues_le` par un compte jetable supprimé dans la même
session, et le verrou du badge vérifié qui n'a pas bougé au passage.

**Ce qui n'a PAS été vérifié** : la page sur un vrai iPhone, et le ressenti
— « moins triste » ne se mesure pas. Et la base du propriétaire ne contient
qu'une demande : la liste à vingt cartes, avec ses « Nouveau » et ses
« Pourvue » mêlés, n'a été vue qu'en démonstration.

### Un voyant qui promet doit dire OÙ (04/10/2026)

Relevé par le propriétaire en s'en servant :

> « Quand on est connecté sur Opus, on voit un point orange sur Découvrir,
> ça veut dire qu'il y a quelque chose à aller voir, c'est parfait. Après
> on clique sur Découvrir et là on a trois choix — Pour moi, Place des
> pros, Demandes — mais le point ne s'affiche pas, donc on ne sait pas ce
> qui doit être vu. »

Le défaut n'était pas que les onglets manquaient de point. C'est que **la
barre du bas calculait SA condition dans son coin** :

```js
dots={{ decouvrir: (canPublish && !demandesVues && demandes.length > 0)
                   || nouvellesDemandes.length > 0, … }}
```

Deux formules pour une seule vérité, et rien pour les tenir ensemble.

> **Un voyant de parent est exactement le OU de ses enfants.** Pas « à peu
> près » : un voyant qui s'allume pour quelque chose qu'on ne trouvera
> jamais s'éteint dans la tête de celui qui le regarde. Au bout de trois
> fouilles inutiles, on cesse de le voir — c'est exactement ce qui était
> arrivé à la cloche des notifications, et c'est pour ça qu'ouvrir
> « Pour moi » ÉTEINT le signal.

`voyantPourMoi`, `voyantDemandes` et `voyantDecouvrir` vivent donc dans
`OpusApp`, nommés, écrits une seule fois, et la barre du bas n'a plus le
droit d'en inventer une troisième. `npm run verifier-voyants` le refuse.

Trois choses à ne pas redécouvrir :

1. **« Place des pros » ne porte JAMAIS de point**, et c'est voulu : rien
   n'y est adressé à quelqu'un en particulier. Un voyant sur une place
   publique voudrait dire « il s'est passé quelque chose », ce qui est vrai
   en permanence et ne se termine jamais ;
2. **la couleur du point dépend du FOND, et c'est mesuré.** Un point de
   7 px est un élément graphique : il lui faut 3 : 1. L'orange de signature
   sur le fond clair de la barre d'onglets ne donne que **2,76** — on ne le
   distingue pas. `C.accentTexte` y donne **4,52** ; sur l'onglet choisi,
   dont le fond est presque noir, c'est l'inverse (3,01 contre **4,92**).
   La règle du lot 5 s'applique donc ici aussi, et le contrôle **recalcule**
   les trois contrastes à chaque passage ;
3. **le point entre dans l'étiquette parlée** (`, nouveautés`), comme le
   faisait déjà la barre du bas. Un voyant qu'on ne peut qu'apercevoir
   n'existe pas pour qui se sert de VoiceOver.

**Vérifié au navigateur, en mode démonstration** (le seul où le jeu de
données allume un voyant) : avant d'ouvrir, `["Demandes, nouveautés",
"Découvrir, nouveautés", "Messages, nouveautés"]` ; après,
`["Messages, nouveautés"]`. Les deux niveaux s'allument et s'éteignent
ensemble.

#### Et une `const` lue avant sa déclaration ne lève PAS d'alerte

J'avais d'abord posé les trois voyants au milieu du fichier, au-dessus de
`const canPublish` — mille lignes plus haut que sa déclaration. C'est un
`ReferenceError` au démarrage, donc un écran blanc, et **le linter ne l'a
pas signalé** (`no-use-before-define` n'est pas dans la configuration).
Trouvé en relisant, pas en lançant.

### Les pièces justificatives, et le métier qui ne construit pas (04/10/2026)

`src/data/pieces-justificatives.js`. La décision du 30/09 — « tout
l'écosystème peut s'inscrire, avec des pièces PAR CATÉGORIE » — n'était pas
construite, et ça fermait deux portes :

- **un avocat ne pouvait JAMAIS obtenir le badge.** La base exige
  `kbis_valide AND assurance_valide` ; sans décennale, c'est définitif ;
- **« extrait Kbis » est faux pour un micro-entrepreneur**, qui n'en a pas
  (c'est l'avis de situation SIRENE). Le propriétaire est dans ce cas.

> **Il y a toujours DEUX pièces, et le schéma ne bouge pas.** C'est leur
> NATURE qui dépend du métier : l'existence légale (Kbis **ou** avis
> SIRENE) et la couverture (décennale pour qui construit, **RC
> professionnelle** pour qui conseille).

Vérifié plutôt qu'écrit de mémoire, et ma première conception était
FAUSSE : **architectes, bureaux d'études et géomètres sont soumis à la
décennale** — ce sont des constructeurs au sens de l'article 1792 du Code
civil. Une seule catégorie sur quinze y échappe, `conseil`.

Trois choses à ne pas redécouvrir :

1. **`categorieDe()` rend le NOM de la catégorie, pas sa clé.** La
   comparaison avec `'conseil'` échouait en silence. D'où
   `cleCategorieDe()`. Même règle que le catalogue : la clé sert à décider,
   le nom à afficher.
2. **Un seul métier qui construit suffit à exiger la décennale.** Un pro
   porte jusqu'à quatre métiers ; un courtier en assurance construction
   peut aussi être maçon. Prendre la catégorie du PREMIER laisserait une
   entreprise de gros œuvre sans décennale.
3. **Les CGU disaient le contraire de l'application** — « le badge après
   contrôle d'un Kbis et d'une décennale ». Elles fermaient par écrit le
   badge aux micro-entrepreneurs et aux avocats. Les textes légaux sont la
   seule exception à « aucun document nommé en dur » : une clause doit être
   lisible sans l'application sous les yeux, donc le contrôle exige au
   contraire qu'ils nomment **les deux cas**.

### Le référentiel côté administration — et le bouton qui n'a pas été livré

Section 27. Deux files de plus : les demandes de changement de métier et
les spécialités proposées. **Accepter une demande applique VRAIMENT les
métiers** — un bouton qui passerait seulement le statut à « acceptée »
serait un tampon, alors que l'artisan vérifié ne peut pas le faire
lui-même.

Deux défauts trouvés par les essais, pas à l'œil :

1. **`set note = note` est ambigu** en plpgsql quand la table porte une
   colonne du même nom. La fonction se crée sans broncher et échoue à
   l'exécution.
2. **Renommer une contrainte ne la désactive pas.** Pour éviter un `drop`
   que je croyais refusé, j'avais renommé l'ancienne en `…_v1` et ajouté une
   `…_v2` élargie : les DEUX s'appliquaient, et l'ancienne refusait les
   nouvelles actions. Une contrainte ne se remplace pas, elle se refait.

> **Et le bouton §18 « désactiver un métier » a été RETIRÉ avant d'être
> livré.** En cherchant qui lirait la colonne : **rien, dans `src/`, ne lit
> `metiers_catalogue`.** Le sélecteur filtre le FICHIER du catalogue. Le
> bouton aurait parfaitement marché en base et n'aurait rien changé à
> l'écran — le défaut du 01/10 vu dans l'autre sens. Ce qu'il faut trancher
> d'abord est écrit en section 27.4 de `schema.sql` : où vit la vérité sur
> `actif`, dans le fichier ou dans la base ?

### « Plus rien ne fonctionne » — et la base allait très bien (02/10/2026)

Le propriétaire : « plus de contenu, et une phrase d'erreur ». Puis, cinq
minutes après : « j'ai rechargé la page et ça fonctionne ».

**Ce que les journaux Supabase disent, à la seconde près.** À 15:12:39 son
iPhone (agent `Expo/… CFNetwork`) rafraîchit son jeton : 215 ms, succès. À
**15:12:40 et 15:12:41, la couche API du projet REDÉMARRE** — « Successfully
connected to PostgreSQL 17.6 », « Connection Pool initialized », « Schema
cache loaded 26 Relations », deux fois de suite. Et ensuite : plus **aucune**
requête REST jusqu'à la mienne, cinq minutes plus tard.

Zéro réponse 4xx. Zéro erreur PostgreSQL. **Rien n'a été refusé — il n'y
avait personne au bout du fil.**

> **Avant d'accuser le code, lire les journaux de la base.** Une absence de
> réponse et un refus ne se ressemblent pas du tout dans les journaux, et
> ils ne se corrigent pas au même endroit. `query_logs` sur `postgrest_logs`
> montre un redémarrage ; sur `edge_logs`, un refus.

Vérifié de mon côté sur SA base, avec un vrai compte d'essai supprimé
ensuite : le fil, ses publications, ses photos — tout arrive, 200 partout.

#### Ce qui a été changé, et ce qui n'est PAS prouvé

`avecReprise()` (`src/lib/erreurs.js`) : un échec réseau au démarrage se
retente **une** fois, après 2,5 s. Pas deux — au second échec c'est une
vraie panne, et la taire derrière un sablier serait pire. Et **on ne
retente jamais** une session expirée, un droit refusé ou une contrainte
violée : la base a RÉPONDU, insister n'ajoute que de l'attente à une
mauvaise nouvelle. Six contrôles de comportement dans
`npm run verifier-etats` — ils font tourner la fonction, ils ne lisent pas
le code.

**Mais je n'ai pas réussi à reproduire sa panne au navigateur**, et il faut
le dire : en coupant l'API pendant deux secondes au moment exact du
chargement, l'ANCIENNE version guérissait déjà. La trace le montre —
`loadAll` est reparti tout seul à 481 ms, 1494 ms, puis a réussi à
3502 ms. Ce second départ venait d'ailleurs (l'écouteur de session), pas
d'une reprise voulue. Autrement dit : la reprise existait **par accident**,
elle est maintenant **voulue et bornée** — mais je ne peux pas affirmer
qu'elle lui aurait évité son bandeau.

Un repère utile au passage, mesuré sur un démarrage normal :
**24 requêtes, et `loadAll` ne part qu'une fois.** Si ce nombre double un
jour, quelque chose relance le chargement.

### Les quatre états — vide, en cours, cassé, et SANS RÉSEAU (01/10/2026)

Trois pièges trouvés en les traitant, et aucun des trois ne faisait planter
quoi que ce soit. C'est bien le problème.

#### Une requête qui ne revient JAMAIS n'atteint jamais le `catch`

Avec une session valide et la base injoignable, l'application restait
bloquée sur son squelette de démarrage — **pour toujours**. Pas d'erreur,
pas de message : les blocs gris battaient doucement, et c'est tout.

`setDemarrage(false)` était pourtant bien écrit après l'attente. Mais un
`catch` ne protège de rien quand rien n'échoue : il ne se passe simplement
rien. Et l'écran a l'air vivant, donc on attend, puis on ferme
l'application.

> **Tout appel réseau sur le chemin du démarrage porte un délai**
> (`avecDelai()`, `src/lib/erreurs.js`), et la sortie est dans un `finally`.
> Les deux vont ensemble : le `finally` ne sert à rien sans le délai.

Et le corollaire : **ce que le téléphone sait tout seul se lit en premier.**
`sessionLocale()` ne demande rien à personne — la session et le type de
compte sont dans les métadonnées, déjà sur l'appareil. La requête à la base
ne sert plus qu'à confirmer, en arrière-plan. Avant, les deux étaient
collées : sans réseau, un artisan connecté se retrouvait devant
« Choisissez votre profil », comme s'il n'avait pas de compte.

#### Un composant animé ignore SILENCIEUSEMENT un style en forme de fonction

`Animated.createAnimatedComponent(Pressable)` n'accepte pas
`style={({ pressed }) => […]}`. Aucune erreur, aucun avertissement : le
composant se retrouve **sans aucun style**.

Le bandeau d'erreur a ainsi affiché son texte blanc sur le fond beige de
l'application — illisible — alors que c'est le SEUL canal par lequel
l'application parle. Un bandeau d'erreur invisible est pire que pas de
bandeau du tout. Trouvé en coupant le réseau, pas en relisant le code.

> **L'animation à l'extérieur, l'état pressé à l'intérieur.** Une
> `Animated.View` qui porte `entering`/`exiting`, et un `Pressable`
> ordinaire dedans. `npm run verifier-etats` refuse l'autre forme.

#### Le mode démonstration doit se VOIR

`api.mode` valait `'demo'` depuis le début et n'était **lu nulle part** :
calculé, puis oublié. Pendant ce temps, sans fichier `.env`, l'application
répondait « Votre publication est en ligne » alors que rien n'était écrit —
la première règle de ce document, et la panne qui a laissé passer le format
`montage` refusé par la base pendant plusieurs jours.

> Une bande noire permanente le dit désormais, avec la bande de chantier,
> et les messages de publication changent de texte dans ce mode.

#### Et la règle d'ensemble

> **Un échec ne s'affiche jamais en vert.** Trois appels à `showBanner`
> annonçaient « Publication non enregistrée » avec une coche. Le contrôle
> relit tous les appels et refuse ceux dont le texte parle d'échec.
>
> **Les messages d'erreur sont en français et disent quoi faire.** La
> traduction vivait enfermée dans `AuthScreen.js` ; elle est devenue
> `src/lib/erreurs.js`, et elle reconnaît le réseau, la session expirée,
> une contrainte `check` refusée (avec renvoi à `schema.sql`), une règle
> RLS, un droit manquant sur une fonction.

### Les listes et la frappe — le lot 4 (02/10/2026)

#### Mesurer avec SEPT éléments ne prouve rien

La première mesure du lot n'a montré aucun gain : avec sept annonces de
démonstration, une liste virtualisée et une boucle ordinaire font
exactement la même chose. Il n'y a rien à économiser.

La bonne méthode : **gonfler le jeu d'essai au cas réel**, et comparer les
deux versions côte à côte — `git worktree add` sur le commit précédent, le
même jeu gonflé des deux côtés, deux serveurs, un seul script de mesure.

| nœuds montés, 217 éléments | avant | après |
|---|---|---|
| Place des pros | **5 939** | 317 |
| Demandes | **2 265** | 257 |

Le TEMPS, lui, n'a presque pas bougé au navigateur (−6 %) — et c'est
normal : il a la mémoire et le processeur d'un ordinateur. Ce que le
nombre de nœuds prédit, c'est le comportement du téléphone. À dire comme
ça, sans gonfler le résultat.

#### `ChampLocal` — et pourquoi un simple différé ne suffisait pas

Trois champs vivaient encore dans `OpusApp`, donc chaque lettre redessinait
toute l'application. Mesuré, processeur bridé six fois :

| | avant | après |
|---|---|---|
| description d'une publication | **203 ms/lettre** | 60 |
| message dans une conversation | 132 | 48 |
| commentaire | 72 | 58 |

203 ms, c'est le niveau de l'assistant IA du 29/09 — celui dont le
propriétaire avait dit « on ne peut pas écrire dedans ».

`useRechercheDifferee` ne pouvait pas servir ici : pour une recherche, le
texte ne sert qu'à filtrer, on peut donc attendre. La description, elle,
commande le bouton « Publier », l'assistant de relecture, et la
publication elle-même — un différé aurait cassé les deux premiers et
rendu la troisième approximative.

> **`src/components/ChampLocal.js` garde le texte, et ne remonte que les
> FRANCHISSEMENTS DE SEUIL** — il devient vide, il cesse de l'être, il
> dépasse la longueur minimale. Deux ou trois fois dans une saisie au lieu
> d'une fois par lettre. Et `lire()` rend la valeur du moment, via une
> référence : publier juste après la dernière lettre doit envoyer le texte
> ENTIER.

#### Deux pièges rencontrés

1. **Un commentaire JSX juste après `return (` casse la construction.**
   `return ( {/* … */} <FlatList …` n'est pas du JSX : Babel s'arrête sans
   indiquer la cause réelle. Le commentaire se met AU-DESSUS du `return`.
2. **`React.memo` ne sert à rien si on lui passe des fonctions.**
   `jyAiRepondu` et `estPourMoi` sont recréées à chaque rendu de l'écran :
   chaque carte se croyait différente. On passe le RÉSULTAT (`mien`,
   `dejaRepondu`), qui ne change que lorsqu'il change vraiment.

Et un détail d'affichage : **l'en-tête d'une `FlatList` n'est pas séparé du
premier élément** par `ItemSeparatorComponent`. Sans
`ListHeaderComponentStyle`, le filtre se collait au bord de la première
carte.

`npm run verifier-listes` tient les sept listes, leurs trois réglages,
les six composants mémorisés et les trois champs sortis d'`OpusApp`.

### Viser avec un gant, lire au soleil — le lot 5 (02/10/2026)

Mesuré au navigateur en relevant la boîte RÉELLE de chaque zone appuyable,
sur cinq écrans : **70 cibles sur 71 sous 44 points**, la plus petite à 14.
Et le contraste, calculé sur la palette : bordure d'un champ 1,65 : 1,
texte secondaire 4,01, texte orange sur le fond 2,76.

Autrement dit : dehors, on ne voyait plus où étaient les champs, et on ne
touchait pas ce qu'on visait.

> **44 points, c'est la mesure d'Apple**, tirée de la taille d'un doigt. Et
> les utilisateurs d'Opus ne sont pas assis à un bureau : un maçon en gants
> n'a plus un doigt de 7 mm mais une surface molle de 15 mm qui ne sent pas
> où elle appuie.

`theme.js` porte `TOUCHE = 44` et `viser(hauteur)`. Deux façons d'y arriver,
et elles ne se valent pas :

1. **Agrandir la BOÎTE** avec du remplissage — l'icône garde sa taille.
   Ça se voit, ça se mesure, et ça vaut aussi à la souris. **À préférer.**
2. **`hitSlop`**, quand la mise en page ne peut pas grandir. Mais
   `react-native-web` l'ignore : **ça ne se vérifie PAS au navigateur**.

> **Toute marge de visée passe par `viser()`**, jamais par un nombre écrit à
> la main. `hitSlop={8}` sur une boîte de 14 donne 30, pas 44 — il y en
> avait 37 dans le projet, tous faux. `npm run verifier-cibles` les refuse.

#### Les couleurs : ce qu'on remplit, et ce qu'on lit

L'orange de signature **#E85C1F ne bouge pas** — c'est l'identité. Mais en
TEXTE il donne 3,51 : 1 sur blanc et 2,76 sur le fond.

> **`C.accent` pour ce qu'on REMPLIT** (boutons, pastilles, barres, icônes).
> **`C.accentTexte` (#B14212) pour ce qu'on LIT** : la même teinte, 18°, à
> l'identique, assombrie juste assez — 5,74 sur blanc, 4,52 sur le fond.

Deux autres corrections de lisibilité, visuellement imperceptibles :
`muted` passe de #726E63 à **#6A665C** (4,01 → 4,51 sur le fond), et les
champs reçoivent leur propre bordure **`bordChamp` #8D8164** (1,65 → 3,85),
les cartes gardant `line`. **Une bordure de champ n'est pas un séparateur :
elle dit où appuyer.**

`npm run verifier-cibles` RECALCULE tous ces contrastes à chaque passage :
une couleur ajoutée sans y penser le fera rougir.

#### Le reste du lot

`ChampMotDePasse` : un œil pour relire — au soleil, avec des mains sales,
on se trompe —, plus `autoComplete` et `textContentType`, sans quoi iOS ne
propose ni le trousseau ni « mot de passe fort ». Le clavier enchaîne les
champs (`returnKeyType` + `focus()`), ce qui demande `forwardRef` sur
`Field`.

`retour.annoncer()` : **`accessibilityLiveRegion` n'existe que sur
Android**. Sur iPhone, un échec passait complètement inaperçu pour qui se
sert de VoiceOver — on appuyait sur « Publier », on n'entendait rien, on
recommençait. Tout message du bandeau y passe désormais.

`retour.useMouvementReduit()` : « Réduire les animations » n'est pas un
goût, ce réglage existe pour les personnes que le mouvement rend malades.
Il devient urgent maintenant qu'Opus bouge.

#### Deux pièges rencontrés

1. **Agrandir les boutons casse les en-têtes.** Le « Suivre » passé à 40
   points recouvrait le nom de l'artisan. Il faut `flex: 1, minWidth: 0` sur
   le bloc qui porte le texte — sinon il pousse la rangée au lieu de se
   raccourcir. Et dans la ligne de métadonnées, **c'est la ville qui se
   coupe, pas l'heure** : « il y a 2 h » est plus utile que la fin du nom
   d'une commune.
2. **Un contrôle qui accuse la documentation, pour la TROISIÈME fois.**
   `verifier-acces` a signalé « bouton sans étiquette » sur l'exemple écrit
   dans le commentaire de `viser()`. Il retire désormais les commentaires
   avant de lire, comme `verifier-imports` et `verifier-retour`.

### Le lot 8 — l'atelier (02/10/2026)

#### `npm run verifier` : UNE commande

Vingt-deux contrôles, et aucun moyen de les lancer ensemble — il fallait les
connaître par leur nom. Autrement dit, personne ne les lançait tous, jamais.

> **`npm run verifier` lit le CODE DE SORTIE de chaque contrôle**, jamais son
> texte, et distingue un contrôle qui ÉCHOUE d'un contrôle qui **n'a pas pu
> se lancer**. C'est la règle que ce document posait depuis le matin et que
> rien ne tenait — celle que `verifier-montage` avait violée pendant des
> jours sans que personne ne le voie.
>
> Et il **découvre** les contrôles dans `package.json` au lieu d'en tenir une
> liste : un contrôle ajouté demain entre tout seul.

#### Le linter a trouvé en un passage ce que l'œil n'avait pas vu en trois jours

86 fichiers de JavaScript, aucun linter. Premier passage, **deux défauts
réels** :

1. **`setMsgDraft` appelé à deux endroits alors que la fonction n'existait
   plus** depuis le lot 4. Un `ReferenceError` à chaque fois qu'un
   particulier contactait un artisan, et à chaque réponse à une annonce.
2. **`latitude` et `longitude` écrits DEUX FOIS** dans le même objet de
   `api.js` : la seconde paire écrasait la première en silence.

Et le premier est le plus instructif : `verifier-listes` cherchait bien
`msgDraft` dans `OpusApp`… **en respectant la casse**. `setMsgDraft` porte un
M majuscule. Le contrôle passait au vert pendant que l'application plantait.

> **Un contrôle écrit à la main cherche ce qu'on a pensé à chercher ; un
> linter lit ce qui est écrit.** Les deux sont nécessaires, aucun ne remplace
> l'autre.

Le réglage compte autant que l'outil. Deux familles de bruit ont été coupées,
et il faut savoir pourquoi avant de les rallumer :

- **`react/no-unescaped-entities`** : l'apostrophe française est dans un mot
  sur cinq. Cette règle a produit à elle seule la moitié des 194 premières
  alertes ;
- **`Deno` dans `supabase/functions/`** : ces fichiers tournent sur Deno, pas
  sur Node. Le signaler serait une erreur du linter, pas du code.

Il reste **33 alertes**, toutes de la famille `react-hooks` (les règles du
compilateur React). Elles décrivent de vrais risques, mais chacune demande un
arbitrage : les corriger en bloc serait réécrire `OpusApp` à l'aveugle. Même
parade qu'au lot 7, **un cliquet** — `npm run verifier-atelier` refuse que le
nombre monte.

#### Et la quatrième fois qu'un contrôle accuse la DOCUMENTATION

Le commentaire qui EXPLIQUE le défaut `setMsgDraft` contient le mot, donc le
contrôle corrigé l'a aussitôt signalé. C'est arrivé quatre fois maintenant :
**un contrôle qui lit du code retire d'abord les commentaires.**

#### Ce qui tourne tout seul

`.github/workflows/verifier.yml`, à chaque envoi : les 23 contrôles, puis la
construction du paquet **iOS et Android**. `npm ci` et pas `npm install` — il
installe exactement ce que dit le verrou, donc la machine teste les mêmes
versions que le poste du propriétaire.

Rien de ce qui demande un navigateur ou un téléphone n'y est, et c'est dit
exprès : les captures, les gestes au doigt et la fluidité réelle restent à la
main.

## Dépendances : vérifier avant de proposer

Deux paquets ont déjà été écartés après vérification sur npm :
`ffmpeg-kit-react-native` (déprécié, abandonné en janvier 2025) et
`react-native-video-processing` (aucune version depuis 2022). Toujours
regarder la date de la dernière publication avant de conseiller un paquet.

Et se rappeler qu'un **module natif impose un development build** : il ne
fonctionne pas dans Expo Go, ce qui est aujourd'hui le seul moyen de test du
propriétaire.
