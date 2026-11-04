# L'agent qui aide l'artisan à gérer son entreprise — une VISION, PAS CONSTRUITE (04/11/2026)

> ## ⚠️ Une VISION, PAS CONSTRUITE
>
> **Rien de ce document n'existe dans Opus.** Aucune ligne de code, aucune
> table, aucune écriture dans Supabase. Ce texte range votre idée du
> 04/11/2026, ce que deux études du même jour en ont tiré, et l'ordre dans
> lequel elle pourrait se construire.
>
> **Rien ne se construit avant la fin du devis et de la facture.** C'est
> votre priorité, et c'est aussi une règle du projet : « L'agent ne peut
> agir que sur ce qui EXISTE » (`docs/A-FAIRE.md`, « Le logiciel de
> gestion — l'ordre des modules »). Vos deux autres idées récentes ont été
> rangées de la même façon : les urgences par la position du téléphone
> (« on finit d'abord le devis et la facture », 26/10) et le parrainage
> (« après le lot 5 du devis », 03/11).
>
> **Aucune publicité ne promet ces fonctions avant qu'elles existent.**
> Annoncer une fonction qui n'existe pas peut être une « pratique
> commerciale trompeuse » : la définition est à l'article **L. 121-2** du
> code de la consommation, et l'article **L. 121-5** l'étend aux pratiques
> qui visent des professionnels, donc des artisans. La sanction irait
> jusqu'à 2 ans de prison et 300 000 € d'amende, ou plus selon le chiffre
> d'affaires (article **L. 132-2**, lu seulement dans des sources
> secondaires). **À faire confirmer par un juriste.** Vous avez déjà mis
> les publicités de côté le 26/10 ; cette idée confirme ce choix. Même « bientôt » est risqué : la page « Mon
> agent » interdit déjà d'annoncer une date pour ce qui viendra.

**Ce document est écrit pour vous.** Il s'appuie sur deux études faites le
04/11/2026 : cinq recherches (la boîte e-mail, les administrations, la
concurrence, le droit et le coût, la place dans le plan), puis trois
compléments (les factures fournisseurs, la marge, l'URSSAF). Chacune a été
contre-examinée par un relecteur chargé d'y trouver des erreurs. **Quand le
relecteur a corrigé, c'est sa version qui figure ici.**

Ce n'est **pas un avis d'avocat**, ni d'expert-comptable.

Les marques employées :

- **[établi]** : lu dans la source citée ;
- **[probable]** : déduit de sources concordantes, ou lu seulement dans une
  source secondaire ;
- **[à vérifier]** : la source n'a pas pu être ouverte, ou rien de sûr n'a
  été trouvé ;
- **[juriste]** : la réponse dépend du droit et de faits précis ; seul un
  professionnel peut trancher ;
- **[proposition]** : une idée de l'étude, à valider par vous.

Sans marque, un chiffre a sa source et sa date dans la même phrase.

---

## Les mots employés

| mot | ce qu'il veut dire ici |
|---|---|
| **agent** | la partie d'Opus qui se sert de l'IA pour préparer un travail. Aujourd'hui, il sait faire cinq choses ponctuelles, dont le récit d'un chantier |
| **API** | une porte prévue pour qu'un logiciel parle à un autre logiciel, sans passer par un écran |
| **OAuth** | l'artisan se connecte chez Google ou Microsoft, qui remet à Opus une **clé d'accès** (un « jeton »). Opus ne voit jamais le mot de passe, et l'artisan peut retirer la clé quand il veut |
| **permission** (en anglais « scope ») | ce qu'une application demande le droit de faire dans une boîte : lire, écrire un brouillon, envoyer… |
| **IMAP** | la façon standard de relever une boîte e-mail depuis l'extérieur. Chez Orange, Free ou SFR, elle demande le mot de passe de la boîte (chez Orange, un mot de passe spécial à générer) |
| **plateforme agréée** | un service autorisé par l'État à faire circuler les factures électroniques entre entreprises |
| **solution compatible** | un logiciel raccordé à au moins une plateforme agréée. Il agit pour l'entreprise auprès d'elle, mais ne transmet rien lui-même |
| **facture électronique** (structurée) | une facture sous forme de **données** qu'un programme lit sans IA : chaque ligne, chaque quantité, chaque prix sont dans des cases. **Factur-X** est un PDF qui contient ces données |
| **FEC** | le fichier des écritures comptables, demandé lors d'un contrôle fiscal |
| **tiers-déclarant** | un organisme habilité par l'URSSAF à déclarer pour un micro-entrepreneur, sur son mandat |
| **responsable de traitement / sous-traitant** (RGPD) | celui qui décide pourquoi des données personnelles sont traitées / celui qui les traite pour lui, sur ses instructions |
| **AIPD** | analyse d'impact : une étude écrite des risques pour la vie privée des personnes concernées |
| **jetons** (pour l'IA) | des morceaux de mots. L'IA se paie au nombre de jetons qu'elle lit et qu'elle écrit |
| **tâche planifiée** | un travail que le serveur lance tout seul, à heure fixe |
| **notification push** | un message qui arrive sur l'écran verrouillé du téléphone |
| **déboursé sec** | ce que coûte directement un ouvrage : matériaux, matériel, main-d'œuvre |
| **frais généraux** | ce que coûte l'entreprise pour fonctionner : administratif, locaux, assurances, véhicule… |
| **coefficient** | le nombre par lequel on multiplie le déboursé sec pour obtenir le prix de vente |
| **e-mail piégé** (« injection ») | un e-mail qui contient des instructions cachées, que l'IA risquerait d'exécuter |

---

## 1. L'idée, avec vos mots

Le 04/11/2026, en deux messages :

> « jais créé un claude cowork qui suit mes email prepare etc on pourrais peut etre créé ce systeme la sur opus un artisant qui ce connecte a opus connect sa boite email est sont comptable ou sont espace ursaff etc et opus pourrais automatiquement lui créé ce syteme relver ces email lui preparer des raiponce classer automatiquement cest facture dans sont espace etc lui faire des notification pour lui rappler qu'il doit repondre a un email et que le brouillon est fais etc pour qu'il puisse gerre toute son entreprise tres simplement a partir de opus cest reellement ce que fais claude cowork mais beaucoup de perssonne ne connaisse pas est ne save pas le faire le preparer automatiquement dans opus et avoir l'agent qui travaille pour l'artisan serais un point enorme de vente pour opus ? »

> « oui je sais que nous on photographie nos facture mais si il pourrais automatiquement les relver les classer etc et aussi pouvoir dir attention une letre de l'ursaff te demande une raiponce jai créé ton email de reponce en brouillon etc vraiment ce que fais un cowork mais dans opus et aide lartisan dans toute sa gestion de sont etrprise avec des notification pour ne pas qu"il oublie des alerte pour ne pas qu'il se plante des analiseur de marge en disant attention sur ton devis tu prevois tent de jour de travaille tu va avoir ten de materiaus attention marge basse etc tous ces chose qui peuve mettre a mal une entreprise relancer les facture impayer analiser les depence et dire par exmeple attention l'urssaf demande ce prix d'habitude ce n'est pas sa prepare un email etc par exmple voir les tarif sur les facture de materiaus et dir par exemle attention la semaine derniere tu as payer le sac de ciment 10 euro cette semaine il ton facturer 10.20 etc tous ce qui peut aider un artisan »

**Ce que l'idée contient, morceau par morceau** — c'est l'ordre du §4 :

| morceau | vos mots |
|---|---|
| relever et classer les factures fournisseurs | « classer automatiquement cest facture » ; « automatiquement les relver les classer » |
| brancher la boîte e-mail, préparer des réponses | « connect sa boite email » ; « lui preparer des raiponce » |
| l'URSSAF, les impôts | « sont espace ursaff » ; « une letre de l'ursaff te demande une raiponce » |
| le comptable | « sont comptable » |
| la marge d'un devis | « tu prevois tent de jour de travaille tu va avoir ten de materiaus attention marge basse » |
| le prix des matériaux | « la semaine derniere tu as payer le sac de ciment 10 euro cette semaine il ton facturer 10.20 » |
| ne rien oublier | « des notification pour ne pas qu"il oublie des alerte pour ne pas qu'il se plante » |
| un montant inhabituel | « l'urssaf demande ce prix d'habitude ce n'est pas sa » |
| les impayés et les dépenses | « relancer les facture impayer analiser les depence » |

---

## 2. Mon avis, en quelques phrases

1. **Ce n'est pas un énorme argument de vente tout seul.** Les brouillons
   de réponse et le tri des factures existent déjà ailleurs, souvent pour
   pas cher, parfois gratuitement (tableau plus bas).
2. **Il peut en devenir un, à une condition : que l'agent se serve de ce
   qu'Opus sait déjà** sur l'artisan — ses clients, ses devis, ses
   factures, ses chantiers, ses prix. Une phrase comme « Votre secrétariat
   qui connaît déjà vos chantiers et vos clients », aucun concurrent trouvé
   ne peut la dire.
3. **Cette condition ne sera remplie qu'après le devis, la facture et les
   dépenses.** Et la partie « Opus lit ma boîte Gmail » est la plus chère et
   la plus contrôlée : elle vient en dernier.
4. **La moitié de votre idée n'a pas besoin d'IA.** Une marge, une hausse de
   prix, une échéance, une estimation de cotisations sont des **calculs**.
   Opus les fait sans appeler l'IA : sans coût d'appel, et sans rien pouvoir
   inventer. L'IA ne sert qu'à lire une photo et à rédiger.

### La douleur existe, et elle est mesurée

| étude | ce qu'elle dit |
|---|---|
| **OpinionWay pour Qonto**, publiée le 09/04/2026 : 300 dirigeants de TPE du bâtiment (0 à 49 salariés), interrogés par téléphone du 26/02 au 20/03/2026 | **13 h 21 par semaine** de gestion administrative et financière ; **1 dirigeant sur 2** y passe plus d'une journée entière ; 68 % ont un logiciel de facturation, 22 % travaillent encore à la main ou sur tableur. Lu dans des relais de presse qui citent l'étude. C'est très probablement l'étude que vous avez lue : un journal l'a titrée « 13 heures par semaine absorbées par la paperasse » (20/04/2026) |
| **Baromètre ARTIsanté 2025** (CAPEB et IRIS-ST, avec la CNATP), publié le 26/05/2026 : 2 491 répondants, enquête en ligne de décembre 2025 à janvier 2026 | **42 %** citent l'administratif comme source de stress ; **63 % lisent leurs e-mails tous les jours pendant leurs congés** ; l'administratif prend plus d'un quart du temps pour 31 % des artisans seuls |
| **Observatoire des métiers du BTP**, enquête du **début 2025** (621 répondants), publiée le 10/02/2026 | **moins de 10 %** des chefs d'entreprise du BTP utilisent l'IA ; 36 % sont intéressés. **Le chiffre a presque deux ans : il a sans doute bougé** |
| **Baromètre France Num 2026** (ministère de l'Économie, 28/09/2026), plus de 9 000 entreprises | 40 % des TPE-PME utilisent l'IA, mais **19 % seulement paient** pour un outil d'IA |

**Les limites, à dire honnêtement :**

- les 13 h 21 couvrent **toute** la gestion. **Aucune étude ne dit quelle
  part vient des e-mails** ;
- certains chiffres circulent sans source fiable : « 10 à 15 h par
  semaine » attribué à la CAPEB, « 28 % du temps sur les e-mails »,
  « 42 % veulent s'y mettre d'ici fin 2026 ». **Ne pas les reprendre** ;
- 19 % seulement paient pour l'IA : la douleur est réelle, l'envie de payer
  reste à prouver.

### Ce qui existe déjà (relevé le 04/11/2026, sur les pages des éditeurs)

Aucun de ces outils n'a été essayé : tout vient de leurs pages, de leur aide
et de la presse.

| outil | ce qu'il fait | prix |
|---|---|---|
| **Qonto** (banque) | se connecte à Gmail et va chercher les factures fournisseurs toutes les 3 heures, dans toutes ses formules. Depuis le 27/04/2026, d'après Qonto, ses agents IA lisent jusqu'à 50 factures d'un coup et préparent les virements, que le client valide | compris dans l'abonnement bancaire |
| **Costructor** (devis et factures du bâtiment) | un agent IA ; une porte (un « serveur MCP ») qui permet de piloter le compte depuis ChatGPT ou Claude, listée dès la formule Pro, mais aussi en option à 10 € HT par mois sans dire pour qui ; en formule Premium, une « intégration Gmail et Microsoft 365 » dont **ce qu'elle fait n'est expliqué nulle part** | 0, 15, 30 ou 60 € HT par mois (12,50 / 25 / 50 € en annuel) |
| **Artisaia** (« L'IA des artisans ») | trie les e-mails, propose des réponses rédigées au nom de l'artisan, fait les devis ; éditeur non nommé, aucun nombre d'utilisateurs | 25 € TTC par mois |
| **Matinel** (pas encore lancé) | lit les e-mails, prépare des brouillons dans Gmail ou Outlook. Il annonce « rien n'est envoyé sans votre validation », mais sa formule Pro parle de « trois niveaux d'autonomie », et sa prise de rendez-vous par WhatsApp envoie elle-même l'e-mail de confirmation | Solo 25 à 30 € HT, Pro 41 à 50 € HT par mois |
| **Fyxer** | brouillons dans le ton de l'utilisateur, tri automatique ; le français n'est pas annoncé | 37 à 49 $ par mois |
| **Copilot dans Outlook** (Microsoft) | rédige et résume ; une version simple est incluse dans Microsoft 365 | option à 18 $ par mois en promotion jusqu'au 31/12/2026, 21 $ ensuite |
| **Gemini dans Gmail** (Google) | résumés, réponses suggérées | inclus dans Google Workspace |
| **Claude Cowork** (celui que vous utilisez) | lit les e-mails, rédige, et demande la permission avant chaque envoi **par défaut** (dans les formules Team et Enterprise, le propriétaire du compte peut lever cette demande). **Il ne lit pas le contenu des pièces jointes** : pas une facture en PDF | dès 17 à 20 $ par mois |
| **Abby** | se dit « partenaire officiel » de l'URSSAF : déclare le chiffre d'affaires des micro-entrepreneurs | c'est l'éditeur qui le dit |

**Ce qu'on en retient :**

- ce service se vend **entre 18 et 60 € par mois** ;
- **rédiger une réponse est déjà presque gratuit** (Gmail, Outlook, Claude) ;
- **récupérer les factures est déjà gratuit** chez Qonto ;
- **l'avantage « l'agent connaît mes chantiers » peut être copié** : la porte
  de Costructor, branchée à Claude ou ChatGPT, fait déjà quelque chose de
  proche ;
- **personne de ce qui a été trouvé ne réunit les trois** : un réseau social
  de professionnels, la gestion (devis, factures, clients, chantiers) et un
  agent qui lit la boîte e-mail. On ne peut pas prouver qu'un tel outil
  n'existe nulle part, mais aucun n'a été trouvé ;
- **ce qui est vraiment propre à Opus** : une demande reçue sur le réseau,
  la fiche du client, le devis en cours et les photos du chantier sont
  **déjà au même endroit**. Cet avantage ne vaut que s'il y a du monde :
  la vraie base comptait 14 comptes et 8 fiches professionnelles le
  02/11/2026 (`CLAUDE.md`, lot S-d).

### Cowork chez vous, et Opus chez mille artisans : pas la même chose

Avec Cowork, **vous** branchez **votre** boîte sur un outil que vous avez
choisi. Dans Opus, c'est Opus qui deviendrait l'intermédiaire de milliers
d'artisans, avec les e-mails de leurs clients. Tout ce qui suit en découle :
la vérification par Google, le contrat de sous-traitance, l'analyse
d'impact, la sécurité, le coût par artisan.

---

## 3. Ce qui est DÉJÀ prévu par votre cahier des charges, et ce qui est NEUF

### Déjà prévu (cahier des charges du 29/09/2026 ; le PDF fait foi)

| votre idée | section | ce que le cahier dit |
|---|---|---|
| photographier et lire les factures | §13 | « Photo d'une facture fournisseur, ticket ou justificatif. » ; « OCR automatique. » ; « Extraction fournisseur, date, montant, TVA, catégorie et chantier potentiel. » |
| les classer, avec validation | §13 | « Proposition de classement par l'IA. » ; « Validation humaine lorsque nécessaire. » ; « Conservation de l'original et traçabilité des modifications. » |
| préparer pour le comptable | §13 | « Préparation d'un dossier comptable structuré. » — et Opus est « un outil d'assistance à la gestion et de préparation comptable, pas […] un remplacement automatique de l'expert-comptable » |
| relancer | §3.3, §10 | « Quels devis dois-je relancer ? » ; « Préparation de relances. » ; statuts « payé / en attente / en retard » |
| des réponses préparées | §19 | « Préparer des réponses aux demandes reçues. » ; « Le propriétaire conserve la possibilité de valider avant publication ou envoi. » |
| l'agent prépare, l'artisan décide | §2, §4 | « Les actions irréversibles ou engageantes demandent une validation » ; « Commande / dépense » : « Validation obligatoire par défaut » |
| des notifications sans harceler | §2, §4, §24 | « Les notifications doivent être classées par importance. » ; suggestions « utiles, regroupées et désactivables » ; « DISCRÉTION : pas de suggestions incessantes. » |
| des alertes au tableau de bord | §8.1 | « Factures impayées. » ; « Alertes IA. » ; « Actions importantes du jour. » |
| la marge | §8.2, §12 | « Marge estimée / réelle selon les données disponibles. » ; le chantier porte « Dépenses », « Temps passé », « Marge » |
| les frais de l'entreprise | §3.2 | la mémoire de l'agent contient les « Frais fixes et variables » |
| une hausse des prix | §20 | « comparer temps estimé et temps réel ou signaler une évolution des coûts » ; « Les analyses doivent rester traçables et basées sur les données réellement disponibles. » |
| le prix des matériaux | §14 | distinguer « Mes prix réellement payés », « Prix fournisseurs disponibles » et « Prix observés dans mes documents ». « Un ancien prix ne doit jamais être présenté comme un prix actuel sans indication de date. » |
| dire ce qui est estimé | §24 | « TRANSPARENCE : l'IA indique lorsqu'une information est estimée, ancienne ou incertaine. » |
| tracer ce que fait l'agent | §21, §23 | « Journal d'activité et audit des actions de l'IA. » ; « Confirmation des actions sensibles. » |
| le parcours complet | §25, étape 4 | « l'artisan photographie les factures fournisseurs. L'OCR extrait les informations, propose leur classement et enrichit l'historique des prix après validation. » |
| quand | §27 | phase 7 « OCR justificatifs + dépenses » ; phase 12 « Optimisation, automatisations et fonctionnalités avancées » |

**Une grande partie de l'argument de vente est donc déjà à vous, écrite le
29/09.**

### Ce qui est NEUF

Les mots « e-mail », « URSSAF » et « banque » n'apparaissent ni dans la
transcription du cahier des charges ni dans le PDF [établi, relevé du
04/11/2026]. Le §26 prévoit des « points d'intégration pour OCR, recherche
documentaire, connaissances BTP, fournisseurs et IA » : une messagerie n'en
fait pas partie.

Ce qui est neuf :

1. **brancher la boîte e-mail** de l'artisan : la lire, la trier, préparer
   des réponses, le prévenir ;
2. **l'URSSAF et les impôts** : courriers, échéances, montants ;
3. **le comptable**, par un accès à son logiciel (le cahier ne prévoit
   qu'un « dossier comptable structuré ») ;
4. **une alerte sur la marge d'un devis EN COURS**, avant de le remettre
   (le cahier parle de marge au tableau de bord et au chantier) ;
5. **les échéances administratives** (CFE, attestation de vigilance,
   décennale…) ;
6. **l'estimation des cotisations** d'un micro-entrepreneur, et
   l'explication d'un écart.

Un rappel de méthode, écrit dans `CLAUDE.md` : le cahier des charges ne
décrit pas tout Opus, et une absence n'est pas un refus. Ces six points ne
sont donc ni acceptés ni écartés : ils sont à vous de les ranger (§8).

---

## 4. Brique par brique : ce qui est faisable, comment, et ce que ça coûte

### 4.a Les factures fournisseurs

Trois portes, de la meilleure à la plus fragile.

#### La facture électronique reçue par une plateforme agréée : la meilleure porte

**Le calendrier** [établi : FAQ officielle de la DGFiP, « Version du
01/09/2026 » ; page impots.gouv modifiée le 26/05/2026] :

- **depuis le 01/09/2026**, toutes les entreprises doivent pouvoir
  **recevoir** des factures électroniques, par une plateforme agréée —
  franchise de TVA et micro-entreprise comprises ;
- les grandes entreprises et les entreprises de taille intermédiaire (ETI)
  les **émettent** depuis la même date ;
- les PME, TPE et micro-entreprises les émettront **au plus tard le
  01/09/2027**.

Ce calendrier ne vaut que **entre entreprises assujetties à la TVA et
établies en France** : une vente à un particulier n'est pas une facture
électronique.

**Pourquoi c'est la meilleure porte pour suivre « le sac de ciment ».**
L'arrêté du 27/07/2026 ne cite que deux profils de facture, « EN16931 » et
« EXTENDED-CTC-FR » (en CII, en UBL, ou dans un PDF Factur-X) [établi].
Ce sont les formats qu'une **plateforme agréée** doit savoir traiter : une
facture partie dans un autre format est convertie par la plateforme qui
l'émet, et celle du destinataire la remet à son client dans un de ces
formats [établi]. Ces
profils portent **les lignes**. Dans chaque ligne, la norme européenne
EN 16931 rend **obligatoires** : le nom de l'article, la quantité, l'unité,
le montant net de la ligne, et le **prix unitaire net hors TVA** [établi,
Peppol BIS Billing 3.0, version de mai 2026].

Conséquence : pour ces factures, **Opus lit le prix sans IA** — donc sans
coût d'appel, et sans envoyer de données au fournisseur du modèle d'IA.

**Les limites, et elles comptent :**

| limite | ce que ça veut dire | statut |
|---|---|---|
| **la référence produit est facultative** | le rapprochement « même sac de ciment » se fera souvent sur la désignation en texte libre et l'unité | établi |
| **le conditionnement n'a pas de case** | « sac de 35 kg » ne se trouve que dans la désignation | probable |
| **les factures récapitulatives** | la norme exige **au moins une** ligne, pas une ligne par article : une facture peut porter une ligne par bon de livraison (« Fournitures selon BL n° … »). Le suivi d'un article n'est donc pas garanti, même avec une facture structurée | probable, déduit de la norme |
| **une conversion impossible** | quand la conversion « ne permet pas de garantir strictement l'intégrité des données », la plateforme transmet aussi une **représentation lisible** : un document sans cases | établi (arrêté du 27/07/2026) |
| **les tickets de comptoir** | un ticket de caisse, ou une facture au nom d'un salarié, est une vente à un particulier : **l'entreprise ne reçoit aucune facture électronique**. Pour en recevoir une, l'artisan donne au vendeur le SIREN et l'adresse de facturation électronique de son entreprise | établi (norme XP Z12-014, annexe A v1.2, cas n° 5 et 6) ; inchangé dans la version 1.4 : à vérifier |
| **les PME jusqu'en 2027** | beaucoup de négoces indépendants sont probablement des PME : une partie des factures restera en PDF ou en papier jusqu'au 01/09/2027. Un négoce l'a annoncé à ses clients : SAMSE a écrit (courrier du 18/03/2026) qu'il passerait à l'émission électronique le 01/09/2026 | probable pour les PME ; la taille de Point.P, de Gedimat et des indépendants : à vérifier |
| **le prix facturé n'est pas le coût réel** | les remises de fin d'année n'apparaissent pas sur la facture. La loi définit le « prix d'achat effectif » comme le prix facturé **moins** les autres avantages (code de commerce, L. 442-5). L'écran dira donc « prix facturé, hors remises différées » | établi (`docs/COMPARATEUR-MATERIAUX.md` §7.1) |
| **aucune plateforme choisie** | si l'artisan n'a choisi aucune plateforme, l'annuaire lui en attribue une « fictive » (matricule 9998) : la facture structurée n'a alors nulle part où arriver | établi (spécifications v3.2) |

**Le vrai obstacle n'est pas le format, c'est l'accès.** La facture arrive
sur la plateforme de l'artisan, pas dans Opus. Trois voies, de la plus
réaliste à la plus lourde :

1. **l'artisan importe le fichier** (XML ou Factur-X) qu'il télécharge sur
   sa plateforme ou qu'il demande à son comptable. Sans partenaire, licite,
   presque gratuit : `docs/COMPARATEUR-MATERIAUX.md` le classe « à faire en
   premier ». Prévu au **module 6 (Dépenses)** ;
2. **Opus devient « solution compatible »**, raccordé à une plateforme
   agréée partenaire. C'est le modèle des logiciels de devis du bâtiment :
   Obat, Costructor, Henrri, Tolteck, Batappli et Extrabat **ne figurent pas**
   dans la liste officielle des plateformes (vérifié le 04/11/2026) ; ils
   passent probablement par un partenaire. Cette voie servirait aussi à
   **émettre** les factures de l'artisan, obligation du 01/09/2027.
   - L'artisan doit signer un « accord formel » qui désigne cette
     plateforme dans l'annuaire. Un changement de plateforme peut prendre
     jusqu'à 2 + 5 + 15 jours ouvrables (décret n° 2026-677). Il peut avoir
     plusieurs plateformes [établi].
   - Une plateforme **n'est pas obligée d'avoir une API** ; si elle en a
     une, elle suit la norme XP Z12-013 [établi].
   - Certaines plateformes vendent une offre « en marque blanche » aux
     éditeurs (par exemple B2BRouter), **sans tarif publié**. **Le coût d'un
     partenariat est à vérifier.**
   - **La décision est déjà rangée au module 3 (Factures)**
     (`docs/A-FAIRE.md`, « Fournisseurs et prix »).
3. **Devenir soi-même plateforme agréée : hors de portée.** Il faudrait une
   certification de sécurité ISO 27001, l'engagement de ne transférer
   **aucune** donnée hors de l'Union européenne, la qualification
   SecNumCloud de l'hébergeur (qu'elle soit encore exigée après le décret
   n° 2026-677 : à vérifier), un audit et des tests. Inconciliable avec Opus tel qu'il est :
   le fournisseur du modèle d'IA est aux États-Unis.

**La liste officielle**, modifiée le 03/11/2026 : **158 plateformes** qui
remplissent les conditions, tests d'interopérabilité compris, et 7 en
attente de leurs tests. La page dit « immatriculées **sous réserve** » ; ces
158 attendent probablement encore leur rapport d'audit [probable]. On y
trouve par exemple Abby, Cegid, Indy, Pennylane, Qonto, Sage, Tiime. **Aucun
négoce n'y figure sous son nom.**

Un bonus pour les relances [probable] : la réforme prévoit des statuts de
cycle de vie de la facture, dont « Encaissée ».

#### L'adresse de dépôt propre à chaque artisan : le pont jusqu'en 2027

L'idée : chaque artisan reçoit une adresse Opus à lui (par exemple
`code-artisan@factures.opus-project.com`) et y **transfère** ses factures, à
la main ou par un filtre de sa messagerie.

**Pourquoi c'est la porte la plus simple :** aucune vérification par Google
ou Microsoft, aucun mot de passe gardé, et ça marche avec n'importe quelle
boîte.

**Comment** [établi, documentations relevées le 04/11/2026] :

- Supabase ne reçoit pas d'e-mails [probable, absence de documentation]. Il
  faut un service de réception qui transmet chaque message à une fonction
  d'Opus sur le serveur :
  - **Postmark** : un réglage de courrier (« MX ») sur un sous-domaine ;
    reçoit à n'importe quelle adresse du domaine ; 35 Mo de pièces jointes ;
    10 nouvelles tentatives, de 1 min à 6 h. La réception est listée sur les
    formules à 16,50 $ et 18 $ par mois (page des prix non datée) ;
  - **SendGrid** : 30 Mo conseillés ; offre gratuite non dite ;
  - **Mailgun** : 1 règle de réception en gratuit, 5 règles à 15 $ par
    mois, l'accès complet à 35 $ par mois (page non datée) ;
  - **Cloudflare** : demande de déplacer tout le réglage du domaine chez
    Cloudflare ; 25 Mo par message.
- Le domaine d'Opus est `opus-project.com`, dont le courrier est servi par
  IONOS (`CLAUDE.md`). Un sous-domaine (`factures.…`) ne touche pas à la
  future boîte de contact [probable pour Mailgun].
- **Gmail envoie un lien de validation** à l'adresse de transfert, et ne
  transfère rien avant qu'on ait cliqué. Opus devra montrer ce message à
  l'artisan.
- **Chaque adresse doit être impossible à deviner** : sinon n'importe qui
  peut y envoyer.
- **Les originaux se rangent dans un espace privé**, trois niveaux de
  dossiers au plus : la fonction qui fait le ménage d'un compte ne descend
  pas plus bas (leçon des pièces jointes du 04/10, `CLAUDE.md`).
- **Un nouveau destinataire** entre dans les textes légaux : le service de
  réception.

**Ses limites :** Opus ne voit que ce que l'artisan transfère ; il ne peut
pas déposer de brouillon **dans** sa boîte ; et le jour où les factures
entre entreprises arriveront surtout par la plateforme agréée (au plus tard
2027), l'adresse servira surtout aux tickets, aux fournisseurs étrangers et
aux courriers.

#### La photo : déjà prévue, et toujours nécessaire

C'est le §13 de votre cahier. Elle reste indispensable pour les tickets de
comptoir et pour les fournisseurs qui n'émettent pas encore en électronique.

> **Votre décision, le 04/11/2026 :** « je suis daccord avec toi pour la
> facturation electronique mais il faut qu'il puisse aussi prendre en photo
> pour enregistrer leur ticket de caisse etc ».
>
> **Les deux portes coexistent, et aucune ne remplace l'autre.** La
> facture électronique est la porte principale pour les achats entre
> entreprises ; la photo reste pour tout le reste : le ticket de caisse du
> comptoir, l'essence, le péage, le petit achat payé par carte, la facture
> papier d'un fournisseur qui n'émet pas encore en électronique. Un ticket
> n'est pas une facture électronique (voir « les tickets de comptoir »,
> plus haut) : sans la photo, ces dépenses-là n'entreraient jamais dans
> Opus.

- **un appel d'IA par facture**, compté dans la limite de 60 appels par
  jour et par compte. Un gros paquet de photos s'étalera sur plusieurs
  jours, et l'écran le dira (`docs/COMPARATEUR-MATERIAUX.md` §3.1) ;
- **la fiabilité est à mesurer**. Dans la compétition DocILE (2023), avec
  des modèles spécialisés, le meilleur score sur la lecture des lignes de
  documents commerciaux restait sous 80 % (`docs/COMPARATEUR-MATERIAUX.md`
  §7.1 ; pour les modèles d'IA actuels, un classement d'éditeur ne donne
  qu'un score global, sans mesure sur les lignes). Aucun banc d'essai public sur des factures de négoce françaises
  n'a été trouvé [à vérifier] ;
- **toujours une validation**. Tant qu'une ligne lue n'est pas validée,
  l'écran dit « observé dans vos documents — à confirmer ». C'est votre
  §14 ;
- **la lecture d'une photo est une action de l'agent** : sa permission (§4 :
  « Commande / dépense » — « Validation obligatoire par défaut »), son
  journal, sa ligne dans « Mon agent », et une ligne « erreur » quand la
  facture est illisible.

### 4.b La boîte e-mail

#### Gmail

- **Toutes les permissions utiles sont au niveau le plus contrôlé**
  (« restricted ») : lire (`gmail.readonly`), ranger (`gmail.modify`),
  écrire un brouillon (`gmail.compose`), et même lire seulement les
  en-têtes (`gmail.metadata`) [établi, page des permissions Gmail].
- **Pour une application publique**, Google exige une vérification de la
  marque et du domaine, une vidéo de démonstration, et une **évaluation de
  sécurité payante appelée CASA**, faite par un laboratoire agréé et
  **refaite au moins tous les 12 mois**. Google parle de « plusieurs
  semaines » pour la vérification [établi].
- **Google ne publie aucun prix.** Des sources tierces donnent 540 $ par an
  (un tarif **de 2024**) et jusqu'à 6 000 $ (une page de Leviathan **non
  datée**). **Les deux sont à vérifier**, et il faut ajouter le travail de
  corriger tout ce que le laboratoire trouve.
- **Avant cette vérification, l'application est plafonnée à
  100 utilisateurs, pour toute la vie du projet** : « The user cap applies
  over the entire lifetime of the project, and it cannot be reset or
  changed » [établi]. En mode essai, l'accord de l'artisan expire au bout de
  7 jours : il devrait se reconnecter chaque semaine.
- **La règle « Limited Use » de Google** limite ces données aux fonctions
  que l'artisan voit dans l'application et interdit de les transmettre à
  d'autres. Elle vaut aussi pour les données « aggregated, anonymized, or
  derived » (regroupées, anonymisées ou dérivées). Google interdit en plus
  d'en entraîner un modèle d'IA au-delà du modèle personnel de l'utilisateur
  [établi : règle « Limited Use » mise à jour le 15/02/2024, et politique
  des API Google Workspace pour l'entraînement]. **Conséquence : les e-mails Gmail ne pourront jamais
  alimenter votre future base de prix du BTP**, même anonymisés.
- **La permission de brouillon permet aussi d'envoyer.** La règle « jamais
  d'envoi sans l'artisan » devra donc être tenue par Opus : Google ne la
  tient pas [établi].
- **Être prévenu d'un nouvel e-mail** demande un abonnement par boîte, à
  renouveler au moins tous les 7 jours, par un service de Google Cloud
  [établi].

#### Microsoft (Outlook, Microsoft 365)

- **Lire** demande `Mail.Read` ; **lire et écrire un brouillon**,
  `Mail.ReadWrite`. Ni l'une ni l'autre ne permet d'envoyer [établi].
- **Pour un compte professionnel neuf, le réglage par défaut bloque le
  consentement de l'artisan** : le réglage « laissez Microsoft gérer »,
  qui est celui d'un compte neuf, l'empêche d'accorder lui-même `Mail.Read`,
  `Mail.ReadWrite` ou l'accès IMAP. C'est l'administrateur du compte de
  l'entreprise qui doit accepter : l'artisan lui-même s'il a souscrit seul,
  sinon son prestataire informatique. **Un compte plus ancien garde le
  réglage choisi par son administrateur** [établi, page Microsoft mise à
  jour le 28/08/2026].
- Sans « vérification de l'éditeur », les entreprises qui appliquent le
  consentement « selon le risque » refusent la plupart des applications non
  vérifiées. Cette vérification est gratuite, mais demande un compte au
  programme partenaire de Microsoft [établi]. Aucune
  évaluation comparable à CASA n'a été trouvée — c'est une absence de
  preuve [à vérifier].
- **Outlook.com et Hotmail refusent les connexions par mot de passe depuis
  le 16/09/2024** [établi].

#### Orange, Free, SFR, La Poste, IONOS : seulement par mot de passe

| fournisseur | ce qui a été trouvé | statut |
|---|---|---|
| Free | IMAP, port 993, avec le mot de passe de la boîte | établi |
| IONOS | IMAP, port 993, l'adresse complète et son mot de passe | établi |
| Orange | IMAP avec un « mot de passe pour logiciels et applications de messagerie tiers » à générer | probable (forums) |
| SFR, La Poste | IMAP avec mot de passe | à vérifier (guides tiers seulement) |
| Yahoo | OAuth existe, mais demande un accord commercial avec Yahoo | probable |

**Ce que cela imposerait :** Opus devrait **garder ces mots de passe** sur
son serveur, sous une forme qu'il peut relire. **Une seule fuite ouvrirait
les boîtes de tous les artisans** — lire, supprimer, envoyer. La CNIL ne
l'accepte, dans une application, que pour les gestionnaires de mots de passe
que l'utilisateur déverrouille lui-même ; ailleurs, elle conseille « un
mécanisme de jeton à durée de vie limitée et révocable » (délibération
2022-100 du 21/07/2022, point 51) [établi]. Opus a déjà **exclu** ce procédé
pour les comptes fournisseurs (`docs/A-FAIRE.md`, « Fournisseurs et prix »).
**Ces boîtes seraient donc exclues de la connexion directe** ; il leur reste
l'adresse de dépôt.

#### L'iPhone ne relève rien en continu

C'est iOS qui décide quand une tâche de fond tourne ; les intervalles courts
sont souvent ignorés ; et la tâche s'arrête si l'artisan ferme l'application
[établi, documentation Expo]. **Tout doit donc tourner sur un serveur.**

Ce que le serveur d'Opus permet aujourd'hui [établi] :

- une fonction serveur (fonction Edge de Supabase) vit 150 secondes au plus
  en offre gratuite (400 en payant), avec **2 secondes de calcul** par
  requête et 256 Mo de mémoire : relever des dizaines d'e-mails devra se
  découper en petits morceaux ;
- les tâches planifiées (`pg_cron`, `pg_net`) sont **disponibles mais pas
  installées** sur la vraie base (relevé du 04/11/2026). Le mécanisme est
  déjà prévu au lot 4 du devis ;
- **aucune notification n'arrive sur l'écran verrouillé** : le module est
  dans l'application depuis le 15/10, mais aucun code ne demande
  l'autorisation ni ne range le jeton de l'appareil (`docs/A-FAIRE.md` §2.2).
  Et les notifications d'Opus n'ont **aucun niveau d'importance** en base,
  alors que votre §2 le demande.

### 4.c L'URSSAF et les impôts

#### L'URSSAF : une porte officielle, étroite

**L'API « Tierce Déclaration auto-entrepreneur »** [établi, fiche officielle
sur data.gouv.fr] :

- elle sait **estimer** les cotisations, **déclarer** le chiffre d'affaires,
  lancer le **paiement** par prélèvement, et dire si l'artisan déclare au
  mois ou au trimestre ;
- elle est **gratuite, mais à accès restreint**, sur dossier ;
- **elle ne vaut que pour un auto-entrepreneur** (repéré par son numéro de
  sécurité sociale ou son SIRET). **Une SARL n'est pas concernée** — votre
  société non plus ;
- l'éditeur d'Opus doit avoir le statut de **« tiers-déclarant »** (code de
  la sécurité sociale, articles L. 133-11, R. 133-43 et R. 133-44), et un
  **mandat** de chaque artisan, notifié à l'URSSAF ;
- **lire les courriers ou la messagerie de l'espace URSSAF n'est pas dans
  la liste** de ce qu'elle fait.

[à vérifier] un seul tiers-déclarant à la fois par artisan (Opus serait en
concurrence directe avec ceux qui le font déjà, comme Abby) ; le délai et
les conditions exactes d'habilitation (les sites de l'URSSAF ne répondaient
pas depuis le conteneur de travail).

#### Comment arrivent les courriers de l'URSSAF

- **Dans la messagerie sécurisée de l'espace en ligne.** Un e-mail annonce
  seulement « vous avez un message » ; il faut se connecter pour le lire, et
  le vrai contenu est dans une pièce jointe nommée « document.pdf ».
  L'URSSAF a répondu à un artisan, le 29/01/2024 : « nous privilégions
  l'envoi de document sur votre messagerie sécurisée » [établi, témoignage
  publié sur le site officiel de la transformation publique].
- **Une déclaration oubliée est notifiée par lettre recommandée avec accusé
  de réception** : l'URSSAF y notifie les sommes dues, calculées sur une
  base forfaitaire [établi, fiche Service-Public F23257, vérifiée le
  01/01/2026]. C'est exactement le cas « d'habitude ce n'est pas ça » (§4.h).
- **Une mise en demeure peut arriver par la poste** : « lettre recommandée
  ou tout moyen donnant date certaine à sa réception » (code de la sécurité
  sociale, L. 244-2) [établi].
- **Les messages de plus de trois ans seraient effacés** de la messagerie
  depuis le 01/05/2026 [probable : LégiSocial, 17/04/2026, qui rapporte une
  annonce de l'URSSAF]. Garder l'original dans Opus aurait donc une utilité
  de plus.

**Ce que ça veut dire pour votre exemple « une lettre de l'URSSAF te demande
une réponse » :**

- en lisant la boîte e-mail, Opus ne verrait en général que « vous avez un
  nouveau message », **sans le contenu**. Il peut dire « l'URSSAF a déposé
  un message dans votre espace : allez le lire » ;
- **ce qui est réaliste** : l'artisan dépose le PDF, ou une photo du
  courrier papier, dans Opus — comme une facture. Opus le lit, le classe, en
  tire les dates limites, et garde l'original ;
- **le brouillon de réponse** : purement factuel (transmettre une pièce,
  demander un délai de paiement, demander le détail d'un calcul), c'est une
  **zone grise** ; une contestation argumentée en droit est **risquée**
  (§5.3) [juriste] ;
- **les fausses URSSAF** : un e-mail qui contient lui-même un montant et un
  lien de paiement doit être signalé comme suspect. L'URSSAF ne demande
  jamais de coordonnées bancaires ni de mot de passe par e-mail [probable,
  extraits de ses pages]. Vérifier l'adresse de l'expéditeur ne suffit pas :
  elle se falsifie.

#### Pas de robot qui se connecte à la place de l'artisan

- **Impôts — interdit en toutes lettres.** Les conditions d'utilisation de
  l'espace professionnel (mises à jour le 12/10/2026) disent : « La DGFIP
  interdit l'usage d'automate (robot, coffre-forts numériques, ...) pour se
  connecter aux espaces professionnels ». En cas de détection, **l'adresse
  de connexion du robot est bloquée** — ce serait celle d'Opus, pour **tous**
  les artisans en même temps [établi]. Un espace appartient à une seule
  personne ; une délégation ne se donne qu'à une autre personne qui a son
  propre espace, pas à un logiciel [établi, fiche DGFiP du 07/04/2026].
- **Impôts — aucune API pour lire l'espace professionnel.** La DGFiP ne
  propose que quatre API à des partenaires extérieurs, aucune ne lit
  l'espace d'une entreprise. La seule voie automatisée, l'« EDI », sert à
  **déposer** des déclarations, avec un agrément et une attestation de
  conformité : c'est déjà le métier du comptable [établi].
- **URSSAF** : ses conditions d'utilisation n'ont pas pu être lues [à
  vérifier]. Mais une voie officielle existe (l'API ci-dessus) : la
  contourner par un robot n'aurait aucune justification.
- **La déclaration des salaires (DSN)** part du logiciel de paie ou du
  comptable. Ce n'est pas le rôle d'Opus [établi].

### 4.d Le comptable

Le cahier des charges prévoit un « dossier comptable structuré » (§13). Ce
qui existe pour aller plus loin :

| canal | ce qu'il est | statut |
|---|---|---|
| **un fichier d'export** | « journal de ventes », dépenses, justificatifs. Le comptable attend un vrai journal : « Un export RGPD n'est pas une sortie comptable » (`docs/CONCURRENCE-DEVIS.md`) | — |
| **le FEC** | exigé lors d'un contrôle fiscal de ceux qui tiennent une comptabilité informatisée ; **les auto-entrepreneurs en sont dispensés** « par mesure de tolérance » | établi (BOFiP, version du 07/06/2017 ; une version de 2021 existe et n'a pas été relue) |
| **la facture électronique** | une facture qui passe par une plateforme agréée arrive en données lisibles : le comptable la récupère là, sans ressaisie | probable |
| **l'API de Pennylane** | factures, écritures ; l'accès d'un logiciel partenaire se fait **sur validation de l'équipe partenariats** | établi |
| Tiime, Cegid, Sage | Tiime : sur demande, d'après un intermédiaire ; Cegid : un portail développeurs ; Sage : état actuel inconnu | probable / à vérifier |
| un intermédiaire (Chift) | un seul branchement vers plusieurs logiciels comptables | coût à vérifier |

Rien de cela ne se fait avant les modules 3 (Factures) et 6 (Dépenses) :
il n'y a aujourd'hui ni vente facturée ni dépense à transmettre.

### 4.e La marge d'un devis

#### Comment un artisan calcule un prix [établi]

La méthode est la même partout (Éduscol, document de BTS Travaux publics ;
FFB, 22/09/2021 ; Batiprix ; CAPEB) :

1. **le déboursé sec** : matériaux (transport et pertes compris), matériel,
   main-d'œuvre ;
2. **plus les frais de chantier** (ce qu'on ne rattache pas à un ouvrage
   précis) ;
3. **plus les frais généraux** de l'entreprise : on obtient le **prix de
   revient** — pour la FFB, « le prix au-dessous duquel vous perdez de
   l'argent » ;
4. **plus le bénéfice et les aléas** : on obtient le **prix de vente HT**.

On peut aussi écrire prix de vente = **coefficient × déboursé sec**. Dans
l'exemple chiffré d'Éduscol, le coefficient vaut environ **1,49**, et le
même document montre que **la base sur laquelle on prend un pourcentage
change le coefficient**. Batiprix applique un coefficient de **1,111** sur
le prix de revient pour le bénéfice et les aléas. L'outil Calculab de la
CAPEB (réservé aux adhérents) calcule le coût de l'heure productive à
partir d'un bulletin de paie et du dernier compte de résultat.

**Ce qu'on ne sait pas, et qu'il faut dire :**

- **aucune statistique publique** sur les coefficients réellement pratiqués
  par les artisans. Les chiffres qui circulent (« entre 1,3 et 2 »,
  « 20 à 30 % ») sont des affirmations d'éditeurs de logiciels, sans
  source : **ne pas les présenter comme des faits** ;
- la Banque de France donne un excédent brut médian de 7,5 % du chiffre
  d'affaires pour la construction (fascicule 2024), mais sur des sociétés
  dont l'effectif médian est de 15 salariés, micro-entreprises exclues :
  **pas représentatif d'un artisan seul** ;
- **le mot « marge » désigne plusieurs rapports différents.** Un logiciel
  qui affiche « marge % » sans dire sur quelle base trompe sans le vouloir.

**Deux règles qui changent le coût** [établi] :

- **en franchise de TVA**, l'entreprise ne déduit pas la TVA de ses achats :
  le vrai coût d'un matériau est son prix **TTC** (Service-Public F21746) ;
- **un micro-entrepreneur** paie ses cotisations sur le chiffre d'affaires :
  21,2 % pour les prestations, 12,3 % pour la vente de marchandises
  (Service-Public F36232). Comment se répartit un chantier « fourni-posé »
  entre les deux : à vérifier, à poser au comptable.

#### Ce que font les concurrents (pages officielles, 04/11/2026)

Obat, Tolteck, Batappli et Costructor affichent une marge par ligne ou par
devis. **Aucun ne documente une alerte de marge basse, ni une alerte de
hausse d'un prix d'achat.** Le plus proche : ATTIX bloque une vente sous le
prix d'achat. Et un piège réel, relevé sur les captures d'un éditeur : les
lignes produites par son IA ont un « Prix de revient 0,00 € », donc **la
marge affichée égale le total** (`docs/CONCURRENCE-IA-DEVIS.md`). Tolteck
l'écrit lui-même : « renseignez un déboursé sec sur toutes les lignes ».

#### Ce qu'Opus sait déjà, et ce qui lui manque

**Opus ne connaît aujourd'hui que des prix de VENTE**, jamais un coût :

- les lignes du devis (quantité, unité dont « h » et « jour », prix HT,
  TVA, « Offert », « fourniture non comprise ») ;
- la réduction sur le total, l'acompte, le régime de TVA ;
- les tarifs (taux horaire **de vente** TTC, déplacement, majoration) ;
- la base de postes et son prix de référence, et **l'alerte discrète déjà
  validée par vous** : « Vous mettez X — c'est voulu ? » (lot P). C'est le
  modèle de toutes les alertes de ce document.

**Ce qui manque** : le coût d'une journée, les frais généraux, les prix
d'achat, le temps prévu (sauf sur les lignes à l'heure ou au jour), et un
seuil de marge choisi par l'artisan. Et **un coût ne doit jamais entrer dans
les tarifs**, qui deviennent lisibles par les particuliers (lot T) : il faut
une table **privée** à part.

#### Le minimum à demander à l'artisan [proposition]

1. **le coût d'une journée productive, avec sa date.** Il le tape lui-même,
   ou Opus l'aide à le calculer (rémunération prélevée + cotisations +
   salaires chargés + frais généraux de l'année, divisés par les jours
   facturables), en renvoyant à Calculab ou au comptable. **Aucune valeur
   par défaut** ;
2. **pour chaque devis** : les jours prévus (et pour combien de
   personnes), les matériaux prévus, les autres frais (location,
   sous-traitance) ;
3. **plus tard** : ses prix d'achat datés, tirés de ses factures ;
4. **son seuil de marge, à lui.**

**Le calcul** [proposition] : coût estimé = jours × coût d'une journée +
matériaux (TTC en franchise, HT au régime réel) + autres frais ; marge = HT
après réduction et hors options − coût estimé, **en pourcentage du prix de
vente HT, et l'écran le dit**. Une ligne « Offert » ne rapporte rien, mais
son coût compte. Les frais généraux se comptent **une seule fois** : dans le
coût d'une journée, ou en coefficient, jamais les deux.

#### Les règles d'une alerte de marge utile [proposition]

1. **Une estimation se dit estimée**, avec ses ingrédients et leurs dates :
   « 4 jours × 320 € (coût déclaré le 12/09) ». C'est votre §24.
2. **Pas de marge si un coût manque** : « incomplet : 3 lignes sans coût »,
   plutôt qu'une marge fausse — le piège montré plus haut.
3. **Signaler, jamais bloquer** : le prix est celui de l'artisan.
4. **Une alerte à un moment de décision**, pas à chaque lettre tapée : en
   quittant la saisie, ou avant de remettre le devis. Regroupée et
   désactivable (§4 du cahier).
5. **Le seuil est celui de l'artisan, jamais une « marge normale du
   marché ».** Une marge de référence diffusée à des concurrents ressemble
   à un prix conseillé, que le droit de la concurrence vise
   (`docs/DONNEES-DES-ARTISANS.md` §5.4) [juriste].
6. **Les coûts restent privés**, pour l'artisan seul : aucun écran ne les
   montre à un autre, administrateur compris, sur le modèle de l'engagement
   écrit du 18/10 pour les prix (`docs/DONNEES-DES-ARTISANS.md` §5.2). Un
   engagement, pas une impossibilité : l'éditeur SQL peut tout lire.
7. **Le calcul se fait sans IA**, dans un fichier que les contrôles du
   projet font tourner. L'IA ne sert qu'à rédiger, et elle est
   journalisée. Jamais un coût inventé.

#### Les alertes proposées, avec leur condition [proposition]

| alerte | condition | ce qu'il faut pour la construire |
|---|---|---|
| **A1 — « Marge estimée basse »** | en quittant la saisie ou avant la remise, **seulement si les coûts sont complets** : toujours si le devis est **sous le coût estimé** ; et sous le seuil, **si l'artisan en a fixé un** | coût d'une journée, jours prévus, matériaux prévus, seuil. **La seule alerte faisable juste après le lot 2 du devis** : elle ne demande ni facture ni lecture automatique |
| **A2 — « Fourniture vendue sous son prix d'achat »** | le prix d'une ligne est inférieur au dernier prix d'achat **validé** du même article, même unité, même conditionnement. Exemple : « Vous le vendez 9,80 € ; acheté 10,20 € le 03/11 (prix facturé). C'est voulu ? » | le lien entre la ligne et l'article, les achats datés : modules 6 et 7 |
| **A3 — « Un prix d'achat a monté »** | §4.f | modules 6 et 7 |
| **A4 — « Votre prix de référence a vieilli »** | le coût d'une journée ou les prix d'achat des matériaux d'un poste ont monté de plus du seuil depuis la date de son prix de référence — ou ce prix a plus de N mois (le dépôt propose 3 mois, à décider) | la composition du poste (temps + matériaux), qui n'existe pas |
| **A5 — « Ce chantier consomme plus que prévu »** | à un avancement de a %, les coûts réels (heures × coût + achats du chantier) dépassent a % du coût prévu, au-delà de la tolérance de l'artisan. C'est la méthode de la FFB (24/05/2017) : « plus un problème est identifié tôt, moins il coûtera cher à régler » | heures passées, achats rattachés au chantier, avancement : le chantier de gestion (§12), l'agenda et les dépenses. **La plus lointaine** |

### 4.f Le prix des matériaux : « Mes prix réellement payés »

Votre exemple — « la semaine derniere tu as payer le sac de ciment 10 euro
cette semaine il ton facturer 10.20 » — est exactement l'alerte **A3**.

**Ce qu'elle demande** [proposition, complément « marge » de l'étude et
`docs/COMPARATEUR-MATERIAUX.md`] :

- une nouvelle facture **validée** montre, **chez le même fournisseur, pour
  la même référence, la même unité et le même conditionnement**, un prix
  supérieur au précédent de plus du **seuil de l'artisan** ;
- **et** l'article sert dans un devis non accepté ou dans un poste de sa
  base ;
- l'alerte est **regroupée une fois par semaine** ;
- le message porte **les deux dates et les deux factures**.

**Votre exemple (10,00 € → 10,20 €, soit +2 %) apparaît toujours dans
l'historique.** Il ne déclenche une alerte que si le seuil de l'artisan est
atteint, ou si un devis en cours est touché.

**Ce que l'écran doit toujours dire** :

- **la date** : votre §14 l'exige, et présenter un ancien prix comme actuel,
  même entre professionnels, peut être une pratique trompeuse
  (`docs/COMPARATEUR-MATERIAUX.md` §9, règle 1) ;
- **« acheté le … (date de la facture) »**, pas « payé le » : la date connue
  est celle de la facture, Opus ne sait pas quand l'artisan a payé
  (`docs/COMPARATEUR-MATERIAUX.md` §2) ;
- **« prix facturé, hors remises différées »** (§4.a) ;
- **« observé dans vos documents — à confirmer »** tant que la ligne n'est
  pas validée.

**Le piège du rapprochement** : la référence produit est facultative sur une
facture électronique. Opus reconnaîtra souvent « le même sac » par sa
**désignation**. La clé de rapprochement des phrases du lot P (qui reconnaît
une même phrase malgré un « s », un accent ou une majuscule) est un point de
départ. Le conditionnement, lui, ne se trouve que dans la désignation : un
sac de 25 kg et un sac de 35 kg ne se comparent qu'**au kilo**
(`docs/COMPARATEUR-MATERIAUX.md` §2).

**Un complément qui n'est pas un prix** : l'Insee publie des indices de prix
pour le ciment et les éléments en béton (Licence Ouverte). Ils montrent une
**tendance** sortie d'usine, jamais le prix d'un négoce
(`docs/COMPARATEUR-MATERIAUX.md` §7.7).

**Tout cela est du calcul, sans IA**, et les prix d'achat restent **privés,
pour l'artisan seul** : très probablement un secret des affaires
(`docs/COMPARATEUR-MATERIAUX.md` §9, règle 7).

### 4.g Les échéances qu'on oublie

Seulement ce qui est sourcé. Les dates sont celles de 2026.

| échéance | la règle | ce qu'Opus pourrait rappeler |
|---|---|---|
| **Déclaration de chiffre d'affaires** (micro-entrepreneur) | au mois (par défaut) : avant la fin du mois suivant ; au trimestre : avant le 30/04, le 31/07, le 31/10 et le 31/01. Il faut déclarer même à zéro. Oubli : §4.h [établi, F23257] | la date limite, et le chiffre d'affaires **encaissé** déjà préparé |
| **CFE** (cotisation foncière des entreprises) | paiement au plus tard le **15/12/2026** pour une CFE de 3 000 € ou moins (au-delà, un acompte de 50 % est dû au printemps) ; l'avis est **seulement en ligne**, mis en ligne le 02/11/2026 ; prélèvement à l'échéance possible jusqu'au **30/11/2026** ; exonération l'année de création, et si le chiffre d'affaires de N-2 est de 5 000 € ou moins [établi, F23547 et impots.gouv]. **La majoration de 5 % en cas de retard : à vérifier** (aucune des deux pages ne la mentionne) | aller chercher l'avis dans l'espace professionnel |
| **TVA, franchise** | 37 500 € de services, plafond en cours d'année 41 250 € ; 85 000 € et 93 500 € pour les ventes ; au-delà du plafond, la TVA est due **dès le premier jour** du dépassement. L'artisan qui fournit les matériaux est en activité mixte : 85 000 € au total **et** 37 500 € de services [établi, F21746 et BOFiP] | suivre le chiffre d'affaires de l'année face aux seuils, à partir de ses encaissements |
| **TVA, régime réel** | réel simplifié : acomptes de 55 % en juillet et de 40 % en décembre, déclaration annuelle le 2ᵉ jour ouvré après le 1er mai ; réel normal : chaque mois, entre le 15 et le 24 [établi, F23566] | le calendrier |
| **Attestation de vigilance** (sous-traitance) | un donneur d'ordre doit l'obtenir pour toute opération de **5 000 € HT ou plus**, à la signature puis **tous les 6 mois**, datée de moins de 6 mois. **Seule l'attestation URSSAF** doit être vérifiée comme authentique. À la place d'un Kbis, il peut accepter un devis, un document publicitaire ou une correspondance qui porte l'immatriculation [établi, R. 8222-1 et D. 8222-5]. Les sanctions : à vérifier (non lues dans le texte) | au sous-traitant : « votre attestation a 5 mois » ; au donneur d'ordre : réclamer celle du sien. Il faut d'abord savoir quels chantiers sont en sous-traitance |
| **Assurance décennale** | obligatoire, à justifier à l'ouverture de **tout** chantier ; sans assurance, jusqu'à 6 mois de prison et 75 000 € d'amende [établi, L. 243-3 du code des assurances]. Le rythme de renouvellement d'un contrat : à vérifier | **Opus sait déjà** la date de fin de l'attestation, mais ne prévient qu'**une fois la date passée**. Prévenir 30 à 60 jours **avant** serait une nouveauté |
| **Contrôle technique d'une camionnette** | premier contrôle dans les 6 mois avant les 4 ans du véhicule, puis tous les 2 ans ; un contrôle de pollution un an après chaque contrôle ; amende jusqu'à 750 € (en général 135 €) [établi, F33353] | demanderait des données nouvelles (date de mise en circulation, dernier contrôle) : **seulement si l'artisan le veut** |
| **Versement libératoire de l'impôt** | option à prendre avant le 30/09 pour l'année suivante [établi, F23267] | la date |
| **Gérant majoritaire de SARL ou d'EURL** | l'URSSAF envoie en **décembre** un appel provisionnel pour l'année suivante, et **régularise en octobre** d'après les revenus réels [établi, F36235] | dire qu'un changement arrive en janvier ou en octobre |
| **Facture électronique** | recevoir depuis le 01/09/2026 ; émettre au plus tard le 01/09/2027 pour les petites entreprises [établi] | rappeler de choisir une plateforme |

**Ce qu'il faut pour les rappeler** : la plupart demandent les
**encaissements** (module 3) et un **agenda** (module 5). Et une
notification sur l'écran verrouillé, qui n'existe pas encore.

### 4.h L'estimation des cotisations d'un micro-entrepreneur, et ses écarts légitimes

#### Le calcul [établi, taux 2026, Bpifrance Création, publié en juillet 2026]

Les cotisations sont un pourcentage du chiffre d'affaires hors taxes
**encaissé** sur la période, sans déduire aucune charge.

| ce qui s'additionne | taux |
|---|---|
| cotisations, prestations artisanales (BIC) | 21,20 % |
| cotisations, achat-revente | 12,30 % |
| cotisations, professions libérales (BNC) | 25,60 % |
| contribution à la formation professionnelle, artisan | 0,3 % |
| taxe pour la chambre de métiers, hors Alsace-Moselle (prestations / ventes) | 0,48 % / 0,22 % ; 0,65 % / 0,29 % dans le Bas-Rhin et le Haut-Rhin ; 0,83 % / 0,37 % en Moselle ; exonération à 5 000 € de chiffre d'affaires ou moins (F37483) |
| versement libératoire de l'impôt, s'il a été choisi | 1 % sur les ventes, 1,7 % sur les prestations (F23267) |

- **L'aide aux créateurs (ACRE)** : prestations 10,6 % pour un début
  d'activité jusqu'au 30/06/2026, 15,9 % à partir du 01/07/2026 ;
  achat-revente 6,2 % puis 9,3 % (décret n° 2026-69). Le délai pour la
  demander (60 jours) et sa durée : **à vérifier** (le décret n'a pas été
  relu sur Légifrance).
- **Le versement libératoire** n'est possible que si le revenu fiscal de
  référence de N-2 est inférieur à 29 579 € pour une personne seule,
  **selon F23267 (vérifiée le 13/05/2026)** — la page ne dit pas à quelle
  année d'imposition ce chiffre s'applique.

**Un exemple** (calcul de l'étude) : 5 000 € de prestations encaissés dans
un mois, hors Alsace-Moselle, sans ACRE ni versement libératoire :
1 060 € de cotisations + 15 € de formation + 24 € de chambre de métiers =
**1 099 €** (21,98 %). Avec le versement libératoire : 85 € de plus. La
façon dont l'URSSAF arrondit n'a pas été vérifiée.

**Trois conditions** :

1. **Opus doit connaître les encaissements, pas seulement les factures** :
   on déclare la date où l'argent arrive. La chaîne « facture →
   encaissement » de votre §20 est indispensable ;
2. **le meilleur moment pour vérifier, c'est AVANT la déclaration** : pour
   un micro-entrepreneur, le montant découle de ce qu'il déclare. Opus peut
   préparer « vos encaissements du mois : X € (dont ventes Y €, prestations
   Z €) » ;
3. **le point délicat** : pour un artisan qui fournit **et** pose, on ne
   sait pas si l'URSSAF veut la part des matériaux en « vente » ou en
   « prestation » [à vérifier]. **Opus ne doit pas trancher** : il reprend
   la répartition que l'artisan utilise déjà.

L'API de l'URSSAF (§4.c) saurait faire l'estimation officielle, sans que
Opus recopie des taux qui changent — mais seulement pour un tiers-déclarant
habilité.

#### Les écarts légitimes (« d'habitude ce n'est pas ça »)

| cause | ce qui se passe | statut |
|---|---|---|
| **une déclaration oubliée** | l'URSSAF calcule sur une base forfaitaire (3 125 € par mois ou 10 313 € par trimestre pour les prestations), ajoute 5 % (au mois) ou 15 % (au trimestre), et une pénalité de 60,1 € par déclaration manquante, **notifiées par lettre recommandée**. La pénalité passe à 3 % des cotisations dues quand la déclaration est déposée en retard **mais avant** cette notification. **C'est le cas exact de votre exemple** | établi (F23257) |
| la fin de l'ACRE | le taux remonte, par exemple de 15,9 % à 21,2 % | établi |
| un changement de taux | au 1er janvier ou au 1er juillet ; aucun changement 2026 pour les prestations | établi en principe |
| le versement libératoire ajouté ou retiré | la condition de revenu n'est plus remplie | probable |
| la taxe de la chambre de métiers | elle s'applique ou non selon le seuil de 5 000 € ; on ne sait pas comment en cours d'année | probable |
| un rattrapage après contrôle, des majorations de retard | les taux n'ont pas été vérifiés sur une source officielle | à vérifier |

**Pour un gérant de SARL** : Opus peut comparer chaque prélèvement à
l'échéancier et aux mois précédents, et dire qu'un changement arrive en
janvier ou en octobre [probable]. **Il ne peut pas refaire le calcul exact**
sans la rémunération, les frais, les dividendes et le capital. La
régularisation de l'automne 2026 est la première calculée selon la nouvelle
base (décret 2024-688) ; qu'elle crée un écart plus grand que d'habitude
est probable. Un moteur de calcul officiel existe en libre accès (le paquet
`modele-social`, celui de mon-entreprise.urssaf.fr) ; qu'il couvre
exactement les règles 2026 est probable, pas vérifié. **Pour un président
de SAS**, c'est le logiciel de paie.

**La bonne formulation d'un écart** (à faire valider, §5.3) : « le montant
demandé (X €) diffère de l'estimation d'Opus (Y €), calculée sur vos
encaissements et le taux publié le … ; causes possibles connues : … ; le
détail est dans votre espace URSSAF ; en cas de doute, voyez votre
expert-comptable ». **Jamais « l'URSSAF se trompe ».** Et les délais de
contestation figurent sur la notification elle-même (R. 142-1 du code de la
sécurité sociale) : Opus les lit sur le courrier, il ne les devine pas.

---

## 5. Les règles à tenir

### 5.1 L'agent prépare, l'artisan décide

- **Aucun envoi sans validation.** C'est la règle déjà tenue pour le récit
  du chantier : « L'AGENT ÉCRIT, L'ARTISAN PUBLIE » (`CLAUDE.md`,
  « Le récit du chantier »). C'est aussi votre §2 et votre §19.
- **Un e-mail envoyé ne se reprend pas.** Un prix, une date ou un
  « d'accord » envoyé au nom de l'artisan peut l'engager.
- **L'ANSSI** (l'agence de sécurité informatique de l'État, recommandations
  du 29/04/2024) cite l'exemple du « contenu d'un mail reçu » comme porte
  d'entrée d'instructions cachées, et recommande de « limiter voire
  proscrire les actions automatiques […] à partir d'entrées non-maîtrisées
  (ex. : données issues d'Internet ou de mails) » (recommandation R27)
  [établi].
- **La règle doit être tenue par Opus**, puisque la permission de brouillon
  de Gmail permet aussi d'envoyer (§4.b).
- **Chaque action nouvelle de l'agent naît avec sa permission, son journal
  et sa ligne dans « Mon agent »** : « Chaque permission naîtra AVEC
  l'action qu'elle gouverne » ; et plus aucune action d'IA n'est ajoutée
  « à la main » (`CLAUDE.md`, « Le socle de l'agent », et « Un SECOND
  cahier des charges », point 3).

**Un envoi automatique, un jour ?** Ce serait au mieux un réglage éteint
par défaut, limité à des messages sans enjeu (un accusé de réception), avec
sa permission et son journal. C'est votre décision (§8).

### 5.2 Peu d'alertes, justes, datées, « estimé » quand c'est estimé

- **Peu** : votre §2 (« ne doivent pas être insistantes »), votre §4 (« utiles, regroupées
  et désactivables »), votre §24 (« pas de suggestions incessantes »). Le
  projet sait déjà se taire : la fenêtre qui propose de nommer l'agent
  s'arrête après trois refus (`CLAUDE.md`, « Nommer son agent »). **Un voyant qui
  s'allume pour rien finit par ne plus être vu.**
- **Justes** : une alerte compare ce qui se compare (même unité, même
  conditionnement, même fournisseur) et se tait quand une donnée manque, en
  le disant.
- **Datées** : chaque prix, chaque coût, chaque taux porte sa date et sa
  source.
- **« Estimé »** : votre §24 — l'IA « indique lorsqu'une information est
  estimée, ancienne ou incertaine ».
- **Neutres sur l'écran verrouillé** : « 1 e-mail attend votre réponse »,
  sans l'expéditeur ni l'objet. Ces messages passent par des services tiers.

### 5.3 Opus aide, il ne remplace pas l'expert-comptable

Votre §13 l'écrit : « pas […] un remplacement automatique de
l'expert-comptable ». Le droit trace la frontière.

**L'expertise comptable** — ordonnance n° 45-2138 du 19/09/1945 [établi] :

- l'**article 20** fait un délit de l'exécution **habituelle**, sans être
  inscrit à l'Ordre, des travaux des **deux premiers alinéas** de
  l'article 2 : un an de prison et 15 000 € d'amende (code pénal,
  article 433-17) ;
- **premier alinéa : « réviser et apprécier les comptabilités »** des
  entreprises, et attester les bilans et comptes de résultat ;
- **second alinéa** : « tenir, centraliser, ouvrir, arrêter, surveiller,
  redresser et consolider » les comptabilités ;
- **le troisième alinéa, « organiser… analyser », n'est pas visé** par
  l'article 20 : il reste libre.

**Conséquence pratique** : un outil qui « vérifie » ou « apprécie » la
comptabilité de l'artisan touche la zone réservée, pas seulement un outil
qui la tient. D'où des formulations prudentes :

| à éviter | à préférer |
|---|---|
| « votre comptabilité est juste », « nous avons vérifié vos comptes » | « Opus a préparé ce dossier pour votre expert-comptable » |
| « l'URSSAF se trompe » | « le montant demandé diffère de l'estimation d'Opus… voyez votre expert-comptable » |
| « optez pour le versement libératoire », « passez en SAS » | une information datée et sourcée sur l'état du droit, sans conseil personnalisé |
| un montant sans source | « estimation, calculée le … sur vos encaissements, au taux publié le … » |

Une décision récente va dans le sens d'Opus : d'après des commentaires, la
Cour de cassation (chambre commerciale, 17/09/2025, n° 24-14.689) a jugé que
la saisie de données comptables dans un logiciel « ne relève pas, à elle
seule » du monopole [probable : le texte officiel n'a pas été lu].

**Le conseil juridique** — loi n° 71-1130, article 54 [établi] : « Nul ne
peut […] à titre habituel et rémunéré, donner des consultations juridiques
ou rédiger des actes sous seing privé, pour autrui » sans qualification. Le
ministère de la Justice distingue la « consultation » (un avis personnalisé
qui aide une décision) de « l'information à caractère documentaire » (dire
l'état du droit) (réponse du 03/10/2006, qui ne lie pas le juge). Au Sénat,
un amendement qui voulait viser les outils d'IA a été **rejeté** le
11/01/2026. Pour Opus : rappeler des dates et calculer sur ses propres
données paraît sûr ; **rédiger une contestation argumentée en droit est
risqué** ; un brouillon purement factuel est une zone grise. **Toute cette
frontière est à faire valider par un juriste avant d'être construite.**

### 5.4 Le RGPD : les e-mails contiennent les données des clients

- **Opus deviendrait « sous-traitant » de chaque artisan** pour ses
  e-mails, comme il l'est déjà pour le carnet de clients (`CLAUDE.md`,
  « Le carnet de clients »). Le contrat exigé par l'article 28 du RGPD **n'existe pas
  encore** (`src/data/legal.js` : `contratSousTraitance: false`). Avec les
  e-mails, il devient indispensable, et plus lourd à écrire. Le fournisseur
  du modèle d'IA serait un sous-traitant d'Opus : il faut l'autorisation
  écrite préalable de chaque artisan (article 28.2) [établi].
- **Une analyse d'impact sera très probablement obligatoire.** Les lignes
  directrices européennes (WP248) l'imposent à partir de deux critères sur
  neuf, et leur critère 4 cite **nommément les e-mails**. Le projet en
  remplit au moins trois : les e-mails, la grande échelle, l'usage innovant
  de l'IA [probable]. C'est l'artisan, responsable de traitement, qui doit
  la faire ; Opus doit l'aider (article 28.3.f) : **en pratique, lui en
  fournir un modèle**.
- **Ne garder que le nécessaire** [proposition, sur les principes de
  l'article 5] : lire seulement les nouveaux messages ; retirer l'historique
  cité et les signatures avant d'envoyer le texte à l'IA ; **ne jamais
  ranger le corps d'un e-mail dans la base d'Opus** ; déposer le brouillon
  dans la boîte de l'artisan plutôt que dans Opus. C'est déjà la règle du
  journal de l'agent : « Ce qu'on n'écrit pas ne peut pas fuir »
  (`CLAUDE.md`, « Le socle de l'agent »).
- **Des données de santé peuvent arriver** (un client qui demande une salle
  de bains adaptée à un handicap) : une raison de plus pour l'analyse
  d'impact [probable].
- **Où vont les données envoyées au fournisseur du modèle d'IA (Anthropic)**
  [établi, page « Data residency » relevée le 04/11/2026] :
  - elles sont **stockées aux États-Unis**, seul choix possible ;
  - **le calcul se fait par défaut « dans n'importe quelle région
    disponible »** ;
  - la seule option est **« États-Unis seulement »**, qui coûte **10 % de
    plus** ; **il n'existe aucune option « Europe seulement »** ;
  - entrées et sorties supprimées sous 30 jours, jusqu'à 2 ans pour un
    échange signalé par ses contrôles de sécurité, « zéro conservation »
    possible sur contrat ; pas d'entraînement sur les données des clients ;
  - son inscription au cadre UE–États-Unis (Data Privacy Framework) : à
    vérifier.
- **Une phrase des textes légaux deviendrait fausse.** Ils disent
  qu'Anthropic reçoit des données « UNIQUEMENT quand » quelqu'un se sert de
  l'assistant (`src/data/legal.js`). Un agent qui lit la boîte en
  arrière-plan la contredit : **il faut changer les textes AVANT**.
- **En cas de fuite chez Opus, chaque artisan** devrait faire sa propre
  déclaration à la CNIL, sauf si la fuite ne présente pas de risque pour
  les personnes (article 33).
- **Une barrière avec la future base de prix du BTP** : pour Gmail, Google
  l'impose déjà (§4.b) ; et le dépôt a posé la règle « jamais une donnée
  d'un de ses clients » (`docs/A-FAIRE.md`, dernière section). Le
  précédent : un million d'euros infligé par la CNIL le 11/12/2025 à un
  sous-traitant qui avait réutilisé les données de son client « afin
  d'améliorer les performances de ses propres services »
  (`docs/DONNEES-DES-ARTISANS.md` §2.4).

### 5.5 Le secret des correspondances

Sources secondaires seulement ; les textes sont à relire sur Légifrance
[juriste] :

- le **code pénal (article 226-15)** punit le fait, **de mauvaise foi**,
  d'intercepter, détourner, utiliser ou divulguer des correspondances
  électroniques (un an, 45 000 €). **L'accord de l'artisan suffit
  probablement pour SA boîte** ;
- **ce n'est plus sûr si la boîte est partagée** — avec un conjoint qui fait
  l'administratif, ou un salarié ;
- le **code des postes et des communications électroniques (L. 32-3)**
  permettrait l'analyse automatique pour **afficher, trier ou acheminer**
  les messages ; pour « l'amélioration du service apporté à l'utilisateur »,
  il exigerait un consentement **exprès, renouvelé au moins une fois par
  an** (décret de 2017, article D. 98-5) [probable]. **Rédiger une réponse
  pourrait relever du second cas** ;
- qu'Opus soit visé alors qu'il ne fournit pas la boîte Gmail : incertain.
  **Pour sa propre messagerie**, en revanche, Opus est bien un service
  d'échange de correspondances : si l'agent l'analysait un jour, la même
  règle s'appliquerait.

### 5.6 La sécurité, le minimum

1. **Jamais de mot de passe.** Seulement OAuth (§4.b). C'est déjà une règle
   du projet : « Les secrets ne vivent jamais dans l'application »
   (`CLAUDE.md`).
2. **Les clés d'accès chiffrées avec une clé qui n'est pas dans la base.**
   Le coffre de secrets de Supabase (Vault) déchiffre à la volée dans une
   vue que « anyone that has access to the view » peut lire [établi] ; et le
   connecteur de lecture d'Opus lit **tout**, règles de lecture ignorées
   (`CLAUDE.md`, « Les permissions Supabase »). Le plus sûr : chiffrer dans
   la fonction serveur, avec une clé rangée dans ses secrets [probable, à
   vérifier avant d'y ranger quoi que ce soit].
3. **Les permissions les plus étroites.** Ne jamais demander l'accès complet
   à la boîte.
4. **Le retrait d'accès** : un bouton qui annule l'autorisation chez Google
   ou Microsoft et efface les clés ; le même geste dans la suppression de
   compte ; et la détection d'un accès retiré par l'artisan depuis son
   compte Google ou Microsoft.
5. **Un journal** : qui a accédé à quelle boîte et quand, **sans le contenu
   des messages** ; que personne ne peut récrire ; que l'artisan voit, comme
   le journal de « Mon agent ».
6. **Se protéger des e-mails piégés** : le modèle qui lit les e-mails n'a
   **aucun outil** pour envoyer, transférer ou supprimer, et ne suit aucun
   lien. Ce qu'il produit reste un brouillon (ANSSI, R27).
7. **Des notifications sans contenu** (§5.2).

---

## 6. Le coût de l'IA, par artisan et par mois

### Les prix (page des prix d'Anthropic, relevée le 04/11/2026)

En dollars par million de jetons :

| modèle | entrée | écriture en cache | relecture du cache | sortie |
|---|---|---|---|---|
| le petit modèle (requêtes de 100 000 jetons au plus) | 0,10 | 0,125 | 0,01 | 0,50 |
| le modèle intermédiaire | 2 | 2,50 | 0,10 | 10 |
| le grand modèle | 4 | 5 | 0,20 | 20 |
| le modèle qu'utilise aujourd'hui la fonction `ai` d'Opus | 5 | 6,25 | 0,50 | 25 |

Le « cache » est une mémoire courte : des consignes déjà lues coûtent moins
cher la fois suivante. Le contre-examen a recalculé ces montants : ils sont
justes.

### Les hypothèses (à remesurer sur de vrais e-mails)

- **trier un e-mail** avec le petit modèle : 2 000 jetons de consignes,
  1 500 d'e-mail nettoyé, 300 de réponse → **0,00055 $ par e-mail** ;
- **rédiger un brouillon** : 9 000 jetons lus (consignes, mémoire de
  l'artisan, fil de discussion), 2 000 écrits → **0,04 $** avec le modèle
  intermédiaire, 0,081 $ avec le grand, 0,10 $ avec le modèle actuel ;
- **lire des factures** : 2 par jour, de 2 pages → environ **1,3 $ par
  mois** avec le modèle intermédiaire ;
- 30 jours par mois, **plus 25 %** de marge (nouvelles tentatives,
  « recommencer »).

### Le résultat

| scénario | par artisan et par mois | pour 1 000 artisans |
|---|---|---|
| **brouillon seulement quand l'artisan le demande** (40 e-mails triés, 5 brouillons par jour, modèle intermédiaire) | **≈ 10 $** | ≈ 10 000 $ |
| bas (20 e-mails par jour, 20 % de réponses, modèle intermédiaire) | ≈ 6,6 $ | ≈ 6 600 $ |
| moyen (40 e-mails par jour, 30 % de réponses, modèle intermédiaire) | ≈ 21 $ | ≈ 21 000 $ |
| moyen, avec un raisonnement long de l'IA | ≈ 36 $ | ≈ 36 000 $ |
| haut (60 e-mails par jour, 50 % de réponses, grand modèle) | ≈ 94 $ (≈ 117 $ avec le modèle actuel) | ≈ 94 000 $ |

**Si l'on impose un calcul « États-Unis seulement » (§5.4), tous ces
montants prennent 10 %.**

**Ce que montre le tableau :**

- **trier ne coûte presque rien** : 0,33 à 1 $ par mois ;
- **rédiger représente plus de 90 % de la facture** : le premier levier est
  de ne rédiger **que sur demande** ;
- le traitement par lots (moitié prix, réponse sous 24 h) n'économiserait
  qu'environ 1,2 $ par mois, et ses résultats restent 29 jours chez le
  fournisseur, ce qui l'exclut de la « zéro conservation » ;
- **la marge, les prix d'achat, les échéances et les cotisations ne coûtent
  rien en IA** : ce sont des calculs (§2).

**Ce qui n'est pas compté** : les frais du serveur Supabase, le service qui
reçoit les e-mails (§4.a), et l'évaluation annuelle de Google (§4.b).

### Le lien avec la limite de 60 appels par jour

L'assistant d'Opus est plafonné à **60 appels réussis par jour et par
compte** (`src/lib/journal-ia.js`, `LIMITE_IA_PAR_JOUR`). Trier 40 e-mails
par jour, un appel chacun, prendrait **les deux tiers** de ce plafond ;
60 e-mails le prendraient **en entier**. Il faudra soit trier plusieurs
e-mails par appel, soit un compteur à part : c'est votre décision (§8).

Cette limite plafonne aussi le coût d'un artisan : au plus 1 800 appels de
rédaction par mois, soit ≈ 73 $ avec le modèle intermédiaire et ≈ 182 $ avec
le modèle actuel — une estimation, pas une garantie : un appel avec un très
long contexte coûte plus.

### Le lien avec le modèle économique, qui n'est pas décidé

Votre réponse du 18/10/2026 : « je ne sais pas encore comment me rémunérer
sur Opus, mais je pense que les pros devront payer quelque chose »
(`docs/A-FAIRE.md`). Ce document ne propose aucun prix d'abonnement. Deux
repères seulement : ce genre de service se vend **18 à 60 € par mois**
chez les concurrents (§2), et **19 % seulement des TPE-PME paient pour un
outil d'IA** (France Num, 28/09/2026). **Le coût de l'IA devient un coût par
artisan et par mois** : il se chiffre avant de construire l'agent, pas
après.

---

## 7. Le plan, par étapes

**La règle qui décide de l'ordre** : « L'agent ne peut agir que sur ce qui
EXISTE » (`docs/A-FAIRE.md`). Chaque morceau se range donc dans un module
déjà prévu, dans l'ordre arrêté le 07/10/2026 :

**Clients → Devis → Factures → Tableau de bord → Agenda → Dépenses →
Fournisseurs et prix.**

**Les estimations sont des estimations.** Elles viennent du rythme mesuré
des lots passés : un lot moyen fait **2 à 4 jours de session**, relectures,
migration et essai sur la vraie base compris (étude « place dans le plan », relevé
sur les dates de `CLAUDE.md`). Elles **ne comptent pas** les modules dont chaque étape
dépend. « Non chiffré » veut dire que l'étude n'a pas fait d'estimation.

| étape | ce qu'elle apporte à l'artisan | ce qu'elle exige | place dans l'ordre | estimation |
|---|---|---|---|---|
| **0. Noter l'idée** (ce document) | rien encore, mais elle n'est pas perdue | — | maintenant | 0 jour |
| **1. Les notifications sur l'écran verrouillé**, classées par importance | être prévenu sans ouvrir Opus. Utile à tout Opus, pas seulement à l'agent | demander l'autorisation, ranger le jeton de l'appareil, envoyer depuis le serveur (service d'Expo), un niveau d'importance en base ; essai sur l'iPhone. Le module est déjà dans l'application installée : probablement pas de reconstruction | n'importe quand | 2 à 4 jours |
| **2. Le travail planifié côté serveur** | rien de visible, mais nécessaire à tout ce qui suit | installer `pg_cron` et `pg_net`, avec votre accord | lot 4 du devis | environ 1 jour |
| **3. L'alerte « marge estimée basse » (A1)** | savoir, avant de remettre un devis, qu'il est sous son coût | le coût d'une journée daté, les jours et matériaux prévus, un seuil ; une table privée ; un calcul sans IA | juste après le lot 2 du devis | non chiffré |
| **4. Les relances et les réponses PRÉPARÉES**, que l'artisan envoie lui-même | le gain de temps promis, **sans** connecter la boîte | le devis remis, la facture ; les demandes reçues dans Opus sont déjà en base | lot 4 du devis ; module 3 (impayés) | 2 à 4 jours par sujet |
| **5. Les notifications regroupées** (« 2 devis à relancer », « 1 facture en retard ») | ne rien oublier, sans être harcelé | étape 1 | après le lot 4 du devis et le module 3 | 2 à 4 jours |
| **6. Le choix d'une plateforme agréée partenaire** | un jour, les factures fournisseurs arrivent toutes seules, déjà lisibles ; et Opus émet les factures de l'artisan | une décision, un partenaire, un contrat (coût à vérifier) | à l'ouverture du module 3 (Factures) | à chiffrer au module 3 |
| **7. L'adresse de dépôt** et l'**import du fichier** de facture électronique | plus aucune facture perdue, l'original gardé | un service de réception, un sous-domaine, une fonction serveur, un espace privé ; un nouveau destinataire dans les textes | module 6 (Dépenses) | 2 à 8 jours |
| **8. La lecture et le classement proposés** (photo, PDF, fichier), **courriers de l'URSSAF compris** | « 3 justificatifs lus, à valider » ; « l'URSSAF vous écrit : réponse attendue avant le … » | c'est votre §13 ; une action de l'agent avec sa permission et son journal | module 6 | 2 à 8 jours (c'est le module 6 ; les courriers de l'URSSAF ne sont pas chiffrés à part) |
| **9. Un e-mail de client transféré devient une demande, une fiche et un brouillon de devis** | votre scénario du §25, depuis la boîte | l'adresse de l'étape 7 ; clients et devis existent | après l'étape 7 | 2 à 8 jours |
| **10. Le dossier pour le comptable** | ventes, dépenses et justificatifs en un envoi | factures et dépenses ; une connexion à un logiciel comptable demande un partenariat (à vérifier, non chiffrable) | modules 3 et 6 | 2 à 8 jours |
| **11. Les échéances et l'URSSAF** : rappels, chiffre d'affaires encaissé préparé, estimation des cotisations, écart expliqué | ne plus manquer une échéance, comprendre un montant | encaissements, agenda ; aucune connexion à l'URSSAF ; le régime de l'artisan (micro ou non) à lui demander | après les modules 3 et 5 | 2 à 4 jours pour le rappel ; l'estimation n'est pas chiffrée à part |
| **12. « Mes prix réellement payés »** et les alertes **A2, A3, A4** | « le sac de ciment est passé de 10 € à 10,20 € » | les achats validés et datés, la liste des matériaux, les conditionnements, la composition des postes | module 7 (Fournisseurs et prix) | non chiffré (c'est le module 7) |
| **13. L'alerte A5** (« ce chantier consomme plus que prévu ») | voir dériver un chantier pendant qu'il est temps | heures passées, achats rattachés, avancement : le chantier de gestion (§12) | après le chantier de gestion, l'agenda et les dépenses | non chiffré, la plus lointaine |
| **14. Déclarer à la place de l'artisan**, par l'API de l'URSSAF | la déclaration faite pour lui | l'habilitation de tiers-déclarant, par la société qui éditera Opus ; **micro-entrepreneurs seulement** | très tard, et seulement si vos artisans sont surtout micro-entrepreneurs | impossible à chiffrer : dépend de l'URSSAF |
| **15. La boîte Gmail ou Outlook connectée** : tri, « répondez à cet e-mail », brouillon déposé dans la boîte | l'expérience « Cowork dans Opus » | la vérification de Google (CASA chaque année), celle de Microsoft, le contrat de sous-traitance, l'analyse d'impact, les textes légaux réécrits, une décision sur la limite de 60 appels | **en dernier** (phase 12 de votre cahier) | 8 à 30 jours, très incertain, **plus** les délais de Google |

**En tout**, les étapes 5, 7, 9, 10 et 11 font environ **10 à 32 jours de
travail** (estimation de l'étude). L'étape 15 vient en plus.

**Avant même l'étape 7**, il reste :

- les lots 2b, 2c, 3, 4 et 5 du devis, soit **environ 10 à 20 jours**
  (estimation ; le lot 2a était encore en correction le 04/11/2026) ;
- les modules Factures, Tableau de bord et Agenda, qui **n'ont aucun plan**
  et ne peuvent pas être chiffrés honnêtement.

**Pourquoi la boîte connectée vient en dernier.** Construite plus tôt, elle
donnerait des brouillons qui ne connaissent ni vos clients, ni vos devis, ni
vos prix : un assistant de messagerie de plus, comme ceux qui existent déjà.
C'est aussi la seule étape qui dépend d'une vérification extérieure (Google)
et d'une refonte des textes légaux.

**Une proposition à trancher** : avancer le module Dépenses avant le
tableau de bord. Votre §8.2 veut une « Marge estimée / réelle selon les
données disponibles », et la marge réelle demande les dépenses. Rien dans le
dépôt ne l'a tranché.

---

## 8. Les questions que vous devrez trancher

Aucune ne se pose aujourd'hui : le devis passe d'abord. Elles sont rangées
selon le moment où elles se poseront.

**Maintenant**

1. **Cette idée entre-t-elle dans un cahier des charges ?** Proposé :
   **après le devis et la facture**, comme vos deux autres idées récentes.
   Et une courte entrée dans `docs/A-FAIRE.md` qui renvoie ici, comme pour
   le parrainage (ce document ne l'a pas ajoutée).
2. **Quelles messageries utilisent vos artisans** : Gmail, Outlook, Orange,
   Free ? Ce n'est pas connu. Votre frère peut-il répondre ?

**Au lot 2 du devis**

3. **Le coût d'une journée** : l'artisan le tape lui-même, ou Opus l'aide à
   le calculer (avec un renvoi à Calculab ou au comptable) ? Proposé :
   **aucune valeur par défaut**.
4. **Le seuil de marge** : confirmé qu'il appartient à l'artisan, sans
   « marge normale du marché » ?

**Au lot 4 du devis**

5. **La limite de 60 appels par jour** : trier les e-mails par paquets, ou
   un compteur à part ?

**À l'ouverture du module 3 (Factures)**

6. **Une plateforme agréée partenaire, ou non**, et laquelle ? (Question
   déjà rangée dans `docs/A-FAIRE.md`.)
7. **Avancer le module Dépenses avant le tableau de bord ?**

**Au début du module 6 (Dépenses)**

8. **L'adresse de dépôt d'abord ?** C'est la seule voie qui évite les
   vérifications de Google et de Microsoft.
9. **Demander à l'artisan son régime social** (micro-entrepreneur ou non) :
   une donnée nouvelle, nécessaire aux échéances et aux cotisations.
10. **Quelles échéances rappeler** ? La camionnette demande des données
    nouvelles ; la décennale est déjà connue.

**Au début du module 7 (Fournisseurs et prix)**

11. **Le seuil d'alerte d'une hausse de prix**, et l'âge à partir duquel un
    prix passe « à vérifier » (le dépôt propose 3 mois, puis « historique »
    à 12 mois).

**Avant la boîte connectée**

12. **Le brouillon sur demande, ou pour chaque e-mail ?** Sur demande, le
    coût est divisé par deux à trois.
13. **L'envoi automatique** : interdit pour toujours, ou un jour un réglage
    éteint par défaut, réservé aux messages sans enjeu ?
14. **Une barrière définitive entre les e-mails et la future base de prix
    du BTP ?** Pour Gmail, Google l'impose déjà.
15. **Imposer un calcul « États-Unis seulement »** (10 % plus cher) ?
16. **L'URSSAF** : vous limiter aux rappels, ou demander un jour
    l'habilitation de tiers-déclarant (micro-entrepreneurs seulement) ?
    Cette demande serait faite par la société qui éditera Opus, et ce n'est
    pas encore décidé.

**Avec un juriste, avant de construire la partie concernée**

17. Le contrat de sous-traitance, le modèle d'analyse d'impact, le secret
    des correspondances, la frontière avec l'expertise comptable et le
    conseil juridique, et la façon de parler de cette vision sans la
    promettre.

**Avec le modèle économique**

18. **Ce que l'artisan paie**, sachant que le coût de l'IA devient un coût
    par artisan et par mois (§6).

---

## 9. Les sources

**Les études du 04/11/2026** (dossier de travail de la session, non
versionné) : rapports « boîte e-mail », « administrations », « concurrence »,
« droit et coût », « place dans le plan », leur synthèse et son
contre-examen ; compléments « factures fournisseurs », « marge »,
« URSSAF », et leur contre-examen. Les corrections des contre-examens
priment.

**Dans le dépôt** :

- `CLAUDE.md` (« Le socle de l'agent », « Le récit du chantier », « Nommer
  son agent », « Le carnet de clients » ; « Les permissions Supabase » ; lots T, 1, P, S-d) ;
- `docs/CAHIER-DES-CHARGES.md` (§2, §3, §4, §8, §10, §12, §13, §14, §15,
  §19, §20, §21, §23, §24, §25, §26, §27) et
  `docs/OPUS-cahier-des-charges.pdf`, qui fait foi ;
- `docs/A-FAIRE.md` (§2.2 « Notifications push » ; « Le logiciel de
  gestion — l'ordre des modules » ; les urgences et le parrainage ;
  « Fournisseurs et prix (module 7) » ; « La base de connaissances du
  BTP ») ;
- `docs/COMPARATEUR-MATERIAUX.md` (§1, §2, §3, §7, §9, §11) ;
- `docs/DONNEES-DES-ARTISANS.md` (§2.4, §5.2, §5.4) ;
- `docs/CONCURRENCE-DEVIS.md`, `docs/CONCURRENCE-IA-DEVIS.md` ;
- `src/data/legal.js` (`contratSousTraitance`, la phrase « UNIQUEMENT
  quand ») ; `src/lib/journal-ia.js` (`LIMITE_IA_PAR_JOUR`) ;
- la vraie base, liste des extensions relevée le 04/11/2026 (en lecture
  seule).

**Google et Microsoft** :

- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
- https://support.google.com/cloud/answer/15549945
- https://support.google.com/cloud/answer/7454865
- https://developers.google.com/terms/api-services-user-data-policy
- https://developers.google.com/workspace/workspace-api-user-data-developer-policy
- https://developers.google.com/workspace/gmail/api/guides/push
- https://support.google.com/mail/answer/10957?hl=fr
- https://learn.microsoft.com/en-us/graph/permissions-reference
- https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/manage-app-consent-policies
- https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview
- https://support.microsoft.com/office/outlook-and-other-apps-are-unable-to-connect-to-outlook-com-f4202ebf-89c6-4a8a-bec3-3d60cf7deaef
- Prix de l'évaluation CASA, sources tierces à vérifier :
  https://www.switchlabs.dev/post/casa-tier-2-tier-3-security-review-providers-pricing-and-the-cheapest-option
  et https://leviathansecurity.com/programs/google-casa-cloud-application-security-assessment
- Free : https://assistance.free.fr/articles/609 ; IONOS :
  https://www.ionos.com/help/email/general-topics/ionos-mail-server-details-for-imap-pop3-and-smtp/

**Serveur, réception des e-mails, iPhone** :

- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/database/vault
- https://postmarkapp.com/developer/user-guide/inbound/parse-an-email
- https://postmarkapp.com/pricing
- https://www.mailgun.com/pricing/
- https://developers.cloudflare.com/email-routing/limits/
- https://docs.expo.dev/versions/latest/sdk/background-task/
- https://docs.expo.dev/push-notifications/sending-notifications/

**Facture électronique** :

- https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique
- FAQ officielle, « Version du 01/09/2026 » :
  https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf
- Spécifications externes v3.2 : https://www.impots.gouv.fr/specifications-externes-b2b
- Arrêté du 27/07/2026 (NOR CPPE2610309A) et décret n° 2026-677 (copies du
  Journal officiel) :
  https://www.associatheque.fr/fr/fichiers/actualite/arrete-20260707-texte-27-NOR-CPPE2610309A.pdf
  et https://www.associatheque.fr/fr/fichiers/actualite/decret-2026-677-NOR-CPPE2610307D.pdf
- Liste des plateformes (modifiée le 03/11/2026) :
  https://www.impots.gouv.fr/liste-des-plateformes-de-dematerialisation-partenaires-pdp-immatriculees-sous-reserve
- https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/
- https://fnfe-mpe.org/factur-x/factur-x_en/
- Norme XP Z12-014, annexe A v1.2 :
  https://fnfe-mpe.org/wp-content/uploads/2025/11/XP_Z12-014_CAS_USAGE_Annexe_A_V1.2.pdf
- Courrier de SAMSE :
  https://www.samse.fr/media/wysiwyg/upload/CourrierReformeFacturationElectronique.pdf
- https://www.b2brouter.net/fr/edocsync-pdp/

**URSSAF, impôts, comptable** :

- https://www.data.gouv.fr/dataservices/api-tierce-declaration-auto-entrepreneur
- https://www.plus.transformation.gouv.fr/experiences/4476834_prendre-connaissance-dun-message-sur-autoentrepreneururssaffr
- https://www.legisocial.fr/actualites-sociales/7888-urssaf-fin-acces-messages-3-ans.html
- https://www.impots.gouv.fr/loffre-api-de-la-dgfip
- https://bofip.impots.gouv.fr/bofip/3458-PGP.html/identifiant=BOI-BIC-DECLA-30-60-30-20-20190605
- Conditions d'utilisation de l'espace professionnel, mises à jour le
  12/10/2026 : https://www.impots.gouv.fr/node/9711
- https://www.net-entreprises.fr/declaration/dsn-tpe-associations/
- https://entreprise.api.gouv.fr/faq
- https://bofip.impots.gouv.fr/bofip/9026-PGP.html/identifiant=BOI-CF-IOR-60-40-10-20170607
- https://pennylane.readme.io/docs
- https://docs.chift.eu/connectors/accounting/tiime.md

**Cotisations, échéances, TVA** :

- Service-Public : https://entreprendre.service-public.gouv.fr/vosdroits/F23257
  (déclaration, oubli), F23267 (versement libératoire), F37483 (chambre de
  métiers), F23547 (CFE), F21746 (franchise de TVA), F23566 (TVA au réel),
  F36232 (cotisations), F36235 (dirigeants), et
  https://www.service-public.gouv.fr/particuliers/vosdroits/F33353
  (contrôle technique)
- https://bpifrance-creation.fr/encyclopedie/micro-entreprise-regime-auto-entrepreneur/fiscal-social-comptable/regime-social-du
- Décret n° 2026-69 : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053449085
- https://bofip.impots.gouv.fr/bofip/849-PGP.html/identifiant=BOI-TVA-DECLA-40-10-10-20260701
- https://www.impots.gouv.fr/actualite/cfe-etou-ifer-2026-mise-en-ligne-des-avis-dimpot-dans-lespace-professionnel
- Attestation de vigilance :
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030422273
  (R. 8222-1) et https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046078939
  (D. 8222-5)
- Décennale : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006796023
  (L. 243-3)
- Code de la sécurité sociale, L. 244-2 :
  https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006073189/LEGISCTA000006156312/

**La marge** :

- Éduscol, « Déboursés secs et Prix de Vente » :
  https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/ressources/pedagogiques/12096/12096-03dr-ds-et-pvht-eleves.pdf
- FFB, prix de revient (22/09/2021) :
  https://www.ffbatiment.fr/gestion-entreprise/devis-publicite-relations-clients/definir-mon-prix/dossier-ba/prix-de-revient-comment-calculer-votre-juste-prix
- FFB, suivi de chantier (24/05/2017) :
  https://www.ffbatiment.fr/gestion-entreprise/comptabilite-banque-assurances/benefices-rentabilite/dossier-ba/10-min-par-jour-pour-maitriser-vos-marges
- https://www.batiprix.com/content/42-la-methode-batiprix
- https://www.capeb.fr/service/calculer-ses-prix
- Banque de France, fascicule Construction 2024 :
  https://acpr.banque-france.fr/system/files/2025-11/fascicule-sectoriel-construction-F-2024.pdf
- Concurrents : https://www.obat.fr/devis-factures/ ;
  http://help.tolteck.com/fr/articles/8336586-est-il-possible-de-calculer-et-suivre-ma-marge-sur-tolteck ;
  https://www.batappli.fr/fonctionnalites ; https://costructor.co/rentabilite-chantier/

**La douleur** :

- https://www.batimedialive.com/btp-13-heures-par-semaine-absorbees-par-ladministratif-un-frein-direct-a-la-performance-des-artisans/
- https://www.breizh-info.com/2026/04/20/259070/
- https://www.iris-st.org/medias/7/rapport-barometre-2025.pdf
- https://www.metiers-btp.fr/wp-content/uploads/2026/02/2026.02.10-Constructys-CP-Etude-IA-VF.pdf
- https://www.entreprises.gouv.fr/espace-presse/barometre-france-num-2026-quatre-tpe-pme-sur-dix-utilisent-desormais-lintelligence

**Les concurrents** :

- https://qonto.com/fr/integrations/gmail-sync-ap
- https://www.costructor.co/tarifs
- https://www.artisaia.fr/
- https://www.matinel.fr/
- https://www.fyxer.com/pricing
- https://www.microsoft.com/en-us/copilot/pricing/business
- https://claude.com/product/cowork
- https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
- https://abby.fr/declarations-urssaf-tva

**Le droit** :

- Pratiques commerciales trompeuses (L. 121-2) :
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563114 ;
  sanctions (source secondaire) :
  https://www.lemag-juridique.com/articles/publicite-mensongere-tromperie-quelle-repression-pour-ces-pratiques-commerciales-frauduleuses-9695.htm
- Expertise comptable, ordonnance n° 45-2138, article 2 :
  https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000032364676 ;
  article 20 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000045178543 ;
  code pénal 433-17 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000021342951
- Conseil juridique, loi n° 71-1130, article 54 :
  https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000039280601 ;
  réponse ministérielle du 03/10/2006 :
  https://www.assemblee-nationale.fr/dyn/12/questions/QANR5L12QE102604 ;
  amendement rejeté le 11/01/2026 :
  https://www.senat.fr/enseance/2025-2026/261/Amdt_11.html
- Cass. com. 17/09/2025 (lu à travers un commentaire) :
  https://www.lofficieldesmetiers.fr/exercice-illegal-de-la-profession-dexpert-comptable-la-saisie-informatique-de-donnees-comptables-ne-suffit-pas-mais-une-preuve-deloyale-peut-etre-recevable/
- RGPD et CNIL : https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4 ;
  https://www.cnil.fr/fr/lanalyse-dimpact-relative-la-protection-des-donnees-dpia ;
  lignes directrices WP248 : https://ec.europa.eu/newsroom/article29/redirection/document/47711
- ANSSI, recommandations pour l'IA générative (29/04/2024) :
  https://messervices.cyber.gouv.fr/documents-guides/Recommandations_de_s%C3%A9curit%C3%A9_pour_un_syst%C3%A8me_d_IA_g%C3%A9n%C3%A9rative.pdf
- Secret des correspondances, sources secondaires à vérifier :
  https://www.cabinetaci.com/violation-du-secret-des-correspondances/ et
  https://www.baumann-avocats.com/CPCE/article-l32-3-du-code-des-postes-et-des-communications-electroniques.php

**Anthropic (coût et données)** :

- https://platform.claude.com/docs/en/about-claude/pricing
- https://platform.claude.com/docs/en/manage-claude/data-residency
- https://www.anthropic.com/legal/data-processing-addendum
- https://privacy.claude.com/en/articles/7996866-how-long-does-anthropic-store-my-organizations-data
- https://www.anthropic.com/legal/commercial-terms
