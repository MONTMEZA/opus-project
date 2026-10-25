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
`prebuild`, qui tourne sur les serveurs d'EAS au moment d'un build
(development ou preview, depuis le 15/10), jamais dans le téléphone.

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

#### Un TROISIÈME cahier des charges est ANNONCÉ (17/10/2026)

Le propriétaire veut, au-delà d'Opus, une **base de connaissances du BTP**
(lois, DTU, façons de faire, étapes de chantier, prix) qui rende ses agents
« imbattables », servie par une API à d'autres applications. Il enverra un
cahier des charges : **rien ne se construit avant**. Ce qui se décide dès
maintenant — données rangées de façon réutilisable, données des artisans qui
ne sont pas à Opus, licences de ce qu'on y met — est dans `docs/A-FAIRE.md`,
dernière section.

#### Un ADDENDUM au cahier Visite, remis le 19/10/2026

`docs/ADDENDUM-QR-DOSSIER-TRAVAUX.md` — « QR & Dossier Travaux
Particulier », transcription ; le PDF à côté **fait foi**. Il précise le
cahier Visite (ci-dessous) : un **QR professionnel** permanent qui mène à la
page du pro ; un **QR particulier**, carte client que le pro scanne DANS Opus,
après quoi le particulier accepte et une fiche client est créée ou reliée —
**jamais** un devis ni une visite ; et un **Dossier Travaux**, espace privé du
particulier, partageable avec plusieurs pros, document par document.

Les consignes du propriétaire en le remettant, mot pour mot :
« Ne refais pas le module devis à cause de ce document. » — « Ne développe
pas automatiquement l'intégralité du Dossier Travaux ou du système QR
maintenant. » — « Pour le moment, notre priorité reste de terminer
correctement la partie devis. » — « Ne commence aucune refonte importante
sans ma validation. »

> **IL NE SE CONSTRUIT PAS ENCORE.** L'audit que demande son §21 est fait :
> `docs/AUDIT-ADDENDUM-QR.md`. **À relire avant le lot 1 du devis**, et
> avant de toucher au carnet de clients, au stockage ou aux partenariats.

Ce qu'il en ressort, à ne pas redécouvrir :

1. **Rien à refondre.** Le carnet `clients` est déjà la « fiche client »
   de l'addendum ; le QR particulier sera son lien vers un compte, ajouté à
   côté — c'est exactement la raison pour laquelle `clients` n'a pas de
   `compte_id`.
2. **Douze règles pour le devis (D1 à D12)**, gratuites aujourd'hui et
   coûteuses une fois la table `devis` écrite. Les trois qui comptent : le
   client d'un devis est une FICHE du carnet, jamais un compte ; aucun lien
   d'origine (demande, urgence, visite, dossier, QR) n'est jamais
   obligatoire — ni par une case, ni par une contrainte, ni comme motif de
   refus de remise ; et une clé `on delete set null` sur un devis REMIS doit
   pouvoir passer à vide malgré le figeage, sinon elle pointe une ligne qui
   n'existe plus, sans erreur (mesuré, avec sa parade). **Validées par le
   propriétaire le 19/10 : `docs/PLAN-DEVIS.md` §10.15.**
3. **Quatre défauts qui existent DÉJÀ**, trouvés en cherchant quoi
   réutiliser, revérifiés sur la vraie base : les règles générales du
   stockage (voir « Les pièces jointes en messagerie ») ; les partenariats
   entre pros (une demande en attente se lit sans compte, et celui qui la
   reçoit peut en changer l'AUTEUR en l'acceptant) ; `demande_reponses`
   lisible sans compte ; le nom, la ville et le code postal de chaque compte
   lisibles sans compte. **Aucun n'est corrigé** : décidé le 19/10, un petit
   lot de sécurité (« S ») les traite AVANT le lot 2 du devis, le stockage
   d'abord. La ville visible y reste une décision à lui poser.

> **Une brique qu'on s'apprête à réutiliser se relit comme un défaut
> possible.** Les partenariats devaient servir de modèle à la relation
> client ↔ pro : leurs règles ont deux défauts mesurés. On reprend l'idée
> (`en_attente` / `accepte` / `refuse`), pas les règles.

#### Un SECOND cahier des charges, remis le 11/10/2026

`docs/CAHIER-DES-CHARGES-VISITE.md` — « Visite intelligente & préparation
assistée des devis ». L'original Word est à côté et **fait foi**. Le
propriétaire l'a remis en disant : « ne t'arrête pas de travailler,
prends-le en considération et garde-le en mémoire pour quand tu en auras
besoin ».

> **IL NE SE CONSTRUIT PAS ENCORE**, et le document le dit lui-même en
> section 22 : « NE COMMENCE PAS PAR CODER. […] ATTENDRE VALIDATION DU
> PLAN avant toute modification importante. » Un audit de l'existant et un
> plan passent d'abord.

**Mais il change DÈS MAINTENANT une décision du module suivant**, et c'est
sa section 19 : le **devis** doit être construit de façon à accepter **une
source manuelle OU une visite validée**, sans jamais rendre la visite
obligatoire. Même règle pour le QR, qui ne doit jamais être une condition
d'accès au devis. À tenir le jour où les devis seront posés.

Et ce qu'il confirme du carnet de clients livré la veille : sa section 13
sépare `Client` et `ClientLink` — la relation explicite entre un
professionnel et un particulier, qu'elle vienne d'un QR ou d'une demande.
C'est exactement pour cela que `clients` n'a **aucun `compte_id`** : ce
lien naîtra avec le lot qui s'en sert.
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

> **CE TITRE N'EST PLUS VRAI — confirmé par lui le 20/10/2026 : il a une
> SARL ACTIVE, rattachée à son compte principal (celui d'administrateur).**
> Constaté en relevant la FORME de la base pour le défaut du n° de TVA, puis
> demandé, pas déduit. Ce qui change, et ce qui ne change pas :
>
> - « ne jamais lui écrire des mentions légales de société : ce serait
>   faux » ne vaut plus pour CETTE société. Mais ses mentions se remplissent
>   AVEC LUI, depuis ses pièces — jamais déduites de la base ni du
>   répertoire, et son identité (nom, SIREN) n'entre dans aucun document du
>   dépôt ;
> - que cette SARL soit l'ÉDITEUR d'Opus est une décision à lui poser le
>   jour de la mise en ligne, pas une conséquence : `STATUT` reste `'essai'`
>   tant qu'Opus n'est pas ouvert au public ;
> - les paragraphes ci-dessous décrivent la situation d'avant le 20/10.

**Précisé par lui le 17/10/2026 : il a eu une entreprise, aujourd'hui
FERMÉE.** Aucune entreprise active à son nom. La mention « micro-entrepreneur »
écrite plus bas le 04/10 décrivait ce qu'il était, pas ce qu'il est. Ses deux
anciens devis ne servent que de modèle de mise en page.

Ne jamais lui écrire des mentions légales de société : ce serait faux, et une
mention légale fausse engage sa responsabilité. `src/data/legal.js` porte un
champ **`STATUT`** (`essai` · `particulier` · `micro` · `societe`) qui décide
de ce que la loi exige et de ce que les écrans affichent. Il vaut `'essai'` :
l'application n'est pas ouverte au public, il n'y a donc rien à publier.

`npm run verifier-legal` refuse de passer si le statut change sans que les
champs correspondants soient remplis. **À lancer avant toute mise en ligne.**

L'autre geste qui n'appartient qu'à lui : activer la protection contre les
mots de passe compromis dans Supabase → Authentication → Policies.

#### L'adresse de contact appartenait à EDF (12/10/2026)

Trouvé en préparant le SIRET à l'inscription, en cherchant par quelle porte un
artisan refusé pourrait « contacter la plateforme ».
`EDITEUR.email` valait **`contact@opus-project.fr`** depuis le 21/09, avec le
commentaire « À VÉRIFIER : cette adresse doit exister et être relevée ».

| relevé au registre du `.fr` | |
|---|---|
| titulaire de `opus-project.fr` | **ÉLECTRICITÉ DE FRANCE** |
| enregistré le | 09/06/2008 |
| prestataire | Nameshield, et des serveurs de noms `observatoiredesmarques.fr` |

C'est un domaine de **surveillance de marque**. Personne n'aurait jamais relevé
cette boîte, et personne n'aurait **pu**. Or l'adresse était affichée à **onze
endroits** des textes légaux, dont celui-ci :

> « Opposition et limitation : écrivez à … **Nous répondons sous un mois.** »

> **Une promesse de réponse sur une adresse injoignable est écrite dans un
> document qui engage.** C'est la famille du « X est prévenu » du 01/10, sauf
> qu'ici le texte est opposable.

**Et le contrôle passait au vert** : `verifier-legal` vérifiait
`EDITEUR.email.includes('@')`. L'adresse était parfaitement bien formée.
Dixième fois dans ce projet qu'un contrôle vérifie une **syntaxe** au lieu
d'une **propriété** — et celle-ci ne se vérifie par aucun script : qu'une boîte
existe et soit **relevée**, seul un humain le sait.

> **D'où `EDITEUR.emailReleve`**, un drapeau sur le modèle
> d'`identiteRemiseALHebergeur` et de `contratSousTraitance`. Le contrôle
> refuse une adresse écrite sans que ce drapeau soit coché, refuse le drapeau
> coché sans adresse, et **exige les deux dès que `STATUT` quitte `'essai'`**.

Mais un drapeau humain n'aurait PAS attrapé ce défaut-là : il suffisait de le
cocher. Ce qui l'attrape, et qui a été ajouté le même jour quand le
propriétaire a donné son vrai domaine, c'est une **propriété mesurable** :

> **`legal.js` nomme `DOMAINE = 'opus-project.com'`** — le sien, enregistré
> chez IONOS le 27/01/2025, vérifié au registre du `.com`. Et le contrôle
> exige qu'une adresse de contact soit **SUR ce domaine**. L'adresse d'EDF
> est alors refusée toute seule, drapeau coché ou non ; une adresse Gmail
> personnelle aussi.

Deux gardes de natures différentes, et il faut les deux : **le domaine se
mesure, la boîte aux lettres ne se mesure pas.** Éprouvé sur les quatre cas —
l'adresse d'EDF, une adresse personnelle et un domaine saboté sont refusés, la
bonne adresse passe.

Et la mesure qui lui dit quoi faire : le domaine porte **déjà** les serveurs de
courrier d'IONOS (`mx00.ionos.fr`, `mx01.ionos.fr`). Il n'y a rien à configurer
— créer la boîte dans son espace client suffit, et l'adresse marchera aussitôt.

Les onze usages passent désormais par **`ligneContact()`** et **`parEcrit()`** :
sans adresse, le texte dit la vérité au lieu d'afficher un trou. Et le garde-fou
mécanique est ailleurs — **le contrôle relit les textes ENGENDRÉS et refuse d'y
trouver « null »**, ce qui attrape quiconque remettrait `${EDITEUR.email}` dans
une phrase. Éprouvé en cassant ce qu'il surveille : six sabotages, les cinq qui
devaient être refusés le sont.

Ce que ça laisse ouvert, et qui n'appartient qu'à lui : **il a un nom de domaine
et une marque déposée, mais aucune boîte aux lettres créée.** Tant qu'elle
n'existe pas, deux droits RGPD — opposition et limitation — ne peuvent pas
s'exercer par écrit, et les textes le **disent**. Les autres s'exercent déjà par
un bouton : l'export, la rectification, la suppression de compte.

> **Et c'est pour ça que la porte de secours du SIRET doit vivre DANS Opus** :
> un formulaire qui dépose la demande dans la file du back-office ne dépend
> d'aucune boîte aux lettres.

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

### Être professionnel ne se décide pas soi-même (15/10/2026)

Section 44 de `schema.sql`, `npm run verifier-pro`. Trouvé en préparant le
SIRET à l'inscription, et c'est le défaut du badge un cran plus haut : le
badge tenait, mais **le statut de professionnel lui-même se prenait**.

`est_un_pro()` rend « a une ligne dans `professional_profiles` ». Rien ne
disait qui avait le droit d'en avoir une. Prouvé sur PostgreSQL 16, avec la
seule clé publiable, un particulier :

1. se déclarait pro — `update users set type = 'pro'` → `UPDATE 1` ;
2. s'insérait une fiche, et `est_un_pro()` devenait VRAI ;
3. **lisait les demandes des particuliers** — la commune, le texte, et
   l'adresse des photos de leur maison ;
4. publiait dans le fil, posait une annonce, ouvrait un carnet de clients,
   créait un chantier public.

« Le fil est réservé aux professionnels » n'était tenu que par l'écran
(`canPublish`). Relevé sur la vraie base avant de corriger : 7 fiches sur 7
sur un compte pro, aucun contenu écrit par un non-pro. **Le trou n'a jamais
servi.**

> **Un prédicat qui repose sur l'EXISTENCE d'une ligne a besoin d'une règle
> sur qui peut CRÉER cette ligne.** Sinon il ne dit rien : il constate ce
> qu'on lui a donné.

**Et le futur compte FOURNISSEUR ne devra jamais rendre `est_un_pro()`
vrai** : ce prédicat ouvre la lecture des demandes des particuliers, et un
négoce n'a rien à y lire. Aujourd'hui un négoce peut s'inscrire comme
artisan (le code d'activité ne bloque rien) ; mesuré le 18/10, aucun ne
l'a fait (`docs/COMPARATEUR-MATERIAUX.md` §1, question « Négoces »).

Les deux verrous :

- **`tient_le_type_du_compte()` (OP004)** — le type ne change pas par la
  main de son titulaire. Un refus qui DIT pourquoi, et pas un retour
  silencieux comme pour le badge : aucune version de l'application n'envoie
  un type différent, seul un client modifié le fait. Un type renvoyé
  INCHANGÉ passe (`is distinct from`) ;
- **`exige_un_compte_pro()` (OP005)** — une fiche n'existe que sur un compte
  pro. C'est le verrou qui compte : avec lui, `est_un_pro()` redevient une
  vérité.

#### La seconde porte, trouvée en écrivant le contrôle

Le premier verrou ne regardait que l'UPDATE. Or `preparer_suppression_compte()`
efface la ligne `users` de l'appelant, **dont le jeton reste valide** : il
la recréait avec `type = 'pro'` (« ecriture mon user » est `for all`), puis
s'insérait une fiche. Prouvé, puis fermé : le verrou porte sur `before
insert or update of type`, et une ligne recréée par son titulaire naît
particulier, ou ne naît pas.

> **C'est la leçon de la section 31, refaite à l'identique : `for all`,
> c'est quatre portes.** Un verrou posé sur un seul verbe SQL ne ferme
> qu'une porte sur quatre — et rien ne le signale.

Et la ligne d'un compte naît d'un déclencheur sur `auth.users`, où
`auth.uid()` est **vide**. Vérifié sur la vraie base : une inscription pro
par `/auth/v1/signup` crée toujours ses deux moitiés. Sans cette mesure,
le verrou de l'INSERT aurait pu fermer l'inscription elle-même.

#### Fermer ce qui en dépendait — et seulement en ÉCRITURE

Le fil, les annonces et les réponses aux annonces exigent `est_un_pro()`
dans leur **`with check`**, jamais dans leur `using`. `using` gouverne aussi
la SUPPRESSION : on retire toujours ce qu'on a posé.

Les clients et les chantiers, eux, n'ont demandé qu'**une ligne** :
`est_mon_entreprise()` exige désormais `est_un_pro()`. C'est exactement
pour ce jour-là qu'elle avait été écrite au lieu de 56 comparaisons à la
main — et `verifier-chantier`, qui exigeait « exactement
`auth.uid() = p_entreprise` », a rougi comme il devait : la règle changeait,
on l'a mis à jour en disant pourquoi.

#### Un refus de la base n'accuse pas toujours la règle

Sur la vraie base, cinq essais ont d'abord répondu « permission denied for
table users ». La cause était MON essai : `Prefer: return=representation`
demande à la base de RENVOYER la ligne, donc de lire toutes ses colonnes —
fermées depuis le 29/09. L'application ne le demande jamais
(`.update(patch).eq()` sans `.select()`).

> **Pour éprouver une écriture sur `users`, `Prefer: return=minimal`,
> comme l'application.** Sinon on mesure les droits de colonne, pas la
> règle.

#### Vérifié, et comment

Les 21 cas de `supabase/essais-section-44.sql` sur un PostgreSQL 16 neuf,
schéma rejoué deux fois, les 43 contrôles, `npx expo export --platform ios`.
`verifier-pro` éprouvé en cassant ce qu'il surveille : **quatorze sabotages,
quatorze refus**. Puis sur la VRAIE base, migration appliquée sans aucun
ordre qui commence par `drop` (`alter policy` pour les trois politiques),
avec deux comptes jetables supprimés dans la même session (base revenue à
13 comptes / 7 fiches / 20 publications) :

| | résultat |
|---|---|
| inscription pro par `/auth/v1/signup` | les deux moitiés, `verifie = false` |
| le particulier se déclare pro | **400 OP004** |
| il s'insère une fiche | **400 OP005** |
| il lit les demandes | **`[]`** — l'artisan, lui, en lit |
| il publie, ouvre un client, un chantier, une annonce | **403** ×4 |
| seconde porte : données effacées, ligne recréée en pro | **400 OP004** |
| …recréée sans type, puis une fiche | 201, puis **400 OP005** |
| l'artisan publie, pose une annonce, crée un chantier | 201, et **il les retire** (204) |
| il enregistre son profil, type inchangé | 204 |
| il redevient particulier tout seul | **400 OP004** |

**Ce qui n'a PAS été fait ce jour-là, et c'était voulu** : vérifier le
SIRET. C'est le lot suivant — et il n'aurait rien protégé sans celui-ci :
une condition posée à l'inscription ne sert à rien si l'on devient pro par
un `INSERT` juste après. **Fait le 17/10 : section suivante.**

#### Et cette section a cassé SEPT fichiers d'essais pendant deux jours

Constaté le 15/10 au soir, réparé le 17/10. Les essais 25, 27, 28, 29, 37,
39, 40 et 43 fabriquaient leurs comptes pro à la main : depuis OP004/OP005,
la première écriture tombait, puis « current transaction is aborted », et
chaque cas suivant rendait un résultat VIDE. `verifier-portes`, qui lit le
TEXTE de l'essai 43, passait au vert pendant ce temps. Pire : 25, 27 et 28
n'avaient jamais contenu leurs comptes — écrits contre une base qui les
avait déjà, ils n'éprouvaient rien sur une base neuve depuis le premier
jour.

> **Un verrou qui ferme une porte se rejoue contre TOUS les fichiers
> d'essais, pas seulement le sien.** `npm run verifier` ne joue aucun essai
> SQL (voir A-FAIRE §2.3) : rien d'autre ne le dira. Et un fichier d'essai
> commence par un « cas 0 » qui prouve que sa donnée EXISTE.

### Le SIRET à l'inscription — lot 1 bis (15-17/10/2026)

Section 45 de `schema.sql`, fonction Edge `supabase/functions/siret/`,
`src/lib/siret.js` (copié OCTET POUR OCTET dans la fonction — `verifier-siret`
le compare), `npm run verifier-siret`. Plan, relectures et livraisons dans
le dossier de travail de la session du 15/10 ; ce qui suit est ce qu'il ne
faut pas redécouvrir.

#### Ce que ça prouve, et ce que ça ne prouve PAS

Qu'une entreprise **existe** et est **active** au répertoire Sirene de
l'INSEE. **Jamais** que celui qui tape le numéro en est le titulaire : un
SIRET est public, comme un Kbis ou un avis de situation, que n'importe qui
télécharge. Le badge « vérifié » reste un geste humain, sur pièces.

> **Le vocabulaire est une règle, et un contrôle la tient** : « répertoire
> Sirene (INSEE) », jamais « registre » ; et jamais « vérifié(e) » pour ce
> niveau-là — ce mot appartient au badge. Une mention « vérifiée » obtenue
> en trente secondes avec le numéro d'un autre serait un outil
> d'hameçonnage. D'où, aussi : **aucune mention publique sur la fiche**.

#### La chaîne, et pourquoi chaque maillon est là

1. **La fonction Edge `siret`** interroge `recherche-entreprises.api.gouv.fr`
   (PostgreSQL ne sait pas appeler un service web : ni `pg_net` ni `http` sur
   la vraie base). Clé de Luhn d'abord (avec l'exception La Poste, dont le
   SIREN 356000000 ne passe pas Luhn), puis « SIREN déjà rattaché », puis le
   cache de 24 h, puis les limites, puis le répertoire (8 s au plus).
2. Elle range ce qu'elle a lu dans **`preuves_siret`**, que personne d'autre
   ne peut écrire. **Le déclencheur d'inscription n'accepte un compte pro
   que sur cette PREUVE** (OP006), jamais sur ce que le téléphone prétend.
   L'identité de l'entreprise vient de la preuve, pas du formulaire.
3. Un SIREN — une ENTREPRISE, pas un établissement — ne se rattache qu'à
   un seul compte (OP007). **`entreprise_registre`** est privée (le
   titulaire et l'administration), avec historique : un déménagement crée
   une ligne nouvelle et retire l'ancienne (« transfert de siège »).
4. **Toute fiche pro naît dans une fonction de la base** : l'inscription,
   `devenir_pro()`, l'acceptation d'une demande par l'administration.
   L'INSERT client est fermé (OP010) ; `ensureProProfile` et
   `reparerFichePro` ont disparu.

Quatre détails qui ont coûté une relecture chacun :

- **Toutes les issues partent en HTTP 200.** `supabase.functions.invoke`
  transforme toute réponse non-2xx en « Edge Function returned a non-2xx
  status code » et JETTE le corps français. Un statut d'erreur ne sort que
  pour une vraie panne d'Opus.
- **L'adresse IP vient de `cf-connecting-ip` puis `x-real-ip`, JAMAIS de
  `X-Forwarded-For`**, qui arrive exactement tel que le client l'a écrit
  (mesuré dans les journaux). On ne range que son empreinte HMAC, et le /64
  d'une IPv6 (plus un seau par /48) : un abonné en a 2^64 à volonté.
- **`exige_un_compte_pro()` est passée en `security invoker`.** Dans une
  fonction `security definer`, `current_user` vaut TOUJOURS le
  propriétaire : la garde « l'écriture vient d'un client » (OP010) n'aurait
  jamais mordu. Mesuré : `postgres` en definer, `authenticated` en invoker.
- **GoTrue rend HTTP 500 « Database error saving new user »** quand le
  déclencheur lève OP006 ou OP007 : le message français est perdu. D'où la
  revérification par la fonction JUSTE AVANT `signUp`, et la traduction de
  ce message dans `erreurs.js`.

#### La porte de secours vit DANS Opus

Le répertoire ne répond pas, l'entreprise est non diffusible, le SIREN est
déjà pris : on crée un **compte particulier EN ATTENTE** et une ligne de
`demandes_pro`, suivie dans le profil, notifiée à l'administration, que
l'artisan complète (message, justificatif dans l'espace PRIVÉ `documents`)
ou annule. Elle ne dépend d'aucune boîte aux lettres — c'est exactement la
raison donnée le 12/10.

Trois verrous trouvés par les attaques, et pas à l'œil :

- **la date de dépôt et `traitee_par` sont fermés par des droits de
  COLONNE** : le client choisissait sa date (et passait en tête de file), et
  le demandeur lisait l'identité de l'administrateur qui l'avait refusé ;
- **l'administration n'est prévenue qu'une fois par compte et par 24 h** :
  une boucle dépôt/annulation l'inondait ;
- **un RETRAIT gèle l'entreprise** (`entreprise_registre.gele`) : sans le
  gel, le squatteur à qui l'on retirait un SIREN le reprenait dans la
  minute, par le même chemin.

#### Les comptes d'essai sur la vraie base — la routine change

> **Une preuve `essai` vaut pour UNE adresse**, écrite en minuscules dans
> `preuves_siret.pour_email` (`preuve_essai_check`) : une preuve posée pour
> un domaine entier aurait servi à n'importe quel compte jetable. On la pose
> par le connecteur, pour l'adresse exacte du compte d'essai, avant
> l'inscription.
>
> **Et la fonction Edge ne sert JAMAIS une preuve `essai`** : l'inscription
> au navigateur la revérifie juste avant `signUp`. Pour une inscription pro
> jetable par l'interface, on intercepte donc `/functions/v1/siret`
> (`page.route`) ; par `curl`, `/auth/v1/signup` suffit. On n'utilise
> JAMAIS le SIRET d'une vraie entreprise pour créer un compte, même jetable.

#### Le compte pro au vrai SIRET est l'entreprise du FRÈRE (17/10/2026)

Ouvert par le propriétaire lui-même pour essayer le SIRET : « la page est une
entreprise de mon frère, on pourra tester avec ». La base porte donc le SIRET,
la pièce d'existence et l'attestation d'assurance d'une entreprise qui n'est
pas la sienne, et le badge de cette fiche a été posé par lui, administrateur.

> **Un devis engage l'entreprise qu'il nomme.** On construit et on essaie avec
> ce compte à trois conditions (`docs/PLAN-DEVIS.md` 10.5) : l'accord du
> frère ; aucun devis réel au nom de cette entreprise sauf s'il l'émet
> lui-même — tout devis d'essai porte « Document d'essai — sans valeur » ;
> et s'il veut Opus pour de vrai, on lui REMET ce compte (une entreprise = un
> compte), avec ses propres CGU.

**Le frère est d'accord et s'en servira lui-même** (réponse du propriétaire,
17/10). Le badge reste donc ; à la remise du compte, le frère confirme ses
pièces et accepte lui-même les CGU. **Le jour où il enregistre un vrai client
ou remet un vrai devis, Opus a son premier utilisateur réel** : `STATUT` doit
quitter `'essai'`, et le propriétaire devient sous-traitant RGPD des clients
de son frère (`docs/PLAN-DEVIS.md` 10.12). À régler AVANT la remise.

Deux gestes à ne jamais confondre si ce compte doit partir : la suppression
par le chemin de l'application **libère** le SIREN ; un retrait par
l'administration le **réserve pour toujours** (section 45.3 bis). Et le
badge se retire par `admin_verifier_pro(…, false, false)`, pas par un
retrait d'entreprise.

#### Vérifié, et comment

`schema.sql` rejoué deux fois sur des bases neuves, les 63 cas de
`essais-section-45.sql` et les 19 fichiers d'essais (sept réparés au
passage, voir la section précédente), 45 contrôles, 74 sabotages refusés,
`npx expo export --platform ios` lu. **Avant d'appliquer**, la vraie base a
été comparée au dépôt objet par objet (empreinte du catalogue) : trois
restes connus, dont la contrainte `verification_statut_check` qui n'avait
jamais existé sur elle (posée depuis, sous condition). La migration,
simulée sur une copie qui imite ces restes, rend exactement l'empreinte
d'une base neuve. Puis, sur la VRAIE base, par le chemin de l'application :

| | résultat |
|---|---|
| un numéro mal formé | `mal_forme`, sans base ni réseau |
| le siège de La Poste, vrai appel au répertoire | `ok`, l'identité seule ; le second appel sort du cache |
| une origine web étrangère | **403** |
| un `X-Forwarded-For` forgé | ignoré — les journaux montrent la clé de l'adresse posée par l'hébergeur |
| inscription pro AVEC preuve d'essai | compte pro, fiche `verifie = false`, entreprise rattachée, CGU datées |
| inscription pro SANS preuve | **500 « Database error saving new user »**, aucun compte créé |
| particulier puis `devenir_pro` | pro, fiche, entreprise rattachée |
| porte de secours à l'inscription | particulier, demande `nouvelle`, administration prévenue une fois |
| il se déclare pro / s'insère une fiche | **OP004** / **OP010**, messages complets |
| il lit `preuves_siret` / `traitee_par` | **403** / **403** — sa demande, elle, se lit |
| la fonction, SIREN pris, sans jeton / avec celui du titulaire | `deja_utilise` / il passe |
| **au navigateur**, inscription artisan en deux temps | carte de l'entreprise, métier proposé d'après l'APE, arrivée sur le Fil |
| …« Modifier mon profil » | « Mon entreprise » en lecture seule, **aucun champ SIRET libre** |
| …particulier → « Passer en compte professionnel » | `devenir_pro` 200, « Publier » apparaît |
| …porte de secours, puis annulation | carte « en attente », puis `annulee` en base |

Comptes jetables supprimés par le chemin de l'application ; base revenue à
13 comptes / 7 fiches / 20 publications, 0 entreprise, 0 demande.

**Ce qui n'a PAS été vérifié** : rien sur l'iPhone (le clavier sous le
SIRET, le pavé numérique) ; l'inscription avec confirmation par e-mail
(désactivée sur le projet) ; l'envoi d'un justificatif ; tout le côté
administration (accepter, refuser, transférer, retirer) — couvert par les
essais SQL seulement.

#### Ce qui reste ouvert, et qui appartient au propriétaire

1. un REFUS de l'administration ne ferme pas le chemin automatique — seul le
   retrait (le gel) le fait ;
2. la porte de secours n'est PAS proposée quand la limite GLOBALE mord
   (`trop_d_essais` de portée « service ») ;
3. **un compte PRO n'a aucune porte** pour faire rattacher ou transférer
   son entreprise (OP008, OP009) : les messages disent « pas encore depuis
   l'application », sans rien promettre ;
4. `siret` et `demande_pro` restent dans les métadonnées de `auth.users`,
   hors de l'export RGPD — comme la ville et les métiers depuis la section 31.

#### La réserve survit au compte — section 45.3 bis (17/10/2026)

Trouvé par la critique de la mise à jour du plan devis, en relisant le
schéma. Le gel du retrait vivait SUR LA LIGNE retirée
(`entreprise_registre.gele`), et cette ligne meurt avec le compte
(`pro_id … on delete cascade`). **Le squatteur à qui l'administration
retirait un SIREN n'avait qu'à supprimer son compte**, puis s'inscrire de
nouveau avec le même numéro. Prouvé sur PostgreSQL 16 avant de corriger :
retrait, suppression, inscription → compte pro, entreprise rattachée, aucun
refus. La vraie base ne comptait aucune entreprise gelée : le trou n'a
jamais servi.

> **Ce qui doit survivre au compte ne peut pas vivre dans une ligne qui
> meurt avec lui.**

D'où `sirens_reserves` — le SIREN et des dates, sans clé étrangère, sans nom
ni motif — et `siren_reserve()`, seule écriture de la règle, appelée par
les trois portes de la base et par la fonction Edge. Une réserve se LÈVE
(`leve_le`), elle ne s'efface pas. Sa conservation après la suppression du
compte est dite dans la politique de confidentialité.

Vérifié : les quinze cas de `essais-section-45-bis.sql`, les dix-neuf autres
fichiers d'essais rejoués sur l'ancien et le nouveau schéma (seuls des
numéros de ligne changent), la migration d'une base qui avait un gel, onze
sabotages refusés. Sur la vraie base : les six fonctions comparées AVANT
(identiques une fois les commentaires retirés), migration additive, fonction
Edge redéployée et relue octet pour octet, appelée pour de vrai.

**Une colonne morte reste sur la vraie base** : `entreprise_registre.gele`.
Plus rien ne la lit ni ne l'écrit. Le connecteur refuse de la retirer (voir
« Le connecteur Supabase refuse un `drop` ») : c'est au propriétaire, une
ligne dans l'éditeur SQL — `docs/A-FAIRE.md` §1.0.

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

### Les permissions Supabase — décidé le 19/10/2026

Demandé par le propriétaire : que les LECTURES Supabase passent sans lui
demander à chaque fois, et que TOUTE écriture garde sa validation. Audit
complet : `docs/AUDIT-PERMISSIONS-SUPABASE.md`.

> **`mcp__Supabase__execute_sql` est INDIVISIBLE.** Une règle de permission
> vise le NOM d'un outil MCP, jamais le texte de sa requête (une règle
> `mcp__…` avec parenthèses est ignorée au chargement). L'autoriser, c'est
> laisser passer sans humain INSERT, UPDATE, CREATE, ALTER — la confirmation
> propre à Supabase ne voit que DROP, DELETE, TRUNCATE et l'UPDATE sans
> condition. **Ne jamais mettre en `allow` `mcp__Supabase__execute_sql`,
> `mcp__Supabase` ni `mcp__Supabase__*`.** Et pas de hook qui « devinerait »
> une lecture dans le texte SQL : `SELECT ma_fonction()`, `SELECT … INTO`,
> `WITH … DELETE … RETURNING` écrivent tous en commençant par « SELECT ».

La décision, « les deux pièces » :

1. **Un second connecteur en lecture seule**, `SupabaseLecture`, que le
   propriétaire ajoute lui-même dans claude.ai (connecteur personnalisé,
   `https://mcp.supabase.com/mcp?project_ref=lqzqdoiiqgqapqldrewg&read_only=true&features=database,debugging,development,docs,functions,storage`).
   Son `execute_sql` tourne sous `supabase_read_only_user` : la barrière est
   un RÔLE, pas une analyse de texte. Relevé sur la vraie base : aucun droit
   d'écriture, aucune fonction `security definer` exécutable par ce rôle, ni
   `dblink` ni `pg_net`.
2. **`.claude/settings.json`, commité**, dans une NOUVELLE session (les
   connecteurs se lisent au démarrage), après avoir relevé le vrai nom des
   outils du nouveau connecteur : `allow` sur ses outils, NOMMÉS UN PAR UN,
   et sur les outils du connecteur d'origine qui ne font que lire
   (`list_tables`, `list_extensions`, `list_migrations`, `get_advisors`,
   `query_logs`, `search_docs`, `get_project`, `get_project_url`,
   `list_projects`, `get_organization`, `list_organizations`,
   `list_branches`, `list_edge_functions`, `get_edge_function`,
   `generate_typescript_types`) ; `ask` sur `execute_sql`, `apply_migration`,
   `deploy_edge_function`, `create_edge_function_secret`, les cinq outils de
   branche, `create_project`, `pause_project`, `restore_project`. **Une règle
   `ask` force la confirmation même en mode Auto** — c'est elle qui garantit
   la validation de chaque écriture.

Et la discipline qui va avec :

- **lire par `SupabaseLecture`, écrire par `Supabase`** ;
- **le rôle de lecture lit TOUT, RLS ignorée** (`bypassrls`,
  `pg_read_all_data`) : `auth.users`, le carnet de clients, les demandes. La
  règle « on interroge la FORME, jamais le contenu » n'a plus de regard
  humain pour la tenir : elle ne tient que par moi ;
- **toute nouvelle fonction `security definer` qui écrit révoque `PUBLIC`** :
  si l'API de Supabase ne forçait pas chaque requête en transaction READ ONLY
  (NON ÉTABLI), une telle fonction laissée à PUBLIC deviendrait une porte
  d'écriture pour le connecteur de lecture.

### Le projet ne doit PAS vivre dans OneDrive (06/10/2026)

Signalé par le propriétaire : Expo Go ne s'ouvrait plus, et son terminal
affichait **ceci**, puis le serveur mourait :

```
Error: TreeFS: Failed to make parent directory entry for
       node_modules\expo\node_modules\negotiator\lib\charset.js
    at TreeFS.addOrModify (…/@expo/metro-file-map/build/lib/TreeFS.js:376)
    at Timeout.emitChange (…/@expo/metro-file-map/build/index.js:580)
```

**Ce n'est pas le code d'Opus.** `TreeFS` est l'arbre de fichiers du
surveillant de Metro, et `emitChange` dit tout : Metro a reçu un
événement de CHANGEMENT sur un fichier de `node_modules`, puis n'a pas
retrouvé le dossier parent de ce fichier dans son arbre. Autrement dit,
**quelque chose déplaçait les fichiers sous ses pieds pendant qu'il
tournait.**

Et ce quelque chose est dans le chemin de l'erreur :

```
C:\Users\dylan\OneDrive\opus-project nouveau\opus-project
```

> **OneDrive synchronise `node_modules` en continu** — plus de 40 000
> fichiers —, crée des « fichiers à la demande » qui sont des *placeholders*
> et non de vrais dossiers, et les remplace pendant l'exécution. Metro, qui
> tient un arbre en mémoire, ne peut pas suivre. C'est une incompatibilité
> connue entre OneDrive et tout outil qui surveille des fichiers, pas un
> défaut d'Expo.

**La parade, et c'est la seule vraie : sortir le projet de OneDrive.**
`C:\dev\opus-project`, par exemple. Pas « exclure node_modules de la
synchronisation » — OneDrive ne sait pas le faire proprement sur un
sous-dossier —, et pas « mettre la synchro en pause », qui est un pansement
qu'on oublie de remettre.

#### Et un second défaut, MESURÉ au passage

Windows refuse historiquement les chemins de plus de 260 caractères. Compté
sur le `node_modules` réel du projet, selon l'endroit où il vit :

| emplacement | longueur du préfixe | fichiers au-delà de 260 |
|---|---|---|
| `C:\Users\dylan\OneDrive\opus-project nouveau\opus-project` | 57 | **21** |
| `C:\dev\opus-project` | 19 | **2** |
| `C:\dev\opus` | 11 | **0** |

Les fichiers en cause sont les `prebuilds` d'`expo-image-manipulator`
(`SDWebImageWebPCoder.xcframework/…/dSYMs/…`). Ils ne servent qu'aux
constructions natives, donc ils ne cassent rien tout de suite — mais un
`npm install` qui n'arrive pas à les écrire laisse un `node_modules`
incomplet, et ça ressemble alors à n'importe quoi.

> **Le chemin le plus court gagne, et ce n'est pas du confort : c'est du
> budget de caractères.** `C:\dev\opus` fait tomber le compteur à zéro.

#### Ce qu'il faut lui dire, et dans cet ordre

1. fermer le serveur (Ctrl+C) et l'éditeur ;
2. supprimer `node_modules` AVANT de déplacer — c'est ce qui est lourd, et
   il se réinstalle ;
3. déplacer le dossier hors de OneDrive ;
4. `npm install`, puis `npx expo start -c` (le `-c` vide le cache de Metro,
   qui contient encore les anciens chemins).

Le `.env` et le dossier `.git` voyagent avec le dossier : rien n'est perdu.

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

**Depuis le lot 1 bis, un compte PRO jetable ne naît plus sans preuve** :
une preuve `essai` posée par le connecteur pour son adresse EXACTE, et
`/functions/v1/siret` intercepté au navigateur. Voir « Le SIRET à
l'inscription ».

**Et un compte jetable qui atterrit sur le Fil COMPTE DES VUES** sur les
publications du propriétaire — définitivement, puisque ce compteur ne
redescend jamais (section 35). Constaté le 17/10 : quatre secondes sur le
Fil, une publication passée de 4 à 5 vues. **Neutraliser
`**/rpc/enregistrer_vues` par `page.route` avant toute connexion**, dans
chaque essai sur la vraie base.

Et **relancer `npx expo start --web -c` avant chaque essai au navigateur** :
le surveillant de Metro a déjà servi un paquet périmé, et l'on voit alors
l'ancien texte en croyant éprouver le nouveau (constaté le 15/10).

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
| `alter table … drop column if exists` | **expire** (mesuré le 17/10 : retirer une colonne efface des données, et le connecteur attend une confirmation) |
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

> **CE PARAGRAPHE N'EST PAS TENU PAR LA BASE — relevé le 19/10/2026.**
> L'espace n'a pas de politique `update` ni `delete` À LUI, mais deux règles
> GÉNÉRALES de la section 13 (« remplacement de mes fichiers », « suppression
> de mes fichiers ») s'appliquent à TOUS les espaces, sans filtre : elles ne
> demandent que « le premier dossier du chemin est le mien ». L'expéditeur
> d'une pièce jointe peut donc la retirer ou la remplacer — et un Kbis déjà
> validé peut être remplacé sous le même nom. **Des règles RLS
> s'additionnent : une absence ne ferme rien si une règle plus large existe
> déjà.** Lu dans les règles, pas encore éprouvé par une écriture ; à
> corriger dans un lot mesuré, espace par espace, AVANT l'espace des PDF de
> devis (`docs/AUDIT-ADDENDUM-QR.md`, D7 et R1).

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

### « Pour moi » — le dernier onglet, audité parce qu'il ne l'avait pas été

Le propriétaire, après avoir essayé : « je pense qu'on a fait le tour de la
partie Découvrir ». Presque. Des trois onglets, un seul n'avait pas été
relu cette semaine — **« Pour moi »**, celui qui porte les demandes de
devis, de rappel et d'urgence. Quatre défauts y dormaient, et **aucun ne
faisait planter quoi que ce soit**.

#### Un échec de chargement annonçait une BONNE NOUVELLE

`OpusApp` calculait déjà `demandesRecuesEtat === 'echec'`. Il ne le
transmettait simplement pas à l'écran. Un chargement raté affichait donc :

> « Aucune demande pour le moment. »

Le bandeau rouge, lui, disparaît au bout de quelques secondes. Il restait
une phrase rassurante devant un écran qui n'avait **rien pu lire**.

> **Un travail qui n'a pas pu se faire ne doit jamais ressembler à un
> travail fait.** Même famille que le ménage de compte des pièces jointes,
> qui répondait `{"retires":0}` sans erreur en laissant le fichier en
> place, et que le « X est prévenu » du 01/10.

L'écran dit maintenant « Lecture impossible », explique que ce n'est pas
qu'il n'y en a pas, et propose un vrai bouton.

**Et le bouton est un BOUTON, pas un mot souligné dans le paragraphe.** Le
premier essai posait « Réessayer » dans le texte : au navigateur, le clic
ne partait pas — et viser un mot au pouce, c'est le défaut que le lot 5 a
passé une journée à corriger. `EmptyState` sait déjà porter une `action`.
Mesuré après : **98 × 44**.

#### `mes_demandes_recues()` rendait TOUT, pour toujours

Le fil a une borne, la Place des pros 200, les demandes 200 depuis le
matin. Cette fonction-là, rien — alors que l'écran écrit lui-même dans ses
commentaires qu'« un artisan qui travaille depuis six mois en a des
centaines ».

**Mais poser une limite seule aurait fait PERDRE DU TRAVAIL**, et c'est le
point de ce lot :

> **La borne ne devient honnête qu'avec le tri.** `order by (statut en
> attente) desc, created_at desc limit 200`. Sans le premier critère, 200
> demandes closes plus récentes poussent dehors un devis encore en
> attente — et l'artisan ne le sait pas.

Mesuré sur un vrai PostgreSQL, avec 1 devis en attente vieux de 400 jours
et 250 demandes closes du jour :

| | devis en attente gardés |
|---|---|
| `order by created_at desc limit 200` | **0** |
| `order by (en attente) desc, created_at desc limit 200` | **1, en tête** |

Et **la troncature se dit** : un pied de liste apparaît à 200. Une liste
coupée en silence, c'est la règle des « 3 annonces sans lieu précisé ne
sont pas affichées ».

Le piège de PostgreSQL rencontré au passage : **un `union` ne se trie pas
sur une expression** (« Only result column names can be used »). Il faut
envelopper l'union dans un `from (…) d` — et nommer explicitement les
colonnes du PREMIER membre, sinon `d.statut` et `d.created_at` ne
s'appellent pas forcément ainsi.

#### Le tri côté écran avait le même défaut, en plus petit

`trierDemandes` n'avait que deux rangs : l'urgence en attente, puis la
date. Un devis **refusé ce matin** passait donc devant un devis **en
attente d'hier** — sur un écran qui ne sert QU'À savoir qui attend. Trois
rangs désormais : l'urgence en attente, tout ce qui attend, le reste.

#### Et trois politiques étaient créées à DEUX endroits de `schema.sql`

`creation devis`, `creation rappel`, `creation sos` : une première fois
sans le blocage, une seconde fois avec (section 18). Le fichier reste
rejouable — la seconde gagne — mais c'est exactement ce que la section 30
venait d'interdire la veille :

> **Une politique ne se crée qu'à UN endroit.** C'est la première des deux
> qui se fait oublier le jour où la règle change.

#### Ce que cet audit confirme, et qu'il ne faut pas défaire

Vérifié avant de toucher à quoi que ce soit, parce que ça aurait été grave :
`'termine'` est bien accepté par les trois contraintes `check`, et
`calcule_client_verifie()` compte `'termine'` autant qu'`'accepte'` —
**clore un chantier ne retire pas au client son avis « client vérifié »**.
Et `notifie_demande()` se tait sur le passage en « terminé », à dessein :
le client était là, il le sait.

#### Couper UNE route pour éprouver un état d'échec

Nouveau, et réutilisable. Pour voir l'écran d'échec il faut faire échouer
une requête, et une seule :

```js
await poserRelais(page, { hote: HOTE });          // le relais d'abord
let couper = false;
await page.route('**/rpc/mes_demandes_recues**', async (route) => {
  if (couper) { await route.abort('failed'); return; }
  await route.fallback();                          // sinon, on repasse au relais
});
```

L'ordre compte : Playwright donne la main au **dernier** gestionnaire
inscrit, et `route.fallback()` rend la main au précédent.

Deux pièges à ne pas redécouvrir :

1. **le bandeau d'erreur RECOUVRE le haut de l'écran.** `getByText(…)` a
   d'abord attrapé le bandeau, qui contient le même mot, et le clic est
   tombé dessus. Viser par le RÔLE (`getByRole('button', …)`) ;
2. un écran qui affiche le bon texte ne prouve pas que le bouton marche —
   **on compte les appels réseau**, et c'est ce comptage qui a montré que
   le premier « Réessayer » ne partait pas.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un vrai PostgreSQL. Les 30 contrôles
passent (11 nouveaux dans `verifier-demandes`), `npx expo export --platform
ios` passe. Puis sur la VRAIE base, avec un compte professionnel jetable
supprimé dans la même session (0 ligne restante, vérifié table par table) :

| | relevé |
|---|---|
| l'ordre rendu par l'API | **devis en attente du 30/08/2025 en 1er**, puis 3 rappels clos du jour |
| l'en-tête | « 1 demande à traiter » |
| la troncature à 4 demandes | ne se dit pas |
| la route coupée | « Lecture impossible », plus « Aucune demande » |
| « Réessayer » | **un 3ᵉ appel part**, la liste revient |

**Ce qui n'a PAS été vérifié** : la page sur un vrai iPhone, et une liste
réellement à 200 — le pied de troncature n'a été lu que dans le code, pas
à l'écran.

#### Ce qui reste, et qui est un CHOIX à faire

Sur la capture, les trois demandes **closes** portent un bandeau orange
aussi fort que la demande en attente. Le tri les a descendues ; leur
couleur, elle, crie toujours autant. Faire reculer le bandeau d'une
demande traitée est trois lignes — mais c'est du goût, et l'orange est
l'identité : à trancher avec le propriétaire, pas tout seul.

### Un compte d'artisan ne se crée plus à moitié (05/10/2026)

Relevé sur la vraie base en cherchant quoi avancer un jour où le compte
Apple n'était toujours pas validé. Un compte y dormait depuis le
**14/09/2026** :

| | |
|---|---|
| `users.type` | **pro** |
| `users.nom` | « Mon entreprise » |
| ligne dans `professional_profiles` | **aucune** |
| publications, demandes, messages, avis | 0 |

Il ne pouvait rien faire : invisible dans la Place des pros, incapable de
publier ou de recevoir une demande. Et **rien ne le signalait** — ni
erreur, ni écran cassé, ni contrôle rouge.

#### Les deux moitiés ne venaient pas du même endroit

```js
const { session } = await api.signUp({ … });
if (!session) return { confirmationRequise: true };   // ← on sort ICI
if (typeChoisi === 'pro') await api.ensureProProfile({ … });
```

La ligne `users` vient d'un **déclencheur** (section 13) : elle existe
toujours. La fiche professionnelle venait de l'**application**, et
seulement si `signUp()` rendait une session — ce qu'elle ne fait PAS quand
la confirmation par e-mail est demandée. L'acceptation des CGU tombait
dans le même trou, et c'est une trace légale.

Et le trou ne se rebouchait jamais : `ensureProProfile` n'était appelée
nulle part ailleurs.

> **Ce qui est garanti par la base et ce qui est garanti par l'écran ne
> sont pas la même chose.** Deux moitiés d'une même donnée créées par deux
> mécanismes différents finiront par se désaligner — c'est une question de
> temps, pas de chance.

**Et il ne POUVAIT pas se reboucher à cet instant** : sans session, la
règle RLS « chacun sa fiche » refuse l'écriture. Les informations du
formulaire sont perdues dès que l'artisan ferme l'application pour aller
lire son courriel.

La parade : **`signUp()` les range dans les métadonnées du compte**, que
PostgreSQL voit au moment d'insérer la ligne. Le déclencheur crée les deux
moitiés d'un coup, sans session et sans RLS.

Deux gardes, parce que **ces métadonnées sont écrites par le CLIENT** :

1. l'insertion **nomme ses colonnes une par une**. `verifie`,
   `kbis_valide`, `assurance_valide`, `rge` n'y sont pas ;
2. les métiers passent par **`metiers_connus()`**, la même fonction que la
   contrainte `pro_metiers_check`. Un métier inventé retombe sur `macon` —
   **faire échouer la création du compte pour une métadonnée malformée
   serait pire que le défaut qu'on corrige**.

#### Et en cherchant comment réparer, DEUX FAILLES

Les deux prouvées sur PostgreSQL 16 avant d'écrire une ligne de
correction, puis sur la vraie base après.

**1. Le badge se décernait à la CRÉATION.** Le verrou de
`tient_le_profil_pro()` ne regardait que `UPDATE` ; la politique
« ecriture mon profil » est `for all`. Un client modifié insérait sa fiche
avec `kbis_valide = true, assurance_valide = true`, et
`synchronise_verification` — qui s'exécute juste avant — en tirait
`verifie = true`. Mesuré : `INSERT 0 1`, aucune erreur, fiche `verifie = t`.

> C'est la faille du 29/09 — « le badge ne se décerne pas soi-même » —
> **refermée d'un côté et laissée grande ouverte de l'autre.** Une règle
> qui ne couvre qu'un verbe SQL ne couvre rien : `for all`, c'est quatre
> portes.

**2. Un pro pouvait effacer les avis écrits SUR LUI.** C'est la plus grave,
et elle n'a rien à voir avec le badge. `for all` autorise aussi le
`DELETE`, et **onze tables** dépendent de `professional_profiles` en
`on delete cascade` — dont `reviews`, `quote_requests`,
`callback_requests`, `sos_requests`.

Mesuré : un avis une étoile « Chantier abandonné » ; le pro supprime SA
fiche ; **0 avis restant**, compte toujours là. Il recrée sa fiche et
repart à neuf.

> **Ce qui concerne des TIERS s'anonymise, il ne se supprime pas.** La
> suppression de COMPTE anonymise les avis depuis le 21/09 ; cette
> porte-là contournait tout ce travail en silence.

#### Un déclencheur plutôt qu'une politique réécrite — et la cascade

Retirer le droit de suppression demanderait de remplacer « ecriture mon
profil » par deux politiques, donc un `drop policy` que le connecteur
Supabase refuse. `create or replace trigger` passe, et il est meilleur :

> **Une politique rend « 0 ligne supprimée » sans un mot. Un déclencheur
> DIT pourquoi.** Vérifié sur la vraie base : `400`, code `23514`, et le
> message complet en français.

**Mais la cascade doit passer**, elle : `preparer_suppression_compte()`
finit par `delete from public.users`, et supprimer son compte reste un
droit. On distingue les deux cas par **la ligne parente** : si
`public.users` n'a plus de ligne pour cet identifiant, c'est le compte
entier qui part.

Ce discriminant a été choisi après en avoir écarté un autre, et c'est le
genre d'erreur qui ne se voit qu'en lisant : « bloquer quand
`auth.uid() = old.id` » aurait **cassé la suppression de compte**, puisque
`preparer_suppression_compte()` est `security definer` appelée par
l'utilisateur lui-même.

#### Le contrôle m'a attrapé en train de refaire la faute de la veille

`verifier-compte` a immédiatement échoué sur `cree_fiche_utilisateur` :
j'avais écrit la nouvelle version en section 31 **sans retirer l'ancienne
de la section 13**. Le fichier restait rejouable — la seconde gagne — mais
c'est exactement ce que la section 30 avait posé la veille pour les
politiques.

> **Une règle ne s'écrit qu'à UN endroit, fonction comprise.** C'est la
> PREMIÈRE des deux qui se fait oublier le jour où la règle change.

Et le contrôle lui-même est tombé dans le piège qu'il traque : son premier
motif, `insert into … [\s\S]*?\);`, ne correspondait à rien — **il n'y a
aucun `);` dans cet ordre SQL**, qui se termine par `on conflict`. Les
quatre vérifications « la fiche ne naît jamais avec `verifie` » passaient
donc… en n'éprouvant rien. **Un contrôle qui ne trouve pas sa cible rend
le bon résultat pour la mauvaise raison** — c'est le défaut que ce
document traque depuis `verifier-montage`. Et il retire désormais les
commentaires `--` du SQL : cinquième fois qu'un contrôle risque d'accuser
la documentation qui explique le défaut.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un vrai PostgreSQL, les onze cas de
`supabase/essais-section-31.sql`, les 31 contrôles,
`npx expo export --platform ios`. Puis sur la VRAIE base, avec trois
comptes jetables supprimés dans la même session (0 restant) :

| | résultat |
|---|---|
| inscription par `/auth/v1/signup` **seul** | fiche pro créée, entreprise, deux métiers, ville, CGU datées |
| toutes les colonnes de vérification | `false` |
| le pro supprime sa fiche | **400, code 23514**, message complet |
| le pro se décerne le badge par `UPDATE` | `verifie = false` |
| …et par `INSERT` | `verifie = false`, `statut = non_soumis` |
| inscription complète **au navigateur** | l'écran arrive sur le Fil |
| POST vers `professional_profiles` par l'application | **0** |

#### Ce qui n'a PAS été fait, et qu'il faut savoir

- **La confirmation par e-mail n'est pas activée** sur le projet
  aujourd'hui, donc le défaut ne mord pas encore. Il mordrait à 100 % le
  jour où elle le sera — et il faudra l'activer avant d'ouvrir au public.
  Je n'ai donc pas pu éprouver ce chemin-là en vrai.
- **Un artisan qui vient de s'inscrire n'a pas de coordonnées GPS.**
  `completerLieu()` est appelée à l'enregistrement du PROFIL, pas à
  l'inscription, et PostgreSQL ne peut pas appeler la Base Adresse
  Nationale. Il n'apparaît donc pas dans une recherche par secteur tant
  qu'il n'a pas ouvert « Modifier mon profil » une fois. C'était déjà vrai
  avant ce lot ; ça reste à traiter.
- **Le compte fantôme du 14/09 n'a pas été supprimé** : il se répare
  désormais tout seul à la première reconnexion, et il ne porte aucun
  contenu. C'est au propriétaire de décider s'il le garde.

### Un compte sans e-mail n'est pas une inscription ratée (05/10/2026)

Le compte « fantôme » du 14/09, que j'avais présenté le matin même comme une
inscription interrompue, ne l'était pas. **Je l'ai écrit avant de l'avoir
regardé.**

En le relisant avant de le supprimer, comme le demande ce document :

| | |
|---|---|
| `auth.users.is_anonymous` | **true** |
| adresse e-mail | **aucune** |
| `raw_user_meta_data` | `{}` |
| créé / connecté | **à la même seconde**, 14/09 19:17:52 |
| reconnexions | aucune |

C'est une **connexion anonyme** — la fonctionnalité de Supabase qui ouvre
une session sans e-mail ni mot de passe. Et **rien dans `src/` n'appelle
`signInAnonymously`** : ce n'est pas l'application qui l'a créée.

> **Avant de nettoyer une ligne, demander ce qu'elle EST.** « Un compte pro
> sans fiche » et « une session anonyme ouverte une fois » ne se corrigent
> pas du tout au même endroit — et la première lecture menait à chercher un
> défaut d'inscription qui n'existait pas.

Et la vraie question à poser dans ce cas n'est pas « comment l'effacer »
mais **« est-ce que ça peut recommencer ? »**. Éprouvé pour de vrai plutôt
que lu dans un tableau de bord :

```
POST /auth/v1/signup  {}
→ 422  anonymous_provider_disabled
```

La porte est fermée. S'il avait répondu un jeton, c'était un trou béant —
n'importe qui, avec la clé publiable, aurait pu fabriquer des comptes sans
limite.

#### Et le garde-fou du connecteur a tenu, une fois de plus

Le propriétaire a autorisé la suppression, explicitement. L'appel a quand
même **expiré au bout de la minute**, sans rien appliquer — vérifié juste
après : compte intact, 13 lignes comme avant.

> **Son autorisation à moi ne vaut pas la confirmation que le connecteur
> attend.** Ce sont deux choses différentes, et c'est très bien ainsi : une
> session de travail ne doit pas pouvoir détruire une ligne de la base de
> quelqu'un, même avec son accord écrit dans la conversation.
>
> **Et on n'essaie pas de contourner** — ni en cachant le mot dans une
> chaîne, ni en créant une fonction `security definer` « juste pour cette
> fois ». La seconde serait pire : elle laisserait dans la base une porte
> permanente pour supprimer n'importe quel compte, construite pour effacer
> une ligne vide.

La suppression passe donc par Supabase → Authentication → Users, en deux
clics, et elle lui appartient — comme la protection contre les mots de
passe compromis.

### Trois remarques du propriétaire, et ce qu'elles ont coûté (05/10/2026)

Trois points relevés en se servant de l'application, et il a demandé une
réponse AVANT que je construise quoi que ce soit. Les trois étaient justes,
mais pas toujours pour la raison qu'il croyait — et c'est ça qui compte.

#### 1. « Les demandes déjà traitées devraient partir ailleurs »

Chiffré sur la vraie base avant de répondre : **6 demandes traitées sur 8**,
après trois semaines. Dans un an, c'est 95 % de la liste. Le tri de la
veille les descendait en bas ; il fallait toujours les faire défiler.

Ce qui a été ÉCARTÉ : une page de plus dans la barre du bas. La Place des
pros et les Demandes ont chacune une **ligne de pastilles**, posée les deux
jours précédents. Les trois pages de Découvrir sont jumelles.

> **TROIS états, et pas deux.** Une demande ACCEPTÉE n'est pas réglée :
> c'est un chantier en cours, et **c'est là que vit le numéro de téléphone
> du client**. La ranger avec les terminées la ferait disparaître au moment
> précis où on en a besoin.

`'termine'` existait dans les trois contraintes `check` depuis le premier
jour, et le bouton « Marquer terminé » aussi. Personne ne s'en servait,
faute de voir à quoi il sert : il sert à ça.

Et un refus est rangé avec les terminées — pour l'artisan, c'est la même
chose : il n'y a plus rien à faire. Lui donner sa propre pastille
ajouterait une quatrième colonne pour l'état le moins consulté.

Au passage, `DemandesRecuesScreen` posait sa gouttière **sur les cartes**
et non dans `contentContainerStyle` — la règle du lot 7, qu'il violait
depuis le début. Corrigé : c'est ce qui fait tomber l'en-tête, les
pastilles et les cartes sur la même verticale sans la régler trois fois.

**Et un crochet ne se met pas sous une sortie anticipée.** L'écran
commençait par `if (chargement) return …` ; y ajouter un `useState` en
dessous, et React n'appelle plus le même nombre de crochets d'un rendu à
l'autre. L'écran se casserait **au moment où les données arrivent** —
c'est-à-dire jamais pendant qu'on le développe.

#### 2. « Les informations du compte ne se retrouvent pas dans la fiche »

**Vérifié avant de répondre, et il se trompait à moitié** — ce qui valait
mieux que de le croire sur parole :

| | demandé à l'inscription ? | repris dans la fiche ? |
|---|---|---|
| entreprise | oui | **oui** |
| ville | oui | **oui** |
| métiers | oui | **oui** |
| téléphone | **non** | rien à reprendre |
| e-mail | oui (celui du COMPTE) | **surtout pas** |

Le téléphone n'est jamais demandé à l'inscription : il n'y a rien à
recopier. Et allonger le formulaire d'inscription pour le réclamer ferait
abandonner des gens le soir où ils s'inscrivent.

L'e-mail, lui, est le vrai sujet, et c'est un piège :

> **`users.email` est l'adresse du COMPTE**, fermée à tout le monde le
> 29/09 parce qu'elle fuitait. **`email_pro` est une adresse de CONTACT**,
> que le professionnel renseigne POUR qu'elle s'affiche.
>
> Préremplir la seconde avec la première, et il suffit de toucher
> « Enregistrer » sans y penser pour republier son adresse personnelle.
> **C'est la même porte, rouverte par le côté confort.**

D'où un bouton qui **MONTRE l'adresse avant de la poser** : « Utiliser
l'adresse de mon compte (dylan…@gmail.com) ». Plus rien à retaper, et on
voit ce qu'on s'apprête à publier. Il disparaît dès que le champ est
rempli — une proposition qui reste après coup n'est plus une aide.

L'adresse arrive par `mon_compte()`, la seule porte encore ouverte sur sa
propre ligne, et elle n'entre jamais dans `pros[]`, qui est public.

#### 3. « On ne voit pas forcément où on est »

Mesuré avant de répondre : le seul signal était la **couleur de l'icône**.

| | contraste |
|---|---|
| icône inactive `muted` vs active `ink` | **3,02 : 1** |

C'est exactement le minimum pour un élément graphique. Perceptible, et
c'est tout.

**Et l'onglet Profil avait DÉJÀ son anneau orange** depuis que la photo est
entrée dans la barre. Ce lot n'invente donc rien : il étend aux quatre
autres ce que le cinquième faisait seul.

J'avais soulevé une objection — dans cette barre, l'orange veut déjà dire
« il y a du neuf » — et proposé la pastille sombre de Découvrir en
alternative. **Le propriétaire a tranché pour l'anneau orange**, et il a
raison sur un point que j'avais sous-estimé : la photo de profil le faisait
déjà, donc l'ambiguïté existait de toute façon. Mieux vaut une règle
appliquée partout que deux façons de dire « vous êtes ici » dans dix
centimètres de barre.

> **`anneau` est calculé UNE fois** et sert à la photo comme aux icônes.
> C'est la leçon des voyants du 04/10 : deux formules pour une seule vérité
> finissent toujours par se contredire.

Deux détails qui ne sont pas cosmétiques :

1. **la boîte fait 30 × 30 quoi qu'il arrive**, et seule la COULEUR de la
   bordure change. Une bordure qui apparaît décalerait l'icône de deux
   pixels à chaque changement d'onglet, et toute la barre sauterait.
   Mesuré : **69 px de haut avant comme après** ;
2. **l'anneau est blanc en mode vidéo**, comme la photo — un orange sur le
   voile sombre du fil vidéo ne se verrait pas pareil.

#### Vérifié, et comment

Les 31 contrôles (dont 7 nouveaux dans `verifier-demandes`, 4 dans
`verifier-voyants`, 5 dans `verifier-compte`), `npx expo export --platform
ios`. Au navigateur, en mode démonstration pour les deux premiers et sur la
VRAIE base pour le troisième, avec un compte jetable supprimé dans la même
session :

| | relevé |
|---|---|
| les trois pastilles | « À traiter (2) », « En cours (1) », « Terminées (0) » |
| leur boîte réelle | **81 × 44**, comme celles des Demandes |
| « En cours » | montre la demande acceptée ET son téléphone |
| « Marquer terminé » | fait passer la demande de « En cours (0) » à « Terminées (1) » |
| l'anneau sur Accueil | `rgb(232, 92, 31)`, et `transparent` sur les trois autres |
| …après un appui sur Découvrir | l'anneau a suivi, l'ancien est parti |
| hauteur de la barre | **69 px avant, 69 px après** |
| le bouton d'adresse | **358 × 44**, l'adresse écrite en entier |
| un appui | le champ se remplit, le bouton disparaît |

**Ce qui n'a PAS été vérifié** : les trois sur un vrai iPhone. Et l'anneau
en mode vidéo n'a été lu que dans le code — le fil vidéo ne se lit pas dans
ce navigateur, faute de codecs.

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
  (c'est l'avis de situation SIRENE). Le propriétaire était dans ce cas
  (son entreprise est fermée, précisé le 17/10).

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

### Où se passe une publication — le socle du fil (05/10/2026)

Section 32 de `schema.sql`, `npm run verifier-lieu`. Premier lot de la
refonte de la recherche et du divertissement, décidée avec le propriétaire.

**Le fil n'avait aucun filtre.** Pas « un filtre perfectible » :

```js
supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20)
```

Tant qu'il y a sept artisans, personne ne s'en aperçoit. À mille, un
particulier de Marseille regarde les chantiers de Lille. Et le relevé sur la
vraie base disait que **rien ne pourrait fonctionner même en écrivant
l'écran parfaitement** :

| | avant ce lot |
|---|---|
| colonnes de coordonnées sur `posts` | **aucune** |
| particuliers localisés | **1 sur 5** |
| un artisan qui vient de s'inscrire | **aucune coordonnée** |

> **Un filtre sans coordonnées est le « bouton §18 »** : un écran qui a
> l'air de servir et qui ne peut rien rendre. On pose le LIEU d'abord.

#### `ChampVille` n'était demandé qu'aux artisans

Il vivait dans la branche `estPro ? (…) : (…)` du formulaire : un
particulier ne donnait **que son nom**. Il est sorti de la branche, et il
est devenu **obligatoire pour les deux** — ce document met en garde contre
l'allongement de ce formulaire, et c'est pourquoi le téléphone n'y est
toujours pas ; la ville, elle, est le champ qui rend l'application utile dès
la première seconde.

#### PostgreSQL ne sait pas appeler la Base Adresse Nationale

C'est tout le raisonnement de ce lot, et il explique le trou connu depuis le
05/10 au matin : `completerLieu()` ne tournait qu'à l'enregistrement du
PROFIL, donc un artisan qui venait de s'inscrire n'apparaissait dans
**aucune** recherche par secteur tant qu'il n'avait pas ouvert « Modifier mon
profil » une fois.

> **`handleSignUp` complète le lieu AVANT de créer le compte**, et range les
> coordonnées dans les métadonnées, que le déclencheur voit au moment
> d'insérer les deux fiches. Même endroit et même raison que l'annonce et le
> profil : là où il y a déjà une attente visible.
>
> **Et l'échec ne bloque rien.** Un réseau coupé ne doit pas empêcher de
> créer un compte — même règle que le vibreur de `retour.js`. Sans
> coordonnées on n'apparaît pas dans une recherche par secteur ; sans compte,
> on n'apparaît nulle part.

**Vérifié au navigateur, sur la VRAIE base, en TAPANT la ville à la main** —
c'est-à-dire sans toucher aucune suggestion, le cas qui ne donnait jamais de
coordonnées : `ville = Lambesc`, `code_postal = 13410`,
`latitude = 43.648937`, `longitude = 5.258868`, et **zéro écriture vers
`users` par l'application**.

#### Une coordonnée illisible ne coûte pas un compte

Ces métadonnées sont écrites par le CLIENT. Un `::double precision` posé sur
« nulle part » lèverait une erreur, et cette erreur **ferait échouer la
création du compte** — pour une métadonnée malformée. `coord_ou_null()` rend
`null`, jamais une erreur. Même règle que les métiers inventés de la
section 31.

> **La borne compte autant que le format.** 500 est un nombre parfaitement
> valide et n'est pas une latitude. Vérifié sur la vraie base :
> `coord_ou_null('43.6508', 90)` → 43.6508, `'quelque part'` → null,
> `'500'` → null.

Et **les deux coordonnées ou aucune**, des deux côtés : une latitude seule ne
situe rien, et laisserait une ligne qui a l'air placée.

#### `posts.ville` ne peut PAS servir à filtrer

Elle existe depuis le premier jour, et c'est un champ de **texte libre** du
formulaire de publication, **vide par défaut**. Filtrer à 20 km sur ce que
quelqu'un a tapé à la main, ce n'est pas filtrer. D'où deux colonnes, et pas
une jointure sur la fiche de l'auteur :

> **Un artisan qui déménage ne déplace pas ses anciens chantiers.** La
> publication dit où le travail a été fait, à ce moment-là. Une jointure les
> ferait tous bouger ensemble.

Le champ est maintenant **pré-rempli depuis la fiche** et **ne se vide plus
après une publication** : on publie trois photos du même chantier à la
suite, et un champ qu'on retape est un champ qu'on finit par laisser vide.

#### Le déclencheur est le PLANCHER, pas le mécanisme

`pose_le_lieu_du_post()` fait hériter la publication de la commune déclarée
par son auteur quand l'application n'a pas pu la placer : réseau coupé, BAN
muette, vieille version, insertion depuis l'éditeur SQL. Vérifié sur la
vraie base, les trois cas :

| publication envoyée | résultat |
|---|---|
| sans rien | Aix-en-Provence (13), 43.5297 / 5.4474 — héritées |
| avec ses propres coordonnées | **Lille (59), 50.6292 / 3.0573 — intactes** |
| avec une seule coordonnée | on repart de la fiche |

**Une publicité reste sans lieu, et c'est voulu pour l'instant.**
`is_ad = true` n'a pas d'auteur : il n'y a rien à hériter. Elle sortira d'un
fil filtré par secteur, exactement comme une annonce sans coordonnées sort
de la Place des pros — « pas de coordonnées » veut dire « on ne sait pas
où ». **Le jour où il y aura de vrais annonceurs, ça ne conviendra plus** :
une marque nationale voudra être vue partout, et ce sera une DÉCISION, avec
son lot. Aujourd'hui il y a deux lignes de démonstration et aucun annonceur.

#### Le rattrapage, et pourquoi il n'est pas optionnel

Seize publications sans coordonnées. **Sans rattrapage, poser le filtre
ferait disparaître tout le contenu de la base** — et ça ressemblerait trait
pour trait à un filtre cassé. Appliqué sur la vraie base : **14 publications
sur 16 placées** (les 2 restantes sont les publicités), et `ville` passée de
8 à 14.

#### Un contrôle qui ne vise pas la bonne occurrence

Deux fois dans ce lot, et c'est la même famille que le
`insert into … \);` de la veille :

1. `mode === 'inscription'` apparaît **neuf fois** dans `AuthScreen` ; la
   première est dans `valider()`, loin au-dessus du formulaire. Le contrôle
   cherchait `<ChampVille` dans du code de validation ;
2. `update public.posts p` apparaît **deux fois** dans `schema.sql` — le
   rattrapage des compteurs de commentaires le fait déjà.

Les deux fois, le contrôle a crié au défaut alors que le code était juste.
Dans l'autre sens, cinq fois déjà, il a passé au vert sans rien éprouver.

> **Et un contrôle se vérifie EN CASSANT ce qu'il surveille.** Le premier
> jet disait « le champ ville vient APRÈS la branche réservée aux pros ».
> Éprouvé en remettant le défaut à la main — un `{estPro && …}` posé juste
> après la branche —, **il passait au vert** : le champ était bien après, et
> toujours réservé aux pros. Il regarde désormais ce qu'il y a ENTRE les
> deux.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un vrai PostgreSQL 16, les onze cas de
`supabase/essais-section-32.sql`, les 32 contrôles,
`npx expo export --platform ios`. Puis sur la VRAIE base : la migration
appliquée par le connecteur, les trois comportements du déclencheur, et une
inscription complète **au navigateur**, avec trois comptes jetables
supprimés dans la même session (0 restant, base revenue à 13 comptes /
7 fiches / 16 publications).

**Ce qui n'a PAS été vérifié** : rien de tout ça sur un vrai iPhone, et le
clavier qui s'ouvre sous le champ ville du formulaire d'inscription — il n'y
a pas de clavier dans ce navigateur. Et **il reste à construire ce à quoi ce
lieu sert** : le filtre lui-même. Une colonne remplie que personne ne lit
est exactement le défaut du 01/10 ; celui-ci ne durera que le temps du lot
suivant.

### La loupe du fil — un filtre DUR, tenu par la base (05/10/2026)

Section 33 de `schema.sql`, `src/components/FeuilleRecherche.js`,
`src/lib/filtre-fil.js`, `npm run verifier-filtre`.

#### Le propriétaire avait raison contre moi

> « Si par contre il met sur son filtre maçon à 20 km, il lui montre sur le
> fil que des posts de maçon à 20 km, mais le filtre doit se régler à la
> main. »

J'avais proposé l'inverse — un fil qui « pencherait » sans rien retirer.
Son objection le dit mieux que moi : **un filtre qui laisse passer autre
chose ne se VÉRIFIE pas.** On pose « maçon », on voit un couvreur, on en
conclut que le réglage ne marche pas, et on ne s'en sert plus. Un réglage
dont personne ne se sert est pire qu'un réglage absent.

Ce qui le rend acceptable n'est pas sa douceur, c'est qu'il **se voit** et
**s'enlève d'un appui** — la règle du 04/10 : « un filtre qu'on ne voit pas
est un filtre qu'on oublie d'enlever ».

> **Le SECTEUR survit à la fermeture, le MÉTIER non.** C'est la réponse
> exacte à sa crainte — « si un jour il a besoin d'un couvreur il faut pas
> qu'il soit bloqué que sur des maçons ». Les deux n'ont pas la même durée
> de vie : le secteur est l'endroit où l'on habite, il ne change pas ; le
> métier est un besoin du moment. À la réouverture, il n'y a plus que le
> secteur.

#### Une loupe, et rien d'autre sur le fil

> « Je ne veux pas des grosses pastilles, je veux que l'écran du fil reste
> simple ; peut-être juste une icône de loupe, et quand on clique on arrive
> sur une fenêtre où on paramètre notre recherche. »

Il a raison, et pas seulement par goût : **le fil est le seul écran d'Opus
où l'on vient pour REGARDER.** La Place des pros et les Demandes portent une
rangée de pastilles parce qu'on y vient pour CHERCHER ; ici, afficher la
question en permanence reviendrait à répondre à une question que personne ne
pose.

Et un seul panneau, pas quatre : là-bas on affine un critère à la fois, ici
on règle « ce que je veux voir » d'un bloc.

#### Le défaut qui était DÉJÀ là : `feedAbonnements` filtrait à l'écran

```js
const feedAbonnements = feedTab === 'abonnements'
  ? visiblePosts.filter((p) => p.type === 'ad' || followingIds.has(p.proId))
  : visiblePosts;
```

Il filtrait **les vingt publications déjà téléchargées**. Avec trois
abonnements et seize publications, personne ne le voit. Avec mille artisans,
les vingt dernières publications de toute la France n'en contiennent
AUCUNE : l'onglet affiche une page vide, et la suivante aussi.

> **Les deux partent ensemble**, sinon on obtient le pire des deux : un
> filtre appliqué dans la base ET un filtre appliqué sur son résultat.
> `fil_filtre()` est la SEULE porte du fil — métier, secteur, note, badge,
> abonnements, vidéos —, et `changerCeQuOnVoit` la seule qui la lui demande.

#### `security invoker`, et ce n'est pas un détail

Une fonction `security definer` rendrait ici les publications des personnes
qu'on a **bloquées** — et personne ne s'en apercevrait, puisqu'elle rendrait
des publications parfaitement normales. Éprouvé (cas 8 de
`essais-section-33.sql`, `set local role` hors d'un bloc `do`) : le client
voit 4 publications, bloque le maçon, en voit **2**, et `p_metier => 'macon'`
lui en rend **0**.

#### Tout filtre retire les PUBLICITÉS, et c'est voulu

Une publicité n'a ni auteur, ni métier, ni lieu, ni badge : elle ne peut
satisfaire aucun critère. Demander « les maçons vérifiés à 20 km » et
recevoir une publicité est exactement ce qui fait perdre confiance dans un
fil. Elle revient dès qu'on enlève le filtre.

**Sauf dans « Abonnements »**, où elle reste : c'est le contrat passé avec
l'annonceur, il ne dépend de personne. La retirer reviendrait à ne la
montrer qu'à ceux qui ne suivent personne.

#### Le piège de la note, mesuré avant de l'écrire

**4 artisans sur 7 n'ont AUCUN avis.** Un filtre « minimum 3/5 » les écarte
tous — donc tous les nouveaux inscrits, pour toujours. On ne peut pas faire
autrement (on ne va pas leur prêter une note), mais **l'écran le DIT** :
« Les artisans qui n'ont encore aucun avis n'apparaîtront pas : sans avis,
il n'y a pas de note — ce n'est pas une mauvaise note. » Même règle que les
« 3 annonces sans lieu précisé ne sont pas affichées ».

#### Une seule échelle de rayons

`RAYONS_KM` passe de `[25, 50, 100, 200]` à **`[10, 20, 50, 100, 200]`**, et
sert à la Place des pros comme au fil. Le propriétaire a demandé « maçon à
20 km » et 25 était le plus petit ; deux listes séparées auraient divergé,
comme les deux listes de formats vidéo du lot 4.

#### Et le calcul vit dans un fichier qui ne charge rien

`src/lib/filtre-fil.js` — sixième application de la leçon de
`cloudinary-adresses.js`. `verifier-filtre` **fait tourner** `correspond()`
sur les mêmes cas que `essais-section-33.sql` : les deux écritures de la
règle (SQL pour la vraie base, JavaScript pour le mode démonstration) sont
éprouvées sur le même jeu. Écrire deux fois la même règle est un risque
assumé et borné — il n'y a pas de base en mode démonstration, et une loupe
qui ne filtrerait rien sans fichier `.env` ne se vérifierait pas ici.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur PostgreSQL 16, les onze cas de
`supabase/essais-section-33.sql`, les 33 contrôles,
`npx expo export --platform ios`. Puis au navigateur, en mode
démonstration :

| | relevé |
|---|---|
| la loupe | **40 × 44**, comme la cloche |
| le fil sans filtre | 3 publications visibles, **aucune ligne de rappel** |
| la feuille | Métier, Où, Note, Vérifiés, « Voir tout le fil », « Tout effacer » |
| les rayons | n'apparaissent qu'une fois un centre choisi |
| note 4/5 | l'avertissement « sans avis » apparaît |
| après « Maçon » + validation | **1 publication**, « Filtre : Maçon. Modifier », **312 × 44** |
| la loupe | orange, avec son point |
| la croix | 3 publications, ligne partie, loupe au repos |

#### Le connecteur est tombé au milieu du lot — et ce qu'on en retient

`fil_filtre()` n'a pas pu être posée sur la vraie base ce soir-là, alors que
l'application l'appelait déjà pour TOUT le fil. Pendant une heure, le dépôt
était dans l'état que ce document redoute depuis les six commits qui
tournaient contre une base ignorant `metiers` : **l'application en avance sur
la base**, et un fil qui ne charge rien.

> **Un lot dont la moitié BASE n'est pas appliquée n'est pas fini**, même
> quand tous les contrôles passent. Ce qui a été fait en attendant, et qui
> est la bonne réaction : écrire la migration dans un fichier à coller dans
> Supabase → SQL Editor, le dire en tête de réponse et dans le message de
> commit, plutôt que de laisser quelqu'un lancer la version et conclure que
> le fil est cassé.
>
> Le fichier a été retiré dès la migration appliquée : un fichier que
> personne n'a plus à ouvrir est le « bouton §18 » sous une autre forme.

#### Appliqué et vérifié sur la VRAIE base

Le connecteur est revenu, la migration est passée. Puis **par le chemin de
l'application** (clé publiable + jeton d'un compte jetable, PostgREST),
c'est-à-dire exactement ce que fait Opus :

| | publications rendues |
|---|---|
| sans filtre | **16** (dont les 2 publicités) |
| `metier = macon` | 7 |
| 20 km autour de Lambesc | 10 |
| **20 km autour de Lille** | **0** — le filtre filtre |
| vérifiés seulement | 3 |
| vidéos | 2 |
| abonnements (compte neuf) | **2** — les deux publicités, et rien d'autre |
| note ≥ 3/5 | 11 |
| `p_limite = 100000` | 16 (plafonné) |

**Et le blocage, qui est la raison d'être du `security invoker` :** le
compte d'essai bloque l'artisan aux 9 publications, par le chemin de
l'application.

| | avant | après |
|---|---|---|
| sans filtre | 16 | **7** |
| `metier = macon` | 7 | **1** |
| 20 km autour de Lambesc | 10 | **1** |

Un filtre ne contourne donc pas le blocage. Compte jetable supprimé dans la
même session : 0 restant, base revenue à 13 comptes / 7 fiches /
16 publications, et le seul blocage encore en base est celui du 29/09, qui
n'est pas le mien.

Un détail au passage, et c'était MA faute : le premier appel a reçu un
**403** en posant le blocage, parce que j'avais omis `bloqueur_id`. La
politique exige `auth.uid() = bloqueur_id`, et `api.bloquer` l'envoie bien.
Un refus de la base n'accuse pas toujours la base.

**Ce qui n'a PAS été vérifié** : rien de tout ça sur un vrai iPhone, et le
défilement de la feuille au doigt.

### « C'est un conseil » — une étiquette, pas un format (05/10/2026)

Section 34 de `schema.sql`, `src/components/ConseilsPro.js`,
`src/lib/formats-publication.js`, `npm run verifier-conseil`.

#### La bonne question n'était pas « comment ajouter les conseils »

Le type `conseil` existait **depuis le premier jour** : dans la contrainte,
dans l'écran de publication, dans « Mes publications ». Relevé sur la vraie
base :

| | |
|---|---|
| photo | 13 |
| montage | 2 |
| avantapres | 1 |
| texte | **0** |
| conseil | **0** |

Zéro, y compris de la part du propriétaire, qui est le seul vrai artisan de
cette base. J'allais livrer un meilleur formulaire d'écriture — c'est-à-dire
une version mieux dessinée d'un bouton que personne ne touche. C'est lui qui
a donné la réponse :

> « Tu penses que les gens qui regardent ne préfèrent pas voir une image ou
> une vidéo avec une voix off qui explique, plutôt que juste du texte
> simple ? Peut-être que la même chose peut être faite avec ce qui existe
> déjà ? »

Il a raison, et ses seize publications le prouvent : **toutes visuelles**.
Choisir « Conseil » obligeait à RENONCER à la photo ou à la vidéo,
c'est-à-dire à renoncer à ce qui fait regarder. Personne ne fait ce marché.

> **L'erreur était dans la colonne `type`** : elle mélangeait le SUPPORT
> (photo, vidéo, montage, avant/après, texte) et l'INTENTION (conseil).
> Le support reste dans `type`, l'intention vit dans `conseil`. On filme
> comme d'habitude, et on coche.

Et « Texte » reste, à sa demande — « on garde le texte sans image ».

#### Une fonction appelée par l'application ne change JAMAIS de signature

C'est le piège de ce lot, éprouvé sur PostgreSQL 16 **avant** d'écrire une
ligne :

```sql
create or replace function f(a int default 1)          -- 1 fonction
create or replace function f(a int default 1, b int)   -- 2 FONCTIONS
select f();   -- ERROR: function f() is not unique
```

Ajouter un paramètre ne REMPLACE pas : ça **surcharge**. L'ancienne reste,
et l'appel sans argument — exactement ce que fait PostgREST — devient
ambigu. Le fil tomberait d'un coup, et **le connecteur Supabase refuse
`drop function`** : on ne pourrait pas réparer depuis une session de
travail.

> Ici ce n'est pas une gêne : `fil_filtre()` rend `setof public.posts`, donc
> la colonne voyage toute seule. **Vérifié** (cas 2 des essais) : la
> fonction n'a pas été touchée et `conseil` arrive quand même. Et
> `nb_fil_filtre = 1` sur le serveur d'essai comme sur la vraie base.

#### LE DÉFAUT QUE SEULE LA PUBLICATION RÉELLE A TROUVÉ

Un conseil au format « Texte » publié sur la VRAIE base s'affichait avec une
**vignette grise et une pastille « agrandir »**, comme s'il portait une
photo. La cause tenait en une ligne d'`OpusApp` :

```js
const couverture = envoyes[0] || POST_GRADIENTS[0];
```

Faute de fichier, un **dégradé de démonstration**. Une publication sans
image en recevait donc une fausse, rangée en base pour toujours, et tout ce
qui lit `media` en concluait « il y a un visuel ».

> **En mode démonstration, le défaut n'existait pas** : les conseils
> d'exemple portent `media: null`, écrit à la main. L'écran était donc juste
> là où je l'avais regardé, et faux là où le propriétaire l'aurait vu. Les
> 34 contrôles passaient, `expo export` passait, le linter se taisait.

Deux corrections, et la seconde répare aussi la ligne déjà écrite :

1. plus de fausse couverture pour un format sans visuel ;
2. **c'est le FORMAT qui décide, pas le contenu de `media`**
   (`porteUnVisuel`, dans `src/lib/formats-publication.js`, qui n'importe
   rien — septième application de la leçon de `cloudinary-adresses.js`). On
   ne peut pas trancher sur « est-ce un vrai fichier » : les publications de
   démonstration portent de vrais dégradés **comme photos**.

Ces deux listes vivaient d'ailleurs dans `src/screens/CreerScreen.js`, et
`OpusApp` devait importer un ÉCRAN pour savoir ce qu'est une photo.

#### Le format « Texte » n'avait jamais été regardé

Puisque personne ne s'en était servi, personne n'avait vu ce qu'il donnait :
`media` vide, donc **un carré de dégradé vide avec la barre d'actions posée
dessus**. Sans visuel, la barre redescend désormais sous le texte, avec un
filet, et **en encre sombre** — elle n'a plus de voile pour la rendre
lisible. Du blanc sur blanc ne lève aucune erreur.

#### Trouvé sur une capture, et pas en relisant

« Voir en plein écran » était à `bottom: 10`, c'est-à-dire **sur la rangée
de la barre d'actions** : le bouton « Contacter », calé à droite, lui
passait dessus et on lisait « Voi… ». Vrai depuis que la barre est passée
SUR la photo, le 02/10. Le libellé plus long d'un conseil l'a rendu évident.
Il est maintenant en haut à droite, en face de l'étiquette « Vidéo ».

#### Le son : un fil muet doit DIRE qu'il y a une voix

Le fil classique est muet, et ça ne se négocie pas — une liste qui parle
toute seule en défilant se coupe au bout de dix secondes. Mais un conseil en
vidéo, **c'est une voix off qui explique**. Sans le dire, on regarde des
lèvres bouger et on passe.

> Un conseil en vidéo affiche donc « **Conseil — touchez pour écouter** », et
> le plein écran (`Visionneuse`, `muet={false}`) est le seul endroit de
> l'application où la voix d'un artisan s'entend.

#### Et quelqu'un LIT ce qu'on écrit

Une case à cocher sans lecteur serait la panne silencieuse favorite de ce
projet. D'où **« Ses conseils »** sur la fiche de l'artisan (et « Mes
conseils » sur la sienne, même composant), entre les réalisations et les
avis.

Ce n'est **pas** la grille du portfolio, et la différence est le tout : une
réalisation se regarde, un conseil **se lit**. Une rangée par conseil, le
texte **entier** — pas de « … lire la suite », un conseil tronqué ne
conseille rien. Une rangée sans visuel ne s'appuie pas : rien à ouvrir en
grand, et une cible qui ne répond pas est pire que pas de cible.

Deux détails à ne pas redécouvrir :

1. **la visionneuse ne reçoit QUE les conseils qui ont un visuel.** Avec la
   liste entière, le premier conseil en texte décale tous les index et on
   ouvre la photo du voisin ;
2. **un conseil publié apparaît TOUT DE SUITE** dans « Mes conseils ».
   `chargerProfilPro()` ne repasse pas — `portfolioCharge` est déjà vrai —,
   il aurait fallu relancer l'application pour voir son propre conseil.

#### Deux défauts de plus, trouvés en passant

- **En mode démonstration, le squelette des réalisations tournait POUR
  TOUJOURS** sur chaque fiche : `chargerProfilPro()` rend `null` (tout est
  en mémoire), donc `portfolioCharge` restait indéfini.
- **`local-prelude.sql` n'était pas rejouable lui-même** : les rôles sont à
  l'échelle de la GRAPPE, donc `create role anon` échoue au second serveur,
  et `ON_ERROR_STOP` arrête tout **avant** le schéma. On croit alors que
  c'est le schéma qui est cassé.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un PostgreSQL 16 neuf, les huit cas de
`supabase/essais-section-34.sql`, les 34 contrôles, `npx expo export
--platform ios`. Le contrôle a été **éprouvé en cassant ce qu'il
surveille** : quatre défauts remis à la main (la requête de la fiche, la
case restée visible pour le portfolio, le cœur redevenu blanc, la
visionneuse recevant tout), les quatre refusés.

Puis au navigateur, en démonstration **et** sur la VRAIE base, avec deux
comptes professionnels jetables supprimés dans la même session (0 restant,
base revenue à 13 comptes / 7 fiches / 16 publications) :

| | relevé |
|---|---|
| boutons de format | **5** — « Conseil » est parti, « Texte » est resté |
| la case, rangée appuyable | **358 × 87** |
| publication | `POST /rest/v1/posts → 201` |
| en base | `type texte`, `conseil true`, **`media null`** |
| **après rechargement complet** | le bandeau « Conseil de pro » est là |
| la carte sans visuel | 358 × 234, barre sous le texte, encre `rgb(26,27,25)` |
| le conseil vidéo | « Conseil — touchez pour écouter », **sans chevauchement** |
| « Ses conseils » | entre Réalisations et Avis, texte entier |
| un conseil sans image | une ampoule, **pas** une vignette grise |
| « Mes publications » | l'étiquette « Conseil » y est |

**Ce qui n'a PAS été vérifié** : rien de tout ça sur un vrai iPhone. Le son
d'un conseil en vidéo n'a pas pu être entendu — ce navigateur n'a pas les
codecs, aucune vidéo du projet ne s'y lit. Et aucun artisan réel n'a encore
coché cette case : la vraie base compte **0 conseil**.

### Les vues — un signal, et quelqu'un qui le LIT (05/10/2026)

Section 35 de `schema.sql`, `src/lib/vues.js`, `src/lib/compteur-vues.js`,
`npm run verifier-vues`.

#### Ce lot a FAILLI être une faute

L'intention de départ était « enregistrer les signaux maintenant, pour
pouvoir classer le fil plus tard ». C'est mot pour mot le défaut que ce
document traque depuis le 01/10 : **une table qu'on écrit sans jamais la
lire est une panne silencieuse.**

> **Un signal enregistré « pour plus tard » n'a pas de lecteur, donc rien ne
> dit s'il est juste.** Il peut compter double, compter l'auteur lui-même,
> compter quelqu'un qu'on a bloqué : personne ne le saura avant le jour où
> l'on s'en servira — c'est-à-dire trop tard.

D'où la forme retenue : le lecteur existe DÈS AUJOURD'HUI, et c'est
l'artisan. Relevé sur la vraie base avant d'écrire une ligne :

| | |
|---|---|
| publications | 14 |
| j'aime | **5** |
| commentaires | **5** |
| publications enregistrées | **0** |

Un artisan publie et n'apprend RIEN. « 5 j'aime sur 14 publications » ne dit
pas si on l'a regardé ; « 47 vues » le dit. C'est accessoirement la matière
première du classement de demain.

**Et ce lot ne classe rien.** Le fil reste trié par date. Régler un
classement sur quatorze publications, c'est régler une machine sur du vide.

#### L'artisan voit COMBIEN, jamais QUI

« Qui a regardé quoi » est une donnée personnelle, et c'est aussi la chose
qui ferait fuir un particulier : savoir qu'un artisan voit qu'on a regardé
sa fiche trois fois change le comportement de tout le monde.

> La politique de lecture de `post_vues` dit `spectateur_id = auth.uid()`,
> et c'est tout ce qu'elle dit. Il n'existe aucune fonction, aucune vue,
> aucun écran qui rende la liste des spectateurs.

**Vérifié sur la VRAIE base, par le chemin de l'application** : un compte
publie, un autre enregistre une vue, et l'auteur lit `vues_count = 1` et
`[]` sur le détail. Et « ce que j'ai regardé » entre dans l'export RGPD —
c'est une donnée personnelle sur MOI.

#### Le compteur ne fait que MONTER — et ça s'est vu en vrai

`maj_likes_count()` décrémente : on retire son j'aime, le compteur
redescend. Celui-ci ne le fait pas, parce que rien ne retire une vue.

Reste le seul cas où une ligne disparaît : la suppression d'un compte, qui
emporte les lignes de celui qui a regardé.

> **Une vue a EU LIEU.** La ligne est une donnée personnelle, elle part. La
> publication, elle, a bien été vue ce jour-là. Faire redescendre le chiffre
> ferait disparaître des vues sous les yeux de l'artisan, sans qu'aucune
> explication ne soit possible.

Constaté à la fin du lot, après la suppression des comptes jetables :
**0 ligne dans `post_vues`, 6 publications avec un compteur à 1.** Le
rattrapage ne fait donc jamais DESCENDRE un compteur (`greatest`) — ce qui
veut dire aussi qu'il ne peut pas réparer un compteur trop haut. C'est le
prix de l'autre garantie.

#### Une publication traversée en descendant n'est pas une vue

`onViewableItemsChanged` se déclenche plusieurs fois par seconde. Compter à
chaque passage donnerait un chiffre qui ne veut rien dire.

> **Une vue, c'est une seconde D'AFFILÉE.** Ce qui sort de l'écran oublie
> son horloge — sinon trois passages de 400 ms finiraient par en faire une,
> alors que personne n'a rien regardé. Et vingt publications ne font pas
> vingt requêtes : on accumule, et on envoie par paquets.

**Mesuré au navigateur, sur la vraie base** : traverser le fil à 120 ms par
cran → **0 envoi**. S'arrêter 2,5 s par écran → 4 envois, tous en 200.

Trois moments d'envoi, et le troisième est celui qu'on oublie : le paquet
plein, le délai écoulé, et **le départ de l'écran** — sans lui, les
dernières publications regardées avant de changer d'onglet seraient
perdues, et ce sont celles qu'on a regardées le plus longtemps.

Tout le calcul vit dans `src/lib/vues.js`, **qui n'importe rien** — huitième
application de la leçon de `cloudinary-adresses.js`, et elle est
indispensable ici : une règle de TEMPS ne se juge ni à l'œil ni à l'écran.
Le crochet est à part (`compteur-vues.js`) parce qu'il importe React, et
qu'un contrôle qui PLANTE ne vérifie rien.

#### Le piège du lot : un `insert … select` échoue EN ENTIER

Un `insert … select` dont UNE ligne viole la politique échoue entièrement
(42501). Un seul identifiant d'un auteur bloqué ferait donc perdre les
dix-neuf autres, sans que rien ne le dise.

> **On PRÉ-FILTRE au lieu de laisser la politique refuser.** Et comme
> `enregistrer_vues()` est `security invoker`, le `select` sur `posts` est
> déjà filtré par « lecture posts », donc par le blocage : le filtrage est
> gratuit et tenu par la même règle que le reste. La politique reste
> l'autorité — elle garde la porte contre un appel direct —, mais l'usage
> normal ne la heurte jamais.

#### `mes_donnees()` a déménagé, et c'est la même règle qu'hier

L'export RGPD doit connaître TOUTES les tables du projet, donc il ne peut
pas être écrit avant la dernière. Tant qu'il vivait en section 13, chaque
table ajoutée plus bas était un oubli silencieux — et le jour où
`post_vues` est née, la fonction ne pouvait littéralement plus se créer là :
**PostgreSQL contrôle le corps d'une fonction SQL à sa CRÉATION.**

Et son droit est posé AVEC elle : le `foreach` de la section 13.8 avale
`undefined_function`, donc le droit aurait été passé sous silence sur une
base neuve et accordé seulement au second rejouage. **Un export RGPD qui ne
marche qu'une fois sur deux.**

#### Un contrôle qui vise par le RANG vise une place, pas une chose

`verifier-lieu` a refusé ce lot, sur du code parfaitement juste. Il prenait
le **dernier** `update public.posts p` du fichier, en supposant que c'était
le rattrapage du lieu. Ça a tenu exactement un lot : celui des vues en a
ajouté un après.

> **Troisième fois dans ce projet qu'un contrôle perd sa cible.** Le premier
> jet prenait le PREMIER et accusait les compteurs de commentaires ; on est
> passé au DERNIER ; il vise maintenant ce que l'ordre FAIT — il est le seul
> à poser une latitude —, et il refuse d'en trouver deux.

#### Et le contrôle m'a eu, lui aussi

Éprouvé en cassant ce qu'il surveille, comme l'exige ce document : sur
quatre défauts remis à la main, **il en a laissé passer un**. Un `return;`
glissé juste après `clearInterval` rendait `vider()` inatteignable, et le
contrôle cherchait la PRÉSENCE du texte, pas s'il était atteignable.
Corrigé : il regarde désormais ce qu'il y a ENTRE les deux.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un PostgreSQL 16 neuf, les douze cas
de `supabase/essais-section-35.sql`, les 35 contrôles, `npx expo export
--platform ios`. Migration appliquée sur la vraie base. Puis au navigateur,
sur la VRAIE base, avec deux comptes jetables supprimés dans la même session
(0 restant, base revenue à 13 comptes / 7 fiches / 16 publications) :

| | relevé |
|---|---|
| traversée rapide du fil | **0 envoi** |
| lecture posée, 2,5 s par écran | 4 envois, **200** |
| une vue, deux fois, trois fois | compteur à **1** |
| l'auteur se compte lui-même | **0 inséré** |
| l'auteur lit le détail | **`[]`** |
| après un blocage | les publications de l'auteur bloqué **ne comptent plus** |
| « Mes publications » | ♡ 0 · 💬 0 · **👁 1** |
| export RGPD du spectateur | 1 ligne |
| après suppression des comptes | **0 ligne, 6 compteurs intacts** |

**Ce qui n'a PAS été vérifié** : rien de tout ça sur un vrai iPhone — et en
particulier le `setInterval` de 500 ms quand l'application passe en
arrière-plan, qui ne se comporte pas pareil qu'au navigateur. Et une
publication réelle du propriétaire porte désormais **1 vue** : la mienne, au
moment où le fil s'est affiché pendant l'essai. C'est une vraie vue, et elle
ne peut pas être retirée — c'est exactement la règle ci-dessus.

### Le chantier — coudre les publications ensemble (06/10/2026)

Section 36 de `schema.sql`, `src/screens/ChantierScreen.js`,
`src/components/BandeChantiers.js`, `npm run verifier-chantier`.

Demandé par le propriétaire : « on créé 10 post pour le même chantier par
exemple toiture Charleval, ça créé un dossier visible en appuyant sur la
phrase du post ou visible depuis notre page pro ».

#### Ce qu'une photo de chantier fini ne peut pas faire

Elle se regarde UNE fois. Relevé sur la vraie base avant d'écrire une
ligne : le propriétaire publie surtout le RÉSULTAT — mais pas toujours. Le
21/09, « pose de l'isolation, avant le placo » et « chantier fini » sont
deux étapes du MÊME travail, et rien dans Opus ne le disait.

> **L'habitude n'était pas à créer, elle était à RANGER.**

#### Deux choses s'appellent « chantier », et les confondre serait l'erreur

Le §12 du cahier des charges, c'est le DOSSIER DE GESTION — client, devis,
montant, marge. Celui-ci est l'HISTOIRE d'un chantier dans le fil : un
titre, une commune, des dates, des publications cousues.

> **Celui-ci est le petit, et il est fait pour être ABSORBÉ** le jour où le
> §12 arrive. D'où ce qu'on n'écrit PAS : aucun client, aucun montant.

#### Le nom ne doit pas être celui du client

Le propriétaire proposait « Chantier Martin ». Or ce titre s'affiche
PUBLIQUEMENT sur chaque publication : « Monsieur Martin, à Charleval, a
fait refaire sa toiture. » Ce client n'a jamais accepté ça et n'est même
pas sur Opus. **La base ne peut pas deviner un nom de famille** : c'est
l'écran qui le dit, sous le champ, et qui propose « Toiture Charleval ».

#### `est_mon_entreprise()` naît ici, et c'était attendu

`docs/LECTURE-CAHIER-DES-CHARGES.md` l'exigeait depuis le 04/10 :
l'appartenance passe par une FONCTION, et elle « naîtra avec la première
table de chantier ». Elle rend aujourd'hui exactement `auth.uid() = pro_id`.

> **Ce n'est pas une couche inutile : c'est le seul endroit à changer** le
> jour où un patron voudra donner un accès à ses compagnons. Sans elle, ce
> serait les 56 règles qui disent `auth.uid() = …`.

#### LE DÉFAUT QUE SEULE LA VRAIE BASE A TROUVÉ — un verrou qui se tait

Ranger une publication déjà en ligne dans un chantier répondait **204 et ne
changeait RIEN**. La cause : `tient_le_texte()` (section 20.1), qui remet
TOUTES les colonnes à leur ancienne valeur sauf le texte.

Et l'essai 10 de `essais-section-36.sql` passait **au vert** — il tournait
sans jeton, donc `auth.uid()` vide, donc le verrou ne s'appliquait pas.

> **Un essai sans jeton n'éprouve pas un verrou qui dépend de
> `auth.uid()`.** Sixième fois dans ce projet qu'un contrôle passe au vert
> sans rien prouver. L'essai se fait désormais avec `set local role` et
> `set local request.jwt.claim.sub`, chacun dans son propre ordre — jamais
> dans un bloc `do`.

Le verrou laisse donc passer `chantier_id`, et **rien d'autre** : vérifié
sur la vraie base, `media` et `likes_count` restent intacts pendant que le
texte change. `trg_chantier_du_post` garde déjà la porte avec `OP002`.
C'est aussi ce qui rendra possible le lot « ranger mes anciennes
publications » — les seize déjà en base n'ont aucun chantier, et personne
ne peut deviner lesquelles vont ensemble.

#### `===` entre un nombre et une chaîne : trois fois dans le même lot

`myProId` vient de `Object.keys(pros)[0]`, qui rend **toujours une
chaîne** ; les chantiers de démonstration portent un **nombre**. Un `===`
strict rendait donc une liste vide, et le bloc « Mes chantiers » ne
s'affichait **jamais** sans fichier `.env` — ni la bande, ni la place du
récit, ni le bouton « Terminer ». Trouvé au navigateur, pas en relisant.

`mesPublications` tenait déjà cette garde depuis le lot 4 ; les chantiers
non, à trois endroits. `verifier-chantier` REFAIT le calcul sur les données
de démonstration au lieu de lire le code.

#### Deux ordres pour une seule page

Mesuré au navigateur : la bande arrivait **après** le portfolio chez son
auteur et **avant** sur la fiche publique.

> **L'artisan doit voir sa page comme ses clients la voient** — c'est le
> seul endroit où il peut la vérifier. Même composant, même ORDRE.

#### Une cible de 24 points qui ouvre une page entière

La ligne du chantier sur la carte mesurait **332 × 24**. C'est une cible
qui ouvre une PAGE : la règle du lot 5 vaut pour elle. `minHeight: TOUCHE`,
et **pas** `paddingVertical` — React Native aplatit par précision, la forme
longue l'emporte. Mesurée après : **332 × 44**.

#### Terminer un chantier se DÉFAIT

Le bouton disparaissait une fois le chantier terminé : un appui par erreur,
et plus aucune porte. Un seul bouton, qui bascule « Terminer » / « Rouvrir ».

#### La couverture est le RÉSULTAT, pas le début

Personne n'a envie de commencer par une toiture arrachée. C'est la
publication la plus RÉCENTE qui porte une image. Et le déclencheur
**RECALCULE** au lieu d'incrémenter : une publication peut changer de
chantier, disparaître, ou arriver avec une date antérieure. Vérifié dans
les deux sens — on retire la dernière, la couverture redescend.

#### Ce qui n'a PAS de rattrapage, et c'est voulu

Aucune publication existante n'appartient à un chantier, et **personne ne
peut deviner lesquelles vont ensemble**. Les deux publications du 21/09 à
Lambesc sont probablement le même travail — « probablement » n'est pas une
base pour écrire dans la base de quelqu'un. Même règle que
`completerLieu()`.

#### En démonstration, créer un chantier FAISAIT quelque chose… non

`creerChantier` valait `noop` : on tapait un nom, on validait, la feuille
se refermait et **il ne se passait rien**. L'écran ne mentait pas, il se
taisait — et le mécanisme ne s'essayait nulle part sans fichier `.env`. Il
vit maintenant en mémoire, **et refuse le doublon du même côté qu'en base**
(`lower(btrim(titre))`).

Même famille : en démonstration les étapes sortaient dans l'ordre du
FICHIER — donc la dernière d'abord, puisque le fil range du plus récent au
plus ancien. Elles portent une vraie date (`publieLe`) et se trient comme
la requête.

#### `mes_donnees()` est la DERNIÈRE fonction du fichier, pour de bon

PostgreSQL contrôle le corps d'une fonction SQL à sa CRÉATION : elle ne
peut pas nommer une table née plus bas. **Toute section qui ajoute une
table ajoute sa ligne dans l'export RGPD**, et cet export reste à la fin.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un PostgreSQL 16 neuf, les douze cas
de `supabase/essais-section-36.sql`, les 36 contrôles, `npx expo export
--platform ios`. Le contrôle a été éprouvé **en cassant ce qu'il
surveille** : sept défauts remis à la main, les sept refusés.

Puis sur la VRAIE base, migration appliquée par le connecteur (aucun ordre
qui commence par `drop` — les politiques sont créées sous condition dans un
bloc `do`), avec deux comptes professionnels jetables supprimés dans la
même session (0 restant, base revenue à 13 comptes / 7 fiches /
16 publications / 0 chantier) :

| | résultat |
|---|---|
| A crée un chantier | 201 |
| le même nom une seconde fois | **23505** |
| B le crée au nom de A | **42501** |
| un titre vide | **23514** |
| trois étapes publiées | compteur **3**, couverture = la plus récente |
| B accroche sa publication au chantier de A | **OP002**, message en français |
| la bande vue par B, puis par un visiteur | 1 chantier, 3 publications |
| après que B a bloqué A | **0 chantier lu** |
| A termine puis rouvre | `termine` → `en_cours` |
| B tente de terminer | **0 ligne modifiée** |
| l'export RGPD de A | son chantier, et lui seul |
| A supprime son chantier | **3 publications restantes, 3 décousues** |
| ranger une publication en ligne | 3 / 3 cousues, compteur à 3 |
| …et `media` / `likes_count` | **intacts** |
| **au navigateur** : la ligne du fil | **332 × 44**, « Voir le chantier Toiture Charleval, 3 publications » |
| ouvrir le chantier | **une seule requête** |
| la page | 3 étapes dans l'ordre, « Bientôt : le récit », bouton « Terminer » |
| ma fiche | « Mes chantiers » avant le portfolio, carte **164 × 164**, pastille « En cours » |
| créer un chantier depuis l'écran Publier | `POST /rest/v1/chantiers → 201`, choisi aussitôt |
| publier dedans | `POST /rest/v1/posts → 201`, compteur à **1** |

**VÉRIFIÉ SUR L'IPHONE le 06/10/2026**, par le propriétaire : « j'ai testé
aussi sur mon iPhone, tout fonctionne ». Il n'y a donc plus rien à reporter
au téléphone sur ce lot, à une exception près : **aucun artisan réel n'a
encore de chantier**, la vraie base en compte **0**. Le jour où il y en aura
vingt, la bande et son défilement horizontal se jugeront à nouveau.

Et le temps réel ne s'intercepte pas depuis ce conteneur
(`ERR_TUNNEL_CONNECTION_FAILED` sur le WebSocket, attendu).

#### Deux remarques de l'iPhone, le lendemain — et un défaut que j'avais CRÉÉ

Le propriétaire, après avoir essayé le lot sur son téléphone : « tout
fonctionne, j'ai deux petites remarques ».

**1. « Le nom du chantier est entouré d'un carré beige, on pourrait
peut-être garder que l'écriture. »** Il a raison, et pas par goût : un bloc
teinté se lit comme une ÉTIQUETTE, donc comme une information posée là. Or
cette ligne est un **chemin** — elle ouvre un dossier. L'icône de calques
dit « il y a une suite », l'encre orange dit « on peut appuyer », et ça
suffit. Mesuré après : fond `rgba(0,0,0,0)`, bordure gauche `0px`, et la
boîte toujours **332 × 44** — ce sont ces 44 points qui portent l'air
autour du texte, d'où plus aucune marge au-dessus.

**2. « Dans le dossier du chantier on voit bien les photos mais on ne peut
pas les faire défiler. »** Là, c'était un vrai défaut, et **deux en un** :

```js
// ChantierScreen
if (!onOuvrir) return contenu;   // ← `onOuvrir` est TOUJOURS une fonction
// OpusApp
onOuvrirPublication={(p) => { if (!FORMATS_VIDEO.has(p.format)) return; … }}
```

Chaque étape était donc enveloppée dans un `Pressable`, et :

- **il avalait le geste du carrousel.** Une zone appuyable posée AU-DESSUS
  d'un défilement horizontal gagne toujours : le doigt part de côté, le
  parent croit à un appui. C'est la famille du `PanResponder` au-dessus
  d'une vue native ;
- **et sur une photo il ne faisait RIEN.** Mon propre commentaire, deux
  lignes plus haut dans `OpusApp`, disait « un appui qui ne fait rien serait
  pire que pas d'appui du tout ». Je l'ai écrit et violé dans le même lot.

> **C'est l'ÉCRAN qui décide s'il y a une cible, jamais le parent qui passe
> une fonction se contentant de `return`.** Une fonction existe toujours ;
> ce qu'elle FAIT, le composant ne peut pas le savoir. Une vidéo, elle, est
> seule dans son étape — aucun carrousel à avaler, et l'appui ouvre le fil
> vidéo.

Et sa question — « on les fait défiler, ou on les délie et on les affiche
une par une ? » — se tranche ainsi : **on les fait défiler.** Les délier
ferait quatre étapes là où il y en a une. Une publication EST une étape ;
ses quatre photos sont quatre angles du même moment, et le carrousel du
lot 0 sait déjà les montrer.

**Vérifié au navigateur, avec de VRAIS événements tactiles** (`Input.dispatchTouchEvent`) :
plus aucun bouton au-dessus de l'étape photo, l'indicateur affiche **1/2**,
et un doigt vers la gauche le fait passer à **2/2**. Une étape de
démonstration porte désormais deux photos — sans elle, ce carrousel ne se
vérifiait nulle part.

**Puis sur l'IPHONE, par le propriétaire** : « j'ai testé et ça fonctionne
parfaitement ». Les deux corrections tiennent donc au doigt, et pas
seulement sous un événement tactile fabriqué — c'est la première fois dans
ce projet qu'un geste est éprouvé **des deux côtés** avant d'être déclaré
bon.

#### Ce qui vient ensuite, et qui est le but

**Le récit écrit par l'IA.** La place est là, vide, et elle ne s'affiche
qu'à l'artisan — personne d'autre n'a besoin de savoir qu'une
fonctionnalité manque. Elle se construira avec le journal d'audit et les
permissions du §21, comme l'exige ce document : « ne plus ajouter d'action
IA à la main dans la fonction Edge `ai` ».

### La cloche — une notification est une ADRESSE (06/10/2026)

Section 37 de `schema.sql`, `src/lib/notifications.js`,
`npm run verifier-notifications`. Trois défauts relevés par le propriétaire
sur son iPhone, et sa demande, qui est la bonne :

> « Si je reçois une notification "Melina Meinhard a commenté votre
> publication", je voudrais que si on clique dessus ça nous redirige sur le
> post en question et que ça ouvre le commentaire en question. Et pareil
> pour toutes les autres notifications. »

Relevé sur la vraie base AVANT d'écrire une ligne :

| | |
|---|---|
| notifications | 15 |
| dont l'acteur a un **nom** | **13 sur 13** |
| dont l'acteur a une **photo** | **1 sur 13** |
| qui ne menaient nulle part (`post_id is null`) | **11 sur 15** |
| portant un `comment_id` que personne ne lisait | 4 sur 4 |

#### Le rond beige n'était pas un manque de photo

C'est une ligne manquante dans un mappage. `api.js` demandait
`acteur:acteur_id(nom, avatar_url)` depuis le début et ne reportait que
l'adresse de la photo. Or `Avatar` affiche les **initiales** quand il n'a
pas d'image.

> **Douze ronds vides sur treize, pour un `acteurNom` oublié.** Et rien ne
> le signalait : un rond beige ressemble à un compte sans photo.

#### Et `comment_id` était rempli depuis le premier jour, lu par personne

`notifie_commentaire()` l'écrit depuis toujours. C'est le défaut du 01/10 —
une colonne qu'on écrit sans jamais la relire — dans sa forme la plus pure,
puisque l'écran en avait précisément besoin.

#### Une colonne par cible, et pas une paire générique

Manquaient l'annonce et les trois sortes de demande. On aurait pu poser
`(cible_type, cible_id)`. Écarté :

> **Une colonne générique ne peut pas porter de clé étrangère.** La base ne
> garantirait plus que la cible existe, et ne nettoierait plus derrière :
> une demande supprimée laisserait une notification qui pointe dans le
> vide, et l'écran dirait « introuvable » à quelqu'un qui n'a rien fait de
> mal. Quatre colonnes nommées coûtent quatre lignes ; l'intégrité, elle,
> ne se rattrape pas.

`on delete cascade` et pas `set null`, comme `post_id` : une notification
qui a perdu sa cible n'a plus rien à dire.

Et les trois demandes vivent dans trois tables, donc trois colonnes — ce
qui dit aussi à l'écran QUELLE pastille de « Pour moi » ouvrir, sans qu'il
ait à interpréter le `type`.

#### Le rattrapage n'était pas optionnel

Sans lui, le lot ne corrigeait que les notifications à VENIR : les sept que
le propriétaire a touchées seraient restées muettes pendant que les
37 contrôles passaient au vert.

Ce qui rend le lien SÛR, et ce n'est pas une approximation : la
notification est écrite PAR le déclencheur, dans la MÊME transaction que la
ligne qui la provoque. Les deux `created_at` valent donc le même `now()`.
Mesuré sur les deux notifications d'annonce : écart **0,000000 s**, et le
titre de l'annonce est dans le texte — deux critères indépendants qui
concordent.

> **On ne remplit que quand il n'y a qu'UN SEUL candidat.** C'est la règle
> de `completerLieu()` : une notification qui ouvre LA MAUVAISE demande
> montrerait à quelqu'un le dossier d'un autre.

Appliqué : **les 15 notifications mènent quelque part**, et un contrôle
croisé indépendant le confirme — un « ne peut pas donner suite » pointe
bien une demande au statut `refuse`.

#### `min(uuid)` n'existe pas, et `schema.sql` passait quand même

Le rattrapage est un bloc `do`. **Un bloc `do` n'est analysé qu'à
l'EXÉCUTION** : avec `min(a.id)` il se crée sans un mot, et comme il ne
boucle sur rien sur une base neuve, le schéma rejoué deux fois ne disait
rien du tout.

> **L'erreur vivait dans un chemin que rien n'empruntait.** Seul un jeu
> d'essai avec de VRAIES lignes l'a sortie. C'est `(array_agg(x))[1]` qu'il
> faut — et `combien = 1` qui rend la valeur sûre, pas l'agrégat.

#### LE DÉFAUT QUE SEUL LE NAVIGATEUR A TROUVÉ — une clé d'onglet inventée

Le plus coûteux du lot, et il n'a rien levé. La cloche appelait
`changerOngletDecouvrir('pros')` ; la clé de la Place des pros est
**`'artisans'`**.

```js
const indexDecouvrir = Math.max(0, ongletsDecouvrir.findIndex(...));  // -1 -> 0
```

On atterrissait donc sur « Pour moi », **aucune pastille n'était active**
— l'onglet demandé ne correspondait à rien —, et la feuille de l'annonce
s'ouvrait quand même par-dessus, parce que c'est une `Modal` et que la page
voisine est montée au repos. Donc : le bon contenu, la mauvaise page. En
fermant la feuille, on était perdu.

> **Et la destination « demande » marchait, par pur HASARD** : « Pour moi »
> est justement la page de repli. Un contrôle vert pour la mauvaise raison,
> une fois de plus.

Deux corrections, et la seconde est la vraie :

1. la bonne clé ;
2. **`changerOngletDecouvrir` REFUSE une clé inconnue** et rend `false`, au
   lieu de retomber sur la première page en silence. `verifier-notifications`
   compare désormais les clés demandées à celles qui existent.

Et le cas qui reste, qui n'est pas une faute de frappe : **un particulier
n'a pas d'onglet « Pour moi »**, et il reçoit pourtant « a accepté votre
demande ». Il n'existe aujourd'hui aucun écran « mes demandes envoyées ».
On le DIT, au lieu de le poser sur une page au hasard.

#### Le panneau s'ouvrait VIDE

`ouvrirNotification` posait `setOpenCommentsId(...)` à la main. Mais depuis
que le fil se charge par pages (lot 4), `post.comments` n'existe pas tant
que personne ne l'a demandé — et c'était `toggleComments`, et lui seul, qui
allait le chercher.

> **Deux façons d'arriver au même écran doivent faire exactement le même
> travail.** C'est la règle écrite le 04/10 pour `changerOngletDecouvrir`,
> et je venais de la violer dans l'autre sens : là, un état changeait sans
> le travail qui va avec ; ici, un panneau s'ouvrait sans son contenu.

`ouvrirCommentaires(id)` est la porte unique. `toggleComments` BASCULE : la
cloche ne peut pas l'appeler, elle refermerait le panneau déjà ouvert sur
ce post.

#### Arriver au bon endroit ne suffit pas : il faut le VOIR

Mesuré au navigateur, fenêtre de 844 : le commentaire visé tombait à
**y = 816**. Techniquement visible ; en pratique **sous la barre d'onglets**,
qui fait 69 px. Du point de vue du propriétaire, c'est encore « ça me ramène
sur le fil ».

Le fil défile donc jusqu'à la PUBLICATION — pas jusqu'au commentaire, qui
n'a ni index ni hauteur connue dans cette liste, alors que le post en a un.
Mesuré après : **y = 666**, au-dessus de la barre. Et
`onScrollToIndexFailed` est obligatoire : les cartes n'ont pas toutes la
même hauteur depuis le 02/10 (le cadre suit la photo), donc
`scrollToIndex` peut tomber sur un élément pas encore mesuré.

#### Le chevron mentait, et la voix avec lui

Trouvé **sur une capture**, pas en relisant. `menuQuelquePart = !!n.postId` :
sur les trois lignes de l'essai, UNE SEULE portait le chevron. Les deux
autres avaient l'air d'être de simples informations — et on n'appuie pas
sur ce qui a l'air de ne rien faire.

> **C'était un TROISIÈME endroit qui réinventait la même vérité**, après la
> barre du bas et le routage — exactement le défaut des voyants du 04/10.
> `destinationNotif` est la seule qui sait où mène une notification.

Et VoiceOver annonçait « Ouvrir la publication » pour toutes : on
s'attendait à une publication et on tombait sur la Place des pros.

#### Le calcul vit dans un fichier qui n'importe rien

`src/lib/notifications.js` — neuvième application de la leçon de
`cloudinary-adresses.js`. Le contrôle **fait tourner** `destinationNotif`
sur chacun des quinze types avec la cible que la base y met, et refuse
celui qui ne mène nulle part. Un type ajouté demain sans destination sera
refusé.

Et deux listes pour une seule vérité ne peuvent pas se contredire :
`NOTIFS_PROFIL` (« ce type n'a pas de cible ») et `CIBLE_ATTENDUE` (« ce
type porte telle colonne ») sont comparées à chaque passage.

#### Un contrôle qui compte les gardes ne garde rien

Éprouvé en cassant ce qu'il surveille, comme toujours. Sur six défauts
remis à la main, **il en a laissé passer un** : il comptait les
`if combien = 1 then` et exigeait au moins deux ; il y en a trois (les deux
branches, plus le décompte final), donc en retirer une passait. Il regarde
maintenant les DEUX CHEMINS D'ÉCRITURE, chacun entre le début de sa branche
et son premier `update`. Éprouvé branche par branche : les deux refusés.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un PostgreSQL 16 neuf, les neuf cas de
`supabase/essais-section-37.sql`, le rattrapage éprouvé sur un jeu
contenant à la fois le cas unique et le cas AMBIGU (3 remplies, 2 laissées,
puis 0 et 2 au second passage — donc rejouable), les 37 contrôles,
`npx expo export --platform ios`. Migration appliquée sur la vraie base.

Puis au navigateur, sur la VRAIE base, avec deux comptes professionnels
jetables supprimés dans la même session (0 restant, base revenue à
13 comptes / 7 fiches / 17 publications / 1 chantier / 15 notifications) :

| | relevé |
|---|---|
| la cloche | **40 × 44** |
| les trois avatars | **initiales**, plus un rond vide |
| le nom de l'acteur | écrit à l'écran |
| **un acteur AVEC photo** | **sa photo**, 0 initiale, `alt="Photo de Melina Meinhard"` |
| « a commenté » | **le bon post**, panneau ouvert, **le commentaire visé** |
| son repère | `3px rgb(232,92,31)`, fond **transparent** |
| sa position | **y = 666** sur 844 — au-dessus de la barre |
| « a répondu à … » | **Place des pros**, l'annonce, la réponse lisible |
| la pastille | « Place des pros », encre blanche, cadre à **390** |
| « vous demande un devis » | **« Pour moi »**, sur cette demande-là |

##### Les initiales sont le REPLI, pas le comportement voulu

Question du propriétaire en lisant le compte rendu : « si la personne qui
envoie une notification a une photo de profil, il faut sa photo à la place
des initiales ? » Oui — et je ne l'avais **pas vérifié** : mes deux comptes
d'essai n'avaient pas de photo, donc je n'avais mesuré que le repli.

Éprouvé le jour même sur la vraie base, avec un compte portant une VRAIE
photo envoyée dans l'espace `avatars` : **1 `<img>` rendue**, **0 initiale**,
et `alt="Photo de Melina Meinhard"` pour VoiceOver. `Avatar` affiche l'image
dès que `uri` est fourni ; les initiales n'arrivent qu'à défaut.

> **Et c'est devenu un contrôle**, parce que c'est précisément le genre de
> ligne qu'on retire un jour en croyant bien faire : sans `uri`, tout le
> monde redeviendrait un rond à initiales, et ça ressemblerait trait pour
> trait au défaut qu'on vient de corriger.

Au passage, le ménage de compte a bien emporté les **2 fichiers** d'avatar
du compte jetable (`{"espace":"avatars","retires":2}`).

**VÉRIFIÉ SUR L'IPHONE le 07/10/2026**, par le propriétaire : « j'ai testé
et ça fonctionne parfaitement ». Les photos de profil sont toutes là, et
toucher une notification ouvre bien la publication, directement.

**Ce qui n'a PAS été vérifié** : les notifications de **partenariat** et de
**vérification** mènent à la fiche — c'est écrit et contrôlé, mais la vraie
base n'en contient aucune adressée à un compte que je puisse ouvrir.

#### DEUX DÉFAUTS SIGNALÉS LE LENDEMAIN — et mon essai les avait MASQUÉS

Le propriétaire, le 07/10 : « les images de profil ne s'affichent toujours
pas sur les personnes qui font des notifications, et quand on clique sur
les notifications de commentaire ça ouvre bien l'emplacement mais ça ne
m'emmène pas directement sur le post en question ».

Les deux étaient justes. Et les deux avaient été « vérifiés » la veille.

##### 1. La photo d'un ARTISAN vit sur sa FICHE, pas sur son compte

Relevé sur la vraie base avant de toucher à quoi que ce soit :

| | |
|---|---|
| photo sur `professional_profiles` | **2 artisans sur 7** |
| photo sur `users` — ce que lisait la cloche | **0 sur 7** |

`updateProfile` écrit dans l'une **ou** dans l'autre selon le type de
compte, jamais dans les deux. Ce n'est pas un oubli : dupliquer la même
donnée dans deux tables est exactement le défaut du 05/10 — « deux moitiés
créées par deux mécanismes différents finiront par se désaligner ».

> **C'est donc la LECTURE qui doit regarder aux deux endroits, pas
> l'écriture qui doit recopier.** Et la base le faisait DÉJÀ :
> `notifie_commentaire()` compose le nom de l'acteur avec
> `coalesce(pp.entreprise, u.nom, …)` et un `left join
> professional_profiles`. L'application lisait la moitié de ce que le SQL
> savait depuis le premier jour.

**Et pourquoi mon essai ne l'a pas vu** : j'avais posé la photo du compte
jetable dans les DEUX tables à la main, ce que l'application ne fait
jamais. Un jeu d'essai plus généreux que la réalité ne prouve rien — même
famille que « mesurer avec sept éléments » du lot 4.

`photoActeur()` vit dans `src/lib/notifications.js`, qui n'importe rien, et
le contrôle la FAIT TOURNER sur sept cas. **Les commentaires avaient le
même défaut**, pour la même raison : corrigés en même temps, sinon le
rond vide restait visible juste à côté.

Mesuré au navigateur, sur la vraie base, avec un compte dont la photo
n'est QUE sur la fiche :

| | sans la jointure | avec |
|---|---|---|
| photos affichées | **0** | **1** |
| ronds à initiales | 1 | **0** |

##### 2. `scrollToIndex` ne saute pas à ce qui n'est pas monté — ET LA CORRECTION A ÉCHOUÉ AUSSI

**Deux tentatives de défilement, deux échecs sur l'iPhone.** Le propriétaire,
la troisième fois : « ça ouvre bien le post mais ça ne me dirige pas dessus,
je suis obligé de le chercher à la main en descendant le fil ».

La cause est réelle et mesurée — les commentaires visent des publications
aux **rangs 3 à 6**, et le fil n'en monte que **deux** au départ (lot 4, et
ce réglage est celui qui a débloqué l'iPhone au démarrage : il ne bouge
pas). On peut rattraper le coup en sautant à une position approchée puis en
recalant. Mais c'est une course contre la virtualisation, et surtout :

> **Ça ne se vérifie PAS au navigateur.** Mesuré : **4 cartes sur 4 montées**
> alors que `initialNumToRender={2}`. `react-native-web` ne virtualise pas
> comme iOS, donc `scrollToIndex` n'y échoue jamais, et la correction donne
> **exactement les mêmes nombres avec et sans** — vérifié en remettant
> l'ancien code.

**Livrer une troisième correction invérifiable aurait été recommencer la
même faute.** D'où `src/screens/PublicationScreen.js` :

> **ON SUPPRIME LE PROBLÈME AU LIEU DE LE CONTRÔLER.** Une notification
> ouvre la publication **seule sur sa page**. Plus de fil à parcourir, plus
> de rang, plus de virtualisation, plus rien à faire défiler. C'est la règle
> du calendrier du 04/10 : « le meilleur message d'erreur est celui qu'on ne
> peut plus déclencher ».

Et c'est ce que font les applications qu'il connaît : toucher une
notification n'y ramène jamais dans le fil.

Mesuré au navigateur, sur la VRAIE base, avec une publication au rang 3 :

| | relevé |
|---|---|
| la publication visée | **y = 142**, en haut |
| le commentaire visé | **y = 560**, trait orange |
| une autre publication sur la page | **aucune** |
| hauteur de la page | **844 px** pour une fenêtre de 844 — rien à défiler |
| le retour | ramène à la **cloche**, d'où l'on vient |

Trois choses à ne pas redécouvrir :

1. **la page cherche dans `posts`, jamais dans le fil FILTRÉ.** La loupe ne
   doit pas pouvoir cacher la publication qu'une notification désigne : on
   vient la lire, pas la filtrer ;
2. **le panneau des commentaires est ouvert d'office**, et `onToggleComments`
   n'est pas transmis — il n'y a rien à replier sur une page qui ne contient
   que ça ;
3. **le code de défilement a été RETIRÉ du fil**, pas gardé « au cas où » :
   une fonction que personne n'appelle est le « bouton §18 ».

###### Et le contrôle a planté sans écrire un seul « ✘ »

En retirant les contrôles devenus périmés, j'ai laissé `fil` utilisé mais
plus déclaré. `verifier-notifications` **plantait** — donc ne vérifiait
plus rien — et sa sortie ne contenait aucun « ✘ ». C'est `npm run verifier`,
qui lit le CODE DE SORTIE et distingue un contrôle qui échoue d'un contrôle
qui n'a pas pu se lancer, qui l'a attrapé. C'est exactement ce pour quoi il
a été écrit au lot 8.

Et deux fois dans le même lot, j'ai refait des fautes que ce document
documente déjà : une `const` lue avant sa déclaration (`routage`), et un
contrôle qui vise une PLACE — « tout ce qui suit la fonction » — au lieu de
viser la BRANCHE concernée, donc qui attrapait deux `setScreen('home')`
parfaitement légitimes.

##### Ce qui avait été tenté avant, et pourquoi c'était insuffisant

Relevé sur la vraie base : les cinq commentaires existants visent des
publications aux rangs **3, 3, 3, 6 et 6**. Or la liste n'en monte que
**deux** au départ — le réglage du lot 4, qui ne bouge pas, c'est lui qui a
débloqué l'iPhone au démarrage.

`scrollToIndex` échouait donc, `onScrollToIndexFailed` reprenait la main…
et **refaisait exactement l'appel qui venait d'échouer**. Il échouait
pareil.

> **Le motif qui marche se fait en DEUX temps** : on saute d'abord à une
> position APPROCHÉE (`scrollToOffset`), ce qui oblige la liste à monter
> les cartes du voisinage, puis on recale au pixel.

Mon essai de la veille portait sur une publication créée à l'instant, donc
en TÊTE du fil — **le seul rang qui ne pouvait pas échouer**.

Et le défilement ne dépend plus de `commentaireCible` mais d'un `postCible`
explicite, posé par la cloche seule : `openCommentsId` se pose aussi quand
on touche le bouton « commentaires » d'une carte, et faire sauter le fil
sous le doigt de quelqu'un déjà devant la bonne publication serait
désagréable.

##### Et CE DÉFAUT-LÀ NE SE VÉRIFIE PAS AU NAVIGATEUR

Mesuré, plutôt que supposé : **4 cartes sur 4 sont montées au premier
affichage** alors que `initialNumToRender={2}`.

> **`react-native-web` ne virtualise pas comme iOS.** `scrollToIndex` ne
> peut donc jamais y échouer, `onScrollToIndexFailed` n'y est jamais
> appelé, et la correction donne **exactement les mêmes nombres avec et
> sans** — vérifié en remettant l'ancien code.

C'est la même famille que « `pagingEnabled` n'est pas la même chose des
deux côtés » du 04/10 : un défaut réel sur le téléphone, invisible ici par
construction. La photo, elle, se mesure ; le défilement se juge sur
l'iPhone, et nulle part ailleurs.

#### Et un point laissé ouvert, exprès

`PagesGlissantes` porte `const place = useRef(false)` **écrit et lu nulle
part** : un garde-fou qui ne garde rien. Je l'ai branché en croyant tenir la
cause du mauvais onglet, puis mesuré qu'il n'y changeait rien — la cause
était la clé inventée. Je l'ai donc **retiré** : livrer un garde qu'on ne
peut pas éprouver est exactement ce que ce document refuse. Reste à trancher
s'il protégeait un cas iOS que le navigateur ne montre pas.

### Le socle de l'agent — qui appelle l'IA, et on le note (07/10/2026)

Section 38 de `schema.sql`, `src/lib/journal-ia.js`, `npm run verifier-agent`.
Premier lot de l'agent Opus (§3, §21, §23 du cahier des charges), et il
commence par une porte qui était grande ouverte.

#### N'IMPORTE QUI pouvait faire payer des appels Anthropic

La fonction Edge `ai` n'a jamais regardé QUI l'appelait. Elle acceptait la
**clé publiable**, qui est dans le paquet de l'application, donc lisible sur
n'importe quel téléphone.

> **Une clé publiable EST un jeton valide, mais elle ne désigne personne.**
> `supabase.auth.getUser(jeton)` ne rend alors aucun utilisateur — et c'est
> exactement ce test qui ferme la porte. Sans lui, un script pouvait appeler
> Claude en boucle sur la facture du propriétaire.

Et identifier ne suffit pas : **un seul compte d'essai suffirait à vider le
budget** en lançant mille fois la même demande. D'où la limite, et elle est
tenue par la BASE.

#### Le comptage et l'écriture sont le MÊME ordre

C'est tout l'intérêt de `enregistrer_appel_ia()` : compter d'un côté puis
écrire de l'autre laisse un intervalle où deux appels simultanés passent
tous les deux. Ici la ligne du journal n'existe que si la limite le permet,
et dans la même transaction.

> **Et elle part AVANT Anthropic.** Refuser après avoir payé l'appel ne
> protège rien. Le coût réel, lui, ne se connaît qu'après : la ligne est
> complétée dans un second temps. Sans ce second temps, `jetons_entree` et
> `jetons_sortie` resteraient à zéro pour toujours — deux colonnes écrites
> et jamais remplies.

#### `raise exception` ANNULE la transaction — l'essai l'a démoli en une ligne

Le premier jet levait une exception quand la limite mordait. Donc :
l'insertion du refus qu'on venait d'écrire **partait avec la transaction**,
et le journal n'aurait gardé aucune trace des limites atteintes. L'inverse
exact de ce qu'on voulait, et invisible sans l'exécuter.

> **Un refus n'est pas une panne : la fonction REND toujours une ligne**, et
> c'est son `resultat` qui dit ce qui s'est passé. L'exception ne reste que
> pour `p_user is null`, qui n'est pas un cas métier mais une faute de
> programmation — là, il FAUT que ça casse.

Même raison du côté du comptage : **on ne compte que les appels qui ont
abouti**. Compter les refus ferait qu'un compte bloqué le reste la journée
entière à cause de ses propres tentatives.

#### `revoke` : il faut révoquer TROIS choses, et la base d'essai mentait

Le défaut le plus instructif du lot, et il n'a été trouvé que **sur la vraie
base**, juste après avoir appliqué la migration : un appel anonyme a répondu
`409` — donc la fonction s'était **exécutée**.

| ce qui est écrit | ce que ça retire |
|---|---|
| `revoke … from anon, authenticated` | **rien** — PostgreSQL accorde `execute` à **PUBLIC** sur toute fonction neuve |
| `revoke … from public` | le droit de PUBLIC, **mais pas** le grant direct que Supabase pose par `alter default privileges` |
| `revoke … from public, anon, authenticated` | **tout** |

C'est le piège du 29/09 sur les colonnes — « `revoke select (colonne)` ne
retire rien tant que le rôle possède le droit de lire la table entière » —,
même forme, autre objet.

> **Et la base d'essai passait au vert pendant que la porte était ouverte en
> production.** `local-prelude.sql` n'accordait les droits par défaut que
> sur les TABLES, pas sur les FONCTIONS : l'essai 9 ne pouvait donc pas
> reproduire le défaut. Il le fait maintenant.

#### Le journal ne contient NI la question NI la réponse

Il note QUE l'IA a été appelée, par QUI, pour QUOI et à quel COÛT.

> **Ce qu'on n'écrit pas ne peut pas fuir.** Le texte d'une demande à l'IA
> contient le nom d'un client, un prix, parfois une adresse — des données de
> TIERS que l'artisan n'a pas à voir conservées, et que le RGPD obligerait à
> purger. Le journal répond aux questions qu'on se pose vraiment sans rien
> de tout cela.

Même esprit que `journal_admin` (section 25) : **aucune politique
d'écriture**, pas même pour soi. Seule la fonction Edge, qui détient la clé
de service, peut y ajouter une ligne. Un journal qu'on peut récrire ne
prouve rien. Vérifié sur la vraie base : un `insert` direct répond **403**,
et l'appel direct à la fonction d'écriture **403** aussi.

#### Et QUELQU'UN LE LIT — sinon tout ce qui précède est du décor

C'est le point qui a failli manquer. L'intention de départ était « poser le
journal maintenant, on le regardera plus tard » : c'est mot pour mot le
défaut du 01/10, et ce serait un comble pour un journal d'audit.

> **« Confidentialité et sécurité → Mon agent »** montre ce que l'agent a
> fait, quand, et si ça a abouti. C'est aussi ce que le §23 demande en
> propres termes : « possibilité de consulter l'historique ».

Quatre décisions à ne pas redécouvrir :

1. **On n'affiche PAS le nombre d'appels restants.** C'est tentant et c'est
   un piège : ce serait une SECONDE écriture de la règle tenue par
   `enregistrer_appel_ia()` — qui compte les lignes `ok` des 24 dernières
   heures **sur l'horloge du serveur** —, et elle se tromperait deux fois :
   sur une page de résultats qui peut être pleine de refus, et sur l'horloge
   du téléphone. La base le dit déjà au bon moment, en français.
   *(Cette phrase disait « en 429 et en français » : le 429 n'arrivait
   jamais à l'écran autrement qu'en anglais. Corrigé le 18/10, voir « Les
   erreurs de l'assistant arrivaient en anglais ».)* L'écran annonce la limite en toutes lettres, et **le contrôle compare le
   nombre des deux côtés**.
2. **On n'affiche PAS les jetons.** « 12 483 jetons » ne veut rien dire pour
   un maçon. Ils sont dans l'export de ses données, là où ils répondent à la
   seule question qu'ils savent traiter : « pourquoi cette facture
   monte-t-elle ? »
3. **On nomme le TYPE de la cible, jamais la chose.** « sur la fiche d'un
   artisan », pas « sur la fiche de Dupont Maçonnerie » : un journal n'a pas
   à conserver le nom d'un tiers, et il sert à rendre compte, pas à naviguer.
4. **Une action INCONNUE s'affiche quand même.** L'agent gagnera des actions
   (devis, facture, planning) ; une application pas encore mise à jour doit
   rendre compte de ce qui s'est passé, pas afficher une ligne vide. Un
   journal d'audit troué par une version en retard ne prouve plus rien.
   `libelleAction('recit_chantier')` rend « Action « recit_chantier » », et
   le contrôle le FAIT TOURNER — dixième application de la leçon de
   `cloudinary-adresses.js`.

Et dans l'autre sens, `cible_type` serait **une colonne lue que personne
n'écrit** — le défaut des photos d'annonce du 04/10 — si `ai.js` ne la
remplissait pas. Deux des quatre actions visent quelque chose de nommable,
les deux autres n'envoient rien : inventer une cible serait pire que se
taire. Le contrôle compare les deux listes dans les deux sens.

#### Un journal d'audit ne doit pas pouvoir fermer la porte de sortie

Cet écran porte aussi l'export RGPD et la suppression de compte. Ranger la
lecture du journal avec les deux autres chargements l'aurait rendue
solidaire : une table absente, un droit manquant, et c'est **tout** cet
écran qui tombe.

> **Le journal a donc son propre effet, son propre état, et son propre
> échec** — affiché dans sa section, pas en bandeau rouge sur toute la page.

#### Ce qui NE reste pas dans le dépôt

Les deux fichiers `migration-section-38*.sql`, écrits pour être collés dans
Supabase → SQL Editor pendant que le connecteur était tombé, ont été retirés
dès la migration appliquée. **Un fichier que personne n'a plus à ouvrir est
le « bouton §18 » sous une autre forme** — c'est la règle déjà posée au
lot B.

#### Vérifié, et comment

Les **douze** cas de `supabase/essais-section-38.sql` sur un PostgreSQL 16
neuf, `schema.sql` rejoué **deux fois**, les 38 contrôles, `npx expo export
--platform ios`. Deux de ces cas attendent un REFUS, et il faut le lire :
l'`insert` direct répond « new row violates row-level security policy », et
l'appel à la fonction d'écriture « permission denied for function ». Un
`grep` ancré sur `^ERROR` ne les voit pas — psql préfixe chaque ligne par le
nom du fichier. Le contrôle a été éprouvé **en cassant ce qu'il
surveille** : **quatorze défauts remis à la main, les quatorze refusés** —
dont « on retire le lecteur », « le revoke ne vise plus PUBLIC », « le refus
lève une exception » et « une action inconnue n'affiche plus rien ».

Puis au navigateur en démonstration, et surtout **sur la VRAIE base**, avec
deux comptes jetables supprimés dans la même session (0 restant, base revenue
à 13 comptes / 7 fiches / 17 publications / 15 notifications / 1 chantier) :

| | résultat |
|---|---|
| appel avec la clé publiable SEULE | **401**, « L'assistant n'est accessible qu'une fois connecté » |
| appel avec le jeton du compte | **200**, un vrai résumé d'avis |
| la ligne au journal | `summary` · `pro` · **191 / 152 jetons** · `ok` |
| le compte lit SON journal | 1 ligne |
| **un autre compte** | **`[]`** |
| `insert` direct dans `journal_ia` | **403** |
| `rpc/enregistrer_appel_ia` par un connecté | **403** |
| l'écran, sur la vraie base | « Résumé des avis sur la fiche d'un artisan · Il y a 4 min », **1 seul `GET`** |
| après suppression des comptes | **0 ligne** — le journal part avec son compte |

En démonstration, les quatre cas se voient d'un coup : une action courante,
un refus, une erreur, et l'action inconnue. Sans ce jeu, la règle la plus
importante du lot ne se vérifierait nulle part à l'écran.

**Ce qui n'a PAS été vérifié** : rien de tout ça sur un vrai iPhone. Et
**la limite de 60 par jour n'a pas été atteinte pour de vrai** — il faudrait
soixante appels payants pour la voir mordre de bout en bout ; elle est
éprouvée en SQL (essais 4 et 5) et le refus est simulé en démonstration.

#### Ce que cette section ne pose PAS, et pourquoi

Le §4 décrit sept familles d'action réglables (devis, facture, publication,
profil, planning, dépense, contrat). **Six n'existent pas encore dans
Opus.** Poser les sept réglages aujourd'hui créerait une table que personne
ne lit. **Chaque permission naîtra AVEC l'action qu'elle gouverne.**

### Le récit du chantier — la PREMIÈRE action de l'agent (07/10/2026)

Section 39 de `schema.sql`, `src/lib/recit.js`,
`src/components/RecitChantier.js`, `npm run verifier-recit`.

Le lot E avait laissé une place vide sur la page du chantier — « Bientôt :
le récit de ce chantier ». Le lot H a posé le socle qu'elle attendait : qui
appelle l'IA, le journal d'audit, la limite. Voici ce qui remplit la place.

#### La permission du §4 naît ICI, et elle n'est pas réglable

> **L'AGENT ÉCRIT, L'ARTISAN PUBLIE.** Le texte que l'agent rend n'est PAS
> enregistré : il arrive dans un champ, l'artisan le lit, le corrige s'il
> veut, et c'est son appui sur « Publier » qui l'envoie en base.

C'est le §2 du cahier des charges mot pour mot — « les actions
irréversibles ou engageantes demandent une validation ». Et ce n'est pas
qu'une précaution morale, c'est aussi ce qui évite un vrai piège :

> **`chantiers` est une table PUBLIQUE** (section 36.3), et **une règle RLS
> filtre des LIGNES, jamais des COLONNES** (section 18). Un brouillon rangé
> dans une colonne de `chantiers` serait donc lisible par n'importe qui, à
> la seconde où l'agent l'écrit, sans qu'aucune erreur ne le signale. Il
> aurait fallu des droits de colonne, donc casser `select *` pour tout le
> monde — **pour protéger un texte qui n'a pas besoin d'exister.**

Le coût est assumé : un brouillon qu'on quitte est perdu, comme dans tous
les formulaires d'Opus. Le refaire écrire coûte un appel sur les soixante
de la journée.

**Et aucun réglage « laisser l'agent publier tout seul ».** Une seule
action ne fait pas un écran de réglages, et un texte public écrit par une
machine sur la vitrine de quelqu'un est exactement l'action engageante que
le §2 veut voir validée. Le jour où il y aura sept actions, le réglage
aura un sens.

#### Un récit s'écrit à partir de MOTS, jamais à partir de photos

C'est la règle qui porte tout le lot, et elle vit dans `src/lib/recit.js`,
qui n'importe rien — onzième application de la leçon de
`cloudinary-adresses.js`, et ici elle est indispensable : **ce fichier
décide si l'agent a le droit d'écrire.**

> Trois publications sans un seul texte, et l'agent n'a rien à raconter.
> **Un modèle à qui l'on ne donne rien ne répond pas « je ne sais pas » :
> il produit une jolie phrase creuse**, et cette phrase irait sur la
> vitrine publique d'un artisan.

Donc : trois étapes au moins, **dont deux décrites** (avec un seul texte,
l'agent ne fait que le recopier), et quinze caractères minimum pour qu'un
texte compte — « Fini 💪 » ne dit rien du travail. Et **l'écran DIT
pourquoi** quand il refuse : un bouton grisé sans explication, on appuie,
rien ne se passe, et on croit l'application cassée.

La garde est posée **deux fois** : côté application, et côté serveur. La
fonction Edge est joignable directement.

#### Le récit vieillit, et rien d'autre ne le dirait

On publie trois étapes de plus, et le texte raconte un chantier qui n'est
plus celui qu'on voit en dessous. Il est toujours là, toujours bien écrit.

D'où `recit_ecrit_le`, comparée à `fin` (que le déclencheur des compteurs
tient déjà à jour). Et **c'est la BASE qui pose cette date**, par un
déclencheur : un indicateur de fraîcheur qui dépendrait de l'horloge du
téléphone pourrait mentir, et c'est le seul service qu'il rend. Vérifié sur
la vraie base — une date envoyée par le client (2001) est ignorée.

Trois détails du déclencheur, et aucun n'est décoratif : `clock_timestamp()`
et pas `now()` (la leçon du journal d'administration) ; la date **ne bouge
pas** quand le récit ne bouge pas, sinon renommer un chantier rajeunirait
son récit et l'avertissement s'éteindrait tout seul ; et une chaîne de
blancs devient `null`, pour qu'il n'y ait qu'UNE façon de dire « il n'y en
a pas ».

#### LE DÉFAUT QUE SEUL LE NAVIGATEUR A TROUVÉ — un champ vide

Le premier jet posait `setBrouillon(true)` puis, dans un `setTimeout(…, 0)`,
`champ.current.ecrire(texte)`. Mesuré sur la vraie base : **le champ
arrivait VIDE.**

> **Une référence n'est pas encore attachée à l'instant où le composant
> vient d'être demandé.** Le minuteur part avant que React n'ait monté le
> champ.

Et le défaut ne faisait planter personne : on lisait « Relisez avant de
publier » au-dessus d'un champ vide, et « Publier » ne faisait rien
(`publier()` sort tout de suite sur un texte vide). **Un écran
parfaitement calme qui ne fait rien** — exactement ce que ce document
traque.

La parade : le brouillon est un TEXTE dans l'état, posé AVANT le rendu, et
`ChampLocal` le reçoit comme valeur initiale (`defaut`). Plus de minuteur,
plus de référence. Avec une `key` qui change à chaque génération, sinon
« Recommencer » laisserait l'ancien texte — `defaut` n'est lu qu'au
montage. Mesuré après : **400 caractères dans le champ.**

Au passage, mon propre essai disait « le texte publié est à l'écran :
true » — avec un brouillon vide, `includes('')` est toujours vrai. Un
contrôle vert pour la mauvaise raison, une fois de plus.

#### Et un défaut du lot H, trouvé en lisant le journal d'un VRAI appel

Un appel refusé pour « une seule étape » s'inscrivait au journal **`ok`,
avec zéro jeton**. L'écran « Mon agent » l'aurait donc affiché comme un
travail fait, **et il aurait consommé un des soixante appels de la
journée.**

> **Un travail qui n'a pas pu se faire ne doit jamais ressembler à un
> travail fait.** C'est la règle de « Pour moi » du 05/10, et elle vaut
> pour le journal autant que pour un écran.

`refuser()` est désormais la seule porte des refus 400 de la fonction Edge,
et elle note `erreur`. Ce qui fait les deux : la ligne se voit, et elle ne
compte plus contre la limite — `enregistrer_appel_ia()` ne compte que les
`ok`. **Une demande malformée ne doit pas punir celui qui l'envoie.**
Vérifié sur la vraie base après déploiement : `recit` à une étape →
`erreur`, action `devis` inconnue → `erreur`, le vrai récit → `ok` avec
957 jetons.

#### Vérifié, et comment

Les treize cas de `supabase/essais-section-39.sql` sur un PostgreSQL 16
neuf, `schema.sql` rejoué **deux fois**, les 39 contrôles, `npx expo export
--platform ios`. Le contrôle a été éprouvé **en cassant ce qu'il
surveille** : **vingt-et-un défauts remis à la main, les vingt-et-un
refusés** — dont « on accepte des étapes sans texte », « la consigne
n'interdit plus d'inventer », « le récit part directement en base », « un
visiteur voit les boutons » et « le récit de démo invente ».

Deux de ces vingt-et-un ont d'abord PASSÉ, et les deux sont instructifs :
la vérification de l'heure cherchait `clock_timestamp()` **quelque part**
dans le déclencheur, donc une branche cassée sur deux lui échappait — la
faute du lot H, refaite ; et mon essai de rupture ne remplaçait que la
première ligne du récit de démonstration, donc le reste du vrai texte
restait et le contrôle avait raison de passer.

Puis, sur la VRAIE base (migration appliquée, fonction Edge déployée en
version 9), avec deux comptes professionnels jetables supprimés dans la
même session (0 restant, base revenue à 13 comptes / 7 fiches /
17 publications / 1 chantier / 0 ligne de journal) :

| | résultat |
|---|---|
| une seule étape décrite | **400**, « il faut au moins deux étapes décrites » |
| les trois étapes | **200**, un récit de 366 caractères |
| ce qu'il a écrit | **ses mots** : « dépose de l'ancienne couverture », « chevrons neufs en douglas », « écran sous-toiture » |
| le journal | `recit` · `chantier` · **915 / 156 jetons** · `ok` |
| la date envoyée par le client (2001) | **ignorée** — la base pose la sienne |
| une 4ᵉ étape publiée après | **PÉRIMÉ ? OUI** |
| un AUTRE pro le lit | oui — c'est la vitrine |
| …et tente de l'écrire | **`[]`** — refusé |
| un visiteur sans compte | le lit |
| **au navigateur** : sans récit | « Votre agent peut le raconter », bouton **332 × 44** |
| on demande | **brouillon de 400 caractères**, 1 appel `/functions/v1/ai 200` |
| on publie | le texte s'affiche, `PATCH /rest/v1/chantiers 200` |
| après une étape de plus | **« Vous avez publié depuis que ce récit a été écrit »** |

**VÉRIFIÉ SUR L'IPHONE le 07/10/2026**, par le propriétaire : « j'ai testé
et tout fonctionne ». Les boutons « Réécrire » / « Retirer » mesurent
**80 × 36** au navigateur — `BtnMini` atteint les 44 points par `hitSlop`,
que `react-native-web` ignore —, et ils se touchent donc bien au doigt.

**Ce qui n'a PAS été vérifié, et qui reste vrai** : **aucun artisan réel n'a
encore fait écrire un récit**. La vraie base compte 1 chantier et 0 récit.
Le jour où l'agent écrira à partir d'étapes mal décrites, ou très
nombreuses, le texte se jugera à nouveau — c'est la seule chose qu'un essai
avec des étapes que J'AI écrites ne peut pas dire.

### Nommer son agent — proposer trois fois, puis se taire (07/10/2026)

Section 40 de `schema.sql`, `src/lib/agent.js`,
`src/components/FenetreAgent.js`, `npm run verifier-agent-nom`.

Demandé par le propriétaire après les lots H et I :

> « quand la fenetre s'ouvre il puisse dire plus tard mais je pence qu'il
> faut que de temp en temp elle lui re propose pour pas qu'il ne saute
> cette etape »

Il a raison des deux côtés, **et les deux côtés tirent en sens inverse** :
une fenêtre toujours refusable se saute pour toujours ; une fenêtre qui
revient sans fin devient ce que son propre cahier des charges interdit en
propres termes — « les suggestions de l'IA ne doivent pas être
insistantes » (§2).

> **D'où un COMPTEUR, en base.** Trois propositions au plus, et la deuxième
> comme la troisième n'arrivent qu'après que l'agent a vraiment travaillé
> pour lui. Gardé sur le téléphone, ce compteur repartirait à zéro au
> prochain démarrage et la fenêtre reviendrait à chaque lancement — c'est
> exactement le défaut du point orange des Demandes, corrigé le 04/10.

#### Elle revient au bon MOMENT, pas au bout d'un certain temps

Une fenêtre qui s'ouvre parce que trois jours ont passé interrompt
quelqu'un au milieu d'autre chose. Juste après que l'agent a amélioré un
texte ou écrit le récit d'un chantier, la question « comment voulez-vous
l'appeler ? » tombe au seul instant où elle a un sens : on vient de voir à
quoi il sert.

Le signal est **une seule porte**, et elle est dans `callAiFunction`
(`src/lib/ai.js`) — le passage obligé des cinq actions, et de celles qui
viendront (devis, facture, planning). Le brancher sur chaque écran, c'était
cinq branchements aujourd'hui et un oubli silencieux au prochain lot : la
règle de `changerOngletDecouvrir` du 04/10.

Et il part **après** la réussite. Une demande refusée ou en panne n'est pas
un travail fait, et ne doit pas en avoir l'air.

#### LE DÉFAUT QUE SEULE LA CAPTURE A MONTRÉ

La première version fonctionnait, et elle était mauvaise : **la fenêtre
s'ouvrait par-dessus les trois propositions que l'agent venait d'écrire.**
On demandait « comment voulez-vous l'appeler ? » à quelqu'un qui n'avait
pas encore pu lire son travail. Tous les contrôles passaient, toutes les
mesures étaient justes — c'est la capture de la vraie base qui l'a dit.

> **Elle attend qu'il ait FINI, c'est-à-dire qu'il quitte l'écran.** Le
> signal retient l'écran où le travail a eu lieu ; tant qu'on y est, la
> fenêtre se tait. Pour un formulaire, quitter l'écran veut dire qu'on en a
> fini.

Vérifié sur la vraie base : l'IA répond, « 3 versions de VOTRE texte »
s'affiche **sans rien par-dessus**, et la fenêtre s'ouvre en arrivant sur
l'Accueil.

#### Ce qu'on n'a PAS fait, et pourquoi

- **Aucun réglage « laisser l'agent publier tout seul ».** Nommer son agent
  est un nom, **pas une permission** — vérifié sur la vraie base : on écrit
  `agent_nom` et `verifie = true` dans le même ordre, le nom passe et le
  badge reste `false`.
- **Aucune table nouvelle, aucune politique nouvelle.** Les deux colonnes
  vivent dans `professional_profiles`, dont les règles sont écrites depuis
  le premier jour. Un autre professionnel qui tente de renommer mon agent
  reçoit `[]` — zéro ligne modifiée, vérifié par le chemin de
  l'application.
- **Le nom est PUBLIC, et c'est assumé.** Une règle RLS filtre des LIGNES,
  jamais des COLONNES (section 18) : le rendre privé demanderait des droits
  de colonne, donc de casser `select *` pour tous les rôles — pour protéger
  le petit nom qu'un maçon donne à son outil. **Aucun écran d'Opus
  n'affiche le nom de l'agent de quelqu'un d'autre.** Le jour où l'agent
  portera des données de chantier, ce ne sera plus la même question — mais
  ce ne sera plus la même colonne non plus.

#### Le déclencheur est à part, et c'était un piège

`tient_le_profil_pro()` (section 17.3) fait déjà ce nettoyage pour le
téléphone et l'e-mail professionnel, et la règle du projet est « une règle
ne s'écrit qu'à UN endroit ». Y ajouter `new.agent_nom` était le premier
réflexe. **C'est un piège, et il ne se serait pas vu.**

> **Un corps plpgsql n'est PAS analysé à la création, il l'est à
> l'exécution.** La fonction de la section 17.3 nommerait une colonne née
> 4 700 lignes plus bas, et le bloc `do` de la section 21 — qui remplace
> les anciens noms de métier — exécute un vrai
> `update public.professional_profiles` ENTRE les deux. Sur une base neuve
> il ne touche aucune ligne : le schéma rejoué deux fois ne dirait RIEN.
> Sur une base qui a des lignes à corriger, il casserait.

C'est le défaut du matin même, section 37 : « l'erreur vivait dans un
chemin que rien n'empruntait ». Le déclencheur vit donc avec ses colonnes,
comme `tient_le_recit()` vit avec le récit. Deux déclencheurs sur la même
table ne sont pas deux écritures de la même règle : ils gardent des
colonnes disjointes.

#### Le compteur ne redescend JAMAIS

`greatest`, comme le compteur de vues de la section 35. « On s'arrête après
trois refus » n'est tenu que si rien ne peut remettre le compteur à zéro :
une version plus ancienne de l'application qui renvoie la fiche entière
avec un `0`, un enregistrement de profil qui ne connaît pas cette colonne,
une faute de frappe. Vérifié par le chemin de l'application : on envoie
`agent_propositions = 0`, la base répond **1**.

Et l'échappatoire habituelle reste ouverte : `auth.uid()` vide — l'éditeur
SQL — peut remettre à zéro. Même procédé que `tient_le_profil_pro()` et
`tient_les_metiers()`.

#### La fenêtre se tait, le réglage reste

C'est le point qu'il ne faut pas perdre en relisant : après trois refus, on
ne propose plus **jamais**. Sans une autre porte, la proposition serait
devenue une porte fermée — un artisan qui a touché « Plus tard » trois fois
ne pourrait plus nommer son agent du tout. D'où la rangée **« Mon agent »**
dans Confidentialité et sécurité, qui affiche son nom et ouvre la même
fenêtre, pour toujours.

Et fermer la fenêtre par le voile ou la croix **compte comme un refus** :
une sortie qui ne le compte pas la fait revenir à chaque démarrage, et
annule toute la section en silence.

#### Trois détails qui ne sont pas cosmétiques

1. **Le nom par défaut est en minuscules.** Tous les textes le placent au
   MILIEU d'une phrase — « Faites-le raconter par votre agent » / « …par
   Léon ». Un repli écrit « Votre agent » donnerait « par Votre agent ».
   Une seule valeur, dans `src/lib/agent.js`, et le contrôle refuse qu'on
   la réécrive ailleurs.
2. **L'en-tête dit la vérité.** À la première ouverture, « il est prêt à
   travailler pour vous » ; quand elle revient, « il vient de travailler
   pour vous ». Écrire le second à la première ouverture serait un travail
   annoncé qui n'a pas eu lieu.
3. **Trois noms suggérés**, et le contrôle vérifie qu'ils passent leur
   propre validation : une puce qui propose un nom que le bouton refuserait
   est le pire des défauts.

#### ET UN TROU TROUVÉ EN PASSANT : l'export RGPD ne contenait pas le journal

En vérifiant `mes_donnees()` sur la vraie base pour voir si le nom de
l'agent y entrait — il y entre, puisque l'export rend la ligne entière —,
la clé `journal_ia` **était absente**. Relevé : `a_le_journal = false`.

La migration du lot H avait emporté la table, ses politiques et
`enregistrer_appel_ia()`, **mais pas `mes_donnees()`**. L'export de
l'article 15 était donc incomplet depuis la veille au soir, sans la moindre
erreur : la clé manquait, c'est tout.

> **Une section qui ajoute une table ajoute sa ligne à `mes_donnees()` —
> et la MIGRATION doit emporter la fonction, pas seulement la table.**
> C'est le défaut que ce document traque depuis six commits tournant contre
> une base qui ignorait `metiers` : `schema.sql` en avance sur la base.
> Il s'est présenté ici dans sa forme la plus discrète, parce qu'un export
> incomplet ressemble trait pour trait à un export fait.

Et c'est pour cela qu'une COLONNE ne pose pas le même problème : `agent_nom`
est arrivé tout seul dans l'export, par `to_jsonb(p)`. C'est exactement
pourquoi cette fonction rend des lignes et pas des listes de colonnes.
Corrigé et vérifié le jour même.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un PostgreSQL 16 neuf, les douze cas
de `supabase/essais-section-40.sql`, les 40 contrôles, `npx expo export
--platform ios`. Le contrôle a été éprouvé **en cassant ce qu'il
surveille** : **trente-et-un défauts remis à la main, les trente-et-un
refusés** — dont « on n'arrête jamais d'insister », « on se tait dès le
premier refus », « le compteur peut redescendre », « fermer la fenêtre ne
compte pas », « le signal part avant la réussite » et « la fenêtre recouvre
le travail qu'elle annonce ».

Puis au navigateur en démonstration, et surtout **sur la VRAIE base**
(migration appliquée par le connecteur), avec trois comptes professionnels
jetables supprimés dans la même session (0 restant, base revenue à
13 comptes / 7 fiches / 20 publications / 2 chantiers / 5 lignes de
journal) :

| | relevé |
|---|---|
| la fenêtre à la première connexion | **ouverte**, « il est prêt à travailler » |
| les puces | **54 × 44** ; le champ et les deux boutons, **358 × 44** |
| une puce touchée | le champ se remplit |
| le nom « 12 » | refusé, « un nom contient au moins une lettre » |
| « Plus tard » | la fenêtre se ferme, **`agent_propositions = 1` en base** |
| quatre onglets parcourus | **toujours fermée** |
| l'agent améliore un texte | `POST /functions/v1/ai 200` |
| …pendant qu'on lit le résultat | **elle attend** |
| …une fois l'écran quitté | **elle s'ouvre**, « il vient de travailler » |
| on le nomme | `PATCH /rest/v1/professional_profiles 200`, bandeau |
| « Mon agent » | **358 × 52**, affiche « Margot », rouvre la fenêtre |
| le réglage | **sans** « Plus tard » — il n'y a rien à refuser |
| on renvoie `agent_propositions = 0` | la base répond **1** |
| un nom de 38 caractères | **23514** |
| un nom fait de blancs | **`null`** |
| `agent_nom` + `verifie = true` | nom posé, **badge toujours `false`** |
| un AUTRE pro tente de le renommer | **`[]`**, le nom ne bouge pas |
| l'export RGPD | `agent_nom`, `agent_propositions`, et le journal |
| la page du chantier | « Faites-le raconter par Léon » |

**Ce qui n'a PAS été vérifié** : rien de tout ça sur un vrai iPhone — en
particulier le clavier qui s'ouvre sous le champ de la feuille, qui n'existe
pas dans ce navigateur. Et **aucun artisan réel n'a encore nommé son
agent** : la vraie base compte 7 fiches et 0 nom.

#### « Il faut qu'il s'en rende compte » — ce que l'agent sait faire

Demandé par le propriétaire le soir même, après avoir essayé la page :

> « la page marche très bien. Quand on avancera sur les différentes actions
> que pourra faire l'agent il faudra ajouter sur cette page pour que la
> personne qui voit cette page comprenne à quoi cet agent va lui servir. Ça
> va être son plus fidèle assistant et il faut qu'il s'en rende compte. »

Il demandait une addition **pour plus tard**. Elle a été faite tout de
suite, et pour deux raisons que le relevé a données :

> **Des cinq actions qui marchent aujourd'hui, QUATRE ne sont annoncées
> nulle part.** Elles existent, elles sont payées à chaque appel, et rien
> dans Opus ne dit qu'elles existent. Ce n'est pas « il manquera quelque
> chose demain » : il manque déjà.

Et surtout : **« quand on avancera » est exactement ce qu'on oublie.** Une
note dans `docs/A-FAIRE.md` se lit un jour sur trois. Ce qui tient, dans ce
projet, c'est un contrôle qui rougit.

##### Chaque action porte QUATRE champs, et les quatre sont obligatoires

`ACTIONS_IA` (`src/lib/journal-ia.js`) ne porte plus deux champs mais
quatre : `label`, `detail` (au PASSÉ — c'est une ligne de journal), `sait`
(au PRÉSENT — c'est une capacité) et **`ou`**.

> **Le dernier est celui qui change tout.** Un artisan ne lit pas un mode
> d'emploi. Lui dire « il résume les avis » sans dire OÙ, c'est une
> fonctionnalité qu'il ne trouvera jamais. « Depuis : la fiche d'un
> artisan », si.
>
> Et `npm run verifier-agent` **refuse une action à qui il manque un
> champ**. Le jour où l'agent apprend à rédiger un devis, sa ligne sur
> cette page s'écrit DANS LE MÊME LOT — on ne peut pas l'oublier. C'est la
> mécanique de « toute section qui ajoute une table ajoute sa ligne à
> `mes_donnees()` », appliquée à l'écran.

Éprouvé en cassant ce qu'il surveille : une sixième action ajoutée **sans**
sa ligne est refusée.

##### La liste est DÉRIVÉE, jamais recopiée

`savoirFaireAgent()` rend le catalogue tel quel, et l'écran le parcourt.
Écrite à la main dans le JSX, elle ne suivrait pas la prochaine action — et
ce serait pire qu'ailleurs : la seconde liste promettrait des choses que la
première ne fait pas. C'est la leçon des voyants du 04/10, avec un enjeu de
plus.

##### UNE phrase sur l'avenir, et pas un menu

Le propriétaire veut qu'on comprenne que ce sera « son plus fidèle
assistant ». La tentation est une liste « bientôt : devis, factures,
planning ».

> **Une liste de fonctionnalités à venir est le « bouton §18 » en pire** :
> un menu de promesses que rien ne tient, et qui vieillit mal. Une phrase
> dit la direction sans promettre de date, et elle est vraie — l'ordre des
> modules est arrêté dans `docs/A-FAIRE.md`.

Le contrôle tient les deux bouts : `AGENT_PLUS_TARD` doit être **une seule
phrase**, et **ne contenir aucune date** (« bientôt », « 2027 », « ce
mois-ci » sont refusés).

##### Et on l'appelle par son NOM

« Ce que **Margot** sait faire aujourd'hui — et où le lui demander. » Puis,
deux paragraphes plus bas : « Chaque fois que **Margot** travaille pour
vous… ». Le second a été corrigé **sur la capture** : il disait encore
« l'assistant », à quinze lignes du premier.

> **Nommer son agent et ne jamais l'appeler par son nom, c'est un réglage
> qui ne sert à rien.** Le contrôle tient les deux endroits.

##### Vérifié, et comment

Les 40 contrôles (dont 11 nouveaux dans `verifier-agent`),
`npx expo export --platform ios`. Le contrôle a été éprouvé **en cassant ce
qu'il surveille** : **onze défauts remis à la main, les onze refusés** —
dont « une action nouvelle sans sa ligne », « la liste recopiée dans le
JSX », « l'avenir devient un menu », « une date est promise » et « le
journal redit l'assistant ».

Au navigateur, en démonstration, sur la page réelle : les **cinq** capacités
s'affichent avec leur « Depuis : … », l'en-tête porte le nom de l'agent, la
phrase sur l'avenir est là, et aucune date n'est annoncée.

**Ce qui n'a PAS été vérifié** : la page sur un vrai iPhone. Et c'est
toujours une page de RÉGLAGES — « Confidentialité et sécurité → Mon agent ».
Le jour où l'agent aura son tableau de bord (§12), c'est là que cette liste
devra vivre ; aujourd'hui, la poser ailleurs serait créer un écran pour
cinq lignes.

### Les portes de la base — un déclencheur n'est appelable par personne (11/10/2026)

Section 43 de `schema.sql`, `supabase/essais-section-43.sql`,
`npm run verifier-portes`.

Relevé par les **alertes de sécurité de Supabase** sur la vraie base, en
ouvrant la session : **huit fonctions `security definer` joignables par
`/rest/v1/rpc/<nom>` SANS ÊTRE CONNECTÉ.** Sept sont des déclencheurs, la
huitième — `recalcule_chantier(uuid)` — n'est appelée que par l'un d'eux.

#### Ce document mettait en garde contre exactement ce geste

Et c'est pour ça qu'il fallait mesurer avant d'y toucher. La section sur la
modération dit, depuis l'incident `horaires_valides` du 30/09 :

> « Toute fonction appelée par une policy ou une contrainte reste exécutable
> par `authenticated`. » — une contrainte `check` s'exécute avec les droits
> de CELUI QUI ÉCRIT, et plus aucun horaire ne s'enregistrait.

**Un déclencheur n'est pas une contrainte.** Mesuré sur PostgreSQL 16 le jour
même, les deux cas côte à côte dans le même fichier :

| droit `execute` retiré à tout le monde | résultat |
|---|---|
| fonction de **DÉCLENCHEUR** | **l'écriture passe** — `INSERT 0 1`, le champ est rogné, le drapeau posé |
| fonction d'une **CONTRAINTE `check`** | **`permission denied for function`** |

> **Le droit d'une fonction de déclencheur est vérifié à la CRÉATION du
> déclencheur, pas à chaque écriture.** PostgreSQL refuse d'ailleurs
> d'appeler une fonction qui rend `trigger` autrement que par un
> déclencheur : lui laisser `execute`, c'est une porte qui ne sert à
> personne.

#### Un balayage, pas huit lignes

Huit `revoke` écrits à la main seraient justes aujourd'hui et faux au
prochain lot : la section suivante posera ses déclencheurs, et personne ne
reviendra ici. Le balayage prend **tout ce qui rend `trigger`** — il couvre
donc ce qui n'est pas encore écrit.

> **Et il est le DERNIER bloc du fichier**, parce qu'il ne voit que les
> déclencheurs déjà créés. Une section ajoutée demain s'insère avant
> l'export RGPD, donc avant lui. `verifier-portes` refuse qu'on inverse
> l'ordre, et refuse qu'un `create trigger` apparaisse derrière.

#### MON CONTRÔLE A ACCUSÉ DU CODE JUSTE — et c'est la leçon du lot

Le premier jet exigeait un `grant execute … to authenticated` écrit en
toutes lettres pour chaque fonction gardienne. Il en a refusé **quatre**, et
les quatre allaient parfaitement bien :

- `est_masque` est accordée dans une **boucle** (section 13.8), par
  `execute format('grant execute on function %s …', f)` ;
- `metiers_connus` l'est sur **deux lignes**, et le motif exigeait « to »
  collé à la parenthèse ;
- `est_un_pro` et `horaires_valides` ne sont accordées **nulle part** :
  elles sont `security invoker` et vivent sur le droit que PostgreSQL donne
  à PUBLIC d'office. C'est l'état normal, pas un oubli.

Vérifié sur le bac à sable — schéma rejoué deux fois — **et** sur la vraie
base : les deux donnent exactement les mêmes droits.

> **Un contrôle qui exige une SYNTAXE au lieu d'une PROPRIÉTÉ accuse du code
> juste.** C'est la faute du `insert into … \);` du 05/10, dans l'autre
> sens : là il passait au vert sans rien trouver, ici il refusait ce qu'il
> ne savait pas lire.

Il vise désormais le vrai invariant — **rien ne doit RETIRER ce droit** —, y
compris par la boucle de la section 13.8, qui révoque en masse. Et la vraie
preuve a changé de fichier : `verifier-portes` lit le texte, `essais-section-43.sql`
interroge `has_function_privilege` sur une base rejouée. Un fichier `node`
ne sait pas interroger PostgreSQL ; il ne faut pas lui demander de prouver
ce qu'il ne peut que supposer.

#### Refermer une porte sans essayer d'entrer, c'est murer la pièce

L'essai qui compte n'est pas le relevé des droits, c'est **l'écriture**.
`posts` porte quatre déclencheurs — `pose_le_lieu_du_post`,
`tient_le_chantier_du_post`, `maj_chantier`, `maj_vues_count`. Si le droit
retiré les empêchait de tourner, cela ne se verrait QUE là.

Et le même essai est refait **avec un jeton** (`set local role` +
`request.jwt.claim.sub`, chacun dans son propre ordre) : c'est la leçon du
lot E, où un essai sans jeton passait au vert sans éprouver un verrou qui
dépend de `auth.uid()`.

#### Et le contrôle m'a eu, pour la NEUVIÈME fois, par un commentaire

Éprouvé en cassant ce qu'il surveille : **dix défauts remis à la main, et un
est passé.** Commenter l'écriture d'essai — `-- insert into public.posts` —
le laissait au vert, puisque le texte y était toujours. C'était la première
fois que le commentaire trompeur était du SQL d'essai et non du code ; le
contrôle retire désormais les commentaires de ce fichier-là aussi. Après
correction : les dix refusés.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois** sur un PostgreSQL 16 neuf, les sept cas de
`supabase/essais-section-43.sql`, les 41 contrôles, `npx expo export
--platform ios`. Puis la migration appliquée sur la VRAIE base :

| | avant | après |
|---|---|---|
| fonctions de déclencheur | 24 | 24 |
| …dont **appelables** par `anon` ou `authenticated` | 24 | **0** |
| `recalcule_chantier` appelable par `anon` | oui | **non** |
| gardiennes qui gardent leur droit | 6 | **6** |
| alerte Supabase « appelable **sans compte** » | **8** | **0 — la catégorie a disparu** |
| alerte « appelable par un connecté » | 25 | **17** |

Les 17 qui restent sont voulues et nommées : les onze `admin_*` (qui
vérifient `est_admin()` à l'intérieur), `est_admin`, `est_masque`,
`mon_compte`, `mes_demandes_recues`, `preparer_suppression_compte`,
`marquer_lus`, `a_deja_une_reponse` — toutes appelées pour de vrai par
l'application ou par une règle.

**Ce qui n'a PAS été vérifié** : l'application sur un iPhone après ce
changement. Rien de visible ne bouge — aucune de ces fonctions n'était
appelée par l'application —, mais ça se dit plutôt que ça se suppose.

### La quatrième porte de `for all` : sortir d'un compte (11/10/2026)

Section 18.2 de `schema.sql`, `supabase/essais-suppression-compte.sql`,
`npm run verifier-portes`.

Trouvé en préparant le module Clients, en relisant à qui appartient quoi.
La règle d'écriture de `public.users` est « chacun sa ligne », toutes
opérations confondues :

```sql
create policy "ecriture mon user" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);
```

**`for all`, c'est QUATRE portes, et la quatrième est `delete`.** Relevé sur
la vraie base : `has_table_privilege('authenticated', 'public.users',
'delete')` répondait `true`, et pour `anon` aussi. Donc ceci partait, et ça
marchait :

```
DELETE /rest/v1/users?id=eq.<moi>      →  DELETE 1, aucune erreur
```

C'est la **troisième fois** que `for all` ouvre une porte dans ce projet,
après le badge à l'`INSERT` et la fiche pro supprimable du 05/10. Une règle
qui ne couvre qu'un verbe SQL ne couvre rien.

#### Ma première version de ce commentaire disait FAUX

Elle accusait le raccourci de détruire les avis reçus. **Il les détruit — et
le vrai chemin aussi, parce que c'est voulu** (« ils portaient sur une
entreprise qui n'existe plus », section 13.6). J'avais écrit la conséquence
avant de l'avoir mesurée.

Les deux chemins comparés sur le MÊME jeu d'essai, PostgreSQL 16 :

| | `DELETE /rest/v1/users` | `preparer_suppression_compte()` |
|---|---|---|
| ligne `public.users` | partie | partie |
| fiche pro, et ses 11 cascades | parties | parties |
| avis qu'il a ÉCRITS sur d'autres | gardés | gardés |
| …et leur `auteur_supprime` | **false** | **true** |
| fichiers du stockage | **restent** | retirés |
| `auth.users` | **reste** | retirée |

Trois conséquences, et la troisième est la pire :

1. **`auteur_supprime` n'est jamais posé.** `api.js:813` lit ce drapeau pour
   écrire « Compte supprimé » sous un avis dont l'auteur est parti ; sans
   lui, l'avis s'affiche sous un « Client » anonyme, comme si quelqu'un
   l'avait écrit hier.
2. **Les fichiers restent dans le stockage, pour toujours** — photo,
   bannière, publications, pièces jointes, et le **Kbis** et l'**attestation
   d'assurance**, les deux documents les plus personnels du projet. Seule la
   fonction Edge `compte` sait les retirer (il faut la clé de service et du
   HTTP, PostgreSQL ne peut pas), et elle n'est jamais appelée. Pire : la
   ligne qui disait à qui ils appartenaient vient de disparaître.
3. **`auth.users` reste, donc le compte existe encore et ne peut plus rien
   faire.** La session est valable, l'application le croit professionnel
   (son type est dans les métadonnées), et chaque écriture échoue sur une
   clé étrangère. **Et il ne se répare pas** : `ensureProProfile()`, appelée
   à chaque ouverture depuis le 05/10, reçoit `23503 — Key is not present in
   table "users"`. Le compte ne peut donc ni servir, ni se réparer, ni se
   supprimer par le chemin de l'application. Il n'y a plus de sortie.

C'est le « compte à moitié » de la section 31 en pire, et fabriqué par un
seul appel que n'importe qui peut écrire — la clé publiable est dans le
paquet de l'application, lisible sur n'importe quel téléphone.

#### Un droit de TABLE, parce qu'une politique ne sait pas distinguer

`revoke delete on public.users from anon, authenticated;` — comme les
colonnes de la section 18.1. Refaire la politique en deux morceaux
demanderait un `drop policy`, que le connecteur Supabase refuse.

> **Supprimer son compte reste un DROIT, et le `revoke` ne le touche pas :**
> `preparer_suppression_compte()` est `security definer`, donc elle
> s'exécute avec les droits de son propriétaire. La cascade depuis
> `auth.users` — la fonction Edge, et Supabase → Authentication → Users —
> passe pour la même raison. **Ce qui disparaît, c'est le raccourci.**

Et on retire aussi à `anon` : la politique l'arrête déjà (`auth.uid()` est
vide, aucune ligne ne correspond), mais un droit qui n'a aucune raison
d'exister ne doit pas attendre qu'une politique le rattrape. C'est la leçon
des huit portes du matin même.

#### Un essai qui échoue pour la MAUVAISE raison

Le cas 5 — « le compte laissé derrière est irréparable » — a d'abord échoué
sur `null value in column "metier"`, puis sur `"ville"`. Deux contraintes
`not null` traversées avant d'atteindre la clé étrangère : l'essai montrait
un refus, donc il avait l'air juste, **et il n'éprouvait pas ce qu'il
annonçait**. C'est le symétrique du défaut habituel de ce projet (passer au
vert sans rien prouver), et il se corrige pareil : on nomme toutes les
colonnes obligatoires pour que seul `23503` puisse sortir.

#### Et mon contrôle a refait la faute du matin

`verifier-portes` exigeait `has_table_privilege('<rôle>','public.users',
'delete')` écrit avec le rôle **en clair**. L'essai, lui, le lit depuis une
colonne (`r.rolname`), ce qui est mieux — il couvre les deux rôles d'un
coup. **Un contrôle qui exige une SYNTAXE au lieu d'une PROPRIÉTÉ accuse du
code juste**, et c'est écrit dix lignes plus haut dans le même fichier.

#### Vérifié, et comment

Le trou d'abord **prouvé** sur PostgreSQL 16 (`DELETE 1`, fiche partie, rien
d'anonymisé), puis les deux chemins comparés sur le même jeu. `schema.sql`
rejoué **deux fois** sur une base neuve, les sept cas de
`essais-suppression-compte.sql`, les 41 contrôles, `npx expo export
--platform ios`. Le contrôle éprouvé **en cassant ce qu'il surveille** :
**dix défauts remis à la main, les dix refusés** — dont « on retire le
revoke », « un `grant all` plus bas rouvre tout », « la fonction passe en
`security invoker` », « l'application supprime `users` elle-même » et
« plus personne ne lit `auteur_supprime` ».

Puis sur la VRAIE base, migration appliquée, **par le chemin de
l'application** (clé publiable + jeton d'un compte jetable supprimé dans la
même session) :

| | résultat |
|---|---|
| `delete` sur `users` pour `anon` et `authenticated` | **false** |
| le nom reste lisible, l'e-mail non | ✔ |
| `update (telephone)` | toujours accordé |
| `DELETE /rest/v1/users` sans compte | **401 · 42501** |
| …avec un VRAI jeton, sur SA ligne | **403 · 42501** |
| la fiche juste après | **toujours là** |
| `rpc/preparer_suppression_compte` | **200** |
| `/functions/v1/compte {"action":"supprimer"}` | **200** |
| après | 0 ligne, 0 en `auth.users`, base revenue à 13 / 7 / 20 |

**Ce qui n'a PAS été vérifié** : rien ne change à l'écran — aucun code de
`src/` ne supprimait `users` —, mais ça se dit plutôt que ça se suppose.

### Le carnet de clients — la première table du logiciel de gestion (11/10/2026)

Section 41 de `schema.sql`, `src/lib/clients.js`,
`src/screens/ClientsScreen.js`, `src/components/FicheClient.js`,
`npm run verifier-clients`. Module 1 du cahier des charges (§5), et
`docs/A-FAIRE.md` dit pourquoi il passe en premier : « rien ne tient sans
lui — un devis s'adresse à quelqu'un, une facture aussi ».

#### Ce qui change de TOUT ce qui précède

Jusqu'ici, Opus ne contenait que des données que ses utilisateurs y avaient
mises **sur eux-mêmes**. Une publication, une annonce, un avis, un
chantier : c'est toujours quelqu'un qui parle de lui.

> **Un carnet de clients, non.** « Mme Martin, 4 rue des Lilas à Charleval,
> 06 12 34 56 78 » est une donnée personnelle sur une personne qui n'a pas
> de compte, qui n'a rien accepté, et qui ne saura jamais que cette ligne
> existe.

Trois conséquences, et aucune n'est négociable :

1. **Le carnet est PRIVÉ, et il n'a AUCUNE politique pour `anon`.** C'est le
   modèle de la section 30 (les demandes des particuliers), pas celui de la
   section 36 (les chantiers, qui sont une vitrine). Le motif à deux
   politiques de la section 18 existe parce qu'une policy qui appelle une
   fonction interdite à l'appelant ÉCHOUE au lieu de filtrer ; il n'a rien
   à faire ici, où un visiteur doit lire ZÉRO.
2. **Rien de ce carnet ne s'affiche ailleurs dans Opus** — ni sur la fiche
   publique, ni dans le fil, ni dans une notification. C'est la leçon du
   titre de chantier (section 36.2) : « Chantier Martin » publiait un nom de
   famille sans le vouloir. Le contrôle relit `rowToPro` et
   `notifications.js` pour s'en assurer.
3. **L'artisan en est le responsable de traitement, et Opus son
   sous-traitant** (RGPD, art. 28). C'est un renversement par rapport à tout
   le reste du projet — voir plus bas, c'est le point le plus lourd du lot.

#### Et `anon` n'a même plus de droit de TABLE

La RLS suffirait : pas de politique, donc zéro ligne. Mais Supabase accorde
les quatre droits d'office, et la section 18.2 — écrite le matin même —
venait de montrer ce que coûte un droit qu'on laisse en comptant sur une
politique pour le rattraper. D'où `revoke all on public.clients from anon`.

> **Ce que ça protège n'est pas théorique** : la règle de lecture des
> demandes était `to anon using (true)` jusqu'au 04/10. Le jour où
> quelqu'un ajoutera une politique `anon` sur ce carnet « pour afficher
> quelque chose », le droit de table absent sera la seconde ligne de
> défense. Vérifié sur la vraie base, par le chemin de l'application : un
> visiteur reçoit **401 · 42501**, pas une liste vide.

#### Ce que cette section n'écrit PAS, et pourquoi

**Aucun lien vers un compte Opus** (pas de `compte_id`). La tentation était
forte : un client qui a demandé un devis EST sur Opus, et la colonne
servirait un jour à lui envoyer son devis par la messagerie. Mais elle ne
servirait que ce jour-là.

> C'est le « bouton §18 » retiré avant d'être livré (section 27.4), et la
> règle de la section 38 : **chaque chose naît avec le lot qui s'en sert.**
> Une colonne que personne ne lit ne peut pas être vérifiée — elle peut
> pointer n'importe où, et personne ne le saura avant le jour où l'on s'en
> servira, c'est-à-dire trop tard.

Ce qui remplace ce lien, et qui est le vrai besoin : **« Ajouter à mes
clients » sur une demande reçue**, qui pré-remplit le formulaire avec le
nom, le numéro et la commune que le client a lui-même écrits. Le relevé
disait 8 demandes reçues dont 6 traitées : le carnet a de quoi se remplir
dès le premier jour, sans qu'on invente un lien que rien ne vérifie. Le
bouton n'apparaît qu'à partir de l'ACCEPTATION — avant, on ne sait pas si
ce sera un client.

**Un seul champ `nom`**, et pas « nom » + « prénom ». Deux champs laissent
choisir où écrire quoi, donc ils se remplissent à l'envers une fois sur
trois — et sur une facture, « Jean » dans la case nom ne se corrige plus.

**Une seule adresse**, celle de FACTURATION. L'adresse du chantier
appartiendra au chantier de gestion (§12) ; en poser une seconde ici, c'est
deviner laquelle des deux on écrit.

#### `for all` pour la QUATRIÈME fois — et ici c'est juste

Ce fichier porte trois cicatrices de `for all` : le badge décerné à
l'`INSERT`, la fiche pro supprimable qui emportait ses avis (section 31), et
la ligne `public.users` supprimable qui sautait tout le ménage de compte
(section 18.2, le matin même). Les trois fois, la porte donnait sur quelque
chose qui **engageait quelqu'un d'autre**.

> **Ici, non — et c'est vérifié, pas supposé.** Supprimer une ligne de son
> carnet ne détruit rien qui appartienne à un tiers : c'est au contraire la
> façon dont le droit à l'effacement s'exerce. Une faute de frappe doit
> pouvoir partir, et un client qui demande à être oublié doit pouvoir
> l'être. La règle « ce qui concerne des TIERS s'anonymise, il ne se
> supprime pas » vise ce qui ENGAGE un tiers — un avis, un commentaire —,
> pas une fiche d'adresses privée.

Le jour où une facture pointera ce client, c'est SA clé étrangère qui
refusera la suppression, et ce sera la bonne raison : la loi impose de
conserver dix ans une facture avec l'identité de son destinataire.

#### TOUTES les contraintes se terminent par `_check`

Ce n'est pas une coquetterie, et ça a été vérifié en relisant
`src/lib/erreurs.js` AVANT d'écrire la table :

```js
const nom = (brut.match(/"([a-z0-9_]+_check)"/i) || [])[1];
```

> **Une contrainte nommée autrement rend un message anonyme — « la base a
> refusé cette valeur » — assorti d'une piste FAUSSE :** « le plus souvent,
> `schema.sql` n'a pas été rejoué ». Pour ce qui n'est qu'une faute de
> frappe dans un SIRET.

Vérifié sur la vraie base : un SIRET de trois chiffres rend
`400 · 23514 · client_siret_check`. Et l'écran, lui, refuse AVANT d'envoyer,
avec un message qui COMPTE les chiffres saisis — « il en faut 14 » sans dire
combien on en a mis oblige à les compter soi-même.

#### Le doublon s'AVERTIT, il ne se refuse pas

La section 36.2 pose un index unique sur le titre d'un chantier. Ici, aucun,
et c'est le contraire exprès :

> **Un titre de chantier est une ÉTIQUETTE qu'on retape** — trois « Toiture
> Charleval » sont trois fois le même dossier. **Un nom de client est une
> IDENTITÉ**, et dans un village il y a souvent trois Martin. Refuser le
> second, c'est refuser un vrai client au profit d'une base propre.

L'écran montre donc la fiche existante et laisse décider. Vérifié :
« mme  MARTIN » reconnaît « Mme Martin » (accents, casse et espaces mis à
part), nomme sa ville, et le bouton reste actif.

#### Le SIRET d'un particulier se VIDE, des deux côtés

Un particulier n'a pas de SIRET. Le déclencheur `tient_le_client()` le vide,
`validerClient()` aussi, et **l'écran fait disparaître le champ** quand on
bascule le type.

> Les trois sont nécessaires. Sans l'écran, on enregistrerait en croyant
> avoir gardé le numéro et on le retrouverait vide au rechargement sans
> comprendre pourquoi. C'est la règle du calendrier du 04/10 : on supprime
> le défaut au lieu de le contrôler.

#### Le formulaire est PLEIN ÉCRAN, et c'est le défaut du 04/10 évité

Neuf champs ne tiennent pas dans une feuille du bas — et surtout, une
feuille transparente collée au bas de l'écran se fait recouvrir par le
clavier de l'iPhone, champ ET croix de fermeture. C'est le « je suis
bloqué » du 04/10. Ici la croix est en HAUT : le clavier monte du bas, il ne
peut enfermer personne. Exactement ce que `verifier-feuilles` avait constaté
à propos de `SelecteurMetiers`, en lui donnant tort.

#### LE POINT LE PLUS LOURD : qui est responsable de ces données

`src/data/legal.js` déclarait l'auteur de l'application **seul** responsable
du traitement, et le mot « sous-traitant » n'y figurait nulle part. Avec un
carnet de clients, c'est faux pour ces lignes-là.

**On ne peut pas écrire ce contrat, et il ne faut pas essayer** :
l'article 28.3 du RGPD énumère huit obligations à faire figurer dans un acte
juridique, et une clause inventée engagerait la responsabilité du
propriétaire. Ce document est formel depuis le 29/09 : « ne jamais lui
écrire des mentions légales de société ».

Ce qui a été fait, et qui est honnête : une section de la politique de
confidentialité **dit le droit, dit ce qui manque, et dit ce qui est vrai
techniquement** — le carnet n'est lisible que de son auteur, il s'exporte,
il part avec le compte, et les seize essais le prouvent.

##### Et mon garde-fou PASSAIT AU VERT

Le premier jet de `verifier-legal` vérifiait que les mots « contrat de
sous-traitance » figuraient dans les textes. Essayé en passant `STATUT` à
`micro` : **il est passé au vert**, parce que le texte que je venais
d'écrire les contenait.

> **Un contrôle satisfait par sa propre documentation ne garde rien.** Une
> phrase n'est pas un contrat. Seul un humain sait si l'acte existe, et
> c'est donc un DRAPEAU qu'il faut vérifier —
> `EDITEUR.contratSousTraitance`, sur le modèle de
> `identiteRemiseALHebergeur` qui existait déjà pour la même raison. Le
> texte affiché est branché sur ce drapeau, pas sur le statut : sinon il
> annonce un contrat qui n'existe pas.

Éprouvé : avec `STATUT = 'micro'`, les deux vérifications refusent.
**`STATUT = 'essai'` ne protège rien en soi** — le premier vrai client
inscrit dans un carnet est une personne qui n'a rien accepté. Ce qui
protège aujourd'hui, c'est qu'il n'y a qu'un artisan sur cette base et que
c'est l'éditeur : il n'y a pas encore deux parties à lier par un contrat.

#### J'AI INVENTÉ UNE DÉPENDANCE — et l'export iOS a rendu ZÉRO

Le défaut le plus instructif du lot. J'ai importé `lucide-react-native`
dans les deux nouveaux fichiers. **Ce paquet n'est pas une dépendance
d'Opus** : le projet a son propre `src/components/icons.js`, dont l'en-tête
dit « équivalents React Native des icônes lucide-react du prototype — on
garde exactement les mêmes noms ». Je ne l'avais pas lu.

Et rien ne l'a attrapé :

| | |
|---|---|
| le linter | se tait — il ne résout pas les modules |
| les 42 contrôles | passaient |
| **`npx expo export --platform ios`** | **code de sortie 0**, en affichant pourtant sa pile d'import |

> **Le troisième est le plus grave.** Ce projet lit les codes de sortie
> depuis le lot 8 précisément pour ne pas se fier au texte, et là c'est le
> code de sortie qui mentait. Seul `npx expo start --web` l'a dit — en
> répondant **500** sur le paquet, c'est-à-dire un écran blanc.
>
> **La parade est mécanique : `npm run verifier-imports` refuse désormais
> tout paquet importé dans `src/` qui ne figure pas dans `package.json`.**
> Ça tourne en une seconde et ça n'attend pas qu'on pense à lancer
> l'application.
>
> **Et pour l'export : lire sa SORTIE, pas son code.** Il doit écrire
> « Exported », ne contenir aucune « Import stack », et produire `dist/`.
> Mesuré après correction : 1 / 0 / 16 Mo.

##### Ce nouveau contrôle est d'abord passé au vert sans rien éprouver

Son premier motif exigeait `^import … from '…';` **sur une seule ligne**.
Or un import de sept icônes s'écrit sur trois. Éprouvé en remettant le
défaut à la main : **il ne l'a pas vu.** Dixième fois dans ce projet qu'un
contrôle rend le bon résultat pour la mauvaise raison. Il vise maintenant le
`from`, quelle que soit la forme — et il attrape les deux.

#### Quatre autres défauts trouvés par les contrôles, pas à l'œil

1. **`clientCorrespond` ne trouvait pas un numéro sans ses espaces.**
   Chercher « 0612 » ne rendait rien pour « 06 12 34 56 78 ». Personne ne
   tape les espaces d'un numéro dans une recherche — et ça ne lève aucune
   erreur, la liste revient simplement vide, ce qui ressemble à un carnet
   qui ne contient pas ce qu'on cherche. Trouvé parce que
   `verifier-clients` FAIT TOURNER la fonction.
2. **Un composant créé pendant le rendu** (`const Erreur = ({ champ }) =>
   …`). Le linter l'a refusé, et il avait raison : React en fait un TYPE
   nouveau à chaque lettre tapée, donc il démonte et remonte. Une fonction
   qui rend du JSX donne le même résultat sans ce coût.
3. **Le cliquet des échelles a mordu** sur un `marginTop: 2` — hors de la
   grille de 4. 355 contre un plafond de 354.
4. **Un sabotage est passé** : mon contrôle cherchait
   `est_mon_entreprise` « quelque part dans les 300 caractères » suivant la
   politique. Remplacer la seule clause `using` par un `auth.uid()` écrit à
   la main le laissait au vert, puisque le `with check` la contenait encore.
   Il compte maintenant DANS la politique isolée, et exige deux appels et
   aucun `auth.uid()`.

#### Vérifié, et comment

`schema.sql` rejoué **deux fois sur une base PostgreSQL 16 NEUVE** — zéro
table au départ, zéro erreur aux deux passages —, les **seize** cas de
`supabase/essais-section-41.sql` (dont cinq refus attendus), les
**42 contrôles**, et `npx expo export --platform ios` dont la sortie a été
LUE. Le contrôle a été éprouvé **en cassant ce qu'il surveille** :
**vingt-et-un défauts remis à la main, les vingt-et-un refusés** après
correction du vingt-et-unième.

Puis sur la VRAIE base (migration appliquée par le connecteur, aucun ordre
commençant par `drop` — la politique est créée sous condition dans un bloc
`do`), avec **deux** comptes professionnels jetables supprimés dans la même
session :

| | relevé |
|---|---|
| colonnes · contraintes `check` · mal nommées | **14 · 10 · 0** |
| politiques | **1**, `authenticated` seulement |
| `anon` sur la table | **aucun droit** |
| le déclencheur appelable par `anon` | **non** |
| **au navigateur** : le carnet vide | « Votre carnet est vide », 1 seul `GET` |
| bouton « Nouveau » | **88 × 44** |
| le formulaire | « Nouveau client », SIRET **caché** pour un particulier |
| champ nom · bouton | **358 × 44** chacun |
| enregistrement | `POST /rest/v1/clients → 201`, bandeau |
| la carte · son bouton « Appeler » | 296 × 56 · **44 × 44** |
| **après rechargement complet** | Mme Martin est là, avec son numéro et sa ville |
| saisir un SIRET puis repasser en « Particulier » | **le champ disparaît** |
| taper « mme  MARTIN » | « Vous avez déjà un client de ce nom (Charleval) », et **ça ne refuse pas** |
| archiver | `PATCH → 200`, « Ma liste (0) · Archivés (1) » |
| **par l'API** : B lit le carnet de A | **`[]`** |
| un visiteur | **401 · 42501** |
| B écrit dans le carnet de A | **403**, RLS |
| un SIRET de 3 chiffres | **400 · 23514 · `client_siret_check`** |
| « 123 456 789 00012 » sur une entreprise | rangé **`12345678900012`** |
| «   Contact@SCI-Moulin.FR » | rangé **`contact@sci-moulin.fr`** |
| l'export RGPD | la clé `clients_de_mon_entreprise`, **2 fiches** |
| après suppression des comptes | **0 client**, base revenue à 13 / 7 / 20 / 2 |

#### Le premier VRAI client — mesuré sans être lu

Le propriétaire a enregistré un client le soir même : « j'ai créé un client
et ça fonctionne ». La vraie base en compte donc **1**, et c'est une
personne qui n'a pas de compte Opus, qui n'a rien accepté, et qui ne saura
jamais que cette ligne existe. C'est toute la prémisse de la section 41, et
ça change la façon de vérifier :

> **On interroge la FORME de la ligne, jamais son contenu.** Aucune requête
> de ce projet n'a à rendre le nom, le numéro ou l'adresse d'un client.
> `char_length(nom)`, `siret is null`, `email = lower(email)` répondent à
> toutes les questions qu'on se pose vraiment — et ne laissent rien de cette
> personne dans une conversation de travail.

Relevé ainsi, les garanties du lot tiennent sur une ligne écrite par la
vraie application, et pas par un essai :

| | relevé |
|---|---|
| le type | `particulier` |
| le nom | 17 caractères, **déjà rogné** |
| le SIRET | **`null`** — le déclencheur l'a vidé, comme pour un particulier |
| téléphone · e-mail · adresse · ville | tous les quatre présents |
| l'e-mail | **en minuscules** |
| le code postal | cinq chiffres |
| les notes | vides, donc `null` et non une chaîne blanche |
| `modifie_le` | **26 ms après** `created_at` — posé par la BASE |

#### Ce qui n'a PAS été vérifié

- **Sur quel appareil il a essayé.** Il a écrit « j'ai créé un client et ça
  fonctionne » sans le dire ; aux lots précédents il précisait « j'ai testé
  sur mon iPhone ». **Le clavier sous les neuf champs du formulaire reste
  donc à confirmer** — il n'y en a pas dans ce navigateur, et c'est la seule
  chose de ce lot qui ne se mesure pas ici. On le DEMANDE plutôt que de le
  supposer : une ligne écrite en base ne dit pas d'où elle vient.
- **La bascule Particulier / Entreprise mesure 73 × 38**, pas 44 :
  `PillToggle` atteint les 44 points par `hitSlop`, que `react-native-web`
  ignore. C'est le cas déjà relevé au lot I pour `BtnMini` — ça se touche
  bien au doigt, mais ça se dit plutôt que ça se suppose.
- **Le carnet n'en contient qu'UN.** Le jour où il y en aura soixante, la
  liste, sa recherche et l'avertissement de doublon se jugeront à nouveau.
- **Le contrat de sous-traitance n'existe pas**, et c'est le seul point du
  lot qui n'appartient pas au code. `verifier-legal` refuse une mise en
  ligne publique tant que `EDITEUR.contratSousTraitance` est à `false`.

### Le clavier recouvrait ce qu'on écrit (11/10/2026)

`src/lib/clavier.js`, `npm run verifier-feuilles`.

Deux remarques du propriétaire après avoir essayé le carnet de clients sur
son iPhone :

> « le clavier bloque un peu les champs du bas du formulaire. Petite
> remarque : j'aimerais que quand on rentre l'adresse du client ça propose
> comme les autres endroits de l'application. »

#### « Un peu » était SYSTÉMIQUE — relevé avant de toucher à quoi que ce soit

Sur tout `src/` : **dix-sept conteneurs qui défilent portent un champ de
saisie, et UN SEUL gérait le clavier** — `AuthScreen`. C'est aussi le seul
formulaire dont il ne s'est jamais plaint, alors qu'il y a créé son compte
au doigt.

Les douze autres, par gravité : le formulaire client (8 champs),
« Modifier mon profil » (**18**), la Place des pros, Publier, le SOS, les
Demandes, la fiche d'un artisan (le texte d'un avis), **Confidentialité**
(le mot de confirmation de suppression de compte, tout en bas d'une page
qu'on ne peut plus faire défiler), Mes publications, le récit d'un
chantier, l'administration, et **le fil** — où l'on écrit un commentaire.

#### Ce que la règle du 04/10 avait à moitié raison de dire

`FeuilleBas` a été écrit contre un défaut plus grave : une feuille
transparente collée au bas de l'écran se fait recouvrir par le clavier, **la
croix de fermeture comprise**. Il n'y a alors plus de sortie. Cette règle
tient toujours.

Mais `verifier-feuilles` en avait tiré une exemption, écrite noir sur
blanc : « un champ caché par le clavier dans une fenêtre plein écran, on le
fait défiler ». **Elle est fausse.**

> **On PEUT le faire défiler. RIEN ne le fait.** Vérifié dans le source de
> React Native 0.86.3 : `scrollResponderScrollNativeHandleToKeyboard`
> existe (`ScrollView.js:958`) et **n'a aucun appelant** dans toute la
> bibliothèque — `TextInput.js` ne contient ni `measureLayout`, ni
> `scrollTo`, ni `ScrollView`. Les quatre abonnements au clavier de
> `ScrollView` ne font que mémoriser la géométrie.

Le propriétaire a dit « un peu », et c'est exactement ça : ça n'enferme
pas, ça gêne à chaque fiche.

#### Et le motif éprouvé sur SON téléphone n'était pas le bon

Mon premier jet recopiait `AuthScreen` — un `KeyboardAvoidingView` — dans
une brique partagée. C'était défendable : c'est le motif qui marche chez
lui. **Le relevé du source l'a démoli avant la livraison**, et la raison
vaut d'être retenue :

> Un `KeyboardAvoidingView` réduit le cadre, donc il rend le champ du bas
> **atteignable**. Quand le formulaire tient dans ce qui reste — cinq
> champs centrés, `AuthScreen` — on ne voit pas la différence. Sur neuf
> champs, ou sur dix-huit, il ne tient pas, et le champ qui vient de
> prendre le focus reste sous le clavier. **Le motif éprouvé ne corrigeait
> pas la plainte.**

Et ma brique l'annonçait quand même : « c'est ce qui permet à React Native
d'amener le champ actif ». Rien ne l'amène. **Documenter un comportement
qu'on n'a pas est pire que l'absence de documentation.**

#### DEUX MÉCANISMES, DEUX FORMES — et on ne les cumule JAMAIS

> **Ce qui est COLLÉ au bas de l'écran doit MONTER.** Une feuille, une
> barre de saisie de conversation, un formulaire court et centré : c'est le
> travail d'un `KeyboardAvoidingView`. `FeuilleBas`, `CommentsSheet`,
> `QuoteModal`, `ConversationScreen` et `AuthScreen` sont dans ce cas et ne
> changent pas.
>
> **Ce qui DÉFILE ne monte pas : c'est son CONTENU qui remonte.** Et c'est
> `automaticallyAdjustKeyboardInsets`, posé par `src/lib/clavier.js` sur
> les dix-sept conteneurs.

Ce que la propriété native fait de plus, et qui est tout le sujet
(`RCTScrollViewComponentView.mm:187-265`) :

1. elle pose l'inset **en coordonnées absolues de fenêtre**
   (`convertPoint:toView:nil`). Il n'y a donc RIEN à régler : les 69 px de
   la barre d'onglets, un en-tête, une zone sûre, une fenêtre modale sont
   pris en compte par construction. Un `KeyboardAvoidingView` ne tombe
   juste que parce que la barre d'onglets est un frère en flux — le jour où
   un écran passera sous la barre flottante du mode vidéo, il se tromperait
   de 69 px en silence ;
2. **elle DÉFILE jusqu'au champ actif**
   (`reactUpdateResponderOffsetForScrollView:`), en visant le rectangle du
   curseur, avec la durée et la courbe du clavier ;
3. elle garde le `contentInset.bottom` que l'écran s'est posé lui-même.

**Et le cumul compte DEUX FOIS**, prouvé par l'ordre des événements : le
natif mute `contentInset` **synchronement** dans le callback UIKit ; le
`KeyboardAvoidingView` passe par un événement **asynchrone** vers
JavaScript puis un `setState`. Le natif est donc toujours premier, il pose
l'inset sur la boîte d'AVANT, et **rien ne le recalcule** — un changement
de mise en page n'émet aucune notification de clavier. Résultat : un vide
défilable de la hauteur d'un clavier sous le dernier champ, pendant toute
la saisie. `verifier-feuilles` refuse qu'un fichier porte les deux.

#### CINQ conteneurs n'avaient même pas `keyboardShouldPersistTaps`

Dont **le fil**, où le panneau de commentaires s'ouvre EN LIGNE dans la
carte (`PostCard`, et non la feuille du fil vidéo). Sans cette propriété,
le premier appui sur « Envoyer », clavier ouvert, ne fait que refermer le
clavier. On appuie, « rien ne se passe », on recommence — sur la surface
d'écriture la plus utilisée de l'application. Les quatre autres :
l'administration, Mes publications, Confidentialité, le chantier.

Les deux propriétés voyagent donc ENSEMBLE, dans un objet qu'on étale
(`{...CLAVIER}`) : il se pose aussi bien sur un `ScrollView` que sur une
`FlatList`, ce qu'un composant enveloppant ne ferait pas sans ajouter une
vue dans l'arbre du fil.

#### « Suivant » n'allait nulle part — et trois claviers ne peuvent pas l'afficher

Les huit champs du formulaire client portaient `returnKeyType="next"` et
**aucun `onSubmitEditing`** : la touche affichait « Suivant » et ne faisait
que refermer le clavier. On la touche, le clavier tombe, et il faut viser
le champ suivant — celui que le clavier cachait justement.

> **Et un clavier `number-pad` ou `phone-pad` d'iOS n'a PAS de touche
> retour.** Le SIRET, le téléphone et le code postal ne peuvent donc pas
> enchaîner, quoi qu'on écrive. Leur `returnKeyType` a été retiré plutôt
> que laissé à mentir.

Le reste enchaîne, avec `blurOnSubmit={false}` — sans lui le clavier se
referme puis se rouvre, et la page saute entre les deux. Et la lecture de
la référence vit DANS le gestionnaire : le linter a refusé
`allerA(refTelephone)` appelé au rendu, et il avait raison.

### L'adresse d'un client se propose — et le piège qui a failli casser le SOS

`src/lib/adresse.js`, `src/components/ChampVille.js`, `npm run verifier-adresse`.

#### `type="address"` avait DÉJÀ un utilisateur, et c'était l'urgence

J'ai d'abord écrit que ce mode « existait depuis le premier jour et que
personne ne s'en servait ». **C'était faux, et la vérification l'a attrapé
avant la livraison** : l'écran **SOS** l'utilise, et il envoie
`lieu.latitude` / `lieu.longitude` DIRECTEMENT à la recherche d'artisans
disponibles. Ce chemin n'appelle pas `completerLieu()` — vérifié.

Mon premier jet filtrait les communes hors de `'address'`, parce qu'une
commune n'est pas une ligne d'adresse de facturation. Posé là, il aurait
laissé quelqu'un taper sa ville **sans aucune suggestion, donc sans
coordonnées, donc sans artisan** — à minuit, une fuite d'eau, et pas la
moindre erreur à l'écran.

> **D'où un TROISIÈME mode, et non un détournement du second :**
> `municipality` (des communes), `address` (tout ce qui SITUE un lieu, pour
> le SOS), `rue` (un numéro ou une rue, rien d'autre, pour une ligne
> d'adresse). Deux besoins qui se ressemblent ne sont pas le même besoin.

#### LA BASE ADRESSE NE RÉPOND JAMAIS « INTROUVABLE » — elle rend une AUTRE adresse

C'est le piège qui décide de toute la conception, et il est mesuré. Il
n'existe aucune « rue des Lilas » à Charleval. `q=4 rue des lilas
charleval` rend **« 4 Rue des Acacias 13350 Charleval »** — parfaitement
formée, sans erreur, sans signal. Le seul indicateur est le score : la MÊME
ligne vaut **0,954** quand la requête correspond et **0,590** quand c'est
un repli.

> **Conséquence, tenue par l'écran : on ne remplit JAMAIS un champ depuis
> `resultats[0]`.** Une suggestion se CHOISIT, et la liste l'affiche en
> ENTIER — on lit « Acacias », et on sait. Le jour où quelque chose
> remplira tout seul, il faudra un seuil de score, et dire quand il n'est
> pas atteint.

Et la commune écrite dans la requête peut être purement ignorée :
`q=2 bis rue victor hugo lambesc` rend Roubaix, Asnières et Lens — à plus
de 800 km. Là encore, le libellé entier le dit.

#### Le code postal d'une COMMUNE est le plus petit de la commune

Paris rend **75001**, Marseille **13001**, Lyon **69001**. Remplir le champ
« code postal » d'un client depuis une suggestion de commune donnerait donc
75001 à tous les Parisiens — une valeur bien formée, jamais signalée, et
fausse sur chaque facture. Le vrai code postal ne s'obtient que d'un numéro
ou d'une rue.

Deux autres pièges tombent avec celui-là : les **arrondissements**
remontent comme des communes (`q=lyon` rend une commune « Lyon 3e
Arrondissement »), et il y a **quatre** types et non trois — `locality`,
le lieu-dit, dont le nom n'a aucun rapport avec sa commune (`q=paris` rend
un lieu-dit « Paris » à Gonfaron). Un lieu-dit, chez les clients d'un
artisan, c'est fréquent.

#### Et `properties.name` ne veut pas dire la même chose selon le type

Pour un `housenumber` il vaut « 4 Rue des Acacias » — exactement ce qu'on
veut sur une facture. Pour une `municipality`, il vaut **le nom de la
commune**. Le poser sans regarder le type écrirait « Charleval » dans un
champ « rue ».

#### Ce que le champ garde, et ce que la liste montre

> **La LISTE montre l'adresse entière** — c'est ce qui permet de voir que
> la suggestion n'est pas ce qu'on a tapé. **Le CHAMP ne garde que la
> rue** : le code postal et la ville ont leurs propres cases, et les y
> laisser en double les imprimerait deux fois sur un devis.

Un appui remplit donc les trois, et le `||` de chaque case n'est pas
décoratif : une frappe libre ne rend que `affichage`, donc sans lui le code
postal déjà saisi s'effacerait sous les doigts de celui qui corrige sa rue.

#### La Base Adresse Nationale manquait à la liste des destinataires

Trouvé en cherchant ce que ce lot envoie dehors. La section « À qui vos
données sont transmises » nommait Supabase, Cloudinary et Anthropic — **pas
la Base Adresse**, que chaque champ de ville interroge depuis le premier
jour. Le lot l'a rendu plus net : c'est désormais l'adresse d'un CLIENT,
donc d'une personne qui n'a pas de compte et n'a rien accepté.

> Une section qui s'appelle « à qui vos données sont transmises » et qui
> oublie un destinataire ne vaut rien, **même quand ce destinataire est un
> service public français**. Elle dit maintenant ce qui part : le texte en
> cours de saisie, jamais le nom du client, jamais son téléphone, jamais le
> fait que ce soit un client.

#### Trois fois un contrôle a visé une PLACE au lieu d'une CHOSE

Les vingt-et-un sabotages ont trouvé trois trous, et les trois sont la même
faute :

1. **`/KeyboardAvoidingView/` trouvait la ligne d'`import`.** En
   remplaçant `<KeyboardAvoidingView>` par `<View>` à la main, la feuille
   ne montait plus du tout et le contrôle restait VERT. Il vise désormais
   la BALISE ;
2. **la Base Adresse cherchée dans TOUS les textes légaux** : la retirer de
   la section des destinataires laissait le contrôle vert, parce que la
   section du carnet la nomme aussi. Il vise désormais la section ;
3. idem pour « ce qui part ».

Et deux de mes SABOTAGES étaient faux — un motif qui ne correspondait à
rien, donc qui n'éprouvait rien. **Un essai qui échoue pour la mauvaise
raison ne vaut pas mieux qu'un essai qui passe pour la mauvaise raison**, et
il se corrige pareil : on vérifie que le défaut a bien été posé.

#### Vérifié, et comment

Les 42 contrôles, `npx expo export --platform ios` dont la **sortie** a été
lue (1 « Exported », 0 « Import stack », 16 Mo). Le contrôle a été éprouvé
**en cassant ce qu'il surveille** : **vingt-et-un défauts remis à la main,
les vingt-et-un refusés** après correction des trois ci-dessus — plus
l'essai inverse, qui vérifie qu'un commentaire nommant `FeuilleBas` ne fait
PAS rougir le contrôle.

Puis au navigateur, **sur la VRAIE base**, avec un compte professionnel
jetable supprimé dans la même session (0 restant, base revenue à 13 comptes
/ 7 fiches / 20 publications / 2 chantiers / **1 client — celui du
propriétaire, intact**) :

| | relevé |
|---|---|
| la Base Adresse interrogée | **200**, 1 appel |
| les suggestions | « 4 Rue des Acacias 13350 Charleval » et une autre à 08000 |
| la rangée d'une suggestion | **356 × 50** — au-dessus des 44 points |
| après un appui : la rue | **« 4 Rue des Acacias »**, sans le code postal ni la ville |
| …le code postal | **13350** |
| …la ville | **Charleval** |
| enregistrement | `POST /rest/v1/clients → 201` |
| **après rechargement complet** | les trois cases reviennent de la BASE |

#### VÉRIFIÉ SUR L'IPHONE le 11/10/2026

Par le propriétaire, le soir même : **« j'ai testé sur mon iPhone et ça
marche très bien »**.

C'est la seule preuve qui comptait pour ce lot, et il faut mesurer ce
qu'elle vaut : **rien de la gestion du clavier ne se vérifie dans ce
conteneur.** `react-native-web` ne rend aucun clavier,
`KeyboardAvoidingView` y est un composant inerte, et
`automaticallyAdjustKeyboardInsets` y est jetée par liste blanche — sans
avertissement, sans casse, et sans effet. Les 42 contrôles et les captures
ne disaient donc qu'une chose : le remaniement n'a rien cassé.

> **Et le motif retenu n'était PAS celui qui avait fait ses preuves chez
> lui.** `AuthScreen` marchait avec un `KeyboardAvoidingView` ; j'ai livré
> l'autre mécanisme, sur la foi d'une lecture du source de React Native et
> contre le seul motif éprouvé sur son téléphone. C'était le pari du lot, et
> son iPhone vient de le trancher.

**Ce qui reste à surveiller, et qui n'est pas couvert par cette phrase :**

- il a essayé ce qu'il avait sous la main, pas les **dix-sept** conteneurs.
  « Modifier mon profil » et ses dix-huit champs, le mot de confirmation de
  suppression de compte et le commentaire écrit dans le fil n'ont pas été
  nommés ;
- **le cas « champ 3 → champ 9, clavier DÉJÀ ouvert »** reste ouvert : le
  défilement natif ne vit que dans `_keyboardWillChangeFrame:`, et passer
  d'un champ à l'autre sans refermer le clavier n'émet aucune notification.
  Ce qui prend alors le relais est le recadrage d'UIKit, qui ne s'établit
  pas depuis `node_modules`. Si le défaut réapparaît sous cette forme
  précise, la parade est un appel à la main à
  `scrollResponderScrollNativeHandleToKeyboard` sur `onFocus` — **et surtout
  pas un `KeyboardAvoidingView` par-dessus**, qui doublerait l'inset.

#### Ce qui n'a PAS été vérifié

- **Le mandataire du conteneur a coupé la Base Adresse plusieurs fois**
  pendant ce lot (`ws_closed_mid_exchange`, jusqu'à 5 échecs d'affilée). Un
  échec isolé de `verifier-adresse` n'est toujours pas un défaut du code.
  Et un essai au navigateur doit **attendre la chose, pas un délai** : à
  travers le mandataire, la réponse met parfois plus de quatre secondes
  alors qu'elle répond 200.
- **Le champ « Ville du chantier » de l'écran Publier est un `<Field>` nu**,
  pas un `ChampVille` : il ne propose rien, alors que six autres écrans le
  font. Trouvé en relevant les surfaces de saisie, pas corrigé ici — c'est
  le chemin de la publication, et il mérite son propre lot.

### Se déconnecter, c'est REPARTIR DE ZÉRO (17/10/2026)

`App.js`, `npm run verifier-sortie`. Signalé par le propriétaire sur son
iPhone : il crée un second compte pro pour essayer le SIRET, s'en
déconnecte, revient sur son compte principal — le seul administrateur — et
« Administration » a disparu de son profil.

La cause : on ne demande « suis-je administrateur ? » qu'une fois par
session (`adminDemande`), et `deconnexion()` ne remettait pas ce drapeau à
zéro. Elle vidait **vingt-cinq** états à la main ; OpusApp en compte
**quatre-vingt-dix**. En les comparant un par un, pire que le bouton :

- **le carnet de clients** du compte d'avant restait en mémoire, et il ne se
  recharge que s'il est « vide » : le compte suivant voyait les noms,
  numéros et adresses des clients d'un autre ;
- les demandes reçues s'affichaient le temps du rechargement ;
- un brouillon de publication (photos, ville) passait au compte suivant.

La base n'a rien laissé passer ; c'est l'écran qui montrait ce qu'il avait
gardé.

> **Une liste écrite à la main oublie toujours le prochain état.** `App.js`
> donne à OpusApp une CLÉ qui change à chaque sortie : React démonte et
> remonte le composant entier — états, références, abonnements. C'est une
> application qu'on relance, sans l'animation d'ouverture.

Deux pièges trouvés en le faisant :

1. **`onPress={deconnexion}` passe l'ÉVÉNEMENT d'appui en premier
   argument.** Avec un paramètre `message`, cet objet devenait le texte du
   bandeau de l'instance suivante. D'où `() => deconnexion()` et une garde
   `typeof message === 'string'`.
2. **Le bandeau n'existait que dans l'application connectée.** « Votre
   compte a été supprimé » — le seul message adressé à quelqu'un de
   déconnecté — était écrit, annoncé à VoiceOver, et **jamais affiché**,
   depuis le premier jour. Il passe désormais d'une instance à l'autre
   (`messageInitial`) et l'écran d'accueil sait l'afficher.

**Vérifié** : 13 défauts remis à la main, les 13 refusés par le contrôle ;
au navigateur, un filtre posé avant la déconnexion a disparu après, et le
bandeau de suppression s'affiche. **Et l'ancienne version, rejouée avec le
même essai, échoue aux trois points** — le filtre survivait, le bandeau ne
se voyait pas. **Pas vérifié** : le bouton « Administration » lui-même
après un changement de compte, qui demande le seul compte administrateur
de la vraie base — c'est au propriétaire, sur son iPhone.

### Les saccades pendant l'ÉLAN du fil (17/10/2026)

`npm run verifier-fil` (sections 6 à 9). Le build « preview », qui tourne à
la vraie vitesse, les a confirmées sur l'iPhone 16 du propriétaire : ce
n'était pas le mode développement. Et son indice a tout dit : « en gardant
le doigt sur l'écran, ça ne saccade pas ». Le doigt posé avance lentement ;
l'élan traverse plusieurs écrans par seconde, donc monte plusieurs cartes à
la file — et l'élan est animé par le MÊME fil principal qui monte les cartes.

Établi par la lecture du code natif (expo-image, SDWebImage 5.21.7,
expo-video, React Native 0.86) et mesuré au navigateur, jamais sur l'iPhone :

1. **expo-image réduit chaque photo sur le fil principal**
   (`UIGraphicsImageRenderer`), et quand l'image est déjà en mémoire, EN
   LIGNE, pendant le montage de la carte. Aucune copie réduite n'est gardée :
   chaque remontage recommence.
2. **La liste montait 11 à 14 cartes pendant chaque élan**, trois par bloc —
   et un `gap` dans le conteneur laissait des trous entre les cellules
   mesurées : le fenêtrage tombait dedans et remontait des cartes DÉJÀ
   DÉPASSÉES, à contresens. Rejoué avec le vrai code de
   `@react-native/virtualized-lists`.
3. **Les deux lecteurs vidéo étaient détruits puis recréés à chaque passage**
   (une `VideoView` crée un AVPlayerViewController à sa naissance).

> **Une liste ne s'espace JAMAIS par un `gap` dans `contentContainerStyle`.**
> L'espace va DANS la cellule : `ItemSeparatorComponent`, déclaré au niveau
> du module (une fonction fléchée serait un type neuf à chaque rendu). Le
> contrôle le vérifie pour TOUTES les listes du projet.

Ce qui a été fait, et ce qu'on a écarté :

- `maxToRenderPerBatch={1}`, `updateCellsBatchingPeriod={50}` : une carte
  par bloc. **`windowSize` reste à 5** — une fenêtre plus large ne réduit
  pas les montages d'un fil long, et retient plus d'images entières ;
- **`pleineResolution`** (`Media` → `Carrousel` → `PostCard` seulement) :
  `allowDownscaling={false}` sur **iPhone seulement** — sur Android, Glide
  réduit hors du fil principal. La puce graphique met l'image à l'échelle.
  **`enforceEarlyResizing` est écarté** : sa miniature TIENT dans le cadre,
  donc une photo verticale en `cover` serait agrandie de 42 %, floue ;
- **le lecteur vidéo naît au REPOS** : un compteur d'arrêts (`repos`, dans
  `HomeScreen`) monte quand les `onScroll` cessent depuis 200 ms ; une carte
  vidéo n'arme son lecteur qu'au premier arrêt qui suit son montage, et ne
  le désarme jamais — sinon la vidéo repartirait du début à chaque passage.
  En attendant, l'affiche Cloudinary, ou un fond sombre pour une vidéo
  rangée chez Supabase ;
- **`estVideo` prenait la vignette d'une vidéo pour une vidéo** (le chemin
  `/video/upload/` reste dans l'adresse du JPEG) : la grille du portfolio,
  les chantiers et les conseils ouvraient un lecteur sur une image. Une
  extension d'image l'emporte désormais (`src/lib/types-media.js`, qui
  n'importe que `cloudinary-adresses.js`, pour qu'un contrôle le FASSE
  TOURNER).

**Écartés pour l'instant, avec leur raison** : les dégradés
d'expo-linear-gradient sont dessinés par le PROCESSEUR sur le fil principal
(`LinearGradientLayer.swift`) — le voile de chaque photo et les 7
publications « dégradé » de démonstration de la vraie base. React Native 0.86
sait les confier à la puce graphique (`experimental_backgroundImage`), mais
l'API est expérimentale et ne se juge que sur l'iPhone : c'est le lot suivant
s'il reste des saccades. Les rappels instables d'OpusApp : **mesuré 0 rendu
pendant le défilement**, ce n'est pas la cause.

#### L'instrument — posé, puis retiré sans avoir servi

Un compteur d'images perdues (un rappel Reanimated à chaque image, sur le fil
principal) a vécu le temps d'un build « preview », allumé par une variable
de `eas.json`. Le propriétaire a jugé au doigt avant de le lire, et le verdict
était sans appel : il a été **retiré le même jour** — composant, ligne du
fil, variable et section du contrôle.

> **Un instrument de diagnostic oublié finit dans la version publiée.** Il
> se retire dans le commit qui clôt le diagnostic, pas « plus tard ». Si un
> jour il faut remesurer, il se reconstruit en dix minutes — il est dans
> l'historique (commit a08d751).

#### Vérifié, et comment

`verifier-fil` éprouvé en cassant ce qu'il surveille : **33 défauts remis à
la main, les 33 refusés, chacun par la bonne vérification** — dont l'auto-
épreuve (le balayage du vrai fenêtrage DOIT voir un trou de 10 pt). Les 46
contrôles, les paquets iOS et Android lus. Au navigateur, avant et après sur
les mêmes données gonflées (20 publications, vraies photos, deux WebM) :

| | avant | après |
|---|---|---|
| mise en page, 18 publications | — | **identique au pixel** |
| conversation de 4 bulles | — | **identique** |
| lecteurs `<video>` nés PENDANT le mouvement | 2 + 2 | **0 + 0** |
| arrêt sur une vidéo : à l'instant / 1 s après | 2 / 2 | **0 / 2** |

**VÉRIFIÉ SUR L'IPHONE 16 le 17/10/2026**, en build « preview », par le
propriétaire : « ça marche très bien, plus de saccades, les vidéos démarrent
quand on est dessus, tout fonctionne très bien ». Les dégradés n'ont donc pas
eu besoin d'être touchés ; ils restent le premier suspect si une saccade
revient.

**Ce qui n'est PAS vérifié** : aucun chiffre — le compteur n'a pas été lu,
c'est un jugement au doigt, et c'est celui qui compte. La **netteté** des
photos mises à l'échelle par la puce graphique est **confirmée le même jour**
par le propriétaire : « les photos sont toujours aussi nettes ». Et la vidéo d'essai déborde de son cadre au NAVIGATEUR — avant
comme après, c'est le lecteur web.

#### Les restes du diagnostic — la visionneuse et les vignettes (17/10/2026)

Deux défauts relevés pendant le diagnostic, et un troisième trouvé en les
corrigeant. Les trois créaient des lecteurs vidéo que personne ne regardait.

1. **La visionneuse plein écran montait DIX pages d'un coup** — sa liste
   n'avait aucun réglage. Elle monte désormais trois pages au plus
   (`initialNumToRender={1}`, `windowSize={3}`), et une vidéo n'y crée son
   lecteur qu'au REPOS, par le même compteur d'arrêts que le fil.
2. **La grille du portfolio créait un lecteur par vidéo sans aperçu.**
   `apercuDe()` ne rend une image que pour une vidéo Cloudinary ; pour une
   vidéo rangée chez Supabase, il rend la vidéo elle-même. Mesuré sur la
   vraie base : **2 vidéos de portfolio sur 58 médias** sont dans ce cas.
   Cinq écrans faisaient la même chose (grille, gestion du portfolio, bande
   des chantiers, conseils, « Mes publications »).

   > **Une vignette passe par `src/components/Vignette.js`, jamais par
   > `<Media media={apercuDe(…)}>`.** Elle fige le compteur d'arrêts : le
   > lecteur ne naît jamais, la case montre un fond sombre et le triangle de
   > lecture. `verifier-fil` refuse l'autre forme.
3. **Cinq listes déclaraient leur séparateur en fonction fléchée** — un type
   neuf à chaque rendu, donc tous les séparateurs démontés et remontés. Le
   contrôle couvre désormais TOUTES les listes du projet, pas seulement le
   fil et la conversation.

Mesuré au navigateur, avant et après, sur un portfolio de démonstration
gonflé à dix réalisations dont six vidéos sans aperçu :

| | avant | après |
|---|---|---|
| grille des réalisations | 6 lecteurs | **0** |
| visionneuse, à l'ouverture | 12 lecteurs | **0** |
| …au repos | 12 | **1** |
| pages montées | 10 | **2** |

Contrôles éprouvés en cassant : **seize défauts remis à la main, les seize
refusés**. **Pas vérifié** : le glissement de la visionneuse au doigt sur
l'iPhone, et le délai de démarrage d'une vidéo après qu'on s'y est posé.

### Mon entreprise pour les devis — lot 0a (18/10/2026)

Section 46 de `schema.sql`, `src/lib/emetteur.js`,
`src/components/MonEntreprise.js`, `npm run verifier-emetteur`. Premier lot
du module devis (`docs/PLAN-DEVIS.md`) : **ce que l'entreprise doit porter
sur chaque devis pour qu'il soit légal**, posé AVANT qu'un seul devis
n'existe. Aucun devis ne s'émet encore.

#### Ce qui est posé

- **Trois tables PRIVÉES** : `emetteur` (une ligne par entreprise),
  `emetteur_assurances` (une LISTE, parce qu'une entreprise peut avoir une
  décennale et une RC pro chez deux assureurs) et `tarifs_pro` (les frais de
  déplacement du devis). `est_mon_entreprise()` des deux côtés, aucune
  politique `anon`, et `revoke all … from anon` en plus : la leçon des
  sections 18.2 et 41.
- **L'identité ne se ressaisit pas** : raison sociale, SIRET, adresse et
  n° de TVA se LISENT dans `entreprise_registre` (section 45). Deux écritures
  du même objet finissent par diverger.
- **`emetteur_incomplet(p_pro) returns text[]`**, 21 motifs en
  `'cle: phrase'`. Ceux qui ne valent que pour un particulier portent le
  préfixe `conso_` : le lot 2 filtrera selon le destinataire sans réécrire la
  règle. **OP011** pour qui demande la fiche d'un autre. Le miroir JS
  (`MOTIFS`) est identique à l'octet, et le contrôle le compare.
- **Une seule fenêtre « Mon entreprise »**, plein écran, ouverte par deux
  portes (le profil et « Modifier mon profil »). Elle remplace
  `FeuilleEntreprise.js` : jamais deux écrans du même nom, et une feuille du
  bas ne porte pas vingt champs sans enfermer le clavier (04/10).

#### Les décisions du propriétaire, le 18/10

| question | réponse |
|---|---|
| qui peut lire les prix d'un autre artisan (`DONNEES-DES-ARTISANS.md` §5.2) | **un engagement écrit** : aucun écran ne les montre, et l'éditeur s'engage dans les CGU à ne pas les lire par l'éditeur SQL. Un engagement, pas une impossibilité : le propriétaire d'un projet Supabase peut toujours lire sa base |
| le libellé quand on ne facture pas le déplacement | **« Déplacement offert »** |
| les règles plus strictes que la loi | **une seule : relire le SIRET chaque année** (motif `entreprise_ancienne`), présentée comme un choix d'Opus |
| les tarifs du SOS | **juste après, dans un lot à part** |
| les négoces | **attendre**, en le sachant |

#### Un tarif ne vit jamais dans `emetteur`

**Une règle RLS filtre des LIGNES, jamais des COLONNES** (section 18). Or un
tarif est fait pour devenir public un jour — l'arrêté du 24/01/2017 (art. 3)
demande d'afficher ses tarifs sur ses pages en ligne. `tarifs_pro` est donc
sa propre table, privée aujourd'hui, publique **par ligne** demain. Rangé
dans `emetteur`, le premier tarif publié aurait ouvert toute la fiche.

#### La garantie « tarifs privés » ne tenait qu'au NOM d'une fonction

Trouvé par un sabotage. Le contrôle refusait qu'une fonction `admin_*` lise
les tarifs. Une fonction `security definer` sous un autre nom, une vue, ou
une fonction Edge munie de la clé de service les lisait **sans que rien ne
rougisse**.

> **Un contrôle qui vise un NOM garde une porte, pas la pièce.**
> `verifier-emetteur` et `verifier-legal` tiennent désormais la propriété :
> une liste FERMÉE de fonctions a le droit de nommer ces trois tables
> (`tient_l_emetteur`, `tient_l_assurance`, `tient_les_tarifs`,
> `emetteur_incomplet`, `mes_donnees`), aucune n'est `security definer`,
> aucune vue ne les nomme, aucun fichier de `supabase/functions` non plus. Et
> le cas 26 bis de l'essai relève le catalogue d'une base rejouée.

#### `not x` vaut `null` quand `x` est `null` — et la fiche ne réclamait rien

`identite` testait `not n.ei`. Pour une identité ouverte par
l'administration (SIREN et SIRET seuls), la nature est inconnue : `not null`
vaut `null`, la condition est fausse, et la fiche ne réclamait **aucun
nom**. Aucune erreur, juste un motif absent.

> **En SQL, une condition sur une valeur qui peut manquer s'écrit
> `is not true` / `is true`**, jamais `not x`. Même forme pour OP011, et dans
> le miroir JS.

#### Opus ne compose aucune mention, et il dit « pour un particulier »

Les relectures de droit ont trouvé quatre phrases qui disaient l'inverse de
la loi :

| texte | ce qu'il dit vraiment | ce que faisait le code |
|---|---|---|
| R. 123-237 | le lieu du siège n'est dû sur tout devis que par une entreprise **au RCS** | il le réclamait à tous |
| R. 123-238 | le capital n'est dû que par une **SARL ou une société par actions** | il le réclamait à toute la catégorie 5, SNC comprises |
| L. 243-2 | l'attestation de décennale est due **quel que soit le client** | il la disait due « pour un particulier » |
| R. 111-2 | des informations à **communiquer** au client | « l'écrire sur le devis » |

> **Une obligation du code de la consommation se dit « pour un particulier »,
> et un choix d'Opus se dit comme un choix.** L'aperçu de l'en-tête marque
> « [pour un particulier : …] » ce qu'un devis à un professionnel n'a pas à
> porter. Un `[à compléter]` sur chaque devis aurait fait croire à un
> artisan qui ne travaille qu'avec des professionnels qu'il lui manque
> quelque chose.

#### Un `0` n'est pas un vide

« Je ne facture pas de déplacement » et « je n'ai rien répondu » ne se
distinguent pas dans un champ vide. D'où :

- **seul l'interrupteur écrit `0`** (« Déplacement offert ») ;
- **un `0` tapé est refusé**, par le formulaire et par la base
  (`tarif_frais_zero_check`), avec une phrase qui dit quoi toucher ;
- **aucune base ne vide un texte en silence** : `0` plus des conditions
  écrites est refusé, pas « nettoyé ».

Et l'essai sur la vraie base a montré un défaut de plus : **un artisan qui
enregistrait sa fiche sans rien dire de ses frais créait une ligne de tarifs
VIDE** (`POST /rest/v1/tarifs_pro → 201`). Une ligne vide ne coûte rien
aujourd'hui, mais le jour où les tarifs deviendront publics par ligne, elle
sera un tarif « publié » qui ne dit rien. **Une ligne vide ne s'écrit plus**
(`MonEntreprise.enregistrer`) ; une ligne qui EXISTE se met à jour même vers
rien, et c'est ainsi qu'on retire ses frais.

#### L'orange de signature ne fait pas un filet sur le fond

Le bloc « Il manque … » portait un filet `C.accent`. Un filet est un élément
graphique : il lui faut **3 : 1**. Mesuré au navigateur : **2,76** sur le fond
de l'application. En `C.accentTexte` : **4,52**. C'est la règle du lot 5,
appliquée à un trait au lieu d'un texte.

#### Les dates appartiennent à la BASE

`regime_tva_declare_le`, `modifie_le` et la date de création d'une assurance
sont posées par les déclencheurs, par `clock_timestamp()`. Vérifié sur la
vraie base : des dates de 1999 et de 2001 envoyées par le client sont
ignorées. Renvoyer la fiche entière avec le MÊME régime ne déplace pas la
date de déclaration ; changer de régime en pose une nouvelle. Une date que le
téléphone peut écrire ne prouve rien — et celle-là s'imprimera un jour sur
une facture.

#### Une migration se PROUVE par empreinte, pas par lecture

La vraie base a reçu la section 46 sans un seul ordre qui commence par `drop`
ou `delete` : contraintes et politiques créées sous condition dans des blocs
`do`, texte envoyé sans commentaires (par un découpeur qui respecte les
chaînes `'…'`, `E'…'`, les `$tag$` et les commentaires imbriqués).

> **L'équivalence ne se lit pas, elle se mesure** : une empreinte normalisée
> du catalogue (fonctions, contraintes, politiques, déclencheurs, colonnes,
> droits, index), comparée entre la vraie base et une base neuve rejouée.
> Deux écarts, tous deux connus et sans effet : PostgreSQL 17 ajoute le droit
> `m` (MAINTAIN) aux droits de table, et le connecteur, qui passe par du
> JSON, transforme l'écriture `\u00a0` (barre oblique inverse, u, 00a0) en vrai
> caractère U+00A0 — équivalent dans une expression régulière, vérifié en
> l'exécutant.

#### `\b` ne voit pas une lettre accentuée — et un contrôle était aveugle

`verifier-etats` cherchait le mot interdit par `/v[ée]rifi[ée]e?s?\b/i`.
Mesuré : `.test('le badge « vérifié »')` rend **`false`**. Pour JavaScript,
« é » n'est pas une lettre de mot, donc il n'y a pas de frontière après lui,
et le contrôle n'a **jamais** vu le mot qu'il devait refuser.

> **Dans un projet écrit en français, une frontière de mot se pose à la
> main** — `(?![\p{L}_])` avec le drapeau `u` —, jamais par `\b`. Et un
> contrôle de vocabulaire s'éprouve en lui donnant le mot interdit.

#### L'index git est PARTAGÉ — et un fichier supprimé y reste

Deux leçons du même fichier, `FeuilleEntreprise.js`.

1. **Un commit lancé sans chemins emporte ce qu'un AUTRE travail a mis dans
   l'index.** Le commit de documentation `ff4f655` a embarqué un
   `git rm --cached` laissé là : sur `origin`, `ProfilEditScreen` importait
   un fichier absent, et le dépôt ne se construisait plus. Réparé par
   `67cbf2a`. **On commite avec des chemins nommés, un par un.**
2. **Un fichier effacé du disque mais pas de l'index fait PLANTER quatre
   contrôles** : ils listent les fichiers par `git ls-files`, puis les
   ouvrent. `npm run verifier` l'a dit — « N'A PAS PU SE LANCER », pas
   « ✘ ». C'est exactement ce pourquoi il distingue les deux depuis le
   lot 8. Une suppression passe par `git rm`.

#### Vérifié, et comment

`schema.sql` rejoué deux fois sur une base neuve, les **48 cas** de
`supabase/essais-section-46.sql`, les **47 contrôles**, le linter (32
problèmes, tous antérieurs), les paquets iOS et Android dont la **sortie** a
été lue. La dernière série de sabotages : **31 défauts remis à la main, les
31 refusés par la bonne vérification**. Les relectures ont été REPRODUITES
sur l'arbre d'avant chaque correction : sept défauts d'écran sur huit, en
démonstration, avant ; huit sur huit corrects après.

Puis sur la VRAIE base, migration appliquée, avec deux comptes pro et un
compte particulier jetables (preuve `essai` posée pour leur adresse exacte,
`enregistrer_vues` neutralisé), supprimés par le chemin de l'application :

| | résultat |
|---|---|
| A, fiche vide | **11 motifs** |
| A enregistre sa fiche, ses frais, une décennale | 201 ×3, **1 motif restant** (le médiateur) |
| dates envoyées par le client (1999, 2001) | **ignorées** |
| « 0 » plus des conditions | **400 · `tarif_frais_zero_check`** |
| un nom d'entrepreneur individuel réduit à « EI » | **400 · `emetteur_denomination_ei_check`** |
| un médiateur sans adresse ; le RCS sans greffe | **400** ×2 |
| B lit la fiche, les assurances, les tarifs de A | **`[]`** ×3 |
| B écrit au nom de A, ou y déplace sa propre fiche | **403** ×4 |
| B modifie ou supprime chez A | 204, **0 ligne** : la fiche de A est intacte |
| B demande ce qui manque à A ; le particulier demande le sien | **OP011** ×2 |
| un visiteur sans compte | **401**, tables et fonction |
| l'export RGPD de B | **rien de A** |
| **au navigateur** : après enregistrement | « Oui : vos informations d'entreprise sont complètes » |
| …après rechargement complet | idem, relu de la base |
| l'aperçu | « Déplacement offert », le médiateur avec son adresse, « répertoire Sirene (INSEE) … consultée le 18/10/2026 » |
| « registre » hors RCS/RNE · « vérifi » | **0** · **0** |
| cibles sous 44 points en édition | **0** |
| une attestation PDF | envoyée dans `documents` (200), lien signé (200) |
| le particulier | aucune rangée « Mon entreprise », **0 appel** |

Base revenue à 15 comptes / 8 fiches / 21 publications / 1 entreprise /
1 client, et **0** fiche émetteur, assurance ou tarif. Deux preuves `essai`
restent, expirées et inutilisables : le connecteur refuse un `delete`.

**ESSAYÉ SUR L'IPHONE le 19/10/2026**, par le propriétaire, **dans Expo
Go** : « tout fonctionne très bien ». Sans détailler les cinq points (le
clavier sous une vingtaine de champs, la virgule du pavé décimal, la
Photothèque et l'Appareil photo pour l'attestation, la croix clavier
ouvert, la liste des médiateurs au pouce) ; Expo Go convient ici, le lot
n'ajoute aucun module natif.

> **L'icône Opus de son iPhone ne montrait AUCUN changement, et c'était
> attendu** : c'est la version « preview » du 17/10, dont le code est figé
> à la construction. Les profils `development` et `preview` portent la
> même identité (`com.opusproject.app`), donc installer l'une remplace
> l'autre sans prévenir. Avant de conclure « ça ne marche pas sur le
> téléphone », demander QUELLE application il a ouverte : la version de
> développement s'ouvre sur une page de lancement, la « preview »
> directement sur Opus.

**Ce qui n'a PAS été vérifié** : le chemin « nom d'entrepreneur individuel » n'a été
éprouvé que par l'API. La démonstration ne montre ni l'adresse du siège ni
le motif d'un an. Et **aucun vrai artisan n'a encore rempli sa fiche** — le
frère la remplira lui-même, après la remise de son compte et ses propres
CGU.

#### Ce qui reste ouvert

Dans `docs/A-FAIRE.md`, « Après le lot 0a » : les tarifs du SOS (le lot
suivant ; une fiche SOS à 0 € affiche encore « 0 – 0 € »), trois points à
faire relire par un juriste (R. 123-237 face au RNE, les coopératives et
l'EIRL, la phrase L. 243-2 du plan), l'adresse du siège à ranger dans la
preuve, l'artisan au régime réel sans n° de TVA transmis, les attestations
remplacées qui restent dans `documents`, et la liste des médiateurs à
relever chaque année.

### Les erreurs de l'assistant arrivaient en anglais (18/10/2026)

`supabase/functions/ai/index.ts`, `src/lib/ai.js`,
`messageDeFonctionEdge()` dans `src/lib/erreurs.js`, contrôlés par
`verifier-agent` et `verifier-etats`.

#### Le défaut, reproduit avant d'être corrigé

`supabase.functions.invoke` transforme toute réponse non-2xx en
`FunctionsHttpError`, dont le message est « Edge Function returned a non-2xx
status code », et **il ne lit pas le corps**. La fonction `ai` rendait
pourtant ses refus en français, mais avec un statut d'erreur : 401 (pas
connecté), 429 (limite du jour), 422 (refus du modèle), 502 (réponse
illisible). Mesuré avec le vrai paquet `functions-js` du projet, sur la
vraie fonction, sans compte (donc sans rien payer) :

| | ce que la fonction rendait | ce que l'application affichait |
|---|---|---|
| corps | « L'assistant n'est accessible qu'une fois connecté. » | **« Edge Function returned a non-2xx status code »** |

Trois écrans affichent `e.message` tel quel : améliorer un texte, le résumé
des avis, la recherche de l'assistant. La page du chantier, elle, passait
par `messageClair()` et annonçait « le service d'Opus n'a pas répondu
correctement » — une **panne** là où il n'y avait qu'une **limite**. Et la
présentation assistée disait toujours « pas joignable ».

> **C'était la règle déjà écrite pour la fonction `siret`** (« toutes les
> issues partent en HTTP 200 »), et elle n'avait pas été appliquée à `ai`.
> Une règle écrite pour UNE fonction ne protège pas la suivante.

#### La correction, des DEUX côtés

1. **La fonction** : ce qui concerne la personne sort en 200 avec
   `{ error }` (`issue()`). Seule une panne d'Opus — secret absent, journal
   injoignable, compte Anthropic — garde un statut d'erreur.
2. **L'application lit le corps quand même** (`messageDeFonctionEdge`) :
   la phrase du serveur si elle existe ; pour un 401 sans phrase, la
   session ; sinon `messageClair()`. Toute erreur sortie de
   `callAiFunction` est une `ErreurAssistant`, déjà en français, que
   `messageClair()` rend telle quelle.

> **Les deux, et pas l'un ou l'autre.** Le côté application a été éprouvé
> sur la fonction ENCORE en version 9 : la phrase française arrivait déjà.
> Une fonction pas encore redéployée, ou une version de l'application en
> retard, ne remet donc pas l'anglais à l'écran. Et la **passerelle** de
> Supabase refuse un jeton invalide avant que la fonction ne tourne, en
> anglais (`{"code":"UNAUTHORIZED_LEGACY_JWT","message":"Invalid JWT"}`,
> relevé tel quel) : aucune modification de la fonction ne l'aurait
> attrapé, seul le côté application le traduit (« votre session a
> expiré »).

#### Deux défauts du journal, trouvés sur le même chemin

- **Un refus du MODÈLE restait noté `ok`**, avec zéro jeton : `aRefuse`
  sortait sans appeler `noter`, et la ligne gardait sa valeur par défaut.
  C'est le défaut du 07/10 (« un refus s'inscrivait `ok` ») par une autre
  porte.
- **Une réponse illisible était notée `ok` AVANT d'être lue.**

Les deux passent par `refuser(texte, entree, sortie)` : l'échec est noté
`erreur`, **avec les jetons réellement payés**. Et `ok` ne s'écrit plus
qu'une fois la réponse LUE, dans les cinq actions.

#### Ce que l'application lit maintenant, elle l'aurait affiché

Le repli de `messageLisible` recopiait l'erreur brute d'Anthropic entre
parenthèses — « (Connection error.) ». Invisible tant que l'application ne
lisait pas le corps ; depuis qu'elle le lit, ce serait de l'anglais à
l'écran. Retiré de la phrase : le détail est déjà dans les journaux
Supabase.

> **Réparer la lecture d'un canal rend visible tout ce qui y passait
> déjà.** Avant de brancher un lecteur sur un texte que personne ne
> lisait, relire ce texte.

#### Vérifié, et comment

`verifier-agent` et `verifier-etats` FONT TOURNER la traduction sur les
vraies classes de `functions-js` et de vraies `Response` (dont le corps
exact de la passerelle) ; **onze défauts remis à la main, les onze
refusés**. Les 47 contrôles, le linter (32, tous antérieurs), les paquets
iOS et Android lus. Le compilateur TypeScript rend les mêmes dix erreurs
d'environnement (Deno, modules `npm:`) avant et après.

La fonction déployée en **version 10**, `verify_jwt` inchangé, puis relue :
**identique au dépôt octet pour octet** (même empreinte SHA-256). Sur la
vraie base, avec un compte particulier jetable supprimé par le chemin de
l'application :

| | résultat |
|---|---|
| sans compte | **200**, « L'assistant n'est accessible qu'une fois connecté » |
| un jeton invalide (passerelle) | 401 en anglais → **« Votre session a expiré »** à l'écran |
| un récit à une seule étape | **200** et sa phrase ; au journal **`erreur`, 0 jeton** |
| améliorer un texte | **200**, trois propositions ; au journal **`ok`, 1 337 / 153 jetons** |
| après le ménage | reconnexion refusée, 0 compte jetable, base revenue à 15 / 8 / 21 |

**Ce qui n'a PAS été vérifié** : la limite du jour pour de vrai (il
faudrait soixante appels payants) ; un refus du modèle et une réponse
illisible ne se provoquent pas à la demande — ces deux chemins ne sont
tenus que par le contrôle. Et rien sur l'iPhone.

### Les tarifs réunis — lot T (19-20/10/2026)

Section 47 de `schema.sql`, `src/lib/tarifs.js`, `src/components/TarifsPublics.js`,
`npm run verifier-tarifs`. Le cahier qui l'a guidé : `docs/CAHIER-LOT-T.md`
(archivé tel qu'il a servi ; en cas de désaccord, c'est cette section et le
code qui disent vrai). Premier lot de l'ordre **T → 1 → P → S → 2**
(`docs/PLAN-DEVIS.md` §10.14).

**Avant ce lot, deux chiffres de déplacement coexistaient** : celui des
devis (`tarifs_pro`, lot 0a) et celui du SOS (`sos_availability`), et une
fiche SOS à 0 € affichait « 0 – 0 € ». Il n'y a plus qu'**une liste, dans
`tarifs_pro`**, qui sert au devis, à la fiche et au SOS.

#### Les décisions du propriétaire, le 19/10

| question | réponse |
|---|---|
| répondre aux urgences sans afficher ses tarifs ? | **non** : `artisans_urgence` ne rend qu'un artisan dont la ligne a `affiche is true` et qui suffit à une estimation (déplacement ou « offert », taux horaire, majoration ou « je ne majore pas ») |
| qui lit une ligne affichée ? | **les particuliers connectés seulement** — `affiche is true and not est_un_pro() and not est_masque(pro_id)`. Aucun droit pour `anon` |
| l'avis d'un avocat | **un simple rappel**, aucun contrôle bloquant |
| les forfaits | **plus tard** |
| la majoration | **comme aujourd'hui** : de 20 h à 7 h, le samedi et le dimanche, sur le déplacement comme sur les heures |

> **« Aucun écran d'Opus ne montre les prix d'un artisan à un autre »**
> (l'engagement du 18/10) **reste vrai tel quel** — l'éditeur non plus, son
> compte est pro. **Mais c'est une barrière, pas un verrou**, et les textes
> le disent : un artisan peut ouvrir un second compte particulier avec une
> autre adresse, et Opus ne vérifie pas l'identité des particuliers.

#### Ce que « particulier » veut dire pour la base

Pas « un compte de type particulier » : **toute session sans fiche pro**.
Outre les particuliers, trois cas lisent donc une ligne affichée, et ils
sont écrits en 47.5 et éprouvés : un compte `type = 'pro'` SANS fiche (essai
5 quinquies a) ; une session dont la ligne `users` a été effacée par
`preparer_suppression_compte()`, tant que son jeton vit (5 quinquies b) ; un
ADMINISTRATEUR dont le compte serait particulier (5 quater). Aujourd'hui le
seul administrateur est un compte pro — c'est ce qui rend vrai « l'éditeur
non plus ».

> **Le deuxième cas existe sur la vraie base** : le compte anonyme du 14/09
> (`docs/A-FAIRE.md` §5). Personne ne peut plus ouvrir de session sur lui,
> mais rien ne prouve que son jeton du 14/09 soit perdu : une session qui
> survivrait quelque part lirait le premier tarif affiché (aucun ne l'est
> encore). **Le supprimer est au propriétaire**, et c'est devenu plus qu'une
> propreté.

#### Trois états partout, et un `0` qui n'est jamais tapé

`null` = non déclaré ; `0` = un CHOIX (« Déplacement offert », « Je ne
majore pas », « Mes devis sont gratuits »), **écrit par un interrupteur
seulement** ; un montant. **Un taux horaire n'a pas de 0.** Tout est en
centimes, et TTC : c'est ce que paie le client et ce qu'il lit. Le lot 2
décidera comment le DEVIS imprime ces montants (HT sur une ligne au régime
réel).

Afficher exige **au moins un tarif** — un dépanneur au forfait doit pouvoir
afficher ses frais et son prix de devis sans taux horaire —, et la base le
tient (`tarif_affiche_check`) : un bloc affiché n'est jamais vide.

#### Quatre pièges trouvés par les relectures, et pas à l'œil

1. **PostgreSQL contrôle la ligne PROPOSÉE d'un `INSERT … ON CONFLICT`**,
   avant de fusionner. Un upsert partiel `{affiche: true}` est refusé par
   `tarif_affiche_check` même quand la ligne existante porte des tarifs —
   alors que la démonstration l'acceptait. **On envoie la ligne entière,
   toujours**, et la démonstration valide désormais les deux lignes comme
   la base (essais 6 bis a/b).
2. **Un caractère invisible satisfaisait « jamais vide »** : un U+200B seul
   passait la contrainte, et la fiche montrait un bloc « Ses tarifs » vide.
   `tient_les_tarifs()` (du lot 0a) et `tient_les_tarifs_publics()` rognent
   une classe de blancs Unicode (U+00A0, U+200B/C/D, U+2060, U+FEFF) ; le
   miroir JavaScript est `BLANCS_TARIFS`, et le contrôle compare les deux.
   **Conséquence : la migration du lot T emporte aussi une fonction du
   lot 0a.**
3. **`artisans_urgence()` garde EXACTEMENT sa signature et son type de
   retour** — une fonction appelée par l'application ne change jamais de
   signature (section 34). Elle déménage en section 47, lit `tarifs_pro`,
   reste `security invoker` (donc filtrée par le blocage) et n'est plus
   exécutable que par `authenticated`. Le prix du devis, le décompte et les
   conditions de déplacement arrivent par une SECONDE lecture, sur les lignes
   affichées.
4. **Les colonnes `sos_availability.deplacement`, `.horaire`, `.majoration`
   sont MORTES** : remises à 0, et **une écriture non nulle est REFUSÉE**
   (`OP012`, avec une phrase qui dit de mettre l'application à jour). Un
   refus qui dit pourquoi vaut mieux qu'une remise à 0 silencieuse : l'icône
   « preview » du 17/10 écrit encore ces colonnes. Les retirer demande un
   `drop column`, que le connecteur refuse : un lot de nettoyage, plus tard.

Et `rayon_km` / `delai_minutes` sont enfin bornés par la base (1-200 km,
5-600 min) : `"ma dispo sos"` est `for all`, et un client modifié qui écrivait
100 000 km apparaissait dans la recherche de tous les particuliers.

#### La nuit se juge à l'heure d'ARRIVÉE

« Tout de suite » : maintenant + le délai annoncé. « Dans la journée » et
« Demain » : estimation **non majorée**, et la carte dit « +40 % si
l'intervention a lieu la nuit ou le week-end ». Avant, « Demain » choisi à
21 h affichait une estimation majorée pour une intervention de jour.

#### Le rattrapage n'allume jamais rien

Il ne tourne qu'UNE fois (gardé par l'absence de la colonne) : copie des
valeurs SOS strictement positives, **sans jamais écraser** une valeur
déclarée, **sans jamais allumer `affiche`**. Publier reste un geste de
l'artisan, et c'est la BASE qui le date (`affiche_le`). Sur la vraie base :
rien à copier (la seule ligne valait 0 / 0 / 0), et **la ligne « Électricité »
du propriétaire a été éteinte** — aucun de ses métiers n'est un métier
d'urgence, et la promesse « un métier retiré n'apparaît plus » n'était tenue
par rien.

#### Une DATE d'horodatage se lit à l'heure du téléphone — trouvé vers 1 h 20

« Affichés sur votre fiche depuis le **19**/10/2026 », alors qu'il était
1 h 20 le 20 à Paris. `dateFrancaise()` (`src/lib/entreprise.js`) prenait
les dix premiers caractères de la chaîne ; or PostgREST rend un
`timestamptz` en UTC. **Toute la nuit, de minuit à 1 h ou 2 h, la date était
celle de la veille** — sur « Affichés depuis », « Dernière modification »,
« consultée le » (qui s'imprimera sur un devis), « inscrit le »…

> **Une colonne `date` se lit comme une chaîne** (la leçon des dates de la
> Place des pros : `new Date('2026-10-12')` tombe à minuit UTC). **Un
> horodatage se lit à l'heure du téléphone.** La fonction distingue les deux,
> et `verifier-tarifs` (vérification 49) la FAIT TOURNER à l'heure de Paris
> sur les deux bords de minuit. Éprouvé en cassant : refusé.

Il n'aurait été vu dans aucun essai fait de jour, démonstration comprise :
ses dates sont aussi des `toISOString()` en UTC, et la nuit elles auraient
montré la même veille. Les essais au navigateur avaient en plus leur horloge
fixée à 14 h ou 22 h. **Il a fallu un essai sur la vraie base, où c'est le
SERVEUR qui date, à l'heure réelle d'une nuit.**

Et la vérification 49 tourne dans TROIS fuseaux (Paris en été et en hiver,
les Antilles, Kiritimati) : la relecture a montré qu'un seul fuseau, à l'est
de Greenwich, laissait passer « une date seule lue comme un instant » — qui
ne recule d'un jour qu'à l'OUEST, aux Antilles par exemple. La 49 bis exige
que chaque horodatage soit réécrit, avant `Date.parse`, dans LA forme que la
spécification de JavaScript oblige tout moteur à lire (`isoLisible()`) :
`node` est plus tolérant que Hermes, il ne peut pas en être juge. Six
sabotages, six refus.

> **Et un contrôle de dates se lance dans plusieurs fuseaux.** Lancés aux
> Antilles, les 48 contrôles ont trouvé un défaut PLUS ANCIEN, de la même
> famille : `libelleDates()` (la Place des pros) lisait « 2026-03-12 » par
> `new Date()`, donc « du 12 au 20 mars » s'affichait « du 11 au 19 mars »
> en Martinique — le piège que CLAUDE.md décrit depuis le 04/10, dans le
> fichier même qui le décrit. Corrigé, et `verifier-annonces` le vérifie
> désormais dans trois fuseaux.

#### Le transport du connecteur change aussi MES requêtes

Le connecteur passe par du JSON, et une écriture `\u00a0` (barre oblique
inverse, u, 00a0) dans le TEXTE envoyé devient le vrai caractère U+00A0 — déjà noté au lot 0a pour les migrations.
**Ça vaut aussi pour une requête de vérification** : comparant les corps de
fonction, `replace(prosrc, '\u00a0', …)` remplaçait le caractère U+00A0
par lui-même, et deux fonctions du lot T semblaient DIFFÉRENTES de la base
neuve. Le relevé octet par octet (`encode(convert_to(…), 'hex')`) a montré
que la base portait exactement les six caractères attendus.

> **Dans une requête envoyée par le connecteur, une séquence `\u…` s'écrit
> `chr(92) || 'u00a0'`.** Et une différence d'empreinte s'explique en
> lisant les OCTETS, pas en relisant le texte.

#### Essayer le jour et la nuit sur la vraie base : une horloge PLUS TÔT

`page.clock.setFixedTime` règle l'heure du navigateur, pas celle du serveur.
Fixée **après** l'expiration du jeton, supabase-js croit la session expirée
et la rafraîchit en boucle ; fixée **avant** l'heure réelle (la veille, le
19/10 à 14 h puis à 22 h, alors qu'il était 1 h du matin le 20), le jeton
reste valable et l'estimation se calcule à l'heure voulue. Le navigateur se
croyait donc le 19 : « Affichés depuis le 19/10 » paraissait cohérent à
l'écran — c'est l'heure du serveur, relevée à part, qui a trahi le défaut. Le serveur, lui, date tout à
l'heure réelle — c'est ce qui a fait voir le défaut de date ci-dessus.

#### Vérifié, et comment

`schema.sql` rejoué deux fois sur une base neuve, les essais 47 (18 refus,
tous attendus) et le rattrapage (`essais-section-47-rattrapage.sql`) par le
schéma comme par la migration, les 21 autres fichiers d'essais comparés à
leur relevé d'avant (trois écarts attendus), les **48 contrôles**, le
linter (32, tous antérieurs), les paquets iOS et Android dont la sortie a
été lue. Trois relectures adverses : **25 problèmes, tous reproduits avant
d'être corrigés**, puis **132 sabotages, chacun refusé par la vérification
visée**.

La migration simulée sur la base « d'avant » rend l'empreinte d'une base
neuve, puis appliquée sur la VRAIE base dans la nuit du 19 au 20/10 (vers
1 h, heure de Paris), avec l'accord du propriétaire, sans un ordre qui commence par `drop` ou `delete`. **Empreinte
comparée après coup** : les 79 fonctions identiques à une base neuve une
fois les commentaires, les blancs et les échappements du transport mis à
part ; le reste n'est que des restes connus (`entreprise_registre.gele`,
`admin_basculer_metier` — exécutable par personne d'autre que `postgres` et
`service_role` —, la politique « lecture demandes visiteur » réduite à
`using (false)`, des commentaires sans accents).

Puis par le chemin de l'application, avec un artisan plombier A, un
concurrent électricien B et un particulier P **placés à Brest** (aucun compte
réel à moins de 60 km), SIRET fictifs à clé juste vérifiés inconnus du
répertoire Sirene, `enregistrer_vues` neutralisé, supprimés à la fin :

| | relevé |
|---|---|
| A, « Mon entreprise » en lecture | « Non affichés… vous n'apparaissez pas dans les urgences » |
| les champs · les interrupteurs | 358 × 44 (décompte 358 × 70) · 44 à 53 de haut ; pavé décimal pour les frais, le taux et le devis, numérique pour la majoration, aucun avec une touche retour |
| un taux tapé, puis fermer | « Quitter sans enregistrer » ; allumer puis éteindre, fermer : **rien** |
| « 0 » dans le taux · afficher sans tarif | refusés à l'écran, **aucune requête** |
| 45 / 62,50 / décompte / 40 % / devis gratuit, affiché | `POST emetteur 201`, `POST tarifs_pro 201` |
| après rechargement | « Mes tarifs » sur le profil, avec « Visibles des particuliers connectés seulement » |
| « Je réponds aux urgences » | le futur, puis `POST sos_availability 201`, puis le présent |
| A change sa présentation | l'interrupteur reste allumé, la ligne SOS reste active |
| **P**, SOS Plomberie, de jour | **1 carte, « 108 – 170 € TTC »**, « Déplacement 45 € · 62,50 €/h », « Devis : gratuit » |
| …de nuit (22 h) | **« 151 – 238 € TTC »**, « majoration de nuit et de week-end incluse » |
| …« Demain », de nuit | « 108 – 170 € TTC », « +40 % si l'intervention a lieu la nuit ou le week-end » |
| P ouvre la fiche de A | `GET tarifs_pro 200`, « Ses tarifs », cinq lignes, « +40 % » sans heures |
| **B** ouvre la fiche de A (par « Mes partenaires ») | **aucun bloc, et AUCUNE requête vers `tarifs_pro`** |
| A éteint ; P rouvre la fiche SANS recharger | aucun bloc ; le SOS : « Aucun artisan disponible » |
| …et le réglage SOS de A | « Vous n'apparaîtrez pas dans les urgences : vos tarifs ne sont pas affichés » |
| A rallume, « je ne majore pas », « déplacement offert » ; P de nuit | « 63 – 125 € TTC », « Déplacement offert · 62,50 €/h · sans majoration la nuit ni le week-end » |
| la route `artisans_urgence` coupée | « La recherche d'artisans : pas de connexion… », **aucun anglais** |
| P « Choisir » | `POST sos_requests 201` ; relus par l'API : `prix_min/max` **63 / 125** côté P, et la demande dans `mes_demandes_recues` de A |
| un visiteur : `tarifs_pro` · `artisans_urgence` | **401 · 42501** · **401 · 42501** |
| **B, juste après que P a lu la ligne** | **`[]`** · **`[]`** |
| P modifie / supprime la ligne de A | 204, **rien de changé** (relu par A) ; au nom de A : **403** |
| A écrit l'ancienne colonne · un rayon de 100 000 km | **400 OP012** (message complet) · **400 `sos_rayon_check`** |
| P bloque A | `tarifs_pro` **`[]`**, `artisans_urgence` **`[]`** ; débloqué : 1 ligne |
| l'export RGPD (`rpc/mes_donnees`) | A : les six clés nouvelles, `ma_disponibilite_urgences` 1, `urgences` 1 ; P : `urgences` 1 |

Base revenue à 15 comptes / 8 fiches / 21 publications, 0 tarif, 0 demande
SOS, 0 ligne SOS active. Les deux preuves `essai` du 18/10 ont été
**réutilisées** (mises à jour pour les nouvelles adresses, plutôt que d'en
créer deux de plus que le connecteur ne saura pas supprimer) ; elles ont
expiré depuis.

**Ce qui n'a PAS été vérifié** : rien sur l'iPhone — la virgule du pavé
décimal, le clavier sous « Vos tarifs », les interrupteurs au doigt, la
carte SOS au pouce (il faut un compte PARTICULIER : celui du propriétaire
est pro et n'ouvre pas l'écran SOS). Le bandeau « Estimation … € TTC » après
« Choisir » n'a été lu que dans le code (il avait disparu à la capture) :
le prix rangé en base, lui, est mesuré. Et **aucun vrai artisan n'a encore
affiché ses tarifs**.

#### Ce qui reste ouvert

Dans `docs/A-FAIRE.md`, « Après le lot T » : le compte anonyme à supprimer,
la ré-acceptation des CGU (`VERSION` a changé, rien ne fait ré-accepter),
les colonnes mortes et la lecture publique de `sos_availability`, l'unité
des montants sur le devis (lot 2, avec un juriste), les états que la
démonstration ne montre pas, les quatre lectures de démarrage sans délai,
et le contraste de `C.bad` sur le fond (4,37).

### Le n° de TVA écrit à la main, contrôlé par VIES — section 48 (20/10/2026)

Section 48 de `schema.sql`, fonction Edge `supabase/functions/tva/`,
`src/lib/tva.js` (copié OCTET POUR OCTET dans la fonction — `verifier-tva` le
compare), `src/components/SaisieTva.js`, `npm run verifier-tva`.

Signalé par le propriétaire en remplissant « Mon entreprise » : son n° de TVA
n'était pas importé, il ne pouvait pas l'écrire, et la fiche disait qu'il
manquait quelque chose pour les devis à des particuliers. Sa demande : « si
il ne le trouve pas on peut juste donner le moyen a la personne de l'ecrire a
la main dans opus ». Son choix, parmi trois : **à la main, contrôlé par
VIES**.

#### Calculer n'est pas attribuer — mesuré, pas supposé

Le n° de TVA d'une entreprise française se CALCULE depuis son SIREN
(clé = (12 + 3 × (SIREN mod 97)) mod 97). C'était la tentation : le remplir
tout seul. Mesuré le 20/10 :

- le numéro de la société du propriétaire, calculé juste, **est absent de la
  liste ouverte de la DGFiP et REFUSÉ par VIES** ;
- **des clés en LETTRE existent et sont actives** (`K…`), et un même SIREN
  peut porter DEUX numéros actifs. La formule ne les produit jamais.

> **Un numéro bien formé n'est pas un numéro attribué.** C'est le service
> des impôts des entreprises qui l'active ; tant qu'il ne l'a pas fait,
> l'imprimer sur un devis serait écrire un faux. D'où un contrôle, et pas un
> calcul — et la phrase n'en dit jamais plus : « numéro actif » est refusé
> par le contrôle, Opus dit « reconnu par VIES ».

#### VIES, mesuré avant d'écrire une ligne

| | relevé |
|---|---|
| statut HTTP | **toujours 200**, erreurs comprises |
| une réponse de la France | **8 à 13 s** (9,1 · 9,8 · 12,6 · 11,2) |
| la France saturée (`MS_MAX_CONCURRENT_REQ`) | **16 appels sur 19**, réponse en moins de 2 s |
| …pendant que `check-status` annonçait | « Available » — ce statut ne prédit rien |
| le site web (`GET`) quand la France est saturée | **`isValid: false`** : un refus apparent qui n'a rien vérifié |

> **Seul le code d'erreur dit la vérité, jamais `valid` seul.** Trois états,
> comme pour le SIRET : reconnu, refusé, et « je n'ai pas pu vérifier ». Et
> le délai de 8 s de la fonction `siret` aurait coupé TOUTES les réponses de
> la France : la fonction `tva` attend 20 s par essai.

#### La chaîne, et pourquoi chaque maillon est là

1. **La fonction Edge `tva`** (`verify_jwt` faux, comme `siret` : elle lit le
   jeton elle-même et répond en français). Toutes les issues partent en
   **HTTP 200** — la leçon de `ai` du 18/10. Dans l'ordre, sans jamais
   toucher VIES avant la fin : forme, clé, le compte, l'entreprise
   rattachée, « l'annuaire en publie déjà un » (`deja_publie`), « ce numéro
   est celui de VOTRE SIREN » (`autre_siren`), une preuve de moins de 24 h
   (`reconnu` sans rappel), un refus retenu, les limites, puis VIES —
   **quatre essais au plus** (pauses de 2, 5 et 10 s, 20 s par essai, 45 s
   en tout).
2. **`preuves_tva`** : une ligne par entreprise, que **personne d'autre que
   la fonction n'écrit** (aucun droit d'écriture pour `authenticated`).
   Lisible par son titulaire seul (`est_mon_entreprise`), rien pour `anon`.
   `emetteur_incomplet()` ne retire le motif `conso_tva_intra` que si la
   preuve existe ET porte le SIREN de l'entreprise rattachée.
3. **`compter_essai_tva()`** compte et décide dans le MÊME ordre : verrou du
   compte, puis de la ligne globale (24 par heure et par compte, 20 par
   minute pour tout Opus). **Les limites comptent les requêtes à VIES, pas
   les appuis** : un appui peut en coûter quatre, et c'est VIES qu'on
   ménage. Exécutable par `service_role` seul.
4. **Un refus est RETENU trois heures** (`tva-refus:`) : la même question ne
   repart pas. Les conditions de VIES rangent parmi les abus la répétition
   d'une même demande, et un abus fait bloquer l'adresse d'Opus
   (`IP_BLOCKED`) — c'est-à-dire VIES coupé pour TOUS les artisans.
5. **Les clés des compteurs sont des empreintes HMAC** : ni l'identifiant du
   compte, ni le numéro n'y sont en clair. Vérifié sur la vraie base.
6. **La date `reconnu_le` appartient à la BASE** (`tient_la_preuve_tva()`) :
   posée à l'insertion, et à chaque nouveau CONTRÔLE par la fonction
   (`current_user = 'service_role'`), jamais par un client. Une date envoyée
   à 2001 est ignorée.
7. **Une preuve `essai`** (pour les essais au navigateur) n'est acceptée que
   pour un compte `@exemple-opus.test`, et elle **s'imprime comme telle** :
   « preuve d'essai posée par Opus, non soumise à VIES ».

Et `local-prelude.sql` donne désormais `bypassrls` à `service_role`, comme
Supabase : sans lui, un essai de la fonction sur un PostgreSQL nu mesurait
la RLS au lieu de la fonction.

#### Ce qui s'imprime, et ce qui ne s'imprime PAS

Le numéro, oui. **La provenance « VIES », non** : l'avertissement juridique
de VIES ne couvre que l'usage « d'un utilisateur légitime (par exemple :
établir ses propres factures) », et rien n'établit encore qu'un devis imprimé
par un tiers y entre. À faire confirmer par un juriste, ou par TAXUD-VIESWEB
(`docs/A-FAIRE.md`).

#### Quatre défauts trouvés par la relecture, et pas à l'œil

1. **Le contrôle LISAIT la fonction, il ne la faisait pas tourner.** Sur
   23 failles remises à la main dans la fonction Edge, **22 passaient au
   vert** : le texte attendu y était toujours. `verifier-tva` lance désormais
   la VRAIE fonction dans un processus enfant (`--banc`), avec un faux VIES
   et une fausse base, et mesure ce qu'elle RÉPOND. Puis 90 sabotages, les
   90 refusés.
   > **Un contrôle qui lit le code d'une fonction réseau ne sait rien de ce
   > qu'elle répond.** Celui-ci est le premier du projet à exécuter une
   > fonction Edge.
2. **Les textes légaux disaient « ce n'est pas une décision d'Opus, c'est la
   réponse de l'administration fiscale ».** C'était faux : ne pas imprimer un
   numéro que VIES ne reconnaît pas est une RÈGLE D'OPUS, prise sur la
   réponse de VIES. Ils le disent maintenant, avec son effet sur les devis à
   des particuliers, et la phrase qu'il faut : **« Aucune vérification par un
   humain n'existe encore pour cette décision »** (RGPD, art. 22). Construire
   cette vérification est écrit dans `docs/A-FAIRE.md`, **avant que `STATUT`
   quitte `'essai'`**.
3. **Le quatrième essai à VIES était inatteignable** : les pauses et le
   délai dépassaient le budget avant lui. Un réglage qui promet quatre essais
   et en fait trois ; le banc l'a compté.
4. **Le bandeau « VIES met souvent de 10 à 30 secondes » restait affiché
   après la réponse.** Il est éteint par `occuperTva(false)`, et le contrôle
   le vérifie. (Un `useEffect` faisait la même chose et faisait monter le
   cliquet du linter : refusé.)

#### Deux pièges du déploiement, à ne pas redécouvrir

- **Aucune séquence `\u…` dans un fichier qu'on déploie par le connecteur.**
  Son transport JSON la change en vrai caractère : le fichier relu n'est plus
  celui du dépôt. `tva.js` construit ses séparateurs par
  `String.fromCharCode`, et `verifier-tva` refuse toute séquence `\u` dans les
  deux fichiers de la fonction.
- **La relecture octet pour octet se fait depuis le transcript**, pas en
  recopiant le fichier : la fonction relue par `get_edge_function` est
  comparée par empreinte SHA-256 au dépôt. Identique pour `index.ts` et
  `tva.js`.

Et un faux positif de mon propre contrôle : il cherchait « une écriture dans
`preuves_tva` » par `update`, et trouvait `for update` (le verrou de
`compter_essai_tva`). Il vise désormais `\bupdate public\.`.

#### Vérifié, et comment

`schema.sql` rejoué deux fois sur une base neuve, **46 valeurs attendues sur
46** dans `essais-section-48.sql` (15 refus, tous attendus), les autres
fichiers d'essais identiques à leur relevé d'avant, les **49 contrôles**, le
linter (32, tous antérieurs), les paquets iOS et Android lus. Le parcours en
démonstration au navigateur : les trois réponses de VIES (reconnu, saturé,
refusé), sans réseau.

Puis la migration appliquée sur la VRAIE base (sans un ordre qui commence
par `drop` ou `delete`), la fonction déployée en **version 1** et relue
identique, et deux comptes pro jetables à des SIREN fictifs (A, sans numéro
publié ; C, avec), supprimés par le chemin de l'application :

| | résultat |
|---|---|
| la clé publiable seule | **200**, `sans_compte` |
| une origine étrangère | **403** |
| saisie incomplète · clé fausse | `mal_forme` · `cle_fausse`, **sans VIES** |
| A demande le numéro d'une autre entreprise | `autre_siren` |
| C demande le numéro que l'annuaire publie déjà | `deja_publie` |
| **A, VIES pour de vrai** | **`refuse`, en 11,2 s** |
| …le même numéro, aussitôt | `refuse` en 1,6 s, `reessayer_a` trois heures plus tard — VIES n'est pas rappelé |
| les compteurs | trois lignes `tva-`, clés en **empreinte**, aucun identifiant en clair |
| A lit sa preuve / s'en écrit une / la modifie / la supprime | `[]` / **403** ×3 |
| un visiteur lit · appelle le compteur | **401** · **401** |
| C appelle le compteur · le déclencheur | **403** · introuvable |
| une preuve `essai` posée avec une date de 2001 | **date posée par la base** |
| ce qui manque à A, avant · après la preuve | 11 motifs dont `conso_tva_intra` · 10, sans lui |
| C lit la preuve de A · ce qui manque à A | `[]` · **OP011** |
| l'export RGPD de A · de C | `mon_numero_de_tva` · `null` |
| **au navigateur** : la fiche | « Preuve d'essai posée par Opus : ce numéro n'a pas été soumis à VIES » |
| …un autre numéro, « Faire contrôler par VIES » | le bandeau d'attente, puis **« VIES ne reconnaît pas ce numéro aujourd'hui »** ; la preuve d'essai reste |
| les journaux de la fonction | démarrages et arrêts seulement, aucun nom |

Ménage : 0 compte jetable, 0 preuve TVA, 0 entreprise d'essai. Restent deux
preuves SIRET `essai` (elles expirent d'elles-mêmes) et cinq compteurs `tva-`
sous empreinte (purgés plus d'un jour après).

**Ce qui n'a PAS été vérifié** :

- **le chemin `reconnu` par le vrai VIES.** Il faudrait un vrai numéro
  valide, et on n'en utilise jamais un pour un compte, même jetable. Il est
  tenu par le banc et par la démonstration ;
- rien sur l'iPhone ;
- **la vérification par un humain d'un refus** : elle n'existe pas encore.

**Et le numéro du propriétaire reste REFUSÉ par VIES.** Ce n'est pas un
défaut d'Opus : c'est à lui de le faire activer par son service des impôts
des entreprises (ou de le lire dans son espace professionnel), puis de
l'écrire dans « Mon entreprise → Votre entreprise ».

### Le chiffrage — lot 1 (20-23/10/2026)

Section 49 de `schema.sql`, `src/lib/devis.js`, `src/lib/file-ecriture.js`,
`src/screens/SaisieDevisScreen.js`, `npm run verifier-devis` et
`npm run mesure-devis`. Le cahier qui l'a guidé : `docs/CAHIER-LOT-1.md`
(archivé le 23/10 tel qu'il a servi ; en cas de désaccord, c'est cette
section et le code qui disent vrai). C'est sa version 2, du 21/10, réécrite
après la relecture de la version 1 (20/10) par trois critiques (droit, base,
écran), avec les réponses du propriétaire en tête. Deuxième lot de l'ordre
**T → 1 → P → S → 2** (`docs/PLAN-DEVIS.md` §10.14).

Un artisan ouvre « Mes devis », tape son chiffrage pièce par pièce, et
**chaque ligne s'enregistre quand il la quitte** ; le total — HT, la TVA par
taux, TTC — est **celui que la base a calculé**, jamais celui du téléphone.
**Rien ne sort** : aucun numéro, aucun PDF, aucune remise au client (lot 2
et suivants), et l'écran le dit en tête : « Chiffrage — ce brouillon ne part
pas encore. » Aucun paquet nouveau, aucun module natif : rien à reconstruire.

#### Ce qui est construit

**La base — section 49**, appliquée sur la vraie base le 22/10 :

- **trois tables PRIVÉES** : `devis` (un seul statut, `'brouillon'`),
  `devis_lignes`, et `devis_tva` (une ligne par taux), que **seule la base
  écrit** — le droit de table refuse avant la RLS. Rien pour `anon`. Un taux
  qui disparaît garde sa ligne, **remise à zéro** (`nb_lignes = 0`) : aucun
  corps de fonction ne contient d'ordre de suppression, que le connecteur
  refuserait ;
- **l'argent en entiers** : montants en centimes (`bigint`), quantités en
  millièmes de l'unité, taux en centièmes de point (`2000` = 20 %) ;
- **les deux arrondis, écrits UNE fois**, demi vers le haut :
  `devis_total_ligne` = `(q × p + 500) / 1000`, `devis_tva_de` =
  `(base × taux + 5000) / 10000`, une fois par taux sur la somme des bases ;
  hors des bornes, `NULL`, jamais une erreur 22003 en anglais ;
- **cinq types de ligne** : `zone` et `piece` (deux niveaux de titre),
  `poste`, `option` (**hors des totaux et de `devis_tva`**), `reserve` ;
  une ligne appartient au dernier titre qui la précède dans le tri
  `ordre, id` — le second critère départage deux lignes au même `ordre`,
  que PostgREST et JavaScript rangeraient sinon différemment ;
- **« Offert » est un drapeau qui met le TOTAL à 0 et GARDE le prix** : la
  valeur du geste reste écrite, pour que la facture puisse dire le prix
  avant la réduction (BOFiP BOI-TVA-DECLA-30-20-20-10 §220), et éteindre
  « Offert » fait revenir le prix. Un prix de 0 n'existe qu'avec « Offert » ;
- **la retenue de garantie** : son taux seul, vide = aucune, de 0,01 % à
  5 % ; sa phrase ne dit jamais « un an » sans « opposition » ;
- **`source`** (`'manuelle'`, `'demande'`, `'urgence'`) dit le geste et ne
  se récrit plus ; les trois liens (`client_id`, `quote_request_id`,
  `sos_request_id`) sont **facultatifs, indépendants, en
  `on delete set null`** (D1 à D4, D11) ;
- **cinq codes** : `OP013` (un lien vers ce qui est à un AUTRE), `OP014`
  (500 lignes au plus), `OP015` et `OP016` (la requête tardive), `OP017`
  (20 devis au plus par demande et par urgence) ; les 23 contraintes, toutes
  en `_check`, ont leur phrase dans `erreurs.js` ;
- **l'export RGPD** rend `devis_emis`, `devis_lignes`, `devis_tva`, et la
  clé `'devis'` devient **`'demandes_de_devis'`** : elle portait des
  DEMANDES, des deux côtés, pas des devis.

**Le calcul, dans des fichiers que `node` fait tourner** :
`src/lib/centimes.js` (`versCentimes` et `centimesLisibles`, déménagées
OCTET POUR OCTET d'`emetteur.js`, qui les réexporte, puis retouchées aux
étapes 4 à 7 pour accepter « ,50 » — sur un pavé décimal, on tape la
virgule d'abord, C7), `src/lib/devis.js`
(qui n'importe que `centimes.js` et `entreprise.js` — et, depuis le lot P,
`rapprochement.js`, qui n'importe rien), `file-ecriture.js` et
`identifiant.js` (qui n'importent rien). `supabase/cas-devis.json` porte
44 cas d'argent, joués par JavaScript ET par PostgreSQL.

**La file d'écriture** : une par devis, une requête en vol à la fois ; des
**identifiants choisis par le téléphone** (une création renvoyée après un
délai rend 23505 au lieu d'un doublon) ; une ligne s'INSÈRE une fois,
entière, puis ne se modifie que par `update` — **jamais d'`upsert`**, le
piège du lot T ; 8 s et une annulation sur chaque requête ; les totaux
**relus** dès que la file est au repos.

**Les écrans** : « Mes devis » sur le profil d'un pro ; la saisie, qui se
lit en liste, chaque ligne s'éditant dans une **carte qui prend l'écran**
(`CarteLigne`) ; un pied fixe qui porte le total ; « Pour qui ? »
(`ChoixClientDevis`) ; **« Faire un devis »** depuis une demande de devis ou
une urgence acceptée (jamais un rappel), et depuis la fiche d'un client, qui
montre « Ses devis ». `legal.js` passe à `VERSION = '2026-10-22'`.

#### Les réponses du propriétaire, le 21/10

| question | réponse |
|---|---|
| Q1 — au régime réel, le taux se choisit-il ligne par ligne ? | **oui, dès le lot 1** : 20 %, 10 %, 5,5 %, **rien de pré-coché** sur la première ligne ; la suivante reprend le taux de la précédente du même TYPE (précisé par la relecture) |
| Q2 — d'autres unités ? | **« jour » ajoutée** : sept clés, `m2`, `m`, `m3`, `u`, `h`, `jour`, `forfait` ; la pastille dit « m linéaire », jamais « ml », qu'on lit « millilitre » |
| Q3 — une remise ? | **sur le TOTAL, au lot 2, avant le PDF**, répartie entre les taux au centime près par une règle écrite (sans elle, 334 au lieu de 333). Le lot 1 ne pose **aucune** colonne de remise : `devis_tva`, recalculée en entier, l'accueillera sans réécrire un devis |
| Q4 — des primes déduites ? | **jamais** |
| Q5 — quel compte sur l'iPhone ? | **son compte principal** (« oui mon compte principal c'est bon ») |

L'essai sur l'iPhone se fait dans le build de développement ou dans Expo Go
— le lot n'ajoute aucun module natif ; Expo Go ne l'ouvre plus depuis le 25/10,
voir « Expo Go ne peut plus ouvrir Opus » —, **jamais dans l'icône « preview » du
17/10**, qui porte le code d'avant. Dix questions l'attendent dans le cahier
(§7.6).

#### Une requête arrivée en retard n'écrase jamais une plus récente

La file annule une requête qui dépasse son délai, mais **l'annulation
n'arrête que ce que le serveur n'a pas encore reçu**. Une requête reçue dont
la réponse se perd (téléphone en veille, Wi-Fi qui change) s'exécute quand
même ; passée APRÈS la suivante, une ancienne valeur écrase la nouvelle, une
ligne retirée revient — comptée, invisible —, une suppression emporte une
ligne remise. Aucune erreur.

> **Un ordre de passage ne se répare que là où les requêtes passent : dans
> la base.**

D'où une **horloge par devis** (49.5 bis) : une colonne `generation` sur
`devis` et `devis_lignes`. Chaque écriture porte un numéro qui ne fait que
monter (le plus grand entre le précédent + 1, l'horloge lue + 1, et l'heure
du téléphone en millisecondes) ; une ligne dont le numéro ne dépasse pas
l'horloge est refusée **sous le verrou du recalcul** (`OP015`) ; un numéro
absent ou hors de 1 à 2^53 − 1 est refusé par `OP016`, qui dit « mettez Opus
à jour ». Une suppression ne porte pas de valeur : le téléphone la
**conditionne** (`generation < N`). Prouvé à deux sessions :

| scénario | sans la parade | avec |
|---|---|---|
| modification tardive (n° 12, 50 €) qui attend le verrou de la récente (n° 13, 60 €) | 50 € gagne | **OP015**, 60 € gardé |
| insertion tardive d'une ligne retirée | elle revient | **OP015** — et sans la levée de l'horloge avant la suppression, elle revient |
| suppression tardive d'une ligne retouchée | elle part | rien de supprimé |
| en-tête « Ancien » (61) arrivé après « Nouveau » (62) | « Ancien » gagne, l'horloge RECULE | **OP015** |

Le contrat vaut pour tout ce qui écrira dans ces tables : **un ordre = une
ligne**, **une migration qui récrit un devis fait monter son horloge**,
**jamais d'`upsert`**. Non couverts, et dits : la CRÉATION d'un devis
arrivée après sa suppression, deux appareils (le dernier gagne), l'heure du
téléphone reculée entre deux sessions.

#### `for no key update`, et pas `for update` — l'interblocage mesuré

Le recalcul verrouille le devis. `for update` **interbloque** : une
insertion de ligne passe d'abord par la vérification de sa clé étrangère,
qui pose `for key share` sur le devis, et `for update` lui est incompatible — deux
insertions dans le même devis s'attendent l'une l'autre. `for no key update`
ne gêne pas `for key share` et sérialise quand même deux recalculs. Mesuré
avec un déclencheur témoin qui élargit la fenêtre
(`essais-section-49-temoin.sql`, jamais dans `schema.sql`) :

| | résultat |
|---|---|
| sans verrou | **HT 1000** : deux lignes enregistrées ensemble, une oubliée |
| `for update` | **deadlock detected** (40P01) |
| `for no key update` | HT 2000 |
| plafond de devis par demande, sans verrou · avec | **21** · 20, puis `OP017` |

> **Un plafond se compte SOUS le verrou**, sinon deux insertions simultanées
> comptent chacune 499. Compté dans le déclencheur de la ligne, `OP014`
> coûtait 9,7 s pour 500 lignes et laissait passer une 501ᵉ (mesuré).

Un interblocage reste, et il est dit : modifier une ligne verrouille la
ligne puis le devis, supprimer le devis l'inverse. PostgreSQL annule l'un
des deux en entier, et la file retente un 40P01 une fois.

#### Une clé étrangère ne regarde pas la RLS — `OP013`, sans oracle

Sans garde, un artisan rattachait à son devis la fiche client d'un AUTRE
(mesuré : `INSERT 0 1`). **Une vérification de clé étrangère ignore la
RLS** : elle dit que la ligne existe, pas qu'elle est à vous.
`tient_le_devis()` refuse un lien vers une fiche, une demande ou une urgence
qui n'est pas la sienne, **avec le même refus pour « pas à vous » et
« n'existe pas »** : aucun oracle par 23503. Et elle ne lit jamais
`auth.uid()` : pendant une cascade `set null`, mesuré, `current_user` vaut
`postgres` et `auth.uid()` est celui de QUELQU'UN D'AUTRE.

Ce qui reste un oracle, dit plutôt que promis : l'identifiant d'un devis
d'autrui renvoyé à la création rend 23505 — on apprend qu'il existe, rien
d'autre, et un UUID v4 ne se devine pas.

#### Un tiers ne doit pas pouvoir bloquer le droit à l'effacement — `OP017`

Mesuré par la relecture de sécurité : un artisan à qui un particulier a
écrit rattachait, par un client modifié, **100 000 brouillons** à sa demande
et à son urgence. Quand ce particulier supprimait son compte, chaque devis
passait à vide, la suppression dépassait les **8 s** de la vraie base, et
l'application parlait de réseau.

> **Une clé `on delete set null` fait payer la suppression à celui qui
> supprime.** D4 interdit l'UNICITÉ (un client a plusieurs projets), pas une
> borne : **20 devis** par demande, 20 par urgence, comptés sous un verrou
> consultatif — un nombre à confirmer avec le propriétaire.

Et l'erreur 57014 (le délai de 8 s) n'est plus prise pour une coupure
réseau : `erreurs.js` dit que rien n'a été enregistré.

#### Une politique RLS se paie PAR LIGNE, et elle ne trie pas

Écrites `est_mon_entreprise(pro_id)`, les politiques appelaient la fonction
deux fois par ligne de devis — une fonction qui porte `set search_path`
n'est jamais « dépliée ». Avec **100 000 lignes à soi**, l'export RGPD
prenait **10,6 s** et la mémoire des prix 7,6 s : au-delà des 8 s, l'export
échouait en entier. `pro_id in (select public.mes_entreprises())`, une
sous-requête NON corrélée calculée une fois par requête : **2,25 s** et
**55 ms**. `est_mon_entreprise()` reste la seule à DÉCIDER.

> **La première mesure n'avait fait varier que les lignes des AUTRES.**
> Elle ne disait rien du coût des siennes — la famille de « mesurer avec
> SEPT éléments ne prouve rien » du lot 4.

**La mémoire des prix** (les lignes déjà écrites, avec leur dernier prix,
jamais une moyenne) ne se fie pas à la RLS pour trier : laissée à elle
seule, la lecture parcourt les lignes de TOUS les artisans avant d'écarter
celles des autres. Filtrée par ses devis côté base
(`devis:devis_id!inner(…)` et `devis.pro_id=eq.…`) : **2,0 ms contre
29,8 ms** sur une distribution réaliste. Et l'objet d'un devis venu d'une
demande est le texte d'un AUTRE client : une suggestion qui en vient se
nomme par sa date (« votre devis du 12/10/2026 ») — à confirmer avec le
propriétaire.

#### Ce que tient la base, ce que tient l'écran

**La base tient ce qui compte** : totaux et ventilation (recalcul complet,
jamais un incrément), liens, horloge, plafonds. Le téléphone n'envoie que
les colonnes que l'artisan écrit. Vérifié sur la vraie base : un total
envoyé à la main est accepté (204) et **ignoré** — le total relu est le
vrai, 105,60 €.

**L'écran seul tient le régime de TVA**, et c'est écrit : en franchise,
aucun taux et la mention de franchise ; au réel, trois taux ; non déclaré,
des titres et des réserves seulement. Aucune fonction de la section 49 ne
lit `emetteur` : la base accepte une ligne chiffrée quel que soit le régime.
Sans danger tant que rien ne sort ; **le refus de remise du lot 2 le
tiendra**.

> **Le régime a cinq états, et un échec n'est JAMAIS « non déclaré ».** Le
> dire sur une lecture ratée enverrait l'artisan redéclarer ce qu'il a déjà
> déclaré.

Deux pièges de forme, trouvés en les éprouvant :

- **quand une valeur viole deux contraintes, la base nomme la première dans
  l'ordre ALPHABÉTIQUE.** Écrite `prix > 0 or offert`, la contrainte
  d'« Offert » attrapait un prix NÉGATIF avant celle du prix : l'écran
  aurait répondu « un prix de 0 s'écrit avec Offert » à « −1 ». Elle
  s'écrit `prix <> 0 or offert` (prouvé sur PostgreSQL 16) ;
- **trois lectures en parallèle ne font pas un instantané** : un HT de
  100,00 € au-dessus de lignes qui en font 300,00 €, quand une ligne
  s'écrivait entre deux (mesuré). `unDevis()` lit tout en UNE requête.

#### Ce qui n'est pas parti se VOIT — et une seule garde

Une rangée non enregistrée dit **« Non enregistrée — Réessayer »**, et le
pied garde **la dernière valeur sûre** de la base en disant combien de
lignes ne sont pas enregistrées. Sur une coupure franche l'état arrive tout
de suite ; la file n'attend ses 8 s que si la requête ne revient pas. **Mais
8 s n'est pas un plafond** : si la carte est fermée pendant l'envoi, la même
version part deux fois, et « Non enregistrée » n'est apparu qu'à **13,8 s**
(mesuré en démonstration à l'étape 7, sur une écriture qui ne revient pas,
simulée).

Rien ne quitte la saisie sans **la garde de sortie** : elle attend la file
huit secondes au plus, se voit dès l'appui (« Enregistrement avant de
partir… »), et distingue la ligne incomplète, le champ d'en-tête refusé, la
ligne en cours d'envoi et la ligne refusée.

> **Une garde se tient par une PROPRIÉTÉ, pas par une liste de portes.** Le
> cahier en comptait cinq ; la relecture de l'écran a trouvé la sixième —
> « Nouveau client », un nom déjà pris, « Ouvrir sa fiche », « Faire un
> devis » —, qui démontait la saisie sans garde : deux lignes perdues sans
> un mot. Le contrôle exige désormais que **toute** fonction d'`OpusApp` qui
> démonte ou pose la saisie attende `quitterSaisieDevis()`.

Même famille : une relecture de « Mes devis » ratée **vidait la liste déjà
lue** ; elle la garde désormais, et une liste jamais lue dit « Lecture
impossible », jamais « Aucun devis ».

#### Un contrôle de texte ne voit pas toutes les formes du SQL

Au second tour de relecture de la base, **treize formes** échappaient aux
contrôles qui lisent le texte, **onze avec un dommage prouvé** — dont un
déclencheur `security definer` posé sur `clients` qui écrivait dans
`devis_lignes` (B ajoutait une ligne au devis de A), que personne ne voyait.

> **La preuve de sécurité est l'essai, qui interroge le catalogue de la base
> rejouée** : droits de table et de colonne, corps de fonction, vues et
> règles, déclencheurs, et **deux listes fermées de fonctions
> `security definer`** (24 appelables, 27 non), que toute section future
> met à jour avec sa raison. Mais l'essai ne tourne qu'à la main :
> `npm run verifier` ne joue aucun SQL (`docs/A-FAIRE.md` §2.3).

#### La migration sur la vraie base, et ses pièges

**Construite, pas recopiée** : un script (hors du dépôt) PREND chaque objet
dans `schema.sql` — la section 49, `mes_donnees()` réécrite, le balayage de
la section 43. Les 23 paires `drop constraint` + `add constraint` deviennent
un `add` **sous condition** (`pg_constraint`) dans un bloc `do`, les 3 paires
de politiques un `create policy` sous condition (`pg_policies`) ; aucun ordre
ne commence par `drop`, `delete` ou `truncate`, et le script le compte. En
tête, **`set local lock_timeout = '5s'`** : une écriture qui tiendrait un
verrou sur `professional_profiles`, `clients`, `quote_requests` ou
`sos_requests` fait échouer la migration au lieu de faire attendre
l'application derrière elle.

**Simulée sur une IMITATION de la vraie base** : `git show
5897ef3:supabase/schema.sql`, rejoué deux fois, comparé à la vraie base par
une **empreinte du catalogue** (colonnes et défauts, contraintes,
politiques, déclencheurs, index, droits, RLS) — identique aux restes connus
près, 82 fonctions de chaque côté. La migration y passe deux fois ;
l'empreinte obtenue est celle d'une base neuve au schéma du jour
(**1 321 lignes identiques**), et l'essai 49 y rend 169 valeurs sur 169.

**Relue avant d'être appliquée** (fidélité : 90 ordres attendus, 90 reçus ;
production Supabase ; transport). Deux constats corrigés AVANT : la
simulation du transport était naïve, et l'essai 49 ne voyait pas une classe
du code postal abîmée — la seule ligne de `schema.sql` écrite avec deux
barres obliques inverses. Et par prudence, un commentaire DANS le corps de
`recalcule_devis()` qui commençait par « delete » a été reformulé : le
connecteur lit le TEXTE (commit `b1926d9`).

**Appliquée le 22/10 vers 23 h 43** (heure de Paris), par `apply_migration`,
validée par le propriétaire dans la fenêtre du connecteur. **Relevé après,
en lecture seule** : les 17 groupes d'empreinte des trois tables identiques
au caractère près à la simulation ; 89 fonctions de chaque côté (hors
`admin_basculer_metier`), mêmes droits ; les md5 des 8 corps nouveaux ou
réécrits, identiques ; aucune fonction de déclencheur appelable par `anon` ou
`authenticated`.

**Les avertissements des commits `fde72f9` et `b1926d9` — ne pas mettre
cette version sur le téléphone, ne pas faire `git pull` avant la migration —
ne valent plus depuis ce soir-là** : « Mes devis » trouve ses tables. Un
message de commit ne se récrit pas ; c'est ici qu'on dit qu'il a vieilli.

#### Le transport du connecteur, ÉTABLI le 22/10

Les lots 0a et T avaient noté qu'une séquence `\u00a0` envoyée par le
connecteur arrive en vrai caractère. C'était vrai, et incomplet :

> **Le connecteur change un `\uXXXX` en caractère SEULEMENT si sa barre
> n'est pas elle-même échappée.** `\t`, `\r`, `\n` arrivent tels quels ;
> une paire `\\` arrive telle quelle. n barres suivies de `uXXXX` : n
> impair, n − 1 barres et le caractère ; n pair, la suite reste intacte.

Relevé avant (les octets de `tient_les_tarifs`), sondé par la relecture,
**confirmé après application** : les md5 des 8 corps sont ceux de la
simulation faite avec cette règle (30 séquences changées, 7 paires de barres
intactes). D'où un constructeur qui écrit **deux fichiers** : ce qu'on
ENVOIE, et ce que la base RECEVRA — c'est le second qu'on simule.

> **L'outil d'édition de ces sessions a fait la MÊME chose.** Aux étapes 0
> à 2 (21/10), 41 séquences `\u00a0` écrites dans `devis.js` et
> `verifier-devis.mjs` sont devenues des caractères invisibles, réécrites
> ensuite en séquences ; et le cahier lui-même portait trois passages ainsi
> changés, rendus sous leur forme écrite à son archivage (en-tête de
> `docs/CAHIER-LOT-1.md`). Un caractère invisible ne se voit pas à l'œil :
> **après avoir écrit une barre oblique inverse, on relit les OCTETS**
> (`od -c`).
>
> Reconstaté le 22/10, en ajoutant les deux cas de l'essai 49 : le texte
> CHERCHÉ par l'outil d'édition, qui contenait `E'13\u202f410'`, a été changé
> lui aussi, et l'édition a échoué faute de le trouver. Elle est passée par
> un petit script Python qui écrit la barre par `chr(92)`.

#### Vérifié, et comment

Avant la vraie base : `schema.sql` rejoué deux fois sur une base neuve
(0 erreur) ; `essais-section-49.sql` joué deux fois — **169 valeurs justes
sur 169, 74 refus** rattachés à leur annonce —, dont les 44 cas d'argent par
PostgreSQL, **0 écart** avec JavaScript ; les 24 autres fichiers d'essais
identiques au relevé d'avant, hors l'essai 43 (attendu) ; **les 50
contrôles**, dont `verifier-devis` (292 ✔) ; le linter à 32 ; les paquets
iOS et Android lus ; **`npm run mesure-devis`** au navigateur, en vrais
événements tactiles, 186 mesures sans échec (il lui faut un serveur : il
n'est pas dans `npm run verifier`). Des relectures adverses à chaque étape,
chaque problème qui se fait tourner **reproduit avant d'être corrigé** — les
autres (des textes, VoiceOver, quelques points lus dans le code) seulement
relus, et les comptes rendus le disent —, puis 88, 138 et 75 sabotages,
chacun conforme à l'attendu.

Puis sur la VRAIE base, par le chemin de l'application : un artisan
plaquiste A **à Brest**, un concurrent B, un particulier P, jetables
`…@exemple-opus.test` ; les deux preuves SIRET `essai` déjà en base (SIRET
fictifs) **réutilisées**, avec l'accord du propriétaire ; un `.env` posé
pour l'essai puis retiré ; des routes coupées à la demande, les appuis en
vrais événements tactiles :

| | relevé |
|---|---|
| A, sans régime déclaré | seulement Pièce, Zone, Réserve ; aucune écriture tant que rien n'est tapé |
| la lecture du régime coupée | au bout de 6,9 s (4 essais), « n'a pas pu être lu… Réessayer » — **jamais « non déclaré »** |
| A déclare le réel depuis le bandeau | `POST emetteur 201` ; au retour, sans recharger, « Poste » est actif, **aucun taux pré-coché** |
| une pièce, quatre postes à deux taux, une réserve, une option, un « Offert » | `POST devis 201` **une fois**, un `POST devis_lignes 201` par ligne, un `PATCH` par changement ; **aucun en double, aucun upsert** |
| le total | écran : HT 1 336,50 €, TVA 20 % 92,30 €, TVA 10 % 87,50 €, TTC 1 516,30 € ; base : 133650 / 17980 / 151630 ; `totauxDevis()` sur les lignes relues : **identique au centime** |
| après rechargement complet | 1 516,30 € ; « 1 forfait × 150,00 € — Offert » |
| une ligne retirée | « TVA 10 % » quitte l'écran ; en base, sa ventilation reste **à zéro** |
| « 0 » dans un prix sans « Offert » | **aucune requête**, et la phrase qui renvoie à « Offert » |
| l'écriture d'une ligne coupée | « Non enregistrée — Réessayer », le pied à la dernière valeur sûre ; la barre du bas → la garde, **l'écran ne part pas** ; « Réessayer » → `POST 201` |
| la mémoire des prix | la requête porte `!inner` et `devis.pro_id` ; 0,28 à 0,54 s à travers le mandataire ; 7 lignes, toutes de A ; B, même filtre : `[]` |
| A passe en franchise | la bande de cohérence ; **aucune écriture** sur les tables du devis |
| P demande un devis, A l'accepte, « Faire un devis » | rien d'écrit avant la première ligne ; puis `source = 'demande'`, le lien, aucun client ; une seconde fois : « Reprendre le brouillon le plus récent » rouvre **le même** |
| A supprime la fiche du client | l'avertissement dit que ses 2 devis resteront ; `DELETE 204` ; ils **restent**, seul `client_id` passe à vide |
| un visiteur sur les trois tables | **401 · 42501** ×3 |
| B, juste après que A a lu son devis | `[]` ×3 ; une ligne chez A : **403** ; modifier, supprimer : 204 et **rien de changé** |
| A écrit `devis_tva` · envoie un total à la main | **403 · 42501** ×3 · 204, total relu **vrai** (105,60 €) |
| la fiche de B · une demande inventée | **400 OP013** · **400 OP013**, jamais 23503 |
| retenue de 501 · `id` déjà pris · écriture plus ancienne que l'horloge · ligne sans numéro | `devis_retenue_check` · **409** 23505 · **400 OP015** · **OP016** |
| 500 lignes d'un coup dans un devis qui en a 1 · 21ᵉ brouillon pour une demande | **OP014** en 612 ms, aucune insérée · **OP017** |
| l'export RGPD de A | `devis_emis` 3, `devis_lignes` 9, `devis_tva` 4 (le taux à zéro compris), `demandes_de_devis` 1, **clé `devis` absente** |
| « Mes devis », lecture coupée | au bout de 6,7 s, « Lecture impossible » — **jamais « Aucun devis »** |
| P supprime son compte | le devis de A **reste**, le lien vide, objet, lieu et total intacts (D3) |
| la phrase des textes légaux (« le seul artisan qui y tient un carnet ou y prépare des devis… ») | **relue en base après le ménage** : vraie |

Ménage : A et B supprimés par le chemin de l'application, comme P avant eux ;
base revenue à 14 comptes / 8 fiches / 21 publications / 1 client /
6 demandes de devis / 3 entreprises / 1 fiche émetteur / **0 devis, 0 ligne,
0 ventilation** / 18 notifications / 5 conversations, aucun compte
`@exemple-opus.test`, les deux SIREN d'essai non réservés. Les deux
preuves `essai` restent (elles expirent d'elles-mêmes) : le connecteur
refuse un `delete`.

#### ESSAYÉ SUR L'IPHONE le 23/10/2026

Par le propriétaire, sur son compte principal (Q5), dans Expo Go ou le build
de développement : « tout me paraît correct », puis « tout fonctionne ». Il
n'a pas détaillé les treize questions de `docs/A-FAIRE.md`.

Ce que la base en dit, relevé par sa FORME seulement (aucun texte, aucun
prix lu) : un brouillon créé à 19 h 17, source `manuelle`, six lignes
(`piece` et `poste`, en `m2` et `forfait`), deux taux. **Les six
identifiants sont des UUID v4 choisis par le téléphone** : la preuve que
`globalThis.expo.uuidv4` existe bien dans son application, ce qui n'était
que DÉDUIT du code d'Expo. L'horloge d'écriture est en millisecondes, comme
prévu. **Aucune quantité n'a de décimale** : la virgule du pavé décimal
(« 2,5 ») n'est donc pas prouvée par ce brouillon.

#### Ce qui n'a PAS été vérifié

- **le détail du toucher sur l'iPhone** (essayé en bloc le 23/10, ci-dessus,
  sans réponse point par point) : le clavier (ce qui reste visible au-dessus
  d'une carte, le pied caché pendant la frappe, les pastilles sous le pavé
  numérique), la virgule du pavé décimal, le pavé numérique du code postal
  du lieu, le pouce sur les rangées et sur le « Faire un devis » de « Pour
  moi » (son `hitSlop`, que le navigateur ignore), les chiffres tabulaires
  d'Inter, **VoiceOver** sur la carte, et **le curseur gardé en touchant la
  barre du bas avec un champ d'en-tête refusé** (au navigateur, le toucher
  retire le curseur) ;
- **Hermes** : le calcul et la file n'ont tourné que sous `node` 22 ;
  l'annulation d'une requête n'a pas été éprouvée sur le téléphone ;
- le correcteur du clavier sur le jargon (« placo », « BA13 ») ;
- **une réponse réellement perdue sur un réseau de chantier** : seules la
  coupure franche au navigateur, deux sessions sur PostgreSQL et une écriture
  envoyée à la main sur la vraie base l'ont jouée ;
- **le plan que PostgREST tire de `!inner`** : sur la vraie base, la requête
  et son temps sont relevés, pas son plan ;
- **la relecture de sécurité du second tour de la base n'a jamais été
  rendue** (conteneur redémarré) ; ses deux importants du premier tour sont
  corrigés et mesurés ;
- **un vrai devis d'un vrai artisan** : il n'en existe aucun.

#### Ce qui reste ouvert

Dans `docs/A-FAIRE.md`, « Après le lot 1 » : c'est là qu'est la liste
complète. Ce que les comptes rendus laissent ouvert, en bref :

- les dix questions de l'essai sur l'iPhone (cahier §7.6) ;
- à confirmer avec le propriétaire : le plafond de 20 devis par demande,
  l'origine d'une suggestion par sa date, le titre de pièce écrit deux fois
  (et les deux retours) quand une carte est ouverte, « Choisir dans mon
  carnet » sur deux lignes à 320 points (C6), la pastille qui revient à
  « À traiter » au retour d'un devis ouvert depuis « Pour moi » ;
- au lot 2 : la remise sur le total ; le refus de remise, qui tiendra le
  régime ; en franchise, le « Total » additionne encore la TVA des lignes
  qui en portent (une bande le signale) ; le recalcul ligne par ligne quand
  un gros compte part (1,6 s pour 100 000 lignes), à remesurer ;
- au juriste : l'assiette de la retenue et une retenue sur un paiement
  unique ; la qualification d'un « Offert » ; ce qu'un franchisé écrit à la
  place de « HT et TTC » ; le taux horaire TTC face à un prix HT ; le taux
  d'une ligne de frais de déplacement sur un devis à deux taux ;
- au lot S : le `truncate` de `clients`, un blocage qui ne cache pas une
  demande déjà reçue, la classe de blancs recopiée sept fois dans quatre
  fonctions SQL (`tient_les_tarifs`, `tient_les_tarifs_publics`,
  `tient_le_devis`, `tient_la_ligne_de_devis`) — huit dans cinq depuis le
  lot P, avec `tient_le_poste` —, plus deux constantes
  JavaScript (`BLANCS_TARIFS`, `BLANCS`) — `verifier-devis` les compare —,
  l'artisan qui peut récrire la demande qui lui est adressée ;
- « jour » n'est dans aucun cas de `cas-devis.json` ; une ligne de « Mes
  devis » déjà chargée ne se relit pas en rouvrant l'écran ; les essais SQL
  ne tournent qu'à la main ; et la ré-acceptation des CGU n'existe toujours
  pas, alors que `VERSION` a encore changé.

### La base de postes — lot P (23-25/10/2026)

Section 50 de `schema.sql`, `src/lib/rapprochement.js` (la clé),
`src/lib/postes.js` (ce que les écrans décident), `src/components/FeuilleAjoutPoste.js`,
`src/components/FeuillePoste.js`, `src/screens/PostesScreen.js`,
`npm run verifier-postes` et `npm run generer-rapprochement`. Le cahier qui
l'a guidé : `docs/CAHIER-LOT-P.md` (archivé le 25/10, avec en tête ce qui a
changé depuis). Troisième lot de l'ordre **T → 1 → P → S → 2**
(`docs/PLAN-DEVIS.md` §10.14 et 10.17). **Aucun paquet nouveau, aucun module
natif : rien à reconstruire** — le build de développement suffit (Expo Go ne
peut plus ouvrir Opus depuis le 25/10, voir « Expo Go ne peut plus ouvrir
Opus »), jamais l'icône « preview » du 17/10.

Un artisan qui a écrit une ligne de devis touche **« Ajouter à ma base »** :
la phrase est rangée **mot pour mot**, avec son unité, et un **prix de
référence** qu'il fixe (proposé depuis la ligne, modifiable, ou laissé vide).
Ensuite, quand il tape une ligne, Opus lui propose ses phrases — **une par
poste, trois au plus** (la même phrase au m² et au mètre linéaire, ou avec et
sans fourniture, fait deux postes, et deux propositions qui le disent). Dans
la ligne ouverte en grand, **au-dessus** de la quantité et du prix : « Votre
prix de référence : 75,00 € / m², fixé le … » — pour être lu avant de taper
le prix ; et **sous** le prix, s'il met autre chose : **« Vous mettez 60,00 €
— c'est voulu ? »**. Une phrase discrète, jamais une fenêtre, jamais un
refus : le prix de la ligne est le sien. « Ma base de postes » (depuis « Mes
devis » et « Mon profil ») les liste, les cherche, les corrige, les retire.
**Rien ne sort** : aucun client ne voit la base, et aucun écran ne la montre à
quelqu'un d'autre que lui.

#### Les réponses du propriétaire

| le 23/10 | réponse |
|---|---|
| construire le lot P ? | **oui** — « non on construit le lot p », alors qu'il avait d'abord cru que la mémoire du lot 1 le faisait déjà |
| les variantes | **mot pour mot** : « il faudrait arriver à reconnaître les phrases, parce que l'artisan pour le même travail a par exemple rajouté un s ; il ne faut pas qu'il y ait trop de propositions, ça pourrait nous perdre » |
| comment un poste entre dans la base | **d'un appui** (« Ajouter à ma base »), choisi parmi deux options ; la mémoire du lot 1 continue de tout retenir seule |
| Q1 à Q4 — quatre choix **annoncés par défaut** (« dis-moi si l'un ne te va pas »), **acceptés sans objection** | **aucun métier** sur un poste ; **le prix de la ligne proposé** comme référence, modifiable ; la référence **seulement dans la ligne ouverte en grand**, jamais dans la liste du devis (un client qui regarde l'écran ne la voit pas) ; un poste **naît d'une ligne de devis**, jamais directement dans « Ma base » |

| le 25/10, juste avant la migration | réponse |
|---|---|
| A — « 10cm » et « 10 cm », une seule phrase ? | **non, deux** |
| B — de deux variantes d'une même phrase, laquelle proposer ? | **la plus récente** |

#### Reconnaître une phrase, sans IA : la clé de rapprochement

Deux phrases sont **la même** si elles ne diffèrent que par les majuscules,
les accents, les **espaces en trop**, la ponctuation (qui compte comme une
espace : « pré-cadre » et « pré cadre » sont la même phrase, pas
« précadre ») et le **s ou le x final** de chaque mot de trois lettres et
plus — un pluriel le plus souvent, mais la règle ne le sait pas : « prix » a
la même clé que « pri ». « Chape sèche », « CHAPES SECHES. » et la même
phrase recopiée d'un PDF ont la même clé. **La clé ne s'affiche nulle part** :
elle sert à rapprocher, et la phrase reste rangée telle qu'il l'a écrite —
c'est elle que le client lira.

Ce qu'elle ne rapproche PAS, à dessein :

- **une autre formulation** (« création d'une dalle béton » / « dalle en béton
  à couler ») : c'est l'agent, plus tard ;
- **« plancher bas » et « plancher BA »** (le béton armé, un autre prix) :
  « bas » garde son s, c'est la seule exception ;
- **les signes qui portent un sens** : `<` devient « inf », `>` « sup », `+`
  « plus » (« plu » une fois le s final retiré, comme le mot écrit), `%`
  « pourcent », `€` « euro », `×` la lettre x — « déplacement < 20 km » et
  « > 20 km » restent deux postes ;
- **« 10cm » et « 10 cm », « BA13 » et « BA 13 »** : une espace entre des
  lettres et des chiffres fait deux phrases (réponse A) ; et « travaux » /
  « travail », dont le pluriel ne se fait pas en s.

> **Une règle, deux écritures, et l'une est ENGENDRÉE.** Le téléphone et la
> base doivent calculer la même clé, sinon l'écran dirait « nouveau poste »
> et la base refuserait un doublon (ou l'inverse), sans un mot. La fonction
> SQL `cle_de_rapprochement()` n'est jamais écrite à la main : `npm run
> generer-rapprochement` la produit depuis la table de `rapprochement.js`,
> comme le SQL du catalogue des métiers. `verifier-postes` compare 188 cas
> écrits à la main (`supabase/cas-rapprochement.json`) et une **empreinte**
> calculée sur chaque point de code : plan de base
> `f7d1ccf4d41f431c125dc9ba2b46bf09`, tout Unicode
> `a4c49da5c8af9023455882d4de7c6152`, identiques des deux côtés.

Trois choix qui tiennent cette parité, et qu'il ne faut pas « simplifier » :

- **ni `normalize`, ni `toLowerCase`, ni `Intl`, ni `lower()` côté SQL** :
  les tables Unicode et les règles de casse diffèrent entre Hermes et
  PostgreSQL, et selon leur version et leur langue (le I turc). La règle
  n'est faite que d'une table explicite, chaque caractère nommé ;
- **`rapprochement.js` est en ASCII pur, commentaires compris**, et la
  fonction SQL ne contient **aucune barre oblique inverse** (la table écrite
  en `chr(n)`) : sous `standard_conforming_strings = off`, une barre dans la
  fonction changeait « Pose des plinthes » en caractères de contrôle ;
- **une garde de 2 000 points de code** en tête de la fonction ET du
  miroir : sans elle, 10 Mo envoyés par n'importe quel compte connecté
  tenaient un processus 39 s malgré le délai de 8 s.

#### Une colonne générée, sous un déclencheur `before update`, se recalcule à CHAQUE écriture

Premier jet : `cle_rapprochement` en colonne générée. Trouvé par la relecture
de la base, puis reproduit avant correction, 999 postes au pire cas : **un
seul ordre qui change le prix de ces 999 postes prenait 60 s** (999 calculs
de la clé), et supprimer leur devis d'origine (la clé étrangère passe à vide)
**59,5 s**. La raison : la table porte un déclencheur `before update`, et
PostgreSQL recalcule alors toute colonne générée stockée à chaque mise à jour
de la ligne, même quand la phrase ne bouge pas (sans déclencheur, il saute
celles dont aucune source ne change) ; et une fonction qui porte
`set search_path` n'est jamais dépliée.

> **C'est une colonne ORDINAIRE, posée par le déclencheur
> `tient_le_poste()`** : à l'insertion, et en modification **seulement si la
> phrase change**. Après : 90 ms pour le même ordre de prix, 97 ms pour la
> cascade. Un client qui envoie une clé fausse reçoit toujours **428C9** (le
> code d'une colonne générée, que `erreurs.js` traduit par « mettez Opus à
> jour »), et la seule écriture acceptée est son recalcul exact. La propriété
> est tenue par un corps de fonction et non plus par le catalogue : l'essai et
> `verifier-postes` la lisent.

Et le contrat qui va avec : **remplacer la fonction ne change AUCUNE clé
rangée.** Toute révision de la règle se fait en une transaction qui verrouille
la table, remplace la fonction et recalcule les clés, après avoir cherché les
doublons qu'elle créerait (section 50.0).

#### Un caractère qui ne se voit pas ne fait pas une autre phrase

Toute la propriété Unicode « Default_Ignorable » — **4 174 points de code**,
dont la plage U+E0000–U+E0FFF (4 096 points, presque tous réservés : 97
étiquettes et 240 sélecteurs de variante y sont attribués) — est retirée par
la clé ; et U+2800, le motif braille vide, devient un séparateur. Avant, les
invisibles courants (U+200B, U+FEFF…) l'étaient déjà, mais la même phrase
suivie d'un U+061C, d'un U+180B ou d'un sélecteur de variante (U+E0100) —
collés d'un PDF — faisait un second poste, identique à l'œil. Ces deux
changements ont fait passer l'empreinte du cahier (`0186e2b8…`) à celle du
code (`f7d1ccf4…`).

#### Le reste de la base, en bref

- **`base_postes` est PRIVÉE** : `pro_id in (select mes_entreprises())`, rien
  pour `anon`, aucun droit de table pour lui ; aucune fonction
  `security definer` ne la nomme ;
- **l'index unique** `(pro_id, md5(cle)::uuid, unite collate "C",
  fourniture_non_comprise)` : la même phrase au m² et au mètre linéaire, ou
  avec et sans fourniture, fait deux postes — leurs prix diffèrent ;
- **1 000 postes au plus** (`OP018`, compté sous un verrou pour SA propre
  entreprise — et pour l'éditeur SQL ou le rôle de service, qui restent
  comptés : une écriture d'un client au nom d'un autre ne doit pas pouvoir
  tenir son verrou) ;
- **la date du prix appartient à la base** (`prix_fixe_le`), comme toutes
  les dates du projet ;
- **le devis d'origine** par une clé composée `(devis_origine_id, pro_id)` —
  d'où un second index unique sur `devis` (`idx_devis_id_pro`) : on ne
  rattache pas son poste au devis d'un autre (23503, sans oracle), et le
  poste survit à son devis (`on delete set null`) ;
- **une modification ou un retrait tardifs ne gagnent pas** : chacun est
  conditionné sur `modifie_le` ; arrivé après un plus récent, il ne touche
  aucune ligne et l'écran dit « modifié entre-temps ». **Un AJOUT tardif,
  lui, n'est pas couvert** : un poste retiré peut revenir si un premier envoi
  resté en route arrive après (essai 50, cas 17) ; il se voit dans « Ma base »
  et se retire de nouveau ;
- **l'export RGPD** porte `ma_base_de_postes`.

#### Ce que tient l'écran — et le défaut de classement trouvé sur la vraie base

`postes.js` porte tout ce que les écrans décident, en fonctions pures que
`verifier-postes` fait tourner : trois propositions au plus, trois lettres
avant la première, le **degré de correspondance d'abord**, puis, à degré
égal, un poste de la base avant la mémoire (et un poste masque la ligne de la
mémoire qui a sa clé), la recherche de la page, l'avertissement d'unité. Sur
15 sabotages d'écran, 14 passaient avant ce déménagement ; après, 13 ne se
posaient plus (le code avait changé de forme), et **aucun des 46 sabotages
posés à leur place** — les 2 encore posables, 33 transposés là où vivent
désormais les règles, 11 pour les défauts de la relecture — **ne passe**.

Le 25/10, sur la vraie base, en tapant « creation de la dalles » : la bonne
phrase arrivait **derrière** une voisine. Le degré de correspondance ne
comparait ce qu'on tape qu'à la phrase « à plat » : à cause du s en trop, la
bonne phrase n'était plus trouvée que par sa clé (degré 1, « trouvée par le
pluriel seulement »), et une voisine, « CREATION DES DALLES EN BETON… », qui
contenait chaque mot tapé (degré 2, « contient »), passait devant. (Le
message du commit `ddb6a5e` inverse les deux degrés ; un message de commit
ne se récrit pas, c'est ici qu'il est juste.)

> **Le degré se mesure aussi sur les phrases privées de leurs pluriels.**
> « Dalles » met « Dalle béton » au degré 4 (« commence par »).
> `verifier-devis` (cas 33 bis) et `verifier-postes` (cas 44 bis) le font
> tourner. **Aucun essai en démonstration ne l'avait vu** : les phrases de
> démonstration ne se ressemblent pas assez.

Trois choix d'écran faits sans lui, à lui montrer : « réf. » dans les
propositions (la place, à 320 points) ; la phrase de sortie raccourcie (« Ce
n'est pas le même travail ? Changez un mot de la ligne (un s, un accent ou une
majuscule ne suffit pas). ») ; « Au jour » pour l'unité `jour` plutôt que « À
la journée ». Et deux textes : la fin de « Vos tarifs et vos prix » dans les
textes légaux (l'engagement de l'éditeur couvre aussi les phrases :
`VERSION = '2026-10-24'`), et, sous « Confirmer la suppression » d'un client
qui a des devis, deux paragraphes rouges sous une ligne grise (« Définitif… »).

#### La migration : 101 Ko, envoyés sous forme « compacte et gardée »

`apply_migration` prend le TEXTE de la migration dans l'appel : on ne lui
passe pas un fichier. Or celle-ci faisait **101 077 octets**, dont la table de
la clé — des milliers de `chr(n)` — qu'il aurait fallu recopier sans une
faute.

> **Un bloc `do` qui refabrique ce qui est régulier, et qui vérifie avant
> d'exécuter.** Les quatre suites régulières (9, 5, 6 et 255 lignes de
> `chr()`) et les 258 espaces d'une chaîne se reconstruisent par
> `generate_series` et `repeat` ; le bloc compare le **md5** du texte obtenu
> à celui du fichier simulé, et **n'exécute RIEN** s'il diffère. 33 113
> octets. Éprouvé : identique au fichier sur deux copies (même empreinte du
> catalogue), et trois sabotages (une espace, un chiffre, une suite
> raccourcie) refusés sans rien appliquer.

L'ordre `alter column … drop expression if exists` de la section 50.2 (pour
une base d'essai qui aurait reçu la forme générée) n'a pas été envoyé : il
porte « drop », et le 17/10 un `drop column` avait expiré par le connecteur.
Il est remplacé par une garde qui arrête tout si la colonne est encore
générée.

**Appliquée le 25/10 à 11 h 12, heure de Paris** — migration
`lot_p_base_de_postes`, version `20261025101221` en UTC ; ce jour-là est
celui du passage à l'heure d'hiver, donc UTC+1 —, avec l'accord du
propriétaire (« Oui, vas-y »), puis comparée :

- **avant**, la vraie base contre l'imitation (`git show d75217d`) : les
  écarts sont tous connus — le droit `m` (MAINTAIN) de PostgreSQL 17,
  `entreprise_registre.gele`, `admin_basculer_metier`, « lecture demandes
  visiteur », l'U+00A0 de `emetteur_denomination_ei_check`, des corps de
  fonction sans leurs commentaires (89 sur 89 identiques une fois
  normalisés), **l'ORDRE PHYSIQUE des colonnes de quatre tables** (l'histoire
  de leurs ajouts ; la migration n'insère jamais par position) et pgcrypto,
  posé par le prélude local seulement ;
- **après** : les 30 lignes de catalogue ajoutées ou changées — la table et
  ses objets, `mes_donnees()` récrite, et `idx_devis_id_pro` sur `devis` —
  identiques à la copie locale, au droit `m` de PostgreSQL 17 près ; les
  **133 autres groupes inchangés** ; les md5 des trois corps
  (`cle_de_rapprochement`, `tient_le_poste`, `mes_donnees`) ceux de la
  simulation ;
- **l'empreinte de la clé CALCULÉE PAR LA VRAIE BASE** — `f7d1ccf4…` sur les
  63 487 points du plan de base, et les plans 1 et 14 identiques au
  PostgreSQL 16 local. Elle passe par le connecteur PRINCIPAL, avec
  l'accord du propriétaire : **le rôle de `SupabaseLecture` ne peut pas
  exécuter la fonction** (accordée à `authenticated` seul). « Tout Unicode »
  d'un bloc prend 4 minutes : trop long pour une requête.

**Les avertissements des commits `92c3804`, `1144750` et `7a8cc10` — « NE PAS
METTRE CETTE VERSION SUR LE TÉLÉPHONE » — ne valent plus depuis le 25/10 à
11 h 12** : « Ma base de postes » trouve sa table. Un message de commit ne se
récrit pas ; c'est ici qu'on dit qu'il a vieilli.

#### Vérifié avant la vraie base

Trois relectures adverses (base, écran, textes) ; chaque problème qui se fait
tourner reproduit avant d'être corrigé — quelques-uns de la relecture
« textes » (TEXTES5, TEXTES13) seulement relus, faute de pouvoir se produire
en démonstration ; `schema.sql` rejoué deux fois sur une base neuve ;
`essais-section-50.sql` joué deux fois — **184 valeurs justes sur 184, 50
refus, tous rattachés à l'annonce qui les nomme** ; les 26 autres fichiers
d'essais identiques au relevé d'avant (quatre écarts, tous expliqués) ; la
parité de la clé sur tout Unicode ; les 51 contrôles ; le linter à 32 ; les
paquets iOS et Android lus ; `mesure-devis` à 450 mesures sans échec. Et le
banc des sabotages : **326 posés, 323 refusés** par la vérification visée —
trois verts, tous expliqués : la contre-épreuve 42h, voulue ; un X5 mal posé,
reposé puis refusé ; X11, une mutation équivalente —, dont 35 rejoués aussi
sur une base PostgreSQL, après qu'un trou de contrôle (le 42b) a été trouvé et
fermé. (Le message du commit `7a8cc10` disait « 360 » : il comptait deux fois
les 35 rejoués ; celui de `c2e82d1`, « 326 posés, 325 refusés », oubliait X5
et X11.)

Après la correction du classement (25/10) : les 51 contrôles, le linter à 32,
`mesure-devis` à **450 sans échec**, les deux paquets lus (1 « Exported »,
0 « Import stack »), et trois sabotages de la correction elle-même —
l'ancienne règle remise, puis chacune de ses deux moitiés retirée seule —,
tous trois refusés par `verifier-devis` ; `verifier-postes` refuse l'ancienne
règle et la moitié « degré 4 », mais pas la moitié « degré 3 » retirée seule.
**Le banc complet des sabotages, lui, n'a pas été rejoué** après cette
correction.

#### Essayé sur la VRAIE base, et comment

Par le chemin de l'application, avec un artisan A, un concurrent B et un
particulier P **à Brest**, jetables `…@exemple-opus.test`, SIRET fictifs (les
preuves `essai` déjà en base, réutilisées), `enregistrer_vues` neutralisé ;
puis, pour la limite de 1 000 postes et la mesure au navigateur, **A recréé**
avec la même adresse — quatre comptes en tout, tous supprimés :

| | relevé |
|---|---|
| A ouvre « Ma base de postes », vide | « Votre base est vide », et comment la remplir ; aucune écriture |
| A chiffre une ligne, « Ajouter à ma base » | la feuille propose le prix de la ligne ; `POST base_postes 201` |
| une ligne neuve, « Creation des dalles en beton » | **une** proposition : la phrase rangée, « 60,00 € / m² · réf. du 25/10/2026 » |
| A met 75 € au lieu de 60 € | « Vous mettez 75,00 € — c'est voulu ? » ; « Changer ma référence » écrit 75 € |
| après rechargement complet | la référence et l'écart reviennent de la base |
| la même phrase au mètre linéaire, puis fourniture non comprise | trois postes, et **trois** propositions qui se distinguent par l'unité et la fourniture |
| « creation de la dalles » | la bonne phrase **en tête** (après la correction du classement) |
| la page : corriger une phrase et fixer son prix (« Pose de plinthes en chêne massif », 12,50 €), retirer le prix d'un poste, puis retirer un poste | `PATCH 200` ×3 avec « Changer ma référence », `DELETE 200` ; le prix retiré se relit vide en base (`prix_reference_centimes` et `prix_fixe_le`), « Prix non fixé » à l'écran ; la liste suit |
| la lecture de la base coupée | « Liste non actualisée… Réessayer », la liste déjà lue reste |
| un visiteur | **401 · 42501** en lecture comme en écriture |
| B lit, modifie, retire les postes de A | `[]` ×3 ; écrire au nom de A : **403** |
| B rattache SON poste au devis de A | **409 · 23503**, sans dire si le devis existe |
| P se crée un poste | **403** |
| A envoie une clé fausse (insertion, modification) | **400 · 428C9** ×2 |
| A ajoute, par l'API, trois vraies variantes (majuscules et pluriel, minuscules et point final, espaces doublés et pluriels) | **409 · 23505** ×3 sur `idx_base_postes_rapprochement` (l'écran le traduit par « ce poste existe déjà ») |
| …le premier essai « au pluriel » | « CREATION DES DALLES… », à qui il manquait « la » : une AUTRE phrase, acceptée (201) — c'est elle qui a joué la voisine du défaut de classement |
| un prix de 0 · l'unité « ml » · une phrase de blancs | **400** · `base_poste_prix_check`, `_unite_check`, `_designation_check` |
| une date de prix envoyée (2001) · `pro_id` et devis d'origine changés | ignorés : la base garde les siens |
| une écriture tardive (ancienne `modifie_le`) | **0 ligne** |
| l'export RGPD | A : `ma_base_de_postes`, ses postes ; B et P : la clé, vide |
| **999 postes d'un envoi** (1 000 avec « Le poste de trop », rangé par un premier essai) | 201 en 3,6 s ; la lecture de l'application les rend **tous** (`content-range 0-999/1000`, 1,0 s à travers le mandataire) — la limite de lignes de l'API ne coupe pas : elle vaut au moins 1 000, sa valeur exacte n'est pas connue |
| le 1 001ᵉ | **400 · OP018**, la phrase complète |
| « Ma base de postes » à 1 000 postes, processeur bridé six fois | affichée en **2,3 s** (lecture comprise), **13 cartes montées** sur 1 000 ; la recherche, **58 ms par lettre** en moyenne (87 au pire), en tapant « numero 0999 » — qui finit sur une liste vide, les postes allant de 0000 à 0998 ; « 0998 » en trouve un |
| une ligne de devis tapée avec 1 000 postes en base, même bridage | **57 ms par lettre** en moyenne (111 au pire), trois propositions, les bonnes |

Comptes supprimés par le chemin de l'application ; base revenue à 14 comptes
/ 8 fiches / 21 publications / **0 poste**, aucun compte `@exemple-opus.test`.
Les deux preuves SIRET `essai` déjà en base ont été réutilisées (réécrites
pour les adresses de l'essai) : elles restent, et expirent d'elles-mêmes — le
connecteur refuse un `delete`.

Deux leçons d'outil, au passage :

- **le paquet servi par Metro était périmé** après la correction du
  classement : le module chargé dans la page rendait encore l'ancien degré.
  Relancer `npx expo start --web -c` (la leçon du 15/10), et vérifier le
  MODULE chargé, pas seulement le fichier ;
- **`pkill -f "expo start"` a tué mon propre terminal** : le motif se trouvait
  dans la ligne de commande du shell qui le lançait. On arrête un serveur par
  son numéro de processus.

#### Ce qui n'a PAS été vérifié

- **rien sur l'iPhone** : le clavier sous la feuille d'ajout et sous la
  carte, la virgule du pavé décimal, les propositions au pouce, VoiceOver ;
- **Hermes** : la clé n'a tourné que sous `node` 22 et PostgreSQL ; une
  différence de moteur sur une expression régulière ne se verrait qu'au
  téléphone ;
- **« tout Unicode » sur la vraie base d'un seul bloc** : seulement le plan de
  base et les plans 1 et 14 ;
- **à l'écran, les états « modifié entre-temps » et « poste absent »** : ils ne
  se produisent pas en démonstration, et sur la vraie base seule la base a été
  éprouvée (une écriture tardive ne touche aucune ligne) ; leurs phrases ne
  sont tenues que par `verifier-postes`, qui fait tourner les fonctions ;
- **sur la vraie base** : la garde des 2 000 points appelée directement, les
  signes « < » et « > », « bas » / « BA », la suppression d'un devis
  d'origine, et le passage de la feuille d'ajout à « Ce poste existe déjà » à
  l'écran (les trois variantes refusées l'ont été par l'API) — tous éprouvés
  sur PostgreSQL 16 (essai 50) ou en démonstration ;
- **la page « Ma base de postes » à 1 000 postes au doigt** : le navigateur
  bridé dit que la liste ne monte que ce qu'on voit et que la frappe tient ;
  le ressenti, lui, ne se juge que sur l'iPhone ;
- **un vrai poste d'un vrai artisan** : la vraie base n'en compte aucun.

#### Ce qui reste ouvert

Dans `docs/A-FAIRE.md`, « Après le lot P ».

### Expo Go ne peut plus ouvrir Opus — le SDK 58 (25/10/2026)

Signalé par le propriétaire en voulant essayer le lot P sur son iPhone :
« l'application refuse de s'ouvrir », et dans son terminal :

    iOS  ERROR  Project is incompatible with this version of Expo Go
    • The installed version of Expo Go is for SDK 58.0.0.
    • The project you opened uses SDK 57.

**Ce n'est pas le code d'Opus.** Expo Go, sur iPhone, ne connaît qu'UN SDK —
le dernier — et l'App Store le met à jour tout seul. Le SDK 58 est sorti le
15/10 ; le plan l'avait prévu (`docs/PLAN-DEVIS.md`, l.3014 : « la prochaine
Expo Go des stores ne prendra que le SDK 58 »), et la mise à jour est arrivée
sur son téléphone avant le 25/10. On ne peut pas réinstaller une
ancienne Expo Go sur un iPhone.

> **Depuis le 25/10, Opus ne s'ouvre sur l'iPhone QUE dans le build de
> développement** (l'icône Opus, construite par `eas build --profile
> development`). Toute phrase de ce dépôt qui dit « Expo Go ou le build de
> développement » décrit ce qui était vrai avant ; `npx expo start --go` ne
> sert plus à rien sur un vrai iPhone.

Le terminal le disait déjà : « Using development build », et un code QR en
`exp+opus-project://`. Ce code s'ouvre avec l'appareil photo de l'iPhone, ou
depuis la page de lancement de l'icône Opus — **pas depuis Expo Go**.

**Et la question à poser d'abord : QUELLE icône Opus est sur son iPhone ?**
Les profils `development` et `preview` portent la même identité
(`com.opusproject.app`) : installer l'un remplace l'autre, sans prévenir.

| en touchant l'icône Opus | c'est | ce qu'il faut faire |
|---|---|---|
| une page de lancement (la liste des serveurs) | le build de **développement** | `npx expo start` sur le PC, même Wi-Fi, toucher le serveur (ou scanner le code avec l'appareil photo) |
| Opus directement, sur le Fil | la version **« preview » du 17/10**, au code figé | reconstruire le build de développement : `eas build --platform ios --profile development`, l'installer par le lien ou le code QR qu'EAS donne, puis `npx expo start` |

**Migrer au SDK 58 ne règle pas le fond** : Expo Go passera au SDK 59 un jour,
et le problème reviendra. La migration reste une décision du propriétaire
(`docs/A-FAIRE.md`), et elle se fera avec une reconstruction du build de
développement, jamais pour rendre Expo Go utilisable.

Au passage, `npx expo install --check` demande deux petites mises à jour
(`expo` 57.0.31, `expo-notifications` 57.0.24). **Elles ne causent pas cette
panne, et elles ne se font pas seules** : `expo-notifications` est un module
natif, donc la mise à jour se fait EN MÊME TEMPS qu'une reconstruction du
build de développement, jamais entre deux.

## Dépendances : vérifier avant de proposer

Deux paquets ont déjà été écartés après vérification sur npm :
`ffmpeg-kit-react-native` (déprécié, abandonné en janvier 2025) et
`react-native-video-processing` (aucune version depuis 2022). Toujours
regarder la date de la dernière publication avant de conseiller un paquet.

Et se rappeler qu'un **module natif impose de RECONSTRUIRE l'application** :
depuis le 15/10/2026, le propriétaire essaie Opus dans un **build de
développement** (`expo-dev-client`, profils `development` et `preview` de
`eas.json`), plus dans Expo Go — qui, depuis le 25/10, ne PEUT plus l'ouvrir
(il est passé au SDK 58). Un module natif ajouté au code n'existe donc
dans son téléphone qu'après un nouveau `eas build` et une réinstallation —
et un import statique d'un module absent fait planter l'application **dès le
démarrage**. L'ordre est toujours : installer, construire, réinstaller, PUIS
committer le code qui l'importe (`docs/PLAN-DEVIS.md` 10.4).
