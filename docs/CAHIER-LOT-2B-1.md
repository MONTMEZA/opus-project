# Lot 2b du module devis — « ce que le devis doit dire » — cahier v3 (05/11/2026)

> **Archivé le 08/11/2026, à la fin de l'étape 2b-1.** Ce cahier (v3, 05/11,
> complété les 06, 07 et 08/11 au fil des relectures) a guidé l'étape ; il est
> versé ici tel qu'il a servi. **En cas de désaccord, la section « Ce qu'il
> manque pour remettre ce devis — étape 2b-1 » de CLAUDE.md et le code disent
> vrai.** Ce qui a changé depuis sa rédaction : la décision D-A bis du 06/11
> (« garder la grande place ») ; la place de la ligne suit, depuis le 07/11,
> une règle SANS MÉMOIRE (son §0.1 bis et son §3.1 le disent déjà, avec
> l'histoire de ce qui a été essayé) ; et la décision « Accélérer » du 08/11
> (une seule relecture par étape), qu'il ne connaît pas. Les §4 à §6 (2b-2 à
> 2b-4) sont une PROPOSITION, à relire au début de chaque étape. Les fichiers
> qu'il cite sous `lot2b/…` et `restes.md`, et les noms de constats (`TXT-…`,
> `RELIRE…`), étaient des documents de travail de la session : ils ne sont
> pas dans le dépôt ; les `PLAN:…` sont des lignes du commit `5405f8b`.

**v3 = v2 + les réponses du propriétaire du 05/11 (§0.1). C'est le cahier qui sert à construire 2b-1.**

**Sur les PHRASES, l'annexe B.2, l'annexe B.8 et le code FONT FOI** (`src/lib/devis.js` — `MOTIFS_DEVIS`,
les constantes de l'écran, `AIDE_TAUX_REDUIT` — et la section 49.9 de `schema.sql`, identiques entre eux) :
le corps du cahier les résume, et un passage qui en diffère est périmé. Noté le 06/11/2026 après la
seconde relecture de 2b-1 (REL-4), qui en a trouvé cinq ; ils sont alignés ci-dessous.
**Sur les ÉTATS, le §3.1 et le code font foi ; l'annexe A garde les décisions telles qu'elles
ont été prises en v2** (deux de ses lignes, E-2/N1 et E-7, réécrites le 06/11/2026 après la
troisième relecture, RELIRE-3, parce qu'elles décrivaient des états qui n'existent plus). Le §0.1
bis (D-A, D-A bis) et le §3.1 (la hauteur de la ligne, le régime de TVA, la relecture au retour de
« Mon entreprise ») ont été réécrits le 06/11/2026 après la quatrième relecture (RELIRE3-1,
RELIRE3-4, et la décision de simplifier REL-2) : ce qu'ils disaient avant ne tenait que pour
« aucun point ». Le §0.1 bis (D-A bis) et le §3.1 ont été complétés le 07/11/2026 après la cinquième
relecture (RELIRE4-C : un renvoi ne rend pas la place ; RELIRE4-A : « Mon entreprise » ne se ferme
plus pendant un envoi ; RELIRE4-E : le saut depuis « tout compté », largeur par largeur). Ils ont été
réécrits le 07/11/2026 après la sixième relecture (RELIRE5-R1) : la mémoire de la place est abandonnée,
une règle SANS MÉMOIRE la remplace — la place est réservée tant que quelque chose n'est pas compté ou
qu'une écriture renvoyée après un échec est en route, et rien d'autre.

Document de travail. **Rien ne se construit avant les réponses du
propriétaire** (§7). Cette version intègre la critique adverse du v1
(`lot2b/critique/{droit,base,ecran,decoupage}.md` et leurs contre-vérifications :
69 constats, **aucun réfuté**). L'annexe A dit, pour chaque constat retenu, ce
qu'il change.

Sources : `lot2b/comprendre/{textes,droit,base,appli,plan,releve}.md`,
`docs/CAHIER-LOT-2A.md` §4-§7, `docs/PLAN-DEVIS.md`, `docs/A-FAIRE.md`. Textes
de loi : `lot2b/textes/` (recopiés le 04/11 depuis l'open data LEGI de la
DILA) et `lot1/textes/` (arrêté du 24/01/2017, lu au lot 1) — jamais depuis
Légifrance (403 au conteneur).

**ÉTABLI** = lu ou mesuré ; **DÉDUIT** = raisonné ; **(P)** = au propriétaire ;
**(J)** = au juriste.

---

## 0. En une page

Le lot 2a a posé le calcul. **2b pose ce que le devis doit dire pour être
légal**, et la liste **« Ce qu'il manque pour remettre ce devis »**. 2c fera le
numéro, le PDF, l'aperçu et la remise. **Rien n'est remis en 2b.**

**Les règles qui portent le lot (§2) :**

1. **Un fait de 2b naît VIDE (« pas encore dit »)**. Selon le fait, le vide
   est soit un **motif** de refus de remise, soit le **cas le plus protecteur**
   appliqué d'office (exemple : un devis dont on ne sait pas où il est signé
   est traité comme signé chez le client). **Jamais une contrainte de la
   base** : les 3 brouillons de la vraie base (relevé du 05/11) ne cassent
   rien.
2. **Trois sortes de motifs, et l'écran dit laquelle** : la **loi** ; la
   **prudence** (Opus ne connaît pas encore le cas, il compte le plus
   protecteur) ; une **règle d'Opus**, plus stricte que la loi, que le
   propriétaire a choisie (Q2). Tout le reste est un **avis**, qui ne bloque
   rien.
3. **Chaque fait naît avec son lecteur** : la fonction des motifs naît
   d'abord ; chaque étape y ajoute son fait ET son motif.

**Le découpage proposé — quatre étapes, chacune essayée sur l'iPhone avant la
suivante (Q1) :**

| étape | ce qu'elle apporte |
|---|---|
| **2b-1 — Ce qu'il manque** | la fonction des motifs, la liste à l'écran, les motifs qui ne demandent aucun fait nouveau |
| **2b-2 — Pour qui, et quand c'est signé** | pour qui le client commande ; le moment de la signature ; construction neuve ; le tri des mentions dues à un particulier |
| **2b-3 — Les lignes** | urgence, « peut engager ma garantie décennale », l'attestation |
| **2b-4 — Ce que coûte le devis, ce qu'il laisse** | devis payant ou gratuit, déchets de chantier, champ de l'arrêté de 2017, RGE (ou lot TVA) |

Ce cahier détaille **2b-1** (§3). Les questions des étapes suivantes seront
posées au début de chacune.

**Maintenant (§7)** : le découpage ; les règles d'Opus plus strictes que la
loi ; la TVA à 10 % et 5,5 % ; où voir la liste.


## 0.1 Les réponses du propriétaire, le 05/11/2026

| question | réponse | ce qu'elle change |
|---|---|---|
| 1 — le découpage | **4 étapes (recommandé)** | 2b-1, 2b-2, 2b-3, 2b-4, chacune avec sa migration, sa relecture et son essai sur l'iPhone |
| 2 — les règles d'Opus plus strictes que la loi | **les quatre** : SIRET relu chaque année ; TVA reconnue par VIES ; frais de déplacement sur tous les devis ; délai d'exécution sur tous les devis | `entreprise_ancienne`, `conso_tva_intra`, `frais_deplacement` et **`devis_delai`** ont la nature `regle_opus` ; `devis_delai` devient permanent (2b-2 ne le lèvera pas) et sa phrase le dit ; aucun texte légal à changer |
| 3 — la TVA à 10 % et 5,5 % | **« Tout permettre »** : le devis imprimera une certification simple que le client signe, dès la remise (2c) | **aucun motif `devis_taux_reduit`** ; 2c imprime la certification (CGI 279-0 bis 3, 278-0 bis A IV) avec la place de signer — texte à faire relire (J) ; **revient sur `PLAN:2115` et `PLAN:3552`** (« le lot 2 refuse le réel »), à corriger dans le plan avec la date de la décision ; 2b-2 ajoutera le motif « taux réduit sur un immeuble neuf » (CGI 279-0 bis 2) |
| 4 — où voir la liste | **en haut et en bas (recommandé)** | une ligne sous le bandeau du haut et une rangée en bas (§3.1) |

### 0.1 bis Les décisions du propriétaire, le 05/11/2026 au soir (après la relecture de 2b-1), et le 06/11 (D-A bis)

| décision | constat | ce qu'elle change |
|---|---|---|
| **D-A** — la ligne du haut dit la phrase ET le compte | ECR-4 | dans `pasCompte`, sur un devis en base, la ligne sous le bandeau du haut affiche la phrase plus le décompte de la dernière liste sûre (« en route », la phrase seule) : trois lignes de texte à 390, quatre à 375 et 320, rien de coupé ; sa PLACE, elle, est réservée pour le plus long de ses textes possibles (D-A bis ci-dessous, réécrit le 06/11 après la quatrième relecture ; §3.1) |
| **D-B** — le titre « Votre entreprise — 5 points, dont 3 dus à un particulier » | ECR-6 | un seul titre pour les points de l'entreprise, qui dit combien sont dus à un particulier (écran) |
| **D-C** — `devis_client` et `devis_lignes` deviennent des **règles d'Opus** | TXT-4 | leur nature passe de `loi` à `regle_opus` ; leur phrase dit, sur le modèle de `devis_delai`, quand la loi le demande, puis « Opus le demande pour tous vos devis. ». **Cela fait DEUX règles d'Opus de plus que les quatre de la réponse 2 : six en tout** (`entreprise_ancienne`, `conso_tva_intra`, `frais_deplacement`, `devis_delai`, `devis_client`, `devis_lignes`), écrites dans le commentaire 49.9 et en B.2 |
| **D-A bis** (06/11/2026) — « garder la grande place » | relecture 2 REL-1, relecture 3, relecture 4 RELIRE3-1 | tant que quelque chose n'est pas compté sur un devis en base, la ligne réserve la hauteur du PLUS LONG de ses textes possibles, « même si cela lui fait 110 points au lieu de 92 sur son iPhone 16 » : **plus rien ne bouge, jamais** — ni au retour de « Mon entreprise », ni quand un point s'éteint, ni à la première lecture, ni en échec. Depuis la quatrième relecture (06/11), la hauteur ne dépend plus ni de l'état, ni des nombres, ni de la phrase : une liste FIXE de quinze gabarits (`GABARITS_DE_LA_LIGNE`, `devis.js`) — les trois formes les plus longues de la phrase « pas compté » (une ligne, « 444 lignes » — 500 au plus, OP014 —, un champ d'en-tête) × quatre décomptes (« aucun point » ou « 444 points » pour le devis, « aucun point » ou « 44 points » pour l'entreprise ; le 4 est le chiffre le plus large d'Inter, mesuré), plus les trois phrases d'état. Mesuré le 06/11 de 320 à 440 points, point par point, 450 cas par ligne : UNE hauteur par largeur ; réservé en haut 128 de 320 à 323, 110 de 324 à 402 (393 compris), 92 de 403 à 440 ; en bas 104 de 320 à 347, 88 de 348 à 440. La version de la relecture 3 (deux gabarits pris sur les nombres de la dernière liste) ne tenait que pour « aucun point » : à 393, « 1 point » → « aucun point » faisait encore passer la ligne de 92 à 110 (RELIRE3-1). **Et un renvoi ne rend pas la place** (cinquième relecture, 07/11, RELIRE4-C) : « Réessayer » sur une ligne ou sur l'en-tête en échec faisait encore tomber la ligne de 110 à 74 à 393 puis remonter, la rangée touchée bougeant sous le doigt. La règle, SANS MÉMOIRE depuis la sixième relecture (07/11, RELIRE5-R1) : la place est réservée tant que quelque chose n'est pas compté OU qu'une écriture renvoyée après un échec est en route. Le passage de « tout compté » à « quelque chose n'est pas compté », et le retour, sont HORS de la décision (elle ne vaut que TANT QUE quelque chose n'est pas compté) : ce sont les sauts nommés du §3.1. Le prix, largeur par largeur, et le saut depuis « tout compté » : §3.1 |

Les autres corrections de la relecture qui changent le contrat (B.2, B.3), sans décision du
propriétaire : le rang 3 est coupé en deux clés (TXT-1), `regime_tva` passe en prudence (TXT-7),
les phrases du délai (TXT-5), du lieu et de la validité (TXT-6) et de la réduction ramenée (BASE-3)
sont réécrites. Le détail est en B.2 et B.3, daté.

---

## 1. Pourquoi quatre étapes

ÉTABLI : 2a portait trois faits de calcul et a coûté deux relectures adverses,
un banc de sabotages et 17 constats finaux. 2b en porte **huit**, plus une
fonction nouvelle ; chaque fait coûte une colonne, ses droits, les points de
passage de l'application, une phrase d'erreur, la démonstration, un écran,
des essais et des entrées dans six listes fermées de contrôles. DÉDUIT : les
faits ne mûrissent pas au même rythme (2b-4 dépend le plus du juriste : la loi
sur les déchets cite un article abrogé). Alternative (P) : deux étapes plus
grosses.

Chaque étape garde la méthode : migration construite depuis `schema.sql`,
simulée sur une imitation, gardée par son md5, appliquée avec l'accord du
propriétaire, essai par le chemin de l'application, essai sur l'iPhone,
commit. **La base d'abord, puis `git pull`** (le code appelle la fonction).

---

## 2. Les principes

### 2.1 Motif, avis, aide

| | bloque la remise (2c) ? | l'écran le dit comme |
|---|---|---|
| **motif — loi** | oui | « La loi demande … » |
| **motif — prudence** | oui, **tant que** le fait qui le lève n'est pas dit | « Opus ne sait pas encore … : dans le doute, il demande … » |
| **motif — règle d'Opus** | oui | « Règle d'Opus : … » |
| **avis** | **non** | « À vérifier : … » |
| **aide** | non | sous un champ |

**Inventaire honnête des règles d'Opus existantes** (critique D1, confirmée
bloquante) — ÉTABLI, dans `emetteur_incomplet()` et `legal.js` :

| règle | d'où elle vient | ce que dit la loi |
|---|---|---|
| relire le SIRET chaque année (`entreprise_ancienne`) | gardée par le propriétaire le 18/10 | rien |
| le n° de TVA **reconnu par VIES** pour un devis à un particulier (`conso_tva_intra`) | VIES (20/10) ; publiée dans les textes (« c'est une règle d'Opus », `legal.js:1638-1646`) | le numéro est une information à donner ; sa reconnaissance par VIES est le choix d'Opus |
| frais de déplacement dits sur **tous** les devis (`frais_deplacement`) | plan 10.3 ; la phrase le dit (`schema.sql:11664`) | dus sur un devis de dépannage, réparation ou entretien « le cas échéant » (arrêté 2017) |
| délai d'exécution sur **tous** les devis | plan 10.3 (§2.0 point 3) | dû pour **la plupart des devis à un particulier** : L. 111-1 3° (face à un consommateur, sauf exécution immédiate), L. 221-5 I 3° (hors établissement), moins ce que retirent L. 221-2 12° et L. 221-3 — description alignée le 06/11 sur la phrase réécrite par TXT-5 (05/11) |
| le client nommé sur **tous** les devis (`devis_client`) — **ajoutée le 05/11 au soir (D-C)** | décision D-C du propriétaire, après TXT-4 | le nom du client est dû sur un devis de dépannage, réparation ou entretien signé dans les locaux (arrêté 2017 4-I) et pour les services à la personne (arrêté du 17/03/2015 art. 7 4°) |
| au moins un poste chiffré sur **tous** les devis (`devis_lignes`) — **ajoutée le 05/11 au soir (D-C)** | décision D-C du propriétaire, après TXT-4 | les caractéristiques et le prix sont dus face à un consommateur (L. 111-1 1° et 2°), le décompte détaillé par l'arrêté 2017 4-I, la description et le prix par l'arrêté du 17/03/2015 art. 7 6° et 9° |
| profession réglementée (`conso_profession_reglementee`) | lot 0a | la loi demande titre, État, ordre (R. 111-2) ; **Opus ne sait pas encore les écrire** : c'est une prudence |

Le plan 10.3 nomme aussi une troisième règle plus stricte — refuser la remise
sans attestation quand une ligne relève de la construction — : elle se
décidera en 2b-3. **Q2 demande au propriétaire lesquelles garder.**

### 2.2 La fonction est la SEULE autorité

`public.motifs_refus_remise(p_devis uuid)` — section **49.9** (49.8 existe :
les index).

- **Forme de retour** : `returns table (cle text, phrase text, nature text,
  ligne_id uuid)`, `nature in ('loi','prudence','regle_opus')`. Choisie
  maintenant parce qu'elle ne pourra plus changer (changer un type de retour
  demande un `drop function`, que le connecteur refuse ; un paramètre ajouté
  crée une surcharge — ÉTABLI, critique « découpage » 1). `ligne_id` désigne
  la ligne fautive (régime ↔ taux dès 2b-1 ; urgence et décennale en 2b-3).
- **`stable`, `security invoker`, `set search_path = public`, en `plpgsql`** ;
  `revoke all … from public, anon` ; `grant execute … to authenticated`.
- **La garde est écrite dans la lecture** : `where d.id = p_devis and
  public.est_mon_entreprise(d.pro_id)`. Sinon : **`OP027`** « Ce devis
  n'existe pas, ou il n'est pas le vôtre. » — le même code et le même message
  pour les deux, qu'on l'appelle avec un jeton, depuis une fonction `security
  definer` (2c) ou par la clé de service (mesuré : la RLS seule rendait OP011
  pour le devis d'un autre hors du rôle `authenticated`, critique B1). Le
  **temps** de réponse diffère (~180 µs, mesuré) : c'est dit, pas promis — la
  même existence se lit déjà par 23505.
- Elle **appelle** `emetteur_incomplet(pro)` et range ses motifs (nature :
  `regle_opus` pour les règles du §2.1, `prudence` pour la profession
  réglementée, `loi` sinon).
- **Colonnes nommées une par une** : ni `select *`, ni `to_jsonb`, ni
  `%rowtype`. Elle ne lit **jamais** `quote_request_id`, `sos_request_id`, la
  `source` du devis, les tables `quote_requests` / `sos_requests`, ni un mot
  d'origine (D4-c, validée le 19/10 : aucun motif ne nomme une origine). Elle
  ne lit jamais les prix d'un autre, ni le texte d'une demande.
- **Les avis ne sont pas dans la fonction** : ils sont calculés par une
  fonction pure de l'écran (`avisDuDevis()`), pour qu'aucun avis ne puisse un
  jour bloquer une remise (critique B6).
- Les **phrases** sont écrites en caractères (jamais ` ` dans le SQL, le
  transport du connecteur les change) et ne portent **aucun montant** (la base
  ne formate pas d'euros ; l'écran affiche le montant à côté).

### 2.3 La parité base ↔ téléphone

Le miroir JS (`motifsDeRemise()`, pur) sert la démonstration. La parité se
prouve comme les 768 cas du badge (lot S-a) : un script fait jouer des
situations **par la vraie fonction** sur un PostgreSQL local et range ses
sorties (`supabase/cas-remise.json`) ; `verifier-devis` fait tourner le miroir
sur les mêmes entrées et exige **zéro écart**. À relancer et commiter dès que
la règle change. (La fonction n'est pas pure : elle ne peut pas se jouer « comme
`cas-devis.json` ».)

### 2.4 Ce qui ne change pas

Statut `brouillon` (la contrainte se refait en 2c) ; aucune contrainte
« origine ⇒ lien » (D3) ; la base reste l'autorité du calcul ; rien n'est
remis.

---

## 3. Étape 2b-1 — « Ce qu'il manque pour remettre ce devis »

### 3.1 Ce que l'artisan voit

**Deux endroits** (Q4, recommandé) : une ligne **sous le bandeau du haut**
(visible à l'ouverture : la rangée « Conditions » est à y = 961 sur un devis
neuf et y = 1 635 sur six lignes, pour un écran de 844 — mesuré, critique
E-3), et une rangée **en bas**, sous « Conditions ».

Le compte se dit **par endroit**, jamais en un seul nombre (critique E-4 :
chez le propriétaire, la ligne « Votre entreprise » restera allumée tant que
son n° de TVA est refusé par VIES ; un compteur unique ne s'éteindrait jamais) :

> **Pour le remettre :** ce devis — 2 points · votre entreprise — 1 point ›

Un appui ouvre une carte plein écran (`CARTE_POUR_REMETTRE` — pas `'remise'`,
qui désigne déjà la réduction dans le code, critique E-18) :

1. **Ce devis** — un point par motif, chacun avec son bouton : « Choisir le
   client », « Écrire le délai » (le champ prend le focus), « Choisir la
   validité » (la carte « Conditions » s'ouvre **sur ce champ**, et « ‹ »
   **revient à la liste** — critique E-13) ; un motif de ligne ouvre la ligne ;
2. **Votre entreprise** — **un bouton par point**, qui ouvre « Mon entreprise »
   sur sa section (le geste existe : `ouvrirMonEntreprise(section)`). Son
   titre compte TOUS ses points, et dit combien sont dus à un particulier
   (décision D-B du 05/11 au soir) : « Votre entreprise — 5 points, dont 3 dus
   à un particulier » ; l'accord suit le nombre (« 1 point, dont 1 dû »,
   « 2 points, dont 1 dû ») ; sans point dû à un particulier, rien n'est
   ajouté ;
3. **Mentions dues à un particulier** — un sous-titre DANS la partie « Votre
   entreprise » (ses points sont comptés dans le titre au-dessus, le
   sous-titre n'a pas de compte), avec : « Opus ne sait pas encore pour qui
   le client commande : dans le doute, il compte ce qu'on doit à un
   particulier. » (disparaît en 2b-2).

**Ce que dit chaque bouton à VoiceOver** (relecture de 2b-1, ECR-5) : son
libellé affiché, puis l'endroit qu'il ouvre — « Compléter dans « Mon
entreprise » : Capital social » ; quand la section porte plusieurs points, le
champ aussi (« … : Vos conditions, modalités de paiement ») ; « Ouvrir cette
ligne : « Dalle béton » ». Jamais la phrase entière du point. Deux boutons,
deux étiquettes — hors des deux paires d'adresses, qui mènent au même champ
et ne se montrent jamais ensemble.

Chaque point dit sa sorte (loi / prudence / règle d'Opus). Les phrases longues
de l'entreprise montrent leur première phrase et « Lire la suite » (la phrase
sur la TVA fait 672 caractères, mesuré).

**Les états, dans cet ordre** (`etatDeLaListe`, `devis.js` ; réécrit après la
relecture de 2b-1 — l'ancien tableau disait « la dernière liste sûre, et
« Des changements partent » », et le paragraphe suivant « la liste affichée
reste la dernière sûre » : les deux ensemble montraient « Ce devis ne chiffre
encore aucun travail » sous un poste qu'on venait d'écrire, ECR-1) :

| état | la ligne du haut | la carte |
|---|---|---|
| brouillon pas encore en base | « Écrivez une première ligne : la liste se calculera ensuite. » ; une ligne incomplète ou pas encore partie : « 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite. » (« N lignes ne sont pas encore enregistrées : … ») ; un champ d'en-tête refusé : « Un champ du devis n’est pas encore enregistré : la liste se calculera ensuite. » (ECR-3) — **aucun appel** (la fonction rendrait OP027), et ce n'est pas une cible | — |
| des changements partent : une écriture de la file, un champ ouvert, la relecture qu'une écriture DU DEVIS a lancée, ou celle qui suit la fermeture de « Mon entreprise » (ligne suivante du tableau) | « Des changements partent : la liste sera à jour juste après. » **seule** — ni le compte d'avant, ni à l'écran ni à VoiceOver ; au retour de « Mon entreprise », « Mise à jour de la liste… » seule (ci-dessous) ; quand quelque chose n'est pas compté, sa HAUTEUR reste la place réservée (ligne « liste lue, mais… ») — et aussi tant qu'une écriture RENVOYÉE après un échec est en route (« Réessayer » d'une ligne ou de l'en-tête, le renvoi d'un retrait, le renvoi automatique du plafond, et la même écriture renvoyée par une autre porte : la carte d'une ligne en échec fermée sans rien changer, le reste d'un refus partiel de l'en-tête — relecture 7, 08/11) : la place réservée se rend quand l'entrée renvoyée quitte « en cours », ce qui a été voulu pendant le renvoi compris, jamais à son départ (relecture 5, RELIRE4-C ; règle sans mémoire de la relecture 6, 07/11) | la partie « Ce devis » se tait : « Ce devis : la liste se met à jour. », posée sur sa place GARDÉE — la dernière liste sûre de la partie reste montée, invisible et cachée à VoiceOver (relecture 2, REL-3, 06/11) ; pour une écriture du devis, « Votre entreprise » et ses mentions restent (rien n'y a changé). Avec une liste à montrer, « Des changements partent » ne s'écrit plus en tête de la carte : la phrase à la place de « Ce devis » le dit (une phrase d'en-tête qui disparaissait au retour faisait remonter tout ce qui la suit) |
| lecture en échec | le bouton « Liste de ce qu’il manque non lue. Réessayer » ; **jamais** « rien ne manque » | « Liste non lue — Réessayer » |
| liste lue | « ce devis — 2 points · votre entreprise — 1 point » | les trois parties |
| liste lue, mais une ligne n'est pas enregistrée (refusée, incomplète, ou qui n'est pas revenue) | la phrase (« 1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste. ») **et** le décompte de la dernière liste sûre (décision D-A) — trois lignes de texte à 390, quatre à 375 et 320, rien de coupé. **Sa hauteur ne dépend de rien tant que quelque chose n'est pas compté sur un devis en base** (relecture 2, REL-1 ; décision D-A bis ; relecture 4, RELIRE3-1, 06/11) : QUINZE GABARITS FIXES invisibles — les plus longs de ses textes possibles, sans regarder ni la liste lue, ni les nombres, ni la phrase, ni l'état — donnent la hauteur, dans TOUS les états (liste, en route, relecture après « Mon entreprise », lecture — la première comprise —, échec, OP027), et ce que la ligne dit est posé par-dessus, sans jamais être coupé. Réservé à 393 (l'iPhone 16 du propriétaire) : 110 points en haut, 88 en bas. Avant (relecture 2), elle tombait à 74 points à la première lettre tapée dans l'en-tête ; avant la relecture 4, ses deux gabarits suivaient les nombres de la dernière liste lue — elle bougeait encore quand un point s'éteignait (92 → 110 à 393), et ne réservait rien de plus que 74 points à la première lecture et en échec sans liste. **Un renvoi ne rend pas la place** (relecture 5, RELIRE4-C, 07/11) : la phrase « pas compté » ne voit que ce qui n'est pas enregistré MAINTENANT, jamais une écriture en route — « Réessayer » la faisait taire, et la place avec elle (110 → 74 → 110 à 393, 128 → 74 → 128 à 320, quand l'envoi ne revenait toujours pas). La relecture 5 y avait mis une mémoire, rendue seulement par une liste NEUVE qui revient ; elle ne se rendait plus quand ce qui n'était pas compté disparaissait SANS écriture, puis se rendait au retour d'une liste sans rapport, sous le doigt (relecture 6, RELIRE5-R1). **La règle, sans mémoire** (`garderLaPlace`, `devis.js`, calculée à chaque rendu) : la place est réservée tant que quelque chose n'est pas compté OU qu'une écriture renvoyée après un échec est en route — la file le dit (`renvoisEnRoute()`), la saisie le recopie dans son état d'attente. Mesuré au navigateur, l'envoi d'une ligne puis de l'en-tête qui ne reviennent pas, « Réessayer », un nouvel échec, puis un « Réessayer » qui réussit, la lecture qui suit retenue : à 393 et à 320, une seule hauteur jusqu'à la RÉUSSITE du renvoi (110 et 88 ; 128 et 104), la rangée touchée immobile l'ancrage du défilement éteint (comme iOS) ; à la réussite, 74 et 72, une fois, la rangée remontant d'autant (le saut nommé « ce n'est plus pas compté ») ; le retour de la liste, ensuite, ne fait plus rien bouger | les trois parties, la phrase en tête |
| relecture au retour de « Mon entreprise » — un état « en route », ses deux causes | « Mise à jour de la liste… », **seule** : vrai que « Mon entreprise » ait changé quelque chose ou non (relecture 4, 06/11 ; `phraseEnRoute`, `devis.js`), y compris si une écriture du devis part en même temps ; quand quelque chose n'est pas compté, la place réservée ne bouge pas (D-A bis) | « Ce devis » ET « Votre entreprise » (et ses mentions) se taisent, chacun sur sa place gardée (REL-3) : « Ce devis : la liste se met à jour. », « Votre entreprise : la liste se met à jour. ». La fermeture de « Mon entreprise » relit TOUJOURS les deux causes, une fois par retour, et rien d'autre ne relit (relecture 4, décision de simplifier REL-2) : la fenêtre a pu changer le régime de TVA, qui décide des points du DEVIS (rang 3, `devis_taux_franchise` / `devis_taux_sans_tva`), et Opus ne cherche plus à savoir quoi. Avant, il comparait le régime de la dernière liste à celui reçu (`causesAuRetourDeLEntreprise`, `decisionDuRegime`, retirés) et relisait la liste dès qu'un régime connu changeait — une machinerie qui se trompait dans deux courses (RELIRE-1). Le prix, assumé : un retour sans changement fait taire « Ce devis » le temps d'une lecture |
| rien ne manque pour CE devis | le compte | « **Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui.** » et juste dessous `PAS_ENCORE_VERIFIE` (annexe B.8 ; critique D2 : sans elle, « rien ne manque » mentirait) — **aucune** annonce de date ni de « prochain lot » (E-11) |

Une relecture lancée par une écriture du devis et une relecture au retour de
« Mon entreprise » s'additionnent tant qu'aucune liste n'est revenue : chacune
tait ce qu'elle relit — la première « Ce devis », la seconde les deux parties
(relecture 4, 06/11) —, et la ligne dit « Mise à jour de la liste… » tant que la
seconde court. Le compte de la ligne du haut et le titre d'une partie qui se
tait ne s'affichent jamais avec des chiffres périmés.

**Les avis ne se donnent que sur une liste sûre** (relecture de 2b-1, PAR-8) :
« Ce devis est gratuit… » ne paraît que sur une liste lue, sans ligne non
enregistrée — pas sur des lignes qui partent encore.

**Quand la liste est relue** (critique E-1, E-5, B11, confirmés bloquants) :
à l'ouverture d'un devis déjà en base ; **après chaque relecture des totaux**,
lancée par la file d'écriture (même garde de génération : une réponse périmée
est écartée et relancée) ; **au retour de « Mon entreprise »** (la fenêtre
écrit ailleurs : sa fermeture relance la lecture, avec ses deux causes,
une fois par retour — relecture 4, 06/11) ; sur « Réessayer ». Le lieu
des travaux s'enregistre aussi quand on QUITTE la rue (relecture de 2b-1,
ECR-2) : une rue tapée sans choisir de suggestion laissait « Des changements
partent » sans que rien ne parte ; une suggestion choisie ensuite s'enregistre
en dernier.

**Le régime de TVA ne fait rien relire** (quatrième relecture de 2b-1, 06/11/2026,
décision de simplifier REL-2). La liste est calculée par la BASE
(`motifs_refus_remise`), avec le régime que la base a au moment de la
lecture : ce que le téléphone sait du régime — pas encore lu, en lecture, en
échec, non déclaré — ne la rend jamais fausse ; et le régime ne s'écrit que
dans « Mon entreprise », dont la fermeture relit tout — et vient toujours APRÈS
l'écriture : ses trois sorties (la croix, le geste de retour d'Android, « Quitter
sans enregistrer ») attendent la fin d'un envoi en cours et le disent (cinquième
relecture, 07/11, RELIRE4-A : le bouton de la bande appelait la fermeture
directement ; touché pendant l'enregistrement d'un régime changé, la relecture
partait avant l'écriture, et plus rien ne relisait ensuite). Rien n'écoute donc
plus le régime reçu : réel → échec → réel, chargement → réel, non déclaré →
franchise ne relisent rien et n'effacent rien (mesuré au navigateur, par le
setter du régime d'OpusApp : aucune lecture, réseau coupé compris ; et la
lecture du régime qui LÈVE à l'ouverture, puis « Réessayer » pendant que la
liste se lit : une lecture en tout). La machinerie de la troisième
relecture — le régime de la liste, l'inconnu, l'adoption (`REGIME_INCONNU`,
`regimePourLaListe`, `regimeAdopte`, `decisionDuRegime`,
`causesAuRetourDeLEntreprise`) — est retirée, et RELIRE-1 (« une lecture du
régime en cours ou ratée ne relit rien ») devient vrai par construction.

**Le prix de la place réservée** (D-A bis, relecture 4), mesuré le 06/11 au
navigateur sur les vrais composants, de 320 à 440 points d'écran, contre la
version d'avant (29cb6a9), quand quelque chose n'est pas compté sur un devis
en base :

| ligne | largeur d'écran | réservé | avant (29cb6a9) | le prix |
|---|---|---|---|---|
| haut | 320–323 | **128** | 110 | +18, pour tous — « 444 lignes ne sont pas enregistrées… » y prend une ligne de plus |
| haut | 324–377 | 110 | 110 | 0 |
| haut | 378–402 (393 compris) | **110** | 92 avec des points au devis (dès 378 pour 1 point, 386 pour 2, 391 pour 10) ; 110 sans | +18 avec des points |
| haut | 403–407 | 92 | 110 sans point ; 92 avec | −18 sans point |
| haut | 408–440 | 92 | 92 | 0 |
| bas | 320–324 | 104 | 104 | 0 |
| bas | 325–347 | **104** | 88 avec des points (dès 325 pour 1 point, 333 pour 2, 338 pour 10) ; 104 sans | +16 avec des points |
| bas | 348–352 | 88 | 104 sans point ; 88 avec | −16 sans point |
| bas | 353–410 | 88 | 88 | 0 |
| bas | 411–440 | **88** | 72 | +16, pour tous |
| haut | la première lecture et l'échec sans liste lue | 128 / 110 / 92 | 74 | +54 (320–323), +36 (324–402), +18 (403–440) |
| bas | la première lecture et l'échec sans liste lue | 104 / 88 | 72 | +32 (320–347), +16 (348–440) |

**Le saut depuis « tout compté »** (relecture 5, RELIRE4-E, 07/11), à montrer au propriétaire :
quand rien n'est « pas compté », la ligne fait 74 points en haut et 72 en bas, à toutes les largeurs.
Quand quelque chose cesse d'être compté (une ligne incomplète ou qui n'est pas enregistrée, un champ
refusé), elle saute à la place réservée ; quand une liste qui compte tout revient, elle redescend
d'autant, une fois. Largeur par largeur, ce saut maintenant et à 29cb6a9 (calculé sur les relevés du
balayage du 06/11, les deux arbres rendus par le même banc ; ni les hauteurs réservées ni l'ordinaire
n'ont changé le 07/11) :

| ligne | largeur d'écran | le saut | avant (29cb6a9) |
|---|---|---|---|
| haut | 320–323 | **54** | 36 |
| haut | 324–377 | 36 | 36 |
| haut | 378–402 (393 compris) | **36** | 18 avec des points au devis (dès 378 pour 1 point, 386 pour 2, 391 pour 10) ; 36 sans |
| haut | 403–407 | 18 | 36 sans point ; 18 avec |
| haut | 408–440 | 18 | 18 |
| bas | 320–324 | 32 | 32 |
| bas | 325–347 | **32** | 16 avec des points (dès 325 pour 1 point, 333 pour 2, 338 pour 10) ; 32 sans |
| bas | 348–352 | 16 | 32 sans point ; 16 avec |
| bas | 353–410 | 16 | 16 |
| bas | 411–440 | **16** | 0 |

Il a grandi à 320–323, et avec des points à 378–402 et 325–347 ; il est NOUVEAU en bas de 411 à 440 ;
il a diminué sans point à 403–407 et 348–352. À 393 (l'iPhone 16 du propriétaire) : 36 en haut, 16 en
bas.

**La règle, SANS MÉMOIRE** (relecture 6, 07/11, décision d'architecture) : la ligne réserve ses
gabarits si et seulement si le devis est en base et que quelque chose n'est pas compté OU qu'une écriture
renvoyée après un échec est en route (« Réessayer » sur une ligne, sur l'en-tête, sur un retrait, et le
renvoi automatique du plafond). Elle se calcule à chaque rendu, sur ce que la saisie et la file savent
déjà (`garderLaPlace`, `devis.js` ; la file marque ses renvois, `renvoisEnRoute()`, et la saisie le
recopie dans son état d'attente — jamais une lecture de la file pendant le rendu). La mémoire de la
relecture 5 (une place rendue seulement au retour d'une liste neuve) est abandonnée : ce qui cessait
d'être compté SANS écriture — une ligne jamais envoyée qu'on retire, une valeur remise à celle de la
base, un champ de l'en-tête rétabli — ne la rendait plus, et elle se rendait au retour d'une liste sans
rapport, sous le doigt (RELIRE5-R1 : le délai qu'on venait de quitter montait de 36 points).

**Les sauts nommés, et c'est tout** — hors de la décision D-A bis, qui ne vaut que TANT QUE quelque
chose n'est pas compté : ce sont le passage de « tout compté » à « quelque chose n'est pas compté », et le
retour.
- **Devenir « pas compté »** (une ligne laissée incomplète ou refusée, une écriture qui échoue, un champ
  refusé) : la place se RÉSERVE (le saut ci-dessus).
- **Cesser de l'être** : la place se REND, d'autant — AU GESTE quand rien ne part (la ligne retirée, la
  valeur remise, le champ rétabli ; mesuré : sous 900 ms, sans aucune écriture ni lecture) ou quand une
  nouvelle écriture part (la ligne complétée, le champ corrigé — une VRAIE correction, qui change une
  valeur) ; QUAND L'ENTRÉE RENVOYÉE QUITTE « EN COURS » après un échec (« Réessayer », le plafond, ou la
  même écriture renvoyée par une autre porte — ci-dessous), ce qui a été voulu pendant le renvoi compris :
  à la réussite du renvoi, ou à la fin d'une correction ou d'un retrait faits pendant son vol (la marque
  les suit ; une correction qui échoue ne fait aucun rebond — relecture 7, RELIRE6-3, 08/11). Le retour
  d'une liste, ensuite, ne la fait plus bouger (mesuré : le délai tapé et quitté, sa liste revenue, la
  ligne et le champ immobiles).
- **L'entrée en base d'un brouillon** : un brouillon PAS ENCORE EN BASE ne réserve rien (74 points en
  haut, 72 en bas), même avec une ligne incomplète ou un renvoi — il n'a ni liste ni décompte à venir ;
  quand une ligne complète le fait entrer en base avec une ligne incomplète, la ligne saute une fois à la
  place réservée (à 393 : 74 → 110 en haut, 72 → 88 en bas). À dire au propriétaire.

Rien d'autre ne la change : ni l'état de la liste (en route, lecture, échec, OP027, la relecture qui
suit « Mon entreprise »), ni ses nombres, ni sa phrase, ni le retour d'une liste. Une relecture des
totaux ratée ne relit pas la liste : la place ne bouge pas pour autant.

**Un renvoi, par quelque porte que ce soit** (relecture 7, 08/11, RELIRE6-1 et RELIRE6-2) : la même
écriture renvoyée telle quelle après un échec n'est PAS « une nouvelle écriture » (le saut nommé
ci-dessus), c'est un renvoi, et la file le marque comme « Réessayer » — la carte d'une ligne en échec
fermée SANS RIEN CHANGER (« ‹ », « Poste suivant », la barre du bas, une autre carte…), le reste d'un
refus partiel de l'en-tête (remis en fin de file), une écriture de l'en-tête pendant qu'un refus du
plafond est tenu à part et le restera — et, dans la file seulement (l'écran n'ouvre pas ces portes
aujourd'hui : une ligne retirée quitte la liste, l'en-tête n'envoie que ce qui change), un retrait en
échec retiré de nouveau et l'en-tête en échec réécrit inchangé. Et si c'est le RENVOI qui échoue, ce qui a
été voulu pendant son vol repart avec la marque (« Poste suivant » enregistre la carte, puis l'ouverture
de la carte neuve l'enregistre encore pendant le vol de la première). Sans la marque, la place
faisait 110 → 74 → 110 à 393 (128 → 74 → 128 à 320) — mesuré au navigateur. Une ligne refusée
DÉFINITIVEMENT, refermée sans changer, ne repart pas du tout.

**Sous une carte ou une feuille ouverte**, la place se réserve et se rend comme ailleurs — la règle ne
regarde pas les cartes : ce qui change sous elles (la ligne complétée DANS sa carte, qui part quand on
quitte un champ ; « Poste suivant » ; un renvoi qui réussit ; une écriture qui échoue) change la hauteur
de la ligne dessous. Au navigateur, Chromium compensait ce changement en faisant défiler la liste
(`overflow-anchor`), et `react-native-web` fermait alors le clavier au bout de tout défilement
(`keyboardDismissMode="on-drag"`) : le champ de la carte perdait la main (mesuré le 07/11 : la
désignation de la carte ouverte par « Poste suivant » ne recevait rien ; c'était déjà vrai sur l'arbre
d'avant). **La liste ne ferme plus le clavier tant qu'une carte ou une feuille la couvre**
(`glisserFermeLeClavier`, `SaisieDevisScreen.js`) — une condition du rendu, pas une mémoire. On n'a PAS
gardé « la place ne se rend pas tant qu'une carte la couvre » : sans mémoire, elle ne s'écrit qu'en
réservant la place à CHAQUE ouverture de carte (la ligne grandirait sous chaque carte, et sous le voile
d'une feuille), et elle ne fermait que la moitié du défaut — une écriture qui échoue sous la carte
RÉSERVE la place, et fermait le clavier tout autant. Sur l'iPhone, la liste ne défile pas d'elle-même et
`on-drag` ne réagit qu'à un glissement du doigt, impossible sous la carte : rien n'y change. Ce qui n'est
pas couvert : « Mon entreprise » ouverte par-dessus la saisie n'est ni une carte ni une feuille de
l'écran.

**La rangée « Conditions »** cesse de dire « Aucune condition » quand la
validité manque (E-12) : son résumé dit « Validité à choisir ».

### 3.2 Les motifs de 2b-1

| clé | quand | phrase (à relire) | nature | fondement |
|---|---|---|---|---|
| `devis_client` | aucun client | « Ce devis ne s’adresse encore à personne : choisissez le client. La loi demande son nom pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus le demande pour tous vos devis. » | **règle d'Opus** (D-C, 05/11 au soir) | arrêté 2017 4-I (nom du client, dépannage, réparation, entretien signé dans les locaux) ; arrêté du 17/03/2015 art. 7 4° (services à la personne) ; D4 (a) : le client est exigé à la remise |
| `devis_lieu` | ni adresse, ni code postal, ni ville | « Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un. » | prudence | arrêté 2017 4-I ; arrêté du 17/03/2015 art. 7 5° : Opus ne sait pas encore si le devis relève de l'un ou de l'autre (2b-4) |
| `devis_lignes` | aucune ligne `poste` | « Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste. La loi demande de décrire les travaux et leur prix pour un devis à un particulier ; Opus le demande pour tous vos devis. » | **règle d'Opus** (D-C, 05/11 au soir) | L. 111-1 1° et 2° (consommateur) ; arrêté 2017 4-I (décompte détaillé) ; arrêté du 17/03/2015 art. 7 6° et 9° |
| `devis_delai` | `delai_execution` vide | « Écrivez le délai d’exécution des travaux. La loi le demande pour la plupart des devis à un particulier ; Opus le demande pour tous vos devis. » | **règle d'Opus** (réponse 2) | L. 111-1 3° (consommateur, sauf exécution immédiate) ; L. 221-5 I 3° (hors établissement), sauf ce que L. 221-2 12° et L. 221-3 retirent — d'où « la plupart des devis » (TXT-5, 05/11) |
| `devis_validite` | `validite_jours` vide | « Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un. » | prudence | arrêté 2017 4-I ; arrêté du 17/03/2015 art. 7 1° (services à la personne) |
| `devis_acompte_nature` | acompte demandé, nature vide | « Dites si la somme demandée d’avance est un acompte ou des arrhes : leurs effets ne sont pas les mêmes, et Opus ne choisit pas à votre place. » (B.2) | prudence | L. 214-1 (face à un consommateur, une somme versée d'avance vaut arrhes sauf stipulation) ; L. 214-3 exclut « les commandes spéciales sur devis » — (J) |
| `devis_reduction_ramenee` | réduction **en euros** demandée > réduction appliquée | « La réduction en euros dépasse le total des postes : Opus l’a ramenée. Corrigez-la pour que le devis dise ce que vous voulez. » | prudence (Opus ne sait pas ce que vous vouliez) | — (en %, jamais ramenée : prouvé sur 140 007 cas, critique B8). « total des postes » : la réduction est bornée par le HT brut des postes, pas par le TTC (BASE-3, 05/11) |
| `devis_acompte_ramene` | acompte **en euros** demandé > acompte appliqué | « L’acompte en euros dépasse le total du devis : Opus l’a ramené. Corrigez-le pour que le devis dise ce que vous voulez. » (B.2) | prudence | — |
| `devis_taux_franchise` | **une ligne par ligne fautive** (`ligne_id`) : régime « franchise » et taux ≠ 0 — lignes `poste` ET `option`, offertes comprises | « En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne. » | loi | CGI 293 E II (un franchisé ne fait apparaître la taxe ni sur ses factures ni « sur aucun autre document en tenant lieu ») |
| `devis_taux_sans_tva` | **une ligne par ligne fautive** : régime « réel » et taux 0 — mêmes lignes | « Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne. » | prudence | CGI 283 2 nonies (autoliquidation de la sous-traitance du bâtiment : une ligne sans TVA au réel est licite, Opus ne sait pas encore l'imprimer ; recopié dans `textes/cgi-283.txt`). Les deux clés remplacent `devis_taux_regime` le 05/11 (TXT-1). **Même règle que `coherenceRegime()`**, qui juge déjà poste et option ; la base ne lit **pas** `devis_tva`, qui ignore les options (mesuré, B7) |
| *(entreprise)* | `emetteur_incomplet(pro)` | phrases actuelles | selon §2.1 | lot 0a, T, VIES |

Le motif `regime_tva` (régime non déclaré) vient de l'entreprise : il double
le bandeau du haut, et c'est voulu (la liste est le résumé). Sa nature est
**prudence** depuis le 05/11 (TXT-7) : aucune loi ne demande de déclarer son
régime à Opus, c'est Opus qui en a besoin pour imprimer la TVA ou la mention
de franchise.

**TVA à taux réduit (réponse 3)** : aucun motif ; 2c imprimera la certification du client. En 2b-1, une **aide** sous le taux de la ligne (`AIDE_TAUX_REDUIT`, B.8, réécrite le 05/11 par TXT-3) : « À 10 % ou 5,5 %, le client devra certifier sur le devis que les conditions du taux réduit sont remplies : un logement achevé depuis plus de deux ans, des travaux qui ne créent pas un immeuble neuf et n’agrandissent pas la surface de plus de 10 % ; à 5,5 %, des travaux de rénovation énergétique. Opus imprimera la certification prévue par la loi, avec la place de signer. » — à faire relire par un juriste (`restes.md`, relecture 2, REL-5).

**Les 11 motifs `conso_` sont tous gardés en 2b-1**, et leur nature suit B.3
(aligné le 05/11, BASE-2) : 9 en `loi` (la loi les demande pour un particulier,
et chaque phrase commence par « Pour un devis à un particulier »),
`conso_profession_reglementee` en `prudence`, `conso_tva_intra` en `regle_opus`.
C'est l'ÉCRAN qui, par prudence, les range sous « Mentions dues à un
particulier » tant qu'Opus ne sait pas pour qui le client commande. Le tri
arrive en 2b-2.

**Les avis de 2b-1** (`avisDuDevis()`, pur, jamais bloquants) : « Ce devis n'a
pas de titre : le document dira seulement "Devis". » ; « Ce devis ne coûte rien
au client. » (tout offert). Ils s'affichent sous la liste, à part. Le second
ne se dit que sur une liste SÛRE — lue, sans ligne non enregistrée (relecture
de 2b-1, PAR-8) : un seul poste pas encore enregistré, et un TTC de base à 0,
le faisaient dire.

**Ce qui N'EST PAS dans 2b-1, et pourquoi :**

- **l'attestation décennale** (L. 243-2, quel que soit le client) : la déduire
  du métier contredirait le plan (« jamais le métier », `PLAN:2867`) ; elle
  attend le marqueur de ligne de 2b-3 (critique D3, abaissée) ;
- **devis payant ou gratuit, déchets, RGE** : 2b-4 (ou le lot TVA pour le RGE,
  (P) au début de 2b-4) — et la phrase « Pas encore vérifié » les nomme ;
- **la remise à une personne qui vous a bloqué** : la liste ne peut pas la
  voir (D4-c). Elle suivra la décision du 25/10 (« plus rien de neuf ») : la
  REMISE par Opus (2c) la refusera, avec sa propre phrase ;
- **le SIREN d'un client professionnel** : un avis, en 2b-2 (mention de
  facture, CGI 242 nonies A).

### 3.3 La base

- `motifs_refus_remise(p_devis)` en **49.9**, après `recalcule_devis` ;
  `mes_donnees()` reste la dernière fonction, le balayage de la section 43
  après elle.
- **Aucune colonne, aucune contrainte, aucune donnée touchée.**
- `OP027` ; `estUnRefusDefinitif` le connaît (un refus qui ne se réessaie pas).
- Les dettes que la critique range ici, parce que 2b-1 touche `schema.sql` :
  le commentaire de 49.6 ter (« au prochain changement ») et la phrase périmée
  de `PLAN-DEVIS` sur le « prochain code libre ».
- Performance (critique B3, abaissée) : la politique des lignes parcourt tous
  les devis (36 ms à 102 000 devis, mesuré) ; c'est un défaut **existant**,
  pas de 2b-1, noté dans `A-FAIRE` avec sa mesure ; la fonction lit les lignes
  en une requête.

### 3.4 L'application

- `src/lib/devis.js` : `MOTIFS_DEVIS` (clé → phrase, recopiées de la base),
  `motifsDeRemise()` pur, `avisDuDevis()` pur, `ENDROIT_DU_MOTIF`,
  `lireMotifsDeRemise()` (par endroit) ; une clé inconnue s'affiche quand même ;
- `src/lib/api.js` : `motifsRefusRemise(devisId)`, Supabase et démonstration ;
- `src/lib/erreurs.js` : OP027 ;
- `SaisieDevisScreen.js` : la ligne du haut, la rangée du bas, la carte, les
  états, les relectures (§3.1), le retour de « Mon entreprise » ;
- `EnteteDevis.js` : donner le focus au délai et au lieu (E-16) ;
- un composant `PourRemettre.js` sur le modèle de `PretAEmettre.js` ;
- démonstration : un brouillon dont « Ce devis » est complet et un autre où
  manquent la validité et la nature de l'acompte. L'entreprise de
  démonstration garde ses 5 manques (exigés par `verifier-emetteur`) : la
  ligne « Votre entreprise » y reste allumée, comme chez le propriétaire.

### 3.5 Les textes légaux

DÉDUIT : 2b-1 ne collecte rien de nouveau et ne décide rien de nouveau sur une
personne (le refus fondé sur VIES est déjà décrit) : **pas de changement de
`VERSION`**, sauf si Q2 retire une règle d'Opus que les textes décrivent
(`conso_tva_intra`) — alors les textes changent dans le même lot.

### 3.6 Les contrôles

- `verifier-devis` §14 (D4-c) : `motifs_refus_remise` peut nommer
  `public.devis` ; elle ne nomme jamais `quote_request_id`, `sos_request_id`,
  `quote_requests`, `sos_requests`, `source` (quelle qu'en soit la forme),
  `'qr'|'visite'|'dossier'`, ni `select *`, `to_jsonb`, `row_to_json`,
  `%rowtype` (un `count(*)` reste permis). **Et la preuve qui compte est dans
  l'essai** : deux devis identiques sauf leurs liens et leur source rendent
  exactement les mêmes motifs (critique B5 : le contrôle de texte laissait
  passer quatre lectures de l'origine) ;
- les **neuf emplacements** des listes fermées (critique B4), dont
  `verifier-emetteur.mjs:1264-1267` et les attendus de l'essai 46 : qui nomme
  les tables du devis, qui nomme `emetteur`, les deux listes `security
  definer` (inchangées : la fonction est `invoker`) ;
- la **forme entière** de la fonction comparée (« changer une règle se
  décide »), et la phrase de chaque motif comparée entre SQL et JS ;
- les cas de `cas-remise.json` joués par JS (§2.3) ;
- l'écran : les quatre états, aucun « Rien ne manque » sur un échec ni sur un
  brouillon pas encore en base, la phrase « Pas encore vérifié », les
  relectures (ouverture, totaux, retour de « Mon entreprise »), un bouton par
  point d'entreprise, `CARTE_POUR_REMETTRE`, le retour à la liste depuis
  « Conditions » ;
- `mesure-devis` : le parcours en démonstration, et ce qu'il compte déjà
  (`/^Conditions : /`, l'ordre de `enregistrerCarte`) mis à jour avec sa
  raison (E-21).

### 3.7 Les essais

`supabase/essais-section-49-remise.sql` : chaque motif allumé puis éteint,
par le chemin d'un client ; OP027 pour un devis d'autrui et pour un devis
inventé, **avec un jeton, depuis une fonction `security definer` et par
`service_role`** ; un visiteur refusé ; la propriété D4-c (§3.6) ; le
catalogue (colonnes nommées, `invoker`, droits) ; le nombre exact d'erreurs
annoncé en tête. Les essais 46 et 49 (cas 27a) mis à jour.

**Et la relecture de sécurité du lot 1**, « à relancer avant le lot 2, ou à
acter » (`A-FAIRE`, critique « découpage » 10) : la relecture adverse de 2b-1
porte aussi sur toute la section 49.

### 3.8 La migration et l'essai réel

Une fonction et ses droits, construits depuis `schema.sql`, simulés sur une
imitation (`git show 5405f8b:supabase/schema.sql`), gardés par le md5,
appliqués avec l'accord du propriétaire, Opus fermé. Puis, par le chemin de
l'application, avec un artisan jetable à Brest : un devis neuf (aucun appel),
une première ligne (la liste arrive), chaque motif allumé puis éteint ; un
autre artisan → OP027 ; un visiteur → 401. Ménage par le chemin de
l'application.

### 3.9 Ce qui ne se vérifie pas ici

Le geste au doigt, le focus du clavier sur le délai, VoiceOver sur la carte :
à l'iPhone.

---

## 4. Étape 2b-2 — Pour qui, et quand c'est signé (décrite)

Trois faits, vides par défaut, datés par la base.

1. **Pour qui le client commande** : « pour lui-même, à titre privé » · « pour
   son entreprise » · « pour son entreprise, **en dehors de son activité
   principale**, et elle a **5 salariés au plus** » · « pour une association,
   une copropriété ou une société civile sans activité professionnelle ».
   ÉTABLI (`droit.md` §2) : le troisième cas n'est protégé **que hors
   établissement**, mais là, il a droit à **toutes** les mentions dues à un
   particulier (L. 221-5 I et II, R. 221-2 — critique D10). Le critère est
   « l'activité principale », pas « le métier » (l'aide de 2a,
   `devis.js:2137`, est à corriger). Une fiche « particulier » **propose** le
   premier cas (une phrase et « Confirmer ») ; changer de client remet la
   question à vide (la base le fait). Vide = motif.
2. **Le moment de la signature** (plan 10.3 : « le moment, pas l'endroit »,
   `PLAN:2901`) : deux valeurs, vide = le cas protecteur (hors
   établissement : rétractation, formulaire, aucun paiement avant le 8e jour).
   Le plan 10.12 dit que la question se repose **à la remise** : en 2b-2 le
   fait existe avec son défaut protecteur, et 2c le fait reconfirmer. L'autre
   réponse demande une confirmation qui dit le risque, datée par la base. Le
   cas courant du propriétaire (visite, devis envoyé par e-mail, accepté par
   e-mail) est **(J) Q-J7** : d'ici là, le défaut protecteur reste.
3. **Construction neuve** : deux notions à ne pas confondre (critique D9) —
   la « construction d'immeubles neufs ou la transformation importante »
   (L. 221-2 12°), qui retire **tout** le chapitre hors établissement, et
   « l'immeuble neuf » fiscal (CGI 257, 279-0 bis 2), qui interdit les taux
   réduits. Vide = « non » (protecteur). Libellé sans le mot « construction »
   seul.

Questions de l'étape (P) : les libellés ; une SCI, un syndic, une association
« comme un particulier, par prudence » (Q-J5).

## 5. Étape 2b-3 — Les lignes (décrite)

1. **Urgence**, sur une ligne `poste` : vide par défaut, jamais conditionnée à
   l'origine du devis ; proposée sur une ligne neuve d'un devis venu d'une
   urgence (un geste de l'écran, la base ne lit pas l'origine) ; une aide qui
   dit les conditions (« demandée expressément », « strictement nécessaire »
   — L. 221-28 8°, L. 221-10 4°) et l'abus de faiblesse (L. 121-9 5°) sans rien
   affirmer du client. Ce qu'elle change : pas de rétractation pour ces
   lignes (imprimé en 2c) ; l'acompte « à la signature » seulement si toutes
   les lignes chiffrées sont d'urgence. **Son motif** : la conséquence sur
   l'acompte (critique « découpage » 7 : un fait sans motif n'a pas de
   lecteur).
2. **« Peut engager ma garantie décennale »**, sur `poste` et `option` ;
   motif `devis_attestation` si une ligne est marquée et qu'aucune
   attestation valable n'est jointe dans « Mon entreprise » (L. 243-2 ; la
   sanction de la remise refusée est un choix du plan, Q2 à cette étape).
3. `devis_ligne_forme_check` étendue (un titre ou une réserve n'en porte
   aucun).

Questions de l'étape (P) : par ligne ou par devis, et le défaut ; l'urgence
sur une option ; garder le devis « mixte ».

## 6. Étape 2b-4 — Ce que coûte le devis, ce qu'il laisse (décrite)

1. **Devis payant ou gratuit** : gratuit (un interrupteur qui écrit 0),
   payant (un montant), pas encore dit (motif) ; proposé depuis « Mes tarifs »
   (le propriétaire : gratuit) ; services à la personne : toujours gratuit
   (arrêté du 17/03/2015 art. 6).
2. **Déchets de chantier** : sur tout devis de construction, rénovation,
   démolition de bâtiments, ou de jardinage, quel que soit le client — les
   quatre rubriques du décret (D. 541-45-1). L'exception « PEMD » renvoie à un
   article **abrogé** (CCH L. 111-10-4) — **(J) Q-J1** — ; elle vise plus de
   1 000 m² **ou** un bâtiment qui a accueilli des substances dangereuses
   (R. 126-8, critique D16).
3. **Le champ de l'arrêté de 2017** (dépannage, réparation, entretien) : une
   question par devis, ou tout imprimer par prudence (alors `devis_lieu` et
   `devis_validite` deviennent des motifs permanents — à dire comme tels).
4. **RGE** (L. 224-114, L. 224-115 ; nullité du contrat) : ici ou au lot TVA
   (P).
5. Avis : franchisé au-delà du seuil ; attestation qui expire avant le début.
6. Préalable : la classe de blancs écrite une fois, avant la première colonne
   de texte.

---

## 7. Les questions au propriétaire — MAINTENANT

1. **Le découpage** : quatre étapes, chacune essayée sur votre iPhone avant la
   suivante (recommandé) ; deux étapes plus grosses ; ou une seule fois.
2. **Les règles d'Opus plus strictes que la loi** (choix multiple) : relire le
   SIRET chaque année (déjà gardée) ; le n° de TVA reconnu par VIES pour un
   devis à un particulier (déjà écrite dans vos textes) ; les frais de
   déplacement dits sur tous les devis ; le délai d'exécution sur tous les
   devis.
3. **La TVA à 10 % et 5,5 %** : depuis 2025, le client certifie **sur le
   devis** que le logement a plus de deux ans ; Opus ne sait pas encore
   l'imprimer. Bloquer seulement les devis qui ont une ligne à taux réduit,
   jusqu'au lot TVA (recommandé) ; bloquer tout devis au régime réel (ce que
   prévoyait le plan) ; ou les permettre dès 2c en imprimant une
   certification simple.
4. **Où voir la liste** : en haut ET en bas du devis (recommandé) ; en bas
   seulement ; dans la carte « Conditions ».

**À dire, pas à demander** : son n° de TVA refusé par VIES garde la ligne
« Votre entreprise » allumée sur ses devis ; la remise à une personne qui l'a
bloqué sera refusée par 2c (règle du 25/10) ; la question de la
reconstruction de l'application (impression du PDF) reviendra au début de 2c.

## 8. Au juriste (n'empêche pas de construire : rien ne sort avant 2c)

`lot2b/comprendre/droit.md` §5.C (Q-J1 à Q-J24). Pour 2b-1 : **Q-J6**
(l'arrêté 2017 4-I face à un client professionnel), L. 214-3 et la nature de
l'acompte, la certification des taux réduits (forme, moment, 5,5 %), et la
place de la reconnaissance VIES (règle d'Opus) dans les textes.

## 9. Ce que 2b ne fait pas

Numéro, PDF, aperçu, remise (2c) ; signature enregistrée, dates d'échéance
(lot 4) ; QR et Dossier Travaux (consigne du 19/10) ; TVA réduite au-delà de ce
que Q3 décide (lot TVA) ; aucun module natif, aucune reconstruction.

---

## Annexe A — constat → décision (bloquants et importants retenus)

| constat | décision |
|---|---|
| D1 (bloquant) : trois règles d'Opus classées « loi » | §2.1 inventaire honnête ; Q2 réécrite en choix multiple |
| D7 + découpage 4 (bloquants) : la certification mal résumée ; Q3 revenait sur le plan sans le dire | §3.2 `devis_taux_reduit` selon Q3 ; Q3 dit ce que prévoyait le plan |
| D2 : « Rien ne manque » trompeur | phrase « Pas encore vérifié : … » (§3.1) |
| D5 : RGE disparu | 2b-4 ou lot TVA (P) ; nommé dans « Pas encore vérifié » |
| D8, D9, D10 (2b-2) | §4 corrigé (moment, deux notions du neuf, toutes les `conso_` pour le petit pro hors établissement) |
| B5 : D4-c aveugle | §3.6 : interdits élargis et preuve par propriété dans l'essai |
| B7 + E-10 : régime ↔ taux | `devis_taux_regime`, une ligne par ligne, même règle que `coherenceRegime`, sans `devis_tva` — coupé le 05/11 en `devis_taux_franchise` (loi) et `devis_taux_sans_tva` (prudence), TXT-1 |
| B11 + E-1 (bloquant) : pas de relecture au retour de « Mon entreprise » | §3.1 relectures |
| E-2/N1 (bloquant) : brouillon pas encore en base | « Écrivez une première ligne » pour le brouillon où rien n'est tapé ; une ligne pas encore enregistrée le dit (ECR-3) — réécrit le 06/11 (RELIRE-3) ; v2 disait : état « Écrivez une première ligne », aucun appel |
| E-3 : liste invisible sans défiler | ligne du haut + rangée du bas (Q4) |
| E-4 : un compteur qui ne s'éteint jamais | compte par endroit |
| E-5 : lecture hors file | relecture lancée par la file, après les totaux |
| E-7 : lignes non enregistrées | une ligne non enregistrée n'est pas un état : la phrase « pas compté » (`ceQueLaListeNeComptePas`) se pose à côté de l'état, avec le décompte de la dernière liste sûre (écart 8, D-A) ; une écriture qui PART met l'état « en route » — réécrit le 06/11 (RELIRE-3) ; v2 disait : état « Des changements partent » |
| E-12, E-13, E-14 | résumé « Validité à choisir » ; Conditions ouverte sur le champ, retour à la liste ; démo |
| découpage 1 : `text[]` irréversible | `returns table (cle, phrase, nature, ligne_id)` |
| découpage 3 : moment de la signature | §4 : le fait en 2b-2, reconfirmé en 2c |
| découpage 5 : remise sous blocage | refusée par 2c (règle du 25/10), dit |
| découpage 6 + M1 : « choix validés » qui ne l'étaient pas | nature et ramenées = prudence |
| découpage 7 : urgence sans lecteur ; avis sans calcul | motif de l'acompte en 2b-3 ; `avisDuDevis()` pur |
| découpage 10 : relecture sécurité du lot 1 | dans la relecture adverse de 2b-1 |
| B1 : garde hors `authenticated` | `est_mon_entreprise` dans la lecture ; essai par `definer` et `service_role` |
| B6 : avis et motifs mêlés | avis hors de la fonction |
| B8 : « ramenée » et montants | euros seulement, aucune phrase avec montant |
| M2 (découpage) : reconstruction EAS rangée nulle part | au début de 2c, dit au propriétaire |

---

## Annexe B — LE CONTRAT de 2b-1 (base ↔ téléphone), figé le 05/11 avant construction

### B.1 La fonction

```sql
public.motifs_refus_remise(p_devis uuid)
returns table (rang smallint, cle text, phrase text, nature text, ligne_id uuid)
language plpgsql stable security invoker set search_path = public
```

- garde : `where d.id = p_devis and public.est_mon_entreprise(d.pro_id)` ; sinon
  `raise exception 'Ce devis n’existe pas, ou il n’est pas le vôtre.' using errcode = 'OP027'` ;
- droits : `revoke all on function … from public, anon` ; `grant execute … to authenticated` ;
- colonnes du devis lues, NOMMÉES : `pro_id, client_id, lieu_adresse, lieu_code_postal, lieu_ville,
  delai_execution, validite_jours, acompte_centiemes, acompte_centimes, acompte_nature,
  acompte_ttc_centimes, remise_centimes, remise_ht_centimes` (et rien de l'origine) ;
- lignes : `type, taux_tva_centiemes, id, ordre` de `devis_lignes` (poste ET option, offertes comprises) ;
- régime : `emetteur.regime_tva` du `pro_id` ;
- l'ordre de sortie : `rang` croissant, puis (pour le rang 3, `devis_taux_franchise` ou `devis_taux_sans_tva`) l'ordre des lignes `ordre, id`.

### B.2 Les motifs du devis (texte exact ; apostrophe typographique ’ ; espaces insécables écrites en CARACTÈRES)

> **Mis à jour le 05/11/2026 au soir**, après la relecture de 2b-1 : décision D-C du propriétaire
> (`devis_client`, `devis_lignes` en `regle_opus`), TXT-1 (le rang 3 coupé en deux clés),
> TXT-5 (délai), TXT-6 (lieu, validité), BASE-3 (« total des postes »). La FORME entière de la
> fonction est figée dans `scripts/verifier-devis.mjs` (`FORME_MOTIFS_REFUS_REMISE`), et ces
> phrases y sont écrites en toutes lettres (`PHRASES_DU_05_11`). Dix clés sur neuf rangs.

| rang | clé | condition | nature | phrase |
|---|---|---|---|---|
| 1 | `devis_client` | `client_id is null` | `regle_opus` | Ce devis ne s’adresse encore à personne : choisissez le client. La loi demande son nom pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus le demande pour tous vos devis. |
| 2 | `devis_lignes` | aucune ligne `poste` | `regle_opus` | Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste. La loi demande de décrire les travaux et leur prix pour un devis à un particulier ; Opus le demande pour tous vos devis. |
| 3 | `devis_taux_franchise` | UNE LIGNE PAR LIGNE FAUTIVE (`ligne_id`) : `type in ('poste','option')`, régime `franchise` et taux ≠ 0 | `loi` | En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne. |
| 3 | `devis_taux_sans_tva` | UNE LIGNE PAR LIGNE FAUTIVE : `type in ('poste','option')`, régime `reel` et taux = 0 ; régime vide : aucune des deux (le motif `regime_tva` de l'entreprise le dit) | `prudence` | Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne. |
| 4 | `devis_lieu` | `lieu_adresse`, `lieu_code_postal` et `lieu_ville` tous vides | `prudence` | Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un. |
| 5 | `devis_delai` | `delai_execution` vide | `regle_opus` | Écrivez le délai d’exécution des travaux. La loi le demande pour la plupart des devis à un particulier ; Opus le demande pour tous vos devis. |
| 6 | `devis_validite` | `validite_jours is null` | `prudence` | Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un. |
| 7 | `devis_acompte_nature` | un acompte est demandé (`acompte_centiemes` ou `acompte_centimes` non vide) et `acompte_nature is null` | `prudence` | Dites si la somme demandée d’avance est un acompte ou des arrhes : leurs effets ne sont pas les mêmes, et Opus ne choisit pas à votre place. |
| 8 | `devis_acompte_ramene` | `acompte_centimes` non vide et `acompte_ttc_centimes < acompte_centimes` | `prudence` | L’acompte en euros dépasse le total du devis : Opus l’a ramené. Corrigez-le pour que le devis dise ce que vous voulez. |
| 9 | `devis_reduction_ramenee` | `remise_centimes` non vide et `remise_ht_centimes < remise_centimes` | `prudence` | La réduction en euros dépasse le total des postes : Opus l’a ramenée. Corrigez-la pour que le devis dise ce que vous voulez. |

Un devis n'a qu'un régime : toutes ses lignes fautives portent la MÊME clé de rang 3.
Trois phrases dépassent 200 caractères (`devis_client`, `devis_lieu`, `devis_validite`) : l'écran
en montre la première phrase et « Lire la suite » (`premierePhrase`).

(« vide » = `null` ou une chaîne faite de blancs, selon la classe de blancs DÉJÀ utilisée par la section 49 ; le constructeur vérifie la forme exacte que 2a range — une chaîne vide n'y est peut-être jamais rangée.)
(**Précisé le 05/11, BASE-1** : « vide » veut dire vide AU SENS DE CETTE CLASSE de blancs (espace, tabulation, retours, U+00A0, U+200B-U+200D, U+2060, U+FEFF). Une espace idéographique U+3000 n'en fait pas partie : un délai fait de U+3000 est rangé tel quel et ne donne PAS `devis_delai` — un cas figé dans l'essai et dans `cas-remise.json`. La liste vérifie une PRÉSENCE, pas un sens.)
(Les conditions 8 et 9 sont à VÉRIFIER contre le calcul du lot 2a — `tient_le_devis()`, et `phraseDeRamenee` ou son équivalent dans `devis.js` — avant d'écrire : la règle est « la demande que la base a vue dépasse ce qu'elle a appliqué », exactement celle de l'écran « Ramenée à … ».)

### B.3 Les motifs de l'entreprise

Rang `100 + position` dans `emetteur_incomplet(pro_id)` (1 à 21), clé et phrase = les deux moitiés de
« cle: phrase » (coupure au PREMIER « : »). Nature : `regle_opus` pour `entreprise_ancienne`,
`conso_tva_intra`, `frais_deplacement` ; `prudence` pour `conso_profession_reglementee` et
**`regime_tva`** (depuis le 05/11, TXT-7) ; `loi` sinon — dont `registre` (R. 123-237, R. 111-2 3°)
et les 9 autres `conso_` (BASE-2 : la loi les demande pour un particulier ; l'écran les range par
prudence sous « Mentions dues à un particulier »). `ligne_id` vide.

`conso_tva_intra` reste `regle_opus` (réponse 2 du propriétaire) ; son étiquette dit MOINS que la loi
quand aucun numéro n'est écrit (R. 111-2 5°) — la coupure « numéro absent = loi / numéro refusé par
VIES = règle d'Opus » est à lui présenter, pas à faire seul (restes.md).

### B.4 Le miroir JavaScript (pur, `src/lib/devis.js`)

```js
motifsDeRemise({ devis, lignes, regime, motifsEmetteur })   // → [{ rang, cle, phrase, nature, ligneId }]
avisDuDevis({ devis, lignes, totaux })                       // → [{ cle, phrase }]  (jamais bloquants)
MOTIFS_DEVIS        // { cle: { rang, nature, phrase } } — les 10 clés du B.2, recopiées OCTET POUR OCTET
NATURE_DU_MOTIF_ENTREPRISE, ENDROIT_DU_MOTIF, PAS_ENCORE_VERIFIE, lireMotifsDeRemise()
```

`devis` et `lignes` sont dans la forme de l'application (camelCase, `rowToDevis` / `rowToLigne`).

### B.5 Les cas de parité — `supabase/cas-remise.json`

Engendré par `scripts/generer-cas-remise.mjs`, qui fait jouer **la vraie fonction** sur un PostgreSQL
local (schéma rejoué) pour chaque situation, et range pour chacune : l'entrée en forme d'application
(`devis`, `lignes`, `regime`, `motifsEmetteur` = la sortie de `emetteur_incomplet`) et la sortie
`attendu` (lignes de la fonction, `ligne_id` remplacé par l'indice de la ligne dans `lignes`).
`verifier-devis` fait tourner `motifsDeRemise` sur chaque entrée et exige zéro écart. À relancer et
commiter dès que la règle change (procédé de `cas-badge.json`, lot S-a).

### B.6 OP027

`erreurs.js` : « Ce devis n’existe pas, ou il n’est pas le vôtre. » ; `estUnRefusDefinitif` le connaît.

### B.7 Les avis (JS seulement)

| clé | quand | phrase |
|---|---|---|
| `avis_objet` | objet vide | Ce devis n’a pas de titre : le document dira seulement « Devis ». |
| `avis_gratuit` | au moins un poste et un total TTC de 0 (tout offert) | Ce devis ne coûte rien au client : vérifiez que c’est voulu. |

### B.8 Les phrases d'écran

- en tête de la carte, « Mentions dues à un particulier » : « Opus ne sait pas encore pour qui le client commande : dans le doute, il compte ce qu’on doit à un particulier. »
- `PAS_ENCORE_VERIFIE` (réécrite le 05/11 après la relecture de 2b-1, TXT-2 : elle ne nommait ni le RGE — que le §3.2 et l'annexe A promettaient de nommer — ni l'immeuble neuf, et « le prix du devis » se lisait comme le TOTAL, alors que la loi parle du caractère payant ou gratuit du devis) : « Pas encore vérifié : pour qui le client commande, le moment de la signature, l’urgence, la garantie décennale, si le devis lui-même est payant, les déchets de chantier, le label RGE pour des travaux d’énergie, et si les travaux concernent un immeuble neuf. »
- rien ne manque pour ce devis : « Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui. »
- brouillon pas en base : « Écrivez une première ligne : la liste se calculera ensuite. »
- brouillon pas en base, des lignes pas encore enregistrées (ECR-3) : « 1 ligne n’est pas encore enregistrée : la liste se calculera ensuite. » ; « N lignes ne sont pas encore enregistrées : la liste se calculera ensuite. »
- brouillon pas en base, un champ de l'en-tête refusé (ECR-3 ; `ENTETE_PAS_ENCORE_ENREGISTRE`) : « Un champ du devis n’est pas encore enregistré : la liste se calculera ensuite. »
- changements en route : « Des changements partent : la liste sera à jour juste après. »
- la partie qui se tait dans la carte (ECR-1) : `CE_DEVIS_SE_MET_A_JOUR` « Ce devis : la liste se met à jour. » ; `ENTREPRISE_SE_MET_A_JOUR` « Votre entreprise : la liste se met à jour. »
- le titre de la partie de l'entreprise (D-B) : « Votre entreprise — 5 points, dont 3 dus à un particulier » ; « 1 point, dont 1 dû » ; « 2 points, dont 1 dû »
- échec : « Liste non lue — Réessayer »
- étiquettes de nature : `loi` → « La loi » ; `prudence` → « Par prudence » ; `regle_opus` → « Règle d’Opus ».
- aide sous un taux de 10 % ou 5,5 % (réponse 3 ; `AIDE_TAUX_REDUIT`, réécrite le 05/11 après la relecture de 2b-1, TXT-3 : « le logement a plus de deux ans » taisait les deux autres conditions du taux réduit) : « À 10 % ou 5,5 %, le client devra certifier sur le devis que les conditions du taux réduit sont remplies : un logement achevé depuis plus de deux ans, des travaux qui ne créent pas un immeuble neuf et n’agrandissent pas la surface de plus de 10 % ; à 5,5 %, des travaux de rénovation énergétique. Opus imprimera la certification prévue par la loi, avec la place de signer. » — à faire relire par un juriste (`restes.md`).
