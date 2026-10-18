# Le comparateur de matériaux — comment le construire, et comment le faire vivre

> Votre question, le 17/10/2026 : « c'est sur le comparateur de matériaux qu'il faudra savoir comment le créer et le gérer pour que ça fonctionne ».

**Si vous ne lisez que trois parties : le §1 (en une page), le §3 (comment le gérer) et le §5 (vos décisions).** La seconde moitié (§6 à §10) explique le pourquoi : le marché, les sources de prix, les données, le droit et l'argent. Les mots techniques sont expliqués à la fin (annexe A). Les noms de fichiers, de fonctions et de sections du code sont rangés à part, pour celui qui construira (annexe B).

Cette étude date du 17/10/2026. Elle s'appuie sur :

- deux recherches faites le même jour : « qui le fait déjà, comment, et avec quel modèle économique », puis « le droit, la facture électronique et la mécanique des données » ;
- `docs/SOURCES-DONNEES-BTP.md`, versionné le même jour, qui annonce d'ailleurs la présente étude sous le nom `docs/COMPARATEUR-MATERIAUX.md` ;
- votre cahier des charges, surtout les §13 à §16 et le §27 (l'original PDF fait foi) ;
- ce que le dépôt contient déjà : `docs/A-FAIRE.md`, `docs/DONNEES-DES-ARTISANS.md`, `docs/PLAN-DEVIS.md` §10, `docs/DEVIS-DU-PROPRIETAIRE.md` §5 et §6, le code de la Place des pros et `supabase/schema.sql`.

**Aucune ligne de code n'a été écrite ni modifiée.** La vraie base n'a été interrogée qu'une fois, le 18/10/2026, et en nombres seulement, sans lire une seule identité (question 2 du §1). Ce n'est pas un avis d'avocat.

Les marques employées :

- **[certain]** : lu dans le texte ou sur la page source ;
- **[interprétation]** : une lecture raisonnable, qu'aucun texte ne tranche mot pour mot ;
- **[avocat]** : la réponse dépend de clauses ou de faits, et seul un professionnel du droit peut la donner ;
- **NON VÉRIFIÉ** : la source n'a pas pu être ouverte, ou rien n'a été trouvé.

**Aucun prix de matériau n'est écrit dans cette étude.** Là où un exemple en demanderait un, il porte une lettre (X €). Écrire un chiffre plausible serait faire exactement ce que le comparateur s'interdit. Les seuls montants cités sont ceux de services, d'abonnements, de conditions publiées ou de sanctions prévues par la loi, chacun avec sa source.

---

## 1. En une page

### Ce qu'est le comparateur d'Opus

**C'est une aide au devis, privée à chaque artisan.** Quand il prépare un devis, Opus regarde les lignes où la fourniture est comprise et fait la liste des matériaux. Puis il lui montre **ce qu'il sait de leurs prix chez SES fournisseurs** — son **négoce**, c'est-à-dire le magasin de matériaux où il achète :

- ce qu'il a acheté (ses factures) ;
- ce que ses fournisseurs lui ont répondu (ses demandes de prix) ;
- ses conditions négociées (ses remises, sa livraison offerte) ;
- et plus tard, les offres datées que des fournisseurs publient eux-mêmes sur Opus.

Chaque prix porte sa date, sa source et son unité. Ce qui manque est dit en clair. L'artisan décide, et il tape son prix lui-même.

**Presque tout cela est du calcul, pas de l'intelligence artificielle.** Retrouver un prix connu, convertir un sac en kilos, arrondir à la palette, calculer l'âge d'un prix : l'application et la base le font seules, sans appeler l'IA — donc sans limite d'appels, et sans rien pouvoir inventer. (Il faut quand même du réseau pour joindre la base : « sans IA » ne veut pas dire « hors ligne ».) L'agent n'intervient que là où il faut comprendre du texte : lire la photo d'une facture, reconnaître le même produit sous deux noms, préparer le texte d'une demande de prix. Ce sont les « deux étages » déjà retenus pour la base de postes (`DEVIS-DU-PROPRIETAIRE.md` §5).

### Ce qu'il n'est pas

| il n'est pas | pourquoi |
|---|---|
| un comparateur de tous les négoces de France | personne ne le fait en France pour le second œuvre : les **prix nets** (ceux que chaque artisan a négociés) restent derrière le compte de chacun (§6) |
| une boutique | Opus n'achète, ne stocke, ne livre et n'encaisse rien. Plusieurs places de marché qui l'ont fait se sont restructurées (§6, annexe C) |
| une source de « prix du marché » | les prix d'un artisan ne sont jamais montrés à un autre, et l'agent ne sort jamais un prix de sa mémoire |
| un robot qui lit les sites des négoces | interdit : l'atteinte au droit du producteur d'une base de données est punie de 3 ans de prison et 300 000 € d'amende (§9) |
| un conseil de prix de vente | il montre un coût d'achat ; le prix du devis reste celui que l'artisan écrit |

### Pourquoi il arrive en dernier — et pourquoi ce n'est pas un retard

L'ordre des modules arrêté le 07/10/2026 place les fournisseurs en **7e et dernier** : après les clients, les devis, les factures, le tableau de bord, l'agenda et les dépenses. Votre cahier des charges en fait la **phase 8**.

> **Sans factures d'achat, un comparateur n'a rien à comparer.** Et l'artisan n'importera pas ses factures « pour le comparateur » : il les rangera pour sa comptabilité, dans le module dépenses (§13 de votre cahier des charges). Le comparateur s'en nourrit au passage. C'est cette boucle qui le fera vivre, et c'est la vraie raison de l'ordre.

Conséquence à savoir : **pour un artisan qui arrive, le comparateur est vide** tant qu'il n'a pas importé de factures, saisi ses conditions ou envoyé une demande de prix (§3.1).

### Le créer, étape par étape

1. **Avec le module devis** (déjà prévu) : chaque ligne dit si la fourniture est comprise, et compte dans une unité choisie dans une liste fermée. Puis la base de postes de l'artisan, ses phrases et ses prix.
2. **À l'ouverture du module factures** : étudier le raccordement à une plateforme de facture électronique, qui apporterait un jour les factures d'achat sous forme de fichiers. C'est une décision de ce moment-là.
3. **Avec le module dépenses** : Opus lit les factures d'achat — une photo, un PDF, ou mieux le fichier de la facture électronique — et garde l'original.
4. **Avec le module fournisseurs** : « mes fournisseurs », « mes prix », les conditions, une liste rangée des matériaux, les conditionnements, la demande de prix, le tableau des fournitures d'un devis, et les comptes fournisseurs.
5. **Plus tard** : des accords écrits avec des éditeurs de tarifs et avec des négoces.

### Le gérer, en trois choses

- **qui entre comme fournisseur** : une entreprise trouvée active au répertoire Sirene (INSEE) par son SIRET, comme pour les artisans. Cela prouve que l'entreprise existe, pas que la personne qui tape le numéro en est le patron ;
- **une liste des matériaux qui s'enrichit de l'usage**, comme les spécialités des métiers ;
- **des prix qui vieillissent tout seuls à l'écran.**

Le reste est tenu par la base de données, sans intervention humaine : un prix sans date, sans unité ou sans source n'y entre pas. Et personne, vous compris, ne lit les prix d'un autre.

### Maintenant : une décision, et une situation à connaître

1. **La neutralité.** Un fournisseur pourra-t-il payer pour être mieux placé dans la comparaison ? Recommandation : **non**. Il pourra payer une annonce marquée « Annonce », jamais une place dans la liste des prix. C'est la seule décision qu'une conversation avec un premier négoce pourrait engager avant l'heure.
2. **Une situation actuelle.** Aujourd'hui, un négoce dont le SIRET est actif peut s'inscrire comme un artisan : rien ne trie les inscriptions selon l'activité (le code d'activité propose un métier, il ne bloque jamais — décision du 12/10). Il lit alors les demandes des particuliers.

   **Mesuré sur la vraie base le 18/10/2026, en nombres seulement** : 8 fiches professionnelles ; **0 annonce « Nouveauté fournisseur »** sur 4 annonces ; **une seule entreprise rattachée** par le SIRET — celle de votre frère —, et son code d'activité commence par **43** (travaux de construction spécialisés). Aucune ne porte un code de commerce (46 ou 47). Les sept autres fiches datent d'avant le SIRET et n'ont pas d'entreprise rattachée. Et le catalogue des métiers n'a aucun métier de négoce : un négoce qui s'inscrirait devrait se déclarer maçon ou plombier.

   **Aucun négoce n'est donc inscrit aujourd'hui.** Il reste à choisir entre attendre le module fournisseurs en le sachant, ou avancer le compte fournisseur (§5).

Tout le reste se décide au début des modules 3, 6 et 7. Les questions sont rangées au §5, avec leur moment.

---

## 2. Comment ça se passera, concrètement

Voici une scène, telle qu'elle pourra se passer **une fois le module fournisseurs construit**. Les prix sont des lettres, et les dates des exemples.

**1. Le devis.** Un maçon prépare un devis. Une ligne dit : « Élévation de murs en blocs béton 20 cm — 80 m² — **fourniture comprise** ». Une autre : « Chape — fourniture comprise ». Une troisième : « Pose de carrelage — **fourniture non comprise** ».

**2. Un bouton discret, pas une fenêtre qui s'ouvre toute seule.** Sur l'écran du devis, une ligne « Fournitures de ce devis » attend qu'on la touche. Elle se désactive dans les réglages. Votre cahier des charges le demande (§4 : des suggestions « utiles, regroupées et désactivables »), et le projet a déjà appris à ne pas insister (la fenêtre qui nomme l'agent se tait après trois refus). Seules les lignes « fourniture comprise » sont lues : la pose de carrelage est ignorée, c'est le client qui fournit.

**3. La liste des matériaux, sans rien inventer.** Passer de « 80 m² de mur » à « 800 blocs, X sacs de ciment, Y de sable » est un calcul de métré. Il ne se fait qu'avec l'une de ces trois choses :

- la composition que l'artisan a lui-même enregistrée pour ce poste (« pour 1 m² : 10 blocs… » — c'est son chiffre, pas celui d'Opus) ;
- les chiffres qu'il tape à cet instant ;
- une fiche technique qu'il fournit lui-même. L'agent peut l'aider à la lire, mais il **propose**, et l'artisan valide.

Sans l'une des trois, l'écran écrit : « **Quantité de mortier : à préciser.** » Le calcul est toujours affiché (« 80 m² × 10 blocs par m² = 800 blocs »). Et c'est une **estimation indicative, pas une étude technique** : votre cahier des charges l'exige (§16).

**4. Les prix que l'artisan connaît.** Pour « bloc béton creux 50 × 20 × 20, classe B40 », l'application trouve :

| fournisseur | prix | source | âge |
|---|---|---|---|
| Négoce A, agence de [commune] | X € la pièce | acheté le 12/09/2026 (date de la facture) | récent |
| Négoce B | Y € la palette de 60 | réponse du 03/10/2026, valable jusqu'au 02/11 | récent |
| Négoce C | Z € la pièce | acheté le 15/02/2026 (date de la facture) | **ancien — à vérifier** |

Le bloc de Négoce B est d'une autre marque. La ligne dit donc « **comparable** (même dimension, même classe), validé par vous le… ». Un rapprochement entre deux marques ne se fait jamais sans l'accord de l'artisan, et il ne se fait qu'une fois.

Pourquoi « acheté le » et pas « payé le » : la date connue est celle de la facture. Opus ne sait pas quand l'artisan a payé, et une étiquette ne doit jamais afficher une date qu'elle ne connaît pas.

**5. Les unités et le conditionnement.** Négoce B vend à la palette de 60. 800 blocs font 13,3 palettes, donc **14 palettes, soit 840 blocs**. Un fournisseur qui vend la même dimension par palettes de 70 en livrera **12 palettes**, soit 840 blocs aussi.

Ce n'est pas un exemple inventé : chez un seul fabricant, le même bloc 50 × 20 × 20 B40 se vend par palettes de 60 ou de 70 selon la référence. Pour le ciment, « le sac » ne suffit pas : chez un même cimentier, le sac de 25 kg se met par 64 sur une palette, celui de 35 kg par 42. L'application compare donc **au kilo**, en montrant aussi le prix du sac.

**6. Le transport, ou l'aveu qu'on ne le connaît pas.** Si l'artisan a saisi « livraison offerte à partir de X € chez Négoce A », l'application l'applique. Sinon : « **Livraison : coût inconnu.** » Pour le gros œuvre, ce n'est pas un détail.

**7. Une demande de prix, préparée.** « Le prix de Négoce C date de février. Envoyer une demande de prix à A, B et C pour 840 blocs, livrés à [commune] le… ? » La liste est prête, mais **c'est l'artisan qui l'envoie**, à chacun séparément.

**8. Un coût, jamais un prix de vente.** En bas de la ligne : « Fournitures de cette ligne : entre X et Y € HT selon le fournisseur — 3 prix connus, dont 1 à vérifier ; transport inconnu chez B. Liste non exhaustive : seulement vos fournisseurs. » **Rien n'est écrit dans le devis.** Le prix de la ligne reste celui que l'artisan tape.

**9. Une trace, quand l'agent a servi.** Si l'agent a aidé (lire une facture, rattacher un produit, rédiger la demande de prix), l'action est inscrite à son journal : l'action, le type de ce sur quoi elle porte (« un devis »), et le nom du critère de tri employé. **Jamais un prix, jamais un fournisseur.** Et elle apparaît dans l'écran « Mon agent » dès le jour où elle existe : le contrôle du projet refuse une action d'IA sans sa ligne sur cet écran.

### Ce que fait l'application seule, et ce que fait l'agent

| | qui | ce qu'il fait | ce qu'il coûte |
|---|---|---|---|
| **étage 1** | l'application et la base, **sans IA** | retrouver les prix connus, convertir les unités, arrondir au conditionnement, appliquer la livraison offerte, calculer l'âge d'un prix, choisir la couleur, écrire la phrase qui dit ce qui manque | rien. Marche sans appeler l'IA, sans limite d'appels, et ne peut pas inventer : il ne ressort que ce que l'artisan a fourni |
| **étage 2** | l'agent | lire la photo d'une facture ou d'une réponse ; **proposer** le rattachement d'une désignation nouvelle à la liste des matériaux ; comprendre une dictée ; rédiger le texte d'une demande de prix ; aider à lire une fiche technique | un appel d'IA chaque fois, compté dans la limite de 60 appels par jour et par compte ; il peut se tromper, donc il propose et ne décide jamais |

> **Le tableau des prix est calculé et affiché par l'application : le modèle d'IA n'a pas besoin de voir les prix pour le déclencher.** On ne lui envoie un prix que si la tâche l'exige vraiment. Trois raisons : les prix nets d'un artisan sont très probablement un secret des affaires (§9) ; votre cahier des charges demande de n'envoyer à l'agent « uniquement le contexte nécessaire » (§22) ; et chaque appel compte dans une limite et coûte de l'argent. Si l'IA est en panne, l'étage 1 marche toujours.

### Ce qu'affiche une ligne quand il manque quelque chose

Sur le modèle d'un concurrent allemand, bobbie : une couleur, **et toujours une phrase**. La couleur ne porte jamais l'information seule : c'est une règle du projet, et un devis se photocopie en noir et blanc.

| situation | marque | la phrase |
|---|---|---|
| tout est connu, prix de moins de 3 mois | normale | « acheté le 12/09 chez A » |
| prix de 3 à 12 mois | orange | « Prix de février : à vérifier. » |
| prix de plus de 12 mois | rouge, **sorti de l'estimation** | « Prix de plus d'un an : il ne sert plus d'estimation. » Et la tendance de l'Insee à côté, si elle existe (§7.7) |
| transport inconnu | orange | « Livraison : coût inconnu chez B. » |
| conditionnement inconnu | rouge, aucune quantité à commander | « On ne sait pas combien de blocs contient une palette chez B. » |
| unité douteuse (un prix « au cent » lu comme un prix à la pièce ?) | rouge | « Quantité × prix ne donne pas le montant de la facture : à vérifier. » |
| produit d'une autre marque | normale, avec mention | « Comparable, pas identique. » |
| remise globale de la facture répartie sur les lignes | mention | « Remise de pied de facture répartie sur les lignes. » |
| aucun prix | aucune | « Aucun prix connu pour ce matériau. Envoyer une demande de prix ? » |

Les seuils de 3 et 12 mois sont **une proposition** : aucun texte ne les fixe. La seule obligation légale est de **ne jamais afficher un prix sans sa date** (§9, règle 1). Ils se trancheront avec vous au début du module 7.

---

## 3. Comment le GÉRER au quotidien

C'est le cœur de votre question. La règle du projet tient ici aussi : **tout ce qui peut être tenu par la base l'est**, et le temps humain va à ce qu'aucun programme ne peut juger.

### 3.0 Qui fait quoi

| la base, toute seule | l'artisan | vous (l'administration) | un avocat, et quand |
|---|---|---|---|
| refuser un prix sans date, sans unité ou sans source | importer ou photographier ses factures | les comptes fournisseurs en attente | **rien avant le module 7** |
| faire vieillir les prix (« récent », « à vérifier », « historique ») | valider les lignes douteuses de ses factures | les signalements d'offres, sous 48 heures | si un jour des fournisseurs paient une place ou une mise en avant |
| fermer une offre ou une réponse arrivée à sa date de fin | valider une fois chaque rapprochement entre deux marques | la file des matériaux proposés | si un jour on veut mettre en commun des prix d'achat — et peut-être jamais |
| contrôler qu'une facture tombe juste (quantité × prix, total) | remettre ses conditions à jour, souvent en janvier | regarder des **totaux**, jamais un prix | pour le contrat avec une plateforme de facture électronique, s'il y en a un |
| empêcher chacun de lire les prix des autres | envoyer ses demandes de prix | — | — |

### 3.1 Démarrer à vide

**Côté artisan.** Trois portes, et la troisième marche dès le premier jour :

1. **importer ses factures passées.** Le fichier de la facture électronique, téléchargé sur sa plateforme ou demandé à son comptable, se lit sans IA et sans coût. Une photo ou un PDF demande un appel d'IA par facture. Avec la limite de 60 appels par jour, un gros paquet de photos s'étale sur plusieurs jours : la suite attend le lendemain, et l'écran le dit (« N factures en attente de lecture »). Si cette limite convient à cet usage : **à mesurer**, pas à supposer ;
2. **saisir ses conditions** chez chaque fournisseur (prix nets annuels, livraison offerte, frais de port) : immédiat ;
3. **envoyer une demande de prix**, par e-mail ou par message, depuis son téléphone.

Entre-temps, le comparateur dit ce qu'il sait — souvent « Aucun prix connu pour ce matériau. Envoyer une demande de prix ? ».

**Côté fournisseurs.** Aucun fournisseur n'a besoin d'être sur Opus pour commencer : la demande de prix part de l'artisan vers SON fournisseur, par e-mail ou par message. Répondre à une demande de prix d'un client fait partie du métier d'un négoce [interprétation]. Ce qui reste **inconnu** :

- **le taux de réponse** en France ;
- **pourquoi un négoce s'inscrirait un jour sur Opus.** Le seul argument rapporté par les recherches : une place de marché britannique, Materials Market, séduit ses fournisseurs en leur évitant d'investir dans le numérique ;
- **qui ira les chercher.** Personne au départ. Plus tard, peut-être un partenariat avec un groupement d'artisans (CAPEB, ORCAB), qui a déjà des conditions négociées. Rien n'est à promettre.

### 3.2 Qui fait entrer les fournisseurs

**Il y a deux sortes de fournisseurs, à ne pas confondre :**

| | « mes fournisseurs » | les comptes fournisseurs |
|---|---|---|
| ce que c'est | la liste privée de chaque artisan, comme son carnet de clients | des négoces, fabricants ou loueurs inscrits sur Opus |
| qui les crée | l'artisan ; ou Opus les lui **propose** en lisant ses factures, et il valide | le fournisseur lui-même |
| vérification | aucune : c'est son carnet | le SIRET, par le mécanisme qui existe déjà pour les artisans : entreprise trouvée active au répertoire Sirene, une entreprise = un compte |
| qui les voit | l'artisan seul | les comptes pros voient leurs offres |

**Deux choses différentes, et ce n'est pas le même calendrier.** `A-FAIRE.md` présentait le 21/09 le type de compte fournisseur comme « le prochain vrai chantier » de la Place des pros, à faire après la section 1 du même document (le bloquant). Cette condition est remplie depuis. Ce que cette étude propose :

- **le compte fournisseur lui-même** (inscription, profil, modération, et la fin de l'affichage d'un métier d'artisan sur une fiche de négoce) peut venir avant le module 7. C'est votre choix (§5, question 2) ;
- **les offres utilisables par le comparateur** (une unité de vente, un conditionnement, une date de fin) et **la demande de prix dans Opus** attendent le module 7, où elles ont leur lecteur.

C'est un changement par rapport à `A-FAIRE.md`, qui rangeait tout ensemble. Il est à y écrire une fois votre réponse donnée.

**Ce que demande le compte fournisseur :**

1. **un type de compte à part, qui ne donne jamais accès aux demandes des particuliers.** Aujourd'hui, être « pro » veut dire « avoir une fiche professionnelle », et c'est exactement ce qui ouvre la lecture des demandes (leur commune, leur texte, les photos de leur maison). Un fournisseur rangé parmi les fiches pros les lirait ;
2. **l'inscription par le SIRET**, avec la même chaîne de preuve. Le code d'activité peut aider à reconnaître un négoce, mais il ne refusera rien : le projet a mesuré le 12/10 qu'il est trop peu fiable pour bloquer (un seul code couvre une maçonnerie et une menuiserie). La liste des codes qui désignent un négoce reste à établir ;
3. **les agences.** Un négoce a un numéro d'entreprise (SIREN) et un numéro par agence (SIRET). Avec la règle « une entreprise = un compte », les agences sont des lignes sous le compte, pas des comptes ;
4. **le vocabulaire du projet** vaut ici aussi : « répertoire Sirene (INSEE) », et jamais « vérifié » pour ce niveau — ce mot appartient au badge, qui reste un geste humain sur pièces ;
5. **la modération.** Une offre se signale comme une publication, et la promesse d'« examen sous 48 heures » s'applique aussi. Si les offres restent des annonces, la cible de signalement « annonce » existe déjà. Si elles ont leur propre table, il faudra ajouter une cible et refaire la règle de la base explicitement ;
6. **l'adresse e-mail affichée n'est jamais celle du compte.** Un négoce affiche une adresse de contact qu'il a choisie, comme un artisan aujourd'hui ;
7. **le blocage est symétrique, et tenu par la base.** Si un artisan bloque un fournisseur, ou l'inverse, aucun des deux ne voit plus les offres de l'autre, ni ne peut lui écrire ou lui envoyer une demande de prix ;
8. **les annonces « Nouveauté fournisseur » déjà posées** par des comptes pros ordinaires : les transférer au nouveau compte ou les laisser vivre jusqu'à leur fin. À décider ce jour-là.

> **La leçon du 15/10, à reprendre telle quelle.** Ce jour-là, le projet a découvert qu'un particulier pouvait se déclarer pro tout seul, parce qu'un statut qui repose sur l'**existence** d'une ligne ne dit rien tant qu'aucune règle ne dit **qui peut créer cette ligne**. Le compte fournisseur doit naître avec les mêmes verrous :
>
> - son propre marqueur, distinct de celui des artisans ;
> - une fiche fournisseur qui ne naît que dans une fonction de la base, sur preuve SIRET, jamais par une écriture de l'application ;
> - un type de compte que son titulaire ne peut pas changer seul ;
> - une règle par action (lire, créer, modifier, supprimer), jamais une règle « pour tout » — « pour tout », c'est quatre portes ;
> - sa propre façon de dire « cette ligne appartient à ce compte » : celle des artisans exige aujourd'hui d'être artisan, elle répondrait « non » pour un fournisseur.
>
> Le détail technique est dans l'annexe B.

### 3.3 Qui tient la liste des matériaux

**Sa forme définitive se décidera avec votre troisième cahier des charges**, celui de la base de connaissances du BTP, annoncé le 17/10. `A-FAIRE.md` pose que « rien ne se construit avant », et votre cahier actuel range déjà « produits et références matériaux » dans la base centrale (§5) et la documentation des fabricants dans les connaissances BTP (§16). Ce document arrivera très probablement avant le module 7 [interprétation]. D'ici là, seul le **principe** se fixe :

- un seul fichier source, avec des clés stables (on range `bloc-beton-creux-20`, jamais le nom), construit comme le catalogue des métiers ;
- l'écran dit « **comparable** », jamais « identique » ;
- **l'artisan valide** chaque rapprochement entre deux marques, une fois pour toutes. Jamais de fusion automatique.

**Comment elle s'enrichit**, sur le modèle des spécialités des métiers :

- l'artisan rattache ses produits aux catégories. S'il ne trouve pas, il écrit la sienne, qui sert **tout de suite** pour lui, et reste privée ;
- **elle ne part dans la file des « matériaux proposés » que s'il l'a accepté.** Le mot vient de ses factures, qui sont privées : `DONNEES-DES-ARTISANS.md` §2.2 exige alors une licence écrite dans les conditions d'utilisation **et** son accord, par une case à part, non cochée ;
- la file ne contient que le **mot**. Jamais le prix, jamais le fournisseur, jamais l'agence : une proposition ne doit rien révéler de qui achète quoi ;
- l'administration ajoute la catégorie au fichier source, et un contrôle refuse que le fichier et la base divergent ;
- **une clé ne se supprime jamais.** Si deux catégories s'avèrent être la même, la seconde **hérite** de la première, comme « Maçonnerie générale » hérite de « Maçon ».

### 3.4 Comment un prix vieillit, et s'efface

| prix | ce qui se passe avec le temps |
|---|---|
| **acheté par l'artisan** (facture) | **jamais effacé** automatiquement : c'est son historique. Son étiquette change toute seule — « récent », puis « ancien, à vérifier », puis « historique ». À ce stade, il sort de l'estimation par défaut, mais reste consultable |
| **réponse à une demande de prix** | elle sort de l'estimation à sa date de fin de validité : « réponse expirée » |
| **offre d'un fournisseur sur Opus** | sa date de fin est obligatoire ; à cette date, l'offre quitte la Place des pros et le comparateur |
| **conditions saisies** | elles expirent à leur date (souvent le 31 décembre), et l'application propose de les mettre à jour en janvier |
| **tarif sous licence** | selon la licence. À la fin d'un abonnement, aucune copie ne doit rester (exigence relevée chez l'éditeur Batiprix) |

Rien de tout cela ne demande d'intervention humaine : la date décide, et la base calcule l'âge.

### 3.5 Que faire d'une erreur signalée

| erreur | qui corrige | comment |
|---|---|---|
| un prix mal lu sur une facture | l'artisan | il corrige ; **l'original reste**, et la correction est tracée. Votre §13 le demande : « traçabilité des modifications » |
| un mauvais rapprochement (« ce n'est pas le même bloc ») | l'artisan | il défait le lien, et l'application ne le refait pas toute seule |
| une offre de fournisseur fausse ou trompeuse | le fournisseur, après un signalement ; l'administration peut la masquer | par la file des signalements, avec le journal des actes d'administration |
| une réponse de fournisseur qu'il veut corriger | le fournisseur | **une réponse envoyée ne se récrit pas en silence** : l'artisan s'appuie dessus. Une correction crée une nouvelle réponse datée, et l'ancienne reste visible. C'est la règle du projet : ce qui engage quelqu'un d'autre se ferme |
| une catégorie mal nommée | l'administration | dans le fichier source. Une clé ne change jamais ; son nom peut changer |

**Aucun artisan ne peut signaler le prix d'un autre artisan** — d'ailleurs, il ne le voit pas. Ce serait la « police des prix » qui a valu une amende à l'Ordre des architectes (§9).

### 3.6 Les contrôles automatiques

Ils suivent le modèle du reste du projet : des règles de la base, avec un message d'erreur en français ; des règles de lecture éprouvées par des essais sur une vraie base de données ; et des contrôles automatiques, eux-mêmes éprouvés **en cassant ce qu'ils surveillent**.

| ce qui est refusé ou retenu | par qui |
|---|---|
| un prix sans date | la base, à l'entrée |
| un prix sans unité, ou une unité hors de la liste | la base, à l'entrée |
| un prix sans origine | la base, à l'entrée |
| une ligne de consigne, d'avoir ou de frais rangée comme le prix d'un produit | rangée à part |
| un conditionnement absent quand l'unité est un sac ou une palette | la quantité à commander n'est pas calculée |
| une offre de fournisseur sans date de fin | la base, à l'entrée |
| quantité × prix ≠ montant de la ligne | la ligne reste « à valider » |
| somme des lignes − remises globales + frais globaux ≠ total hors taxes | la facture reste « à valider » |
| un artisan qui lit le prix d'un autre | la règle de lecture de la base, éprouvée par un essai |
| un fournisseur qui lit autre chose que ses offres et les demandes qui lui sont adressées | idem |
| une fonction d'administration qui lit une table de prix | un contrôle qui relit le schéma de la base |
| « meilleur prix » ou « le moins cher » dans un texte de l'application | un contrôle qui relit les textes, comme celui qui relit déjà les textes légaux |
| un prix affiché sans sa date | un contrôle sur le composant qui affiche un prix |
| la liste des matériaux et la base qui divergent | un contrôle sur le modèle de celui des métiers |

### 3.7 Ce qui coûte du temps humain chaque semaine

| tâche | qui | quand |
|---|---|---|
| la file des comptes fournisseurs en attente (porte de secours du SIRET, pièces) | l'administration | chaque semaine |
| les signalements d'offres | l'administration | sous 48 heures, la promesse existante |
| la file des matériaux proposés | l'administration | chaque semaine ou chaque mois |
| les lectures douteuses de ses propres factures | **l'artisan**, pas Opus | à l'import |

**Combien d'heures** : inconnu. Cela se mesure les premières semaines, et cela s'écrit.

**Ce qui n'est PAS une tâche d'administration : relire les factures d'un artisan.** Ce serait lire ses prix nets, ce que `DONNEES-DES-ARTISANS.md` §5.2 interdit, administrateur compris — et vous êtes du métier. La fiabilité de la lecture se mesure autrement (§3.9).

### 3.8 Ce que l'administration voit

- les comptes fournisseurs : identité publique, statut, pièces ;
- les files : comptes en attente, matériaux proposés, signalements ;
- des **totaux sur tout Opus**, pour savoir si l'outil sert (§3.9) ;
- **rien des prix individuels, et rien de qui achète où.** Même un total « par fournisseur » est exclu : « 40 artisans achètent chez X » est une information de volume sur un concurrent, exactement ce qu'un fournisseur voudrait savoir des autres.

> **Une limite à dire.** Vous détenez l'éditeur SQL de Supabase, qui lit tout. `A-FAIRE.md` a déjà ouvert cette décision pour les prix de vente (« qui peut lire les prix des autres artisans, éditeur SQL compris »). Elle vaut **autant** pour les prix d'achat. Concrètement : tant qu'elle n'est pas prise, vous pourriez techniquement lire les prix d'achat de votre frère par l'éditeur SQL. Dites-le-lui avant qu'il importe sa première facture.

### 3.9 Savoir que ça marche, sans lire un seul prix

Quelques **totaux** calculés par la base sur tout Opus, sans aucune valeur individuelle :

- la part des lignes « fourniture comprise » des devis qui ont au moins un prix récent ;
- la part des lignes de factures lues que l'artisan a dû corriger — c'est **la** mesure de fiabilité de la lecture, faite par les artisans eux-mêmes, sur leurs propres factures ;
- la part des factures dont les totaux tombent juste du premier coup ;
- la part des demandes de prix qui reçoivent une réponse (seulement quand la réponse revient dans Opus) ;
- le nombre d'artisans qui ouvrent le tableau des fournitures.

**Aucun seuil n'est fixé ici** : il faudra les fixer et écrire pourquoi. Et ce qu'on fait si ces chiffres restent bas : peu de prix connus → pousser la demande de prix et l'import des fichiers ; beaucoup de corrections → garder la validation obligatoire et préférer les fichiers aux photos ; peu de réponses → rester sur la demande envoyée à la main.

**Avant toute promesse de fiabilité, une première mesure** (au début du module 6, §5) : sur vos propres anciennes factures, si vous les avez encore — ce sont vos prix, vous pouvez les lire —, en masquant l'adresse de livraison, qui appartient à un ancien client. Puis par les corrections que votre frère fera lui-même sur son téléphone, dont vous ne verrez que le nombre.

### 3.10 Quand quelque chose casse

| ce qui casse | ce qui continue de marcher |
|---|---|
| l'IA est en panne, ou la limite du jour est atteinte | tout l'étage 1 : les prix connus, les conditions, la saisie d'un prix à la main depuis une facture papier. La lecture des photos attend, et l'écran le dit |
| la plateforme de facture électronique partenaire change ses conditions | l'import du fichier par l'artisan, qui ne dépend d'aucun partenaire |
| l'API de l'Insee cesse de répondre sans clé (c'est possible) | la tendance disparaît ; les prix restent affichés avec leur date. Rien d'autre n'en dépend |
| un fournisseur supprime son compte | ses offres disparaissent. Ce que deviennent les réponses que des artisans ont reçues de lui est **à trancher au module 7** ; la piste : la réponse reste chez l'artisan, comme un devis reçu |
| un artisan supprime son compte | ses fournisseurs, ses prix, ses conditions et les originaux de ses factures partent avec lui, après l'export de ses données. Le sort de ses demandes de prix côté fournisseur est à trancher au module 7 |

---

## 4. Le calendrier

L'ordre des modules arrêté le 07/10/2026 (`A-FAIRE.md`) ne change pas : **l'apprentissage des prix suppose des devis et des dépenses à apprendre.**

### Étape 0 — maintenant, sans aucune colonne

- **trancher la neutralité** (§5, question 1) avant toute discussion avec un négoce ;
- **décider pour les négoces déjà inscriptibles comme artisans** (§5, question 2) ;
- **garder la Place des pros réservée aux professionnels** ;
- **écrire dans `A-FAIRE.md`** l'engagement de méthode : les prix d'achat seront traités pour l'artisan seul, sous confidentialité. **Pas dans les textes légaux** : écrire aujourd'hui un traitement qui n'existera qu'au module 6 leur ferait décrire quelque chose de faux ;
- **ne rien construire d'autre** : une table « fournisseurs » aujourd'hui n'aurait aucun lecteur.

### Étape 1 — avec le module devis (module 2), déjà prévu

| quoi | son lecteur | lot du plan devis |
|---|---|---|
| « fourniture comprise / non comprise » sur chaque ligne | le PDF du devis | 1 |
| la quantité en nombre, et l'unité dans une liste fermée, choisie parmi des unités qui ont un code dans la liste des factures électroniques | le PDF ; plus tard, le comparateur | 1 |
| la base de postes de l'artisan | la suggestion pendant la frappe, et l'écart signalé | P |

**Rien de plus.** Pas de composition des postes, pas de coût estimé : leur lecteur n'existe pas encore.

### Étape 2 — à l'ouverture du module factures (module 3)

**À étudier ce jour-là, et c'est votre décision** : choisir une plateforme de facture électronique partenaire, qui sache **émettre** les factures des artisans — obligatoire pour les petites entreprises au plus tard le 1er septembre 2027 — et **recevoir** leurs factures d'achat. Opus deviendrait une « solution compatible » raccordée à elle. Trois réserves :

- le coût d'un partenariat est **NON VÉRIFIÉ** ;
- l'artisan devrait changer de plateforme de réception, souvent celle de son comptable ou de sa banque ;
- la question « la facture aux particuliers d'abord, ou tout ensemble » est déjà reportée à la fin du lot 4 du devis (`A-FAIRE.md`). Les deux se trancheront ensemble.

**Ce qui se prépare vraiment aujourd'hui, sans colonne** : votre frère doit déjà choisir une plateforme pour **recevoir** ses factures électroniques — obligatoire depuis le 01/09/2026, même en franchise de TVA (`A-FAIRE.md`). Dites-lui qu'une plateforme qui lui permet de **télécharger ses factures en fichier** (XML ou Factur-X) laissera un jour Opus les importer. Que ce critère compte dans son choix est une [interprétation].

### Étape 3 — avec le module dépenses (module 6, phase 7)

- la photo, le PDF, et **l'import du fichier** des factures d'achat ;
- la lecture de l'en-tête (fournisseur, date, montant, TVA), la conservation de l'original, le contrôle des totaux : c'est votre §13 ;
- **la lecture d'une photo de facture est une action de l'agent**, et elle en suit toutes les règles : sa ligne dans « Mon agent », sa permission (votre §4 : « Commande / dépense : validation obligatoire par défaut »), son journal, et un refus noté « erreur » quand une facture est illisible. C'est la règle du projet : plus aucune action d'IA ajoutée « à la main » ;
- **la clause s'écrit et se fait relire AVANT la première facture importée** : les prix d'achat sont traités pour l'artisan seul, comme prestataire, sous confidentialité. Si Opus est bien un « service d'intermédiation en ligne », changer des conditions déjà acceptées demande un préavis d'au moins quinze jours (`DONNEES-DES-ARTISANS.md` §4.1) : la clause doit donc être prête assez tôt. Le contrôle des textes légaux apprend ce nouvel état ;
- **les textes légaux nomment une transmission nouvelle** : les photos de factures envoyées au fournisseur du modèle d'IA (Anthropic). Elles portent souvent l'adresse d'un chantier, donc d'un client de l'artisan ;
- **un geste à part, et réversible** : « utiliser mes factures pour retrouver mes prix », distinct de l'import pour la comptabilité. Le rapport sur le droit le recommande pour la voie de la plateforme partenaire, et votre cahier des charges demande un consentement pour tout usage « à des fins autres que le fonctionnement du compte » (§23). Qu'il soit juridiquement obligatoire pour un usage strictement privé : [avocat]. Il est recommandé de toute façon, par transparence ;
- **l'original est rangé dans un espace privé** : couvert par le contrat de sous-traitance, présent dans l'export des données, emporté par la suppression du compte. Son chemin de rangement ne dépasse pas trois niveaux de dossiers : la fonction qui fait le ménage d'un compte ne descend pas plus bas (leçon des pièces jointes du 04/10) ;
- **l'adresse du chantier n'est jamais recopiée** dans les tables de prix. Elle reste sur l'original ;
- **les lignes ne sont rangées que si un écran les lit** : le détail d'une dépense, ou sa répartition entre deux chantiers ;
- **la première mesure de fiabilité** (§3.9).

### Étape 4 — le module fournisseurs (module 7, phase 8)

- « mes fournisseurs », et « mes prix » : l'historique tiré des factures ;
- les conditions saisies ;
- la liste des matériaux, premier lot ;
- les conditionnements et la conversion des unités ;
- la demande de prix, d'abord envoyée par l'artisan depuis son téléphone ;
- le tableau « Fournitures de ce devis » (étage 1), puis les actions de l'agent qui l'aident (étage 2), chacune avec sa permission, son journal et sa ligne dans « Mon agent » ;
- la composition des postes (« pour 1 m² : … »), dont le lecteur naît ici ;
- les offres datées des comptes fournisseurs, avec les bonnes unités.

> **L'historique se reconstruit depuis les originaux conservés.** Si le module 6 n'a pas rangé toutes les lignes faute de lecteur, le module 7 relira les originaux. Pour un fichier, c'est gratuit. Pour une photo, c'est un nouvel appel d'IA par facture : un coût à mesurer, à étaler dans le temps, et à annoncer à l'artisan.

### Étape 5 — après

- les demandes de prix reçues et répondues **dans** Opus par les fournisseurs inscrits ;
- les tarifs sous licence, **par accord écrit** ;
- les connecteurs avec des négoces, un par un ;
- pour le gros œuvre, le transport calculé à partir des grilles de prix « départ site » des fournisseurs (le modèle de Koncrete, §6) ;
- un partenariat avec la CAPEB ou l'ORCAB ;
- **toute mise en commun de prix d'achat** : seulement après un avocat, et peut-être jamais. C'est plus risqué encore que pour les prix de vente : ce sont des achats entre concurrents, et des conditions confidentielles des négoces.

### Vos gestes à vous, dans l'ordre

| quand | geste |
|---|---|
| maintenant | répondre aux deux questions du §5 |
| avant de remettre le compte à votre frère | lui dire de choisir une plateforme de réception qui permet de télécharger ses factures en fichier ; lui dire aussi, tant que la séparation n'est pas décidée, que l'éditeur SQL vous permet techniquement de tout lire |
| à l'ouverture du module 3 | décider d'une plateforme partenaire, ou non |
| au début du module 6 | rassembler vos anciennes factures si vous les avez, adresses masquées ; faire écrire et relire la clause sur les prix d'achat |
| au début du module 7 | trancher le compte fournisseur, le premier lot de matériaux et l'âge d'un prix ; écrire à Tarifeo et aux autres éditeurs de tarifs, si vous voulez leurs bases |
| seulement si un jour | un avocat, pour des offres payées ou une mise en commun de prix |

### Pour commencer par le gros œuvre (« 800 blocs »)

Ce qu'il faut, et qui n'existe pas encore :

1. **un premier lot de catégories** : les blocs (dimensions, classe, creux ou plein), les ciments (type, classe, poids du sac), les sables et granulats (granulométrie), le béton prêt à l'emploi (classe) ;
2. **les conditionnements, référence par référence** : palette de 60 ou de 70, sac de 25 ou de 35 kg, palette de 64 ou de 42 sacs ;
3. **le volume et le poids** pour les granulats. Ils sont vendus « au mètre cube ou à la tonne », au choix du vendeur. La conversion dépend d'une masse volumique que **seul le fournisseur** peut donner : Opus n'invente aucun coefficient ;
4. **le transport** : au minimum la livraison offerte et le port saisis par l'artisan ; idéalement, une demande de prix « livré à [commune] » ;
5. **la composition des postes de maçonnerie de l'artisan**, pour passer des m² aux blocs ;
6. **des factures de négoce de matériaux** à lire ;
7. **un avantage** : l'Insee publie des indices pour le ciment et pour les éléments en béton. La tendance à côté d'un vieux prix est donc possible tout de suite.

Ce qui manque au gros œuvre : les codes-barres, absents pour le vrac (sable, granulats) et souvent pour les blocs et le béton [interprétation] ; et peut-être la classification internationale ETIM, dont la couverture du gros œuvre n'a pas été vérifiée. **Le rapprochement se fera par caractéristiques, validé par l'artisan.**

---

## 5. Vos décisions, et ce qui n'a pas été vérifié

### Vos décisions

| décision | quand | ce qu'elle change |
|---|---|---|
| **un fournisseur peut-il payer pour être mieux placé ?** (neutralité) | **maintenant** — question 1 | ce qu'un fournisseur peut acheter : de la visibilité marquée, jamais un rang |
| **les négoces qui peuvent aujourd'hui s'inscrire comme artisans** | **maintenant** — question 2 (mesuré le 18/10 : aucun inscrit) | attendre le module 7 en le sachant, ou avancer le compte fournisseur |
| qui peut lire les prix, éditeur SQL compris | déjà ouverte dans `A-FAIRE.md`, avant le module devis | elle vaut aussi pour les prix d'achat |
| une plateforme de facture électronique partenaire, ou non | à l'ouverture du module 3 | l'arrivée des factures d'achat en fichier, et l'émission des factures |
| comment mesurer la lecture des factures | au début du module 6 | recommandation : vos anciennes factures, adresses masquées ; puis les corrections que votre frère fera lui-même, dont vous ne verrez que le nombre. Aucune promesse de fiabilité avant |
| le geste séparé « retrouver mes prix dans mes factures » | au début du module 6 | recommandé ; son caractère obligatoire est une question d'avocat |
| un compte fournisseur à part, et ses offres | au début du module 7, sauf si la question 2 l'avance | l'inscription, les règles de lecture, la modération, la demande de prix dans Opus |
| le premier lot de matériaux | au début du module 7 | recommandation : **le métier de votre frère d'abord**, parce que c'est lui qui aura des factures — et si c'est la maçonnerie, c'est aussi le gros œuvre de votre exemple |
| l'âge à partir duquel un prix passe « à vérifier » | au début du module 7 | proposition : 3 mois, puis « historique » à 12 mois. Aucun texte ne le fixe |
| le sort des réponses d'un fournisseur qui supprime son compte, et celui des annonces « fournisseur » déjà posées | au début du module 7 | les règles « ce qui engage quelqu'un d'autre se ferme » et « ce qui concerne des tiers s'anonymise » s'y appliquent |
| les prix d'achat dans la future base vendue par API | avec le troisième cahier des charges | recommandation : jamais sans le cadre de `DONNEES-DES-ARTISANS.md` et sans avocat (§10) |

Ces questions, sauf les deux premières, sont à ranger dans `A-FAIRE.md`, sous une rubrique « Fournisseurs et prix (module 7) — à trancher à son ouverture ».

### Ce qui est déjà tranché, pour qu'on ne le rouvre pas

- **jamais de prix conseillé** (`DONNEES-DES-ARTISANS.md` §5.4, `PLAN-DEVIS.md` 10.6) ;
- **les prix d'un artisan ne sont jamais montrés à un autre** ; seuls des chiffres regroupés pourront exister, et seulement après avis (`DEVIS-DU-PROPRIETAIRE.md` §5, `DONNEES-DES-ARTISANS.md`) ;
- **les données des clients ne servent jamais pour le compte d'Opus** : c'est une règle de `PLAN-DEVIS.md` 10.6 (point 3) et de `A-FAIRE.md` (dernière section, condition 2), appuyée sur la conclusion juridique de `DONNEES-DES-ARTISANS.md` §0.3. Ce dernier document la laisse pourtant formellement à votre décision (§7, décision 1, renoncement recommandé) : à confirmer d'un mot ;
- **les fournisseurs vivent dans la Place des pros**, pas dans un cinquième onglet, et en première version c'est le fournisseur qui saisit ses annonces (votre décision du 21/09).

### Ce qui n'a pas été vérifié

**Par cette étude :**

- la vraie base n'a été interrogée qu'une fois, le 18/10, pour compter (question 2 du §1). Le code a été **lu**, rien n'a été modifié ;
- le métier déclaré par votre frère n'a pas été lu ici : seule la division de son code d'activité (43, travaux de construction spécialisés) a été relevée ;
- **si les négoces répondront** à des demandes de prix passées par Opus, et à quel rythme : inconnu ;
- **le coût d'une lecture de facture par l'IA**, et si la limite de 60 appels par jour suffira pour un premier import : à mesurer. Ce coût sera couvert par ce que l'artisan paie pour Opus, s'il paie — jamais par les fournisseurs ;
- **si un éditeur de tarifs accepterait un accord avec Opus** — en particulier Tarifeo, dont les conditions écartent les éditeurs concurrents : à demander par écrit ;
- **une entreprise en franchise de TVA récupère-t-elle la TVA de ses achats ?** La règle générale est **non** : en franchise, on ne facture pas de TVA et on ne déduit pas celle de ses achats [certain dans le principe ; le texte du Code général des impôts n'a pas été relu ici]. Pour votre frère, le vrai coût d'un matériau serait donc son prix **toutes taxes comprises**. C'est ce que le comparateur devra lui montrer, mais à faire confirmer par son comptable, qui connaît sa situation ;
- la liste des codes d'activité qui désignent un négoce.

**Par les recherches dont elle dépend** (marquées NON VÉRIFIÉ dans les rapports) :

- les textes français ont été lus sur un miroir des données de Légifrance (codes.droit.org, édition du 10/10/2026), pas sur Légifrance lui-même, qui répond 403 depuis le conteneur. L'article 20 de la LCEN n'a pas été relu ;
- le décret n° 2026-677, l'arrêté du 27/07/2026 et les normes AFNOR XP Z12-012, -013 et -014 : seule leur existence est vérifiée. En particulier, **quels profils Factur-X sont acceptés** ;
- le coût d'un partenariat avec une plateforme agréée, et le statut SecNumCloud de Supabase ;
- la couverture du gros œuvre par ETIM, et le coût de sa version française ;
- toute mesure de fiabilité de lecture **sur des factures françaises de négoce** : aucune n'a été trouvée ;
- la taille de chaque négoce au sens de la réforme, et la façon dont un achat au comptoir devient une facture électronique ;
- l'existence de clauses de confidentialité dans les conditions de compte des grands négoces ;
- sur le marché : Leroy Merlin Pro, le modèle économique et la fixation des prix de Materials Market, MoonBTP, Bricofuté, la liquidation de mesmateriaux.com, l'investissement du distributeur Wesco dans Kojo, les 1 200 tarifs de HerculePro ;
- les chiffres que les entreprises donnent sur elles-mêmes (Koncrete, Kojo, hemea…) : rapportés comme leurs affirmations, sans validation.

---

# Pour comprendre pourquoi

## 6. Ce que fait le marché, et ce qu'on en retient

Le détail, acteur par acteur, est dans l'annexe C.

### 6.1 En France, personne ne compare plusieurs négoces sur une ligne de devis

**Pour mettre les prix d'un négoce dans un devis, les logiciels français relus le 17/10/2026 n'utilisent que deux schémas** [certain pour ceux-là ; trois — Onaya, hemea pro, Batigest hors e-Tarif — n'ont pas pu être décrits] :

1. **le compte de l'artisan chez UN négoce** : Tolteck (Saint-Gobain) lit ses prix Point.P ou Cedeo ; Everwin GX-BTP commande chez Sonepar ;
2. **le tarif public du fabricant, moins la remise que l'artisan saisit** : Tarifeo, Sage e-Tarif. Ce schéma vaut surtout pour l'électricité et le génie climatique.

S'y ajoute la **copie de pages web, une par une**, par une extension du navigateur (Obat ; Buildora, qui compte 11 installations). Aucun ne met deux négoces côte à côte sur une même ligne de devis.

> **Mais un concurrent français fait déjà les deux premières sources de cette étude.** Costructor propose dans sa formule Business+ des « Demandes de prix et bons de commandes » et l'« Import de factures d'achats ». Le comparer en détail demanderait d'ouvrir un compte chez lui, ce que ses conditions interdisent « en vue d'élaborer un produit ou service concurrent » (`SOURCES-DONNEES-BTP.md` §3.1). Ce qui reste propre à Opus : la date, la source et l'âge sur chaque prix, l'unité et le conditionnement, et l'aveu de ce qui manque.

**Pourquoi personne ne compare plusieurs négoces**, selon les acteurs eux-mêmes :

1. **les prix nets se négocient compte par compte** et restent derrière une connexion. Un éditeur de logiciels pour négoces décrit des remises par famille, des prix de chantier qui expirent, des hausses appliquées avec 2 à 6 semaines d'écart selon l'agence, et une logique qui « vit dans des fichiers Excel, des accords oraux et la mémoire des vendeurs » (source commerciale) ;
2. **les négoces ne se laissent pas lire, ils signent** : protections contre les robots, conditions qui interdisent la reproduction. Tout ce qui marche passe par un accord, une filiale ou une intégration demandée au fournisseur ;
3. **le même produit n'a ni le même nom ni le même code d'un négoce à l'autre**. Aux États-Unis, une entreprise (Parspec) a levé des fonds rien que pour normaliser les fiches de quelque 4 000 fabricants ;
4. **le stock en temps réel est rarement tenu** : Tolteck renvoie à la page du négoce ; les interfaces temps réel annoncées en 2018 par la place de marché allemande Roobeo ne sont jamais devenues publiques ; Sage e-Tarif annonce les prix et le stock « en temps réel », sans que cela ait été vérifié ;
5. **le transport change tout** pour les produits lourds.

Même les groupements d'artisans ne publient pas leurs prix : la CAPEB passe par un PDF annuel et un justificatif d'adhésion (et, avec les grands négoces, ses accords portent surtout sur les formations, les certificats d'économies d'énergie ou les déchets) ; l'ORCAB par l'intranet de ses coopératives ; la centrale d'achat GECET a un vrai comparateur, **réservé à ses membres**.

### 6.2 Les trois mécanismes qui marchent

Aucun ne repose sur la lecture des sites des négoces.

| mécanisme | qui le fait | ce qu'Opus en tire |
|---|---|---|
| **1. les prix de l'artisan lui-même** : son historique, ses factures | Kojo (États-Unis) compare à partir des prix actuels et passés de l'entreprise ; Field Materials (États-Unis) et Graneet (France) lisent les factures ; Renalto importe les anciens devis ; Costructor importe les factures d'achat | **la source n° 1** : comparer d'abord les fournisseurs **que l'artisan utilise déjà**, chaque prix daté par sa facture |
| **2. la demande de prix** envoyée à plusieurs fournisseurs | Kojo (215 000 offres reçues en 2025, selon ses propres chiffres) ; Bidstacker (Suède), où une page compare le prix total, la livraison et les conditions, avec une première réponse visée en 24 h ; SubBase ; Koncrete au-delà d'un certain volume ; chez bobbie (Allemagne), les fabricants répondent ligne par ligne ; Costructor | **la source n° 2** : l'artisan envoie la liste à SES fournisseurs, et la réponse datée devient un prix fiable |
| **3. l'accord signé avec un distributeur** | Handoff et Buildxact avec Home Depot (États-Unis) ; Tolteck avec Saint-Gobain | plus tard, négoce par négoce, par écrit |

### 6.3 Le seul segment où la comparaison publique marche : le lourd et le standard, prix livré

- **Koncrete** (granulats, France) : le client donne l'adresse du chantier ; l'application « calcule toutes les combinaisons coût matériau et coût transport », puis rend les meilleures offres **livraison comprise**. Les fournisseurs envoient leur grille de prix au départ de leur site. C'est le seul vrai comparateur rencontré en France pour le BTP. Il écrit que le transport représente « une part prépondérante » du coût des granulats. Les chiffres qu'il donne sur lui-même ne sont pas vérifiés, et ils ne s'accordent pas avec ceux que publie Cemex Ventures.
- **bobbie** (Allemagne) calcule un prix final, fret compris, d'après l'adresse et la quantité ; il convertit les m² en litres, en seaux ou en palettes, en respectant les minimums de commande et les conditionnements ; et **le prix s'affiche en orange ou en rouge quand le fret ou la conversion manque**.
- Ailleurs : Materials Market (Royaume-Uni ; qui fixe ses prix : NON VÉRIFIÉ), Schüttflix (Allemagne).

> **Votre exemple « 800 blocs béton, ciment, mortier » tombe exactement dans ce segment.** C'est une bonne nouvelle : c'est le seul où une comparaison a fait ses preuves. Mais c'est aussi celui où **le transport et le conditionnement décident du prix**. Un comparateur qui les oublie se trompe.

### 6.4 Ce qu'on en retient, en sept lignes

1. **Ne pas promettre un comparateur de prix publics de tous les négoces.** Promettre « vos prix, vos fournisseurs, datés ».
2. **La meilleure source est l'artisan lui-même** : ses factures.
3. **Pour le reste, une demande de prix, pas un prix affiché.**
4. **Un prix sans quantité, sans conditionnement et sans livraison est faux.**
5. **Dire à l'écran ce qu'on ne sait pas.** C'est la pratique des meilleurs, et un argument de vente.
6. **Pour une place de marché, le point dur est l'argent** — capital, stock, transport, encaissement, crédit aux clients. Plusieurs se sont restructurées (annexe C). Opus n'a aucune raison de prendre ce risque.
7. **Qui finance la plateforme décide de sa neutralité** (§10).

---

## 7. D'où viendront les prix, source par source

Votre cahier des charges (§14) demande de distinguer trois familles de prix. Elles deviennent la règle d'affichage :

| votre famille | ce qu'elle contient | ce que l'écran en dit |
|---|---|---|
| **« Mes prix réellement payés »** | les lignes des factures d'achat de l'artisan, une fois **validées** | le prix fait foi pour lui, à la date de la facture |
| **« Prix fournisseurs disponibles »** | les réponses à ses demandes de prix, les offres publiées par des fournisseurs, et plus tard les tarifs sous licence et les connecteurs | « valable jusqu'au… », ou « à vérifier » |
| **« Prix observés dans mes documents »** | ce qu'Opus a lu mais qui n'est pas un achat validé : une facture pas encore relue, un devis de fournisseur non commandé, un catalogue reçu en PDF | « non validé », tant que l'artisan n'a pas confirmé |

Et la règle de votre §14, mot pour mot : « Un ancien prix ne doit jamais être présenté comme un prix actuel sans indication de date. » Entre professionnels aussi, c'est une limite légale (§9, règle 1).

### 7.1 Les factures d'achat de l'artisan : la source n° 1

**Ce qu'elle donne.** Les vrais prix d'achat : régionaux, à l'agence près, aussi frais que le dernier achat. Personne d'autre ne peut les fournir.

**Elle arrive sous deux formes, très différentes :**

| | une photo ou un PDF | une facture électronique (UBL, CII, Factur-X) |
|---|---|---|
| comment Opus la lit | un modèle d'IA lit l'image (étage 2) | un programme lit les données, sans IA (étage 1) |
| fiabilité | **à mesurer**. Dans la compétition DocILE (2023), avec des modèles spécialisés, le meilleur score sur la reconnaissance des lignes de documents commerciaux reste sous 80 %. Pour les modèles de vision actuels, un classement d'éditeur donne un score global, sans mesure sur les lignes. Aucun banc d'essai public sur des factures de négoce françaises n'a été trouvé (NON VÉRIFIÉ) | les champs sont exacts : ce sont ceux de la facture |
| coût | un appel d'IA par facture, dans la limite de 60 par jour | presque rien |
| quand | dès le module dépenses | dès le module dépenses, par **import du fichier** que l'artisan récupère sur sa plateforme ou chez son comptable |

**Le calendrier qui décide** [certain : FAQ officielle d'août 2026] :

- depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir **recevoir** des factures électroniques ;
- les grandes entreprises et les ETI les **émettent** depuis la même date ;
- les PME, TPE et micro-entreprises les émettront **au plus tard le 1er septembre 2027**.

Donc les grands négoces envoient déjà des factures structurées [interprétation, tirée de l'obligation légale ; un courrier de SAMSE à ses clients va dans ce sens, `SOURCES-DONNEES-BTP.md` §4.6]. Beaucoup de négoces indépendants qui sont des PME peuvent attendre 2027 [interprétation : la taille réelle de chaque négoce n'a pas été vérifiée]. **Jusque-là, une partie des factures restera en papier ou en PDF.**

**Ce qu'une ligne de facture électronique contient** [certain : spécifications officielles v3.2, et Peppol BIS Billing 3.0, une spécification d'échange qui met en œuvre la norme européenne de facture EN 16931] :

| toujours | parfois | jamais, ou pas de case prévue |
|---|---|---|
| la désignation, en texte libre | la référence du fournisseur (facultative) | **aucune case pour le conditionnement** (« une palette de combien ? ») ; il peut apparaître dans la désignation, en texte libre |
| la quantité | le code-barres GTIN (facultatif, et rare pour le vrac) | **les remises différées** (de fin d'année) |
| l'unité, sous forme de **code d'une liste fermée** (pièce, kg, tonne, m², m³, sac, palette…) | la « quantité de base » du prix : un prix donné **au cent ou au mille** | |
| le prix unitaire **net**, hors TVA, après rabais | une classification (ETIM…), rarement remplie (NON VÉRIFIÉ) | |
| le montant hors taxes de la ligne, et la date de la facture | | |

Trois pièges, que la base doit connaître :

1. **Une facture Factur-X peut n'avoir aucune ligne.** Deux de ses cinq profils (MINIMUM et BASIC WL) n'en portent pas. Quels profils la réforme accepte est écrit dans une norme qui n'a pas été lue (NON VÉRIFIÉ). Il faut donc prévoir des factures sans détail.
2. **Le prix facturé n'est pas le coût réel** quand il existe des remises de fin d'année. La loi définit le « prix d'achat effectif » comme le prix net facturé **moins** les autres avantages financiers accordés par le vendeur (Code de commerce, L442-5) [certain]. L'écran dit donc « prix facturé, hors remises différées ».
3. **La facture porte souvent l'adresse du chantier**, c'est-à-dire celle du client de l'artisan : elle fait partie des données obligatoires quand elle diffère de l'adresse de l'acheteur. C'est une donnée personnelle dont Opus n'est que le sous-traitant. Elle n'est jamais recopiée dans les tables de prix ; l'original qui la porte reste dans un espace privé (§4, étape 3).

Une facture papier contenait déjà légalement la même matière : la quantité, la dénomination précise, le prix unitaire hors taxes, les réductions acquises (Code de commerce, L441-9) [certain]. Seule sa **structure** manque.

**Ce qu'on a le droit d'en faire.** Les traiter **pour l'artisan seul**. Ce sont ses documents, et ses prix nets sont très probablement un secret des affaires (§9). On ne les montre jamais à un autre artisan, et on ne les met jamais en commun sans avis d'avocat.

**Comment elles arriveront dans Opus, par ordre de réalisme :**

| voie | verdict |
|---|---|
| importer le fichier XML ou Factur-X que l'artisan a récupéré | **à faire en premier** : sans partenaire, licite, presque gratuit |
| une photo ou un PDF lu par l'IA | indispensable pour les tickets de comptoir et les petits négoces jusqu'en 2027, **toujours avec une validation** |
| Opus raccordé, comme « solution compatible », à une plateforme agréée partenaire que l'artisan désigne | **la voie d'avenir**, à étudier à l'ouverture du module 3. Elle se partage avec l'**émission** des factures d'Opus. Mais l'artisan doit alors changer de plateforme de réception. Coût NON VÉRIFIÉ. Le rapport sur le droit recommande alors une case de consentement à part pour l'usage « historique de prix », distincte de la comptabilité |
| se brancher sur la plateforme que l'artisan a déjà | il existe 155 plateformes agréées au 13/10/2026 : seulement pour 2 ou 3 plateformes dominantes, si elles l'acceptent |
| devenir soi-même plateforme agréée | **hors de portée** : il faut une certification de sécurité (ISO 27001), un hébergement qualifié par l'État (SecNumCloud) et aucune donnée hors de l'Union européenne |

**Son étiquette à l'écran** : « **acheté le 12/09/2026** (date de la facture) — [négoce], agence de [commune] ». Tant qu'une ligne lue n'est pas validée : « **observé dans vos documents** — à confirmer ».

### 7.2 La demande de prix aux fournisseurs de l'artisan : la source n° 2

**Ce qu'elle donne.** Un prix **actuel**, pour **ce** chantier, **cette** quantité et **ce** lieu de livraison, avec une durée de validité. C'est le seul prix vraiment « disponible ».

**Ce qu'on a le droit d'en faire.** La réponse appartient à l'artisan, et le fournisseur sait à qui il répond. Deux interdits :

- **une demande par fournisseur, jamais un fil commun.** Un fournisseur ne voit jamais qu'un autre a été consulté, ni ce que celui-ci a répondu ;
- **jamais de bouton « relancer B avec le prix de A ».** Transmettre l'offre d'un fournisseur à son concurrent, c'est le schéma « en étoile » que vise le droit de la concurrence (§9, règle 6).

Par défaut, la demande ne contient **que la commune du chantier**, jamais le nom ni l'adresse du client. Si l'artisan veut donner l'adresse de livraison, c'est lui qui l'écrit.

**Ce que ça coûte.** Aucune licence. Le temps du fournisseur. Le taux de réponse en France est **inconnu**.

**Sa fraîcheur.** La date de la réponse et sa validité, données par le fournisseur. Exemple de pratique : Téréva s'engage auprès de la CAPEB à « maintenir les mêmes prix au moins sur une durée de 60 jours ».

**Elle se construit en deux étapes :**

- **d'abord sans compte fournisseur** : la liste est préparée, l'artisan l'envoie lui-même depuis son téléphone, par e-mail ou par message, puis photographie la réponse, qui se lit comme une facture ;
- **ensuite avec les fournisseurs inscrits** : la demande arrive dans Opus, et le fournisseur répond **ligne par ligne**, comme chez bobbie. Une réponse envoyée ne se récrit pas en silence (§3.5).

**Son étiquette** : « **réponse de [fournisseur] le 03/10/2026, valable jusqu'au…** ». Passé cette date, le prix sort de l'estimation et devient « réponse expirée ».

### 7.3 Les conditions saisies par l'artisan

**Ce qu'elles donnent.** Ses remises par famille de produits, ses prix nets annuels, sa livraison offerte (le « franco ») et ses frais de port, chez chaque fournisseur. C'est le modèle de Tarifeo et de Sage e-Tarif, où l'artisan saisit ses « remises par fournisseur ». C'est aussi la seule façon de faire entrer les conditions des groupements. La CAPEB communique les siennes par un PDF annuel. Par exemple, son guide de juin 2024 annonçait chez Frans Bonhomme des « prix nets annuels », un port à 30 € et un franco à 150 €, sur justificatif d'adhésion. **Ce guide valait jusqu'au 31/12/2024 : ces conditions sont périmées**, et ne servent ici qu'à montrer la forme d'une condition.

**Le droit.** Ce sont ses conditions, et elles ne servent qu'à lui.

**Le coût.** Son temps, une fois par an.

**La fraîcheur.** Une date de saisie, et une fin de validité (souvent le 31 décembre).

**La limite.** Une remise par famille ne sert que si l'on connaît le tarif public auquel l'appliquer (§7.5). Sans tarif, seuls le **prix net annuel**, la **livraison offerte** et le **port** servent tout de suite.

**L'étiquette** : « **vos conditions chez [fournisseur]**, saisies le…, valables jusqu'au 31/12 ».

### 7.4 Les fournisseurs inscrits dans la Place des pros

**Ce qui existe déjà :**

- le type d'annonce « Nouveauté fournisseur » (négoce, marque, loueur) ;
- la recherche par mots-clés et ses équivalences (placo / BA13, parpaing / agglo / bloc béton) ;
- la règle de la base qui réserve la lecture de la Place des pros aux comptes pros.

**Pourquoi ça ne suffit pas pour comparer :**

- l'unité d'une annonce n'accepte que « au total, par jour, par semaine, par mois », c'est-à-dire des unités de location. Un prix de placo « par jour » ne veut rien dire, et il n'y a ni sac, ni palette, ni m² ;
- une annonce n'a **ni conditionnement, ni date de fin de validité, ni mention « livraison comprise ou non »** ;
- **il n'existe pas de compte fournisseur.** Un négoce s'inscrit aujourd'hui comme un artisan, et sa fiche affiche un métier d'artisan (`A-FAIRE.md`).

> **Le piège, et il est déjà là.** Être « pro », dans la base, veut dire « avoir une fiche professionnelle ». C'est cette même condition qui ouvre la **lecture des demandes des particuliers** : leur commune, leur texte, les photos de leur maison. Or le SIRET à l'inscription ne trie pas selon l'activité : **un négoce dont le SIRET est actif peut s'inscrire aujourd'hui comme artisan**, et il lit alors ces demandes — de quoi, s'il le voulait, démarcher les clients des artisans. Ce n'est donc pas seulement un piège pour demain (§5, question 2). Et le futur compte fournisseur ne doit jamais ouvrir cette lecture (§3.2).

**Ce qu'il publiera.** Des offres à prix **publics**, avec une unité de vente, un conditionnement, la mention « livraison comprise ou non », une agence ou une zone, une date, et **une date de fin obligatoire**. **Un prix actuel seulement**, valable dès sa publication : jamais un prix annoncé pour plus tard (§9, règle 16). Une offre n'est pas une annonce : soit le type d'annonce évolue, soit les offres ont leur propre table (la plus simple à vérifier, annexe B). Cela se décidera au module 7.

**Le droit.** Un prix qu'un fournisseur publie lui-même, pour qu'on le voie, est une donnée publique. Le montrer aux artisans favorise la concurrence (lignes directrices européennes de 2023, points 402 et 425) [certain dans le principe]. **Le montrer aux autres fournisseurs, non** (§9, règle 9).

**Le coût.** Aucune licence ; du temps de modération (§3.7).

**L'étiquette** : « **offre publiée par [fournisseur] sur Opus le…**, valable jusqu'au… — prix public, à vérifier pour votre compte ».

### 7.5 Les tarifs publics sous licence : seulement par accord écrit

| source | ce qu'elle contient | ce qu'Opus peut en faire sans accord | coût public |
|---|---|---|---|
| **Tarifeo** | les tarifs publics de plus de 750 référentiels de fabricants et distributeurs (plaquette EBP, juillet 2024 ; environ 800 selon une autre source) : électricité, génie climatique, sanitaire. Partenaire de la CAPEB | rien : ses conditions ne permettent que l'intégration dans le propre système du client, et précisent qu'« un prestataire ne peut pas être un éditeur concurrent » (art. 6 h) | sur devis |
| **Sage e-Tarif** | plus de 700 tarifs et catalogues d'industriels « du BTP », plus de 4 millions de références | rien ; ses conditions n'ont pas pu être lues (page bloquée) | environ 16 € HT par mois pour l'artisan (indicatif) |
| **FAB-DIS** | un format de fichier, pas une base ; les prix nets passent par un autre fichier, confidentiel | rien : il est réservé aux fabricants et aux distributeurs | un kit à 240 € HT par an, **puis** un accord avec chaque fabricant |
| **les tarifs des fabricants** (Hager, Legrand) | le tarif public et le code-barres | les télécharger, mais pas les reproduire sans autorisation | gratuit, sur autorisation écrite |

**À savoir :**

- ces bases couvrent surtout l'électricité, la plomberie et le chauffage. **Leur couverture du gros œuvre n'a pas été vérifiée** (Sage e-Tarif se dit « du BTP », sans détail) ;
- aucun éditeur ne publie le prix d'une licence qui couvrirait tous les artisans d'Opus ;
- **une licence doit nommer le traitement par l'agent** (l'envoi au fournisseur du modèle d'IA). Sans cette clause, un tarif sous licence s'affiche à l'artisan, mais ne passe jamais par l'IA. C'est ce que `SOURCES-DONNEES-BTP.md` §1.2 a établi pour Batiprix : envoyer ses prix à un modèle d'IA n'est « ni voir ni imprimer ».

**L'étiquette** : « **tarif public du…** ([source]) — votre remise de X % appliquée (saisie le…) — **à vérifier** ».

### 7.6 Les connecteurs officiels, négoce par négoce : plus tard

Les modèles existants : Tolteck lit le compte Point.P ou Cedeo de l'artisan ; Everwin commande chez Sonepar par échange informatisé ; Handoff lit les prix du magasin Home Depot le plus proche du chantier. Tous reposent sur un **accord**. Tolteck appartient majoritairement à Saint-Gobain, qui possède aussi Point.P et Cedeo. Qu'un logiciel concurrent obtienne le même accès est **inconnu**.

**L'étiquette** : « **prix de votre compte [négoce]**, lu le… ».

### 7.7 Un complément qui n'est pas un prix : les indices de l'Insee

L'Insee publie des indices de prix de production pour le ciment et pour les éléments en béton. Ils sont mensuels, d'abord provisoires puis révisés, et sous Licence Ouverte : l'usage commercial est permis, avec la mention « Source : Insee » et la date.

Ce sont des prix **sortie d'usine** : ils montrent une **tendance**, jamais le prix d'un négoce. À côté d'un vieux prix, l'écran peut écrire : « Tendance des prix du ciment depuis cette date : … (Insee, valeur provisoire) ».

Il ne faut **jamais** en tirer un « prix actuel » recalculé. Et **jamais** utiliser l'index BT01 : il mesure le coût des travaux, main-d'œuvre comprise, pas celui d'un matériau.

### 7.8 Ce qui est EXCLU, et pourquoi

| exclu | la raison |
|---|---|
| **lire les sites des négoces avec un programme** | c'est extraire une base protégée (Code de la propriété intellectuelle, L342-1 et L342-2), un délit puni de 3 ans de prison et 300 000 € d'amende (L343-4). Même un catalogue non protégé peut être interdit par contrat (arrêt Ryanair de la Cour de justice de l'Union, 2015) [certain] |
| **une extension qui capture la page d'un fournisseur** (comme celle d'Obat) | **ajout de cette étude**, appuyé sur `SOURCES-DONNEES-BTP.md` §3.1 : chez un concurrent, c'est l'utilisateur qui capture et porte le risque ; chez Opus, la même capture répétée sur tous ses artisans deviendrait une extraction répétée et systématique de la base du négoce au profit d'Opus (L342-2). Exclue sans accord du négoce [avocat pour la qualification] |
| **un prix tiré de la mémoire de l'IA** | un modèle n'a pas de prix fiables, datés ni régionaux : il produit un nombre plausible, qui engagerait l'artisan (`DEVIS-DU-PROPRIETAIRE.md` §6.2) |
| **le prix d'un artisan montré à un autre**, même sans nom | ce sont des coûts et des prix d'achat échangés entre concurrents (droit de la concurrence), et très probablement un secret des affaires (§9) |
| **un flux d'affiliation** (un site marchand qui paie une commission par vente) | il ne permet de publier les produits que « pour la promotion de l'annonceur », et il contredit la neutralité (§10) |
| **les bases de prix d'ouvrages** (Batiprix, BatiChiffrage) | ce sont des prix de travaux posés, pas de matériaux. C'est un autre sujet, déjà traité (`PLAN-DEVIS.md` 10.6 : « jamais dans ce module ») |

---

## 8. Les données à ranger

Décrites en mots. Rien n'est créé avant le lot qui s'en sert (§4).

### 8.1 Ce qu'il faut savoir d'un prix

| donnée | pourquoi |
|---|---|
| **le fournisseur** | il vit dans la liste **privée** de l'artisan (« mes fournisseurs »), comme son carnet de clients : un nom, et le numéro d'entreprise quand la facture le porte. Un lien vers un compte fournisseur Opus ne naîtra que le jour où quelque chose s'en sert — exactement comme le carnet de clients, qui n'a volontairement aucun lien vers un compte |
| **l'agence** | le même négoce n'a pas le même prix partout, et les hausses arrivent avec des semaines d'écart selon l'agence. Votre §14 le demande (« localisation / agence ») |
| **la désignation, mot pour mot** | ce qui est écrit sur la facture. On ne la réécrit pas |
| **la référence du fournisseur**, le **code-barres** s'il existe, **la marque et la référence du fabricant** | pour reconnaître le même produit chez le même fournisseur, ou chez deux fournisseurs pour un produit de marque |
| **la catégorie normalisée** | pour comparer entre fournisseurs (§8.2) |
| **l'unité de vente** | en codes de la liste fermée que portent déjà les factures électroniques : ce qui arrive en fichier n'a alors rien à convertir |
| **le conditionnement** | le rapport « 1 palette = 60 pièces », **attaché à la référence du fournisseur et daté**, jamais à un produit en général |
| **la quantité de base du prix** | « au cent », « au mille » : l'oublier fait une erreur d'un facteur 100 |
| **le prix hors taxes, tel qu'il est écrit sur la facture** | rangé sans arrondi ; la conversion vers l'unité de référence (le kilo, la pièce) se calcule à l'affichage, et elle est montrée |
| **la TVA** | votre §14 la demande ; elle compte pour un artisan qui ne la récupère pas (à vérifier, §5) |
| **la date** | de la facture, de la livraison, ou de la réponse. **Un prix sans date n'entre pas** |
| **la validité** | pour une réponse ou une offre : une date de fin |
| **l'origine** | dans une liste fermée : facture lue en fichier, facture lue sur une image, réponse à une demande, conditions saisies, offre d'un fournisseur sur Opus, tarif sous licence, connecteur |
| **le statut** | lu, puis contrôlé (la somme des lignes redonne bien le total de la facture), puis validé par l'artisan |
| **livraison comprise ou non**, et les **frais à part** | transport, éco-contribution, consigne de palette : jamais mélangés au prix du produit |
| **le document d'origine** | conservé dans un espace privé. Votre §13 l'exige : « conservation de l'original » |

**Ce qui n'est jamais rangé avec un prix** : le nom, l'adresse ou le téléphone d'un client.

### 8.2 Pourquoi aucun code unique ne suffit

- la référence d'un négoce n'existe que chez lui ;
- le code-barres manque pour le vrac, et souvent pour les blocs ou le béton [interprétation] ;
- la classification internationale ETIM est libre d'usage (en citant la source), mais sa version française peut être réservée aux membres, et **sa couverture du gros œuvre n'a pas été vérifiée** ;
- surtout : **le même bloc, chez le même fabricant, se vend par palettes de 60 ou de 70 selon la référence.** Le conditionnement n'appartient pas au produit : il appartient à la référence.

D'où une liste propre à Opus (§3.3). Chaque catégorie porte :

- **une unité de référence** pour comparer : la pièce pour un bloc, le kg ou la tonne pour le ciment, la tonne pour le sable, le m³ pour le béton prêt à l'emploi, le m² à épaisseur donnée pour un isolant ;
- **des caractéristiques** qui font l'équivalence. Pour un bloc : ses dimensions, sa classe, creux ou plein. Pour un ciment : son type et sa classe (exemple lu sur une fiche de fabricant : « CEM II/B 32,5 R »). Pour un sable : sa granulométrie.

**La table d'équivalences de la recherche ne suffit pas.** Celle de la Place des pros rapproche « parpaing », « agglo » et « bloc béton » pour **trouver** une annonce. Elle ne distingue pas un bloc de 15 d'un bloc de 20, ni un bloc creux d'un bloc plein. C'est voulu pour une recherche, et faux pour un prix.

### 8.3 Qui peut lire quoi

C'est tenu par la base, jamais par l'écran — la règle de toujours du projet :

| qui | lit | ne lit jamais |
|---|---|---|
| **l'artisan** | ses fournisseurs, ses prix, ses conditions, ses demandes de prix et leurs réponses | ceux d'un autre artisan |
| **un fournisseur** | ses propres offres publiées, et les demandes qui **lui** sont adressées | les offres des autres fournisseurs ; les prix nets d'un artisan ; qui a été consulté à côté de lui ; les demandes des particuliers ; les annonces de sous-traitance des artisans |
| **un visiteur sans compte** | rien | — : aucune règle de lecture, et même aucun droit sur ces tables, comme pour le carnet de clients |
| **l'administration, vous compris** | les comptes fournisseurs, les files à traiter, des totaux globaux | **aucun prix individuel**, et rien sur qui achète où |

Et partout : **si l'un a bloqué l'autre, aucun des deux ne voit plus rien de l'autre** (§3.2).

C'est le même modèle que le carnet de clients et que la base de postes prévue : une seule fonction de la base dit « cette ligne appartient à ce compte » ; chaque table ajoute sa ligne à l'export des données ; tout part avec le compte.

### 8.4 Le lien avec le devis et la base de postes

- **La ligne de devis** dira déjà, dès le lot 1 du plan, si la fourniture est comprise, sa quantité en nombre et son unité dans une liste fermée. Le plan prévoit de choisir des unités qui ont un code dans la même liste que les factures électroniques : cela évite d'inventer une liste à soi, et la correspondance s'écrira avec le module facture. Pour un produit vendu dans l'unité de la ligne — un isolant facturé au m² (code MTK) face à une ligne comptée en m² —, la comparaison est alors directe.
- **Entre un devis et des achats, le lien passe le plus souvent par la composition du poste.** 80 m² de mur ne se retrouvent pas en m² sur la facture : les blocs se facturent à la pièce ou à la palette. C'est la composition (« pour 1 m² : 10 blocs… ») qui relie les deux.
- **La base de postes** (lot P) rangera les postes de l'artisan, ses phrases et son prix de référence. Le jour du module fournisseurs, un poste pourra porter **sa composition**. Elle ne naîtra qu'avec son lecteur : la liste de matériaux.
- **Le comparateur n'écrit rien dans le devis.** S'il fallait un jour garder le coût estimé d'une ligne, par exemple pour voir sa marge au tableau de bord, ce serait une décision de ce jour-là, avec son lecteur.

---

## 9. Le droit, en règles de conduite

Une règle tient en une phrase, avec sa raison, qui la fait respecter, et son statut. Les sources sont en notes, sous le tableau.

| # | règle | pourquoi | qui la tient | statut |
|---|---|---|---|---|
| 1 | **Chaque prix affiché porte sa date, son unité, la mention HT, « livraison comprise ou non », et sa source.** | Présenter un ancien prix comme actuel, ou un mode de calcul qui induit en erreur, est une pratique commerciale trompeuse, **même entre professionnels** : jusqu'à 2 ans de prison et 300 000 €, et 5 ans et 750 000 € quand elle passe par un service en ligne | la base (rien n'entre sans date) et un contrôle sur l'affichage | certain |
| 2 | **Jamais « meilleur prix » ni « le moins cher ».** On écrit « N prix connus, liste non exhaustive ». | La comparaison ne porte que sur les fournisseurs de l'artisan : la présenter comme complète serait trompeur | un contrôle qui relit les textes | interprétation |
| 3 | **L'ordre de tri est écrit sur la page** (prix par unité de référence, à date comparable), **et toute offre payée est séparée et marquée « Annonce ».** | Un classement influencé par un paiement et présenté comme neutre est interdit. L'extension de cette règle aux pros est une lecture littérale de la loi ; aucune décision ne l'a encore appliquée à un comparateur entre pros | l'écran, et un contrôle | interprétation |
| 4 | **Le tri ne tient compte d'aucune commission**, et quand l'agent a servi, le nom du critère de tri est inscrit au journal — jamais les prix ni les fournisseurs. | L'Autorité de la concurrence s'inquiète d'agents d'IA orientés vers les produits de leurs partenaires. Le journal ne garde aujourd'hui ni la question ni la réponse : ce nom de critère est une donnée à y ajouter le jour où l'action naît | l'étage 1 (calcul), le journal de l'agent | interprétation |
| 5 | **Jamais le prix d'achat d'un artisan montré à un autre**, même sans nom, même en moyenne, sans avis d'avocat. | Ce sont des coûts et des prix d'achat échangés entre acheteurs concurrents, par une plateforme : une entente possible. Sur un marché local, même une moyenne révèle qui s'écarte | les règles de lecture de la base | avocat |
| 6 | **Jamais une information sur ses concurrents donnée à un fournisseur** : leurs prix, leurs volumes chez tel artisan, un « positionnement marché ». | C'est le pivot de l'accord « en étoile », où la plateforme fait circuler l'information entre concurrents | les règles de lecture ; aucune statistique par fournisseur | interprétation prudente |
| 7 | **Les prix nets d'un artisan ne sont traités que pour lui**, et les conditions d'Opus disent qu'il les traite comme prestataire, sous confidentialité. | La loi sépare elle-même le tarif public, qui doit être communiqué à un acheteur pro qui le demande, des conditions particulières, qui n'ont pas à l'être. Le juge peut ordonner la destruction de tout fichier dont un secret « peut être déduit » | la base ; la clause, écrite au module 6 | certain sur les textes ; avocat sur les clauses de chaque négoce |
| 8 | **Aucun programme ne lit les sites des négoces.** | C'est extraire une base protégée, et un catalogue non protégé peut aussi être interdit par contrat. Contourner une protection anti-robot ajoute un risque pénal | vous : ne jamais le construire | certain ; avocat pour l'anti-robot |
| 9 | **La Place des pros reste réservée aux professionnels. Un compte fournisseur y publie, mais ne lit pas les offres des autres.** | Le règlement européen dit « P2B » ne vise que les plateformes qui servent des **consommateurs**, et les règles françaises sur les comparateurs ne sont dues qu'« au consommateur » : ouvrir les offres aux particuliers ferait entrer les deux. Et un fournisseur ne peut voir les prix publics de ses concurrents que si ce n'est ni plus détaillé ni plus fréquent que ce que le marché voit déjà (point 389, tel que le résume le rapport sur le droit) | les règles de lecture de la base | certain pour P2B ; interprétation solide pour les comparateurs ; interprétation prudente pour la lecture du fournisseur |
| 10 | **Jamais de prix conseillé.** Jamais de prix de revente imposé par un fournisseur. Jamais d'exigence, envers un fournisseur, de garantir sur Opus son meilleur prix tous canaux confondus. | Imposer un prix de revente minimal est puni de 15 000 € d'amende ; cette exigence de « parité large » est exclue de l'exemption européenne ; un barème diffusé avec une « police des prix » a valu 1,5 M€ d'amende à l'Ordre des architectes | vous, dans les contrats ; l'agent n'écrit jamais de prix dans le devis | certain |
| 11 | **L'administration, vous compris, ne lit aucun prix individuel.** | Vous êtes du métier : celui qui reçoit l'information d'un concurrent « sera supposé avoir tenu compte » de cette information | les règles de la base ; la question de l'éditeur SQL reste ouverte | interprétation ; décision ouverte |
| 12 | **L'adresse du chantier lue sur une facture n'est jamais recopiée dans les prix.** La lecture d'une facture par l'IA est décrite dans le contrat de sous-traitance (qui n'existe pas encore), et le contrat avec le fournisseur du modèle exclut tout entraînement sur ces données. | C'est une donnée du client de l'artisan, dont Opus n'est que le sous-traitant | la base ; le contrat | certain pour l'article 28 du RGPD ; interprétation pour l'exclusion de l'entraînement ; avocat sur le contrat |
| 13 | **« Prix facturé, hors remises différées »**, jamais « votre coût réel ». | La loi définit le coût d'achat effectif comme le prix facturé moins les autres avantages | l'écran | certain |
| 14 | **Opus ne se présente jamais comme « plateforme agréée ».** | Il n'en remplit pas les conditions. La voie réaliste est celle d'une « solution compatible », raccordée à une plateforme agréée | vous, dans les textes | certain |
| 15 | **Une licence sur les données des artisans, écrite dans les conditions d'utilisation, doit être équilibrée**, pas imposée en bloc. | Une clause abusive sur l'usage des données, imposée à une autre entreprise, ne la lie pas (contrats conclus après le 12/09/2025) | vous, avec un avocat | avocat |
| 16 | **Une offre ou une réponse porte un prix actuel, jamais un prix annoncé pour plus tard** (« hausse au 1er janvier »). Une réponse encore valable à une demande de prix est un prix actuel. | Les prix futurs sont l'information la plus risquée entre concurrents | la base (une offre vaut dès sa publication) | interprétation |

**Les sources, règle par règle** (textes français lus sur le miroir codes.droit.org, édition du 10/10/2026) :

1. Code de la consommation, L121-2 2° c), étendu aux professionnels par L121-5 ; sanctions L132-2.
2. L121-2.
3. L121-4 25° via L121-5 ; LCEN art. 20 (texte non relu) ; le décret D111-7, repris volontairement comme modèle.
4. Avis 26-A-05 de l'Autorité de la concurrence du 17/07/2026, point 344 ; section 38 du schéma pour le journal.
5. Lignes directrices de 2023, points 281, 385, 391, 401 et 402.
6. Lignes directrices de 2023, point 402.
7. Code de commerce, L151-1, L441-1 III, L152-3.
8. Code de la propriété intellectuelle, L342-1, L342-2, L343-4 ; arrêt Ryanair (CJUE, 2015) ; Code pénal, 323-1.
9. Règlement 2019/1150, art. 1(2) ; Code de la consommation, L111-7 et D111-7 ; lignes directrices de 2023, point 389.
10. Code de commerce, L442-6 ; règlement 2022/720, art. 5(1)(d) ; décision 19-D-19.
11. Lignes directrices de 2023, point 397 ; `DONNEES-DES-ARTISANS.md` §5.2.
12. RGPD, art. 28 ; rapport sur le droit, A4.
13. Code de commerce, L442-5.
14. FAQ et présentation des labels, impots.gouv.fr.
15. Règlement 2023/2854 (« Data Act »), art. 13 et 50.
16. Lignes directrices de 2023, point 414.

**Ce qui revient à un avocat**, rassemblé. **Aucun de ces points ne se pose avant le module fournisseurs** ; la mise en commun de prix d'achat ne se pose peut-être jamais.

- toute mise en commun de prix d'achat, et ses seuils ;
- la portée des clauses de confidentialité des négoces envers un prestataire informatique ;
- l'application de L121-4 25° et de la publicité comparative (L122-1) si des fournisseurs paient ;
- la qualification pénale du contournement d'une protection anti-robot ;
- l'extension qui capture une page — **ajout de cette étude**, qui ne figure pas dans la liste du rapport sur le droit ;
- le contrat avec une plateforme agréée partenaire, y compris les transferts hors de l'Union vers le fournisseur du modèle d'IA ;
- l'équilibre de la licence de données au regard du Data Act ;
- le caractère obligatoire du geste séparé « retrouver mes prix dans mes factures ».

Et un point du rapport sur le droit, **hors du comparateur** mais à ne pas perdre : le règlement P2B s'applique probablement à l'autre face d'Opus, celle où les artisans reçoivent des demandes de particuliers, et son article 7 obligerait à décrire tout traitement différencié — or vous êtes vous-même artisan inscrit sur Opus.

---

## 10. Le modèle économique, et ce qu'il fait à la neutralité

| qui paie | où on le voit | ce que ça fait à la neutralité |
|---|---|---|
| **l'artisan, par un abonnement** | Tolteck, Tarifeo, Sage e-Tarif | **Opus reste libre** : il n'a aucun intérêt à classer un fournisseur avant un autre |
| **une commission ou une affiliation** sur les achats | le comparateur régional BatiPrix.pro et l'américain Contractor+ (affiliation) ; ManoMano Pro fait payer ses vendeurs : 100 € HT par mois et par pays, plus 15 à 25 % du prix HT | contradiction directe : on promet « le moins cher en premier » tout en gagnant plus sur un autre. Il faudrait le dire à chaque proposition (règles 3 et 4) |
| **la publicité des fabricants** | prévue par Roobeo en 2018 ; chez BatiChiffrage, des fabricants paient leur présence ; plus de 200 fabricants ont leur version du générateur de prix de CYPE | acceptable **seulement** si elle est séparée et marquée « Annonce » — les publications marquées « Sponsorisé » existent déjà —, et **jamais dans l'ordre de la comparaison** |
| **le financement par un négoce ou un industriel** | Saint-Gobain a la majorité de Tolteck, qui ne lit que Point.P et Cedeo ; un distributeur aurait investi dans Kojo (NON VÉRIFIÉ) ; des industriels sont au capital de Schüttflix et de Koncrete | la neutralité se perd : les autres négoces n'ont plus aucune raison de se brancher |

Un exemple à part : **bobbie**, payé par une marge fixe et annoncée sur ce qui se vend par lui, **refuse les ristournes de fabricants** au nom de la neutralité. Ce n'est pas un modèle d'abonnement, mais c'est le même raisonnement.

> **Recommandation : un fournisseur ne paie jamais pour un rang.** Il peut payer pour être VU — une annonce marquée —, jamais pour être CLASSÉ. Pas de commission sur les achats. **Si Opus devient payant pour l'artisan, le comparateur fait partie de ce qu'il paie.** Le prix d'un éventuel abonnement n'est fixé dans aucun document lu : cette étude ne le suppose pas.
>
> **Pourquoi.** La seule chose qu'un comparateur vend vraiment, c'est la confiance de l'artisan dans l'ordre qu'il affiche. Une commission la rend suspecte à chaque ligne. Et c'est cette même confiance qui fait vivre tout le reste d'Opus. `A-FAIRE.md` l'écrit pour la future base de données : « La confiance des artisans EST la base. »

### Et la base que vous voulez vendre un jour par API

Vous l'avez dit le 17/10 : faire un jour payer, par une clé d'accès, la base issue de tout ce qui se passe sur Opus (`A-FAIRE.md`, dernière section). Les prix d'achat du comparateur seraient la donnée la plus tentante pour cette base. **Ils sont aussi la plus risquée** : des achats entre concurrents, des conditions confidentielles des négoces, très probablement des secrets des affaires.

Recommandation : **les prix d'achat n'entrent dans aucune base commune ni dans aucune API** sans le cadre de `DONNEES-DES-ARTISANS.md` (une case à part, non cochée et retirable, des fourchettes régionales, assez d'artisans différents derrière chaque chiffre) **ET** sans un avis d'avocat. C'est votre décision, avec le troisième cahier des charges — pas un défaut à corriger.

### Opus ne devient pas négociant

Ne jamais acheter, stocker, livrer ni encaisser pour revendre. Trois raisons :

1. **l'argent.** Les places de marché qui l'ont fait consomment du capital, et plusieurs se sont restructurées (annexe C). Koncrete encaisse, et porte le risque d'impayé ;
2. **la neutralité.** Un vendeur a ses propres prix à défendre : il ne peut plus comparer honnêtement ;
3. **les partenaires.** Un Opus marchand deviendrait le concurrent des négoces dont il a besoin pour les connecteurs et les demandes de prix [interprétation].

**La commande se passe chez le fournisseur de l'artisan**, comme aujourd'hui. Opus prépare la liste, rien de plus.

---

## Annexe A — Les mots employés

| mot | ce qu'il veut dire ici |
|---|---|
| **négoce** | un magasin qui vend des matériaux aux professionnels (Point.P, Gedimat…). On dit aussi « distributeur » |
| **tarif public** | le prix catalogue qu'un fabricant ou un négoce publie pour tout le monde |
| **prix net** | le prix que l'artisan paie vraiment chez SON négoce, après sa remise. Il se négocie compte par compte, et il n'est pas public |
| **remise par famille** | une réduction en pourcentage accordée sur toute une famille de produits (« −X % sur la plomberie ») |
| **remise différée** (ou « de fin d'année ») | une réduction versée plus tard, par un avoir, selon ce qu'on a acheté dans l'année. Elle n'apparaît jamais sur la facture du jour |
| **franco de port** | la livraison est offerte au-delà d'un montant de commande ; en dessous, on paie le port |
| **conditionnement** | la façon dont un produit est vendu : un sac de 25 kg, une palette de 60 blocs. Souvent, on ne peut acheter que des conditionnements entiers |
| **unité de vente** | ce que compte le prix : la pièce, le sac, la palette, la tonne, le m² |
| **HT / TTC** | hors taxes / toutes taxes comprises |
| **franchise de TVA** | le régime d'une petite entreprise qui ne facture pas de TVA (« TVA non applicable, article 293 B du CGI ») |
| **SIREN / SIRET** | le numéro d'une entreprise (SIREN) et celui d'un de ses établissements, par exemple une agence (SIRET) |
| **répertoire Sirene** | le fichier de l'INSEE qui dit si une entreprise existe et si elle est active |
| **code d'activité (APE)** | le code d'activité qu'une entreprise reçoit de l'INSEE à son immatriculation |
| **PME, TPE, ETI** | petites et moyennes entreprises, très petites entreprises, entreprises de taille intermédiaire (entre les PME et les grandes) |
| **demande de prix** | une liste envoyée à un ou plusieurs fournisseurs, pour qu'ils répondent avec leurs prix (en anglais *RFQ*) |
| **nomenclature**, ou liste des matériaux | une liste rangée et fermée de catégories, avec des clés stables — comme le catalogue des métiers |
| **API** | une porte par laquelle un logiciel en interroge un autre |
| **EDI** | « échange de données informatisé » : deux logiciels d'entreprises s'envoient commandes et factures sans papier ni ressaisie |
| **GTIN** | le numéro du code-barres d'un produit. Unique au monde, mais seulement pour les produits emballés qui en ont un |
| **ETIM** | une classification internationale des produits techniques : elle décrit chaque produit par les mêmes caractéristiques, quel que soit le fabricant |
| **FAB-DIS** | un format de fichier français, par lequel les fabricants envoient leurs catalogues aux distributeurs |
| **facture électronique** | une facture envoyée sous forme de données qu'un logiciel sait lire, et non comme une simple image. Trois formats sont admis en France : **UBL**, **CII** et **Factur-X**, un PDF qui contient les données |
| **XML** | la forme des données d'une facture électronique : un fichier texte rangé, qu'un programme lit sans erreur |
| **plateforme agréée** | une société immatriculée par l'État pour transmettre les factures électroniques |
| **solution compatible** | un logiciel qui n'est pas plateforme agréée, et qui doit être raccordé à l'une d'elles pour émettre ou recevoir |
| **lecture d'image** (en anglais *OCR*) | faire lire par un programme le texte d'une photo ou d'un PDF |
| **règle de lecture de la base** (en anglais *RLS*) | la règle, tenue par la base de données, qui décide qui peut lire chaque ligne. C'est la base qui la tient, pas l'écran |
| **moissonnage** | recopier un site web avec un programme (en anglais *scraping*) |
| **indices de prix de production de l'Insee** | des indices qui suivent l'évolution des prix à la sortie de l'usine. Ils disent de combien un prix a bougé, jamais combien coûte un produit |
| **Licence Ouverte** | la licence de l'État qui permet de réutiliser des données publiques, y compris pour vendre un service, en citant la source |
| **lignes directrices de 2023** | le guide de la Commission européenne qui explique quand des concurrents peuvent, ou non, échanger des informations |
| **accord « en étoile »** | une entente où un tiers — par exemple une plateforme — fait circuler l'information entre des concurrents qui ne se parlent pas directement |
| **police des prix** | des membres qui surveillent et dénoncent les prix des autres : c'est ce que l'Autorité de la concurrence a sanctionné chez l'Ordre des architectes |
| **exemption européenne** | la liste des accords entre fournisseurs et revendeurs que l'Europe autorise d'office |
| **LCEN** | la loi française de 2004 sur l'économie numérique |
| **règlement P2B** | un règlement européen qui encadre les plateformes qui mettent des entreprises en relation avec des consommateurs |
| **Data Act** | le règlement européen sur les données (2023), qui interdit notamment d'imposer à une autre entreprise une clause abusive sur l'usage de ses données |
| **secret des affaires** | une information protégée par la loi parce qu'elle n'est pas publique, qu'elle a une valeur commerciale du fait de son secret, et qu'on la protège |
| **sous-traitant (au sens du RGPD)** | celui qui traite des données personnelles pour le compte d'un autre. Pour les clients d'un artisan, Opus est son sous-traitant |
| **agrégat** | un chiffre regroupé (une fourchette, une médiane) calculé sur plusieurs entreprises, dont on ne peut pas tirer le chiffre de chacune |
| **étage 1 / étage 2** | ce que l'application fait seule, sans IA (étage 1), et ce que fait l'agent, qui coûte un appel et propose sans décider (étage 2) |
| **lots du devis** | les étapes du plan du module devis (`docs/PLAN-DEVIS.md` 10.7) : lot 0 (l'émetteur), lot 1 (les lignes), lot P (la base de postes), puis lots 2 à 5, et un lot 6 conditionnel |

---

## Annexe B — Repères pour le développement

Pour celui qui construira. Rien de ce qui suit n'est à créer avant le lot qui s'en sert.

**L'état du code, relu le 17/10/2026 :**

- `public.est_un_pro()` rend « une ligne existe dans `professional_profiles` pour `auth.uid()` ». Elle ouvre la lecture de `demandes` (politique « lecture demandes », section 30), de `annonces_pro` et de `annonce_reponses` (section 13.5), et l'écriture dans le fil et la Place des pros ;
- `public.est_mon_entreprise(p)` rend `auth.uid() = p and est_un_pro()` depuis la section 44 : elle rendra **faux** pour un fournisseur ;
- `annonces_pro.auteur_id` référence `professional_profiles(id)`, et l'écriture exige `est_un_pro()`. `annonces_pro.unite` n'accepte que `total`, `jour`, `semaine`, `mois` ; le type `fournisseur` porte `avecUnite: true` dans `src/data/annonces.js`, avec la liste `UNITES` de location ;
- `users.type` n'accepte que `pro` et `particulier` (contrainte de la ligne 11 de `schema.sql`) ;
- toute la chaîne de la section 45 (`entreprise_registre.pro_id`, `devenir_pro()`, le déclencheur d'inscription) est bâtie sur `professional_profiles` ;
- le code APE est lu et rangé, mais ne refuse rien (`src/data/ape-metiers.js` : « LE CODE D'ACTIVITÉ PROPOSE UN MÉTIER. IL NE LE BLOQUE JAMAIS. ») ;
- `signalements_cible_type_check` accepte déjà `annonce` ;
- `posts.is_ad` et la carte « Sponsorisé » existent ;
- la limite de l'agent : `enregistrer_appel_ia(…, p_limite_jour default 60)`, qui ne compte que les appels `ok` des 24 dernières heures (section 38) ;
- `src/lib/recherche.js` porte les équivalences de la Place des pros (`placo` / `ba13`, `parpaing` / `agglo` / `bloc beton`).

**Le compte fournisseur, s'il naît :**

- un prédicat à part (par exemple `est_un_fournisseur()`), exécutable par `authenticated` parce qu'appelé par des politiques ; `est_un_pro()` ne devient **jamais** vrai pour lui ;
- une fiche fournisseur qui ne naît que dans une fonction de la base, sur preuve SIRET (le modèle d'OP006 et d'OP010) ;
- le type du compte verrouillé, comme OP004 ; `users.type` élargi, et sa contrainte `check` refaite explicitement (`drop constraint if exists` puis `add constraint` dans `schema.sql` ; sur la vraie base, création sous condition, le connecteur refusant un ordre qui commence par `drop`) ;
- une politique par verbe, jamais `for all` ;
- une fonction d'appartenance propre aux fournisseurs ;
- les offres : **soit leur propre table** (la plus simple à vérifier), **soit** la refonte de l'auteur et de l'écriture de `annonces_pro` ;
- `est_masque()` dans toutes les politiques des nouvelles tables (offres, demandes de prix, réponses) ;
- un champ de contact sur le modèle d'`email_pro`, jamais `users.email` ;
- la leçon de la section 44 : rejouer **tous** les fichiers d'essais après avoir posé le verrou.

**Les tables privées de l'artisan (mes fournisseurs, mes prix, mes conditions) :**

- appartenance par `est_mon_entreprise()` ;
- `revoke all … from anon`, comme `clients` (sections 18.2 et 41), et pas seulement « aucune politique pour `anon` » ;
- une ligne chacune dans `mes_donnees()`, qui reste la dernière fonction du fichier ;
- contraintes nommées en `_check`, pour que `src/lib/erreurs.js` rende un message en français ;
- aucune fonction `admin_*` ne lit une table de prix, et un contrôle le refuse ;
- les originaux dans un espace de stockage privé, chemin de trois niveaux au plus, connu de la fonction Edge `compte`.

**Les actions de l'agent :**

- chacune entre dans `ACTIONS_IA` (`src/lib/journal-ia.js`) avec ses quatre champs (`label`, `detail`, `sait`, `ou`), sa permission et son journal ; `npm run verifier-agent` refuse une action sans sa ligne dans « Mon agent » ;
- un refus (facture illisible) est noté `erreur` et ne compte pas dans la limite ;
- le journal ne garde ni prix ni fournisseur ; le nom du critère de tri est une donnée nouvelle, à ajouter avec l'action.

**Les essais :** chaque règle de lecture s'éprouve par `set local role` puis l'ordre, chacun dans son propre appel, jamais dans un bloc `do` ; chaque fichier d'essai commence par un « cas 0 » qui prouve que sa donnée existe.

---

## Annexe C — Le détail du marché

### C.1 En France, logiciel par logiciel

| qui | ce qu'il fait vraiment |
|---|---|
| **Tolteck** (lancé en 2017 ; Saint-Gobain Distribution Bâtiment France en a pris la majorité en 2018) | dans un devis, l'artisan se connecte à **son** compte Point.P ou Cedeo et voit ses prix négociés. Aucune comparaison côte à côte n'est décrite. La disponibilité se consulte sur la page du négoce |
| **Tarifeo** (vu dans EBP Bâtiment) | une bibliothèque de tarifs publics, mise à jour chaque jour, à laquelle l'artisan applique ses remises par fournisseur ; abonnement en plus du logiciel |
| **Sage e-Tarif** (Batigest) | même principe ; environ 16 € HT par mois (indicatif) |
| **Everwin GX-BTP** | connecté à Tarifeo et à Sonepar ; commande directe par échange informatisé |
| **Obat** | une extension qui extrait la désignation, la référence et le prix d'une page de fournisseur ; aucune comparaison |
| **Costructor** | « ouvrages Batiprix » ; en formule Business+, demandes de prix, bons de commande et import des factures d'achats |
| **Graneet** | rapproche la facture reçue du bon de commande et du budget du chantier ; aucune comparaison de prix décrite |
| **Renalto** | l'IA chiffre « avec vos prix, ou des prix du marché si vous n'en avez pas » ; import des anciens devis |
| **Buildora** | une extension « Ajouter au devis » ; 11 installations |
| **Koncrete** | granulats ; combinaisons matériau + transport, prix livré ; facture et encaisse ; consultation au-delà d'un seuil de volume |
| **GECET** | centrale d'achat ; un vrai comparateur, réservé aux membres |
| **BatiPrix.pro** | comparateur régional (Côte d'Azur), payé par l'affiliation, « à titre indicatif » |

### C.2 Hors de France

| qui | ce qu'il fait |
|---|---|
| **Kojo** (États-Unis) | comparaison côte à côte à partir des prix de l'entreprise ; la demande de matériel devient une demande de prix ; 215 000 offres reçues en 2025, selon ses chiffres |
| **Field Materials** (États-Unis) | lit les devis de fournisseurs, les bons de livraison et les factures ; aucune comparaison décrite |
| **SubBase** (États-Unis) | demandes de prix, commandes, rapprochement des factures |
| **Handoff, Buildxact** (États-Unis) | prix du magasin Home Depot le plus proche, par un partenariat signé |
| **Contractor+** (États-Unis) | comparateur gratuit payé par l'affiliation, produit d'appel pour un logiciel de devis |
| **Bidstacker** (Suède) | demande de prix à plusieurs revendeurs ; comparaison du prix total, de la livraison et des conditions |
| **bobbie** (Allemagne) | prix final fret compris ; conversion des m² en litres, seaux ou palettes ; orange ou rouge quand une donnée manque ; marges fixes, aucune ristourne de fabricant |
| **Materials Market** (Royaume-Uni) | place de marché de matériaux lourds ; qui fixe ses prix et comment elle gagne sa vie : NON VÉRIFIÉ |
| **Schüttflix** (Allemagne) | granulats en vrac ; environ 90 M€ de chiffre d'affaires en 2022 |

### C.3 Ceux qui ont cassé ou se sont restructurés

| qui | ce qui s'est passé | ce que la source en dit |
|---|---|---|
| **mesmateriaux.com** (vente en ligne, France) | une annonce au Bodacc en novembre 2018 (« dépôt de l'état des créances ») ; le domaine est en vente (mesuré le 17/10/2026). La liquidation elle-même est NON VÉRIFIÉE | cause non dite |
| **Roobeo et Inpera, devenues Conpur** (Allemagne) | fusion fin 2023, puis actifs immatériels repris par bobbie en août 2025 | cause non dite |
| **Schüttflix** (Allemagne) | 65 postes supprimés annoncés le 07/07/2026 (environ 18 % de l'effectif) | « conditions difficiles dans le secteur de la construction et coûts en hausse » (traduit de l'anglais) |
| **BuildDirect** (États-Unis) | protection contre ses créanciers en 2017 | sa dette |
| **l'API de 1build** (États-Unis) | refermée en liste d'attente au 17/10/2026 | cause non dite |

La leçon générale vient du rapport sur le marché : **ceux qui achètent, stockent, livrent ou encaissent consomment du capital et se restructurent souvent.**
