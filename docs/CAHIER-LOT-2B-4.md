> **Cahier de l'étape 2b-4 du module devis — le prix du devis lui-même,
> l'attestation qui arrive à échéance, le plafond de la franchise.**
>
> **Archivé le 17/11/2026, à la fin de l'étape 2b-4.** Ce cahier (v3, 16/11
> au soir : le v2 plus les réponses du propriétaire à Q1, Q2 et Q3) a guidé
> l'étape ; il est versé ici TEL QU'IL A SERVI, sans une retouche, sous le
> trait qui suit cet en-tête. **En cas de désaccord, la section « Le prix du
> devis lui-même, l'attestation qui arrive à échéance, le plafond de la
> franchise — étape 2b-4 » de CLAUDE.md et le code disent vrai.** Ce qui a
> changé depuis sa rédaction :
>
> - **Trois phrases de l'annexe A.3, corrigées après la relecture adverse du
>   17/11 (D2, D3, D4, commit `3767443`)** :
>   - `avis_devis_payant` finit sa deuxième phrase par « il ne vous devra
>     rien s’il se rétracte. » (L. 221-25 al. 3 ne libère que le client qui
>     s'est rétracté) : 583 caractères, pas 566 ;
>   - pour une association, une copropriété ou une société civile SEULEMENT,
>     le même avis est suivi de `SUITE_AVIS_DEVIS_PAYANT_PRUDENCE` : « Pour
>     une association, une copropriété ou une société civile, la loi ne
>     prévoit peut-être ni ce délai de rétractation ni ces règles ; Opus les
>     dit, par prudence. » ;
>   - `avis_attestation_echeance` finit par « …sauf si ce chantier est déjà
>     ouvert : avec un permis de construire, une déclaration d’ouverture
>     déposée ; sans permis, un premier ordre de service donné, ou, à défaut,
>     des travaux déjà commencés. Demandez-la à votre assureur, et pensez à
>     la donner à votre client. » (A. 243-1, annexe I), au lieu des trois
>     façons mises sur le même plan : 575 caractères, pas 531. Les virgules
>     de « ou, à défaut, » ont été rétablies par la relecture de la
>     correction (sans elles, la phrase se lisait aussi « faute de travaux
>     commencés ») ; elle n'est pas définitive (J18).
> - **Des écarts dits par la construction, où le code fait foi** : les deux
>   avis de la franchise font 545 et 552 caractères (leur suite est composée
>   une fois ; ici, les trous sont comptés) ; le champ pré-rempli dit « 30 »,
>   pas « 30,00 » ; « Corriger », depuis la garde de sortie, ouvre la carte
>   sur le bloc par `ouvrirConditions()` puis `setChampConditions('cout')`, et
>   non par `ouvrirConditionsSur('cout')` (§3.5), qui aurait ramené à la
>   liste ; `tapes.cout == null` ; le délai par défaut se compare blancs
>   ignorés (`texteNet`) ; il ne nomme pas quatre fonctions et une constante
>   exportées (`finDeLAttestation`, `avisDeLaFranchise`, `coutQuePayantEcrit`,
>   `annonceDuCoutPropose`, et l'objet `LE_COUT_DU_DEVIS`) ; le cas 25 de l'essai
>   49-remise juge 21 valeurs, non « de l'ordre de 16 » (288 en tout, puis
>   leur compte au cas 26), et le cas 13 attend `devis_cout` à son état 2 ;
>   `verifier-devis` compte 602 vérifications et `verifier-legal` 253, non
>   « environ 630 » et « environ 246 » ; `PHRASE_DEVIS` a déménagé dans la
>   section 2b-4 de `verifier-legal`, qui exige `VERSION > '2026-11-13'` ;
>   `mesure-devis` compte 953 mesures au passage complet ; des tarifs écrits
>   puis vidés ne reviennent pas à l'identique (une ligne vide reste, §5.5) ;
>   les essais se jouent depuis la RACINE du dépôt, non depuis `supabase/`.
> - **Ses attributions de sabotages (§5.6) qui ne tiennent pas** : S8, S25,
>   S33 et S34 sont refusés, mais par d'autres vérifications que celles qu'il
>   nomme (S8 par CONTROLES-2 ; S25 par la vérification de 2b-1 « chaque
>   motif du devis a son ENDROIT » ; S33 par 43 m. et 43 d. ; S34 par 43 m.).
>   Et le banc a trouvé ce que le cahier ne prévoyait pas, fermé dans
>   `cc9697c` : l'avis du gratuit avec déplacement qui attendrait la liste
>   sûre (D11b), la carte qui choisirait « Gratuit » d'après les tarifs
>   (S8b), l'appel des avis vérifié sous un titre qui égarait (S21), et une
>   mesure qui plantait au lieu de dire ce qu'elle voyait (S34).
> - **Sa migration (§2.9)**, ce que sa construction a ajouté (le cahier n'en
>   parle pas) : le risque d'interblocage sur `devis_lignes`, annoncé par la
>   construction et la relecture, n'existe pas (un `grant` ou un `revoke` ne
>   verrouille pas la table qu'il vise, mesuré sur PostgreSQL 16) ;
>   « 0 requête active » se lit avec un rôle qui voit toutes les sessions ;
>   un relevé complémentaire, joué avant ET après, donne leur référence aux
>   valeurs « inchangées ». Elle est
>   appliquée depuis le 17/11/2026 à 07 h 35.
> - **« À VÉRIFIER au relevé avant »** (§0) : la date de fin de l'attestation
>   décennale du propriétaire n'a pas été relue.
> - **Les fichiers qu'il cite** (`comprendre/…`, `droit/…`, `textes/…`,
>   `secondaire/…`, `mesures/…`, `critique-v1-…`, le dossier de travail qu'il
>   nomme) et les noms des constats de ses critiques et relevés (`DROIT-…`,
>   `BASE-…`, `ÉCRAN-…`, `M…`, `S…`, `K…`) étaient des documents de travail
>   de la session : ils ne sont pas dans le dépôt. Ses numéros de ligne
>   datent de `0be3eb9`.
> - **Vérifié avant la copie** : il ne contient aucune donnée personnelle du
>   propriétaire (ni nom, ni SIREN, ni numéro de TVA, ni adresse e-mail), et
>   aucune barre oblique inverse ni caractère invisible ; rien n'a donc été
>   remplacé.

---

# Étape 2b-4 du module devis — « ce que coûte le devis » : le prix du devis lui-même, l’attestation qui expire, le franchisé au-delà du seuil — cahier v3 (16/11/2026)

> **v3 : le v2 avec les réponses du propriétaire (16/11/2026, au soir).**
> C'est CETTE version qui sert à construire. Les trois réponses suivent les
> trois recommandations ; rien d'autre ne change par rapport au v2.
>
> | question | réponse (mot pour mot, choisie dans la fenêtre de questions) | ce qu'elle impose |
> |---|---|---|
> | Q1 — le découpage | « Trois étapes (Recommandé) » | 2b-4 = le prix du devis lui-même, l'avis de l'attestation, l'avis au franchisé, la part « services à la personne » sans donnée ; 2b-5 = les déchets ; 2b-6 = le RGE |
> | Q2 — tant que rien n'est dit | « Point par prudence (Recommandé) » | le motif `devis_cout`, rang 12, nature `prudence` ; PAS une huitième règle d'Opus ; rien n'est rempli à la place de l'artisan |
> | Q3 — services à la personne | « Pas pour l'instant (Recommandé) » | une phrase dans l'aide sous le choix du prix, et « si ce devis relève des services à la personne » dans « Pas encore vérifié » ; aucune question, aucune case, aucun motif |
>
> Les questions Q4 (déchets), Q5 (RGE) et Q6 (le mot « artisan ») restent
> à poser au moment de 2b-5, 2b-6 et 2c (§1.3 bis). Les variantes écartées
> (§2.11, §3.11 et les réponses 2 à 4 de Q2) ne se construisent PAS.

> **v2 : le v1 corrigé par ses trois critiques adverses (droit, base,
> écran).** Rien n'est construit, rien n'est décidé par le propriétaire :
> les TROIS questions du §1.3 (Q1 à Q3) attendent ses réponses ; trois
> autres sont rangées pour plus tard (§1.3 bis). Le v3 portera ses
> réponses : c'est le v3 qui servira à construire. Chaque constat des
> critiques a été REVÉRIFIÉ (la ligne du dépôt, le texte de loi par
> `loi.py`, ou une mesure `node`) avant d'être décidé : l'annexe C donne,
> constat par constat, la décision et l'endroit où elle est écrite.
>
> **Relevé sur HEAD `0be3eb9`** (16/11/2026), `supabase/schema.sql` de md5
> `7376bb62912fbd2e28ecb0532937cd9d`, égal à celui de `ceb7d96` : **l'imitation
> de la vraie base pour la migration est `ceb7d96`** (DÉDUIT de l'historique
> de `schema.sql`, confirmé par la critique base ; À VÉRIFIER au relevé
> « avant » par le md5 du corps de `motifs_refus_remise` sur la vraie base,
> `comprendre/methode.md` §3 point 3). **Le CODE fait foi** : chaque numéro
> de ligne cité ici pour le dépôt a été relu le 16/11 sur HEAD.
>
> **Les sources**, toutes dans le dossier de travail
> `/tmp/claude-0/-home-user-opus-project/a2127d61-1962-51f3-a8e4-0f0b428a2023/scratchpad/lot2b4/` :
> les relevés `comprendre/` (`base.md`, `ecran.md`, `documents.md`,
> `methode.md`, et leur critique `completude.md`, dont les M1-M13, S1-S9 et
> K1-K6 sont repris ici) ; le relevé de FORME de la vraie base
> (`comprendre/vraie-base.md`) ; les quatre lectures du droit et leurs quatre
> vérifications (`droit/<sujet>.md` et `droit/<sujet>-verif.md` — **quand
> elles divergent, la vérification l'emporte**) ; les trois critiques du v1
> (`critique-v1-droit.md`, `critique-v1-base.md`, `critique-v1-ecran.md`) et
> leurs mesures (`mesures/`, `e49r-avant.txt` / `e49r-apres.txt`,
> `mod-verifier-devis.txt`, `mod-verifier-legal.txt`) ; les textes officiels
> recopiés dans `textes/` depuis l'open data LEGI (archive du 08/11/2026 et
> quotidiennes jusqu'au 16/11/2026, par `loi.py` : Légifrance répond 403 au
> conteneur). Dans ce cahier, « `textes/x.txt:n` » veut dire ce dossier-là.
> Les phrases nouvelles sont comptées par `mesures/phrases-v2.mjs`.
>
> **Les étiquettes.** ÉTABLI = lu (dépôt ou `textes/`, ligne citée) ou mesuré ;
> DÉDUIT = raisonné à partir de ce qui est lu ; SECONDAIRE = une source non
> officielle (circulaire, fiche de la DGCCRF, doctrine), avec son fichier ;
> À VÉRIFIER = ni lu ni mesuré ; (Q) = une question au propriétaire ;
> (J) = une question au juriste (§1.5). **Les trois natures d'un point** de
> « Pour le remettre » : « La loi » (un texte l'impose DANS CE CAS), « Par
> prudence » (Opus ne sait pas si le cas est celui de la loi, il compte le
> plus protecteur), « Règle d'Opus » (plus strict que la loi : une décision
> du propriétaire, il y en a sept). **Un avis** ne bloque rien, ne se calcule
> jamais en base, et se lit sous « À vérifier ». **Une aide** est un texte
> fixe sous un choix.
>
> **Méthode « Accélérer »** (décision du 08/11, CLAUDE.md) : une seule
> relecture adverse, sur le CODE, après la construction ; seul un défaut qui
> perd des données, affiche quelque chose de faux ou touche à la sécurité
> relance un tour.
>
> Ce document ne contient **aucune barre oblique inverse** : là où le code en
> porte une (une espace insécable écrite en séquence d'échappement), elle est
> dite en mots.

---

## Ce qui a changé depuis le v1

Les 53 constats des trois critiques (19 droit, 12 base, 22 écran) ont été
revérifiés : **49 retenus, 4 retenus en partie, aucun réfuté** (annexe C).
Ce qui change le plus :

1. **Les deux défauts graves de l'écran.** « Payant » sans prix tapé n'est
   plus une ERREUR : c'est « rien de dit » (vide), et c'est le point de
   « Pour le remettre » qui dit ce qui manque (ÉCRAN-1, T18) — sinon la
   garde, la rangée « Conditions » et la ligne « Pour le remettre »
   disaient « ce que vous avez écrit n'est pas enregistré » à quelqu'un qui
   n'avait rien écrit. Et « Payant » ne peut plus jamais écrire 0 : le prix
   des tarifs n'est proposé que quand les tarifs disent PAYANT (ÉCRAN-2) —
   chez le propriétaire, dont les tarifs disent « gratuit », le câblage du
   v1 aurait écrit « gratuit » sous la pastille « Payant ».
2. **Les deux défauts graves du droit.** L'avis du devis payant disait
   moins que la loi, dans le sens qui expose l'artisan : il nomme
   maintenant les quatorze jours de rétractation et le cas où le client ne
   doit rien (DROIT-1), parle aussi pour une association ou une copropriété
   (DROIT-3), et couvre le devis convenu au téléphone ou par messages. L'avis
   au franchisé affichait « 42 000,00 € HT » pour un montant TTC, avec des
   options qui n'existaient pas (mesuré) : il ne dit plus « HT », se tait
   tant que des lignes portent un taux en franchise, et sa seconde phrase
   exige une option (DROIT-2, ÉCRAN-6, T11).
3. **« Le devis lui-même » partout** où il s'agit du prix du devis et non
   du total (ÉCRAN-5, T19) : le point, le bouton, les avis, le résumé.
4. **Le bloc est le DERNIER de « Conditions »** (après « Retenue de
   garantie », avant le récapitulatif) au lieu d'une zone réservée qui
   n'aurait pas tenu (ÉCRAN-3, T17) ; une pastille déjà choisie ne se défait
   plus au second appui (ÉCRAN-4) ; le résumé de la rangée dit ce qui manque
   (ÉCRAN-15).
5. **Deux avis de plus ou corrigés** : un devis payant quand les tarifs
   AFFICHÉS disent « gratuit » (DROIT-11) ; l'avis de l'attestation nomme les
   trois façons dont un chantier peut être déjà ouvert (DROIT-8).
6. **La base** ne change pas de plan ; ses à-côtés sont précisés : les
   décors de `verifier-devis` qui doivent dire « gratuit » (BASE-1), le cas
   25 de l'essai (le 20 existait, BASE-2), les cas 10, 13, 23 et 24 décidés
   (BASE-3), les SIX `grant` de 49.7 à rejouer sans ses politiques (BASE-4),
   les deux refus de la contrainte jugés en SQL dans 49-remise (BASE-5), la
   règle de `REGLES_DEVIS` (BASE-7), les listes écrites en dur (BASE-6).
7. **Les questions** : six (P0 à P5) deviennent trois à poser maintenant
   (Q1 le découpage, Q2 le point quand rien n'est dit, Q3 les services à la
   personne), réécrites pour un débutant, et trois rangées pour plus tard
   (déchets, RGE avec la sous-traitance, le mot « artisan »). La question Q2
   gagne une quatrième réponse possible : remplir d'après les tarifs.
8. **Ce qu'on dit au propriétaire** : la sanction d'un « gratuit » trompeur
   en ligne (cinq ans, 750 000 €, DROIT-6) ; la messagerie et l'adaptation au
   vieillissement (DROIT-7) ; le mot « Artisans » déjà affiché dans Opus
   (DROIT-10).

### Ce qui change par rapport à la description d'origine (`docs/CAHIER-LOT-2B-1.md` §6, l. 637-656)

1. **Le découpage (Q1).** La description rangeait six sujets dans 2b-4. Ce
   cahier propose de n'y garder que le prix du devis, l'avis sur
   l'attestation, l'avis au franchisé et la part « services à la personne »
   qui ne demande aucune donnée ; les déchets passent en **2b-5**, le RGE en
   **2b-6**, décrits ici au niveau de la conception (§8) pour que leurs
   formes puissent être demandées le moment venu. Raison : les déchets et le
   RGE demandent beaucoup de données nouvelles et plusieurs décisions, les
   autres presque rien ; et 2b-4 ainsi découpé n'ajoute **aucune colonne de
   texte**, donc ne touche pas la classe de blancs (S7). DÉDUIT.
2. **Le prix du devis** : la description disait « gratuit (un interrupteur
   qui écrit 0), payant (un montant), pas encore dit (motif) ; proposé depuis
   « Mes tarifs » ». C'est tenu, avec trois précisions : deux pastilles
   « Gratuit » · « Payant » (rien de pré-choisi) plutôt qu'un interrupteur,
   parce qu'il y a TROIS états et qu'un interrupteur éteint dirait « payant »
   sans montant (S9) ; « Payant » sans prix tapé est « pas encore dit »
   (T18) ; et la proposition depuis « Mes tarifs » est une PHRASE plus un
   champ pré-rempli quand les tarifs disent payant — jamais une écriture sans
   appui. DÉDUIT.
3. **« Services à la personne : toujours gratuit »** devient une AIDE fixe
   sous le choix, et non une règle : Opus ne sait pas si un devis relève des
   services à la personne, et ce cahier recommande de ne pas le lui demander
   pour l'instant (Q3, §1.3). Écart à l'orientation de départ, avec sa preuve
   au §1.3.
4. **Le champ de l'arrêté de 2017** : ni question, ni changement. La
   description hésitait entre « une question par devis » et « tout imprimer
   par prudence (alors `devis_lieu` et `devis_validite` deviennent des motifs
   permanents) ». Les deux motifs SONT déjà des prudences permanentes
   (`src/lib/devis.js:3695-3700`, `:3707-3713`), et la vérification du droit
   interdit de s'en servir pour les alléger : la DGCCRF attend le lieu et la
   validité aussi hors établissement (`droit/payant-2017-sap-verif.md` §3,
   point 4 ; SECONDAIRE, `secondaire/dgccrf-2018/fiche-depannage-2018-10.txt:98-129`).
   Une question ne lèverait donc rien. DÉDUIT.
5. **Le RGE** : « ici ou au lot TVA » — ni l'un ni l'autre : une étape à
   lui, **2b-6** (Q1), parce que son déclencheur est la NATURE des travaux et
   le client, jamais un taux (`droit/rge.md` §0 points 1 et 6, confirmé au
   CIBS de 2027 par `droit/rge-verif.md` §2 point 5).
6. **Quatre avis de plus** que les deux annoncés : le devis PAYANT (convenu
   chez le particulier ou à distance), le devis payant quand les tarifs
   affichés disent « gratuit », et le devis dit GRATUIT alors que l'artisan
   déclare des frais de déplacement (L. 121-4 19°). Ils viennent des
   vérifications du droit (`droit/payant-2017-sap-verif.md` §2.1 et §2.2) et
   de la critique droit (DROIT-1, DROIT-3, DROIT-11).
7. **Le préalable « classe de blancs »** ne s'applique pas à 2b-4 (aucune
   colonne de texte) : il passe AVANT 2b-5 (S7, `completude.md` §1.2).
8. **L'adresse du client (services à la personne)** n'est pas un motif de
   2b-4 : la fonction de la base ne lit jamais `clients` (décision du 09/11,
   `supabase/schema.sql:14890-14892`), et l'adresse figée du client n'existera
   qu'avec la remise (2c). La consigne de `docs/A-FAIRE.md:3260-3263` (« Ne
   PAS ajouter l'adresse à la phrase de `devis_client` ») est tenue.

---

## 0. En une page

**Ce que 2b-4 ajoute** (si Q1 = 1, Q2 = 1, Q3 = 1 — les recommandations) :

| fait | ce que l'artisan voit | ce que la base garde |
|---|---|---|
| (a) le prix du devis lui-même | dans « Conditions », EN DERNIER (après « Retenue de garantie », avant le récapitulatif) : « Le devis lui-même : gratuit ou payant ? », deux pastilles, une phrase qui dit ce que disent ses tarifs, un champ de prix si « Payant » (pré-rempli si ses tarifs disent payant), une aide fixe | `devis.cout_devis_centimes` : vide = pas dit, 0 = gratuit, de 1 à 100 000 centimes = payant (TTC) ; contrainte `devis_cout_check` |
| (a) le point | « Par prudence — Dites si le devis lui-même est gratuit ou payant. … » au rang 12, avec « Choisir : devis gratuit ou payant », qui ouvre « Conditions » sur le bloc | rien de plus : la fonction lit la colonne |
| (a) le résumé de la rangée « Conditions » | « Devis lui-même : gratuit ou payant ? à choisir » tant que rien n'est dit, puis « Devis lui-même gratuit » ou « Devis lui-même payant 30,00 € » | rien |
| (a) trois avis | le devis payant (« Le devis lui-même est payant : convenu chez votre client, au téléphone ou par messages… ») ; payant alors que les tarifs AFFICHÉS disent gratuit ; dit gratuit alors que les tarifs comptent des frais de déplacement | rien (calculés au téléphone) |
| (d) l'attestation qui expire | un avis : « Votre attestation décennale est valable jusqu'au JJ/MM/AAAA. Si elle vaut pour l'ensemble de vos chantiers… » | rien |
| (e) le franchisé au-delà du seuil | un avis : « Ce devis atteint à lui seul X. En franchise de TVA… » (sans « HT ») | rien |
| (f) services à la personne | une phrase dans l'aide sous le choix du prix ; « Pas encore vérifié » dit « si ce devis relève des services à la personne » | rien |

**Le motif nouveau** :

| rang | clé | nature | quand |
|---|---|---|---|
| 12 | `devis_cout` | Par prudence (Q2 = 1) | `cout_devis_centimes is null` |

Seize clés sur onze rangs deviennent **dix-sept clés sur douze rangs** ; au
plus **511** motifs pour un devis (510 + 1 : toujours trois chiffres, les
gabarits FIXES de « Pour le remettre » ne bougent pas). DÉDUIT de
`comprendre/methode.md` §4 point 21, confirmé par les critiques base et écran.

**Pour le propriétaire, AUJOURD'HUI** (relevé de forme du 16/11,
`comprendre/vraie-base.md`) : ses **trois brouillons** gagnent le point
« Dites si le devis lui-même est gratuit ou payant » ; ses tarifs disent
« Mes devis sont gratuits » (`prix_devis_centimes = 0`, non affichés), donc la
carte lui dira « Dans vos tarifs : vos devis sont gratuits. » et un appui sur
« Gratuit » éteint le point, devis par devis. **L'avis (d) a un cas réel chez
lui** : un brouillon valable 60 jours, et une attestation décennale qui
finissait dans 31 à 60 jours au relevé du 12/11 (`docs/A-FAIRE.md:3635-3644` ;
À VÉRIFIER au relevé « avant », la date n'a pas été relue le 16/11). Son
régime est « réel » : l'avis (e) ne le concerne pas. Ses tarifs ne sont pas
affichés : l'avis « payant alors que vos tarifs affichés disent gratuit » ne
peut pas sortir chez lui. Aucun de ses quatre métiers n'est paysagiste.

**Ce que 2b-4 ne fait PAS** (§7) : rien n'est remis, imprimé ni numéroté
(2c) ; ni déchets, ni RGE (2b-5, 2b-6) ; aucune lecture de `tarifs_pro`,
de `clients` ni de `professional_profiles` par la base ; aucune colonne de
texte ; aucun déclencheur, aucun rattrapage, aucun code `OP` (`OP028` reste
libre).

**L'ordre de livraison** : la base (migration) d'abord, puis `git pull` — une
application nouvelle face à l'ancienne base enverrait une colonne inconnue
(PGRST204) à la première écriture du prix. Les commits de construction
portent « NE PAS FAIRE `git pull` AVANT LA MIGRATION 2b-4 ». Une application
ANCIENNE face à la base nouvelle reçoit un motif inconnu `devis_cout` : elle
garde la phrase de la base et l'affiche sans bouton (`lireMotifsDeRemise`,
`src/lib/devis.js:4334-4365` ; `endroitDuMotif`, `:4277-4292`), rien ne casse.
ÉTABLI (relu par la critique base).

**Trois questions au propriétaire maintenant** (Q1 à Q3, §1.3), trois pour
plus tard (§1.3 bis) ; et **la liste des questions au juriste** (§1.5).

---

## 1. Les décisions, et ce qui reste à demander

### 1.1 Ce qui est déjà décidé (ÉTABLI)

| décision | source | ce qu'elle impose ici |
|---|---|---|
| « Opus propose, l'artisan confirme » : aucune écriture sans appui | CLAUDE.md 2b-2 (« Oui, à titre privé ») ; `completude.md` K5 | le prix proposé depuis « Mes tarifs » est une phrase et un champ pré-rempli APRÈS un appui sur « Payant » ; rien n'est écrit avant un appui sur « Gratuit » ou « Payant » (la réponse 4 de Q2 serait une exception, à décider par lui) |
| un fait de 2b naît VIDE, et le vide est un motif ou le cas protecteur ; jamais une contrainte qui lie deux faits | `docs/CAHIER-LOT-2B-1.md:61-66` ; `supabase/schema.sql:13229-13258` (49.4 quater) | la colonne naît vide ; le vide est le motif du rang 12 ; la contrainte ne porte que sur la colonne elle-même |
| `motifs_refus_remise` : forme figée `(rang, cle, phrase, nature, ligne_id)`, `plpgsql stable security invoker` | `supabase/schema.sql:15013-15017` ; `scripts/verifier-devis.mjs:8603` | la signature ne change pas ; une branche de plus, sa forme exacte réécrite EN LE DÉCIDANT |
| la fonction ne lit JAMAIS `clients` | décision du 09/11, `supabase/schema.sql:14890-14892` ; essai 14 c, `supabase/essais-section-49-remise.sql:1067-1092` | (f) : pas de motif d'adresse du client en 2b-4 |
| la porte étroite : la fonction ne lit d'`emetteur` que le régime, d'`emetteur_assurances` que la décennale, jamais `tarifs_pro` | `scripts/verifier-emetteur.mjs:1459-1497` ; mots interdits du cas 14 c | (a) : la proposition depuis « Mes tarifs » vit À L'ÉCRAN, jamais en base |
| les règles d'Opus sont des décisions du propriétaire (sept aujourd'hui) | CLAUDE.md 2b-1 et 2b-2 | une huitième (Q2 = 2) ne se pose que sur sa réponse |
| aucune question sur le moment de la signature (le cas le plus protecteur pour tous) | décision du 09/11, CLAUDE.md 2b-2 | (a) : on ne demande pas où le devis sera signé ; la mention de 2017 (4-I) se compte par prudence |
| une association, une copropriété, une société civile comptent « comme un particulier », par prudence | décision du 09/11 ; `AIDE_NATURE_ACOMPTE_PRUDENCE`, `src/lib/devis.js:2308-2311`, choisie pour `non_professionnel` à `:2353` | l'avis du devis payant parle AUSSI pour `non_professionnel` (DROIT-3) ; la question RGE de 2b-6 aussi (DROIT-9) |
| « jamais le métier » pour décider | `docs/CAHIER-LOT-2B-1.md:478` ; `docs/PLAN-DEVIS.md:2859` | (f), déchets, RGE : un métier peut ordonner une proposition, jamais décider |
| `devis.js` importe EXACTEMENT trois fichiers | `scripts/verifier-devis.mjs:1397-1405` | (d) : le quatrième import (`./formats.js`) se décide (§1.2, T8) |
| `devis.js` n'écrit « € » qu'aux deux amendes | `scripts/verifier-devis.mjs:1416-1436` | (a), (e) : tout montant passe par `centimesLisibles` |
| une phrase de motif : aucun chiffre, « € », apostrophe droite, insécable ni barre (sauf « 8e »), un point final, 200 caractères au plus, une phrase | `scripts/verifier-devis.mjs:8714-8719`, `:11190` ; `src/lib/devis.js:5067` | la phrase de `devis_cout` (197 caractères, mesuré par `mesures/phrases-v2.mjs`) |
| une prudence qui cite la loi dit « Opus ne sait pas encore » ; une règle d'Opus finit par « Opus le demande pour tous vos devis. » | `scripts/verifier-devis.mjs:8702-8703` | la phrase de `devis_cout` selon Q2 |
| les avis vivent dans `devis.js`, jamais en base ; un avis qui dépend d'un montant ou de la liste se tait tant qu'elle n'est pas sûre | `src/lib/devis.js:4386-4404` (critiques B6, PAR-8) | (e) et l'avis du devis payant attendent la liste sûre |
| « le prix du devis » se lit comme le TOTAL : on dit « le devis lui-même » | relecture TXT-2 de 2b-1, `src/lib/devis.js:4486-4489` | tous les textes nouveaux du prix du devis (ÉCRAN-5, T19) |
| le résumé de la rangée « Conditions » et « Pour le remettre » ne se contredisent pas : ce qui MANQUE vient en tête du résumé | décision E-12 de 2b-1, `src/lib/devis.js:2880-2913` | le résumé dit « Devis lui-même : gratuit ou payant ? à choisir » (ÉCRAN-15) |
| « remise » interdit à l'écran pour une réduction | CLAUDE.md lot 2a | aucun texte nouveau ne dit « remise » sauf « remettre ce devis » (le geste) |
| `verifier-tarifs`, vérification 37 : un 0 de `prix_devis_centimes` ne s'écrit que dans `tarifsDepuisFormulaire` | `scripts/verifier-tarifs.mjs:1315-1330` | la colonne du devis ne s'appelle pas `prix_devis_centimes` (M4) ; et une garde jumelle pour `coutDevisCentimes` (ÉCRAN-2) |
| « Accélérer » : une relecture | décision du 08/11 | §5 |
| aucune prime déduite sur un devis, jamais | réponse du 21/10, `docs/PLAN-DEVIS.md:3575` (cité par `droit/rge.md` §5 (i)) | 2b-6 : l'obligation RGE naît des travaux, pas d'une aide déduite |
| la garde « jamais le RGE comme condition d'un taux de TVA » | `docs/PLAN-DEVIS.md:2196-2200` (cité par `droit/rge.md` §4) | 2b-6 ; elle tient au CIBS de 2027 (`textes/ordonnance-2026-671-annexeA-L213-247.txt:5-6`, `droit/rge-verif.md` §2 point 5) |

### 1.2 Ce que ce cahier tranche lui-même (choix techniques)

| # | choix | raison | écarté |
|---|---|---|---|
| T1 | une colonne **`cout_devis_centimes`** sur `devis`, trois états dans une seule colonne : vide, 0, un montant | le modèle de `tarifs_pro.prix_devis_centimes` (lot T), lu partout de la même façon ; et le nom évite la vérification 37 de `verifier-tarifs` (M4) | `prix_devis_centimes` (refusé par la vérification 37) ; un booléen `gratuit` plus un montant (deux colonnes liées par une contrainte : la saisie à mi-chemin refusée) |
| T2 | en **centimes TTC**, de 0 à 100 000 (1 000,00 €), comme `tarif_devis_check` (`supabase/schema.sql:12004-12006`) | c'est ce que paie le client, et la convention des tarifs (lot T) : la proposition se recopie sans conversion | un prix HT (il faudrait un taux, et l'arrêté de 2017 parle de prix TTC, `textes/arrete-2017-01-24-complet.txt:22-26`) |
| T3 | le **0 ne s'écrit que par la pastille « Gratuit »** ; « 0 » tapé dans le champ est refusé avec sa phrase ; « Payant » n'écrit JAMAIS 0, quoi que disent les tarifs | la règle du lot T (« le 0 d'un prix de devis ne s'écrit QUE par un interrupteur ») : un champ qui accepterait 0 ferait dire « gratuit » à un artisan qui a seulement tapé un zéro ; une proposition « gratuite » sous « Payant » aussi (ÉCRAN-2) | accepter 0 tapé |
| T4 | le motif au **rang 12**, après la décennale | renuméroter les rangs existants changerait les 125 attendus de `cas-remise.json` ; le rang n'est qu'un ordre d'affichage | le placer au rang 6 bis (il n'existe pas de demi-rang) |
| T5 | le prix du devis est **hors des totaux** et de `devis_tva` ; son imputation sur les travaux (« déduit si vous acceptez ») n'est pas modélisée ; l'aide le DIT (« Ce prix ne s'ajoute pas au total des travaux. ») | c'est le prix d'un AUTRE contrat que les travaux (DÉDUIT de `textes/conso-L221-1.txt:17`, cité par `droit/payant-2017-sap-verif.md` §2.2) ; l'imputation et le taux de TVA du devis payant sont des questions de 2c et du juriste (J13, J50) ; le bloc est juste au-dessus du récapitulatif, d'où la phrase | une ligne « Établissement du devis » dans le chiffrage |
| T6 | **aucune lecture de `tarifs_pro` en base** : la proposition se calcule à l'écran, depuis `tarifs` que la saisie reçoit déjà (`src/screens/SaisieDevisScreen.js:595`, `src/OpusApp.js:5323`) | la porte étroite et les deux listes fermées des lecteurs de `tarifs_pro` (K6) ; un motif ne dépend que de ce que le devis porte | un motif « vos tarifs disent payant, ce devis dit gratuit » |
| T7 | les avis dans `avisDuDevis`, avec trois entrées de plus — `regime`, `assurances`, `tarifs`, **`undefined` par défaut** (« pas transmis » : on se tait) — et `jour` (par défaut celui du téléphone) | la règle B6 ; `null` veut déjà dire « non déclaré » pour le régime et « lus, aucune ligne » pour les tarifs (`tarifsConnus(null)`, `src/lib/devis.js:3490-3494`) : le piège que `client = undefined` évite déjà (`:4419`, ÉCRAN-16) ; l'appel unique est figé par `scripts/verifier-devis.mjs:10396-10397` et se réécrit EN LE DÉCIDANT | un avis d'entreprise (`avisEmetteur`) pour (e) : il ne voit aucun devis (K1) |
| T8 | **un quatrième import dans `devis.js` : `joursEntre` depuis `./formats.js`** | `formats.js` n'importe RIEN (relu le 16/11 : aucune ligne `import`, confirmé par la critique écran), donc `node` fait toujours tourner `devis.js` ; `joursEntre` compte par `Date.UTC`, sans fuseau (`src/lib/formats.js:184-197`) — une seconde écriture de l'arithmétique des jours dans `devis.js` serait la faute que le projet traque | une copie locale de `joursEntre` |
| T9 | les **assurances** arrivent à la saisie par la MÊME lecture que le régime (`monRegimeEtSaDate`, qui lit déjà toute la fiche, `src/lib/api.js:3594-3600`, `:2178-2212`), et se relisent à la fermeture de « Mon entreprise » | aucune lecture nouvelle ; c'est là que l'artisan change sa date de fin (`comprendre/ecran.md` d1). Ce que ça coûte : deux vérifications de `verifier-postes` (`:1935-1945`) se réécrivent EN LE DÉCIDANT (T20) | une lecture à part (`mesAssurances()`) : trois requêtes de plus à chaque relecture du régime |
| T10 | les plafonds de la franchise écrits **une fois**, en centimes, avec leur source et la date de leur relecture (`PLAFONDS_FRANCHISE`) | « trois versions en 2025 » (`droit/franchise-attestation.md` §1.8) ; la règle « € » | les écrire dans la phrase |
| T11 | (e) parle si le régime est « franchise », la liste SÛRE, et **aucune ligne ne contredit la franchise** (`coherenceRegime(lignes, regime) === null`, `src/lib/devis.js:2040-2064`) ; puis : le total net hors options de la BASE (`totaux.ht`) au-delà de **37 500 €** → la première phrase ; sinon, s'il y a AU MOINS UNE OPTION parmi les lignes et que le total toutes options (`totaux.ttcOptions`) dépasse ce seuil → la seconde. **Jamais le mot « HT »** dans ces phrases | avec la garde de cohérence, aucune ligne ne porte de taux non nul, donc `ttcOptions` vaut exactement le net plus les options (`tvaDe(base, null)` rend `null`, compté zéro : `src/lib/devis.js:492-496`, `:1137`) — la déduction « TTC = HT » du v1 n'est vraie QUE dans ce cas (DROIT-2, mesuré : sans la garde, 35 000 € à 20 % sans option faisaient dire « Avec ses options, ce devis atteint 42 000,00 € HT ») ; en franchise, l'écran ne nomme pas la taxe (`libellesDesTotaux`, `:2095-2118`, ÉCRAN-6) ; `droit/franchise-attestation.md` §1.8 (« un seul niveau, une seule phrase qui dit les deux plafonds »), jugé juste par sa vérification | 41 250 € seul (K2 : le plus haut ne dit pas le cas du 1er janvier) ; additionner à la main les options des lignes de l'écran aux totaux de la base (deux sources) |
| T12 | **aucune question sur le champ de l'arrêté de 2017** | voir « Ce qui change par rapport à la description d'origine », point 4 | une question par devis (elle ne lèverait aucun motif) |
| T13 | la démonstration donne une valeur EXPLICITE au prix de « Muret de clôture » (0, gratuit) et de « Terrasse en bois » (3 000, payant), et laisse vide (`null` ÉCRIT) celui de « Rénovation salle de bains » et de « Sol du séjour » | « Muret » reste à « rien ne manque » et « aucun avis » ; « Terrasse » garde ses deux points ; le point nouveau se voit sans `.env` ; l'avis du devis payant se voit sur « Terrasse » (Mme Martin commande à titre privé) | tout laisser vide (les deux brouillons de 2b-1 changeraient de sens) |
| T14 | **l'aperçu de l'en-tête de « Mon entreprise » ne change pas** (M1) | le prix d'un devis est un fait DU DEVIS, pas de l'entreprise ; `enteteImprime()` n'imprime que l'entreprise (`src/lib/emetteur.js:1404-1520`). Où 2c imprimera la mention est une décision de 2c | l'ajouter à l'en-tête |
| T15 | **le résumé de la rangée « Conditions » le dit** : en TÊTE, après « Validité à choisir », « Devis lui-même : gratuit ou payant ? à choisir » tant que rien n'est dit ; en FIN, « Devis lui-même gratuit » ou « Devis lui-même payant {montant} » | la décision E-12 (le résumé dit d'abord ce qui MANQUE, `src/lib/devis.js:2880-2913`) : un résumé qui ne dirait rien ferait croire les conditions complètes sous un point qui dit le contraire (ÉCRAN-15 — le v1 l'écartait sur une raison fausse, « coupé à deux lignes ») | se taire dans le résumé |
| T16 | les avis qui dépendent de la BASE (le franchisé, le devis payant qui lit `reponseVue`) attendent la liste sûre ; ceux qui ne dépendent que de l'artisan (l'attestation, le gratuit avec déplacement, le payant face aux tarifs affichés) suivent l'écran, comme `avis_objet` | la règle PAR-8 de 2b-1 (`src/lib/devis.js:4397-4404`) | tout attendre (l'avis de l'attestation disparaîtrait pendant chaque écriture) |
| T17 | **le bloc est le DERNIER de la carte « Conditions »** : après « Retenue de garantie », avant le récapitulatif des totaux ; AUCUNE zone réservée | une zone réservée ne tient pas ici : le champ n'est monté qu'avec « Payant », il faudrait réserver libellé, champ et erreur (de l'ordre de 110 points, DÉDUIT des styles), et la carte interdit tout élément rendu invisible (`CACHENT`, `scripts/verifier-devis.mjs:7870-7880`). En dernier, toucher « Gratuit » ou « Payant » ne déplace que le récapitulatif, qui n'est pas une cible — exactement ce que fait déjà l'interrupteur de la retenue (ÉCRAN-3). Le titre reste un enfant DIRECT du contenu défilant (son ancre `ancre('cout')` lit une position relative au parent, `src/components/ConditionsDevis.js:123-127`) | après « Validité de l'offre » avec une zone réservée (le v1) ; un trou de 110 points sous « Gratuit » |
| T18 | **« Payant » sans prix = rien de dit (vide), sans erreur** ; une pastille déjà choisie ne se défait pas au second appui ; un `choix` qui ne porte pas `cout` n'écrit rien | dans la même carte, un montant vide « dit rien » (`versMontantDeDevis('')` rend `{ ok: true, centimes: null }`, mesuré) et dans les tarifs aussi (`src/lib/emetteur.js:517-526`) ; une erreur devenait un REFUS d'en-tête (`src/screens/SaisieDevisScreen.js:1314-1328`), et la garde disait « ce que vous avez écrit n'est pas enregistré » à quelqu'un qui n'avait rien écrit (ÉCRAN-1). Toucher une pastille déjà choisie « pour valider » est un geste courant : comme la nature et l'échéance (`ConditionsDevis.js:348-371`), il ne change rien (ÉCRAN-4). Conséquence assumée : une carte rouverte sur un « Payant » resté sans prix ne montre aucune pastille choisie | une erreur « Écrivez le prix du devis » (le v1) ; la pastille retouchée qui défait le choix (le v1, sur le modèle de la validité) |
| T19 | **« le devis lui-même »** dans le point, le bouton, les avis, le résumé, l'aide, les noms de la garde | la confusion avec le TOTAL, corrigée par la relecture TXT-2 de 2b-1, revenait (ÉCRAN-5) : le point vit sous « Ce devis », au-dessus d'un total, et `avis_gratuit` (le TOTAL à 0) peut sortir à côté | « ce devis est gratuit » |
| T20 | `monRegimeEtSaDate` rend `{ regime, declareLe, assurances }` : `regimeEtSaDate(f)` ne change pas (il rend toujours `{ regime, declareLe }`, `monRegime` aussi), et une fonction pure nouvelle `assurancesDe(f)` (une liste, ou `null`) s'y ajoute | `verifier-postes` fige le corps de `monRegimeEtSaDate…` (`scripts/verifier-postes.mjs:1935-1945`) et le fait que `lireRegime` l'appelle (`:2430-2433`) : la première vérification se réécrit EN LE DÉCIDANT, la seconde reste vraie (ÉCRAN-8). Garder le NOM évite de toucher `lireRegime` et la seconde vérification ; le commentaire de la fonction dit les trois | une fonction nouvelle au nom qui dit les trois (deux vérifications et `OpusApp` à réécrire) |

### 1.3 Les questions au propriétaire — à poser MAINTENANT (trois)

Écrites pour lui : un débutant qui n'a pas lu ce cahier. Chaque question se
comprend seule, sans nom de colonne, sans « motif », sans numéro d'article ;
la réponse recommandée vient d'abord, avec sa raison ; chaque réponse dit ce
qu'elle change sur ses devis et à l'écran. Elles sont recopiées mot pour mot
dans le compte rendu de ce cahier, pour être posées telles quelles.

Le format : la question, son contexte (deux à quatre phrases), puis les
réponses possibles, la recommandée en premier ; pour chacune, un intitulé et
UNE phrase qui dit pourquoi (pour la recommandée) et ce qu'elle change pour
lui, sur ses devis et à l'écran.

**Q1 — Comment découper la fin du travail sur le contenu des devis ?**

> Avant qu’Opus puisse imprimer et envoyer vos devis, il reste trois sujets :
> dire si le devis lui-même (le fait de l’établir, pas les travaux) est
> gratuit ou payant ; les déchets du chantier (sur presque tous vos devis,
> la loi demande combien de déchets, comment ils sont triés, où ils sont
> déposés et ce que cela coûte) ; et le label RGE, pour les travaux
> d’économies d’énergie dans un logement. Les deux derniers demandent
> beaucoup d’informations nouvelles et plusieurs choix de votre part.

1. **Trois petites étapes (recommandé)** — D’abord « gratuit ou payant »
   avec deux avertissements (votre attestation décennale qui arrive à sa
   fin, le plafond de la franchise de TVA), puis les déchets, puis le RGE :
   chaque étape reste petite et vous l’essayez sur votre iPhone avant la
   suivante, et l’impression des devis vient après la troisième.
2. **Une seule grande étape** — Les trois sujets ensemble : une seule mise
   à jour à essayer, mais beaucoup de nouveautés d’un coup, relues une seule
   fois, donc un défaut a plus de chances de passer.
3. **Deux étapes** — « Gratuit ou payant » d’abord, puis les déchets et le
   RGE ensemble : une mise à jour de moins, mais la seconde est lourde et
   mélange deux sujets sans rapport.

**Q2 — Tant que vous n’avez pas dit si le devis lui-même est gratuit ou
payant, que doit faire Opus ?**

> Dans « Conditions », vous direz pour chaque devis si le devis lui-même est
> gratuit ou payant ; si vos tarifs le disent déjà, Opus vous le rappelle, et
> si vous touchez « Payant », il remplit le prix de vos tarifs (vous pouvez
> le changer). La loi oblige à l’écrire sur le devis au moins pour un
> dépannage, une réparation ou un entretien signé dans vos locaux ; ailleurs,
> l’administration l’attend aussi, et un juriste doit le confirmer. Opus ne
> sait pas où vos devis seront signés.

1. **Un point « Par prudence » (recommandé)** — Un point « Dites si le devis
   lui-même est gratuit ou payant » s’affiche dans « Pour le remettre » sur
   chaque devis, vos trois brouillons compris, jusqu’à ce que vous répondiez
   (un appui sur « Gratuit » suffit) ; c’est exact sans être une règle de
   plus, et plus tard un devis qui porte encore ce point ne pourra pas être
   envoyé.
2. **Un point « Règle d’Opus »** — Le même point et le même blocage, mais
   présenté comme une règle qu’Opus impose sur tous vos devis (ce serait la
   huitième).
3. **Seulement un rappel, sans point** — Une phrase sous « À vérifier » qui
   ne bloque rien : vous n’êtes pas obligé de répondre, mais un devis
   pourrait partir sans dire s’il est gratuit ou payant, y compris là où la
   loi le demande.
4. **Remplir tout seul d’après vos tarifs** — Opus mettrait « Gratuit » sur
   chaque nouveau devis sans vous le demander, puisque vos tarifs le disent :
   aucun appui à faire, mais Opus écrirait à votre place (ce qu’il ne fait
   jamais aujourd’hui) et un devis que vous vouliez payant partirait
   « gratuit » si vous oubliez de le changer.

**Q3 — Les « services à la personne » : Opus doit-il savoir si un devis en
fait partie ?**

> Certains petits travaux chez un particulier comptent comme des « services
> à la personne » : l’entretien courant d’un jardin, à hauteur d’homme ; les
> petits travaux de bricolage de moins de deux heures (fixer une étagère,
> poser des rideaux) ; peut-être aussi remplacer un joint ou poser un lustre.
> Pour eux, le devis est toujours gratuit, et il doit porter des informations
> qu’Opus n’a pas encore (l’adresse du client, votre numéro de déclaration si
> vous en avez un). Les travaux du bâtiment — maçonnerie, couverture, façade,
> et la plomberie ou l’électricité au-delà de ces petites interventions —
> n’en font pas partie.

1. **Pas pour l’instant (recommandé)** — Une phrase sous « gratuit ou
   payant » rappelle que, pour ces services, le devis est toujours gratuit :
   rien de plus à remplir, puisque vos devis et presque tous ceux d’Opus sont
   des travaux du bâtiment, mais un devis payant pour un petit travail chez un
   particulier ne serait signalé que par cette phrase.
2. **Une case dans « Mon entreprise », puis une question par devis** — Ceux
   qui cochent « Je propose des services à la personne » voient sur chaque
   devis « Ce devis porte-t-il sur des services à la personne ? », et Opus
   empêche d’envoyer un tel devis s’il est payant : rien ne change pour vous
   si vous ne cochez pas, mais c’est environ une étape de travail de plus
   avant l’envoi des devis.
3. **Une question sur chaque devis, pour tous** — Une question de plus sur
   chacun de vos devis, presque toujours « Non ».

**Ce qui n'est PAS demandé** : le nom de la colonne, ses bornes, la place du
bloc dans « Conditions » (T17), le comportement de « Payant » sans prix
(T18) ; la promesse des conditions d'utilisation sur « le prix de vos
devis » (elle devient vraie, §4) ; l'imputation du prix du devis sur les
travaux et son taux de TVA (au juriste, J13 et J50, et à 2c).

**Les preuves derrière les recommandations** (pour le cahier, pas pour lui) :

- **Q2.** « au moins » et non « dans un seul cas » : la chaîne L. 221-9 →
  L. 221-5 2° → L. 112-1 → arrêté du 24/01/2017 art. 2 peut faire entrer la
  mention dans le contrat hors établissement (`droit/payant-2017-sap-verif.md`
  n° 19 et §3 point 3 ; `textes/conso-L221-9.txt:7`, `textes/conso-L221-5.txt:9`),
  et la DGCCRF l'attend (SECONDAIRE) — J3. Le v1 disait « dans un seul cas »
  et « le devis écrit est la preuve » : faux pour un devis PAYANT, dont le
  prix se dit avant que le client le commande (L. 111-1 2°, pour le contrat
  de devis lui-même), donc avant que le devis existe (DROIT-4, DÉDUIT). La
  réponse 4 contredit la règle « Opus propose, l'artisan confirme » (§1.1) :
  elle n'est offerte que parce que c'est à lui d'en décider.
- **Q3, l'écart à l'orientation de départ** (qui proposait un motif « la
  loi » pour un devis payant de services à la personne) : (1) l'arrêté de
  2015 vise l'ACTIVITÉ offerte, déclarée ou non
  (`textes/arrete-2015-03-17-complet.txt:5`, `:52` « si elle a été faite »),
  ÉTABLI ; (2) l'administration exclut du « petit bricolage » « les activités
  de construction, d'entretien et de réparation des bâtiments, qui
  correspondent à des métiers de gros œuvre, de second œuvre et de finition
  du bâtiment », mais ADMET « des interventions élémentaires sur des
  équipements domestiques utilisant des fluides … remplacer un joint, poser
  un lustre » ; et le petit jardinage n'est que l'entretien courant « à
  hauteur d'homme », sans monter dans l'arbre, à l'exclusion de « la
  conception et la réalisation de parcs paysagers » (SECONDAIRE,
  `secondaire/circ-2025/circ-03-01-2025.txt:467-477`, `:497-505`) ; (3) aucune
  des huit fiches de la vraie base ne porte `paysagiste`, mais elle compte
  un plombier et un électricien (`comprendre/vraie-base.md`) — le v1 disait
  « 100 % des artisans d'aujourd'hui » et rangeait les élagueurs parmi les
  métiers concernés : les deux sont retirés (DROIT-5) ; (4) trois des douze
  mentions de l'art. 7 n'ont aucune donnée dans Opus (§2.10). Un motif « la
  loi » sans savoir QUAND il s'applique serait faux pour presque tous les
  artisans d'aujourd'hui, ou exigerait la réponse 2. DÉDUIT. Le devis n'est
  OBLIGATOIRE qu'à partir de 100 € TTC par mois ou à la demande du client ;
  quand il est fourni, il est toujours gratuit
  (`textes/arrete-2015-03-17-complet.txt:41-42`) : la question le dit ainsi
  (DROIT-15).

### 1.3 bis Les questions à poser PLUS TARD (au moment de 2b-5, de 2b-6, de 2c)

Écrites dès maintenant, dans la même forme, pour que la conception de 2b-5
et 2b-6 (§8) puisse les suivre. Si la réponse à Q1 n'est pas « trois
étapes », elles remontent au moment de l'étape qui les porte.

**Q4 (avant 2b-5) — Les déchets de chantier : sous quelle forme ?**

> Sur presque tous vos devis (construction, rénovation, démolition,
> jardinage), quel que soit le client, la loi demande quatre informations :
> combien de déchets (une estimation), comment ils sont triés et enlevés,
> où ils sont déposés (le nom, l’adresse et le type de chaque endroit), et
> combien cela coûte (une estimation). Jusqu’à 3 000 € d’amende (15 000 €
> pour une société).

1. **Vos lieux de dépôt rangés une fois, puis une petite carte par devis
   (recommandé).** Dans « Mon entreprise », la liste des endroits où vous
   déposez vos déchets ; sur chaque devis, une carte « Déchets » : la
   quantité, les tris (des cases à cocher), le ou les lieux choisis dans
   votre liste, et le coût estimé (qui ne s’ajoute pas au total : si vous le
   faites payer, c’est une ligne du devis, comme aujourd’hui). Et une
   question « Ces travaux produisent-ils des déchets ? », « Oui » tant que
   vous n’avez rien dit. *Pourquoi :* vous déposez presque toujours aux
   mêmes endroits ; rien n’est retapé, et Opus vérifie que les quatre
   informations y sont. *Ce que ça change :* la plus grosse des trois
   étapes ; vos trois brouillons gagneront un point « déchets ».
2. **Un texte libre par devis, que vous écrivez vous-même.** *Ce que ça
   change :* rien à ranger, mais Opus ne peut pas vous dire qu’une des
   quatre informations manque.
3. **Comme la réponse 1, avec en plus une ligne « Évacuation des déchets »
   obligatoire** (offerte si vous ne la faites pas payer). *Ce que ça
   change :* une ligne de plus dans chaque devis ; cela ressemble à vos
   anciens devis (« Nettoyage et évacuation des gravats — offert »).

**Q5 (avant 2b-6) — Le label RGE : sous quelle forme ?**

> Pour des travaux d’énergie dans un logement (isolation, chauffage, eau
> chaude, ventilation, fenêtres, énergie renouvelable), quand les aides de
> l’État demandent un label, le devis à un particulier doit dire si vous
> êtes RGE ou non, et joindre le justificatif si vous l’êtes. Et si vous
> confiez une partie de ces travaux à un sous-traitant, le devis doit le
> dire, avec son nom et son label. Sinon : contrat nul, et jusqu’à 15 000 €
> d’amende (75 000 € pour une société).

1. **Deux questions par devis, posées seulement pour un particulier (ou
   une association, une copropriété) (recommandé)** : « Ces travaux
   portent-ils sur l’énergie d’un logement ? » et, si oui, « Confiez-vous
   une partie de ces travaux à un sous-traitant ? » ; et, dans « Mon
   entreprise », votre label (oui ou non, pour quels travaux, le
   justificatif). *Pourquoi :* les mentions ne sortent que sur les devis
   concernés. *Ce que ça change :* une ou deux questions de plus sur vos
   devis à un particulier.
2. **Seulement « Mon entreprise »**, et Opus met la mention RGE sur tous vos
   devis à un particulier. *Ce que ça change :* une mention hors sujet sur
   une toiture refaite sans isolation, et rien sur la sous-traitance.
3. **Ne rien faire pour l’instant.** *Ce que ça change :* le jour où un de
   vos devis porte sur de l’isolation, le contrat peut être nul.

**Q6 (avant 2c) — Le mot « artisan » sur vos devis imprimés.**

> Le mot « artisan » (et « maître artisan ») est réservé, par la loi, à
> ceux qui en ont la qualité, inscrite au registre des métiers ; s’en
> servir sans l’avoir est puni d’une amende de 7 500 €.

1. **Jamais pour l’instant (recommandé).** Le devis n’imprime pas ce mot
   comme titre ; on l’ajoutera, avec une case qui vous engage, le jour où
   un artisan le demande. *Pourquoi :* aucune information à demander, aucun
   risque. *Ce que ça change :* votre devis ne dira pas « Artisan ».
2. **Avec une case dans « Mon entreprise »** (« J’ai la qualité
   d’artisan » / « de maître artisan ») ; le devis l’imprime seulement si
   elle est cochée. *Ce que ça change :* une information de plus, et une
   déclaration qui vous engage.

Les sources : Q4, §8.1 ; Q5, §8.2 (L. 224-114, L. 224-115, L. 242-51 II,
`textes/conso-L242-51.txt:9`, DROIT-9) ; Q6, code de l'artisanat L. 241-1 et
L. 241-2 (`textes/artisanat-L241-1.txt:5`, `textes/artisanat-L241-2.txt:5`,
ÉTABLI, DROIT-10 — le v1 les disait « non relus »).

### 1.4 À dire au propriétaire, pas à lui demander

1. **La messagerie d'Opus et certains travaux.** Depuis le 02/07/2025, la
   prospection d'un particulier « par message sur un service de
   communications interpersonnelles, par courrier électronique ou sur un
   service de réseaux sociaux » est interdite pour des travaux sur un
   logement « en vue de la réalisation d'économies d'énergie, de la
   production d'énergie renouvelable ou de leur adaptation au vieillissement
   ou au handicap » (`textes/conso-L223-8.txt:5`) : contrat nul, amende
   jusqu'à 75 000 € (personne physique) ou 375 000 € (personne morale)
   (`textes/conso-L242-16-1.txt:5`, `:9`). ÉTABLI. L'adaptation au
   vieillissement (une douche à l'italienne, des barres d'appui) touche les
   plombiers, carreleurs et maçons d'Opus (DROIT-7). La messagerie d'Opus, où
   un pro peut écrire le premier à un particulier, ressemble exactement à ce
   canal (J46). Hors du devis.
2. **France Rénov' sur toute publicité de rénovation énergétique.** Depuis
   le 02/07/2025 (la loi) : « Tout support de promotion ou de publicité
   proposant des travaux de rénovation énergétique fait mention de
   l'existence et du rôle du service public de la performance énergétique
   de l'habitat », et un site qui propose ces travaux porte un lien vers lui ;
   amende jusqu'à 15 000 € / 75 000 € (`textes/conso-L122-26.txt:5`, `:9`,
   `:11`). Depuis le 01/10/2026 (l'arrêté), le message est fixé mot pour mot
   (`textes/arrete-2026-07-07-spphe-complet.txt:50`), en ligne
   « simultanément au message publicitaire » (`:31`). ÉTABLI (DROIT-13). La
   fiche d'un artisan qui propose de l'isolation, et ses publications, sont
   peut-être des « supports de promotion » (J47). Hors du devis.
3. **« Devis : gratuit » sur la fiche publique, à côté des frais de
   déplacement.** Le bloc « Ses tarifs » (lot T) montre aux particuliers
   « Prix du devis : Gratuit » et le prix du déplacement. La loi répute
   trompeur de dire « gratuit » si le client doit payer autre chose que les
   coûts inévitables (`textes/conso-L121-4.txt:49`), pour tout client
   (`textes/conso-L121-5.txt:5`) : délit, deux ans et 300 000 €, **portés à
   cinq ans et 750 000 € quand la pratique passe par un service en ligne ou
   un support numérique** — ce qui est sans doute le cas du bloc « Ses
   tarifs » (DÉDUIT) —, et une amende qui peut être proportionnelle au
   chiffre d'affaires (`textes/conso-L132-2.txt:5`, `:7`, `:9`, ÉTABLI ;
   DROIT-6). Un déplacement facturé pour établir un devis « gratuit » est-il
   un coût inévitable ? (J12). 2b-4 en tire un avis sur le DEVIS ; le bloc
   public, lui, ne change pas (§7).
4. **Le point « attestation décennale » de 2b-3 protège un peu trop.** Il juge
   l'attestation au jour de la remise ; or l'attestation qui compte est celle
   en vigueur à l'ouverture de l'OPÉRATION (« à date unique applicable à
   l'ensemble de l'opération de construction »,
   `textes/assurances-A243-1-annexe-I.txt:31`). Un artisan qui rejoint un
   chantier déjà ouvert pendant la validité d'une attestation désormais
   expirée peut avoir la bonne attestation et se voir demander la nouvelle.
   C'est dans le sens prudent (`droit/franchise-attestation-verif.md` §2,
   point 1) ; à confirmer (J24). Rien ne change en 2b-4.
5. **La franchise** : Opus ne connaît pas votre chiffre d'affaires ; l'avis
   (e) ne regarde qu'UN devis et le dit. Il ne parle qu'au-delà du plafond
   entier : la première année d'une entreprise, où le plafond est réduit à
   proportion de l'année restante (environ 10 400 € pour une création au
   1er octobre, `textes/cgi-293-D.txt:25`, `droit/franchise-attestation-verif.md`
   n° 11), le cas le plus exposé ne reçoit aucun avis (DROIT-18).
6. **Vos trois brouillons** gagnent le point du prix du devis (§0).
7. **Votre attestation décennale** : si elle finit avant que votre brouillon
   valable 60 jours puisse être accepté, l'avis (d) vous le dira ; c'est le
   geste noté dans `docs/A-FAIRE.md:3635-3644`.
8. **La main-d'œuvre hors établissement** (taux horaire et temps estimé) est
   close depuis le lot 1 (`completude.md` S2) ; rien ne reste pour 2b-4.
9. **Le mot « Artisans » est déjà affiché dans Opus**, pour tous les
   professionnels : l'onglet « Artisans » des particuliers
   (`src/OpusApp.js:4539`) et le filtre « Artisans vérifiés seulement »
   (`src/components/FeuilleRecherche.js:166`, `:171`), architectes et
   bureaux d'études compris. Or seuls ceux qui en ont la qualité « peuvent
   utiliser le mot : « artisan » et ses dérivés pour l'appellation,
   l'enseigne, la promotion et la publicité » (`textes/artisanat-L241-1.txt:5`),
   et l'usage sans la qualité est puni de 7 500 € d'amende
   (`textes/artisanat-L241-2.txt:5`). ÉTABLI pour les textes ; qu'une
   plateforme qui range tous les pros sous « Artisans » en fasse un usage
   « pour la promotion » de leurs prestations, et qui en répondrait, est une
   question de droit (J49, DROIT-10). Hors du devis.
10. **Si la fiche Opus d'un artisan est son « espace de communication en
    ligne »**, les informations de l'arrêté de 2017 (taux horaire, frais de
    déplacement, prix du devis…) doivent y être « aisément accessibles »
    (`textes/arrete-2017-01-24-complet.txt:34`) : afficher ses tarifs, facultatif
    depuis le lot T, deviendrait dû pour un artisan de dépannage, de
    réparation ou d'entretien (J11, DROIT-19). Hors du devis.

### 1.5 Au juriste (n'empêche pas de construire : rien ne sort avant 2c)

Repris des rapports de droit, de leurs vérifications et de la critique droit
du v1 ; l'identifiant d'origine est entre crochets.

**Le prix du devis, l'arrêté de 2017, les services à la personne**
(`droit/payant-2017-sap.md` §8, `droit/payant-2017-sap-verif.md` §2 et §3) :

- **J1** [Q-J6] L'art. 4-I dit « client » (`textes/arrete-2017-01-24-complet.txt:39`),
  l'art. 2 « consommateur » (`:20`) : le devis détaillé et ses dix mentions
  sont-ils dus à une association, une copropriété, une SCI, un petit ou un
  grand professionnel ?
- **J2** [2] Un devis payant convenu chez le client est-il un contrat hors
  établissement à part entière (`textes/conso-L221-1.txt:17`) ? Si oui : écrit
  sur papier signé ou, avec l'accord du client, sur un autre support durable,
  avec le formulaire de rétractation, à peine de nullité
  (`textes/conso-L221-9.txt:5-11`, `textes/conso-L242-1.txt:5`) ; aucun
  paiement ni aucune contrepartie avant le 8e jour (`textes/conso-L221-10.txt:5`,
  L. 242-7) ; quatorze jours de rétractation (`textes/conso-L221-18.txt:5`) ;
  rien n'est dû si le devis est remis avant la fin du délai sans la demande
  expresse écrite du client (`textes/conso-L221-25.txt:5`, `:9`), sauf service
  pleinement exécuté avec son accord exprès et la reconnaissance de la perte
  de son droit (`textes/conso-L221-28.txt:6`) ; et convenu au téléphone (arrêté
  du 03/12/1987, art. 14, `textes/arrete-1987-12-03-complet.txt:114-118`) ? Et
  pour un bâtiment neuf (`textes/conso-L221-2.txt:29`) ? L'avis du devis payant
  (annexe A.3) écrit « demande écrite » même à distance (la loi dit « par
  tout moyen ») : plus prudent que la loi, à confirmer.
- **J3** [3] Hors établissement, le caractère payant ou gratuit doit-il
  figurer SUR le devis (lecture de la DGCCRF, SECONDAIRE) ou suffit-il de
  l'avoir donné par écrit avant (`textes/arrete-2017-01-24-complet.txt:33`) ?
  La chaîne L. 221-9 → L. 221-5 2° → L. 112-1 → arrêté art. 2
  (`textes/conso-L221-5.txt:9`) appuie la DGCCRF. Voie possible : le rescrit
  de L. 112-5 (`textes/conso-L112-5.txt:5`). Les phrases des points
  `devis_lieu` et `devis_validite` (« La loi le demande pour … signé dans vos
  locaux ») ont la même étroitesse que celle du v1 pour le prix (DROIT-12) :
  seule `devis_cout` dit « au moins » en 2b-4 (§7).
- **J4** [4, réécrite — DROIT-3] Un devis (payant), ou les travaux, convenus
  par la messagerie d'Opus ou au téléphone sont-ils un contrat À DISTANCE,
  au sens du « système organisé de vente ou de prestation de services à
  distance » de L. 221-1 I 1° (`textes/conso-L221-1.txt:7`) ? Si oui, quatorze
  jours de rétractation et L. 221-25 valent aussi pour un devis GRATUIT suivi
  de travaux convenus ainsi ; le 8e jour, lui, ne vise que le hors
  établissement (`textes/conso-L221-10.txt:5`).
- **J5** [5] Une réfection complète de toiture, un ravalement complet, une
  reprise lourde de maçonnerie : « réparation » ou « entretien » au sens de
  l'arrêté de 2017 ?
- **J6** [6] Un professionnel qualifié (paysagiste, plombier) qui fait de
  l'entretien courant relève-t-il de l'arrêté de 2015 ? La limite de deux
  heures (D. 7233-5) en fait-elle partie ?
- **J7** [7] Le seuil « mensuel » de 100 € pour une intervention ponctuelle
  (`textes/arrete-2015-03-17-complet.txt:41-42`).
- **J8** [8] Les deux arrêtés à la fois (remplacer un joint, poser un lustre).
- **J9** [9, F5] HT et TTC pour un artisan en franchise (2017 4-I ; 2015
  art. 4 al. 3 et art. 7 dernier alinéa, `:31`, `:62`).
- **J10** [10] La « présomption de gratuité » de l'INC existe-t-elle ?
- **J11** [11, élargie — DROIT-19] La fiche Opus est-elle « l'espace de
  communication en ligne dédié » (`textes/arrete-2017-01-24-complet.txt:34`),
  une « offre de services proposée à distance »
  (`textes/arrete-2015-03-17-complet.txt:44`), un « site internet » (`:10`) ? Et
  alors l'affichage des tarifs (lot T) cesse-t-il d'être facultatif pour un
  artisan de dépannage, de réparation ou d'entretien (§1.4 point 10) ?
- **J12** [verif §2.1] Un déplacement facturé pour établir un devis annoncé
  gratuit est-il un « coût inévitable » (`textes/conso-L121-4.txt:49`) ? Vaut
  aussi pour le bloc public « Ses tarifs », et pour la peine « en ligne » de
  L. 132-2 (`textes/conso-L132-2.txt:9`).
- **J13** [nouvelle du v1] Le prix d'un devis « déduit des travaux si vous
  acceptez » : forme, et conséquence sur la rétractation (J2).
- **J50** [nouvelle — DROIT-16] À quel taux de TVA un artisan au régime réel
  encaisse-t-il un devis payant : le taux normal, ou celui des travaux s'ils
  suivent et que le prix en est déduit ? (BOFiP non relu.) Et la note due
  « avant paiement du prix » dès 25 € TTC (`textes/arrete-1983-10-03-complet.txt:5`,
  ÉTABLI), ou la facture à un client professionnel : au module facture (§7).

**La franchise** (`droit/franchise-attestation.md` §1.9 et sa vérification) :

- **J14** [F1] Un devis accepté « TVA non applicable » dont l'exécution se
  poursuit après le dépassement : prix toutes taxes, ou TVA en sus ?
- **J15** [F2] Un artisan qui fournit les matériaux principaux : quelle part
  compte comme « services » ?
- **J16** [F3] Le chiffre d'affaires de référence : à l'encaissement, et au
  CIBS (« effectuée ») ? Avec les options d'exigibilité (`textes/cgi-269.txt:41`,
  `:45`).
- **J17** [F4] La mention « TVA non applicable, article 293 B du CGI » sur un
  DEVIS (293 E ne nomme que la facture) ; et l'annexe II, 242 nonies A
  (`textes/cgi-annexe2-242-nonies-A.txt:51`).

**L'attestation décennale** (`droit/franchise-attestation.md` §2.8 et sa
vérification) :

- **J18** [A1] La date d'ouverture d'un chantier sans permis ni ordre de
  service, et le sens de « établit son activité postérieurement »
  (`textes/assurances-A243-1-annexe-I.txt:33`, lue avec `:35`).
- **J19** [A2] L. 243-2 impose-t-il une attestation qui couvre l'ouverture
  PROBABLE ? La joindre sans le dire peut-il être trompeur ?
- **J20** [A3] Remettre spontanément la nouvelle attestation à l'ouverture ;
  laquelle joindre à la facture.
- **J21** [A4, précisée — DROIT-8] Une attestation « opération particulière »
  (A. 243-3 2° b, `textes/assurances-A243-3.txt:57-63`) ou d'un contrat
  collectif (A. 243-4) jointe à un autre chantier ; et l'avis (d), dont la
  première phrase ne vaut que pour une attestation d'un ENSEMBLE d'opérations
  (2° a) — il le dit (« Si elle vaut pour l'ensemble de vos chantiers »).
- **J22** [A5] « La date ou le délai » d'exécution : la fin des travaux ? un
  délai compté depuis l'acceptation ?
- **J23** [A6] La « période de validité » imprimée : celle des ouvertures
  couvertes, ou un contrat reconduit couvre-t-il au-delà ?
- **J24** [verif §2 point 1] Le rang 11 de 2b-3 face à une opération déjà
  ouverte (il protège trop).
- **J25** [verif §2 point 10] Aucune sanction pénale trouvée pour L. 243-2 :
  laquelle s'applique ?

**Les déchets** (`droit/dechets.md` §10 et sa vérification) — pour 2b-5 :

- **J26** [J-D1] Le renvoi du IV de L. 541-21-2-3 au CCH L. 111-10-4, sans
  version en vigueur depuis le 25/08/2021 ; les liens de concordance LEGI vers
  L. 126-34 (`textes/cch-L111-10-4-liens.txt:6`, `:9`) ; la ratification de
  l'ordonnance 2020-71 (À VÉRIFIER).
- **J27** [J-D2] Un dépannage, une réparation, un entretien sur un bâtiment
  existant : des « travaux de rénovation » ?
- **J28** [J-D3] L'entretien d'un jardin (y compris en services à la
  personne) : des « travaux de jardinage » ?
- **J29** [J-D4] L'estimation des coûts : un montant à part ? « offert »,
  « inclus », 0 € ? HT ou TTC ?
- **J30** [J-D5] Le dépôt intermédiaire de l'entreprise : quel « point de
  collecte » nommer ?
- **J31** [J-D6] Le client qui garde ou évacue lui-même ses déchets, le
  réemploi sur place.
- **J32** [J-D7, verif §2 point 5] Un petit chantier dispensé des règles de tri
  du DÉCRET (la loi, L. 541-21-2 al. 2, n'en dispense pas) : « aucune collecte
  séparée » ?
- **J33** [J-D8] Chaque devis incomplet : un manquement distinct ?
- **J34** [J-D9] Le devis d'un sous-traitant, et à un client professionnel.
- **J35** [J-D10] Les VRD et petits travaux extérieurs attenants (terrasse,
  allée, clôture) : « de bâtiments » ?
- **J36** [J-D11] Une quantité négligeable ou nulle.

**Le RGE** (`droit/rge.md` §5 (vi) et `droit/rge-verif.md` §3 point 17) — pour
2b-6 :

- **J37** [Q1] « Pour lesquels l'octroi d'aides financières est subordonné à
  la détention d'un label » : une propriété de la catégorie de travaux, ou
  faut-il une aide envisagée ? Quelles aides comptent ?
- **J38** [Q2] Le devis signé est-il « le contrat fourni par le
  professionnel » ; le justificatif annexé au devis ?
- **J39** [Q3] L. 224-115 I sans aide liée à un label (la sous-traitance doit
  se dire SANS condition d'aide, et son omission rend le contrat nul :
  `textes/conso-L242-51.txt:9`, DROIT-9).
- **J40** [Q4] La nullité de L. 242-51 II : restitutions, et invoquée après les
  travaux ?
- **J41** [Q5] SCI, syndicat, association : hors champ par la lettre ? Et
  l'entrepreneur individuel qui commande pour son propre logement
  (`droit/rge-verif.md` §3 point 14) ?
- **J42** [Q6] « Les critères de qualification de l'entreprise »
  (MaPrimeRénov') : que doit écrire le devis ?
- **J43** [Q7] « Les conséquences de la non-détention » : une phrase générale
  suffit-elle ?
- **J44** [verif (a)] L'obligation d'achat du photovoltaïque est-elle une
  « aide financière » (`textes/arrete-2021-10-06-pv-art1.txt:9`) ?
- **J45** [verif (b), (c)] Un justificatif de certification délivré par un
  organisme « conventionné et accrédité », non « agréé » ; l'attestation
  chantier du 01/03/2027 vaut-elle détention ?
- **J46** [Q8, élargie — DROIT-7] L. 223-8 et la messagerie d'Opus, pour les
  travaux d'économies d'énergie, d'énergie renouvelable ET d'adaptation au
  vieillissement ou au handicap (§1.4 point 1).
- **J47** [verif (e)] L. 122-26 : la fiche d'un artisan, un support de
  promotion ? Opus, un site qui propose ces travaux (§1.4 point 2) ?
- **J48** [Q9, Q10] La clause suspensive de l'attestation chantier ; les
  qualifications du 5,5 % photovoltaïque et bornes (lot TVA).

**La qualité d'artisan** (S1, DROIT-10) :

- **J49** [élargie] Les mots « artisan » et « maître artisan » sur un devis
  (`textes/artisanat-L241-1.txt:5`, amende de 7 500 €,
  `textes/artisanat-L241-2.txt:5`), et ce qu'un logiciel doit demander avant
  de les imprimer (Q6) ; l'onglet « Artisans » et le filtre « Artisans
  vérifiés seulement », qui désignent TOUS les professionnels d'Opus, sont-ils
  un usage du mot pour la promotion de leurs prestations ? Qui en répond ?
  (L'amende d'une personne morale, code pénal 131-38 : non relu, absent de
  l'index.)

---

## 2. La base

Une section nouvelle **49.4 quinquies** (« LE PRIX DU DEVIS LUI-MÊME, lot 2b,
étape 2b-4 »), posée juste après 49.4 quater (`supabase/schema.sql:13229`),
pour la même raison que 49.4 bis à quater : les droits d'écriture vivent en
49.7. Rien d'autre ne change dans la section 49, sauf 49.5 (une contrainte),
49.7 (une colonne de plus dans deux `grant`) et 49.9 (une branche).

**Le plan de base a été construit tel qu'écrit par la critique base**, sur
des copies du dépôt et deux bases PostgreSQL 16 (`schema.sql` rejoué deux
fois, zéro erreur) : la colonne ne récrit aucune ligne (`relfilenode`
inchangé, `atthasmissing = f`), l'ordre alphabétique des contraintes est
celui annoncé, la branche sort au rang 12 après `devis_decennale`, le cas
14 c reste vrai, `verifier-emetteur`, `verifier-tarifs` et
`verifier-lectures` restent verts. ÉTABLI (`critique-v1-base.md`, « Ce qui
tient »).

### 2.1 La colonne

```sql
alter table public.devis add column if not exists cout_devis_centimes bigint;

comment on column public.devis.cout_devis_centimes is
  'Le prix du devis lui-même, en centimes TTC (pas celui des travaux). Vide = pas dit : un '
  'motif de refus de la remise (rang 12, par prudence). 0 = gratuit (l’écran ne l’écrit que par '
  'la pastille « Gratuit » ; la base l’accepte d’où qu’il vienne). De 1 à 100 000 = payant. Hors '
  'des totaux. 49.4 quinquies.';
```

- **Nullable, sans défaut** : un fait de 2b naît vide (§1.1). PostgreSQL
  n'écrit alors aucune ligne existante : aucun rattrapage, aucune
  `modifie_le` qui bouge. MESURÉ par la critique base sur une copie
  (`relfilenode` 17674 → 17674) ; À VÉRIFIER au relevé « après » sur la vraie
  base (`max(modifie_le)` inchangé).
- **`bigint`**, comme les autres montants du devis (`supabase/schema.sql:12965`)
  et `tarifs_pro.prix_devis_centimes` (lot T). ÉTABLI pour les modèles.
- **Le nom** : ni `prix_devis_centimes` (vérification 37 de
  `verifier-tarifs`, M4), ni un mot que le cas 14 c interdit dans le corps de
  `motifs_refus_remise` (`source`, `clients`, `tarifs_pro`…,
  `supabase/essais-section-49-remise.sql:1086-1088`). ÉTABLI.
- **Le commentaire ne promet rien que la base ne tienne** : le v1 écrivait
  « 0 = gratuit (écrit par la pastille « Gratuit » seulement) » ; la base
  accepte 0 de n'importe quel client (BASE-12).

### 2.2 La contrainte

```sql
-- dans le schéma (rejoué par psql) :
alter table public.devis drop constraint if exists devis_cout_check;
alter table public.devis add constraint devis_cout_check
  check (cout_devis_centimes is null or cout_devis_centimes between 0 and 100000);
```

- Sa phrase dans `src/lib/erreurs.js` (`MESSAGES_CONTRAINTE`, l. 71) :
  « le prix du devis lui-même s’écrit comme un montant entre 0 et 1 000 € TTC. »
  — les mots de `tarif_devis_check` (`src/lib/erreurs.js:121`, ÉCRAN-22) —, et
  dans `ECHEC_PAR_CONTRAINTE` de `devis.js` (l. 2420) : « Le prix du devis
  lui-même n’a pas pu être enregistré. » (annexe A.5).
- **Sa règle dans `REGLES_DEVIS`** (`src/lib/devis.js:941-969`) : sans elle,
  `validerDevis` laisse passer la contrainte en silence (`const champ =
  regle ? regle(x) : null`, `:974-981`) — MESURÉ : `validerDevis({
  coutDevisCentimes: -1 })` rend `{ ok: true }` aujourd'hui. La démonstration
  et la saisie (avant chaque écriture d'en-tête,
  `src/screens/SaisieDevisScreen.js:1215-1235`) l'appellent (BASE-7,
  ÉCRAN-10) :

  ```js
  devis_cout_check: (d) => (!present(d.coutDevisCentimes)
    || (entier(d.coutDevisCentimes) && d.coutDevisCentimes >= 0 && d.coutDevisCentimes <= COUT_DEVIS_MAX)
    ? null : 'coutDevisCentimes'),
  ```

- **L'ordre alphabétique** (la base nomme la première contrainte violée) :
  `devis_cout_check` se range entre `devis_calculs_check` et
  `devis_delai_check` dans `CONTRAINTES_DEVIS` (`src/lib/devis.js:180-199`,
  dix-huit → **dix-neuf**). MESURÉ par la critique base : une ligne `cout =
  −1, validite = 999` est nommée `devis_cout_check` ; `cout = 100001,
  acompte_centiemes = 0` est nommée `devis_acompte_check`.
- Les compteurs : 34 → **35** contraintes `check` des trois tables
  (`scripts/verifier-devis.mjs:3520`, « trente-quatre » ;
  `supabase/schema.sql:13275` « trente-trois ici » → « trente-quatre ici » ;
  `check_attendu_34` de l'essai 49 → `check_attendu_35`).
- Dans la migration : posée SOUS CONDITION (`pg_constraint` avec `conrelid`,
  dans un bloc `do`), jamais par un ordre qui commence par `drop` (§2.9).
- **Pourquoi pas « 0 seulement par la pastille » dans la base** : la base ne
  sait pas quel geste a écrit 0 ; c'est l'écran qui le tient (T3, T18), comme
  le lot T. Et aucune contrainte ne lie le prix à autre chose (le client, la
  réponse « à quel titre ») : ce serait la saisie refusée à mi-chemin.

### 2.3 Les droits (49.7)

La colonne entre dans `grant insert (…)` et `grant update (…)` de `devis`
(`supabase/schema.sql:14648-14661`), juste avant `generation` :

| | aujourd'hui | après |
|---|---|---|
| `grant insert` sur `devis` | 25 colonnes | **26** |
| `grant update` sur `devis` | 22 colonnes | **23** |
| `grant insert` / `update` sur `devis_lignes` | 16 / 14 | inchangés |
| colonnes de l'essai 49-conditions, cas 18 | 42 | **43** (`devis.cout_devis_centimes`, ins = upd = vrai, rien pour `anon`) — dans les DEUX listes du cas : `attendu` ET la liste `in (…)` des colonnes trouvées (BASE-6) |

Le commentaire de 49.7 gagne une phrase : « Depuis 2b-4, un devis naît et se
modifie AUSSI sur le prix du devis lui-même (`cout_devis_centimes`,
49.4 quinquies). » ÉTABLI pour la forme (`supabase/schema.sql:14646-14670`).

### 2.4 Les déclencheurs

**Aucun ne change, aucun ne naît.** `tient_le_devis()` n'a rien à poser
(aucune date pour ce fait : personne ne la lirait) ; `recalcule_devis()` ne
le lit pas (hors des totaux, T5). Les cinq déclencheurs des trois tables
restent cinq (essai 49, cas 27 f). DÉDUIT de la lecture du corps de
`tient_le_devis()` (49.6) : il ne nomme aucune colonne qu'il ne connaît pas.

### 2.5 `motifs_refus_remise()` (49.9)

Même signature, même attributs. Trois changements, et rien d'autre :

1. une déclaration de plus, après `v_signature boolean;` :
   `v_cout            bigint;`
2. la lecture du devis (l. 15055-15067) lit une colonne de plus, à la FIN des
   deux listes : `…, d.engage_decennale, d.acompte_a_la_signature,
   d.cout_devis_centimes into …, v_decennale, v_signature, v_cout` ;
3. une branche, entre la fin du rang 11 (l. 15232, `end if;`) et le
   commentaire « 5. Les motifs de l'entreprise » (l. 15234) :

```sql
  -- Le prix du devis lui-même (49.4 quinquies) : pas encore dit. Une
  -- PRUDENCE (réponse Q2) : la loi demande « gratuit » ou « payant » sur
  -- le devis au moins pour un dépannage, une réparation ou un entretien
  -- signé dans les locaux de l'artisan, et Opus ne sait pas si ce devis en
  -- est un. 0 (gratuit) et un montant (payant) le taisent pareil.
  if v_cout is null then
    rang := 12; cle := 'devis_cout'; nature := 'prudence';
    phrase := 'Dites si le devis lui-même est gratuit ou payant. La loi le demande au moins pour un dépannage, une réparation ou un entretien signé dans vos locaux ; Opus ne sait pas encore si ce devis en est un.';
    return next;
  end if;
```

- **La phrase** : 197 caractères, aucun chiffre, « € », apostrophe droite,
  insécable ni barre, un point final, « La loi le demande » ET « Opus ne sait
  pas encore » (MESURÉ, `mesures/phrases-v2.mjs`). « le devis lui-même » et
  non « ce devis » (ÉCRAN-5) ; « au moins pour » et non « pour », qui se
  lisait « seulement pour » (DROIT-12 ; un contrat signé dans les locaux de
  l'artisan juste après une sollicitation ailleurs est même hors
  établissement, `textes/conso-L221-1.txt:13`). « signé dans vos locaux »
  reste : c'est le vocabulaire des phrases voisines et d'`ECHEANCE_ACOMPTE`
  (`src/lib/devis.js:2238`).
- `ligne_id` vaut déjà `null` à cet endroit (posé avant le rang 4,
  l. 15164) : rien à remettre. ÉTABLI.
- **Ce qu'elle ne lit toujours pas** : ni `tarifs_pro`, ni `clients`, ni
  `professional_profiles`, ni l'origine du devis (le cas 14 c reste vrai,
  liste des tables nommées inchangée). MESURÉ par la critique base.
- **Les bornes** : un motif de plus au plus par devis → **511** (500 lignes
  fautives au rang 3, et un motif pour chacun des rangs 1, 2, 4 à 12) ; trois
  chiffres, les gabarits de « Pour le remettre » ne bougent pas. DÉDUIT de
  `comprendre/methode.md` §4 point 21.
- **Le commentaire de 49.9** (`supabase/schema.sql:14690` et suivantes) et
  celui de la fonction (l. 15273-15281) : « rangs 1 à 11 » → « rangs 1 à 12 :
  l'acompte à la signature et l'attestation décennale depuis 2b-3, le prix du
  devis lui-même depuis 2b-4 ». Le nombre des règles d'Opus ne change pas si
  Q2 = 1.
- **`CONTRAT_B2`** (`scripts/verifier-devis.mjs:8647-8654`) :
  `['devis_cout', 12, 'prudence']` en fin ; **17 clés sur 12 rangs**.
- **`FORME_MOTIFS_REFUS_REMISE`** (`scripts/verifier-devis.mjs:8603`) : la
  fonction entière, blancs réduits, recopiée APRÈS la construction et relue
  par l'essai et `cas-remise.json` — EN LE DÉCIDANT.

### 2.6 Les réponses « gratuit » des décors d'essai (sinon les cas tombent)

Le vide compte comme le motif : sans valeur dans les décors, TOUS les cas
qui partent d'un devis « complet » gagneraient `devis_cout`, et leurs
attendus changeraient de sens (la leçon de la décennale en 2b-3,
`comprendre/methode.md` §4 point 12). MESURÉ par la critique base : avec le
seul plan de base et du miroir, `verifier-devis` passe de 579 ✔ à 553 ✔ /
25 ✘, et douze valeurs de l'essai 49-remise passent à `f`.

- **`scripts/generer-cas-remise.mjs`, `COMPLET`** (l. 162-166) gagne
  `cout_devis_centimes: 0` (gratuit). **`VIDE`** (l. 167-170) **ne le gagne
  PAS** : les cas qui partent de `VIDE` gardent le 0 de `COMPLET`, donc leurs
  attendus ne bougent pas. La colonne passe par `cols` (l. 511 : `const cols =
  { source: 'manuelle', ...COMPLET, ...(s.devis || {}) }`), donc par
  l'insertion du devis ; rien d'autre. ÉTABLI pour la mécanique. **Les cinq
  cas « un devis NEUF (rien de dit) » et « D4-c : devis NEUF VIDE »**
  (`:280`, `:283`, `:316-319`, `:456`) portent alors 0 : leur NOM est
  réécrit « … (rien de dit, sauf « gratuit ») » — le nom fait partie du
  fichier engendré, le diff le montre, c'est voulu ; aucun contrôle ne
  cherche un cas par son nom (relu) (BASE-8).
- **`supabase/essais-section-49-remise.sql`** (BASE-3, mesuré) :
  - `devis_complet` (l. 326-330) gagne la colonne et la valeur 0 ;
  - **cas 10** (« LES NEUF RANGS À LA FOIS », l. 718) : son devis reçoit 0,
    et le dit (« 2b-4 : gratuit, pour rester les NEUF rangs ») — ses attendus
    ne bougent pas ;
  - **cas 13 et 23** (D4-c, l. 998, l. 1745) : ils restent SANS prix, et
    `devis_cout` entre dans leurs trois listes attendues — la preuve D4-c
    couvre ainsi le motif nouveau sans rien de plus (MESURÉ : les trois devis
    rendent la même liste, `x_y_z_identiques_attendu_t` reste `t`) ;
  - **cas 24** devient « LES DOUZE RANGS À LA FOIS » : son devis reste sans
    prix, le contrat gagne `(12, 'devis_cout', 'prudence', …)`,
    `lignes_attendu_12`, rangs 1 à 12, `dix_sept_cles_douze_rangs_attendu_t`
    (`count(*) = 17`, `count(distinct rang) = 12`), et
    `phrases_courtes_attendu_t` porte sur `rang >= 10` (la phrase de 197
    caractères y entre). Le NOMBRE de valeurs jugées de ces cas ne change
    pas — à recompter quand même.
- **`scripts/verifier-devis.mjs`, ses PROPRES décors « complets »**
  (BASE-1, mesuré : six vérifications rougissaient pour cette seule raison)
  : `coutDevisCentimes: 0` dans le devis écrit en ligne (l. 8752), `complet`
  (l. 8992), `DEV` (l. 10744) et `sig` (l. 11336), avec le commentaire
  « 2b-4 : « complet » dit aussi « gratuit » — sans lui `devis_cout` s'ajoute
  à chaque bord », comme `engageDecennale: false` en 2b-3 (`:8989-8991`,
  `:10742-10743`). Ne rougissent pas (vérifié par la critique) : `COUPURES`
  (`:8772`), `r11` (`:11308`), `:202`, `:11232`, la section 41 m.
- **La démonstration** : T13 (§3.9).

### 2.7 L'export RGPD

`mes_donnees()` ne change pas : chaque devis y est exporté entier, et la
colonne nouvelle y entre d'elle-même (`to_jsonb(x)`,
`supabase/schema.sql:17806-17808` ; `docs/CAHIER-LOT-2B-3.md:766-769`).
`verifier-lectures` reste vert sur la copie (critique base). À VÉRIFIER au
relevé de l'essai réel (§6).

### 2.8 Ce qui ne change pas, et pourquoi

- **`emetteur_incomplet()`** : aucun motif d'entreprise nouveau (le prix est
  un fait du devis, T1). « Prêt à émettre un devis ? » ne bouge donc pas (M2).
- **`tarifs_pro`**, ses déclencheurs et ses contraintes : rien. La promesse des
  conditions d'utilisation devient vraie par l'ÉCRAN (§4).
- **Les politiques RLS** : aucune ; la colonne vit dans une table déjà
  privée (`pro_id in (select mes_entreprises())`).
- **`OP028`** reste libre ; aucun refus nouveau en `raise`.
- **La classe de blancs** : aucune colonne de texte (S7).
- **Les deux listes `security definer`** (31 ouvertes, 32 fermées, essai
  49-remise 14 e) : inchangées.

### 2.9 La migration, et l'ordre

Construite par un SCRIPT qui PREND chaque objet dans `schema.sql`
(`comprendre/methode.md` §3 points 4 à 13), jamais recopiée à la main :

1. `set local lock_timeout = '5s';`
2. `alter table public.devis add column if not exists cout_devis_centimes bigint;`
   et son `comment on column` ;
3. la contrainte SOUS CONDITION :
   `do $$ begin if not exists (select 1 from pg_constraint where conname =
   'devis_cout_check' and conrelid = 'public.devis'::regclass) then alter
   table public.devis add constraint devis_cout_check check (…); end if; end $$;`
4. **de 49.7, le `revoke all on public.devis, public.devis_lignes,
   public.devis_tva from anon, authenticated;` puis ses SIX `grant`** :
   lecture et suppression des devis et des lignes (`grant select, delete on
   public.devis, public.devis_lignes to authenticated`) ; création et
   modification, colonne par colonne, des devis (les deux `grant` qui gagnent
   la colonne) et des lignes ; lecture de la ventilation (`grant select on
   public.devis_tva`) — **ni ses politiques** (trois ordres commencent par
   `drop`, que le connecteur refuse), **ni `mes_entreprises()`**. Le v1
   écrivait « le bloc ENTIER » et « quatre `grant` » : à la lettre, la
   première lecture emportait les `drop policy`, la seconde retirait à tout
   artisan la LECTURE et la SUPPRESSION de ses devis (BASE-4 ; ÉTABLI,
   `supabase/schema.sql:14560-14598`, `:14646-14670`). Sans le `revoke`, le
   droit de table du lot 1 resterait (leçon du lot 2a) ;
5. `create or replace function public.motifs_refus_remise(…)` (même
   signature), son `revoke` / `grant`, son `comment on function` ;
6. le **balayage de la section 43 en DERNIER** (`supabase/schema.sql:17943`
   et suivantes).

- **Aucun ordre ne commence par `drop`, `delete` ou `truncate`** ; le script
  le compte. Aucun rattrapage (la colonne n'a pas de défaut) ; aucun
  `not valid` ; aucun déclencheur.
- **Aucune barre oblique inverse dans le corps** de `motifs_refus_remise`
  (`verifier-devis` section 40 le tient) : le transport du connecteur ne
  change rien. Le script écrit tout de même les DEUX fichiers (envoyé, reçu).
- **Taille** : de l'ordre de 2b-3 (19 161 octets pour 18 ordres) — DÉDUIT ;
  envoyée sous forme GARDÉE (un bloc `do` qui compare le md5 du texte REÇU et
  n'exécute rien s'il diffère).
- **La garde éprouvée** (`comprendre/methode.md` §3 point 9, BASE-11) : des
  sabotages du TEXTE (une espace, un chiffre, un ordre retiré) envoyés à la
  copie — chacun doit être refusé sans rien appliquer (2b-3 : 5 sur 5).
- **Simulée deux fois** sur l'imitation `ceb7d96` rejouée AVEC des données :
  l'empreinte du catalogue doit être celle d'une base neuve au schéma de
  2b-4, aux écarts connus près (`comprendre/methode.md` §3 point 8) ; les 34
  essais rendent les nombres attendus (§5.2) ; le `lock_timeout` arrête tout.
- **Un second regard indépendant** (`comprendre/methode.md` §3 point 10,
  BASE-11), avec SON découpeur et SA empreinte : il refait la preuve, et
  vérifie qu'aucune table ni aucune ligne n'est réécrite. « Accélérer » ne
  le supprime pas : c'est la migration, pas une relecture du code.
- **Ce que la vraie base verra** (relevé de forme, avant et après) :
  `devis` passe de **35 à 36 colonnes** ; une contrainte `devis_cout_check`
  (lue par `pg_get_constraintdef`) ; `has_column_privilege('authenticated',
  'public.devis', 'cout_devis_centimes', 'INSERT')` et `'UPDATE'` vrais,
  faux pour `anon` (relus par `pg_attribute.attacl`, le rôle de lecture ne
  voit pas `information_schema.column_privileges`) ; **la lecture et la
  suppression des devis toujours accordées** (`has_table_privilege` SELECT et
  DELETE pour `authenticated`) ; le md5 du corps de `motifs_refus_remise`
  égal à la simulation ; les **3 devis** et **11 lignes** du propriétaire
  intacts (`max(modifie_le)`, `max(generation)` inchangés) ;
  `count(*) filter (where cout_devis_centimes is null)` = 3 (ses trois
  brouillons portent désormais le point) ; aucune fonction de déclencheur
  appelable par `anon` ou `authenticated`.
- **Envoyée** par `apply_migration` du connecteur principal, avec l'accord du
  propriétaire, Opus fermé. Puis `git pull`.

### 2.10 Les douze mentions de l'arrêté du 17/03/2015 (art. 7) contre ce qu'Opus sait

Le texte : `textes/arrete-2015-03-17-complet.txt:49-62`, numéros de ligne
corrigés par la vérification (`droit/payant-2017-sap-verif.md` §3 point 1).
ÉTABLI pour le texte ; la colonne « Opus » est ÉTABLIE pour le code cité,
DÉDUITE pour l'appréciation.

| | mention (ligne) | ce qu'Opus sait aujourd'hui | après 2b-4 |
|---|---|---|---|
| 1° | « La date de rédaction et la durée de validité de l'offre » (:50) | la validité : `devis_validite`, rang 6, par prudence ; la date : celle de la remise, en 2c | idem |
| 2° | « Le nom ou la raison sociale et l'adresse du prestataire de service » (:51) | les motifs d'entreprise (identité, adresses, `src/lib/emetteur.js`) | idem |
| 3° | « Le numéro de la déclaration si elle a été faite, d'agrément ou d'autorisation » (:52) | **rien** : aucune donnée de déclaration de services à la personne | rien (Q3 = 2 l'ajouterait) |
| 4° | « Le nom et l'adresse du consommateur » (:53) | le nom : `devis_client` (rang 1) ; l'adresse : la fiche du carnet en porte une, **jamais vérifiée** | rien ; la copie figée du client à la remise (2c) |
| 5° | « Le lieu ou les lieux de l'intervention ou la zone d'intervention » (:54) | `devis_lieu`, rang 4, par prudence | idem |
| 6° | « La description de chaque prestation proposée » (:55) | `devis_lignes` (au moins un poste) et la désignation de chaque ligne | idem |
| 7° | « Le ou les modes d'intervention proposés » (:56 ; mandataire, mise à disposition, prestataire, art. 2 2°, :12-15) | **rien** ; un artisan intervient en « prestataire » (DÉDUIT), et la mention de l'art. 3 (:20-24) ne vise que les deux autres modes | rien |
| 8° | « Le nombre d'heures de travail correspondant à chaque prestation », sauf non pertinent (:57) | une ligne peut être à l'heure (unité « h ») ; rien ne l'exige | idem |
| 9° | « Le prix horaire ou … le prix forfaitaire pour chaque prestation » (:58) | prix unitaire et unité de chaque ligne | idem |
| 10° | « Le cas échéant, le taux de TVA applicable à chaque prestation » (:59) | le taux de chaque ligne (rang 3) | idem |
| 11° | « Le montant total à payer » (:60) | les totaux de la base | idem |
| 12° | « Le cas échant, le montant détaillé de tous les frais annexes » (:61, art. 4 :29 : dossier, gestion, déplacement) | `frais_deplacement` (motif d'entreprise, règle d'Opus) ; les autres frais : des lignes | idem |
| — | **9°, 11° et 12° « hors taxes et toutes taxes comprises »** (art. 4 al. 3, :31, pour toute information sur le prix ; art. 7 dernier alinéa, :62) | non vérifié : le gabarit est pour 2c ; en franchise : (J9) | à tenir par le gabarit de 2c si Q3 = 2 (DROIT-14) |
| art. 6 | devis gratuit des deux côtés de 100 € TTC par mois (:41-42) ; conservé un an (:43) | rien | une phrase de l'AIDE fixe (Q3 = 1) ; la conservation : 2c |

Trois mentions n'ont aucune donnée (3°, 4° pour l'adresse, 7°) : c'est la
quatrième raison de Q3 = 1.

### 2.11 Les variantes

- **Si Q2 = 2 (règle d'Opus)** : `nature := 'regle_opus'` et la phrase « Dites
  si le devis lui-même est gratuit ou payant. La loi le demande au moins pour
  un dépannage, une réparation ou un entretien signé dans vos locaux ; Opus
  le demande pour tous vos devis. » (187 caractères, mesuré) ; `CONTRAT_B2`
  en `['devis_cout', 12, 'regle_opus']` ; le commentaire de 49.9 compte HUIT
  règles d'Opus ; la règle « une règle d'Opus finit par « Opus le demande
  pour tous vos devis. » » (`scripts/verifier-devis.mjs:8702-8703`) la tient
  déjà.
- **Si Q2 = 3 (pas de point)** : ni branche, ni changement de la fonction ;
  la colonne et l'écran restent ; un avis « Vous n'avez pas dit si le devis
  lui-même est gratuit ou payant » rejoint `avisDuDevis` (il suit l'écran).
  Le cas 14 c, `FORME_MOTIFS_REFUS_REMISE`, `cas-remise.json` et l'essai
  49-remise (sauf les deux refus de la contrainte) ne bougent pas ; §2.6
  devient sans objet.
- **Si Q2 = 4 (remplir d'après les tarifs)** : le motif reste (vide =
  `devis_cout`) ; à la CRÉATION d'un devis (`devisVersBase`, au premier
  envoi), l'écran écrit la valeur de ses tarifs si elles sont LUES et disent
  « gratuit » (0) ou un montant ; jamais pour un brouillon déjà en base ;
  sans tarifs lus, rien. Une écriture SANS APPUI : la garde de texte d'ÉCRAN-2
  (§5.4) s'élargit à cette porte, nommée, et la phrase du bloc dit « Rempli
  d'après vos tarifs ».
- **Si Q3 = 2** : §3.11.

---

## 3. Le calcul (JavaScript) et l'écran

### 3.1 `src/lib/devis.js`

1. **Le quatrième import** (T8) : `import { joursEntre } from './formats.js';`
   après les trois de la l. 51-53.
2. **`CHAMPS_DEVIS`** (l. 305-322) : `'coutDevisCentimes'` en fin, hors de toute
   paire (il ne viole aucune contrainte seul) ; un commentaire « 2b-4 ».
3. **`rowToDevis`** (l. 1792) : `coutDevisCentimes: nombreOuNul(d.cout_devis_centimes),`
   après `acompteALaSignature`.
4. **`CONTRAINTES_DEVIS`** (l. 180) : `'devis_cout_check'` à sa place
   alphabétique ; « dix-huit » → « dix-neuf » ; **`REGLES_DEVIS`** gagne la
   règle de §2.2 ; une constante `COUT_DEVIS_MAX = 100000`, la même que la
   contrainte.
5. **`ECHEC_PAR_CONTRAINTE`** (l. 2420) : `devis_cout_check: 'Le prix du devis
   lui-même n’a pas pu être enregistré.'`. La phrase générique de
   `phraseEchecDuDevis` (l. 2454) dit déjà « ou les conditions » : inchangée.
6. **Le bloc de la carte « Conditions »**, par la VOIE UNIQUE (leçon E-B1,
   `src/components/ConditionsDevis.js:51-58`) :
   - `etatInitialConditions` (l. 3203) gagne `cout: 'gratuit' | 'payant' |
     null`, tiré de `coutDevisCentimes` (0 → `'gratuit'`, plus de 0 →
     `'payant'`, vide → `null`), JAMAIS d'après les tarifs ; la garde de
     « Corriger » le reprend (`textes.choix.cout`) ;
   - `lireConditions` (l. 3272) reçoit une entrée de plus, `coutPropose`
     (des centimes > 0, ou `null`), et écrit `changements.coutDevisCentimes`
     selon `c.cout` (T3, T18) :
     - `undefined` (un `choix` d'avant 2b-4) → **rien** : aucune clé, sur le
       modèle de `if (c.echeance !== undefined)` (`src/lib/devis.js:3313`,
       ÉCRAN-4) ;
     - `'gratuit'` → **0** — la SEULE porte du 0 ;
     - `null` → `null` (jamais choisi ; la saisie n'envoie que ce qui
       diffère de l'en-tête, `:3311`, donc rien ne part) ;
     - `'payant'`, champ MONTÉ (`tapes.cout !== undefined`) → le texte lu par
       une fonction nouvelle `versCoutDeDevis(texte)` : **vide → `null`, sans
       erreur** (ÉCRAN-1 : c'est le point de « Pour le remettre » qui dit ce
       qui manque) ; 0 → erreur « Pour dire que ce devis est gratuit, touchez
       « Gratuit ». » ; au-delà de `COUT_DEVIS_MAX` → erreur « Le prix d’un
       devis s’écrit jusqu’à {max}. » (`centimesLisibles`, jamais « € »
       écrit) ; illisible → le message de `versCentimes` ; sinon le montant ;
     - `'payant'`, champ PAS ENCORE MONTÉ (on vient de toucher la pastille) →
       la valeur enregistrée si elle est payante (> 0), sinon `coutPropose`
       s'il est > 0, sinon `null`. **Jamais 0** (ÉCRAN-2).
     Les erreurs vont dans `erreurs.coutDevisCentimes`, avec le texte tapé
     (`textes.cout`), comme la retenue. Le texte remis dans le champ :
     `centimesEnSaisie` (l. 690).
   - `coutDuDevisPropose(etatTarifs)` (nouvelle, pure) : passe par
     `tarifsConnus` (l. 3490) ; rend `{ etat: 'gratuit' | 'payant' | 'rien' |
     'illisible' | null, centimes }` — `null` en lecture (on se tait),
     `'illisible'` en échec, jamais « rien » pour un échec (la règle de
     `tauxHorairePropose`, l. 3510) ;
   - **`coutPropose` se tire ainsi, écrit UNE fois** (une fonction pure
     `coutAProposer(propose)`) : `propose && propose.etat === 'payant' &&
     propose.centimes > 0 ? propose.centimes : null`. Tarifs « gratuit » →
     `null` : un appui sur « Payant » n'écrit pas 0 (ÉCRAN-2 — c'est la
     configuration réelle du propriétaire) ;
   - `phraseDuCoutPropose(propose, etatRegime)` (nouvelle, pure) : les
     phrases de l'annexe A.2 ; « TTC » partout SAUF en franchise (les tarifs
     sont déclarés TTC dans « Mon entreprise » quel que soit le régime,
     `src/components/FicheEmetteur.js:1172`, `:1178` ; en franchise, l'écran
     ne nomme pas la taxe, `libellesDesTotaux`) — la même règle pour le
     libellé du champ et son étiquette parlée (ÉCRAN-14, point 4) ;
   - `libellesDesConditions` (l. 3385-3400) gagne `cout` (« Prix du devis
     TTC » / « Prix du devis ») et `coutParle` (« Prix du devis lui-même TTC,
     en euros » / « Prix du devis lui-même, en euros ») (ÉCRAN-14, point 1).
7. **`CLES_DU_GESTE`** (l. 3425-3431) : `cout: Object.freeze(['coutDevisCentimes'])`
   — sans elle, une faute ancienne du prix ne fait pas vibrer au geste qui la
   vise (MESURÉ : `vibrerPourLaCarte('cout', …)` rend `false`, la même chose
   pour la validité `true`) (ÉCRAN-11).
8. **`resumeDesConditions`** (l. 2901-2913, T15, ÉCRAN-15) : dans `manque`,
   après « Validité à choisir », « Devis lui-même : gratuit ou payant ? à
   choisir » quand `coutDevisCentimes` est vide ; dans `pose`, en dernier,
   « Devis lui-même gratuit » (0) ou « Devis lui-même payant {montant} »
   (`centimesLisibles`).
9. **`MOTIFS_DEVIS`** (l. 3647) : `devis_cout`, rang 12, `prudence`, la phrase
   de l'annexe A.1, octet pour octet celle de la base. Un commentaire « 2b-4
   (réponse Q2) ».
10. **`motifsDeRemise`** (l. 4125), le miroir, dans l'ordre de la base :
    après le bloc du rang 11, `if (!present(d.coutDevisCentimes))
    motif('devis_cout');`. `nettoyerDevis` ne touche pas un nombre. DÉDUIT.
11. **`ENDROIT_DU_MOTIF`** (l. 4235) : `devis_cout: Object.freeze({ endroit:
    'conditions', champ: 'cout' })` ; **`actionDuPoint`** (l. 5161) :
    `if (e.champ === 'cout') return seul('Choisir : devis gratuit ou payant');`.
12. **Les avis** (l. 4378-4441) — `AVIS_DU_DEVIS` passe de quatre à **dix**
    clés (annexe A.3 ; des modèles à trous `{…}` pour ceux qui portent une
    date ou un montant ; les deux phrases de la franchise COMPOSÉES d'une
    suite écrite UNE fois, `SUITE_AVIS_FRANCHISE`, ÉCRAN-17), et
    `avisDuDevis` quatre entrées, `regime = undefined, assurances = undefined,
    tarifs = undefined, jour = jourDuTelephone()` (T7 ; `undefined` = pas
    transmis = on se tait) :
    - **`avis_devis_payant`** : la liste est SÛRE (`sure`, l. 4424),
      `coutDevisCentimes > 0`, et la réponse vue par la base n'est pas
      `professionnel` — un consommateur, une association, une copropriété
      ou une société civile (prudence, décision du 09/11, DROIT-3), une
      petite entreprise hors de son activité (L. 221-3), ou pas de réponse
      (prudence). La phrase nomme la rétractation de quatorze jours, le cas
      où le client « ne vous devra rien », l'écrit ou le support durable, le
      8e jour « pas même un chèque », et le devis convenu au téléphone ou par
      messages (DROIT-1, DROIT-3). (J2, J4) ;
    - **`avis_devis_payant_tarifs_gratuits`** (DROIT-11) : les tarifs LUS
      (`tarifsConnus`), `ligne.affiche === true`,
      `ligne.prix_devis_centimes === 0`, et `coutDevisCentimes > 0`. Suit
      l'écran (T16). (J12) ;
    - **`avis_devis_gratuit_deplacement`** : `coutDevisCentimes === 0`, les
      tarifs LUS et `frais_deplacement_centimes > 0`. Suit l'écran (T16).
      (J12) ;
    - **`avis_attestation_echeance`** (d) : `engageDecennale !== false` ;
      `assurances` est une liste (lue) ; `validiteJours` présente ; parmi les
      assurances `nature === 'decennale'` dont le chemin est écrit
      (`cheminEcrit(a.attestation_chemin)`, la règle d'`etatDeLAttestation`,
      l. 4083-4095) et la fin (`valide_jusquau`) au moins `jour`, la fin la
      PLUS TARDIVE `fin` (aucune : on se tait, le rang 11 parle déjà) ;
      l'horizon = `validiteJours`, plus `JOURS_DU_DELAI_PAR_DEFAUT` (30) si
      `delaiExecution` vaut EXACTEMENT `DELAI_PAR_DEFAUT.texte` (l. 268-274 ;
      M7) ; l'avis parle si `joursEntre(jour, fin) < horizon`, avec `{fin}` =
      `dateFrancaise(fin)`. Suit l'écran (T16). La phrase ne dit « jusqu'à
      cette date » que pour une attestation d'un ensemble de chantiers, et
      nomme les trois façons dont un chantier peut être déjà ouvert : une
      déclaration d'ouverture, un premier ordre de service, d'autres
      entreprises qui ont commencé (`textes/assurances-A243-1-annexe-I.txt:31`,
      DROIT-8) ; « pensez à la donner », un conseil (ÉCRAN-22) ;
    - **`avis_franchise_plafond`** et **`avis_franchise_plafond_options`**
      (e, T11) : `regime === 'franchise'` (une chaîne : en lecture ou en
      échec, on se tait), la liste SÛRE, **`coherenceRegime(lignes, regime)
      === null`** (sinon la bande de cohérence dit déjà quoi corriger, et
      un total qui porte de la TVA ne doit pas se lire comme un chiffre
      d'affaires, DROIT-2, ÉCRAN-6), puis `totaux.ht > SEUIL` → le premier,
      `{montant}` = `centimesLisibles(totaux.ht)` ; sinon, **au moins une
      ligne `option`** et `totaux.ttcOptions > SEUIL` → le second,
      `{montant}` = `centimesLisibles(totaux.ttcOptions)`. Dans ce seul cas
      (aucun taux non nul), `ttcOptions` vaut le net plus les options, sans
      taxe (`tvaDe(base, null)` rend `null`, compté zéro, l. 492-496,
      `:1137`). `SEUIL` = le plafond de l'année précédente pour les
      services ; `{seuil_en_cours}` et `{seuil_precedent}` viennent de la
      constante. **Aucun « HT »** dans les deux phrases.
13. **`PLAFONDS_FRANCHISE`** (nouvelle) : `Object.freeze({ servicesAnneeEnCours:
    4125000, servicesAnneePrecedente: 3750000, reluLe: '2026-11-16', source:
    'CGI, art. 293 B, I ; repris au CIBS, art. L. 233-9, le 01/01/2027' })` —
    `textes/cgi-293-B.txt:9-28`, `droit/franchise-attestation.md` §0 point 1
    (ÉTABLI ; jugé juste par la critique droit). Le seuil de l'avis :
    `servicesAnneePrecedente` (T11).
14. **`PAS_ENCORE_VERIFIE`** (l. 4506-4509) : la phrase de l'annexe A.4 —
    « si le devis lui-même est payant » SORT (le point le demande),
    « si ce devis relève des services à la personne » ENTRE (Q3 = 1). Son
    commentaire (l. 4473-4505) gagne un paragraphe « 2b-4 ».
15. **`AIDE_COUT_DEVIS`** (nouvelle, fixe) et les phrases du bloc (annexe A.2),
    toutes ici : `ConditionsDevis.js` les importe, jamais ne les recopie.
16. **Le commentaire des chiffres de la ligne** (l. 4739-4742) : « huit
    motifs plus un par ligne fautive (508 au plus) » est faux depuis 2b-3
    (510) ; il devient « onze motifs plus un par ligne fautive (511 au
    plus) » (ÉCRAN-12).

### 3.2 `src/lib/erreurs.js`

`MESSAGES_CONTRAINTE.devis_cout_check` (annexe A.5), dans les mots de
`tarif_devis_check` (l. 121). Aucun code `OP`. Le contrôle qui exige qu'une
phrase ne vise que des contraintes existantes (`src/lib/erreurs.js:59-62`) la
verra.

### 3.3 `src/lib/api.js`

- **`devisVersBase`** (l. 2969-3009) : `poser('cout_devis_centimes',
  'coutDevisCentimes');` après `acompte_a_la_signature`.
- **Les assurances par la lecture du régime** (T9, T20, ÉCRAN-8) :
  `regimeEtSaDate` (l. 3564) NE CHANGE PAS (il rend `{ regime, declareLe }`,
  et `monRegime` aussi) ; une fonction pure nouvelle
  `assurancesDe(f)` rend `f && Array.isArray(f.assurances) ? f.assurances :
  null` ; `monRegimeEtSaDateSupabase` / `…Demo` (l. 3594-3600) deviennent
  `const f = await monEmetteurX(); return { ...regimeEtSaDate(f),
  assurances: assurancesDe(f) };`. Aucune lecture nouvelle. Le commentaire
  de la fonction dit les trois. `verifier-postes` (`:1935-1945`) se réécrit
  EN LE DÉCIDANT (§5.4) ; sa vérification de `lireRegime` (`:2430-2433`)
  reste vraie.
- **La démonstration** : `validerDevis` refuse −1 et 100 001 par
  `REGLES_DEVIS` (§2.2), comme la base ; la base de démonstration l'appelle
  déjà (`src/data/devis-demo.js:686`, `:721`). La réponse à l'« À VÉRIFIER »
  du v1 est lue (BASE-7).

### 3.4 `src/OpusApp.js`

- un état **`mesAssurances`** : `undefined` au départ (pas lues : l'avis (d)
  se tait), posé dans `lireRegime` (l. 4193-4206) depuis la même réponse que
  le régime ; **gardé** pendant une relecture (discrète ou non) et
  **remplacé** à la réponse ; en échec de la lecture, **remis à
  `undefined`** — un avis d'échéance calculé sur des assurances qu'on n'a pas
  pu relire ne doit pas rester (ÉCRAN-19 a) ;
- **à la fermeture de « Mon entreprise »** (l. 5537), en plus de
  `setRetourEntreprise`, un `lireRegime({ discret: typeof monRegime ===
  'string' })`, comme les trois autres appels (l. 4222, 4238, 4268 ;
  ÉCRAN-19 b) : c'est là que l'artisan change la date de fin de son
  attestation ;
- **la garde de génération** (`generationRegime`, l. 4193-4207) : la lecture
  faite à la fermeture est la DERNIÈRE (aucun `recevoirEmetteur` ne vient
  après la fermeture, puisque c'est « Mon entreprise » ouverte qui l'appelle),
  donc ses assurances ne sont pas jetées ; `recevoirEmetteur` (l. 4213) ne
  touche PAS `mesAssurances`. DÉDUIT ; mesuré par `mesure-devis` (§5.5,
  point 8) (ÉCRAN-19 c) ;
- la saisie reçoit `assurances={mesAssurances}` (l. 5321-5327).

### 3.5 `src/screens/SaisieDevisScreen.js`

- une prop `assurances` (l. 595), sans valeur par défaut (`undefined`) ;
- **l'appel unique des avis** (l. 2069-2071) devient
  `avisDuDevis({ devis, lignes, totaux, etat: etatListe, pasCompte, client,
  reponseVue: liste.reponseVue, regime, assurances, tarifs, })` — et
  l'expression régulière qui le fige (`scripts/verifier-devis.mjs:10396`) se
  réécrit EN LE DÉCIDANT ;
- `CHAMPS_CONDITIONS` (l. 182-191) : `'coutDevisCentimes'` ; `NOMS_ENTETE`
  (l. 152-178) : `coutDevisCentimes: 'Prix du devis lui-même'` (la bande de
  la garde le nomme hors du bloc : sans « lui-même », il se lirait comme le
  total) ;
- **« Corriger » rouvre la carte SUR le bloc** quand le premier refus est le
  prix du devis : dans `corrigerEntete` (l. 1910-1917), avant le cas général,
  `if (champ === 'coutDevisCentimes') { ouvrirConditionsSur('cout'); return; }`
  (ÉCRAN-18, en partie : la validité et la retenue gardent l'ouverture en
  haut, un défaut déjà là, noté au §7) ;
- la carte « Conditions » reçoit `tarifs` et `regime` (pour la phrase
  proposée et le libellé « TTC »), et `coutPropose` (tiré par `coutAProposer`)
  part dans `lireConditions`.

### 3.6 `src/components/ConditionsDevis.js` — le bloc

Placé **EN DERNIER** : après « Retenue de garantie » (l. 403-430) et avant le
récapitulatif (l. 432-435) (T17, ÉCRAN-3). La carte s'ouvre SUR lui depuis le
point (`ancre('cout')`, `champInitial = 'cout'`) — le titre est un enfant
DIRECT du contenu défilant, jamais dans une vue intermédiaire. Croquis :

```
Le devis lui-même : gratuit ou payant ?                 (s.titre, ancre « cout »)
[ Gratuit ]  [ Payant ]                                 (deux Pastille, rien de choisi)
Dans vos tarifs : vos devis sont gratuits.              (la proposition, ou rien en lecture)
Prix du devis TTC                                       (si « Payant » : s.etiquette,
[ 30,00            ]                                     ChampMontant, pavé décimal,
(l'erreur, sous le champ)                                pré-rempli si payée ou proposée)
Un particulier doit savoir, avant de s’engager, …      (AIDE_COUT_DEVIS, fixe)
                                                         (puis le récapitulatif)
```

- **Rien sous le doigt ne bouge** : toucher « Gratuit » ou « Payant » monte
  ou démonte le champ SOUS les pastilles ; seul le récapitulatif, qui n'est
  pas une cible, se déplace — comme quand on allume la retenue. Aucune zone
  réservée, aucun élément rendu invisible (`CACHENT`,
  `scripts/verifier-devis.mjs:7870-7880`). `mesure-devis` le mesure (§5.5).
  Le prix du revers : allumer la retenue, plus haut, fait descendre le bloc
  — un geste sur la retenue, pas sur le bloc.
- Les pastilles écrivent par `choisir({ cout: … }, 'cout')` **seulement si le
  choix CHANGE** : une pastille déjà choisie, touchée de nouveau, ne fait
  rien (T18, ÉCRAN-4) ; leur étiquette parlée : « Le devis lui-même est
  gratuit » / « Le devis lui-même est payant » (`nom`, `ui.js:839`, ÉCRAN-14
  point 2).
- Quand « Payant » écrit le prix proposé, il le DIT : `retour.annoncer(« Prix
  du devis : {montant}, d’après vos tarifs. »)`, sur le modèle de « Ramenée
  à … » (`ConditionsDevis.js:224-230`) (ÉCRAN-14 point 3).
- Le champ : `keyboardType` décimal, `accessibilityLabel` depuis
  `libellesDesConditions` (« Prix du devis lui-même TTC, en euros », ou sans
  « TTC » en franchise), `placeholder` « Montant » (jamais un nombre : un
  texte d'exemple qui ressemble à une donnée est lu comme une donnée),
  `onBlur={() => enregistrer('cout')}`.
- Le libellé « Prix du devis TTC » partout sauf en franchise (« Prix du
  devis »).
- L'aide fixe (annexe A.2) dit aussi « Ce prix ne s'ajoute pas au total des
  travaux. » : le bloc est juste au-dessus du récapitulatif des totaux (T5).

### 3.7 `src/components/PourRemettre.js`

Rien : l'écran est générique ; les avis s'affichent sous « À vérifier »
(l. 455-458), `PAS_ENCORE_VERIFIE` sous « rien ne manque » (l. 425). Les
gabarits fixes tiennent (511 motifs, trois chiffres). Jusqu'à six avis peuvent
sortir ensemble (de l'ordre de 2 000 caractères en `T.petit`, sans « Lire la
suite ») : à juger sur l'iPhone (§6.2) ; une version plus courte des avis est
pour la relecture si c'est trop (ÉCRAN-17).

### 3.8 « Mon entreprise » et ses textes

Aucun changement d'écran. L'aide sous « Vos tarifs » (prix du devis,
`src/components/FicheEmetteur.js:1185-1196`) parle de l'arrêté de 2017 art. 3 :
inchangée. `TARIFS_NON_AFFICHES` (`src/lib/tarifs.js:95-98`) porte la même
promesse que les CGU (« serviront à préparer vos devis ») : inchangée en
2b-4 ; si le temps du verbe change un jour, les deux changent ensemble,
`verifier-tarifs` 40 (l. 1410-1421) les tient (ÉCRAN-20).

### 3.9 La démonstration

- `src/data/devis-demo.js` : « Muret de clôture » (l. 225-246)
  `coutDevisCentimes: 0` — il reste à « rien ne manque » et « aucun avis » ;
  « Terrasse en bois » (l. 247 et suivantes) `coutDevisCentimes: 3000` — il
  garde ses deux points, et montre l'avis du devis payant (Mme Martin
  commande à titre privé) ; « Rénovation salle de bains » et « Sol du
  séjour » : `coutDevisCentimes: null` ÉCRIT, jamais absent (la règle A-7 de
  `verifier-devis`) — ils montrent le point nouveau. **Un brouillon NEUF**
  (`videDevis`, l. 536 : toutes les colonnes de `CHAMPS_DEVIS` à `null`) naît
  sans prix, donc avec le point : la section de `mesure-devis` qui l'attend
  à « 4 points » en verra 5 (ÉCRAN-9, §5.5). La recherche des comptes exacts
  se refait à la construction sur « points » et « Ce devis — », pas sur les
  noms des brouillons (la recherche du v1 par les noms ne pouvait pas voir le
  brouillon neuf).
- `src/data/emetteur-demo.js` : rien. L'attestation de démonstration vaut
  200 jours (l. 98), le régime est réel (l. 75), les tarifs ne sont pas
  déclarés (l. 109) : les avis (d), (e), le gratuit avec déplacement et le
  payant face aux tarifs affichés ne se voient qu'en changeant ces données
  pendant la session — c'est ce que fait `mesure-devis` (§5.5), par le chemin
  de « Mon entreprise », dans des sections placées EN DERNIER et qui rendent
  l'état à l'identique (ÉCRAN-21).

### 3.10 Ce qui ne bouge pas à l'écran

« Le chantier » ; `EnteteDevis.js` ; `PourRemettre.js` ; `ChantierDevis.js` ;
`ApercuEntete.js` ; `PretAEmettre.js` ; l'aperçu de l'en-tête (T14) ; le bloc
public « Ses tarifs » (§1.4 point 3, §7). Relus par la critique écran. La
rangée « Conditions » ne change que par son résumé (T15).

### 3.11 La variante Q3 = 2 (services à la personne déclarés), au niveau de la construction

Pour que la réponse 2 soit chiffrable, sans être construite :

- **`emetteur.services_a_la_personne boolean`** (vide = non), une case dans
  « Mon entreprise » → « Votre activité » : « Je propose des services à la
  personne (petit jardinage, petit bricolage chez des particuliers) », et un
  champ facultatif « N° de déclaration » (3°). Opus peut MONTRER la case en
  premier aux paysagistes (`src/data/catalogue-metiers.js:567-570`) — pas aux
  élagueurs, que la circulaire exclut dès qu'ils montent dans l'arbre
  (DROIT-5) —, jamais la cocher (« jamais le métier »).
- **`devis.services_a_la_personne boolean`**, une question dans « Le
  chantier » montrée seulement si la case est cochée : « Ce devis porte-t-il
  sur des services à la personne ? » « Non » · « Oui ».
- **Deux motifs** : `devis_sap` (prudence, la question sans réponse quand la
  case est cochée) et `devis_sap_gratuit` — « Oui » et un prix > 0 —, de
  nature **« la loi » si la réponse valable est `consommateur`, « par
  prudence » si elle est vide ou `non_professionnel`**
  (`textes/arrete-2015-03-17-complet.txt:41-42`) ; la condition s'écrit
  `v_valable is null or v_valable in ('consommateur', 'non_professionnel')`,
  jamais `v_valable in (…)` seul, qui vaut `null` sans réponse (la leçon du
  lot 0a) — deux clés, ou une nature calculée (BASE-10, DROIT-19).
- **Le coût caché** : `motifs_refus_remise` lirait une SECONDE colonne
  d'`emetteur` (la porte étroite, `scripts/verifier-emetteur.mjs:1459-1497`, se
  réécrit EN LE DÉCIDANT) ; l'adresse du client (4°) resterait pour 2c (la
  fonction ne lit pas `clients`) ; le mode d'intervention (7°), le n° (3°) et
  les prix HT et TTC (art. 4 al. 3, DROIT-14) s'imprimeraient en 2c.
- Estimation : deux colonnes, deux motifs, une case, une question — du même
  ordre que 2b-3. DÉDUIT.

---

## 4. Les textes légaux (`src/data/legal.js`)

- **`VERSION`** (l. 32) prend la date du commit des textes, et un bloc
  d'historique en commentaire, titré en capitales comme celui de 2b-3
  (l. 33-54) : « JJ/MM/2026 — LE PRIX DU DEVIS LUI-MÊME (étape 2b-4 du module
  devis ; section 49 de `schema.sql`, cahier 2b-4 §4 ; réponses du
  propriétaire : Q1, Q2, Q3). Ce qui a changé DE FOND : UNE DONNÉE NOUVELLE
  COLLECTÉE pour les devis — s'ils sont gratuits ou payants, et ce que coûte
  un devis payant ; RIEN D'AUTRE (un motif n'est pas une décision
  automatique ; les avis ne décident rien) ; LA MÊME LIMITE QUE LES VERSIONS
  PRÉCÉDENTES (aucune ré-acceptation, règlement 2019/1150, art. 3.2). » Puis
  « VERSION PRÉCÉDENTE : '2026-11-13'. »
- **« Ce que nous collectons »** (l. 1448, la phrase des devis l. 1558-1571) :
  « …leur durée de validité, **s’ils sont gratuits ou payants, et ce que
  coûte un devis payant,** à quel titre le client commande, … » (annexe A.6,
  le SEUL texte — le §4 du v1 disait « et leur prix », l'annexe A.6 « et ce
  que coûte un devis payant » : deux constructions possibles d'une phrase
  comparée mot pour mot, BASE-9, ÉCRAN-7). « et leur prix » est écarté :
  « leurs prix et leurs totaux », plus loin dans la même phrase, désigne les
  prix des LIGNES. Le commentaire qui précède la section (l. 1490-1503)
  gagne un paragraphe « LE PRIX DU DEVIS LUI-MÊME, étape 2b-4 », sur le
  modèle de 2b-2 et 2b-3.
- **« Vos tarifs et vos prix »** (l. 1256-1265) : **rien ne change, et la
  promesse devient vraie.** « …et le prix de vos devis serviront à préparer vos
  devis » était fausse (aucun écran du devis ne lisait `prix_devis_centimes`,
  M5) ; la carte « Conditions » le PROPOSE désormais. Les deux contrôles qui la
  relisent (`scripts/verifier-legal.mjs:617-626` ;
  `scripts/verifier-tarifs.mjs:1393`, `:1412-1418`) restent verts sans
  retouche. DÉDUIT.
- **« Une décision automatique »**, **« Ce qui est interdit »**, le reste :
  rien. Aucun texte ne promet ce qui ne sort pas avant 2c (l'impression de la
  mention, l'adresse du client), ni ne parle de déchets ou de RGE.
- **Les empreintes** que `verifier-legal` tient (`EMPREINTE_ECRAN`, l. 2293, et
  l'empreinte de « Ce que nous collectons », l. 2243-2244) : recalculées dans
  le même commit, avec leur raison.
- **Pour 2c** (à dire, pas à écrire ici) : la mention « gratuit » ou
  « payant » imprimée, et la phrase de la conservation d'un an pour les
  services à la personne.

---

## 5. Les contrôles et les essais

### 5.1 Le relevé « avant » (les nombres de référence)

À refaire sur HEAD avant d'écrire une ligne ; lus le 16/11
(`comprendre/methode.md` §5) et en partie remesurés par la critique base
sur une copie : 56 contrôles ; `verifier-devis` **579** (mesuré,
`ref-verifier-devis.txt`), `verifier-emetteur` 282, `verifier-legal` 241,
`verifier-postes` 270 ; essai 49-remise 19 erreurs et 268 valeurs (267
annoncées + celle qui les compte) ; essai 49-conditions 27 erreurs, 43 justes,
42 colonnes au cas 18 ; essai 49 79 erreurs, 189 justes ; essai 48 22 erreurs,
78 justes ; 34 fichiers d'essais ; `cas-remise.json` 125 cas ; `cas-devis.json`
69 ; `mesure-devis` environ 892 sur 95 sections ; linter 32. Les nombres
d'essais sont LUS, À VÉRIFIER en les rejouant deux fois.

**Une leçon de la critique base, à garder** : `verifier-legal`,
`verifier-emetteur`, `verifier-tarifs` et `verifier-lectures` PLANTENT sur
`git ls-files` dans une copie sans `.git` ; un premier comptage par « ✘ » les
croyait verts. On lit le CODE DE SORTIE, jamais les « ✘ ».

### 5.2 Les essais SQL (joués deux fois, à la main — `npm run verifier` n'en joue aucun)

| fichier | ce qui change |
|---|---|
| `essais-section-49.sql` | **cas 1** : `devis` passe de 35 à **36** colonnes, et la CHAÎNE entière des colonnes (`:275`) gagne `cout_devis_centimes` (BASE-6) ; **cas 2** : `check_attendu_34` → **`check_attendu_35`**. Rien d'autre : l'essai 49 ne juge aucun refus en SQL (zéro `LAST_ERROR`, il les annonce par leur nom), il garde ses **79** erreurs (BASE-5) |
| `essais-section-49-conditions.sql` | cas 18 : `('devis','cout_devis_centimes',true,true)` dans `attendu` ET dans la liste `in (…)` des colonnes trouvées, **43** colonnes (« 34 jusqu'à 2b-1, les cinq de 49.4 ter, les trois de 2b-3, et la colonne de 2b-4 ») |
| `essais-section-49-remise.sql` | `devis_complet` gagne `cout_devis_centimes = 0` ; les cas 10, 13, 23, 24 comme au §2.6 ; **un cas 25 (2b-4)** — le cas 20 existe déjà (« à la signature », 2b-3, `:1510`) — et **le compte devient le cas 26**, toujours en dernier (BASE-2) : a) le prix vide → `devis_cout`, rang 12, `prudence`, `ligne_id` vide ; b) 0 → aucun motif du devis ; c) 3 000 → aucun ; d) vide ET la validité vide → l'ordre `[6, 12]` ; e) vide ET la décennale sans réponse sans attestation → `[11, 12]` ; f) vide pour un client « professionnel » → toujours `devis_cout` (le motif ne lit pas la réponse) ; g) l'artisan B écrit le prix du devis de A → 0 ligne, sans erreur ; **h) −1 et 100 001 refusés, nommés `devis_cout_check`, jugés EN SQL** (`:ERROR`, `LAST_ERROR_SQLSTATE` = 23514, `LAST_ERROR_MESSAGE`), et 0 et 100 000 acceptés (BASE-5 : le précédent de 2b, `devis_pour_qui_check` au cas 15 g et `devis_ligne_urgence_check` au cas 19). Les variables DÉCLARÉES D'AVANCE (six de plus, `e25h1_*`, `e25h2_*`) ; **21 erreurs** (19 + 2) ; `VALEURS_ANNONCEES` 267 → 267 + n (n compté à la construction, de l'ordre de 16) ; un paragraphe « CE QUE 2b-4 A AJOUTÉ » dans l'en-tête (`:80-87`). Le cas 14 c ne change pas (liste des tables nommées identique, aucun mot interdit nouveau) — c'est lui qui prouve que la branche ne lit ni `tarifs_pro` ni `clients` |
| les 31 autres | identiques au relevé d'avant ; un écart s'explique ou bloque (la critique base : 46, 47, 48, 50, 49-rattrapage ne changent que par des horodatages et des numéros de ligne de `schema.sql`) |

### 5.3 La parité base-téléphone (`generer-cas-remise`)

- `COMPLET` gagne `cout_devis_centimes: 0` ; `VIDE` ne change pas (§2.6) ; les
  cinq cas « NEUF » sont renommés (§2.6, BASE-8).
- Des situations **AJOUTÉES À LA FIN** de `SITUATIONS` (l. 191), les 125
  premières gardent leur numéro : **le prix vide seul, sur une fiche
  COMPLÈTE en franchise (`e: 'franchise'`)** — au régime réel,
  `conso_tva_intra` s'ajoute, et la couverture de `verifier-devis` (`seul(k)`,
  `:8937`, `attendu.length === 1`), plus stricte que celle du générateur
  (`rang < 100`), ne le compterait pas (BASE-8) ; 0 ; 3 000 ; vide avec la
  validité vide ; vide avec la décennale sans réponse ; vide au régime réel ;
  vide pour chacune des quatre réponses « à quel titre » ; vide sur un devis
  sans client (rangs 1 et 12) ; et **trois D4-c NEUFS VIDES SANS PRIX**
  (manuelle ; urgence ; demande et urgence), `{ ...VIDE,
  cout_devis_centimes: null, … }` : la preuve D4-c de `cas-remise.json`
  (`neufVide`, `scripts/verifier-devis.mjs:8945-8948`) couvre alors le motif
  nouveau contre l'origine ; `verifier-devis` gagne la vérification jumelle
  de `neufVide` avec `CLES_DU_NEUF + ',devis_cout'` (BASE-8).
- `CLES_DU_DEVIS` (l. 633) gagne `'devis_cout'` (chaque clé seule au moins une
  fois).
- **La garde des cas d'avant** (l. 714) passe de 85 à **125**, ET une garde de
  plus : « aucun des 125 premiers cas ne porte `devis_cout` » — sans elle,
  `COMPLET` oublié faisait gagner le motif à tous les cas, et la garde de
  numérotation restait verte (sabotage S5).
- Puis `node scripts/generer-cas-remise.mjs`, le diff RELU (les 125 premiers
  cas ne changent que par la clé `coutDevisCentimes` de leur `devis` et les
  cinq noms), commit de `cas-remise.json` ; `--verifier` à la main. Le
  générateur fait `drop database` sur un nom FIXE : on ne le lance jamais
  pendant qu'un autre agent s'en sert (la critique base ne l'a pas lancé pour
  cette raison).
- Rappel (`comprendre/methode.md` §4 point 8) : une parité ne voit pas ce qui
  bouge des deux côtés à la fois ; la FORME exacte du corps et l'invariant
  ci-dessus gardent le reste.

### 5.4 Les contrôles `node`

| contrôle | ce qui change | ✔ attendus (DÉDUIT) |
|---|---|---|
| `verifier-devis` | 1397-1405 : QUATRE imports, `./formats.js` (`joursEntre`) compris, et `formats.js` rejoint la liste de ceux qui n'importent RIEN ; section 12 : `AJOUTS_2B4 = ['devis: add column if not exists cout_devis_centimes bigint']` (la forme des autres listes, BASE-6) dans `AJOUTS_PERMIS` (l. 3043), `FERMEE` (l. 3051-3070) gagne `'cout_devis_centimes bigint'`, `DROITS_DE_COLONNE` (l. 2947) et `ENTETE_DEVIS` (l. 2943) la colonne, `CONTRAINTES_ATTENDUES` (l. 3140) `devis_cout_check` et `=== 34` (l. 3194) → 35 ; section 15 : `ATTENDUES` (l. 3532), `=== 34` (l. 3547) → 35, « trente-cinq », et **`FORMES_2A` (l. 3554) gagne `devis_cout_check: 'cout_devis_centimes is null or cout_devis_centimes between 0 and 100000'`** (la garde en `node` de S29, que seul l'essai tenait) ; section 16 : `CONTRAINTES_DEVIS.length === 18` (l. 3621) → 19, « dix-neuf » ; section 27 : `=== 18` (l. 7313) → 19 ; la ligne de test de `rowToDevis` (l. 7189) avec la colonne et sa valeur relue ; 40 a : `FORME_MOTIFS_REFUS_REMISE` ; 40 b : `motifsSql.length === 16` (l. 8660) et `motifsJs.length === 16` (l. 8718) → 17, `CONTRAT_B2`, la phrase de `devis_cout` en toutes lettres (le modèle de `PHRASES_DU_05_11`) ; 40 d : l'expression des erreurs (`e1[2589]`, l. 9178) voit aussi `e25…`, la liste `declarees` (l. 9204-9210) gagne `e25h1`, `e25h2`, « EXACTEMENT 21 lignes », `=== 267` et « JUGE EXACTEMENT 267 VALEURS » (l. 9212-9216) au nouveau compte (BASE-5) ; les décors « complets » qui disent « gratuit » (§2.6, BASE-1) ; B8 : `PAS_ENCORE_VERIFIE` nouveau, et la liste des faits exigés (l. 8855-8866) : « si ce devis relève des services à la personne » entre, « si le devis lui-même est payant » sort ; les avis : `AVIS_DU_DEVIS` comparé entier (l. 8838-8850) avec les SIX clés nouvelles ; l'appel figé (l. 10396) ; 42 a : `=== 16` et `size === 11` (l. 11195-11196) → 17 et 12, « dix-sept clés sur douze rangs » ; `resumeDesConditions` (l. 6221-6228, 11370-11372) réécrits EN LE DÉCIDANT avec le manque nouveau ; **une section 43 « le lot 2b-4 … FAITS TOURNER »** (le modèle : section 42, l. 11175) | 579 → environ **630** (à compter) |
| section 43 de `verifier-devis` | a. le motif (rang, nature, 200 caractères, une phrase, aucune faute de forme, « le devis lui-même », « au moins ») ; b. `lireConditions` : « Gratuit » → 0 ; « Payant » + « 0 » → l'erreur et AUCUNE écriture ; **« Payant », champ monté et vide → `null`, `erreurs` vide** (ÉCRAN-1) ; « Payant » non monté sur un devis payant → sa valeur ; non monté avec une proposition payante → la proposition ; **non monté avec des tarifs « gratuit » → `null`, jamais 0, et la saisie n'envoie rien sur un devis vide** (ÉCRAN-2) ; **« Payant » ne rend 0 dans AUCUN des états des tarifs ni du devis** (une boucle) ; 100 001 → l'erreur, `centimesLisibles` ; **un `choix` sans `cout` n'écrit rien** (ÉCRAN-4) ; c. `etatInitialConditions` : 0 → `'gratuit'`, 3 000 → `'payant'`, vide → `null`, et JAMAIS d'après les tarifs ; d. `coutDuDevisPropose` sur les cinq états des tarifs (jamais « rien » pour un échec) et `coutAProposer` (`null` pour « gratuit », « rien », « illisible », la lecture) ; e. les six avis, chacun allumé PUIS éteint par chacune de ses conditions : la décennale « Non », pas d'assurance lue (`undefined`), pas de validité, la fin la plus tardive, le délai par défaut EXACT et un délai voisin, la liste pas sûre, le régime en lecture ; **le payant pour `non_professionnel` (parle) et `professionnel` (se tait)**, **sa phrase nomme « quatorze jours » et « ne vous devra rien »** (DROIT-1) ; le payant face aux tarifs affichés (`affiche` faux → se tait) ; le franchisé : le seuil à 3 750 000 et 3 750 001, **franchise ET une ligne à 20 % → aucun avis**, **35 000 € à 20 % sans option → aucun avis (le cas mesuré par la critique droit)**, **ttcOptions au-delà sans aucune ligne option → aucun avis**, une option qui fait franchir → la seconde phrase, **aucun « HT » dans les deux** (DROIT-2, ÉCRAN-6) ; f. `joursEntre` dans trois fuseaux, la veille et le lendemain de minuit (la leçon du lot T) ; g. `PLAFONDS_FRANCHISE` : les deux montants, sa source, sa date ; h. aucun « € » écrit dans `devis.js` hors des deux amendes (l. 1416-1436, inchangée) ; i. `REGLES_DEVIS` : `validerDevis` refuse −1 et 100 001 (BASE-7, ÉCRAN-10) ; j. `CLES_DU_GESTE.cout` et `vibrerPourLaCarte('cout', …)` (ÉCRAN-11) ; k. **une garde de TEXTE jumelle de la vérification 37 de `verifier-tarifs`** : `coutDevisCentimes` ne reçoit 0 que dans la branche « Gratuit » de `lireConditions` (et dans `devis-demo.js`, qui DÉCLARE un état ; et, si Q2 = 4, la porte nommée de la création) (ÉCRAN-2) ; l. les libellés du champ et des pastilles (`libellesDesConditions`, les deux `nom`) (ÉCRAN-14) ; m. `ancre('cout')` est posée sur le titre, enfant direct du `ScrollView` (T17) | (comptés ci-dessus) |
| `verifier-legal` | une section « Étape 2b-4 — le prix du devis : les textes et ce qui les tient » (le modèle : l. 2782-2890) : `VERSION` au moins la date de 2b-4 ; le bloc d'historique cherché par son TITRE ; `PHRASE_DEVIS` (l. 2804-2806) réécrite EN LE DÉCIDANT avec « s’ils sont gratuits ou payants, et ce que coûte un devis payant, » ; l'ordre (avant « leurs lignes ») ; `NOMMEES_DEVIS` (l. 2699) gagne `cout_devis_centimes: 's’ils sont gratuits ou payants'` (BASE-9, ÉCRAN-7 — mesuré : sans elle, « nomme chaque colonne de `devis` » rougit) ; « Vos tarifs et vos prix » inchangée mot pour mot ; l'empreinte de la section recalculée | 241 → environ **246** |
| `verifier-emetteur` | rien : la porte étroite tient (la fonction ne lit d'`emetteur` que le régime) — mesuré vert sur la copie | 282 |
| `verifier-tarifs` | rien : la colonne ne s'appelle pas `prix_devis_centimes` (vérification 37) — mesuré vert ; `TARIFS_NON_AFFICHES` inchangée | inchangé |
| `verifier-postes` | **la vérification « LE RÉGIME ET SA DATE »** (`:1935-1945`) se réécrit EN LE DÉCIDANT : `regimeEtSaDate` toujours `{ regime, declareLe }` ; `assurancesDe` FAITE TOURNER (une liste, `null` sans fiche) ; le corps de `monRegimeEtSaDate…` = `{ ...regimeEtSaDate(f), assurances: assurancesDe(f) }` d'UNE lecture ; `monRegime…` inchangés. Celle de `lireRegime` (`:2430-2433`) reste vraie (ÉCRAN-8) | 270 (le nombre ne bouge pas, une vérification change de contenu) |
| `verifier-lectures` | rien : l'export prend la colonne par `to_jsonb(x)` — mesuré vert sur la copie | inchangé |
| les 56 | `npm run verifier`, code de sortie | 56 |

### 5.5 `mesure-devis` (au navigateur, en démonstration ; serveur relancé avec `-c`, module servi vérifié)

1. « Conditions » de « Rénovation salle de bains » : le bloc EN DERNIER
   (après « Retenue de garantie », avant le récapitulatif), ses deux
   pastilles à 44 points au moins, rien de choisi ; « Vos tarifs ne disent
   pas encore le prix de vos devis. » (tarifs de démonstration non déclarés).
   `ordreTitres` (`scripts/mesure-devis.mjs:1840`) gagne le titre du bloc en
   cinquième, et les aides mesurées « entre son titre et le suivant » gagnent
   `AIDE_COUT_DEVIS` (dix aides, cinq titres) ; `AFFICHAGES` de
   `verifier-devis` (l. 6870) aussi (ÉCRAN-13).
2. **Rien sous le doigt ne bouge** (T17) : la position du titre du bloc et
   des deux pastilles, avant et après un appui sur « Gratuit », puis sur
   « Payant », puis après une erreur affichée (« 0 » tapé), à 393 et à 320
   points de large — égale ; seul le récapitulatif descend. Et « Retenue de
   garantie », au-dessus, ne bouge pas.
3. « Payant », un prix tapé, la carte fermée, la liste relue : le point
   « Dites si le devis lui-même est gratuit ou payant » disparaît ; rouverte,
   la carte montre « Payant » et le prix ; le résumé de la rangée finit par
   « Devis lui-même payant 30,00 € ».
4. « 0 » tapé → la phrase ; aucune écriture partie (compteur des écritures).
5. **« Payant », champ vidé, carte fermée** → aucune bande de garde, aucune
   « Une condition n’est pas enregistrée », aucun « Un champ du devis n’est
   pas enregistré » ; le point reste (ÉCRAN-1).
6. **Une pastille déjà choisie touchée de nouveau** → aucune écriture, le
   prix reste (ÉCRAN-4).
7. Le point → « Choisir : devis gratuit ou payant » → la carte s'ouvre SUR le
   bloc (le titre dans l'écran).
8. « Mon entreprise » → « Vos tarifs » → « Mes devis sont gratuits », fermer,
   rouvrir « Conditions » : « Dans vos tarifs : vos devis sont gratuits. » ;
   « Payant » → le champ s'ouvre VIDE, **rien n'est écrit**, et rien n'est
   « gratuit » en base (ÉCRAN-2) ; puis un prix de devis payant déclaré :
   « Payant » pré-remplit le champ, l'écrit, et l'annonce.
9. « Muret de clôture » : toujours « rien ne manque » et « aucun avis » ;
   « Terrasse en bois » : toujours deux points, et l'avis du devis payant
   sous « À vérifier ».
10. **Le brouillon NEUF** (`scripts/mesure-devis.mjs:5195-5209`) : « ce devis
    — **5** points » (client, poste, lieu, validité, prix du devis), et la
    phrase de `devis_cout` dans la carte (ÉCRAN-9).
11. `PAS_ENCORE_VERIFIE` relu entier sous « rien ne manque » (le modèle de
    `scripts/mesure-devis.mjs:5013-5020`).
12. **Les sections qui changent la démonstration, EN DERNIER** (ÉCRAN-21) :
    a. l'avis (d) : la fin de l'attestation de démonstration ramenée à
       aujourd'hui + 40 jours ; « Muret » (validité 30, délai par défaut :
       horizon 60) → l'avis, avec la date ; « Le chantier » → « Non » →
       l'avis se tait ; la fermeture de « Mon entreprise » relit les
       assurances (`mesAssurances`, ÉCRAN-19) ;
    b. l'avis (e) : le régime passé en franchise, les lignes à taux corrigées
       sur un brouillon NEUF (sinon la garde de cohérence le tait, et c'est
       mesuré : avec une ligne à 20 %, aucun avis), un poste de 40 000 € →
       l'avis, avec « 40 000,00 € » et SANS « HT » ; à 30 000 € plus une
       option de 10 000 € → la phrase des options ;
    c. le gratuit avec déplacement : des frais de déplacement déclarés,
       « Gratuit » → l'avis ; le payant face aux tarifs affichés : tarifs
       « gratuit » ET affichés, un devis à 30 € → l'avis ;
    d. **l'état rendu À L'IDENTIQUE** : la fiche de démonstration
       (`emetteur`, assurances, tarifs) comparée par égalité profonde avant
       et après — des tarifs écrits puis vidés deviennent une ligne de
       `null`, que `tarifsConnus` lit pareil mais que l'égalité doit voir ;
       des frais > 0 laissés éteindraient le motif `frais_deplacement` et
       feraient naître un avis sur « Muret » (la section 2b-1 exige
       « aucun avis », `:5052`) ; la franchise laissée rendrait les lignes à
       20 % des quatre brouillons incohérentes.
13. Invariant de fin : les sections 2b-4 ne laissent aucun brouillon (le
    procédé de 2b-3, `scripts/mesure-devis.mjs:4609-4633`).

Attendu : environ **892 + 50**. Un passage complet dépasse peut-être la limite
d'une commande : rejouer une section coupée avec `SEULEMENT=`, et lire le
message d'un « ✘ » avant d'accuser le code (2b-3).

### 5.6 Les sabotages à poser (chacun doit être refusé par le contrôle nommé)

| # | défaut remis à la main | doit être vu par |
|---|---|---|
| S1 | la branche du rang 12 retirée de la base | essai 49-remise cas 25 ; `cas-remise --verifier` ; `verifier-devis` 40 a |
| S2 | la nature changée en base seulement | `verifier-devis` 40 b |
| S3 | la phrase changée dans `MOTIFS_DEVIS` seulement | `verifier-devis` 40 b |
| S4 | `if v_cout = 0` au lieu de `is null` | essai 49-remise 25 a/b ; `cas-remise --verifier` |
| S5 | `COMPLET` sans le 0 (et le fichier régénéré) | la garde nouvelle du générateur (§5.3) |
| S6 | `lireConditions` écrit 0 pour « 0 » tapé | `verifier-devis` 43 b |
| S7 | « Payant », champ monté et vide, rend une ERREUR (le comportement du v1) | `verifier-devis` 43 b ; `mesure-devis` 5 |
| S8 | `etatInitialConditions` choisit « Gratuit » d'après les tarifs | `verifier-devis` 43 c |
| S9 | la colonne oubliée dans `grant update` | essai 49-conditions cas 18 ; `verifier-devis` `DROITS_DE_COLONNE` |
| S10 | `devisVersBase` oublie la colonne | `verifier-devis` (la traduction FAITE TOURNER, l. 5001-5024 ; « chacune des colonnes a un ÉCRIVAIN ») |
| S11 | `rowToDevis` l'oublie | `verifier-devis` (l. 7189) et 40 c (le format des cas) |
| S12 | (d) : `fin < jour` au lieu de `joursEntre(jour, fin) < horizon` | `verifier-devis` 43 e |
| S13 | (d) parle malgré « Non » à la décennale | `verifier-devis` 43 e |
| S14 | (d) ajoute 30 jours pour tout délai | `verifier-devis` 43 e |
| S15 | (d) prend la PREMIÈRE fin, pas la plus tardive | `verifier-devis` 43 e |
| S16 | (e) parle sans liste sûre | `verifier-devis` 43 e |
| S17 | (e) compare le TTC au lieu du net hors options | `verifier-devis` 43 e |
| S18 | `PLAFONDS_FRANCHISE` écrit « 37 500 € » en dur dans la phrase | `verifier-devis` (la règle « € », l. 1416-1436) et 43 g |
| S19 | l'avis du devis payant parle pour « professionnel » | `verifier-devis` 43 e |
| S20 | l'avis du gratuit parle avec des frais à 0 | `verifier-devis` 43 e |
| S21 | l'appel des avis n'envoie pas `assurances` | `verifier-devis` (l'appel figé, l. 10396) |
| S22 | `PAS_ENCORE_VERIFIE` garde « si le devis lui-même est payant » | `verifier-devis` B8 ; `mesure-devis` 11 |
| S23 | la phrase « Ce que nous collectons » sans le fait nouveau | `verifier-legal` 2b-4 |
| S24 | un quatrième import autre que `./formats.js` | `verifier-devis` 1397 |
| S25 | `ENDROIT_DU_MOTIF` sans `devis_cout` | `verifier-devis` (« une étiquette par motif », section 42) |
| S26 | le bloc remis après « Validité de l'offre » | `mesure-devis` 1 et 2 (l'ordre des titres ; « Retenue » qui bouge) |
| S27 | la fonction lit `tarifs_pro` pour proposer | essai 49-remise 14 c ; `verifier-emetteur` (porte étroite) |
| S28 | un cas de l'essai 25 retiré | l'essai (un `f` à sa place, le compte des valeurs au cas 26) |
| S29 | la contrainte bornée à 1 000 000 | essai 49-remise 25 h (100 001 accepté) ; `verifier-devis` `FORMES_2A` |
| S30 | `lireRegime` ne pose plus `mesAssurances` à la fermeture de « Mon entreprise » | `mesure-devis` 12 a |
| S31 | la colonne retirée du `grant insert` (BASE-11) | essai 49-conditions cas 18 ; `verifier-devis` `DROITS_DE_COLONNE` |
| S32 | un décor « complet » de `verifier-devis` sans le 0 (BASE-1) | `verifier-devis` (il rougit déjà : c'est la preuve que le 0 est nécessaire) |
| S33 | `coutPropose` vaut `propose.centimes` sans regarder l'état (ÉCRAN-2) | `verifier-devis` 43 b et 43 k ; `mesure-devis` 8 |
| S34 | une pastille déjà choisie, retouchée, écrit `null` (ÉCRAN-4) | `verifier-devis` 43 b ; `mesure-devis` 6 |
| S35 | (e) sans la garde de cohérence, ou sans exiger une option (DROIT-2) | `verifier-devis` 43 e (les deux cas mesurés) |
| S36 | (e) écrit « HT » (ÉCRAN-6) | `verifier-devis` 43 e |
| S37 | l'avis du devis payant se tait pour `non_professionnel` (DROIT-3) | `verifier-devis` 43 e |
| S38 | la phrase du devis payant sans « quatorze jours » (DROIT-1) | `verifier-devis` 43 e ; `AVIS_DU_DEVIS` comparé entier |
| S39 | `REGLES_DEVIS` sans `devis_cout_check` (BASE-7) | `verifier-devis` 43 i |
| S40 | `CLES_DU_GESTE` sans `cout` (ÉCRAN-11) | `verifier-devis` 43 j |
| S41 | le résumé sans « Devis lui-même : gratuit ou payant ? à choisir » (ÉCRAN-15) | `verifier-devis` (`resumeDesConditions`) |
| S42 | l'avis « tarifs affichés gratuits » parle avec `affiche` faux (DROIT-11) | `verifier-devis` 43 e |
| S43 | `monRegimeEtSaDate` lit les assurances par une SECONDE lecture (ÉCRAN-8) | `verifier-postes` (la vérification réécrite) |
| S44 | la migration rejoue le bloc 49.7 sans `grant select, delete` (BASE-4) | la simulation (empreinte du catalogue) ; `verifier-devis` (« six `grant` exacts ») |

---

## 6. L'essai sur la vraie base, et les questions pour l'iPhone

### 6.1 Le protocole

Après la migration, par le chemin de l'application (`curl`, clé publiable et
jeton de chaque compte) — le protocole de 2b-3 (`comprendre/methode.md` §3
points 15 et 16) : deux artisans jetables `…@exemple-opus.test` à Brest,
inscrits sur les deux preuves SIRET `essai` déjà en base (SIRET fictifs,
réécrites pour leurs adresses avec l'accord du propriétaire) ;
`enregistrer_vues` neutralisé ; **le régime de TVA déclaré AVANT le premier
poste** ; **chaque écriture d'un devis ou d'une ligne porte un numéro
d'écriture (`generation`) plus grand que le précédent** — sinon OP015 ou
OP016, l'écueil de l'essai réel de 2b-1 (BASE-11) ; à CHAQUE pas, la liste de
la base comparée à `motifsDeRemise` au caractère près.

| | attendu |
|---|---|
| un devis complet de A, le prix vide | la liste porte `devis_cout`, rang 12, `prudence`, la phrase exacte |
| A écrit 0 · 3 000 · `null` | 204 ; le motif part, part, revient |
| A crée un devis avec 0 d'emblée (`insert`) | 201 : le droit d'insertion porte la colonne |
| A écrit −1 · 100 001 | **400 · 23514 · `devis_cout_check`** |
| A lit puis supprime un brouillon d'essai | 200 · 204 : la lecture et la suppression restent accordées (BASE-4) |
| B écrit le prix du devis de A | 204, **0 ligne** ; la liste de A inchangée |
| B demande la liste du devis de A | **OP027** |
| un visiteur | 401 |
| le prix vide et la validité vide | rangs 6 et 12, dans cet ordre |
| A, client « professionnel », prix vide | `devis_cout` toujours là |
| l'export de A | `cout_devis_centimes` dans ses devis ; rien de B |
| les totaux de A relus pendant les bascules du prix | identiques (hors des totaux) |
| le ménage | base revenue à 14 comptes, 3 devis, 11 lignes, 8 fiches pro ; les deux preuves SIRET d'essai restent (le connecteur refuse un `delete`) |

**Non couverts sur la vraie base, et dits** : les six avis (calculés au
téléphone, l'essai reproduit les requêtes à la main, pas l'écran) ; la file
d'écriture elle-même ; un téléphone hors de l'heure de Paris.

### 6.2 Les questions pour l'iPhone

1. « Conditions » : le bloc « Le devis lui-même : gratuit ou payant ? », EN
   DERNIER sous la retenue, se trouve-t-il bien ? Les deux pastilles se
   touchent-elles au pouce ?
2. Vos tarifs disent « gratuit » : la phrase « Dans vos tarifs : vos devis
   sont gratuits. » est-elle claire ? Un appui sur « Gratuit » suffit-il ?
3. « Payant » : le champ s'ouvre-t-il sous les pastilles sans que les
   pastilles bougent ? Le pavé numérique et la virgule ? Le clavier cache-t-il
   le champ, tout en bas de la carte ?
4. Le point « Dites si le devis lui-même est gratuit ou payant » : le bouton
   ouvre-t-il la carte sur le bon bloc ?
5. Votre brouillon valable 60 jours : l'avis sur votre attestation décennale
   apparaît-il sous « À vérifier », et se comprend-il ?
6. Plusieurs avis l'un sous l'autre sous « À vérifier » : est-ce trop long
   à lire ?
7. VoiceOver sur les deux pastilles (« Le devis lui-même est gratuit »), sur
   le champ, et sur l'annonce du prix rempli d'après vos tarifs.
8. La phrase « Pas encore vérifié » nouvelle, sous « rien ne manque » ; et le
   résumé de la rangée « Conditions ».

---

## 7. Ce que 2b-4 ne fait PAS

**À l'étape suivante (2b-5, 2b-6), si Q1 = 1** : les déchets (§8.1), la
classe de blancs consolidée AVANT (S7) ; le RGE (§8.2).

**En 2c** (la remise, le document, le numéro) :

- imprimer « gratuit » ou « payant » (et le prix) — où, sur le gabarit, est une
  décision de 2c ; le refus de remise lit la MÊME liste (rang 12 compris) ;
- **recalculer l'avis (d) au jour de la remise** : calculé sur un brouillon,
  il sous-estime (la validité court de la date de REMISE, `docs/A-FAIRE.md:2959-2968`,
  cité par `completude.md` S8) ; la date de début des travaux n'est connue
  nulle part (« Pas encore vérifié » le dit) ;
- **la copie figée du client**, et avec elle son adresse (art. 7 4° de 2015,
  si Q3 = 2) ;
- l'imputation du prix du devis sur les travaux, et son taux de TVA (J13,
  J50) ;
- la qualité d'« artisan » (S1, Q6) ;
- la conservation d'un an d'un devis de services à la personne (art. 6) ;
- les prix HT ET TTC de chaque prestation si Q3 = 2 (art. 4 al. 3 de 2015,
  DROIT-14).

**Au module facture** : laquelle des attestations joindre à la facture (J20) ;
la mention du coût de gestion des déchets d'un équipement électrique ménager
revendu (`textes/env-L541-10-20.txt:7`, `droit/dechets-verif.md` §2 point 9) ;
**la note due « avant paiement du prix » d'un devis payant dès 25 € TTC**
(`textes/arrete-1983-10-03-complet.txt:5`), ou la facture à un client
professionnel (DROIT-16).

**Jamais ici** : lire `tarifs_pro`, `clients` ou `professional_profiles` dans
`motifs_refus_remise` ; décider par le métier ; écrire un prix de devis sans
appui (sauf si Q2 = 4, une porte nommée) ; un motif tiré d'un avis.

**Rangé, pour qu'on ne le redécouvre pas** (dans `docs/A-FAIRE.md`, « Après
l'étape 2b-4 ») :

- **S1, la qualité d'« artisan »** : Q6 (2c ou jamais) ; et le mot
  « Artisans » déjà affiché dans Opus pour tous les pros (§1.4 point 9, J49) ;
- **S2, la main-d'œuvre hors établissement** : close au lot 1
  (`docs/CAHIER-LOT-1.md:299`, `:326`, cités par `completude.md` S2) ;
- **S3, la cohérence entre les tarifs et le devis** : un devis GRATUIT par
  exception alors que les tarifs disent payant est VOULU (services à la
  personne, K5) ; un devis PAYANT alors que les tarifs AFFICHÉS disent
  gratuit a désormais son avis (DROIT-11) ;
- **le bloc public « Ses tarifs »** (« Prix du devis : Gratuit » à côté du
  déplacement, J12) : rien ne change ; à décider avec le juriste ; et
  l'affichage peut-être dû (J11, §1.4 point 10) ;
- **« au moins » dans les phrases de `devis_lieu` et `devis_validite`** : elles
  disent « La loi le demande pour … signé dans vos locaux », la même
  étroitesse que celle corrigée pour le prix (DROIT-12) ; les changer touche
  `PHRASES_DU_05_11`, `cas-remise.json` et des textes de `mesure-devis` : un
  lot à part, après le juriste (J3) ;
- **la franchise de la première année** : l'avis (e) ne parle qu'au-delà du
  plafond entier ; abaisser le seuil demanderait la date de création de
  l'entreprise (la preuve SIRET la range-t-elle ? À VÉRIFIER) (DROIT-18) ;
- **« Corriger » rouvre « Conditions » en haut** pour la validité et la
  retenue (défaut déjà là ; 2b-4 ne le corrige que pour le prix, ÉCRAN-18) ;
- **la longueur des avis** cumulés sous « À vérifier » (ÉCRAN-17) : à juger sur
  l'iPhone ;
- **les deux copies de la mention de franchise** (`src/lib/devis.js:213` et
  `LIBELLES_IMPRIMES` d'`emetteur.js`, M13) : rien en 2b-4, à réunir quand
  `mentions-devis.js` naîtra (2c) ;
- **L. 223-8 et L. 122-26** (§1.4) : hors du devis, au juriste (J46, J47) ;
- **la sous-traitance** (RGE, L. 224-115 ; déchets, J34) : Opus ne la
  modélise pas encore ; pour le RGE, son omission rend le contrat nul : la
  question de 2b-6 la pose (Q5, §8.2) ;
- **une date de début des travaux** (option d3 de `comprendre/ecran.md`) :
  écartée ; l'avis (d) s'en passe ;
- les avis non mesurés sur l'iPhone, la proposition du prix quand les
  tarifs changent pendant la saisie (elle suit `mesTarifs`,
  `src/OpusApp.js:916`, M12), et ce que la relecture rangera.

---

## 8. Conception de 2b-5 (déchets) et de 2b-6 (RGE) — pour que leurs formes se demandent le moment venu

Rien de ce qui suit ne se construit en 2b-4.

### 8.1 Les déchets de chantier (2b-5) — Q4

**Le droit** (`droit/dechets.md`, corrigé par `droit/dechets-verif.md`) :

- tout devis de **construction, rénovation ou démolition de bâtiments**, et de
  **jardinage**, mentionne quatre rubriques (`textes/env-L541-21-2-3.txt:5` ;
  `textes/env-D541-45-1.txt:7-17`), ÉTABLI : 1° une estimation de la quantité
  totale ; 2° les modalités de gestion et d'enlèvement — l'effort de tri, la
  nature des déchets collectés séparément, et pour le jardinage le broyage ou
  autres dispositions ; 3° chaque point de collecte, avec raison sociale,
  adresse et type d'installation ; 4° une estimation des coûts de gestion ET
  d'enlèvement ;
- **tout client** (le texte ne distingue pas), DÉDUIT ;
- une **amende administrative** jusqu'à 3 000 € (personne physique) ou
  15 000 € (personne morale), prononcée par l'autorité chargée de la
  consommation (DGCCRF, DREETS ou DDPP), ÉTABLI ;
- le dépannage, la petite réparation, l'entretien : **incertains** (J27) ;
- l'exception PEMD renvoie à un article abrogé (J26) et ne vise que des
  démolitions ou rénovations significatives de plus de 1 000 m² cumulés, ou
  certains bâtiments ayant abrité des substances classées dangereuses : rare
  chez un artisan, DÉDUIT ;
- pour qui doit trier, **le plâtre est toujours une collecte séparée**
  (`droit/dechets-verif.md` §2 point 4) ; le point de collecte doit être une
  installation AUTORISÉE (L. 541-2 al. 3, point 6) ;
- **hors du devis** : l'entreprise conserve les bordereaux délivrés par
  l'installation et les transmet au commanditaire des travaux s'il le demande
  (`textes/env-L541-21-2-3.txt:7`, `:9`, ÉTABLI ; police de L. 541-3,
  `droit/dechets-verif.md` §2 point 3) ; Opus ne les range pas (DROIT-17).

**La forme recommandée (Q4 = 1)**, au niveau de la conception :

| quoi | où | donnée |
|---|---|---|
| « Ces travaux produisent-ils des déchets de chantier ? » « Non » · « Oui (par défaut) » | « Le chantier », quatrième question | `devis.dechets boolean`, vide = « Oui » par prudence (le modèle d'`engage_decennale`) |
| les lieux de dépôt, rangés une fois | « Mon entreprise » → « Vos déchets » : raison sociale, adresse, type (déchèterie publique, déchèterie ou plateforme professionnelle, point de reprise d'un négoce, installation de tri ou de transit, installation de stockage de déchets inertes, centre de recyclage, collecteur qui pose une benne) | une table privée nouvelle, le modèle d'`emetteur_assurances` : TROIS colonnes de texte |
| la carte « Déchets » d'un devis | une rangée sous « Le chantier » | la quantité (millièmes) et son unité (m³, t), les flux triés (une liste fermée : papier, métal, plastique, verre, textiles, bois, fraction minérale, plâtre, déchets verts), un texte de modalités (facultatif), le ou les lieux choisis, le coût estimé (centimes, HORS des totaux) |
| les motifs | rang 13, au plus une clé | `devis_dechets` (prudence : la question vide) ; `devis_dechets_rubriques` (la loi : « Oui » et une rubrique manque) |

- **Le coût** : un champ « estimation », hors des totaux, parce que la loi
  demande une ESTIMATION, pas un prix (DÉDUIT, `droit/dechets.md` §8 (ii)) ; si
  l'artisan le fait payer, c'est une ligne du devis, comme aujourd'hui. « Offert »,
  « inclus », 0 € : J29. (Q4 = 3 impose la ligne.)
- **Le coût caché de la réponse 1** : deux colonnes de texte au moins (le
  texte de modalités, et les trois de la table des lieux) — **la classe de
  blancs consolidée AVANT** (huit copies dans cinq fonctions SQL et deux
  constantes JavaScript, `completude.md` S7) ; `motifs_refus_remise` lirait
  une table de plus (la liste du cas 14 c s'ouvre EN LE DÉCIDANT) ; la mémoire
  des lignes et la base de postes ne sont pas touchées (le coût n'est pas une
  ligne, M3).
- **Pour le propriétaire aujourd'hui** : ses métiers (charpentier, couvreur,
  façadier, maçonnerie générale) font de presque chacun de ses devis un devis
  concerné ; ses trois brouillons gagneraient le point (`completude.md` S6).
- **Le vocabulaire** : jamais « registre des déchets » dans une phrase de
  motif d'entreprise (`src/lib/emetteur.js:855-865`, M10) ; aucun chiffre dans
  une phrase de motif (l'amende se dit dans une aide, ce qui serait une
  troisième exception à la règle du « € » de `devis.js` : à décider, comme R3
  en 2b-3).

### 8.2 Le label RGE (2b-6) — Q5

**Le droit** (`droit/rge.md`, corrigé par `droit/rge-verif.md`) :

- le **déclencheur est la NATURE des travaux** (afférents à un logement, en vue
  d'économies d'énergie ou de production d'énergie renouvelable, et pour
  lesquels l'octroi d'aides est subordonné à un label) et un client
  **consommateur** (`textes/conso-L224-114.txt:5`), ÉTABLI pour la lettre,
  DÉDUIT pour « la catégorie, pas l'aide demandée » (J37) ;
- l'artisan **non RGE doit le dire**, avec les conséquences sur les aides
  (`textes/conso-L224-114.txt:5`) ; s'il l'est, un justificatif « délivré par un
  organisme agréé » est annexé (`:7`), ÉTABLI ;
- **la sous-traitance doit se dire** (L. 224-115 : l'information, l'identité
  des sous-traitants et leur label, dans le contrat), **sans condition d'aide**
  (`textes/conso-L224-115.txt`, I à III), ÉTABLI (J39) ;
- **contrat nul** pour l'un ou l'autre manquement (L. 224-114 ET L. 224-115,
  `textes/conso-L242-51.txt:9`), et amende jusqu'à 15 000 € / 75 000 € pour
  L. 224-114 (`:5`), ÉTABLI (DROIT-9) ;
- le photovoltaïque peut entrer dans le champ par l'obligation d'achat (J44) ;
- **la garde « jamais le RGE comme condition d'un taux de TVA » tient**, au CGI
  comme au CIBS de 2027 (§1.1) ; le 5,5 % du photovoltaïque et des bornes a sa
  propre qualification : pour le lot TVA.

**La forme recommandée (Q5 = 1)**, au niveau de la conception :

| quoi | où | donnée |
|---|---|---|
| « Ces travaux portent-ils sur l'énergie d'un logement (isolation, chauffage, eau chaude, ventilation, fenêtres, énergie renouvelable) ? » | « Le chantier », montrée quand la réponse valable est « à titre privé », « association, copropriété, société civile » (prudence, décision du 09/11, DROIT-9) ou vide (prudence) | `devis.travaux_energie boolean` ; vide = motif (prudence) |
| « Confiez-vous une partie de ces travaux à un sous-traitant ? » | « Le chantier », sous la précédente, si « Oui » | `devis.sous_traitance_energie boolean` ; vide = motif (prudence) ; « Oui » → les sous-traitants et leur label (une liste, à concevoir : leurs noms sont des données de TIERS) |
| le label de l'artisan | « Mon entreprise » → « Vos qualifications » : « Je détiens un signe de qualité RGE » oui / non, pour quelles catégories, le justificatif (un fichier dans `documents`), sa date de fin | des colonnes de l'émetteur, ou une table, à décider ; **jamais le badge `rge` de la fiche publique** (posé par l'administration : « le badge ne se décerne pas soi-même ») ; les colonnes `rge_declare`, `rge_numero`, `rge_url`, `rge_expire` existent et sont vides partout (`comprendre/vraie-base.md`) |
| les motifs | rang 14 | `devis_rge` (prudence : la question vide pour un particulier) ; `devis_rge_label` (la loi : « Oui », un particulier, et ni « oui » ni « non » déclaré dans « Mon entreprise », ou « oui » sans justificatif) ; `devis_rge_sous_traitance` (la loi : « Oui » à la sous-traitance et aucun sous-traitant décrit) |
| ce que le devis imprimera (2c) | | « Je détiens… » avec le justificatif annexé, ou « Je ne détiens pas… » et la phrase des conséquences (J43) ; les sous-traitants et leur label |

- **Le vocabulaire** : jamais « certifié RGE », « vérifié » ni « agréé » à
  propos de l'artisan (M10) ; « Vous déclarez détenir… ».
- **Une limite à dire** : un label se délivre par catégorie, et peut être
  suspendu en cours de route (`droit/rge.md` §1.8) : un « oui » déclaré ne dit
  pas que CES travaux sont couverts (S5). Une source publique (l'ADEME, par
  SIRET, SECONDAIRE) peut CONTRÔLER une déclaration, jamais la décerner.
- **Pour le propriétaire aujourd'hui** : aucun « oui » déclaré ; ses métiers
  touchent rarement l'énergie d'un logement (une isolation de toiture, une
  isolation par l'extérieur) : la question se poserait sur ses devis à des
  particuliers.

---

## Annexe A — Le contrat (texte exact ; apostrophe typographique ’ ; guillemets « » avec des espaces ordinaires, comme dans le code)

Longueurs mesurées avec `node` le 16/11 (`mesures/phrases-v2.mjs` du dossier
de travail), les trous `{…}` comptés comme écrits.

### A.1 Le motif

| rang | clé | condition (base) | miroir | nature | phrase | car. |
|---|---|---|---|---|---|---|
| 12 | `devis_cout` | `v_cout is null` | `!present(d.coutDevisCentimes)` | `prudence` | Dites si le devis lui-même est gratuit ou payant. La loi le demande au moins pour un dépannage, une réparation ou un entretien signé dans vos locaux ; Opus ne sait pas encore si ce devis en est un. | 197 |
| 12 | `devis_cout` (si Q2 = 2) | idem | idem | `regle_opus` | Dites si le devis lui-même est gratuit ou payant. La loi le demande au moins pour un dépannage, une réparation ou un entretien signé dans vos locaux ; Opus le demande pour tous vos devis. | 187 |

Vérifié pour les deux : aucun chiffre, « € », apostrophe droite, insécable ni
barre ; un point final ; 200 caractères au plus ; la prudence dit « La loi le
demande » ET « Opus ne sait pas encore » ; la règle finit par « Opus le
demande pour tous vos devis. » (`mesures/phrases-v2.mjs`).

Le bouton du point : **« Choisir : devis gratuit ou payant »** (33
caractères), qui ouvre « Conditions » sur le champ `cout`.

### A.2 La carte « Conditions » — le bloc (EN DERNIER, avant le récapitulatif)

| quoi | texte | car. |
|---|---|---|
| titre | Le devis lui-même : gratuit ou payant ? | 39 |
| pastilles | Gratuit · Payant | — |
| étiquette parlée des pastilles (`nom`) | Le devis lui-même est gratuit · Le devis lui-même est payant | — |
| proposition, tarifs « gratuit » | Dans vos tarifs : vos devis sont gratuits. | 42 |
| proposition, tarifs « payant », hors franchise | Dans vos tarifs : {montant} TTC. | 32 |
| proposition, tarifs « payant », franchise | Dans vos tarifs : {montant}. | — |
| proposition, rien de déclaré | Vos tarifs ne disent pas encore le prix de vos devis. | 53 |
| proposition, tarifs en échec | Vos tarifs n’ont pas pu être lus. | 33 |
| proposition, tarifs en lecture | (rien) | — |
| libellé du champ, hors franchise / franchise | Prix du devis TTC / Prix du devis | — |
| étiquette parlée du champ, hors franchise / franchise | Prix du devis lui-même TTC, en euros / Prix du devis lui-même, en euros | 36 |
| `placeholder` | Montant | — |
| annonce quand « Payant » écrit la proposition (`retour.annoncer`) | Prix du devis : {montant}, d’après vos tarifs. | 46 |
| erreur : 0 tapé | Pour dire que ce devis est gratuit, touchez « Gratuit ». | 56 |
| erreur : au-delà | Le prix d’un devis s’écrit jusqu’à {max}. ({max} = `centimesLisibles(100000)`, « 1 000,00 € ») | 41 |
| champ vide sous « Payant » | **aucune erreur** : rien de dit (T18, ÉCRAN-1) | — |
| aide fixe (`AIDE_COUT_DEVIS`) | Un particulier doit savoir, avant de s’engager, si le devis lui-même est gratuit ou payant, et ce qu’il coûte. Ce prix ne s’ajoute pas au total des travaux. Pour des services à la personne chez un particulier (petit jardinage, petit bricolage), le devis est toujours gratuit. | 275 |

{montant} = `centimesLisibles(centimes)`, ses espaces insécables comprises.
L'aide : la première phrase est DÉDUITE de l'art. 2 de l'arrêté de 2017
(`textes/arrete-2017-01-24-complet.txt:20`, `:26`) et de L. 111-1 2° hors de son
champ (`droit/payant-2017-sap.md` §5.1) ; la deuxième dit le calcul d'Opus
(T5) ; la troisième vient de l'art. 6 de l'arrêté de 2015
(`textes/arrete-2015-03-17-complet.txt:41-42`), ÉTABLI. La phrase « Écrivez le
prix du devis, ou touchez « Gratuit ». » du v1 est RETIRÉE (ÉCRAN-1).

### A.3 Les avis (sous « À vérifier »)

| clé | quand | texte | car. |
|---|---|---|---|
| `avis_devis_payant` | liste sûre ; prix > 0 ; la réponse vue par la base n'est pas « professionnel » | Le devis lui-même est payant : convenu chez votre client, au téléphone ou par messages, il peut être un contrat à lui seul. Votre client peut alors se rétracter pendant quatorze jours ; si vous lui remettez le devis avant, sans sa demande écrite de le recevoir tout de suite, il ne vous devra rien. Convenu chez lui, il faut aussi un écrit signé (ou un support durable qu’il accepte) avec le formulaire de rétractation, et rien ne se reçoit avant le 8e jour, pas même un chèque. Opus ne prépare pas encore ce contrat : faites-le relire avant de faire payer un devis. | 566 |
| `avis_devis_payant_tarifs_gratuits` | tarifs lus ; affichés ; prix du devis à 0 dans les tarifs ; prix de CE devis > 0 | Le devis lui-même est payant, mais vos tarifs affichés disent que vos devis sont gratuits : un client peut y voir une annonce trompeuse. Changez vos tarifs dans « Mon entreprise », ou faites ce devis gratuitement. | 213 |
| `avis_devis_gratuit_deplacement` | prix = 0 ; tarifs lus ; frais de déplacement > 0 | Le devis lui-même est dit gratuit, mais vos tarifs comptent des frais de déplacement : si vous les faites payer pour venir établir ce devis, ne le présentez pas comme gratuit — la loi peut y voir une pratique trompeuse. | 219 |
| `avis_attestation_echeance` | la décennale n'est pas « Non » ; assurances lues ; validité dite ; une attestation décennale jointe et valable, la plus tardive finissant avant aujourd'hui + validité (+ 30 jours si le délai est EXACTEMENT celui par défaut) | Votre attestation décennale est valable jusqu’au {fin}. Si elle vaut pour l’ensemble de vos chantiers, elle ne couvre en principe que ceux qui s’ouvrent jusqu’à cette date ; selon la date où ce devis sera accepté, ce chantier pourrait s’ouvrir après. C’est alors en principe l’attestation suivante qui comptera, sauf si ce chantier est déjà ouvert : une déclaration d’ouverture déposée, un premier ordre de service donné, ou d’autres entreprises qui ont commencé. Demandez-la à votre assureur, et pensez à la donner à votre client. | 531 |
| `avis_franchise_plafond` | régime « franchise » ; liste sûre ; aucune ligne qui contredit la franchise ; total net hors options > 3 750 000 centimes | Ce devis atteint à lui seul {montant}. {SUITE} | 556 |
| `avis_franchise_plafond_options` | idem, mais seul le total toutes options comprises dépasse, ET au moins une ligne « option » | Avec ses options, ce devis atteint {montant}. {SUITE} | 563 |

`{SUITE}` (`SUITE_AVIS_FRANCHISE`, écrite UNE fois, ÉCRAN-17) : « En franchise
de TVA, les travaux comptent en principe comme des prestations de services :
au-delà de {seuil_en_cours} sur une même année civile, la franchise cesse à
partir du jour du dépassement ; au-delà de {seuil_precedent}, vous n’y avez
plus droit à partir du 1er janvier suivant. D’autres plafonds peuvent
s’appliquer selon les matériaux que vous fournissez, ou si votre entreprise a
été créée cette année. Opus ne connaît pas votre chiffre d’affaires : vérifiez
avec votre comptable avant de remettre ce devis. »

{fin} = `dateFrancaise(fin)` ; {seuil_en_cours} = « 41 250,00 € »,
{seuil_precedent} = « 37 500,00 € » (`centimesLisibles` des deux plafonds). La
suite de la franchise est celle de `droit/franchise-attestation.md` §1.8,
jugée juste par sa vérification et par la critique droit ; la première
phrase ne dit plus « HT » (DROIT-2, ÉCRAN-6). Celle de l'attestation suit
`droit/franchise-attestation-verif.md` §3 point 3 et DROIT-8. Celle du devis
payant suit DROIT-1 et DROIT-3 : elle nomme ce qui coûte le plus (la
rétractation et « il ne vous devra rien », `textes/conso-L221-18.txt:5`,
`textes/conso-L221-25.txt:5`, `:9`), « un écrit signé (ou un support durable
qu'il accepte) » (`textes/conso-L221-9.txt:5`) et « pas même un chèque »
(`textes/conso-L221-10.txt:5`, la phrase déjà dans `ECHEANCE_ACOMPTE`) ;
« demande écrite » même à distance est plus prudent que la loi (« par tout
moyen »), à confirmer (J2). Celles du payant face aux tarifs affichés et du
gratuit avec déplacement sont DÉDUITES de `textes/conso-L121-4.txt:49` et
`textes/conso-L121-5.txt:5` (J12).

**Si Q2 = 3** : un septième avis, `avis_devis_cout_pas_dit`, « Vous n’avez pas
dit si le devis lui-même est gratuit ou payant. » (63), qui suit l'écran.

**Les quatre avis existants ne changent pas** (`src/lib/devis.js:4378-4385`) ;
`avis_gratuit` (« Ce devis ne coûte rien au client : vérifiez que c’est
voulu. ») parle du TOTAL à 0 ; les clés nouvelles disent « le devis lui-même »
(T19), et les deux peuvent sortir ensemble sans se confondre.

### A.4 Les phrases qui changent

**`PAS_ENCORE_VERIFIE`** (`src/lib/devis.js:4506-4509`), aujourd'hui :

> Pas encore vérifié : le moment de la signature, si une ligne marquée
> « réparation urgente » l’est vraiment, si le devis lui-même est payant, les
> déchets de chantier, le label RGE pour des travaux d’énergie, les conditions
> du taux réduit de TVA (l’ancienneté du logement, la certification du
> client), et si votre attestation décennale couvre ces travaux (ses
> activités, la date où le chantier s’ouvrira).

après 2b-4 (417 caractères ; aucun chiffre, aucune date, ni « lot », ni « le
prix du devis », mesuré) :

> Pas encore vérifié : le moment de la signature, si une ligne marquée
> « réparation urgente » l’est vraiment, si ce devis relève des services à la
> personne, les déchets de chantier, le label RGE pour des travaux d’énergie,
> les conditions du taux réduit de TVA (l’ancienneté du logement, la
> certification du client), et si votre attestation décennale couvre ces
> travaux (ses activités, la date où le chantier s’ouvrira).

Copiée EN TOUTES LETTRES dans `verifier-devis` (B8, l. 8793) et dans
`mesure-devis` (l. 5013-5020) : les deux se réécrivent dans le même commit.

**Le résumé de la rangée « Conditions »** (`resumeDesConditions`) : en tête,
après « Validité à choisir », « Devis lui-même : gratuit ou payant ? à
choisir » (46) ; en fin, « Devis lui-même gratuit » (22) ou « Devis lui-même
payant {montant} » (31).

**Les commentaires et les compteurs** : « dix-huit contraintes de `devis` »
→ « dix-neuf » (`src/lib/devis.js:175`) ; « trente-trois ici » → « trente-quatre
ici » (`supabase/schema.sql:13275`) ; « rangs 1 à 11 » → « rangs 1 à 12 » (49.9
et le commentaire de la fonction) ; « SEIZE CLÉS SUR ONZE RANGS » → « DIX-SEPT
CLÉS SUR DOUZE RANGS » (`scripts/verifier-devis.mjs:8639`) ; « huit motifs plus
un par ligne fautive (508 au plus) » → « onze motifs plus un par ligne fautive
(511 au plus) » (`src/lib/devis.js:4739-4742`, faux depuis 2b-3, ÉCRAN-12).

### A.5 Les phrases d'erreur

| où | clé | texte |
|---|---|---|
| `src/lib/erreurs.js`, `MESSAGES_CONTRAINTE` | `devis_cout_check` | le prix du devis lui-même s’écrit comme un montant entre 0 et 1 000 € TTC. |
| `src/lib/devis.js`, `ECHEC_PAR_CONTRAINTE` | `devis_cout_check` | Le prix du devis lui-même n’a pas pu être enregistré. |
| `SaisieDevisScreen.js`, `NOMS_ENTETE` | `coutDevisCentimes` | Prix du devis lui-même |

### A.6 Les textes légaux

**« Ce que nous collectons »**, la phrase des devis ENTIÈRE, telle que
`verifier-legal` la comparera (les mots nouveaux en gras ici, pas dans le
code) — le SEUL texte (BASE-9, ÉCRAN-7) :

> et vos devis en préparation eux-mêmes : leur objet, le lieu et le délai des
> travaux, une éventuelle retenue de garantie, leur réduction, leur acompte et
> sa nature, leur durée de validité, **s’ils sont gratuits ou payants, et ce
> que coûte un devis payant,** à quel titre le client commande, si les
> travaux portent sur un bâtiment neuf ou une transformation importante (et
> la date à laquelle vous l’avez confirmé), et s’ils font partie d’un
> chantier qui crée un bâtiment neuf, pour la TVA, si leurs travaux peuvent
> engager votre garantie décennale, quand l’acompte ou les arrhes sont payés,
> leurs lignes — et, pour chacune, si c’est une réparation urgente
> expressément demandée par le client —, leurs prix et leurs totaux, le
> client de votre carnet auquel ils sont rattachés et, s’il y a lieu, la
> demande ou l’urgence d’où ils viennent.

« ce que coûte un devis payant » plutôt que « leur prix » : « leurs prix et
leurs totaux », plus loin dans la même phrase, désigne les prix des LIGNES.
`NOMMEES_DEVIS.cout_devis_centimes = 's’ils sont gratuits ou payants'`.

**Le bloc d'historique** de `VERSION` : §4.

---

## Annexe B — Les pièges, en une liste

1. **Le nom de la colonne.** `prix_devis_centimes` fait rougir la vérification
   37 de `verifier-tarifs` (le 0 écrit hors de `tarifsDepuisFormulaire`) :
   `cout_devis_centimes` (M4).
2. **Le 0 ne s'écrit que par « Gratuit ».** Un « 0 » tapé est refusé avec sa
   phrase ; « Payant » n'écrit JAMAIS 0, même quand les tarifs disent
   « gratuit » : la proposition ne vaut que si les tarifs disent PAYANT
   (`coutAProposer`, T3, ÉCRAN-2). Une garde de TEXTE le tient.
3. **« Payant » sans prix = rien de dit, sans erreur** (T18, ÉCRAN-1) : une
   erreur devient un refus d'en-tête, et la garde dit alors « ce que vous avez
   écrit n'est pas enregistré » à quelqu'un qui n'a rien écrit. C'est le
   point de « Pour le remettre » qui dit ce qui manque.
4. **Une pastille déjà choisie ne se défait pas** (ÉCRAN-4) ; un `choix` qui
   ne porte pas `cout` n'écrit rien (`!== undefined`).
5. **Opus propose, n'écrit pas.** `etatInitialConditions` ne choisit JAMAIS
   d'après les tarifs ; la proposition est une phrase, et un champ pré-rempli
   APRÈS un appui sur « Payant » (annoncé à VoiceOver).
6. **La voie unique de « Conditions »** (`etatInitialConditions` →
   `choisir` → `lireConditions`) : un choix qui n'y passe pas repart vide à la
   fermeture, en silence (E-B1, `src/components/ConditionsDevis.js:51-58`).
7. **Rien sous le doigt ne bouge** : le bloc est le DERNIER de la carte ; une
   zone réservée n'aurait pas tenu, et la carte interdit les éléments rendus
   invisibles (`CACHENT`) (T17, ÉCRAN-3) ; mesuré à 393 et à 320.
8. **Le vide est le motif** : sans 0 dans `COMPLET`, `devis_complet` ET les
   décors « complets » de `verifier-devis` (l. 8752, 8992, 10744, 11336), les
   cas gagnent `devis_cout` (`comprendre/methode.md` §4 point 12 ; BASE-1) ;
   et `VIDE` ne le reçoit PAS.
9. **Une garde de numérotation ne voit pas un attendu qui change** : la garde
   nouvelle « aucun des 125 premiers cas ne porte `devis_cout` » (S5).
10. **Le cas 20 de l'essai 49-remise existe déjà** : le cas de 2b-4 est le
    25, le compte devient le 26 (BASE-2).
11. **La migration ne rejoue de 49.7 que le `revoke` et ses SIX `grant`** —
    jamais ses `drop policy` (refusés par le connecteur), jamais en oubliant
    `grant select, delete` (tous les devis deviendraient illisibles)
    (BASE-4).
12. **La porte étroite** : jamais `tarifs_pro`, `clients` ni
    `professional_profiles` dans `motifs_refus_remise` ; la proposition vit à
    l'écran (T6, K6).
13. **Une prudence qui cite la loi dit « Opus ne sait pas encore »** ; une
    règle d'Opus finit par « Opus le demande pour tous vos devis. »
    (`scripts/verifier-devis.mjs:8702-8703`).
14. **Une phrase de motif** : aucun chiffre ni « € », une phrase, 200
    caractères (la nouvelle en fait 197 : ne rien y ajouter) ; tout montant
    d'un AVIS passe par `centimesLisibles`, jamais « € » écrit dans `devis.js`
    (l. 1416-1436).
15. **« Le devis lui-même »**, pas « ce devis », partout où il s'agit de son
    prix (T19, ÉCRAN-5) : sinon on lit le TOTAL ; `avis_gratuit` (le TOTAL à
    0) peut sortir à côté.
16. **Deux jours, deux horloges** : l'avis (d) juge au jour du TÉLÉPHONE
    (`jourDuTelephone`), la base au jour de Paris ; `joursEntre` par `Date.UTC` ;
    jamais `toISOString()` pour un jour ; les essais dans trois fuseaux.
17. **L'avis (d) sous-estime** (S8) : la validité court de la REMISE ; 2c le
    recalcule. La phrase ne promet rien sur la date de début.
18. **La « date unique » de l'opération** : une attestation expirée reste la
    bonne si le chantier est déjà OUVERT — déclaration d'ouverture, premier
    ordre de service, ou d'autres entreprises qui ont commencé ; la phrase
    nomme les trois, et ne dit « jusqu'à cette date » que pour une
    attestation d'un ensemble de chantiers (DROIT-8,
    `textes/assurances-A243-1-annexe-I.txt:31`, `textes/assurances-A243-3.txt:57-63`).
19. **« Pensez à la donner » est un conseil**, pas un devoir à destinataire
    écrit (`droit/franchise-attestation-verif.md`, affirmation 33) ; « la
    donner », pas « la remettre », dans une carte qui s'appelle « Pour le
    remettre » (ÉCRAN-22).
20. **Le délai par défaut est une constante** (M7) : on le compare EXACTEMENT à
    `DELAI_PAR_DEFAUT.texte`, jamais par une recherche de « 30 » dans un texte.
21. **La fin la plus TARDIVE** des attestations valables, pas la première : une
    entreprise qui a renouvelé a deux attestations jointes.
22. **Les assurances doivent être relues** à la fermeture de « Mon
    entreprise » : `recevoirEmetteur` ne les porte pas (T9) ; en échec, on
    les oublie (`undefined`), on ne garde pas une ancienne liste (ÉCRAN-19).
23. **En franchise, « TTC = HT » n'est vrai que si aucune ligne ne porte de
    taux** : la base calcule la TVA de chaque ligne quel que soit le régime.
    L'avis (e) se tait tant que `coherenceRegime` parle, exige une option pour
    sa seconde phrase, et n'écrit jamais « HT » (DROIT-2, ÉCRAN-6 ; mesuré).
24. **Le seuil de la franchise** : 37 500 € sur le net hors options, une
    phrase qui dit les deux plafonds (K2) ; écrit UNE fois, avec sa source et
    sa date de relecture.
25. **Un avis qui dépend de la base attend la liste sûre** (PAR-8) ; un avis
    qui ne dépend que de l'artisan suit l'écran (T16).
26. **`undefined`, pas `null`, pour « pas transmis »** dans `avisDuDevis` :
    `null` veut dire « non déclaré » pour le régime et « lus, aucune ligne »
    pour les tarifs (T7, ÉCRAN-16).
27. **L'appel unique des avis est figé** par une expression régulière
    (`scripts/verifier-devis.mjs:10396`) : il se réécrit EN LE DÉCIDANT, avec
    ses trois entrées nouvelles.
28. **Le quatrième import** se décide : `verifier-devis` l. 1397-1405 refuse
    aujourd'hui tout autre que trois.
29. **`verifier-postes` fige `monRegimeEtSaDate`** (`:1935-1945`) : sa
    vérification se réécrit EN LE DÉCIDANT (T20, ÉCRAN-8).
30. **`PAS_ENCORE_VERIFIE` est copié en toutes lettres à trois endroits**
    (`devis.js`, `verifier-devis` B8 et sa liste de faits, `mesure-devis`) :
    les trois dans le même commit.
31. **La phrase des devis des textes légaux est figée ENTIÈRE** par la
    vérification de 2b-3 (`scripts/verifier-legal.mjs:2804-2806`) : elle se
    réécrit EN LE DÉCIDANT, `NOMMEES_DEVIS` gagne la colonne, et il n'en
    existe qu'UN texte (A.6).
32. **Un essai qui lit un fichier voisin** (`cas-remise.json`, `schema.sql`) se
    rejoue avec lui ; un refus attendu se JUGE en SQL ; un cas retiré laisse un
    `f` (variables déclarées d'avance).
33. **Un contrôle qui PLANTE ne vérifie rien** : dans une copie sans `.git`,
    quatre contrôles plantent sur `git ls-files` ; on lit le code de sortie
    (§5.1).
34. **L'ordre de livraison** : la base d'abord, puis `git pull` ; une
    application nouvelle face à l'ancienne base enverrait une colonne inconnue
    (PGRST204).
35. **L'outil d'édition change les séquences d'espace insécable en caractères
    invisibles** : relire les OCTETS (`od -c`) après avoir écrit
    `centimesLisibles` ou une phrase qui en porte ; écrire une barre par
    `chr(92)` dans un petit script Python.
36. **`mesure-devis`** : serveur relancé avec `-c`, module servi vérifié ;
    rejouer une section coupée avec `SEULEMENT=` ; les sections qui changent
    la démonstration EN DERNIER, et l'état rendu à l'identique (ÉCRAN-21) ;
    chercher les comptes exacts sur « points » et « Ce devis — », pas sur les
    noms (ÉCRAN-9).
37. **Un mot interdit vit dans un mot innocent** : « registre », « vérifié »,
    « agréé » sont refusés par des contrôles de vocabulaire (M10) — à passer
    sur chaque phrase nouvelle, y compris celles de 2b-5 et 2b-6.
    (« vérifiez », impératif, n'est pas « vérifié » : la règle
    de `scripts/verifier-etats.mjs:446`, une frontière de mot posée à la main, ne le
    voit pas, mesuré.)

---

## Annexe C — Critique → décision

Chaque constat a été revérifié avant d'être décidé (la ligne du dépôt, le
texte par `loi.py`, ou une mesure `node`). « Retenu » = corrigé dans ce v2 ;
« en partie » = corrigé pour ce qui touche 2b-4, le reste rangé avec sa
raison ; « réfuté » = la preuve est donnée. **Aucun constat n'est réfuté.**

### C.1 Droit (`critique-v1-droit.md`) — 17 retenus, 2 en partie, 0 réfuté

| n° | gravité | ce qui a été revérifié | décision | où |
|---|---|---|---|---|
| DROIT-1 | GRAVE | L. 221-18, L. 221-25 al. 1 et 3, L. 221-28 1°, L. 221-9, L. 221-10 relus par `loi.py` | **retenu** : la phrase nomme les quatorze jours, « il ne vous devra rien », l'écrit ou le support durable, « pas même un chèque » ; une vérification exige ces mots | A.3 ; §3.1 point 12 ; §5.4 (43 e) ; S38 |
| DROIT-2 | GRAVE | `node mesures/droit-ttcoptions.mjs` : `{"ht":3500000,"ttc":4200000,"ttcOptions":4200000,"options":0}` ; `tvaDe(base, null)`, `coherenceRegime` relus | **retenu**, par une autre correction que celle proposée (qui additionnait des lignes de l'écran à des totaux de la base) : garde de cohérence + au moins une option + aucun « HT » ; « TTC = HT » réduit au seul cas où il est vrai | T11 ; §3.1 point 12 ; A.3 ; B.23 ; S35, S36 |
| DROIT-3 | IMPORTANT | `AIDE_NATURE_ACOMPTE_PRUDENCE` (`devis.js:2308-2311`, `:2353`), L. 221-1 I 1° | **retenu** : l'avis parle aussi pour `non_professionnel`, couvre le téléphone et les messages ; J4 réécrite | §1.1 ; §3.1 point 12 ; A.3 ; J4 ; S37 |
| DROIT-4 | IMPORTANT | arrêté du 24/01/2017 art. 2 et 4 relus ; L. 221-9, L. 221-5 | **retenu** : « au moins » ; plus de « le devis écrit est la preuve » | Q2 (§1.3) et ses preuves |
| DROIT-5 | IMPORTANT | circulaire `:467-477`, `:497-505` ; `comprendre/vraie-base.md` (un plombier, un électricien) | **retenu** : élagueurs retirés, « 100 % » retiré, le joint et le lustre dits ; la case montrée en premier aux paysagistes seulement | Q3 et ses preuves ; §3.11 |
| DROIT-6 | IMPORTANT | L. 132-2 al. 1 à 3 relus | **retenu** : cinq ans et 750 000 € en ligne, amende proportionnelle | §1.4 point 3 ; J12 |
| DROIT-7 | IMPORTANT | L. 223-8 relu : « ou de leur adaptation au vieillissement ou au handicap » | **retenu** | §1.4 point 1 ; J46 |
| DROIT-8 | IMPORTANT | A. 243-1 annexe I `:31-35`, A. 243-3 2° a et b, A. 243-4 (verif n° 28, 30, 33) | **retenu** : les trois façons d'un chantier déjà ouvert ; « si elle vaut pour l'ensemble de vos chantiers » | A.3 ; B.18 ; J21 |
| DROIT-9 | IMPORTANT | L. 242-51 II, L. 224-115 I à III relus | **retenu** : la sous-traitance dans la question Q5 et dans la conception de 2b-6 ; la question montrée aussi pour `non_professionnel` | Q5 (§1.3 bis) ; §8.2 ; J39 |
| DROIT-10 | IMPORTANT | code de l'artisanat L. 241-1, L. 241-2 relus ; `OpusApp.js:4539`, `FeuilleRecherche.js:166`, `:171` | **retenu** : textes cités (plus « À VÉRIFIER ») ; un point « À dire » sur l'onglet « Artisans » ; J49 élargie | Q6 ; §1.4 point 9 ; J49 ; §7 |
| DROIT-11 | IMPORTANT | `tarifsConnus`, `ligne.affiche` (`devis.js:3490-3540`) | **retenu** : un avis `avis_devis_payant_tarifs_gratuits` | §3.1 point 12 ; A.3 ; §7 (S3) ; S42 |
| DROIT-12 | MINEUR | L. 221-1 I 2° b (`:13`) ; les phrases voisines de `devis_lieu` et `devis_validite` | **en partie** : « au moins » dans `devis_cout` ; les deux phrases voisines, de même étroitesse, restent (elles toucheraient `PHRASES_DU_05_11`, `cas-remise.json`, `mesure-devis`), rangées | §2.5 ; A.1 ; J3 ; §7 |
| DROIT-13 | MINEUR | en-tête « VIGUEUR du 2025-07-02 » de L. 122-26 ; arrêté du 07/07/2026 | **retenu** | §1.4 point 2 |
| DROIT-14 | MINEUR | arrêté de 2015 art. 4 al. 3 (`:31`) | **retenu** (sans effet si Q3 = 1) | §2.10 ; §3.11 ; §7 |
| DROIT-15 | MINEUR | arrêté de 2015 art. 6 (`:41-42`) | **retenu** : « toujours gratuit » et « obligatoire à partir de 100 € » séparés | Q3 et ses preuves |
| DROIT-16 | MINEUR | arrêté du 03/10/1983 art. 1 relu (25 € TTC) | **retenu** : J50 et une ligne au module facture | J50 ; §7 |
| DROIT-17 | MINEUR | L. 541-21-2-3 II (`:7`, `:9`) | **retenu** | §8.1 |
| DROIT-18 | MINEUR | CGI 293 D III (`:25`) | **en partie** : dit au §1.4 et rangé au §7 ; aucune lecture de la date de création (À VÉRIFIER qu'elle existe) | §1.4 point 5 ; §7 |
| DROIT-19 | MINEUR | arrêté de 2017 art. 3 al. 3 (`:34`) | **retenu** : la variante écrit deux natures ; J11 dit sa conséquence | §3.11 ; J11 ; §1.4 point 10 |

### C.2 Base (`critique-v1-base.md`) — 12 retenus, 0 en partie, 0 réfuté

| n° | gravité | ce qui a été revérifié | décision | où |
|---|---|---|---|---|
| BASE-1 | IMPORTANT | `mod-verifier-devis.txt` (25 ✘) ; décors l. 8752, 8992, 10744, 11336 relus | **retenu** | §2.6 ; B.8 ; S32 |
| BASE-2 | IMPORTANT | `essais-section-49-remise.sql:80-87`, `:1510`, `:1789` | **retenu** : cas 25, compte au cas 26 | §5.2 ; B.10 ; S1, S28 |
| BASE-3 | IMPORTANT | `diff e49r-avant.txt e49r-apres.txt` : douze valeurs à `f` (cas 10, 13, 23, 24) | **retenu** : 10 reçoit 0 ; 13 et 23 gagnent `devis_cout` dans leurs listes (D4-c couvre le motif) ; 24 devient « douze rangs, dix-sept clés » | §2.6 ; §5.2 |
| BASE-4 | IMPORTANT | `schema.sql:14560-14598`, `:14646-14670` : SIX `grant`, trois `drop policy` | **retenu** | §2.9 point 4 ; B.11 ; S44 |
| BASE-5 | MINEUR | `grep -c LAST_ERROR` : 0 dans l'essai 49, 40 dans 49-remise ; `verifier-devis.mjs:9170-9220` | **retenu** : les deux refus au cas 25 h de 49-remise, jugés en SQL (21 erreurs) ; 40 d réécrit | §5.2 ; §5.4 |
| BASE-6 | MINEUR | les lignes citées de `verifier-devis` relues une à une (3043 à 11196) ; `mod-verifier-legal.txt` | **retenu** | §5.2 ; §5.4 |
| BASE-7 | MINEUR | `REGLES_DEVIS`, `validerDevis` (`devis.js:941-981`) ; mesuré `validerDevis({ coutDevisCentimes: -1 })` → `{ ok: true }` | **retenu** | §2.2 ; §3.1 point 4 ; §3.3 ; S39 |
| BASE-8 | MINEUR | `generer-cas-remise.mjs:160-170`, `:276-320`, `:452-460`, `:700-720` ; `verifier-devis.mjs:8930-8950` ; aucun contrôle ne cherche un cas par son nom | **retenu** | §2.6 ; §5.3 |
| BASE-9 | MINEUR | `verifier-legal.mjs:2699-2749`, `:2804-2807` | **retenu** (= ÉCRAN-7) : un texte, `NOMMEES_DEVIS` | §4 ; A.6 ; §5.4 |
| BASE-10 | MINEUR | `schema.sql:15218-15232` (le modèle du rang 11) | **retenu** (= DROIT-19 point 1) | §3.11 |
| BASE-11 | MINEUR | `comprendre/methode.md` §3 points 9 et 10 | **retenu** : la garde éprouvée et le second regard gardés ; S31 ; `generation` croissant à l'essai réel | §2.9 ; §5.6 ; §6.1 |
| BASE-12 | MINEUR | §2.2 du v1 lui-même (« la base ne sait pas quel geste a écrit 0 ») | **retenu** | §2.1 |

### C.3 Écran (`critique-v1-ecran.md`) — 20 retenus, 2 en partie, 0 réfuté

| n° | gravité | ce qui a été revérifié | décision | où |
|---|---|---|---|---|
| ÉCRAN-1 | GRAVE | `SaisieDevisScreen.js:1314-1328`, `:2363-2381`, `:562` ; `emetteur.js:517-526` ; mesuré `versMontantDeDevis('')` | **retenu** : « Payant » + vide = `null`, sans erreur | T18 ; §3.1 point 6 ; A.2 ; B.3 ; S7 ; `mesure-devis` 5 |
| ÉCRAN-2 | GRAVE | `comprendre/vraie-base.md` (`prix_devis_centimes = 0`) ; `verifier-tarifs.mjs:1315-1330` | **retenu** : `coutAProposer`, jamais 0 par « Payant », une garde de texte | T3 ; §3.1 point 6 ; §5.4 (43 b, 43 k) ; S33 |
| ÉCRAN-3 | IMPORTANT | `ConditionsDevis.js:300-435` (le champ « Autre » de la validité et la retenue montent déjà sous leurs pastilles) ; `CACHENT` | **retenu** (sa réponse b) : le bloc en dernier, aucune zone réservée | T17 ; §3.6 ; §5.5 (1, 2) ; S26 |
| ÉCRAN-4 | IMPORTANT | `ConditionsDevis.js:348-371` ; `devis.js:3313` | **retenu** | T18 ; §3.1 point 6 ; §3.6 ; S34 |
| ÉCRAN-5 | IMPORTANT | `devis.js:4486-4489` | **retenu** : « le devis lui-même » partout ; le point mesuré à 197 caractères | T19 ; A.1 à A.5 |
| ÉCRAN-6 | IMPORTANT | `libellesDesTotaux('franchise')` mesuré (`net: null`) ; `coherenceRegime` | **retenu** (avec DROIT-2) | T11 ; A.3 ; S36 |
| ÉCRAN-7 | IMPORTANT | `verifier-legal.mjs:2804-2807`, `:2243-2244` | **retenu** (= BASE-9) | §4 ; A.6 |
| ÉCRAN-8 | IMPORTANT | `verifier-postes.mjs:1935-1945`, `:2425-2436` ; `api.js:3560-3600` | **retenu** : `assurancesDe`, une vérification réécrite | T20 ; §3.3 ; §5.4 ; S43 |
| ÉCRAN-9 | IMPORTANT | `mesure-devis.mjs:5181-5209` ; recherche « points » et « Ce devis — » sur tout le fichier | **retenu** : 5 points ; recherche refaite à la construction | §3.9 ; §5.5 point 10 ; B.36 |
| ÉCRAN-10 | MINEUR | = BASE-7 | **retenu** | §2.2 |
| ÉCRAN-11 | MINEUR | `devis.js:3425-3456` ; mesuré `vibrerPourLaCarte('cout', …)` → `false` | **retenu** | §3.1 point 7 ; S40 |
| ÉCRAN-12 | MINEUR | `devis.js:4735-4742` | **retenu** | §3.1 point 16 ; A.4 |
| ÉCRAN-13 | MINEUR | `verifier-devis.mjs:6870` ; `mesure-devis.mjs:1840-1851` | **retenu** | §5.5 point 1 |
| ÉCRAN-14 | MINEUR | `libellesDesConditions` (`devis.js:3385-3400`) ; `FicheEmetteur.js:1172`, `:1178` | **retenu**, les quatre points | §3.1 point 6 ; §3.6 ; A.2 |
| ÉCRAN-15 | MINEUR | `resumeDesConditions` (`devis.js:2880-2913`), décision E-12 | **retenu** : T15 du v1 reposait sur une raison fausse | T15 ; §3.1 point 8 ; A.4 ; S41 |
| ÉCRAN-16 | MINEUR | `avisDuDevis` (`devis.js:4419-4421`) | **retenu** | T7 ; B.26 |
| ÉCRAN-17 | MINEUR | §3.1 du v1 (« quatre clés ») contre A.3 (cinq) | **en partie** : une suite écrite UNE fois ; le nombre de clés juste (six) ; la consigne reste en fin de chaque avis, comme les avis existants ; la longueur cumulée jugée sur l'iPhone | §3.1 point 12 ; A.3 ; §3.7 ; §6.2 |
| ÉCRAN-18 | MINEUR | `SaisieDevisScreen.js:1403-1417`, `:1910-1917` | **en partie** : « Corriger » rouvre sur le bloc pour le prix ; la validité et la retenue (défaut déjà là) rangées | §3.5 ; §7 |
| ÉCRAN-19 | MINEUR | `OpusApp.js:4185-4275`, `:5537` | **retenu** : `undefined` en échec, l'appel discret comme les autres, la génération expliquée | §3.4 ; B.22 ; S30 |
| ÉCRAN-20 | MINEUR | `tarifs.js:88-98` | **retenu** (rien ne change ; les deux copies nommées) | §3.8 |
| ÉCRAN-21 | MINEUR | `mesure-devis.mjs:5052` ; `emetteur-demo.js:109` | **retenu** : sections en dernier, égalité profonde | §5.5 point 12 |
| ÉCRAN-22 | MINEUR | `erreurs.js:121` | **retenu** : les mots des tarifs ; « lui-même » ; « la donner » | A.2 ; A.3 ; A.5 |

### C.4 Ce qui n'a pas été vérifié (par les critiques, et par ce v2)

- **La migration construite pour de vrai**, sa garde md5 et sa simulation sur
  l'imitation `ceb7d96` AVEC des données : seul `schema.sql` modifié a été
  rejoué (critique base) ; c'est le travail de la construction (§2.9).
- **`generer-cas-remise.mjs` n'a pas été lancé** (il fait `drop database` sur
  un nom fixe) : les attendus des 125 cas avec le 0 de `COMPLET` sont
  DÉDUITS de la mécanique relue.
- **Rien au navigateur** : ni le bloc en dernier, ni le récapitulatif qui
  descend, ni la proposition à 320 points, ni `mesure-devis` ; les ruptures
  annoncées (ÉCRAN-9, ÉCRAN-21) sont déduites de la lecture.
- **DROIT-2 sur PostgreSQL** : mesuré sur le miroir JavaScript seulement ; que
  `total_ttc_options_centimes` vaille le TTC sans option est DÉDUIT de la
  parité (`cas-devis.json`).
- **Le statut « à distance » de la messagerie d'Opus** (J4), **le taux de TVA
  d'un devis payant** (J50, BOFiP non relu), **le code pénal 131-38** (absent de
  l'index), **que la preuve SIRET range la date de création** (DROIT-18).
- **La vraie base** : aucun outil Supabase n'a été appelé pour ce v2 ; les
  « trois brouillons » et les tarifs « gratuit, non affichés » viennent de
  `comprendre/vraie-base.md` ; la date de fin de l'attestation du
  propriétaire n'a pas été relue le 16/11.
- **Le parcours d'écriture d'une assurance** (`FicheAssurance` →
  `surEmetteur`) n'a pas été suivi en détail (critique écran) : la règle de
  `mesAssurances` (§3.4) repose sur le fait que `recevoirEmetteur` n'est
  appelé que pendant que « Mon entreprise » est ouverte — DÉDUIT, mesuré
  par `mesure-devis` 12 a à la construction.
- **Les longueurs** des phrases nouvelles sont mesurées (`mesures/phrases-v2.mjs`),
  pas leur retour à la ligne à 320 points.
- **Le droit des phrases d'écran** (aide, avis) au-delà de ce que les deux
  critiques ont relu : à la relecture de la construction, et au juriste pour
  ce qui porte un (J).
