# Opus-Project — application mobile (Expo + Supabase)

Portage fidèle du prototype web `reference/opus-project.jsx` en vraie application
mobile React Native, avec un vrai backend Supabase et les deux fonctions IA
sécurisées côté serveur.

> **Tu débutes ?** Lis simplement les sections dans l'ordre. Tu peux voir l'app
> tourner sur ton téléphone dès l'étape 1, **avant** de créer quoi que ce soit
> chez Supabase.

---

## Étape 1 — Voir l'app sur ton téléphone (5 minutes)

Il te faut [Node.js](https://nodejs.org) sur ton ordinateur et l'application
**Expo Go** sur ton téléphone (gratuite, App Store ou Google Play).

```bash
npm install      # une seule fois, installe les dépendances
npm start        # lance le serveur de développement
```

Un **QR code** s'affiche dans le terminal.

- **Android** : ouvre Expo Go → « Scan QR code » → scanne le code.
- **iPhone** : ouvre l'appareil photo → vise le QR code → appuie sur la notification.

L'app se charge sur ton téléphone. Chaque fois que tu modifies un fichier, elle
se recharge toute seule.

> L'ordinateur et le téléphone doivent être sur **le même réseau Wi-Fi**.
> Si ça ne passe pas (Wi-Fi d'entreprise, réseau invité), lance `npx expo start --tunnel`.

À ce stade, l'app tourne en **mode démo** : les 5 artisans, les publications, les
avis et les messages du prototype sont en mémoire. Tout est cliquable, rien n'est
enregistré : c'est normal, on branche la base à l'étape 2.

### Le réflexe après chaque `git pull`

```bash
git pull
npm install
npm start
```

**`npm install` après chaque `git pull`.** Le `git pull` récupère le code et la
*liste* des bibliothèques ; `npm install` télécharge les bibliothèques
elles-mêmes. Si rien n'a changé, la commande se termine en deux secondes.

Si vous l'oubliez, Expo affichera au démarrage :

```
Unable to resolve "<nom-de-la-bibliotheque>" from "src/..."
```

Ce message veut dire « cette bibliothèque manque sur votre disque ». La réponse
est toujours la même : `npm install`.

Ajoutez `-- --clear` (`npm start -- --clear`) quand le fichier `.env` a changé :
sans lui, Expo garde l'ancienne configuration en mémoire.

### Ce qu'il faut tester, écran par écran

| # | Écran | À vérifier |
|---|-------|-----------|
| 1 | Onboarding | Les deux boutons entrent dans l'app. La bande orange/noire est en haut. |
| 2 | Accueil · Fil | J'aime (le compteur bouge), Commenter (la zone s'ouvre, le commentaire s'ajoute), Partager, Enregistrer, Contacter (le menu s'ouvre), Masquer (le post disparaît). Onglet « Abonnements » : seuls les pros suivis restent, plus les publicités. |
| 2 | Accueil · Vidéos | Défilement vertical plein écran, une publication par écran, actions à droite. |
| 3 | Découvrir | Recherche par texte, filtres par métier, boutons Profil / Devis. L'assistant IA s'active à l'étape 3. |
| 4 | Publier | Choix du type, description, métier, ville → « Publier » ajoute la publication en tête du fil. |
| 5 | Messages | Liste des conversations → une conversation → envoyer un message (bulle noire à droite). |
| 6 | Notifications | Cloche en haut à droite, le point orange disparaît au clic. |
| 7 | Mon profil | Version pro : SIRET, assurance, stats, portfolio, « Mes partenaires » → « + Ajouter ». Version particulier (relance l'app et choisis « particulier ») : abonnements et enregistrés. |
| 8 | Profil d'un pro | Informations vérifiées (bouclier vert/rouge), 3 barres de notation, bouton « Laisser un avis » (3 curseurs + commentaire → les moyennes se recalculent), avis avec badge « Client vérifié ». |
| 9 | Devis / rappel | Bouton « Demander un devis » ou « Être rappelé » → formulaire qui monte du bas. |
| 10 | Navigation | Les 5 icônes du bas. Le bouton central change selon le compte : **Publier** (orange) pour un pro, **SOS** (rouge) pour un particulier. |
| 11 | SOS (particulier) | Bouton rouge central → métier → problème → adresse → liste d'artisans avec distance, délai et **fourchette de prix**, puis choix. |
| 12 | Demandes | Découvrir → onglet « Demandes ». Le particulier publie un besoin, le pro y répond. Un point orange sur Découvrir prévient le pro. |
| 13 | Mon compte | Profil → « Modifier mon profil » : photo (appareil photo ou galerie), bannière, coordonnées, et pour un pro sa disponibilité aux urgences. « Se déconnecter » ramène à l'écran d'accueil. |

---

## Étape 2 — Brancher la vraie base de données (Supabase)

### 2.1 Créer le projet

1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Choisis un nom, un mot de passe de base, une région (Europe de préférence).
3. Attends ~2 minutes que le projet soit prêt.

### 2.2 Créer les tables

1. Dans le menu de gauche : **SQL Editor** → **New query**.
2. Copie-colle tout le contenu de `supabase/schema.sql` → **Run**.
3. Nouvelle requête : copie-colle `supabase/seed.sql` → **Run**
   (ça remplit la base avec les 5 artisans de démonstration).

Les deux fichiers ont été exécutés et vérifiés sur un PostgreSQL 16 réel avant
publication : 18 tables, 5 comptes, 5 profils, 7 publications, et la règle du
« client vérifié » testée dans les trois cas (devis accepté, aucun devis,
intervention d'urgence terminée).

Si le second script affiche malgré tout une erreur rouge, la solution de
rechange est de créer les cinq comptes à la main dans **Authentication →
Users**, puis de remplacer les cinq UUID en haut de `seed.sql` par les vôtres.

### 2.2 bis — Relancer `schema.sql` quand la base évolue

`schema.sql` est **ré-exécutable**. Chaque fois que le modèle de données change,
recollez le fichier entier dans le SQL Editor et faites **Run** : les tables et
colonnes déjà présentes sont conservées, les nouvelles sont ajoutées, et aucune
donnée n'est perdue. Vérifié en le jouant quatre fois de suite sur une base
remplie.

### 2.3 Réglages de connexion

Dans **Authentication → Sign In / Providers → Email** :

- **Confirm email** : désactivez-le **pendant le développement**. Sinon chaque
  compte de test attend un clic dans un mail. Réactivez-le avant d'ouvrir
  l'application à de vrais utilisateurs.
- **Anonymous sign-ins** : plus nécessaire depuis que l'application a de vrais
  comptes ; laissez-le désactivé.

### 2.3 bis — Ancienne étape : connexion anonyme

L'app n'a pas d'écran de connexion (comme le prototype) : elle ouvre une session
anonyme. Va dans **Authentication → Sign In / Providers** et active
**Anonymous sign-ins**.

### 2.4 Donner les clés à l'application

Dans Supabase, le plus simple est le bouton **Connect** en haut du tableau de
bord : il affiche les deux valeurs ensemble, prêtes à coller. Sinon elles sont
sur deux pages distinctes — **Project Settings → Data API** pour l'URL, et
**Project Settings → API Keys** pour la clé.

Prends la clé **Publishable** (`sb_publishable_...`) ou, sur un projet plus
ancien, **anon public** (`eyJ...`) : les deux fonctionnent. Jamais la clé
**secret** / **service_role**, qui contourne toutes les règles de sécurité.
Crée à la racine du projet un fichier nommé `.env` (copie `.env.example`) :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Puis relance : `npm start -- --clear`.

L'app lit maintenant la vraie base. Un « j'aime », un commentaire, un message,
une publication, un avis, un devis sont **réellement enregistrés** — tu peux les
voir apparaître dans Supabase → **Table Editor**.

> La clé `anon` est publique par nature : elle est faite pour vivre dans une app.
> Ce qui protège les données, ce sont les règles RLS écrites dans `schema.sql`
> (chacun ne peut modifier que ses propres lignes).

### Les tables créées

`users`, `professional_profiles`, `posts`, `post_likes`, `saved_posts`,
`comments`, `follows`, `reviews`, `conversations`, `messages`,
`quote_requests`, `callback_requests`, `professional_partners`,
`demandes`, `demande_reponses`, `sos_availability`, `sos_requests`,
`notifications`.

*(`saved_posts` a été ajoutée à la liste initiale : le bouton « Enregistrer » du
fil en a besoin. Les quatre tables `demandes`, `demande_reponses`,
`sos_availability` et `sos_requests` portent l'espace Demandes et le SOS.)*

### La règle « Client vérifié »

Un avis n'affiche le badge **Client vérifié** que si son auteur a réellement un
devis accepté, une demande de rappel acceptée, **ou une intervention d'urgence**
avec ce professionnel. Ce n'est pas
une case que l'utilisateur coche : c'est la base de données qui décide, via le
trigger `calcule_client_verifie` dans `schema.sql`. La valeur envoyée par l'app
est ignorée et recalculée à chaque insertion.

Pour le vérifier : laisse un avis depuis l'app sur un pro avec lequel tu n'as
aucun devis accepté → l'avis apparaît **sans** le badge. Passe ensuite le devis
correspondant à `statut = 'accepte'` dans le Table Editor, modifie l'avis, et le
badge apparaît.

---

## Vérifier un professionnel

Quand un artisan envoie son Kbis et son attestation d'assurance, son profil
passe en **`en_attente`**. Le badge vérifié ne s'obtient pas tout seul : c'est
vous qui décidez.

1. Supabase → **Storage** → espace **documents** → ouvrez le dossier portant
   l'identifiant de l'artisan et regardez les fichiers
2. Supabase → **Table Editor** → **professional_profiles** → trouvez sa ligne
3. Cochez **`kbis_valide`** si l'extrait Kbis est bon, et renseignez
   **`kbis_maj`** (par exemple `03/2026`)
4. Cochez **`assurance_valide`** si l'attestation est bonne, et renseignez
   **`assurance_expire`** (par exemple `12/2026`)

C'est tout. Les colonnes **`verifie`**, **`verification_statut`** et
**`verifie_le`** se remplissent toutes seules : la base contient une règle
(`synchronise_verification`) qui accorde le badge **si et seulement si** les
deux documents sont validés.

C'est volontaire, et c'est important : l'extrait Kbis est ce qui prouve
l'existence légale de l'entreprise, donc son SIRET. Tant qu'il n'est pas
validé, l'application n'écrit nulle part que le SIRET est vérifié. Et si vous
dé-cochez `assurance_valide` le jour où une attestation expire, le badge tombe
immédiatement, sur le profil comme dans les listes.

Pour refuser, mettez `verification_statut` à `refuse` et expliquez pourquoi
dans `verification_note` : l'artisan lira la raison dans son écran de profil.

L'espace **documents** est privé : ces fichiers ne sont lisibles que par leur
propriétaire et par vous depuis le tableau de bord. Ils n'apparaissent jamais
sur le profil public.

## Étape 3 — Brancher l'IA en sécurité

### Pourquoi une fonction serveur

Le prototype appelait l'API Anthropic directement depuis le navigateur. **Il ne
faut jamais faire ça dans une app mobile publiée** : le code JavaScript de l'app
est lisible sur le téléphone, donc n'importe qui pourrait extraire ta clé API et
s'en servir à tes frais.

La solution : une petite fonction qui tourne **sur le serveur Supabase**.

```
Téléphone  ──(besoin de l'utilisateur)──►  Edge Function "ai"  ──(clé API)──►  Anthropic
           ◄──────(réponse)──────────────                      ◄──────────────
```

La clé ne quitte jamais le serveur. Le code de cette fonction est dans
`supabase/functions/ai/index.ts`. Elle sert à trois choses : trouver le bon
artisan à partir d'un besoin décrit en français, résumer les avis d'un profil,
et mettre en forme la présentation d'un artisan.

**Ce qui marche sans l'IA.** L'assistant de présentation écrit déjà trois
textes corrects sans elle, à partir du questionnaire (`src/lib/presentation.js`,
vérifié par `npm run verifier-presentation`). L'IA les remplace par des
versions mieux tournées quand elle est joignable, et l'écran dit laquelle des
deux a écrit. C'est volontaire : une fonction qui ne marche qu'à moitié du
temps n'est pas utilisée.

### Mise en place

**1. Obtenir une clé API Anthropic**
[console.anthropic.com](https://console.anthropic.com) → connexion → **API Keys**
→ **Create Key** → copie la clé (elle commence par `sk-ant-`). Elle ne s'affiche
qu'une fois. Prévois aussi un moyen de paiement : l'API est facturée à l'usage.

**2. Ranger la clé dans les secrets du serveur**

Depuis le navigateur, sans rien installer :

Dashboard Supabase → ton projet → **Edge Functions** → onglet **Secrets** →
**Add new secret**.

| Champ | Valeur |
| --- | --- |
| Name | `ANTHROPIC_API_KEY` — ce nom exact, en majuscules |
| Value | la clé, seule, qui commence par `sk-ant-` |

**Un seul secret par ligne.** Coller le nom et la valeur dans la même case ne
marche pas : c'est l'erreur qui a coûté une heure lors de la mise en place de
Cloudinary.

**3. Déployer la fonction**

Elle l'est déjà — elle se déploie depuis ce dépôt via le connecteur Supabase.
Si tu veux le faire toi-même, il faut alors la CLI :

```bash
npm install -g supabase
supabase login
supabase link --project-ref TON_REF_PROJET
supabase functions deploy ai
```

**Vérifier que la clé est bien vue par le serveur**, sans la révéler : appelle
la fonction avec une action inconnue.

- réponse `Action inconnue` → la clé est en place ;
- réponse `La clé ANTHROPIC_API_KEY n'est pas configurée` → elle manque, et la
  réponse liste les **noms** des secrets présents (jamais leurs valeurs) pour
  repérer une faute de frappe.

**Ce que ça coûte.** Claude Opus 5 est facturé 5 $ par million de jetons
envoyés et 25 $ par million produits. Les trois usages d'Opus-Project sont
courts : quelques centimes pour des centaines d'appels. Le budget se plafonne
dans la console Anthropic (Settings → Limits).

C'est tout. Relance l'app : l'assistant IA de l'écran **Découvrir** et le bouton
**« Générer un résumé IA »** du profil d'un pro fonctionnent.

> **Jamais** de clé `sk-ant-` dans `.env`, dans `app.json`, ni dans un fichier de
> `src/`. Ces fichiers partent sur le téléphone. Seul `supabase secrets` est sûr.

### Les deux fonctions IA

| Où | Ce que ça fait |
|----|----------------|
| Découvrir → « Demander à l'IA » | Envoie la description du besoin + la liste des artisans, reçoit les pros pertinents avec une phrase d'explication. |
| Profil d'un pro → « Générer un résumé IA » | Envoie les avis, reçoit un résumé neutre en 2-3 phrases. |

Le modèle utilisé est `claude-opus-5`. Pour en changer, modifie la constante
`MODEL` en haut de `supabase/functions/ai/index.ts` puis redéploie.

---

## Photos, vidéos et montage

### De vrais fichiers

**Publier** ouvre l'appareil photo ou la galerie. Le fichier part dans
l'espace `publications` de Supabase Storage, et l'URL obtenue est enregistrée
avec la publication. Un chemin local `file://…` ne veut rien dire sur le
téléphone de quelqu'un d'autre : c'est l'envoi qui rend la photo visible.

| Format | Ce qu'il attend |
|---|---|
| **Photo** | Une photo, prise ou choisie |
| **Vidéo** | Un clip de 30 s maximum |
| **Montage** | Jusqu'à 6 clips, réordonnables, avec une musique |
| **Avant/Après** | Deux photos, affichées côte à côte et étiquetées |
| **Texte**, **Conseil** | Pas de média |

Un particulier peut joindre **jusqu'à 3 photos** à une demande. Une photo du
problème vaut dix lignes de description : c'est elle qui permet de chiffrer
sans se déplacer.

Limite de **45 Mo par fichier** — au-delà, un message clair le dit plutôt que
l'erreur brute du serveur. Une seule vidéo joue à la fois dans le fil : en
laisser tourner cinq vide la batterie et sature les décodeurs du téléphone.

### Si une publication ne part pas

L'écran Publier écrit maintenant, **juste au-dessus du bouton**, ce qui manque
encore, et le bouton reste grisé tant qu'il manque quelque chose. Un message
qui apparaissait trois secondes en haut de l'écran pendant qu'on appuyait sur
un bouton tout en bas ne se voyait pas.

Pendant l'envoi, une **jauge** indique le fichier en cours et le pourcentage.
Sans elle, une vidéo de 30 Mo donnait l'impression que rien ne se passait.

En cas de refus par Supabase, le **motif exact** du serveur est affiché
(limite de taille, espace saturé, règle refusée) plutôt qu'un code d'erreur.

### Pourquoi les vidéos sont courtes et en qualité moyenne

Trente secondes filmées en 4K pèsent plus de 100 Mo : le fichier ne passe pas,
et met une minute à se charger chez celui qui regarde. Vingt secondes en 720p
pèsent une dizaine de mégaoctets et démarrent tout de suite. Sur un chantier,
c'est la seule version qui sert.

Les fichiers partent donc en **flux continu** depuis le téléphone
(`File.upload`), sans jamais être chargés entièrement en mémoire. Une photo de
2 Mo s'en moque ; une vidéo de 60 Mo, non — c'est ce qui faisait échouer la
publication d'un clip, silencieusement.

### Le type des fichiers envoyés

Une vidéo doit arriver dans le stockage avec le type `video/quicktime` ou
`video/mp4`. Si elle arrive en `application/octet-stream`, le lecteur ne la
reconnaît plus comme une vidéo : il la **télécharge en entier avant de
démarrer**, au lieu de la lire au fil de l'eau.

C'est ce qui se passait. L'envoi en flux continu posait bien l'option
`mimeType`, mais Supabase enregistrait quand même `application/octet-stream`.
Le `Content-Type` est désormais écrit explicitement dans les en-têtes.

Pour vérifier l'état d'un fichier déjà envoyé :

```sql
select right(name, 28) as fichier,
       round(((metadata->>'size')::bigint) / 1048576.0, 1) as mo,
       metadata->>'mimetype' as type
from storage.objects
where bucket_id = 'publications'
order by created_at desc limit 10;
```

### Démarrage des vidéos

Deux réglages, pour que l'image apparaisse tout de suite :

- **un seul lecteur par vidéo, jamais recréé.** Avant, une vidéo qui passait
  de « vignette » à « lecture » changeait de composant : le lecteur était
  détruit et la vidéo rechargée depuis zéro. C'était la vraie cause de
  l'attente ;
- **mise en mémoire tampon réduite** : la lecture démarre après une
  demi-seconde de réserve au lieu de deux, avec cinq secondes d'avance au lieu
  de vingt. Largement assez pour une vidéo courte.

Dans le fil, une vidéo **se lance quand la carte arrive à l'écran** et
s'arrête quand elle en sort. Le son reste coupé : une vidéo qui parle toute
seule pendant qu'on fait défiler est insupportable. Le son ne vient qu'en
plein écran — c'est ce que font Instagram et Facebook.

## Cloudinary : les vidéos et les montages

### Ce qu'il fait, et ce qu'il ne touche pas

Seules les **vidéos** passent par Cloudinary. Les photos, les avatars, les
bannières et surtout les **justificatifs (Kbis, assurance)** restent dans
Supabase Storage : les documents y sont protégés par des règles liées au
compte, et les déplacer reviendrait à refaire cette protection.

Trois gains, mesurés sur de vrais fichiers du projet :

| | Sans Cloudinary | Avec |
|---|---|---|
| Un montage de 2 clips | deux fichiers enchaînés | **un seul MP4**, partageable |
| Aperçu d'une vidéo | la vidéo entière, 780 Ko | une image, **45 Ko** |
| Fabrication du montage | — | 4 s la première fois, puis en cache |

### Le secret ne quitte jamais le serveur

Cloudinary propose un envoi « sans signature », avec un mot de passe glissé
dans l'application. Sa propre documentation demande alors de traiter ce mot de
passe comme un secret — or le code d'une application mobile se lit en quelques
minutes.

Le téléphone demande donc une **signature** à l'Edge Function `cloudinary`,
valable quelques minutes et pour son seul dossier, puis envoie le fichier
directement à Cloudinary. Le fichier ne transite pas par nos serveurs.

### Mise en place

1. Compte gratuit sur **cloudinary.com** → **Settings → API Keys**
2. Dans Supabase → **Edge Functions → Secrets**, **trois secrets séparés** :
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   Le nom va dans la case **Key**, la valeur dans **Value** — jamais les deux
   ensemble, jamais de libellé en français.
3. Déployer la fonction : `supabase functions deploy cloudinary`
4. Dans le `.env` du projet, **le nom du compte seul** :
   `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...`
   La clé et le secret n'y figurent **jamais**.

Sans cette ligne dans le `.env`, l'application continue de fonctionner : les
vidéos partent dans Supabase Storage et un montage est lu clip après clip.

### Vérifier

```bash
npm run verifier-montage      # les adresses de montage, caractère par caractère
npm run verifier-signature    # la signature, comparée au SDK officiel Cloudinary
```

En cas de « Cloudinary n'est pas configuré », la fonction renvoie **les noms
des secrets qu'elle voit** — jamais leurs valeurs. Une faute de frappe ou un
secret mal nommé se repère alors immédiatement.

### Le montage : ce qu'il fait, et ce qu'il ne fait pas encore

Le montage enchaîne les clips dans l'ordre choisi, avec la musique par-dessus,
et reboucle. Des jauges en haut montrent où l'on en est. **C'est assemblé à la
lecture, pas encodé dans un fichier unique.**

La raison est précise, et il vaut mieux la connaître : coller des clips et y
incruster une bande-son demande un encodeur vidéo sur le téléphone. En React
Native, cela passait par **`ffmpeg-kit-react-native`** — un paquet
**abandonné par son éditeur**, déprécié sur npm et sans nouvelle version
depuis janvier 2025. Il n'existe pas aujourd'hui d'équivalent maintenu.

Conséquences concrètes :

| | État |
|---|---|
| Le montage se regarde dans l'app, clips enchaînés + musique | ✅ |
| Il se publie, se commente, se partage comme une vidéo | ✅ |
| Il existe comme **un seul fichier** à reposter sur TikTok ou Instagram | ❌ |

Le jour où l'export deviendra utile, il se fera **côté serveur** (un service
d'encodage reçoit les clips et rend un MP4), pas sur le téléphone.

### La musique

Pas de bibliothèque de musiques intégrée : il faudrait des morceaux sous
licence, ce qui est une **décision d'entreprise**, avec un vrai enjeu
juridique — pas un détail technique. L'artisan apporte donc son morceau depuis
son téléphone, et reste responsable de ses droits. Sans musique, on entend le
son des clips.

## Publier : le format et la destination

Deux choix distincts, sur le même écran, et c'est volontaire.

### Le format dit ce qu'on montre

**Photo**, **Vidéo**, **Avant/Après**, **Texte**, **Conseil**.

C'est le format qui décide dans quel fil la publication apparaît :

| Fil | Ce qu'on y voit |
|---|---|
| **Fil** | Tout : photos, vidéos, avant/après, textes, conseils, publicités. Une vidéo y porte une pastille « ▷ Vidéo », se lit muette au format 4/5, et **s'ouvre en plein écran d'une pression** — sur elle-même, pas au début de la liste. |
| **Vidéos** | **Uniquement ce qui se regarde en plein écran** — vidéos et montages, façon TikTok. Ni photos, ni textes, ni publicités. |

En base, la colonne `posts.type` porte le format (`photo`, `video`…), et la
colonne `posts.is_ad` dit s'il s'agit d'une publicité. Côté application, le
format s'appelle `post.format` et la nature `post.type` (`post` ou `ad`).

### La destination dit où elle va

| Choix | Effet |
|---|---|
| **Le fil** | Publiée, visible de tous, avec likes et commentaires. Rien dans le portfolio. |
| **Mon portfolio** | Rangée dans les réalisations du profil. Rien dans le fil, personne n'est notifié. |
| **Les deux** *(par défaut)* | Publiée **et** ajoutée aux réalisations, d'un seul geste. |

Un artisan ne veut pas toujours annoncer quelque chose : parfois il veut juste
étoffer sa vitrine. Le choix n'apparaît que pour les formats qui produisent une
image ou une vidéo — un texte ou un conseil n'a rien à ranger dans un
portfolio, il va donc directement dans le fil.

L'ajout au portfolio passe par la fonction SQL `ajoute_au_portfolio`, qui
ajoute **à la fin** du tableau. C'est important : `portfolio[1]` reste la toute
première réalisation, donc la bannière par défaut du profil ne change pas à
chaque publication.

## Le fil vidéo, à la manière de TikTok

En plein écran, deux glissements horizontaux :

| Geste | Où l'on arrive |
|---|---|
| **Vers la droite →** | La page du professionnel |
| **Vers la gauche ←** | Retour au fil principal |

Le geste n'est capté que s'il est **franchement horizontal** — au moins deux
fois plus large que haut, et d'au moins 70 px. Sans cette condition, un
défilement vertical légèrement de travers ferait quitter la vidéo, ce qui est
exaspérant.

## Gérer ce qu'on a publié

### Mes publications

**Profil → Mes publications** rassemble tout ce que le professionnel a publié.
Le fil mêle ses publications à celles des autres : pour retrouver la sienne
d'il y a trois semaines, il fallait faire défiler indéfiniment.

Trois actions par publication :

| Action | Effet |
|---|---|
| **Remettre en avant** | La publication remonte en tête du fil **en gardant ses j'aime et ses commentaires**. Ce n'est pas une copie : un doublon perdrait tout et encombrerait le fil |
| **Partager** | Ouvre la feuille de partage du téléphone — messages, WhatsApp, courriel. C'est l'utilisateur qui choisit à qui |
| **Supprimer** | **Demande confirmation**, et la confirmation *remplace* la barre d'actions : impossible d'appuyer à côté |

### Organiser ses réalisations

**Profil → Portfolio → Organiser** permet de réordonner et de retirer les
photos. L'ordre compte : la première réalisation sert de bannière par défaut,
et ce sont les premières que voit un particulier qui hésite entre deux
artisans.

Rien n'est enregistré avant d'avoir appuyé sur **Enregistrer** — on peut
essayer plusieurs ordres et repartir sans rien casser. Retirer une réalisation
ne supprime pas la publication correspondante : seule la vitrine change.

## Les partenaires : ça se demande, ça ne se prend pas

Un partenariat affiché sur un profil, c'est une recommandation publique. Il
engage le nom des **deux** artisans.

1. l'artisan A ouvre **Profil → Mes partenaires → + Ajouter** et clique
   **Demander** ;
2. l'artisan B reçoit une notification et voit la demande en tête de sa
   section partenaires, avec **Accepter** / **Refuser** ;
3. une fois acceptée, chacun apparaît chez l'autre — et A est prévenu.

Tant que B n'a pas répondu, A voit **« En attente »** et rien ne s'affiche
publiquement.

C'est la **base de données** qui garantit la règle, pas l'écran :

| Action | Qui y parvient |
|---|---|
| Créer une demande | Seulement en son propre nom, et seulement en attente |
| Accepter ou refuser | **Seulement** celui à qui on demande |
| Rompre | L'un ou l'autre |
| Voir une demande en cours | Seulement les deux intéressés |

Un index unique empêche par ailleurs deux demandes croisées sur la même paire.

> **Ce qui a été corrigé.** Avant, « Ajouter » écrivait les deux sens d'un
> coup : n'importe quel artisan pouvait s'inscrire dans les partenaires d'un
> confrère sans que celui-ci ne soit jamais consulté. En rejouant
> `schema.sql`, les partenariats existants sont conservés et marqués acceptés.

## Regarder une réalisation en grand

Une vignette de 130 px ne montre pas un chantier. On touche une photo du
portfolio : elle s'ouvre en plein écran sur fond noir, avec le compteur
(« 3 / 6 »), une croix pour fermer, et des flèches. **On balaie du doigt**
pour passer d'une photo à l'autre — c'est le geste naturel sur un téléphone ;
les flèches servent sur tablette et sur le web.

## Les formulaires partent remplis

Quand un particulier clique sur **Contacter**, l'application sait déjà qui il
est. Ses coordonnées pré-remplissent la demande de devis comme la demande de
rappel.

Ce qui manque **reste vide**, mais une phrase dit pourquoi il faut le
remplir :

> *Sans numéro, l'artisan ne pourra pas vous rappeler.*

« Votre numéro » tout seul n'explique rien ; cette phrase-là, si.

Ce qu'on saisit peut être **retenu dans le profil** (case à cocher, proposée
seulement s'il y a du nouveau) : la demande suivante part déjà remplie. Le
téléphone se renseigne aussi une fois pour toutes dans **Modifier mon
profil** ; il ne s'affiche nulle part et ne part qu'avec les demandes.

Pour un **premier message**, le brouillon est amorcé avec « Bonjour, je suis
*Nom*, *Ville*. » — modifiable et effaçable. Un artisan qui reçoit
« Bonjour » tout court doit redemander qui écrit et d'où.

## Les commentaires et leurs réponses

Un commentaire, et ses réponses. **Deux niveaux, pas davantage** — comme
Facebook, Instagram et TikTok, et ce n'est pas un hasard : à chaque niveau
supplémentaire le texte s'indente, et sur un téléphone la troisième réponse se
lirait dans une colonne de six mots de large.

Répondre à une réponse reste possible, sans limite : la nouvelle réponse
rejoint le même fil, précédée d'un **« @Nom »** ajouté automatiquement. La
conversation continue, la lisibilité aussi.

La règle est tenue par **la base de données**, pas par l'écran : le trigger
`limite_profondeur_commentaire` rattache au commentaire d'origine toute
réponse visant une réponse. Un client modifié ne peut pas créer de fil sans
fin.

### Toucher un nom

Le nom et la photo sous chaque commentaire sont tactiles :

| Auteur | Où l'on arrive |
|---|---|
| **Professionnel** | Sa page publique : réalisations, avis, documents vérifiés |
| **Particulier** | Sa fiche publique : nom, ville, demandes publiées, bouton « Envoyer un message » |

La fiche d'un particulier ne montre que ce qu'il a lui-même rendu public.
Jamais son adresse ni son courriel : ce n'est pas parce qu'une donnée est en
base qu'elle a sa place à l'écran.

Le compteur sous une publication additionne les commentaires **et** leurs
réponses.

### Qui est prévenu, et quand

Les règles de Facebook, Instagram et TikTok, sans leur partie bruyante :

| Événement | Qui reçoit la notification |
|---|---|
| On commente votre publication | **Vous** |
| On répond à votre commentaire | **Vous** |
| On répond dans un fil où vous avez déjà parlé | **Vous** |
| Vous commentez ou répondez | **Personne** — on ne se prévient jamais soi-même |

Deux choses qu'on ne fait **pas**, délibérément :

- **prévenir tout le monde dès qu'un commentaire arrive sur une publication
  qu'on a commentée.** C'est le réglage le plus bruyant de Facebook. Un
  artisan sur un toit n'a pas besoin de quarante vibrations ;
- **analyser les « @Nom » du texte** pour deviner qui est visé. Deux personnes
  peuvent porter le même nom, un nom peut contenir un espace. On prévient les
  participants du fil, ce qui donne le même résultat sans deviner.

Une personne reçoit **au plus une notification par commentaire**, même si elle
est à la fois l'auteur de la publication et celui du commentaire visé.

C'est **la base de données** qui écrit ces notifications, via le trigger
`notifie_commentaire` en `security definer` — jamais le téléphone. Une
notification s'écrit dans la boîte de quelqu'un d'autre, et les règles RLS
interdisent justement cela à un utilisateur ordinaire. Le seul moyen correct
est donc de laisser le serveur décider.

Toucher une notification **ouvre la publication concernée**, commentaires
dépliés, et la marque lue.

> **Notifications push (sur l'écran verrouillé)** : pas encore. Elles exigent
> un *development build*, donc un compte Apple Developer payant côté iPhone.
> La cloche dans l'application fonctionne dès maintenant, elle.

## Le SOS et l'espace Demandes

Côté artisan, les demandes sont triées dans l'ordre où l'on décide vraiment :
**ses métiers d'abord**, puis **les plus urgentes**, puis **les plus proches**.
Il voit « vous avez répondu » sur celles qu'il a déjà traitées, et peut les
masquer — sans quoi il relit dix fois les mêmes.

Côté particulier, la demande porte une **fourchette de budget** et un **degré
d'urgence**. Sans budget, l'artisan se déplace pour un chantier hors de portée
et le particulier reçoit des devis qui le sidèrent. « Je ne sais pas » est un
choix à part entière : forcer une fourchette produirait des chiffres faux.


Deux fonctions qui distinguent Opus des plateformes de mise en relation classiques.

### Le fil reste une vitrine

Seuls les professionnels publient dans le fil d'actualité. Un particulier
consulte, aime, commente, partage et envoie des messages, mais ne publie pas.
Le bouton Publier disparaît simplement de sa navigation.

### Les demandes vivent à part

Dans **Découvrir → Demandes**, le particulier décrit un besoin (métier, ville,
description, photo). Les professionnels du métier concerné le voient et
répondent. Un **point orange** sur l'icône Découvrir prévient le pro qu'il y a
du nouveau. Le fil et les demandes ne se mélangent jamais.

### Côté artisan : le miroir du SOS

L'artisan ne voit jamais de bouton SOS — il **reçoit**. Dans
**Profil → Modifier mon profil**, il trouve l'interrupteur « Je réponds aux
urgences » et les trois chiffres de sa grille. Le bloc n'apparaît que pour les
quatre métiers concernés : un maçon lit une note lui expliquant pourquoi il
n'est pas concerné, plutôt qu'un formulaire inutile.

### Le SOS

Le bouton rouge central, visible uniquement par les particuliers. Quatre
métiers : plomberie, électricité, serrurerie, chauffage.

Avec Supabase branché, la recherche d'artisans est faite **par la base** :
la fonction `artisans_urgence(metier, latitude, longitude)` trie par distance
réelle et écarte ceux dont le rayon d'intervention ne couvre pas l'adresse.
Le téléphone ne fait qu'afficher le résultat. Il faut donc choisir l'adresse
dans les suggestions : sans coordonnées, aucune distance n'est calculable.

Sans `.env`, l'application se rabat sur les disponibilités d'exemple de
`src/data/urgences.js`, avec des distances simulées.

Le principe tarifaire est volontairement simple et honnête. L'artisan renseigne
**trois chiffres une seule fois** dans son profil :

| Champ | Exemple |
|---|---|
| Forfait de déplacement | 45 € |
| Tarif horaire | 62 €/h |
| Majoration nuit et week-end | +40 % |

Chaque type de problème porte une **durée moyenne** d'intervention (une fuite
d'eau : 1 à 2 h). L'app en déduit une fourchette — ici 107 à 169 € en journée,
150 à 237 € la nuit. C'est une **estimation avant diagnostic**, jamais un prix
ferme : l'artisan n'a pas encore vu le chantier.

Le client voit alors trois à cinq artisans avec distance, délai d'arrivée,
fourchette et note, et **il choisit**. C'est la différence avec les plateformes
qui imposent un intervenant.

Les durées par métier se modifient dans `src/data/urgences.js`.

## Les métiers d'un artisan, et pourquoi ils se figent

Un artisan n'exerce presque jamais un seul métier : plombier **et**
chauffagiste, maçon **et** carreleur. Il en coche jusqu'à quatre ; le premier
est le **métier principal**, celui qui s'affiche sur ses publications.

Quatre au maximum, parce que tout cocher serait la façon évidente de capter
toutes les demandes. La limite est tenue par la base
(`pro_metiers_check`), pas par l'écran.

**Le verrou est adossé à la preuve, pas à la date d'inscription :**

| État du profil | Les métiers |
| --- | --- |
| Pas encore vérifié | Libres. Une faute de frappe se corrige seul. |
| Vérifié (Kbis + assurance contrôlés) | Figés. Le déclencheur `tient_les_metiers` refuse. |
| Besoin d'en changer | Demande motivée (`metier_demandes`), tranchée par un humain. |

Ce que cela garantit à celui qui lit un profil : **les métiers affichés sont
ceux qui étaient là quand les papiers ont été contrôlés.** Un verrou posé dès
l'inscription n'aurait rien garanti de tel, et aurait envoyé chaque faute de
frappe dans une file d'attente que personne ne traite.

`npm run verifier-metiers` compare la liste de l'application et la contrainte
SQL : deux listes qui divergent font refuser l'enregistrement sans que rien ne
le montre en mode démo.

## La Place des pros

Un artisan connecté voyait « Assistant IA — trouver le bon pro ». Il n'a pas
besoin qu'on lui trouve un artisan : il en est un. Cet onglet devient donc,
côté professionnel, une place de marché entre pros. Côté particulier, rien ne
change.

Cinq types d'annonce : **je cherche** un sous-traitant, **je suis
disponible**, du matériel **à vendre**, du matériel **à louer**, un **coup de
main**.

Trois choses font la différence avec un groupe Facebook :

- **Le badge vérifié.** La sous-traitance se traite aujourd'hui par
  bouche-à-oreille, où « ce plaquiste est-il vraiment assuré ? » reste sans
  réponse. Ici le badge est adossé au Kbis et à l'attestation décennale,
  contrôlés par un humain — d'où le filtre « artisans vérifiés uniquement ».
- **Les dates.** « Je cherche un plaquiste du 12 au 20 octobre » est
  exploitable ; « je cherche un plaquiste » ne l'est pas. Un chantier se joue
  sur une semaine précise.
- **La distance**, calculée depuis les coordonnées que la Base Adresse
  Nationale pose déjà sur chaque profil.

La lecture est réservée aux comptes professionnels par une **règle RLS**
(`est_un_pro()`), pas par un réglage d'écran : un particulier qui modifierait
l'application ne verrait toujours rien. Les prix entre artisans ne sont pas
les prix au particulier.

## Ville, code postal et coordonnées

Les champs ville et adresse proposent des suggestions dès trois lettres, issues
de la **Base Adresse Nationale** (`api-adresse.data.gouv.fr`) — le service
officiel de l'État : gratuit, sans clé d'API, sans quota à demander.

Choisir une suggestion remplit d'un coup :

| Donnée | Exemple |
|---|---|
| Ville | Marseille |
| Code postal | 13001 |
| Code INSEE | 13055 |
| Département | Bouches-du-Rhône |
| **Coordonnées GPS** | 43.282, 5.405 |

Ce sont ces coordonnées qui permettent au SOS de trier les artisans par
distance réelle. La base sait les exploiter seule : la fonction
`artisans_urgence(metier, latitude, longitude)` renvoie les artisans
disponibles, triés du plus proche au plus loin, en écartant ceux dont le rayon
d'intervention ne couvre pas la distance.

La saisie libre reste possible : une suggestion qui n'arrive pas ne doit jamais
empêcher quelqu'un de taper sa ville à la main.

### Vérifier que la recherche fonctionne

```bash
npm run verifier-adresse
```

Ce script interroge réellement la Base Adresse Nationale et contrôle que les
villes, les adresses complètes, les coordonnées et le calcul de distance
répondent correctement.

Il existe pour une raison précise : une version envoyait un paramètre
`type=address` que l'API refuse. Elle répondait **HTTP 400**, le code attrapait
l'erreur et renvoyait une liste vide — aucune suggestion, aucun message. Un
test à réponse simulée n'y voyait que du feu, puisqu'il répondait « tout va
bien » quels que soient les paramètres envoyés. Ce script-ci parle à la vraie
API : il aurait attrapé la panne.

## Structure du projet

```
App.js                        point d'entrée : charge les polices, lance l'app
src/
  theme.js                    couleurs, polices, dégradés — l'identité visuelle
  OpusApp.js                  l'état de l'app et l'enchaînement des écrans
  data/demo.js                données de démonstration (mode sans Supabase)
  lib/supabase.js             connexion à Supabase
  lib/api.js                  toutes les lectures/écritures (démo OU Supabase)
  lib/ai.js                   appels à la fonction IA (aucune clé ici)
  components/                 briques réutilisables (boutons, cartes, nav...)
    ui.js                     boutons, puces, champs, bande de chantier, avatars
    icons.js                  équivalents des icônes lucide du prototype
    PostCard.js               carte du fil classique
    VideoSlide.js             diapositive du fil vidéo
    ArtisanRow.js             ligne artisan (Découvrir, partenaires)
    PortfolioGrid.js          grille de réalisations
    QuoteModal.js             formulaire devis / rappel
    TopBar.js  BottomNav.js   barres du haut et du bas
  screens/                    un fichier par écran, dans l'ordre du cahier des charges
supabase/
  schema.sql                  tables, triggers, sécurité (RLS)
  seed.sql                    données de démonstration
  functions/ai/index.ts       la fonction serveur qui appelle Anthropic
reference/opus-project.jsx    le prototype web d'origine, pour comparaison
```

## Identité visuelle

Les valeurs sont définies une seule fois dans `src/theme.js` :

| Rôle | Couleur |
|------|---------|
| Texte principal | `#1A1B19` |
| Fond général | `#E7E4DC` |
| Cartes | `#FFFFFF` |
| Bordures | `#CFC9BB` |
| Orange chantier (CTA) | `#E85C1F` |
| Bleu acier (liens, IA) | `#1B4B6B` |
| Texte secondaire | `#726E63` |

Titres et boutons en **Oswald**, texte courant en **Inter**, angles nets partout
sauf les avatars (ronds) et les petits badges, et la bande diagonale façon ruban
de chantier en haut de l'app.

**L'en-tête de profil** existe en deux partis pris, qu'on choisit d'un mot
dans `src/theme.js` :

```js
export const STYLE_ENTETE = 'immersif';   // ou 'classique'
```

`classique` — bannière de 170 px, photo centrée qui enjambe la bande de
chantier (`EnteteProfil.js`). Les trois mesures se règlent en haut du fichier.

`immersif` — grande image occupant environ 38 % de l'écran, avec **seulement**
l'identité posée dessus : photo, nom, métier, ville (`EnteteProfilImmersif.js`).

Dans les deux cas, ce qui relève de la **preuve** reste sur le fond béton :
statistiques, boutons, et surtout le bloc des informations vérifiées. Une
attestation d'assurance posée sur une photo de chantier cesse de se lire comme
un document — c'est précisément ce qu'il faut éviter dans une application dont
la valeur est la confiance.

À défaut de bannière envoyée, c'est la **première réalisation du portfolio**
qui sert de vitrine : l'artisan n'a aucune image à préparer.

## Différences assumées avec le prototype web

Le rendu et les interactions sont identiques. Trois points ont dû changer parce
que React Native n'a pas d'équivalent direct :

1. **Le cadre « téléphone »** (bordure noire, coins arrondis) n'existe plus :
   c'était une astuce d'aperçu web. Les écrans occupent tout l'écran.
2. **Les `<select>` HTML** (métier dans Publier et dans le formulaire de devis)
   sont remplacés par la même rangée de puces que l'écran Découvrir.
3. **Le menu « Contacter »** s'affiche juste sous la barre d'actions au lieu de
   flotter au-dessus : sur Android, un élément qui déborde de sa carte est coupé.

