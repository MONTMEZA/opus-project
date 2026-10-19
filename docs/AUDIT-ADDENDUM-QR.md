# Audit de l'addendum « QR & Dossier Travaux Particulier » (v1.0, octobre 2026)

**Version finale**, 19/10/2026. Faite sur le dépôt au
commit `be4b530` (arbre propre), et sur la vraie base en **lecture seule** :
des `select` de comptage et de catalogue, jamais le contenu d'une fiche client.
**Aucun fichier du dépôt n'a été modifié, aucune ligne de code n'a été
écrite.** C'est ce que l'addendum demande en premier (§21, étape 1 ;
`addendum.txt:419`).

Cette version reprend la première (v1), puis **35 objections** d'une
contre-vérification. Chacune a été revérifiée à la source : relue dans le
dépôt, interrogée sur la vraie base, et pour quatre d'entre elles **rejouée**
sur un PostgreSQL 16.15 jetable (scripts dans `docs/audit-addendum/`, à jouer
chacun sur une base vide ; `figeage-parade.sql` se joue APRÈS
`figeage-set-null.sql`, dans la même base). Ce que
la contre-vérification a changé est résumé à la fin, dans un paragraphe à part.
Ce que je n'ai pas pu vérifier est marqué **non vérifié** et rassemblé en §6.

Comment lire les références : `addendum.txt:N` est le texte extrait du PDF,
rangé dans `docs/audit-addendum/addendum-extrait.txt` (le PDF fait foi) ;
`schema` est `supabase/schema.sql` ; `PLAN` est `docs/PLAN-DEVIS.md` ;
`VISITE` est `docs/CAHIER-DES-CHARGES-VISITE.md` ; `CDC` est
`docs/CAHIER-DES-CHARGES.md` ; les autres chemins partent de la racine du
dépôt. « vraie base » veut dire : relevé sur la base Supabase du projet le
19/10/2026.

### Quelques mots qui reviennent, traduits une fois pour toutes

| mot | ce que ça veut dire ici |
|---|---|
| **table, ligne, colonne** | la base ressemble à un classeur : une table est une feuille, une ligne est une fiche, une colonne est une case de cette fiche |
| **règle RLS** (ou « politique ») | la règle de la base qui décide **quelle ligne** chacun peut lire ou écrire. Elle sait cacher une ligne entière (un brouillon, par exemple), pas **une case** d'une ligne |
| **clé étrangère** | une case qui pointe vers une ligne d'une autre table (« ce devis concerne la fiche client n° … ») |
| **« on delete set null »** | quand la ligne pointée est supprimée, la base vide toute seule la case qui la pointait |
| **déclencheur** | un petit programme de la base qui tourne tout seul à chaque écriture |
| **le figeage** | au lot 2 du devis, une fois un devis remis, la base remettra toute modification à l'ancienne valeur, pour qu'un devis parti ne se réécrive plus |
| **espace de stockage** | un « dossier » de fichiers dans Supabase (photos, PDF) avec ses propres règles d'accès |
| **module natif** | un morceau de l'application écrit pour le téléphone lui-même (la caméra, par exemple). En ajouter un oblige à **reconstruire et réinstaller** l'application |
| **jeton** | une suite de caractères tirée au hasard, qui ne veut rien dire en elle-même et qu'on peut annuler |

---

## 0. En une page — les quatre réponses

### (1) Qu'est-ce qui est DÉJÀ compatible ?

**Le principe central de l'addendum est déjà celui d'Opus.** « Le QR crée une
fiche client, pas un devis ; le devis ne dépend ni du QR, ni d'un dossier, ni
d'une visite » (`addendum.txt:57-59`, `272-275`, `355-359`). Aujourd'hui, un
client s'ajoute au carnet à la main ou depuis une demande acceptée, sans QR.
Le plan devis **prévoit** de garder cette indépendance par un contrôle
(`PLAN:1460-1468`) ; ce contrôle n'existe pas encore, et sa règle doit être
complétée (§2, D4). Le carnet de clients est déjà la « fiche client
indépendante d'un projet » de l'addendum §5 (`schema:7817-7863`). Le devis
prévu sera privé à l'entreprise, comme le carnet (`PLAN:719-724`). Et la fiche
client a été construite **sans** lien vers un compte, exprès, en attendant le
lot qui s'en servirait (`schema:7770-7786`) : ce lot, c'est le QR particulier.

**Rien de l'addendum lui-même n'existe encore** : ni QR, ni relation entre une
fiche du carnet et un compte, ni Dossier Travaux, ni rendez-vous, ni
invitation (vraie base : 40 tables, aucune dont le nom évoque un dossier, un
projet, une relation, un devis, une visite ou un QR). Des **liens entre un pro
et un compte** existent pourtant déjà ailleurs — conversations, demandes de
devis, de rappel, d'urgence (`schema:498-501`, `515-518`, `586-592`,
`854-857`) — et la future relation devra s'aligner sur eux. **Il n'y a rien à
refondre : tout s'ajoutera à côté.**

### (2) Que faut-il prévoir DÈS MAINTENANT dans le devis ?

**Aucune colonne nouvelle.** Ce qui coûterait cher à rattraper, ce sont des
**noms** et des **règles**, gratuits aujourd'hui et figés dès que la table
`devis` existera. Douze points (§2), dont les six qui comptent :

1. une règle complète d'indépendance : le devis n'exige **jamais** de lien
   vers une demande, une urgence, une visite, un dossier ou un QR — ni comme
   case obligatoire, ni par une contrainte, ni comme motif de refus de remise
   (D4, lot 1) ;
2. le client d'un devis est **une fiche du carnet**, jamais un compte ; le QR
   n'est jamais une « origine » de devis (D1, D3, lot 1) ;
3. **un piège mesuré** : supprimer une fiche client ou une demande laisserait
   un devis remis pointer vers une chose qui n'existe plus, sans erreur. La
   parade est éprouvée (D11, avant le lot 2) ;
4. un rattachement posé **après** la remise d'un devis ne doit pas être une
   case de la ligne `devis`, sinon le figeage l'annule en silence (D5, lot 2) ;
5. **un défaut existant du stockage** doit être corrigé avant que l'espace
   des PDF de devis n'existe (D7, avant le lot 2) ;
6. ce dont dépend un devis remis ou accepté (copie signée, plan) est
   **copié** dans l'espace du pro au moment où ça compte (D12, lots 2 et 4).

### (3) Qu'est-ce qui peut attendre ?

**Tout le reste**, dans l'ordre que l'addendum propose (§21) : la relation
fiche ↔ compte, le QR professionnel, le QR particulier, le Dossier Travaux,
le lien avec les demandes publiques, le partage avec plusieurs pros, puis
rendez-vous, visites et factures. Chaque étape dépend d'une décision à
prendre avec toi (§5), et plusieurs d'un préalable qui n'existe pas : la
caméra, un outil pour dessiner un QR, les notifications sur l'écran
verrouillé, la publication sur l'App Store, et les modules Agenda, Factures
et Visite. **Le module devis peut continuer sans en attendre aucune.**

### (4) Les risques et conflits

Par ordre d'urgence (détail en §4) :

- **deux défauts réels du stockage, aujourd'hui** : celui qui a envoyé un
  fichier peut le supprimer ou le remplacer, y compris une pièce jointe déjà
  reçue ou un Kbis déjà validé ; le futur espace des devis en hériterait ;
- **deux défauts réels des partenariats entre pros**, que l'audit v1
  proposait de recopier : les demandes en attente se lisent sans compte, et
  celui qui reçoit une demande peut en changer l'auteur (mesuré) ;
- **un lien pendant silencieux** sur un devis remis, mesuré (D11) ;
- **ce qui est déjà public** : le nom, la ville et le code postal de chaque
  compte, particuliers compris, se lisent sans compte ; les réponses aux
  demandes aussi ;
- **la confidentialité entre pros** : un dossier partagé pourrait montrer à un
  pro les prix ou le choix d'un concurrent, contre une promesse écrite des
  conditions d'utilisation (`src/data/legal.js:546-549`) ;
- **le RGPD** : Opus aurait plusieurs rôles sur la même personne, et le
  contrat de sous-traitance n'existe pas (`src/data/legal.js:185`) ;
- **l'usurpation et l'« oracle »** : avec un QR photographié, se présenter
  sous le nom d'un autre, ou confirmer à qui appartient un numéro ;
- **des mots déjà pris**, et deux orthographes de statut dans la base.

---

## 1. Ce qui est DÉJÀ compatible

Chaque ligne : ce que l'addendum demande, ce qui existe, et la preuve.

| # | ce que l'addendum demande | ce qui existe déjà | preuve |
|---|---|---|---|
| 1.1 | « Aucun de ces parcours ne doit être obligatoire pour les autres » ; « Un devis peut exister sans Dossier Travaux et sans Visite » (`addendum.txt:355-359`, `447`) | le plan devis **prévoit** un contrôle qui refuse toute case obligatoire de `devis` ou `devis_lignes` pointant autre chose que l'entreprise et le client. **Il n'existe pas encore** (aucun `verifier-devis` dans `package.json` ni dans `scripts/`), et sa règle est incomplète : voir D4 | `PLAN:1460-1468` ; `package.json:37-85` |
| 1.2 | « Aucun module critique ne doit dépendre du QR » (`addendum.txt:272-275`) | « il n'existe, dans tout le module, aucun écran où l'on scanne quelque chose pour arriver à un devis » | `PLAN:1470-1474` |
| 1.3 | « Le professionnel peut travailler avec un client sans QR » (`addendum.txt:438`) | le carnet se remplit à la main, et depuis une demande acceptée (« Ajouter à mes clients ») | `src/screens/DemandesRecuesScreen.js:457-463` ; `src/OpusApp.js:3259-3261` |
| 1.4 | La fiche client « indépendante d'un projet », un client « pas recréé à chaque nouveau projet » (`addendum.txt:117-118`, `180-182`) | `clients` ne porte **aucun** lien de projet ni de chantier ; une fiche **réutilisée** de devis en devis, **sans garantie d'unicité** (aucun index unique sur le nom, exprès : deux Martin existent pour de bon) | `schema:7817-7863`, `7865-7879` |
| 1.5 | L'adresse du chantier « distincte de l'adresse personnelle » (`addendum.txt:159`) | la fiche ne garde que l'adresse de **facturation** ; le lieu des travaux est tapé **sur le devis** | `schema:7788-7790` ; `PLAN:1106-1108` |
| 1.6 | « Chaque professionnel possède sa propre relation » ; « ne voit pas les devis d'un concurrent » (`addendum.txt:231-232`, `446`) | le carnet a **une seule** règle, « mon entreprise », et `anon` n'a aucun droit sur la table ; le devis suivra ce modèle | `schema:7922-7926`, `7948` ; `PLAN:719-724` ; vraie base : une seule politique sur `clients`, rôle `authenticated` |
| 1.7 | « La structure du devis doit être compatible avec un client » (`addendum.txt:350`) | le devis pointera la **fiche** du carnet, vide tant que c'est un brouillon, exigée à la remise, et **recopiera** le nom et l'adresse du client au moment de la remise | `PLAN:748-753`, `1096-1097`, `1120-1131`. Un piège reste à corriger : D11 |
| 1.8 | La relation Client ↔ Pro séparée de la fiche (cahier Visite §13 : `Client` et `ClientLink`, « origine manuelle/QR/demande ») | la fiche n'a **volontairement** aucun lien vers un compte : « ce lien naîtra avec le lot qui s'en sert » | `VISITE:216-217` ; `schema:7770-7786` |
| 1.9 | Ne pas ressaisir : données « copiées/référencées » (`addendum.txt:196-198`) | le plan devis ne fait que des **copies** : préremplissage par fonctions, « aucune jointure dans le gabarit », « copie, pas lien » | `PLAN:2001-2003`, `1061-1062`, `3100` |
| 1.10 | « Publier une demande » depuis un dossier (`addendum.txt:200-202`) | l'« annonce » de l'addendum existe déjà : c'est la table `demandes`, et le bouton porte **déjà** ce libellé | `src/screens/DemandesScreen.js:296` ; `schema:5767-5777` |
| 1.11 | « Le particulier choisit ce qui est publié » (`addendum.txt:211-212`) | une demande n'est lisible que des pros connectés et de son auteur ; plus aucune lecture sans compte | `schema:5767-5777` ; vraie base : la règle visiteur restante vaut `false` |
| 1.12 | Un QR « unique et permanent lié à son identité Opus » par compte pro (`addendum.txt:73`) | « un compte = une entreprise » ; l'appartenance passe par **une** fonction, `est_mon_entreprise()`, à réutiliser | `schema:6645-6656` |
| 1.13 | Une relation qui se **demande** puis s'**accepte** ou se **refuse** (`addendum.txt:108`, `322`) | **seulement l'idée** des états : `professional_partners` passe de `en_attente` à `accepte` / `refuse`. **Ses règles de lecture et d'écriture ne doivent PAS être recopiées** : elles ont deux défauts mesurés (§4, R28) | `schema:628-631`, `1176-1183` |
| 1.14 | « sans exposer leurs informations » ; respect du blocage | `est_masque()` coupe tout dans les deux sens ; à réutiliser sur la relation, le partage et les fichiers | `schema:1784-1798` |
| 1.15 | « Journaliser les événements sensibles » sans données inutiles (`addendum.txt:301-302`) | deux journaux existent, dont la **doctrine** se réutilise : personne n'y écrit à la main, et « ce qu'on n'écrit pas ne peut pas fuir » | `schema:4414-4418`, `7229-7232` |
| 1.16 | « Opus identifie le particulier sans donner accès à son compte privé » (`addendum.txt:85`) | **en partie** : l'e-mail, le téléphone et la position GPS du compte sont fermés à tous. Mais le nom, la ville et le code postal sont lisibles par tous, même sans compte (voir R29) | `schema:2769` ; vraie base : droits de colonne relevés |
| 1.17 | Les lignes du devis reliables plus tard à une visite | chaque ligne aura son propre identifiant, « visable de l'extérieur » | `PLAN:1452-1458` |
| 1.18 | Un dossier ou une visite ne doit jamais devenir une **condition** de remise | ce qui bloque une remise sera **une liste** rendue par une seule fonction de la base. Cette forme rend l'ajout d'un motif facile ; **elle ne l'empêche pas** — d'où la règle (c) de D4 | `PLAN:3193-3195` |
| 1.19 | La base de prix de l'artisan ne doit rien savoir du client | la base de postes (lot P) ne contient « aucune donnée de client » | `PLAN:3130` |
| 1.20 | Retrouver une relation par des « identifiants internes fiables » (`addendum.txt:309-311`) | des **paires (pro, compte)** fiables existent déjà : une conversation par paire, et les demandes de devis, de rappel, d'urgence relient un compte à un pro | `schema:586-592`, `498-501`, `515-518`, `854-857` |
| 1.21 | Rendez-vous « créés depuis le particulier » (`addendum.txt:249-250`) | une demande de rappel porte déjà un **créneau** choisi par le particulier : c'est l'amorce d'un rendez-vous, à relier et non à doubler | `schema:520` |

*(La ligne v1 « 1.20 — tarifs visibles sur la page du QR pro » est retirée :
l'addendum ne parle pas de tarifs pour cette page, `addendum.txt:74-77`.)*

---

## 2. Ce qui doit être prévu DÈS MAINTENANT dans la partie devis

**La règle du projet, d'abord** : « aucune colonne sans lecteur, chaque chose
naît avec le lot qui s'en sert » (`schema:7770-7786` ; `PLAN:1446-1450`). Une
case `dossier_id` créée aujourd'hui n'aurait ni table vers laquelle pointer, ni
écran pour la remplir, ni écran pour la lire. **Donc on ne crée rien.** Ce
qu'on fait, c'est **garantir qu'aucune décision du devis ne ferme la porte**, et
ces décisions-là se prennent avant d'écrire la table.

Les lots du devis, pour mémoire : tarifs (en préparation) → **1** (le
chiffrage, la table `devis`) → **P** (la base de postes) → **2** (la remise et
le PDF, avec le figeage) → **3** (la TVA) → **4** (accepter, refuser, refaire)
→ **5** (les modèles) (`PLAN:3182`).

### D1 — Le client d'un devis est une FICHE du carnet, jamais un compte · lot 1

- **Pourquoi.** Dans Opus, `client_id` veut déjà dire « l'identifiant d'un
  **compte** » dans plusieurs tables, par exemple `quote_requests`
  (`schema:500`). Dans `devis`, il voudra dire « la fiche dans **mon**
  carnet ». Si le devis pointait le compte, le client sans compte deviendrait
  impossible ; or c'est aujourd'hui **1 client sur 1** (`PLAN:1379-1382` ;
  vraie base : 1 fiche).
- **À savoir.** Ce ne sera pas le seul pont entre un devis et un compte : le
  lien prévu vers une demande de devis (`PLAN:1427`) en fera un second, à
  travers le compte qui a fait la demande (`schema:500`). Et les paires
  (pro, compte) existent déjà ailleurs (1.20). La future relation devra
  **s'aligner** sur elles, pas les ignorer.
- **À faire.** L'écrire noir sur blanc dans le plan et dans le commentaire de
  la colonne (aujourd'hui, c'est implicite : `PLAN:1120-1123`).
- **À ne PAS faire.** Ajouter au devis une case `compte_id` ou
  `particulier_id` « pour plus tard ».

### D2 — Ne pas appeler `demande_id` le lien vers une demande de devis · lot 1

- **Pourquoi.** Le plan prévoit `devis.demande_id` → `quote_requests`
  (`PLAN:1427`). Or `demande_reponses.demande_id` pointe **une autre** table,
  `demandes` (`schema:729`), et `demandes` est précisément l'« annonce » de
  l'addendum, dont un dossier, puis un devis, pourront partir. Le même nom pour
  deux choses ne lève aucune alerte.
- **À faire.** Un nom sans ambiguïté — je propose `quote_request_id`, qui va
  avec le `sos_request_id` déjà décidé (`PLAN:3199`) — et corriger les deux
  passages du plan (`PLAN:1427` et la liste `PLAN:3288`).
- **À ne PAS faire.** Renommer la table `quote_requests` : le plan l'écarte
  déjà (`PLAN:2422`).

### D3 — Le QR n'est jamais une « origine » de devis · lots 1 et 2

- **Pourquoi.** L'addendum le répète trois fois : le scan crée une relation et
  une fiche, **jamais** un devis (`addendum.txt:57-59`, `89-90`, `434`). Le
  devis d'un client scanné hier est fait **depuis la fiche** : son origine est
  `'manuelle'`.
- **À faire.** Écrire dans le plan que `source` dit **le geste qui a ouvert le
  brouillon** (une seule valeur), et que les liens d'origine (vers une
  demande, une urgence, plus tard une visite ou un dossier) sont **facultatifs
  et indépendants**. `source` garde l'histoire du geste ; le lien, lui, peut
  devenir vide (sa cible peut être supprimée) ; **aucune contrainte ne les
  lie**.
- **À ne PAS faire.** Ajouter `'qr'` aux valeurs permises de `source`.
  Ajouter maintenant `'visite'` ou `'dossier'` (`PLAN:1435-1450`, `2415`).
  **Et poser une contrainte du type « origine = demande ⇒ lien présent »** :
  mesuré sur PostgreSQL 16.15 (`docs/audit-addendum/sens-unique.sql`), quand la demande
  est supprimée, la base vide le lien, la contrainte refuse, et **la
  suppression de la demande échoue**. Or la suppression de compte du
  particulier supprime ses demandes (`schema:2109`, `2111`) : le devis d'un pro
  bloquerait la sortie d'un particulier.

### D4 — Écrire au lot 1 une règle d'indépendance COMPLÈTE, et la contrôler · lot 1

- **Pourquoi.** Le plan formule la garantie de deux façons qui ne disent pas
  la même chose : « aucune colonne `not null` **qui référence** autre chose que
  `pro_id` et `client_id` » (`PLAN:1462-1464`), puis « aucune colonne `not
  null` autre que `pro_id` et `client_id` » (`PLAN:3199`). Les deux ont un
  trou, et la seconde est intenable :
  - le client n'est pas rendu obligatoire par un `not null` mais par une
    **contrainte nommée** à la remise (`PLAN:748-750`). Une contrainte du même
    type — « à la remise, il faut un dossier » — passerait donc la première
    formule sans rougir ;
  - prise à la lettre, la première refuserait aussi le lien d'une ligne vers
    **son** devis (une ligne appartient forcément à un devis, `PLAN:983-1003`) ;
  - la seconde refuserait `statut` ou `source`, qui ne sont jamais vides.
  - et la liste des motifs de refus « s'allonge sans changer de forme »
    (`PLAN:3193-3195`) : rien n'empêche d'y ajouter « pas de dossier ».
- **À faire.** Écrire au plan **une** règle en trois parties, et la livrer
  **avec** la table :
  - (a) aucune clé étrangère obligatoire, sauf vers l'entreprise, sauf le
    lien d'une ligne vers son devis, et sauf le client **à la remise** ;
  - (b) aucune contrainte ne rend obligatoire un lien d'origine (demande,
    urgence, visite, dossier, QR) ;
  - (c) aucun motif de refus de remise ne nomme une origine.
- **À ne PAS faire.** Un index unique sur (pro, client), sur (pro, demande) ou
  sur (pro, lieu) : un même client aura plusieurs projets, donc plusieurs
  devis (`addendum.txt:180-182`).

### D5 — Un rattachement posé APRÈS la remise ne vit pas dans la ligne `devis` · à écrire maintenant, s'applique au lot 2

- **Pourquoi.** Au lot 2, le figeage remettra **toute** case hors d'une liste
  blanche à son ancienne valeur, **sans erreur** (`PLAN:886-889`). C'est voulu.
  Mais une case ajoutée plus tard serait alors **gelée d'office** sur tous les
  devis déjà remis. Le projet a déjà payé ce défaut : ranger une publication
  déjà en ligne dans un chantier « répondait 204 et ne changeait RIEN »
  (`schema:3164-3183`), parce que le même motif protège d'office toute colonne
  nouvelle (`schema:3143-3149`). Et l'addendum dit qu'un dossier se partage
  « au moment du scan ou plus tard » (`addendum.txt:65-67`).
- **À faire.** Écrire dans le plan : un lien d'**origine** (posé pendant le
  brouillon) peut être une case facultative du devis ; un lien posé **après**
  la remise vit **sur l'autre objet** ou dans une **table de liaison** — ou, si
  l'on choisit la case, elle entre **exprès** dans la liste blanche, avec un
  déclencheur qui vérifie qu'on ne rattache que ce qui nous appartient (modèle
  `OP002`, `schema:3177-3178`). **Et aucune règle d'accès ne découle d'un lien
  posé sur un devis** : sinon un lien figé rendrait une révocation sans effet.
- **À ne PAS faire.** Ajouter une case à `devis` après le lot 2 sans relire
  cette règle ; l'éprouver sans jeton (`schema:3171-3173`).

### D6 — Le particulier ne lira JAMAIS la ligne `devis` · décision de forme, lots 1 à 4

- **Pourquoi, en trois raisons.**
  1. **Une règle RLS cache des lignes, pas des cases** (`schema:2725`). Elle
     saurait cacher les brouillons (le projet filtre déjà sur un statut,
     `schema:1169-1172`), mais elle ouvrirait **toutes les cases de travail**
     du devis remis : son origine, le lien vers la demande, et tout ce que le
     pro y range pour lui (`PLAN:1432-1433`).
  2. **À la suppression du compte du pro, Opus efface tout** — devis, lignes,
     PDF (`PLAN:2966`). Un Dossier Travaux qui ne ferait que **pointer** le
     devis le perdrait ce jour-là, alors que l'addendum veut que le dossier
     « conserve l'historique global » (`addendum.txt:177`).
  3. **Les conditions d'utilisation promettent** que les prix d'un artisan ne
     sont montrés « à personne d'autre que vous par aucun écran d'Opus : ni à
     un autre artisan… Seuls les devis que vous adressez vous-même à un client
     les portent, pour ce client » (`src/data/legal.js:546-549`).
- **L'arbitrage à nommer.** L'addendum demande les « devis reçus et statut de
  chacun » et le « devis accepté » (`addendum.txt:165-166`). Une simple copie
  du PDF ne suit ni l'acceptation, ni le refus, ni l'expiration, ni la
  version 2 (`PLAN:1042-1045`). Il faudra donc **deux** choses :
  - **le document** : une copie du PDF remis, posée par un geste du pro ;
  - **le statut** : une fonction de la base qui rend au particulier quelques
    cases choisies (numéro, date, statut, entreprise), sur le modèle de
    `mes_demandes_recues()` (`schema:4189`), sans ouvrir la ligne. Jamais une
    seconde écriture du statut côté dossier (R26).
  - **La conservation de la copie chez le particulier reste suspendue à
    l'avis juridique** (V10) : le plan rappelle qu'une copie gardée par Opus
    après la fin du contrat avec l'artisan est un manquement sanctionné
    (`PLAN:2966`). Savoir si la copie remise au particulier relève de ce cas
    ou d'un autre rôle d'Opus est précisément la question à poser.
- **À faire.** Écrire dans le plan : « aucune règle sur `devis`,
  `devis_lignes`, `devis_tva` ni sur l'espace `devis` ne passe par une
  relation ou un partage ».
- **À ne PAS faire.** Promettre « vos devis sont conservés » sur la foi d'une
  simple référence.

### D7 — Corriger un défaut EXISTANT du stockage avant de créer l'espace `devis` · avant le lot 2

- **Le défaut.** Deux règles générales, « remplacement de mes fichiers » et
  « suppression de mes fichiers », n'ont **aucun filtre d'espace**
  (`schema:1343-1350`), relu identique sur la vraie base. Elles s'appliquent
  donc à **tous** les espaces :
  - aux **pièces jointes**, que la section 28 déclare non retirables (« Une
    pièce envoyée ne se retire pas », `schema:5455-5460`) ;
  - au **Kbis et à l'attestation** dans `documents`, rangés à un chemin que le
    pro connaît (`src/lib/storage.js:92` ; `src/OpusApp.js:2529-2532`) : une
    pièce déjà validée par l'administration peut être remplacée sous le même
    nom, sans trace.
  L'application envoie en mode « remplacer s'il existe »
  (`src/lib/storage.js:126`, `188`).
- **Pourquoi le devis est concerné.** Le plan prévoit un espace privé `devis`
  « sans politique `update` ni `delete` » (`PLAN:1400-1406`). **Tel quel, il
  hériterait des deux règles générales** : un pro pourrait remplacer un devis
  remis, et rien ne le dirait.
- **À faire (à valider, §5).** Un petit lot à part, qui décide **espace par
  espace**. Tous les chemins portent un horodatage (`src/lib/storage.js:92`) :
  le remplacement n'a peut-être d'usage légitime nulle part. **Mesurer
  d'abord**, avec le mode « remplacer s'il existe », ce que deviennent les
  envois une fois la règle restreinte. Puis un contrôle : aucune règle ne
  permet de modifier ou supprimer un fichier de l'espace `devis`.
- **À ne PAS faire.** Le corriger « au passage » dans le lot 2 : il touche la
  messagerie et les pièces justificatives, qui marchent aujourd'hui.
- **Non vérifié** : aucune suppression réelle n'a été éprouvée (écriture
  interdite sur la vraie base) ; la conclusion vient des règles, qui
  s'additionnent.

### D8 — Le PDF, la copie signée, et plus tard les documents d'un dossier ne vont JAMAIS dans `documents` · lots 2 et 4

- **Pourquoi.** L'administration lit **tout** l'espace `documents`
  (`schema:4526-4529`), pour contrôler les Kbis. Or le plan dit de ranger la
  copie signée renvoyée par le client « dans un espace privé, **comme**
  `documents` » (`PLAN:3394-3396`). Si « comme » devenait « dans »,
  l'administration lirait des prix et l'identité des clients, contre les
  conditions (`src/data/legal.js:546-549`).
- **À faire.** Remplacer dans le plan « comme `documents` » par « dans
  l'espace `devis` ». Et tout nouvel espace (devis, dossier) entre dans la
  liste du ménage de compte, écrite en dur (`supabase/functions/compte/index.ts:46`).

### D9 — Les mots du statut : `accepte` n'est pas « retenu », `remis` n'est pas « reçu » · lot 4

- **Pourquoi.** Le plan impose `accepte` / `refuse` (`PLAN:1513-1516`) et dit
  que `remis` signifie « PDF produit et archivé, **jamais** envoyé au client »
  (`PLAN:3023`). L'addendum propose « devis_reçu » et « retenu »
  (`addendum.txt:330`). « Retenu » est une **décision du particulier**, qui
  peut exister sans devis signé ; `accepte` est un fait **juridique** tracé par
  le pro.
- **À faire.** Une phrase dans le plan : aucune valeur du dossier n'entre dans
  le statut du devis ; et l'écran d'un particulier ne traduira jamais `remis`
  par « reçu » tant qu'Opus ne livre pas lui-même le document.

### D10 — « Refaire » recopie les liens d'origine · lot 4

- Corriger un devis remis crée un **nouveau** devis (`PLAN:1042-1045`). Le
  plan ne dit pas que la version 2 garde son lien vers la demande ou
  l'urgence d'origine. **À faire** : une phrase au lot 4.

### D11 — Sur un devis remis, une clé « on delete set null » ne peut aller QUE vers vide · avant le lot 1 (écrire), lot 2 (construire)

- **Le piège, mesuré.** Le plan pose trois clés de ce type sur le devis : le
  client (`PLAN:1124-1128`), la demande (`PLAN:1427-1428`) et l'urgence
  (`PLAN:3199`). Quand leur cible est supprimée, PostgreSQL vide la case **par
  une modification de la ligne `devis`**, et cette modification passe dans le
  figeage, qui la remet à l'ancienne valeur. Rejoué sur PostgreSQL 16.15 avec
  la forme du plan recopiée telle quelle (`docs/audit-addendum/figeage-set-null.sql`) :
  - on supprime la fiche client d'un devis **remis** — un droit garanti
    (`src/components/FicheClient.js:410-420`) : `DELETE 1`, mais le devis
    garde l'ancienne fiche, **qui n'existe plus** ;
  - on supprime la demande, comme le fait la suppression de compte du
    particulier (`schema:2109`) : le devis garde une demande **qui n'existe
    plus** ;
  - **aucune erreur** dans les deux cas ; le brouillon témoin, lui, se vide
    normalement ;
  - et une sauvegarde puis restauration de la base **échoue** : « violates
    foreign key constraint devis_client_id_fkey » (idem pour la demande).
- **L'addendum rend ce cas fréquent** : relier ou fusionner des fiches en
  double (`addendum.txt:87-88`, `309-311`) touche des devis déjà remis.
- **La parade, éprouvée** (`docs/audit-addendum/figeage-parade.sql`) : dans le
  figeage, on retire de la garde chaque clé dont la nouvelle valeur est vide.
  Après suppression de la fiche et de la demande, le devis remis passe à
  vide, total intact (500) ; une tentative de le **rediriger** vers une autre
  fiche est ignorée. Conséquence à savoir : le pro peut aussi vider ce lien à
  la main ; le document n'y perd rien, puisque le nom et l'adresse du client
  sont recopiés à la remise (`PLAN:1096-1097`).
- **À faire.** Écrire cette règle au plan (§3.3), et un essai qui **compte
  les clés pendantes** après suppression de la fiche, de la demande, et du
  compte du particulier (méthode du plan : compter, pas guetter une erreur,
  `PLAN:898-907`).
- **À décider (V15).** Faut-il un jour **repointer** un devis remis vers une
  autre fiche du même pro (fusion de doublons) ? La parade l'interdit ;
  l'ouvrir serait un choix explicite, plus tard, avec son essai.

### D12 — Ce dont dépend un devis remis ou accepté est COPIÉ dans l'espace du pro · lots 2 et 4

- **Pourquoi.** La suppression de compte du particulier supprime ses
  conversations entières (`schema:2121-2124`) et la fonction de ménage efface
  ses fichiers (`supabase/functions/compte/index.ts:46`). Si la copie signée
  arrivait par la messagerie d'Opus et n'était pas encore rangée, elle
  disparaîtrait avec le compte du client. Le plan dit qu'elle arrivera
  « presque toujours » par courriel (`PLAN:3393-3397`), donc ce cas reste
  l'exception — mais un plan partagé dans un dossier, sur lequel s'appuie un
  devis remis, serait dans le même cas. Et l'addendum réserve la révocation
  « sous réserve des documents qui doivent légalement rester conservés »
  (`addendum.txt:224-225`, `299-300`), sans dire lesquels ni comment.
- **À faire.** Étendre la règle du plan « l'instantané copie ce qui vient
  d'AILLEURS » (`PLAN:1106-1108`) aux pièces : tout document dont dépend un
  devis remis ou une acceptation est **copié** dans l'espace du pro au moment
  de la remise ou de l'acceptation. C'est aussi la réponse à la révocation :
  ce qui doit rester, reste **parce qu'il a été copié**, pas parce qu'un
  accès survit.

### Lots qui n'ont RIEN à changer

| lot | pourquoi |
|---|---|
| tarifs | rien à changer : l'addendum n'en parle pas. L'affichage public des tarifs reste un lot conditionnel qui attend ta décision (`PLAN:2417`), et les conditions promettent aujourd'hui l'inverse (`src/data/legal.js:546-549`) |
| P | la base de postes ne connaît aucun client (`PLAN:3130`) |
| 3 | la TVA ne touche ni la relation ni le dossier |
| 5 | les modèles habillent un contenu figé ; ils n'ont rien à savoir de l'origine du devis |

---

## 3. Ce qui peut attendre — dans l'ordre que l'addendum propose (§21)

L'addendum donne l'ordre (`addendum.txt:418-430`). Pour chaque étape : ce qui
se réutilise, et **ce dont elle dépend**. Une règle vaut pour **toutes** les
étapes qui créent une table : sa ligne entre dans l'export RGPD
(`mes_donnees()`) **dans la même migration** (« la MIGRATION doit emporter la
fonction », `CLAUDE.md:6020`).

| étape §21 | ce que c'est | ce qui se réutilise | elle dépend de |
|---|---|---|---|
| **1. Audit** | ce document | — | — |
| **2. Plan sans code destructif** | un plan d'intégration étape par étape | — | **ta validation de §5** ; et, **avant l'étape 3**, un script qui rejoue tous les `supabase/essais-*.sql` sur une base neuve : aujourd'hui `npm run verifier` n'en joue aucun (`CLAUDE.md:706`), et la relation ajoutera des règles sur des tables en service |
| **3. Relation Client ↔ Pro, doublons** | une table de **relation** entre une fiche du carnet et un compte, demandée puis acceptée ou refusée | la fiche (`clients`) ; **l'idée** des états de `professional_partners` (`schema:628-631`), **pas ses règles** (R28) ; le blocage (`schema:1784-1798`) ; la fonction qui rend des cases choisies (`schema:4189`) ; les paires (pro, compte) existantes pour retrouver un doublon (1.20) | le **nom** et **une seule orthographe** des états (V4) ; l'acceptation **par une fonction** qui ne change que l'état et la date, sans règle de modification générale ; la création d'une demande **réservée aux pros** (`est_un_pro()`, `schema:1011-1019`) ; ce que devient la ligne quand le particulier part (V5) ; la règle « la relation seule ne rend jamais un avis vérifié » (V16) ; le **troisième journal** (V9) ; et, avant le premier usage réel, le **contrat de sous-traitance** (`src/data/legal.js:185`) |
| **4. Le devis référence un client, puis un projet** | §2 de ce document | le plan devis | **rien** : se fait pendant le lot 1 (et D11, D12 au lot 2) |
| **5. QR professionnel** | un QR qui ouvre la page pro | la page pro existe, avec « Demander un devis » (`src/screens/ProfilProScreen.js:183`) | **voir l'état exact ci-dessous.** Surtout : **la publication sur l'App Store** — les deux profils de construction sont en distribution interne (`eas.json:7-16`), et la fiche App Store est reportée au jour où `STATUT` quitte `'essai'` (`docs/A-FAIRE.md:1440-1442`). Un inconnu qui scanne n'a donc rien à installer. Et une demande de devis exige un compte (`schema:500`) |
| **6. QR particulier** | le pro scanne **depuis Opus**, le particulier accepte, la fiche est créée ou reliée | l'étape 3 entière | l'étape 3 ; un **jeton opaque, régénérable et révocable** (R9, V6) ; la caméra (`expo-camera`, absente de `package.json`, mais publiée en 57.0.x) → **reconstruction** ; un **texte de permission en français** (R37) ; **un outil pour dessiner le QR** chez le particulier (R39) ; et **les notifications sur l'écran verrouillé**, qui n'existent pas encore (R38, V15) |
| **7. Dossier Travaux** | l'espace privé du particulier, plusieurs par personne | le modèle « privé, aucune règle `anon` » du carnet (`schema:7922-7926`, `7948`) | son **nom** (V4) ; un **espace de stockage privé neuf**, sans lecture d'administration, ajouté au ménage de compte (`supabase/functions/compte/index.ts:46`) ; **aucune vidéo par Cloudinary** (R36) ; une taille et une durée maximales ; les notes personnelles dans **leur propre table** (`schema:2725`) |
| **8. Demande publique ↔ dossier** | passer de l'une à l'autre sans ressaisir | `demandes` et « Publier une demande » (`src/screens/DemandesScreen.js:296`) | l'étape 7 ; les photos d'une demande vont dans un espace **public** (`src/OpusApp.js:2645-2648`), donc publier depuis un dossier **copie** les photos choisies, jamais l'inverse |
| **9. Partage sélectif à plusieurs pros** | chaque pro voit ce qu'on lui a partagé, et rien des autres | `est_mon_entreprise()`, `est_masque()`, le motif des pièces jointes (`schema:5516-5537`) | l'étape 7 ; une table de partage avec des règles **par verbe** ; le troisième journal ; **une copie de devis ou de facture n'est jamais partageable** à un autre pro (R31) ; **la vue d'un pro est filtrée sur sa propre relation** (R31) ; la décision sur `demande_reponses` (R23, V11) |
| **10. Rendez-vous, visites, devis, factures, historique** | la chronologie du projet | l'historique se **compose** à partir des objets qui existent (le motif de `mes_demandes_recues`), il ne se recopie pas ; le **créneau** des demandes de rappel (`schema:520`) | l'**Agenda** et les **Factures** n'existent pas (CDC §11 et §10, `docs/CAHIER-DES-CHARGES.md:221`, `210` ; rangs 5 et 3 de `docs/A-FAIRE.md:1618-1620`). Le CDC §11 prévoit déjà des « créneaux proposés depuis le profil public » (`docs/CAHIER-DES-CHARGES.md:233`) : un seul modèle de rendez-vous. La **Visite** a son propre plan (`PLAN:2414`) ; le devis se transmet par **copie** et statut (D6) |
| **11. Tests** | permissions, révocation, doublons, mobile | le protocole du projet : règles éprouvées avec `set local role` hors d'un bloc `do`, essais qui prouvent d'abord que la donnée existe, comptes jetables supprimés | la caméra ne s'essaie **que sur l'iPhone** |

**Ce que cet ordre veut dire pour le devis** : l'étape 4 est la seule qui le
touche, et elle se fait **pendant** le lot 1 (plus D11 et D12 au lot 2). Les
étapes 3 à 11 peuvent toutes venir après le module devis.

### L'état exact du QR, de la caméra et des liens qui ouvrent l'application

- **Le dépôt n'a ni `ios/` ni `android/`** : les projets natifs sont fabriqués
  par EAS au moment de la construction.
- **iOS déclare déjà un schéma de lien** : le greffon par défaut `withScheme`
  (`node_modules/@expo/prebuild-config/build/plugins/withDefaultPlugins.js:126`)
  ajoute toujours l'identifiant de l'application comme schéma
  (`node_modules/@expo/config-plugins/build/ios/Scheme.js:36-37`). Les builds
  iOS répondent donc à `com.opusproject.app://` — **non vérifié sur le binaire
  installé**. Android, sans `scheme` dans `app.json`, n'a rien
  (`node_modules/@expo/config-plugins/build/android/Scheme.js:42`).
- **Lire un lien entrant se fait en JavaScript** (`Linking`) ; aucun code ne le
  fait aujourd'hui (seuls des `Linking.openURL` sortants existent).
- **Le QR particulier n'a pas besoin de lien qui ouvre l'application** : le pro
  le scanne **depuis Opus** ; le QR ne porte qu'un jeton.
- **Le QR pro, lui, est scanné par l'appareil photo d'un inconnu** : un schéma
  propre n'ouvre rien si Opus n'est pas installé. Il faut une **adresse web**.
  Opus tourne au navigateur (`package.json:35`), et l'origine
  `https://opus-project.com` est déjà autorisée par la fonction `siret`
  (`src/lib/siret.js:1007-1010`). Mais **aucune page n'a d'adresse propre**
  aujourd'hui, et je n'ai pas pu vérifier ce que sert ce domaine (**non
  vérifié**).
- **Il n'y a aucun mode visiteur dans l'application** : sans compte, on ne voit
  que le choix du profil et l'écran de connexion (`src/OpusApp.js:3391-3400`),
  alors que la base laisse lire les publications sans compte
  (`schema:1954-1955`). Une personne venue par le QR pro devra s'inscrire avant
  de voir la page — ou il faudra un mode visiteur, ce qui est un lot en soi.
- **La caméra** : `expo-camera` est publié en 57.0.0 à 57.0.6 (relevé npm), et
  comme `expo-image-picker`, il fait partie des greffons appliqués d'office
  (`withDefaultPlugins.js:185`). L'ajouter impose une reconstruction ; l'ordre
  du projet reste : installer, construire, réinstaller, **puis** committer le
  code qui l'importe.

### Les 15 critères d'acceptation du §22, un par un

| critère (`addendum.txt:434-448`) | où il en est | ce qui le tiendra |
|---|---|---|
| Scanner ne crée jamais un devis ou une visite | rien n'existe | D3 ; la fonction de scan ne crée qu'une demande de relation |
| Le scan crée ou retrouve une fiche sans doublon | rien n'existe ; aucune unicité de fiche | unicité sur (pro, compte) **dans la relation**, jamais par comparaison avec des cases fermées (R33) |
| Le particulier voit quelle entreprise demande, et peut refuser | rien n'existe | V6 : nom affiché sans le mot « vérifié » (R34) ; refus = un état |
| Aucune donnée privée non autorisée n'est transmise | e-mail, téléphone, position fermés ; nom, ville, code postal publics (R29) | copie de ce que le particulier coche, par une fonction (R8) ; décision V14 |
| Le pro peut travailler sans QR | **déjà vrai** (1.3) | ne rien retirer |
| Plusieurs Dossiers par particulier | rien n'existe | étape 7 |
| Dossier privé par défaut | rien n'existe | modèle du carnet ; aucune règle `anon` ; espace de stockage privé |
| Annonce et Dossier restent distincts | `demandes` existe | étape 8, deux tables |
| Une annonce alimente un Dossier sans ressaisie | rien n'existe | copie à la création (étape 8) |
| Un Dossier génère une annonce | rien n'existe | copie des seuls éléments choisis ; photos copiées vers l'espace public |
| Partage avec plusieurs pros | rien n'existe | étape 9 |
| Permissions isolées par pro | modèle « mon entreprise » | vue filtrée sur sa propre relation (R31) |
| Devis concurrents invisibles | devis prévu privé (`PLAN:719-724`) | D6 ; aucune copie de devis partageable (R31) |
| Un devis existe sans Dossier ni Visite | **prévu** au plan, contrôle à écrire | D4 |
| Les fonctionnalités existantes continuent de fonctionner | **le plus exposé** : de nouvelles règles sur des tables en service | le script qui rejoue tous les essais SQL, **avant** l'étape 3 (étape 2 ci-dessus) |

---

## 4. Les risques et conflits avec l'architecture actuelle

Gravité : **haute** = un défaut réel ou une donnée exposée si l'on se trompe ;
**moyenne** = un défaut silencieux ou un coût de reprise ; **basse** = à
surveiller.

### 4.1 Défauts qui existent AUJOURD'HUI (hors addendum, mais il les touche)

| # | risque | gravité | preuve | parade proposée |
|---|---|---|---|---|
| R1 | **Stockage : un fichier envoyé peut être supprimé ou remplacé par son expéditeur** — pièce jointe déjà reçue, Kbis ou attestation déjà validés ; le futur espace `devis` hériterait du même droit | **haute** | `schema:1343-1350` (aucun filtre d'espace), relu sur la vraie base ; contredit `schema:5455-5460` et `PLAN:1400-1406` ; envois en « remplacer s'il existe » `src/lib/storage.js:126`, `188` ; chemins connus `src/lib/storage.js:92`, `src/OpusApp.js:2529-2532` | D7, espace par espace, après mesure. **Non éprouvé par une écriture** |
| R28 | **Partenariats entre pros, deux défauts.** (a) La règle d'origine « lecture partenaires » `using (true)` n'a jamais été retirée : elle coexiste avec la règle qui voulait réserver une demande en cours « aux deux intéressés ». (b) Celui qui reçoit une demande peut, en l'acceptant, **changer son auteur** : la règle de réponse ne limite aucune case, et aucun déclencheur ne protège la table | **haute** pour (b), moyenne pour (a) | (a) `schema:1069-1070`, `1165-1172` ; vraie base : les deux règles présentes ; sous le rôle `anon` : 2 demandes en attente et 5 acceptées lisibles. (b) `schema:1182-1183` ; vraie base : `authenticated` peut modifier les 5 cases, seul déclencheur `trg_notifie_partenariat` ; rejoué sur une réplique exacte des règles (`docs/audit-addendum/partenariat-motif.sql`) : A demande à B, B écrit « auteur = C, accepté » → `UPDATE 1`, un partenariat C↔B que C n'a jamais demandé | **ne pas recopier ces règles** pour la relation client (étape 3). Corriger les partenariats dans un lot séparé et mesuré (V13) |
| R29 | **Le nom, la ville et le code postal de chaque compte se lisent sans compte**, particuliers compris. Seuls e-mail, téléphone et position sont fermés | moyenne, **décision** | `schema:2769` ; vraie base : `anon` et `authenticated` lisent `id, nom, type, ville, code_postal, avatar_url, avatar_seed, cgu_version, cgu_acceptees_le, created_at` ; sous `anon` : 6 particuliers listables, 3 avec leur ville, 2 avec leur code postal | un écran de consentement ne peut pas présenter comme un choix de « partager » ce qui est déjà public (`addendum.txt:86`, `297`). Un jeton opaque n'empêche pas de lister tous les particuliers. À décider avant l'écran de consentement (V14) |
| R23 | **`demande_reponses` est lisible par tout le monde**, connecté ou non, concurrents compris, message compris | basse aujourd'hui, haute demain | `schema:1978-1983` (deux règles : tout connecté sauf blocage, et tout visiteur) ; vraie base identique ; `authenticated` peut lire la case `message`, que l'application remplit (`src/lib/api.js:2478-2484`) ; aujourd'hui 1 réponse, 0 message | V11 : seuls l'auteur de la demande et le pro qui a répondu lisent la ligne ; les autres au mieux un compteur |

### 4.2 Risques pour le devis

| # | risque | gravité | preuve | parade |
|---|---|---|---|---|
| R30 | **Lien pendant silencieux** : supprimer une fiche client ou une demande laisse un devis remis pointer vers rien ; une restauration de sauvegarde échoue | haute, invisible | mesuré, `docs/audit-addendum/figeage-set-null.sql` ; forme `PLAN:886-889` ; clés `PLAN:1124-1128`, `1427-1428`, `3199` | D11, parade éprouvée |
| R2 | **L'administration lit tout `documents`** : y ranger une copie signée exposerait prix et clients | haute | `schema:4526-4529` ; `PLAN:3394-3396` | D8 |
| R3 | **Gel silencieux** d'un lien ajouté au devis après la remise | haute, invisible | `PLAN:886-889` ; précédent `schema:3164-3183` | D5 |
| R4 | **Le particulier lit la ligne `devis`** par une règle « relation » : cases de travail, prix montrés hors de la promesse | haute | `schema:2725` ; `src/data/legal.js:546-549` | D6 : un document plus une fonction de statut |
| R42 | **Une pièce dont dépend un devis disparaît avec le compte du client** (copie signée reçue par la messagerie, plan d'un dossier) | moyenne | `schema:2121-2124` ; `supabase/functions/compte/index.ts:46` ; `PLAN:3393-3397` | D12 |
| R5 | **Le particulier perd ses devis** le jour où le pro supprime son compte, si le dossier ne fait que les pointer | moyenne | `PLAN:2966` ; `addendum.txt:177`, `242-244` | copie (D6) ; son statut juridique **à faire trancher** (V10) |

### 4.3 Risques de la relation, du QR et du partage

| # | risque | gravité | preuve | parade |
|---|---|---|---|---|
| R31 | **Un dossier montre à un pro ce qui concerne un concurrent** : une copie de devis partagée afficherait les prix de A à B ; la liste des pros liés, les devis reçus et leurs statuts, le pro « retenu » et l'historique global renseignent sur la concurrence | haute | `src/data/legal.js:546-549` ; `addendum.txt:163`, `165-166`, `170`, `228-231`, `235-236`, `330` | une copie de devis ou de facture n'entre dans **aucune** catégorie partageable (sauf si tu décides de changer la phrase des conditions) ; la vue d'un pro est filtrée sur **sa** relation : ni les autres pros, ni leurs états, ni l'historique global |
| R6 | **Une règle RLS ne cache pas une case** : notes privées, adresse du chantier, notes du pro partiraient avec la ligne partagée | haute si l'on se trompe de forme | `schema:2725`, `7828` | un niveau de droit = une table ; la fiche du pro ne s'ouvre **jamais** au particulier |
| R7 | **Droits par relation, dossier, document** : la base ne sait dire aujourd'hui que « mon entreprise » ou « ma conversation » | moyenne | `schema:7922-7926` ; `schema:5516-5537` | l'autorisation vient d'une **ligne** (partage actif, catégorie, pas de blocage) ; la fonction qui la calcule reste exécutable par `authenticated` |
| R8 | **Le QR rouvre l'e-mail et le téléphone du compte** par une autre porte | haute si lus en direct | `schema:2767-2789` | la mise en relation **copie** dans la fiche du pro ce que le particulier **voit et coche**, par une fonction de la base |
| R9 | **Le QR porte l'identifiant du compte** : cet identifiant est public, et n'importe quel connecté peut ouvrir une conversation avec un identifiant connu | haute | `schema:2005-2010` | un **jeton opaque**, révocable, résolu par la base ; la relation n'existe qu'**après** l'accord (le cahier Visite admet un « identifiant/token sécurisé », `VISITE:208` ; l'exigence d'opacité et de révocation vient de cet audit) |
| R10 | **QR « permanent »** (`addendum.txt:81`) contre « expiration/rotation si nécessaire » (`VISITE:208`) : un QR photographié permet des demandes non sollicitées | moyenne | les deux textes | permanent pour celui qui l'affiche, **régénérable** par lui ; une limite par compte |
| R32 | **Qui peut scanner ?** Sans règle, un particulier — et demain un négoce — enverrait des demandes de relation à quiconque a photographié son QR | moyenne | `est_un_pro()` `schema:1011-1019` ; le futur compte fournisseur ne doit jamais le rendre vrai (`CLAUDE.md:606`) ; les signalements visent publication, commentaire, message, profil, demande, annonce, **pas une demande de relation** (`schema:1828-1829`) | créer une demande de relation exige `est_un_pro()` ; prévoir comment signaler un harcèlement par demandes répétées (aujourd'hui on peut signaler le **profil**, pas la demande) |
| R33 | **La recherche de doublon devient un « oracle »** : si, avant l'accord, la fonction comparait le carnet du pro avec l'e-mail ou le téléphone du compte (cases fermées), un pro muni d'un QR volé confirmerait à qui appartient un numéro | haute | `addendum.txt:106-108`, `309-311` ; `schema:2767-2789` | avant l'accord, la fonction ne rend **rien** sur la personne ; après, l'unicité porte sur le couple (pro, compte) ; jamais de comparaison avec une case fermée |
| R34 | **Usurpation d'identité** : l'écran de consentement afficherait le nom public de la fiche, qui vient d'un champ libre ; un pro pourrait se présenter sous le nom d'un concurrent | moyenne | `PLAN:2777` ; `entreprise_registre` est privée (`CLAUDE.md:743-744`) | montrer la dénomination du répertoire Sirene par une fonction qui ne rend qu'elle et la commune, ou écrire « nom déclaré par le professionnel » ; **jamais** « vérifié » |
| R35 | **Avis « client vérifié »** : aujourd'hui seule une demande de devis, de rappel ou d'urgence **acceptée** le rend vérifié. Si une simple relation suffisait, un pro fabriquerait des avis « vérifiés » avec les QR de ses proches | moyenne | `schema:544-575` ; vraie base : 4 avis, dont 3 vérifiés | la relation seule ne rend **jamais** un avis vérifié ; un devis accepté (lot 4) pourrait le faire, par une décision explicite (V16) |
| R11 | **RGPD : plusieurs rôles d'Opus sur la même personne.** Responsable du compte et du Dossier du particulier ; **sous-traitant** du carnet du pro ; intermédiaire de la transmission. Le contrat de sous-traitance n'existe pas | haute avant le premier vrai partage | `src/data/legal.js:185` ; `PLAN:3337-3338`, `3415-3419` | relecture par un juriste (V10) ; consentement daté **par la base** avec la version du texte affiché |
| R12 | **Deux phrases des textes légaux deviendraient fausses** : « effacées immédiatement, à trois exceptions près », et la liste des destinataires | haute avant ouverture | `src/data/legal.js:826-829` ; `src/data/legal.js:798-806` | réécrire **avec** le lot de la relation |
| R16 | **Un mauvais rattachement** (homonyme) exposerait les données d'une autre personne si quoi que ce soit était visible « par le lien » | haute si la visibilité dérive du lien | `schema:7865-7879` | rien n'est visible « parce qu'une fiche est reliée » ; tout se **remet** document par document |
| R15 | **Doublons de fiches** : aucune unicité de fiche (un nom seul, et « trois Martin dans le même village ») ; « Ajouter à mes clients » ne garde pas le compte d'origine | moyenne | `schema:7865-7879` ; `src/lib/clients.js:214-226` | s'appuyer sur les paires (pro, compte) existantes (1.20) ; rattacher une fiche manuelle à un compte reste un **choix du pro**, après l'accord (R33) |
| R20 | **Une révocation n'est pas instantanée** : le lien d'un document déjà donné reste valable 5 min à 1 h (`src/lib/api.js:3327`, `3571`, `3583`), mais **celui d'un devis restera valable des mois** (validité + 30 jours, `PLAN:1388-1391`) ; et ce qui a été téléchargé ne se reprend pas | moyenne : se dit | références citées | l'écran de révocation le dit ; jamais « le pro n'y a plus accès » |
| R43 | **Révocation contre conservation légale** : l'addendum réserve « les documents qui doivent légalement rester conservés » sans dire lesquels | moyenne | `addendum.txt:224-225`, `299-300` | D12 : ce qui doit rester est **copié** au moment où il compte ; aucun accès ne découle d'un lien |
| R21 | **Journaliser la lecture d'un document** n'est pas faisable proprement : une lecture de fichier ne déclenche rien dans la base | moyenne | lecture par liens signés, `src/lib/api.js:3338` | journaliser création de relation, partage, révocation d'abord (V9) ; ne rien promettre sur la lecture |
| R24 | **Photos d'une demande dans un espace PUBLIC** : réutilisées dans un dossier privé, elles restent lisibles par qui a l'adresse | moyenne | `src/OpusApp.js:2645-2648` ; vraie base : `publications` public | copie explicite dans un sens comme dans l'autre |
| R36 | **Vidéos du Dossier** : le seul chemin vidéo d'Opus est Cloudinary, avec des adresses publiques, et le ménage de compte n'y supprime rien | moyenne | `src/lib/cloudinary.js:1-18` ; `src/lib/cloudinary-adresses.js:76` ; `supabase/functions/compte/index.ts:46` (espaces Supabase seuls ; aucune suppression Cloudinary dans `supabase/functions/`) ; vraie base : espaces privés plafonnés à 10 Mo (`pieces-jointes`) et 20 Mo (`documents`) | aucune vidéo de dossier par Cloudinary ; une taille et une durée maximales ; vérifier le quota avant de promettre « vidéos » |
| R25 | **Accepter un devis DANS Opus** changerait de régime juridique (vente à distance, place de marché) | haute si construit sans avis | `PLAN:2901` | « retenu » reste un marqueur du particulier ; l'acceptation reste tracée par le pro (lot 4) ; avis juridique avant toute acceptation dans l'application |

### 4.4 Risques d'interface, de téléphone et de vocabulaire

| # | risque | gravité | preuve | parade |
|---|---|---|---|---|
| R37 | **La permission caméra est en anglais et générique** : `expo-image-picker` n'est pas déclaré dans `app.json`, il est appliqué d'office avec son texte par défaut. iOS n'a qu'un texte pour la caméra, qui devra couvrir photo **et** scan ; le §19 interdit « les demandes de permissions ambiguës » | moyenne | `app.json:33-39` ; `withDefaultPlugins.js:185` ; `node_modules/expo-image-picker/plugin/build/withImagePicker.js:7`, `51` ; `addendum.txt:389` | écrire le texte en français (photo + scan) dans la reconstruction qui ajoutera la caméra (V12) |
| R38 | **Aucune notification n'arrive sur l'écran verrouillé.** Le parcours exige l'accord du particulier avant la fiche (`addendum.txt:107-110`), mais le pro doit « arriver rapidement sur la fiche » (`addendum.txt:391`) ; le temps réel ne marche que l'application ouverte | moyenne | `docs/A-FAIRE.md:1408-1415` ; `expo-notifications` installé (`package.json:25`) mais importé nulle part dans `src/` ; `src/lib/api.js:3141-3171` | trancher avant l'étape 6 (V15) ; faire passer les notifications push avant le QR particulier |
| R39 | **Dessiner un QR** : aucune dépendance directe ne sait le faire. Le seul encodeur présent, `toqr`, n'arrive que par l'outil de développement de l'ordinateur ; `react-native-svg` est absent | moyenne | `package.json:5-36` ; `package-lock.json:5746`, `5807` ; `verifier-imports` refuse un paquet non déclaré | choisir la dépendance avec le calendrier de V12, et vérifier si elle est native ; **jamais** un service web de génération d'image QR, qui recevrait le jeton |
| R40 | **Le QR pro ne mène à rien d'installable** pour un inconnu : distribution interne seulement, pas de fiche App Store, pas de mode visiteur | moyenne, **calendrier** | `eas.json:7-16` ; `docs/A-FAIRE.md:1440-1442` ; `src/OpusApp.js:3391-3400` | rattacher l'étape 5 à la publication et au statut légal (V18) |
| R13 | **Collisions de noms** : « annonce » = la Place des pros chez Opus, mais le besoin d'un particulier dans l'addendum (= `demandes`) ; « demande » = plusieurs tables ; « devis » = `quote_requests` à plusieurs endroits (`schema:6943-6944`, `10544-10545`) ; « chantier » = vitrine **publique** (`schema:6731-6733`) ; `client_id` = un compte ailleurs, une fiche dans `devis` ; **« Partager »** veut déjà dire « partager une publication » à l'écran (`src/components/PostCard.js:360-365`) | moyenne, silencieuse | références citées | D1, D2 ; V4 : un vocabulaire fixé **avant** la première table ; un autre libellé que « Partager » pour le dossier, ou le qualifier |
| R41 | **Deux orthographes de statut dans la base** : `accepte` / `refuse` (`schema:507`, `523`, `630`) et `acceptee` / `refusee` (`schema:254`, `869`, `8732`), au point que la règle « client vérifié » teste les deux (`schema:560-572`). Une valeur envoyée sous l'autre forme serait refusée : la famille de l'incident `montage` | moyenne | références citées | V4 nomme **la** forme retenue, et un contrôle refuse l'autre dans les nouvelles tables |
| R14 | **Doublons de modèles** : refaire une table « annonces » côté particulier ; rattacher le Dossier à `chantiers` (publique) ; prendre la conversation pour la relation (elle se crée sans accord, `schema:2005-2010`) ; recréer une fiche au lieu de relier ; créer un second modèle de rendez-vous à côté du créneau de rappel (`schema:520`) | moyenne | références citées | une seule table par objet |
| R26 | **États stockés au lieu de déduits** : « contacté », « rendez-vous », « devis reçu », « non retenu » se déduisent d'objets qui existent ou existeront | moyenne, silencieuse | `addendum.txt:330`, `333-334` | V4 |
| R27 | **« nom, prénom »** (`addendum.txt:123`) contre le champ `nom` unique, choisi exprès | basse | `schema:7803-7807` | le QR remplit **ce** champ ; on ne le scinde pas |
| R44 | **Non-régression** : aucun contrôle ne rejoue les essais SQL ; la relation et le partage ajouteront des règles sur des tables en service | moyenne | `CLAUDE.md:706` | un script qui rejoue tous les `supabase/essais-*.sql` sur une base neuve, avant l'étape 3 |
| R19 | **Le « particulier » est parfois un pro** (sous-traitance). Le relevé de la base ne le prouve pas : 5 demandes de devis sur 6 et 2 rappels sur 2 viennent de comptes pro, dont 2 du compte administrateur, entre le 14/09 et le 04/10 — ce sont **des essais**, l'application n'est pas ouverte au public | basse, décide d'une règle | vraie base ; `CLAUDE.md:820-822`, `1850` | V7, défendu par la sous-traitance seule |
| R22 | **Troisième journal** : le plan devis l'avait **renvoyé** (« le §21, s'il demande plus », `PLAN:2433`) ; l'addendum le **déclenche** (`addendum.txt:301-302`) | décision | les deux textes | V9 : il naît avec la relation |

---

## 5. Ce que je propose, et qui demande ta validation — sans rien coder

Rien de ce qui suit n'est fait. Chaque point attend ton « oui », ton « non »,
ou ta correction.

**V1 — Inscrire D1 à D12 dans `docs/PLAN-DEVIS.md`, avant le lot 1.** Du texte
seulement. C'est ce qui rend le devis « prêt à recevoir les extensions »
(`addendum.txt:470-471`), sans rien construire pour elles.

**V2 — Un petit lot à part pour le stockage (D7), avant le lot 2.** Mesurer
d'abord, sur une base locale et avec un compte jetable ; puis restreindre
espace par espace par `alter policy`. Il touche la messagerie et les pièces
justificatives : séparé et mesuré.

**V3 — L'ordre : continuer le devis tel quel, et ouvrir l'addendum après.**
Tarifs → 1 → P → 2 (… 3, 4, 5), puis l'étape 3 de l'addendum. Le devis n'a
besoin de rien de l'addendum (§2) ; le lot 2 est le seul palier où un document
engage quelqu'un ; et la relation change le régime RGPD d'Opus (R11).

**V4 — Fixer le vocabulaire avant la première table.**

| objet | proposition | pourquoi |
|---|---|---|
| l'« annonce » du particulier | **garder « demande »** | la table `demandes` et le bouton existent ; « annonce » est déjà la Place des pros |
| le Dossier Travaux | un nom unique, par exemple `dossiers_travaux` — jamais `dossier` seul, `chantiers` ni `projets` | d'autres « dossiers » existent dans les cahiers ; « projet » est un synonyme dans l'addendum (`addendum.txt:350`) |
| la relation | un nom qui ne soit ni « partenaire » ni « abonnement » | `professional_partners` et `follows` existent |
| orthographe des états | **une seule forme**, au masculin sans accord (`en_attente` / `accepte` / `refuse`), comme `quote_requests` et le futur devis (`PLAN:1513-1516`) ; un contrôle refuse `acceptee` / `refusee` dans les nouvelles tables | la base mélange les deux (R41) |
| états de la relation | `en_attente` / `accepte` / `refuse`, plus une **date** de révocation | une révocation dit QUAND |
| états du partage | pas de ligne = « non partagé » ; `en_attente` / `accepte` ; une date de révocation | idem |
| états du dossier | `brouillon` / `en_cours` / `termine`, et « archivé » en case à cocher comme le carnet | `chantiers` dit `en_cours` |
| pro sur un projet | **ne stocker que « retenu »** ; le reste se déduit — et seulement **pour le particulier** : un pro ne voit jamais l'état des autres (R31) | deux écritures d'une même vérité se contredisent |
| libellé d'écran | pas « Partager » seul pour un dossier | « Partager » sert déjà aux publications (R13) |

**V5 — La relation s'accroche à la fiche du carnet**, elle ne la remplace pas.
La fiche ne pointe pas la relation : quand le particulier supprime son compte,
**la fiche du pro reste dans tous les cas**. Le vrai choix porte sur la **ligne
de relation** :
- la **supprimer** avec le compte (simple, rien ne reste du particulier chez
  Opus) ;
- ou la **garder avec un compte vide**, pour conserver la trace datée du
  consentement (utile si l'on doit prouver qu'une transmission était
  autorisée) — avec une durée à trancher (V10).
Ma préférence : la garder vide, **si** le juriste confirme qu'une trace de
consentement doit survivre ; la supprimer sinon.

**V6 — Le QR particulier : un jeton opaque, permanent pour celui qui
l'affiche, mais régénérable et révocable.** Le scan crée une **demande** de
relation, que le particulier accepte ou refuse en voyant **le nom de
l'entreprise tel que le répertoire Sirene le donne**, ou « nom déclaré par le
professionnel » (R34) — jamais « vérifié ». Une limite par compte. Avant
l'accord, rien n'est rendu sur la personne (R33).

**V7 — Le QR « particulier » est-il réservé aux particuliers ?** Je propose
**non** : une entreprise peut être cliente d'une autre (sous-traitance). Et
**seul un pro peut scanner** (R32). À toi de trancher.

**V8 — Ce que le particulier reçoit d'un devis** : une **copie** du document,
posée par un geste du pro, **plus** une fonction qui lui rend le statut de ses
devis sans ouvrir la ligne du pro (D6). Jamais une lecture des tables du pro.
Garder la copie après la fin du contrat reste suspendu à l'avis juridique
(V10). Et cette copie **ne se partage jamais** à un autre pro, sauf si tu
décides de changer la phrase des conditions (R31).

**V9 — Accepter un troisième journal, né avec la relation** : création de
relation, partage, révocation. Pas la lecture des documents en V1 (R21).
Personne n'y écrit à la main, aucun contenu (ni titre, ni nom de document).

**V10 — Faire relire par un juriste, avant le premier vrai partage** :
fondement de la transmission ; rôle d'Opus quand un pro lit un dossier
partagé ; statut de la copie d'un devis chez le particulier ; durée de la trace
d'un consentement après suppression d'un compte ; données de santé possibles
dans une description libre (« adaptation PMR »). Et le contrat de
sous-traitance du carnet, déjà dû (`PLAN:3337-3338`).

**V11 — `demande_reponses`** (R23) : refermer **les deux** règles de lecture,
pas seulement celle des visiteurs. Seuls l'auteur de la demande et le pro qui a
répondu lisent la ligne ; les autres au mieux un compteur (le motif du compteur
des réponses aux annonces). Aujourd'hui elle ne contient aucun message.

**V12 — La reconstruction de l'application.** Le lot 2 en demande déjà une
(`PLAN:3187`). Y ajouter la caméra, la dépendance qui dessine un QR et le
texte de permission en français éviterait une seconde reconstruction — mais
ajouterait au téléphone des modules que rien n'utilise encore. C'est un choix
de calendrier.

**V13 — Corriger les partenariats entre pros** (R28), dans un lot séparé et
mesuré : retirer la vieille règle de lecture ouverte, et faire passer
l'acceptation par une fonction qui ne change que l'état et la date. Hors
addendum, mais c'est le modèle qu'on aurait recopié.

**V14 — Ce qui est déjà public sur un compte** (R29) : décider, avant l'écran
de consentement, si la ville et le code postal d'un particulier doivent rester
lisibles par tous. Sinon, l'écran de consentement ne peut pas les présenter
comme un choix.

**V15 — Le moment où la fiche naît, au scan** (R38) : soit la fiche naît tout
de suite avec ce que tape le pro et s'enrichit après l'accord du particulier,
soit le parcours exige que le particulier ait l'écran ouvert, et le dit. Je
propose aussi de **faire passer les notifications sur l'écran verrouillé avant
le QR particulier**. Et (D11) : un devis remis pourra-t-il un jour être
repointé vers une autre fiche, lors d'une fusion de doublons ?

**V16 — Avis « client vérifié »** (R35) : écrire au plan de l'étape 3 que la
relation seule ne le rend jamais vérifié. Ce qui le rendra vérifié de plus
(par exemple un devis accepté, lot 4) est une décision explicite.

**V17 — Un préalable avant l'étape 3** (R44) : un script qui rejoue tous les
essais SQL sur une base neuve.

**V18 — Le QR professionnel attend la publication** (R40) : il n'a de sens que
le jour où un inconnu peut installer Opus ou ouvrir une page web. Il se décide
avec le passage de `STATUT` hors de `'essai'` et la fiche App Store, pas comme
un lot technique isolé.

---

## 6. Ce qui n'a PAS été vérifié

- **Aucune écriture n'a été éprouvée sur la vraie base.** R1 (suppression ou
  remplacement d'un fichier par son expéditeur) découle de la lecture des
  règles ; le comportement exact du serveur de stockage de Supabase n'a pas été
  lu dans son code. R28 (b) a été rejoué sur une **réplique** des règles
  relevées, pas sur la vraie base.
- **D11 et D3 ont été mesurés sur une réplique minimale** (tables réduites, la
  forme du figeage recopiée du plan) sur un PostgreSQL 16.15 jetable. Le module
  devis n'existe pas : `devis_se_fige()` n'est pas écrit.
- L'effet d'une restriction des règles de stockage sur les envois en
  « remplacer s'il existe ».
- **Le schéma de lien réellement présent dans le binaire iOS installé** :
  déduit du code des greffons, pas lu dans l'application.
- **Ce que sert le domaine `opus-project.com`** : non vérifié (le mandataire du
  conteneur répond 403).
- **Le texte exact de la permission caméra dans le build installé** : lu dans le
  code du greffon (`withImagePicker.js:7`, `51`), pas dans l'application.
- La nature native ou non de la dépendance qui dessinera un QR : à vérifier le
  jour du choix.
- Le réglage actuel de la connexion anonyme, de la confirmation par e-mail, et
  l'existence d'un fournisseur de courriel configuré.
- Le quota de stockage du plan Supabase, avant de promettre des vidéos.
- **Tous les points de droit** (V10) : rien ici n'est un avis juridique.
- Le plan devis n'a été lu qu'aux sections §3.1 à §3.9, §3.13, §4 (lots 0 à
  6), §6 et §10.6 à §10.13 ; le reste vient des relevés.
- La numérotation « 9 à 14 » de la §8 de l'addendum figure **dans le PDF**
  (vérifié sur le rendu de la page 5) ; les autres pages n'ont pas été relues
  image par image.
- Rien n'a été essayé au navigateur ni sur l'iPhone : c'est un audit de texte,
  de schéma et de forme de la base.

---

## Ce que la contre-vérification a changé

35 objections, **toutes vérifiées à la source** ; aucune écartée en entier,
quatre nuancées. Les changements qui comptent :

- **Le modèle des partenariats n'est plus proposé comme brique** : il a deux
  défauts réels, mesurés (R28). On garde l'idée des états, pas les règles.
- **La garantie « le devis ne dépend de rien » était incomplète** : elle ne
  voyait pas une contrainte nommée ni un motif de refus. Elle devient une règle
  en trois parties (D4), et elle est dite **prévue**, pas existante.
- **Deux pièges nouveaux pour le devis, mesurés** : le lien pendant sur un
  devis remis (D11, avec sa parade éprouvée), et la contrainte « origine ⇒
  lien » qui bloquerait la sortie d'un particulier (D3, phrase retirée).
- **Ce que reçoit le particulier** : un document **et** une fonction de statut,
  pas un PDF seul ; et ce document ne se partage pas à un concurrent (D6, R31).
- **Ce qui est déjà public** est dit : nom, ville, code postal des comptes ;
  réponses aux demandes lisibles par tous les connectés (R29, R23).
- **Le QR** : l'état exact des liens, de la caméra et du dessin du QR ; le QR
  pro rattaché à la publication sur l'App Store ; la permission caméra en
  anglais ; les notifications push manquantes (§3, R37 à R40).
- **Sécurité de la relation** : qui peut scanner, pas d'« oracle » de doublon,
  pas d'usurpation par le nom, pas d'avis vérifié par simple relation
  (R32 à R35).
- **Retiré** : la ligne « tarifs visibles sur la page du QR pro » (l'addendum
  n'en parle pas), et « les brouillons » comme raison de D6 (une règle RLS sait
  cacher une ligne).
- **Corrigé dans la forme** : « une fiche par personne » devient « réutilisée,
  sans garantie d'unicité » ; le relevé « 7 sur 8 » est présenté comme des
  essais ; le troisième journal était « renvoyé », pas « écarté » ; les modules
  Agenda et Factures sont cités par leurs sections du cahier des charges.
- **Ajouté** : le tableau des 15 critères du §22, l'export RGPD à chaque table
  nouvelle, et un script qui rejoue les essais SQL avant l'étape 3.
- **Nuancé** : la copie signée arrive « presque toujours » par courriel
  (`PLAN:3393-3397`), donc sa perte avec le compte du client reste l'exception ;
  on peut déjà signaler le **profil** d'un pro, pas une demande de relation ;
  le QR particulier, scanné **dans** Opus, n'a pas besoin de lien qui ouvre
  l'application ; et la règle de conservation citée pour la copie de devis
  vise Opus sous-traitant de l'artisan — savoir si elle vaut pour la copie du
  particulier est la question posée au juriste.

## Revérifié une dernière fois avant d'être remis (19/10/2026)

Les quatre défauts **existants** (R1, R23, R28, R29) sont ceux qu'on présente
au propriétaire comme des faits : ils ont donc été relus une fois de plus,
directement, sur la vraie base et en lecture seule.

| | relevé |
|---|---|
| R1 — stockage | `remplacement de mes fichiers` (UPDATE) et `suppression de mes fichiers` (DELETE) : `(storage.foldername(name))[1] = auth.uid()`, **aucun filtre d'espace** |
| R23 — `demande_reponses` | `lecture reponses visiteur` : `to anon using (true)` ; `lecture reponses` : tout connecté sauf blocage |
| R28 — partenariats | `lecture partenaires` `using (true)` coexiste avec `lecture partenariats` ; `je reponds a un partenariat` ne vérifie que `auth.uid() = partner_id` |
| R29 — `users` | `anon` et `authenticated` lisent `id, nom, type, ville, code_postal, avatar_url, avatar_seed, cgu_version, cgu_acceptees_le, created_at` |

Et les quatre scripts de `docs/audit-addendum/` ont été **rejoués** sur un
PostgreSQL 16 neuf : un partenariat C ↔ B accepté que C n'a jamais demandé
(`UPDATE 1`) ; un devis remis qui garde une fiche et une demande supprimées ;
la parade qui le fait passer à vide et refuse la redirection ; la contrainte
« origine ⇒ lien » qui bloque la suppression de la demande.

**Toujours non éprouvé** : R1 par une vraie écriture dans le stockage — c'est
le premier geste du lot qui le corrigera (V2).
