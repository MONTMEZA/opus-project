# Le compte Apple Developer — ce que c'est, ce que ça coûte, et comment le faire

Écrit le 02/10/2026, au moment où les huit lots de l'audit sont finis et où
la suite du projet — les **notifications push** — ne peut plus avancer sans
lui.

Tout ce qui est écrit ici a été vérifié le 02/10/2026 sur les pages d'Apple
et d'Expo, pas de mémoire. Les liens sont en bas.

---

## 1. Pourquoi maintenant, et pas plus tôt

Jusqu'à aujourd'hui, Opus se testait dans **Expo Go** : une application
gratuite de l'App Store qui sait faire tourner un projet Expo sans rien
installer ni signer. C'est ce qui vous a permis de tout essayer sur votre
iPhone sans Mac et sans payer un centime. C'était le bon choix, et il faut
le garder le plus longtemps possible.

Mais une chose ne marche pas dans Expo Go, et c'est précisément la
suivante sur la liste :

> **Depuis le SDK 53, Expo Go ne reçoit plus les notifications push.**
> Avant, Expo prêtait ses propres identifiants Apple à tout le monde ; cette
> facilité a été retirée. Pour qu'une notification arrive sur l'écran
> verrouillé, il faut une application **signée avec VOS identifiants** — donc
> un *development build*, donc un compte Apple Developer.

Et il n'y a **aucun contournement**, j'ai cherché :

- installer sur un vrai iPhone demande un profil de provisionnement, qui
  demande un compte payant — la documentation d'Expo le dit en une phrase :
  « This method requires a paid Apple Developer account » ;
- la seule astuce qui circule (emprunter les identifiants de quelqu'un
  d'autre) suppose un **Mac avec Xcode** *et* un collègue déjà abonné. Vous
  n'avez ni l'un ni l'autre ;
- côté Android, les notifications sont gratuites (Google FCM). Mais vous
  testez sur iPhone.

Donc : 99 € par an, ou pas de notifications. C'est aussi simple que ça, et
je préfère vous le dire sans tourner autour.

### Ce que l'abonnement débloque vraiment

| | sans compte | avec le compte |
|---|---|---|
| tester dans Expo Go | ✅ | ✅ (ça continue) |
| notifications push sur iPhone | ❌ | ✅ |
| installer Opus comme une vraie app sur votre iPhone | ❌ | ✅ |
| faire essayer Opus à quelqu'un d'autre (TestFlight) | ❌ | ✅ |
| publier sur l'App Store | ❌ | ✅ |
| modules natifs (montage vidéo, etc.) | ❌ | ✅ |

La troisième ligne compte autant que la première : aujourd'hui, pour voir
Opus, il faut ouvrir Expo Go et scanner un code. Avec le compte, Opus a son
icône sur votre écran d'accueil et s'ouvre comme n'importe quelle
application. C'est à ce moment-là que le projet cesse de ressembler à un
chantier.

---

## 2. Ce que ça change dans votre façon de travailler — lisez ce point

C'est la vraie dépense, et elle n'est pas en euros.

**Ce qui NE change pas** : Expo Go reste installé sur votre iPhone, et le
*development build* est une application **de plus**, pas un remplacement.
Vos modifications de code JavaScript — c'est-à-dire 95 % de ce qu'on fait
ensemble — continuent de se recharger en quelques secondes, exactement comme
aujourd'hui.

**Ce qui change** : chaque fois qu'on ajoute un **module natif** (les
notifications, un éditeur vidéo, un lecteur de code-barres…), il faut
**reconstruire** l'application dans le nuage. Ça prend 10 à 20 minutes, et
il faut réinstaller le résultat sur l'iPhone. On ne le fait pas tous les
jours, mais quand ça arrive, ce n'est plus instantané.

**Un délai à connaître d'avance** : la première fois, Apple met **24 à
72 heures** à enregistrer votre iPhone dans la liste des appareils
autorisés. Avant ça, l'installation échoue — et ce n'est pas une panne.

---

## 3. « Individual », et surtout PAS « Organization »

Au moment de l'inscription, Apple demande un **type d'entité**. Deux choix,
et un seul vous est ouvert aujourd'hui :

- **Individual / Sole Proprietor** → c'est le vôtre. Il demande une pièce
  d'identité, et rien d'autre.
- **Organization** → demande une **société reconnue comme personne morale**
  et un **numéro D-U-N-S**. Vous n'avez ni société ni SIRET (c'est écrit
  dans `src/data/legal.js`, `STATUT = 'essai'`). Ce choix vous serait
  refusé.

### ⚠️ La conséquence, et le geste à NE PAS faire tout de suite

Apple l'écrit noir sur blanc :

> « If you're enrolled as an individual, this option isn't available to you
> and **the developer name is the same as your legal name**. »

Autrement dit : sur l'App Store, le vendeur d'Opus s'appellerait **Dylan
Montmeza**, pas « Opus ». Pour afficher un nom commercial, il faut être
inscrit en tant qu'**organisation** — donc avoir une société.

Et la phrase suivante de la même page d'Apple est celle qui compte :

> « You can set your developer name **only when adding an app to your
> account for the first time**. You **can't edit or update this name
> later**. »

> **Donc : inscrivez-vous maintenant (il le faut pour les notifications),
> mais NE CRÉEZ PAS encore la fiche de l'application dans App Store
> Connect.** Le nom public se décide une seule fois, pour toujours. On le
> décidera quand l'ouverture au public approchera — c'est exactement le
> moment où `legal.js` passera de `essai` à `micro`, et où la question « sous
> quel nom Opus est-il publié ? » se posera pour de bon.
>
> Pour construire et installer Opus sur VOTRE iPhone, aucune fiche App Store
> Connect n'est nécessaire. Seul l'abonnement l'est.

---

## 4. À préparer AVANT de commencer (cinq minutes)

Le chemin le plus simple pour vous passe par l'application **Apple
Developer** sur votre iPhone : c'est elle qui fait la vérification
d'identité, en photographiant votre pièce d'identité. Pas de Mac, pas de
PowerShell, pas de navigateur.

Vérifiez ces six points avant de lancer quoi que ce soit — chacun bloque
l'inscription s'il manque, et certains la font **recommencer** :

- [ ] **La double authentification est active** sur votre compte Apple.
      (Réglages → votre nom → Connexion et sécurité.) C'est obligatoire,
      sans exception.
- [ ] **Votre nom dans le compte Apple est votre nom LÉGAL**, celui de votre
      pièce d'identité — pas un surnom, pas « Opus ». Si les deux ne
      correspondent pas, la vérification est rejetée ou traîne. Corrigez-le
      avant, pas après.
- [ ] **L'adresse et le numéro de téléphone du compte Apple sont à jour**,
      ainsi que le numéro de téléphone de confiance.
- [ ] **L'iPhone a un code, Face ID ou Touch ID activé**, et il est connecté
      à **iCloud**. Apple s'en sert pour attester que c'est bien vous.
- [ ] **Une carte bancaire est liée au compte Apple.** ⚠️ Le solde du
      compte Apple et les cartes cadeaux **ne sont pas acceptés** pour cet
      abonnement.
- [ ] **Votre passeport ou votre permis de conduire** sous la main, en bon
      état, lisible.

Et **faites toute l'inscription sur le MÊME appareil**, du début à la fin.
Changer d'appareil en cours de route oblige à repartir de zéro.

---

## 5. Les étapes, une par une

1. **App Store → cherchez « Apple Developer »** → installez-la (elle est
   gratuite) ou mettez-la à jour si vous l'avez déjà.
2. Ouvrez-la → onglet **Account** (en bas) → connectez-vous avec votre
   compte Apple.
3. Si on vous présente l'**Apple Developer Agreement**, lisez et touchez
   **Agree**.
4. Touchez **Enroll Now** → l'écran liste ce que le programme apporte →
   **Continue**.
5. **Vos informations** : prénom légal, nom légal, téléphone. Relisez-les
   deux fois — c'est le point qui fait traîner les dossiers.
6. **Vérification d'identité** : photographiez votre **passeport** ou votre
   **permis de conduire**, comme l'application le demande.
   *Ce qu'Apple fait de cette photo* : elle sert uniquement à vérifier
   l'identité et à lutter contre la fraude, elle peut passer par un
   prestataire de vérification, et **Apple ne conserve pas l'image**.
7. Relisez le récapitulatif → **Continue**.
8. **Type d'entité : « Individual »** (voir la section 3 — c'est le seul qui
   vous soit ouvert, et ce n'est pas un choix anodin).
9. Lisez et acceptez l'**Apple Developer Program License Agreement**.
10. **Abonnement** : l'écran affiche le prix avant toute validation —
    **99 € par an** en France. Touchez **Subscribe**, puis payez avec votre
    carte.
11. Vous recevez un reçu par courriel. (Il se renvoie depuis Réglages →
    Historique des achats.)

### Après avoir payé

- Apple **examine le dossier**. Comptez généralement 24 à 48 heures ; ça peut
  être plus long si un nom ne correspond pas exactement à la pièce
  d'identité. Vous recevez un courriel.
- **C'est un abonnement à renouvellement automatique annuel.** Il
  s'interrompt dans Réglages, jusqu'à un jour avant la date de
  renouvellement. ⚠️ **Les frais ne sont pas remboursables** si vous
  résiliez en cours d'année.
- Mettez-vous un rappel pour dans **onze mois**. Un compte qui expire
  invalide les profils de signature, et une application installée cesse de
  s'ouvrir. Ça surprend tout le monde une fois.

**Dites-moi quand le courriel d'Apple est arrivé.** C'est à partir de là que
je peux préparer la suite.

---

## 6. Ce que vous ne me donnerez JAMAIS, et ce que vous me donnerez

C'est la première règle du projet, appliquée à Apple :
*« Les secrets ne vivent jamais dans l'application. »*

> **Votre mot de passe Apple ne me sert à rien et ne doit jamais sortir de
> chez vous.** De toute façon, la double authentification le rend inutile à
> distance : Apple envoie un code sur VOTRE téléphone.

Ce dont j'aurai besoin, le moment venu, c'est d'une **clé d'API App Store
Connect** : un fichier `.p8` que vous générez vous-même dans
App Store Connect → *Users and Access* → *Integrations*, avec le rôle
*App Manager*. Ses trois avantages, et ils sont décisifs :

1. elle fonctionne **sans vous demander un code à chaque fois** ;
2. elle se **révoque d'un bouton**, sans toucher à votre mot de passe ;
3. elle ne donne accès **qu'à** ce qui concerne les applications — jamais à
   votre compte Apple personnel, vos achats ou vos appareils.

⚠️ **Ce fichier `.p8` ne se met jamais dans le dépôt.** Même règle que
`.env` : `npm run verifier-atelier` refuse déjà qu'un secret y entre, et il
le refusera pour celui-là aussi.

Et là où c'est VOTRE compte Apple qui doit se connecter, c'est **vous** qui
lancerez la commande, dans votre PowerShell, avec le code reçu sur votre
iPhone. Je ne peux pas le faire d'ici, et c'est très bien ainsi.

---

## 7. Ce qui se passe ensuite, de mon côté

Dès que le compte est actif, voici ce que je prépare — vous n'aurez que des
commandes à coller, et je les écrirai pour PowerShell :

1. `expo-notifications` installé **et déclaré dans `app.json`**. Ce second
   point est un piège connu : sans le greffon dans `plugins`, la
   construction iOS part **sans les autorisations APNs**, et les
   notifications ne marchent pas — sans aucune erreur pour l'expliquer.
2. `eas.json` avec un profil `development`, et la clé d'API en secret EAS
   plutôt qu'en clair.
3. `eas device:create` pour enregistrer l'identifiant (UDID) de votre
   iPhone. ⚠️ C'est ici qu'Apple prend **24 à 72 heures**. *(Au passage :
   la distribution interne est limitée à 100 iPhones par an. Largement
   assez.)*
4. La construction dans le nuage, puis un **code QR** à scanner avec
   l'iPhone pour installer Opus.
5. Le branchement des notifications sur la table `notifications`, qui est
   **déjà alimentée par des déclencheurs** depuis la section 24 de
   `schema.sql`. Le travail côté base est fait ; il ne manque que le
   dernier mètre.

---

## 8. Ce que je n'ai PAS pu vérifier d'ici

À dire, parce que c'est la règle du projet :

- **Je n'ai ni iPhone, ni compte Apple, ni accès à l'App Store dans ce
  conteneur.** Je n'ai donc pas pu parcourir l'application Apple Developer
  moi-même. Les étapes ci-dessus viennent des pages d'aide officielles
  d'Apple, lues le 02/10/2026 — pas d'un essai.
- **Le prix de 99 € par an** est celui annoncé pour la France. Le montant
  exact, taxes comprises, s'affiche sur l'écran de paiement **avant** toute
  validation : c'est lui qui fait foi, pas ce document.
- Les écrans d'Apple changent de temps en temps. Si un libellé ne
  correspond pas à ce qui est écrit ici, **arrêtez-vous et montrez-moi**
  plutôt que de deviner.

---

## Les sources, lues le 02/10/2026

- [Enrolling, verifying, and renewing with the Apple Developer app](https://developer.apple.com/help/account/membership/enrolling-in-the-app/) — les étapes, les prérequis, la pièce d'identité, le refus du solde Apple
- [Enrollment — Membership — Apple Developer](https://developer.apple.com/help/account/membership/program-enrollment/) — Individual contre Organization, le D-U-N-S
- [Set your developer name — App Store Connect Help](https://www.developer.apple.com/help/app-store-connect/create-an-app-record/set-your-developer-name) — le nom public, fixé une seule fois
- [Become a member — Apple Developer Program](https://developer.apple.com/programs/enroll/) — l'abonnement annuel
- [Internal distribution — Expo](https://docs.expo.dev/build/internal-distribution/) — « requires a paid Apple Developer account », les UDID, les 100 appareils, les 24–72 h
- [Push notifications FAQ — Expo](https://docs.expo.dev/push-notifications/faq/) — Expo Go ne fait plus les notifications depuis le SDK 53
- [Submit to the Apple App Store with EAS Submit — Expo](https://docs.expo.dev/submit/ios/) — la clé d'API App Store Connect plutôt que le mot de passe
