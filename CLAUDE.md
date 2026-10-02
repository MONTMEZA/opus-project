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

Constaté le 30/09/2026. `npm install` affiche « 11 vulnerabilities » et
propose deux commandes. La seconde est un piège :

```
npm audit fix --force
→ Will install expo@46.0.21, which is a breaking change
→ added 471 packages, removed 57 packages
```

**Expo 57 redescendrait en 46.** C'est npm qui « corrige » une faille en
ramenant la dépendance à une version antérieure : il ne sait pas qu'Expo 46
ne fait plus tourner ce projet.

Ce que disent réellement ces alertes, une fois les doublons écartés — il
n'y a que DEUX causes, pas onze :

| paquet | d'où il vient | ce qu'il sert |
|---|---|---|
| `brace-expansion` | expo → @expo/fingerprint → minimatch | lire des motifs de fichiers |
| `uuid` | expo → @expo/config-plugins → **xcode** | générer un projet iOS natif |

Les deux sont **des dépendances d'Expo lui-même**, utilisées par les outils
qui tournent sur l'ordinateur pendant `npm start`. **Aucune ne part dans
l'application installée sur le téléphone.** Et `xcode` ne sert qu'au
`prebuild`, que ce projet ne fait jamais puisqu'il tourne dans Expo Go.

> **`npm audit fix` tout court : oui.** Vérifié — il n'a touché qu'une
> ligne du verrou (`brace-expansion` 5.0.9 → 5.0.12), n'a pas modifié
> `package.json`, a supprimé la seule alerte « high », et
> `npx expo install --check` répond toujours « up to date ».
>
> **`npm audit fix --force` : jamais.** Les dix alertes « moderate » qui
> restent ne se corrigent qu'en attendant qu'Expo mette à jour `xcode`.

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

1. **Un compte = un artisan aujourd'hui.** Il n'existe ni entreprise, ni
   salarié, ni rôle. Le cahier des charges en a besoin à cinq endroits, et le
   jour où ça changera, **toutes les règles RLS seront à réécrire**. En
   attendant : ne rien construire qui enfonce cette hypothèse.
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

Ce qu'il ne reproduit pas : le **défilement au doigt** (sur ordinateur, une
zone défilante répond à la molette, pas au glissement). L'arbitrage entre un
glissement horizontal et un défilement vertical ne peut donc **pas** être
vérifié ici. À dire explicitement.

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
>
> Un `revoke` isolé passe, lui, s'il est seul dans un bloc `do $$ … $$`.

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
