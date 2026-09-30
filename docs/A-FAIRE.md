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

**A1 est maintenant COMPLET (29/09/2026).** Les profils ne partent plus
avec `select('*')` : la liste des colonnes est explicite, **sans `bio` ni
`portfolio`** — les deux colonnes lourdes, qui ne servent que sur la page
d'un artisan et arrivent avec `chargerProfilPro()`.

Et les AVIS ne sont plus chargés du tout au démarrage. Ils l'étaient pour
tous les artisans, uniquement pour afficher une moyenne dans les listes.
La note vient désormais de `avis_count` / `note_delais` / `note_qualite` /
`note_tarif`, tenus par un trigger — vérifié sur la vraie base : les
compteurs correspondent exactement aux avis réels.

Plus aucun chargement non borné au démarrage.

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

**B4 — ✅ FAIT le 30/09/2026 : un squelette, pas un rond qui tourne.**
`src/components/Squelette.js` montre la FORME de ce qui arrive — le fil,
ses cartes, ses avatars — au lieu d'un rond au milieu d'un écran vide. Un
rond dit « attends » ; il ne dit pas « attends QUOI ».

Les blocs gardent les angles vifs (ce sont des cartes, donc de la
structure), seuls les avatars sont ronds. Le battement va de 0,45 à 1 en
une seconde, et passe par `useNativeDriver` : il continue donc pendant que
le fil JavaScript est occupé à charger, ce qui est précisément le moment.

Vérifié au navigateur, en retenant le chargement quatre secondes :
28 blocs dessinés, et l'opacité relevée trois fois à 600 ms d'intervalle —
0,45 → 0,84 → 0,92.

**B5 — ✅ FAIT le 30/09/2026.** Le point orange de la cloche ne tombait
qu'en ouvrant les notifications UNE PAR UNE : après une semaine d'absence,
il fallait toucher vingt lignes pour faire disparaître une pastille, alors
qu'on voulait juste dire « j'ai vu ». La plupart des gens renoncent, et la
pastille finit par ne plus rien vouloir dire.

L'écran se met à jour tout de suite et la base suit : si l'écriture
échoue, les notifications repassent non lues au prochain chargement — on
n'a rien perdu. Éprouvé sur la vraie base avec un compte jetable : trois
notifications, une ouverte à la main, puis le bouton — 3 sur 3 lues, et
zéro notification d'autrui visible.

**B8 — ✅ FAIT le 29/09/2026 : écrire dans un champ était impossible.**
219 ms par lettre dans l'assistant IA, mesuré au navigateur avec le
processeur bridé six fois. Deux causes : l'état de saisie vivait dans
`OpusApp` (chaque lettre re-rendait tous les écrans), et un écran entier se
re-rendait pour une lettre. Un champ de recherche est désormais un
composant avec son texte à lui, et le filtrage part quand la frappe retombe
(`src/lib/frappe.js`). 219 → 26 ms, 74 → 21, 93 → 29.

**B7 — ✅ FAIT le 29/09/2026 : un échec s'affichait avec une coche verte.**
Le bandeau du haut servait à tout, pendant trois secondes, avec la même
icône. « Enregistrement impossible : … » se lisait donc comme une réussite,
et le motif technique — la seule chose utile — disparaissait avant d'avoir
été lu. Les erreurs sont désormais ROUGES, avec un triangle, sur autant de
lignes qu'il faut, et restent neuf secondes. Trente-trois appels convertis.

**B6 — ✅ FAIT le 29/09/2026 : l'application se figeait au démarrage.**
Constaté sur iPhone — « le clic marche mais plus rien ne défile », quelques
secondes, puis tout revient. Les deux listes montaient dix éléments d'un
coup (valeur par défaut de `initialNumToRender`) : dans le fil vidéo, dix
lecteurs qui se mettaient à télécharger ensemble. Réglé à 1 (vidéo) et 2
(fil classique), avec `windowSize` 3 et 5. Et le carrousel ne monte plus que
la photo affichée et ses voisines, au lieu des six.
Mesuré au navigateur : 342 nœuds et 5,8 écrans de contenu montés → 206 nœuds
et 3,2 écrans. L'effet réel, lui, ne se juge que sur le téléphone.

### C. Ce qui manque au PROFIL PRO pour être complet

**C1, C2, C3 — ✅ FAITS le 29/09/2026**, en une seule migration
(section 17 de `supabase/schema.sql`).

- **RGE** : quatre colonnes de plus (`rge_declare`, `rge_numero`,
  `rge_expire`, `rge_url`) pour ce que l'artisan DÉCLARE, et l'ancienne
  `rge` pour ce que vous avez CONTRÔLÉ. Trois états sur la fiche —
  certifié / déclarée en cours de vérification / non communiquée — et le
  troisième reste **gris, jamais rouge** : un carreleur n'a aucune raison
  d'être RGE.
- **Téléphone** : `professional_profiles.telephone`, public et appelable
  d'un geste depuis la fiche. À ne pas confondre avec
  `users.telephone`, celui d'un particulier, qui lui n'est lisible par
  personne (voir plus bas).
- **Zone d'intervention** : `zone_km`, de 1 à 300 km, pour les chantiers
  ordinaires — `rayon_km` ne valait que pour le SOS. Depuis le 30/09/2026,
  elle se **voit** : une carte au niveau de la commune avec le cercle du
  rayon, en lecture sur la fiche et au curseur dans « Modifier mon profil »
  (`src/components/CarteZone.js`). Le zoom est plafonné exprès — une carte
  qu'on agrandit finirait par montrer l'adresse du domicile.
- **En plus** : les **spécialités** (texte libre, douze au maximum). C'est
  ce qu'on tape dans une recherche — « enduit à la chaux », « douche à
  l'italienne » — alors que `metiers` est une liste fermée de douze
  entrées. La recherche de « Découvrir » les lit, et passe désormais par
  le même moteur que la Place des pros (accents et synonymes de chantier).

**Deux failles corrigées au passage** (elles n'étaient pas dans ce relevé) :

1. Un client modifié pouvait **se décerner le badge vérifié** en écrivant
   lui-même `kbis_valide = true, assurance_valide = true`. Verrouillé par
   le déclencheur `tient_le_profil_pro()`.
2. **L'e-mail, le téléphone et les coordonnées GPS de chacun étaient
   lisibles par n'importe qui** avec la clé publiable — onze comptes, cinq
   adresses, deux numéros. Une politique RLS filtre des lignes, pas des
   colonnes. Fermé par des droits de colonne (section 18), et sa propre
   fiche se lit maintenant par `mon_compte()`.

**C4 — ✅ FAIT le 30/09/2026.** « Ouvert jusqu'à 18 h » change le fait
d'appeler ou non, maintenant.

**Deux plages par jour**, et c'est le point qui compte : un artisan ferme
entre midi et deux. Une seule plage dirait « ouvert de 8 h à 18 h » à
quelqu'un qui appelle à 12 h 30 et tombera sur un répondeur — c'est pire
que pas d'horaires du tout. À 12 h 30, la fiche dit donc « Fermé · rouvre
à 14 h », pas « ouvre demain ».

La fiche affiche UNE phrase, et la semaine se déplie si on la demande :
personne ne lit sept lignes au moment où il tient son téléphone. Les jours
identiques sont regroupés — « Lundi au jeudi », comme sur une vitrine.

`horaires` à null veut dire « non renseigné », et ce n'est PAS « fermé » :
l'écran n'affiche alors rien du tout.

La base refuse ce qui ne veut rien dire (section 19 de `schema.sql`) :
neuf cas éprouvés sur PostgreSQL 16, dont « 25:00 », « ferme avant
d'ouvrir » et « trois plages dans la journée ».
`npm run verifier-horaires` couvre 38 cas côté application.

### D. Finitions visibles

- **`· 0 km`** — ✅ **FAIT le 30/09/2026.** `libelleDistance()` dans
  `src/lib/adresse.js` : moins d'un kilomètre → « dans votre commune » ;
  moins de dix → au demi-kilomètre près, parce que 3 et 7 km ne se décident
  pas pareil ; au-delà → au kilomètre entier. Distance inconnue → on
  n'affiche rien, plutôt qu'un tiret qui ferait croire à une panne.
  Douze cas contrôlés par `npm run verifier-adresse`.
- **Modifier son texte** — ✅ **FAIT le 30/09/2026.** Un commentaire se
  corrige sur place, dans la bulle ; une publication depuis « Mes
  publications ». Le TEXTE seulement : changer la photo d'une publication
  que des gens ont déjà aimée en ferait autre chose.

  La mention « · modifié » vient de la BASE (`modifie_le`), jamais de
  l'application : on ne peut donc pas récrire un commentaire en faisant
  croire qu'il n'a pas bougé.

  **Une faille a été trouvée en chemin**, et c'est la vraie raison d'être
  de cette section. La règle d'écriture était « chacun les siennes »,
  toutes colonnes confondues. Vérifié sur PostgreSQL 16 : un auteur
  pouvait s'écrire `likes_count = 9999` et surtout `created_at = now() +
  10 ans`. Le fil étant trié par date décroissante, cette publication
  serait restée **en tête du fil de tout le monde, pour toujours** — et la
  pagination par curseur n'aurait jamais atteint la suivante.
  Fermé par le déclencheur `tient_le_texte()` (section 20 de
  `schema.sql`), éprouvé sur la vraie base.
- **Accessibilité** — ✅ **FAIT le 30/09/2026.** Les 90 boutons du projet
  ont été relus : aucun n'est plus muet. Les six composants partagés
  (`BtnMain`, `BtnOutline`, `BtnMini`, `Chip`, `ChipFollow`, `IconBtn`)
  déduisent leur étiquette de leur texte, donc les écrans n'ont rien à
  écrire — sauf pour les boutons SANS texte, et c'est justement là que ça
  compte : le cœur, la croix, les flèches, les trois onglets sans libellé.

  L'état ne se met pas dans l'étiquette mais dans `aria-selected` /
  `aria-disabled` / `aria-expanded` : un lecteur d'écran annonce
  « sélectionné » lui-même, dans la langue du téléphone. Forme `aria-*` et
  non `accessibilityState` parce que la version web ne traduit pas la
  seconde : avec celle-ci, l'état se RELÈVE au navigateur, donc il se
  vérifie.

  `npm run verifier-acces` refuse désormais tout bouton sans texte ni
  étiquette. Relevé au navigateur sur le fil : 40 éléments interactifs,
  0 sans nom.

  Ce qui n'a PAS été vérifié : VoiceOver lui-même. Le relevé des attributs
  dit ce qui SERAIT annoncé, pas comment ça s'entend.

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

### 2.0 Le référentiel des métiers — ✅ FAIT le 30/09/2026

> **Le gros du chantier est construit.** Le rapport complet — ce qui a été
> fait, les fichiers, les tables, les dix tests du §20, et ce qui reste —
> est dans **`docs/RAPPORT-METIERS.md`**.
>
> En deux lignes : une seule source (`src/data/catalogue-metiers.js`,
> 15 catégories · 92 métiers · 124 spécialités), le SQL engendré depuis
> elle, un sélecteur unique qui remplace les neuf grilles de puces, et les
> 26 lignes de la vraie base migrées vers les clés sans en perdre une.
>
> **Ce qui reste** : les spécialités proposées selon les métiers choisis,
> les pièces justificatives par catégorie (un avocat n'a pas d'assurance
> décennale), et l'administration du référentiel — qui est le 2.1
> ci-dessous.
>
> Ce qui suit est l'audit d'avant, conservé parce qu'il explique les
> décisions.

#### L'audit d'origine — demandé le 29/09/2026

> **À faire juste après la première brique, et AVANT toute fonctionnalité
> nouvelle qui demande un métier** (appels d'offres, publicité ciblée,
> recherche de partenaire, disponibilités). Chaque écran construit d'ici là
> avec l'ancienne liste sera un écran à refaire.

#### Ce qui est demandé

Une **source de vérité unique** pour les métiers, un **sélecteur avec champ
de recherche** à la place des grilles de cases, et un référentiel qui couvre
**tout l'écosystème du bâtiment** — pas seulement les artisans de chantier :
architectes, bureaux d'études, géomètres, diagnostiqueurs, experts, avocats
spécialisés, courtiers, consultants. Avec des **catégories** pour organiser,
des **synonymes** pour la recherche, et des **spécialités rattachées à un
métier**.

Le document complet du propriétaire est le message du 29/09/2026 ; ce qui
suit est l'audit que j'en ai fait, à relire avant de commencer.

#### Ce qui existe déjà, et qu'il ne faut pas refaire

**La limite de 4 métiers est DÉJÀ tenue, et des deux côtés.**

- `ChoixMetiers.js` : `MAX_METIERS = 4`, compteur « 2 sur 4 », le cinquième
  n'est pas cliquable.
- La base : `pro_metiers_check` impose `cardinality(metiers) between 1 and 4`.
  Une tentative par l'API échoue — le TEST 10 demandé passe déjà.

**Le métier principal existe déjà** : c'est le premier de la liste, et le
déclencheur `tient_les_metiers()` recopie `metiers[1]` dans `metier` pour que
tout le code existant continue de lire une seule valeur.

**Les métiers d'un profil vérifié sont figés**, et une demande de
modification passe par la table `metier_demandes`, tranchée par un humain.

#### Ce qu'il y a vraiment à faire

1. **Le référentiel.** Aujourd'hui : `METIERS`, douze chaînes de caractères
   dans `src/data/demo.js`, et la même liste **recopiée en dur dans la
   contrainte `pro_metiers_check`**. Deux endroits à tenir d'accord, et
   personne ne s'en souvient. C'est le cœur du travail.
2. **Le sélecteur avec recherche**, en remplacement des grilles de puces.
3. **Les spécialités rattachées à un métier** (voir la décision n° 1
   ci-dessous).
4. **Remplacer la liste dans les douze fichiers qui l'utilisent** :
   `AuthScreen`, `ProfilEditScreen`, `CreerScreen`, `DecouvrirScreen`,
   `PlaceProScreen`, `DemandesScreen`, `SosScreen`, `QuoteModal`,
   `ChoixMetiers`, `OpusApp`, `demo.js`, `urgences.js`.

#### TROIS DÉCISIONS À PRENDRE AVANT DE CODER

Je ne les tranche pas seul : chacune change beaucoup de choses.

**Décision 1 — les spécialités.** J'ai ajouté le 29/09/2026 un champ
`specialites` en **texte libre** (douze au maximum), précisément pour que
« enduit à la chaux » rende trouvable. Le document, lui, veut des spécialités
**rattachées à un métier** et choisies dans une liste.

Les deux ont leur raison. Une liste garantit que deux artisans qui font la
même chose emploient le même mot — c'est ce qui fait marcher une recherche. Le
texte libre laisse dire ce qu'aucune liste n'avait prévu, et c'est souvent ce
qui distingue un artisan.

*Ce que je proposerai* : garder les deux. Les spécialités du référentiel
d'abord, proposées selon les métiers choisis ; et la possibilité d'en écrire
une qui n'y est pas, qui rejoint alors une file d'attente pour être ajoutée au
référentiel. Personne n'est bloqué, et le référentiel s'enrichit de l'usage
réel au lieu d'être deviné.

**Décision 2 — tableau ou tables.** Le document propose `professional_trades`
et `professional_specialties`, deux tables de liaison. Aujourd'hui c'est
`metiers text[]`, avec un index GIN.

Passer aux tables, c'est réécrire les règles RLS, les index, la recherche, le
tri des demandes et de la Place des pros. Le tableau ne gêne que le jour où un
métier portera des données propres (une certification par métier, par
exemple).

*Ce que je proposerai* : garder `metiers text[]` pour le rattachement, mais
sortir le **catalogue** dans une vraie table `metiers_catalogue` (avec
catégorie, synonymes, `actif`, `ordre`). La contrainte `pro_metiers_check`
cesse alors de recopier les douze noms : elle vérifie que chaque valeur existe
dans le catalogue et est active. Une seule source de vérité, et la migration
se limite à créer une table.

**Décision 3 — qui peut s'inscrire.** Ouvrir le référentiel aux avocats, aux
courtiers, aux experts-comptables change ce qu'Opus est. Aujourd'hui, la
vérification repose sur le **Kbis** et l'**assurance décennale** : un avocat
n'a pas d'assurance décennale, et le badge « vérifié » ne veut plus rien dire
pour lui.

*Ce que je proposerai* : des **pièces justificatives par catégorie** — Kbis +
décennale pour les métiers de chantier, inscription à l'Ordre pour un
architecte, barreau pour un avocat, ORIAS pour un courtier. Sinon, ou bien on
laisse entrer des professions sans les vérifier, ou bien on affiche « non
vérifié » à des gens parfaitement en règle.

#### Le bon moment, et pourquoi

**Maintenant la migration est gratuite** : six fiches professionnelles, sept
valeurs de métier en tout, toutes dans les douze actuelles. Vérifié sur la
vraie base le 29/09/2026. Dans six mois avec deux cents artisans, ce sera un
chantier à part entière.

Mais **après la première brique** : il reste les horaires d'ouverture, les
squelettes de chargement, et surtout zéro `accessibilityLabel` dans tout le
projet. Le référentiel des métiers est une amélioration ; l'accessibilité est
un manque.

Et le §18 du document — l'administration du référentiel — est exactement le
**back-office du 2.1** ci-dessous. Les deux se construisent ensemble : une
liste des métiers à ajouter ou désactiver, à côté des Kbis à valider.

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
  servent qu'au tri par distance et à la carte de la zone d'intervention.
  Une recherche SUR la carte, elle, poserait la question du zoom : le
  plafond qui protège l'adresse d'un artisan sur sa fiche n'aurait pas de
  sens sur une carte de recherche, et il faudra trancher ce que l'on montre
  avant de la construire.
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
