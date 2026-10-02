# Faire d'Opus une application qu'on croirait écrite par un vieux de la vieille

Demande du propriétaire, le 01/10/2026 :

> « parcourir toute l'application, tester toutes ses fonctionnalités, y
> ajouter un effet waouh de partout, et même voir les points que l'on
> pourrait pousser encore plus pour faire d'Opus une app qui soit très
> moderne et qui donne l'impression d'avoir été codée par un développeur
> senior chevronné. »

Ce document est la réponse. Il se lit dans l'ordre : d'abord ce qui a été
réellement fait pour le constater, ensuite les chiffres, ensuite le plan.

---

## 1. Comment l'application a été parcourue

**Au navigateur, écran par écran, 45 captures.** Pas une lecture de code :
l'application a été ouverte, les deux côtés essayés — professionnel et
particulier —, chaque onglet visité, chaque formulaire ouvert.

- Côté professionnel : accueil, fil vidéo, commentaires, Place des pros,
  recherche, fiche publique d'un artisan, demande de devis, publication,
  messagerie, conversation, notifications, profil, modification du profil,
  mes publications, organisation des réalisations, confidentialité, textes
  légaux.
- Côté particulier : accueil, Découvrir, SOS, messagerie, profil.
- Les gestes aussi : le glissement latéral du fil vidéo vers la page de
  l'artisan a été joué à la souris, et il fonctionne.

`captures/planche-opus.png` les rassemble toutes sur une seule planche.
C'est le meilleur point de départ pour pointer du doigt ce qui déplaît.

**Une seule erreur JavaScript** sur tout le parcours, et elle est sans
rapport avec le code : un certificat externe refusé par le conteneur.

> **Ce qui ne se vérifie pas ici, et qui doit être dit.** Le défilement au
> doigt (une zone défilante répond à la molette sur un ordinateur, pas au
> glissement), le vibreur, l'appareil photo, la lecture vidéo réelle — le
> navigateur de test n'a pas les codecs —, et les notifications poussées.
> Tout ce qui touche à ces quatre-là est annoncé comme non vérifié.

---

## 2. Ce que les chiffres disent

Relevés à la main sur le dépôt, et au navigateur avec le **processeur bridé
six fois** — parce que la machine de test est bien plus rapide qu'un iPhone,
et que c'est exactement ce qui avait laissé passer les 219 ms par lettre de
l'assistant IA le 29/09.

### Le toucher — c'était le plus gros trou

| | avant |
|---|---|
| zones appuyables dans `src/` | **106** |
| qui montraient qu'on les avait touchées | **0** |
| appels au vibreur dans toute l'application | **1** |
| `entering=` / `exiting=` / `layout=` | **0 / 0 / 0** |
| fichiers important Reanimated (installé, 4.5.1) | **2 sur 73** |

C'est précisément ce qui fait dire « ça ne réagit pas » d'une application
qui marche très bien : l'écran ne changeait qu'une fois l'action terminée,
donc le doigt doutait pendant tout le traitement.

**Corrigé le 01/10/2026** — c'est le lot 1 ci-dessous.

### La vitesse ressentie

Changement d'onglet, processeur bridé six fois :

| onglet | temps | nœuds montés |
|---|---|---|
| Accueil | 242 ms | 276 |
| Messages | 416 ms | 100 |
| Publier | 525 ms | 117 |
| **Place des pros** | **736 ms** | 301 |
| **Profil** | **835 ms** | 256 |

Frappe au clavier, même bridage :

| champ | ms par lettre |
|---|---|
| Place des pros, recherche | 66 |
| **Devis, description** | **129** |

Pour comparer : le champ qui était **inutilisable** en septembre coûtait
219 ms, et il est tombé à 26 ms une fois isolé. 129 ms, ce n'est donc pas
une panne, mais ce n'est pas net non plus. **À confirmer sur ton iPhone.**

### Les listes — le vrai risque à venir

| | nombre |
|---|---|
| `FlatList` dans toute l'application | **3** |
| boucles `.map()` dans des `ScrollView` | **43**, réparties sur 19 écrans |

Trois listes seulement sont virtualisées (le fil, le fil vidéo, le sélecteur
de métiers) — et celles-là sont bien réglées. Les autres montent **tout**
d'un coup : Place des pros et Demandes ont six boucles chacune, et chaque
carte monte ses photos. Avec sept annonces de démonstration, ça ne se voit
pas. Avec deux cents, c'est le défaut de septembre qui revient, en pire.

### Les échelles du thème

| valeur écrite à la main, hors `theme.js` | nombre | fichiers |
|---|---|---|
| `fontSize:` | 221 | 33 |
| espacements hors de la grille de 4 px | 356 | 45 |
| `lineHeight:` | 56 | 22 |
| `borderRadius:` | 20 | 13 |

Les plus en retard : `ProfilProScreen`, `ProfilEditScreen`, `PlaceProScreen`,
`SosScreen`, `CreerScreen`, `DemandesScreen`.

### Le contraste des couleurs

Calculé selon la règle WCAG, sur la palette de `theme.js` :

| | rapport | verdict |
|---|---|---|
| `ink` sur `bg` | 13,61 : 1 | bon |
| `accent2` sur `surface` | 9,27 : 1 | bon |
| `muted` sur `surface` | 5,09 : 1 | bon |
| `muted` sur `bg` | **4,01 : 1** | sous le seuil de 4,5 |
| blanc sur `accent` | **3,51 : 1** | gros texte seulement |
| `accent` sur `bg` | **2,76 : 1** | insuffisant |

Ce n'est pas une case à cocher : beaucoup d'artisans regardent leur
téléphone **en plein soleil, sur un chantier**. Le gris sur beige y
disparaît.

### Ce qui va déjà bien, et qu'il ne faut pas casser

Le relevé a aussi confirmé ce qui est tenu :

- les images passent **déjà** par `expo-image`, avec cache disque et fondu
  à l'arrivée ;
- les trois listes virtualisées sont réglées, avec le raisonnement écrit à
  côté ;
- `npm run verifier-acces` tient les étiquettes des 90 boutons : aucun
  n'est muet, et l'état passe par `aria-*` plutôt que par le texte ;
- le squelette de chargement du fil existe et bat correctement ;
- les erreurs sont rouges, avec un triangle, et restent neuf secondes ;
- quinze des seize scripts `npm run verifier-*` passent.

**Le seizième ne passe pas** : `npm run verifier-montage` s'arrête sur
`Cannot find module '.../src/lib/supabase'` — l'import sans extension
convient à l'application mais pas à Node. Un contrôle qui ne tourne plus
ne protège rien ; il est dans le plan.

---

## 3. Lot 1 — le socle du toucher ✅ fait le 01/10/2026

Livré avant même la fin de l'audit, parce que c'était le constat le plus
unanime et le moins risqué : un seul fichier de briques partagées corrige
toute l'application d'un coup.

**Ce qui a été posé :**

- `theme.js` gagne sa quatrième échelle — `M` (trois durées), `RESSORT` et
  `RESSORT_PORTE`, `APPUI` (`plein` pour ce qui a une forme propre,
  `discret` pour une icône ou une ligne). Les deux ressorts existants
  avaient divergé sans que personne ne le voie : 230 et 190 de raideur.
- **Les trois interdits** sont écrits noir sur blanc dans `theme.js` :
  jamais d'`entering` dans un `renderItem`, jamais d'animation sur un écran
  qui charge, jamais d'`exiting` sur une liste qu'on filtre. Le projet a
  déjà payé une fois dix éléments montés d'un coup.
- `src/lib/retour.js` porte la doctrine haptique en six fonctions. La règle
  tient en deux lignes : **on ne vibre pas pour ce qu'on voit déjà, on vibre
  pour ce qu'on ne regarde pas.**
- Les six briques de `ui.js` s'enfoncent sous le doigt.
- Les quatre actions du fil passent de 17 px à 36 px de haut, plus 8 px de
  marge de visée.
- Le bandeau de confirmation glisse depuis le haut et fait vibrer
  différemment selon réussite ou échec.

**Vérifié ici**, bouton maintenu enfoncé au navigateur : « Suivre » passe
de 1 à 0,72 d'opacité avec une échelle de 0,97 ; « J'aime » de 1 à 0,55 ;
retour à 1 au relâchement. Le bandeau : opacité 0,61 → 0,91 → 1,00 et
glissement −9,8 → −2,3 → 0 px en 110 ms. Zéro erreur JavaScript.
`npx expo export --platform android` passe. `npm run verifier-retour`
(nouveau) et les quatre autres contrôles clés sont au vert.

**Non vérifié ici** : le vibreur n'existe ni dans le navigateur ni dans le
conteneur. On a vérifié que les appels sont là, protégés, au bon endroit —
pas qu'ils se sentent bien dans la main. Seul l'iPhone le dira.

---

## 4. Comment l'audit a été mené

Onze lectures indépendantes du code, une par dimension, chacune tenue de
**prouver** ce qu'elle avance — fichier, ligne, et pour toute ABSENCE une
recherche sur tout `src/`. Les dimensions : les écrans d'entrée, les écrans
de profil, les écrans qui font gagner de l'argent, le mouvement, le retour
au doigt, les trois états, la performance, l'accessibilité, la cohérence
visuelle, l'architecture, la confiance. **109 constats.**

Une douzième lecture — les données et la robustesse — s'est bloquée sur une
requête à la base et n'a pas rendu son rapport. Ce qu'elle devait couvrir
est largement repris par « les trois états » et « la performance », mais
c'est un trou, et il est dit plutôt que caché.

Tout ce qui est repris ci-dessous a été **revérifié à la main** avant
d'entrer dans ce document. Deux constats ont d'ailleurs été écartés en
chemin : l'un affirmait que les images n'étaient pas mises en cache (faux,
`expo-image` est partout), l'autre que les boutons étaient muets pour les
lecteurs d'écran (faux aussi, `npm run verifier-acces` le tient).

---

## 5. Les cinq gestes qui changent tout

Dans l'ordre du rendement, pas de la difficulté.

### 1. Faire en sorte qu'une demande arrive vraiment chez l'artisan

**C'est le plus grave, et ce n'est pas un défaut d'apparence.** Vérifié
ligne à ligne :

```
quote_requests     → src/lib/api.js:923   un insert, et c'est tout
callback_requests  → src/lib/api.js:942   un insert, et c'est tout
sos_requests       → src/lib/api.js:1228  un insert, et c'est tout
```

Ces trois noms n'apparaissent **nulle part ailleurs** dans `src/`. Aucun
écran ne les lit. Aucun déclencheur de `schema.sql` ne crée de notification
pour elles — vérifié. Et pendant ce temps, `OpusApp.js:1552` affiche :

> « Dubreuil Plomberie **est prévenu**. Estimation 150–400 €. »

C'est faux. La base est pourtant prête : les règles de lecture existent déjà
(« lecture mes devis », « le pro traite le devis »). Il manque le
déclencheur et l'écran.

Deux minutes suffisent pour arrêter de mentir : « Votre demande est partie.
Vous serez rappelé dès qu'un artisan l'accepte. » Le reste est le lot 2.

### 2. Que tout ce sur quoi on appuie réponde — ✅ déjà fait

Le lot 1 ci-dessus. C'est le geste au meilleur rapport : un seul fichier de
briques partagées, et toute l'application change de sensation.

### 3. Ne plus monter toutes les listes d'un coup

43 boucles `.map()` dans des `ScrollView`, contre 3 `FlatList`. Avec sept
annonces de démonstration, invisible. Avec deux cents, c'est le blocage de
septembre qui revient — et cette fois sur l'écran où l'artisan cherche du
travail.

### 4. Rendre les boutons atteignables, et les textes lisibles dehors

11 cibles tactiles mesurées sur l'écran d'inscription : **11 sous 44
points**, la plus petite à 15. Et les bordures des champs tiennent à
1,65 : 1 de contraste. Un artisan en gants, en plein soleil, ne vise pas et
ne voit pas.

### 5. Donner du mouvement là où l'œil l'attend

Une transition entre les écrans, un entête de profil qui se replie, un cœur
qui réagit, une feuille qu'on peut tirer. **Après** les quatre précédents :
une animation posée sur une liste qui bloque aggrave le blocage.

---

## 6. Les lots, dans l'ordre

| n° | lot | effort | ce que tu verras changer |
|---|---|---|---|
| 1 | **Le socle du toucher** ✅ | petit | tout répond sous le doigt |
| 2 | Les demandes arrivent chez l'artisan | moyen | l'application tient enfin sa promesse |
| 3 | Les trois états : vide, en cours, cassé | moyen | plus rien ne reste muet |
| 4 | Les listes et la frappe | moyen | ça ne rame plus quand il y aura du monde |
| 5 | Les cibles et la lisibilité au soleil | moyen | utilisable en gants, dehors |
| 6 | Le mouvement visible | moyen | le « waouh » proprement dit |
| 7 | Une seule carte, une seule échelle | moyen | ça cesse de paraître assemblé |
| 8 | L'atelier | gros | ce qu'un senior voit en ouvrant le dépôt |

L'ordre n'est pas négociable sur un point : **le socle avant ce qui s'en
sert**. Le lot 6 (le mouvement) s'appuie sur l'échelle posée au lot 1, et il
serait dangereux avant le lot 4 (les listes). On ne recommencera pas trois
fois.

Le détail de chaque lot est dans la liste de tâches de la session, avec les
fichiers et les mesures.

---

## 7. Ce qu'on écarte, et pourquoi

- **Une bibliothèque d'animations tierce.** Reanimated est déjà installé et
  suffit. Une dépendance de plus, c'est un risque de devoir quitter Expo Go
  — le seul moyen d'essai aujourd'hui.
- **Tout arrondir pour faire moderne.** La règle des bords (vif = ce qui
  porte, arrondi = ce qui flotte) est juste et tenue à 90 %. C'est elle qui
  fait que l'application ressemble à Opus et pas à un gabarit.
- **Un mode sombre.** Beau sur une capture, mais il doublerait chaque
  couleur de `theme.js` alors que 221 tailles de police sont encore écrites
  à la main. À reposer une fois le lot 7 fait.
- **`react-navigation` tout de suite.** Il fonctionne dans Expo Go et
  apporterait vraiment quelque chose (transitions, bouton retour du
  téléphone, liens profonds). Mais c'est toute la navigation à refaire sur
  une application qui marche. À décider ensemble, pas à lancer.
- **Animer avant d'avoir virtualisé.** Écrit dans `theme.js` comme un
  interdit, parce que c'est le piège le plus tentant de tout ce document.

---

## 8. Ce qui ne se vérifiera que sur ton iPhone

Je le redis ici pour qu'on ne l'oublie pas en route :

- **le vibreur** — les appels sont là, protégés, au bon endroit ; qu'ils se
  sentent bien dans la main, seul le téléphone le dira ;
- **le défilement au doigt**, et l'arbitrage entre un glissement horizontal
  et un défilement vertical ;
- **la fluidité réelle** — les 736 ms et 835 ms mesurés ici le sont sur un
  processeur bridé six fois, ce qui est une imitation, pas une mesure ;
- **la lecture des vidéos** — le navigateur de test n'a pas les codecs ;
- **les notifications poussées**.

---

## 9. Lot 2 — les demandes arrivent chez l'artisan ✅ fait le 01/10/2026

Le constat du §5.1 est corrigé, et la correction est vérifiée **sur la vraie
base**, pas seulement en démonstration.

**Ce que la base fait maintenant** (section 24 de `schema.sql`, appliquée
pour de vrai le 01/10/2026) :

- `notifie_demande()` prévient l'artisan dès qu'un devis, un rappel ou une
  urgence arrive — et prévient **le client en retour** quand c'est accepté
  ou refusé. Un client qui attend devant un écran muet, c'est le même défaut
  vu de l'autre côté.
- `mes_demandes_recues()` rend une seule liste pour les trois origines : un
  artisan ne range pas sa journée par type de formulaire.
- `sos_requests` porte enfin un nom et un téléphone : une urgence sans
  numéro ne sert à rien.

**Ce que l'artisan voit** : un segment « Pour moi », **en premier** dans
Découvrir, parce qu'une demande nommément adressée passe avant une annonce
publique. Une urgence encore en attente remonte en tête — c'est la seule
demande qui se périme. Accepter, refuser, appeler, clore. Et une phrase qui
dit pourquoi accepter compte : c'est ce qui permet au client de laisser un
avis « client vérifié ».

**Ce que le client lit maintenant** : « Votre demande est partie à X. Vous
serez prévenu dès qu'il répond. » au lieu de « X est prévenu », qui était
faux.

### Vérifié de bout en bout sur la base du propriétaire

Deux comptes jetables, un devis réel, et tout supprimé après :

| étape | résultat |
|---|---|
| le client dépose un devis | `201` |
| l'artisan le voit par `mes_demandes_recues()` | `devis · Essai Client · 0611223344 · en_attente` |
| sa notification, écrite par la base | `[devis] Essai Client vous demande un devis` |
| l'artisan accepte | `204` |
| le client est prévenu en retour | `[devis_accepte] Essai Lot 2 a accepté votre demande` |
| le téléphone du COMPTE du client, lu par l'artisan | **`42501 permission denied`** |

Et sur PostgreSQL 16 en local : `schema.sql` rejoué deux fois sans erreur,
les trois déclencheurs posés, un passage en « terminé » qui ne notifie
personne (c'est voulu), et l'avis qui devient « client vérifié » tout seul
une fois le devis accepté.

### Ce qui t'attend déjà dans ta base

L'écran ne s'ouvrira pas vide : **trois demandes réelles y dorment**, deux
devis et un rappel, encore « en attente ». La plus ancienne date du
**15 septembre**.

---

## 10. Lot 3 — les quatre états ✅ fait le 01/10/2026

Vide, en cours, cassé — et le quatrième, celui qu'on oublie toujours : **sans
réseau**.

### Ce qui a changé

- **Le mode démonstration se voit.** Une bande noire permanente, avec la
  bande de chantier. `api.mode` valait `'demo'` depuis le début et n'était lu
  nulle part ; l'application répondait « Votre publication est en ligne »
  alors que rien n'était écrit.
- **Un échec ne s'affiche plus en vert.** Trois messages annonçaient un
  échec avec une coche de réussite.
- **Les erreurs parlent français** — `src/lib/erreurs.js` : le réseau, la
  session expirée, une contrainte refusée (avec renvoi à `schema.sql`), une
  règle RLS, un droit manquant. Et le motif technique n'est jamais jeté
  quand on ne sait pas traduire.
- **Sans réseau, l'application s'ouvre quand même**, avec une bande « Pas de
  connexion » et un bouton Réessayer.
- **Un message qui n'est pas parti se voit**, et se renvoie d'une touche.
- **La fiche d'un artisan n'annonce plus « Aucun avis » pendant qu'elle
  charge** : un squelette, puis la vérité.
- **Tirer pour rafraîchir** marche sur les cinq écrans défilants, plus
  seulement sur le fil.
- **Une photo qui ne charge pas** ne laisse plus un trou transparent.

### Deux défauts trouvés en le faisant, et invisibles autrement

**L'application restait figée pour toujours.** Session valide, base
injoignable : le squelette de démarrage battait doucement, sans fin. Un
`catch` ne protège de rien quand rien n'échoue — il ne se passe simplement
rien. Tout appel réseau du démarrage porte désormais un délai de 12 secondes.

**Le bandeau d'erreur avait perdu son fond.** Un composant animé ignore
silencieusement un style en forme de fonction : le texte blanc s'affichait
sur le fond beige. C'était une régression du lot 1, et elle touchait le seul
canal par lequel l'application parle. Vue en coupant le réseau, pas en
relisant le code.

### Vérifié en coupant la liaison pour de vrai

Un compte jetable créé sur la vraie base, le relais coupé, la page
rechargée — la situation exacte de l'artisan qui descend à la cave :

| | |
|---|---|
| renvoyé à « Choisissez votre profil » | **non** |
| bande « Pas de connexion » | **oui**, avec Réessayer |
| message d'erreur | « pas de connexion. Vérifiez votre réseau… » |
| navigation | utilisable |

Compte supprimé après l'essai. 17 contrôles `npm run verifier-*` au vert,
`npx expo export --platform android` passe.

---

## 11. Lot 4 — les listes et la frappe ✅ fait le 02/10/2026

### Les listes

Sept listes sont désormais virtualisées et réglées : le fil, les annonces,
les demandes, les conversations, les messages, les notifications, les
demandes reçues. Six composants de ligne sont mémorisés.

Mesuré en gonflant le jeu d'essai à **217 éléments** — le cas normal d'une
place de marché qui marche — et en comparant les deux versions côte à côte :

| nœuds montés d'un coup | avant | après |
|---|---|---|
| Place des pros | **5 939** | **317** (−95 %) |
| Demandes | **2 265** | **257** (−89 %) |

Le temps mesuré au navigateur n'a presque pas bougé, et c'est attendu : il a
le processeur d'un ordinateur. Ce que ces nombres prédisent, c'est le
comportement de l'iPhone — où 5 939 nœuds montés avec leurs photos, c'est
exactement le blocage de plusieurs secondes du 29 septembre.

### La frappe

| processeur bridé ×6 | avant | après |
|---|---|---|
| description d'une publication | **203 ms/lettre** | **60** |
| message dans une conversation | **132** | **48** |
| commentaire | **72** | **58** |

203 ms, c'était le niveau de l'assistant IA du 29/09 — « on ne peut pas
écrire dedans ».

La conversation passe en liste **inversée** : le dernier message arrive en
bas sans qu'on fasse défiler quoi que ce soit, et les anciens ne sont montés
que si on remonte les chercher.

### Vérifié

19 contrôles `npm run verifier-*` au vert (dont `verifier-listes`, nouveau),
le paquet Android se construit, zéro erreur JavaScript sur un parcours
complet — fil, place des pros, demandes, messages, conversation, envoi d'un
message, commentaires, publication.

---

## 12. Lot 5 — viser avec un gant, lire au soleil ✅ fait le 02/10/2026

### Les cibles

| boîte réelle, mesurée sur cinq écrans | avant | après |
|---|---|---|
| cibles sous 44 points | **70 / 71** | **32 / 66** |
| la plus petite | **14 px** | **32 px** |
| mon profil | 7 / 7 sous 44 | **0 / 7** |

Les 32 qui restent sous 44 **à l'écran** y arrivent par `hitSlop`, calculé
par `viser()` à partir de leur hauteur réelle. Et il faut le dire :
`react-native-web` ignore `hitSlop`, donc **cette partie-là ne se mesure pas
au navigateur** — seul l'iPhone le confirmera.

### Les couleurs

| | avant | après |
|---|---|---|
| bordure d'un champ, sur blanc | 1,65 : 1 | **3,85** |
| texte secondaire sur le fond | 4,01 | **4,51** |
| texte orange sur le fond | 2,76 | **4,52** |

L'orange de signature **#E85C1F n'a pas bougé** : il reste la couleur de ce
qu'on remplit. C'est un second ton, **#B14212**, exactement la même teinte
assombrie, qui sert quand l'orange est du TEXTE.

`npm run verifier-cibles` recalcule tous ces contrastes à chaque passage.

### Le reste

Un œil sur le mot de passe, le trousseau du téléphone enfin prévenu, le
clavier qui enchaîne les champs, les erreurs annoncées à voix haute pour
VoiceOver (sur iPhone, elles ne l'étaient pas du tout), et « Réduire les
animations » respecté.

### Une chose qui reste à TON arbitrage

Le texte blanc sur un bouton orange donne **3,51 : 1**, là où il en faudrait
4,5. Trois issues, chiffrées :

| | contraste | ce que ça change |
|---|---|---|
| laisser tel quel | 3,51 | rien — mais ça reste dur à lire dehors |
| texte **noir** sur l'orange | **4,92** | l'orange reste exact, les boutons changent d'allure |
| foncer l'orange à #CC4C15 | **4,55** | le blanc reste, la signature bouge un peu |

Je n'ai rien touché : c'est ta couleur, et aucune de ces options n'est
neutre. Dis-moi.
