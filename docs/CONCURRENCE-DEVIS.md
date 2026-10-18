# Devis et facture — ce que font les autres, et par où les battre

> Demandé par le propriétaire le 12/10/2026 :
>
> « avant de créé tous les ecran de la partie devies est facture jaimerez que tu
> recherche ce qui existe sur internet est que tu trouve la maniere d'etre
> meilleur que eux il faudra que les ecran soit facilement lisible est
> comprehensible »
>
> **Aucune ligne de code n'a été écrite.** Huit recherches, puis une relecture
> chargée de les démolir — qui a trouvé **six erreurs de fait** dans leurs
> propres rapports. Celles-ci sont corrigées ici, et nommées au §9 : un
> document qui cache ses erreurs ne vaut rien.
>
> Il complète `docs/PLAN-DEVIS.md`, qui reste la référence sur le DROIT et sur
> les colonnes de la base. **Partout où les deux se contredisent, le plan
> gagne** : il est mesuré sur la vraie base, celui-ci sur des pages
> commerciales et des avis.

---

## §0. EN UNE PAGE

**Ce qui a changé depuis ce qu'on croyait.** Trois choses, et elles comptent
plus que tout le reste du document :

1. **« Un agent IA qui rédige le devis » n'est plus un avantage.** Obat l'a
   livré, **Boby (Cegid) le fait pour plus de 20 000 artisans à 14,99 €**, et
   la **CAPEB distribue son propre outil IA à ses adhérents** — celui-là
   contrôle même les taux de TVA. C'était la carte maîtresse supposée d'Opus ;
   elle est sur la table depuis des mois.
2. **La place n'est pas vide sur mobile.** On a d'abord écrit « aucune
   application native bien notée pour chiffrer sur le chantier ». C'est faux :
   **Artinove 4,55/5 sur 1 641 avis**, **Khosmos 4,90**, **ATTIX 4,45** — trois
   applications iOS françaises de devis-facture BTP. Ce qui est vrai, et
   mesuré : les **éditeurs historiques** (Batappli, Mediabat) ont de mauvaises
   applications compagnes.
3. **Deux concurrents sont GRATUITS, pour de vrai.** **Henrri** : devis et
   factures illimités, facture électronique incluse, 0 €. **Costructor** :
   pareil, plus la dictée vocale IA, les factures de situation, les acomptes,
   les avoirs, la retenue de garantie — **132 000 entreprises, 4,9/5 sur
   400 avis, partenariat CAPEB depuis mai 2026**.

**Donc la vraie question n'est pas « comment faire un bon écran de devis ».**
C'est : *pourquoi un artisan quitterait-il un outil gratuit, noté 4,9, soutenu
par son syndicat ?* Il n'y a qu'une réponse défendable, et elle ne se trouve
pas dans le module devis :

> **Opus part de données qu'il détient déjà.** Une demande reçue, un client au
> carnet, un chantier déjà photographié. Tous les autres partent d'une page
> blanche. C'est la seule chose qu'aucun d'eux ne peut copier — et c'est aussi
> la seule qui ne fonctionne **qu'avec du monde dedans**.

**Les cinq coups à jouer**, dans l'ordre où je les construirais (§3) :

| | le coup | pourquoi personne ne le fait |
|---|---|---|
| 1 | **La demande reçue devient un devis** sans ressaisie | il faut un réseau social avec de vraies demandes |
| 2 | **Un devis lisible sur 390 px**, sans défilement de côté | c'est le reproche n°1 du marché, et il est mesuré |
| 3 | **Les mots expliqués là où ils s'affichent** | 35 % des dirigeants seulement connaissent la réforme |
| 4 | **La facture au PARTICULIER, tout de suite** | les autres attendent la réforme, qui ne la concerne pas |
| 5 | **Une sortie de données qui marche** | personne ne confie dix ans de factures sans issue |

**Et trois choses à traiter AVANT les écrans**, parce qu'aucune n'est un écran
et qu'elles décident de l'adoption : l'immatriculation, le contrat de
sous-traitance RGPD, et la sortie comptable. §8.

---

## §1. LE TERRAIN — qui est en face

Tous les prix sont en euros HT, relevés le **12/10/2026** sur les pages des
éditeurs. **Ils changent** : à revérifier avant toute décision.

### Les gratuits, et ils sont redoutables

| | prix | ce qu'il fait | ce qui manque |
|---|---|---|---|
| **Costructor** | **0 €** (Starter) · 15 · 30 | devis **et** factures électroniques illimités, dictée vocale IA, situations, acomptes, avoirs, retenue de garantie, attestation TVA en un clic, plateforme agréée incluse | **aucun mode hors ligne** — le travail fait sans réseau est perdu ; signature **0,90 € l'unité** |
| **Henrri** | **0 €** (Pro) · 17 · 25 · 49 | devis et factures illimités, facture électronique incluse | la **facture de situation** est réservée au plan à 49 € ; **aucune application mobile** |
| Abby · Indy · Facture.net | 0 € | devis et factures illimités | rien de bâtiment : ni lots, ni ouvrages, ni TVA travaux, ni retenue de garantie |

> **Costructor est le concurrent dangereux, et il faut le dire franchement :**
> 132 000 entreprises, noté 4,9/5 sur 400 avis, un partenariat avec la CAPEB,
> et il est gratuit sur le périmètre exact du module 2 d'Opus.
>
> Son seul trou mesuré est **l'absence de hors-ligne**. Mais attention — voir
> §7 : **zéro plainte sur 92 avis négatifs du marché ne porte sur le
> hors-ligne.** Ce n'est donc pas par là qu'on gagne.

### Les spécialistes payants

| | prix | ce qu'il a | ce qu'il n'a pas |
|---|---|---|---|
| **Tolteck** | **19 €** annuel · 25 mensuel | **fonctionne sans réseau**, bibliothèque d'ouvrages, taux et franchise de TVA, utilisateurs illimités | pas d'application native ; situation de travaux non annoncée |
| **Obat** | 25 € (micro) · **39 €** (assujetti TVA) · 69 · 109 | **30 000 libellés inclus**, 200 modèles pour 24 métiers, **19 mentions légales automatiques**, marge au devis, acompte, situation, avoir, signature illimitée, **devis vocal IA livré** | Batichiffrage en option à 12 €/mois ; retenue de garantie non documentée |
| **Mediabat** | dès 37 € | retenue de garantie, **autoliquidation**, primes CEE, suivi de chantier | interface vieillissante ; **application notée 1,80/5** |
| **Batappli** | **429 à 1 309 €/an** | logiciel de bureau complet | **l'application est en lecture seule et exige le PC du bureau allumé** |

### La vague IA est déjà passée

| | prix | utilisateurs | ce qu'il fait déjà |
|---|---|---|---|
| **Boby** (Cegid) | **14,99** / 29,99 / 49,99 € | **plus de 20 000** | dictée du devis par l'application **ou par WhatsApp** |
| **Renalto** | 25 / 30 / 49 € | 5 000+, 30 000 devis | devis à la voix, **apprend vos prix** |
| **ATTIX** | non public | 1 200+ | note vocale sur chantier, aide au prix, marges |
| **IArtisans** (CAPEB) | abonnement adhérent | adhérents CAPEB | **contrôle de conformité des devis, dont les taux de TVA** |

Les avis d'ATTIX décrivent mot pour mot ce qu'on imaginait construire :
« l'IA pose des questions super précises, ça me permet de rien oublier ».

### La vérité qui dérange : pourquoi quitter Henrri ?

Posons-la franchement, parce que c'est la question que vous poserez un jour.
Henrri est gratuit, illimité, et sa facture électronique est incluse. Un
artisan qui s'en sert n'a **aucune raison technique** de changer.

Les trois seules réponses qui tiennent :

1. **il n'a pas d'application mobile** — et Opus est une application mobile ;
2. **il ne sait rien du bâtiment** : pas de lots, pas d'ouvrages, pas de TVA
   travaux, pas de retenue de garantie ;
3. **il ne connaît pas ses clients.** Opus, si.

**Et ce n'est pas suffisant contre Costructor**, qui est gratuit ET bâtiment.
Contre lui, il ne reste que la troisième. C'est pour cela que le §3 commence
par là et non par un écran.

---

## §2. LE MINIMUM VITAL — ce que TOUS font

Si Opus n'a pas ça, il ne joue pas. Liste courte, et elle est le résultat du
recoupement des vingt-sept outils relevés :

- devis **et** facture dans le même outil, la facture **née du devis** sans
  ressaisie ;
- la numérotation automatique, continue, avec un **numéro de départ
  paramétrable** — sans quoi personne ne peut migrer vers Opus ;
- **les mentions obligatoires posées automatiquement** (Obat en annonce 19) ;
- les **trois taux de TVA** travaux, la franchise, et l'attestation du client ;
- un **acompte en pourcentage**, les **factures de situation**, les **avoirs** ;
- une **bibliothèque d'ouvrages** réutilisables — c'est le cœur du métier :
  on ne retape pas « Fourniture et pose de placo BA13 » trois cents fois ;
- le **PDF** envoyé par e-mail, SMS ou WhatsApp.

> **Ce qu'il faut savoir avant de promettre une bibliothèque de prix :** il
> n'existe **aucune base d'ouvrages libre** en France. Batiprix et
> Batichiffrage sont vendus (Obat les propose en option à 12 €/mois, Costructor
> à 10 €). Une bibliothèque Opus commencera donc **vide, et c'est l'artisan qui
> la remplit** — ce qui est acceptable à condition de le dire, et de rendre
> l'enregistrement d'un ouvrage immédiat.

---

## §3. OÙ EST LA PLACE — les cinq coups

### Coup 1 — La demande reçue devient un devis. C'est le seul inimitable.

Opus détient, pour un artisan : **8 demandes de devis reçues**, **un carnet de
clients**, **des chantiers avec leurs photos et leurs dates**. Tous les
concurrents partent d'une page blanche.

Le geste : sur une demande acceptée, un bouton **« En faire un devis »**. Le
client, sa commune, son téléphone, le texte de sa demande et ses photos sont
déjà là. Il reste à chiffrer.

> **Et c'est aussi la faiblesse, il faut le dire :** la vraie base contient
> **1 client et 1 chantier**. Ce coup ne vaut rien tant qu'Opus est vide — donc
> le devis sera d'abord jugé **sur le terrain des autres** : 30 000 ouvrages
> inclus, et une application qui facture.

### Coup 2 — Un devis qui tient sur 390 px. C'est le reproche n°1 du marché.

Mesuré, et c'est le chiffre qui décide de tout le lot : **un devis est un
tableau de six colonnes que la loi impose, et il ne tient pas.** §4.

Le reproche existe, textuellement, sur l'App Store d'Obat (1★, 27/02/2025) :

> « Appli très difficilement utilisable depuis un iPhone, l'interface est
> affreuse, **obligé de naviguer de gauche à droite pour avoir la page
> complète**, bref zéro. »

### Coup 3 — Les mots expliqués là où ils s'affichent

**86 % des dirigeants de TPE ont entendu parler de la réforme de la facture
électronique, 35 % seulement savent ce qu'elle contient** (OpinionWay pour
Tiime, 607 dirigeants, mars 2026). Et leur premier critère de choix d'un
logiciel est **la facilité d'usage — 55 %**, contre 12 % pour
l'accompagnement.

Un mot qu'on ne comprend pas est un champ qu'on remplit de travers.
**Autoliquidation**, **retenue de garantie**, **situation de travaux**,
**arrhes**, **déboursé sec** : le lexique du §5 les explique tous en moins de
vingt mots, et c'est le texte qui s'affichera.

### Coup 4 — La facture au PARTICULIER, sans attendre la réforme

**C'est la découverte qui change l'ordre des lots**, et elle a été trouvée en
démolissant les rapports :

> **La facturation électronique obligatoire ne vise que le B2B.** Une facture à
> un **particulier** reste aujourd'hui un document ordinaire : aucune
> plateforme agréée, aucun Factur-X, aucun format imposé. Ce qui arrive au
> 1er septembre 2027 pour le B2C, c'est **l'e-reporting** — une transmission de
> données au fisc, pas un canal de facture.

Or c'est la facture que l'artisan émet **le plus souvent**. Repousser tout le
module facture pour une obligation qui ne touche qu'une minorité de ses
factures, c'est repousser la moitié qui fait rester les gens — parce qu'un
artisan ne tient pas deux outils :

> « nous ne pouvons pas **transformer directement nos devis en facture** et je
> trouve ça dommage » — avis Batappli, 4★.

**À confirmer avec votre comptable avant de s'y engager.** Et la facture émise
devra être **immuable en base**, comme le devis remis l'est déjà dans le plan.

### Coup 5 — Une sortie de données qui marche

Zéro ligne sur ce sujet dans les huit recherches, et c'est pourtant le premier
obstacle au changement d'outil : le comptable attend un **journal de ventes**
exploitable, et la loi impose de conserver **dix ans**.

> **Un export RGPD n'est pas une sortie comptable.** Et sans sortie, il n'y a
> pas d'entrée : personne ne confie dix ans de factures à un outil dont on ne
> sait pas sortir.

---

## §4. LES ÉCRANS — « facilement lisible et comprehensible »

C'est votre demande, et c'est la partie la plus mesurée du document. Tout ce
qui suit a été calculé **dans ce dépôt**, sur les polices réellement
embarquées.

### 4.1 Le tableau ne tient pas, et il manque 128 px

La loi fixe six colonnes, et aucune ne peut être retirée : **Désignation ·
Quantité · Unité · Prix unitaire HT · Taux de TVA · Total de ligne**
(service-public F31144 et F31808 ; l'amende est de 3 000 € pour une personne
physique, 15 000 € pour une société).

Largeur réellement disponible sur un iPhone de 390 px, gouttière et carte
déduites : **334 px**. Largeur nécessaire, mesurée dans Inter à 12 px en
lisant les largeurs de la police :

| colonne | exemple | largeur |
|---|---|---|
| Désignation | « Fourniture et pose de placo BA13 » | 225,0 px |
| Quantité | 12,50 | 34,6 px |
| Unité | m² | 14,1 px |
| P.U. HT | 28,40 € | 46,0 px |
| TVA | 10 % | 30,7 px |
| Total HT | 1 250,50 € | 63,7 px |
| **avec 8 px d'air par colonne** | | **462 px** |

> **462 px à faire tenir dans 334 : il manque 128 px, soit un tiers d'écran.**
>
> Et le pire est ailleurs : si l'on fait tenir les cinq colonnes de chiffres,
> il reste **105 px pour la désignation, soit 15 caractères**. « Fourniture et
> pose de placo BA13 » devient « Fourniture et p… », et deux lignes du même
> chantier deviennent indiscernables.

**La norme tranche, et ce n'est pas un goût** : WCAG 2.2, critère 1.4.10
(Reflow) impose que le contenu tienne **sans défilement à deux dimensions** à
320 px — et son exception pour les tableaux de données est étroite : « chaque
cellule doit elle-même respecter Reflow ».

### 4.2 La règle retenue : une LISTE qui se lit, une CARTE qui s'édite

> **Un devis se LIT en liste et s'ÉDITE en carte. Aucun tableau, nulle part.**
>
> La liste est faite de rangées « désignation + total de ligne » de 50 px —
> **douze lignes d'un coup d'œil**, ce qu'il faut pour relire un devis avant de
> l'envoyer. **Toucher une rangée ouvre la ligne en carte empilée**, où chaque
> valeur porte son étiquette et se modifie. On ne voit jamais six colonnes
> parce qu'on n'en voit jamais plus de deux à la fois.

Et trois règles qui vont avec :

- **jamais de défilement horizontal sur un écran de devis.** Un contrôle doit
  le refuser, comme `verifier-feuilles` refuse le double mécanisme de clavier ;
- **la désignation ne se tronque pas à moins de deux lignes** (critère « Larger
  Text » d'Apple : « allow the text to wrap to two or more lines instead of
  truncation »). Donc `flex: 1, minWidth: 0` sur la désignation et une largeur
  fixe sur le total — la règle du lot 5 : dans une rangée, c'est le texte qui
  se raccourcit, jamais le nombre ;
- **un total par LOT**, pas seulement un total général : un devis bâtiment est
  hiérarchique, et l'unité comme le taux de TVA se disent une fois par groupe
  au lieu de se répéter à chaque ligne.

### 4.3 LE DÉFAUT GRAVE : Oswald ne sait pas écrire un montant

Mesuré en lisant les tables des fichiers `.ttf` réellement embarqués dans ce
projet. C'est le genre de défaut que rien ne signale : aucune erreur, aucun
écran cassé, aucun contrôle rouge.

```
Oswald_700Bold.ttf
  chiffres à largeur fixe (tnum)     : NON   — '1' = 385 contre '0' = 550
  U+202F ESPACE FINE INSÉCABLE       : ABSENT DE LA POLICE
```

Et voici pourquoi c'est grave : `Intl.NumberFormat('fr-FR')` sépare les
milliers par **exactement ce caractère U+202F**.

> **Un total écrit en Oswald afficherait « 12400,00 € » (séparateur avalé) ou
> « 12□400,00 € » (carré vide), selon la police de secours.** Et il ne
> s'alignerait jamais dans une colonne, faute de chiffres à largeur fixe.

C'est contre l'habitude du projet — « titres et boutons en Oswald ». La règle
devient :

> **Oswald pour les MOTS d'un titre, Inter pour tout ce qui est un CHIFFRE**,
> le grand total compris. « TOTAL TTC » en Oswald et « 12 400,00 € » en Inter
> sur la même rangée est juste ; l'inverse est cassé.

**Inter, elle, sait faire** — et le projet ne s'en sert pas encore :

```
Inter_400Regular.ttf
  chiffres par défaut : NEUF largeurs différentes ('1' = 833 … '4' = 1323)
  avec tnum           : toutes à 1328  → UNE seule largeur
  U+2007 ESPACE-CHIFFRE : présent, à exactement 1328 — la largeur d'un chiffre
```

À 13 px de corps, « 1 111,11 » et « 1 250,50 » — même nombre de caractères —
sont décalés de **13,32 px** sans `tnum`, et de **0,00 px** avec. Or `src/`
ne contient **aucun `fontVariant`** aujourd'hui, et seulement **deux**
`textAlign: 'right'`.

> **Tout montant porte `fontVariant: ['tabular-nums']` et s'aligne à DROITE.**
> Et l'alignement à droite n'est pas une convention : `tnum` égalise les
> chiffres, pas les séparateurs. « 1 250,50 » porte une espace de milliers,
> « 984,00 » n'en porte pas — ils ne peuvent **jamais** s'aligner par la gauche.

Bonne nouvelle mesurée : Inter 600SemiBold donne la même largeur à 0,11 px
près. **Un total en demi-gras reste aligné.**

### 4.4 Le total ne bouge pas pendant qu'on tape

Trois raisons, et la première est visuelle : tapez « 1 », « 12 », « 125 »,
« 1250 » — le total passe par quatre largeurs, donc par quatre mises en page,
et **toute la ligne saute sous l'œil**. La deuxième est la règle du lot 4 (un
écran qui se redessine à chaque lettre : 203 ms mesurés). La troisième est une
norme : WCAG 4.1.3 — un total recalculé est un message d'état, et annoncer
« 1 », « 12 », « 125 » à VoiceOver rend le champ inutilisable.

> **Le total se recalcule au franchissement de seuil, pas à la frappe** — quand
> le champ perd le focus, ou quand la ligne est validée. Entre les deux, il
> affiche sa dernière valeur sûre **en le disant** : « Total : 1 108,00 € ·
> ligne en cours ». Un total figé sans le dire serait un travail non fait qui
> ressemble à un travail fait.
>
> **Et il réserve sa largeur** avec des espaces-chiffres (U+2007), pour ne
> jamais sauter. Attention : Oswald ne contient pas ce caractère non plus.

Où il se pose : **en bas, visible en permanence, et il ne défile pas avec la
liste.** Avec douze rangées sur 775 px utiles, un total placé après la
dernière ligne est hors écran dès le septième poste — et c'est la seule chose
qu'on regarde pendant qu'on chiffre.

### 4.5 Taper un prix au doigt : la virgule ET le point

Documenté par Apple (forum développeurs, fil 107269, ouvert depuis iOS 12,
rapport fermé sans solution) : sur un iPhone en français, le pavé décimal
affiche **un point** si un clavier anglais est aussi installé, et **une
virgule** sinon. Et `Locale.current.decimalSeparator` répond toujours « , » —
**il ne dit donc pas ce que le clavier affiche**.

> **Un champ de prix accepte la virgule et le point, toujours les deux.** On ne
> peut pas savoir lequel le clavier va produire, et on ne doit pas essayer de
> le deviner : on normalise à la saisie. Rien à expliquer, aucun message
> d'erreur à écrire — c'est le meilleur message d'erreur, celui qu'on ne peut
> plus déclencher.

Et le piège déjà connu de ce projet : **un clavier numérique d'iOS n'a pas de
touche retour.** Un champ de prix ne peut donc pas enchaîner vers le suivant,
quoi qu'on écrive — comme le SIRET et le code postal du formulaire client.

### 4.6 Les deux calculs vivent dans un fichier qui n'importe rien

Douzième application de la leçon de `cloudinary-adresses.js`, et ici elle est
indispensable :

> **`src/lib/montants.js`**, qui n'importe rien, et un contrôle qui le FAIT
> TOURNER. Il pose le séparateur **explicitement** au lieu de le recevoir du
> système — mesuré : le séparateur dépend de la version d'ICU, donc de la
> version d'iOS, et U+202F contre U+00A0 fait **1,30 px de largeur de colonne
> qui bouge avec l'OS**.

Et **l'arrondi de la TVA**, que les huit recherches ont tous oublié et que le
plan avait mesuré : trois lignes à 33,33 € à 10 % font **9,99 €** calculées
ligne par ligne et **10,00 €** calculées par taux. **Un centime d'écart sur un
document fiscal**, qui s'imprime, part chez le client, et ne se corrige plus.

---

## §5. LE LEXIQUE — le texte qui s'affichera

Chaque terme s'explique **dans l'écran où il apparaît**, en moins de vingt
mots. Une seule source — `src/data/lexique.js` —, jamais recopiée dans le
code de l'écran : c'est la leçon des voyants du 04/10, deux écritures d'une
même vérité finissent par se contredire.

| terme | ce qui s'affiche |
|---|---|
| **HT** | Le prix de votre travail, **sans** la taxe. C'est ce qui vous revient. |
| **TTC** | Le prix que le client paie vraiment : votre prix, **plus** la taxe. |
| **TVA** | Une taxe que vous ajoutez au prix et que vous reversez à l'État. Elle n'est pas à vous. |
| **TVA à 10 %** | Taux réduit pour rénover un logement achevé depuis plus de deux ans. |
| **TVA à 5,5 %** | Taux réduit pour les travaux qui économisent de l'énergie dans un logement ancien. |
| **TVA à 20 %** | Le taux normal : construction neuve, et tout ce qui n'entre pas dans un taux réduit. |
| **Franchise de TVA** | Vous ne facturez **aucune** TVA, et vous ne la récupérez pas non plus. |
| **Autoliquidation** | En sous-traitance, c'est l'entreprise principale qui paie la TVA à l'État, pas vous. |
| **Devis** | Votre prix, écrit avant les travaux. **Signé, il devient un contrat.** |
| **Bon pour travaux** | Les mots que le client écrit en signant : il accepte votre devis. |
| **Durée de validité** | Combien de temps votre prix tient. Passé ce délai, vous pouvez le refaire. |
| **Avenant** | Un papier qui **modifie un devis déjà signé**. Nouveau prix, nouvelle signature. |
| **Acompte** | De l'argent versé avant le début. **Il engage les deux : personne ne peut plus reculer.** |
| **Arrhes** | Comme un acompte, mais le client peut renoncer : il perd alors la somme versée. |
| **Situation de travaux** | Une facture **au milieu** du chantier, pour la part déjà faite. |
| **Avancement** | La part du chantier déjà réalisée, en pourcentage. C'est elle qui se facture. |
| **Solde** | La dernière facture : le total, moins tout ce qui a déjà été payé. |
| **Retenue de garantie** | Le client garde **5 % maximum pendant un an**, au cas où un défaut apparaisse. |
| **Avoir** | Une facture à l'envers : vous rendez de l'argent déjà facturé. |
| **Remise** | Une baisse de prix que vous accordez. Elle s'écrit sur le devis. |
| **Escompte** | Une petite remise si le client paie **plus tôt** que prévu. |
| **Pénalités de retard** | Ce que le client doit en plus s'il paie après la date convenue. |
| **Lot** | Une partie du chantier regroupée par métier : maçonnerie, plomberie, peinture. |
| **Ouvrage** | Un travail complet, fourniture **et** pose, prêt à chiffrer d'un bloc. |
| **Déboursé sec** | Ce que le chantier vous coûte vraiment : matériaux et heures, **sans** votre marge. |
| **Marge** | Ce qu'il vous reste quand le chantier est payé et tout réglé. |
| **Taux horaire** | Ce que vous comptez pour une heure de travail. **La loi veut qu'il soit écrit, en TTC.** |
| **Unité** | La façon de compter : au mètre, au m², à l'heure, ou en une seule fois. |
| **Forfait** | Un prix pour l'ensemble, sans compter les heures ni les mètres. |
| **Facture électronique** | Une facture envoyée par un service agréé par l'État, pas un PDF par e-mail. |
| **Plateforme agréée** | Le service par lequel une facture électronique doit passer. L'État en tient la liste. |

**Deux formulations légales se reprennent AU MOT**, et ne s'inventent pas :
« TVA non applicable, art. 293 B du code général des impôts » pour la
franchise, et la mention d'autoliquidation en sous-traitance.

---

## §6. LA FACTURATION ÉLECTRONIQUE — l'état du droit, et ce que ça change

| | |
|---|---|
| **1er septembre 2026** (en vigueur) | **réception** obligatoire pour toutes les entreprises assujetties à la TVA |
| **1er septembre 2027** | **émission** + e-reporting pour les PME, TPE et micro-entreprises |
| les ETI | **émission depuis le 1er septembre 2026**, comme les grandes entreprises — tranché par la FAQ officielle d'août 2026 (vérifié le 17/10/2026) |

Le mécanisme : une facture entre professionnels doit passer par une
**plateforme agréée**. La page officielle est explicite : une « solution
compatible » qui n'est pas immatriculée **ne peut ni transmettre ni recevoir**.
Le chiffre officiel de plateformes agréées est **155** (liste du
13/10/2026 sur impots.gouv.fr, tests d'interopérabilité compris), plus 11 en
attente de tests, qui ne sont PAS agréées. Il valait 101 le 16/01/2026 et
150 le 01/08/2026 : il bouge, il faut le relire. Et l'ancien « 166 » des
annuaires privés n'était pas juste pour autant : il mélangeait les dossiers
en attente.

**Ce que ça veut dire pour Opus**, et c'est le point du §3 coup 4 :

- **la facture à un PARTICULIER ne demande rien de tout ça aujourd'hui.** Elle
  se construit maintenant, sans partenaire, sans contrat et sans risque ;
- **la facture entre PROS**, elle, demandera un partenariat avec une plateforme
  agréée — ou le passage par celle du client. C'est un lot à part, et il a une
  échéance : septembre 2027 ;
- **l'e-reporting** touchera aussi le B2C en 2027 : une transmission de données
  au fisc, pas un canal de facture.

> **Est-ce que ça remet en cause le module facture ? Non — à condition de le
> découper comme ci-dessus.** Le repousser en entier pour une obligation qui ne
> touche qu'une minorité des factures d'un artisan serait une erreur
> d'adoption : c'est la facture qui fait rester les gens.
>
> **Et ça demande confirmation par votre comptable.** Je n'ai pas qualité pour
> engager une décision fiscale, et le calendrier a déjà été repoussé deux fois.

---

## §7. CE QU'ON NE FAIT PAS, avec la raison

Un document qui ne dit pas ce qu'il écarte ne vaut rien. Huit idées sorties des
recherches, et écartées après vérification.

1. **L'IA qui rédige le devis.** Il n'existe **aucune source de prix** dans
   Opus, et le cahier des charges « Visite » interdit nommément d'inventer un
   prix ou un taux. Trois raisons de plus : la dictée **exige le réseau**,
   c'est-à-dire exactement là où il manque ; **l'erreur dangereuse n'est pas le
   prix, c'est la QUANTITÉ** (« deux jours à deux » = 2 ? 4 ? 32 heures ? — un
   prix faux se voit, une quantité fausse multiplie le prix) ; et les
   concurrents rationnent leurs appels IA **parce que ça coûte**, en encaissant
   25 à 49 € par mois, là où Opus encaisse zéro.
2. **La signature électronique au doigt.** L'article 1366 du code civil pose
   **deux conditions cumulatives** : identifier la personne **et** garantir
   l'intégrité. Opus tient la seconde et **ne peut pas tenir la première pour
   un client qui n'a pas de compte**. Livrer un écran de signature donnerait à
   l'artisan **la croyance d'être couvert** — c'est le « X est prévenu » avec
   un contrat au bout. On trace, on dit ce que ça vaut, et on n'écrit **nulle
   part** « signé électroniquement ».
3. **Deux photos de chantier comparable dans le devis.** La donnée n'existe pas
   (un chantier Opus n'a **ni métier ni type**) ; et sur iOS le moteur de PDF
   ne peut pas charger une image par URL — il faut l'incorporer en base64, donc
   plusieurs mégaoctets de HTML fabriqués sur le téléphone.
4. **Des avis clients sur le devis.** **4 artisans sur 7 n'ont aucun avis** :
   le bloc serait vide pour la majorité, et son absence deviendrait un signal
   négatif sur un document contractuel. Et le client qui reçoit un devis a
   déjà choisi d'appeler cet artisan.
5. **Les options que le client coche lui-même.** Elles supposent une page
   publique qui imprime le nom et l'adresse d'un client — alors que le contrat
   de sous-traitance RGPD n'existe pas. Et en France, une option cochée après
   signature est un **avenant**, pas une case.
6. **Le total affiché en permanence sur les quatre écrans.** Bandeau de
   progression + client + total ≈ **120 px de chrome permanent** sur 775 px
   utiles, soit 15 % — sur un module dont le reproche mesuré est
   l'encombrement. Ce projet a déjà payé ce défaut deux fois (45 % d'écran
   avant le contenu sur les Demandes, 233 px de filtres sur la Place des pros).
7. **Un assistant en quatre étapes.** Le devis est obligatoire **dès le premier
   euro** (le seuil de 150 € est abrogé depuis le 01/04/2017), donc **un devis
   de 60 € doit être aussi rapide à produire qu'un devis de 6 000 €**.
8. **Le mode hors ligne comme argument de vente.** Le marketing dit « la place
   la plus libre du marché » (1 concurrent sur 27 le fait). Les clients disent
   autre chose : **zéro plainte sur 92 avis négatifs** ne porte sur le
   hors-ligne. On garde le brouillon local, on n'en fait pas une promesse.

---

## §8. L'ANGLE MORT — pourquoi un artisan refuserait Opus même meilleur

C'est la partie à traiter **en premier**, et aucun de ses trois points n'est un
écran.

### 8.1 La confiance

Trois faits qui vont dans le même sens :

- **84 %** des Français font confiance aux artisans ; **14 %** font confiance à
  une plateforme tierce. L'artisan qui lit ça sur lui-même le ressent pour
  lui : **mettre sa facturation dans un réseau social où ses concurrents ont un
  compte** est un acte de confiance qu'aucun écran ne produit ;
- `EDITEUR.contratSousTraitance` vaut **`false`** : son carnet de clients vit
  chez un sous-traitant RGPD avec lequel il n'a **aucun contrat**, et le devis
  imprimera ces noms et ces adresses ;
- l'éditeur n'a **ni société ni SIRET**. Un artisan à qui l'on demande de
  confier ses devis à une application éditée par un particulier en essai posera
  la question, et elle est légitime.

### 8.2 Le second accès — et c'est architectural

`CLAUDE.md` est formel : « un compte = une entreprise », « pas de salarié avec
son propre accès, pas de rôles ». C'était juste pour un réseau social.

> Dans le bâtiment, l'administratif est très souvent tenu par le **conjoint
> collaborateur** ou une secrétaire à mi-temps. Le jour où le devis entre dans
> Opus, ce sont **deux personnes** qui doivent y entrer — et l'architecture dit
> non.
>
> Ce n'est pas une gêne, c'est un **refus d'adoption**, et il est
> architectural. La bonne nouvelle : `est_mon_entreprise()` existe depuis le
> lot E précisément pour ça — c'est **une** fonction à changer, pas
> cinquante-six règles.

### 8.3 La sortie des données

Voir §3 coup 5. Le comptable est le premier obstacle, et il n'a jamais été
nommé dans aucune recherche.

---

## §9. LES SIX ERREURS DES RECHERCHES — corrigées, et nommées

Je les écris parce que vous auriez décidé sur elles.

| | ce qui était affirmé | ce qui est vrai |
|---|---|---|
| 1 | « aucune application mobile native bien notée pour chiffrer sur le chantier » | **Artinove 4,55/5 sur 1 641 avis**, Khosmos 4,90, ATTIX 4,45. La moyenne de 2,75 ne portait que sur les sept applications **compagnes** d'éditeurs de bureau |
| 2 | « les coordonnées d'assurance décennale sont déjà en base » | **Faux.** La base ne porte qu'un booléen `assurance_valide`. Ni assureur, ni n° de contrat, ni couverture — c'est-à-dire **aucune** des mentions que l'arrêté du 05/01/2016 impose. En suivant ce rapport, on sautait une mention obligatoire **en croyant la posséder** |
| 3 | avis en ligne : « décret 2024-753, art. D.111-10 » | **Décret 2017-1436, art. D. 111-16 et D. 111-17**, en vigueur depuis le **1er janvier 2018**. Le contenu était juste, la source fausse — et la conséquence plus lourde : le trou de conformité n'a pas deux ans, il en a **neuf** |
| 4 | « les artisans ne veulent payer que 5 €/mois » | Étude OpinionWay **pour Tiime**, et la question portait sur **une mise en conformité subie**, pas sur un outil de travail. Les artisans **paient** 19 € (Tolteck) à 39 € (Obat). Ce chiffre ne doit pas fixer le prix d'Opus |
| 5 | « 166 plateformes agréées » | **101** dans la liste officielle du 16/01/2026 ; **155** dans celle du 13/10/2026 (plus 11 en attente, non agréées). Le chiffre bouge : le relire |
| 6 | Costructor « Business+ 300 € » / « 30 € » et « signature incluse » / « 0,90 € l'unité » | **Deux rapports, deux Costructor.** À revérifier avant toute comparaison — c'est le concurrent désigné comme le plus dangereux |

Et **une erreur de méthode, qui est la mienne** : je n'ai pas dit aux huit
recherches de lire `docs/PLAN-DEVIS.md`, qui existait déjà et faisait
2 730 lignes. Elles ont donc reconçu un module déjà tranché, à partir de pages
commerciales là où le plan s'appuie sur des mesures faites sur la vraie base.

---

## §10. CE QUI N'A PAS PU ÊTRE VÉRIFIÉ

- **Aucun écran de création de devis n'a été vu en fonctionnement.** Tous les
  concurrents exigent un compte ; les descriptions d'écran viennent de captures
  commerciales et de vidéos de démonstration, pas d'un usage réel.
- **Il n'existe aucun moteur de PDF dans le dépôt** : `expo-print` et
  `expo-sharing` ne sont ni dans `package.json` ni dans `node_modules`. Les
  recherches raisonnaient sur « le PDF » comme s'il existait. Bonne nouvelle
  vérifiée : les deux sont inclus dans Expo Go, donc essayables sans
  development build. Mais **sur le web, `printToFileAsync` ouvre la boîte
  d'impression au lieu de produire un fichier** — c'est une branche à écrire,
  et ça veut dire que le PDF **ne se vérifiera pas au navigateur**.
- **Les prix changent.** Chaque chiffre de ce document porte sa date : le
  12/10/2026. Obat a déjà deux grilles selon l'engagement.
- **Rien n'a été jugé au doigt.** Les 462 px, les 13,32 px de décalage et les
  caractères absents d'Oswald sont des mesures de police et de géométrie. Ce
  que ça donne sur un iPhone, au soleil, avec des gants, se juge sur l'iPhone.
- **Trois taux de signature circulent et ne mesurent pas la même chose** :
  CAPEB « 1 devis signé sur 4 », Level 73,9 %, ACCA 42 → 52 %. Ne jamais les
  citer côte à côte.

---

## §11. LES QUESTIONS, et ce que votre réponse changerait

1. **La facture au particulier dès le module 2, ou on attend ?** Ma
   recommandation est de la faire — c'est la moitié qui fait rester les gens, et
   elle ne demande aucun partenariat. **À confirmer avec votre comptable**, et
   c'est la seule question du document qui change l'ordre des lots.
2. **Le second accès : conjoint collaborateur ou secrétaire ?** Si la réponse
   est oui, `est_mon_entreprise()` doit évoluer **avant** que les devis
   n'existent — après, ce sera une migration. Si c'est non, il faut le dire aux
   artisans, parce qu'ils poseront la question.
3. **La bibliothèque d'ouvrages commence vide : est-ce acceptable ?** Obat en
   inclut 30 000, Batiprix se vend 10 à 12 € par mois. Opus ne peut pas s'en
   payer une aujourd'hui. L'alternative honnête : l'artisan enregistre ses
   propres ouvrages au fil de ses devis, et on rend ce geste immédiat.
4. **Un prix pour Opus ?** La question n'est pas théorique : les deux gratuits
   du marché sont gratuits **parce qu'ils vendent autre chose**, et les appels
   IA se paient à chaque fois. Aujourd'hui Opus encaisse zéro et paie Anthropic.
