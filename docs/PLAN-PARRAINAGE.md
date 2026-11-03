# Le parrainage dans Opus — PLAN (version 3, 03/11/2026)

> **Version 3, du 03/11/2026. RIEN N'EST CONSTRUIT** : aucune ligne de code,
> aucune table, aucune écriture dans Supabase. Vous l'avez demandé ainsi :
> « Avant de coder, propose-moi un plan et attends mon accord. »
>
> **Vos réponses aux quatre questions, le 03/11/2026** (les quatre
> recommandations) : construire **après le lot 5 du devis** ; la page
> d'accueil **dans le dépôt d'Opus** ; une entreprise retirée ou transférée
> par l'administration **cesse de compter** ; un filleul qui supprime son
> compte **sort du décompte sans laisser de trace**. Rien ne se construit
> avant la fin du devis ; les questions Q5 à Q19 attendent leur moment (§7).
>
> **Ce qui a changé depuis la version 2.** Elle a été relue par quatre
> relecteurs (la base, le droit, le téléphone et le site, la cohérence) :
> 68 remarques, chacune contre-examinée, puis 165 corrections arbitrées.
>
> - **deux temps au lieu d'un** : R1 construit la base seule, sans rien de
>   visible ; R2 livre ENSEMBLE la page `/i/CODE`, la liste d'attente,
>   l'écran « Inviter », le champ à l'inscription et leurs textes. Le bouton
>   ne sort jamais avant une page qui répond ;
> - **quatre règles que la v2 tranchait seule vous reviennent** : une
>   entreprise retirée par l'administration, un filleul qui part, un blocage,
>   les mots à l'écran. Vos mots (« parrainage », « code de parrainage ») sont
>   gardés par défaut ;
> - **le signe de contrôle change de méthode** (Damm au lieu de Luhn, qui
>   laissait passer certaines inversions de deux signes voisins) ;
> - **le délai de 7 jours** part de la confirmation de l'adresse, plus de la
>   création du compte ;
> - **des affirmations fausses sont corrigées** : un bouton « Copier » ne
>   demande pas forcément de reconstruction ; les données d'inscription SONT
>   dans l'export depuis le 02/11 ; le lien d'aujourd'hui tombe en 404 ; un
>   avoir n'échappe pas à la loi sur la « boule de neige » ;
> - **le droit de la page publique est précisé** : article 1-1 de la LCEN,
>   deux réglages d'e-mail distincts, ce que la page doit dire au moment où
>   l'adresse est donnée ;
> - **les autres questions sont rangées** selon le moment où il faudra les
>   trancher (§7).

---

## En bref

**Ce qu'Opus fera.**
- Chaque compte, pro ou particulier, a un **code de parrainage**, fabriqué
  par la base la première fois qu'il ouvre « Inviter ».
- « Inviter un collègue » (« Inviter un artisan » pour un particulier) ouvre
  le **menu de partage du téléphone** : un message court, le code et le lien
  `opus-project.com/i/CODE`. **Vous choisissez l'application, vous envoyez.**
- La personne invitée tape le code (ou colle le lien) à l'inscription, ou
  l'ajoute dans les 7 jours.
- Un filleul **compte** quand son compte porte une entreprise active trouvée
  au répertoire Sirene (INSEE). Vous voyez le nombre de vos filleuls, et le
  nom de fiche de ceux qui comptent.
- Avant le lancement, la page `/i/CODE` inscrit la personne invitée sur une
  **liste d'attente**, avec le même code : ces parrainages sont gardés.

**Ce qu'Opus ne fera jamais.** Lire vos contacts ou votre presse-papiers ;
envoyer une invitation à votre place ; compter les messages envoyés ou les
ouvertures d'un lien ; afficher un montant, un palier ou « gagnez » sans
règlement relu par un juriste ; nommer le parrain sur la page publique ;
redonner un code à quelqu'un d'autre ; laisser un code empêcher une
inscription.

**Dans quel ordre.** Le devis d'abord, jusqu'au lot 5. Puis **R1** (la base,
rien de visible), **R2** (tout ce qui se voit, ensemble), et plus tard **R3**
(les liens qui ouvrent l'application, avec la première version publiée sur
les magasins et le QR professionnel).

**Ce qui doit exister avant R2** (la page sera la première collecte publique
d'Opus) : (1) l'**éditeur** choisi et publié — vous, votre SARL ou la future
société ; (2) une **boîte aux lettres** sur `opus-project.com`, créée et
relevée ; (3) un **fournisseur d'envoi d'e-mails** ; (4) les **textes de la
page** — mentions légales, et l'information sous le formulaire ; (5) un
**hébergement** qui accepte une règle de réécriture — aujourd'hui `/i/CODE`
tombe en 404 ; (6) le **plan Supabase** décidé — un projet gratuit peut être
mis en pause, et Opus avec lui. Avec R2 aussi : le **registre des
traitements** du responsable, à créer (A.4). Et avant d'ouvrir au public :
la **confirmation par e-mail** des comptes, activée.

**Les quatre questions à vous poser maintenant** (les autres attendent, §7) :

- **Q1. Quand construire le parrainage ?** Recommandé : **après le lot 5 du
  devis**. Pourquoi : le devis est votre priorité, et rien du parrainage ne
  sert avant la page d'accueil. Si vous voulez la page plus tôt, R1 puis R2
  peuvent passer avant, sur votre seule décision.
- **Q2. Où vivra la page d'accueil ?** Recommandé : **dans le dépôt
  d'Opus** (un dossier `site/`), ses textes fabriqués depuis ceux de
  l'application. Pourquoi : c'est la seule façon qu'un contrôle relise ce
  qu'elle promet. Et tant que la liste d'attente d'Opus n'existe pas (R2),
  **aucune page**, faite ici ou ailleurs, **ne propose de code** : un outil
  extérieur fabriquerait les siens, qui ne seraient pas ceux d'Opus.
- **Q3. L'administration retire ou transfère l'entreprise d'un filleul** (il
  avait tapé le SIRET d'un autre, par exemple) : reste-t-il compté ?
  Recommandé : **non, il cesse de compter**. Pourquoi : sinon la même
  entreprise peut compter pour deux parrains à la fois. Le prix : le parrain
  voit un nom quitter sa liste ; les textes le disent au filleul.
- **Q4. Un filleul supprime son compte** : sort-il du décompte, sans laisser
  de trace ? Recommandé : **oui**. Pourquoi : rien n'est dû aujourd'hui, et
  garder le SIREN d'un entrepreneur individuel parti, c'est garder une
  donnée personnelle sans usage. Le prix : le jour des récompenses, une
  entreprise partie puis revenue avec un autre code ne sera pas reconnue
  pour les parrainages d'avant.

**Vos réponses, le 03/11/2026 : les quatre recommandations.** Q1 — après le
lot 5 du devis ; Q2 — dans le dépôt d'Opus ; Q3 — il cesse de compter ; Q4 —
oui, sans laisser de trace.

Q3 et Q4 décident de la forme de la base : elles doivent être tranchées
avant d'en écrire le cahier.

---

## Votre demande, et vos réponses

Votre demande du 03/11/2026, pour l'essentiel :

- chaque pro a un code personnel et un lien (`opus-project.com/i/CODE`) ;
- un bouton « Inviter un collègue » ouvre le menu de partage du téléphone,
  avec un message court et le lien : **c'est l'artisan qui choisit
  l'application et qui envoie** ;
- **ne jamais lire les contacts du téléphone, ne jamais envoyer d'invitation
  automatiquement** ;
- à l'inscription, le code du parrain est enregistré ;
- le code est le même que celui de la future liste d'attente de la page
  d'accueil, pour garder les parrainages faits avant le lancement ;
- **aucune récompense chiffrée affichée** : les paliers seront décidés après
  la création de la société ;
- chaque écriture vérifiée pour de vrai dans Supabase.

Vos réponses du même jour :

1. la liste d'attente n'existe pas encore → **Opus fabrique les codes**, la
   page d'accueil reprendra les mêmes ;
2. un filleul compte dès que **son entreprise est trouvée au répertoire
   Sirene** (pas besoin du badge) ;
3. **tout le monde** peut inviter (pros et particuliers) ; seul un filleul pro
   avec son entreprise compte ;
4. le parrain voit **le nombre et les noms d'entreprise** de ses filleuls.

Relevé avant d'écrire : rien de tout cela n'existe, ni dans le dépôt ni dans
la vraie base (requête sur la FORME seulement). Aucun lien `https` n'ouvre
l'application aujourd'hui (`app.json` n'a ni `associatedDomains` ni
`intentFilters`) ; seuls existent les schémas `com.opusproject.app` (sur
iPhone) et `exp+opus-project` (le build de développement).

---

## 1. Le code

- **Un code par compte**, pro ou particulier, **fabriqué par la base**,
  jamais par le téléphone. Il naît la première fois qu'on ouvre « Inviter »
  (R2), pas à l'inscription : rien de ce qui touche au parrainage ne peut
  faire échouer la création d'un compte. Une seule fonction de la base
  fabrique tous les codes — ceux des comptes et ceux de la liste d'attente —,
  pour qu'ils sortent du même tirage.
- **7 signes : 6 tirés au hasard et 1 signe de contrôle**, dans un alphabet
  de **30 signes** sans ceux qu'on confond (`2-9`, et `A-Z` sans `I`, `L`,
  `O`, `U`) : environ **729 millions** de codes. Affiché en deux groupes :
  **`K7P-Q4MB`**. C'est un **exemple de forme** : son dernier signe sera
  recalculé en R1 avec la méthode retenue (A.1), et l'exemple sera alors le
  même partout.
- **Pourquoi un signe de contrôle**, comme la clé d'un SIRET : une faute de
  frappe se voit sur le téléphone, avant l'envoi ; et une faute sur un
  signe, ou deux signes voisins inversés, ne peut jamais tomber sur le code
  d'un AUTRE parrain (deux fautes le peuvent, rarement) — ce qui compte,
  puisqu'un parrain posé ne change plus.
- **À la saisie**, tout se fait sur le téléphone, sans rien demander à la
  base :
  - les minuscules, les espaces, les points, les tirets, les soulignés et les
    barres obliques ne comptent pas (la règle déjà appliquée au SIRET) ;
  - un `O`, un `0`, un `I`, un `1`, un `L` ou un `U` est signalé tout de
    suite : « un code Opus n'a pas de O, 0, I, 1, L ni U » ;
  - une longueur fausse aussi : « il faut 7 signes » ;
  - une faute qui reste dans l'alphabet l'est grâce au signe de contrôle :
    « ce code contient une faute de frappe ».

  Seule la FORME est vérifiée, jamais l'existence du code : ce n'est pas un
  moyen d'essayer des codes. Un code bien formé mais inconnu n'empêche pas
  l'inscription (§2). Après l'inscription, en revanche, Opus dit si le code
  est reconnu : c'est une réponse sur l'existence du code, mais donnée
  seulement à un compte connecté, dans la limite des essais comptés (5 par
  24 h), et sans jamais dire à qui il appartient. Avec 729 millions de codes
  possibles, chercher au hasard est vain.
- **Il n'est jamais redonné à quelqu'un d'autre**, même après la suppression
  du compte : un code qui circule encore dans de vieux messages ne doit pas
  mener à une autre personne. Il ne reste alors que le code et sa date, sans
  compte. C'est **plus strict qu'un SIREN**, qu'une suppression ordinaire
  libère (seul un retrait par l'administration le réserve) : c'est un choix.
  Un code gardé seul, tiré au hasard, ne désigne plus personne.
- **Il ne change pas, sauf dans UN cas, en R2, et seulement tant qu'il n'a
  servi à personne** (aucun filleul inscrit avec lui) : une personne de la
  liste d'attente qui a reçu un code de compte AVANT que son adresse soit
  prouvée (§4) voit ce code remplacé par celui de sa liste. Sans ce cas,
  elle perdrait le code de sa liste, et les filleuls qui vont avec. Le code
  remplacé est libéré, comme celui d'un compte parti : s'il a déjà été
  envoyé dans un message, ce message mène à « code non reconnu », et l'écran
  du passage le dit. Un code qui a servi, lui, ne change jamais.
- **Un code dont le compte est parti n'accepte plus aucun filleul**, avec la
  même réponse qu'un code inconnu ; la personne qui l'a tapé garde le droit
  d'en poser un autre.

---

## 2. Ce que verra l'artisan (R2)

### Où est le bouton

- **Pour un pro** : une rangée « Inviter un collègue » sous « Mes
  partenaires », pas parmi les outils de travail (Mes publications, Mes
  clients, Mes devis…). Et dans « + Ajouter » des partenaires, quand la liste
  est vide ou à sa suite : « Il n'est pas sur Opus ? Invitez-le » — ce qui
  répare au passage la liste vide d'aujourd'hui, qui n'affiche aucun message.
- **Pour un particulier** : une rangée « Inviter un artisan » sous « Modifier
  mon profil ».
- Le bouton ouvre un **petit écran**, et **c'est un écart avec votre
  demande** : vous vouliez qu'il ouvre directement le menu de partage. Je le
  propose parce que le nombre et les noms de vos filleuls doivent s'afficher
  quelque part ; vous pouvez préférer l'autre forme (Q11).

### L'écran « Inviter »

- le code en grand (`K7P-Q4MB`), sélectionnable, avec une étiquette pour
  VoiceOver qui l'épelle (« Votre code : K, 7, P, Q, 4, M, B ») : l'alphabet
  garde A, E et Y, donc certains codes se liraient comme des mots ;
- trois états pour le code, qui se lit (ou naît) dans la base : chargement,
  « Lecture impossible » avec « Réessayer », prêt. **« Partager »**, le
  bouton principal, n'est actif que lorsque le code est prêt : sans code, il
  n'y a rien à partager ;
- **« Partager »** ouvre le menu de partage du téléphone (SMS, WhatsApp,
  e-mail…) : rien ne part sans que vous choisissiez ;
- le décompte : **« 3 entreprises inscrites avec votre code »**, avec leurs
  noms de fiche, et **« 1 personne inscrite avec votre code, sans entreprise
  pour l'instant »**, sans nom. Pendant le chargement, jamais « 0 » : un
  travail qui n'a pas pu se faire ne doit pas ressembler à un travail fait.
  **Aucune date** par filleul : on ne montre que ce qui sert ;
- **aucun montant, aucun palier, aucune barre de progression.**

**Copier le code.** Le code s'affiche seul, en texte sélectionnable : un
appui long, puis « Copier », copie le code et lui seul. Le « Copier » du menu
de partage, lui, copie le message ENTIER (phrase, code et lien) : ce n'est
pas un « Copier le code ». Un vrai bouton est possible de deux façons, à
choisir (Q13). Si un bouton est ajouté, Opus **écrit** le code dans le
presse-papiers ; dans tous les cas, il ne le **lit** jamais.

### Le message proposé

Modifiable dans l'application que vous choisissez, sans tutoiement ni
vouvoiement, sans promesse :

> Opus, l'application des pros du bâtiment. Code de parrainage : K7P-Q4MB
> https://opus-project.com/i/K7PQ4MB

« Code de parrainage » suit le mot retenu à Q10 (vos mots, par défaut) ; le
nom « Opus » est posé à Q14, le ton à Q12.

L'adresse est toujours **seule sur la dernière ligne**, et le code est aussi
dans le texte : si une application ne garde que l'adresse, la page
`/i/CODE` montre le code ; si elle ne garde que le texte, il contient les
deux. D'après le code de React Native — ce n'est pas mesuré —, Android
ignore une adresse passée À PART du message, et l'iPhone peut l'envoyer deux
fois. Quelle forme garde le lien UNE fois et le code dans WhatsApp,
Messages, Messenger et Mail ne se juge qu'au doigt, sur l'iPhone (A.2).

**Opus ne sait pas si le message est parti, et ne le compte pas.** C'est
important pour deux raisons. Opus ne reçoit jamais les coordonnées de la
personne invitée, et c'est ce qui le tient hors du régime du parrainage tel
que la CNIL le définit (« demander à une personne de renseigner les
coordonnées d'un tiers », fiche d'octobre 2016) — c'est une lecture de cette
définition : la CNIL n'a rien écrit sur un message que l'utilisateur envoie
lui-même. Et compter les partages serait faux : sur Android, le téléphone
répond toujours « partagé », que le message soit parti ou non. Une
récompense par message envoyé est donc impossible, pas seulement imprudente.

### À l'inscription

- une ligne repliée **« J'ai un code de parrainage »** (vos mots, Q10), qui
  déplie un champ **facultatif** — pour un particulier, pour un pro après
  « Oui, c'est mon entreprise », et dans la porte de secours ; jamais à la
  connexion ;
- on peut y **coller le lien ou le message entier** : Opus en tire le code et
  l'affiche remis en forme ;
- sous le champ :

  > Facultatif. La personne dont c'est le code verra que vous vous êtes
  > inscrit et, une fois votre entreprise rattachée à votre compte, le nom
  > de votre entreprise tel qu'il s'affiche sur votre fiche ; sinon,
  > seulement qu'une personne s'est inscrite.

  Cette phrase est une bonne pratique, pas une obligation : la loi est
  satisfaite si la politique de confidentialité, acceptée à l'inscription,
  nomme le parrain parmi ceux qui voient ces données (A.4). On la met quand
  même, parce que c'est au moment de taper le code qu'on décide. Si la règle
  de ce qui « compte » change (Q3, Q5), la phrase suit.
- **Un code inconnu n'empêche jamais l'inscription** : le compte est créé,
  et Opus dit une fois « code non reconnu », avec la possibilité de le
  corriger. Proposé (Q8) : le code part juste APRÈS la création du compte,
  par une fonction à part ; ainsi une inscription ne peut jamais échouer à
  cause d'un code (pourquoi, et ce que ça coûte : Q8 et A.2). Si la
  confirmation par e-mail est activée un jour, c'est à la première connexion
  qu'Opus le dit.

### « Le code de mon parrain »

- **Pendant 7 jours après la confirmation de son adresse** — aujourd'hui,
  c'est la création du compte, puisque la confirmation par e-mail est coupée
  —, quelqu'un qui a oublié son code, ou dont le code n'a pas été reconnu,
  peut l'ajouter, tant qu'aucun parrain n'est enregistré : **une seule pose
  réussie**. Un code mal tapé se retape, dans la limite des essais (A.1).
  Pourquoi pas 7 jours depuis la création du compte : le jour où la
  confirmation sera activée, quelqu'un qui confirme quatre jours après
  s'être inscrit n'aurait plus que trois jours.
- On peut **retirer** le lien à tout moment ; un lien retiré ne se remplace
  pas par un autre.
- Tout cela vit dans **une seule rangée du profil**, « Le code de mon
  parrain » : le code saisi s'il y en a un, avec « Retirer » ; sinon, pendant
  les 7 jours, un champ pour le saisir, avec ses propres états (envoi, refusé
  avec sa phrase, enregistré). Passé ce délai, la rangée ne reste que s'il y
  a un lien à retirer. La politique de confidentialité renvoie à cette
  rangée.
- **Pourquoi un bouton « Retirer »** : c'est la porte du droit d'opposition
  (RGPD, art. 21). La loi n'exige pas un bouton. Aujourd'hui, Opus n'a
  aucune adresse où écrire pour s'opposer (`src/data/legal.js` le dit). La
  boîte du §4 (préalable 2) existera avant R2, mais un geste dans
  l'application reste plus simple qu'un courriel, et ne dépend pas de
  quelqu'un qui relève la boîte.

### Ce qui ne se fera jamais

Lire les contacts du téléphone, lire le presse-papiers, envoyer une
invitation à la place de l'artisan, compter les messages envoyés ou les
ouvertures d'un lien, nommer le parrain sur la page publique d'un code. Un
contrôle tiendra ce qui vit dans l'application (A.6). Pour la page publique,
un contrôle ne le tiendra que si elle vit dans le dépôt (Q2) : tant qu'elle
vit ailleurs, rien ne le tient.

---

## 3. Quand un filleul « compte »

- **Il compte quand son compte porte une entreprise ACTIVE trouvée au
  répertoire Sirene.** Quatre chemins y mènent : l'inscription pro, « Passer
  en compte professionnel », une demande acceptée par l'administration (la
  porte de secours, ou le transfert d'une entreprise à son vrai titulaire),
  et le rattachement d'une entreprise à un compte pro qui n'en avait pas
  (`rattacher_mon_siret()`). Ce n'est pas le chemin qui décide, c'est **la
  source** de l'entreprise, et le fait qu'elle soit active :
  - lue au répertoire Sirene (`registre`) : elle compte ;
  - ouverte à la main par l'administration (`administration`) : c'est votre
    question Q5 ;
  - d'essai (`essai`) : seulement pour un parrain qui a lui aussi une
    entreprise d'essai (plus bas).

  Le décompte se fait **par filleul**, jamais par ligne d'entreprise : un
  transfert de siège (une ligne nouvelle sur le même compte) ne compte pas
  deux fois.
- **« Une entreprise ne compte qu'une fois »** n'est vrai qu'à un instant
  donné — un SIREN ne se rattache qu'à un seul compte à la fois, la base le
  tient —, et seulement si un retrait la fait sortir du décompte : d'où Q3.
- **Si l'administration retire son entreprise au filleul, ou la transfère à
  un autre compte** — les deux seuls chemins par lesquels un compte se
  retrouve sans entreprise —, deux règles sont possibles (Q3) :
  - **(a) il reste compté** : la base note une fois pour toutes le premier
    jour où il a compté, et le parrain n'apprend rien d'une décision de
    l'administration qui ne le regarde pas. Le prix : celui qui avait tapé le
    SIRET d'une autre entreprise reste compté après le retrait ; et si
    l'administration rend l'entreprise à son vrai titulaire, inscrit avec un
    autre code, la même entreprise compte pour deux parrains au même moment.
    Le jour d'une récompense, ce choix sera à revoir (Q19) ;
  - **(b) il cesse de compter** (recommandé) : rien n'est daté, le décompte
    se calcule à chaque lecture sur l'entreprise active, et une entreprise ne
    compte qu'une fois à un instant donné. Si elle est transférée au compte
    d'un autre filleul, elle compte pour le parrain de celui-ci : le
    transfert est la seule façon de rendre une entreprise à son vrai
    titulaire, il ne doit pas perdre son effet ici. Le prix : le parrain voit
    le nom quitter sa liste, donc il apprend qu'une décision a été prise — et
    la politique de confidentialité doit le dire au filleul, dans « Ce que
    les autres voient de vous » (A.4).

  Dans les deux cas, **le nombre et la liste suivent la même règle** : un nom
  gardé à côté d'un nombre qui baisse révélerait quand même le retrait.
- **Une entreprise d'essai** (`source = 'essai'`) ne compte que pour un
  parrain qui a lui aussi une entreprise d'essai : les essais sur la vraie
  base ne gonfleront jamais le compteur d'un vrai compte. Ce marqueur ne
  s'obtient que par une preuve posée par le connecteur pour l'adresse EXACTE
  du compte jetable — **jamais par le seul domaine `@exemple-opus.test`** :
  la confirmation par e-mail étant coupée, n'importe qui peut créer une
  adresse sur ce domaine (`schema.sql` le dit depuis le 15/10 : « une
  adresse, pas un domaine »). Aucune colonne `essai` n'est ajoutée aux tables
  du parrainage.
- **Un seul niveau** : le filleul d'un filleul n'est rien pour le premier
  parrain. Ce n'est PAS ce qui tient Opus hors de la « boule de neige »
  (§6) : comme chaque filleul a lui-même un code, l'invitation se propage de
  proche en proche de toute façon. Ce qui l'en tient aujourd'hui, c'est qu'il
  n'y a rien à espérer — aucune récompense, aucun prix réduit — et rien à
  payer pour avoir un code ou inviter.
- **Vocabulaire** (règle du projet) : jamais « vérifié » pour ce niveau — ce
  mot appartient au badge. On dit « inscrite avec son entreprise ».
- **Ce qui ne protège rien tant qu'il n'y a rien à gagner** — et qu'il
  faudra régler AVANT toute récompense :
  - un SIRET est public, et n'importe qui peut taper celui d'une entreprise
    réelle : une preuve du répertoire vaut 24 h pour tout compte qui tape ce
    numéro, la fonction `siret` s'appelle sans compte, la confirmation par
    e-mail est coupée, et la limite est de 20 consultations du répertoire
    par heure et par connexion. Cela fait de l'ordre de 480 faux filleuls
    par jour et par connexion — un calcul d'après ces limites, pas une
    mesure ;
  - une même personne peut se parrainer elle-même depuis un second compte ;
  - une même entreprise peut compter pour un parrain, puis pour un autre :
    quand son compte est supprimé (le SIREN est alors libéré) et qu'elle
    revient avec un autre code, ou quand l'administration la transfère. Le
    jour d'une récompense, il faudra décider si une entreprise peut compter
    pour plusieurs parrains successifs ; pour les parrainages d'avant ce
    jour, on ne pourra le savoir que si une trace est gardée dès R1 (Q4).

  Le jour où une récompense existera, une règle plus stricte — « seuls les
  filleuls qui ont le badge comptent » — se calculera avec ce que la base
  garde déjà : rien à ajouter aujourd'hui (A.1).

---

## 4. La page `/i/CODE` et la liste d'attente (R2)

### Aujourd'hui, le lien ne mène nulle part

Mesuré le 03/11 : `https://opus-project.com/` répond **403** (l'hébergement
IONOS est vide). `…/i/K7PQ4MB` est **redirigé** (301) vers `…/./K7PQ4MB`,
qui répond **404 (introuvable)** : c'est le correcteur d'orthographe du
serveur qui « devine » une autre adresse. L'adresse que les iPhone lisent
pour ouvrir une application (`/.well-known/apple-app-site-association`)
répond **300**, mais seulement parce que ce fichier n'existe pas encore : une
fois déposé, il sera servi. Et Opus n'est sur aucun magasin.

D'où la règle de l'ordre (§5) : **le bouton « Inviter » naît avec la page,
jamais avant elle.**

### La page `/i/CODE`

- « Vous avez été invité sur Opus », le code dans un cadre étiqueté « Code
  de parrainage » (le mot retenu à Q10), et l'**inscription à la liste
  d'attente**. **Aucun lien de téléchargement** : c'est la liste d'attente
  qui garde l'invitation. Un lien d'installation n'y apparaît que le jour où
  un inconnu peut VRAIMENT installer Opus : un lien public TestFlight, si
  vous décidez de la version d'essai donnée à quelques artisans
  (`docs/A-FAIRE.md`, « Avant d'ouvrir ») — elle suppose la fiche App Store
  Connect, que vous avez choisi de ne créer qu'au passage de `STATUT` hors de
  `'essai'` —, ou les magasins après la publication.
- Elle lit ce qui suit `/i/`, le remet en forme comme à la saisie, et
  n'affiche le code **que s'il passe la règle de forme d'Opus** (les
  30 signes, la longueur, le signe de contrôle) ; sinon, une page générique,
  sans code.
- **Mais la forme ne suffit pas** : un code de forme exacte peut épeler un
  mot — « GAGNEZ » suivi de son signe de contrôle en est un. Le code
  s'affiche donc TOUJOURS en deux groupes (`K7P-Q4MB`), dans son cadre
  étiqueté, jamais comme un titre ni dans une phrase : ce sont le découpage et
  l'étiquette qui l'empêchent de se lire comme une promesse faite sous le nom
  d'Opus.
- Le code est inséré comme du **texte**, jamais comme du code de page ; les
  aperçus du lien (ce qu'affichent WhatsApp ou Messages) sont fixes : sans
  le code, sans montant, sans « gratuit » ni « gagnez ».
- Elle **ne demande jamais à la base** si le code existe : sinon, n'importe
  qui pourrait essayer des codes à la chaîne.
- **Aucun cookie, aucune mesure d'audience**, et jamais le nom du parrain.
- **Elle ne compte pas les ouvertures d'un lien** : ni par un compteur sur le
  serveur (il dirait au parrain si la seule personne à qui il a écrit a
  ouvert le lien), ni en écartant les doublons (il faudrait un cookie, donc
  l'article 82 de la loi Informatique et Libertés, ou l'adresse IP).
- **Les journaux de l'hébergeur sont des données personnelles** : chaque
  ouverture y range l'adresse IP, la date et la page demandée — donc le code
  du parrain. Opus n'en tient aucune copie à lui : ni journal de la page, ni
  outil de mesure. La notice du site nomme l'hébergeur, ce qu'il garde et
  combien de temps : à relever chez IONOS, pas à supposer.

### La liste d'attente

- **À quoi elle sert, et sur quelle base** : vous prévenir de l'ouverture
  d'Opus et vous garder votre code ; et garder le code de la personne qui
  vous a invité, pour lui montrer le résultat de ses invitations et, si Opus
  crée un jour des récompenses, pouvoir compter les invitations faites
  avant. Base : **le consentement** de la personne qui s'inscrit. Le
  formulaire le dit **au moment même où il recueille l'adresse** (RGPD,
  art. 13) : c'est là que seront recueillis les premiers parrainages de
  vraies personnes, et la finalité se fige à ce texte. La personne peut
  retirer son consentement à tout moment (la désinscription), et c'est dit à
  part de tout le reste. La désinscription efface l'adresse aussitôt (RGPD,
  art. 17.1.b) ; si la personne avait déjà un code, il reste seul, libéré
  (A.1), et n'accepte plus de filleul.
- Le code de la personne qui invite est **visible dans le formulaire, et
  effaçable**, avec dessous : « Facultatif. La personne dont c'est le code
  verra qu'une personne de plus s'est inscrite grâce à elle — jamais votre
  adresse. » Le garder, c'est accepter ce lien ; l'effacer, c'est s'inscrire
  sans lui. Sans ce champ effaçable, le seul moyen de refuser le lien serait
  de quitter la liste.
- Une case non cochée pour ce consentement est RECOMMANDÉE par la CNIL, pas
  exigée par un texte. En revanche, tout AUTRE envoi (actualités, offres)
  demande une case SÉPARÉE, non cochée, et n'est jamais une condition de
  l'inscription.
- **Trois courriels au plus** : le lien de confirmation, l'annonce de
  l'ouverture et, à l'ouverture, le lien qui fait passer la ligne à un
  compte (chemin 2, plus bas) — l'annonce de l'ouverture peut le porter
  elle-même. Chacun nomme la PERSONNE qui écrit — l'éditeur, pas la seule
  marque « Opus » : la loi (code des postes et des communications
  électroniques, art. L. 34-5) interdit de cacher l'identité de celui pour le
  compte de qui on écrit — et porte un lien de désinscription qui marche, pas
  seulement « écrivez-nous ».
- **Aucun pixel ni lien traçant** : ni mesure d'ouverture, ni statistique, y
  compris chez le fournisseur d'envoi, dont le suivi est souvent allumé par
  défaut.
- **La même réponse quoi qu'il arrive** : « Si l'adresse est valable, un
  e-mail vient de partir ». Elle ne dit ni si l'adresse est déjà inscrite, ni
  si un code de parrain existe. **L'e-mail de confirmation est le même
  aussi** : il ne nomme aucun parrain et ne change pas selon le code — sinon
  la réponse interdite arriverait dans la boîte de celui qui essaie des codes
  avec sa propre adresse.
- **Une entrée non confirmée** n'a pas de code, ne compte pour personne, et
  est effacée au bout de 7 jours (durée proposée, Q15). Le code de la
  personne n'est fabriqué qu'à la confirmation, et le code de son parrain
  n'est LU qu'à ce moment-là : avant, la ligne ne garde que l'adresse et le
  code tapé, sans le vérifier ; inconnu, il est ignoré sans rien dire. Sinon
  une adresse inventée réserverait un code « définitif » pour toujours, et
  quelqu'un pourrait imposer son parrainage à l'adresse d'un autre.
- **Cet effacement a besoin d'un rendez-vous régulier.** La fonction de la
  liste peut purger à chaque appel, comme le font déjà `siret` et `tva`, mais
  cette purge s'arrête quand plus personne n'appelle — c'est-à-dire après la
  fermeture de la liste, au lancement. Il faut donc aussi `pg_cron`
  (disponible sur le projet, pas encore activé, relevé par la relecture) ou
  une purge déclenchée ailleurs, par exemple à chaque inscription dans
  l'application.
- Un inscrit de la liste n'est montré à son parrain **que par un nombre**
  (« 2 personnes sur la liste d'attente »), jamais par son adresse.
- Le code d'une personne de la liste, encore sans compte, **accepte des
  filleuls** : c'est ce qui garde les parrainages faits avant le lancement.

### À l'ouverture d'Opus : passer de la liste à un compte

- **Une ligne de la liste porte DEUX liens** : le code de la personne, et
  celui de la personne qui l'a invitée. **Les deux** passent à son compte —
  sinon un parrainage fait avant le lancement serait perdu, l'inverse de ce
  que vous demandez —, et **seulement si l'adresse est PROUVÉE**. Jamais par
  la seule égalité des adresses, donc jamais au moment où le compte est
  créé : à cet instant, l'adresse n'est jamais prouvée.
- **Deux chemins** :
  1. le moment où l'adresse du compte est confirmée — il faut activer la
     confirmation par e-mail de Supabase, ce qui doit être fait de toute
     façon avant d'ouvrir au public ; sur ce chemin, les deux adresses
     doivent être égales (en minuscules) ;
  2. un lien envoyé à l'adresse CONFIRMÉE de la liste, et touché depuis le
     compte — c'est aussi le chemin de qui s'est inscrit avec une autre
     adresse.
- **Aujourd'hui, la date de confirmation ne prouve rien** : tant que la
  confirmation reste coupée, elle est posée moins d'un dixième de seconde
  après la création du compte (relevé le 03/11 sur les 14 comptes).
- Le passage se fait par **une fonction à part**, jamais par le déclencheur
  d'inscription (qui tourne avant toute confirmation). En une seule fois,
  elle détache le code que le compte aurait déjà reçu (seulement s'il n'a
  aucun filleul, §1), rattache celui de la liste, et fait du parrain de la
  liste le parrainage du compte s'il n'en a pas encore, avec la date de
  l'inscription sur la liste. S'il en a déjà un (un code tapé à
  l'inscription, qui arrive toujours en premier), c'est votre réponse à Q16
  qui décide. Recommandé : celui de la liste gagne, et il faut alors lever,
  pour ce seul cas, « un parrain posé ne change plus ». Celui qui n'est pas
  retenu n'est pas pris en compte, et l'écran le dit. Elle garde une trace
  du geste, et refuse de faire de quelqu'un son propre parrain.
- **La base légale change au passage.** Sur la liste, le lien avec le
  parrain repose sur le consentement ; dans l'application, sur l'intérêt
  légitime d'Opus (A.4). Les lignes directrices du CEPD sur le consentement
  (05/2020, section 6) disent qu'on ne passe pas du consentement à une autre
  base pour un même traitement. Proposé : au passage, l'écran dit « Le code
  de la personne qui vous a invité a été repris de la liste d'attente »,
  avec « Retirer » à côté. À faire confirmer par un juriste.
- **Rien n'est posé en R1 pour ce lien** : sa forme exacte se décide avec le
  reste de R2. Une colonne que personne n'écrit ni ne lit ne se pose pas « en
  avance » (la règle du projet : chaque chose naît avec le lot qui s'en
  sert).
- **Tant qu'aucune des deux preuves n'existe, l'entrée reste à part** et ce
  passage n'est pas mis en service ; un contrôle (`verifier-legal`, ou la
  procédure d'ouverture) le vérifie, pour qu'on ne puisse pas l'oublier. Ce
  que ce contrôle évite est borné : si le passage se faisait sur la seule
  égalité des adresses alors que la confirmation est coupée, n'importe qui
  pourrait créer un compte avec l'adresse d'un inscrit et récupérer son code
  et ses parrainages ; mais la confirmation doit de toute façon être activée
  avant l'ouverture, et avant l'ouverture les filleuls de la liste ne sont
  que des adresses — un nom d'entreprise n'apparaît qu'avec un compte
  rattaché à son entreprise.

### Ce qu'il faut AVANT de recueillir une seule adresse

C'est la première collecte publique d'Opus, et la loi demande que le
responsable soit nommé « au moment où les données sont obtenues » (RGPD,
art. 13).

1. **Décider qui est l'éditeur** — le responsable de la liste et du
   parrainage : vous, votre SARL, ou la future société — et publier son
   identité et des coordonnées sur la page, au moment où l'adresse est donnée
   (art. 13.1.a). Si ce n'est pas la future société, écrire sur le
   formulaire que les adresses lui seront transmises : ce n'est pas une
   simple éventualité, c'est la raison même de garder les parrainages faits
   avant le lancement (art. 13.1.e).
2. **Créer la boîte aux lettres** sur `opus-project.com`, et la relever
   (rien à configurer : le domaine porte déjà le courrier d'IONOS). La loi
   demande des « coordonnées » — une adresse postale suffirait ; une boîte
   sur le domaine d'Opus est la règle du projet. C'est la même adresse qui
   ira dans `EDITEUR.email` (`src/data/legal.js`), et le drapeau
   `EDITEUR.emailReleve` se coche EN MÊME TEMPS, jamais avant :
   `verifier-legal` refuse le drapeau sans adresse, et l'adresse sans le
   drapeau. Les textes légaux de l'application changent alors (`VERSION`, et
   les empreintes que `verifier-legal` garde de ces textes). C'est aussi
   l'adresse d'expédition des e-mails.
3. **Choisir le fournisseur d'envoi d'e-mails.** Il en faut un : Opus
   n'envoie aujourd'hui aucun courriel. Il devient un sous-traitant, avec son
   contrat (RGPD, art. 28.3). Attention, ce sont **deux réglages distincts**,
   qu'on confond facilement :
   - **l'e-mail de confirmation de la liste d'attente** part de la fonction
     de la page, qui n'a accès à AUCUN service d'envoi de Supabase : il lui
     faut un fournisseur (le SMTP d'une boîte IONOS, ou un service d'envoi),
     dont les identifiants sont rangés en secrets de la fonction (le réglage
     du domaine : A.3). Il est nommé, avec son pays, dans les textes de la
     PAGE ;
   - **prouver, à la création d'un compte, que l'adresse est bien celle de
     la personne** demande d'activer « Confirm email » dans Supabase →
     Authentication, donc un SMTP à vous dans Authentication → SMTP (ou le
     « Send Email hook ») : le service intégré n'écrit qu'aux membres de
     l'équipe du projet, et en petit nombre par heure. Celui-là sert à
     l'application : il n'entre dans « À qui vos données sont transmises »
     de l'application que le jour où elle s'en sert (A.4) — aucun service
     d'envoi n'y est nommé aujourd'hui (vérifié dans `legal.js`). Ce second
     réglage n'est pas un préalable de R2 : il l'est du passage de la liste
     à un compte (chemin 1) et de l'ouverture au public.
4. **Écrire ce que la page doit dire** :
   - sous le formulaire, au moment où l'adresse est donnée (RGPD, art. 13) :
     à quoi servent les adresses et sur quelle base (le consentement), quels
     courriels partiront et quand (§4, « La liste d'attente »), combien de
     temps elles sont gardées — y compris si Opus n'ouvre jamais — et
     comment cette durée est tenue, les droits de la personne et la
     réclamation auprès de la CNIL, les destinataires (l'hébergeur de la
     page, Supabase, le fournisseur d'envoi, s'il n'est pas l'éditeur la
     société qui éditera Opus, et la personne dont le code figure dans le
     formulaire, qui voit un nombre de plus — « 2 personnes sur la liste
     d'attente » —, jamais l'adresse), la désinscription ;
   - les **mentions légales du site**, avec l'éditeur et l'hébergeur DE LA
     PAGE, qui peut ne pas être celui de l'application : une page ouverte à
     tous est publiée quel que soit `STATUT`, et relève de l'**article 1-1,
     I, de la LCEN** (loi SREN, art. 48 ; détails en A.3) ;
   - que le code figure dans l'adresse de la page, donc dans les journaux du
     serveur.

   Ces textes ne sont pas couverts par `STATUT = 'essai'`, qui repose sur
   « il n'y a pas de public » : une liste d'attente en a un. Et
   `verifier-legal` ne lit pas une page qui vit hors du dépôt. R2 ne part
   pas tant que ces textes n'ont pas été relus (par vous au moins). Mieux,
   et c'est la recommandation de Q2 : les mettre dans le dépôt et les
   fabriquer depuis `legal.js`, pour qu'un contrôle les relise à chaque
   envoi. Si la page vit ailleurs, rien ne les tient après cette relecture
   (§2, A.6).
5. **Régler l'hébergement** : aujourd'hui `/i/CODE` est redirigé, puis tombe
   en 404. Il faut un espace web qui accepte un fichier `.htaccess` (une
   règle pour `/i/*`, et plus tard les fichiers de `/.well-known/` servis
   sans redirection), ou un hébergeur statique équivalent. **À vérifier
   avant de choisir** : que votre offre IONOS le permet — un constructeur de
   site ne le permettra probablement pas (A.3).
6. **Décider du plan Supabase.** Le projet est au plan gratuit, et Supabase
   met en pause un projet gratuit peu actif pendant 7 jours ; d'après sa
   documentation, il vous prévient par e-mail environ une semaine avant, puis
   quand la pause a eu lieu (et quelques requêtes par jour suffisent à
   l'éviter : chaque inscription à la liste en est une). **Une pause coupe
   TOUT le projet** — la liste d'attente, mais aussi Opus lui-même : c'est
   une décision du projet, à prendre avant toute page publique qui écrit dans
   Supabase. Soit le plan payant, qui supprime la pause ; soit le plan
   gratuit, en vérifiant que l'adresse de votre compte Supabase reçoit bien
   l'avertissement. Dans les deux cas, le formulaire dit « Inscription
   momentanément indisponible, réessayez plus tard » quand la fonction ne
   répond pas, jamais une erreur brute. Une pause ne détruit rien
   (rétablissement d'un clic pendant 90 jours, données comprises), et la page
   `/i/CODE`, qui ne demande rien à la base, ne tombe pas.

### Plus tard : le lien qui ouvre directement l'application (R3)

**Le lien qui ouvre directement l'application** (« lien universel ») vient
plus tard, avec le QR professionnel de l'addendum, au moment de la première
version publiée sur les magasins, en une seule reconstruction. C'est un
réglage NATIF, des deux côtés (iPhone et Android) : il impose une
reconstruction. Il **s'essaie AVANT la publication**, dans le build de
développement (même identifiant `com.opusproject.app`), et il doit être dans
la **première version envoyée aux magasins**. Chaque chemin (`/i/`, puis
`/p/` pour le QR) n'est déclaré que dans la version de l'application qui
sait le traiter : déclaré trop tôt, un lien ouvrirait Opus sur l'accueil
sans rien faire. Ce n'est pas un surcoût : Opus n'a pas de mise à jour à
distance (`expo-updates`), donc le code qui traite un chemin part de toute
façon dans une nouvelle construction.

Une fois ces liens en place — et pas avant, puisque d'ici là toucher le lien
ouvre la page web, pas l'application :

- **une personne déjà connectée qui ouvre `/i/CODE` n'enregistre rien en
  silence** : l'écran dit « Vous avez déjà un compte » et, si elle est encore
  dans ses 7 jours, lui propose d'ajouter le code, par la même fonction qui
  refuse son propre code ; si c'est son propre code : « C'est votre lien
  d'invitation » ; un code de forme invalide mène à l'accueil ;
- la page `/i/CODE` dit « Opus déjà installé ? Revenez toucher le lien de
  l'invitation », et peut proposer « Ouvrir dans Opus » par le schéma
  `com.opusproject.app://`, déjà déclaré sur iPhone — à éprouver au doigt ;
- un code reçu par un lien est **lu une seule fois**, puis gardé jusqu'à
  l'inscription, avec une copie sur le téléphone qui expire (A.3 bis) ; un
  code reçu pendant qu'un compte est connecté pose une question (Q18).

### Le code saisi par la personne reste le chemin principal

**Partout** : tapé, ou collé par le « Coller » du champ. Un collage que la
personne choisit elle-même ne déclenche aucune demande d'autorisation sur
iPhone ; ce qu'Opus ne fera jamais, c'est LIRE le presse-papiers de
lui-même.

- **Sur iPhone**, un code ne peut suivre une installation faite APRÈS le
  clic qu'en lisant le presse-papiers au premier lancement (exclu, §2), par
  une « App Clip » (une mini-application à part, disproportionnée ici), ou
  en prenant une « empreinte » de l'appareil — rapprocher le clic et
  l'installation par l'adresse IP et le navigateur. **Apple interdit
  l'empreinte purement et simplement, même si la personne y consent**, et
  elle fait refuser une application sur l'App Store ; la CNIL, elle, la
  soumet au consentement. (Firebase Dynamic Links, l'ancien service de
  Google pour cela, a fermé le 25/08/2025.)
- **Sur Android**, Google Play offre un moyen qui n'est pas un service
  tiers : le « référent d'installation ». Il n'existera qu'après la première
  publication sur le Play Store, et il touche à une règle de la loi
  Informatique et Libertés (lire une information rangée dans le téléphone).
  Si on s'en sert un jour, ce sera seulement sur un geste exprès de la
  personne, et le code arrivera PRÉREMPLI dans le champ, visible et
  modifiable, jamais rattaché en silence (détails : A.3 bis).

---

## 5. L'ordre

- **Maintenant** : ce plan, et le **format du code figé** (§1) — un texte,
  sans aucune table. Tant que la liste d'attente d'Opus n'existe pas, une
  page d'accueil peut exister, mais elle ne propose **aucun code ni lien de
  parrainage**. Un outil de liste d'attente « virale » (KickoffLabs,
  GrowSurf…) fabriquerait les siens : ils ne seraient pas ceux d'Opus, et les
  reprendre demanderait d'accepter dans Opus un second format de code. Une
  simple page de présentation, ou un formulaire d'adresse sans code, ne pose
  pas ce problème — mais recueillir une adresse demande les préalables du §4.
- **Le devis reste la priorité.** Il reste d'abord à finir le lot 2, en trois
  sous-lots : 2a, le calcul (réduction, acompte, validité — construit le
  03/11, commit `2e18d85`) ; 2b, ce que le devis doit dire ; 2c, le document
  et sa remise. Viennent ensuite les lots 3 (la TVA complète et la case que
  le client coche), 4 (le cycle de vie : relancer, accepter, refaire) et 5
  (les modèles), dans l'ordre de `docs/PLAN-DEVIS.md`. Je propose de placer
  R1 **après le lot 5** (Q1). Si vous voulez la page d'accueil avant la fin
  du devis, R1 puis R2 peuvent passer avant, sur votre seule décision
  explicite.
- **Lot R1 — la base, rien de visible** : les tables, les fonctions, le
  module du code (`src/lib/code-invitation.js`), les essais et les
  contrôles. Le code ne naît qu'à la première ouverture d'« Inviter » (§1) :
  un champ à l'inscription livré sans cet écran attendrait des codes que
  personne ne peut avoir. R1 peut être appliqué sur la vraie base avant R2,
  à une condition (proposé) : les fonctions qui ÉCRIVENT un code ou un lien
  n'y sont encore appelables par personne — les droits d'appel arrivent avec
  R2 et les textes qui annoncent le parrainage ; sinon, un téléphone modifié
  pourrait créer un lien que personne n'a encore annoncé (A.1). Si un
  contrôle exige les textes dès la création des tables, R1 et R2 sortent
  ensemble pour l'application.
- **Lot R2 — la page `/i/CODE`, la liste d'attente, l'écran « Inviter », le
  champ à l'inscription et leurs textes, livrés ensemble**, avec les six
  préalables (§4). Le bouton naît avec la page, **jamais avant elle — même si
  Opus arrivait sur un magasin entre-temps** : sans la page, le lien est
  redirigé puis tombe en 404 (mesuré le 03/11), et avant le lancement seule
  la liste d'attente peut recueillir la personne invitée. **Aucune adresse ne
  part dans un message tant qu'elle ne répond pas 200** : mesuré
  (`curl -L -w '%{http_code}'`), écrit dans le compte rendu du lot, et tenu
  par un drapeau qu'un humain coche (A.2). R2 ne passe pas avant R1 : la
  liste d'attente range ses codes dans la table de R1.
- **Lot R3 — les liens universels**, avec la première version publiée et le
  QR professionnel : déposer les deux fichiers de `/.well-known/`, ajouter
  les réglages dans `app.json`, reconstruire, essayer dans le build de
  développement, et garder ces réglages dans la première version publiée
  (A.3 bis).

Chaque lot suit la méthode habituelle : cahier, relecture adverse, base
d'essai rejouée deux fois, contrôles éprouvés en cassant, migration simulée,
**votre accord**, puis la vraie base, et un essai par le chemin de
l'application avec des comptes jetables supprimés ensuite.

---

## 6. Les récompenses — plus tard, et ce qu'il faudra respecter

Rien de ceci n'est construit ni promis. Ce sont les garde-fous à tenir le
jour où vous déciderez des paliers, **à faire relire par un juriste avant
toute annonce** :

- **la vente « à la boule de neige » est un délit** (code de la
  consommation, art. L. 121-15 ; la peine est à l'art. L. 132-19 : deux ans
  de prison, 300 000 € d'amende, portée jusqu'à 10 % du chiffre d'affaires).
  Le texte ne parle pas de niveaux, et il a deux branches. **1°** : faire
  espérer un service gratuit OU moins cher que son prix, à condition d'avoir
  recruté — un avoir sur Opus, un mois offert, un palier « gratuit dès
  N entreprises » ont tous cette forme, et c'est au juriste de dire ce qui
  reste possible. **2°** : exiger un paiement ou un abonnement pour avoir un
  code ou inviter, en faisant espérer des gains liés au nombre de recrues
  plutôt qu'à l'usage du service. Ce qui tient Opus dehors AUJOURD'HUI, c'est
  qu'il n'y a rien à espérer et rien à payer. Les garde-fous à tenir dès
  maintenant, et pour toujours : avoir un code et inviter ne coûtent jamais
  rien ; aucune récompense ne dépend des filleuls des filleuls ; aucun texte
  n'annonce un gain tant qu'un règlement relu par un juriste n'existe pas. Le
  reste — une récompense par filleul qui UTILISE Opus plutôt que par simple
  inscription, un plafond par an, l'acceptation par une case non cochée —
  ce sont des CHOIX d'Opus à soumettre au juriste, pas des exigences de
  L. 121-15 : ils ne décident pas, à eux seuls, si une récompense tombe sous
  le 1° ;
- **ni « de préférence un avoir », ni « de préférence de l'argent »** : les
  deux posent des questions que seuls un juriste et l'expert-comptable de la
  société trancheront, avant l'annonce. Un avoir sur Opus obtenu en
  recrutant, c'est Opus « moins cher que son prix » contre des inscriptions :
  la forme même du 1°. Et il n'échappe pas aux impôts : en argent comme en
  avoir, une récompense de parrainage rémunère un service rendu par le
  parrain (l'apport d'un client) ; ce n'est pas une remise calculée sur ses
  achats (BOFiP, BOI-BIC-DECLA-30-70-20 §210 et §220). La société la déclare
  chaque année (DAS2), à sa valeur réelle (§340), au-delà de 2 400 € par an
  et par bénéficiaire (§140 : un seuil de la doctrine, absent de
  l'article 240 du code général des impôts). Côté TVA, la Cour de justice
  juge qu'un cadeau remis pour la présentation d'un nouveau client rémunère
  un service (Empire Stores, 2 juin 1994, C-33/93). Enfin, un avoir suppose
  une offre payante, qui n'existe pas aujourd'hui ;
- **un règlement accepté par le parrain** (case non cochée, datée par la
  base) : Opus ne sait pas encore faire ré-accepter des conditions, donc une
  nouvelle version des CGU ne suffirait pas ; il faudra une fonction neuve
  (la base refuse aujourd'hui que le téléphone écrive la version des
  conditions acceptées, OP023). Ce que le droit exige, c'est que des
  conditions aient été portées à la connaissance du parrain et acceptées
  (code civil, art. 1119) ; la case non cochée est la façon choisie par Opus
  de le prouver. Et pour un artisan, des conditions déjà acceptées ne
  changent qu'avec un préavis de 15 jours (règlement européen 2019/1150,
  art. 3.2) ;
- un **journal des récompenses accordées**, à part, qui survit au départ du
  filleul — né avec le règlement, pas avant (une table que personne ne lit
  n'a pas sa place). Ce qu'il garde se fixe avec un juriste et la
  comptabilité : le bénéficiaire et, pour la déclaration annuelle (DAS2), la
  valeur réelle de ce qui lui a été attribué chaque année civile et de quoi
  l'identifier (nom, adresse, et SIRET s'il en a un — un parrain particulier
  n'en a pas) ; et s'il faut ou non un identifiant, ou le SIREN, du filleul
  — celui d'un entrepreneur individuel désigne une personne. Une récompense
  en argent se justifie dix ans (code de commerce, L. 123-22) ;
- la règle « **une entreprise ne compte qu'une fois** » se décide avec le
  règlement (§3) ; selon votre réponse à Q4, elle vaudra pour les
  parrainages d'avant, ou seulement à partir du règlement ;
- si vous avez choisi la règle (a) à Q3, elle sera à revoir ce jour-là
  (Q19) : sans changement, celui qui avait pris l'entreprise d'un autre
  resterait compté, et la même entreprise compterait pour deux parrains. Si
  elle change, le parrain verra un nom partir — il faudra alors le dire au
  filleul dans
  « Ce que les autres voient de vous », ou ne montrer au parrain qu'un
  total, sans noms ;
- le message prérempli dira alors que le parrain reçoit une récompense :
  c'est une « information substantielle », et la taire serait une pratique
  trompeuse par omission (code de la consommation, L. 121-3), y compris entre
  professionnels (L. 121-5). Le règlement interdira l'envoi en masse, l'achat
  de mots-clés au nom d'Opus et la publication du code en échange d'argent ;
  publier en public un code qui rapporte quelque chose sera relu au regard de
  la loi n° 2023-451 du 9 juin 2023 sur l'influence commerciale (un message
  privé à un collègue n'est pas une communication au public) ;
- **pouvoir arrêter un code** (par l'administration, et peut-être le
  remplacer à la demande de son titulaire) : à décider avec les récompenses.
  Sans rien à gagner, un code qui circule ne nuit pas à son titulaire — un
  filleul nommé doit avoir sa propre entreprise, qu'aucun autre compte n'a
  déjà, et un filleul particulier n'est qu'un nombre.

---

## 7. Questions qui peuvent attendre

Chacune avec une réponse recommandée et le moment où elle devra être
tranchée. Les quatre premières (Q1 à Q4) sont dans « En bref ».

### Avant R1 (le cahier de la base en a besoin)

- **Q5. Une entreprise ouverte à la main par l'administration** (source
  `administration`) compte-t-elle ? Quand l'administration l'a acceptée,
  aucune lecture du répertoire Sirene de moins de 24 heures ne l'attestait :
  le plus souvent parce qu'elle est non diffusible, ou parce que le
  répertoire n'a pas répondu, ou parce que le SIREN était déjà pris par un
  autre compte (la vérification s'arrête alors avant de lire le répertoire),
  ou parce que la lecture avait plus de 24 heures. Mais un humain a examiné
  la demande (aucune pièce n'est exigée : le justificatif est facultatif).
  **Recommandé : oui.** Pourquoi : ne pas la compter écarterait l'artisan
  qui s'est opposé à la diffusion de son entreprise, et le projet a déjà
  écrit qu'on ne refuse pas quelqu'un pour avoir exercé ce droit.
- **Q6. Le parrain et un filleul se sont bloqués** (dans un sens ou dans
  l'autre) : que voit le parrain ? **Recommandé : rien ne change** — le
  nombre et le nom restent. Pourquoi : c'est la règle déjà tenue pour un
  partenariat, une demande reçue ou la réponse à une demande, qui restent
  lisibles par les deux même après un blocage ; le nom de la fiche est
  public de toute façon ; et un nom qui disparaît apprendrait au parrain
  qu'il a été bloqué. Les autres choix : cacher le nom en gardant le filleul
  compté, ou cacher les deux. Dans tous les cas, l'export ne dit jamais
  qu'on est bloqué.
- **Q7. Le filleul voit-il QUI l'a invité** (« invité par Dupont
  Maçonnerie ») ? **Recommandé : non.** Pourquoi : il le sait déjà, et un
  code recopié d'une publication ne doit rien apprendre de plus, surtout sur
  un particulier. Aucune loi ne l'exige : c'est un choix, le vôtre.
- **Q8. Le code tapé à l'inscription part-il par une fonction juste après,
  ou dans les données d'inscription ?** **Recommandé : la fonction.** Le
  RGPD n'impose ni l'un ni l'autre ; chacun a son prix.
  - **Par la fonction** (recommandé) : une inscription ne peut jamais
    échouer à cause d'un code, et rien ne reste dans les données
    d'inscription. Le prix : si la confirmation par e-mail est activée un
    jour, le code attend sur le téléphone jusqu'à la première connexion ;
    quelqu'un qui confirme puis se connecte sur un AUTRE appareil le perd
    sans le savoir, et ne le retrouve qu'en l'ajoutant depuis son profil
    dans les 7 jours.
  - **Par les données d'inscription** : le code survit à ce changement
    d'appareil. Le prix : il faut toucher au déclencheur d'inscription, où
    une erreur peut faire échouer les inscriptions (« Database error saving
    new user ») si elle n'est pas enfermée dans un bloc étroit, comme celui
    de la demande pro (les règles : A.1). Et la copie rangée là n'est jamais
    tenue à jour par la base : l'export (qui rend ces données depuis le
    02/11) pourrait montrer un code jamais reconnu, ou deux codes qui se
    contredisent. Une correction ou un retrait devrait donc la réécrire
    aussi (`supabase.auth.updateUser`, comme pour le type de compte), et la
    politique de confidentialité la nommer.
- **Q9. La garde « ni contacts, ni SMS envoyé seul, ni presse-papiers lu »,
  dès maintenant ?** Je peux poser tout de suite, dans `verifier-legal`, un
  refus simple de tout module qui lit les contacts (`expo-contacts`,
  `react-native-contacts`, `READ_CONTACTS`, `NSContactsUsageDescription`),
  de la permission Android `SEND_SMS` et de toute lecture du presse-papiers.
  Il ne change aucun texte légal ; la phrase « Opus ne lit jamais les
  contacts de votre téléphone ni votre presse-papiers » viendra avec R2.
  **Recommandé : oui, quand vous voulez** — au plus tard avec R1.
  Pourquoi : elle ne coûte rien et ferme la porte avant que quelqu'un
  l'ouvre par mégarde.

### Avant R2 (ce qui se voit)

- **Q10. Les mots à l'écran.** Vous avez écrit « parrainage » et « code de
  parrainage » : **recommandé, les garder.** L'autre possibilité est « code
  d'invitation ». Rien n'est chiffré dans les deux cas : votre demande (aucune
  récompense CHIFFRÉE) est tenue. Le mot « parrainage » peut toutefois faire
  demander à un artisan ce qu'il y gagne, alors que vous ne voulez rien
  annoncer avant les paliers. Le mot choisi vaudra partout — le champ, le
  titre de l'écran « Inviter » (par défaut « Mon parrainage »), le message,
  la page —, pour que la personne invitée retrouve le même. Le
  bouton, lui, reste « Inviter un collègue » (« Inviter un artisan » pour un
  particulier).
- **Q11. Le bouton « Inviter »** ouvre-t-il directement le menu de partage,
  comme vous l'avez demandé, avec le code et le décompte juste en dessous sur
  le profil — ou d'abord le petit écran du §2 ? **Recommandé : le petit
  écran.** Pourquoi : le décompte et les noms ont besoin de place, et le code
  doit se lire en grand pour être dicté ou recopié ; « Partager » y reste à
  un appui.
- **Q12. Le ton du message.** Il est écrit en votre nom, et se modifie dans
  WhatsApp ou les SMS avant l'envoi. **Recommandé : sans tutoiement ni
  vouvoiement**, comme le partage d'une publication aujourd'hui, **plus une
  variante** quand c'est un particulier qui invite son artisan (par exemple
  « Pour nos prochains travaux, inscrivez-vous sur Opus : … »). Préférez-vous
  le tutoiement entre pros ?
- **Q13. Un bouton « Copier le code »** : (a) le presse-papiers déjà compilé
  dans React Native — rien à reconstruire, mais déclaré obsolète, et une
  autre relecture le déconseille ; (b) `expo-clipboard`, un module natif,
  ajouté à une reconstruction déjà prévue ; ou aucun bouton. **Recommandé :
  aucun bouton au début** (le code se sélectionne au doigt), puis (b) à la
  prochaine reconstruction prévue. Pourquoi : rien qui puisse cesser de
  marcher à une mise à jour de React Native sans qu'aucun contrôle le voie.
  Le détail des deux voies : A.2.
- **Q14. Le nom dans le message et sur la page** : « Opus » ou
  « Opus-Project » ? **Recommandé : « Opus »**, le mot de votre logo et de
  tous les textes de l'application. Pourquoi le poser : le nom sous l'icône
  est aujourd'hui « Opus-Project » (`app.json`), et le partage d'une
  publication écrit « sur Opus-Project ». Le nom choisi pour les magasins
  devra suivre.
- **Q15. Combien de temps garder les adresses de la liste d'attente ?**
  (la page doit l'écrire, y compris pour le cas où Opus n'ouvrirait jamais —
  RGPD, art. 13.2.a). **Recommandé :**
  - une adresse **non confirmée** : 7 jours ;
  - une adresse **confirmée qui ne crée jamais de compte** : au plus trois ans
    à compter de l'inscription ou du dernier contact VENU DE LA PERSONNE
    (référentiel CNIL « gestion des activités commerciales » ; ouvrir un
    courriel n'est pas un contact, donc ne prolonge rien) ;
  - une adresse **confirmée dont le compte est créé** : elle part dès que le
    compte est créé ET l'adresse prouvée, et au plus tard 3 mois après
    l'ouverture.
- **Q16. Une personne de la liste avait un parrain, et tape un AUTRE code à
  l'inscription : lequel gagne ?** **Recommandé : le parrainage d'avant le
  lancement**, celui de la liste. Pourquoi : c'est le but de « conservés »,
  et c'est le premier choix de la personne, confirmé par son e-mail. Le
  prix : il faut lever, pour ce seul cas, la règle « un parrain posé ne
  change plus », et l'écrire dans la base. Sans décision, c'est l'ordre
  d'arrivée qui trancherait, et non celui que vous aurez choisi.

### Avant d'ouvrir au public

- **Q17. Une adresse prise par un autre.** Opus n'a pas de « mot de passe
  oublié ». Quelqu'un qui crée un compte avec l'adresse d'une autre personne
  la bloque : elle ne peut plus s'inscrire avec, ni la reprendre depuis
  l'application. Ce défaut existe déjà sans le parrainage, mais il s'aggrave
  dès qu'une adresse donne accès à quelque chose (un code, des filleuls).
  **Recommandé : un « Mot de passe oublié »** qui écrit à l'adresse, avec le
  fournisseur d'envoi, **avant que le passage de la liste à un compte soit
  mis en service** — et de toute façon avant d'ouvrir au public.

### Avant R3 (les liens qui ouvrent l'application)

- **Q18. Un code reçu par un lien pendant qu'un compte est connecté** (par
  exemple, sur le téléphone d'un artisan déjà inscrit, prêté à un collègue
  qui créera son compte après la déconnexion) disparaît-il à la
  déconnexion ? **Recommandé : oui.** Pourquoi : c'est la règle du projet
  depuis le 17/10, « se déconnecter, c'est repartir de zéro » ; garder le
  code demanderait de le dire à l'écran.

### Avant une récompense

- **Q19. Si vous avez choisi (a) à Q3** : faut-il qu'un compte à qui
  l'administration a retiré son entreprise cesse de compter (le parrain le
  verra) ? **Recommandé : oui, passer alors à (b)**, et le dire au filleul
  dans « Ce que les autres voient de vous » ; l'autre voie est de ne
  montrer au parrain qu'un total, sans noms.
- Les autres décisions de ce moment — le règlement, le journal, « une
  entreprise ne compte qu'une fois », arrêter un code — sont au §6.

---

## À reporter dans `docs/A-FAIRE.md`

Ce plan ne modifie pas `docs/A-FAIRE.md` : un autre travail l'édite en ce
moment. À y noter ensuite, chacun à sa place :

- **les textes devenus faux depuis l'étape M1d (02/11)**, qui disent encore
  que les données d'inscription sont « hors de l'export RGPD » — l'export
  les rend désormais (`metadonnees_d_inscription`) : `CLAUDE.md` (section du
  SIRET, « Ce qui reste ouvert », point 4), `src/lib/api.js:325-328`,
  `src/OpusApp.js:123-124` et `:805`, `supabase/schema.sql:10049`. À
  corriger dans un lot de documentation ;
- dans la section « Le parrainage » : `K7P-Q4MB` (l.3130) est un **exemple
  de forme**, dont le dernier signe sera recalculé en R1 ; le lien
  d'aujourd'hui est « redirigé, puis 404 », plus seulement « 403 » ; et « Si
  la page d'accueil se fait avant le reste, elle ne propose aucun code »
  devient « tant que la liste d'attente d'Opus n'existe pas, aucune page ne
  propose de code ni de lien de parrainage » ;
- **le petit lot « LCEN »** : remplacer « 6-III » par l'article 1-1 (A.3),
  sans attendre R2 ;
- **le défaut de `partagerPost`** : « Publication partagée. » s'affiche même
  quand on referme la feuille sans rien envoyer sur Android
  (`src/lib/partage.js:51`), à corriger à part ;
- **une ligne au tableau §4** (« Réglages à faire dans les tableaux de
  bord ») : le plan Supabase, et l'avertissement de mise en pause ;
- **le registre des traitements du responsable** à créer (A.4) ;
- **le « Mot de passe oublié »** de Q17.

---

## Annexe A — pour les lots qui le construiront

Le cahier de chaque lot, écrit au moment de construire, fixera les colonnes.
Ce qui suit fixe les **règles** et les **pièges déjà mesurés**.

### A.1 La base (R1)

**Les tables.**

- **`codes_parrainage`** : le code en clé primaire ; le compte, **unique**
  (un code par compte, tenu par la base et pas seulement par l'écran), en
  `on delete set null` ; la date de création ; `libere_le`.
- **`parrainages`** : le filleul en clé primaire, `on delete cascade` (la
  réponse recommandée à Q4) ; le code, par une clé vers `codes_parrainage`
  SANS action de cascade — un code n'est jamais supprimé ; la date
  d'enregistrement ; et `compte_le` seulement avec la règle (a) de Q3.
- **une table des essais** de `enregistrer_mon_parrain()` (le compteur, et
  le « déjà fait » d'une pose réussie) : sans politique ni droit client,
  écrite par la fonction seule. Sa clé est l'identifiant du compte, avec une
  clé étrangère vers **`auth.users`** en `on delete cascade` et **aucune vers
  `public.users`** : avec une clé vers `public.users`, la cascade de
  `preparer_suppression_compte()` les effacerait, et un compte qui recrée sa
  ligne `users` juste après (c'est possible : essai 44, cas B11) repartirait
  de zéro, essais et « une seule fois » compris. Elle survit donc à la ligne
  `public.users` recréée, pas au compte.
- **Les dates de création s'appellent `created_at`**, posées par la base.
  `verifier-remontee` ne voit une date de création qu'à ce nom : un
  `enregistre_le` lui échapperait sans un mot. Il exige ensuite que toute
  table qui en a une soit datée par `pose_la_date()`, ou soit dans sa liste
  `EXCLUES`, avec sa raison écrite dans la section 52.1. Les trois tables du
  parrainage vont dans `EXCLUES` : aucun client n'y écrit de date.
- **Aucune colonne `essai`** : une entreprise d'essai se reconnaît à sa
  source (`source = 'essai'`, §3), les essais n'utilisent jamais le code d'un
  vrai compte, et la suppression des comptes jetables emporte leurs
  parrainages (A.5).
- **Si vous répondez à Q4 « garder une trace »** : ce souvenir ne peut pas
  vivre dans `parrainages`, qui meurt avec le compte. Il faudrait une table
  rangée par SIREN, sans lien vers le compte (le modèle des SIREN réservés),
  où une entreprise ne compte qu'une fois — sinon supprimer son compte puis
  se réinscrire avec la même entreprise la ferait compter plusieurs fois
  (mesuré : 3 fois pour un seul SIREN). Le SIREN d'un entrepreneur
  individuel est une donnée personnelle : la raison de le garder, sa durée et
  sa base légale iraient dans la politique de confidentialité, et ranger une
  empreinte (HMAC) à la place n'en dispense pas — c'est une donnée
  « pseudonymisée », toujours personnelle (RGPD, considérant 26).

**L'état d'un code est ÉCRIT, jamais déduit d'une colonne vide.** Un
`compte_id` vide veut dire « pas encore de compte » pour un code de la liste
d'attente, et « compte parti » pour les autres. `libere_le` est donc posé
par un déclencheur `before update` sur `codes_parrainage`, qui voit
`compte_id` passer de rempli à vide (c'est ce que fait la suppression du
compte) ; il ne lit pas `auth.uid()`, qui n'est pas le titulaire pendant une
cascade. Le même état est posé quand une personne de la liste se désinscrit
avant d'avoir créé son compte (R2). Un code n'accepte un nouveau filleul que
si `libere_le` est vide : celui de la liste d'attente encore sans compte en
accepte ; un code libéré est traité exactement comme un code inconnu, et la
place de parrain du filleul n'est pas consommée.

**Quand un compte part**, par n'importe lequel des trois chemins
(l'application, la cascade depuis `auth.users`, une suppression à la main),
et toujours par des clés étrangères — jamais par un ordre de suppression
dans une fonction, que le connecteur refuse :

- **le filleul** : sa ligne `parrainages` part avec lui, et le décompte de
  son parrain baisse (Q4) ;
- **le parrain** : son code reste réservé, sans compte (`compte_id` passe à
  vide, `libere_le` est posé). Les lignes de ses filleuls ne mènent plus à
  personne : leur seul usage, son décompte, part avec lui. Elles ne disent
  plus que « a eu un parrain », ce qui tient la règle « un lien posé ne se
  remplace pas » ; c'est ce qu'Opus promet déjà pour une relation entre deux
  comptes (« ce qui n'existait qu'avec elle part avec lui »). Si l'on préfère
  qu'elles partent tout à fait : une colonne `parrain_id → users on delete
  cascade`. Mais elle ne doit jamais être lisible par le filleul, qui lit sa
  propre ligne (« ma ligne », pour l'écran et pour son export) : avec cet
  identifiant, il lirait le nom de son parrain (section 18.1), ce que Q7
  recommande de ne pas montrer. Il faudrait donc des droits de colonne sur
  `parrainages`, ou ranger ce lien dans une table que personne ne lit. Et le
  filleul ne pourrait PAS taper un autre code : « une seule pose réussie »
  vit dans la table des essais, qui survit au départ du parrain — sauf à
  décider exprès de la remettre à zéro. À trancher dans le cahier de R1 ;
- **la liste d'attente** (R2) : au passage de la liste à un compte, la
  ligne de la liste est effacée, adresse comprise (Q15). Son code vit alors
  dans `codes_parrainage`, rattaché au compte, et suit les règles ci-dessus.
  Si quelque chose de la ligne devait survivre au passage, il part avec le
  compte, par une clé écrite — pas un oubli.

La politique de confidentialité dit ces règles. Le code gardé seul, avec sa
date, n'y figure pas comme une donnée sur quelqu'un : tiré au hasard, il ne
désigne plus personne — à la différence d'un SIREN réservé, qui peut
désigner un entrepreneur individuel.

**Les droits.** RLS active ; `revoke all … from anon` sur les trois tables ;
`revoke insert, update, delete on codes_parrainage from authenticated` ;
`revoke insert, update on parrainages from authenticated` (le DELETE y reste,
pour le retrait du lien) ; aucun droit client sur la table des essais. Ce
n'est pas que la RLS seule laisserait passer une écriture : sans politique
d'écriture, rien ne passe déjà (`journal_ia` n'a aucun `revoke`, et un insert
direct y répond 403). Mais une table neuve de `public` naît avec INSERT,
UPDATE et DELETE pour les deux rôles, et le balayage de la section 42 bis ne
retire que TRUNCATE, REFERENCES, TRIGGER : le `revoke` est la seconde ligne
de défense, au cas où une politique trop large serait ajoutée un jour — la
convention du projet depuis les sections 18.2 et 41, et le modèle de
`preuves_tva`. Il rend aussi vraie la promesse « 401/403 sur les trois
verbes » (A.6) : sans le DELETE retiré, une suppression sur
`codes_parrainage` répondrait 204 sans rien supprimer, pas 403.

**La lecture.** Une seule politique de lecture par table, « ma ligne » :
`compte_id = auth.uid()` pour les codes, `filleul_id = auth.uid()` pour les
parrainages (c'est elle qui sert à l'écran « code non reconnu » et à l'export
du filleul). Le parrain ne lit **jamais** les lignes de ses filleuls. Ce qui
est secret, c'est le LIEN entre lui et eux, pas les noms : le nom de chaque
compte est déjà lisible par tout compte connecté (`grant select (id, type,
nom, avatar_url) on public.users`, section 18.1). Avec l'identifiant d'un
filleul, le parrain lirait donc son nom — « sans nom » ne tiendrait plus —,
et `profil_public()` lui rendrait en plus la ville d'un filleul particulier
s'il est lui-même pro. Les deux tables entrent dans `CLASSEMENT`
(`verifier-legal`) comme « soi », avec la forme exacte de leur règle ; la
table des essais comme « personne ». En R1, elles y entrent avec leur
RAISON ; la phrase de « Ce que les autres voient de vous » vient avec R2
(A.4).

**Retirer le lien** : une politique `for delete` limitée à sa propre ligne
de `parrainages`, comme le retrait d'un avis (section 52). Aucun corps de
fonction ne contient d'ordre de suppression : le connecteur refuse une
migration qui en porte un.

**Le hasard.** Il vient de `gen_random_uuid()` (cœur de PostgreSQL,
identique en local et sur Supabase), **en écartant les octets fixes d'un
UUID v4**, avec un tirage par rejet (un octet ne sert que s'il est < 240 =
8 × 30). **Jamais `random()`, jamais `gen_random_bytes`, qualifié ou non** :
sur Supabase, pgcrypto vit dans `extensions`, en local dans `public` — un
appel non qualifié marche dans tous les essais locaux et casse en production
seulement (mesuré le 03/11), et un appel écrit `extensions.gen_random_bytes`
casserait à l'inverse en local, tant que le prélude n'est pas aligné. Une
fois aligné, cet appel marcherait partout ; on ne s'en sert pas pour autant :
`gen_random_uuid()` suffit, et il est au même endroit en local et en
production. **R1 commence donc par aligner le prélude
local sur Supabase** (`supabase/local-prelude.sql`, ligne 34, aujourd'hui
`create extension if not exists pgcrypto;`) : `create schema if not exists
extensions;` puis `create extension if not exists pgcrypto with schema
extensions;`. Aucun SQL du dépôt n'appelle pgcrypto aujourd'hui : rien ne
casse, et un appel non qualifié échouera alors dans les essais locaux comme
en production, au lieu de passer en silence. L'essai sur la vraie base (avec
R2) relève qu'un compte jetable qui ouvre « Inviter » **a bien reçu un
code**.

**La fabrication.**

- **Une fonction privée fabrique tous les codes** — ceux des comptes et, en
  R2, ceux de la liste d'attente, pour qu'ils sortent du même tirage.
  `security definer`, et **aucun client ne peut l'exécuter** (son droit est
  retiré à `public`, `anon` et `authenticated`). Les codes ne sont jamais
  redonnés, donc leur nombre ne fait que monter : une collision finira par
  arriver, et elle est traitée dès le départ. Une collision recommence
  (`on conflict (code) do nothing` : la cible est NOMMÉE), dix fois au plus,
  puis une erreur nommée que l'essai provoque exprès en forçant des
  collisions. Sans cible, l'unicité du compte serait prise pour une
  collision : deux appels de `mon_code()` en même temps pour le même compte
  (deux appuis, deux téléphones) tourneraient dix fois, puis afficheraient
  « Lecture impossible ». `mon_code()` pose donc d'abord un verrou
  consultatif sur le compte (la méthode de `remonter_publication()`), puis
  relit : le second appel trouve le code du premier.
- **`mon_code()`** : `security definer`, `revoke … from public, anon` puis
  `grant execute … to authenticated` (en R2, voir plus bas) ; elle n'écrit
  que pour `auth.uid()`, rend le code du compte et le fait fabriquer s'il
  manque. Elle est appelée à l'ouverture d'« Inviter ». Aucun rattrapage en
  masse : elle le rend inutile, y compris pour une ligne `users` recréée
  après `preparer_suppression_compte()`.

**Le signe de contrôle.** Un algorithme de **Damm d'ordre 30**, qui garde
l'alphabet de 30 signes (il existe pour tout ordre, sauf 2 et 6). Il attrape
toute faute sur UN signe ET toute inversion de deux signes voisins. **Pas
Luhn « mod N »** : mesuré le 03/11 sur 20 000 codes, Luhn à 30 signes
attrape bien toutes les fautes d'un signe, mais laisse passer 0,23 % des
inversions voisines — celles de `2` et `Z`, le premier et le dernier signe
de l'alphabet, comme Luhn à 10 chiffres (celui du SIRET) laisse passer
« 09 » / « 90 ». L'autre voie sûre, une somme pondérée modulo 31,
demanderait un 31e signe réservé à la clé, que l'alphabet figé n'a pas. (Et
ce n'est pas un « ISO 7064 MOD 31,30 » : ce système n'existe pas dans la
norme.) C'est en R1, une fois la table de Damm choisie, que le dernier signe
de l'exemple `K7P-Q4MB` sera recalculé.

**Une règle, un fichier** : `src/lib/code-invitation.js` (qui n'importe
rien). La fonction SQL en est **engendrée**, jamais écrite à la main — comme
`cle_de_rapprochement` du lot P ; le fichier est recopié octet pour octet
dans la page `/i/CODE` et dans la fonction de la liste d'attente, et un
contrôle compare les copies (comme `siret.js` avec `verifier-siret`). Un
fichier de cas commun est joué par JavaScript et par PostgreSQL.

**La normalisation**, dans la base : le code est borné (32 signes) AVANT
tout autre traitement, puis on retire ce qui n'est pas une lettre ou un
chiffre, et les majuscules se posent par `translate(…, 'abc…z', 'ABC…Z')`,
**jamais par `upper()`** — la règle du lot P : aucune règle de casse qui
dépende de la langue. Cette normalisation vit dans une seule fonction SQL,
et son miroir JavaScript est comparé par le contrôle.

**`enregistrer_mon_parrain(code)`** :

- `security definer`, `revoke all … from public, anon` puis `grant execute …
  to authenticated` (en R2) ; filleul = `auth.uid()` et **aucun autre
  paramètre** ;
- le code borné puis normalisé (plus haut) ;
- refusé si un parrain est déjà posé ; si l'adresse du compte a été
  confirmée il y a plus de 7 jours (**`auth.users.email_confirmed_at`**,
  posée par le service d'authentification, jamais par le téléphone ;
  aujourd'hui, sans confirmation, elle vaut la date d'inscription — relevé
  le 03/11 sur les 14 comptes, écart maximal de 0,094 s ; et jamais
  `public.users.created_at`, qui se repose quand un client recrée sa ligne
  après `preparer_suppression_compte()`), ou si elle n'est pas encore
  confirmée (date vide : plus bas, « Le prélude local ») ; si c'est son
  propre code — celui de son compte, **ou celui de sa ligne de liste
  d'attente** (R2) quand l'adresse de cette ligne est celle du compte
  (refuser n'a pas besoin de prouver l'identité ; le même contrôle se refait
  au passage de la liste à un compte) ; si c'est le code d'un de ses filleuls (pas de cycle) ; si le code
  est libéré ;
- **deux sortes de refus.** **La même réponse** pour tous les refus qui
  portent sur le CODE (inconnu, libéré, le sien, celui d'un de ses filleuls)
  — sinon on essaierait des codes ; une réponse à part pour ce qui ne regarde
  que l'appelant (délai passé, adresse pas encore confirmée, parrain déjà
  posé, essais épuisés) : sans
  elle, « code non reconnu » ferait retaper un code juste jusqu'à épuiser ses
  essais ;
- les essais comptés, réussis ou non (5 par 24 h et par compte), et « une
  seule pose réussie » tenue même après un retrait — dans la table des
  essais (plus haut) ;
- elle ne rend **jamais** le nom, le type ni l'identifiant du titulaire du
  code (si vous répondez oui à Q7, ce nom viendrait d'une fonction à part,
  jamais de celle-ci) ; l'écran qui suit ne dit que « code enregistré »,
  « code non reconnu », ou ce qui ne regarde que la personne (le délai est
  passé…) ;
- avec la règle (a) de Q3, c'est elle qui pose `compte_le` quand le filleul
  a DÉJÀ une entreprise qui compte (plus bas) ;
- son essai commence par un **« cas 0 »** : un code valide enregistre BIEN
  une ligne. Sans lui, une fonction qui refuserait tout passerait pour une
  fonction qui refuse bien. Un code démesuré (10 Mo) y est aussi envoyé, pour
  prouver qu'il est coupé avant d'être lu.

**Si vous répondez « les données d'inscription » à Q8**, le code passe par
`cree_fiche_utilisateur`, réécrite À SON ENDROIT (section 13). Ces règles
s'imposent alors :

- lire le code APRÈS l'insertion dans `users`, donc après OP006 et OP007,
  qui continuent de bloquer ;
- le borner (`left(…, 32)`) et le normaliser par la même fonction ;
- enregistrer le parrainage dans UN bloc qui n'entoure que cet insert
  (`begin … exception when others then null; end;`, le modèle de
  `demandes_pro`) : un refus de contrainte ou de garde ne coûte jamais un
  compte ;
- des variables simples (`text`, `uuid`), aucun type de table né plus bas ;
- l'essai commence par un cas 0 (un code valide enregistre bien une
  ligne). Puis il montre qu'un code inconnu, un code de 10 Mo et un code
  refusé par une garde laissent tous naître le compte.

La table `parrainages` reste la seule source : le code n'est relu nulle
part ailleurs dans les métadonnées.

**La règle de ce qui compte**, écrite UNE fois, dans une fonction SQL. Avec
la règle (b) de Q3, `mes_filleuls()` l'appelle à chaque lecture (l'export
passe par `mes_filleuls()`). Avec (a), elle décide seulement quand poser
`compte_le`. Nulle part ailleurs :
`exists (select 1 from entreprise_registre e where e.pro_id = <filleul> and
e.retiree_le is null and (e.source = 'registre' or (e.source = 'essai' and
<le parrain a aussi une entreprise d'essai>) or (e.source = 'administration'
and <réponse à Q5>)))`. On écrit `exists` et non une jointure. Un compte
qui a déménagé ou mis à jour son entreprise porte aussi des lignes retirées.
Avec le filtre `retiree_le is null`, l'index `idx_entreprise_pro_active`
n'en laisse qu'une active par compte. Mais `exists` reste juste si ce filtre
change un jour (la règle (a), « a eu une entreprise »), là où une jointure
compterait deux fois. À un instant donné, une entreprise ne compte qu'une
fois : c'est tenu par `idx_entreprise_siren_active`.

**La règle « au badge », le jour d'une récompense.** Elle se calculera sans
rien ajouter aujourd'hui : `verifie` et `verifie_le` datent le badge en
cours, et le journal de l'administration (`pro_verifie`) garde chaque badge
accordé, même après un retrait du badge ou la suppression du compte. Aucune
colonne `badge_le` n'est donc posée en R1. Et si on en voulait une un jour,
un déclencheur `after update of verifie` ne la poserait jamais :
`admin_verifier_pro` ne nomme pas `verifie`, c'est le déclencheur BEFORE
`synchronise_verification` qui le pose, et PostgreSQL ne tient pas compte de
ce changement pour lancer un déclencheur « UPDATE OF » (mesuré : la date
reste vide).

**`compte_le` n'existe qu'avec la règle (a) de Q3.** Elle est alors posée
par la base, par `clock_timestamp()`, jamais remise à vide, et à DEUX
endroits : par un déclencheur sur `entreprise_registre` (une entreprise qui
compte et qui arrive plus tard : « Passer en compte professionnel », une
demande acceptée par l'administration, `rattacher_mon_siret()`, un
transfert) ET par `enregistrer_mon_parrain()` quand le filleul a DÉJÀ une
entreprise qui compte (la règle ci-dessus : active, et de la bonne source).
C'est le cas normal d'une inscription pro : l'entreprise est rangée par le
déclencheur d'inscription, et le code part juste APRÈS la création du compte
— un déclencheur seul ne la poserait donc jamais. Avec la règle (b), aucune
date n'est rangée : `mes_filleuls()` calcule le décompte à chaque lecture.
Une date que rien ne lit dans le même lot ne s'ajoute pas (la règle du
« bouton §18 »).

**`mes_filleuls()`** : `security definer`, `stable`, `revoke` de PUBLIC et
d'`anon`. Elle rend le nombre qui compte (selon la règle choisie à Q3 — le
nombre et la liste suivent toujours la même), le nombre des autres (et, en
R2, celui des personnes inscrites sur la liste d'attente avec son code), et
les noms de **`professional_profiles.entreprise`** (jamais l'identité lue au
répertoire, qui est privée), bornés à 120 signes ; **jamais un identifiant
de compte, jamais une date**. Un blocage entre le parrain et un filleul n'y
change rien, sauf si vous en décidez autrement (Q6). Si vous choisissez de
cacher le nom, c'est `est_masque(filleul)` écrit en toutes lettres dans
`mes_filleuls()` — une fonction `security definer` ne passe par aucune
politique. Et comme l'export appelle cette même fonction, cacher le nom à
l'écran seulement demanderait un chemin d'export à part : la liste de ce
que l'export ne rend pas (`EXCLUSIONS_DE_L_EXPORT`, `src/data/legal.js`) en
exclut « le fait même » d'être bloqué. La question ne se pose pas si vous
gardez « rien ne change ».

**L'export RGPD** : trois clés, ajoutées au premier objet de `mes_donnees()`
(31 clés aujourd'hui ; le contrôle en permet 45 par objet) :

- `mon_code_de_parrainage` : ma ligne de `codes_parrainage`, lue par la RLS ;
- `mon_parrainage` : le code que j'ai tapé et sa date, lus par la politique
  « ma ligne » — pas l'identité du parrain ;
- `mes_filleuls`, par `(select public.mes_filleuls())`, appelée DIRECTEMENT,
  comme `mon_compte()` et `ma_fiche_pro()` le sont déjà : l'export dit
  exactement ce que l'écran montre (des nombres, et pour les filleuls qui
  comptent le nom de leur fiche), jamais un identifiant ni une date.

La table des essais entre dans l'export, ou dans `EXCLUSIONS_DE_L_EXPORT`
avec sa raison — à trancher dans le cahier de R1.
**`mes_donnees_sans_masquage()` n'est PAS touchée** : elle sert à ce que la
RLS cacherait À TORT, et le parrainage est caché à dessein. Les bornes en
NOMBRE de la section 53 ne sont pas nécessaires au premier lot : chaque
filleul nommé suppose une preuve Sirene (limites de la fonction `siret`, un
SIREN par compte). Ce qui se borne, c'est le TEXTE écrit par un tiers : le
nom de la fiche n'a aucune limite de longueur en base. Dans R1, on le borne
à la SORTIE : `left(…, 120)` dans `mes_filleuls()` (120, comme
`demande_pro_entreprise_check` et `NOM_ENTREPRISE_MAX`). Le borner à la
source, par une contrainte `pro_entreprise_check`, est juste, mais se fait
dans un lot à part : une contrainte refuse aussi chaque écriture NOUVELLE,
et trois chemins écrivent aujourd'hui ce nom sans que la base le coupe :

- le déclencheur d'inscription (`cree_fiche_utilisateur` recopie
  `meta ->> 'entreprise'`, envoyé par le téléphone) ;
- `devenir_pro()` (`p ->> 'entreprise'`) ;
- « Modifier mon profil » (son champ « Nom de l'entreprise » n'a pas de
  `maxLength`).

L'écran d'inscription et « Passer en compte professionnel » limitent bien
la saisie à 120 signes, mais un téléphone modifié envoie ce qu'il veut.
Posée seule, la contrainte ferait échouer une inscription (« Database error
saving new user ») pour un nom trop long — contraire à la règle « une
métadonnée malformée ne coûte jamais un compte » (section 31) — et
l'enregistrement du profil, avec le message anonyme d'une contrainte
inconnue. Ce lot-là coupera le nom dans le déclencheur et dans
`devenir_pro()`, posera `maxLength` dans « Modifier mon profil », et donnera
sa phrase à la contrainte dans `erreurs.js`. Il touche le déclencheur
d'inscription : il ne fait pas partie du parrainage.

**Les droits d'appel en R1 (proposé).** Si R1 est appliqué sur la vraie base
avant R2, `mon_code()` et `enregistrer_mon_parrain()` y restent appelables
par personne : leur `grant execute … to authenticated` arrive avec R2 et ses
textes. Les essais de R1 accordent ce droit dans leur propre transaction.
`mes_filleuls()`, qui ne fait que lire, est accordée dès R1 : l'export
l'appelle, et un export qui appelle une fonction interdite à l'appelant
échoue en entier.

**Les listes fermées.** Les quatre fonctions `security definer` du lot
(la fabrication, `mon_code()`, `enregistrer_mon_parrain()`,
`mes_filleuls()`) entrent dans `DEFINER_ATTENDUES` (`verifier-lectures`) avec
leur raison : la liste exige l'ensemble EXACT des fonctions `security
definer`, et une fonction nouvelle oubliée la fait rougir. Dans l'essai 49,
`mes_filleuls()` entre au cas 27b dès R1. `mon_code()` et
`enregistrer_mon_parrain()` entrent au cas 27c tant que leur droit d'appel
n'est pas accordé (en R1, si la proposition ci-dessus est retenue), puis
passent au cas 27b avec R2. La fabrication, qu'aucun client ne peut appeler,
reste au cas 27c : il rougira donc à coup sûr dès R1.

En R2, la fonction du passage de la liste à un compte (§4) les rejoint :

- `security definer`, `revoke all … from public, anon`, puis `grant
  execute … to authenticated` ;
- elle n'agit que pour `auth.uid()` ;
- elle exige une entrée de la liste confirmée, et soit l'adresse du compte
  confirmée (`auth.users.email_confirmed_at`) et égale à celle de la liste,
  en minuscules (chemin 1), soit le lien touché depuis le compte
  (chemin 2) ;
- elle fait tout dans une seule transaction.

**Le prélude local** (`supabase/local-prelude.sql`, dont le faux
`auth.users` n'a aujourd'hui que trois colonnes : `id`, `email`,
`raw_user_meta_data`) reçoit `auth.users.email_confirmed_at` par `alter
table auth.users add column if not exists`, pour rester rejouable — DANS LE
MÊME LOT que la fonction qui la lit. L'essai franchit la fenêtre des 7 jours
en vieillissant cette date en `postgres` — 8 jours : refusé ; 6 jours :
accepté ; puis une seconde fois : refusé —, après un « cas 0 » qui prouve
que les comptes de l'essai existent, ont une date de confirmation, et que le
parrain a un code ; jamais avec l'heure du téléphone. Une date de
confirmation VIDE refuse, avec une réponse à part (« confirmez d'abord
votre adresse »). Écrit `email_confirmed_at < now() - 7 jours`, ce test
vaut `null` sur une valeur vide : le refus ne partirait pas, et un compte
sans date poserait un parrain sans limite de temps (la leçon « `not x` vaut
`null` » du lot 0a). Un cas de l'essai le prouve.
**Pas de garde « compte anonyme »** : les connexions anonymes sont fermées
sur le projet (`POST /auth/v1/signup {}` répond 422
`anonymous_provider_disabled`), et la base n'en compte plus aucune depuis le
20/10. Une règle sans raison ne se pose pas ; si on les ouvre un jour, la
question revient.

### A.2 L'application (R2)

**Le champ du code.** Replié derrière une ligne de 44 points, après le mot de
passe et avant la case des CGU, dans le bloc commun du formulaire : il
apparaît donc pour un particulier, pour un pro après « Oui, c'est mon
entreprise », et dans la porte de secours ; jamais en mode connexion.
`autoCapitalize="characters"`, `autoCorrect={false}`, `spellCheck={false}`,
`autoComplete="off"`, et **aucun `maxLength` serré** (80, par exemple) : sur
iPhone, un texte COLLÉ est coupé à la longueur maximale (lu dans le code de
React Native, `RCTBaseTextInputView.mm`), et un lien collé dans un champ de
10 signes deviendrait « https://op » — un code « non reconnu », sans un mot.
La personne peut donc coller le lien ou le message entier. Opus en tire le
code : ce qui suit `/i/` ; sinon la forme affichée (3 signes, un tiret ou
une espace, 4 signes) ou un mot de 7 signes de l'alphabet, en retenant le
premier dont le signe de contrôle est bon. Il l'affiche remis en forme. Un
contrôle le fait tourner sur le message exact de `invitation.js`, avec et
sans son adresse. Contrôle de forme local avant tout envoi.

**Le clavier.** Replié, le champ ne peut pas être atteint, donc le mot de
passe porte « Terminé » (aujourd'hui il affiche « Suivant » à l'inscription,
et la touche ne mène nulle part : `AuthScreen.js`, `returnKeyType` à `'next'`
et `onSubmitEditing` vide) ; déplié, le mot de passe mène au code, qui porte
« Terminé » à son tour.

**Le code tapé part APRÈS `signUp`**, par `enregistrer_mon_parrain()`. Si la
confirmation par e-mail est un jour activée, il attend sur le téléphone la
première connexion, puis s'efface — dit dans « Cookies et traceurs », comme
le message d'une demande pro. Avec le même défaut que ce message : confirmé
puis ouvert sur un AUTRE appareil, le code est perdu en silence ; c'est le
prix de ce choix (Q8). L'écran « Vérifiez votre boîte mail » dit alors
seulement : « Votre code sera contrôlé à votre première connexion. » Et
c'est à cette première connexion qu'Opus dit, une fois, par un bandeau avec
un bouton vers « Le code de mon parrain », que le code n'a pas été reconnu.

**Partager.**

- **« Partager » passe par une fonction à part**, `src/lib/invitation.js`.
  On ne réutilise pas `partagerPost` (`src/lib/partage.js`) : sa ligne 51
  annonce « Publication partagée. » même quand on referme la feuille sans
  rien envoyer sur Android — un défaut du code déjà en place, à corriger à
  part. Le message est construit depuis `DOMAINE` (`src/data/legal.js`),
  jamais écrit en dur : deux ou trois lignes, le code dans le texte,
  l'adresse SEULE sur la dernière ligne ; il vit dans une SEULE constante,
  dans un fichier que `node` peut ouvrir (il n'importe que
  `src/data/legal.js`, qui lui-même n'importe rien), pour qu'un contrôle
  puisse la lire. Les
  options : `title` « Invitation sur Opus » (sur Android, c'est l'objet d'un
  courriel), `subject` sur iPhone, `dialogTitle` « Inviter un collègue » sur
  Android.
- **Le champ `url`** : sur Android, jamais — il y est ignoré. Sur iPhone,
  c'est un choix à faire AU DOIGT entre deux formes : (a) le message seul,
  l'adresse dedans ; (b) le texte SANS l'adresse, avec `url` à part. On garde
  celle qui donne, dans WhatsApp, Messages, Messenger et Mail, le lien UNE
  fois et le code. Pourquoi ne pas trancher d'avance : Messenger, que vous
  avez cité, pourrait ne garder que l'adresse (règle de Meta, non mesurée),
  et c'est alors justement l'adresse passée à part qui sauverait le lien.
- **Le résultat de `Share` n'est jamais lu comme un envoi** : aucun bandeau
  « invitation envoyée », aucun compteur, et aucune lecture de
  `activityType` (l'enregistrer serait un traçage non annoncé). Android
  répond toujours « partagé », et l'iPhone aussi pour « Copier ».
- **Le bouton n'attend pas la réponse pour se libérer** : si l'artisan
  choisit une application puis annule dedans, l'iPhone peut ne jamais
  répondre (lu dans le code de React Native, non mesuré), et un bouton qui
  attendrait resterait bloqué.
- **Au navigateur** : une branche à part (`navigator.share` s'il existe,
  sinon copier le texte), qui ne lit jamais le résultat.
- **Aucune adresse morte** : `verifier-parrainage` refuse toute adresse
  `opus-project.com/i/` écrite à la main dans `src/`, et refuse une adresse
  dans le message tant qu'un drapeau `PAGE_INVITATION_EN_LIGNE`, coché par un
  humain après avoir mesuré que la page répond 200, n'est pas vrai : c'est
  ce qui empêche qu'un lien mort parte un jour par oubli.

**Trois états** pour le code et pour le décompte : chargement, « Lecture
impossible » avec « Réessayer », prêt.

**« Copier le code » (Q13).** Aucun module natif ajouté en R2. Le code est
un `<Text selectable>`. Pour un vrai bouton, deux voies :

- (a) `Clipboard.setString` de `react-native` : il est déjà compilé dans le
  build actuel, sur iPhone et sur Android, donc rien à reconstruire. Il est
  déclaré obsolète, mais l'avertissement ne s'affiche qu'en développement,
  et il ne disparaîtrait qu'avec une montée de React Native, c'est-à-dire une
  migration de SDK, qui demande de toute façon une reconstruction. L'appel
  passe par UNE fonction de `src/lib/`, dans un `try`/`catch` : un échec dit
  « Copie impossible, appuyez longuement sur le code ». À la migration, on
  remplace cette seule fonction par `expo-clipboard`. Au navigateur, la copie
  passe par `navigator.clipboard`, comme dans `src/lib/partage.js`. Une autre
  relecture déconseille ce presse-papiers obsolète : c'est pour cela que
  c'est votre choix, pas une évidence ;
- (b) `expo-clipboard`, installé et construit AVANT le code qui l'importe,
  avec une reconstruction déjà prévue (celle du PDF du devis, au lot 2, ou
  R3).

Si Opus affiche « Code copié », il ne doit pas doubler la confirmation
qu'Android 13 et plus affiche lui-même (à vérifier dans la documentation
d'Android avant de l'écrire).

### A.3 La page et la liste d'attente (R2)

**La fonction de la liste d'attente** (une fonction Edge, sans compte) :

- elle **ne juge pas** le code du parrain : elle range ce qui a la forme d'un
  code et ignore le reste. Toutes ses issues en HTTP 200, et **la même
  réponse**, que le code soit connu, inconnu ou mal formé, que l'adresse
  soit déjà sur la liste ou non. L'e-mail de confirmation est le même aussi
  (§4). Aucune lecture d'un code de parrain avant la confirmation ; le
  rapprochement avec un parrain ne se fait qu'à la confirmation, côté base ;
- ses limites sont comptées et décidées dans le même ordre (la règle de la
  fonction `siret`) : sur l'empreinte HMAC de l'adresse IP (lue dans
  `cf-connecting-ip` puis `x-real-ip`, jamais `X-Forwarded-For` ; le /64
  d'une IPv6), sur un seau global, et — règle **nouvelle**, la fonction
  `siret` ne compte rien par adresse e-mail — sur l'empreinte HMAC de
  l'adresse e-mail en minuscules (par exemple une confirmation par adresse
  et par 24 h), jamais l'adresse en clair : c'est l'adresse d'un tiers, que
  n'importe qui peut taper. Au-delà, la réponse reste la même et **aucun
  e-mail ne part** ;
- l'origine web se vérifie par la règle existante (`origineAutorisee` :
  `https://opus-project.com` **et** `https://www.opus-project.com`, à revoir
  quand l'hébergement sera choisi). Mais ce contrôle n'arrête qu'un
  navigateur : une requête sans origine passe, et un script choisit ses
  en-têtes. **Contre un envoi d'e-mails en masse, la défense, ce sont les
  limites** (et un défi anti-robot si elles ne suffisent pas).

**L'envoi des e-mails de la liste.** Le domaine n'est prêt que pour un envoi
PAR IONOS : son SPF n'autorise que `_spf-eu.ionos.com` (relevé le 03/11 ;
courrier `mx00` et `mx01.ionos.fr`). Un autre fournisseur demande d'ajouter
son SPF et sa clé DKIM au domaine.

**La page** reprend `src/lib/code-invitation.js` octet pour octet (A.1), et
insère le code par `textContent`, jamais comme du HTML. Côté serveur, la
règle de réécriture ne laisse passer que des lettres, des chiffres et des
tirets, et ne recopie jamais l'adresse telle quelle dans la page.

**L'hébergement.** Mesuré le 03/11 : le domaine est servi par un Apache
d'IONOS, vide (403 à la racine), dont le correcteur d'orthographe
(`mod_speling`) est actif. `/i/CODE` y est redirigé (301) vers `/./CODE`, qui
répond 404. La page ne marchera donc qu'avec une règle de réécriture
INTERNE, sans redirection, dans un fichier `.htaccess` — par exemple
`RewriteRule ^i/([A-Za-z0-9-]{4,12})/?$ /invitation.html [L]` — et, si
l'hébergement le permet, `CheckSpelling Off`. À mesurer après dépôt :
`/i/CODE` rend 200, en minuscules comme en majuscules. Le 300 de
`/.well-known/…` vient seulement de ce que les fichiers n'existent pas
encore : une fois déposés (R3), le correcteur n'intervient plus. Ils devront
être servis SANS redirection (Android l'exige ; à viser aussi pour
l'iPhone), `assetlinks.json` en `application/json` (exigé par Google). Pour
`apple-app-site-association`, le type `application/json` est une
précaution : la documentation actuelle d'Apple ne l'exige pas. Il faut donc
choisir dès R2 un hébergement qui accepte un `.htaccess`, ou un hébergeur
statique équivalent.

**Les mentions légales de la page** (premier site public). L'éditeur est
celui que vous désignez avant R2 (votre SARL, probablement : la question
vous sera posée, pas déduite). Le régime est celui de la LCEN,
**article 1-1, I** — la loi SREN (n° 2024-449, art. 48) a créé cet article
et récrit l'article 6, dont le « III » parle désormais des fournisseurs
d'accès à internet ; les sanctions sont à l'article 1-2 (Service Public,
fiche F37351, que le site date « Vérifié le 13 octobre 2026 »). Il faut,
pour une société : dénomination, siège social, téléphone, capital et numéro
d'immatriculation ; pour une personne : nom,
prénoms, domicile et téléphone ; dans les deux cas, le directeur de la
publication, et le nom, l'adresse et le téléphone de l'hébergeur de la page.
La dispense de l'article 1-1, II (éditeur non professionnel) ne vaut pas
pour une page de pré-lancement commerciale. Ces mentions se remplissent avec
vous, depuis vos pièces.

**Sans attendre R2, dans un petit lot à part** : remplacer la référence
périmée « 6-III » partout où elle est écrite — `src/data/legal.js` (l.433,
l.581, l.894), `scripts/verifier-legal.mjs` (l.183, l.1779) et
`docs/A-FAIRE.md` (l.31) — par l'article 1-1 (II pour la dispense d'un
éditeur non professionnel, I pour l'hébergeur), en relisant le texte sur
Légifrance au moment de corriger. Le texte de la l.894 n'est affiché que si
`STATUT` vaut `'particulier'` (il vaut `'essai'`) : `VERSION` n'a pas à
changer pour lui.

### A.3 bis Les liens universels (R3)

Rien de ceci ne se vérifie dans le conteneur : à l'iPhone (build de
développement, en passant par la page de lancement) et sur un vrai Android.

- iPhone : `ios.associatedDomains: ['applinks:opus-project.com']` dans
  `app.json`. C'est une reconstruction ; vérifier au premier build qu'EAS a
  bien ajouté la capacité « Associated Domains » à l'identifiant de
  l'application.
- iPhone : `/.well-known/apple-app-site-association`, sans extension, en
  HTTPS, rendu en 200 sans aucune redirection (Apple ne suit pas les
  redirections pour ce fichier). `appIDs` vaut `<TeamID>.com.opusproject.app`
  ; chemins limités à `/i/*` (puis `/p/*` le jour du QR), avec
  `caseSensitive: false`.
- Android : `intentFilters` avec `autoVerify`, `https`, `opus-project.com`,
  `pathPrefix /i/`. Sur Android, le chemin tient compte de la casse :
  l'application fabrique donc toujours le lien en majuscules.
- Android : `/.well-known/assetlinks.json`, en `application/json`, sans
  redirection, avec DEUX empreintes SHA-256 : celle du certificat d'EAS (les
  constructions internes) et celle de Play App Signing (la version du
  magasin, que Google signe avec une autre clé ; elle n'existe qu'à la
  création de l'application dans la Play Console).
- Les deux fichiers en ligne AVANT d'installer la construction : le réseau
  d'Apple les relit sous 24 h, les téléphones environ une fois par semaine,
  et Android vérifie au moment de l'installation.
- Côté application, aucun paquet nouveau : `Linking.getInitialURL` et
  l'événement `'url'` suffisent. Un code reçu par un lien est **lu une seule
  fois** (au démarrage, puis à chaque lien reçu application ouverte) : le
  relire à chaque affichage remettrait un code que la personne a retiré. Il
  est gardé au-dessus de l'écran d'inscription, avec une copie sur le
  téléphone qui expire (48 h, par exemple), pour survivre au changement de
  type de compte et à la fermeture d'Opus pendant que l'artisan cherche son
  SIRET ; revenir à l'étape du SIRET ne l'efface pas. Le cas d'un compte
  connecté : Q18.
- Android, plus tard et seulement si on le décide : le « référent
  d'installation » (Play Install Referrer). Si la personne installe depuis le
  Play Store par un lien qui porte le code (`…&referrer=CODE`), l'application
  peut le relire après l'installation. La bibliothèque est déjà dans les
  dépendances du projet (`expo-application` 57.0.3, amené par
  `expo-notifications`) : il suffira de la déclarer dans `package.json`, à
  la même version. Le vrai coût est ailleurs : aucune version Android
  d'Opus n'a encore été construite, et il faudra un compte Google Play
  Console. Lire ce
  référent, c'est lire une information rangée dans le téléphone : l'article
  82 de la loi Informatique et Libertés s'y applique (lignes directrices de
  la CNIL, §13-14). On ne le lit donc jamais tout seul au premier lancement,
  seulement sur un geste exprès (« J'ai reçu un lien d'invitation ») ; que ce
  geste dispense du consentement est à faire confirmer par un juriste.
- Le certificat du domaine expire le 30/11/2026 (relevé le 03/11) : vérifier
  son renouvellement avant tout essai — un certificat expiré casse les deux
  fichiers.

### A.4 Les textes (R2)

- **Politique de confidentialité** : dans « Ce que nous collectons » : votre
  code de parrainage, le code que vous avez tapé et sa date — donc qui a
  invité qui ; **pourquoi** — montrer au parrain le résultat de ses
  invitations et, si Opus crée un jour des récompenses, pouvoir compter les
  invitations faites avant (annoncé dès la première collecte : une finalité
  se fixe à la collecte) ; **sur quelle base** — pour le parrain, l'exécution
  du contrat, c'est-à-dire les CGU ; pour le filleul, l'intérêt légitime
  d'Opus, avec une mise en balance écrite ; le jour où un règlement de
  récompenses existera, la base sera revue, et le retrait avec elle ;
  combien de temps (les règles de départ de A.1) ; l'export ; **qui le
  voit** : le parrain est nommé comme DESTINATAIRE (RGPD, art. 13.1.e) — ce
  qui est nouveau, c'est le LIEN « cette personne s'est inscrite avec votre
  code », pas le nom de la fiche, déjà lisible ; et le **retrait du lien** :
  c'est le droit d'opposition, présenté clairement et à part de tout le
  reste (art. 13.2.b et 21.4), avec l'endroit où le faire (« Le code de mon
  parrain », sur le profil). Si vous choisissez (b) à Q3 : la phrase de
  « Ce que les autres voient de vous » le dit (plus bas). Si vous choisissez
  « les données
  d'inscription » à Q8 : la copie qui y est rangée est nommée. Et
  « À qui vos données sont transmises » nomme le service d'envoi des
  e-mails de confirmation des comptes, dès que l'application s'en sert
  (§4, préalable 3).
- **« Ce que les autres voient de vous »** : « Si vous vous inscrivez avec le
  code d'une personne, elle voit qu'une personne s'est inscrite grâce à
  elle — sans votre nom, mais elle sait souvent à qui elle a envoyé son
  lien. Dès qu'une entreprise est rattachée à votre compte, elle le voit,
  avec le nom d'entreprise de votre fiche : ce rattachement n'est pas public
  par ailleurs. [Avec la règle (b) de Q3 :] Si cette entreprise vous est
  retirée, votre nom quitte sa liste. Elle ne voit jamais la date de votre
  inscription, ni votre adresse, ni l'identifiant de votre compte. » Le nom
  de la fiche est déjà public ; ce qui est NOUVEAU, c'est le LIEN « inscrit
  avec mon code », et le fait que le compte porte une entreprise (privé :
  `entreprise_registre` n'est lisible que par son titulaire et
  l'administration). La phrase s'écrit EXPRÈS :
  `verifier-legal` classe les tables par leurs règles de lecture et ne voit
  pas ce qu'une fonction `security definer` montre au parrain, donc il ne la
  réclamera pas. Il garde en revanche l'empreinte de cette section : à mettre
  à jour, avec `VERSION`.
- **« Ce que nous ne collectons pas »** : « Opus ne lit jamais les contacts
  de votre téléphone ni votre presse-papiers. » La phrase et la garde de A.6
  se tiennent l'une l'autre : le contrôle refuse les modules sans condition,
  et refuse que la phrase disparaisse.
- **« Cookies et traceurs »** : le code tapé qui attend sur le téléphone la
  première connexion, si la confirmation par e-mail est activée (A.2).
- **CGU** : le parrainage n'ouvre aucun droit tant qu'un règlement n'existe
  pas. `VERSION` change. Mais Opus ne fait ré-accepter ses conditions à
  personne : la clause ne sera acceptée que par les comptes créés, ou passés
  professionnels, après sa publication (`cree_fiche_utilisateur`,
  `devenir_pro`) — donc par chaque personne de la liste d'attente qui
  s'inscrira. Les comptes qui existent déjà, qui pourront eux aussi ouvrir
  « Inviter » et recevoir un code, ne l'auront jamais acceptée (point ouvert
  de `docs/A-FAIRE.md`, à régler avant que `STATUT` quitte `'essai'`). C'est
  une raison de plus pour qu'un futur règlement soit accepté à part (§6). La
  protection qui vaut pour tous n'est pas cette clause : c'est qu'aucune
  récompense n'est promise, ni dans l'application, ni sur la page `/i/CODE`.
- **Créer le registre des traitements du responsable** (RGPD, art. 30.1) —
  il n'existe pas encore — avec la liste d'attente et le parrainage. Ce
  n'est pas le registre de sous-traitant (art. 30.2) prévu pour le carnet de
  clients, qui n'existe pas non plus (case non cochée de `docs/A-FAIRE.md`) ;
  et la dispense des moins de 250 salariés ne joue pas, ces traitements
  n'étant pas occasionnels.
- **Les textes de la page** : §4, préalable 4, et A.3.

### A.5 Les essais sur la vraie base (avec R2)

R1 se vérifie sur la vraie base par l'empreinte de son catalogue, et par UN
appel. `mes_donnees()` change dès R1 pour TOUS les comptes : trois clés de
plus, dont `mes_filleuls()`, accordée dès R1. Or un export qui échoue
échoue en entier. Un compte jetable (un particulier suffit) appelle donc
`rpc/mes_donnees` par le chemin de l'application : les trois clés sont là,
vides, et rien d'autre n'a bougé (la leçon du lot S-d). Puis ce compte est
supprimé. Les fonctions qui écrivent un code ou un lien n'y sont appelables
par personne : leur essai par le chemin de l'application se fait avec R2.

Parrain et filleuls sont tous des **comptes jetables**, à SIRET fictifs ;
**jamais le code d'un vrai compte**, en particulier pas le vôtre. Les deux
preuves `essai` déjà en base sont réécrites par le connecteur en écriture,
**avec votre accord**, pour l'adresse exacte des deux comptes pro (une
preuve `essai` ne vaut que pour UNE adresse).

**Deux preuves, deux portées.** En local, un fichier d'essais éprouve la
base : code reconnu, casse et espaces, code inconnu, code démesuré (jusqu'à
10 Mo), son propre code, parrain posé qui ne change plus, retrait,
suppression. Sur la vraie base, uniquement par le chemin de l'application
(`/auth/v1/signup` puis `enregistrer_mon_parrain()`, et au navigateur,
`enregistrer_vues` neutralisé) : un code inconnu ou démesuré (à une taille
raisonnable, par exemple 10 000 signes — la limite de taille de la
passerelle n'est pas établie) laisse **un compte créé**, jamais « Database
error saving new user ».

**Les cas à jouer** : A, pro ; B, pro, filleul de A ; P, particulier, avec
le code de A tapé en minuscules et avec des espaces ; Q, avec un code
inconnu ; `mes_filleuls` lu par A, par B et par un visiteur ; une écriture
directe refusée ; l'export `mes_donnees` de A, de B et de P ; l'ajout
tardif par Q, qui a d'abord ouvert « Inviter » (son propre code refusé,
puis le code de A accepté, puis une seconde pose refusée) ; le retrait du
lien par Q (le décompte de A suit) ; B supprimé par le chemin de
l'application (le décompte de A baisse, et le SIREN de B est libéré) ; enfin
P passe en compte professionnel, avec la preuve `essai` de B re-pointée sur
son adresse, et devient compté.

**Les restes.** La suppression emporte les parrainages (clé `on delete
cascade`). Les codes des comptes jetables, eux, restent — c'est la règle —,
sans compte et libérés : c'est attendu et sans effet, ils ne désignent
personne et ne comptent nulle part, sans qu'aucune colonne `essai` soit
nécessaire. Et puisqu'un code ne naît qu'à la première ouverture
d'« Inviter », un compte jetable qui ne l'ouvre pas n'en laisse pas. Le
connecteur refuse un `delete` : le ménage relève le nombre de codes sans
compte AVANT et APRÈS l'essai, et le compte rendu écrit l'écart (par exemple
« + 2 codes d'essai sans compte ») ; les effacer vous appartient, dans
l'éditeur SQL, si vous le souhaitez. Après le ménage, une requête de FORME
vérifie qu'aucun parrainage d'un compte jetable ne reste.

**Non fait, avec sa raison** : l'inscription avec confirmation par e-mail —
coupée sur le projet, et aucun outil du connecteur ne change ce réglage. Ce
qui reste invérifié : le code tapé qui attend sur le téléphone la première
connexion, puis s'efface (A.2).

### A.6 Chaque promesse, et ce qui la tient

Le mot « essai » dans ce tableau désigne un fichier
`supabase/essais-section-NN.sql`, rejoué deux fois sur une base neuve, qui
commence par un « cas 0 » (la donnée EXISTE : sans elle, un refus ne prouve
rien) et éprouve chaque règle RLS par `set local role`, chacun dans son
propre ordre, jamais dans un bloc `do`. Il ne tourne qu'à la main :
`npm run verifier` ne joue aucun essai SQL.

| promesse | tenue par |
|---|---|
| le code n'est jamais redonné ; il ne change jamais, sauf une fois en R2, tant qu'il n'a servi à personne (§1) | clé primaire, aucun droit d'écriture client sur `codes_parrainage` (INSERT, UPDATE et DELETE retirés), `libere_le` posé par la base ; essai : 401/403 sur les trois verbes |
| un code n'empêche jamais l'inscription | avec la réponse recommandée à Q8, le déclencheur d'inscription n'est PAS touché (avec l'autre réponse, le code y est lu dans un bloc étroit qui avale toute erreur, comme celui de la demande pro : A.1) ; essai par `/auth/v1/signup`, puis `enregistrer_mon_parrain()` appelée avec un code de 10 000 signes, un objet JSON, le code d'un compte supprimé et son propre code : chaque fois la même réponse, et le compte reste entier, pro comme particulier |
| aucun essai de code sans compte | aucune fonction exécutable par `anon` (`has_function_privilege`) ; une page qui ne demande rien à la base ; une fonction de liste d'attente qui ne juge pas le code (même réponse, même e-mail) |
| un seul parrain, jamais soi-même, pas de cycle | clé primaire + `enregistrer_mon_parrain()` ; essai |
| un code libéré se comporte comme un code inconnu ; un code de la liste d'attente encore sans compte accepte | `libere_le` posé par la base ; essai : C s'inscrit avec le code d'un compte supprimé → même réponse qu'un code inventé, et C peut encore poser un autre code ; en R2, B s'inscrit avec le code de A, encore sur la liste sans compte → parrainage enregistré |
| une faute de frappe ne coûte pas ses essais pour rien | deux sortes de refus dans `enregistrer_mon_parrain()` (le code ; ce qui ne regarde que l'appelant) ; essai |
| le parrain ne voit que des noms de fiche et des nombres, jamais une date ni un identifiant | `mes_filleuls()` seule porte, listes fermées, essai qui relit ce qu'elle rend ; l'export l'appelle directement |
| un blocage ne change pas ce que le parrain voit (sauf si vous décidez l'inverse, Q6) | essai : après un blocage, dans un sens puis dans l'autre, le parrain lit le même nom et le même nombre ; si vous choisissez de cacher le nom, `est_masque(filleul)` dans `mes_filleuls()` et un chemin d'export à part (l'export ne dit jamais qu'on est bloqué : `EXCLUSIONS_DE_L_EXPORT`, A.1), et l'essai s'inverse |
| aucun contact lu, aucun envoi automatique, aucun presse-papiers lu | une garde de `verifier-legal` : un refus SANS condition de `expo-contacts`, `react-native-contacts`, `READ_CONTACTS`, `NSContactsUsageDescription`, de la permission Android `SEND_SMS` (c'est elle qui enverrait sans un geste de l'artisan), de toute lecture du presse-papiers (en laissant passer l'écriture), de toute lecture de `activityType` dans `src/`, et de toute fonction Edge qui enverrait une invitation ; et, par CHOIX — « une seule porte d'envoi : le menu de partage » —, de `expo-sms` et des adresses `sms:`, qui n'envoient rien seuls (ils ouvrent la fenêtre d'envoi, c'est l'artisan qui appuie). Ce n'est pas une copie de la garde de la position, qui dépend d'une phrase déjà écrite dans les textes |
| aucune adresse morte dans un message | `verifier-parrainage` : aucune adresse `opus-project.com/i/` écrite à la main dans `src/`, et aucune adresse dans le message tant que `PAGE_INVITATION_EN_LIGNE` n'est pas coché par un humain, après une mesure à 200 |
| aucun montant, aucun « gagnez », jamais « vérifié » pour ce niveau, aucun magasin annoncé avant d'y être | une seule constante du message, dans un fichier qui n'importe que `src/data/legal.js` (pour `DOMAINE`) ; les textes ET les écrans du parrainage relus par un contrôle, sur le modèle des mots de `verifier-siret` : « € » et tout montant, « gagn », « palier », « gratuit », « offert » refusés, et aussi « vérifi », « registre » (on dit « répertoire Sirene ») et « certifi » ; « App Store » et « Play Store » refusés tant qu'Opus n'y est pas publié |
| la page ne nomme jamais le parrain, et n'affiche qu'un code de forme exacte, en deux groupes, comme du texte | un contrôle, seulement si la page vit dans le dépôt (Q2) ; tant qu'elle vit ailleurs, rien ne le tient |
| la liste d'attente ne passe à un compte que sur une adresse prouvée | `verifier-legal` ou la procédure d'ouverture : le passage n'est pas mis en service sans l'une des deux preuves (§4) ; essai |
| le format est le même partout | `code-invitation.js` : la fonction SQL en est engendrée ; la page et la fonction de la liste d'attente en sont des copies octet pour octet ; un contrôle compare les copies et joue un fichier de cas par JavaScript et par PostgreSQL |

**Les contrôles.** Un contrôle nouveau, `npm run verifier-parrainage`, fera
tourner le module pur (`src/lib/code-invitation.js`) sur le fichier de cas,
et vérifiera l'export : les trois clés, l'appel direct à `mes_filleuls()`,
l'absence de tout identifiant de filleul, et la borne de 120 signes.
Et dans le même lot, avec leur raison, on met à jour ce qui rougira :

- dans `npm run verifier` : la liste fermée `DEFINER_ATTENDUES` de
  `verifier-lectures`, pour les quatre fonctions `security definer` du lot
  (A.1) ; l'empreinte de `mes_donnees` dans `EMPREINTES`
  (`verifier-lectures`) ; le `CLASSEMENT` de `verifier-legal`, pour les
  **trois** tables nouvelles (les deux du parrainage « soi », avec la forme
  exacte de leur règle « ma ligne » ; la table des essais « personne ») ;
  l'empreinte de `EXCLUSIONS_DE_L_EXPORT`, si ce texte change (A.1) ; en
  R2, les empreintes des sections de la politique que les textes changent
  (tableau `TEXTES` de `verifier-legal`) : « Ce que nous collectons », « Ce
  que les autres voient de vous », « Combien de temps », « Cookies et
  traceurs », et « À qui vos données sont transmises » le jour où le service
  d'envoi y entre — avec `VERSION` et son historique ; `ATTENDUES_SD` ne
  bouge pas : c'est la liste du lot S-d ;
- dans les essais SQL, rejoués à la main : le cas 27b de l'essai 49
  (`mes_filleuls()` dès R1, puis `mon_code()` et `enregistrer_mon_parrain()`
  avec R2) ; le cas 27c (la fabrication, et en R1 les deux fonctions dont le
  droit d'appel attend R2), qui rougira à coup sûr ; le cas J1 de l'essai
  51d (les clés de l'export). J1 bis n'est pas concerné : `mes_filleuls` est
  appelée directement par `mes_donnees()`, pas par
  `mes_donnees_sans_masquage()` ;
- les dates : les trois tables, avec leur `created_at`, entrent dans
  `EXCLUES` de `verifier-remontee`, et leur raison dans la section 52.1
  (A.1).

Le balayage de la section 43 (automatique) et `cree_fiche_utilisateur` (pas
touchée, avec la réponse recommandée à Q8) n'ont rien à mettre à jour.
Chaque contrôle est éprouvé en cassant ce qu'il surveille.
