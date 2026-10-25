# Le module 2 — LE DEVIS. Plan corrigé et définitif, avant toute ligne de code

> **Ce document est un PLAN.** Rien n'a été modifié dans le dépôt, aucune
> migration n'a été appliquée, aucun `git`. Les seules opérations faites sur la
> vraie base sont des `select` de comptage et de structure.
>
> **C'est la version CORRIGÉE.** Un premier brouillon a été écrit, puis relu par
> une critique de complétude qui a trouvé six trous ; les deux plus graves ont
> été **remesurés** avant d'écrire ces lignes, et les deux sont confirmés. Les
> douze corrections sont listées, une par une, avec leur endroit, au **§9**.
>
> Le §22 du second cahier des charges demande exactement cela : « NE COMMENCE PAS
> PAR CODER. […] ATTENDRE VALIDATION DU PLAN. » — **Mise à jour du 17/10/2026 : le §10, à la fin, fait foi là où il contredit les §0 à §9** (numéros de ligne inchangés). — **Mise à jour du 23/10/2026 : le lot 1 est FAIT (10.16).** Les lignes que sa construction a rendues fausses sont corrigées SUR PLACE le 23/10, chacune marquée « corrigé au lot 1 » (« tranché au lot 1 » pour une question que le plan laissait ouverte), **sans ajouter ni retirer une seule ligne** : les numéros que d'autres documents citent restent justes.

---

## 0. EN UNE PAGE — à lire en trois minutes

### Ce qui est décidé, en six phrases

1. **Une fiche « Mon entreprise » d'abord.** Un devis porte l'identité de son
   émetteur, et **rien de ce qu'elle exige n'existe** aujourd'hui. Le §1 en
   compte **douze FAMILLES**, mais une famille n'est pas une colonne : « assureur »
   en fait quatre (nom, coordonnées, n° de contrat, couverture géographique),
   « médiateur » trois (nom, adresse, **site**), « forme juridique » trois. Déplié,
   avec l'instantané du §3.4, l'attestation, le logo, le devis payant et la durée
   de validité : **une trentaine de colonnes, et autant de champs à l'écran.**
   C'est le chiffre sur lequel il faut valider, pas douze — voir le lot 0, qui le
   déplie. Ce qui manque, concrètement :
   ni l'adresse de rue, ni l'assureur, ni le médiateur, ni le régime de TVA.
   Mesuré : **0 fiche sur 7** réunit même SIRET + téléphone + code postal.
2. **Tout l'argent est en CENTIMES ENTIERS**, la base recalcule les totaux, et
   **la TVA vit dans sa propre table, un arrondi par taux, une seule fois.**
   Mesuré : trois lignes à 33,33 € à 10 % donnent **9,99 €** ligne par ligne et
   **10,00 €** par taux. L'invariant refuse le centime d'écart.
3. **Un devis remis ne se récrit plus, jamais, pas même par une migration** —
   le verrou regarde `old.statut`, et rien d'autre. Pour corriger, on émet un
   **nouveau** devis ; l'ancien reste lisible.
4. **Le document est produit sur le téléphone** (`expo-print`, fourni dans Expo
   Go), **à partir d'un INSTANTANÉ figé** : on change d'assureur, on réimprime,
   c'est l'ancien assureur qui sort. Aucune jointure dans le gabarit.
5. **Cinq modèles = cinq FEUILLES DE STYLE sur un seul gabarit de contenu.**
   Un habillage change la typographie, la grille et la place du logo ; il ne peut
   **retirer aucun bloc obligatoire** — et un contrôle le rend impossible, pas
   seulement déconseillé.
6. **Aucune action IA dans ce module**, aucun QR, aucune visite obligatoire, et
   aucune colonne qui n'ait un lecteur le jour de sa livraison.

### Les six lots, et le septième qui n'existe que si vous répondez « oui »

| | ce qu'il livre | pourquoi là | se vérifie ici ? |
|---|---|---|---|
| **0 — Mon entreprise** | la table privée `emetteur`, l'écran, l'attestation d'assurance, `emetteur_incomplet()`, et les corrections de `erreurs.js` | rien n'est émissible sans elle, et **0 des 11 colonnes n'existe** | **entièrement**, sauf le clavier et l'appareil photo |
| **1 — Le chiffrage** | `devis` + `devis_lignes` + `devis_tva`, les totaux, la saisie, la liste | il ne peut **rien sortir**, donc il n'engage personne. On isole l'argent avant le document | **le mieux vérifiable du module** : aucun PDF dedans |
| **2 — La remise ET le document** | numéro, instantané, figeage, PDF, espace de stockage, envoi à deux pièces | **seul palier pénal** : le jour où un PDF existe, il est signé sur place et devient le contrat | la moitié base **oui**, par le protocole du §3.11. Le rendu iOS **non** |
| **3 — La TVA complète** | trois taux, ventilation, les trois cases de certification du client | palier **non plafonné** et le plus probable, mais la certification n'a de valeur que **figée** | les calculs oui, les deux gabarits oui |
| **4 — Le cycle de vie** | relancer, accepter, refuser, expirer, refaire | il ne rend tenable que ce qui existe déjà ; sans PDF figé, « le client a accepté » ne désigne rien | oui, hors clavier |
| **5 — Les cinq modèles** | cinq feuilles de style, `emetteur.modele` figé dans l'instantané | on ne dessine pas avant de savoir ce qu'il faut placer | le texte identique oui, **la géométrie non** |
| *6 — Les tarifs publics* | *déplacer taux horaire et frais de déplacement vers ce que le public lit* | **n'existe que si la question 6 reçoit « oui »** | oui |

**L'ordre des lots 2 et 3 peut s'inverser**, et c'est la question 1 qui le
décide : au régime réel, le document ne peut pas sortir sans la TVA.

### Les sept questions — chacune change le travail, pas le confort

| | la question | ce qu'elle décide |
|---|---|---|
| 1 | **Franchise en base, ou régime réel ?** | si le lot 3 remonte avant le lot 2. *« Depuis quand » n'est PAS demandé : sans SIRET il n'y a ni régime ni date. La question se reposera à l'immatriculation* |
| 2 | **L'absence d'attestation décennale doit-elle REFUSER le devis, ou seulement le signaler ?** | deux écrans différents. *On ne demande PAS s'il en a une : c'est mesuré trois fois dans ce document — 0 sur 7 fiches, et 4 déclarent l'expiration d'un document qui n'existe pas* |
| 3 | **Êtes-vous adhérent à un organisme de médiation ?** | une information obligatoire, et c'est un **abonnement**, pas une donnée à trouver |
| 4 | **Avez-vous besoin de retenue de garantie, de situations de travaux ou de révision de prix ?** Les trois en français : garder **5 % du montant pendant un an** après réception ; **facturer à l'avancement** plutôt qu'à la fin ; **indexer le prix sur un indice** entre la signature et les travaux | **zéro occurrence dans les deux cahiers** — ni exigées ni abandonnées. Des colonnes et un pied de devis différents |
| 5 | **Combien de temps garde-t-on un devis jamais accepté ?** | une durée **choisie**, un nettoyage, et un paragraphe légal que je ne peux pas inventer |
| 6 | **Vos tarifs publics (taux horaire, frais de déplacement) : on les affiche MAINTENANT, ou on l'écrit comme une dette ?** | ce n'est **pas** un consentement : l'art. 3 de l'arrêté les veut accessibles en ligne, et une fiche Opus en est un espace. La question est le MOMENT, pas le principe. **Scinder la table `emetteur` ou non** : posée maintenant c'est gratuit, après le lot 0 c'est un déménagement de colonnes |
| 7 | **Quand vous faites signer, c'est chez le client ou chez vous ?** | si la moitié chère du lot 2 (rétractation, J+7, exemplaire signé) est votre quotidien ou votre cas rare |

### Les trois choses à ne pas perdre de vue

1. **Vous pouvez CONSTRUIRE et ESSAYER tout ce module. Vous ne pouvez pas
   encore émettre un devis conforme** — vous n'avez ni SIRET ni assurance
   décennale. `STATUT = 'essai'` ne protège rien ici : **un devis engage son
   émetteur dès sa remise**, même émis depuis une application fermée.
2. **Ce qui ne se vérifie pas dans ce conteneur** : le PDF réel sur iOS (ce
   n'est pas Chromium qui le rend), la feuille de partage, l'impression sur
   papier, le clavier, et le pouce sur une ligne de devis. **Ça se demande, ça ne
   se suppose pas.**
3. **Le contrat de sous-traitance RGPD du carnet de clients n'existe toujours
   pas** (`EDITEUR.contratSousTraitance` est à `false`). Le devis ne l'aggrave
   pas, mais il l'élargit : il imprime le nom et l'adresse de vos clients.

---

## 1. CE QUI EXISTE, ET CE QUI MANQUE

**Il n'y a aucune table de devis.** Et le mot est déjà pris : `quote_requests`
est la **DEMANDE** qu'un client envoie à un artisan, pas le devis que l'artisan
émet.

| | relevé sur la vraie base, 11–12/10/2026 |
|---|---|
| tables `devis`, `devis_lignes`, `factures` | **0** — rien n'existe |
| `quote_requests` | **6 lignes**, dont **4 au statut `accepte`** |
| `clients` (carnet livré le 11/10) | **1**, particulier, ses six champs remplis |
| `chantiers` | 2 |
| fiches professionnelles | 7 |
| séquences dans le schéma `public` | **0** |
| types `enum` | **0** |
| colonnes monétaires du projet | 5, toutes `numeric`, aucune dans un total |
| occurrences du mot « TVA » dans `schema.sql` | **1**, et c'est une clé de métier du catalogue |

Le nom « devis » occupe déjà **six emplacements** qui désignent la demande :
`notifications.devis_id` (clé étrangère vers `quote_requests`), la clé `'devis'`
de `mes_donnees()` (schema.sql:7737), `CIBLE_ATTENDUE.devis`, le type de
notification `'devis'` qui route vers « Pour moi », `GENRES_DEMANDE.devis`, et
— vérifié — **l'index `idx_devis_pro`, qui existe sur `quote_requests` à la
ligne 4113 de `schema.sql`**.

> **Celui-là est le piège le plus silencieux du module.** Un
> `create index if not exists idx_devis_pro on public.devis (…)` ne créerait
> **rien**, et PostgreSQL ne dirait **rien** : l'index existe, il est simplement
> ailleurs. Un devis à cent lignes relirait la table entière, sans la moindre
> erreur.

### Ce qui manque à l'identité de l'entreprise émettrice — et c'est BLOQUANT

Un devis porte l'identité de son émetteur. Relevé champ par champ sur les
**45 colonnes** de `professional_profiles` :

| ce qu'un devis doit imprimer | état mesuré |
|---|---|
| adresse postale (rue et numéro) | **la colonne n'existe pas** — 0 sur les 3 noms testés |
| forme juridique, dénomination légale, capital | **aucune colonne** |
| registre d'immatriculation (RCS / RNE) | **aucune colonne** |
| n° de TVA intracommunautaire | **aucune colonne** |
| assureur : nom, coordonnées, n° de contrat, couverture géographique | **aucune colonne** — la base ne sait que `assurance_valide` (un booléen) |
| taux horaire de main-d'œuvre TTC, décompte du temps | **aucune colonne** |
| frais de déplacement | **aucune colonne** |
| médiateur de la consommation (nom, adresse, **site**) | **aucune colonne** |
| garanties légales et commerciales, service après-vente | **aucune colonne** |
| conditions générales, droit applicable, juridiction | **aucune colonne** |
| régime de TVA | **aucune colonne** |
| logo rectangulaire | **aucune colonne** (il n'y a que `avatar_url`, rond, rempli sur **2 fiches sur 7**) |

**Zéro des colonnes candidates n'existe.** Et les colonnes qui existent ne
tiennent pas :

| | mesuré |
|---|---|
| fiches portant un SIRET exploitable | **5 sur 7** — et aucune en chiffres nus : 17 caractères, avec séparateurs |
| fiches portant la **chaîne vide** et non `null` | **2 sur 7** |
| fiches avec un téléphone | **2 sur 7** |
| fiches avec un e-mail de contact | **2 sur 7** |
| fiches ayant envoyé une **attestation d'assurance** | **0 sur 7** |
| fiches réunissant SIRET + téléphone + code postal + logo | **0** |

> **Conséquence qui décide du premier lot : aucun devis produit par Opus
> aujourd'hui ne serait légal, quelle que soit la qualité du reste.** C'est
> exactement la situation de `completerLieu()` avant le filtre par secteur
> (section 32) : un filtre sans coordonnées est le « bouton §18 ». Un devis sans
> adresse d'émetteur aussi.
>
> Et deux chiffres à garder ensemble : **0 attestation d'assurance sur 7 fiches**,
> mais **4 fiches sur 7 déclarent déjà une date d'expiration** d'une attestation
> qui n'existe pas. La chaîne envoi → stockage privé → contrôle → badge n'a
> jamais tourné une seule fois, et c'était déjà le constat du 03/10.

**Ce qui N'EST PAS mesuré, et que le brouillon affirmait** : que les 5 autres
fiches portant un SIRET soient « de démonstration ». Je n'en sais rien — ce sont
des comptes que je n'ai pas ouverts, et les ouvrir pour le vérifier serait lire
les données de quelqu'un sans raison. **Ce que je sais** : la fiche du
propriétaire, elle, n'a pas de SIRET. Donc l'argument « le lot 3 ne concerne
personne aujourd'hui » **ne tient PAS sur la nature des autres fiches** : il
tient sur votre régime à vous, c'est-à-dire sur la **question 1**. C'est elle qui
autorise ou non à passer le palier fiscal après le document, et c'est pour cela
qu'elle est la première.

### Ce qui existe et qu'on réutilise tel quel

| | où |
|---|---|
| l'appartenance par une FONCTION | `est_mon_entreprise(uuid)`, `security invoker`, 2 appelants — le devis sera le **troisième** |
| le carnet de clients | `clients` porte les six champs qu'un devis imprime, et `archive` existe depuis le 11/10 « parce que ses devis devront continuer de le nommer » |
| la saisie d'une ligne d'adresse | `ChampVille` en mode `rue`, construit le 11/10 pour le carnet |
| le choix d'une date | `Calendrier.js` + `src/lib/formats.js`, comparaisons de chaînes « AAAA-MM-JJ » |
| le routage de l'assurance par catégorie de métier | **existe déjà** : `src/data/pieces-justificatives.js:103` porte `SANS_DECENNALE = ['conseil']`, appelle `cleCategorieDe()` et choisit entre `DECENNALE` et `RC_PRO` |
| le clavier | `{...CLAVIER}` de `src/lib/clavier.js`, posé le 11/10 |
| l'encre posée sur une couleur venue des DONNÉES | `surFond()` de `src/theme.js` — la pastille de statut d'un devis en a besoin (voir §3.9) |
| les codes d'erreur maison | `OP001` et `OP002` sont pris — **`OP003` est libre** (vérifié) |
| l'ordre du fichier | la section 41 finit à 7692, la 42 (`mes_donnees()`) commence à 7693, la 43 (balayage) à 7777 |

---

## 2. CE QUE LA LOI IMPOSE

Le dossier juridique a été établi par trois chercheurs et relu par trois
contre-experts. Voici son arbitrage, resserré. **Aucune clause n'est rédigée
ici** : partout où une mention doit être imprimée, ce plan dit où aller la
chercher, pas quoi écrire.

### 2.0 CHAQUE MENTION A UNE COLONNE — et c'est le premier trou du brouillon

**Le brouillon nommait quatre mentions, les faisait imprimer, et ne les rangeait
nulle part.** Ce n'était pas une inattention : son §1 inscrivait lui-même
« garanties légales et commerciales | **aucune colonne** », son §2.5 classait
leur omission au **palier 4** (le deuxième plus cher du dossier), son lot 2 les
faisait imprimer, et son §3.4 — qui énumère l'instantané et déclare la liste
exhaustive, « AUCUNE JOINTURE DANS LE GABARIT » — ne les contenait pas.

> **Le gabarit lisait donc un bloc que rien n'écrivait.** C'est le défaut du
> 04/10 (`annonces_pro.medias` : une colonne lue que personne n'écrivait) et
> celui du 01/10 (trois tables écrites que personne ne relisait) **dans le même
> document**. Et c'est exactement pour cela que le contrôle de complétude du §3.10
> ne peut pas se contenter de comparer le gabarit à une liste écrite de la même
> main : **ici, la mention manquait des deux.**

**Les quatre mentions orphelines, et où elles vivent désormais :**

| mention | fondement | la colonne | où elle bloque |
|---|---|---|---|
| **garanties légales et commerciales** | L. 111-1, 5° | `emetteur.garanties_texte` | `emetteur_incomplet()` **et** `devis_remis_complet_check` |
| **service après-vente** | L. 111-1, 5°, « le cas échéant » | `emetteur.sav_texte` | nulle part — conditionnel |
| **frais de déplacement** | arrêté 24/01/2017, **art. 2, art. 4-I et art. 4-II** | `emetteur.frais_deplacement_centimes` + `emetteur.frais_deplacement_texte` | `emetteur_incomplet()` **et** la remise, dès qu'un métier est soumis à l'arrêté |
| **délai d'exécution** | L. 111-1, 3° | `devis.delai_execution` | `devis_remis_complet_check` |
| **date de rédaction** | arrêté 24/01/2017, art. 4-I | **aucune colonne nouvelle : c'est `devis.remis_le`** | la contrainte de remise l'exige déjà, puisque `remis_le` est posé par la base |
| **conditions générales** | R. 111-2 | `emetteur.cgv_texte` | nulle part — « s'il en utilise » |
| **droit applicable** | R. 111-2, 7° | `emetteur.clause_droit_applicable` | nulle part — conditionnel |
| **juridiction** | R. 111-2, 8° | `emetteur.clause_juridiction` | nulle part — conditionnel |

**Et quatre décisions qui vont avec, parce qu'une colonne ne suffit pas :**

**1. Opus ne compose AUCUN de ces textes.** `garanties_texte`, `sav_texte`,
`cgv_texte` et les deux clauses sont des champs **que l'artisan écrit**. L'écran
dit ce que la loi demande de couvrir et renvoie à la source ; il ne propose
aucune formule à cocher. C'est la règle du 29/09 — « ne jamais lui écrire des
mentions légales : ce serait faux, et une mention légale fausse engage sa
responsabilité » — appliquée au document de son client. Pour les conditions
générales, l'écran dit en français que **la loi n'en exige la communication que
si l'on en utilise** : laisser vide est une réponse, pas un oubli.

**2. Les frais de déplacement sont le cas le plus net, et un `null` n'est pas
un 0.** Le dossier les marque comme **la seule mention de prix présente dans les
TROIS listes** de l'arrêté. Donc trois états, et ils sont distincts :

| | ce que ça veut dire | ce que le gabarit imprime |
|---|---|---|
| `null` | **non déclaré** | rien — et la remise refuse |
| `0` | l'artisan a déclaré **ne pas en facturer** | « Frais de déplacement : non facturés » |
| un montant, ou un texte de modalités | déclaré | ce qu'il a écrit |

L'écran porte donc un interrupteur « Je ne facture pas de frais de déplacement »
qui écrit **0**, et jamais un champ qu'on laisse vide : un champ vide et un
« aucun » se ressemblent à l'œil et ne se ressemblent pas en droit. Le libellé
« non facturés » est un constat de fait, pas une clause — **à confirmer avec
vous quand même**, parce que c'est du texte imprimé sur votre document.

Et une distinction à ne pas perdre : **la mention informe, la facturation est une
LIGNE.** Les frais de déplacement réellement facturés sur un chantier sont une
ligne de devis comme une autre, avec sa quantité et son prix unitaire. La colonne
d'`emetteur` porte le **tarif annoncé**, pas le montant facturé. Sans cette
séparation, on aurait deux endroits pour un seul chiffre, et ils se
contrediraient.

**3. Le délai d'exécution ne se refuse pas, il se remplit.** À défaut
d'indication, le professionnel doit exécuter **au plus tard trente jours** après
la conclusion (L. 216-1) : laisser le champ vide, c'est s'engager à trente jours
sans le savoir. Donc la colonne est **exigée à la remise**, et l'écran offre un
appui unique qui écrit « sous 30 jours » en disant **pourquoi** : « c'est ce que
la loi applique si vous ne dites rien ». Le champ est ainsi toujours rempli,
jamais inventé, et l'artisan apprend la règle en passant. C'est le motif du
bouton « Utiliser l'adresse de mon compte » du 05/10 : **on MONTRE avant de
poser.**

Et le délai vit sur le **DEVIS**, pas sur l'émetteur : il dépend du chantier. Il
est donc déjà figé par `devis_se_fige()` — **rien à copier dans l'instantané.**
C'est la règle générale de l'instantané : on copie ce qui vient d'AILLEURS
(l'émetteur, le client), jamais ce qui est tapé sur le devis lui-même.

**4. La date de rédaction : c'est `remis_le`, et `created_at` ne s'imprime
JAMAIS.** Un brouillon commencé en janvier et remis en juin a deux dates
candidates, et le brouillon ne disait pas laquelle sort.

> **Ce qui s'imprime est la date de la REMISE**, posée par la base dans
> `confirmer_remise_devis()` avec `clock_timestamp()` — et non `now()`, qui rend
> l'heure de début de transaction (la leçon du journal d'administration du
> 03/10). **Elle n'est jamais tapée, donc elle n'est jamais antidatée.**
>
> `created_at` est la date où le brouillon a été ouvert. L'imprimer sur un
> document parti six mois plus tard serait antidater le document — et un devis
> antidaté peut priver le client d'un délai qui lui appartient. **La seule
> façon de faire apparaître une date antérieure est d'émettre un nouveau devis**,
> ce jour-là, ce qui est exactement la règle « pour corriger un devis remis, on
> en émet un nouveau ».

Et il ne faut pas confondre les deux dates que le document porte : la **date de
rédaction** (la remise) et la **conclusion du contrat**, d'où partent les
quatorze jours de rétractation (L. 221-18), qui est l'arrivée de l'acceptation
(art. 1121). Ce sont deux faits différents, à deux endroits différents du
document, et le gabarit ne doit jamais présenter l'un pour l'autre.

> **Une colonne `date_redaction` séparée serait un « bouton §18 »** : une seconde
> écriture d'un fait que `remis_le` porte déjà, qui peut en diverger, et que
> personne ne saurait arbitrer. On ne la pose pas — **et on écrit dans le
> commentaire de section que le gabarit lit `remis_le`**, pour que personne ne la
> réinvente dans six mois.

### Le fait qui commande tout le reste

L'arrêté du 24 janvier 2017 ne décrit pas un devis, il en décrit **deux** :

- son **article 4, I** vise la prestation conclue **en établissement
  commercial** — dix mentions ;
- son **article 4, II** vise le contrat conclu **hors établissement**, chez le
  client, et renvoie à la **forme du contrat** des articles L. 221-5 et
  L. 221-9 du code de la consommation : moins de mentions de prix, mais tout
  l'appareil de la rétractation en plus.

> **Et le cas normal d'un artisan est le II.** Un devis signé sur un téléphone
> pendant une visite est un contrat hors établissement. C'est aussi le seul des
> deux dont le manquement soit **pénal**. On traite donc le II d'abord.
>
> **Mais ça reste une déduction, pas une mesure** — d'où la **question 7** :
> « quand vous faites signer, c'est chez le client ou chez vous ? » Si vous
> faites signer à l'atelier, la moitié chère du lot 2 est votre cas rare et pas
> votre quotidien, et `lieu_conclusion` ne doit pas avoir ce défaut-là.

### 2.1 Ce qui est SÛR — on le code

**Le devis est obligatoire dès le premier euro** pour les prestations de
dépannage, réparation et entretien du bâtiment (arrêté du 24/01/2017, art. 1 et
4). **Le seuil de 150 € n'existe plus** — arrêté de 1990 abrogé, effet au
1er avril 2017. Il est encore répété par la moitié des sites, et la DGCCRF a
relevé des artisans qui ne remettaient un devis qu'à partir de là.
`verifier-devis` doit **refuser le nombre 150 associé au mot « devis »** dans
tout le dépôt.

Corollaire d'usage, et il décide de la forme du formulaire : **un devis de 60 €
doit être aussi rapide à produire qu'un devis de 6 000 €.**

**Les dix mentions de l'art. 4, I** (lues verbatim, dans l'ordre du texte) :
date de rédaction ; raison sociale et adresse de l'entreprise ; nom du client ;
lieu d'exécution ; nature exacte des réparations ; **décompte détaillé en
quantité et en prix de chaque prestation et produit** (dénomination, prix
unitaire, unité de mesure, quantité) ; le cas échéant les frais de déplacement ;
somme globale HT et TTC en précisant le taux de TVA ; durée de validité de
l'offre ; **caractère payant ou gratuit du devis**. Plus les informations des
art. L. 111-1 et L. 111-2.

> **Un détail de citation qui n'est pas un détail** : l'art. 4, I présente ses
> dix mentions **sous forme de tirets, sans numérotation**. On ne cite donc
> jamais « art. 4, I, 7° » — ça n'existe pas. Même chose pour l'annexe.

**Six informations dues pour TOUT devis**, même hors du champ de l'arrêté
(L. 111-1) : caractéristiques essentielles, prix, **délai d'exécution**,
identité et coordonnées postales, téléphoniques et électroniques,
**garanties légales et commerciales** (et le service après-vente, le cas
échéant), **médiateur de la consommation**.

**L'identité de l'émetteur** (R. 111-2) : statut et forme juridique,
coordonnées, n° d'inscription au RCS ou au RNE, n° de TVA intracommunautaire,
conditions générales s'il en utilise, **clauses de droit applicable (7°) et de
juridiction (8°)**, et **l'assurance de responsabilité professionnelle avec les
coordonnées de l'assureur et la couverture géographique**.

**L'assurance est une PIÈCE JOINTE, pas une phrase.** Les personnes soumises à
l'obligation d'assurance décennale **joignent à leurs devis et à leurs factures
une attestation d'assurance** (code des assurances, art. L. 243-2, al. 2). Cela
vise les constructeurs des art. L. 241-1 et L. 241-2 — **architectes, bureaux
d'études et géomètres compris**, qui sont des constructeurs au sens de
l'article 1792 du code civil.

> **Et l'autre texte ne se cumule pas avec celui-là.** L'art. L. 132-1 du code
> de l'artisanat fait imprimer une **mention** d'assurance sur le devis — mais
> il **exclut expressément** les personnes des art. L. 241-1 et L. 241-2. La
> plupart des sites présentent cette mention comme l'obligation des artisans du
> bâtiment : c'est l'inverse. Le bâtiment relève de l'**attestation jointe**.
>
> **Opus ne compose RIEN de cette attestation** : elle est produite par
> l'assureur. On stocke, on joint, on affiche l'expiration, on prévient quand
> elle est passée.

**L'exemplaire remis** (L. 221-9) : un exemplaire **daté** du contrat, sur
papier **signé par les parties** ou, avec l'accord du client, sur un autre
support durable, et **accompagné du formulaire type de rétractation**. Le mot
« détachable » n'est pas dans la loi : l'exigence vient de la jurisprudence
(Cass. 1re civ., 20/12/2023, n° 21-16.491 — l'usage du formulaire ne doit pas
porter atteinte à l'intégrité du contrat que le consommateur doit conserver).

**Les trois délais, et le troisième décide de tout :**

| | |
|---|---|
| **14 jours** de rétractation, sans motif, à compter de la conclusion (L. 221-18) | le client peut l'exercer dès la conclusion |
| **7 jours** d'interdiction de **tout** paiement, acompte compris (L. 221-10) | même point de départ |
| **12 mois** de prolongation si l'information n'a pas été donnée (L. 221-20) | **un contrat résiliable un an et quatorze jours, chantier terminé ou non** |

> **Aucune amende de ce dossier ne coûte cela à un artisan.** Ce n'est pas une
> amende, c'est le chantier perdu. **C'est l'argument pour que le bloc de
> rétractation appartienne au gabarit COMMUN et soit impossible à retirer par un
> habillage.**

**L'exception d'urgence** (L. 221-28, **8°**) : pas de rétractation pour les
travaux d'entretien ou de réparation **à réaliser en urgence au domicile**,
**expressément sollicités** par le client, dans la limite des travaux
strictement nécessaires. Le **8° n'exige AUCUN renoncement exprès** — c'est le
1° (service pleinement exécuté) qui l'exige. Trois chercheurs avaient inversé
les deux.

**La demande d'exécution anticipée** (L. 221-25) : si le client demande
l'exécution avant la fin du délai, sa **demande expresse** doit être recueillie
sur support durable, accompagnée de sa reconnaissance qu'il perdra son droit une
fois la prestation pleinement exécutée. À défaut, **le consommateur ne doit
rien payer** pour ce qui a été fourni.

> **C'est la mention la plus chère que les trois conceptions ont oubliée**, et
> c'est le cas ORDINAIRE : le client veut qu'on commence la semaine prochaine.
> Ce n'est pas une amende plafonnée, c'est le prix du chantier.

**L'information sur les pièces remplacées** (art. 4, **III**) : le client doit
être informé qu'il peut conserver les pièces remplacées, selon le modèle-type
de l'annexe — la question, deux cases OUI/NON, et une signature précédée de la
mention manuscrite « Lu et approuvé ».

> **Elle vise les DEUX cas.** Le III commence par « Dans le devis visé au I
> précité **ou** dans le contrat conclu hors établissement visé au II ». Elle est
> donc **systématique** sur un devis de dépannage, réparation ou entretien. Un
> chercheur l'avait réservée au hors-établissement : c'est l'inverse, et c'est
> plus simple à construire.

**La TVA : le taux vit sur la LIGNE.** 20 % par défaut ; 10 % pour
l'amélioration, la transformation, l'aménagement et l'entretien de locaux
d'habitation **achevés depuis plus de deux ans** (art. 279-0 bis) ; 5,5 % pour
les matériaux et équipements d'économie d'énergie dans des locaux **achevés
depuis au moins deux ans** (art. 278-0 bis A).

> **ET CETTE ASYMÉTRIE N'EST PAS ÉTABLIE — elle appartient au §2.3, pas ici.**
> Une relecture indépendante est allée voir les sources, et elles se
> contredisent :
>
> | source | ce qu'elle dit de l'art. 278-0 bis A |
> |---|---|
> | `BOI-TVA-LIQ-30-20-90-40` § 80, en vigueur depuis le 09/09/2026 | **plus de deux ans** |
> | titre de l'arrêté du 9 septembre 2014 pris pour son application | **plus de deux ans** |
> | `BOI-TVA-LIQ-30-20-95`, chapeau | plus de deux ans |
> | `BOI-TVA-LIQ-30-20-95`, **I-A § 10** | **au moins deux ans** |
>
> C'est le motif exact du §2.3 — « les sources ne concordent pas, irréconciliable
> en l'état » — et je ne l'avais pas appliqué ici. **Pire : le § 80 que ce plan
> cite lui-même** pour la certification fait porter **la MÊME** condition
> d'ancienneté aux deux taux.
>
> **Le coût d'une erreur dans ce sens-là est le pire du dossier.** Un contrôle
> écrit sur l'asymétrie accorderait le 5,5 % à un logement achevé il y a
> exactement deux ans qui n'y aurait pas droit — palier 3, **non plafonné**, et
> le contrôle serait VERT. C'est la famille de défaut que ce document traque sur
> deux mille six cents lignes, retournée contre lui.
>
> **Ce qu'on code donc, et ce qu'on ne code pas :** on stocke une **DATE**
> d'achèvement, jamais un booléen, et on calcule **par taux** — ça, c'est sûr et
> ça ne coûte rien. **Mais aucun contrôle n'encode la différence d'un jour entre
> les deux taux**, et le cas limite « achevé il y a exactement deux ans » est
> écrit dans le jeu d'essai **comme une question ouverte**, pas comme une
> attente. Il se tranche par le comptable du propriétaire ou par un rescrit, pas
> par moi.

Restent au taux normal : la production d'un immeuble neuf ou +10 % de surface de
plancher ; et trois items **distincts** du 2 bis — a) **les travaux de
nettoyage** (tous, pas seulement ceux des espaces verts), b) l'aménagement et
l'entretien des espaces verts, c) les travaux comprenant la fourniture ou
l'installation d'une chaudière à combustibles fossiles (mais son **entretien**
reste à 10 %). Les équipements que **le client achète lui-même** restent à 20 % :
seule la pose bénéficie du taux réduit.

**La certification du client** (depuis le 16/02/2025) : ce n'est plus une
attestation séparée, c'est le **preneur** qui certifie **sur le devis ou la
facture**. Trois choses à certifier (BOI-TVA-LIQ-30-20-90-40, § 80), et une
seule case « je certifie que les conditions sont remplies » **ne couvre pas ce
que le texte exige**. À défaut, en cas de certification incomplète, ou si le
prestataire ne conserve pas le document, **le taux normal s'applique à
l'ensemble des prestations** et le prestataire en est **seul débiteur**.

**La numérotation : le devis n'a RIEN à tenir.** L'obligation de numéro
« unique, basé sur une séquence chronologique et continue » est une obligation
de **FACTURE** (CGI, annexe II, art. 242 nonies A, I, 7°). **L'article ne
contient pas une seule occurrence du mot « devis »**, et l'art. 4 de l'arrêté
ne comporte aucun numéro, ni au I ni au II.

> **C'est la conclusion de conception la mieux établie du dossier.** Un devis
> abandonné laisse un trou, et **ce trou n'est pas un défaut** : on n'écrit
> aucun contrôle de continuité des devis, et on ne refuse pas la suppression
> d'un brouillon « pour ne pas faire de trou ».

**Le cycle de vie, tranché par le code civil :**

| état | ce que le droit dit |
|---|---|
| brouillon | l'offre se rétracte librement tant qu'elle n'est pas **parvenue** au destinataire (art. 1115) |
| remis | l'offre ne peut plus être rétractée avant l'expiration du délai (art. 1116), et elle est caduque ensuite (art. 1117) |
| accepté | le contrat est conclu dès que l'acceptation **parvient** à l'offrant (art. 1121) ; il ne se modifie que du consentement mutuel (art. 1193) |

> **Un contresens à ne JAMAIS écrire sur un écran d'Opus** : la remise ne
> « l'engage » pas au sens contractuel. Tant que l'acceptation n'est pas
> parvenue, **il n'y a pas de contrat** — ce qui naît est une interdiction de
> rétracter, dont la violation engage une responsabilité **extracontractuelle**.

Trois règles qui en découlent, et qui sont des refus de la base : **le silence
ne vaut pas acceptation** (art. 1120) ; **aucune acceptation partielle** (art.
1118, al. 3 — un client qui accepte « sauf la ligne 4 » contre-propose) ; **un
devis caduc ne peut plus être accepté**.

**Nommer la somme demandée** : un **acompte** engage les deux parties, des
**arrhes** permettent de se dédire (art. 1590 du code civil). Et **sauf
stipulation contraire, les sommes versées d'avance sont présumées être des
ARRHES** — par l'**art. L. 214-1 du code de la consommation**, et seulement
entre professionnel et consommateur.

> Un champ qui s'appellerait « premier versement » appliquerait donc par défaut
> **le régime le moins favorable à l'artisan**, sans que personne ne l'ait
> décidé. On nomme, par une liste fermée de deux valeurs.

**Aucun plafond légal d'acompte.** Les 30 % sont un **usage**, pas une règle :
on écrit « usage courant », on ne refuse pas 50 %.

**La conservation : six ans sous forme ÉLECTRONIQUE** pour un document né
électronique (LPF, art. L. 102 B, version en vigueur depuis le 01/01/2023). La
tolérance « trois ans puis tout support » est **périmée**. Et la durée à écrire
dans la politique de confidentialité d'Opus est **dix ans pour les factures**
(code de commerce, art. L. 123-22) : deux textes, deux durées, la plus longue
commande. Écrire « 6 ans » parce qu'une source le dit serait **faux**, et une
durée fausse dans une politique RGPD engage le propriétaire.

### 2.2 Ce qui est NUANCÉ — on le code avec une condition

- **Le champ d'application est une liste de 21 familles**, et les abrégés
  rétrécissent le champ. Il faut un drapeau **par métier** dans
  `src/data/catalogue-metiers.js`, établi à la main sur les libellés complets
  **et relu**, parce qu'il décide d'un refus. Les 8 métiers déclarés sur la
  vraie base y sont tous ; `conseil`, `conception`, `etudes`, `mesure` et
  `construction` en sont dehors. **Et le drapeau ne BLOQUE pas, il DURCIT** :
  les six informations de L. 111-1 s'appliquent toujours, le drapeau ajoute les
  dix mentions de l'arrêté.
- **Il existe d'autres régimes de devis obligatoire, et l'un touche Opus** :
  l'arrêté du 17 mars 2015 impose un devis personnalisé **et GRATUIT** dès 100 €
  TTC mensuels pour les services à la personne, qui englobent les **petits
  travaux de jardinage et de bricolage**. « Devis payant » ne peut donc **pas**
  être un réglage global du compte.
- **Le coût du devis n'est pas une mention du devis.** L'arrêté exige
  « l'indication du caractère payant ou gratuit », **et rien de plus**. Le coût
  est dû **avant**, au titre de l'art. 2. Donc : case obligatoire, champ de prix
  facultatif.
- **La durée de validité n'est obligatoire qu'au I.** On la porte toujours —
  c'est elle qui fait courir le délai de l'art. 1116 et rend la caducité
  calculable — mais **on n'écrit pas dans l'application qu'elle est due partout**.
  Aucun texte ne fixe de durée : les « 3 mois » sont un usage.
- **Le type du client ne suffit pas à décider du gabarit.** Un professionnel
  employant **au plus cinq salariés** bénéficie des protections du
  hors-établissement **quand l'objet du contrat n'entre pas dans le champ de son
  activité principale** (L. 221-3). Trois conditions cumulatives dont Opus ne
  connaît pas deux. **Donc une question explicite par devis, jamais une
  déduction depuis `clients.type`.**
- **La sous-traitance** : le preneur acquitte la taxe quand il est **assujetti**
  (CGI, art. 283, 2 nonies) ; le sous-traitant facture hors taxe. Mais la mention
  « Autoliquidation » est une mention de **FACTURE** (art. 242 nonies A, 13°) :
  le devis **informe** que la taxe sera due par le preneur, sans prétendre
  porter une mention de facture.
- **L'entrepreneur individuel** doit incorporer son nom plus « EI » ou
  « entrepreneur individuel » dans sa dénomination (**R. 526-27**, et non
  L. 526-22). **Aucune sanction n'est prévue dans cette section**, et les 750 €
  qui circulent viennent de R. 123-237, **qui ne nomme pas le devis**. Opus ne
  compose JAMAIS cette dénomination en concaténant : « EI » accolé à une raison
  sociale de SARL serait faux.
- **Le médiateur** : l'art. R. 616-1 ne nomme pas le devis, mais L. 111-1, 6° en
  fait une information précontractuelle sanctionnée. On le porte — c'est la voie
  sûre — et on le présente dans le code comme **une déduction, pas une exigence
  littérale**.
- **La dispense de certification sous 1 000 € TTC** existe, pour la réparation
  et l'entretien seulement, et **elle allège sans supprimer** : quatre mentions
  restent dues. **Ce plan ne l'implémente pas** (voir §6) : imprimer la mention
  dans tous les cas est strictement plus sûr, elle ne gêne personne, et son
  absence peut coûter le complément de taxe.
- **Les seuils de franchise** : 85 000 / 93 500 €, avec un sous-plafond de
  **37 500 / 41 250 €** pour les prestations de services. **Les travaux
  immobiliers sont des services en totalité, fourniture et pose comprises** : le
  plafond réellement opposable à un artisan du bâtiment est donc 37 500 €, pas
  85 000. Et le dépassement prend effet **à la date du dépassement** depuis 2025,
  pas au 1er janvier suivant.
- **La mention de franchise n'est pas une formule unique** : l'art. 293 E, II
  exige « la mention correspondant à la base légale » et admet plusieurs
  rédactions. Et **il ne suffit pas de masquer la colonne** : un gabarit qui
  afficherait « TVA 0 % » dirait quelque chose de faux — un franchisé ne facture
  pas de la TVA à zéro, il n'en facture pas du tout.
- **L'affichage PUBLIC des tarifs.** L'arrêté du 24/01/2017, **art. 3**, veut le
  taux horaire et les frais de déplacement « aisément accessibles sur tout espace
  de communication en ligne dédié au professionnel ». **Une fiche pro Opus en est
  un.** Le dossier le dit en propres termes : « c'est une obligation qu'Opus ne
  tient pas aujourd'hui… mais c'est **sa décision** avant d'être un
  développement ». C'est la **question 6**, et elle décide d'une table. Voir §8.

### 2.3 Ce qui N'EST PAS ÉTABLI — on ne le code pas, ou on le rend daté

- **Le siège textuel de la TVA bouge, et les sources ne concordent pas.**
  Légifrance porte « abrogé […] avec effet au 1er janvier 2027 » sur les
  articles de TVA ; un rescrit BOFiP dit « au CGI jusqu'au 31 août 2026, au CIBS
  à compter du 1er septembre 2026 ». **Irréconciliable en l'état.** Ce qui est
  sûr, et c'est tout ce dont le logiciel a besoin : **les renvois au CGI sont
  admis jusqu'au 31 décembre 2027.**
- **La référence CIBS de la mention de franchise** : L. 223-3 ou L. 233-3, et
  deux dates. **L'article n'a pas pu être lu sur Légifrance.** On garde
  « art. 293 B du CGI » et **on n'écrit aucune référence CIBS avant de l'avoir
  lue**.
- **La formulation officielle de la certification** : l'administration publie
  des **modèles** (BOI-LETTRE-000280) et admet d'autres rédactions. Il n'existe
  **pas de libellé imposé**, les modèles ne comportent **ni date ni signature**,
  et Opus ne présente jamais sa clause comme « le texte officiel ».
- **Les critères techniques du 5,5 %** (annexe IV) : les seuils de pompes à
  chaleur annoncés sont **réfutés**, deux arrêtés les ont changés en dix-huit
  mois, et **la certification du client ne les couvre pas** — le prestataire en
  répond seul. On trace le fondement, on ne vérifie pas.
- **L'arrondi** : aucune règle de droit trouvée. Ce qui est solide est une
  **norme technique** : EN 16931, socle de la facturation électronique, impose la
  TVA calculée sur la **somme** des montants d'un même taux et arrondie **une
  seule fois**. On l'adopte **comme choix technique traçable, pas comme une
  obligation légale**.
- **Les sanctions de quatre obligations réelles ne sont pas établies** :
  l'omission de la mention d'assurance (L. 132-1), l'attestation décennale
  jointe (L. 243-2), la dénomination « EI » (R. 526-27). **On les tient parce
  qu'elles sont obligatoires, pas parce qu'on sait ce qu'elles coûtent.** Et
  tous les montants du dossier sont des **plafonds** (« ne peut excéder »), pas
  des montants fixes.
- **L'arrêté du 22 mars 2017** (PDF/A-3, cachet serveur, horodatage) ne vise
  **que les factures nées sur PAPIER**, pour un assujetti qui veut détruire
  l'original. **L'implémenter serait un travail considérable fondé sur une
  erreur de lecture.** Et il n'impose pas SHA-256, contrairement à ce que
  répètent les blogs.
- **L'art. 1793 n'est pas la règle du devis** — quatre conditions cumulatives,
  dont la construction à forfait d'un **bâtiment** avec le **propriétaire du
  sol**, et la Cour de cassation exclut l'entretien, le dépannage et la
  réparation. **La majorité des devis d'Opus n'en relève pas.**
- **La tension entre conservation légale et droit à l'effacement n'est pas
  tranchée**, et elle doit l'être **avant la table `factures`**. Côté devis, ce
  qui est sûr : **un devis non accepté n'est pas un contrat, et aucun texte ne
  fixe sa durée de conservation** — c'est une durée CHOISIE, écrite, et tenue.

### 2.4 CE QUI N'APPARTIENT QU'AU PROPRIÉTAIRE

Aucun programme ne peut deviner ce qui suit, et l'inventer serait une faute : une
mention fausse engage celui qui la publie — ici, les artisans qui s'en
serviront. C'est la règle du 29/09 appliquée au document de son client.

**Son entreprise** : adresse postale complète ; forme juridique et dénomination
légale ; numéro et registre d'immatriculation ; n° de TVA intracommunautaire ;
conditions générales et clauses de droit applicable et de juridiction, s'il en a.

**Sa TVA** : régime (franchise ou réel) **et depuis quelle date**. Opus ne peut
pas le calculer — son chiffre d'affaires n'est pas dans Opus, il facture aussi
ailleurs. **Un voyant faux sur un seuil fiscal est pire que pas de voyant.**

**Son assurance** : le **PDF de son attestation décennale** (0 fiche sur 7 en
porte une), le nom et les coordonnées de son assureur, le numéro de contrat, la
couverture géographique.

**Sa médiation** : nom, adresse et **adresse du site** de l'organisme dont il
relève. Ce n'est pas une information à trouver : **il faut y adhérer**, c'est un
abonnement, et c'est un choix. L'omission est sanctionnée.

**Ses tarifs** : taux horaire TTC et modalités de décompte du temps (au quart
d'heure, minimum de déplacement…), **frais de déplacement** (et s'il n'en
facture pas, il doit le dire — un `null` n'est pas un 0), devis gratuit ou
payant, durée de validité habituelle.

**Ses garanties légales et commerciales, son service après-vente.** C'est le 5°
de L. 111-1, son omission est sanctionnée **cinq fois plus cher** que celle de
son adresse, et c'est le bloc le plus systématiquement absent des modèles de
devis du commerce. **Il a désormais sa colonne** (§2.0) : le brouillon le
nommait quatre fois et ne le rangeait nulle part.

**Et deux choses qui ne sont pas des champs :**

1. le **contrat de sous-traitance RGPD** du carnet de clients
   (`EDITEUR.contratSousTraitance` toujours à `false`) ;
2. **son immatriculation.** Il n'a ni SIRET ni assurance décennale. Il peut
   **construire** et **essayer** le module ; il ne peut pas émettre un devis
   conforme.

> **`STATUT = 'essai'` ne protège RIEN ici** : un devis engage son émetteur dès
> sa remise, même émis depuis une application fermée. Donc **aucun essai sur la
> vraie base ne doit produire un document qui ressemble à un vrai devis remis à
> un vrai client**, et les cinq modèles se jugeront sur un devis d'essai.

### 2.5 La hiérarchie du coût d'une erreur — c'est elle qui ordonne les lots

| palier | manquement | ce que ça coûte |
|---|---|---|
| **1 — PÉNAL + NULLITÉ** | exemplaire non daté/non signé ; contrat sans formulaire de rétractation ; paiement exigé avant J+7 | 150 000 € de plafond, 2 ans d'emprisonnement selon les cas, **et la nullité du contrat** (L. 242-1) |
| **2 — le chantier perdu** | information sur la rétractation non donnée | **12 mois + 14 jours** de rétractation (L. 221-20) |
| **3 — FISCAL, non plafonné** | taux réduit sans certification complète | **la totalité** du devis au taux normal, prestataire seul débiteur |
| **4 — 15 000 / 75 000 €** | information précontractuelle du hors-établissement, règles de rétractation, **omission des garanties** | plafonds relevés en 2022 |
| **5 — 3 000 / 15 000 €** | les dix mentions de l'arrêté, L. 111-1, médiateur | 64 % d'anomalies relevées par la DGCCRF dans le dépannage |
| **6 — obligation réelle, sanction non établie** | dénomination « EI », mention L. 132-1, attestation jointe | on les tient quand même |

> **Et c'est ce tableau qui condamne le trou du §2.0** : les garanties sont au
> palier **4**, au-dessus des dix mentions de l'arrêté. Le brouillon les classait
> lui-même là, et ne leur donnait pas de colonne.

---

## 3. LES DÉCISIONS DE CONCEPTION

### 3.1 Où vit un brouillon — et pourquoi il vit EN BASE

**Il vit en base, dès la première ligne, dans la table `devis` elle-même.**

C'est l'inverse de ce que la section 39 a décidé pour le récit de chantier, et
la raison de la différence est la seule qui compte : `chantiers` est une table
**PUBLIQUE** (`lecture chantiers visiteur to anon using (true)`), et **une règle
RLS filtre des LIGNES, jamais des COLONNES**. Un brouillon rangé là aurait été
lisible par n'importe qui, sans compte, à la seconde où l'agent l'écrit — il
aurait fallu des droits de colonne, donc casser `select *` pour tout le monde,
pour protéger un texte qui n'avait pas besoin d'exister.

> **`devis` est privée dès sa première ligne** : une seule politique
> `for all to authenticated` via `est_mon_entreprise(pro_id)`, **aucune
> politique `anon`**, et **`revoke all on public.devis from anon`**. Le
> brouillon peut donc vivre en base, et il DOIT y vivre : un devis se tape sur
> un chantier, en plusieurs fois, et un brouillon perdu est une demi-heure
> perdue.

**Ce qui est ÉCARTÉ, et pourquoi :**

- **une colonne de devis sur `professional_profiles`** — mesuré : `anon` détient
  `SELECT` sur ses **45 colonnes**, et sa politique de lecture est
  `for select using (true)` au rôle `public`. L'adresse de rue d'un
  micro-entrepreneur **est son domicile**, et c'est exactement pour cela que la
  carte de zone s'arrête à la commune depuis le 30/09 : « une carte qu'on peut
  agrandir finit par montrer la rue » ;
- **une colonne de devis sur `chantiers`** — même raison, vitrine publique ;
- **le motif à DEUX politiques de la section 18** (la vraie règle plus une
  lecture `to anon`). Il existe parce qu'une policy appelant une fonction
  interdite à l'appelant **ÉCHOUE au lieu de filtrer**. Il est juste pour une
  vitrine ; il n'a rien à faire ici, où un visiteur doit lire **zéro**. C'est le
  modèle de la section 30 (les demandes des particuliers, refermées le 04/10),
  pas celui de la section 36.

> **Et la question 6 est la seule chose qui puisse fissurer ce raisonnement.**
> Si vos tarifs doivent s'afficher publiquement (arrêté art. 3), alors deux ou
> trois colonnes de cette table privée doivent devenir publiques — et **une
> règle RLS ne sait pas faire ça**. Il faudra les déménager. C'est pour cela
> qu'elle se pose **avant** le lot 0 et pas après : voir §8, question 6.

**Et une conséquence de forme, qui retire un geste sur le chantier :**
`client_id` est **nullable tant que le devis est un brouillon**, et une
contrainte nommée l'exige dès la remise. Ce n'est pas un relâchement, c'est
l'art. 1115 lu correctement : une offre qui n'est pas parvenue à son destinataire
n'a pas à nommer qui que ce soit. **Il tape ses lignes d'abord, il dit pour qui
ensuite** — c'est l'ordre dans lequel on pense devant un toit.

### 3.2 La numérotation — par entreprise, sous un verrou, et sans contrôle de continuité

**Les deux solutions évidentes sont fausses, et c'est mesuré :**

| | mesuré sur PostgreSQL 16 |
|---|---|
| une **séquence** PostgreSQL | `nextval` rend 1, puis 2 dans une transaction annulée, puis 3 — **le 2 est perdu**. Et elle est GLOBALE : l'entreprise B verrait son premier devis numéroté 47, donc le volume des autres fuiterait |
| **`max(numero)+1`** côté application | deux sessions dont les lectures se chevauchent : B lit 1 et écrit, **A meurt sur « duplicate key »** |

> Le piège de méthode du second est qu'il **PASSE à l'essai** : un essai de bout
> en bout écrit une fois à la fois. Et quand il mordra, le propriétaire lira
> « Votre devis : cela existe déjà » — la traduction de 23505 par `erreurs.js` —
> et partira chercher un doublon qui n'existe pas.

**La forme retenue, mesurée :**

```sql
perform pg_advisory_xact_lock(hashtextextended(v_pro::text || ':' || v_annee::text, 0));
select coalesce(max(rang), 0) + 1 into v_rang
  from public.devis where pro_id = v_pro and annee = v_annee;
```

Les deux mêmes sessions rendent alors **1 puis 2, sans aucune erreur**. Verrou
consultatif porté par la **transaction** (il se relâche au commit comme au
rollback), clé sur le couple entreprise-année pour que deux années ne se
bloquent pas. Plus un **index unique partiel** `(pro_id, annee, rang) where rang
is not null` comme seconde ligne de défense : un numéro en double est bien pire
qu'un refus, et un index ne dépend d'aucun raisonnement.

Format `DEV-2026-0001`, **stocké** et non recalculé à l'affichage (si le format
change, les devis déjà remis gardent le leur), et **non configurable** — « le
meilleur message d'erreur est celui qu'on ne peut plus déclencher », et un
format paramétrable est un format qu'on casse.

**Quand il est attribué, et c'est le point qui dénoue un cercle.** Le PDF doit
porter le numéro ; le numéro marque la remise ; la remise vient après le PDF. La
remise se fait donc **en deux temps** :

1. `preparer_remise_devis(p_devis)` pose le numéro, l'instantané, la validité et
   les mentions — **sans changer le statut**. Elle REFUSE si le document serait
   incomplet, et le message **nomme ce qui manque, champ par champ** ;
2. l'application compose le HTML, produit le PDF, compte ses pages et ses octets,
   le renomme, le téléverse ;
3. `confirmer_remise_devis(p_devis, chemin, octets, pages)` fait le passage à
   `remis` **et pose `remis_le` avec `clock_timestamp()`** — c'est cette date
   qui s'imprime comme date de rédaction (§2.0).

> **Et c'est cette forme en deux temps qui rend le lot 2 vérifiable depuis ce
> conteneur**, alors que le brouillon le croyait impossible : les deux fonctions
> reçoivent les faits du fichier **en arguments**, donc rien ne les oblige à être
> appelées depuis un téléphone. Voir §3.11 — c'est la correction la plus utile de
> cette relecture après celle du figeage.

**Un brouillon déjà numéroté est parfaitement sain** : le numéro est réservé, et
s'il reprend son brouillon trois jours plus tard il garde le même. S'il
l'abandonne, il consomme un numéro et laisse un **trou**.

> **Et ce trou n'est pas un défaut.** On n'écrit **aucun contrôle de continuité
> des devis** — ce serait un garde-fou qui ne garde rien —, et on ne refuse pas
> la suppression d'un brouillon « pour ne pas faire de trou ».

**Deux tables, deux régimes, et c'est le piège central du module.** Une table
unique `documents` avec une colonne `type` partagerait fatalement le compteur, et
**le premier devis supprimé ferait un trou dans la séquence des FACTURES** : une
non-conformité fiscale créée par une économie de table, qui ne lèverait aucune
erreur.

**Et les deux signatures sont DÉFINITIVES.** `create or replace function` avec
un paramètre de plus **surcharge** au lieu de remplacer, l'appel sans argument de
PostgREST devient ambigu, et le connecteur Supabase refuse `drop function`.
Mesuré en section 34. Toute évolution passe par les **colonnes**, jamais par les
arguments.

### 3.3 LE FIGEAGE — le motif du brouillon était INVERSÉ, et c'est mesuré

**C'est la correction la plus importante de ce document.**

Le brouillon donnait, deux fois, le motif suivant : une fonction,
`before update or delete`, liste blanche par
`new := jsonb_populate_record(new, to_jsonb(old) - 'statut' - …)`, `return new` à
la fin, discriminant de cascade par la ligne parente. Il a été **éprouvé tel
quel** sur un PostgreSQL 16.13 neuf.

| cas | ce que le brouillon ANNONCE | MESURÉ |
|---|---|---|
| `delete` d'un devis **`remis`** | refusé, `OP003`, message français | **il PART** — 0 ligne restante, aucune erreur |
| `delete` d'un **brouillon** | autorisé | **il RESTE** — 0 ligne supprimée, aucune erreur |
| `update` du total d'un `remis` | refusé | **correct** — 99900 inchangé |
| cascade de suppression de compte | passe | **correct** — 0 ligne restante |

**Les deux règles du module, exactement à l'envers.** Et le second cas est
« 0 ligne supprimée sans un mot », ce que ce projet a interdit en propres termes
le 05/10 : « une politique rend 0 ligne modifiée sans un mot, un déclencheur DIT
pourquoi ».

**LE MÉCANISME, mesuré par une sonde `raise notice` :**

1. dans un `before delete`, **`NEW` EST NUL** (`new is null` rend `t`) ;
2. `jsonb_populate_record(NULL, to_jsonb(OLD))` rend un enregistrement **NON
   NUL** — mesuré : `(1,x)`. Donc sur un devis remis, la branche de liste blanche
   tourne, fabrique une ligne de nulle part, et `return new` **ne bloque rien** ;
3. et un `before delete` qui rend `NULL` **annule la ligne en silence**. Donc sur
   un brouillon, la branche est sautée, `new` reste nul, et la suppression est
   avalée.

**Pourquoi c'était manquable, et c'est l'argument qui compte** : il n'y a **aucun
précédent dans ce projet**. Sur les 38 déclencheurs de `schema.sql`, les deux
seuls `before delete` de ligne (`anonymise_actes_admin` 4785,
`fiche_pro_indestructible` 5634) sont **DELETE seuls** et rendent `old`. Aucune
fonction d'Opus ne sert UPDATE et DELETE à la fois. Le motif de
`tient_le_texte()` est juste — **en UPDATE seulement**, et il n'a jamais eu à
être autre chose.

**LA PARADE, ÉPROUVÉE SUR SIX CAS — c'est la forme à écrire :**

```sql
/* 1. LE DELETE, traité À PART — c'est là que le brouillon se trompait.
      ET LE TEST DE CASCADE VIT ICI, PAS AU-DESSUS : voir plus bas, le
      mettre avant ce `if` avale silencieusement un UPDATE. */
if TG_OP = 'DELETE' then
  if not exists (select 1 from public.professional_profiles where id = old.pro_id) then
    return old;                      -- la fiche pro a disparu : le compte entier part
  end if;
  if old.statut <> 'brouillon' then
    raise exception
      'Ce devis est parti chez votre client : il ne peut plus être supprimé. …'
      using errcode = 'OP003';
  end if;
  return old;                        -- un brouillon se supprime
end if;

/* 2. ICI, ET ICI SEULEMENT, on est en UPDATE : la liste blanche a un sens. */
if old.statut <> 'brouillon' then
  new := jsonb_populate_record(new, to_jsonb(old) - 'statut' - 'signe_le' - …);
end if;
return new;
```

> **Ce bloc est le seul SQL de ce document, donc c'est lui qu'on recopiera.**
> Il porte la forme JUSTE. La forme fausse — le test de cascade placé avant le
> `if TG_OP` — est décrite juste en dessous pour qu'on sache pourquoi elle est
> fausse, et elle n'est écrite nulle part en code.

> **ET LA LEÇON DE MÉTHODE, qui est la vraie valeur de cette mesure :**
>
> **un essai de suppression ne guette pas une erreur, il COMPTE LES LIGNES.**
>
> Le cas du brouillon silencieusement annulé ne lève **rien du tout**. Un essai
> écrit en `\set ON_ERROR_STOP off` qui ne regarde que les erreurs l'aurait
> déclaré bon — et c'est précisément la famille de défaut que ce projet traque
> depuis `verifier-montage`. Chaque cas de suppression de
> `supabase/essais-section-devis.sql` fait donc un `select count(*)` AVANT et
> APRÈS, et compare les deux nombres. **Y compris les cas qui doivent réussir.**

**ET LE MÊME DÉFAUT UNE SECONDE FOIS, DANS LA PARADE ELLE-MÊME — mesuré le
12/10.** Dans la forme écrite ci-dessus, la branche de cascade est testée **avant**
`TG_OP`. En DELETE, c'est juste. En UPDATE, `return old` annule silencieusement la
modification. Je l'ai d'abord écrit comme une suspicion — « ça ne peut pas
arriver, mais ça ne se mesure pas » —, puis éprouvé, parce que « ça ne peut pas
arriver » est exactement ce qu'on écrit avant de passer six heures dessus :

| forme | `update` d'un BROUILLON dont la fiche pro a disparu |
|---|---|
| cascade testée **avant** `TG_OP` (ci-dessus) | **le total reste à 100** — modification avalée, aucune erreur |
| témoin, fiche pro présente | 777 — correct |
| cascade testée **DANS** la branche DELETE | **777** — correct |

Donc **le test de cascade va DANS la branche DELETE**, et nulle part ailleurs.
C'est la forme à écrire, et elle est éprouvée sur les six cas :

| | mesuré |
|---|---|
| `update` d'un brouillon, fiche pro présente | 777 — passe |
| `update` d'un brouillon, **fiche pro absente** | **777 — passe aussi** |
| `update` d'un `remis` | 500 inchangé — figé |
| `delete` d'un `remis`, fiche présente | **`OP003`**, message français, **1 ligne reste** |
| `delete` d'un `remis`, fiche absente (cascade de compte) | **0 ligne** — passe |
| `delete` d'un brouillon | 0 ligne — passe |

> **Le défaut s'est présenté DEUX FOIS dans la même fonction, par deux portes
> différentes, et la seconde était dans la correction de la première.** C'est la
> leçon à retenir de cette section, plus encore que le motif : un déclencheur qui
> sert UPDATE et DELETE a deux `return` dont le sens s'inverse, et il faut
> éprouver les deux verbes sur les deux états de la ligne parente. Quatre cas au
> minimum, six ici.

**`using errcode = 'OP003'` — et pas `check_violation`.** Vérifié dans
`schema.sql` : `OP001` (3026) et `OP002` (6450) sont utilisés comme **SQLSTATE**,
pas comme préfixe de message, et `OpusApp.js:1081` les lit par `e.code ===
'OP001'`. Lever `OP003` avec `errcode = 'check_violation'` donnerait 23514, donc
la branche « contrainte check » de `erreurs.js` — donc la piste **FAUSSE**
« le plus souvent, `schema.sql` n'a pas été rejoué » affichée à un artisan qui
vient simplement d'essayer de supprimer un devis parti. Voir §3.14.

**LE VERROU NE PORTE PAS SUR `auth.uid()`, ET C'EST LA SECONDE DÉCISION DE
CETTE SECTION.**

Les trois verrous existants (`tient_les_metiers`, `tient_le_profil_pro`,
`tient_le_texte`) se gardent par `auth.uid() is not null and auth.uid() =
new.<propriétaire>`. Recopier ce motif serait **deux fautes à la fois** :

1. `auth.uid() is null` est une échappatoire pour l'éditeur SQL. Elle est juste
   pour un badge qu'un humain tiers doit valider ; elle est **FAUSSE** pour un
   document parti chez quelqu'un. Rien ne doit pouvoir récrire un devis remis,
   **pas même une migration**, sinon le figeage ne prouve rien ;
2. **`auth.uid()` n'est PAS nul dans une fonction `security definer`** — il rend
   toujours l'appelant. Or `preparer_remise_devis()` en est une, et c'est
   l'artisan qui l'appelle. Le verrou annulerait sa remise **en silence** — c'est
   le piège de la section 25, où un administrateur validant sa propre fiche
   voyait `UPDATE 1` réussir avec trois colonnes restées à `false`.

> **Le verrou regarde donc `old.statut`, `TG_OP`, et la ligne parente. Rien
> d'autre.** La remise passe parce qu'elle part de `'brouillon'` ; tout le reste
> est refusé, pour tout le monde. Pas d'échappatoire à nommer, et pas de
> `pg_trigger_depth()` — qui serait un garde qu'on ne peut pas éprouver,
> puisque les lignes d'un devis remis sont déjà figées et que le recalcul ne s'y
> exécute jamais.

#### `ligne_se_fige()` — le même piège, et un discriminant QUE LE DEVIS NE PEUT PAS LUI PRÊTER

Geler les colonnes du devis sans geler ses lignes laisserait récrire le document
entier **par le dessous** — et le PDF et la base diraient deux choses
différentes, sans la moindre erreur. Ce second déclencheur sert donc UPDATE et
DELETE, et il porte la même branche `TG_OP`.

**Mais le discriminant de cascade du devis lui est INAPPLICABLE**, et c'est un
trou que la relecture a trouvé : il teste `professional_profiles where id =
old.pro_id`, et **une ligne de devis n'a pas de `pro_id`** — elle n'a qu'un
`devis_id`. Sans discriminant, l'enchaînement est celui que le §7 redoute :
supprimer son compte cascade vers les devis, puis vers leurs lignes ; un verrou
qui refuse, et **un artisan ayant remis un devis ne peut plus supprimer son
compte**. Un trou RGPD sur le seul chemin honnête de sortie, exactement comme la
conception C1 éliminée au §0.

**Ce qu'il fallait mesurer, et qui n'était ni écrit ni évident** : pendant une
cascade, la ligne du DEVIS existe-t-elle encore quand le déclencheur de sa ligne
s'exécute ? Mesuré le 12/10 sur PostgreSQL 16.13, par une sonde `raise notice` :

| ce qu'on supprime | le devis parent existe-t-il, vu depuis la ligne ? |
|---|---|
| le **devis** (cascade vers ses lignes) | **non** |
| le **compte** (cascade pro → devis → lignes) | **non** |
| **une ligne seule** d'un devis remis | **oui**, et son `statut` est lisible — `remis` |

**Les trois cas se séparent donc parfaitement, et le discriminant est le
statut du parent LU, pas une existence devinée :**

```sql
select statut from public.devis where id = old.devis_id into v_statut;
if v_statut is null then
  return case TG_OP when 'DELETE' then old else new end;   -- cascade : on laisse
end if;
if TG_OP = 'DELETE' then
  if v_statut <> 'brouillon' then
    raise exception '…' using errcode = 'OP003';
  end if;
  return old;
end if;
if v_statut <> 'brouillon' then
  new := jsonb_populate_record(new, to_jsonb(old));         -- tout figé
end if;
return new;
```

Éprouvé sur **six cas**, comme son grand frère :

| | mesuré |
|---|---|
| `update` du prix d'une ligne de brouillon | 777 — passe |
| `update` du prix d'une ligne d'un `remis` | 500 inchangé — figé |
| `delete` d'une ligne seule d'un brouillon | passe |
| `delete` d'une ligne seule d'un `remis` | **`OP003`**, **1 ligne reste** |
| `delete` du devis `remis` entier | ses lignes **partent** |
| `delete` du **compte** | 0 ligne, 0 devis — **tout part** |

> **Et la raison pour laquelle on LIT le statut au lieu de tester une
> existence** : les deux questions se posent dans le même `select`. Un
> `not exists` suivi d'un second `select statut` serait deux allers-retours
> pour une seule vérité — et surtout deux endroits où se tromper. Le `null`
> du statut **est** le signal de cascade, et il n'y a rien à tenir
> ensemble.

**Pourquoi un déclencheur et pas une politique découpée en quatre :** « une
politique rend 0 ligne modifiée sans un mot, un **déclencheur DIT pourquoi** »
(mesuré en section 31 : 400, code 23514, message français complet). Et refaire la
politique en quatre demanderait un `drop policy`, que le connecteur refuse.

**Pour corriger un devis déjà remis, on en émet un NOUVEAU** : `remplace_id` +
`version`, l'ancien restant lisible avec sa pastille « Remplacé par le
n° … ». C'est ce qui permet de répondre à « mais vous m'aviez dit 4 000 € ».
Comme le devis n'a aucune contrainte de continuité, ça ne coûte rien.

> **Honnêtement : c'est une bonne conception, pas une obligation légale.** Aucun
> texte ne l'impose, et le déduire des art. 1116 et 1118 serait une
> surinterprétation. Je le dis parce que c'est le genre de phrase qu'on recopie
> ensuite dans un commentaire de `schema.sql` comme si c'était du droit.

Et l'écran le dit en toutes lettres, parce qu'un bouton qui disparaît sans
explication fait croire l'application cassée : « Ce devis est parti chez votre
client. Pour le changer, on en fait un nouveau — l'ancien reste, pour que vous
puissiez montrer ce qui a été proposé. »

### 3.4 Ce qui est COPIÉ sur le devis, et non lu par jointure

**La règle, en une phrase :**

> **Avant la remise, la vérité est dans le carnet et sur la fiche. Après, elle
> est dans le devis. AUCUNE JOINTURE DANS LE GABARIT.**

Quatre choses bougent sous un devis déjà parti, et aucune ne lève d'erreur :

1. le client est renommé, archivé ou supprimé ;
2. l'émetteur change d'adresse, d'assureur, ou passe de la franchise au réel ;
3. les textes légaux changent — les articles du CGI qui portent la TVA sont en
   cours d'abrogation ;
4. le catalogue d'ouvrages changera ses taux par défaut.

> Et le quatrième point n'est pas théorique : l'arrêté du 13 juillet 2026
> apprécie le fluide frigorigène **à la date de signature du devis**. **La date
> de signature décide du droit applicable** — donc un devis signé ne doit
> **JAMAIS** voir son taux recalculé par une mise à jour du catalogue.

**En COLONNES NOMMÉES, et non en `jsonb`.** **Dans un `jsonb`, une clé
manquante ne lève RIEN** — le gabarit imprime un trou et personne ne le sait. En
colonnes, chaque mention devient contraignable (`devis_remis_complet_check`),
interrogeable en SQL (« combien de devis remis n'ont pas de médiateur ? »), et
porteuse d'un message d'erreur en français.

Le nombre de colonnes n'est pas un goût : **c'est le nombre de mentions que la
loi exige**. Il faut le dire au propriétaire comme ça, et ne pas le lui
présenter comme de la complexité inventée.

**Ce qui est copié de l'ÉMETTEUR**, et la liste est désormais complète
(les quatre dernières lignes sont la correction du §2.0) : dénomination, forme
juridique, capital, adresse, code postal, ville, SIRET, registre, TVA intra,
téléphone, e-mail, assureur + n° de contrat + couverture géographique, médiateur
+ son site, taux horaire, décompte du temps, chemin du logo, régime de TVA,
`modele` et `modele_version`, — **plus `garanties_texte`, `sav_texte`, les deux
champs de frais de déplacement, `cgv_texte`, `clause_droit_applicable` et
`clause_juridiction`.**

**Ce qui est copié du DESTINATAIRE** : nom, type, adresse, code postal, ville,
SIRET.

**Et le TEXTE de chaque mention tel qu'il a été imprimé**, avec sa version.

**Ce qui N'est PAS copié, et pourquoi :**

- **les lignes** — elles sont figées par leur propre déclencheur, les recopier
  serait une troisième écriture ;
- **les totaux** — déjà des colonnes figées ;
- **le délai d'exécution, l'objet, le lieu d'exécution, la validité** — ils sont
  **tapés sur le devis**, donc déjà figés par `devis_se_fige()`. La règle
  générale : **l'instantané copie ce qui vient d'AILLEURS, jamais ce qui est
  tapé ici.** Un `em_delai_execution` serait une seconde écriture du même fait ;
- **la date de rédaction** — c'est `remis_le`, posé par la base (§2.0).

**Une convention de nommage, et elle rend le « aucune jointure » MESURABLE :**
tout champ d'instantané porte le préfixe `em_` (émetteur) ou `cl_` (client).
`verifier-devis` peut alors exiger une **propriété** et non une syntaxe : le
gabarit `devis-html.js` ne lit **que** des champs du devis, de ses lignes et de
sa ventilation — toute lecture d'un objet nommé `emetteur` ou `client` dans ce
fichier est refusée. C'est un contrôle de propriété, pas de place : il
continuera de garder quand le gabarit sera réécrit.

**Ce qui reste par JOINTURE, assumé :** le lien vers la fiche client, pour
ouvrir son carnet depuis le devis. C'est de la navigation, pas de l'impression —
et s'il casse, le document reste entier.

> **C'est ce qui autorise `on delete set null` sur `client_id`**, plutôt que le
> `on delete restrict` que le commentaire de la section 41.2 avait pré-engagé —
> **pour la FACTURE**, et seule la facture a l'obligation de conserver dix ans
> l'identité de son destinataire. `restrict` opposerait un brouillon au droit à
> l'effacement ; `cascade` détruirait des devis en silence ; `set null` plus le
> nom figé garde tout ce qui compte. C'est le motif `auteur_supprime` des avis,
> appliqué dans l'autre sens.

**Et les mentions vivent dans un FICHIER, pas dans une table** :
`src/data/mentions-devis.js`, daté et versionné, à côté de `legal.js` qui porte
déjà les CGU de la même façon. Quatre raisons, et la dernière est décisive : ces
textes sont du contenu de produit ; un fichier se relit en revue de code, une
ligne de table se modifie en silence ; le gabarit doit les composer sans rien
importer ; et **une table de mentions serait VIDE sur une base neuve**, donc le
premier devis sortirait sans mention et `schema.sql` rejoué deux fois ne dirait
rien — le piège du bloc `do` de la section 37, « l'erreur vivait dans un chemin
que rien n'empruntait ».

**Aucune référence d'article écrite en dur dans un gabarit.** Sinon les cinq
habillages devront être repris un par un avant 2028, et celui qu'on oubliera
imprimera une référence abrogée sans que rien ne le signale.

### 3.5 Qui tient les totaux — la base, en CENTIMES ENTIERS, et la TVA dans sa propre table

**Tout l'argent est en centimes entiers (`bigint`).** C'est une rupture assumée
avec `annonces_pro.prix numeric(10,2)`, et elle doit être **commentée dans
`schema.sql`** pour que personne ne « réharmonise » un jour :

| | mesuré |
|---|---|
| `numeric` rendu par PostgREST | `0.10` arrive `0.1` en JavaScript, `20.00` arrive `20` |
| `0.1 * 3` en JavaScript | `0.30000000000000004` |
| `numeric(10,2)` | **déborde à 100 000 000** sur un code **22003**, qui n'est PAS une contrainte `_check` et sort en anglais brut |
| `(base * taux + 500) / 1000` en entiers, SQL **et** JavaScript — **CORRIGÉ AU LOT 1, le 23/10 : la TVA se calcule `(base * taux + 5000) / 10000`, le taux en CENTIÈMES de point** (2000, 1000, 550), décidé le 17/10 (10.3) parce que les millièmes ne savent pas écrire 1,05 %. C'est `devis_tva_de()`, section 49.1. **Attention, la forme `+ 500) / 1000` existe toujours, mais pour autre chose** : le total d'une LIGNE, quantité en millièmes × prix en centimes (`devis_total_ligne()`). Ne pas recopier l'une pour l'autre (10.16) | **les mêmes sept résultats**, demi-centime exact compris (5 centimes à 10 % → 1) — mesurés pour l'ancienne forme. La nouvelle coïncide avec elle sur tous les taux que l'ancienne sait écrire, et le lot 1 joue ses 44 cas d'argent en JavaScript ET en PostgreSQL : **0 écart** |

`annonces_pro.prix` est un nombre unique qu'on affiche ; un devis additionne
N lignes et satisfait un invariant. Ce ne sont pas la même chose.

**`libellePrix()` de `formats.js` NE PEUT PAS SERVIR**, et c'est le piège le plus
facile à commettre parce que la fonction existe et a l'air de servir. Mesuré en
l'appelant : `20 → « 20 € »`, `1234 → « 1234 € »`, aucun séparateur de milliers.
Juste pour une annonce, **faux** pour un document qui engage — un devis écrit
toujours ses centimes. D'où `montantDevis()`, à côté, dans un fichier qui
n'importe rien.

**Le total est RECALCULÉ par la base, jamais incrémenté.** Le projet a trois
familles de compteur : incrément symétrique (`likes_count`), incrément seul
(`vues_count`, qui ne redescend jamais), **recalcul complet**
(`recalcule_chantier`). Un total de devis est le troisième cas **en plus fort** :
une ligne se modifie, se supprime, change de quantité. Un total par incrément
dériverait en silence, et un total faux sur un devis est un document faux envoyé
à un client. Et le rattrapage recalcule **sans `greatest`**, contrairement aux
vues : il n'y a aucune raison de protéger un total trop haut, il y a tout
intérêt à ce qu'il redescende à la vérité.

**ET LA TVA VIT DANS SA PROPRE TABLE, `devis_tva (devis_id, taux)`**, et elle
règle un défaut mesuré :

| | mesuré |
|---|---|
| trois lignes à 33,33 € HT à 10 %, TVA **ligne par ligne** | **9,99 €** |
| les mêmes, TVA arrondie **une fois sur la somme des bases** | **10,00 €** |

Avec l'invariant `total_ttc = total_ht + total_tva` posé en contrainte, **ce
centime d'écart REFUSE l'enregistrement**.

> **La ligne ne porte AUCUNE TVA : elle porte son taux. La TVA n'existe que dans
> `devis_tva`, et l'arrondi y est écrit UNE SEULE FOIS, dans une contrainte
> nommée.** Un arrondi par ligne devient **inreprésentable**, pas déconseillé.
> C'est la différence entre une règle qu'un contrôle doit traquer et une
> garantie que la structure porte.
>
> `devis_tva` n'a **aucune politique d'ÉCRITURE**, pas même pour soi — le motif
> de `journal_admin` et `journal_ia`. Seule la fonction `security definer`,
> révoquée à tout le monde, y écrit. **Un total n'est pas une donnée qu'on
> saisit, c'est une donnée qu'on constate.**
>
> **MAIS ELLE A UNE POLITIQUE DE LECTURE, et l'oublier serait un trou RGPD.**
> `mes_donnees()` est `security invoker` (vérifié, schema.sql:7716) : sans
> politique `for select` sur `devis_tva` — jointure vers `devis` et
> `est_mon_entreprise(pro_id)` —, l'export de l'article 15 **rendrait une liste
> vide, sans la moindre erreur**. Un export incomplet ressemble trait pour trait
> à un export fait : c'est le défaut du lot H, et il se reproduirait ici par une
> politique manquante au lieu d'une fonction oubliée. Voir §3.13.

Et c'est la seule forme qui satisfait la règle d'ensemble du module facture :
**rien de ce qui est imprimé ne doit exister uniquement dans le PDF.** La
ventilation par taux est ce que la facture électronique exigera le plus sûrement
(EN 16931, contrôles BR-CO-10 et BR-CO-15) ; si elle ne vit que dans le PDF, la
facture sera impossible à engendrer sans ressaisie.

**Deux conséquences de maquette, et elles décident du lot 5 :**

> **Le pied d'un devis n'est pas trois nombres, c'est un TABLEAU** — une ligne
> par taux présent (base HT, TVA), puis HT, TVA, TTC. Un habillage « épuré » sans
> colonne de taux **ne peut pas exister** : la chaudière à 20 % et sa pose à
> 10 % sur le même document est le cas courant du chauffagiste.

**Et le prix unitaire est au CENTIME**, pas à trois ou quatre décimales : **un
devis AFFICHE son prix unitaire, et le client doit pouvoir recalculer sa
ligne.** C'est l'objet même du décompte détaillé — la mention que la DGCCRF
contrôle le plus. Avec quatre décimales internes, 12,3456 € × 100 affiché
« 12,35 € » et « 1 234,56 € » laisse un écart que personne ne peut expliquer.
Pour un besoin plus fin : la quantité (en millièmes), ou un forfait.

### 3.6 Comment le document est produit et remis

**La chaîne, et les deux seules dépendances à ajouter :**

```
instantané gelé + lignes + ventilation
  → src/lib/devis-html.js (qui n'importe RIEN) → une chaîne HTML
  → src/lib/devis-pdf.js  (le SEUL fichier du module qui importe expo-print)
  → expo-print.printToFileAsync({ html }) → un PDF dans le cache, nom UUID
  → comptage des pages et des octets, renommage « Devis-DEV-2026-0001.pdf »
  → téléversement dans l'espace PRIVÉ `devis`
  → confirmer_remise_devis()
  → expo-sharing.shareAsync() → la feuille de partage d'iOS
```

`npx expo install expo-print expo-sharing`, puis `npx expo install --check`
(les versions Expo se désalignent toutes seules). **Deux paquets, pas quatre** :
`expo-file-system ~57.0.7` est déjà là et sait renommer et téléverser ;
`expo-asset` est dans `node_modules` mais **pas dans `package.json`**, donc
`verifier-imports` le refuserait — et il ne sert à rien, le logo vient du
stockage.

**Vérifié avant de proposer**, comme ce document l'exige : `expo-print@~57.0.2`
(publié le 11/09/2026) et `expo-sharing@~57.0.22` (24/09/2026) portent tous deux
le badge « Included in Expo Go » sur la page du SDK 57 et sont épinglés dans
`bundledNativeModules.json`. `expo-print` n'a **aucun config plugin** et son
`AndroidManifest.xml` est vide : rien ne peut casser Expo Go, aucune permission
ne sera demandée. **Donc essayable par le propriétaire sans development build**,
qui est la ligne rouge du projet.

#### UNE BRANCHE WEB QUI NE MENT PAS — et ce n'est pas du confort

Lu dans la tarball publiée d'`expo-print@57.0.2`, fichier
`package/src/ExponentPrint.web.ts`, lignes 13-14, **l'implémentation web
ENTIÈRE** :

```ts
async printToFileAsync(): Promise<void> { window.print(); }
```

Deux conséquences, et la seconde est celle qui coûte :

1. elle rend **`undefined`** — lire `.uri` dessus lève « Cannot read property
   'uri' of undefined » ;
2. **elle OUVRE la boîte de dialogue d'impression du navigateur**, qui est
   modale. Donc elle **bloque Playwright** — c'est-à-dire le seul outil par
   lequel ce projet prouve qu'une application démarre (le `noop` du 05/10 n'a été
   trouvé que par là), et le seul par lequel il a jamais éprouvé une écriture sur
   la vraie base.

> **Donc `devis-pdf.js` commence par `Platform.OS === 'web'`**, et dans cette
> branche il **n'appelle rien** : il rend un état `{ indisponible: true }` et
> l'écran affiche « Le PDF se fabrique sur le téléphone. » Ce n'est pas un
> contournement d'essai, c'est la vérité : le document se fait sur l'appareil de
> l'artisan.
>
> Et `verifier-devis` refuse tout appel à `printToFileAsync` qui ne soit pas
> **sous** ce test de plateforme — une propriété, pas une place.

**`expo-sharing` ne marche pas davantage ici, et le brouillon se trompait sur la
raison.** Il écrivait « Web Share API, HTTPS exigé, le conteneur sert en
`http://localhost` ». **La conclusion est juste, le mécanisme est faux**, et
c'est mesuré dans le Chromium du projet sur `http://localhost:8099` :

```
{"origin":"http://localhost:8099","secureContext":true,"share":"undefined"}
```

> **`http://localhost` EST un contexte sécurisé.** HTTPS n'est pas ce qui
> bloque. Ce qui bloque, c'est que le Chromium sans tête **n'expose aucun
> `navigator.share`** — et la source publiée (`SharingNativeModule.web.ts`
> @57.0.22) rend précisément `!!navigator.share`.
>
> **L'écart compte en pratique** : qui croit « c'est juste HTTPS » servira le
> serveur de développement en HTTPS, n'obtiendra toujours rien, et cherchera la
> faute ailleurs pendant une heure.
>
> Et il y a un bénéfice à le savoir : `isAvailableAsync()` rend donc **`false`**
> ici, le bouton de partage **ne s'affiche pas**, et c'est exactement le
> comportement voulu. Le garde « un bouton qui ne fait rien est pire que pas de
> bouton » se trouve donc **éprouvé par le navigateur**, sans rien faire.

**Écartés, et avec le bon argument pour chacun :**

- **un PDF composé côté serveur.** L'argument qui porte est structurel : **un
  runtime Deno n'embarque aucun moteur de rendu.** Un PDF serveur devrait donc
  être écrit en plaçant chaque trait en coordonnées, et **les cinq designs
  deviendraient cinq PROGRAMMES de mise en page** au lieu de cinq feuilles de
  style, pagination à écrire soi-même comprise. *(Le brouillon ajoutait « 2 s de
  temps CPU et 256 Mo » sous un titre « pour des raisons mesurées » : c'est un
  chiffre de documentation, pas une mesure, et l'argument n'en a pas besoin. Il
  est retiré.)* ;
- **`react-native-html-to-pdf`** : dernière publication le 04/09/2025, absent de
  `bundledNativeModules.json` — module natif hors Expo Go, donc development
  build, donc inessayable ;
- **`react-native-webview`** : épinglé 13.16.1 quand npm est à 14.0.1, et il
  servirait à dessiner le document DEUX fois ;
- **un aperçu « feuille A4 » en composants React Native.** Deux écritures du même
  document, le risque que CLAUDE.md borne pour `filtre-fil.js` et n'assume que
  faute de base en mode démonstration. Ici rien ne l'impose, et il n'existe de
  toute façon **aucun autre moteur** que `expo-print`.
  *(Le brouillon ajoutait « une page A4 sur 390 points de large ne se lit pas au
  doigt ». **Ce n'est pas mesuré**, et c'était l'argument qui décidait que
  l'artisan ne voit jamais son document sur un appareil éprouvable — donc
  exactement le genre d'affirmation qui ne doit pas porter une élimination. Il
  est retiré comme argument. **Et il entre dans ce qui est à mesurer** si la
  question revient : le projet relève des boîtes réelles à 390 depuis le lot 5,
  donc un aperçu se mesurerait ici comme tout le reste.)*

> **L'écran d'Opus montre un FORMULAIRE et un TOTAL. L'aperçu, c'est le
> visualiseur du téléphone** — le chemin déjà emprunté par les pièces jointes.

**Deux détails mesurés qui ne se devinent pas :**

1. **le PDF naît dans le CACHE, sous un nom UUID** :
   `cachesDirectory + "/Print/" + UUID().uuidString + ".pdf"`, lu dans le code
   publié. Donc iOS le purge quand il veut, et le client recevrait une pièce
   nommée `A1B2C3D4-….pdf`, illisible dans une boîte mail. Il faut **copier et
   renommer** — et le calcul d'extension passe par `src/lib/types-fichiers.js`,
   jamais par un `split('.')` (la leçon du 04/10) ;
2. **la bande de chantier en `repeating-linear-gradient` devient une IMAGE dans
   le PDF** : 2 objets `/Image` mesurés pour un gabarit sans balise `<img>`. Ce
   n'est pas une erreur, mais WebKit peut la rastériser plus grossièrement que
   Chromium.

**AUCUNE IMAGE NI POLICE CHARGÉE PAR RÉSEAU**, et c'est chiffré :

| | mesuré |
|---|---|
| un PDF de devis de 60 lignes rendu par Chromium | **26 788 octets**, 2 pages, 2 polices Type0, texte extractible |
| Inter_400Regular en base64 | **456 544 octets** |
| les trois graisses minimales d'Inter | **1 031 528 octets** |
| Oswald_600SemiBold seul | **116 808 octets** |

Embarquer Inter ferait passer un devis de 27 Ko à plus d'un mégaoctet. Et un
`@font-face` vers Google Fonts exige le réseau **au moment du rendu** : un
artisan dans un sous-sol sortirait un PDF en Times New Roman sans que rien ne le
signale — même famille que « les tuiles ne partent pas depuis le conteneur ».
Donc **pile de polices système** pour les lots 0 à 4, et Oswald en base64 pour
les seuls TITRES comme arbitrage chiffré du lot 5. Le **logo** est embarqué en
base64 : une URL signée serait morte à la réimpression, et une URL publique peut
rendre le PDF tronqué.

**Un PDF de 0 page est un fichier VALIDE.** `printToFileAsync` peut rendre un
fichier vide ou tronqué si le HTML n'a pas fini de charger. **On compte les
pages et les octets avant de téléverser, et on refuse en le disant** — comme le
ménage de compte qui DIT maintenant qu'il s'est arrêté. Et le poids vient de
l'ENVOI, jamais d'un calcul d'avance : la leçon des 5 883 258 octets annoncés
pour un fichier de 1 293 484.

**Comment le client le reçoit — et il n'a PAS de compte.** Mesuré : **1 client
sur 1** dans la base n'a aucune identité Opus, donc `auth.uid()` n'existe pas
pour lui et **aucune règle RLS ne peut lui ouvrir la lecture**. Toute conception
qui suppose « le client ouvre Opus et voit son devis » est fausse pour 100 % des
clients du carnet. Deux chemins, et aucun n'est un écran d'Opus :

- **la feuille de partage** (`shareAsync`) — il reçoit un vrai fichier, nommé.
  C'est le chemin principal, et `isAvailableAsync()` est appelée avant d'afficher
  le bouton ;
- **une adresse signée** pour un envoi par message, d'une durée de
  `validite_jusqu_au + 30 jours`. Une heure serait absurde pour un document
  qu'on relit le lendemain : **la durée se déduit du document, pas d'une
  habitude.**

**ET LE DEVIS PART EN DEUX PIÈCES.** Aucune des trois conceptions ne l'avait vu :
l'art. L. 243-2 dit « **joignent** à leurs devis une attestation ». Un devis de
bâtiment, c'est `Devis-DEV-2026-0001.pdf` **plus** l'attestation décennale. Le
routage entre la pièce jointe (constructeurs) et la mention imprimée (catégorie
`conseil`) **existe déjà** dans `src/data/pieces-justificatives.js` et se
réutilise tel quel.

**Un espace de stockage PRIVÉ `devis`**, avec `allowed_mime_types =
{application/pdf}` — ce qu'aucun des cinq espaces actuels ne fait
(`allowed_mime_types` vaut `null` partout). Chemin `<pro_id>/<devis_id>.pdf` :
deux niveaux, dans la limite de 3 de la fonction Edge. Aucune politique `update`
ni `delete` — même raison qu'une pièce jointe qui ne se retire pas, plus une
seconde : réémettre par-dessus laisserait l'acceptation pointer un fichier qui
n'est plus celui qu'on a signé.

**Le logo va dans un espace PUBLIC `logos`**, et `avatar_url` n'est **pas**
réutilisé : un avatar est rond et c'est un portrait, un logo est rectangulaire et
c'est une marque. La réutilisation est tentante et donnerait un logo tronqué.

### 3.7 Comment le §19 est tenu sans que la visite devienne obligatoire

Le §19 du cahier Visite exige une **forme**, pas une colonne :

> « Construire le devis de façon à accepter une source manuelle **ou** une visite
> validée sans rendre la visite obligatoire. » Et le §2 : « ne jamais concevoir
> le QR comme une condition d'accès au devis. » Et le critère du §21 : « Un pro
> peut créer **ET ENVOYER** un devis sans QR ni visite. »

**Ce qu'on pose : une colonne `source` avec DEUX valeurs réellement produites.**

`devis.source text not null default 'manuelle'`, contrainte
`devis_source_check check (source in ('manuelle','demande'))`. Les deux ont un
écrivain dès le premier jour : `'manuelle'` quand il touche « Nouveau devis »,
`'demande'` quand il touche « Faire le devis » sur une demande acceptée — et
`demande_id` est une **vraie clé étrangère** vers `quote_requests`, nullable,
`on delete set null`.

**Et il y a un LECTEUR dès le premier jour** : la liste des devis affiche
l'origine (« depuis une demande du 15/09 »), et l'en-tête du devis à l'écran
aussi. Le PDF, lui, ne l'imprime pas : un client n'a rien à savoir du mécanisme
interne qui a produit son devis. **La colonne sert à retrouver, pas à imprimer.**

**`'visite'` n'est PAS dans la contrainte, et c'est l'arbitrage le plus
discutable de ce plan, donc je le défends.** Deux lectures s'opposaient : la
refaire plus tard serait le piège `montage` ; ou bien une valeur que rien ne
produit est ce que la section 27.4 a retiré avant de livrer. **Je retiens la
seconde.** Le piège `montage` n'était pas « il faut prévoir les valeurs
futures », c'était « l'application a envoyé une valeur absente de la
contrainte » — et avec deux valeurs, aucune valeur envoyée n'est absente.
Refaire une contrainte est un geste CONNU, documenté, et accepté par le
connecteur Supabase (mesuré le 03/10 : `alter table … drop constraint if exists`
passe, seuls les ordres qui **commencent** par `drop` sont refusés).

**Et pas de `visite_id` non plus.** Ce serait le « bouton §18 » : un lien qui ne
sert que le jour où la Visite existera, qui peut pointer n'importe où en
attendant, et que personne ne pourra vérifier avant qu'il soit trop tard. La
doctrine du carnet le dit déjà pour `compte_id` : « elle ne servirait que ce
jour-là ».

**Ce que les LIGNES paient dès maintenant, et c'est la seule chose :** chaque
ligne porte son propre `uuid` et son `ordre`, donc elle est **visable de
l'extérieur**. C'est exactement ce que le `QuoteSourceLink` du §13 réclamera — un
lien entre une ligne de devis et un ou plusieurs *findings*. Ça ne coûte rien :
une table a une clé primaire de toute façon. Et c'est aussi pourquoi
`devis_lignes` est une TABLE et non une colonne `lignes jsonb` : le §5 les nomme
séparément, et un `jsonb` ne se vise pas.

**ET LA GARANTIE EST TESTABLE AUJOURD'HUI, PAS PROMISE :**

> `verifier-devis` interroge le schéma et **refuse qu'il existe, sur `devis` ou
> `devis_lignes`, une colonne `not null` qui référence autre chose que `pro_id`
> et `client_id`.** C'est une **propriété**, pas une syntaxe ni une place : elle
> continuera de garder le jour où la Visite arrivera, et elle refusera le
> `visite_id not null` que quelqu'un poserait par réflexe. Un contrôle qui aurait
> cherché l'absence du mot « visite » aurait accusé du code juste, ou passé au
> vert sans rien éprouver — les deux défauts recensés dix fois dans ce projet.

**Il n'existe, dans tout le module, aucun écran où l'on scanne quelque chose pour
arriver à un devis, et aucune étape obligatoire autre que « un client, un objet,
une ligne ».** Le QR ne conditionne rien parce qu'il n'existe pas. Et la
résilience du §21 (« une panne IA n'empêche pas la création manuelle ») est
acquise d'office : **aucune action IA n'entre dans ce module** (voir §6).

**Un point de vigilance à écrire maintenant :** faire signer un devis sur un
téléphone pendant une visite rend le contrat **hors établissement**. La Visite ne
se construit pas, mais elle **multipliera le cas le plus exigeant du module**.
Le lot 2 doit donc être juste **avant** qu'elle existe.

### 3.8 Et deux corrections mesurées, contre ce que les conceptions promettaient

**« Faire le devis » ne pré-remplira PAS le client.** Mesuré sur la vraie base,
des 4 demandes acceptées :

| | |
|---|---|
| portent une **description** | **4 sur 4** |
| portent un **nom** | **1 sur 4** |
| portent un **téléphone** | 1 sur 4 |
| portent une **ville** | 1 sur 4 |

La cause est lisible dans `schema.sql` : `nom` et `telephone` ont été ajoutés par
`alter table add column` (lignes 496-497), donc les demandes antérieures les ont
à `null`. **Ce que le bouton pré-remplit à coup sûr, c'est la DESCRIPTION** — qui
devient l'objet des travaux, une mention obligatoire, et c'est déjà beaucoup. Le
chemin normal reste le sélecteur de clients avec « + Nouveau client » qui ne
demande **qu'un nom** (le seul champ obligatoire de `validerClient`).

**Et `quote_requests.budget` est du TEXTE**, pas un montant (« environ 3000 € »).
Il se recopie comme CONTEXTE, et **il n'entre jamais dans un calcul**.

### 3.9 Trois petites décisions qui ne sont pas des détails

**1. La pastille de statut passe par `surFond()`.** Sa couleur vient des
**données** (le statut du devis), donc l'encre posée dessus ne peut pas être
écrite à la main : c'est la règle du 02/10, et `verifier-cibles` la réclame — il
teste l'existence de `surFond()` et refuse un `'#fff'` écrit dans le même objet
de style qu'un remplissage orange. Le brouillon n'en parlait pas du tout
(0 occurrence). Une étiquette « Remis » lisible et une étiquette « Expiré »
illisible sur la même liste, c'est un hasard, pas une règle.

**2. UNE SEULE orthographe de statut, et c'est `accepte` / `refuse`.** Vérifié
dans `src/lib/api.js:1824-1831` : `GENRES_DEMANDE` fait porter à `sos` des
`acceptee` / `refusee` **accordés**, quand `quote_requests` et
`callback_requests` portent `accepte` / `refuse`. Le commentaire du fichier dit
pourquoi — des lignes existent déjà, la contrainte `check` de la table les
impose, et on traduit « ici, une fois pour toutes ».

> **Deux orthographes pour une seule notion finissent toujours par se
> contredire.** Le devis est une table NEUVE : il n'y a aucune ligne à
> préserver, donc aucune raison d'hésiter. On prend la forme majoritaire
> (`accepte`, `refuse`), et `verifier-devis` **refuse `acceptee` et `refusee`**
> partout dans le module — contrainte, API, écrans, essais. Le jour où quelqu'un
> accordera un participe par réflexe de français, le contrôle rougira avant la
> base.

**3. `signe_le` est tapé par l'artisan, et tout l'affichage des délais repose sur
lui.** Le brouillon ne l'encadrait pas, alors que le dossier note qu'un devis
antidaté prive le client de son droit. La base connaît deux bornes, et **elle
doit les tenir** :

- `remis_le::date <= signe_le` — les deux sont des colonnes de la même ligne,
  donc ça peut être une **contrainte `check` nommée** ;
- `signe_le <= current_date` — **et là il y a un piège à éprouver avant
  d'écrire** : PostgreSQL exige que les fonctions d'une contrainte `check` soient
  `IMMUTABLE`, et `current_date` ne l'est pas. **Je ne l'ai PAS mesuré ici.** Si
  la contrainte est refusée, cette moitié va dans le déclencheur — qui doit de
  toute façon laisser passer `signe_le` dans sa liste blanche, donc il est déjà
  sur le chemin. À mesurer au lot 4, sur un PostgreSQL 16, **avant** d'écrire la
  contrainte.

Et ce que ces bornes ne font PAS, pour que personne ne le croie : elles ne
prouvent pas que la signature a eu lieu ce jour-là. Elles interdisent les deux
seules choses impossibles — avant que le document existe, et dans le futur. Le
reste n'est pas vérifiable par un programme, et l'écran ne doit pas prétendre le
contraire.

### 3.10 LE CONTRÔLE DE COMPLÉTUDE LÉGALE — et pourquoi celui du brouillon ne gardait rien

**C'est le trou de méthode le plus grave que la relecture a trouvé.**

Le filet du brouillon était : « `verifier-devis` exige que **CHAQUE bloc
obligatoire** est présent dans le texte extrait, **comparé à une liste** ». La
liste et le gabarit sortiraient de la même main, dans le même lot : **une mention
absente des deux est VERTE.**

> **Et ce n'est pas une hypothèse : le brouillon en fournit la preuve.** Son
> énumération des blocs du gabarit manquait les garanties, les frais de
> déplacement, le délai d'exécution et la date de rédaction (§2.0). Le contrôle,
> tel qu'il était spécifié, aurait donc laissé passer un devis **sans la seule
> mention de prix présente dans les trois listes de l'arrêté**.
>
> C'est mot pour mot le défaut de `verifier-legal` du 11/10, et la citation est
> dans le fichier (`scripts/verifier-legal.mjs`, lignes 158-164) : « un contrôle
> satisfait par sa propre documentation ne garde rien… seul un humain sait si
> l'acte existe, et ce drapeau est l'endroit où il le dit ».

**La parade a trois pièces, et il faut les trois.**

**(a) `MENTIONS_OBLIGATOIRES` s'écrit depuis le DOSSIER JURIDIQUE, pas depuis le
gabarit.** Une entrée par mention **distincte**, et chaque entrée porte :

| champ | ce qu'il contient | pourquoi |
|---|---|---|
| `cle` | `frais_deplacement` | pour que le contrôle la nomme dans son refus |
| `source` | « arrêté du 24/01/2017 » | le texte, pas une paraphrase |
| `citation` | les mots du texte, **verbatim** | c'est ce qui rend l'entrée vérifiable par un humain sans ouvrir Légifrance. Citer la loi n'est pas rédiger une clause |
| `cas` | `['art2','art4I','art4II']` | une LISTE : c'est ainsi que « la seule mention de prix présente dans les TROIS listes » devient une donnée et non une anecdote |
| `colonne` | `emetteur.frais_deplacement_centimes` | le lien vers le §2.0 ; une entrée sans colonne est refusée par le contrôle |
| `bloque` | `true` / `false` | si son absence refuse la remise |

**Et l'ordre d'écriture est imposé** : on écrit `MENTIONS_OBLIGATOIRES`
**d'abord**, depuis le dossier, **puis** le gabarit depuis la liste. Pas
l'inverse. C'est une discipline, donc elle ne suffit pas — d'où (b) et (c).

**(b) Un COMPTE écrit dans le contrôle lui-même.**

```js
/* Chiffre ÉCRIT, pas calculé. Retirer une entrée de la liste doit faire
   ROUGIR ce contrôle — sinon la liste se vide et tout reste vert. */
const MENTIONS_ATTENDUES = 30;   // à fixer en écrivant le fichier
```

Le contrôle vérifie alors, dans l'ordre : le compte ; que chaque entrée porte une
`citation` et une `source` non vides ; que chaque `colonne` nommée **existe
vraiment** dans le schéma ; et que l'`empreinte` de chaque entrée est présente
dans le **texte extrait** de chaque modèle × chacun des deux gabarits.

> Le nombre exact se fixe en écrivant `mentions-devis.js` et **se déplace
> seulement dans un commit qui dit pourquoi**. Le §2.0 et le §2.1 donnent le
> point de départ : les dix de l'art. 4-I, les six de L. 111-1, les six de
> R. 111-2, les cinq de la forme hors établissement, celle de l'art. 4-III,
> l'attestation jointe, et trois conditionnelles de TVA. **Les doublons entre
> listes sont UNE entrée avec plusieurs `cas`**, pas trois entrées : sinon
> l'adresse de l'entreprise compte trois fois et le compte ne veut plus rien
> dire.

**(c) Un drapeau HUMAIN, sur le modèle exact d'`EDITEUR.contratSousTraitance`.**

```js
export const MENTIONS_RELUES_PAR = null;   // qui a relu la liste contre le dossier
export const MENTIONS_RELUES_LE  = null;   // 'AAAA-MM-JJ'
```

`verifier-legal` les **réclame avant que `STATUT` quitte `'essai'`**, dans le
même bloc `if (STATUT !== 'essai')` qui réclame déjà le contrat de
sous-traitance, et avec le même raisonnement, qui est le seul qui tienne :
**aucun programme ne peut savoir si une liste de mentions légales est
complète.** Un contrôle peut vérifier que chaque entrée est imprimée ; il ne peut
pas vérifier qu'il ne manque pas une entrée. Seul un humain le peut, et le
drapeau est l'endroit où il le dit.

> **Et les mettre à `true` sans l'avoir fait serait une fausse mention légale.**
> C'est écrit tel quel dans `verifier-legal.mjs` pour le contrat de
> sous-traitance ; la même phrase vaut ici.

### 3.11 CE QUI SE VÉRIFIE DEPUIS CE CONTENEUR — le protocole que le brouillon n'avait pas vu

Le brouillon disait « le PDF ne se vérifie pas ici » et n'a pas vu que **ce
bouton était la seule porte vers tout le reste du lot 2** : la numérotation,
l'instantané, le chemin de stockage, le refus d'un devis incomplet, le figeage.
Tout cela passait par `printToFileAsync`, qui ouvre une boîte modale au
navigateur.

**Or la forme en deux temps du §3.2 règle le problème toute seule**, et c'est sa
propriété la plus utile : `confirmer_remise_devis(p_devis, chemin, octets,
pages)` reçoit **les faits du fichier en ARGUMENTS**. Rien n'impose que le
fichier vienne d'un téléphone.

**Le protocole du lot 2, exécutable :**

1. `npx expo start --web`, Playwright, `poserRelais(page, { hote: '<projet>.supabase.co' })`
   — et un second relais sur `api-adresse.data.gouv.fr` si l'écran de l'émetteur
   est traversé. **Deux relais sur la même page fonctionnent** (mesuré le 04/10).
2. Un compte professionnel **jetable** par `/auth/v1/signup`, et sa fiche
   `emetteur` remplie par PostgREST en `curl`.
3. Le devis et ses lignes créés **par l'application, au navigateur** — cette
   partie ne touche aucun PDF, donc elle marche.
4. `curl … /rest/v1/rpc/preparer_remise_devis` avec le jeton du compte : on lit
   le numéro attribué, l'instantané posé, et **les refus** (chaque mention
   retirée une par une).
5. **Le PDF fabriqué ICI** : `page.pdf({ format: 'A4' })` de Playwright sur le
   HTML rendu par `devis-html.js`. Déjà éprouvé sur un gabarit de 60 lignes —
   26 788 octets, 2 pages, texte extractible. Le comptage des pages et des
   octets est fait par **le même code** que celui qui comptera sur le téléphone.
6. **Le téléversement**, en `curl`, avec le jeton du compte jetable :
   `POST /storage/v1/object/devis/<pro_id>/<devis_id>.pdf`, `Content-Type:
   application/pdf`. C'est ce qui éprouve les politiques de l'espace privé **et**
   `allowed_mime_types` — on pousse un `.txt`, il doit être refusé.
7. `curl … /rest/v1/rpc/confirmer_remise_devis` → le statut passe à `remis`.
8. Puis, sur cette ligne réellement remise : le **figeage** (avec jeton), les
   **comptages de lignes** avant/après chaque suppression (§3.3), l'**instantané**
   par le seul essai qui compte (on change l'assureur dans `emetteur`, on
   réimprime, **c'est l'ANCIEN qui sort**), la **cascade** sur les trois chemins
   de suppression de compte, et le compte jetable supprimé dans la même session.

> **Tout se vérifie alors, sauf le rendu de WKWebView.** C'est une différence
> énorme avec le brouillon, qui laissait la moitié base du seul palier pénal du
> module sans aucune preuve possible.

**Et ce que ce protocole NE prouve PAS, qu'il faut dire dans la réponse et dans
le message de commit :**

- que le PDF fabriqué par `expo-print` sur iOS ressemble à celui de Chromium.
  **Ce sont deux moteurs différents.** Le fichier téléversé ici est un fichier de
  Chromium : il prouve la chaîne, pas le document ;
- la feuille de partage, l'impression, le visualiseur d'iOS, le clavier.

#### La pagination devient une PROPRIÉTÉ, pas une géométrie

Le brouillon annonçait des contrôles de géométrie sur le PDF de Chromium :
« 2 pages pour 60 lignes », « aucun bloc de totaux seul sur une page », « un
habillage ne doit pas faire passer de 2 à 4 pages ».

> **`page.pdf()` de Chromium n'est pas WKWebView.** Ces trois contrôles sont
> mesurés sur le mauvais moteur : ils seraient verts pour la mauvaise raison.
> C'est exactement la famille de `pagingEnabled` du 04/10 — « un défaut réel sur
> le téléphone, invisible ici par construction » — et ce document a payé assez
> cher pour ne pas le refaire.

**Ce que le navigateur peut honnêtement affirmer** : la **présence du texte**
(§3.10), l'extractibilité, et l'absence des constructions d'impression connues
pour diverger. D'où un contrôle de **propriété** : une **liste blanche du CSS**
employé par le gabarit, qui refuse —

| refusé | pourquoi |
|---|---|
| `position: fixed` | sur un médium paginé, son comportement diverge entre moteurs ; c'est la construction qui casse le plus sûrement |
| `background-attachment: fixed` | même famille |
| un `break-before` / `break-after` / `break-inside` écrit dans **une seule** des deux syntaxes | la forme moderne et la forme `page-break-*` ne sont pas supportées pareil. **Les deux ou aucune** |
| `display: flex` ou `grid` sur le tableau de lignes | un vrai `<table>` + `<thead>` répète son en-tête de page et se coupe entre les lignes ; une grille, non |
| les unités `vh` / `vw` / `dvh` | elles n'ont pas de sens sur une feuille A4 |
| `@font-face` dont le `src` est une adresse `http(s)` | le réseau au moment du rendu (§3.6) |
| l'absence d'une règle `@page` | la taille et les marges doivent être déclarées, pas héritées |

Et **la géométrie se juge UNE FOIS, par le propriétaire, sur son iPhone** — sur
**1, 5 et 60 lignes**, et sur **les deux gabarits** (établissement et hors
établissement). Ce qu'on lui demande de regarder est écrit à l'avance, pour
qu'il n'ait pas à deviner : l'en-tête se répète-t-il sur la page 2 ? le bloc de
totaux est-il seul sur une page ? une ligne est-elle coupée en deux ? le
formulaire de rétractation est-il entier ? C'est **quatre questions**, pas « est-ce
que c'est beau ».

### 3.12 Aucune colonne sans lecteur — et deux retraits

C'est la panne silencieuse favorite de ce projet, dans ses deux sens : une
colonne **lue** que personne n'écrit (§2.0), et une colonne **écrite** que
personne ne lit. La relecture en a trouvé trois du second type dans le brouillon.

**1. `nature` à quatre valeurs, dont `gros_equipement` : RETIRÉE.** Sa seule
justification dans le dossier est « pour que l'agent puisse **alerter** » — et ce
plan **exclut l'agent du module entier**. L'artisan remplirait un champ par ligne
pour personne.

> C'est le « bouton §18 » de la section 27.4, retiré **avant** d'être livré. Elle
> naîtra avec le lot qui la lit — et si le besoin est seulement de tracer qu'un
> gros équipement n'ouvre pas le taux réduit, ce n'est pas une colonne : c'est
> **une valeur de plus dans `taux_justification`**.

**2. `taux_justification` : GARDÉE, parce qu'elle a un lecteur réel.** Mais pas
celui que le brouillon annonçait. Elle devient une **liste fermée** et nommée
(`habitation_2ans`, `economie_energie`, `neuf`, `nettoyage`, `espaces_verts`,
`chaudiere_fossile`, `fourni_par_client`, `autre`), et son lecteur est **la ligne
du devis à l'écran** : « 10 % — habitation de plus de 2 ans ».

> **C'est le lecteur qui compte, parce que c'est lui qui rend un taux faux
> VISIBLE avant que le document ne parte.** Un taux de 10 % affiché tout seul ne
> se relit pas ; « 10 % — immeuble neuf » saute aux yeux. Et le palier fiscal est
> **non plafonné** : c'est le seul endroit du module où relire avant d'envoyer
> vaut des milliers d'euros.
>
> Elle **ne s'imprime pas** : aucun texte ne l'exige, et une justification
> imprimée serait une affirmation de plus à défendre. Et `verifier-devis` refuse
> un taux réduit sans justification — mais un contrôle n'est pas un lecteur, et
> ce n'est pas lui qui la sauve.

**3. `pdf_pages` / `pdf_octets` : GARDÉES, avec le lecteur qui manquait.** Le
brouillon disait qu'elles sont « lues par `confirmer_remise_devis()`, qui refuse
en dessous d'un seuil » : c'est **l'écrivain qui contrôle son propre argument**,
pas un lecteur de la valeur rangée. Rien ne les relisait.

> Leur lecteur est **la liste et l'écran du devis** : « Devis n° DEV-2026-0001 —
> **2 pages · 27 Ko** · Rouvrir le document ». Deux services, et le second est le
> vrai : c'est le **contrôle honnête qu'une réimpression n'est pas tronquée**. On
> rouvre le fichier archivé, on compare son poids à celui qui est rangé, et **s'ils
> diffèrent on le DIT** au lieu d'afficher un document amputé. Un PDF de 0 page
> est un fichier valide, et un PDF tronqué s'ouvre très bien.

**Et le même raisonnement à l'envers, pour mémoire** : `cible_type`-style, une
colonne qu'on lit sans l'écrire. Les deux listes — qui LIT, qui ÉCRIT — se font
**avant** d'écrire une ligne de SQL, et `verifier-devis` les tient dans les deux
sens, comme `verifier-place` depuis le 04/10.

### 3.13 L'export RGPD : QUATRE clés, et pas trois

Le brouillon annonçait « trois clés nouvelles » dans `mes_donnees()`. **Le module
a quatre tables.**

| clé | table | pourquoi elle ne peut pas être omise |
|---|---|---|
| `mon_entreprise` | `emetteur` | adresse, assureur, médiateur, tarifs : des données personnelles sur l'artisan |
| `devis_emis` | `devis` | **et l'instantané contient le nom et l'adresse de ses CLIENTS** |
| `devis_lignes` | `devis_lignes` | le détail de ce qui a été proposé |
| **`devis_tva`** | `devis_tva` | **une ligne de `devis_tva` est le MONTANT du devis d'un client** |

> **C'est elle qu'on serait tenté de laisser dehors**, parce qu'elle ressemble à
> un sous-produit de calcul. Ce n'en est pas un : c'est le montant. L'omettre,
> c'est le défaut du lot H refait — l'export de l'article 15 incomplet une nuit,
> **sans aucune erreur** — et un export incomplet ressemble trait pour trait à un
> export fait.

**Plus deux choses dans la même fonction**, parce qu'on la réécrit de toute
façon :

1. la clé existante `'devis'`, qui désigne aujourd'hui les **demandes** reçues **— CORRIGÉ AU LOT 1, le 23/10 : pas seulement reçues. Elle porte les demandes des DEUX côtés** : celles que l'artisan reçoit ET celles que le particulier envoie (la fonction lit `client_id = auth.uid() or professional_id = auth.uid()` ; mesuré : un particulier y trouve la demande qu'il a envoyée) —
   (schema.sql:7737), est renommée `'demandes_de_devis_recues'` **— corrigé au lot 1 : renommée `'demandes_de_devis'`**, sur le modèle de `'rappels'` et `'urgences'` ; le nom prévu ici aurait dit faux. Vérifié sur la vraie base, par le chemin de l'application (22-23/10) : la clé `'devis'` a disparu de l'export, `'demandes_de_devis'` y est (10.16). C'est le seul
   renommage que ce module fait, et il est gratuit : la fonction est réécrite ;
2. **la politique de LECTURE de `devis_tva`** doit exister, sinon la clé est là
   et la liste est vide (§3.5). `mes_donnees()` est `security invoker`.

Et la section s'insère **entre les lignes 7692 et 7693** de `schema.sql` : avant
l'export RGPD (section 42) et avant le balayage (section 43). **La migration doit
emporter `mes_donnees()`**, pas seulement les tables — c'est la faute exacte du
lot H, et elle était invisible.

### 3.14 Le message d'erreur qui envoie rejouer le schéma — et qui le ferait au mauvais moment

Lu dans `src/lib/erreurs.js`, lignes 105-110, la branche qui traite **toute**
contrainte `check` :

```js
if (m.includes('violates check constraint') || m.includes('check constraint')) {
  const nom = (brut.match(/"([a-z0-9_]+_check)"/i) || [])[1];
  return `${sujet}la base a refusé cette valeur`
    + (nom ? ` (contrainte « ${nom} »)` : '')
    + '. Le plus souvent, `supabase/schema.sql` n’a pas été rejoué.';
}
```

Cette phrase est **juste** pour tout ce que ce projet a construit jusqu'ici : une
contrainte `check` qui refuse signifiait presque toujours que l'application
envoyait une valeur que la base ne connaissait pas — la panne `montage`, et c'est
pour elle que le message a été écrit.

> **Le devis est la PREMIÈRE table du projet dont les contraintes `check` sont de
> la validation UTILISATEUR**, et non une faute de développeur. « Il manque votre
> adresse », « il manque le délai d'exécution », « le total ne correspond pas à
> la ventilation » : ce sont des champs oubliés par un artisan, et c'est le refus
> **le plus fréquent** du module.
>
> Donc, tel quel, le module enverrait le propriétaire **rejouer son schéma** pour
> un champ qu'il a oublié de remplir. C'est la piste FAUSSE que CLAUDE.md traque
> depuis le premier jour, resservie ailleurs — et elle serait resservie des
> dizaines de fois par jour.

**Ce qu'il faut changer, et c'est petit :**

1. **un dictionnaire par contrainte**, `MESSAGES_CONTRAINTE`, dans `erreurs.js`.
   Chaque contrainte du module y a son message en français, qui dit **quoi
   faire** : `devis_remis_complet_check` → « Il manque des informations
   obligatoires sur ce devis. L'écran vous dit lesquelles. » La phrase
   « schema.sql n'a pas été rejoué » **ne reste QUE pour les contraintes que le
   dictionnaire ne connaît pas** — ce qui est précisément le cas « faute de
   développeur » pour lequel elle a été écrite. Le message devient juste dans les
   deux cas au lieu d'être juste dans un seul ;
2. **le motif rate `…_check1`.** `[a-z0-9_]+_check` ne correspond pas à
   `devis_tva_check1`, et c'est le nom que PostgreSQL donne à la **deuxième**
   contrainte anonyme multi-colonnes d'une table (mesuré). Résultat : message
   anonyme **plus** piste fausse, pour un total mal arrondi. Le motif devient
   `_check\d*`. **Et le module n'a de toute façon aucune contrainte anonyme** —
   ceinture et bretelles, parce que celle-là coûte une heure ;
3. **les trois branches absentes.** Vérifié par lecture du fichier : il n'y a
   **aucune** branche pour `23503` (clé étrangère), `22003` (débordement
   numérique), `23502` (colonne obligatoire). Un montant mal tapé ou un client
   supprimé sortiraient en **anglais brut** ;
4. **`23505` reformulé.** « cela existe déjà » ne veut rien dire pour un numéro de
   devis — et c'est exactement le message qu'un échec de numérotation afficherait
   (§3.2) ;
5. **`OP003` lu par son CODE, et avant la branche `check`.** `messageClair(e, …)`
   reçoit l'objet d'erreur entier, donc elle peut lire `e.code` — ce que la
   branche `OP001` ne fait pas (elle reconnaît le TEXTE du message). Pour `OP003`
   on fait mieux : `if (e && e.code === 'OP003') return brut;`, **placé avant** la
   branche des contraintes `check`, pour qu'aucune reformulation ne vienne
   recouvrir le message complet que la base a écrit en français.

> **ET CE LOT N'EST PAS LE LOT 2.** Le brouillon rangeait ces changements avec le
> document. Or **la première contrainte `check` du module naît au lot 0** (les
> trois contraintes croisées de l'émetteur : pas de médiateur sans son site, pas
> d'assureur sans son contrat, pas de devis payant sans son prix). Les points 1
> à 4 partent donc **avec le lot 0** ; seul le point 5 attend le lot 2, où
> `OP003` naît.

---

## 4. LE DÉCOUPAGE EN LOTS

**Six lots, et l'ordre n'est pas interchangeable** — plus un septième qui
n'existe que si la question 6 reçoit « oui ». L'ordre suit la hiérarchie du coût
d'une erreur du §2.5, avec une seule inversion volontaire : la TVA, qui est le
palier le plus PROBABLE, passe après le document, qui est le palier le plus
GRAVE.

> **Et cette inversion repose sur la QUESTION 1, pas sur un relevé.** Le
> brouillon la justifiait aussi par « les 5 autres fiches à SIRET sont de
> démonstration » : **ce n'est pas mesuré** (§1). Ce qui est mesuré, c'est que la
> fiche du propriétaire n'a pas de SIRET. Si sa réponse est « régime réel », le
> lot 3 remonte avant le lot 2.

### Lot 0 — Mon entreprise : la fiche qu'on remplit UNE fois

**Contenu.** La table privée `public.emetteur` (clé primaire = `pro_id`, 1:1 avec
la fiche pro : il n'y a rien à numéroter), sa politique unique via
`est_mon_entreprise()`, `revoke all … from anon`, son déclencheur de nettoyage.
L'écran « Mon entreprise » en plein écran, croix EN HAUT, `{...CLAVIER}`,
`ChampVille` en mode `rue` pour l'adresse. Le téléversement de l'attestation
décennale dans l'espace privé **`documents`, qui existe déjà et que la fonction
Edge `compte` nettoie déjà** — aucune ligne nouvelle à ajouter nulle part. Le
routage par catégorie réutilisé depuis `pieces-justificatives.js`. La rangée
« Mon entreprise » sous « Mes clients » dans Profil, réservée aux pros, **absente
et non grisée** pour un particulier. Et `emetteur_incomplet(uuid) returns
text[]`, en SQL.

**Plus les sept colonnes que le brouillon avait oubliées** (§2.0) :
`garanties_texte`, `sav_texte`, `frais_deplacement_centimes`,
`frais_deplacement_texte`, `cgv_texte`, `clause_droit_applicable`,
`clause_juridiction` — avec leur place dans `emetteur_incomplet()` pour les deux
qui bloquent, et l'interrupteur « Je ne facture pas de frais de déplacement » qui
écrit **0** et non un vide.

**Plus les points 1 à 4 de `erreurs.js`** (§3.14), parce que **c'est ici que naît
la première contrainte `check` du module**.

**RIEN n'est `not null` sauf `pro_id`.**

> Mesuré : `FicheClient.js` compte **7 champs**, et c'est de CE formulaire que le
> propriétaire a dit « le clavier bloque un peu les champs du bas ». Cette fiche
> en compte une vingtaine. Un artisan qui en remplit la moitié entre deux
> chantiers et touche Enregistrer **ne doit pas tout perdre** — et rien dans le
> métier ne l'exige : **la complétude n'est pas une question de colonne, c'est
> une question de REMISE.**

En revanche, **trois contraintes CROISÉES**, qui n'ajoutent aucun champ
obligatoire parce qu'elles sont conditionnelles, et qui empêchent une mention
**incomplète** — pire qu'absente : pas de médiateur sans son site (l'adresse du
site est expressément exigée) ; pas d'assureur sans son numéro de contrat ni sa
couverture géographique ; pas de devis payant sans son prix.

Plus **un bouton qui MONTRE avant de poser** : « Utiliser le SIRET de ma fiche
(123 456 789 00012) », nettoyé et normalisé — modèle du 05/10. Il disparaît dès
que le champ est rempli ; une proposition qui reste après coup n'est plus une
aide.

**QUI LIT, dès la livraison.** Deux lecteurs, et c'est volontaire :

1. **le bloc « Prêt à émettre un devis ? »**, qui appelle `emetteur_incomplet()`
   et dit en français ce qui manque, avec son POURQUOI : « votre adresse
   complète — un devis sans l'adresse de son émetteur n'est pas légal » ;
2. **l'aperçu de l'en-tête** — un bloc qui montre, en vrai, comment son en-tête
   s'imprimera, logo compris. Sans lui, vingt colonnes seraient relues par un
   seul formulaire, ce qui est un lecteur faible. Avec lui, **chaque champ a une
   conséquence visible dès qu'on le remplit**.

Et `emetteur_incomplet()` est **en SQL et pas en JavaScript**, parce que c'est la
MÊME liste que `preparer_remise_devis()` refusera au lot 2. Deux écritures de
cette règle se désaligneraient, et le jour où elles divergeraient **l'écran
dirait « prêt » devant un refus** — c'est le défaut des voyants du 04/10.

**COMMENT ON LE VÉRIFIE ICI.** Entièrement. `schema.sql` rejoué **deux fois** sur
un PostgreSQL 16 neuf ; les essais RLS avec `set local role authenticated` puis
`set local request.jwt.claim.sub`, **chacun dans son propre appel et jamais dans
un bloc `do`** — et encadrés par deux cas qui lisent quelque chose, pour que le
« 0 » du cas « un autre pro ne lit rien » soit vrai pour la bonne raison (leçon
de la section 29). Les trois contraintes croisées éprouvées une par une. **Les
trois états des frais de déplacement éprouvés séparément** : `null` refuse, `0`
passe et imprime « non facturés », un montant passe. Puis au navigateur sur la
VRAIE base, compte jetable supprimé dans la même session : le bloc qui passe de
« il manque sept choses » à « prêt », mesuré champ par champ, l'aperçu qui se
remplit, les cibles à 44 points, et `POST → 201` avec **rechargement complet de
la page**.

**Ne se vérifie PAS ici** : le clavier sous ce formulaire, et le téléversement
depuis l'appareil photo. À **demander**.

**POURQUOI LÀ.** Parce que rien n'est émissible sans lui, et c'est mesuré : 0 des
colonnes du bloc émetteur n'existe, 0 attestation sur 7 fiches. Poser la table
des devis d'abord donnerait un écran qui imprime un en-tête troué pour les
7 pros de la base — un devis non conforme émis sans la moindre erreur. **Et ce
lot est utile tout seul, même si le devis n'arrivait jamais** : il rend enfin
saisissables les informations que l'arrêté de 2017 exige déjà d'un artisan, et il
répond à la moitié de la demande du propriétaire (« ses informations »).

> **CE LOT N'EST PAS PETIT, ET IL FAUT LE DIRE AVANT DE LE VALIDER.** Une
> relecture indépendante l'a compté contre le module Clients livré le 11/10 :
>
> | | Clients (livré) | lot 0 |
> |---|---|---|
> | tables | 1 | 1 |
> | **colonnes** | **14** | **une trentaine** |
> | **champs de formulaire** | **7** | **une trentaine** |
> | fonctions SQL | 0 | 1 (`emetteur_incomplet`) |
> | stockage | aucun | téléversement de l'attestation |
>
> C'est **deux fois et demie** le plus gros formulaire de gestion déjà livré, et
> le formulaire client avait déjà sorti la plainte du clavier. **Deux issues, et
> c'est au propriétaire de trancher** : le livrer en une fois en acceptant qu'il
> se vérifie en deux soirées, ou le couper en deux — l'identité qui bloque un
> devis (adresse, SIRET, forme juridique, assureur) d'abord, puis le confort
> (logo, modèle, devis payant, durée de validité habituelle, CGV). Je recommande
> **la coupe** : la première moitié est ce qui rend un devis légal, la seconde ne
> fait que le rendre plus joli.
>
> Ce qui reste vrai, et qui était l'argument : une table, une politique, un
> déclencheur, un écran, deux lecteurs, zéro espace de stockage créé, zéro
> fichier hors base touché.
>
> **Et c'est le lot que la question 6 peut déplacer.** Si vos tarifs doivent
> s'afficher publiquement, deux ou trois de ces colonnes ne vivent pas dans une
> table privée. Posée avant, la question ne coûte rien ; posée après, c'est un
> déménagement de colonnes et un devis déjà figé qui pointe l'ancienne.

### Lot 1 — Le chiffrage : il tape, ça se totalise, et ça se relit — FAIT le 23/10/2026 (10.16)

**[FAIT le 23/10/2026. Ce qui suit est le plan d'AVANT la construction**, gardé tel quel ; ce que le lot 1 a changé — trois taux au choix dès ce lot au régime réel, « Offert » qui garde son prix, aucune remise, la formule en centièmes de point, sept unités — est au **10.16, qui fait foi.]** **Contenu.** `devis` dans sa forme minimale (liens, statut limité à
`('brouillon')`, source, objet, lieu d'exécution, **délai d'exécution**, totaux,
dates), `devis_lignes` en entier, **et `devis_tva`** avec sa contrainte d'arrondi
**et sa politique de LECTURE** (§3.5). Les trois déclencheurs : nettoyage, calcul
du total de ligne, recalcul des totaux et de la ventilation.
`src/lib/devis.js` **qui n'importe RIEN** : `totalLigne()`,
`ventilationParTaux()`, `totauxDevis()`, `montantDevis()`, `validerDevis()`,
`validerLigne()`. L'écran de saisie, la liste des devis, le bouton « Faire un
devis » sur une fiche client et sur une demande acceptée, et les deux fonctions
pures `devisDepuisClient()` / `devisDepuisDemande()`. **La pastille de statut par
`surFond()`** (§3.9).

**La colonne de taux et la FORMULE existent dès ce lot**, même si l'écran ne
propose pas encore les trois taux **[corrigé au lot 1, le 23/10 : l'écran les propose dès ce lot, au régime réel — Q1, 10.16]** : changer la formule après que des devis sont
figés produirait des devis gelés dont les totaux ne correspondent plus à leurs
lignes — et le figeage interdit justement de les corriger.

**Le statut ne porte qu'UNE valeur.** Une contrainte à cinq valeurs dont quatre
ne sont produites par rien serait quatre valeurs mortes. Elle se refait au lot 2,
puis au lot 4, et c'est un geste que ce projet fait couramment.

**L'écran DIT ce qu'il est** : « Chiffrage — ce brouillon ne part pas encore. »
Un demi-produit qui s'annonce vaut mieux qu'un document qui a l'air conforme.

**QUI LIT.** Cinq lecteurs, et aucun n'est du décor :

1. **la liste des devis**, triée par ce qui attend puis par date — **l'inverse du
   carnet**, qui est trié par nom parce qu'on y cherche quelqu'un. Bornée à 200,
   **et la borne n'est honnête QU'AVEC le tri** : mesuré le 05/10,
   `order by created_at desc limit 200` gardait **0** devis en attente sur
   250 demandes closes du jour. Avec un pied de liste qui DIT la troncature ;
2. **le total qui court en pied d'écran pendant qu'il tape**, avec le tableau de
   ventilation par taux — **CORRIGÉ AU LOT 1, le 23/10 : pas pendant qu'il tape. Le total est recalculé quand il QUITTE un champ, et c'est celui que la BASE a calculé**, pas le téléphone ; entre-temps le pied garde la dernière valeur sûre et dit combien de lignes ne sont pas encore enregistrées (10.16) ;
3. **la fiche d'un client, qui montre ses devis** — et c'est le **premier lecteur
   de `clients` qui ne soit pas son propre écran** : la boucle du module 1 se
   ferme ici ;
4. **les options à part**, sous le total principal (« Options, non comprises ») ;
5. **les désignations déjà employées, la plus récente d'abord, avec leur dernier
   prix**, lues dans ses propres `devis_lignes`. C'est ce qui fait que le
   deuxième devis coûte trois gestes au lieu de dix, **sans la table `ouvrages`
   que personne ne remplirait**.

**COMMENT ON LE VÉRIFIE ICI.** C'est le lot le mieux vérifiable du module, parce
qu'il n'y a aucun PDF dedans. `verifier-devis` **FAIT TOURNER** `devis.js` sur
les cas de bord : les trois lignes à 33,33 € à 10 % (999 ligne par ligne, 1000
par taux — **c'est le cas qui prouve la méthode**), le demi-centime exact, 2,5 m²
à 33,33 €, trois taux dans le même devis, une option hors du total, une remise
sur un montant impair **[corrigé au lot 1, le 23/10 : aucune remise au lot 1, et rien ne définissait une remise. Ce cas est remplacé par « Offert » et par le refus d'une ligne négative. La remise commerciale — une réduction de prix, à ne pas confondre avec la remise du devis au client — se construit au lot 2, avant le PDF, sur le TOTAL du devis (réponse du 21/10, 10.16)]**, un total au plafond. **Et il compare les résultats
JavaScript aux résultats SQL sur le MÊME jeu** — l'accord de
`(base*taux + 500)/1000` **[corrigé au lot 1, le 23/10 : c'était la formule en millièmes ; la TVA se calcule `(base * taux + 5000) / 10000`, taux en centièmes de point, et le lot 1 a joué ses 44 cas d'argent des deux côtés, 0 écart]** est déjà mesuré des deux côtés, donc il est
démontrable, pas espéré.

Côté base : `schema.sql` rejoué deux fois, les invariants
(`total_ttc = total_ht + total_tva`, `total_tva = somme(devis_tva)`), le recalcul
éprouvé **dans les deux sens** (on retire une ligne, le total redescend), un
`insert` direct dans `devis_tva` qui doit rendre **403**, **et `mes_donnees()`
qui doit rendre la ventilation et non une liste vide** (la politique de lecture
du §3.5 : sans elle, l'export est silencieusement amputé). Puis au navigateur sur
la VRAIE base, compte jetable supprimé dans la même session : un devis de
4 lignes à 2 taux, **le total lu à l'écran comparé au total lu EN BASE**, et le
devis rechargé après un rechargement complet de la page. Plus les boîtes réelles
mesurées (une ligne de devis à 44 points de haut, par `minHeight: TOUCHE` et
jamais `paddingVertical`) et les trois réglages de liste.

**Ne se vérifie PAS ici** : le clavier, et le pouce sur une grille de lignes.

**POURQUOI LÀ.** Parce qu'il **ne peut RIEN sortir, donc il ne peut engager
personne** : le palier pénal n'existe qu'au moment où un document part. Un lot
sans risque juridique peut se livrer vite et se corriger. Et parce qu'il isole le
risque n° 1 du module — l'argent — avant d'y ajouter le risque n° 2, le
document : il n'existe **aucun précédent monétaire** dans ce projet, donc aucune
règle écrite, et les trois mesures d'arrondi se contredisent en silence. On ne
mélange pas ça avec un gabarit.

### Lot 2 — La remise ET le document, ensemble

> **On ne peut pas séparer « remis » du document.** Le jour où un PDF existe,
> l'artisan le fait signer sur place, et ce document DEVIENT le contrat. S'il ne
> porte pas le formulaire de rétractation, le contrat est rétractable pendant
> **douze mois et quatorze jours**, chantier terminé ou non. Et à l'inverse, un
> statut `remis` posé un lot avant le document, c'est un devis « remis » sans
> rien à remettre — sans aucune contrainte pour l'empêcher.

**Contenu.** `preparer_remise_devis()` et `confirmer_remise_devis()` en
`security definer`, avec la vérification **explicite** de `est_mon_entreprise()`
(en `security definer` la RLS ne protège plus) et le verrou consultatif. Les
colonnes d'instantané (préfixes `em_` / `cl_`, §3.4) et de numéro.
**`devis_se_fige()` et `ligne_se_fige()` dans la forme à branche `TG_OP` du
§3.3** — c'est la correction la plus importante de ce plan —, avec le
discriminant de cascade et `OP003` levé **par `errcode = 'OP003'`**.
`devis_remis_complet_check` — **un devis ne peut pas être `remis` sans son
numéro, son instantané ET son fichier**, et sans les garanties, les frais de
déplacement et le délai d'exécution (§2.0). `lieu_conclusion` (défaut
`hors_etablissement`, **à confirmer par la question 7**) et `urgence_sollicitee`.
`validite_jusqu_au`, choisie dans le calendrier existant. `emetteur.logo_url` et
l'espace public `logos`. L'espace privé `devis` avec son `allowed_mime_types`.
`expo-print` + `expo-sharing`, **et la branche `Platform.OS === 'web'` de
`devis-pdf.js`** (§3.6). **L'envoi à deux pièces.** Le point 5 de `erreurs.js`
(§3.14).

`src/lib/devis-html.js` et `src/data/mentions-devis.js`, les deux sans aucun
import — **et `mentions-devis.js` porte `MENTIONS_OBLIGATOIRES` écrite depuis le
dossier juridique, plus `MENTIONS_RELUES_PAR` / `MENTIONS_RELUES_LE`** (§3.10).

**UN SEUL gabarit, portant l'UNION de tous les blocs obligatoires** : les
dix mentions de l'art. 4, I ; la forme du contrat de l'art. 4, II avec le
**formulaire type de rétractation sur une page séparée ou reproduit en double** ;
**l'information sur la conservation des pièces remplacées, dans les DEUX cas** ;
les six informations de L. 111-1, **garanties et délai d'exécution compris** ;
le médiateur ; les frais de déplacement ; **la date de rédaction, lue dans
`remis_le`** ; **la demande d'exécution anticipée** avec sa case **non
pré-cochée** ; le bloc de sollicitation expresse quand `urgence_sollicitee` ; et
les clauses de droit applicable et de juridiction **si l'émetteur en a
déclaré**.

`lieu_conclusion` existe parce que **deux blocs sont NUISIBLES imprimés à tort** :
annoncer 14 jours à qui n'y a pas droit est une fausse information, et annoncer
un blocage de 7 jours à qui n'y est pas soumis coûte de l'argent à l'artisan.

**Et `regime_tva` est NULLABLE avec un état « non déclaré ».**
`preparer_remise_devis()` **refuse tant que le régime n'a pas été déclaré**, et
au lot 2 elle refuse le régime **réel**.

> **Ce n'est pas une amputation si vous êtes en franchise** : votre devis est
> conforme sans un seul taux, avec la mention de l'art. 293 B. Un faux 20 %
> serait pire qu'un refus. Et un défaut `'franchise'`, lui, ferait imprimer une
> exonération FAUSSE à qui n'a rien déclaré. **C'est la question 1.**

**Ce qui n'est PAS dans ce lot, et pourquoi.** Les DATES de rétractation et
d'exigibilité de l'acompte. Elles dépendent d'une **signature**, qui est un fait
postérieur à la remise et qu'Opus n'enregistre pas avant le lot 4. Le lot 2
imprime donc **la règle en toutes lettres** ; le lot 4 pose les dates.

> **Et il faut dire pourquoi « le refus d'encaisser avant J+7 » n'est pas une
> garantie qu'Opus peut tenir : Opus n'encaisse rien.** Il n'y a aucun paiement
> dans ce projet. Ce qu'il pourra refuser, c'est de DATER une facture d'acompte
> avant J+7 — et c'est le module 3. Annoncer un refus que la base ne peut pas
> appliquer serait un « X est prévenu ».

**QUI LIT.** **Le CLIENT**, et c'est la première fois dans ce module que le
lecteur n'est pas l'artisan : il reçoit un PDF nommé, lisible, qu'il peut garder,
plus l'attestation. Côté Opus : la liste affiche « remis le 12/10,
n° DEV-2026-0001, valable jusqu'au 11/11 » ; l'écran du devis **rouvre le fichier
archivé** plutôt que de refaire un rendu ; et **`pdf_pages` / `pdf_octets` sont
affichés — « 2 pages · 27 Ko » — ce qui est aussi le contrôle honnête qu'une
réimpression n'est pas tronquée** (§3.12). Le brouillon n'avait pour « lecteur »
que l'écrivain qui contrôle son propre argument.

**Et le REFUS est un lecteur à part entière** : « Il manque votre attestation
d'assurance — un devis de travaux doit la porter. » C'est la règle de « Pour moi »
du 05/10 : un travail qui n'a pas pu se faire ne doit jamais ressembler à un
travail fait.

**COMMENT ON LE VÉRIFIE ICI — par le protocole du §3.11**, qui est la seconde
grande correction de cette relecture. En résumé : le PDF est fabriqué **ici** par
`page.pdf()`, téléversé **ici** avec le jeton d'un compte jetable, et les deux
fonctions sont appelées **ici** par PostgREST en `curl`. Donc la numérotation
(deux sessions `psql` en parallèle avec un `pg_sleep` : sans le verrou,
« duplicate key » ; avec, 1 puis 2), le figeage **avec un jeton** et **en
comptant les lignes**, l'instantané par le seul essai qui compte (on change
l'assureur, on réimprime, **c'est l'ANCIEN qui sort**), le refus de l'incomplet
mention par mention, la cascade sur les **trois** chemins de suppression de
compte, et les politiques de l'espace de stockage — tout se vérifie.

Et la **complétude** par le contrôle du §3.10 : chaque entrée de
`MENTIONS_OBLIGATOIRES` présente dans le texte extrait, **sur les deux gabarits
de contenu**, avec le compte écrit dans le contrôle et le drapeau humain.

**NE SE VÉRIFIE PAS ICI, et il faut le dire dans la réponse ET dans le message de
commit** : le PDF réel produit par WKWebView (ce n'est pas Chromium), son nom,
son poids réel, la feuille de partage, l'impression sur papier, et la géométrie
de la pagination (§3.11). **Le fichier téléversé pendant l'essai est un fichier
de Chromium : il prouve la chaîne, pas le document.**

**POURQUOI LÀ.** C'est le **seul palier pénal** du module, et il doit être juste
avant qu'un devis réel existe — et avant que la Visite multiplie le cas hors
établissement.

### Lot 3 — La TVA complète, et la case que le client coche

**Contenu.** L'écran choisit enfin un taux par ligne (20 / 10 / 5,5 proposés) **[corrigé au lot 1, le 23/10 : ce choix existe dès le lot 1, au régime réel (Q1, 10.16). Reste ici la certification du client pour 10 % et 5,5 %, et la liste des taux, qui se refait]** ;
`preparer_remise_devis()` cesse de refuser le régime réel ; le pied du devis
devient le vrai **tableau de ventilation** (la place était réservée au lot 2,
remplie d'une seule ligne). Les **trois** cases de certification du § 80, chacune
pour son objet — pas une case unique, qui ne couvre pas ce que le texte exige —,
`certification_requise`, `certification_texte` (le texte **réellement
imprimé**, figé) et `certification_le`. **La ligne de responsabilité solidaire
écrite SOUS le bloc** : le devis certifié n'est pas un objet à relire, il engage
le client. `logement_acheve_le date` et le calcul **par taux**. Le mode
`autoliquidation` (tous les taux à zéro, `total_ttc = total_ht`, tenu par
contrainte, aucun bloc de certification). Le mode `franchise` (aucun total TTC
distinct du HT, et la mention — **jamais une colonne « TVA 0 % »**). Le drapeau
« soumis à l'arrêté du 24/01/2017 » par métier dans `catalogue-metiers.js`.
**`taux_justification` en liste fermée, avec son lecteur à l'écran** (§3.12).

**Et `nature` n'y est PAS** : elle est retirée avant d'être livrée, parce que son
seul lecteur annoncé était l'agent, que ce module exclut (§3.12).

**Et la GARDE RGE, en commentaire de section et en refus du contrôle.** Mesuré :
**3 fiches sur 7 portent `rge = true`** aujourd'hui. Ni l'art. 279-0 bis, ni
l'art. 278-0 bis A, ni impots.gouv.fr ne mentionnent la qualification RGE — elle
conditionne des **aides**, pas un taux. La tentation sera réelle, et un artisan
non RGE verrait son taux refusé **sans aucun fondement légal**, en silence.

**QUI LIT.** Le pied du devis, qui imprime le tableau. **La ligne du devis à
l'écran, qui affiche « 10 % — habitation de plus de 2 ans »** et rend un taux
faux visible avant l'envoi. Le bloc de certification, que le client coche et
signe — **c'est le premier endroit du module où il écrit quelque chose**. Et le
**BLOCAGE** de la remise quand la certification manque, avec le message qui dit
ce que ça coûte : sur un devis de 30 000 € à 10 %, une case manquante fait
basculer **la totalité** à 20 % et le prestataire en est seul débiteur — environ
3 000 € sur ses propres fonds. **L'écran bloque, il n'avertit pas.**

**COMMENT ON LE VÉRIFIE ICI.** `verifier-devis` fait tourner la ventilation sur
un devis à trois taux. **Et il n'encode PAS la différence d'un jour entre le
10 % et le 5,5 %** : le §2.1 explique pourquoi — les sources se contredisent sur
« plus de deux ans » contre « au moins deux ans », et un contrôle vert qui
accorderait le 5,5 % à tort coûterait la totalité de la TVA du devis. Le cas
limite « achevé il y a exactement deux ans » est donc écrit dans le jeu d'essai
**en question ouverte**, avec les quatre sources qui divergent en commentaire, et
il attend l'arbitrage d'un comptable. Les deux taux partagent le même test
d'ancienneté jusque-là. Il refuse le nombre 150 associé au
mot « devis » dans tout le dépôt. La table des mentions est lue **par la DATE du
devis** : un essai pose un devis daté de 2026 et un de 2028 et vérifie qu'ils ne
portent pas la même référence. Le drapeau par métier est recalculé sur les
8 métiers déclarés en base et sur les 5 catégories hors champ. Puis au
navigateur : les deux gabarits rendus côte à côte, et le blocage.

**POURQUOI LÀ.** C'est le palier **non plafonné** et le plus **PROBABLE** au
quotidien — il suffit d'une case oubliée par un client pressé. Mais il vient
après le document parce que la certification n'a de valeur que **figée** (« le
prestataire doit pouvoir la produire sur demande », en une copie reproduisant
l'original à l'identique et durablement).

> **Et parce qu'il ne concerne personne aujourd'hui — SI ET SEULEMENT SI vous
> êtes en franchise.** C'est la question 1, et c'est le seul argument qui tient :
> la nature des cinq autres fiches à SIRET n'est **pas mesurée** (§1), et le
> brouillon s'appuyait dessus.

### Lot 4 — Le cycle de vie : relancer, accepter, refaire

**Contenu.** La contrainte de statut refaite en
`('brouillon','remis','accepte','refuse','expire')` — **sans accents sur les
participes** (§3.9) — **et la liste blanche du verrou élargie dans le MÊME
geste** : les deux sont deux moitiés de la même règle, et elles ne peuvent pas se
désaligner si elles changent ensemble. `signe_le` **et ses deux bornes** (§3.9)
et `acceptation_recue_le` (**deux dates distinctes : c'est la SECONDE qui forme
le contrat**, art. 1121, et c'est la base qui la pose), `mention_accord` (ce que
le client a ÉCRIT — les termes sont imposés, une case cochée n'imite pas une
mention manuscrite), `refuse_le`, `remplace_id`, `version`, `acompte_pourcent`
**ou** `acompte_centimes` jamais les deux (contrainte croisée) et
`acompte_nature` en liste fermée de deux valeurs. `src/lib/devis-delais.js` sans
aucun import : J+14, J+7, caducité. Le déclencheur qui **refuse d'accepter un
devis caduc**. La ligne de pastilles « À relancer / En cours / Classés », même
brique `PastilleBascule` que la Place des pros et les Demandes, nombres dans les
libellés.

**Aucune acceptation TACITE** (art. 1120 : le silence ne vaut pas acceptation —
donc aucun « sans réponse sous 8 jours »), et **aucune acceptation PARTIELLE**
(art. 1118 : un client qui accepte « sauf la ligne 4 » contre-propose, et Opus ne
doit pas fabriquer un contrat qui n'existe pas — donc aucun champ modifiable au
moment de marquer accepté).

**Et l'avertissement HONNÊTE sur ce que vaut une acceptation enregistrée dans
Opus.** L'art. 1366 subordonne la force probante d'un écrit électronique à DEUX
conditions **cumulatives** : identifier la personne dont il émane, **et**
garantir l'intégrité de l'acte. Opus peut tenir la seconde (l'instantané, le PDF
figé) et **pas la première** pour quelqu'un qui n'a pas de compte.

> **On trace, on dit ce que ça vaut, et on n'écrit NULLE PART « signé
> électroniquement ».** Ce serait laisser l'artisan croire qu'il est couvert —
> la famille du « X est prévenu ».

**QUI LIT.** **La pastille « À relancer »**, qui répond à la question du §3.3 du
cahier des charges : « Quels devis dois-je relancer ? » C'est le seul écran du
module qui lui dit quoi FAIRE demain matin. Les deux délais affichés dès qu'une
signature est enregistrée. `remplace_id` lu par la pastille « Remplacé par le
n° … ». Et `validite_jusqu_au`, écrite et imprimée au lot 2, **trouve ici son
second lecteur** : le statut `expire`. Sans ce lot, c'était une date imprimée que
rien ne faisait arriver — le défaut de `demandes.statut`, resté muet depuis le
premier jour jusqu'au 04/10.

**COMMENT ON LE VÉRIFIE ICI.** Les calculs de délai et de caducité **faits
tourner** par `node`, en comparaison de **CHAÎNES « AAAA-MM-JJ »** et jamais par
`new Date()` — `new Date('2026-10-12')` est minuit UTC, donc le 11 octobre à
New York. Un cas franchit exprès le changement d'heure d'octobre. **Un devis qui
expire aujourd'hui n'est pas encore expiré.** Les bornes de `signe_le` éprouvées
dans les deux sens, **et le piège `IMMUTABLE` du §3.9 mesuré avant d'écrire la
contrainte**. Les trois refus éprouvés avec un jeton, **en comptant les lignes**
(§3.3) : accepter un devis caduc, modifier un devis accepté, supprimer un devis
remis — **et supprimer un brouillon, qui doit RÉUSSIR**. Au navigateur : les
trois pastilles avec leurs nombres et leurs boîtes réelles, et « Refaire » qui
crée bien un nouveau devis en laissant l'ancien lisible.

**POURQUOI LÀ.** Parce qu'il ne rend tenable dans le temps que ce qui existe
déjà : sans lui, un devis remis reste « remis » pour toujours et la liste devient
un cimetière. Et parce que l'acceptation porte sur un PDF figé : **sans fichier
qui existe, « le client a accepté ce devis » ne désigne rien.**

### Lot 5 — Les cinq modèles

Voir §5.

### Lot 6 — Les tarifs publics (conditionnel)

**N'existe que si la question 6 reçoit « oui ».** Contenu : déplacer le taux
horaire, les modalités de décompte du temps et les frais de déplacement vers ce
que le public peut lire, et les afficher sur la fiche pro. Ce n'est pas une
colonne à ouvrir : **une règle RLS filtre des LIGNES, jamais des COLONNES**, donc
c'est un déménagement — soit vers `professional_profiles` (déjà publique,
45 colonnes sur 45 lisibles par `anon`), soit vers une petite table publique
dédiée.

**Et il coûte beaucoup plus cher après le lot 2 qu'avant le lot 0** : les devis
déjà remis portent l'instantané de ces colonnes, donc le déménagement doit
laisser l'instantané intact — ce qu'il fera, puisque l'instantané est une copie.
Mais le code qui lit `emetteur.taux_horaire` est alors écrit à cinq endroits.
**C'est pour cela que la question se pose maintenant.**

---

## 5. LES CINQ MODÈLES — la réponse à la demande du propriétaire

> « Pour les devis peut-être qu'on pourrait proposer 4 ou 5 design de devis juste
> pour avoir des modèles et bien sûr l'artisan le modifier avec son logo et ses
> informations. »

**Oui, et voici la forme exacte : cinq FEUILLES DE STYLE sur un seul gabarit de
contenu.** `src/data/modeles-devis.js`, un seul `devis-html.js`, un seul HTML —
**seul le `<style>` change**. `emetteur.modele` mémorise son choix, et `modele` +
`modele_version` sont **figés dans l'instantané** : changer de modèle ne change
que les devis à VENIR, jamais un devis déjà parti.

**Ce qui les distingue, et ce qui ne les distingue pas :**

> **Un habillage change la TYPOGRAPHIE, la GRILLE, la PLACE DU LOGO et l'usage de
> la BANDE DE CHANTIER diagonale. Il ne peut RETIRER aucun bloc** des lots 2
> et 3.

**Pas de coins arrondis.** Un devis est de la **STRUCTURE** de bout en bout —
tableau de lignes, pied de totaux, blocs de mentions. La règle du projet est
nette : « angle vif = la structure, ce qui PORTE l'information ; arrondi = ce qui
FLOTTE au-dessus et sur quoi on appuie ». Il n'y a rien à toucher sur une feuille,
donc rien à arrondir — et `TOUCHE`, `viser()` et `SH` ne traversent pas dans le
document : une ombre sur du papier coûte de l'encre.

**L'orange ne bouge pas, mais l'encre posée dessus, si.** `C.accentTexte` pour
tout texte orange, `C.surAccent` sur un bandeau orange, et **aucune information
portée par la seule couleur** : un devis se lit sur du papier blanc, parfois
photocopié en noir et blanc. **Le total à payer se distingue par sa TAILLE et son
poids, jamais par sa teinte.**

**Oswald en base64 pour les seuls TITRES** est l'arbitrage chiffré du lot
(116 808 octets, contre 1 031 528 pour les trois graisses d'Inter) — à trancher
avec le propriétaire, pas tout seul.

### Pourquoi ils viennent APRÈS le contenu juste

Trois raisons, et la troisième n'est pas de la prudence :

1. **Cinq designs posés sur un devis qui n'a ni l'adresse de l'artisan, ni son
   assurance, ni ses garanties, ni la mention de TVA, ce sont cinq documents NON
   CONFORMES au lieu d'un.** C'est le « bouton §18 » dans sa forme la plus
   coûteuse : du code qui a l'air de servir, qu'un contrôle couvre
   consciencieusement, et qui habille un document faux. Et c'est l'ARTISAN qui en
   répondrait, pas nous.
2. **Un gabarit de dépannage et un gabarit de rénovation n'ont pas les mêmes
   blocs OBLIGATOIRES**, et un devis signé chez le client n'est pas un devis
   enrichi — c'est un contrat. **Le design suit le cas d'usage, il ne le précède
   pas.**
3. **Le pied du devis est un TABLEAU par taux** (§3.5). Une maquette qui ne
   réserve la place que pour un seul taux serait inutilisable dès qu'un gros
   équipement entre. On ne peut pas dessiner avant de savoir ce qu'il faut
   placer.

### Et ce qui les rend SÛRS — un contrôle de TEXTE, pas de géométrie

> `verifier-devis` **rend les cinq modèles sur le MÊME devis, extrait le texte des
> cinq PDF, et exige qu'il soit IDENTIQUE.** Un modèle qui cache une mention
> devient **impossible**, pas seulement déconseillé. Et le test se fait **sur les
> deux gabarits de contenu** (`etablissement` et `hors_etablissement`), pas
> seulement en comparant les cinq thèmes entre eux — sinon un bloc absent du
> gabarit `etablissement` ne fait rougir personne.

**Et il s'y ajoute la liste blanche CSS du §3.11**, appliquée aux cinq feuilles :
un habillage qui poserait un `position: fixed`, un `break-*` dans une seule
syntaxe, ou une grille sur le tableau de lignes est refusé — **avant** d'être vu
sur un téléphone.

> **Ce que ce contrôle ne compare PLUS, et c'était une erreur du brouillon : le
> NOMBRE DE PAGES entre modèles.** Il annonçait « un habillage qui ferait passer
> un devis de 2 à 4 pages est un habillage qui coûte du papier ». C'est vrai, et
> **ce n'est pas mesurable ici** : `page.pdf()` de Chromium n'est pas WKWebView.
> Un habillage pourrait tenir en 2 pages chez Chromium et en 4 sur un iPhone, et
> le contrôle resterait vert. Un contrôle vert pour la mauvaise raison est pire
> que pas de contrôle — c'est la leçon de `pagingEnabled` du 04/10.
>
> **Donc la géométrie se juge UNE FOIS, par le propriétaire, sur son iPhone**, et
> les quatre questions à lui poser sont écrites au §3.11. Le nombre de pages par
> modèle peut être **relevé et noté** ici, à titre indicatif, à condition de
> l'écrire comme ça et de ne pas en faire un refus.

Éprouvé **en cassant ce qu'il surveille** : on retire une mention d'un seul
modèle, il doit rougir. Et on retire une entrée de `MENTIONS_OBLIGATOIRES` : le
**compte** du §3.10 doit rougir aussi.

**Ne se vérifie pas ici** : le rendu par WKWebView, la pagination réelle, et le
document **imprimé sur du papier** — y compris la bande de chantier, qui devient
une image rastérisée.

> **Et un lot avant celui-ci, il aura déjà UN devis qui part pour de bon** — un
> document qu'il peut envoyer, pas une maquette. Il n'attend pas six lots pour
> voir son logo sur un papier.

---

## 6. CE QU'ON NE FAIT PAS MAINTENANT

| ce qu'on ne fait pas | pourquoi | quel lot s'en chargera |
|---|---|---|
| **La Visite intelligente** | son propre document l'interdit : « NE COMMENCE PAS PAR CODER […] ATTENDRE VALIDATION DU PLAN » (§22). Un audit et un plan passent d'abord | son propre module, après son propre plan |
| **`visite_id`, une table `visites`, tout QR** | le §19 n'exige pas des colonnes, il exige qu'aucune visite ne soit NÉCESSAIRE. Une colonne que rien n'écrit est le « bouton §18 » | le lot Visite, par migration additive (`'visite'` ajouté à la contrainte, et la colonne née avec l'écran qui la lit) |
| **`nature` (quatre valeurs, dont `gros_equipement`)** | **retirée avant d'être livrée** : son seul lecteur annoncé était l'agent, que ce module exclut. L'artisan remplirait un champ par ligne pour personne (§3.12) | le lot qui la LIT — ou jamais, si une valeur de plus dans `taux_justification` suffit |
| **L'affichage PUBLIC du taux horaire et des frais de déplacement** | l'arrêté du 24/01/2017, art. 3, le demande sur « tout espace de communication en ligne dédié au professionnel », et une fiche pro en est un. **Mais c'est une décision avant d'être un développement**, et elle appartient au propriétaire | le **lot 6 conditionnel**, si la question 6 reçoit « oui » |
| **L'agent qui RÉDIGE un devis** | il n'existe **aucune source de prix** dans Opus, et le §11 du cahier Visite interdit nommément d'inventer un prix ou un taux. L'agent ne pourrait proposer que des désignations. **À dire au propriétaire : « l'agent me fait mon devis » veut dire « avec les prix » dans sa tête** | module 7 (dépenses et historique des prix) |
| **Une table `ouvrages` / un catalogue de prix** | une table de prix sans historique ni taux par défaut est une table qu'on remplit à la main pour rien. Remplacée au lot 1 par la relecture de ses propres `devis_lignes` | module 7 |
| **Les sept réglages de permission du §4** | six des sept actions n'existent pas. Et de toute façon **PRÉPARER et ENVOYER se séparent** : la préparation pourra un jour être réglable, **l'envoi jamais** — le cahier Visite le dit trois fois | le lot de l'action concernée, « chaque permission naît AVEC l'action qu'elle gouverne » |
| **Toute NOTIFICATION de devis** | mesuré : **1 client sur 1 n'a pas de compte Opus**, il n'y a personne à prévenir. Conséquence heureuse : la collision avec `notifications.devis_id`, `CIBLE_ATTENDUE.devis` et le type `'devis'` reste **dormante** | le jour où un devis notifiera quelqu'un, c'est-à-dire quand `ClientLink` existera |
| **Le pré-lot de renommage de `quote_requests`** | il toucherait `notifications`, `api.js`, `OpusApp.js` et `notifications.js` **pour n'ajouter aucun lecteur** : du travail qui ne change rien à l'écran | jamais, sauf si la collision se réveille. Seule la clé `'devis'` de `mes_donnees()` est renommée `'demandes_de_devis_recues'`, dans la fonction qu'on réécrit de toute façon |
| **La signature électronique** | une signature **qualifiée** suppose un prestataire de confiance de la liste de l'ANSSI, une vérification d'identité et un certificat : **un contrat et un budget, pas une ligne de code** | une décision du propriétaire, jamais un lot technique |
| **L'empreinte SHA-256 du PDF** | sans fichier conservé il n'y a rien d'utile à empreinter, et l'arrêté du 22/03/2017 **n'impose pas SHA-256** — il ne vise que les factures nées sur papier | avec la facture, si la conservation l'exige |
| **La dispense de certification sous 1 000 € TTC** | elle **allège sans supprimer** — quatre mentions restent dues —, et le seuil est circulaire. Imprimer la mention dans tous les cas est **strictement plus sûr** : elle ne gêne personne, son absence coûte le complément de taxe | personne, sauf demande explicite |
| **L'exclusion de rétractation pour la construction neuve** | « transformation importante » n'est pas définie par le texte, et se tromper ferait tomber le contrat dans les **douze mois** de L. 221-20. Et ce ne peut pas être un interrupteur qu'un artisan actionne | une demande expresse, documentée, jamais une déduction |
| **Les critères techniques du 5,5 %** | ils ne se vérifient pas par un programme, deux arrêtés les ont changés en dix-huit mois, et **la certification du client ne les couvre pas** | personne. On trace `taux_justification`, on ne vérifie pas |
| **Un contrôle de continuité des numéros de devis** | la continuité n'est exigée **que de la facture**. Un tel contrôle conduirait à refuser la suppression d'un brouillon « pour ne pas faire de trou » | la table `factures`, qui aura sa propre séquence et son propre régime |
| **Une colonne `date_redaction` séparée** | `remis_le` porte déjà ce fait, et une seconde écriture peut en diverger sans que personne ne sache arbitrer (§2.0) | personne |
| **Une contrainte de format sur `professional_profiles.siret`** | mesuré : `updateProfile` envoie `siret` depuis un champ **libre** à chaque enregistrement du profil (api.js:2015). Après la contrainte, 13 chiffres ou « en cours d'immatriculation » feraient échouer **tout** l'enregistrement — ville, bio, téléphone, horaires — avec la piste FAUSSE « schema.sql n'a pas été rejoué ». **Et pour un bénéfice nul** : le devis lit `emetteur.siret`, obligatoire et contraint | son propre lot, avec l'écran qui valide AVANT d'envoyer |
| **Le mode hors-ligne / une file d'attente** | la parade est la sauvegarde **ligne par ligne** du lot 1, qui fait échouer au premier geste plutôt qu'au dixième. Limite nommée : une application tuée en cours de saisie perd la ligne en cours, comme tous les formulaires d'Opus | le jour où il le signale, et pas avant |
| **La retenue de garantie, les situations de travaux, la révision de prix** | **zéro occurrence dans les deux cahiers.** La règle du projet est formelle : « ne jamais déduire qu'une fonctionnalité absente du document est abandonnée — demander » | à poser au propriétaire (question 4). Ce sont des pratiques de marchés plus gros, et la question viendra avec le §18 |
| **Un troisième journal d'audit** | le projet en a deux. Le minimum honnête pour le §21 n'est pas une table de plus, c'est qu'**un devis remis ne se récrive plus en silence** — ce que le figeage fait, avec un message | le §21, s'il demande plus |

---

## 7. LES PIÈGES DE CE MODULE — la liste de régression

Chacun a été payé dans ce projet, et la date le dit.

### Base et SQL

| piège | payé le | ce qu'il impose ici |
|---|---|---|
| **UN `before update or delete` QUI REND `new` INVERSE LA RÈGLE SUR LE DELETE** | **mesuré le 12/10**, sur le motif que le brouillon de ce plan proposait | `NEW` est **nul** en DELETE ; `jsonb_populate_record(NULL, …)` rend un enregistrement **non nul** (donc un devis remis PART) ; et un `before delete` qui rend `NULL` **annule la ligne en silence** (donc un brouillon RESTE). **Branche `TG_OP`, `return old` en DELETE** (§3.3) |
| **Un essai de suppression ne guette pas une erreur, il COMPTE LES LIGNES** | **mesuré le 12/10** | le cas « brouillon silencieusement annulé » ne lève **rien du tout**. `count(*)` avant et après **chaque** suppression, y compris celles qui doivent réussir |
| **Le mode démo masque TOUTES les erreurs de base** | la panne `montage` | toute écriture **insérée pour de vrai** dans PostgreSQL avant d'être annoncée. Et un `initialDevis` qui FAIT VIVRE le mécanisme |
| **L'application en avance sur la base** | six commits contre une base ignorant `metiers` ; le fil muet une heure le 05/10 | on applique la migration soi-même, on vérifie l'état RÉEL par le connecteur, et **un lot dont la moitié base n'est pas appliquée n'est pas fini** |
| **`check (… in (…))`** : toute valeur nouvelle demande de **refaire** la contrainte | `montage`, 02/10 | les statuts se refont au lot 2 puis au lot 4. `add column if not exists` n'y touche pas, et **renommer une contrainte ne la désactive pas** (27) |
| **TOUTES les contraintes se terminent par `_check`** | 11/10, section 41 | **et c'est pire ici** : mesuré, la DEUXIÈME contrainte anonyme multi-colonnes s'appelle `…_check1`, que le motif de `erreurs.js:106` **ne rend pas**. **Aucune contrainte anonyme sur aucune table du module**, et le motif passe à `_check\d*` (§3.14) |
| **Une contrainte `check` ne peut pas appeler une fonction non `IMMUTABLE`** | **non mesuré — à ÉPROUVER au lot 4** | la borne haute de `signe_le` (`<= current_date`) pourrait être refusée. Si oui, elle va dans le déclencheur (§3.9) |
| **`for all`, c'est QUATRE portes** | 05/10 (badge à l'INSERT), 05/10 (fiche pro supprimable), 11/10 (ligne `users` supprimable) | les quatre portes tranchées séparément, et le gel par **déclencheur** : « une politique rend 0 ligne sans un mot, un déclencheur DIT pourquoi » |
| **Une règle RLS filtre des LIGNES, jamais des COLONNES** | 29/09 (`users.email`), 07/10 (le brouillon du récit hors de `chantiers`) | **aucune colonne de devis sur `professional_profiles`** (45/45 lisibles par `anon`) ni sur `chantiers`. **Et c'est pourquoi la question 6 est un déménagement, pas un réglage** |
| **Une table sans politique de LECTURE rend une liste vide, sans erreur** | la famille du lot H | `devis_tva` n'a aucune politique d'écriture **et doit en avoir une de lecture**, sinon l'export RGPD est amputé en silence (§3.5) |
| **`auth.uid()` n'est PAS nul dans une fonction `security definer`** | 03/10, section 25 | le verrou porte sur `old.statut` et `TG_OP`, **jamais** sur `auth.uid()` |
| **Le discriminant de CASCADE** | 05/10, section 31 | sans lui, **tout artisan ayant remis un devis ne peut plus supprimer son compte** |
| **`using errcode = '…'` : OP001 et OP002 sont des SQLSTATE** | vérifié (schema.sql:3026, 6450 ; `OpusApp.js:1081` lit `e.code`) | `OP003` se lève avec `errcode = 'OP003'`, **pas** `check_violation` — sinon le refus devient un 23514 et `erreurs.js` lui colle la piste FAUSSE |
| **Un corps plpgsql n'est pas analysé à sa création** | 07/10, section 40 | **le déclencheur du devis vit AVEC ses colonnes**, jamais greffé sur `tient_le_profil_pro()` ni sur `tient_le_client()` |
| **Un bloc `do` n'est analysé qu'à l'EXÉCUTION** | 07/10, le `min(uuid)` de la section 37 | tout rattrapage s'éprouve sur un jeu contenant de **VRAIES lignes**, pas sur une base vide |
| **Un essai de RLS dans un bloc `do` ne prouve RIEN** | 01/10 | `set local role` puis l'ordre, **chacun dans son propre appel** |
| **Un essai SANS JETON n'éprouve pas un verrou** | 06/10, lot E, essai 10 | le figeage s'éprouve avec `set local request.jwt.claim.sub` |
| **Un essai de sécurité doit prouver que la donnée EXISTE** | 04/10, section 29 | le cas « un autre pro ne lit rien » est encadré par deux cas qui lisent |
| **Le connecteur refuse tout ordre qui COMMENCE par `drop` ou `delete`** | 03/10, mesuré textuellement | `create or replace trigger` ; les politiques créées **sous condition** dans un `do` ; `alter policy` ; `alter table … drop constraint if exists` (qui passe, le `drop` est au milieu). **Et on n'essaie pas de contourner** |
| **Une fonction appelée par l'application ne change JAMAIS de signature** | 05/10, section 34 | `preparer_remise_devis(uuid)` et `confirmer_remise_devis(uuid,text,bigint,int)` sont **définitives**. Toute évolution passe par les colonnes |
| **Une politique, une fonction, une règle ne s'écrit qu'à UN endroit** | 04/10 (section 30), 05/10 (`cree_fiche_utilisateur`) | **11 politiques et 1 fonction sont encore créées deux fois** (tâche #40 en attente). On n'en ajoute pas une treizième |
| **`mes_donnees()` est la DERNIÈRE fonction du fichier, et la MIGRATION doit l'emporter** | 07/10, lot H — l'export de l'art. 15 incomplet une nuit, sans erreur | la section s'insère **entre 7692 et 7693**. **QUATRE clés nouvelles**, pas trois (§3.13) |
| **Le balayage de la section 43 doit rester le DERNIER bloc** | 11/10 | **bénéfice gratuit** : tous les déclencheurs du module sont révoqués automatiquement — mais seulement s'ils naissent avant lui. Posés après, ils rouvrent la catégorie « appelable sans compte », aujourd'hui à **zéro** |
| **`revoke` doit viser PUBLIC, `anon` ET `authenticated`** | 07/10, lot H | et une fonction qui rend `void` **échappe au balayage** : `recalcule_devis(uuid)` a besoin de son `revoke` explicite, comme `recalcule_chantier(uuid)` |
| **Toute fonction appelée par une policy ou une contrainte garde son `execute`** | 30/09, la panne `horaires_valides` | `emetteur_incomplet()` est appelée par PostgREST **et** par un déclencheur : la révoquer « par prudence » bloquerait **toute** remise de devis |
| **Un montant ne se tient pas par incrément** | les trois familles de compteur du projet | **RECALCUL complet**, et le rattrapage **sans `greatest`** |
| **`numeric` arrive en JS comme un flottant** / **`numeric(10,2)` déborde en 22003** | mesuré sur la vraie base | **centimes entiers**, et la rupture avec `annonces_pro.prix` **commentée** dans `schema.sql` |
| **`idx_devis_pro` existe DÉJÀ sur `quote_requests`** (schema.sql:4113) | vérifié | `idx_devis_emis_pro`. Un `create index if not exists` du même nom ne créerait **rien** et PostgreSQL ne dirait **rien** |
| **La politique « lecture mes devis » existe déjà** (1084) | vérifié | « mes devis emis ». Plus un commentaire en tête de section qui DIT que `quote_requests` est une demande et `devis` un document |

### Application, contrôles et écrans

| piège | payé le | ce qu'il impose ici |
|---|---|---|
| **Un contrôle satisfait par sa propre documentation ne garde rien** | 11/10, `verifier-legal` | la liste des mentions s'écrit depuis le **dossier**, le contrôle porte un **COMPTE** écrit en dur, et un **DRAPEAU humain** (`MENTIONS_RELUES_PAR`) que `verifier-legal` réclame avant de quitter `'essai'` (§3.10) |
| **Un contrôle mesuré sur le mauvais moteur est vert pour la mauvaise raison** | 04/10, `pagingEnabled` | la pagination devient une **propriété** (liste blanche CSS), pas une géométrie. **La géométrie se juge sur l'iPhone, une fois** (§3.11) |
| **`printToFileAsync` au web ouvre une boîte MODALE et rend `undefined`** | mesuré dans la tarball publiée, `ExponentPrint.web.ts:13-14` | une branche `Platform.OS === 'web'` **qui n'appelle rien**, sinon la commande qui prouve le démarrage est bloquée (§3.6) |
| **`http://localhost` EST un contexte sécurisé** | mesuré : `secureContext: true`, `navigator.share: undefined` | ce qui bloque `expo-sharing` ici n'est **pas** HTTPS. Ne pas chercher à servir en HTTPS : il n'y a pas de `navigator.share` dans un Chromium sans tête (§3.6) |
| **Une `const` lue avant sa déclaration = écran blanc, et rien ne le signale** | 04/10 (voyants), 04/10 (demandes) | les fonctions `devis*` **après `src/lib/api.js:1102`** (`const noop`, vérifié) |
| **Le piège Metro : asynchrone + ternaire** | la panne de construction sans ligne ni cause | **deux fonctions NOMMÉES** et le choix à la fin, comme le bloc clients |
| **`verifier-imports` refuse un paquet absent de `package.json`** | 11/10, `lucide-react-native` inventé | `npx expo install expo-print expo-sharing`, puis `--check`. `expo-asset` est dans `node_modules` et **pas** dans `package.json` |
| **`npx expo export` peut rendre 0 EN ÉCHOUANT** | 11/10 | on **LIT sa sortie** : « Exported », aucune « Import stack », `dist/` produit |
| **Un export qui passe ne prouve pas qu'une application démarre** | 05/10 | `npx expo start --web` et un navigateur. **C'est le seul qui a trouvé le `noop`** — et c'est pour lui qu'on ne peut pas laisser une boîte d'impression s'ouvrir |
| **Les quatre cliquets d'échelles sont à ZÉRO de marge** | mesuré : 18/18, 354/354, 56/56, 21/21 | **un seul `fontSize: 15` ou `padding: 6` fait ÉCHOUER le lot.** Tout par `T`, `interligne()`, `S`, `R`, `TOUCHE`, `viser()` dès le premier jet, et les plafonds redescendus dans le même commit |
| **`surFond()` pour ce dont le fond vient des DONNÉES** | 02/10, et `verifier-cibles` le réclame | la pastille de statut d'un devis (§3.9). Le brouillon n'en parlait pas |
| **Deux orthographes pour une seule notion se contredisent** | `GENRES_DEMANDE`, api.js:1824-1831 (`sos` porte `acceptee`/`refusee`) | le devis prend `accepte`/`refuse`, et `verifier-devis` **refuse les formes accordées** dans tout le module (§3.9) |
| **`verifier-atelier` a UNE place** | 32/33 | le calcul des totaux est **PUR, hors de React** : un `useEffect` qui recalculerait produirait une alerte `exhaustive-deps` |
| **`{...CLAVIER}` et JAMAIS un `KeyboardAvoidingView` par-dessus** | 11/10 | l'inset serait compté **deux fois**. Formulaire **plein écran, croix en HAUT** — jamais une feuille collée en bas (le « je suis bloqué » du 04/10) |
| **Un clavier `decimal-pad` d'iOS n'a PAS de touche retour** | 11/10 | **aucun `returnKeyType` sur les champs de montant** : la touche mentirait |
| **`minHeight: TOUCHE`, jamais `paddingVertical`** | 06/10 | React Native aplatit par PRÉCISION : la forme longue l'emporterait sur le `padding: 0` de la carte |
| **`hitSlop` est ignoré par `react-native-web`** | lot I (`BtnMini`), 11/10 (`PillToggle`) | une marge de visée **ne se vérifie pas ici** — ça se dit |
| **Une FlatList monte DIX éléments d'un coup** | 29/09 | les trois réglages sur la liste des devis **et** sur les lignes d'un devis |
| **Un champ de saisie ne re-rend que LUI** | 29/09, 02/10 (203 ms/lettre) | `ChampLocal` sur chaque champ de ligne, avec son `lire()` |
| **`React.memo` ne sert à rien si on lui passe des fonctions** | lot 4 | la carte reçoit le RÉSULTAT (`estBrouillon`, `montantLisible`), pas des prédicats |
| **Une `key` sur un formulaire rendu hors de l'écran** | lot I, le champ VIDE | sans elle, ouvrir un second devis affiche le premier |
| **UNE SEULE porte pour ranger un devis dans la liste** | 04/10, les voyants | comme `rangerClient` |
| **Deux façons d'arriver au même écran font le MÊME travail** | 04/10 (`changerOngletDecouvrir`), 07/10 (le panneau vide) | et **une clé d'onglet inventée ne lève RIEN** : deux écrans à brancher font **huit** points dans `OpusApp` (`showBack`, `backTitle`, retour vers `'profil'`, rendu) |
| **`===` entre un nombre et une chaîne** | **trois fois** dans le seul lot Chantier | `Object.keys(pros)[0]` rend une chaîne, la démo porte des nombres. **Le contrôle REFAIT le calcul sur les données de démonstration** |
| **Un échec ne s'affiche jamais en vert**, et les messages disent quoi faire | 01/10 | `erreurs.js` gagne son **dictionnaire par contrainte**, ses trois branches manquantes, `23505` reformulé et `OP003` lu par son code — **au lot 0, pas au lot 2** (§3.14) |
| **Un travail qui n'a pas pu se faire ne doit jamais ressembler à un travail fait** | 01/10 (« X est prévenu »), 04/10 (`retires: 0`), 05/10 (« Pour moi ») | un PDF de **0 page est un fichier valide** : on compte les pages et les octets, **et on les affiche**. Et un échec de lecture n'affiche **jamais** « Aucun devis » |
| **Chercher qui LIT, et qui ÉCRIT** | 01/10 (trois tables jamais relues), 04/10 (`annonces_pro.medias`) | les deux listes faites **avant** d'écrire une ligne de SQL. **Ce brouillon s'est fait prendre dans les deux sens** : quatre mentions lues sans écrivain, trois colonnes écrites sans lecteur |
| **Une fonction que personne n'appelle est le « bouton §18 »** | 27.4, 04/10 (`versISO`) | pas de `visite_id`, pas de `compte_id`, pas de `nature`, pas de sept réglages, pas de table de prix, pas de `date_redaction` |
| **Un calcul pur vit dans un fichier qui n'importe RIEN** | onze applications depuis `cloudinary-adresses.js` | `devis.js`, `devis-html.js`, `devis-delais.js`, `mentions-devis.js`. **Et c'est la plus nécessaire de toutes : un total faux ne lève aucune erreur et part chez un client** |
| **`ESPACES` est écrit en dur** (compte/index.ts:46, vérifié) | 04/10, le trou RGPD des pièces jointes | `'devis'` et `'logos'` y entrent **dans le lot qui les crée**, sinon la suppression de compte répond « retires: 0 » **sans erreur** |
| **`ESPACES_PRIVES` vaut `['documents','pieces-jointes']`** (storage.js:77, vérifié) | — | sans `'devis'`, `envoyerFichier` rend une **adresse publique** pour un fichier privé, et elle se range en base comme si elle marchait |
| **`adresseTemporaire()` est codée en dur sur `documents`** (storage.js:217) | — | elle ne sait pas signer dans `devis` |
| **Un contrôle qui vise une PLACE, un RANG ou une SYNTAXE** | dix fois au vert sans rien éprouver, trois fois en accusant du code juste | `verifier-devis` vise des **PROPRIÉTÉS**, retire les commentaires d'abord (`--`, `//`, `{/* */}`), **et s'éprouve en cassant ce qu'il surveille — en vérifiant que le sabotage a bien été POSÉ** |
| **Un contrôle qui PLANTE ne vérifie rien**, sans écrire un seul « ✘ » | 02/10 (`verifier-montage`), 07/10 (`verifier-notifications`) | `npm run verifier` lit les **codes de sortie** |
| **`calcule_client_verifie()` : ON N'Y TOUCHE PAS** | vérifié avant de concevoir | elle compare des **COMPTES** ; le destinataire d'un devis n'en a pas. « Unifier les deux acceptations » abîmerait un mécanisme d'avis qui fonctionne |
| **Le carnet : `for all` autorise le DELETE** | 11/10, section 41, jugé juste « PARCE QUE rien ne le référence encore » | **ce module change cela.** L'écran du carnet doit DIRE qu'un client a des devis et proposer **l'archivage**, qui est le chemin que `clients.archive` annonçait depuis le 11/10 |
| **La durée de conservation dans `legal.js`** | — | la section « Les clients que vous enregistrez » **s'étend** au devis plutôt qu'une seconde section. Et **jamais « 6 ans »** : dix ans pour les factures, et pour un devis non accepté une durée CHOISIE (question 5) |
| **Ce qui ne se vérifie pas ici doit être DIT** | depuis le début, et redit le 11/10 | le PDF réel, WKWebView, la pagination, la feuille de partage, l'impression, le clavier, le pouce sur une ligne. **On le DEMANDE** |

---

## 8. CE QU'IL FAUT DEMANDER AU PROPRIÉTAIRE AVANT DE COMMENCER

Sept questions, et seulement celles dont la réponse change le travail. Chacune a
un **comportement par défaut** : si la réponse ne vient pas, on construit quand
même, dans le sens le moins coûteux à corriger — et on l'écrit.

### 1. Votre régime de TVA : franchise en base, ou réel ? Et depuis quand ?

**Pourquoi ça change le travail.** C'est elle qui décide si le lot 3 (la TVA
complète) doit remonter **avant** le lot 2 (le document). Si vous êtes en
franchise, votre devis est conforme **sans un seul taux** — on livre un document
juste au lot 2 et la TVA attend. Si vous êtes au réel, le document ne peut pas
sortir sans elle. Opus ne peut pas le calculer : votre chiffre d'affaires n'est
pas dans Opus, et un voyant faux sur un seuil fiscal est pire que pas de voyant.

**À défaut de réponse.** On ne suppose **rien** : la colonne reste vide, un état
« non déclaré » existe, et la remise refuse tant que vous n'avez pas répondu. On
construit dans l'ordre prévu, franchise d'abord — c'est votre cas aujourd'hui,
puisque vous n'avez pas de SIRET.

> **Et c'est elle, et elle seule, qui justifie l'ordre des lots 2 et 3.** Le
> brouillon s'appuyait aussi sur « les 5 autres fiches à SIRET sont de
> démonstration » : **ce n'est pas mesuré**, et ça ne le sera pas — ce sont des
> comptes que je n'ai pas à ouvrir.

### 2. Avez-vous une attestation d'assurance décennale ? Et si elle manque, le devis doit-il être REFUSÉ ou juste signalé ?

**Pourquoi ça change le travail.** Mesuré : **0 fiche sur 7 n'en porte une**, et
**4 déclarent déjà une date d'expiration** d'une attestation qui n'existe pas.
La loi dit qu'elle est **jointe** au devis — pas qu'on écrit une phrase. Refuser
la remise sans elle, c'est empêcher d'émettre un devis ; l'autoriser avec un
avertissement, c'est laisser partir un document incomplet. Les deux écrans sont
différents, et c'est votre responsabilité d'artisan qui est en jeu.

**À défaut de réponse.** On **refuse**, et le message dit pourquoi — « un travail
qui n'a pas pu se faire ne doit jamais ressembler à un travail fait ». Mais on
laisse une sortie explicite : un bouton « Émettre sans l'attestation » qui
affiche ce que ça implique, et qui trace ce choix. C'est le motif de la case non
pré-cochée : une action qui vous expose ne doit pas se produire par accident.

### 3. Êtes-vous adhérent à un organisme de médiation de la consommation ?

**Pourquoi ça change le travail.** C'est une information obligatoire sur le
devis (nom, adresse, **et adresse du site**), et son omission est sanctionnée.
Mais ce n'est pas une information à trouver : **il faut y adhérer**, c'est un
abonnement payant. Si vous n'y êtes pas, `emetteur_incomplet()` comptera ce
champ comme manquant et le dira sur chaque devis — et il faut que vous sachiez
pourquoi avant de le voir.

**À défaut de réponse.** Les trois champs sont optionnels en base (rien n'est
`not null`), `emetteur_incomplet()` les compte comme manquants, et l'écran
explique en français que c'est une adhésion à prendre. On ne bloque pas la
remise sur ce point : la sanction est au palier 5, la plus basse du dossier.

### 4. Avez-vous besoin de retenue de garantie, de situations de travaux ou de révision de prix ?

**Pourquoi ça change le travail.** **Zéro occurrence dans les deux cahiers des
charges** — ce ne sont donc ni des exigences ni des abandons, et la règle du
projet est de demander plutôt que de déduire (vous l'avez tranchée le 29/09 pour
le côté particulier). Ce sont des pratiques de marchés plus gros qu'un chantier
de particulier ; si vous en avez besoin, ce sont des colonnes et un pied de
devis différents, et il vaut mieux le savoir avant de figer la table.

**À défaut de réponse.** On ne les construit pas, **et on ne les écarte pas
définitivement** : c'est écrit dans le commentaire de la section, pour que
personne ne redécouvre la question. Elle reviendra avec la sous-traitance du §18.

### 5. Combien de temps garde-t-on un devis que le client n'a jamais accepté ?

**Pourquoi ça change le travail.** Un devis **accepté** est un contrat, et une
facture se conserve dix ans. Un devis **non accepté** n'est pas un contrat, et
**aucun texte ne fixe sa durée de conservation** : c'est donc le RGPD qui
commande — une durée **choisie**, écrite dans la politique de confidentialité, et
tenue. La réponse change une colonne, un travail de nettoyage, et un paragraphe
légal que je ne peux pas inventer à votre place.

**À défaut de réponse.** On garde tant que le compte existe, le devis part avec
le compte (cascade), et on l'écrit tel quel dans la politique de
confidentialité : « vos devis sont conservés aussi longtemps que votre compte, et
supprimés avec lui ». C'est vrai, c'est tenu par la base, et ça se change plus
tard sans toucher au modèle.

### 6. Acceptez-vous que votre taux horaire et vos frais de déplacement s'affichent PUBLIQUEMENT sur votre fiche Opus ?

**C'est la question que le brouillon ne posait pas**, et c'est la seule des sept
qui **change une TABLE**.

**Pourquoi ça change le travail.** L'arrêté du 24 janvier 2017, **art. 3**, veut
le taux horaire et les frais de déplacement « aisément accessibles sur **tout
espace de communication en ligne dédié au professionnel** » — et une fiche pro
Opus en est un. Le dossier juridique le dit en propres termes : « c'est une
obligation qu'Opus **ne tient pas** aujourd'hui… mais c'est **sa décision** avant
d'être un développement. »

Or ce plan range ces deux informations dans `emetteur`, qu'il rend **privée**
(`revoke all … from anon`, une politique par `est_mon_entreprise()`). C'est juste
pour votre adresse — c'est votre domicile, et c'est la règle de la carte du
30/09, « une carte qu'on peut agrandir finit par montrer la rue ». **C'est
l'inverse de ce que l'art. 3 demande pour les tarifs.**

> **Le plan appliquait donc une seule règle de confidentialité à vingt colonnes
> de natures très différentes** — et répondait à la question par défaut, dans le
> sens qui vous laisse en infraction. Ce n'est pas acceptable sans vous le
> demander.

Et ce n'est pas un réglage à ouvrir : **une règle RLS filtre des LIGNES, jamais
des COLONNES.** Si la réponse est « oui », les deux ou trois colonnes de tarif
doivent **déménager** — vers `professional_profiles`, déjà publique, ou vers une
petite table publique dédiée. **Posée maintenant, la question ne coûte rien.
Posée après le lot 0, elle veut dire scinder une table dont tout l'argument de
conception est qu'elle est privée** ; posée après le lot 2, il y a en plus du
code à cinq endroits et des devis figés qui pointent l'ancienne colonne.

**À défaut de réponse.** On **ne publie rien** : `emetteur` reste privée en
entier, et **le §6 gagne sa ligne** — « l'affichage public des tarifs n'est pas
tenu, c'est une décision du propriétaire », avec le fondement, pour que personne
ne redécouvre la question dans six mois en croyant à un oubli. C'est le choix le
plus prudent côté vie privée et **le moins prudent côté conformité** : il faut le
dire comme ça.

### 7. Quand vous faites signer un devis, ça se passe où — chez le client, ou chez vous ?

**Pourquoi ça change le travail.** Le plan met `lieu_conclusion` à
`hors_etablissement` par défaut, et pour une bonne raison juridique : un devis
signé sur un téléphone pendant une visite **est** un contrat hors établissement,
c'est le seul des deux cas dont le manquement soit pénal, et c'est ce qui ouvre
les quatorze jours de rétractation et l'interdiction de tout paiement avant J+7.
**Mais c'est une déduction sur votre pratique, pas une mesure.**

Si vous faites signer à l'atelier, le hors-établissement devient votre cas rare :
la moitié la plus chère du lot 2 (formulaire de rétractation, exemplaire daté et
signé, blocage de sept jours) est toujours nécessaire, mais le **défaut** du champ
est faux — et un défaut faux imprime un bloc nuisible sur la majorité de vos
devis : annoncer quatorze jours à qui n'y a pas droit est une fausse information.

**Et c'est elle qui décide si le lot 2 ou le lot 3 passe d'abord**, avec la
question 1 : si votre quotidien est l'atelier et votre régime la franchise, le
document est moins urgent que la TVA ; si c'est chez le client, l'inverse.

**À défaut de réponse.** On garde `hors_etablissement` par défaut — c'est le cas
le plus exigeant, donc celui qui ne vous expose pas — **et le devis pose la
question, par devis, jamais en réglage global.** Trois raisons : la Visite, quand
elle existera, multipliera le cas hors établissement ; `clients.type` ne suffit
pas à décider (L. 221-3 pose trois conditions cumulatives dont Opus ne connaît
pas deux) ; et un artisan fait les deux dans la même semaine.

---

## Et une chose qui n'est pas une question, mais qu'il faut lui dire

> **Vous pouvez CONSTRUIRE et ESSAYER tout ce module. Vous ne pouvez pas encore
> émettre un devis conforme** — vous n'avez ni SIRET ni assurance décennale,
> remesuré sur votre fiche. `STATUT = 'essai'` ne protège rien ici : **un devis
> engage son émetteur dès sa remise, même émis depuis une application fermée.**
>
> Donc aucun essai sur la vraie base ne produira un document qui ressemble à un
> vrai devis remis à un vrai client, et **les cinq modèles se jugeront sur un
> devis d'essai**. C'est dit maintenant, pas au moment de livrer.

Et la dernière vérification n'appartient pas à ce conteneur : **le clavier sous
le formulaire le plus long du projet, le pouce sur une ligne de devis à
390 points, la PAGINATION réelle, le PDF dans le visualiseur d'iOS et le document
imprimé sur du papier.** `react-native-web` ne rend aucun clavier et
`printToFileAsync` rend `undefined` au navigateur, en ouvrant une boîte de
dialogue. Ça se demandera, comme le 11/10 — pas se supposer.

---

## 9. CE QUI A CHANGÉ DEPUIS LE BROUILLON — les douze corrections

Le brouillon faisait 1697 lignes. Une critique de complétude l'a relu, a monté un
PostgreSQL 16.13 neuf, a lu les tarballs publiées d'`expo-print` et
d'`expo-sharing`, et a sondé le Chromium du projet. **Ce qu'elle n'a PAS réussi à
prendre en défaut**, et qu'il faut dire avant le reste : la numérotation sous
verrou consultatif, les centimes entiers, `devis_tva` et son arrondi unique,
l'élimination de la C1 par le discriminant de cascade, le refus de `visite_id` et
de `compte_id`, le choix `expo-print` / `expo-sharing`, et **toutes** les ancres
relevées dans le dépôt. Les deux affirmations les plus graves de la critique ont
ensuite été **remesurées** ici : les deux sont confirmées.

| | correction | où elle vit |
|---|---|---|
| **1** | **Le figeage était INVERSÉ** : le motif du brouillon laissait partir un devis remis et annulait silencieusement la suppression d'un brouillon. Remplacé par la parade à branche `TG_OP`, avec le mécanisme (`NEW` nul en DELETE, `jsonb_populate_record(NULL,…)` non nul, un `before delete` qui rend `NULL` annule la ligne), et la leçon de méthode : **un essai de suppression COMPTE LES LIGNES**. **Puis le même défaut une SECONDE fois, dans la correction de la première** — le test de cascade placé avant la branche `TG_OP` avale l'`update` d'un brouillon dont la fiche parente a disparu : mesuré le 12/10, corrigé, **six cas éprouvés**. Et `ligne_se_fige()` a reçu **son propre** discriminant, mesuré : le parent d'une ligne est le DEVIS, et pendant une cascade il a déjà disparu | **§3.3** en entier ; rappelé en tête du §7 et dans la vérification des lots 2 et 4 |
| **2** | **Les quatre mentions sans colonne** — garanties, frais de déplacement, délai d'exécution, date de rédaction — plus le SAV et les clauses de droit applicable et de juridiction. Chacune a sa colonne, sa place dans `emetteur_incomplet()` ou dans la contrainte de remise, et sa place dans l'instantané. La date de rédaction est **tranchée** : c'est `remis_le`, posé par la base avec `clock_timestamp()`, et `created_at` ne s'imprime jamais | **§2.0** (nouvelle section), §2.4, §3.4, lot 0, lot 2 |
| **3** | **Le contrôle qui se satisfaisait de sa propre liste.** `MENTIONS_OBLIGATOIRES` s'écrit depuis le dossier juridique, une entrée par mention avec sa citation et ses `cas` (en LISTE, pour que « les trois listes » soit une donnée) ; un **COMPTE** écrit en dur dans le contrôle ; et le drapeau humain `MENTIONS_RELUES_PAR` / `MENTIONS_RELUES_LE` que `verifier-legal` réclame avant que `STATUT` quitte `'essai'`, sur le modèle exact d'`EDITEUR.contratSousTraitance` | **§3.10** (nouvelle section), §5, §7 |
| **4** | **La moitié base du lot 2 était inatteignable.** (i) Une branche `Platform.OS === 'web'` qui **n'appelle rien** et dit « le PDF se fabrique sur le téléphone » — mesuré : l'implémentation web de `printToFileAsync` est `window.print()`, donc une boîte modale qui bloque Playwright. (ii) Le **protocole exécutable** en huit étapes : PDF par `page.pdf()`, téléversement en `curl` avec le jeton d'un compte jetable, les deux fonctions appelées par PostgREST. Tout se vérifie sauf WKWebView | **§3.6** et **§3.11** (nouvelles sections), lot 2 |
| **5** | **La pagination devient une PROPRIÉTÉ.** Les trois contrôles de géométrie du brouillon sont mesurés sur le mauvais moteur. Remplacés par une liste blanche CSS (refus de `position: fixed`, d'un `break-*` écrit dans une seule syntaxe, de flex/grid sur le tableau de lignes, des unités de fenêtre, d'un `@font-face` réseau). La géométrie se juge **une fois, sur l'iPhone**, sur 1 / 5 / 60 lignes et les deux gabarits, avec quatre questions écrites à l'avance | **§3.11**, et §5 (le nombre de pages n'est plus un refus) |
| **6** | **Les colonnes sans lecteur.** `nature` est **retirée** avant d'être livrée (son seul lecteur était l'agent, exclu du module). `taux_justification` est **gardée** avec un lecteur réel : la ligne du devis à l'écran, « 10 % — habitation de plus de 2 ans », qui rend un taux faux visible avant l'envoi. `pdf_pages` / `pdf_octets` reçoivent leur lecteur : « 2 pages · 27 Ko », qui est aussi le contrôle qu'une réimpression n'est pas tronquée | **§3.12** (nouvelle section), lot 2, lot 3, §6 |
| **7** | **QUATRE clés dans `mes_donnees()`**, pas trois : `emetteur`, `devis`, `devis_lignes`, **`devis_tva`** — une ligne de `devis_tva` est le montant du devis d'un client. Et un trou trouvé en l'écrivant : `mes_donnees()` est `security invoker`, donc **sans politique de LECTURE sur `devis_tva` l'export rendrait une liste vide, sans erreur** | **§3.13** (nouvelle section), §3.5, lot 1, §7 |
| **8** | **Le message qui envoie rejouer le schéma.** Un dictionnaire par contrainte dans `erreurs.js`, la piste « schema.sql n'a pas été rejoué » réservée aux contraintes inconnues, le motif corrigé en `_check\d*`, les trois branches absentes (23503, 22003, 23502), 23505 reformulé, et `OP003` lu par son **code** avant la branche `check`. **Et ça part au lot 0**, pas au lot 2 : c'est là que naît la première contrainte `check` du module | **§3.14** (nouvelle section), lot 0, lot 2, §7 |
| **9** | **Les quatre affirmations non mesurées.** `expo-sharing` : le mécanisme est corrigé — `http://localhost` **est** un contexte sécurisé (mesuré : `secureContext: true`), ce qui bloque est l'absence de `navigator.share`. « Une page A4 sur 390 points » : **retirée** comme argument d'élimination, et rangée dans ce qui se mesurerait si la question revient. « 2 s de CPU et 256 Mo » : retirée, l'argument structurel (un runtime Deno n'embarque aucun moteur de rendu) n'en a pas besoin. « Les 5 fiches sont de démonstration » : **retirée**, et l'ordre des lots repose désormais sur la question 1 | **§3.6**, §1, §4, lot 3, §8 question 1 |
| **10** | **La sixième question, qui change une table** : l'affichage public du taux horaire et des frais de déplacement (arrêté art. 3), avec son comportement par défaut et la ligne qu'elle ajoute au §6 si la réponse est « pas maintenant ». **Plus la septième** : où se fait la signature, qui décide de l'ordre des lots 2 et 3 et du défaut de `lieu_conclusion`. Et un **lot 6 conditionnel** qui n'existe que si la réponse est « oui » | **§8 questions 6 et 7**, §2.2, §3.1, lot 0, lot 6, §6 |
| **11** | **Les trois petits.** Les deux bornes de `signe_le` (`remis_le <= signe_le <= current_date`), avec le piège **non mesuré** à éprouver : `current_date` n'est pas `IMMUTABLE`, donc la borne haute pourrait aller dans le déclencheur. `surFond()` pour la pastille de statut, dont la couleur vient des données. Et **une seule orthographe de statut** — `accepte` / `refuse` —, `verifier-devis` refusant les formes accordées que `sos` porte déjà | **§3.9** (nouvelle section), lot 1, lot 4, §7 |
| **12** | **La taille et la lisibilité.** Un **§0 d'une page**, lisible en trois minutes : ce qui est décidé en six phrases, les six lots plus le conditionnel, les sept questions en une ligne chacune. Le détail suit. **Aucun raisonnement du brouillon n'a été supprimé** — ce projet a payé chaque règle qu'il écrit | **§0**, et la numérotation de §3 étendue à 3.14 |

### Ce que cette relecture n'a PAS corrigé, et pourquoi

- **Le piège `IMMUTABLE` de `current_date` dans une contrainte `check`** n'a pas
  été mesuré ici. Il est annoncé comme à éprouver au lot 4.
- **Le nombre exact d'entrées de `MENTIONS_OBLIGATOIRES`** n'est pas fixé : il se
  fixe en écrivant le fichier, depuis le dossier juridique, et il est écrit en
  dur dans le contrôle à ce moment-là. En annoncer un ici serait un chiffre
  inventé, et il entrerait dans un contrôle.
- **La nature des cinq autres fiches à SIRET** n'est pas mesurée et ne le sera
  pas : ce sont des comptes qu'il n'y a aucune raison d'ouvrir. L'argument qui en
  dépendait a été remplacé par la question 1.
- **Aucune clause légale n'est rédigée, et aucune mention n'est composée.**
  `garanties_texte`, `sav_texte`, `cgv_texte` et les deux clauses sont des champs
  que l'artisan écrit ; l'écran dit ce que la loi demande de couvrir et renvoie
  à la source. C'est la règle du 29/09, et elle ne se négocie pas : une mention
  légale fausse engage celui qui la publie.

---

## 10. MISE À JOUR DU 17/10/2026 — ce qui a bougé depuis le 12/10

Ce plan a été écrit le 12/10 (dernier commit : 09:29), **avant** les sections 44 (15/10), 45 et 45.3 bis (17/10) de `schema.sql`. Quatre choses ont bougé depuis :

- le SIRET demandé à l'inscription a construit la moitié de ce que le lot 0 croyait devoir créer (10.1). Et depuis le commit bd8b47c (section 45.3 bis), la réserve d'un SIREN retiré par l'administration vit dans `sirens_reserves` et **survit à la suppression du compte** ;
- un compte pro portant un vrai SIRET a été ouvert, et **l'entreprise est celle du FRÈRE du propriétaire** : « la page est une entreprise de mon frère, on pourra tester avec » (10.5) ;
- le propriétaire a remis ses propres devis (`docs/DEVIS-DU-PROPRIETAIRE.md`) et tranché l'usage des données des artisans (`docs/DONNEES-DES-ARTISANS.md`). Les deux sont commités et **font foi** ; ce qu'ils changent au plan est en 10.6 ;
- six sujets de droit ont été recherchés, **puis contredits** par une seconde lecture indépendante ; la synthèse a ensuite été relue par une critique, puis par une contre-vérification. À chaque étape, quand la relecture a donné tort, c'est sa correction qui est retenue ici.

> **Cette section ne récrit pas les §0 à §9. Là où elle les contredit, c'est elle qui fait foi : elle est datée après.** Les lignes à corriger le jour où le plan sera reposé sont listées en 10.9.

Méthode, et sa limite :

- relevé du dépôt ;
- vraie base interrogée en **lecture seule, uniquement par des comptages** : aucun nom, numéro, adresse ni prix n'a été lu ;
- textes de loi lus dans les données ouvertes LEGI/JORF de la DILA (jusqu'au 16/10/2026 au soir) ou dans leur reproduction `codes.droit.org`, parce que **Légifrance répond 403** depuis le conteneur ;
- les endroits de `schema.sql` sont désignés par le **nom de l'objet** (« `admin_verifier_pro`, garde `if p_pro = moi` », « le séparateur de la section 42 »), pas par un numéro de ligne. Le commit bd8b47c, fait pendant la relecture de cette section, a décalé de 1 à 89 toutes les lignes au-delà de la ligne 1 475 environ, et le plan a déjà vécu ce problème avec « entre 7692 et 7693 ». Les numéros de ligne des autres fichiers ont été revérifiés le 17/10.

Rien du JO du 17/10 n'est donc couvert. Aucune citation ne s'imprime sur un devis sans avoir été recopiée depuis Légifrance.

### 10.1 Ce que le lot SIRET a déjà construit — le lot 0 rétrécit

Le §1 disait « zéro des colonnes candidates n'existe » (l.143) et, pour l'adresse postale, « la colonne n'existe pas » (l.129). C'est faux depuis le 17/10. La table `entreprise_registre` (section 45.3 de `schema.sql`) porte déjà l'identité lue au répertoire Sirene (INSEE). Elle est **privée**, et seules les fonctions de la base l'écrivent.

| ce que le devis imprime | où ça vit déjà | à savoir |
|---|---|---|
| SIREN, SIRET | `siren`, `siret` | 14 chiffres sous `entreprise_siret_check` ; un seul SIREN actif par compte et un seul compte actif par SIREN (index `idx_entreprise_pro_active` et `idx_entreprise_siren_active`) |
| dénomination d'une société | `denomination` | **vide pour un entrepreneur individuel** |
| nom civil d'un EI (« Nom Prénom EI ») | `nom_complet_registre` | brut, l'API y recolle parfois le sigle : ne s'imprime **jamais** tel quel |
| nom commercial | `nom_commercial` | celui de l'établissement saisi |
| forme juridique, EI ou non | `forme_juridique` (code INSEE), `est_ei` | libellé fourni par `src/data/formes-juridiques.js` ; une EIRL n'est pas un EI, elle a ses propres mentions (C. com. R. 526-17) |
| date de création, code APE | `date_creation`, `ape`, `naf25` | ceux de l'entreprise, pas de l'établissement |
| n° de TVA intracommunautaire | `tva` | vient de la liste DGFiP (par `recherche-entreprises`), pas du répertoire Sirene ; présent seulement quand cette liste en donne un ; ne dit **rien** du régime de TVA |
| adresse | `adresse`, `code_postal`, `commune`, `code_insee`, `est_siege` | c'est l'adresse de l'**établissement** saisi, qui n'est pas forcément le siège ; format exact (rue seule ?) non mesuré |
| fraîcheur | `statut_diffusion`, `maj_insee`, `source`, `verifie_le` | rien ne reconsulte le répertoire après le rattachement |

> **`emetteur` ne recopie AUCUNE de ces colonnes.** Les recopier ferait deux vérités, et c'est exactement le raisonnement qui a figé l'ancien SIRET libre (section 45.7, `fige_le_siret_libre`). L'instantané `em_` copie ces colonnes depuis la ligne **active** d'`entreprise_registre` au moment de la remise.

Et l'instantané est plus nécessaire que le 12/10 ne le pensait. Une ligne d'`entreprise_registre` se retire, se transfère, **et s'efface avec le compte** : sa colonne `pro_id` référence `professional_profiles` en `on delete cascade`, `professional_profiles.id` référence `users` de la même façon, et aucun déclencheur ne la protège. La section 45.3 bis n'y change rien : ce qui survit au compte, c'est la **réserve** d'un SIREN retiré (`sirens_reserves`, le SIREN et des dates), pas l'identité. Le premier jet de cette section écrivait « jamais effacées » : c'était faux. **Un devis remis ne doit dépendre d'aucune de ces lignes.**

Ce que cela rend obsolète, ou change :

- **Le bouton « Utiliser le SIRET de ma fiche (…) »** (l.1919-1922) n'a plus d'objet. `professional_profiles.siret` est figé (`fige_le_siret_libre`), l'application ne l'envoie plus (`api.js:2139-2141`), et ses cinq valeurs ont une clé de contrôle fausse (en-tête de la section 45). Même sort pour la ligne du §6 sur `updateProfile` (l.2430) et pour la contrainte demandée par SIRET-ET-CLAUSES.md:683-689.
- **`emetteur_incomplet()` doit exiger une ligne active d'`entreprise_registre`.** Jamais `verifie`, ni `professional_profiles.entreprise`. Mesuré : **3 des 4 fiches vérifiées n'ont aucune entreprise rattachée**. Le badge atteste des pièces vues par un humain, pas l'identité qui s'imprime sur le devis. Et le nom public de la fiche vient d'un champ libre du formulaire (insertion de la fiche par le déclencheur d'inscription). **`emetteur_incomplet()` n'est qu'une partie du contrôle de remise** : l'autorité unique est ailleurs (10.7).
- **Le nom « Mon entreprise » est déjà pris** par la feuille en lecture seule du lot 1 bis du SIRET — c'est le nom que CLAUDE.md donne au SIRET à l'inscription — (`FeuilleEntreprise.js:107`, ouverte depuis `ProfilEditScreen.js:327-334`). Deux options : le lot 0 l'enrichit (identité Sirene en lecture seule, puis un bloc « Pour mes devis » modifiable), ou il prend un autre nom. Jamais deux écrans du même nom.
- **Deux adresses, pas une.** Quand l'établissement n'est pas le siège (`est_siege = false`), R. 111-1 1° et R. 221-2 3° demandent aussi l'adresse du siège. Autre point ouvert : l'adresse doit-elle rester corrigeable (SIRET-ET-CLAUSES §8.4), alors que l'identité est en lecture seule ? À trancher en écrivant le lot 0, après avoir **mesuré** le format réel de la colonne.
- **Fraîcheur.** Une entreprise cessée après son rattachement resterait « active » dans Opus. Il faut choisir : reconsulter le répertoire avant chaque remise, ou imprimer la date de consultation du répertoire Sirene (INSEE). Jamais « date de vérification » : ce mot appartient au badge, et `verifier-siret` le refuse. La Licence Ouverte impose de toute façon de citer la source et la date de sa mise à jour.
- Le « cadeau » des coordonnées GPS du siège (SIRET-ET-CLAUSES.md:87-94) **n'a pas été construit**.

Ce qui reste VRAIMENT à saisir dans `emetteur`, c'est-à-dire tout ce que Sirene ne donne pas :

| famille | pourquoi elle est due (détail en 10.3) |
|---|---|
| registre (RCS, RNE métiers ou aucun) **et ville du greffe** si RCS | R. 111-2 3° ; R. 123-237 2° |
| capital, ou la mention « à capital variable » | R. 123-238 ; L. 231-2 |
| assurances : **une liste**, chacune avec assureur, coordonnées, couverture géographique (n° de contrat facultatif, date de validité) | R. 111-2 9° ; L. 243-2 |
| médiateur : nom, adresse, site, pris dans la liste officielle | R. 111-1 7° ; R. 616-1 ; L. 613-1 |
| régime de TVA | CGI 293 B (l'option « sur les débits » attend la facture : 10.3) |
| garanties légales et commerciales, SAV | L. 111-1 5° ; R. 111-1 3°-4° |
| **modalités de paiement, d'exécution et de traitement des réclamations** (absentes du plan) | R. 111-1 2° ; R. 221-2 4°-5° |
| taux horaires, décompte du temps, forfaits, frais de déplacement, devis payant et son coût | arrêté du 24/01/2017, art. 2-3 |
| CGV si l'artisan en utilise ; logo (pour les trois modèles, 10.6), durée de validité habituelle | R. 111-2 7° ; confort |

La coupe du lot 0 en deux (l.1974-1981) tient, mais son contenu change. La moitié « identité » est faite. Ce qui **bloque** un devis devient : assurances, médiateur, régime de TVA, garanties, modalités et frais. Le confort reste le logo, le modèle, les CGV et la durée de validité.

**Le régime de TVA naît « non déclaré », et rien n'est pré-coché.** L'absence de n° de TVA sur la fiche de l'entreprise ne prouve rien (`tva` « ne dit rien du régime ») ; l'écran peut l'écrire en toutes lettres — « votre fiche d'entreprise n'affiche pas de numéro de TVA, ce qui ne prouve rien » —, sans proposer de choix d'avance. Un franchisé présumé à tort émettrait des devis sans TVA, et Opus ne coche jamais à la place de l'artisan.

État du code utile au module, au 17/10 :

| | 12/10 (plan) | 17/10 |
|---|---|---|
| appelants de `est_mon_entreprise()` | 2 | **3 politiques** (chantiers, clients, `entreprise_registre`), et la fonction exige `est_un_pro()` : le devis sera le 4e appelant, la base de postes (10.6) le 5e |
| codes d'erreur maison | OP003 libre | **toujours libre (0 occurrence), et gardé pour le verrou du devis remis**, comme le plan l'écrit (l.840-1026, 1850) : la section 45 l'a sauté. OP004 à OP010 sont pris ; **tout code nouveau du module prend OP011 et suivants** |
| `erreurs.js` | points 1 à 5 à faire | **le point 5 est fait** (tout code `OPxxx` est rendu tel quel, `erreurs.js:125-133`) ; les points 1 à 4 restent à faire, au lot 0 |
| point d'insertion du module | entre 7692 et 7693 | **après la section 45 (45.3 bis comprise), avant le séparateur de la section 42**, qui précède `mes_donnees()`. Relevé sur bd8b47c : séparateur à la ligne 9740, titre à 9741, `mes_donnees()` à 9760 — ces numéros bougeront à la prochaine section |
| clé `'devis'` de `mes_donnees()` | ligne 7737 | ligne 9785 sur bd8b47c, et elle désigne toujours la DEMANDE ; `mes_donnees()` exporte déjà `entreprise_registre` |
| moyen d'essai | Expo Go | **build de développement** depuis le 15/10 (`expo-dev-client ~57.0.20` dans `package.json`, profils `development` et `preview` dans `eas.json`) |
| modules natifs du devis | — | `expo-print`, `expo-sharing` et `react-native-svg` **absents** de `package.json` ; `react-native-gesture-handler ~2.32.0` présent |

Une collision que le plan ne voyait pas : `sos_availability.horaire` et `.deplacement` sont un taux horaire et un forfait de déplacement **déjà publics**, à `0` par défaut, et ils servent déjà aux fourchettes SOS (`src/data/urgences.js:92-93`). Cela viole la règle du §2.0, « un `null` n'est pas un `0` ». La réponse à la question des tarifs (10.8, tour 1) dira s'ils deviennent les mêmes chiffres que ceux du devis, ou s'il faut dire lesquels font foi.

### 10.2 Ce qui est TOUJOURS vrai, et toujours manquant

Relevé du 17/10, en comptages :

- Aucune table `devis`, `devis_lignes`, `devis_tva`, `emetteur` ni `factures` ; aucune fonction `emetteur_incomplet` ; aucun espace de stockage `devis`.
- 6 demandes de devis, dont 4 acceptées. **1 client** dans toute la base (particulier, adresse complète), et il appartient au compte administrateur. 2 chantiers. 0 séquence, 0 type enum. 5 colonnes d'argent, toutes `numeric`.
- **8 fiches pro (et non 7)**, dont 4 vérifiées, pour 15 comptes. Tous les « sur 7 » du plan sont à relire. **1 administrateur.**
- **1 pièce d'existence et 1 attestation d'assurance**, sur la même fiche : celle du compte de test (10.5). La pièce est rangée dans la colonne `kbis_url`, que l'écran présente comme « Extrait Kbis ou avis SIRENE » (`pieces-justificatives.js:87`) ; une attestation d'immatriculation RNE n'y est pas nommée, alors que c'est le document que reçoit un artisan EI à son immatriculation. Le nom de la colonne ne dit donc pas la nature de la pièce. L'attestation, la seule réelle, n'a **pas de date de validité** : aucun chemin de l'application ne capture cette date (`admin_verifier_pro` ne prend que des booléens). Les 4 dates d'expiration présentes en base sont sur des fiches qui n'ont pas d'attestation.
- Ni assureur, ni médiateur, ni garanties, ni régime de TVA, ni RCS/RNE, ni capital, ni logo, nulle part.
- Une demande de devis ne porte ni adresse ni e-mail. C'est le carnet de clients qui les fournira, et « Ajouter à mes clients » existe déjà sur une demande acceptée (`DemandesRecuesScreen.js:457-463`).
- `expo-print`, `expo-sharing` et `react-native-svg` sont absents de `package.json`.
- `pg_cron` et `pg_net` sont **disponibles mais non installés** sur la vraie base : aucun travail planifié n'y tourne aujourd'hui.
- Sur la vraie base, `sirens_reserves` existe, et la colonne `entreprise_registre.gele` est **encore là** : une colonne morte que plus rien ne lit ni n'écrit, que le connecteur refuse de retirer, et que le propriétaire retirera d'une ligne dans l'éditeur SQL (A-FAIRE.md §1.0).
- `STATUT = 'essai'`, `contratSousTraitance: false`, `EDITEUR.email: null` (`legal.js:81, 141, 172`).
- Les briques réutilisables du §1 sont toutes en place : ChampVille en mode `rue`, Calendrier, `{...CLAVIER}`, `surFond()`, `pieces-justificatives.js:103`.

### 10.3 Le droit au 17/10/2026

#### Confirmé, en une ligne chacun

- Seuil de 150 € abrogé : devis dû dès le premier euro, **pour le dépannage, la réparation et l'entretien** (arrêté du 24/01/2017, art. 4 et 7).
- Les 21 familles de travaux, et les dix mentions de l'art. 4-I.
- L'information sur les pièces remplacées, due dans les deux cas (annexe 2).
- L. 111-1, et l'exemplaire daté de L. 221-9.
- Les délais de 14 jours, 7 jours et 12 mois. La Cour de justice de l'UE a aggravé le risque : sans information sur la rétractation, le client qui se rétracte après la fin du chantier **ne doit rien** (C-97/22, 17/05/2023).
- L'exception d'urgence (L. 221-28 8°), l'exécution anticipée (L. 221-25), L. 221-3.
- Plafonds de franchise 85 000 / 37 500 €. Le seuil unique de 25 000 € n'a jamais été appliqué (loi n° 2025-1044), et la LF 2026 n'y touche pas.
- Certification du client depuis le 16/02/2025.
- Autoliquidation, et mention « Autoliquidation ».
- La numérotation est une obligation de **facture**, pas de devis.
- Le texte de C. com. L. 123-22 (dix ans pour les documents comptables) et de LPF L. 102 B (six ans sous forme électronique). **Le champ de L. 123-22 pour un micro-entrepreneur est rangé dans « Incertain »**.
- Dénomination « EI » (R. 526-27).
- Une signature tracée au doigt est une signature électronique **simple**, jamais qualifiée.
- Calendrier de la facture électronique.
- Aucun plafond légal d'acompte.

#### Changé, ou faux dans le plan et ses annexes

| le plan disait | le droit au 17/10 | source | effet |
|---|---|---|---|
| un drapeau par métier décide du devis obligatoire (l.532-538) ; six informations « pour TOUT devis » (l.351) | le champ de l'arrêté dépend de la **nature** de la prestation (dépannage, réparation, entretien), pas du métier. Hors de ce champ, aucune obligation générale de remettre un devis ; L. 111-1 peut alors être fourni ailleurs | arrêté 2017 art. 1 ; F37370 | le drapeau qui DURCIT reste sûr, mais l'écran n'écrit jamais « devis obligatoire » sur la seule foi du métier |
| plafond opposable à un artisan : 37 500 € (l.580-583) | s'il fournit les matériaux, son activité est **mixte** : 85 000 € au total ET 37 500 € de services | BOI-TVA-DECLA-40-10-10 § 170 (01/07/2026) | aucune aide ne cite « votre plafond » ; le régime reste une déclaration |
| dépassement effectif à sa date (l.583-584) | seulement pour le plafond **majoré** (41 250 / 93 500 €) ; dépasser le plafond de base fait sortir de la franchise au 1er janvier suivant | BOI-TVA-DECLA-40-10-20 § 110-170 | le régime figé sur un devis **ne gouverne pas** la facture : elle lira le régime en vigueur le jour du fait générateur |
| « TVA non applicable, art. 293 B » | **« TVA non applicable, article 293 B du CGI »** (ou 293 B bis, ou art. 284 de la directive 2006/112/CE). Exigée sur la **facture** ; sur un devis, c'est une information | CGI 293 E II | libellé exact dans `mentions-devis.js` |
| siège de la TVA « irréconciliable », CGI admis jusqu'au 31/12/2027 (l.599-605) | la TVA passe au CIBS le **01/01/2027**. Les renvois au CGI restent valables pour les factures et contrats produisant effet jusqu'au **30/06/2028**. Franchise aux art. **L. 233-3, L. 233-9, L. 233-21** (L. 223-3 traite de l'« intrant mixte ») | ord. 2025-1247 art. 46 et 49, modifiés par l'ord. 2026-671 du 27/07/2026 | `mentions-devis.js` daté avec ces trois bornes |
| la mention de franchise « change le 01/01/2027 » (SIRET-ET-CLAUSES.md:240) | **non** : le II de l'art. 293 E reste en vigueur jusqu'au décret pris sur L. 216-33 du CIBS, introuvable au 16/10 | ord. 2025-1247 art. 15 | aucun changement de libellé programmé ; état « en attente du décret » |
| l'écart « plus de deux ans / au moins deux ans » n'est pas établi (l.434-462) | **établi dans la loi** jusqu'au 31/12/2026 : « plus de » pour le 10 %, « au moins » pour le 5,5 % depuis la LF 2023 (art. 65). Le § 80 du BOFiP a gardé l'ancienne formule. Au CIBS : « au moins deux ans » pour les deux taux, apprécié **à la date de début des travaux** (L. 213-245) | CGI 279-0 bis, 278-0 bis A | une certification rédigée « plus de deux ans » couvre les deux taux ; seul le jour anniversaire reste ouvert, pour le 10 %, en 2026 ; en 2027 il faudra la date de **début** des travaux |
| trois cases de certification (l.2177-2181) | c'est un **choix d'écran** : une phrase qui énumère tout suffit (§ 85, modèles BOI-LETTRE-000280), la partie énergie seulement si une ligne est à 5,5 %. « Seul débiteur » est nuancé par la facture rectificative de bonne foi (§ 230). La certification doit exister **au plus tard au fait générateur** (CE 26/12/2008, n° 308530, § 100). Au 01/01/2027, sa forme passera par un arrêté (L. 216-14) non paru | BOI-TVA-LIQ-30-20-90-40 (09/09/2026) | le module facture bloquera une facture à taux réduit sans certification |
| autoliquidation : « tous les taux à zéro » (l.2182-2183) | imprimer **« Autoliquidation »** dans la colonne du taux, jamais « 0 % ». Le 10 % ne vaut pas en sous-traitance, mais le **5,5 % oui** si le donneur d'ordre certifie (sinon, par simplification, taux normal). Un sous-traitant en **franchise** n'autoliquide pas | BOI § 20 ; BOI-RES-TVA-000269 Q10 | règle d'exclusion : franchise ⇒ pas d'autoliquidation ; « aucun bloc de certification » n'est juste que sous la simplification |
| arrondi : « choix technique », BR-CO-10/15 (l.616-620, 1212) | la règle est **BR-CO-17** (avec BR-CO-14). L'arrêté du 27/07/2026 impose les profils EN 16931 : pour une facture électronique, c'est une obligation. Pas de tolérance d'un centime sur la facture (G1.54 supprimée ; G1.53 ne vaut que pour l'e-reporting) | arrêté 27/07/2026 ; spécifications DGFiP v3.2, annexe 7 | `devis_tva` est juste. Mais un taux en millièmes (200, 100, 55) ne sait pas porter **1,05 % ni 1,75 %** (outre-mer). **Décidé : les taux passent en centièmes de point** (2000, 1000, 550, 105, 175), et la formule devient **`(base * taux + 5000) / 10000`**, en SQL ET en JavaScript. Les sept cas appariés du §3.5 (l.1157) sont réécrits, plus un cas à 1,05 % |
| médiateur : « déduction », palier 5 (l.570-573, 696) | **mention littérale** du devis dans le champ de l'arrêté (art. 4-I + L. 111-1 6° + R. 111-1 7°) et hors établissement (R. 221-2 11° ; amende jusqu'à 15 000 / 75 000 €, L. 242-10). Le médiateur doit être **référencé** par la CECMC. Pas dû entre professionnels, sauf le cas de L. 221-3 | C. conso. | **bloque** un devis adressé à un consommateur ; proposer la liste officielle plutôt qu'une saisie libre |
| R. 111-2 : « six » points, droit applicable au 7°, juridiction au 8° (l.225-226, 359-360, 1603) | **neuf** points : 7° conditions générales, **8° loi applicable ET juridiction ensemble**, 9° assurance ; 4° (autorisation) et 6° (profession réglementée) sont conditionnels | R. 111-2 (décret 2022-1014) | citations à corriger ; le 6° appliqué à un artisan du bâtiment reste un doute |
| assurance : obligations « exclusives » (SIRET-ET-CLAUSES.md:294-300) ; l'attestation « tranchée par le droit » (premier jet de cette section) | face à un consommateur, il faut **l'attestation jointe (L. 243-2) ET** assureur, coordonnées et couverture géographique écrits sur le devis (R. 111-2 9°, qui n'exclut pas les constructeurs). Le **n° de contrat n'est exigé par aucun texte** sur le devis : il figure dans l'attestation (A. 243-3). R. 111-2 9° vise **toute** RC pro souscrite. Mais L. 243-2 vise les personnes soumises à la décennale, pour des travaux de **construction** : pour un dépannage ou un entretien sans ouvrage, l'exigence est discutable, et la sous-traitance (F2034) et L. 243-3 (particulier constructeur) restent ouverts | C. assur. ; C. conso. | contrainte croisée du lot 0 : assureur + coordonnées + couverture, n° de contrat facultatif ; une **liste** d'assurances. **Refuser la remise sans attestation, avec une sortie qui explique et laisse une trace, est un CHOIX de conception**, pas une obligation dans tous les cas. Ce qui le déclenche est la **nature des travaux** (une ligne qui relève de la construction), jamais le métier, et la sortie n'écrit jamais « la loi l'exige » quand aucune ligne n'en relève. Attention, deux fiches DILA (F37371, F36008) disent l'inverse du texte |
| exiger un délai même pour une exécution immédiate est « plus strict que la loi » | **faux hors établissement** : L. 221-5 I 3° ne reprend pas l'exception de L. 111-1 3° | C. conso. | au II, le délai est obligatoire, « exécution immédiate » comprise |
| `mention_accord` : « les termes sont imposés » (l.2241-2243) | **aucun** texte n'impose « bon pour accord » : l'art. 1376 vise l'engagement d'une seule partie. La seule mention manuscrite imposée est « Lu et approuvé » de l'annexe 2 ; tapée sur le téléphone de l'artisan, elle ne remplit pas l'art. 1174 al. 2 | C. civ. | colonne gardée comme trace, pas comme obligation ; papier pour l'annexe |
| arrhes présumées par L. 214-1 (l.509-517) | L. 214-3 exclut les « **commandes spéciales sur devis** » : la présomption ne joue probablement pas | C. conso. | `acompte_nature` devient indispensable ; le lexique (CONCURRENCE-DEVIS.md:421-422) est faux sur les deux définitions |
| « Acompte à la signature » (DEVIS-DU-PROPRIETAIRE.md:179) ; dates d'acompte renvoyées au lot 4 (l.2122-2131) | sur un devis hors établissement, imprimer cette phrase **c'est exiger** un paiement avant 7 jours. Le texte punit le fait d'« exiger **ou** obtenir » : 2 ans et 150 000 € (L. 242-7), et nullité (L. 242-1) | C. conso. | **tout l'acompte passe au lot 2** : montant calculé, « Reste à payer » = TTC − acompte (une soustraction, jamais un second pourcentage), `acompte_nature`, et « au plus tôt le 8e jour après la signature » ; `verifier-devis` refuse « à la signature » hors urgence. « Opus n'encaisse rien » ne protège pas l'artisan : c'est le texte imprimé qui exige |
| l'urgence lève la rétractation (l.400-405) | elle lève **aussi** l'interdiction de paiement de 7 jours, mais pour les seuls travaux strictement nécessaires | L. 221-10 4° | marqueur d'urgence **par ligne**, pas par devis ; mention « vous ne bénéficiez pas du droit de rétractation » (L. 221-5 10°) ; le lien avec une demande `sos_requests` suit la doctrine de `source` (10.7) |
| palier 1 : « 2 ans selon les cas » (l.692) | depuis le **27/05/2026**, le formulaire manquant n'est plus puni que de 150 000 € d'amende (loi n° 2026-403, art. 26). L'exemplaire (L. 242-5) et le paiement anticipé (L. 242-7) restent punis de 2 ans. **L. 242-8** ajoute jusqu'à 5 ans d'interdiction d'exercer | C. conso. | aucun texte d'Opus n'attribue de prison au formulaire ; la fiche F23224 est en retard sur le code |
| clause de juridiction imprimée si l'artisan la déclare | **réputée non écrite** sauf entre commerçants (CPC 48) ; le consommateur saisit le juge de son domicile (R. 631-3) | CPC ; C. conso. | jamais imprimée face à un particulier, ni face à un pro non commerçant |
| capital (SARL, SA, SAS) | pour une société **à capital variable**, la mention « à capital variable » remplace le montant. Sanction : injonction en référé sous astreinte, à la demande de toute personne intéressée | C. com. L. 231-2, L. 238-3 | `emetteur_incomplet()` exige un montant **ou** cette mention |
| L. 221-5 « modifié le 06/01/2026, onze points » | seul le 7° a changé (fonctionnalité de rétractation **en ligne**), applicable le **19/06/2026** ; les onze points datent de l'ord. 2021-1734 | ord. 2026-2 ; directive 2023/2673 | rien ne change pour un devis papier |
| « détachable » | le plan avait raison : le mot n'est ni dans L. 221-9 ni dans l'annexe R. 221-1. Il faut en revanche ajouter « confirmant l'engagement exprès des parties » | C. conso. | phrase du plan gardée |
| « seule la facture conserve dix ans l'identité de son destinataire » (l.1125-1127) | **faux, et pour deux raisons**. Un devis **accepté par voie électronique**, d'au moins 120 €, avec un consommateur, se conserve **10 ans**, avec accès pour le client « à tout moment » (L. 213-1, D. 213-1, D. 213-2). Un devis portant la **certification de TVA réduite** se conserve « à l'appui de la comptabilité », quel que soit le canal (279-0 bis 3 ; 278-0 bis A IV) | C. conso. ; CGI | pendant la vie du compte, **ces** devis ne se suppriment pas ; à la suppression du compte, Opus propose de les télécharger, puis efface tout. L'obligation de conserver pèse sur l'**artisan**, pas sur Opus (voir « Conservation », plus bas) |
| devis non accepté : « aucun texte ne fixe sa conservation » (l.639-640) | sauf pour les **services à la personne** (petits travaux de bricolage et de jardinage) : au moins **un an** | arrêté du 17/03/2015, art. 6 (lu par un extrait seulement) | pour ces services, toute purge garde au moins un an |
| la facture au particulier se fait « sans partenaire » (CONCURRENCE-DEVIS.md:464-465) | vrai jusqu'au 31/08/2027. Ensuite, les ventes aux particuliers font l'objet d'un **e-reporting** par une plateforme agréée, franchisés compris (données agrégées, aucune donnée sur le client) | CGI 290 ; BOI-TVA-DECLA-20-30-50-20 (30/09/2026) | le module 3 aura besoin d'une plateforme pour les particuliers aussi |
| « 101 plateformes », « ou par celle du client » (CONCURRENCE-DEVIS.md:458-467, 581) | liste du 13/10/2026 : 149 plateformes délivrées et 6 en attente ; 11 autres en attente de tests. La plateforme est celle « **choisie par l'assujetti** » (CGI 289 E). **Il n'existe plus de plateforme publique gratuite pour les factures entre entreprises** : l'État tient l'**annuaire central**. Chorus Pro, qui garde le nom de « portail public de facturation » dans le code de la commande publique (L. 2192-5), reste le canal vers les personnes publiques | DGFiP ; loi n° 2026-103 art. 123 ; CCP L. 2192-5 | reformuler. La « solution dédiée » de l'art. 242 nonies G (décret 2026-677) n'a pas été lue : **on ne peut pas écrire qu'aucun canal gratuit n'existe** (10.10) |
| ETI : « les sources divergent » (CONCURRENCE-DEVIS.md:453) | tranché par la loi : **01/09/2026** | LFR 2022 art. 26 III | sans effet sur un artisan (PME et micro : 01/09/2027) |

Trois règles sont **plus strictes que la loi**, et le restent par choix ; il faut les présenter comme des choix, pas comme des obligations :

- refuser la remise quand les frais de déplacement sont à `null` (la loi dit « le cas échéant ») ;
- exiger un délai pour une exécution immédiate, quand le contrat est conclu en établissement ;
- refuser la remise sans attestation d'assurance quand une ligne relève de la construction (ligne « assurance » ci-dessus).

#### Nouveau : absent du plan

| obligation | texte | ce qu'elle demande au devis | lot |
|---|---|---|---|
| **Construction neuve ou transformation importante** : ces contrats sortent du régime hors établissement — pas de formulaire de rétractation, pas de 14 jours, pas de blocage des 7 jours, pas d'amende de L. 242-10 | C. conso. L. 221-2 12° ; directive 2011/83 cons. 26 | une question **par devis**, « construction neuve ou transformation importante ? », **« non » par défaut** (le cas le plus exigeant). « Oui » retire les blocs de rétractation et du 8e jour, après une confirmation qui dit le risque (se tromper ouvre les 12 mois de L. 221-20) et laisse une trace datée. **Cela revoit le §6 (l.2426)**, qui excluait tout interrupteur actionné par l'artisan : la question par devis, « non » par défaut, avec une confirmation qui dit le risque et une trace datée, en est la version encadrée — jamais une déduction | 2 |
| **Déchets de chantier** : quantité estimée, modalités de tri et d'enlèvement, point(s) de collecte (raison sociale, adresse, type d'installation), coût estimé. Sur tout devis de construction, rénovation, démolition ou jardinage, **quel que soit le client** ; amende jusqu'à 3 000 / 15 000 €. **Exception** : les travaux soumis au diagnostic « produits, équipements, matériaux et déchets » (PEMD, CCH L. 111-10-4) relèvent du IV | C. env. L. 541-21-2-3, D. 541-45-1 | un bloc **par devis**, et un motif de refus de `preparer_remise_devis` pour ces familles de travaux (sauf chantier soumis au PEMD), **décrit** dans `mentions-devis.js` | 1-2 |
| Main-d'œuvre hors établissement : pour chaque prestation, le taux horaire **et le temps estimé**, ou un forfait | arrêté 2017 art. 4-II | `devis_lignes` distingue une ligne horaire d'un forfait ; refus d'une ligne de main-d'œuvre qui n'a ni l'un ni l'autre — **CORRIGÉ AU LOT 1, le 23/10 : AUCUNE contrainte.** « Ni l'un ni l'autre » est déjà impossible : toute ligne chiffrée porte une quantité (`devis_ligne_forme_check`), donc un temps quand l'unité est l'heure. Et l'arrêté range lui-même le prix au mètre carré parmi les prestations forfaitaires (art. 2) : une contrainte « heure ou forfait » aurait été une règle plus stricte que la loi, contre la décision du 18/10, et appliquée à TOUT devis alors que le texte vise le dépannage, la réparation et l'entretien, face au consommateur. Le drapeau `main_oeuvre` reste, sans contrainte d'unité : il propose l'unité « heure » (si aucune n'est choisie) ; le taux horaire déclaré est proposé dans un prix encore vide en franchise, et seulement montré sous le champ au régime réel, jamais converti (C9 du cahier ; 10.16) | 1 |
| Modalités de paiement, d'exécution, de traitement des réclamations. Vocabulaire imposé : « garantie légale », et « garantie commerciale » **seulement** si l'artisan en offre une | R. 111-1 ; R. 221-2 (15 rubriques) | colonnes d'`emetteur` ; contrôle du vocabulaire | 0 |
| **Formulaire type de rétractation** : c'est un texte réglementaire fixe | annexe à R. 221-1 | le reproduire AU MOT, avec un contrôle qui compare le texte imprimé à celui de l'annexe (une propriété, pas une syntaxe). L'avis d'information type (annexe à R. 221-3, version du 05/01/2026) est facultatif | 2 |
| Information remise avant la signature, sur papier ou, **avec l'accord du client**, sur un support durable ; c'est au pro de prouver qu'il l'a remise | L. 221-7, L. 221-8, L. 111-5 ; C. civ. 1127-4 | accord du client horodaté. Le support durable est le **fichier PDF**, jamais l'adresse signée : elle expire à validité + 30 jours, alors que la rétractation peut courir 12 mois et 14 jours. Garder l'accusé de réception | 2 |
| Calcul des 14 jours : le jour de la signature ne compte pas ; une échéance qui tombe un samedi, un dimanche ou un jour férié passe au premier jour ouvrable | L. 221-19 | table des jours fériés dans `devis-delais.js` ; un essai avec J+14 tombant un dimanche | 4 |
| **Le moment de la signature, pas l'endroit.** Accepté par message **juste après** le passage de l'artisan, le contrat reste hors établissement : le recours aux techniques à distance n'a pas été « exclusif » (L. 221-1 2° b). Si l'artisan est venu seulement mesurer et que le client accepte **plusieurs jours plus tard**, de lui-même, le contrat n'est ni hors établissement ni à distance : pas de rétractation. Le régime « à distance » suppose qu'on ne s'est **jamais rencontrés** ; s'il passe un jour par Opus : confirmation (L. 221-13), bouton de commande (L. 221-14), bouton « renoncer au contrat ici » (D. 221-5, depuis le 19/06/2026), C. civ. 1127-1 et 1127-2, et statut de place de marché pour Opus (L. 111-7). Après un démarchage téléphonique : confirmation signée (L. 221-16, depuis le 11/08/2026) | directive 2011/83 cons. 20-21 ; orientations 2021/C 525/01 §4.1 | `lieu_conclusion` à **deux** valeurs, nommées d'après leur régime : « signé le jour de la sollicitation » (hors établissement, **par défaut**) et « signé sans sollicitation le jour même » (en établissement, ou après réflexion : régime de l'art. 4-I, sans rétractation). La question se pose **par devis**, jamais en réglage global, et **le défaut ne dépend pas de la réponse du propriétaire** (l.2659-2665) : Opus sert plusieurs artisans. **Le cas « à distance » existe dès aujourd'hui** — un devis envoyé et accepté par courriel sans s'être jamais rencontrés, sans rien d'Opus : l'artisan garde alors le défaut, qui imprime l'information et le formulaire de rétractation et retarde tout paiement au 8e jour ; ce qu'il ne couvre pas, ce sont les obligations propres à la vente à distance, à commencer par la confirmation du contrat sur support durable (L. 221-13), qui restent à faire par l'artisan. C'est le **régime** « à distance » complet, avec une acceptation dans Opus, qui attend un avis juridique | 2, 4 |
| Label RGE, pour les travaux d'énergie dont les **aides** exigent le label : dire si on le détient, annexer le justificatif, nommer les sous-traitants et leurs labels. Sanctions : nullité et 15 000 / 75 000 €. Démarchage téléphonique interdit pour ces travaux | L. 224-114, L. 224-115, L. 242-51, L. 223-1 (depuis le 01/07/2025) | mention conditionnelle et pièce jointe, sur le modèle de l'attestation décennale. Ce qui déclenche l'obligation est l'aide, **pas** une ligne à 5,5 % | 2-3 |
| Clauses présumées abusives (liste grise) : date d'exécution « indicative », acompte conservé sans réciprocité, médiation obligatoire avant le juge (L. 612-4). Sur la liste noire, au-delà du 3° : les 4° à 9° et le 12°. Amende civile pour qui garde une clause déjà jugée abusive (L. 241-1-1, depuis le 02/05/2025) | R. 212-1, R. 212-2 | jamais « délai indicatif » ; liste des sujets interdits de la bibliothèque de clauses | 2, clauses |
| 5,5 % aussi pour les **bornes de recharge** (avec un installateur qualifié) et le **photovoltaïque jusqu'à 9 kWc** (depuis le 01/10/2025) | CGI 278-0 bis N et P | la liste `taux_justification` s'élargit ; la garde RGE reste limitée à 279-0 bis et 278-0 bis A | 3 |
| Le 10 % dépend de **qui est facturé** (propriétaire, syndic, locataire, occupant, ou leur représentant) ; le 5,5 % non | CGI 279-0 bis 3 ; BOI § 10 | une question « en quelle qualité commandez-vous ? », jamais déduite de `clients.type` | 3 |
| Certification établie en **double exemplaire** ; le client garde le sien jusqu'au 31/12 de la 5e année | CGI 278-0 bis A IV | l'exemplaire du client est une obligation | 3 |
| Travaux d'urgence : une liste officielle dit ce qui ouvre le 10 % quelle que soit l'ancienneté du logement, avec une mention propre, **sur la facture**, et pour le 10 % seulement | BOI-ANNX-000211 ; BOI § 160-180 | branché sur le chemin SOS, au module facture | 3 / facture |
| Abus de faiblesse en situation d'urgence : 3 ans, 375 000 € | L. 121-9 5°, L. 132-14 | à signaler sur le chemin SOS | 2 |
| Les mots « artisan » et « maître artisan » sont réservés à qui en a la qualité : 7 500 € | C. artisanat L. 241-1, L. 241-2 | le gabarit ne les imprime jamais comme qualité sans déclaration de l'artisan | 2 |
| Entreprise au RCS : ville du greffe ; mentions « en liquidation » et « locataire-gérant » le cas échéant | R. 123-237 2°, 4°, 6° | colonnes conditionnelles | 0 |
| Contrat qui couvre le gros œuvre et la mise hors d'eau et hors d'air d'un logement : contrat écrit avec les mentions a) à g) | CCH L. 232-1 | **hors périmètre**, à écrire au §6 pour ne pas le couvrir par erreur | — |

#### Ce que le devis range pour la facture — seulement ce qu'il IMPRIME ou CONTRÔLE

Le premier jet de cette section voulait ranger dès le lot 1 tout ce que la facture lira, « parce que chaque donnée coûte une colonne aujourd'hui et une migration de devis figés plus tard ». **C'était réintroduire des colonnes sans lecteur**, ce que la règle du projet (« chaque chose naît avec le lot qui s'en sert », d'où l'absence de `compte_id` sur `clients`) et le §3.12 interdisent. Pour deux d'entre elles, la contradiction était même interne : l'option « sur les débits » figée sur le devis ne serait **jamais lue**, puisque la facture lira le régime du jour du fait générateur ; et `cl_pays` n'aurait **aucun écrivain**, `clients` n'ayant pas de colonne pays et imposant un code postal à cinq chiffres (`client_code_postal_check`). Et l'argument de la migration ne tient pas : **au moment de créer une facture, on peut demander ou proposer la valeur.**

Ce que le devis range, parce qu'il l'imprime ou qu'un de ses contrôles le lit :

| donnée | son lecteur | lot |
|---|---|---|
| unité en **liste fermée** (m², ml, m³, u, h, forfait…) **[corrigé au lot 1, le 23/10 : sept clés, `m2`, `m`, `m3`, `u`, `h`, `jour`, `forfait` ; « ml » ne s'affiche jamais — Q2, 10.16]** | imprimée. Choisir des unités qui ont un code UN/ECE rec20 (MTK, MTR, MTQ et C62 sont dans la liste Peppol, révision 11, vérifiée le 17/10 ; leur présence dans l'annexe 7 française, qui peut restreindre la liste, reste à vérifier, comme HUR et LS) ; la correspondance elle-même s'écrira avec la facture | 1 |
| main-d'œuvre : taux horaire **et** temps estimé, ou forfait | imprimée ; exigée hors établissement (arrêté 2017 art. 4-II) — **[corrigé au lot 1, le 23/10 : un drapeau `main_oeuvre`, SANS contrainte d'unité. Le temps estimé est la quantité d'une ligne à l'heure, que toute ligne chiffrée porte déjà ; une pose au m² reste possible. Voir la ligne « Main-d'œuvre hors établissement » plus haut, et 10.16]** | 1 |
| lieu d'exécution structuré (rue, code postal, ville) | imprimé ; c'est aussi lui qui situe un poste dans une région (10.6) | 1 |
| taux en centièmes de point | la formule, et le pied du devis | 1 |
| qualité du destinataire : consommateur, non-professionnel, professionnel | décide des mentions imprimées (médiateur pour un consommateur, juridiction jamais face à un consommateur, conditions de paiement entre professionnels). Proposée depuis `clients.type`, confirmée d'un appui ; un non-professionnel (SCI, syndic) traité comme un consommateur par prudence | 1-2 |
| SIREN d'un client professionnel | `clients.siret` accepte déjà 9 ou 14 chiffres (`client_siret_check`) ; à la remise, **avertir** s'il manque, sans refuser | 2 |
| régime de TVA figé dans `em_` | imprimé (« TVA non applicable, article 293 B du CGI ») | 2 |
| `cl_tva_intra` | imprimé, exigé seulement en mode autoliquidation | 3 |

Ce qui attend le **module facture**, par migration additive :

| donnée | pourquoi la facture en aura besoin |
|---|---|
| catégorie de l'opération : biens, services ou mixte | 242 nonies A 8° bis, factures de 2027 aux particuliers comprises (« fourniture et pose = services » reste à confirmer par un comptable) |
| option pour la TVA sur les débits | 242 nonies A 11° bis ; lue sur `emetteur` le jour du fait générateur |
| en franchise, une ligne `devis_tva` à taux 0 : catégorie **Z sans motif** sans n° de TVA, **E avec le motif VATEX-FR-FRANCHISE** avec | BG-23 ; BR-Z-10 et BR-E-10 |
| pays du client | BT-40 et BT-55, avec un vrai champ pays dans `clients` et une contrainte de code postal assouplie |
| canal fiscal complet : assujetti établi en France, non assujetti (une association aussi), étranger, personne publique (SIRET, code service, n° d'engagement, via Chorus Pro, CCP L. 2192-1) | c'est ce canal, et non « particulier / entreprise », qui décide entre facture électronique et e-reporting |
| répartition de l'acompte par taux | e-reporting des paiements (sauf autoliquidation) ; une règle du **plus fort reste**, pour que la somme tombe juste au centime (l'invariant du plan refuse le centime d'écart, l.35) |
| `devis_id` sur les factures d'acompte et finale ; référence de commande du client | CGI 289 bis ; C. com. L. 441-9 |

Sanctions de la réforme :

- facture non électronique : 50 € par facture, 15 000 € au plus par an ;
- pas de plateforme de réception : mise en demeure de 3 mois, puis 500 €, puis 1 000 € par nouvelle période de 3 mois ;
- e-reporting manqué : 500 € par transmission jusqu'au 31/12/2026, et **250 €** dans le texte applicable au 01/01/2027 (CGI 1788 D). C'est ce second chiffre qui vaudra quand un artisan sera concerné. Un défaut de coordination entre textes est possible : à surveiller.

Les factures stockées à Londres posent en plus la question du lieu de stockage (LPF L. 102 C), à soumettre à un comptable.

#### Conservation et données personnelles

| devis | durée | fondement |
|---|---|---|
| accepté **par voie électronique**, d'au moins 120 €, avec un **consommateur** | 10 ans (à compter de la signature, ou de l'exécution si elle est différée), avec accès pour le client | C. conso. L. 213-1, D. 213-2 |
| portant la **certification de TVA réduite**, quel que soit le canal | à l'appui de la comptabilité : 6 ans sous forme électronique (LPF L. 102 B) ; 10 ans au titre de L. 123-22, **si ce texte s'applique à l'artisan** (« Incertain ») | CGI 279-0 bis 3, 278-0 bis A IV |
| ouvrage (construction) | la preuve sert à l'artisan jusqu'à 10 ans après la réception — un intérêt, pas une obligation de conservation | C. civ. 1792-4-3 |
| dépannage ou réparation sans ouvrage | 5 ans à compter de la connaissance des faits, dans la limite d'un délai butoir de 20 ans | C. civ. 2224, 2232 |
| jamais accepté | 1 an (exemple CNIL d'une serrurerie, base 6.1.b) ; au moins 1 an pour les **seuls** services à la personne ; 3 ans seulement pour relancer, c'est-à-dire pour la prospection | CNIL 07/02/2022 ; arrêté du 17/03/2015 |

**« 10 ans » ne vaut donc pas pour « les devis acceptés » en général** : seulement pour les deux premières lignes.

> **Deux temps, et il ne faut pas les confondre.**
>
> **Pendant la vie du compte**, un devis que la loi oblige à garder (les deux premières lignes) ne se supprime pas : il part en **archive**, séparée des données courantes comme le demande la CNIL (base 6.1.c ou 6.1.f). Le droit à l'effacement cède devant une obligation légale ou la défense en justice (RGPD 17.3 b et e), mais **pas** pour un devis jamais accepté.
>
> **À la suppression du compte**, l'obligation de conserver pèse sur l'**artisan**, pas sur Opus. Opus, sous-traitant, doit **renvoyer ou effacer, au choix de l'artisan** (art. 28.3.g) : la suppression propose de télécharger les PDF et la trace d'acceptation (que l'export JSON ne contient pas), puis **efface tout** — devis, lignes, et fichiers du futur espace `devis`, à ajouter à `ESPACES` (`supabase/functions/compte/index.ts:46`). Une copie gardée après la fin du contrat est l'un des trois manquements sanctionnés chez MOBIUS (CNIL, 11/12/2025 ; `DONNEES-DES-ARTISANS.md` §2.4). **La politique de confidentialité ne promettra jamais qu'Opus garde des devis dix ans.**

**Aucun mécanisme de purge n'existe** : `pg_cron` et `pg_net` sont disponibles mais non installés sur la vraie base, PostgreSQL n'y appelle aucun service web, et un PDF du stockage ne s'efface pas par une ligne SQL — il faut l'API du stockage, comme le fait la fonction Edge `compte`. Le mécanisme est une **décision du lot 4** : installer `pg_cron` et `pg_net`, ou une tâche planifiée extérieure qui appelle une fonction Edge.

Sur les données des clients, l'artisan est responsable du traitement et Opus son sous-traitant (RGPD art. 28). `legal.js` écrit : « on ne peut pas écrire ce contrat » (`legal.js:690-694`). Ce n'est plus exact : les clauses types de la Commission (décision 2021/915, toujours en vigueur) sont réputées conformes. Il reste à remplir leurs annexes I à IV, qui sont des faits : parties, description du traitement, mesures de sécurité, sous-traitants ultérieurs. Le choix reste celui du propriétaire, à commencer par la question de savoir qui est le sous-traitant, puisque l'éditeur est aujourd'hui un particulier.

Obligations propres d'Opus comme sous-traitant :

- sous-traitants ultérieurs listés et autorisés par l'artisan (28.2) : Supabase toujours ; la Base Adresse Nationale quand l'artisan tape une adresse de client (sa qualification reste discutée) ; Anthropic **dès qu'une action IA lira un devis** — la relecture et l'étage de la compréhension de la base de postes (10.6) en seront ;
- à la fin, récupérer ou effacer au choix de l'artisan (28.3.g), ci-dessus ;
- registre des traitements (30.2), dû **dès aujourd'hui** pour le carnet de clients, et notification des violations à l'artisan (33.2) ;
- toute réutilisation du contenu des devis pour les fins d'Opus (des statistiques de prix, par exemple) fait d'Opus un responsable de traitement pour cet usage (28.10) : c'est la raison pour laquelle la base commune se construit **sans** les données des clients (10.6).

La décision d'adéquation du Royaume-Uni a été renouvelée le 21/12/2025 : l'hébergement à Londres reste possible sans encadrement supplémentaire. La phrase de `legal.js:707-709` est vraie aujourd'hui, et deviendra fausse dès qu'un second artisan enregistrera un client ou un devis.

#### Incertain, et dit comme tel

- **Fourniture et pose : vente ou service ?** La Commission range les fenêtres et portes posées dans la vente (délai de rétractation compté depuis la **réception** du bien) et la rénovation dans le service (délai compté depuis la **signature**). Mais la lettre de L. 221-1 II assimile tout contrat mixte à une vente. Conséquence : ne pas imprimer UNE date de fin de rétractation sur un devis de fourniture et pose ; à défaut, retenir la plus tardive.
- **« Transformation importante » (L. 221-2 12°)** : le texte ne la définit pas ; le considérant 26 la compare à une construction neuve. D'où le « non » par défaut.
- **Commencer les travaux pendant les 7 jours**, à la demande expresse du client, est **licite** selon le texte actuel : L. 221-10 n'interdit que de *recevoir* un paiement, L. 221-25 organise cette demande, et la directive l'impose (art. 9 §3). La fiche F23224 dit le contraire, mais c'est une survivance de l'ancien L. 121-26. Dans tous les cas, aucun paiement avant le 8e jour.
- L'attestation décennale sur un devis de **dépannage sans ouvrage**, ou de **sous-traitance** : le sous-traitant n'est pas tenu à la décennale (F2034), mais L. 243-2 vise des personnes, pas des opérations.
- Le jour anniversaire des deux ans, pour le 10 %, en 2026.
- **Une fiche Opus compte-t-elle comme « l'espace de communication en ligne dédié » de l'art. 3 de l'arrêté de 2017 ?** Si oui, un artisan de dépannage qui n'y affiche pas ses tarifs n'est pas en règle, **même s'il les affiche sur son propre site** : l'art. 3 vise « tout espace ». C'est ce qui pèse sur la question des tarifs (10.8, tour 1).
- R. 111-2 6° (profession réglementée) s'applique-t-il à un artisan du bâtiment, dont l'activité est soumise à qualification ?
- Un client « non-professionnel » (SCI, syndic) : par prudence, le traiter comme un particulier.
- Un dépannage est-il une « rénovation » au sens de l'obligation sur les déchets ?
- Le franchisé et l'e-reporting des **paiements** à partir du 01/01/2027 (L. 216-48 vise les opérations dont il est « redevable »).
- L. 123-22 (dix ans) s'applique-t-il à un micro-entrepreneur ? « Fourniture et pose » est-elle une prestation de services pour la catégorie d'opération ?

#### L'effet sur chaque lot, résumé

| lot | ce qui change |
|---|---|
| 0 | lit `entreprise_registre` (ligne active) ; liste d'assurances ; médiateur, bloquant pour un consommateur ; modalités de paiement, d'exécution et de réclamation ; capital ou « capital variable » ; ville du greffe ; régime de TVA « non déclaré » sans rien de pré-coché ; logo ; tarifs rangés selon la réponse du tour 1 ; points 1 à 4 d'`erreurs.js` |
| 1 | la forme d'une ligne (10.6) ; unité en liste fermée ; main-d'œuvre horaire avec temps estimé, ou forfait ; lieu d'exécution structuré ; taux en centièmes de point et nouvelle formule ; qualité du destinataire ; gros chantiers selon la réponse ; correcteur du clavier sur les descriptions **[corrigé au lot 1, le 23/10 : la main-d'œuvre y est un drapeau SANS contrainte d'unité ; la qualité du destinataire passe au lot 2 ; le lien SOS y est entré — 10.16]** |
| P | la base de postes : prix de référence, écart signalé, ajout d'un appui (10.6) |
| 2 | reconstruction EAS d'abord (10.4) ; question L. 221-2 12° ; bloc déchets (exception PEMD) ; formulaire au mot ; accord pour le support durable et PDF remis avant la signature ; tout l'acompte, « au plus tôt le 8e jour », jamais « à la signature » ; urgence par ligne et lien SOS **[corrigé au lot 1, le 23/10 : le lien SOS est entré au lot 1 ; le marqueur d'urgence par ligne reste ici, comme la qualité du destinataire — 10.16]** ; délai obligatoire au II ; `lieu_conclusion` à deux valeurs ; juridiction jamais imprimée pour un consommateur ; RGE conditionnel ; avertissement sur le SIREN du client ; « Document d'essai — sans valeur » tant que `STATUT = 'essai'` (10.5) ; la fonction des motifs de refus (10.7) |
| 3 | phrase unique de certification ; qualité du preneur ; « Autoliquidation » imprimé, 5,5 % possible en sous-traitance ; franchise ⇒ pas d'autoliquidation ; bornes de recharge et photovoltaïque ; double exemplaire ; bornes CIBS datées ; `cl_tva_intra` |
| 4 | L. 221-19 et jours fériés ; archive des devis à conserver pendant la vie du compte ; suppression de compte ⇒ téléchargement proposé, puis tout effacé ; purge des devis jamais acceptés **et son mécanisme** ; la question des factures reposée |
| 5 | **trois** modèles (10.6) ; tailles en pt ou en mm ; Oswald dans un module engendré au build ; fonds par `print-color-adjust` |

### 10.4 La technique : PDF, partage, signature

Revérifiée en lisant le code natif publié (`expo-print@57.0.2`, `expo-sharing@57.0.23`) et en mesurant dans le Chromium du projet. Le choix `expo-print` / `expo-sharing` tient. Voici ce qui change :

| | le plan | revérifié le 17/10 | conséquence |
|---|---|---|---|
| moyen d'essai | « essayable sans development build » (l.1251-1257) ; `expo-print` « fourni dans Expo Go » (l.39) | le propriétaire utilise un **build de développement** depuis le 15/10. `expo-print` et `expo-sharing` ne sont **pas dans l'application installée**. Avec `inlineRequires: false` et sans `await import` (interdit dans `src/`), un import statique d'un module natif absent fait planter l'application **dès le démarrage** (« Cannot find native module 'ExpoPrint' ») | étape écrite au lot 2, dans cet ordre : `npx expo install` **dans le conteneur**, puis `--check` (app.json change : `expo-sharing` y ajoute son greffon, à laisser sans option) ; commit ; `eas build` development **et** preview ; réinstallation par le propriétaire. Tout cela **avant** qu'un commit qui importe `expo-print` n'atteigne son téléphone. Une garde `requireOptionalNativeModule('ExpoPrint')` **ne protège rien** si un fichier de `src/` importe `expo-print` en haut : si le JS du paquet appelle `requireNativeModule` au chargement, l'application tombe avant que la garde ne s'exécute (non vérifié : le paquet n'est pas installé). Deux parades : un **seul** fichier enveloppe qui appelle le module natif par `requireOptionalNativeModule` sans importer `expo-print`, et un contrôle qui refuse tout autre import du paquet ; ou bien dire que **seule la reconstruction faite AVANT le commit** protège |
| version du SDK | 57 | **SDK 58 sorti le 15/10/2026** ; la prochaine Expo Go des stores ne prendra que le SDK 58 ; version attendue d'`expo-sharing` : ~57.0.23 | si le projet migre avant le lot 2 : versions 58.x, et `File.write()` devient asynchrone |
| taille de page | `printToFileAsync({ html })` | sur iOS, le format par défaut est le **US Letter** (612 × 792 pt), et `@page { size }` n'y change rien | passer `width: 595.28, height: 841.89` ; `verifier-devis` refuse un appel sans ces deux options ; l'essai Playwright reste en A4 |
| marges | règle `@page` obligatoire | sur iOS, seule l'option `margins` compte (zéro par défaut) | `margins` dans l'appel ; la règle `@page` reste pour Android et Playwright |
| PDF vide | « on compte pages et octets » | `numberOfPages` est fourni par le module. Si la donnée manque, la promesse est **résolue** avec un objet d'exception, sans `uri`. Le rendu attend la fin du chargement, mais jamais `document.fonts.ready` | tester `typeof r?.uri === 'string' && r.numberOfPages > 0` ; lire les octets par `new File(uri).size` |
| en-tête de tableau répété, « page n / N » | « un `<thead>` répète son en-tête » (l.1702) | vrai dans Chromium, **pas dans WebKit** (bogue 17205, toujours ouvert) ; Safari ne gère pas les boîtes de marge `@top-*` / `@bottom-*` | ne rien promettre ; refuser les boîtes de marge et `counter(page)` ; s'attendre à « non » sur l'iPhone. **Deux choses que les devis du propriétaire faisaient — l'en-tête répété à chaque page, « Page 2 of 4 » — ne peuvent donc pas être promises sur iPhone** (10.6) |
| sauts de page | les deux syntaxes | confirmé ; Safari ne gère pas `avoid-page` | refuser `avoid-page` |
| fonds de couleur | la bande de chantier devient « 2 objets /Image » | non reproduit. Surtout, `page.pdf()` n'imprime **aucun fond** par défaut (mesuré : 0 pixel orange) | `print-color-adjust: exact` (et sa forme `-webkit-`) sur un **conteneur**, pas sur `body` ; `printBackground: true` dans l'essai ; ajouter « la bande et les lignes alternées sont-elles visibles ? » aux questions posées sur l'iPhone |
| Oswald (lot 5) | police en base64 | le module n'attend pas le chargement des polices ; `expo-asset` est absent de `package.json` | un module JS **engendré** au build, qui porte la chaîne base64 |
| version web | « boîte modale qui bloque Playwright » | sans interface, `window.print()` rend la main en 7 ms ; ce qui casse vraiment, c'est le résultat `undefined` | décision gardée, raison corrigée |
| envoi « en deux pièces » | une seule feuille de partage (l.1393-1398) | `shareAsync` ne partage **qu'un fichier**, et se résout à la fermeture de la feuille sans dire si l'envoi a eu lieu | deux feuilles successives, ou un autre montage. L'attestation, rangée dans l'espace privé `documents`, doit d'abord être téléchargée sur le téléphone. `remis` signifie « PDF produit et archivé », **jamais** « envoyé au client » |
| unités | — | qu'un px CSS vaille 1 pt sur iPhone et 0,75 pt dans Chromium n'est pas tranché | tailles du gabarit en **pt ou en mm**, jamais en px |

Les éliminations du plan restent confirmées. `react-native-html-to-pdf` n'a rien publié depuis le 04/09/2025 ; l'argument « inessayable » tombe avec le build de développement, mais l'élimination tient pour les autres raisons. `react-native-webview` reste écarté.

**Signature au doigt.** La **capture** du tracé se fait sans nouveau module : `react-native-gesture-handler` (~2.32.0) est déjà dans l'application, et le tracé se range comme un chemin SVG écrit dans le HTML du PDF ; elle se vérifie ici par de vrais événements tactiles. **L'affichage du trait pendant qu'on signe, lui, demande `react-native-svg` (ou Skia), absent de `package.json`** : c'est un module natif, à mettre dans la **même** reconstruction EAS que `expo-print` et `expo-sharing`. L'autre voie, sans module, dessine le trait en segments de `View` ; sa fluidité est à mesurer avant de la retenir.

Juridiquement (10.3), c'est une signature électronique **simple** :

- un juge ne peut pas l'écarter au seul motif qu'elle est électronique (eIDAS art. 25 §1, inchangé par eIDAS 2) ;
- mais seule la signature qualifiée vaut une signature manuscrite (25 §2) et profite de la présomption de l'art. 1367 ;
- si elle est contestée, c'est à l'artisan de prouver l'identification **et** l'intégrité (C. civ. 1366, CPC 287). Un dessin collé dans un PDF se recopie.

> **Hors établissement, le papier signé en deux exemplaires reste la voie sûre** (C. civ. 1375 al. 4, 1174). Le tracé est une trace, pas une preuve, et on n'écrit toujours NULLE PART « signé électroniquement ». À rouvrir en 2027 : le portefeuille européen d'identité doit offrir aux particuliers une signature **qualifiée gratuite** (règlement 2024/1183, art. 5 bis ; échéance vers fin décembre 2026, date française non vérifiée).

### 10.5 Le compte de test : l'entreprise du FRÈRE du propriétaire

Relevé en comptages, sans lire l'identité :

- **1** entreprise rattachée, de source `'registre'` — c'est-à-dire lue au répertoire Sirene (INSEE), et non ouverte à la main —, active, non gelée au relevé, donc sans réserve dans `sirens_reserves` (qui ne reprend que les anciens gels) ;
- c'est un **entrepreneur individuel** (code 1000), **sans n° de TVA** ;
- sur la même fiche : 1 pièce d'existence, 1 attestation d'assurance, et le badge ;
- ce compte **n'est pas** le compte administrateur et n'a aucun client ;
- **le badge a été décerné par le seul administrateur, par le back-office** : `journal_admin` porte une ligne `pro_verifie` sur ce compte, écrite par le seul compte présent dans `administrateurs`. Mesuré par la critique, en comptages ; ce n'est plus « non vérifié ».

Le propriétaire l'a dit lui-même : « la page est une entreprise de mon frère, on pourra tester avec ». Le premier jet de cette section raisonnait « si c'est la sienne / si ce n'est pas la sienne » ; la question est tranchée, et ce qui suit est **la conduite à tenir pour ce cas**.

> **Un SIRET prouve qu'une entreprise existe, jamais qui en est le titulaire** (en-tête de la section 45, « Un SIRET est PUBLIC »), et un Kbis ou un avis Sirene se télécharge par n'importe qui. **Un devis engage l'entreprise qu'il nomme** : émettre un devis au nom de l'entreprise d'un autre, c'est se faire passer pour elle — même un frère, même pour rendre service.

**On construit et on essaie le module avec ce compte, à trois conditions, déjà dites au propriétaire :**

1. **L'accord du frère.** Son SIRET, sa pièce d'existence et son attestation sont dans la base, et le badge s'affiche publiquement sur sa fiche (voir « Le badge », plus bas).
2. **Aucun devis ne part chez un vrai client au nom de cette entreprise, sauf si c'est le frère lui-même qui l'émet.** Les devis d'essai portent **« Document d'essai — sans valeur »**. La forme la plus simple, proposée : l'appelant lit `STATUT` dans `legal.js` et le **passe en paramètre** au gabarit — `devis-html.js` reste sans aucun import (l.2507) —, qui imprime la mention sur chaque devis tant que `STATUT = 'essai'` ; aucune colonne. `verifier-devis` exige qu'elle figure dans le texte extrait de chaque modèle et de chaque gabarit. Conséquence à dire maintenant : **le jour où le frère émet un vrai devis, Opus a son premier utilisateur réel.** `STATUT` doit alors quitter `'essai'`, et `verifier-legal` le refuse tant que le contrat de sous-traitance (`contratSousTraitance`), l'adresse de contact relevée (`emailReleve`) et, quand le module existera, les mentions relues (§3.10) ne sont pas là. Ce n'est pas un réglage technique : c'est la date à laquelle Opus devient un service.
3. **S'il veut utiliser Opus pour de vrai, on lui TRANSMET ce compte** (adresse de connexion et mot de passe), on n'en crée pas un autre : une entreprise = un compte, et son SIREN est pris (OP007). Trois choses à régler **avant** cette remise :
   - aucun écran de l'application ne permet de changer l'adresse de connexion ni le mot de passe (relevé : aucun `updateUser` pour l'un ou l'autre dans `src/`, aucune réinitialisation) ;
   - l'acceptation des CGU portée par ce compte (`users.cgu_version`, `cgu_acceptees_le`) et la preuve SIRET de l'inscription sont celles du **propriétaire**, pas du frère : à la remise, **le frère accepte lui-même les CGU**, et une nouvelle date d'acceptation est enregistrée ;
   - une fois le compte remis, **le propriétaire ne s'y connecte plus** — il lirait les prix d'un autre artisan, ce que `DONNEES-DES-ARTISANS.md` §5.2 interdit, administrateur compris.

**Le badge.** Il a été décerné par le propriétaire, administrateur, sur un compte qu'il a lui-même ouvert, avec des pièces qu'il a lui-même déposées, pour l'entreprise de son frère, sans que celui-ci y soit pour rien. **Ce n'est pas l'usage prévu du back-office** : un humain y contrôle des pièces envoyées par le TITULAIRE. Ici, celui qui a validé est celui qui a ouvert le compte et déposé les pièces ; le badge public atteste seulement que le propriétaire a regardé ce qu'il avait lui-même déposé. Ce n'est pas non plus un badge qu'il s'est décerné à lui-même — l'entreprise n'est pas la sienne —, mais **la garde « le badge ne se décerne pas soi-même » (`admin_verifier_pro`, `if p_pro = moi`) n'aurait rien vu si elle l'avait été**, puisqu'elle ne reconnaît pas un second compte de la même personne. C'est une tâche hors devis, pas une correction à faire en douce.

> **Décision proposée : retirer le badge jusqu'à l'accord du frère**, par `admin_verifier_pro(p_pro, false, false)` — un geste du back-office, inscrit au journal — et **surtout pas** par un retrait d'entreprise, qui réserverait son SIREN (plus bas). Le retirer ne gêne aucun essai : `emetteur_incomplet()` ne lit jamais `verifie`. À son accord, il pourra être reposé, de préférence sur des pièces que le frère aura lui-même envoyées ou confirmées, et le lien familial entre celui qui valide et le titulaire est dit ouvertement (rien ne l'interdit, le journal le montre). L'autre voie — le garder en le disant — laisse s'afficher chez tout le monde une attestation que son titulaire n'a pas demandée. C'est au propriétaire de faire ce geste, ou de choisir l'autre voie.

**La pièce.** Un EI qui n'est **qu'**artisan reçoit une attestation d'immatriculation RNE, pas un Kbis. L'écran présente la colonne `kbis_url` comme « Extrait Kbis ou avis SIRENE » ; une attestation RNE n'y est pas nommée, mais rien n'empêche d'y avoir déposé un tel fichier. Savoir si l'entreprise est au RCS — et doit alors porter « RCS » suivi de la ville du greffe (R. 123-237) — se lit **sur la pièce**, pas sur le nom de la colonne. Non vérifié.

**Si le frère ne veut pas.** On supprime ce compte **par le chemin de l'application** (`preparer_suppression_compte`, puis la fonction Edge `compte`) : la cascade efface la ligne d'`entreprise_registre`, et une suppression par le titulaire **ne réserve rien** — son SIREN redevient donc libre pour lui —, et la fiche, le badge et les deux pièces de l'espace `documents` partent avec. **Surtout pas par un retrait de l'administration** (`admin_retirer_entreprise`), qui **réserve** le SIREN dans `sirens_reserves` : la réserve survit au compte (section 45.3 bis), elle bloquerait toutes les portes automatiques le jour où lui voudra s'inscrire, et seule l'administration pourrait la lever, en traitant une demande à la main. Le premier jet classait « quel chemin libère le SIREN sans le réserver » en « non vérifié » : cela se tranche à la lecture du schéma.

**Un trou signalé par le premier jet, fermé depuis.** La même cascade effaçait autrefois le gel d'un SIREN retiré (`entreprise_registre.gele`) : un squatteur à qui l'administration retirait une entreprise n'avait qu'à supprimer son compte pour la reprendre. **Ce trou a été fermé le 17/10 (section 45.3 bis, commit bd8b47c)** : la réserve vit dans `sirens_reserves`, sans clé étrangère, et survit au compte ; `siren_reserve()` en est la seule lecture. Pour le frère, rien ne change : une suppression par le chemin de l'application ne réserve rien.

**Le statut du propriétaire lui-même reste ouvert**, et c'est la première question du tour 1. Son compte principal n'a aucune entreprise rattachée ; le seul SIRET d'Opus est celui de son frère. Ses deux devis portent un nom d'entreprise et des dates de septembre 2026 (peut-être une formule de date du tableur), alors que CLAUDE.md dit « ni société ni SIRET » au 29/09 et « micro-entrepreneur » au 04/10. Les phrases « ni SIRET ni assurance décennale » (l.79, 679, 2671) attendent sa réponse :

- **s'il a une entreprise active**, `rattacher_mon_siret()` existe déjà pour la rattacher à l'un de ses comptes — lequel, c'est la question « Quel compte » du tour 2. Sur son compte principal, le badge ne pourra pas passer par le back-office (il ne valide pas sa propre fiche) mais par l'éditeur SQL, ouvertement. Et des obligations courent déjà pour lui — recevoir les factures électroniques par une plateforme agréée depuis le 01/09/2026, même en franchise (plus d'une dizaine de plateformes sont gratuites, et la DGFiP annonce une phase de démarrage sans sanction), puis un médiateur référencé avant son premier devis réel à un particulier. Pour que ses devis soient de vrais devis, Opus devra d'abord sortir de l'essai (condition 2) ;
- **sinon**, rien ne change à la conduite ci-dessus : on construit, on essaie, on n'émet pas. Rien ne change non plus pour l'**éditeur** d'Opus (`legal.js`, `STATUT = 'essai'`) : être artisan ne fait pas de lui l'éditeur d'une application ; c'est une autre décision.

Une information à transmettre au frère, qui ne dépend pas d'Opus : son entreprise est elle aussi concernée par la réception des factures électroniques depuis le 01/09/2026, et l'absence de n° de TVA rend sa franchise probable, pas certaine.

### 10.6 Ce que les devis du propriétaire changent au plan

`docs/DEVIS-DU-PROPRIETAIRE.md` (commité, fait foi) garde la **forme** de deux devis réels de rénovation (quatre pages chacun, 57 154 € et 110 191 € HT), sans aucune donnée personnelle. **La conformité ne vient pas de ces devis** — le propriétaire l'a dit, « pas aux normes, juste pour la mise en forme » — : elle vient du plan. Ce qu'ils apportent est ce que le plan ne savait pas : **comment un artisan chiffre vraiment.**

#### La forme d'une ligne se décide AVANT le lot 1

Trois de ses habitudes changent ce qu'est une ligne de `devis_lignes`, donc elles se décident avant de créer la table, pas après :

| ce que fait l'artisan | ce que la ligne doit savoir | son lecteur |
|---|---|---|
| le devis se lit **par pièce** : un titre de zone (« R+1 », « Extérieur »), puis un titre de pièce (« Cuisine »), puis les lignes chiffrées | des **lignes de titre à deux niveaux**, sans quantité, sans prix, sans taux, ignorées par le total | le PDF ; l'écran de saisie, qui se remplit **pièce par pièce, une carte par ligne** (« une LISTE qui se lit, une CARTE qui s'édite ») |
| des **réserves** dans le tableau, à l'endroit du problème (« Non relevé : les cotes ne sont pas sur les plans ») | une ligne **« réserve »** : du texte seul, ignoré par le total | le PDF, qui l'imprime précédée du mot **« Réserve : »** en plus du rouge — un devis se photocopie en noir et blanc, et **la couleur ne porte jamais l'information seule** |
| le geste commercial s'écrit **« Offert »** | une ligne à **zéro centime + un drapeau** — **CORRIGÉ AU LOT 1, le 23/10 : le drapeau met le TOTAL de la ligne à 0 et GARDE le prix unitaire.** Un prix de 0 n'est accepté qu'avec « Offert » (`devis_ligne_offert_check`) ; éteindre « Offert » fait revenir le prix tout seul. Pourquoi : si le geste est fiscalement une remise, la facture qui naîtra du devis devra porter le prix AVANT la réduction (CGI ann. II, art. 242 nonies A, I, 8° et 9° ; BOFiP §220) ; avec un prix à 0, cette valeur serait perdue au figeage. Que l'« Offert » soit une remise ou une prestation à prix nul **n'est pas établi** : question au juriste (10.16) | le PDF, qui imprime « Offert » au lieu de « 0,00 € », qui laisse croire à un oubli — **ce qu'il imprime de la valeur offerte (« Offert — valeur 45,00 € », ou rien) se décide avec le juriste, avant le lot 2** |
| « carrelage **non fourni** » — la moitié du prix | **fourniture comprise / non comprise**, par ligne : une case qui écrit la mention, plutôt qu'une parenthèse qu'on oublie une fois sur dix | le PDF |
| « 24,5M2 », « 105ML » tapés dans une case | une **quantité nombre** et une **unité en liste fermée** | déjà dans le plan |

Ce qui reste à trancher en écrivant le lot 1, et c'est dit plutôt que décidé ici : le nom et les valeurs exactes de la colonne de type de ligne (les « options, non comprises » du plan, l.2030, y entrent) ; une ligne de pure fourniture a-t-elle besoin d'une troisième valeur « sans objet » pour la fourniture ; une ligne appartient-elle à sa pièce **par l'ordre** (le plus simple) ou par une clé vers la ligne de titre. Et une contrainte nommée en `_check` interdit une quantité, un prix ou un taux sur un titre ou une réserve. Le **sous-total par zone ou par pièce**, que le §10 laissait ouvert, se calcule depuis les titres sans aucune colonne : l'imprimer ou non se décide au lot 1. **[Tranché au lot 1 le 21/10, écrit ici le 23/10 : cinq types (`zone`, `piece`, `poste`, `option`, `reserve`) ; pas de troisième valeur pour la fourniture (un seul drapeau, `fourniture_non_comprise`) ; le rattachement par l'ordre, puis par l'identifiant quand deux lignes ont le même ordre ; le sous-total affiché sur chaque titre, en HT au régime réel. Voir 10.16.]**

#### Les surfaces de la pièce

Dans la chambre 1 de ses devis : 17 m² de sol, mais 42,5 m² de contre-cloison — la surface des murs. Il retape ces surfaces à chaque ligne. **La ligne de titre de pièce porte ses surfaces (sol, murs), et une ligne au m² les reprend.** Deux règles :

- **copie, pas lien** : la surface remplit la quantité au moment où la ligne est créée. C'est la quantité qui s'imprime et que le client vérifie ; changer une surface ne modifie aucune ligne en silence (au plus, l'écran le propose) ;
- **tapée à la main, jamais exigée** : le jour où la Visite existera, elle pourra remplir ces surfaces, mais elle reste facultative (§19 du second cahier, §3.7 de ce plan). Son lecteur est l'écran de saisie.

#### L'acompte et le reste à payer

Ses devis écrivaient « 30 % avant le début des travaux » et un « solde dû » égal au TTC : l'acompte n'était qu'une phrase. **Opus le calcule** : montant en centimes, puis « Reste à payer » = TTC − acompte, par soustraction — la somme tombe juste par construction. Et la formulation suit 10.3 : hors établissement, **jamais « Acompte à la signature »**, toujours « au plus tôt le 8e jour après la signature ». Tout l'acompte passe au lot 2.

#### La base de postes : la décision « pas de table d'ouvrages » est REVUE

Il faut le dire franchement. Le plan a écarté « une table `ouvrages` / un catalogue de prix » (l.2033, l.2419), parce qu'« une table de prix sans historique ni taux par défaut est une table qu'on remplit à la main pour rien », et l'a remplacée par la relecture de ses propres `devis_lignes`. **Les devis du propriétaire démolissent la première moitié de cet argument** :

- le même faux plafond non isolé vaut 50 €/m² dans un devis et 70 €/m² dans l'autre, et ce n'était pas toujours voulu : « je n'avais pas non plus de base de prix ». Sans base, le même ouvrage glisse d'un chantier à l'autre sans que personne l'ait décidé ;
- le remède qu'il décrit est un **prix de référence que l'artisan FIXE lui-même**. Ce n'est ni une moyenne, ni le dernier prix pratiqué : c'est une valeur qu'il choisit, donc **elle ne se déduit d'aucune ligne existante. Elle a besoin d'une table.**

Et la table n'est plus « remplie à la main pour rien » : elle se remplit **d'un appui** depuis ses propres lignes, et elle a deux lecteurs dès le premier jour.

Elle naît au **lot P** (comme « postes »), juste après le lot 1. **Pas « lot 1 bis »** : ce nom est déjà celui du SIRET à l'inscription dans CLAUDE.md, et deux « lot 1 bis » à quelques lignes d'écart se confondraient.

| étage | qui le fait | ce qu'il fait | quand |
|---|---|---|---|
| **la mémoire** | la base, sans IA | chaque ligne qu'il a écrite ressort quand il tape (« chape » → **sa** phrase, **son** prix, et le devis d'où ils viennent). C'est le lecteur n° 5 du lot 1 (l.2032-2034), gardé, avec une précision : **jamais de moyenne** — 50 € et 70 € ne font pas 60 €, ce sont deux situations ; on montre les derniers prix avec leur devis d'origine | lot 1 |
| **la base de postes** | la base, sans IA | une table privée de postes : la phrase **mot pour mot**, l'unité, la fourniture, le **prix de référence** en centimes (vide tant qu'il ne l'a pas fixé : un `null` n'est pas un `0`). Elle se remplit **d'un appui** — « Ajouter à ma base » sur une ligne qu'il a écrite : son geste à lui, jamais un ajout automatique. Ses lecteurs : la suggestion pendant la frappe, qui propose ce prix ; et **l'écart signalé sur la carte de la ligne** — « votre prix de référence est 50 €/m², vous mettez 70 € — c'est voulu ? » —, une phrase discrète, **jamais une fenêtre, jamais un refus** : le prix de la ligne est le sien | **lot P**, juste après le lot 1 : il ne sort rien, donc il n'engage personne, et il se vérifie entièrement ici |
| **la compréhension** | l'agent | reconnaître deux formulations du même poste, comprendre une dictée (« chape dans le salon, 27 m² »), **repérer un poste nouveau et proposer de l'ajouter** (« 3 postes de ce devis ne sont pas dans votre base — les ajouter ? »), remplir la base à partir de ses anciens PDF | **après le module**, comme toute action de l'agent : avec son journal, sa permission et sa limite (section 38). Le §0 point 6 — « aucune action IA dans ce module » — tient |

**Pourquoi la proposition des postes nouveaux attend l'agent.** Le premier jet la plaçait au lot 2, sans IA. Or sans IA on ne compare que le **texte exact** : chaque variante d'un même poste (« chape sèche avant carrelage collé », « création d'une chape sèche pour futur pose de carrelage ») serait proposée comme « nouvelle », et la base se remplirait exactement des variantes que la règle veut éviter. `DEVIS-DU-PROPRIETAIRE.md` §5 range cette proposition dans l'étage de l'agent ; elle y reste. Ce qui vaut dès le lot P, sans IA : **un poste nouveau ne s'ajoute jamais tout seul.**

Les règles qui la gardent « fidèle à l'artisan » (DEVIS-DU-PROPRIETAIRE.md §5) :

- **la phrase est rangée mot pour mot** ; l'agent ne la réécrit jamais en silence ;
- **la base est PRIVÉE** : `est_mon_entreprise()`, aucune politique pour `anon`, aucune lecture par l'administration ; elle entre dans `mes_donnees()` (c'est son tarif, donc une donnée sur lui pour un EI) et part avec le compte ;
- **elle ne contient aucune donnée de client** : ni nom, ni adresse, ni lien vers le carnet. Le lien vers le devis d'origine, nullable et en `on delete set null`, ne sert qu'à afficher « 50 €/m², devis 087 » ;
- si un poste porte un jour un taux par défaut, il ne s'applique qu'à l'**ajout** d'une ligne, jamais à un devis figé (§3.4, point 4).

Le §6 du plan (« L'agent qui RÉDIGE un devis : il n'existe aucune source de prix », l.2418) change aussi : la base de postes **sera** cette source — les prix de l'artisan, et eux seuls. L'agent qui propose une ligne viendra avec l'étage de la compréhension.

#### Le correcteur, en trois couches

1. **Pendant la frappe** : `autoCorrect` et `spellCheck` **actifs** sur les champs de description, **inactifs** sur les quantités et les prix ; `verifier-devis` le contrôle. Lot 1.
2. **Avant l'envoi**, l'agent relit le devis et **propose** ses corrections une par une. C'est une action IA : elle vient avec l'étage de la compréhension.
3. **Une correction acceptée corrige aussi la base** : la faute ne se corrige qu'une fois dans la vie de l'artisan. Avec la couche 2.

#### Les prix du marché : jamais dans ce module

L'agent ne donnera **jamais** un « prix du marché » tiré de la mémoire du modèle : un modèle n'a pas de prix fiables, datés ni régionaux, il produit un nombre plausible qui engagerait l'artisan. Une base de prix du bâtiment est une base de données protégée (CPI L341-1, L342-1) : rien ne s'intègre sans une **licence** de son éditeur, lue source par source ; le propriétaire doit nommer la base dont il parle. Le jour où elle existe : une **fourchette indicative**, sourcée et datée, **jamais insérée seule** dans un devis, jamais mélangée à la base personnelle.

#### Ce que `DONNEES-DES-ARTISANS.md` impose au devis

Ce document (commité, fait foi) porte sur une base commune future. Quatre de ses règles touchent **dès maintenant** la façon de construire le devis :

1. **Ranger de façon réutilisable, séparé du texte libre et des données du client** (RGPD art. 89.1 ; A-FAIRE.md, dernière section). C'est déjà la forme des colonnes que le devis imprime : quantité en nombre, unité en liste fermée, prix en centimes, date de remise, code postal du lieu d'exécution (qui donne la région).
   **Un conflit entre deux règles écrites, sur la catégorie de métier, et il appartient au propriétaire.** A-FAIRE.md (dernière section, point 1) fait une **exigence** de ranger un poste avec son unité, son prix, sa date, sa région **et sa catégorie de métier** ; `DONNEES-DES-ARTISANS.md` (§2.1, §7) cite aussi le métier. La règle du projet, elle, refuse une colonne sans lecteur. Deux options :
   - **(a) aucune colonne** : le métier se déduira plus tard des métiers de la fiche, avec le cahier des charges de la base. Simple, mais approximatif pour un artisan qui a plusieurs métiers ;
   - **(b) une colonne métier sur la ligne de la base de postes**, qui a un lecteur dès le premier jour : le filtre de la suggestion pendant la frappe, pour un artisan qui a plusieurs métiers.
   À trancher avec lui avant le lot P (10.8, « À trancher plus tard »). Le premier jet tranchait pour (a) sans le dire : c'est corrigé. **Tranché au lot P le 23/10 (Q1) : (a), aucune colonne métier** — 10.17.
2. **Jamais de prix conseillé.** L'agent peut montrer à l'artisan **ses propres** prix ; il n'écrit jamais « le prix à mettre est X », ne propose jamais de « s'aligner », ne pré-remplit jamais un devis avec le prix d'un autre (lignes directrices horizontales 2023, points 397 et 402). Un devis n'affiche jamais le prix d'un autre artisan.
3. **Les données des clients ne servent jamais pour le compte d'Opus.** Opus en est le sous-traitant (10.3) : un prix signé est une donnée du client, et le réutiliser pour une base, même « anonymisé », est exactement ce que la CNIL a sanctionné le 11/12/2025.
4. **Le propriétaire, du métier, ne doit pas lire les prix individuels des autres artisans**, administrateur compris : aucune fonction `admin_*` ne lit `devis`, `devis_lignes`, `devis_tva` ni la base de postes, et `verifier-devis` le refuse. **Limite à dire** : le propriétaire détient l'éditeur SQL de Supabase, qui lit tout ; la « séparation réelle » de §5.2 n'est pas tenue par ce module. `DONNEES-DES-ARTISANS.md` §7 (décision 3) veut qu'elle se décide **avant le module devis** : elle devient un préalable (10.7).

#### Trois modèles au lieu de cinq

> « On pourrait proposer au client trois sortes de mise en page et il choisit, insérer son logo, etc. »

Le §5 en prévoyait **cinq**. **Trois, c'est mieux pour commencer** : chaque modèle se vérifie, s'imprime et s'entretient, et un quatrième s'ajoute le jour où un artisan le demande. La règle ne change pas : **un seul contenu, trois habillages**, aucun ne peut retirer une mention, et `verifier-devis` compare le texte extrait des **trois** modèles sur les **deux** gabarits (`etablissement`, `hors_etablissement`).

| | modèle | à qui il parle |
|---|---|---|
| 1 | **Classique** — inspiré de ses devis : logo au centre, tableau à quatre colonnes, bandeaux gris, lignes alternées, titres de pièce centrés | l'artisan qui veut retrouver ce qu'il faisait |
| 2 | **Épuré** — beaucoup de blanc, un seul filet sous chaque pièce, les totaux en grand | la rénovation haut de gamme |
| 3 | **Compact** — petites marges, descriptions sur toute la largeur | les gros devis : cinquante lignes en deux pages au lieu de quatre |

Le **logo** s'envoie une fois, dans « Mon entreprise » (lot 0), et s'imprime sur les trois. Les bandeaux et lignes alternées du Classique sont des **fonds** : ils dépendent de `print-color-adjust` (10.4) et se jugent sur l'iPhone. L'en-tête répété à chaque page et « Page 2 sur 4 », que ses devis portaient, **ne peuvent pas être promis sur iPhone** (WebKit, 10.4). Ce que ses devis faisaient mal, Opus le rend impossible : un montant jamais coupé en « ##### », toujours deux décimales, « Total HT » écrit, un tableau par taux, « Page … sur … » en français quand il existe.

À trancher plus tard, pas maintenant : une **couleur d'accent** au choix (et comment la garder lisible en noir et blanc) et Oswald en base64, au lot 5 ; le **format du numéro**, avant le lot 2 — le plan dit `DEV-2026-0001`, stocké et non configurable (l.784) ; ses devis utilisaient « 087/026 ». Un format unique pour tous, jamais un format au choix de chaque artisan.

### 10.7 L'ordre des lots, corrigé, et les amendements intégrés

**Avant tout**, trois préalables. Ils ne changent pas l'ordre des lots ; ils décident **sur quel compte** on essaie, **si un devis réel** pourra un jour sortir, et **qui peut lire quoi** :

1. les deux premières questions du tour 1 (10.8) — le statut du propriétaire et l'accord du frère ;
2. le sort du badge du compte de test en attendant cet accord (10.5 : retrait proposé) ;
3. **la séparation de `DONNEES-DES-ARTISANS.md` §5.2** : qui peut lire les prix individuels, éditeur SQL compris, et qui fera tourner un jour le calcul des fourchettes. Ce document veut qu'elle se décide **avant le module devis** (§7, décision 3). Elle n'est pas posée comme une question à choix dans 10.8 — c'est une décision d'organisation, pas quatre options —, mais **aucun prix d'un autre artisan n'est rangé avant qu'elle soit prise**. Le seul autre artisan, aujourd'hui, est son frère.

Ensuite, l'ordre **0 → 1 → P → 2 → 3 → 4 → 5** (et 6, conditionnel) **tient** ; le régime de TVA et le moment de la signature (tour 2) décident toujours de l'inversion des lots 2 et 3. Ce qui bouge :

- **Lot 0** : rétréci (10.1). La moitié qui bloque n'est plus l'identité, mais assurances, médiateur, régime de TVA, garanties, modalités et frais. La réponse sur les tarifs (tour 1) décide de la façon de ranger la fiche, avant de l'écrire. Le logo y entre, pour les trois modèles.
- **Lot 1** **(FAIT le 23/10/2026 — 10.16 ; la main-d'œuvre y est un drapeau SANS contrainte d'unité)** : la forme d'une ligne (10.6) se décide avant la table ; et quatre décisions de schéma deviennent urgentes parce qu'elles sont imprimées ou contrôlées : unité en liste fermée, main-d'œuvre horaire ou forfait, lieu d'exécution structuré, taux en centièmes de point avec la formule `(base * taux + 5000) / 10000`. La réponse sur les gros chantiers (tour 1) décide des colonnes de la table `devis`.
- **Lot P — la base de postes** **(FAIT le 25/10/2026 — 10.17 ; aucune colonne métier, tranché le 23/10)** (10.6) : nouveau, sans risque juridique, entièrement vérifiable ici. La colonne métier s'y tranche avant (10.6).
- **Lot 2** : reste le seul palier pénal, et il s'alourdit (question L. 221-2 12°, déchets, formulaire au mot, support durable, tout l'acompte et le « 8e jour », urgence par ligne). Il **commence par la reconstruction EAS** — `expo-print`, `expo-sharing`, et `react-native-svg` si la signature au doigt l'exige — et il imprime « Document d'essai — sans valeur » tant que `STATUT = 'essai'`.
- **Lot 4** : le mécanisme de purge est une décision, pas un acquis (10.3) ; la question des factures s'y repose.
- **Lot 5** : trois modèles au lieu de cinq.

**Une seule autorité pour ce qui bloque une remise.** Le premier jet répartissait les refus entre `emetteur_incomplet()` (SQL), `mentions-devis.js` (JS) et `verifier-devis`. Or plusieurs nouveaux blocages ne dépendent pas de l'émetteur : le médiateur dépend du **client** (consommateur ou non), les déchets de la **nature des travaux**, le délai obligatoire du **moment de conclusion**, l'attestation des **lignes**. Ils ne peuvent pas vivre dans `emetteur_incomplet()`. Et la première correction proposait un « miroir JS » de la règle, ce qui la faisait écrire deux fois dans la phrase même qui l'interdisait.

> **L'autorité est la base, et la règle s'y écrit UNE fois.** Une fonction de lecture des motifs — `motifs_refus_remise(uuid)`, par exemple — rend la liste de ce qui manque dans **une seule** valeur (`text[]` ou `jsonb`) ; `emetteur_incomplet()` en est une partie. `preparer_remise_devis(uuid)` l'appelle et **refuse** avec un message qui nomme ce qui manque, champ par champ, comme le plan l'écrit (l.793-795). L'écran interroge la même fonction pour dire « prêt » ou non avant l'appui : il ne recopie pas la règle — deux écritures « se désaligneraient », et l'écran dirait « prêt » devant un refus (l.1933-1937).
>
> **Jamais une colonne par motif.** La signature de `preparer_remise_devis` est déclarée définitive (l.2464) : une colonne de retour par motif rendrait impossible l'ajout d'un motif au lot 3 sans `drop function`, que le connecteur refuse. Une liste dans une seule valeur s'allonge sans changer de forme.
>
> **Un miroir JS n'existe que pour le mode démonstration**, où il n'y a pas de base — c'est la seule raison qui justifie celui de `verifier-filtre`. Il est dit comme tel, et éprouvé sur les mêmes cas que les essais SQL. `mentions-devis.js` décrit les mentions, il ne décide de rien.

**Le lien avec une urgence (SOS)** suit la doctrine de `source` (§3.7) : `'urgence'` ajoutée à `devis_source_check` (l.1421-1428) ; `sos_request_id` nullable, en `on delete set null` ; écrit par « Faire le devis » sur une urgence ; lu dès le premier jour par la liste des devis (« depuis une urgence du … ») et par le contrôle du marqueur d'urgence par ligne. **Il n'est jamais exigé pour marquer une ligne urgente** : une urgence peut arriver par téléphone. La propriété de `verifier-devis` tient : aucune colonne `not null` autre que `pro_id` et `client_id`.

**Le lot des clauses** (idée 2, après le lot 2) entre dans le plan avec ses amendements, désormais **décidés** :

- le §2.0 est amendé : son « aucune formule à cocher » vise l'**obligatoire**. Une bibliothèque de clauses **facultatives** est permise, avec un champ `obligatoire` toujours `false` et contrôlé, un catalogue JS sans import, et un drapeau `EDITEUR.clausesRelues` qui reste à `false` tant que personne n'a relu ;
- au §3.4, les clauses retenues partent dans une **table fille `devis_clauses`** (clé, version, titre, texte entier), une ligne par clause, figée avec le devis et ajoutée à `mes_donnees()`. Jamais une colonne de l'instantané ;
- l'avenant est livré avec les clauses ; la liste des sujets interdits couvre toute la liste noire et toute la liste grise (10.3) ; les pénalités de retard et l'indemnité de 40 € suivent la qualité du destinataire, pas une clause.

**La contrainte sur le SIRET** demandée par SIRET-ET-CLAUSES.md:683-689 est **dépassée** par la section 45.

**Écran de saisie** (CONCURRENCE-DEVIS §4 ; le plan reste prioritaire en cas de conflit). Adopté :

- lire en liste, éditer en carte, **pièce par pièce** ; aucun tableau, aucun défilement horizontal (contrôlé) ;
- Inter `tabular-nums` aligné à droite pour tout chiffre. Revérifié dans les `.ttf` : Oswald n'a ni chiffres tabulaires ni espace fine U+202F ;
- virgule et point acceptés dans les montants.

À concilier sur cet écran :

- total « qui court » pendant la frappe (l.2025-2026) ou total recalculé quand on quitte un champ : **le second**, pour ne pas redessiner l'écran à chaque chiffre ;
- `montants.js` ou `devis.js` : **un seul fichier**, `src/lib/devis.js`, qui pose le séparateur de milliers lui-même **[corrigé au lot 1, le 23/10 : les deux fonctions de montant vivent dans `src/lib/centimes.js`, qui n'importe rien, et `devis.js` les importe — une règle ne s'écrit qu'à UN endroit (C8, 10.16)]** ;
- le sous-total par zone ou par pièce : calculé depuis les titres (10.6), imprimé ou non selon la décision du lot 1.

« En faire un devis » ne préremplit que la description (le plan l'emporte sur CONCURRENCE-DEVIS.md:158-166) ; l'adresse vient du carnet de clients.

Erreurs à corriger dans les annexes :

- l'icône `Info` **est** utilisée (`LegalScreen.js:19, 73`) ;
- le n° de TVA est verrouillé, puisqu'il vit dans `entreprise_registre`, et non « modifiable à la main » ;
- « dès le premier euro » ne vaut que pour le dépannage, la réparation et l'entretien.

### 10.8 Les questions au propriétaire, en deux tours

Elles remplacent les listes du §8, de SIRET-ET-CLAUSES §7 et de CONCURRENCE-DEVIS §11. **On ne lui demande plus si l'entreprise du compte de test est la sienne** : il a répondu, c'est celle de son frère. Quatre questions au plus par tour, et celles qui débloquent le travail d'abord.

**Tour 1, maintenant :**

1. **Son statut** : a-t-il lui-même une entreprise immatriculée aujourd'hui ? Ses deux devis portent un nom d'entreprise et sont datés de septembre 2026 ; les notes du projet se contredisent. Elle décide si Opus pourra un jour préparer **ses** vrais devis — une fois sorti de l'essai.
2. **Son frère** : est-il d'accord, et utilisera-t-il ce compte lui-même ? Elle décide si l'on essaie avec son entreprise, si l'on prépare la remise du compte (avec ses CGU à lui), et ce que devient le badge en attendant.
3. **Les tarifs de dépannage** : affichés sur la fiche Opus, au choix de l'artisan, ou jamais ? C'est la seule réponse qui décide si des données sont **publiques ou privées**, donc la seule à obtenir avant le lot 0. Chaque option dit sa conséquence si une fiche Opus compte comme « espace en ligne » de l'artisan (10.3, « Incertain »).
4. **Les gros chantiers** (plusieurs réponses) : retenue de garantie, facturation à l'avancement, prix indexé sur un indice, ou aucune. Elle décide de la forme de la table `devis` avant le lot 1.

**Tour 2, selon les réponses :**

5. **Le régime de TVA** de l'entreprise dont on prépare les devis — la sienne si elle est active, sinon celle de son frère si celui-ci est d'accord (à lui demander). Sans « depuis quand » : la base date la déclaration. Rien n'est pré-coché.
6. **Quel compte** porte son entreprise, seulement s'il en a une active : son compte principal (le badge passera par l'éditeur SQL), ou un compte à part (client à retaper, badge à se décerner soi-même par le back-office).
7. **Le moment de la signature** : le jour du passage sur papier, le jour du passage par message, plus tard après réflexion, ou sans s'être déplacé. Sa réponse décide de la **priorité** entre les lots 2 et 3, **jamais du défaut**, qui reste le cas le plus protecteur, posé par devis.
8. **La conservation d'un devis jamais accepté** : un an, trois ans pour relancer, ou tant que le compte existe.

**Reportée** : la facture aux particuliers d'abord, ou tout ensemble. Sa réponse ne change rien au module devis (le principe du §8, l.2522) ; elle se repose à la fin du lot 4, quand l'ordre des modules se décidera, et reste dans A-FAIRE.md avec son échéance (01/09/2027).

**Retirées :**

- l'ancienne question 2 (attestation) : la première moitié est mesurée (une attestation, sur le compte de test) ; la seconde devient un **choix de conception** — refuser, avec une sortie qui explique et laisse une trace, quand une ligne relève de la construction (10.3) —, et non une obligation « tranchée par le droit » ;
- l'ancienne question 3 (médiateur) : le droit tranche, la mention est obligatoire sur un devis à un consommateur. Ce qui reste, adhérer à un médiateur référencé, est une démarche de l'entreprise qui émettra des devis réels, pas une question.

**Ne sont pas des questions au propriétaire**, mais des questions **par devis**, posées à l'artisan dans l'écran : le moment de conclusion (`lieu_conclusion`) et « construction neuve ou transformation importante ? » (10.3), toutes deux avec le cas le plus exigeant par défaut.

**À trancher plus tard, avec lui** : la colonne métier de la base de postes (10.6, options a et b — avant le lot P ; **tranché au lot P le 23/10 : aucune**, 10.17) ; le format du numéro (avant le lot 2) ; la couleur d'accent et Oswald en base64 (lot 5) ; le nom de la base de prix dont il parle (avant toute lecture de ses conditions) ; et la séparation de `DONNEES-DES-ARTISANS.md` §5.2, préalable du module (10.7).

### 10.9 Lignes à corriger quand le plan sera reposé

La liste reprend **aussi** les lignes déjà citées dans les tableaux de 10.3, pour qu'elle suffise seule le jour où le plan sera reposé.

Dans ce plan :

- l.31, 69, 141-152, 161-162, 656, 1956, 2547 (« … sur 7 », « 0 attestation sur 7 ») : 8 fiches et non 7, et une attestation existe, sur le compte de test ;
- l.39-40 (`expo-print` « fourni dans Expo Go ») et l.1251-1257 (Expo Go) ;
- l.42, 58, 2293-2295, 2315-2410 (« cinq modèles » → trois) ;
- l.53 (« 0 des 11 colonnes ») ;
- l.64-74 et l.2520-2667 (les questions, remplacées par 10.8) ; l.68-69 contre l.2526 et l.2545 (questions 1 et 2 contradictoires) ;
- l.79, 679, 2671 (« ni SIRET ni assurance décennale ») : à reformuler selon le statut du propriétaire (tour 1) ; aujourd'hui, le seul SIRET d'Opus est celui de son frère ;
- l.129-143 (colonnes du §1) ;
- l.188-190, 1792-1795, 2466 (point d'insertion : « entre 7692 et 7693 » → avant le séparateur de la section 42) ;
- l.225-226, 359-360, 1603 (R. 111-2) ;
- l.315-323 et l.2086-2087 (« `lieu_conclusion` ne doit pas avoir ce défaut-là » ; « défaut `hors_etablissement`, à confirmer par la question 7 ») : le défaut ne dépend plus de la réponse du propriétaire, il reste le cas le plus protecteur, posé par devis ;
- l.351 et l.532-538 (« six informations pour TOUT devis » ; un drapeau par métier décide du devis obligatoire) ;
- l.400-405 (urgence : elle lève aussi l'interdiction de paiement de 7 jours, par ligne) ;
- l.434-462 (« plus de / au moins deux ans » : établi dans la loi) ;
- l.509-517 (arrhes) ;
- l.570-573 et 696 (médiateur) ;
- l.580-584 (franchise) ;
- l.599-608 (CIBS) ;
- l.616-620 et 1212 (arrondi) ; l.1157 et 2040-2043 (formule en millièmes → centièmes de point, sept cas réécrits, plus un cas à 1,05 %) — **l.1157 et 2040-2043 corrigées sur place le 23/10/2026 (10.16)** ;
- l.639-640 (devis non accepté : au moins un an pour les services à la personne) ;
- l.692 (palier 1) ;
- l.784 (format du numéro, à trancher) ;
- l.1125-1127 (conservation) ;
- l.1270-1276 et 2481 (raison de la branche web) ;
- l.1393-1398 (envoi en deux pièces) ;
- l.1421-1428 (`devis_source_check` reçoit `'urgence'`, et `sos_request_id`) ;
- l.1702 (`thead`) ;
- l.1919-1922 (bouton SIRET) ;
- l.1974-1981 (contenu de la coupe du lot 0 : l'identité est faite, ce qui bloque change) ;
- l.2025-2026 (total « qui court » → recalculé quand on quitte un champ) — **corrigées sur place le 23/10/2026 (10.16)** ;
- l.2032-2034 et l.2419 (pas de table `ouvrages`) → la base de postes, lot P (10.6) ; l.2418 (l'agent qui rédige : « aucune source de prix ») ;
- l.2122-2131 (acompte, désormais au lot 2) ;
- l.2177-2181 (trois cases de certification → une phrase) ;
- l.2182-2185 (autoliquidation) ;
- l.2241-2243 (`mention_accord`) ;
- l.2426 (exclusion de la construction neuve) → une question par devis, « non » par défaut, qui revoit cette exclusion (10.3) ;
- l.2430 (§6, `siret`) ;
- l.2589-2599 (question 5) ;
- l.2668-2686 (« Et une chose qui n'est pas une question ») : à récrire pour le compte du frère, les trois conditions et le badge de 10.5.

Ajoutées le 19/10/2026, par l'audit de l'addendum QR (10.15) :

- l.888 (le figeage) : une clé `on delete set null` doit pouvoir passer **à vide** sur un devis remis, et à rien d'autre (D11) ;
- l.1400-1406 (l'espace `devis` « sans politique `update` ni `delete` ») : faux tant que les deux règles générales du stockage existent — le lot sécurité (S) les referme d'abord (D7) ;
- l.1427 et l.3288 (`demande_id`) → `quote_request_id` (D2) ;
- l.1462-1464 et l.3199 (la propriété de `verifier-devis`) → la règle en trois parties de D4 ;
- l.2297-2313 (lot 6, « tarifs publics, conditionnel ») : remplacé par le lot T (10.14) ;
- l.3396 (« un espace privé, comme `documents` ») → « dans l'espace `devis` » (D8).

Dans les annexes :

- SIRET-ET-CLAUSES.md:240-247, 294-300, 530-531, 683-689 ;
- CONCURRENCE-DEVIS.md:421-422, 441-443, 453, 458-467, 520-521, 581 ;
- DEVIS-DU-PROPRIETAIRE.md:179 (« Acompte à la signature ») : contraire au droit hors établissement (10.3).

### 10.10 Ce qui n'a PAS été vérifié

- **Le statut du propriétaire** (entreprise active, en création, fermée, ou jamais immatriculée) et **l'accord de son frère** : posés, sans réponse au 17/10.
- **La nature de la pièce d'existence** du compte de test (Kbis, avis Sirene ou attestation RNE) : la colonne ne le dit pas.
- **Aucun texte n'a été lu sur Légifrance** (403). Les codes viennent des données LEGI/JORF de la DILA, jusqu'au 16/10/2026 au soir, ou de `codes.droit.org` (non officiel) ; rien du JO du 17/10. L'art. 6 de l'arrêté du 17/03/2015 n'est connu que par un extrait de moteur de recherche. Les arrêts de la Cour de cassation du 20/12/2023 et du 05/03/2026 ne sont connus que par des commentaires. Les fiches DGCCRF n'ont pas pu être lues du tout (403).
- Non trouvés au 16/10 : le décret de l'art. L. 216-33 et l'arrêté de l'art. L. 216-14. Aucun décret de report de la facture électronique n'a été trouvé, sans qu'on puisse l'exclure. Le PLF 2027 n'a pas été lu. Les 250 € d'e-reporting de 2027 peuvent être corrigés par une loi. **Le contenu de la « solution dédiée » de l'art. 242 nonies G (décret 2026-677)** n'a pas été lu.
- Les normes AFNOR XP Z12-012 à 014, payantes, n'ont pas été lues ; les codes rec20 sont à vérifier dans l'annexe 7 des spécifications.
- **Rien n'a été essayé sur l'iPhone** : la taille réelle de page, l'en-tête répété, les fonds (bande, lignes alternées du Classique), les polices en base64 et l'échelle px/pt ont été lus dans le code natif, jamais exécutés.
- **Le comportement d'`expo-print` au chargement** (appelle-t-il `requireNativeModule` dès l'import ?) : le paquet n'est pas installé. Et la fluidité d'un trait de signature dessiné en segments de `View`, à mesurer si l'on écarte `react-native-svg`.
- **Le mécanisme de purge n'existe pas** : `pg_cron` et `pg_net` sont disponibles mais non installés ; rien n'a été choisi.
- Le format de `entreprise_registre.adresse` ; la date de fin de la décision d'adéquation britannique ; la date française du portefeuille européen d'identité ; l'existence d'une convention d'assistance mutuelle France–Royaume-Uni au sens de LPF L. 102 C.
- La forme exacte de la ligne de devis (valeurs du type de ligne, fourniture « sans objet », rattachement à la pièce) : à trancher en écrivant le lot 1, pas ici. **[Tranchée au lot 1 le 21/10, écrite ici le 23/10 : 10.6 et 10.16.]**
- **La séparation exigée par `DONNEES-DES-ARTISANS.md` §5.2** n'est pas tenue contre l'éditeur SQL de Supabase, que le propriétaire détient : seul l'accès par l'application est fermé. C'est un préalable (10.7), pas encore décidé.
- La fonction des motifs de refus (10.7) est un principe : son nom et la forme exacte de sa valeur (`text[]` ou `jsonb`) se décident au lot 2.
- Les numéros de ligne de `schema.sql` cités ici l'ont été sur le commit bd8b47c ; ils bougeront à la prochaine section — d'où les noms d'objets.
- Les questions à poser à un comptable (fourniture et pose = services ; plafond en activité mixte ; jour anniversaire ; L. 123-22 pour un micro-entrepreneur) et à un juriste (10.3, « Incertain », dont « transformation importante », l'attestation pour un dépannage, l'« espace en ligne dédié » et le régime « à distance »).
- Les chiffres de la vraie base sont des comptages du 17/10, ceux de la critique et de la contre-vérification compris (administrateurs, `journal_admin`, extensions, `sirens_reserves`, colonne `gele`) ; aucun contenu n'a été lu.

### 10.11 Ce qui sort du devis, et attend ailleurs

Trouvé en écrivant cette mise à jour, mais hors du module. Chaque point est aussi reporté dans `docs/A-FAIRE.md` (« Le devis — ce qui l'attend en dehors du module ») ; c'est là qu'il se coche.

1. Badge du compte de test (entreprise du frère) : il a été décerné par le seul administrateur via le back-office (journal_admin : 1 ligne pro_verifie), sur des pièces que l'administrateur a lui-même déposées depuis un compte qu'il a ouvert, sans le titulaire. Décision proposée : le retirer jusqu'à l'accord du frère par admin_verifier_pro(p_pro, false, false), jamais par admin_retirer_entreprise (qui réserverait le SIREN dans sirens_reserves) ; ou le garder en le disant ouvertement. Le retrait ne gêne aucun essai (emetteur_incomplet() ne lit pas verifie).
2. Garde du badge pour un second compte de la même personne : admin_verifier_pro (garde if p_pro = moi) ne voit pas un second compte. Décider ouvertement si une règle est nécessaire, et l'écrire dans CLAUDE.md comme limite connue.
3. Mettre à jour CLAUDE.md : « Expo Go, seul moyen de test du propriétaire » (l.7186-7187) et « prebuild, que ce projet ne fait jamais puisqu'il tourne dans Expo Go » (l.157) sont faux depuis le 15/10 (build de développement, expo-dev-client, eas.json development et preview) ; ajouter que l'entreprise du compte pro de test est celle du frère du propriétaire, avec les trois conditions (accord, aucun devis réel sauf émis par le frère, transmission du compte avec ses propres CGU) et le sort du badge.
4. Mettre à jour CLAUDE.md « Le propriétaire n'a PAS de société ni de SIRET » (29/09) contre « micro-entrepreneur » (04/10), dès sa réponse au tour 1 sur son statut ; corriger aussi DONNEES-DES-ARTISANS.md §7 point 3 en conséquence.
5. Avant toute remise du compte de test au frère : aucun écran ne permet de changer l'adresse de connexion ni le mot de passe (aucun updateUser pour l'e-mail ou le mot de passe dans src/, aucune réinitialisation) ; et l'acceptation des CGU du compte (users.cgu_version, cgu_acceptees_le) est celle du propriétaire. Construire cette porte, prévoir que le frère accepte lui-même les CGU (nouvelle date), ou décider comment la remise se fait.
6. Les 3 fiches vérifiées sans aucune entreprise rattachée (badges posés sur des SIRET jamais lus au répertoire Sirene) : retirer ou garder ces badges. Le retrait passe par admin_verifier_pro(p_pro, false, false) ; aucune entreprise n'étant rattachée, aucun SIREN n'est réservé (admin_retirer_entreprise refuserait d'ailleurs : « Cette fiche n'a aucune entreprise rattachée »).
7. Contrat de sous-traitance RGPD du carnet de clients (art. 28) à partir des clauses types de la Commission (décision 2021/915), annexes I à IV, et corriger legal.js:690-694 (« on ne peut pas écrire ce contrat ») ; décider qui est le sous-traitant tant que l'éditeur est un particulier.
8. Registre des traitements de sous-traitant (RGPD art. 30.2), dû dès aujourd'hui pour le carnet de clients (modèles publiés par la CNIL).
9. Réécrire et faire relire, avant les premiers vrais utilisateurs, les passages de legal.js listés par DONNEES-DES-ARTISANS.md §4.2 (l.626, 754, 397-402, 499-503, 643-653), et apprendre ce nouvel état à verifier-legal.
10. Préalable du module devis (DONNEES-DES-ARTISANS.md §7, décision 3) : décider comment tenir la séparation exigée par §5.2 (le propriétaire, du métier, ne doit pas lire les prix individuels des autres artisans) alors qu'il détient l'éditeur SQL de Supabase, et qui fera tourner le calcul des fourchettes. Aucun prix d'un autre artisan (aujourd'hui, celui du frère) n'est rangé avant.
11. Recopier mot pour mot depuis Légifrance, avec le navigateur du propriétaire, les citations prioritaires avant qu'elles s'affichent : arrêté du 24/01/2017 (dont l'art. 3, « tout espace de communication en ligne dédié »), annexe à R. 221-1 (formulaire de rétractation), arrêté du 17/03/2015 art. 6, mention 293 B ; lire aussi le contenu de la « solution dédiée » de l'art. 242 nonies G (décret 2026-677).
12. Décider d'une migration au SDK 58 (sorti le 15/10/2026), avant ou après la reconstruction EAS du module devis.
13. Corriger les annexes : CONCURRENCE-DEVIS.md (lexique acompte/arrhes l.421-422, plateformes l.458-467 et 581, ETI l.453, icône Info, n° de TVA verrouillé, « dès le premier euro ») et SIRET-ET-CLAUSES.md (l.240-247, 294-300, 530-531, 683-689) ; et DEVIS-DU-PROPRIETAIRE.md:179 (« Acompte à la signature », contraire au droit hors établissement).
14. Mettre à jour docs/A-FAIRE.md : la question des factures (particuliers d'abord ou tout ensemble) est reportée à la fin du lot 4, avec l'échéance du 01/09/2027 ; et le conflit sur la catégorie de métier (exigence de la dernière section contre « pas de colonne sans lecteur ») est à trancher avec le propriétaire avant la base de postes. **Tranché au lot P le 23/10 : aucune colonne métier (10.17).**
15. Démarches de l'entreprise qui émettra de vrais devis (celle du propriétaire s'il en a une active, sinon celle du frère s'il utilise Opus) : adhérer à un médiateur référencé par la CECMC avant le premier devis réel à un particulier ; choisir une plateforme agréée de réception des factures électroniques (obligatoire depuis le 01/09/2026, même en franchise) — à dire aussi au frère, puisque son entreprise est concernée indépendamment d'Opus.
16. Demander au propriétaire le nom et le lien de la base de prix du bâtiment dont il parle (DEVIS-DU-PROPRIETAIRE.md §6.2), pour lire ses conditions de licence avant toute intégration.
17. Changement d'entreprise d'un compte pro (nouveau SIREN, par exemple passage d'une micro-entreprise à une société) : aucune porte n'existe (OP008/OP009) ; cela touchera la numérotation et l'instantané des devis.

### 10.12 Les réponses du propriétaire (17/10/2026, le soir même)

Posées par l'outil de questions, dans l'ordre de 10.8. La question « Quel
compte » est tombée : elle supposait une entreprise active.

| question | réponse | ce qu'elle décide |
|---|---|---|
| **Son statut** | « Plus maintenant, fermée » | Il **a eu** une entreprise ; il n'en a plus. Ses deux devis ne servent que de modèle de mise en page (`DEVIS-DU-PROPRIETAIRE.md`), et aucun vrai devis ne partira à son nom. Les notes contradictoires (« ni société ni SIRET » au 29/09, « micro-entrepreneur » au 04/10) sont corrigées dans `CLAUDE.md`. Rien ne change pour l'**éditeur** d'Opus : `STATUT = 'essai'`. |
| **Son frère** | « D'accord, il l'utilisera » | Les trois conditions de 10.5 deviennent un **calendrier** : on construit et on essaie avec ce compte, puis on le lui **remet**. Le badge reste (le titulaire est d'accord) ; à la remise, le frère confirme lui-même ses pièces. **Et le jour où il s'en sert pour de vrai, Opus a son premier utilisateur réel** — voir plus bas. |
| **Les tarifs de dépannage** | « Au choix de l'artisan » | Lot 0 : un interrupteur « afficher mes tarifs sur ma fiche », éteint par défaut ; tant qu'il est éteint, les tarifs ne servent qu'aux devis. L'écran dit, à l'artisan qui fait du dépannage, que la fiche Opus pourrait compter comme une de ses pages en ligne (10.3, « Incertain »). **Une seule liste de tarifs** : le taux horaire et le déplacement du SOS (`sos_availability.horaire`, `.deplacement`) deviennent les mêmes chiffres, et leur `0` par défaut devient `null` — un `null` n'est pas un `0` (§2.0). |
| **Les gros chantiers** | « Retenue de garantie » et « Facturer à l'avancement » | Lot 1, avant de créer la table `devis` : la retenue de garantie est **imprimée** (son taux, et quand la somme est rendue) — elle a donc un lecteur dès le lot 2. La facturation à l'avancement, elle, se lit sur les **factures** (situations successives) : le devis n'en porte rien de plus que ce qu'il imprime, et le reste naît avec le module facture, comme le veut 10.3. Le plafond légal de la retenue (5 %, loi n° 71-584 du 16/07/1971) et son remplacement possible par une caution sont **à relire sur Légifrance** avant d'écrire la moindre phrase. Le prix indexé n'est pas demandé : rien n'est construit pour lui. |
| **Le régime de TVA** (de l'entreprise du frère) | « Non, franchise en base » | Ses devis sortent sans TVA, avec « TVA non applicable, article 293 B du CGI ». **L'ordre 0 → 1 → P → 2 → 3 est confirmé** : le document peut sortir avant la gestion complète de la TVA. Le régime reste une **déclaration** de l'artisan dans « Mon entreprise », jamais une déduction : le jour de la remise, c'est le frère qui la fait. |
| **Le moment de la signature** | réponse libre, citée plus bas | Décrit ci-dessous : elle change la priorité de deux choses. |
| **La conservation d'un devis jamais accepté** | « Un an, puis effacé » | Lot 4 : purge à un an, et son mécanisme reste à construire (10.3) ; le paragraphe de la politique de confidentialité le dira. |

#### Comment ça se passe vraiment chez un artisan

> « On rencontre le client sur place, on fait un relevé de ce que veut le
> client. Plus tard on lui fait le devis, très souvent envoyé par e-mail. Très
> souvent le client qui accepte le retourne signé par e-mail. Des fois ça
> arrive de le faire en papier et le faire signer sur place, mais c'est très
> rare. »

C'est **exactement** le cas que le considérant 21 de la directive 2011/83 met
à part : une visite faite **seulement** pour mesurer, sans engagement, puis un
contrat conclu **plus tard**, à distance, sur la base du devis. Ce contrat
n'est **pas** hors établissement (le client a eu le temps de réfléchir), et il
n'est pas non plus à distance (la visite rompt l'« usage exclusif » des
techniques à distance, L. 221-1 1°). Conséquence, sous réserve d'un avis
juridique (10.10) : **pas de délai de rétractation, pas d'interdiction de
paiement avant le 8e jour** ; l'information de l'arrêté de 2017 (art. 4-I) et
de L. 111-1 reste due.

Ce que cela change au plan, **sans toucher au défaut** :

1. **Le moment se connaît à la REMISE, pas à la signature.** Ce qui compte,
   c'est que le devis soit préparé APRÈS la visite et envoyé plus tard ; la
   vitesse à laquelle le client signe ensuite n'y change rien. La question par
   devis (`lieu_conclusion`, 10.3) se pose donc au moment de remettre le devis.
   Le défaut reste le plus protecteur (« signé le jour de la sollicitation ») ;
   chez cet artisan, la réponse la plus fréquente sera l'autre, d'un appui,
   avec une trace datée. Le défaut ne dépend toujours pas de cette réponse :
   Opus sert plusieurs artisans, et le jour où le frère fait signer sur place,
   le cas protecteur doit être là.
2. **L'acceptation arrive par courriel, presque toujours.** Le lot 4 doit
   savoir écrire « accepté le …, par courriel » (ou « sur papier »), et
   **ranger la copie signée** que le client renvoie — c'est un document du
   client, donc un espace privé, comme `documents`. C'est cette copie, pas un
   tracé au doigt, qui sera la preuve habituelle.
3. **La signature au doigt passe au second plan.** Elle ne sert que dans le
   cas « très rare » du papier sur place, où le papier signé en deux
   exemplaires reste de toute façon la voie sûre (10.4). **`react-native-svg`
   n'entre donc PAS dans la reconstruction du lot 2** : un module natif de
   moins, `expo-print` et `expo-sharing` seulement.
4. **Ces devis acceptés par voie électronique se conservent dix ans** quand
   ils dépassent 120 € et s'adressent à un particulier (L. 213-1, 10.3,
   « Conservation ») : c'est désormais le cas **ordinaire**, pas l'exception.
   L'archive du lot 4 et le téléchargement proposé à la suppression du compte
   ne sont plus des détails.

#### Le premier utilisateur réel, et ce qu'il déclenche

Le frère va se servir d'Opus. Le jour où il enregistre un vrai client dans
son carnet ou remet un vrai devis, **Opus cesse d'être un essai** — et ce
n'est pas un réglage technique :

- le propriétaire devient **sous-traitant RGPD** des données des clients du
  frère (art. 28) : contrat de sous-traitance, registre des traitements
  (30.2), notification des violations. Son entreprise étant fermée, c'est
  **un particulier** qui tiendra ce rôle, et c'est à lui de décider s'il le
  tient tel quel ou s'il s'immatricule d'abord ;
- `STATUT` doit quitter `'essai'`, et `verifier-legal` refusera tant que le
  contrat (`contratSousTraitance`) et une adresse de contact relevée
  (`emailReleve`, la boîte IONOS) ne sont pas là ;
- la **remise du compte** demande deux portes qui n'existent pas : changer
  l'adresse de connexion et le mot de passe, et une nouvelle acceptation des
  CGU par le frère (10.5, condition 3).

Ces trois points rejoignent `docs/A-FAIRE.md` (« Le devis — ce qui l'attend
en dehors du module ») ; ils doivent être réglés **avant** la remise, pas
après.

### 10.13 Les réponses du 18/10/2026, sur le lot 0a

Posées par le cahier de réalisation du lot 0a (relu deux fois), avant de
construire :

| question | réponse | ce qu'elle change |
|---|---|---|
| la liste unique des tarifs (devis et SOS), dans le 0a ou à part ? | **à part, juste après le 0a** | le 0a range les frais de déplacement du devis dans `tarifs_pro`, privée, et ne touche pas le SOS ; deux chiffres de déplacement coexistent le temps de l'écart, et l'écran le dit. La fiche SOS à 0 € (« 0 – 0 € » affiché à un particulier) attend ce lot |
| la séparation du `DONNEES-DES-ARTISANS.md` §5.2 | **un engagement écrit** | aucun écran ne montre les prix d'un artisan à un autre ; l'éditeur s'engage, dans les conditions d'Opus, à ne pas les lire par l'éditeur SQL. La condition « aucun vrai prix d'un autre artisan » tombe : le frère pourra saisir les siens, lui-même |
| les trois règles plus strictes que la loi (cahier §1.5) | **seule la relecture du SIRET chaque année** est gardée | pas d'assurance exigée en général (la décennale due selon la ligne relève des lots 1-2) ; téléphone, e-mail, garanties, modalités, mention de l'assurance et n° de TVA au réel ne bloquent que face à un consommateur (motifs `conso_`) |
| le libellé quand l'artisan ne facture pas le déplacement | **« Déplacement offert »** | à la place de « Frais de déplacement : non facturés » |

### 10.14 Les décisions du 19/10/2026 — l'addendum QR, et le lot des tarifs

Le propriétaire a remis ce jour-là un addendum au cahier Visite, « QR &
Dossier Travaux Particulier » (`docs/ADDENDUM-QR-DOSSIER-TRAVAUX.md`, audité
dans `docs/AUDIT-ADDENDUM-QR.md`), avec une consigne : « Ne refais pas le
module devis à cause de ce document. »

| question | réponse | ce qu'elle décide |
|---|---|---|
| l'ordre | **finir le devis d'abord** | l'addendum ne s'ouvre qu'après le module devis ; le devis n'a besoin de rien de lui (audit §2) |
| les douze règles de l'audit | **les écrire avant le chiffrage** | 10.15, ci-dessous : du texte, aucune colonne |
| les quatre défauts existants (stockage, partenariats, `demande_reponses`, ville visible) | **un petit lot à part, avant le PDF** | un lot **S** (sécurité) entre P et 2 : le stockage d'abord, puisque l'espace `devis` en hériterait (D7). La ville et le code postal visibles restent une décision à lui poser à ce moment-là |
| répondre aux urgences sans afficher ses tarifs ? | **non : afficher est obligatoire** | un artisan n'apparaît dans le SOS que si ses tarifs sont affichés et suffisent à une estimation |
| qui lit les tarifs affichés ? | **les particuliers seulement** | une règle de lecture qui exige `not est_un_pro()` : aucun artisan ne lit ceux d'un autre par l'application — l'éditeur non plus, son compte est pro. **Limite dite au propriétaire** : un artisan peut ouvrir un second compte particulier avec une autre adresse ; c'est une barrière, pas un verrou |
| l'avis d'un avocat sur l'affichage | **un simple rappel**, pas un blocage | il rejoint la liste des questions au juriste (`A-FAIRE.md`), sans drapeau contrôlé |
| les forfaits d'un dépanneur | **plus tard** | ce lot ne range qu'un taux horaire, un décompte, une majoration, le prix du devis et les frais |
| la majoration de nuit et de week-end | **comme aujourd'hui** | 20 h – 7 h et le week-end, sur le déplacement comme sur les heures ; la carte le dit en toutes lettres |

L'ordre devient donc **T → 1 → P → S → 2 → 3 → 4 → 5**. Le lot T (les tarifs
réunis, devis et SOS) **remplace** le lot 6 conditionnel : la réponse du
17/10 (« au choix de l'artisan ») l'a rendu certain.

**Le lot T est FAIT le 20/10/2026** : construit, migré sur la vraie base,
essayé par le chemin de l'application (CLAUDE.md, « Les tarifs réunis —
lot T » ; le cahier qui l'a guidé : `docs/CAHIER-LOT-T.md`). Ce que le
lot 1 en attend est au §1.3 de ce cahier, **à deux corrections près** :

- le taux horaire est rangé en centimes, **TTC**, à **DEUX** états : `null`
  (non déclaré) ou un montant de 1 € à 1 000 €. Un taux n'a pas de 0,
  contrairement aux frais, à la majoration et au prix du devis, qui en ont
  trois. Le lot 1 le COPIE comme une valeur proposée et modifiable — jamais
  un lien ;
- la façon dont le DEVIS passe du TTC au HT au régime réel (et ce qu'il
  imprime en franchise) **se tranche avec le juriste avant le lot 2**
  (`A-FAIRE.md`, « Après le lot T »). D'ici là, le lot 1 propose une valeur
  et le dit sous le champ ; il ne fixe aucune règle de conversion.

Et l'engagement du 18/10 (10.13) **tient tel quel** : « aucun écran ne montre
les prix d'un artisan à un autre ». Les tarifs affichés vont aux particuliers,
jamais aux autres artisans.

### 10.15 Les douze règles venues de l'addendum (D1 à D12) — à tenir dès le lot 1

Le détail, les preuves et les mesures sont dans `docs/AUDIT-ADDENDUM-QR.md`
§2 ; les scripts qui les prouvent, dans `docs/audit-addendum/`. **Aucune ne
crée de colonne** : « aucune colonne sans lecteur » (3.12) vaut aussi pour
l'avenir. Ce qu'elles font, c'est garantir qu'**aucune décision du devis ne
ferme la porte** au QR, au Dossier Travaux ni à la Visite — et ces décisions
se prennent avant d'écrire la table.

| | la règle | lot | pourquoi, en une ligne |
|---|---|---|---|
| **D1** | le client d'un devis est **une fiche du carnet**, jamais un compte ; pas de `compte_id` ni de `particulier_id` « pour plus tard » | 1 | le client sans compte est aujourd'hui le cas ordinaire ; le QR particulier reliera la fiche à un compte, à côté |
| **D2** | le lien vers une demande de devis s'appelle **`quote_request_id`**, pas `demande_id` | 1 | `demande_reponses.demande_id` pointe déjà `demandes`, l'« annonce » de l'addendum : même nom, deux choses, aucune alerte. Va avec `sos_request_id` |
| **D3** | **le QR n'est jamais une origine** : `source` dit le geste qui a ouvert le brouillon (`'manuelle'` pour un client scanné hier) ; les liens d'origine sont facultatifs et indépendants. **Aucune contrainte « origine = demande ⇒ lien présent »** | 1, 2 | mesuré : la demande supprimée, la base vide le lien, la contrainte refuse, et **la suppression de compte du particulier échoue** à cause du devis d'un pro |
| **D4** | **l'indépendance en trois parties**, contrôlée par `verifier-devis` livré avec la table : (a) aucune clé étrangère obligatoire, sauf vers l'entreprise, sauf le lien d'une ligne vers son devis, sauf le client **à la remise** ; (b) aucune contrainte ne rend obligatoire un lien d'origine ; (c) **aucun motif de refus de remise ne nomme une origine** | 1 | la formule de l.1462-1464 laisse passer une contrainte nommée « à la remise, il faut un dossier » ; celle de l.3199 refuserait `statut`. Et aucun index unique sur (pro, client) : un client a plusieurs projets |
| **D5** | un rattachement posé **après** la remise ne vit **pas** dans la ligne `devis` (il vit sur l'autre objet ou dans une table de liaison) ; **aucune règle d'accès ne découle d'un lien posé sur un devis** | écrite maintenant, tenue au 2 | le figeage remet toute case nouvelle à l'ancienne valeur, **sans erreur** : le précédent de `posts.chantier_id` (« 204 et rien ne change ») |
| **D6** | **le particulier ne lit jamais la ligne `devis`** : il reçoit une **copie** du document, posée par un geste du pro, et plus tard une fonction qui lui rend le seul **statut** (numéro, date, statut, entreprise). Aucune règle sur `devis`, `devis_lignes`, `devis_tva` ni sur l'espace `devis` ne passe par une relation ou un partage | 1 à 4 | une règle RLS ouvre toute la ligne ; Opus efface tout au départ du pro ; et les conditions d'utilisation promettent que les prix ne vont qu'au client à qui le devis est adressé |
| **D7** | **avant l'espace `devis`**, refermer les deux règles générales du stockage, espace par espace, après mesure (lot S) ; puis un contrôle : aucune règle ne permet de modifier ou supprimer un fichier de l'espace `devis` | S, avant 2 | les règles s'additionnent : l'absence de politique sur l'espace ne ferme rien tant qu'une règle générale la couvre |
| **D8** | le PDF et la copie signée vont **dans l'espace `devis`**, jamais dans `documents` ; tout nouvel espace entre dans la liste du ménage de compte (`supabase/functions/compte/index.ts`) | 2, 4 | l'administration lit tout `documents`, pour les Kbis |
| **D9** | aucune valeur d'un futur dossier n'entre dans le **statut** du devis ; un écran de particulier ne traduit jamais `remis` par « reçu » tant qu'Opus ne livre pas lui-même le document | 4 | « retenu » est une décision du particulier ; `accepte` est un fait juridique tracé par le pro |
| **D10** | « Refaire » recopie les liens d'origine sur la version 2 | 4 | sinon la version 2 perd sa demande ou son urgence d'origine |
| **D11** | dans le figeage, **une clé dont la nouvelle valeur est vide sort de la garde** : sur un devis remis, une clé `on delete set null` peut passer à vide, et à rien d'autre. Un essai **compte les clés pendantes** après suppression de la fiche, de la demande et du compte du particulier | écrite maintenant, tenue au 2 | mesuré sans elle : un devis remis garde une fiche et une demande qui n'existent plus, sans erreur, et une restauration de sauvegarde échoue. Avec elle : vide, total intact, redirection ignorée |
| **D12** | ce dont dépend un devis remis ou une acceptation (copie signée, plan) est **copié** dans l'espace du pro au moment où ça compte | 2, 4 | la suppression de compte du particulier emporte ses conversations et ses fichiers ; ce qui doit rester reste **parce qu'il a été copié**, pas parce qu'un accès survit |

**Ce qui n'est PAS décidé ici**, et attend l'ouverture de l'addendum (audit
§5) : le vocabulaire et une seule orthographe des états (`accepte`, jamais
`acceptee`, dans les nouvelles tables), le jeton du QR, la relation et son
journal, et le repointage d'un devis remis vers une autre fiche lors d'une
fusion de doublons — D11 l'interdit aujourd'hui ; l'ouvrir serait un choix
explicite, plus tard, avec son essai.

### 10.16 Le lot 1 — FAIT le 23/10/2026, et les réponses du 21/10

**Le lot 1 est FAIT le 23/10/2026** : construit les 21 et 22/10 (quatre
commits : `546944d` le calcul, `f3b4168` la section 49 de `schema.sql`,
`fde72f9` les écrans, `b1926d9` deux retouches trouvées par la relecture de
la migration), **migré sur la vraie base le 22/10 vers 23 h 43** (heure de
Paris), validé par le propriétaire dans la fenêtre du connecteur, puis
**essayé par le chemin de l'application** les 22 et 23/10, avec trois comptes
jetables supprimés ensuite (CLAUDE.md, « Le chiffrage — lot 1 » ; le cahier
qui l'a guidé : `docs/CAHIER-LOT-1.md`, sa version 2 du 21/10, les réponses
du propriétaire en tête). En cas de désaccord entre ce cahier et le code,
c'est le code et CLAUDE.md qui disent vrai.

**Ce qu'il livre, en une phrase.** Un artisan ouvre « Mes devis » depuis son
profil — ou « Faire un devis » sur la fiche d'un client, sur une demande ou
une urgence qu'il a acceptée —, tape son chiffrage pièce par pièce (zones,
pièces, postes, réserves, options, « Offert »), chaque ligne s'enregistre
quand il la quitte et dit si elle l'est, et le total — HT, la TVA par taux,
TTC — est **celui que la base a calculé**, pas celui du téléphone. **Il ne
sort RIEN** : ni numéro, ni PDF, ni envoi au client. L'écran le dit en tête :
« Chiffrage — ce brouillon ne part pas encore. »

#### Les réponses du 21/10/2026

Posées par le cahier du lot 1 (son §9), avant de construire :

| question | réponse | ce qu'elle change |
|---|---|---|
| **Q1** — au régime réel, l'écran propose-t-il le choix du taux (20 %, 10 %, 5,5 %) ligne par ligne dès le lot 1 ? | **oui, dès maintenant** | rien de pré-coché sur la première ligne ; chaque ligne suivante reprend le taux de la précédente **du même type** (un poste celui du dernier poste, une option celui de la dernière option). En franchise : aucun taux affiché, la mention « TVA non applicable, article 293 B du CGI » à la place de la TVA. Régime non déclaré : seulement des titres et des réserves, et un bandeau qui ouvre « Mon entreprise ». Un régime qui n'a pas pu être LU ne s'affiche **jamais** « non déclaré ». **Ce n'est tenu que par l'écran** : la base accepte une ligne chiffrée quel que soit le régime, et c'est le refus de remise du lot 2 qui le tiendra. Rien ne part : le lot 2 refusera d'envoyer un devis au régime réel tant que le lot 3 n'aura pas ajouté la certification du client pour 10 % et 5,5 % |
| **Q2** — faut-il d'autres unités que m², mètre linéaire, m³, unité, heure et forfait ? | **ajouter « jour »** | **sept** clés en liste fermée : `m2`, `m`, `m3`, `u`, `h`, `jour`, `forfait` (`devis_ligne_unite_check`). L'écran montre « m linéaire » et « unité » ; **« ml » ne s'affiche ni ne s'enregistre jamais**. La liste « m², ml, m³, u, h, forfait… » de 10.3 est corrigée sur place (l.2921) |
| **Q3** — voulez-vous pouvoir faire une remise sur un devis ? (une remise COMMERCIALE, une réduction de prix — à ne pas confondre avec la remise du devis au client, qui est le lot 2) | **une remise sur le TOTAL du devis** | elle se construit **au lot 2, avant le PDF** — pas au lot 1. Elle demande une règle de répartition entre les taux, écrite et éprouvée avant la première colonne : sans la règle du plus fort reste, l'exemple de la lecture argent donne 334 au lieu de 333. Le prix avant remise reste écrit (BOFiP §220). Le lot 1 ne pose **aucune colonne de remise** — aucune colonne sans lecteur — et rien qui l'empêche : `devis_tva` est recalculée **en entier** par la base à chaque écriture, donc une remise répartie s'y ajoutera sans réécrire de devis |
| **Q4** — vos devis déduisent-ils parfois une prime (CEE, une aide) du prix à payer ? | **jamais** | rien à prévoir. Et le chiffrage refuse toute ligne négative |

Et une cinquième, qui ne change pas le plan : **le compte sur lequel il
essaiera le chiffrage sur son iPhone** — son compte principal, confirmé par
lui le 21/10. **Essayé par lui le 23/10 au soir : « tout fonctionne »**, sans
réponse point par point (CLAUDE.md, « Le chiffrage — lot 1 », « Essayé sur
l'iPhone »).

#### Ce que le lot 1 a CHANGÉ au plan

Le cahier a relevé les contradictions de ce plan et les a tranchées une par
une (son §1.5, numérotées C1 à C22). Voici celles qui changent ce que le plan
dit — plus C21, qui tranche une recommandation faite avant le cahier, pas une
ligne du plan. **Les lignes citées ont été corrigées SUR PLACE le 23/10**,
chacune marquée « corrigé au lot 1 », sans ajouter ni retirer de ligne :

| | ce que disait le plan | ce qui vaut depuis le lot 1 | dans ce plan |
|---|---|---|---|
| **C1** | la TVA en millièmes, `(base*taux + 500)/1000` | **centièmes de point**, `(base * taux + 5000) / 10000`, écrite UNE fois en SQL (`devis_tva_de()`, section 49.1) et une fois en JavaScript (`devis.js`), en entiers, demi vers le haut, le taux borné de 0 à 9000. Les deux formules coïncident sur tous les taux que l'ancienne sait écrire. 1,05 % se calcule, mais **une ligne à 1,05 % est refusée au lot 1** : la liste est `0, 550, 1000, 2000`, et se refait au lot 3 | corrigé l.1157 et l.2043 |
| **C2** | le total « qui court » pendant la frappe | recalculé quand on **quitte** un champ, et c'est celui de la **base** ; entre-temps, la dernière valeur sûre | corrigé l.2026 |
| **C3** | « l'écran ne propose pas encore les trois taux » | les trois, au choix, dès le lot 1 (Q1) | renvoi en tête du lot 1, l.1994 ; corrigé l.2007 et l.2174 |
| **C6** | « une remise sur un montant impair », cas d'essai du lot 1 | **aucune remise** au lot 1 ; « Offert » et le refus d'une ligne négative à la place. La remise sur le total entre au **lot 2**, avant le PDF (Q3) | corrigé l.2041 |
| **C7** | la retenue de garantie, « on ne la construit pas » | **une colonne**, `retenue_garantie_centiemes` : `null` = aucune, sinon de 0,01 % à 5 % ; aucun montant rangé ; une phrase qui ne dit **jamais** « un an » sans la réserve de l'opposition du client | — |
| **C19** | « Offert » = une ligne à zéro centime + un drapeau | le drapeau met le **total** de la ligne à 0 et **garde le prix** ; un prix de 0 seulement avec « Offert ». C'est un sur-ensemble de l'ancienne forme : tout ce qu'elle acceptait passe encore | corrigé l.3090 |
| **C20** | refus d'une ligne de main-d'œuvre « qui n'a ni l'un ni l'autre » (horaire ou forfait) | **aucune contrainte d'unité** : « ni l'un ni l'autre » est déjà impossible, et l'arrêté range le prix au m² parmi les prix forfaitaires. Le drapeau `main_oeuvre` **propose** l'heure (si aucune unité n'est choisie) ; le taux horaire déclaré est proposé dans un prix vide en franchise, seulement **montré** sous le champ au régime réel, jamais converti (C9 du cahier) ; il n'interdit rien | corrigé l.2896, l.2922 et l.3000 |
| **C22** | la clé `'devis'` de l'export, « les demandes reçues », renommée `'demandes_de_devis_recues'` | elle porte les demandes **des deux côtés** : renommée **`'demandes_de_devis'`**, comme `'rappels'` et `'urgences'` | corrigé l.1786-1787 |
| C5 | le lien SOS rangé au lot 2 ; `demande_id` | `'urgence'` et `sos_request_id` entrent au lot 1 (« Faire un devis » se pose aussi sur une urgence acceptée) ; le lien s'appelle `quote_request_id` (D2). Le marqueur d'urgence **par ligne** reste au lot 2 | corrigé l.3000 et l.3002 (10.7, l.3199, décrivait déjà le lien, sans le ranger dans un lot) |
| C8 | `devis.js` « qui n'importe RIEN » et « pose le séparateur de milliers lui-même » | les deux fonctions de montant déménagent dans `src/lib/centimes.js`, qui n'importe rien ; `devis.js` n'importe que lui et deux fonctions de date d'`entreprise.js`. Une règle ne s'écrit qu'à UN endroit | corrigé l.3218 |
| C11 | la section s'insère « entre 7692 et 7693 » | après la fin de la section 48, avant l'export RGPD (section 42) | 10.9 le disait déjà |
| C13 | « tout code nouveau prend OP011 et suivants » | **OP013 à OP017** sont pris par le lot 1 (plus bas) ; **OP003 reste réservé au devis remis**, lot 2 | — |
| C21 | *(pas le plan : une recommandation de la lecture droit, un document de travail d'avant le cahier)* « `null` ou une catégorie » pour une ligne sans TVA | **`0`** = aucune TVA facturée sur cette ligne. La raison — la franchise aujourd'hui — est portée par le **régime**, que le lot 2 figera sur le devis, jamais par la ligne. Jamais affiché « 0 % » | — |

> **Deux formules qui se ressemblent au caractère près ne font pas la même
> chose.** `(q × p + 500) / 1000` existe toujours dans le lot 1 : c'est le
> total d'une LIGNE, la quantité étant rangée en millièmes
> (`devis_total_ligne()`). La TVA, elle, est `(base * taux + 5000) / 10000`.
> Recopiée dans le recalcul de la base, l'ancienne forme de la ligne 1157
> serait refusée par `devis_tva_arrondi_check`, qui exige le résultat de
> `devis_tva_de()` ; dans `devis.js`, les 44 cas de `verifier-devis`
> rougiraient. Mais recopiée dans un calcul que ni l'une ni l'autre ne
> rejoue — un futur affichage, le PDF —, elle donnerait un devis faux sans
> un mot.

#### Ce que la construction a ajouté, et que le lot 2 doit savoir

Le cahier prévoyait déjà OP013, OP014, le verrou `for no key update` et la
liste du point 6 (son §1.3). Ce que ni le plan ni le cahier ne prévoyaient,
les relectures l'ont rendu nécessaire : l'horloge (OP015, OP016), OP017,
`mes_entreprises()` et les deux listes fermées. Pour les points 1 à 5, c'est
**la base** qui tient la règle.

1. **Une horloge par devis, contre la requête qui arrive en retard.** Une
   écriture reçue par le serveur dont la réponse se perd s'exécute quand même ;
   passée après la suivante, une valeur ancienne écrasait la nouvelle, sans
   erreur. D'où une colonne `generation` sur `devis` et `devis_lignes` : chaque
   écriture du téléphone porte un numéro qui ne fait que monter, et la base
   refuse celle qui ne dépasse pas l'horloge du devis (**OP015**) ou dont le
   numéro est hors bornes (**OP016**). Prouvé à deux sessions. **Le contrat
   que le lot 2 doit tenir**, écrit en 49.5 bis : un ordre = une ligne ; une
   ligne se modifie par `update`, **jamais par `upsert`** ; **une migration
   qui récrit un devis fait monter son horloge**.

   > **Une écriture qui part dans l'ordre n'arrive pas forcément dans
   > l'ordre.** La file du téléphone n'envoie qu'une requête à la fois ; un
   > ordre de passage ne se répare quand même que là où les requêtes passent :
   > dans la base.

2. **Trois autres refus, chacun avec sa phrase en français.** **OP013** : un
   devis ne peut pas pointer la fiche client, la demande ou l'urgence d'un
   autre artisan — une vérification de clé étrangère ignore la RLS (mesuré).
   **OP014** : 500 lignes au plus par devis, comptées sous le verrou du
   recalcul. **OP017** : 20 devis au plus par artisan et par demande ou
   urgence (un nombre à confirmer avec le propriétaire, écrit une seule fois,
   dans la base) — sans lui, des brouillons rattachés à la demande d'un particulier
   faisaient échouer la suppression de son compte au-delà du délai de 8 s de
   la base (mesuré).
3. **Le recalcul complet se fait sous un verrou `for no key update`** :
   `for update` interbloquait deux insertions (mesuré). Et `devis_tva` ne
   s'écrit que par la base.
4. **L'appartenance passe par `mes_entreprises()`, en sous-requête non
   corrélée**, et non par `est_mon_entreprise(pro_id)` écrite dans chaque
   politique : à 100 000 lignes à soi, l'export RGPD est passé de 10,6 s à
   2,25 s. `est_mon_entreprise()` reste la seule à **décider**.
5. **L'essai 49 tient deux listes FERMÉES de fonctions `security definer`**
   (24 qu'un client peut appeler, 27 qu'il ne peut pas, relevées le 22/10 sur
   une base locale). **Toute section future qui ajoute une `definer` doit les
   mettre à jour, avec sa raison** — c'est voulu : une `definer` nouvelle,
   quels que soient son nom et son corps, fait rougir l'une ou l'autre.
6. **Ce qui attend le lot 2, avec son lecteur** (le cahier, §1.3) : la
   qualité du destinataire ; le caractère payant de CE devis ; les déchets de
   chantier (une ligne `poste` ou une estimation hors totaux, **jamais** une
   colonne de montant que le recalcul ignorerait) ; le marqueur « relève de la
   construction » ; le marqueur d'urgence par ligne ; l'acompte ; un
   avertissement au franchisé dont le devis dépasse à lui seul 41 250 € ;
   **le TTC « option comprise », imprimé face à un consommateur, calculé sur
   l'union des lignes, jamais par addition de deux totaux** ; et l'instantané,
   dont **le régime de TVA figé sur le devis** — c'est lui, et plus jamais
   `emetteur`, qui dira ce que veut dire une ligne à `0`.

#### Vérifié, et comment

| | relevé |
|---|---|
| `schema.sql` rejoué deux fois sur une base neuve ; l'essai 49 joué deux fois | 0 erreur ; **169 valeurs justes sur 169, 74 refus**, chacun rattaché à sa cause |
| les 44 cas d'argent, JavaScript contre PostgreSQL | **0 écart** |
| `npm run verifier` ; `verifier-devis` ; `npm run mesure-devis` (au navigateur, en démonstration, en vrais événements tactiles) | **50 contrôles**, code 0 ; **292 ✔** ; **186 ✔** |
| la migration, simulée deux fois sur une imitation de la vraie base (le schéma qu'elle avait réellement reçu, `5897ef3`) | rejouable ; empreinte du catalogue : **1 321 lignes identiques** à une base neuve |
| appliquée le 22/10, sans un ordre qui commence par `drop`, `delete` ou `truncate` ; relevée après, en lecture seule | les 17 groupes d'empreinte des trois tables identiques à la simulation ; **0** fonction de déclencheur appelable par `anon` ou `authenticated` |
| un devis de 4 postes à 2 taux, une réserve, une option, un « Offert » | un `POST` par ligne, **aucun en double, aucun upsert** ; TTC **1 516,30 €** à l'écran, en base et par `devis.js` : **identique au centime** |
| le même après un rechargement complet | il revient de la base, « Offert » avec son prix |
| un prix de 0 sans « Offert » | **aucune requête** ; une phrase qui dit d'utiliser l'interrupteur |
| la route d'écriture coupée | « Non enregistrée — Réessayer » ; le pied garde la dernière valeur sûre ; la barre du bas ne fait pas quitter l'écran |
| le régime de TVA illisible | « n'a pas pu être lu… Réessayer » — **jamais « non déclaré »** |
| la mémoire des prix (l'engagement du 18/10) | filtrée par SES devis côté base ; un autre artisan avec le même filtre : **`[]`** |
| la clé publiable seule, sur les trois tables | **401 · 42501** ×3 |
| un autre artisan, juste après la lecture du devis | **`[]`** ×3 ; écrire une ligne : **403** ; modifier ou supprimer : **rien de changé** |
| l'artisan écrit dans `devis_tva` | **403** ×3 |
| un total envoyé à la main ; la fiche d'un autre ; une demande inventée | le **vrai** total relu ; **OP013** ; **OP013** |
| 500 lignes d'un coup dans un devis qui en a une ; le 21ᵉ brouillon d'une demande | **OP014**, aucune insérée ; **OP017** |
| l'export RGPD (`mes_donnees()`) | `devis_emis`, `devis_lignes`, `devis_tva`, `demandes_de_devis` ; **la clé `devis` a disparu** |
| la fiche du client supprimée ; le particulier supprime son compte | les devis **restent** : seuls les liens passent à vide, le lieu, l'objet et les totaux intacts (D3) |
| les règles de l'addendum (10.15) | la relecture de sécurité de l'étape 3 — premier tour, 21/10, avant les corrections — dit D1, D3, D4, D6 et D11 tenues ; D2 est le nom de la colonne. Le second tour n'a jamais été rendu (plus bas) |
| le ménage | les trois comptes supprimés par le chemin de l'application ; **0 devis** en base |

#### Ce qui n'a PAS été vérifié

- **Le détail du toucher sur l'iPhone** : le clavier, la virgule du pavé
  décimal, le pouce sur une ligne, VoiceOver sur la carte d'une ligne.
  L'essai sur son compte principal (Q5) a eu lieu le 23/10 au soir — « tout
  fonctionne » —, sans réponse point par point. Son brouillon, relevé par sa
  forme, prouve que le téléphone fabrique l'identifiant d'une ligne (six
  UUID v4) ; aucune de ses quantités n'a de décimale, donc la virgule n'est
  pas prouvée.
- **Hermes** n'a fait tourner ni `devis.js` ni `file-ecriture.js` : les calculs
  ont tourné sous `node`.
- **Le verrou à deux sessions n'a été éprouvé que sur PostgreSQL 16** ; la
  vraie base est en 17.6. La documentation dit les règles identiques : aucune
  mesure sur 17.
- **« jour » n'est dans aucun des 44 cas partagés** (`cas-devis.json`) :
  l'essai 49 insère une ligne dans chacune des sept unités, mais aucun cas ne
  le tient des deux côtés.
- **Le droit, au juriste** (`docs/A-FAIRE.md`) : l'assiette de la retenue (HT
  ou TTC) et une retenue sur un paiement unique ; ce qu'un franchisé écrit à la
  place de « HT et TTC » ; le taux horaire TTC face à un prix unitaire HT ; le
  taux d'une ligne de frais sur un devis à deux taux ; **la qualification d'un
  « Offert »** (remise ou prestation à prix nul) et ce que le devis en imprime.
  Les primes déduites, elles, sont réglées : jamais (Q4).
- **La relecture de sécurité du second tour de la base n'a jamais été
  rendue** : le conteneur a redémarré pendant qu'elle tournait. Ses deux
  points importants du premier tour sont corrigés et mesurés ; la relecture
  SQL du second tour a rejoué les cascades, OP014 et OP017, et celle des
  essais les acteurs adverses — mais aucune relecture de sécurité n'a relu
  l'état final.
- **Aucun vrai devis** : la vraie base en compte 0 après le ménage.

#### Ce qui reste ouvert

- En franchise, la carte « Mes devis » et le pied disent « Total » et
  additionnent la TVA des lignes qui en portent encore. Un bandeau le
  signale ; c'est le refus de remise du lot 2 qui tiendra la cohérence entre
  régime et taux — **aujourd'hui, seul l'écran la tient**.
- La suppression de compte d'un artisan paie un recalcul par ligne de devis
  (1,6 s à 100 000 lignes, sur PostgreSQL 16) : à remesurer sur la vraie base
  au lot 2.
- Quatre choix à confirmer avec le propriétaire : le plafond de 20 devis par
  demande ou par urgence (OP017) ; puis trois choix d'écran — l'origine d'une
  suggestion de la mémoire, nommée par sa date ; le titre de pièce affiché deux
  fois et les deux retours quand une carte est ouverte ; « Choisir dans mon
  carnet » sur deux lignes à 320 points.
- La ré-acceptation des conditions par les comptes existants n'existe
  toujours pas (`legal.js` est passé à `VERSION = '2026-10-22'`) : à construire
  avant que `STATUT` quitte `'essai'`.
- Pour le lot S, relevés en chemin : le `truncate` que `authenticated` garde
  sur `clients` ; un blocage qui ne cache pas une demande déjà reçue ; une
  classe de blancs recopiée sept fois dans quatre fonctions SQL, plus deux
  constantes JavaScript (relevé le 23/10 ; le cahier en prévoyait « au moins
  six fonctions ») ; un artisan qui peut récrire
  `client_id` et `description` d'une demande qui lui est adressée ; un artisan
  bloqué qui peut rattacher un nouveau devis à la demande du particulier qui
  l'a bloqué.

### 10.17 Le lot P — FAIT le 25/10/2026, et les réponses du 23/10 et du 25/10

**Le lot P est FAIT le 25/10/2026** : construit du 23 au 25/10 (commits
`92c3804` les étapes 0 à 6, `1144750` le parcours au navigateur, `7a8cc10` les
corrections des trois relectures, puis celui du 25/10 qui corrige le classement
des propositions et documente le lot), **migré sur la vraie base le 25/10 à
11 h 12** (heure de Paris), avec l'accord du propriétaire, puis **essayé par le
chemin de l'application** le même jour, avec trois comptes jetables supprimés
ensuite (CLAUDE.md, « La base de postes — lot P » ; le cahier qui l'a guidé :
`docs/CAHIER-LOT-P.md`, archivé avec en tête ce qui a changé depuis). En cas
de désaccord entre ce cahier et le code, c'est le code et CLAUDE.md qui disent
vrai.

**Ce qu'il livre, en une phrase.** Sur une ligne de devis qu'il a écrite,
l'artisan touche « Ajouter à ma base » : la phrase est rangée mot pour mot,
avec son unité et un prix de référence ; quand il tape une ligne, ses phrases
lui sont proposées — une par phrase, trois au plus, et sans IA les variantes
d'une même phrase (majuscules, accents, ponctuation, un s de pluriel) n'en font
qu'une — ; sous le prix d'une ligne qui correspond, sa référence, et, s'il met
autre chose, « c'est voulu ? ». **Rien ne sort**, et personne d'autre que lui ne
voit sa base.

#### Les réponses du 23/10/2026

Données après la lecture de la v2 du cahier ; plus aucune question du lot P
n'est restée ouverte.

| question | réponse | ce qu'elle change |
|---|---|---|
| construire le lot P ? | **« non on construit le lot p »** | il avait d'abord cru que la mémoire du lot 1 faisait déjà ce qu'il décrivait ; il voulait le prix de référence et l'écart |
| les variantes d'une même phrase | **mot pour mot** : « il faudrait arriver à reconnaître les phrases, parce que l'artisan pour le même travail a par exemple rajouté un s ; il ne faut pas qu'il y ait trop de propositions, ça pourrait nous perdre » | la **clé de rapprochement** (CLAUDE.md) : une proposition par phrase, jamais plus de trois, et « ce poste existe déjà » au lieu d'un doublon. Une AUTRE formulation n'est pas reconnue : c'est l'étage de l'agent |
| comment un poste entre dans la base | **d'un appui** (« Ajouter à ma base ») | jamais un ajout automatique ; la mémoire du lot 1 continue de tout retenir seule |
| **Q1** — une colonne métier sur un poste (10.6, options a et b) ? | **(a), aucune** | le métier se déduira plus tard des métiers de la fiche, avec le cahier des charges de la base ; le conflit de 10.6 et de `A-FAIRE.md` est tranché |
| **Q2** — la feuille d'ajout propose-t-elle le prix de la ligne ? | **oui, modifiable** | laissé vide, le prix « n'est pas fixé » : un `null` n'est pas un `0` |
| **Q3** — où voir la référence ? | **seulement dans la ligne ouverte en grand** | jamais dans la liste du devis : un client qui regarde l'écran ne la voit pas |
| **Q4** — créer un poste directement dans « Ma base » ? | **non** | un poste naît d'une ligne de devis ; « Ma base de postes » corrige et retire |

#### Les réponses du 25/10/2026

Posées juste avant la migration ; elles confirment les choix par défaut.

| question | réponse |
|---|---|
| **A** — « 10cm » et « 10 cm » sont-ils une seule phrase ? | **non, deux** (de même « BA13 » et « BA 13 ») |
| **B** — de deux variantes d'une même phrase, laquelle proposer ? | **la plus récente** |

#### Ce que le lot P a CHANGÉ au plan

Corrigé sur place le 25/10, marqué « tranché au lot P » : la colonne métier
(10.6, 10.8, la liste des lots, la ligne 14 de 10.9), et `A-FAIRE.md`.

| | ce que disait le plan | ce qui vaut depuis le lot P |
|---|---|---|
| la colonne métier | « à trancher avec lui avant le lot P » | **aucune** (Q1) |
| la base de postes, 10.6 | « une table privée de postes : la phrase mot pour mot, l'unité, la fourniture, le prix de référence » | la même, plus la **main-d'œuvre**, la **date du prix posée par la base**, le **devis d'origine** (une clé composée, `on delete set null`) et une **clé de rapprochement** que seule la base calcule ; **1 000 postes au plus** (`OP018`) |
| l'ajout d'un appui | « Ajouter à ma base » sur une ligne écrite | tel quel ; une phrase déjà rangée sous une autre forme (un s, une majuscule) répond « ce poste existe déjà » et propose de changer la référence |

#### Ce que la construction a ajouté, et que le lot 2 doit savoir

- **`OP018` est pris** (le plafond de postes) ; le prochain code libre est
  `OP019`. `OP003` reste réservé au devis remis.
- **La clé de rapprochement est une règle à DEUX écritures**, et la SQL est
  ENGENDRÉE depuis `src/lib/rapprochement.js` (`npm run
  generer-rapprochement`). La changer demande la procédure de la section 50.0 :
  remplacer la fonction ne recalcule aucune clé rangée.
- **La base de postes est PRIVÉE et le reste.** Aucune fonction `admin_*` ne
  la lit, aucun écran ne la montre à un autre, et les textes légaux étendent
  l'engagement de l'éditeur à ses phrases (`VERSION = '2026-10-24'`). Le
  contrat de sous-traitance, quand il existera, devra la couvrir : un artisan
  peut y laisser le nom d'un client malgré l'avertissement de la feuille.
- **Le devis reste la seule vérité de ce qu'il dit.** Une ligne garde sa phrase
  et son prix même si le poste change ou disparaît ; le poste ne sert qu'à
  proposer et à comparer. Le lot 2 n'imprime jamais un prix de référence.
- **L'agent** qui proposera une ligne (l'étage de la compréhension) aura ici
  sa source de prix : les prix de l'artisan, et eux seuls.

#### Ce qui n'a pas été vérifié

Rien sur l'iPhone ; la clé sous Hermes ; « tout Unicode » sur la vraie base
d'un seul bloc (le plan de base et les plans 1 et 14 seulement) ; aucun vrai
poste d'un vrai artisan. Le détail est dans CLAUDE.md.

#### La suite

Le prochain lot de l'ordre **T → 1 → P → S → 2** est **S**, le petit lot de
sécurité (`docs/AUDIT-ADDENDUM-QR.md`) : les règles générales du stockage
d'abord, avant l'espace des PDF de devis du lot 2.
