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
| 10 | Navigation | Les 5 icônes du bas, le bouton orange central. |

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

### 2.3 Autoriser la connexion anonyme

L'app n'a pas d'écran de connexion (comme le prototype) : elle ouvre une session
anonyme. Va dans **Authentication → Sign In / Providers** et active
**Anonymous sign-ins**.

### 2.4 Donner les clés à l'application

Dans Supabase : **Project Settings → API**. Tu y trouves deux valeurs.
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
`quote_requests`, `callback_requests`, `professional_partners`, `notifications`.

*(`saved_posts` a été ajoutée à la liste initiale : le bouton « Enregistrer » du
fil en a besoin.)*

### La règle « Client vérifié »

Un avis n'affiche le badge **Client vérifié** que si son auteur a réellement un
devis ou une demande de rappel **acceptée** avec ce professionnel. Ce n'est pas
une case que l'utilisateur coche : c'est la base de données qui décide, via le
trigger `calcule_client_verifie` dans `schema.sql`. La valeur envoyée par l'app
est ignorée et recalculée à chaque insertion.

Pour le vérifier : laisse un avis depuis l'app sur un pro avec lequel tu n'as
aucun devis accepté → l'avis apparaît **sans** le badge. Passe ensuite le devis
correspondant à `statut = 'accepte'` dans le Table Editor, modifie l'avis, et le
badge apparaît.

---

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
`supabase/functions/ai/index.ts`.

### Mise en place

**1. Obtenir une clé API Anthropic**
[console.anthropic.com](https://console.anthropic.com) → connexion → **API Keys**
→ **Create Key** → copie la clé (elle commence par `sk-ant-`). Elle ne s'affiche
qu'une fois. Prévois aussi un moyen de paiement : l'API est facturée à l'usage.

**2. Installer la CLI Supabase**

```bash
npm install -g supabase
supabase login
supabase link --project-ref TON_REF_PROJET
```

`TON_REF_PROJET` est la partie `xxxxxxxx` de ton URL Supabase.

**3. Ranger la clé dans les secrets du serveur**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-ta-cle-ici
```

**4. Déployer la fonction**

```bash
supabase functions deploy ai
```

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

## Différences assumées avec le prototype web

Le rendu et les interactions sont identiques. Trois points ont dû changer parce
que React Native n'a pas d'équivalent direct :

1. **Le cadre « téléphone »** (bordure noire, coins arrondis) n'existe plus :
   c'était une astuce d'aperçu web. Les écrans occupent tout l'écran.
2. **Les `<select>` HTML** (métier dans Publier et dans le formulaire de devis)
   sont remplacés par la même rangée de puces que l'écran Découvrir.
3. **Le menu « Contacter »** s'affiche juste sous la barre d'actions au lieu de
   flotter au-dessus : sur Android, un élément qui déborde de sa carte est coupé.

