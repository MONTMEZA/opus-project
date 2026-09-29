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

**a) Le statut juridique — rien à faire AUJOURD'HUI.** Mis à jour le
29/09/2026, quand le propriétaire a indiqué qu'il n'a pas encore de société
ni de SIRET.

`src/data/legal.js` porte désormais un champ `STATUT`, réglé sur `'essai'` :
l'application n'est pas ouverte au public, donc il n'y a **aucune mention
légale à publier**. Ce qu'exige la loi dépend entièrement de ce champ :

| STATUT | Quand | Ce qu'il faut afficher |
| --- | --- | --- |
| `essai` | aujourd'hui — test personnel, TestFlight interne | rien de plus |
| `particulier` | en ligne, **sans rien gagner** | l'hébergeur seul (LCEN 6-III-2), à condition d'avoir remis son identité à Supabase |
| `micro` | dès qu'Opus **peut** rapporter de l'argent | nom, SIRET, adresse |
| `societe` | SAS, SARL… | tout, capital et directeur de publication compris |

**Le passage de `essai` à autre chose n'est pas automatique** : c'est une
ligne à changer, et `npm run verifier-legal` refuse alors de passer tant que
les champs correspondants sont vides. Tester ce passage AVANT la première
mise en ligne, pas pendant.

Le chemin le moins cher pour obtenir un SIRET : **micro-entrepreneur**,
gratuit, en ligne sur le guichet unique des formalités des entreprises
(formalites.entreprises.gouv.fr). Aucune cotisation tant qu'il n'y a aucune
recette. À faire quand l'ouverture au public approche, pas avant.

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

Y compris sur un **message privé**, depuis la conversation : c'est souvent
là, et pas dans le fil, que commencent les menaces et les arnaques — et c'est
le seul endroit où personne d'autre ne peut le voir.

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

## 1 bis. Finir la PREMIÈRE BRIQUE : le réseau social et le profil pro

Relevé fait le 29/09/2026, en lisant le code, à la demande du propriétaire :
« que reste-t-il pour que la première brique soit terminée et optimisée ? »

Les fonctionnalités, elles, sont là. Ce qui suit n'invente rien de nouveau :
c'est ce qui manque pour que l'existant tienne debout devant de vrais
utilisateurs. **Par ordre d'importance réelle, pas de difficulté.**

### A. Ce qui cassera dès qu'il y aura du monde

**A1 — ✅ FAIT le 29/09/2026.** Le fil se charge par pages de 20, par
CURSEUR (« ce qui est plus ancien que telle date ») et non par numéro de
page : entre deux pages quelqu'un publie, et un numéro de page ferait revoir
une publication ou en sauter une. Vérifié sur la vraie base en rejouant trois
pages : 13 publications, 13 paginées, 13 distinctes, 0 oubliée.

Les commentaires ne sont plus chargés d'avance du tout — ils arrivent quand
on les ouvre. Le nombre affiché vient de `posts.comments_count`, tenu par un
trigger (comme `likes_count`). Et « tirer pour rafraîchir » existe enfin.

**Ce qui reste de A1 :** les PROFILS partent encore tous d'un coup
(`professional_profiles.select('*')`, portfolios compris). C'est le dernier
chargement non borné. Les messages, eux, sont traités (voir B1/B2).

~~**A1 — `loadAll()` télécharge TOUTE la base à chaque ouverture.**~~
Quinze requêtes en parallèle (`src/lib/api.js`), et **une seule `.limit()`
dans tout le fichier**. Toutes les publications, tous les commentaires, tous
les profils, toutes les demandes, tous les avis, à chaque lancement.

Avec 13 publications c'est instantané. Avec 5 000, c'est plusieurs mégaoctets
téléchargés avant que le premier écran s'affiche — sur un téléphone, en 4G,
sur un chantier. C'est LE point qui décidera si l'application est utilisable
ou non le jour où elle marche.

Ce que ça demande :
- le fil par pages de 20 (`.range()`), avec chargement à la fin du défilement ;
- les commentaires d'une publication chargés **à l'ouverture** des
  commentaires, pas tous d'avance ;
- les messages chargés **par conversation**, pas tous d'un coup ;
- les profils chargés à la demande plutôt qu'en bloc.

**A2 — ✅ FAIT le 29/09/2026.** Mesuré sur une photo de 12 Mpx réaliste
(4032 × 3024, avec du grain — un aplat uni donnerait un chiffre flatteur qui
ne veut rien dire) : **2,65 Mo → 232 Ko, soit 91,5 % de moins.** Une
publication de six photos passe de **15,9 Mo à 1,36 Mo**.

`reduireImage()` dans `src/lib/media.js` ramène à 1600 px de large (512 pour
un avatar) avant l'envoi, avec deux garde-fous : on ne touche pas à un
fichier de moins de 200 Ko — recompresser une petite image l'abîme sans rien
gagner — et si la réduction échoue on envoie l'original plutôt que de faire
échouer la publication.

Et `expo-image` remplace l'`Image` de React Native partout (photos, avatars,
bannières) : cache disque, donc redescendre dans le fil ne retélécharge plus
rien.

~~**A2 — les photos partent et reviennent en pleine résolution.**~~
`expo-image-picker` est réglé sur `quality: 0.8`, mais **sans limite de
dimension** : une photo d'iPhone fait 3 à 4 Mo. Une publication de six photos
= une vingtaine de mégaoctets à l'envoi, et autant à chaque lecture par
quelqu'un d'autre.

La solution ne coûte rien et tient dans Expo Go (paquets Expo officiels,
vérifiés à jour le 29/09/2026) :
- **`expo-image-manipulator`** (57.0.20) — redimensionner à 1600 px de large
  AVANT l'envoi. Une photo passe de 3,5 Mo à environ 400 Ko, sans différence
  visible sur un téléphone ;
- **`expo-image`** (57.0.5) — remplace `Image` de React Native et apporte le
  cache disque. Aujourd'hui, redescendre dans le fil retélécharge tout.

(Les transformations d'image de Supabase feraient la même chose côté serveur,
mais elles sont réservées aux offres payantes. Redimensionner sur le
téléphone est gratuit, et fait gagner aussi sur l'envoi.)

### B. Ce qui manque pour que ça se comporte comme une vraie application

**B1 — ✅ FAIT le 29/09/2026.** Prouvé de bout en bout avec un compte
jetable : abonnement `SUBSCRIBED`, ligne insérée APRÈS l'abonnement, reçue
en **301 ms**. Compte supprimé après l'essai.

Piège à ne pas redécouvrir : une table absente de la publication
`supabase_realtime` ne diffuse rien, et l'abonnement **ne renvoie aucune
erreur** — il se connecte et attend indéfiniment. `messages` et
`notifications` y sont inscrites (schema.sql, section 15).

**B2 — ✅ FAIT le 29/09/2026.** Pastille orange sur la conversation, point
sur l'onglet Messages, et les messages reçus passent en lus à l'ouverture.

`marquer_lus()` ne touche QUE la colonne `lu`, QUE sur les messages reçus,
et QUE dans une conversation dont l'appelant est participant. Pas de
politique `update` sur `messages`, et il ne doit pas y en avoir : elle
permettrait au destinataire de récrire le TEXTE du message reçu. Vérifié :
la tentative de récriture échoue.

**B3 — ✅ FAIT le 29/09/2026**, en même temps que la pagination.

**B4 — aucun écran de chargement progressif.** Pas un squelette : l'écran
reste vide, puis tout apparaît d'un coup. Sur une connexion lente, on croit
que l'application est plantée.

**B5 — pas de « tout marquer comme lu »** sur les notifications.

### C. Ce qui manque au PROFIL PRO pour être complet

**C1 — la colonne `rge` existe en base et n'est utilisée NULLE PART.**
C'est pourtant le label qui ouvre MaPrimeRénov' à ses clients : pour un
artisan, c'est un argument commercial de premier plan, et il est déjà à
moitié construit. À afficher sur le profil, à filtrer dans la recherche, et à
contrôler comme le Kbis.

**C2 — un artisan ne peut pas publier de numéro de téléphone.** Le champ
`telephone` n'existe que du côté particulier de `ProfilEditScreen`. Sur un
annuaire professionnel, c'est le premier renseignement qu'on cherche.

**C3 — pas de zone d'intervention** pour les chantiers ordinaires. Le rayon
en kilomètres n'existe que pour le SOS.

**C4 — pas d'horaires.** « Ouvert jusqu'à 18 h » change le fait d'appeler ou
non, maintenant.

### D. Finitions visibles

- **`· 0 km`** s'affiche quand l'artisan est dans la même commune
  (`DemandesScreen.js:241`, `PlaceProScreen.js:388`). Il faudrait « dans votre
  commune ».
- **Un commentaire ne peut être ni modifié ni supprimé** par son auteur.
  Une publication non plus (la suppression, elle, existe).
- **Zéro `accessibilityLabel` dans tout le projet.** Un artisan qui travaille
  avec des lunettes, ou qui utilise le zoom de son téléphone, n'a aucune aide.

### L'ordre que je recommande

1. **A2** (photos redimensionnées) — une demi-journée, effet immédiat et
   visible dès le premier essai sur téléphone.
2. **A1** (pagination) — le vrai chantier, mais il devient beaucoup plus
   coûteux à faire plus tard.
3. **B1 + B2** (temps réel et messages lus) — c'est ce qui fait passer la
   messagerie de « maquette » à « ça marche ».
4. **C1** (RGE) — le plus rentable des quatre points profil : la moitié est
   déjà en base.
5. **B3, B4, D** — finitions, à faire au fil de l'eau.

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
