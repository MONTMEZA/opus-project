# Les données du bâtiment — ce qui existe, ce qu'on a le droit d'en faire, et par où commencer

> Le propriétaire, le 17/10/2026 : « Au-delà d'Opus, je voudrais créer une base
> de données spéciale pour le BTP, avec toutes les informations croisées dans
> Opus, pour que nos agents deviennent imbattables sur le BTP : qu'ils
> connaissent toutes les lois, les DTU, les façons de faire, les étapes d'un
> chantier, les prix… Pour les prix du BTP, je ne sais pas ce qui existe, on
> pourrait regarder ensemble pour trouver. »

Ce document fait ce tour. Il a été relevé le **17/10/2026**, en six recherches
(bases de prix vendues, données publiques, prix des matériaux, logiciels
concurrents, bases étrangères, lois et normes). Chacune a été relue par un
vérificateur qui a rouvert les pages des éditeurs ; **quand il a corrigé, c'est
sa version qui figure ici**. Le document entier a ensuite été relu par un
contradicteur, qui a **recalculé l'exemple chiffré du §2.1** sur les données
de l'ADEME et recompté plusieurs lignes ; ses corrections sont intégrées.
Une contre-vérification a enfin refait ces calculs de son côté — ils se
retrouvent — et relevé les derniers écarts, corrigés ici.
Le même soir, une seconde recherche (le marché des comparateurs de matériaux,
pour `docs/COMPARATEUR-MATERIAUX.md`) a contredit cinq lignes du §1.2 et du
§3.1 — Tolteck, Extrabat, Costructor, Renalto, Sonepar — et une phrase sur
Handoff. Les pages des éditeurs ont été relues pour départager : elles lui
donnaient raison, et ces lignes sont corrigées.

Une licence n'est donnée pour lue que si sa page de conditions l'a été, ou le
champ « licence » de sa fiche sur data.gouv.fr (c'est alors écrit « d'après
data.gouv ») ; sinon elle est marquée « non vérifiée ».

Ce document **n'est pas un avis d'avocat**. Il prépare votre futur cahier des
charges — le troisième, celui de la base BTP, que vous avez annoncé le
17/10 ; il ne le remplace pas (règle posée dans `docs/A-FAIRE.md`, dernière
section : rien ne se construit avant). Il complète :

- `docs/DEVIS-DU-PROPRIETAIRE.md` §5 et §6 — la base de postes privée de
  chaque artisan, le correcteur, les prix du marché ;
- `docs/DONNEES-DES-ARTISANS.md` — ce qu'on a le droit de faire des données
  que les artisans saisissent ;
- `docs/CONCURRENCE-DEVIS.md` — les logiciels de devis en face.

Et il applique vos décisions du 17/10 (dernière section de `docs/A-FAIRE.md`) :
une fourchette de prix est **régionale** et porte sur un **poste précis** ;
**aucun chiffre ne doit permettre de deviner qui l'a fourni** ; la base de
chaque artisan reste **privée**.

### Les mots employés

Les mots techniques et les sigles du document sont ici, rangés en cinq
familles (les noms d'entreprises et de produits, eux, sont présentés là où ils
apparaissent). Les plus utiles sont aussi développés dans le texte, à leur
première apparition.

**Les prix et les chiffres**

| mot | ce qu'il veut dire ici |
|---|---|
| **prix unitaire d'ouvrage** | le prix d'un poste posé : « chape sèche, X €/m² ». C'est ce que l'artisan cherche |
| **déboursé sec** | ce que coûte réellement le poste à l'artisan : temps de pose × son taux horaire, plus les fournitures. Sans frais généraux ni marge |
| **fourni-posé** | prix qui comprend la fourniture ET la pose |
| **HT, TTC** | hors taxes, toutes taxes comprises. Deux montants qui ne se comparent jamais tels quels |
| **bordereau** | une liste de postes, avec un prix unitaire pour chacun |
| **indice** (ou « index ») | un nombre qui dit **de combien** un coût a bougé (base 100 une année donnée). Il ne dit jamais **combien** coûte un m² |
| **médiane** | la valeur du milieu : la moitié des prix est en dessous, la moitié au-dessus. Plus fiable qu'une moyenne, qu'un seul chantier hors norme suffit à faire bouger |
| **quartiles** | le 1er quartile sépare le quart le moins cher du reste, le 3e quartile le quart le plus cher. Entre les deux, la moitié des prix : c'est une fourchette |
| **déciles** | la même idée par dixièmes : « du 1er au 9e décile », c'est la fourchette sans les 10 % les moins chers ni les 10 % les plus chers |
| **agrégat** | un chiffre calculé sur plusieurs valeurs : une médiane, une fourchette. C'est le seul genre de chiffre qu'une base commune peut montrer |
| **n** | le nombre de lignes sur lequel un chiffre est calculé. Une médiane sur 15 lignes ne vaut pas une médiane sur 900 |

**Le droit**

| mot | ce qu'il veut dire ici |
|---|---|
| **CPI** | le Code de la propriété intellectuelle : droit d'auteur et droit des bases de données |
| **CGV, CGU** | les conditions générales de vente et d'utilisation : le contrat qu'un éditeur fixe à ses clients. C'est là qu'on lit ce qu'une licence permet |
| **droit du producteur de base** | celui qui a investi pour constituer une base est protégé contre l'extraction d'une partie substantielle, ou l'extraction répétée de petites parties (CPI, art. L341-1, L342-1, L342-2). Sans contrat, ce droit s'applique quand même |
| **Licence Ouverte** (Etalab) | la licence des données de l'État, **en version 1 ou 2 selon la source**. Les deux permettent la réutilisation libre, même commerciale, en citant la source et la date ; on cite la bonne version |
| **licences MIT, ODC-BY, CC BY** | trois licences libres qui demandent seulement de citer l'auteur : MIT pour du code informatique, ODC-BY pour une base de données, CC BY pour des textes et des documents |
| **moissonnage** | recopier un site par un programme (en anglais *scraping*) |
| **robots.txt** | un fichier où un site dit aux robots ce qu'ils peuvent parcourir. Ce n'est pas une licence (§1.3) |
| **fouille de textes et de données** | faire analyser des documents par un programme. Permise en France, **sauf si le titulaire s'y oppose** : CPI L122-5-3 pour le droit d'auteur, L342-3 pour le droit du producteur de base. Et les copies doivent être détruites ensuite (§1.3) |
| **CRPA** | le code des relations entre le public et l'administration : il pose que les documents publics se réutilisent librement (§5.3) |
| **RGPD** | le règlement européen sur la protection des données personnelles (2016/679) |
| **responsable de traitement, sous-traitant** | le premier décide pourquoi et comment on traite des données ; le second les traite pour le compte d'un autre. Pour le carnet de clients, l'artisan est responsable et Opus sous-traitant (`DONNEES-DES-ARTISANS.md`) |
| **Data Act** | le règlement européen sur les données : il rend sans effet certaines clauses abusives imposées entre entreprises sur l'usage des données (§4.3) |
| **règlement P2B** | le règlement européen 2019/1150 sur les relations entre les plateformes et les professionnels qui s'en servent (en anglais *platform to business*) |

**L'informatique**

| mot | ce qu'il veut dire ici |
|---|---|
| **API** (ou *webservice*) | une porte par laquelle un logiciel interroge un autre logiciel |
| **API REST** | la façon la plus courante de construire une API sur le web : on interroge une adresse, on reçoit des données |
| **clé, identifiants secrets** | ce qu'un logiciel présente pour avoir le droit d'appeler une API (OAuth est le nom d'une méthode standard pour les délivrer). Ils ne vivent jamais dans l'application (§5.5) |
| **fonction Edge** | un petit programme qui tourne sur les serveurs de Supabase, là où Opus garde déjà ses secrets |
| **SDMX** | le format standard des séries statistiques. Il permet à Opus de lire les index de l'INSEE automatiquement, sans les recopier à la main |
| **DiDo** | la plateforme de diffusion des données du SDES, qui sert ses fichiers par une API |
| **cache** | une copie gardée pour ne pas redemander la même chose. Certaines licences l'interdisent (Batiprix, §1.2) |
| **base consultée par l'agent** | des documents rangés où l'agent va chercher avant de répondre (en anglais *RAG*). C'est autre chose qu'« entraîner » un modèle |
| **vectoriser** | transformer un texte en une suite de nombres, pour que l'agent retrouve les passages proches d'une question. **Revectoriser** : refaire ce calcul avec un autre modèle — les nombres de deux modèles ne se mélangent pas |
| **bge-m3** | un modèle de vectorisation en accès libre ; c'est celui de la version vectorisée de LEGI (§5.1) |
| **Hugging Face** | un site qui héberge des modèles d'IA et des jeux de données |
| **Factur-X** | un format de facture électronique : un PDF lisible par un humain, qui porte aussi les lignes de la facture sous une forme lisible par un logiciel |
| **plateforme agréée** | une entreprise immatriculée par l'administration fiscale pour transmettre et recevoir les factures électroniques entre entreprises (`CONCURRENCE-DEVIS.md` §6) |
| **affiliation, Awin** | l'affiliation : un site montre les produits d'un marchand, avec un lien vers lui, et touche une commission sur chaque vente qu'il lui apporte. Awin est une plateforme qui gère ces programmes pour des marchands, dont ManoMano, site marchand de bricolage (§1.2) |

**Le bâtiment**

| mot | ce qu'il veut dire ici |
|---|---|
| **NF DTU** | les documents techniques unifiés : des normes AFNOR qui décrivent comment mettre en œuvre un ouvrage dans les règles de l'art. Elles se vendent |
| **Avis Technique** (ATec) | l'évaluation d'un procédé que les NF DTU ne couvrent pas, rendue par la CCFAT et publiée avec le CSTB |
| **règles professionnelles** | des règles de mise en œuvre écrites par un syndicat de métier (par exemple la CSFE, chambre syndicale de l'étanchéité) |
| **C2P** | la Commission Prévention Produits de l'AQC : ses listes disent aux assureurs quels procédés et quelles règles professionnelles sont acceptés, ou mis en observation |
| **RAGE, PACTE, PROFEEL** | trois programmes successifs de la profession qui ont produit des recommandations pour la rénovation énergétique (RAGE : « Règles de l'art Grenelle Environnement 2012 ») ; elles vivent aujourd'hui sur Pro'Réno |
| **RGE** | « reconnu garant de l'environnement » : la qualification qu'une entreprise doit avoir pour que son client touche certaines aides |
| **CEE** | les certificats d'économies d'énergie : des aides financées par les fournisseurs d'énergie, à des conditions techniques fixées par arrêté |
| **MaPrimeRénov', France Rénov'** | la principale aide publique à la rénovation énergétique, et le réseau public de conseillers qui accompagne les ménages |
| **DPE** | le diagnostic de performance énergétique d'un logement |
| **RE2020** | la réglementation environnementale des bâtiments neufs |
| **PLU** | le plan local d'urbanisme d'une commune |
| **PAC, VMC, ECS** | la pompe à chaleur, la ventilation mécanique contrôlée, l'eau chaude sanitaire |
| **CCTP** | le cahier des clauses techniques particulières : la description technique des travaux d'un marché |
| **CCAG** | le cahier des clauses administratives générales des marchés publics : un arrêté, donc un texte libre |
| **ETIM, FAB-DIS** | ETIM : une classification européenne des produits techniques et de leurs caractéristiques. FAB-DIS : le format de fichier par lequel un fabricant transmet ses produits et ses tarifs à ses distributeurs |
| **DIN 276, NRM, MasterFormat** | les nomenclatures des postes de travaux en Allemagne, au Royaume-Uni (celle de la RICS) et en Amérique du Nord. Une nomenclature, c'est la liste commune des postes, avec un code pour chacun |
| **ETI** | une entreprise de taille intermédiaire, entre les PME et les grandes entreprises |
| **SIREN** | le numéro à neuf chiffres d'une entreprise |
| **NF C 15-100** | la norme des installations électriques basse tension, celles des logements (§5.4) |
| **secteur diffus** | une maison qu'un particulier fait construire pour lui, une par une — par opposition aux maisons groupées d'un promoteur (§1.1) |

**Les organismes et les jeux de données**

| sigle | ce que c'est |
|---|---|
| **INSEE** | l'institut national de la statistique. Ses séries : **BT** et **TP** (index du bâtiment et des travaux publics), **IPEA** (indice des prix de l'entretien-amélioration des bâtiments), **IPPI** (indices de prix de production de l'industrie) |
| **ADEME** | l'Agence de la transition écologique |
| **CDC** | la Caisse des Dépôts |
| **SDES** | le service des données et études statistiques du ministère de la Transition écologique |
| **EPTB** | l'enquête du SDES sur le prix des terrains à bâtir et des maisons |
| **DECP, BOAMP** | les données essentielles de la commande publique (qui a gagné quel marché public, pour quel montant), et le Bulletin officiel des annonces des marchés publics |
| **DILA** | la direction de l'information légale et administrative : elle publie le Journal officiel, Légifrance et Service-Public |
| **DINUM** | la direction interministérielle du numérique |
| **LEGI, JORF, KALI** | trois bases de la DILA : les codes et textes **consolidés** (à jour de leurs modifications), les textes tels que publiés au **Journal officiel**, et les conventions collectives |
| **PISTE** | le portail des API de l'État, par lequel on obtient l'accès à l'API Légifrance |
| **Judilibre, JADE** | les décisions de justice : de la Cour de cassation et des juridictions judiciaires pour l'une, de la justice administrative pour l'autre |
| **BOFiP** | le bulletin officiel des finances publiques : la doctrine de l'administration fiscale (taux de TVA des travaux…) |
| **CCFAT** | la commission chargée de formuler les Avis Techniques |
| **AFNOR** | l'organisme français de normalisation, qui vend les normes, dont les NF DTU |
| **CSTB** | le Centre scientifique et technique du bâtiment |
| **AQC** | l'Agence qualité construction, qui étudie les désordres du bâtiment pour les prévenir |
| **FFB, CAPEB** | les deux grandes organisations professionnelles du bâtiment |
| **OPPBTP, INRS** | les organismes de prévention des risques professionnels, celui du BTP et celui de tous les métiers |
| **Cerema, ANIL, ANAH** | des organismes publics : expertise technique, information sur le logement, aides à l'habitat |
| **INIES** | la base nationale des fiches environnementales des produits de construction |
| **BDNB** | la base de données nationale des bâtiments |
| **RNCP, ROME** | le répertoire national des certifications professionnelles, et le répertoire des métiers de France Travail |
| **DGCL** | la direction générale des collectivités locales |
| **TREMI** | une enquête de l'ADEME sur les travaux de rénovation énergétique des maisons individuelles |
| **RT-RE** | le portail du ministère sur la réglementation thermique et environnementale des bâtiments (§5.3) |
| **RICS, BCIS, BKI** | l'organisation professionnelle britannique des métreurs et économistes de la construction, sa base de coûts, et la base de coûts des chambres d'architectes allemandes (§4.2) |
| **CII** | le Construction Industry Institute, un institut de recherche américain sur la construction (§4.4) |
| **UE** | l'Union européenne |
| **Eurostat** | l'office statistique de l'Union européenne |

---

## 0. En une page

**La réponse courte à « qu'est-ce qui existe pour les prix ? » : beaucoup de
choses, mais presque rien qu'on ait le droit de mettre dans Opus pour tout le
monde.**

1. **Aucune base publique de prix d'ouvrages n'existe en France.** Il n'y a
   pas de « pose de placo : X €/m² » libre, pas de bordereau ouvert.
   L'API de data.gouv.fr ne rend aucun jeu pour « prix btp », « prix
   matériaux construction » ou « bordereau prix » (interrogée le 17/10/2026),
   et la FFB (Fédération française du bâtiment) réclamait encore le
   03/04/2026 « un observatoire public d'établissement du prix des
   matériaux de bâtiment »
   (<https://www.ffbatiment.fr/actualites-batiment/presse/conflits-moyen-orient>). → §1.1
2. **Ce qui est libre sert à faire VIEILLIR un prix, pas à le donner.** Les
   index de l'INSEE (l'institut national de la statistique) disent de
   combien un coût a bougé. Le seul jeu public de vrais prix unitaires —
   celui de l'ADEME (l'Agence de la transition écologique), environ 12 000
   gestes de rénovation énergétique tirés de devis et de factures —
   s'arrête en 2018, mélange devis et factures, ne compte presque rien dans
   certaines régions (15 lignes d'isolation en Provence-Alpes-Côte d'Azur),
   et ne couvre ni la maçonnerie, ni le carrelage, ni la plomberie
   sanitaire, ni la peinture. → §1.1, §2
3. **Aucune des bases vendues (Batiprix, BatiChiffrage, Artiprix) ne permet
   ce que vous voulez faire** : se constituer sa propre base, la servir par
   API à d'autres, la faire lire par une IA. Batiprix et BatiChiffrage
   limitent par écrit l'usage aux devis de l'abonné, et toute autre
   utilisation demande leur accord. Artiprix n'a aucune licence écrite, ce
   qui ne donne aucun droit : la protection du producteur de base s'applique
   d'office. **Aucune de leurs conditions ne parle d'IA** — ce qui fait de
   l'IA une « autre utilisation », soumise à autorisation. Ce qu'elles
   permettent : qu'un artisan qui a payé SA licence s'en serve dans SES
   devis. Batiprix a pour cela une API destinée aux éditeurs de logiciels —
   et même là, faire lire ces prix par l'agent d'Opus demande un accord
   écrit. **Et un fichier de prix acheté que l'artisan déposerait lui-même
   dans Opus n'y change rien** : l'agent ne le lit pas sans l'accord écrit
   de l'éditeur. → §1.2, §3, §5.4
4. **Les prix des matériaux** : aucun prix public en euros. Les fabricants
   publient leurs tarifs (Hager, Legrand), pas pour qu'on les réutilise sans
   accord. Le prix réel d'un artisan est son prix **net**, négocié avec son
   négoce : il passe par SON compte, jamais par une base commune. Le
   moissonnage des sites marchands est exclu — y compris par une extension
   de navigateur que chaque artisan ferait tourner, comme en proposent deux
   concurrents. → §1.2, §3.1
5. **La seule base de prix que vous POSSÉDEREZ, c'est celle que vos artisans
   construiront avec vous** — volontairement, anonymement, au-delà d'un seuil.
   Elle donnera ce que vous avez décidé le 17/10 : une **fourchette
   régionale**, sur un **poste précis** (« placo » ne veut rien dire,
   « contre-cloison simple » si), sans que **rien permette de deviner qui a
   fourni le chiffre**. C'est ainsi que vivent les meilleures bases
   étrangères (BCIS au Royaume-Uni depuis 1962, BKI en Allemagne). Et Opus
   aura sur elles un avantage de structure : le devis s'y rédige ligne par
   ligne. À côté, la base personnelle de chaque artisan reste **privée**, et
   ne rejoint la base commune que s'il l'a choisi. → §4
6. **Les connaissances** : les lois sont libres, et une version du droit
   consolidé déjà découpée et vectorisée (préparée pour une IA) existe —
   mais c'est une copie non officielle, dont le dernier instantané daté est
   du 26/09/2026, et l'héberger a un vrai coût. Les NF DTU (les normes qui
   disent comment poser) et les documents du CSTB (Centre scientifique et
   technique du bâtiment), non : AFNOR (l'organisme de normalisation) et le
   CSTB ont écrit qu'ils s'opposent à toute intégration dans une IA. On cite
   le numéro et le titre, jamais le texte. → §5
7. **Le garde-fou qui ne se discute pas** : une base de prix construite entre
   concurrents ne doit jamais devenir un « prix conseillé ». Diffuser ET
   imposer un barème, avec une « police des prix », a valu 1,5 M€ d'amende
   à l'Ordre des architectes en 2019 (décision 19-D-19). → §2.4, §4.5

> **La phrase à retenir :** les bases de prix vendues peuvent être une
> OPTION que l'artisan paie et branche dans Opus, jamais la FONDATION de
> votre base. La fondation, ce sont les données publiques pour le temps et
> les lois, et les contributions consenties de vos artisans pour les prix —
> en fourchettes régionales, poste par poste.

---

## 1. Les PRIX — toutes les sources, en trois familles

Les trois familles disent ce qu'Opus peut faire **pour tout le monde** : la
mettre dans sa base, la montrer à ses agents, la servir par une API.

- **librement réutilisable** : licence lue qui le permet, même commercialement ;
- **possible avec un accord** : rien n'est permis tant qu'un contrat écrit ne
  le dit pas, mais l'éditeur propose une voie ;
- **non utilisable** : licence qui l'interdit sans offre, prix étrangers, ou
  source morte.

### 1.1 Librement réutilisables

| source | ce qu'elle contient VRAIMENT | API | coût | fraîcheur |
|---|---|---|---|---|
| **INSEE — index BT et TP** | 84 séries d'**indices** de coût, dont 80 encore publiées (BT01 tous corps d'état, BT03 maçonnerie, BT09 carrelage, BT38 plomberie, BT47 électricité, BT50 rénovation…). BT01 = **139,4** en août 2026 | oui, au format SDMX, **sans clé** | gratuit | mensuelle (mise à jour du 15/10/2026, valeur d'août) |
| **INSEE — IPEA** (entretien-amélioration) | 30 séries d'**indices de prix facturés** par corps d'état (électricité 115,3 · plomberie-chauffage 124,1 · plâtrerie 119,9…). Total = **120,7** au 2e trimestre 2026. France métropolitaine seule | oui, sans clé | gratuit | trimestrielle |
| **INSEE — IPPI** (matériaux) | indices de prix **sortie d'usine** au niveau des grandes familles : ciment, béton prêt à l'emploi, tuiles, briques, aciers pour béton armé, peintures… Les séries fines (« ciment en sac ») ne sont **plus publiées** | oui, sans clé (découper les requêtes) | gratuit | mensuelle (août 2026) |
| **INSEE — prix moyens de détail** | l'une des rares séries **en euros** : « travaux de plomberie, heure de main-d'œuvre TTC », moyenne métropole | oui, sans clé | gratuit | mensuelle (septembre 2026) |
| **ADEME — coûts des travaux de rénovation** | **les seuls vrais prix unitaires publics** : 6 tables (isolation 4 515 lignes, chauffage 3 014, menuiseries 2 890, ventilation 937, eau chaude sanitaire 428, photovoltaïque 38), en € HT, **avec la quantité**. Fourniture et pose séparées sur **une minorité de lignes** : 8 % pour l'isolation et la ventilation, 21 % pour les menuiseries, 38 % pour le chauffage, 69 % pour l'eau chaude sanitaire (environ 21 % au total) ; le reste ne donne qu'un coût total | oui, sans clé | gratuit | **gelée** : déposée le 26/05/2020, travaux de 2009 à 2018 |
| **SDES — MaPrimeRénov' par geste 2024** | montants moyens et déciles **par geste**, sans surface (PAC air/eau : médiane 14 460 €, de 10 670 à 19 710 € du 1er au 9e décile) | non (fichiers) | gratuit | publiée le 24/07/2026, dossiers soldés en 2024 |
| **SDES — rénovations d'ampleur 2024** | coût par logement des 12 combinaisons de travaux les plus fréquentes (de 40 215 à 71 556 €), 91 900 logements | non (fichiers) | gratuit | 24/07/2026 |
| **Caisse des Dépôts — logement social** | prix de revient médian **au m²** par région (construction neuve, réhabilitation) | oui, sans clé | gratuit | 15/06/2026, signatures 2018-2025 |
| **SDES — prix des terrains et du bâti** | maison neuve en secteur diffus (que fait construire un particulier, hors opération d'un promoteur) : **1 914 €/m²** en 2024, par région | oui (DiDo) | gratuit | 27/11/2025, données 2024 |
| **Commande publique** (DECP, BOAMP) | un montant **global** par marché, l'objet, le titulaire. **Aucun prix unitaire, aucune quantité** | fichiers / oui | gratuit | quotidienne |
| **Mes Aides Réno** (code libre, licence MIT) | pas de prix : les **règles des aides** (MaPrimeRénov', certificats d'économies d'énergie…) pour calculer un reste à charge | oui | gratuit | **plus maintenu**, en retard sur un arrêté du 25/08/2026 |
| **Eurostat** (l'office statistique de l'UE) | indices de coûts de construction harmonisés UE | oui | gratuit | variable |
| **ETIM** (modèle anglais) | pas de prix : les attributs normalisés des produits techniques, ceux des fichiers FAB-DIS des fabricants | oui (sur demande) | gratuit | versions régulières |

**Licences lues :**

| source | licence | page lue |
|---|---|---|
| INSEE (toutes séries) | Licence Ouverte 2.0 : « réutilisation libre, y compris à des fins commerciales », en citant « Source : Insee », la date, sans altérer le sens | <https://www.insee.fr/fr/information/2008466> (mise à jour 13/04/2026) |
| ADEME coûts des travaux | Licence Ouverte (champ licence des 6 tables, vérifié par l'API) — mais les lignes décrivent des ménages réels : voir le troisième piège | <https://data.ademe.fr/data-fair/api/v1/datasets/isolation> |
| SDES (geste, ampleur, prix des terrains) | licence ouverte (décret 2017-638), usage commercial permis | <https://www.statistiques.developpement-durable.gouv.fr/mentions-legales> |
| Caisse des Dépôts | Licence Ouverte 2.0, d'après data.gouv (fiche mise à jour le 15/06/2026) | fiche data.gouv, adresse ci-dessous |
| DECP « fichiers consolidés » | Licence Ouverte **version 1**, d'après data.gouv (12/10/2026). À distinguer du jeu « enrichi », déprécié depuis le 05/03/2026 | fiche data.gouv, adresse ci-dessous |
| BOAMP | Licence Ouverte **version 1**, d'après data.gouv (17/10/2026) | fiche data.gouv, adresse ci-dessous |
| Mes Aides Réno | MIT | <https://raw.githubusercontent.com/betagouv/reno/master/LICENSE> |
| Eurostat | réutilisation commerciale permise en citant la source | <https://ec.europa.eu/eurostat/fr/help/copyright-notice> |
| ETIM | modèle anglais en ODC-BY ; **libellés français de France réservés aux adhérents d'ETIM France** (la version belge est ouverte) | <https://www.etim-international.com/classification/license-info/> |

Adresses des données : index BT <https://api.insee.fr/series/BDM/data/INDEX-BT-TP-DIV-IM-2010?lastNObservations=1> ·
IPEA <https://api.insee.fr/series/BDM/data/IPEA-2021?lastNObservations=1> ·
IPPI <https://bdm.insee.fr/series/sdmx/data/IPPI-2021?lastNObservations=1> ·
prix de détail <https://bdm.insee.fr/series/sdmx/data/IPC-PM-2015?lastNObservations=1> ·
ADEME <https://data.ademe.fr/datasets/isolation> ·
SDES geste <https://www.statistiques.developpement-durable.gouv.fr/les-renovations-energetiques-par-geste-aidees-par-maprimerenov-en-2024> ·
SDES ampleur <https://www.statistiques.developpement-durable.gouv.fr/les-renovations-energetiques-dampleur-aidees-par-lanah-en-2024> ·
CDC <https://www.data.gouv.fr/datasets/financement-et-cout-des-logements-sociaux-construits-finances-par-la-cdc-depuis-2018> ·
EPTB <https://www.statistiques.developpement-durable.gouv.fr/le-prix-des-terrains-et-du-bati-pour-les-maisons-individuelles-en-2024> ·
DECP <https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides> ·
BOAMP <https://www.data.gouv.fr/datasets/api-boamp>

Trois pièges, relevés par les recherches ; le contradicteur a recompté les
lignes du premier sur l'API de l'ADEME le 17/10, et relu le schéma de la
table pour le troisième :

- **La table ADEME mélange des DEVIS et des FACTURES** (colonnes séparées
  `date_sigture_devis` et `date_facture`). Un devis n'a pas forcément été
  signé : il faut les séparer avant toute médiane — le §2.1 montre l'écart.
  La collecte est passée par les conseillers France Rénov' : l'échantillon
  penche vers des ménages aidés. Elle est aussi très déséquilibrée : sur les
  4 515 lignes d'isolation, 930 en Bretagne et 902 en Normandie, mais 35 en
  Île-de-France, 15 en Provence-Alpes-Côte d'Azur, et 294 sans région. Enfin,
  **la séparation fourniture / pose n'existe que pour environ 8 % des
  lignes d'isolation** (376 sur 4 515 ont un coût des matériaux, 350 un coût
  de pose) : le reste ne donne qu'un coût total HT. Sur l'ensemble des six
  tables, c'est environ 21 %, jusqu'à 69 % pour l'eau chaude sanitaire.
- **Les chiffres du SDES ne disent jamais HT ou TTC** (aucune occurrence dans
  le PDF ni dans le fichier) ; ce sont vraisemblablement des montants TTC,
  qu'on ne compare pas tels quels aux € HT de l'ADEME. Et 10 250 € est une
  moyenne **par geste**, 12 090 € une moyenne **par dossier** : les deux ne
  se confondent pas.
- **Les données de l'ADEME décrivent des ménages réels.** Les DPE
  (diagnostics de performance énergétique, Licence Ouverte 2.0) contiennent,
  dans leur version complète, une « fourchette d'estimation du coût du pack
  travaux », mais aussi l'**adresse** du logement : une ligne désigne donc
  une personne, et la rapprocher d'un client ferait d'Opus un responsable de
  traitement au sens du RGPD. La table des coûts, elle, porte le **revenu du
  ménage**, le département, la surface, l'année de construction, le type de
  logement, les dates du devis et de la facture, et le montant des aides. La
  Licence Ouverte impose de respecter la protection des données (CRPA
  L322-2). **Opus n'en garde et n'en sert donc que des AGRÉGATS** — des
  médianes et des quartiles par poste et par période —, jamais les lignes
  brutes, ni dans la base de l'agent ni par l'API. La licence est libre ;
  l'usage, lui, a des obligations.

> **La Licence Ouverte demande deux choses, et elles décident de la forme de
> la future base :** citer la source **et la date de dernière mise à jour**,
> et ne pas dénaturer. Chaque ligne rangée doit donc porter sa source, sa
> licence et sa date. Sans cela, le jour où Opus servira sa base par API,
> elle ne respecterait plus la licence de ce qu'elle redistribue.

> **Et un indice ne se présente jamais comme un prix.** C'est la troisième
> condition de l'INSEE (« ne pas induire en erreur quant à leur
> interprétation »), et c'est l'erreur qu'un agent ferait le plus volontiers.

### 1.2 Possibles avec un accord

| source | ce qu'elle contient | ce que la licence permet SANS accord | la voie proposée | coût public |
|---|---|---|---|---|
| **Batiprix** (Groupe Moniteur) | ~28 000 ouvrages tous corps d'état en déboursé sec, **moyennes nationales** (refuse de régionaliser) | la **visualisation à l'écran et l'impression** pour les devis de l'abonné, par ses **salariés**. Rien d'autre | une **API REST pour éditeurs**, « installation gratuite », clé utilisateur + clé logicielle | Batiprix Data : **279 € HT** (lot Gros œuvre, millésime 2027) et **789 € HT** (pack tous corps d'état, base actualisée), pour un utilisateur ; durée non écrite sur la fiche, abonnements de 12 à 36 mois selon les CGV (relevé 17/10/2026) |
| **BatiChiffrage** (Batiactu Groupe) | plus de 47 000 travaux fourni-posé pour les logiciels partenaires (80 000 dans son propre logiciel) ; **des fabricants y paient leur présence** | les devis du titulaire, sur ses propres projets. **Interdit nommément** : « les services d'intermédiation entre un porteur de projet et une entreprise », « les logiciels ou bases de données » | « des licences spécifiques de mise à disposition […] existent » (info@batichiffrage.com) ; référencement comme logiciel compatible | dès **224 € HT** l'édition 2026 |
| **Artiprix** (BIP / Batirama) | 27 000 ouvrages en 3 bordereaux, temps nationaux, deux taux horaires selon le département | **aucune licence écrite** : donc rien au-delà de la consultation (le droit du producteur s'applique sans clause) | aucune offre trouvée : écrire à l'éditeur | 183,89 € HT un bordereau · 373,46 € HT les trois |
| **Tarifeo** (BS2I, groupe SYDEV) | tarifs **publics** de ~800 fabricants et distributeurs (électricité, génie climatique, sanitaire) ; gère les remises de chaque client | l'intégration dans **le propre système** du client ; jamais les « Données Riches » (photos, notices) ; **un prestataire ne peut pas être un éditeur concurrent** (art. 6 h) | API éditeurs « disponible sur demande », « accords commerciaux » | sur devis |
| **FAB-DIS** (format fabricants-distributeurs) | un **format**, pas une base : le fichier produit d'un fabricant (référence, code-barres, tarif public). Les prix nets passent par un autre fichier, confidentiel | réservé aux fabricants et distributeurs, usage « strictement personnel et incessible » | accord avec FAB-DIS SAS, **puis** avec chaque fabricant | FAB-DIS Connect : le « KIT FAB-DIS » à **240 € HT/an** (fabricants et distributeurs) ; l'offre FAB, réservée aux **fabricants**, de **900 à 4 500 € HT/an** selon le nombre de références (paliers en vigueur depuis le 01/10/2026) ; l'offre DIS, réservée aux **distributeurs**, gratuite jusqu'au 01/01/2027 puis incluse dans le KIT. Opus n'étant ni fabricant ni distributeur, il n'est éligible à aucune : il lui faut l'accord de chaque fabricant |
| **Tarifs des fabricants** (Hager 7 256 références, Legrand 20 823 références) | le tarif public HT, le code-barres ; chez Legrand, la famille de remise et l'empreinte carbone | téléchargement libre, mais reproduction interdite sans autorisation (Hager), usage « personnel et privé dans un but non commercial » (Legrand) | une autorisation écrite — un fabricant a **intérêt** à être dans un logiciel de devis | gratuit |
| **Négoces par le compte de l'artisan** (Sonepar via le logiciel Everwin GX-BTP, Point.P et Cedeo via le logiciel Tolteck, Rexel ; la plaquette EBP de juillet 2024 ne nomme que Tarifeo) | le **prix net négocié** de l'artisan, la disponibilité en agence | rien de public ; aucune API ouverte | un connecteur partenaire, artisan par artisan | inconnu |
| **ADEME — audits énergétiques** | 3,35 millions de lignes, coût estimé par type de travaux et quantité, rafraîchi chaque semaine | **aucune licence affichée** (champ vide) | demander à l'ADEME la licence **et l'origine des coûts** (ils sortent peut-être des grilles de logiciels qui intègrent Batiprix) | gratuit |
| **Affiliation** (ManoMano, site marchand de bricolage, sur la plateforme d'affiliation Awin) | flux de produits avec prix de détail | publier le matériel « sans aucune modification […] pour la promotion de l'annonceur », pendant le programme, révocable | devenir affilié — **seulement pour un comparateur avec lien**, jamais pour une base | gratuit (commission) |
| **HerculePro, ELCIA** (menuiserie, fermetures) | des bibliothèques de tarifs de fabricants diffusées aux logiciels | non lues (sites injoignables) | à contacter ; **ce sont aussi des éditeurs de devis concurrents** | non publié |
| **CAPEB Midi-Pyrénées** | une bibliothèque technique d'ouvrages, réservée aux adhérents | aucune condition publiée | une organisation professionnelle : partenaire possible pour un projet collectif | adhésion |

**Pages de conditions lues :**
Batiprix <https://www.batiprix.com/content/3-conditions-generales-de-vente> (CGU 02/2023, partie III « Batiprix Web, Batiprix Data ») et <https://api.batiprix.com/Help> ·
BatiChiffrage <https://batichiffrage.fr/conditions-generales-de-vente-batichiffrage/> ·
Artiprix <https://www.batirama.com/rubrique-page/pages/193-conditions-generales-de-vente.html> ·
Tarifeo <https://www.tarifeo.com/_files/ugd/ed5fe4_567b3fec4e37480dac7092c23af14242.pdf> (19/01/2026) ·
FAB-DIS <https://fabdis.fr/wp-content/uploads/2026/05/FABDIS-CONNECT-CGF-CGU-avril-2026.pdf> ·
Hager <https://hager.com/fr/mentions-legales> · Legrand <https://www.legrand.fr/mentions-legales> ·
Awin <https://www.awin.com/docs.awin.com/Legal/Publisher+Terms/2025/FR_Awin+AG-Publisher-terms_August-2025.pdf> ·
ADEME audits <https://data.ademe.fr/datasets/ync2epx48x9azbdnggbygqp0>

Ce qu'il faut savoir de Batiprix, parce que c'est la porte la plus réaliste :

- **l'API rend impossible une clé unique pour tout Opus.** Chaque appel porte
  la clé de l'artisan abonné et un identifiant par installation, qui
  « évite le partage de clé entre plusieurs utilisateurs ». Les prix restent
  ceux de Batiprix, pour cet abonné seulement ;
- **à la fin de l'abonnement, aucune copie ne doit rester** : rien en cache ;
- **les CGU ne parlent que de « visualisation sur écran et impression sur
  papier »**, par des salariés de l'abonné. L'agent d'Opus n'est pas un
  salarié de l'artisan, et envoyer ces prix à un modèle d'IA (Anthropic) n'est
  ni voir ni imprimer : **il faut une autorisation écrite** avant que l'agent
  lise un seul prix Batiprix ;
- **mettre en cache les réponses de plusieurs abonnés pour servir les autres**
  serait une extraction répétée et systématique (CPI L342-2), interdite même
  par petits morceaux.

> **Les deux grands éditeurs vendent leur propre IA** (Batiprix « CCTP by
> IA » à 1 500 € HT/an ; BatiChiffrage, des devis par IA). Un accord qui
> laisserait l'agent d'Opus lire leurs prix sera donc rare, ou cher. Il faut
> le demander — par écrit, et avant toute promesse aux artisans.

**Une voie à part : le fichier que l'artisan importe lui-même.** Un artisan
qui a acheté un bordereau, ou téléchargé le tarif d'un fabricant, voudra
parfois le déposer dans Opus. Ce n'est envisageable que comme un **simple
rangement** dans son espace privé — sans que l'agent le lise, sans aucune
mise en commun — et seulement après un **référencement d'Opus comme
logiciel compatible** (BatiChiffrage et Hager le proposent, d'après le
vérificateur « matériaux ») ou un **accord écrit** de l'éditeur. Chez
Tarifeo, l'article 13.3 permet au client de confier ses fichiers, hors
« Données Riches », à un prestataire qui accepte par écrit les conditions de
Tarifeo ; mais l'article 6 h exclut un prestataire qui édite des logiciels
concurrents de ceux de BS2I, ce qu'Opus pourrait être : à faire trancher par
écrit avec BS2I avant tout import. Sans cela, même ce rangement sort de ce
que les licences permettent. La règle qui vaut pour l'agent est au §5.4.

### 1.3 Non utilisables

| source | pourquoi |
|---|---|
| **CYPE, « Générateur de prix »** (prix-construction.info, éditeur espagnol) | gratuit à consulter, mais « usage strictement personnel et non commercial » (<https://shop.cype.com/fr/mentions-legales/>) ; plus de 200 fabricants y ont leur version : pas neutre |
| **Batitel** (« Office des Prix du Bâtiment ») | licence : interdit d'« en tirer un quelconque profit grâce à une mise à disposition sur […] support informatique » (<https://www.batitel.com/cgv.php>) ; dernière revue affichée : « n°150 - 2016 » |
| **Bibliothèques des concurrents** (Obat 30 000 ouvrages, Cegid Boby…) | ce sont des concurrents, et leurs conditions interdisent robots et extraction (<https://www.obat.fr/conditions-generales/>) |
| **Sites marchands** (Leroy Merlin, Point.P, Cedeo, Brico Dépôt, Gedimat, Rexel) | protections anti-robots actives (Leroy Merlin, Point.P, Cedeo), ou reproduction non privée interdite (Gedimat, Rexel). Là où les conditions se taisent (Brico Dépôt), le droit du producteur s'applique quand même |
| **BâtiTarif** | aucune licence, origine des prix non dite, « 12 540 avis 5/5 » affichés : à ne pas utiliser comme source |
| **Série Centrale des Prix** (Académie d'architecture) | morte depuis 1998, et **condamnée** par le Conseil de la concurrence (décision 99-D-08) |
| **Bordereaux de prix des marchés publics** | le bordereau de l'entreprise retenue n'est « en principe pas communicable » : il reflète sa stratégie commerciale (Conseil d'État, 30/03/2016, n° 375529, <https://www.conseil-etat.fr/fr/arianeweb/CE/analyse/2016-03-30/375529>) |
| **Bases étrangères** : RSMeans (États-Unis, groupe Gordian), BCIS (Royaume-Uni), BKI (Allemagne), SIRADOS (Allemagne), Spon's (Royaume-Uni, AECOM), Xactware (États-Unis, groupe Verisk, devis de sinistres pour les assureurs), 1build (États-Unis, aujourd'hui chez Handoff, §3.2) | prix étrangers, donc sans valeur pour un artisan français ; BKI, SIRADOS et Xactware interdisent expressément l'IA, les autres limitent la redistribution, ou leurs conditions n'ont pas pu être lues (§4, §8) |
| **Indice Renoteo** (data.gouv.fr) | licite (Licence Ouverte déclarée par son producteur), mais c'est une **modélisation** « prix ADEME × BT01 » : rien qu'Opus ne puisse refaire depuis les sources d'origine, plus sûres |

Trois règles, qui valent pour toutes les sources :

> **Un robots.txt n'est pas une licence.** Celui de Rexel autorise
> explicitement les robots d'IA (dont ClaudeBot), alors que ses conditions
> interdisent « l'usage de tout ou partie du Site ». Et dans l'autre sens,
> des conditions muettes ne valent pas autorisation.

> **Moissonner un site marchand, c'est extraire sa base** (CPI L342-1 et
> L342-2), et l'atteinte au droit du producteur est un délit (CPI L343-4 :
> trois ans et 300 000 € selon le texte reproduit par un cabinet d'avocats,
> non relu sur Légifrance). Contourner une protection anti-robot ajouterait
> un second risque pénal : le texte probablement visé est l'article 323-1
> du Code pénal (accès ou maintien frauduleux dans un système
> informatique), que la Cour de cassation a appliqué au téléchargement de
> données malgré une protection connue (chambre criminelle, 20/05/2015,
> affaire dite « Bluetouff »). L'article et l'arrêt sont cités de mémoire
> par le contradicteur, non relus : **à faire confirmer par un avocat**.

> **L'exception de fouille de textes ne permet pas de construire une base.**
> Elle existe deux fois : pour le droit d'auteur (CPI L122-5-3) et pour le
> droit du producteur de base (CPI L342-3, non relu ici) — et c'est surtout
> le second qui protège une base de prix. Elle exige que les copies soient
> « détruites à l'issue de la fouille » (L122-5-3, III, relu en vigueur le
> 17/10/2026) : une base que l'agent garde et consulte n'est jamais
> couverte. Et le titulaire peut s'y opposer. AFNOR, le CSTB, BKI, SIRADOS
> et Xactware s'y opposent **expressément** ; chez les éditeurs de prix et
> de logiciels de devis présents en France (Batiprix, BatiChiffrage, CYPE,
> Obat), l'opposition se **déduit** très probablement de leurs clauses
> générales — à confirmer par un avocat (selon le vérificateur, la partie
> réglementaire du code admettrait une opposition exprimée dans des
> conditions d'utilisation ; texte non relu).

---

## 2. Ce que chaque famille permet VRAIMENT

La question de l'artisan : **« combien je peux prendre pour ce poste que je
n'ai jamais fait ? »** C'est exactement le cas où sa base personnelle
(`DEVIS-DU-PROPRIETAIRE.md` §5) ne peut rien : elle ne contient que ce qu'il a
déjà chiffré.

### 2.1 Avec les sources libres : une méthode honnête, pour la rénovation énergétique seulement

La méthode, telle qu'elle doit s'écrire :

1. **ne garder que les factures** — un devis n'a peut-être jamais été signé ;
2. **indexer chaque ligne depuis l'année de SES travaux** : son prix ×
   (index du mois ÷ index de l'année de cette ligne). Jamais un seul facteur
   pour tout le jeu ;
3. **publier par période**, parce que le marché a changé à l'intérieur même
   des données (ci-dessous) ;
4. pour un geste chiffré à l'unité (pompe à chaleur, chaudière), confronter
   le résultat aux déciles du SDES — sans les comparer tels quels : € HT d'un
   côté, probablement TTC de l'autre (§1.1). Pour un prix au m², le SDES ne
   donne aucune borne.

La séparation fourniture / pose n'existe que sur environ 8 % des lignes
d'isolation : la méthode ne peut pas s'appuyer dessus en général.

Un exemple, pour montrer ce qu'elle donne et ce qu'elle vaut. **La première
version de ce document annonçait environ 47 € HT/m² ; c'était faux sur la
méthode** — devis et factures mêlés, et un seul facteur d'actualisation pour
des travaux de 2009 à 2018. Le contradicteur l'a refait le 17/10 sur l'API
de l'ADEME (table Isolation, 1 517 lignes « combles perdus », dont 750
entrent dans le calcul) et sur l'API de l'INSEE pour BT01 :

| | valeur |
|---|---|
| toutes lignes, devis et factures mêlés | médiane **37,1** € HT/m² (n = 750 ; du 1er au 3e quartile : 24,8 à 53,1) |
| factures seules | médiane **41,6** (n = 522 ; 29,0 à 56,6) |
| sans facture (devis, ou aucune date) | médiane **26,0** (n = 228, dont 45 sans aucune date ; 19,3 à 38,9) ; les 183 lignes qui portent une date de devis : 25,0 |
| médiane brute par année | 2011 : 48,7 (n = 154) · 2012 : 52,8 · 2014 : 28,5 · 2015 : 22,8 · 2016 : 29,5 · 2017 : 29,0 · 2018 : 34,0 |
| **factures seules, travaux de 2014 à 2018, indexées année par année sur BT01** | **environ 39 € HT/m²** (38,8 ; n = 188) — **indicatif** |
| même calcul, devis et factures mêlés | environ 38 € HT/m² (38,0 ; n = 369) |
| ce que donnait la première version : tout le jeu × le seul facteur 2018 → août 2026 (109,07 → 139,4, soit × 1,278) | environ 47 € — gonflé par les lignes de 2011-2012, multipliées par un facteur qui ne leur correspond pas |

Pourquoi l'exemple s'arrête à 2014 : la série BT01 en base 2010 ne commence
qu'en octobre 2014 dans l'API de l'INSEE. Les années d'avant ne s'indexent
qu'avec un autre flux, celui des anciennes bases
(`INDEX-BT-TP-DIV-ANCIENNES-BASES`). Pour 2014, l'index est la moyenne
d'octobre à décembre, seuls mois publiés dans cette base ; sans 2014, le
résultat ne bouge que de 0,3 € (39,1 sur 129 factures, au lieu de 38,8).

Ce que cet exemple ne dit pas, et qu'il faut dire à l'artisan :

- **les prix médians ont été divisés par plus de deux entre 2012 et 2015
  (52,8 → 22,8 € HT/m²), À L'INTÉRIEUR du jeu.** Un indice ne corrige pas
  un marché qui a changé de nature : on publie par période, jamais une
  seule moyenne actualisée ;
- **les données s'arrêtent en 2018**, avant les offres « isolation à 1 € »
  de 2019-2021, qui ont encore transformé ce marché (connaissance générale,
  non revérifiée) ;
- **BT01 mesure un COÛT tous corps d'état, neuf compris.** Pour un prix de
  rénovation, l'IPEA du corps d'état concerné serait plus juste ; le calcul
  ci-dessus a été fait avec BT01 ;
- **c'est un chiffre NATIONAL, et vous avez décidé que les fourchettes
  d'Opus seraient régionales.** Or la table compte 35 lignes d'isolation en
  Île-de-France et 15 en Provence-Alpes-Côte d'Azur : pour votre région,
  une fourchette reposerait sur presque rien ;
- **« combles perdus » est plus précis qu'« isolation »**, qui mêlerait
  combles, murs et planchers — la même erreur que « placo » pour vos trois
  prix de 48, 58 et 72 €/m². **Mais ce n'est pas encore un poste au sens où
  vous l'entendez** : il mêle laine soufflée et rouleaux, et toutes les
  épaisseurs. Le poste serait « combles perdus, isolant soufflé, à
  résistance thermique donnée », et chaque découpage de plus fait baisser n.

**Pour une chape, un mur en parpaing, du carrelage ou de la peinture : rien.**
Aucune source publique ne donne ces prix. Les index BT03 ou BT09 disent
seulement comment ils bougent. Un agent qui répondrait un chiffre
inventerait.

### 2.2 Avec un accord : le prix de l'éditeur, pour l'abonné

Si Opus devient partenaire Batiprix, l'artisan qui paie sa licence (279 € HT
le lot Gros œuvre, 789 € HT le pack tous corps d'état, pour un utilisateur ;
durée non écrite sur la fiche) voit les prix Batiprix dans son devis Opus. Ce
sont des **moyennes nationales** — l'inverse de ce que vous avez décidé pour
la base d'Opus : Batiprix « refuse » de régionaliser (« cette méthode manque
de précision », <https://www.batiprix.com/content/42-la-methode-batiprix>),
c'est à l'artisan d'appliquer ses coefficients. Et tant que l'accord écrit ne
le dit pas, **l'agent ne lit pas ces prix** (§1.2, §5.4).

### 2.3 Avec les contributions des artisans : la vraie réponse, plus tard

Une fourchette **régionale**, datée, sur un **poste précis**, calculée sur
les prix réels d'artisans d'Opus qui l'ont accepté, sans que rien permette de
deviner qui a fourni le chiffre (§4). **Pas avant longtemps** : Opus compte 8
fiches professionnelles, presque toutes dans les Bouches-du-Rhône
(`DONNEES-DES-ARTISANS.md` §5.3, relevé du 17/10/2026). Aucune case ne serait
assez remplie pour afficher quoi que ce soit sans désigner quelqu'un. C'est
la troisième condition que `A-FAIRE.md` pose à votre modèle économique : le
volume vient d'abord.

### 2.4 En résumé

| ce que l'artisan demande | sources libres | avec un accord | base des artisans |
|---|---|---|---|
| isolation, PAC, fenêtres, VMC | un ordre de grandeur **national** et ancien, actualisé année par année, **à dater** | le prix Batiprix ou BatiChiffrage de son abonnement (national, pour Batiprix) | une fourchette régionale sur un poste précis, quand le seuil est atteint |
| maçonnerie, carrelage, plomberie, peinture | **rien** | idem | idem |
| faire vieillir SON propre prix de 2024 | **oui** : son prix × l'index du corps d'état | — | — |
| le prix d'un matériau | un indice de tendance (IPPI), pas un prix | son prix net, par son compte chez le négoce | ses propres factures d'achat (§4.6) |
| la part main-d'œuvre d'un prix | une piste : les salaires minima conventionnels du bâtiment (KALI), fixés par accords régionaux — non éprouvée (§8) | — | — |

Quelle que soit la source, l'écran suit `DEVIS-DU-PROPRIETAIRE.md` §6.3 : une
**fourchette**, sa **source et sa date** écrites, jamais posée seule dans le
devis, et la mention « Ce n'est pas votre prix : à vous de fixer le vôtre ».
Et pour la base d'Opus, jamais rien qui permette de deviner qui a fourni le
chiffre.

> **L'agent ne donne jamais un prix sorti de sa mémoire.** Un modèle d'IA
> produit un nombre plausible, ni daté ni régional. Présenté comme un prix du
> marché, c'est une information fausse qui engage l'artisan
> (`DEVIS-DU-PROPRIETAIRE.md` §6.2).

> **Et la forme la plus sûre est la DÉCOMPOSITION, pas le prix tout fait.**
> Le Conseil de la concurrence a jugé illicite une série de prix construite
> avec des valeurs moyennes, des coefficients forfaitaires et une marge
> prédéterminée (99-D-08, <https://www.autoritedelaconcurrence.fr/sites/default/files/commitments//99d08.pdf>),
> et a mis en garde contre un outil qui « intégrerait des données permettant
> de déterminer automatiquement des coûts […] et de calculer des prix »
> (avis 03-A-18, §45, <https://www.autoritedelaconcurrence.fr/sites/default/files/commitments//03a18.pdf>).
> Ces décisions visaient des organisations professionnelles, pas un éditeur.
> Mais une plateforme qui renverrait à ses artisans des prix moyens marge
> comprise s'en rapprocherait. Montrer le **temps et les quantités**, et
> laisser chacun poser **son** taux horaire, **ses** frais généraux et **sa**
> marge, c'est la méthode du déboursé sec — et c'est la prudente.

---

## 3. Comment les autres logiciels font (et ce que ça coûte)

### 3.1 En France : deux bases, revendues en option

| logiciel | d'où viennent ses prix | coût affiché |
|---|---|---|
| **Obat** | une bibliothèque maison de 30 000 ouvrages (« bureaux d'étude partenaires » non nommés, mise à jour annuelle) + **BatiChiffrage en option** + une extension Chrome qui capture les prix des sites fournisseurs | BatiChiffrage : 12 €/mois ou 120 €/an par catalogue (<https://www.obat.fr/devis-factures/bibliotheques>) |
| **Batappli** (Systemlog, groupe Isagri) | **BatiChiffrage intégré** (1 lot inclus) + import de plus de 300 fichiers de tarifs fournisseurs | 39 € HT/mois ; lot supplémentaire 9 €/mois ou 99 €/an (<https://www.batappli.fr/tarifs>) |
| **Mediabat** | **BatiChiffrage en option** + catalogues fournisseurs | 37 à 67 €/mois (<https://www.mediabat.com/tarifs/>) |
| **Costructor** | **Batiprix en option** (« ouvrages Batiprix ») ; en formule Business+, « demandes de prix et bons de commandes » et import des factures d'achats. Une extension de capture de la page produit, relevée par une première recherche, **n'apparaît ni sur son accueil ni sur ses tarifs** au 17/10/2026 | Pro 12,50 € HT/mois en annuel (<https://costructor.co/tarifs/>) |
| **Tolteck** (lancé en 2017 ; Saint-Gobain Distribution Bâtiment France en a pris la majorité en 2018, d'après Batiweb du 22/10/2020) | les **prix négociés Point.P et Cedeo** de l'artisan, lus par son compte | 19 € HT/mois en annuel (<https://www.tolteck.com/fr-fr/tarifs/>) |
| **Extrabat** | une « base article fournisseurs » (page des tarifs, relue le 17/10/2026) ; les « 1 800 bibliothèques via HerculePro » d'une première recherche n'y figurent pas, et HerculePro revendique environ 1 200 tarifs de fabricants de menuiserie (non vérifié) | dès 49 € HT/mois (<https://www.extrabat.com/tarifs/>) |
| **Renalto** | « vos prix, ou des prix du marché si vous n'en avez pas » (accueil, relu le 17/10/2026) ; on y importe ses anciens devis pour en extraire ses prix. La mention « Prix non vérifié » sur chaque ligne, relevée par une première recherche, **n'apparaît pas sur ses pages publiques** : à revérifier dans l'application | 20 € HT/mois en annuel (<https://www.renalto.fr/tarifs>) |
| **Cegid Boby** | « l'IA est capable de vous générer une bibliothèque de prix sur mesure » — **aucune source citée** | non relevé |

> **Les extensions de capture de prix ne se copient pas.** Celle d'Obat (et,
> d'après une première recherche non confirmée sur ses pages, celle de
> Costructor) fait capturer les prix des sites des négoces **par
> l'utilisateur**, qui porte alors le risque. Pour Opus, la même fonction
> répétée sur tous ses artisans deviendrait une extraction répétée et
> systématique de la base du négoce au profit d'Opus (CPI L342-2) : à
> exclure sans accord du négoce. Et on n'ouvre pas de compte chez un
> concurrent pour étudier son outil : les conditions de Costructor
> interdisent d'ouvrir un compte « en vue d'élaborer un produit ou service
> concurrent ».

Une **correction** pour `docs/CONCURRENCE-DEVIS.md` (§11, question 3), qui
écrivait « Batiprix se vend 10 à 12 € par mois » : ce sont les catalogues
BatiChiffrage chez Obat qui coûtent 12 €/mois. Batiprix Data coûte 279 € HT
(lot Gros œuvre, millésime 2027) et 789 € HT (pack tous corps d'état, base
actualisée), pour un utilisateur ; la durée n'est pas écrite sur la fiche, et
les CGV parlent d'abonnements de 12, 24 ou 36 mois (moteur de prix de la
boutique, relevé le 17/10/2026,
<https://www.batiprix.com/data/425-logiciel-facturation-partenaire-compatible-batiprix.html>).

### 3.2 Aux États-Unis : même schéma, et une API qui s'est refermée

- **Handoff (1build)** a fait ce que vous décrivez : une base de prix des
  matériaux et de la main-d'œuvre, puis une API vendue aux autres logiciels.
  Sa base viendrait des prix publics des négociants (Home Depot, Lowe's,
  d'après une source tierce), et **Handoff a signé un partenariat avec Home
  Depot** — prix du magasin le plus proche du chantier, actualisés chaque
  jour (son billet du 04/11/2025,
  <https://www.handoff.ai/blog/announcing-handoff-home-depot-live-store-pricing-in-every-estimate>) ;
  il se sert aussi des données de ses clients, que ses conditions de juillet 2026
  l'autorisent à agréger (« aggregated, anonymized data to improve our
  pricing models », <https://www.handoff.ai/terms-of-use>). Au 17/10/2026,
  l'API n'est plus qu'en **liste d'attente** (<https://handoff.ai/1build>).
  **En Europe, ce modèle ne se transpose pas** : collecter les catalogues
  des négoces sans leur accord serait une extraction de base protégée (CPI
  L342-1 et L342-2).
- **Clear Estimates** se vend sur la phrase « not AI-guessed » : la
  **provenance** devient un argument commercial (<https://go.clearestimates.com/home>).
- **Joist** et **Buildertrend** ne fournissent pas de prix : ils branchent les
  prix ou l'historique d'achats de l'artisan chez son fournisseur.

### 3.3 Ce qu'on en retient

1. **Les logiciels ne fabriquent pas les prix, ils les revendent.** En France,
   presque tous passent par BatiChiffrage ou Batiprix, en option payante.
2. **Le schéma s'est imposé partout avec l'IA** : 1) les prix de l'artisan,
   2) la bibliothèque de l'éditeur, 3) une estimation du modèle. **Aucun
   éditeur relu ne montre, sur ses pages publiques, la source de chaque
   ligne** (Renalto distingue « vos prix » et « des prix du marché » ; qu'il
   marque chaque ligne reste à vérifier dans l'application). C'est la
   discipline d'Opus, et c'est aussi un argument de vente.
3. **« Apprendre vos prix » ne veut pas dire entraîner un modèle** : c'est
   importer les anciens devis, suggérer les postes déjà écrits, retenir les
   favoris. C'est exactement l'idée de votre §5 — et elle ne demande aucune
   base tierce.
4. **Les grands se servent des données de leurs clients, par une clause des
   conditions** : BatiChiffrage (« mutualisation des données de chiffrage »),
   Batappli, Cegid (art. 8.4 : propriété des analyses agrégées), Handoff,
   Tolteck (les données « ne sont ni vendues, ni transmises à des tiers au
   groupe Saint-Gobain » — donc elles peuvent circuler dans le groupe).
   **Renalto promet l'inverse** : « vos Données ne sont pas utilisées pour
   améliorer les Données […] d'autres Utilisateurs ». C'est un choix de
   confiance, à faire en connaissance de cause (§4).
5. **Un modèle utile, chez Obat** : ses conditions intègrent une convention
   de sous-traitance RGPD (art. 28) pour les données des clients de
   l'artisan. C'est exactement le contrat qui manque à Opus
   (`EDITEUR.contratSousTraitance` vaut `false` dans `src/data/legal.js`).

> **La question du coût pour Opus n'a pas de réponse publique.** Aucun
> éditeur ne publie le prix d'une licence qui permettrait d'offrir sa base à
> tous les artisans d'Opus, ou de la faire lire par un agent. Le seul modèle
> chiffré est celui où **l'artisan paie lui-même** son abonnement.

---

## 4. Construire la base d'Opus avec ses artisans

### 4.1 Quatre façons d'obtenir des prix réels

| façon | qui la pratique | ce que ça demande |
|---|---|---|
| **l'enquête** : une équipe reconstitue les prix | RSMeans (États-Unis : « 50+ » chercheurs, plus de 30 000 heures par an), Spon's (Royaume-Uni, AECOM) | une équipe permanente |
| **la mise en commun réciproque** : je donne mes documents de prix, je reçois une comparaison | BCIS (Royaume-Uni, depuis 1962, plus de 21 000 projets) | une contrepartie immédiate |
| **la contribution payée** | BKI (Allemagne) : 200 à 700 € par projet complet, 10 € par corps d'état pour un bordereau ; SIRADOS (Allemagne) : « rémunération attractive » | un budget |
| **le sous-produit d'un logiciel** : les prix tapés dans l'outil | Xactware (États-Unis, logiciel de devis de sinistres pour les assureurs : il tire ses prix des devis de ses utilisateurs), Gordian (le groupe américain de RSMeans), avec ses « Resultant Data » | des utilisateurs nombreux |

Sources : <https://www.rsmeans.com/what-is-construction-estimating> ·
<https://www.bcis.co.uk/products/data-collection/send-us-your-data/> ·
<https://bki.de/projekt-einreichen> · <https://www.sirados.de/blog/datenerhebung-und-redaktion> ·
<https://www.verisk.com/privacy-policies/xactware-eula/>

**Opus est naturellement dans la quatrième.** Son futur module de devis
produira des lignes structurées — quantité × prix unitaire. C'est exactement
le document que BCIS doit ressaisir à la main pour calculer ses indices.

> **Mais la quatrième façon est aussi celle des contre-modèles.** Xactware
> **oblige** ses clients à répondre à ses enquêtes de prix (contrat, §14.2) et
> s'approprie leurs données anonymes (§14.4). Gordian s'attribue les données
> agrégées de ses clients (§16.3 de ses conditions du 16/03/2026). Une base
> construite ainsi, en silence, détruirait ce qui la fait vivre : la
> confiance des artisans — la première des quatre conditions que
> `A-FAIRE.md` pose à votre modèle économique.

### 4.2 Ce que font les deux bases qui vivent de contributions

| | BCIS | BKI |
|---|---|---|
| qui en est propriétaire | la RICS (Royal Institution of Chartered Surveyors), l'organisation professionnelle britannique des métreurs et économistes de la construction | les 16 chambres régionales d'architectes |
| ce qui est déposé | les documents de prix d'**offres acceptées** | les coûts de projets **achevés et facturés** |
| la contrepartie | un rapport gratuit qui compare le projet aux projets semblables | de l'argent, un livre, la publication du nom du cabinet |
| la règle de dépôt | 14 jours pour relire, corriger ou refuser la publication — **le silence vaut accord** | candidature, suivi par un correspondant régional |
| la licence prise | « gratuite, perpétuelle, irrévocable », distribution commerciale **anonymisée** comprise (CGV 7.2) ; aucune donnée personnelle (7.6) | — |
| le volume | plus de 21 000 projets en 60 ans | 3 903 fiches publiées (relevé du 17/10/2026) |

Sources : <https://www.bcis.co.uk/terms-conditions-of-sale/> ·
<https://www.bcis.co.uk/bcis-data-collection-confidentiality-policy/> ·
<https://bki.de/projekt-einreichen> · <https://bki.de/agb>

Trois leçons :

- **Ces bases appartiennent à la profession**, et on y contribue par devoir.
  Opus, acteur privé, doit compenser : une méthode publiée, une charte de
  contribution, peut-être des artisans dans un comité ;
- **le volontariat produit un petit débit** : quelques milliers de projets en
  30 ans chez BKI, malgré l'indemnité (à part : Thumbtack, place de marché
  américaine, cite Xactware comme source de certains de ses tableaux de
  prix) ;
- **le « silence vaut accord » de BCIS ne se transpose pas** : un artisan en
  entreprise individuelle est une personne physique, et le RGPD exige un
  consentement actif.

### 4.3 Les conditions, une par une

**Le consentement.** Une case à part, non cochée, expliquée avant la première
saisie, qu'on peut décocher à tout moment ; refuser ne change rien au service
(`DONNEES-DES-ARTISANS.md` §2.1 et §6.1).

> **Ni silence qui vaut accord, ni obligation par les conditions générales.**
> Le premier n'est pas un consentement au sens du RGPD. Le second pourrait
> tomber sous le règlement européen sur les données (Data Act, art. 13), qui
> rend sans effet une clause abusive imposée par une entreprise à une autre
> sur l'usage des données — champ et date d'application à vérifier au
> Journal officiel.

**L'anonymat.** Retirer le nom ne suffit pas : « placo à Lambesc, 25 € »
désigne Dylan s'il est le seul plaquiste d'Opus à Lambesc. Vous l'avez tranché
le 17/10 : **aucun chiffre ne doit permettre de deviner la source**, et **la
fourchette est régionale** — « il faut que les prix correspondent à chaque
région » (`A-FAIRE.md`, dernière section). Les seuils chiffrés qui existent :

| repère | ce qu'il fixe | ce qu'il est vraiment |
|---|---|---|
| INSEE, secret statistique | pas de chiffre sur moins de 3 entreprises, ni si l'une pèse plus de 85 % | une règle de protection des **tableaux statistiques**, pas un seuil RGPD ni de concurrence (<https://www.insee.fr/fr/metadonnees/source/indicateur/p1724/confidentialite>) |
| accord Agri Stats (États-Unis, 07/05/2026) | au moins 3 contributeurs, aucun au-delà de 70 %, données vieilles d'au moins 45 jours en moyenne | un **projet** d'accord, pas encore homologué (<https://www.arnoldporter.com/en/perspectives/advisories/2026/05/agri-stats-settlement>) |
| anciennes règles américaines (retirées en 2023) | 5 contributeurs, 90 jours | historique |
| lignes directrices européennes (2023) | **aucun chiffre** ; une donnée est historique si elle a « plusieurs fois » l'âge d'un cycle de prix ; « plus d'un an » vient de décisions anciennes | le texte qui s'applique à Opus (<https://competition-policy.ec.europa.eu/system/files/2023-07/2023_revised_horizontal_guidelines_en.pdf>) |

> **Une proposition à faire valider par un avocat, et rien de plus :** au
> moins **5 entreprises différentes** (5 SIREN) derrière chaque chiffre,
> aucune au-delà de **50 %**, un **trimestre clos** au minimum, la
> **région** — le département seulement là où il y a assez d'artisans —,
> jamais la commune, et une **fourchette** (premier quartile, médiane,
> troisième quartile), jamais un prix unique.
> Une case qui n'atteint pas le seuil n'affiche rien, et l'écran le dit :
> « pas encore assez de données ».

**Le poste précis.** Vous l'avez posé le 17/10 : un chiffre porte sur un
poste, jamais sur un mot. Dans vos propres devis, « le placo » vaut 48 €/m²
en contre-cloison, 58 € en cloison isolée, 72 € en faux plafond isolé
(`A-FAIRE.md`). Toutes les bases
sérieuses ont d'abord une **nomenclature** commune (DIN 276 en Allemagne, NRM
pour BCIS, MasterFormat pour RSMeans). C'est le prérequis d'Opus, et il est à
construire — sur le modèle de `src/data/catalogue-metiers.js` : une seule
source, des clés stables, un contrôle qui refuse qu'elle diverge.

**Le moment du prix.** BKI ne retient que des coûts facturés, BCIS des offres
acceptées, SIRADOS prend aussi les offres non retenues pour dessiner une
fourchette. Opus doit étiqueter chaque prix — **tarif posé par l'artisan,
devis envoyé, devis signé, facture** — et ne jamais les mélanger dans une même
statistique.

> **Le prix d'un devis SIGNÉ est le plus précieux, et le plus encadré.**
> `A-FAIRE.md` le présente comme l'avantage unique d'Opus. Mais un prix signé
> est aussi une donnée du **client** de l'artisan, dont Opus n'est que le
> sous-traitant : la réutiliser pour sa propre base est très difficile
> (`DONNEES-DES-ARTISANS.md` §2.4). Le tarif que l'artisan pose lui-même pour
> un poste est la matière la plus sûre.

**La circularité.** Si l'outil propose un prix et que l'artisan l'accepte, la
base apprend ses propres suggestions — le défaut que les critiques reprochent
à Xactware. Opus doit enregistrer l'**origine** de chaque prix : tapé par
l'artisan, proposé par l'agent, proposé puis modifié. Seuls les prix tapés,
modifiés ou facturés devraient compter.

**La séparation.** Vous êtes vous-même artisan. Votre compte, administrateur
compris, ne doit pas pouvoir lire les prix individuels des autres : le calcul
des fourchettes tourne **dans la base**, par une fonction qui ne rend que des
cases assez remplies (`DONNEES-DES-ARTISANS.md` §5.2). Ce sont des règles
tenues par la base, pas par l'écran — la règle de toujours du projet.

**Les données des clients n'entrent jamais.** Une ligne de devis peut porter
« chez Mme Martin, 4 rue des Lilas ». Le carnet de clients a posé la règle
(section 41 de `schema.sql`) : ces personnes n'ont rien accepté, et Opus est
leur sous-traitant. Tout nom, adresse ou téléphone se retire avant qu'une
ligne ne puisse contribuer — comme BCIS exige qu'aucune donnée personnelle ne
soit déposée.

### 4.4 La contrepartie

| contrepartie | où on l'a vue |
|---|---|
| un rapport mensuel : « votre prix face à la fourchette de votre département » | BCIS (rapport de comparaison) |
| voir les fourchettes de sa région pour un poste jamais fait | CII (accès réciproque aux agrégats, <https://www.construction-institute.org/blog/code-of-conduct>) |
| une page « Ma contribution » : ce qu'il a versé, à quoi ça a servi, un bouton pour retirer | `DONNEES-DES-ARTISANS.md` §6.2 |
| une part des revenus de l'API, plus tard | BKI (paiement par contribution) |

Les réserver aux contributeurs est un modèle courant ; sa compatibilité avec
un consentement « libre » n'est **pas vérifiée** (`DONNEES-DES-ARTISANS.md`
§8).

### 4.5 Jamais un prix conseillé

- **La décision 19-D-19** (30/09/2019) : l'Ordre des architectes condamné à
  1,5 M€ pour avoir diffusé et imposé un barème, avec une « police des
  prix » — alertes sur les offres « trop basses », poursuites
  (<https://www.autoritedelaconcurrence.fr/fr/decision/relative-des-pratiques-mises-en-oeuvre-dans-le-secteur-des-prestations-darchitecte>) ;
- **les lignes directrices de 2023** visent nommément « un outil de fixation
  des prix proposé par une seule société […] auquel plusieurs concurrents ont
  accès » (point 402, cité dans `DONNEES-DES-ARTISANS.md` §5.4).

> **Ce que l'agent peut dire :** « votre prix est dans le tiers haut de la
> fourchette régionale » — une information sur LUI, à lui seul. **Ce qu'il ne
> dit jamais :** « le prix à mettre est X », « alignez-vous », « vous êtes
> sous la médiane » sous forme d'alerte. Et aucun artisan ne peut signaler le
> prix d'un autre : c'est la police des prix.

> **Et le jour où la base se vend par API** — des agrégats anonymes
> seulement, à des acheteurs que vous aurez choisis (`A-FAIRE.md`, deuxième
> et quatrième conditions) —, le contrat de l'acheteur doit lui interdire
> d'imposer ces prix aux artisans. Xactware a cette clause
> (§14.3 : le client ne doit pas interdire les écarts par rapport à la liste
> de prix). C'est la parade directe au risque de barème.

### 4.6 Une source massive et licite que personne ne cite : les factures d'achat électroniques

Depuis le 01/09/2026, toute entreprise assujettie à la TVA doit pouvoir **recevoir**
des factures électroniques ; les grands négoces émettent déjà les leurs
(SAMSE l'écrit à ses clients :
<https://www.samse.fr/media/wysiwyg/upload/CourrierReformeFacturationElectronique.pdf> ;
calendrier : <https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique>,
et `CONCURRENCE-DEVIS.md` §6, qui note que les sources divergent pour les
ETI, les entreprises de taille intermédiaire). Ces factures arrivent
**structurées**, ligne par ligne : désignation, référence, quantité, prix
unitaire **net**.

C'est la seule source de vrais prix d'achat, régionaux, frais. Elle appartient
à l'artisan, et Opus peut l'importer **pour lui** avec son accord.

**Comment** : une facture électronique arrive sur la **plateforme agréée**
que l'artisan a choisie. Opus peut la lire de deux façons — par le **dépôt du
fichier Factur-X** à la main, ou par un **connecteur vers la plateforme
agréée** de l'artisan, ce qui demande un accord avec chaque plateforme. Opus
n'est pas une plateforme agréée, et n'a pas à le devenir pour cela. Trois
réserves avant d'en faire une base commune : mettre en commun des prix
d'achat entre concurrents est un échange d'informations sensibles ; certaines
conditions négociées avec un négoce peuvent être confidentielles ; et le
calendrier doit être confirmé par votre comptable.

### 4.7 La licence se prend dès la première contribution

Opus deviendra « producteur » de sa base s'il y investit substantiellement
(CPI L341-1) — et sera alors protégé comme ceux qu'il ne peut pas copier
aujourd'hui. Mais la matière vient des artisans : ce qu'ils accordent doit
être écrit **dès le premier jour**, pour l'usage par les agents ET pour l'API
vers des tiers. Une licence de ce genre ne se récupère pas proprement après
coup. C'est le sens de la règle de `DONNEES-DES-ARTISANS.md` §4.1 : écrire les
conditions **avant** les premiers vrais utilisateurs.

---

## 5. Les CONNAISSANCES — lois, DTU, guides

Pour préparer votre futur cahier des charges, chaque source est jugée sur
quatre gestes :

| geste | ce qu'il veut dire |
|---|---|
| **citer** | donner la référence : numéro, titre, date d'édition |
| **résumer** | l'agent dit, avec ses mots, ce que contient le document |
| **intégrer** | ranger le texte intégral dans la base que l'agent consulte |
| **redistribuer** | le servir par l'API d'Opus à d'autres applications |

### 5.1 Le droit public : tout est permis

| source | contenu | citer · résumer · intégrer · API | condition |
|---|---|---|---|
| **LEGI, JORF, KALI** (archives de la DILA, la direction qui publie le Journal officiel) | les 73 codes consolidés (construction, civil, assurances, consommation, travail…), lois, décrets, arrêtés, conventions collectives du BTP | oui · oui · oui · oui | Licence Ouverte **version 1**, d'après data.gouv ; citer la source et la date ; dire que **seul le Journal officiel fait foi** |
| **API Légifrance** (portail PISTE, les API de l'État) | les mêmes textes, interrogeables | oui · oui · oui · oui | des identifiants secrets (OAuth) à ne jamais divulguer ; aucune garantie ; l'utilisateur indemnise la DILA en cas de préjudice |
| **LEGI vectorisé** (DINUM, Hugging Face) | une **copie non officielle** de LEGI, déjà découpée et vectorisée (modèle bge-m3), avec statut et dates de chaque article. Dernier instantané daté : **26/09/2026** | oui · oui · oui · oui | dater chaque réponse d'après le paquet de la DILA d'origine ; filtrer sur « en vigueur » et sur les dates ; revectoriser si on change de modèle ; **l'héberger a un coût** (encadré ci-dessous) |
| **Fiches Service-Public** | la vulgarisation officielle : travaux, urbanisme, devis, garanties | oui · oui · oui · oui | mention « Source : Service Public / DILA – Mise à jour : JJ/MM/AAAA » |
| **BOFiP** (doctrine fiscale) | les taux de TVA des travaux, l'autoliquidation en sous-traitance | oui · oui · oui · oui | API gratuite sur data.economie.gouv.fr ; jamais de collecte du site |
| **Questions écrites** (Assemblée, Sénat) | les interprétations des ministres (TVA, décennale, normes) | oui · oui · oui · oui | une réponse ministérielle ne lie pas le juge : la dater |
| **Fiches des certificats d'économies d'énergie** | les exigences techniques minimales pour que le client touche l'aide | oui, **par le Journal officiel** | ce sont des annexes d'arrêtés |
| **Géorisques** (API) | argiles, sismicité, radon à une adresse | oui · oui · oui · oui | éprouvée sans clé le 17/10/2026 ; l'interroger avec l'adresse d'un chantier, c'est transmettre une donnée : voir §5.5, point 9 |
| **Liste et historique des entreprises RGE** (ADEME) | le registre des qualifications « reconnu garant de l'environnement », par domaine de travaux, avec un historique depuis 2014. L'agent y voit si un artisan ouvre droit aux aides ; Opus peut s'en servir pour sa propre vérification | oui · oui · **avec obligations** · avec obligations | Licence Ouverte 2.0 d'après data.gouv ; mise à jour du 10/10/2026. Les coordonnées d'une entreprise individuelle (nom, adresse, téléphone, courriel) sont des données personnelles : Opus ne sert que le statut RGE, par SIRET et par domaine, jamais les coordonnées, et ne s'en sert pas pour démarcher |
| **RNCP, ROME** | les référentiels des diplômes et des métiers du bâtiment | ROME : oui · oui · oui · oui — RNCP : **non vérifié** | ROME : Licence Ouverte version 1 d'après data.gouv (18/06/2026) ; conditions de l'API francetravail.io non lues. RNCP : aucune licence lue |
| **Jurisprudence** (Judilibre, JADE) | décennale, réception, sous-traitance | oui · oui · **avec obligations** · avec obligations | données personnelles ; occulter sur demande ; **interdiction pénale de profiler les juges** (code de l'organisation judiciaire, L111-13) |

Pages lues : <https://piste.gouv.fr/images/cgu/DILA_Legifrance_Beta_v2.pdf> ·
<https://echanges.dila.gouv.fr/OPENDATA/> ·
<https://www.data.gouv.fr/datasets/legi-codes-lois-et-reglements-consolides> ·
<https://huggingface.co/datasets/AgentPublic/legi> ·
<https://www.service-public.gouv.fr/P10004> ·
<https://bofip.impots.gouv.fr/footer/mentions-legales> ·
<https://echanges.dila.gouv.fr/OPENDATA/Questions-Reponses/> ·
<https://www.georisques.gouv.fr/mentions-legales> ·
<https://piste.gouv.fr/images/cgu/CGU_open_data_V8.pdf> ·
<https://echanges.dila.gouv.fr/OPENDATA/AVERTISSEMENT-Donnees_a_caractere_personnel.pdf> ·
fiches data.gouv.fr de la liste RGE et du ROME (métadonnées relues le 17/10/2026)

> **Le socle « lois » est le plus facile à monter — mais il n'est pas
> gratuit.** Les textes sont libres, et une version de LEGI déjà découpée et
> vectorisée existe. Mais c'est un **dérivé non officiel**, et la date du
> 17/10/2026 affichée sur sa page est celle d'un dépôt, pas celle des
> données : le dernier instantané daté est « legi-20260926 », et
> « legi-latest » est réécrit morceau par morceau. Chaque réponse se date
> donc d'après le paquet de la DILA d'origine, et seul le Journal officiel
> fait foi.
>
> **Ce qu'il coûte vraiment**, mesuré par l'API de Hugging Face le 17/10 :
> « legi-latest » pèse environ **11,9 Go**, et le dépôt entier, instantanés
> compris, environ **270 Go**. Le projet Supabase d'Opus est en plan
> gratuit, dont la base est limitée à quelques centaines de mégaoctets
> (500 Mo d'après le contradicteur, de mémoire : à vérifier). Et des
> vecteurs bge-m3 ne servent que si chaque question est vectorisée avec le
> **même modèle** — qu'Anthropic ne fournit pas. Il faudrait donc héberger
> un index de vecteurs et un modèle de vectorisation, ou payer un service
> tiers.
>
> **D'où la recommandation : un SOUS-ENSEMBLE utile au bâtiment, revectorisé,
> et chiffré avant d'être engagé** — le code de la construction et de
> l'habitation, le code civil (art. 1792 et suivants, la garantie
> décennale), le code des assurances (art. L241-1 et suivants), le code de
> la consommation, le code de l'urbanisme, et les arrêtés techniques repérés
> dans le Journal officiel.
>
> Deux autres limites : LEGI ne consolide qu'**une sélection d'arrêtés** (les
> autres n'existent qu'en version d'origine dans JORF, et l'agent citerait
> une version périmée) ; et la jurisprudence se cite par lien plutôt qu'elle
> ne s'ingère en masse.

### 5.2 Les règles de l'art : tout est réservé

| source | ce que dit la licence | citer | résumer | intégrer · API |
|---|---|---|---|---|
| **NF DTU, normes AFNOR** | « AFNOR s'oppose expressément à l'intégration, la transmission, l'absorption […] dans des moteurs ou algorithmes d'intelligence artificielle », et à toute fouille de textes (CGV du 21/02/2024, art. 7) | **oui** | **pas par une IA** (« création dérivée » interdite) | **non** sans accord — improbable : AFNOR vend sa propre IA sur les normes depuis juillet 2026 |
| **CSTB** (Batipédia et Reef, ses abonnements en ligne aux NF DTU et aux documents techniques) | même clause, art. 9.4 des CGU (V11, 13/03/2026) ; son autorisation AFNOR « s'entend exclusivement du CSTB » | oui | non | non sans l'accord du CSTB **et** d'AFNOR |
| **Avis Techniques** (CCFAT, CSTB) | consultation gratuite ; « tous les droits de reproduction sont réservés » | **oui** (numéro, titulaire, procédé, validité, domaine d'emploi : ce sont des faits) | oui, à partir de ces faits | avec accord |
| **AQC** : fiches pathologie, liste de la C2P | « pour toute autre réutilisation, nous contacter » | oui (titre, statut « accepté par la C2P ») | — | **avec accord — la piste la plus naturelle** |
| **Pro'Réno** (recommandations RAGE, PACTE, PROFEEL) | « toute reproduction, […] incorporation […] sont interdites, sans l'autorisation écrite préalable » de l'AQC | oui | — | avec accord ; les fiches d'autocontrôle sont l'usage le plus naturel à négocier |
| **ADEME, guides** | réutilisation « non commerciale et pédagogique » ; licence commerciale prévue | oui | — | avec licence |
| **Règles professionnelles** (CSFE…) | introuvables (kiosque injoignable) — **l'absence de licence vaut interdiction** (CPI L111-1) | oui | — | avec accord |
| **OPPBTP, INRS, Cerema, ANIL, FFB** | tous droits réservés | oui (lien et référence) | — | avec accord |
| **INIES** (fiches environnementales des produits, RE2020) | consultation gratuite, webservice payant | oui | — | **2 800 € HT/an** |
| **NF P03-001** (clauses des marchés privés) | norme AFNOR | oui | non | non — le CCAG des marchés **publics**, lui, est un arrêté, donc libre |
| **CObaz** (l'abonnement en ligne aux normes d'AFNOR), **Kheox** (une base de veille réglementaire d'Infopro Digital, le groupe du Moniteur) | abonnements ; Kheox interdit de « reconstituer […] une base de données » | — | — | **non** |

Pages lues : <https://standardstore-cdn.afnor.org/standardstore/documents/CGV.fr-FR.pdf> ·
<https://www.batipedia.com/lecture-des-CGU.html> · <https://www.ccfat.fr/mentions-legales/> ·
<https://qualiteconstruction.com/mentions-legales/> ·
<https://www.proreno.fr/conditions-generales-utilisation> ·
<https://librairie.ademe.fr/content/2-mentions-legales> ·
<https://www.preventionbtp.fr/conditions-generales-d-utilisation> ·
<https://www.inrs.fr/footer/mentions-legales.html> · <https://www.cerema.fr/fr/mentions-legales> ·
<https://www.anil.org/mentions-legales/> · <https://www.inies.fr/le-webservice/demander-un-acces/> ·
<https://www.infopro-digital.com/fr/cgv/conditions-generales-de-ventes-conditions-generales-dabonnement-et-dutilisation-kheox/> ·
<https://www.afnor.org/api/file/uploads/Communique_de_presse_Cobaz_Compagnon_IA_9bfb9ed19c.pdf>

Prix 2026 d'un NF DTU au CSTB : de 118,29 à 225,70 € HT (NF DTU 20.13 et
20.1). Les acheter ne donne aucun droit de les mettre dans l'agent.

### 5.3 Les zones grises

| source | pourquoi c'est gris |
|---|---|
| **Portail RT-RE** (RE2020, DPE) | le pied de page dit « licence etalab-2.0 », les mentions légales disent « tous les droits de reproduction sont réservés » (<https://rt-re-batiment.developpement-durable.gouv.fr/mentions-legales-a3.html>). Prendre les textes dans LEGI ou JORF |
| **ANAH** | même contradiction (<https://www.anah.gouv.fr/mentions-legales>) |
| **Géoportail de l'urbanisme** (PLU, API Carto) | éprouvé sans clé ; conditions du site non lisibles (erreurs 500 et 404) — très probablement libre |
| **Justice administrative**, **EUR-Lex** | conditions non lues (EUR-Lex probablement CC BY 4.0, d'après l'Office des publications) |
| **BDNB** (base de données nationale des bâtiments) | le jeu ouvert est en Licence Ouverte 2.0 d'après data.gouv (05/10/2026) ; l'offre payante de bdnb.io a ses propres conditions, non lues |

> **« Tous droits réservés » chez un organisme PUBLIC n'est pas le dernier
> mot.** Le code des relations entre le public et l'administration pose la
> réutilisation libre et gratuite (CRPA L321-1, L324-1), sauf pour les
> documents sur lesquels des **tiers** ont des droits (L321-2 c). C'est un
> argument de négociation, pas une autorisation : un juriste tranche. Chez un
> organisme **privé** (AQC, FFB, syndicats), l'absence de licence vaut
> interdiction.

### 5.4 Les règles qui en découlent

> **L'agent ne propose JAMAIS à un artisan de téléverser son NF DTU**, sa
> page Reef ou un guide acheté pour l'interroger. Sa licence est
> individuelle et interdit l'IA en toutes lettres ; Opus en deviendrait
> complice. Même règle pour un document de l'AQC, de l'OPPBTP ou de l'INRS.

> **L'agent ne lit jamais une base de prix ou un tarif acheté ou téléchargé
> par l'artisan, même déposé dans son espace privé, sans l'accord écrit de
> l'éditeur ou du fabricant.** C'est la même règle que pour un NF DTU, et
> pour les mêmes raisons : Batiprix ne permet que la « visualisation sur
> écran et impression », par les salariés de l'abonné ; BatiChiffrage
> interdit nommément « les logiciels ou bases de données » sans licence
> spécifique ni référencement ; Legrand réserve son tarif à un usage
> « personnel et privé dans un but non commercial », et Hager en interdit
> la reproduction sans autorisation ; Artiprix n'a aucune licence écrite,
> donc rien n'est accordé. Le simple rangement d'un tel fichier, sans
> agent, est traité au §1.2.

> **Une référence est un fait ; une liste est une base.** Un numéro et un
> titre de DTU se citent librement. Mais la liste de la FFB porte « usage
> interne uniquement », et aspirer d'un bloc le catalogue d'un éditeur touche
> à son droit de producteur. La table des références d'Opus se construit en
> **recoupant** plusieurs sources.

> **Les idées ne sont pas protégées, la forme l'est.** Expliquer avec ses
> propres mots une règle technique qu'on connaît est permis. Le faire à
> partir du texte acheté, ou le faire faire par une IA qui a lu le texte, ne
> l'est pas. La courte citation dans une réponse générée est à faire
> valider par un avocat en propriété intellectuelle avant tout usage
> systématique.

> **Lire gratuitement n'est pas reproduire.** Seules les normes rendues
> **obligatoires** par un arrêté se lisent gratuitement (Conseil d'État,
> 28/07/2017, n° 402752). Presque aucun NF DTU n'est dans ce cas
> (connaissance générale, non revérifiée). Et pour la
> NF C 15-100 (la norme des installations électriques des logements),
> l'édition lisible gratuitement est celle de **décembre 2002,
> mise à jour en 2005** — pas la nouvelle série : l'agent doit nommer
> l'édition, sinon il confond une exigence réglementaire avec une norme
> volontaire.

> **Vérifier QUI édite avant d'ingérer.** L'ancien site officiel des règles
> RAGE (reglesdelart-grenelle-environnement-2012.fr) appartient désormais à
> une société tierce, Starty Media. Les vraies recommandations sont sur
> proreno.fr.

### 5.5 Ce que le futur cahier des charges devra trancher

1. **Chaque fragment de la base porte son état civil** : source, identifiant
   officiel, date de la version, statut (en vigueur, abrogé, à venir), date
   de collecte. C'est ce qu'exige la Licence Ouverte, et c'est ce qui permet
   à l'agent de dire « en vigueur au… ».
2. **Deux compartiments séparés** : ce qui est libre (servi par l'API
   d'Opus) et ce qui est sous accord (réservé à l'usage que l'accord permet,
   **jamais** servi par l'API publique). Ce qu'un artisan dépose lui-même
   n'entre dans aucun des deux : c'est son espace privé, que l'agent ne lit
   pas sans accord écrit de l'éditeur (§5.4).
3. **La vraie valeur propre de la base, c'est le contenu ORIGINAL d'Opus** :
   votre savoir et celui des artisans du réseau, rédigés sans copier un texte
   vendu. Pour les comptes rendus de chantier, on en tire un savoir rangé
   (étapes, durées, matériaux), jamais le texte (`DONNEES-DES-ARTISANS.md`
   §2.3).
4. **Les licences à demander, par ordre de chances** : l'AQC (Pro'Réno,
   fiches pathologie, liste C2P), l'ADEME (licence commerciale annoncée par
   elle-même), le CSTB (Avis Techniques), AFNOR en dernier.
5. **Les conditions de VOTRE future API** : une réserve de fouille de textes
   lisible par machine (comme le font BKI et SIRADOS) et l'interdiction pour
   l'acheteur d'imposer vos prix (§4.5).
6. **Les secrets ne vivent jamais dans l'application** (règle de
   `CLAUDE.md`) : la clé PISTE de Légifrance, une clé logicielle Batiprix, un
   jeton Tarifeo vivent dans une fonction Edge. Et la clé Batiprix d'un
   artisan est **son** secret : rangée côté serveur, lisible de lui seul,
   comme ses documents privés.
7. **Toute nouvelle action de l'agent** (« chercher dans la base BTP »)
   passe par le journal, la permission et la limite de la section 38 de
   `schema.sql` — la règle « ne plus ajouter d'action IA à la main ».
8. **Où vit la base que l'agent consulte, et ce qu'elle coûte** : un index
   de vecteurs et un modèle de vectorisation ne tiennent pas dans le plan
   gratuit de Supabase (§5.1). Le cahier des charges doit dire ce qu'on y
   met — un sous-ensemble utile au bâtiment, pas tout LEGI — et le budget
   qu'on y consacre.
9. **Tout service extérieur que l'agent appellera avec des données** —
   Géorisques avec l'adresse d'un chantier, un service de vectorisation avec
   les questions des artisans (qui peuvent nommer un client) — **entre dans
   la liste « À qui vos données sont transmises » de la politique de
   confidentialité AVANT d'être branché**. C'est la règle posée pour la Base
   Adresse Nationale : même quand le destinataire est un service public
   français. Un prestataire privé demande en plus un contrat de
   sous-traitance (RGPD, art. 28).

---

## 6. Par où commencer

De la moins chère et la plus sûre à la plus ambitieuse. Aucune étape ne
s'engage avant votre cahier des charges, sauf l'étape 0, qui fait partie du
module devis déjà prévu.

| étape | ce qu'on fait | coût | risque | ce que l'artisan y gagne |
|---|---|---|---|---|
| **0. Ranger juste** | chaque poste de devis porte son unité, sa quantité, son prix en centimes, sa date, son département, sa catégorie de métier, son **statut** (tarif, envoyé, signé, facturé) et l'**origine** du prix (tapé, proposé, modifié). La base personnelle naît, **privée** et lisible du seul artisan (`DEVIS-DU-PROPRIETAIRE.md` §5, étage 1 et règle 4) | aucun | aucun | sa phrase et son prix, au deuxième devis |
| **1. Les sources libres** | index INSEE en cache, rafraîchi une fois par mois (jamais à chaque devis) ; « votre prix de 2024 vaudrait X aujourd'hui selon l'index de votre métier » ; une clause de révision de prix | aucun | faible | ses propres prix tenus à jour |
| **2. Le socle des lois** | un **sous-ensemble** de LEGI utile au bâtiment, revectorisé (§5.1), plus les fiches Service-Public, le BOFiP, Géorisques et le statut RGE des entreprises (jamais leurs coordonnées, §5.1), dans la base que l'agent consulte — avec leur état civil (§5.5) | l'hébergement d'un index de vecteurs et d'un modèle de vectorisation (ou un service tiers), **au-delà du plan gratuit de Supabase** — à chiffrer avant de l'engager | faible en droit ; le coût est le vrai risque | des réponses juridiques sourcées et datées |
| **3. Écrire aux éditeurs** | Batiprix (partenariat éditeur), BatiChiffrage (référencement et licence spécifique), l'AQC, l'ADEME, un ou deux fabricants. Avec les cinq questions ci-dessous | aucun, sauf votre temps | aucun : on demande | à terme, Batiprix ou BatiChiffrage dans Opus pour qui les paie |
| **4. Les textes juridiques** | conditions de contribution, convention de sous-traitance (modèle Obat), relecture par un avocat (propriété intellectuelle et concurrence), calendrier de la facture électronique par votre comptable | honoraires | — | la garantie que ses prix ne fuient pas |
| **5. La contribution consentie** | la case, les seuils tenus par la base, la page « Ma contribution ». **On publie d'abord des tendances** (« les prix de la rénovation ont monté de X % dans votre région »), les fourchettes régionales par poste précis, case par case, seulement quand le seuil est atteint | développement | moyen si mal fait | une fourchette régionale pour un poste jamais fait |
| **6. Les connecteurs** | le prix net de l'artisan par son compte chez son négoce ; l'import de ses factures d'achat électroniques (fichier Factur-X déposé, ou connecteur vers sa plateforme agréée, §4.6) | partenariats | faible (ses données à lui) | ses vrais prix d'achat dans ses devis |
| **7. L'API vendue** | les seuls agrégats anonymes, à des acheteurs que vous aurez choisis (`A-FAIRE.md`, deuxième et quatrième conditions), avec la clause anti-prix-imposé | développement | élevé si les acheteurs sont mal choisis | une part des revenus, si vous le décidez |

Les cinq questions à poser par écrit à chaque éditeur, avant toute promesse :

1. l'agent d'Opus peut-il **lire** vos données pour le devis de l'abonné, et
   les envoyer pour cela à un fournisseur d'IA ? (y compris un fichier que
   l'abonné déposerait lui-même dans Opus)
2. pouvons-nous les **conserver** (cache), et combien de temps ?
3. sont-elles exclues de tout **entraînement** de modèle ? (nous le
   proposons)
4. pouvons-nous les **redistribuer** à des applications tierces ?
5. à qui appartiennent les **données dérivées** (moyennes, ratios) ?

> **Un contrôle, sur le modèle de ceux du projet**, le jour où la base existe :
> refuser toute ligne sans source, licence et date — et éprouvé en cassant ce
> qu'il surveille, comme les autres.

---

## 7. Les questions à poser au propriétaire

Ce que vous avez déjà tranché le 17/10 n'y figure plus : la fourchette est
régionale, elle porte sur un poste précis, aucun chiffre ne permet de deviner
qui l'a fourni, et la base de chaque artisan reste privée.

1. Quand vous parliez de « télécharger la base des prix du bâtiment », de
   quelle base s'agissait-il ? (nom ou lien, pour lire ses conditions)
2. Batiprix ou BatiChiffrage en option, que l'artisan paie lui-même et
   branche dans Opus à côté de sa base personnelle : cela vous convient-il ?
3. Voulez-vous que j'écrive aux éditeurs (Batiprix, BatiChiffrage, AQC,
   ADEME) ? Et au nom de qui, puisqu'un contrat se signe avec une entreprise
   et qu'Opus n'en a pas encore (`STATUT = 'essai'`) ?
4. Pour la rénovation énergétique, en attendant les fourchettes régionales :
   afficher un ordre de grandeur **national** et ancien de l'ADEME, marqué
   comme tel, ou rien du tout ?
5. Votre base BTP sert-elle **d'abord** à vos agents, ou **d'abord** à être
   vendue par API ? Ce n'est pas la même licence à demander.
6. Voir les fourchettes de sa région : réservé aux artisans qui contribuent,
   ou ouvert à tous ?
7. Combien d'entreprises différentes, au minimum, derrière chaque chiffre ?
   Je propose 5, à faire valider par un avocat.
8. Avez-vous un budget pour un avocat (propriété intellectuelle et droit de
   la concurrence) avant les premiers vrais utilisateurs ?
9. Mettre les lois dans la base de l'agent demandera un hébergement payant,
   hors du plan gratuit de Supabase : voulez-vous que je le chiffre ?
10. Voulez-vous que l'artisan puisse importer ses factures d'achat
    électroniques, pour avoir ses vrais prix de matériaux ?
11. À qui accepteriez-vous de vendre un jour les fourchettes, et à qui
    jamais (par exemple un assureur qui s'en servirait pour baisser ses
    remboursements) ?

---

## 8. Ce qui n'a pas pu être vérifié

**Bases de prix vendues**

- Le prix de BatiChiffrage tous corps d'état : la page des tarifs affiche
  « 224 € HT, Édition 2026 » sur chaque format, sans dire si c'est pour un
  lot ou pour tous ; le chiffre de 672 € HT tous corps d'état, relevé par une
  recherche, **n'apparaît pas** sur cette page (revérifié le 17/10/2026).
- La durée des abonnements Batiprix Data : elle n'est pas écrite sur la
  fiche ; les CGV parlent de 12, 24 ou 36 mois.
- Les conditions réelles des partenariats éditeurs de Batiprix et de
  BatiChiffrage, et le contenu des « licences spécifiques » : non publiés.
- Les conditions d'un référencement comme « logiciel compatible » chez
  BatiChiffrage et chez Hager : non lues.
- L'acceptation par un éditeur d'un usage par un agent IA, d'un cache ou
  d'une redistribution : rien de publié ; aucune des conditions lues ne
  parle d'IA, sauf Tarifeo (pour ses propres systèmes).
- Artiprix : l'existence d'une offre éditeur. Tarifeo : ses tarifs (149, 192
  et 672 € HT/an viennent d'un article d'Obat) et la documentation de son
  API.
- Les volumes annoncés varient d'une page à l'autre (Batiprix : 26 000,
  28 000 ou « près de 30 000 » ouvrages).
- « Kalitéo », « Archiprix », « Infobat », « Prix Bâtiment » et les séries
  « SCPI » ou « SPB » : introuvables comme bases de prix françaises.

**Données publiques**

- La licence du jeu des audits énergétiques de l'ADEME (champ vide) et
  l'origine de ses coûts.
- Les plafonds MaPrimeRénov' en vigueur (Légifrance répond 403 au conteneur ;
  dernière modification relevée par une source secondaire : 25/08/2026).
- Le contenu des jeux « Fonds Vert » et des dotations de la DGCL (coût et
  surface par projet ?), et l'existence d'une enquête TREMI postérieure à
  2020.
- Les salaires minima conventionnels du bâtiment par région dans KALI (ils
  sont fixés par accords régionaux) : la composante main-d'œuvre d'un prix,
  non éprouvée.
- L'arrêt du Conseil d'État du 30/03/2016 (n° 375529) a été lu par son
  analyse ArianeWeb et un résumé, pas en texte intégral.
- La licence du RNCP, et les conditions de l'API francetravail.io (ROME).
- L'effet des offres « isolation à 1 € » de 2019-2021 sur les prix des
  combles : connaissance générale, non revérifiée.

**Matériaux**

- Les conditions de pointp.fr, cedeo.fr, leroymerlin.fr et castorama.fr
  (bloqués depuis le conteneur), et l'existence d'un programme éditeur chez
  Saint-Gobain Distribution Bâtiment France.
- Les programmes d'affiliation de Leroy Merlin, Castorama et Brico Dépôt ;
  les conditions propres au programme ManoMano.
- Les conditions d'HerculePro et d'ELCIA (sites injoignables).

**Logiciels et bases étrangères**

- La source des prix « du marché » d'Obat, de Cegid Boby, de Costructor et de
  Houzz (plateforme américaine de travaux, qui vend aussi un logiciel de
  devis aux professionnels) : aucune n'est nommée par ces éditeurs.
- L'origine des prix de Handoff : seules ses propres pages ont été relues, et
  aucune ne nomme de négociant ; « Home Depot, Lowe's » vient d'une source
  tierce non relue (le quota de recherches du contradicteur était épuisé).
- Les conditions de l'API de RSMeans (pages en 404), de Spon's (aucune
  trouvée), de Buildertrend (site bloqué).
- Les prezzari régionaux italiens (Toscane, Lombardie) sont annoncés « in
  formato open data », mais leur licence exacte n'a pas été lue
  (<https://www.regione.toscana.it/-/prezzario-dei-lavori-2026-della-toscana>).

**Connaissances**

- Les conditions de l'abonnement CObaz, de la licence réseau d'AFNOR, et des
  règles professionnelles des syndicats.
- Le statut des Avis Techniques au regard du CRPA (l'arrêté du 21/03/2012 n'a
  pas pu être lu).
- Les conditions d'EUR-Lex, du Géoportail de l'urbanisme, de la justice
  administrative, du webservice INIES et de l'offre payante bdnb.io.
- Le rythme réel de mise à jour de la copie vectorisée de LEGI
  (« legi-latest » est réécrit morceau par morceau).
- La limite exacte de stockage du plan gratuit de Supabase (500 Mo d'après
  le contradicteur, de mémoire).
- La CGU de l'API Légifrance lue est la v1.1 du 04/08/2020 ; une version plus
  récente peut exister dans l'espace PISTE après connexion.

**Droit — pour un avocat**

- La portée d'une courte citation de DTU dans une réponse générée, face à
  l'opposition écrite d'AFNOR et du CSTB.
- Les seuils d'anonymat et d'ancienneté acceptables en France pour une base
  de prix entre concurrents : aucun seuil officiel n'existe.
- L'article 13 du Data Act appliqué aux conditions d'Opus, et l'article 9 du
  règlement P2B (UE 2019/1150) sur l'accès aux données des professionnels.
- Le montant exact des peines de CPI L343-4, relevé chez un cabinet
  d'avocats et non sur Légifrance.
- Le texte de CPI L342-3 (la fouille de données face au droit du producteur
  de base), et la disposition réglementaire qui admettrait une opposition à
  la fouille exprimée dans des conditions d'utilisation : non relus.
- L'article 323-1 du Code pénal et l'arrêt « Bluetouff » (Cour de
  cassation, chambre criminelle, 20/05/2015), cités de mémoire.
- La doctrine de l'anonymisation est en cours de remplacement : le Comité
  européen de la protection des données a adopté le 08/07/2026 des lignes
  directrices 02/2026, en consultation jusqu'au 30/10/2026
  (<https://www.edpb.europa.eu/news/edpb-sheds-light-on-anonymisation-and-web-scraping-for-generative-ai-and-adopts-final-version_fr>).
- La compatibilité d'une contrepartie réservée aux contributeurs avec un
  consentement « libre ».
