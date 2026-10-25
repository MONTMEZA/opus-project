# Lot P du module devis : la base de postes — cahier final

> **Archivé le 25/10/2026, après la construction.** Ce cahier a guidé le
> lot P (la base de postes) ; il est versé ici tel qu'il a servi, pour qu'on
> sache plus tard POURQUOI chaque choix a été fait. **En cas de désaccord,
> c'est la section « La base de postes — lot P » de CLAUDE.md et le code qui
> disent vrai.** À savoir en le lisant :
>
> - les fichiers qu'il cite sans chemin du dépôt (`lotP/final/…`,
>   `lecture-*.md`, les critiques, `mesures-*.out`, `parite.mjs`…) étaient des
>   documents de travail de la session : ils ne sont PAS dans le dépôt ;
> - les numéros de ligne (`PLAN:…`, `schema:…`, `api:…`, `devis.js:…`) sont
>   ceux du commit `d75217d`, d'AVANT le lot ;
> - il a été parcouru à l'archivage pour en retirer ce qui identifierait une
>   personne réelle : **il n'y avait rien à retirer**. Il ne parle de la
>   vraie base que par sa FORME ; « le frère » y désigne la règle déjà écrite
>   dans `docs/PLAN-DEVIS.md` (10.5), sans aucune donnée sur lui ;
> - il ne contient aucune séquence « barre oblique inverse, u, quatre
>   chiffres » (il les écrit « barre-oblique-u ») ni aucun caractère
>   invisible : copié octet pour octet par un script, pas par l'outil
>   d'édition ;
> - **ce qui a changé depuis, ou a été construit autrement** :
>   - **la clé n'est plus une colonne GÉNÉRÉE** (corrections « base »,
>     BASE1) : `cle_rapprochement` est une colonne ordinaire que le
>     déclencheur `tient_le_poste()` pose et recalcule ; un client qui en
>     envoie une fausse reçoit toujours 428C9. Tout ce que le cahier dit de
>     `generated always as`, d'`attgenerated = 's'` et de `pg_depend` vers la
>     colonne (§2.2, §2.14 cas 19 et 20, §3.0.4, §6) est remplacé par cette
>     forme ;
>   - **les caractères invisibles** (classe Unicode « Default_Ignorable »)
>     sont retirés par la clé elle-même (BASE2). **L'empreinte du plan de
>     base n'est donc plus `0186e2b8…` mais `f7d1ccf4d41f431c125dc9ba2b46bf09`**,
>     et celle de « tout Unicode » `a4c49da5c8af9023455882d4de7c6152`
>     (et non `10210195…`) ;
>   - **l'ordre `drop expression if exists`** (50.2) existe dans `schema.sql`
>     pour une base d'essai qui aurait reçu la forme générée ; il n'a PAS été
>     envoyé à la vraie base, remplacé par une garde qui arrête la migration
>     si la colonne est encore générée ;
>   - **la migration a été envoyée sous forme « compacte et gardée »** (un
>     bloc qui refabrique les suites régulières, compare le md5 du texte
>     obtenu au fichier simulé, et n'exécute rien s'il diffère), pas telle
>     que le §8 la décrit ;
>   - **la règle du DEGRÉ de correspondance a été corrigée le 25/10**, sur la
>     vraie base : une lettre de pluriel en trop dans ce qu'on tape (« dalles »)
>     faisait passer la bonne phrase derrière une voisine. Le degré se mesure
>     désormais aussi sur les phrases privées de leurs pluriels (§3.2 ;
>     `src/lib/devis.js`, `degre()`) ;
>   - les réponses du 25/10 aux deux dernières questions : « 10cm » et
>     « 10 cm » restent deux phrases (A), et entre deux variantes c'est la
>     plus récente qui est proposée (B).


> **Ce document est un cahier de réalisation, pas du code.** Rien n'a été
> modifié dans le dépôt. **Version finale, du 23/10/2026**, écrite sur le
> dépôt au commit `d75217d` (« Devis lot 1 : essayé sur l'iPhone par le
> propriétaire »). Elle remplace la v3 du même jour, dont elle garde tout
> sauf ce que les deux critiques de la v3 — « parité SQL/JS, base et
> sécurité » (`CP1`…`CP10`) et « écran, propositions et vérifiabilité »
> (`CE1`…`CE17` de la v3, notés **`CE3-…`** quand ils pourraient se
> confondre avec les `CE…` de la v2) — ont montré faux ou fragile. Chaque
> changement est marqué **[final]** ; les marques **[v3]** et **[v2]** sont
> gardées : elles disent d'où vient une règle.
>
> **Le cahier est CONSTRUCTIBLE tel quel** : les étapes du §8 sont
> numérotées, chacune se vérifie seule, et chacune nomme ses fichiers ; la
> liste complète des fichiers touchés est au §8.1, celle des sabotages au
> §6.3. Les prototypes qui fixent les octets attendus sont dans
> `lotP/final/` (empreintes md5 au §8.0).
>
> **Conventions.** `PLAN:x` = `docs/PLAN-DEVIS.md`, ligne x ;
> `AF:x` = `docs/A-FAIRE.md` ; `PROP:x` = `docs/DEVIS-DU-PROPRIETAIRE.md` ;
> `DON:x` = `docs/DONNEES-DES-ARTISANS.md` ; `CDC:x` =
> `docs/CAHIER-DES-CHARGES.md` ; `C1:x` = `docs/CAHIER-LOT-1.md` ;
> `schema:x` = `supabase/schema.sql` ; `api:x` = `src/lib/api.js` ;
> `devis.js:x` = `src/lib/devis.js` ; `legal.js:x` = `src/data/legal.js`.
> Les leçons du projet sont citées par leur titre dans `CLAUDE.md` (et sa
> ligne). Les critiques : `CD…` (droit), `CB…` (base), `CE…` (écran) pour la
> v2 ; `CP…` (parité) et `CE3-…` (écran) pour la v3.
> **MESURÉ** = exécuté (R… : rédacteur v1, §11 ; V-… : réviseur v2, annexe
> B ; W-… : rédacteur v3, annexe C ; **X-… : réviseur final, annexe E** ;
> ou une critique, alors nommée) ; **LU** = lu dans le fichier cité ;
> **SUPPOSÉ** = déduit, à éprouver ; **TRANCHÉ ICI** = un choix de ce
> cahier, avec sa raison, qu'on peut renverser. Les numéros de ligne sont
> ceux de `d75217d` : ils bougeront dès la première ligne écrite, d'où les
> noms d'objets partout où c'est possible.
>
> **Le piège d'outil, plus que jamais.** L'outil d'écriture de ces sessions
> — y compris le texte d'une commande et le texte CHERCHÉ par l'outil
> d'édition — change toute séquence « barre oblique inverse, u, quatre
> chiffres hexadécimaux » en caractère (W-0 ; CLAUDE.md « Le transport du
> connecteur, ÉTABLI le 22/10 »). Ce cahier n'en contient donc aucune : il
> dit « barre-oblique-u » en toutes lettres. **Trois fichiers du lot en
> portent par construction** — `src/lib/rapprochement.js` (942 séquences),
> `supabase/cas-rapprochement.json` (écrit avec `ensure_ascii`) et, pour
> mémoire, les sept copies existantes de la classe de blancs — : **ils
> s'écrivent par script (la barre produite par `chr(92)`), jamais à l'outil
> d'édition, et se relisent par `od -c` et par leur md5** (§8.0). La
> fonction SQL de la clé, elle, n'en contient AUCUNE, ni d'ailleurs aucune
> barre oblique inverse (CP3).

---

## Les réponses du 23/10/2026 — elles font foi

Données par le propriétaire après la lecture de la v2. **Plus aucune question
du lot P ne reste ouverte** : les quatre questions de la v2 sont devenues des
décisions (§1.5), avec leur source.

1. **« non on construit le lot p »** — le lot P se construit. Il avait d'abord
   cru que la mémoire du lot 1 faisait déjà ce qu'il décrivait ; il veut
   quand même le prix de référence et l'écart.
2. **Mot pour mot : « il faudrait arriver à reconnaître les phrases, parce
   que l'artisan pour le même travail a par exemple rajouté un s ; il ne faut
   pas qu'il y ait trop de propositions, ça pourrait nous perdre ».** Ce qu'on
   lui a répondu, et qu'il n'a pas contesté :
   - **sans IA**, Opus reconnaît comme UNE même phrase celles qui ne diffèrent
     que par les majuscules, les accents, les espaces en trop, la ponctuation
     (virgules, points, tirets, apostrophes) et un s ou un x de pluriel ;
   - dans les propositions pendant la frappe, ces variantes ne font qu'**UNE**
     proposition (la phrase la plus récente), et **jamais plus de trois**
     propositions à l'écran ;
   - dans la base, ajouter une phrase presque identique à un poste existant
     dit « **ce poste existe déjà** » au lieu d'en créer un second ;
   - une AUTRE formulation (« création d'une dalle béton » / « dalle en béton
     à couler ») n'est **pas** reconnue : c'est l'agent, plus tard.
3. **L'entrée dans la base : « D'un appui »** (« Ajouter à ma base »), choisi
   parmi deux options ; **la mémoire du lot 1 continue de tout retenir toute
   seule**.
4. **Les quatre choix annoncés « par défaut, dis-moi si l'un ne te va pas »,
   sans objection** :
   - Q1 (a) : **aucun métier** sur un poste ;
   - Q2 (a) : la feuille d'ajout **PROPOSE le prix de la ligne** comme prix de
     référence, modifiable avant de valider ;
   - Q3 (a) : la référence ne s'affiche **que dans la ligne ouverte en
     grand**, **pas dans la liste du devis** (un client qui regarde l'écran ne
     la voit pas) ;
   - Q4 (a) : un poste se crée **depuis une ligne de devis**, pas directement
     dans « Ma base ».

---

## Ce que la version finale change, et pourquoi

Vingt-quatre changements, du plus lourd au plus léger. **Les 27 problèmes
des deux critiques de la v3 ont été vérifiés sur leur source ; tout ce qui
se fait tourner a été REPRODUIT** sur le PostgreSQL 16.15 local et sous
`node` 22, et deux mesures d'écran ont été refaites au navigateur (annexe E,
X-1 à X-6). **Aucun n'a été écarté.** Cinq ont reçu une correction
différente de celle proposée, et c'est dit (« adapté », annexe D). Deux
deviennent des questions au propriétaire, non bloquantes, avec un défaut
(§1.7).

**Ce qui ne change pas, et c'est le plus important** : les réponses du
propriétaire du 23/10 (ci-dessous) sont tenues mot pour mot — UNE
proposition par phrase, jamais plus de trois à l'écran, « ce poste existe
déjà », la phrase rangée mot pour mot, aucune IA. La v3 les tenait ; la
version finale les tient mieux, et le prouve par des propriétés au lieu
d'exemples.

1. **La recherche ne fait plus surgir de propositions sans rapport**
   (CE3-1, bloquant ; adapté). En v3, « Les » devenait `le`, et `le` se
   trouve dans presque tout : trois propositions sans rapport, là où le
   lot 1 n'en montrait aucune (MESURÉ X-6). **Règle finale** : un mot tapé
   correspond s'il est CONTENU dans la phrase à plat (exactement la
   recherche du lot 1, donc rien n'est perdu), **ou** si, privé de son
   pluriel, il est un **MOT ENTIER** de la clé de la phrase — pourvu que
   cette clé ait trois lettres au moins, ou que le texte tapé ait plusieurs
   mots (§3.0.6). La critique proposait « COMMENCE un mot » : MESURÉ sur son
   propre script, cela ramenait encore « sous » → « soufflage » et « Cons »
   → « contre-cloison ». Avec « mot entier » : **0 perte, 4 trouvailles de
   plus sur 52 990 comparaisons, toutes justes** (« murs » → « mur »,
   « carrelées » → « carrelée »), contre 154 pour la v3, presque toutes du
   bruit (X-18).
2. **La fonction de la clé ne peut plus servir à faire tomber Opus**
   (CP1, important). Sans borne d'entrée, 10 Mo envoyés par n'importe quel
   compte connecté tenaient un processus 39,4 s malgré un délai de 8 s, et
   une écriture au nom d'un autre artisan tenait SON verrou : A a attendu
   8,07 s (MESURÉ X-1). **Une garde de 2 000 points de code en tête de la
   fonction ET du miroir** (au-delà : pas de clé ; 10 Mo → `null` en
   47 ms), et **le verrou et le compte du plafond ne sont pris que pour SA
   propre entreprise** (ou sans jeton : l'éditeur SQL reste compté)
   (§2.4 ; X-12, X-13, X-14).
3. **Les signes qui portent un SENS ne sont plus effacés** (CP2, important ;
   adapté pour « × »). « Déplacement < 20 km », « > 20 km » et « 20 km »
   faisaient UN poste, comme « Plancher bas » et « Plancher BA » (béton
   armé), « R+1 » et « R-1 », « 50 € » et « 50 % » (MESURÉ X-3). Désormais
   `<` et `≤` → « inf », `>` et `≥` → « sup », `+` → « plus », `%` →
   « pourcent », `‰` → « pourmille », `€` → « euro », `&` → « et », et
   **`×` → la lettre x** (la critique proposait « espace x espace » ; la
   lettre rapproche « 60×60 » de « 60x60 », que tape un clavier de
   téléphone) ; et **« bas » ne perd jamais son s** (§3.0.2).
4. **Une ligne sans prix ne fait plus perdre le prix** (CE3-2, important).
   Une proposition ne retient que les prix UTILISABLES (entier > 0, valeur
   d'une ligne offerte comprise) : l'artisan qui écrit ses désignations
   d'abord retrouve 52 € en un appui (MESURÉ X-17, S2).
5. **Un poste sans prix de référence ne fait plus taire le dernier prix
   écrit** (CE3-3, important). Sa rangée porte le dernier prix utilisable de
   la mémoire de même clé, dit pour ce qu'il est (« sans réf. · dernier :
   45,00 € / h »), et un appui le recopie (X-17, S3 ; tient sur une ligne à
   320 points, X-20).
6. **Un seul tri pour les deux sources** (CE3-4, important) : la phrase qui
   commence par le texte tapé, puis chaque mot tapé qui commence un mot,
   puis contenu, puis trouvée par le pluriel seulement ; à égalité, la base
   avant la mémoire ; puis le **dernier usage** ; puis l'ordre à plat. « Pos »
   ne met plus « Dépose » en tête ; avec quatre « Chape » dans la base, celle
   qu'on vient d'utiliser sort la première (X-17, S1, S5, S6).
7. **Jamais deux `Modal` à l'écran** (CE3-5, important). « Ce poste existe
   déjà » se traite DANS la feuille d'ajout, qui change elle-même le prix
   de référence du poste existant (`modifierPoste`) ; elle n'ouvre jamais
   `FeuillePoste`. L'état des feuilles de la saisie est UNE chaîne (la leçon
   des Demandes, CLAUDE.md l.2903) (§4.6, §4.8).
8. **La fonction SQL ne contient plus aucune barre oblique inverse** (CP3) :
   le remplacement s'écrit `chr(92) || '1' || chr(92) || '2'`, la barre de
   la table `chr(92)`. MESURÉ : sous `standard_conforming_strings = off`, la
   v3 rendait « pose » suivi de quatre caractères de contrôle (X-2) ; la
   fonction finale rend la même empreinte et le même fuzz sous `on` et sous
   `off` (X-10).
9. **L'invariant de parité est écrit, asserté et contrôlé** (CP4) : une
   sortie de remplacement n'est faite QUE de `a`–`z`, `0`–`9` et d'espaces.
   MESURÉ : « ≤ » → « <= » donne « a<=b » en JavaScript et « a< b » en SQL ;
   le générateur refuse (X-11).
10. **Les caractères invisibles sont SUPPRIMÉS, pas changés en espace**
    (CP5) : U+200B, U+200C, U+200D, U+2060, U+FEFF, U+180E, les sélecteurs
    de variante U+FE00–U+FE0F et quatre remplisseurs hangûl. Trois postes
    identiques à l'œil n'en font plus qu'un (X-12, F1) ; un invisible seul
    est refusé (F2).
11. **L'index unique change de NOM et sort de toute collation** (CP6) :
    `idx_base_postes_rapprochement` sur
    `(pro_id, (md5(cle_rapprochement)::uuid), (unite collate "C"),
    fourniture_non_comprise)` ; 88 kB pour 1 000 postes au lieu de 112
    (X-12, X-14).
12. **La collation de la vraie base se relève par une requête qui marche en
    PostgreSQL 16 ET 17** (CP7 ; éprouvée sur le 16, X-23), et l'empreinte
    calculée PAR la vraie base reste la preuve (§7.4).
13. **Les clés des postes se calculent une fois par lecture** (CP8) :
    `postesPrepares()` (un `WeakMap`), et un contrôle qui l'exige.
14. **Le texte dit ce que la table EST** (CP9) : 998 caractères (530 lettres,
    20 chiffres, 30 remplacements, 258 séparateurs, 160 supprimés ; la chaîne
    du `translate` en fait 968) ; U+0000 hors de la table (PostgreSQL ne le
    porte pas) ; aucune expression `/g` exportée (le pluriel est un littéral
    privé, que le compilateur Hermes valide, X-21).
15. **Le poste reconnu est toujours nommé quand la phrase diffère** (CE3-7)
    — dans la ligne de référence (« Votre prix de référence pour « Dépose
    fenêtre » : … ») et dans le bloc —, **avec une sortie** pour un faux
    rapprochement : « Ce n'est pas le même travail ? Changez un mot de la
    ligne : elle ne sera plus rapprochée de ce poste. »
16. **Les mots promis apparaissent** (CE3-6) : sur une ligne variante d'un
    poste, le bloc dit « Ce poste existe déjà dans votre base, sous « … ». »
    ; la démonstration le fait voir sans `.env` (§4.3, §7.3).
17. **La feuille « existe déjà » est une décision sans piège** (CE3-8) : le
    prix tapé est gardé ; à prix égal, « Il a déjà ce prix de référence » et
    « Fermer » seul ; un poste sans prix a sa forme (« Fixer le prix ») ; les
    gestes portent le même nom que sur la carte ; les deux phrases sont
    montrées, avec ce qu'Opus a reconnu ; et la même sortie qu'au 15.
18. **Le détail d'une proposition tient sur UNE ligne, et c'est une
    propriété** (CE3-10, CE3-11) : un autre prix → « aussi 45,00 € » ;
    sinon « +2 prix » ; `numberOfLines={1}` en garde, la fourniture AVANT
    l'historique. MESURÉ au navigateur à 320 et 390 points (X-20). Le libellé
    VoiceOver dit d'abord le prix qu'un appui recopie.
19. **« La clé ne s'affiche nulle part » est tenu** (CE3-12) : un contrôle
    exige que toute proposition porte une phrase RANGÉE, octet pour octet, et
    qu'aucun écran n'importe `rapprochement.js`.
20. **La démonstration fait voir la réponse 2** (CE3-13) : trois lignes de
    plus (« Seuils… » à 23 €, « Depose… » sans accent, « evacuation… » tapée
    vite), des données séparées pour le regroupement et pour l'ajout (la
    niche murale), et un ordre de `mesure-devis` vérifié par une précondition.
21. **Les contrôles tiennent des propriétés** (CE3-14) : le balayage de tous
    les débuts de mots (au plus trois, aucune clé en double, aucune mémoire
    de la clé d'un poste, des phrases rangées, des prix utilisables), un
    témoin positif (« Pos » : exactement trois), et la section « deuxième
    chape » de `mesure-devis` réécrite (`:742-781`).
22. **La feuille d'ajout ne montre plus qu'une ligne de « postes proches »**
    (CE3-15) — la même phrase à une autre unité ou fourniture — et le prix ne
    prend pas le focus à l'ouverture.
23. **`sous` compare une forme VISIBLE** (CE3-16, adapté) : une espace
    insécable ou un invisible ne déclenchent plus « sous « … » » ; la forme
    décomposée reste (rare : un clavier tape en forme composée), et c'est dit.
24. **Ce qu'on dit au propriétaire est exact** (CE3-17), et deux questions
    lui sont posées, avec leur défaut (§1.7) : rapprocher « 10cm » de
    « 10 cm » (CP10), et titrer une proposition par la phrase la plus
    SOUVENT écrite (CE3-9).

**Et des sabotages nouveaux** (82 à 110, §6.3), dont sept déjà joués ici
(X-11, X-22).

---

## Rappel : ce que la v3 avait changé, et pourquoi

Gardé tel quel : c'est l'histoire des règles qui suivent. **Là où la version finale le contredit — les nombres de la table, des cas et des paires, les empreintes, le nom de l'index, la recherche, le tri, le détail des propositions —, c'est elle qui fait foi** (ci-dessus, et le corps du cahier).

Seize changements, du plus lourd au plus léger. Le premier est le cœur de la
version ; les autres en découlent, ou appliquent les réponses.

1. **La clé d'un poste se rapproche, la phrase reste mot pour mot** (réponse 2 ;
   T1 révisé, §3.0). La v2 avait tranché l'inverse — T1 : clé exacte ; CB3 :
   clé normalisée écartée, « parce qu'elle ferait dépendre l'égalité de tables
   Unicode et de collations qui peuvent différer entre PostgreSQL et Hermes ».
   **Cette objection est neutralisée, et c'est MESURÉ** : la clé n'utilise
   AUCUNE table Unicode à l'exécution — ni `normalize`, ni `lower()`/`upper()`,
   ni `toLowerCase`, ni `unaccent`, ni collation, ni classe `\p{…}` — mais une
   **table explicite de 955 caractères**, écrite une fois et recopiée deux fois
   (en `chr(n)` dans une fonction SQL immuable, en séquences barre-oblique-u
   dans un fichier JavaScript qui n'importe rien). Les deux écritures rendent
   **la même empreinte md5 sur les 1 112 063 points de code d'Unicode** (W-3),
   **145 cas écrits à la main sur 145** des deux côtés (W-2), et la même
   empreinte sous trois collations (C.UTF-8, ICU tr-TR, ICU fr-FR), là où
   `lower()` change de résultat de l'une à l'autre (W-4).
2. **Le doublon devient « presque identique »** (§2.8). L'index unique porte
   sur `(pro_id, md5(cle_rapprochement), unite, fourniture_non_comprise)`, et
   `cle_rapprochement` est une **colonne générée** que le téléphone ne peut pas
   écrire (428C9, MESURÉ W-6). Les cinq variantes de V-CB3 ne font plus cinq
   postes : un poste et quatre refus (MESURÉ W-6, M1).
3. **Une phrase sans lettre ni chiffre ne fait plus un poste**
   (`base_poste_rapprochement_check`, §2.3) — et cela **ferme CB4 pour la base
   de postes** : les cinq blancs hors classe que la v2 laissait passer, seuls,
   donnent une clé vide et sont refusés (MESURÉ W-6, M2).
4. **La mémoire du lot 1 fait UNE proposition par phrase** (réponse 2 ; T19,
   §3.1) : elle regroupe ses lignes par la clé, garde la phrase la plus
   récente du groupe et ses **trois prix au plus**, montrés dans la même
   rangée. Le lot 1 en faisait une par prix. **Trois cas de `verifier-devis`
   changent**, et un quatrième (les imports de `devis.js`) — MESURÉ W-8 sur
   une copie du dépôt : les 288 autres restent verts.
5. **Jamais deux propositions de même clé** (T19, §3.2) : un poste de la base
   masque les lignes de la mémoire de même clé, quel que soit leur prix — la
   v2 ne masquait que le même prix. Trois au plus, toujours.
6. **La recherche passe par la clé, et ce qui tient sans le pluriel passe
   d'abord** (T12 révisé, §3.0.6) : « Dalles » trouve « dalle », « beton »
   trouve « béton », et « Pos » (un mot en train d'être tapé) propose d'abord
   les « Pose », pas « … pour une salle d'eau ». MESURÉ W-9 sur 52 990
   comparaisons : **rien de ce qu'on trouve aujourd'hui n'est perdu**.
7. **Le poste existant garde SA phrase** (T16, §4.6) : une variante reconnue
   ne la remplace jamais ; la feuille d'ajout dit « ce poste existe déjà »
   et propose d'en changer le prix de référence.
8. **`normalize` sort de `devis.js`** (§3.1, §9) : la recherche de la mémoire
   ne dépend plus d'une fonction dont l'implémentation sur l'iPhone ne se lit
   pas dans `node_modules` (LU, §3.0.7).
9. **Les quatre questions deviennent des décisions** (réponse 4 ; §1.5) :
   aucun métier ; prix proposé ; la référence dans la ligne ouverte seulement
   — `RangeeLigne` ne reçoit rien, et un sabotage le tient (§6.3, 38) ;
   pas de bouton « Nouveau poste ».
10. **L'entrée « d'un appui » est une décision du propriétaire** (réponse 3) :
    C3 et la première chose « à dire » de la v2 sont résolues (§1.2, §1.3).
11. **La section 50 ne contient AUCUNE séquence barre-oblique-u** (§2.4,
    §2.14) : la classe de blancs de `tient_le_poste()` s'écrit en `chr(n)`
    comme la table de la clé. Le transport du connecteur n'a plus rien à
    changer, l'outil d'édition non plus, et un éditeur qui enregistrerait le
    fichier en forme décomposée ne peut plus changer la table sans que ça se
    voie. `verifier-devis` apprend à lire cette forme (§6.2).
12. **Un fichier de cas partagé, `supabase/cas-rapprochement.json`**, joué par
    `node` et par PostgreSQL, comme `cas-devis.json` l'est pour l'argent : 145
    cas écrits à la main, 15 paires qui doivent rester distinctes, et les deux
    empreintes (§3.0.5, §2.15 cas 18).
13. **Un contrôle compare les deux tables, caractère par caractère** (§6.1 A) :
    il évalue les `chr(n)` et les littéraux de la fonction SQL et les compare
    aux chaînes du fichier JavaScript. Éprouvé : une lettre changée côté SQL,
    un `œ → o`, refusés (MESURÉ W-10).
14. **Le seuil du pluriel est mesuré, pas choisi** (§3.0.3) : un s ou un x
    final tombe sur un mot de **trois lettres au moins**. À quatre, les
    articles (« de / des », « au / aux ») ne se rapprochent plus : 0 sur 38
    au lieu de 38 sur 38 (MESURÉ W-5).
15. **Les contrats changent avec la clé** (§2.4, §3.0.8) : changer la règle,
    c'est changer les deux écritures, le fichier de cas ET réécrire la table
    — une fonction remplacée ne recalcule pas une colonne déjà rangée (MESURÉ
    W-7).
16. **L'essai 50 gagne cinq cas (18, 18 bis, 19, 20, 21) et en réécrit deux
    (1 bis, inversé ; 7), les contrôles une partie, le protocole « Dalles →
    dalle »**, et dix-neuf sabotages nouveaux (63 à 81), dont sept déjà joués
    ici (§6.3).

---

## Rappel : ce que la v2 avait changé, et pourquoi

Gardé tel quel : c'est l'histoire des règles qui suivent. Ce que la v3 y
contredit est signalé entre crochets.

Quinze changements, du plus lourd au plus léger. Chacun renvoie à la
critique qui l'a demandé et à la section du cahier qui le porte.

1. **L'écart se voit dans le geste le plus courant** (CE1, bloquant ; CE2).
   En v1, la phrase d'écart ne paraissait qu'en QUITTANT le champ prix, et
   « Poste suivant » remplaçait la carte aussitôt (LU,
   `src/screens/SaisieDevisScreen.js:825-831`) : la phrase n'était jamais
   lue. En v2, **la référence se dit AVANT la frappe du prix**, sur une
   ligne posée au-dessus de la rangée quantité/prix — elle reste au-dessus
   du champ que le défilement amène contre le clavier —, et un **bloc
   « base »** sous le prix porte l'écart, l'ajout et les réglages ; il est
   visible sans glisser à 390 × 844 (§4.5).
2. **La phrase du propriétaire est gardée, et elle reçoit une réponse**
   (CE8, CE7). « … — c'est voulu ? » est sa phrase mot pour mot (PROP:101).
   Une question sans réponse possible reviendrait à chaque ouverture : la
   v2 lui donne sa réponse sur place, **« Changer ma référence »**, qui
   ouvre la feuille du poste PAR-DESSUS la carte, sans quitter le devis. La
   question 3 de la v1 (seuil, bouton) est tranchée par là (§1.4, T13).
3. **La phrase d'un poste ne se corrige pas dans la feuille d'ajout** (CE6).
   La corriger changeait la clé : la ligne redemandait l'ajout, et l'artisan
   créait une variante. Pour retirer un nom de client, on corrige d'abord
   la LIGNE (§4.6).
4. **Un nom de client dans la phrase est signalé, sans IA** (CD3). La v1
   disait la chose indétectable ; MESURÉ par la critique droit et rejoué par
   le réviseur : une comparaison exacte avec la fiche du client du devis et
   trois motifs le détectent, avec un faux positif connu, donc **un
   avertissement, jamais un refus** (`indicesDuClient`, §3.2, §4.6).
5. **Le texte d'effacement d'un client devient vrai** (CD1). « Pour effacer
   les données de ce client, supprimez aussi ses devis » (`legal.js:754-756`)
   ne suffit plus : une phrase de poste qui le nomme survit à la fiche ET au
   devis, et reste dans l'export (MESURÉ V-CD1). Le texte le dit, le
   contrôle l'exige, l'essai le prouve (§5, §6.2, §2.15 cas 4 bis).
6. **« Personne d'autre ne les voit » est retiré** (CD2). C'est la promesse
   que le projet s'interdit (`legal.js:667-670`) ; l'en-tête de la page dit
   ce que dit déjà le texte opposable (§4.7).
7. **L'origine d'un poste se dit par SA date, et aucun texte de client ne
   voyage** (CD7, CE16, CB2). La v1 passait par `origineDeSuggestion`, qui
   rend quatre mots de l'objet du devis pour un devis manuel (LU,
   `devis.js:1030-1044`) et bouge avec le devis. La v2 écrit « Ajouté le
   14/10/2026 depuis un de vos devis », lu dans le poste lui-même : la
   lecture ne plonge plus dans `devis`, pèse un tiers de moins (MESURÉ par la
   critique base : 337 473 octets contre 505 164 pour 1 000 postes), et un
   SUPPOSÉ de la v1 disparaît (le plongeon PostgREST par la clé composée).
8. **La lecture dit quand elle est incomplète** (CB1). 1 000 est aussi la
   limite de lecture par défaut de l'API de Supabase (SUPPOSÉ pour ce
   projet) : sans ordre ni compte, relever le plafond tronquait la base en
   silence. La lecture trie, compte, et la page dit « liste incomplète » ;
   la limite réelle se relève sur la vraie base (§4.2, §7.5).
9. **Le déclencheur fige l'identifiant et l'entreprise d'un poste** (CB9,
   MESURÉ V-CB9) et **dit pourquoi il doit rester `security invoker`** :
   en `definer`, il apprenait à un autre artisan que la base de A était
   pleine (CB8, MESURÉ V-CB8b). Quatre contrats sont écrits au lieu d'être
   devinés : l'ajout tardif qui fait revenir un poste (CB5), l'`upsert` au
   plafond (CB10), l'écriture future à profondeur supérieure à 1 (CB12), les
   variantes invisibles qui passent l'index (CB3, CB4) (§2.4, §2.8, §2.9). **[v3 : elles ne passent plus — T1 révisé, §2.8 ; CB4 est fermé pour la base de postes, §2.3.]**
10. **L'essai 50 gagne neuf cas, et deux cas changent de méthode** (CB6,
    CB7, CB11, CD8). Deux sessions pour la modification tardive (MESURÉE
    protégée par le réviseur), un administrateur et un jeton inconnu qui
    lisent 0, `pg_attribute.attacl` au lieu de `column_privileges` (qui rend
    33 lignes à tort, MESURÉ V-CB7), le motif normalisé de l'essai 49 pour
    le catalogue (§2.15).
11. **Les textes opposables suivent la base en entier** (CD4, CD5, CD9,
    CD10, CD12) : l'engagement de l'éditeur couvre les PHRASES, pas
    seulement les prix ; la finalité est écrite dès la première collecte ;
    « Combien de temps », « Vos droits » et le bloc d'historique de
    `VERSION` sont à jour ; plus aucune formule « aucune donnée de client »
    (§5).
12. **Les conduites sont écrites pour la vraie base et pour le compte du
    frère** (CD6) : sur `base_postes`, la forme seulement ; l'essai au
    téléphone sur le compte principal, jamais sur celui du frère ; zéro
    poste sur ce compte avant de le lui remettre (§7.4, §7.6, §8 étape 10).
13. **Un changement de régime de TVA se dit** (CD13) : une référence fixée
    avant la déclaration du régime actuel est montrée avec « vérifiez-la »,
    sans colonne nouvelle (`regime_tva_declare_le`, schema:10193-10197)
    (§3.2, T9).
14. **Les suggestions ne grandissent pas** (CE3, CE4, CE14) : aucun titre de
    groupe, la source dans la rangée, un détail court sur une ligne, le
    préfixe « Reprendre : » commun aux deux sources, et un budget de hauteur
    mesuré (166 points à 390 de large).
15. **Les détails de l'écran** : le clavier se ferme avant la feuille (CE5) ;
    aucune attente de la file pour ajouter (CE10) ; un état « en lecture »
    (CE9) ; les feuilles dans leurs fichiers (CE13) et fermées par la garde
    de sortie (CE15) ; `retour.reussite()` (CE17) ; un seul « Réessayer »
    (CE18) ; les erreurs de la page sur une surface blanche (CE19) ; deux
    portes et une fonction (CE20) ; la croix des feuilles nommée comme
    exception (CE12) ; une démonstration qui fait voir chaque état et un
    contrôle qui le vérifie (CE11) ; des contrôles qui tiennent des
    propriétés (CE21) ; des protocoles complets (CE22).

**[v3 : ces quatre questions ont reçu leur réponse le 23/10 ; ce sont des décisions, §1.5.]** **Les questions au propriétaire passent de quatre à quatre** (§1.5) : la
question 3 change d'objet (« voir l'écart aussi dans la liste du devis ? »,
née de CE1 et de CD11) ; les trois autres sont reformulées pour un
débutant. Les points du lot 1 à confirmer sont rangés à part (§1.6), et l'un
d'eux **ne touche plus** le lot P (l'origine par sa date, voir 7).

---

## 0. En une page

### 0.1 Ce que le lot P livre

Un artisan chiffre une ligne, par exemple « Chape sèche avant carrelage
collé, 45 € le m² ». Sous le prix, il touche **« Ajouter à ma base »**, relit
la phrase dans une petite feuille, garde ou corrige le **prix de référence**
proposé (le prix de la ligne), puis valide. À partir de là :

- quand il tape « chape » — ou « chapes », ou « CHAPE » — dans un autre devis,
  **ce poste lui est proposé**, avec sa phrase exacte et son prix de
  référence daté ; une ligne de la mémoire de même clé ne vient pas s'y
  ajouter : **une proposition par phrase, trois au plus** ; **[final]** la
  liste est triée par pertinence, puis la base avant la mémoire, puis le
  dernier usage ;
- quand une ligne porte ce poste — à la casse, aux accents, aux espaces, à la
  ponctuation et à un s ou un x de pluriel près, **[final]** jamais aux
  signes qui portent un sens (`<`, `>`, `+`, `%`, `€`…) —, **sa référence
  s'affiche au-dessus du prix, avant qu'il le tape** : « Votre prix de
  référence : 45,00 € / m², fixé le 14/10/2026. » ; **[final]** si la phrase
  de la ligne n'est pas celle du poste, la référence le NOMME (« … pour
  « Chape sèche avant carrelage collé » … ») ;
- s'il met un autre prix, le bloc sous le prix le dit avec sa phrase à lui :
  « Vous mettez 52,00 € — c'est voulu ? », et lui offre la réponse :
  **« Changer ma référence »**. Ni fenêtre qui s'impose, ni refus ;
- s'il tape une phrase presque identique à un poste qu'il a déjà, Opus lui dit
  **« Ce poste existe déjà dans votre base »**, montre le poste, et lui
  propose d'en changer le prix de référence — jamais un second poste ;
  **[final]** et lui offre une sortie si ce n'est pas le même travail ;
- une page **« Ma base de postes »**, ouverte depuis « Mes devis » ou depuis
  « Mon profil », lui permet de chercher ses postes, de fixer, changer ou
  retirer un prix de référence, de corriger une phrase, et de retirer un
  poste.

| ce qui est construit | où |
|---|---|
| une fonction SQL IMMUABLE `public.cle_de_rapprochement(text)`, écrite en `chr(n)`, **[final]** gardée à 2 000 points de code, sans aucune table Unicode ni aucune barre oblique inverse | `supabase/schema.sql`, **section 50**, avant la table |
| une table PRIVÉE `base_postes` — avec une colonne GÉNÉRÉE `cle_rapprochement` —, son déclencheur, sa politique, ses droits et ses index (**[final]** `idx_base_postes_rapprochement`, hors collation), plus un index unique `devis (id, pro_id)` qui sert de point d'attache au lien d'origine | `supabase/schema.sql`, **section 50** |
| l'export RGPD : une clé `ma_base_de_postes` | section 42, `mes_donnees()` réécrite |
| le miroir JavaScript de la clé, qui n'importe rien : `aPlat`, `cleDeRapprochement`, la table, **[final]** `LONGUEUR_MAX`, `EXCEPTIONS_PLURIEL`, `PLURIEL_SOURCE` | `src/lib/rapprochement.js` (nouveau, **écrit par script**) |
| les cas partagés de la clé, joués par `node` ET par PostgreSQL : **[final]** 175 cas, 22 paires distinctes, les deux empreintes | `supabase/cas-rapprochement.json` (nouveau, **écrit par script**) |
| le générateur de la fonction SQL depuis la table JavaScript | `scripts/generer-rapprochement.mjs`, `npm run generer-rapprochement` |
| le calcul pur : la référence et l'écart, la clé d'un poste, les suggestions des deux sources et **[final]** leur tri unique, la recherche par mots, les indices d'un client dans une phrase, l'origine, les libellés, **[final]** la forme visible d'une phrase | `src/lib/postes.js` (nouveau), `src/lib/devis.js` (la mémoire regroupée par la clé) |
| les écritures et lectures (Supabase et démonstration, **[final]** une à la fois), et la date du régime de TVA | `src/lib/api.js`, `src/data/devis-demo.js` |
| les phrases de chaque contrainte, de l'index unique, d'`OP018` et de `428C9` | `src/lib/erreurs.js` |
| la suggestion dans `ChampDesignation` ; la référence, l'écart et le bloc « base » dans `CarteLigne` ; `FeuilleAjoutPoste` et `FeuillePoste` (deux fichiers, **[final]** jamais ensemble à l'écran) ; la page `PostesScreen` ; deux portes ; `OpusApp` | `src/components/`, `src/screens/`, `src/OpusApp.js` |
| un commentaire du lot 1 devenu faux | `src/lib/file-ecriture.js:154-156` (CB11) |
| les textes opposables qui nomment cette base | `src/data/legal.js` |
| `npm run verifier-postes`, et les contrôles existants mis à jour | `scripts/` |
| `supabase/essais-section-50.sql` | `supabase/` |

### 0.2 Ce qu'il ne livre pas

- **Aucune IA.** Opus reconnaît sans IA les VARIANTES D'ÉCRITURE d'une même
  phrase (casse, accents, espaces, ponctuation, un s ou un x de pluriel) ;
  reconnaître deux FORMULATIONS du même poste (« création d'une dalle
  béton » / « dalle en béton à couler »), comprendre une dictée, proposer les
  postes nouveaux d'un devis, remplir la base depuis d'anciens PDF : c'est
  l'étage de l'agent, après le module (PLAN:3122-3124). La détection d'un nom
  de client n'en est pas : c'est une comparaison de mots, sans modèle.
- **Aucun ajout automatique.** Un poste n'entre dans la base que par un appui
  de l'artisan (PLAN:3121, PLAN:3124 ; décidé par le propriétaire le 23/10,
  réponse 3).
- **Aucun prix du marché, aucune moyenne, aucun prix conseillé, aucun prix
  d'un autre artisan** (PLAN:3120, PLAN:3141-3143, DON:827-832), et un
  contrôle de vocabulaire le tient (§6.1 A).
- **Aucun taux de TVA sur un poste**, **aucun métier sur un poste** (décidé :
  réponse 4, Q1 a), aucun historique des prix de référence (une valeur et sa
  date).
- **La référence n'apparaît pas dans la liste du devis** (réponse 4, Q3 a) :
  seulement dans la ligne ouverte en grand.
- **Aucun bouton « Nouveau poste » dans « Ma base »** (réponse 4, Q4 a).
- **Rien ne sort** : pas de numéro, pas de PDF, pas de remise au client.
  « Prix de référence » est un mot d'écran de l'artisan ; il ne s'imprimera
  sur aucun document adressé à un client (à faire confirmer par le juriste
  avant le lot 2, CD12).
- **Aucun module natif**, donc aucune reconstruction EAS : le lot s'essaie
  dans le build de développement ou dans Expo Go.

### 0.3 Ce qui est tranché, en une ligne chacun

| question | tranché | source ou raison |
|---|---|---|
| où vivent les postes | une table PRIVÉE `base_postes`, une ligne par poste, jamais dans `tarifs_pro` ni `professional_profiles` | PLAN:3121, PLAN:3129 ; `src/lib/emetteur.js:93-98` |
| appartenance | `pro_id in (select public.mes_entreprises())`, `for all to authenticated`, rien pour `anon`, `revoke all` puis quatre droits, donc pas de `truncate` | schema:12381-12431 ; CLAUDE.md « Une politique RLS se paie PAR LIGNE » (l.8350) |
| contenu d'un poste | phrase (mot pour mot), unité (obligatoire, les sept clés du lot 1), fourniture non comprise, main-d'œuvre, prix de référence (vide permis), sa date, devis d'origine (facultatif) ; la clé de rapprochement, calculée par la base ; **aucune colonne de client** | PLAN:3121 ; la mémoire du lot 1 recopie ces cinq valeurs (devis.js:1090-1101) |
| prix de référence | centimes, `null` = « pas encore fixé », de 0,01 € à 99 999 999,99 €, **jamais 0** | PLAN:3121 ; CLAUDE.md « Un `0` n'est pas un vide » (l.7476) |
| date du prix | posée par la BASE quand le prix change, lue par la référence, la suggestion et la page | CDC:295, par analogie ; CLAUDE.md « Les dates appartiennent à la BASE » (l.7502) |
| clé d'un poste | (**clé de rapprochement** de la phrase, unité, fourniture non comprise) : la même que la mémoire du lot 1, qui passe à la même clé | réponse 2 ; T1, §3.0 |
| **[final]** la clé de rapprochement | une table explicite (998 caractères), des classes ASCII, une exception (« bas ») ; une garde de 2 000 points de code ; jamais `normalize`, `lower`, `unaccent`, collation, `\p{…}`, ni barre oblique inverse dans la fonction ; deux écritures d'une seule source, comparées | §3.0 ; MESURÉ X-7 à X-11 |
| **[final]** les signes qui portent un sens | `<` `≤` → inf, `>` `≥` → sup, `+` → plus, `%` → pourcent, `‰` → pourmille, `€` → euro, `&` → et, `×` → x | CP2 ; X-3, X-12 |
| **[final]** doublon | refusé par `idx_base_postes_rapprochement`, UNIQUE sur `(pro_id, (md5(cle_rapprochement)::uuid), (unite collate "C"), fourniture_non_comprise)` : une phrase PRESQUE identique est un doublon | CP6 ; X-12 |
| une variante reconnue | le poste garde SA phrase ; « Ce poste existe déjà », **[final]** dans le bloc de la carte comme dans la feuille | T16 ; CE3-6 |
| lien au devis d'origine | clé COMPOSÉE `(devis_origine_id, pro_id)` vers `devis (id, pro_id)`, `on delete set null (devis_origine_id)` ; posé seulement si le devis est DÉJÀ en base à l'appui | MESURÉ R3 ; CE10 |
| écriture tardive | pas d'horloge : modifier et retirer se font **sous condition** sur `modifie_le` ; tient aussi à deux sessions | MESURÉ R4, V-tardive |
| identifiant et entreprise d'un poste | figés par le déclencheur en modification | MESURÉ V-CB9 |
| **[final]** plafond | 1 000 postes par entreprise, `OP018`, compté sous verrou consultatif **pour sa propre entreprise seulement** (et sans jeton), et égal à la limite de lecture de l'API | MESURÉ R9, X-13, X-14 ; CB1, CP1 |
| la référence | au-dessus de la rangée quantité/prix, dès que la clé de la ligne correspond à un poste dont le prix est fixé ; **[final]** elle nomme le poste si la phrase diffère | CE1 ; CE3-7 ; TRANCHÉ ICI (§4.5) |
| l'écart | même clé, prix unitaires seulement, dès le premier centime, jamais sur une ligne offerte ; la phrase du propriétaire, et sa réponse « Changer ma référence » | PROP:99-103 ; PLAN:3121 ; CE7, CE8 |
| l'écart dans la liste du devis | **non** : la référence ne vit que dans la ligne ouverte | réponse 4, Q3 a |
| **[final]** la suggestion | une seule liste de trois, **un seul tri pour les deux sources** (pertinence, puis la base avant la mémoire, puis le dernier usage) ; une proposition par clé ; la recherche du lot 1 PLUS les pluriels de mots entiers ; aucun titre de groupe ; un détail d'UNE ligne | réponse 2 ; T12, T19 ; CE3-1, CE3-4, CE3-10 |
| **[final]** ce qu'un appui recopie | le prix de référence ; à défaut, le dernier prix UTILISABLE de même clé ; à défaut, rien (le prix tapé reste) | T10 ; CE3-2, CE3-3 |
| ajouter | une feuille du bas, phrase NON modifiable, avertissement si elle nomme le client ; seulement sur un poste ou une option ; jamais sur une phrase sans clé | PLAN:3121 ; CE6 ; CD3 ; T17 |
| prix proposé à l'ajout | le prix de la ligne, modifiable avant de valider | réponse 4, Q2 a |
| **[final]** « existe déjà » dans la feuille | la MÊME feuille change le prix du poste existant ; jamais une seconde `Modal` | CE3-5, CE3-8 |
| l'origine affichée | « Ajouté le <date du poste> depuis un de vos devis » ; aucune lecture de l'objet d'un devis | CD7 ; CE16 |
| changer sa référence | depuis la carte (feuille posée par-dessus) ou depuis la page | CE7 |
| la page | deux portes (« Mes devis », « Mon profil »), une fonction `ouvrirMaBase()` ; **aucune porte qui QUITTE la saisie** ; aucun bouton « Nouveau poste » | CE20 ; réponse 4, Q4 a |
| taux par défaut | aucun | PLAN:3552 (« rien de pré-coché sur la première ligne ») |
| colonne métier | **aucune** | réponse 4, Q1 a |

---

## 1. Les décisions, les contradictions, les réponses

### 1.1 Ce que le plan et le propriétaire ont déjà décidé

| décision | source | ce qu'elle impose ici |
|---|---|---|
| la base de postes naît au lot P, juste après le lot 1, et ne s'appelle jamais « lot 1 bis » | PLAN:3116 | le nom du lot, des commits, de la section |
| une table privée, la phrase mot pour mot, l'unité, la fourniture, le prix de référence (`null` n'est pas `0`), un appui « Ajouter à ma base », deux lecteurs (suggestion, écart) | PLAN:3121 | §2.2, §3, §4 |
| l'écart : « votre prix de référence est 50 €/m², vous mettez 70 € — c'est voulu ? », une phrase discrète, pas une fenêtre ; « que l'écart soit une décision, plus un oubli » | PROP:99-103 | §3.2, §4.5 |
| un poste nouveau ne s'ajoute jamais tout seul | PLAN:3124 ; PROP:309-312 | aucun déclencheur, aucune fonction n'écrit `base_postes` hors de l'appui |
| privée : `est_mon_entreprise()`, rien pour `anon`, aucune lecture par l'administration, dans `mes_donnees()`, part avec le compte, lien d'origine nullable en `on delete set null` | PLAN:3129-3130 | §2.5, §2.7, §2.10, §2.12 |
| un taux par défaut, « si un poste en porte un jour », ne s'applique qu'à l'ajout d'une ligne | PLAN:3131 | rien au lot P (T4) |
| les sept unités, « ml » jamais | PLAN:3553 ; schema:11751-11753 | `base_poste_unite_check` |
| au régime réel, le taux se choisit ligne par ligne, rien de pré-coché | PLAN:3552 | aucune suggestion ne pose un taux |
| quatre questions au plus par tour, celles qui débloquent le travail d'abord | PLAN:3231 | **[v3]** posées, et répondues le 23/10 : §1.5 |
| **[v3]** reconnaître une phrase à un s près, une proposition par phrase, « ce poste existe déjà » | réponse 2 du 23/10 | §3.0, §3.1, §3.2, §4.6 |
| **[v3]** l'entrée dans la base d'un appui ; la mémoire retient tout toute seule | réponse 3 du 23/10 | §4.6 ; C3 résolue |
| aucune action IA dans ce module | PLAN:46 ; CLAUDE.md « Ne plus ajouter d'action IA à la main » | §0.2 |

Une précision à corriger dans le plan à l'étape 10 (CD10) : PLAN:3130 dit
« elle ne contient aucune donnée de client ». Juste pour les COLONNES ; la
phrase est le texte libre de l'artisan, qui peut en nommer un. La phrase
devient « aucune colonne de client ; la phrase peut en nommer un, et l'écran
le signale ».

### 1.2 Ce qu'il faut DIRE au propriétaire (ce n'est pas une question)

La première chose « à dire » de la v2 — « la base, c'est vous qui la
remplissez » — est devenue SA décision (réponse 3, « D'un appui ») : elle
n'est plus à dire, elle est à tenir. **[final]** Restent huit choses, en mots
simples, à lui écrire en livrant le lot ; trois d'entre elles disaient faux
ou manquaient en v3 (CE3-17), et c'est corrigé ici.

**Ce qu'Opus reconnaît, et ce qu'il ne reconnaît pas.** C'est sa demande, et
la limite doit être dite avec elle :

> Opus reconnaît comme la même phrase « Chape sèche avant carrelage collé »,
> « chapes seches avant carrelage colle » et « CHAPE SÈCHE, AVANT CARRELAGE
> COLLÉ. ». Il ne reconnaît pas « Création d'une chape sèche pour future pose
> de carrelage » : c'est une autre façon de dire, et c'est le travail de
> l'agent, plus tard. Il ne reconnaît pas non plus « BA13 » et « BA 13 »
> (l'espace coupe le mot en deux), ni « travaux » et « travail » (le pluriel
> en « -aux » n'est pas un s ajouté).
>
> **[final]** Et les signes qui portent un sens ne sont jamais effacés :
> « Déplacement < 20 km » et « Déplacement > 20 km », « 50 € » et « 50 % »,
> « R+1 » et « R-1 » restent des postes différents ; « Plancher bas » n'est
> jamais confondu avec « Plancher BA » (béton armé). Le signe × compte comme
> la lettre x : « 60×60 » et « 60x60 », c'est pareil.

**[final] Une phrase écrite à plusieurs prix ne fait qu'UNE proposition**
(réponse 2) : au prix le plus récent. Si vous avez écrit un autre prix, il
est noté à côté, en petit, dans la même ligne (« aussi 45,00 € ») ; s'il y en
a plusieurs, leur nombre (« +2 prix »). Un appui reprend le plus récent ; pour
un autre, on le tape. Une ligne où le prix n'est pas encore écrit ne compte
pas : le prix proposé est toujours un prix que vous avez vraiment écrit. C'est
un changement du lot 1, qui faisait une rangée par prix.

**[final] La proposition porte la phrase écrite le plus RÉCEMMENT** (CE3-9) :
si vous tapez vite une phrase sans accents, c'est elle qu'Opus vous proposera
ensuite, à la place de l'ancienne. Pour fixer la bonne orthographe une fois
pour toutes, ajoutez-la à votre base : la base passe toujours avant. (Une
autre règle est possible ; c'est la question B du §1.7.)

**Quand votre base a le poste, la mémoire se tait pour cette phrase** : vous
voyez votre prix de référence, pas le dernier prix écrit. **[final]** Si ce
poste n'a pas encore de prix de référence, Opus vous propose quand même le
dernier prix que vous avez écrit pour lui, en le disant (« sans réf. ·
dernier : 45,00 € ») (CE3-3). **[final]** Et si un ANCIEN devis porte un autre
prix que votre référence, vous le verrez en rouvrant cette ancienne ligne :
elle vous dira l'écart. La nouvelle ligne, elle, reprend votre référence
(CE3-17 ; la v3 disait « en ouvrant la ligne », ce qui laissait croire à la
nouvelle).

**Votre prix de référence s'affiche dans la ligne ouverte en grand** (CD11 ;
réponse 4, Q3 a) : si vous montrez votre téléphone à un client pendant que
vous préparez SON devis, la ligne ouverte le montre, au-dessus du prix que
vous lui faites. La liste du devis, elle, ne le montre jamais.

**[final] Trois lettres ne suffisent pas toujours** (CE3-1, CE3-17) : « Les »,
« Des », « Sas » cherchent exactement ce que vous tapez, comme aujourd'hui. Opus
ne retire le s que d'un mot ENTIER : « Dalles » trouve « dalle », « Seuils »
trouve « Seuil », mais « Sas » ne devient jamais « sa » — sinon il vous
proposerait tout.

Une septième, sans réponse attendue : **le plafond est de 1 000 postes**
(§2.4). La borne est voulue ; le nombre est à lui, comme celui d'`OP017`
(AF:1983-1991). Le changer se fait en une ligne **et une vérification** : la
lecture de l'application ne peut pas dépasser la limite de lecture de l'API
(CB1, §4.2).

**Deux rapprochements à savoir, et qu'on ne corrige pas** (W-5) : au
forfait, « Dépose fenêtre » et « Dépose fenêtres » font le même poste, alors
que les deux forfaits ne couvrent peut-être pas le même nombre de fenêtres —
**[final]** la ligne de référence le dira (« … pour « Dépose fenêtre » … »),
et vous pourrez changer un mot de la ligne pour qu'elle ne soit plus
rapprochée ; et quelques mots que seul un accent distingue se confondent
(« côte » et « côté », « tâche » et « tache »).

### 1.3 Les contradictions, tranchées

| | ce qui se contredit | tranché |
|---|---|---|
| C1 | « pas de table de prix » reste écrit à PLAN:2033-2034, PLAN:2419 et **PLAN:2506** ; la liste des lignes à corriger (PLAN:3293) cite les deux premières, **pas la troisième** | la décision est REVUE (PLAN:3107-3115). Les trois lignes se corrigent à l'étape 10, la troisième comprise |
| C2 | le module 7 garde « Fournisseurs et prix » (AF:1665) ; la base de postes naît au module devis | la base de postes porte des prix de VENTE de l'artisan ; le module 7 portera les prix d'ACHAT (CDC:294-295). Les deux ne se mélangent jamais |
| C3 | PROP:81-82 et PROP:276-280 (« remplie toute seule ») contre PROP:309-312 et PLAN:3124 | **[v3] tranché par le propriétaire le 23/10** (réponse 3) : d'un appui ; la mémoire continue de tout retenir toute seule |
| C4 | PROP:292 parle de lignes « émises » et d'une table pour la mémoire | le lot 1 a tranché : la mémoire relit `devis_lignes`, brouillons compris, sans table (C1:310, api:3019-3031). « La table » de PROP §5 est la base de postes |
| C5 | « le prix de référence ne se déduit d'aucune ligne » (PLAN:3112) contre « le prix vient de ses devis, avec sa source » (PROP:307-308) | les deux tiennent si la feuille d'ajout PROPOSE le prix de la ligne et que l'artisan le confirme ou le change : **[v3] décidé, Q2 (a)** (réponse 4) |
| C6 | « 50 €/m², devis 087 » (PLAN:3130) alors qu'aucun devis n'a de numéro avant le lot 2 | **v2** : l'origine d'un poste se dit « Ajouté le <date du poste> depuis un de vos devis », sans lire le devis (CD7, CE16). Le numéro viendra avec le lot 2. Le lot P ne dépend donc plus du point 1 de §1.6 |
| C7 | « date, région, catégorie de métier » sur un poste (AF:2340-2344) contre « aucune colonne sans lecteur » (PLAN:46-47) | la DATE entre (le prix a une date, lue à l'écran) ; la RÉGION n'entre pas (aucun lecteur, et le poste n'a pas de lieu) ; le MÉTIER n'entre pas (**[v3]** Q1 (a), réponse 4) |
| C8 | un taux par défaut sur un poste (PLAN:1070, PLAN:3131) contre « rien de pré-coché » (PLAN:3552) | aucun taux au lot P (T4) |
| C9 | « suggestions désactivables » (CDC:109-110, qui vise les suggestions de l'IA) contre un écart sans réglage | l'écart se tait poste par poste : vider le prix de référence l'éteint, et la page le dit une fois. Aucun réglage général (T6) |
| C10 | le lien vers un devis précis (PLAN:3130) contre « un prix de référence détaché de tout devis ne concerne plus aucun client » (DON:289-291, analyse non vérifiée) | sans effet au lot P (base personnelle). **Pour l'avenir, à écrire dans A-FAIRE à l'étape 10 (CD5)** : (1) aucun poste ne rejoint une base commune sans la case à part, non cochée (DON:722-725) ; ce qui a été rangé sous la version du lot P n'y entre que par ce geste (DON:650-659) ; (2) `devis_origine_id` ne part jamais ; (3) un prix de référence est un prix FUTUR (point 414, DON:797-799) : jamais versable tel quel ; (4) tant que le lien existe, c'est le prix d'un devis précis, donc d'un client : à poser à l'avocat avec la mise en commun ; (5) une phrase peut venir d'une bibliothèque sous licence (CPI L342-1) : à régler avant toute mise en commun ; (6) aucune « actualisation » uniforme des références par Opus (point 397, DON:808-811) |
| C11 | « entreprise fermée » encore écrit à DON:918-922, AF:1697, PLAN:3365, alors que le propriétaire a une société active depuis le 20/10 (CLAUDE.md) | sans effet sur le lot P ; corrigé à l'étape 10 |
| C12 | `verifier-legal` interdit qu'une fonction Edge nomme une table de prix (`scripts/verifier-legal.mjs:945-953`), alors que l'agent futur lira la base de postes (PLAN:3133) | la base de postes ENTRE dans cette interdiction au lot P ; la règle se réconcilie le jour de l'agent, avec sa raison |
| C13 | une règle à UN endroit (AF:2108-2118) contre une huitième copie de la classe de blancs | recopiée — **[v3]** en `chr(n)` — et COMPARÉE par `verifier-devis` avec les sept autres (§2.4) ; la réunion reste au lot S, avec les cinq blancs hors classe de CB4 (que la CLÉ, elle, traite déjà en blancs, §3.0.2) |
| C14 | **[v3]** « une suggestion par PRIX » (le lot 1 : `scripts/verifier-devis.mjs:613-628`, demo `:991-995`) contre « ces variantes ne font qu'UNE proposition » et « pas trop de propositions » (réponse 2) | une proposition par CLÉ, qui porte ses trois prix au plus (T19) ; trois vérifications du lot 1 réécrites, avec leur raison (§3.1) |
| C15 | **[v3]** T1 et CB3 de la v2 (clé exacte ; la clé normalisée écartée pour ses tables Unicode) contre la réponse 2 | T1 révisé ; l'objection de CB3 neutralisée PAR CONSTRUCTION — aucune table Unicode, aucune collation — et MESURÉE (§3.0.5) |
| C16 | **[final]** « la phrase la plus récente » (réponse 2, non contestée) contre une faute de frappe récente qui l'emporte sur cinquante phrases justes (CE3-9) | la règle dite est tenue ; sa conséquence lui est DITE avec son remède (« Ajouter à ma base » fixe la phrase) ; l'autre règle lui est proposée (§1.7, question B) |
| C17 | **[final]** « ces variantes ne font qu'UNE proposition » contre « 10cm » / « 10 cm » et « 60x60 » / « 60 x 60 », des variantes fréquentes que la règle dite ne couvre pas (CP10) | la règle dite est tenue (« BA13 » / « BA 13 » distincts, dit en §1.2) ; l'extension lui est proposée (§1.7, question A) |

### 1.4 Ce que ce cahier tranche lui-même (TRANCHÉ ICI)

- **T1. [final] La clé d'un poste est (clé de rapprochement de la phrase,
  unité, fourniture non comprise)**, et la mémoire du lot 1 passe à la MÊME
  clé (`cleDeLigne`, §3.1). **La phrase reste rangée mot pour mot** ; la clé
  ne sert qu'à RAPPROCHER : regrouper les propositions, reconnaître un poste
  existant, faire correspondre une ligne et un poste pour la référence et
  l'écart. La v2 avait tranché la clé EXACTE ; la réponse 2 du propriétaire
  l'a renversée, et l'objection de CB3 (des tables Unicode et des collations
  qui diffèrent entre PostgreSQL et Hermes) est **neutralisée par
  construction** : la règle (§3.0) n'appelle aucune table Unicode ni aucune
  collation ; elle n'est faite que d'une table explicite, de classes ASCII et
  d'une exception écrite, deux fois depuis une seule source, et ses deux
  écritures rendent la même empreinte sur chaque point de code d'Unicode
  (X-9), le même fuzz de 300 050 chaînes sous cinq réglages (X-10), et les
  mêmes 175 cas écrits à la main (X-8). **[final] Ce que la version finale y
  ajoute** : une garde de longueur (CP1), les signes de sens changés en mots
  et l'exception « bas » (CP2), les invisibles supprimés (CP5), aucune barre
  oblique inverse dans la fonction (CP3), et un invariant asserté (CP4).
  **Conséquence voulue** : « Chape sèche », « chape sèche », un double
  espace, la forme décomposée, une espace insécable ou un U+200B au milieu
  font **UN poste** (X-12, F1), là où la v2 en faisait cinq (V-CB3).
- **T2. Le lien d'origine est une clé composée, sans fonction** (§2.7). Il
  n'est posé que si `devisEnBase()` est **déjà** vrai au moment de l'appui —
  aucune attente de la file (CE10) ; une erreur de clé étrangère sur ce lien
  relance l'ajout UNE fois sans le lien : l'origine n'est qu'une
  information, et la cascade l'aurait vidée de toute façon.
- **T3. Pas d'horloge `generation`** : une condition sur `modifie_le` (§2.9).
- **T4. Aucun taux de TVA sur un poste.** La TVA dépend du chantier
  (logement de plus de deux ans, nature des travaux, client), pas du poste ;
  un poste « 10 % » réutilisé en neuf donnerait une TVA fausse sans un mot ;
  et le propriétaire a répondu « rien de pré-coché » (PLAN:3552). La mémoire
  du lot 1 ne recopie déjà pas le taux (devis.js:1090-1101).
- **T5. Un poste porte la main-d'œuvre** (absente de la liste de PLAN:3121).
  Son lecteur : la recopie dans la ligne. Deux façons d'arriver au même
  écran doivent faire le même travail (CLAUDE.md, `changerOngletDecouvrir`).
- **T6. Aucun réglage pour éteindre l'écart**, aucune réponse « oui, c'est
  voulu » retenue sur la ligne (ce serait une colonne de `devis_lignes`, qui
  se figerait au lot 2). La question revient tant que l'écart existe ; elle
  a sa réponse sur place (T13).
- **T7. Pas d'historique des prix de référence** : une valeur et sa date. Ce
  que l'artisan a pratiqué se lit déjà dans la mémoire (devis.js:1046-1084).
- **T8. Ce qui peut entrer dans la base** : une ligne `poste` ou `option`
  (comme la mémoire, api:3025), jamais un titre ni une réserve. Une ligne
  OFFERTE peut entrer : on propose sa VALEUR (si elle en a une), jamais le
  drapeau « Offert » (devis.js:1083-1088). L'écart se tait sur une ligne
  offerte : offrir est un écart voulu.
- **T9. Le prix de référence est dans la convention de la LIGNE** : hors
  taxes au régime réel, sans TVA en franchise (`CarteLigne.js:126-130`),
  **jamais TTC**, et jamais comparé au taux horaire TTC du lot T. **Un
  changement de régime se DIT** (CD13) : une référence fixée avant
  `regime_tva_declare_le` (posée par la base au changement de régime,
  schema:10193-10197) s'affiche avec « fixé le …, avant la déclaration de
  votre régime de TVA actuel : vérifiez-le. », et la question « c'est
  voulu ? » cède la place à ce constat. Aucune colonne nouvelle.
- **T10. Une suggestion ne vide jamais un prix déjà tapé.** Un poste sans
  prix de référence **[final] ni dernier prix écrit de même clé** recopie la
  phrase, l'unité, la fourniture et la main-d'œuvre, et laisse le prix tel
  quel ; **[final]** s'il a un dernier prix utilisable, c'est lui qu'un appui
  écrit (CE3-3, T19). MESURÉ par la lecture « app » :
  aujourd'hui une suggestion à prix `null` écrit `""` dans le champ
  (`CarteLigne.js:195`). La règle vaut pour les deux sources, et elle vit
  dans une fonction pure, `prixAEcrire()`, que le contrôle fait tourner
  (CE21).
- **T11. Un changement d'unité par une suggestion se DIT.** Mesuré par la
  lecture « métier » : une suggestion au forfait choisie sur une ligne de
  27 m² donne 27 × 900 € = 24 300 €, et `validerLigne` accepte. Une phrase
  discrète sous les unités (« L'unité est passée de m² à forfait : la
  quantité 27 est restée, vérifiez-la. »), jamais un refus ; elle s'efface
  dès que la quantité est retouchée ou qu'une unité est rechoisie (CE16).
- **T12. [final, révisé] La recherche se fait par MOTS, dans n'importe quel
  ordre, pour les deux sources** (`correspondALaRecherche`, §3.0.6) : un mot
  tapé correspond s'il est CONTENU dans la phrase à plat — c'est exactement
  la recherche du lot 1, donc rien de ce qu'on trouve aujourd'hui n'est perdu
  — **ou** si, privé de son pluriel, il est un **MOT ENTIER** de la clé de la
  phrase, pourvu que cette clé ait trois lettres au moins ou que le texte
  tapé ait plusieurs mots. « seche chape » trouve « Chape sèche avant
  carrelage collé », « Dalles » trouve « Dalle béton… », « beton » trouve
  « béton », « Évacuation des » trouve « Evacuation de gravats » ; « Les »,
  « Sas », « Mes » ne trouvent que ce qui CONTIENT « les », « sas », « mes »,
  comme aujourd'hui. **Pourquoi pas la sous-chaîne de clé de la v3** (CE3-1,
  MESURÉ X-6) : « Les » devenait `le`, présent dans presque tout — trois
  propositions sans rapport. **Pourquoi pas « commence un mot »** (la
  correction proposée par CE3-1) : MESURÉ sur son propre corpus, « sous »
  trouvait encore « soufflage » et « Cons » « contre-cloison » (`regle2.out`).
  **Résultat MESURÉ X-18** : 757 textes tapés contre 70 désignations, 52 990
  comparaisons, **0 perte, 4 trouvailles de plus, toutes justes** (« murs » →
  « mur » trois fois, « carrelées » → « carrelée »). Le seuil de trois
  caractères avant de chercher reste celui d'aujourd'hui, compté sur le texte
  TAPÉ (`ChampDesignation.js:49`, `:103`).
- **T13. La question de l'écart a sa réponse, et pas de seuil** (la Q3 de
  la v1). Dès le premier centime : la phrase n'apparaît que dans la carte
  ouverte d'UNE ligne, donc elle ne devient pas le bruit d'un devis de
  cinquante lignes, et le glissement lent (50, puis 52, puis 55 €) est
  justement ce que le propriétaire veut voir (PROP:88-89). La réponse :
  « Changer ma référence », qui ouvre la feuille du poste pré-remplie avec
  le prix de la ligne (CE7). Une décision se VOIT avant d'être rangée : un
  appui ne change pas la référence sans la feuille.
- **T14. La phrase d'un poste est figée dans la feuille d'ajout, et
  corrigeable dans la page** (CE6). Depuis la carte, la feuille du poste ne
  la corrige pas non plus : une phrase corrigée détacherait le poste de la
  ligne ouverte. Dans la page, la correction reste. **[v3]** Sa conséquence se
  calcule au lieu de s'écrire toujours : si la clé de la nouvelle phrase est
  celle de l'ancienne (un accent, une majuscule, un s), rien n'est dit — les
  lignes déjà écrites restent reconnues ; si elle change, la feuille dit
  « Les lignes déjà écrites avec l'ancienne phrase ne seront plus reconnues
  comme ce poste. » ; si elle est celle d'un AUTRE poste, la feuille refuse
  avant d'envoyer : « Un autre poste de votre base porte presque la même
  phrase : « … ». » (la base refuserait de toute façon, 23505).
- **T15. Une seule lecture de la base, légère, sans plongeon dans `devis`**
  (CB2, CD7) : la saisie et la page lisent les mêmes dix colonnes. **[v3]**
  `cle_rapprochement` n'en fait pas partie (T18).
- **T16. [v3] Une variante reconnue ne remplace JAMAIS la phrase du poste.**
  Quand l'artisan tente d'ajouter « chapes seches avant carrelage colle » et
  que sa base a « Chape sèche avant carrelage collé », le poste garde sa
  phrase, et la ligne garde la sienne (c'est elle qui ira au client). Trois
  raisons : la phrase du poste est une DÉCISION de l'artisan (choisie à
  l'ajout, peut-être corrigée dans la page), la remplacer par la dernière
  variante tapée la ferait dériver au gré des fautes de frappe (une phrase
  sans accents remplacerait une phrase juste) ; la clé ne change pas par
  définition, donc il n'y a rien à gagner pour la reconnaissance ; et un
  choix de moins dans la feuille, c'est la réponse 2 (« il ne faut pas qu'il
  y ait trop de propositions »). Pour changer la phrase : la page (T14).
- **T17. [final] Une phrase dont la clé est VIDE ne fait pas un poste** —
  rien que des blancs, de la ponctuation, des marques combinantes ou des
  caractères invisibles (« — », « … », une espace idéographique, un U+200B,
  un sélecteur de variante, un remplisseur hangûl). La base la refuse par son
  nom (`base_poste_rapprochement_check`, §2.3), l'écran ne propose pas
  « Ajouter à ma base » (`etatDansLaBase` = `'sans_objet'`), et la mémoire ne
  la propose jamais. **Ce qui fait un poste, et c'est dit** (CP5) : un émoji
  seul, une flèche, une lettre grecque — leur clé n'est pas vide. Une telle
  phrase reste permise sur une LIGNE de devis (le lot 1 l'accepte) : on ne
  change pas `devis_lignes`.
- **T18. [v3] La clé vit en base dans une colonne GÉNÉRÉE, que l'application
  ne lit pas.** Générée et non posée par le déclencheur : la base refuse
  qu'un client l'écrive (428C9, MESURÉ W-6), au lieu de l'écraser en silence ;
  la propriété est tenue par le catalogue (`attgenerated = 's'`), pas par un
  corps de fonction. Ni dans une expression d'index seule : l'essai et
  l'export la lisent. Et l'application ne la lit pas : elle calcule la même
  par son miroir pour les lignes, qu'elle doit de toute façon clé-er avant
  qu'elles soient en base ; la lire alourdirait chaque lecture d'un texte
  aussi long que la phrase. Son lecteur, c'est l'index unique — l'exception
  nommée du contrôle F (§6.1).
- **T19. [final] Une proposition par clé, la base masque la mémoire, et UN
  seul tri.** La mémoire regroupe ses lignes par la clé complète
  (`cleDeLigne`) : une proposition par groupe, titrée par la phrase de la
  ligne la plus RÉCENTE du groupe (dit au propriétaire, §1.2 ; question B du
  §1.7), qui porte **les trois prix UTILISABLES distincts les plus récents**
  — entier > 0, la valeur d'une ligne offerte comprise ; **une ligne sans
  prix ne compte pas** (CE3-2) ; aucune moyenne, aucun minimum, aucun
  maximum. Un appui recopie le plus récent d'entre eux. Un poste de la base
  masque toute proposition de la mémoire de même clé, quel que soit son prix ;
  **et quand ce poste n'a pas de prix de référence, il porte le dernier prix
  utilisable de la mémoire de même clé, et un appui le recopie** (CE3-3).
  Deux postes de même clé JavaScript (impossible si les deux écritures
  concordent) n'en font qu'une proposition, le plus récemment modifié.
  **Le tri, unique pour les deux sources** (CE3-4) : (1) le degré —
  4, la phrase à plat commence par le texte tapé à plat ; 3, chaque mot tapé
  commence un mot de la phrase ; 2, chaque mot tapé est contenu ; 1, trouvée
  par le pluriel seulement ; (2) à degré égal, la base avant la mémoire — son
  prix est une décision ; (3) le **dernier usage** : la date de la ligne de
  mémoire la plus récente de même clé (déjà lue, aucune requête de plus ;
  sans usage, en dernier) ; (4) la phrase à plat ; (5) l'identifiant.
  MESURÉ X-17 : « Pos » → trois « Pose », jamais « Dépose » en tête ; quatre
  « Chape » dans la base → celle servie il y a une heure en tête ; un poste
  trouvé par le seul pluriel ne passe plus devant « Pose de carrelage… ».
- **T20. [final] Un étranger ne touche jamais le verrou d'un autre** (CP1).
  Le déclencheur ne prend le verrou consultatif et ne compte le plafond que
  si l'écriture vient de l'éditeur SQL ou d'une fonction sans jeton
  (`auth.uid()` vide) ou de l'entreprise elle-même
  (`est_mon_entreprise(new.pro_id)`). Une écriture au nom d'un autre est
  refusée par la politique juste après (42501, inchangé) ; elle ne compte
  rien et n'attend personne. `auth.uid()` n'est lu QUE dans la branche
  d'insertion, et c'est sans danger : une cascade n'insère jamais dans
  `base_postes` (la raison de « ne jamais lire `auth.uid()` », §2.4, ne vaut
  que pour la modification). MESURÉ X-13 : A n'attend plus (14 ms contre
  8,07 s) ; avec la condition retirée et 40 écritures étrangères en
  parallèle, A attend 298 ms.
- **T21. [final] `sous` compare la forme VISIBLE des deux phrases** (CE3-16,
  adapté) : blancs ramenés à une espace, caractères invisibles et de format
  retirés (`formeVisible`, §3.2). Une espace insécable ou un U+200B ne font
  plus dire « sous « … » » sous une ligne qui s'écrit pareil (X-17). **Ce qui
  reste, et c'est dit** : une forme DÉCOMPOSÉE (« e » + accent combinant,
  copiée d'un PDF) affiche encore « sous » — la recomposer demanderait une
  seconde table, pour un cas rare (un clavier d'iPhone tape en forme
  composée, §3.0.7).
- **T22. [final] Une seule feuille à la fois, et « existe déjà » se règle
  DANS la feuille d'ajout** (CE3-5, CE3-8). L'état des feuilles de la saisie
  est UNE valeur (`feuille` : `null`, `{ type: 'ajout', … }` ou
  `{ type: 'poste', … }`), jamais deux booléens — deux `Modal` empilées
  laissent sur iPhone un voile invisible qui avale les touches (CLAUDE.md
  l.2903-2906 ; une `FeuilleBas` est une `Modal`,
  `src/components/FeuilleBas.js:69` ; iOS présente chaque `Modal` par
  `presentViewController`,
  `node_modules/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.mm:150-156`).
  La feuille d'ajout n'importe pas `FeuillePoste` ; dans son état « existe
  déjà », elle change elle-même le prix de référence du poste existant
  (`modifierPoste`, sous condition). La carte, qui n'est PAS une `Modal`
  (`src/components/CarteLigne.js:11`, `:140`), ouvre `FeuillePoste`
  par-dessus elle : une seule `Modal`.
- **T23. [final] Le détail d'une proposition tient sur UNE ligne** (CE3-10,
  CE3-11). Mémoire : le prix recopié et l'unité, « (offert) » s'il y a lieu,
  « fourniture non comprise » s'il y a lieu, puis — aucun autre prix :
  l'origine du lot 1 ; un seul autre prix et pas de « fourniture non
  comprise » : « aussi 45,00 € » ; sinon « +k prix ». Base : « 45,00 € / m²
  · réf. du 14/10/2026 », « sans réf. · dernier : 45,00 € / h », ou « votre
  base, sans prix de référence ». `numberOfLines={1}` en garde : si quelque
  chose est coupé, c'est l'historique ou l'origine, jamais « fourniture non
  comprise ». Le mot « avant » disparaît (il se lisait mal sous « Chape
  sèche AVANT carrelage collé », et comme « prix avant réduction »). MESURÉ
  X-20 au navigateur, à 320 et 390 points : toutes ces formes tiennent sur une
  ligne, sauf le pire cas (un montant à cinq chiffres, la fourniture et
  « +2 prix »), que la garde coupe.

### 1.5 [v3] Les quatre questions de la v2 sont des DÉCISIONS

Posées le 23/10 avec leur option par défaut, « dis-moi si l'une ne te va
pas » ; aucune objection (réponse 4). Chacune garde ici la raison qui la
recommandait, parce que c'est elle qu'on relira le jour où l'on voudra la
changer.

| | décision | ce qu'elle impose | pourquoi, et ce qui la rouvrirait |
|---|---|---|---|
| **Q1** | **aucun métier sur un poste** | pas de colonne `metier`, pas de `base_poste_metier_check`, aucun filtre par métier dans « Ma base » ; PLAN:3150-3153 et AF:1720-1721 sont fermés à l'étape 10 | pendant la frappe il n'y a rien à filtrer, et la recherche par mots suffit pour quelques dizaines de postes. Si un jour Opus en a besoin, il le déduira des métiers de la fiche — et une colonne s'ajoute alors sans toucher la base |
| **Q2** | **la feuille d'ajout PROPOSE le prix de la ligne**, modifiable avant de valider | `posteDepuisLaLigne()` rend `prixPropose` (le prix de la ligne s'il est > 0, la VALEUR d'une ligne offerte, sinon rien) ; dessous : « C'est le prix que vous voulez retrouver sur vos prochains devis ? Corrigez-le si ce chantier était particulier. Laissez vide pour le fixer plus tard. » | une décision se voit avant d'être rangée ; l'écart marche dès le premier ajout. C5 est résolue : « le prix vient de ses devis » (PROP:307-308) et « il ne se déduit d'aucune ligne » (PLAN:3112) tiennent ensemble, parce que l'artisan le CONFIRME |
| **Q3** | **la référence ne s'affiche que dans la ligne ouverte en grand**, jamais dans la liste du devis | `RangeeLigne` (SaisieDevisScreen.js:109-148) ne reçoit aucune valeur de plus ; le sabotage 38 est INVERSÉ : une référence passée à la rangée est refusée (§6.3) | la liste est l'écran qu'on montre à un client. Ce qu'on perd, et c'est dit : un écart décidé à la frappe, puis « Poste suivant », ne se revoit qu'en rouvrant la ligne (CE1). L'ajouter plus tard ne coûterait qu'une valeur de plus dans la rangée |
| **Q4** | **un poste se crée depuis une ligne de devis**, pas dans « Ma base » | aucun bouton « Nouveau poste » ; `ligneDescriptive` reste non modifiable dans les feuilles ; la lettre du plan (PLAN:3121) | le lot reste petit ; chaque poste a été chiffré une fois. Un bouton s'ajoutera sans toucher la base (`devis_origine_id` est déjà facultatif) |

**Et la question qu'on aurait pu poser, et qu'on ne pose pas** : « une
proposition par phrase, ou une par prix ? ». La réponse 2 la tranche dans ses
propres mots (« il ne faut pas qu'il y ait trop de propositions ») ; on la lui
DIT (§1.2), on ne la lui redemande pas.

### 1.6 Les points du lot 1 à confirmer, à part

Ce ne sont pas des questions du lot P ; ils restent ouverts et se posent en
voyant l'écran (AF:1954-2049).

« À trancher avec vous, en voyant l'écran » (AF:1954-1991) :

1. **« L'origine d'une suggestion de prix se nomme par sa DATE »** quand le
   devis vient d'une demande ou d'une urgence, par quatre mots de son objet
   sinon (AF:1959-1967). **Ne touche plus le lot P** depuis la v2 (C6).
2. **« Une ligne ouverte en grand montre deux retours et le titre de la
   pièce deux fois »** (AF:1968-1973). Le lot P ajoute une feuille posée
   par-dessus cette carte : à regarder ensemble.
3. **« "Choisir dans mon carnet" passe sur deux lignes »** à 320 points
   (AF:1974-1977).
4. **« En revenant d'un devis ouvert depuis "Pour moi", la pastille revient
   à "À traiter" »** — un défaut relevé, pas un choix (AF:1978-1982).
5. **« Le plafond de 20 devis par demande, et de 20 par urgence »**
   (`OP017`) : la borne est voulue, le nombre est à lui (AF:1983-1991).

Ailleurs, et aussi à lui : **« Une rangée non enregistrée montre sa valeur
LOCALE »** (AF:2230-2234) ; **« Un blocage ne cache pas à l'artisan une
demande déjà reçue »** (AF:2099-2107, lot S).

Les questions de l'iPhone restées sans réponse une par une (AF:2017-2049 ;
« tout fonctionne » du 23/10 n'y répond pas une à une) — **quatre touchent
l'écran du lot P** et seront reposées avec lui (§7.6) :

- **« Combien de touches pour la deuxième chape ? »** — la base passe en
  tête des suggestions ;
- **« Quand le pavé numérique est ouvert, voyez-vous les unités et le
  taux ? »** — la ligne de référence s'ajoute juste au-dessus du prix ;
- **« Le correcteur a-t-il changé un mot de métier ? »** — la phrase d'un
  poste est rangée mot pour mot ;
- **VoiceOver sur la carte** (« une ligne ouverte en grand cache-t-elle bien
  le reste de l'écran ? »).

Les autres (la virgule de « 2,5 », le total caché clavier ouvert, la ligne
ouverte en grand, les pastilles au doigt, les chiffres alignés, « Nouveau
client » depuis le devis, le pavé du code postal, la bande « pas
enregistré » avec un code postal de quatre chiffres) restent posées par le
lot 1, telles qu'écrites.

### 1.7 [final] Les deux questions qui restent — non bloquantes, avec leur défaut

Chacune a un défaut, qui est ce qu'on lui a déjà dit le 23/10 ; le lot se
construit avec ce défaut. **À poser en livrant le cahier, et au plus tard
avant l'étape 9 (la migration)** : avant, changer la règle coûte une ligne
du générateur et quelques cas ; après, c'est le contrat de §3.0.8 (une
migration qui réécrit la table).

| | la question, en mots simples | défaut | ce qu'un « oui » coûte |
|---|---|---|---|
| **A** (CP10) | « Faut-il qu'Opus reconnaisse aussi « 10cm » et « 10 cm », « 60x60 » et « 60 x 60 », « 2ᵉ étage » et « 2e étage » ? La même règle rapprocherait alors « BA13 » et « BA 13 », qu'on vous a dits différents. » | **non** — la règle dite le 23/10 | deux expressions ASCII de plus des deux côtés (coller un chiffre et la lettre qui le suit) et U+1D49 → e dans la table ; les cas C02, C04, P21, Y13–Y15 et deux paires changent ; les empreintes changent. MESURÉ par CP10 : 0 collision entre les 70 travaux du corpus |
| **B** (CE3-9) | « Quand vous avez écrit la même phrase de deux façons, Opus doit-il proposer celle écrite le plus RÉCEMMENT (une faute d'un soir gagne), ou celle écrite le plus SOUVENT (la plus récente à égalité) ? » | **la plus récente** — la règle dite le 23/10 | une ligne de `memoireDesLignes` (le choix du titre du groupe) et deux cas de §3.3 ; aucune donnée en base n'en dépend : à tout moment |

---

## 2. La base : section 50 de `supabase/schema.sql`

Une esquisse conforme au chapitre de la v1 a été écrite et rejouée par le
rédacteur (`lotP/redac/section-50-redac.sql`) : **MESURÉ R0** — prélude puis
schéma ×2 sur un PostgreSQL 16.15 neuf, aucune erreur ; l'essai 49 rend la
même chose avec et sans elle (74 refus des deux côtés). La critique base l'a
recopiée et rejouée ; le réviseur de la v2 aussi (`lotp_rev_1`, 0 erreur ×2 ;
essai 43 : 39). Les écarts de la v2 sont signalés **[v2]** (éprouvés, V-…,
annexe B), ceux de la v3 **[v3]** (W-…, annexe C).

**[final] Le prototype de la version finale est `lotP/final/proto-50-final.sql`**
(19 141 octets, md5 au §8.0), assemblé depuis celui de la v3 par
`lotP/final/` : la fonction finale (`fonction-final.sql`), le verrou réservé à
sa propre entreprise, l'index renommé. MESURÉ X-12 et X-15 : prélude,
`schema.sql` ×2, puis la section ×2 sur une base neuve, **0 erreur** ;
l'essai 49 rend une sortie IDENTIQUE à celle de la v3 (0 ligne de différence
une fois les dates, identifiants, durées et chemins normalisés ; 74 refus ;
listes 24/27) ; l'essai 43 rend 0 fonction de déclencheur appelable et 39 en
tout — **une fois le balayage de la section 43 rejoué APRÈS la section**, ce
que le vrai fichier fait par construction (le balayage y reste le dernier
bloc, `verifier-portes` le tient). Un prototype rejoué derrière le schéma
entier, sans rejouer le balayage, fait croire que `tient_le_poste` est
appelable : piège de montage, mesuré, sans effet sur le code livré.

### 2.0 Place, titre, en-tête

- Titre : `--  50. LA BASE DE POSTES — ce que l'artisan FIXE lui-même (lot P)`,
  sur le modèle de la 49 (schema:11360-11362), avec ses blocs « CE QU'ELLE
  POSE » et « CE QU'ELLE NE POSE PAS ». Ce dernier dit « aucune COLONNE de
  client — la phrase est le texte de l'artisan, qui peut en nommer un, et
  l'écran le lui signale » (CD10), et non « aucune donnée de client ». Puis :
  pas de taux, pas de métier (Q1 a), pas de région, pas d'historique, aucune
  écriture automatique, aucune fonction `security definer`.
- **D'abord la fonction `public.cle_de_rapprochement(text)`** (§3.0.4), puis
  tout le reste : la colonne générée de la table l'appelle, et PostgreSQL
  contrôle une expression à la création. **[final] Aucune barre oblique
  inverse dans toute la fonction** (CP3) — donc, a fortiori, aucune séquence
  barre-oblique-u — et aucun caractère non ASCII : la table de la clé, la
  classe de blancs du déclencheur et le remplacement du pluriel s'écrivent en
  `chr(n)` (`chr(92) || '1' || chr(92) || '2'`). Dans toute la section, les
  seuls caractères non ASCII sont les accents de la phrase d'`OP018`, recopiée
  octet pour octet dans `erreurs.js`. Le corps de la fonction est ENGENDRÉ
  entre deux marqueurs par `npm run generer-rapprochement` (§3.0.5).
- Place : **après la section 49, avant le titre de la section 42** (l'export,
  schema:12451) ; le balayage de la 43 reste le dernier bloc
  (schema:12625-12687 ; `verifier-portes` le tient).
- Références qualifiées `public.x` partout, `comment on` en français qui
  disent l'unité (« En CENTIMES »), comme la 49 (schema:11766-11820).

### 2.1 L'index unique `devis (id, pro_id)` — 50.1

`create unique index if not exists idx_devis_id_pro on public.devis (id, pro_id);`

`id` est déjà unique : cet index ne refuse rien de plus. Il sert de cible à
la clé composée du lien d'origine (§2.7). Sans lui : « there is no unique
constraint matching given keys » (MESURÉ par la lecture « base », P1). Un
index et non une contrainte : `verifier-devis` n'admet sur `devis` que
`add constraint … check` (`scripts/verifier-devis.mjs:1938-1947`), et son
contrôle des index uniques (`:2014-2021`) l'accepte, puisqu'il ne lie pas
l'entreprise à un client, une demande ou un lieu (LU). Le nom
`idx_devis_id_pro` n'existe nulle part ailleurs (LU) — la leçon de
`idx_devis_pro` (schema:11379-11381).

**[v2] Ce que cet index change au lot 1 (CB11).** Le commentaire de
`src/lib/file-ecriture.js:154-156` dit que « le devis et ses lignes n'ont
AUCUNE autre contrainte d'unicité », et `estUneCleDejaPrise` ne reconnaît
qu'un nom en `_pkey` (`:157-162`). Le COMPORTEMENT tient : un identifiant de
devis renvoyé, le sien comme celui d'un autre, rend toujours `devis_pkey`
(MESURÉ V-CB11 : PostgreSQL vérifie les index dans l'ordre de leur création,
et la clé primaire est le plus ancien, sur base neuve comme après la
migration). Le COMMENTAIRE devient faux : il est corrigé dans le même lot,
avec la raison, et l'essai 50 le prouve (cas 15).

### 2.2 La table `public.base_postes` — 50.2

Le nom : `base_postes`, jamais `postes`, à une lettre de `posts` (la table du
fil) : un `from('postes')` mal tapé lirait le fil sans erreur.

| colonne | type | borne | qui l'écrit | qui la lit |
|---|---|---|---|---|
| `id` | `uuid` clé, `default gen_random_uuid()` | **[v2] figé en modification** | la base | `modifierPoste`, `retirerPoste`, la clé React d'une rangée |
| `pro_id` | `uuid not null` → `professional_profiles(id) on delete cascade` | **[v2] figé en modification** | `ajouterPoste` (le compte connecté) ; la politique le vérifie | la politique, la clé composée, l'export |
| `designation` | `text`, NULLABLE + contrainte | 1 à 2 000 caractères, rognée de ses blancs | la feuille d'ajout (depuis la ligne, sans correction), la feuille de la page (correction) | la recherche, la clé, la recopie, la page, `indicesDuClient` |
| **[v3]** `cle_rapprochement` | **[corrections BASE]** `text`, POSÉE par le déclencheur à l'insertion et quand la phrase change (§3.0.8) — elle n'est plus générée | non vide (`base_poste_rapprochement_check`) ; **[final]** `null` au-delà de 2 000 points de code (la garde, §3.0.4) | **la base seule** — un client qui l'envoie reçoit 428C9 (W-6, M3 ; X-12, F3) | **l'index unique** `idx_base_postes_rapprochement` ; l'essai ; l'export (`to_jsonb`) — **pas l'application**, qui calcule la même par son miroir (T18) |
| `unite` | `text`, NULLABLE + contrainte | une des sept clés, **obligatoire** | la feuille d'ajout (depuis la ligne) — **[v3]** jamais la page (Q4 a) | la clé, la recopie, l'affichage |
| `fourniture_non_comprise` | `boolean not null default false` | — | la feuille d'ajout | la clé, la recopie, l'affichage |
| `main_oeuvre` | `boolean not null default false` | — | idem | la recopie (T5), l'affichage, le libellé « taux horaire » |
| `prix_reference_centimes` | `bigint` | `null` ou 1 à 9 999 999 999 | la feuille d'ajout (Q2), la feuille du poste (carte ou page) | la suggestion (prix proposé), la référence, l'écart, la page |
| `prix_fixe_le` | `timestamptz` | vide si et seulement si le prix est vide | **la base seule** (déclencheur) | « fixé le … » ; la comparaison avec la date du régime (T9) |
| `devis_origine_id` | `uuid`, clé composée (§2.7) | un devis DE CETTE entreprise | `ajouterPoste`, si le devis est DÉJÀ en base ; la base (`set null`) | **[v2]** la page (« … depuis un de vos devis », sans lire le devis) ; l'export |
| `created_at` | `timestamptz not null` | — | la base | **[v2]** « Ajouté le … » dans la page ; l'ordre de l'export |
| `modifie_le` | `timestamptz not null` | — | la base, à chaque écriture DIRECTE | la condition de `modifierPoste` et `retirerPoste` (§2.9) |

Trois règles de forme, reprises de la 49 :

- **une colonne « obligatoire » que le téléphone remplit est NULLABLE avec
  une contrainte nommée**, pas `not null` : `not null` refuse par 23502,
  en anglais (schema:12162-12169). Les deux booléens restent
  `not null default false`, comme ceux de `devis_lignes`
  (schema:11597-11598) : l'application envoie toujours un booléen, et un
  `null` envoyé à la main rend 23502, que `messageClair` traduit
  (`src/lib/erreurs.js:553-567`, LU par la critique base) ;
- **un NULL ne satisfait jamais une contrainte par accident** :
  `unite is not null and unite in (…)` ;
- **aucune colonne sans lecteur** : pas de taux, pas de région, pas de
  quantité, pas de client, **[v3]** pas de métier. `cle_rapprochement` est la
  seule colonne dont le lecteur est un INDEX : c'est l'exception nommée du
  contrôle F (§6.1), avec sa raison (T18).

### 2.3 Les contraintes — 50.3, toutes en `_check`

Dans l'ordre ALPHABÉTIQUE de leurs noms, qui est l'ordre où PostgreSQL les
nomme quand une ligne en viole plusieurs (schema:11632-11634) :

| nom | expression | ce qu'elle dit |
|---|---|---|
| `base_poste_designation_check` | `designation is not null and char_length(designation) between 1 and 2000` | la même borne que `devis_ligne_designation_check` (schema:11688-11689) |
| `base_poste_prix_check` | `prix_reference_centimes is null or prix_reference_centimes between 1 and 9999999999` | `null` = pas encore fixé ; **0 n'a pas de sens** pour une référence |
| `base_poste_prix_date_check` | `(prix_reference_centimes is null) = (prix_fixe_le is null)` | un garde-fou : le déclencheur tient cette égalité |
| `base_poste_rapprochement_check` | `cle_rapprochement is null or cle_rapprochement <> ''` | **[final]** une phrase faite seulement de blancs, de ponctuation, de marques ou d'invisibles ne fait pas un poste (T17) ; `null` laisse parler `base_poste_designation_check` — une phrase vide n'a pas de clé, et **une phrase de plus de 2 000 points de code non plus** (la garde de CP1) |
| `base_poste_unite_check` | `unite is not null and unite in ('m2', 'm', 'm3', 'u', 'h', 'jour', 'forfait')` | la liste du lot 1, dans le même ordre (schema:11752-11753), mais obligatoire |

Vérifié pour l'ordre : une phrase vide ET l'unité « ml » → c'est
`base_poste_designation_check` qui sort (CB-15b). « — » ET « ml » →
`base_poste_rapprochement_check` (r avant u) ; « — » ET un prix 0 →
`base_poste_prix_check` (W-6). **[final] MESURÉ X-12 (F2)** : « — », U+3164
seul, U+FE0F seul → `base_poste_rapprochement_check` ; U+200B seul →
`base_poste_designation_check` (le déclencheur le rogne : la phrase devient
vide) ; 2 001 « a » → `base_poste_designation_check` (la garde rend une clé
`null`, la contrainte de la clé se tait) ; « — » + « ml » →
`base_poste_rapprochement_check`. `validerPoste()` (§3.2) teste dans cet
ordre exact (`CONTRAINTES_POSTE`).

**[v2] Ce que la contrainte de phrase laisse passer, et c'est dit (CB4).**
**[v3] Ce paragraphe ne vaut plus pour la base de postes** — il reste vrai de
`devis_lignes` : les cinq blancs hors classe sont des SÉPARATEURS pour la clé
(§3.0.2), une phrase faite d'eux seuls a une clé vide, et
`base_poste_rapprochement_check` la refuse. Le texte de la v2, pour mémoire :
une phrase faite d'un seul blanc HORS de la classe du projet — U+3000,
U+202F, la tabulation verticale, U+0085, U+2028 — est acceptée par
`devis_lignes` (MESURÉ V-CB4) ; les cinq caractères rejoignent le point
« classe de blancs » du lot S (AF:2108-2118) à l'étape 11.

### 2.4 Le déclencheur `tient_le_poste()` — 50.4

`security invoker`, `set search_path = public`, `before insert or update`,
nommé `trg_tient_le_poste`, posé par `create or replace trigger`. Il ne lit
que `public.base_postes` (et, **[final]** dans la seule branche d'insertion,
`public.est_mon_entreprise()`), et **ne lit jamais `auth.uid()` dans la
branche de modification** : il y tourne aussi pendant une cascade, où
`auth.uid()` est celui de quelqu'un d'autre (schema:11994-11998).

1. **La phrase est rognée** par la classe de blancs du projet (espace,
   tabulation, CR, LF, U+00A0, U+200B, U+200C, U+200D, U+2060, U+FEFF),
   écrite en `chr(n)` (`' ' || chr(9) || chr(13) || chr(10) || chr(160) ||
   chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279)`), jamais en
   caractères invisibles ni en séquences barre-oblique-u. C'est la **huitième
   copie** : elle entre dans la liste `copies` de `verifier-devis`
   (`scripts/verifier-devis.mjs:2133-2141`), dont la lecture apprend la forme
   `chr(n)` (§6.2). « Mot pour mot » veut dire : rien d'autre n'est réécrit ;
   le déclencheur ne lit ni n'écrit `cle_rapprochement` : PostgreSQL calcule
   une colonne générée APRÈS les déclencheurs `before` (W-16), donc la clé est
   celle de la phrase DÉJÀ rognée.
2. **À l'insertion** : `created_at` et `modifie_le` par `clock_timestamp()` ;
   `prix_fixe_le` = la même heure si un prix est donné, vide sinon. Puis
   **[final] le plafond, pour sa propre entreprise seulement** (T20, CP1) :

   ```
   if auth.uid() is null then
     v_compter := true;                                  -- éditeur SQL, fonction sans jeton
   else
     v_compter := public.est_mon_entreprise(new.pro_id); -- la seule à DÉCIDER
   end if;
   if v_compter then
     perform pg_advisory_xact_lock(hashtextextended('base_postes:' || new.pro_id::text, 0));
     if (select count(*) from public.base_postes b where b.pro_id = new.pro_id) >= v_plafond_postes then
       raise exception 'Votre base compte déjà 1 000 postes : retirez-en un dont vous ne vous servez plus, puis réessayez.'
         using errcode = 'OP018';
     end if;
   end if;
   ```

   Les deux `if` sont IMBRIQUÉS exprès : `est_mon_entreprise` n'est
   exécutable que par `anon` et `authenticated` (schema:6638-6639) ; une
   écriture du rôle de service n'a pas de jeton, et ne doit pas l'appeler.
   La phrase écrit le nombre en toutes lettres, avec une espace ordinaire
   (V-CB8b, V-fix). La constante s'appelle `v_plafond_postes`, jamais
   `v_plafond` : `verifier-devis` lit la PREMIÈRE occurrence de
   `v_plafond constant` du fichier (`:3004`). Le contrôle compare la phrase
   (chiffres seuls), la constante SQL et `POSTES_MAX`. Le préfixe
   `base_postes:` ne croise pas ceux d'`OP017` (schema:12104-12113).
3. **À la modification** : `new.id := old.id; new.pro_id := old.pro_id;`
   (CB9) ; `created_at` gardé ; **le lien d'origine ne peut que disparaître**
   (`new.devis_origine_id := case when new.devis_origine_id is null then null else old.devis_origine_id end`) ;
   `prix_fixe_le` ne bouge que si le prix change (`is distinct from`), et se
   vide avec lui ; **`modifie_le` ne bouge que pour une écriture DIRECTE**
   (`pg_trigger_depth() = 1`) : la cascade `set null` d'un devis supprimé
   tourne plus profond et garde l'ancienne valeur (§2.9).

**[final] Pourquoi le verrou et le compte sont réservés à sa propre
entreprise (CP1).** Le déclencheur tourne AVANT la colonne générée, la
politique et les contraintes. En v3, un particulier qui écrivait au nom de A
prenait le verrou de A, puis payait le calcul de la clé sur sa phrase, puis
était refusé : avec 2 Mo, A a attendu 8,07 s pour ajouter SON poste (MESURÉ
X-1). La garde de la fonction (§3.0.4) borne le calcul ; la condition retire
l'étranger du verrou. MESURÉ X-13 : le particulier est refusé en 54 ms, A
ajoute en 14 ms ; condition retirée, 40 écritures étrangères en parallèle font
attendre A 298 ms (44 ms avec elle). MESURÉ X-14 : au plafond, B au nom de A
reçoit 42501 (jamais `OP018`), l'éditeur SQL sans jeton reçoit `OP018` — il
reste compté.

**[v2] Pourquoi figer `id` et `pro_id`.** MESURÉ V-CB9 sur l'esquisse :
`update … set id = <autre>` rend `UPDATE 1`. Sans dommage aujourd'hui, mais
une modification conditionnée qui viserait l'ancien identifiant dirait
« modifié entre-temps » sur un poste qui n'a pas changé. `pro_id`, lui, est
déjà tenu par la politique pour un client (CB-6) ; le figer ferme la porte à
une écriture future qui ne passerait pas par la RLS. Conséquence voulue : un
client qui tente de déplacer son poste chez B reçoit `UPDATE 1` et **le poste
reste chez lui** (V-fix) ; la politique `with check` reste éprouvée par
l'insertion au nom d'un autre (essai 50, cas 6).

**[v2] Pourquoi `security invoker` est une propriété de SÉCURITÉ (CB8).** En
`definer` « pour compter juste », B recevrait « Votre base compte déjà 1 000
postes » au nom de A (V-CB8b) — il apprendrait que la base de A est pleine.
**[final]** La condition de T20 renforce la propriété : un étranger ne compte
plus rien du tout. La raison est écrite dans le commentaire de 50.4, et
l'essai 50 la prouve (cas 6 bis, cas 23).

**Les contrats écrits dans le commentaire de 50.4** :

- **jamais d'`upsert` sur `base_postes`** (CB10) : le déclencheur `before
  insert` compte avant de savoir que la ligne fusionnera (V-CB10) ;
- **seule la cascade `set null` écrit à profondeur supérieure à 1** (CB12) ;
  toute autre écriture future hors d'un client passe à profondeur 1, ou pose
  `modifie_le` elle-même (V-CB12) ;
- **le nombre du plafond ne dépasse pas la limite de lecture de l'API** (CB1,
  §4.2) ;
- **changer la règle de la clé, c'est réécrire la table** (§3.0.8, W-7,
  rejoué X-14) ;
- **[final] `auth.uid()` ne se lit que dans la branche d'insertion**, pour
  décider de compter (T20).

MESURÉ R2, R5, R7 (la cascade, les dates, l'origine) ; **[final] X-14** :
1 000 postes d'un ordre en 832 ms (l'appel à `est_mon_entreprise` par ligne
compris ; 527 ms en v1, 329 ms en v3 sur d'autres phrases), le 1 001e refusé
par `OP018`.

Pourquoi 1 000 : un artisan en rangera quelques dizaines à quelques
centaines (SUPPOSÉ) ; la saisie lit TOUTE la base d'un coup, sans pagination,
et une borne la garde petite ; c'est aussi la limite de lecture par défaut de
l'API (CB1).

### 2.5 Qui lit, qui écrit — 50.5

```
alter table public.base_postes enable row level security;
drop policy if exists "ma base de postes" on public.base_postes;
create policy "ma base de postes" on public.base_postes
  for all to authenticated
  using (pro_id in (select public.mes_entreprises()))
  with check (pro_id in (select public.mes_entreprises()));
revoke all on public.base_postes from anon, authenticated;
grant select, insert, update, delete on public.base_postes to authenticated;
```

- La forme de la 49.7 (schema:12404-12407) : une sous-requête NON corrélée,
  calculée une fois par requête. `est_mon_entreprise()` reste seule à
  DÉCIDER (schema:6626-6639). Aucune fonction gardienne nouvelle. MESURÉ par
  la critique base, avec 100 000 postes à un autre artisan : la lecture
  prend 9,4 ms, l'export 89 ms.
- **`for all`, c'est quatre portes** (CLAUDE.md l.699), et ici les quatre
  sont justes : lire, ajouter, corriger et retirer SES postes. Retirer ne
  détruit rien qui engage un tiers : c'est le raisonnement du carnet
  (CLAUDE.md, « `for all` pour la QUATRIÈME fois — et ici c'est juste »,
  l.6631).
- **`anon` n'a aucun droit de table**, `authenticated` exactement quatre :
  ni `truncate`, ni `references`, ni `trigger`. MESURÉ R8 et par la
  critique base : un visiteur reçoit « permission denied for table
  base_postes », pas une liste vide ; `truncate` par A aussi.
- **Aucune politique pour l'administration** : un administrateur lit 0, un
  jeton qui ne correspond à aucun compte lit 0 (MESURÉ V-CD8 et par la
  critique droit, D2-D3), et aucune fonction `admin_*` ne nomme la table
  (`verifier-legal`, §6.2 ; essai 50, cas 13).

### 2.6 Les index — 50.6

| index | colonnes | pourquoi |
|---|---|---|
| **[final]** `idx_base_postes_rapprochement` | UNIQUE `(pro_id, (md5(cle_rapprochement)::uuid), (unite collate "C"), fourniture_non_comprise)` | le doublon PRESQUE exact (§2.8) ; il sert aussi `where pro_id = …` (la lecture, le compte du plafond) |
| `idx_base_postes_devis` | `(devis_origine_id) where devis_origine_id is not null` | la cascade `set null` d'un devis supprimé le parcourt |
| `idx_devis_id_pro` | UNIQUE `devis (id, pro_id)` | la cible de la clé composée (§2.1) |

**[final] Pourquoi un NOUVEAU nom (CP6).** La v2 portait `idx_base_postes_cle`
sur `md5(designation)`. MESURÉ X-2 : sur une base qui garde l'index de la v2,
`create unique index if not exists idx_base_postes_cle …` répond « relation
already exists, skipping » et la définition RESTE l'ancienne, sans erreur. La
vraie base n'a jamais reçu de section 50 (CLAUDE.md s'arrête au lot 1) : il
n'y a rien à remplacer, aucun `drop` à envoyer ; mais un nom neuf rend la
confusion impossible sur toute base d'essai, et l'essai 50 (cas 20) lit la
définition.

**[final] Pourquoi `md5(…)::uuid` et `unite collate "C"` (CP6).** Une entrée
fixe de 16 octets (un `uuid`, sans collation) au lieu d'un texte de 32 ; et
`unite` comparée octet pour octet. Aucune colonne de l'index ne dépend plus
de la collation de la base : une mise à jour de sa bibliothèque de collation
n'exigerait pas de reconstruire CET index. MESURÉ X-12 (F8) : `indcollation`
vaut `0 0 950 0` (`C` pour `unite`, rien pour les trois autres) ; X-14 :
**88 kB pour 1 000 postes, 90 octets par poste** (112 kB en v3).

**Pourquoi un `md5` et pas la clé en clair — MESURÉ W-6, M6, rejoué X-12
(F7)** : la clé d'une phrase de 2 000 caractères de quatre octets fait 8 000
octets (rien de non latin ne se réduit), et un index en clair la refuse
(« index row size 8032 exceeds btree version 4 maximum 2704 », 54000, en
anglais). Avec l'empreinte, l'entrée est fixe. `md5` est une fonction de
`pg_catalog`, immuable ; la conversion en `uuid` aussi : rien à accorder.

### 2.7 Le lien vers le devis d'origine

```
devis_origine_id uuid,
constraint base_postes_devis_origine_fkey foreign key (devis_origine_id, pro_id)
  references public.devis (id, pro_id) on delete set null (devis_origine_id)
```

- **Une clé étrangère ignore la RLS** (CLAUDE.md, l.8319) : une clé simple
  sur `devis(id)` laisserait citer le devis d'un AUTRE. La clé composée dit
  « un devis DE CETTE ENTREPRISE », sans aucune fonction et sans lire
  `public.devis` dans un corps de fonction — donc sans entrer dans les
  listes fermées de l'essai 49 (MESURÉ par la lecture « base » : la
  variante « déclencheur de garde » fait rougir le cas 27a).
- **Aucun oracle** : le devis d'un autre et un devis inexistant rendent le
  MÊME refus, « Key is not present in table "devis" », sans valeur (MESURÉ
  R3 et par la critique base, CB-7).
- **`set null (devis_origine_id)` avec sa liste de colonnes** (PostgreSQL 15
  et plus ; la vraie base est en 17.6, CLAUDE.md l.3991) : sans la liste,
  supprimer le DEVIS échoue sur 23502, parce que `pro_id` passerait à vide.
- **Le compte part** : double cascade ; 0 poste restant (MESURÉ R10 et par
  la critique base, par `preparer_suppression_compte()` comme par la
  cascade depuis `auth.users`).
- **Les verrous partagés avec le lot 1** (MESURÉ par la critique base,
  `cb/verrous_devis.out`) : un poste qui cite un devis pose `FOR KEY SHARE`
  sur ce devis ; modifier l'objet du devis (0,05 s) et lui ajouter une
  ligne, donc son recalcul en `FOR NO KEY UPDATE` (0,07 s), ne l'attendent
  pas ; seule la suppression du devis l'attend, puis vide le lien des
  postes. À écrire dans l'en-tête de l'essai 50 (CB6).
- **Ce que l'application fait [v2]** : le lien n'est posé que si
  `devisEnBase()` (`src/lib/file-ecriture.js:848-850`) est **déjà** vrai au
  moment de l'appui ; aucune attente de la file (CE10). Une 23503 sur
  `base_postes_devis_origine_fkey` relance l'ajout une fois sans le lien
  (T2) — sans quoi l'artisan lirait « cet enregistrement désigne quelque
  chose qui n'existe plus… » (`src/lib/erreurs.js:545-552`), une phrase
  fausse dans ce cas.

### 2.8 Le doublon : décidé, et pourquoi — **[v3]** à une variante près

**Une même phrase deux fois (même unité, même fourniture) est REFUSÉE** par
`idx_base_postes_rapprochement` (23505, nommé, sans DETAIL de valeurs — MESURÉ par la
critique base). Deux références pour un même poste, c'est la question
« laquelle compte pour l'écart ? », et la moyenne qui revient par la porte
de côté. L'index tient la promesse même pour un double appui ou une requête
renvoyée.

**[v3] « Même phrase » veut dire désormais « même clé de rapprochement »**
(T1, §3.0). MESURÉ W-6, M1, par le chemin d'un client (`set local role
authenticated`) : « Chape sèche avant carrelage collé » au m² rangée, puis
« chape seche avant carrelage colle », « Chapes sèches avant carrelage
collé. », la forme décomposée, et la même avec une espace insécable et un
double espace → **quatre fois 23505 `idx_base_postes_cle`** ; la même phrase
au forfait, et avec la fourniture non comprise → acceptées : **3 postes**.
**[final]** Rejoué sur la section finale (X-12, F1) : un poste, et un 23505
`idx_base_postes_rapprochement` pour chacune des trois variantes — l'index a
changé de nom et de forme (CP6), pas de comportement ; et un U+200B ou un
U+FE0F glissés dans la phrase ne font plus un second poste (CP5).
Les cinq variantes de V-CB3, qui faisaient cinq postes en v2, n'en font plus
qu'un.

Ce qui reste permis, et c'est voulu : la même phrase au m² et au forfait, ou
avec et sans fourniture (deux prix différents, comme dans la mémoire) ; la
même phrase chez deux artisans. MESURÉ R6, W-6.

Ce qui est rapproché à tort, et c'est dit (§1.2, §3.0.3) : deux phrases que
seuls distinguent un accent sur un mot qui en change le sens (« côte » /
« côté ») ou un s qui en change la quantité au forfait (« Dépose fenêtre » /
« Dépose fenêtres »). La base les refuse comme doublon ; l'écran montre le
poste existant (§4.6), et l'artisan garde sa LIGNE telle qu'il l'a écrite.

**L'écran ne laisse pas arriver le doublon** : sur une ligne dont la clé
existe déjà, « Ajouter à ma base » ne s'affiche pas — **[final]** le bloc
dit, si la phrase diffère, « Ce poste existe déjà dans votre base, sous
« Chape sèche avant carrelage collé ». » (les mots promis, CE3-6), et sinon
« Dans votre base de postes » (§4.5). Le 23505 reste la dernière garde : une base lue
il y a une heure, un autre appareil, une application en retard d'une version
de la règle. La feuille d'ajout le traite (§4.6) : elle relit la base, montre
le poste existant, et propose d'en changer le prix de référence
**[final]** dans la feuille même, sans seconde fenêtre (T22). **Le poste
garde sa phrase** (T16).

### 2.9 Une écriture tardive peut-elle écraser une plus récente ? Non, sans horloge

Le cas existe : dans « Ma base », il fixe 50 €, le réseau traîne, il
corrige en 55 € ; la première requête arrive après la seconde et 50 €
gagne. Le lot 1 a posé une horloge `generation` parce qu'une ligne
s'enregistre à chaque champ quitté, en rafale (CLAUDE.md, l.8260). Ici les
écritures sont rares, une à la fois, et chacune attend sa réponse.

**TRANCHÉ ICI : une condition sur `modifie_le`, sans colonne de plus.**
`modifierPoste` et `retirerPoste` envoient la date LUE :
`.update(…).eq('id', id).eq('modifie_le', lu).select(…)` (et de même pour
`delete`). Une écriture partie avec une date périmée ne trouve aucune
ligne : zéro ligne, l'écran dit « Ce poste a été modifié entre-temps —
peut-être depuis un autre appareil. Il a été relu : vérifiez, puis
recommencez si besoin. » et relit la base.

- **En séquence** — MESURÉ R4 : la seconde écriture partie avec la même
  date lue rend `UPDATE 0`, le prix reste celui de la première.
- **[v2] En concurrence, la tardive attendant le verrou de la récente**
  (CB6) — MESURÉ par la critique base et rejoué par le réviseur (V-tardive,
  `lotP/rev/tardive.sh`) : la récente (55,00 €) tient le verrou 3 s ; la
  tardive, partie 0,7 s après avec la même date lue (50,00 €), attend
  2,3 s puis rend `UPDATE 0` — READ COMMITTED réévalue `modifie_le = <lu>`
  sur la version validée. Prix final : 55,00 €. Une suppression tardive :
  `DELETE 0`, le poste reste. La parade tient donc dans le cas qui a coûté
  une étape au lot 1.
- **Pourquoi c'est sûr** : `modifie_le` est posée par la base
  (`clock_timestamp()`) à chaque écriture directe et JAMAIS par le
  téléphone ; la cascade ne la bouge pas (R2).
- **Le `+` de la date dans l'adresse** : `postgrest-js` pose chaque filtre
  par `searchParams.append` (LU par la critique base,
  `node_modules/@supabase/postgrest-js/dist/index.cjs:1541-1543`), et
  `URLSearchParams` encode `+` en `%2B` (MESURÉ sous `node` par la critique
  base). **Reste SUPPOSÉ, à mesurer sur la vraie base** : que PostgREST
  relise cette date à l'identique. Et un `PATCH` conditionnel n'est jamais
  rejoué tout seul par la bibliothèque (seuls `GET`, `HEAD`, `OPTIONS`,
  `dist/index.cjs:81-87`, LU par la critique base).

L'ajout n'a pas besoin de condition : l'index unique refuse un second ajout
du même poste, et un ajout RENVOYÉ rend 23505 au lieu d'un doublon ; l'écran
relit alors la base, et le poste y est.

**[v2] Non couvert, et dit (CB5)** : un ajout TARDIF — resté en route,
l'artisan réessaie, le second passe, il retire le poste, puis le premier
arrive — **fait revenir le poste** (MESURÉ V-CB5). C'est exactement le « non
couvert » du lot 1 pour la création d'un devis arrivée après sa suppression
(CLAUDE.md l.8290). Aucune parade : une pierre tombale serait une colonne ou
une table pour un seul cas. Le poste revient, visible dans la page, et se
retire d'un appui. Écrit dans le commentaire de la section et documenté par
l'essai 50 (cas 17).

### 2.10 L'export RGPD — section 42

`mes_donnees()` est réécrite EN ENTIER et reste la DERNIÈRE fonction du
fichier (schema:12462-12470). Une clé de plus, après `devis_tva` :

```
'ma_base_de_postes',
  coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at, x.id)
              from public.base_postes x where x.pro_id = auth.uid()), '[]'::jsonb)
```

**[v2] Le commentaire de cette clé reprend les DEUX fondements de
`devis_emis`** (schema:12587-12601) : l'article 15 pour l'artisan (son tarif,
une donnée sur lui pour un entrepreneur individuel) ; et, pour une phrase
qui nommerait un client, le rôle de sous-traitant d'Opus (article 28). La v1
disait « une donnée de l'artisan sur lui-même » : faux dès qu'une phrase
nomme quelqu'un (CB13, CD10). Une phrase survit au devis et à la fiche du
client, et reste dans l'export (MESURÉ V-CD1). Son droit reste posé avec
elle (schema:12621-12622). MESURÉ par la critique base : A 2, B 0, P 0.
**[v3]** `to_jsonb(x)` emporte aussi `cle_rapprochement` : une valeur
calculée, rendue telle quelle — la fonction rend des LIGNES, pas une liste
de colonnes (CLAUDE.md, l'export et `agent_nom`), et un export qui omettrait
une colonne de la table ne serait plus « tout ».

### 2.11 Le balayage de la section 43

Rien à écrire : il retire le droit d'appel à toute fonction qui rend
`trigger`, donc à `tient_le_poste()` (schema:12673-12687). Le compte de
l'essai 43, cas 2, passe de 38 à 39 (MESURÉ par le réviseur sur
`lotp_rev_1` ; aucun nombre n'y est écrit en dur, LU
`supabase/essais-section-43.sql:29-31`).

### 2.12 La suppression de compte

`preparer_suppression_compte()` efface la ligne `users`, la fiche part en
cascade, et avec elle les postes (schema:2058-2121, LU ; MESURÉ par la
critique base). **[v2] Rien à anonymiser : tout part avec le compte, y
compris une phrase qui nommerait un client** (CD10 ; la v1 écrivait « les
postes ne concernent aucun tiers »). Les textes disent déjà « À sa
suppression, elles sont effacées immédiatement » (`legal.js`, « Combien de
temps »).

### 2.13 Aucune fonction `security definer`

`cle_de_rapprochement` est `security invoker`, ne lit aucune table, et reste
exécutable par `authenticated` par NÉCESSITÉ (la colonne générée, §3.0.4,
W-6 M4) — `revoke all … from public, anon; grant execute … to
authenticated;`, la forme de `devis_total_ligne` (schema:11521-11524).
**[final] L'exposer par `/rpc/cle_de_rapprochement` ne coûte plus rien** :
au-delà de 2 000 points de code elle rend `null` sans calculer (MESURÉ X-12,
F5 : 10 Mo par un particulier, `null` en 47 ms ; la v3 tenait 39,4 s, X-1).
Elle n'entre dans aucune liste fermée de l'essai 49 (qui ne tient que les
`definer`), et n'est pas une fonction de déclencheur : le balayage de la
section 43 ne la touche pas.

La section 50 n'en pose aucune : les listes fermées de l'essai 49 (24
appelables, 27 fermées, cas 27b et 27c) ne bougent pas (MESURÉ X-15). Si la
construction en ajoutait une, elle entrerait dans ces listes avec sa raison
(C1:322) — et **jamais `tient_le_poste`** (§2.4).

### 2.14 La migration sur la vraie base

Construite par un script qui PREND les objets dans `schema.sql`, comme au
lot 1 (CLAUDE.md, « La migration sur la vraie base, et ses pièges »,
l.8445) :

1. `set local lock_timeout = '5s';` — la création de `idx_devis_id_pro` pose
   un verrou qui bloque les écritures de `devis` le temps de sa construction
   (une table de quelques lignes) ;
2. la fonction `cle_de_rapprochement` (**[final]** 14 102 octets, **aucune
   barre oblique inverse**, aucun caractère non ASCII, aucun ordre interdit),
   son `revoke` et son `grant` ; puis l'index unique sur `devis`, la table
   (avec sa colonne générée), les **cinq** contraintes **créées sous
   condition** (`pg_constraint`) dans un bloc `do`, la fonction du
   déclencheur, le déclencheur (`create or replace trigger`), la RLS, la
   politique **sous condition** (`pg_policies`), les droits, les deux index
   (**[final]** `idx_base_postes_rapprochement`) ;
3. `mes_donnees()` entière, avec son `revoke` et son `grant` ;
4. le bloc du balayage de la section 43 (il DOIT passer après le
   déclencheur : X-15) ;
5. **aucun ordre qui commence par `drop`, `delete` ou `truncate`**, compté par
   le script, corps de fonction compris ; aucun commentaire envoyé (le refus
   du connecteur est TEXTUEL, CLAUDE.md l.1899-1930) ;
6. le commentaire de `src/lib/file-ecriture.js` n'est pas dans la base : rien
   à migrer pour CB11.

**Le transport** : **[final]** la fonction de la clé n'a plus AUCUNE barre
oblique inverse ; la classe de blancs du déclencheur est en `chr(n)` ;
`mes_donnees()` réécrite n'a pas de séquence barre-oblique-u (CP, sur 10 155
octets). Le script écrit quand même ses deux fichiers — ce qu'on envoie, ce
que la base recevra (CLAUDE.md « Le transport du connecteur, ÉTABLI le
22/10 », l.8487) — et **compte les séquences barre-oblique-u du premier :
0 attendu**. Si le compte n'est pas 0, la simulation du second devient
obligatoire, comme au lot 1.

**Avant** (lecture seule, par `SupabaseLecture`, la FORME seulement) :
l'empreinte du catalogue, comparée à l'imitation ; **[final] et la requête
de relevé de §7.4** (collation, version réelle de la bibliothèque, encodage,
`standard_conforming_strings`, réglages par rôle), écrite pour marcher en
PostgreSQL 16 ET 17 (`to_jsonb(pg_database)` au lieu de nommer `datlocale`,
qui n'existe qu'en 17, ou `daticulocale`, qui n'existe qu'en 16 ; éprouvée
sur le 16, X-23). Si `datcollversion` diffère de la version réelle, le dire :
aucun index de la section 50 n'en dépend plus (CP6), mais d'autres index de
la base, oui.

**La simulation** : une imitation de la vraie base = `git show d75217d:supabase/schema.sql`
rejoué deux fois, comparée à la vraie base par une empreinte du catalogue,
lue par `SupabaseLecture`. Puis la migration y passe deux fois ; l'empreinte
obtenue doit être celle d'une base neuve au nouveau schéma. Relue avant
d'être appliquée, puis **appliquée avec l'accord du propriétaire**
(`apply_migration` est en `ask`).

**Après** : empreinte, `md5` des corps de fonction réécrits, droits,
`has_function_privilege` de `tient_le_poste` faux pour `anon` et
`authenticated`, celui de `cle_de_rapprochement` vrai pour `authenticated`
et faux pour `anon` ; et **l'empreinte du plan de base calculée PAR LA VRAIE
BASE** (la requête de `lotP/final/parite.sql`, une lecture pure de trois
secondes, par `execute_sql` du connecteur principal, avec l'accord du
propriétaire : le rôle de `SupabaseLecture` n'a pas le droit d'exécuter la
fonction) — **[final] elle doit valoir `0186e2b8b4500bac356bbc6f456937c4`**,
la valeur de `cas-rapprochement.json`. C'est la seule preuve que, sous
PostgreSQL 17 et à SA collation, la fonction fait ce que fait le téléphone :
ce conteneur n'a que PostgreSQL 16 (CP7).

### 2.15 `supabase/essais-section-50.sql`

Sur le modèle de `essais-section-49.sql` (son en-tête et ses sept règles,
l.1-52) : chaque cas dans son `begin … rollback`, **aucune RLS dans un bloc
`do`** (`set local role` puis `set local request.jwt.claim.sub`, chacun son
ordre — CLAUDE.md l.594), chaque « 0 » précédé du « 1 » qui le rend crédible,
chaque refus annoncé PAR SON NOM et dernier ordre de sa transaction, la
sécurité demandée au CATALOGUE, les caractères invisibles écrits par `chr()`.
Comptes fictifs `…@exemple-opus.test`, SIRET fictifs à clé juste et preuves
posées AVANT les comptes (sinon OP006). **[final] Ne pas réutiliser les SIREN
de l'essai 49** dans un jeu posé une fois pour toutes : sur une même base,
le second jeu tombe sur OP007 (MESURÉ X-15, le premier essai de la
comparaison).

**L'en-tête écrit quatre procédures à deux sessions ou plus** (modèle : essai
49, en-tête, procédure B ; les brouillons sont `lotP/rev/tardive.sh`,
`lotP/cb/deux_sessions.sh`, `lotP/final/verrou-p.sql` et `verrou-a.sql`) :
(A) le plafond, avec et sans le verrou ; (B) la modification et la
suppression tardives qui attendent le verrou de la récente ; (C)
**l'empreinte de TOUT Unicode** (1 112 063 points de code, 50 s), à rejouer
chaque fois que la table de la clé change ; **[final] (D) un étranger ne
prend jamais le verrou de A** : la forme déterministe du cas 23 (la session 1
tient le verrou, la session 2 au nom de A est refusée sans attendre), puis la
forme de charge — un particulier écrit 2 Mo au nom de A pendant que A ajoute
son poste, et 40 écritures étrangères en parallèle : A n'attend pas (X-13). Il dit
aussi ce que les verrous partagés avec le lot 1 attendent ou non (§2.7).

| cas | attendu |
|---|---|
| 0. A range deux postes et les relit | 2 ; la phrase rognée (U+00A0, U+200B en bord) ; un prix vide reste vide ; `cle_rapprochement` vaut `chape seche avant carrelage colle` |
| 1. forme | U+200B seul, 2 001 caractères, « ml », unité absente, prix 0, −1, 10^10 : refusés PAR LEUR NOM (23514), jamais 22003 ; **2 000 caractères de quatre octets : accepté** (clé de 8 000 octets, index tenu par l'empreinte) ; « — », « … », « « » », **[final]** `chr(12644)` seul, `chr(65039)` seul : `base_poste_rapprochement_check` |
| 1 bis. blancs hors classe | U+3000, U+202F, `chr(11)`, `chr(133)`, `chr(8232)` seuls : refusés par `base_poste_rapprochement_check` ; le défaut reste ouvert pour `devis_lignes` (lot S) |
| 2. ordre des noms | phrase vide + « ml » → `base_poste_designation_check` ; « — » + « ml » → `base_poste_rapprochement_check` ; « — » + prix 0 → `base_poste_prix_check` ; **[final]** 2 001 « é » → `base_poste_designation_check` (la garde rend une clé `null`) |
| 3. dates | 2001 ignoré à la création ; date du prix gardée si seule la phrase change, avancée si le prix change, vidée avec lui |
| 4. lien | son devis : accepté ; le devis de B et un devis inexistant : le même 23503, sans valeur ; l'origine ne se récrit pas, elle se vide ; A supprime son devis : le poste reste, lien vide, `modifie_le` inchangé, et la modification conditionnée passe ensuite |
| 4 bis. la phrase qui nomme un client (CD1) | A : fiche client, devis rattaché, poste « … chez Mme <nom fictif>, <adresse fictive> » lié au devis ; A supprime la fiche PUIS le devis : fiche 0, devis 0, **poste 1, la phrase contient toujours le nom, lien vide**, et `mes_donnees()` le contient (V-CD1) |
| 5. qui lit | A 1 ; B 0 ; P (particulier, compte sans fiche) 0 ; visiteur : permission denied |
| 5 bis. l'administration (CD8) | B nommé dans `administrateurs`, `est_admin()` vrai : **0** alors que A en a 1 (V-CD8) |
| 5 ter. un jeton sans compte | 0 (V-CD8) |
| 6. qui écrit | B modifie ou retire chez A : 0 ligne, A intact ; B crée au nom de A : 42501 ; un particulier crée : 42501 ; A tente de déplacer son poste chez B : `UPDATE 1`, **`pro_id` toujours A**, B lit toujours 0 |
| 6 bis. pas d'oracle du nombre (CB8) | A au plafond (1 000) ; B écrit au nom de A : **42501, jamais `OP018`** (V-CB8, X-14) |
| 7. doublon | les cas de R6 ; les variantes de V-CB3 et « Chapes sèches avant carrelage collé. » : **un poste, et un 23505 `idx_base_postes_rapprochement` pour chacune des autres** ; **[final]** la même phrase avec un U+200B au milieu et un U+FE0F à la fin : 23505 ; au forfait et avec la fourniture : acceptées ; la même phrase chez B : acceptée ; **[final]** « Plancher bas » et « Plancher BA », « Déplacement < 20 km », « > 20 km » et « 20 km » : **cinq postes** (X-12, F1) |
| 8. condition, en séquence | deux modifications parties avec la même date lue : la seconde `UPDATE 0` ; une suppression avec une date périmée : `DELETE 0` |
| 8 bis. condition, à deux sessions (CB6) | procédure B : la tardive attend, puis `UPDATE 0` ; prix de la récente gardé ; suppression tardive `DELETE 0` (V-tardive) |
| 9. plafond | 1 000 d'un ordre, puis `OP018` avec la phrase exacte (« 1 000 ») ; 1 001 d'un ordre : `OP018`, rien d'inséré ; à deux sessions (procédure A) : avec le verrou 1 000 et un refus ; sans lui (sabotage) 1 001 ; **[final]** l'éditeur SQL sans jeton, au plafond : `OP018` (il reste compté, X-14) |
| 10. export | A n, B 0, P 0 |
| 11. le compte part | `preparer_suppression_compte()` puis `delete from auth.users` : 0 poste |
| 12. droits | `anon` et PUBLIC : rien ; `authenticated` : exactement `select, insert, update, delete` ; **aucun droit de colonne lu dans `pg_attribute.attacl`** (0 sur les 12 colonnes) — **jamais** `information_schema.column_privileges` (V-CB7) |
| 13. catalogue | le motif NORMALISÉ du cas 27a de l'essai 49 (`essais-section-49.sql:1192-1210`) appliqué à `base_postes` : les fonctions qui la nomment sont EXACTEMENT `tient_le_poste` et `mes_donnees` ; les analogues de 27d, 27e et 27f ; 0 fonction `admin_` qui la nomme ; `tient_le_poste` invoker, appelable par personne ; la politique, chaîne exacte ; la clé composée et sa liste `set null` (`confdelsetcols`) ; les deux index uniques ; les listes 27b/27c de l'essai 49 inchangées (24/27) |
| 14. identifiant figé (CB9) | `update … set id = <autre>` : l'identifiant reste |
| 15. `devis_pkey` d'abord (CB11) | un identifiant de devis déjà pris, le sien comme celui de B : `devis_pkey`, jamais `idx_devis_id_pro` |
| 16. contrat de l'`upsert` (CB10) | A au plafond, `insert … on conflict (id) do update` sur un poste existant : `OP018` |
| 17. contrat de l'ajout tardif (CB5) | ajout, retrait, puis le même ajout : le poste revient, et le cas le dit |
| 18. **[final]** la clé, cas partagés | `\set cas `cat supabase/cas-rapprochement.json`` ; le nombre annoncé = le nombre lu (**175**) ; **0 écart** entre `public.cle_de_rapprochement(phrase)` et l'attendu (un attendu `null` compris : cas G02, G04) ; **0 paire confondue sur 22** ; dix cas lus en entier (R01, D01, L01, S03, V01, N04, **Y01, E02, I04, G02**) pour prouver que le joueur JOUE ; `cle_de_rapprochement(null)` est `null` (X-8) |
| 18 bis. **[final]** l'empreinte | le md5 de la sonde sur les 63 487 points de code du plan de base = **`0186e2b8b4500bac356bbc6f456937c4`**, la valeur de `cas-rapprochement.json` ; **la même sous quatre collations explicites** posées sur l'argument (`C`, `und-x-icu`, `fr-x-icu`, `tr-TR-x-icu`) ; **et la même sous `set local standard_conforming_strings = off`** (CP3 ; X-9, X-10) |
| 19. la colonne générée | A écrit `cle_rapprochement` à l'insertion, puis à la modification : **428C9** les deux fois ; une phrase modifiée (« POSES DE PLINTHES ») recalcule la clé (`pose de plinthe`) ; `has_function_privilege` : `authenticated` vrai, `anon` et PUBLIC faux ; et, dans une transaction annulée, le droit retiré à `authenticated` fait tomber l'insertion suivante sur 42501 (W-6, M3, M4) |
| 20. **[final]** catalogue de la clé | `attgenerated = 's'` et l'expression appelle `public.cle_de_rapprochement(designation)` ; la fonction : `provolatile = 'i'`, `proisstrict`, `prosecdef` faux, `proconfig` = `search_path=public` ; son corps (`prosrc`) ne contient ni `lower(`, ni `upper(`, ni `unaccent`, ni `normalize`, ni `collate`, ni `ilike`, **aucun caractère de code 92, et `chr(92)` exactement trois fois — une dans la table (la barre oblique inverse est un séparateur), deux dans le remplacement** (MESURÉ sur `lotP/final/fonction-final.sql`), et commence par la garde `char_length(p_phrase) > 2000` ; l'index unique s'appelle `idx_base_postes_rapprochement`, porte `(md5(cle_rapprochement))::uuid` et `unite COLLATE "C"` (`pg_get_indexdef`), et son `indcollation` ne contient que 0 et l'oid de `C` ; `pg_depend` relie la colonne à la fonction |
| 21. contrat de la règle (§3.0.8) | dans une transaction annulée : `create or replace` de la fonction avec une autre règle → la clé rangée NE CHANGE PAS ; `update … set designation = designation` → elle change (W-7, X-14) |
| 22. **[final]** la garde (CP1) | dans une transaction : `set local statement_timeout = '2s'` ; `cle_de_rapprochement(repeat('Chapes sèches, ', 700000))` (10 Mo) : `null`, en moins d'une seconde ; une phrase de 2 000 points de code a une clé, une de 2 001 n'en a pas (le cas d'un sabotage de la garde : 57014 après plus de 7 s, X-22) |
| 23. **[final]** l'étranger ne compte pas (CP1) | A au plafond ; P (particulier) puis B écrivent au nom de A : 42501, jamais `OP018`. **La preuve qu'ils ne prennent pas le verrou est à deux sessions** (procédure D, forme déterministe) : la session 1 tient le verrou consultatif de A (`pg_advisory_xact_lock(hashtextextended('base_postes:' || A, 0))`, puis `pg_sleep(4)`) ; la session 2, P au nom de A avec `statement_timeout = '1s'`, est refusée par la politique **sans attendre** (MESURÉ X-13 : 12 ms) ; condition retirée (sabotage 98), elle attend et tombe sur 57014 à 1,0 s. Un refus annule la transaction : cette preuve ne tient pas en une seule session |
| 24. **[final]** le réglage de session (CP3) | `set local standard_conforming_strings = off` : la clé de « Pose des plinthes » reste `pose de plinthe`, celle de « Mur [bas] » reste `mur bas` (X-12, F4) |
| 25. **[final]** les signes de sens et l'exception | « Déplacement < 20 km » → `deplacement inf 20 km` ; « Planchers bas » → `plancher bas` ; « Frais 50€ » et « Frais 50 euros » → `frai 50 euro` (déjà dans `cas-rapprochement.json` ; le cas rend trois clés lues en entier, depuis une vraie insertion, pour prouver que la COLONNE les porte) |

### 2.16 Les autres fichiers d'essais

Rejouer **les 26 fichiers** sur une base neuve au nouveau schéma et comparer
au relevé d'avant (un verrou nouveau se rejoue contre TOUS les essais,
CLAUDE.md section 44). Attendu : identiques, sauf l'essai 43, cas 2 (38 →
39), et la largeur d'une colonne d'horodatage dans 33 et 38 (MESURÉ par la
critique base sur l'esquisse, `cb/essais/`). **[v3]** Sur le prototype de la
v3, l'essai 49 est identique à celui de l'esquisse de la v2 (`diff` vide,
dates et identifiants normalisés) et l'essai 43, cas 2, rend 39 (MESURÉ
W-13) : la fonction de la clé n'est pas une fonction de déclencheur.

---

## 3. Le calcul : des fichiers que `node` fait tourner

### 3.0 La clé de rapprochement — le cœur du lot

#### 3.0.1 Ce qu'elle est, et ce qu'elle n'est pas

**La phrase est rangée MOT POUR MOT**, dans le poste comme dans la ligne :
c'est elle que le client lira, et c'est elle que la feuille montre. **La clé
ne s'affiche nulle part** — **[final]** et un contrôle le tient (§6.1 A et E,
CE3-12). Elle ne sert qu'à RAPPROCHER :

- regrouper les propositions pendant la frappe (une par clé, §3.1, §3.2) ;
- reconnaître un poste existant (l'index unique de la base, §2.6 ; l'état
  `'dans_la_base'` de l'écran) ;
- faire correspondre une ligne et un poste pour la référence et l'écart
  (`posteDeLaLigne`, par `cleDeLigne` = (clé, unité, fourniture)) ;
- **[final]** retrouver un mot tapé au pluriel comme MOT ENTIER (§3.0.6) —
  la recherche, elle, part de la phrase à plat.

Deux fonctions, écrites des deux côtés quand il le faut :

| | ce qu'elle rend | où |
|---|---|---|
| `aPlat(phrase)` | la phrase sans casse, sans accents, sans ponctuation, aux blancs réduits — **sans** l'étape du pluriel | JavaScript seulement (la recherche) |
| `cleDeRapprochement(phrase)` | `aPlat`, puis le pluriel | JavaScript (`src/lib/rapprochement.js`) ET SQL (`public.cle_de_rapprochement(text)`) |

Toutes deux rendent `null` pour `null` (la fonction SQL est `strict`) ;
**[final] `null` aussi pour une phrase de plus de 2 000 points de code**
(CP1) ; et une chaîne VIDE pour une phrase sans rien qui reste (T17).

#### 3.0.2 Quoi devient quoi — la règle entière

**[final] Étape 0 — la garde.** Plus de 2 000 points de code : pas de clé
(`null`), sans rien calculer. SQL : `case when char_length(p_phrase) > 2000
then null else … end` ; JavaScript : la même borne, comptée en points de code
(`[...s].length`, mesuré seulement au-delà de 2 000 unités, `tropLongue`).
C'est la borne de `base_poste_designation_check` et de
`devis_ligne_designation_check` : aucune phrase rangée n'est jamais au-delà.

**Étape 1 — chaque caractère passe par UNE table, une seule fois.** Un
caractère qui n'y est pas reste tel quel. **[final] La table compte 998
caractères** — la chaîne du `translate()` en fait 968, les 30 autres sont des
remplacements par une chaîne (CP9 : la v3 écrivait « 955 », la longueur de sa
chaîne seule, quand ses cinq parties en faisaient 975). Ses cinq parties
(MESURÉ X-7, `lotP/final/table-final.json`) :

| partie | combien | ce qu'elle fait | exemples |
|---|---|---|---|
| lettres | **530** | une lettre latine → sa lettre de base, MINUSCULE ASCII | `A`–`Z` → `a`–`z` (26) ; **488** lettres précomposées de Latin-1, Latin étendu A, Latin étendu B et Latin étendu additionnel, engendrées UNE fois depuis leur décomposition canonique (une lettre ASCII suivie de marques U+0300–U+036F, rien d'autre) ; et **16** lettres SANS décomposition, posées à la main : `Ø ø` → o, `Đ đ Ð ð` → d, `Ħ ħ` → h, `ı` → i, `Ŀ ŀ Ł ł` → l, `Ŧ ŧ` → t, `ſ` → s |
| remplacements par une chaîne | **[final] 30** | un caractère → une chaîne faite QUE de `a`–`z`, `0`–`9` et d'espaces (l'invariant de CP4, §3.0.5) | les 20 de la v3 : `Œ œ` → oe, `Æ æ` → ae, `ß ẞ` → ss, `Ĳ ĳ` → ij, `Þ þ` → th, les sept ligatures typographiques U+FB00 à U+FB06, `¼ ½ ¾` → « 1 4 », « 1 2 », « 3 4 » ; **[final] et les 10 signes qui portent un SENS (CP2)** : `<` et `≤` → « inf », `>` et `≥` → « sup », `+` → « plus », `%` → « pourcent », `‰` → « pourmille », `€` → « euro », `&` → « et » (chacun entouré d'espaces), et `×` → « x » (sans espace : « 60×60 » = « 60x60 ») |
| chiffres | **20** | un exposant ou un indice → le chiffre | `¹ ² ³` et U+2070, U+2074–U+2079, U+2080–U+2089 : « m² » → « m2 » |
| séparateurs | **[final] 258** | → une espace | l'ASCII qui n'est ni lettre, ni chiffre, ni espace, **sauf** `<`, `>`, `+`, `%`, `&` (U+0001–U+001F, U+0021–U+002F, U+003A–U+0040, U+005B–U+0060, U+007B–U+007F, moins ces cinq) ; les contrôles C1 (U+0080–U+009F) ; les blancs VISIBLES : U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F, U+3000 ; les signes de Latin-1 (`« » ° ª º ÷ § ¶ · ¨ ´ ¸ ¡ ¿ © ® ¬ ± ¢ £ ¤ ¥ ¦ ¯` — **[final]** `×` n'en fait plus partie : c'est un remplacement) ; les apostrophes de modification U+02B9–U+02BD ; tout le bloc de ponctuation générale U+2000–U+206F qui n'est ni supprimé ni `‰` (ses blancs, déjà nommés, et `‘ ’ “ ” „ ‹ ›`, les tirets `‐ ‑ ‒ – — ―`, `…`, `•`, `′ ″`) ; les symboles monétaires U+20A0–U+20CF **sauf `€`** ; U+2212 (moins) et U+2215 (barre de division) |
| supprimés | **[final] 160** | → rien | les **112 marques combinantes** U+0300–U+036F (ce qui rend juste la forme DÉCOMPOSÉE) ; le tiret conditionnel U+00AD ; les marques de direction et de format U+200E, U+200F, U+202A–U+202E, U+2061–U+2064, U+2066–U+206F ; **[final] et les invisibles (CP5)** : U+200B, U+200C, U+200D, U+2060, U+FEFF, U+180E, les sélecteurs de variante U+FE00–U+FE0F, les remplisseurs hangûl U+115F, U+1160, U+3164, U+FFA0 |

**U+0000 n'est dans aucune partie** (CP9) : PostgreSQL ne le porte pas dans
un `text`, et l'empreinte commence à U+0001. **U+0020 (l'espace) non plus** :
elle reste une espace.

Ce qui RESTE tel quel, sans changer de casse : les chiffres ASCII ; les
lettres non latines (grec, cyrillique, arabe…) ; `µ` ; les idéogrammes ; les
émojis (sans leur sélecteur de variante) ; tout ce que la table ne nomme pas.
**C'est la condition de la parité** : aucun changement de casse hors de
l'ASCII, donc aucune table de casse.

**Étape 2 — les blancs.** Les espaces consécutives deviennent une ; les
espaces de bord tombent. Il ne reste plus que des espaces ASCII comme blancs
(**[final]** les invisibles ont disparu à l'étape 1 ; la v3 affirmait la même
chose à tort, CP5).

**Étape 3 — le pluriel.** Un mot fait UNIQUEMENT des lettres `a` à `z`, de
**trois lettres au moins**, perd UN `s` ou UN `x` final — **[final] sauf les
mots de la liste `EXCEPTIONS_PLURIEL`, aujourd'hui le seul « bas »** (CP2 :
« Plancher bas » n'est pas « Plancher BA »). Un mot qui contient un chiffre
(« ba13 », « 1m2 », « 2x ») ou une lettre non latine ne bouge pas ; un mot de
deux lettres non plus (« os », « as »).

Écrite en expression : `(^| )(?!(?:bas)(?: |$))([a-z]{2,})[sx](?= |$)` →
`$1$2` (JavaScript, un LITTÉRAL privé du module, §3.0.7) ; la même avec la
classe ÉNUMÉRÉE `[abcdefghijklmnopqrstuvwxyz]` (SQL), et pour remplacement
**`chr(92) || '1' || chr(92) || '2'`** — aucune barre écrite (CP3). Les
parenthèses de l'exception sont NON capturantes : `$1`/`$2` et les deux
références ne bougent pas. Une anticipation négative et une positive, aucune
rétrospection, aucun drapeau `u`, aucune classe `\p{…}`.

Le résultat, sur des cas réels (tous dans `cas-rapprochement.json`) :

| phrase | clé |
|---|---|
| « Chape sèche avant carrelage collé » | `chape seche avant carrelage colle` |
| « CHAPES SÈCHES, avant carrelages collés. » | `chape seche avant carrelage colle` |
| la même en forme décomposée, avec une espace insécable, **[final]** ou un U+200B au milieu | `chape seche avant carrelage colle` |
| « Main-d’œuvre », « MAIN-D'ŒUVRE », « Main d'oeuvre » | `main d oeuvre` |
| « Évacuation des gravats » / « Evacuation de gravats » | `evacuation de gravat` |
| « Pose de BA13 » / « Pose de BA 13 » | `pose de ba13` / `pose de ba 13` (distincts, et c'est dit) |
| « 1 m² », « 1m² » | `1 m2`, `1m2` |
| « Pose ½ journée », « Pose 1/2 journée » | `pose 1 2 journee` |
| « Plancher bois », « Vis inox », « Puits » | `plancher boi`, `vi ino`, `puit` |
| **[final]** « Déplacement < 20 km » / « > 20 km » / « 20 km » | `deplacement inf 20 km` / `deplacement sup 20 km` / `deplacement 20 km` |
| **[final]** « Niveau R+1 » / « Niveau R-1 » | `niveau r plu 1` / `niveau r 1` (« plus » perd son s : c'est une clé, jamais affichée) |
| **[final]** « Frais 50 € », « Frais 50€ », « Frais 50 euros » / « Frais 50 % » | `frai 50 euro` (les trois) / `frai 50 pourcent` |
| **[final]** « Plancher bas », « Planchers bas » / « Plancher BA » | `plancher bas` / `plancher ba` |
| **[final]** « Carrelage 60×60 », « Carrelage 60x60 » / « Carrelage 60 × 60 » | `carrelage 60x60` / `carrelage 60 x 60` (l'espace compte : question A du §1.7) |
| « İstanbul », « I » + U+0307 | `istanbul` (le I turc, que `lower()` traite selon la langue) |
| « Ω », « 50 µm », « 🔥 Chape » | `Ω`, `50 µm`, `🔥 chape` (rien de non latin ne change) |
| « — », « … », U+3000 seul, U+00AD seul, **[final]** U+200B seul, U+FE0F seul, U+3164 seul | `''` (clé vide, T17) |
| **[final]** 2 001 « a » | `null` (la garde) |

#### 3.0.3 Le seuil du pluriel : mesuré, pas choisi

MESURÉ W-5 (`lotP/v3/mesure-corpus.mjs`) sur **70 désignations de travaux
DISTINCTS** écrites d'après PROP §1.3 et §1.4 (aucune donnée personnelle), et
13 familles de variantes engendrées ; **[final] rejoué avec la règle finale
(X-19) : les mêmes nombres** :

| | seuil 3 (retenu) | seuil 4 |
|---|---|---|
| variantes reconnues | **595 / 596** | 554 / 596 |
| dont « de, le, au → des, les, aux » | **38 / 38** | **0 / 38** |
| la seule manquée | « … BA13 H » → « … BA13 Hs » (un mot d'une lettre) | la même, plus « mm → mms », « cm → cms », « de 20 → des 20 » |
| **faux rapprochements entre les 70 travaux** (2 415 paires) | **0** | 0 |
| autres formulations rapprochées (6 paires, PROP §5 compris) | **0** — c'est voulu, c'est l'agent | 0 |

Le seuil 3 rapproche ce que l'artisan fait vraiment : « Pose des plinthes » et
« Pose de plinthe ». Son prix, au niveau des MOTS (`lotP/v3/mots.out`) : des
faux rapprochements de mots, ACCEPTÉS — deux mots que seul un accent
distingue (côte / côté, tâche / tache, mûr / mur…), un mot qui finit par s au
singulier et un autre mot (cours / cour, fonds / fond, vers / ver…), et, au
seul seuil 3, les mots de trois lettres (six / si, cas / ça, tas / ta).
**[final] Sauf « bas » / « BA »** (CP2) : la critique parité a trouvé dans
les devis mêmes du propriétaire l'usage des abréviations de niveau et de
matériau (« RDC et R+1 », LU `docs/DEVIS-DU-PROPRIETAIRE.md:27, 64-65`), et
« plancher bas » / « plancher BA » (béton armé) sont deux ouvrages réels, de
prix très différents. Le corpus de W-5 n'en contenait aucun : « 0 sur 2 415
paires » ne prouvait rien sur eux. D'où l'exception écrite, plutôt qu'un
seuil à quatre lettres qui perdrait les 38 articles.

Ils restent acceptés, les autres, parce qu'un faux rapprochement de MOTS ne
fait un faux rapprochement de PHRASES que si tout le reste de la phrase est
identique, et parce que ses conséquences sont douces et VISIBLES : la ligne
de référence et le bloc NOMMENT le poste reconnu (**[final]** CE3-7), et une
sortie est offerte (« Changez un mot de la ligne »). Rien n'est bloqué, rien
n'est récrit.

#### 3.0.4 Où la clé vit

- **En base**, une fonction `public.cle_de_rapprochement(p_phrase text)
  returns text`, `language sql immutable strict parallel safe security
  invoker set search_path = public`, en section 50, AVANT la table qui
  l'appelle. Son corps : **[final] la garde**, une chaîne de `replace()` pour
  les trente remplacements, un `translate()` pour la table, deux
  `regexp_replace()` à motifs ASCII et un `btrim(…, ' ')`. **Aucun** `lower`,
  `upper`, `initcap`, `unaccent`, `normalize`, `collate`, `ilike`, `~*`, ni
  classe `[[:…:]]` ; **[final] aucune barre oblique inverse** — ni dans un
  littéral, ni dans le remplacement — : son résultat ne dépend donc pas de
  `standard_conforming_strings` (CP3 ; MESURÉ X-10 et X-12, F4). Tout
  caractère non ASCII et la barre s'y écrivent `chr(n)` — **14 102 octets,
  0 caractère non ASCII, 0 barre oblique inverse** (X-7). Le prototype est
  `lotP/final/fonction-final.sql` (md5 au §8.0).
- **Dans `base_postes`**, une colonne GÉNÉRÉE :
  `cle_rapprochement text generated always as (public.cle_de_rapprochement(designation)) stored`.
  **[corrections BASE, 24/10/2026] Plus maintenant** : une colonne ORDINAIRE que
  `tient_le_poste()` pose à l'insertion et quand la phrase change, jamais
  ailleurs (§3.0.8, relecture « base » BASE1). La fonction reste exécutable par
  `authenticated` pour la même raison, déplacée : le déclencheur est `security
  invoker`.
  PostgreSQL la calcule APRÈS les déclencheurs `before` (W-16) et AVANT la
  politique et les contraintes : la garde est ce qui borne son coût pour un
  étranger (§2.4). Une écriture du client est refusée : 428C9 (W-6, X-12 F3).
- **Le droit d'exécuter** la fonction : `revoke all … from public, anon;
  grant execute … to authenticated;`. Elle DOIT rester exécutable par
  `authenticated` : une colonne générée s'évalue avec les droits de celui qui
  écrit (W-6, M4 — la leçon de `horaires_valides()`, étendue aux colonnes
  générées). Elle est pure, et **[final]** bornée : l'exposer par
  `/rpc/cle_de_rapprochement` ne donne accès à rien et ne coûte rien.
- **L'index unique** `idx_base_postes_rapprochement` (§2.6).
- **Dans l'application**, le miroir `src/lib/rapprochement.js`, qui n'importe
  RIEN : la table en séquences barre-oblique-u, `LONGUEUR_MAX`,
  `EXCEPTIONS_PLURIEL`, `PLURIEL_SOURCE`, `aPlat`, `cleDeRapprochement`, et
  les trois chaînes de la table exportées pour le contrôle. Le prototype est
  `lotP/final/rapprochement-final.mjs` (8 812 octets, 942 séquences, 0
  caractère non ASCII ; md5 au §8.0). `devis.js` et `postes.js` l'importent ;
  **aucun écran** (§6.1 E).

#### 3.0.5 Une source, deux écritures, et leur preuve

**La source est la table JavaScript.** La fonction SQL en est ENGENDRÉE par
`npm run generer-rapprochement` (`scripts/generer-rapprochement.mjs`), qui
réécrit le corps de la fonction dans `schema.sql` entre deux marqueurs —
exactement la façon dont le SQL du catalogue des métiers est engendré depuis
`src/data/catalogue-metiers.js` (CLAUDE.md, « Il n'y a plus qu'une source »).
La table elle-même a été posée UNE fois depuis la décomposition canonique
d'Unicode (`lotP/final/gen_final.py`, Python 3, `unicodedata` 14.0.0) ; elle
est désormais FIGÉE dans le fichier. **[final] Le corps engendré doit être,
octet pour octet, celui de `lotP/final/fonction-final.sql`** (la première
fois ; ensuite, celui que rend le générateur).

**[final] Comment ces fichiers s'écrivent, sans jamais passer par l'outil
d'édition** (le piège d'outil de l'en-tête) :

- `src/lib/rapprochement.js` = un en-tête de commentaires en français (écrit
  à part, sans aucune barre oblique inverse) suivi du prototype, par
  `cat entete.txt lotP/final/rapprochement-final.mjs > src/lib/rapprochement.js` ;
  relu par le compte de ses séquences barre-oblique-u (942) et par `od -c`
  sur trois lignes de la table ; tout changement ULTÉRIEUR de la table passe
  par un script qui produit la barre par `chr(92)` ;
- `supabase/cas-rapprochement.json` = la sortie de
  `lotP/final/cas_final.py` (lancé avec `python3 -I`), recopiée par `cp` ;
  ses cas se modifient dans ce script, jamais dans le fichier ;
- le corps SQL = la sortie de `generer-rapprochement`, jamais une saisie.

**Quatre preuves, de quatre natures** :

1. **La table est la MÊME des deux côtés** — `verifier-postes` A évalue les
   littéraux et les `chr(n)` de la fonction SQL et compare caractère par
   caractère aux chaînes du fichier JavaScript (`lotP/v3/compare-tables.mjs`,
   W-10).
2. **[final] L'invariant de parité tient** (CP4) — SQL applique la table en
   DEUX passes (les `replace()`, puis le `translate()` sur leur résultat),
   JavaScript en UNE. Les deux ne sont équivalents que si **la sortie de
   chaque remplacement n'est faite que de caractères que la table laisse
   tels quels** : `a`–`z`, `0`–`9`, l'espace. Le générateur l'ASSERTE (il
   s'arrête, code 1), et `verifier-postes` A le vérifie sans attendre le SQL
   (chaque valeur de `TABLE_MULTIPLES` ⊂ `[a-z0-9 ]`, aucune lettre
   minuscule, aucun chiffre ni l'espace dans `TABLE_DE`). MESURÉ X-11 :
   « ≤ » → « <= » donne « a<=b » en JavaScript et « a< b » en SQL ; le fuzz
   ne l'aurait pas vu, l'empreinte si.
3. **Les deux font LA BONNE chose** — `supabase/cas-rapprochement.json` :
   **[final] 175 cas écrits À LA MAIN** (pas par une implémentation) — les 145
   de la v3, dont **sept attendus réécrits** avec leur raison (B11 « placo »,
   P16, P17, P18, P21, P22 les signes de sens, S14 « bas »), et **30 cas
   nouveaux** (Y01–Y15 les signes de sens, E01–E05 l'exception, I01–I06 les
   invisibles, G01–G04 la garde) — et **22 paires qui doivent rester
   distinctes** (les 15 de la v3 et sept nouvelles : « < 20 km » / « > 20 km »,
   « < 20 km » / « 20 km », « Plancher bas » / « Plancher BA », « Mur bas » /
   « Mur BA », « R+1 » / « R-1 », « 50 € » / « 50 % », « 1 % » / « 1 ‰ »).
   Joués par `node` (`verifier-postes` A) et par PostgreSQL (essai 50,
   cas 18). MESURÉ X-8 : **0 écart sur 175 des deux côtés, 0 paire confondue
   sur 22**.
4. **Les deux font LA MÊME chose, partout** — une empreinte : pour chaque
   point de code `c`, la clé de la sonde `c + 'a' + c + 'bs ' + c + 'X' + c`,
   une ligne `n:clé`, et le md5 de l'ensemble. **[final] MESURÉ X-9** :

   | | points de code | JavaScript (`node` 22) | PostgreSQL 16 |
   |---|---|---|---|
   | le plan de base | 63 487 | `0186e2b8b4500bac356bbc6f456937c4` (0,3 s) | **identique** (3,1 s) |
   | tout Unicode | 1 112 063 | `10210195267001965d9327072ab14044` (3,9 s) | **identique** (50,0 s) |

   Les deux valeurs vivent dans `cas-rapprochement.json` (clé
   `empreintes`) ; elles se recalculent si la table change d'un caractère.
   **Et le fuzz de la critique parité** (300 050 chaînes, graine fixe,
   `lotP/cp/fuzz.hex`) rend **le même md5, `1184249bd8d5aaefbb8b5c9d6b221468`,
   sous `node`, sous PostgreSQL, sous `standard_conforming_strings = off`,
   sous la collation `tr-TR-x-icu` et sous `C`** (X-10) ; la même empreinte
   du plan de base dans deux bases créées en ICU `tr-TR` et `fr-FR`, où
   `lower('I')` vaut pourtant `ı` et `i` (X-9).

**Pourquoi il faut les quatre, et c'est mesuré** (W-10 et X-11, X-22) :

| sabotage | cas écrits à la main | invariant | empreinte |
|---|---|---|---|
| `.toLowerCase()` ajouté au miroir | 3 écarts, 1 paire confondue (Ω / ω) | — | change |
| seuil du pluriel à 4 | 10 écarts | — | change |
| marques combinantes retirées | 10 écarts | — | change |
| **`.normalize('NFC')` ajouté** | **0 écart** | — | **change** |
| **[final]** « ≤ » → « <= » | — | **refusé** (le générateur s'arrête) | change |
| **[final]** la garde retirée du miroir | 2 écarts (G02, G04) | — | inchangée |
| **[final]** « < » remis en séparateur | 1 écart, 1 paire confondue | — | change |
| **[final]** l'exception « bas » retirée | 5 écarts, 2 paires confondues | — | change |
| **[final]** U+200B remis en séparateur | 2 écarts (B11, I04) | — | change |

L'empreinte attrape ce qu'aucun cas ne nomme (`normalize`) ; les cas
attrapent ce que l'empreinte ne voit pas (la garde : la sonde ne dépasse
jamais 2 000 points de code) ; l'invariant attrape AVANT le SQL ce qui
casserait la parité. Côté SQL, `lower()` ajouté change l'empreinte, et pas de
la même façon selon la collation (W-10) — l'objection de CB3, rendue visible.

#### 3.0.6 La recherche pendant la frappe — [final, réécrit]

`correspondALaRecherche(designation, texte)` (CE3-1, adapté ; T12) :

```
mots      = les mots de aPlat(texte)              (vide → false)
plat      = aPlat(designation)
motsCle   = l'ensemble des mots de cleDeRapprochement(designation)
pour chaque mot w :
   plat contient w                                → oui   (la recherche du lot 1)
   sinon k = cleDeRapprochement(w) ;
         k ≠ w  ET  (longueur(k) ≥ 3 OU plusieurs mots tapés)  ET  k ∈ motsCle  → oui
   sinon                                          → non
```

- la première branche est la recherche du lot 1 (`pourChercher`, devis.js:313 :
  sans accents, sans casse, sous-chaîne), sur la phrase à plat : **0 perte**
  (X-18) ;
- la seconde trouve un PLURIEL tapé comme mot entier : « Dalles » → `dalle`
  ∈ « dalle beton… » ; « Seuils » → `seuil` ; « carrelages » → `carrelage` ;
  « Évacuation des » → `de` ∈ « evacuation de gravat » (plusieurs mots) ;
- et rien d'autre : « Les » (`le`, deux lettres, un seul mot), « Sas »
  (`sa`), « Cons » (`con`, aucun mot entier), « sous » (`sou`) ne trouvent
  que ce qui CONTIENT ce qu'on a tapé.

`degreDeCorrespondance(designation, texte)` rend 4 (la phrase à plat commence
par le texte tapé à plat), 3 (chaque mot tapé commence un mot de la phrase),
2 (chaque mot tapé est contenu), 1 (trouvée par le pluriel seulement) ou 0.
**Les deux sources sont triées ENSEMBLE** par ce degré (T19), puis la base
avant la mémoire, puis le dernier usage.

**MESURÉ X-18** (le corpus de W-9, `lotP/final/recherche-final.mjs`) : 757
textes tapés contre 70 désignations, 52 990 comparaisons : **0 perte face au
lot 1, 4 trouvailles de plus, toutes justes** ; « des » 12 (lot 1 : 12),
« les » 2 (2), « oss » 1 (1), « res » 6 (6), « vas » 1 (1), « Pos » 32 (32) ;
« Dalles » 1 (0), « carrelages » 4 (0), « seche chape » 1 (0), « oeuvre » 1
(0), « Seuils » 1 (0). La v3 rendait 154 trouvailles de plus, dont « oss » 33,
« res » 37, « des » 50 (X-6) ; la correction proposée par CE3-1 (« commence un
mot ») en rendait 10, dont « sous » → « soufflage » et « Cons » →
« contre-cloison » (sa propre mesure, `lotP/c3e/regle2.out`).

**MESURÉ X-17, sur la démonstration** : « Les », « Aux », « Sas », « Mes »,
« Pas » → **0** proposition (la v3 en montrait 3, 3, 3, 2, 1) ; « Des » → 1
(« Évacuation des gravats… », comme le lot 1) ; « Pos » → les trois « Pose » ;
« Dalles », « beton » → la dalle ; « Seuils » → une rangée.

#### 3.0.7 Hermes : ce qui est établi, et ce qui ne l'est pas

- **LU** : le moteur est Hermes `hermes-v0.17.0` / `hermes-v250829098.0.17`
  (`node_modules/react-native/sdks/.hermesversion`, `.hermesv1version`),
  construit pour Apple avec `-DHERMES_ENABLE_INTL:BOOLEAN=true`
  (`node_modules/react-native/sdks/hermes-engine/utils/build-apple-framework.sh:103`).
  **Le moteur lui-même n'est pas dans `node_modules`** : que
  `String.prototype.normalize` existe et DÉCOMPOSE sur l'iPhone du
  propriétaire **n'est pas établi** par le dépôt.
- **Donc la clé ne l'appelle pas, et elle est juste dans les deux cas** : un
  texte tapé au clavier de l'iPhone arrive en forme composée, que la table
  ramène à `e` ; un texte copié en forme décomposée perd sa marque. Les deux
  donnent `e` — cas D01 à D10 (X-8).
- **[final] MESURÉ X-21** : le compilateur Hermes du dépôt
  (`node_modules/hermes-compiler/hermesc/linux64-bin/hermesc`) compile le
  miroir final (5 830 octets de code octet) ; il refuse une expression mal
  formée (code 2) : il VALIDE les expressions LITTÉRALES à la compilation.
  **C'est pourquoi le pluriel est un littéral** (`const PLURIEL = /…/g;`,
  non exporté — CP9 : un `/g` exporté garde son `lastIndex` d'un appel à
  l'autre, et `PLURIEL.test()` répondait juste une fois sur deux, MESURÉ X-4)
  et non un `new RegExp(chaîne)`, que le compilateur ne verrait pas ;
  `PLURIEL_SOURCE = PLURIEL.source` est exporté pour le contrôle. Le préréglage
  Babel d'Expo pour Hermes laisse le miroir intact (MESURÉ par CP sur la v3,
  même forme).
- **Non mesuré** : l'EXÉCUTION sous Hermes. Le protocole du téléphone le dira
  (§7.6 : « Dalles » doit proposer « dalle »).
- **`normalize` sort de `devis.js`** : `pourChercher` devient
  `(s) => cleDeRapprochement(String(s || '')) || ''`, pour son seul usage
  restant (`avertissementDelai`, devis.js:1366-1367, même résultat, W-8) ;
  la mémoire, elle, passe par `correspondALaRecherche`. `texte.js`,
  `clients.js` et `emetteur.js` gardent `normalize` : hors du lot.

#### 3.0.8 Le contrat : changer la règle un jour — **[corrections BASE, 24/10/2026] réécrit**

**La v finale disait « une fonction remplacée ne recalcule pas une colonne
déjà rangée ». C'était vrai pour une ligne qu'on ne touche pas, et faux dès
qu'on la touche** (relecture « base », BASE1) : `cle_rapprochement` était une
colonne GÉNÉRÉE, et PostgreSQL recalcule toute colonne générée stockée à
CHAQUE modification d'une table qui porte un déclencheur `before update`.
Mesuré sur 999 postes de pire cas qui citent un même devis : le seul PRIX
changé, 999 appels et 60 s ; la cascade `set null` d'un brouillon supprimé,
999 appels et 59 s. Et entre le remplacement de la fonction et la réécriture,
la cascade d'un devis supprimé recalculait la clé d'un poste et tombait sur
23505.

**Depuis la correction, la clé est une colonne ORDINAIRE que le déclencheur
`tient_le_poste()` pose** : à l'insertion, et SEULEMENT quand la phrase
change (`is distinct from`). Un prix, une modification vide, une cascade :
0 appel, ~90 ms pour les mêmes 999 postes. Un client qui envoie une clé reçoit
428C9 — la seule écriture acceptée est son recalcul EXACT.

**Remplacer la fonction ne change donc AUCUNE clé rangée tant qu'une
réécriture explicite ne les recalcule pas** — et une phrase corrigée entre les
deux recevrait une clé de la NOUVELLE règle à côté de clés de l'ancienne. Le
jour où la règle change — un caractère de plus dans la table, une exception de
plus, la règle de la question A —, il faut, dans le MÊME lot :

1. la table JavaScript (par script), puis `npm run generer-rapprochement` ;
2. `cas-rapprochement.json` (par `lotP/corrections/table/cas_corrige.py`, le
   successeur de `cas_final.py`) : les cas, et les deux empreintes recalculées
   des deux côtés (procédure C de l'essai 50 pour PostgreSQL) ;
3. AVANT la migration, chercher les postes que la nouvelle règle rendrait
   doublons (même entreprise, même nouvelle clé, même unité, même fourniture)
   avec une fonction TEMPORAIRE qui porte la nouvelle règle
   (`create function pg_temp.…`) — une lecture, rien ne change —, et les
   faire trancher ;
4. LA MIGRATION, EN UNE SEULE TRANSACTION, jamais en deux :
   ```sql
   set local lock_timeout = '5s';
   lock table public.base_postes in share row exclusive mode;
   create or replace function public.cle_de_rapprochement(p_phrase text) … ;
   update public.base_postes
      set cle_rapprochement = public.cle_de_rapprochement(designation)
    where cle_rapprochement is distinct from public.cle_de_rapprochement(designation);
   ```
   Le verrou fait attendre les écritures (la lecture continue) : sans lui, un
   poste ajouté pendant la migration par une session qui voit encore
   l'ancienne fonction garderait une clé de l'ancienne règle. La réécriture
   est la seule écriture de la clé que le déclencheur accepte. Un doublon
   apparu depuis la recherche fait tomber l'ordre sur 23505 et ANNULE TOUT,
   remplacement compris : la base reste à l'ancienne règle, jamais à moitié
   (essai 50, cas 21 bis). Une chaîne de clés qui se décalent (la nouvelle clé
   de X est l'ancienne de Y, qui change aussi) PEUT tomber de la même façon :
   l'index unique vérifie chaque ligne aussitôt, et tout dépend de l'ordre où
   PostgreSQL visite les lignes (MESURÉ le 24/10 : par un parcours séquentiel,
   23505 ; par l'index, l'ordre passe). On réécrit alors d'abord les postes
   dont la nouvelle clé est libre, puis les autres (mesuré : deux ordres,
   chacun `UPDATE 1`). Cette réécriture fait avancer
   `modifie_le` (une écriture directe) : un téléphone qui tenait l'ancienne
   date relira le poste au lieu de l'écraser ;
5. une application qui calcule l'ancienne clé verra un 23505 sur un poste
   qu'elle croyait nouveau : la feuille le dit (§4.6).

Le contrat est écrit en section 50.0 de `schema.sql` et en tête de
`src/lib/rapprochement.js` ; l'essai 50 le joue (cas 21, 21 bis, 21 ter).

**[final] Avant la migration de l'étape 9, aucun poste n'existe** : changer la
règle ne coûte que les points 1 et 2. C'est pourquoi les questions du §1.7
se posent avant — et c'est pourquoi la table a été complétée des invisibles
(BASE2) AVANT l'étape 9, et non après.

### 3.1 `src/lib/devis.js` — la mémoire passe à la clé

- **Un troisième import**, `import { cleDeRapprochement, aPlat } from './rapprochement.js';`
  — un fichier qui n'importe rien. La règle de `verifier-devis` qui exige
  « EXACTEMENT deux imports » (`scripts/verifier-devis.mjs:1076`) passe à
  trois, nommés (§6.2).
- **`pourChercher` n'appelle plus `normalize`** (devis.js:313) :
  `(s) => cleDeRapprochement(String(s || '')) || ''`. Il ne sert plus qu'à
  `avertissementDelai` (devis.js:1366-1367), qui garde ses résultats (W-8).
- **`cleDeLigne(l)`**, exportée :
  `JSON.stringify([cleDeRapprochement(texteNet(l.designation)), l.unite ?? null, vrai(l.fournitureNonComprise)])`.
  La mémoire l'appelle, la base de postes aussi. Une règle, un endroit.
- **[final] `correspondALaRecherche(designation, texte)`** et
  **`degreDeCorrespondance(designation, texte)`**, exportées : §3.0.6.
- **[final] `memoireDesLignes(lignes, texte, { idLigne })`** (devis.js:1046)
  rend UNE proposition par `cleDeLigne` :
  - les lignes retenues sont celles d'aujourd'hui (un poste ou une option,
    pas la ligne ouverte, une phrase non vide, **une clé non vide**),
    filtrées par `correspondALaRecherche` ;
  - le groupe prend la PHRASE, l'unité, la fourniture et la main-d'œuvre de
    sa ligne la plus RÉCENTE (`plusRecentDAbord`, le tri du lot 1) ;
  - il porte **`prix`** : les prix UTILISABLES distincts des lignes du
    groupe — **entier > 0**, la valeur d'une ligne offerte comprise, **une
    ligne sans prix jamais** (CE3-2) —, les plus récents d'abord, **trois au
    plus**, chacun avec `offert`, son origine, sa ligne et sa date ; deux
    lignes au même prix n'en font qu'un, le plus récent ;
  - `prixUnitaireCentimes`, `offert` et `origine` du groupe sont ceux de
    `prix[0]` (le prix qu'un appui recopie) ; sans prix utilisable, `null`,
    `false`, et l'origine de la ligne la plus récente ;
  - `ligneId` et `modifieLe` sont ceux de la ligne la plus récente (le
    dernier usage) ;
  - les propositions se trient par `degreDeCorrespondance`, puis la plus
    récente d'abord ;
  - **les clés se calculent une fois par lecture de la mémoire** : un
    `WeakMap` sur le tableau des lignes (W-12 : 2,3 ms pour 500 lignes sans
    cache, sous `node`) ;
  - toujours **aucune moyenne, aucune médiane, aucun minimum, aucun
    maximum** (`verifier-devis`, `:3482-3483`).
- `valeursDeLaSuggestion(s)` ne change pas (devis.js:1090-1101) : elle
  recopie la phrase, l'unité, la fourniture, la main-d'œuvre et
  `prixUnitaireCentimes` s'il est > 0 — c'est-à-dire `prix[0]`.
- `devis.js` n'écrit toujours jamais « € » (`verifier-devis`, `:1093-1095`).
- `origineDeSuggestion` (devis.js:1030-1044) **n'est PAS utilisée par la
  base de postes** (C6) : elle reste la fonction de la mémoire.

**Ce que cela change dans `verifier-devis` — [final] MESURÉ X-16**, en
jouant le contrôle entier sur une copie du dépôt (`git init`, `node_modules`
lié) dont seuls `devis.js` (la mémoire FINALE ci-dessus) et `rapprochement.js`
(le miroir final) ont changé : **292 vérifications vertes avant ; 287 après,
et exactement quatre rouges, toutes attendues** — les mêmes que pour la v3
(W-8) :

| vérification (ligne) | aujourd'hui | final |
|---|---|---|
| A-4, « 50 € et 70 € → DEUX suggestions » (`:614-616`) | deux suggestions | **une** proposition, `prix` = [7 000, 5 000] — toujours aucune ne vaut 60 € |
| A-4, « trois prix au plus par phrase, chacun avec son devis d'origine » (`:624-628`) | trois suggestions | **une** proposition, `prix` = [4 000, 3 000, 2 000], chaque prix avec son origine ; l'origine du groupe est celle de 4 000 (« Devis 11 ») |
| A-7, « la mémoire de démonstration, sur « chape », rend TROIS entrées » (`:993-995`) | 45, 52, 38 | **deux** propositions : [5 200, 4 500] et [3 800 « fourniture non comprise »] |
| B, « `devis.js` importe EXACTEMENT … deux instructions » (`:1076-1082`) | deux | **trois**, la troisième nommée : `./rapprochement.js` (`cleDeRapprochement`, `aPlat`) |

Les cas « au m² et au forfait AU MÊME PRIX → deux », « avec et sans
fourniture → deux (« faience ») », l'origine d'un devis venu d'une demande,
« la ligne en cours n'y est pas », la ligne offerte (une seule ligne offerte
à 150 € : `offert` vrai, 15 000 recopiés), « une ligne offerte à 0 ne
recopie rien », « un texte vide ne propose rien » **restent verts sans
changement** (X-16). Les trois vérifications qui rougissent sont RÉÉCRITES à
l'étape 3 avec leur nouvel attendu et la phrase qui dit pourquoi (la
réponse 2), pas retirées ; et A-4 gagne les cas de §3.3 (28 à 33, 39, 41).

### 3.2 `src/lib/postes.js` — nouveau, n'importe que `./devis.js`, `./centimes.js`, `./entreprise.js` et `./rapprochement.js`

Quatre fichiers purs. `postes.js` n'écrit jamais « € » lui-même : il passe
par `centimesLisibles` (src/lib/centimes.js:73-80). Jamais `Math.round`,
`toFixed`, `parseFloat`, ni moyenne, ni minimum, ni maximum (la règle de
`verifier-devis` `:3457-3487`, étendue à ce fichier). Aucun des mots
« conseillé », « recommandé », « moyen », « moyenne », « marché »,
« habituel », « aligner », « prix juste » dans ce fichier ni dans les écrans
de la base (CD12). Ni `normalize`, ni `toLowerCase`, ni `localeCompare` : la
clé suffit. **Le prototype des fonctions marquées [final] est
`lotP/final/proto-postes.mjs`** (MESURÉ X-17).

| fonction | ce qu'elle rend |
|---|---|
| `POSTES_MAX` | 1 000 (= `v_plafond_postes` = le nombre de la phrase d'`OP018`, chiffres seuls) |
| `LIMITE_LECTURE_API` | 1 000, la limite de lecture par défaut de l'API de Supabase (SUPPOSÉE pour ce projet, relevée à l'étape 10) ; le contrôle exige `POSTES_MAX <= LIMITE_LECTURE_API` (CB1) |
| `CONTRAINTES_POSTE` | les noms de §2.3, dans l'ordre alphabétique : `designation`, `prix`, `prix_date`, `rapprochement`, `unite` |
| `nettoyerPoste(v)`, `validerPoste(v)` | le miroir des contraintes, dans le même ordre : `{ ok, contrainte, champ }` ; une phrase dont la clé est vide → `base_poste_rapprochement_check`, APRÈS le prix ; **[final]** une phrase de plus de 2 000 points de code → `base_poste_designation_check` (la garde rend `null`, la contrainte de la clé se tait — comme la base, X-12) |
| **[final]** `postesPrepares(postes)` | les postes avec leur `cle` (`cleDeLigne`), calculés UNE fois par tableau (`WeakMap`) ; deux appels sur le même tableau rendent le MÊME objet (CP8) |
| `posteDeLaLigne(ligne, postes)` | le poste de même `cleDeLigne`, ou `null` ; deux postes de même clé → le plus récemment modifié |
| `etatDansLaBase(ligne, postes, etat)` | cinq états : `'sans_objet'` (titre, réserve, phrase ou unité manquante, clé vide) ; `'en_lecture'` ; `'illisible'` ; `'ajoutable'` ; `'dans_la_base'` — avec `sous` (ci-dessous) |
| **[final]** `formeVisible(phrase)` | la phrase, blancs (U+0009–U+000D, U+0085, U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, l'espace) ramenés à UNE espace, caractères invisibles et de format retirés (U+00AD, U+180E, U+200B–U+200F, U+202A–U+202E, U+2060–U+2064, U+2066–U+2069, U+FE00–U+FE0F, U+FEFF), bords rognés (T21, CE3-16) |
| **[final]** `sousQuelPoste(ligne, poste)` | la phrase du POSTE si `formeVisible` des deux phrases diffère, sinon `null` |
| `referenceDuPoste(ligne, postes, { regimeDeclareLe })` | `null`, ou `{ poste, reference, unite, fixeLe, avantRegime, mainOeuvre, sous }` quand un poste de même clé a un prix de référence fixé ; `avantRegime` = `fixeLe` antérieur à `regimeDeclareLe` (T9, CD13) |
| `phraseReference(r)` | « Votre prix de référence : 45,00 € / m², fixé le 14/10/2026. » ; **[final]** avec `sous` : « Votre prix de référence pour « Dépose fenêtre » : 300,00 € / forfait, fixé le 14/10/2026. » (CE3-7) ; à l'heure : « Votre taux horaire de référence… » ; si `avantRegime` : « …, avant la déclaration de votre régime de TVA actuel : vérifiez-le. » **Commence toujours par « Votre »** (CD12) |
| `ecartAuPoste(ligne, postes, opts)` | `null`, ou `{ …référence, prix }` quand la ligne est un poste ou une option, NON offerte, avec un prix entier > 0, sa référence existe, et les deux prix diffèrent, dès le premier centime (T13) |
| `phraseEcart(e)` | « Vous mettez 52,00 € — c'est voulu ? » (PROP:101). Si `avantRegime` : `null` (T9). Libellé VoiceOver : la phrase ENTIÈRE, « Votre prix de référence est 45,00 € le mètre carré, vous mettez 52,00 € : c'est voulu ? » |
| **[final]** `PHRASE_SORTIE` | « Ce n'est pas le même travail ? Changez un mot de la ligne : elle ne sera plus rapprochée de ce poste. » — montrée par le bloc et par la feuille dès que `sous` n'est pas `null` (CE3-7, CE3-8) |
| `posteDepuisLaLigne(ligne)` | `{ designation, unite, fournitureNonComprise, mainOeuvre, prixPropose }` : le prix de la ligne si > 0, la VALEUR d'une ligne offerte si > 0, sinon `null` ; jamais « Offert », jamais la quantité, jamais le taux (Q2 a) |
| `posteExistant(valeurs, postes)` | le poste de même `cleDeLigne` que ce qu'on s'apprête à ajouter, ou `null` — **[final]** recalculé à CHAQUE rendu de la feuille (§4.6) |
| `consequenceDeLaCorrection(poste, nouvellePhrase, postes)` | `'aucune'` (même clé), `'detache'` (autre clé, libre), `'doublon'` (la clé d'un AUTRE poste de même unité et fourniture, avec ce poste) — T14 |
| **[final]** `valeursDeLaProposition(s)` | ce qu'un appui recopie : pour la mémoire, `valeursDeLaSuggestion(s)` ; pour la base, la phrase, l'unité, la fourniture, la main-d'œuvre, et `prixUnitaireCentimes` = le prix de référence s'il est fixé, **sinon le dernier prix utilisable de même clé (`dernierPrix`, CE3-3)**, sinon `null` (T10). Remplace le `valeursDuPoste` de la v3 |
| `prixAEcrire(valeurs)` | la chaîne du prix s'il y en a un, **`null` sinon — et `null` veut dire « ne touchez pas au champ »** (T10, CE21) |
| **[final]** `postesProches(postes, valeurs)` | les postes de MÊME clé de rapprochement mais d'une AUTRE unité ou fourniture, deux au plus — la vraie confusion (m² et forfait) ; plus de « phrase plus longue » (CE3-15) |
| **[final]** `suggestionsPourLaFrappe({ postes, memoire, texte, idLigne, max = 3 })` | une liste unique, **une proposition par clé** : les postes qui correspondent (un par clé, `postesPrepares`), chacun avec son `degre`, son `dernierUsage` (la ligne de mémoire la plus récente de même clé, hors `idLigne`) et son `dernierPrix` ; la mémoire, **sans aucune proposition dont la clé est celle d'un poste** ; **le tri unique de T19** ; trois au plus ; chaque élément porte `source: 'base' \| 'memoire'` et `cle` |
| **[final]** `detailDeSuggestion(s)` | UNE ligne (T23) : base avec prix « 45,00 € / m² · réf. du 14/10/2026 » ; base sans prix, avec un dernier prix « sans réf. · dernier : 45,00 € / h » ; base sans aucun prix « votre base, sans prix de référence » ; mémoire : « 52,00 € / m² » (+ « (offert) », + « · fourniture non comprise ») puis — aucun autre prix : « · <origine> » ; un autre prix sans fourniture : « · aussi 45,00 € » ; sinon « · +k prix » |
| **[final]** `libelleDeSuggestion(s)` | préfixe COMMUN « Reprendre : » (CE4), **le prix recopié d'abord** (CE3-11) : mémoire « Reprendre : <phrase>, par <unité>[, fourniture non comprise], au prix de 52,00 €[ (offert)], déjà écrit dans <origine>[ ; aussi écrit à 45,00 € et 50,00 €] » ; base « …, de votre base, prix de référence 45,00 €, fixé le 14/10/2026 » ou « …, de votre base, sans prix de référence[, au dernier prix écrit 45,00 €] » |
| `indicesDuClient(phrase, { client, lieu })` | (CD3) la liste des indices, vide si rien — les mots comparés sont ceux de la CLÉ ; l'indice affiché reprend le mot de la FICHE, jamais la clé (W-14) |
| `libelleOrigine(poste)` | « Ajouté le 14/10/2026 depuis un de vos devis » si `devisOrigineId`, sinon « Ajouté le 14/10/2026 » |
| `ligneDescriptive(poste)` | « Unité : mètre carré · fourniture non comprise · main-d'œuvre » — le `nom` de `UNITES` (devis.js:77-85) |
| `etiquettePrixReference(poste, regime)` | « Prix de référence HT » / « Prix de référence » ; à l'heure : « Taux horaire de référence (HT) » / « Taux horaire de référence » ; un régime en échec ou inconnu ne dit pas « HT » |
| `changementDUnite(avant, apres)` | la phrase de T11, ou `null` |
| `trierPostes(postes)` | pour la page : par `aPlat(phrase)` puis `id` — une comparaison de chaînes, pas `localeCompare` |

**Pourquoi la base passe d'abord, à pertinence égale** : son prix est une
décision ; la mémoire est un souvenir. **[final] Mais plus avant une phrase
qui COMMENCE par ce qu'on tape** (CE3-4) : « la base d'abord » ne doit pas
faire passer un poste trouvé par le seul pluriel devant ce que l'artisan
cherche.

### 3.3 Les cas de bord, et leurs résultats attendus

Les cas 1 à 40 sont ceux de la v3 ; **[final]** 13, 28, 33 et 37 changent, et
41 à 51 sont nouveaux (MESURÉS X-17 sur le prototype). Les cas de la clé
elle-même sont dans `cas-rapprochement.json` (§3.0.5), pas ici.

| # | entrée | attendu |
|---|---|---|
| 1 | ligne « Chape sèche avant carrelage collé », m², 52,00 €, poste même clé à 45,00 € fixé le 14/10/2026 | `phraseReference` : « Votre prix de référence : 45,00 € / m², fixé le 14/10/2026. » ; `phraseEcart` : « Vous mettez 52,00 € — c'est voulu ? » |
| 2 | même ligne à 45,00 € | référence, pas d'écart |
| 3 | même ligne à 44,99 € | écart |
| 4 | même ligne offerte | référence, pas d'écart |
| 5 | même phrase au forfait, poste au m² | ni référence ni écart ; la ligne est « ajoutable » |
| 6 | même phrase, fourniture non comprise sur la ligne, pas sur le poste | ni référence ni écart |
| 7 | poste sans prix de référence | ni référence ni écart ; `etatDansLaBase` = `'dans_la_base'` |
| 8 | ligne sans prix | référence, pas d'écart |
| 9 | phrase de la ligne avec un U+00A0 ou un U+200B en bord | même clé que le poste ; **[final]** `sous` = `null` |
| 10 | « chape sèche… » contre « Chape sèche… » | même clé ; `'dans_la_base'`, avec `sous` = « Chape sèche avant carrelage collé » ; la référence s'affiche et nomme le poste ; pas d'« Ajouter » |
| 10 bis | les cinq variantes de V-CB3 | une seule clé ; toutes `'dans_la_base'` ; la base refuse quatre ajouts sur cinq (23505, essai cas 7) ; **[final]** `sous` `null` pour l'espace insécable et le double espace, non nul pour la casse ; la forme décomposée : non nul (dit, T21) |
| 11 | ligne de type `reserve`, `zone`, `piece` | `'sans_objet'`, rien |
| 12 | ligne de type `option` | écart possible |
| 12 bis | la base pas encore lue | `'en_lecture'` |
| 13 | **[final]** démonstration, « chape » | `[base 45,00 € (réf.), mémoire 38,00 € fourniture non comprise]` — deux propositions ; la mémoire à 52,00 € et 45,00 € a la clé du poste, elle se tait (X-17) |
| 14 | quatre postes correspondent | trois postes, aucune mémoire |
| 15 | « seche chape » | trouve « Chape sèche avant carrelage collé », dans la base ET dans la mémoire |
| 16 | `valeursDeLaProposition` d'un poste sans prix et sans dernier prix ; `prixAEcrire` du résultat | `prixUnitaireCentimes` `null`, jamais `tauxTvaCentiemes`, `offert`, `quantiteMilliemes` ; **`prixAEcrire` rend `null`** ; pour la mémoire, une ligne offerte à 0 aussi |
| 17 | `posteDepuisLaLigne` d'une ligne offerte à 150,00 € | `prixPropose` 15000, pas d'« Offert » ; offerte à 0 → `null` |
| 18 | `validerPoste` | U+200B seul → designation ; 2 001 caractères → designation ; 2 000 caractères de 4 octets → ok ; « ml » → unite ; unité absente → unite ; 0, −1, 10^10 → prix ; phrase vide + « ml » → designation ; « — » → rapprochement ; « — » + « ml » → rapprochement ; « — » + prix 0 → prix ; U+3000 seul → rapprochement ; **[final]** U+3164 seul, U+FE0F seul → rapprochement |
| 19 | `changementDUnite` m² → forfait, quantité 27 000 millièmes | « L'unité est passée de m² à forfait : la quantité 27 est restée, vérifiez-la. » ; sans quantité → `null` |
| 20 | « fixé le » d'un horodatage à 00 h 30 à Paris | la date du jour à Paris, dans les trois fuseaux de `verifier-devis` (`:1099`) |
| 21 | `POSTES_MAX`, `v_plafond_postes`, la phrase d'`OP018`, `LIMITE_LECTURE_API` | le même nombre, et `POSTES_MAX <= LIMITE_LECTURE_API` |
| 22 | poste fixé le 01/09/2026, régime déclaré le 03/10/2026 | `avantRegime` vrai ; la phrase « … avant la déclaration de votre régime de TVA actuel : vérifiez-le. » ; `phraseEcart` `null` ; régime déclaré le 01/08 → faux ; `regimeDeclareLe` absent → faux |
| 23 | `indicesDuClient`, client « Mme Fictive Durandal », « 4 rue des Essais », « 06 12 34 56 78 » | les mêmes six résultats que la v2, calculés par la clé (W-14) |
| 24 | `libelleOrigine` | avec lien : « Ajouté le 14/10/2026 depuis un de vos devis » ; lien vidé : « Ajouté le 14/10/2026 » ; jamais un mot de l'objet d'un devis |
| 25 | vocabulaire | `phraseReference` commence par « Votre » ; aucune phrase de `postes.js` ne contient un mot interdit (§3.2) |
| 26 | `ligneDescriptive`, `etiquettePrixReference` | les sept unités par leur `nom` ; un poste à l'heure, main-d'œuvre, au réel : « Taux horaire de référence (HT) » ; en franchise : « Taux horaire de référence » |
| 27 | `detailDeSuggestion` d'un poste de la base | « 45,00 € / m² · réf. du 14/10/2026 » : tient sur une ligne à 320 points (X-20) |
| 28 | **[final]** mémoire : « Seuil de porte en aluminium (…) » à 25,00 € (il y a deux heures) et « Seuils de porte en aluminium (…) » à 23,00 € (il y a trois jours) | **une** proposition, titrée par la phrase la plus RÉCENTE, `prix` = [2 500, 2 300], chacun avec son origine ; `detailDeSuggestion` : « 25,00 € / u · aussi 23,00 € » (X-17) |
| 29 | mémoire : la même phrase à 50 et 70 € | une proposition, 70 € recopié par un appui, 50 € dans `prix` — jamais 60 € |
| 30 | mémoire : la même phrase écrite deux fois au même prix, dont une variante | une proposition, un prix |
| 31 | un poste et une ligne de mémoire de même clé, à des prix différents | seul le poste apparaît (T19) |
| 32 | « Dalles », « beton », « BETON », « carrelages » | trouvent « Dalle béton… » / les « béton » / les « carrelage » (X-17, X-18) |
| 33 | **[final]** « Pos » sur les postes de démonstration | « Pose d'un meuble vasque », « Pose de faïence murale » (sans réf., « dernier : 45,00 € / h »), « Pose de plinthes carrelées » — **jamais « Dépose » en tête** (la v3 l'y mettait, CE3-4) (X-17, S1) |
| 34 | une ligne « — » (clé vide) | `'sans_objet'` ; aucune proposition ne la ramène |
| 35 | `posteExistant` de « chapes seches avant carrelage colle », m², devant le poste « Chape sèche… » m² | ce poste ; au forfait → `null` |
| 36 | `consequenceDeLaCorrection` : « Chape sèche… » → « CHAPES SÈCHES… » ; → « Chape sèche fibrée… » ; → la phrase d'un autre poste à la même unité | `'aucune'` ; `'detache'` ; `'doublon'` avec ce poste |
| 37 | **[final]** `postesProches` pour « Chape sèche avant carrelage collé » m², la base ayant la même au forfait, « Chape sèche avant carrelage collé, fibrée » m², et le poste lui-même | **le seul poste au forfait** (même clé, autre unité) ; jamais la phrase plus longue, jamais le poste de même clé complète |
| 38 | deux postes de même clé JavaScript (base incohérente, fabriquée) | une seule proposition, le plus récemment modifié |
| 39 | `avertissementDelai` : « indicatif », « INDICATIFS », « délai indicatif. » | les trois avertissent, comme aujourd'hui (et sans `normalize`) |
| 40 | le miroir : `cleDeRapprochement(null)`, `aPlat(null)` ; `aPlat("Chapes")` ; **[final]** `cleDeRapprochement('a'.repeat(2001))` | `null`, `null` ; `chapes` ; `null` |
| 41 | **[final]** (CE3-2) mémoire : 45 € (il y a 72 h), 52 € (2 h), la même phrase SANS prix (6 min) ; « chape » | une proposition, `prix` = [5 200, 4 500], titre de la ligne de 6 min ; un appui recopie **52 €** ; « 52,00 € / m² · aussi 45,00 € » (X-17, S2) |
| 42 | **[final]** (CE3-3) démonstration, « faience » | 1) « Faïence murale, forfait… » 900,00 € (réf.) ; 2) « Pose de faïence murale » « sans réf. · dernier : 45,00 € / h » ; un appui sur la seconde recopie **45 €** (X-17, S3) |
| 43 | **[final]** (CE3-4) postes « Plan de travail posé sur tasseaux », « Ragréage autolissant après pose du primaire », « Faïence…, forfait pour… » ; mémoire « Pose de carrelage mural 30x60 » ; « Pos » | 1) la mémoire « Pose de carrelage… » (degré 4) ; puis les deux postes de degré 3 ; jamais « … pour une salle d'eau » (X-17, S5) |
| 44 | **[final]** (CE3-4) quatre « Chape » dans la base ; la sèche servie il y a une heure, la fibrée il y a 300 h ; « chape » | « Chape sèche… », puis « Chape fibrée… », puis « Chape anhydrite… » (dernier usage, puis l'ordre à plat) (X-17, S6) |
| 45 | **[final]** (CE3-1) « Les », « Aux », « Sas », « Mes », « Pas », « oss » sur la démonstration | **0** proposition ; « Des » → 1 (« Évacuation des gravats… », comme le lot 1) ; « Évacuation des » trouve « Evacuation de gravats » ; « sous » ne trouve pas « soufflage », « Cons » ne trouve pas « contre-cloison » (X-17, X-18) |
| 46 | **[final]** (CE3-7) ligne « Dépose fenêtres », forfait, 900 € ; poste « Dépose fenêtre », forfait, 300 € | même clé ; `phraseReference` : « Votre prix de référence pour « Dépose fenêtre » : 300,00 € / forfait, fixé le … » ; écart ; `sous` non nul ; `PHRASE_SORTIE` montrée |
| 47 | **[final]** (CE3-11) `libelleDeSuggestion` de « seuils » (avec la ligne « Seuils » à 23 € de la démonstration) | « Reprendre : Seuil de porte en aluminium (fourniture seule, sans pose), par unité, au prix de 25,00 €, déjà écrit dans Sol du séjour ; aussi écrit à 23,00 € » (X-17) |
| 48 | **[final]** (CE3-16) la phrase du poste « Chape sèche… » écrite avec une espace insécable au milieu et un U+200B à la fin ; puis « Depose de l'ancien carrelage au sol » devant le poste « Dépose de l'ancien carrelage au sol » | `sous` `null` ; puis `sous` = « Dépose de l'ancien carrelage au sol » (X-17) |
| 49 | **[final]** (CE3-10) `detailDeSuggestion` | deux autres prix → « 52,00 € / m² · +2 prix » ; « fourniture non comprise » + un autre prix → « 38,00 € / m² · fourniture non comprise · +1 prix » ; offert + un autre → « 180,00 € / forfait (offert) · aussi 150,00 € » ; sans aucun prix → « votre base, sans prix de référence » ; un seul prix, sans autre → l'origine du lot 1 |
| 50 | **[final]** (CP8) `postesPrepares(p)` deux fois sur le même tableau | le MÊME objet (`===`) |
| 51 | **[final]** (CE3-12, CE3-14) le balayage : la mémoire de démonstration, les trois lignes de §4.3, et quatre variantes par ligne (majuscules, minuscules, s final, accents retirés) ; chaque début de mot de trois lettres et plus de chaque phrase rangée (468 textes) | au plus **3** propositions, **0** clé en double, **0** mémoire de la clé d'un poste, **0** titre qui ne soit pas une phrase RANGÉE octet pour octet, `valeursDeLaProposition(s).designation === s.designation`, `prix` ≤ 3, distincts, tous > 0 ; et le témoin : « Pos » → **exactement 3** (X-17) |

---

## 4. L'application

### 4.1 `src/lib/erreurs.js`

- Dans `MESSAGES_CONTRAINTE` (une phrase par nom, qui commence par une
  minuscule, src/lib/erreurs.js:55-58) :
  - `base_poste_designation_check` : « la phrase du poste est vide ou
    dépasse 2 000 caractères : écrivez-la, ou raccourcissez-la. » —
    **[final]** c'est aussi la phrase d'une désignation de plus de 2 000
    points de code, que la garde de la clé laisse sans clé (§3.0.4) : la
    contrainte de la clé se tait, celle de la phrase parle (X-12, F6) ;
  - `base_poste_prix_check` : « un prix de référence s'écrit au centime,
    entre 0,01 € et 99 999 999,99 €. Pour ne pas en fixer, laissez le
    champ vide. »
  - `base_poste_prix_date_check` : « la date du prix de référence est posée
    par la base : mettez Opus à jour, puis réessayez. »
  - `base_poste_rapprochement_check` : « la phrase du poste ne contient ni
    lettre ni chiffre : écrivez ce que vous faites, puis ajoutez-la. »
  - `base_poste_unite_check` : « un poste a toujours une unité, une des sept
    de vos devis : choisissez-la sur la ligne, puis ajoutez-la. »
  - **[final]** `idx_base_postes_rapprochement` (le 23505 se reconnaît au
    nom de l'index, src/lib/erreurs.js:702-707) : « ce poste est déjà dans
    votre base, sous une phrase presque identique — même unité, même
    fourniture. Son prix de référence se change depuis la ligne (« Changer
    ma référence ») ou dans « Ma base de postes ». » La feuille d'ajout ne
    s'en contente pas : elle MONTRE le poste (§4.6). **L'ancien nom
    `idx_base_postes_cle` n'apparaît nulle part** — ni dans `src/`, ni dans
    `schema.sql`, ni dans la démonstration (CP6) ; `verifier-postes` B le
    refuse.
- `428C9` (une valeur envoyée dans une colonne que la base calcule
  elle-même — seul un client modifié ou en retard l'envoie) : « Opus a envoyé
  une valeur que la base calcule elle-même : mettez Opus à jour, puis
  réessayez. » Jamais le texte anglais de PostgreSQL.
- `REFUS_POSTES` : la phrase d'`OP018` recopiée OCTET POUR OCTET de la
  section 50 (« 1 000 », espace ordinaire), et `MODIFIE_ENTRE_TEMPS` (§2.9).
  `messageClair` rend `OP018` tel quel (src/lib/erreurs.js:476-487).
- `ErreurPoste` : l'erreur du « modifié entre-temps », déjà en français,
  rendue telle quelle par `messageClair` (comme `ErreurAssistant`,
  src/lib/erreurs.js:488-493).

### 4.2 `src/lib/api.js` — hors de la file du devis

Un poste n'est pas une ligne du devis : il ne passe PAS par la file
d'écriture (qui ne connaît que `quoi: 'devis' | 'ligne'`, api:2728). Ses
quatre fonctions tiennent le même contrat, sauf l'horloge, remplacée par la
condition de §2.9 : une requête à la fois, un délai de 8 s et une annulation
sur chacune (le modèle de `lectureDevis`, api:2684-2696), **jamais
d'`upsert`** (§2.4), une lecture qui échoue LÈVE (jamais une liste vide),
avec `baseEnRetard` quand la table manque (`leverLecture`, api:2703-2706).

| fonction | requête |
|---|---|
| `mesPostes()` | **[v2]** `from('base_postes').select('id, designation, unite, fourniture_non_comprise, main_oeuvre, prix_reference_centimes, prix_fixe_le, devis_origine_id, created_at, modifie_le', { count: 'exact' }).eq('pro_id', currentUserId).order('id').limit(POSTES_MAX)` — **aucun plongeon dans `devis`** (CB2, CD7) ; filtrée par l'entreprise CÔTÉ BASE, jamais par la seule RLS (CLAUDE.md l.8350) ; rend `{ postes, incomplete: count > postes.length }` (CB1) |
| `ajouterPoste(valeurs, { devisOrigineId })` | `insert({ pro_id, designation, unite, fourniture_non_comprise, main_oeuvre, prix_reference_centimes, devis_origine_id }).select(…).single()` ; une 23503 qui nomme `base_postes_devis_origine_fkey` → une seconde fois sans le lien |
| `modifierPoste(id, changements, { modifieLe })` | `update(changements).eq('id', id).eq('modifie_le', modifieLe).select(…)` ; zéro ligne → `ErreurPoste` |
| `retirerPoste(id, { modifieLe })` | `delete().eq('id', id).eq('modifie_le', modifieLe).select('id')` ; zéro ligne → `ErreurPoste` |
| `monRegimeEtSaDate()` | **[v2]** (CD13) la même lecture que `monRegime()` (api:3044-3052, par `monEmetteur`), qui rend `{ regime, declareLe }` ; `monRegime()` reste, et la rend tronquée : les cinq états du régime ne changent pas. Aucune lecture nouvelle des tables de l'émetteur |

- Chaque fonction : **deux fonctions nommées, et le choix à la fin**
  (`mesPostesSupabase`, `mesPostesDemo`, `export const mesPostes = hasSupabase ? mesPostesSupabase : mesPostesDemo;`),
  déclarées APRÈS `const noop` (CLAUDE.md, le piège Metro et le
  `ReferenceError` du 04/10).
- `posteVersBase` n'envoie que les colonnes que l'artisan écrit : jamais
  `id`, `created_at`, `modifie_le`, `prix_fixe_le`, **[v3]** ni
  `cle_rapprochement` (428C9) ; `pro_id` à la création seulement. Et
  `mesPostes` ne LIT pas `cle_rapprochement` (T18) : l'application calcule la
  clé d'un poste par `cleDeLigne`, comme celle d'une ligne. `rowToPoste` traduit en camelCase et garde `modifieLe` comme
  la CHAÎNE reçue (elle repart telle quelle dans la condition).
- **Aucune autre fonction n'écrit `base_postes`**, sous aucune forme de
  chaîne (guillemets simples, doubles, gabarit, constante) : §6.1 D.
- **[v2] Pourquoi `order` et `count`** (CB1) : l'API de Supabase coupe
  chaque réponse à sa limite de lignes (1 000 par défaut, SUPPOSÉ pour ce
  projet), **sans erreur**. Le projet n'avait jamais lu plus de 500 lignes
  d'un coup (`MEMOIRE_MAX = 500`, `PLAFOND_LISTE = 200`, devis.js:207-209) ;
  le lot P lit exactement la limite par défaut. Sans ordre, une base
  au-delà de la limite rendrait 1 000 postes pris au hasard ; sans compte,
  rien ne le dirait. Avec les deux : une liste déterministe, et
  `incomplete` vrai si le plafond est un jour relevé au-dessus de la limite,
  ou si la limite du projet est plus basse qu'on ne le croit.
- **La lecture pèse** (MESURÉ par la critique base) : 337 473 octets pour
  1 000 postes réalistes, 8,4 Mo au pire permis (1 000 phrases de 2 000
  caractères de quatre octets). La saisie la demande à la première carte
  chiffrée, une fois par session ; la page la relit à chaque ouverture.

### 4.3 La démonstration fait VIVRE le mécanisme

Dans `creerBaseDevisDemo` (src/data/devis-demo.js:309-591), une réserve de
postes du compte `moiEnDemo()`, avec les miroirs de la base : refus dans
l'ordre alphabétique, avec les noms de la base (`refusCheck('base_postes', …)`,
le modèle de devis-demo.js:252-277) ; **[final]** le 23505 nommé
`idx_base_postes_rapprochement`, sur la clé COMPLÈTE (`cleDeLigne`), donc
aussi pour une variante d'un poste existant ; la clé vide refusée par
`base_poste_rapprochement_check` ; **[final]** une phrase de plus de 2 000
points de code refusée par `base_poste_designation_check` (la garde du
miroir rend `null`) ; `OP018` avec la phrase de `REFUS_POSTES` ; la
condition sur `modifieLe` ; `id` et `proId` figés ; les dates posées par la
base de démonstration ; un lien d'origine accepté seulement vers un devis du
même compte ; un devis supprimé vide le lien sans toucher `modifieLe` ;
appartenance comparée par `String()` (le piège des trois `===`,
devis-demo.js:56-58) ; **[final]** une requête de postes à la fois (la
seconde attend la première, comme sur la vraie base où l'on ne parallélise
pas les écritures d'un même artisan), pour que le chemin du 23505 se
produise sans `.env` (CE3-6).

**Une pause NOMMÉE** : les lectures et écritures de démonstration des postes
passent par `PAUSE_POSTES_DEMO` (le modèle de `PAUSE_ECRITURE_DEMO`,
api:2769), qu'un script allonge pour produire « Lecture impossible » et
« Pas enregistré » (au-delà de 8 s), l'état `'en_lecture'`, et **[final]** la
course du chemin « ce poste existe déjà » (5 s, sous le délai de 8 s).
« Modifié entre-temps » ne se produit pas en démonstration : c'est dit, et il
est éprouvé par §6.1 G sous `node` et sur la vraie base (§7.5).

**Le jeu de départ, huit postes, sans le mot « chape » ailleurs que dans le
premier**. Les prix sont INVENTÉS, jamais ceux des devis du propriétaire :

| poste | ce qu'il fait voir |
|---|---|
| « Chape sèche avant carrelage collé », m², 45,00 €, fixé il y a dix jours, depuis le devis « Rénovation salle de bains » | la référence sur la ligne du devis 1 (45,00 €, pas d'écart) ; **l'écart** sur la ligne du devis « Sol du séjour » (52,00 €, devis-demo.js:221-224) ; la base en tête sur « chape », qui MASQUE la mémoire à 52 € et 45 € (cas 13) ; « Ajouté le … depuis un de vos devis » |
| « Pose de faïence murale », heure, main-d'œuvre, **prix non fixé** | « Dans votre base, sans prix de référence » et « Fixer le prix » sur la ligne de faïence du devis 1 (12 h à 45,00 €, devis-demo.js:186-189) ; **[final]** sa proposition dit « sans réf. · dernier : 45,00 € / h » et un appui recopie 45 € (cas 42, CE3-3) |
| « Faïence murale, forfait pour une salle d'eau complète », forfait, 900,00 € | **le chemin de T11** : sur la ligne de faïence (12 h), retaper « faïence » et choisir ce poste → « L'unité est passée de heure à forfait : la quantité 12 est restée, vérifiez-la. » |
| « Ragréage autolissant fibré sur plancher bois, après pose d'un primaire d'accrochage et d'une bande périphérique, épaisseur moyenne 5 mm, nettoyage compris », m², 28,00 € | la troncature à trois lignes dans la page, la phrase entière dans la feuille |
| « Dépose de l'ancien carrelage au sol », m², 18,00 €, lien vide | « Ajouté le … » sans origine (le devis a été supprimé) ; **[final]** le poste que la ligne « Depose… » ci-dessous fait reconnaître |
| « Pose de plinthes carrelées », mètre linéaire, 12,00 €, fixé il y a quarante jours | **le régime** : le régime de démonstration est déclaré il y a vingt jours (`src/data/emetteur-demo.js:76`) → « … avant la déclaration de votre régime de TVA actuel : vérifiez-le. » dans la page |
| « Pose d'un meuble vasque », unité, fourniture non comprise, 180,00 € | la ligne du devis 1 (devis-demo.js:194-197) est « dans la base », sans écart ; la page montre « fourniture non comprise » |
| « Dalle béton armé, épaisseur 12 cm, sur hérisson », m², 85,00 € | **le protocole de la réponse 2** : taper « Dalles » (ou « beton ») sur une ligne neuve la propose ; aucune ligne de démonstration ne la porte |

**[final] Trois lignes de démonstration de plus, toutes dans le devis
« Sol du séjour »** (CE3-13, adapté). La v3 posait la ligne « Seuils » dans
le devis 1 en écrivant « à vérifier qu'aucun contrôle ne l'écrit en dur » ;
**il y en a un** : `scripts/mesure-devis.mjs:491` exige EXACTEMENT quatre
postes chiffrés dans « Rénovation salle de bains » (LU). Le devis 2 n'est
compté par personne : son total est recalculé (`ttcSejour`,
`scripts/mesure-devis.mjs:139`, et `verifier-devis` A-7 le refait par
`totauxDevis`, `scripts/verifier-devis.mjs:970-973`). Chacune respecte la
règle écrite en tête des lignes (« toujours au plus l'horloge du devis »,
devis-demo.js:179-182 ; l'horloge du devis 2 est à deux heures,
devis-demo.js:153-155) :

| rang, âge | ligne | ce qu'elle fait voir |
|---|---|---|
| 4, il y a 2 h 04 | « Seuils de porte en aluminium (fourniture seule, sans pose) », u, 1, **23,00 €**, 20 % | avec la ligne 3 à 25,00 € (devis-demo.js:229-232, il y a 2 h 01), **un regroupement de deux orthographes** : « seuils » → UNE proposition, titrée « Seuil de porte… » (la plus RÉCENTE), « 25,00 € / u · aussi 23,00 € », un appui recopie 25 € ; VoiceOver dit « au prix de 25,00 € » avant « aussi écrit à 23,00 € » (cas 28, 47) ; et, plus tard dans `mesure-devis`, **le chemin « ce poste existe déjà »** (§7.3) |
| 5, il y a 2 h 00 min 30 s | « Depose de l’ancien carrelage au sol » (sans accent), m², 24, **20,00 €**, 10 % | **une ligne EXISTANTE variante d'un poste** : en l'ouvrant, « Votre prix de référence pour « Dépose de l’ancien carrelage au sol » : 18,00 € / m², fixé le … », puis le bloc « Ce poste existe déjà dans votre base, sous « Dépose de l’ancien carrelage au sol ». », la phrase de sortie, et l'écart « Vous mettez 20,00 € — c'est voulu ? » (CE3-6, CE3-7) ; pas d'« Ajouter à ma base » |
| 6, il y a 2 h 00 | « evacuation des gravats en dechetterie » (tapée vite), forfait, 1, **180,00 €**, 10 % | **un regroupement VISIBLE** (l'orthographe change sous les yeux) : « gravats » → UNE proposition, titrée par cette phrase (la plus récente), « 180,00 € / forfait · aussi 150,00 € » — la valeur de la ligne offerte du devis 1 (devis-demo.js:205-208) ; c'est la règle de la phrase la plus récente, et sa conséquence, que le propriétaire voit sans `.env` (CE3-9, question B du §1.7) |

**MESURÉ X-17** (`lotP/final/sonde-final-placement.mjs`, exactement ce
placement, sur le prototype et la vraie mémoire de démonstration) : les trois
résultats ci-dessus, et « Pos » → les trois « Pose » ; « chape » → la base à
45 € puis la mémoire à 38 € « fourniture non comprise ».

**La ligne SANS PRIX en tête d'un groupe (CE3-2) n'est pas une donnée de
démonstration** : une ligne sans prix rangée d'office dans un devis de
démonstration y laisserait une ligne incomplète. `mesure-devis` la TAPE
dans « Sol du séjour » (§7.3), la mesure, puis la retire.

Et ce qui existe déjà, NOMMÉ : la chape « fourniture non comprise » à 38,00 €
(devis-demo.js:225-228) est « ajoutable » ET a la même phrase que le poste
chape à une autre fourniture — **la ligne unique de « postes proches »**
dans sa feuille (cas 37) ; « Évacuation des gravats » offerte à 150,00 €
(devis-demo.js:205-208) montre le prix proposé d'une ligne offerte (T8) ;
**[final] « Niche murale carrelée », option, 240,00 € (devis-demo.js:213-216)
est la ligne de l'AJOUT simple** (« Ajouter à ma base » → « Dans votre base
de postes ») — une donnée que rien d'autre n'utilise, pour que l'ordre des
sections de `mesure-devis` ne décide de rien (CE3-13).

**Un contrôle de couverture** (§6.1 G) fait tourner `etatDansLaBase`,
`referenceDuPoste`, `ecartAuPoste`, `postesProches`, `changementDUnite`,
`libelleOrigine`, `sousQuelPoste` et `suggestionsPourLaFrappe` sur les lignes
et les postes de démonstration, et exige chaque état au moins une fois :
référence sans écart, écart, sans prix, ajoutable, proche, T11, avant le
régime, origine vide, sans objet ; une proposition à plusieurs prix ; des
variantes regroupées sous la plus récente ; une mémoire masquée par la base ;
un poste sans référence qui porte un dernier prix ; une ligne existante dont
`sous` n'est pas nul, avec écart ; « Dalles » qui trouve « dalle » ; « Pos »
qui rend exactement les trois « Pose ».

### 4.4 `ChampDesignation` — les suggestions

- Reçoit en plus `postes`, `postesEtat`, `onRelirePostes`. Le calcul :
  `suggestionsPourLaFrappe(...)`, avec les mêmes règles qu'aujourd'hui :
  trois caractères tapés au moins, trois suggestions au plus, **rien à
  l'ouverture d'une ligne existante** (src/components/ChampDesignation.js:49-51,
  72-79, 103-104). Une proposition par clé (T19) : la clé React d'une rangée
  devient `${source}-${cle}` (aujourd'hui `${ligneId}-${prix}`,
  ChampDesignation.js:145, qui supposait une rangée par prix).
- **[final] La clé des postes vient de `postesPrepares(postes)`** (CP8),
  calculée une fois par tableau lu ; ni ce composant ni `CarteLigne`
  n'appellent `cleDeLigne` sur chaque poste. **Aucun écran n'importe
  `rapprochement.js`** (CE3-12) : la clé ne sort jamais de `devis.js` et de
  `postes.js`, et ce qui s'affiche et se recopie est TOUJOURS une phrase
  rangée.
- **Aucun titre de groupe.** La source se dit dans la rangée :
  **[final]** le titre (la phrase rangée, deux lignes au plus, comme
  aujourd'hui) ; le détail sur **UNE** ligne (`detailDeSuggestion`, T23),
  `numberOfLines={1}` (aujourd'hui `{2}`, ChampDesignation.js:159-160) ; le
  prix recopié par `Montant` (encre `C.ink`), le reste du détail en
  `C.muted` (CE3-11) ; le libellé VoiceOver au préfixe COMMUN « Reprendre : »,
  **le prix recopié d'abord** (`libelleDeSuggestion` ; aujourd'hui il ne
  contient AUCUN prix, ChampDesignation.js:154, MESURÉ par la critique
  écran). Le conteneur de la liste ne porte plus de libellé
  (ChampDesignation.js:135 : un libellé posé sur une vue qui n'est pas un
  élément d'accessibilité n'est pas lu par VoiceOver, SUPPOSÉ), et la mesure
  qui le lisait (`scripts/mesure-devis.mjs:752`) lit désormais les rangées
  par leur préfixe. Rangées de `minHeight: TOUCHE` (ChampDesignation.js:183-186).
- **[final] La propriété du « visible »** (CE3-10) : **chaque rangée = un
  titre de deux lignes au plus + un détail d'UNE ligne**, mesurée par
  `mesure-devis` à 320 sur toutes les propositions qu'il affiche. « 166
  points à 390 » reste la mesure du seul cas « chape », dite comme telle :
  le lot 1 la dépasse déjà sur « Pos » (217 points, MESURÉ par la critique
  écran, `maquette-*.err`), parce que des titres de deux lignes sont
  normaux. MESURÉ X-20 : à 320 et 390 points, tous les formats de T23 tiennent
  sur une ligne (55 points de rangée avec un titre d'une ligne, 73 avec un
  titre de deux), sauf le pire cas fabriqué — un montant à cinq chiffres, la
  fourniture et « +2 prix » —, que `numberOfLines={1}` coupe par la fin,
  donc par l'historique.
- **Un seul « Réessayer », sous le champ.** Une lecture ratée de l'une des
  deux sources n'éteint jamais l'autre ; leurs phrases : mémoire seule → la
  phrase actuelle (ChampDesignation.js:126-133) ; base seule → « Votre base
  de postes n'a pas pu être lue : seuls vos prix déjà écrits sont
  proposés. » ; les deux → UNE phrase, « Vos prix déjà écrits et votre base
  de postes n'ont pas pu être lus. », et un seul « Réessayer » qui relit les
  deux. Le bloc « base » de la carte ne porte pas de second bouton (§4.5).

### 4.5 `CarteLigne` — la référence, l'écart, le bloc « base »

**L'ordre de haut en bas** (mesures de la critique écran à 390 × 844 :
désignation 209-297, unités 343-439, quantité et prix 563-607, interrupteurs
679-918, « Monter » 930, défileur visible 636 sur 1016) :

1. la désignation, ses suggestions et leur échec (§4.4) ;
2. les unités ; **la phrase de T11 juste dessous**, quand une suggestion a
   changé l'unité d'une ligne qui avait une quantité ; elle s'efface dès que
   la quantité est retouchée ou qu'une unité est rechoisie ;
3. le taux ;
4. **la ligne de RÉFÉRENCE**, au-dessus de la rangée quantité/prix :
   `phraseReference(referenceDuPoste(ligne, postes, { regimeDeclareLe }))`,
   en style `aide` (Inter, `T.petit`, `C.muted` — 5,73 : 1 sur blanc,
   calculé par la critique écran), le montant par `Montant` (chiffres
   tabulaires, encre `C.ink`). **[final] Quand la phrase de la ligne n'a pas
   la même forme visible que celle du poste, elle NOMME le poste** :
   « Votre prix de référence pour « Dépose fenêtre » : 300,00 € / forfait,
   fixé le 14/10/2026. » (CE3-7). Elle paraît dès que la clé de la ligne est
   connue (désignation quittée ou suggestion choisie, puis unité touchée —
   chaque geste enregistre la carte, `CarteLigne.js:110-114`), **avant** la
   frappe du prix. Clavier ouvert sur le prix, elle est AU-DESSUS du champ
   que le défilement natif amène contre le clavier : elle reste visible
   (SUPPOSÉ, à juger à l'iPhone ; au navigateur on mesure qu'elle est
   au-dessus du champ prix). Elle ne dépend d'aucun chiffre tapé : elle ne
   re-rend rien à chaque lettre (src/components/ChampMontant.js:19-23) ;
5. la rangée quantité/prix, et leurs erreurs (`CarteLigne.js:256-279`) ;
6. **le BLOC « base »**, juste sous le prix (vers 611-660 à 390 × 844, sans
   clavier : visible sans glisser). Selon `etatDansLaBase` et `sous` :
   - **[final] dès que `sous` n'est pas nul** (une ligne variante d'un poste,
     dans l'un des quatre états « dans la base ») : d'abord **« Ce poste
     existe déjà dans votre base, sous « Chape sèche avant carrelage
     collé ». »** — les mots promis au propriétaire (CE3-6) —, puis, en
     `aide`, **`PHRASE_SORTIE`** : « Ce n'est pas le même travail ? Changez
     un mot de la ligne : elle ne sera plus rapprochée de ce poste. »
     (CE3-7) ; puis ce que dit l'état, ci-dessous ;
   - **écart** : `phraseEcart` (« Vous mettez 52,00 € — c'est voulu ? »),
     puis la `Pastille` **« Changer ma référence »** (libellé VoiceOver
     « Faire de 52,00 € votre prix de référence pour ce poste ») qui ouvre
     `FeuillePoste` PRÉ-REMPLIE avec le prix de la ligne (T13) ;
   - **dans la base, sans écart** : « Dans votre base de postes. » (ou rien
     de plus quand `sous` a déjà parlé) et la `Pastille` « Modifier » (la
     feuille, pré-remplie avec la référence) ;
   - **dans la base, sans prix** : « Dans votre base, sans prix de
     référence. » (« Il n'a pas encore de prix de référence. » quand `sous`
     a déjà parlé) et la `Pastille` « Fixer le prix » (la feuille,
     pré-remplie avec le prix de la ligne, Q2 a) ;
   - **avant le régime** : rien de plus que la ligne de référence, qui dit
     déjà « vérifiez-le », et la `Pastille` « Modifier » ;
   - **ajoutable** : la `Pastille` « Ajouter à ma base » (44 × 44 par sa
     boîte, src/components/ui.js:814-834) ;
   - **en lecture** : rien ;
   - **illisible** : rien — l'échec et son « Réessayer » sont sous la
     désignation ;
   - **sans objet** : rien.
   Jamais `erreur`, jamais `C.bad` (le rouge des refus), jamais `C.accent`
   ni `C.accentTexte` (l'orange) ; la couleur CALCULÉE se mesure au
   navigateur (§7.3).
7. les surfaces, la phrase du taux horaire du lot T (`:295`), les
   interrupteurs, « Monter / Descendre », « Retirer » — inchangés.

- **Un appui sur une suggestion** (CarteLigne.js:192-200) :
  **[final]** `valeursDeLaProposition(s)` — pour une proposition de la base,
  le prix de référence s'il est fixé, sinon le dernier prix utilisable de
  même clé (CE3-3) ; pour la mémoire, `valeursDeLaSuggestion` (le prix le
  plus récent du groupe, `prix[0]`) — ; puis `prixAEcrire()` décide du
  champ prix (T10 : `null` veut dire « ne touchez pas au champ ») ; si
  l'unité change et qu'une quantité existe, la phrase de T11 ; la main passe
  à la quantité.
- **Toucher « Ajouter à ma base »** (ou « Changer ma référence »,
  « Modifier », « Fixer le prix ») : la carte **s'enregistre** d'abord (le
  même travail que quitter un champ ; `lire()` lit tous les champs et les
  interrupteurs, `CarteLigne.js:85-108`), puis **ferme le clavier**
  (`Keyboard.dismiss()` : sans cela, sur iOS, le clavier resterait attaché
  au champ prix caché sous la feuille — SUPPOSÉ, à juger à l'iPhone), puis
  demande la feuille à la SAISIE par un rappel (`onAjouterALaBase(valeurs)`,
  `onOuvrirPoste(poste, prixPropose)`), **[final]** qui pose l'UNIQUE état
  de feuille (§4.8). La carte n'est pas une `Modal` (CarteLigne.js:11,
  `:140`) : une seule `Modal` à l'écran.
- VoiceOver : la ligne de référence et le bloc sont dans l'ordre de
  lecture ; rien n'est annoncé d'office (une phrase discrète, pas une
  alerte). À juger au téléphone (§7.6).
- **Q3 a : `RangeeLigne` (SaisieDevisScreen.js:109-148) ne reçoit RIEN de
  la base de postes** — ni référence, ni écart, ni « réf. ». La liste est
  l'écran qu'on montre à un client. Le contrôle E le refuse, et
  `mesure-devis` le vérifie après « Poste suivant » (sabotage 38, inversé).

### 4.6 `FeuilleAjoutPoste` — `src/components/FeuilleAjoutPoste.js`, dans une `FeuilleBas`

**Son propre fichier, rendu par `SaisieDevisScreen`** (comme
`ChoixClientDevis`, SaisieDevisScreen.js:1429-1441) : `verifier-feuilles`
refuse un fichier qui porte `<FeuilleBas` ET `{...CLAVIER}`
(`scripts/verifier-feuilles.mjs:232-235`), et la garde de sortie doit
pouvoir la fermer. Une feuille du bas avec un champ passe par `FeuilleBas` :
elle monte avec le clavier, son voile la ferme, son contenu défile
(CLAUDE.md, « Le clavier de l'iPhone enferme une feuille posée en bas »).
**[final] Elle n'importe pas `FeuillePoste`, et n'en ouvre aucune** (CE3-5) :
deux `Modal` empilées laissent sur iPhone un voile invisible qui avale les
touches (CLAUDE.md l.2903-2906), et iOS présente chaque `Modal` par
`presentViewController`
(`node_modules/react-native/React/Fabric/Mounting/ComponentViews/Modal/RCTModalHostViewComponentView.mm:150-156`) ;
`react-native-web` n'a pas ce défaut, donc aucune mesure d'ici ne le
verrait — c'est une règle de construction, tenue par E.

**[final] Elle a DEUX états, et un seul se voit : « saisie » et « existe
déjà ».** Lequel, c'est `posteExistant(valeurs, postes)`, **recalculé à
chaque rendu** : une base relue entre-temps (un autre appareil, le résultat
d'un ajout parti plus tôt) fait passer la feuille ouverte à « existe déjà »
d'elle-même ; un 23505, suivi de la relecture qu'il déclenche, aussi.

**État « saisie »** :

| élément | détail |
|---|---|
| titre | « Ajouter à ma base » |
| la phrase | **affichée en entier, NON modifiable** (T14), sous le libellé « Mot pour mot » ; dessous : « Cette phrase vous sera proposée telle quelle sur vos prochains devis, pour tous vos clients. N'y laissez ni le nom ni l'adresse d'un client : pour la corriger, corrigez d'abord la ligne. » |
| l'avertissement ciblé | si `indicesDuClient(phrase, { client, lieu })` n'est pas vide : « Cette phrase contient « Durandal », le nom du client de ce devis. Elle resterait dans votre base même si vous supprimez ce client. » — en `aide`, encre `C.ink`, filet `C.accentTexte` à gauche (4,52 : 1 sur le fond, la règle du lot 0a). **Le bouton reste actif** : un faux positif existe (« M. Blanc » et « blanc cassé ») |
| ce qui vient de la ligne | `ligneDescriptive` : « Unité : mètre carré · fourniture non comprise · main-d'œuvre » (non modifiable ; Q4 a) |
| le prix de référence | `ChampMontant`, pavé décimal, sans touche retour ; libellé `etiquettePrixReference` ; pré-rempli avec le prix de la ligne (Q2 a) ; **[final] il ne prend PAS le focus à l'ouverture** (CE3-15 : sinon le pavé décimal monte et cache le bouton — SUPPOSÉ, au téléphone ; au navigateur, `mesure-devis` mesure que le bouton est visible sans défiler à 320 × 568) ; dessous : « C'est le prix que vous voulez retrouver sur vos prochains devis ? Corrigez-le si ce chantier était particulier. Laissez vide pour le fixer plus tard. » |
| **[final]** poste proche | **UNE ligne au plus** (CE3-15), seulement pour la même phrase à une AUTRE unité ou fourniture (`postesProches`, la vraie confusion — m² et forfait) : « Déjà dans votre base, au forfait : « … » (900,00 € / forfait). » — « au <unité> » pour une autre unité, « avec la fourniture » ou « fourniture non comprise » pour l'autre fourniture. Plus de « phrase plus longue », plus de liste de trois |
| bouton | `BtnMain` « Ajouter à ma base », 44 points ; « Enregistrement… » pendant l'envoi |

**État « existe déjà »** — **[final]** une seule décision, sans piège (CE3-8) :

| élément | détail |
|---|---|
| titre | « Ce poste existe déjà » |
| ce qu'Opus a reconnu | « Ce poste existe déjà dans votre base. » ; puis, si la forme visible des deux phrases diffère (`formeVisible`) : « Votre ligne : « chapes seches avant carrelage colle » » et « Le poste : « Chape sèche avant carrelage collé » », suivies de « Opus les reconnaît comme la même phrase : majuscules, accents, espaces, ponctuation et pluriel mis à part. » et de `PHRASE_SORTIE` ; sinon, la seule ligne « Le poste : « … » » |
| ce qui vient du poste | `ligneDescriptive(poste)` |
| le prix — le poste a une référence P, le prix TAPÉ dans la feuille vaut P | « Il a déjà ce prix de référence : 45,00 € / m², fixé le 14/10/2026. » et **le seul bouton « Fermer »** |
| le prix — le poste a une référence P, le prix tapé T diffère (ou est vide) | « Son prix de référence : 45,00 € / m², fixé le 14/10/2026. » ; le `ChampMontant` **pré-rempli avec T, la valeur que la feuille portait** (jamais le prix de la ligne : l'artisan a pu le corriger, Q2) ; `BtnMain` **« Changer ma référence »** (le même nom que sur la carte) ; `BtnOutline` « Fermer » |
| le prix — le poste n'a pas de référence | « Il n'a pas encore de prix de référence. » ; le champ pré-rempli avec T ; `BtnMain` **« Fixer le prix »** ; « Fermer » |
| ce qui n'existe PAS | **aucun bouton pour créer un second poste, aucun pour remplacer la phrase du poste** (T16) |
| si la relecture ne trouve aucun poste de même clé | (une application en retard d'une règle, §3.0.8) « Votre base contient déjà un poste presque identique. Si vous ne le voyez pas dans « Ma base de postes », mettez Opus à jour. » et « Fermer » |

**À la validation** (les deux états) :

1. une **garde par référence** (`enVol.current`) en plus de `disabled` : deux
   appuis dans la même image ne partent pas deux fois (`BtnMain` n'est
   désactivé que par un état, src/components/ui.js:480-498) ;
2. `validerPoste` (refus dit sous le champ, avec la phrase de
   `messageDeContrainte`) ;
3. **aucune attente de la file du devis** : le lien d'origine n'est posé que
   si `devisEnBase()` est DÉJÀ vrai à cet instant (T2) ;
4. état « saisie » : `ajouterPoste` part tout de suite ; état « existe
   déjà » : **[final]** `modifierPoste(poste.id, { prix_reference_centimes },
   { modifieLe: poste.modifieLe })` — la condition de §2.9 —, et si le
   montant saisi vaut déjà la référence, **aucune requête** : la feuille se
   ferme sur « Il a déjà ce prix de référence. » ; un « modifié
   entre-temps » relit la base et ré-évalue la feuille. **La feuille peut se
   fermer pendant l'envoi** (voile, croix, garde de sortie) : la requête
   n'est pas annulée, et son résultat est appliqué et DIT quand même, par
   l'état d'`OpusApp` (`rangerPoste`) et `retour.annoncer` ;
5. au succès : `rangerPoste`, la feuille se ferme, **`retour.reussite()`**
   (`src/lib/retour.js:84` ; `retour.succes()` n'existe pas) et
   `retour.annoncer('Ajouté à votre base de postes.')` — ou, après un
   changement de référence, `retour.annoncer('Votre prix de référence est
   changé.')` ; le bloc de la carte suit ;
6. sur une 23505 : une relecture de la base, puis l'état « existe déjà » —
   la phrase de l'index ne sert qu'en dernier recours, si la relecture
   échoue ; sur le réseau : « Pas enregistré — Réessayer ».

**Rien n'est ajouté sans ce bouton** : aucune autre fonction n'appelle
`ajouterPoste` (§6.1 D). Et **le prix d'un poste existant ne change, depuis
la saisie, que par cette feuille ou par `FeuillePoste`** — jamais par une
écriture de la phrase (E : `FeuilleAjoutPoste` n'envoie jamais
`designation` à `modifierPoste`).

### 4.7 La page « Ma base de postes » — `src/screens/PostesScreen.js` et `src/components/FeuillePoste.js`

- En-tête : le compte (« 12 postes »), **[v2]** une phrase : « Vos phrases
  et vos prix de référence. Aucun écran d'Opus ne les montre à quelqu'un
  d'autre que vous. » (CD2 : la v1 écrivait « Personne d'autre ne les
  voit », le mensonge que le projet s'interdit, `legal.js:667-670` ; la
  forme reprise est celle du texte opposable, `legal.js:663-665`, et du
  lot T, `src/lib/tarifs.js:61-72`). **[v2]** Si `incomplete` : « Liste
  incomplète : votre base compte N postes, Opus n'en a lu que M. » (CB1).
  **[v2]** Une fois, sous l'en-tête : « Pour ne plus voir d'écart sur un
  poste, retirez son prix de référence. » (C9, CE8). La recherche dans
  **son propre composant** avec son texte (`useRechercheDifferee`,
  CLAUDE.md « Un champ de saisie ne re-rend que LUI », l.1347), par mots —
  **[v3]** par les mots de la CLÉ (`correspondALaRecherche`), donc « seuils »,
  « beton » ou « DURANDAL » trouvent « Seuil », « béton », « Durandal ». La
  phrase de `CE_QUI_RESTE_D_UN_CLIENT` (« cherchez son nom dans « Ma base de
  postes » », §5) en devient plus vraie : un nom tapé sans accent se trouve.
- **`FlatList` réglée** (`initialNumToRender`, `maxToRenderPerBatch`,
  `windowSize` ; CLAUDE.md l.1321), rangées mémorisées qui reçoivent des
  valeurs simples, `{...CLAVIER}` puisque la liste porte un champ
  (src/lib/clavier.js:150-157), gouttière dans `contentContainerStyle`,
  séparateur déclaré au niveau du module (`verifier-fil`).
- Une rangée (angle VIF, c'est de la structure) : la phrase (trois lignes,
  entière dans la feuille), `ligneDescriptive`, le prix de référence
  (`Montant`) ou « Prix non fixé », « fixé le … » (et « avant la
  déclaration de votre régime de TVA actuel : vérifiez-le » s'il y a lieu),
  **[v2]** `libelleOrigine` (« Ajouté le … depuis un de vos devis »).
  `minHeight: TOUCHE`.
- **Les états** : en lecture ; **« Lecture impossible » + « Réessayer »,
  jamais « Aucun poste »** sur un échec (CLAUDE.md l.3372) ; une liste déjà
  lue est GARDÉE sur une relecture ratée, avec « Liste non actualisée » (le
  modèle de `DevisScreen`, src/screens/DevisScreen.js:131-155) ; **[v2]**
  ces erreurs en encre `C.ink` sur une surface blanche, filet `C.bad` (le
  modèle de « Mes devis », `DevisScreen.js:203-206` ; `C.bad` sur `C.bg`
  ne donne que 4,37 : 1, CE19) ; base en retard : « la base n'est pas
  encore à jour » ; vide : « Votre base est vide. Dans un devis, ouvrez
  une ligne chiffrée et touchez « Ajouter à ma base ». » ; recherche sans
  résultat : « Aucun poste ne contient « … ». »
- La page se RELIT à chaque ouverture. C'est le défaut ouvert de « Mes
  devis » (AF:2221-2224), qu'on ne recopie pas.
- Toucher une rangée ouvre `FeuillePoste` (une `FeuilleBas`, son propre
  fichier, CE13) : la phrase — **modifiable seulement depuis la page**
  (T14), avec dessous, **[v3]** SELON `consequenceDeLaCorrection` : rien si
  la clé ne change pas ; « Les lignes déjà écrites avec l'ancienne phrase ne
  seront plus reconnues comme ce poste. » si elle change ; et, si elle est
  celle d'un autre poste, « Un autre poste de votre base porte presque la
  même phrase : « … ». » avec « Enregistrer » désactivé —, et
  `indicesDuClient` sur les
  seuls motifs (téléphone, e-mail, « chez », civilités : il n'y a plus de
  devis) — ; `ligneDescriptive` (non modifiable, **[v3]** Q4 a) ; le prix de
  référence ; « Retirer le prix de référence » (le remet à vide) ;
  « Enregistrer » ; et « Retirer ce poste » **en deux appuis** (comme
  « Retirer » d'une ligne, CarteLigne.js:373-402). Toute écriture passe par
  la condition sur `modifie_le` ; « modifié entre-temps » relit la base.
  La même garde par référence que §4.6.
- Libellé du prix selon le régime lu (cinq états ; un échec n'est jamais
  « non déclaré ») : `etiquettePrixReference`.

### 4.8 Les portes, et `OpusApp`

- **Deux portes, une fonction** : un `BtnOutline` « Ma base de postes »
  pleine largeur dans l'en-tête de « Mes devis », sous la ligne du compte
  (src/screens/DevisScreen.js:136-145 ; à 390 de large, l'en-tête n'a pas la
  place d'un second bouton à côté de « Nouveau devis », MESURÉ par la
  critique écran) ; et une rangée « Ma base de postes » dans « Mon profil »,
  sous « Mes devis » (src/screens/ProfilOwnScreen.js:345-357), parce que
  l'en-tête de « Mes devis » n'existe pas pendant sa première lecture
  (`DevisScreen.js:94-101`). Les deux appellent **`ouvrirMaBase()`**, qui
  fait le même travail (relire la base, relire le régime comme
  `ouvrirMesDevis`, src/OpusApp.js:3540-3544). Écran `'postes'`, retour vers
  l'écran d'où l'on vient : les trois listes à tenir dans `OpusApp`
  (`showBack`, `backTitle`, le retour de la barre ; src/OpusApp.js:3849-3910)
  et le bloc rendu.
- **Depuis la saisie, aucune porte qui QUITTE la saisie.** La garde de sortie
  est tenue aux portes qui OUVRENT ou POSENT la saisie
  (`scripts/verifier-devis.mjs:3266-3283`). Changer sa référence ne la quitte
  pas : `FeuillePoste` s'ouvre PAR-DESSUS la carte, comme « Pour qui ? »
  (SaisieDevisScreen.js:1429-1441) ; la garde n'est pas concernée.
- **[final] UN état de feuille dans la saisie** (CE3-5) : le booléen
  `choixClient` (SaisieDevisScreen.js:436, et ses cinq usages `:896`, `:917`,
  `:921`, `:1013`, `:1429`) devient **`feuille`**, qui vaut `null`,
  `{ type: 'client' }`, `{ type: 'ajout', valeurs, devisOrigineId }` ou
  `{ type: 'poste', poste, prixPropose }`. Deux feuilles ne peuvent donc pas
  être demandées ensemble, par construction — c'est la leçon des Demandes
  (« un seul panneau à la fois, tenu par une chaîne et non par trois
  booléens », CLAUDE.md l.2903-2906). Le rendu est un seul `switch` sur
  `feuille.type`.
- **La garde de sortie ferme la feuille** : `sortir()`
  (SaisieDevisScreen.js:1009-1013) pose `feuille` à `null`, là où elle
  posait `setChoixClient(false)`. Rien n'y a été écrit, il n'y a rien à
  dire ; une requête déjà partie finit et se dit (§4.6).
- **L'état des postes vit dans `OpusApp`**, comme le carnet
  (`clients`/`chargerClients`, src/OpusApp.js:3341-3362) : `postes`,
  `postesEtat` (`'vide' | 'chargement' | 'ok' | 'echec'`), `postesEnRetard`,
  `postesIncomplete`, `chargerPostes()`, `rangerPoste(p, { retire })`, et
  `regimeDeclareLe`, posé par la même lecture que le régime (`lireRegime`,
  src/OpusApp.js:3522-3529, qui appelle désormais `monRegimeEtSaDate()`) et
  par `recevoirEmetteur` (`:3536-3539`). Passés à la saisie (qui demande la
  lecture à la première carte chiffrée, comme la mémoire,
  SaisieDevisScreen.js:762-777) et à la page. `rangerPoste` remplace le
  TABLEAU (jamais une mutation en place) : c'est ce qui invalide
  `postesPrepares` (un `WeakMap` sur le tableau). La déconnexion remonte
  `OpusApp` (CLAUDE.md « Se déconnecter, c'est REPARTIR DE ZÉRO ») : rien ne
  survit au compte.

### 4.9 Les règles transverses

- **Cibles** : 44 × 44 par la BOÎTE (`TOUCHE`, src/theme.js:412) ;
  `hitSlop` ne se vérifie pas au navigateur (src/theme.js:384-406).
  **[v2] Une exception NOMMÉE** (CE12) : la croix de chaque `FeuilleBas`
  fait 18 × 20 au navigateur (MESURÉ par la critique écran) et environ
  38 × 40 au doigt (`hitSlop={viser(24)}`, `FeuilleBas.js:86-93` ;
  `viser(24)` = 10, src/theme.js:420-422 — calcul). `mesure-devis` la nomme
  avec sa raison (le voile ferme aussi, et il fait toute la largeur) ; la
  corriger touche toutes les feuilles du projet : **un lot à part**, écrit
  dans A-FAIRE à l'étape 10.
- **Échelles** : les cliquets de `verifier-echelles` sont tous à leur
  plafond (MESURÉ par la lecture « app ») : aucune valeur écrite à la main ;
  `T`, `S`, `R`, `TOUCHE` seulement.
- **Clavier** : `{...CLAVIER}` sur ce qui défile ; jamais un
  `KeyboardAvoidingView` par-dessus (src/lib/clavier.js:78-92) ; pavé
  décimal sans `returnKeyType` pour un montant ; correcteur actif sur la
  phrase (dans la page).
- **Linter** : plafond à 32 (`scripts/verifier-atelier.mjs:51`).
- **Aucun paquet nouveau** (`verifier-imports`). `Keyboard` vient de
  `react-native`.

---

## 5. Les textes opposables — `src/data/legal.js`

**Ne rien promettre de plus que vrai** : la base n'a aucune COLONNE de
client, mais la phrase est le texte de l'artisan, qui peut en nommer un.
Aucun texte ne dit « aucune donnée de client » ; l'écran le demande et le
signale (§4.6). Les phrases ci-dessous sont des propositions à reprendre
telles quelles, avec les apostrophes typographiques du fichier.

| passage | changement | pourquoi |
|---|---|---|
| `CE_QUI_RESTE_D_UN_CLIENT` (`legal.js:754-756`, servi aux deux branches de « Les clients que vous enregistrez ») | « Supprimer la fiche d’un client ne supprime pas ses devis : ils restent, avec l’adresse des travaux et ce que vous y avez écrit. Pour effacer les données de ce client, supprimez aussi ses devis, **et retirez de votre base de postes toute phrase qui le nommerait : un poste n’est rattaché à aucun client, cherchez son nom dans « Ma base de postes ».** » | CD1, MESURÉ V-CD1 : la phrase survit à la fiche et au devis, et reste dans l'export. Sans cela, le chemin d'effacement que le texte donne serait incomplet sans le dire — « un ménage incomplet ne doit pas ressembler à un ménage fait » (CLAUDE.md, « Les pièces jointes en messagerie ») |
| « Ce que nous collectons » (`legal.js:820-829`) | une phrase AJOUTÉE juste après « … d’où ils viennent. » et **avant** « Aucun écran d’Opus ne les montre », pour rester dans sa portée (CD9) : « Et votre base de postes : les phrases que vous y rangez, leur unité, la fourniture et la main-d’œuvre, le prix de référence que vous fixez et sa date, et le devis depuis lequel vous l’avez ajouté. » | une donnée collectée qui n'est pas nommée n'est pas annoncée ; la phrase des devis, que `verifier-legal` découpe à partir de « devis en préparation » (`scripts/verifier-legal.mjs:1140-1146`), n'est pas touchée |
| « Vos tarifs et vos prix » (`legal.js:651-672`) | une phrase AJOUTÉE après « Vos devis portent ceux qui leur servent, pour le client à qui vous les adressez. » : « Votre base de postes — ses phrases comme ses prix de référence — suit la même règle : aucun écran d’Opus ne la montre à quelqu’un d’autre que vous, ni dans l’espace d’administration, et l’éditeur s’engage à ne pas la consulter ; c’est un engagement, pas une impossibilité technique. » | CD4 : l'engagement existant couvre les PRIX, pas les phrases ; or ouvrir la table, c'est lire les deux. Et un prix de référence est un prix FUTUR, la donnée la plus sensible en droit des ententes (point 414, DON:797-799). **La phrase que `verifier-legal` tient mot pour mot (`:1151-1153`) n'est pas touchée** — l'insertion de la v1 l'aurait fait rougir. La nouvelle phrase n'écrit pas « s’engage à ne pas les consulter », que `:483-488` refuse |
| « Pourquoi, et sur quelle base » (`legal.js:863-878`) | « Vous proposer, pendant que vous chiffrez, les phrases et les prix de référence de votre base de postes, et vous signaler un écart avec ce prix : exécution du contrat. » | CD5 : la finalité se fixe à la PREMIÈRE collecte (DON:650-659) ; un intérêt futur ne s'annonce pas pour se couvrir (« réel et actuel », DON:708-711) — d'où une finalité étroite, et rien sur une base commune |
| « Combien de temps » (`legal.js:1067-1069`) | après « … et partent avec votre compte. » : « Votre base de postes aussi ; supprimer un devis ne retire pas les phrases que vous en avez rangées dans votre base. » | CD9, CD1 |
| « Vos droits » (`legal.js:1096`) | « Rectification : Profil → Modifier mon profil ; votre base de postes : Profil → Ma base de postes. » | CD9 : la base se corrige ailleurs |
| `VERSION` (`legal.js:32`) | passe à la date du lot P, avec son bloc d'historique sur le modèle du 22/10 (**`legal.js:33-63`** — la v1 citait `:33-115`, qui englobe les blocs du 20 et du 19/10, CD14) | |
| le bloc d'historique de `VERSION` | ce qui change DE FOND (la base, sa finalité, la vérité sur l'effacement) ; **et ce qui n'est PAS écrit, et pourquoi** (CD9) : aucune durée propre à la base (elle suit le compte) ; aucune mise en commun (elle demanderait une case à part, C10) ; aucune clause de sous-traitance (l'acte de l'article 28.3 n'existe pas — et il devra couvrir la base de postes) ; **et la même limite que les 19, 20 et 22/10 : aucun écran ne fait ré-accepter un compte existant** (AF:1942-1946), plus le préavis de quinze jours pour changer des CGU acceptées si Opus est un service d'intermédiation (DON:661-666, analyse) — sans effet tant que `STATUT = 'essai'`, à redire avant la remise du compte du frère | |

Ce qui ne change pas, et qu'il ne faut pas casser : l'exception « compter
les lignes ou vérifier la structure » (`legal.js:671-672`) reste vraie ; la
phrase « ni dans l’espace d’administration » reste, et un contrôle la tient
(§6.2, CD8).

---

## 6. Les contrôles

### 6.1 Nouveau : `npm run verifier-postes` (`scripts/verifier-postes.mjs`)

Il lit son CODE DE SORTIE, retire les commentaires avant de lire, et
découpe la section 50 du titre 50 au PROCHAIN titre de section (le modèle
de `sectionDuSchema`, `scripts/verifier-emetteur.mjs:1009-1016`). Il tient
des PROPRIÉTÉS là où une syntaxe se contourne ; ce qu'aucun contrôle
statique ne tient se MESURE au navigateur (§7.3), et c'est dit à chaque
fois. La clé y entre par ses quatre preuves (§3.0.5) : il FAIT TOURNER le
miroir, il ÉVALUE la table SQL, il compare les empreintes, et **[final]** il
refait l'assertion de l'invariant.

| partie | ce qu'il FAIT TOURNER ou LIT |
|---|---|
| A. le calcul | il FAIT TOURNER `postes.js` et les fonctions de `devis.js` sur les **[final] 51** cas de §3.3, dans trois fuseaux pour les dates ; vérifie les imports de `postes.js` (quatre fichiers purs), l'absence de « € », de `Math.round`, `toFixed`, `parseFloat`, de moyenne, de minimum et de maximum ; les mots interdits (§3.2) dans les CHAÎNES de `postes.js` et des écrans de la base ; `phraseReference` commence par « Votre » ; `prixAEcrire` rend `null` pour un prix absent ; `POSTES_MAX <= LIMITE_LECTURE_API`. **[final] Les propriétés de la liste** (CE3-14), sur le balayage du cas 51 (la mémoire de démonstration, ses trois lignes de plus, quatre variantes par ligne ; chaque début de mot de trois lettres et plus ; 468 textes) : au plus 3 propositions ; aucune clé en double ; aucune mémoire de la clé d'un poste ; chaque titre est une phrase RANGÉE, octet pour octet, et `valeursDeLaProposition(s).designation` aussi (CE3-12) ; chaque `prix` a au plus trois éléments, distincts, tous entiers > 0 (CE3-2) ; **le témoin positif : « Pos » rend EXACTEMENT 3** — sans lui, une liste cassée qui ne propose plus rien passerait « au plus trois » ; « Les », « Sas », « oss », « Aux », « Mes » ne rendent que ce qui CONTIENT ces lettres (cas 45). **La clé** : (1) les **175 cas** et les **22 paires** de `supabase/cas-rapprochement.json`, joués par `cleDeRapprochement` — 0 écart, 0 paire confondue ; (2) les **deux empreintes** (plan de base, tout Unicode : 3,9 s sous `node`) égales aux valeurs du fichier ; (3) **la table SQL ÉVALUÉE = la table JavaScript** : il extrait de la fonction `cle_de_rapprochement` les arguments du `translate()` et les **trente** `replace(…, chr(n), '…')`, évalue chaque concaténation de littéraux `'…'` et de `chr(n)` (rien d'autre n'est admis : une autre forme fait échouer le contrôle), et compare caractère par caractère à `TABLE_DE`, `TABLE_VERS`, `TABLE_MULTIPLES` ; **[final]** (4) **l'invariant de parité** (CP4) : chaque sortie de `TABLE_MULTIPLES` n'est faite que de `a`–`z`, `0`–`9` et d'espaces, et aucun caractère de `TABLE_DE` n'est l'un de ceux d'une sortie (le générateur le refuse déjà ; le contrôle le refait, parce qu'une table peut être retouchée à la main) ; **[final]** (5) **la garde** : `LONGUEUR_MAX` vaut 2 000, la fonction SQL commence par `char_length(p_phrase) > 2000`, les deux nombres sont égaux, et `cleDeRapprochement('a'.repeat(2001))` rend `null` ; **[final]** (6) **le pluriel** : `PLURIEL` n'est PAS exporté (aucun `/g` exporté, CP9) ; `PLURIEL_SOURCE` et le motif de la fonction SQL sont égaux une fois la classe des lettres développée ; `EXCEPTIONS_PLURIEL` vaut `['bas']` et la fonction SQL porte `(?!(?:bas)(?: |$))` ; (7) `rapprochement.js` **n'importe rien**, et ne contient ni `normalize`, ni `toLowerCase`, ni `toUpperCase`, ni `localeCompare`, ni `Intl`, ni `\p{`, ni drapeau `u`, ni rétrospection `(?<` ; aucun caractère non ASCII dans le fichier, commentaires compris ; (8) `devis.js` ne contient plus `normalize` ; **[final]** (9) **aucun écran** (`src/screens/`, `src/components/`) n'importe `rapprochement.js` (CE3-12) |
| B. le schéma | il LIT la section 50 : colonnes en liste FERMÉE (§2.2, douze) ; contraintes en `_check`, leurs noms = `CONTRAINTES_POSTE`, dans l'ordre ; `unite is not null` ; prix `between 1` ; déclencheur `security invoker`, verrou AVANT le compte ; `new.id := old.id` et `new.pro_id := old.pro_id` dans la branche de modification ; **[final]** le verrou et le compte ne sont pris que sous `auth.uid() is null` ou `est_mon_entreprise(new.pro_id)`, et **`auth.uid()` n'apparaît que dans la branche d'insertion** (CP1, §2.4) ; la phrase d'`OP018` écrite en toutes lettres, sans `%`, et ses chiffres = `v_plafond_postes` = `POSTES_MAX` ; la clé composée et sa liste `set null` ; l'index `devis (id, pro_id)` ; la politique (forme exacte) ; `revoke all` puis exactement quatre droits ; aucune `security definer` ; la clé de `mes_donnees` ; la place avant le titre 42 ; la classe de blancs = `BLANCS`. **Aucune séquence barre-oblique-u dans toute la section, et [final] aucune barre oblique inverse** (CP3) ; la fonction `cle_de_rapprochement` AVANT la table, `immutable strict parallel safe`, ni `security definer`, `set search_path = public`, son corps sans `lower(`, `upper(`, `initcap(`, `unaccent`, `normalize`, `collate`, `ilike`, `~*`, ni `[[:` ; ses motifs de regex ne contiennent que de l'ASCII et la classe des lettres ÉNUMÉRÉE ; son corps est celui que `generer-rapprochement` engendre (entre ses marqueurs, octet pour octet) ; `revoke all … from public, anon` et `grant execute … to authenticated` ; la colonne `cle_rapprochement text generated always as (public.cle_de_rapprochement(designation)) stored` ; **[final]** l'index unique s'appelle `idx_base_postes_rapprochement` et porte exactement `(pro_id, (md5(cle_rapprochement)::uuid), (unite collate "C"), fourniture_non_comprise)` — jamais `md5(designation)`, jamais la clé en clair ; **l'ancien nom `idx_base_postes_cle` n'apparaît nulle part** dans `schema.sql`, `src/` ni `scripts/` (CP6) ; `base_poste_rapprochement_check` ; et le déclencheur ne nomme jamais `cle_rapprochement` |
| C. l'essai | il LIT `supabase/essais-section-50.sql` : le cas 0, chaque refus annoncé par son nom, aucune RLS dans un `do` ; la présence des cas 4 bis, 5 bis, 5 ter, 6 bis, 8 bis, 14 à 21, **[final] 22 à 25**, et des **quatre** procédures de l'en-tête (A, B, C, **D**) ; le cas 12 lit `attacl` et **ne lit pas** `column_privileges` ; le cas 13 contient le motif normalisé du cas 27a de l'essai 49 ; le cas 18 lit `supabase/cas-rapprochement.json` par `\set … cat` et compte les écarts ; le cas 18 bis nomme les quatre collations **[final] et `standard_conforming_strings = off`** ; le cas 20 lit `pg_get_indexdef` et `indcollation` ; le cas 1 bis attend un REFUS. La PREUVE reste l'essai joué (§7.1) : `npm run verifier` ne joue aucun SQL (A-FAIRE §2.3) |
| D. l'API | il LIT `api.js` : les quatre fonctions après `noop`, deux fonctions nommées et le choix à la fin, aucun `upsert`, `.eq('modifie_le', …)` dans `modifierPoste` et `retirerPoste`, la relance sans lien SEULEMENT sur `base_postes_devis_origine_fkey`, le délai et l'annulation ; la lecture porte `.eq('pro_id', currentUserId)`, `.order(` et `count: 'exact'`, et **ne nomme ni `devis` ni `objet`** ; **la CHAÎNE `base_postes` sous toute forme** n'apparaît dans `src/` et `supabase/functions/` qu'à l'intérieur des quatre fonctions ; `ajouterPoste` n'est appelée qu'à un seul endroit, `FeuilleAjoutPoste` ; `modifierPoste` est appelée par `FeuilleAjoutPoste` (le prix seul) et `FeuillePoste` ; `monRegimeEtSaDate` existe et `monRegime` rend toujours une chaîne ; la chaîne `cle_rapprochement` n'apparaît NULLE PART dans `src/` (ni lue, ni écrite) |
| E. les écrans | il LIT : dans `CarteLigne`, la ligne de référence est rendue AVANT la rangée quantité/prix et le bloc APRÈS ; le `Text` de la référence et celui de l'écart ont pour style **exactement** `s.aide` ; `onChoisir` passe par `valeursDeLaProposition` puis `prixAEcrire` ; `Keyboard.dismiss()` précède la demande d'une feuille ; **[final]** le bloc rend « Ce poste existe déjà dans votre base, sous » et `PHRASE_SORTIE` sous la condition `sous` ; `FeuilleAjoutPoste` ne porte aucun champ pour la phrase, une garde `enVol`, `retour.reussite`, **aucune attente de la file**, **[final] n'importe pas `FeuillePoste`**, n'envoie jamais `designation` à `modifierPoste`, son `ChampMontant` n'a pas `autoFocus`, son état « existe déjà » n'a aucun bouton « Ajouter », et la branche « même prix » ne rend que « Fermer » ; `FeuillePoste` ne rend la phrase modifiable que depuis la page ; les deux feuilles dans leurs fichiers, rendues par `SaisieDevisScreen` et `PostesScreen` ; **[final] `SaisieDevisScreen` tient UN état `feuille`** — plus de `choixClient`, aucun `useState(false)` nommé pour une feuille, et `sortir()` pose `feuille` à `null` ; `PostesScreen` : `FlatList` réglée, « Lecture impossible » jamais « Aucun poste » sur un échec, « incomplète » branché sur `incomplete`, et aucune des formules « personne d'autre ne », « personne ne les », « ne peut pas lire », « impossible » ; `ChampDesignation` : aucun `accessibilityLabel` sur le conteneur de la liste, le libellé des rangées par `libelleDeSuggestion`, **[final] `numberOfLines={1}` sur le détail**, la clé React porte `cle` ; **[final]** `ChampDesignation` et `CarteLigne` obtiennent les clés des postes par `postesPrepares`, jamais par `cleDeLigne` appliqué à chaque poste (CP8) ; `OpusApp` : les deux portes appellent `ouvrirMaBase`, et `rangerPoste` remplace le tableau ; `RangeeLigne` ne reçoit aucune valeur de la base de postes (Q3 a) ; aucun écran n'appelle `normalize` ni `toLowerCase` pour comparer des phrases ; `PostesScreen` n'a aucun bouton « Nouveau poste » (Q4 a) |
| F. qui lit, qui écrit | chaque colonne de `base_postes` (lue dans le SCHÉMA, pas dans une liste) a un écrivain et un lecteur (le modèle de `verifier-devis` F, `:3488`) ; avec UNE exception nommée et vérifiée : `cle_rapprochement`, écrite par son expression de génération et lue par `idx_base_postes_rapprochement` — le contrôle exige que l'index la nomme, et qu'aucune autre colonne ne profite de l'exception |
| G. la démonstration | il FAIT TOURNER la base de démonstration : ajout, doublon (le 23505 nommé `idx_base_postes_rapprochement`, aussi pour une VARIANTE d'un poste), `OP018` avec la phrase de la base, condition sur `modifieLe`, `id` et `proId` figés, devis supprimé (lien vide, `modifieLe` inchangé), refus dans l'ordre alphabétique avec les phrases de `MESSAGES_CONTRAINTE` (dont « — » refusé par la clé vide, **[final]** et 2 001 caractères par la phrase) ; **[final]** deux ajouts lancés ensemble : le second attend le premier, puis 23505 ; **la COUVERTURE** : sur les lignes et les postes de démonstration, chaque état de §4.3 apparaît au moins une fois ; `PAUSE_POSTES_DEMO` est nommée et passée par les quatre fonctions de démonstration ; **[final] les trois lignes de « Sol du séjour »** existent, chacune avec sa phrase et son prix, et respectent l'horloge du devis ; la mémoire de démonstration, sur « chape », rend DEUX propositions (38 € « fourniture non comprise » ; 52 € puis 45 €) ; la liste fusionnée sur « chape » en montre deux (la base, puis 38 €) ; sur « seuils », une seule, `prix` = [2 500, 2 300] ; sur « gravats », une seule, titrée « evacuation des gravats en dechetterie », `prix` = [18 000, 15 000] ; sur « faience », la base sans référence porte `dernierPrix` 4 500 |

### 6.2 Les contrôles existants à mettre à jour

| contrôle | changement | pourquoi |
|---|---|---|
| `verifier-devis` | les DEUX découpes de la section 49 (`:1884-1886` et `:3002`) s'arrêtent au prochain titre de section, pas au titre 42 | MESURÉ par la lecture « base » : avec une section 50 avant la 42, quatre échecs ; corriger seulement la première en laisse un |
| `verifier-devis` | la liste `copies` de la classe de blancs (`:2133-2141`) reçoit `tient_le_poste.designation` ; `jeuDe` (`:2125-2132`, avec son `decoder`) lit AUSSI la forme `chr(n)` (la huitième copie, écrite sans séquence barre-oblique-u) : la même évaluation de littéraux et de `chr(n)` que `verifier-postes` A | sinon la huitième copie n'est comparée à rien, ou n'est lue par personne |
| `verifier-devis` | **[final] exactement quatre vérifications réécrites** (MESURÉ X-16 : 292 → 287 vertes et 4 rouges, toutes attendues), avec leur nouvel attendu et la phrase qui dit pourquoi (la réponse 2) : A-4 « DEUX suggestions » (`:614-616`) → une proposition, `prix` = [7 000, 5 000], jamais 6 000 ; A-4 « trois prix au plus » (`:624-628`) → une proposition, [4 000, 3 000, 2 000], chaque prix avec son origine ; A-7 « TROIS entrées » (`:993-995`) → deux propositions ; B « EXACTEMENT deux imports » (`:1076-1082`) → trois, la troisième `./rapprochement.js` (`cleDeRapprochement`, `aPlat`). Plus les cas 28 à 33, 39 et 41 de §3.3 dans A-4, et « `devis.js` ne contient plus `normalize` » | la réponse 2 ; rien d'autre ne bouge (X-16) |
| `verifier-devis` | A-4 : le cas « seche chape » ; `estDuDevis` (`:2678`) reconnaît aussi les noms en `/poste/i` ; la règle « jamais de moyenne ni d'arrondi flottant » (`:3457-3487`) couvre `postes.js` et les nouveaux écrans ; E : `onChoisir` passe par `prixAEcrire` (T10) | une fonction `mesPostes` échapperait aux vérifications par son nom |
| `verifier-devis` E | la propriété de la garde (`:3266-3283`) s'étend au côté SORTIE : toute fonction d'`OpusApp` passée en rappel à `SaisieDevisScreen` et qui appelle `setScreen(` attend `quitterSaisieDevis(` avant ; et aucune fonction passée à la saisie n'appelle `ouvrirMaBase` | une porte par paramètre (`onX('postes')`) ou par variable échappait à une liste |
| `verifier-legal` | une QUATRIÈME liste fermée `{ tables: /\bbase_postes\b/, permises: ['tient_le_poste', 'mes_donnees'] }` (`LISTES`, `:787-798`) ; `base_postes` dans `PRIVEES` (`:782`) et `PRIVEES_EDGE` (`:945`) ; la politique de `base_postes` (`to authenticated`, `mes_entreprises()`) | MESURÉ par la lecture « base » : avec l'esquisse, `verifier-legal` restait VERT — il ne protège pas une table qu'il ne nomme pas |
| `verifier-legal` | les textes : `VERSION >= <date du lot P>` ; la collecte nomme « base de postes » et « prix de référence » AVANT « Aucun écran d’Opus ne les montre » ; « Vos tarifs et vos prix » nomme « base de postes » et « phrases », et garde « ni dans l’espace d’administration » ; « Pourquoi, et sur quelle base » et « Combien de temps » nomment « base de postes » ; **`VERITE_EFFACEMENT` (`:1011-1016`) exige aussi « base de postes »** ; la vérification de `:1151-1153` reste telle quelle | CD1, CD4, CD5, CD8, CD9 |
| `verifier-listes` | `src/screens/PostesScreen.js` entre dans la liste des listes qui grandissent (`:58-71`) | |
| `verifier-feuilles` | constater que les deux feuilles passent par `FeuilleBas`, chacune dans son fichier | |
| `verifier-imports` | rien à changer, et c'est à constater : `rapprochement.js` et `postes.js` sont des fichiers du projet, pas des paquets (aucun paquet nouveau) | |
| `mesure-devis` | **[final]** (1) le préfixe commun « Reprendre : » pour TOUTES les mesures qui comptent des suggestions (`:737`, `:749`, `:763`) ; la lecture du texte des suggestions par leurs RANGÉES, plus par le libellé du conteneur (`:752`) ; (2) « une ligne EXISTANTE s'ouvre sans suggestion » (`:730-740`) : **0 à l'ouverture, puis, dans la même section, un « s » tapé à la fin de la phrase fait apparaître au moins une proposition, et l'effacer rend la phrase intacte** (CE3-14) ; (3) **la deuxième chape (`:742-781`) RÉÉCRITE** : « chape » → **exactement deux** propositions — la base en tête (libellé « …, de votre base, prix de référence 45,00 € … »), puis 38,00 € « fourniture non comprise » ; **jamais 52,00 €** ; leurs clés reconstruites depuis les libellés (phrase, « par <unité> », « fourniture non comprise ») par `rapprochement.js` importé SOUS `node`, et toutes différentes ; on touche la rangée de la BASE (et non plus celle qui portait « 52,00 », `:763`) ; la main passe à la quantité ; deux appuis ; le prix recopié vaut « 45 » (`:776`) ; le modèle reçoit **4 500** (`:780`) ; le champ « Désignation » vaut une phrase de la démonstration, octet pour octet ; (4) **la propriété de la rangée**, à 320 points, sur toutes les propositions affichées : titre ≤ 2 lignes, détail = 1 ligne ; (5) les sections nouvelles de §7.3, **placées AVANT « Supprimer ce brouillon » (`:1222`)**, qui efface « Sol du séjour », et **chacune ouverte par sa PRÉCONDITION** (les lignes de « Sol du séjour » sont là ; aucun poste de la clé qu'elle va éprouver n'existe encore — sinon elle s'arrête en disant que l'ordre des sections a changé) ; (6) aucune rangée de la LISTE ne dit « réf. » ; la croix des feuilles NOMMÉE comme exception aux 44 points ; (7) **`:491` (« 4 postes chiffrés » dans le devis 1) ne change PAS** : aucune ligne de démonstration n'est ajoutée au devis 1 | CE3-10, CE3-12, CE3-13, CE3-14 ; les sections qui cassaient : `:755`, `:763`, `:776`, `:780` (LU) |
| `src/lib/file-ecriture.js:154-156` | le commentaire dit que `devis` porte désormais un second index unique, et pourquoi c'est toujours `devis_pkey` qui sort | CB11 |
| `package.json` | `"verifier-postes": "node scripts/verifier-postes.mjs"` ; `npm run verifier` le découvre seul ; `"generer-rapprochement": "node scripts/generer-rapprochement.mjs"` (pas un contrôle : il écrit) | |

### 6.3 Les sabotages qu'il devra refuser

Chacun posé à la main sur une copie, et refusé PAR LA BONNE vérification.
Ceux de la v1 (1 à 34), puis ceux de la critique écran (35 à 47, S1 à S13),
puis ceux de la v2 (48 à 62), ceux de la v3 (63 à 81) et ceux de la
version finale (82 à 110).

1. `base_poste_unite_check` sans `is not null` (B ; essai cas 1)
2. l'index unique sur la phrase EN CLAIR (B ; essai cas 1, 2 000 × 4 octets)
3. `on delete set null` sans liste de colonnes (B ; essai cas 4)
4. une clé simple `devis_origine_id → devis(id)` (B ; essai cas 4)
5. `tient_le_poste` en `security definer` (B ; essai cas 6 bis et 13 ; `verifier-legal`)
6. la politique `using (true)`, ou `to anon` (B ; `verifier-legal` ; essai cas 5)
7. le `revoke all` retiré, ou `grant all` (B ; essai cas 12 : `truncate`)
8. le compte du plafond AVANT le verrou (B ; essai cas 9 à deux sessions)
9. la clé `ma_base_de_postes` retirée de `mes_donnees` (B ; essai cas 10)
10. un prix de référence de 0 permis (A, B ; essai cas 1)
11. la garde `pg_trigger_depth()` retirée (essai cas 4 : `modifie_le` bouge)
12. l'origine récrivable (essai cas 4)
13. une fonction `admin_…` qui lit `base_postes` (`verifier-legal` ; essai cas 13)
14. une vue sur `base_postes` (`verifier-legal` ; essai cas 13)
15. une fonction Edge qui fait `from('base_postes')` (`verifier-legal`)
16. un `upsert` dans `ajouterPoste` (D)
17. `modifierPoste` sans `.eq('modifie_le', …)` (D ; G)
18. un ajout automatique : `ajouterPoste` appelé depuis l'enregistrement d'une ligne (D)
19. une fonction de la section 49 qui écrit `base_postes` (B ; `verifier-legal` ; essai cas 13)
20. la phrase d'écart en style `erreur`, en `C.accent`, en `C.accentTexte` ou avec une couleur en ligne (E ; couleur mesurée, §7.3)
21. `onChoisir` qui réécrit un prix vide (A cas 16 ; E)
22. le poste versé dans la mémoire comme une ligne (A cas 13)
23. la recherche par sous-chaîne seule (A cas 15)
24. une moyenne ou un `Math.round` dans `postes.js` (A)
25. une porte vers `'postes'` passée à `SaisieDevisScreen`, en clair ou par paramètre (E ; `verifier-devis` E)
26. « Aucun poste » affiché sur un échec de lecture (E ; §7.3)
27. la phrase d'`OP018` de la démonstration différente de la base (G)
28. `CONTRAINTES_POSTE` hors de l'ordre alphabétique (B)
29. un `taux_tva_centiemes` ajouté à la table sans lecteur (B, liste fermée ; F)
30. `legal.js` sans « base de postes », ou `VERSION` inchangée (`verifier-legal`)
31. la découpe de `verifier-devis` remise « jusqu'au titre 42 » (`verifier-devis` rougit)
32. une huitième copie de la classe de blancs différente (`verifier-devis`)
33. `valeursDeLaProposition` qui recopie un taux ou « Offert » (A cas 16)
34. `v_plafond_postes` changé sans la phrase (B, cas 21)
35. (S1) les suggestions de la base proposées à l'ouverture d'une ligne EXISTANTE (`mesure-devis`, préfixe commun)
36. (S2) une rangée de la base sans le préfixe « Reprendre : » (`mesure-devis` ; E)
37. (S3) des titres de groupe qui font grandir les rangées (`mesure-devis`, la propriété de la rangée ; **[final]** le budget de 166 points n'est plus une propriété, CE3-10)
38. **[v3, inversé]** (S4) une référence ou un « réf. » passé à `RangeeLigne` — Q3 a (E ; `mesure-devis`, « Poste suivant » puis la liste)
39. (S5) la feuille ouverte sans fermer le clavier (E, forme)
40. (S6) la phrase redevenue modifiable dans la feuille d'ajout (E ; `mesure-devis` : le bouton disparaît après l'ajout)
41. (S7) « Ajouter à ma base » affiché pendant la lecture de la base (A cas 12 bis ; `mesure-devis`, pause allongée)
42. (S8) le résultat d'un ajout perdu quand la feuille est fermée pendant l'envoi (`mesure-devis`)
43. (S9) `FeuillePoste` écrite dans `PostesScreen.js` (`verifier-feuilles`)
44. (S10) le poste « chape » retiré de la démonstration (G, couverture)
45. (S11) la phrase d'écart avec une couleur en ligne (E, et la couleur mesurée)
46. (S12) `` .from(`base_postes`) `` dans une cinquième fonction (D, toutes formes)
47. (S13) des suggestions de la base sur une ligne de TITRE (E ; `mesure-devis`)
48. `new.id := old.id` retiré du déclencheur (B ; essai cas 14)
49. `OP018` formée par `%` (« 1000 ») au lieu de la phrase en toutes lettres (B ; G)
50. la lecture sans `count` ou sans `order` (D)
51. le plongeon `devis:…(objet)` remis dans la lecture (D)
52. `POSTES_MAX` porté à 2 000 sans `LIMITE_LECTURE_API` (A)
53. `CE_QUI_RESTE_D_UN_CLIENT` sans « base de postes » (`verifier-legal`, `VERITE_EFFACEMENT`)
54. « Personne d'autre ne les voit » remis dans la page (E)
55. la phrase de la base insérée AU MILIEU de la phrase tenue par `verifier-legal:1151-1153` (`verifier-legal`)
56. `phraseReference` qui commence par « Le prix conseillé » ou contient « moyen » (A)
57. `indicesDuClient` qui ne voit plus le nom de la fiche (A cas 23)
58. l'avertissement d'un nom de client qui DÉSACTIVE le bouton (E ; §7.3)
59. la date du régime ignorée : `avantRegime` toujours faux (A cas 22 ; G couverture)
60. l'origine d'un poste nommée par un mot de l'objet d'un devis (A cas 24 ; D)
61. `f.attendre(` dans l'ajout (E)
62. le cas 12 de l'essai réécrit sur `column_privileges` (C)

**[v3] Ceux de la clé de rapprochement (63 à 81)** — les sept premiers sont
DÉJÀ joués sur le prototype (W-10), avec ce qui les a refusés :

63. `.toLowerCase()` ajouté au miroir (A : 3 cas, 1 paire confondue, l'empreinte) — **joué**
64. le seuil du pluriel passé à 4 (A : 10 cas, l'empreinte) — **joué**
65. `.normalize('NFC')` ajouté au miroir (A : **l'empreinte seule** — 0 cas sur 145 ne le voit ; E : `normalize` interdit) — **joué**
66. les marques combinantes retirées de la table JavaScript (A : 10 cas, la comparaison des tables, l'empreinte) — **joué**
67. `lower(` ajouté à la fonction SQL (B : mot interdit ; essai 18 bis : l'empreinte change, et change SELON la collation) — **joué**
68. une lettre changée côté SQL, `chr(233)` → `chr(232)` (A : comparaison des tables) — **joué**
69. un remplacement multiple changé côté SQL, `œ → o` (A : comparaison des tables) — **joué**
70. la colonne générée remplacée par une colonne que le déclencheur pose (B ; essai 19 : plus de 428C9, et un client écrit sa clé)
71. l'index unique remis sur `md5(designation)` (B ; essai 7 : les variantes redeviennent des postes)
72. l'index sur la clé EN CLAIR (B ; essai 1 : 2 000 caractères de quatre octets → 54000)
73. le droit d'exécuter la fonction retiré à `authenticated` (B ; essai 19 : toute insertion tombe sur 42501)
74. `base_poste_rapprochement_check` retirée (B ; essai 1 et 1 bis : « — » et U+3000 deviennent des postes)
75. la mémoire regroupée par la phrase EXACTE (A cas 28, 30 ; `verifier-devis` A-4)
76. la mémoire de même clé qu'un poste remise dans la liste (A cas 13, 31 ; G)
77. la recherche remise en sous-chaîne brute (A cas 32 : « Dalles » ne trouve plus « dalle »)
78. le tri « sans le pluriel d'abord » retiré (A cas 33 et 43 : un poste trouvé par le seul pluriel remonte)
79. la phrase du poste remplacée par la variante de la ligne sur « ce poste existe déjà » (E ; `mesure-devis`)
80. une séquence barre-oblique-u dans la section 50 (B)
81. `cle_rapprochement` lue ou envoyée par `api.js` (D ; essai 19 : 428C9 à l'écriture)

**[final] Ceux de la version finale (82 à 110)** — chacun posé à la main sur
une copie, refusé PAR LA BONNE vérification. Les sept marqués **joué** l'ont
été ici, sur le prototype (X-11, X-13, X-22, et `lotP/final/sab/`) :

82. la recherche remise en « sous-chaîne de clé » pour un mot de clé courte — « Les », « Sas », « oss » proposent (A : cas 45 et témoins du balayage)
83. la clé (`cleDeRapprochement` ou `aPlat`) affichée ou recopiée au lieu de la phrase (A : cas 51, titres = phrases rangées ; A (9) : un écran importe `rapprochement.js` ; `mesure-devis` : le champ après un appui)
84. `SUGGESTIONS_MAX` porté à 4, ou la coupe à trois retirée (A : cas 51, « au plus 3 » ; `mesure-devis` : « Pos » exactement 3)
85. une ligne sans prix en tête du groupe : `prix[0]` = `null` (A : cas 41 ; G ; `mesure-devis`, la ligne sans prix tapée)
86. le poste sans référence qui masque la mémoire sans reprendre son dernier prix (A : cas 42 ; G : `dernierPrix` 4 500 sur « faience »)
87. le tri par l'ordre à plat remis avant le dernier usage (A : cas 44)
88. le degré appliqué par source, ou « la base d'abord » avant le degré (A : cas 33 et 43)
89. `FeuilleAjoutPoste` qui importe ou ouvre `FeuillePoste`, ou deux booléens de feuille dans `SaisieDevisScreen` (E)
90. `sous` retiré de la ligne de référence ou du bloc (A : cas 46 ; E ; `mesure-devis` : la ligne « Depose… »)
91. le détail repassé à deux lignes (`numberOfLines={2}`), ou deux autres prix dans le détail (A : cas 49 ; E ; `mesure-devis` : la propriété de la rangée à 320)
92. le libellé VoiceOver sans le prix recopié, ou les autres prix avant lui (A : cas 47 ; `mesure-devis` : « 25,00 » avant « 23,00 » dans le libellé de « seuils »)
93. la feuille « existe déjà » pré-remplie avec le prix de la LIGNE au lieu du prix tapé, ou qui propose « Changer ma référence » à prix égal (E ; `mesure-devis` : le chemin « existe déjà », 24 € gardé)
94. `suggestionsPourLaFrappe` qui rend toujours `[]` (A : le témoin « Pos » = 3 — c'est lui qui le refuse ; sans lui, « au plus 3 » passerait)
95. une des trois lignes de « Sol du séjour » retirée (G : couverture ; `mesure-devis` : la précondition de sa section)
96. la garde de longueur retirée de la fonction SQL (essai 50, cas 22 : 57014 après plus de 7 s ; B) — **joué** (X-22)
97. la garde retirée du miroir (A : 2 écarts, G02 et G04 ; A (5)) — **joué**
98. la condition du verrou retirée du déclencheur (`est_mon_entreprise`) (essai 50, cas 23, procédure D : 57014 à 1,0 s ; B) — **joué** (X-13)
99. « < » remis en séparateur (A : 1 écart, 1 paire confondue ; l'empreinte) — **joué**
100. l'exception « bas » retirée (A : 5 écarts, 2 paires confondues ; l'empreinte ; A (6)) — **joué**
101. « ≤ » → « <= » dans la table (le générateur s'arrête sur l'invariant ; A (4) le refait) — **joué** (X-11)
102. une barre oblique inverse remise dans la fonction (`'\1\2'` au lieu de `chr(92) || '1' || chr(92) || '2'`) (B : aucune barre oblique inverse ; essai 50, cas 18 bis et 24 : sous `off`, « pose » suivi de caractères de contrôle, MESURÉ X-2 sur la v3)
103. U+200B remis en séparateur (A : 2 écarts, B11 et I04 ; l'empreinte) — **joué**
104. l'index unique remis sous son ancien nom `idx_base_postes_cle`, ou sans `collate "C"` sur `unite` (B ; essai 50, cas 20 ; G : la démonstration nomme le même index)
105. `postesPrepares` contourné : `cleDeLigne` appliqué à chaque poste à chaque frappe (A : cas 50 ; E)
106. `PLURIEL` exporté avec son drapeau `/g` (A (6) ; MESURÉ X-4 : `PLURIEL.test()` répond juste une fois sur deux)
107. `sous` comparé octet pour octet, sans `formeVisible` (A : cas 48)
108. « avant : » remis dans le détail, ou l'historique placé avant « fourniture non comprise » (A : cas 49 ; A : le mot « avant » absent des chaînes de `detailDeSuggestion`, dans le SOURCE de `postes.js`)
109. `PHRASE_SORTIE` retirée du bloc ou de la feuille (A : cas 46 ; E ; `mesure-devis` : la ligne « Depose… »)
110. `postesProches` qui rend encore la phrase plus longue, ou plus d'un poste (A : cas 37 ; E : une seule ligne dans la feuille)

Et une forme qui N'EST PAS un sabotage, à ne pas « corriger » : `.trim()`
à la place des deux remplacements de bord. Tous les blancs que JavaScript
rogne sont déjà des séparateurs de la table : le résultat est identique sur
chaque point de code. On garde la forme explicite parce qu'elle se lit
comme le `btrim(…, ' ')` de la fonction SQL, pas parce que l'autre serait
fausse.

---

## 7. Le protocole de vérification

### 7.1 Sur un PostgreSQL 16 neuf

Prélude puis `schema.sql` **deux fois**, `-v ON_ERROR_STOP=1`, aucune
erreur ; `essais-section-50.sql` deux fois (il se rejoue) ; l'essai 49
identique au relevé d'avant, dates et durées normalisées ; les 26 fichiers
d'essais comparés (seul l'essai 43, cas 2, change : 38 → 39 — MESURÉ X-15
sur le prototype final) ; **les quatre procédures** de l'en-tête de
l'essai 50 (A : le plafond, avec et sans le verrou ; B : la modification et
la suppression tardives, qui attendent le verrou de la récente ; C :
l'empreinte de tout Unicode, 50 s ; **[final] D : l'étranger ne prend jamais
le verrou de A**, forme déterministe puis forme de charge) ; et les verrous
partagés avec le lot 1 (§2.7). Une fois, la fonction et
`cas-rapprochement.json` rejoués dans deux bases neuves d'une autre collation
(`create database … locale_provider icu icu_locale 'tr-TR'` et `'fr-FR'`) :
0 écart, même empreinte (X-9) ; **[final] et le fuzz de 300 050 chaînes sous
les cinq réglages de X-10** (`node`, PostgreSQL, `standard_conforming_strings
= off`, `tr-TR-x-icu`, `C`) : un seul md5. Le tout sur le déclencheur final :
`id` et `pro_id` figés, phrase d'`OP018` en toutes lettres, verrou et compte
réservés à sa propre entreprise (ou sans jeton).

### 7.2 Les contrôles, le linter, les paquets

`npm run verifier` (chaque contrôle lu par son code de sortie ; un contrôle
qui PLANTE ne vérifie rien) ; le linter à 32 au plus ;
`npx expo export --platform ios` puis `--platform android`, **en lisant la
sortie** : « Exported », aucune « Import stack », `dist/` produit (CLAUDE.md,
l'export qui sortait 0 sur un paquet cassé). Puis les sabotages de §6.3.

### 7.3 Au navigateur, en démonstration (sans `.env`)

`npx expo start --web -c` (le surveillant de Metro a déjà servi un paquet
périmé), vrais événements tactiles (`scripts/gestes-tactiles.mjs`), à
390 × 844, 375 × 667 et 320 × 568. **Ce qui se mesure ici, et ce qui ne se
juge qu'au téléphone, est séparé** : les positions, les tailles, les
couleurs calculées, le geste qui gagne, le nombre de requêtes ; jamais le
clavier, `hitSlop`, VoiceOver ni Hermes. Les mesures nouvelles entrent dans
`scripts/mesure-devis.mjs`, **avant** « Supprimer ce brouillon » (`:1222`),
**chacune ouverte par sa précondition** (§6.2). À mesurer :

| | attendu |
|---|---|
| devis « Sol du séjour », ligne de la chape à 52,00 € | **la ligne de référence AU-DESSUS du champ prix** (y de la phrase < y du champ), le bloc d'écart dessous ; les deux phrases en `rgb` de `C.muted`, les montants en `C.ink` ; aucune fenêtre ; `sous` nul (même phrase) : ni « Ce poste existe déjà », ni phrase de sortie |
| la même ligne, prix remis à 45 puis champ quitté | l'écart disparaît, la référence reste |
| **[final]** devis « Sol du séjour », la ligne « Depose de l’ancien carrelage au sol » ouverte | « Votre prix de référence pour « Dépose de l’ancien carrelage au sol » : 18,00 € / m², fixé le … » au-dessus du prix ; le bloc : « Ce poste existe déjà dans votre base, sous « Dépose de l’ancien carrelage au sol ». », la phrase de sortie, « Vous mettez 20,00 € — c'est voulu ? », « Changer ma référence » ; **pas** d'« Ajouter à ma base » (CE3-6, CE3-7) |
| « Carrelage du sol » → « Poste suivant » → « chape » | **[final] exactement deux** propositions, comptées par le préfixe commun : la base à 45,00 € en tête (« réf. du … »), puis 38,00 € « fourniture non comprise » ; **52,00 € n'apparaît pas** ; leurs clés, reconstruites depuis les libellés, différentes ; **deux appuis** ; un appui sur la base recopie **45** ; le champ « Désignation » vaut la phrase de la démonstration, octet pour octet |
| sur une ligne neuve, taper « Dalles » puis « beton » | la dalle de la base est proposée les deux fois — **le protocole de la réponse 2** |
| **[final]** sur une ligne neuve, taper « Les », « Sas », « Aux » | **0 proposition** (aujourd'hui aussi, MESURÉ X-6 contre 3 pour la v3) |
| **[final]** sur une ligne neuve de « Sol du séjour », taper « seuils » | UNE rangée, « Seuil de porte en aluminium (…) », détail « 25,00 € / u · aussi 23,00 € » sur UNE ligne ; libellé « Reprendre : Seuil de porte …, par unité, au prix de 25,00 €, déjà écrit dans Sol du séjour ; aussi écrit à 23,00 € » (« 25,00 » avant « 23,00 ») ; un appui recopie 25 |
| **[final]** dans « Sol du séjour », une ligne TAPÉE « Seuil de porte en aluminium (fourniture seule, sans pose) », u, **sans prix**, carte fermée ; puis une ligne neuve, « seuils » | une rangée, titrée par cette phrase ; un appui recopie **25** (CE3-2 ; la v3 recopiait rien) ; puis la ligne sans prix est retirée (deux appuis) |
| **[final]** sur une ligne neuve, taper « gravats » | UNE rangée, titrée « evacuation des gravats en dechetterie » (la plus récente), « 180,00 € / forfait · aussi 150,00 € » |
| **[final]** sur une ligne neuve, taper « faience » | la base au forfait (900,00 €, « réf. du … »), puis « Pose de faïence murale », « sans réf. · dernier : 45,00 € / h » ; un appui sur la seconde recopie **45** (CE3-3) |
| sur une ligne neuve, taper « Pos » | **[final] exactement trois** : les trois « Pose », jamais « Dépose » en tête (CE3-4) |
| une ligne neuve écrite « chapes seches avant carrelage colle », m² | pas d'« Ajouter à ma base » ; « Ce poste existe déjà dans votre base, sous « Chape sèche avant carrelage collé ». » et la phrase de sortie ; la référence au-dessus du prix, qui nomme le poste |
| la ligne de la chape (existante) ouverte | **0 suggestion des deux sources** ; puis un « s » tapé à la fin → au moins une ; le « s » effacé → la phrase intacte |
| chaque proposition affichée pendant ces mesures, à 320 | **titre ≤ 2 lignes, détail = 1 ligne** (la propriété de CE3-10) |
| sur la chape, taper 70, « Poste suivant », revenir à la liste | Q3 a : la rangée de la chape ne dit RIEN de la référence (ni « réf. », ni 45,00 €) |
| appui sur « Pose de faïence murale » avec un prix déjà tapé | **[final]** le prix tapé est remplacé par 45 (le dernier prix, CE3-3) ; un poste sans référence ET sans dernier prix laisse le prix tapé en place (T10) — la démonstration n'en a pas : c'est le cas 16, sous `node` |
| la faïence (12 h) : retaper « faïence », choisir le poste au forfait | la phrase de T11 sous les unités ; elle s'efface quand la quantité est retouchée |
| **[final]** « Niche murale carrelée » (option, devis 1) → « Ajouter à ma base » | aucun champ n'a plus le focus ; une seule feuille (une seule `Modal` dans l'arbre) ; la phrase affichée sans champ ; le prix proposé 240,00 ; **le champ prix n'a pas le focus, et le bouton est visible sans défiler à 320 × 568** ; 44 points ; après validation : le bloc dit « Dans votre base de postes », le bouton a disparu, l'annonce est faite |
| la chape « fourniture non comprise » (38,00 €) → « Ajouter à ma base » | la feuille montre UNE ligne : « Déjà dans votre base, avec la fourniture : « Chape sèche avant carrelage collé » (45,00 € / m²) » (CE3-15) ; on la ferme sans ajouter |
| **[final] le chemin « ce poste existe déjà »** (CE3-6, CE3-8), en dernier sur les seuils : `PAUSE_POSTES_DEMO` à 5 s ; « Seuil de porte… » (25 €) → « Ajouter à ma base » → valider ; la feuille fermée par le voile pendant l'envoi ; la carte fermée ; « Seuils de porte… » (23 €) ouverte — le bloc dit encore « Ajouter » ; « Ajouter à ma base », le prix porté à 24, valider | la feuille passe à « Ce poste existe déjà » (d'elle-même quand le premier ajout arrive, ou après le 23505) ; elle montre « Votre ligne : « Seuils de porte… » », « Le poste : « Seuil de porte… » », l'explication, la phrase de sortie ; « Son prix de référence : 25,00 € » ; **le champ vaut 24** (le prix tapé, gardé) ; « Changer ma référence » → le poste vaut 24,00 € ; **un seul poste de cette clé** dans la base de démonstration ; aucune seconde `Modal` à aucun instant ; le premier ajout a été annoncé |
| **[final]** même chemin, prix laissé à 25 | « Il a déjà ce prix de référence » et le SEUL bouton « Fermer » |
| une ligne tapée par le script, « Dépose de l'évier chez Mme Exemple », puis « Ajouter à ma base » | l'avertissement (motif « chez / Mme » ; et le nom, si le devis de démonstration a un client du carnet), et le bouton **actif** |
| la ligne de la chape à 52,00 € → « Changer ma référence » | `FeuillePoste` pré-remplie à 52,00, par-dessus la carte ; « Enregistrer » → référence 52,00 € « fixé le <aujourd'hui> », l'écart disparaît, la carte est toujours ouverte, l'écran n'a pas quitté la saisie |
| « Mes devis » → « Ma base de postes » ; « Mon profil » → « Ma base de postes » | les deux portes ouvrent la même page ; la porte tient à 320 points ; les rangées ≥ 44 ; « seche chape » trouve la chape ; les plinthes disent « avant la déclaration de votre régime » ; « Ajouté le … depuis un de vos devis » et « Ajouté le … » ; la phrase longue sur trois lignes |
| fixer, changer, retirer un prix ; retirer un poste en deux appuis | les dates suivent ; la page relue |
| dans la page, corriger la phrase de la chape en « CHAPES SÈCHES avant carrelage collé » ; puis en « Pose de plinthes carrelées » (au m, comme le poste des plinthes : choisir un poste de même unité) | la première : aucune phrase d'avertissement, la ligne du devis reste reconnue ; la seconde : « Un autre poste de votre base porte presque la même phrase », « Enregistrer » désactivé |
| chercher « seche » puis « DURANDAL » dans la page | la chape ; le poste qui nomme le client de démonstration, s'il en est un (sinon : « Aucun poste ne contient « … ». ») |
| la lecture de la base coupée (`PAUSE_POSTES_DEMO` au-delà de 8 s) | la page : « Lecture impossible », jamais « Aucun poste » ; la carte : la phrase sous la désignation et UN « Réessayer », la mémoire marche encore, le bloc ne dit rien ; pendant la pause : aucun « Ajouter à ma base » |
| les cibles, les cliquets | aucune cible sous 44, sauf la croix des feuilles, NOMMÉE avec sa raison ; cliquets inchangés |
| « modifié entre-temps » | **non visible en démonstration**, et c'est dit : éprouvé par G sous `node` et sur la vraie base (§7.5) |

### 7.4 La VRAIE base — avant, la migration, après

**La forme seulement, et pour CETTE table une règle écrite** (CLAUDE.md
« Le premier VRAI client — mesuré sans être lu », et « le rôle de lecture
lit TOUT, RLS ignorée ») : toute requête qui nomme `base_postes` ne rend que
`count(*)`, `char_length(…)`, `… is null`, ou les lignes des comptes
JETABLES filtrées par leur `pro_id` ; **jamais `designation` ni
`prix_reference_centimes` d'un autre compte** — ce seraient les prix futurs
d'un artisan, lus par un concurrent qui administre la base. Un défaut à
diagnostiquer sur un compte réel passe par l'export que l'artisan envoie
lui-même.

**Avant**, par `SupabaseLecture`, la FORME : l'empreinte du catalogue,
comparée à l'imitation ; **[final] et ce relevé** (CP7), écrit pour marcher en
PostgreSQL 16 ET 17 — il ne nomme aucune colonne qui n'existe que dans l'un
des deux (`datlocale` en 17, `daticulocale` en 16) ; MESURÉ sur le 16, X-23 ;
il ne contient aucune barre oblique inverse :

```sql
select jsonb_strip_nulls(to_jsonb(d)) - 'datacl' - 'datfrozenxid' - 'datminmxid' as base,
       pg_encoding_to_char(d.encoding) as encodage,
       pg_database_collation_actual_version(d.oid) as version_reelle_collation,
       current_setting('server_version_num') as version_serveur,
       current_setting('standard_conforming_strings') as scs
  from pg_database d where d.datname = current_database();
select coalesce(r.rolname, '(tous les rôles)') as role, s.setconfig
  from pg_db_role_setting s left join pg_roles r on r.oid = s.setrole
 where s.setdatabase in (0, (select oid from pg_database where datname = current_database()));
select attcollation::regcollation as collation_designation_lignes
  from pg_attribute where attrelid = 'public.devis_lignes'::regclass and attname = 'designation';
```

À noter dans le compte rendu : le fournisseur de collation, `datcollate`,
`datctype`, la version enregistrée contre la version réelle (si elles
diffèrent, le dire : aucun index de la section 50 n'en dépend, d'autres
oui), `standard_conforming_strings` (la fonction finale n'en dépend plus,
CP3), et tout réglage par rôle ou par base.

La migration (§2.14), simulée, relue, **appliquée avec l'accord du
propriétaire**. **Après** : empreinte, corps, droits ; et **l'empreinte de
la clé sur le plan de base, calculée PAR LA VRAIE BASE — elle doit valoir
`0186e2b8b4500bac356bbc6f456937c4`** (§2.14). Si elle diffère : la migration
est gardée (aucun poste n'existe encore), mais l'étape 9 s'arrête, et
l'écart se relève point de code par point de code (la sonde de
`lotP/final/parite.sql` rend `n:clé` ligne à ligne).

### 7.5 La VRAIE base — par le chemin de l'application

Un `.env` posé pour l'essai puis retiré ; `scripts/relais-supabase.mjs` ;
`**/rpc/enregistrer_vues` neutralisé avant toute connexion ; comptes
jetables `…@exemple-opus.test` : un artisan A, un concurrent B, un
particulier P, placés loin de tout compte réel ; les deux preuves SIRET
`essai` déjà en base réutilisées si le propriétaire est d'accord (le
connecteur refuse un `delete`). Cas :

| | attendu |
|---|---|
| A range un poste depuis une ligne | `POST /rest/v1/base_postes 201`, une seule fois ; `prix_fixe_le` posée par la base |
| la référence et l'écart | les phrases sur la carte |
| le chemin du 23505 | le même poste inséré par `curl` avec le jeton de A juste AVANT l'appui (le double appui ne prouve rien, le bouton est désactivé) : 409, la base relue, la feuille passe à « Ce poste existe déjà », montre le poste et **garde le prix tapé** ; « Changer ma référence » → `PATCH … 200` avec la condition sur `modifie_le` |
| le 23505 d'une VARIANTE | par `curl`, « chapes seches avant carrelage colle » au m² pendant que l'écran a « Chape sèche… » sans l'avoir relue : 409 **`idx_base_postes_rapprochement`** ; la base garde UN poste, avec la phrase envoyée par `curl` (la première arrivée) |
| **[final]** les signes de sens | « Déplacement < 20 km » et « Déplacement > 20 km » au forfait : deux postes, 201 et 201 ; « Plancher bas » et « Plancher BA » au m² : deux postes |
| `cle_rapprochement` envoyée par `curl` | 400 · 428C9 ; jamais rangée |
| **[final]** la garde, par l'API (CP1) | `rpc/cle_de_rapprochement` avec le jeton de P (un particulier) : 2 000 caractères → une clé ; 2 001 → `null` ; un corps d'1 Mo → `null` en moins d'une seconde ; une insertion de 2 001 caractères par A → 400 `base_poste_designation_check` |
| **[final]** l'étranger ne compte pas (CP1) | A à quelques postes ; P puis B tentent d'écrire au nom de A : 403 (42501), jamais `OP018`, et la réponse arrive sans attendre |
| la lecture et la limite de l'API | A reçoit 1 000 postes d'un seul `POST` ; `GET` compté : **1 000 lignes rendues, `count` = 1 000** — la limite du projet est d'au moins 1 000 ; le 1 001e : `OP018`, phrase entière ; si moins de 1 000 lignes reviennent, la page dit « liste incomplète » et la limite est relevée dans le cahier suivant |
| la condition sur la date | une modification conditionnée **réussie** (preuve que PostgREST relit la date à l'identique, le `+` encodé), puis une seconde avec la même date : zéro ligne, « modifié entre-temps » |
| la lecture de la base coupée (`page.route` qui annule `/rest/v1/base_postes`) | « Lecture impossible » dans la page ; la phrase sous la désignation dans la carte ; la mémoire marche encore |
| B lit la base de A ; un visiteur | `[]` ; `401 · 42501` |
| B écrit au nom de A ; B modifie ou retire chez A | 403 ; 0 ligne, A intact |
| A cite le devis de B | 23503, puis le poste rangé SANS lien |
| A supprime le devis d'origine | le poste reste, « Ajouté le … » sans origine |
| l'export de A ; de B | `ma_base_de_postes` : n ; 0 |
| ménage par le chemin de l'application | 0 compte jetable, 0 poste ; la base revient à son état d'avant, relevé par `count(*)` seulement |

### 7.6 Ce qui ne se vérifie qu'au téléphone, et qu'il faut DIRE

Dans le build de développement ou Expo Go, **jamais l'icône « preview » du
17/10** ; **sur le compte PRINCIPAL du propriétaire, jamais sur le compte du
frère** : des postes qu'il y rangerait avec ses vrais prix seraient remis au
frère avec le compte — ses prix futurs donnés à un autre artisan.

- la feuille d'ajout et le clavier : le clavier se ferme-t-il avant la
  feuille ? le pavé décimal du prix monte-t-il avec la feuille ? **[final]**
  le prix ne prenant pas le focus à l'ouverture, le bouton reste-t-il visible ?
- **[final] une seule `Modal`** : dans « ce poste existe déjà », « Changer ma
  référence » enregistre-t-il sans qu'aucun voile invisible ne reste ? la
  carte répond-elle encore au doigt en refermant la feuille (CE3-5) ?
- la ligne de référence reste-t-elle visible pendant la frappe du prix ?
- sur un petit iPhone, la troisième suggestion se voit-elle, clavier
  ouvert ? **[final]** le détail d'une proposition tient-il sur une ligne ?
- « Changer ma référence » par-dessus la carte : retrouve-t-il sa ligne en
  fermant la feuille ?
- la croix des feuilles se touche-t-elle avec un gant ?
- VoiceOver : la référence et le bloc sont-ils lus au bon moment, sans rien
  annoncer d'office ? **[final]** une proposition dit-elle d'abord le prix
  qu'un appui recopie ?
- l'écart devant un client : la référence dans la ligne ouverte le gêne-t-elle
  ? — la liste, elle, ne la montre plus (Q3 a) ;
- sur une ligne neuve, « Dalles » propose-t-il la dalle, « seuils » une seule
  rangée, **[final] « Les » rien du tout** ? — c'est la preuve que la clé
  TOURNE sous Hermes (seule sa compilation est mesurée ici, X-21) ;
- **[final]** une ligne « Depose… » (sans accent) dit-elle « Ce poste existe
  déjà dans votre base, sous « Dépose… » » ?
- pour les AUTRES écrans, une question d'un appui : dans le choix des
  métiers, « macon » trouve-t-il « Maçon » ? (si non, `normalize` ne
  décompose pas sur ce téléphone, et `texte.js`, `clients.js`, `emetteur.js`
  le paient — pas le lot P)
- la page au pouce, la recherche, « Retirer ce poste » en deux appuis ;
- le correcteur sur la phrase d'un poste dans la page (« placo », « BA13 ») ;
- **les quatre questions du lot 1 qui touchent cet écran** (§1.6) ;
- **[final] les deux questions du §1.7**, si elles n'ont pas été posées avant
  la migration ;
- les calculs sous Hermes (seulement sous `node` ici ; la clé compilée par le
  `hermesc` du dépôt, X-21, pas exécutée).

---

## 8. Les étapes de construction, dans l'ordre — chacune vérifiable seule

### 8.0 Ce que le constructeur reprend tel quel

Tous dans
`/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lotP/final/`.
**Les fichiers qui portent des séquences barre-oblique-u se COPIENT par `cp`**
(le miroir en contient 942) : jamais recopiés à la main par un outil
d'écriture, qui les change en caractères sans le dire (W-0, CLAUDE.md « Le
transport du connecteur ») ; et après toute écriture d'une barre oblique
inverse, on relit les OCTETS (`od -c`). Le md5 de chaque fichier est relevé
ici : le constructeur le recompare avant de s'en servir.

| fichier | md5 | ce qu'il devient |
|---|---|---|
| `rapprochement-final.mjs` | `01997694f9e59874ec67aeb8f74c7965` | **`src/lib/rapprochement.js`, à l'octet** (8 812 octets, 0 caractère non ASCII) |
| `cas-rapprochement-final.json` | `b62bbf14b47a0e4059d3292072d801f1` | **`supabase/cas-rapprochement.json`, à l'octet** (175 cas, 22 paires, les deux empreintes) |
| `fonction-final.sql` | `b922d215511cda2057f17c4275f14711` | la CIBLE de `scripts/generer-rapprochement.mjs` : ce qu'il engendre depuis `rapprochement.js` doit être ce texte, à l'octet (14 102 octets, aucune barre oblique inverse) |
| `proto-50-final.sql` | `c497835a3f970f586f5a296b0fc3236c` | le modèle de la section 50 (table, contraintes, déclencheur final, politique, droits, index) — rejoué deux fois (X-15) |
| `proto-postes.mjs` | `6bfae5bf787e16c35418d32f2ba8818e` | les fonctions de `src/lib/postes.js` marquées **[final]** en §3.2 (le reste de §3.2 est à écrire) |
| `copie/src/lib/devis.js` | `02cae31807a891c83b279d0674c743cb` | le modèle de `src/lib/devis.js` : la mémoire finale, `cleDeLigne`, `correspondALaRecherche`, `degreDeCorrespondance`, `pourChercher` (91 lignes de différence avec le dépôt) |
| `table-final.json`, `gen_final.py`, `cas_final.py` | `43bad839…`, `fed15947…`, `dd438099…` | l'origine de la table et des cas (Python 3, `unicodedata` 14.0.0) : à garder avec le cahier archivé, pour le contrat de §3.0.8 ; **pas** dans le dépôt (le dépôt n'a pas de Python) |
| `jouer-js.mjs`, `jouer-sql.sql` | `eebf6d67…`, `6355a984…` | le modèle des joueurs de cas (`verifier-postes` A, essai 50 cas 18) |
| `parite.mjs`, `parite.sql` | `320cb61c…`, `814678ee…` | le modèle de l'empreinte (`verifier-postes` A, essai 50 cas 18 bis et procédure C) |
| `fuzz.sql`, `lotP/cp/fuzz.hex` | `153a7e6f…`, `d9f3f995…` | le fuzz de X-10, rejoué une fois à l'étape 2 (§7.1) |
| `verrou-p.sql`, `verrou-a.sql`, `procD-1.sql`, `procD-2.sql` | `551e62b3…`, `9fdcd8ff…`, `344ff004…`, `017e689f…` | les brouillons de la procédure D et du cas 23 de l'essai 50 |
| `sonde-final-placement.mjs`, `maquette-final2.mjs` | `ac7ad669…`, `582339e0…` | les modèles des propriétés de `verifier-postes` A (balayage) et de la mesure des rangées (`mesure-devis`) |
| `releve-collation.sql` | `bd5e5296…` | la requête de relevé de §7.4, recopiée dans le cahier |

### 8.1 Les fichiers du dépôt touchés

**Créés** : `src/lib/rapprochement.js` ; `src/lib/postes.js` ;
`src/components/FeuilleAjoutPoste.js` ; `src/components/FeuillePoste.js` ;
`src/screens/PostesScreen.js` ; `scripts/generer-rapprochement.mjs` ;
`scripts/verifier-postes.mjs` ; `supabase/cas-rapprochement.json` ;
`supabase/essais-section-50.sql` ; `docs/CAHIER-LOT-P.md` (le cahier
archivé, étape 11).

**Modifiés** : `supabase/schema.sql` (section 50 avant le titre 42,
`mes_donnees()`) ; `src/lib/devis.js` ; `src/lib/erreurs.js` ;
`src/lib/api.js` (les quatre fonctions, `monRegimeEtSaDate`,
`PAUSE_POSTES_DEMO`) ; `src/data/devis-demo.js` (la réserve de postes, une
requête à la fois, les trois lignes de « Sol du séjour ») ;
`src/components/ChampDesignation.js` ; `src/components/CarteLigne.js` ;
`src/screens/SaisieDevisScreen.js` (l'état `feuille`, les deux feuilles, les
postes passés aux cartes) ; `src/screens/DevisScreen.js` et
`src/screens/ProfilOwnScreen.js` (les deux portes) ; `src/OpusApp.js` ;
`src/lib/file-ecriture.js` (le commentaire de `:154-156`) ;
`src/data/legal.js` (§5) ; `scripts/verifier-devis.mjs` ;
`scripts/verifier-legal.mjs` ; `scripts/verifier-listes.mjs` ;
`scripts/mesure-devis.mjs` ; `package.json` (deux scripts) ; `CLAUDE.md`,
`docs/PLAN-DEVIS.md`, `docs/A-FAIRE.md` (étape 11).

**Relus sans changement attendu, et à constater** : `scripts/verifier-feuilles.mjs`,
`scripts/verifier-imports.mjs`, `scripts/verifier-portes.mjs`,
`scripts/verifier-echelles.mjs`, `scripts/verifier-atelier.mjs` (le linter à
32), `supabase/essais-section-43.sql` (sa SORTIE change au cas 2 : 38 → 39 ;
son texte, non).

**Jamais touchés** : `devis_lignes` et la section 49 (T17 : une phrase sans
clé reste permise sur une ligne) ; `texte.js`, `clients.js`, `emetteur.js`
(ils gardent `normalize`, hors du lot) ; aucun paquet (aucune dépendance
nouvelle, aucun module natif : rien à reconstruire sur le téléphone).

### 8.2 Les étapes

0. **Avant** : les réponses du 23/10 sont là ; **les deux questions du §1.7
   sont posées** (non bloquantes : sans réponse, le défaut — la règle dite le
   23/10 — est construit) ; relevé d'avant : base neuve, schéma ×2, les 26
   essais, `npm run verifier`, linter, paquets iOS et Android lus.
   *Vérifiable* : les relevés sont écrits, et l'arbre est propre.
1. **La clé, seule** : `src/lib/rapprochement.js` et
   `supabase/cas-rapprochement.json` copiés (md5 recomparés, `od -c` sur une
   séquence) ; `scripts/generer-rapprochement.mjs`, qui lit la table du
   miroir, refait l'assertion de l'invariant (CP4) et écrit la fonction entre
   ses marqueurs — son texte doit valoir `fonction-final.sql` à l'octet ;
   `verifier-postes` A, partie « la clé » (les 175 cas, les 22 paires, les
   deux empreintes, la table évaluée, l'invariant, la garde, le pluriel, les
   imports). *Vérifiable* : `node`, sans base ni écran.
2. **La base** : la section 50 (la fonction ENGENDRÉE, la colonne générée,
   les cinq contraintes, le déclencheur final — verrou et compte réservés à
   sa propre entreprise ou sans jeton —, la politique, les droits,
   `idx_base_postes_rapprochement`), `mes_donnees()`, les deux découpes de
   `verifier-devis`, sa liste `copies` et `jeuDe` ;
   `essais-section-50.sql` (cas 0 à 25, procédures A à D) ; les 26 essais
   rejoués ; `verifier-legal` (liste, `PRIVEES`, `PRIVEES_EDGE`, politique) ;
   `verifier-postes` B et C ; le commentaire de `file-ecriture.js`.
   *Vérifiable* : §7.1, et `verifier-devis`, `verifier-legal`,
   `verifier-portes` verts.
3. **Le calcul** : `devis.js` (la mémoire par la clé, `pourChercher` sans
   `normalize`, les trois exports nouveaux) ; **exactement quatre**
   vérifications de `verifier-devis` réécrites (§3.1, §6.2), après avoir
   constaté qu'elles, et elles seules, rougissent (X-16) ; `postes.js` (§3.2) ;
   `verifier-postes` A complet (les 51 cas, le balayage, le témoin).
   *Vérifiable* : `node`, sans écran.
4. **Erreurs, API, démonstration** : `erreurs.js` (§4.1), les quatre
   fonctions et `monRegimeEtSaDate` (§4.2), la réserve de démonstration, ses
   huit postes, les trois lignes de « Sol du séjour », une requête de postes
   à la fois, `PAUSE_POSTES_DEMO` ; `verifier-postes` D et G (couverture
   comprise). *Vérifiable* : `node` ; `verifier-devis` A-7 toujours vert sur
   ses totaux recalculés.
5. **Les écrans** : `ChampDesignation`, `CarteLigne` (référence, bloc,
   `sous`, la sortie), `FeuilleAjoutPoste` (ses deux états), `FeuillePoste`,
   `PostesScreen`, l'état `feuille` de `SaisieDevisScreen`, les deux portes,
   `sortir()`, `OpusApp` ; `verifier-postes` E et F ; `verifier-devis` E ;
   `verifier-listes`, `verifier-feuilles`, cliquets, linter, paquets lus, et
   **l'application démarrée au navigateur** (un export qui passe ne prouve
   pas qu'elle démarre).
6. **Les textes** : `legal.js` (§5), `VERSION`, `verifier-legal`.
   *Vérifiable* : `verifier-legal` vert, et rouge si l'une des phrases manque.
7. **Au navigateur, en démonstration** : §7.3 ; `mesure-devis` réécrit
   (`:730-781`, et les sections nouvelles AVANT `:1222`, chacune avec sa
   précondition) ; captures à 320, 375 et 390. *Vérifiable* : `npm run
   mesure-devis`, lu par son code de sortie.
8. **Relectures adverses** (base et sécurité ; écran ; textes) ; chaque
   problème REPRODUIT avant d'être corrigé ; puis **les sabotages de §6.3,
   de 1 à 110**, chacun refusé par la vérification qu'il vise.
9. **La migration** : construite par script, transport compté (0 séquence
   barre-oblique-u attendue), simulée par empreinte sur l'imitation de
   `d75217d`, relue, **appliquée avec l'accord du propriétaire**, relevée
   après (§2.14, §7.4) — **l'empreinte calculée PAR la vraie base doit valoir
   `0186e2b8b4500bac356bbc6f456937c4`**.
10. **La vraie base par le chemin de l'application** (§7.5), la limite de
    lecture de l'API relevée, ménage compris.
11. **Documenter** :
    - CLAUDE.md : une section « La base de postes — lot P » ;
    - `docs/PLAN-DEVIS.md` : les trois lignes de C1 ; « devis 087 » (C6) ;
      les réponses du 23/10 (Q1 à Q4, la reconnaissance des variantes) et
      **celles du §1.7** ; « aucune donnée de client » → « aucune colonne de
      client » (CD10) ; dans 10.5, **avant la remise du compte du frère,
      `count(*)` de ses postes = 0, ou vidés par lui** (CD6) ;
    - `docs/A-FAIRE.md` : la case de la colonne métier ; « Après le lot P » ;
      les six points de C10 ; la classe de blancs passée à huit copies dans
      cinq fonctions (lot S — fermé pour `base_postes` par la clé, ouvert pour
      `devis_lignes`) ; `normalize` reste appelé par `texte.js`,
      `clients.js` et `emetteur.js` (la question « macon », §7.6) ; le
      contrat « changer la règle de la clé » (§3.0.8) ; **[final]** la forme
      DÉCOMPOSÉE qui dit encore « sous » (T21) ; si la question A a été
      refusée, « 10cm » / « 10 cm » restent deux propositions, et c'est
      voulu ; la croix des `FeuilleBas` sous 44 points, un lot à part ; le
      contrat de sous-traitance devra couvrir la base de postes ; la purge des
      devis à un an (lot 4) ne touchera pas les phrases rangées dans la base ;
      au juriste, avant le lot 2 : « prix de référence » ne s'imprime sur
      aucun document adressé à un client (CD12) ; les questions de §7.6 ;
    - le cahier archivé dans `docs/CAHIER-LOT-P.md` ;
    - commit avec des chemins NOMMÉS (l'index git est partagé) ; push ;
      prévenir le propriétaire, avec les questions de §7.6 et le rappel du
      compte à utiliser.

---

## 9. Ce que ce cahier n'a PAS vérifié

- **Rien sur la vraie base** : sa collation (sans effet sur la clé : X-9 et
  X-10 le mesurent sous trois collations et deux réglages de chaînes, et
  l'étape 9 le confirme par l'empreinte calculée PAR la vraie base), son
  PostgreSQL 17 (**ce conteneur n'a que le 16** : la requête de relevé est
  écrite pour les deux, éprouvée sur le 16 seulement, X-23), l'état réel du
  schéma, la durée du verrou de `idx_devis_id_pro` sous charge, **la limite
  de lecture de l'API de ce projet** (1 000 SUPPOSÉ, d'après la valeur par
  défaut de Supabase). Aucun connecteur n'a été appelé, par personne, à
  aucune version de ce cahier.
- **PostgREST** : qu'il relise à l'identique la date de la condition
  (`+00:00`, encodé `%2B` — l'encodage est mesuré sous `node`, la relecture
  ne l'est pas).
- **Aucun écran n'est construit** : la ligne de référence, le bloc, les deux
  états de la feuille, la page sont décrits ; les hauteurs des propositions
  (X-20) sont celles de VRAIES rangées du lot 1 dont le texte a été
  remplacé, pas du composant à venir. **Le chemin « ce poste existe déjà »
  en démonstration (§7.3) n'a donc jamais tourné** : il dépend de la
  feuille, de la pause nommée et de la sérialisation des requêtes, qui
  n'existent pas encore.
- **Le clavier de l'iPhone** : ses hauteurs sont SUPPOSÉES ; ce que
  `Keyboard.dismiss()` change à la feuille ; que la ligne de référence reste
  visible pendant la frappe ; que le prix sans focus laisse le bouton
  visible.
- **La `Modal` unique** : la règle « jamais deux `Modal` » vient d'UIKit
  (SUPPOSÉ) et de CLAUDE.md ; `react-native-web` ne la montre pas.
- **VoiceOver** : qu'un libellé posé sur une vue non accessible ne soit pas
  lu (SUPPOSÉ) ; l'ordre de lecture du bloc ; que le prix dit d'abord soit
  entendu d'abord.
- **Hermes** : la clé n'a tourné que sous `node` 22 et PostgreSQL 16 ; sous
  Hermes, elle est COMPILÉE (X-21), pas exécutée. Que `normalize` existe et
  décompose sur l'iPhone n'est pas établi par le dépôt — la clé ne s'en sert
  pas (§3.0.7).
- **Le corpus est fabriqué** : 70 désignations et 757 textes tapés, écrits
  d'après le plan, pas de vrais devis. « 0 faux rapprochement de phrases »
  et « 4 trouvailles de plus, toutes justes » ne disent rien d'un carnet de
  cinq cents lignes ; les faux rapprochements de MOTS sont listés et
  acceptés (§3.0.3), sauf « bas » / « BA ».
- **La forme décomposée** affiche encore « sous « … » » (T21) : mesuré
  nulle part comme fréquent, supposé rare.
- **Le coût sous charge** : la fonction coûte 0,23 ms pour 50 caractères et
  8,3 ms pour 2 000 (W-12) ; 1 000 postes d'un ordre en 832 ms (X-14) ; la
  garde rend 10 Mo en 47 ms (X-12). Une écriture de `base_postes` est rare ;
  une lecture ne l'appelle jamais.
- **La table s'arrête au latin** : une lettre précomposée hors de la table
  (latine rare, non latine) garde son accent, quand sa forme décomposée le
  perd ; aucune lettre française n'est dans ce cas. Le grec et le cyrillique
  ne changent pas de casse.
- **Le nombre de postes qu'un artisan rangera** (« quelques dizaines ») est
  une supposition ; il décide de la borne et de l'utilité d'un filtre.
- **Aucun avis juridique** : sur le prix de référence HT face au taux
  horaire TTC du lot T ; sur « prix de référence » imprimé un jour à côté
  d'un prix plus bas (CD12, SUPPOSÉ : pourrait se lire comme une annonce de
  réduction) ; sur une phrase d'écran qui contredirait les conditions (CD2,
  SUPPOSÉ : pratique trompeuse) ; sur le préavis de quinze jours.
- **La détection d'un nom de client** n'a tourné que sur six cas fabriqués
  (rejoués par la clé, W-14) ; elle ne verra jamais un nom qui n'est pas sur
  la fiche (un voisin, un gardien).

---

## 10. Ce que la lecture « base » proposait, et qui a été corrigé dès la v1

- **L'index unique de l'esquisse de la lecture « base »**
  (`(pro_id, lower(designation), unite)`) refuserait une phrase longue en
  caractères de quatre octets (R1) ; il oubliait aussi la fourniture non
  comprise dans la clé, alors que la mémoire en fait deux entrées
  (devis.js:1057). Ici : `md5`, et la fourniture dans la clé.

---

## 11. Annexe — les mesures du rédacteur (v1)

Base `lotp_redac_2` sur le PostgreSQL 16.15 local : prélude, puis
`lotP/redac/schema-redac.sql` (le schéma du dépôt plus l'esquisse de §2,
engendré par `lotP/redac/gen.py`) **deux fois**, aucune erreur. Base témoin
`lotp_redac_1` : prélude, puis `supabase/schema.sql` deux fois, aucune
erreur. Les deux bases ont été supprimées. Fichiers dans
`/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lotP/redac/` :
`mesures.sql` et `mesures.out`, `e49-lotp_redac_1.out` et
`e49-lotp_redac_2.out`.

| | mesure | résultat |
|---|---|---|
| R0 | essai 49 sur le schéma actuel et sur le schéma avec l'esquisse | identiques, dates et durées mises à part ; 74 refus de chaque côté |
| R1 | index unique sur 2 000 caractères aléatoires de 4 octets (8 000 octets) | en clair : « index row size 5120 exceeds btree version 4 maximum 2704 » ; avec `md5` : `INSERT 0 1` |
| R2 | A supprime le devis d'origine d'un poste | lien vide, prix intact, **`modifie_le` inchangé** ; une écriture directe le fait avancer ; phrase rognée |
| R3 | A cite le devis de B ; un devis inexistant ; son devis | le même 23503 « Key is not present in table "devis" », sans valeur ; accepté |
| R4 | deux modifications parties avec la même date lue | la première `UPDATE 1`, la seconde `UPDATE 0` |
| R5 | dates | 2001 ignoré ; date du prix inchangée si seule la phrase change, avancée si le prix change, vide avec lui ; prix 0 → `base_poste_prix_check` |
| R6 | doublon | « Chape sèche » m² deux fois → 23505 `idx_base_postes_cle` ; avec deux espaces de fin → 23505 ; « Chape sèche », « chape sèche », au forfait, fourniture non comprise → 4 postes |
| R7 | l'origine | une modification vers un autre devis garde l'ancien ; vers vide passe |
| R8 | qui lit | A 1, B 0 ; B modifie / retire : `UPDATE 0` / `DELETE 0` ; visiteur : permission denied ; export A 1, B 0 |
| R9 | plafond 1 000 | 1 000 d'un ordre en 527 ms ; le 1 001e : `OP018` en 1,3 ms |
| R10 | le compte part | 1 poste avant, 0 après |

---

## Annexe A — Les trois critiques : ce qui a été vérifié, décidé, et où

Méthode : chaque problème a été relu sur sa source citée ; ceux de base qui
se font tourner ont été REPRODUITS par le réviseur sur sa propre base
(annexe B) ; les mesures d'écran de la critique écran (navigateur) n'ont
pas été refaites, mais chaque fichier et chaque ligne qu'elles mettent en
cause ont été relus. **Aucun problème n'a été écarté comme faux.** Quatre
ont reçu une correction différente de celle proposée, et c'est dit
(« adapté »).

### A.1 Critique droit et données (CD1 à CD14)

| problème | vérifié comment | décision | où |
|---|---|---|---|
| CD1 — le chemin d'effacement d'un client devient faux | **MESURÉ V-CD1** : fiche 0, devis 0, poste 1 avec le nom, lien vide, export contenant le nom ; LU `legal.js:754-756`, `verifier-legal.mjs:1011-1016` | retenu | §5, §6.2, §2.15 cas 4 bis, §8 étape 10 |
| CD2 — « Personne d'autre ne les voit » | LU `legal.js:667-670`, `verifier-legal.mjs:495-498` (lit `legal.js`, pas les écrans), `tarifs.js:61-72` | retenu | §4.7, §6.1 E, sabotage 54 |
| CD3 — avertissement générique, justification fausse | LU `DON:375-376` (une règle d'exclusion pour un lexique commun, pas une impossibilité) ; **MESURÉ** : `detection-client.mjs` rejoué, sortie identique à celle de la critique, faux positif compris | retenu, et combiné avec CE6 : la phrase n'est pas modifiable dans la feuille, l'avertissement renvoie à la ligne | §3.2, §3.3 cas 23, §4.6, §4.7 |
| CD4 — l'engagement ne couvre pas les phrases ; prix futur | LU `legal.js:651-672`, `verifier-legal.mjs:483-488` et `:1151-1153`, `DON:797-799` | retenu ; la phrase est AJOUTÉE hors de celle que le contrôle tient | §5, §6.2 |
| CD5 — la finalité se fixe maintenant | LU `DON:283-291`, `:650-659`, `:708-711`, `:722-725` ; `legal.js:863-878` | retenu : finalité étroite dans les textes ; les points 2 à 5 dans C10 et A-FAIRE | §1.3 C10, §5 |
| CD6 — vraie base et compte du frère | LU CLAUDE.md l.1085-1088 ; `PLAN:3056-3059` | retenu | §7.4, §7.6, §8 étape 10 |
| CD7 — l'origine réattache un client | LU `devis.js:1030-1044` (quatre mots de l'objet pour un devis manuel ; date par `modifie_le` du devis) ; mesure D4 de la critique relue | **adapté, plus loin** : aucune lecture du devis du tout ; la date du POSTE | C6, T15, §3.2 `libelleOrigine`, §4.2 |
| CD8 — pas de cas administrateur | **MESURÉ V-CD8** : administrateur 0, jeton inconnu 0 | retenu | §2.15 cas 5 bis, 5 ter, 13 ; §6.2 |
| CD9 — sections de `legal.js` oubliées | LU `legal.js:827-828`, `:1067-1069`, `:1096`, `:33-63` ; `DON:661-666` | retenu | §5 |
| CD10 — trois formules trop absolues | LU cahier v1 (en-tête 50, §2.10, §2.12) ; `PLAN:3130` | retenu | §2.0, §2.10, §2.12, §1.1, §8 étape 10 |
| CD11 — l'écart devant le client | LU `devis.js:1015-1016`, `PROP:101-103` | retenu comme « à dire » ; devient l'objet de Q3 pour la liste — **[v3] décidée : (a), la liste ne la montre pas** | §1.2, §1.5 Q3, §7.6 |
| CD12 — rendre la non-normativité contrôlable | LU `DON:808-832` | retenu : mots interdits, « Votre » exigé ; A-FAIRE ; juriste pour l'impression | §3.2, §6.1 A, §0.2, C10 (6), §8 |
| CD13 — changement de régime | LU schema:10193-10197, `FicheEmetteur.js:818-819`, `api.js:3044-3052`, `OpusApp.js:3522-3539` | retenu, sans colonne ; une lecture élargie, pas une lecture de plus | T9, §3.2, §3.3 cas 22, §4.2, §4.8 |
| CD14 — citations | LU chacune | retenu : DON:375-376 réattribuée, `legal.js:33-63`, CDC:295 « par analogie », l'origine, l'engagement | §0.3, §4.6, §5 |

### A.2 Critique base et sécurité (CB1 à CB13)

| problème | vérifié comment | décision | où |
|---|---|---|---|
| CB1 — 1 000 = limite de lecture de l'API, troncature silencieuse | LU `devis.js:207-209`, les `limit` de `api.js` (aucune au-delà de 500) ; la valeur du projet : SUPPOSÉE | retenu : `order`, `count`, `incomplete`, `LIMITE_LECTURE_API`, mesure sur la vraie base | §4.2, §3.2, §4.7, §7.5, §1.2 |
| CB2 — lecture d'un demi-mégaoctet | mesure de la critique relue (`cb/charge-utile.out` : 337 473 sans plongeon) | **adapté** : pas deux lectures, une seule, sans plongeon (CD7 le rend inutile partout) | T15, §4.2 |
| CB3 — variantes invisibles | **MESURÉ V-CB3** : 5 postes | retenu, option (a) : le dire, `postesProches` les montre ; option (b) (clé normalisée) **écartée** : elle changerait la clé de la mémoire du lot 1 et ferait dépendre l'égalité de tables Unicode qui peuvent différer entre PostgreSQL et Hermes. **[v3] Renversé par la réponse 2 du propriétaire : option (b), avec une clé SANS table Unicode — l'objection neutralisée et mesurée (§3.0, W-2 à W-4) ; la clé de la mémoire du lot 1 change avec elle (§3.1)** | T1, §2.8, §3.0, §3.3 cas 10 bis, §2.15 cas 7 |
| CB4 — un blanc hors classe | **MESURÉ V-CB4** : 5 sur 5 acceptés ; V-CB4b : la classe refusée | retenu : dit, rejoint le lot S ; **[v3] fermé pour la base de postes** par la clé vide (W-6, M2), ouvert pour `devis_lignes` | §2.3, C13, §2.15 cas 1 bis |
| CB5 — ajout tardif après retrait | **MESURÉ V-CB5** | retenu : dit, non couvert | §2.9, §2.15 cas 17 |
| CB6 — tardive à deux sessions | **MESURÉ V-tardive** : attente 2,3 s, `UPDATE 0`, prix gardé ; `DELETE 0` | retenu | §2.9, §2.15 en-tête et cas 8 bis, §2.7 |
| CB7 — deux cas mesureraient mal | **MESURÉ V-CB7** : `column_privileges` 33, `attacl` 0 ; LU `essais-section-49.sql:1192-1210` | retenu | §2.15 cas 12 et 13, sabotage 62 |
| CB8 — `invoker` est une propriété de sécurité | **MESURÉ V-CB8** (42501) et **V-CB8b** (`OP018` en `definer`) | retenu | §2.4, §2.15 cas 6 bis |
| CB9 — l'identifiant n'est pas figé | **MESURÉ V-CB9** puis la correction **V-fix** (`id` et `pro_id` gardés) | retenu ; l'attendu du cas 6 change (déplacer : `pro_id` reste) | §2.4, §2.15 cas 6 et 14 |
| CB10 — `upsert` au plafond | **MESURÉ V-CB10** | retenu : contrat écrit | §2.4, §2.15 cas 16 |
| CB11 — commentaire du lot 1 faux | **MESURÉ V-CB11** (`devis_pkey` dans les deux cas) ; LU `file-ecriture.js:154-162` | retenu | §2.1, §6.2, §2.15 cas 15 |
| CB12 — écriture future à profondeur > 1 | **MESURÉ V-CB12** : prix changé, `modifie_le` inchangé | retenu : contrat écrit | §2.4 |
| CB13 — l'export n'est pas « sur lui-même » | LU schema:12587-12601 | retenu (rejoint CD10) | §2.10 |

### A.3 Critique écran et vérifiabilité (CE1 à CE22)

| problème | vérifié comment | décision | où |
|---|---|---|---|
| CE1 — l'écart ne se voit pas dans le geste courant (bloquant) | LU `CarteLigne.js:110-114`, `:192-200`, `:256-279` ; `SaisieDevisScreen.js:825-831` (« Poste suivant » remplace la carte) et `:109-148` (`RangeeLigne`) | retenu ; **adapté** pour la liste : la référence AU-DESSUS du prix est construite d'office ; « réf. » dans la liste devient Q3 (le propriétaire décide, CD11) | §4.5, §1.5 Q3, §7.3 |
| CE2 — « Ajouter » sous la flottaison | LU ; positions mesurées par la critique | retenu : le bloc sous le prix | §4.5 |
| CE3 — suggestions sous le clavier | maquette de la critique relue (166 / 206 points ; 182 / 222 à 320) ; claviers SUPPOSÉS | retenu : aucun titre, détail court, budget | §4.4, §3.2, §6.2 |
| CE4 — `mesure-devis` aveugle | LU `mesure-devis.mjs:737`, `:749`, `:763` ; `ChampDesignation.js:154-156` | retenu : préfixe commun | §3.2, §4.4, §6.2 |
| CE5 — feuille et focus | LU `clavier.js:150-157`, `FeuilleBas.js:69` ; iOS SUPPOSÉ | retenu (forme + iPhone) | §4.5, §6.1 E, §7.6 |
| CE6 — corriger la phrase casse la clé | LU `devis.js:1057`, cahier v1 §4.6 | retenu, étendu à la feuille ouverte depuis la carte (T14) | §4.6, §4.7, T14 |
| CE7 — changer sa référence coûte huit gestes | LU `SaisieDevisScreen.js:1430-1441`, `verifier-devis.mjs:3266-3283` | retenu ; absorbe la Q3 de la v1 | §4.5, §4.8, T13 |
| CE8 — « c'est voulu ? » sans réponse possible | LU `PROP:101` : c'est la phrase du PROPRIÉTAIRE | **adapté** : la question reste (ses mots), elle reçoit sa réponse sur place (« Changer ma référence ») au lieu de devenir un constat ; montants par `Montant` ; « comment l'éteindre » dit une fois dans la page | T13, §3.2, §4.5, §4.7 |
| CE9 — pas d'état « en lecture » | LU | retenu | §3.2, §4.5 |
| CE10 — attendre la file | LU `ui.js:480-498`, cahier v1 §4.6 | retenu | T2, §4.6 |
| CE11 — la démonstration ne fait pas tout voir | LU `devis-demo.js:186-232`, `api.js:2769`, `mesure-devis.mjs:55-87`, `emetteur-demo.js:76` | retenu : sept postes, pause nommée, couverture | §4.3, §6.1 G |
| CE12 — croix sous 44 | LU `FeuilleBas.js:86-93`, `theme.js:420-422` (calcul 38 × 40) | retenu : exception nommée ; correction en lot à part | §4.9, §8 |
| CE13 — `FeuillePoste` dans son fichier | LU `verifier-feuilles.mjs:232-235` | retenu, les deux feuilles | §4.6, §4.7 |
| CE14 — libellé de groupe non lu | LU `ChampDesignation.js:135` ; UIKit SUPPOSÉ | retenu | §4.4 |
| CE15 — garde et feuille | LU `SaisieDevisScreen.js:1009-1013` | retenu | §4.8 |
| CE16 — textes | LU `devis.js:77-85`, `:1031` ; `CarteLigne.js:126-130` | retenu | §3.2, T11 |
| CE17 — `retour.succes()` | LU `retour.js:70-150` (aucun `succes`) ; linter mesuré par la critique | retenu | §4.6 |
| CE18 — deux « Réessayer » | LU | retenu | §4.4, §4.5 |
| CE19 — erreurs sur le fond beige | LU `DevisScreen.js:203-206` ; CLAUDE.md lot T (4,37) | retenu | §4.7 |
| CE20 — la porte de la page | LU `DevisScreen.js:94-101`, `ProfilOwnScreen.js:345-357` | retenu : deux portes, une fonction | §4.8 |
| CE21 — contrôles de syntaxe | LU `CarteLigne.js:195`, `verifier-devis.mjs:3266-3283` | retenu | §6.1, §6.2 |
| CE22 — protocoles incomplets | LU `A-FAIRE.md:2017-2049` | retenu | §7.3, §7.5, §7.6, §1.6 |

---

## Annexe B — Les mesures du réviseur

Base `lotp_rev_1` sur le PostgreSQL 16.15 local : prélude, puis
`lotP/redac/schema-redac.sql` **deux fois**, 0 erreur. RLS éprouvée par
`set local role` puis `set local request.jwt.claim.sub`, chacun son ordre,
jamais dans un bloc `do` ; chaque cas dans son `begin … rollback`. Fichiers
dans
`/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lotP/rev/` :
`repro.sql` → `repro.out`, `tardive.sh` → `tardive.out`, `fix-trigger.sql` →
`fix-trigger.out`, `detection-client.out`. La base a été supprimée à la fin.

| | mesure | résultat |
|---|---|---|
| V-CD1 | fiche client + devis rattaché + poste « … chez Mme Durandal, 4 rue des Essais » lié au devis ; suppression de la fiche puis du devis | fiche 0, devis 0, **poste 1, nom présent, lien vide** ; `mes_donnees()` contient le nom |
| V-CD8 | A a 1 poste ; B administrateur (`est_admin()` vrai) ; un jeton inconnu | **0** ; **0** |
| V-CB3 | « Chape sèche », « chape sèche », double espace, forme décomposée, espace insécable au milieu | **5 postes acceptés** |
| V-CB4 | U+3000, U+202F, `chr(11)`, `chr(133)`, `chr(8232)` seuls ; puis U+200B + U+00A0 + U+FEFF | **5 acceptés** ; refus `base_poste_designation_check` |
| V-CB5 | ajout, retrait, même ajout | 0 puis **1** |
| V-CB7 | `information_schema.column_privileges` pour `anon`/`authenticated` ; `pg_attribute.attacl` | **33** lignes ; **0** droit propre |
| V-CB9 | `update … set id = <autre>` sur l'esquisse | `UPDATE 1`, l'identifiant **récrit** |
| V-CB11 | un identifiant de devis déjà pris, le sien puis celui de B | `devis_pkey` les deux fois |
| V-CB8 | A au plafond (1 000), B écrit au nom de A (déclencheur `invoker`) | **42501** |
| V-CB8b | même chose, déclencheur passé en `definer` (dans la transaction annulée) | **`OP018` : « Votre base compte déjà 1000 postes… »** — l'oracle, et le nombre formé par `%` sans espace |
| V-CB10 | A au plafond, `insert … on conflict (id) do update` sur un poste existant | **`OP018`** |
| V-CB12 | un déclencheur d'une autre table change le prix d'un poste (profondeur 2) | prix 2 000, **`modifie_le` inchangé** |
| V-tardive | deux sessions : la récente (55,00 €) tient le verrou 3 s ; la tardive, partie 0,7 s après avec la même date lue (50,00 €) ; puis une suppression tardive | la tardive attend 2,3 s puis **`UPDATE 0`** ; prix final **5 500** ; suppression **`DELETE 0`**, le poste reste |
| V-fix | le déclencheur de la v2 (`new.id := old.id; new.pro_id := old.pro_id;`, phrase d'`OP018` littérale) dans une transaction annulée | l'identifiant reste ; `pro_id` reste A après `set pro_id = B` (`UPDATE 1`) ; 1 001e poste : **« Votre base compte déjà 1 000 postes… »** ; `tient_le_poste` `security invoker` (`prosecdef = f`) |
| V-43 | `essais-section-43.sql` sur `lotp_rev_1` | cas 2 : **39** fonctions de déclencheur ; cas 1 : 0 appelable |
| V-CD3 | `node lotP/droit/detection-client.mjs` | sortie identique à celle de la critique droit (six cas, faux positif compris) |

---

## Annexe C — Les mesures du rédacteur de la v3

PostgreSQL 16.15 local, `node` 22.22.0, le `hermesc` du dépôt. Base
`lotp3_red_1` : `supabase/local-prelude.sql`, puis `supabase/schema.sql` **deux
fois** (`-v ON_ERROR_STOP=1`, 0 erreur, `schema-1.log`, `schema-2.log`), puis
`fonction.sql` et `proto-50.sql` **deux fois** (0 erreur). Bases
`lotp3_red_icu_trtr` et `lotp3_red_icu_frfr` (`locale_provider icu`, la
fonction seule). RLS éprouvée par `set local role` puis `set local
request.jwt.claim.sub`, chacun son ordre, jamais dans un bloc `do`. Comptes
fictifs `…@exemple-opus.test`, SIRET fictifs, supprimés à la fin de chaque
mesure. Le dépôt n'a pas été modifié ; aucun connecteur appelé. Tous les
fichiers dans
`/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lotP/v3/`.

| | mesure | résultat | fichiers |
|---|---|---|---|
| W-0 | une séquence barre-oblique-u écrite dans une commande `bash` (heredoc) | elle arrive CHANGÉE en caractère dans le fichier : l'outil d'écriture la transforme avant l'interpréteur | (essai jeté) |
| W-1 | la table, engendrée une fois depuis la décomposition canonique d'Unicode (Python 3, `unicodedata` 14.0.0) | **955** caractères de départ (530 lettres, 20 chiffres, 271 séparateurs, 134 supprimés) et 20 remplacements multiples ; aucune lettre latine précomposée ne se décompose avec une marque hors de U+0300–U+036F ; fonction SQL de 13 438 octets, section 50 du prototype de 18 246 octets, **0 séquence barre-oblique-u** | `gen.py`, `table.json`, `rapprochement.mjs`, `fonction.sql`, `gen50.py`, `proto-50.sql` |
| W-2 | les cas partagés, écrits à la main | **145 cas, 0 écart** sous `node` ET sous PostgreSQL ; **15 paires distinctes, 0 confondue** des deux côtés ; `cle_de_rapprochement(null)` est `null` | `cas.py`, `cas-rapprochement.json`, `jouer-js.mjs`, `jouer-sql.sql` |
| W-3 | l'empreinte sur chaque point de code (sonde `c + 'a' + c + 'bs ' + c + 'X' + c`) | plan de base, 63 487 points : `e44358c4f33714756aec4daa6d5f09ca` des deux côtés (0,4 s / 3,1 s) ; tout Unicode, 1 112 063 points : `710b2483f241e7e0e57af67091a49a91` des deux côtés (3,5 s / 47,9 s) | `parite.mjs`, `parite.sql`, `parite-sql-complet.out`, `parite-resume.out` |
| W-4 | la collation | la même empreinte du plan de base dans une base `C.UTF-8`, ICU `tr-TR`, ICU `fr-FR`, et sous quatre collations explicites sur l'argument ; dans les mêmes bases, `lower('I')` = `ı` (tr), `lower(chr(304))` = `i` (C, tr) ou `i` + U+0307 (fr) | `parite-resume.out` (et la session) |
| W-5 | le corpus : 70 désignations distinctes, 13 familles de variantes (596), 6 autres formulations ; 375 mots | seuil 3 : **595/596** reconnues, **0 faux rapprochement de phrases** (2 415 paires) ; seuil 4 : 554/596 (articles 0/38) ; 0 autre formulation rapprochée ; 64 (seuil 3) et 42 (seuil 4) groupes de mots de même clé, listés | `corpus.py`, `corpus.json`, `mesure-corpus.mjs`, `.out`, `mots.mjs`, `.out` |
| W-6 | le prototype de la section 50, par le chemin d'un client | M1 : quatre variantes → **4 × 23505 `idx_base_postes_cle`**, forfait et fourniture acceptés, 3 postes ; M2 : « — », « — » + « ml », U+3000 seul, U+202F + U+0085 → **`base_poste_rapprochement_check`** ; U+200B seul → `base_poste_designation_check` ; M3 : `cle_rapprochement` écrite → **428C9** (insertion, modification), « POSES DE PLINTHES » → `pose de plinthe` ; M4 : sans `execute` → **42501** ; complément : « — » + prix 0, avec ou sans « ml » → `base_poste_prix_check` ; M5 : 1 000 postes d'un ordre **329 ms**, index **112 kB (114,7 o/poste)**, le 1 001e → `OP018` « … 1 000 postes … » ; M6 : 100 phrases de 2 000 caractères de quatre octets en 857 ms, clé de **8 000 octets**, index en clair refusé (**54000**, 8 032 > 2 704), 2 000 « ﬃ » → clé de 6 000 octets | `gen-mesures.py`, `mesures-v3.sql`, `.out` |
| W-7 | le contrat de la règle | `create or replace` de la fonction : la clé rangée **ne change pas** (`pose de plinthe`) ; `update … set designation = designation` : elle change (`pose de plinthes`) ; la vraie fonction restaurée | `contrat-regle.out` |
| W-8 | `verifier-devis` entier, sur une copie du dépôt (`git init` pour `git ls-files`) | avant : **292 ✔, 0 ✘** ; avec la mémoire de la v3 et `rapprochement.js` : **288 ✔, 4 ✘** — A-4 « DEUX suggestions », A-4 « trois prix », A-7 « TROIS entrées », B « EXACTEMENT deux imports » ; rien d'autre | `vd-avant.out`, `vd-apres.out`, `verifier-devis-ecarts.diff`, `devis-proto.diff` |
| W-9 | la recherche, un texte tapé contre 70 désignations | 757 textes, 52 990 comparaisons : **0 perte**, 154 trouvailles de plus ; « Dalles » 0 → 1, « carrelages » 0 → 4, « oeuvre » 0 → 1, « seche chape » 0 → 1 | `recherche.mjs`, `.out` |
| W-10 | les sabotages | miroir : `toLowerCase` 3 écarts + empreinte ; seuil 4 : 10 + empreinte ; marques retirées : 10 + empreinte ; **`normalize('NFC')` : 0 écart, empreinte changée** ; SQL `lower(` : empreinte changée, `c3f53411…` (C) contre `b0b032b2…` (ICU) ; comparaison des tables : identiques (955/821/20), `chr(233)` → `chr(232)` et `œ → o` refusés (code 1) | `compare-tables.mjs`, `fonction-lower.sql` (la session) |
| W-11 | Hermes | le `hermesc` du dépôt compile le miroir, expressions régulières comprises (5 339 octets de code octet) ; il refuse `/a{2,1}/` et une référence nommée inexistante (code 2) : il VALIDE les expressions à la compilation | `hermes-essai.js`, `hermes-essai.hbc` |
| W-12 | le coût | SQL : 0,23 ms pour 50 caractères, 8,3 ms pour 2 000 ; JavaScript (`node`) : 0,007 ms par phrase, 2,3 ms pour 500 lignes, 0,44 ms pour 2 000 caractères | `mesures-cout.out` |
| W-13 | les essais du dépôt sur le prototype | essai 49 : sortie identique à celle de l'esquisse de la v2, dates et identifiants normalisés (74 refus, listes 24/27, 0 écart d'argent) ; essai 43, cas 2 : 39 | `e49-v3.out` |
| W-14 | `indicesDuClient` par la clé | les six cas de la critique droit : mêmes indices (dont le faux positif « M. Blanc ») | `detection-cle.mjs`, `.out` |
| W-15 | les suggestions fusionnées, sur la VRAIE mémoire de démonstration et huit postes | « chape » → [base 45 €, mémoire 38 € f.n.c.] ; « Dalles », « beton » → la dalle ; « faïences » → deux postes ; « Pos » → trois « Pose » ; mémoire seule sur « chape » → [38 € f.n.c., 52 €/45 €] ; avec la ligne « Seuils » à 23 € → « seuils » : **une** proposition, `prix` 2 500 (Sol du séjour) puis 2 300 (Rénovation salle de bains) | `suggestions-proto.mjs`, `.out` |
| W-16 | une colonne générée vue d'un déclencheur `before` | il la lit **vide** ; ce qu'il y écrit (« forcee ») est **écrasé** par le calcul (`pose de solive` rangé) | `mesures-v3-complement.out` |

Les copies du dépôt (`copie`, `copie-avant`) ont servi à W-8 et W-15, puis
ont été supprimées (le diff du prototype reste : `devis-proto.diff`) ; les
bases `lotp3_red_*` aussi (0 restante).

---

## Annexe D — Les critiques de la v3 : vérifié, décidé, où

Méthode : chaque problème a été relu sur sa source citée (le cahier v3, le
dépôt au commit `d75217d`, les fichiers des deux critiques) ; **tout ce qui
se fait tourner a été REPRODUIT** par le réviseur, sur le PostgreSQL 16.15
local (bases `lotpf_rev_*`, supprimées à la fin) et sous `node` 22, sur la
v3 d'abord, puis sur le prototype final (annexe E). Deux problèmes ne se
font pas tourner (CE3-5 : une règle d'UIKit ; CE3-12 : une absence de
contrôle) : ils ont été LUS sur leurs sources, qui disent ce que la critique
dit. **Aucun problème n'a été écarté.** Cinq ont reçu une correction
différente de celle proposée (« adapté ») ; deux deviennent des questions au
propriétaire, avec un défaut (§1.7).

### D.1 Critique « parité, base et sécurité » (CP1 à CP10)

| n° | problème | vérifié | décision | où |
|---|---|---|---|---|
| CP1 | IMPORTANT — la fonction de la clé n'a pas de borne d'entrée et ne s'interrompt pas ; un étranger qui écrit au nom de A tient le verrou de A | **MESURÉ X-1** sur la v3 : 1 Mo en 4,2 s ; 10 Mo par un compte connecté tiennent le processus **39,4 s** malgré `statement_timeout = 8s` ; P écrivant au nom de A est refusé après **9,08 s** ; pendant ce temps A attend **8,07 s** pour son propre poste | **retenu** : une garde de 2 000 points de code en tête de la fonction ET du miroir (au-delà : pas de clé) ; le verrou et le compte du plafond pris seulement pour sa propre entreprise, ou sans jeton (l'éditeur SQL reste compté). Après : 10 Mo → `null` en 47 ms (X-12) ; P refusé en 54 ms, A en 14 ms (X-13) | §2.4, §3.0.4, T20 ; essai 50 cas 22, 23, procédure D ; sabotages 96, 97, 98 |
| CP2 | IMPORTANT — des faux rapprochements dangereux : les signes de sens effacés, « bas » réduit à « ba » | **MESURÉ X-3** sur la v3, des deux côtés (`cp2-js-v3.out`, `cp2-sql-v3.out`) : « Déplacement < 20 km », « > 20 km » et « 20 km » → `deplacement 20 km` ; « Plancher bas » et « Plancher BA » → `plancher ba` ; « R+1 » / « R-1 », « 50 € » / « 50 % », « 1 % » / « 1 ‰ » confondus ; « 60×60 » → `60 60`. LU : « RDC et R+1 » dans les devis du propriétaire (`docs/DEVIS-DU-PROPRIETAIRE.md:27, 64-65`) | **retenu, adapté pour « × »** : `<`, `≤` → inf ; `>`, `≥` → sup ; `+` → plus ; `%` → pourcent ; `‰` → pourmille ; `€` → euro ; `&` → et ; **`×` → la lettre x** (la critique proposait « espace x espace » ; la lettre rapproche « 60×60 » de « 60x60 », que tape un clavier de téléphone) ; « bas » ne perd jamais son s | §3.0.2, §3.0.3, §1.2 ; 7 paires nouvelles ; essai 50 cas 25 ; sabotages 99, 100 |
| CP3 | MOYENNE — la fonction `immutable` dépend de `standard_conforming_strings` | **MESURÉ X-2** sur la v3 : sous `off`, « Pose des plinthes » → `pose` suivi de quatre caractères de contrôle (`706f736501020102`), « Mur [bas] » → `mur` + `0x01 0x02` | **retenu, adapté** : plutôt qu'un réglage `SET` posé sur la fonction (la proposition), **aucune barre oblique inverse** dans la fonction — `chr(92) || '1' || chr(92) || '2'`, la barre de la table en `chr(92)`. Après : même empreinte, même fuzz sous `on` et `off` (X-10), `pose de plinthe` et `mur bas` sous `off` (X-12, F4) | §3.0.4, §2.14 ; essai 50 cas 18 bis, 24 ; sabotage 102 |
| CP4 | MOYENNE — un invariant de parité non écrit : SQL applique la table en deux passes, JavaScript en une | **MESURÉ X-11** : « ≤ » → « <= » donne `a<=b` en JavaScript et `a< b` en SQL | **retenu** : une sortie de remplacement n'est faite QUE de `a`–`z`, `0`–`9` et d'espaces, et aucun caractère de départ n'en fait partie ; asserté par le générateur (il s'arrête) et refait par `verifier-postes` A (4) | §3.0.5 ; sabotage 101 |
| CP5 | FAIBLE à MOYENNE — les caractères invisibles font des postes identiques à l'œil | **MESURÉ X-5** sur la v3, par le chemin d'un client : trois postes qui s'affichent pareil acceptés ; deux phrases faites d'invisibles seuls acceptées (5 postes) | **retenu** : 160 caractères SUPPRIMÉS (U+200B, U+200C, U+200D, U+2060, U+FEFF, U+180E, U+FE00–U+FE0F, quatre remplisseurs hangûl…), pas changés en espace. Après : un poste et trois 23505 (X-12, F1) ; un invisible seul → `base_poste_rapprochement_check` (F2) | §3.0.2, T17 ; essai 50 cas 1, 7 ; sabotage 103 |
| CP6 | FAIBLE — l'index unique reprend le NOM de la v2 avec une autre définition, et ses colonnes texte suivent la collation de la base | **LU** (`idx_base_postes_cle` en v2 et en v3, deux définitions) ; **MESURÉ X-2** : sur une base qui garde l'index de la v2, `create … if not exists` répond « already exists, skipping » et l'ancienne définition reste, sans erreur ; **MESURÉ X-12** (F8, la définition finale) et X-14 (88 kB pour 1 000 postes, contre 112 kB en v3, W-6) | **retenu** : `idx_base_postes_rapprochement` sur `(pro_id, (md5(cle_rapprochement)::uuid), (unite collate "C"), fourniture_non_comprise)` ; l'ancien nom n'existe nulle part | §2.6, §4.1 ; essai 50 cas 20 ; sabotage 104 |
| CP7 | FAIBLE — la collation de la vraie base : ce qu'il faut relever, et comment | **LU** : la v3 nommait des colonnes de `pg_database` qui n'existent qu'en 16 ou qu'en 17 ; **MESURÉ X-23** : la requête par `to_jsonb(d)` tourne sur le 16 | **retenu** : la requête de §7.4 ; et l'empreinte calculée PAR la vraie base reste la seule preuve | §2.14, §7.4 ; **non vérifié sur PostgreSQL 17** (§9) |
| CP8 | FAIBLE — aucune mise en cache des clés des POSTES | **LU** (`cahier-v3.md` §3.2 : `posteDeLaLigne` et la fusion recalculent `cleDeLigne` de chaque poste à chaque appel) | **retenu** : `postesPrepares()` (un `WeakMap` par tableau), `rangerPoste` remplace le tableau ; MESURÉ X-17 : le même objet rendu deux fois | §3.2, §4.4, §4.8 ; cas 50 ; sabotage 105 |
| CP9 | FAIBLE — une expression `/g` exportée ; le texte de la table inexact (955 contre 975, U+0000) | **MESURÉ X-4** sur la v3 : `PLURIEL.test('pose des')` trois fois → `true`, `false`, `true` ; **LU** les nombres | **retenu** : `PLURIEL` privé, `PLURIEL_SOURCE` exporté pour le contrôle ; le texte dit 998 caractères (530 + 20 + 30 + 258 + 160) et 968 dans la chaîne du `translate` ; U+0000 hors de la table, l'empreinte commence à U+0001 (X-7) | §3.0.2, §3.0.7 ; sabotage 106 |
| CP10 | À TRANCHER — « 10cm » / « 10 cm », « 60x60 » / « 60 x 60 », « 2ᵉ » / « 2e » ne sont pas rapprochés | **LU** (la règle dite le 23/10 ne les couvre pas) ; la critique MESURE 0 collision entre les 70 travaux du corpus avec l'extension | **question A au propriétaire** (§1.7), défaut **non** — la règle qu'on lui a dite, et « BA13 » / « BA 13 » distincts, comme dit en §1.2 | §1.7, C17 |

### D.2 Critique « écran, propositions et vérifiabilité » (CE3-1 à CE3-17)

| n° | problème | vérifié | décision | où |
|---|---|---|---|---|
| CE3-1 | BLOQUANT — la recherche par la clé fait surgir des propositions sans rapport | **MESURÉ X-6** sur la v3 (démonstration) : « Les » → 3 propositions sans rapport, « Aux » 3, « Sas » 3, quand le lot 1 n'en montre aucune ; la correction proposée (« commence un mot ») rejouée sur le corpus de la critique : « sous » trouve encore « soufflage », « Cons » « contre-cloison » | **retenu, adapté** : un mot correspond s'il est CONTENU dans la phrase à plat (le lot 1, rien de perdu), ou s'il est, privé de son pluriel, un MOT ENTIER de la clé (clé de trois lettres au moins, ou texte de plusieurs mots). **MESURÉ X-18** : 0 perte, 4 trouvailles de plus, toutes justes, sur 52 990 comparaisons | §3.0.6, T12, §1.2 ; cas 32, 45 ; sabotage 82 |
| CE3-2 | IMPORTANT — une ligne sans prix prend la tête du groupe, et l'appui ne recopie rien | **MESURÉ** sur la v3 (`repro-sonde.out`, S2) : `prix` = `null`/5 200/4 500, l'appui recopie `null` | **retenu** : une proposition ne retient que les prix UTILISABLES (entier > 0, valeur d'une ligne offerte comprise). MESURÉ X-17 : 52 € recopié | §3.1, T19 ; cas 41 ; sabotage 85 |
| CE3-3 | IMPORTANT — un poste sans prix de référence fait taire le dernier prix écrit | **MESURÉ** sur la v3 (S3) : « Pose de faïence murale » SANS PRIX, quand le lot 1 propose 45 € | **retenu** : le poste porte le dernier prix utilisable de même clé, dit pour ce qu'il est (« sans réf. · dernier : 45,00 € / h »), et un appui le recopie (X-17 ; tient sur une ligne à 320, X-20) | §3.2, T19, §1.2 ; cas 42 ; sabotage 86 |
| CE3-4 | IMPORTANT — l'ordre met en tête ce qu'on ne cherche pas | **MESURÉ** sur la v3 (S1, S5, S6) : « Pos » → « Dépose » en tête ; un poste trouvé par le seul pluriel devant « Pose de carrelage… » ; quatre « Chape » par ordre alphabétique | **retenu** : UN tri pour les deux sources — degré, la base à degré égal, le dernier usage, l'ordre à plat, l'identifiant. MESURÉ X-17 | T19, §3.2 ; cas 33, 43, 44 ; sabotages 87, 88 |
| CE3-5 | IMPORTANT — « Changer son prix de référence » ouvre une seconde `Modal` | **LU** : `FeuilleBas` est une `Modal` (`src/components/FeuilleBas.js:69`) ; iOS présente chaque `Modal` par `presentViewController` (`RCTModalHostViewComponentView.mm:150-156`) ; CLAUDE.md l.2903-2906. Non reproductible au navigateur (`react-native-web` n'a pas ce défaut) | **retenu** : « existe déjà » se règle DANS la feuille d'ajout (`modifierPoste`), qui n'importe pas `FeuillePoste` ; l'état des feuilles de la saisie devient UNE valeur, `choixClient` compris | §4.6, §4.8, T22, §7.6 ; sabotage 89 |
| CE3-6 | MOYEN — la phrase promise (« ce poste existe déjà ») n'apparaît presque jamais | **LU** (le bloc disait « Dans votre base de postes, sous … » ; la démonstration ne produisait jamais l'état de la feuille) | **retenu** : le bloc emploie les mots promis dès que `sous` n'est pas nul ; une ligne de démonstration EXISTANTE variante d'un poste (« Depose… ») ; le chemin « existe déjà » produit en démonstration (§7.3) | §4.5, §4.3, §7.3 ; sabotage 95 |
| CE3-7 | MOYEN — le poste reconnu n'est nommé que dans un état sur cinq | **LU** ; **MESURÉ X-17** : « Dépose fenêtre » et « Dépose fenêtres » au forfait ont la même clé | **retenu** : la ligne de référence nomme le poste quand la phrase diffère ; la phrase de sortie dans le bloc et dans la feuille — sans l'exemple de la critique, qui ne vaut que pour les fenêtres | §3.2, §4.5, §4.6 ; cas 46 ; sabotages 90, 109 |
| CE3-8 | MOYEN — la feuille « existe déjà » n'est pas une seule décision sans piège | **LU** (les six points, sur le texte de la v3 §4.6) | **retenu, les six** : le prix tapé gardé ; à prix égal, « Il a déjà ce prix de référence » et « Fermer » seul ; « Fixer le prix » pour un poste sans référence ; « Changer ma référence », le nom de la carte ; les deux phrases et l'explication ; la sortie | §4.6, T22 ; sabotage 93 |
| CE3-9 | MOYEN — la phrase la plus récente peut porter la faute | **MESURÉ** sur la v3 (S4) et sur le final (X-17, « gravats ») : la phrase tapée vite titre la proposition | **la règle est gardée** (réponse 2, non contestée) ; sa conséquence est DITE en §1.2 avec son remède (« Ajouter à ma base ») ; montrée en démonstration ; **question B** au propriétaire, défaut « la plus récente » | §1.2, §1.7, §4.3, C16 |
| CE3-10 | MOYEN — « ne grandit pas » est faux, et le budget n'est pas une propriété | **MESURÉ X-20** au navigateur, à 320 et 390 : les formats finals tiennent sur une ligne (55 points de rangée, 73 avec un titre de deux lignes) ; le pire cas fabriqué passe sur deux lignes sans la garde | **retenu** : la propriété « titre ≤ 2 lignes + détail 1 ligne », mesurée par `mesure-devis` ; un autre prix au plus, sinon « +k prix » ; `numberOfLines={1}`, la fourniture avant l'historique | §4.4, T23 ; cas 49 ; sabotage 91 |
| CE3-11 | MOYEN — « avant : » se lit mal, et VoiceOver n'annonce pas le prix recopié | **MESURÉ X-20** : le libellé du lot 1, relevé au navigateur, ne contient aucun prix | **retenu** : « aussi 45,00 € » ; le prix recopié par `Montant`, le reste en `C.muted` ; le libellé dit le prix recopié d'abord ; une seule forme en §1.2 | §3.2, §4.4, §1.2 ; cas 47 ; sabotages 92, 108 |
| CE3-12 | MOYEN — « la clé ne s'affiche nulle part » n'est tenu par rien | **LU** : aucune vérification de la v3 ni de `mesure-devis` ne le refuse | **retenu** : chaque titre est une phrase rangée, octet pour octet (A) ; aucun écran n'importe `rapprochement.js` (A (9)) ; le champ après un appui (`mesure-devis`) | §6.1, §6.2, §4.4 ; cas 51 ; sabotage 83 |
| CE3-13 | MOYEN — la démonstration ne fait pas VOIR ce que la réponse 2 promet, et deux essais se disputent les mêmes données | **LU** ; **et en vérifiant, un défaut de la v3 que la critique n'avait pas vu** : `scripts/mesure-devis.mjs:491` exige EXACTEMENT 4 postes chiffrés dans le devis 1, où la v3 posait sa ligne « Seuils » (LU) | **retenu, adapté** : les trois lignes dans « Sol du séjour », que personne ne compte ; la ligne SANS PRIX de la critique n'est pas rangée mais TAPÉE par `mesure-devis` (une ligne incomplète n'a rien à faire dans un devis de démonstration) ; l'ajout sur « Niche murale carrelée » ; une précondition par section. MESURÉ X-17 sur ce placement | §4.3, §7.3, §6.2 ; sabotage 95 |
| CE3-14 | MOYEN — des contrôles par l'exemple, des comptes qui passent à zéro, une section de `mesure-devis` qui va casser | **MESURÉ X-17** : 468 textes, 0 violation, « Pos » → 3 ; **LU** `scripts/mesure-devis.mjs:755`, `:763`, `:776`, `:780` | **retenu** : les propriétés du balayage, le témoin positif, les clés distinctes à l'écran, la section de la deuxième chape réécrite, la ligne existante suivie d'une lettre | §6.1 A, §6.2 ; sabotages 84, 94 |
| CE3-15 | MINEUR — « postes proches » : une seconde liste de trois, sans action | **LU** | **retenu** : une ligne, seulement pour la même phrase à une autre unité ou fourniture ; le prix sans focus à l'ouverture | §4.6, §3.2 ; cas 37 ; sabotage 110 |
| CE3-16 | MINEUR — « sous « X » » pour une différence qu'on ne voit pas | **LU** ; **MESURÉ X-17** : avec la forme visible, une espace insécable et un U+200B donnent `sous` nul | **retenu, adapté** : la forme visible (blancs, invisibles), **sans recomposer** les lettres décomposées — une seconde table pour un cas rare ; ce qui reste est dit (T21, §9) | §3.2, T21 ; cas 48 ; sabotage 107 |
| CE3-17 | MINEUR — trois phrases pour le propriétaire | **LU** (`cahier-v3.md` l.412-419) | **retenu** : l'écart se voit en rouvrant l'ANCIENNE ligne ; « aussi », dans la même ligne ; CE3-1, CE3-3 et CE3-9 dits | §1.2 |

## Annexe E — Les mesures du réviseur de la version finale

PostgreSQL 16.15 local (bases `lotpf_rev_1` à `lotpf_rev_4`, `lotpf_rev_fn`
et les bases ICU, toutes supprimées à la fin), `node` 22.22.0, le `hermesc`
du dépôt, Chromium de Playwright avec le serveur Expo du dépôt (en
démonstration, sans `.env`). Prélude puis `supabase/schema.sql` **deux fois**
(`-v ON_ERROR_STOP=1`, 0 erreur), puis `proto-50-final.sql` **deux fois**
(0 erreur). RLS éprouvée par `set local role` puis `set local
request.jwt.claim.sub`, chacun son ordre, jamais dans un bloc `do`. Comptes
fictifs `…@exemple-opus.test`, SIRET fictifs. **Le dépôt n'a pas été modifié
(`git status` vide), aucun connecteur appelé.** Tous les fichiers dans
`/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lotP/final/`.

| | mesure | résultat | fichiers |
|---|---|---|---|
| X-1 | CP1 sur la v3 : la fonction par taille ; 10 Mo par un compte connecté sous `statement_timeout = 8s` ; P au nom de A au plafond, pendant que A ajoute | 100 k : 0,43 s ; 1 M : 4,2 s ; **10 Mo : 39,4 s** puis 57014 ; P refusé après **9,08 s** ; A attend **8,07 s** | `cp1-v3.sql`, `.out`, `verrou-p.sql`, `verrou-a.sql`, `verrou-*-v3.out`, `fixtures.sql` |
| X-2 | CP3 et CP6 sur la v3 | `standard_conforming_strings = off` : « Pose des plinthes » → `706f736501020102`, « Mur [bas] » → `mur` + deux caractères de contrôle ; sous `on` : `pose de plinthe`, `mur ba` ; **CP6** : sur une base qui porte l'index de la v2, `create unique index if not exists idx_base_postes_cle …` répond « already exists, skipping » et la définition RESTE `md5(designation)` | `cp356-v3.sql`, `.out` |
| X-3 | CP2 sur la v3 : 21 paires de phrases, des deux côtés | les confusions de D.1 ; JavaScript et SQL identiques | `cp2-paires.txt`, `cp2.mjs`, `cp2-sql.sql`, `cp2-*-v3.out` |
| X-4 | CP9 : l'expression du pluriel exportée | v3 : `PLURIEL.test('pose des')` ×3 → `true`, `false`, `true` ; final : `PLURIEL` non exporté, `PLURIEL_SOURCE` une chaîne, la clé stable ×3 | `repro-cp9.mjs`, `.out` |
| X-5 | CP5 sur la v3, chemin d'un client | trois postes identiques à l'œil : `INSERT 0 3` ; deux phrases d'invisibles seuls : acceptées (5 postes) | `cp356-v3.sql`, `.out` |
| X-6 | CE3-1 sur la v3 et sur la règle proposée par la critique | v3 : « Les », « Aux », « Sas » → 3 propositions sans rapport, « Mes » 2, « Pas » 1 (lot 1 : 0) ; 154 trouvailles de plus dont 144 de bruit ; la règle « commence un mot » : 10 trouvailles, dont « sous » → « soufflage », « Cons » → « contre-cloison » et « conduit » | `repro-court.out`, `repro-gains.out`, `repro-regle2.out` |
| X-7 | la table finale, engendrée | 998 caractères : 530 lettres, 20 chiffres, 30 remplacements, 258 séparateurs, 160 supprimés ; 968 dans la chaîne du `translate` ; miroir de 8 812 octets, 0 caractère non ASCII ; fonction de 14 102 octets, 0 barre oblique inverse, `chr(92)` trois fois | `gen_final.py`, `table-final.json`, `rapprochement-final.mjs`, `fonction-final.sql` |
| X-8 | les cas partagés | **175 cas, 0 écart** sous `node` ET sous PostgreSQL ; **22 paires, 0 confondue** ; `cle_de_rapprochement(null)` est `null` (`strict`) | `cas_final.py`, `cas-rapprochement-final.json`, `jouer-js.mjs`, `jouer-sql.sql`, `cas-*.out` |
| X-9 | l'empreinte | plan de base, 63 487 points : `0186e2b8b4500bac356bbc6f456937c4` des deux côtés ; tout Unicode, 1 112 063 points : `10210195267001965d9327072ab14044` des deux côtés (3,9 s / 50,0 s) ; la même empreinte du plan de base dans deux bases ICU `tr-TR` et `fr-FR`, où `lower('I')` vaut `ı` et `i` | `parite.mjs`, `parite.sql`, `icu.out` |
| X-10 | le fuzz de la critique parité (300 050 chaînes, graine fixe) | **un seul md5, `1184249bd8d5aaefbb8b5c9d6b221468`**, sous `node`, PostgreSQL, `standard_conforming_strings = off`, `tr-TR-x-icu` et `C` ; identité ligne à ligne (un écart initial venait de la lecture CSV — un champ vide lu comme `null` — corrigé par `force_not_null`, pas par la fonction) | `fuzz.sql`, `fuzz-lignes.sql`, `fuzz-*.out` |
| X-11 | CP4 : « ≤ » → « <= » dans la table | le générateur s'arrête sur l'invariant ; sans l'assertion, JavaScript `a<=b`, SQL `a< b` | `sab-cp4/` |
| X-12 | la section 50 finale, par le chemin d'un client | F1 : variantes → un poste et trois 23505 `idx_base_postes_rapprochement` ; « < 20 km », « > 20 km », « 20 km », « bas », « BA » : sept postes, sept clés lues ; F2 : clé vide et invisibles seuls → `base_poste_rapprochement_check`, 2 001 caractères → `base_poste_designation_check` ; F3 : 428C9 ; F4 : sous `off`, `pose de plinthe` et `mur bas` ; F5 : 10 Mo par un particulier → `null` en **47 ms** ; F6 : 2 001 caractères → designation, 6 ms ; F7 : 2 000 caractères de quatre octets acceptés, clé de 8 000 octets ; F8 : la définition de l'index, `unite COLLATE "C"` | `mesures-final.sql`, `.out`, `proto-50-final.sql` |
| X-13 | le verrou de l'étranger, final | P refusé (42501) en **54 ms** ; A en **14 ms** ; condition retirée et 40 écritures étrangères en parallèle : A attend 298 ms ; procédure D déterministe : 12 ms, et 57014 à 1,0 s sous sabotage | `verrou-*-final.out`, `procD-1.sql`, `procD-2.sql`, `sab-verrou.sql` |
| X-14 | le plafond et le contrat | 1 000 postes d'un ordre en 832 ms ; index **88 kB** (90,1 octets par poste) ; le 1 001e : `OP018`, « … 1 000 postes … » ; B au nom de A au plafond : 42501, jamais `OP018` ; l'éditeur sans jeton au plafond : `OP018` ; une fonction remplacée ne recalcule pas la colonne rangée, une réécriture si | `plafond-final.sql`, `.out` |
| X-15 | les essais du dépôt sur le prototype | essai 49 : sortie identique à celle de la v3 (sur une base sans jeu commun : un premier essai, posé sur les mêmes SIREN, est tombé sur OP007) ; essai 43 : cas 1, 0 appelable ; cas 2, **39** (le prototype rejoué APRÈS le balayage, comme la migration) ; la liste fermée des fonctions `security definer` inchangée | `e43-final.out`, `e49-final.out`, `balayage-43.sql` |
| X-16 | `verifier-devis` entier, sur une copie du dépôt (`git init`) avec la mémoire finale et le miroir final | avant : **292 ✔** ; après : **287 ✔ et 4 ✘**, exactement A-4 « DEUX suggestions », A-4 « trois prix », A-7 « TROIS entrées », B « EXACTEMENT deux imports » | `copie/`, `vd-avant.out`, `vd-apres.out` |
| X-17 | les propositions finales, sur la vraie mémoire de démonstration et les huit postes | S1 « Pos » → trois « Pose » ; S2 → 52 € recopié ; S3 → « sans réf. · dernier : 45,00 € / h », 45 € recopié ; S4 → la phrase récente ; S5 → « Pose de carrelage… » d'abord ; S6 → la chape servie il y a une heure d'abord ; S7 → « aussi 150,00 € » ; les trois lignes de « Sol du séjour » **à leur place finale** : « seuils » → une proposition à [2 500, 2 300], « gravats » → une proposition titrée par la phrase tapée vite, « Depose… » → `sous` = « Dépose… » ; une espace insécable et un U+200B → `sous` nul ; « Dépose fenêtre(s) » au forfait : même clé ; le balayage : **468 textes, au plus 3, 0 violation** ; `postesPrepares` rend le même objet | `proto-postes.mjs`, `sonde-final.mjs`, `sonde-final-placement.mjs`, `.out` |
| X-18 | la recherche finale, 757 textes contre 70 désignations | **52 990 comparaisons : 0 perte, 4 trouvailles de plus** (« murs » → « mur » ×3, « carrelées » → « carrelée ») ; « Dalles », « carrelages », « seche chape », « oeuvre », « Seuils » trouvent ; « des », « les », « oss », « res », « vas », « sous », « Cons » rendent ce que rend le lot 1 | `recherche-final.mjs`, `.out` |
| X-19 | le corpus, rejoué avec la règle finale | seuil 3 : **595/596**, 0 faux rapprochement sur 2 415 paires, 0 autre formulation rapprochée ; seuil 4 : 554/596 | `mesure-corpus.mjs`, `.out` |
| X-20 | les rangées de proposition au navigateur, à 320 et 390 points (une vraie rangée du lot 1, textes remplacés) | les formats finals sur une ligne (rangée de 55 points ; 73 avec un titre de deux lignes) ; le pire cas fabriqué (montant à cinq chiffres, fourniture, « +2 prix ») sur deux lignes sans la garde ; le libellé du lot 1 ne contient aucun prix | `maquette-final.mjs`, `maquette-final2.mjs`, `maquette-final*-320.json`, `-390.json`, `*-final.png`, `expo.log` |
| X-21 | Hermes | le `hermesc` du dépôt compile le miroir final : 5 830 octets de code octet ; il refuse une expression littérale mal formée (code 2) | `hermes-final.js`, `.hbc`, `hermes-mauvais.js` |
| X-22 | la garde retirée de la fonction SQL (sabotage 96), rejoué à la fin de la révision | 2 Mo (`repeat('Chapes sèches, ', 140000)`) sous `statement_timeout = 2s` : **57014 après 7,7 s** — le délai ne coupe pas pendant la fonction ; la fonction finale, même entrée : `null` en 12 ms | `sab/S96.sql`, `sab/S96-garde-retiree-sql.sql`, `sab/S96.out` |
| X-23 | le relevé de la collation (CP7) | la requête par `to_jsonb(pg_database)` rend fournisseur, `datcollate`, `datctype`, version réelle, encodage, `standard_conforming_strings`, réglages par rôle — sur PostgreSQL 16 ; la collation de `devis_lignes.designation` : `"default"` | `releve-collation.sql`, `.out` |
| X-24 | le cahier lui-même, vérifié par l'assembleur | aucune séquence barre-oblique-u ; aucun marqueur resté ; chaque titre de §0 à §11, de §2.0 à §2.16, de §3.0 à §3.3, de §4.1 à §4.9, de §7.1 à §7.6, et les annexes A à E, présent une seule fois ; les sabotages 1 à 110 tous numérotés ; dans le corps (§0 à §9), l'ancien nom de l'index n'apparaît que là où il est INTERDIT ou RACONTÉ (§2.6, §2.8, §4.1, §6.1 B, sabotage 104) ; aucun identifiant de modèle d'IA ; aucune donnée personnelle | `assembler.py` |

Les sabotages joués ici, et ce qui les a refusés : 96 (X-22), 97 (A : G02,
G04), 98 (X-13), 99 (A : 1 écart, 1 paire, l'empreinte), 100 (A : 5 écarts,
2 paires, l'empreinte), 101 (X-11), 103 (A : B11, I04, l'empreinte) —
`sab/`, `sab-cp4/`, `sab-verrou.sql`.
