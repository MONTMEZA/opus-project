> **Cahier de l'étape 2b-5 du module devis — les déchets du chantier.**
>
> **Archivé le 22/11/2026, à la fin de l'étape 2b-5.** Ce cahier (v2, 21/11 :
> le v1 revu après ses quatre critiques adverses, avec en tête les réponses
> du propriétaire à P1 à P6) a guidé l'étape ; il est versé ici TEL QU'IL A
> SERVI, sans une retouche, sous le trait qui suit cet en-tête. **En cas de
> désaccord, la section « Les déchets du chantier, les lieux de dépôt,
> « Aucun dépôt » — étape 2b-5 » de CLAUDE.md et le code disent vrai.** Ce
> qui a changé depuis sa rédaction :
>
> - **La règle de la rubrique des lieux (§2.4, T26), changée par la décision
>   DROIT-R2 du propriétaire (21/11, « Le signaler »), avant la migration
>   (commit `66b2e9b`)** : « Aucun dépôt » ne remplit la rubrique « lieu » que
>   si le tri est vide de valeur ou vaut exactement `{aucune}`. Un tri qui
>   nomme une sorte dit que des déchets partiront : leur lieu manque, sauf si
>   un lieu choisi existe chez l'entreprise. Une écriture de chaque côté :
>   la condition de 49.9, et `triNommeUneSorte` dans `devis.js`, lue par le
>   miroir, par `aucunDepotContredit` et par `annonceDuTri`.
>   `cas-remise.json` est régénéré par la vraie fonction : 184 cas, les
>   cas 163 et 164 changent d'attendu, les cas 172 à 184 sont nouveaux (dont
>   183 et 184, ajoutés après l'épreuve de la règle, qui mettent en défaut une
>   condition écrite sans `is true`). L'essai 49-remise gagne trois valeurs.
> - **Une phrase que l'annexe A.2 n'a pas**, sous la pastille « Aucun dépôt »,
>   tant que la contradiction dure (`LES_DECHETS.lieux.partentAPart`) :
>   « Des déchets partiront à part : choisissez où vous les déposerez. Si en
>   fait rien ne quitte le chantier, choisissez « Aucune collecte séparée ». »
>   Sa première version, corrigée après la relecture de la règle (R2-1),
>   proposait « Aucune collecte séparée » « si rien ne partira à part », ce
>   qui poussait vers un devis sans point de collecte quand les déchets
>   partent mélangés. Elle est de la construction, pas du propriétaire.
> - **La nature du rang 13 (A.1) ne bouge pas** : décision DROIT-R5,
>   « Garder « La loi » » (21/11) ; le cas du dépannage part au juriste
>   (J51).
> - **Des textes de l'annexe A, corrigés après la relecture adverse unique du
>   21/11 (commit `c0a36ae`)** :
>   - « Sur le chantier » (A.2) : « Ce qui y restera, s’il y en a. Pour des
>     travaux de jardinage, si vous broyez, compostez ou paillez sur place, la
>     loi demande de le dire. », au lieu de « … Facultatif. » (DROIT-R1) ;
>   - sous « Aucun dépôt » (A.2) : « Seulement si tous les déchets restent
>     sur place, broyés ou compostés : choisissez alors aussi « Aucune
>     collecte séparée » et, dans « Sur le chantier », ce que vous en
>     faites. » (DROIT-R2, son texte) ;
>   - l'aide du tri (A.2) : « … la loi demande quand même un tri à la source
>     et, pour les déchets qui ne sont pas traités sur place, une collecte
>     séparée ; et le devis doit dire ce que vous faites. » (DROIT-R3) ;
>   - l'aide du coût (A.2) : « … Si ce coût est déjà compris dans vos prix,
>     n’ajoutez pas de ligne : écrivez quand même son estimation ici. S’il ne
>     l’est pas et que vous le faites payer, ajoutez une ligne au devis. »
>     (DROIT-R8) ;
>   - l'aide de la question (A.2) dit « sur un devis », et non plus « sur
>     tout devis » (DROIT-R10) ;
>   - le formulaire d'un lieu (A.7) s'ouvre sur une introduction que le
>     cahier n'écrit pas : « Sur un devis de construction, de rénovation ou
>     de démolition d’un bâtiment, ou de jardinage, la loi demande où iront
>     les déchets : la raison sociale, l’adresse et le type d’installation de
>     chaque lieu où vous les déposerez. Rangé ici une fois, ce lieu se
>     choisit ensuite dans chaque devis. » (DROIT-R4 : sa première version
>     disait « travaux sur un bâtiment ») ;
>   - « Mon entreprise », liste vide (A.7) : « … Rangés ici une fois, ils se
>     choisissent ensuite dans chaque devis. » (DROIT-R9 : le participe se
>     rapportait à « vous ») ;
>   - une rangée de lieu dit « type, commune », avec une virgule, dans les
>     deux écrans (ÉCRAN-5 : « Mon entreprise » écrivait « · ») ;
>   - le libellé PARLÉ du coût : « Coût estimé HT des déchets » au régime
>     réel, « Coût estimé des déchets, en euros » sinon (ÉCRAN-6,
>     `libelleParleDuCout`) ;
>   - une phrase nouvelle pour le onzième lieu, montrée sous les cases et
>     annoncée : « Dix lieux au plus par devis : décochez-en un pour en
>     choisir un autre. » (BASE-R1 = ÉCRAN-1) ; la phrase de
>     `devis_dechets_lieux_check` (A.8) reste, pour le tableau vide et
>     l'élément vide ;
>   - « Ce que nous collectons » (§4) dit « s’il s’agit ou non de travaux sur
>     un bâtiment ou de jardinage » (DROIT-R7), nommant aussi la question, ce
>     que le §4 ne demandait pas ; `VERSION = '2026-11-21'`.
> - **T12 bis n'est tenu que depuis la relecture** : le premier jet prenait
>   une lecture en cours pour un échec, et disait « n’ont pas pu être lus »
>   (ÉCRAN-3) ; « Mon entreprise » passe désormais aussi les lieux qu'elle
>   vient de lire. Et le onzième lieu se refuse à l'écran, compté sur la liste
>   REBÂTIE, sans ses orphelins (le cahier ne bornait le nombre de lieux que
>   dans la base, T11).
> - **Des écarts dits par la construction, où le code fait foi** :
>   `resumeDesDechets` prend un objet, sans le régime ; `lieuxApresAppui`
>   prend et rend `{ lieux, sansDepot }` (et `plafond` au onzième lieu) ;
>   des fonctions que le cahier ne nomme pas (`motifDesDechets`,
>   `rubriqueDuPoint`, `annonceDuTri`, `annonceDesLieux`,
>   `vibrerPourLesDechets`, `textesInitiauxDesDechets`,
>   `libelleParleDuCout`, `triNommeUneSorte`, `aucunDepotContredit`,
>   `libelleDuTypeDeLieu`) ; `monEmetteurSupabase` lit les lieux en
>   QUATRIÈME (la preuve de TVA reste dernière), non en cinquième ; le bloc en
>   lecture vit dans `FicheEmetteur.js` (`LieuxDeDepotEnLecture`), et son
>   bouton, comme « Ajouter un lieu de dépôt » et la porte « Mes lieux de
>   dépôt », ouvre « Mon entreprise » en édition SUR la section, pas le
>   formulaire ; les noms de la garde de sortie (`NOMS_ENTETE`) ne sont pas
>   dans le cahier ; l'essai 49-remise range les déchets au cas 26 et son
>   compte au cas 27 (non « un cas 27 « déchets » ») : 38 erreurs, 365 valeurs
>   justes, son compte `t` sur 364 ; dans `schema.sql`, MAINTAIN est retiré
>   par le balayage de 42 bis ; `verifier-devis` compte 655 vérifications,
>   `verifier-emetteur` 310, `verifier-legal` 268 ; `mesure-devis` 1 050
>   mesures au passage complet, et sa copie de « Pas encore vérifié »
>   (`PAS_ENCORE_2B5`), que §5.5 ne listait pas ; les essais se jouent depuis
>   la RACINE du dépôt.
> - **Sa migration (§6)**, ce que sa construction a ajouté : les douze
>   `drop … if exists` du schéma partent sous forme de contraintes et d'une
>   politique posées SOUS CONDITION ; la clé étrangère de la table nouvelle
>   prend SHARE ROW EXCLUSIVE sur `professional_profiles` (une écriture de
>   fiche en cours la bloque) ; recréer `mes_donnees()` prend ACCESS SHARE sur
>   les tables qu'elle nomme. Elle est appliquée depuis le 22/11/2026 à
>   12 h 40 (heure de Paris), en un appel, et **l'appel MAINTAIN n'a pas été
>   nécessaire** (`maintain_a_retirer = f`).
> - **« Pour le propriétaire aujourd'hui »** (§0) : 2b-4 a été déclarée
>   essayée sur l'iPhone (« Oui, ça marche », 21/11), mais la base ne porte
>   aucune réponse « gratuit ou payant ».
> - **Les fichiers qu'il cite** (`lot2b5/critique/…`, le dossier de travail
>   qu'il nomme) et les noms des constats de ses critiques (`DROIT-…`,
>   `BASE-…`, `ECR-…`, `CTL-…`) étaient des documents de travail de la
>   session : ils ne sont pas dans le dépôt. Ses numéros de ligne datent de
>   `1cbf3a8`.
> - **Vérifié avant la copie** : il ne contient aucune donnée personnelle du
>   propriétaire (ni nom, ni SIREN, ni numéro de TVA, ni adresse e-mail), et
>   aucune barre oblique inverse ni caractère invisible ; rien n'a donc été
>   remplacé.

---

# Étape 2b-5 du module devis — les déchets du chantier — cahier v2 (21/11/2026)

Écrit le 21/11/2026 sur `HEAD 1cbf3a8` (`supabase/schema.sql` md5
`546350b2…`), après le cahier v1 et ses quatre critiques adverses (droit,
base, écran, contrôles), chacune contre-examinée par un contradicteur
(`lot2b5/critique/`, huit rapports lus en entier). **67 constats, aucun
bloquant, deux réfutés** ; ce qu'ils changent est dit à l'annexe C, constat
par constat. Les questions qui restent (§1.3) sont posées au propriétaire
AVANT toute construction.

Étiquettes : **ÉTABLI** (lu ou mesuré), **DÉDUIT**, **À VÉRIFIER**, **(J)**
au juriste, **(P)** au propriétaire.

## Les réponses du propriétaire (21/11/2026) — elles font foi

Posées après la critique, par deux séries de questions ; **les six
recommandations sont retenues**, et 2b-4 marche sur son iPhone.

| question | réponse | ce qu'elle construit |
|---|---|---|
| P1 — la question | « Bâtiment ou jardinage (Recommandé) » | « S’agit-il de travaux sur un bâtiment, ou de jardinage ? » — « Non, ni l’un ni l’autre » · « Oui (par défaut) » |
| P2 — le coût | « Toujours un montant, HT (Recommandé) » | jamais 0 (de 1 à 999 999 999 centimes), hors du total, libellé par `libelleDuCout(regime)` |
| P3 — l'amende | « Oui, cette phrase (Recommandé) » | `AMENDE_DES_DECHETS`, la troisième constante à « € » de `devis.js` |
| P4 — la liste | « Liste élargie, 14 sortes (Recommandé) » | A.4 entière ; `devis_dechets_flux_check` de 1 à 14 éléments |
| P5 — l'effort de tri | « La liste suffit (Recommandé) » | aucune colonne de plus ; J58 au juriste |
| P6 — sans dépôt | « Une pastille « Aucun dépôt » (Recommandé) » | la colonne `dechets_sans_depot` (vraie ou vide), sa contrainte, la paire `['dechetsLieux', 'dechetsSansDepot']` ; la rubrique « lieu » est présente quand elle est vraie |
| 2b-4 sur l'iPhone | « Oui, ça marche » | — |

Donc, partout dans ce cahier : **HUIT colonnes** sur `devis`, **SEPT
contraintes** nouvelles (`CONTRAINTES_ATTENDUES` 35 → 42, §16 19 → 26),
les variantes « P2 = 2 ou 3 », « P3 = 2 », « P4 = 2 », « P5 = 2 », « P6 = 2 »
ne se construisent PAS. Les essais : 49 cas 1, 36 → 44 colonnes ;
49-conditions, 43 → 51 colonnes dans les droits.

---

## 0. En une page

**La décision de départ** : Q4 = 1 (17/11/2026, « Lieux rangés + carte
(Recommandé) ») — les lieux de dépôt rangés une fois dans « Mon entreprise »,
une carte « Déchets » par devis, une question « Oui » tant que rien n'est
dit, un point au rang 13. Elle n'est écrite nulle part dans le dépôt : ce
cahier la consigne, CLAUDE.md, A-FAIRE et PLAN la recopieront.

**Ce que la loi demande** (C. env. L. 541-21-2-3 I, D. 541-45-1 I, ÉTABLI,
inchangés au 20/11 à 22 h 28) : sur tout devis de travaux de construction,
de rénovation ou de démolition de bâtiments, et sur tout devis de travaux
de jardinage, quel que soit le client :

1. une estimation de la quantité totale de déchets que l'entreprise
   produira ;
2. l'effort de tri réalisé sur le chantier et la nature des déchets pour
   lesquels une collecte séparée est prévue ; en jardinage, le cas échéant,
   « le broyage des déchets sur le chantier ou autres dispositions
   techniques » ;
3. le ou les points de collecte où l'entreprise prévoit de déposer les
   déchets : raison sociale, adresse, type d'installation ;
4. une estimation des coûts de gestion et d'enlèvement.

Amende administrative jusqu'à 3 000 € (personne physique), 15 000 €
(personne morale).

**Ce que la critique a changé, en gros** :

- **le droit** : « jardin » devient « jardinage » partout (un élagage, des
  espaces verts) ; la liste des déchets triés s'élargit aux familles que les
  textes nomment (menuiseries, membranes bitumineuses, laines minérales,
  terres) ; le broyage et le compostage sur place deviennent un fait À PART,
  qui ne prétend jamais « collecte séparée » ; trois aides retrouvent la
  moitié de la loi qu'elles avaient perdue (le tri à la source reste dû ;
  ne pas compter deux fois un coût compris dans les prix ; s'assurer que le
  repreneur est autorisé) ;
- **les données** : jamais de tableau vide en base — « rien de dit » s'écrit
  vide de valeur, « aucune collecte séparée » devient une valeur à elle ;
  un lieu choisi ne s'efface QUE sous le doigt de l'artisan, sur une liste
  LUE ; une liste non lue n'est jamais « aucun lieu » ;
- **l'écran** : pas de composant nouveau pour les cases (`Interrupteur`, tel
  quel) ; un seul bouton sur le point, une porte permanente « Mes lieux de
  dépôt » dans la carte ; la démonstration remplit aussi « Terrasse en bois »
  pour garder ses parcours ;
- **les contrôles** : une douzaine de listes que le nom `emetteur_lieux_depot`
  aurait traversées sans être vu (le trait de soulignement est une lettre de
  mot), désormais nommées ; trois corrections de la critique qui ne
  prouvaient rien sous la RLS, remplacées.

**Ce que 2b-5 construit** :

| où | quoi |
|---|---|
| « Mon entreprise » | une section « Vos lieux de dépôt des déchets » : une liste, un formulaire (raison sociale, adresse, type d'installation), sur le modèle des assurances ; un bloc en lecture |
| la base | une table privée `emetteur_lieux_depot` (section 46) ; sept colonnes nouvelles sur `devis` (huit si P6 = 1), sans défaut ; leurs contraintes ; un rang 13 dans `motifs_refus_remise` |
| la saisie | une rangée « Déchets » entre « Le chantier » et « Conditions », qui ouvre une carte plein écran : la question, puis quantité, tri, sur le chantier, lieux, coût |
| « Pour le remettre » | un point au rang 13, UNE clé au plus, un bouton qui ouvre la carte |

**Ce que 2b-5 ne construit pas** : rien n'est imprimé, numéroté ni remis
(2c) ; aucun texte libre ; ni l'exception PEMD, ni une question
« dépannage », ni la façon dont le coût est facturé, ni la proposition du
coût depuis une ligne « Évacuation » ; aucune consolidation de la classe de
blancs dans les lots finis.

**Pour le propriétaire aujourd'hui** (relevé de FORME, 21/11, ÉTABLI) : 3
devis, 11 lignes, rien de modifié depuis le 16/11, aucun « gratuit ou
payant » répondu (2b-4 n'a probablement pas été essayée sur l'iPhone : on le
lui demande). Ses trois brouillons gagneront le point des déchets.

---

## 1. Les décisions, et ce qui reste à demander

### 1.1 Déjà décidé (ÉTABLI)

- **Q4 = 1 (17/11)** : lieux rangés, carte par devis, question « Oui » par
  défaut, rang 13 ; le coût « ne s'ajoute pas au total »
  (docs/CAHIER-LOT-2B-4.md:518-528).
- **Accélérer (08/11)** : une relecture adverse ; seul un défaut qui perd des
  données, affiche quelque chose de faux ou touche à la sécurité relance un
  tour.
- **Sept règles d'Opus** ; 2b-5 n'en crée aucune.
- **« Opus propose, l'artisan confirme »** : rien n'est coché, choisi ni
  rempli sans un appui — ni l'unité, ni un déchet, ni un lieu (même s'il n'y
  en a qu'un), ni la réponse à la question.
- **Jamais le métier pour décider** : un métier peut ORDONNER, jamais choisir.
- **Un fait de 2b naît vide** ; aucune contrainte ne lie deux faits ; le vide
  vaut le cas le plus protecteur.
- **Un 0 n'est jamais tapé** ; seule une pastille écrit un « rien »
  explicite.
- **Rang 13 pour 2b-5, rang 14 pour 2b-6 ; `OP028` libre**.

### 1.2 Ce que ce cahier tranche lui-même (choix techniques)

Les numéros du v1 sont gardés ; « (rev) » dit qu'une critique l'a changé.

| n° | décision | raison |
|---|---|---|
| T1 (rev) | **la classe de blancs n'est pas consolidée.** Le déclencheur des lieux rogne QUATRE colonnes, donc QUATRE copies (douze en tout), écrites EN LIGNE en `chr(n)` comme `tient_le_poste` — jamais une classe rangée dans une variable ; quatre entrées `tient_le_lieu_de_depot.<colonne>` dans la liste `copies` de `verifier-devis` §17, dont le libellé « les HUIT copies » devient « les DOUZE » ; une vérification de propriété : aucun `btrim(…, x)` du fichier dont la classe n'est pas un littéral évalué | consolider réécrit cinq fonctions de quatre lots finis : une refonte, que le propriétaire valide d'abord. §17 compte par fonction (BASE-4, CTL-1 : une entrée unique rougit) ; une classe en variable échappe au compte (mesuré : 602 ✔) |
| T2 | **les lieux choisis : un tableau `uuid[]` dans `devis`**, sans clé étrangère. Le contrat, écrit dans le commentaire de 49.4 sexies et dans A-FAIRE pour 2c : *un identifiant de `dechets_lieux` ne prouve aucune appartenance ; tout lecteur filtre par `pro_id` ; la remise copiera les lieux DISTINCTS, dans l'ordre, et figera le tableau* | aucune cascade ne réécrit un devis remis (D11) ; tout traverse la file, l'horloge, l'export sans rien ajouter (BASE-8 : mesuré, aucun oracle) |
| T3 (rev) | **les déchets triés : `dechets_flux text[]`, liste fermée, JAMAIS de tableau vide en base.** Vide de valeur = rien de dit. « Aucune collecte séparée » est une valeur à elle, `aucune`, exclusive des autres. La contrainte traite d'abord les formes impossibles (deux dimensions, borne basse autre que 1, tableau vide) dans un `case`, puis la liste | un tableau vide naît naturellement d'une case décochée : il écrivait une affirmation que l'artisan n'avait pas faite (BASE-1, ECR-2, CTL-4). La garde des dimensions rend 23514 sous son nom au lieu d'une erreur anglaise (BASE-6, CTL-17 : `array_ndims('{}')` est vide de valeur, d'où le `case`) |
| T3 bis (nouveau) | **ce qui reste sur le chantier : `dechets_sur_place text[]`**, `broyage` (« Broyage sur le chantier ») et `compostage` (« Compostage ou paillage sur place »), montrés TOUJOURS, sous un sous-titre « Sur le chantier », jamais exigés ; vide de valeur = rien de dit ; jamais de tableau vide ; ne complète JAMAIS la rubrique « tri » | le décret en fait un tiret à part ; la loi pose valorisation sur place et collecte séparée comme des alternatives : le jardinier qui broie tout ne doit pas avoir à déclarer une collecte qui n'existe pas (DROIT-3). Une seconde colonne évite une contrainte qui lierait deux sens dans un même tableau |
| T4 (rev) | **un tableau se compare par sa valeur**, par UNE fonction, `memeValeur`, dans un fichier nouveau `src/lib/meme-valeur.js` qui n'importe rien ; importée par `file-ecriture.js` (`changements`), par la saisie (`enregistrerEntete`) et par `devis.js` (`etatDesChampsDuDevis`). Les listes d'importation de `verifier-devis` changent EN LE DÉCIDANT (`devis.js` : cinq modules ; `file-ecriture.js` : un, qui n'importe rien). Les deux autres `Object.is` de la file (`tenueGardee`, `meme`) ne voient que la réduction : inchangés | mesuré (CTL-3) : avec T4 posé à deux endroits seulement, la rangée dirait « — enregistrement… » à tort. Une seule écriture de la règle, pas de jumelle |
| T5 | **`tient_le_devis` n'est pas touchée** : aucun texte libre sur le devis | sa forme ENTIÈRE est figée et son corps porte des séquences que le transport change |
| T6 (rev) | **la table vit en section 46**, nommée `emetteur_lieux_depot`, sur le modèle d'`emetteur_assurances`. Elle entre, EN LE DÉCIDANT, dans TOUTES les listes « mot entier » qu'elle traverserait sans être vue (§2.7) : `LISTES` ET `PRIVEES` (`verifier-emetteur`, `verifier-legal`), `PRIVEES_EDGE`, l'essai 46 cas 26 bis, l'essai 47 cas 14 | le trait de soulignement est une lettre de mot, pour JavaScript comme pour PostgreSQL : `emetteur_lieux_depot` ne contient pas le mot `emetteur` (CTL-7, CTL-8, rejoué) ; précédent : `base_postes` au lot P |
| T7 | **la question vit EN TÊTE de la carte « Déchets »** | « Le chantier » ne bouge pas |
| T8 (rev) | **rang 13, une clé au plus, deux clés possibles.** `devis_dechets` (réponse vide) ouvre la carte EN HAUT, sur la question ; `devis_dechets_rubriques` (réponse « Oui ») l'ouvre sur la première rubrique qui manque, en haut à défaut. **Un seul bouton** sur le point (« Compléter les déchets ») : `secondeActionDuPoint` ne change pas ; la porte vers les lieux vit dans la carte (T25) | la sortie naturelle d'une réponse vide est de répondre (le précédent de la décennale sans réponse) ; un second bouton statique s'afficherait aussi quand seule la quantité manque (ECR-8, CTL-11) |
| T9 (rev) | **`motifs_refus_remise` lit la table des lieux**, une lecture, colonnes nommées, filtrée par `pro_id = v_pro` ; l'essai l'éprouve par une ENVELOPPE `security definer` (le modèle du cas 22 : la RLS ne filtre plus), et la porte étroite compare la troisième lecture à la lettre | sous la RLS, retirer le filtre est une mutation équivalente (CTL-6) ; 2c appellera la liste depuis la remise |
| T10 (rev) | **`dechets_lieux` ne se réécrit QUE sous le doigt** : dans le gestionnaire d'un appui sur une case de lieu (ou sur la pastille « Aucun dépôt », P6), à partir d'une liste LUE, dans son ordre, par une fonction pure de `devis.js` (`lieuxApresAppui`). L'état de la carte garde les identifiants TELS QUE LUS, orphelins compris ; ce qu'elle MONTRE est l'intersection, calculée au rendu avec la liste vivante. Le dernier lieu décoché écrit vide de valeur. Un lieu retiré de « Mon entreprise » : son identifiant reste, ignoré, et le point revient | un filtre posé à l'état initial partait à CHAQUE appui (un déchet, l'unité, « Non ») et, sur une liste non lue, effaçait les lieux choisis (BASE-5, ECR-1 : perte de données) ; un tableau vide était refusé par la base (CTL-4) |
| T11 | **aucun plafond compté sous verrou** : au plus 10 lieux par devis ; `OP028` reste libre | — |
| T12 (rev) | **les lieux arrivent par `monRegimeEtSaDate`**, élargie à `{ regime, declareLe, assurances, lieux }` ; la table absente (`tableAbsente`) rend `null` (non lu), jamais `[]` ; `verifier-postes` injecte `lieuxDe`, attend la forme nouvelle, une lecture, jamais deux. Une erreur des seuls lieux fait tomber la lecture entière, comme celle des assurances (le chemin choisi en 2b-4) : décision notée dans A-FAIRE | le même chemin que les assurances ; `null` est la réponse sûre face à un cache de PostgREST pas encore rechargé (CTL-18, ECR-3 a) |
| T12 bis (nouveau) | **la liste des lieux a trois états à l'écran**, écrits dans `devis.js` et faits tourner : non lue pendant la lecture (rien n'est dit, aucune case) ; non lue après un échec (« Vos lieux de dépôt n'ont pas pu être lus » et « Réessayer », qui appelle `onRelireRegime`) ; vide (la phrase et « Ajouter un lieu de dépôt ») ; lue (les cases). L'état se déduit de celui du régime, lu par la même lecture. Tant que la liste n'est pas lue, la rangée dit « Lieux de dépôt non lus » — jamais « remplies », jamais « à compléter (lieu) » | une liste vide ne dit rien que si elle a été LUE (la règle de 2b-1) ; montrer « aucun lieu » à qui en a invite au doublon (ECR-3 ; la contradiction a refusé de compter « présent » une liste non lue) |
| T13 (rev) | **« Mon entreprise » en lecture montre les lieux** ; vide, il dit que les devis le demanderont (le modèle de `FicheAssurance`) ; l'en-tête imprimé ne les imprime pas | ECR-13 d |
| T14 (rev) | **aucun composant `CaseACocher`** : les déchets, ce qui reste sur le chantier et les lieux sont des `Interrupteur`, TELS QUELS (rôle `switch`, natif, lu par iOS dans sa langue). La question de l'iPhone se pose sur le témoin existant (la case de la déclaration de TVA, rôle `checkbox`) | `Interrupteur` dessine déjà une case cochée sur 44 points, et son commentaire pose la règle « à un seul endroit » ; le rôle `checkbox` risque de faire dire « checked » en anglais par VoiceOver (ECR-6, rejoué) |
| T15 (rev) | **la démonstration** : « Muret de clôture » ET « Terrasse en bois » répondent et remplissent tout (un lieu INVENTÉ, cherché absent de Sirene et de la Base Adresse) ; « Rénovation salle de bains » répond « Oui » avec une rubrique manquante (on y voit `devis_dechets_rubriques`) ; « Sol du séjour » reste sans réponse (on y voit `devis_dechets`). Elle ne répond jamais « Non » à la place d'un devis | la section 2b-1 de `mesure-devis` mène « Terrasse » jusqu'à « rien ne manque » (le précédent de 2b-4 l'a rendue payante pour cela) ; chaque clé doit se voir sans `.env` (ECR-5) |
| T16 (rev) | **le coût : un montant positif, en centimes, hors des totaux** (selon P2) ; son libellé suit `libellesDesTotaux` (« HT » au seul régime réel, « en euros » sinon), et le champ reste ouvert quel que soit le régime — le précédent de la réduction en euros. Un changement de régime ne convertit rien : noté dans A-FAIRE | ECR-11, DROIT-15, CTL-19 ; le précédent tranche entre les deux formes proposées |
| T17 | **la règle M8 du lot 1 est révisée, et le cahier le dit** : ce qui est FACTURÉ est une ligne ; ce qui est ESTIMÉ pour le client est une colonne hors des totaux (précédent : `cout_devis_centimes`) | — |
| T18 (rev) | **« Pas encore vérifié » REMPLACE « les déchets de chantier » par « si vos lieux de dépôt acceptent ces déchets »** : toujours sept faits, dans ses trois copies ; le contrôle « Toujours SEPT faits » ne bouge pas | la raison du v1 était fausse (« si une ligne marquée « réparation urgente » l'est vraiment » ne se vérifiera jamais non plus) ; et un vrai « pas encore » disparaissait (DROIT-12) |
| T19 | *(remplacé par T3 bis)* | — |
| T20 (nouveau) | **Q4 = 1 range des FAITS fermés**, chacun dans les mots des textes, comme « Déplacement offert » et la liste des médiateurs ; Opus ne compose aucune phrase qui tire une conclusion de droit (« le reste part en mélange », « compris dans vos prix ») ; la phrase imprimée s'écrit en 2c et se relit (J56) | DROIT-10 : la doctrine du plan vise des textes composés ; écrire la distinction suffit |
| T21 (nouveau) | **le libellé d'un déchet (qui s'imprimera) est séparé de ses exemples (qui aident à l'écran)** : « Déchets dangereux », et dessous « Chacun à part, sans les mélanger entre eux : amiante, solvants, peintures qui en contiennent… ». Un contrôle refuse « amiante » dans un libellé | un libellé imprimé « (amiante, …) » se lirait « il y a de l'amiante » (DROIT-6) |
| T22 (nouveau) | **le code postal d'un lieu suit la règle de la section 46** (celle de l'adresse de l'entreprise : rogné aux bouts, cinq chiffres), par la MÊME fonction JavaScript que le code postal de « Mon entreprise » : aucune copie nouvelle | le lieu appartient à « Mon entreprise » ; une troisième forme de nettoyage n'était comparée à rien (BASE-7, CTL-2). Un lieu belge ou suisse est refusé : noté (BASE-15) |
| T23 (nouveau) | **`enregistrerDechets` sur le modèle exact d'`enregistrerConditions`** : les refus de ses champs remis à zéro à chaque lecture, les textes gardés tant qu'une valeur est refusée, une table `CLES_DU_GESTE` de la carte (ne vibrer que pour le geste qui vise la faute) ; une quantité sans unité dit « Choisissez m³ ou tonnes. » à la place réservée ; toucher l'autre unité garde le nombre (comme l'unité d'une ligne) | ECR-10 |
| T24 (nouveau) | **la rangée** : titre « Déchets », que le résumé ne répète pas ; dix-huit résumés (« Non concernés », « Les quatre rubriques sont remplies », quinze « À compléter : … », « Lieux de dépôt non lus ») × trois états (rien, « — enregistrement… », « — pas enregistré ») = 54 gabarits en couches ; un « 0 » refusé par l'écran prend « — pas enregistré » DANS les gabarits : la hauteur ne bouge jamais | ECR-9 (dont le (d) corrigé par la contradiction : la carte a des champs tapés) |
| T25 (nouveau) | **une porte permanente « Mes lieux de dépôt » sous la liste de la carte**, qui enregistre la carte avant d'ouvrir « Mon entreprise » sur la section (en édition : le chemin des assurances) | un artisan qui a des lieux, dont aucun ne convient, n'avait aucune porte (ECR-13 a) |
| T26 (nouveau) | **une seule fonction `rubriquesDesDechets(devis, lieux)`** sert le miroir, le résumé de la rangée et la rubrique visée ; une vérification exige qu'aucune autre écriture de la règle n'existe | CTL-20 ; le modèle de `signaturePermise` |
| T27 (nouveau) | **rien de coché d'office, tenu par trois gardes** : `etatInitialDechets` FAIT TOURNER sur un devis vierge (tout vide, unité comprise) et sur un artisan qui n'a qu'un lieu (aucun lieu choisi) ; dans `DechetsDevis.js`, `poser(` n'est appelé que depuis les gestionnaires d'appui nommés, jamais dans un `useEffect` ; `choixDur` étendu à `FicheLieuDepot`, son expression tirée de `TYPES_INSTALLATION` | lu9 ne voit pas un `poser(…)` appelé hors d'un appui (CTL-10) |
| T28 (nouveau) | **une pastille exclusive qui retire ce qui était coché s'annonce** : toucher « Aucune collecte séparée » retire les déchets cochés (et « Aucun dépôt » les lieux, si P6 = 1), dans le même geste, avec une phrase de `LES_DECHETS` annoncée à VoiceOver ; toucher un déchet (ou un lieu) retire la pastille, sans annonce (c'est l'objet même de l'appui). Un orphelin retiré ne s'annonce pas : il n'a jamais été montré | « un champ qui change sans geste doit s'annoncer » (2b-4) ; ECR-14, revu par la contradiction |

### 1.3 Les questions au propriétaire — six, plus une

**P1 — La question en tête de la carte.** La loi vise des travaux sur un
bâtiment (construire, rénover, démolir) ou du JARDINAGE — une activité, pas
un lieu : l'entretien des espaces verts d'une copropriété, un élagage le long
d'une route, c'est du jardinage hors d'un jardin.

1. **« S’agit-il de travaux sur un bâtiment, ou de jardinage ? »** — « Non,
   ni l’un ni l’autre » · « Oui (par défaut) » (recommandé) ;
2. « Ces travaux produisent-ils des déchets ? » — fait dire faux dans les
   deux sens (« Non » sur une fenêtre changée, qui en produit peu ; « Oui »
   sur une route loin de toute maison).

**P2 — Le coût estimé.**

1. **un montant, toujours chiffré, jamais 0, hors du total ; « HT » au
   régime réel, comme vos lignes** (recommandé) ;
2. la même chose, avec une pastille « Aucun coût » qui écrit 0 ;
3. un montant TTC, comme le prix du devis lui-même.

À dire avec : en 2c, Opus demandera sans doute si ce coût est compris dans
vos prix, facturé par une ligne, ou non facturé — la loi sur l'affichage des
prix peut l'exiger (J29).

**P3 — L'amende dans l'aide de la carte.**

1. **Oui** (recommandé) : « Il suffit qu’une seule de ces informations
   manque pour exposer à une amende administrative pouvant aller jusqu’à
   3 000 €, 15 000 € pour une société. » ;
2. Non : l'aide dit seulement « la loi le demande ».

**P4 — La liste des déchets triés** (annexe A.4). Elle vit dans une
contrainte de la base : l'élargir plus tard demanderait une migration.

1. **la liste élargie, quatorze sortes** : les huit du décret (papier et
   carton, métal, plastique, verre, textiles, bois, fraction minérale,
   plâtre), plus menuiseries et vitrages, membranes bitumineuses, laines
   minérales, terres excavées, déchets verts, déchets dangereux
   (recommandé) — vos métiers (couverture, façade, maçonnerie) produisent
   précisément ces familles ;
2. la liste courte du v1 (les huit, les verts, les dangereux).

Et dans les deux cas : « Sur le chantier : broyage · compostage ou paillage »
à part, et les types de lieux de l'annexe A.5.

**P5 — L'effort de tri.** La loi demande « l'effort de tri réalisé sur le
chantier » ET la nature des déchets collectés à part.

1. **la liste des déchets triés suffit** (cocher les déchets qui partent à
   part, ou « Aucune collecte séparée », EST la description de l'effort) ;
   la question part au juriste (J58) (recommandé) ;
2. une question de plus, en trois réponses (« Tri sur le chantier, par
   sortes » · « Tri en partie ; le reste part en mélange vers une
   installation qui le trie » · « Aucun tri : tout part en mélange vers une
   installation qui le trie »).

**P6 — Quand rien ne quitte le chantier.** Un jardinier qui broie et paille
tout sur place n'a aucun lieu de dépôt à nommer ; la loi vise les points où
l'entreprise « prévoit de déposer ».

1. **une pastille « Aucun dépôt : rien ne quittera le chantier »**, dans le
   bloc des lieux, qui compte comme réponse ; elle retire les lieux cochés,
   et cocher un lieu la retire (recommandé) ;
2. pas maintenant : un tel devis garde son point et ne pourra pas être remis
   en 2c, tant que le juriste n'a pas répondu (J31).

**Et une question qui n'empêche rien** : l'étape 2b-4 (« Le devis lui-même :
gratuit ou payant ? ») a-t-elle été essayée sur l'iPhone ?

### 1.4 À dire au propriétaire, pas à lui demander

- Les trois brouillons gagneront le point « déchets » ; il s'éteint en
  remplissant la carte, ou en répondant « Non ».
- Retirer un lieu de « Mon entreprise » le retire des brouillons qui le
  citaient : leur point revient.
- Rien n'est imprimé avant 2c ; à la remise, les lieux choisis seront
  COPIÉS dans le devis remis.
- Ce que 2b-5 ne fait pas : dire que le client garde une PARTIE des déchets,
  dire comment le coût est facturé. Une ligne « Évacuation des gravats »
  reste possible à côté.
- Un lieu belge ou suisse (code postal à quatre chiffres) est refusé.
- Le jour où il change de régime de TVA, un coût déjà écrit n'est pas
  converti.

### 1.5 Au juriste (n'empêche pas de construire : rien ne sort avant 2c)

J26 à J36 (cahier 2b-4, mis à jour par `droit.md` §6), et :

- **J29** (étendue) : le coût, montant à part, HT ou TTC — face à l'arrêté
  du 03/12/1987, art. 1 et 3, et à l'arrêté du 24/01/2017, art. 4 ;
- **J31** (étendue) : le client qui garde ses déchets, le réemploi sur place,
  et le broyage, le compostage ou le paillage qui ne laisse partir aucun
  déchet — un devis sans point de collecte est-il complet ? ;
- **J32** (étendue) : petit chantier, « aucune collecte séparée », et les
  biodéchets (L. 541-21-1, sans seuil depuis le 31/12/2023) ;
- **J51** la question « bâtiment ou jardinage » et ses exemples, ET les deux
  phrases du point ;
- **J52** déchets dangereux et repérage amiante ;
- **J53** les options du devis comptent-elles ;
- **J54** (étendue) : les listes de types et de déchets, dont les familles
  de R. 543-289 II (menuiseries vitrées, membranes bitumineuses, laines
  minérales) et les terres excavées (exclues de la filière par le IV) ;
- **J55** « 15 000 € pour une société » pour « personne morale » ;
- **J56** une rubrique imprimée à partir de faits FERMÉS engage-t-elle
  l'éditeur ? ;
- **J57** deux montants hors des totaux sur le même devis ;
- **J58** (nouvelle) : la liste des déchets collectés à part, plus « aucune
  collecte séparée », dit-elle « l'effort de tri réalisé sur le chantier » ? ;
- **J59** (nouvelle) : l'absence de la seule QUANTITÉ (que le I de la loi ne
  nomme pas) est-elle sanctionnée par le III, l'habilitation de L. 511-7 24°
  ne visant que « le I » ? ;
- **J60** (nouvelle) : un lieu de dépôt tenu par un entrepreneur individuel
  porte le nom d'une personne : l'artisan en est-il responsable de
  traitement ?

---

## 2. La base

### 2.1 La table des lieux (section 46, après `emetteur_assurances`)

```sql
create table if not exists public.emetteur_lieux_depot (
  id                 uuid primary key default gen_random_uuid(),
  pro_id             uuid not null references public.professional_profiles(id) on delete cascade,
  raison_sociale     text,
  adresse            text,
  code_postal        text,
  ville              text,
  type_installation  text,
  libelle            text,      -- seulement pour le type « autre »
  created_at         timestamptz default clock_timestamp()
);
create index if not exists idx_emetteur_lieux_depot_pro on public.emetteur_lieux_depot (pro_id);
alter table public.emetteur_lieux_depot enable row level security;
```

Contraintes (en `_check`, sous condition dans la migration ; PostgreSQL nomme
la première par ordre alphabétique, et `premierRefus` trie déjà les noms) :

| nom | règle |
|---|---|
| `emetteur_lieu_code_postal_check` | cinq chiffres (la règle de la section 46) |
| `emetteur_lieu_complet_check` | raison sociale, adresse, code postal, commune, type non vides ; `libelle` non vide si et seulement si le type est `autre` |
| `emetteur_lieu_longueurs_check` | raison sociale ≤ 120, adresse ≤ 200, commune ≤ 100, libellé ≤ 80 |
| `emetteur_lieu_type_check` | le type dans la liste fermée (A.5), écrite en toutes lettres |

Le déclencheur `tient_le_lieu_de_depot()` (`before insert or update`,
`security invoker`, `set search_path = public`), créé AVANT son déclencheur,
avec son commentaire :

- rogne `raison_sociale`, `adresse`, `ville`, `libelle` par LA classe de
  blancs, en ligne, en `chr(n)` (T1 : quatre copies) ;
- rogne le code postal aux bouts par la petite classe de la section 46,
  sans toucher l'intérieur (T22) ;
- efface `libelle` hors du type `autre` ;
- pose `created_at` à l'insertion par `clock_timestamp()`, la garde ensuite.

Politique `mes lieux de depot` : `for all to authenticated using
(public.est_mon_entreprise(pro_id)) with check (…)`. Droits :
`revoke all … from anon` ; `revoke truncate, references, trigger … from
authenticated` en toutes lettres (et MAINTAIN, sous condition de version,
dans l'appel à part, comme M1d) — le balayage de 42 bis n'est pas dans la
migration (BASE-9). Aucune politique pour l'administration. Ordre de
lecture : `created_at, id`.

### 2.2 Les colonnes de `devis` (49.4 sexies), nullables, SANS défaut

| colonne | type | sens |
|---|---|---|
| `dechets_concerne` | `boolean` | la réponse ; vide = « Oui » par prudence (le modèle d'`engage_decennale`, lu `is not false`) |
| `dechets_quantite_milliemes` | `bigint` | la quantité estimée, en millièmes de l'unité |
| `dechets_unite` | `text` | `m3` ou `t` |
| `dechets_flux` | `text[]` | vide de valeur : rien de dit ; `{aucune}` : aucune collecte séparée ; sinon les déchets collectés séparément, dans l'ordre canonique |
| `dechets_sur_place` | `text[]` | vide de valeur : rien de dit ; sinon `broyage`, `compostage` |
| `dechets_lieux` | `uuid[]` | les lieux choisis, dans l'ordre de la liste de « Mon entreprise » ; vide de valeur : aucun |
| `dechets_sans_depot` | `boolean` | **si P6 = 1** : vrai par la seule pastille « Aucun dépôt » ; vide sinon ; jamais faux |
| `dechets_cout_centimes` | `bigint` | l'estimation des coûts, HORS des totaux (selon P2) |

Toutes entrent dans les deux `grant` de 49.7, jamais une date.
`recalcule_devis()` n'en lit aucune.

Contraintes, rangées alphabétiquement entre `devis_cout_check` et
`devis_delai_check` :

| nom | règle |
|---|---|
| `devis_dechets_cout_check` | vide, ou de 1 à 999 999 999 centimes (selon P2) |
| `devis_dechets_flux_check` | vide, ou (`case` : une dimension, borne basse 1 ; puis) de 1 à 14 éléments, `<@` la liste fermée (A.4, plus `aucune`), et `aucune` seul quand il y est |
| `devis_dechets_lieux_check` | vide, ou (`case` : une dimension, borne basse 1 ; puis) de 1 à 10 éléments, aucun élément vide |
| `devis_dechets_quantite_check` | vide, ou de 1 à 99 999 999 millièmes |
| `devis_dechets_sans_depot_check` | **si P6 = 1** : vide, ou vrai |
| `devis_dechets_sur_place_check` | vide, ou (`case`) de 1 à 2 éléments, `<@` `array['broyage','compostage']` |
| `devis_dechets_unite_check` | vide, ou `m3`, `t` |

La forme des trois contraintes de tableau, à la lettre :

```sql
check (dechets_flux is null or case
  when array_ndims(dechets_flux) = 1 and array_lower(dechets_flux, 1) = 1
  then cardinality(dechets_flux) between 1 and 14
       and dechets_flux <@ array['aucune', 'papier', …]
       and (cardinality(dechets_flux) = 1 or not ('aucune' = any (dechets_flux)))
  else false end)
```

`array_ndims('{}')` est vide de valeur, donc le `case` va à `else false` :
le tableau vide est refusé, sous le nom de la contrainte. Aucune ne lie deux
colonnes ; aucune fonction dans une contrainte (pas de gardienne). Un
doublon n'est pas refusé : le téléphone n'en envoie jamais, le rang 13 compte
les lieux DISTINCTS.

### 2.3 L'appartenance des lieux

- un identifiant étranger peut être ÉCRIT dans un devis par un client
  modifié ; il ne lit rien et n'est compté par aucun motif (mesuré : aucun
  oracle — un identifiant inventé rend la même chose) ;
- un lieu retiré laisse un identifiant ORPHELIN, ignoré ; il ne disparaît du
  devis qu'au prochain appui de l'artisan sur une case de lieu (T10) ;
- aucun déclencheur ne réécrit les devis quand un lieu part.

### 2.4 Le rang 13 dans `motifs_refus_remise()` (49.9)

Les colonnes du devis entrent dans la lecture existante ; puis, seulement si
`dechets_concerne is not false` :

```sql
select count(distinct l.id) into v_lieux_existants
  from public.emetteur_lieux_depot l
 where l.pro_id = v_pro and l.id = any (v_dechets_lieux);
```

La règle — une rubrique manque si :

- **quantité** : la quantité OU l'unité est vide ;
- **tri** : `dechets_flux` est vide de valeur (`dechets_sur_place` n'y
  compte JAMAIS) ;
- **lieu** : `v_lieux_existants = 0` (et, si P6 = 1, `dechets_sans_depot`
  n'est pas vrai) ;
- **coût** : le coût est vide.

S'il en manque une : `devis_dechets` (prudence) si la réponse est vide,
`devis_dechets_rubriques` (la loi) si elle est « Oui » ; rien sous « Non ».
Une clé au plus. `CONTRAT_B2` : 19 clés sur 13 rangs ; 512 motifs au plus,
trois chiffres. Le corps ne contient ni « source » ni `'urgence'` (mode
« tout » de `verifier-devis`), ni commentaire qui les cite.

### 2.5 L'export (section 42)

Une clé `mes_lieux_de_depot` dans le second objet (17 → 18 clés), triée par
`created_at` ; sa FORME exacte est tenue par `verifier-lectures` (le modèle
de `ma_base_de_postes` : un cas d'essai « l'export de B ne contient rien de
A » ne discrimine rien sous la RLS). Les colonnes du devis voyagent par
`to_jsonb`. L'essai 51d : J1 ET J1 quater (48 → 49).

### 2.6 Ce qui ne change pas

`recalcule_devis`, `tient_le_devis`, `tient_la_ligne_de_devis`, `devis_tva`,
les politiques du devis, la base de postes, `emetteur_incomplet()` (les lieux
se jugent sur le devis), `secondeActionDuPoint`, `CHAMP_DU_MOTIF` (il vit
dans `devis.js` et ne reçoit que des motifs d'`emetteur.js`).

### 2.7 Les listes fermées à élargir (le piège du « mot entier »)

EN LE DÉCIDANT, avec leur nombre nouveau :

- **`verifier-emetteur`** : `TABLES_46` ; les contraintes (6.2-16) ; les
  longueurs (6.2-17 : l'objet à trois clés et l'alternation des trois tables
  deviennent quatre) ; `TABLES_ICI` (6.2-18) ; les déclencheurs (6.3-20) ;
  « rien n'est `not null` sauf les `pro_id` » (6.3-22) ; les fonctions
  invoker (6.3-25) ; « RLS sur » (partie 4) ; `COLONNES_ECRITES` ; `LISTES`
  (une troisième liste fermée : `tient_le_lieu_de_depot`, `mes_donnees`,
  `motifs_refus_remise`) ; **`PRIVEES`** ; la porte étroite de
  `motifs_refus_remise` (une troisième lecture, à la lettre, filtre
  compris) ; `SEPT` (deux exports de plus : neuf) ; la forme de
  `monEmetteurSupabase` (une cinquième lecture qui lève, sauf la table
  absente → `null`) ; `ECRANS` (« huit composants » → neuf) ; `choixDur`
  (T27) ;
- **`verifier-legal`** : `CLASSEMENT` (`soi`, `[ENTREPRISE]`, une RAISON en
  cinquième place — aucune phrase nouvelle dans « Ce que les autres voient de
  vous ») ; `LISTES` ; **`PRIVEES`** ; **`PRIVEES_EDGE`** ;
- **`verifier-remontee`** : `EXCLUES` (son déclencheur pose la date), avec sa
  raison en 52.1 ;
- **`verifier-etats`** : la liste `DEVIS` gagne `DechetsDevis.js` et
  `FicheLieuDepot.js` ;
- **l'essai 46** : la table (visiteur 0, autre artisan 0, la contrainte
  complète, la date posée par la base, le libellé effacé, le code postal) ;
  **cas 26 bis** (l'alternation, le compte des `definer` et des vues) ;
- **l'essai 47 cas 14** : la même alternation ;
- **l'essai 49-remise** : cas 14 c (la liste des tables nommées rouverte),
  cas 27 (§5.3).

---

## 3. Le calcul (JavaScript) et l'écran

### 3.1 `src/lib/meme-valeur.js` (nouveau, n'importe rien)

`memeValeur(a, b)` : `Object.is(a, b)`, ou deux tableaux de même longueur
dont chaque élément est `Object.is` à l'élément de même rang ;
`memeValeur(null, [])` est FAUX. Une vérification la fait tourner, puis fait
tourner la VRAIE file sur le scénario de CTL-3 (refus, retour à la valeur
confirmée par un tableau neuf, un autre champ en route : `enRoute` faux pour
les déchets), et une propriété refuse tout `Object.is` sur une valeur de
`CHAMPS_DEVIS` hors de `memeValeur` dans `file-ecriture.js`, `devis.js` et la
saisie (hors `tenue`, qui ne voit que la réduction).

### 3.2 `src/lib/devis.js`

- `CHAMPS_DEVIS` + sept (ou huit) champs ; `PAIRES_DEVIS` + la paire
  `['dechetsQuantiteMilliemes', 'dechetsUnite']` EN FIN (et, si P6 = 1,
  `['dechetsLieux', 'dechetsSansDepot']`, qui partent ensemble) ;
  `rowToDevis` les apprend AVANT la régénération de `cas-remise.json` ;
- `UNITES_DECHETS` ; `FLUX_DECHETS` (A.4 : clé, `libelle`, `exemples`) ;
  `SUR_PLACE_DECHETS` ; `ordonnerFlux` ; `fluxApresAppui(flux, cle)` et
  `surPlaceApresAppui(…)` (l'ordre canonique, `aucune` exclusif, vide de
  valeur quand il ne reste rien — jamais `[]`) ; `lieuxApresAppui(choisis,
  lieuxLus, id)` (T10) ; `CONTRAINTES_DEVIS` (à leur place alphabétique) ;
- `MOTIFS_DEVIS` + deux clés ; `rubriquesDesDechets(devis, lieux)` (T26) et
  `premiereRubriqueManquante` ; `motifsDeRemise({ …, lieux })` : `lieux` est
  la liste des lieux de l'artisan, des OBJETS `{ id, proId }` (le miroir
  filtre par le `proId` du devis, comme `etatDeLAttestation`) ; `undefined`
  = pas transmis → comme si aucun lieu n'existait (seuls la démonstration et
  `cas-remise.json` le passent) ;
- `etatDesLieux(regime, lieux)` → `'lecture' | 'echec' | 'vide' | 'lus'`
  (T12 bis) ; `rubriquesDesDechets` rend, pour « lieu », vrai (un lieu
  choisi existe, ou `dechetsSansDepot` est vrai), faux (aucun lieu choisi et
  pas « Aucun dépôt » — vrai même sans lire la liste), ou INCONNU (des lieux
  choisis, pas « Aucun dépôt », et la liste n'est pas lue) : c'est le seul
  cas où la rangée dit « Lieux de dépôt non lus » ;
- `ENDROIT_DU_MOTIF` : les deux clés → `{ endroit: 'dechets' }` ;
  `actionDuPoint` (« Compléter les déchets ») ; la rubrique visée : la
  question pour `devis_dechets`, la première manquante pour l'autre ;
- `libelleDuCout(regime)` (T16 : « Coût estimé HT » au réel, « Coût estimé,
  en euros » sinon), faite tourner sur les cinq états du régime ;
- `resumeDesDechets(devis, lieux, regime)` et ses gabarits (T24, A.3) ;
- `etatInitialDechets`, `lireDechets`, `CLES_DU_GESTE` de la carte (T23) ;
- `LES_DECHETS` (les textes, A.2) ; si P3 = 1, `AMENDE_DES_DECHETS` (la
  troisième constante à « € ») ;
- `PAS_ENCORE_VERIFIE` (A.6, T18) ;
- les importations : cinq modules (`meme-valeur.js` en plus).

### 3.3 `src/lib/file-ecriture.js`

`changements` compare par `memeValeur` (importée) ; rien d'autre ne change.

### 3.4 `src/lib/api.js`

- `devisVersBase` : un `poser` par colonne ; aucune normalisation silencieuse
  de `[]` (un défaut de la carte qui écrirait `[]` devient un REFUS visible,
  que `mesure-devis` voit) ;
- `monEmetteurSupabase` : une cinquième lecture (`emetteur_lieux_depot`,
  `created_at, id`), qui lève sur toute erreur sauf la table absente
  (→ `null`) ;
- `enregistrerLieuDepot(valeurs, idExistant)` et `retirerLieuDepot(id)` :
  `insert` / `update(...).eq('id').eq('pro_id')` / `delete`, jamais
  d'`upsert` ; l'identifiant choisi par la base, comme les assurances (un
  doublon après une réponse perdue se voit et se retire : noté, BASE-12) ;
  leur double de démonstration, qui valide comme la base, avec un crochet de
  pause pour `mesure-devis` ;
- `lieuxDe(f)` ; `monRegimeEtSaDate` → `{ regime, declareLe, assurances,
  lieux }` ; `copieEmetteur` recopie `lieux` ;
- `motifsRefusRemiseDemo` passe les lieux de la fiche de démonstration.

### 3.5 `src/lib/emetteur.js`

`COLONNES_ECRITES.emetteur_lieux_depot`, `LONGUEUR_MAX`, `CONTRAINTES`,
`TYPES_INSTALLATION` (A.5), `validerLieuDepot()` (par `premierRefus`, qui
tient l'ordre de la base), `nettoyerLieuDepot()` (`BLANCS_TARIFS` pour les
textes, la fonction du code postal de « Mon entreprise » pour le code
postal, T22).

### 3.6 « Mon entreprise »

- `FicheEmetteur.js` : une section `lieux` « Vos lieux de dépôt des
  déchets », après « Assurances » ; une aide si la liste est vide ; une
  rangée par lieu (raison sociale ; type, commune ; chevron) ; « Ajouter un
  lieu de dépôt » ; en lecture, un bloc (T13) ;
- `FicheLieuDepot.js` (nouveau, sur le modèle de `FicheAssurance.js`, HORS
  d'`ECRANS_DEVIS` : partie 5 de `verifier-emetteur`) : raison sociale,
  adresse (`ChampVille type="rue"`, et l'aide « Si aucune suggestion ne
  correspond, tapez l’adresse telle qu’elle est. »), code postal (pavé
  numérique), commune, type (des `Option`, rien de coché d'office), libellé
  si « Autre », « Retirer ce lieu » en deux appuis ;
- `MonEntreprise.js` : un mode `lieu`, un brouillon, la fermeture refusée
  pendant un envoi ;
- les textes d'exemple ne ressemblent à aucune donnée.

### 3.7 La saisie (`SaisieDevisScreen.js`)

- `CARTE_DECHETS = 'dechets'` ; `ouvrirDechets(rubrique)` ;
  `enregistrerCarte` gagne la branche `refDechets.current.enregistrer()` ;
  `enregistrerDechets` (T23) ;
- la rangée « Déchets » entre « Le chantier » et « Conditions » (T24) ; la
  ligne d'état de `attente` et `majAttente` gagnent `etatDechets` ;
- `agirSurLePoint` : `case 'dechets'` (la question ou la rubrique, T8) ;
- `NOMS_ENTETE` et `CHAMPS_DECHETS` (la garde de sortie et « Corriger ») ;
- la saisie reçoit `lieux` sans défaut, et l'état du régime pour en tirer
  celui des lieux (T12 bis).

### 3.8 La carte (`DechetsDevis.js`, nouveau, sur le modèle de `ConditionsDevis.js`)

- HORS d'`ECRANS_DEVIS`, comme `ConditionsDevis` : des vérifications à elle,
  et les listes `enDur` / `enMorceaux` ;
- `forwardRef`, `lire` / `enregistrer`, la voie `etatInitial` → `poser` →
  `lireDechets` ; `poser(` seulement depuis les gestionnaires d'appui (T27) ;
  les tableaux posés NEUFS, jamais `push` ;
- l'ordre des blocs : la question, la quantité, le tri, « Sur le
  chantier », les lieux (et la pastille « Aucun dépôt » si P6 = 1, et la
  porte « Mes lieux de dépôt », T25), le coût, l'aide générale (et
  l'amende si P3 = 1) ;
- sous « Non », les rubriques se taisent ; ce qui est écrit est GARDÉ (le
  modèle de `lireConditions` : un champ démonté se lit `undefined`) ;
- les trois états des lieux (T12 bis) ; la liste montrée est la prop
  vivante, les lieux CHOISIS vivent dans l'état ;
- la barre du haut, la ligne d'état réservée, `{...CLAVIER}`, les places
  réservées sous les montants : comme « Conditions ».

### 3.9 La démonstration (T15)

- `emetteur-demo.js` : un lieu de dépôt INVENTÉ (raison sociale et adresse
  cherchées absentes de Sirene et de la Base Adresse le jour même) ;
- `devis-demo.js` : « Muret » et « Terrasse » remplis, « Rénovation salle de
  bains » à « Oui » avec une rubrique manquante, « Sol du séjour » sans
  réponse ; les colonnes écrites `null` partout ailleurs (la cohérence de
  2b-4) ;
- `creerBaseDevisDemo` valide les contraintes nouvelles comme la base.

---

## 4. Les textes légaux (`src/data/legal.js`)

- `VERSION` (la date du commit des textes) et son bloc d'historique ;
- « Ce que nous collectons » : la phrase de « Mon entreprise » nomme « vos
  lieux de dépôt des déchets (raison sociale, adresse, type
  d’installation) » ; la phrase des devis nomme « ce que deviendront leurs
  déchets (quantité, tri, lieux de dépôt, coût estimé) », en restant UNE
  phrase ; l'empreinte de la section et `PHRASE_DEVIS`, `REPERES` changent ;
- la garde de `verifier-legal` « aucun texte ne parle de services à la
  personne ni de déchets » est SCINDÉE : la moitié « services à la
  personne » reste (décision Q3 du 16/11) ; les déchets ne se lisent que
  dans la phrase des devis et dans celle de « Mon entreprise » ;
- « Ce que les autres voient de vous » : aucune phrase nouvelle (la table se
  classe par une raison) ;
- aucun « vérifié », « agréé », « registre » (déjà refusés par
  `verifier-legal` sur tous les textes).

---

## 5. Les contrôles et les essais

### 5.1 Les nombres de référence (relevés le 21/11 par la critique, code 0)

`verifier-devis` 602, `verifier-emetteur` 282, `verifier-legal` 253,
`verifier-postes` 270, `verifier-tarifs` 178, `verifier-lectures` 182,
`verifier-moderation` 126, `verifier-remontee` 116, `verifier-etats` 101,
`verifier-portes` 88, `verifier-cibles` 45, `verifier-demo` 30,
`verifier-feuilles` 25 ; les cliquets : `fontSize` 18/18, espacements
342/353, `lineHeight` 53/56, `borderRadius` 21/21, le linter 32/32 ; essai
49-remise 21 erreurs et 288 valeurs ; `cas-remise.json` 139 cas ;
`mesure-devis` 953 mesures.

### 5.2 Ce qui change dans `verifier-devis`

`ENTETE_DEVIS`, `FERMEE`, `AJOUTS_PERMIS`, `CONTRAINTES_ATTENDUES` et §15
(35 → 42), §16 (19 → 26), `FORMES_2A` (les règles
entières), §17 (`bornes`, les quatre `copies`, « DOUZE », la propriété de
T1), `FORME_MOTIFS_REFUS_REMISE`, `CONTRAT_B2` (17 → 19), `MOTIFS_DEVIS`
(17 → 19), la forme de `motifsRefusRemiseDemo` (`lieux:`), les lignes qui
figent le compte d'erreurs de l'essai 49-remise, `attente` (figée), le
compte des appels d'`etatDesChampsDuDevis(`, `agirSurLePoint`, la branche
d'`enregistrerCarte`, les listes d'importation (T4), la vérification « € »
(si P3 = 1) ; **chaque devis écrit à la main dans le contrôle répond
`dechetsConcerne: false`**, sauf ceux qui éprouvent les déchets (la
simulation : 9 à 14 vérifications rougissaient pour cette seule raison) —
jamais une vérification affaiblie pour passer ; `duDemo` reçoit les lieux de
la démonstration ; une section « 44. Le lot 2b-5 » : les phrases en toutes
lettres, le miroir à ses bords, `rubriquesDesDechets` seule écriture, les
fonctions d'appui faites tourner (dernière case → vide de valeur, `aucune`
exclusif, liste non lue → identifiants gardés, orphelin gardé sur un appui
qui n'est pas sur un lieu), `etatDesLieux`, `libelleDuCout`,
`etatInitialDechets`, `poser` hors d'un appui refusé, `memeValeur` et la file
sur le scénario de CTL-3, la carte et ses textes, le vocabulaire ciblé (ni
« registre » en mot entier, ni « vérifi », « agré », « bordereau », « brûl »,
« dispens », « sans frais » dans `LES_DECHETS`, `FLUX_DECHETS`, les phrases
du rang 13 ; ni « amiante » dans un libellé), l'essai.

### 5.3 Les essais (joués deux fois, à la main)

- `essais-section-46.sql` : la table nouvelle, et cas 26 bis ;
- `essais-section-47.sql` : cas 14 ;
- `essais-section-49.sql` : cas 1 (avec `udt_name` : `_text` / `_uuid`) ;
- `essais-section-49-conditions.sql` : les droits de colonne ;
- `essais-section-49-remise.sql` : le décor répond « Non » ; un cas 27
  « déchets » (chaque rubrique allumée et éteinte, les deux clés, « Sur le
  chantier » qui ne complète jamais le tri, `{aucune}` présent, le lieu d'un
  autre artisan et l'orphelin qui ne comptent pas, l'ENVELOPPE `security
  definer` qui prouve le filtre `pro_id`, D4-c, les contraintes jugées en SQL
  — `'{}'` refusé pour les trois tableaux, deux dimensions et borne 0
  refusées en 23514 sous leur nom, `{aucune,papier}` refusé) ; le compte
  renuméroté ; cas 14 c rouvert ; cas 24 (13 rangs, 19 clés) ;
- `essais-section-51d.sql` : J1 et J1 quater (48 → 49).

### 5.4 La parité (`generer-cas-remise`)

`COMPLET` répond « Non » ; des cas nouveaux EN FIN (chaque rubrique seule
manquante, les deux clés, `{aucune}`, « sur le chantier » seul, un lieu
orphelin, un lieu d'un autre artisan seul choisi — le point reste —, la
réponse vide avec tout présent, et, si P6 = 1, « Aucun dépôt ») ; le format
gagne `lieux` (objets) ; une garde de COUVERTURE exige l'orphelin et
l'autre artisan ; « les 139 cas d'avant gardent leur numéro » ; « une seule
clé au rang 13 ».

### 5.5 `mesure-devis` (au navigateur, en démonstration)

Les sections qui changent, avec leur nombre : « Terrasse en bois » (2b-1)
garde son arc jusqu'à « rien ne manque » (T15) ; « Un brouillon NEUF » :
5 → 6 points. Sections « 2b-5 : … » : l'invariant avant ; « Mon entreprise »
→ les lieux (vide, ajouter, modifier, retirer en deux appuis, quitter sans
enregistrer, la croix pendant un envoi par le crochet de pause, les cibles,
le retour sur la section) ; la carte à 393 et 320 points (la question, ses
pastilles sur deux rangées s'il le faut, les unités, les déchets, « Aucune
collecte séparée » qui retire et s'annonce, « Sur le chantier », les trois
états des lieux, la porte « Mes lieux de dépôt », le coût hors du total — le
pied ne bouge pas —, « Corriger », la garde de sortie, une écriture qui ne
revient pas) ; la rangée et ses 54 gabarits (la hauteur ne bouge jamais) ; le
point et son bouton (la question ou la rubrique) ; l'invariant après. La
Base Adresse se pose par une route.

### 5.6 Les sabotages (chacun refusé par le contrôle nommé)

Ceux du v1, plus les 26 de CTL §5 et ceux des contradictions, dont : la
classe des blancs du lieu dans une variable (§17, propriété) ; une seule
entrée `copies` (§17) ; `etatDesChampsDuDevis` sans `memeValeur` (la file
faite tourner) ; la dernière case décochée écrit `[]` (déchets, lieux, sur
place : la fonction d'appui ; l'essai) ; `{aucune,papier}` accepté ;
`{broyage}` dans `dechets_flux` ; « sur le chantier » qui complète le tri ;
les identifiants retirés sur une liste non lue ; un filtre des orphelins à
l'état initial ; le miroir qui compte un lieu de B ; `l.pro_id = v_pro`
retiré (l'enveloppe) ; une fonction `security definer`, une vue ou une
fonction Edge qui lit la table (essais 46 et 47, `PRIVEES`,
`PRIVEES_EDGE`) ; un type d'installation choisi d'office (`choixDur`) ;
`etatInitialDechets` qui rend `m3` ; un `poser` dans un `useEffect` ; une
entrée dans `CHAMP_DU_MOTIF` ; la garde « services à la personne » supprimée
avec celle des déchets ; « registre » ou « amiante » dans un texte ou un
libellé ; `dechets_lieux` typé `text[]` (cas 1) ; deux dimensions acceptées ;
`monRegimeEtSaDate` en deux lectures ; `tableAbsente` rendu `[]` ; « HT » en
franchise ; `mes_lieux_de_depot` sans filtre (la forme) ; la règle du rang 13
écrite une seconde fois ; un devis du contrôle « complet » sans réponse
« Non » ; la rangée qui dit « remplies » sur une liste non lue ; un second
bouton sur le point.

---

## 6. La migration

Construite par un script qui PREND chaque morceau dans `schema.sql`
(l'imitation de la vraie base : `schema.sql` de `1cbf3a8`). Dans l'ordre :
`set local lock_timeout = '5s'` (il protège `devis` ET
`professional_profiles`, que la clé étrangère verrouille — mesuré) ; la
table, son index, `enable row level security`, ses contraintes sous
condition, sa fonction PUIS son déclencheur (`create or replace trigger`),
leurs commentaires, sa politique sous condition, ses droits en toutes
lettres ; les colonnes de `devis` sans défaut et leurs commentaires ; leurs
contraintes sous condition ; le `revoke` de 49.7 et ses six `grant` ;
`motifs_refus_remise` (même signature) ; `mes_donnees()` (après la table) ;
le balayage de la section 43 en dernier ; MAINTAIN dans un appel à part.
Aucun ordre qui commence par `drop`, `delete` ou `truncate` ; aucune barre
oblique inverse ; aucun rattrapage. Forme GARDÉE (md5) ; environ 45 à 55 Ko
(mesuré sur les morceaux : 41 Ko sans commentaires ni garde) : UN appel.

**Le vrai filet est l'empreinte LARGE contre une base NEUVE** au schéma du
jour (elle relève `relrowsecurity`, `relacl`, les politiques, les
déclencheurs) : comparer l'imitation migrée à elle-même ne voit pas un
morceau oublié. Puis les relevés avant, après et complémentaire (`id:xmin`
des tables du devis ; la table nouvelle : `relrowsecurity`, `relacl`,
`relowner`, ses politiques, à 0 ligne avant). Appliquée Opus fermé, avec
l'accord du propriétaire ; puis `git pull`.

---

## 7. L'essai sur la vraie base, et les questions pour l'iPhone

**L'essai** (par `curl`, deux artisans jetables à Brest sur les deux
preuves SIRET d'essai, régime réel déclaré avant le premier poste) : la
table lue par l'API juste après la migration (ni PGRST205 ni 42703 : le
cache de PostgREST l'a apprise) ; écrire, lire, l'autre artisan `[]`, le
visiteur 401, la contrainte complète, la date posée par la base ; chaque
rubrique allumée et éteinte, la liste de la base contre `motifsDeRemise` à
chaque pas ; un tableau écrit puis relu (l'ordre, les identifiants en
minuscules) ; `'{}'` refusé ; le lieu de B écrit dans un devis de A (accepté,
jamais compté) ; un lieu retiré (le point revient) ; les contraintes sous
leur nom ; les totaux inchangés par le coût ; l'export. Ménage par le chemin
de l'application.

**Pour l'iPhone** : la carte et le clavier (quantité, coût), les cases au
pouce, les pastilles de la question à 320 points, le formulaire d'un lieu
(adresse, code postal sur le pavé numérique), la porte « Mes lieux de
dépôt », la rangée qui ne saute pas ; et, sur le témoin (la case de la
déclaration de TVA), VoiceOver dit-il « coché » ou « checked » ? ; et le
« · » d'une rangée de lieu.

---

## 8. Ce que 2b-5 ne fait PAS

- rien n'est imprimé ni remis (2c COPIERA les lieux choisis, distincts, dans
  l'ordre, et n'imprimera ni ne copiera rien d'un devis « Non ») ;
- aucun texte libre (le client qui garde une partie des déchets, le dépôt
  intermédiaire) ;
- ni l'exception PEMD (J26), ni une question « dépannage » (J27) ;
- aucune façon de dire comment le coût est facturé (2c, J29) ;
- aucune proposition du coût depuis une ligne « Évacuation » ;
- aucun avis nouveau ;
- la classe de blancs consolidée ;
- un lieu-dit ou une zone d'activités dans `ChampVille type="rue"` (la Base
  Adresse les rend en `locality`, écartés : noté) ;
- les bordereaux de dépôt.

---

## Annexe A — Les textes (apostrophe ’ ; guillemets « » avec espaces ordinaires dans les phrases du point)

### A.1 Les motifs du rang 13 (mesurés par `node`)

- `devis_dechets` (prudence, **199** caractères) : « Dites ce que
  deviendront les déchets : quantité, tri, lieux, coût. La loi le demande
  pour construire, rénover ou démolir un bâtiment, ou pour jardiner ; Opus
  ne sait pas encore si ce devis en relève. »
- `devis_dechets_rubriques` (la loi, **186** caractères, sur le modèle
  « puisque » de la décennale) : « Dites ce que deviendront les déchets :
  quantité, tri, lieux, coût. La loi le demande pour construire, rénover ou
  démolir un bâtiment, ou pour jardiner, puisque vous avez répondu « Oui ». »
- bouton : « Compléter les déchets ».

### A.2 La carte « Déchets du chantier »

- titre : « Déchets du chantier » ; introduction : « Ce que deviendront les
  déchets de ce chantier. Rien ne s’ajoute au total du devis. »
- **la question** (P1 = 1) : sous-titre « Pour la loi » ; « S’agit-il de
  travaux sur un bâtiment, ou de jardinage ? » ; « Non, ni l’un ni l’autre »
  · « Oui (par défaut) » ; aide : « La loi demande, sur tout devis de
  construction, de rénovation ou de démolition d’un bâtiment, et sur tout
  devis de jardinage, ce que deviendront les déchets — même s’il y en a très
  peu. Répondez Non seulement si ce devis n’est ni l’un ni l’autre : une
  étude ou une fourniture sans pose (ce ne sont pas des travaux), une route
  ou un réseau sans rapport avec un bâtiment. Dans le doute (un dépannage,
  une réparation, une terrasse ou une allée contre la maison, l’entretien
  d’espaces verts, un élagage), gardez Oui : c’est le cas le plus sûr. »
- sous « Non » : « Ce devis ne dira rien des déchets. Ce que vous avez déjà
  écrit est gardé, au cas où vous changeriez d’avis. »
- **la quantité** : « Quantité estimée » ; « Combien de déchets vos travaux
  produiront-ils, en tout ? » ; pastilles « m³ » · « tonnes » ; aide : « Une
  estimation suffit. Comptez tous les déchets que vos travaux produiront,
  même très peu. » ; quantité sans unité : « Choisissez m³ ou tonnes. »
- **le tri** : « Le tri » ; « Quels déchets partiront à part ? » ; les cases
  (A.4) ; sous « Déchets dangereux » : « Chacun à part, sans les mélanger
  entre eux : amiante, solvants, peintures qui en contiennent… » ; la
  pastille « Aucune collecte séparée », et dessous : « Seulement si rien ne
  partira à part. » ; aide : « Le plâtre, les déchets dangereux et les
  déchets verts triés ne se mélangent pas aux autres. Sur un petit chantier
  (moins de 10 m³ de déchets, ou sans 40 m² pour les stocker), les règles de
  tri du décret ne s’appliquent pas ; la loi demande quand même un tri à la
  source, et le devis doit dire ce que vous faites. » ; annoncé quand la
  pastille retire des cases : « Les déchets cochés ont été retirés. »
- **sur le chantier** : « Sur le chantier » ; « Ce qui y restera, s’il y en
  a. Facultatif. » ; les deux cases.
- **les lieux** : « Où les déposerez-vous ? » ; une case par lieu (raison
  sociale ; type, commune) ; lecture : rien ; échec : « Vos lieux de dépôt
  n’ont pas pu être lus. » et « Réessayer » ; vide : « Vous n’avez encore
  aucun lieu de dépôt. » et « Ajouter un lieu de dépôt » ; la porte : « Mes
  lieux de dépôt » ; (P6 = 1) la pastille « Aucun dépôt : rien ne quittera
  le chantier », et dessous : « Seulement si tous les déchets restent sur
  place, broyés ou compostés. » ; annoncé : « Les lieux cochés ont été
  retirés. » ; aide : « Si vous les remettez à quelqu’un d’autre, la loi
  vous demande de vous assurer qu’il est autorisé à les prendre en charge ;
  Opus ne peut pas le vérifier. Pour votre propre dépôt, nommez aussi, si
  vous la connaissez, l’installation où ils finiront. »
- **le coût** : `libelleDuCout(regime)` ; « Combien coûteront le tri, le
  chargement, le transport et le dépôt ? » ; aide : « Une estimation, qui ne
  s’ajoute pas au total. Si ce coût est déjà compris dans vos prix,
  n’ajoutez rien ; s’il ne l’est pas et que vous le faites payer, ajoutez
  une ligne au devis. »
- **l’amende** (P3 = 1) : « Il suffit qu’une seule de ces informations
  manque pour exposer à une amende administrative pouvant aller jusqu’à
  3 000 €, 15 000 € pour une société. » (espaces insécables dans la
  constante, comme `AMENDE_DE_LA_LOI`).

### A.3 La rangée « Déchets »

« Non concernés » · « Les quatre rubriques sont remplies » · « À compléter :
quantité, tri, lieu, coût » (la liste ne nomme que ce qui manque, dans cet
ordre : quinze formes) · « Lieux de dépôt non lus » ; chacun avec « » ,
« — enregistrement… » ou « — pas enregistré ». Aucune ligne sous la rangée.

### A.4 Les déchets triés (ordre canonique ; selon P4)

`aucune` (la pastille, pas une case) · `papier` « Papier et carton » ·
`metal` « Métal » · `plastique` « Plastique » · `verre` « Verre » ·
`textiles` « Textiles » · `bois` « Bois » · `mineral` « Fraction minérale
(béton, briques, tuiles et céramiques, pierres) » · `platre` « Plâtre » ·
`menuiseries` « Menuiseries et vitrages » · `membranes` « Membranes
bitumineuses » · `laines` « Laines minérales (verre, roche) » · `terres`
« Terres excavées » · `verts` « Déchets verts » · `dangereux` « Déchets
dangereux ». (P4 = 2 : sans menuiseries, membranes, laines, terres.)

Sur le chantier : `broyage` « Broyage sur le chantier » · `compostage`
« Compostage ou paillage sur place ».

### A.5 Les types d’installation

`decheterie_publique` « Déchèterie publique » · `decheterie_pro`
« Déchèterie professionnelle » · `negoce` « Point de reprise d’un
distributeur de matériaux » · `tri` « Installation de tri, de transit ou de
regroupement » · `valorisation` « Installation de valorisation
(recyclage) » · `stockage_inertes` « Installation de stockage de déchets
inertes » · `stockage_non_dangereux` « Installation de stockage de déchets
non dangereux » · `stockage_dangereux` « Installation de stockage de déchets
dangereux » · `vegetaux` « Plateforme de compostage ou de broyage de
végétaux » · `collecteur` « Collecteur (benne posée sur le chantier) » ·
`depot_entreprise` « Dépôt de votre entreprise » · `autre` « Autre
installation autorisée (précisez) ».

### A.6 « Pas encore vérifié » (sept faits)

« Pas encore vérifié : le moment de la signature, si une ligne marquée
« réparation urgente » l’est vraiment, si ce devis relève des services à la
personne, le label RGE pour des travaux d’énergie, les conditions du taux
réduit de TVA (l’ancienneté du logement, la certification du client), si
votre attestation décennale couvre ces travaux (ses activités, la date où le
chantier s’ouvrira), et si vos lieux de dépôt acceptent ces déchets. »
(L'ordre et la ponctuation exacts se calquent sur la phrase actuelle à la
construction.)

### A.7 « Mon entreprise »

- section : « Vos lieux de dépôt des déchets » ; vide : « Les déchèteries,
  plateformes ou collecteurs où vous déposez les déchets de vos chantiers.
  Rangés une fois, vous les choisissez ensuite dans chaque devis. » ;
  « Ajouter un lieu de dépôt » ; en lecture, vide : « Aucun lieu de dépôt.
  Opus n’en exige aucun pour votre fiche ; mais un devis de travaux sur un
  bâtiment ou de jardinage demande où iront ses déchets. »
- formulaire : « Raison sociale » (aide : « Le nom de l’entreprise ou de la
  collectivité qui exploite le lieu, pas seulement le nom du lieu. ») ;
  « Adresse » (aide : « Si aucune suggestion ne correspond, tapez l’adresse
  telle qu’elle est. ») ; « Code postal » ; « Commune » ; « Type
  d’installation » ; « Précisez » (si « Autre ») ; « Retirer ce lieu » (deux
  appuis ; « Les brouillons qui le citent le perdront. »).

### A.8 Les refus de la base (`MESSAGES_CONTRAINTE`)

- `devis_dechets_cout_check` : « Le coût estimé des déchets doit être un
  montant positif. »
- `devis_dechets_flux_check` : « Les déchets triés ne correspondent pas à la
  liste d’Opus : mettez Opus à jour. »
- `devis_dechets_lieux_check` : « Les lieux de dépôt de ce devis ne sont pas
  valables (dix au plus) : mettez Opus à jour. »
- `devis_dechets_quantite_check` : « La quantité estimée des déchets doit
  être positive. »
- `devis_dechets_sans_depot_check` (P6 = 1) : « Cette réponse sur le dépôt
  des déchets n’est pas valable : mettez Opus à jour. »
- `devis_dechets_sur_place_check` : « Ce qui reste sur le chantier ne
  correspond pas à la liste d’Opus : mettez Opus à jour. »
- `devis_dechets_unite_check` : « Choisissez m³ ou tonnes. »
- les quatre `emetteur_lieu_*` : la raison sociale, l'adresse, le code
  postal, la commune et le type ; cinq chiffres ; les longueurs ; le type.

---

## Annexe C — Critique → décision

« ret. » = retenu par la contradiction, « part. » = en partie, « réf. » =
réfuté. La colonne « v2 » dit où le constat est traité.

| constat | verdict | v2 |
|---|---|---|
| DROIT-1 jardin / jardinage | ret., important | P1 (formulation de la contradiction), A.1, A.2, J51 |
| DROIT-2 l'effort de tri | part., important | P5 ; « remplies » au lieu de « complet » (A.3) ; J58 |
| DROIT-3 le broyage attaché aux verts | ret., important | T3 bis (une seconde colonne, jamais la rubrique tri) |
| DROIT-4 rien ne quitte le chantier | part., important | P6 ; la correction `{}` écartée (BASE-1) ; J31 |
| DROIT-5 les familles nommées par les textes | ret., important | P4, A.4 (membranes séparées du mélange bitumineux ; terres sans « et cailloux ») ; J54 |
| DROIT-6 « amiante » dans un libellé | part., mineur | T21 |
| DROIT-7 le tri à la source perdu | ret., important | A.2 (aide du tri) |
| DROIT-8 compter deux fois | ret., important | A.2 (aide du coût) |
| DROIT-9 l'arrêté de 1987 | part., mineur | J29 ; dit au propriétaire avec P2 ; aucune colonne en 2b-5 |
| DROIT-10 « aucune formule à cocher » | part., mineur | T20 |
| DROIT-11 l'amende | part., important | P3 (la phrase « une seule ») ; J59 |
| DROIT-12 « Pas encore vérifié » | ret., mineur | T18 (remplacer, sept faits) |
| DROIT-13 l'aide des lieux, trois libellés | ret., mineur | A.2, A.5 |
| DROIT-14 deux tournures | ret., mineur | A.2 (« le cas le plus sûr », « vos travaux produiront ») |
| DROIT-15 le coût sans régime | part., mineur | T16 |
| DROIT-16 les mots interdits | part., mineur | §2.7 (`verifier-etats`), §5.2 (vocabulaire ciblé) |
| DROIT-17 les questions au juriste | ret., mineur | §1.5 |
| BASE-1 le tableau vide | ret., important | T3, T3 bis, T10, §2.2 |
| BASE-2 cinq `Object.is` | part., mineur | T4 (trois endroits) |
| BASE-3 la RLS non nommée | part., mineur | §2.1, §6 (et l'empreinte large comme filet) |
| BASE-4 quatre copies, la variable | part., mineur | T1 |
| BASE-5 les orphelins sur une liste non lue | ret., important | T10, T12 bis |
| BASE-6 deux dimensions, borne 0 | ret., mineur | T3 (`case`) |
| BASE-7 le code postal recopié | ret., mineur | T22 |
| BASE-8 le filtre `pro_id`, `PRIVEES` | part., mineur | T2, T6 |
| BASE-9 42 bis | ret., mineur | §2.1, §6 |
| BASE-10 la contrainte du coût avant P2 | ret., mineur | §2.2 (« selon P2 ») |
| BASE-11 l'ordre des refus | réf. | — (`premierRefus` trie déjà) |
| BASE-12 le doublon d'un lieu | part., mineur | §3.4 (noté dans A-FAIRE) |
| BASE-13 l'essai 47, « source » | ret., mineur | §2.4, §2.7 |
| BASE-14 la migration | ret., mineur | §6, §7 |
| BASE-15 un lieu frontalier | part., mineur | §1.4 |
| ECR-1 les orphelins effacent | ret., important | T10 |
| ECR-2 `[]` contre vide de valeur | ret., important | T3, T10 |
| ECR-3 trois états des lieux | part., important | T12 bis (jamais « présent » sur une liste non lue) |
| ECR-4 `FicheLieuDepot` dans `ECRANS_DEVIS` | ret., mineur | §3.6, §3.8 |
| ECR-5 la démonstration et ses comptes | ret., important | T15, §5.2, §5.5 |
| ECR-6 `CaseACocher` | part., mineur | T14 (`Interrupteur` tel quel) |
| ECR-7 `memeValeur` et sa maison | ret., mineur | T4 (un fichier à elle) |
| ECR-8 le point, la question | ret., mineur | T8 |
| ECR-9 la rangée | part., mineur | T24 |
| ECR-10 « Corriger », les fautes | ret., mineur | T23, A.8 |
| ECR-11 le coût sous un régime inconnu | ret., mineur | T16 |
| ECR-12 la zone d'activités | ret., mineur | §3.6 (aide), §8 |
| ECR-13 partir vers « Mon entreprise » | part., mineur | T13, T25 |
| ECR-14 ce qui change sans geste | part., mineur | T28 |
| ECR-15 « Non » garde | part., mineur | §3.8, §8 |
| CTL-1 §17 | part., mineur | T1 |
| CTL-2 le code postal | part., mineur | T22 |
| CTL-3 `memeValeur` à trois endroits | ret., important | T4, §3.1 (mesuré) |
| CTL-4 le dernier décochage, les orphelins | part., important | T3, T10 |
| CTL-5 la parité et l'autre artisan | réf. | §5.4 (une garde de couverture, en bonus) |
| CTL-6 le filtre `pro_id` sous la RLS | part., important | T9 (l'enveloppe) |
| CTL-7 les essais du catalogue | ret., important | T6, §2.7 |
| CTL-8 `PRIVEES`, `PRIVEES_EDGE` | ret., important | T6, §2.7 |
| CTL-9 sept listes de `verifier-emetteur` | ret., mineur | §2.7 |
| CTL-10 rien de coché d'office | ret., important | T27 |
| CTL-11 lignes exactes, `CHAMP_DU_MOTIF` | ret., mineur | §2.6, §5.2, T8 |
| CTL-12 les devis écrits à la main | ret., mineur | §5.2 |
| CTL-13 `FicheLieuDepot` | ret., mineur | §3.6 |
| CTL-14 la garde « ni de déchets » | ret., mineur | §4 (scindée) |
| CTL-15 le vocabulaire | part., mineur | §2.7, §5.2 |
| CTL-16 `udt_name` | ret., mineur | §5.3 |
| CTL-17 deux dimensions | part., mineur | T3 (le vide traité d'abord, dans un `case`) |
| CTL-18 la lecture des lieux | part., mineur | T12 |
| CTL-19 le libellé du coût, l'accessibilité | ret., mineur | T16, T14 |
| CTL-20 quatre petits trous | part., mineur | §2.5 (la forme, pas un cas d'essai), T26, §3.4 (le crochet), §5.3 (J1 quater) |

*Chemin : `/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lot2b5/cahier-v2.md`.*
