# Le devis fait avec l'IA — comment font les autres, et comment faire mieux

> **La demande, du 17/10/2026** : « il faudra que on analyse bien comment les
> devis sont faits avec l'IA sur les autres plateformes pour être meilleur
> qu'eux ; je peux t'envoyer une photo d'un devis que je faisais avec mon
> entreprise pour voir comment ils sont faits ? »
>
> **Mis à jour le soir du 17/10/2026**, après une critique en vingt-cinq
> points, **puis relu une dernière fois le 18/10/2026**. Il tient compte de
> vos réponses du 17/10 au soir (`PLAN-DEVIS.md` §10.12) :
> - votre entreprise est **fermée** : vos deux anciens devis ne servent plus que
>   de modèle ;
> - votre **frère**, entrepreneur individuel en franchise de TVA, est d'accord :
>   il utilisera le compte pro de test, qui lui sera **remis** ;
> - chez vous, un devis se prépare **après** la visite, part **plus tard** par
>   courriel, et revient signé par courriel (rarement sur papier, sur place).
>
> Le plan du devis a bougé le même jour (`PLAN-DEVIS.md` §10) : une **base de
> postes** est décidée (le « lot P »), le **lot 0 est coupé en deux**, les
> **prix du marché** n'entrent jamais dans ce module, et **aucune action d'IA
> n'entre dans le module devis** — elles viendront après lui, avec le journal
> et les permissions de la section 38. Ce document en tient compte partout.
>
> **Ce document ne parle que de l'IA.** Les autres documents sur le devis
> restent valables : le marché en général dans `docs/CONCURRENCE-DEVIS.md`
> (12/10), vos deux devis et l'idée de la base « fidèle à l'artisan » dans
> `docs/DEVIS-DU-PROPRIETAIRE.md`, le droit et la conception du module dans
> `docs/PLAN-DEVIS.md`. Sur les sources de prix, `docs/SOURCES-DONNEES-BTP.md`
> fait foi ; sur ce qu'on a le droit de faire des données des artisans,
> `docs/DONNEES-DES-ARTISANS.md` ; sur les prix des fournisseurs,
> `docs/COMPARATEUR-MATERIAUX.md` (17-18/10). Celui-ci ne remplace aucun d'eux :
> là où il les contredirait, ce sont eux qui ont raison.
>
> **Comment il a été fait.** Seize outils ont été étudiés :
> - dix français : Costructor, Renalto, ATTIX, Batappli, Calyflux, Boby, Obat, Donizo, Vulko, IArtisans ;
> - deux allemands : HERO, Angebotsmeister ;
> - deux américains : Handoff, Houzz Pro ;
> - un canadien : Jobber ;
> - un australien : Buildxact.
>
> Une seconde recherche a vérifié chaque affirmation sur sa source. Puis une
> critique a relu l'ensemble (vingt-cinq points), et une contre-vérification a
> relu la version corrigée (quinze erreurs restantes, revérifiées une à une).
> **Quand l'une d'elles a donné tort, c'est la correction qui est écrite
> ici** ; ce qui reste incertain est au §7. Les prix ont été relevés le
> 17/10/2026. Ils sont hors taxes, sauf mention contraire.
>
> **Ce qui n'a PAS été fait** : aucun compte n'a été ouvert chez un
> concurrent, et **aucun écran n'a été vu en fonctionnement**. Tout vient des
> pages des éditeurs, de leurs centres d'aide et de leurs captures, des
> magasins d'applications et des avis publics.

### Les mots employés

- **IA généraliste** : ChatGPT, Gemini, Le Chat ou Claude utilisés directement,
  sans logiciel de devis autour.
- **modèle (d'IA)** : le programme qui écrit les réponses (Claude chez
  Anthropic, GPT chez OpenAI, Gemini chez Google). Il ne connaît aucun prix :
  il produit un texte plausible.
- **bibliothèque**, ou **catalogue** : la liste d'ouvrages et de prix qu'un
  logiciel garde pour l'artisan. Chez Opus, ce sera la **base de postes**.
- **base de prix** : un fichier de prix vendu par un éditeur (Batiprix,
  BatiChiffrage). Il est protégé par la loi : on ne le recopie pas sans accord.
- **LégiFiscal** : un site d'information fiscale privé ; ce n'est pas le texte officiel, qui se lit sur Légifrance.
- **site affilié** : un site payé à chaque abonnement vendu par ses liens. Son
  avis n'est donc pas neutre.
- **bêta** : version d'essai, pas encore finie.
- **jeton** : la preuve de connexion que le téléphone envoie avec chaque
  demande. C'est ainsi que la base sait QUI demande.
- **instantané** : une valeur recopiée sur la ligne au moment du devis, qui ne
  bouge plus si la source change ensuite. Le contraire, une **jointure**, va
  relire la source à chaque affichage.
- **réponse structurée** : une réponse de l'IA rendue dans une forme fixe
  (tel champ, tel type de valeur), qu'un programme peut contrôler avant de
  l'afficher. Le contraire d'un texte libre.
- **consigne** (en anglais « prompt ») : le texte d'instructions envoyé au
  modèle avec la demande. Sa **version** dit laquelle a servi, pour pouvoir
  comparer.
- **fonction Edge** : un petit programme d'Opus qui tourne chez Supabase, sur
  un serveur, et non dans le téléphone. Chaque appel à l'IA passe par l'une
  d'elles, la fonction `ai`, et c'est elle qui garde la clé d'Anthropic hors
  de l'application.
- **HTTP 200** : la réponse « bien reçu » d'un service web. Quand une fonction
  Edge répond autre chose (401, 429…), l'outil que l'application utilise pour
  l'appeler en fait une erreur anglaise générique, et le message en français
  qu'elle contenait n'est plus lu (§5, idée n° 5).
- **règle d'accès** (RLS) : la règle, tenue par la base, qui décide qui peut
  lire ou écrire quelle ligne.
- **DTU** : les normes qui disent comment poser (documents techniques
  unifiés). Payantes, et leurs éditeurs refusent qu'une IA les lise.
- **CEE** : certificats d'économies d'énergie, une aide aux travaux qui
  économisent l'énergie. **MaPrimeRénov'** : l'aide de l'État à la rénovation
  énergétique.
- **LiDAR** : capteur de distance des iPhone Pro, qui permet de relever une
  pièce en trois dimensions.
- **DPGF** : décomposition du prix global et forfaitaire, le tableau à remplir
  d'un appel d'offres.
- **sous-traitant** (au sens du RGPD, la loi européenne sur les données
  personnelles) : celui qui traite des données pour le compte d'un autre. Opus
  l'est pour les données des clients de chaque artisan.
- **lot** : une étape de construction du module devis. Le **lot P** crée la
  base de postes, juste après le lot 1 (`PLAN-DEVIS.md` §10.6).
- **remise** (d'un devis) : le moment où l'artisan le donne ou l'envoie au
  client ; dans Opus, quand le PDF est produit et archivé. C'est à ce
  moment-là que se décide le régime qui s'applique (§5, idée n° 9).
- **directive 2011/83** : la directive européenne sur les droits des
  consommateurs (contrats conclus à distance ou hors établissement). Un
  **considérant** est un paragraphe d'explication placé en tête d'un texte
  européen : il ne crée pas de règle, il dit comment lire les articles.

Les noms de fonctions de la base ou de fichiers du code
(`motifs_refus_remise`, `ACTIONS_IA`…) ne sont donnés qu'entre parenthèses,
pour le développeur. On peut les sauter.

---

## §0. En une page

### Ce qu'il faut retenir en trois minutes

**1. Faire rédiger le devis par l'IA ne distingue plus personne.** Quinze des
seize outils font la même chose : on décrit le chantier (à la voix, au
clavier, parfois en photo) et des lignes de devis sortent. Le seizième,
IArtisans, ne rédige pas : il relit un devis fait ailleurs. Le §1 décrit les
six façons de s'y prendre. Aucune n'appartient à un seul éditeur. Et le
concurrent le plus répandu ne coûte rien : l'IA généraliste avec un modèle
Word (§3.8).

**2. Ce qui les sépare, c'est l'origine des PRIX. Presque aucun ne la dit
clairement.**

| d'où vient le prix | qui fait ainsi | ce que ça vaut |
|---|---|---|
| des prix de l'**artisan** seulement : sa bibliothèque, ses anciens devis, son taux horaire. Sinon, la case reste **vide** | Calyflux ; HERO (qui peut aussi écrire des prix dans ce catalogue si l'artisan le lui demande) | honnête, mais le premier devis d'un nouvel inscrit sort presque sans prix |
| **mixte** : les prix de l'artisan, puis un calcul (temps × taux horaire), puis une fourchette « estimée » d'origine non publiée, et seulement ensuite une case vide | Angebotsmeister | chaque ligne dit laquelle des quatre, mais l'« estimé » reste invérifiable |
| d'une **base de prix** achetée, ou d'un **fournisseur** (Batiprix, BatiChiffrage, Home Depot…) | Handoff, Buildxact, Batappli, Obat (en option) | prix réels et datés, mais payants, sous licence, souvent étrangers. En France, c'est toujours une option que l'artisan paie lui-même (`SOURCES-DONNEES-BTP.md` §3) |
| d'une **fourchette fournie par l'éditeur**, dont l'origine n'est pas publiée | Vulko, Renalto, ATTIX, Batappli | impossible à vérifier |
| du **modèle d'IA lui-même** (« prix du marché ») | Houzz (« Gemini »), Boby, Obat sans bibliothèque ; Renalto et Handoff en dernier recours | un nombre plausible, ni daté ni régional, et c'est l'artisan qu'il engage |

**3. Le vrai gain porte sur la structure et les mots, pas sur les prix.** Le
seul essai détaillé publié par un tiers (Costructor) conclut :

> « Nous avons systématiquement retouché les prix unitaires et ajusté les
> marges avant envoi. Le gain de temps se situe sur la structure du devis et
> la rédaction des libellés, pas sur le chiffrage exact. »
> — *Le Blog du Dirigeant, 19/08/2026*

Un chiffre circule aussi, et il ne prouve rien dans un sens ni dans l'autre :
Buildxact annonce que ses utilisateurs ont fait plus de 2 560 estimations avec
son IA, dont 10 % envoyées comme devis final (communiqué du 10/12/2025, qui
présente ce chiffre comme un succès). On ne sait pas combien des 90 % restants
sont des essais ou des brouillons encore ouverts.

**4. Les artisans se plaignent de quatre choses** (détail au §3) :
- tous les prix sont à reprendre ;
- les **quantités** sont fausses (« des surfaces qui se mettent toutes seules à 1 m2 », chez Obat) ;
- l'IA **modifie ce qu'on ne lui a pas demandé**, ou efface les corrections ;
- le **réseau** manque, et les **quotas** sont vite épuisés.

S'y ajoute une cinquième plainte, plus grave pour un nouveau venu : « ce n'est
pas mieux qu'une IA gratuite » (§3.7 et §3.8).

**5. Les meilleures idées vues misent sur l'HONNÊTETÉ, pas sur la puissance :**
- chaque ligne indique d'où vient son prix (ATTIX, Angebotsmeister), et une
  case reste **vide plutôt que fausse** (Angebotsmeister, Calyflux) ;
- trois questions sont posées **avant** de chiffrer (Costructor, Renalto, ATTIX) ;
- un **relecteur** signale les oublis sans rien modifier (Buildxact) ;
- les lignes proposées sont **à cocher** : rien n'entre dans le devis sans un
  geste de l'artisan (Batappli) ;
- le mode automatique n'est proposé qu'**après trois devis** que l'artisan a
  vu faire (Jobber).

> **La conclusion pour Opus.** Ne pas chercher à « chiffrer avec l'IA » mieux
> que les autres : c'est précisément là que tous échouent. Faire l'inverse :
> **des prix qui ne viennent que de l'artisan, et chaque ligne qui le dit** ;
> une IA qui **range, relit et propose**, mais n'invente jamais un prix. C'est
> l'idée que vous avez décrite le 17/10, une base « fidèle à l'artisan », et
> aucun concurrent ne la mène jusqu'au bout. **Ce qui est déjà décidé**, sans
> IA dans les deux cas (`PLAN-DEVIS.md` §10.6) :
> - la **mémoire** au lot 1, qui se remplit d'elle-même de ce que l'artisan a
>   émis ;
> - la **base de postes** au lot P, qui se remplit **d'un appui** de
>   l'artisan, jamais toute seule.
>
> C'est l'agent, **après** le module devis, qui proposera les postes nouveaux,
> avec son journal, sa permission et sa limite. Les idées sont classées au §5.

### Votre question : envoyer la photo d'un devis

**Oui, c'est utile, mais pas pour la mise en forme.** Celle-ci est déjà
analysée sur vos deux devis du 17/10 (`DEVIS-DU-PROPRIETAIRE.md`). Une
troisième photo servirait à deux choses que ces deux devis ne montrent pas :

1. **Servir de cas d'essai pour la lecture des anciens devis.**
   Angebotsmeister lit la photo d'un ancien devis (4 pages au plus, dans son
   application) pour remplir l'historique de prix de l'artisan ; Renalto fait
   la même chose à partir d'un PDF ; Calyflux et Donizo importent aussi
   d'anciens devis, sans dire clairement si cela remplit leurs prix ; Houzz
   lit la photo d'un ancien devis, mais pour en tirer un NOUVEAU devis, sans
   catalogue documenté (§1.3). C'est l'idée n° 5 du §5. Opus devra savoir
   lire une photo, pas seulement un PDF ou un tableur : beaucoup de vieux devis
   n'existent plus que sur papier. Et vous seul connaissez la « vérité
   attendue » : les vraies lignes et les vrais prix. On pourra donc
   **mesurer** ce que la lecture rate. C'est exactement ce que le cahier
   Visite exige avant toute mise en production (§16-17).
   **Vos devis sont les seuls à pouvoir servir ainsi**, parce que c'est vous
   qui les avez émis, et que vous pouvez en masquer tout ce qui désigne un
   client. Ceux de votre frère, ou de tout autre artisan, même masqués,
   seraient des données de leurs clients réutilisées pour le compte d'Opus,
   ce que `PLAN-DEVIS.md` §10.6 interdit (règle 3).
2. **Montrer un devis d'une autre nature** : un petit dépannage (là, un devis
   est dû dès le premier euro), un devis à TVA 5,5 %, un devis refusé par le
   client, ou une facture.

Comme pour les deux premiers devis : **noms, adresses et téléphones des
clients masqués ou fictifs.**

> **L'essai le plus utile pour la question du jour, c'est vous qui pouvez le
> faire — sans ouvrir de compte.** Personne n'a vu un écran concurrent
> fonctionner en vrai. Or Renalto propose un essai **sans inscription**
> (app.renalto.com/essai-devis, 800 caractères au plus, en écrit, à la voix
> ou avec un document). Décrivez-lui, avec vos propres mots, le chantier d'un
> de vos deux anciens devis. Puis comparez les lignes, les quantités et les
> prix avec ce que vous aviez écrit. C'est la seule mesure de qualité réelle
> qu'on puisse obtenir.
>
> **Ce qu'il ne faut PAS faire : ouvrir un compte chez un concurrent**, même
> gratuit, même « sans carte bancaire ». Trois raisons :
> - vous n'avez plus d'entreprise, et plusieurs inscriptions partent d'un
>   SIRET (Vulko remplit tout à partir de lui) ou réservent le service aux
>   professionnels (les conditions de vente de Calyflux) ;
> - le seul SIRET à votre portée est celui de votre frère, et **son accord
>   porte sur Opus, pas sur des comptes chez d'autres éditeurs**. Jamais son
>   numéro, ni celui d'une autre entreprise ;
> - certaines conditions l'interdisent en toutes lettres : celles de
>   Costructor défendent d'ouvrir un compte « en vue d'élaborer un produit ou
>   service concurrent » (`SOURCES-DONNEES-BTP.md` §3.1). C'est exactement ce
>   que serait votre essai.
>
> Et ce que vous tapez part chez l'éditeur : les conditions de Renalto lui
> accordent un droit d'utilisation « illimité dans le temps » sur ce qu'on lui
> confie. Aucun vrai nom de client, aucune adresse, et aucun prix que vous
> voudriez garder pour vous.

### Ce que cette étude corrige dans `CONCURRENCE-DEVIS.md`

| écrit le 12/10 | ce qui est vrai au 17/10 | source |
|---|---|---|
| Costructor : « GRATUIT, avec dictée vocale IA » | l'offre gratuite n'a **pas d'IA**. Le devis par IA est dans l'offre Pro (15 €/mois, ou 12,50 € en annuel, **2 devis par mois**), et illimité dans l'offre Premium (60 €/mois) | costructor.co/tarifs |
| Costructor : 132 000 entreprises, 4,9/5 sur 400 avis | 140 000 ou 180 000 utilisateurs selon la page ; 4,9/5 sur plus de 650 avis Google, dont le texte n'est pas lisible | costructor.co ; communiqué du 13/10/2026 |
| Boby : 14,99 / 29,99 / 49,99 €, devis dicté par WhatsApp | la dictée et WhatsApp ne sont que dans l'offre **Pro** (49,99 €). Les deux autres offres n'ont, en fait d'IA, que l'analyse du devis (l'offre nommée « Copilot » ne contient pas l'IA Copilote) | app.boby.net/tarifs-boby |
| Renalto : 5 000 utilisateurs, 30 000 devis | 1 800, 10 000 ou 30 000 selon la page ; Google Play affiche « 1 k+ téléchargements » | renalto.fr ; Google Play |
| Obat : « devis vocal IA livré » | oui, mais limité à **2 devis vocaux par mois** sans l'option à 29 € HT par mois et par utilisateur | aide.obat.fr |
| IArtisans « contrôle les taux de TVA » | la TVA réduite y est contrôlée **comme condition d'obtention d'une aide**. Ce n'est pas un contrôleur général des taux | capeb.fr ; dépliant de juin 2025 |
| Coup 1 : « la demande reçue devient un devis — le seul inimitable » | **Jobber** (Canada) tire un brouillon de la demande reçue par son formulaire ; **Angebotsmeister** (Allemagne) d'un e-mail transféré ou d'une demande collée. Aucun outil **français** étudié ne part d'une demande reçue sur son propre réseau. L'avantage d'Opus demeure, mais il n'est pas absolu | help.getjobber.com ; angebots-meister.de |
| « 8 demandes de devis reçues » | **8 demandes reçues**, dont 6 demandes de devis et 2 demandes de rappel (aucune urgence) ; 4 des 6 demandes de devis acceptées ou terminées ; 1 client ; 2 chantiers ; aucune table de devis | comptage sur la vraie base, 17/10 |
| Coup 1 : « le texte de sa demande et ses photos sont déjà là » | une demande de devis **n'a pas de colonne photo**, et sa description est facultative. « En faire un devis » ne préremplit que la description ; l'adresse vient du carnet de clients | `schema.sql` (table `quote_requests`) ; `PLAN-DEVIS.md` §10.7 |
| §7, point 8 : « On garde le brouillon local » | le brouillon vit **en base**, sauvegardé ligne par ligne ; le hors-ligne attend qu'un artisan le réclame | `PLAN-DEVIS.md` §3.1 et §6 |

---

## §1. Les six façons de faire un devis avec l'IA

| façon | ce que fait l'artisan | qui le fait | ce que ça vaut vraiment |
|---|---|---|---|
| **1.1 dicter ou taper** | il décrit le chantier en une phrase | tous ceux qui rédigent | fait gagner du temps sur les libellés, pas sur les prix |
| **1.2 photographier** | il photographie le chantier, un plan, ses notes, ou scanne la pièce | ATTIX, Vulko, Donizo, Calyflux, Handoff, Houzz, Buildxact | très peu prouvé ; Costructor l'exclut |
| **1.3 déposer un document** | il fournit un dossier d'appel d'offres, un devis fournisseur, un ancien devis, un e-mail de client | Costructor, Renalto, HERO, Houzz, Angebotsmeister, Jobber… | la façon la plus utile, et la plus sous-estimée |
| **1.4 répondre à des questions** | l'IA demande ce qui manque avant de chiffrer | Costructor, Renalto, ATTIX, Buildxact | la seule protection contre les quantités fausses |
| **1.5 laisser l'outil apprendre** | consignes, prix corrigés, libellés retenus | Renalto, Batappli, Donizo, Vulko, ATTIX, Angebotsmeister, HERO, Jobber | c'est là que se joue la fidélité à l'artisan |
| **1.6 faire relire** | l'IA signale, l'artisan décide | Buildxact, Boby, IArtisans, Donizo | la forme la moins risquée : elle ne touche à aucun prix |

### 1.1 Dicter ou taper : une phrase devient des lignes

**Comment.** L'artisan dit par exemple « rénovation de salle de bain 12 m²,
douche à l'italienne, WC suspendu ». L'outil découpe le travail en lots
(dépose, plomberie, carrelage…). Chaque ligne reçoit une désignation, une
quantité, une unité, un prix et un taux de TVA. Les éditeurs annoncent entre
10 secondes et une minute. Le test le plus sérieux mesure « une minute entre la
description et le devis affiché à l'écran, contre vingt à trente minutes en
saisie manuelle » (Le Blog du Dirigeant, à propos de Costructor).

**Ce que ça vaut.** Les libellés sont longs et techniques, et c'est
appréciable : « En plus Rita elle fait 0 fautes d'orthographe » (Benoit,
couvreur, sur le blog de Renalto). Mais trois limites reviennent partout :

- **La voix exige le réseau, chez tous ceux qui en parlent.** Vulko l'écrit
  ainsi : « Pas de génération hors-ligne : l'IA appelle un modèle distant ».
  Calyflux : « une connexion internet est nécessaire pour dicter, transcrire
  et structurer un devis ». ATTIX annonce un mode hors ligne, mais la
  transcription se fait sur son serveur : il s'agit probablement d'une file
  d'attente (déduction). Les autres ne disent rien. Opus est dans le même
  cas : son devis vit en base, donc demande du réseau (`PLAN-DEVIS.md` §3.1
  et §6).
- **Dicter ne vient pas naturellement à tout le monde.** Un couvreur, dans un
  témoignage publié par Renalto lui-même : « je fais pas encore mes devis dans
  la voiture ou sur le chantier comme tu le dis dans les pubs (rires), j'attends
  d'être posé à la maison » ; et « Au début, je n'étais pas à l'aise avec la
  voix. du coup j'écrivais ». **C'est aussi votre façon de faire** : on relève
  chez le client, on fait le devis plus tard, au calme, et il part par
  courriel (`PLAN-DEVIS.md` §10.12). Ce qui se fait sur le chantier, c'est le
  relevé ; le devis, lui, s'écrit ailleurs.
- **Ce qui a été mal entendu se propage dans tout le devis.** D'où deux bonnes
  idées. Angebotsmeister et Vulko affichent le texte reconnu, **corrigeable
  avant toute génération** (« Das haben wir gehört » : voilà ce que nous avons
  entendu). Renalto, de son côté, affiche un récapitulatif de ce qu'il a
  compris avant de rédiger.

À noter : Boby, Angebotsmeister et Obat acceptent une dictée dans une autre
langue que le français et rédigent le devis dans la langue du pays.

### 1.2 Photographier : chantier, plan, carnet, relevé en 3D

| ce qu'on photographie | qui | état réel |
|---|---|---|
| notes manuscrites, carnet de relevés | Calyflux (sur une maquette du site) ; Renalto (seulement sur ses pages commerciales, absent de son centre d'aide) | non éprouvé |
| photos du chantier | ATTIX (depuis la version 1.8.0 du 15/09/2026), Vulko (6 photos au plus, une par pièce), Donizo, Handoff (jusqu'à 25) | non éprouvé |
| plans, pour en tirer les surfaces | Handoff (formule à 899 $/mois, 1 à 2 h de calcul), Houzz (sur ordinateur seulement, « simplified floor plans and elevations only at this time » : plans et élévations simplifiés seulement, pour l'instant), Buildxact (plans de niveau seulement, ni toiture ni façades) | limité, de l'aveu des éditeurs eux-mêmes |
| relevé de la pièce en 3D (capteur LiDAR des iPhone Pro) | Handoff (Room Scan, en bêta), Houzz, Buildxact par le service RENDR, avec lequel **le particulier** peut scanner sa pièce lui-même, à distance | lu dans les documents des éditeurs, pas vu |
| **refusé** | Costructor : « Les shémas et les images ne sont pas réprises pour le moment dans les devis IA » ; Angebotsmeister : son scan lit les devis, « Kein Baustellenfoto » (pas de photo de chantier) | — |

**Ce que ça vaut : presque rien n'est mesuré.** Les deux seuls retours
concrets sont négatifs :
- « une ligne d'échafaudage que l'IA n'avait pas déduite de la photo » (Le
  Conduc à propos de Vulko — un site affilié, dont l'anecdote est
  invérifiable) ;
- « the scanning is not accurate within a couple inches up to several feet »
  (le relevé est faux de quelques centimètres jusqu'à près d'un mètre ; avis
  App Store 1★ sur Houzz, 18/05/2026).

> **Pour Opus, la photo est une PREUVE, pas une source de quantités.** C'est
> déjà la logique du cahier Visite : chaque élément proposé reste relié à sa
> preuve (photo, extrait de transcription), et seul un élément CONFIRMÉ
> alimente le devis.

### 1.3 Déposer un document : la façon la plus utile

Quatre sortes de documents, et quatre usages :

**a) Un dossier d'appel d'offres** (DPGF). Costructor (offre Business+) et
Renalto (offre PME) en recopient les lignes. Renalto ajoute une très bonne
idée : **avant** d'ouvrir le devis, un écran montre le **taux de couverture**
(combien de lignes ont un prix) et la **répartition des lignes par source de
prix**.

**b) Le devis d'un fournisseur ou d'un sous-traitant, repris avec sa marge.**
Chez HERO, on dépose le PDF du négoce avec la consigne « Übernimm die
Positionen aus dem Angebot, plus 18% Aufschlag sowie Installation und Anfahrt »
(reprends les lignes du devis, plus 18 % de marge, plus la pose et le
déplacement). Handoff compare les offres de plusieurs sous-traitants et en
recommande une, mais c'est l'artisan qui choisit.

**c) Un ancien devis de l'artisan, pour remplir sa bibliothèque de prix.**
C'est votre idée du 17/10. Qui le fait, et comment :

| outil | comment | limite connue |
|---|---|---|
| Renalto | voie recommandée : l'import d'un **PDF** ; l'IA extrait titre, unité et prix ; les ouvrages qu'elle recommande sont **cochés d'avance**, l'artisan décoche le reste | « la fenêtre de vérification ne signale pas les ouvrages déjà présents dans votre bibliothèque » : les doublons passent |
| Angebotsmeister | **photo** de 4 pages au plus, dans l'application, ou un PDF ; les lignes douteuses sont marquées « Unsicher » (incertain : confiance sous 70 %) | choisir « Importieren » sur le devis d'un **concurrent** fait entrer SES prix dans l'historique de l'artisan. Le chemin prévu (« Preise vergleichen », comparer les prix, puis « Gegenangebot erstellen », faire une contre-offre) reprend ses postes avec les prix de l'artisan : une bonne idée, à noter |
| Calyflux, Donizo | import d'anciens devis en tableur (CSV ou Excel) ou en PDF (« l'IA reconstitue les lignes », chez Calyflux) | ni l'un ni l'autre ne dit clairement que l'import remplit les prix proposés ensuite ; chez Donizo, c'est une déduction |
| Vulko | **pas d'import d'anciens devis** : un import Excel de la bibliothèque et des tarifs fournisseurs (offre PME) ; à partir de l'offre Duo, la bibliothèque se remplit des devis faits dans Vulko | — |
| Costructor | import PDF | « Les ouvrages détaillés ne seront pas repris comme des ouvrages mais comme de la fourniture » |
| ATTIX | annoncé (« Vos anciens devis lui apprennent vos postes, vos formulations et vos prix habituels ») | **pas ouvert à tous** : l'application web affiche « Bientôt disponible » |

Houzz (États-Unis) lit lui aussi un ancien devis, y compris sa **photo** (jpg,
heic — le format des photos d'iPhone —, pdf, xls…), mais pour en tirer un
**nouveau** devis : aucune source ne dit qu'il en remplit un catalogue.

**d) La demande d'un client, transformée en brouillon de devis.**
- **Jobber** : le bouton « Draft for me » (rédige-le pour moi) prépare un
  brouillon à partir de la demande reçue par son formulaire, des modèles et
  des anciens devis.
- **Angebotsmeister** : à partir d'un e-mail transféré, ou d'une demande copiée
  depuis une plateforme d'annonces (MyHammer, Kleinanzeigen).
- **HERO** : une capture d'écran de l'e-mail du client crée la fiche client et
  le projet.

C'est le « coup 1 » de `CONCURRENCE-DEVIS.md`.

### 1.4 Répondre à des questions avant que l'outil chiffre

| outil | les questions | ce qui coince |
|---|---|---|
| Costructor | 3 questions à choix multiples, avec une case « Autre réponse » : surface et hauteur sous plafond ; gamme (standard, moyenne, haut de gamme) ; rez-de-chaussée, étage avec ou sans ascenseur | l'outil génère quand même avec une réponse incomplète : l'artisan répond « 20 », sans hauteur |
| Renalto | une liste des « informations manquantes », posées une par une, avec un bouton « Passer », puis un récapitulatif « ce qu'elle a compris » | — |
| ATTIX | « Questions de cadrage » (c'est le nom de la rubrique dans son code) | « L'ia pose des questions super précises, ça me permet de rien oublier. » (App Store, 05/11/2025) |
| Buildxact | questions sur les murs, la structure, les finitions ; « Other » (autre), « Skip and generate » (passer et générer) | — |
| Handoff | — | « it is clunky and asks questions but doesn't allow to answer before it starts to create the estimate » (il pose des questions mais n'attend pas la réponse pour rédiger ; Capterra, 26/03/2025) |

**Ce que ça vaut.** C'est la seule parade à l'erreur dangereuse, celle que
`CONCURRENCE-DEVIS.md` §7.1 nomme déjà : **la quantité** (« deux jours à
deux » = 2 ? 4 ? 32 h ?). Un prix faux se voit ; une quantité fausse multiplie
le prix sans qu'on le remarque.

> **Mais aucun des outils qui rédigent ne documente les questions qui
> décident du TAUX DE TVA** (âge du logement, usage, nature des travaux, et
> pour le 10 % la qualité de celui qui commande). Le taux est posé sans elles :
> que 20 % soit juste ou faux, personne ne peut le savoir, et c'est l'artisan
> qui en répond.
> - les deux lignes visibles de la démonstration publique de Renalto (une
>   salle de bain chez un particulier) sont à 20 % ;
> - les captures de l'aide d'Obat montrent 20 % sur tout le pré-devis
>   (02/03/2026) ;
> - Batappli applique un « Taux de TVA par défaut ».
>
> Ce qui s'en approche : ATTIX affiche un rappel des trois taux (« 10 %
> rénovation d'un logement de plus de 2 ans… ») ; Donizo affiche la raison de
> chaque taux ; IArtisans pose des questions sur le logement, mais pour
> calculer une aide sur un devis déjà fait. Voir l'idée n° 4 du §5.

### 1.5 Laisser l'outil apprendre

Cinq mécanismes, du plus visible au plus opaque :

1. **Des consignes permanentes, écrites et effaçables.**
   - Renalto : « Vos autres habitudes », une règle par ligne (« Ajoute toujours
     une ligne Nettoyage et évacuation des déchets »). Une consigne dite en
     cours de conversation s'ajoute à cette liste, que l'artisan peut relire.
   - Batappli : « Je ne travaille qu'avec la marque Legrand. Rajoute toujours
     les frais d'évacuation des déchets. »
   - Handoff signale les consignes qui se contredisent.
   - HERO retient des informations sur l'entreprise d'une conversation à l'autre.
2. **Des prix corrigés, retenus pour la suite.**
   - Donizo : « Vous corrigez une fois, c'est retenu ».
   - Angebotsmeister garde le dernier prix, la moyenne, le minimum et le maximum,
     et exige la même unité (« pro qm » et « pro Stück » — au m², à la pièce —
     sont deux entrées distinctes).
   - Vulko, à partir de l'offre à 79 €/mois, apprend sur 6 mois de devis signés
     **et refusés**.
3. **Des libellés retenus** : Vulko mémorise chaque désignation réécrite par
   l'artisan, et ce réglage peut être coupé.
4. **Les lignes nouvelles proposées à la bibliothèque** : Renalto les propose
   à valider ; chez ATTIX, elles sont **cochées d'avance** (on les retire, on
   ne les ajoute pas).
5. **La confiance progressive** : Jobber ne propose le brouillon automatique
   qu'une fois que l'artisan a envoyé « at least three quotes using the Draft
   for me button » (au moins trois devis faits avec le bouton) — les
   brouillons ne comptent pas.

Et, à l'opposé, la mise en commun des données de tous les artisans :
- Donizo s'accorde un usage « perpétuel, mondial et irrévocable » des données
  agrégées et anonymisées, pour « l'entraînement de nos moteurs de
  tarification » ;
- Buildxact entraîne ses modèles « so that they can offer improved insights to
  other clients » (pour fournir de meilleures analyses aux AUTRES clients) et
  transmet ces données aux fournisseurs ;
- ATTIX entraîne ses modèles sur des données anonymisées, sauf si l'artisan
  s'y oppose ;
- d'autres le font par une clause de leurs conditions : BatiChiffrage
  (« mutualisation des données de chiffrage »), Cegid (propriété des analyses
  agrégées), Handoff (`SOURCES-DONNEES-BTP.md` §3.3).

**Renalto promet l'inverse** : « vos Données ne sont pas utilisées pour
améliorer les Données […] d'autres Utilisateurs ». C'est un choix de
confiance, et c'est le bon.

> **C'est sur ce terrain que la base « fidèle à l'artisan » se distingue :**
> la phrase gardée mot pour mot, le prix affiché avec son devis d'origine, pas
> de moyenne, une base privée, et un poste nouveau qui se PROPOSE au lieu de
> s'ajouter (`DEVIS-DU-PROPRIETAIRE.md` §5, repris par `PLAN-DEVIS.md` §10.6).
> Et la phrase d'un artisan n'est jamais redonnée à un autre
> (`DONNEES-DES-ARTISANS.md` §0).

### 1.6 Faire relire

| outil | ce qu'il relit | ce qu'il fait |
|---|---|---|
| **Buildxact — Estimate Reviewer** (option à 149 $/mois) | le devis, plus le contexte : adresse, surfaces, risques du site | une **liste à cocher** : coûts oubliés (déchets, sécurité, matériaux, main-d'œuvre), règles possiblement applicables, quantités à vérifier. Chaque point se tranche à la main (« Complete »), et l'outil **ne modifie rien** : « designed to help you review your estimate, not replace your judgement » (conçu pour vous aider à relire, pas pour remplacer votre jugement) |
| **Boby — Analyse IA du devis** (dans les trois offres, depuis novembre 2023) | le devis | « corrige également les fautes d'orthographe et détecte les erreurs ou oublis », avec des recommandations « pour augmenter vos chances de signature » |
| **IArtisans (CAPEB)** | la PHOTO ou le PDF d'un devis fait ailleurs | un avis rédigé sur la conformité aux aides (CEE, MaPrimeRénov', TVA réduite) |
| **Donizo** | le devis | repère les matériaux oubliés (colle, mortier de joint) ; on les ajoute d'un clic (vidéo du 15/10/2026) |
| **Houzz** | le devis, **sur demande de l'artisan**, qui tape par exemple « Review and identify duplicate items » | repère les doublons, ou suggère « anything missing » (ce qui manque d'habitude) : ce sont des consignes à écrire, pas une relecture automatique |
| **Vulko** | le devis qui vient d'être produit | depuis le 04/10/2026 : « l'IA dit ce qu'elle a supposé et repère les prix qu'elle a estimés » |

**Ce que ça vaut.** C'est la forme la moins risquée : elle ne fixe aucun prix.
Elle répond à votre demande d'un correcteur (`DEVIS-DU-PROPRIETAIRE.md` §6.1).
Mais attention au calendrier : la relecture **par l'agent** est la couche 2 du
correcteur, et elle vient **après** le module devis (`PLAN-DEVIS.md` §10.6) ;
ce qui se fait sans IA, en revanche, arrive avec le module (idée n° 2).

---

## §2. Outil par outil

### Le tableau d'ensemble

| outil | pays | l'IA à partir de | d'où viennent les prix | la ligne dit d'où vient son prix ? | avis indépendants sur l'IA |
|---|---|---|---|---|---|
| Costructor | France | 15 €/mois (2 devis IA par mois) | non documenté | non | 2 tests de rédactions spécialisées |
| Renalto | France | 25 €/mois (30 par mois) | bibliothèque de l'artisan → bibliothèque Renalto → estimation marquée « Prix non vérifié » | en partie (icône visible seulement au survol de la souris) | une vingtaine d'avis sur les magasins d'applications |
| ATTIX | France | 59 €/mois (crédits) | catalogue de l'artisan → « référentiel » ATTIX d'origine non dite | oui (« De la base » / « Nouveau ») | quelques-uns, dont 7 publiés la semaine du lancement |
| Batappli | France | 39 €/mois (8 par mois) | favoris de l'artisan → « prix moyens » | non | aucun (lancé le 06/10/2026) |
| Calyflux | France | gratuit (3 par mois) | catalogue de l'artisan, sinon case vide | par groupe de lignes | aucun |
| Boby (Cegid) | France | 49,99 €/mois | « prix du marché », sans source | non documenté | aucun sur l'usage |
| Obat | France | option à 29 €/mois (2 devis gratuits par mois) | bibliothèque si l'interrupteur est activé, sinon « données du marché » | une icône dont le sens n'est pas confirmé | quelques-uns, dont « à vérifier point par point » |
| Donizo | France (société estonienne) | 39 €/mois | cinq versions qui se contredisent | non | 2 avis écrits |
| Vulko | France | 19 €/mois (5 par mois) | bibliothèque → fourchettes nationales « 2026 » → historique (à partir de 79 €) | prix estimés repérés depuis le 04/10/2026 | seulement un site affilié |
| IArtisans (CAPEB) | France | 33,28 €/mois au mois, ou 29,95 €/mois en annuel, pour un adhérent | ne chiffre pas, contrôle | — | aucun |
| HERO Command | Allemagne | compris dans HERO OS (119 à 135 €/mois) | catalogue de l'artisan, ou devis fournisseur + sa marge | non documenté | aucun (outil en service depuis 18 jours) |
| Angebotsmeister | Allemagne | gratuit (1 par mois) | historique → calcul → fourchette « estimée » → case vide | **oui, sur chaque ligne** | 1 avis écrit (1★) |
| Handoff | États-Unis | 149 $/mois | catalogue de l'artisan → fournisseurs → prix proposé par l'IA en dernier recours | en partie | le plus d'avis écrits |
| Jobber | Canada | non revérifié (offre Connect et au-delà selon la presse de 2025) | jamais dit | non | aucun sur le brouillon |
| Houzz Pro | États-Unis | 99 à 399 $/mois | « AI data from Gemini » + code postal | non | des témoignages choisis par l'éditeur |
| Buildxact Blu | Australie | options de 99 à 149 $/mois | catalogues fournisseurs, catalogue générique, « données locales » | les articles génériques n'ont pas d'icône | aucun avis ne nomme son IA |

### Costructor (France, Nantes) — le plus répandu, le plus flou sur ses prix

- **Taille et prix.** 140 000 ou 180 000 utilisateurs selon la page. La note
  annoncée, 4,9/5 sur plus de 650 avis Google, ne peut pas être lue. Sur
  Trustpilot : 4,1/5 sur 5 avis, aucun sur l'IA. Pas d'application à
  installer depuis un magasin : c'est un site à ajouter à l'écran d'accueil.
  Devis par IA : aucun en gratuit, 2 par mois en Pro (15 €, ou 12,50 € en
  annuel), 10 en Business+ (30 €), illimités en Premium (60 €). Costructor
  figure parmi les lauréats du guide IA pour artisans du ministère de
  l'Économie (septembre 2026).
- **Parcours.** Bouton « Devis par IA » → une fenêtre « Agent IA » (en bêta) →
  texte, micro ou fichier joint (dossier d'appel d'offres, ancien devis) →
  **trois questions de cadrage** → « Voir le devis » dans l'éditeur habituel.
  Le devis est rangé en sections. Ses ouvrages détaillés séparent la
  fourniture de la main-d'œuvre (heures × taux), avec prix d'achat et marge
  visibles. L'artisan corrige à la main ou dans la conversation (« Ajoute une
  ligne de peinture à 35 €/m² »). Signature par code envoyé par e-mail, puis
  par SMS.
- **D'où viennent les prix.** « L'IA s'appuie sur les prix du BTP à jour » et
  « Prix actualisés par l'IA, en phase avec les prix fournisseurs », sans autre
  précision. Un test affilié parle de Batiprix, une base vendue à part
  (279 € HT le lot Gros œuvre et 789 € HT le pack tous corps d'état selon la
  boutique relevée le 17/10, `SOURCES-DONNEES-BTP.md` §3.1 ; un article d'aide
  Batiprix plus ancien disait « à partir de 239 € HT / an »), et de CostLib,
  une bibliothèque collaborative. Le site cite aussi « +100M d'articles » et
  100 catalogues fournisseurs, sans dire lesquels nourrissent l'IA. Sur la
  capture officielle, les prix correspondent à une marge de 50 % (déduction).
- **Ce que l'artisan relit.** Tous les prix ; la TVA (la capture affiche
  « Auc… ») ; le client et le chantier, **laissés vides** après la
  génération : « Pensez a bien renseigner les informations du clients, le
  chantier… ».
- **Plaît** : « L'IA pose des questions auxquelles on n'avait pas pensé. »
  (Batemark, testeur affilié qui avait reçu un accès offert)
- **Coince** : « Nous avons systématiquement retouché les prix unitaires et
  ajusté les marges avant envoi. » (Le Blog du Dirigeant) ; « le marketing met
  l'IA en avant, la grille la rationne. » (Batemark). Et ses conditions
  interdisent d'ouvrir un compte « en vue d'élaborer un produit ou service
  concurrent ».
- **Sources** : costructor.co/devis-ia ; costructor.co/tarifs ;
  support.costructor.co (article « comment créer un devis IA », mis à jour le
  06/08/2026) ; leblogdudirigeant.com/test-du-logiciel-costructor ;
  batemark.com.

### Renalto, avec son assistante « Rita » (France, Montreuil) — le plus abouti sur l'apprentissage

- **Taille et prix.** Les chiffres se contredisent : 1 800, 10 000 ou 30 000
  utilisateurs. App Store : 3,8/5 sur 9 notes ; Google Play : 5,0 sur 9 ;
  Trustpilot : 3 avis. Offres PRO 25 €/mois (20 € en annuel, 30 devis IA),
  PRO+ 30 €, PME 49 € (100 devis IA, lecture des dossiers d'appel d'offres).
  Un essai sans inscription existe (app.renalto.com/essai-devis, 800
  caractères).
- **Parcours.** L'artisan règle Rita une fois : TVA par défaut, fourniture et
  pose séparées ou non, lignes rangées par pièce ou par corps de métier,
  consignes « toujours… ». Il remplit sa bibliothèque, de préférence en
  important ses anciens devis PDF. Puis, pour chaque devis : un projet → la
  voix, un texte ou un document → les **questions une par une**, avec un
  bouton « Passer » → le **récapitulatif « ce qu'elle a compris »** → le devis
  en une vingtaine de secondes. Il corrige en demandant une nouvelle version à
  l'IA, directement dans l'éditeur, ou en remplaçant une ligne par un ouvrage
  de sa bibliothèque. Puis PDF ; la signature en ligne est encore en bêta au
  07/10/2026. Tout cela marche aussi par WhatsApp. Chaque version du devis est
  gardée, étiquetée « IA » ou « Manuelle ».
- **D'où viennent les prix.** L'ordre est écrit dans l'aide (11/10/2026) :
  1. la bibliothèque de l'artisan ;
  2. la bibliothèque Renalto (« plusieurs milliers d'ouvrages ») ;
  3. sinon, une estimation de Rita « à partir des données disponibles sur
     internet et fournies par Renalto », marquée « Prix non vérifié ».

  Une ligne venue d'une bibliothèque porte une icône 🔗 qui n'apparaît
  **qu'au survol de la souris**, et une ligne estimée n'a aucune icône. On ne
  sait pas comment l'artisan les repère sur un téléphone.
- **Ce que l'artisan relit.** Les lignes « Prix non vérifié », les quantités,
  la TVA (« vérifiez toujours que le taux sélectionné correspond à la
  réglementation en vigueur »), les mentions légales.
- **Plaît** : « À la première utilisation, j'ai mis 3 minutes pour faire un
  devis que j'avais fait la veille en 1 heure » (Olivier, artisan, témoignage
  publié par Renalto).
- **Coince** :
  - la FAQ commerciale répond « Le devis généré est-il conforme légalement ?
    Oui. […] Vous n'avez rien à vérifier », alors que les conditions
    d'utilisation obligent l'artisan à tout relire ;
  - « Pas du tout pratique sur téléphone ca zoom impossible de revenir a une
    taille ok » (App Store, 1★) ;
  - une version « Manuelle » n'apparaît dans l'historique que si l'artisan
    enregistre : les corrections humaines ne sont pas toutes tracées ;
  - les conditions d'utilisation accordent un droit d'utilisation « illimité
    dans le temps » sur ce qu'on y dépose.
- **Sources** : renalto.fr ; aide.renalto.fr (article « D'où proviennent les
  prix… ») ; renalto.fr/cgu ; apps.apple.com/fr/app/renalto/id6747433792.

### ATTIX (France, Montargis) — le prix calculé par une formule, et la ligne qui dit d'où il vient

- **Taille et prix.** App Store : 4,5/5 sur 40 notes ; sept des neuf avis 5★
  écrits datent de la semaine du lancement (novembre 2025). Google Play : 4,6
  sur 39. « +6 000 artisans » annoncés. Offre Pro à 59 € HT/mois, avec une
  jauge de crédits d'IA. Trois grilles de prix différentes circulaient le
  même jour.
- **Parcours.** L'artisan règle d'abord ses taux et marges (« Ce sont bien mes
  taux »). Puis « Décrivez le chantier » (voix, texte, photos, PDF) → questions
  de cadrage → lots, prestations, fournitures. Un **badge sur chaque ligne** :
  « De la base », « Base modifiée », « Nouveau — Créée pour ce devis ». Un
  encadré : « Voici d'où viennent ces prix. Modifiez ce qui ne vous va pas. »
  Un bouton fait parcourir les lignes touchées par l'IA (« Ligne suivante »).
  Enfin : « Générer verrouille les prix du jour et produit le PDF. Rien n'est
  envoyé au client : vous restez maître de l'envoi. » Signature par Yousign.
- **D'où viennent les prix.** Le catalogue de l'artisan, sinon le
  « référentiel » d'ATTIX, dont l'origine n'est dite nulle part. Le prix
  d'une ligne sort d'une **formule** : temps × taux × marge, plus fournitures
  × perte × marge. La formule marche aussi à l'envers, si bien qu'on ne sait
  pas si l'IA fournit le temps ou le prix. Des gardes bloquent la génération :
  une fourniture sans marge ni prix de vente (« ni marge ni prix de vente :
  renseignez l'un des deux »), une vente sous le prix d'achat, une quantité
  négative, une désignation vide. Mais le coût d'achat d'une fourniture peut
  être **estimé** ; l'écran affiche alors ses hypothèses.
- **Ce que l'artisan relit.** Les quantités et les temps (aucune garde ne les
  contrôle), et les lignes « Nouveau ».
- **Corrigé par la vérification.** L'import des anciens devis n'est **pas
  ouvert à tous** (« Bientôt disponible »). La case « Ajouter à ma
  bibliothèque » est **cochée d'avance**.
- **Plaît** : « L'ia pose des questions super précises, ça me permet de rien
  oublier. » (App Store, 05/11/2025)
- **Coince** :
  - le site promet « Vérifié DTU, quel que soit votre métier. ATTIX signale les
    écarts », alors que les conditions d'utilisation qualifient les DTU
    d'« indicatives » et que le mot « DTU » n'apparaît nulle part dans le code
    de l'application web ;
  - « Des concurrents comme Obat le font déjà et en beaucoup mieux. » (App
    Store, 1★) ;
  - « je ne réfléchis plus je fais mes devis directement » (Google Play, 5★) :
    le produit pousse à moins relire.
- **Sources** : apps.apple.com/fr/app/id6748462097 ; attix.io/faq ;
  attix.io/cgu (art. 7, 8, 17) ; le code public de app.attix.io, lu le 17/10.

### Batappli.ia (France, Systemlog) — la meilleure interface, des captures qui se trahissent

- **Taille et prix.** 5 000 clients ; 9 000 ou 13 000 utilisateurs selon la
  page. L'IA a été lancée le 06/10/2026, pour les nouveaux clients seulement,
  et n'a encore aucun avis. 39 € HT/mois (8 devis IA), 79 € (16). Un lot de
  la base BatiChiffrage est inclus.
- **Parcours.** L'artisan règle une fois ses consignes : celles de
  l'entreprise, les siennes, un « Taux de TVA par défaut ». Dans un devis, il
  appuie sur « Assistant IA » et écrit une phrase. Réponse : « J'ai trouvé N
  article(s). Sélectionnez les lignes à insérer dans le document. » Suit un
  **tableau à cocher**, avec prix et quantité modifiables sur place, un total
  de la sélection qui se met à jour, et les options à part. « Insérer » ajoute
  les lignes cochées, chacune marquée d'une icône IA.
- **D'où viennent les prix.** D'abord les favoris de l'artisan, puis des
  « prix moyens » décrits de cinq façons différentes (par métier et par
  région, « chez les artisans Batappli », « en lien avec les DTU »…). Certaines
  références semblent fabriquées (« MAÇON-001 ») et les prix sont ronds.
- **Coince — sur les propres captures de l'éditeur.**
  - Les lignes produites par l'IA ont un « Prix de revient 0,00 € » et un
    « Coefficient 0,000 », si bien que la marge brute affichée égale le total
    HT, sur les trois exemples publiés.
  - Une même ligne dit « Boîte de dérivation en saillie », et son commentaire
    « pour encastrement des appareillages ».
  - La TVA est à 20 % chez un particulier, sans que l'âge du logement soit
    connu.
  - Une option est comptée dans le total.
- **Plaît** : « Rien n'entre dans le devis sans que vous le cochiez. » (c'est
  la promesse de l'éditeur, pas un avis)
- **Sources** : batappli.fr/ia-devis-btp ; batappli.fr/tarifs ; les captures
  hébergées sur cdn.prod.website-files.com.

### Calyflux, ex-Devizo (France) — l'outil le plus proche d'Opus par le concept, et le plus honnête sur les prix

- **Taille et prix.** Une seule personne, aucun avis, aucune application iOS
  ni Android (c'est un site). Gratuit (3 devis IA par mois, 20 messages par
  devis, 5 minutes de dictée), puis 19 € et 39 €. Ses conditions de vente
  réservent le service aux professionnels. Construit avec les mêmes briques
  qu'Opus pour la base (Supabase) ; l'IA est Claude pour structurer le devis, et GPT-4o mini
  Transcribe pour la voix.
- **Parcours.** Une conversation (photo, micro, texte) → l'IA pose les
  questions qui manquent → des groupes de postes, avec sous chaque groupe la
  mention « Prix repris de votre catalogue » → l'artisan accepte un groupe ou
  demande une correction → un devis ordinaire, modifiable ligne par ligne.
  Les anciens devis s'importent en tableur (CSV ou Excel) ou en PDF ; rien
  ne dit que cet import remplit le catalogue ou les prix proposés.
- **D'où viennent les prix.** Du catalogue de l'artisan et de ses réglages
  (taux horaire, marge, nombre de compagnons), ou d'un prix dicté. Sinon, la
  case reste vide : « Elle n'invente pas de prix si tu ne les as pas dictés —
  elle laisse le champ vide ». Aucune bibliothèque fournie d'avance.
- **Coince.**
  - Deux discours sur la TVA : « selon le type de travaux configuré dans votre
    profil », appliqué à toutes les lignes, contre « les taux corrects selon la
    nature de la prestation ».
  - Deux discours sur les relances : « Rien ne part sans votre accord », contre
    « laisser la séquence tourner seule ».
  - La société citée sur une fiche publique, ADE TECH CONSULTING, est en
    liquidation ; l'exploitant réel est très probablement la micro-entreprise
    des mentions légales.
- **Sources** : calyflux.fr ; calyflux.fr/blog/devis-vocal-artisan-ia ;
  calyflux.fr/confidentialite ; calyflux.fr/cgv.

### Cegid Boby (France) — le pionnier, et l'origine des prix la plus obscure

- **Taille et prix.** 14,99 / 29,99 / 49,99 €. Le devis par IA (« IA
  Copilote ») et WhatsApp ne sont que dans l'offre Pro — l'offre nommée
  « Copilot » ne contient pas l'IA Copilote. L'« Analyse IA du devis », elle,
  est dans les trois offres. Trustpilot : 4,4/5 sur 98 avis, mais aucun ne
  décrit l'usage de l'IA. Pas d'application : WhatsApp en tient lieu.
- **Parcours.** Une phrase (« Crée-moi un devis pour une terrasse bois en
  bambou de 40m2 et propose-moi un chiffrage adapté »), dans 15 langues, par
  WhatsApp ou sur le site → un devis « aux prix du marché » → des ajustements à
  la voix (« augmenter les prix, changer les quantités, ajouter un acompte ») →
  un e-mail rédigé, soumis à l'artisan, puis envoyé.
- **D'où viennent les prix.** « aux prix du marché » ; selon le communiqué
  Cegid du 29/02/2024, l'IA fonctionne « en comparant les offres de la
  concurrence ». Boby écrit aussi que « l'IA est capable de vous générer une
  bibliothèque de prix sur mesure » (`SOURCES-DONNEES-BTP.md` §3.1). Aucune
  source n'est nommée.
- **Coince.**
  - « Boby se veut ultra moderne et intuitif avec assistant virtuel et
    intelligence artificielle […] avons nous besoin de cela ? […] mais les
    basiques ne sont pas là » (Trustpilot, 3★) ;
  - la même page promet « Elle vous demandera toujours de valider ses
    propositions » et dit aussi « elle se charge de le faire à votre place et
    de l'envoyer par e-mail à votre client » ;
  - son blog promettait des devis « 100% conformes (taux de TVA adapté, et
    mentions légales indiquées) » (13/09/2024).
- **À retenir** : la relecture par l'IA offerte dès l'offre la moins chère.
- **Sources** : boby.net/lassistant-intelligent ; app.boby.net/tarifs-boby ;
  le communiqué Cegid du 29/02/2024 ; fr.trustpilot.com/review/boby.net.

### Obat (France) — la référence du marché, et une démonstration qui enseigne beaucoup

- **Taille et prix.** De 25 à 129 €/mois. Le devis vocal : 2 par mois compris,
  illimité avec l'option à 29 € HT/mois par utilisateur. Notes : App Store
  3,3/5 ; Google Play 4,2 ; Trustpilot 4,5 sur 701 avis ; Capterra 4,9, avec
  beaucoup d'avis sollicités par l'éditeur. Un agent, « Za », est en bêta.
- **Parcours.** « Devis vocal » → Parler, Écrire ou Importer (photo, PDF) → un
  interrupteur « Bibliothèque Obat ». Activé, Obat chiffre avec la
  bibliothèque de l'artisan ; désactivé, « le chiffrage de votre devis sera
  réalisé grâce à l'IA ». Vient un pré-devis en sections, avec des
  « Suggestions IA » à cliquer (VMC, sèche-serviettes…), puis un brouillon
  sans client, marqué « Vocal », dans l'éditeur habituel.
- **D'où viennent les prix.** De la bibliothèque, ou des « données actuelles du
  marché », sans source.
- **La démonstration officielle a été faite interrupteur ACTIVÉ**, donc avec la
  bibliothèque de l'artisan, et à partir d'une description **tapée**, pas
  dictée. Ses captures montrent pourtant :
  - la douche à l'italienne comptée deux fois (2 300 €, puis 1 400 € + 8 h ×
    50 €) ;
  - le meuble vasque compté deux fois ;
  - un carrelage tapé « 30×45 » devenu « carrelage 40/30 » ;
  - une ligne « Sol séjour » dans une salle de bain ;
  - une ligne « Finitions modernes — 350 € » tirée d'un simple adjectif ;
  - une TVA à 20 % sur toutes les lignes du pré-devis. Selon la transcription
    automatique du tutoriel vidéo, que nous n'avons pas pu relire, la TVA est
    ensuite repassée à 10 % à la main.
- **La leçon** : ces erreurs ne viennent probablement pas d'un prix inventé,
  mais d'un **mauvais choix d'ouvrage dans la bibliothèque** — « probablement »,
  parce qu'Obat ne confirme pas le sens de l'icône qui marque une ligne de
  bibliothèque. Avoir les prix de l'artisan ne suffit pas : il faut vérifier
  que l'ouvrage retenu correspond à ce qui a été dit.
- **Plaît** : « Je viens d'essayer pour un petit devis la rédaction via le
  devis vocal et Ouah bluffé » (Trustpilot, 5★, 23/02/2026).
- **Coince** :
  - « Les devis à la voix sont à vérifier point par point et à modifier donc
    aucun gain de temps par rapport à la rédaction "traditionnelle". »
    (Trustpilot, 1★, 28/02/2025) ;
  - « depuis qu'il puisse dans la base de données il y a toujours une grosse
    différence entre la demande et le devient lui-même » (Capterra, 18/09/2024).
- **Bon modèle de permissions** : Za demande confirmation par défaut avant
  toute création ou modification, et l'action directe s'active compétence par
  compétence.
- **Sources** : aide.obat.fr (article « Dictez vos devis… » et ses captures du
  02/03/2026) ; obat.fr/tarifs ; aide.obat.fr (article sur Za) ;
  fr.trustpilot.com/reviews/67c14e9f1240608c0d856117.

### Donizo (France, société estonienne) — cinq histoires pour un même prix

- **Taille et prix.** Fondé par un ancien plombier. 39 € HT/mois. App Store :
  4,86 sur 7 notes. Son annuaire compte 51 artisans.
- **Parcours.** On dicte, on photographie ou on part d'un modèle → des lignes,
  avec un taux de TVA par ligne et sa raison affichée → depuis octobre 2026,
  une revue des matériaux oubliés → on corrige (« Vous corrigez une fois,
  c'est retenu ») → envoi d'un lien par WhatsApp, e-mail ou SMS, signature
  simple, acompte en ligne.
- **D'où viennent les prix — cinq versions :**
  1. « L'IA invente-t-elle les prix ? Non… les prix restent les vôtres » (site) ;
  2. « 420 000 références matériaux » (App Store) ;
  3. « supplier-independent catalogue of 325,000+ materials and labour items »
     (un catalogue indépendant des fournisseurs ; fiche Capterra) ;
  4. « les catalogues fournisseurs sont intégrés » (pages métiers) ;
  5. « des intelligences artificielles qui trouvent les produits demandés, au
     juste prix » (Nice-Matin).
- **Coince.**
  - La page publique d'un artisan, alimentée par ses devis, affichait le
    17/10 l'adresse complète d'un client et des fourchettes de prix à ±5 %
    autour du montant réel.
  - La page TVA prépare encore « l'attestation simplifiée ». Or, depuis le
    16/02/2025, c'est le client qui certifie, sur le devis ou la facture
    (`PLAN-DEVIS.md` §10.3) ; LégiFiscal date la suppression de l'attestation
    du 03/03/2025, et cet écart de date reste à recouper sur Légifrance.
- **Sources** : donizo.com/fr/fonctionnalites/devis-ia ; donizo.com/fr/privacy ;
  donizo.com/fr/terms ; donizo.com/fr/artisan/aarts-plomberie.

### Vulko (France, Antibes) — honnête sur le réseau, et des prix estimés repérés après coup

- **Taille et prix.** Société créée le 17/06/2026. 1 note sur l'App Store,
  10+ téléchargements sur Android, aucun avis Trustpilot. De 19 € (5 devis IA
  par mois) à 299 €. L'inscription part du SIRET, qui remplit la raison
  sociale, le code d'activité (NAF) et l'adresse. L'IA est Claude Sonnet pour le devis et
  Claude Haiku pour les suggestions de prix ; Mistral Voxtral et Groq pour la
  voix.
- **Parcours.** Trois onglets : « Décrire le chantier », « Photo du chantier »,
  « Saisie libre — Sans IA » → le texte transcrit, corrigeable → un brouillon
  avec lots, marge et TVA par ligne → depuis le 04/10/2026, « l'IA dit ce
  qu'elle a supposé et repère les prix qu'elle a estimés » → les mentions
  manquantes sont signalées avant l'envoi (signalées, pas bloquées).
- **D'où viennent les prix.**
  1. La bibliothèque de l'artisan.
  2. Sinon, des « fourchettes de prix de référence du marché 2026 », nationales,
     qui « ne sont pas actualisées automatiquement », et dont l'origine n'est
     pas publiée.
  3. À partir de 79 €, l'historique de l'artisan, et une suggestion de prix par
     ligne avec un niveau de confiance et une explication.
- **Honnête** : « Pas de génération hors-ligne : l'IA appelle un modèle
  distant ». À partir de 79 €, une saisie manuelle hors ligne existe.
- **Coince.**
  - Jusqu'en octobre 2026, une génération annulée, refaite ou coupée par la
    mise en veille du téléphone consommait un devis IA.
  - La référence est dite « nationale » sur une page et adaptée « selon la
    région » sur une autre.
- **Sources** : vulko.fr/fonctionnalites/devis-ia ; vulko.fr/changelog ;
  vulko.fr/fonctionnalites/smart-pricing ; leconduc.fr (site affilié).

### IArtisans by CAPEB (France) — un contrôle, pas une rédaction

- **Prix.** Pour un adhérent CAPEB : 33,28 € HT au mois, ou 359,40 € HT par
  an (29,95 €/mois). Le moteur est celui de La Bonne Réponse. IArtisans **ne
  rédige pas** de devis (le moteur savait le faire dans une démonstration de
  2024, mais la version CAPEB n'a aucun bouton pour cela).
- **Parcours.** « Contrôle devis » → l'artisan dépose un fichier (jpg, png,
  pdf, xls, txt ; 5 fichiers et 20 Mo au plus) → l'outil rend un avis rédigé.
  Pour calculer une aide, il pose d'abord cinq questions : nature des travaux,
  équipement, énergie actuelle, logement, localisation.
- **Coince.**
  - Relire la photo d'un devis tapé ailleurs, c'est une double saisie.
  - Les conditions d'utilisation (art. 6.1) demandent de ne pas transmettre de
    données personnelles ou financières… alors qu'un devis en contient.
  - L'article 12 précise : « Aucune des réponses ne saurait être légalement
    recevable devant un tribunal, une administration… ».
  - L'éditeur déclare désormais 98 à 99 % de bonnes réponses, contre « un peu
    moins de 90 % » en juin 2025 (Batiweb, 27/04/2026). Ces chiffres portent
    sur La Bonne Réponse en général, la méthode n'est pas décrite, et ils ne
    disent rien d'IArtisans en particulier.
- **Sources** : capeb.fr/partenaires-commerciaux/iartisans ;
  la-bonne-reponse.pro/iartisans-by-capeb (conditions d'utilisation) ;
  batiweb.com.

### HERO Command (Allemagne) — l'IA qui assemble sans chiffrer

- **Taille et prix.** Compris dans HERO OS (119 à 135 €/mois). En service
  depuis le 29/09/2026, et documenté sur le site allemand seulement. HERO
  revendique 41 000 utilisateurs, tous produits confondus.
- **Parcours.** « sag was zu tun ist » (dis ce qu'il y a à faire) → une
  phrase, un fichier (métré, descriptif), ou le devis d'un fournisseur avec
  une marge à appliquer → un brouillon rangé dans le bon projet, annoncé
  « bereit zum Prüfen » (prêt à vérifier) → corrections en conversant →
  « Freigeben » (valider). L'historique des conversations est conservé.
- **D'où viennent les prix.** Du catalogue de l'artisan, alimenté par les
  catalogues des grossistes (formats d'échange allemands Datanorm et IDS Connect) : « Was dort nicht
  hinterlegt ist, ergänzt HERO Command nicht von selbst » (ce qui n'y figure
  pas, Command ne l'ajoute pas de lui-même). Mais Command peut aussi écrire
  dans ce catalogue, prix compris, si on le lui demande.
- **La règle affichée** : « Du sagst. Du prüfst. Du gibst frei. » (tu dis, tu
  vérifies, tu valides)
- **Coince.**
  - La validation peut glisser dans la conversation (« Angebot freigegeben » ;
    pendant le webinaire de lancement : faire envoyer le devis « wenn alles
    passt », quand tout va bien).
  - L'éditeur avoue lui-même : « Typische Fehlerquellen sind veraltete
    Katalogpreise, fehlende gewerkespezifische Positionen und Mengen, die aus
    einer zu knappen Beschreibung falsch abgeleitet wurden » (les erreurs
    typiques : des prix de catalogue périmés, des postes propres au métier qui
    manquent, et des quantités mal déduites d'une description trop courte).
  - Tous les salariés ont accès à Command par défaut.
- **Sources** : hero-software.de/ai/command ; presse.hero-software.de/hero-command ;
  handwerksblatt.de (01/08/2026).

### Angebotsmeister (Allemagne) — la meilleure idée trouvée : chaque ligne dit d'où vient son prix

- **Taille et prix.** Gratuit (1 devis IA par mois) jusqu'à 89 €/mois.
  « 1+ téléchargements » sur Android ; un seul avis écrit, à 1★.
- **Parcours.** L'artisan dicte (15 langues, devis en allemand) →
  **« Das haben wir gehört »** : le texte reconnu, corrigé avant toute
  génération → des postes rédigés, avec quantités et unités. Les postes
  habituels que l'artisan n'a pas dits sont ajoutés et marqués « nicht gesagt,
  üblich: ergänzt » (pas dit, ajouté par habitude). Les quantités estimées
  sont marquées « Menge geschätzt – bitte prüfen » (quantité estimée, à
  vérifier), dans une note interne que le client ne voit pas. **L'origine du
  prix est affichée sur chaque ligne.** L'envoi est **bloqué** tant qu'un
  poste obligatoire n'a pas de prix.
- **D'où viennent les prix.** Quatre étiquettes possibles :
  - « deins » (le tien) : l'historique de l'artisan ;
  - « berechnet » (calculé) : temps × taux + matériaux ;
  - « geschätzt » (estimé) : une fourchette « aus üblichen Marktspannen »
    (d'après les écarts de prix habituels du marché), dont l'origine n'est pas
    publiée ;
  - une **case vide** : depuis le 22/09/2026, « Lieber leer als falsch »
    (plutôt vide que faux).

  L'éditeur ne dit pas en toutes lettres que le modèle ne fixe jamais le
  prix : c'est une déduction.
- **Autres idées** : un e-mail de client transféré devient un brouillon ;
  l'artisan peut scanner ses anciens devis ; face au devis d'un concurrent,
  « comparer les prix » puis « faire une contre-offre » reprend ses postes avec
  les prix de l'artisan ; un bouton « Stimmt was nicht? » (quelque chose ne va
  pas ?) range le défaut signalé par catégorie : prix, poste manquant, poste en
  trop, quantité, métier.
- **Coince.**
  - Le journal des nouveautés avoue qu'avant septembre 2026 : la marge était
    comptée deux fois sur la main-d'œuvre, des prix manifestement faux étaient
    affichés, le prix dicté par l'artisan était jeté, et les hypothèses de
    quantité étaient visibles du client.
  - Le seul avis écrit, de juillet (version 1.0.1) : « Unbrauchbar — Hat keine
    Ahnung vom Gewerbe, baut Fehler ein » (inutilisable, ne connaît rien au
    métier, ajoute des erreurs).
  - La démonstration allemande compte la surface des murs à 25 m², c'est-à-dire
    la surface au sol, alors que la démonstration en turc en déduit 62,50 m².
- **Données** : la page d'accueil dit que la voix et les textes sont traités
  par des fournisseurs d'IA « aux États-Unis » ; la politique de
  confidentialité les nomme (OpenAI pour la voix, Anthropic pour le texte).
  Les relances préparées par l'application portent une mention d'IA ; les
  devis envoyés par l'artisan, non.
- **Sources** : angebots-meister.de ; angebots-meister.de/datenschutz ;
  angebots-meister.de/changelog ;
  angebots-meister.de/docs/so-gehts/angebot-per-sprache ;
  angebots-meister.de/docs/so-gehts/scan ; ki-syndikat.de/tools/angebotsmeister.

### Handoff (États-Unis) — le plus de plaintes, parce que le plus d'usage

- **Taille et prix.** De 149 à 899 $/mois. App Store : 4,8 sur environ 1 900
  notes. Capterra : 4,5 sur 42 avis, dont 40 sollicités contre une petite
  récompense. États-Unis seulement.
- **Parcours.** L'artisan indique le lieu du chantier (code postal) → texte,
  voix, photos ou plans → l'outil peut poser des questions → un devis rangé
  par pièce, groupe et ligne. Il corrige par la conversation ou case par case.
  Chaque version produite par l'IA reste un point de retour possible. Pour un
  métré sur plan, Handoff rend aussi un **rapport des hypothèses, des
  informations manquantes et des conflits entre plans**.
- **D'où viennent les prix.** « Your Custom Catalog → Supplier catalogs (if
  enabled) → AI fallback pricing » : le catalogue de l'artisan, puis les
  catalogues des fournisseurs s'ils sont activés (Home Depot, prix du magasin
  le plus proche, actualisés chaque jour), et en dernier recours un prix
  proposé par l'IA.
- **À retenir** : « Read the flagged assumptions first » (lisez d'abord les
  hypothèses signalées) et « Five minutes on the ten most expensive items
  catches more than an hour of re-reading everything » (cinq minutes sur les
  dix lignes les plus chères en attrapent plus qu'une heure à tout relire ;
  billet du 25/07/2026).
- **À ne pas copier** : Handoff invite les **particuliers** à se servir de ses
  chiffres contre les artisans (« Share it with remodelers bidding on your job
  and ask them to explain any cost variance versus Handoff's numbers » :
  montrez-le aux artisans qui chiffrent votre chantier et demandez-leur
  d'expliquer tout écart avec les chiffres de Handoff ; Y Combinator,
  19/09/2025). Voir le §6.
- **Coince** : les plaintes sont citées au §3. En septembre 2026, l'éditeur
  corrige lui-même : « Fixed estimate pricing stability » (stabilité des prix
  des devis corrigée).
- **Sources** : help.handoff.ai (article « Catalogs ») ; handoff.featurebase.app ;
  le flux public des avis App Store ; capterra.com/p/10026318/Handoff ;
  ycombinator.com (page de lancement du 19/09/2025).

### Jobber (Canada) — partir de la demande, et gagner la confiance petit à petit

- **Ce qu'il fait.** Le bouton « Draft for me » (sur le site) rédige un
  brouillon à partir de la demande reçue, des modèles et des anciens devis.
  Le mode automatique n'est proposé qu'après **3 devis envoyés** par
  l'artisan. Une **alerte** prévient quand un brouillon automatique dépasse la
  valeur moyenne des devis. Sur téléphone, la voix crée et modifie un devis.
- **D'où viennent les prix.** Jamais dit.
- **Ce que l'artisan relit.** La demande du client reste affichée à côté du
  brouillon pendant la relecture.
- **Coince** :
  - la voix agit sans confirmation générale : « it marked the invoice paid and
    sent a receipt, when this wasn't true » (elle a marqué la facture payée et
    envoyé un reçu, alors que c'était faux ; Google Play, 1★, 14/07/2026) ;
  - « The AI is nice but in 2026 99% of the estimate apps has that option
    included for a lot cheaper. » (l'IA est bien, mais en 2026 presque toutes
    les applications de devis l'ont, pour bien moins cher ; App Store, 1★)
- **Sources** : help.getjobber.com/en/articles/automations ;
  help.getjobber.com/en/articles/jobber-ai-voice-and-chat-beta ;
  play.google.com (com.getjobber.jobber).

### Houzz Pro (États-Unis) — des prix tirés de Gemini, et rien de tel en France

- **Ce qu'il fait.** L'IA est disponible aux États-Unis et au Canada. En
  France, Houzz Pro s'appuie sur la bibliothèque Batiprix, et son aide
  française ne documente aucun devis par IA.
- **Parcours.** « Create with AI » → texte, voix ou import, y compris la PHOTO
  d'un ancien devis, pour en tirer un nouveau → aux États-Unis, des lignes à
  cocher avec le nouveau total, avant « Update ». Au Royaume-Uni et en
  Australie, en revanche, les lignes sont d'abord insérées, et l'artisan les
  retire ensuite (« Remove Items »). Retouches en masse (« une marge de 15 %
  partout ») sur ordinateur. Un devis peut ensuite devenir un planning de
  chantier.
- **D'où viennent les prix.** « The included pricing is based on AI data from
  Gemini, and also considers the project zip code and location for improved
  accuracy » : les prix viennent des données de l'IA Gemini (Google), ajustées
  selon le code postal.
- **À retenir** : l'assistant répond à « How much did we charge for demolition
  in past projects? » (combien avons-nous facturé la démolition sur nos
  anciens chantiers ?). C'est la mémoire de l'artisan — qu'Opus donnera sans
  IA, au lot 1.
- **Coince** :
  - sur téléphone, Houzz parle lui-même d'un « ballpark estimate » (une
    estimation à la louche) qu'il faut « clean up » (nettoyer) au bureau avant
    l'envoi ;
  - « Missing AI… I need desktop » (pas d'IA, il faut un ordinateur ; App
    Store, 3★) ;
  - « the pricing with ai is no different then using a free ai. Not worth it. »
    (les prix de l'IA ne valent pas mieux qu'une IA gratuite ; App Store, 1★)
- **Sources** : pro.houzz.com/pro-help (articles « how to use AI to create an
  estimate or proposal » et « how to use the Houzz AI assistant in financial
  documents ») ; pro.houzz.fr ; le flux public des avis App Store.

### Buildxact Blu (Australie) — le relecteur

- **Ce qu'il fait.** Formules de 199 à 599 $/mois (prix lus sur un miroir de
  préproduction, non revérifiés). Le générateur de devis est une option à
  99 $/mois sur la première formule. Le relecteur est une option à 149 $/mois
  sur la formule Pro, et il est inclus dans la formule Master.
- **Parcours du générateur.** Une description, ou une ancienne estimation de
  l'artisan prise comme modèle → l'adresse du chantier (qui sert à adapter les
  prix) → un catalogue de fournisseur → des questions (« Other », « Skip and
  generate ») → le devis.
- **D'où viennent les prix.** Des catalogues de fournisseurs (Home Depot,
  Bunnings…), d'un catalogue générique, et de « données locales ». L'origine
  des prix de main-d'œuvre n'est pas dite.
- **Chiffres** : plus de 2 560 estimations faites par les utilisateurs de son
  IA, dont 10 % envoyées comme devis final (présenté comme un succès ; voir le
  §0, point 3). Le « 97 % de précision » annoncé ne repose, comme seule preuve
  publiée, que sur un artisan et un chantier.
- **Conditions d'utilisation** : les données désidentifiées des clients
  servent à entraîner les modèles « au profit des autres clients » et sont
  transmises aux fournisseurs.
- **Sources** : help.buildxact.com (articles sur le relecteur et le générateur) ;
  le communiqué du 10/12/2025 ; les conditions d'utilisation.

---

## §3. Ce dont les artisans se plaignent

> **Un constat d'abord, qui compte autant que les plaintes : presque personne
> ne se plaint, parce que presque personne n'écrit.**
>
> | outil | avis indépendants qui parlent de l'IA |
> |---|---|
> | Batappli, Calyflux, HERO, Boby | aucun |
> | Vulko | aucun (seulement un site affilié) |
> | Jobber | aucun sur le brouillon de devis |
> | Buildxact | aucun ne nomme son IA |
> | Donizo | 2 avis écrits |
> | Angebotsmeister | 1 avis écrit |
> | Costructor | 2 tests rédactionnels, dont un affilié |
>
> Les avis écrits les plus nombreux sont américains (Handoff). On ne peut
> donc **pas** affirmer que ces IA marchent. On peut dire ce qui revient chaque fois que
> quelqu'un écrit.

### 3.1 « Il faut tout reprendre »

| citation | source |
|---|---|
| « Nous avons systématiquement retouché les prix unitaires et ajusté les marges avant envoi. » | Le Blog du Dirigeant, test de Costructor, 19/08/2026 |
| « Les devis à la voix sont à vérifier point par point et à modifier donc aucun gain de temps par rapport à la rédaction "traditionnelle". » | Trustpilot, Obat, 1★, 28/02/2025 |
| « I end up having to change most numbers as it does not reflect real world costs » (je finis par changer la plupart des chiffres, ils ne reflètent pas les coûts réels) | Capterra, Handoff, 11/03/2025 |
| « kind of almost accurate, as long as you tweak it many many times to correctly account for basic things like labor cost and hours » (presque juste, à condition de le retoucher très souvent, même pour la main-d'œuvre et les heures) | Google Play, Handoff, 26/06/2026 |
| « Ce qu'il faut reprendre systématiquement : les prix unitaires. » | Le Conduc, test de Vulko (site affilié) |

### 3.2 Les quantités fausses — l'erreur la plus dangereuse

| ce qui se passe | source |
|---|---|
| « des surfaces qui se mettent toutes seules à 1 m2 » | Trustpilot, Obat, 1★, 28/02/2025 |
| la douche comptée deux fois, le meuble vasque compté deux fois, « 30×45 » devenu « 40/30 » | démonstration officielle d'Obat, 02/03/2026 |
| « It also overestimated the floor joist by about 25% » (il a surestimé les solives d'environ 25 %) | App Store, Handoff, 2★, 22/03/2026 |
| « it was off by approximately 25% low!!!! » (le devis était trop bas d'environ 25 %) | App Store, Handoff, 1★, 18/12/2025 |
| la surface des murs comptée égale à la surface au sol (25 m²) | démonstration allemande d'Angebotsmeister (relevé par la vérification) |
| « Quarante mètres vaut mieux que 40m dicté rapidement » | conseil de Calyflux lui-même |

### 3.3 Un devis qui ne correspond pas à la demande

| citation | source |
|---|---|
| « depuis qu'il puisse dans la base de données il y a toujours une grosse différence entre la demande et le devient lui-même il n'y a plus rien à voir du coup je n'utilise quasiment plus ce service » | Capterra, Obat, 18/09/2024 |
| « Hat keine Ahnung vom Gewerbe, baut Fehler ein » (ne connaît rien au métier, ajoute des erreurs) | App Store Autriche, Angebotsmeister, 1★, 03/07/2026 |
| « Inconsistent price quotes on same products for different estimates despite the quotes being completed minutes apart » (des prix différents pour le même produit, dans deux devis faits à quelques minutes d'écart) | Capterra, Handoff, 20/01/2025 |

### 3.4 L'IA qui touche à ce qu'on ne lui a pas demandé

| citation | source |
|---|---|
| « I find manual changes overwritten constantly […] It will randomly repopulate the estimate with things I've had it remove previously » (mes corrections manuelles sont sans cesse écrasées ; l'IA remet des lignes que je lui avais fait retirer) | App Store, Handoff, 4★, 25/02/2025 |
| « When making adjustments it often makes unrequested adjustments as well » (quand on lui demande une modification, elle en fait souvent d'autres qu'on n'a pas demandées) | Capterra, Handoff, 22/04/2025 |
| « it marked the invoice paid and sent a receipt, when this wasn't true » (elle a marqué la facture payée et envoyé un reçu, alors que c'était faux) | Google Play, Jobber, 1★, 14/07/2026 |

### 3.5 Des prix sans rapport avec le marché local

| ce qui se passe | source |
|---|---|
| un coffret électrique estimé à 420 $, contre 1 700 à 2 000 $ chez les fournisseurs de la région ; le client réclame un triangle d'avertissement sur les prix inventés par l'IA | tableau public des demandes de Handoff, 01/08/2026, statut « Submitted » |
| peindre et poser 8 portes : 7 500 $ — « The customers would laugh at me » (les clients se moqueraient de moi) | Capterra, Handoff, 05/05/2025 |
| « the app doesn't understand the real cost of labor actually needed to do the work and the permitting / code requirements for my state » (l'application ne comprend pas le vrai coût de la main-d'œuvre, ni les permis et les règles de mon État) | Capterra, Handoff, 13/04/2025 |
| des références d'articles inventées, et des articles qui ne sont plus vendus, à moins de la moitié du prix actuel | tableau public des demandes de Handoff, 06/04 et 14/10/2026 |

### 3.6 Le réseau et les quotas

| citation | source |
|---|---|
| « une connexion internet est nécessaire pour dicter, transcrire et structurer un devis » | aveu de Calyflux |
| « Un mode hors ligne serait au top mais peut être irréalisable ? » | Capterra, Obat, 17/09/2024 |
| « Some job locations have bad service and can't give estimates on site. » (sur certains chantiers, il n'y a pas de réseau et on ne peut pas faire le devis sur place) | Capterra, Handoff, 04/03/2025 |
| « Le quota de 2 devis IA/mois est en revanche vite atteint si l'IA est votre motivation. » | Batemark, à propos de Costructor |
| « Pour avoir un bon service il faut prendre un abonnement a 49.99€ht » | Trustpilot, Boby, 3★ |
| un message tout prêt pour écrire au support : « Je ne comprends pas comment ma capacité IA a été consommée » | dans le code de l'application ATTIX |

### 3.7 « Pas mieux qu'une IA gratuite »

| citation | source |
|---|---|
| « the pricing with ai is no different then using a free ai. Not worth it. » | App Store, Houzz, 1★, 18/05/2026 |
| « Des concurrents comme Obat le font déjà et en beaucoup mieux. » | App Store, ATTIX, 1★, 11/12/2025 |
| « Depuis les avancées de l'IA, Obat paraît dépassé et peine à prendre le virage de l'automatisation. » | Trustpilot, Obat, 2★, 28/08/2025 |
| « avons nous besoin de cela ? […] mais les basiques ne sont pas là » | Trustpilot, Boby, 3★, 06/05/2024 |

### 3.8 Le vrai concurrent gratuit : l'IA généraliste

La première plainte du §3.7 désigne un concurrent que cette étude n'a pas
mesuré, et c'est le plus répandu : ChatGPT, Gemini ou Le Chat, à qui l'on
décrit le chantier avant de recopier la réponse dans un modèle Word ou un
tableur. Il ne coûte rien ou presque, rationne peu, et rédige sans doute
aussi bien que les outils payants (ce n'est pas mesuré, §7) — ce sont souvent
les mêmes modèles (Calyflux et Vulko utilisent Claude, Houzz s'appuie sur
Gemini).

Ce qu'il ne fait pas, et qu'Opus doit faire mieux :
- **les prix de l'artisan** : l'IA généraliste n'en a aucun. Elle invente, et
  pas deux fois pareil : sur des métrés, Handoff mesure que ces IA varient
  « by 50 to 70 percent » (de 50 à 70 %) d'un essai à l'autre (billet du
  21/07/2026, banc d'essai publié par l'éditeur lui-même) ;
- **la mémoire** : elle ne retrouve ni la phrase de l'artisan ni son prix d'un
  devis à l'autre ;
- **les mentions tenues par la base** : elle ne sait pas que l'assureur ou le
  médiateur manque, et ne peut pas refuser un devis incomplet ;
- **le rangement** : rien ne se range ligne par ligne, rien ne se totalise au
  centime, rien ne se retrouve le mois suivant.

> **Si Opus se contente de « faire rédiger par une IA », la plainte « pas
> mieux qu'une IA gratuite » sera juste.** Ce qui le distingue, c'est tout ce
> qui se passe **sans** IA : la mémoire, la base de postes, les totaux tenus
> par la base, le refus d'un devis incomplet.

> **Ce que ces plaintes disent ensemble.** Personne ne se plaint que l'IA
> écrive mal. On se plaint qu'elle **chiffre** mal, qu'elle **compte** mal, et
> qu'elle **agisse** sans qu'on le lui demande. Ce sont exactement les trois
> choses que les règles d'Opus confient déjà à l'artisan : le prix, la
> quantité, l'envoi.

---

## §4. La question qui décide de tout : d'où viennent les prix

### 4.1 Quatre origines, et ce que chacune vaut

| origine | qui | daté ? | vérifiable ? | droit d'usage |
|---|---|---|---|---|
| **les prix de l'artisan** (sa bibliothèque, ses anciens devis, son taux horaire × un temps) | Calyflux, HERO, Angebotsmeister (« deins », « berechnet »), ATTIX (formule), Opus prévu | oui, par le devis d'origine | oui | ce sont les siens |
| **une base de prix achetée ou un catalogue de fournisseur** | Handoff (Home Depot, mis à jour chaque jour), Buildxact, Batappli (BatiChiffrage), Obat (BatiChiffrage en option), Houzz en France (Batiprix, sans IA) | oui | oui | **sous licence** (voir 4.2) |
| **une fourchette de l'éditeur dont l'origine n'est pas dite** | Vulko (nationale, « pas actualisées automatiquement »), Renalto (sa bibliothèque), Angebotsmeister (« geschätzt »), ATTIX (son référentiel), Batappli (« prix moyens ») | mal | non | inconnu |
| **le modèle d'IA lui-même** | Houzz (« AI data from Gemini »), Boby (« aux prix du marché »), Obat sans bibliothèque (« données actuelles du marché »), Renalto en dernier recours (« Prix non vérifié »), Handoff en dernier recours (« AI fallback pricing ») | non | non | — |

### 4.2 Pourquoi un prix inventé par un modèle est un danger juridique

**1. Le devis engage l'artisan.** Accepté par le client, il forme le contrat :
« Le contrat est formé par la rencontre d'une offre et d'une acceptation »
(article 1113 du code civil). L'artisan doit alors les travaux au prix qu'il a
écrit. Il ne pourra jamais dire « c'est l'IA qui a mis ce prix ».
`PLAN-DEVIS.md` §2 et §10.3 détaillent le droit du devis ; c'est lui qui fait
foi.

**2. Les sept éditeurs dont le contrat a été lu l'ont tous écrit :**

| éditeur | ce que dit son contrat |
|---|---|
| Renalto | « les Données envoyées par la Société pourront ne pas être exactes […] L'Utilisateur sera tenu de relire les Données transmises » |
| ATTIX (art. 8) | « peuvent contenir des erreurs, des omissions ou des approximations (libellés, quantités, unités, prix, TVA) » ; art. 17 : aucune responsabilité pour un devis que l'artisan a validé |
| Donizo | « Donizo ne garantit pas l'exactitude des prix » |
| Angebotsmeister (§ 9) | l'artisan doit vérifier « alle KI-generierten Positionen, Mengenangaben und Beschreibungen vor dem Versand » (tous les postes, quantités et descriptions produits par l'IA, avant l'envoi) |
| Buildxact | le client « must not rely solely on their output and must ensure a human checks all relevant output » (ne doit pas se fier aux seuls résultats, et doit les faire vérifier par un humain) |
| Cegid (Boby) | le client utilise le service « sous sa seule responsabilité » |
| IArtisans (art. 13.2 b) | « le Client s'interdit toute action ou réparation en justice d'un préjudice découlant de l'utilisation desdits Résultats » |

> **Autrement dit : quand l'outil se trompe, c'est l'artisan qui paie, et
> chacun de ces sept-là l'a signé.** Les pages commerciales disent l'inverse :
> « Vous n'avez rien à vérifier » (Renalto), des devis « 100% conformes » (blog
> de Boby, 13/09/2024), « Vérifié DTU » (ATTIX) — et leur propre contrat dit
> le contraire. « Prix actualisés par l'IA, en phase avec les prix
> fournisseurs » (Costructor) est démenti, lui, par le seul essai détaillé
> publié (« Nous avons systématiquement retouché les prix unitaires », Le Blog
> du Dirigeant) ; son contrat n'a pas été lu sur ce point.

**3. La TVA, en particulier.** Donizo le rappelle lui-même : « c'est
l'artisan, et non le client, qui répond du taux appliqué en cas de contrôle ».
Un taux réduit appliqué par défaut, sans les questions qui le justifient,
fait porter la différence à l'artisan.

**4. Une base de prix est protégée.** « Télécharger la base des prix du
bâtiment et l'intégrer à Opus » n'est pas possible sans accord de son
producteur (code de la propriété intellectuelle, articles L341-1 et L342-1 ;
`DEVIS-DU-PROPRIETAIRE.md` §6.2). Un abonnement donne le droit de consulter la
base soi-même, pas de la mettre dans une application que d'autres utilisent.
Et `SOURCES-DONNEES-BTP.md` (§0 point 3, §5.4) va plus loin : **même un
fichier de prix que l'artisan a acheté et déposerait lui-même dans Opus,
l'agent ne le lit pas sans l'accord écrit de l'éditeur.** Aucune de leurs
conditions ne parle d'IA, ce qui en fait une « autre utilisation », soumise à
autorisation.

**5. Un prix produit par un modèle ne se reproduit même pas.** Handoff le
reconnaît pour les IA généralistes, qui varient « by 50 to 70 percent » d'une
fois sur l'autre sur des métrés (billet du 21/07/2026). Et pour lui-même,
puisqu'il a dû corriger la « pricing stability » en septembre 2026. Un
utilisateur l'avait mesuré : des prix différents pour le même produit, dans
deux devis faits à quelques minutes d'écart.

### 4.3 Même avec les prix de l'artisan, deux pièges

- **Le bon prix sur le mauvais ouvrage.** La démonstration d'Obat a été faite
  avec la bibliothèque de l'artisan ; ses erreurs viennent probablement du
  **choix de l'ouvrage** (« Sol séjour » dans une salle de bain, la douche en
  double). Il faut donc vérifier que l'ouvrage retenu correspond à ce qui a
  été dit (cote, pièce, doublon fourniture et pose).
- **La marge fausse sans un mot.** Chez Batappli, les lignes produites par
  l'IA ont un prix de revient à 0 € : la marge affichée égale le total, et
  l'artisan croit gagner ce qu'il ne gagne pas.

### 4.4 La règle pour Opus — elle est déjà écrite

> **Aucun prix, taux de TVA, marge ou référence inventé.** La seule source de
> prix autorisée est celle de l'artisan (ses devis émis, ou le prix de
> référence qu'il fixe lui-même dans sa base de postes), affichée **avec son
> origine** (« 50 €/m², devis 087 »), **sans moyenne**. Les quantités
> calculées par l'IA sont **signalées**. Les totaux se recalculent en base, en
> centimes entiers ; l'IA ne pose jamais un total.
> — *Cahier Visite §11 ; cahier des charges §14 et §26 ;
> `DEVIS-DU-PROPRIETAIRE.md` §1.3 et §5 ; `PLAN-DEVIS.md` §0 et §10.6.*

Et le plan l'a redit le 17/10, en titre : **« Les prix du marché : jamais
dans ce module »** (`PLAN-DEVIS.md` §10.6). Ce qui en découle, et que
`SOURCES-DONNEES-BTP.md` fixe :

- **une base vendue** (Batiprix, BatiChiffrage) ne peut être qu'une **option
  que l'artisan paie et branche**, sous la licence de son éditeur, jamais la
  fondation d'une base d'Opus, et jamais lue par l'agent sans accord écrit
  (§0 point 3) ;
- **la seule base de prix qu'Opus possédera** est celle que ses artisans
  construiront avec lui, volontairement : une **fourchette régionale**, sur un
  **poste précis**, sans que rien permette de deviner qui a fourni le chiffre
  (§0 point 5). Pas avant longtemps : Opus compte 8 fiches professionnelles,
  presque toutes dans les Bouches-du-Rhône (§2.3) ;
- **la forme la plus prudente est la décomposition** : montrer des temps et
  des quantités, et laisser chacun poser **son** taux horaire, **ses** frais
  et **sa** marge (§2.4) ;
- et **jamais un prix conseillé** : l'agent peut montrer à l'artisan ses
  propres prix ; il n'écrit jamais « le prix à mettre est X » et ne
  pré-remplit jamais un devis avec le prix d'un autre
  (`DONNEES-DES-ARTISANS.md` §5.4).

Pour une prestation que l'artisan n'a jamais chiffrée : le jour où une source
**licenciée** existe, une **fourchette** avec sa source et sa date, qui
n'entre jamais seule dans le devis et ne se mélange jamais à sa base
(`DEVIS-DU-PROPRIETAIRE.md` §6.3). En attendant, la ligne reste **« à
chiffrer »**. C'est ce qu'Angebotsmeister a fini par appeler « Lieber leer als
falsch ».

---

## §5. Où Opus peut être meilleur

### Ce qu'Opus possède, et que les autres n'ont pas

| atout | ce qu'il apporte au devis | sa limite aujourd'hui |
|---|---|---|
| **les demandes de devis reçues** (`quote_requests`) | l'objet des travaux, mention obligatoire, souvent déjà décrit par le client | 6 demandes de devis (et 2 demandes de rappel) ; les 6 ont une description, mais **la base ne l'exige pas** ; nom, téléphone et ville présents sur 1 demande acceptée sur 4 ; **aucune colonne photo** ; ni adresse ni e-mail (c'est le carnet de clients qui les donnera) |
| **le carnet de clients** (section 41) | le destinataire existe déjà, sans ressaisie | 1 client, sur le compte administrateur |
| **les chantiers photographiés** (section 36) | des photos et des mots de l'artisan, par étape | 2 chantiers ; ni métier ni type |
| **un agent déjà en place** (section 38) | l'appelant reconnu par sa connexion, un journal lisible dans « Mon agent », une limite tenue par la base, un agent nommé | il n'y a pas encore de devis sur lequel agir, et **aucune action d'IA n'entrera dans le module devis** : l'agent vient après |
| **l'entreprise trouvée existante et active au répertoire Sirene (INSEE)** (section 45) | une partie des mentions d'identité naît remplie | cela ne prouve pas que l'utilisateur en est le titulaire ; assureur, médiateur, régime de TVA, garanties et modalités manquent : c'est la moitié légale du lot 0 |
| **le référentiel des métiers** | ranger les postes par lot ; savoir quelle assurance mentionner | — |
| **la visite intelligente** (second cahier des charges) | des éléments CONFIRMÉS reliés à leurs preuves | ne se construit pas avant son plan |
| **un premier utilisateur réel annoncé** : votre frère, entrepreneur individuel en franchise de TVA, qui recevra le compte pro de test | de vrais devis sur de vrais chantiers, pour juger ce qui sert | le jour où il enregistre un vrai client ou remet un vrai devis, Opus cesse d'être un essai : le réglage qui dit qu'Opus n'est pas ouvert au public (`STATUT`, dans `legal.js`) doit quitter « essai » (jusque-là, tout devis porte « Document d'essai — sans valeur »), avec un contrat de sous-traitance — que vous tiendrez comme particulier, votre entreprise étant fermée, sauf si vous décidez de vous immatriculer d'abord —, un registre des traitements et une adresse de contact relevée. Et la remise du compte demande deux portes qui n'existent pas encore : changer l'adresse de connexion et le mot de passe, et une nouvelle acceptation des CGU par lui. Tout cela **avant** la remise (`PLAN-DEVIS.md` §10.12). Une fois le compte remis, vous ne vous y connectez plus : ses prix ne sont pas à lire, même pour juger l'IA |

Et des **règles qui sont déjà un avantage**, parce que les plaintes du §3
viennent précisément de leur absence chez les autres :
- l'agent écrit, l'artisan publie (ou envoie) ;
- aucune action d'IA ajoutée « à la main » ;
- un journal que l'artisan peut lire ;
- une permission qui naît avec chaque action ;
- jamais de visite obligatoire.

### Ce que votre façon de travailler change

Chez vous, le devis se prépare **après** la visite, au calme, et part par
courriel. La dictée « sur le chantier », que tous les concurrents mettent en
avant, vise donc un moment qui n'est pas le vôtre. Ce qui compte, c'est :
- le **relevé de la visite** (les surfaces pièce par pièce, les photos), qui
  nourrit le devis (idée n° 9, et les surfaces portées par la pièce,
  `PLAN-DEVIS.md` §10.6) ;
- la **vitesse au bureau** : retrouver sa phrase et son prix (idée n° 1),
  partir de la demande et du client (idée n° 3).

### Ce qui arrive avec le module devis, et ce qui attend l'agent

L'ordre des lots est confirmé : **0 → 1 → P → 2 → 3 → 4 → 5**, et la
franchise de TVA de votre frère permet au document (lot 2) de sortir avant la
TVA complète (lot 3). Le **lot 0** est coupé en deux depuis le 17/10 : d'abord
la moitié **légale** (assurances, médiateur, régime de TVA, garanties,
modalités de paiement et d'exécution, frais), puis le **confort** (logo,
modèle, conditions générales, durée de validité habituelle). L'IA n'arrive
qu'**après le module**, action par action, chacune avec son journal, sa
permission et sa limite (section 38).

| idée | sans IA, dans le module devis | avec l'agent, après le module |
|---|---|---|
| 1. les prix de l'artisan, et leur origine | lot 1 (la mémoire), lot P (la base de postes) | — |
| 2. le relecteur | le correcteur du clavier (lot 1), l'écart au prix de référence (lot P), le refus de remise motivé (lot 2), quelques avertissements | la relecture qui propose, la correction qui corrige la base, les oublis selon le type de chantier |
| 3. le devis rattaché | « Faire un devis » sur une demande acceptée ou une fiche client (lot 1) | des postes proposés d'après la description |
| 4. la TVA par des questions | lot 3 | l'agent pose les questions, il ne choisit jamais le taux |
| 5. remplir la base depuis les anciens devis | — | tout |
| 6. l'agent qui prépare | — | tout |
| 7. la confiance qui se gagne | — | tout |
| 8. le devis du négoce | — | module 7 (fournisseurs et prix), nourri par les factures d'achat du module 6 (dépenses) |
| 9. la visite | — | module Visite, après son audit et son plan |

### Les idées, de la plus forte à la plus faible

#### 1. Des prix qui ne viennent que de l'artisan — et chaque ligne qui dit d'où vient le sien

**L'idée.** Trois étiquettes possibles, et aucune ne vient d'un modèle :
- « votre prix de référence » (celui que l'artisan fixe dans sa base de
  postes) ;
- « votre prix — devis 087 du 12/03 » (les derniers prix pratiqués, sans
  moyenne) ;
- « à chiffrer ».

Le plan prévoit déjà qu'une ligne de main-d'œuvre se chiffre soit en
forfait, soit en « votre taux horaire × le temps que vous estimez » — c'est
exigé hors établissement par l'arrêté de 2017 (lot 1, `PLAN-DEVIS.md`
§10.3). C'est l'étiquette « calculé » d'Angebotsmeister, sans rien deviner :
le temps, c'est l'artisan qui le pose.

Une ligne « à chiffrer » (sans prix) n'est pas une ligne « Offert » (zéro
centime et un drapeau, `PLAN-DEVIS.md` §10.6) : un vide n'est pas un zéro.
Proposition : le devis **ne part pas** tant qu'il en reste une ; ce refus
serait un des motifs tenus par la base, au seul endroit où vivent les refus
de remise (`PLAN-DEVIS.md` §10.7). La phrase de l'artisan est gardée **mot
pour mot**. Un écart au prix de référence est signalé, jamais bloqué : c'est
la réponse à vos 50 € devenus 70 € sans que vous l'ayez décidé.

**Pourquoi Opus gagne.**
- Les concurrents, soit ne disent pas d'où vient le prix (Costructor, Boby,
  Batappli, Donizo, Jobber), soit le disent à moitié : Renalto au survol de la
  souris, Vulko ajouté après coup le 04/10/2026.
- ATTIX et Angebotsmeister affichent l'origine sur chaque ligne. Des deux,
  seul Angebotsmeister laisse une case vide plutôt que d'inventer, et c'est
  ce que le seul regard extérieur a remarqué (« Wer solche Details
  nachbessert, hat Handwerkern beim Rechnen zugehört » : qui soigne ces
  détails a écouté les artisans calculer). Calyflux laisse aussi la case
  vide, mais n'affiche l'origine que par groupe de lignes. Et Angebotsmeister
  garde une étiquette « estimé », tirée de fourchettes dont il ne publie pas
  la source.
- Presque tous gardent une source de plus : l'estimation par un modèle.
- Aux États-Unis, Clear Estimates se vend sur la phrase « not AI-guessed »
  (pas deviné par une IA) : la provenance devient un argument commercial
  (`SOURCES-DONNEES-BTP.md` §3.2).
- Opus fait plus simple et plus honnête qu'Angebotsmeister. Et c'est l'étage 1
  de votre base fidèle : **sans IA**, donc gratuit (les concurrents rationnent
  de 2 à 200 devis IA par mois) et instantané. Comme tout le devis d'Opus, il
  demande du réseau : `PLAN-DEVIS.md` §6 renvoie le hors-ligne au jour où un
  artisan le réclamera. (`DEVIS-DU-PROPRIETAIRE.md` §5 écrit qu'il « marche
  sans réseau au fond d'une cave » : c'est le plan qui fait foi, et cette
  phrase est à corriger.)

**Ce que ça demande.**
- Le **lot 1** (la mémoire : chaque ligne déjà écrite ressort quand on tape,
  avec son devis d'origine, jamais en moyenne) puis le **lot P** (la base de
  postes : la phrase, l'unité, la fourniture, le prix de référence en
  centimes, vide tant qu'il n'est pas fixé, ajoutée **d'un appui**). Les deux
  sont **déjà décidés** (`PLAN-DEVIS.md` §10.6). Reste à trancher avec vous,
  avant le lot P, la **colonne métier** : (a) aucune, le métier se déduira
  plus tard de la fiche ; ou (b) une colonne métier sur chaque poste, qui sert
  dès le premier jour à filtrer les suggestions d'un artisan qui a plusieurs
  métiers.
- Une **proposition**, à arbitrer au lot 1 contre la règle « aucune colonne
  sans lecteur » (`PLAN-DEVIS.md` §3.12) : copier l'origine du prix sur la
  ligne au moment du chiffrage (un instantané, pas une jointure), parce que
  l'écran de saisie la relit. Sinon, l'étiquette ne s'affiche que pendant la
  frappe. Le plan ne la prévoit pas aujourd'hui.
- Un affichage lisible sur un écran de 390 points de large.
- Un refus d'envoi tenu par la base, avec un message qui dit pourquoi.
- Une base **privée** : lisible de son seul auteur (pour le développeur :
  `est_mon_entreprise()`, aucune politique `anon`, une ligne dans
  `mes_donnees()`), **sans aucune lecture par l'administration** (préalable
  n° 3 de `PLAN-DEVIS.md` §10.7). Avec une limite à dire : vous détenez
  l'éditeur SQL de Supabase, qui lit tout ; la séparation se décide avant le
  module (`DONNEES-DES-ARTISANS.md` §5.2). Aucun appel d'IA.

**Le risque.**
- Le premier devis d'un nouvel inscrit sort presque vide. C'est le défaut
  avoué d'Angebotsmeister (« Bisher kam dein erstes Angebot ohne Preise » :
  jusqu'ici, ton premier devis sortait sans prix) et de Calyflux. C'est la
  vérité, mais elle peut décevoir face à des concurrents qui affichent un
  total tout de suite. La parade est l'idée n° 5.
- Une base pleine de variantes d'un même poste (Renalto ne signale pas les
  doublons à l'import). D'où la règle : un poste nouveau se propose, il ne
  s'ajoute pas tout seul.
- **La mémoire perd ce qui est effacé.** Un devis jamais accepté sera effacé
  au bout d'un an (votre réponse du 17/10) : ses lignes sortent alors de la
  mémoire du lot 1. Un poste ajouté à la base, lui, reste — son lien vers le
  devis d'origine devient simplement vide. C'est une raison de plus pour la
  base de postes.

#### 2. Un relecteur avant l'envoi, qui signale et ne modifie rien

**L'idée.** Avant l'envoi, une liste courte de points à trancher, un appui
chacun. Elle se construit en deux temps.

**Sans IA, avec le module devis** — et une bonne part est déjà prévue :
- pendant la frappe, le correcteur du clavier reste actif sur les
  descriptions, éteint sur les quantités et les prix (couche 1 du correcteur,
  lot 1) ;
- l'écart au prix de référence, signalé sur la ligne (lot P) ;
- ce qui **bloque** l'envoi — une mention manquante, un taux réduit sans la
  certification du client (lot 3) et, si vous l'acceptez, une ligne restée
  « à chiffrer » (idée n° 1) — est décidé par la base, en **un seul
  endroit** (pour le développeur : la fonction des motifs de refus de remise,
  `PLAN-DEVIS.md` §10.7). Le relecteur l'**affiche** ; il ne recalcule jamais
  la règle de son côté, sinon deux écritures finiraient par se contredire ;
- des **avertissements** qui ne bloquent rien, et qui peuvent donc vivre dans
  le seul fichier de calcul du devis : la même désignation écrite deux fois,
  **au mot près**, et une quantité restée à 1 sur une ligne en m², ml ou m³
  (jamais sur un forfait ou une unité, où 1 est normal : sinon, l'alerte
  sonnerait à chaque devis). Un contrôle sans IA ne compare que le texte
  exact (`PLAN-DEVIS.md` §10.6) : il n'aurait **pas** vu les doublons de la
  démonstration d'Obat, écrits avec d'autres mots (« Fourniture et pose d'un
  meuble vasque », puis « pose meuble vasque »). Ceux-là relèvent de la
  relecture par l'agent, après le module.

La confusion des murs et du sol se **prévient** plutôt qu'elle ne se
détecte : la ligne de titre de pièce porte ses deux surfaces (`PLAN-DEVIS.md`
§10.6), et l'écran peut faire choisir l'une ou l'autre au moment de créer la
ligne — le choix qu'Angebotsmeister a fait à la place de l'artisan.

**Avec l'agent, après le module** :
- la relecture de l'orthographe et des formulations, où l'agent **propose**
  chaque correction une par une (couche 2) ;
- une correction acceptée corrige aussi la base (couche 3) : la faute ne se
  corrige qu'une fois ;
- les **oublis** tirés des propres devis de l'artisan (« dans vos 9 derniers
  devis de salle de bain, vous mettiez *évacuation des gravats* — elle manque
  ici »). Attention : pour dire « salle de bain », il faut savoir de quel
  genre de chantier il s'agit, et aucune colonne ne le dit (un chantier n'a
  pas de type, et le plan ne prévoit rien de tel pour le devis). C'est donc
  soit une action de l'agent (classer le devis), soit une colonne nouvelle,
  qui devra avoir un lecteur le jour de sa création.

**Pourquoi Opus gagne.**
- Buildxact vend ce relecteur 149 $/mois en option ; Boby l'offre dès
  14,99 € ; IArtisans relit une PHOTO d'un devis tapé ailleurs.
- Opus relit des données rangées qu'il a produites lui-même : aucune lecture
  d'image, aucune double saisie.
- La moitié des contrôles ne coûte rien, et les oublis viendront de
  l'historique de l'artisan, pas d'un catalogue générique.
- C'est votre demande de correcteur (`DEVIS-DU-PROPRIETAIRE.md` §6.1), et elle
  ne touche à aucun montant.

**Ce que ça demande.**
- Sans IA : les avertissements dans un fichier qui n'importe rien, avec un
  contrôle automatique qui les fait tourner.
- Avec l'IA : une action nouvelle par le socle de la section 38 — son nom
  dans la liste des actions de l'agent (`ACTIONS_IA`) avec ses quatre champs,
  son journal, sa limite, et une garde contre un devis trop pauvre pour être
  relu.
- Le texte envoyé au modèle se limite aux lignes, jamais au client.

**Le risque.**
- Le bruit. Une liste de vingt alertes à chaque devis finit coupée, d'où la
  règle : suggestions « utiles, groupées, désactivables, jamais insistantes ».
- Les oublis tirés de l'historique demandent assez de devis pour être fiables,
  et Opus est vide.
- Une « faute » corrigée qui était en fait un mot du métier.

#### 3. Le devis qui naît rattaché à une demande reçue, à un client du carnet, à un chantier

**L'idée.** « Faire un devis » depuis une demande acceptée ou une fiche du
carnet. Depuis une demande, seule la **description** est reprise ; le
destinataire et son adresse viennent du carnet, que l'artisan alimente par
« Ajouter à mes clients » (`PLAN-DEVIS.md` §10.7). Sans IA d'abord. Plus tard,
l'agent proposera des postes tirés de la base personnelle à partir de la
description, et la demande restera affichée à côté du brouillon pendant la
relecture, comme chez Jobber.

**Pourquoi Opus gagne.**
- Chez Costructor, le client et le chantier restent vides après la génération ;
  chez Obat, le brouillon vocal arrive sans client.
- Jobber (Canada) et Angebotsmeister (Allemagne) partent d'une demande, mais
  aucun outil français étudié ne part d'une demande reçue sur son **propre**
  réseau.
- Opus a des demandes que les clients décrivent eux-mêmes (les 6 actuelles
  ont une description), et un carnet relié à elles.

**Ce que ça demande.**
- `PLAN-DEVIS.md` §3.8 et le lot 1 : le geste « Faire un devis ».
- Le devis garde sa source : manuelle, demande, urgence, et plus tard visite
  (§19 du cahier Visite : la visite n'est jamais obligatoire).
- **Savoir partir d'une demande sans texte** : la description est facultative
  en base.
- Pour la version IA (après le module) : la même action que l'idée n° 6. Elle
  ne reçoit que la description, jamais le nom, le téléphone ni l'adresse.
  Mais **la description est un texte libre écrit par le client**, qui peut
  lui-même contenir un nom, une adresse ou un numéro : c'est un envoi de
  données personnelles à Anthropic, à écrire dans « À qui vos données sont
  transmises ». Et Anthropic devient alors un sous-traitant ultérieur, que
  chaque artisan doit pouvoir connaître et autoriser (`PLAN-DEVIS.md` §10.3,
  RGPD art. 28.2).

**Le risque.**
- Opus est vide (6 demandes de devis, 1 client) : l'avantage ne vaut que s'il
  y a du monde.
- Les demandes sont pauvres : nom, téléphone et ville présents sur 1 demande
  acceptée sur 4, aucune photo possible. Et le champ `budget` est un texte, qui
  ne doit jamais entrer dans un calcul.

#### 4. La TVA décidée par des questions, jamais par défaut

**L'idée.** Quelques questions : âge du logement, usage, nature des travaux,
et, pour le 10 %, **en quelle qualité le client commande** (propriétaire,
locataire, syndic…), jamais déduite de sa fiche (`PLAN-DEVIS.md` §10.3). La
réponse est gardée avec le devis (pour le développeur : `taux_justification`,
la raison du taux), et le taux est fixé ligne par ligne.

**Pourquoi Opus gagne.** Chez les concurrents, le taux est posé sans que la
question qui le décide ait été posée — que 20 % soit juste ou faux, personne
ne peut le savoir, et c'est l'artisan qui en répond :
- Renalto : 20 % sur les deux lignes visibles de sa démonstration (une salle
  de bain chez un particulier) ;
- Obat : 20 % sur tout le pré-devis, sur les captures de son aide ;
- Batappli : un « Taux de TVA par défaut » ;
- Calyflux : un taux par type de chantier, appliqué à toutes les lignes ;
- Costructor : « Auc… ».

Aucun outil qui rédige ne documente ces questions. Les plus proches : un
rappel des taux (ATTIX), une raison affichée par ligne (Donizo).

**Ce que ça demande.** Le lot 3 de `PLAN-DEVIS.md` : la TVA complète, et la
certification par le client. Depuis le 16/02/2025, c'est le client qui
certifie, sur le devis ou la facture, les trois éléments que l'administration
exige (dans sa doctrine publiée, BOI-TVA-LIQ-30-20-90-40, § 80) ; une phrase
qui les énumère suffit (§ 85), d'où la « phrase unique de certification » du
lot 3 (`PLAN-DEVIS.md` §10.3). Rien à inventer côté IA. Le relecteur (idée n° 2)
affiche la raison de chaque taux réduit (« 10 % — habitation de plus de
2 ans »), sans la vérifier : c'est l'absence de certification qui bloque la
remise. Si l'agent prépare un jour un devis, il pose ces questions au lieu de
choisir le taux.

**Pour votre frère, rien de tout cela d'abord** : il est en franchise, ses
devis sortent sans TVA, avec « TVA non applicable, article 293 B du CGI ».
L'idée n° 4 compte pour les artisans suivants — et c'est ce qui permet de
livrer le document (lot 2) avant la TVA complète (lot 3).

**Le risque.** Les critères techniques du taux à 5,5 % ne se vérifient pas par
un programme (`PLAN-DEVIS.md` §6). Opus garde la réponse, il ne garantit pas
le taux, et l'écran doit le dire. Le droit bouge aussi : au 01/01/2027, la
TVA passe dans un nouveau code (le CIBS), et la forme de la certification
passera par un arrêté qui n'est pas encore paru (`PLAN-DEVIS.md` §10.3).

#### 5. Remplir la base le premier jour depuis ses anciens devis (PDF ou photo)

**L'idée.** L'agent lit les anciens devis de l'artisan et lui propose ses
postes : la phrase gardée mot pour mot, l'unité, le prix avec le devis d'où il
vient. L'artisan valide ligne par ligne. Votre photo devient le premier cas
d'essai, dont on connaît la vérité attendue.

**Pourquoi Opus gagne.**
- Renalto en a fait sa voie recommandée (par PDF) ; Angebotsmeister lit la
  photo de 4 pages ; Calyflux et Donizo importent d'anciens devis en PDF ou
  en tableur, sans dire clairement si cela remplit leurs prix ; ATTIX
  l'annonce sans l'avoir ouvert. Houzz lit bien la photo d'un ancien devis,
  mais pour en tirer un nouveau devis, pas pour remplir un catalogue.
- Ceux qui le font remplissent **leur** catalogue. Opus le fait pour
  remplir la base fidèle : sans moyenne, avec la source, en proposant au lieu
  d'ajouter d'office (Renalto coche d'avance), l'action inscrite au journal et
  visible dans « Mon agent ».
- C'est votre idée du 17/10 (`DEVIS-DU-PROPRIETAIRE.md` §1.3, point 4), que le
  plan range dans l'étage de la compréhension (`PLAN-DEVIS.md` §10.6).

**Ce que ça demande.**
- **Après** le module devis : l'agent n'agit que sur ce qui existe.
- Une action IA nouvelle par le socle de la section 38. **Toutes ses
  réponses, refus compris, doivent partir en HTTP 200**, comme celles de la
  fonction `siret`. Aujourd'hui, ce n'est pas le cas de la fonction Edge `ai`
  (constaté en lisant le code, pas éprouvé). Quand elle refuse, elle répond
  400, 401, 422 ou 429 ; `src/lib/ai.js:74` relance l'erreur telle quelle ;
  et **le message français de la limite (« Vous avez atteint la limite
  d'appels à l'assistant pour aujourd'hui… ») n'arrive sur aucun écran**.
  Selon l'écran, on lit :
  - la phrase anglaise brute « Edge Function returned a non-2xx status
    code » (« la fonction a répondu autre chose que 200 ») : amélioration
    d'un texte, résumé des avis, recherche d'artisans par l'IA ;
  - « L'assistant IA n'est pas joignable » : rédaction de la présentation ;
  - pour le seul récit d'un chantier, le message de panne de
    `src/lib/erreurs.js` : « le service d'Opus n'a pas répondu correctement.
    Ce n'est pas de votre fait : réessayez dans quelques minutes ».

  **Une limite de 60 appels atteinte se présente donc comme une panne, ou en
  anglais** — l'inverse de ce qu'il faut dire.
- Le journal de l'agent complété avec le modèle, la version de la consigne et
  la forme attendue de la réponse (cahier Visite §18).
- Une lecture d'image.
- Un **jeu d'évaluation** (les devis dont on connaît la bonne réponse, pour
  mesurer la lecture) **limité à vos devis**, noms masqués, avec votre
  accord ; **jamais les devis d'un autre artisan, votre frère compris** :
  ce serait réutiliser les données de leurs clients pour le compte d'Opus
  (`PLAN-DEVIS.md` §10.6, règle 3). Le jour où la lecture existe, votre frère
  pourra remplir **sa** base avec ses propres anciens devis : c'est son usage
  à lui, pas un essai d'Opus.
- Un écran de validation qui repère les doublons.
- Une garde : l'agent ne lit que des **devis de l'artisan**, jamais une base
  de prix achetée ou un tarif de fabricant qu'il déposerait
  (`SOURCES-DONNEES-BTP.md` §5.4).

**Le risque.**
- La lecture se trompe : Costructor avoue que les ouvrages détaillés d'un PDF
  deviennent de simples fournitures ; Angebotsmeister marque « Unsicher » ce
  qu'il lit avec moins de 70 % de confiance.
- Un ancien devis contient le nom et l'adresse d'un client. L'envoyer au
  modèle est un flux nouveau : à réduire au strict nécessaire, à écrire dans
  « À qui vos données sont transmises », et Anthropic à déclarer comme
  sous-traitant ultérieur.
- Un appel d'IA par devis lu, sur les 60 autorisés par jour.
- Un vieux prix doit garder sa date (cahier des charges §15). Pour le faire
  vieillir, un index public de l'INSEE par corps d'état dit de combien un coût
  a bougé, jamais combien il coûte (`SOURCES-DONNEES-BTP.md` §2.4).

#### 6. L'agent qui prépare : « ce que j'ai entendu » → trois questions au plus → des lignes à cocher

**L'idée.** L'agent reprend ce qui marche chez chacun, sans ce qui coince :
- le texte entendu, corrigé avant toute génération (Angebotsmeister, Vulko) ;
- au plus trois questions à choix, avec « Autre » et « Passer », puis « ce que
  j'ai compris » (Costructor, Renalto) ;
- des lignes proposées **à cocher**, avec un total qui bouge (Batappli) ;
- les hypothèses écrites (Handoff, Vulko) et les quantités estimées signalées.

Les lignes ne prennent leur prix **que** dans la base de l'artisan ; sinon,
elles restent « à chiffrer ».

**Pourquoi Opus gagne.** Il ajoute ce qu'aucun concurrent étudié n'a réuni :
- les cinq statuts du cahier Visite : CONFIRMÉ, DÉTECTÉ PAR IA, À CONFIRMER,
  NON COMPRIS, REFUSÉ ;
- une consigne qui ne touche que les lignes visées ;
- une ligne retouchée à la main, que l'IA ne peut plus modifier : c'est la
  plainte n° 1 chez Handoff ;
- chaque action au journal, lisible dans « Mon agent ». Renalto, Handoff et
  HERO gardent un historique **par devis** ou par conversation ; aucun ne
  documente un journal unique de **toutes** les actions de l'agent, refus et
  échecs compris, lisible par l'artisan — ce que fait déjà « Mon agent »
  (section 38). Ce qui n'est pas trouvé n'est pas forcément absent.

**Ce que ça demande.**
- Tout le socle d'une action IA, plus ce qui lui manque : des réponses
  structurées, contrôlées avant affichage ; le modèle et la version de la
  consigne au journal ; des refus en HTTP 200 (idée n° 5) ; la lecture des
  données avec le jeton de l'artisan (la clé de service de la base passe
  outre les règles d'accès, et pourrait rendre les prix d'un autre).
- Un nom d'action distinct de `devis` : ce mot désigne déjà les **demandes**
  de devis dans le code (notifications, export des données), et il a servi
  le 07/10 d'exemple d'action inconnue dans les essais.
- La permission « préparer » naît avec cette action. L'envoi, lui, n'est
  jamais réglable.
- La base fidèle d'abord : sans elle, l'agent n'a aucun prix à poser.
- Avant de livrer : vérifier si un devis préparé par l'agent puis relu par
  l'artisan doit porter une mention d'IA (règlement européen sur l'IA,
  art. 50 ; §7).

**Le risque.**
- Le coût : trois appels d'IA par devis, sur 60 par jour pour TOUTES les
  actions de l'agent.
- La quantité reste l'erreur dangereuse.
- Un artisan qui « ne réfléchit plus » (avis ATTIX). La relecture doit rester
  un vrai geste sur le document, pas un « oui » dans la conversation (le piège
  de HERO).

#### 7. La confiance qui se gagne, et l'écart qui se signale

**L'idée.** Une préparation automatique (par exemple, un brouillon prêt à
chaque demande reçue) ne serait proposée qu'après N devis préparés par
l'agent **et réellement remis** par l'artisan (au sens du plan : le PDF
produit et archivé). Et une alerte préviendrait quand un total sort de
l'habitude de CET artisan.

**Pourquoi Opus gagne.** Jobber le fait (après 3 devis, et une alerte
au-dessus de la valeur moyenne). C'est aussi la doctrine d'Opus pour la
fenêtre du nom de l'agent : proposer au bon moment, avec un compteur en base
qui ne redescend pas, puis se taire. Opus compare l'artisan à ses propres
devis, jamais à une moyenne du réseau — ce qui serait un prix conseillé
(`DONNEES-DES-ARTISANS.md` §5.4).

**Ce que ça demande.** Un compteur de devis réellement remis. Une comparaison
aux propres totaux de l'artisan ou à son prix de référence par poste.
Seulement le jour où une préparation automatique existe : la permission
« préparer selon réglage » du cahier des charges (§4).

**Le risque.** Que « automatique » glisse vers « envoyé tout seul », ce qui
est interdit. Et une alerte de trop finit ignorée.

#### 8. Le devis du négoce repris dans le sien, avec sa marge

**L'idée.** Déposer le devis PDF d'un fournisseur, et le voir repris en lignes
avec la marge de l'artisan. Chaque ligne porte une provenance de plus :
« prix fournisseur — devis du 12/10 ».

**Pourquoi Opus gagne.** HERO montre le geste (+18 % dans sa démonstration).
C'est ce qu'un artisan reçoit chaque semaine de son négoce, et c'est une
source de prix **réelle et datée**, celle que le cahier des charges appelle
« prix fournisseurs » (§14-15). Un devis ou une facture **adressés à
l'artisan** ne sont pas un tarif acheté : ce sont ses prix nets, qui
n'appartiennent qu'à lui. `SOURCES-DONNEES-BTP.md` §4.6 y ajoute la seule
source de vrais prix d'achat : les **factures d'achat électroniques**,
qu'Opus peut importer pour l'artisan avec son accord. Avec des réserves :
- les grandes entreprises et celles de taille intermédiaire les émettent
  depuis le 01/09/2026, mais les fournisseurs PME seulement au plus tard le
  01/09/2027 ;
- une ligne de facture n'est pas une fiche produit : la référence y est
  facultative, et les formats les plus pauvres n'ont même aucune ligne (si
  la réforme les accepte, ce qui n'est pas vérifié) ;
- les remises de fin d'année n'y figurent pas : le prix facturé n'est pas le
  prix d'achat réel ;
- l'adresse de livraison est souvent celle du chantier, donc une donnée du
  client de l'artisan.

`COMPARATEUR-MATERIAUX.md` (17-18/10) décrit tout ce chemin : une aide au devis
**privée à chaque artisan**, nourrie par ses factures, ses demandes de prix
et ses conditions, jamais par la lecture des sites des négoces.

**Ce que ça demande.** La même lecture de document que l'idée n° 5. Une
provenance supplémentaire, toujours datée. Ces prix restent dans la base
privée de l'artisan, jamais dans une base commune (certaines conditions
négociées avec un négoce peuvent être confidentielles). Sa vraie place est le
module 7 (fournisseurs et prix), nourri par les factures d'achat rangées au
module 6 (dépenses).

**Le risque.** Un tarif fournisseur vieillit vite ; la lecture se trompe ; et
mêler prix fournisseur et prix de l'artisan sans le dire recrée le défaut de
Donizo.

#### 9. La visite qui répond aux questions à la place de l'artisan

**L'idée.** Les questions de cadrage (idée n° 6) ont déjà leur réponse dans
une visite validée : les surfaces relevées pièce par pièce (votre façon de
faire, `DEVIS-DU-PROPRIETAIRE.md` §1.2), les photos comme preuve, les éléments
CONFIRMÉS reliés au poste (le lien « QuoteSourceLink » du cahier Visite, qui
rattache une ligne du devis à sa preuve).

**Pourquoi Opus gagne.** Buildxact laisse le particulier scanner sa pièce
(RENDR), mais personne ne relie chaque ligne du devis à sa preuve. Et c'est
**exactement votre façon de travailler** : la visite sert à relever, le devis
s'écrit ensuite.

**Ce que ça demande.** Le second cahier des charges, qui ne se construit pas
avant son audit et un plan validé (§22). La visite ne doit jamais être
obligatoire (§19).

**Le risque.** C'est l'idée la plus lointaine et la plus coûteuse : dix
étapes, plusieurs appels d'IA par visite. L'enregistrement d'un rendez-vous
exige le consentement du client. Et le droit dépend du **moment où le devis
est remis**, pas de l'endroit, ni de la vitesse à laquelle le client signe
ensuite. Préparé après une visite faite seulement pour mesurer, puis envoyé
plus tard par courriel — votre cas ordinaire —, il n'est ni « hors
établissement » ni « à distance », sous réserve d'un avis juridique. Remis et
signé le jour de la visite, il est « hors établissement ». Le plan garde le
cas le plus protecteur par défaut, et la question se pose devis par devis, au
moment de la remise (`PLAN-DEVIS.md` §10.12).

---

## §6. Ce qu'il ne faut PAS copier

| ne pas copier | qui le fait | pourquoi |
|---|---|---|
| un « prix du marché » produit par le modèle | Houzz (Gemini), Boby, Obat sans bibliothèque, Renalto et Handoff en dernier recours | il engage l'artisan ; il n'est ni daté, ni régional, ni reproductible ; le cahier Visite §11 l'interdit, et le plan aussi (« jamais dans ce module », `PLAN-DEVIS.md` §10.6) |
| une fourchette « de référence » sans source ni date | Vulko (nationale, non actualisée), Batappli (cinq formulations) | un ancien prix ne passe jamais pour un prix actuel sans sa date (cahier des charges §15) |
| une moyenne de prix | Batappli (« prix moyens ») | 50 € et 70 € ne font pas 60 € : ce sont deux situations (`DEVIS-DU-PROPRIETAIRE.md` §1.3) |
| « Vous n'avez rien à vérifier », « 100 % conformes », « Vérifié DTU », « Prix actualisés par l'IA » | Renalto, blog de Boby, ATTIX, Costructor | pour les trois premiers, leur propre contrat dit l'inverse ; pour Costructor, le seul essai détaillé publié le dément (son contrat n'a pas été lu sur ce point). C'est le « X est prévenu » avec un contrat au bout. Et pour les DTU, leurs éditeurs refusent toute lecture par une IA (`SOURCES-DONNEES-BTP.md` §5) |
| un taux de TVA par défaut | Renalto, Obat, Batappli, Calyflux | c'est l'artisan qui répond du taux (idée n° 4) |
| valider dans la conversation | HERO (« Angebot freigegeben »), Boby (« elle se charge de le faire à votre place ») | l'envoi est un geste sur le document lui-même ; il n'est jamais réglable |
| une IA qui agit sans confirmation | Jobber (facture marquée payée) | ce qui engage l'artisan se confirme à l'écran |
| refaire tout le devis à chaque message, écraser les corrections | Handoff | c'est la plainte n° 1 (§3.4) |
| faire payer ce qui n'a pas abouti | Vulko, jusqu'en octobre 2026 | règle d'Opus : seuls les appels réussis comptent dans la limite |
| annoncer une limite atteinte comme une panne, ou en anglais | Opus lui-même, aujourd'hui (idée n° 5) | un refus doit dire ce qu'il est, en français ; d'où les réponses en HTTP 200 |
| un apprentissage coché d'avance, ou mis en commun par défaut | ATTIX (lignes pré-cochées, entraînement sauf opposition), Donizo (usage « perpétuel »), Buildxact (données transmises aux fournisseurs) | la base de prix de l'artisan est son secret commercial ; une mise en commun ne peut être qu'un choix explicite, retirable (`DONNEES-DES-ARTISANS.md` §2.1) |
| publier ce qui vient des devis | Donizo (adresse d'un client, fourchettes de prix à ±5 %) | leçon de « Chantier Martin » (section 36.2) : rien de ce qui concerne le client n'est public |
| donner au particulier un prix d'IA pour contester l'artisan | Handoff (« ask them to explain any cost variance versus Handoff's numbers ») | c'est un prix sorti d'un modèle (§4.4), donc interdit en tout état de cause. Remis au particulier comme « ce que ça doit coûter », il prendrait en plus un caractère normatif, que `DONNEES-DES-ARTISANS.md` §5.4 refuse pour tout indicateur (avis 18-A-04) — ce paragraphe parle des artisans, la règle s'étend ici par prudence. Et Opus sert les deux côtés : retourner l'outil contre les artisans casserait leur confiance sans rien garantir au particulier |
| l'IA réservée à l'ordinateur ou à la formule la plus chère | Houzz (pas d'IA sur téléphone), Boby (le devis par IA, « Copilote », dans l'offre Pro seulement) | Opus vit sur le téléphone, et l'étage 1 ne coûte rien |
| relire la photo d'un devis tapé ailleurs | IArtisans | double saisie ; Opus relit ses propres données |
| des promesses qui se contredisent | Donizo (cinq versions de l'origine des prix), Vulko (hors ligne ; 10, 20 ou 27 métiers), Renalto et Costructor (nombres d'utilisateurs) | une seule phrase, écrite une seule fois, comme le vocabulaire du SIRET |
| appeler « signature » un simple clic | Angebotsmeister (« mit Unterschrift » sur une page, « nicht juristisch bindend » sur une autre : pas juridiquement contraignant) | article 1366 du code civil ; `CONCURRENCE-DEVIS.md` §7.2 et `PLAN-DEVIS.md` §10.4 |
| envoyer au modèle les données du client sans nécessité | IArtisans (ses propres conditions le déconseillent, alors que c'est son service) | proposer des postes ne demande ni le nom ni l'adresse du client |

---

## §7. Ce qui n'a pas pu être vérifié

**Sur la méthode.**
- **Aucun écran n'a été vu en fonctionnement**, aucun compte n'a été ouvert,
  aucun devis n'a été généré. Les parcours viennent des centres d'aide, des
  captures et des démonstrations des éditeurs. Plusieurs démonstrations sont
  des maquettes (Calyflux, et HERO avec sa mention « Beispiel-Ansicht » :
  vue d'exemple).
- Les transcriptions des vidéos YouTube n'ont pas pu être lues (vérification
  anti-robot). Celle du tutoriel Obat sur Loom ne se relit pas sans compte :
  le passage de la TVA à 10 % « à la main » n'en vient que par une première
  lecture, que la vérification n'a pas pu refaire.
- Trustpilot, Capterra et G2 ont parfois refusé l'accès. Certains avis n'ont
  été lus que par un outil de lecture interposé.
- **Les éditeurs français historiques** (Tolteck, Batigest, EBP, Extrabat,
  Henrri) n'ont pas été revérifiés au 17/10 : on ne sait pas s'ils ont une IA
  de devis. `SOURCES-DONNEES-BTP.md` §3.1 dit d'où viennent les prix de
  certains d'entre eux, pas s'ils les font chiffrer par une IA.

**Sur la qualité réelle.**
- Aucune mesure indépendante de la justesse des quantités ou des prix, à part
  deux tests de Costructor (dont un affilié) et un test affilié de Vulko.
- Aucune plainte publique sur le brouillon de devis de Jobber (les deux
  plaintes du §3 portent sur sa voix et sur son prix), ni sur le générateur ou
  le relecteur de Buildxact (un avis dit seulement « AI isnt always
  accurate » : l'IA n'est pas toujours juste, à propos du support) ; aucune
  sur Batappli, Calyflux et HERO, faute d'avis. Ce n'est pas une preuve de
  qualité.
- **L'IA généraliste** (§3.8) n'a pas été mesurée.

**Sur l'origine des prix.**
- Non dite : Costructor, Boby, Jobber ; la « bibliothèque Renalto », le
  « référentiel » d'ATTIX, les fourchettes de Vulko et d'Angebotsmeister, les
  « prix moyens » de Batappli, les « données locales » de Buildxact.
- Les modèles d'IA ne sont nommés que chez Calyflux, Angebotsmeister, Vulko,
  ATTIX et Houzz.
- Chez Calyflux et Donizo, on ne sait pas si l'import d'anciens devis nourrit
  les prix proposés ensuite : Calyflux n'en dit rien, et chez Donizo c'est une
  déduction.
- La mention « Prix non vérifié » de Renalto est écrite dans son centre d'aide
  (article mis à jour le 11/10/2026), alors que `SOURCES-DONNEES-BTP.md` §3.1
  ne l'a pas trouvée sur ses pages commerciales. Les deux sont vrais ; ce
  qu'on ne sait pas, c'est comment elle s'affiche sur un téléphone.

**Sur les prix et les offres.**
- Les prix de Buildxact viennent d'un miroir de préproduction daté de 2025.
- L'offre de Jobber qui inclut « Draft for me » n'a pas été revérifiée au
  17/10.
- Le devis par IA de Houzz est absent de l'aide française. Ce n'est pas une
  preuve qu'il est absent du logiciel.
- Une plainte trouvée sur le forum de Jobber (un devis d'arrosage rédigé pour
  une demande de pose de gazon) n'a pu être lue qu'en extrait : elle a été
  **retirée** des plaintes.

**Sur le droit.**
- **La certification de TVA réduite** : `PLAN-DEVIS.md` §10.3, qui fait foi,
  la date du 16/02/2025 ; LégiFiscal date la suppression de l'ancienne
  attestation du 03/03/2025 (article 41 de la loi n° 2025-127). L'écart de
  date reste à recouper sur Légifrance, ce que le conteneur ne peut pas faire
  (403).
- L'article 1113 du code civil est cité comme principe général.
  `PLAN-DEVIS.md` fait foi pour le droit du devis.
- **La mention d'IA** (règlement européen sur l'IA, art. 50, applicable depuis
  le 02/08/2026). Le cadre est posé par `DONNEES-DES-ARTISANS.md` §3.3 :
  signaler qu'on parle à une IA, marquer les textes générés, avec deux
  exceptions (la mise en forme standard, et ce qui ne modifie pas
  substantiellement ce que l'utilisateur a fourni). Ce qui n'est pas tranché :
  **un devis préparé par l'agent puis relu et validé par l'artisan**.
  Angebotsmeister marque les relances qu'il prépare, pas les devis que
  l'artisan envoie. À vérifier avant l'idée n° 6 ; rien n'est affirmé ici.
- **Le moment de la remise** (votre cas ordinaire : visite pour relever,
  devis envoyé plus tard, retourné signé par courriel) relève du considérant
  21 de la directive 2011/83 (voir « Les mots employés ») selon
  `PLAN-DEVIS.md` §10.12, **sous réserve d'un avis juridique**.

**Sur Opus lui-même.**
- Le fait qu'un refus de la fonction Edge `ai` (400, 401, 422, 429)
  n'arrive jamais à l'écran avec son message en français a été **constaté en
  lisant le code**, pas éprouvé à l'exécution : `src/lib/ai.js:74` relance
  l'erreur ; trois écrans affichent alors la phrase anglaise brute de l'outil
  (`AmeliorerTexte.js:93`, `ProfilProScreen.js:130`, `OpusApp.js:2970`), un
  autre une phrase fixe (`AssistantPresentation.js:68`), et seul le récit
  (`RecitChantier.js:115`) passe par la traduction de `src/lib/erreurs.js`,
  qui parle de panne. Cela contredit ce que `CLAUDE.md` dit de la section 38
  (la base « le dit […] en 429 et en français ») : la base le dit, l'écran ne
  le montre pas.
- Les chiffres de la vraie base (6 demandes de devis et 2 de rappel, 1 client,
  2 chantiers) datent du 17/10, par simple comptage, sans lire aucun contenu.

**Annoncé, non vérifié.** Le partenariat entre Costructor et la CAPEB :
« mai 2026 » dans `CONCURRENCE-DEVIS.md`, « 27/08/2026 » dans le relevé du
jour. Aucune des deux dates n'a été revérifiée.
