# Réutiliser les données des artisans — ce qu'on a le droit de faire, et comment

> Question du propriétaire, le 17/10/2026 : « si on retient les prix, les
> termes, les comptes rendus de chantier, mais pas de qui ça vient — c'est-à-dire
> que ça reste anonyme —, peut-on s'en servir pour nourrir notre base de données
> et entraîner nos agents ? »

Le droit a été relevé le 17/10/2026, **uniquement sur des sources
officielles** : cnil.fr, edpb.europa.eu, eur-lex.europa.eu (lu au besoin sur le
site de l'Office des publications de l'Union, qui publie le même Journal
officiel), autoritedelaconcurrence.fr, et Légifrance (lu au besoin sur un
miroir de sa base, voir §8). Quatre recherches ont été faites, chacune relue
par un contradicteur. **Quand le contradicteur a corrigé, c'est sa version
qui figure ici.**

Ce document **n'est pas un avis d'avocat**. Il distingue trois choses :

- ce que les textes disent, avec leur source ;
- ce qu'on en déduit, marqué **« analyse »** ;
- ce qui n'a pas pu être vérifié, rassemblé au §8.

Il complète `docs/DEVIS-DU-PROPRIETAIRE.md` §5 et §6 et la dernière section de
`docs/A-FAIRE.md` (« La base de connaissances du BTP »), qui le citent déjà.

### Les mots employés

| mot | ce qu'il veut dire ici |
|---|---|
| **RGPD** | le règlement européen sur la protection des données (2016/679) |
| **donnée personnelle** | toute information qui se rapporte à une personne physique identifiée ou identifiable, « directement ou indirectement » (art. 4.1) |
| **responsable de traitement** | celui qui décide pourquoi et comment on traite des données. Pour les comptes, les fiches, le fil : c'est Opus |
| **sous-traitant** | celui qui traite des données **pour le compte** d'un autre, sur ses instructions. Pour le carnet de clients d'un artisan, l'artisan est responsable et Opus sous-traitant (`src/data/legal.js`, l. 705) |
| **CNIL** | l'autorité française de protection des données |
| **CEPD** | le Comité européen de la protection des données (EDPB en anglais), qui réunit les CNIL d'Europe |
| **G29** | l'ancêtre du CEPD, avant 2018. Son avis 05/2014 sur l'anonymisation fait encore référence |
| **agrégat** | un chiffre calculé sur plusieurs valeurs : une moyenne, une médiane, une fourchette |

---

## 0. En une page

**Oui, en partie. Mais pas en gardant tout sauf le nom.**

1. **Retirer le nom ne rend pas anonyme.** Opus garde les devis d'origine. Pour
   lui, une ligne de prix sans nom reste donc une donnée personnelle, avec
   toutes les obligations du RGPD. Seuls des **chiffres regroupés** peuvent
   devenir anonymes : une fourchette par poste, par région et par trimestre,
   calculée sur assez d'artisans **différents** pour qu'on ne puisse deviner
   personne. → §1
2. **Les prix et le vocabulaire de l'artisan : oui, s'il le choisit.** Une case
   à part, non cochée, qu'on peut décocher à tout moment, expliquée **avant**
   la première saisie. Refuser ne change rien au service. Et rien de
   rattachable à lui ne ressort jamais de la base. → §2.1, §2.2
3. **Les données de ses CLIENTS : non, pas pour notre propre compte.** Opus en
   est le sous-traitant. Les réutiliser pour sa base, même « anonymisées »,
   c'est l'un des manquements pour lesquels la CNIL a infligé un million
   d'euros à un sous-traitant le 11/12/2025 (avec d'autres : une copie gardée
   après le contrat, l'absence de registre). Une voie légale existe, mais elle
   est lourde. → §2.4
   **Conséquence à connaître** : « les prix des devis ACCEPTÉS », la donnée que
   `A-FAIRE.md` présente comme la plus précieuse, est aussi la plus encadrée,
   parce qu'un prix signé est une donnée du client.
4. **Comptes rendus et photos : jamais tels quels.** On peut en **tirer** du
   savoir (étapes types, durées, matériaux), pas les **ranger**. → §2.3
5. **« Entraîner nos agents », c'est aujourd'hui une base que Claude
   consulte.** On n'y met que des fourchettes et du savoir rangé. Affiner un
   modèle d'IA est beaucoup plus lourd, et vient en dernier, si jamais. → §3
6. **La concurrence.** Une base de prix entre concurrents doit rester agrégée,
   ancienne et sans prix conseillé. Et **vous êtes vous-même artisan** : vous
   ne devez pas pouvoir lire les prix des autres, même comme administrateur. → §5
7. **Le moment est idéal**, parce que rien n'est encore collecté : le module
   devis n'existe pas, et Opus est en essai (`STATUT = 'essai'`). Mais les
   textes actuels promettent le contraire sur trois points. Il faut les
   réécrire et les faire relire **avant** les premiers vrais utilisateurs. → §4

| ce qu'on voudrait retenir | entre dans la base commune ? | à quelle condition | ce qui reste exclu |
|---|---|---|---|
| le prix que l'artisan fixe pour un poste (son tarif) | **oui** | son accord explicite ; seules des fourchettes régionales en ressortent | une ligne rattachable à lui ; un « prix conseillé » |
| le prix d'un devis signé par un client | **très difficile** | autorisation écrite de chaque artisan pour ce traitement précis, information de ses clients ; Opus devient responsable | sans tout cela, rien |
| les termes (le vocabulaire des postes) | **oui** | un lexique normalisé, détaché de tout devis, avec une licence dans les CGU | la phrase mot pour mot d'un artisan, redonnée à un autre |
| les comptes rendus de chantier | **ce qu'on en tire** | un savoir rangé (étapes, durées, matériaux), relu, sans aucun morceau du texte | le texte lui-même |
| les photos de chantier | **non, pour l'instant** | — | façades, personnes, plaques, documents, métadonnées |
| les données des clients (nom, adresse, téléphone, travaux) | **non** | — | tout |

---

## 1. Pourquoi « retirer le nom » ne suffit pas

### 1.1 Anonyme ou pseudonyme : deux choses différentes

**Une donnée anonyme sort du RGPD. Une donnée pseudonymisée y reste.**

- **Anonyme** : plus personne ne peut retrouver la personne, ni directement ni
  indirectement, avec des moyens « raisonnablement susceptibles d'être
  utilisés par le responsable du traitement ou par toute autre personne ». On
  juge ces moyens sur le coût, le temps et les technologies, y compris celles
  à venir. Le RGPD « ne s'applique, par conséquent, pas au traitement de
  telles informations anonymes, y compris à des fins statistiques ».
  — RGPD, considérant 26,
  <https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679>
- **Pseudonymisé** : on a remplacé le nom, le SIRET ou l'identifiant par un
  code, mais quelqu'un détient de quoi faire le lien. La donnée reste
  personnelle, et tout le RGPD s'applique : base légale, durée de
  conservation, droits des personnes, sécurité.
  — RGPD art. 4.5 et considérant 26 ; G29, avis 05/2014, p. 3 : « la
  pseudonymisation n'est pas une méthode d'anonymisation »
  (<https://www.cnil.fr/sites/default/files/atoms/files/wp216_fr.pdf>) ;
  CNIL : la pseudonymisation « est également réversible, contrairement à
  l'anonymisation »
  (<https://www.cnil.fr/fr/technologies/lanonymisation-de-donnees-personnelles>).

**« On garde tout sauf de qui ça vient » décrit une pseudonymisation.**

La Cour de justice a nuancé : une donnée pseudonymisée peut ne pas être
personnelle pour un **destinataire** incapable de faire le lien. Mais elle
**le reste pour celui qui détient la clé** (CJUE, 4/9/2025, C-413/23 P,
dit « arrêt CRU », points 76 et 86,
<https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:62023CJ0413>).
Le CEPD en tire la règle : si une donnée n'est anonyme que pour celui qui la
reçoit, celui qui l'a anonymisée « will still have to treat the given data as
personal data » (lignes directrices 02/2026, §37,
<https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202602_anonymisation_v1_en_0.pdf>
— version soumise à consultation jusqu'au 30/10/2026).

> **Pour Opus, qui garde les devis et les fiches, tout ce qui entre dans la
> base reste personnel.** Seul ce qui en **sort** peut être anonyme, pour ceux
> qui le reçoivent.

### 1.2 Le test : isoler, relier, déduire

Les autorités européennes vérifient l'anonymat par trois critères (G29, avis
05/2014, p. 13 ; CNIL, page anonymisation ; CEPD 02/2026, résumé) :

1. **Isoler** : peut-on repérer une personne dans le jeu ?
2. **Relier** : peut-on rattacher deux informations à la même personne,
   en croisant avec une autre source ?
3. **Déduire** : peut-on apprendre quelque chose de nouveau sur une personne,
   avec une quasi-certitude ?

Quand un critère n'est pas rempli, il faut une analyse approfondie, et
démontrer que le risque est « négligeable » (CNIL). Un échec sur « déduire »
est le plus grave : selon le CEPD, la donnée ne doit alors pas être tenue pour
anonyme (02/2026, §97). Le risque n'a pas à être nul : il doit être
« insignifiant en réalité » (arrêt CRU, point 82 ; CEPD 02/2026, §22).

### 1.3 Un exemple du bâtiment

Une ligne versée à la base, sans aucun nom :

> **Pose de placo sur ossature — 32 €/m² — Charleval — octobre 2026**

- **Isoler** : s'il n'y a qu'un plaquiste d'Opus à Charleval, la ligne le
  désigne.
- **Relier** : sa fiche publique sur Opus affiche déjà son métier, sa commune
  et son rayon d'intervention. Le CEPD tient une donnée publique pour
  accessible à tous (02/2026, §89). Le client, lui, a le devis en main.
- **Déduire** : on apprend ce que cet artisan facture, c'est-à-dire ce qu'un
  concurrent cherche justement.

Le CEPD le montre avec deux attributs banals : un seul passant dans la rue
porte un costume ET promène un chien (02/2026, exemple 5). Il range parmi ceux
qui peuvent ré-identifier « partners, friends, colleagues, neighbours »
(§30). Et il refuse l'argument « personne n'aura envie de chercher » : il faut
au contraire peser ce que vaut la donnée retrouvée (§31). Pour des prix entre
concurrents, elle vaut beaucoup.

Et la même ligne concerne aussi le **client** :

> **Réfection de toiture 80 m² — Charleval — mars 2027 — 14 200 €**

Elle désigne un foyer dans un village, et dit ce qu'il a payé. C'est aussi
**sa** donnée personnelle (CEPD 02/2026, §16 : une information sur un bien,
une maison par exemple, se rapporte à son propriétaire quand elle sert à
l'évaluer ou peut avoir un effet sur lui).

C'est exactement la règle que vous avez posée le 17/10 dans `A-FAIRE.md` :
« aucun chiffre ne doit permettre de DEVINER la source ».

### 1.4 Ce que l'agrégation règle, et ce qu'elle ne règle pas

- Un agrégat bien fait passe en général le premier critère (CEPD 02/2026,
  §58).
- **Mais on peut retrouver une valeur individuelle par différence entre deux
  agrégats.** Exemple du CEPD : le total des salaires de six ingénieurs, moins
  celui de cinq, donne le salaire du sixième (exemple 16). Même chose en
  publiant le même agrégat deux fois, avant et après l'arrivée ou le départ
  d'un artisan (§77). Et une valeur **absente** renseigne aussi (§78).
- Le « k-anonymat » (au moins k personnes par case) ne protège pas contre la
  déduction, et un k faible est dangereux (G29, p. 18-19).
- **Un seul artisan mal protégé suffit** : le jeu entier n'est anonyme que si
  l'anonymisation marche pour tous (CEPD 02/2026, §36 et §87). Le seul
  couvreur de son département rend tout le jeu personnel, sauf à le traiter à
  part ou à l'écarter.
- Ce qui est permis : une déduction qui découle d'un savoir général sur la
  population ne viole pas le critère « déduire » (§67, §70). **Un prix moyen
  par région et par trimestre, calculé sur assez d'artisans, relève de ce
  cas.** C'est la forme à viser, et pas une base ligne par ligne.

**Aucun seuil chiffré officiel n'a été trouvé** (nombre minimal d'artisans,
maille, délai) : ils restent à fixer et à justifier par écrit (§7, §8).

### 1.5 Anonymiser est déjà un traitement

> **« On anonymise, donc le RGPD ne s'applique plus » ne vaut qu'APRÈS.**

- « L'anonymisation est un traitement » (CNIL, page anonymisation). Elle doit
  avoir une base légale (CEPD 02/2026, §38). Si le jeu contient des données de
  santé, il faut en plus une exception de l'art. 9.2, même pour la seule
  opération d'anonymisation.
- On ne peut pas présumer qu'elle repose sur la même base légale que le
  traitement d'origine si elle sert une autre finalité (§38). Une base vendue
  par API ne sert pas la même finalité qu'un outil de devis.
- Il faut **dire** que des données personnelles seront traitées pour produire
  des données anonymes, et ne jamais écrire « anonyme » si quelqu'un reste
  identifiable (§40). Il faut **documenter** le procédé et ses essais de
  ré-identification (§41).
- Ce n'est pas acquis une fois pour toutes : il faut réévaluer (G29, p. 4 et
  p. 27 : « Ne pas se contenter de "publier et oublier" » ; CNIL : veille
  « indispensable »). Si le risque cesse d'être insignifiant, la donnée
  redevient personnelle (CEPD 02/2026, §35). **Un jeu publié comme
  « anonyme » qui ne l'est pas peut constituer une violation de données à
  notifier** (CNIL, page anonymisation ; CEPD 02/2026, §42). Pour une API
  vendue, ce serait un incident, pas une simple correction.
- Une clause « interdiction de ré-identifier » dans le contrat des acheteurs
  aide, mais ne remplace pas les protections techniques (CEPD 02/2026, §34).

### 1.6 La forme qui en découle : trois boîtes, et non deux

| boîte | à qui | ce qu'elle contient | statut |
|---|---|---|---|
| **1. La base personnelle** (`DEVIS-DU-PROPRIETAIRE.md` §5) | l'artisan seul | ses postes, ses phrases mot pour mot, ses prix, leur devis d'origine | personnelle et privée. **Ne nourrit jamais la base commune par défaut** (§5, règle 4) |
| **2. La réserve des contributions** | Opus, pour calculer | ce que l'artisan a choisi de verser, avec un lien caché vers lui (pour pouvoir **retirer**) | **pseudonymisée, donc personnelle.** Ne jamais l'appeler « anonyme » à l'écran |
| **3. Les fourchettes** | les artisans d'Opus, l'agent, un jour les acheteurs de l'API | des chiffres regroupés qui ont passé les trois critères | anonymes pour ceux qui les reçoivent, si les essais le prouvent |

Vos documents demandent des contributions « consenties, retirables et
anonymes » (`A-FAIRE.md`). **Les trois mots ne valent pas pour la même
boîte.** Pour qu'un artisan puisse retirer sa contribution, il faut garder le
lien : la boîte 2 est donc personnelle. Seule la boîte 3 est anonyme.

**Et un retrait ?** Le retrait d'un consentement « ne compromet pas la
licéité du traitement fondé sur le consentement effectué avant ce retrait »
(RGPD art. 7.3). Un agrégat vraiment anonyme déjà publié est sorti du RGPD :
la loi ne force pas à le recalculer, c'est la promesse faite à l'artisan qui
le décidera. **Piège** : recalculer et republier juste après le départ d'UN
artisan permet de retrouver sa part par différence (§1.4). On recalcule donc
**par lots, à date fixe**.

---

## 2. Type par type

Un devis mélange **deux régimes** :

- **le prix que l'artisan fixe**, une information sur LUI, dans sa relation
  directe avec Opus ;
- **le fait que CE client a payé CE prix pour CES travaux chez lui**, une
  information sur le CLIENT, pour laquelle Opus n'est que sous-traitant
  (§2.4).

Anonymiser l'artisan sans s'occuper du client ne règle que la moitié du
problème.

**Le prix d'un artisan est-il une donnée personnelle ?**

- **Pour un micro-entrepreneur ou un entrepreneur individuel : oui**, tant
  qu'il est rattachable à lui. Il n'a pas de personnalité morale distincte. La
  Cour de justice n'admet la protection d'une personne morale que « dans la
  mesure où le nom légal de la personne morale identifie une ou plusieurs
  personnes physiques » (CJUE, 9/11/2010, Schecke, C-92/09, point 53). Une
  décision du Conseil d'État de 2002 disait l'inverse, mais sous l'ancienne
  loi de 1978 : il ne faut pas s'y fier.
- **Pour une SARL ou une SAS : non**, en soi. Le RGPD « ne couvre pas le
  traitement des données à caractère personnel qui concernent les personnes
  morales, et en particulier des entreprises dotées de la personnalité
  juridique » (considérant 14). Mais le **secret des affaires**, le
  **contrat** et la **concurrence** s'appliquent quand même (§2.1, §4, §5).

> **Conséquence : dans les deux cas, il faut l'accord de l'artisan.** Le
> chemin juridique change, pas la réponse.

### 2.1 Les PRIX

**Ce qui est possible.** L'artisan verse à la réserve **ses prix de
référence par poste**, c'est-à-dire son tarif, celui qu'il fixe et qui revient
à chaque devis (`DEVIS-DU-PROPRIETAIRE.md` §5, règle 2). On ne verse que le
poste normalisé, l'unité, le prix unitaire HT, la **région**, le
**trimestre** et le métier. Il n'en ressort que des fourchettes.

**Analyse, non vérifiée par une source** : un prix de référence détaché de
tout devis, sans quantité ni date exacte, ne concerne plus aucun client. Un
prix lu dans un devis précis, lui, le concerne (§2.4).

**À quelles conditions.**

1. **L'accord de l'artisan, et un vrai accord.**
   - Demandé à part : quand le consentement figure dans un écrit qui parle
     d'autre chose, la demande doit être présentée « sous une forme qui la
     distingue clairement de ces autres questions » (RGPD art. 7.2).
   - Retirable aussi simplement : « Il est aussi simple de retirer que de
     donner son consentement » (art. 7.3).
   - Libre : on vérifie « si l'exécution d'un contrat, y compris la fourniture
     d'un service, est subordonnée au consentement » (art. 7.4). Le consentement
     est présumé non libre s'il conditionne un service qui n'en a pas besoin
     (considérant 43). **Le devis, le carnet et la base personnelle doivent
     marcher pareil pour celui qui dit non.**
   - La CNIL admet aussi, pour développer une IA, la voie de l'« intérêt
     légitime ». Elle demande alors de pouvoir « s'opposer préalablement et
     de manière discrétionnaire au traitement […] sans que cela ne porte
     atteinte à l'utilisation du service »
     (<https://www.cnil.fr/fr/base-legale-interet-legitime-developpement-systeme>).
     Le choix de la base légale revient à un avocat (§7). Vos documents ont
     déjà choisi le consentement, et c'est le plus solide face au secret des
     affaires et au Data Act (point 3 ci-dessous, et §4).
2. **L'information AVANT.** Pour utiliser des données à une autre fin que
   celle de la collecte, le responsable « fournit au préalable à la personne
   concernée des informations au sujet de cette autre finalité » (RGPD
   art. 13.3). Pour les données de l'artisan, il n'existe pas de dispense pour
   « efforts disproportionnés » : celle-ci ne vaut que pour la collecte
   indirecte (art. 14.5 b).
3. **Le secret des affaires.** Des prix, coefficients et marges peuvent être
   un secret des affaires (code de commerce L151-1 : information pas aisément
   accessible, qui a une valeur parce qu'elle est secrète, et protégée par son
   détenteur). Opus les obtient légalement, puisque l'artisan les saisit
   lui-même. Leur **utilisation** devient illicite si elle se fait « en
   violation d'une obligation de ne pas divulguer le secret ou de limiter son
   utilisation » (L151-5). **C'est donc la clause du contrat qui crée le
   risque, ou qui l'écarte.** Et c'est désormais à Opus de garder ces prix
   secrets : accès limités, journal, aucun export individuel.
4. **La concurrence** : agrégé, ancien, jamais de prix conseillé (§5).

**Le cas des prix des devis SIGNÉS.** `A-FAIRE.md` dit très justement que la
force d'Opus serait de connaître « les prix des devis ACCEPTÉS », c'est-à-dire
le vrai prix du marché. Mais un devis accepté, c'est **un client qui a signé
ce prix**. Lire ce prix dans le devis pour le verser à la base, c'est traiter
une donnée du client, pour le compte d'Opus. Or anonymiser est déjà un
traitement (§1.5), et pour un sous-traitant, le caractère personnel s'apprécie
du point de vue du responsable, l'artisan, qui sait toujours de quel client il
s'agit (CEPD 02/2026, §15). **Cette donnée-là passe donc par toute la
procédure du §2.4, ou ne passe pas.** C'est une analyse appuyée sur ces
textes, à faire confirmer.

**Ce qui est exclu.**

- toute ligne individuelle redonnée à un autre artisan ou vendue, même
  « sans nom » ;
- les devis en cours, non signés ou trop récents : ce sont des prix actuels
  (§5) ;
- une maille à la commune ;
- un « prix conseillé » ou un devis pré-rempli avec le prix des autres ;
- mélanger la base personnelle dans une moyenne du réseau sans que l'artisan
  l'ait choisi (`DEVIS-DU-PROPRIETAIRE.md` §5, règle 4, qui tient).

### 2.2 Les TERMES des postes

**Ce qui est possible : un lexique normalisé.** Par exemple, « chape sèche
avant carrelage » = tel poste, en m². Il est détaché de tout devis et de tout
artisan. Le vocabulaire technique d'un métier n'est en général pas une
information commercialement sensible : « les données éducatives, techniques ou
scientifiques non stratégiques » (lignes directrices horizontales de la
Commission, 2023, point 386,
<https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:52023XC0721(01)>).

**À quelles conditions.** Une licence dans les CGU, parce qu'aujourd'hui Opus
ne reçoit qu'une autorisation d'**afficher** (§4). Et le même accord que pour
les prix, si le lexique est tiré des postes de l'artisan.

**Ce qui est exclu, et pourquoi (analyse).** Redonner à un autre artisan **la
phrase mot pour mot** d'un artisan :

- c'est sa façon d'expliquer, et ses clients la connaissent
  (`DEVIS-DU-PROPRIETAIRE.md` §5, règle 1). Une phrase reconnaissable se
  relie à lui, donc le critère « relier » tombe ;
- si elle est originale, elle peut être protégée par le droit d'auteur.

Sont exclues aussi les phrases qui contiennent un nom, une adresse, ou
« chez M. X ».

### 2.3 Les COMPTES RENDUS et les PHOTOS de chantier

#### Les comptes rendus

**Pourquoi ils ne s'anonymisent pas en retirant les noms.**

- Un texte accumule des détails dont l'ensemble est unique. Plus un
  enregistrement a d'attributs, plus il risque d'être unique (CEPD 02/2026,
  §24, §56). Un jeu qui contient un nom, un e-mail ou un téléphone n'est
  « immediately apparent[ly] » pas anonyme (§50).
- Un compte rendu peut contenir **des données de santé** : « Mme X, en
  fauteuil », une salle de bain adaptée, une absence pour hospitalisation. Le
  RGPD range explicitement « un handicap » parmi les données de santé
  (considérant 35). Ce sont des données sensibles (art. 9.1), et il faut une
  exception de l'art. 9.2 même pour les anonymiser (CEPD 02/2026, §38).
- Les récits de chantier d'Opus sont **publics**, puisque c'est leur rôle de
  vitrine. Un morceau de texte, ou même la combinaison commune + période +
  ouvrage, se relie au récit d'origine par une simple recherche. **Le critère
  « relier » échoue contre les propres pages d'Opus.**
- **Droit d'auteur** : un texte original est une œuvre. L'exception de
  « fouille de textes et de données » permet d'analyser, sauf opposition de
  l'auteur, mais les copies sont « détruites à l'issue de la fouille » (CPI
  L122-5-3). Elle couvre au mieux une **analyse**, jamais le fait de garder les
  textes dans une base ou de les servir par API.

**Ce qui est possible.** Tirer du compte rendu un **savoir rangé** : les
étapes types d'une réfection de toiture, leurs durées, les matériaux, les
unités. Ce savoir est relu, ne contient **aucun morceau** du texte d'origine,
et passe les trois critères du §1.2. Avec une licence et une information
claires.

**Ce qui est exclu.** Le texte brut dans la base, dans les requêtes envoyées à
l'agent, ou dans l'API. Et le jour où le module de gestion aura des comptes
rendus, leurs champs devront être conçus pour **ne pas appeler** de données
de santé.

#### Les photos

**Pourquoi elles sont des données personnelles à plusieurs titres.**

- L'image d'une personne, une plaque d'immatriculation, une adresse en sont
  (CNIL, <https://www.cnil.fr/fr/definition/donnee-personnelle>).
- La géolocalisation enregistrée dans le fichier (les métadonnées dites
  « EXIF ») est une « donnée de localisation » (RGPD art. 4.1).
- Même sans personne visible, une photo peut révéler « la localisation de la
  photographie, sa date, voire son auteur » par recoupement ou recherche
  d'image inversée
  (<https://cnil.fr/fr/recoupement-dinformations-en-ligne-ce-que-vous-publiez-peut-devoiler-votre-vie-privee>).
- **Une façade situe une maison, donc son propriétaire : elle n'est
  pratiquement pas anonymisable.**
- Une photo est en principe une œuvre, et les CGU n'en cèdent que l'affichage.

**Ce que le code fait aujourd'hui, et ça compte dès maintenant** (lu, pas
mesuré) :

- `src/lib/media.js` l. 98 : une photo de **moins de 200 Ko part telle
  quelle**, sans être ré-encodée ;
- l. 113 : si la réduction échoue, **l'original part** ;
- les vidéos partent brutes vers Cloudinary.

Le ré-encodage JPEG efface probablement les métadonnées sur iPhone, mais deux
chemins y échappent. Or l'espace de stockage `publications` est public. Une
petite photo qui garderait sa position GPS serait **déjà** lisible par
quiconque a son adresse. La CNIL recommande de « supprimer les métadonnées
associées à l'image (localisation, horodatage, données EXIF) si elles ne sont
pas nécessaires » (recommandation applications mobiles, modifiée le
27/03/2025,
<https://www.cnil.fr/sites/cnil/files/2025-04/recommandation-applications-mobiles-modifiee.pdf>).
**C'est un point du service actuel, à traiter avant la base** (§7).

**Ce qui est possible : rien pour l'instant.** Plus tard, au mieux, des gros
plans techniques relus, sous licence, métadonnées retirées côté serveur, avec
visages, plaques, numéros de rue et documents floutés.

### 2.4 Les données des CLIENTS

**La règle.** Pour le carnet de clients, et demain pour les devis et les
comptes rendus, Opus est sous-traitant (`legal.js` l. 705 et 724).

- Le sous-traitant « ne traite les données […] que sur instruction documentée
  du responsable du traitement » (RGPD art. 28.3 a). Ce n'est pas seulement
  une clause de contrat, c'est une obligation directe du règlement (art. 29).
- La CNIL : il « ne peut pas réutiliser ces données pour son propre compte,
  de sa propre initiative »
  (<https://www.cnil.fr/fr/sous-traitants-la-reutilisation-de-donnees-confiees-par-un-responsable-de-traitement>,
  11/01/2022).
- S'il le fait quand même, il devient responsable de ce traitement « en
  violation du présent règlement » (art. 28.10). Le CEPD donne l'exemple d'un
  prestataire qui réutilise la base clients d'un client « pour développer sa
  propre activité commerciale » : ce traitement « constituerait une violation
  du RGPD » (lignes directrices 07/2020, point 81).

**Le précédent, presque trait pour trait.** Le 11/12/2025, la CNIL a infligé
**un million d'euros** à MOBIUS SOLUTIONS, sous-traitant de Deezer. La société
avait copié et utilisé les données de son client « afin d'améliorer les
performances de ses propres services ». Elle plaidait « l'amélioration
générale des services ». Réponse de la CNIL : « aucune clause contractuelle
n'autorisait » cet usage
(<https://www.cnil.fr/fr/violation-de-donnees-sanction-dun-million-deuros-lencontre-de-la-societe-mobius-solutions-ltd>).
L'amende sanctionne trois manquements : la réutilisation (art. 29), une copie
gardée après la fin du contrat (art. 28.3 g) et l'absence de registre
(art. 30). Elle tient aussi compte d'une fuite touchant 46 millions de
personnes. Ce n'est donc pas un tarif, mais l'argument « c'est pour améliorer
le service de tous » est exactement celui qui a été rejeté.

**La voie légale, et ce qu'elle coûte** (CNIL, même page) :

1. la réutilisation doit être **compatible** avec le traitement d'origine,
   **et** le responsable, chaque artisan, doit l'avoir autorisée **par écrit**
   (la forme électronique est admise) ;
2. pour un traitement **précisément décrit** : « une autorisation préalable et
   générale de réutilisation des données n'est pas légale ». Une phrase du
   type « Opus peut utiliser vos données pour améliorer ses services », dans
   les CGU ou le contrat, ne vaut rien ;
3. c'est **l'artisan** qui fait le test de compatibilité (art. 6.4 : lien
   entre les finalités, contexte, nature des données, conséquences,
   garanties). Opus peut le lui préparer, pas le faire à sa place. Même quand
   le test est favorable, l'artisan reste libre de refuser. Le test n'est pas
   exigé si la finalité a été annoncée dès la collecte
   (<https://www.cnil.fr/fr/assurer-que-le-traitement-est-licite-reutilisation-des-donnees>),
   mais l'autorisation écrite du responsable, elle, reste toujours exigée ;
4. **Opus devient responsable** du nouveau traitement, avec toutes les
   obligations : base légale, information, durée, droits, sécurité ;
5. **les clients de l'artisan doivent être informés**, et savoir s'ils peuvent
   s'opposer. En principe par l'artisan, qui peut déléguer à Opus. Le carnet
   contient leurs e-mails : la CNIL attend alors une information
   **individuelle** (<https://www.cnil.fr/fr/ia-informer-les-personnes-concernees>),
   au plus tard dans le mois (art. 14.3).

**Les repères de la CNIL sur la compatibilité** : améliorer ses propres
prestations « pourrait être considérée compatible », avec des garanties comme
l'anonymisation ; la prospection commerciale « satisferait difficilement » le
test. **Une base vendue à des tiers n'est tranchée par aucun texte trouvé**
(§8). Elle est plus éloignée de « gérer mes clients » que l'amélioration du
service : risque élevé, à mon analyse.

**Deux points qui s'ajoutent.**

- Une base commune alimentée par tous les artisans est, pour la CNIL,
  « généralement un indice décisif » d'un traitement dont le prestataire est
  responsable
  (<https://www.cnil.fr/fr/determiner-la-qualification-juridique-des-fournisseurs-de-systemes-dia>).
  Aucune formule du contrat ne peut maintenir Opus « sous-traitant » pour
  cette base, et la CNIL n'est pas liée par ce que dit le contrat.
- **Une obligation qui vaut dès aujourd'hui, sans attendre la base** : en tant
  que sous-traitant du carnet, Opus doit tenir un **registre** des traitements
  qu'il fait pour le compte des artisans (art. 30.2). La dispense des moins de
  250 salariés ne joue pas pour un traitement « qui n'est pas occasionnel »
  (art. 30.5). C'est le troisième manquement retenu contre MOBIUS.

> **Recommandation : la base commune se construit SANS les données des
> clients.** Ni carnet, ni lignes de devis rattachées à un client, ni comptes
> rendus, ni photos prises chez eux. Le jour où l'on voudrait les prix
> signés, ce sera une décision explicite, avec la procédure ci-dessus et un
> avocat.

---

## 3. « Entraîner nos agents » : ce que ça veut dire pour Opus

Opus **n'entraîne aucun modèle**. Son agent, c'est Claude, appelé par l'API
d'Anthropic depuis la fonction Edge `ai`. « Entraîner nos agents » peut donc
vouloir dire trois choses, de la plus simple à la plus lourde.

### 3.1 L'agent CONSULTE une base (ce qui est réaliste)

La fonction Edge cherche des extraits de la base et les place dans la requête
envoyée à Claude.

- Celui qui connecte un modèle à sa propre base « sera lui aussi responsable
  de son traitement lorsqu'elle contient des données personnelles »
  (CNIL, questions-réponses du 18/07/2024,
  <https://www.cnil.fr/fr/les-questions-reponses-de-la-cnil-sur-lutilisation-dun-systeme-dia-generative>).
  Avec une API, la maîtrise est « quasi exclusivement dans les mains du
  fournisseur » : la CNIL recommande d'éviter « autant que possible » d'y
  envoyer des données personnelles. Pour une base de documents sensibles,
  elle juge « plus opportun » de travailler « sur site ».
- **Chaque extrait part chez Anthropic, aux États-Unis.** `legal.js` ne
  déclare cet envoi que pour « Améliorer avec l'IA » et l'assistant de
  présentation. Envoyer des données venues d'AUTRES artisans serait un usage
  nouveau, à déclarer.

> **Si la base consultée ne contient que des fourchettes (boîte 3) et du
> savoir rangé (§2.3), aucune donnée personnelle ne part chez Anthropic,** et
> la question de l'IA ne se pose plus du côté du RGPD. Ces règles valent pour
> l'usage interne comme pour une API vendue.

C'est aussi ce qui garde l'exercice des droits simple : dans une table, une
opposition se règle en supprimant des lignes, ce qu'Opus sait déjà faire et
vérifier.

### 3.2 Affiner un modèle (beaucoup plus lourd)

- C'est une phase de développement d'IA, couverte par les fiches de la CNIL
  (<https://www.cnil.fr/fr/quel-est-le-perimetre-des-fiches-pratiques-sur-lia>).
- Un modèle entraîné sur des données personnelles « ne peu[t] pas, et ce dans
  tous les cas, être considéré[] comme anonyme[] » : il faut que l'extraction
  de ces données soit d'une probabilité négligeable (CEPD, avis 28/2024,
  synthèse,
  <https://www.edpb.europa.eu/system/files/2025-05/edpb_opinion_202428_ai-models_fr.pdf>).
- La CNIL exige alors une analyse écrite du statut du modèle, avec des tests
  d'attaque en ré-identification
  (<https://www.cnil.fr/fr/ia-analyser-le-statut-dun-modele-dia-au-regard-du-rgpd>).
  Son exemple, un modèle ajusté sur des comptes rendus médicaux
  pseudonymisés, est un exemple de **méthode de test**, pas une fuite avérée.
  Mais il ressemble beaucoup à « des comptes rendus de chantier sans le nom ».
  Si des données peuvent être extraites, il faut envisager une violation à
  notifier, et la CNIL pourrait, selon la gravité, exiger le réentraînement
  ou **la suppression du modèle**.
- Pour effacer ou corriger une donnée dans un modèle, la technique « la plus
  efficace est le réentraînement »
  (<https://www.cnil.fr/fr/ia-respecter-lexercice-des-droits-des-personnes>).
  Chaque opposition sérieuse pourrait coûter un réentraînement.
- Une analyse d'impact serait très probablement nécessaire (deux critères sur
  neuf : croisement de données et usage innovant,
  <https://www.cnil.fr/fr/realiser-une-analyse-dimpact-si-necessaire>).
- L'apprentissage automatique **n'est pas** une « fin statistique » : il ne
  profite pas de la présomption de compatibilité (CNIL, fiche « réutilisation
  des données »).
- Règlement européen sur l'IA : celui qui affine un modèle à usage général
  peut devenir « fournisseur de modèle ». Ses obligations se limitent alors à
  la modification (considérant 109), dont un résumé public des données
  d'entraînement ajoutées (art. 53.1 d). Ce résumé nommerait des catégories
  de sources, pas des artisans (considérant 107). Les seuils précis ne sont
  pas vérifiés (§8).

### 3.3 Ce que le règlement sur l'IA demande de toute façon

Cela ne dépend pas de la base, mais il faut le savoir.

- **Une base servie telle quelle n'est pas un « système d'IA »** : le
  règlement vise ce qui « déduit » des sorties, et pas les systèmes « fondés
  sur les règles définies uniquement par les personnes physiques » (règlement
  2024/1689, art. 3.1 et considérant 12). Si l'API calcule ses réponses avec
  un modèle d'IA, elle en devient un.
- **Un agent vendu sous le nom d'Opus fait d'Opus un « fournisseur »**
  (art. 3.3). Le chiffrage BTP n'est pas « à haut risque » (annexe III).
  **Sauf**, à examiner, un agent qui sélectionnerait ou classerait des
  artisans pour une sous-traitance (annexe III, point 4, « accès à l'emploi
  indépendant »).
- **Transparence (art. 50)**, applicable depuis le 2/8/2026 : signaler qu'on
  parle à une IA quand ce n'est pas évident, et **marquer dans un format
  lisible par machine** les textes générés. Il y a deux exceptions : la
  « mise en forme standard », et le système qui ne modifie « pas de manière
  substantielle les données d'entrée ». « Améliorer avec l'IA » pourrait
  relever de la seconde (analyse) ; un récit composé à partir de plusieurs
  étapes, probablement pas. Les systèmes mis sur le marché avant le 2/8/2026
  ont jusqu'au 2/12/2026 (règlement 2026/1744). **Opus n'est pas encore sur
  le marché : à l'ouverture, ce sera tout de suite.**
- **Maîtrise de l'IA (art. 4, modifié par le règlement 2026/1744)** : prendre
  des mesures pour la favoriser, sans niveau garanti.

### 3.4 L'ordre conseillé

1. **La base personnelle** (`DEVIS-DU-PROPRIETAIRE.md` §5), qui ne se partage
   avec personne : elle sert dès le deuxième devis et ne pose aucune des
   questions de ce document.
2. **Des fourchettes régionales consenties**, que l'agent consulte comme
   repère (§5).
3. **Affiner un modèle** : plus tard, si jamais, et seulement sur une base
   déjà réellement anonyme, avec une analyse d'impact.

Et une promesse à garder vraie : `legal.js` l. 754 dit que le texte envoyé à
l'IA « n'est pas utilisé pour entraîner de modèle ».

---

## 4. Ce que doivent dire les conditions générales et la politique de confidentialité

### 4.1 Pourquoi il faut l'écrire AVANT les premiers vrais utilisateurs

- **Informer avant** : art. 13.3 du RGPD (§2.1).
- **Annoncer dès la collecte évite le test de compatibilité** : « Aucun test
  de compatibilité n'est requis pour les finalités prévues et portées à la
  connaissance des personnes concernées dès la collecte » (CNIL, fiche
  « réutilisation des données »). Annoncé après coup, il faudrait passer au
  test tout ce qui a été collecté avant.
- **Des CGU ne s'imposent pas après coup** : elles n'ont effet que si elles
  ont été « portées à la connaissance » de l'autre partie et qu'elle « les a
  acceptées » (code civil, art. 1119). Et « les contrats ne peuvent être
  modifiés ou révoqués que du consentement mutuel des parties » (art. 1193).
  **Rien de ce qui a été saisi sous l'ancienne version ne se réutilise.**
- **Changer des CGU déjà acceptées** demande un préavis d'au moins quinze
  jours, sur support durable, si Opus est un « service d'intermédiation en
  ligne » (règlement 2019/1150, art. 3.2), ce qui est probable puisqu'il met
  des particuliers en relation avec des artisans (analyse). Sinon, les
  changements sont « nuls et non avenus » (art. 3.3). Le même règlement
  demande de dire si des données sont transmises à des tiers, dans quel but,
  et comment ne pas y participer quand cette possibilité existe (art. 9.2).
- **Une clause trop large ne tiendrait pas.**
  - Data Act (règlement 2023/2854), art. 13 : une clause de données imposée
    unilatéralement à une entreprise « ne lie pas » cette entreprise si elle
    est abusive. Est présumée abusive celle qui permet d'utiliser ses données
    « d'une manière qui porte gravement atteinte [à ses] intérêts légitimes,
    en particulier lorsque ces données contiennent des données commercialement
    sensibles ou sont protégées par des secrets d'affaires » (13.5 b), ou qui
    l'empêche d'en obtenir une copie (13.5 e). Une clause n'est
    « unilatérale » que si l'artisan a tenté en vain de la négocier (13.6,
    considérant 59), mais la preuve est alors à la charge d'Opus. Cela vaut
    pour les contrats conclus après le 12/09/2025 (art. 50).
  - En droit français : interdiction de « soumettre ou de tenter de soumettre
    l'autre partie à des obligations créant un déséquilibre significatif »
    (code de commerce L442-1 I 2°, version issue de la loi du 18/08/2026). Un
    arrêt du 13/05/2026 (Cass. com., n° 24-17.137) écarterait l'art. 1171 du
    code civil entre professionnels au profit de cet article (texte intégral
    non lu, §8).
  - **Une clause étroite tient** : agrégation, ancienneté, aucun prix
    individuel restitué, retrait possible, copie toujours disponible.

### 4.2 Ce que disent les textes actuels, et qui deviendrait faux

| où | ce que c'est écrit | pourquoi ça bloque |
|---|---|---|
| `legal.js` l. 626, « Ce que nous ne collectons pas » | « Opus ne vend ni ne loue vos données à personne. » | une API vendue, même d'agrégats, devra être expliquée en distinguant précisément agrégats et données |
| `legal.js` l. 754, « À qui vos données sont transmises » | le texte envoyé à l'IA « n'est pas utilisé pour entraîner de modèle » | se lira comme un engagement général d'Opus |
| `legal.js` l. 397-402, « Propriété intellectuelle », et l. 499-503, « Ce que vous publiez » | Opus ne reçoit « qu'une autorisation de les afficher dans l'application, le temps qu'ils y sont publiés » | aucune licence pour une base ou un agent ; et **les prix d'un devis ne sont couverts par aucune clause** |
| `legal.js` l. 726-728, texte prévu le jour où le contrat de sous-traitance existera | « L'éditeur ne traite ces données que pour fournir le service, ne les transmet à personne d'autre » | c'est la bonne promesse si l'on renonce aux données des clients (§2.4). À garder |
| `legal.js` l. 643-653, « Pourquoi, et sur quelle base » | aucune base de connaissances, aucun agent | la finalité nouvelle doit y figurer, avec sa base légale |

`npm run verifier-legal` ne verrait aucune de ces contradictions. Il faudra lui
apprendre ce nouvel état, comme il tient déjà `contratSousTraitance`.

### 4.3 Ce que les nouveaux textes doivent dire

1. **Quelles données** : les prix de référence par poste, l'unité, la région,
   le trimestre, le lexique. **Jamais** les données des clients ni, pour
   l'instant, les photos.
2. **Sous quelle forme elles ressortent** : des fourchettes régionales, avec
   un minimum d'artisans derrière chaque chiffre. Et que la réserve
   intermédiaire est **personnelle**, pas « anonyme » (CEPD 02/2026, §40).
3. **À quoi ça sert** : les fourchettes montrées aux artisans d'Opus, l'agent,
   et la revente par API **seulement quand elle sera réelle**. Un intérêt
   doit être « réel et actuel (c'est-à-dire qu'il ne s'agit pas d'un intérêt
   spéculatif) » (CEPD, avis 28/2024, synthèse).
4. **À qui** : les catégories d'acheteurs, d'après la liste que vous aurez
   arrêtée (§7).
5. **Sur quelle base légale**.
6. **Comment dire non et comment retirer** ; que refuser ne change rien au
   service ; ce que devient un retrait (recalcul par lots) ; et que l'artisan
   peut toujours obtenir une copie de ce qu'il a fourni.
7. **Combien de temps** la réserve est gardée.
8. **Où vont les données** : Anthropic, et sous quelles garanties.
9. **La licence sur les textes**, si des comptes rendus servent un jour.

**Le geste** : une case **à part**, non cochée, qu'on peut décocher à tout
moment, au moment où l'artisan saisit ses prix, et versionnée. Le schéma porte
déjà `users.cgu_version` et `cgu_acceptees_le`, la mécanique existe.

---

## 5. La concurrence : pourquoi une base de prix doit rester agrégée, historique et anonyme

### 5.1 Ce que le droit des ententes regarde

- **Les prix sont des « informations commercialement sensibles »** (lignes
  directrices horizontales 2023, point 385). Un échange peut tomber sous
  l'interdiction même sans effet direct sur les prix payés (art. 101 TFUE ;
  en France, code de commerce L420-1).
- **L'échange peut être indirect** : « par l'intermédiaire d'un tiers, tel
  qu'un prestataire de service tiers, (y compris un opérateur de plateforme
  ou un fournisseur d'outil d'optimisation) […] ou à travers un algorithme
  partagé ». Les concurrents ET le tiers « peuvent tous être tenus
  responsables » (point 401). Le tiers l'est s'il savait, ou « pouvait
  raisonnablement prévoir » (point 404). L'artisan l'est aussi s'il a accepté,
  même tacitement, que le tiers partage ses informations (point 403). **Une
  clause de contribution trop large exposerait donc les artisans eux-mêmes.**

### 5.2 Vous êtes vous-même artisan : Opus n'est pas un tiers neutre

C'est le point le plus délicat. Vous êtes du métier — vos propres devis le
montrent, et l'entreprise de votre frère est inscrite sur Opus —, et vous
éditez Opus en votre nom. En droit de la concurrence, une personne qui
exerce deux activités est **une seule entreprise**. Une société que vous
créeriez et contrôleriez formerait avec vous une unité économique.

- Celui qui reçoit des informations sensibles d'un concurrent « sera supposé
  avoir tenu compte de ces informations » (point 397).
- La divulgation peut se faire par « des entrées dans un outil algorithmique
  partagé » (point 396).

> **Il faut une séparation réelle.** Votre compte, administrateur compris, ne
> doit pas pouvoir lire les prix individuels des autres artisans : ni requête
> de confort, ni écran d'administration qui les affiche. Le calcul des
> fourchettes tourne **dans la base**, par une fonction qui ne rend que des
> cases assez remplies, et cette règle se vérifie comme les autres règles RLS
> du projet. C'est le principe de la « clean team » ou du mandataire
> indépendant (points 407 et 408 : chaque participant n'accède qu'à ses
> propres données et aux agrégats des autres).

### 5.3 Ce qui réduit le risque

Ce sont des **facteurs**, pas une zone de sécurité : l'appréciation se fait
« au cas par cas » (point 393).

- **Agréger** : moins risqué « lorsque l'attribution d'informations à des
  entreprises particulières est suffisamment difficile ou incertaine »
  (point 391). L'Autorité de la concurrence admet des statistiques
  historiques « suffisamment agrégées » qui ne permettent pas d'identifier
  les stratégies individuelles (guide « Les essentiels — organismes
  professionnels », 2021, §50,
  <https://www.autoritedelaconcurrence.fr/sites/default/files/2021-09/essentiels-organismes-professionnels-fr.pdf>).
  Des moyennes sont permises « dès lors qu'il n'est pas possible de
  reconstituer des données entreprise par entreprise » (guide PME, fiche 6,
  <https://media.autoritedelaconcurrence.fr/guide-pme/downloads/articles/autorite-de-la-concurrence-guide-concurrence-categorie-a-article-6.pdf>).
- **Attendre** : des données historiques sont peu susceptibles de conduire à
  une collusion (point 393). Une donnée est historique quand elle date de
  plusieurs cycles de fixation des prix du secteur (point 394). « Plus d'un
  an » vient de décisions anciennes (note 255) : c'est un repère, pas un
  seuil. Et le passé ne met pas totalement à l'abri : des données « passées
  mais non publiques et stratégiques » peuvent poser problème (guide PME).
- **Ne jamais toucher au futur** : les échanges sur les prix futurs sont
  « particulièrement susceptibles de déboucher sur une collusion »
  (point 414). Un devis en cours est un prix actuel.
- **Compter les acteurs par zone** : une diffusion « sur une base
  départementale » a été jugée risquée « compte tenu du faible nombre
  d'acteurs » (avis 12-A-12, encadré 2 du guide). Sur un marché étroit, même
  un agrégat révèle qui s'écarte (point 391). **Opus compte aujourd'hui 8
  fiches (relevé du 17/10), presque toutes dans le 13** : rien ne doit être restitué tant que
  les cases ne sont pas assez remplies. La maille se choisit d'après le
  nombre d'artisans présents, jamais pour le confort de l'affichage.

### 5.4 La base ne doit JAMAIS devenir un prix conseillé

- « Le fait d'introduire une règle pour la fixation des prix dans un outil
  algorithmique partagé » peut tomber sous l'interdiction (point 397).
- **Le point qui vise directement Opus** : « l'agrégation d'informations
  commercialement sensibles dans un outil de fixation des prix proposé par
  une seule société spécialisée dans les technologies de l'information et
  auquel plusieurs concurrents ont accès pourrait équivaloir à une collusion
  horizontale » (point 402).
- Un indicateur n'est admis que s'il ne présente « aucun caractère
  normatif » (avis 18-A-04, encadré 14 du guide). Un barème diffusé par un
  organisme professionnel est condamné même s'il est « purement indicatif »
  (§161). Opus n'est pas un organisme professionnel, mais l'idée vaut.
- L'étude commune de l'Autorité et de son homologue allemand avance, comme
  hypothèse, qu'un alignement pourrait survenir « même si le logiciel suggère
  simplement les prix », et qu'un modèle entraîné sur les données non
  publiques de plusieurs concurrents pourrait aligner leurs prix sans
  garde-fous (2019, p. 46-47).

**Concrètement, pour l'agent de devis** : il peut montrer à l'artisan **ses
propres** prix passés, et une fourchette régionale ancienne présentée comme
un **repère** (« Ce n'est pas votre prix : à vous de fixer le vôtre »,
`DEVIS-DU-PROPRIETAIRE.md` §6.3). Il ne doit **jamais** écrire « le prix à
mettre est X », proposer de « s'aligner », ni pré-remplir un devis avec le
prix des autres.

**Et pour les Demandes** : ne jamais montrer à un artisan les prix proposés
par d'autres sur la même demande. Une plateforme qui centralise des demandes
doit être conçue pour ne pas permettre « l'échange d'informations sensibles,
notamment tarifaires, entre acteurs » (avis 25-A-13, §93,
<https://www.autoritedelaconcurrence.fr/sites/default/files/integral_texts/2025-11/25a13.pdf>).

### 5.5 Vendre la base par API

- C'est admis dans son principe : la publication d'informations de marché
  agrégées par une « société spécialisée » peut profiter à tous (point 391),
  et les « données comparatives sur les prix » comptent parmi les gains
  d'efficience (point 425). Une redevance est permise si elle est
  « équitable, transparente et non discriminatoire » (note 245).
- Un acheteur peut être un concurrent : ne vendre que ce qui respecte le §5.3.
- Si la base devenait incontournable, des critères d'accès « équitables,
  objectifs, transparents et non discriminatoires » éviteraient le
  verrouillage (point 383). Ce n'est pas une question aujourd'hui.

### 5.6 Ce que l'on risque

- Jusqu'à **10 % du chiffre d'affaires mondial** (code de commerce L464-2).
- Pour une personne physique qui prend « frauduleusement une part personnelle
  et déterminante » dans une entente : quatre ans d'emprisonnement et
  75 000 € d'amende (L420-6).
- Le seuil de tolérance pour les petits acteurs (10 % de parts de marché,
  L464-6-1) est exclu pour la fixation de prix (L464-6-2 a). Et un marché
  d'artisans est **local** : quelques artisans d'Opus dans une commune peuvent
  y dépasser 10 %.
- Le sujet est surveillé : l'Autorité cite des « risques de […] collusion
  algorithmique » dans son avis 26-A-05 du 17/07/2026 sur les agents d'IA.

---

## 6. La contrepartie qui donne envie de contribuer

`A-FAIRE.md` le dit : « La confiance des artisans EST la base. » Une base que
personne n'alimente meurt. Il faut donc qu'un artisan ait **envie** de dire
oui, sans qu'on le force.

### 6.1 La règle qui encadre toute contrepartie

**Refuser ne doit rien coûter sur le service lui-même** : le devis, le carnet,
la base personnelle et l'agent marchent pareil (RGPD art. 7.4 et considérant
43 ; CNIL : opposition « sans que cela ne porte atteinte à l'utilisation du
service »). Et pas de case pré-cochée, pas de « contribuer » par défaut, pas
de bouton « refuser » caché.

### 6.2 Des contreparties possibles

Ce sont des idées à trancher par vous, **pas des règles vérifiées**.

1. **Voir les fourchettes de sa région**, pour une prestation qu'il n'a jamais
   faite. C'est exactement le besoin de `DEVIS-DU-PROPRIETAIRE.md` §6.2.
   **Les réserver aux contributeurs** est un modèle courant (« je donne, je
   reçois ») et le point 408 va dans ce sens. Mais la compatibilité avec un
   consentement « libre » et avec des critères d'accès équitables n'est **pas
   vérifiée** (§8).
2. **Se situer** : « votre prix est dans le tiers haut de la fourchette
   régionale ». C'est une information sur lui, jamais un conseil de changer
   (§5.4).
3. **Une page « Ma contribution »** : combien de lignes il a versées, depuis
   quand, à quoi elles ont servi, un bouton pour retirer aussi simple que celui
   pour donner (art. 7.3), et une copie toujours disponible.
4. **Une promesse écrite sur les acheteurs** (`A-FAIRE.md`, condition 4) :
   jamais un assureur qui s'en servirait pour baisser ses remboursements,
   jamais une plateforme qui tirerait les prix vers le bas.
5. **La règle « aucun chiffre ne permet de deviner la source », expliquée à
   l'écran** : un minimum d'artisans, une zone large, plusieurs mois, une
   fourchette. C'est ce qui rend la contribution sans danger, et ça se dit.
6. **Plus tard, si l'API rapporte de l'argent** : une part pour les
   contributeurs, par exemple une réduction d'abonnement. Le cadre juridique
   d'une incitation de ce genre (consentement libre, fiscalité) n'a **pas été
   étudié** : à voir avec un avocat.

---

## 7. Ce qui appartient au propriétaire (et à un avocat)

### Vos décisions

1. **Les données des clients** : y renoncer pour la base commune
   (recommandé), ou décider un jour de la procédure lourde du §2.4.
2. **La base légale** pour les données des artisans : le consentement, déjà
   prévu par vos documents, est le plus solide. À confirmer avec l'avocat.
3. **Votre statut, et la séparation.** Précisé par vous le 17/10/2026 : vous
   avez eu une entreprise, aujourd'hui fermée. Vous restez du métier, et le
   premier autre artisan d'Opus sera votre frère : qui fait tourner le calcul
   des fourchettes, et qui peut lire quoi — éditeur SQL compris —, se décide
   toujours avant le module devis (§5.2).
4. **La liste des acheteurs acceptables** de l'API.
5. **Les seuils** : nombre minimal d'artisans par chiffre, maille, durée,
   arrondi. Aucun chiffre officiel n'existe : il faut les fixer et écrire
   pourquoi (§1.4).
6. **La contrepartie** (§6).
7. **Le calendrier** : rien ne se collecte avant les nouveaux textes, et la
   revente ne s'annonce que le jour où elle existe.

### Ce qui revient à un avocat

- **Le contrat de sous-traitance** du carnet (art. 28.3) : il manque déjà
  (`EDITEUR.contratSousTraitance = false`), base ou pas.
- **La clause de contribution** des CGU et la politique de confidentialité
  (§4), au regard du Data Act, de L442-1, de l'arrêt du 13/05/2026 et du
  règlement P2B.
- **Les seuils**, du point de vue de la concurrence, sur un marché local.
- **Le règlement sur la gouvernance des données** (2022/868), avant toute
  vente : une API qui agrège et enrichit les données sans mettre acheteurs et
  artisans en relation n'est pas un « service d'intermédiation de données »
  (art. 2, 11, a). Si elle vendait des données par artisan, il faudrait se
  déclarer.
- **Les conditions d'Anthropic**, avant d'affiner quoi que ce soit avec ses
  réponses.

### Ce que vous pouvez faire seul, ou avec moi

- **Le registre de sous-traitant** (art. 30.2), dès maintenant : la CNIL
  publie des modèles.
- Dans le code (ce document n'a rien modifié) :
  - retirer les métadonnées des photos côté serveur, sur tous les chemins, et
    le mesurer sur de vrais fichiers (§2.3) ;
  - concevoir les tables du devis avec des champs rangés (poste, unité,
    centimes, région, période) **séparés** du texte libre et des données du
    client. Le RGPD le demande : « Chaque fois que ces finalités peuvent être
    atteintes par un traitement ultérieur ne permettant pas ou plus
    l'identification des personnes concernées, il convient de procéder de
    cette manière » (art. 89.1) ;
  - le jour venu, une fonction de calcul des fourchettes **dans la base**,
    éprouvée en cassant ce qu'elle surveille, comme le reste du projet ;
  - apprendre à `verifier-legal` le nouvel état des textes.

---

## 8. Ce qui n'a pas pu être vérifié

1. **Aucun seuil chiffré officiel** (nombre minimal de contributeurs, maille,
   délai) sur cnil.fr, edpb.europa.eu ou Légifrance. Le G29 ne donne qu'un
   ordre de grandeur illustratif (k = 2 contre k > 10). Les règles de secret
   statistique de l'INSEE, hors de la liste des sources autorisées, n'ont pas
   été lues.
2. **Les lignes directrices 02/2026 du CEPD sur l'anonymisation** ne sont
   qu'une version de consultation, ouverte jusqu'au 30/10/2026 : la version
   finale peut changer. Celles de 2025 sur la pseudonymisation sont aussi une
   version de consultation, antérieure à l'arrêt CRU.
3. **Le volet RGPD du « Digital Omnibus »** (nouvelle définition de la donnée
   personnelle, intérêt légitime pour l'IA) : aucune adoption trouvée au
   17/10/2026. Le CEPD demande de ne pas adopter la nouvelle définition. Le
   retrait par le Conseil n'est rapporté que par la presse.
4. **L'arrêt Cass. com. du 13/05/2026, n° 24-17.137** : connu par des résumés
   seulement.
5. **La délibération MOBIUS (SAN-2025-014)** : seul le communiqué de la CNIL a
   été lu.
6. **L'art. 226-21 du code pénal** (« détournement de finalité », cinq ans et
   300 000 €) : la version en vigueur n'a pas été lue, et son application à
   la réutilisation par un sous-traitant est douteuse. C'est un risque
   incertain, pas une certitude.
7. **Légifrance renvoie une erreur 403 au conteneur.** Les textes français
   (code de commerce, code civil, CPI) ont été lus en entier sur un miroir de
   sa base officielle (LEGI), pas sur le site lui-même. Quelques textes
   européens n'ont pas été relus mot pour mot par un des contradicteurs : la
   clause 7.2 des clauses types 2021/915, les points 76 et 86 de l'arrêt CRU,
   et l'arrêt Digi (C-77/21).
8. **Une clause précise dans le contrat de sous-traitance accepté à
   l'inscription suffirait-elle comme « autorisation écrite » ?** Et Opus
   peut-il faire de cette autorisation une condition d'accès ? Non tranché.
   La CNIL dit que l'artisan est « libre de donner ou non son accord ».
9. **Une base vendue à des tiers à partir de données de clients** : aucune
   position officielle sur sa compatibilité.
10. **Un prix de référence détaché de tout devis ne concerne-t-il plus aucun
    client ?** C'est une analyse, sans source dédiée.
11. **Réserver les fourchettes aux contributeurs**, et **rémunérer les
    contributions** : non étudié.
12. **Le Data Act, chapitre VI** (changement de fournisseur), s'applique-t-il
    à un logiciel métier comme Opus ? Probable mais discutable, et la FAQ de
    la Commission n'a pas été lue. L'allègement proposé pour les PME n'est pas
    adopté.
13. **Opus est-il un « service d'intermédiation en ligne » (P2B) ?** Analyse,
    aucune autorité ne l'a tranché.
14. **Règlement sur l'IA** : les seuils qui font d'un affineur un
    « fournisseur de modèle » (lignes directrices de la Commission) et le code
    de pratique sur le marquage sont publiés hors des sites autorisés.
15. **Les conditions d'Anthropic** (données envoyées, réponses du modèle,
    affinage) : ce n'est pas une source officielle, non lues.
16. **Les métadonnées des photos** : l'effacement lors du ré-encodage a été lu
    dans le code, pas mesuré. Le sort des métadonnées des vidéos chez
    Cloudinary n'a pas été vérifié.
17. **Le secret des correspondances** pour une éventuelle réutilisation de la
    messagerie : non étudié. La messagerie est de toute façon hors de ce
    projet de base.
18. **Votre statut exact** : précisé le 17/10/2026 — une entreprise que vous
    avez eue, aujourd'hui fermée ; aucune entreprise active.
