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

**c) Retirer une colonne devenue inutile — facultatif, sans urgence (17/10).**
Supabase → SQL Editor, coller cette ligne, puis « Run » :

```sql
alter table public.entreprise_registre drop column if exists gele;
```

Et deux autres restes, relevés le 20/10 en comparant la vraie base au dépôt,
aussi inoffensifs et aussi facultatifs :

```sql
drop function if exists public.admin_basculer_metier(text, boolean, text);
drop policy if exists "lecture demandes visiteur" on public.demandes;
```

La fonction est l'ancien bouton « désactiver un métier », retiré avant
d'être livré : personne d'autre que l'administration de Supabase ne peut
l'appeler, et rien ne l'appelle. La politique ne laisse plus rien lire
(`using (false)`) : quand la lecture des demandes a été fermée, elle a été
neutralisée plutôt que retirée, le connecteur refusant un `drop`.

La colonne `gele`, elle, portait l'ancien verrou des entreprises retirées,
remplacé le 17/10 par une table à part (CLAUDE.md, « La réserve survit au
compte »). Plus rien ne la lit ni ne l'écrit, et aucune ligne ne l'utilise :
la laisser ne casse rien. Le connecteur de Claude refuse de la retirer lui-même — un geste qui
efface une colonne attend une confirmation humaine, et c'est voulu.

**b) Supabase → Authentication → Policies → activer la protection contre les
mots de passe compromis.** C'est un interrupteur, et c'est la dernière alerte
de sécurité du projet. Elle vérifie les mots de passe contre la base des
fuites connues.

**d) Ajouter le connecteur Supabase EN LECTURE SEULE — décidé le 19/10/2026.**
Pour que Claude lise la base sans vous demander, et vous demande toujours
avant d'écrire (`docs/AUDIT-PERMISSIONS-SUPABASE.md`). Dans claude.ai →
Paramètres → Connecteurs → ajouter un connecteur personnalisé :

- nom : `SupabaseLecture` ;
- adresse :
  `https://mcp.supabase.com/mcp?project_ref=lqzqdoiiqgqapqldrewg&read_only=true&features=database,debugging,development,docs,functions,storage`
- puis se connecter à Supabase quand la fenêtre le demande.

**Ne retirez pas le connecteur Supabase actuel** : c'est par lui que passent
les écritures, avec votre accord. Ensuite, une NOUVELLE session (les
connecteurs se lisent au démarrage) :

- [ ] le connecteur `SupabaseLecture` ajouté dans claude.ai ;
- [ ] dans la nouvelle session : relever le vrai nom de ses outils, écrire et
  commiter `.claude/settings.json` (lectures autorisées une par une ;
  « toujours demander » sur `execute_sql` et les outils d'écriture du
  connecteur d'origine — CLAUDE.md, « Les permissions Supabase ») ;
- [ ] l'éprouver : une lecture par le connecteur de lecture passe seule, une
  écriture par lui est REFUSÉE par la base, et une écriture par le
  connecteur d'origine demande votre accord.

### 1.0 ter La fluidité du fil — ✅ RÉGLÉ (17/10/2026)

Les saccades pendant l'élan ont été corrigées sur trois causes lues dans le
code natif (CLAUDE.md, « Les saccades pendant l'ÉLAN du fil »). **Vérifié
par le propriétaire sur son iPhone 16, en build « preview »** : plus de
saccades, les vidéos démarrent quand on s'arrête dessus. Le compteur d'images
perdues a été retiré le même jour, sans avoir été lu.

Ce qui reste, et qui n'est pas urgent :

1. ~~La netteté des photos~~ — **confirmée** par le propriétaire le 17/10 :
   « toujours aussi nettes ».
2. **Si une saccade revient** : les dégradés dessinés par le processeur (le
   voile de chaque photo, et les 7 publications « dégradé » de démonstration
   de la vraie base — que le propriétaire peut aussi décider de supprimer,
   puisque ce sont des données d'essai).

Les deux restes relevés pendant le diagnostic sont **traités le 17/10**
(CLAUDE.md, « Les restes du diagnostic ») : les cinq séparateurs fléchés, la
visionneuse qui montait dix lecteurs — et, trouvé en chemin, la grille du
portfolio qui en créait un par vidéo sans aperçu.

### 1.0 bis Avant d'ouvrir : éprouver Opus comme il sera VRAIMENT utilisé

Décidé avec le propriétaire le 15/10/2026 : « je ne veux pas que le jour où
Opus est lancé avec des utilisateurs, Opus plante ou rame ». **À faire quand
Opus sera terminé et prêt à ouvrir, pas avant** — c'est sa décision, et elle
est juste : mesurer la tenue en charge d'une application qui change encore
chaque semaine, ce serait la mesurer deux fois.

Ce qui plantera ou ramera ce jour-là ne se voit PAS avec 13 comptes et
20 publications. Ça se voit avec mille artisans, des photos lourdes et une
4G faible au fond d'une cave. D'où trois gestes :

1. **Un rapport de plantage.** Aujourd'hui, si Opus plante sur le téléphone
   de quelqu'un, personne ne le sait — ni l'erreur, ni la ligne, ni
   l'appareil. Un outil qui prévient, avec la pile d'appels, avant que la
   personne ait désinstallé. À choisir le moment venu, en vérifiant qu'il
   fonctionne dans une version construite par EAS.
2. **Un essai à grande échelle de la base.** Une COPIE remplie de milliers de
   comptes, de publications, d'annonces et de demandes — jamais la vraie
   base. Puis mesurer que le fil, la loupe, la Place des pros, les Demandes et
   l'administration répondent toujours vite. C'est la leçon du lot 4 en grand :
   « mesurer avec sept éléments ne prouve rien ».
3. **Une version d'essai donnée à quelques artisans d'abord**, par TestFlight,
   en mode production. Ils trouveront ce que ni le propriétaire ni moi
   n'aurons pensé à essayer — et c'est aussi la seule façon de juger la
   fluidité réelle : la version de développement installée le 15/10 fait
   tourner le code en mode développement, nettement plus lent que la vraie
   application.

Et les gestes déjà connus qui tombent au même moment : activer la
confirmation par e-mail (section 31 de `CLAUDE.md`), créer la boîte aux
lettres sur `opus-project.com`, signer le contrat de sous-traitance du
carnet de clients (`EDITEUR.contratSousTraitance`), passer `STATUT` hors de
`'essai'` et faire passer `npm run verifier-legal`.

Et deux de plus, trouvés le 17/10 (`docs/DONNEES-DES-ARTISANS.md`) :

- **le registre des traitements faits POUR le compte des artisans**
  (RGPD art. 30.2) — Opus est sous-traitant du carnet de clients, et la
  dispense des moins de 250 salariés ne joue pas pour un traitement qui
  n'est pas occasionnel. La CNIL publie des modèles ; c'est l'un des trois
  manquements de la sanction MOBIUS du 11/12/2025 ;
- **réécrire `legal.js` sur trois points** avant toute base commune ou
  toute API : « Opus ne vend ni ne loue vos données » (l. 626), « n'est pas
  utilisé pour entraîner de modèle » (l. 754), et la licence limitée à
  l'affichage (l. 397-402, 499-503). Puis apprendre ce nouvel état à
  `verifier-legal`.

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

## 1 ter. L'audit « waouh » du 01/10/2026 — `docs/AUDIT-WAOUH.md`

Toute l'application a été parcourue au navigateur, écran par écran
(45 captures), mesurée, puis relue par onze lectures indépendantes :
**109 constats**. Le rapport complet et les huit lots sont dans
`docs/AUDIT-WAOUH.md`.

**Le lot 1 — le socle du toucher — est FAIT** (état pressé sur toute
l'application, doctrine haptique, échelle de mouvement dans `theme.js`,
`npm run verifier-retour`).

**Le plus grave n'est pas esthétique, et il passe avant le reste :** une
demande de devis, de rappel ou d'urgence est insérée dans la base et n'est
**jamais relue ni notifiée**, alors que l'application affiche « X est
prévenu ». C'est le lot 2.

---

## 1 quater. La refonte « recherche et divertissement » — en cours

Décidée avec le propriétaire le 05/10/2026, après le constat qui ouvre tout :
**le fil n'avait aucun filtre.** Six lots, dans cet ordre, et l'ordre n'est
pas négociable — chacun pose le socle du suivant.

| | lot | état |
|---|---|---|
| **A** | Le LIEU d'une publication (section 32) | ✅ 05/10/2026 |
| **B** | La loupe : un filtre DUR, tenu par la base (section 33) | ✅ 05/10/2026 |
| **C** | « C'est un conseil » : une étiquette, pas un format (section 34) | ✅ 05/10/2026 |
| **D** | Les vues : un signal, et quelqu'un qui le LIT (section 35) | ✅ 05/10/2026 |
| **E** | Le chantier : coudre les publications (section 36) | ✅ 06/10/2026 |
| **F** | Les concours | **après immatriculation** |
| **G** | La cloche : une notification est une ADRESSE (section 37) | ✅ 07/10/2026, **vérifié sur l'iPhone** |
| **H** | Le socle de l'agent : qui appelle l'IA, et on le note (section 38) | ✅ 07/10/2026 |
| **I** | Le récit du chantier, écrit par l'agent (section 39) | ✅ 07/10/2026 |
| **J** | Nommer son agent : proposer trois fois, puis se taire (section 40) | ✅ 07/10/2026 |
| **J bis** | « Ce que votre agent sait faire », et le contrôle qui oblige à la tenir | ✅ 07/10/2026 |
| **portes** | Les fonctions de déclencheur ne sont plus appelables (section 43) | ✅ 11/10/2026 |
| **sortie** | `for all` laissait supprimer sa ligne `users` : raccourci fermé (section 18.2) | ✅ 11/10/2026 |
| **1 — Clients** | Le carnet de clients, module 1 du logiciel de gestion (section 41) | ✅ 11/10/2026 |
| **le clavier** | Il recouvrait les champs du bas de DIX-SEPT conteneurs ; un seul les gérait (`src/lib/clavier.js`) | ✅ 11/10/2026 — **vérifié sur l'iPhone** |
| **l'adresse d'un client** | Elle se propose, et un appui remplit la rue, le code postal et la ville | ✅ 11/10/2026 |

Le lot **G** n'était pas prévu : il vient de trois défauts que le
propriétaire a trouvés en se servant de la cloche. Il a fallu **trois
tentatives** pour le « ça ne me dirige pas sur le post », et la troisième a
tranché en supprimant le problème au lieu de le rattraper — une publication
visée s'ouvre désormais seule sur sa page (`PublicationScreen.js`).

Le lot **H** n'était pas prévu non plus, et il était pourtant la condition
de tout ce qui suit : la fonction Edge `ai` **n'a jamais regardé qui
l'appelait**. N'importe qui détenant la clé publiable — c'est-à-dire
n'importe qui ayant l'application — pouvait faire payer des appels Anthropic
au propriétaire. La porte est fermée, chaque appel entre au journal d'audit
du §21, une limite quotidienne est tenue par la base, et **l'artisan lit ce
journal** dans « Confidentialité et sécurité → Mon agent ».

Le lot **J** vient d'une demande du propriétaire sur la fenêtre de
présentation de l'agent : « il puisse dire plus tard, mais il faut que de
temps en temps elle lui re propose pour pas qu'il ne saute cette étape ».
Les deux moitiés tirent en sens inverse — et c'est un compteur en base,
borné à trois, qui les tient. Il a aussi fait apparaître un trou du lot H :
**l'export RGPD de la vraie base ne contenait pas le journal de l'agent**,
la migration ayant emporté la table mais pas `mes_donnees()`. Corrigé le
jour même.

**Ce que le lot E laisse ouvert, et qui est le but** : la place du récit
écrit par l'IA est posée sur la page du chantier, vide, et visible du seul
artisan. Le socle qu'elle attendait — journal d'audit et identité de
l'appelant — **existe depuis le lot H**. C'est donc le prochain lot (I),
avant les gabarits.

**Et le rangement des anciennes publications** : les seize déjà en base
n'appartiennent à aucun chantier, et personne ne peut deviner lesquelles
vont ensemble. Le verrou de la section 20.1 laisse désormais passer
`chantier_id`, donc l'écran est possible ; il reste à l'écrire.

**Le lot F ne se construit pas avant.** Le propriétaire l'a posé lui-même :
« bien sûr pour les jeux Opus sera immatriculé avant de lancer ces
choses-là ». Un jeu-concours engage juridiquement celui qui l'organise, et
`src/data/legal.js` porte `STATUT = 'essai'` — voir le §1.0 ci-dessus.

### Et après : le MONTAGE, avec des gabarits

Demandé par le propriétaire, et **gardé pour plus tard, volontairement** —
c'est écrit ici pour que ça ne se perde pas entre deux sessions :

> « Je ne veux pas concurrencer CapCut. Je veux que les artisans puissent
> poster des vidéos qui mettent en avant leur travail et qui donnent envie
> au particulier de les regarder — un système de montage photo ou vidéo très
> simple à utiliser. Si il faut intégrer une API existante on peut le faire. »

Puis, en tranchant la forme :

> « On laissera le choix de créer seuls nos posts, et on proposera pour le
> moment **3 vidéos, 3 montages avant/après et 3 posts** avec un beau design
> — et l'artisan a juste à remplir avec sa vidéo ou son texte, et c'est prêt
> à poster. »

**Neuf gabarits, et le libre reste libre.** C'est le point à ne pas
réinterpréter : un gabarit ne REMPLACE pas la publication ordinaire, il
s'ajoute à côté. Qui veut poser sa photo et écrire deux lignes continue
exactement comme aujourd'hui.

#### Ce qu'on a DÉJÀ, et qui rend ce lot beaucoup plus petit qu'il n'en a l'air

Vérifié dans le code le 05/10/2026, avant d'en parler :

| | état |
|---|---|
| le format vertical 9:16 | **déjà exact** — 720 × 1280 dans `cloudinary-adresses.js`, c'est celui de TikTok |
| coller les clips bout à bout | **déjà fait** (`fl_splice`, `urlMontage`) |
| poser une musique par-dessus | **déjà fait** (`ac_none` + `l_audio:`) |
| la vignette de couverture | **déjà fait**, mais prise à la 2ᵉ seconde, au hasard |
| du texte incrusté dans l'image | Cloudinary sait le faire (`l_text:`), **pas branché, pas essayé** |
| des sous-titres automatiques | demanderait une API de transcription — **la seule vraie nouveauté** |

> **L'API qu'il nous faut, on l'a déjà.** Ce qui manque n'est pas de la
> technique : c'est du RYTHME (un clip peut faire 20 s, le rythme
> d'Instagram est de 1,5 à 3 s par plan), du TEXTE à l'écran (la moitié des
> gens regardent sans le son), et une COUVERTURE choisie plutôt que tirée au
> hasard.

#### Et la raison du gabarit, qui est tout le lot

> **Une timeline, c'est du travail.** Personne n'ouvre une timeline ; tout
> le monde choisit un modèle. **Un gabarit, c'est un montage DÉJÀ FAIT dont
> il ne reste que les trous à remplir** — trois clips, trois coupes calées,
> trois titres incrustés, une musique, une couverture. L'artisan ne monte
> rien, il remplit.

**Ce qui est ÉCARTÉ pour l'instant, et pourquoi :** les sous-titres
automatiques. Ils coûtent une API payante à la minute de vidéo, pour un
bénéfice qui ne se verra que le jour où il y aura du monde. À reprendre
quand il y aura du monde, pas avant.

**Et le piège à ne pas redécouvrir :** une dépendance native imposerait un
*development build*, donc la sortie d'Expo Go — aujourd'hui le seul moyen
d'essai du propriétaire. Les gabarits se construisent en calcul d'adresses
Cloudinary, **sans aucune dépendance nouvelle**, comme la carte (`tuiles.js`)
et le calendrier (`Calendrier.js`) avant eux.

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

### 2.1 Un back-office — lot 1 ✅ FAIT le 03/10/2026

Avant, valider un Kbis ou trancher un signalement se faisait **à la main,
dans l'éditeur SQL de Supabase**. Deux files sont désormais dans
l'application : Profil → **Administration**.

**Ce qui a décidé de l'ordre**, relevé sur la vraie base le 02/10 :
un signalement du **29/09** était encore au statut `nouveau` quatre jours
après, alors que l'application promet « un examen sous 48 heures ». Et
`kbis_url` était vide sur les six fiches — la chaîne envoi → contrôle →
badge n'avait **jamais** tourné une seule fois.

**Ce qui est en place** (section 25 de `schema.sql`, `AdminScreen.js`) :

- `administrateurs` + `est_admin()`, et **aucune politique d'écriture** : un
  administrateur ne peut pas en nommer un autre, la seule entrée est
  l'éditeur SQL ;
- `journal_admin`, qui garde l'avant et l'après de chaque décision et que
  **personne ne peut écrire, modifier ni effacer** — seules les fonctions de
  la base y écrivent. Un acte s'anonymise quand son auteur part ;
- vérifier / refuser un professionnel (motif obligatoire pour un refus),
  trancher un signalement, le tout avec notification à l'intéressé ;
- les documents privés s'ouvrent par une adresse signée **cinq minutes** ;
- `npm run verifier-backoffice` tient les vingt-sept garde-fous, dont celui
  qui compare les actions insérées à la contrainte `check`.

> ⚠️ **On ne vérifie pas sa propre fiche.** La base refuse, et c'est voulu —
> un badge atteste qu'un humain a regardé les documents de quelqu'un
> d'AUTRE. L'écran l'explique au lieu de laisser tomber sur une erreur.

### 2.1 bis Le back-office — lot 2 ✅ FAIT le 04/10/2026

**Les pièces justificatives par catégorie** (décision 3 du 30/09). Il y a
toujours DEUX pièces — aucun changement de schéma —, mais leur NATURE suit
le métier : existence légale (Kbis **ou avis SIRENE**, qu'un
micro-entrepreneur n'avait nulle part) et couverture (**décennale** pour qui
construit, **RC professionnelle** pour qui conseille). Un avocat pouvait
sinon n'obtenir le badge jamais. Les CGU, qui promettaient « un Kbis et une
décennale », ont été corrigées en même temps.

**La troisième file du back-office** : demandes de changement de métier, et
spécialités proposées. Accepter une demande **applique vraiment** les
métiers — l'artisan vérifié ne peut pas le faire lui-même, c'est la raison
d'être de cette table, qui n'était relue par personne depuis le début.

`npm run verifier-pieces` (22 garde-fous) et `verifier-backoffice` tiennent
l'ensemble.

**Ce qui reste — lot 3 :**

1. ⚠️ **Désactiver un métier (§18) demande une DÉCISION avant du code.**
   La fonction a été écrite puis retirée : **rien, dans `src/`, ne lit
   `metiers_catalogue.actif`** — le sélecteur filtre le FICHIER
   `src/data/catalogue-metiers.js`. Un bouton « désactiver » aurait
   parfaitement marché en base et n'aurait rien changé à l'écran. Il faut
   trancher où vit la vérité : dans le fichier (désactiver = changement de
   code, cohérent avec « une seule source ») ou dans la base (le sélecteur
   doit alors la charger au démarrage, et ne marche plus hors ligne). Détail
   en section 27.4 de `schema.sql` ;
2. **Un emplacement d'envoi pour les pièces complémentaires** (ORIAS,
   COFRAC, Ordre des architectes, certification amiante). Elles sont
   déclarées et rappelées à l'administration, mais sans endroit où les
   déposer. À construire le jour où quelqu'un de ces métiers s'inscrit —
   pas avant : un emplacement que personne ne remplit est le défaut que ce
   projet traque depuis le 01/10 ;
3. **Faire confirmer ces exigences** avant l'ouverture au public. Elles
   correspondent à des obligations réelles de ces professions, mais une
   exigence inventée écarterait des artisans légitimes.

### 2.1 ter Les pièces jointes en messagerie — ✅ FAIT le 04/10/2026

Votre idée du 01/10, et c'était bien le vrai besoin derrière l'e-mail de
contact : **recevoir un plan, un devis signé, une attestation.** Un trombone
à gauche du champ de saisie, un aperçu de ce qui va partir, et une bulle
qu'on touche pour ouvrir le fichier.

**Ce qui est tenu par la base, et pas par l'écran :**

- l'espace `pieces-jointes` est **privé** et borné à 10 Mo ;
- deux politiques seulement, LECTURE et ENVOI, et chacune pose les **trois**
  questions : est-ce mon dossier, est-ce ma conversation, et n'y a-t-il pas
  de blocage entre nous. En oublier une ouvrirait les devis de tout le
  monde ;
- **aucune politique de modification ni de suppression** : une pièce
  envoyée ne se retire pas, exactement comme un commentaire auquel on a
  répondu ne se récrit plus. Ce qui engage quelqu'un d'autre se ferme ;
- `messages_contenu_check` accepte un message **sans texte** dès qu'il porte
  une pièce — et refuse une bulle entièrement vide, ce que rien n'empêchait
  jusqu'ici.

**Un défaut a été trouvé en l'essayant pour de vrai, et il était grave.**
L'extension du fichier était lue dans son ADRESSE. Au navigateur, cette
adresse est un `blob:` sans aucun point, et l'extension est alors devenue
l'adresse entière. Le fichier s'est rangé deux niveaux de dossier trop bas,
et le ménage de compte — qui descend trois niveaux — ne l'a plus trouvé.

Mesuré sur votre base : le compte d'essai supprimé, son message effacé, la
réponse disait `"pieces-jointes","retires":0` **sans erreur**… et le fichier
était toujours là. Un trou RGPD que rien ne signalait. L'extension se lit
désormais dans le NOM du fichier (`src/lib/types-fichiers.js`), et la
fonction Edge **dit** quand elle s'est arrêtée trop tôt.

> ⚠️ **Un seul geste pour vous** : il reste **un fichier orphelin** dans
> Supabase → Storage → `pieces-jointes`, celui qu'a laissé ce défaut.
> Le dossier commence par `cd3711c0-2daa-4d3b-beb8-652475cb9be9`. Vous
> pouvez le supprimer en toute sécurité — le compte qui l'a déposé n'existe
> plus. Je ne peux pas le faire d'ici : le connecteur Supabase refuse, par
> sécurité, tout ordre de suppression, et c'est une bonne chose.

**Le trombone laisse choisir d'où vient le fichier** — ajouté le
04/10/2026, après votre essai sur l'iPhone : « le bouton ouvre directement
les fichiers ; il faudrait qu'on puisse choisir, si par exemple ce qu'on
veut envoyer est une photo ».

Vous aviez raison, et c'était une erreur de ma part. Sur iPhone,
**Fichiers ne montre pas la photothèque** : ce sont deux applications
différentes. Un artisan qui vient de photographier une fissure n'avait
donc aucun moyen de l'envoyer. Le trombone ouvre désormais trois
choix — **Photothèque**, **Appareil photo**, **Fichiers** —, chacun avec
une phrase qui dit ce que c'est.

Deux chiffres faux ont été corrigés au passage, et aucun ne faisait
planter quoi que ce soit : une photo réduite restait annoncée avec son
**type** et son **poids d'avant réduction**. Mesuré sur votre base : 5,9 Mo
affichés pour un fichier qui en pesait 1,3.

**Ce qui n'a pas pu être vérifié ici**, et qu'il faut regarder sur
l'iPhone :

- **l'appareil photo n'a pas pu être essayé du tout** — il n'y en a pas
  dans ce conteneur ;
- la photothèque et Fichiers ont été pilotées au navigateur, pas au doigt ;
- l'ouverture d'un PDF reçu passe par le visualiseur du téléphone ;
- les pièces jointes n'arrivent **pas en temps réel** (le WebSocket ne
  s'intercepte pas depuis ce conteneur) : elles apparaissent au
  rechargement de la conversation.

**Les photos se voient directement dans la conversation** — fait le
04/10/2026, à votre demande. Une photo s'affiche, un PDF garde son nom :
« photo-2026-10-04-1530.jpg » ne dit rien, « devis-cuisine-dupont.pdf »
dit tout.

Mon objection d'avant était à moitié fausse, et je le note : Supabase sait
signer **toutes** les adresses d'une conversation en **un seul appel**.
Mesuré, conversation rechargée : 1 requête de signature, quel que soit le
nombre de photos.

Ce qui reste vrai : votre projet est en plan **gratuit**, donc Supabase ne
sait pas servir une version réduite à la volée (c'est payant). Chaque
vignette télécharge donc la photo entière. Elles sont déjà ramenées à
1600 px avant l'envoi et mises en cache sur le téléphone, donc c'est une
fois, pas à chaque fois qu'on remonte la conversation. **Si un jour une
conversation chargée de photos devient lourde en 4G, dites-le-moi** : la
parade est de ranger une seconde copie réduite à côté, et ça se fait sans
rien casser.

`npm run verifier-pieces-jointes` tient l'ensemble — et il **fait tourner**
le calcul d'extension sur l'adresse qui a cassé, au lieu de relire le code.

### 2.1 quater Le point orange dit maintenant OÙ — ✅ FAIT le 04/10/2026

Votre remarque : « on voit un point orange sur Découvrir, c'est parfait,
mais après on clique et on a trois choix — le point ne s'affiche pas, donc
on ne sait pas ce qui doit être vu. »

Le vrai défaut n'était pas l'absence de point sur les onglets : c'est que
**la barre du bas calculait sa condition dans son coin**, sans lien avec ce
qu'on trouverait derrière. Deux formules pour une seule vérité.

La règle qui en sort, et qui vaudra pour tout ce qui suivra :

> **Un voyant de parent est exactement le OU de ses enfants.** Sinon il
> envoie chercher dans le vide, et au bout de trois fois on cesse de le
> regarder.

Le point apparaît donc sur « Pour moi » et sur « Demandes », jamais sur
« Place des pros » — rien n'y est adressé à quelqu'un en particulier, donc
un voyant ne s'y éteindrait jamais.

Vérifié au navigateur : avant d'ouvrir, le point est sur Découvrir ET sur
Demandes ; après, les deux sont éteints. `npm run verifier-voyants` refuse
qu'ils puissent diverger à nouveau.

### 2.1 quinquies La Place des pros — la boucle se referme ✅ 04/10/2026

Relevé sur votre base avant d'y toucher : **2 annonces, 0 réponse,
6 professionnels.** Et cinq trous, dont le premier est de la même famille
que celui du 01/10 :

1. **« 3 réponses » était un nombre mort** — ni qui, ni quoi, et appuyer
   dessus ne faisait rien ;
2. **le message d'une réponse n'était jamais enregistré** ;
3. **personne n'était prévenu** quand quelqu'un répondait ;
4. **répondre posait un brouillon.** Abandonné, le compteur montait et vous
   n'entendiez jamais personne ;
5. **vous ne pouviez pas retrouver vos propres annonces** autrement qu'en
   faisant défiler la liste publique.

Les cinq sont bouchés. En répondant, on écrit maintenant un vrai message —
« Disponible jeudi et vendredi, je viens avec la remorque » — qui part
**pour de bon** dans la messagerie. L'auteur reçoit une notification qui
nomme l'annonce concernée, et son compteur s'ouvre sur la liste de ceux qui
ont répondu, avec leur message.

**Et un défaut de confidentialité qu'il fallait corriger AVANT :** la règle
disait « tout professionnel lit toutes les réponses ». Tant que le message
restait vide, cela ne montrait qu'un identifiant. Le jour où on le
remplit — c'est tout l'objet de ce lot —, n'importe quel artisan aurait pu
lire **qui a répondu à quoi, et à quel prix.** Une réponse ne se lit
désormais qu'entre les deux personnes concernées.

Vérifié sur votre vraie base avec deux comptes professionnels jetables,
supprimés dans la même session, de bout en bout.

### 2.1 sexies Les dates de la Place des pros ✅ FAIT le 04/10/2026

Ce que le projet revendiquait depuis le début sans l'avoir construit :
faire correspondre les annonces **sur les dates**. Elles étaient affichées,
et c'est tout — « Plaquiste du 12 au 20 octobre » serait resté en tête de
liste en décembre.

Désormais :

- une rangée **« QUAND ? »** avec trois raccourcis : *Cette semaine*,
  *Ce mois-ci*, *Dates précises* (deux champs, « 12/10 ») ;
- **une annonce dont le chantier est passé sort de la liste** — mais reste
  visible à son auteur, marquée « Terminée », pour qu'il puisse la retirer
  ou la reposter ;
- **une pastille « Dans 3 jours »** sur la carte : la date brute oblige à
  calculer de tête, et sur un chantier on ne calcule pas.

**Une annonce sans dates reste toujours visible**, quel que soit le filtre :
une bétonnière à vendre est disponible n'importe quand.

Et un défaut trouvé en l'essayant, un dimanche : « Cette semaine » allait
jusqu'au dimanche, donc ce jour-là elle ne couvrait plus que la journée —
alors que le dimanche soir est précisément le moment où l'on prépare la
semaine. Elle couvre maintenant sept jours glissants.

Vérifié sur votre base avec deux comptes jetables supprimés dans la même
session : un pro pose quatre annonces (dans 3 jours, terminée, dans deux
mois, sans dates), un autre pro regarde — la terminée disparaît bien pour
lui et reste pour son auteur.

### 2.1 septies Le clavier de l'iPhone n'enferme plus ✅ FAIT le 04/10/2026

Vous l'avez trouvé en répondant à une annonce depuis votre iPhone : le
clavier recouvrait à la fois le champ de saisie **et** la croix pour
fermer — donc plus aucune sortie, et l'application avait l'air plantée
alors qu'elle fonctionnait.

Le défaut était à **deux** endroits, dont le **signalement** : c'est-à-dire
le chemin par lequel on demande de l'aide. Les deux passent maintenant par
une brique commune (`src/components/FeuilleBas.js`) qui garantit quatre
choses : la feuille monte avec le clavier, le voile sombre la ferme (la
sortie de secours), le contenu défile, et le premier appui sur un bouton
n'est plus avalé par la fermeture du clavier.

**À revérifier sur votre iPhone** : il n'y a pas de clavier dans le
navigateur de test, et le composant qui gère cela y est inerte. Ce qui a été
vérifié ici, c'est que le remaniement n'a rien cassé.

### 2.1 octies Des photos sur les annonces ✅ FAIT le 04/10/2026

Votre remarque : « sur les annonces on pourrait afficher des photos qui
seraient visibles sur l'annonce ». Vous aviez raison, et le défaut était
plus profond qu'un manque.

**Tout était déjà construit sauf le début.** La colonne existait en base, la
fonction de publication l'acceptait, la carte savait afficher les photos —
mais **aucun écran ne permettait d'en choisir**. Du code qui lit ce que
personne n'écrit : exactement le défaut du 01/10 (« X est prévenu » pour une
demande que personne ne relisait), vu dans l'autre sens.

Désormais, dans le formulaire d'annonce : **« Photographier »** et
**« Galerie »**, jusqu'à **quatre** photos, avec un aperçu qu'on peut
retirer. Sur la carte, un carrousel. Quatre et non trois comme pour les
demandes, parce qu'une demande montre un *problème* (une fissure se
photographie une fois) et une annonce un *objet qu'on achète sans l'avoir
vu* — une bétonnière d'occasion se regarde sous quatre angles.

Vérifié sur votre base avec un compte professionnel jetable supprimé dans la
même session : les photos partent bien vers Supabase (deux envois, deux
200), et après rechargement complet de la page la carte les affiche — donc
ce sont bien les adresses rangées en base qui sont servies.

**Pas vérifié** : le bouton « Photographier ». Il n'y a pas d'appareil photo
dans le conteneur où je travaille, ce chemin ne se juge que sur l'iPhone.

**Un point à savoir pour plus tard** : les photos d'annonce vont dans le même
espace de stockage que celles du fil, qui est **public** — l'annonce n'est
visible que des professionnels, mais sa photo est lisible par quiconque en
connaît l'adresse (40 caractères aléatoires, qui ne se devinent pas). C'est
ainsi depuis le premier jour pour le fil et les photos de profil. Le jour où
une annonce devra porter un plan ou un devis, il faudra passer par l'espace
privé et des adresses signées, comme en messagerie : c'est un lot à part.

### 2.1 nonies Les dates se choisissent au calendrier ✅ FAIT le 04/10/2026

Votre remarque : « quand on doit sélectionner des dates il faut les taper à
la main […] un petit calendrier s'ouvrirait […] il y aurait moins
d'erreurs ».

**« Moins d'erreurs » n'était pas une impression.** L'ancienne saisie
acceptait « 31/02 » et envoyait « 2026-02-31 » à la base — qui le refuse
(vérifié sur votre base : *date/time field value out of range*). Une faute
de frappe devenait un refus de la base, sans rien à l'écran pour
l'expliquer. Un calendrier ne peut pas proposer un jour qui n'existe pas.

Les quatre champs de date de la Place des pros — les deux du formulaire et
les deux du filtre — sont maintenant des **boutons**. On appuie, un
calendrier monte du bas : on touche le premier jour, puis le dernier, et la
feuille écrit « du 12 au 20 octobre » au-dessus de la grille.

Trois choses à savoir :

- **toucher un jour avant le début recommence là**, au lieu de refuser. Il
  n'existe donc aucune façon de créer un créneau à l'envers, et le message
  d'erreur qui servait à ça a disparu ;
- **dans le formulaire, les jours passés sont fermés** : une annonce pour
  un chantier déjà fait sortirait aussitôt de la liste. Dans le filtre, au
  contraire, il n'y a aucune limite — chercher est une question, pas un
  engagement, et vos annonces terminées vous restent visibles ;
- **le créneau est aussi écrit en toutes lettres**, pas seulement montré en
  orange. Dehors, en plein soleil, une teinte pâle ne se distingue pas.

**Pourquoi pas le sélecteur de dates d'iOS** — je l'ai vérifié, il est bien
disponible dans Expo Go. Il n'a pas été pris parce qu'il **ne s'affiche pas
dans le navigateur où je travaille** : je vous livrerais quelque chose que
je n'ai jamais vu. Et il ne sait pas montrer une PÉRIODE, alors que c'est
la durée qui décide un artisan. Même raisonnement que pour la carte.

Vérifié sur votre base avec un compte jetable supprimé dans la même
session : créneau choisi au doigt, annonce publiée, et après rechargement
complet de la page les dates reviennent bien de Supabase (12 au
20 novembre).

**Pas vérifié** : la précision du doigt. Les cases font 48 points de côté
sur un écran d'iPhone courant — au-dessus des 44 recommandés par Apple —
mais cela se juge au pouce, pas à la souris.


### 2.1 decies Chercher par secteur, et une recherche plus propre ✅ 04/10/2026

Vos deux remarques, et les deux étaient justes.

**1. Le filtre par secteur.** « Une annonce de bétonnière n'intéressera pas
quelqu'un de Marseille alors que la bétonnière est à Paris. » La pastille
**« Où »** propose maintenant : partout en France, autour de votre ville, ou
autour d'une autre ville — avec un rayon de 25, 50, 100 ou 200 km.

**Mais ça ne pouvait pas marcher, et c'est le vrai sujet.** Relevé sur votre
base avant de construire quoi que ce soit :

| | coordonnées enregistrées |
|---|---|
| vos 4 annonces | **0 sur 4** |
| les 7 fiches pro | **1 sur 7** — la vôtre |

Les colonnes existaient, le calcul de distance était écrit, la liste se
disait triée par proximité : **presque rien ne les remplissait.** La cause :
le champ ville ne garde les coordonnées que si on touche une suggestion
dans la liste. Or dans le formulaire d'annonce il est pré-rempli depuis
votre profil — donc personne ne touche jamais rien.

C'est corrigé des deux côtés (annonce et fiche pro) : les coordonnées sont
retrouvées **au moment d'enregistrer**, automatiquement. Et vos lignes déjà
en base ont été rattrapées, au niveau de la **commune** que chacun a
déclarée — jamais une adresse précise. Résultat : 4 annonces sur 4 et
7 fiches sur 7.

Conséquence visible tout de suite : les distances s'affichent enfin sur les
annonces (« dans votre commune », « à 12 km »), ce qui ne marchait pour
personne.

**2. Le désordre.** Vous aviez raison, et c'est mesuré. La zone de filtres
prenait **233 px** sur un écran de 900 — il ne restait que 131 px de la
première annonce, et 79 px quand les champs de dates étaient ouverts. Une
rangée « Où ? » de plus l'aurait poussée **entièrement sous l'écran**.

Les quatre rangées de puces sont devenues **quatre pastilles sur une seule
ligne** : Quoi, Où, Quand, Vérifiés. Chacune ouvre un petit panneau et
**affiche ensuite votre choix** — on lit « Matériel », « Lille (59) ·
50 km », « Cette semaine » sans rien ouvrir. La zone passe de 233 à
**104 px**, et il reste **339 px** de la première annonce.

Trois choses à savoir :

- **« Cette semaine » remplit maintenant le calendrier** au lieu de rester
  une puce muette : on voit enfin ce que le raccourci veut dire ;
- **une annonce sans lieu enregistré sort du filtre par secteur**, et
  l'écran vous le dit (« 2 annonces sans lieu précisé ne sont pas
  affichées »). Elle ne disparaît pas en silence ;
- **« Mes annonces » reste à côté du compte**, pas dans la ligne des
  pastilles : ce n'est pas un filtre, c'est l'endroit où vous allez lire vos
  réponses.

**Pas vérifié** : le défilement de la rangée au doigt. Avec les quatre
pastilles réglées, elle dépasse un peu l'écran et se fait glisser — or un
ordinateur répond à la molette, pas au glissement. **À essayer sur votre
iPhone.**


### 2.1 undecies Glisser entre les pages de Découvrir ✅ 04/10/2026

Votre demande : « j'aimerais qu'on puisse directement scroller pour passer de
"Pour moi" à "Place des pros" à "Demandes" ». C'est fait, et les pastilles du
haut restent — elles suivent la page, et on peut toujours les toucher.

**Ce qui méritait de l'attention n'était pas le geste, c'était le reste.**
Mettre trois écrans côte à côte les aurait montés tous les trois d'un coup :
trois listes, trois en-têtes, trois barres de recherche au lieu d'une. C'est
exactement ce qui bloquait votre iPhone quelques secondes au démarrage le
29/09. Une page n'est donc montée **qu'une fois visitée** — et elle le reste,
donc revenir est instantané.

Et un détail qui serait passé inaperçu : la pastille faisait trois choses en
plus de changer d'écran (recharger vos demandes, éteindre le point orange,
les marquer comme vues). Un glissement qui aurait seulement changé d'écran
aurait laissé le point allumé pour toujours — le défaut qu'on venait de
corriger. Les deux chemins passent maintenant par la même fonction. Vérifié
en glissant, pas en appuyant : le point s'éteint bien.

**À savoir** : un glissement qui démarre sur une zone qui défile déjà de côté
déplace cette zone, pas la page — la rangée de filtres, ou les photos d'une
annonce. C'est ce que fait Instagram aussi, et c'est le seul comportement
possible. Pour changer de page, on glisse sur une marge ou on touche la
pastille.

**Corrigé le même jour, après votre essai** : la première version s'arrêtait
entre deux pages sur l'iPhone. Au navigateur elle paraissait parfaite — et
les mesures aussi, vérification faite en remettant l'ancienne version en
place. La raison : l'accrochage des pages ne marche pas pareil des deux
côtés. Sur un ordinateur il suit le bord de chaque page ; sur l'iPhone il
avance d'une largeur d'écran à la fois, donc la moindre différence de
largeur fait arriver de travers, et l'écart grandit de page en page.

Trois causes possibles ont été corrigées, faute de pouvoir reproduire la
vôtre : la largeur des pages se mesure maintenant sur la zone qui défile et
non sur l'écran, une page ne porte plus de réglage qui concurrence sa
largeur, et **plus rien ne se charge pendant que vous glissez** — les pages
voisines se préparent une demi-seconde après, quand plus rien ne bouge.

**À réessayer sur votre iPhone**, c'est le seul endroit où ça se juge.


### 2.1 duodecies La page Demandes reprise ✅ FAIT le 04/10/2026

Vous la trouviez « trop triste », et vous vouliez qu'une demande déjà vue
n'allume plus le point. En vérifiant, j'ai trouvé trois défauts de fond.

**Le point ne s'éteignait jamais.** Il était retenu dans la mémoire de
l'application — donc remis à zéro à chaque lancement — et il s'allumait dès
qu'il EXISTAIT une demande, pas quand il y en avait une nouvelle. Votre base
en contient une seule, qui n'est pas récente : le point était allumé en
permanence depuis des jours. Maintenant, la date de votre dernière visite est
retenue **dans la base** : seules les demandes déposées après portent
« Nouveau », et le point ne s'allume que pour celles-là.

Petit détail qui compte : le point s'éteint dès que vous ouvrez l'onglet,
mais **les badges « Nouveau » restent affichés** jusqu'au prochain
lancement. Sinon ils s'effaceraient sous vos yeux au moment précis où vous
venez les lire.

**Une demande ne se refermait jamais.** La colonne existait depuis le premier
jour et personne ne la lisait : un chantier trouvé il y a six mois reste en
tête de liste. Le particulier a maintenant un bouton **« J'ai trouvé »** — et
lui seul : la base refuse à tout autre compte.

**Et la liste n'avait aucune limite de chargement**, contrairement au fil et
à la Place des pros. C'est corrigé.

**La lecture est maintenant réservée aux professionnels connectés**, comme
vous l'avez décidé. Avant, n'importe qui pouvait lire toutes les demandes
**sans même avoir de compte** — le texte, la commune, le prénom, et l'adresse
des photos. Vérifié sur votre base : sans compte, zéro ; un particulier qui
n'est pas l'auteur, zéro ; l'auteur voit la sienne ; un artisan voit les
demandes ouvertes.

**Et le visuel.** L'encadré explicatif prenait 165 px pour répéter la même
phrase, et avec le filtre il repoussait la première demande à 45 % de
l'écran. Il est remplacé par une ligne de pastilles, comme sur la Place des
pros : la première demande commence maintenant à **258 px au lieu de 380**.
Chaque carte montre d'un coup d'œil ce qui compte — **« Nouveau »** et
**« Pour vous »** quand c'est un de vos métiers, ce qui ne se voyait
pratiquement pas avant.

**Pas vérifié** : la page sur votre iPhone, et le ressenti — « moins triste »
ne se mesure pas. Votre base ne contenant qu'une demande, la liste bien
remplie n'a été vue qu'en démonstration.


### 2.1 terdecies « Pour moi » relu avant de fermer Découvrir ✅ FAIT le 04/10/2026

Vous avez dit « je pense qu'on a fait le tour de la partie Découvrir ». Des
trois onglets, un seul n'avait pas été relu cette semaine : **« Pour moi »**,
celui où arrivent les demandes de devis, de rappel et d'urgence. Quatre
défauts y dormaient, et aucun ne faisait planter quoi que ce soit.

**1. Quand le chargement ratait, l'écran annonçait une bonne nouvelle.** Il
affichait « Aucune demande pour le moment » — alors qu'il n'avait rien pu
lire. Le bandeau rouge, lui, s'efface au bout de quelques secondes. Il dit
maintenant « Lecture impossible », explique que ce n'est pas qu'il n'y en a
pas, et propose un bouton **Réessayer**.

**2. La liste n'avait aucune limite.** Le fil en a une, la Place des pros
aussi, les demandes depuis ce matin. Celle-ci téléchargeait tout, pour
toujours. Elle en charge 200 — **et ce qui attend une réponse passe
d'abord**, pour que la limite ne coupe jamais que du travail déjà fait.
Mesuré : avec une limite posée sans ce tri, un devis en attente vieux d'un
an disparaissait complètement derrière 250 demandes closes du jour.

**3. Une demande refusée ce matin passait devant une demande en attente
d'hier** — sur l'écran qui sert justement à savoir qui vous attend. Trois
rangs maintenant : l'urgence en attente, puis tout ce qui attend, puis le
reste.

**4. Trois règles de la base étaient écrites à deux endroits.** Sans
conséquence aujourd'hui, mais c'est la première des deux qu'on oublie le
jour où la règle change.

**Vérifié** sur la vraie base, avec un compte d'essai supprimé dans la
foulée : le devis en attente du 30 août 2025 sort en tête, devant trois
demandes closes du jour ; en coupant le réseau, l'écran le dit et le bouton
recharge vraiment.

**Pas vérifié** : la page sur votre iPhone, et une liste réellement à 200
demandes.

**Une chose reste, et c'est à vous de trancher** : une demande déjà traitée
porte toujours un bandeau orange aussi fort qu'une demande qui attend. Le
tri les a descendues ; leur couleur crie encore. Les faire reculer est trois
lignes — mais l'orange est votre identité, donc je ne le fais pas sans vous
demander.


### 2.1 quaterdecies Un compte d'artisan naît entier ✅ FAIT le 05/10/2026

En cherchant quoi avancer pendant que le compte Apple se valide, j'ai relu
la création de compte. **Un compte fantôme dormait dans votre base depuis le
14 septembre** : marqué « professionnel », sans fiche professionnelle. Il ne
pouvait rien faire — invisible dans la Place des pros, incapable de publier
ou de recevoir une demande —, et rien ne le signalait.

**La cause.** Les deux moitiés d'un compte d'artisan n'étaient pas créées
par le même mécanisme : la première par la base (donc toujours), la seconde
par l'application, et seulement si l'inscription rendait une session tout de
suite. Avec la **confirmation par e-mail** — qu'il faudra activer avant
d'ouvrir au public — il n'y a pas de session : la fiche n'était jamais
créée, **et l'acceptation des conditions d'utilisation non plus**, ce qui est
une trace légale.

C'est maintenant la base qui crée les deux, à partir des informations que
l'inscription lui transmet. Vérifié sur votre vraie base : une inscription
brute, sans que l'application écrive une seule ligne, produit la fiche
complète — entreprise, deux métiers, ville, conditions acceptées et datées.

**Et en cherchant comment réparer, DEUX FAILLES**, les deux prouvées avant
d'être corrigées :

1. **Un artisan pouvait se décerner le badge vérifié en créant sa fiche.**
   Le verrou posé le 29 septembre ne surveillait que la MODIFICATION ;
   la création passait à côté. Mesuré : aucune erreur, et la fiche
   ressortait « vérifiée ».
2. **Un artisan pouvait effacer les avis écrits sur lui.** En supprimant sa
   propre fiche : onze tables en dépendent, dont les avis, les demandes de
   devis, les demandes de rappel et les urgences. Mesuré : un avis une
   étoile, le pro supprime sa fiche, zéro avis restant, compte toujours là.
   Il recrée sa fiche et repart à neuf.

   C'est la plus grave des deux, et elle contournait en silence tout le
   travail du 21 septembre — où l'on a décidé que **ce qui concerne des
   tiers s'anonymise et ne se supprime pas**.

Une fiche professionnelle ne se supprime donc plus tant que le compte
existe, avec un message qui l'explique. **Supprimer son compte entier reste
possible**, et c'est vérifié : c'est un autre chemin.

**Vérifié** : le schéma rejoué deux fois sur un vrai PostgreSQL, onze essais
de sécurité, les 31 contrôles, le paquet iOS, puis votre vraie base avec
trois comptes jetables supprimés dans la foulée — dont une inscription
complète menée au navigateur.

**Pas vérifié** : la confirmation par e-mail elle-même, qui n'est pas encore
activée sur votre projet.

**Deux choses restent, et elles sont pour vous :**

- **le compte fantôme du 14 septembre est toujours là.** Il se répare tout
  seul à la prochaine connexion et ne porte aucun contenu — à vous de dire
  si on le garde ou si on le supprime ;
- **un artisan qui vient de s'inscrire n'a pas encore de coordonnées**, donc
  il n'apparaît pas dans une recherche par secteur tant qu'il n'a pas ouvert
  « Modifier mon profil » une fois. C'était déjà le cas avant ; c'est à
  traiter à part.


### 2.1 quindecies Vos trois remarques du 05/10/2026 ✅ FAIT

**1. Les demandes déjà traitées ne noient plus les nouvelles.**

Vous aviez raison, et je l'ai chiffré avant de commencer : **6 demandes
traitées sur 8** dans votre base, après trois semaines. Dans un an, c'est
95 % de la liste.

« Pour moi » a désormais une ligne de pastilles, la même que la Place des
pros et les Demandes — **À traiter · En cours · Terminées**, chacune avec
son nombre. On arrive toujours sur « À traiter ».

**Trois états et pas deux, et c'est le point important** : une demande
acceptée n'est pas réglée, c'est un chantier en cours — et c'est là que se
trouve le téléphone du client. La ranger avec les terminées la ferait
disparaître au moment précis où vous en avez besoin. Le bouton « Marquer
terminé », qui existait depuis le début et ne servait à rien de visible,
sert maintenant à faire passer une demande de « En cours » à « Terminées ».

**2. L'adresse e-mail se reprend d'un appui — mais pas toute seule.**

J'ai vérifié avant de répondre : à l'inscription, Opus demande l'entreprise,
les métiers, la ville, l'e-mail et le mot de passe. **Pas de téléphone, pas
d'adresse postale.** L'entreprise, la ville et les métiers *sont* bien
repris dans « Modifier mon profil ». Le téléphone, lui, n'a jamais été
demandé : il n'y a rien à reprendre.

L'e-mail est le vrai sujet, et c'est pour ça que je ne l'ai pas rempli tout
seul : il y a **deux adresses différentes**. Celle de votre compte, qui a
été fermée au public le 29 septembre parce qu'elle fuitait, et celle de
votre fiche, que vous remplissez *pour* qu'elle s'affiche. Les confondre
republierait votre adresse personnelle au premier « Enregistrer » distrait.

Donc : un bouton sous le champ, **« Utiliser l'adresse de mon compte
(votre@adresse) »**. Un appui, c'est rempli, et vous avez vu ce qui va être
publié. Il disparaît une fois le champ rempli.

**3. On voit maintenant où l'on est dans la barre du bas.**

Mesuré : le seul signal était la couleur de l'icône, et l'écart entre
l'inactive et l'active valait **3,02 sur 1** — le minimum réglementaire.
Perceptible, et rien de plus.

Vous avez choisi l'anneau orange, et vous aviez raison sur un point que
j'avais sous-estimé : **votre photo de profil le faisait déjà**. Les quatre
autres icônes font donc pareil désormais. Les icônes ne changent pas, seul
un contour orange apparaît sur la page où vous êtes.

Vérifié : la barre fait **69 pixels de haut avant comme après** — la boîte
de l'anneau a une taille fixe, seule sa couleur change. Sans ça, toute la
barre sauterait de deux pixels à chaque changement de page.

**Vérifié** : les 31 contrôles, le paquet iOS, et au navigateur — les trois
pastilles et leurs nombres, le passage « Marquer terminé » qui déplace la
demande, l'anneau qui suit la page, et le bouton d'adresse éprouvé sur votre
vraie base avec un compte jetable supprimé dans la foulée.

**Pas vérifié** : les trois sur votre iPhone. Et l'anneau en mode vidéo n'a
été relu que dans le code — le fil vidéo ne se lit pas dans le navigateur
de test, faute de codecs.


### 2.2 Notifications push — en cours depuis le 02/10/2026

La base les enregistre déjà (table `notifications`, alimentée par des
triggers), mais rien n'arrive sur l'écran verrouillé.

> **15/10/2026, le soir — Opus est INSTALLÉ sur l'iPhone du propriétaire**
> comme vraie application (development build), notifications comprises dans
> la construction. Il ne reste que le dernier mètre : demander l'autorisation,
> ranger le jeton de l'appareil, et envoyer depuis la base.
>
> **15/10/2026 — le compte Apple Developer est payé et ACTIF** (courriel
> d'Apple reçu à 20 h 12). La préparation de la première installation est
> faite : `expo-dev-client`, `expo-notifications` et `expo-device`
> installés, le greffon déclaré dans `app.json`, `eas.json` écrit. **Les
> étapes qui restent sont chez le propriétaire**, commande par commande, dans
> `docs/COMPTE-APPLE.md` §7 ter. Et dès maintenant : `npx expo start --go`
> pour garder Expo Go, tant qu'Opus n'est pas installé sur l'iPhone.

**Demande un development build**, donc un **compte Apple Developer** : depuis
le SDK 53, Expo Go ne reçoit plus les notifications push — Expo prêtait ses
propres identifiants Apple, cette facilité a été retirée. Aucun contournement
n'existe sans Mac : la distribution interne d'EAS « requires a paid Apple
Developer account ».

➡️ **`docs/COMPTE-APPLE.md`** — le guide d'inscription, vérifié sur les pages
d'Apple le 02/10/2026 : pourquoi maintenant, les 99 €/an, la préparation, les
onze étapes dans l'application Apple Developer de l'iPhone.

Les deux points à ne pas redécouvrir, écrits là-bas en détail :

1. **« Individual », jamais « Organization »** — celle-ci exige une personne
   morale et un numéro D-U-N-S. Conséquence : sur l'App Store, le vendeur
   porterait le **nom légal** du propriétaire, pas « Opus ».
2. **Ne PAS créer la fiche dans App Store Connect maintenant.** Le nom public
   se fixe au moment où la première application est ajoutée, et Apple ne
   permet plus de le changer ensuite. Pour construire et installer sur son
   propre iPhone, aucune fiche n'est nécessaire — seul l'abonnement l'est.
   Ce choix se prendra quand `legal.js` passera de `essai` à `micro`.

Et le piège déjà identifié pour la suite : sans le greffon
`expo-notifications` déclaré dans `plugins` d'`app.json`, la construction iOS
part **sans les autorisations APNs** et rien n'arrive — sans aucune erreur
pour l'expliquer.

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
- **Des pièces jointes dans la messagerie** — proposé par le propriétaire
  le 01/10/2026, et c'est le vrai besoin derrière l'e-mail professionnel :
  recevoir un plan, un devis signé, une attestation. Supabase Storage est
  déjà en place pour les documents et les photos ; il manque l'écran, la
  limite de taille, et la règle RLS qui réserve la pièce jointe aux deux
  personnes de la conversation. L'e-mail restera utile même après : tout le
  monde n'a pas Opus.

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
  « disponible aujourd'hui à 12 km de votre chantier ». Nuancé le 17/10
  (`COMPARATEUR-MATERIAUX.md`) : le **stock** en temps réel est rarement
  tenu par personne (Tolteck renvoie à la page du négoce ; les interfaces
  temps réel annoncées par Roobeo ne sont jamais devenues publiques), alors
  que le **transport** est à portée pour le gros œuvre. En v1 c'est le
  fournisseur qui saisit ses annonces.

> **Le futur compte fournisseur ne doit JAMAIS rendre `est_un_pro()` vrai.**
> Cette fonction ouvre la lecture des demandes des particuliers — leur
> commune, leur texte, les photos de leur maison. Et l'exposition existe
> déjà : un négoce dont le SIRET est actif peut s'inscrire aujourd'hui comme
> artisan, le code d'activité ne bloquant rien (décision du 12/10).
> **Mesuré le 18/10, en nombres seulement : aucun ne l'a fait** — 0 annonce
> « fournisseur », une seule entreprise rattachée, de code 43 (travaux du
> bâtiment), et aucun métier de négoce dans le catalogue.

**Le type de compte ne passe pas avant la section 1.** L'inscription, le
profil, les règles RLS et la modération doubleraient — et sans signalement,
suppression de compte ni mentions légales, l'application ne peut de toute
façon pas être ouverte au public. **Cette condition est remplie** depuis le
21/09. **Tranché par le propriétaire le 18/10 : on attend le module 7, en
le sachant.** Opus n'est pas ouvert au public, donc personne d'inconnu ne
peut s'inscrire aujourd'hui.

- [ ] **AVANT l'ouverture au public** : fermer la porte des négoces qui
  s'inscrivent comme artisans — par le compte fournisseur, ou à défaut par
  une alerte au back-office sur les codes d'activité 46 et 47 (sans rien
  bloquer, décision du 12/10). Re-mesurer d'abord : la mesure du 18/10 ne
  vaut que pour ce jour-là.

---

## 4. Réglages à faire dans les tableaux de bord

| Où | Quoi | État |
| --- | --- | --- |
| Supabase → Authentication → Policies | Activer la protection contre les mots de passe compromis | ⏳ à faire |
| Anthropic → Settings → Limits | Poser un plafond de dépense | ⏳ conseillé |
| Cloudinary | Plan gratuit : 25 crédits/mois, à surveiller | ⏳ à surveiller |

---

## 5. Points de vigilance

- **Le compte sans fiche** (`d23e1784-…`) — ÉLUCIDÉ le 05/10/2026, et ce
  n'était pas ce qu'on croyait. Ce n'est pas une inscription interrompue :
  `auth.users.is_anonymous = true`, aucune adresse e-mail, aucune
  métadonnée, créé et connecté **à la même seconde le 14/09/2026 à
  19:17:52**, jamais revu. C'est une **connexion anonyme** — la
  fonctionnalité de Supabase qui ouvre une session sans e-mail ni mot de
  passe.

  **Deux bonnes nouvelles.** D'abord, rien dans `src/` ne l'appelle : ce
  n'est pas l'application qui l'a créé. Ensuite, vérifié le 05/10 en
  essayant pour de vrai : le projet répond
  `422 anonymous_provider_disabled`. **La porte est fermée, le cas ne peut
  plus se reproduire.**

  Le compte ne porte rien — 0 publication, 0 demande, 0 message, 0 avis,
  0 notification, aucune fiche professionnelle. Et depuis le 05/10 il se
  réparerait tout seul si quelqu'un s'y reconnectait, ce qui est
  impossible : une session anonyme perdue ne se retrouve pas.

  **Depuis le lot T (20/10), ce n'est plus seulement du ménage** : pour la
  base, un compte « pro » sans fiche compte comme un particulier. Une session
  de ce compte, si quelqu'un détient encore son jeton du 14/09, LIRAIT les
  tarifs qu'un artisan affiche (aucun ne l'est encore). Personne ne peut plus
  en ouvrir une nouvelle, mais rien ne prouve que l'ancienne soit perdue.

  ⏳ **Il reste à le supprimer, et c'est à VOUS** : Supabase →
  Authentication → Users → la ligne sans e-mail (`d23e1784-…`) →
  « Delete user ». Je ne peux pas le faire d'ici, et c'est une protection,
  pas une limite : le connecteur refuse tout ordre destructeur sans qu'un
  humain confirme. Essayé le 05/10, l'appel expire sans rien appliquer —
  vérifié après coup, le compte était intact.
- **Aucun test automatique d'interface.** Sept scripts de vérification
  (`npm run verifier-*`) couvrent le SQL, les listes et les formats, mais
  aucun ne rejoue les écrans. Les tests Playwright sont écrits à la main à
  chaque fois.

---

## Le logiciel de gestion — l'ordre des modules (arrêté le 07/10/2026)

Le propriétaire, deux fois le même jour : « tout ce qu'il doit faire va être
créé sur Opus, le dashboard du pro, le logiciel de devis facture etc., comme
écrit dans le document ».

**Oui. Rien n'est écarté.** Ce qui suit n'est pas une sélection, c'est un
ORDRE — et il est écrit ici pour qu'il ne dépende plus d'une conversation.

### La règle qui décide de l'ordre

> **L'agent ne peut agir que sur ce qui EXISTE.** « Rédiger un devis » n'est
> pas une action d'IA tant qu'il n'y a ni table `devis`, ni client, ni ligne,
> ni numéro légal, ni TVA. C'est un MODULE, et l'IA vient après — jamais
> l'inverse.

C'est pour cette raison que le **récit du chantier** (§12) est la première
action livrée : sa matière existait déjà en base depuis le lot E. Et c'est
pour la même raison que le §4 n'a pas posé ses sept réglages d'un coup :
**chaque permission naît AVEC l'action qu'elle gouverne** (section 38).

### L'ordre, et pourquoi

| | module | §  | pourquoi là |
|---|---|---|---|
| 1 | **Clients** | 5, 12 | Rien ne tient sans lui : un devis s'adresse à quelqu'un, une facture aussi, un chantier appartient à un client. C'est la table que les trois suivantes attendent. |
| ✅ | **Personne ne devient pro par lui-même** — fait le 15/10/2026 | 5 | **Le préalable du SIRET, et une faille réelle.** Un particulier pouvait se déclarer pro (`update users set type`), s'insérer une fiche, puis lire les demandes des particuliers, publier, ouvrir un carnet de clients, créer un chantier. Une seconde porte passait par la suppression de compte. Fermées par la base (section 44, OP004 et OP005), vérifiées sur la vraie base avec deux comptes jetables supprimés. Le trou n'avait jamais servi : 7 fiches sur 7 sont sur un compte pro. Sans cette correction, vérifier le SIRET à l'inscription n'aurait rien protégé. `npm run verifier-pro`. |
| ✅ | **Le SIRET à l'inscription** — fait le 17/10/2026 | 5 | **Décidé le 12/10 par le propriétaire.** Un compte pro ne naît plus qu'avec un SIRET trouvé ACTIF au répertoire Sirene (INSEE), consulté par la fonction Edge `siret` qui range une preuve ; inscription en deux temps (le répertoire préremplit le nom, la forme, la commune, propose le métier), SIRET verrouillé, une entreprise = un compte, porte de secours DANS Opus (compte en attente + demande suivie, administration prévenue), « Passer en compte professionnel » pour un particulier, « Mon entreprise » dans le profil, file des demandes en administration. Section 45, appliquée sur la vraie base et éprouvée par curl et au navigateur avec des comptes jetables supprimés. **Il ne prouve PAS qu'on est le titulaire** : le badge reste humain. Restent au propriétaire : voir CLAUDE.md, « Le SIRET à l'inscription », « Ce qui reste ouvert ». `npm run verifier-siret`. |
| ✅ | **Devis, lot 0a : « Mon entreprise »** — fait le 18/10/2026 | 9 | **Ce que l'entreprise doit porter sur chaque devis pour qu'il soit légal**, avant qu'aucun devis n'existe : registre et greffe, capital, régime de TVA (date posée par la base), assurances (une liste, attestation dans l'espace privé `documents`), médiateur choisi dans la liste officielle, garanties, modalités, réclamations, frais de déplacement (« Déplacement offert » est un choix, pas un champ vide). L'identité se LIT dans `entreprise_registre`, rien n'est ressaisi. Trois tables privées (section 46), `emetteur_incomplet()` dit ce qui manque en 21 motifs dont les `conso_` (seulement pour un particulier). Appliqué sur la vraie base, éprouvé par l'API et au navigateur avec trois comptes jetables supprimés. `npm run verifier-emetteur`. Ce qui reste : plus bas, « Après le lot 0a ». |
| ✅ | **Devis, lot T : les tarifs réunis** — fait le 20/10/2026 | 9 | Une seule liste de tarifs pour le devis, la fiche et le SOS (section 47) ; un particulier connecté les lit quand l'artisan les affiche. CLAUDE.md, « Les tarifs réunis — lot T ». Ce qui reste : plus bas, « Après le lot T ». |
| ✅ | **Devis, lot 1 : le chiffrage** — fait le 23/10/2026 | 9 | Le brouillon chiffré pièce par pièce, le total calculé par la base (section 49) ; rien ne sort encore. CLAUDE.md, « Le chiffrage — lot 1 ». Ce qui reste : plus bas, « Après le lot 1 ». |
| ✅ | **Devis, lot P : la base de postes** — fait le 25/10/2026 | 9 | Ses phrases et ses prix de référence, proposés pendant la frappe, les variantes d'une même phrase reconnues sans IA (section 50). CLAUDE.md, « La base de postes — lot P ». Ce qui reste : plus bas, « Après le lot P ». |
| 2 | **Devis** | 9 | Le cœur du métier, et le premier document qui ENGAGE. Numérotation, TVA, mentions obligatoires, acceptation. |
| 3 | **Factures** | 10 | Elles NAISSENT d'un devis accepté : les écrire avant obligerait à tout ressaisir. Facturation électronique obligatoire entre entreprises, vérifiée le 17/10/2026 (FAQ officielle d'août 2026) : **réception** obligatoire pour toutes depuis le 01/09/2026 ; **émission** par les grandes entreprises et les ETI depuis la même date, par les PME, TPE et micro-entreprises au plus tard le 01/09/2027. À relire au moment de le construire. |
| 4 | **Dashboard** | 8 | Il MONTRE ce que les trois précédents ont produit. Avant eux, il n'aurait rien à afficher — ce serait le « bouton §18 » à l'échelle d'un écran. |
| 5 | **Agenda** | 11 | Il se nourrit des chantiers et des devis acceptés. |
| 6 | **Dépenses et comptabilité préparatoire** | 13 | Demande les factures pour avoir un « sortant » en face d'un « entrant ». |
| 7 | **Fournisseurs et prix** | 14, 15 | L'apprentissage des prix suppose des devis et des dépenses à apprendre. |

**Et à chaque module, l'agent gagne son action** — rédiger le devis à partir
du chantier, relancer une facture impayée, répondre à « combien j'ai
facturé ce mois-ci ». Chacune avec sa permission (§4), chacune au journal
d'audit (§21) : c'est le socle du lot H, et c'est précisément pour ça qu'il
a été posé en premier.

### Ce qui n'est pas dans cette liste, et qui existe déjà

Le **réseau social** (§6, §7, §9 du module 9) est construit : fil, filtre,
chantiers, place des pros, demandes, messagerie, modération, back-office.
Le §19 (IA de communication) l'est à moitié — présentation, relecture,
récit. Le §18 (sous-traitance) marche nativement entre deux SIRET, comme
l'explique `LECTURE-CAHIER-DES-CHARGES.md`.

### La discipline, rappelée ici parce qu'elle vaut pour les sept

**L'appartenance passe par `est_mon_entreprise()`**, née avec les chantiers
(section 36), jamais par un `auth.uid() = …` écrit à la main. Un chantier,
un devis, une facture, un client appartiennent au COMPTE — un compte = un
artisan = une entreprise. Le jour où un patron voudra donner un accès à ses
compagnons, il y aura UNE fonction à changer.

### Le devis — ce qui l'attend en dehors du module (17/10/2026)

Relevé en remettant à jour le plan devis (`docs/PLAN-DEVIS.md` §10, le détail
de chaque point est en 10.11). Aucun n'est du code du devis ; plusieurs le
**précèdent**. Ils se cochent ici.

**À décider avant le module — et c'est au propriétaire :**

- [x] **Son statut** — répondu le 17/10 : une entreprise, aujourd'hui fermée.
  **Corrigé : depuis le 20/10, il a une SARL active, rattachée à son compte
  principal (CLAUDE.md).**
  CLAUDE.md et `DONNEES-DES-ARTISANS.md` corrigés.
- [x] **L'accord de son frère** — répondu le 17/10 : d'accord, et il s'en
  servira lui-même. Le badge reste. On construit et on essaie avec ce compte,
  puis on le lui remet (plan 10.12).
- [ ] **Avant de remettre le compte au frère** — le jour où il s'en sert pour
  de vrai, Opus a son premier utilisateur réel : contrat de sous-traitance et
  registre (ci-dessous), adresse de contact relevée (la boîte IONOS),
  `STATUT` qui quitte `'essai'`, et la décision de tenir ce rôle en
  particulier ou de s'immatriculer d'abord. Plus les deux portes de la remise
  (adresse et mot de passe, CGU), plus bas.
- [x] **Qui peut lire les prix des autres artisans**, éditeur SQL compris
  (`DONNEES-DES-ARTISANS.md` §5.2 et §7, décision 3). **Tranché le 18/10 :
  par un engagement écrit.** Aucun écran d'Opus ne les montre, et l'éditeur
  s'engage dans les conditions d'Opus à ne pas les lire par l'éditeur SQL —
  un engagement, pas une impossibilité technique : le propriétaire d'un
  projet Supabase peut toujours lire sa base. Les prix d'un artisan (frère
  compris) peuvent donc être enregistrés, par lui.
- [ ] **Plus tard, quand il y aura du monde** : allumer un journal des
  lectures sur les tables de prix (extension `pgaudit`, disponible sur la
  vraie base, non installée au 18/10). Une trace, pas un verrou :
  l'administrateur pourrait l'éteindre, et le plan gratuit garde peu de
  temps les journaux.
- [x] La **colonne métier** de la base de postes (plan 10.6, options a et b) :
  **tranchée au lot P le 23/10, aucune** (plan 10.17).
- [ ] Le **format du numéro** de devis, avant le lot 2.
- [ ] Le **nom de la base de prix** dont il parle, pour lire sa licence.

**À faire, hors du module :**

- [ ] Garde du badge pour un **second compte de la même personne** :
  `admin_verifier_pro` ne refuse que sa propre fiche. Décider ouvertement, et
  l'écrire comme limite connue.
- [ ] Les **3 fiches vérifiées sans entreprise rattachée** : garder ou retirer
  ces badges (même geste, aucun SIREN réservé).
- [ ] Avant toute **remise d'un compte** à quelqu'un d'autre : une porte pour
  changer l'adresse de connexion et le mot de passe (il n'y en a aucune), et
  une nouvelle acceptation des CGU par le nouveau titulaire.
- [ ] **Contrat de sous-traitance RGPD** du carnet de clients, à partir des
  clauses types de la Commission (décision 2021/915) ; corriger
  `legal.js:690-694` (« on ne peut pas écrire ce contrat »).
- [ ] **Registre des traitements** de sous-traitant (RGPD art. 30.2), dû dès
  aujourd'hui pour le carnet de clients.
- [ ] Recopier **depuis Légifrance**, avec le navigateur du propriétaire, les
  textes qui s'imprimeront : arrêté du 24/01/2017 (dont l'art. 3), formulaire
  de rétractation (annexe à R. 221-1), mention 293 B. Légifrance répond 403
  depuis le conteneur.
- [ ] Décider d'une **migration au SDK 58** (sorti le 15/10/2026), avant ou
  après la reconstruction EAS du lot 2. **Depuis le 25/10, Expo Go (passé au
  SDK 58) n'ouvre plus Opus** : seul le build de développement le fait, et
  migrer ne réglerait rien de durable — Expo Go passera au SDK 59 un jour.
- [x] Les deux petites mises à jour qu'attend Expo (`expo` 57.0.31,
  `expo-notifications` 57.0.24, relevées le 25/10) : faites dans le dépôt le
  25/10, **juste avant la reconstruction** du build de développement (son
  icône Opus était la version « preview » du 17/10). Jamais seules :
  `expo-notifications` est un module natif.
- [x] **Reconstruire et réinstaller le build de développement** sur l'iPhone :
  fait par le propriétaire le 25/10 (« c'est bon, j'ai installé, ça
  fonctionne »), puis le lot P essayé dessus le jour même.
- [ ] Corriger les annexes du plan (CONCURRENCE-DEVIS.md, SIRET-ET-CLAUSES.md)
  et `DEVIS-DU-PROPRIETAIRE.md:179` (« Acompte à la signature », contraire au
  droit hors établissement).
- [ ] **La facture aux particuliers d'abord, ou tout ensemble** : reportée à
  la fin du lot 4 du devis, échéance du 01/09/2027.
- [ ] Démarches de l'entreprise qui émettra de **vrais** devis : un médiateur
  référencé avant le premier devis à un particulier, et une plateforme agréée
  pour **recevoir** les factures électroniques — obligatoire depuis le
  01/09/2026, même en franchise. À dire aussi au frère : son entreprise est
  concernée, Opus ou pas.
- [ ] **Changer d'entreprise** sur un compte pro (passage de micro à société) :
  aucune porte (OP008, OP009) ; elle touchera la numérotation des devis.

### Après le lot 0a — ce qui reste (18/10/2026)

Le détail est dans CLAUDE.md, « Mon entreprise pour les devis — lot 0a ».

**À essayer sur l'iPhone — essayé par le propriétaire le 19/10, dans Expo
Go : « tout fonctionne très bien ».** Les cinq points n'ont pas été cités un
par un, et l'essai s'est fait dans Expo Go, pas dans le build de
développement (voir plus bas) : ils sont cochés sur cette réponse globale.

- [x] Le champ actif reste au-dessus du clavier dans « Mon entreprise »
  (une vingtaine de champs).
- [x] La virgule du pavé décimal (capital, frais de déplacement) est
  acceptée.
- [x] Joindre une attestation par la Photothèque, Fichiers et l'Appareil
  photo.
- [x] La croix reste atteignable clavier ouvert.
- [x] La liste des médiateurs défile et se choisit au pouce.

**L'icône Opus de son iPhone est la version « preview » du 17/10** (relevé le
19/10 : elle ne montrait aucun changement, Expo Go si). Les profils
`development` et `preview` de `eas.json` portent la MÊME identité
(`com.opusproject.app`) : installer la « preview » a remplacé le build de
développement, sans prévenir, et elle contient le code du 17/10 figé.

- [ ] Donner au build de développement sa propre identité (« Opus Dev »,
  `com.opusproject.app.dev`, par une variable dans un `app.config.js`), pour
  que les deux applications vivent côte à côte. Demande un nouveau build de
  développement. Proposé au propriétaire le 19/10, pas encore décidé.

**Le lot suivant, décidé le 18/10 (« juste après, à part ») :**

- [x] **Les tarifs du SOS** rejoignent `tarifs_pro` (lot T) — **FAIT le
  20/10/2026**, migration appliquée et essayée sur la vraie base (CLAUDE.md,
  « Les tarifs réunis — lot T » ; ce qui reste : plus bas, « Après le
  lot T »). Il y avait deux chiffres de déplacement, et une fiche SOS à 0 €
  affichait « 0 – 0 € ». Décidé le 19/10 (`PLAN-DEVIS.md` §10.14) : répondre aux
  urgences exige des tarifs affichés ; ils ne sont lus QUE par les
  particuliers ; pas de forfaits dans ce lot ; la majoration reste comme
  aujourd'hui.

**À faire relire par un juriste, avant le premier vrai devis :**

- [ ] R. 123-237 (lieu du siège) face à un artisan au seul RNE ; les
  coopératives (formes 51xx) et l'EIRL, traitées au plus prudent.
- [ ] La phrase sur L. 243-2 au §10.3 de `PLAN-DEVIS.md`, à corriger avant le
  lot 2 : l'attestation de décennale est due quel que soit le client.
- [ ] **L'affichage des tarifs aux particuliers** (lot T) : la mise en garde
  de `DONNEES-DES-ARTISANS.md` §5 sur des prix lus par des concurrents. Le
  risque est réduit (les artisans ne les lisent pas), pas nul (un second
  compte particulier). Simple rappel, sans blocage, décidé le 19/10.

**Dettes connues, datées :**

- [ ] **L'adresse du siège** quand l'établissement n'est pas le siège : saisie
  à la main, parce que la preuve SIRET ne la garde pas. Le remède est de la
  ranger dans la preuve (section 45 et fonction Edge). Aucune entreprise
  active n'est dans ce cas au 18/10.
- [x] Un artisan **au régime réel sans n° de TVA** transmis par la DGFiP :
  **fait le 20/10/2026** (section 48), relu, puis **installé sur la vraie
  base et déployé** (fonction `tva`, version 1) le même jour. Il l'écrit dans
  « Mon entreprise → Votre entreprise », et Opus ne le garde que si VIES le
  reconnaît. Mesuré ce jour-là : un numéro calculé depuis le SIREN n'est pas
  un numéro actif, et celui de la société du propriétaire est REFUSÉ par
  VIES. Le détail est dans CLAUDE.md, « Le n° de TVA écrit à la main ».
- [ ] **AVANT LA MISE EN LIGNE : une révision par un humain des refus de
  VIES.** Ne pas imprimer un numéro refusé, et à terme refuser la remise d'un
  devis à un particulier faute de numéro, est une décision automatique (RGPD,
  art. 22) : les textes légaux disent aujourd'hui, honnêtement, qu'aucune
  vérification humaine n'existe encore. Le modèle existe — la porte de
  secours du SIRET (`demandes_pro`). À construire avant que `STATUT` quitte
  `'essai'`.
- [ ] **Geste du propriétaire, pour sa propre société** : faire activer son
  n° de TVA intracommunautaire — son espace professionnel sur impots.gouv.fr
  le montre, son service des impôts des entreprises l'active. Une fois actif,
  « Écrire mon numéro de TVA » le fait reconnaître par VIES. Tant qu'il ne
  l'est pas, ses devis à des particuliers ne peuvent pas porter de numéro.
- [ ] **VIES n'a pas de date d'expiration dans Opus** (décision du 18/10 :
  une seule règle plus stricte que la loi). Un numéro désactivé après sa
  reconnaissance s'imprime encore, avec la date du contrôle. À reposer si un
  cas réel se présente.
- [ ] **L'avertissement juridique de VIES** n'autorise que l'usage « d'un
  utilisateur légitime (par exemple : établir ses propres factures) ».
  Contrôler son propre numéro pour ses propres devis paraît y entrer : à
  faire confirmer par un juriste avec les autres points ci-dessus — ou
  directement auprès de TAXUD-VIESWEB, le service de VIES. L'enjeu n'est pas
  théorique : un usage jugé abusif fait bloquer l'adresse d'Opus
  (`IP_BLOCKED`), et ce serait VIES coupé pour TOUS les artisans. D'ici là,
  la provenance « VIES » ne s'imprime pas sur le devis.
- [ ] Une **attestation remplacée** reste dans l'espace `documents` jusqu'à la
  suppression du compte.
- [ ] La démonstration ne montre ni `adresse_siege` ni `entreprise_ancienne`
  (pas d'horloge réglable) : ces deux cas ne sont prouvés qu'en SQL et par le
  contrôle.
- [ ] Une identité dont on ignore si l'établissement est le siège
  (`est_siege` vide) reçoit le motif `conso_` au lieu de celui de tout devis.
  Volontairement prudent, à revoir avec le juriste.
- [ ] **Relever la liste des médiateurs chaque année**
  (`src/data/mediateurs.js`, data.economie.gouv.fr). L'âge de la liste est un
  avis à l'écran, pas un échec de contrôle.
- [x] Les deux **preuves SIRET « essai »** du 18/10 sont parties d'elles-mêmes
  (constaté le 20/10). Deux autres, posées pour l'essai du 20/10, expirent
  deux heures après et partiront de même ; les compteurs `tva-` de cet essai
  (cinq lignes, sous empreinte) partent à la purge, plus d'un jour après.
  **Corrigé le 23/10 : « partiront de même » n'était pas encore vrai deux
  jours après** — ces deux preuves étaient en base le 22/10, et ont servi,
  mises à jour, à l'essai du lot 1 (voir « Après le lot 1 »).

### Après le lot T — ce qui reste (20/10/2026)

Le détail est dans CLAUDE.md, « Les tarifs réunis — lot T ».

**À faire par vous, et c'est devenu plus qu'une propreté :**

- [x] **Supprimer le compte anonyme du 14/09** (§5, plus bas). Pour la base,
  « particulier » veut dire « toute session sans fiche pro ». Personne ne
  peut plus ouvrir de session sur ce compte, mais rien ne prouve que son
  jeton du 14/09 soit perdu : une session qui survivrait quelque part lirait
  les tarifs qu'un artisan affiche (aucun ne l'est encore). **Constaté le
  20/10 au soir : la base ne compte plus AUCUN compte anonyme** (14 comptes,
  0 anonyme) — il a été supprimé entre le lot T et le lot VIES.
- [ ] **Votre ligne d'urgence « Électricité » a été éteinte** par la
  migration : aucun de vos métiers n'est un métier d'urgence. Rien à faire,
  c'est pour que vous ne soyez pas surpris de ne plus la voir allumée.

**À essayer sur l'iPhone — dans Expo Go ou le build de développement,
JAMAIS dans l'icône « preview » du 17/10** (elle contient le code d'avant) :

- [ ] dans « Mon entreprise » → « Vos tarifs » : la virgule du pavé décimal
  passe-t-elle (« 62,50 ») ?
- [ ] le champ actif remonte-t-il au-dessus du clavier, tout en bas de
  « Vos tarifs » ?
- [ ] les interrupteurs se touchent-ils sans viser ?
- [ ] « Mes tarifs » apparaît-il sur « Mon profil » après l'enregistrement,
  et disparaît-il quand vous éteignez « Afficher » ?
- [ ] les phrases sous « Afficher mes tarifs sur ma fiche » se
  comprennent-elles sans relire ?
- [ ] **la carte SOS au pouce** : il faut un compte PARTICULIER (le vôtre est
  pro et n'ouvre pas l'écran SOS). Sinon, elle n'aura été vérifiée qu'au
  navigateur.

Essayer avec des valeurs **fictives** (« essai » dans le décompte), puis les
remettre à vide **et éteindre l'interrupteur** : une ligne affichée est
lisible par tous les particuliers connectés pendant ce temps-là.

**Laissé ouvert, et daté :**

- [ ] **Faire ré-accepter les conditions** : `VERSION` est passée au
  `2026-10-19`, et rien dans l'application ne compare la version acceptée à
  la version en vigueur (11 comptes sur 15 n'en ont même aucune). À
  construire **avant** que `STATUT` quitte `'essai'`.
- [ ] **L'unité des montants sur le devis** (lot 2, avec le juriste) : les
  tarifs sont rangés TTC ; le devis décidera comment il les imprime (HT sur
  une ligne au régime réel, mention en franchise). L'aperçu de l'en-tête
  n'indique pas d'unité : incomplet, pas faux.
- [ ] **Les colonnes mortes de `sos_availability`** (`deplacement`,
  `horaire`, `majoration`) : à 0, et toute écriture non nulle est refusée
  (OP012). Les retirer demande un `drop column` dans `schema.sql` ET sur la
  vraie base ensemble — un lot de nettoyage.
- [ ] **`sos_availability` reste lisible sans compte** (`"lecture dispo sos"`,
  `using (true)`). Elle ne porte plus aucun prix ; la refermer aux connectés
  est une question de cohérence.
- [ ] **La démonstration ne montre pas la plupart des nouveaux états** du
  réglage SOS (éteint, non affichés, non lus) : seul un commentaire le dit,
  dans `src/data/tarifs-demo.js`.
- [ ] **Quatre lectures du démarrage pro restent sans délai**
  (`chargerProfilPro`, `chargerDemandeMetiers`, `chargerAnnonces`,
  `mesReponsesDemandes`) ; seule celle du lot T porte `avecDelai`.
- [ ] **`C.bad` donne 4,37 : 1 sur le fond** — sous 4,5 pour un texte. Un
  choix de palette, à trancher.
- [ ] **Les heures de la majoration** (de 20 h à 7 h, samedi et dimanche) ne
  sont pas montrées aux particuliers : la fiche dit « +40 % » sans heures,
  pour ne pas prêter à l'artisan une convention d'Opus. À trancher.
- [ ] Le motif de `verifier-etats` ne voit pas `e.message ||` : élargi, il
  rougirait sur huit endroits hors du lot T.

### Après le lot 1 — ce qui reste (23/10/2026)

Le détail est dans CLAUDE.md, « Le chiffrage — lot 1 » ; le cahier qui l'a
guidé est archivé en `docs/CAHIER-LOT-1.md`. La section 49 est sur la vraie
base depuis le 22/10, vers 23 h 43 (heure de Paris), et l'essai par le chemin
de l'application a été fait les 22 et 23/10, avec trois comptes jetables
supprimés ensuite : la base est revenue à 0 devis. Les comptes rendus d'étape
et les relectures cités entre parenthèses sont des documents de travail de la
session : ils ne sont pas dans le dépôt, le cahier archivé l'est.

**Toujours ouverts depuis le lot T, et non recopiés ici** (voir « Après le
lot T », juste au-dessus) : faire ré-accepter les conditions — `VERSION` est
passée au `2026-10-22` avec ce lot, et rien ne compare encore la version
acceptée à la version en vigueur — ; et l'unité des montants sur le devis,
qui rejoint le quatrième point du juriste, plus bas.

**Les avertissements des commits `fde72f9` et `b1926d9`, qui disaient de ne
pas récupérer cette version avant la migration, ne valent plus** depuis le
22/10 au soir : la version du dépôt peut aller sur le téléphone, « Mes devis »
y trouvera ses tables.

**À trancher avec vous, en voyant l'écran** — des choix et des relevés d'écran,
qui ne sont pas tous de la même sorte, et chaque case dit la sienne (compte
rendu des étapes 4 à 7, §8, points 1 et 4 ; et, pour le plafond, la relecture
sécurité de l'étape 3) :

- [ ] **L'origine d'une suggestion de prix se nomme par sa DATE** (« votre
  devis du 12/10/2026 ») quand le devis d'origine vient d'une demande ou d'une
  urgence, et par quatre mots de son objet quand vous l'avez commencé à la
  main. Pourquoi : l'objet d'un devis né d'une demande est le texte que le
  CLIENT a écrit ; le montrer dans le devis d'un autre client ferait lire à
  l'un ce qu'a écrit l'autre (relecture « données », I5). Le cahier disait
  « avec leur devis d'origine » sans dire comment le nommer : c'est le seul
  choix de cette liste que la construction a fait seule, faute de réponse
  écrite.
- [ ] **Une ligne ouverte en grand montre deux retours** (← et « ‹ Devis »)
  **et le titre de la pièce deux fois.** Ce n'est pas un choix de la
  construction : c'est un choix du CAHIER (§4.8 : en saisie, le titre de
  retour est celui de la pièce), que la relecture « écran » discute — elle
  proposait de ne garder le titre que dans la barre de la carte (C5). À juger
  sur l'iPhone.
- [ ] **« Choisir dans mon carnet » passe sur deux lignes** sur un écran de
  320 points de large : 56 points de haut contre 44 pour son voisin. Rien de
  cassé, c'est le libellé du cahier ; la relecture « écran » proposait
  « Mon carnet » (C6), sans l'avoir mesuré.
- [ ] **En revenant d'un devis ouvert depuis « Pour moi », la pastille revient
  à « À traiter »**, même si vous étiez sur « En cours » : l'écran a été
  démonté, et il faut retoucher la pastille. Ce n'est pas un choix, c'est un
  défaut relevé à l'étape 7, mesuré à chaque passage (§8, point 4) ; il est
  ici parce qu'il se juge en voyant l'écran.
- [ ] **Le plafond de 20 devis par demande, et de 20 par urgence** (`OP017`).
  Posé pendant la construction sur la proposition de la relecture sécurité de
  l'étape 3 (I1), qui le disait à trancher avec vous : la règle D4 interdit
  l'UNICITÉ (un client a plusieurs projets), pas une borne. Pourquoi une
  borne : sans elle, 100 000 brouillons rattachés à la demande d'un
  particulier faisaient dépasser les 8 s de la vraie base à la suppression de
  son compte (mesuré). Sur la vraie base, le 22-23/10 : 20 brouillons pour la
  même demande passent, le 21ᵉ est refusé par `OP017`. Le nombre, lui, est à
  vous.

**À savoir avant de remettre le compte à votre frère :**

- [ ] **La phrase des textes légaux « le seul artisan qui y tient un carnet ou
  y prépare des devis est l'auteur de l'application lui-même »** a été relue
  sur la vraie base après le ménage de l'essai : un seul compte tient un
  carnet (un administrateur), aucun ne prépare de devis — elle est vraie.
  **Elle devient fausse le jour où un autre artisan enregistre un client ou
  commence un devis**, et c'est ce jour-là que le contrat de sous-traitance
  (« Avant de remettre le compte au frère », plus haut) devient nécessaire.
  Votre propre essai sur votre compte principal ne la rend pas fausse : c'est
  toujours vous.

**Essayé par vous le 23/10 au soir, sur votre compte principal : « tout
fonctionne ».** Les cases ci-dessous restent ouvertes tant qu'elles n'ont pas
reçu leur réponse une par une — notamment la virgule : aucune quantité de
votre brouillon n'a de décimale.

**À essayer sur l'iPhone — dans le build de développement (Expo Go ne l'ouvre
plus depuis le 25/10 : il est passé au SDK 58), JAMAIS dans l'icône « preview »
du 17/10**, qui
porte le code d'avant : si rien n'a changé à l'écran, demander d'abord QUELLE
application est ouverte. Le compte : le vôtre (réponse du 21/10, Q5) ; vos
brouillons d'essai ne partent nulle part, ils restent à vous et se
suppriment. Les dix questions écrites à l'avance (cahier §7.6) :

- [ ] Taper « 2,5 » dans la quantité : la virgule passe-t-elle ?
- [ ] Quand le pavé numérique est ouvert, voyez-vous les unités et le taux ?
  Le geste « glisser vers le bas » ferme-t-il le clavier ?
- [ ] Le total en bas se voit-il quand vous en avez besoin ? Vous manque-t-il
  pendant que vous tapez ? (Il est caché clavier ouvert, et c'est dit ; une
  barre au-dessus du clavier serait la parade suivante — invisible au
  navigateur, donc pas livrée sans l'avoir vue, cahier §1.3.)
- [ ] La ligne qui s'ouvre en grand : préférez-vous cela, ou la voir dans la
  liste ? Retrouvez-vous votre place en revenant ?
- [ ] Combien de touches pour la deuxième chape ?
- [ ] Les pastilles d'unité et de taux, et « Faire un devis » dans « Pour
  moi », se touchent-ils sans viser ? (« Faire un devis » fait 36 points de
  haut, plus une marge de visée que le navigateur ignore.)
- [ ] Le total se lit-il d'un coup d'œil, chiffres alignés ?
- [ ] Le correcteur a-t-il changé un mot de métier (« placo », « BA13 »,
  « ragréage ») ?
- [ ] « Nouveau client » depuis le devis ouvre-t-il bien la fiche, puis la
  pose-t-il sur le devis ?
- [x] La toute première ligne tapée est-elle là après avoir fermé puis rouvert
  Opus ? C'est aussi la preuve que le téléphone sait fabriquer l'identifiant
  d'une ligne — **prouvé le 23/10** : son brouillon porte six lignes dont les
  six identifiants sont des UUID v4 choisis par le téléphone (relevé par la
  forme, sans rien lire du contenu).

Trois de plus, relevés pendant la construction (compte rendu des étapes 4 à
7, §8) :

- [ ] le code postal du lieu ouvre-t-il le pavé numérique ?
- [ ] avec VoiceOver, une ligne ouverte en grand cache-t-elle bien le reste de
  l'écran ? (Ce réglage n'a été que LU dans le code.)
- [ ] un code postal de quatre chiffres dans l'en-tête, puis un appui sur la
  barre du bas : la bande « ce que vous avez écrit n'est pas enregistré »
  paraît-elle, et le champ garde-t-il son curseur ? Au navigateur, le toucher
  retire le curseur : ça ne se juge qu'au doigt.

Et ce qui n'a tourné qu'ailleurs : les calculs sous Hermes (seulement sous
`node`), l'annulation d'une requête sur le téléphone, et la file d'écriture
sous un vrai réseau de chantier — ici, seule une coupure franche se simule.

**À faire relire par un juriste, avant le lot 2** — c'est lui qui imprimera ;
au lot 1, l'écran n'affirme aucun de ces points (cahier §1.2, §1.4, §1.5 et
§10) :

- [ ] **L'assiette de la retenue de garantie : HT ou TTC ?** La loi
  n° 71-584 dit « de leur montant » (celui des acomptes) ; la FFB écrit TTC ;
  la Caisse des dépôts fait attester que la retenue « ne dépasse pas 5 % du
  montant des acomptes versés ». D'où : l'écran ne montre aucun montant de
  retenue, seulement son taux et sa phrase (cahier §1.2).
- [ ] **Une retenue sur un paiement unique**, à la fin des travaux : le texte
  ne vise que « les acomptes » (cahier §1.2).
- [ ] **Ce qu'un artisan en franchise écrit à la place de « HT et TTC, en
  précisant le taux »** (cahier §10).
- [ ] **Le taux horaire TTC du lot T face à un prix unitaire HT** au centime.
  Au régime réel, le champ du devis reste vide et la phrase dessous montre le
  taux déclaré, jamais converti : mesuré, 12 euros ronds sur 131 ne se
  retrouvent pas en TTC à 10 % depuis un HT au centime (cahier §1.5, C9).
  C'est le même sujet que « l'unité des montants sur le devis », d'« Après le
  lot T ».
- [ ] **Le taux d'une ligne de frais de déplacement sur un devis à deux taux**
  de TVA (cahier §10).
- [ ] **Un « Offert » est-il une remise, ou une prestation à prix nul — et que
  le devis en imprime-t-il ?** (« Offert — valeur 45,00 € », ou rien.) Le
  lot 1 garde le prix d'une ligne offerte et met son total à 0, pour ne rien
  perdre : si c'est une remise, la facture devra porter le prix AVANT la
  réduction (CGI, ann. II, 242 nonies A, I, 8° et 9° ; BOFiP
  BOI-TVA-DECLA-30-20-20-10 §220), et un prix rangé à 0 l'aurait perdu
  (cahier §1.4, point 1).
- [ ] L'extension de R. 212-2 aux non-professionnels (R. 212-5) (cahier §10).
- [x] **Les primes déduites** (CEE, aides publiques) — **répondu le 21/10 :
  jamais** (Q4). Elles étaient sur la liste du cahier ; rien à prévoir.

**Pour le lot S (sécurité), décidé le 19/10 AVANT le lot 2** — trouvés en
construisant le lot 1, d'avant le module ou hors de son périmètre :

- [ ] **`authenticated` garde le droit `truncate` sur `clients`** (relevé à la
  lecture du code et sur la vraie base, cahier §1.3 et §2.7 ; toujours vrai
  dans `schema.sql` au 23/10). Un `truncate` ignore la RLS : prouvé le 22/10
  sur `devis_lignes`, dans une base d'essai où ce droit avait été rendu exprès
  — un artisan qui ne lisait aucun devis d'un autre a vidé les lignes de TOUS
  les artisans (relecture des essais de l'étape 3, N5b). Les tables posées
  depuis la section 45 le retirent ; le carnet de clients, non. Aucun écran
  ne s'en sert : c'est un droit qui n'a aucune raison d'exister.
- [ ] **Un blocage ne cache pas à l'artisan une demande déjà reçue** :
  `quote_requests`, `sos_requests` et `mes_demandes_recues()` ne filtrent pas
  `est_masque` (mesuré par la critique « base » du cahier, cahier §1.3). Le
  devis en est un lecteur de plus : un artisan qu'un particulier a bloqué
  peut encore rattacher un NOUVEAU devis à la demande de ce particulier
  (relecture sécurité de l'étape 3, M4 : `INSERT 0 1`) — un devis que personne
  d'autre que lui ne lit. **Une décision d'abord, et elle est à vous** : « un
  blocage est symétrique » ne dit pas si une demande déjà reçue doit
  disparaître.
- [ ] **La classe de blancs est recopiée** — les caractères qu'on retire au
  bord d'un texte, invisibles compris. Relevé le 23/10 : sept copies dans
  quatre fonctions de `schema.sql` (`tient_les_tarifs`,
  `tient_les_tarifs_publics`, `tient_le_devis`, `tient_la_ligne_de_devis`) —
  **huit dans cinq depuis le lot P**, avec `tient_le_poste` —,
  plus deux constantes JavaScript (`BLANCS_TARIFS` dans `src/lib/emetteur.js`,
  `BLANCS` dans `src/lib/devis.js`). `verifier-devis` les compare, donc elles
  ne peuvent pas diverger en silence ; mais une règle ne s'écrit qu'à UN
  endroit. La ramener à une seule fonction SQL touche des fonctions des lots
  0a, T et 1 (sections 46, 47 et 49) : un lot à part (cahier §2.6, qui
  écrivait « 0a, T et 48 » avant que la section 49 existe — la section 48,
  celle de VIES, n'en contient aucune).
- [ ] **L'artisan peut récrire une demande qui lui est adressée.** La
  politique « le pro traite le devis » de `quote_requests`, d'avant le module,
  le laisse modifier toutes les colonnes, `client_id` et `description`
  compris, et aucun déclencheur ne les fige — prouvé sur une base d'essai :
  `UPDATE 1` (relecture SQL du 2e tour de l'étape 3, point 6). Ça compte
  depuis le lot 1 : « Faire un devis » reprend cette description comme objet
  du devis, et l'export du particulier la range parmi les demandes qu'il a
  envoyées (`demandes_de_devis`).

**Au lot 2 :**

- [ ] **La remise sur le TOTAL du devis** — réponse du 21/10 (Q3). Elle se
  construit **avant le PDF** : répartie entre les taux de TVA au centime près
  par une règle écrite et éprouvée (sans la règle du plus fort reste, une
  répartition donne 334 au lieu de 333), et le prix avant remise gardé
  (BOFiP §220). Le lot 1 ne pose aucune colonne de remise — une colonne sans
  lecteur — ; `devis_tva`, recalculée en entier à chaque écriture,
  l'accueillera sans réécrire un devis.
- [ ] **En franchise, le « Total » additionne encore la TVA des lignes qui en
  portent** — sur la carte de « Mes devis » comme dans le pied de la saisie.
  Le bandeau de cohérence le signale (« Vous êtes déclaré en franchise de TVA,
  mais des lignes portent un taux… »), et rien ne corrige les lignes à votre
  place. Relevé sur la vraie base le 22-23/10. C'est le refus de remise du
  lot 2 qui le tiendra : au lot 1, la base ne lit pas le régime (cahier §1.5,
  C3).
- [ ] **Le figeage** : le statut (aujourd'hui `'brouillon'` seul), le numéro,
  la copie de l'émetteur et du client — **dont le régime de TVA, figé sur le
  devis** —, `OP003`, et le refus de remise d'un devis sans régime déclaré ou
  dont les taux contredisent le régime (cahier §1.3). Deux choses que le
  lot 1 laisse, et que le figeage doit fermer : supprimer puis recréer un
  brouillon sous le même identifiant récrit sa source (relecture sécurité de
  l'étape 3, M7 — un droit au lot 1, où rien n'engage personne) ; et
  **l'invariant de la profondeur**, écrit dans 49.5 bis : le jour où un
  déclencheur du lot 2 écrira `devis`, il passera sans numéro d'écriture —
  c'est là qu'il faudra revoir la règle.
- [ ] **Remesurer le coût du recalcul ligne par ligne** quand un gros artisan
  supprime son compte : 1,6 s à 100 000 lignes ; une variante qui, pour une
  suppression, recalcule une fois par devis (un déclencheur par instruction)
  a été éprouvée à 0,37 s (relecture SQL du 2e tour de l'étape 3).
- [ ] **Le commentaire de 49.5 bis, point 7, ne dit pas encore qu'à la borne
  même (2^53 − 1), un devis ne s'écrit plus, mais se supprime** : plus aucun
  numéro ne peut dépasser la borne, donc l'en-tête et toute ligne sont
  refusés pour toujours ; la suppression, elle, passe. Seul un client modifié
  y porte son devis. Prouvé sur une base d'essai ; une phrase à ajouter, pas
  de code (relecture SQL du 2e tour de l'étape 3, mineur 3 ; compte rendu de
  l'étape 3, §9).
- [ ] **« jour » n'est dans aucun cas de `supabase/cas-devis.json`** (44 cas,
  relevé le 23/10) : l'essai 49 insère une ligne dans chacune des sept unités,
  mais aucun cas joué à la fois par JavaScript et par PostgreSQL ne la tient.
- [ ] **`verifier-devis` interdit `public.devis` à la lettre dans les fonctions
  de motifs** (D4-c). Au lot 2, `motifs_refus_remise` devra lire le devis : la
  vérification se resserrera alors sur la colonne `source` et les deux liens,
  comme le dit le contrôle.

**La Base Adresse Nationale change d'adresse — à migrer :**

- [ ] **`api-adresse.data.gouv.fr` est passée à la Géoplateforme de l'IGN.**
  Mesuré le 23/10/2026 : elle répond encore, en 200, mais ses en-têtes disent
  `x-api-deprecated: true`, `deprecation` et `sunset` au **31/01/2026**, et
  `x-api-new-host: https://data.geopf.fr/geocodage/`. La même question posée
  à `https://data.geopf.fr/geocodage/search/` rend la même réponse, au même
  format (même empreinte `etag`). Un service annoncé fermé peut s'éteindre
  sans prévenir : ce jour-là, aucun champ de ville ne propose plus rien, et
  l'écran SOS — qui envoie directement les coordonnées de la suggestion —
  ne trouve plus d'artisan, sans la moindre erreur (CLAUDE.md, « L'adresse
  d'un client se propose »). À changer ENSEMBLE : `src/lib/adresse.js` (`BASE`
  et son en-tête) et `scripts/verifier-adresse.mjs`, qui l'appelle pour de
  vrai ; **`src/data/legal.js`**, dont la politique de confidentialité nomme
  `api-adresse.data.gouv.fr` parmi les destinataires, et
  **`scripts/verifier-legal.mjs`**, qui exige ce nom — le texte opposable
  change, donc `VERSION` aussi ; `scripts/essai-adresse-client.mjs`, le
  `README.md`, et le relais des essais au navigateur
  (`poserRelais(page, { hote: 'api-adresse.data.gouv.fr' })`, CLAUDE.md).

**L'outillage :**

- [ ] **`npm run mesure-devis` n'est ni dans `npm run verifier` ni dans la
  CI** : il lui faut un serveur Expo et un navigateur. C'est pourtant lui SEUL
  qui tient les tailles de cible, les positions et les gestes du devis
  (186 mesures, en vrais événements tactiles). À lancer à la main avant toute
  retouche de ces écrans, ou à brancher dans la CI avec un serveur (compte
  rendu des étapes 4 à 7, §7).
- [ ] **`supabase/essais-section-49.sql` ne tourne qu'à la main** (§2.3 :
  `npm run verifier` ne joue aucun SQL). C'est lui qui prouve la sécurité des
  tables du devis, par le catalogue de la base rejouée ; un contrôle qui lit
  du texte ne verra jamais toutes les formes qu'un SQL peut prendre. Tant que
  ce n'est pas automatisé, une régression qui passe les contrôles ne se voit
  qu'au prochain rejeu.
- [ ] **La relecture SÉCURITÉ du 2e tour de l'étape 3 n'a jamais été rendue**
  (le conteneur a redémarré pendant qu'elle tournait). Les deux importants du
  1er tour sont corrigés et mesurés ; au 2e tour, la relecture SQL a rejoué
  les cascades, `OP014` et `OP017`, et celle des essais les acteurs adverses.
  Aucun compte rendu suivant ne dit qu'elle ait été relancée : à relancer
  avant le lot 2, ou à acter.
- [ ] **Les deux preuves SIRET « essai » restent en base** : réutilisées,
  mises à jour pour six heures, pour l'essai du 22-23/10 ; le connecteur
  refuse un `delete`, elles expirent d'elles-mêmes. Ce sont celles de l'essai
  du 20/10, encore là deux jours après (voir « Après le lot 0a ») : à
  constater à la prochaine session.

**Laissé ouvert, et daté :**

- [ ] **« Mes devis » déjà lu ne se relit pas en rouvrant l'écran** : il se
  charge à la demande, une fois. Couper le réseau ne montre l'échec qu'après
  un rechargement complet ; au premier chargement, l'échec est bien dit
  (« Lecture impossible… », jamais « Aucun devis »). Relevé sur la vraie base.
- [ ] **« Non enregistrée » arrive tout de suite sur une coupure franche** ;
  la file n'attend ses 8 secondes que si la requête ne revient pas — et quand
  la carte est fermée pendant une écriture qui ne revient pas, la rangée ne le
  dit qu'au bout de 13,8 s (deux envois de la même version, mesuré en
  démonstration).
- [ ] **Une rangée non enregistrée montre sa valeur LOCALE**, pendant que le
  pied garde la dernière valeur de la base : deux montants qui ne
  correspondent pas, tant que la ligne n'est pas enregistrée. Le pied le dit
  (« 1 ligne non enregistrée »), la rangée aussi (« Non enregistrée —
  Réessayer ») ; à juger avec vous si c'est assez clair.
- [ ] **« modifié il y a… », dans « Mes devis », vient de l'heure de la BASE**
  (relecture « données », m6) — et **aucun contrôle ne le tient** : une
  retouche qui reprendrait l'heure du téléphone passerait au vert.

### Après le lot P — ce qui reste (25/10/2026)

Le détail est dans CLAUDE.md, « La base de postes — lot P » ; le cahier qui
l'a guidé est archivé en `docs/CAHIER-LOT-P.md`. La section 50 est sur la
vraie base depuis le 25/10 à 11 h 12 (heure de Paris), et l'essai par le
chemin de l'application a été fait le même jour, avec quatre comptes jetables
à Brest (A, B et P, puis A recréé avec la même adresse pour la limite de
1 000 postes), tous supprimés par le chemin de l'application : la base est
revenue à 0 poste. Les comptes rendus et les relectures cités entre
parenthèses (BASE…, ECRAN…, TEXTES…) sont des documents de travail de la
session : ils ne sont pas dans le dépôt.

**Les avertissements des commits `92c3804`, `1144750` et `7a8cc10` —
« NE PAS METTRE CETTE VERSION SUR LE TÉLÉPHONE » — ne valent plus** depuis le
25/10 : « Ma base de postes » trouve sa table. Vous pouvez faire `git pull`.
Aucun paquet nouveau, aucun module natif : rien à reconstruire.

**Toujours ouverts, et non recopiés ici** (voir « Après le lot 1 » et « Après
le lot T ») : faire ré-accepter les conditions — `VERSION` est passée au
`2026-10-24` avec ce lot, et rien ne compare encore la version acceptée à la
version en vigueur — ; le contrat de sous-traitance, qui devra couvrir aussi
la base de postes (un artisan peut y laisser le nom d'un client malgré
l'avertissement de la feuille) ; `mesure-devis` (voir « Après le lot 1 ») et
les essais SQL (§2.3), qui ne tournent qu'à la main. **Les deux preuves SIRET
`essai`** ont été réutilisées une fois de plus le 25/10, réécrites pour les
adresses de l'essai : elles sont toujours en base, et expirent d'elles-mêmes.

**À essayer sur votre iPhone** — votre compte principal, dans le build de
développement (plus dans Expo Go : depuis le 25/10, il est passé au SDK 58 et
ne sait plus ouvrir Opus — CLAUDE.md, « Expo Go ne peut plus ouvrir Opus »),
jamais l'icône « preview » du 17/10, et jamais le compte du frère.

**Essayé en bloc le 25/10** : « tout fonctionne correctement », et la base
porte trois postes rangés depuis votre téléphone, sur votre compte principal
(l'ajout d'un appui et une modification sont donc passés). Puis le deuxième
point, le plus utile : « si je rajoute une lettre, la proposition de phrase
reste la même » — le premier signe que la clé tourne sur le téléphone. Les
autres points n'ont pas eu de réponse un par un :

- [ ] dans un devis, une ligne chiffrée → « Ajouter à ma base » : la feuille
  propose le prix de la ligne, le clavier ne cache ni le prix ni le bouton ;
- [x] une ligne neuve où vous tapez la même phrase avec un s en plus, ou en
  majuscules : **une seule** proposition, la bonne en tête — essayé le 25/10
  (« si je rajoute une lettre, la proposition de phrase reste la même »), sans
  dire quelle lettre ni où ;
- [ ] tapez « Les » : rien ne doit être proposé ; « seuils » (si vous avez un
  poste « Seuil… ») : une seule proposition — un second témoin de la clé sur
  le téléphone, après la lettre ajoutée du point précédent ;
- [ ] la ligne ouverte en grand montre « Votre prix de référence » au-dessus
  de la quantité ; mettez un autre prix : « c'est voulu ? » apparaît sous le
  prix ; la liste du devis, elle, ne montre rien ;
- [ ] après « Changer ma référence », la ligne répond-elle au premier appui ?
  (deux fenêtres empilées laissent parfois, sur iPhone, un voile invisible qui
  avale les touches) ;
- [ ] « Ma base de postes » (depuis « Mes devis » ou « Mon profil ») :
  chercher, corriger une phrase, retirer un prix (deux appuis), retirer un
  poste ;
- [ ] jamais plus de trois propositions, la troisième visible clavier ouvert,
  et la virgule du pavé décimal dans le prix de référence ;
- [ ] la croix des feuilles se touche-t-elle bien, avec un gant ?
- [ ] avec VoiceOver, la référence est-elle lue avant le prix ?
- [ ] le correcteur du clavier change-t-il « placo » ou « BA13 » dans une
  phrase de la base ?
- [ ] dans le choix des métiers, « macon » trouve-t-il « Maçon » ? (sinon, le
  téléphone ne sait pas retirer les accents comme le fait le navigateur, et
  d'autres recherches d'Opus en pâtissent — pas la clé du lot P, qui ne s'en
  sert pas).

**À trancher avec vous, en voyant l'écran** — des choix d'écran faits sans
vous (relectures « écran » et « textes ») :

- [ ] **« réf. »** dans les propositions (« 60,00 € / m² · réf. du
  25/10/2026 ») : le mot entier ne tient pas à 320 points de large ;
- [ ] **la phrase de sortie raccourcie** : « Ce n'est pas le même travail ?
  Changez un mot de la ligne (un s, un accent ou une majuscule ne suffit
  pas). » ;
- [ ] **« Au jour »** pour l'unité « jour », la préposition des autres unités
  (« Au mètre carré », « À l'heure ») ; « À la journée » serait plus naturel ;
- [ ] **plus aucun retrait depuis la ligne** : la feuille renvoie à « Ma base
  de postes » (ECRAN2) ;
- [ ] **deux propositions de même phrase** se distinguent par l'unité et la
  fourniture ; le prix, c'est de couper la fin de la date (ou de « votre base,
  sans prix de référence ») — dès 390 points de large, quand l'unité et la
  fourniture s'écrivent toutes deux (ECRAN9) ;
- [ ] **la feuille « Ce poste existe déjà »** ne redit plus cette phrase sous
  son titre (le cahier la redisait) ;
- [ ] **pour une ligne écrite autrement qu'un poste**, la phrase du poste n'est
  écrite qu'une fois, dans la référence ;
- [ ] **sous « Confirmer la suppression » d'un client qui a des devis**, deux
  paragraphes rouges sous une ligne grise (« Définitif… ») (TEXTES1) : c'est
  le style des avertissements de cette fiche, à juger à l'écran.

**À faire relire (droit)** :

- [ ] **la fin de « Vos tarifs et vos prix »** dans les textes légaux
  (TEXTES4) : un texte opposable, récrit plus que la relecture ne le
  proposait — l'engagement de l'éditeur couvre désormais les phrases de la
  base de postes, et l'aveu « un engagement, pas une impossibilité » n'est
  écrit qu'une fois ;
- [ ] **le connecteur de lecture des sessions de travail** (`SupabaseLecture`)
  lit tout, RLS ignorée : est-il couvert par cet engagement (BASE7) ? Il ne
  sert qu'à relever la FORME des données, mais c'est une discipline, pas un
  verrou ;
- [ ] si un jour un devis imprime un « prix de référence » à côté d'un prix
  plus bas, cela pourrait se lire comme une annonce de réduction (CD12) :
  **aujourd'hui rien ne l'imprime**, et le lot 2 ne doit pas le faire sans
  avis.

**Au lot 2** :

- [ ] un devis venu d'une demande, **rouvert plus tard**, ne compare plus le
  nom du demandeur aux phrases qu'on range (l'avertissement « nom du client »
  de la feuille) : le devis n'en garde que la date et le budget. Une jointure
  de plus dans `unDevis` (`quote_requests`) le corrige (TEXTES9) ;
- [ ] un poste ajouté **avant** que le devis soit enregistré en base n'a pas
  de devis d'origine, et ne compte pas dans « les postes que vous en avez
  rangés » (TEXTES8) : rare ;
- [ ] `DevisScreen.js`, `ChoixClientDevis.js` et `ClientsScreen.js` disent
  encore « la base n'a pas répondu » — une cause qu'on ne connaît pas (relevé
  hors du lot) ;
- [ ] **l'origine d'une suggestion de la mémoire** (le point « Après le
  lot 1 ») : le lot P ne l'aggrave pas — « Ma base de postes » dit seulement
  « Ajouté le … depuis un de vos devis », jamais un mot de son objet — mais
  une proposition de la mémoire peut toujours dire « déjà écrit dans Salle de
  bains Martin » pendant que vous chiffrez le devis d'un autre client
  (TEXTES17).

**Au lot 4** :

- [ ] la purge des devis jamais acceptés **ne touche pas la base de postes** :
  une phrase qui nomme un client survit à son devis. Le chemin d'effacement des
  textes légaux le dit déjà ; le mécanisme de purge devra le savoir.

**Un lot à part** :

- [ ] **la croix des feuilles du bas** (`FeuilleBas`) fait 18 × 20 points
  (environ 38 × 40 au doigt, par `hitSlop`) : sous les 44 points. `mesure-devis`
  la tolère parce que le voile ferme aussi la feuille ; la corriger touche
  toutes les feuilles du projet.

**Pour la base commune, un jour** (le cahier, C10 — des contraintes, pas un
travail) :

- aucun poste ne rejoint une base commune sans une case à part, **non
  cochée** par défaut ;
- le lien vers le devis d'origine ne part jamais ;
- un prix de référence est un prix **futur**, que l'artisan se fixe : jamais
  versable tel quel ;
- tant que le lien existe, c'est aussi le prix d'un devis précis, donc d'un
  client : à poser à l'avocat ;
- une phrase peut venir d'une bibliothèque sous licence (CPI L342-1) ;
- Opus n'« actualise » jamais les références de tout le monde d'un coup.

**Connus, et laissés tels quels, avec leur raison** :

- « 10cm » / « 10 cm » et « BA13 » / « BA 13 » restent deux phrases (votre
  réponse du 25/10) ; « travaux » / « travail » aussi (ce pluriel ne se fait
  pas en s) ; une **autre formulation** du même travail n'est pas reconnue :
  c'est l'agent, plus tard ;
- **un AJOUT tardif n'est pas couvert** : resté en route, réessayé, le poste
  retiré entre-temps, puis le premier envoi arrive — le poste revient (essai
  50, cas 17). Il se voit dans « Ma base » et se retire de nouveau ; une
  « pierre tombale » coûterait une table pour un seul cas ;
- une phrase collée en **forme décomposée** (un accent écrit en deux
  caractères, ce que fait parfois un PDF) a bien la même clé, mais l'écran
  dit qu'elle est rangée « sous « … » » (T21) : rare, et sans effet sur les
  propositions ;
- l'écran ne reconnaît que 38 caractères invisibles (et 25 espaces) quand il
  compare la forme d'une ligne à celle d'un poste (`formeVisible`), la base
  en retire 4 174 : une ligne qui ne diffère d'un poste que par un invisible
  rare dirait « sous « … » ». Cosmétique ;
- un client modifié qui envoie l'identifiant d'un poste d'un AUTRE artisan
  apprend que ce poste existe (refus 23505), et rien d'autre (BASE4) : c'est
  l'oracle déjà connu du lot 1, écrit en section 50.2, pas fermé — un
  identifiant aléatoire ne se devine pas ;
- **la base n'est relue, pendant la saisie, qu'une fois par session** : un
  poste ajouté depuis un autre appareil n'apparaît dans les propositions
  qu'après avoir rouvert « Ma base de postes » ou relancé Opus ;
- **la limite de lignes de l'API** vaut au moins 1 000 (mesuré le 25/10 : les
  1 000 postes d'un compte au plafond reviennent d'une lecture) ; sa valeur
  exacte n'est pas connue : relever un jour le plafond `OP018` demanderait de
  la remesurer d'abord ;
- **sur la vraie base, la clé n'a été comparée que sur le plan de base et les
  plans 1 et 14** d'Unicode : « tout Unicode » d'un bloc prend 4 minutes,
  trop pour une requête ; la parité complète est prouvée sur PostgreSQL 16 ;
- **sous Hermes, le moteur de l'iPhone, la clé n'a qu'un témoin** : une lettre
  ajoutée garde la même proposition (25/10). Sa parité complète n'est prouvée
  que sous `node` et PostgreSQL ;
- `normalize` reste appelé par `texte.js`, `clients.js` et `emetteur.js` ; la
  clé, elle, ne s'en sert pas ;
- `verifier-adresse` échoue parfois à travers le mandataire du conteneur : un
  échec isolé se relance avant d'accuser le code ;
- `verifier-devis` a rougi une fois, le 24/10, sous forte charge, sur « un cas
  de la file tourne sans planter » ; non reproduit en six relances. S'il
  revient, garder la sortie complète du contrôle avant de relancer.

**Avant de remettre son compte au frère** : vérifier qu'il ne porte **aucun
poste** — des phrases et des prix rangés pour essayer seraient remis avec le
compte, donc donnés à un autre artisan. L'essai se fait sur votre compte
principal, jamais sur le sien.

### Après le lot S-a — ce qui reste (26/10/2026)

Le détail est dans CLAUDE.md, « Le stockage et le badge suspendu — lot S-a ».
La section 51 est sur la vraie base depuis le 26/10 vers 6 h 37 (heure de
Paris), et le défaut R1 a été prouvé AVANT puis fermé APRÈS par l'API de
stockage réelle, avec un compte particulier jetable supprimé par le chemin de
l'application (base revenue à 14 comptes / 8 fiches / 21 publications).

**Les avertissements des commits `37783ad` et `a96b3e6` — « ne pas faire
`git pull` » — ne valent plus** : `git pull`, puis `npx expo start -c`.
Aucun module natif : rien à reconstruire.

**La suite du lot S**, dans l'ordre du cahier : S-b (demandes, blocage,
partenariats, réponses — vos réponses Q1 et Q2 du 25/10), S-c (compteurs,
dates, remontée — Q3 : 3 remontées par artisan et par semaine), S-d
(lectures, droits, export). Puis le lot 2 du devis.

**Reportés, et à ne pas oublier** :

- [ ] **`badge_suspendu_le` est lisible par tout compte connecté** (B4,
  mesuré sur la vraie base le 26/10). L'application ne la lit que pour sa
  propre fiche ; c'est une colonne à fermer avec les autres droits de colonne,
  dans S-d.
- [ ] **Supprimer une publication laisse son entrée de portfolio** (une
  publication « Les deux »). Les textes le disent désormais ; la retirer aussi
  est **une décision à vous**.
- [ ] **Cloudinary** : relever le PAYS dans la console Cloudinary et l'ADRESSE
  de Cloudinary (`EDITEUR.hebergeurVideos` dans `src/data/legal.js`), signer
  son contrat de sous-traitance (DPA), et construire l'effacement des vidéos
  (`EFFACEMENT_CLOUDINARY`). `verifier-legal` refuse qu'Opus quitte `'essai'`
  sans les trois.
- [ ] **Un refus de l'administration invalide les DEUX pièces**
  (`admin_refuser_pro` remet le Kbis et l'assurance à « non validé »), même si
  une seule avait changé ; et **le renouvellement annuel d'une attestation
  suspend le badge** (votre décision « Garder la règle »). Les deux sont voulus
  aujourd'hui ; à dire aux artisans le jour où l'administration aura du monde
  à revoir.
- [ ] **Faire ré-accepter les conditions** : `VERSION` est passée au
  `2026-10-25`, et rien ne compare encore la version acceptée à la version
  en vigueur (préavis de quinze jours pour les professionnels, règlement
  2019/1150).
- [ ] **Les droits sur les musiques** des montages vidéo, avant toute
  ouverture au public.
- [ ] **La fonction `compte` liste 1 000 fichiers au plus par dossier**, sans
  page suivante : au-delà, des fichiers resteraient sans que sa réponse le
  dise. L'application lit maintenant sa réponse et dit quand un ménage est
  incomplet.
- [ ] **Le modèle local du stockage n'est pas celui de la production** (qui
  est versionné) : un essai SQL du stockage modélise, seul un essai par l'API
  réelle prouve.

**À essayer sur votre iPhone**, dans le build de développement : envoyer une
nouvelle attestation d'assurance depuis « Modifier mon profil » (sur un
compte PRO qui n'est pas vérifié, rien ne doit changer, sinon l'avertissement
« Envoyer une nouvelle pièce suspend votre badge » doit s'afficher avant) ; et
toucher une notification de commentaire sur une publication rangée dans un
chantier (elle plantait l'application jusqu'au 26/10).

### Après le lot S-b — ce qui reste (29/10/2026)

Le détail est dans CLAUDE.md, « Les demandes, le blocage, les partenariats,
les réponses — lot S-b ». **La migration est sur la vraie base depuis le
29/10 à 17 h 35** (heure de Paris), avec votre accord ; le relevé d'après est
identique à la simulation, et l'essai par le chemin de l'application a rendu
70 ✔ / 0 ✘ avec quatre comptes jetables à Brest, supprimés ensuite (base
revenue à 14 comptes / 8 fiches / 21 publications).

**Les avertissements des commits `aa95a41`, `d281d85` et `d4dbf78` — « ne pas
faire `git pull` » — ne valent plus** : `git pull`, puis `npx expo start -c`.
Aucun module natif : rien à reconstruire.

**Ce que le lot a fermé, et qui était listé plus bas** :

- [x] la base laissait envoyer un SOS à n'importe quel artisan, avec
  n'importe quel métier (OP025) — **mais pas la distance** : une urgence part
  vers un artisan qui prend ce métier et affiche ses tarifs, même hors de son
  rayon. Le rayon est une affaire de RECHERCHE, pas de droit ;
- [x] un compte qui se demande un devis, un rappel, une urgence, ou s'écrit
  à lui-même (contraintes « pas soi-même », posées `not valid` : les trois
  lignes « à soi-même » de la vraie base restent — les retirer vous
  appartient, le connecteur refuse un `delete`) ;
- [x] « X souhaite être rappelé » pour tout le monde : « X attend votre
  appel ».

**Reportés, et à ne pas oublier** :

- [ ] **Être bloqué se sait.** `est_masque()` répond aussi pour l'appelant,
  et un refus OP020 le laisse deviner. Les textes le disent (« elle peut
  s'en apercevoir »). Rendre le blocage indétectable demanderait de répondre
  des choses fausses : **une décision à vous**.
- [ ] **Il n'existe pas de bouton pour signaler un AVIS.** Les textes le
  disent au lieu de le promettre. À construire avec la modération des avis.
- [ ] **Les essais SQL ne tournent pas dans `npm run verifier`** (§2.3) :
  l'essai 51 b voit toutes les formes de SQL qui rouvrent une règle, les
  contrôles de texte non. Le plus utile des chantiers d'outillage.
- [ ] **Des compteurs d'abonnés sont faux sur la vraie base** — relevé de
  FORME du 27/10 : `followers_count` est PLUS HAUT que le vrai nombre sur 5
  fiches, les 5 du `seed.sql` (dont 3 « vérifiées » sans pièce). Aucun
  `likes_count` faux. Rien ne les recalcule : c'est le lot S-c (les
  compteurs), avec un nouveau relevé d'abord.
- [ ] **`notifie_demande` est créée deux fois dans `schema.sql`** (exception
  connue, que `verifier-demo` lit) ; « annonces lecture pro », « annonce
  reponses lecture pro », « lecture reponses » et « lecture demandes »
  aussi, depuis avant le lot. À résorber, pas à imiter.
- [ ] **Les décisions de l'administration passent sous un blocage**
  (`demande_pro_nouvelle` n'est jamais tue) : voulu — une demande de compte
  pro doit pouvoir être examinée —, et l'écran d'administration comme les
  textes le disent.
- [ ] **Faire ré-accepter les conditions** : `VERSION` est passée au
  `2026-10-28`, et rien ne compare encore la version acceptée à la version
  en vigueur (préavis de quinze jours pour les professionnels).

**À essayer sur votre iPhone**, dans le build de développement, après
`git pull` et `npx expo start -c` : répondre à une demande (Découvrir →
Demandes), puis rouvrir la conversation par « Répondu · Écrire » ; bloquer
quelqu'un depuis sa carte puis le débloquer depuis Confidentialité ;
accepter ou refuser un partenariat ; et « Faire un devis » depuis « Pour
moi ».

### La démonstration et la publicité — décidé le 26/10/2026

Les vidéos et les captures promotionnelles sont faites (en mode
démonstration, sans son, 23 vidéos et 36 captures). Votre réponse du 26/10 :
**renommer les artisans de la démonstration** avec des noms vérifiés absents
des registres, et **remplacer les dégradés de couleur par des photos libres
de droit** — puis refilmer. **Fait le 26/10**, et relu deux fois :

- [x] nouveaux noms d'entreprise pour tous les artisans et annonceurs,
  cherchés dans l'annuaire des entreprises (aucune entreprise ne porte ces
  mots) — **la base des marques de l'INPI, elle, n'a pas pu être consultée**
  (ligne plus bas) ;
- [x] 22 photos CC0 ou domaine public à la place des dégradés
  (`assets/demo/LICENCES.md`) ;
- [x] les numéros dans les six plages de fiction de l'Arcep ;
- [x] refilmé, monté, relu par une relecture adverse (21 constats confirmés
  sur 66), corrigé, refilmé une seconde fois.

**Les vidéos et captures du 25/10 ne doivent jamais être publiées** : elles
portent les anciens noms. Elles ont les mêmes noms de fichiers que les
nouvelles ; on les reconnaît à leurs dégradés de couleur.

Avant toute publicité payante : vérifier le libellé exact de votre marque
(« Opus » ou « Opus-Project »), et décider qui édite Opus (le mode d'emploi
des vidéos le détaille).

### Les défauts relevés au tournage — ce qui reste (26/10/2026)

Neuf défauts d'écran corrigés (CLAUDE.md, « Les défauts relevés au
tournage »). Ce qui reste, et pourquoi ce n'est pas fait :

- [ ] **Les anciennes données de démonstration sont dans la vraie base**
  (relevé en lecture seule le 26/10) : 5 fiches aux noms d'entreprises
  réelles — « Belaïd Maçonnerie », « Dubreuil Plomberie », « Faure
  Charpente », « Renaud Élec », « YC Carrelage » —, dont **3 portent le
  badge vérifié sans aucune pièce**, leurs 5 publications, et les 2 fausses
  publicités (« BricoPro Matériaux », « AssurBTP ») dans le vrai Fil. C'est
  une écriture en production. **Décidé par vous le 26/10 : on n'y touche
  PAS pour l'instant** — « je ne veux pas casser ce qui existe sur Opus ».
  La publicité est en pause ; une vidéo de présentation se fera quand Opus
  sera presque terminé. Le point reste ouvert pour ce jour-là : les
  renommer et retirer les badges, ou les supprimer.
- [x] **D11 — le maçon de démonstration recevait une urgence de
  plomberie.** Tranché par vous le 26/10 : **une ancienne urgence
  d'électricité** (« Plus de courant dans la cuisine », il y a 21 jours),
  du temps où ce compte était électricien — il en garde la ligne d'urgence.
  `verifier-demo` refuse le retour d'une urgence d'un métier sans ligne
  d'urgence, et compare son ancienneté écrite à sa date calculée. Ce qui
  reste étrange, et c'est assumé : une urgence « tout de suite » restée
  trois semaines sans réponse.
- [x] **La base laisse envoyer un SOS à n'importe quel artisan** (lot S) — **fermé le 29/10 par le lot S-b (OP025), sauf la distance** :
  « creation sos » ne regarde que le client et le blocage. Mesuré sur
  PostgreSQL : un SOS « plomberie » vers un maçon sans disponibilité ni
  tarifs passe, un `metier_key` inventé passe, une estimation inventée
  passe, et l'artisan reçoit « a besoin de vous EN URGENCE ». À ajouter :
  une contrainte sur `metier_key`, et dans le `with check` les conditions
  d'`artisans_urgence` (sans la distance), avec une phrase dans
  `erreurs.js`.
- [ ] **« Client vérifié » n'est expliqué nulle part** dans les textes
  légaux, alors que le code de la consommation (L. 111-7-2) demande de dire
  comment les avis sont contrôlés. À faire relire par un juriste avant
  l'ouverture. Et un avis écrit AVANT l'acceptation de la demande ne devient
  jamais « client vérifié » (le déclencheur ne joue qu'à l'écriture de
  l'avis) : une décision qui touche la base.
- [ ] **Une demande publiée ne prévient personne** — aucun déclencheur sur
  `demandes`. L'encart le dit désormais honnêtement ; prévenir les pros du
  métier serait une décision produit.
- [ ] Les sous-pages de son profil (« Modifier mon profil », « Mes
  publications », « Mes devis »…) n'allument aucun onglet. Un choix, pas un
  défaut : à décider si « Profil » doit rester allumé.
- [ ] Le numéro de téléphone d'une confirmation se coupe sur deux lignes
  (« 06 39 98 » / « 03 01. ») : des espaces insécables, facultatif.
- [ ] Les noms inventés n'ont pas été cherchés dans la base des marques de
  l'INPI ni dans celle de l'EUIPO (une marque de l'Union vaut aussi en
  France ; pas d'accès sans compte) : avant toute publicité payante. Les
  vidéos et captures du 25/10 portent les ANCIENS noms : ne pas les
  publier.
- [ ] **Quatre sujets n'ont pas de photo libre de droit acceptable** (mur
  de parpaings en cours de montage, toiture en cours de dépose, tuiles canal
  neuves, gaines électriques) : la démonstration a été réécrite autour des 22
  photos trouvées (`assets/demo/LICENCES.md`). Le jour où l'on veut ces
  sujets, la meilleure source est une photo prise sur un VRAI chantier, avec
  l'accord du client et sans rien d'identifiable.
- [x] **Sur SA propre publication, un artisan voyait « Suivre » et
  « Contacter ».** Validé par vous le 26/10 (« cacher les deux ») : fait
  dans le fil, le fil vidéo et la page d'une publication
  (`src/lib/ma-fiche.js`, `verifier-fil` section 9).
- [x] **« Signaler »** (le drapeau) sur SA propre publication : retiré,
  validé par vous le 26/10 (« on peut enlever aussi ce signaler »). Il reste
  sur les publications des autres — les magasins d'applications vérifient
  qu'un signalement se trouve.
- [x] **« Masquer »** (l'œil barré) sur SA propre publication : retiré,
  validé par vous le 26/10 au soir (« enlève l'œil barré »). Il reste sur
  les publications des autres.
- [x] **La pastille « Les plus proches » de la page Demandes** ne triait
  par distance qu'APRÈS « mes métiers » et l'urgence. Tranché par vous le
  26/10 : **elle trie vraiment par distance** (`src/lib/tri-demandes.js`,
  `verifier-demandes`). Éteinte, l'ancien ordre revient : mes métiers, puis
  l'urgence. Elle reste ALLUMÉE par défaut : la page s'ouvre donc par
  distance — à changer si vous préférez ouvrir sur vos métiers.

**La relecture de ces décisions (26/10/2026, au soir)** — treize défauts
confirmés, chacun reproduit puis contre-examiné. Corrigés à l'écran et dans
les contrôles :

- [x] **Sur SA PROPRE FICHE** (ouverte d'un appui sur le nom de sa
  publication), l'artisan voyait encore « Suivre », « Demander un devis »,
  « Envoyer un message », « Laisser un avis » et « Signaler ». C'est la
  même raison que pour la publication : une phrase les remplace (« C'est
  votre fiche : les boutons pour vous contacter s'affichent chez les
  autres »). **Si vous préférez y garder les boutons, dites-le** : c'est
  une ligne.
- [x] **« Suivre » affichait une réussite que la base refusait** (on ne
  s'abonne pas à soi-même) : l'erreur de la base n'était jamais lue.
  Elle l'est, et l'affichage se défait s'il y a refus.
- [x] **Une demande dont la ville était TAPÉE** (sans toucher de suggestion)
  n'avait aucune position, et passait derrière un chantier à 300 km —
  même urgente, de votre métier, dans votre commune. Sa position est
  maintenant retrouvée au moment de publier, comme pour une annonce.
- [x] **« À distance égale » se juge à la distance AFFICHÉE** : deux cartes
  « à 12 km » sont à la même distance pour vous, et c'est alors votre
  métier puis l'urgence qui les départagent. Au dixième près, une demande
  tranquille d'un autre métier passait devant une urgence du vôtre.
- [x] Trois contrôles qui laissaient passer des défauts (le tri, les boutons
  de sa publication, les notifications de démonstration) vérifient
  maintenant ce qui est AFFICHÉ, et ont été éprouvés en cassant : 31 défauts
  remis exprès, 31 refusés.

Ce qui reste, et qui touche la base (donc votre accord) :

- [x] **La base accepte qu'un compte se demande un devis, un rappel, une
  urgence, ou s'écrive à lui-même.** Fermé le 29/10 par le lot S-b. L'écran ne le propose plus, mais un
  client modifié le peut, et l'artisan se notifie alors sa propre demande.
  La parade : une contrainte « pas soi-même » sur les quatre tables
  (comme `pas_sabonner_a_soi_meme` sur les abonnements), posée **« not
  valid »** parce que la vraie base contient **déjà une ligne de chaque**
  (1 conversation, 1 demande de devis, 1 demande de rappel, relevées par
  leur forme seulement). À ranger dans le lot S. Les retirer vous appartient
  (le connecteur refuse un `delete`) : elles ne gênent rien.
- [x] **La base écrit « X souhaite être rappelé » pour tout le monde** (fermé le 29/10 : « X attend votre appel »),
  Sophie comprise (`notifie_demande()`). Une tournure neutre — « X attend
  votre appel » — se pose avec la prochaine migration (lot S). La
  démonstration écrit mot pour mot ce que la base envoie, faute comprise.
- [ ] Les « j'aime » et « enregistrer » ont la même forme que l'ancien
  « Suivre » : une réponse de la base qui n'est pas lue. Moins grave (rien
  ne les refuse aujourd'hui), à reprendre au passage.
- [ ] **`supabase/seed.sql` ne peut plus être rejoué** (mesuré en
  transaction annulée) : ses comptes naissent particuliers, et
  `exige_un_compte_pro()` refuse leur fiche. Il reste un document, pas un
  outil — à retirer ou à réécrire, jamais à rejouer sur la vraie base.

### Les urgences par la position du téléphone — votre idée, PAS construite (26/10/2026)

**Décidé par vous le 26/10 : on finit d'abord le devis et la facture.** Ce
qui suit est le plan, pour le jour où l'on ouvrira un lot « urgences ».

**Aujourd'hui**, une urgence cherche l'artisan à la commune écrite sur sa
FICHE (souvent le centre de la commune), jamais à la position de son
téléphone : un artisan de Lambesc qui travaille à Aix est vu à Lambesc. Le
particulier voit tous les artisans disponibles dans leur rayon, du plus près
au plus loin, avec un délai (« ~45 min ») et une estimation de prix, puis il
choisit.

**Votre idée, telle que vous l'avez décrite :**

1. **c'est l'artisan qui l'allume**, lui-même (« Je suis disponible ici »),
   et il l'éteint quand il veut. Sans elle, rien ne change : la commune de
   sa fiche sert, comme aujourd'hui ;
2. **on ne MONTRE jamais où il est** : la position sert seulement à TRIER.
   Quand une urgence part, Opus propose **les 3 plus proches** ;
3. **il règle ses délais selon la distance**, par exemple « à moins de
   1 km : intervention en 20 minutes au plus », « de 1 à 5 km : 40
   minutes »… — au lieu d'un seul délai pour toutes les distances ;
4. **il choisit combien de temps sa position reste partagée pour UNE
   urgence**, et après ce délai elle ne l'est plus pour cette urgence-là,
   tout en restant active pour les urgences à venir *(à confirmer : c'est
   ainsi que je l'ai compris)* ;
5. le particulier choisit **en connaissance de cause** : une position
   grossière, un délai d'intervention (ou au moins de prise de contact),
   et déjà une base de tarif — elle existe depuis le lot T.

**Ce qu'a établi la recherche du 26/10** (trois études — le code, l'iPhone,
le droit —, puis une relecture adverse qui a revérifié chaque point
important dans le code et sur la vraie base, en lecture seule) :

1. **« On ne montre pas où il est » ne protège RIEN, et c'est mesuré.** La
   recherche d'urgence accepte n'importe quel point de départ et ne garde
   que les artisans dont le RAYON couvre ce point. En ne regardant QUE
   « l'artisan apparaît / n'apparaît pas » — sans jamais lire de distance —,
   **120 recherches suffisent à situer un artisan à 7,5 m près**
   (simulation de la vraie fonction, revérifiée le 26/10). Une distance
   arrondie, une limite par compte (un concurrent ouvre trois comptes
   particuliers) ou « trier sans montrer » n'y changent rien.
   > **Ce que la base RANGE se retrouve, à la finesse où elle le range.**
   > La seule protection est donc de ne jamais ranger une position plus
   > fine que ce qu'on accepte de voir public : **la COMMUNE**, ou au pire
   > une case d'au moins 1 km — et c'est la BASE qui arrondit, pas le
   > téléphone (un client modifié enverrait la position exacte).
2. **Une position précise dirait son domicile le soir, et l'adresse de ses
   CLIENTS le jour** : un concurrent apprendrait chaque jour où il
   travaille.
3. **Ce qui ralentit vraiment une urgence aujourd'hui, ce n'est pas la
   distance** : elle part à UN SEUL artisan, sans notification sur l'écran
   verrouillé (le « dernier mètre » des notifications push, §2.2), sans
   délai de réponse, sans « personne ne répond : choisir un autre
   artisan ». Mettre le plus proche en tête sans ce filet peut RALENTIR :
   s'il est sur un toit ou au volant, la personne attend sans le savoir.
4. **Proche ne veut pas dire libre.** En plein chantier, il ne peut
   peut-être pas partir. Ce qui compte pour la personne, c'est « il peut
   partir maintenant » et le délai. Et « Je réponds aux urgences » ne
   s'éteint jamais tout seul aujourd'hui : un artisan qui l'oublie allumé
   en vacances apparaît quand même.
5. **Les deux endroits « naturels » pour ranger une position sont lisibles
   SANS COMPTE** (mesuré sur la vraie base) : les coordonnées de la fiche
   (`professional_profiles`) et toute la table `sos_availability`. Une
   position irait dans une table À ELLE, privée, que personne d'autre ne
   lit.
6. **Le droit** (recommandation de la CNIL sur les applications mobiles,
   2025) : la permission de l'iPhone ne vaut PAS consentement — Opus doit
   demander le sien, éteint par défaut, et le refuser ne doit rien coûter ;
   la CNIL recommande de **privilégier une donnée fournie à la main** ; une
   **analyse d'impact (AIPD) est très probablement obligatoire** si le GPS
   arrive (le logiciel PIA de la CNIL est gratuit) — point à faire
   confirmer par un juriste. **Et la politique de confidentialité promet
   aujourd'hui l'inverse** : « Votre position n'est jamais relevée par
   votre téléphone » (`legal.js`). Elle se réécrit AVANT.
7. **L'iPhone** : `expo-location` 57.0.22 pour le SDK 57, absent d'Opus →
   un nouveau build de développement. Une position prise **une fois, au
   premier plan**, se vérifie en partie au navigateur ; le suivi en
   arrière-plan (autorisation « Toujours », batterie, contrôle d'Apple) ne
   se vérifie nulle part ici — **jamais d'arrière-plan.**

**La forme recommandée, dans cet ordre, et TOUT APRÈS le devis et la
facture :**

1. **les notifications push**, puis le filet « pas de réponse : choisir un
   autre artisan », et une expiration à « Je réponds aux urgences » — c'est
   ce qui rend une urgence réellement plus rapide ;
2. **« Disponible maintenant à [commune] jusqu'à [heure] », SANS GPS** :
   l'artisan choisit sa commune du moment à la main (prérempli avec celle
   de sa fiche) et une heure de fin. Aucun module natif, aucun nouveau
   build, vérifiable au navigateur et en démonstration, et rien de plus fin
   que ce qui est déjà public. La recherche s'en sert pour CLASSER, et
   l'écran dit une phrase — « en ce moment dans votre commune », « en ce
   moment à Rognes, signalé il y a 20 min » —, jamais une carte ni un
   dixième de kilomètre. Une garde contre la triche : sa commune du moment
   doit rester à une distance bornée de sa fiche ;
3. **vos délais par tranche de distance** se posent sur cette base ;
4. **le GPS, seulement si l'étape 2 est trop pénible à l'usage** : un
   bouton « Me localiser », d'un appui, qui ne fait que REMPLIR la même
   commune — la position précise ne quitte jamais le téléphone. Le même
   module servirait à un « Me localiser » pour l'adresse du PARTICULIER en
   urgence, qui est peut-être le gain le plus direct.

**Une autre fonction, peut-être celle que vous vouliez dire** : APRÈS qu'un
artisan a ACCEPTÉ une urgence, le client le voit arriver, comme un VTC,
pendant un temps limité. Elle est bien moins risquée : un seul destinataire
(celui qui l'attend chez lui), une destination connue, une durée bornée
jusqu'à l'arrivée. À distinguer de la recherche.

**Les questions à vous poser le jour venu** : « si un artisan accepte »
veut-il dire « s'il accepte d'être localisé pour être trouvé », ou « après
avoir accepté une urgence, le client le voit arriver » ? Acceptez-vous
« en ce moment dans votre commune » plutôt que « dans votre rue » ? Le rayon
se compte-t-il depuis sa fiche ou depuis sa commune du moment ? Combien de
temps dure une disponibilité « maintenant » ?

**Et ce qui manque DÉJÀ aux urgences, à faire dans le même lot** : la base
laisse envoyer une urgence à n'importe quel artisan, même s'il ne fait pas
ce métier (voir plus haut, « Les défauts relevés au tournage »).

### L'addendum « QR & Dossier Travaux » — audité, PAS construit (19/10/2026)

Le document : `docs/ADDENDUM-QR-DOSSIER-TRAVAUX.md` (le PDF fait foi).
L'audit : `docs/AUDIT-ADDENDUM-QR.md`. **Le propriétaire veut finir le devis
d'abord**, et rien ne se refond sans sa validation. Ce qui en sort :

**Pour le devis — validé le 19/10, inscrit dans `PLAN-DEVIS.md` §10.15 :**

- [x] Les douze règles D1 à D12 de l'audit (le client est une fiche du
  carnet ; aucun lien d'origine obligatoire ; le lien vers une demande de
  devis s'appelle `quote_request_id` ; une clé `on delete set null` peut
  passer à vide sur un devis remis ; rien de ce qui est posé après la remise
  ne vit dans la ligne `devis` ; le PDF jamais dans `documents`…).

**Défauts qui existent DÉJÀ, revérifiés sur la vraie base le 19/10 — décidé
le 19/10 : un petit lot « S » (sécurité), mesuré, AVANT le lot 2 du devis
(ordre T → 1 → P → S → 2) :**

- [ ] **Stockage** (D7, R1) : les règles générales de remplacement et de
  suppression n'ont aucun filtre d'espace. **Avant le lot 2 du devis**, qui
  crée l'espace des PDF. Mesurer d'abord par une vraie écriture.
- [ ] **Partenariats entre pros** (R28) : une demande en attente se lit sans
  compte ; celui qui la reçoit peut en changer l'auteur en l'acceptant.
- [ ] **`demande_reponses`** (R23) : lisible sans compte. Aujourd'hui une
  réponse, aucun message.
- [ ] **Nom, ville, code postal de chaque compte** lisibles sans compte
  (R29) : une DÉCISION, à prendre avant tout écran de consentement.

**L'addendum lui-même, après le devis**, dans l'ordre de son §21 : relation
client ↔ pro, QR professionnel (attend la publication sur l'App Store et une
page lisible sans l'application), QR particulier (attend la caméra, donc une
reconstruction, et les notifications sur l'écran verrouillé), Dossier
Travaux, partage. Les dix-huit points à valider sont au §5 de l'audit.


### Fournisseurs et prix (module 7) — à trancher à son ouverture

L'étude `docs/COMPARATEUR-MATERIAUX.md` (17/10/2026) a rangé ses décisions
selon leur moment. Les deux qui se posaient tout de suite ont reçu leur
réponse le 18/10 :

- **les négoces inscriptibles comme artisans** : on attend, en le sachant
  (section « Les fournisseurs » plus haut) ;
- **la neutralité** reste OUVERTE, parce qu'elle dépend d'une question plus
  large. Réponse du propriétaire : « je ne sais pas encore comment me
  rémunérer sur Opus, mais je pense que les pros devront payer quelque
  chose ». **Le modèle économique d'Opus est donc à décider**, et la
  neutralité avec lui. Ce qui reste recommandé quel que soit le modèle :
  **un fournisseur peut acheter de la visibilité marquée « Annonce »,
  jamais un rang dans la liste des prix.** À trancher AVANT toute
  conversation avec un négoce ou un fabricant — une promesse faite au
  premier ne se reprend pas.

Les autres attendent leur module, et on ne les tranche PAS avant :

- [ ] **une plateforme de facture électronique partenaire, ou non** — à
  l'ouverture du module 3 (factures) ;
- [ ] **comment mesurer la lecture des factures**, et le geste séparé
  « retrouver mes prix dans mes factures » — au début du module 6 ;
- [ ] **le compte fournisseur à part, et ses offres** — au module 7, sauf si
  la question « Négoces » l'avance ;
- [ ] **le premier lot de matériaux** (recommandation : le métier du frère,
  puisque c'est lui qui aura des factures) et **l'âge à partir duquel un
  prix passe « à vérifier »** (proposition : 3 mois) — au module 7 ;
- [ ] **le sort des réponses et des annonces « fournisseur »** quand un
  fournisseur supprime son compte — au module 7 ;
- [ ] **les prix d'achat dans la future base vendue par API** — avec le
  troisième cahier des charges, jamais sans avocat ;
- [ ] **brancher les comptes fournisseurs des artisans** (votre idée du 18/10,
  `COMPARATEUR-MATERIAUX.md` §11) — au module 7. Les serveurs d'Opus qui se
  connectent avec les identifiants de l'artisan : **EXCLU**. Voie licite :
  d'abord ses propres fichiers (factures, tarif net téléchargé, réponses aux
  demandes de prix), puis un connecteur accordé par un négoce, négoce par
  négoce, en lecture seule et révocable — après la décision sur la
  neutralité. Un navigateur intégré : seulement avec l'autorisation écrite
  du négoce (règle 5.2.2 d'Apple) et l'avis d'un avocat.

> **Engagement de méthode, dès maintenant : les prix d'achat d'un artisan
> seront traités pour lui seul**, sous confidentialité, administrateur
> compris (`DONNEES-DES-ARTISANS.md` §5.2). Il n'est PAS écrit dans les
> textes légaux : ils décriraient un traitement qui n'existe pas encore. Il
> y entrera avec le module 6.

---

## La base de connaissances du BTP — une VISION, en attente de son cahier des charges (17/10/2026)

Le propriétaire, en parlant des prix du marché :

> « Au-delà d'Opus, je voudrais créer une base de données spéciale pour le BTP,
> avec toutes les informations croisées dans Opus, pour que nos agents
> deviennent imbattables sur le BTP : qu'ils connaissent toutes les lois, les
> DTU, les façons de faire, les étapes d'un chantier, les prix… Pour que, si on
> veut créer une nouvelle application sur le bâtiment, on utilise cette base
> avec une API. Je te donnerai un futur cahier des charges qui expliquera ce que
> je veux que ça devienne. »

**Rien ne se construit avant ce cahier des charges** — c'est la règle tenue
pour le second (« attendre validation du plan »). Mais trois choses se décident
DÈS MAINTENANT, parce qu'elles coûteraient cher à rattraper :

1. **Ranger les données d'Opus de façon RÉUTILISABLE.** Un poste de devis
   rangé avec son unité, son prix, sa date, sa région et sa catégorie de
   métier sert un jour à une base ; un poste rangé en texte libre ne servira
   jamais à rien. C'est déjà la direction du plan devis (quantité en nombre,
   unité en liste, centimes) ; elle devient une exigence. (Pour la base de
   postes, tranché au lot P le 23/10 : ni colonne métier ni région — aucun
   lecteur, et un poste n'a pas de lieu ; le métier se déduira des métiers de
   la fiche — plan 10.17.)
2. **Les données des artisans ne sont PAS à Opus.** Leurs prix sont leur
   secret commercial, leurs clients sont des tiers. Une base commune ne pourra
   naître que de contributions **consenties, retirables et anonymes** — jamais
   d'une copie silencieuse de ce qu'ils ont saisi. Écrit dans
   `docs/DEVIS-DU-PROPRIETAIRE.md` §5 et §6.
3. **Une base de connaissances ne se remplit qu'avec ce qu'on a le DROIT d'y
   mettre.** Les lois et décrets sont librement réutilisables ; les normes (les
   NF DTU sont des normes AFNOR vendues), les bases de prix commerciales et les
   guides professionnels ont chacun leurs conditions. La recherche du 17/10
   (`docs/SOURCES-DONNEES-BTP.md`) fait le tour de ce qui existe et de ce
   qu'on peut en faire — pour préparer ce cahier des charges, pas pour le
   remplacer.

### Et le modèle économique qu'il y voit (17/10/2026)

> « Si l'IA analyse tout ce qui se passe sur Opus — chaque poste, chaque terme
> employé, chaque tarif — on aura la plus grosse base de données spécialisée
> dans le BTP, et on pourra un jour faire une clé API et faire payer cette
> base. »

**C'est cohérent, et c'est le modèle des grandes bases étrangères** (RSMeans
aux États-Unis, BCIS au Royaume-Uni). Ce qu'Opus aurait de plus qu'elles, et
qu'aucune base française n'a : **les prix des devis ACCEPTÉS**. Une base
classique publie des prix estimés ; Opus saurait quels prix les clients ont
réellement signés, et lesquels ils ont refusés. C'est le vrai prix du marché.

Quatre conditions, et la première décide des trois autres :

1. **La confiance des artisans EST la base.** Si un artisan découvre que ses
   données sont vendues sans qu'il l'ait compris, il part, et ses collègues
   avec lui : la base cesse d'être alimentée et meurt. D'où la transparence,
   le consentement et la contrepartie (`docs/DEVIS-DU-PROPRIETAIRE.md` §6.4,
   `docs/DONNEES-DES-ARTISANS.md`).
2. **Seuls des agrégats anonymes se vendent** — jamais un prix rattachable à
   un artisan, jamais une donnée d'un de ses clients.
3. **Le volume vient d'abord.** Une base vaut par le nombre d'artisans actifs
   et sa fraîcheur. L'ordre est donc : rendre Opus indispensable, et la base
   naît en chemin — pas l'inverse.
4. **À qui on la vend se décide.** Des prix du marché vendus à un assureur
   pour baisser ses remboursements, ou à une plateforme pour tirer les prix
   vers le bas, se retourneraient contre les artisans qui les ont fournis.
   La liste des acheteurs acceptables est une décision du propriétaire, à
   écrire dans le futur cahier des charges.

Et une protection en retour : le producteur d'une base de données qui a fait
un investissement substantiel est protégé contre son extraction (CPI L341-1).
La base d'Opus le serait comme celles qu'elle ne peut pas copier aujourd'hui.

**Tranché par le propriétaire le 17/10 :** « on ne donnera jamais aux autres
artisans d'Opus d'où vient l'information — on ne dira pas “Dylan à Lambesc
prend 25 €” ». La règle technique qui en découle, et qui va plus loin que ne
pas écrire le nom : **aucun chiffre ne doit permettre de DEVINER la source.**
« Placo à Lambesc : 25 € » désigne Dylan même sans son nom s'il est le seul
plaquiste d'Opus à Lambesc. D'où quatre gardes, à tenir par la base et non par
l'écran : un **nombre minimal d'artisans différents** derrière chaque chiffre
(sinon rien ne s'affiche), une **zone large** (département ou région, jamais
la commune), une **période de plusieurs mois**, et une **fourchette** plutôt
qu'un prix exact.

**Et deux précisions du même jour.** Le propriétaire : « il faut que les prix
correspondent à chaque région » — **la fourchette est donc régionale**, pas
nationale (un prix de Paris n'est pas un prix de Provence). Et un chiffre
porte sur un **poste précis**, jamais sur un mot : dans ses propres devis, « le
placo » vaut 48 €/m² en contre-cloison simple, 58 € en cloison isolée et 72 €
en faux plafond isolé. « Placo : 25 € » serait faux même anonyme.
