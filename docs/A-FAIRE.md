# Ce qu'il reste à faire avant qu'Opus-Project puisse être publié

Établi le 21/09/2026, après un audit complet de l'application.
Ce fichier est la mémoire du projet entre deux sessions : **à relire et à
tenir à jour**, pas à laisser vieillir dans un coin.

L'ordre compte. Les trois premiers points ne sont pas des améliorations :
ce sont des conditions pour ouvrir l'application à de vrais utilisateurs.

---

## 1. Bloquant — fait le 21/09/2026, sauf DEUX gestes qui ne sont qu'à vous

Les trois points de cette section sont **construits et vérifiés**. Il reste
deux choses que je ne peux pas faire à votre place, et sans lesquelles rien
de tout cela ne vaut : elles sont juste en dessous.

### ⚠️ 1.0 Ce qu'il reste à faire, et que vous seul pouvez faire

**a) Remplir `src/data/legal.js`** — six informations manquent : dénomination,
forme juridique, SIREN, adresse du siège, directeur de la publication, région
d'hébergement Supabase. Tant qu'elles manquent, un bandeau orange s'affiche en
haut de chaque texte légal dans l'application, avec la liste. Ce ne sont pas
des oublis : vous seul les connaissez, et une mention légale inventée
engagerait votre responsabilité.

**b) Supabase → Authentication → Policies → activer la protection contre les
mots de passe compromis.** C'est un interrupteur, et c'est la dernière alerte
de sécurité du projet. Elle vérifie les mots de passe contre la base des
fuites connues.

### 1.1 Signalement et blocage — ✅ fait

- tables `signalements` et `blocages`, avec RLS ;
- `est_masque()` interrogée par **neuf politiques RLS** : publications,
  commentaires, avis, demandes, réponses aux demandes, annonces entre pros,
  réponses aux annonces, conversations, messages ; plus les trois écritures
  qui sollicitent quelqu'un (devis, rappel, urgence) ;
- le blocage est **symétrique** — un blocage à sens unique laisse celui qu'on
  fuit continuer à lire et à recommencer ;
- personne ne peut LISTER qui l'a bloqué ;
- un bouton de signalement sur : publication, commentaire, profil d'artisan,
  demande de particulier, annonce entre pros ;
- neuf motifs, dont deux propres au bâtiment : **travail dissimulé** et
  **photos volées** ;
- délai d'examen annoncé : **48 heures**, écrit une seule fois dans
  `src/data/moderation.js` pour que l'écran et la réalité ne divergent pas ;
- `npm run verifier-moderation` compare les listes de l'application aux
  contraintes de la base, et contrôle neuf garde-fous.

**Ce qui manque encore ici :** un signalement ne peut pas être déposé sur un
MESSAGE privé depuis l'écran de conversation (la base l'accepte déjà, le type
`message` existe). À ajouter.

### 1.2 Suppression de compte — ✅ fait

Profil → Confidentialité et sécurité → « Supprimer mon compte ». Il faut
taper le mot SUPPRIMER : un geste sans retour ne doit pas pouvoir se faire
d'un pouce qui glisse.

En deux temps : `preparer_suppression_compte()` fait le ménage et anonymise,
puis la fonction Edge `compte` vide les fichiers du stockage et ferme le
compte d'authentification — cette dernière étape demande la clé de service,
qui ne doit jamais se trouver dans l'application.

Les avis, commentaires et signalements sont **anonymisés, pas supprimés** :
les effacer ferait remonter la note d'un artisan le jour où un client
mécontent s'en va.

### 1.3 Mentions légales, CGU, confidentialité — ✅ fait (textes à compléter)

Les trois textes vivent dans `src/data/legal.js` et s'affichent depuis
l'application, **y compris avant d'avoir un compte** — on ne peut pas accepter
des conditions qu'on n'a pas pu lire. Une case à cocher, jamais pré-cochée, à
l'inscription ; la VERSION acceptée est consignée dans `users.cgu_version`.

La politique de confidentialité dit explicitement ce qui part chez
**Anthropic** quand on appuie sur « Améliorer avec l'IA », et pourquoi il n'y
a **aucun bandeau de cookies** : une application mobile n'en utilise pas, et
le seul élément gardé sur le téléphone est le jeton de connexion, strictement
nécessaire.

### 1.4 Export des données (RGPD, articles 15 et 20) — ✅ fait

Profil → Confidentialité et sécurité → « Récupérer mes données ». Renvoie du
JSON, partagé via le partage du système, pour que la personne l'envoie où
elle veut.

---

## 2. Important — la plateforme ne tient pas à l'échelle sans ça

### 2.1 Un back-office, même minimal

Aujourd'hui, valider un Kbis ou trancher une demande de changement de métier
se fait **à la main, dans le tableau de bord Supabase**. Ça va pour dix
artisans. Pas pour cent.

Le minimum : une liste des vérifications en attente, une liste des demandes
de métiers, une liste des signalements — et trois boutons.

### 2.2 Notifications push

La base les enregistre déjà (table `notifications`, alimentée par des
triggers), mais rien n'arrive sur l'écran verrouillé.

**Demande un development build** : les notifications push ne fonctionnent pas
dans Expo Go. C'est donc aussi le moment de quitter Expo Go, ce qui change la
façon de tester.

### 2.3 Rejouer `schema.sql` ne doit plus être manuel

C'est ce qui a cassé l'application le 21/09 : six commits d'avance de
l'application sur la base. Voir la règle dans `CLAUDE.md`.

Piste : des migrations numérotées plutôt qu'un fichier unique à rejouer, ou
au minimum un script qui compare `information_schema` à ce que le code attend.

---

## 3. Confort et croissance

- **Éditeur de montage** — découpe, transitions, texte. Pistes étudiées :
  Shotstack Studio (gratuit, JavaScript navigateur) et Banuba / IMG.LY (sur
  devis, development build obligatoire).
- **Publicités** — la base sait les stocker (`posts.is_ad`), les cartes
  existent dans le fil, mais rien ne les alimente.
- **Recherche par carte** — les coordonnées GPS sont déjà là, elles ne
  servent qu'au tri par distance.
- **Côté particulier** — reste plus pauvre que le côté pro.

### Les fournisseurs — première marche posée le 21/09/2026

Décision du propriétaire : les fournisseurs vivent **dans la Place des pros**,
pas dans un cinquième onglet, avec une **recherche par mots-clés** (« on met
placo et on voit toutes les nouveautés »).

**Ce qui est fait :**

- le type d'annonce `fournisseur` existe dans l'application
  (`src/data/annonces.js`) et dans la base — la contrainte
  `annonces_pro_type_check` a été refaite, en local ET sur la vraie base ;
- la **recherche par mots-clés** de la Place des pros
  (`src/lib/recherche.js`) : accents ignorés, tous les mots exigés, début de
  mot accepté, et une courte table d'équivalences du bâtiment
  (placo / BA13 / plaque de plâtre, nacelle / PEMP, IPN / poutrelle…).
  Testée par `npm run verifier-recherche`.

**Ce qui manque, et que ça a rendu visible :**

- il n'existe pas de **type de compte `fournisseur`**. Une annonce de négoce
  est donc portée par un compte professionnel ordinaire, et l'encart
  d'auteur affiche un métier d'artisan. C'est faux, et un artisan finira par
  s'en apercevoir. C'est le prochain vrai chantier de cette page :
  inscription, profil, règles RLS et modération à part ;
- les produits ne remontent pas encore dans le fil. Quand ce sera le cas,
  ils devront être **étiquetés** : `posts.is_ad` et la carte « Sponsorisé »
  existent déjà. Un produit déguisé en publication d'artisan ferait perdre
  la confiance dans tout le fil, et elle ne revient pas ;
- ce qui ferait vraiment la différence : **le stock et la distance** —
  « disponible aujourd'hui à 12 km de votre chantier ». Personne ne le fait
  bien dans le bâtiment. Mais ça suppose des données de stock côté
  fournisseur ; en v1 c'est le fournisseur qui saisit ses annonces.

**Le type de compte ne passe pas avant la section 1.** L'inscription, le
profil, les règles RLS et la modération doubleraient — et sans signalement,
suppression de compte ni mentions légales, l'application ne peut de toute
façon pas être ouverte au public.

---

## 4. Réglages à faire dans les tableaux de bord

| Où | Quoi | État |
| --- | --- | --- |
| Supabase → Authentication → Policies | Activer la protection contre les mots de passe compromis | ⏳ à faire |
| Anthropic → Settings → Limits | Poser un plafond de dépense | ⏳ conseillé |
| Cloudinary | Plan gratuit : 25 crédits/mois, à surveiller | ⏳ à surveiller |

---

## 5. Points de vigilance

- **Un profil incomplet en base** (`d23e1784-…`) : un compte porte un nom mais
  pas d'entreprise, sans doute une inscription interrompue. À nettoyer, et à
  empêcher : la fiche professionnelle devrait être créée en même temps que le
  compte, ou pas du tout.
- **Aucun test automatique d'interface.** Sept scripts de vérification
  (`npm run verifier-*`) couvrent le SQL, les listes et les formats, mais
  aucun ne rejoue les écrans. Les tests Playwright sont écrits à la main à
  chaque fois.
