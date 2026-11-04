# Lot 2 du module devis, sous-lot 2a : la réduction, l'acompte, la validité — cahier v2

> **Archivé le 04/11/2026, après la construction.** Ce cahier a guidé le
> sous-lot 2a (la réduction sur le total, l'acompte et sa nature, la validité,
> le total toutes options comprises, la carte « Conditions ») ; il est versé
> ici tel qu'il a servi, pour qu'on sache plus tard POURQUOI chaque choix a
> été fait. **En cas de désaccord, c'est la section « Réduction, acompte,
> validité — lot 2a » de CLAUDE.md et le code qui disent vrai.** À savoir en
> le lisant :
>
> - c'est la **version 2** (02/11/2026), réécrite après la critique de la v1
>   par quatre lentilles (67 constats, aucun réfuté), avec les **réponses du
>   propriétaire du 03/11 au §6.0**. La v1 n'est pas versée ;
> - il couvre **tout le lot 2** et le découpe en trois. **Seul 2a est
>   construit** : ce que les §4 et §5 disent de 2b et de 2c est une
>   PROPOSITION, à relire avant de construire ;
> - les fichiers qu'il cite sans chemin du dépôt (`pdf.md`, `droit.md`,
>   `tout.md`, `etape-*.md`, les dossiers `scratchpad/lot2/…`) et les noms de
>   constats (`BASE-…`, `ECRAN-…`, `DROIT-…`, `DECOUPAGE-…`) étaient des
>   documents de travail de la session : ils ne sont PAS dans le dépôt ;
> - les numéros de ligne (`PLAN:…`, `schema.sql:…`, `api.js:…`,
>   `file-ecriture.js:…`, `verifier-devis.mjs:…`) sont ceux du commit
>   `a3c910d`, d'AVANT le lot : le code a bougé depuis ;
> - il a été parcouru à l'archivage pour en retirer ce qui identifierait une
>   personne réelle : **il n'y avait rien à retirer**. Il ne contient ni
>   barre oblique inverse ni caractère invisible ; il est copié octet pour
>   octet par un script, pas par l'outil d'édition — sauf sa première ligne,
>   son titre (« Lot 2 du devis — cahier v2 (02/11/2026) »), remplacé par
>   celui de cette page ;
> - **ce qui a changé depuis, ou a été construit autrement** (le détail est
>   dans CLAUDE.md et dans les commentaires de `schema.sql`, section 49) :
>   - les colonnes naissent en **49.4 bis**, et non en « 49.2 bis » (§2.1) ;
>   - **le plafond** borne le HT sur le BRUT, comme prévu (§2.6), mais aussi
>     le total toutes options comprises, et il juge le TTC et ce total NETS
>     de la réduction : une réduction peut faire tenir sous la borne un TTC
>     qui la dépasserait sans elle, et la retirer est alors refusé ;
>   - **« la migration ne recalcule rien » (§2.3) était faux** : un devis
>     enregistré avant le lot avait son total toutes options comprises à 0.
>     Le rattrapage de 49.6 ter le pose, une **garde** arrête la migration
>     avant d'écrire quand un ancien devis ne peut pas l'être, et
>     `devis_calculs_check` n'est posée qu'après lui ;
>   - l'acompte en pourcentage n'est calculé que dans ses bornes : hors
>     d'elles, c'est `devis_acompte_check` qui refuse, et non une erreur
>     22003 ;
>   - à l'écran, ce que les relectures ont changé : au régime réel, « Réduction
>     HT, en euros » et un acompte « TTC », avec leur aide ; une pastille
>     d'unité n'écrit rien ; « Ramenée à … » et « Enregistrée » ne se disent
>     que d'après ce que la base a relu (« Calcul en cours… » pendant
>     l'envoi) ; la carte dit elle-même l'état de l'écriture ; un refus de
>     contrainte est définitif (« La corriger », plus « Réessayer ») ; la
>     file d'écriture met à part les colonnes d'une réduction refusée par le
>     plafond, pour que le reste de l'en-tête parte seul ;
>   - **les aides de droit de la carte** (le 8e jour, acompte ou arrhes, la
>     retenue de garantie, la validité) ont été réécrites après la relecture
>     des articles : la première version disait moins que la loi, dans le
>     sens qui expose l'artisan. Ce sont des AIDES pour l'artisan, écrites
>     pour lui ; le texte qui s'imprimera sur le devis s'écrit en 2c, avec le
>     juriste ;
>   - **l'avis « franchisé au-delà de 41 250 € » (§3.1) n'a pas été
>     construit** ;
>   - **la question 5 (la reconstruction) n'a pas de réponse dans ce
>     cahier** ;
>   - l'essai 49 compte **79 refus** (le §3.7 en prévoyait 89), et deux
>     essais sont nés à côté : `essais-section-49-conditions.sql` (27 erreurs
>     annoncées) et `essais-section-49-rattrapage.sql` (4, dont 2 de la
>     garde).


Réécrit après la critique adverse du cahier v1 : quatre lentilles (base,
écran, droit, découpage), **67 constats**, chacun contre-examiné par un
second relecteur (rapports dans `scratchpad/lot2/critique/`, synthèse dans
`tout.md`). Verdicts : 43 confirmés, 24 en partie, **aucun réfuté**. L'annexe
A dit, constat par constat, ce que ce cahier en fait.

Conventions inchangées : **ÉTABLI** (lu ou mesuré), **DÉDUIT** (à éprouver),
**À DÉCIDER** (P = propriétaire, J = juriste).

---

## 0. En une page — ce qui change depuis la v1

La v1 posait en 2a dix faits du devis, et faisait exister en 2b un PDF
partageable avant tout numéro. La critique a montré deux choses :

1. **Un PDF qui existe se signe, et devient le contrat** (PLAN:2070-2075,
   règle fondatrice du lot 2). Un « aperçu » partageable, même marqué, sort du
   téléphone et se signe sur place ; aucune technique ne garantit sur iPhone
   une mention sur chaque page (`pdf.md` §6.2). DECOUPAGE-1, confirmé.
2. **Cinq des dix faits de 2a n'avaient pas de lecteur avant 2b ou 2c**, et
   leur forme dépend de textes non lus (déchets) ou de réponses du juriste
   (destinataire, urgence, devis payant). DECOUPAGE-7, confirmé. Le projet
   pose une colonne AVEC son lecteur (sections 38, 41).

**Nouveau découpage proposé (question 1 au propriétaire) :**

| sous-lot | ce qu'il livre | ce qu'il demande avant | natif ? | « remis » ? |
|---|---|---|---|---|
| **2a — Le calcul** | la **réduction** sur le total, l'**acompte** (montant et nature), la **validité** ; le total toutes options comprises ; une **carte « Conditions »** plein écran (la retenue y déménage) ; le pied reste d'une rangée ; l'écriture des montants fermée au téléphone (droits de colonne) | les réponses Q2 à Q5 | non | non |
| **2b — Ce que le devis doit dire** | les faits que la loi lit : pour qui (4 cas, L. 221-3), urgence par ligne, « peut engager ma garantie décennale », devis payant, déchets ; **`motifs_refus_remise()`** et, à l'écran, « Ce qu'il manque pour remettre ce devis » | les textes recopiés depuis Légifrance (P) ; les réponses du juriste listées en §5 | non | non |
| **2c — Le document et sa remise** | `mentions-devis.js`, le gabarit, le **PDF qui naît AVEC son numéro**, le figeage (OP003), l'archive privée, « Rouvrir le document », le partage | la reconstruction faite et installée ; le format du numéro, le logo (P) | **oui** (`expo-print` seul) | **oui** |

Ce que ce découpage garde de la v1 : chaque sous-lot a sa migration, ses
essais, son accord, son essai réel et son commit ; **rien ne devient
« remis » avant que le document existe** ; et maintenant, **aucun PDF
n'existe avant son numéro**. Ce qu'il coûte : le propriétaire ne voit la
mise en page de son devis qu'en 2c. L'alternative (un aperçu PDF avant le
numéro, sans zone de signature, marqué « APERÇU », qui n'existe que tant que
`STATUT = 'essai'`) reste possible : c'est la question 1.

**La reconstruction** (icône, nom sous l'icône, `expo-print`) peut se faire
dès maintenant, une seule fois — question 5. `expo-sharing` n'entre PAS :
le `Share` de React Native partage un fichier sur iPhone (`pdf.md` §8.4,
ÉTABLI) et dit en plus si l'artisan a annulé ; `expo-sharing` apportait un
greffon qui fait mourir `expo start` quand le paquet manque, et une chaîne
`@expo/plist > @xmldom/xmldom` que `verifier-dependances` range côté
téléphone (DECOUPAGE-10, mesuré). Sur Android, `Share` ne partage que du
texte : la remise y passera par la feuille d'impression d'`expo-print`
(DÉDUIT, à éprouver en 2c ; Android n'est pas utilisé aujourd'hui).

---

## 1. Ce que le lot trouve en arrivant (ÉTABLI)

Inchangé depuis la v1 (§1), avec trois précisions de la critique :

- `recalcule_devis()` **n'écrit pas les totaux de `devis`** : il écrit
  `devis_tva`, puis touche `modifie_le` et `generation` ; c'est
  `tient_le_devis()` qui RELIT les totaux dans `devis_tva`
  (`schema.sql:13312-13320`, 13458-13463). La phrase de la v1 « seule
  fonction qui écrit les montants » était fausse (BASE-1).
- `generation` est mise dans le corps des requêtes par `api.js`
  (l.3119, 3123) ; la file ne fait que fournir le numéro
  (`file-ecriture.js:512-514`) et envoie la levée seule (l.520) (BASE-16).
- Les contrôles qui lisent les colonnes et les contraintes du devis
  (`colonnesDe`, `CHECKS49`, F-33, B-13, les phrases) **ne lisent que la
  section 49** (`verifier-devis.mjs:2139-2151`) (DECOUPAGE-3, ECRAN-13).

---

## 2. Les décisions qui valent pour tout le lot

### 2.1 Le module devis reste UNE section : 2a étend la section 49

La v1 ouvrait une section 54. Deux raisons de ne pas le faire :

- **les droits d'écriture vivent en 49.7** ; écrits une seconde fois en 54,
  la règle aurait deux endroits, et rejouer la 49 rouvrirait `statut`
  jusqu'au passage de la 54 (BASE-10, mesuré) ;
- **les contrôles ne lisent que la 49** : une colonne née en 54 leur
  échappe (DECOUPAGE-3, mesuré).

Donc : les colonnes de 2a naissent en **49.2 bis**
(`alter table … add column if not exists`, juste après le `create table`),
leurs contraintes avec les autres en 49.3, les fonctions changent EN PLACE,
et le bloc de droits de 49.7 est **remplacé** par les droits de colonne.
`colonnesDe` apprend à lire `create table` ET `add column if not exists` de
la section ; B-12 n'accepte un `add column` que là. 2b et 2c feront de même.

### 2.2 Les droits de COLONNE, écrits à leur place (49.7)

`revoke insert, update on public.devis, public.devis_lignes from authenticated`,
puis `grant insert (…), update (…)` colonne par colonne, sur la liste RELEVÉE :

- `devis`, à la création : `id`, `source`, `pro_id`, `generation` et les
  colonnes d'en-tête ; en modification : les colonnes d'en-tête et
  `generation` (la levée est un `update(generation)` seul) ;
- `devis_lignes`, à la création : la ligne entière de `ligneVersBase` plus
  `devis_id` et `generation` ; en modification : les mêmes **sauf
  `devis_id`** — aucun écran ne déplace une ligne ; une ligne ne change plus
  de devis. Les cas 15, 16 ter et 32 l de l'essai 49 passent à `42501`, le
  point 6 de 49.5 bis et la branche « changement de devis » du déclencheur
  deviennent inatteignables pour un client ; leurs commentaires le disent
  (BASE-9) ;
- **jamais** : `statut`, les totaux, `remise_ht_centimes`,
  `acompte_ttc_centimes`, `total_ttc_options_centimes`, les dates.

Mesuré par la critique (DECOUPAGE-4, -15) : **les sept formes de requête de
l'application ACTUELLE passent** sous ces droits ; `statut` et un total
écrits par un client sont refusés. La preuve de l'essai passe par le
catalogue (`has_column_privilege`, colonne par colonne, dans les deux sens),
comparée à `devisVersBase` et `ligneVersBase`. `verifier-devis` §20 et le
cas 26 de l'essai 49 changent, avec leur raison.

### 2.3 Qui pose les montants

- **`recalcule_devis()`** reste seule à écrire `devis_tva` (base nette,
  réduction du taux, TVA) et, en plus, le total toutes options comprises
  (§3.2).
- **`tient_le_devis()`** reste seule à poser les montants de `devis` : elle
  relit déjà les totaux dans `devis_tva` ; elle pose en plus
  `remise_ht_centimes` (somme des réductions par taux),
  `total_ttc_options_centimes` et `acompte_ttc_centimes`. **L'acompte n'a
  donc besoin d'aucun déclencheur** : il se recalcule à chaque écriture du
  devis, sur le TTC qui vient d'être relu (BASE-1, mesuré : retirer la
  dernière ligne passe).
- **Une écriture de réduction** doit refaire la ventilation : un
  déclencheur `after update of remise_centiemes, remise_centimes on devis`,
  aux trois conditions mesurées par la critique (BASE-11) :
  1. il appelle `recalcule_devis(new.id, NULL)` — NULL = recalcul sans
     écriture de ligne, qui ne vérifie ni l'horloge (`OP015`) ni le plafond
     de lignes ; le contrat 49.5 bis le dit, et la phrase d'`OP015` cesse de
     parler de « ligne » quand c'est l'en-tête qui est en cause ;
  2. sa fonction est `security definer`, `recalcule_devis` reste révoquée à
     tous, et le déclencheur entre dans les listes fermées (essai 49 cas 27,
     essai 50 cas 13 i) ;
  3. **la réponse d'une écriture de réduction porte les totaux d'AVANT** :
     l'application relit (elle le fait déjà après toute écriture), ne
     demande jamais un montant en retour d'une écriture d'en-tête, et
     `verifier-devis` le refuse.
  L'invariant de profondeur (`schema.sql:13096-13102`) est réécrit pour ce
  déclencheur, et éprouvé à deux sessions (réduction puis ligne, ligne puis
  réduction, réduction tardive refusée `OP015` par `tient_le_devis`).
- **La migration ne recalcule rien** : les défauts à 0 suffisent, mesuré sur
  une base avec des devis (BASE-12). Une fonction de 2c qui voudrait
  recalculer fait monter l'horloge, elle n'appelle pas le recalcul hors d'un
  déclencheur sans numéro neuf.

### 2.4 Les règles qui se croisent ne s'écrivent pas en contrainte

La critique a mesuré (BASE-2, ECRAN-4) qu'une contrainte qui lie deux
colonnes d'un brouillon écrit champ par champ refuse la saisie à mi-chemin,
et que la boucle `enregistrerEntete` jette alors l'écriture **en silence**
(`ok: true`). D'où :

- **une paire = UN champ à l'écran, UNE écriture** : la réduction (valeur +
  unité) pose ses deux colonnes ensemble, l'une à `null` ; l'acompte (valeur
  + unité + nature) part avec sa nature ou ne part pas, et le retirer vide
  la nature dans la même écriture ;
- **en base, seulement ce qui ne dépend pas de l'ordre de saisie** :
  `devis_remise_une_forme_check`, `devis_acompte_une_forme_check` (BASE-3 :
  aujourd'hui rien n'interdit l'acompte sous ses deux formes, et le montant
  gagne en silence), `devis_acompte_nature_check` réduite à la liste
  (`'acompte'`, `'arrhes'`) ; **« un acompte sans nature »** devient un motif
  de `motifs_refus_remise()` (2b), jamais une contrainte ;
- **la boucle ne rend plus jamais `ok: true` après avoir jeté quelque
  chose** : un sabotage l'éprouve ;
- **trop grand ne se refuse pas par contrainte** : une réduction valable à la
  saisie dépasse le total dès qu'on retire une ligne, et une contrainte
  empêcherait alors l'artisan de retirer une ligne de son propre devis
  (DROIT-14, mesuré par le contradicteur). La base calcule la valeur
  EFFECTIVE, l'écran la montre (« Ramené à 300,00 € : le total est plus
  petit que l'acompte demandé »), et 2b en fait un motif de refus.

### 2.5 La répartition au plus fort reste, sans débordement

`repartir_au_plus_fort_reste(total bigint, poids bigint[]) returns bigint[]` :
calcul en **`numeric`** en SQL et en **`BigInt`** en JavaScript (mesuré : le
produit déborde `bigint`, et le reste devient faux en `Number` vers 3 M€ pour
une réduction de 10 %) (BASE-5). Les bords sont écrits : tableau vide →
`{}` ; somme des poids nulle → que des zéros ; total > somme → refusé (le
recalcul borne avant) ; poids négatif → refusé. **Les poids sont ordonnés
par taux DÉCROISSANT dans les deux appelants**, parce que la fonction ne voit
que l'ordre du tableau, et l'égalité de reste se départage par cet ordre.
Cas dans `cas-devis.json` : au-dessus de 2^53, ordre d'insertion inversé.

### 2.6 Le plafond porte sur le BRUT

`devis_plafond_check` porte aujourd'hui sur le HT : avec une réduction, il ne
bornerait plus que le net, pendant que JavaScript juge le brut (BASE-6,
mesuré ; ne mord qu'au-delà de 100 M€). Les deux côtés jugent désormais
`total_ht_centimes + remise_ht_centimes`, avec un cas commun.

### 2.7 Les libellés suivent le régime (règle C2 du lot 1)

La v1 écrivait « Total HT avant remise » et « 45,00 € TTC » sans condition.
Or l'écran ne nomme la taxe qu'au régime réel. **`libellesDesTotaux(regime)`**
(pure, dans `devis.js`) est la seule source des libellés du pied, de la
ventilation et de la carte « Conditions » ; `verifier-devis` la fait tourner
sur les cinq états du régime (ECRAN-10, DROIT-5).

### 2.8 Le mot « remise » : trois sens, un seul gardé

« Remise » désignait la réduction, le geste de remettre le devis au client
(statut `remis`, la fonction de remise, ses motifs de refus) et la remise en
avant d'une publication (lot S-c). Sur le même écran on aurait lu
« Remise : − 50,00 € », « Remis le 12/11 » et « refus de remise »
(ECRAN-12, DECOUPAGE-13). **Proposition : « Réduction » pour le rabais**
(question 2), « remettre le devis » pour le geste. Les noms de colonnes
(`remise_*`) restent : ils ne s'affichent pas.

### 2.9 Le figeage refuse (2c), et D11 change

Inchangé depuis la v1 (§2.4), avec la précision demandée (DECOUPAGE-14) :
**D11 devient « un passage à vide passe, une redirection est refusée par
OP003 »** — le professionnel ne peut plus vider un lien à la main sur un
devis remis ; l'essai D11 est réécrit en conséquence. D5 tient.

---

## 3. Le sous-lot 2a en détail — le calcul

### 3.1 Ce que l'artisan voit

**La liste des lignes ne change pas.** Sous la ventilation, une rangée de
résumé (deux lignes au plus ; ce qui MANQUE d'abord) : « Réduction 5 % ·
Acompte 30 % · Valable 30 jours » ou « Aucune condition — touchez pour en
poser ». Elle ouvre **la carte « Conditions »**, plein écran, sur le modèle
EXACT de `CarteLigne` (ECRAN-2) :

- barre fixe en haut : « ‹ Devis », le total net, le reste à payer ;
- **Réduction** — un champ, une unité (%, ou € si le propriétaire le veut,
  question 2) ; dessous, l'effet en clair : « Le total passe de 1 650,00 € à
  1 485,00 € » ; une réduction ne porte **jamais** sur une option, et la
  carte le dit (DROIT-6) ;
- **Acompte** — un champ, une unité, et la nature à choisir sans défaut :
  « Acompte » ou « Arrhes » (une aide courte dit la différence ; le texte qui
  s'imprimera est écrit en 2c avec le juriste, DROIT-10) ; dessous, l'effet :
  « 495,00 € — reste à payer 1 155,00 € » ; avec une retenue de garantie :
  « reste à payer, avant la retenue de garantie » (DROIT-7). L'acompte porte
  sur le total **hors options** (DÉDUIT : on ne sait pas, avant la
  signature, quelles options seront prises ; À CONFIRMER, P) ;
- **Validité** — des pastilles 15 · 30 · 60 · 90 jours et « Autre » (un champ
  d'entier) ; **rien de pré-choisi** : la proposition se confirme d'un appui,
  comme le délai d'exécution (DROIT-13) ; elle se lira « valable N jours à
  compter de la date du devis » ;
- **Retenue de garantie** — elle déménage ici depuis l'ancien bloc
  « Conditions » du bas de la liste, qui disparaît (ECRAN-2) ;
- en bas, ce que le devis dira de l'échéance de l'acompte, **la règle et non
  une date** : « payable au plus tôt le 8e jour après la signature » —
  c'est le défaut protecteur (L. 221-10), et le seul que 2a connaisse ;
  2b dira quand une urgence l'autorise plus tôt (DROIT-1, DROIT-2).

**Le pied reste UNE rangée** (décision du lot 1, deux vérifications de
`mesure-devis`) : le total net, libellé selon le régime, et un suffixe
« · réduction comprise » quand il y en a une — avec une priorité écrite pour
les suffixes, qui se coupent à 320 points (ECRAN-1). Le détail va dans la
**carte de ventilation** du bas, produit par une seule fonction pure :
total avant réduction, réduction, HT net et TVA par taux (au réel), total,
**total toutes options comprises** (s'il y a des options), acompte et sa
nature, reste à payer.

Deux avis, sans contrainte de base :

- **franchisé dont le total net dépasse 41 250 €** (DROIT-17, DECOUPAGE-8) :
  « Ce devis seul dépasse le seuil de la franchise en base de TVA… » — relevé
  le 03/11 dans des sources SECONDAIRES concordantes : 37 500 € (seuil) et
  41 250 € (seuil majoré, au-delà duquel la TVA est due tout de suite) pour
  les prestations de services en 2026, la réforme à 25 000 € abandonnée ;
  **à relire dans l'article 293 B du CGI (Légifrance) avant d'écrire la
  phrase**, et la phrase dit « à vérifier avec votre comptable », jamais une
  conséquence certaine ;
- **« Mon entreprise » porte un texte de modalités de paiement qui parle
  d'acompte** pendant que le devis en pose un (DROIT-11) : l'acompte du
  devis est la SEULE source du montant ; l'aide du champ de « Mon
  entreprise » dit de ne plus y écrire d'acompte.

### 3.2 La base — 49.2 bis, 49.3, et les fonctions en place

Sur `devis` :

| colonne | type | contrainte | écrite par |
|---|---|---|---|
| `remise_centiemes` | integer | 1 à 10 000 | téléphone |
| `remise_centimes` | bigint | 1 à `PLAFOND` | téléphone (si question 2 = € aussi) |
| — | — | `devis_remise_une_forme_check` | — |
| `acompte_centiemes` | integer | 1 à 10 000 | téléphone |
| `acompte_centimes` | bigint | 1 à `PLAFOND` | téléphone (si question 3 = € aussi) |
| — | — | `devis_acompte_une_forme_check` | — |
| `acompte_nature` | text | `('acompte','arrhes')` seulement | téléphone |
| `validite_jours` | integer | 1 à 365 | téléphone |
| `remise_ht_centimes` | bigint not null default 0 | ≥ 0 | base (`tient_le_devis`) |
| `total_ttc_options_centimes` | bigint not null default 0 | ≥ TTC | base (`tient_le_devis`) |
| `acompte_ttc_centimes` | bigint not null default 0 | 0 à TTC | base (`tient_le_devis`) |

(Une forme écartée par le propriétaire = une colonne de moins.)

Sur `devis_tva` : `remise_centimes bigint not null default 0` ;
`base_centimes` devient la base NETTE ; la remise à zéro d'un taux qui
disparaît remet AUSSI `remise_centimes` à 0, et
**`devis_tva_vide_check`** (`nb_lignes > 0 or` tout à zéro) attrape l'oubli
(BASE-4, mesuré). Le total toutes options comprises se range dans le devis,
calculé sur l'UNION (postes nets + options brutes), taux par taux, TVA
arrondie une fois par taux — jamais une addition (schema 49.4, PLAN:3649 ;
DROIT-6, DECOUPAGE-8, BASE-15). Avec plusieurs options, c'est **toutes les
options** ; chaque option garde son propre prix sur sa ligne.

**Sur `devis_lignes` : rien en 2a.** Les deux marqueurs (urgence,
garantie décennale) passent en 2b. Le joueur du cas 30 n'a donc pas besoin
de changer en 2a ; il gagnera les booléens en 2b (BASE-8).

`recalcule_devis()` :

1. HT brut par taux (postes) ;
2. réduction effective (`remise_centimes`, ou `round_half_up(brut ×
   remise_centiemes / 10 000)`), bornée au brut ;
3. répartie par `repartir_au_plus_fort_reste` (poids = bases brutes, taux
   décroissants) ;
4. écrit `devis_tva` : base nette, réduction du taux, TVA sur la base nette ;
5. calcule le total toutes options comprises sur l'union.

`tient_le_devis()` relit ensuite, comme aujourd'hui, et pose les trois
colonnes de la base ; l'acompte effectif =
`acompte_centimes`, ou `round_half_up(TTC × acompte_centiemes / 10 000)`,
borné au TTC.

### 3.3 Le calcul côté téléphone

`totauxDevis(lignes, conditions = {})` : **sans second argument, inchangé**
— les 44 cas du lot 1 passent sans changer d'une virgule. `devis.js` gagne
`repartirAuPlusFortReste` (BigInt), `remiseEffective` et `acompteEffectif`
(qui rendent `{ demande, effectif, borne }`, ECRAN-11),
`libellesDesTotaux`, et `versCentiemes` accepte « ,5 » comme `versCentimes`
(correction C7 jamais portée, ECRAN-13) ; un lecteur
`versPourcentDeDevis(texte)` refuse au-delà de 100 % avec sa phrase et
refuse « 0 » (« aucune réduction » = champ vide).

`cas-devis.json` gagne une opération sur le devis (`{ op: 'devis',
valeurs }`, côté SQL et côté JS) et au moins : 333/334 ; trois taux avec
égalité de reste ; ordre d'insertion inversé ; au-dessus de 2^53 ; 100 % ;
réduction plus grande que le brut ; ligne offerte ; réduction + option
(toutes options comprises) ; acompte ,5 ; acompte en montant puis ligne
retirée ; réduction en % puis ligne ajoutée ; acompte + retenue ; plafond
brut ; l'unité `jour`.

### 3.4 L'écran — les huit points de passage

La critique (ECRAN-5) a compté huit endroits que les colonnes traversent.
Le cahier les nomme, et `verifier-devis` fait un **aller-retour exécuté**
sur la base de démonstration (écrire chaque colonne par la file, relire le
devis et les totaux, exiger la valeur, puis la vider et exiger `null`) :

1. `CHAMPS_DEVIS` et l'enveloppe de la file (`api.js:3245`) ;
2. `devisVersBase` ;
3. **`rowToDevis`** (`api.js:2885-2913`) — l'oubli le plus grave : une
   réduction retirée sur un devis rouvert serait annoncée enregistrée ;
4. **la relecture des totaux** et `totauxDepuisBase` (`api.js:3044-3064`,
   3192-3200) — `remise_ht`, `acompte_ttc`, `total_ttc_options`, et
   `devis_tva.remise_centimes` ;
5. la base de démonstration (`devis-demo.js`) — **`modifierDevis` recalcule
   désormais** quand une condition change (ECRAN-6) ;
6. `fusionnerAvecLaFile` / `ranger` ;
7. `REGLES_DEVIS` et `CONTRAINTES_DEVIS` (ordre alphabétique) ;
8. `NOMS_ENTETE` — **un champ refusé ne s'affiche plus jamais par sa clé** :
   le repli sur la clé devient un contrôle qui rougit (ECRAN-3).

Et :

- **l'état de la saisie devient une valeur unique** :
  `carte = { type: 'ligne', id } | { type: 'conditions' } | null` ; le retour,
  la garde, VoiceOver et « Corriger » la traitent comme une carte ;
- **la garde de sortie LIT la carte « Conditions »** (`lire()` /
  `enregistrer()` comme `CarteLigne`) ; l'expression de `verifier-devis`
  qui tient la séquence **exige** cette lecture (ECRAN-3 : aujourd'hui elle
  resterait verte si la carte n'était pas lue) ; `mesure-devis` rejoue
  « taper une réduction, toucher la barre du bas » ;
- **les phrases d'échec nomment le champ** (« La réduction n'a pas pu être
  enregistrée… ») ; « Le brouillon n'a pas pu être enregistré » ne sert plus
  qu'à un échec de CRÉATION ; le suffixe « · ligne en cours » devient
  « · enregistrement en cours » (ECRAN-15, défaut existant depuis le lot 1) ;
- **VoiceOver** : la réduction se lit comme un montant positif sous le
  libellé « Réduction », jamais avec un trait d'union ; aides courtes
  (ECRAN-17) ;
- **« Mes devis »** : le total est le total net, avec « réduction comprise »
  sous lui ; on rappelle qu'il ne se relit pas en rouvrant l'écran (point
  ouvert du lot 1) (ECRAN-18) ;
- `ConditionsDevis.js` (la carte) entre dans `FICHIERS_DU_MODULE`, et
  l'assertion « un an » suit le fichier qui porte l'aide de la retenue
  (ECRAN-16).

### 3.5 La démonstration

Elle fait vivre la réduction, l'acompte, le reste à payer et le total
toutes options comprises par le MÊME calcul. Aucune donnée d'un autre
contrôle n'est retouchée ; aucun devis d'urgence n'est inventé (ECRAN-6 :
rattacher un devis à l'urgence de démonstration serait la donnée truquée que
l'en-tête de `devis-demo.js` refuse) — l'urgence se vivra par le geste, en 2b.

### 3.6 Les textes légaux

2a n'imprime rien et n'écrit rien sur un tiers. **Aucun changement de
`legal.js`.** Les phrases de la carte qui portent du droit (arrhes et
acompte, échéance) sont des constantes de `devis.js`, écrites une fois, à
faire relire par le juriste avant 2c.

### 3.7 Ce qui rougira, et sera changé avec sa raison (BASE-7, DECOUPAGE-4)

Mesuré par la critique sur un prototype : l'essai 49 passe de 74 à 89
refus et ses cas 1, 2, 4 bis, 5, 10, 15, 16 ter, 19, 26, 27, 30, 32 l
changent ; l'essai 50 (cas 13 i) et l'essai 43 aussi. `verifier-devis` :
§20 (exactement deux `grant`), le joueur JS (trois opérations, « exactement
44 », forme du résultat), B-12, « il en faut N », F-33, B-13, les phrases
(§15, §16), B-22 si une fonction nouvelle nomme `public.devis`. Le cahier de
construction (`etape-*.md`) les listera un par un avec leur raison, et
**chaque contrôle changé est éprouvé en cassant ce qu'il surveille** :
deux sabotages obligatoires — une colonne interdite ajoutée par
`add column`, une contrainte sans phrase.

### 3.8 Les dettes que 2a prend (DECOUPAGE-11)

- **la relecture de sécurité du 2e tour de la section 49**, jamais rendue :
  la relecture adverse de 2a aura une lentille « sécurité de toute la
  section 49 », pas seulement de ce qui change ;
- **remesurer le recalcul** avant et après (1,6 s à 100 000 lignes), puisque
  2a l'alourdit ;
- **la phrase 2^53 − 1** du point 7 de 49.5 bis ;
- **« la base n'a pas répondu »** dans trois écrans (une cause qu'on ne
  connaît pas) ;
- **TEXTES9** (la jointure `quote_requests` de `unDevis`) ;
- la classe de blancs : 2a n'ajoute **aucune colonne de texte**, donc aucune
  copie de plus ; elle reste due avant 2b, qui en ajoute (déchets).

TEXTES8, TEXTES17 et « la rangée locale ≠ le pied » restent ouverts : ils ne
touchent pas ce que 2a change.

### 3.9 La migration

Construite depuis `schema.sql` par un script ; aucun ordre qui commence par
`drop`, `delete` ou `truncate` ; `set local lock_timeout = '5s'` ; simulée
deux fois sur l'imitation `git show a3c910d:supabase/schema.sql` (le schéma
n'a pas changé depuis 770f1c4) ; gardée par son md5 ; **appliquée avec
l'accord du propriétaire, Opus fermé**. **La base d'abord, puis `git pull`**
: les écritures de l'application actuelle passent sous les droits de colonne
(mesuré, DECOUPAGE-15) ; l'essai « version actuelle contre base migrée » se
fait sur un arbre de travail séparé à `a3c910d`.

### 3.10 Ce qui se vérifie, et ce qui ne se vérifie pas

Se vérifie ici : schéma rejoué deux fois, essais 49 et 50 réécrits, cas
d'argent des deux côtés (0 écart), deux sessions sur la réduction, contrôles
éprouvés en cassant, paquets iOS et Android, `mesure-devis` (carte, pied
d'une rangée à 320 et 375, garde), vraie base par le chemin de
l'application avec des comptes jetables.

Ne se vérifie pas ici : le clavier sous la carte « Conditions », la virgule
du pavé décimal pour un pourcentage, le ressenti.

---

## 4. Le sous-lot 2b — ce que le devis doit dire

Chaque fait naît AVEC son lecteur : `motifs_refus_remise()` (« Ce qu'il
manque pour remettre ce devis », affiché dans la carte « Conditions »).

- **Pour qui** — quatre cas, la question posée SOUS le client (« Ce client
  commande : pour lui-même · pour son entreprise, dans son métier · pour son
  entreprise, hors de son métier (5 salariés au plus) · pour une association
  ou une copropriété ») ; le troisième est traité comme un consommateur hors
  établissement (L. 221-3) ; `clients.type` = particulier propose le premier,
  entreprise ne propose RIEN ; la proposition est une phrase avec
  « Confirmer », jamais une pastille cochée ; changer de client remet la
  question « à confirmer » dans la même écriture ; la date du choix est posée
  par la base ; `LIENS_DU_DEVIS` joint `client:client_id(nom, type)`
  (DROIT-3, ECRAN-9). La contradiction est dans le plan lui-même
  (PLAN:553-558 contre PLAN:2925) : le plan est corrigé.
- **Urgence** — sur une ligne `poste` (l'option : J), **jamais conditionnée
  à l'origine du devis** (PLAN:3199 : une urgence arrive aussi par
  téléphone) ; proposée allumée sur un devis venu d'une urgence, jamais
  exigée ; chaque ligne naît éteinte ; date de marquage posée par la base ;
  aide sur « strictement nécessaire » et sur l'abus de faiblesse
  (L. 121-9 5°) ; la garde vit dans `recalcule_devis` (déjà dans les listes
  fermées) avec **OP027** (ECRAN-7, DECOUPAGE-2, DROIT-4, BASE-14).
  L'échéance de l'acompte en découle : « à la signature » seulement si
  TOUTES les lignes chiffrées sont d'urgence, sinon tout l'acompte au plus
  tôt le 8e jour (DROIT-2, la garde de PLAN:2871 ; sans répartition par
  ligne).
- **Garantie décennale** — nommé d'après sa conséquence (« Peut engager ma
  garantie décennale »), jamais « construction » seul ; À DÉCIDER (P) : une
  valeur du devis avec une exception par ligne, ou un marqueur par ligne qui
  reprend celui de la précédente ; seulement sur `poste` et `option`
  (`devis_ligne_forme_check` étendue, BASE-13) (ECRAN-8, DROIT-12).
- **Devis payant** — trois choix : gratuit (un interrupteur qui écrit 0),
  payant (un montant, jamais 0), « je ne le dis pas » (`null` = motif de
  refus) ; l'imputation (« en plus des travaux » / « déduit si accepté ») ;
  pas de « TTC » en franchise ; la borne des tarifs du lot T (100 000
  centimes) ou sa raison ; `prixDuDevisPropose(tarifs, regime)` avec les
  cinq états des tarifs ; l'aide dit le cas des services à la personne
  (arrêté du 17/03/2015, art. 6) (DROIT-9, ECRAN-14).
- **Déchets** — APRÈS avoir recopié D. 541-45-1 et L. 541-21-2-3 depuis
  Légifrance : jardinage, l'exception PEMD, une question par devis qui dit si
  la mention est due, le coût rattaché à une ligne, les rubriques du décret
  (DROIT-8) ; la classe de blancs est réglée avant (une seule source).
- **Les motifs** : `motifs_refus_remise(p_devis)`, la seule autorité ; les
  amendements de D4-c (sa forme resserrée écrite : elle interdit encore
  `quote_request_id`, `sos_request_id`, `source`, `'qr'`, `'visite'`,
  `'dossier'`), de B-22 et des listes de `verifier-legal` et
  `verifier-emetteur` **naissent en 2b, avec elle** (DECOUPAGE-5) ; acompte
  sans nature, réduction ou acompte ramenés, validité absente sur un devis
  qui la demande, régime ↔ taux, SIREN du client professionnel absent, RGE
  conditionnel, délai obligatoire hors établissement (DECOUPAGE-9).
- **La « construction neuve » et le moment de la signature** sont posés en
  2b comme faits du devis (avec la confirmation qui dit le risque et sa
  trace datée, PLAN:2894 — DROIT-12, DROIT-15, DECOUPAGE-6), pour que le
  gabarit de 2c ne dépende d'aucun défaut.

## 5. Le sous-lot 2c — le document et sa remise

Comme la v1 (§4 et §5), avec : **le PDF naît dans `preparer_remise_devis`
avec son numéro**, jamais avant ; aucun aperçu partageable ; `expo-print`
seul, derrière `requireOptionalNativeModule` ; le partage par `Share` de
React Native sur iPhone ; « Document d'essai — sans valeur » tant que
`STATUT = 'essai'` ; la forme de l'instantané `em_`/`cl_` fixée avant le
gabarit (DECOUPAGE-6) ; la décision D12 sur l'attestation ; l'annexe 2 de
l'arrêté ; l'accord pour le support durable et le PDF avant signature
(PLAN:2899) ; `devis_remis_complet_check` ; OP003 connu de
`estUnRefusDefinitif` ; `libelleTotal` au régime FIGÉ ; les changements de
`legal.js` et la Base Adresse (même `VERSION`) ; les essais SQL dans
`npm run verifier` avant de figer quoi que ce soit (DECOUPAGE-9, -11).

**Au juriste, avant le premier vrai devis** : `droit.md` §8, plus ce que la
critique a ajouté — l'assiette de la retenue et la retenue sur un acompte
d'avance ; L. 214-2 (intérêts sur les sommes versées d'avance) rattachée à
L. 214-3 ; la qualification de l'« Offert » (J6, qui décide si le total
avant réduction compte sa valeur, DROIT-16) ; l'urgence sur une option ;
le texte des arrhes, réciproque (R. 212-2 2°) et « après le délai de
rétractation » (L. 221-24) ; L. 112-1-1 pour une réduction sur un devis
(question ouverte, pas une obligation probable, DROIT-18).

---

## 6. Les questions au propriétaire

### 6.0 Ses réponses, le 03/11/2026

| question | réponse, mot pour mot quand elle n'est pas un choix proposé |
|---|---|
| 1 — le PDF | « le pdf est generer au moment de mettre le numero mais il faut un apercu avant de valider le pdf pour pouvoir voir si tout est corect la mise en page etc mais pas forcement en pdf il faut que se soit le format final mais encore modifiable on peut lui ajouter une mention dessus pour ne pas limprimer ou autre » |
| 2 — la réduction | **« Réduction », en % ou en €, au choix** |
| 3 — l'acompte | **au choix, % ou €** ; la nature à chaque devis, sans défaut ; sur le total hors options |
| 4 — la validité | **pastilles 15 · 30 · 60 · 90 jours + « Autre »**, rien de pré-choisi, à compter de la date du devis |

Ce que la réponse 1 change : **le PDF ne naît qu'avec son numéro** (la
règle du plan tient), **et un aperçu AVANT**, au format final, dans
l'application, qui ne sort pas du téléphone et dit qu'il n'est pas le
devis. Comment le montrer — une vue web dans l'application (un module natif
de plus dans la reconstruction), le PDF du cache affiché sans porte de
sortie, ou des composants React Native — est mesuré dans
`scratchpad/lot2/apercu/` avant de reposer la question 5.

**Maintenant (elles décident de 2a) :**

1. **Le PDF** : il n'existe qu'avec son numéro, au moment de remettre le
   devis (recommandé : c'est la règle du plan) — ou un aperçu PDF avant,
   marqué « APERÇU », sans zone de signature ?
2. **La réduction sur le total** : le mot (« Réduction » recommandé), et sa
   forme : en %, en €, ou au choix ?
3. **L'acompte** : en %, en €, ou au choix ? (Sa nature — acompte ou arrhes —
   se choisit à chaque devis, sans défaut ; il porte sur le total hors
   options.)
4. **La validité** : des pastilles 15 · 30 · 60 · 90 jours + « Autre », rien
   de pré-choisi, comptée à partir de la date du devis ?
5. **La reconstruction** : maintenant (icône, nom « Opus » sous l'icône,
   `expo-print`, et l'écran de lancement si vous le voulez), ou plus tard en
   une fois avant 2c ?

**Plus tard (2b et 2c)** : la garantie décennale par devis ou par ligne ; le
format du numéro ; le régime réel tant que les taux réduits ne sont pas
certifiés ; le logo ; recopier depuis Légifrance le formulaire de
rétractation (annexe R. 221-1), D. 541-45-1 et L. 541-21-2-3 ; le plafond de
20 devis par demande (OP017).

---

## 7. Ce que ce cahier ne fait pas

Inchangé depuis la v1 (§7), avec une correction (DROIT-1) : **les DATES**
(J+7, J+14) attendent une signature enregistrée (lot 4) ; **la RÈGLE**
(« au plus tôt le 8e jour après la signature ») est du lot 2 — affichée dès
2a, imprimée en 2c.

---

## Annexe A — constat → décision

| constat | verdict | ce que la v2 en fait |
|---|---|---|
| BASE-1 | en partie (important) | §2.3 : montants posés par `tient_le_devis` ; phrase corrigée |
| BASE-2 | confirmé | §2.4 : une paire = une écriture ; nature réduite à la liste ; « sans nature » = motif 2b |
| BASE-3 | confirmé | §2.4 : `devis_acompte_une_forme_check` |
| BASE-4 | confirmé | §3.2 : remise à zéro complète + `devis_tva_vide_check` |
| BASE-5 | confirmé | §2.5 : numeric / BigInt, bords écrits, cas > 2^53 |
| BASE-6 | en partie (mineur) | §2.6 : plafond sur le brut des deux côtés |
| BASE-7 | confirmé | §3.7 : liste de ce qui rougit, avec raison |
| BASE-8 | confirmé | §3.2 : sans objet en 2a (aucun booléen), joueur changé en 2b |
| BASE-9 | confirmé | §2.2 : pas d'`update(devis_id)` ; trois cas réécrits |
| BASE-10 | confirmé | §2.1 : droits remplacés en place en 49.7 ; pas de section 54 |
| BASE-11 | confirmé | §2.3 : les trois conditions écrites |
| BASE-12 | en partie | §2.3 : la migration ne recalcule rien |
| BASE-13 | confirmé | §4 : `devis_ligne_forme_check` étendue (2b) |
| BASE-14 | confirmé | §4 : garde dans `recalcule_devis`, OP027 (2b) |
| BASE-15 | confirmé | §3.2 : total toutes options comprises, écrit une fois |
| BASE-16 | confirmé | §1 et §2.2 : relevé précisé, preuve par le catalogue |
| ECRAN-1 | confirmé | §3.1 : pied d'une rangée, détail dans la ventilation |
| ECRAN-2 | confirmé | §3.1 : carte plein écran ; la retenue y déménage |
| ECRAN-3 | en partie | §3.4 : la garde lit la carte, le contrôle EXIGE la lecture |
| ECRAN-4 | confirmé | §2.4 : paires en un appel ; plus jamais `ok: true` silencieux |
| ECRAN-5 | en partie | §3.4 : huit points nommés, aller-retour exécuté |
| ECRAN-6 | confirmé | §3.3, §3.5 : `totauxDevis(lignes, conditions)`, démo qui recalcule, cas d'ordre |
| ECRAN-7 | confirmé | §4 : urgence jamais conditionnée à l'origine (2b) |
| ECRAN-8 | confirmé | §4 : question P, nom d'après la conséquence (2b) |
| ECRAN-9 | en partie | §4 : la question sous le client, 4 cas (2b) |
| ECRAN-10 | confirmé | §2.7 : `libellesDesTotaux(regime)` |
| ECRAN-11 | confirmé | §2.4, §3.3 : `{ demande, effectif, borne }`, montré |
| ECRAN-12 | confirmé | §2.8 : « Réduction » (question 2) |
| ECRAN-13 | en partie | §3.3 : « ,5 », `versPourcentDeDevis`, pastilles ; contrôles qui lisent la 49 (§2.1) |
| ECRAN-14 | confirmé | §4 : trois choix, cinq états, borne du lot T (2b) |
| ECRAN-15 | en partie (mineur) | §3.4 : phrases qui nomment le champ |
| ECRAN-16 | en partie | §3.4, §3.6 : constantes, `FICHIERS_DU_MODULE`, « un an » |
| ECRAN-17 | confirmé | §3.4 : réduction lue positive, aides courtes |
| ECRAN-18 | en partie | §3.4 : « réduction comprise » |
| DROIT-1 | en partie (important) | §3.1, §7 : la règle affichée en 2a, imprimée en 2c, sans colonne |
| DROIT-2 | en partie | §4 : « à la signature » seulement si toutes les lignes sont d'urgence |
| DROIT-3 | confirmé | §4 : quatre cas, L. 221-3, plan corrigé (2b) |
| DROIT-4 | en partie | §4 : urgence sur `poste`, option au juriste, abus de faiblesse |
| DROIT-5 | confirmé | §2.7, question 2 : jamais « HT » en franchise, effet TTC montré |
| DROIT-6 | confirmé | §3.2 : total toutes options comprises ; réduction jamais sur une option |
| DROIT-7 | en partie | §3.1 : « avant la retenue de garantie » ; L. 214-2 au juriste |
| DROIT-8 | confirmé | §4 : déchets en 2b, après les textes recopiés |
| DROIT-9 | confirmé | §4 : devis payant en 2b, trois choix, imputation |
| DROIT-10 | en partie | §3.1, §5 : texte réciproque au juriste, imprimé en 2c |
| DROIT-11 | confirmé | §3.1 : l'acompte du devis seule source ; avis |
| DROIT-12 | en partie | §4 : nom d'après la conséquence ; confirmation et trace de la construction neuve |
| DROIT-13 | en partie | §3.1 : proposée et confirmée, pastilles |
| DROIT-14 | en partie | §2.4 : jamais par contrainte ; valeur effective montrée ; motif en 2b |
| DROIT-15 | en partie (mineur) | §4 : les deux faits posés en 2b |
| DROIT-16 | confirmé | §5 : suspendu à J6 |
| DROIT-17 | confirmé | §3.1 : avis 41 250 €, seuil à relire |
| DROIT-18 | en partie | §5 : questions ouvertes au juriste |
| DECOUPAGE-1 | confirmé | §0, question 1 : PDF seulement avec son numéro (proposé) |
| DECOUPAGE-2 | en partie (important) | §4 |
| DECOUPAGE-3 | en partie (important) | §2.1 : 2a étend la section 49 ; `colonnesDe` lit les `add column` |
| DECOUPAGE-4 | confirmé | §2.2, §3.7 |
| DECOUPAGE-5 | en partie | §4 : amendements avec `motifs_refus_remise`, en 2b |
| DECOUPAGE-6 | confirmé | §4, §5 : faits en 2b, instantané fixé avant le gabarit |
| DECOUPAGE-7 | confirmé | §0 : cinq faits passent en 2b |
| DECOUPAGE-8 | confirmé | §3.1, §3.2 |
| DECOUPAGE-9 | confirmé | §4, §5 : affectés |
| DECOUPAGE-10 | confirmé | §0 : `expo-print` seul, `Share` intégré |
| DECOUPAGE-11 | confirmé | §3.8 |
| DECOUPAGE-12 | confirmé | §0 : la colonne « ce qu'il demande avant » corrigée |
| DECOUPAGE-13 | confirmé | §2.8 |
| DECOUPAGE-14 | en partie (mineur) | §2.9 : D11 changé, dit |
| DECOUPAGE-15 | confirmé | §3.9 |
