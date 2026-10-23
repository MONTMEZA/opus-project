# Lot 1 du module devis : le chiffrage — il tape, ça se totalise, et ça se relit

> **Archivé le 23/10/2026, après la construction.** Ce cahier a guidé le
> lot 1 (le chiffrage) ; il est versé ici tel qu'il a servi, pour qu'on sache
> plus tard POURQUOI chaque choix a été fait. À savoir en le lisant :
>
> - les fichiers qu'il cite sans chemin du dépôt (`lecture-plan.md`,
>   `lecture-code.md`, `lecture-droit.md`, `lecture-argent.md`,
>   `lecture-addendum.md`, les trois critiques `critique-droit.md`,
>   `critique-base.md` et `critique-ecran.md`, les dossiers `textes/`, `web/`,
>   `critique-web/`, `v2/`…) étaient des documents de travail de la session :
>   ils ne sont PAS dans le dépôt ;
> - les numéros de ligne (`PLAN:…`, `schema:…`, `api:…`, `OpusApp.js:…`) sont
>   ceux du commit `5897ef3`, d'AVANT le lot : le code a bougé depuis ;
> - il a été parcouru en entier à l'archivage pour en retirer ce qui
>   identifierait une personne réelle — tout nom propre, toute adresse
>   électronique, toute commune, tout numéro de neuf chiffres ou plus, tout
>   numéro de TVA, toute fiche de vrai client : **il n'y avait rien à
>   retirer**. Il ne mesurait la vraie base que sur sa FORME ; « Mme Martin »
>   est une fiche inventée de la démonstration (`src/data/demo.js`), Brest le
>   lieu habituel des comptes jetables, et le régime de TVA qu'il prête à
>   l'entreprise du frère est déjà écrit dans `docs/PLAN-DEVIS.md` ;
> - **trois passages (deux au §2.6, un au §2.11) montraient des caractères
>   invisibles** là où le texte voulait écrire une séquence lisible (`\u00a0`,
>   `\u200b`, `\u200c`, `\u200d`, `\u2060`, `\ufeff`) : l'outil d'écriture de
>   la session les avait changées en caractères — exactement ce que le §2.6
>   dit de ne jamais faire. Elles sont rendues ici sous leur forme écrite,
>   comme dans `schema.sql`. Rien d'autre n'a été touché ;
> - **ce qui a changé depuis, ou a été construit autrement** (le détail est
>   dans les comptes rendus d'étape, hors du dépôt, et dans CLAUDE.md) :
>   - les **réponses du propriétaire du 21/10**, en tête, priment sur le
>     corps : sept unités (« jour ») partout où le texte en compte six ; la
>     remise sur le TOTAL du devis, au lot 2, avant le PDF ; les primes
>     déduites, jamais — elles sortent de la liste du juriste (§10) ;
>   - **l'essai 49 compte 74 refus et 169 valeurs attendues.** Le tableau du
>     §2.12 en prévoyait moins (51 refus, d'après le compte rendu de l'étape
>     3), la fin de l'étape 3 en comptait 73 et 168 ; puis le commit `b1926d9`,
>     juste avant la migration, a ajouté deux cas (cas 20 : une tabulation
>     verticale retirée du code postal, « 13v410 » refusé) et reformulé un
>     commentaire, DANS le corps de `recalcule_devis()`, dont une ligne
>     commençait par un mot que le connecteur Supabase refuse ;
>   - **une parade que ce cahier ne connaissait pas — la requête arrivée en
>     retard** : une colonne `generation` sur `devis` et `devis_lignes`,
>     `recalcule_devis(uuid, bigint)` au lieu de `recalcule_devis(uuid)`, et
>     trois codes de plus, `OP015` et `OP016` (la parade) et `OP017` (20 devis
>     au plus par demande ou par urgence). Le cahier ne connaissait
>     qu'`OP013` et `OP014` ;
>   - `OP014` se compte sous le verrou du recalcul, et non dans
>     `tient_la_ligne_de_devis()` (mesuré : 9,7 s pour 500 lignes, et une
>     501ᵉ qui passait à deux sessions) ;
>   - les politiques disent `pro_id in (select public.mes_entreprises())`, et
>     non `est_mon_entreprise(pro_id)` (mesuré : l'export d'un artisan à
>     100 000 lignes passe de 10,6 s à 2,25 s) ; `est_mon_entreprise()` reste
>     la seule à décider. Les droits sont posés un par un (`revoke all`, puis
>     deux `grant`) ;
>   - trois règles de la base s'écrivent autrement que le §2 :
>     `devis_ligne_offert_check` en `<> 0` (avec `> 0`, un prix de −1 aurait
>     été annoncé « un prix de 0 s'écrit avec Offert ») ; `devis_tva_de` ne
>     calcule qu'un taux de 0 à 9000 (au-delà, `NULL`, jamais l'erreur 22003
>     en anglais) ; le code postal se nettoie par une liste explicite de
>     caractères, jamais `\s`, que PostgreSQL et JavaScript n'entendent pas de
>     la même façon ;
>   - la sécurité des trois tables est prouvée **par le catalogue** de la base
>     rejouée (cas 26 et 27 de l'essai, deux listes fermées de fonctions
>     `security definer`) : un contrôle qui lit du texte ne verra jamais
>     toutes les formes qu'un SQL peut prendre ;
>   - la migration réelle a créé les 23 contraintes **sous condition** dans un
>     bloc `do`, et non par la paire `drop constraint if exists` + `add` du
>     §2.11 (point 3) ; elle commence par `set local lock_timeout = '5s'`. Et
>     le transport du connecteur, relevé plus finement que le §2.11 ne le dit,
>     ne change une séquence en caractère que si sa barre oblique n'est pas
>     elle-même échappée ;
>   - à l'écran : l'écriture passe par UNE file par devis, partagée par la
>     saisie et « Mes devis » (`fileDuDevis()` et un registre), et non par six
>     fonctions libres ; `unDevis()` lit en UNE requête ; « + Poste » est dans
>     le pied d'un devis vide ; une ligne reprend le taux de la dernière ligne
>     du même TYPE ; la garde de sortie a deux bandes de plus (l'attente d'une
>     écriture, et un champ d'en-tête refusé) ; le code postal du lieu ouvre
>     le pavé numérique ; « Total », sans « TTC », hors du régime réel ;
>     depuis la saisie, la fiche d'un client existant propose « Choisir ce
>     client pour ce devis » ;
>   - **l'origine d'une suggestion de prix se nomme par sa DATE** quand le
>     devis d'origine vient d'une demande ou d'une urgence (son objet est le
>     texte d'un AUTRE client), par quatre mots de son objet sinon. Le cahier
>     disait « avec leur devis d'origine » sans dire comment le nommer :
>     tranché pendant la construction, à confirmer avec le propriétaire ;
>   - la mémoire rend une suggestion PAR PRIX (désignation, unité et
>     « fourniture non comprise » identiques gardent leurs trois derniers prix
>     différents, et chacun est une suggestion) ;
>   - `BLANCS_TARIFS` vit dans `src/lib/emetteur.js`, et non dans
>     `src/lib/tarifs.js` comme l'écrivent le §2.6 et le §3.3 ;
>   - le §2.6 se trompe encore deux fois sur la classe de blancs. Il dit
>     « au moins six fonctions » : relevé le 23/10, ce sont sept copies dans
>     quatre fonctions — `tient_les_tarifs` (section 46),
>     `tient_les_tarifs_publics` (section 47), `tient_le_devis` et
>     `tient_la_ligne_de_devis` (section 49) —, que `verifier-devis` compare.
>     Et il dit « des lots 0a, T et 48 » : ce sont les lots 0a, T et 1 — la
>     section 48, celle de VIES, n'en contient aucune ;
>   - `verifier-emetteur` a dû changer, contre le §3.2 : sa liste des imports
>     permis ne connaissait pas `centimes.js` ;
>   - `supabase/cas-devis.json` porte 44 cas, et « jour » n'est dans aucun
>     (l'essai 49, lui, insère une ligne dans chacune des sept unités) ;
>   - les textes opposables (`VERSION = '2026-10-22'`) nomment les trois
>     genres de demande (devis, rappel, urgence), disent « le plus souvent »,
>     et « ou y prépare des devis » ;
> - **ce qui a été réellement construit, et ce qui a été vérifié sur la vraie
>   base** — migration du 22/10 vers 23 h 43 (heure de Paris), essai par le
>   chemin de l'application les 22 et 23/10 — est dans CLAUDE.md, section
>   « Le chiffrage — lot 1 » ; **ce qui reste** est dans `docs/A-FAIRE.md`,
>   « Après le lot 1 ». En cas de désaccord, c'est CLAUDE.md et le code qui
>   disent vrai.

> **Ce document est un cahier de réalisation, pas du code.** Rien n'a été modifié dans le dépôt. **Version 2, du 21/10/2026.** La version 1 (20/10) a été relue par trois critiques indépendantes — droit (`critique-droit.md`), base et sécurité (`critique-base.md`), écran et vérifiabilité (`critique-ecran.md`), toutes dans le dossier de travail de la session. **Chaque problème soulevé a été revérifié sur sa source avant d'être retenu ou rejeté** ; l'annexe A dit, critique par critique, ce qui a été décidé et où. Les cinq lectures d'origine (`lecture-plan.md`, `lecture-addendum.md`, `lecture-code.md`, `lecture-droit.md`, `lecture-argent.md`) restent la base ; **ces fichiers ne sont pas dans le dépôt**.
>
> **Conventions.** `PLAN:x` = `docs/PLAN-DEVIS.md`, ligne x ; `schema:x` = `supabase/schema.sql` ; `api:x` = `src/lib/api.js` ; `LOTT:x` = `docs/CAHIER-LOT-T.md` ; `PROP:x` = `docs/DEVIS-DU-PROPRIETAIRE.md` ; `IA:x` = `docs/CONCURRENCE-IA-DEVIS.md` ; `CD:x` = `docs/CONCURRENCE-DEVIS.md` ; `CR-D`, `CR-B`, `CR-E` = les trois critiques (droit, base, écran), suivies du numéro du problème (`CR-B I1`). **ÉTABLI** = lu dans un fichier ou mesuré ; **DÉDUIT** = ma conclusion ; **TRANCHÉ ICI** = un choix que ce cahier fait, avec sa raison, et qu'on peut renverser. Les numéros de ligne sont ceux du commit `5897ef3` : ils bougeront dès la première ligne écrite — d'où les noms d'objets, partout où c'est possible.
>
> **Le droit** n'a pas été lu sur Légifrance (403 depuis le conteneur, revérifié par la critique droit le 20/10). Les textes viennent des données LEGI de la DILA (version du 13/07/2025), de `codes.droit.org` (non officiel), du BOFiP en direct et, pour la retenue de garantie, de la fiche de la Caisse des dépôts ; ils sont rangés dans `textes/`, `web/` et `critique-web/` du dossier de travail. Ce cahier ne crée **aucune clause** ; il dit, pour chaque colonne et chaque phrase affichée, le texte qui la justifie, et **dans quel champ ce texte s'applique** (CR-D I7).
>
> **Mesures sur la vraie base**, en lecture seule par `SupabaseLecture`, **sur la forme seulement** (aucun nom, aucun prix, aucune adresse, aucun régime de TVA lus) — relevées le 20/10, **refaites le 21/10 à l'identique** :
> - PostgreSQL **17.6** ; **14 comptes** (`auth.users`), 8 fiches pro ; le compte anonyme du 14/09 n'existe plus (DÉDUIT : supprimé par le propriétaire) ;
> - **aucun objet** dont le nom commence par `devis` dans `public` (tables, index…) ; **aucune contrainte** dont le nom commence par `devis` ; **aucune fonction** parmi `devis_total_ligne`, `devis_tva_de`, `recalcule_devis`, `tient_le_devis`, `tient_la_ligne_de_devis`, `recalcule_apres_ligne_de_devis` ; **aucun déclencheur** nommé `trg_tient_le_devis`, `trg_tient_la_ligne_de_devis`, `trg_recalcule_devis` ;
> - **noms déjà pris, à ne pas réutiliser** : l'index `idx_devis_pro` (sur `quote_requests`) ; les politiques `"creation devis"`, `"le pro traite le devis"`, `"lecture mes devis"` (sur `quote_requests`) et `"mes informations de devis"` (sur `emetteur`) ; le déclencheur `trg_notifie_devis` (sur `quote_requests`) ;
> - aucune fonction ne contient `OP013` ni `OP014` : **ce sont les deux prochains codes libres** (OP011 et OP012 sont pris, sections 46 et 47 ; OP003 reste réservé au devis remis, lot 2, `erreurs.js:305`) ;
> - `clients` : 1 ligne ; `quote_requests` acceptées ou terminées : 4 ; `sos_requests` : **0** ; `emetteur` : 1 ligne, régime déclaré (valeur non lue) ;
> - `statement_timeout` : **8 s** pour `authenticated`, 3 s pour `anon` (relevé dans `pg_roles.rolconfig`) — c'est la borne dure de toute lecture que ce lot ajoute (§4.2, la mémoire).
>
> **À refaire juste avant d'appliquer** (§7.4) : une base change.

---

> ## RÉPONSES DU PROPRIÉTAIRE — 21/10/2026 (elles s'appliquent à tout le cahier)
>
> - **Q1 — taux de TVA au régime réel : (a)**, au choix ligne par ligne dès le lot 1 (20 %, 10 %, 5,5 %), rien de pré-coché sur la première ligne, chaque ligne suivante reprend le taux de la précédente. Le cahier tel quel.
> - **Q2 — unités : (b), ajouter « jour »**. **SEPT clés** en liste fermée : `m2`, `m`, `m3`, `u`, `h`, `jour`, `forfait`. Libellés `jour` : court « jour », pastille « jour », nom « jour ». Partout où le cahier dit « six » unités, lire « sept » : `UNITES` de `devis.js`, `devis_ligne_unite_check`, les pastilles, la mémoire (une entrée par unité), `verifier-devis` (la liste fermée), la démonstration. Sept pastilles doivent tenir sur deux rangées à 390 points — à mesurer au navigateur.
> - **Q3 — remise : (c), une remise sur le TOTAL du devis**. Elle se construit **au lot 2, avant le PDF** (pas au lot 1) : répartition entre les taux au centime près par une règle écrite et éprouvée (lecture argent §3.5 : 334 au lieu de 333 sans règle du plus fort reste), prix avant remise conservé (BOFiP §220). **Le lot 1 ne pose aucune colonne de remise** (aucune colonne sans lecteur) ; il ne doit rien poser qui l'empêche : `devis_tva` est recalculée entièrement par la base à chaque écriture, donc une remise répartie au lot 2 s'y ajoutera sans réécrire de devis. À noter dans `docs/PLAN-DEVIS.md` et `docs/A-FAIRE.md` à l'étape 10.
> - **Q4 — primes déduites : (a), jamais**. Rien à prévoir.
> - **Q5 — compte d'essai sur l'iPhone : (a), son compte principal** — confirmé par lui le 21/10 (« oui mon compte principal c'est bon »).

## 0. En une page

### 0.1 Ce que le lot 1 livre

Un artisan ouvre **« Mes devis »** depuis son profil, touche « Nouveau devis » (ou « Faire un devis » sur la fiche d'un client, ou sur une demande qu'il a acceptée), et tape son chiffrage **pièce par pièce** : des titres de zone et de pièce, des lignes chiffrées (désignation, unité, taux, quantité, prix unitaire), des réserves, des options, des lignes « Offert ». Le devis **se lit en liste** ; une ligne **s'édite dans sa carte, qui prend tout l'écran** le temps de la modifier (§4.4, TRANCHÉ ICI après CR-E I6). **Chaque ligne s'enregistre en base quand on la quitte**, chaque rangée dit si elle l'est (« non enregistrée » sinon, avec « Réessayer »), et le total — HT, la TVA **par taux**, TTC — est celui **que la base a calculé**, pas celui du téléphone. Il retrouve ses brouillons dans une liste, les rouvre, les supprime. La fiche d'un client montre ses devis.

En haut de l'écran de saisie, en toutes lettres : **« Chiffrage — ce brouillon ne part pas encore. »** (`PLAN:2015-2016`). Un demi-produit qui s'annonce vaut mieux qu'un document qui a l'air conforme.

| ce qui est construit | où |
|---|---|
| trois tables privées : `devis` (statut `'brouillon'` seul), `devis_lignes`, `devis_tva` | `supabase/schema.sql`, **section 49** |
| deux fonctions de calcul (une par arrondi), trois déclencheurs **nommés**, une fonction de recalcul | section 49 |
| l'export RGPD : trois clés, et la clé `'devis'` renommée **`'demandes_de_devis'`** (elle porte les demandes des deux côtés, CR-B I5) | section 42, `mes_donnees()` réécrite |
| le calcul pur : `src/lib/centimes.js` (sorti d'`emetteur.js`) et `src/lib/devis.js` | `src/lib/` |
| la liste « Mes devis », l'écran de saisie et ses quatre composants (`EnteteDevis`, `CarteLigne`, `ChampDesignation`, `ChoixClientDevis`), trois briques partagées (`Pastille`, `Interrupteur` sorti de `FicheEmetteur`, `Montant`, plus `ChampMontant`), « Faire un devis » sur la fiche client et sur une demande acceptée, « Ses devis » sur la fiche client | `src/screens/`, `src/components/`, `OpusApp.js` |
| **la file d'écriture** d'un devis : une requête à la fois, des identifiants choisis par le téléphone, un délai sur chaque écriture, une garde de sortie (CR-E B1, B2) | `src/lib/api.js`, `OpusApp.js` |
| les phrases de chaque contrainte, d'`OP013`, d'`OP014` et d'un interblocage (`40P01`) | `src/lib/erreurs.js`, section 49 |
| un mode démonstration qui fait **vivre** le mécanisme | `src/data/devis-demo.js` |
| les textes opposables qui parlent des données d'un client, **et ce qui survit à une suppression** (CR-D I5, I6) | `src/data/legal.js` |
| `npm run verifier-devis`, `npm run mesure-devis` (au navigateur, CR-E I7), et les contrôles existants mis à jour | `scripts/` |
| `supabase/essais-section-49.sql` (la procédure à deux sessions écrite dans son en-tête), `supabase/essais-section-49-temoin.sql` (le déclencheur témoin qui élargit la fenêtre de concurrence, **jamais** dans `schema.sql`) et `supabase/cas-devis.json` (les cas d'argent, joués par JavaScript ET par PostgreSQL) | `supabase/` |

### 0.2 Ce qu'il ne livre pas

**Il ne sort RIEN** : aucun numéro, aucun PDF, aucune remise au client, aucun figeage, aucune signature (lot 2 et suivants, `PLAN:2060-2066`). C'est ce qui en fait le lot « le mieux vérifiable du module » (`PLAN:2036`) : il n'engage personne. Et **aucune action d'IA** n'y entre (`PLAN:46`, `PLAN:3122`), **aucun prix d'un autre artisan, aucune moyenne** (`PLAN:3120`, `PLAN:3141-3154`), **aucun module natif** — donc aucune reconstruction EAS (l'identifiant d'une ligne vient de ce que le navigateur et le cœur d'Expo savent déjà faire, §4.2). La liste complète, avec la destination de chaque chose, est au §1.3.

### 0.3 Ce qui est tranché, et pourquoi, en une ligne chacun

| question | tranché | pourquoi |
|---|---|---|
| statut | `check (statut in ('brouillon'))`, une seule valeur | `PLAN:2011-2013` : quatre valeurs que rien ne produit seraient quatre valeurs mortes |
| `source` | `'manuelle'`, `'demande'`, `'urgence'` ; **figée après la création** | D3 (`PLAN:3506`) et 10.7 (`PLAN:3199`) ; elle dit le geste, elle ne se récrit pas |
| liens d'origine | `client_id` → une **fiche** du carnet, `quote_request_id`, `sos_request_id` : facultatifs, **`on delete set null`**, et **refusés (`OP013`) s'ils désignent la fiche ou la demande d'un autre artisan** | D1, D2, D3, D11 ; une vérification de clé étrangère ignore la RLS — **mesuré** par CR-B (`INSERT 0 1` sans la garde) |
| lieu d'exécution | **structuré** : rue, code postal, ville ; **proposé** depuis l'adresse du client quand il est vide | `PLAN:2923`, `PLAN:3221` |
| délai d'exécution | un texte court ; un appui **« Dans les 30 jours suivant la signature du devis »** qui dit pourquoi, **face à un particulier** ; **un avertissement, jamais un refus**, si le texte dit « indicatif » | L. 216-1 (consommateur, « sans retard injustifié et au plus tard trente jours après la conclusion du contrat », CR-D I1) ; R. 212-2 7° ; une seule règle plus stricte que la loi est gardée (`PLAN:3449`) |
| retenue de garantie | **une colonne** : son taux en centièmes de point, `null` = aucune, de 0,01 % à 5 % ; aucun montant rangé ; **une phrase qui ne promet jamais la restitution sans sa réserve** | décision du 17/10 (`PLAN:3368`) ; loi n° 71-584, art. 1er **et 2**, décret n° 71-1058, art. 1er (CR-D B2) |
| forme d'une ligne | cinq **types** (`zone`, `piece`, `poste`, `option`, `reserve`) ; rattachement à la pièce **par l'ordre, puis par l'identifiant** ; **« Offert » = un drapeau qui met le TOTAL à 0 et garde le prix** (facultatif) ; « fourniture non comprise » = un drapeau ; « main-d'œuvre » = un drapeau **sans contrainte d'unité** ; les **surfaces** sur la ligne de pièce | `PLAN:3082-3101` ; arrêté du 24/01/2017, art. 2 (le prix au m² est un prix forfaitaire, CR-D B1) ; BOFiP §220 (le prix avant remise, CR-D I3) ; CR-B I7 |
| unités | **sept clés** en liste fermée : `m2`, `m`, `m3`, `u`, `h`, `jour`, `forfait` (« jour » ajoutée par le propriétaire le 21/10, §9 Q2) ; la pastille montre « m linéaire », « unité » ; « ml » ne s'affiche jamais | `PLAN:2921` ; décret 61-501 art. 6 et 8 ; CR-E M10 ; réponse du 21/10 |
| taux de TVA | **centièmes de point** ; liste du lot 1 : `0, 550, 1000, 2000` ; **`0` = aucune TVA facturée sur la ligne — la raison (franchise aujourd'hui) est portée par le régime, jamais par la ligne**, et le lot 2 la fige sur le devis ; jamais affiché « 0 % » ; au régime réel l'artisan **choisit** le taux, rien n'est pré-coché sur la première ligne | `PLAN:2864`, `PLAN:2113-2120` ; CGI ann. II 242 nonies A, I, 8° (CR-D I4) ; §1.5 C3 |
| régime de TVA | **lu par l'application, à cinq états** (en lecture, échec, franchise, réel, non déclaré) ; **un échec ne s'affiche jamais « non déclaré »** ; relu au retour de « Mon entreprise » ; la base **ne le tient pas** au lot 1 — c'est le refus de remise du lot 2 qui le tiendra | CR-E B3 ; CR-B M5 |
| les deux arrondis | total de ligne `(q × p + 500) / 1000`, TVA par taux `(base × taux + 5000) / 10000`, en entiers, demi vers le haut, **une seule écriture SQL chacun** | `PLAN:2864`, `PLAN:3185` ; 1 400 007 cas sans écart (lecture droit §6.2) |
| plafonds | 99 999 999,99 € pour une ligne, sa valeur « Offert », le HT et le TTC ; quantité ≤ 99 999,999 ; **500 lignes par devis** (`OP014`) | tout calcul accepté reste exact ; tout refus sort d'une contrainte nommée ou d'un code `OP` (CR-B M9) |
| options | **hors des totaux ET hors de `devis_tva`** ; aucune addition de deux totaux ; le lot 2 imprimera, face à un consommateur, **le TTC du devis option comprise, calculé sur l'union des lignes** | C05/C05b ; arrêté du 3/12/1987, art. 1er (CR-D I2) |
| remise commerciale | **aucune au lot 1**, « Offert » seulement | §1.5 C6 ; question avant le lot 2 (§9, Q3) |
| qui tient les totaux | **la base** : recalcul complet à chaque ligne, sous un verrou **`for no key update`** ; `devis_tva` sans aucune écriture client ; les totaux du devis **relus** dans `devis_tva` | `PLAN:1169-1207` ; `for update` **interbloque** deux insertions (mesuré, CR-B I1) |
| écritures | **une file par devis** (une requête à la fois) ; **identifiants choisis par le téléphone** (une écriture renvoyée ne crée jamais de doublon) ; **insertion de la ligne entière, puis mises à jour** — jamais d'`upsert` partiel ; **un délai sur chaque écriture** ; une **garde de sortie** unique dans `OpusApp` | CR-E B1, B2 ; CR-B I3 |
| taux horaire du lot T | **en franchise** : proposé tel quel ; **au régime réel** : montré sous le champ, **jamais converti** | `PLAN:3479-3487` |
| montants en JavaScript | `versCentimes` et `centimesLisibles` **sortent** d'`emetteur.js` dans `src/lib/centimes.js`, qui n'importe rien ; `devis.js` n'importe que lui et les deux fonctions de date d'`entreprise.js` | une règle ne s'écrit qu'à UN endroit (§1.5, C8 ; CR-E I9) |
| la mémoire | les lignes de **ses** devis, brouillons compris, **filtrées par ses devis côté base** (jamais par la RLS seule), la plus récente d'abord, avec leur devis d'origine, **la fourniture et la main-d'œuvre recopiées** ; jamais de moyenne | `PLAN:2031-2034`, `PLAN:3120` ; CR-B I4 (mesuré : 306 ms contre 2,9 ms, §4.2) ; CR-E I3 |
| la liste | bornée à 200, triée par date (il n'y a qu'un statut), avec un pied qui **dit** la troncature ; le contrôle **exige** le tri par statut côté base dès qu'un second statut existe | `PLAN:2020-2024` |
| reporté au lot 2, avec sa raison | qualité du destinataire, caractère payant du devis, déchets, marqueur « relève de la construction », marqueur d'urgence par ligne, acompte, primes déduites | leur seul lecteur est le document ou le refus de remise (§1.3) |

---

## 1. Les décisions qui s'appliquent, et les contradictions tranchées

### 1.1 Ce que le plan et le propriétaire ont déjà décidé

| décision | source | ce qu'elle impose ici |
|---|---|---|
| le brouillon vit **en base dès la première ligne**, dans `devis`, **privée** : une politique `for all to authenticated` par `est_mon_entreprise(pro_id)`, aucune politique `anon`, `revoke all … from anon` | `PLAN:707-724` | §2.7 |
| `client_id` **nullable tant que brouillon** : « il tape ses lignes d'abord, il dit pour qui ensuite » | `PLAN:748-753` | §2.2 |
| tout l'argent en **centimes `bigint`**, recalculé par la base, jamais incrémenté ; la rupture avec `annonces_pro.prix numeric(10,2)` **commentée** dans `schema.sql` | `PLAN:1146-1177` | §2.2, §2.6 |
| la TVA vit dans **`devis_tva`**, une ligne par taux, arrondie **une fois sur la somme des bases** ; la ligne de devis porte son **taux**, jamais une TVA ; **aucune politique d'écriture** sur `devis_tva`, **une politique de lecture** | `PLAN:1178-1207` | §2.4, §2.7 |
| **taux en centièmes de point**, formule `(base * taux + 5000) / 10000`, en SQL **et** en JavaScript | `PLAN:2864` (10.3), `PLAN:3185` (10.7) | §3 |
| prix unitaire **au centime** ; « pour un besoin plus fin : la quantité (en millièmes), ou un forfait » | `PLAN:1221-1227` | §2.3 |
| `libellePrix()` ne sert jamais pour un montant de devis | `PLAN:1159-1167` | §4 |
| total recalculé **quand on quitte un champ**, pas à chaque chiffre | `PLAN:3217`, `PLAN:3292` | §4.4 |
| la **forme d'une ligne** se décide avant la table : titres à deux niveaux, réserve, « Offert », fourniture comprise ou non, quantité nombre + unité en liste fermée | `PLAN:3082-3094` | §1.4, §2.3 |
| **unité en liste fermée**, **main-d'œuvre : taux horaire et temps estimé, ou forfait**, **lieu structuré**, **centièmes de point** : « urgentes parce qu'imprimées ou contrôlées » | `PLAN:2917-2924`, `PLAN:3185` | §2 ; la main-d'œuvre est relue au §1.5, C20 |
| les surfaces de la pièce : **copie, pas lien** ; **tapées à la main, jamais exigées** | `PLAN:3096-3101` | §2.3, §4.4 |
| la **mémoire** : jamais de moyenne, les derniers prix avec leur devis d'origine | `PLAN:3120` | §3.3, §4.4 |
| correcteur du clavier **actif** sur les descriptions, **inactif** sur les quantités et les prix | `PLAN:3137` | §4.4, §6 |
| écran : lire en liste, éditer en carte, pièce par pièce ; **aucun tableau, aucun défilement horizontal** ; Inter `tabular-nums` aligné à droite **pour tout chiffre** ; virgule et point acceptés | `PLAN:3209-3214` | §4.4 (la brique `Montant`, CR-E I11) |
| « En faire un devis » ne pré-remplit **que la description** ; l'adresse vient du carnet | `PLAN:3221` | §4.7 |
| `quote_requests.budget` est du texte, **recopié comme contexte, jamais dans un calcul** | `PLAN:1481-1501` | §4.4 |
| **retenue de garantie : oui**, « lot 1, avant de créer la table `devis` » ; facturation à l'avancement : rien sur le devis ; prix indexé : rien | réponse du 17/10, `PLAN:3368` | §1.2, §2.2 |
| l'entreprise du frère est **en franchise en base** ; le régime reste une **déclaration** dans « Mon entreprise » | 17/10, `PLAN:3369` | §1.5, C3 |
| **un engagement écrit** : aucun écran ne montre les prix d'un artisan à un autre ; aucune fonction `admin_*` ne lit `devis`, `devis_lignes`, `devis_tva` | 18/10, `PLAN:3448` ; `PLAN:3156` | §2.7, §6 |
| **seule** règle plus stricte que la loi gardée : la relecture annuelle du SIRET | 18/10, `PLAN:3449` | **aucune règle plus stricte n'est ajoutée ici** : le délai « indicatif » est un avertissement, et la contrainte « main-d'œuvre ⇒ heure ou forfait » de la v1, qui en était une, est retirée (CR-D B1, §1.5 C20) |
| le taux horaire du lot T est **TTC, à deux états** ; le lot 1 le **copie** comme valeur proposée et modifiable ; **aucune règle de conversion** avant le juriste | 19/10, `PLAN:3474-3487` | §1.5, C9 ; §4.4 |
| l'ordre **T → 1 → P → S → 2 → 3 → 4 → 5** ; le lot T est fait | 19/10, `PLAN:3470` ; CLAUDE.md | le lot S (stockage) passe avant le lot 2, pas avant celui-ci : le lot 1 ne crée aucun espace de stockage |
| **D1** : le client est une **fiche du carnet**, jamais un compte ; pas de `compte_id`, pas de `particulier_id` ; l'écrire dans le commentaire de colonne | `PLAN:3504` ; `docs/AUDIT-ADDENDUM-QR.md:173-189` | §2.2 |
| **D2** : `quote_request_id`, jamais `demande_id` ; « va avec `sos_request_id` » | `PLAN:3505` | §2.2 |
| **D3** : `source` = le geste ; liens facultatifs et indépendants ; **aucune contrainte « origine ⇒ lien »** | `PLAN:3506` | §2.2, §2.12 cas 23 |
| **D4** : l'indépendance en trois parties, contrôlée par `verifier-devis` **livré avec la table** ; aucun index unique sur (pro, client), (pro, demande), (pro, lieu) | `PLAN:3507` | §6.1-B |
| **D5, D11** : écrites maintenant, tenues au lot 2 ; les trois liens en `on delete set null` | `PLAN:3508`, `PLAN:3514` | §2.2 |
| **D6** : le particulier ne lit **jamais** `devis` ; aucune règle sur ces tables ne passe par une relation ou un partage | `PLAN:3509` | §2.7 |
| **D9** : une seule orthographe `accepte`/`refuse` ; `verifier-devis` refuse les formes accordées dans tout le module, dès sa naissance | `PLAN:1513-1526` | §6.1 |

### 1.2 La retenue de garantie : le texte est relu, il entre

Le 17/10, le propriétaire a demandé la retenue de garantie, avec la consigne de **relire sur Légifrance** le plafond et la caution « avant d'écrire la moindre phrase » (`PLAN:3368`). Légifrance répond 403 ; **le texte a été lu dans les données LEGI de la DILA** (`textes/loi-71-584.txt`, `textes/decret-71-1058.txt` du dossier de travail), puis **relu une seconde fois le 21/10 pour la phrase de l'écran**, qui en disait plus que la loi (CR-D B2). Ce qui est **ÉTABLI** :

- loi n° 71-584 du 16/07/1971, **art. 1er** : les acomptes d'un marché de travaux privés « peuvent être amputés d'une retenue **égale au plus à 5 p. 100 de leur montant** et garantissant **contractuellement** l'exécution des travaux » ; le maître de l'ouvrage **consigne** une somme égale « entre les mains d'un consignataire, **accepté par les deux parties ou à défaut désigné par le président** » du tribunal ; la retenue « **n'est pas pratiquée** si l'entrepreneur fournit pour un montant égal une **caution personnelle et solidaire** » d'un établissement habilité (LEGIARTI000006474229) ;
- décret n° 71-1058, **art. 1er** : sont habilités « **les banques** ; **les établissements financiers habilités** à cet effet ; **les sociétés de caution mutuelle** » — « caution bancaire », écrit dans la v1, était plus étroit (LEGIARTI000019111124) ;
- **art. 2** : à l'expiration d'un an après la réception, « la caution est libérée ou les sommes consignées sont versées à l'entrepreneur, même en l'absence de mainlevée, **si le maître de l'ouvrage n'a pas notifié à la caution ou au consignataire, par lettre recommandée, son opposition motivée par l'inexécution des obligations de l'entrepreneur** » (LEGIARTI000006474230) — la v1 promettait « elle vous est rendue un an après », **sans cette réserve** ; la Caisse des dépôts le redit dans sa fiche de déconsignation (https://consignations.caissedesdepots.fr/sites/default/files/2025-12/Marche_travaux_%20prives_retenue_garantie.pdf) ;
- **art. 3** : toute clause contraire est **nulle** ; **art. 4** : applicable à la sous-traitance ;
- elle n'existe que **si elle est stipulée** — c'est pour cela qu'elle doit être sur le devis, qui devient le contrat ; rien n'en exclut le **particulier** maître d'ouvrage.

**Ce que le lot 1 range** (TRANCHÉ ICI, sur la proposition de la lecture droit §1.5) : **une seule colonne**, `devis.retenue_garantie_centiemes integer`, `null` = aucune retenue stipulée, sinon de 1 à 500 (0,01 % à 5,00 %). La même échelle que les taux de TVA, pour qu'il n'y ait qu'une unité de pourcentage dans le module.

**Ce qui n'est PAS une colonne** : le délai d'un an, la consignation, la caution (c'est la loi, identique pour tous, et une colonne « délai » permettrait d'écrire « 2 ans », nul par l'art. 3) ; le **montant** retenu (il dépend des paiements réels, donc des factures) ; la date de réception, le consignataire (des faits postérieurs). **Jamais une ligne négative, jamais une remise** : la retenue est une modalité de paiement, pas une réduction de prix ; la modéliser comme une remise ferait baisser le total et la TVA, ce qui serait faux — pour des travaux immobiliers, la base est « le montant des marchés, mémoires ou factures » (CGI art. 266, 1, **f**, plus précis que le a cité par la v1, CR-D M4).

**La phrase de l'écran** (une constante, `PHRASE_RETENUE` de `devis.js`, que le lot 2 imprimera telle quelle) :

> « Retenue sur les acomptes, au plus 5 % (loi n° 71-584 du 16/07/1971). Le client consigne la somme retenue chez un consignataire accepté par vous deux — à défaut, désigné par le président du tribunal. Elle n'est pas retenue si vous fournissez une caution d'un montant égal (banque, établissement financier habilité ou société de caution mutuelle). Elle vous revient un an après la réception des travaux, sauf si le client a notifié, par lettre recommandée, une opposition motivée par l'inexécution de vos obligations. »

`verifier-devis` tient la **propriété** : une phrase du module qui contient « un an » contient aussi « opposition » — on ne dit jamais la durée sans sa réserve (CR-D B2) ; et elle ne contient pas « bancaire » seul.

**Ce qui reste NON ÉTABLI, et le lot 1 ne l'affirme donc nulle part** : l'assiette HT ou TTC (« de leur montant » ; la FFB écrit TTC ; la Caisse des dépôts fait attester que la retenue « ne dépasse pas 5 % du montant des acomptes versés », ce qui soutient « sur ce qui est payé », DÉDUIT — CR-D M5) ; une retenue sur un paiement unique à la fin (le texte vise « les acomptes »). D'où : **l'écran n'affiche aucun montant de retenue** au lot 1, seulement le taux et la phrase. Ces deux points rejoignent la liste du juriste (`docs/A-FAIRE.md`).

**Son lecteur.** Au lot 1, l'écran de saisie (section « Conditions ») et l'export ; au lot 2, le document, qui l'imprime (`PLAN:3368`). Elle naît au lot 1 parce que le propriétaire l'a voulu « avant de créer la table », et parce qu'une colonne du devis doit naître avant le figeage du lot 2 (D5).

### 1.3 Ce que le lot 1 ne fait PAS, avec la destination de chaque chose

| quoi | où | pourquoi pas ici |
|---|---|---|
| statut autre que `'brouillon'`, numéro, verrou, format `DEV-2026-0001` | lot 2 | `PLAN:755-826` ; le format se tranche avant le lot 2 (`PLAN:3172`) |
| instantané `em_`/`cl_` de l'émetteur et du client — **dont le régime de TVA, figé sur le devis** : c'est lui, et plus jamais `emetteur`, qui dira ce que signifie une ligne à `0` sur un devis remis (« TVA non applicable, article 293 B du CGI » aujourd'hui ; « Autoliquidation » au lot 3) | lot 2 | `PLAN:1057-1144` ; CR-D I4. Au lot 1 rien n'est copié, sauf deux **valeurs proposées** (taux horaire, surfaces) |
| figeage, `OP003`, `preparer_remise_devis()`, motifs de refus de remise — **dont le refus d'un devis sans régime déclaré, ou dont les taux contredisent le régime** | lot 2 | `PLAN:2077-2084`, `PLAN:3191-3195` ; c'est là que la base tiendra ce que l'écran seul tient au lot 1 (CR-B M5) |
| PDF, `expo-print`, `expo-sharing`, espaces `devis` et `logos`, `ESPACES`, `ESPACES_PRIVES` | lot 2, après le lot S | `PLAN:3013` ; D7, D8 |
| **le TTC « option comprise »** imprimé pour chaque option face à un consommateur, calculé par `totauxDevis()` **sur l'union** des postes et de cette option (jamais par addition) | lot 2, avec son lecteur (le document) | arrêté du 3/12/1987, art. 1er : « la somme totale toutes taxes comprises qui devra être effectivement payée par le consommateur » (ÉTABLI, `textes/arrete-1987.txt`) ; CR-D I2. Au lot 1 aucune fonction ne le calcule (elle n'aurait pas de lecteur), mais **aucun contrôle ne l'interdit** : `verifier-devis` refuse l'**addition** de deux totaux, pas la phrase (§6.1-E) |
| **qualité du destinataire** (consommateur / non-professionnel / professionnel) | lot 2 | son lecteur est le choix des mentions imprimées (`PLAN:2925`) ; au lot 1 il n'aurait que son propre formulaire, et `client_id` est vide en brouillon. TRANCHÉ ICI |
| **caractère payant ou gratuit de CE devis**, et la proposition depuis `tarifs_pro.prix_devis_centimes` | lot 2 | une mention du document ; contradiction tranchée (§1.5, C10) |
| **déchets de chantier** (bloc par devis) — le coût estimé d'enlèvement (C. env. D. 541-45-1, I, 4°) sera **soit une ligne `poste`** (dans les totaux et la ventilation), **soit une estimation « dont » hors totaux** ; **jamais une colonne de montant sur `devis` que `recalcule_devis()` ignorerait** | lot 2 | `PLAN:2895` ; CR-D M8 |
| **marqueur « relève de la construction »** par ligne (attestation décennale, L. 243-2) | lot 2 | son seul lecteur est le refus de remise et l'attestation jointe (`PLAN:2867`) ; une colonne ajoutée au lot 2 **avant** tout devis remis ne gêne aucun devis figé (D5) |
| **marqueur d'urgence par ligne** | lot 2 | `PLAN:3002` ; le **lien** SOS, lui, entre ici (§1.5, C5) |
| un **avertissement** au franchisé dont le devis dépasse à lui seul 41 250 € (il annoncerait une franchise que l'exécution du marché lui ferait perdre, CGI 293 B, I et II) — calculé, sans colonne | lot 2 | CR-D M7 |
| **primes déduites** (CEE, aides publiques) et « prix barré » : aucune forme au lot 1 (aucune ligne négative) ; leur traitement fiscal n'est **pas** établi | question du lot 2 (§9, Q4) | CR-D M12 |
| acompte, « reste à payer » | lot 2 | `PLAN:2871`, `PLAN:3105` |
| `lieu_conclusion`, `urgence_sollicitee`, `validite_jusqu_au`, « construction neuve ou transformation importante ? » | lot 2 | `PLAN:3002` |
| certification du preneur **sur le devis ou la facture** (CGI 279-0 bis, 3 ; 278-0 bis A, IV), `taux_justification`, `logement_acheve_le`, autoliquidation, taux d'outre-mer | lot 3 | `PLAN:2172-2187` ; CR-D M9 |
| `signe_le`, acceptation, `remplace_id`, pastilles « À relancer / En cours / Classés », purge à un an | lot 4 | `PLAN:3371` |
| base de postes, prix de référence, « Ajouter à ma base » | lot P | `PLAN:3116-3133` |
| **une remise commerciale** (en % ou en €) | à décider (§9, Q3) | aucune conception n'existe (§1.5, C6) |
| toute action d'IA, tout prix du marché, toute moyenne | jamais dans ce module | `PLAN:46`, `PLAN:3120`, `PLAN:3141-3154` |
| notifications de devis | — | `PLAN:2421` ; la collision `notifications.devis_id` (qui pointe `quote_requests`) reste dormante |
| renommer `quote_requests` | jamais | `PLAN:2422` ; seule la clé `'devis'` de `mes_donnees()` change de nom |
| `compte_id`, `particulier_id`, `visite_id`, `dossier_id`, `nature`, `date_redaction` ; `'qr'`, `'visite'`, `'dossier'` dans `source` | jamais au lot 1 | D1, D3, `PLAN:1446-1450`, `PLAN:1721-1729`, `PLAN:299-303` |
| index unique sur (pro, client), (pro, demande), (pro, lieu) | jamais | D4 : un client a plusieurs projets |
| un mode hors ligne | — | la parade est la sauvegarde **ligne par ligne**, avec une file qui **dit** ce qui n'est pas parti (§4.2) ; limite dite : une application tuée perd ce qui était encore dans la file (`PLAN:2431`) |
| un module natif | — | aucun : tout se recharge par Metro |
| une barre au-dessus du clavier (`InputAccessoryView`) qui montrerait le total pendant la frappe | essai sur l'iPhone d'abord | iOS seulement, invisible au navigateur : on ne livre pas ce qu'on ne peut pas voir. Le pied reste caché clavier ouvert, c'est **dit** (§4.4) ; si l'iPhone montre que ça gêne, c'est la parade suivante (CR-E I1) |
| le `truncate` que `authenticated` garde sur `clients` ; un blocage qui ne cache pas à l'artisan une demande déjà reçue (`quote_requests`, `sos_requests` et `mes_demandes_recues()` ne filtrent pas `est_masque`, mesuré par CR-B) — le devis en devient un lecteur de plus, par le budget ; une classe de blancs recopiée dans six fonctions (§2.6) | `docs/A-FAIRE.md`, avec le lot S | hors du lot, relevés en chemin (lecture code §1.2 ; CR-B M2, M8). « Un blocage est symétrique » ne dit pas si une demande déjà reçue doit disparaître : c'est au propriétaire |

### 1.4 La forme d'une ligne, tranchée

Le plan laisse quatre points « à trancher en écrivant le lot 1 » (`PLAN:3094`, `PLAN:3329`). Les voici, avec leur raison.

| point | tranché | raison |
|---|---|---|
| **la colonne de type et ses valeurs** | `type text not null default 'poste'`, valeurs **`zone`**, **`piece`**, **`poste`**, **`option`**, **`reserve`** | « poste » est le mot du métier pour une ligne chiffrée, et celui du lot P (« base de **postes** », `PLAN:3116`). « Offert » n'est **pas** un type : c'est un drapeau sur un poste (`PLAN:3090`). L'option **est** un type : les « options, non comprises » « y entrent » (`PLAN:3094`) |
| **fourniture : une troisième valeur « sans objet » ?** | **non** : un seul drapeau, `fourniture_non_comprise boolean not null default false` | le seul texte qui s'imprime est « fourniture non comprise » (`PLAN:3091`, `PROP:111-124`), exigé « explicitement » quand le prix ne comprend pas un élément indispensable (arrêté du 3/12/1987, art. 3, ÉTABLI). « Comprise » et « sans objet » n'impriment rien : une troisième valeur n'aurait **aucun lecteur** (limite dite : `docs/COMPARATEUR-MATERIAUX.md:775`) |
| **le rattachement à la pièce** | **par l'ordre**, puis par l'**identifiant** quand deux lignes ont le même ordre : une ligne appartient au dernier titre de pièce qui la précède dans ce tri, ce titre au dernier titre de zone | « le plus simple » (`PLAN:3094`). Une clé vers la ligne de titre poserait une cascade dans la même table pour un gain nul. **Le second critère n'est pas décoratif** : rien n'empêche deux lignes au même `ordre` (deux appareils, une renumérotation interrompue), et sans lui le rattachement dépendrait de l'ordre physique, différent entre PostgREST et JavaScript, sans erreur (CR-B I7). Partout — `order('ordre').order('id')`, `order by ordre, id` dans l'export, `trierLignes()` dans `devis.js` — et `verifier-devis` le tient. **Un index unique `(devis_id, ordre)` est écarté** : une renumérotation ligne par ligne heurterait ses propres valeurs intermédiaires |
| **le sous-total par zone et par pièce** | **affiché** à l'écran sur chaque titre, **en HT au régime réel** (en franchise, sans « HT » : CR-E M4) ; **imprimé** au lot 2 sous la même forme | les devis du propriétaire portaient un « Sous total » (`PROP:171-183`) ; il se calcule sans colonne (`PLAN:3094`). Jamais en TTC : la TVA vit par taux, pas par pièce |

**Et quatre choses de plus qui changent la forme d'une ligne**, décidées avec leur lecteur :

1. **« Offert » garde le prix, et met le TOTAL à 0** (TRANCHÉ ICI ; §1.5, C19). La v1 écrivait « Offert » = un prix de 0 (`PLAN:3090` : « une ligne à zéro centime + un drapeau »). Or si le geste est fiscalement une remise, la facture qui naîtra du devis devra porter le prix **avant** la réduction : ann. II 242 nonies A, I, 8° (prix unitaire HT) et 9° (« tous rabais, remises… ») ; BOFiP BOI-TVA-DECLA-30-20-20-10 §220 : le prix unitaire « doit être déterminé hors rabais, remises ou ristournes consentis, lesquels doivent faire l'objet d'une mention particulière » (ÉTABLI, `web/bofip-319741.txt:298-299`). Que l'« Offert » soit une remise ou une prestation à prix nul n'est **pas** établi (CR-D I3) — mais avec un prix à 0, la valeur est **perdue** au figeage, alors qu'en la gardant on ne perd rien. La règle : **`prix = 0` seulement avec « Offert »** (« seul l'interrupteur écrit 0 », la doctrine du lot 0a, intacte), **et « Offert » accepte un prix** — c'est donc un **sur-ensemble** de la v1 : tout ce que la v1 acceptait passe encore. Mesuré le 21/10 sur le prototype (`v2/offert-superset.out`) : un « Offert » de 10 € et un poste de 10 € à 10 % donnent `1000 | 100 | 1100` et une ligne de ventilation `1000:1000:100:2` ; **éteindre « Offert » fait revenir le prix tout seul** (`2000 | 200 | 2200`), ce qui règle aussi CR-E M2. Ce que le lot 2 imprimera d'une valeur offerte (« Offert — valeur 45,00 € », ou rien) se décide avec le juriste.
2. **Le drapeau `main_oeuvre`, sans contrainte d'unité** (TRANCHÉ ICI ; §1.5, C20). La v1 posait `devis_ligne_main_oeuvre_check` : « une ligne de main-d'œuvre n'a que l'heure ou le forfait pour unité ». **Elle est retirée.** L'arrêté du 24/01/2017 range lui-même les prix au mètre carré parmi les **prestations forfaitaires** : « le cas échéant, les prix TTC des différentes prestations forfaitaires proposées, **notamment les prix au mètre linéaire ou au mètre carré** » (art. 2, LEGIARTI000033959889, ÉTABLI), et son art. 4-I cite « l'heure de main-d'œuvre, le mètre linéaire ou le mètre carré » comme unités d'un même décompte. Le seul défaut que vise le 4-II — un taux horaire sans temps estimé — est **déjà impossible** : `devis_ligne_forme_check` exige une quantité sur tout poste, donc une ligne à l'heure porte toujours son temps (CR-D B1, revérifié). La contrainte était une règle plus stricte que la loi, contre la décision du 18/10, et sa phrase faisait dire à Opus « la loi m'interdit de chiffrer ma pose au m² ». **Le drapeau reste**, parce qu'il a des lecteurs que la loi justifie : à l'écran, il **propose** l'unité « heure » et le taux horaire déclaré, et quand l'unité est l'heure il nomme les champs « Taux horaire » et « Temps estimé » ; la mémoire le recopie ; au lot 2, le document distingue une heure de main-d'œuvre d'une machine louée à l'heure. Ce n'est **pas** la colonne `nature` retirée en 3.12 (`PLAN:1721-1729`), qui avait quatre valeurs et l'agent pour seul lecteur.
3. **Les surfaces de la pièce** : `surface_sol_milliemes` et `surface_murs_milliemes` (`bigint`, m² en millièmes), **sur une ligne `piece` seulement** (`PLAN:3096-3101`). Leur lecteur est l'écran : à l'ajout d'un poste au m² dans cette pièce, deux appuis « Sol 17 m² » / « Murs 42,5 m² » **copient** la valeur dans la quantité. Changer une surface ne modifie aucune ligne en silence.
4. **Aucune colonne de type « marqueur »** de plus (construction, urgence) : lot 2 (§1.3).

### 1.5 Les contradictions du plan, tranchées

| # | ce qui se contredit | ce qui vaut | source de la décision |
|---|---|---|---|
| **C1** | formule en **millièmes**, `(base*taux + 500)/1000` (`PLAN:1157`, `PLAN:2040-2043`) | **centièmes de point**, `(base * taux + 5000) / 10000` ; les sept cas réécrits, plus un cas à 1,05 % | `PLAN:2864`, `PLAN:3185`, `PLAN:3281` ; les deux formules coïncident sur tous les taux que l'ancienne sait écrire (lecture droit §6.2) |
| **C2** | le total « qui court pendant qu'il tape » (`PLAN:2025-2026`) | **recalculé quand on quitte un champ** ; entre-temps, la dernière valeur sûre, **avec** « ligne en cours » | `PLAN:3217`, `PLAN:3292` ; CD:342-363 (CR-E I11) |
| **C3** | « l'écran ne propose pas encore les trois taux » au lot 1 (`PLAN:2006-2007`, `PLAN:2172-2174`) — **contre** l'essai du lot 1 sur la vraie base, « un devis de 4 lignes **à 2 taux** » (`PLAN:2052-2053`) | **TRANCHÉ ICI** : au **régime réel**, l'écran du lot 1 propose **20 %, 10 %, 5,5 %** par ligne, **sans rien pré-cocher sur la première ligne** ; chaque ligne suivante reprend le taux de la précédente, modifiable. **En franchise**, toutes les lignes portent `0`, l'écran n'affiche **aucun** taux et écrit la mention de franchise (la constante `MENTION_FRANCHISE`, CR-D M6) à la place de la TVA. **Régime non déclaré** : la barre « Ajouter » ne propose que des titres et des réserves, et un bandeau ouvre « Mon entreprise ». **Ce n'est tenu que par l'écran** (CR-B M5) : aucune fonction de la section 49 ne lit `emetteur` (la liste fermée des lecteurs de prix ne bouge pas, §4.2) ; la base accepte donc une ligne chiffrée quel que soit le régime. Ce n'est pas dangereux au lot 1 — rien ne sort —, et c'est le refus de remise du lot 2 qui le tiendra (§1.3). Le propriétaire peut renverser ce choix (§9, Q1) | `PLAN:2113-2120` (« un faux 20 % serait pire qu'un refus ») ; IA:1802 |
| **C4** | lecteur n° 5 « sans la table `ouvrages` » (`PLAN:2033-2034`, `PLAN:2419`) | la **mémoire** reste au lot 1 ; la base de postes est le **lot P** | `PLAN:3107-3121` |
| **C5** | `source in ('manuelle','demande')` et `demande_id` (`PLAN:1421-1428`) ; le lien SOS rangé au lot 2 (`PLAN:3002`) | `quote_request_id` (D2) ; **`'urgence'` et `sos_request_id` entrent au lot 1** (TRANCHÉ ICI) : « Faire un devis » se pose sur « Pour moi », qui montre les urgences acceptées ; sans le lien, il faudrait cacher le bouton ou écrire `source = 'manuelle'` pour un geste qui ne l'est pas. Le **marqueur d'urgence par ligne** reste au lot 2 | `PLAN:3199`, `PLAN:3505` |
| **C6** | « une remise sur un montant impair » est un cas d'essai du lot 1 (`PLAN:2040-2041`) — **et rien ne définit une remise** | **aucune remise au lot 1** ; le cas d'essai est remplacé par « Offert » et par le refus d'une ligne négative. Une remise globale répartie taux par taux sans le plus fort reste donne **334 au lieu de 333** (lecture argent §3.5) : la construire sans sa règle de répartition serait exactement ce que ce module veut éviter. Question avant le lot 2 (§9, Q3) | lecture argent §2.6 ; EN 16931 BR-27, BR-32, BR-S-8 ; BOFiP §220, §240 |
| **C7** | la retenue « on ne la construit pas » (`PLAN:2432`, `PLAN:2583-2585`) | **au lot 1**, une colonne (§1.2) | réponse du 17/10, `PLAN:3368` |
| **C8** | `devis.js` « qui n'importe RIEN » et « pose le séparateur de milliers lui-même » (`PLAN:1166-1168`, `PLAN:3218`) — **contre** « une règle ne s'écrit qu'à UN endroit » : `versCentimes()` et `centimesLisibles()` existent déjà (`src/lib/emetteur.js:413-448`) | **TRANCHÉ ICI** : les deux fonctions **déménagent** dans `src/lib/centimes.js`, qui **n'importe rien** ; `emetteur.js` les **réexporte**. `devis.js` n'importe **que** `./centimes.js` **et `./entreprise.js`** (pour `dateFrancaise()` et `isoLisible()`, CR-E I9 : la leçon de la nuit du lot T). La propriété que « n'importe rien » protège — un fichier que `node` fait tourner sans React Native — est tenue : `entreprise.js` n'importe que `siret.js` et deux fichiers de données, qui n'importent rien (relevé le 21/10), et `verifier-tarifs` (vérification 49) le fait déjà tourner sous `node` | CLAUDE.md, « Un calcul pur vit dans un fichier qui n'importe RIEN » et « une règle ne s'écrit qu'à UN endroit » |
| **C9** | `LOTT:144-145` : taux horaire « à trois états », et le lot 1 « proposera `round(taux_ttc / (1 + taux_tva))` » | **deux états** (`null` ou 1 € – 1 000 €), **aucune règle de conversion** : **en franchise** le montant est **proposé** dans le champ ; **au régime réel**, le champ reste vide et la phrase sous lui **montre** le taux déclaré (« Votre taux horaire affiché : 62,50 € TTC. Ce champ est hors taxes : écrivez le montant HT que vous facturez. »). Mesuré : 12 euros ronds sur 131 ne se retrouvent pas en TTC à 10 % depuis un HT au centime (lecture argent §3.4) | `PLAN:3474-3487` ; `tarif_taux_horaire_check` (`schema:10799-10801`) |
| **C10** | `prix_devis_centimes` « valeur proposée par le lot 1 » (`LOTT:108`, `LOTT:146`) | **lot 2** : c'est une mention du document | `PLAN:342-344` |
| **C11** | point d'insertion « entre 7692 et 7693 » (`PLAN:188-190`, `PLAN:1792`, `PLAN:2466`), puis « après la 45 » (`PLAN:2808`) | **après la fin de la section 48** (`schema:11349`) et **avant** l'en-tête de la section 42 (`schema:11351-11352`) | état du fichier au `5897ef3` |
| **C12** | `const noop` à `api.js:1102`, `GENRES_DEMANDE` à `api.js:1824` | `api:1274` et `api:2344` | état du fichier |
| **C13** | « tout code nouveau prend OP011 et suivants » (`PLAN:2806`) | **`OP013`** (liens) et **`OP014`** (plafond de lignes) | grep du schéma et vraie base (21/10) |
| **C14** | la propriété de `verifier-devis` en une phrase (`PLAN:1462-1464`) | **D4 en trois parties** | `PLAN:3507` |
| **C15** | « les trois mesures d'arrondi se contredisent en silence » (`PLAN:2065`) | `Math.round`, `round(numeric)`, `round(double precision)` — **aucune n'est employée** : deux divisions entières sur des nombres **positifs** | lecture argent §3.3 |
| **C16** | `verifier-legal` : aucune fonction qui lit une table de prix ne peut être `security definer` (`verifier-legal.mjs:698-771`) — **contre** `devis_tva` sans politique d'écriture, que seule une fonction `security definer` peut remplir | **la propriété devient** : une fonction `security definer` qui nomme une table de prix **n'est exécutable par aucun client** (`public`, `anon`, `authenticated` révoqués **juste après elle**). **Aucune exemption pour les fonctions de déclencheur** (CR-B M3) : une fonction de déclencheur `definer` posée sur une table publique pourrait recopier des prix dans cette table — l'appelabilité n'est pas le seul risque d'un `definer`. Seule `recalcule_devis` est dans ce cas ; `recalcule_apres_ligne_de_devis` est `definer` mais **ne nomme aucune table** (elle n'appelle que `public.recalcule_devis(`) | `verifier-legal.mjs:698-711` |
| **C17** | « la décennale due selon la ligne relève des lots 1-2 » (`PLAN:3449`) | **lot 2**, avec son lecteur | §1.3 |
| **C18** | la mémoire range « chaque ligne d'un devis **émis** » (`PROP:292`) | « chaque ligne qu'il a **écrite** » (`PLAN:3120`) : la mémoire lit **les brouillons** | `PLAN:3120` |
| **C19** | « Offert » = « une ligne à **zéro centime** + un drapeau » (`PLAN:3090`) | **le drapeau met le total à 0 et garde le prix** ; un prix de 0 reste possible, avec « Offert » seulement — un sur-ensemble de la forme du plan (§1.4, point 1) | BOFiP §220 ; ann. II 242 nonies A, I, 8° et 9° (CR-D I3) ; mesuré le 21/10 |
| **C20** | « refus d'une ligne de main-d'œuvre qui n'a ni l'un ni l'autre » (horaire ou forfait), **hors établissement** (`PLAN:2896`, `PLAN:2922`) — la v1 en avait fait une contrainte d'unité **pour tout devis** | **aucune contrainte** : « ni l'un ni l'autre » est déjà impossible (toute ligne chiffrée a une quantité, donc un temps à l'heure, ou un montant forfaitaire par unité) ; et l'arrêté range le prix au m² parmi les prix forfaitaires (§1.4, point 2). Le plan disait « hors établissement » : la v1 l'appliquait à tout devis, entre professionnels compris | arrêté du 24/01/2017, art. 1er (champ : dépannage, réparation, entretien **énumérés en annexe**, face au consommateur), art. 2, art. 4 (ÉTABLI, `textes/arrete-2017.txt`) ; CR-D B1, I7 |
| **C21** | `lecture-droit.md` §3.2 recommandait `null` ou une catégorie pour une ligne sans TVA | **`0`**, avec un sens écrit : « aucune TVA facturée sur cette ligne » — **la raison est portée par le régime**, figé sur le devis au lot 2, jamais par la ligne. Pourquoi pas `null` : le taux est dans la **clé primaire** de `devis_tva`, qui ne peut pas être nulle, et `null` sur une ligne chiffrée aurait demandé une seconde forme à `devis_ligne_forme_check`. **Un choix, écrit comme tel** (CR-D I4) | ann. II 242 nonies A, I, 8° : « le taux … légalement applicable ou, le cas échéant, le bénéfice d'une exonération » (ÉTABLI) |
| **C22** | la clé `'devis'` de l'export « désigne aujourd'hui les demandes **reçues** » (`PLAN:1786-1788`, §3.13) | elle porte les demandes **des deux côtés** (`where x.client_id = auth.uid() or x.professional_id = auth.uid()`, `schema:11396-11397`, ÉTABLI ; mesuré par CR-B : un particulier y trouve la demande qu'il a **envoyée**) — elle devient **`'demandes_de_devis'`**, sur le modèle de `'rappels'` et `'urgences'` | CR-B I5 |

---

## 2. La base : section 49 de `supabase/schema.sql`

### 2.0 Place, titre, en-tête, et ce que la section ne pose pas

- **Place** : après la fin de la section 48 (`schema:11340-11349`, le `do $$` qui rend `compter_essai_tva` à `service_role`), avant le séparateur qui précède `--  42. L'EXPORT RGPD` (`schema:11351-11352`). L'export (42) et le balayage (43) restent les deux derniers blocs (`PLAN:2466-2467` ; `scripts/verifier-portes.mjs:77-85`).
- **Titre** : `--  49. LE CHIFFRAGE — le devis en brouillon, ses lignes, sa TVA (lot 1) (JJ/MM/2026)`.
- **L'en-tête dit, en français** :
  - **que `quote_requests` est une DEMANDE et `devis` un DOCUMENT** (`PLAN:2473`) : le mot « devis » désigne aujourd'hui une demande dans une dizaine d'endroits — l'index `idx_devis_pro`, trois politiques, `notifications.devis_id` et le type `'devis'`, `GENRES_DEMANDE.devis`, la clé `'devis'` de l'export ; d'où des noms sans ambiguïté (`quote_request_id`, `idx_devis_emis_*`, `"mes devis emis"`) ;
  - ce qu'elle pose : trois tables privées, deux fonctions de calcul (une par arrondi), trois déclencheurs **nommés** et **leur ordre réel** (§2.6), `recalcule_devis(uuid)`, trois politiques, des droits retirés ;
  - **la rupture avec `annonces_pro.prix numeric(10,2)`**, commentée pour que personne ne « réharmonise » (`PLAN:1148-1151`) : `numeric` arrive en JavaScript comme un nombre à virgule, et `numeric(10,2)` déborde à 100 000 000 en `22003`, en anglais ;
  - **pourquoi la TVA a sa table** : 3 × 33,33 € à 10 % font 9,99 € de TVA ligne par ligne et **10,00 €** par taux ; arrondir une fois par taux est la règle **BR-CO-17** d'EN 16931, imposée à la facture électronique — **pour un devis, c'est un choix conforme à la norme, pas une obligation du code** ; et « demi vers le haut » est un choix : **aucune règle n'a été trouvée** qui le fixe (BOFiP, CGI ; la réponse ministérielle AN n° 26125 n'a pas pu être lue — CR-D M1) ;
  - **le sens d'un taux `0`** : « aucune TVA facturée sur cette ligne » ; la raison (la franchise aujourd'hui, l'autoliquidation au lot 3) est portée par le régime, **figé sur le devis au lot 2**, jamais par la ligne (§1.5, C21) ;
  - **D1, D2, D3, D4, D6** en une phrase chacune, **D5 et D11** comme règles écrites maintenant et tenues au lot 2 (`PLAN:3493-3522`) ;
  - **pourquoi le recalcul ne contient aucun `delete`** : le connecteur Supabase refuse tout ordre qui commence par `delete`, **même dans un corps de fonction** (CLAUDE.md) ; un taux qui disparaît garde donc sa ligne dans `devis_tva`, **remise à zéro** (`nb_lignes = 0`), et tout lecteur filtre `nb_lignes > 0` ;
  - **pourquoi le verrou est `for no key update`** (§2.6, CR-B I1) ;
  - ce qu'elle ne pose pas (le §1.3 en résumé).
- **Toutes les contraintes sont nommées et finissent par `_check`** — **23 au total** (§2.5 ; la v1 en comptait 24, avant le retrait de `devis_ligne_main_oeuvre_check`), écrites sous la forme `alter table … drop constraint if exists X; alter table … add constraint X check (…)` (`schema:9883-9961`), chacune avec sa phrase dans `MESSAGES_CONTRAINTE`. **Aucune contrainte anonyme** (`PLAN:2450`).
- **Un `not null` violé rend 23502 sans phrase** : les colonnes que l'artisan remplit (désignation) sont gardées par un `check` nommé ; les colonnes que l'application pose toujours (`ordre`, `type`, `source`, `statut`, les totaux) sont `not null` — et l'application les envoie **toujours**, puisqu'une ligne s'insère **entière** (§4.2 ; CR-B I3 a mesuré un `23502` anglais sur un `upsert` partiel).
- **Les références aux trois tables sont TOUJOURS qualifiées** (`public.devis`, `public.devis_lignes`, `public.devis_tva`) dans le corps des fonctions : c'est ce qui permet aux contrôles de les relever sans confondre la table avec le **mot** « devis », présent dans les chaînes de cinq fonctions existantes (CR-B B2, §6).

### 2.1 Les deux arrondis, écrits UNE fois — 49.1

```sql
/* Le total d'une ligne : quantité en MILLIÈMES × prix unitaire en CENTIMES,
   ramené au centime, demi vers le haut. Hors des bornes, elle rend NULL —
   jamais une erreur 22003 en anglais : c'est la contrainte nommée qui refuse. */
create or replace function public.devis_total_ligne(p_quantite bigint, p_prix bigint)
returns bigint
language sql
immutable
set search_path = public
as $$
  select case
    when p_quantite between 1 and 99999999 and p_prix between 0 and 9999999999
    then (p_quantite * p_prix + 500) / 1000
  end
$$;

/* La TVA d'un taux : base en centimes × taux en CENTIÈMES DE POINT
   (2000 = 20 %), ramenée au centime, demi vers le haut. Base bornée à
   15 chiffres : base × 2000 reste dans un bigint. */
create or replace function public.devis_tva_de(p_base bigint, p_taux integer)
returns bigint
language sql
immutable
set search_path = public
as $$
  select case
    when p_base between 0 and 999999999999999 and p_taux >= 0
    then (p_base * p_taux + 5000) / 10000
  end
$$;

revoke all on function public.devis_total_ligne(bigint, bigint) from public, anon;
grant execute on function public.devis_total_ligne(bigint, bigint) to authenticated;
revoke all on function public.devis_tva_de(bigint, integer) from public, anon;
grant execute on function public.devis_tva_de(bigint, integer) to authenticated;
```

- **Elles naissent AVANT les tables** : deux contraintes les appellent (§2.5), et une contrainte est contrôlée à sa création.
- **Elles restent exécutables par `authenticated`** : une contrainte s'exécute avec les droits de **celui qui écrit** (la panne `horaires_valides` du 30/09). `verifier-portes` les relèvera seul comme gardiennes (`verifier-portes.mjs:118-127`), et l'essai 43 doit les nommer (§2.13).
- **Les nombres négatifs n'entrent jamais** : PostgreSQL tronque une division entière **vers zéro** (https://www.postgresql.org/docs/16/functions-math.html), donc la formule n'est juste que sur un nombre positif ou nul (mesuré : −0,6 c « arrondi » à 0 en SQL et à −1 en JavaScript, lecture argent §3.3). Les deux fonctions rendent `NULL` sur un négatif, et toutes les contraintes refusent les négatifs (EN 16931, BR-27, BR-28).
- **Aucun `round()`, aucun `numeric`, aucun flottant** : `numeric` ne tronque pas, et `round(double precision)` arrondit au pair (mesuré sur PostgreSQL 16.15 et 17.6, lecture argent §3.3).
- **Un `NULL` ne doit jamais satisfaire une contrainte par accident** : une contrainte `check` passe quand son expression vaut `NULL` (mesuré par CR-B M1 : `(null::bigint = 5 and 5 <= 10) is not false` → vrai). Toute contrainte qui compare à l'une de ces fonctions écrit donc d'abord `… is not null and …` (§2.5).

### 2.2 `public.devis` — 49.2

```sql
create table if not exists public.devis (
  id                          uuid primary key default gen_random_uuid(),
  pro_id                      uuid not null references public.professional_profiles(id) on delete cascade,
  client_id                   uuid references public.clients(id) on delete set null,
  quote_request_id            uuid references public.quote_requests(id) on delete set null,
  sos_request_id              uuid references public.sos_requests(id) on delete set null,
  source                      text not null default 'manuelle',
  statut                      text not null default 'brouillon',
  objet                       text,
  lieu_adresse                text,
  lieu_code_postal            text,
  lieu_ville                  text,
  delai_execution             text,
  retenue_garantie_centiemes  integer,
  total_ht_centimes           bigint not null default 0,
  total_tva_centimes          bigint not null default 0,
  total_ttc_centimes          bigint not null default 0,
  created_at                  timestamptz not null default now(),
  modifie_le                  timestamptz not null default now()
);
```

**Chaque colonne, son unité, qui l'écrit, qui la lit** (« aucune colonne sans lecteur », `PLAN:1715-1763`) :

| colonne | type, unité | écrite par | lue au lot 1 par | lue ensuite par |
|---|---|---|---|---|
| `id` | `uuid` ; **choisi par le téléphone** à l'ouverture d'un brouillon (le défaut `gen_random_uuid()` reste pour l'éditeur SQL et les essais) | l'application (`nouvelIdentifiant()`, §4.2) | tout ; **la file d'écriture** : une création renvoyée après un délai rend `23505` au lieu d'un second brouillon (CR-E B2) | — |
| `pro_id` | `uuid`, l'entreprise | l'application (`currentUserId`) ; la politique l'exige à soi | les trois politiques, `mes_donnees()`, la mémoire (filtre `devis.pro_id`, §4.2) | — |
| `client_id` | `uuid` → une **FICHE** du carnet, **jamais un compte** (D1, dit dans le commentaire de colonne) ; `null` tant que brouillon | « Pour qui ? », `devisDepuisClient()` ; **gardée par `OP013`** | la carte de la liste (nom du client), l'en-tête de saisie, « Ses devis » sur la fiche client, l'export | lot 2 : exigée à la remise, copiée dans l'instantané `cl_` |
| `quote_request_id` | `uuid` → `quote_requests`, `set null` (D2) | « Faire un devis » sur une demande de devis acceptée ; **gardée par `OP013`** | « depuis une demande du 15/09 », le budget du client affiché en contexte, « Reprendre » sur la demande (§4.7), l'export | lot 4 : « Refaire » le recopie (D10) |
| `sos_request_id` | `uuid` → `sos_requests`, `set null` | « Faire un devis » sur une urgence acceptée ; **gardée par `OP013`** | « depuis une urgence du … », « Reprendre », l'export | lot 2 : le contrôle du marqueur d'urgence par ligne |
| `source` | `text` : `manuelle` / `demande` / `urgence` ; **figée** après la création | l'application à la création seulement | la liste et l'en-tête (le geste, même quand le lien est devenu vide — D3) | **jamais imprimée** (`PLAN:1430-1433`) |
| `statut` | `text` : `brouillon` | la base (défaut) | la pastille par `surFond()` | lots 2 et 4 (la contrainte se refait) |
| `objet` | `text` ≤ 1 000 caractères | la saisie ; pré-rempli par la description d'une demande | la liste, l'en-tête, la mémoire (« devis d'origine »), l'export | lot 2 : la description de la prestation, **exigée à la remise** — pour tous, une prestation « déterminée ou déterminable » (C. civ. art. 1163) ; face à un consommateur, ses « caractéristiques essentielles » (C. conso. L. 111-1, 1°) ; pour le seul **dépannage, réparation et entretien** énumérés en annexe de l'arrêté du 24/01/2017, « la nature exacte **des réparations** à effectuer » (art. 4-I) — la v1 citait « des travaux », et appliquait l'arrêté à tout devis (CR-D I7) |
| `lieu_adresse`, `lieu_code_postal`, `lieu_ville` | `text` ; ≤ 200, 5 chiffres, ≤ 120 (les bornes de `clients`, `schema:7839-7843`) | la saisie (`ChampVille` en mode `rue`, puis le code postal et la ville) ; **proposés** depuis la fiche client quand ils sont vides | l'en-tête de saisie, la carte (la ville), l'export | lot 2 : imprimé (« le lieu d'exécution », arrêté 2017, art. 4-I, dans son champ) ; lot P : le code postal situe un poste dans une région (`PLAN:3148`) |
| `delai_execution` | `text` ≤ 200 | la saisie, ou l'appui « Dans les 30 jours suivant la signature du devis » | l'en-tête de saisie, l'avertissement « indicatif », l'export | lot 2 : exigé à la remise face à un consommateur (L. 111-1 3°, L. 221-5 I 3°) |
| `retenue_garantie_centiemes` | `integer`, centièmes de point ; `null` = aucune ; 1 à 500 | la section « Conditions » (`versCentiemes()`, §3.3) | la section « Conditions » (le taux et `PHRASE_RETENUE`), l'export | lot 2 : imprimée (`PLAN:3368`) |
| `total_ht_centimes`, `total_tva_centimes`, `total_ttc_centimes` | `bigint`, centimes ; **relus dans `devis_tva` par la base** | `tient_le_devis()`, jamais le téléphone | le pied d'écran, la ventilation, la liste, « Ses devis », l'export, les invariants des essais | lot 2 : imprimés et figés |
| `created_at` | `timestamptz`, posée par la base | `tient_le_devis()` à la création | la carte (« commencé le … », par `dateFrancaise()`) | **jamais imprimée** : la date de rédaction sera `remis_le` (`PLAN:277-303`) |
| `modifie_le` | `timestamptz`, posée par la base à chaque écriture du devis **ou d'une de ses lignes** | `tient_le_devis()` | **le tri de la liste**, la carte (« modifié il y a 2 h », par `depuisLisible()`), « Reprendre » | — |

**Ce qui n'est PAS sur `devis`, et que `verifier-devis` refuse nommément** : `compte_id`, `particulier_id` (D1) ; `demande_id` (D2) ; `visite_id`, `dossier_id` (`PLAN:1446-1450`) ; `nature` (`PLAN:1721-1729`) ; `date_redaction` (`PLAN:299-303`) ; `taux_justification` (lot 3) ; `regime_tva` (lot 2, dans l'instantané) ; et **aucun index unique** sur (pro, client), (pro, demande), (pro, lieu) (D4).

### 2.3 `public.devis_lignes` — 49.3

```sql
create table if not exists public.devis_lignes (
  id                        uuid primary key default gen_random_uuid(),
  devis_id                  uuid not null references public.devis(id) on delete cascade,
  ordre                     integer not null,
  type                      text not null default 'poste',
  designation               text,
  quantite_milliemes        bigint,
  unite                     text,
  prix_unitaire_centimes    bigint,
  taux_tva_centiemes        integer,
  total_centimes            bigint,
  offert                    boolean not null default false,
  main_oeuvre               boolean not null default false,
  fourniture_non_comprise   boolean not null default false,
  surface_sol_milliemes     bigint,
  surface_murs_milliemes    bigint,
  modifie_le                timestamptz not null default now()
);
```

| colonne | type, unité | écrite par | lue au lot 1 par | lue ensuite par |
|---|---|---|---|---|
| `id` | `uuid` — **choisi par le téléphone** à la création de la carte ; une ligne est **visable de l'extérieur** (futur `QuoteSourceLink` de la Visite) | l'application (`nouvelIdentifiant()`) | **la clé de rangée, stable dès la naissance** (aucune cellule remontée quand la base répond, CR-E B2) ; **le second critère de tri** (CR-B I7) ; la file d'écriture | la Visite (`PLAN:1452-1458`) |
| `devis_id` | `uuid`, la seule clé obligatoire de la table (D4-a) | l'application | la politique, le recalcul | — |
| `ordre` | `integer`, pas de 1 000 entre deux lignes | l'application (`ordreEntre()`, `renumeroter()`, « Monter » / « Descendre ») | l'ordre d'affichage **puis `id`**, **le rattachement à la pièce**, les sous-totaux | le PDF |
| `type` | `text` : `zone`, `piece`, `poste`, `option`, `reserve` | la barre « Ajouter », « Poste suivant » | l'écran (carte de titre, de poste, de réserve ; section « Options, non comprises »), le recalcul (seuls les `poste` entrent dans la ventilation) | le PDF |
| `designation` | `text`, 1 à 2 000 caractères, **mot pour mot** (`PLAN:3137`) | la saisie (`ChampDesignation`, `autoCorrect` et `spellCheck` actifs), ou une suggestion de la mémoire | la rangée, la mémoire | le PDF ; le lot P |
| `quantite_milliemes` | `bigint`, millièmes de l'unité, 1 à 99 999 999 | la saisie (`versMilliemes()`), ou une surface copiée | la rangée, le total de ligne | le PDF |
| `unite` | `text`, liste fermée : `m2`, `m`, `m3`, `u`, `h`, `jour`, `forfait` | la saisie (des pastilles « m² », « m linéaire », « m³ », « unité », « heure », « jour », « forfait ») ; « heure » **proposée** quand on allume « Main-d'œuvre » | la rangée (« m² », « m », « u » — jamais « ml »), la mémoire (une entrée par unité, IA:425-427) | le PDF ; la correspondance UN/ECE rec20 s'écrira avec la facture (`PLAN:2921`) |
| `prix_unitaire_centimes` | `bigint`, centimes **HT** au régime réel (la ligne de facture est HT, CGI ann. II 242 nonies A 8°) ; ce que paie le client en franchise ; 0 à 9 999 999 999 ; **0 seulement avec « Offert »** ; **sur une ligne « Offert », la valeur offerte** (facultative : 0 si l'artisan n'en donne pas) | la saisie (`ChampMontant`, `versCentimes()`), le taux horaire proposé en franchise, une suggestion | la rangée, le total de ligne, la mémoire | le PDF ; la facture (le prix avant remise, si « Offert » est une remise, BOFiP §220) |
| `taux_tva_centiemes` | `integer`, centièmes de point ; lot 1 : `0`, `550`, `1000`, `2000` ; `0` = aucune TVA facturée sur la ligne (§1.5, C21) | la saisie au régime réel ; `0` posé par l'écran en franchise | la rangée (« 10 % », jamais « 0 % »), la ventilation | le PDF ; le lot 3 élargit la liste |
| `total_centimes` | `bigint`, posé **par la base** : `0` sur une ligne « Offert », sinon `devis_total_ligne(q, p)` | `tient_la_ligne_de_devis()` | la rangée, la ventilation, les sous-totaux | le PDF |
| `offert` | `boolean` ; **met le total à 0, garde le prix** ; seul moyen d'écrire un prix de 0 | l'interrupteur « Offert » | la rangée (« Offert » au lieu d'un montant, `PLAN:3090`), le total | le PDF |
| `main_oeuvre` | `boolean` ; **aucune contrainte d'unité** (§1.4, point 2) | l'interrupteur « Main-d'œuvre », ou une suggestion | la carte (l'unité « heure » et le taux horaire **proposés** ; « Taux horaire » et « Temps estimé » quand l'unité est l'heure), la mémoire | le PDF (une heure de main-d'œuvre n'est pas une machine louée à l'heure) |
| `fourniture_non_comprise` | `boolean` | l'interrupteur « Fourniture non comprise », ou une suggestion | la rangée (la mention, en toutes lettres), **la mémoire** (une même phrase avec et sans fourniture fait deux entrées, CR-E I3) | le PDF |
| `surface_sol_milliemes`, `surface_murs_milliemes` | `bigint`, m² en millièmes ; **sur une ligne `piece` seulement** ; jamais exigées | la carte d'une pièce | les deux appuis qui copient une surface dans la quantité d'un poste au m² | la Visite pourra les remplir (`PLAN:3101`) |
| `modifie_le` | `timestamptz`, posée par la base | `tient_la_ligne_de_devis()` | **la mémoire** (« la plus récente d'abord ») | — |

**Ce qui n'est PAS sur une ligne** : aucune TVA (seulement son taux, `PLAN:1190-1192`) ; `nature`, `taux_justification`, `visite_id` ; aucun marqueur de construction ni d'urgence (lot 2) ; **aucune clé vers la ligne de titre** (§1.4) ; aucune remise (§1.5, C6).

### 2.4 `public.devis_tva` — 49.4

```sql
create table if not exists public.devis_tva (
  devis_id            uuid not null references public.devis(id) on delete cascade,
  taux_tva_centiemes  integer not null,
  base_centimes       bigint not null default 0,
  tva_centimes        bigint not null default 0,
  nb_lignes           integer not null default 0,
  primary key (devis_id, taux_tva_centiemes)
);
```

| colonne | lue au lot 1 par | pourquoi elle existe |
|---|---|---|
| `devis_id`, `taux_tva_centiemes` | la politique de lecture, la ventilation en bas de liste | une ligne par taux présent (`PLAN:1179`) |
| `base_centimes` | la ventilation (« TVA 10 % sur 333,30 € : 33,33 € »), `tient_le_devis()` (le total HT) | BR-S-8 : la base d'un taux est la somme des lignes de ce taux |
| `tva_centimes` | la ventilation, `tient_le_devis()` (le total TVA) | **LA** valeur arrondie une seule fois, et la contrainte qui le tient |
| `nb_lignes` | **tout lecteur filtre `nb_lignes > 0`** ; l'export | un taux disparu garde sa ligne, à zéro (pas de `delete`, §2.0) ; un taux présent seulement sur une ligne « Offert » garde sa ligne, à base 0 et `nb_lignes = 1` (C09b) |

**Les options n'entrent PAS dans `devis_tva`** (TRANCHÉ ICI). Un « total avec options » **n'est pas une somme** : une option de 33,33 € à 10 % coûte 3 666 c seule, mais le devis option comprise vaut 7 333 c, donc l'option coûte **3 667 c** de plus (C05, C05b). Au lot 1, chaque option s'affiche avec **son prix** (HT et taux au régime réel, sans « HT » en franchise) sous « Options, non comprises », et **aucun total d'options n'est rangé**. **Ce qui change par rapport à la v1** (CR-D I2) : face à un consommateur, toute information de prix doit faire apparaître « la somme totale toutes taxes comprises qui devra être effectivement payée » (arrêté du 3/12/1987, art. 1er, ÉTABLI). Le lot 2 imprimera donc, pour chaque option, **le TTC du devis option comprise**, par `totauxDevis()` appliqué **à l'union** des postes et de cette option — la même fonction, jamais une addition (§1.3). Aucun contrôle du lot 1 n'interdit cette phrase : `verifier-devis` interdit l'**addition** de deux totaux.

### 2.5 Les contraintes — 49.5, toutes en `_check`

**L'ordre alphabétique de leurs noms est une donnée.** Quand plusieurs `check` sont violées par la même ligne, PostgreSQL nomme **la première dans l'ordre alphabétique** (mesuré, lecture argent §3.3 ; **remesuré par CR-B** : double faute → `devis_ligne_offert_check`, quantité et prix au maximum → `devis_ligne_total_check` ; **et remesuré le 21/10 sur la forme v2** : quantité 0 et prix 0 sans « Offert » → `devis_ligne_offert_check`, `v2/offert-superset.out`). `validerLigne()` teste dans ce même ordre. Ordre des dix noms de `devis_lignes` : `designation` < `forme` < `offert` < `prix` < `quantite` < `surfaces` < `taux` < `total` < `type` < `unite`.

| table | nom | règle | sa phrase dit (dans `MESSAGES_CONTRAINTE`) |
|---|---|---|---|
| `devis` | `devis_delai_check` | `delai_execution is null or char_length(delai_execution) <= 200` | la longueur prévue |
| `devis` | `devis_lieu_adresse_check` | `lieu_adresse is null or char_length(lieu_adresse) <= 200` | idem |
| `devis` | `devis_lieu_code_postal_check` | `lieu_code_postal is null or lieu_code_postal ~ '^[0-9]{5}$'` | cinq chiffres |
| `devis` | `devis_lieu_ville_check` | `lieu_ville is null or char_length(lieu_ville) <= 120` | la longueur |
| `devis` | `devis_objet_check` | `objet is null or char_length(objet) <= 1000` | la longueur |
| `devis` | `devis_plafond_check` | `total_ht_centimes between 0 and 9999999999 and total_tva_centimes >= 0 and total_ttc_centimes <= 9999999999` | « ce devis dépasse 99 999 999,99 € : il y a sans doute un zéro de trop dans une ligne » |
| `devis` | `devis_retenue_check` | `retenue_garantie_centiemes is null or retenue_garantie_centiemes between 1 and 500` | « une retenue de garantie ne dépasse pas 5 % (loi n° 71-584, art. 1er) » |
| `devis` | `devis_source_check` | `source in ('manuelle', 'demande', 'urgence')` | « une valeur que l'application n'envoie jamais — mettez Opus à jour » |
| `devis` | `devis_statut_check` | `statut in ('brouillon')` | idem |
| `devis` | `devis_totaux_check` | `total_ttc_centimes = total_ht_centimes + total_tva_centimes` | idem — **garde-fou** : `tient_le_devis()` la rend vraie par construction |
| `devis_lignes` | `devis_ligne_designation_check` | `designation is not null and char_length(designation) between 1 and 2000` | « écrivez ce que comprend cette ligne » / la longueur |
| `devis_lignes` | `devis_ligne_forme_check` | `poste`/`option` ⇒ quantité, unité, prix, taux **présents** et surfaces absentes ; `zone`/`piece`/`reserve` ⇒ quantité, unité, prix, taux, total **absents**, `offert`, `main_oeuvre`, `fourniture_non_comprise` faux, et surfaces seulement sur `piece` ; **un type inconnu passe** (c'est `type_check` qui le nomme) | « une ligne chiffrée a une quantité, une unité, un prix et un taux ; un titre ou une réserve n'en a pas » |
| `devis_lignes` | `devis_ligne_offert_check` | `prix_unitaire_centimes is null or prix_unitaire_centimes > 0 or offert` | « un prix de 0 s'écrit avec l'interrupteur « Offert » » |
| `devis_lignes` | `devis_ligne_prix_check` | `prix_unitaire_centimes is null or prix_unitaire_centimes between 0 and 9999999999` | « un prix ne peut pas être négatif ; au-delà de 99 999 999,99 €, il y a un zéro de trop » |
| `devis_lignes` | `devis_ligne_quantite_check` | `quantite_milliemes is null or quantite_milliemes between 1 and 99999999` | « une quantité est plus grande que zéro, et au plus 99 999,999 » |
| `devis_lignes` | `devis_ligne_surfaces_check` | chacune `is null or between 1 and 99999999` | idem pour une surface |
| `devis_lignes` | `devis_ligne_taux_check` | `taux_tva_centiemes is null or taux_tva_centiemes in (0, 550, 1000, 2000)` | « choisissez 20 %, 10 % ou 5,5 % » |
| `devis_lignes` | `devis_ligne_total_check` | `poste`/`option` ⇒ `public.devis_total_ligne(q, p) is not null and public.devis_total_ligne(q, p) <= 9999999999 and total_centimes is not null and total_centimes = case when offert then 0 else public.devis_total_ligne(q, p) end` ; sinon `total_centimes is null` | « le total de cette ligne (ou la valeur offerte) dépasse 99 999 999,99 € » |
| `devis_lignes` | `devis_ligne_type_check` | `type in ('zone', 'piece', 'poste', 'option', 'reserve')` | « une valeur que l'application n'envoie jamais — mettez Opus à jour » |
| `devis_lignes` | `devis_ligne_unite_check` | `unite is null or unite in ('m2', 'm', 'm3', 'u', 'h', 'jour', 'forfait')` | « choisissez une unité dans la liste » |
| `devis_tva` | `devis_tva_arrondi_check` | `base_centimes >= 0 and tva_centimes is not null and tva_centimes = public.devis_tva_de(base_centimes, taux_tva_centiemes)` | « une valeur que l'application n'envoie jamais » (`devis_tva` n'a aucune écriture client) |
| `devis_tva` | `devis_tva_nb_check` | `nb_lignes >= 0` | idem |
| `devis_tva` | `devis_tva_taux_check` | `taux_tva_centiemes in (0, 550, 1000, 2000)` | idem |

**Retirée par rapport à la v1 : `devis_ligne_main_oeuvre_check`** (§1.4, point 2 ; §1.5, C20). **Changées : `devis_ligne_offert_check` et `devis_ligne_total_check`** (« Offert » garde le prix, §1.4, point 1 ; mesuré sur le prototype le 21/10). **Durcies : les deux contraintes d'égalité**, par `… is not null and …` (CR-B M1).

**La liste des taux est celle que l'écran du lot 1 produit, et rien de plus** : `1,05 %`, `1,75 %`, `2,10 %`, `8,50 %` existent en outre-mer (lecture droit §3.1) ; les centièmes de point les portent, mais aucune ligne d'aucun écran ne les produit au lot 1. La contrainte se refait au lot 3. **Le cas à 1,05 % exigé par `PLAN:2864` s'éprouve sur la FONCTION** `devis_tva_de(1000, 105)` (= 11), et une ligne à 105 est **refusée** au lot 1 (C02c, C12b).

`comment on column` pour **chaque** colonne qui porte une unité (centimes, millièmes, centièmes de point), pour `client_id` (D1), pour `taux_tva_centiemes` (le sens de `0`, C21) et pour `offert` (le prix gardé, C19) ; `comment on table` pour les trois tables, qui redit « une demande ≠ un document ».

### 2.6 Les déclencheurs, leurs noms, et leur ordre réel — 49.6

Trois déclencheurs et une fonction de recalcul. **Ils vivent avec leurs colonnes**, jamais greffés sur `tient_le_client()` ni `tient_le_profil_pro()` : un corps plpgsql n'est analysé qu'à l'exécution (CLAUDE.md, section 40). **Ils sont nommés** (CR-B M6), parce que **l'ordre d'exécution de deux déclencheurs du même moment est l'ordre alphabétique de leurs NOMS**, déclencheurs de clé étrangère `RI_ConstraintTrigger_…` compris (`R` majuscule passe avant `t`, mesuré par CR-B) — et le lot 2 ajoutera un déclencheur de figeage `before update or delete` sur `devis`, dont l'ordre par rapport à `trg_tient_le_devis` comptera :

| déclencheur | table | moment | fonction |
|---|---|---|---|
| `trg_tient_le_devis` | `devis` | `before insert or update`, par ligne | `tient_le_devis()` |
| `trg_tient_la_ligne_de_devis` | `devis_lignes` | `before insert or update`, par ligne | `tient_la_ligne_de_devis()` |
| `trg_recalcule_devis` | `devis_lignes` | `after insert or update or delete`, par ligne | `recalcule_apres_ligne_de_devis()` |

**La classe de blancs, écrite sous la forme de la section 47** (`schema:10273`) — `E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'` —, et **jamais en caractères invisibles littéraux** : la v1 les avait recopiés tels quels dans son extrait de code, où ils ne se lisent plus (CR-B M2, relevé octet par octet). Elle vit désormais dans au moins six fonctions : `verifier-devis` compare les deux copies de la section 49 à celle de la section 47 et à `BLANCS_TARIFS` (`src/lib/tarifs.js`). Les ramener à une seule fonction SQL toucherait des fonctions des lots 0a, T et 48 : c'est un lot à part (`docs/A-FAIRE.md`).

**1. `tient_le_devis()`** — `security invoker`.

```sql
  -- 1. Les textes : un blanc n'est pas une valeur (la classe de la section 47).
  new.objet := nullif(btrim(coalesce(new.objet, ''),
                 E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), '');
  -- (même chose pour lieu_adresse, lieu_ville, delai_execution)
  new.lieu_code_postal := nullif(regexp_replace(coalesce(new.lieu_code_postal, ''), '\s', '', 'g'), '');

  -- 2. Ce que la base pose, et que le téléphone ne choisit pas.
  if tg_op = 'INSERT' then
    new.created_at := clock_timestamp();
  else
    new.created_at := old.created_at;
    new.source     := old.source;          -- le geste qui a ouvert le brouillon (D3)
  end if;
  new.modifie_le := clock_timestamp();

  -- 3. Un lien d'origine désigne MA fiche, MA demande, MON urgence (OP013).
  --    Il n'est vérifié que quand il CHANGE et qu'il n'est pas vide : un lien
  --    qui passe à vide passe toujours (D3, D11), et un lien inchangé ne se
  --    revérifie pas — sinon chaque recalcul, qui réécrit le devis à chaque
  --    ligne, referait trois lectures, et une cascade pourrait buter dessus.
  if new.client_id is not null
     and (tg_op = 'INSERT' or new.client_id is distinct from old.client_id)
     and not exists (select 1 from public.clients c
                      where c.id = new.client_id and c.pro_id = new.pro_id) then
    raise exception 'Cette fiche n''est pas dans votre carnet : un devis ne se rattache qu''à vos propres clients.'
      using errcode = 'OP013';
  end if;
  -- (même garde pour quote_request_id et sos_request_id : professional_id = new.pro_id)

  -- 4. Les totaux sont RELUS dans devis_tva : une valeur envoyée est ignorée.
  select coalesce(sum(t.base_centimes), 0)::bigint, coalesce(sum(t.tva_centimes), 0)::bigint
    into v_ht, v_tva
    from public.devis_tva t where t.devis_id = new.id;
  new.total_ht_centimes  := v_ht;
  new.total_tva_centimes := v_tva;
  new.total_ttc_centimes := v_ht + v_tva;
  return new;
```

| morceau | raison |
|---|---|
| **les totaux relus** | `devis_totaux_check` ne relie pas `devis` à `devis_tva` : sans cette relecture, des totaux faux mais cohérents entre eux passent — **mesuré** (lecture argent §3.7). La politique « mes devis emis » est `for all` : sans ce déclencheur, l'artisan récrit son total. C'est lui qui tient l'invariant `total_tva = somme(devis_tva)` (`PLAN:2045-2046`). Une valeur envoyée est **ignorée**, comme les dates du lot 0a |
| **la garde des liens (`OP013`)** | une vérification de clé étrangère **ignore la RLS** — **mesuré par CR-B le 21/10** : garde désactivée, l'artisan A, qui ne voit pas la fiche de B (`0`), l'insère pourtant dans son devis (`INSERT 0 1`) ; avec la garde, « pas à vous » et « n'existe pas » rendent le **même** `OP013` — aucun oracle par l'erreur 23503. La garde est un `before` : elle part **avant** la vérification de clé. Elle lit en `security invoker` : la RLS de `clients`, « lecture mes devis » et « lecture mes sos » (`schema:1129-1131`, `:1220-1222`) ne montrent à l'artisan que ce qui est à lui. **Ce qu'elle ne fait pas** (corrigé, CR-B I6) : la v1 justifiait de ne pas revérifier un lien inchangé par « le particulier a pu bloquer l'artisan depuis » — c'était faux : ces deux politiques **ne filtrent pas `est_masque`** (ÉTABLI), un blocage ne cache rien à l'artisan. La vraie raison est dans le commentaire ci-dessus. Précédent du projet : `OP002` (`schema:6743-6757`) |
| **`source` et `created_at` figés** | D3 : la source « garde l'histoire du geste » (`docs/AUDIT-ADDENDUM-QR.md:210-215`) ; une date que le téléphone écrit ne prouve rien |
| **il ne lit jamais `auth.uid()`** | il tourne aussi pendant une cascade (`set null` quand une fiche, une demande ou un compte de particulier disparaît), où `auth.uid()` est celui de **quelqu'un d'autre** — **mesuré par CR-B** : pendant le `set null`, `current_user = postgres` et `auth.uid()` = celui qui a déclenché la suppression |
| **`modifie_le` bouge aussi pendant une cascade** | un client retiré de son carnet, une demande effacée par son auteur : le devis a changé, la date le dit. Assumé et écrit |
| **`clock_timestamp()`, jamais `now()`** | deux écritures d'une même transaction n'ont pas la même heure (CLAUDE.md, section 25) |

**2. `tient_la_ligne_de_devis()`** — `security invoker` :

- rogne la désignation (même classe de blancs ; **un texte vide devient `null`, et c'est la contrainte qui le refuse**) ;
- pose `total_centimes := case when new.offert then 0 else public.devis_total_ligne(quantite, prix) end` pour un `poste` ou une `option`, et `null` sinon ; une valeur de total envoyée par le client est remplacée. **Pas une colonne générée** : elle refuserait la valeur envoyée par une erreur **en anglais**, mesuré ;
- pose `modifie_le := clock_timestamp()` ;
- **le plafond de lignes** (`OP014`, CR-B M9) : à l'insertion, ou quand `devis_id` change, si le devis visé porte déjà **500** lignes, `raise exception 'Un devis porte au plus 500 lignes : celui-ci est plein. Commencez-en un second, ou regroupez des lignes.' using errcode = 'OP014'`. Le recalcul est complet à chaque ligne (choix juste) : sans borne, un client modifié qui insère 10 000 lignes dans son brouillon fait tourner jusqu'au délai de 8 s, et l'artisan lit une erreur anglaise au lieu d'une phrase. 500 laisse une marge de trois fois le plus long devis plausible (DÉDUIT : les deux devis du propriétaire en comptent moins de 60, `PROP`). **Ce compte nomme `public.devis_lignes`** : la fonction entre dans la liste fermée des lecteurs (§2.12 cas 27, §6.2).

**3. `recalcule_apres_ligne_de_devis()`** — **`security definer`** (elle doit écrire `devis_tva`, qui n'a aucune politique d'écriture), sur le modèle exact de `maj_chantier()` (`schema:6798-6817`) : en `UPDATE` ou `DELETE`, `recalcule_devis(old.devis_id)` ; en `INSERT`, ou en `UPDATE` qui change `devis_id`, `recalcule_devis(new.devis_id)` — **dans l'ordre des identifiants** quand il y en a deux, pour que deux déplacements croisés ne s'interbloquent pas. Rend `null`. **Elle ne nomme aucune table** (elle n'appelle que `public.recalcule_devis(`).

**4. `recalcule_devis(p_devis uuid) returns void`** — `language plpgsql`, `security definer` :

```sql
  -- LE VERROU D'ABORD — et c'est FOR NO KEY UPDATE, pas FOR UPDATE.
  -- Une insertion de ligne passe d'abord par la vérification de sa clé
  -- étrangère, qui pose FOR KEY SHARE sur la ligne du devis. FOR UPDATE est
  -- incompatible avec FOR KEY SHARE : deux insertions dans le même devis
  -- s'attendaient l'une l'autre — « deadlock detected » (40P01), mesuré.
  -- FOR NO KEY UPDATE ne gêne pas FOR KEY SHARE et sérialise quand même deux
  -- recalculs entre eux : sans lui, deux lignes au même taux enregistrées en
  -- même temps donnent une base qui en oublie une (mesuré : 2 lignes, HT 1000).
  perform 1 from public.devis where id = p_devis for no key update;
  if not found then
    return;   -- LA CASCADE : le devis part, ses lignes avec lui ; rien à recalculer.
  end if;

  insert into public.devis_tva as t
         (devis_id, taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes)
  select p_devis, l.taux_tva_centiemes, sum(l.total_centimes)::bigint,
         public.devis_tva_de(sum(l.total_centimes)::bigint, l.taux_tva_centiemes), count(*)
    from public.devis_lignes l
   where l.devis_id = p_devis and l.type = 'poste'
   group by l.taux_tva_centiemes
  on conflict (devis_id, taux_tva_centiemes) do update
     set base_centimes = excluded.base_centimes,
         tva_centimes  = excluded.tva_centimes,
         nb_lignes     = excluded.nb_lignes;

  -- Un taux qui a disparu reste, À ZÉRO : aucun ordre ne commence par
  -- `delete` (le connecteur le refuse, même ici). Les lecteurs filtrent nb_lignes > 0.
  update public.devis_tva t
     set base_centimes = 0, tva_centimes = 0, nb_lignes = 0
   where t.devis_id = p_devis and t.nb_lignes > 0
     and not exists (select 1 from public.devis_lignes l
                      where l.devis_id = p_devis and l.type = 'poste'
                        and l.taux_tva_centiemes = t.taux_tva_centiemes);

  -- Les totaux : c'est tient_le_devis() qui les relit. Cette écriture ne
  -- fait que le réveiller — une seule écriture de la règle.
  update public.devis set modifie_le = clock_timestamp() where id = p_devis;
```

- **Le verrou, mesuré par CR-B le 21/10** (`critb-t1-*.log`, prototype exact du cahier, fenêtre élargie par un déclencheur témoin) : `for update` → `ERROR: deadlock detected … while locking tuple (0,1) in relation "devis"`, une ligne perdue ; `for no key update` → les deux passent, HT 2000, TVA 200 ; **sans verrou**, deux lignes au même taux, la première dormant 3 s → 2 lignes en base pour un HT de **1000**. Hors fenêtre élargie la collision est rare (deux appareils, ou deux requêtes parallèles d'un même téléphone), mais elle existait, et elle rendait un `40P01` **en anglais** (`erreurs.js` n'avait aucune branche `40P01`, grep). **La file d'écriture de l'application (§4.2) la rend encore plus rare** — une requête à la fois par devis —, sans la rendre impossible (deux appareils).
- **`sum(bigint)` rend un `numeric`, et `sum` sur zéro ligne rend `NULL`** (mesuré, lecture argent §3.3) : d'où le `::bigint` et les `coalesce`.
- **Recalcul COMPLET, jamais un incrément**, et aucun `greatest` (`PLAN:1169-1177`). Coût mesuré sur le prototype : **213,5 ms** pour 200 lignes insérées une à une dans une transaction (lecture argent §3.7).
- **Le plafond mord au bon endroit** : si une ligne fait dépasser 99 999 999,99 €, la dernière écriture (`update public.devis`) viole `devis_plafond_check`, **toute la transaction de la ligne tombe**, et l'écran affiche la phrase de `devis_plafond_check` (C07c, C07d).
- **`revoke all on function public.recalcule_devis(uuid) from public, anon, authenticated;`**, posé **juste après elle** : elle rend `void`, le balayage de la section 43 ne la voit pas (le précédent de `recalcule_chantier`, `schema:11555-11561`). Son seul appelant est la fonction de déclencheur, `security definer` : l'appel s'y fait avec les droits du propriétaire (mesuré par CR-B : tous les essais tournent après le balayage, totaux justes).
- **Le DELETE n'est pas inversé** : aucun déclencheur `before … or delete` qui rendrait `new` (`PLAN:2443`) — le seul déclencheur sur le `delete` est un `after` qui rend `null`.

**L'ordre réel, sur une insertion de ligne** (relevé par CR-B dans `pg_trigger` du prototype, à refaire dans l'essai, cas 31) : `trg_tient_la_ligne_de_devis` (before) → contraintes de la ligne → la ligne est écrite → **`RI_ConstraintTrigger_c_…`** (after, la clé `devis_id` : **`FOR KEY SHARE` sur le devis**) → `trg_recalcule_devis` (after) → `recalcule_devis` (`for no key update` sur le devis, ventilation) → `update devis` → `trg_tient_le_devis` (before, relit les totaux) → contraintes du devis. **Une seule chaîne, une seule transaction** : tout réussit ou rien.

**Les trois chemins de suppression**, chacun éprouvé en **comptant les lignes** (`PLAN:898-907`, `PLAN:2446`) — **et chacun déjà mesuré par CR-B sur le prototype** (cas 21, 23, 24 : succès, `0 / 0 / 0` là où il le faut, aucun lien orphelin) : supprimer un brouillon (cascade ; le recalcul trouve le devis absent et ne fait rien) ; supprimer la fiche d'un client (le devis reste, `client_id` vide) ; supprimer un compte — celui de l'artisan (tout part, **y compris quand le devis porte à la fois une fiche, une demande et une urgence** : la double cascade `set null` puis `delete` sur la même ligne ne casse rien) ou celui du particulier qui avait fait la demande (le devis reste, `quote_request_id` **et** `sos_request_id` vides, `source` toujours `'demande'` : D3).

### 2.7 Qui lit, qui écrit — 49.7

```sql
alter table public.devis        enable row level security;
alter table public.devis_lignes enable row level security;
alter table public.devis_tva    enable row level security;

drop policy if exists "mes devis emis" on public.devis;
create policy "mes devis emis" on public.devis
  for all to authenticated
  using (public.est_mon_entreprise(pro_id))
  with check (public.est_mon_entreprise(pro_id));

drop policy if exists "lignes de mes devis" on public.devis_lignes;
create policy "lignes de mes devis" on public.devis_lignes
  for all to authenticated
  using (exists (select 1 from public.devis d
                  where d.id = devis_lignes.devis_id and public.est_mon_entreprise(d.pro_id)))
  with check (exists (select 1 from public.devis d
                       where d.id = devis_lignes.devis_id and public.est_mon_entreprise(d.pro_id)));

/* LA LECTURE, ET RIEN QUE LA LECTURE. Sans elle, `mes_donnees()` — qui est
   `security invoker` — rendrait une ventilation VIDE, sans erreur (PLAN §3.5). */
drop policy if exists "ventilation de mes devis" on public.devis_tva;
create policy "ventilation de mes devis" on public.devis_tva
  for select to authenticated
  using (exists (select 1 from public.devis d
                  where d.id = devis_tva.devis_id and public.est_mon_entreprise(d.pro_id)));

revoke all on public.devis, public.devis_lignes, public.devis_tva from anon;
revoke truncate on public.devis, public.devis_lignes, public.devis_tva from authenticated;
revoke insert, update, delete on public.devis_tva from authenticated;
```

- **`est_mon_entreprise()` partout, jamais `auth.uid() = pro_id` à la main** ; elle exige déjà `est_un_pro()` (`schema:6626-6646`).
- **Aucune politique `anon`, et le droit de table retiré** (`PLAN:719-724`) : la leçon de la section 18.2.
- **D6** : aucune politique ne passe par une relation, un partage, un blocage ou l'administration ; **aucune fonction `admin_*` ne nomme ces tables** (`PLAN:3156`), et la liste FERMÉE des fonctions qui les nomment est tenue par `verifier-devis` et `verifier-legal` (§6).
- **`for all`, quatre portes, tranchées une par une** (`PLAN:2452`) : `select` — les siens ; `insert` — dans un devis à soi seulement ; `update` — les siens, et une ligne ne passe pas dans le devis d'un autre ; `delete` — **supprimer un brouillon ou une ligne est un droit au lot 1** ; le figeage du lot 2 refermera cette porte pour un devis remis.
- **Sur `devis_tva`, aucune porte d'écriture — et c'est le DROIT de table qui refuse, avant la RLS** : un `insert`, un `update` ou un `delete` direct rendent **`permission denied for table devis_tva`** (42501), jamais une erreur de politique ni `UPDATE 0` — mesuré par CR-B (la v1 attendait une erreur RLS et `UPDATE 0` : l'essai n'aurait jamais pu passer, CR-B B3). Par l'API : **403**.
- **`authenticated` garde `truncate` sur `clients`** (mesuré, lecture code §1.2) : hors de ce lot, inscrit dans `docs/A-FAIRE.md` avec le lot S.

### 2.8 Index — 49.8

```sql
create index if not exists idx_devis_emis_pro     on public.devis (pro_id, modifie_le desc);
create index if not exists idx_devis_emis_client  on public.devis (client_id);
create index if not exists idx_devis_emis_demande on public.devis (quote_request_id);
create index if not exists idx_devis_emis_urgence on public.devis (sos_request_id);
create index if not exists idx_devis_lignes_devis on public.devis_lignes (devis_id, ordre, id);
```

**Jamais `idx_devis_pro`** : il existe déjà sur `quote_requests` (`schema:4266`, et vraie base), et un `create index if not exists` du même nom ne créerait **rien**, sans un mot (`PLAN:2472`). Les trois index sur les liens servent la cascade `set null`, « Ses devis » et « Reprendre » (§4.7). **`idx_devis_emis_pro` sert aussi la mémoire** : c'est lui que la requête filtrée par `devis.pro_id` emprunte (mesuré, §4.2). L'index des lignes porte `id` en troisième colonne : il sert le tri `ordre, id` (CR-B I7).

### 2.9 L'export RGPD — section 42, `mes_donnees()` réécrite en entier

- **Trois clés nouvelles** : `devis_emis` (les lignes de `devis` de l'entreprise), `devis_lignes` (par jointure vers ses devis, triées par devis, `ordre`, `id`), `devis_tva` (**toutes** les lignes, zéros compris : elles existent en base). `mon_entreprise` existe déjà depuis le lot 0a (`schema:11439`).
- **La clé `'devis'` devient `'demandes_de_devis'`** (CR-B I5, revérifié) : elle porte les demandes **des deux côtés** — `where x.client_id = auth.uid() or x.professional_id = auth.uid()` (`schema:11396-11397`), exactement comme `'rappels'` (`schema:11398-11399`) et `'urgences'`. Le nom proposé par le plan, `demandes_de_devis_recues`, aurait écrit une chose fausse dans l'export d'un particulier, qui y trouve la demande qu'il a **envoyée**. Mesuré : aucun contrôle, aucun essai, aucun écran ne lit cette clé (lecture code §1.7) : le renommage est gratuit. La phrase de `PLAN:1786-1788` (§3.13) se corrige à l'étape 10.
- **Le commentaire dit les fondements, et les dit justes** (CR-D M2) : l'article 15 pour ce qui concerne l'artisan **personne physique** (pour une société, ses prix ne sont pas des données personnelles : l'export reste alors un engagement d'Opus) ; pour ce qui concerne ses clients (une fiche, un lieu qui est souvent un domicile), l'**article 28.3.e** (aider le responsable à répondre aux demandes des personnes) **et 28.3.g** (les lui rendre au terme). Le commentaire de la clé du carnet (`schema:11414-11421`) est aligné dans le même geste, puisque la fonction est réécrite en entier.
- **`mes_donnees()` reste la DERNIÈRE fonction**, et **la migration l'emporte en entier** — la faute du lot H, un export amputé une nuit sans erreur.

### 2.10 Le balayage (section 43), et deux commentaires

Les trois fonctions de déclencheur naissent en section 49, **avant** le balayage : il leur retire `execute` d'office (`schema:11539-11553`). Le commentaire de la section 43 qui énumère les gardiennes (« Elles sont cinq », `schema:11563-11569`) devient **sept** : `devis_total_ligne` et `devis_tva_de`. Il nomme aussi `recalcule_devis(uuid)` à côté de `recalcule_chantier(uuid)`, comme fonction `void` révoquée à la main.

Le commentaire de la **section 41.2** (`schema:7871-7904`), qui justifie le `delete` sur `clients` « parce que rien ne le référence encore » : il dit désormais que `devis.client_id` le référence, **en `set null`** (D3, D11), et que **supprimer une fiche ne supprime pas les données de ce client** : ses devis restent, détachés de la fiche, **avec l'adresse des travaux et ce que l'artisan y a écrit** — la v1 disait « sans nom de client », ce qui suggérait une anonymisation qui n'a pas lieu (CR-D I5). L'écran le dit et propose l'archivage (§4.6).

### 2.11 Ce qui se rejoue sur la VRAIE base, sans un ordre qui commence par `drop` ou `delete`

Le fichier de migration vit dans le dossier de travail, **jamais commité**. Il contient, dans l'ordre :

1. les deux fonctions de calcul et leurs droits ;
2. les trois `create table if not exists` et les index ;
3. les 23 contraintes, sous la forme `alter table … drop constraint if exists X; alter table … add constraint X check (…)` — **le `drop` au milieu d'un `alter table` passe** (mesuré le 03/10) ;
4. les quatre fonctions et les trois `create or replace trigger` **sous leurs noms** ;
5. `enable row level security`, et les trois politiques **créées sous condition** dans un bloc `do` (`if not exists (select 1 from pg_policies where …) then execute 'create policy …'`) — `drop policy` expire, même dans un `execute` ;
6. les `revoke` (qui passent, même dans un `do`) ;
7. les `comment on` ;
8. `mes_donnees()` **en entier**, et ses droits ;
9. le bloc du balayage de la section 43, **rejoué**, et le `revoke` de `recalcule_devis`.

Envoyé **sans commentaires**, par le découpeur qui respecte les chaînes, les `E'…'`, les `$tag$` et les commentaires imbriqués (CLAUDE.md, lot 0a). **Aucun rattrapage** : il n'y a aucune donnée à reprendre. **Le transport du connecteur passe par du JSON** : une séquence `\u00a0` écrite dans une chaîne `E'…'` arrive comme le vrai caractère U+00A0 — équivalent dans `btrim`, déjà constaté aux lots 0a et T ; c'est un écart d'empreinte **connu**, qu'on explique en lisant les octets (`encode(convert_to(…), 'hex')`), pas en relisant le texte ; et dans une **requête de vérification**, la séquence s'écrit `chr(92) || 'u00a0'`.

### 2.12 `supabase/essais-section-49.sql`

**En-tête** : lancé après `local-prelude.sql` puis `schema.sql` rejoué **deux fois**, `psql -h /tmp -p 5433 -U postgres -d <base> -v ON_ERROR_STOP=0 -f supabase/essais-section-49.sql`, **depuis la racine du dépôt** (le cas 30 lit `supabase/cas-devis.json`). Il dit combien de cas attendent une erreur, et il porte **la procédure de concurrence** (ci-dessous). Ses règles, écrites en tête :

1. **chaque cas dans son propre `begin … rollback`, et construit son propre état** ; aucun cas ne dépend d'un autre ;
2. **chaque « 0 » est précédé, dans la même transaction, du « 1 » qui le rend crédible** ;
3. **chaque ordre qui doit échouer est le DERNIER de sa transaction** ;
4. **aucun cas RLS dans un bloc `do`** : `set local role authenticated;` puis `set local request.jwt.claim.sub = :A;`, chacun dans son propre ordre ;
5. **toute suppression compte les lignes avant et après**, même quand elle doit réussir ;
6. **un refus attendu se lit par son NOM** (contrainte, code `OP`, ou `permission denied for table …`), jamais par la seule présence d'« ERROR ».

**Préparation** (le modèle de `essais-section-46.sql:36-121`) : `\set` A, B, P en `'''a4900000-0000-4000-8000-0000000000xx'''`, **sans commentaire à droite** ; ménage de tête `delete from auth.users where id::text like 'a4900000-%';` ; preuves `source 'registre'` à des SIRET **fictifs à clé juste, vérifiés inconnus du répertoire Sirene**, posées en superutilisateur **avant** les comptes (sinon OP006) ; comptes par `insert into auth.users (… raw_user_meta_data …)` — A et B pros, P particulier ; en superutilisateur : C1, une fiche du carnet de A ; CB, une fiche du carnet de B ; QA, une demande de devis de P **à A** (`accepte`) ; QB, une demande de P **à B** ; SA, une urgence de P à A (`acceptee`) ; SB, une urgence de P à B ; `prepare` pour **le devis de référence de A** : **lié à C1, QA et SA** (CR-B M4), 9 lignes — 4 postes à 2 taux, un titre de zone, un titre de pièce avec surfaces, une réserve, une option, un poste « Offert » **avec une valeur de 45,00 €** — et ses totaux **calculés à la main dans l'en-tête**.

| cas | ce qu'il fait | attendu |
|---|---|---|
| **0** | **la donnée existe** : avec le jeton de A, le devis de référence ; compte en superutilisateur | 1 devis, 9 lignes, 2 lignes `devis_tva` à `nb_lignes > 0`, les totaux **exacts** du jeu ; la ligne « Offert » : prix `4500`, total `0` |
| 1 | `information_schema.columns` des trois tables | **la liste fermée** du §2.2-2.4, types et `is_nullable` compris ; aucune des colonnes interdites |
| 2 | `pg_constraint` : contraintes `check` des trois tables ; non suffixées `_check` ; en `_check[0-9]+` | **23** ; 0 ; 0 |
| 3 | **D4-a** : clés étrangères `not null` ; leur `confdeltype` | exactement `devis.pro_id`, `devis_lignes.devis_id`, `devis_tva.devis_id` ; `client_id`, `quote_request_id`, `sos_request_id` en `n` ; les trois autres en `c` |
| 4 | **les refus de forme**, une transaction chacun, avec le jeton de A : quantité 0 ; −1 ; 100 000 000 ; 3 000 000 000 ; prix −1 ; prix 0 sans « Offert » ; taux 1960 ; taux 105 ; un titre avec un prix ; un type `'remise'` ; unité `'ml'` ; désignation faite d'un U+200B ; surfaces sur un poste ; surface 0 sur une pièce ; un poste sans taux ; **un « Offert » dont la valeur dépasse le plafond** | `devis_ligne_quantite_check` ×4, `…_prix_check`, `…_offert_check`, `…_taux_check` ×2, `…_forme_check`, `…_type_check`, `…_unite_check`, `…_designation_check`, `…_forme_check`, `…_surfaces_check`, `…_forme_check`, **`…_total_check`** — **chaque nom lu** |
| 4 bis | refus du devis : retenue 501 ; retenue 0 ; source `'qr'` ; statut `'remis'` ; code postal `'1341'` ; objet de 1 001 caractères | `devis_retenue_check` ×2, `devis_source_check`, `devis_statut_check`, `devis_lieu_code_postal_check`, `devis_objet_check` |
| 4 ter | **la double faute** : quantité 0 ET prix 0 sans « Offert » | `devis_ligne_offert_check` — l'ordre alphabétique (C16 ; mesuré le 21/10) |
| **4 quater** | **ce que la v1 refusait et que la v2 accepte** : un poste « Main-d'œuvre » au m² ; un « Offert » sur 10 € ; puis « Offert » éteint sur cette ligne | `INSERT 0 1` (CR-D B1) ; prix `1000`, total `0` ; total `1000`, **le prix revenu tout seul** (C09c, C09d) |
| 5 | **le total de ligne vient de la base** : A envoie `total_centimes = 1` sur 2,5 m² à 33,33 € | `8333` |
| 6 | **la méthode** : 3 postes à 33,33 € à 10 % | base `9999`, TVA **`1000`** (et non 999) |
| 7 | **les fonctions seules** : `devis_tva_de(5,1000)`, `(300,550)`, `(1000,105)`, `(200,175)`, `(-6,1000)` ; `devis_total_ligne(2500,3333)`, `(0,100)`, `(1000,-1)` | `1`, `17`, `11`, `4`, `null` ; `8333`, `null`, `null` |
| 8 | **le recalcul dans les deux sens** : A retire un poste ; change le taux d'un autre ; retire tout | le total redescend ; l'ancien taux reste en base **à zéro** (`nb_lignes = 0`) ; retour à `0 / 0 / 0` |
| 9 | **les invariants**, sur tous les devis de la base d'essai | `total_ttc = total_ht + total_tva` ; `total_tva = sum(devis_tva.tva)` ; `total_ht = sum(base)` — **0 écart** |
| 10 | **les totaux ne s'écrivent pas** : A `update … set total_ht_centimes = 100, total_ttc_centimes = 100` | relus : les vrais totaux |
| 11 | **`devis_tva` ne s'écrit pas** (CR-B B3) : (a) A lit sa ventilation ; puis **trois transactions**, chacune avec son ordre en dernier : (b) `insert` direct ; (c) `update` ; (d) `delete` ; enfin (e) la ventilation relue en superutilisateur | `≥ 1` ; **`permission denied for table devis_tva`** ×3 ; intacte |
| 12 | **qui lit** : A lit son devis (`1`) ; **B** lit le devis, les lignes, la ventilation de A ; **P** de même ; `anon` lit `devis` (dernier) | `1` ; `0`, `0`, `0` ; `0`, `0`, `0` ; `permission denied for table devis` |
| 13 | **qui écrit chez un autre** : B `insert` un devis au nom de A (dernier) ; B `insert` une ligne dans le devis de A (dernier) ; B `update` le devis de A ; B `delete` le devis de A — comptes avant et après en superutilisateur | ERREUR RLS ×2 ; `UPDATE 0` ; `DELETE 0` ; **1 devis, 9 lignes** après |
| 14 | **`OP013`** : A pose `client_id = CB` (dernier) ; `quote_request_id = QB` (dernier) ; `sos_request_id = SB` (dernier) ; un `uuid` qui n'existe pas (dernier) ; puis les trois liens vidés ; puis `client_id = C1`, `quote_request_id = QA`, `sos_request_id = SA` | `OP013` ×4 — **le même refus pour « pas à vous » et « n'existe pas »**, jamais 23503 ; `UPDATE 1` ; `UPDATE 1` |
| **14 bis** | **un lien inchangé ne se revérifie pas — et l'essai PEUT échouer** (CR-B I6) : en superutilisateur, `QA.professional_id` passe à B ; A change l'objet de son devis (lien inchangé) ; **puis**, dans la même transaction, A vide `quote_request_id`, puis le remet à QA (dernier) | `UPDATE 1` ; `UPDATE 1` ; **`OP013`** — le premier « 1 » n'est crédible qu'à côté de ce refus |
| **14 ter** | **la prémisse d'`OP013`** (CR-B M7) : en superutilisateur, `alter table public.devis disable trigger trg_tient_le_devis;` puis, avec le jeton de A, un devis qui pose `client_id = CB` ; `rollback` | **`INSERT 0 1`** : sans la garde, la clé étrangère laisse passer la fiche d'un autre — c'est ce « 1 » qui rend la garde nécessaire, et non décorative (mesuré par CR-B le 21/10) |
| **14 quater** | **les identifiants choisis par le téléphone** (§4.2) : A insère un devis avec un `id` explicite ; le même `id` une seconde fois (dernier) ; idem pour une ligne | `INSERT 0 1` ; **`23505`** (`devis_pkey`) ; idem `devis_lignes_pkey` — c'est sur ce `23505` que la file reconnaît une écriture déjà faite |
| 15 | **une ligne change de devis** : A déplace une ligne vers un second devis à lui ; puis vers un devis de B (dernier) | les DEUX totaux recalculés ; ERREUR RLS |
| 16 | **les plafonds, à la borne** : q = 1351, p = 7 401 924 500 ; q = 1001, p = 9 990 009 989 ; un poste à 9 000 000 000 c à 20 % ; deux postes de 6 000 000 000 c | `devis_ligne_total_check` ; accepté, total `9999999999` ; `devis_plafond_check` ; `devis_plafond_check` à la seconde |
| **16 bis** | **`OP014`** : 500 lignes insérées dans un devis (une instruction, `generate_series`), le compte relu ; puis une 501e, seule (dernier) | `500` ; **`OP014`**, phrase complète |
| 17 | **l'option hors total** : un poste et une option de 33,33 € à 10 % | totaux `3333 / 333 / 3666` ; **aucune** ligne `devis_tva` pour l'option |
| 18 | **« Offert » seul à son taux** (avec une valeur) | une ligne `devis_tva` à base 0, `nb_lignes = 1` |
| 19 | **ce que la base pose** : A crée un devis avec `created_at = '2001-01-01'` et `source = 'demande'` ; puis `update … set source = 'manuelle', created_at = '1999-01-01'` | `created_at` d'aujourd'hui ; `source = 'demande'` **inchangée** ; `modifie_le` a bougé |
| 20 | **le nettoyage** : objet `E'  \n '` ; désignation `'  pose  '` ; code postal `' 13 410 '` ; délai fait d'un U+00A0 | `null` ; `pose` ; `13410` ; `null` |
| 21 | **supprimer un brouillon** : comptes avant ; A `delete` le devis ; comptes après | `1/9/≥2` puis `0/0/0` pour ce devis — et **aucune erreur** du recalcul pendant la cascade |
| 22 | **supprimer la fiche C1** liée au devis | devis et lignes **intacts** (comptés), `client_id` vide, totaux intacts |
| 23 | **D3 — le particulier part** : le devis de référence (lié à C1, **QA et SA**) ; `preparer_suppression_compte()` avec le jeton de P, puis `delete from auth.users where id = :P` en superutilisateur | QA et SA n'existent plus ; le devis **existe**, `quote_request_id` **et** `sos_request_id` vides, `client_id = C1` intact, `source = 'demande'`, 9 lignes ; **la suppression de compte de P a réussi** ; **D11** : on compte les clés vidées |
| 24 | **l'artisan part** : le devis de référence (lié à C1, QA, SA — **la double cascade**) ; `preparer_suppression_compte()` avec le jeton de A, puis la cascade | `devis`, `devis_lignes`, `devis_tva` de A : `0 / 0 / 0` ; 0 fiche de A |
| 25 | **l'export** : `mes_donnees()` avec le jeton de A, puis de B, puis de P | A : `devis_emis` 1, `devis_lignes` 9, `devis_tva` ≥ 2 (**pas une liste vide**), `demandes_de_devis` présente, **`devis` absente** ; B : trois tableaux vides ; **P : `demandes_de_devis` contient les demandes qu'il a ENVOYÉES** (QA, QB) — c'est ce qui justifie le nom |
| 26 | **les droits** : `has_table_privilege` pour `anon` (les sept droits) sur les trois tables ; `authenticated` : `truncate` ×3, et `insert`/`update`/`delete` sur `devis_tva` ; `has_function_privilege` : `recalcule_devis` pour `public`, `anon`, `authenticated` ; les trois fonctions de déclencheur ; `devis_total_ligne` et `devis_tva_de` pour `authenticated` | tous `f` ; `f` ×6 ; `f` ×3 ; `f` ; **`t`, `t`** |
| 27 | **le catalogue** (CR-B B2) : fonctions de `public` dont le corps, **commentaires `--` retirés**, nomme une des trois tables **sous son nom qualifié** (`prosrc ~ '\mpublic\.devis(_lignes\|_tva)?\M'`) ; parmi elles, `prosecdef` ; celles dont le nom commence par `admin_` ; vues qui les nomment ; **et toute référence NON qualifiée** (`\m(from\|join\|into\|update\|table)\s+devis(_lignes\|_tva)?\M`) | la liste FERMÉE : **`tient_le_devis`, `tient_la_ligne_de_devis`, `recalcule_devis`, `mes_donnees`** (relevée, puis comparée : un nom en trop **ou en moins** rougit) ; `definer` = **`recalcule_devis` seule** (et non exécutable par un client, cas 26) ; `0` ; `0` ; **`0`** |
| 28 | `pg_policies` sur les trois tables : nom, commande, rôles, `qual`, `with_check` | trois politiques, **les chaînes exactes relevées** ; aucune pour `anon` ni `public` ; aucune ne nomme `est_masque`, `est_admin`, `auth.uid()` |
| 29 | **D4-b** : A crée un devis `source = 'demande'` **sans** lien ; un devis `source = 'urgence'` sans lien | `INSERT 0 1` ×2 — aucune contrainte « origine ⇒ lien » |
| 30 | **les cas d'argent, joués par PostgreSQL** : `\set cas \`cat supabase/cas-devis.json\`` puis une fonction **temporaire** `pg_temp.jouer_cas(jsonb)` qui insère chaque cas pour de vrai (déclencheurs et contraintes s'exécutent) et rend sa forme canonique | **`écarts : 0`** sur tous les cas ; la fonction vit dans `pg_temp` : **rien n'entre dans le schéma** |
| **31** | **l'ordre des déclencheurs** : `select tgname from pg_trigger where tgrelid = 'public.devis_lignes'::regclass and tgtype & 3 = 1 order by tgname` (les déclencheurs de ligne `after` : bit « ligne » posé, bit « avant » absent) | les `RI_ConstraintTrigger_c_…` **puis** `trg_recalcule_devis` — l'ordre qui justifie `for no key update` |

**La concurrence** (CR-B I1, I2), à part : la procédure est écrite **dans l'en-tête** de `essais-section-49.sql` (deux sessions ne se jouent pas par un seul `psql -f`), et son résultat dans le message de commit. Deux sessions `psql` ; la première insère une ligne dans un devis puis `select pg_sleep(3)` avant `commit` ; la seconde insère une autre ligne **au même taux** dans le même devis pendant ce temps (avec deux taux différents, chaque recalcul upserte sa propre ligne de ventilation, et le total final est juste **même sans verrou** — mesuré par CR-B : un essai qui ne peut pas échouer n'éprouve rien). **Quatre passages**, et chacun doit rendre ce qui est attendu :

| passage | `recalcule_devis` | déclencheur témoin | attendu |
|---|---|---|---|
| 1 | **sans** verrou (sabotage) | non | **une ligne oubliée** : 2 lignes en base, HT de 1 seule |
| 2 | `for no key update` | non | HT des deux, `devis_tva.nb_lignes = 2` |
| 3 | `for update` (sabotage) | **oui** | **`40P01` deadlock detected** |
| 4 | `for no key update` | **oui** | **aucun interblocage**, HT des deux |

**Le déclencheur témoin** vit dans `supabase/essais-section-49-temoin.sql`, **jamais dans `schema.sql`** : un déclencheur `after insert` nommé `S_attente` (alphabétiquement entre `RI_…` et `trg_…`) qui fait `pg_sleep(2)`, créé sur une base d'essai et retiré à la fin. C'est lui qui élargit la fenêtre entre la vérification de clé et le recalcul ; sans lui, l'interblocage du passage 3 ne se provoque pas à la demande.

### 2.13 Les autres fichiers d'essais

**Avant d'écrire la section 49**, rejouer les **24** fichiers de `supabase/` sur une base neuve et ranger leur sortie (le relevé « avant ») ; **après**, les rejouer et comparer. Changements attendus, et seulement ceux-là :

| fichier | change | pourquoi |
|---|---|---|
| `essais-section-43.sql`, cas 4 (`:37-52`) | la liste des gardiennes gagne `devis_total_ligne` et `devis_tva_de` | « les deux fichiers doivent parler des mêmes fonctions » (`:38-42`) |
| `essais-section-46.sql`, cas 26 bis | **rien** : sa liste fermée des lecteurs de `emetteur`, `emetteur_assurances`, `tarifs_pro` ne bouge pas — aucune fonction du lot ne lit ces tables (§4.2) | à vérifier, pas à supposer |
| tous | des numéros de ligne du schéma dans les messages | — |

Tout autre écart est un défaut. **Un verrou qui ferme une porte se rejoue contre TOUS les fichiers d'essais** — ici, `essais-suppression-compte.sql` et `essais-section-41.sql` sont ceux qui risquent quelque chose (la cascade, et la suppression d'une fiche) : à lire cas par cas.

---

## 3. L'argent

Le point de départ est le prototype de la lecture argent (`argent/devis-proto.mjs`, `argent/proto.sql`, `argent/cas.mjs`, `argent/banc.mjs` du dossier de travail) : **36 cas joués à l'identique en JavaScript et en PostgreSQL 16, 0 écart, même empreinte SHA-256**, et le banc éprouvé en le cassant (10 sabotages, 10 refus). Ce qui change entre le prototype et ce cahier est dit au §3.6.

### 3.1 Les unités, une fois pour toutes

| grandeur | rangée en | exemple | pourquoi |
|---|---|---|---|
| un montant (prix, total, base, TVA) | **centimes**, `bigint` / entier JavaScript sûr | 33,33 € → `3333` | `PLAN:1148` ; `8.2 * 100` vaut `819.9999999999999` (mesuré) : on ne multiplie jamais des euros |
| une quantité | **millièmes** de l'unité, `bigint` | 2,5 m² → `2500` | `PLAN:1227` ; un `integer` fait sortir 3 000 000 000 en `22003` anglais, un `bigint` le laisse à la contrainte nommée |
| un taux (TVA, retenue) | **centièmes de point**, `integer` | 5,5 % → `550` ; 5 % → `500` | `PLAN:2864` ; un taux en millièmes ne sait pas écrire 1,05 % ni 1,75 % |
| une surface | **millièmes de m²**, `bigint` | 42,5 m² → `42500` | la même échelle que la quantité, puisqu'elle s'y copie |

**Jamais** : `Math.round` sur un montant, `parseFloat`, `toFixed`, un taux décimal (`0.055`), un calcul en euros. Mesuré : `Math.round(euros × taux × 100)` se trompe **447 fois** sur les bases de 0 à 2 000,00 € à trois taux ; `(2.5 * 33.33).toFixed(2)` rend `"83.32"` au lieu de `"83.33"` (lecture argent §3.2). D'où : centimes entiers de bout en bout, et conversion **sur la chaîne** (`versCentimes`, `versMilliemes`, `versCentiemes`).

### 3.2 `src/lib/centimes.js` — nouveau, n'importe RIEN

| export | contrat |
|---|---|
| `versCentimes(texte)` | **déménagée telle quelle** d'`emetteur.js:413-438` : `{ ok, centimes, message }` ; virgule ou point (un seul), espaces et espaces insécables (U+00A0, U+202F), « € » final acceptés ; « 1.000,50 » refusé plutôt que deviné ; négatif refusé ; plus de deux décimales refusé ; 15 chiffres de centimes au plus ; une chaîne vide rend `centimes: null` — « non renseigné », jamais 0 |
| `centimesLisibles(n)` | **déménagée telle quelle** d'`emetteur.js:441-448` : `1234567` → `« 12 345,67 € »`, séparateur de milliers et espace avant « € » **insécables** (U+00A0) ; `null` pour un non-entier |

`emetteur.js` les **réexporte** (`export { versCentimes, centimesLisibles } from './centimes.js';`) : `tarifs.js:42`, `FicheEmetteur`, `verifier-emetteur` et `verifier-tarifs` ne changent pas. Le contrôle vérifie que c'est **la même fonction** des deux côtés (`emetteur.versCentimes === centimes.versCentimes`), pas une copie.

### 3.3 `src/lib/devis.js` — nouveau, n'importe que `./centimes.js` et `./entreprise.js`

`./entreprise.js` n'est importé que pour **`dateFrancaise()` et `isoLisible()`** : une date d'horodatage se lit à l'heure du téléphone, jamais par ses dix premiers caractères (la leçon de la nuit du lot T ; CR-E I9). `verifier-devis` vérifie que `devis.js` importe **exactement** ces deux modules, et ces deux noms.

**Constantes** (chacune comparée à son miroir SQL ou à sa source par `verifier-devis`) :

| constante | valeur | miroir |
|---|---|---|
| `TYPES_LIGNE` | `['zone', 'piece', 'poste', 'option', 'reserve']` | `devis_ligne_type_check` |
| `TYPES_CHIFFRES` | `['poste', 'option']` | `devis_ligne_forme_check`, `…_total_check` |
| `UNITES` | pour chaque clé : le libellé **court** (rangée, mémoire), le libellé de **pastille**, le **nom** (lu par VoiceOver) — `m2` « m² » / « m² » / « mètre carré » ; `m` « m » / « **m linéaire** » / « mètre linéaire » ; `m3` « m³ » / « m³ » / « mètre cube » ; `u` « u » / « **unité** » / « unité » ; `h` « h » / « heure » / « heure » ; `jour` « jour » / « jour » / « jour » ; `forfait` « forfait » / « forfait » / « forfait » | `devis_ligne_unite_check` ; « m linéaire » lève l'ambiguïté sans écrire « ml » (CR-E M10) ; « u » reste le libellé court, celui du propriétaire (`PROP:64-65`, « 270 € / u ») — §A, CR-D M3 |
| `UNITE_MAIN_OEUVRE` | `'h'` — **proposée**, jamais imposée | aucune contrainte (§1.4, point 2) |
| `TAUX_TVA` | `[0, 550, 1000, 2000]` | `devis_ligne_taux_check`, `devis_tva_taux_check` |
| `QUANTITE_MAX`, `PRIX_MAX`, `PLAFOND`, `LIGNES_MAX` | `99_999_999`, `9_999_999_999`, `9_999_999_999`, `500` | les bornes des contraintes ; `OP014` |
| `RETENUE_MAX` | `500` | `devis_retenue_check` |
| `LONGUEURS` | désignation 2 000, objet 1 000, adresse 200, ville 120, délai 200 | les contraintes de longueur |
| `SOURCES`, `STATUTS` | `['manuelle', 'demande', 'urgence']`, `['brouillon']` | `devis_source_check`, `devis_statut_check` |
| `CONTRAINTES_LIGNE` | les **dix** noms de contrainte de `devis_lignes`, **triés par ordre alphabétique** | le relevé de `pg_constraint` (essai, cas 2) |
| `BLANCS` | les caractères de la classe de blancs (§2.6) | la classe de la section 47 et `BLANCS_TARIFS` (`src/lib/tarifs.js`) — **comparés** : deux copies d'une même règle, tenues ensemble par un contrôle (CR-B M2) |
| `MENTION_FRANCHISE` | `'TVA non applicable, article 293 B du CGI'` | CGI 293 E, II (ÉTABLI) ; **une seule constante**, que l'écran et les contrôles lisent — la recodification de la TVA (CIBS, 01/01/2027) changera peut-être ce libellé, et il ne doit changer qu'à un endroit (CR-D M6) |
| `PHRASE_RETENUE` | la phrase du §1.2 | loi n° 71-584, art. 1er et 2 ; décret n° 71-1058, art. 1er |
| `DELAI_PAR_DEFAUT` | `{ texte: 'Dans les 30 jours suivant la signature du devis', pourquoi: 'Face à un particulier, si vous n’écrivez ni date ni délai, la loi vous oblige à intervenir sans retard injustifié, et au plus tard 30 jours après la conclusion du contrat (code de la consommation, art. L. 216-1).' }` | L. 216-1 (ÉTABLI, `textes/conso.txt:42-45`) ; la v1 écrivait « Sous 30 jours — c'est ce que la loi applique si vous ne dites rien », qui oubliait le consommateur, le « sans retard injustifié » et le point de départ (CR-D I1) |
| `PLAFOND_LISTE`, `MEMOIRE_MAX` | `200`, `500` | — |

**Fonctions** :

| fonction | contrat |
|---|---|
| `diviserArrondi(n, d)` | `n ≥ 0` entier sûr, `d > 0` pair : `(m − m mod d) / d` avec `m = n + d/2` ; `null` sinon. **Exacte** — c'est la formule SQL, et elle rend la même chose |
| `valeurLigne(l)` | `diviserArrondi(q × p, 1000)` pour un poste ou une option, `null` sinon ou si la ligne est irrecevable — **ce que vaut la ligne avant « Offert »** |
| `totalLigne(l)` | `0` si `l.offert`, sinon `valeurLigne(l)` ; `null` si irrecevable (dont une valeur au-delà du plafond, même offerte) |
| `tvaDe(base, taux)` | `diviserArrondi(base × taux, 10000)` ; `null` hors de `0 ≤ base ≤ 999 999 999 999 999` |
| `versMilliemes(texte)` | « 2,5 » ou « 2.5 » → `2500` ; trois décimales au plus ; négatif refusé ; **partie entière de cinq chiffres au plus** ; vide → `null` |
| `milliemesLisibles(q)` | `2500` → « 2,5 », sans zéros inutiles, milliers insécables |
| `versCentiemes(texte)` | **nouveau** (CR-E M3) : un pourcentage tapé → centièmes de point : « 5 » → `500`, « 2,5 » → `250`, « 0,01 » → `1` ; deux décimales au plus ; « % » final accepté ; négatif refusé ; vide → `null` ; **ses messages parlent de pourcentage**, jamais d'euros (`versCentimes` dit « Écrivez un montant en euros », `emetteur.js:421-424`) |
| `tauxLisible(c)` | `550` → « 5,5 % » (espace insécable avant « % ») ; **`0` → `null`** : « 0 % » ne s'affiche jamais |
| `validerLigne(l)` | `{ ok, contrainte, champ }` ; teste **dans l'ordre de `CONTRAINTES_LIGNE`** ; `contrainte` = le nom que la base citerait ; **la phrase vient de `messageDeContrainte()`** (`erreurs.js`), jamais d'une seconde écriture ici ; le test du total compare `q × p > PLAFOND × 1000 + 499` (exact au-delà de 2^53, mesuré, C07e) — **sur la valeur, même pour une ligne « Offert »** |
| `validerDevis(d)` | même forme, pour l'objet, le lieu, le délai, la retenue |
| `trierLignes(lignes)` | par `ordre`, **puis par `id`** (CR-B I7) — **la seule** façon de ranger des lignes, appelée par `sousTotaux()`, l'écran et la démonstration |
| `ventilationParTaux(lignes)` | `[{ taux, base, tva, nbLignes }]`, **les postes seulement**, **taux décroissant**, un taux présent à base 0 compris ; `null` si une ligne est irrecevable |
| `totauxDevis(lignes)` | `{ ok: true, ht, tva, ttc, ventilation, options: [{ id, designation, total, taux }] }`, ou `{ ok: false, contrainte }` ; refuse si le HT **puis** le TTC dépasse `PLAFOND`. **Ne rend aucun total d'options** — le lot 2 l'appellera **sur l'union** des postes et d'une option (§2.4) |
| `sousTotaux(lignes)` | pour chaque ligne `zone` et `piece`, la somme des **postes** qui la suivent dans `trierLignes()` jusqu'au titre suivant de même niveau ou de niveau supérieur |
| `lignesDeLaPiece(lignes, idTitre)` | les lignes qu'emporte un titre (pour la phrase de « Retirer » sur une pièce, §4.4, et « Retirer la pièce et ses lignes ») ; et `titreQuiRecoit(lignes, idTitre)` : le titre de même niveau qui le précède, ou `null` |
| `montantDevis` | **`centimesLisibles` sous un second nom** — une seule écriture (§1.5, C8) |
| `ordreEntre(avant, apres)` | l'entier au milieu, ou `null` s'il n'y a plus de place ; `renumeroter(lignes)` rend les ordres de 1 000 en 1 000, dans l'ordre de `trierLignes()` ; `monter(lignes, id)` / `descendre(lignes, id)` rendent le nouvel ordre d'une ligne (au-dessus ou au-dessous de sa voisine), ou demandent une renumérotation |
| `memoireDesLignes(lignes, texte, { idLigne })` | parmi les lignes **de ses devis** (postes et options ; ni titres ni réserves ; **la ligne en cours exclue**), celles dont la désignation contient le texte tapé (sans accents ni casse) ; **groupées par (désignation exacte, unité, fourniture non comprise)** — une même phrase avec et sans fourniture fait **deux** entrées, parce qu'elle n'a pas le même prix (CR-E I3) — la plus récente d'abord (`modifieLe`, puis `id`) ; chacune avec **ses trois derniers prix, chacun avec son devis d'origine** (objet et **`dateFrancaise(devis.modifieLe)`**) ; une ligne « Offert » ressort avec « Offert » et sa valeur. **Ce qu'un appui recopie** : la phrase, l'unité, le prix choisi, **la fourniture non comprise et la main-d'œuvre** — jamais « Offert » (offrir est une décision de CE devis), jamais la quantité (elle dépend du chantier). **Jamais une moyenne, une médiane, un minimum ou un maximum** : 50 € et 70 € ne font pas 60 € (`PLAN:3120`) |
| `devisDepuisClient(c)` | `{ source: 'manuelle', clientId: c.id }`, plus le **lieu proposé** depuis `c.adresse`, `c.codePostal`, `c.ville` (une copie, modifiable) |
| `devisDepuisDemande(d)` | genre `'devis'` → `{ source: 'demande', quoteRequestId: d.id, objet: d.titre }` ; genre `'sos'` → `{ source: 'urgence', sosRequestId: d.id, objet: d.titre }` ; genre `'rappel'` → `null`. **Ni client, ni lieu** : « ne pré-remplit que la description » (`PLAN:3221`) — le client d'une demande est un COMPTE, et le client d'un devis une FICHE (D1) |
| `peutFaireUnDevis(d)` | genre `devis` ou `sos`, statut accepté ou terminé, **dans les deux orthographes** (`accepte`, `acceptee`, `termine` — `GENRES_DEMANDE`, `api:2344-2352`) |
| `origineLisible(devis)` | « depuis une demande du 15/09 » / « depuis une urgence du 15/09 » (la date de la demande par **`dateFrancaise()`**) / « depuis une demande » (lien devenu vide, `source` gardée) / `null` |
| `depuisLisible(iso, maintenant)` | **nouveau** (CR-E I9) : « il y a 5 min », « il y a 2 h », « hier », puis `dateFrancaise()` ; l'horodatage passe par **`isoLisible()` avant `Date.parse`** (Hermes est plus strict que `node`) ; `maintenant` est un paramètre, pour que le contrôle le fasse tourner à une heure choisie |
| `trierDevis(liste)` | par `modifieLe` décroissante, puis `id`. **Un seul statut existe** : le jour où un second existe, l'attente passe devant, et `verifier-devis` l'exigera |
| `coherenceRegime(lignes, etatRegime)` | `null` si tout va bien **ou si le régime n'est pas connu** (`chargement`, `echec` : on ne juge pas ce qu'on n'a pas pu lire) ; sinon une phrase : régime non déclaré et des postes ; **franchise** et un taux non nul ; **régime réel** et un taux nul. **Rien n'est corrigé tout seul** |
| `tauxProposes(etatRegime)` | `'franchise'` → `[0]` (aucun choix montré) ; `'reel'` → `[2000, 1000, 550]` ; **non déclaré** → `[]` ; **`chargement` ou `echec` → `null`** — « on ne sait pas », qui n'est **jamais** affiché comme « non déclaré » (CR-E B3) |
| `tauxHorairePropose(etatTarifs, etatRegime)` | **franchise** : `{ valeur, phrase: « Votre taux horaire affiché : 62,50 €. Proposé, modifiable. » }` ; **régime réel** : `{ valeur: null, phrase: « Votre taux horaire affiché : 62,50 € TTC. Ce champ est hors taxes : écrivez le montant HT que vous facturez. » }` ; aucun taux déclaré : `{ valeur: null, phrase: « Vous n'avez pas déclaré de taux horaire dans Mon entreprise. » }` ; **tarifs ou régime en lecture ou en échec** : `{ valeur: null, phrase: « Votre taux horaire n'a pas pu être lu. » }` — jamais « pas déclaré » pour un échec (la famille du « vos tarifs ne sont pas affichés » corrigé au lot T, CR-E B3) |
| `avertissementDelai(texte)` | si le texte contient « indicati » : « Face à un particulier, une date ou un délai « indicatif » est présumé abusif (code de la consommation, art. R. 212-2, 7°) : écrivez une date ou un délai ferme. » ; sinon `null` (CR-D M10 : le texte vise une « date indicative d'exécution ») |

### 3.4 Le même calcul côté SQL — et une seule liste de cas pour les deux

Deux écritures par règle — SQL pour la base, JavaScript pour l'écran avant l'enregistrement et pour la démonstration — **éprouvées sur le même jeu** (`PLAN:2041-2044`).

| arrondi | écrit en SQL | écrit en JS | lu par |
|---|---|---|---|
| total de ligne | `devis_total_ligne()` (+ `case when offert then 0`) | `valeurLigne()`, `totalLigne()` | le déclencheur de ligne, `devis_ligne_total_check`, les cas |
| TVA par taux | `devis_tva_de()` | `tvaDe()` | `recalcule_devis()`, `devis_tva_arrondi_check`, les cas |
| totaux du devis | **aucun arrondi** : des sommes d'entiers | `totauxDevis()` | `tient_le_devis()` |

**Le jeu commun : `supabase/cas-devis.json`**. `npm run verifier` ne joue aucun essai SQL, et la CI non plus : la comparaison ne peut pas être automatique dans les deux sens. La parade : **les attendus sont écrits UNE fois**, dans ce fichier — chaque cas est une suite d'opérations (ajouter, modifier, retirer une ligne) et sa forme canonique attendue `HT|TVA|TTC|taux:base:tva:nb,…|options` ou `REFUS:<contrainte>`. **`verifier-devis` le joue en JavaScript** à chaque passage ; **`essais-section-49.sql` le joue en PostgreSQL** (cas 30). Les deux se comparent aux **mêmes** attendus. La forme canonique ne garde que les taux à `nb_lignes > 0`, des deux côtés.

### 3.5 Les cas de bord, et leurs résultats attendus

Format : `HT | TVA | TTC | ventilation (taux:base:tva:nb) | options (taux:total)`.

| cas | ce qu'il éprouve | attendu |
|---|---|---|
| C01 | 3 × 33,33 € HT à 10 % — **le cas qui prouve la méthode** | `9999 \| 1000 \| 10999 \| 1000:9999:1000:3 \| —` (ligne par ligne : 999) |
| C02 | demi-centime exact : 0,05 € à 10 % → 0,5 c | `5 \| 1 \| 6 \| 1000:5:1:1` — le demi monte |
| C02b | 3,00 € à 5,5 % → 16,5 c | `300 \| 17 \| 317 \| 550:300:17:1` |
| C02c | **1,05 %, sur la fonction seule** : `tvaDe(1000, 105)` | `11` — et une **ligne** à 105 : `REFUS:devis_ligne_taux_check` |
| C02d | 1,75 %, fonction seule : `tvaDe(200, 175)` | `4` (3,5 c) |
| C03 | 2,5 m² à 33,33 € à 20 % : ligne 83,325 € | `8333 \| 1667 \| 10000 \| 2000:8333:1667:1` — **en flottants : 83,32 €** |
| C04 | trois taux + un titre + une réserve (ignorés) | `303438 \| 53733 \| 357171 \| 2000:245000:49000:1,1000:33750:3375:1,550:24688:1358:1` |
| C05 | un poste et une option de 33,33 € à 10 % | `3333 \| 333 \| 3666 \| 1000:3333:333:1 \| 1000:3333` |
| C05b | (le piège) les deux en postes — ce que le lot 2 calculera **sur l'union** pour dire le TTC « option comprise » | `6666 \| 667 \| 7333` — **pas 3666 + 3666 = 7332** |
| C06 | 100 postes à 0,01 € à 20 % | `100 \| 20 \| 120 \| 2000:100:20:100` (ligne par ligne : 0) |
| C07 | un total **au** plafond, en franchise | `9999999999 \| 0 \| 9999999999 \| 0:9999999999:0:1` |
| C07b | une ligne au-dessus du plafond | `REFUS:devis_ligne_total_check` |
| C07c | HT sous le plafond, TTC au-dessus (20 %) | `REFUS:devis_plafond_check` |
| C07d | deux lignes sous le plafond, leur somme au-dessus | `REFUS:devis_plafond_check`, à la seconde |
| C07e | quantité et prix au maximum (produit ~1e18 > 2^53) | `REFUS:devis_ligne_total_check`, des deux côtés |
| C07f | quantité au maximum, prix 0,01 € | `100000 \| 20000 \| 120000 \| 2000:100000:20000:1` |
| C07g | **à la borne** : q = 1351, p = 7 401 924 500 → total = plafond + 1 c | `REFUS:devis_ligne_total_check` |
| C07h | **à la borne** : q = 1001, p = 9 990 009 989 → arrondi **au** plafond | `9999999999 \| 0 \| 9999999999 \| 0:9999999999:0:1` |
| C08, C08b, C08c | quantité négative, nulle, au-delà du maximum | `REFUS:devis_ligne_quantite_check` ×3 |
| C09 | prix nul **sans** « Offert » | `REFUS:devis_ligne_offert_check` |
| C09b | prix nul **avec** « Offert » à 20 %, et un poste de 10 € à 10 % | `1000 \| 100 \| 1100 \| 2000:0:0:1,1000:1000:100:1` — le taux de l'« Offert » apparaît à base 0 |
| **C09c** | **changé** : « Offert » sur un prix de 10 € à 10 %, et un poste de 10 € à 10 % | `1000 \| 100 \| 1100 \| 1000:1000:100:2` — **accepté**, la valeur est gardée (mesuré le 21/10, `v2/offert-superset.out` ; la v1 attendait un refus) |
| **C09d** | **nouveau** : la même, « Offert » éteint | `2000 \| 200 \| 2200 \| 1000:2000:200:2` — le prix revient tout seul (mesuré) |
| **C09e** | **nouveau** : « Offert » dont la valeur dépasse le plafond (q = 99 999 999, p = 9 999 999 999) | `REFUS:devis_ligne_total_check` (mesuré) |
| C10 | prix négatif (une « remise » en ligne négative) | `REFUS:devis_ligne_prix_check` |
| C11 | franchise : tout à 0 | `8338 \| 0 \| 8338 \| 0:8338:0:2` |
| C12, C12b | taux 1 960 (l'ancien taux normal) ; taux 105 sur une ligne | `REFUS:devis_ligne_taux_check` ×2 |
| C13 | un titre qui porte un prix | `REFUS:devis_ligne_forme_check` |
| C14 | on retire une ligne : le total redescend | `6666 \| 667 \| 7333 \| 1000:6666:667:2` |
| C14b | une ligne change de taux : l'ancien sort de la ventilation | `8333 \| 833 \| 9166 \| 1000:8333:833:2` |
| C14c | tout est retiré | `0 \| 0 \| 0 \| —` |
| C15 | 56,82 € de l'heure × 1,5 h à 10 % (le taux HT écrit **à la main**) | `8523 \| 852 \| 9375 \| 1000:8523:852:1` |
| C16 | **la double faute** : quantité 0 ET prix 0 sans « Offert » | `REFUS:devis_ligne_offert_check` — l'ordre alphabétique (mesuré le 21/10) |
| C17 | quantité 3 000 000 000 | `REFUS:devis_ligne_quantite_check` — jamais un 22003 |
| C18 | type inconnu | `REFUS:devis_ligne_type_check` |
| C19 | une ligne chiffrée sans taux | `REFUS:devis_ligne_forme_check` |
| **C20** | **inversé** : main-d'œuvre au m², 42 €/m² × 17 m² à 10 % | `71400 \| 7140 \| 78540 \| 1000:71400:7140:1` — **accepté** (la v1 attendait `REFUS:devis_ligne_main_oeuvre_check`, CR-D B1) |
| C21 | unité `'ml'` | `REFUS:devis_ligne_unite_check` |
| C22 | une désignation faite d'un U+200B | `REFUS:devis_ligne_designation_check` |
| C23 | des surfaces sur un poste | `REFUS:devis_ligne_forme_check` |
| C24 | une surface de 0 sur une pièce | `REFUS:devis_ligne_surfaces_check` |

Et, **en JavaScript seulement** : `versMilliemes` (« 2,5 », « 2.5 », « 2,500 », « 2,5000 » refusé, « -1 » refusé, « 100000 » refusé, « » → `null`) ; `versCentiemes` (« 5 » → 500, « 2,5 » → 250, « 5 % » → 500, « 5,001 » refusé, « -1 » refusé, « » → `null`) ; `montantDevis` (`9999999999` → « 99 999 999,99 € », `5` → « 0,05 € », `1.5` → `null`) ; `tauxLisible(0)` → `null` ; `memoireDesLignes` (deux prix 50 € et 70 € → deux entrées, **jamais 60 €** ; une même phrase au m² et au forfait → deux entrées ; **avec et sans fourniture → deux entrées** ; la ligne en cours exclue) ; `sousTotaux` (une option sous une pièce n'entre pas dans son sous-total ; **deux lignes au même `ordre` se rangent par `id`**, et le résultat ne dépend pas de l'ordre du tableau d'entrée) ; `devisDepuisDemande` sur les trois genres ; `peutFaireUnDevis` sur `accepte`, `acceptee`, `termine`, `en_attente`, `envoyee` ; `coherenceRegime`, `tauxProposes` et `tauxHorairePropose` sur **les cinq états** du régime (dont `echec`, qui ne rend jamais la phrase « non déclaré ») ; `depuisLisible` et `origineLisible` **dans trois fuseaux**, sur les deux bords de minuit (§6.1-A).

### 3.6 Ce qui change entre le prototype de la lecture argent et ce cahier

| prototype | ce cahier | pourquoi |
|---|---|---|
| `TAUX_ADMIS = [0, 105, 175, 550, 1000, 2000]` | `[0, 550, 1000, 2000]` | une valeur que rien ne produit est morte ; 105 et 175 s'éprouvent sur la fonction (§2.5) |
| `devis_tva.option` et trois totaux d'options | aucun | un « total avec options » n'est pas une somme (§2.4) |
| `remiseLigne`, `repartirPlusFortReste` | **absents** | aucune remise au lot 1 (§1.5, C6) |
| `montantDevis` réécrit dans le fichier | `centimesLisibles` réexportée | une seule écriture (§1.5, C8) |
| `versMilliemes` borné à 9 chiffres | 5 chiffres de partie entière | le message dit « trop grand » au bon endroit |
| `validerLigne` rend un message | rend le **nom** de la contrainte ; la phrase vient d'`erreurs.js` | une seule écriture des phrases |
| types `titre_zone`, `titre_piece`, `prestation` | `zone`, `piece`, `poste` | §1.4 |
| « Offert » = prix 0 | **« Offert » = total 0, prix gardé** | §1.4, point 1 (CR-D I3) ; mesuré sur le prototype le 21/10 |
| (la v1) `devis_ligne_main_oeuvre_check` | **retirée** | §1.4, point 2 (CR-D B1) |
| verrou `for update` | **`for no key update`** | §2.6 (CR-B I1, mesuré) |

---

## 4. L'application

### 4.1 `src/lib/erreurs.js` — les phrases

- **Une phrase par contrainte qui garde une saisie** dans `MESSAGES_CONTRAINTE` (`erreurs.js:65`), en français, qui dit **quoi faire** (§2.5, colonne de droite). Les contraintes que l'écran ne peut pas produire (`devis_source_check`, `devis_statut_check`, `devis_totaux_check`, `devis_ligne_type_check`, les trois de `devis_tva`) reçoivent aussi une phrase : « une valeur que l'application n'envoie jamais — mettez Opus à jour », plutôt que la piste FAUSSE « `schema.sql` n'a pas été rejoué » (`erreurs.js:445-458`). **Les 23** ont donc une entrée ; `verifier-devis` compare les deux listes **dans les deux sens**.
- **`OP013`** et **`OP014`** : la phrase vient de la base, et `messageClair()` la rend telle quelle (`erreurs.js:313`). Trois phrases pour `OP013`, une par lien.
- **`40P01`** (interblocage, CR-B I1) : une branche de plus — « Deux enregistrements de ce devis se sont croisés. Rien n'est perdu : réessayez. » Avec `for no key update` et la file d'écriture, il ne devrait plus sortir que de deux appareils à la fois ; la file le retente **une fois** d'elle-même (la transaction a été annulée en entier, la retenter ne double rien), et ne montre la phrase qu'au second échec.
- **`23505` sur une clé primaire du devis** ne s'affiche jamais : la file d'écriture le reconnaît comme « déjà enregistré » (§4.2). Ailleurs, la branche 23505 existante s'applique.
- **Le délai** : la phrase d'`avecDelai()` (`erreurs.js:531`), déjà en français.
- **Rien d'autre ne change** : les branches 23503, 22003, 23502 et la lecture des codes `OP` existent depuis le lot 0a (`erreurs.js:302-305`, `:351-375`, `:446-453`). La phrase de 23503, qui cite déjà « un devis », ne devrait plus jamais sortir d'un lien de devis (`OP013` part avant).

### 4.2 `src/lib/api.js`, la file d'écriture, et l'identifiant d'une ligne

**Toutes les fonctions `devis*` sont écrites APRÈS `const noop` (`api:1274`)** — une `const` lue avant sa déclaration, c'est un écran blanc que ni le linter ni l'export ne signalent. Et **deux fonctions nommées, le choix à la fin** (`export const x = hasSupabase ? xSupabase : xDemo;`) : le piège Metro de l'asynchrone dans un ternaire.

#### Ce qui a changé depuis la v1, et pourquoi (CR-E B1, B2 ; CR-B I3)

La v1 écrivait « `upsert` de la ligne, puis relecture » et « le devis ne naît qu'à la première écriture ». Trois défauts, revérifiés :

1. **un `upsert` partiel est refusé, avec le mauvais message** : PostgreSQL juge la ligne **proposée** avant de la fusionner (le piège du lot T) — mesuré par CR-B : `23502` anglais sur `ordre`, ou `devis_ligne_designation_check` pour une ligne dont la désignation est écrite ;
2. **deux enregistrements rapprochés créent deux devis, ou deux lignes** : la ligne n'a pas d'identifiant tant que la base ne l'a pas rendu, et deux requêtes partent avant la réponse. Le dépôt n'a **aucun** générateur d'identifiant (relevé : ni `randomUUID` ni `uuid` dans `src/`, ni `expo-crypto` dans `package.json`) ;
3. **les réponses arrivent dans le désordre**, et une clé de rangée qui passe d'une valeur provisoire à l'`id` de la base **remonte la cellule** pendant la frappe.

**La parade, en trois pièces :**

**a. L'identifiant est choisi par le téléphone** — `src/lib/identifiant.js`, nouveau, **n'importe rien** :

```js
export function nouvelIdentifiant() {
  // Le navigateur (et peut-être Hermes) : l'API standard.
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  // Le téléphone : le générateur natif du cœur d'Expo, déjà dans Expo Go et
  // dans le build de développement — aucun module à ajouter, aucune reconstruction.
  if (typeof globalThis.expo?.uuidv4 === 'function') return globalThis.expo.uuidv4();
  return null;   // l'appelant refuse, avec une phrase : jamais un identifiant bricolé
}
```

ÉTABLI : `expo-modules-core` déclare `expo.uuidv4()` dans son objet global (`node_modules/expo-modules-core/build/ts-declarations/global.d.ts:64-67`), et le définit côté iOS (`node_modules/expo-modules-core/ios/Core/Modules/CoreModule.swift:78`, `Function("uuidv4")`) ; `expo-notifications` s'en sert déjà (`uuid.v4()`). Chromium fournit `crypto.randomUUID()` sur `localhost`. **DÉDUIT, à vérifier sur l'iPhone** : que `globalThis.expo.uuidv4` soit bien là dans l'application d'essai — la toute première ligne enregistrée le prouve (§7.6). Si la fonction rend `null`, la saisie le dit (« Cet appareil ne sait pas fabriquer d'identifiant : mettez Opus à jour ») au lieu d'enregistrer de travers. **Pourquoi pas `import { uuid } from 'expo-modules-core'`** : ce paquet n'est pas une dépendance directe d'Opus, et `verifier-imports` refuse tout paquet absent de `package.json` (CLAUDE.md, 11/10). **Un identifiant choisi par le client n'ouvre rien** : la RLS juge le devis visé, pas l'identifiant ; un identifiant qui existerait déjà chez un autre artisan rend `23505`, et un `update` sur sa ligne ne la voit pas.

Conséquences : l'écran donne son `id` au devis **dès l'ouverture d'un brouillon** (il n'est envoyé qu'à la première écriture) et à chaque ligne **dès la création de sa carte** ; la clé de rangée (`keyExtractor`) est cet `id`, **stable de la naissance à la suppression** — aucune cellule ne se remonte quand la base répond (CR-E B2, point 3 ; la protection de la cellule qui a le focus est liée à sa clé, CR-E I6). La clé de l'**écran** (`cleDevis`), elle, reste un compteur d'`OpusApp`, **jamais l'`id`**.

**b. La file d'écriture** — `src/lib/file-ecriture.js`, nouveau, **n'importe rien** (elle reçoit les fonctions d'écriture en paramètre : `verifier-devis` la FAIT TOURNER avec de fausses écritures, des délais et des réponses dans le désordre) :

| règle | pourquoi |
|---|---|
| **une file par devis, une requête en vol à la fois**, dans l'ordre d'arrivée | la création du devis passe toujours avant ses lignes ; deux écritures d'une même ligne ne se croisent jamais au serveur |
| **deux écritures en attente pour la même ligne fusionnent** : la dernière valeur l'emporte ; une insertion pas encore partie absorbe les modifications qui la suivent | taper, changer d'unité, changer de taux ne fait partir qu'une requête si la première n'est pas revenue |
| **une ligne s'INSÈRE une fois, entière** (toutes les colonnes de la liste fermée, `id`, `ordre` et `type` compris), puis ne se **MODIFIE** que par des `update` (PATCH) qui n'envoient que ce qui a changé ; **jamais d'`upsert`** | CR-B I3 : un `update` partiel passe (mesuré, `UPDATE 1`, total recalculé) ; un `upsert` partiel est jugé sur la ligne proposée |
| **chaque écriture porte un délai** (`avecDelai`, 8 s, la phrase de `erreurs.js`) | sans délai, une requête qui ne revient jamais n'atteint jamais le `catch` (l'incident du 01/10) ; relevé : `avecDelai` n'est utilisé aujourd'hui que pour trois **lectures** (`OpusApp.js:554, 601, 794`) |
| **une écriture renvoyée est la MÊME écriture** : même identifiant, mêmes valeurs. Une insertion qui rend `23505` sur sa clé primaire est **relue par son `id`** : si la base la rend (donc la RLS dit qu'elle est à moi), c'était déjà fait ; sinon (un identifiant pris ailleurs — en pratique jamais), nouvel identifiant et nouvel essai | après un délai dépassé, l'écriture a pu passer : la renvoyer ne doit jamais créer un doublon |
| **après chaque écriture confirmée, une relecture** : le devis et sa ventilation, **en une requête** (`select('total_ht_centimes, total_tva_centimes, total_ttc_centimes, devis_tva(taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes)')`), filtrée `nb_lignes > 0` côté écran | l'écran affiche ce que la base a calculé |
| **un compteur de génération** : une relecture n'est posée à l'écran que si aucune écriture n'est partie depuis | une réponse en retard n'affiche jamais un total périmé comme « le total de la base » ; le précédent est `generationMesTarifs` (`OpusApp.js:544-552`) |
| **l'état de chaque ligne est public** : `locale` (jamais partie : incomplète, ou refusée par `validerLigne()`), `en_cours`, `enregistree`, `echec` ; `enAttente()` rend le nombre de lignes qui ne sont pas `enregistree` | l'écran, le pied et la garde de sortie le lisent (§4.4) |
| **`40P01`** : retentée une fois ; au second échec, `echec` | §4.1 |

**c. Les fonctions de l'API** :

| fonction | Supabase | démonstration |
|---|---|---|
| `mesDevis()` | `from('devis').select('*, client:client_id(nom), demande:quote_request_id(created_at, budget), urgence:sos_request_id(created_at)').eq('pro_id', currentUserId).order('modifie_le', { ascending: false }).order('id').limit(201)` — **201** pour savoir s'il y en a plus de 200 ; **une erreur est levée, jamais avalée** | une copie vivante de `DEVIS_DEMO`, filtrée par `String(proId) === String(moiEnDemo())` |
| `unDevis(id)` | le devis (même `select`) **et** ses lignes (`order('ordre').order('id')`) **et** sa ventilation (`gt('nb_lignes', 0)`), en parallèle | idem, en mémoire |
| `devisDuClient(clientId)` | `devis` où `client_id = clientId`, 21 au plus, triés par date | idem |
| `devisDeLaDemande(genre, id)` | **nouveau** (CR-E I10) : `devis` où `quote_request_id` (ou `sos_request_id`) `= id`, `select('id, objet, modifie_le')`, triés par date, 5 au plus | idem |
| `creerDevis(valeurs)`, `modifierDevis(id, changements)` | `insert` de la ligne **entière**, avec son `id` ; puis `update` de ce qui change — **par la file** | `validerDevis()`, puis en mémoire ; un refus avec **les mots de la base** (`refusDeContrainte`, `api:1912-1915`) |
| `insererLigne(devisId, ligne)`, `modifierLigne(id, changements)`, `retirerLigne(id)` | **par la file**, puis la relecture des totaux | `validerLigne()`, puis `totauxDevis()` sur les lignes en mémoire — **jamais plus aimable que la base** ; la démonstration passe par **la même file**, avec des écritures en mémoire : les états se voient sans `.env` |
| `supprimerDevis(id)` | `delete`, par la file (la file du devis est vidée d'abord : on ne supprime pas un devis dont une ligne part encore) | en mémoire |
| `memoireDesLignes()` | **filtrée par ses devis côté base** (CR-B I4) : `from('devis_lignes').select('id, designation, unite, prix_unitaire_centimes, offert, main_oeuvre, fourniture_non_comprise, modifie_le, devis:devis_id!inner(id, objet, modifie_le)').eq('devis.pro_id', currentUserId).in('type', ['poste','option']).order('modifie_le', { ascending: false }).order('id').limit(500)` ; la recherche se fait en JavaScript (`memoireDesLignes()` de `devis.js`) : **aucune fonction SQL de plus**, donc aucune fonction de plus dans la liste fermée des lecteurs de prix | sur les lignes de démonstration |
| `monRegime()` | `api.monEmetteur()` (`api:1970`), dont on ne garde que `emetteur.regime_tva` | idem, en mémoire — **y compris après un enregistrement par « Mon entreprise » en démonstration** (`enregistrerEmetteurDemo`, `api:2007-2016`) |

**Pourquoi la mémoire filtre par `devis.pro_id`** — revérifié le 21/10 sur le prototype de CR-B (PostgreSQL 16, **200 002 lignes d'un autre artisan**, 21 lignes à soi, avec le jeton de l'artisan ; `v2/memoire.sql`, `v2/memoire.out`) :

| requête | plan | temps |
|---|---|---|
| celle de la v1 (la RLS seule trie) | **`Seq Scan on devis_lignes`**, 200 002 lignes écartées par le filtre de la politique | **306 ms** |
| la forme que PostgREST émet pour `devis!inner(…)` + `devis.pro_id=eq.…` (une jointure latérale interne) | `Index Scan using idx_devis_emis_pro`, puis `idx_devis_lignes_devis` | **2,9 ms** |

CR-B avait mesuré 3 503 ms contre 1,5 ms avec une autre forme de plan : l'ordre de grandeur varie, **le sens ne varie pas** — sans filtre, le coût croît avec les lignes de **tous** les artisans, et la vraie base coupe à **8 s** (`statement_timeout`, relevé le 21/10). **DÉDUIT** : que PostgREST émette bien cette forme (`INNER JOIN LATERAL … ON TRUE`) ; le SQL mesuré est celui que je crois qu'il émet. À relever pour de vrai au §7.5 (le temps de la requête sur la vraie base, et `!inner` présent dans la requête interceptée). **Écarté** : `.in('devis_id', ids)` sur 200 identifiants (une adresse de plus de 7 Ko, près de la limite d'une ligne de requête) ; et une fonction SQL `security definer` (elle sortirait de la liste fermée des lecteurs de prix).

**Ce que l'application lit pour proposer** — le régime de TVA (`monRegime()`) et le taux horaire (`mesTarifs()`, `api:2078`) — passe par les fonctions existantes : **aucune fonction SQL du lot 1 ne lit `emetteur` ni `tarifs_pro`**, et les listes fermées de `verifier-emetteur.mjs:1252-1265`, `verifier-legal.mjs:725-771` et du cas 26 bis de `essais-section-46.sql` ne bougent pas.

- **Le téléphone ne choisit aucune date, aucun total, aucune source après la création** : `devisVersBase()` et `ligneVersBase()` (le miroir de `clientVersBase`, `api:1724-1736`) n'envoient que les colonnes que l'artisan écrit, plus l'`id` et `source` **à la création seulement**. La liste FERMÉE est tenue par `verifier-devis` (§6.1-D).
- **`tableAbsente(erreur)`** (`api:1960-1962`) : une base où la section 49 n'est pas encore posée rend « Lecture impossible — la base n'est pas à jour », jamais « Aucun devis ».

### 4.3 Le mode démonstration fait VIVRE le mécanisme

`src/data/devis-demo.js` (nouveau), et **aucune retouche** des données de démonstration existantes — `initialDemandesRecues` (`src/data/demo.js:550-574`), `emetteur-demo.js` et `tarifs-demo.js` sont lus par d'autres contrôles.

- **Deux devis de l'artisan `1`** (un nombre ici, une chaîne ailleurs : **toute comparaison par `String()`**) :
  1. « Rénovation salle de bains » pour **Mme Martin** (`cl-martin`, `demo.js:381`), `source 'manuelle'`, lieu repris de sa fiche : une zone « R+1 », une pièce « Salle de bains » **avec ses surfaces** (sol 6,2 m², murs 18,5 m²), quatre postes **à deux taux** (10 % et 20 %) — dont un « Main-d'œuvre » à l'heure, une « Chape sèche avant carrelage collé » au m² à 45,00 € et un « Fourniture non comprise » —, un poste « Offert » **avec sa valeur**, une réserve, une option, une retenue de garantie à 5 % ;
  2. un brouillon **sans client** (« Pour qui ? — à choisir »), `source 'manuelle'`, trois postes, dont **la même « Chape sèche avant carrelage collé », au m², à 52,00 €** et **sa variante « fourniture non comprise » à 38,00 €** — sans eux, « deux prix → deux entrées » et « avec et sans fourniture → deux entrées » ne se verraient nulle part sans `.env` (CR-E I8).
- **Les totaux ne sont PAS écrits dans le fichier** : ils sont calculés par `totauxDevis()` au chargement, et `verifier-devis` **refait** le calcul sur ces données.
- **Les dates sont calculées** (il y a 2 h, il y a 3 jours), jamais figées : une date écrite dans le fichier vieillirait (la leçon des demandes de démonstration du 04/10).
- **Le régime de la démonstration est `'reel'`** (`emetteur-demo.js:75`) — **et il se change par le geste** : « Mon entreprise » enregistre en mémoire (`enregistrerEmetteurDemo`), et l'écran de saisie le relit par `surEmetteur` (§4.8). **La franchise se voit donc en démonstration**, ce que la v1 croyait impossible (CR-E I8) — et c'est le seul endroit sans `.env` où la relecture du régime s'éprouve.
- **La demande de devis de démonstration est `en_attente`** (`demo.js:557-563`) : on l'**accepte** dans l'application (`repondreDemandeDemo`), et « Faire un devis » apparaît. Même chose pour l'urgence (`envoyee`, `demo.js:551-556`). Le mécanisme se vérifie **par le geste**, sans données truquées.
- **Le taux horaire** : la fiche de démonstration n'a pas de tarifs (`emetteur-demo.js:103`) ; la carte le dit (« Vous n'avez pas déclaré de taux horaire dans Mon entreprise ») — un état réel, distinct de l'échec de lecture.

### 4.4 L'écran de saisie — `src/screens/SaisieDevisScreen.js`

**Un ÉCRAN, pas une fenêtre** (`screen === 'devisSaisie'` dans `OpusApp`) : plein écran, retour EN HAUT (le clavier monte du bas, il ne peut enfermer personne) ; et c'est ce qui permet d'ouvrir la fiche d'un client ou « Mon entreprise » **par-dessus**, sans jamais deux `Modal` empilées.

#### Lire en liste, éditer en carte — et la carte prend l'écran (TRANCHÉ ICI, CR-E I6)

La v1 ouvrait la carte d'une ligne **à sa place**, dans la liste. Trois défauts, revérifiés : le levier qu'elle citait pour protéger la carte du fenêtrage (`removeClippedSubviews`) vaut **déjà `false` sur iOS** par défaut (`node_modules/react-native/Libraries/Lists/FlatList.js:162-167`, drapeau `shouldUseRemoveClippedSubviewsAsDefaultOnIOS` à `false`, `ReactNativeFeatureFlags.js:197`) et ne règle pas le fenêtrage ; fermer une carte de ≈ 580 points pour en ouvrir une plus bas fait **sauter** la liste d'autant ; et sur un petit écran, clavier ouvert, ce qui suit le champ actif (les pastilles, les suggestions) passe sous le clavier.

**La carte d'une ligne s'ouvre donc en PRENANT L'ÉCRAN** : une vue posée **au-dessus** de la liste (position absolue, fond opaque), avec son propre `ScrollView {...CLAVIER}` — **pas une `Modal`** (aucune fenêtre iOS de plus). La liste reste **montée en dessous**, donc garde sa position : on revient exactement où l'on était. Pendant que la carte est ouverte, la liste est cachée à VoiceOver (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`). Ce que cela règle d'un coup : plus de fenêtrage sous la carte, plus de saut, les pastilles toujours atteignables, un moment net pour enregistrer (fermer la carte), et « La compléter » qui n'a plus besoin de `scrollToIndex` (qui échoue sur iOS pour une cellule non montée et ne se reproduit pas au navigateur, CR-E M11). C'est toujours « une LISTE qui se lit, une CARTE qui s'édite » (`PLAN:3088`) ; « à sa place » était une lecture de la v1, pas une décision du plan. **Ce qu'on perd** : on ne voit pas les lignes voisines pendant qu'on en modifie une — d'où le titre de la pièce et son sous-total en tête de carte. À juger sur l'iPhone (§7.6).

#### La liste, de haut en bas

1. **L'en-tête** — un composant, **`EnteteDevis`**, passé à la liste comme **élément stable** (`ListHeaderComponent={entete}`, jamais une fonction écrite dans le rendu : elle serait un type neuf à chaque rendu, remontée, et le champ perdrait le focus — le piège que `ClientsScreen.js:181-219` évite). Il tient son propre état et **ne remonte qu'à la fin d'une saisie** (CR-E I4). Dedans, de haut en bas :
   - **le bandeau** « Chiffrage — ce brouillon ne part pas encore. » (`PLAN:2015-2016`) — **il défile avec l'en-tête**, il n'est pas fixe (CR-E I1 : chaque point de hauteur fixe se paie sur un iPhone SE) ; sous lui `origineLisible()` et, s'il y en a un, **le budget écrit par le client** : « Budget indiqué par le client : 5 000 – 15 000 € » — **du texte, jamais dans un calcul** ;
   - **le régime**, en **trois messages distincts** (CR-E B3) : « Votre régime de TVA n'a pas pu être lu » + **Réessayer** (un échec n'est **jamais** « non déclaré ») ; « Régime de TVA non déclaré » + **Mon entreprise** (la barre « Ajouter » ne propose alors que titres et réserves) ; ou la phrase de `coherenceRegime()` + **Mon entreprise**. Le bouton ouvre « Mon entreprise » sur la section TVA (`ouvrirMonEntreprise(section)`, `OpusApp.js:2333-2337`) ; **au retour, le régime est relu** (§4.8). Pendant la lecture, rien ne s'affiche, et les postes attendent ;
   - **Pour qui ?** — la fiche choisie (nom, ville), ou « À choisir », et **deux boutons côte à côte** : « Choisir dans mon carnet » et « Nouveau client » (CR-E I5). Le premier ouvre **`ChoixClientDevis`** (§ ci-dessous) ; le second ouvre directement `FicheClient`, pré-remplie par `clientDepuisDemande()` (`src/lib/clients.js:214`) si le devis vient d'une demande. **Une seule fenêtre à la fois, jamais deux à la suite** : la v1 fermait une feuille puis en ouvrait une autre, ce que UIKit présente mal (DÉDUIT, non reproduit), et `FeuilleBas` n'a pas d'`onDismiss` (relevé). Quand on choisit un client et que **le lieu est vide**, son adresse est **proposée**, avec la phrase « Adresse du client reprise : modifiez-la si le chantier est ailleurs. » Jamais d'écrasement d'un lieu déjà tapé ;
   - **Objet** (`ChampLocal`, enregistré quand on le quitte — `onBlur` passe par `...reste`) ; **Lieu des travaux** (`ChampVille` en mode `rue`, qui remplit la rue, le code postal et la ville ; la liste montre l'adresse ENTIÈRE) — **`ChampVille` n'a pas d'`onBlur` et remonte chaque lettre** (`ChampVille.js:52-54`, `:75`, relevé) : `EnteteDevis` absorbe ces appels (il est petit, l'écran ne se redessine pas), et le lieu s'enregistre **au choix d'une suggestion**, quand on quitte le code postal ou la ville, à l'ouverture d'une carte, et à la garde de sortie. `ChampVille` **n'est pas modifié** (six écrans et `verifier-adresse` en dépendent) ; **Délai d'exécution** avec l'appui « Dans les 30 jours suivant la signature du devis » et **sa phrase** (`DELAI_PAR_DEFAUT.pourquoi`, qui dit « face à un particulier »), et l'avertissement « indicatif » si besoin.
2. **Les lignes**, **pièce par pièce**, dans l'ordre de `trierLignes()` : chaque titre de zone ou de pièce porte son **sous-total** (en `Montant`, Inter — jamais dans l'Oswald du titre, qui n'a pas de chiffres tabulaires) ; chaque poste est une rangée « désignation (sur deux lignes au moins, jamais coupée au milieu d'un nombre) — total » ; une ligne « Offert » affiche « Offert » à la place du total ; une réserve est précédée de « Réserve : ». **Chaque rangée dit son état** : rien quand elle est enregistrée ; « enregistrement… » ; **« Non enregistrée — Réessayer »** (un vrai bouton, ≥ 44 points, en `C.bad` sur la carte blanche : 5,56 : 1 ; sur le fond beige, `C.bad` ne donne que 4,37, CR-E M7) ; « Incomplète — La compléter ». **Aucun tableau, aucun défilement horizontal**. Un appui ouvre la carte de la ligne.
3. **Les options**, à part, sous le titre « Options, non comprises » : chacune avec son prix (HT et taux au régime réel, sans « HT » en franchise), **sans aucun total** (§2.4). Une option ajoutée s'y range, **en fin de devis** (CR-E M6).
4. **La barre « Ajouter »** : Poste · Pièce · Zone · Réserve · Option — des **`Pastille`** de 44 points, qui ajoutent **en fin de devis** (une option, dans les options). Ajouter au milieu se fait depuis une carte (« Poste suivant », « Ajouter un poste dans cette pièce »).
5. **La ventilation complète** — « Total HT », une ligne par taux (« TVA 10 % sur 333,30 € : 33,33 € »), « TVA », « Total TTC » ; **ou, en franchise**, « Total : … » suivi de `MENTION_FRANCHISE`, sans aucune ligne de taux. Tous les montants en **`Montant`**.
6. **Conditions** (repliée) : la retenue de garantie — un `Interrupteur`, puis le taux (`ChampMontant`, « 5 » proposé quand on l'allume, lu par `versCentiemes()`, modifiable jusqu'à 5 %), et sous lui **`PHRASE_RETENUE`**, sans aucun montant.
7. **« Supprimer ce brouillon »**, en deux appuis, le second qui le DIT (le modèle de `FicheClient.js:412-436`).

**Le pied, fixe, une seule rangée** (CR-E I1) : « Total TTC 1 234,56 € » (en franchise : « Total 1 234,56 € »), en `Montant`. **Ce qui s'affiche est la dernière valeur sûre de la base**, **suivie**, quand il y a lieu, de « · ligne en cours » ou « · 2 lignes non enregistrées » (CD:351-355 ; la v1 remplaçait le chiffre par « ligne en cours », CR-E I11). **Le pied est caché par le clavier pendant la frappe** : la règle du projet interdit un `KeyboardAvoidingView` par-dessus une liste qui porte `CLAVIER` (l'inset compterait deux fois, `clavier.js:78-92`). C'est **dit** ici, et deux choses le compensent : la liste et la carte portent **`keyboardDismissMode="on-drag"`** (glisser vers le bas referme le clavier — un pavé décimal d'iOS n'a aucune touche pour le faire, `PLAN:2493` ; relevé : `keyboardDismissMode` n'est posé nulle part dans `src/` aujourd'hui), et la carte porte le sous-total de sa pièce **en haut**. Une barre au-dessus du clavier (`InputAccessoryView`) est écartée tant que l'iPhone n'a pas montré qu'il en faut une (§1.3).

**Le budget vertical, compté** (CR-E I1, DÉDUIT du code : `TopBar.js:65-77`, `BottomNav.js:69`) : sur un iPhone SE (375 × 667), en-tête de retour 89 + barre du bas 69 + pied 44 = **202 points de chrome**, contre ≈ 280 avec le pied et le bandeau fixes de la v1. `mesure-devis` le mesure à **375 × 667** et à 320 de large (§6.1-G).

#### La carte d'une ligne (`CarteLigne`), de haut en bas

- **Sa barre, en haut, fixe** (hors du défilement, donc **toujours au-dessus du clavier**) : « ‹ Devis » (enregistre et ferme), le titre et le **sous-total de la pièce** (`Montant`), et **« Poste suivant »** (enregistre, puis ouvre un poste neuf **juste après**, dans la même pièce). Ces deux actions sont en haut **exprès** : en bas de la carte, elles seraient sous le clavier pendant qu'on tape le prix.
- **Désignation** — un composant, **`ChampDesignation`** (CR-E I3) : il garde **son** texte et **ses** suggestions (différées par `useRechercheDifferee`, `src/lib/frappe.js:43`), expose `lire()`, `ecrire()`, `focus()`, et ne remonte à l'écran que le **choix** d'une suggestion. Il porte son propre `TextInput` multiligne (le style de `TextArea`), parce que `TextArea` n'est pas une `forwardRef` et que `ChampLocal` multiligne n'a pas de `focus()` (`ChampLocal.js:90-94`) ; **et on ne passe jamais `onChangeText` à `ChampLocal`** : la propriété de l'appelant passe par `...reste` APRÈS `onChangeText={changer}` et l'écrase (`ChampLocal.js:125`, relevé) — le champ contrôlé ne se mettrait plus à jour. `autoCorrect` et `spellCheck` **actifs** (`PLAN:3137`). **`autoFocus` sur un poste neuf**. **La mémoire** sous le champ dès trois lettres, **trois suggestions au plus** (« chape → *Chape sèche avant carrelage collé* · 45,00 €/m² · *Rénovation cuisine, 12/10* » ; « · fourniture non comprise » quand c'est le cas) — sous le champ, et non au-dessus : au-dessus, la liste qui arrive ferait descendre le champ sous le doigt ; et comme la désignation est **le premier champ d'une carte qui prend l'écran**, ses suggestions sont dans la moitié haute, au-dessus du clavier (DÉDUIT, à juger sur l'iPhone). Un appui recopie la phrase, l'unité, le prix, la fourniture et la main-d'œuvre (§3.3), **puis donne la main à la quantité**.
- **Unité** — sept **`Pastille`** qui passent à la ligne (`flexWrap`) : « m² », « m linéaire », « m³ », « unité », « heure », « jour », « forfait » ; l'étiquette parlée est le **nom** (« mètre linéaire »). **Avant la quantité** (CR-E I2) : c'est l'unité qui fait apparaître les appuis de surface, et elle ne doit pas les faire surgir au-dessus de ce qu'on vient de toucher.
- **Taux** (régime réel seulement) — trois `Pastille` « 20 % », « 10 % », « 5,5 % », **rien de coché sur la première ligne**, le taux de la ligne précédente sur les suivantes. En franchise, rien.
- **Quantité et prix, côte à côte** (deux **`ChampMontant`**, chacun ≈ 140 points à 320 de large, assez pour « 99 999 999,99 ») : `keyboardType="decimal-pad"`, `autoCorrect={false}`, `spellCheck={false}`, **aucun `returnKeyType`** (un pavé décimal d'iOS n'a pas de touche retour). Sous la quantité, si la ligne est au m² sous une pièce qui en a, les deux appuis « Sol 6,2 m² » / « Murs 18,5 m² ». Les étiquettes : « Quantité » / « Prix unitaire HT » au régime réel, « Prix unitaire » en franchise (CR-E M4) ; « Temps estimé » / « Taux horaire (HT) » quand l'unité est l'heure et « Main-d'œuvre » allumé, avec `tauxHorairePropose()` sous le prix.
- **Trois `Interrupteur`** : « Main-d'œuvre » (propose l'unité « heure » si aucune n'est choisie, et le taux horaire ; aide : « À l'heure : écrivez le temps estimé dans la quantité. Un prix au m² ou au mètre est un prix forfaitaire : il convient aussi. » — CR-D B1) ; « Fourniture non comprise » ; « Offert » (**le prix reste écrit** — aide : « Le prix reste écrit : il dit ce que vous offrez. Laissez-le vide si vous ne voulez pas l'indiquer. » ; le total devient « Offert » ; éteint, le total revient, CR-E M2).
- **Les erreurs**, sous le champ fautif, **dans la carte blanche**.
- **« Monter » / « Descendre »** (deux `Pastille`, CR-E I12) — pas de glisser-déposer : il ajouterait un geste concurrent du défilement, qui ne se juge qu'au doigt.
- **« Retirer cette ligne »**, en deux appuis. Sur un **titre de pièce ou de zone**, le second appui **dit ce qui va se passer** (CR-E I12) : « Les 4 lignes de cette pièce passeront dans « Cuisine ». » (`lignesDeLaPiece()`, `titreQuiRecoit()`) — ou « … passeront en tête du devis, sans pièce. » — et propose aussi « Retirer la pièce et ses 4 lignes ».

La carte d'une **pièce** porte son titre et ses surfaces (deux `ChampMontant`), et « Ajouter un poste dans cette pièce » ; celle d'une **zone** ou d'une **réserve**, son texte seul.

#### Combien de gestes pour une ligne (CR-E I2, compté sur cette description)

| geste | premier poste, régime réel | postes suivants | avec la mémoire |
|---|---|---|---|
| ouvrir la carte | « Poste » (1) | « Poste suivant » (1) | « Poste suivant » (1) |
| désignation | tapée (le champ a déjà la main) | tapée | trois lettres, **une suggestion (1)** : phrase, unité, prix, fourniture |
| unité | 1 | 1 | — |
| taux | 1 | 0 (repris) | 0 |
| quantité | 1, tapée | 1, tapée | tapée (la main y est déjà) |
| prix | 1, tapé | 1, tapé | — |
| **total** | **5 touches, 3 saisies** | **4 touches, 3 saisies** | **2 touches, 2 saisies** |

Le plan promettait « le deuxième devis coûte trois gestes au lieu de dix » (`PLAN:2032-2034`) ; la v1 en coûtait 7 à 9, et 5 à 6 avec la mémoire. **DÉDUIT** : sur un petit écran, l'unité et le taux d'un premier poste peuvent être sous le clavier ouvert par la désignation — **un geste de plus** (glisser pour le refermer). `mesure-devis` compte les appuis de son parcours ; l'iPhone dira le reste (§7.6).

#### Quand une ligne s'enregistre (CR-E B1)

**Les déclencheurs, écrits une fois** : un champ quitté ; **une pastille ou un interrupteur changé** ; **une valeur posée par un appui** (une surface copiée, une suggestion) ; la carte fermée (« ‹ Devis », « Poste suivant », le retour d'`OpusApp`) ; **le départ de l'écran** (la garde). La v1 n'avait que le premier et le dernier : or `CLAVIER` pose `keyboardShouldPersistTaps: 'handled'` (`clavier.js:152`), donc un appui sur une pastille **ne ferme pas le clavier** et le champ ne perd pas le focus (`ScrollView.js:496-497`) — au régime réel, le taux est le dernier geste d'une ligne, et il n'aurait rien enregistré.

À chaque déclencheur : `validerLigne()` d'abord ; si elle refuse, la carte dit la phrase de la contrainte sous le champ, **aucune requête ne part**, et la ligne est `locale` ; sinon la ligne entre dans la file. **Le devis lui-même** n'est inséré qu'à la **première** écriture (un champ de l'en-tête quitté avec du texte, ou une première ligne) : ouvrir puis refermer un brouillon vide ne laisse rien. Un brouillon pré-rempli par une demande ou un client ne naît, lui aussi, qu'au premier geste — avec sa `source` et ses liens.

**Un refus de la base** : `retour.echec()` (le vibreur, `src/lib/retour.js`) ; **une ligne non enregistrée** : `retour.annoncer()` — `accessibilityLiveRegion` n'existe que sur Android, et sur iPhone un échec passerait inaperçu pour qui se sert de VoiceOver (CR-E M8).

#### La garde de sortie (CR-E B1)

On quitte l'écran par des chemins qu'il ne voit pas : le retour (`BackBar`, `OpusApp.js:3648`), la barre du bas (`onNavigate`, `OpusApp.js:4236`), la cloche, l'ouverture d'une notification, la déconnexion — et chaque changement d'écran **démonte** le bloc entier (`key={screen}`, `OpusApp.js:3708`). Un texte qui n'est que dans un champ démonté est perdu. D'où **une seule porte**, dans `OpusApp` : `quitterSaisieDevis(versEcran)`.

- L'écran y **inscrit** deux fonctions (une référence d'`OpusApp`, `gardeSortie`) : `nonEnregistrees()` et `enregistrerTout()`, qui **lit les champs ouverts par `lire()` AVANT le démontage**, les fait passer par `validerLigne()` et la file, et attend la file (8 s au plus) ;
- **carte ouverte**, le retour d'`OpusApp` **ferme la carte** (elle s'enregistre) au lieu de quitter l'écran ;
- si tout est enregistré, on part ; sinon une bande : « 2 lignes n'ont pas pu être enregistrées » — **« Rester »** / **« Quitter sans elles »** ; une ligne incomplète : « Cette ligne n'est pas complète : elle ne sera pas enregistrée » — **« La compléter »** (rouvre sa carte) / **« L'abandonner »** ;
- `onBack`, `onNavigate`, la cloche, l'ouverture d'une notification et la déconnexion **passent par elle** quand `screen === 'devisSaisie'` — `verifier-devis` le vérifie à chacun des cinq endroits (§6.1-E).

**« Tout le reste est déjà en base »**, que la v1 affirmait, n'est vrai **que si la file est vide** : le pied et la garde le disent dans le cas contraire.

#### `ChoixClientDevis` — dans **son propre fichier** (CR-E I5)

Une `FeuilleBas` : la liste du carnet **non archivé**, une **recherche locale** (le carnet en a une, `ClientsScreen.js:191`), une `FlatList` aux trois réglages avec **`keyboardShouldPersistTaps="handled"` seul** — **pas `{...CLAVIER}`** : `FeuilleBas` monte déjà avec un `KeyboardAvoidingView` (`FeuilleBas.js:76-83`), et l'inset natif en plus compterait le clavier deux fois — et `defile={false}` (`FeuilleBas.js:56-62`, une liste virtualisée ne va pas dans un `ScrollView`). **Trois états** : chargement, « Lecture impossible — Réessayer » (le carnet se charge à la demande, `OpusApp.js:3353-3356` ; une lecture ratée affichée comme une liste vide ferait recréer un client qui existe), et « Votre carnet est vide — Nouveau client » (qui ferme la feuille ; le bouton « Nouveau client » de l'en-tête fait le reste). **Pourquoi un fichier à lui** : `verifier-feuilles` juge **par fichier**, et un fichier qui contient `<FeuilleBas` **et** `{...CLAVIER}` est refusé (`scripts/verifier-feuilles.mjs:228-231`) ; aucun fichier de `src/` ne réunit les deux aujourd'hui — toutes les feuilles vivent dans leur propre composant.

#### Les règles du projet, une par une

| règle | ici |
|---|---|
| `{...CLAVIER}` sur la liste et sur le défilement de la carte, **jamais** un `KeyboardAvoidingView` par-dessus ; `keyboardShouldPersistTaps="handled"` seul dans la feuille | `src/lib/clavier.js` ; `verifier-feuilles` |
| `keyboardDismissMode="on-drag"` sur la liste et sur la carte | §4.4 (le pied) ; `verifier-devis` |
| `ChampLocal` pour l'objet, le délai, le code postal, la ville ; `ChampMontant` pour tout nombre ; `ChampDesignation` pour la désignation ; **jamais `onChangeText` passé à `ChampLocal`** | `PLAN:2497` ; CR-E I3 |
| les **trois réglages** de liste sur la `FlatList` des lignes ; séparateur déclaré au niveau du module ; gouttière dans `contentContainerStyle`, jamais de `gap` | `verifier-listes`, `verifier-fil` |
| **la clé de rangée est l'`id` de la ligne, stable de sa naissance** ; aucune justification par `removeClippedSubviews` | CR-E B2, I6 |
| `React.memo` sur la rangée, qui reçoit des **résultats** (`centimes`, `etat`, `estOuverte`, `sousTotal`), jamais des prédicats | `PLAN:2498` |
| une `key` sur l'écran, **un compteur**, qui change à chaque devis ouvert — **jamais l'`id` du devis** | `PLAN:2499` ; CR-E B2 |
| **aucun `entering`** dans un `renderItem` ; aucune animation pendant le chargement | `theme.js`, les trois interdits |
| **aucun calcul de totaux dans un `useEffect`** : le calcul est pur, hors de React | `verifier-atelier` (32 alertes, plafond 32) |
| toute cible **≥ 44 points par sa BOÎTE** (`minHeight: TOUCHE`) : `Pastille`, `Interrupteur`, les boutons de la carte, « Réessayer » ; `hitSlop` seulement par `viser()` | `verifier-cibles` ; **mesuré** par `mesure-devis` (§6.1-G), parce qu'aucune brique existante n'atteint 44 par sa boîte (`BtnMini` 36, `PillToggle` 38, `Chip` 40 — `ui.js:877-886`, `:971-974`, relevé) |
| **tout montant passe par `Montant`** (Inter, `fontVariant: ['tabular-nums']`, aligné à droite) — sous-totaux, rangées, options, pied, ventilation, mémoire, « Mes devis », « Ses devis » | `PLAN:3212` (« pour tout chiffre ») ; CR-E I11. Mesuré par CR-E dans les polices embarquées : **Inter 400, 500 et 600 portent `tnum`, Oswald 600 non** |
| **toute date passe par `dateFrancaise()` ou `depuisLisible()`** | CR-E I9 |
| les **cartes de contenu à angle vif** (`CARTE`) ; pastilles et boutons arrondis | CLAUDE.md, « Les bords » |
| le texte orange en **`C.accentTexte`**, jamais `C.accent` ; une erreur ou une réserve en `C.bad` **sur la carte blanche** | `verifier-cibles` ; CR-E M7 |
| un échec de lecture n'affiche **jamais** « Aucun devis » ni un formulaire vide ; un échec de **régime** n'affiche jamais « non déclaré » | `verifier-etats` ; CR-E B3 |
| un échec ne s'affiche jamais en vert ; chaque message dit quoi faire | `verifier-etats` |
| « Réserve : » devant une réserve, en plus de sa couleur ; « Offert » au lieu d'un montant | `PLAN:3089-3090` |
| **aucune valeur de `T`, `S`, `R` écrite à la main, ET aucun jeton qui n'existe pas, ET aucune arithmétique sur un jeton** | les cliquets `verifier-echelles` (18 / 353 / 56 / 21) ne lisent que les nombres ; `verifier-devis` vérifie le reste (CR-E I13) |

#### Les briques partagées (CR-E I7, I11)

| brique | où | ce qu'elle garantit |
|---|---|---|
| `Pastille` | `src/components/ui.js`, **nouvelle** | boîte `minHeight: TOUCHE`, `minWidth: TOUCHE`, `R.gelule`, étiquette parlée = le **nom**, `accessibilityState.selected` ; ajoutée à la liste des briques de `verifier-cibles` |
| `Interrupteur` | **sortie** de `FicheEmetteur.js:217` (où elle est locale) vers `ui.js` ; `FicheEmetteur` l'importe | une rangée de 44 ; une règle à un endroit. `verifier-emetteur` et `verifier-tarifs` rejoués |
| `Montant` | `ui.js`, **nouvelle** | la seule porte d'affichage de `montantDevis()` dans les écrans du devis |
| `ChampMontant` | `src/components/ChampMontant.js`, **nouveau** (`forwardRef`, autour de `ChampLocal`) | `decimal-pad`, `autoCorrect={false}`, `spellCheck={false}`, aucun `returnKeyType`, `lire()`/`ecrire()`/`focus()` ; **le seul endroit des écrans du devis où s'écrit `keyboardType`** |

### 4.5 La liste — `src/screens/DevisScreen.js`

- `screen === 'devis'`, ouverte par **« Mes devis »** sur « Mon profil », au même rang que « Mes clients » et « Mon entreprise » (`ProfilOwnScreen.js:339-360`), **pour un compte pro seulement** (`onDevis={canPublish ? ouvrirDevis : null}`).
- En-tête : « Mes devis », et « Nouveau devis » (≥ 44 de haut).
- **Une carte par devis** (`CarteDevis`, `React.memo`) : l'objet (ou « Sans objet »), le client (ou « Client à choisir »), `origineLisible()`, le **total** (`Montant` ; « Total TTC » au régime réel, « Total » en franchise ou si le régime n'est pas connu), « modifié il y a 2 h » (`depuisLisible()`) ; la **pastille de statut** « Brouillon », dont l'encre est choisie par **`surFond(fond)`** (`theme.js:469`).
- **Triée par `modifie_le` puis `id`, bornée à 200**, avec un **pied qui DIT la troncature** à partir de 200 : « Vos 200 devis les plus récents. Les plus anciens ne sont pas affichés. » (le modèle de `DemandesRecuesScreen.js:269-276`). **Le tri par date est honnête AU LOT 1, et seulement au lot 1** : `verifier-devis` l'exige dès que `devis_statut_check` porte plus d'une valeur.
- Les trois états : chargement, **« Lecture impossible » avec un vrai bouton « Réessayer »**, vide (« Aucun devis pour le moment » avec l'action « Nouveau devis »). Les trois réglages de liste.

### 4.6 La fiche d'un client montre ses devis — `src/components/FicheClient.js`

Le **lecteur n° 3** du plan : « le premier lecteur de `clients` qui ne soit pas son propre écran » (`PLAN:2027-2029`).

- **« Ses devis »** : une section sous les coordonnées, lue par `devisDuClient()` à l'ouverture ; au plus 20, sinon « et d'autres : voir Mes devis » ; chaque rangée (objet, `Montant`, `depuisLisible()`) **ferme la fiche puis ouvre le devis** — jamais deux fenêtres empilées. **Pas de `FlatList`** dans le `ScrollView` de la fiche : une boucle sur 20 éléments au plus.
- **« Faire un devis »**, pour une fiche existante et non archivée : ferme la fiche, ouvre la saisie avec `devisDepuisClient(fiche)`.
- **La suppression dit ce qui reste** (CR-D I5, revérifié : le devis garde `lieu_adresse`, `lieu_code_postal`, `lieu_ville` — souvent le domicile — et le texte de l'artisan) : le second appui dit « Ce client a 2 devis : ils resteront, détachés de sa fiche, avec l'adresse des travaux et ce que vous y avez écrit. Pour effacer ses données, supprimez aussi ces devis — ou archivez la fiche pour garder le lien. » — et l'archivage reste le premier bouton (`FicheClient.js:391-410`). Un échec de lecture de « Ses devis » **ne cache pas** ce risque : « Ses devis n'ont pas pu être lus : s'il en a, ils resteront, avec l'adresse des travaux. »
- **Deux jetons faux, corrigés dans le même geste** (CR-E I13, relevé) : `fontSize: T.minuscule` et `lineHeight: interligne(T.minuscule)` (`FicheClient.js:463-468`) — **`T` n'a pas de `minuscule`** (`src/theme.js:160-169`) : la taille vaut `undefined` et l'interligne `NaN` ; ils deviennent `T.micro`. Et `fontSize: T.sousTitre + 1` (`FicheClient.js:454`) devient un cran de l'échelle, choisi en le voyant (`T.sousTitre` ou `T.titre`). Le cliquet ne les voyait pas : il ne compte que les **nombres** écrits (`verifier-echelles.mjs:71`).
- `FicheClient` reçoit deux props de plus (`onFaireDevis`, `onOuvrirDevis`) ; `verifier-clients` est mis à jour (§6.2).

### 4.7 « Faire un devis » sur une demande acceptée — `src/screens/DemandesRecuesScreen.js`

- Un `BtnMini` « Faire un devis », **à côté** de « Ajouter à mes clients » (`DemandesRecuesScreen.js:444-467`), visible si `peutFaireUnDevis(d)` et si `onFaireDevis` est fourni. Deux cibles voisines, jamais imbriquées. **Un `BtnMini` comme ses voisins** (36 de boîte, 40 de visée par `viser()`) pour que la rangée reste d'une hauteur : c'est l'**exception nommée** de `mesure-devis`, et une question de l'iPhone (CR-E M9).
- **Pas sur un rappel** (TRANCHÉ ICI) : une demande de rappel n'a pas de lien d'origine dans le plan ; après un rappel, l'artisan passe par « Ajouter à mes clients », puis « Faire un devis » sur la fiche.
- **Il ne recrée pas un brouillon qui existe** (CR-E I10) : l'appui lit `devisDeLaDemande()` **à ce moment-là** (aucune requête de plus au démarrage). S'il n'y en a pas, la saisie s'ouvre. S'il y en a, la carte de la demande s'ouvre **sur place** (pas de fenêtre) : « Brouillon en cours, modifié il y a 2 h — **Reprendre** · **Nouveau devis** ». Si la lecture échoue : « Je n'ai pas pu vérifier s'il existe déjà un brouillon pour cette demande — **Réessayer** · **Nouveau devis quand même** ». Plusieurs devis pour une même demande restent permis (D4) ; on ne les crée plus **sans le savoir**.

### 4.8 `src/OpusApp.js`

**Deux écrans à brancher = huit points** (`PLAN:2501`) : `showBack` (`OpusApp.js:3615-3621`), `backTitle` (`:3623-3640`, « Mes devis », et en saisie le titre de la pièce quand une carte est ouverte), l'action du retour (`:3653-3660`, **par la garde**), et le rendu (`{screen === 'devis' && …}`, `{screen === 'devisSaisie' && …}`) — pour chacun des deux. **Plus quatre points** pour la garde : la barre du bas, la cloche, l'ouverture d'une notification, la déconnexion.

- **Les états avant les sorties anticipées** (`if (demarrage)`, `:3552` ; `if (!userType)`, `:3561`) : `devis`, `devisEtat` (`'vide' | 'chargement' | 'ok' | 'echec'`), `devisOuvert`, `cleDevis`, `origineDevis`, **`monRegime`** (`{ chargement } | { echec } | 'franchise' | 'reel' | null`) et la référence **`gardeSortie`** — le modèle exact du carnet (`:3330-3339`) et de `mesTarifs` (`:530-556`).
- **Chargés À LA DEMANDE**, à l'ouverture de « Mes devis » ou d'une saisie, jamais au démarrage. **Le régime** : lu par `monRegime()`, avec un délai et un compteur de génération, comme `mesTarifs` ; **et remonté par « Mon entreprise »** à chaque lecture et chaque enregistrement — `MonEntreprise` reçoit **`surEmetteur`**, sur le modèle de `surTarifs` (`MonEntreprise.js:88-99`), qui ne renvoyait que les tarifs (CR-E B3, relevé). Sans lui, l'artisan envoyé dans « Mon entreprise » par le bandeau y déclarerait son régime… et retrouverait le bandeau.
- **UNE seule porte pour ouvrir un devis** — `ouvrirDevis(devisOuValeurs, depuis)` —, que la liste, la fiche client et « Pour moi » appellent toutes ; **UNE seule porte pour ranger un devis** dans la liste — `rangerDevis()`, le modèle de `rangerClient` (`:3371-3377`) ; **UNE seule porte pour quitter la saisie** — `quitterSaisieDevis(versEcran)` (§4.4). **Le retour ramène d'où l'on vient** (`origineDevis` : la liste, le carnet, « Pour moi »).
- **La déconnexion** remonte `OpusApp` en entier (une `key` dans `App.js`, `verifier-sortie`) — **après** la garde : les devis d'un compte ne passent jamais au compte suivant, et rien de tapé n'est perdu sans le dire.

---

## 5. Les textes opposables — `src/data/legal.js`

**Rien n'y est inventé** : aucune clause de sous-traitance (le contrat de l'art. 28.3 n'existe pas, et `verifier-legal` refuse une mise en ligne tant que `EDITEUR.contratSousTraitance` est faux) ; aucune durée de conservation des devis (la purge à un an est une décision du 17/10, `PLAN:3371`, dont le **mécanisme** est au lot 4). Ce qui change dit **ce qui est vrai et vérifié** — **y compris ce qu'une suppression n'efface pas** (CR-D I5, I6).

| section | aujourd'hui | ce qui change |
|---|---|---|
| « Les clients que vous enregistrez » (`legal.js:880-909`) | parle du **carnet** : responsable de traitement / sous-traitant, contrat non publié, garanties de la base, la Base Adresse ; « vous pouvez l'exporter et le supprimer à tout moment » | **s'étend aux devis** (`PLAN:2515`) : « Opus vous permet de tenir un carnet de clients **et de préparer des devis** » ; un devis rattache une fiche de votre carnet, et porte souvent l'adresse du chantier, c'est-à-dire le domicile de votre client : mêmes rôles, mêmes garanties — **aucun écran d'Opus ne le montre à quelqu'un d'autre que vous** (ni à un autre artisan, ni à votre client, ni à un visiteur, ni dans l'espace d'administration), rien n'apparaît sur votre fiche publique, dans le fil ou dans une notification, l'export le rend, il part avec votre compte. **Et la vérité sur l'effacement** (CR-D I5) : « Supprimer la fiche d'un client ne supprime pas ses devis : ils restent, avec l'adresse des travaux et ce que vous y avez écrit. Pour effacer les données de ce client, supprimez aussi ses devis. » La v1 écrivait « sans son nom », qui suggérait une anonymisation qui n'a pas lieu. La phrase « le seul artisan qui y tient un carnet est l'auteur de l'application lui-même » est **relue sur la vraie base avant d'être gardée** — par la forme : le nombre de `pro_id` distincts dans `clients` (le frère peut l'avoir rendue fausse) |
| « Ce que nous collectons » (`legal.js:730-786`) | « Si vous êtes professionnel, pour vos devis : votre immatriculation, … vos tarifs » | **ajouter** : « vos devis en préparation : leur objet, le lieu et le délai des travaux, une éventuelle retenue de garantie, leurs lignes, leurs prix et leurs totaux, et le client de votre carnet auquel ils sont rattachés » |
| « Vos tarifs et vos prix » (`legal.js:617-642`) | « les autres prix que vous enregistrez pour vos devis, ne sont montrés à personne d'autre que vous par aucun écran d'Opus … ni dans l'espace d'administration » ; l'engagement de l'éditeur | **inchangé dans sa promesse** — elle couvre déjà les prix des lignes. Ce qui change, c'est qu'elle devient **vérifiable** : les trois tables entrent dans la surveillance de `verifier-legal` (§6.2) |
| « À qui vos données sont transmises » (`legal.js:911-943`) | la Base Adresse « chaque fois qu'un champ de lieu vous propose des suggestions : seul le texte que vous êtes en train de taper y est envoyé » | **relue, inchangée** : le lieu des travaux passe par le même `ChampVille`. Aucun destinataire nouveau |
| « Combien de temps » (`legal.js:945-980`) | « Vos données sont conservées tant que votre compte existe. À sa suppression, elles sont effacées immédiatement, **à trois exceptions près** » (`legal.js:952-956`, relevé) | **deux changements.** (1) Pour l'artisan : « Vos devis en préparation sont conservés tant que vous ne les supprimez pas, et partent avec votre compte. » (2) **Pour le particulier** (CR-D I6) : le texte d'une demande est recopié dans `devis.objet` (`titre` = `quote_requests.description`, `schema:4207`, relevé) et **survit à la suppression de son compte** — c'est voulu (D3, l'essai 23 l'exige), et c'était déjà vrai depuis le carnet de la section 41 (nom, téléphone, commune). La phrase devient : « … elles sont effacées immédiatement, **sauf ce qui suit** : … ; **ce que vous avez écrit à un artisan dans une demande, et qu'il a repris dans son carnet de clients ou dans un devis, relève de lui : la suppression de votre compte ne l'efface pas de ses documents — pour cela, adressez-vous à lui.** » Le mot « trois » disparaît : une énumération qui annonce son nombre se trompe le jour où elle s'allonge |
| « Vos droits » (`legal.js:982-997`) | l'export rend « tout ce que nous avons » | inchangé : il rend désormais les devis |
| `VERSION` (`legal.js:32`) | `'2026-10-20'` | **la date du lot**. Rien ne fait ré-accepter les comptes existants : le mécanisme de ré-acceptation reste à construire **avant** que `STATUT` quitte `'essai'` (`docs/A-FAIRE.md`, « Après le lot T ») |

`verifier-legal` (partie texte) tient les **propriétés** : « Les clients que vous enregistrez » nomme les devis et ne contient ni « sans son nom » ni « sans nom de client » ; « Combien de temps » ne contient plus « trois exceptions », et dit que ce qu'un artisan a repris d'une demande relève de lui ; aucune durée de conservation d'un devis n'est promise.

---

## 6. Les contrôles

Tous **retirent les commentaires d'abord** (`--`, `/* */`, `//`, `{/* */}` — et le lecteur SQL de `verifier-legal.mjs`, qui respecte les chaînes et les `E'…'`), visent des **PROPRIÉTÉS** et non une syntaxe, un rang ou une place, lisent le schéma **par section et par fonction**, et s'éprouvent **en cassant ce qu'ils surveillent — en vérifiant d'abord que le sabotage a bien été posé**. **Et tout contrôle nouveau qui lit le schéma existant est d'abord lancé sur le schéma d'AUJOURD'HUI** : la v1 en contenait deux qui auraient rougi sur du code juste (CR-B B1, B2 — `emetteur_incomplet` contient déjà le mot `source` ; le mot « devis » est dans les chaînes de cinq fonctions).

### 6.1 Nouveau : `npm run verifier-devis` (`scripts/verifier-devis.mjs`)

Une ligne dans `package.json` ; `npm run verifier` le découvre seul (`scripts/verifier.mjs:45-95`) et lit son **code de sortie**. Il importe `src/lib/devis.js`, `centimes.js`, `emetteur.js`, `entreprise.js`, `erreurs.js`, `file-ecriture.js`, `identifiant.js`, `src/theme.js` (qui n'importe rien, relevé), `src/data/devis-demo.js`, et lit `supabase/cas-devis.json` : **s'il plante, c'est un échec**.

**A. Ce qu'il FAIT TOURNER**
1. **tous les cas de `supabase/cas-devis.json`**, en JavaScript, comparés aux attendus octet pour octet ; **le nombre de cas est écrit en dur** (44, ceux du §3.5) : un fichier vidé ne passe pas au vert ;
2. **au moins un cas tombe exactement sur chaque borne** (`QUANTITE_MAX`, `PRIX_MAX`, `PLAFOND`, et `PLAFOND + 1` atteint par arrondi) : vérifié en relisant les cas ;
3. `versMilliemes`, `versCentiemes`, `milliemesLisibles`, `tauxLisible` (dont `tauxLisible(0) === null`), `montantDevis` (U+00A0 avant « € » et entre les milliers), `diviserArrondi` sur des négatifs (`null`) ;
4. `memoireDesLignes` : 50 € et 70 € → deux entrées, **aucune ne vaut 60 €** ; même phrase au m² et au forfait → deux entrées ; **avec et sans fourniture → deux entrées** ; une suggestion **recopie** la fourniture et la main-d'œuvre, **jamais** « Offert » ni la quantité ; la ligne en cours n'y est pas ; un titre ou une réserve n'y est jamais ;
5. `trierLignes` et `sousTotaux` (**deux lignes au même `ordre` se rangent par `id`, et le résultat ne dépend pas de l'ordre du tableau d'entrée**), `lignesDeLaPiece`, `titreQuiRecoit`, `devisDepuisClient` (le lieu est **copié**), `devisDepuisDemande` (trois genres ; **ni `clientId` ni lieu**), `peutFaireUnDevis` (cinq statuts, deux orthographes), **`coherenceRegime`, `tauxProposes`, `tauxHorairePropose` sur les cinq états** — `echec` et `chargement` ne rendent **jamais** une phrase contenant « non déclaré » ni « pas déclaré » (CR-E B3) —, `avertissementDelai` ; **`DELAI_PAR_DEFAUT.pourquoi` contient « particulier », « sans retard injustifié » et « conclusion du contrat »** (CR-D I1) ; **toute phrase du module qui contient « un an » contient « opposition »**, et `PHRASE_RETENUE` nomme « société de caution mutuelle » (CR-D B2) ; `MENTION_FRANCHISE` est exactement le texte attendu ;
6. **`validerLigne` nomme la même contrainte que la base** : pour chaque cas `REFUS:` du jeu commun, exactement ce nom ;
7. **la démonstration** : `totauxDevis()` sur chaque devis de `devis-demo.js` donne un total **non nul, à deux taux**, une option, un « Offert » **avec sa valeur** ; la mémoire de démonstration, sur « chape », rend **trois** entrées (deux prix, et la variante sans fourniture) ; aucun total n'est écrit dans le fichier de données ; les `proId` y sont comparés par `String()` ;
8. **`centimes.js` est la seule écriture** : `emetteur.versCentimes === centimes.versCentimes`, idem pour `centimesLisibles` ; `devis.montantDevis === centimes.centimesLisibles` ; `devis.js` importe **exactement** `./centimes.js` et `./entreprise.js` (`dateFrancaise`, `isoLisible`) ;
9. **les dates, dans trois fuseaux** (CR-E I9) : `depuisLisible`, `origineLisible` et les dates de la mémoire, lancées dans des processus enfants à l'heure de Paris (été et hiver), des Antilles et de Kiritimati, **sur les deux bords de minuit** — le modèle des vérifications 49 et 49 bis de `verifier-tarifs` (`scripts/verifier-tarifs.mjs:1556-1577`) ; aucun horodatage n'atteint `Date.parse` sans être passé par `isoLisible()` ;
10. **la file d'écriture** (`file-ecriture.js`), avec de fausses écritures (CR-E B1, B2) : deux enregistrements rapprochés d'une ligne neuve → **une** insertion, puis **une** modification ; un devis neuf et deux lignes envoyés ensemble → l'ordre devis, ligne, ligne ; deux modifications de la même ligne en attente → une seule part, avec la dernière valeur ; **une réponse en retard n'est pas affichée** (la génération) ; un délai dépassé, puis la même insertion renvoyée qui rend `23505` → relue, « enregistrée », **jamais un doublon ni un message** ; un `40P01` → **une** reprise, puis `echec` ; **jamais d'`upsert`** ; `enAttente()` juste à chaque étape ;
11. **l'identifiant** : `nouvelIdentifiant()` rend un UUID v4 bien formé quand `crypto.randomUUID` existe, et **`null`** (jamais un identifiant bricolé) quand ni lui ni `expo.uuidv4` n'existent (processus enfant sans eux).

**B. Le schéma** (texte sans commentaires, section 49 et `mes_donnees()`)
12. **la liste FERMÉE des colonnes** des trois tables, exacte (§2.2-2.4) — une colonne de plus, ou de moins, rougit, avec la phrase « une colonne naît avec son lecteur : ajoutez-le à la liste et à la table "qui lit" du cahier » ;
13. **les colonnes interdites** : `compte_id`, `particulier_id`, `demande_id`, `visite_id`, `dossier_id`, `nature`, `date_redaction`, `taux_justification`, `regime_tva`, et **aucune colonne `numeric`** dans les trois tables ;
14. **D4-a** : les seules clés étrangères `not null` sont `devis.pro_id`, `devis_lignes.devis_id`, `devis_tva.devis_id` ; les trois liens sont `on delete set null` ; **D4-b** : aucune contrainte `check` de la section ne nomme `client_id`, `quote_request_id` ni `sos_request_id`, et `tient_le_devis()` ne lève rien quand un lien est `null` ; **D4-c, corrigé** (CR-B B1) : **les fonctions de motifs, NOMMÉES** (`emetteur_incomplet` aujourd'hui, `motifs_refus_remise` demain — une liste dans le contrôle, pas une sélection par type de retour, qui ramasse aussi `admin_traiter_demande_pro`, `devenir_pro`, `rattacher_mon_siret`), **ne nomment pas `public.devis`**, ni `quote_request_id`, ni `sos_request_id`, ni les littéraux `'qr'`, `'visite'`, `'dossier'` — **la colonne du devis, pas le mot** : `emetteur_incomplet` lit déjà `r.source` (`entreprise_registre`, `schema:10433`), et c'est juste. **Ce point est lancé sur le schéma d'aujourd'hui AVANT d'écrire la section 49, et doit y passer** ; et **aucun index unique** ne porte `pro_id` avec `client_id`, `quote_request_id` ou `lieu_*` ;
15. **toutes les contraintes de la section finissent par `_check`**, aucune en `_check\d+`, leur nombre est **23**, et **chacune a sa phrase** dans `MESSAGES_CONTRAINTE` — et réciproquement ;
16. **`CONTRAINTES_LIGNE` est triée** et égale aux **dix** noms de `devis_lignes` relevés dans le schéma ;
17. **les miroirs** : `TAUX_TVA` = les deux contraintes de taux ; `UNITES` = `devis_ligne_unite_check`, et **aucun libellé n'est « ml » ni « M2 »** ; `TYPES_LIGNE` ; `SOURCES` (ni `qr`, ni `visite`, ni `dossier`) ; les bornes égales aux constantes ; **`LIGNES_MAX` égale au nombre écrit dans `tient_la_ligne_de_devis()`** ; **`BLANCS` égale à la classe des deux déclencheurs de la section 49, à celle de la section 47 et à `BLANCS_TARIFS`** (CR-B M2) ;
18. **les formules** : `devis_total_ligne` contient `+ 500) / 1000` et `devis_tva_de` `+ 5000) / 10000` ; aucune fonction de la section ne contient `round(`, `numeric`, `float`, `double precision` ; `devis_ligne_total_check` contient `case when offert then 0` ; **les deux contraintes d'égalité commencent par `… is not null and`** (CR-B M1) ; **aucune contrainte ne nomme `main_oeuvre` avec `unite`** (CR-D B1) ;
19. **le statut et le tri** : `devis_statut_check` porte **une** valeur ; si un jour il en porte plus d'une, `mesDevis()` ne doit plus trier par `modifie_le` seule — refus, avec la phrase « la borne de 200 n'est honnête qu'avec le tri : ce qui attend doit passer devant, côté base » ;
20. **les politiques** : exactement une sur `devis`, une sur `devis_lignes`, une sur `devis_tva` (`for select`), aucune `to anon`, `to public`, ni sans rôle ; aucune ne contient `auth.uid()` écrit à la main, `est_masque`, `est_admin`, ni une table de partage ou de relation (D6) ; `revoke all on … from anon` pour les trois ; `revoke insert, update, delete on public.devis_tva from authenticated` ;
21. **les fonctions et les déclencheurs** : `recalcule_devis` et `recalcule_apres_ligne_de_devis` sont `security definer`, les autres `invoker` ; `recalcule_devis(uuid)` a son `revoke … from public, anon, authenticated` **juste après elle** ; **son seul appelant** est `recalcule_apres_ligne_de_devis` ; `recalcule_devis` contient **`for no key update`** avant sa première lecture de `devis_lignes`, **et aucun `for update` qui ne soit pas précédé de `no key`** (CR-B I1) ; aucun ordre de la section ne commence par `delete` ni `drop` hors des formes de `schema.sql`, et le corps des fonctions n'en contient **aucun** ; `tient_le_devis` ne contient pas `auth.uid()` ; **les trois déclencheurs existent sous leurs trois noms** (`trg_tient_le_devis`, `trg_tient_la_ligne_de_devis`, `trg_recalcule_devis`), en `create or replace trigger` (CR-B M6) ;
22. **qui nomme les tables** (CR-B B2) : la liste FERMÉE des fonctions dont le corps nomme `public\.devis(_lignes|_tva)?\b` — **`tient_le_devis`, `tient_la_ligne_de_devis`, `recalcule_devis`, `mes_donnees`** — ; **aucune référence non qualifiée** (`\b(from|join|into|update|table)\s+devis(_lignes|_tva)?\b`) dans tout `schema.sql` ; **aucune fonction `admin_*`** parmi elles (`PLAN:3156`) ;
23. **la place** : la section 49 commence après la fin de la 48 et avant l'en-tête de la 42 ; `mes_donnees()` reste la dernière fonction ; le balayage reste le dernier bloc ;
24. **l'export** : `mes_donnees()` contient `devis_emis`, `devis_lignes`, `devis_tva`, **`demandes_de_devis`**, et **ni `'devis'` ni `'demandes_de_devis_recues'`** (CR-B I5) ;
25. **les noms pris** : aucun `create index … idx_devis_pro`, aucune politique `"lecture mes devis"` créée **sur `devis`**.

**C. L'essai**
26. `supabase/essais-section-49.sql` existe, a un **cas 0**, annonce ses refus attendus **par leur nom**, **ne contient aucun `set local role` dans un bloc `do`**, compte les lignes autour de chaque `delete`, lit `supabase/cas-devis.json` (cas 30), contient les cas 14 bis, 14 ter, 14 quater, 16 bis et 31 ; `supabase/essais-section-49-temoin.sql` existe, et **le nom `S_attente` n'apparaît pas dans `schema.sql`**.

**D. L'API**
27. dans `api.js`, toute fonction `devis*` est déclarée **après** `const noop` ; chaque export a ses deux fonctions **nommées** et le choix à la fin ; `mesDevis` a son `limit(201)` ; `devisVersBase()` et `ligneVersBase()` n'envoient que la liste fermée (l'`id` et `source` **à la création seulement**, jamais `total_*`, `created_at`, `modifie_le`, `statut`) ; **aucun `.upsert(` sur les trois tables** (CR-B I3) ; **aucune écriture sur `devis` ou `devis_lignes` hors de la file** (`file-ecriture.js`) ; la file passe chaque écriture par `avecDelai` ; **`memoireDesLignes` contient `!inner` et `.eq('devis.pro_id'`** (CR-B I4) ; **toute lecture de `devis_lignes` est triée par `ordre` puis `id`** (CR-B I7) ; la démonstration refuse **avec les mots de la base** ; **aucune fonction SQL nouvelle ne lit `emetteur` ni `tarifs_pro`**.

**E. Les écrans** (`SaisieDevisScreen`, `CarteLigne`, `EnteteDevis`, `ChampDesignation`, `ChoixClientDevis`, `DevisScreen`, `ChampMontant`)
28. le texte « Chiffrage — ce brouillon ne part pas encore. » ; `autoCorrect` et `spellCheck` **vrais** dans `ChampDesignation`, **faux** dans `ChampMontant` ; **`keyboardType=` n'apparaît que dans `ChampMontant`**, qui ne porte aucun `returnKeyType` ; aucun `horizontal` ; `{...CLAVIER}` et `keyboardDismissMode="on-drag"` sur la liste et sur la carte ; aucun `KeyboardAvoidingView` ; **aucun `onChangeText` passé à `ChampLocal`** (CR-E I3) ; aucun `useEffect` qui appelle `totauxDevis` ; aucun `libellePrix(` ; aucune chaîne « 0 % » ni « TVA 0 » ; **la mention de franchise vient de `MENTION_FRANCHISE`, jamais écrite en dur** (CR-D M6) ; « Options, non comprises » présent ; **aucune somme de deux totaux** (`ht`, `tva`, `ttc`, `total`) hors de `totauxDevis()` — **mais aucune interdiction de la phrase « avec cette option »** (CR-D I2) ; **`montantDevis(` et `centimesLisibles(` ne sont appelés que dans `Montant`** (CR-E I11) ; **aucune date lue par `.slice(0, 10)` ou `.substring(0, 10)`** — `dateFrancaise()` ou `depuisLisible()` (CR-E I9) ; **les unités, les taux et la barre « Ajouter » sont des `Pastille`** ; **la branche d'échec du régime ne contient pas « non déclaré »** (CR-E B3) ; **`onBack`, `onNavigate`, la cloche, l'ouverture d'une notification et la déconnexion passent par `quitterSaisieDevis` quand l'écran est la saisie** — cinq endroits d'`OpusApp.js`, relevés un par un (CR-E B1) ; `MonEntreprise` reçoit et appelle `surEmetteur` ;
29. dans `DevisScreen.js` : la pastille passe par `surFond(` ; le pied de troncature compare à `PLAFOND_LISTE` ; « Lecture impossible » est un état à part, avec un bouton ; **jamais « Aucun devis » dans la branche d'échec** ;
30. dans `FicheClient.js` : « Ses devis » existe ; la phrase de suppression contient « adresse des travaux » et **ne contient pas « sans nom de client »** (CR-D I5) ; dans `DemandesRecuesScreen.js` : « Faire un devis » n'apparaît que par `peutFaireUnDevis(`, et l'appui appelle `devisDeLaDemande(` avant d'ouvrir la saisie ; « Reprendre » existe (CR-E I10) ; `ChoixClientDevis.js` contient `<FeuilleBas` et **pas** `{...CLAVIER}` ;
31. **les jetons de thème** (CR-E I13) : dans les fichiers du module **et dans `FicheClient.js`**, tout `T.x`, `S.x`, `R.x` désigne une clé **qui existe** dans `src/theme.js` (importé : il n'importe rien), et **aucune arithmétique sur un jeton** (`T.sousTitre + 1`) ;
32. **dans tout le module** (`devis.js`, `centimes.js`, `file-ecriture.js`, les écrans du devis, la section 49) : aucune forme accordée `acceptee` ni `refusee` hors des **lectures** de `sos_requests` (D9) ; aucun mot « moyenne », « médiane », `avg(`, `Math.min(` / `Math.max(` appliqué à des prix dans `memoireDesLignes`.

**F. Qui lit, qui écrit — dans les deux sens** (`PLAN:1760-1763`, `PLAN:2505`)
33. **pour chaque colonne de la liste fermée**, un **écrivain** (`devisVersBase()`/`ligneVersBase()`, ou un déclencheur de la section) **et un lecteur** (son nom en *camelCase* dans `devis.js` ou dans un écran du devis, hors du simple passage d'`api.js`) — une colonne écrite sans lecteur, ou lue sans écrivain, rougit avec son nom ;
34. **chaque table écrite est relue** : `devis`, `devis_lignes`, `devis_tva` ont chacune au moins une lecture dans `api.js`.

**G. `npm run mesure-devis` (`scripts/mesure-devis.mjs`) — au navigateur, à la main** (CR-E I7)

`verifier-cibles` ne mesure aucun écran : il vérifie la palette, la hauteur **déclarée** de sept briques et les `hitSlop` (`scripts/verifier-cibles.mjs:185-205`) ; son en-tête renvoie les tailles à `mesure-cibles.mjs` — **qui n'existe pas dans `scripts/`** (relevé). Les « boîtes mesurées » des lots précédents l'ont été à la main, dans le dossier de travail : le lot 2 retouchera cet écran, la mesure doit pouvoir se rejouer. D'où un script **commité**, sur le modèle de `gestes-tactiles.mjs` (qui sort en code 1, `:183-186`), **hors de `npm run verifier`** parce qu'il lui faut `npx expo start --web` : en démonstration, il ouvre « Mes devis », un devis, une carte, et
- relève la **boîte réelle** de chaque élément appuyable : **≥ 44 points**, sauf une liste d'exceptions **nommées** (le `BtnMini` « Faire un devis » de « Pour moi », §4.7) ;
- vérifie l'absence de défilement horizontal à **320** de large, et relève le budget vertical à **375 × 667** (le chrome fixe ≤ 202 points, §4.4) ;
- lit `font-variant-numeric` **calculé** sur chaque montant (`tabular-nums`) ;
- vérifie que **la position de la liste est la même** avant l'ouverture d'une carte et après sa fermeture (§4.4) ;
- compte les appuis de son parcours « deuxième chape » (≤ 2 avec la mémoire, §4.4) ;
- déclenche la garde de sortie par la barre du bas, avec une carte incomplète : la bande apparaît, l'écran ne part pas.

### 6.2 Les contrôles existants à mettre à jour, et pourquoi

| contrôle | ce qui change | pourquoi |
|---|---|---|
| `verifier-legal` (`verifier-legal.mjs:698-771`) | une **troisième** entrée dans `LISTES` : les tables `public\.devis(_lignes\|_tva)?\b` — **sous leur nom qualifié**, jamais `\bdevis\b`, que le lecteur SQL trouverait dans les **chaînes** de `notifie_demande`, `mes_demandes_recues`, `emetteur_incomplet` (il garde les chaînes exprès, `:718-720` ; CR-B B2) — avec ses fonctions permises (`tient_le_devis`, `tient_la_ligne_de_devis`, `recalcule_devis`, `mes_donnees`) ; **la règle « aucune `security definer` » devient « aucune `security definer` exécutable par un client »** : une fonction `definer` qui nomme une table de prix doit avoir, **juste après elle**, son `revoke … from public, anon, authenticated` — **sans exemption pour les fonctions de déclencheur** (CR-B M3) | la promesse « Vos tarifs et vos prix » couvre les prix des lignes ; la faille du 18/10 était une `definer` **accordée à `anon`** |
| `verifier-legal` (partie texte) | §5 : les devis nommés, « sans nom de client » refusé, « trois exceptions » refusé, ce qui relève de l'artisan dit | CR-D I5, I6 |
| `verifier-portes` | relève seul `devis_total_ligne` et `devis_tva_de` comme gardiennes ; le cas 4 de `essais-section-43.sql` les nomme ; le commentaire de la section 43 passe de cinq à sept | §2.10 |
| `verifier-clients` | `FicheClient` gagne deux props, une section et une phrase ; le commentaire de la section 41.2 change | §2.10, §4.6 |
| `verifier-listes` (`:58-66`, `:85-95`) | la liste des devis et la liste des lignes entrent dans `LISTES` ; `CarteDevis` et la rangée de ligne dans les composants mémorisés | sinon elles échappent au contrôle |
| `verifier-fil` | les nouvelles `FlatList` (devis, lignes, carnet de la feuille) déclarent leur séparateur au niveau du module, sans `gap` | il couvre déjà « toutes les listes du projet » |
| `verifier-cibles` | **`Pastille` entre dans sa liste de briques** (hauteur déclarée `TOUCHE`) ; `Interrupteur`, sorti dans `ui.js`, aussi | CR-E I7 |
| `verifier-emetteur`, `verifier-tarifs` | **rien à écrire, tout à rejouer** : `versCentimes` déménage, `Interrupteur` sort de `FicheEmetteur` | ils prouvent que les deux déménagements n'ont rien cassé |
| `verifier-feuilles`, `verifier-imports`, `verifier-acces`, `verifier-etats`, `verifier-sortie`, `verifier-demandes` | **rien à écrire** : ils lisent tout fichier neuf — ils doivent passer au vert sur le code du lot (`ChoixClientDevis` dans son propre fichier, `identifiant.js` et `file-ecriture.js` sans import de paquet) | |
| `verifier-typographie` | **rien** : il n'a **aucune règle de police** — il fait tourner `nettoyerTypographie()` (`scripts/verifier-typographie.mjs:1-6`, relevé). La précaution de la v1 était sans objet (CR-E I11) | |
| `verifier-notifications` | rien : le lot 1 ne crée **aucune** notification | `PLAN:2421` |
| les **cliquets** | `verifier-echelles` à **18 / 353 / 56 / 21** et `verifier-atelier` à **32** : **aucun ne peut monter** ; tout par `T`, `S`, `R`, `interligne()`, `TOUCHE`, `viser()`. **Corriger `T.minuscule` et `T.sousTitre + 1` ne change aucun compteur** (ils ne comptent que les nombres) : c'est `verifier-devis` (31) qui les tient | `PLAN:2488` |

### 6.3 Ce que les contrôles ne peuvent pas dire

- **Ils ne jouent aucun SQL** : la moitié PostgreSQL des cas d'argent se joue dans `essais-section-49.sql` (cas 30), à la main. C'est écrit dans l'en-tête de `verifier-devis`.
- **Ils lisent le texte** : qu'une fonction de déclencheur soit réellement inaccessible, que les politiques filtrent réellement, que les déclencheurs partent dans l'ordre annoncé — c'est l'essai (cas 12, 13, 26, 27, 28, 31).
- **`mesure-devis` mesure un navigateur**, pas un iPhone : il ne voit ni le clavier, ni le pouce, ni les chiffres tabulaires d'iOS.

### 6.4 Les sabotages à faire subir

Chacun posé sur une copie, **le sabotage relu pour vérifier qu'il est bien posé**, le contrôle relancé, **refusé par la vérification visée** (pas par une autre), puis l'état restauré.

| # | sabotage | refusé par |
|---|---|---|
| 1 | `diviserArrondi` arrondit le demi au pair | A-1 (C02, C02b, C03, C11) |
| 2 | `ventilationParTaux` arrondit la TVA ligne par ligne | A-1 (C01, C06) |
| 3 | le plafond devient `PLAFOND + 1` dans `validerLigne` | A-1 (C07g), A-2 |
| 4 | `valeurLigne` calcule en euros | A-1 (C03) |
| 5 | l'option entre dans le total | A-1 (C05) |
| 6 | `totalLigne` ignore « Offert » | A-1 (C09c) |
| 7 | « Offert » remet le prix à 0 (la forme v1) | A-1 (C09d) |
| 8 | `CONTRAINTES_LIGNE` dans l'ordre de création | A-6 (C16), B-16 |
| 9 | `tauxLisible(0)` rend « 0 % » | A-3 |
| 10 | `memoireDesLignes` rend la moyenne de deux prix ; groupe sans la fourniture | A-4 (×2), E-32 |
| 11 | `devisDepuisDemande` recopie le client ou la ville | A-5 |
| 12 | `tauxHorairePropose` convertit le TTC en HT ; dit « pas déclaré » sur `{ echec }` | A-5 (×2) |
| 13 | `tauxProposes({ echec })` rend `[]` | A-5 |
| 14 | `DELAI_PAR_DEFAUT.pourquoi` perd « particulier » ; `PHRASE_RETENUE` perd « opposition » | A-5 (×2) |
| 15 | `trierLignes` sans le second critère | A-5 |
| 16 | `depuisLisible` lit `iso.slice(0, 10)` | A-9 (aux Antilles, avant minuit) |
| 17 | la file : `upsert` au lieu d'insertion puis modification ; deux insertions pour deux enregistrements rapprochés ; plus de génération ; `23505` affiché | A-10 (×4) |
| 18 | `nouvelIdentifiant` bricole un identifiant par `Math.random` quand rien n'existe | A-11 |
| 19 | `montantDevis` réécrit dans `devis.js` | A-8 |
| 20 | une colonne `compte_id` ; une colonne `prix_unitaire numeric(10,2)` | B-12, B-13 (×2) |
| 21 | `client_id … on delete restrict` ; `quote_request_id uuid not null` | B-14 (×2) |
| 22 | une contrainte `devis_origine_check` ; un index unique `(pro_id, client_id)` | B-14 (×2) |
| 23 | `emetteur_incomplet` reçoit un motif qui lit `public.devis` ; un motif qui nomme `quote_request_id` | B-14 (D4-c, ×2) — **et le même contrôle, sur le schéma d'aujourd'hui, PASSE** |
| 24 | une contrainte anonyme | B-15 |
| 25 | une phrase retirée de `MESSAGES_CONTRAINTE` ; une phrase sous un nom inexistant | B-15 (×2) |
| 26 | `1960` dans la seule contrainte de ligne ; l'unité `ml` ; `'qr'` dans `source` ; `LIGNES_MAX` à 5 000 dans le déclencheur seul ; un caractère retiré d'une des copies de la classe de blancs | B-17 (×5) |
| 27 | `devis_tva_de` en millièmes ; `round(` dans `devis_total_ligne` ; `is not null and` retiré d'une égalité ; une contrainte `main_oeuvre ⇒ unite in (…)` remise | B-18 (×4) |
| 28 | `devis_statut_check` à deux valeurs, le tri inchangé | B-19 |
| 29 | une politique `to anon` ; `auth.uid() = pro_id` dans une **seule** clause ; une politique d'écriture sur `devis_tva` ; le `revoke all … from anon` retiré | B-20 (×4) |
| 30 | le `revoke` de `recalcule_devis` retiré, ou `… from public, anon` seulement | B-21 (×2), **et l'essai, cas 26** |
| 31 | `for no key update` remplacé par `for update` | B-21, **et la concurrence, passage 3** |
| 32 | le verrou retiré | B-21, **et la concurrence, passage 1** |
| 33 | un `delete from public.devis_tva` dans le recalcul ; `tient_le_devis` lit `auth.uid()` ; un déclencheur sous un autre nom | B-21 (×3) |
| 34 | une fonction `admin_devis_de(p uuid)` qui lit `public.devis` | B-22, `verifier-legal` |
| 35 | une fonction `definer` nommée autrement, qui lit `public.devis_lignes`, accordée à `authenticated` | `verifier-legal` (C16), B-22 |
| 36 | **une fonction de déclencheur `definer`** qui nomme `public.devis_lignes`, sans `revoke` après elle | `verifier-legal` — **plus d'exemption** (CR-B M3) |
| 37 | une fonction qui lit `from devis_lignes`, sans `public.` | B-22 |
| 38 | la section 49 placée après la 42 | B-23 |
| 39 | la clé `'devis'` gardée ; renommée `'demandes_de_devis_recues'` ; `'devis_tva'` retirée | B-24 (×3) |
| 40 | `create index if not exists idx_devis_pro on public.devis …` | B-25 |
| 41 | un `set local role` glissé dans un bloc `do` de l'essai ; `S_attente` recopié dans `schema.sql` | C-26 (×2) |
| 42 | `mesDevis` au-dessus de `const noop` ; `devisVersBase` envoie `total_ht_centimes` | D-27 (×2) |
| 43 | `.upsert(` sur `devis_lignes` ; une insertion de ligne hors de la file ; `memoireDesLignes` sans `!inner` ; `order('ordre')` sans `order('id')` | D-27 (×4) |
| 44 | `returnKeyType="next"` dans `ChampMontant` ; `keyboardType` écrit dans `CarteLigne` | E-28 (×2) |
| 45 | `autoCorrect` vrai dans `ChampMontant` ; faux dans `ChampDesignation` | E-28 (×2) |
| 46 | un `KeyboardAvoidingView` autour de la liste ; `onChangeText` passé à `ChampLocal` | E-28 (×2), et `verifier-feuilles` pour le premier |
| 47 | un `useEffect(() => setTotaux(totauxDevis(lignes)), [lignes])` | E-28, et `verifier-atelier` |
| 48 | « TVA 0 % » en franchise ; la mention de franchise écrite en dur ; `ht + tva` calculé dans l'écran | E-28 (×3) |
| 49 | `montantDevis(` appelé dans `CarteLigne` ; une date lue par `.slice(0, 10)` | E-28 (×2) |
| 50 | `onNavigate` ne passe plus par la garde ; la déconnexion non plus | E-28 (×2) |
| 51 | la branche d'échec du régime dit « non déclaré » ; `surEmetteur` jamais appelé | E-28 (×2) |
| 52 | la `FeuilleBas` de « Pour qui ? » écrite dans `SaisieDevisScreen.js`, à côté de `{...CLAVIER}` | **`verifier-feuilles`** — la raison pour laquelle elle a son fichier |
| 53 | la pastille en `color: '#fff'` à la main ; « Aucun devis » dans la branche d'échec | E-29 (×2), et `verifier-cibles`, `verifier-etats` |
| 54 | « Faire un devis » affiché sur un rappel ; ouvert sans lire `devisDeLaDemande` ; « sans nom de client » remis dans `FicheClient` | E-30 (×3) |
| 55 | `T.minuscule` laissé dans `FicheClient` ; `T.sousTitre + 1` | E-31 (×2) |
| 56 | `acceptee` écrit dans `devis.js` | E-32 |
| 57 | une colonne `ma_note text` ajoutée à `devis` **et** à la liste fermée, sans lecteur | F-33 |
| 58 | `mesDevis` supprimée (la table n'est plus relue) | F-34 |
| 59 | « sans son nom » dans `legal.js` ; « à trois exceptions près » gardé | `verifier-legal` (×2) |
| 60 | une `Pastille` ramenée à 38 de haut | `mesure-devis` (code de sortie 1) |
| 61 | un commentaire `-- 'devis',` laissé dans `mes_donnees()` ; un commentaire `-- public.devis_lignes` dans un corps de fonction | **doivent PASSER** : un contrôle qui accuse la documentation est faux |

---

## 7. Le protocole de vérification

### 7.1 Sur un PostgreSQL 16 neuf

1. Une base neuve (`createdb`), `local-prelude.sql`, puis `schema.sql` **deux fois** : aucune erreur aux deux passages (`ON_ERROR_STOP=1`).
2. `essais-section-49.sql` : **les cas lus un par un** — chaque refus attendu nomme **la bonne contrainte, le bon code `OP` ou le bon droit** ; le cas 0 rend bien la donnée ; le cas 30 rend `écarts : 0`.
3. **La concurrence, quatre passages** (§2.12), avec `essais-section-49-temoin.sql` pour les passages 3 et 4 : chacun rend ce qui est attendu, **y compris les deux sabotages** (une ligne perdue ; un `40P01`).
4. **Les 24 autres fichiers d'essais** rejoués et comparés au relevé « avant » (§2.13).
5. **Mesuré au passage** : le temps de 200 lignes insérées une à une (le prototype : 213,5 ms) ; le temps de 500 lignes (le cas 16 bis) ; **la mémoire sur 200 000 lignes d'un autre artisan**, sous la forme `!inner` (§4.2 ; le prototype : 2,9 ms) — **et la forme de la v1, pour mémoire** (306 ms).

### 7.2 Les contrôles, le linter, les paquets

6. `npm run verifier` en entier — **les codes de sortie** ; 50 contrôles (49 aujourd'hui, plus `verifier-devis`).
7. `npm run lint` : **32** alertes au plus.
8. `npx expo export --platform ios`, puis `--platform android` : **la sortie lue** — « Exported », aucune « Import stack », `dist/` produit.
9. `npx expo start --web -c` et un navigateur : **l'application démarre**.

### 7.3 Au navigateur, en démonstration (sans `.env`)

Captures dans `captures/` ; la bande « mode démonstration » visible ; **`npm run mesure-devis` en code de sortie 0**.

| geste | attendu |
|---|---|
| « Mon profil » d'un pro | « Mes devis » sous « Mes clients » ; **absent** pour un particulier |
| « Mes devis » | deux cartes ; la pastille « Brouillon » (encre par `surFond`) ; le total du premier en `Montant` ; « Client à choisir » sur le second ; « modifié il y a … » |
| ouvrir le premier | le bandeau « Chiffrage — ce brouillon ne part pas encore. » **qui défile** ; « R+1 » puis « Salle de bains » avec leurs sous-totaux ; « Réserve : » ; **« Offert » à la place du total, et sa valeur dans la carte** ; « Fourniture non comprise » écrit ; l'option sous « Options, non comprises », **sans total** ; en bas de liste, la ventilation à **deux** taux ; **le pied : une seule rangée** |
| ouvrir un poste | **la carte prend l'écran**, sa barre en haut (« ‹ Devis », le sous-total de la pièce, « Poste suivant ») ; l'unité **avant** la quantité ; quantité et prix côte à côte |
| taper « 2,5 » puis quitter le champ | le total de la ligne et le pied changent **après** le champ quitté |
| **changer seulement le taux** (une pastille), puis « ‹ Devis » | **la ligne est enregistrée** (le déclencheur « pastille », CR-E B1) |
| taper « 0 » dans le prix sans « Offert » | la phrase de `devis_ligne_offert_check` sous le champ, la ligne « Incomplète » |
| allumer « Offert » sur une ligne à 45 € | **le prix reste**, le total devient « Offert » ; éteint : le total revient |
| « Main-d'œuvre » allumé sur une ligne au m² | **aucun refus** ; l'aide « un prix au m² est un prix forfaitaire » ; sur une ligne sans unité, « heure » proposée |
| « Pièce » ajoutée, surfaces 17 et 42,5, puis « Ajouter un poste dans cette pièce » au m² | les deux appuis « Sol 17 m² », « Murs 42,5 m² » ; un appui remplit la quantité |
| « Poste suivant », taper « chape » | **trois** suggestions (45 €, 52 €, et la variante « fourniture non comprise »), chacune avec son devis d'origine ; un appui recopie, puis **la main passe à la quantité** ; deux appuis en tout (le compte de `mesure-devis`) |
| « Monter » sur un poste | il change de place ; le sous-total suit |
| « Retirer » sur le titre « Salle de bains », second appui | « Les N lignes de cette pièce passeront … » et « Retirer la pièce et ses N lignes » |
| fermer une carte | **la liste est à la même position** qu'avant (mesuré par `mesure-devis`) |
| **« Mon entreprise » → franchise → retour** | plus aucun taux ; `MENTION_FRANCHISE` ; le bandeau de cohérence (« vos lignes portent des taux ») ; **sans recharger** (CR-E I8) |
| une carte incomplète, puis un appui sur la barre du bas | **la bande de la garde** ; « La compléter » rouvre la carte |
| « Pour moi », accepter la demande de devis de démonstration | « Faire un devis » apparaît ; il ouvre un brouillon dont l'objet est la description, **sans client ni lieu** ; « depuis une demande » et le budget |
| revenir sur « Pour moi », « Faire un devis » de nouveau | **« Brouillon en cours — Reprendre · Nouveau devis »** ; « Reprendre » ouvre **le même** (CR-E I10) |
| accepter l'urgence de démonstration | idem, « depuis une urgence » ; **le rappel accepté n'a pas de bouton** |
| « Pour qui ? » → « Choisir dans mon carnet » | la feuille, sa recherche ; un client choisi ; le lieu proposé avec sa phrase |
| la fiche de Mme Martin | « Ses devis » ; « Faire un devis » ; le second appui de « Supprimer » dit **« avec l'adresse des travaux »** |
| « Supprimer ce brouillon », deux appuis | la carte disparaît de la liste |
| le délai | « Dans les 30 jours suivant la signature du devis », et la phrase de L. 216-1 sous lui ; « délai indicatif » → l'avertissement |
| la retenue de garantie | l'interrupteur, « 5 », `PHRASE_RETENUE`, **aucun montant** |

### 7.4 La VRAIE base — avant, la migration, après

10. **Avant d'écrire une ligne de migration** (lecture seule, `SupabaseLecture`, forme seulement) : refaire les mesures de l'en-tête — noms libres (tables, contraintes, fonctions, **déclencheurs**), `OP013` et `OP014` libres, comptages. **Plus de comptage de comptes « à moins de 60 km de Brest »** (CR-D M11) : il lisait les coordonnées des utilisateurs — du contenu, pas de la forme —, et rien dans ce lot n'expose un compte jetable par la distance (pas de tarifs affichés, pas d'urgences). Les comptes jetables restent placés à Brest par habitude.
11. **La migration simulée** : une base « d'avant » = `git show 5897ef3:supabase/schema.sql` rejoué deux fois, **plus le fichier de migration**, deux fois ; une base neuve au nouveau `schema.sql`, deux fois ; **les empreintes du catalogue comparées** (fonctions — `md5` du corps sans commentaires ni `\r` —, `prosecdef`, `proconfig`, `proacl` ; contraintes ; `pg_policies` ; déclencheurs **et leurs noms** ; colonnes, types, défauts ; droits de table ; index ; commentaires) : **identiques**, aux écarts connus près (le droit `m` de PostgreSQL 17, le U+00A0 du transport, les restes connus du lot T).
12. **L'application** : par le connecteur **`Supabase`** (écriture), dont chaque appel demande la validation du propriétaire ; **aucun ordre qui commence par `drop` ou `delete`**.
13. **Après** : les trois tables et leurs colonnes, les **23** contraintes, les trois politiques (chaînes exactes du cas 28), **les trois déclencheurs sous leurs noms**, les droits (cas 26), `mes_donnees()` contient les quatre clés et plus `'devis'`. **Un lot dont la moitié base n'est pas appliquée n'est pas fini.**

### 7.5 La VRAIE base — par le chemin de l'application

**Les comptes jetables** : A (pro), B (pro concurrent), P (particulier) ; adresses `devis-a-<horodatage>@exemple-opus.test` ; **une preuve `essai` pour chaque adresse EXACTE de pro**, posée par le connecteur `Supabase` avant l'inscription ; **SIRET fictifs à clé juste, vérifiés inconnus du répertoire Sirene** ; `/functions/v1/siret` intercepté (`page.route`) ; **`**/rpc/enregistrer_vues` neutralisé avant toute connexion** ; `npx expo start --web -c` ; relais Supabase **et** Base Adresse. **Ni le compte du frère, ni celui du propriétaire.**

| geste | attendu, et **relevé** |
|---|---|
| A ouvre « Mes devis » sans avoir déclaré son régime | « Nouveau devis » ouvre la saisie ; « Régime de TVA non déclaré — Mon entreprise » ; la barre ne propose que titres et réserves |
| **la route `**/rest/v1/emetteur*` coupée**, puis la saisie rouverte | « Votre régime de TVA n'a pas pu être lu — Réessayer », **jamais « non déclaré »** ; rétablie, « Réessayer » le lit (CR-E B3) |
| A déclare **le régime réel** dans « Mon entreprise », **depuis le bandeau** | **au retour, sans recharger**, les pastilles de taux apparaissent ; **aucune n'est cochée** sur la première ligne |
| A tape **4 postes à 2 taux**, un titre de pièce, une réserve, une option, un « Offert » avec sa valeur | `POST /rest/v1/devis → 201` **une fois**, puis **un `POST /rest/v1/devis_lignes` par ligne** et des `PATCH` pour les changements — **chacun relevé**, aucun en double ; aucun `upsert` (`Prefer: resolution=…` absent) |
| **deux appuis rapprochés** sur une ligne neuve (une pastille, puis un champ quitté) | **un** `POST`, puis **un** `PATCH` (la file) |
| **le total à l'écran comparé au total en base** | `GET /rest/v1/devis?select=total_*` et `GET /rest/v1/devis_tva?nb_lignes=gt.0` : **égaux, au centime** — et égaux à `totauxDevis()` sur les mêmes lignes |
| **rechargement complet** | le devis revient de la base, totaux compris, « Offert » avec sa valeur |
| A change le taux d'une ligne, puis retire une ligne | le pied suit ; en base, l'ancien taux est **à zéro** et n'apparaît plus à l'écran |
| taper « 0 » dans un prix sans « Offert » | **zéro `POST` vers `devis_lignes`**, compté (CR-E I8) |
| **la route `**/rest/v1/devis_lignes*` coupée pendant qu'on tape**, puis la carte fermée | la rangée « Non enregistrée — Réessayer », le pied « · 1 ligne non enregistrée » ; un appui sur la barre du bas → **la bande de la garde**, l'écran ne part pas ; route rétablie → « Réessayer » → `201`, la rangée redevient normale (CR-E B1) |
| la mémoire | la requête interceptée contient **`!inner`** et **`devis.pro_id=eq.`** ; son temps, relevé |
| A passe sa fiche **en franchise** | le bandeau de cohérence ; **rien n'a changé tout seul** en base |
| P envoie une demande de devis à A ; A l'accepte ; « Faire un devis » | un brouillon, `source = 'demande'`, `quote_request_id` posé, l'objet = la description de P, **aucun client** |
| « Faire un devis » de nouveau sur la même demande | `GET /rest/v1/devis?quote_request_id=eq.…` ; « Reprendre » ouvre **le même** |
| A crée la fiche de P par « Nouveau client » (depuis la saisie) | **une seule fenêtre** ; la fiche est posée sur le devis ; le lieu est proposé depuis elle |
| la fiche du client | « Ses devis » le montre ; « Faire un devis » ouvre un second brouillon |
| A supprime la fiche (second appui : « ce client a 2 devis … avec l'adresse des travaux ») | les deux devis **restent**, `client_id` vide, **lieu et objet intacts**, totaux intacts — relevé en base |
| P supprime son compte **par le chemin de l'application** | **la suppression réussit** ; le devis de A existe, `quote_request_id` vide, `source = 'demande'` (D3) |
| par `curl`, **avec la clé publiable seule** | `GET /rest/v1/devis` → **401 · 42501** ; idem `devis_lignes`, `devis_tva` |
| **avec le jeton de B** — juste après que A a lu son devis | `GET` des trois tables de A → **`[]`** ; `POST` d'une ligne dans le devis de A → **403** ; `PATCH` du devis de A → `204` et **rien de changé** (relu par A) ; `DELETE` → idem |
| avec le jeton de A | `POST`, `PATCH`, `DELETE` sur `/rest/v1/devis_tva` → **403 · 42501 (permission denied)** (CR-B B3) ; `PATCH /rest/v1/devis … {"total_ht_centimes": 100}` → `204`, et le total relu est **le vrai** ; `… {"client_id": <une fiche de B>}` → **400 · OP013**, message complet ; `… {"quote_request_id": <un uuid inventé>}` → **400 · OP013** (jamais 23503) ; `… {"retenue_garantie_centiemes": 501}` → **400 · `devis_retenue_check`** ; **un `POST /rest/v1/devis` avec un `id` déjà pris par A → 409 · 23505** |
| `rpc/mes_donnees` avec A, puis avec P (avant sa suppression) | A : `devis_emis`, `devis_lignes`, `devis_tva` **non vides**, `demandes_de_devis` présente, **`devis` absente** ; **P : `demandes_de_devis` contient la demande qu'il a envoyée** |
| la route `**/rest/v1/devis*` coupée sur « Mes devis » | « Lecture impossible » et « Réessayer » — **jamais « Aucun devis »** |
| ménage | A et B supprimés **par le chemin de l'application** ; `devis`, `devis_lignes`, `devis_tva`, `clients`, `quote_requests` sans aucune ligne de ces comptes ; **base revenue à ses comptages** ; preuves `essai` réutilisées plutôt que multipliées |

### 7.6 Ce qui ne se vérifie PAS ici, et qu'il faut DIRE

- **le clavier** : ce qui reste visible au-dessus de lui dans une carte, la virgule du pavé décimal, le défilement natif jusqu'au champ actif (`automaticallyAdjustKeyboardInsets` est jetée par `react-native-web`), `keyboardDismissMode="on-drag"` ;
- **le pied caché pendant la frappe**, et ce que l'artisan voit à la place (CR-E I1) ;
- **les pastilles et les suggestions sous le pavé numérique**, qui n'a pas de touche pour se fermer (CR-E I1, I3) ;
- **le pouce** sur une rangée, sur les pastilles, sur le `BtnMini` « Faire un devis » de « Pour moi » (36 + `hitSlop`, que le navigateur ignore) ;
- **les chiffres tabulaires d'Inter sur iOS** (la police porte `tnum`, mesuré ; le rendu d'iOS se juge à l'œil) ;
- **la carte posée au-dessus d'une liste restée montée** : sa tenue dans l'architecture native, la position retrouvée, VoiceOver qui ignore la liste dessous ;
- **`globalThis.expo.uuidv4`** dans l'application d'essai : DÉDUIT du code d'Expo, prouvé par la toute première ligne enregistrée depuis l'iPhone ;
- **le correcteur** sur le jargon (« placo », « BA13 », « ragréage ») — actif par décision du plan ;
- **la file d'écriture sous un vrai réseau de chantier** : au navigateur, seule la coupure franche se simule ;
- **un vrai devis d'un vrai artisan** : aucun n'existe ; la vraie base n'aura, après l'essai, **aucun** devis.

**L'essai humain sur l'iPhone** : dans le build de développement (ou Expo Go — le lot n'ajoute aucun module natif), **jamais dans l'icône « preview » du 17/10**, qui contient le code d'avant : **demander QUELLE application il a ouverte**. Le compte : à lui demander (§9, Q5). **Dix questions écrites à l'avance** :

1. Taper « 2,5 » dans la quantité : la virgule passe-t-elle ?
2. Quand le pavé numérique est ouvert, voyez-vous les unités et le taux ? Le geste « glisser vers le bas » ferme-t-il le clavier ?
3. Le total en bas se voit-il quand vous en avez besoin ? Vous manque-t-il pendant que vous tapez ?
4. La ligne qui s'ouvre en grand : préférez-vous cela, ou la voir dans la liste ? Retrouvez-vous votre place en revenant ?
5. Combien de touches pour la deuxième chape ?
6. Les pastilles d'unité et de taux, et « Faire un devis » dans « Pour moi », se touchent-ils sans viser ?
7. Le total se lit-il d'un coup d'œil, chiffres alignés ?
8. Le correcteur a-t-il changé un mot de métier ?
9. « Nouveau client » depuis le devis ouvre-t-il bien la fiche, puis la pose-t-il sur le devis ?
10. La toute première ligne que vous avez tapée est-elle là après avoir fermé puis rouvert Opus ?

---

## 8. Les étapes de construction, dans l'ordre — chacune vérifiable seule

| étape | ce qu'on fait | comment on le vérifie avant de passer à la suivante |
|---|---|---|
| **0** | relire ce cahier ; refaire les mesures de §7.4-10 ; **rejouer les 24 fichiers d'essais** sur une base neuve au schéma actuel et ranger leur sortie (le relevé « avant ») ; **lancer sur le schéma d'aujourd'hui les deux vérifications de `verifier-devis` qui lisent l'existant** (D4-c, la liste fermée qualifiée) — elles doivent passer AVANT qu'une ligne de la section 49 existe (CR-B B1, B2) | noms libres ; comptages notés ; relevé « avant » rangé ; les deux vérifications vertes sur l'existant |
| **1** | `src/lib/centimes.js` (le déménagement) ; `emetteur.js` réexporte ; `src/lib/identifiant.js` | `verifier-emetteur`, `verifier-tarifs`, `verifier-tva`, `verifier-imports` **verts, inchangés** ; A-8, A-11 |
| **2** | `src/lib/devis.js` ; `src/lib/file-ecriture.js` ; `supabase/cas-devis.json` ; `verifier-devis`, partie A | A-1 à A-11 ; sabotages 1 à 19 |
| **3** | la section 49 de `schema.sql`, la section 42 (`mes_donnees()`), les commentaires des sections 41.2 et 43 ; `essais-section-49.sql` et `essais-section-49-temoin.sql` ; le cas 4 de `essais-section-43.sql` ; `verifier-devis` parties B et C ; `verifier-legal` (la troisième liste, la règle C16 sans exemption) ; `verifier-portes` | schéma **deux fois** sur une base neuve ; **les cas lus un par un** ; cas 30 à **0 écart** ; **la concurrence en quatre passages** ; la mémoire sur 200 000 lignes ; les **24 autres fichiers** comparés au relevé « avant » ; sabotages 20 à 41, 61 |
| **4** | `erreurs.js` (23 phrases, `OP013`, `OP014`, `40P01`) ; `api.js` (démonstration et Supabase, par la file) ; `src/data/devis-demo.js` ; `verifier-devis` partie D | D-27 ; A-7 ; `npm run lint` (≤ 32) ; sabotages 42, 43 |
| **5** | les briques (`Pastille`, `Interrupteur` sorti de `FicheEmetteur`, `Montant`, `ChampMontant`) ; `ChampDesignation`, `EnteteDevis`, `CarteLigne`, `ChoixClientDevis` ; `DevisScreen`, `SaisieDevisScreen` ; `FicheClient` (et ses deux jetons) ; `DemandesRecuesScreen` ; `ProfilOwnScreen` ; `MonEntreprise` (`surEmetteur`) ; `OpusApp` (huit points, plus quatre pour la garde) ; `verifier-devis` parties E et F ; `verifier-listes`, `verifier-clients`, `verifier-cibles` | E et F ; sabotages 44 à 58 ; `verifier-emetteur` et `verifier-tarifs` rejoués (le déménagement d'`Interrupteur`) ; **`npm run verifier` en entier, codes de sortie** ; `npx expo export` iOS puis Android, **sortie lue** ; `npx expo start --web -c` : l'application démarre |
| **6** | `legal.js` (`VERSION`, quatre passages) ; la partie texte de `verifier-legal` | `verifier-legal` vert, et éprouvé (sabotage 59) |
| **7** | le parcours en démonstration (§7.3) ; `scripts/mesure-devis.mjs` | les captures ; `npm run mesure-devis` en code 0, et refusant le sabotage 60 |
| **8** | **une relecture adverse du CODE** — base, application, droit — et chaque problème **reproduit avant d'être corrigé** ; puis tout rejouer (étapes 3 à 7). Celle-ci a porté sur le cahier (v1 → v2) ; elle ne dispense pas de celle du code | la méthode des lots T et VIES |
| **9** | la vraie base : migration simulée et empreinte (§7.4-11), **validation du propriétaire**, application, relevé après, essais par le chemin de l'application et par `curl` (§7.5), ménage | les tableaux de §7.5 **remplis avec les nombres relevés** |
| **10** | **les documents** : une section « Le chiffrage — lot 1 » dans `CLAUDE.md` ; dans `docs/PLAN-DEVIS.md`, le lot 1 coché et **les lignes à corriger** (`PLAN:1157`, `PLAN:2025-2026`, `PLAN:2040-2043` — la formule en millièmes ; `PLAN:1786-1788` — « demandes reçues » ; `PLAN:2896`, `PLAN:2922` — la contrainte de main-d'œuvre ; `PLAN:3090` — « zéro centime ») ; `docs/A-FAIRE.md` (au juriste : l'assiette de la retenue, une retenue sur un paiement unique, ce qu'un franchisé écrit à la place de « HT et TTC », le taux horaire TTC face à un prix HT, le taux d'une ligne de frais sur un devis à deux taux, **la qualification d'un « Offert » (remise ou prestation à prix nul) et ce que le devis en imprime**, **les primes déduites** ; au lot S : `truncate` sur `clients`, le blocage et les demandes déjà reçues, la classe de blancs à réunir) ; ce cahier archivé en `docs/CAHIER-LOT-1.md` ; **un commit aux chemins nommés un par un**, dont le message dit ce qui n'a pas été vérifié (§7.6) | puis les dix questions du §7.6 au propriétaire |

---

## 9. Les questions au propriétaire

**Aucune ne bloque le début de la construction.** Les étapes 0 à 2 se font sans réponse ; la **Q2** est souhaitée avant l'étape 3 (la règle des unités entre en base), la **Q1** avant l'étape 5 (l'écran), la **Q5** avant l'essai sur l'iPhone, les **Q3 et Q4** avant le lot 2. **Sans réponse, ce cahier applique la recommandation.**

**Q1 — Pour un artisan au régime réel de TVA, l'écran propose-t-il dès maintenant le choix du taux (20 %, 10 %, 5,5 %) ligne par ligne ?**
Le plan disait « au lot 3 », mais il demandait aussi d'essayer « un devis à deux taux » dès maintenant.
- **(a) Oui, dès maintenant**, sans rien cocher d'avance sur la première ligne. Rien ne part : le lot 2 refusera d'envoyer un devis au régime réel tant que le lot 3 n'a pas ajouté la certification que le client porte sur le devis pour 10 % et 5,5 %. *Conséquence : l'écran et l'essai de ce cahier, tels quels.*
- **(b) 20 % seulement** jusqu'au lot 3. *Conséquence : un taux que l'écran pose à votre place, donc faux pour une rénovation de logement à 10 % — et un devis à deux taux ne s'essaie pas.*
- **(c) Pas de chiffrage au régime réel** avant le lot 3. *Conséquence : seuls les artisans en franchise chiffrent ; votre propre compte, s'il est au réel, ne pourra pas essayer.*
*Recommandation : (a).*

**Q2 (facultative) — Vous faut-il d'autres unités que m², mètre linéaire, m³, unité, heure et forfait ?**
- **(a) Non, ces six suffisent** — ce sont celles de vos deux anciens devis. *Conséquence : rien à faire.* **→ Réponse du 21/10 : (b), « jour » ajoutée.**
- **(b) Ajouter « jour »** (une journée d'ouvrier, une location à la journée). *Conséquence : une pastille de plus, une règle de la base qui en accepte sept.*
- **(c) Ajouter aussi des poids et des volumes** (kg, tonne, litre). *Conséquence : trois pastilles de plus — les unités passent sur trois rangées sur un petit écran.*
*Pourquoi maintenant : chaque unité ajoutée plus tard oblige à refaire une règle de la base ; avant la première migration, c'est gratuit. Recommandation : (a), sauf si vous chiffrez souvent à la journée — alors (b).*

**Q3 — Voulez-vous pouvoir faire une remise sur un devis ?** (avant le lot 2)
Aujourd'hui vous écrivez « Offert » sur une ligne, et c'est construit — **le prix de ce que vous offrez reste écrit**, pour que le devis puisse dire ce que vaut le geste. Une **remise** (« −10 % », « −200 € »), elle, n'est construite nulle part, et mal faite elle se trompe d'un centime : sur un devis à deux taux de TVA, il faut la répartir entre les taux au centime près.
- **(a) Pas de remise**, « Offert » suffit. *Conséquence : rien à faire.*
- **(b) Une remise par ligne**, en pourcentage (« pose : −10 % »). *Conséquence : la plus simple, et la forme que les règles de facturation préfèrent ; une colonne et des cas d'essai avant le PDF.*
- **(c) Une remise sur le total** du devis. *Conséquence : à répartir entre les taux par une règle précise et éprouvée ; plus longue à construire, avant le PDF.*
*Recommandation : (a) tant que vous n'en avez pas besoin ; (b) si vous en faites.*

**Q4 — Vos devis déduisent-ils parfois une prime (CEE, MaPrimeRénov', une aide) du prix à payer ?** (avant le lot 2)
- **(a) Jamais.** *Conséquence : rien à faire.*
- **(b) Oui, parfois.** *Conséquence : il faudra une forme pour l'écrire — pas une ligne négative, que le chiffrage refuse —, et faire vérifier par un juriste ou un comptable comment elle se traite pour la TVA : ce n'est pas établi aujourd'hui.*
*Recommandation : répondre selon votre pratique ; (a) ne ferme rien, on pourra l'ajouter.*

**Q5 — Sur quel compte voulez-vous essayer le chiffrage sur votre iPhone ?**
- **(a) Votre compte principal**, celui de votre SARL. *Conséquence : vos brouillons ne partent nulle part, ils restent à vous et se suppriment ; vous verrez l'écran selon le régime de TVA que vous avez déclaré (je ne l'ai pas lu).*
- **(b) Le compte de votre frère.** *Conséquence : il doit être d'accord pour des brouillons d'essai au nom de son entreprise, qui est en franchise.*
- **(c) Un compte d'essai** que je prépare. *Conséquence : il faut le créer sur la vraie base (avec votre validation), et le supprimer ensuite.*
*Recommandation : (a).*

---

## 10. Ce que ce cahier n'a PAS vérifié

- **Aucune ligne de la forme finale n'a été exécutée.** Ont été exécutés : les cas d'argent sur le **prototype** de la lecture argent (36 cas, 0 écart) ; le **prototype de CR-B**, écrit selon la v1 (la garde `OP013`, la cascade, les suppressions, l'ordre alphabétique des contraintes, l'interblocage et sa parade) ; et, le 21/10, **deux essais de ce cahier sur ce même prototype** : la forme « Offert garde son prix » (`v2/offert-superset.out`) et la mémoire filtrée (`v2/memoire.out`). Le reste — 23 contraintes, déclencheurs nommés, `OP014`, la file, les écrans — c'est l'étape 3 et suivantes.
- **Ce qui était DÉDUIT dans la v1 et ne l'est plus** (mesuré par CR-B) : la vérification de clé étrangère ignore la RLS ; pendant un `set null`, `current_user = postgres` et `auth.uid()` = celui qui a déclenché ; les cas 21, 23, 24 passent ; le verrou est nécessaire, et `for update` interbloque.
- **Toujours DÉDUIT** : que PostgREST émette pour `!inner` la forme de jointure mesurée ; que les règles de verrou soient identiques sous PostgreSQL 17.6 (la documentation le dit, aucune mesure sur 17) ; la fréquence réelle d'un interblocage hors fenêtre élargie ; que `globalThis.expo.uuidv4` existe dans l'application d'essai ; qu'une carte posée en position absolue au-dessus d'une liste montée se comporte sur iPhone comme au navigateur.
- **Le droit** : aucun texte relu sur Légifrance (403) ; la loi n° 71-584, le décret n° 71-1058 et l'arrêté de 2017 l'ont été dans les données LEGI du 13/07/2025 (une modification postérieure ne serait pas vue ; aucune n'est signalée par la recherche de CR-D, ce qui n'est pas une preuve). La réponse ministérielle AN n° 26125 (l'arrondi) n'a pas pu être lue. **Restent au juriste** : l'assiette (HT ou TTC) de la retenue et une retenue sur un paiement unique ; ce qu'un franchisé écrit à la place de « HT et TTC, en précisant le taux » ; le taux horaire TTC face à un prix unitaire HT au centime ; le taux d'une ligne de frais de déplacement sur un devis à deux taux ; **la qualification d'un « Offert »** ; **les primes déduites** ; l'extension de R. 212-2 aux non-professionnels (R. 212-5).
- **Hermes** n'a pas fait tourner `devis.js` ni `file-ecriture.js` : les calculs ont tourné sous `node` 22 ; ce sont des opérations entières, sans `BigInt` au lot 1.
- **Le régime de TVA de la seule fiche `emetteur` réelle** n'a pas été lu, exprès : c'est une donnée de l'entreprise.
- **Ce que voit le propriétaire sur son iPhone**, par construction.

---

## Annexe A — Les trois critiques : ce qui a été vérifié, décidé, et où

**Méthode.** Chaque point a été **relu sur sa source** avant d'être tranché : les textes de droit dans `textes/` et `web/` (arrêté du 24/01/2017 art. 1er, 2 et 4 ; loi n° 71-584 art. 1er et 2 ; décret n° 71-1058 art. 1er ; C. conso. L. 216-1, L. 111-1, R. 212-2 ; arrêté du 3/12/1987 art. 1er et 3 ; CGI 266, 279-0 bis, 278-0 bis A ; ann. II 242 nonies A ; BOFiP §220) ; le dépôt au `5897ef3` (`schema.sql`, `legal.js`, `api.js`, `OpusApp.js`, `clavier.js`, `ChampLocal.js`, `ChampVille.js`, `FeuilleBas.js`, `MonEntreprise.js`, `ui.js`, `theme.js`, `FicheClient.js`, `verifier-feuilles.mjs`, `verifier-legal.mjs`, `verifier-cibles.mjs`, `verifier-typographie.mjs`, `entreprise.js`) et `node_modules` (React Native 0.86.3, `expo-modules-core`) ; la vraie base par `SupabaseLecture`, forme seulement (21/10) ; les journaux et le prototype de CR-B ; et **deux essais nouveaux** sur ce prototype (`v2/offert-superset.sql`, `v2/memoire.sql`). « Retenu » = le cahier est corrigé ; « en partie » = retenu, avec une autre correction que celle proposée, ou une partie écartée ; « rejeté » = écarté, avec la raison.

### A.1 Critique « droit et loi fiscale » (CR-D)

| # | critique | vérifié | décision | où dans la v2 |
|---|---|---|---|---|
| B1 | la contrainte « main-d'œuvre ⇒ heure ou forfait » contredit l'arrêté de 2017 (art. 2 : le prix au m² est un prix forfaitaire) et est plus stricte que la loi | **oui** — art. 2 et 4-I relus (`textes/arrete-2017.txt:50-52`, `:75`) ; le 4-II est déjà tenu par `forme_check` (quantité exigée) ; `PLAN:2896` disait « hors établissement » | **retenu** : contrainte retirée (23 au lieu de 24), C20 inversé, le drapeau gardé (proposition de l'heure et du taux horaire, libellés, mémoire, PDF) ; aide « un prix au m² est un prix forfaitaire » ; la question au juriste retirée | §0.3, §1.1, §1.4 point 2, §1.5 C20, §2.3, §2.5, §3.5 C20, §4.4, §6.1-B18, §6.4 #27 |
| B2 | la phrase de la retenue promet la restitution sans la réserve de l'art. 2 ; « caution bancaire » trop étroit | **oui** — art. 2 (opposition motivée par lettre recommandée), décret 71-1058 art. 1er (banques, établissements financiers, sociétés de caution mutuelle), consignataire « accepté par les deux parties ou à défaut désigné » | **retenu** : `PHRASE_RETENUE` réécrite, une constante ; le contrôle exige « opposition » à côté de « un an » | §1.2, §3.3, §4.4 point 6, §6.1-A5 |
| I1 | « Sous 30 jours — c'est ce que la loi applique » : L. 216-1 ne vaut que face à un consommateur, dit « sans retard injustifié », et compte depuis la conclusion du contrat | **oui** — `textes/conso.txt:42-45` | **retenu** : « Dans les 30 jours suivant la signature du devis », et une raison qui dit « face à un particulier » ; le contrôle la tient | §0.3, §2.2, §3.3, §4.4, §6.1-A5 |
| I2 | les options : un affichage « HT + taux » ne suffira pas face à un consommateur (arrêté du 3/12/1987, art. 1er), et le contrôle E-25 interdisait d'avance le seul affichage conforme | **oui** — `textes/arrete-1987.txt:26` | **en partie** : le contrôle n'interdit plus que l'**addition** de deux totaux ; le lot 2 imprimera le TTC « option comprise » calculé sur l'union. **Écarté** : écrire `totauxAvecOption()` dès le lot 1 — elle n'aurait aucun lecteur au lot 1 (une fonction que personne n'appelle est le « bouton §18 ») ; C05b porte déjà le cas de l'union | §0.3, §1.3, §2.4, §3.3, §3.5 C05b, §6.1-E28 |
| I3 | « Offert » = prix 0 perd le prix avant remise que la facture devra porter si c'est une remise | **oui** — BOFiP §220 (`web/bofip-319741.txt:298-299`), ann. II 242 nonies A 8° et 9° ; la qualification reste non établie | **retenu, et tranché sans attendre** : « Offert » garde le prix et met le total à 0 — un **sur-ensemble** de la v1 (prix 0 toujours possible, avec « Offert ») ; **mesuré** sur le prototype (C09c, C09d, C09e, la double faute) ; la qualification et l'impression vont au juriste avant le lot 2 | §0.3, §1.4 point 1, §1.5 C19, §2.3, §2.5, §2.6, §3.3, §3.5, §4.4, §8 étape 10 |
| I4 | « `0` = la franchise » donne à la ligne un sens qu'elle n'a pas ; le cahier s'écartait de la lecture droit sans le dire | **oui** — 242 nonies A, I, 8° ; `emetteur_tva_check` n'a que `franchise` / `reel` (relevé par CR-D) | **retenu** : `0` = « aucune TVA facturée sur cette ligne », la raison portée par le régime **figé sur le devis au lot 2** ; pourquoi pas `null` écrit (clé primaire de `devis_tva`) | §0.3, §1.3, §1.5 C21, §2.0, §2.3, §2.5 |
| I5 | « sans nom de client » : la fiche supprimée laisse l'adresse des travaux et le texte de l'artisan | **oui** — colonnes `lieu_*`, `objet` | **retenu** : phrases de la fiche, du commentaire 41.2 et du texte légal réécrites ; contrôles qui refusent « sans nom de client » | §2.10, §4.6, §5, §6.1-E30, §6.4 #54, #59 |
| I6 | « Combien de temps » promet un effacement « à trois exceptions près » alors que la demande recopiée dans un devis survit | **oui** — `legal.js:952-956` ; `titre` = `quote_requests.description` (`schema:4207`) ; déjà vrai depuis le carnet | **retenu** : une exception de plus, sans nombre annoncé ; contrôle | §5, §6.4 #59 |
| I7 | l'arrêté de 2017 ne vise que le dépannage, la réparation et l'entretien énumérés en annexe, face au consommateur ; citation fausse (« des travaux ») | **oui** — art. 1er (`textes/arrete-2017.txt:5`), art. 4-I « des réparations » (`:74`) | **retenu** : chaque citation dit son champ ; `objet` fondé sur C. civ. 1163 et L. 111-1 1° | en-tête, §1.5 C20, §2.2 |
| M1 | « aucune règle française ne le fixe » (demi vers le haut) | la lecture droit dit « aucune trouvée » | **retenu** | §2.0 |
| M2 | l'export des données des clients relève aussi de l'art. 28.3.e ; pour une SARL, les prix ne sont pas des données personnelles | DÉDUIT de la critique (texte du RGPD lu par résumé) | **retenu** | §2.9 |
| M3 | « u » est le symbole de l'unité de masse atomique ; la cohérence plaide pour « unité » | le tableau des symboles du décret n'a pas été lu (NON VÉRIFIÉ par CR-D elle-même) ; le propriétaire écrit « € / u » (`PROP:64-65`) | **en partie** : la pastille dit « unité » (et VoiceOver « unité ») ; **le libellé court « u » est gardé** — c'est celui de ses devis, et compter des pièces ne mesure pas une grandeur (décret 61-501 art. 8) : aucune confusion possible sur un devis, contrairement à « ml » qui s'écrit dans un contexte de longueurs | §0.3, §3.3 `UNITES` |
| M4 | CGI 266, 1, **f** plutôt que a | **oui** — `textes/cgi2.txt:24` | **retenu** | §1.2 |
| M5 | la Caisse des dépôts écrit « 5 % du montant des acomptes versés » | source officielle citée par CR-D | **retenu** (cité, la question reste au juriste) | §1.2 |
| M6 | la mention de franchise écrite en dur | — | **retenu** : `MENTION_FRANCHISE`, une constante ; contrôle | §1.5 C3, §3.3, §6.1-E28 |
| M7 | un franchisé dont le devis dépasse 41 250 € | CGI 293 B (relevé par CR-D) | **retenu** : un avertissement au lot 2 | §1.3 |
| M8 | les déchets : un montant, jamais une colonne hors du recalcul | D. 541-45-1, I, 4° (relevé par CR-D) | **retenu** | §1.3 |
| M9 | « l'attestation que le client signe » : le preneur **certifie sur le devis ou la facture** | **oui** — `textes/cgi.txt:10`, `:28-29` | **retenu** | §1.3, §9 Q1 |
| M10 | R. 212-2, 7° vise une « date » indicative | **oui** — `textes/conso3.txt:24` | **retenu** | §3.3 `avertissementDelai` |
| M11 | compter les comptes « à moins de 60 km de Brest » lit des coordonnées | **oui** — c'est du contenu | **retenu** : la mesure est retirée, avec sa raison (rien du lot n'expose un compte par la distance) | §7.4-10 |
| M12 | aucune forme pour une prime déduite ni un prix barré | non établi en droit | **retenu** comme question (Q4) et au juriste | §1.3, §9 Q4, §10 |

### A.2 Critique « base et sécurité » (CR-B)

| # | critique | vérifié | décision | où dans la v2 |
|---|---|---|---|---|
| B1 | D4-c refuse le schéma d'aujourd'hui : `emetteur_incomplet` contient `source` (`r.source`) | **oui** — `schema:10433` | **retenu** : D4-c vise la **colonne du devis** dans une liste **nommée** de fonctions de motifs ; ce contrôle est lancé sur le schéma actuel avant toute écriture | §6 (en-tête), §6.1-B14, §6.4 #23, §8 étape 0 |
| B2 | `\mdevis\M` attrape le français et le genre `'devis'` ; deux fonctions de la liste fermée ne nomment pas les tables | **oui** — raisonnement sur les frontières de mot revérifié ; `verifier-legal` garde les chaînes (`:718-720`, relu) | **retenu** : nom **qualifié** partout, référence non qualifiée refusée, liste fermée relevée = `tient_le_devis`, `tient_la_ligne_de_devis` (le compte d'`OP014`), `recalcule_devis`, `mes_donnees` | §2.0, §2.6, §2.12 cas 27, §6.1-B22, §6.2 |
| B3 | le cas 11 attend une erreur RLS et `UPDATE 0` ; c'est le droit de table qui refuse | **oui** — un droit se vérifie avant la RLS ; mesuré par CR-B | **retenu** : trois transactions, `permission denied for table devis_tva` ; 403 · 42501 par l'API | §2.7, §2.12 cas 11, §7.5 |
| I1 | `for update` interbloque deux insertions (clé étrangère `FOR KEY SHARE`) ; `for no key update` non | **oui** — `critb-t1-forupdate.log` (`deadlock detected`), `critb-t1-nokey.log` ; table de compatibilité des verrous de PostgreSQL | **retenu** : `for no key update`, justifié dans le code ; phrase `40P01` ; contrôle ; passage de concurrence avec déclencheur témoin | §0.3, §2.6, §2.12, §4.1, §6.1-B21, §6.4 #31 |
| I2 | avec deux taux différents, le sabotage « verrou retiré » passe | **oui** — raisonnement (deux lignes de ventilation distinctes) et mesure de CR-B | **retenu** : « au même taux », quatre passages | §2.12 |
| I3 | un `upsert` partiel est refusé, avec le mauvais message | **oui** — le piège du lot T (CLAUDE.md) ; mesuré par CR-B | **retenu** : insertion de la ligne entière, puis `update` ; jamais d'`upsert` ; contrôle | §0.3, §2.0, §4.2, §6.1-D27, §6.4 #17, #43 |
| I4 | la mémoire lit les lignes de toute la plateforme | **oui, remesuré** — 306 ms (Seq Scan, 200 002 lignes) contre **2,9 ms** filtrée par `devis.pro_id` (`v2/memoire.out`) ; `statement_timeout` 8 s relevé | **retenu** : `devis!inner` + `.eq('devis.pro_id', …)` ; la forme exacte de PostgREST reste DÉDUITE et se relève au §7.5 ; `.in('devis_id', …)` écarté (longueur d'adresse) | §0.3, §2.8, §4.2, §6.1-D27, §7.1, §7.5 |
| I5 | la clé `'devis'` porte les demandes des deux côtés ; « reçues » ment au particulier | **oui** — `schema:11396-11397` | **retenu** : `'demandes_de_devis'` ; essai 25 sur P | §0.1, §1.5 C22, §2.9, §2.12 cas 25, §6.1-B24 |
| I6 | prémisse fausse (« le particulier a pu bloquer l'artisan ») et cas 14 bis vide | **oui** — `schema:1129-1131`, `:1220-1222` : pas d'`est_masque` | **retenu** : la vraie raison écrite ; cas 14 bis réécrit pour pouvoir échouer | §2.6, §2.12 cas 14 bis |
| I7 | deux lignes au même `ordre` : rattachement indéterminé | **oui** — DÉDUIT de la documentation (un tri sur valeurs égales n'est pas garanti) | **retenu** : second critère `id` partout, index `(devis_id, ordre, id)` ; index unique écarté (renumérotation) | §1.4, §2.3, §2.8, §3.3 `trierLignes`, §6.1-D27 |
| M1 | une contrainte `x = f(…)` passe quand `f` rend `NULL` | **oui** — sémantique de `check` | **retenu** : `… is not null and …` | §2.1, §2.5, §6.1-B18 |
| M2 | la classe de blancs en caractères invisibles dans le cahier | **oui** — relevé octet par octet (`od -c`, ligne 411 de la v1) | **retenu** : forme échappée de la section 47 ; copies comparées par contrôle ; une fonction unique renvoyée à un lot à part | §2.6, §3.3 `BLANCS`, §6.1-B17 |
| M3 | l'exemption « fonction de déclencheur » de C16 est trop large | **oui** — aucune fonction de déclencheur du lot n'en a besoin | **retenu** : plus d'exemption ; sabotage | §1.5 C16, §6.2, §6.4 #36 |
| M4 | dire les liens posés avant les suppressions (la double cascade) | — | **retenu** | §2.12 préparation, cas 23, 24 |
| M5 | « régime non déclaré : aucune ligne chiffrée » n'est tenu que par l'écran | **oui** — aucune fonction de la section ne lit `emetteur` | **retenu** : dit, et renvoyé au refus de remise du lot 2 | §0.3, §1.3, §1.5 C3 |
| M6 | les déclencheurs ne sont pas nommés ; leur ordre compte | **oui** — ordre alphabétique des noms, RI compris (mesuré par CR-B) | **retenu** : trois noms, l'ordre réel, cas 31 ; noms vérifiés libres sur la vraie base | en-tête, §2.6, §2.12 cas 31, §6.1-B21 |
| M7 | le cas 14 ne prouve pas la prémisse d'`OP013` | **oui** | **retenu** : cas 14 ter (garde désactivée → `INSERT 0 1`) | §2.12 |
| M8 | le blocage n'efface pas les demandes côté artisan | **oui** (mesuré par CR-B) | **retenu** : `docs/A-FAIRE.md`, question au propriétaire avec le lot S — hors lot | §1.3, §8 étape 10 |
| M9 | aucun plafond de lignes par devis | — | **retenu** : 500 lignes, `OP014` (code vérifié libre) | §0.3, §2.6, §2.12 cas 16 bis, §3.3, §4.1 |

### A.3 Critique « écran, toucher, vérifiabilité » (CR-E)

| # | critique | vérifié | décision | où dans la v2 |
|---|---|---|---|---|
| B1 | « enregistrée quand on quitte un champ » : pastilles, valeurs posées, sortie d'écran, échec réseau ; rien ne dit ce qui n'est pas en base | **oui** — `clavier.js:152`, `ScrollView.js:490-497`, `OpusApp.js:3648`, `:3708`, `:4236` ; `avecDelai` seulement sur trois lectures | **retenu** : états par ligne, cinq déclencheurs, garde de sortie unique (cinq chemins), délai sur chaque écriture | §0.1, §4.2, §4.4, §4.8, §6.1-A10, E28, §7.5 |
| B2 | identité et ordre des écritures : doublons, réponses désordonnées, clé qui change | **oui** — aucun générateur dans `src/` ; `expo-crypto` absent | **retenu, autrement** : identifiants **choisis par le téléphone** par `crypto.randomUUID` ou `expo.uuidv4` (déjà dans le cœur d'Expo, `CoreModule.swift:78`) — ce qui rend toute écriture renvoyée idempotente (`23505` reconnu) et la clé de rangée stable dès la naissance — **plus** la file proposée (une requête à la fois, fusion, génération) | §0.3, §2.2, §2.3, §2.12 cas 14 quater, §4.2, §6.1-A10/A11 |
| B3 | le régime et le taux horaire : un échec s'affiche « non déclaré », rien ne relit après « Mon entreprise » | **oui** — `MonEntreprise.js:88-99` ne renvoie que les tarifs ; `OpusApp.js:530-556` | **retenu** : régime à cinq états dans `OpusApp`, `surEmetteur`, trois messages, fonctions sur cinq états | §0.3, §3.3, §4.2, §4.4, §4.8, §6.1-A5, E28, §7.5 |
| I1 | le pied fixe sous le clavier ; budget vertical jamais compté | **oui** — `clavier.js:78-92` ; `keyboardDismissMode` absent de `src/` (relevé) | **en partie** : pied d'une rangée, bandeau qui défile, `on-drag`, budget compté et mesuré à 375 × 667, la limite **dite**. **Écarté pour l'instant** : `InputAccessoryView` (iOS seul, invisible au navigateur) — à l'iPhone d'abord | §1.3, §4.4, §6.1-G, §7.6 |
| I2 | 7 à 9 touches par ligne ; l'ordre des champs fait sauter la carte ; « Ajouter » en bout de liste | DÉDUIT de la description de la v1, recompté | **retenu** : unité et taux avant la quantité, `autoFocus`, « Poste suivant » en haut de carte, main à la quantité après une suggestion ; 5 / 4 / 2 touches, comptées | §4.4, §6.1-G, §7.3 |
| I3 | la mémoire contredit `ChampLocal` ; elle ne recopie pas la fourniture | **oui** — `ChampLocal.js:56-88`, `:125` (`...reste` écrase `onChangeText`), `:90-94` | **retenu** : `ChampDesignation` ; la fourniture et la main-d'œuvre lues, groupées, recopiées. **Écarté** : suggestions au-dessus du champ (le champ descendrait sous le doigt) — la carte en plein écran met la désignation en haut | §3.3, §4.2, §4.4, §6.1-A4, E28 |
| I4 | `ChampVille` remonte chaque lettre et n'a pas d'`onBlur` | **oui** — `ChampVille.js:52-54`, `:75` | **retenu** : `EnteteDevis`, élément stable ; enregistrement au choix d'une suggestion, à la sortie du code postal et de la ville, à l'ouverture d'une carte, à la garde ; `ChampVille` non modifié | §4.4 |
| I5 | « Pour qui ? » dans l'écran fait rougir `verifier-feuilles` ; ni recherche ni états ; deux fenêtres de suite | **oui** — `verifier-feuilles.mjs:228-231` ; `FeuilleBas` sans `onDismiss` | **retenu** : `ChoixClientDevis` dans son fichier, sans `CLAVIER`, recherche, trois états ; « Nouveau client » **à côté**, jamais à la suite | §4.4, §6.1-E30, §6.4 #52 |
| I6 | `removeClippedSubviews` est le mauvais levier ; la liste saute ; choisir (A) ou (B) | **oui** — `FlatList.js:162-167`, `ReactNativeFeatureFlags.js:197` | **retenu, forme (B)** : la carte prend l'écran, posée au-dessus de la liste restée montée (pas de `display: none`, dont la tenue sous l'architecture native n'est pas établie) | §0.1, §4.4, §7.3, §7.6 |
| I7 | aucune brique n'atteint 44 ; `Interrupteur` local ; rien de commité ne mesure ; `mesure-cibles.mjs` n'existe pas | **oui** — `ui.js` (36, 38, 40), `FicheEmetteur.js:217`, `ls scripts/` | **retenu** : `Pastille`, `Interrupteur` sorti, `ChampMontant`, `npm run mesure-devis` ; exception nommée pour le `BtnMini` de « Pour moi » | §4.4, §4.7, §6.1-G, §6.2 |
| I8 | la démonstration ne fait pas vivre « deux prix → deux entrées » ni la franchise | **oui** — `enregistrerEmetteurDemo` (`api.js:2005-2018`) | **retenu** : données de démonstration complétées ; la franchise se voit par le geste | §4.3, §7.3, §7.5 |
| I9 | les dates sont des horodatages : la leçon de la nuit du lot T | **oui** — `entreprise.js:72`, `:103` ; `entreprise.js` n'importe que des fichiers purs (relevé) | **retenu** : `dateFrancaise`, `isoLisible`, `depuisLisible` ; contrôle dans trois fuseaux ; `devis.js` importe `entreprise.js` | §1.5 C8, §3.3, §6.1-A9 |
| I10 | « Faire un devis » crée toujours un nouveau brouillon | — | **retenu** : lecture **au moment de l'appui** (aucune requête au démarrage), « Reprendre · Nouveau devis » sur place | §4.2, §4.7, §7.3, §7.5 |
| I11 | `tabular-nums` au pied seulement ; « dernière valeur sûre » perdue | **oui** — `PLAN:3212` ; CR-E a mesuré `tnum` dans Inter, pas dans Oswald ; `verifier-typographie` sans règle de police (relu) | **en partie** : brique `Montant` pour tout montant, dernière valeur sûre + « ligne en cours ». **Écarté** : réserver la largeur du total — aligné à droite, il grandit vers la gauche sans déplacer le « € » | §4.4, §6.1-E28, §6.2 |
| I12 | retirer un titre re-range ses lignes sans le dire ; aucun geste ne déplace une ligne | DÉDUIT du rattachement par l'ordre | **retenu** : la phrase, « Retirer la pièce et ses lignes », « Monter » / « Descendre » (pas de glisser-déposer) | §3.3, §4.4, §7.3 |
| I13 | `T.minuscule` n'existe pas ; le cliquet ne lit que des nombres | **oui** — `FicheClient.js:463-468`, `theme.js:160-169` ; `T.sousTitre + 1` (`:454`) | **retenu** : corrigés dans le lot ; contrôle des jetons (`theme.js` n'importe rien) | §4.6, §6.1-E31, §6.2 |
| M1 | « Main-d'œuvre » sur une ligne au m² : remplacer l'unité plutôt que refuser | — | **dépassé par CR-D B1** : il n'y a plus rien à refuser ; « heure » est proposée quand aucune unité n'est choisie | §4.4 |
| M2 | « Offert » éteint : le prix devrait revenir | — | **réglé par CR-D I3** : le prix n'est plus effacé ; mesuré | §1.4, §3.5 C09d |
| M3 | la retenue se tape avec quoi ? | **oui** — `versCentimes` parle d'euros (`emetteur.js:421-424`) | **retenu** : `versCentiemes()` | §3.3, §4.4 |
| M4 | « HT » en franchise | — | **retenu** : « HT » au régime réel seulement, partout | §1.4, §4.4 |
| M5 | le correcteur et le jargon | décision du plan | **retenu** comme question de l'iPhone | §7.6 |
| M6 | où s'ouvre une option | — | **retenu** : en fin de devis, dans les options | §4.4 |
| M7 | `C.bad` sur le fond beige : 4,37 | CLAUDE.md, lot T (même mesure) | **retenu** : erreurs et réserves sur la carte blanche (5,56) | §4.4 |
| M8 | ni vibreur ni annonce VoiceOver | — | **retenu** : `retour.echec()`, `retour.annoncer()` | §4.4 |
| M9 | quatre `BtnMini` côte à côte sur une demande acceptée | pratique existante | **retenu** : exception nommée, question de l'iPhone | §4.7, §6.1-G, §7.6 |
| M10 | « m » seul là où l'artisan écrit « ml » | — | **retenu** : la pastille dit « m linéaire » | §3.3 `UNITES`, §4.4 |
| M11 | `scrollToIndex` échoue sur iOS | CLAUDE.md, section 37 | **réglé par I6 (B)** : plus besoin de défiler | §4.4 |
| — | « ce qui ne se vérifie pas ici » et cinq questions de plus | — | **retenu** : sept points et dix questions | §7.6 |

### A.4 Ce que la v2 a trouvé en vérifiant, et qu'aucune critique ne disait

- **La double faute garde son nom** avec la nouvelle forme d'« Offert » : quantité 0 et prix 0 sans « Offert » → `devis_ligne_offert_check` (mesuré) ; la v1 l'éprouvait avec « Offert sur 10 € », qui n'est plus une faute.
- **Une valeur offerte au-delà du plafond** doit être refusée (sinon le lot 2 imprimerait une « valeur » de 10^17 €) : `devis_ligne_total_check` le fait (mesuré, C09e).
- **Les actions d'une carte vont en haut** (« ‹ Devis », « Poste suivant ») : en bas, elles seraient sous le clavier pendant qu'on tape le prix.
- **Le régime en lecture ne doit rien proposer** (`tauxProposes` → `null`, distinct de `[]`) : sinon un artisan en franchise verrait, le temps d'une lecture, les pastilles du régime réel.
- **La carte posée au-dessus de la liste**, et non `display: 'none'` : la liste doit rester montée pour garder sa position, et la tenue d'une vue cachée par `display` dans l'architecture native n'est pas établie.
