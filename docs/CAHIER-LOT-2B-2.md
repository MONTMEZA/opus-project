> **Cahier de l'étape 2b-2 du module devis — « à quel titre », le chantier
> neuf, et le n° de TVA déclaré sur l'honneur.**
>
> **Archivé le 10/11/2026, à la fin de l'étape 2b-2.** Ce cahier (v3, 09/11
> au soir : le v2 plus les réponses du propriétaire à P1, P2, P4 et P5) a
> guidé l'étape ; il est versé ici TEL QU'IL A SERVI, sans une retouche,
> sous le trait qui suit cet en-tête. **En cas de désaccord, la
> section « À quel titre, le chantier, la TVA déclarée — étape 2b-2 » de
> CLAUDE.md et le code disent vrai.** Ce qui a changé depuis sa rédaction :
>
> - **T1, le seul défaut grave de la relecture adverse du 10/11.** Son
>   annexe A.7 fait dire aux textes légaux « Vous pouvez retirer votre
>   déclaration à tout moment », et son annexe A.5 donne à `rien_a_retirer`
>   « Il n’y a plus de déclaration à retirer… ». Les deux étaient faux :
>   quand VIES reconnaît ensuite le MÊME numéro, la déclaration reste jointe
>   à sa preuve (son §2.7 le décide), le retrait ne la touche pas, et elle
>   reprend effet si VIES le refuse de nouveau. Le code dit désormais qu'on
>   la retire « tant que c’est elle qui fait imprimer ce numéro sur vos
>   devis » (`src/data/legal.js`, « Une décision automatique »), avec un
>   `rien_a_retirer` réécrit (`src/lib/tva.js`) — commit `06ed217`. Permettre
>   de la détacher reste une décision du propriétaire (`docs/PLAN-DEVIS.md`
>   10.20).
> - **Des écarts dits par la construction, où le code fait foi** :
>   `sans_engagement` dit « Cochez la déclaration pour que ce numéro soit
>   enregistré. » (« pour enregistrer » contient « registre », que le
>   contrôle de vocabulaire refuse dans `tva.js`) ; « Pourquoi » porte une
>   finalité de plus (compter les contrôles restés sans réponse, pour P5) ;
>   un refus RETENU porte aussi la date d'une déclaration qui reste ;
>   `pourQuiValable` compare les identifiants sans la casse ; quand une
>   association répond « Oui » au chantier neuf, l'aide du chantier neuf
>   l'emporte sur celle de la prudence ; `devis.js` écrit « € » une seule
>   fois, dans l'amende de la confirmation ; il y a 34 fichiers d'essais,
>   pas 31 ; les sabotages S24 et S45 sont vus par `verifier-emetteur` et
>   `verifier-devis`, pas par `cas-remise --verifier`, qui rejoue la base et
>   ne voit pas le miroir ; le cas 14 c de l'essai 49-remise a été renforcé,
>   et le cas 23 bis ajouté à l'essai 48.
> - **Les fichiers qu'il cite** (`critique/droit.md`, `critique/base.md`,
>   `critique/ecran.md`, `pourqui.md`, `neuf.md`, `tva.md`, `lot2b/avant/`…)
>   et les noms de constats (`E-I…`, `B1`, `M6`…) étaient des documents de
>   travail de la session : ils ne sont pas dans le dépôt. Ses numéros de
>   ligne datent de `f4d1524`.
> - **Vérifié avant la copie** : il ne contient aucune donnée personnelle du
>   propriétaire (ni nom, ni SIREN, ni numéro de TVA, ni adresse e-mail), et
>   aucune barre oblique inverse ni caractère invisible ; rien n'a donc été
>   remplacé.

---

> **v3 = v2 + les réponses du propriétaire du 09/11/2026 au soir, toutes
> conformes à la recommandation : P1 « Oui, bloquer » (le motif
> `devis_pour_qui` existe, 7e règle d'Opus) ; P2 « Oui, ces deux questions »
> (libellés et textes de l'annexe A.4) ; P4 « Oui, cette phrase » (conditions
> d'utilisation, « Ce qui est interdit ») ; P5 « Oui, après 3 essais sans
> réponse » (la déclaration est aussi proposée quand VIES n'a pas répondu à
> trois contrôles du même numéro, le premier et le dernier séparés d'au moins
> une heure, dans les dernières 24 heures, comptés par la fonction Edge ; un
> blocage d'Opus par VIES ne compte pas). C'EST LE CAHIER QUI SERT À
> CONSTRUIRE. Rien d'autre n'est demandé au propriétaire avant la migration.**

# Étape 2b-2 du module devis — « à quel titre » le client commande, le chantier neuf, et le n° de TVA déclaré sur l'honneur — cahier v2 (09/11/2026)

> **Document de travail. Rien ne se construit avant les réponses du
> propriétaire à P1, P2, P4 et P5 (§1.3).** Relevé sur `f4d1524` (HEAD du
> 09/11/2026 ; son code est celui de `9c5ac7c`, seul `docs/A-FAIRE.md` a
> changé — ses numéros de ligne ont bougé, ce cahier le cite donc par titre
> de section). **Le CODE fait foi.**
>
> **v2 = le v1 + les trois critiques adverses** (`critique/droit.md`,
> `critique/base.md`, `critique/ecran.md`), chaque constat vérifié dans le
> code ou les textes avant d'être appliqué, puis tranché : l'annexe C donne
> une ligne par constat. Méthode **« Accélérer »** (décision du 08/11) : il
> n'y aura PAS de nouvelle critique du cahier ; la relecture adverse unique
> portera sur le CODE construit.
>
> **ÉTABLI** = lu dans le code ou mesuré ; **DÉDUIT** = raisonné, pas
> mesuré ; **(P)** = au propriétaire ; **(J)** = au juriste. Ce document ne
> contient aucune barre oblique inverse : là où le code porte la séquence
> d'échappement d'une espace insécable, il le dit en mots (« la séquence de
> l'espace insécable »), parce que l'outil d'édition l'a déjà changée en
> caractère invisible (annexe B, point 11).

### Ce qui a changé depuis le v1, en bref

1. « Pour qui » s'appelle **« À quel titre ? »** (« Pour qui ? » nomme déjà le choix du client) ; les quatre réponses sont dans l'**ordre protecteur**, celle qui retire des mentions en DERNIER, avec « Dans le doute, choisissez une autre réponse : c'est la plus sûre ».
2. Le bloc « À quel titre ? » a une **hauteur fixe** (gabarits, comme la ligne « Pour le remettre »), et un bouton qui ÉCRIT n'apparaît jamais là où était un bouton qui n'écrit pas.
3. Les deux questions sur le neuf vivent dans une **carte plein écran « Le chantier »**, ouverte par UNE rangée de hauteur fixe posée avant « Conditions », jamais au-dessus des lignes.
4. Le motif `devis_taux_reduit_neuf` passe en **« Par prudence »** jusqu'au lot 3, sa phrase sous 200 caractères, la consigne d'abord, avec un second bouton « Revoir « Le chantier » ».
5. Le filtre « pour son entreprise » **garde** les deux adresses `conso_adresse_*` (R. 123-237 ouvert) ; pour une association, une copropriété, une société civile, les mentions dues à un particulier passent en **« Par prudence »**.
6. La déclaration sur l'honneur : une écriture VIES sur le **même** numéro **garde** la déclaration ; une action **« retirer »** ; le téléphone envoie le **texte** qu'il a montré ; une déclaration posée hors de la fonction Edge sur un vrai compte est **refusée** ; l'export ne dit jamais « reconnu » pour une déclaration.
7. Après un refus de VIES, l'écran ne dit plus « il ne s'imprimera pas » au-dessus d'une case qui promet le contraire ; le bloc de déclaration vient **sous** le bouton VIES ; « déclaré » s'affiche en vert, pas en rouge.
8. Plus aucun état « enregistrement… » qui survit à un échec : tout ce qui est « en route » se **calcule à chaque rendu** depuis la file.
9. Les textes de droit corrigés : le bâtiment récent (B1), la base légale de `legal.js` (B2), l'« activité principale » (B3), les deux « seul » contradictoires (B4), et dix points importants.
10. **Une question nouvelle (P5)** : proposer la déclaration quand VIES ne répond pas, après trois contrôles sans réponse en plus d'une heure. P3 n'est plus posée (« Règle d'Opus » gardée).

---

## 0. En une page

**Ce que 2b-2 fait** — trois choses, toutes dans un brouillon ou dans « Mon
entreprise » :

| | ce que l'artisan voit | ce que la base garde |
|---|---|---|
| **A. Le n° de TVA que VIES refuse** | dans « Mon entreprise », après un refus de VIES (et, si P5 = oui, après trois contrôles sans réponse en plus d'une heure), sous le bouton VIES : « Vous êtes sûr de ce numéro ? » et une case « Je certifie sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à mon entreprise. » ; le numéro s'imprime alors sur ses devis ; il peut retirer sa déclaration | une preuve `source = 'declaration'`, le texte coché (celui que l'écran a montré) et sa date, posés par la base |
| **B. À quel titre le client commande** | sous le choix du client, un bloc à hauteur fixe ; une fiche « particulier » PROPOSE « à titre privé », un appui confirme ; sinon une feuille à quatre réponses | `devis.pour_qui` et le client pour lequel la réponse a été donnée |
| **C. Le chantier** | une rangée « Le chantier » avant « Conditions », qui ouvre une carte : deux questions indépendantes, « pour les droits de votre client » et « pour la TVA » | deux réponses ; la date de confirmation du premier « Oui » |

Et dans « Ce qu'il manque pour remettre ce devis » : **deux motifs**
(`devis_pour_qui` si P1 = oui ; `devis_taux_reduit_neuf`), et pour un client
qui commande « pour son entreprise, dans son activité principale », **les
mentions dues à un particulier ne comptent plus, sauf les deux adresses**.

**Ce qu'elle ne fait PAS** : rien n'est remis, imprimé ni numéroté (2c) ;
aucune question sur le moment de la signature (décision du 09/11) : le cas le
plus protecteur vaut pour tous les devis ; pas de signature par le client
dans Opus (lot à part, après 2c).

**Choix techniques tranchés (§1.2)** : la déclaration et son retrait sont deux
ACTIONS de la fonction Edge `tva` ; la réponse « à quel titre » est LIÉE au
client à qui elle a été donnée ; **aucune fonction `security definer` ni
aucun déclencheur nouveaux, aucun code `OP` nouveau** — `OP028` reste libre
pour 2b-3. Quatre fonctions existantes changent, plus `mes_donnees()` (I5).

**L'ordre de livraison** : la base (migration gardée par son md5, Opus fermé)
→ la fonction Edge `tva` v2 → `git pull`. Les commits de l'étape portent « NE
PAS FAIRE `git pull` AVANT LA MIGRATION 2b-2 ».

**Quatre questions au propriétaire (§1.3)**, chacune avec ma recommandation.

---

## 1. Les décisions, et ce qui reste à demander

### 1.1 Ce que le propriétaire a décidé (ÉTABLI, `docs/PLAN-DEVIS.md` 10.18-10.19)

| décision | ce qu'elle impose ici |
|---|---|
| la déclaration sur l'honneur, par une case à cocher, phrase exacte | datée par la base, gardée comme preuve ; le numéro s'imprime ; Opus dit **à l'artisan seul** que VIES ne le reconnaît pas ; il peut le faire recontrôler ; forme, clé et SIREN restent contrôlés ; la phrase « Aucune vérification par un humain n'existe encore pour cette décision » se réécrit (`VERSION`) |
| « pour qui » : Opus propose, l'artisan confirme | rien n'est déduit de `clients.type`, qui ne choisit que la PHRASE de la proposition |
| SCI, syndic, association sans activité professionnelle : comme un particulier | toutes les mentions dues à un particulier ; Q-J5 reste au juriste |
| pas de question sur le moment de la signature | `PAS_ENCORE_VERIFIE` garde « le moment de la signature » |
| TVA à 10 % et 5,5 % : « Tout permettre » ; 2b-2 ajoute « taux réduit sur un immeuble neuf » | la seule exception : un motif quand l'artisan dit lui-même que ses travaux font partie d'un chantier qui crée un bâtiment neuf |
| les six règles d'Opus ; « Règle d'Opus » gardée pour `conso_tva_intra` (05/11) | `devis_delai` reste ; P3 du v1 n'est pas posée |
| « garder la grande place » (D-A bis) | les gabarits de la ligne ne changent pas ; le bloc « À quel titre ? » et la rangée « Le chantier » ont, eux aussi, une hauteur fixe |
| « Accélérer » | une seule relecture adverse, du code |

### 1.2 Ce que ce cahier tranche lui-même (choix techniques)

| choix | raison | écarté |
|---|---|---|
| **A : deux actions de la fonction Edge `tva`, `declarer` et `retirer`** | un seul écrivain de `preuves_tva` (`schema.sql` l. 12422-12425) ; elle seule peut exiger qu'une réponse de VIES ait eu lieu — le refus retenu est rangé sous une empreinte HMAC de la clé de service (`index.ts` l. 272-291), que PostgreSQL ne sait pas recalculer ; aucune fonction `definer` ni liste fermée à rouvrir | une fonction SQL `security definer` : elle ne peut pas savoir que VIES a répondu, et rouvre deux listes fermées (la raison « sa date restait celle de 2001 » du v1 est retirée : elle valait pour l'ancien déclencheur, pas pour celui de §2.7 — critique base M1) ; des colonnes sur `emetteur` : modifiables par le client ; une table historisée : une table neuve de plus pour une trace que 2c figera sur chaque devis remis |
| **B : la réponse est liée à son client** (`pour_qui_client`) | la base ne MODIFIE jamais ce que le téléphone a envoyé : aucune course avec la fusion des écritures de la file ; un renvoi tardif de la réponse, après un changement de client, porte l'ANCIEN client et ne vaut rien (critique base §4, un argument de plus) ; revenir au client d'avant rend la réponse valable | une remise à vide par `tient_le_devis()` : dans un `before update`, « renvoyé égal » et « pas envoyé » ne se distinguent pas (`pourqui.md` §3.1) |
| **C : deux questions** (droits du client, TVA) | leurs « Oui » vont en sens inverse : le premier RETIRE des protections (confirmation), le second AJOUTE une garde ; avec une seule, l'artisan qui fuit la confirmation répond « Non » partout et le motif TVA ne sort jamais | une seule question |
| **C : une carte plein écran, ouverte par une rangée** | les questions et leurs aides font de l'ordre de 440 points (critique écran E-I7, mesuré par les avances d'Inter) : posées dans l'en-tête, elles poussent les lignes d'un écran entier à chaque ouverture | dans l'en-tête ; dans « Conditions » (deux sujets dans une carte) |
| **pas de date pour « à quel titre »** | une date sans lecteur est le « bouton §18 » ; 2c fige ce qu'il faut | — |
| **une date pour le « Oui » du chantier** | elle a des lecteurs : la carte (« confirmé le … »), l'aide de l'acompte, l'aperçu de 2c | — |
| **le petit professionnel garde toutes les mentions d'un particulier, même avec « Oui » au chantier neuf** | par prudence, une branche de moins ; les phrases le disent (« sauf pour un bâtiment neuf… ») | le filtrage exact (`A-FAIRE`) |
| **pas de déclaration après `bloque`** | un blocage d'Opus par VIES n'est ni un refus ni une saturation : il ne dit rien du numéro, et il dure | `A-FAIRE` |

### 1.3 Les questions au propriétaire — le moins possible

Chacune est écrite pour lui, en clair, avec ce que je recommande.

**P1 — Faut-il empêcher de remettre un devis tant qu'on n'a pas dit à quel
titre le client commande ?**
> Sur chaque devis, vous direz à quel titre votre client commande : à titre
> privé ; pour une association, une copropriété ou une société civile ; pour
> son entreprise. Quand votre carnet le range parmi les particuliers, Opus
> vous propose « à titre privé » : un appui suffit. Tant que vous n'avez pas
> répondu, Opus compte, par prudence, tout ce qu'on doit à un particulier.
> La question : faut-il EN PLUS empêcher de remettre le devis tant qu'il n'y
> a pas de réponse ? Ce serait une 7e « règle d'Opus », plus stricte que la
> loi.
- **Recommandé : oui.** Un appui pour un particulier ; et sans réponse, le
  devis remis en 2c imprimerait le formulaire de rétractation même pour un
  autre artisan qui vous sous-traite un chantier — un droit que vous lui
  donneriez sans que la loi le demande.
- Autre réponse : non (rien ne bloque ; sans réponse, tout est compté comme
  pour un particulier). Alors le motif `devis_pour_qui` n'existe pas (§2.5,
  §3.1).

**P2 — « Le chantier » : ces deux questions, avec ces mots ?**
> Une rangée « Le chantier », juste avant « Conditions », ouvre une page avec
> deux questions qui ne dépendent pas l'une de l'autre :
> 1. « Pour les droits de votre client » — « Ce devis porte-t-il sur la
>    construction d’un bâtiment neuf, ou sur la transformation importante
>    d’un bâtiment existant ? » — « Non » par défaut. « Oui » retire au client
>    ses 14 jours pour changer d'avis : Opus vous demande de le confirmer, et
>    garde la date.
> 2. « Pour la TVA » — « Ces travaux font-ils partie d’un chantier qui crée
>    un bâtiment neuf ? » — « Non » par défaut. « Oui » interdit le taux
>    réduit : une ligne à 10 % ou 5,5 % empêchera de remettre le devis.
>
> Les textes d'aide et de confirmation sont à l'annexe A.4.
- **Recommandé : oui, ces deux questions et ces textes.**
- Autre réponse : changer un mot (seuls les textes bougent).

**P4 — Que risque une fausse déclaration ? (texte des conditions
d'utilisation, qui vous engage)**
> À ajouter à « Ce qui est interdit », sur le modèle de la phrase sur le
> SIRET : « Déclarer sur l’honneur un numéro de TVA qui n’est pas celui que
> l’administration fiscale a attribué à son entreprise : le compte peut être
> fermé. »
- **Recommandé : oui, cette phrase.** Autre réponse : ne rien écrire.

**P5 — Quand VIES ne répond pas, faut-il quand même proposer la
déclaration ?**
> VIES, le service européen qui contrôle les numéros de TVA, est souvent
> saturé pour la France : le 20/10, 16 appels sur 19 n'ont pas eu de réponse.
> Aujourd'hui, la déclaration sur l'honneur n'est proposée qu'après un REFUS
> de VIES ; s'il ne répond pas, l'artisan doit réessayer plus tard. C'est
> votre crainte : « il ne peut pas faire son devis ».
>
> Ma proposition, précise : la déclaration est aussi proposée quand VIES n'a
> pas répondu à **trois contrôles** du même numéro, **le premier et le
> dernier séparés d'au moins une heure**, dans les dernières 24 heures.
> C'est Opus qui compte, sur ses serveurs, les vraies absences de réponse
> (chaque contrôle essaie déjà quatre fois) : le téléphone ne peut pas le
> prétendre. Un blocage d'Opus par VIES ne compte pas. Le numéro déclaré
> pourra être recontrôlé quand VIES répondra.
- **Recommandé : oui, cette règle.** Rien ne se remet avant 2c : attendre une
  heure ne bloque aucun devis aujourd'hui, et en janvier un artisan
  n'attendra pas beaucoup plus d'une heure quand VIES est saturé (DÉDUIT :
  trois contrôles d'au plus quatre requêtes chacun tiennent sous la limite
  de 24 requêtes par heure et par compte).
- Autre réponse : non (après un refus seulement ; l'écran dit alors pourquoi
  la déclaration n'est pas proposée et invite à réessayer).

**Ce qui n'est PAS demandé** : P3 du v1 (« Règle d'Opus » gardée, décision du
05/11) ; le motif pour un logement achevé depuis moins de deux ans (`neuf.md`
P4) et l'avis « chantier neuf, TVA vide, taux réduit » (`neuf.md` P5), notés
dans `A-FAIRE` (§7).

### 1.4 À dire au propriétaire, pas à lui demander

1. **Votre propre numéro** : ne cochez la case que si **votre espace
   professionnel sur impots.gouv.fr** montre ce numéro, ou un courrier de
   votre service des impôts. Un numéro qui se calcule depuis le SIREN n'est
   pas un numéro attribué (mesuré le 20/10). Une déclaration faite sur votre
   vrai compte vous engage pour de vrai — et vous pouvez la retirer.
2. **Les brouillons de la vraie base** (3 au relevé du 08/11) gagneront le
   point « Dites à quel titre ce client commande » s'ils ont un client (si
   P1 = oui) : c'est voulu (un fait de 2b naît vide).
3. **Un client qui commande pour son entreprise, dans son activité
   principale,** n'aura plus les mentions dues à un particulier — dont le
   n° de TVA — sauf l'adresse de votre établissement ou de votre siège, par
   prudence (une question est ouverte chez le juriste). Un numéro refusé par
   VIES ne bloquera plus un devis à ce client (sous réserve du juriste, J3).
4. **Pour une association, une copropriété ou une SCI, Opus fera comme pour
   un particulier** : vous leur laisserez 14 jours pour changer d'avis, et
   ne recevrez rien avant le 8e jour, alors que la loi ne le demande
   peut-être pas — c'est la question posée au juriste (J5). Les points
   concernés portent « Par prudence », pas « La loi ».
5. **Quand VIES bloque Opus tout entier** (rare), la déclaration n'est pas
   proposée ; elle revient quand VIES répond.
6. **La démonstration** permet de répondre « pour son entreprise » sur
   n'importe quel devis, et de choisir la SCI du carnet ; elle ne montre pas
   l'avis du SIRET d'un client (aucune fiche « Entreprise » sans SIRET).

### 1.5 Au juriste (n'empêche pas de construire : rien ne sort avant 2c)

- **J1** — La déclaration suffit-elle comme garantie de l'article 22 du RGPD ?
  (Et, si P5 = oui, la déclaration après trois contrôles sans réponse.) Si
  oui, « une révision par un humain des refus de VIES » (`A-FAIRE`) se ferme.
- **J2** — La responsabilité d'Opus, qui imprime sur la seule parole de
  l'artisan un numéro que VIES ne reconnaît pas ; un numéro **attribué mais
  refusé par VIES** peut-il figurer sur un devis (CGI 286 ter, non recopié) ;
  la qualification d'une fausse déclaration faite à une plateforme privée
  (C. pén. 441-7, non recopié — à savoir, pas à écrire à l'écran) ; la
  conservation de la déclaration après la suppression du compte face à un
  devis remis (2c).
- **J3** — Le n° de TVA sur un DEVIS à un professionnel (le filtre retire
  `conso_tva_intra` pour lui) ; R. 123-237 face à un artisan au seul RNE (les
  deux `conso_adresse_*` restent comptées en attendant).
- **J4** — Ce que L. 221-3 étend exactement au petit professionnel, et les
  deux exemples de la feuille (« une boulangerie qui fait refaire sa
  vitrine » ; « un autre artisan qui vous sous-traite une partie de son
  chantier »).
- **J5 (Q-J5)** — SCI, syndic, association traités comme un particulier.
- **J6 (Q-J23)** — Où commence la « transformation importante » ; un contrat
  d'un seul corps d'état sur une construction neuve est-il concerné ?
- **J7** — Le texte de la confirmation du « Oui » (annexe A.4), l'énoncé des
  sanctions, et le régime de paiement des contrats de construction du CCH
  (L. 231-1, L. 232-1, non recopiés), qu'un « Oui » couvre peut-être.
- **J8** — À 5,5 %, la certification porte sur le I de 278-0 bis A, pas sur
  le III ; les autres 5,5 % (bornes de recharge, photovoltaïque, CGI 278-0 bis
  N et P, non lus) restent-ils possibles sur un bâtiment neuf ? ; la reprise
  de ces articles dans le CIBS au 01/01/2027 (non lue).
- **J9 (2c)** — Imprimer la qualité du client sur le devis ? Affirmer
  l'absence de rétractation sur un chantier neuf, ou seulement omettre les
  blocs ?
- **J10** — La date à partir de laquelle le SIREN du client doit figurer sur
  une facture.
- **J11 (comptable)** — La liste et la proportion du second œuvre (le décret
  de 257 I 2 2° d, non lu) : l'aide écrit « la plus grande partie de chacun
  des éléments », ce qui va dans le sens prudent si le seuil réel est plus
  haut.

---

## 2. La base

Tout dans les sections existantes : 48 (la TVA), 46 (`emetteur_incomplet`),
49 (le devis), et l'export. Les colonnes de `devis` naissent **dans la
section 49** : `verifier-devis` la découpe du titre « 49. LE CHIFFRAGE » au
suivant.

### 2.1 Les colonnes de `devis` (49.4 ter)

```sql
alter table public.devis add column if not exists pour_qui               text;
alter table public.devis add column if not exists pour_qui_client        uuid;
alter table public.devis add column if not exists chantier_neuf_conso    boolean;
alter table public.devis add column if not exists chantier_neuf_conso_le timestamptz;
alter table public.devis add column if not exists chantier_neuf_tva      boolean;
```

- toutes **nullables, sans défaut** : un fait de 2b naît vide. Pour les deux
  booléens, `null` et `false` disent « Non » ; la base les lit par `is true`,
  jamais par `not x` ;
- **`pour_qui_client` n'a PAS de clé étrangère** : c'est un témoin, pas un
  lien. Une valeur qui ne vaut pas `client_id` rend la réponse sans effet ;
  la fiche d'un autre artisan ne peut jamais valoir `client_id` (OP013) ;
  après la suppression de la fiche, `client_id` passe à vide et la réponse
  est sans effet — rien à effacer ;
- noms interdits évités : ni `nature`, ni `regime_tva`, ni
  `taux_justification` ;
- **commentaires de colonne** (critique base I4) : `pour_qui` — « La réponse
  BRUTE à « À quel titre ? ». Elle ne vaut que si `pour_qui_client =
  client_id` (et `client_id` non vide) : toute lecture passe par cette
  règle. » ; `chantier_neuf_conso_le` — « Posée par la base quand la
  réponse DEVIENT vraie ; jamais écrite par le téléphone. ».

**La réponse VALABLE** — une règle, écrite UNE fois de chaque côté : `pour_qui`
quand `client_id is not null and pour_qui_client = client_id`, sinon vide.

### 2.2 La contrainte (49.5)

```sql
-- posée sous condition (pg_constraint) dans la migration
alter table public.devis add constraint devis_pour_qui_check
  check (pour_qui is null or pour_qui in
         ('consommateur', 'professionnel', 'professionnel_hors_activite', 'non_professionnel'));
```

La seule. Nom en `_check` pour `messageClair()` ; rangée dans
`CONTRAINTES_DEVIS` (`devis.js` l. 166) entre `devis_plafond_check` et
`devis_remise_check` ; sa phrase dans `erreurs.js` et `ECHEC_PAR_CONTRAINTE`
(annexe A.6). **Aucune contrainte ne nomme `client_id`** (D4).

### 2.3 Les droits (49.7)

`pour_qui`, `pour_qui_client`, `chantier_neuf_conso`, `chantier_neuf_tva`
entrent dans `grant insert (…)` ET `grant update (…)` de `devis`.
**`chantier_neuf_conso_le` jamais** : la base seule la pose. La migration
rejoue `revoke all … from anon, authenticated` avant les `grant`.

### 2.4 `tient_le_devis()` — la date du « Oui »

Un point de plus, après le point 1 (les textes) :

```sql
-- 1 bis. La date de la confirmation du chantier neuf (L. 221-2 12°), posée
--   par la base : à l'instant où la réponse DEVIENT vraie ; effacée quand
--   elle cesse de l'être ; gardée sinon. Une date envoyée est ignorée.
if new.chantier_neuf_conso is true then
  if tg_op = 'INSERT' or old.chantier_neuf_conso is not true then
    new.chantier_neuf_conso_le := clock_timestamp();
  else
    new.chantier_neuf_conso_le := old.chantier_neuf_conso_le;
  end if;
else
  new.chantier_neuf_conso_le := null;
end if;
```

**Rien pour `pour_qui`** (§1.2, B). Changer de client ne touche ni la réponse
ni le chantier. La forme ENTIÈRE de `tient_le_devis` est figée dans
`verifier-devis` : elle se réécrit dans le même lot. Son corps porte des
séquences de l'espace insécable : la migration applique la règle de
transport (§2.11). Mesuré par la critique base : la date ne s'écrit pas par le
téléphone (42501) et survit à la cascade `set null`.

### 2.5 `motifs_refus_remise()` (49.9) — deux motifs, un filtre, des natures

Signature et forme de retour **inchangées** (`create or replace`). Ce qui
change :

1. **la lecture nommée du devis** gagne `d.pour_qui, d.pour_qui_client,
   d.chantier_neuf_tva` (jamais `select *`) ; puis, **une seule fois** :
   ```sql
   v_valable := case when v_client is not null and v_pour_qui_client = v_client
                     then v_pour_qui end;
   ```
   et `v_valable` sert au rang 1, au filtre et aux natures (la règle écrite
   une fois, critique base I4) ;
2. **les lignes, toujours lues UNE fois**, et une clé par ligne fautive, dans
   l'ordre `ordre, id` — deux tableaux aux clauses IDENTIQUES (même `filter`,
   même `order by l.ordre, l.id`, unique : les tableaux s'alignent ; critique
   base M10) :
   ```sql
   select coalesce(bool_or(l.type = 'poste'), false),
          coalesce(array_agg(l.id order by l.ordre, l.id) filter (where <fautive>), '{}'),
          coalesce(array_agg(<cle> order by l.ordre, l.id) filter (where <fautive>), '{}')
     into v_un_poste, v_fautives, v_cles_fautives
     from public.devis_lignes l
    where l.devis_id = p_devis;
   -- <fautive> = l.type in ('poste', 'option') and (
   --      (v_regime = 'franchise' and l.taux_tva_centiemes <> 0)
   --   or (v_regime = 'reel' and l.taux_tva_centiemes = 0)
   --   or (v_regime = 'reel' and v_neuf_tva is true and l.taux_tva_centiemes in (550, 1000)))
   -- <cle> = case when v_regime = 'franchise' then 'devis_taux_franchise'
   --              when l.taux_tva_centiemes = 0 then 'devis_taux_sans_tva'
   --              else 'devis_taux_reduit_neuf' end
   ```
   La boucle du rang 3 parcourt les deux tableaux par leur indice. Une ligne
   porte au plus UNE clé de rang 3 : la borne de 508 motifs ne bouge pas.
   Le commentaire « toutes ses lignes fautives portent la même clé » devient
   faux : il se réécrit ;
3. **rang 1, exclusif** (si P1 = oui) :
   ```sql
   if v_client is null then            -- devis_client, inchangé
     …
   elsif v_valable is null then
     rang := 1; cle := 'devis_pour_qui'; nature := 'regle_opus';
     phrase := '…';                     -- annexe A.1
     return next;
   end if;
   ```
4. **le filtre**, dans la boucle de l'entreprise, APRÈS le calcul du rang :
   ```sql
   continue when v_valable = 'professionnel'
             and left(cle, 6) = 'conso_'
             and cle not in ('conso_adresse_etablissement', 'conso_adresse_siege');
   ```
   - vide (ou donnée pour un autre client), `consommateur`,
     `professionnel_hors_activite`, `non_professionnel` : tout compte ;
     `professionnel` : aucun `conso_` sauf les deux adresses (droit I3 :
     R. 123-237 reste ouvert) ;
   - une condition qui vaut `null` ne saute pas (mesuré, critique base §4) :
     le cas protecteur tient ;
   - **les rangs gardent leur position d'origine** (`100 + v_position`) : un
     trou, jamais une renumérotation ; `left(…, 6)`, jamais `like` ;
5. **les natures** de la boucle de l'entreprise :
   ```sql
   nature := case
     when cle in ('entreprise_ancienne', 'conso_tva_intra', 'frais_deplacement') then 'regle_opus'
     when v_valable in ('non_professionnel', 'professionnel') and left(cle, 6) = 'conso_' then 'prudence'
     when cle in ('conso_profession_reglementee', 'regime_tva') then 'prudence'
     else 'loi'
   end;
   ```
   `conso_tva_intra` reste « Règle d'Opus » partout (décision du 05/11) ;
   pour une association, une copropriété, une société civile, les mentions
   dues à un particulier ne sont pas imposées par la loi (L. 111-1, R. 111-1,
   R. 111-2 visent le consommateur, personne physique) : « Par prudence »
   (droit I4) ; pour `professionnel`, les deux adresses gardées aussi.

Ce qui reste vrai : la fonction ne lit ni `clients` (l'essai 14 c le fige),
ni l'origine du devis (D4-c), ni `preuves_tva` ; **aucune barre oblique
inverse dans le corps**.

### 2.6 `preuves_tva` (48) — une troisième source

```sql
alter table public.preuves_tva add column if not exists declare_le        timestamptz;
alter table public.preuves_tva add column if not exists declaration_texte text;

alter table public.preuves_tva drop constraint if exists preuve_tva_source_check;
alter table public.preuves_tva add constraint preuve_tva_source_check
  check (source in ('vies', 'essai', 'declaration'));

-- sous condition dans la migration
alter table public.preuves_tva add constraint preuve_tva_declaration_check
  check ((declare_le is null) = (declaration_texte is null)
     and (source <> 'declaration' or declare_le is not null)
     and (source <> 'essai' or declare_le is null)
     and (declaration_texte is null or declaration_texte in (
           'Je certifie sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à mon entreprise.')));
```

- **une déclaration peut rester jointe à une preuve `vies`** du même numéro
  (B1, option a) : d'où « les deux ensemble ou aucun », et non plus
  l'équivalence avec la source ;
- **le texte coché** est gardé, dans une LISTE FERMÉE de toutes les versions
  qui ont existé (une aujourd'hui ; apostrophes typographiques) ; il vient
  du téléphone, contrôlé par la fonction (§2.10) ;
- `reconnu_le` reste `not null` (rendre la colonne nullable demanderait un
  ordre jamais mesuré à travers le connecteur) ; pour une déclaration, elle
  vaut `declare_le` (§2.7) et ne s'affiche ni ne s'exporte (§2.9) ;
- une ligne par compte reste vraie ; **aucune politique, aucun droit**
  nouveaux ;
- **commentaires** : la table — « … et la date à laquelle VIES l'a reconnu,
  ou la déclaration sur l'honneur de l'entreprise, son texte et sa date. » ;
  `reconnu_le` — « source `vies` : la date du dernier contrôle par VIES ;
  `essai` : la date de pose ; `declaration` : égale à `declare_le`, ni
  affichée ni exportée — ce n'est pas une reconnaissance. » ; `declare_le` —
  « La date de la déclaration sur l'honneur, posée par la base ; gardée si VIES
  reconnaît ensuite le même numéro. » (critique base I5).

### 2.7 `tient_la_preuve_tva()` (48) — en entier

```sql
create or replace function public.tient_la_preuve_tva()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  -- 1. La date du contrôle (inchangé).
  if tg_op = 'INSERT' or current_user = 'service_role' then
    new.reconnu_le := clock_timestamp();
  else
    new.reconnu_le := old.reconnu_le;
  end if;

  -- 2. La déclaration sur l'honneur (2b-2).
  if new.source = 'declaration' then
    if tg_op = 'UPDATE' and old.declare_le is not null
       and old.numero = new.numero and old.siren = new.siren then
      new.declare_le := old.declare_le;               -- redéclarer ne rajeunit pas
      new.declaration_texte := old.declaration_texte; -- ce qu'il a coché ce jour-là
    else
      new.declare_le := clock_timestamp();
      -- Posée ailleurs que par la fonction Edge : un compte d'essai seulement.
      -- Imbriqué exprès : `service_role` n'a jamais à lire auth.users.
      if current_user <> 'service_role' then
        if not exists (select 1 from auth.users u
                        where u.id = new.pro_id
                          and lower(u.email) like '%@exemple-opus.test') then
          raise exception 'Une déclaration sur l’honneur du numéro de TVA ne se pose que par l’application (la fonction tva), ou sur un compte d’essai (adresse en @exemple-opus.test).'
            using errcode = '23514';
        end if;
      end if;
    end if;
    new.reconnu_le := new.declare_le;                 -- une seule date, qui ne bouge pas
  elsif new.source = 'vies' and tg_op = 'UPDATE' and old.declare_le is not null
        and old.numero = new.numero and old.siren = new.siren then
    new.declare_le := old.declare_le;                 -- VIES reconnaît le numéro déclaré :
    new.declaration_texte := old.declaration_texte;   --   l'engagement reste joint
  else
    new.declare_le := null;                           -- un autre numéro, ou un essai :
    new.declaration_texte := null;                    --   plus de déclaration
  end if;

  -- 3. Une preuve « essai » : un compte d'essai seulement (inchangé).
  …
  return new;
end;
$$;
```

Il reste `security invoker` et appelable par personne (balayage de la section
43). Ce que chaque branche tient :

| écriture | effet | constat |
|---|---|---|
| une déclaration posée par la fonction (`service_role`) | `declare_le` et `reconnu_le` posées par la base ; une date envoyée ignorée | ÉTABLI (mesuré par la critique base, sans la garde I1) |
| la même déclaration renvoyée | rien ne rajeunit | base M5 (la fonction ne la renvoie d'ailleurs plus, §2.10) |
| une déclaration posée par `postgres` sur un vrai compte | **refusée, 23514** | base I1 — DÉDUIT, l'essai 48 le prouvera |
| VIES reconnaît le numéro déclaré | la ligne devient `vies` ; déclaration et texte **gardés** | base B1 (a) — DÉDUIT, essai 48 |
| VIES reconnaît un autre numéro, ou une autre déclaration | l'ancienne déclaration est remplacée — **les textes le disent** | base B1 (b) |

### 2.8 `emetteur_incomplet()` (46) — la phrase seulement

La jointure ne filtre pas la source : une déclaration pour le SIREN ACTIF
éteint `conso_tva_intra` d'elle-même ; pour une autre entreprise, elle ne
vaut rien. **Seule la phrase change**, à l'octet dans `MOTIFS`
(`emetteur.js`) — annexe A.2. Elle reste au-delà de 600 caractères et n'a ni
« certifi », ni « vérifi ».

### 2.9 L'export, les codes, le rattrapage

- **`mes_donnees()` change d'une ligne** (critique base I5 : l'export ne doit
  jamais dire « reconnu » pour une déclaration) :
  ```sql
  'mon_numero_de_tva',
    (select case when x.source = 'declaration'
                 then to_jsonb(x) - 'reconnu_le' - 'vies_le'
                 else to_jsonb(x) end
       from public.preuves_tva x where x.pro_id = auth.uid()),
  ```
  Les colonnes de `devis` arrivent seules (`to_jsonb`). L'empreinte de
  `mes_donnees` dans `verifier-lectures` se recalcule, avec sa raison.
- **Codes d'erreur** : aucun nouveau. Les refus de la déclaration sont des
  ISSUES de la fonction Edge (HTTP 200) ; la garde I1 rend 23514. `OP028`
  reste libre.
- **Rattrapage** : aucun (colonnes neuves, vides).

### 2.10 La fonction Edge `tva` v2

`supabase/functions/tva/index.ts` et sa copie de `tva.js`, OCTET POUR OCTET,
**sans aucune séquence d'échappement « barre oblique inverse + u »** dans les
deux fichiers (le transport du connecteur la changerait).

**Le corps de la demande** : `{ numero }` (le contrôle, inchangé) ;
`{ numero, action: 'declarer', engagement: true, texte }` ; `{ action:
'retirer' }`. Une `action` inconnue → panne HTTP 500 (une faute de
déploiement, pas une issue).

**Le contrôle (sans `action`)** — deux changements :

1. **le refus de VIES épargne une déclaration, et la fait renaître** :
   ```ts
   // la preuve VIES de CE numéro qui porte une déclaration redevient une déclaration
   await admin.from('preuves_tva').update({ source: 'declaration', vies_le: null })
     .eq('pro_id', moi).eq('numero', numero).eq('source', 'vies').not('declare_le', 'is', null);
   // ce qui n'est pas une déclaration part, comme aujourd'hui
   await admin.from('preuves_tva').delete()
     .eq('pro_id', moi).eq('numero', numero).neq('source', 'declaration');
   ```
   (ÉTABLI, mesuré, `tva.md` §2 cas C : sans le filtre, la déclaration
   partait au premier recontrôle refusé ; la renaissance est DÉDUITE, à
   prouver au banc). La réponse `refuse` porte `declare_le` quand
   une déclaration de ce numéro reste ;
2. **si P5 = oui**, l'issue `indisponible` (saturation ou panne de VIES,
   jamais `bloque`) range une ligne `tva-muet:<HMAC(cléService, moi:numero)>`
   à l'instant (`compter_appel_siret`, un échec toléré et journalisé, comme
   le refus retenu), puis relit les lignes de cette clé des dernières 24 h :
   si elles sont au moins `SANS_REPONSE_TVA.controles` (3) et que la
   première et la dernière sont séparées d'au moins
   `SANS_REPONSE_TVA.ecart_ms` (une heure), la réponse porte
   `declarable: true`. La purge de 24 h existante les efface.

**`declarer`**, dans cet ordre :

| | étape | issue |
|---|---|---|
| 0 | l'origine (inchangé) | 403 |
| 1 | forme et clé ; `engagement !== true` ; `texte !== DECLARATION_TVA` (la version EN VIGUEUR, comparée à l'octet) | `mal_forme`, `cle_fausse`, **`sans_engagement`**, **`texte_perime`** |
| 2 | l'appelant, par son jeton | `sans_compte` |
| 3 | son entreprise active ; l'annuaire publie un numéro | `sans_entreprise`, `deja_publie` |
| 4 | le numéro désigne SON SIREN | `autre_siren` |
| 5 | la preuve du compte : `vies` d'un AUTRE numéro de ce SIREN → pas de rétrogradation ; `vies` du MÊME → rien à déclarer ; `declaration` du MÊME numéro et SIREN → **rien à écrire** (base M5) ; sinon (rien, essai, autre déclaration) → suite | **`deja_reconnu`** ; `reconnu` ; **`declare`** avec sa `declare_le` |
| 6 | un refus retenu (moins de 3 h) pour ce compte et CE numéro, sous la même empreinte que le contrôle — ou, si P5 = oui, la règle des trois contrôles sans réponse | sinon **`non_refuse`**, sans VIES, sans compteur, sans écriture |
| 7 | `upsert` de `ligneDeDeclarationTva({ pro_id, siren, numero, texte })` → `{ pro_id, siren, numero, vies_le: null, source: 'declaration', declaration_texte: texte }`, `onConflict: 'pro_id'`, relu `select('numero, declare_le')` | une écriture ratée → panne HTTP 500, jamais « déclaré » |
| 8 | | **`declare`**, avec `numero` et `declare_le` (la date de la BASE) |

**`retirer`** : 0. l'origine ; 1. l'appelant (`sans_compte`) ; 2.
`delete().eq('pro_id', moi).eq('source', 'declaration').select('numero')`
— une preuve `vies` qui porte une ancienne déclaration n'est pas touchée ;
une erreur → panne 500 ; 3. une ligne retirée → **`retire`** avec `numero` ;
aucune → **`rien_a_retirer`**. Ni VIES, ni compteur (critique base I2).

**`tva.js` gagne** : `DECLARATION_TVA` (la phrase de PLAN 10.19, apostrophes
typographiques) ; `DECLARATIONS_TVA_CONNUES` (la liste fermée, comparée au
SQL) ; `ligneDeDeclarationTva` (refuse un texte hors de la liste) ;
`SANS_REPONSE_TVA` (si P5) ; les issues **`declare`, `sans_engagement`,
`texte_perime`, `non_refuse`, `deja_reconnu`, `retire`, `rien_a_retirer`**
dans `ISSUES_TVA_SERVEUR` (11 → 18 ; `ISSUES_TVA` 14 → 21) ;
`DETAILS_PUBLICS` : `declare: ['numero', 'declare_le']`, `deja_reconnu:
['numero', 'reconnu_le']`, `retire: ['numero']`, `refuse: ['numero',
'reessayer_a', 'declare_le']`, et si P5 `indisponible: ['cause',
'declarable']` ; les phrases dans `messageTva` (annexe A.5), qui ne recopie
JAMAIS `DECLARATION_TVA`.

**Ce qui reste noté, pas construit** (critique base M6, M7) : un contrôle
reconnu entre les étapes 5 et 7 d'une déclaration du même compte est écrasé
(deux gestes du même artisan, rare) ; un refus retenu qui n'a pas pu s'écrire
fait répondre `non_refuse` — sa phrase dit de recontrôler, elle ne contredit
plus l'écran (A.5). Les deux dans `A-FAIRE`.

Déploiement : `verify_jwt = false` inchangé ; relu par `get_edge_function`,
**SHA-256 des deux fichiers** comparés au dépôt.

### 2.11 La migration, et l'ordre

1. **Construite par un script** qui PREND chaque objet dans `schema.sql`
   (sur le modèle de `construire2a.py`). Imitation : `git show
   9c5ac7c:supabase/schema.sql` (md5 `e78add347c6fa658535ad2084751e07c`, ce
   que porte la vraie base depuis le 08/11). Elle emporte : les cinq
   colonnes de `devis`, les deux de `preuves_tva`, `devis_pour_qui_check` et
   `preuve_tva_declaration_check` sous condition (`pg_constraint`), la paire
   `alter table … drop constraint if exists` + `add` de
   `preuve_tva_source_check` (un `drop` au milieu d'un `alter table` passe le
   connecteur, mesuré le 03/10), le `revoke` + les `grant` de 49.7,
   `create or replace` de `tient_le_devis`, `motifs_refus_remise`,
   `emetteur_incomplet`, `tient_la_preuve_tva`, **`mes_donnees`**, leurs
   commentaires et ceux des colonnes, et le balayage de la section 43.
2. **Aucun ordre qui commence par `drop`, `delete` ou `truncate`** (le script
   le compte) ; `set local lock_timeout = '5s'` ; **Opus fermé**, zéro requête
   active relevée avant ; renvoyée telle quelle sur 40P01 ou 55P03.
3. **Transport** : n barres obliques inverses suivies de « u » et de quatre
   chiffres hexadécimaux → n impair : n − 1 barres et le caractère ; n pair :
   intact. Le script écrit ce qu'on ENVOIE et ce que la base RECEVRA ; on
   simule le second.
4. **Simulée deux fois** sur l'imitation ; empreinte du catalogue égale à
   celle d'une base neuve au schéma du jour, aux écarts connus près (MAINTAIN,
   oid de `plpgsql`, ordre physique des colonnes, `entreprise_registre.gele`,
   `admin_basculer_metier`, « lecture demandes visiteur », l'U+00A0 de
   `emetteur_denomination_ei_check`).
5. **Envoyée GARDÉE** (un bloc `do` qui compare le md5 du texte reçu et
   n'exécute rien s'il diffère), avec l'accord du propriétaire ; relevé AVANT
   par `SupabaseLecture`, relevé APRÈS (md5 des cinq corps égaux à la
   simulation).
6. **Puis la fonction Edge `tva` v2, puis `git pull`.** Dans l'autre sens,
   l'upsert `declaration` serait refusé par l'ancienne contrainte (panne
   500), et une application nouvelle face à l'ancienne fonction ferait un
   CONTRÔLE (l'ancienne ignore `action`). Une application ANCIENNE face à la
   base et à la fonction nouvelles : elle n'envoie ni colonne nouvelle ni
   `action`, voit les clés inconnues sans bouton, ne voit pas une
   déclaration (`preuveTvaPour` la rejette) — incomplet, jamais faux.
   (Critique base M9 : une application nouvelle avant la migration aurait
   `PGRST204` ou 42703, pas 42501 ; `monEmetteurSupabase` traite un 42703 sur
   `declare_le` comme une colonne absente et relit sans elle — « Mon
   entreprise » ne tombe pas entière.)

---

## 3. Le calcul (JavaScript) et l'écran

### 3.1 `src/lib/devis.js`

- `pourQuiValable(devis)` (pure) : `devis.clientId != null &&
  String(devis.pourQuiClient) === String(devis.clientId) ? devis.pourQui ??
  null : null` — jamais `a === b` nu, qui rend vrai quand les deux manquent
  (critique base M8). La SEULE écriture de la règle côté téléphone.
- `MOTIFS_DEVIS` : `devis_pour_qui` (rang 1, `regle_opus`, si P1) et
  `devis_taux_reduit_neuf` (rang 3, **`prudence`**), phrases à l'octet de la
  base (annexe A.1), **chacune de 200 caractères au plus** (`premierePhrase`
  ne les coupe pas ; les trois phrases existantes de plus de 200 —
  `devis_client`, `devis_lieu`, `devis_validite` — ne changent pas : `A-FAIRE`).
- `ENDROIT_DU_MOTIF` : `devis_pour_qui → { endroit: 'pour_qui' }` ;
  `devis_taux_reduit_neuf → { endroit: 'ligne', aussi: 'chantier' }`.
  `actionDuPoint` : `'pour_qui'` → « Répondre » (dit : « Répondre : à quel
  titre ce client commande ») ; le second bouton d'un point `aussi:
  'chantier'` → « Revoir « Le chantier » ».
- `motifsDeRemise` : même ordre que la base ; la clé de rang 3 par ligne ;
  le filtre et les natures de §2.5 (4 et 5), APRÈS le calcul du rang
  (`100 + i + 1`).
- `CHAMPS_DEVIS` : `pourQui`, `pourQuiClient`, `chantierNeufConso`,
  `chantierNeufTva`. **`PAIRES_DEVIS` : `['pourQui', 'pourQuiClient']`
  ajoutée EN FIN** (`PAIRES_DEVIS[0]` est lue comme la paire de la réduction,
  critique écran E-M7). `nettoyerDevis`, `REGLES_DEVIS`, `validerDevis`
  connaissent les quatre valeurs ; `rowToDevis` lit les cinq colonnes.
- **Le client lu avec le devis** : `LIENS_DU_DEVIS_OUVERT` →
  `client:client_id(nom, type, siret)` ; `rowToDevis` garde `type` et `siret`
  **sans valeur par défaut** (jamais le `|| 'particulier'` de `rowToClient`).
- `phraseDesMentionsParticulier(reponseVue)` remplace
  `MENTIONS_PARTICULIER_PAR_PRUDENCE` comme source de la phrase (annexe A.3) ;
  **`reponseVue` est la réponse que la BASE a vue** (§3.6).
- `PAS_ENCORE_VERIFIE` : annexe A.6 (sept faits).
- `ECHEANCE_ACOMPTE` réécrite (droit B4, B3) ; `ECHEANCE_ACOMPTE_CHANTIER_NEUF`
  et `ECHEANCE_ACOMPTE_PRUDENCE` nouvelles ; `AIDE_NATURE_ACOMPTE_PRO`
  nouvelle (droit M9) — annexe A.6, et §3.5 pour qui les choisit.
- `AVIS_DU_DEVIS` / `avisDuDevis` : deux avis (annexe A.3), qui reçoivent le
  client (`type`, `siret`) et la réponse VUE par la base.
- `resumeDuChantier(devis, …)` et `resumeAQuelTitre(…)` : pures, pour que
  `mesure-devis` et `verifier-devis` les fassent tourner.
- **Les gabarits de la ligne « Pour le remettre » ne changent pas** : bornes
  508 (rang 1 exclusif, une clé de rang 3 par ligne) et 21 (le filtre ne fait
  que retirer).

### 3.2 `src/lib/tva.js` et `src/lib/emetteur.js`

- `tva.js` : §2.10, et `messageTva` (annexe A.5) reçoit, par `details`,
  `peutDeclarer` (l'écran le calcule, §3.7) et `declare_le`.
- `emetteur.js` : `preuveTvaPour` accepte `'declaration'` ;
  `numeroTvaImprime` rend `origine: 'declaration'` et `declare_le` (une
  preuve `vies` qui porte une ancienne déclaration reste `origine: 'vies'`) ;
  `ligneSource` ne nomme rien pour une déclaration (le devis n'imprime pas la
  provenance) ; `MOTIFS` : la phrase de A.2. Sans ces changements, le miroir
  divergerait de la base.

### 3.3 `src/lib/api.js`, la file, la démonstration des données

- `declarerTva(numero)` et `retirerDeclarationTva()` : deux fonctions nommées
  chacune (`…Supabase`, `…Demo`) et le choix à la fin (le piège Metro) ;
  `functions.invoke('tva', { body: … })`, corps lu comme
  `controlerTvaSupabase`. `declarerTva` envoie `texte: DECLARATION_TVA` —
  la constante que l'écran a montrée (critique base I3).
- `monEmetteurSupabase` lit `declare_le` dans `preuves_tva` ; un 42703 sur
  cette colonne → relecture sans elle (critique base M9).
- `controlerTvaDemo` n'efface plus une déclaration, la fait renaître comme
  la fonction, et **retient les refus de la session** (et, si P5, les
  absences de réponse) ; `declarerTvaDemo` et `retirerDeclarationTvaDemo`
  suivent l'ordre de la fonction Edge (le contrôle le vérifie déjà pour le
  contrôle).
- `devisVersBase` envoie les quatre colonnes accordées, jamais la date.
  `relireTotauxDevisSupabase` relit `pour_qui`, `pour_qui_client`,
  `client_id`, `chantier_neuf_conso`, `chantier_neuf_conso_le`,
  `chantier_neuf_tva` avec les totaux, et `totauxDepuisBase` les range dans
  son bloc `demande` : l'écran affiche ce que la BASE a vu.
- `devis-demo.js` (`modifierDevis`, `avecLiens`, `verifierLiens`) : les
  colonnes, la date posée par la démonstration, le client avec `type` et
  `siret`.

### 3.4 L'écran — « À quel titre ? » (`EnteteDevis.js`)

**Place** : APRÈS la rangée « Choisir dans mon carnet » · « Nouveau client »
et `sous('clientId')`, avant « Objet », sous le sous-titre « À quel titre ? »
(le titre « Pour qui ? » reste celui du choix du client — critique écran
E-I10). Le bloc n'existe que si un client est choisi (il apparaît quand la
feuille du carnet se ferme, pas sous le doigt).

**Hauteur fixe** (critique écran E-I1, règle « garder la grande place ») : une
zone de texte dont la hauteur est donnée par des **gabarits invisibles** —
TOUS les textes possibles de l'annexe A.3, suffixes « — enregistrement… » et
« — pas enregistré » compris — posés dans le flux comme dans `PourRemettre`
(`opacity: 0`, ni touchés ni lus par VoiceOver), le texte visible par-dessus ;
puis UNE rangée de deux moitiés :

| état | texte | moitié gauche (n'écrit jamais) | moitié droite (écrit) |
|---|---|---|---|
| client choisi, pas de réponse valable, type pas lu ou `'entreprise'` | « À quel titre ce client commande-t-il ? » | « Répondre » | vide (la place reste) |
| idem, **type lu `'particulier'`** | « Au carnet : particulier. Commande-t-il à titre privé ? » | « Autre réponse » | « Oui, à titre privé » |
| réponse valable (celle de l'écran) | « Commande : » + le résumé (A.3), et le suffixe d'état (§3.8) | « Changer » | vide |

- **Un bouton qui écrit n'apparaît jamais là où était un bouton qui n'écrit
  pas** (DÉDUIT, `mesure-devis` le mesure) : un appui visé sur « Répondre » au moment où le type arrive tombe sur
  « Autre réponse », qui ouvre la même feuille. Tant que le type n'est pas LU,
  aucune proposition.
- **Le type vient de la fiche** : `client` arrive à l'en-tête avec `{ nom,
  ville, type, siret }` par tous les chemins (`SaisieDevisScreen` l. 919 et
  1754-1756, `choisirClient`, `OpusApp` l. 4397 et 4464).
- « Oui, à titre privé » écrit la paire `{ pourQui: 'consommateur',
  pourQuiClient: devisRef.current.clientId }` — l'identifiant lu À L'INSTANT
  de l'appui, jamais celui de l'affichage (critique écran E-M8). Rien n'est
  jamais écrit sans appui.
- « Répondre », « Autre réponse », « Changer », et le bouton « Répondre » du
  point `devis_pour_qui` dans « Pour le remettre » ouvrent **la même feuille,
  par l'état unique `feuille` de la saisie** : `{ type: 'pour_qui' }`
  (critique écran E-I11). `EnteteDevis` ne reçoit que des rappels
  (`onRepondreAQuelTitre`, `onOuiATitrePrive`) et ne contient aucune
  `FeuilleBas`.
- **La feuille** : titre « À quel titre ce client commande-t-il ? », quatre
  rangées de 44 points au moins, dans l'ORDRE PROTECTEUR de l'annexe A.3 —
  celle qui retire des mentions EN DERNIER (droit B3, écran E-I9) ; la réponse
  actuelle est marquée choisie (`accessibilityState: { selected: true }`) ;
  un appui écrit la paire et ferme la feuille.
- **Changer de client** : la réponse devient sans effet d'elle-même ; la
  proposition revient pour la nouvelle fiche ; revenir au client d'avant rend
  la réponse valable.
- `NOMS_ENTETE` : `pourQui` et `pourQuiClient` → « À quel titre »
  (critique écran E-M3).

### 3.5 L'écran — « Le chantier » : une rangée, une carte

**La rangée** — dans le pied de la saisie, juste AVANT « Conditions » (après
les lignes et la ventilation, jamais au-dessus des lignes), sur le modèle de
la rangée « Conditions » : titre « Le chantier », un résumé, un chevron.
**Hauteur fixe** : le résumé se pose sur des gabarits (tous les résumés de
l'annexe A.4, suffixes compris) ; l'erreur d'en-tête ne s'y ajoute pas (la
bande de l'en-tête la dit déjà). La rangée n'existe que si au moins une
question est montrée (critique écran E-M2) :
- **Q1** est montrée sauf quand la réponse « à quel titre » DE L'ÉCRAN est
  `professionnel` (sans objet ; sa valeur gardée n'a aucun effet) ;
- **Q2** est montrée quand le régime LU est `reel`, **ou quand sa valeur est
  vraie** (on ne renvoie jamais vers une question invisible) ; un régime pas
  lu n'est jamais « non déclaré ».

**La carte** — `CARTE_CHANTIER = 'chantier'`, une valeur de plus de l'état
unique `carte` (comme `CARTE_CONDITIONS`) : plein écran, « ‹ Liste » pour
revenir ; ouverte depuis « Pour le remettre » (« Revoir « Le chantier » »),
elle y ramène, comme une ligne. Son contenu (textes en A.4) :
- l'introduction : « Deux questions indépendantes : on peut répondre « Oui »
  à l'une et « Non » à l'autre. » ;
- **Q1**, sous « Pour les droits de votre client » : la question, deux
  pastilles « Non » · « Oui », l'aide. « Oui » ouvre **par l'état `feuille`**
  (`{ type: 'chantier_neuf' }`, une `FeuilleBas` par-dessus la carte, comme
  la feuille d'un poste par-dessus une ligne) la confirmation ; rien n'est
  écrit avant « Je confirme ». Revenir à « Non » : un appui, sans
  confirmation, efface la date ;
- **Q2**, sous « Pour la TVA » : la question, « Non (par défaut) » tant que la
  valeur est vide, puis « Non » · « Oui » (critique écran E-M10) ; « Oui »
  s'écrit d'un appui.

Chaque pastille écrit `chantierNeufConso` ou `chantierNeufTva` par la file de
l'en-tête ; `NOMS_ENTETE` : → « Le chantier ».

**Les aides de l'acompte dans « Conditions »** (elles suivent la réponse de
l'ÉCRAN : ce sont des aides, pas des comptes) :
- réponse `professionnel` : ni `ECHEANCE_ACOMPTE`, ni la partie rétractation
  de l'aide de la nature — `AIDE_NATURE_ACOMPTE_PRO` à sa place ;
- réponse `non_professionnel` : `ECHEANCE_ACOMPTE_PRUDENCE` (droit I5) ;
- `chantierNeufConso` vrai (et réponse autre que `professionnel`) :
  `ECHEANCE_ACOMPTE_CHANTIER_NEUF`, avec la date de la BASE si elle est lue ;
- sinon : `ECHEANCE_ACOMPTE`.

### 3.6 L'écran — la liste « Pour le remettre » (`PourRemettre.js`)

- les deux motifs suivent les règles de 2b-1 : `devis_pour_qui` ferme la
  carte et ouvre la feuille « À quel titre ? » ; `devis_taux_reduit_neuf`
  porte DEUX boutons, « Ouvrir cette ligne » et « Revoir « Le chantier » » ;
- **la sous-partie « Mentions dues à un particulier » existe si et seulement
  si la liste LUE porte des `conso_`** (comme aujourd'hui) ; **sa phrase est
  choisie par la réponse que la BASE a vue dans la même photo** — le bloc
  `demande` des totaux relus sous la génération de la liste, rangé avec elle
  au retour (`liste.reponseVue`) —, jamais par la réponse de l'écran ; si
  elle n'est pas connue : la phrase de prudence d'aujourd'hui (critique écran
  E-I5). Les AVIS de A.3 suivent la même règle ;
- **la partie « Votre entreprise » dépend désormais du devis** : à chaque
  événement `totaux`, si la réponse valable vue par la base diffère de
  `liste.reponseVue`, `lireLaListe(['devis', 'entreprise'])` ; sinon
  `lireLaListe('devis')` comme aujourd'hui (§3.8) ;
- « garder la grande place » : gabarits inchangés.

### 3.7 L'écran — « Mon entreprise » → TVA (`SaisieTva.js`, `MonEntreprise.js`, `FicheEmetteur.js`)

**Quand la déclaration s'offre** — `peutDeclarer`, calculé par l'écran :
la preuve est vide, OU c'est une `essai`, OU c'est une déclaration d'un AUTRE
numéro ; **jamais** pour le numéro déjà déclaré, **jamais** quand la preuve
est `vies` (critique écran E-I4). Puis la case ne s'affiche qu'après :
- une réponse `refuse` (fraîche ou retenue) pour le numéro encore dans le
  champ ;
- si P5 = oui, une réponse `indisponible` qui porte `declarable: true`.
Jamais après `bloque`, `trop_d_essais`, `reseau`, `lent`,
`service_indisponible`, ni `indisponible` sans `declarable`.

**Où** — **SOUS le bouton « Faire contrôler par VIES » et sa note**, dans un
bloc encadré à son propre titre (« Vous êtes sûr de ce numéro ? ») : rien de
nouveau n'apparaît AU-DESSUS du bouton qu'on vient de toucher (critique écran
E-I2 : le message de la réponse est rendu avant le champ, `SaisieTva.js`
l. 154-161). Le message du refus, au-dessus, dit « plus bas » (A.5).

**La case** — `accessibilityRole="checkbox"`, `aria-checked`, la rangée
entière comme cible (modèle `PasserProScreen.js` l. 261-282) ; son crochet se
déclare AVANT la sortie anticipée de la l. 72. **Elle se décoche** à chaque
nouvelle réponse de VIES, à chaque changement du numéro, et au démontage ;
elle est **inerte pendant un envoi**. Case décochée, « Déclarer ce numéro
sur l’honneur » DIT pourquoi (le message de `sans_engagement`), comme le
motif d'un numéro pas prêt.

**Pendant l'envoi** — `onOccupe` comme le contrôle ; les trois sorties de
« Mon entreprise » attendent ; un état d'occupation qui sait CE qui est en
cours (`'controle' | 'declaration' | 'retrait'`) et choisit son message
(A.5) ; la vérification des « deux messages d'attente » de `verifier-tva`
s'ajuste.

**Les issues** (critique écran E-I3 — `SaisieTva.js` l. 118 et l. 156 font
aujourd'hui tout ce qui n'est pas `reconnu` en ROUGE avec une vibration
d'échec) :

| issue | style | retour | champ |
|---|---|---|---|
| `reconnu`, `declare`, `retire` | vert (`reussite`) | `retour.reussite()` | fermé et vidé |
| `deja_publie`, `deja_reconnu`, `rien_a_retirer` | neutre (note) | aucun | fermé |
| `sans_engagement`, `non_refuse` | rouge | **aucune vibration** (on dit ce qui manque) | ouvert |
| `refuse`, `texte_perime` et le reste | rouge | `retour.echec()` | ouvert (comme aujourd'hui) |

**Après `declare`** : `preuveTva = { siren, numero, source: 'declaration',
declare_le }` et `lireManques`. **Après `refuse`** : si la réponse porte
`declare_le`, la preuve reste (ou redevient) une déclaration de ce numéro ;
sinon `MonEntreprise.js` l. 543-545 retire la preuve locale du même numéro,
comme aujourd'hui. **Après `retire`** : preuve vide et `lireManques`.

**La note d'une déclaration** (aujourd'hui, toute preuve non `essai` y est
dite « VIES l'a reconnu », `SaisieTva.js` l. 131-137 — affichage faux à
corriger) : A.5, avec trois boutons : « Faire contrôler de nouveau par VIES »
(contrôle le numéro déclaré **sans le retaper**), « Écrire un autre numéro »,
« Retirer cette déclaration » (en deux appuis : le second dit « Confirmer :
retirer la déclaration »).

**`FicheEmetteur.js`** : une quatrième branche pour `origine ===
'declaration'` (sans elle, l'aide de la section TVA resterait VIDE).

**Vocabulaire** : ni « vérifi… » ni « registre » dans `SaisieTva.js` et
`tva.js` ; ni « certifi… » dans ce que rend `messageTva` — la phrase de la
case vit dans `DECLARATION_TVA` seule.

### 3.8 Les états : lu, en route, en échec — calculés à chaque rendu

Critique écran E-B2 : un état « en cours » mémorisé survit à un échec (la
date n'est relue qu'après une écriture confirmée ; `relecture.entreprise`
n'est remise à faux qu'au retour d'une liste). **Règle, sans mémoire, comme
`garderLaPlace`** : depuis `fileRef.current.entreesVoulues()`, l'entrée
`'devis'`, et pour un ensemble de champs :
- **en route** ⇔ l'entrée est en vol ou en attente ET, pour un de ces champs,
  le voulu diffère du confirmé (ou le champ est dans `inconnues`) ;
- **en échec** ⇔ l'état de l'entrée est `echec` ET la même différence.

| | lu (la base l'a) | en route | en échec |
|---|---|---|---|
| « À quel titre » (`clientId`, `pourQui`, `pourQuiClient`) | « Commande : » + résumé | le résumé VOULU + « — enregistrement… » | le résumé VOULU + « — pas enregistré » (la bande de l'en-tête dit le reste) |
| partie « Votre entreprise » de la carte | la liste lue | « Votre entreprise : la liste se met à jour. » (`partie(relitEntreprise ‖ enRoute(à quel titre))`) | la dernière liste lue, et `ceQueLaListeNeComptePas` dit déjà qu'un champ du devis n'est pas compté |
| Q1 « Oui » | « Oui — confirmé le JJ/MM/AAAA » (date de la base) | « Oui — enregistrement… » | « Oui — pas enregistré » |
| type de la fiche | propose ou non | — | type inconnu : « Répondre », jamais de proposition |
| régime de TVA | `reel` : Q2 montrée | — | pas lu : Q2 cachée (sauf valeur vraie) ; jamais « non déclaré » |
| preuve TVA | annuaire / VIES / déclaration / essai | — | la section le dit (comportement d'aujourd'hui) |

`mesure-devis` coupe une fois la route de l'écriture de l'en-tête après
« Pour son entreprise… », puis lit le bloc, la ligne et la carte : ni
« enregistrement… » ni « Mise à jour de la liste… » ne restent.

### 3.9 La démonstration

- **Rénovation salle de bains** (Mme Martin, particulier) : réponse vide → la
  proposition se voit (et `devis_pour_qui` si P1) ; la SCI du carnet peut y
  être choisie (`mesure-devis` vérifie que la rangée la plus HAUTE de la
  feuille ne retire rien).
- **Muret de clôture** et **Terrasse en bois** : `pourQui: 'consommateur'`,
  `pourQuiClient: 'cl-martin'` → leurs invariants restent (« Ce devis : rien
  ne manque » pour le Muret ; exactement deux points pour la Terrasse).
- **Sol du séjour** (sans client) : `chantierNeufTva: true` → ses lignes à
  10 % portent `devis_taux_reduit_neuf` ; seul endroit où le motif se voit
  sans `.env`.
- Pas de cinquième devis (`mesure-devis` en attend quatre).
- **TVA** : une clé en lettres est refusée → la case s'offre → la
  déclaration, puis son retrait, se voient ; la note de démonstration de
  `SaisieTva` le dit (A.5).

---

## 4. Les textes légaux (`src/data/legal.js`)

`VERSION` passe à la date du commit, avec **son bloc d'historique** : ce qui
change de fond — une donnée nouvelle collectée (la déclaration, son texte et
sa date ; les réponses du devis), une décision automatique qui gagne une
porte de sortie et un retrait — et la limite connue : aucun écran ne fait
encore ré-accepter un compte existant. Aucun texte ne dit « certifi… ».

| passage | ce qui devient faux ou manque | réécriture (annexe A.7) |
|---|---|---|
| Mentions → « Sources » | « n'est gardé que si VIES … le reconnaît » : **faux** | gardé si VIES le reconnaît ; sinon si l'entreprise le déclare sur l'honneur après un refus, avec la date |
| « Ce que nous collectons » | la déclaration ; et, pour les devis, ni les conditions du lot 2a ni les réponses de 2b-2 | les deux ajouts ; la sous-chaîne « celui que vous écrivez vous-même, et la date à laquelle VIES » reste |
| « Pourquoi, et sur quelle base » | « intérêt légitime à ce qu’un devis ne porte pas un numéro qu’aucune administration ne reconnaît » : **faux** (droit B2) | la phrase entière réécrite, et la base de la déclaration |
| « Une décision automatique… » | « Aucune vérification par un humain n'existe encore pour cette décision » ; « S'il ne le reconnaît pas, Opus ne l'imprime pas » ; le blocage dit « à un particulier » seulement (droit I10) | la porte de sortie dite honnêtement : ce qu'Opus contrôle et ne contrôle pas (droit M6), le retrait, « quelques heures après un refus » (droit M5), les clients qu'Opus traite comme des particuliers ; « humain », « le rend ou le refuse », « Aucun délai d'examen n'est promis », « devis à des particuliers » restent |
| « Combien de temps » | la déclaration manque, et ce que la base en fait (critique base B1) | ce que la base fait exactement : gardée, remplacée, effacée, jointe |
| CGU « Ce qui est interdit » | rien sur une fausse déclaration | P4 |

**Les empreintes sha256 des sections** que garde `verifier-legal` se
recalculent **dans le même commit**, avec leur raison. **`verifier-tva`
l. 995**, qui exige la phrase « Aucune vérification par un humain… », se
réécrit dans le MÊME commit que `legal.js`.

**La doctrine du projet** (`CLAUDE.md`, section 48 : « tant qu'il ne l'a pas
fait, l'imprimer sur un devis serait écrire un faux ») se réécrit dans le
commit de documentation de l'étape (droit I9) : Opus n'imprime un numéro que
VIES ne reconnaît pas que sur la déclaration de l'artisan.

---

## 5. Les contrôles et les essais

### 5.1 Le relevé « avant », d'abord

Les relevés de `lot2b/avant/` datent d'AVANT 2b-1 : **périmés**. Refaire le
relevé des 31 fichiers d'essais sur HEAD avant d'écrire une ligne ; la
référence mesurée le 09/11 : schéma ×2 sans erreur, 31 / 32 fonctions
`definer` ouvertes / fermées, 57 fonctions de déclencheur, 28 colonnes de
`devis`, 32 contraintes `check` des trois tables du devis, essai 49-remise 11
erreurs et 131 / 0, essai 49 79 erreurs, essai 49-conditions 27 erreurs,
essai 48 15 erreurs, essai 46 20 erreurs, `generer-cas-remise --verifier` 64
cas.

### 5.2 Les essais SQL (joués deux fois, à la main : `npm run verifier` n'en joue aucun)

| fichier | ce qui change |
|---|---|
| `essais-section-49-remise.sql` | `devis_complet` reçoit sa réponse (sinon le cas 0 tombe) ; cas nouveaux : rang 1 exclusif ; réponse pour un autre client = vide ; revenir au client d'avant ; les quatre valeurs, et pour `professionnel` les `conso_` absents SAUF les deux adresses, aux rangs À TROUS ; les natures « prudence » pour `non_professionnel` et `professionnel`, `conso_tva_intra` toujours « regle_opus » ; la fiche supprimée (cascade) ; « réponse posée, client vide, témoin vide » ; `devis_taux_reduit_neuf` (poste et option à 10 % et 5,5 %, offerte comprise, ligne à 20 %, ligne à 0 % qui garde `devis_taux_sans_tva`, **un devis où les deux clés de rang 3 alternent** — l'alignement des deux tableaux —, franchise, régime vide, la question conso à « Oui » et TVA vide → rien) ; D4-c et 14 c inchangés ; le compte d'erreurs et de valeurs |
| `essais-section-49.sql` | colonnes (28 → 33), `check_attendu_32` → 33, droits ; 27b (31 / 32) et 27f **inchangés** |
| `essais-section-49-conditions.sql` | droits de colonne (« attendu : 34 » → + 8, à recompter), défauts (`null`, nullable) |
| `essais-section-48.sql` | une déclaration sous `service_role` (date posée, `reconnu_le = declare_le`, une `declare_le` envoyée ignorée) ; la même renvoyée ne rajeunit rien ; **par `postgres` sur un vrai compte → 23514, sur un compte d'essai → posée** ; un upsert `vies` du MÊME numéro garde la déclaration, d'un autre la vide ; la contrainte refuse un texte sans date, une date sans texte, un texte hors liste, une déclaration sur une ligne `essai` ; un client ne s'écrit rien (403) ; l'export d'une déclaration n'a ni `reconnu_le` ni `vies_le`, celui d'une preuve `vies` les a ; le compte d'erreurs (cas 8) |
| `essais-section-46.sql` | `conso_tva_intra` : déclaration pour le SIREN actif → éteint ; pour un autre SIREN → présent ; la phrase |
| `essais-section-51d.sql` | `mes_donnees` : la clé `mon_numero_de_tva` d'une déclaration (J1 et la liste fermée des clés inchangées) |
| `essais-section-43.sql`, `-50` | **inchangés** — une preuve à relever, pas à supposer |

Puis les 31 fichiers rejoués et comparés au relevé « avant » : seuls des
écarts attendus et expliqués.

### 5.3 La parité base ↔ téléphone

`scripts/generer-cas-remise.mjs` : `COMPLET` avec la réponse `consommateur`
donnée pour son client ; `VIDE` vide ; `CLES_DU_DEVIS` ; une entreprise « au
réel, numéro déclaré » ; les situations de §5.2 (dont « réponse posée, client
vide, témoin vide » et les deux clés de rang 3 qui alternent). Puis
**`--verifier`, à la main** — le seul garde-fou de la parité.
`cas-remise.json` se régénère aussi pour la phrase de A.2, et se commite.

### 5.4 Les contrôles `node`

| contrôle | ce qui change |
|---|---|
| `verifier-devis` | droits de colonne ; contraintes attendues ; défauts ; empreintes des essais (APRÈS les avoir modifiés) ; formes entières de `tient_le_devis` et de `motifs_refus_remise` ; `CONTRAT_B2` : **12 clés sur 9 rangs** (11 si P1 = non) ; les deux phrases nouvelles ≤ 200 caractères et `premierePhrase(…).suite === false` ; `PAS_ENCORE_VERIFIE` (sept faits) ; l'invariant de la démonstration ; `ECHEANCE_ACOMPTE` et ses variantes (l. 6104, l. 6134) ; la jointure du client ; `avisDuDevis` ; `agirSurLePoint` et le second bouton ; la relecture `['devis', 'entreprise']` quand la réponse vue change ; `PAIRES_DEVIS[0]` reste la paire de la réduction ; **aucune `FeuilleBas` dans `EnteteDevis.js`** ; l'ordre de la feuille (la rangée `professionnel` en dernier, avec « Dans le doute… ») ; chaque colonne a un écrivain et un lecteur |
| `verifier-tva` | issues (18 / 21) ; la source ; les colonnes ; le déclencheur ; le retrait avec `neq` et la renaissance par `update` ; `retirer` ne touche que `source = 'declaration'` ; la lecture de `monEmetteur` ; les messages d'attente ; les textes (l. 987 ; **l. 995 réécrite dans le MÊME commit que `legal.js`**) ; `DECLARATION_TVA` égale à la phrase de PLAN **après normalisation des apostrophes** (droites dans PLAN, typographiques dans le code — critique base M3), égale à un élément de la liste fermée du SQL, jamais dans une sortie de `messageTva` ; le style et le retour par issue (E-I3) ; « il ne s'imprimera pas » absent de toute phrase `refuse` quand `peutDeclarer` ; **le banc** (`--banc`) étendu (§5.6) |
| `verifier-emetteur` | la phrase ↔ `MOTIFS` à l'octet ; « déclarée » dans les cas de la preuve ; la lecture de `preuves_tva` ; `numeroTvaImprime` origine `declaration` |
| `verifier-legal` | `VERSION` et son bloc ; le bloc de la décision automatique ; la phrase de « Pourquoi » (B2) ; les empreintes |
| `verifier-lectures` | l'empreinte de `mes_donnees`, avec sa raison |
| `verifier-etats` | inchangé ; ses deux fichiers ne disent toujours ni « vérifi… » ni « registre » |
| `verifier-portes`, `verifier-remontee` | inchangés — à relever, pas à supposer |

### 5.5 `mesure-devis` (pas dans `npm run verifier` ; serveur relancé avec `-c`, module servi vérifié)

`ECHEANCE_ACOMPTE` (l. 1720) ; `PAS_ENCORE_VERIFIE` ; la phrase attendue du
Muret ; la section « Pour qui ? » devient « À quel titre ? » : la
proposition, « Oui, à titre privé », la feuille et son ordre (la SCI choisie
au carnet, la rangée la plus haute ne retire rien), la partie entreprise
relue, **la hauteur du bloc égale dans tous ses états, à 320 et à 393** ; la
route de l'en-tête coupée après une réponse (§3.8) ; « Le chantier » : la
rangée (hauteur égale dans ses états), la carte, la confirmation, la date,
Q2 absente en franchise, le second bouton du motif ; la ligne « Pour le
remettre » à 110 / 88 à 393 ; une section « Mon entreprise → TVA » en
démonstration : **la position du bouton VIES égale avant et après la
réponse**, la case décochée à chaque nouvelle réponse, « déclaré » en vert,
le retrait en deux appuis.

### 5.6 Les sabotages à poser (un banc, sur une copie)

Chacun doit être refusé par la vérification qui le vise.

| # | défaut remis | doit être vu par |
|---|---|---|
| S1 | `devis_pour_qui` sort aussi quand le client manque | essai 49-remise, `cas-remise`, `CONTRAT_B2` |
| S2 | `pour_qui_client` ignoré | idem |
| S3 | le filtre retire les `conso_` aussi pour `professionnel_hors_activite` | idem |
| S4 | le filtre sans `v_client is not null` (la règle valable contournée) | essai (fiche supprimée), `cas-remise` |
| S5 | les rangs de l'entreprise renumérotés après le filtre | `cas-remise --verifier` |
| S6 | `left(cle, 5)` ou `like 'conso%'` | forme de 49.9 |
| S7 | le motif neuf lit `chantier_neuf_conso` | essai |
| S8 | le motif neuf en franchise, ou options et offertes exclues | essai |
| S9 | `devis_taux_reduit_neuf` en `loi` | `CONTRAT_B2` |
| S10 | `chantier_neuf_conso_le` accordée au téléphone | essai 49-conditions, `verifier-devis` |
| S11 | la date rajeunie à chaque écriture, ou pas effacée au retour à « Non » | essai, forme de `tient_le_devis` |
| S12 | « hors de son métier », ou « Seule exception », remis | `verifier-devis` |
| S13 | `PAS_ENCORE_VERIFIE` nomme encore « pour qui » ou perd « l’ancienneté du logement » | `verifier-devis` |
| S14 | `preuve_tva_source_check` sans `declaration` | essai 48, `verifier-tva` |
| S15 | le déclencheur ne vide pas `declare_le` pour un AUTRE numéro | essai 48 |
| S16 | le déclencheur vide la déclaration quand VIES reconnaît le MÊME numéro | essai 48 |
| S17 | une déclaration posée par `postgres` sur un vrai compte passe | essai 48 |
| S18 | le retrait du contrôle sans `.neq('source', 'declaration')`, ou sans la renaissance | banc |
| S19 | `declarer` sans exiger le refus retenu, sans `engagement`, ou qui accepte un texte périmé | banc |
| S20 | `declarer` range sa constante au lieu du texte reçu | banc |
| S21 | `declarer` remplace une preuve VIES d'un autre numéro, ou réécrit une déclaration du même numéro | banc |
| S22 | `retirer` supprime une ligne `vies` | banc |
| S23 | l'export d'une déclaration porte `reconnu_le` | essai 48, `verifier-lectures` |
| S24 | `preuveTvaPour` rejette `declaration` | `verifier-emetteur`, `cas-remise` |
| S25 | `SaisieTva` présente une déclaration comme reconnue par VIES | `verifier-tva` |
| S26 | le message `refuse` dit « il ne s’imprimera pas » au-dessus de la case | `verifier-tva` |
| S27 | le bloc de déclaration au-dessus du bouton VIES, ou la case pas décochée à une nouvelle réponse | `mesure-devis` (Mon entreprise) |
| S28 | `declare` en rouge, avec une vibration d'échec | `verifier-tva` |
| S29 | la case offerte pour le numéro déjà déclaré, ou quand la preuve est `vies` | `verifier-tva` (fonction pure de l'offre) |
| S30 | « certifie » dans un texte légal, ou « Aucune vérification par un humain » retirée sans le recours | `verifier-legal`, `verifier-tva` |
| S31 | l'ancienne phrase de « Pourquoi » (« qu’aucune administration ne reconnaît ») | `verifier-legal` |
| S32 | la proposition ÉCRIT « à titre privé » sans appui | `verifier-devis` |
| S33 | un bouton qui écrit à la place de « Répondre » (moitié gauche) | `verifier-devis`, `mesure-devis` |
| S34 | la hauteur du bloc « À quel titre ? » change d'un état à l'autre | `mesure-devis` |
| S35 | « enregistrement… » mémorisé, qui reste après un échec | `mesure-devis` (route coupée) |
| S36 | la phrase de la sous-partie choisie par la réponse de l'ÉCRAN | `verifier-devis` |
| S37 | la partie entreprise pas relue après un changement de la réponse vue | `verifier-devis`, `mesure-devis` |
| S38 | une `FeuilleBas` dans `EnteteDevis.js` | `verifier-devis` |
| S39 | la rangée `professionnel` pas en dernier, ou sans « Dans le doute… » | `verifier-devis` |
| S40 | les questions du chantier posées dans l'en-tête | `verifier-devis` |
| S41 | « font du neuf » dans une question, ou « Un bâtiment récent n’est pas en cause » | `verifier-devis` |
| S42 | `rowToDevis` donne `'particulier'` à un type absent | `verifier-devis` |
| S43 | `motifs_refus_remise` lit `clients` | essai 14 c |
| S44 | `PAIRES_DEVIS` avec la paire « à quel titre » en tête | `verifier-devis` |
| S45 | le miroir écrit `pourQuiClient === clientId` sans garde du vide | `cas-remise --verifier` |
| S46 | la phrase de la case recopiée dans `messageTva` | `verifier-tva` |
| S47 (si P5) | `declarable` après deux absences de réponse, ou trois en moins d'une heure, ou après `bloque` | banc |

---

## 6. L'essai sur la vraie base, et les questions pour l'iPhone

### 6.1 Sur la vraie base, par le chemin de l'application

Après la migration (accord), la fonction v2 déployée et relue. Deux artisans
jetables **à Brest**, `…@exemple-opus.test`, SIRET fictifs à clé juste et
inconnus du répertoire (les preuves SIRET `essai` déjà en base, réutilisées) ;
`enregistrer_vues` neutralisé ; **le régime de TVA déclaré AVANT le premier
poste** ; supprimés ensuite par `preparer_suppression_compte` +
`/functions/v1/compte` ; le `.env` retiré dans une commande à part ; un
serveur arrêté par son numéro, jamais `pkill -f`.

| | attendu |
|---|---|
| A au réel écrit un n° calculé depuis son SIREN fictif → VIES, pour de vrai | `refuse` (≈ 11 s), refus retenu |
| A déclare sans cocher · avec un texte périmé · un autre numéro jamais contrôlé | `sans_engagement` · `texte_perime` · `non_refuse`, aucun appel à VIES |
| A déclare le numéro refusé | `declare`, `declare_le` posée par la base |
| A redéclare le même numéro | `declare`, la MÊME date, aucune écriture |
| ce qui manque à A, avant · après | `conso_tva_intra` présent · absent |
| A redemande le contrôle | `refuse` sans rappeler VIES (retenu) ; **la déclaration reste** |
| A retire sa déclaration · la retire encore | `retire` · `rien_a_retirer` ; `conso_tva_intra` revient |
| B lit la preuve de A · `rpc/emetteur_incomplet` pour A | `[]` · OP011 |
| A écrit `preuves_tva` directement | 403 |
| l'export de A (déclaration posée) | la déclaration, son texte, sa date ; **ni `reconnu_le` ni `vies_le`** |
| un devis de A à un client particulier : `motifs_refus_remise` | `devis_pour_qui` (si P1) ; la paire écrite → absent |
| A change de client · revient au premier | le motif revient · repart |
| une fiche « entreprise », réponse `professionnel` | plus aucun `conso_` sauf les adresses ; rangs à trous |
| réponse `non_professionnel` | les `conso_` en « prudence », `conso_tva_intra` en « regle_opus » |
| `chantier_neuf_tva = true` et une ligne à 10 % | `devis_taux_reduit_neuf` sur la ligne, nature `prudence` |
| `chantier_neuf_conso = true` · puis `false` | date posée · effacée ; `chantier_neuf_conso_le` envoyée : 42501 |
| `pour_qui = 'autre'` | 400 · `devis_pour_qui_check` |
| à CHAQUE pas, la liste de la base contre `motifsDeRemise` | identique au caractère près |

**Non couverts sur la vraie base, et dits** : le refus FRAIS de VIES sur un
numéro déclaré (le refus est retenu trois heures), la reconnaissance par VIES
d'un numéro déclaré (il faudrait un vrai numéro valide, jamais utilisé pour
un compte), la garde I1 par le connecteur (elle exigerait une écriture par
`postgres`), et, si P5, la règle des trois contrôles sans réponse (on ne
provoque pas une saturation) — tenus par le banc et l'essai 48.

### 6.2 Les questions pour l'iPhone (build de développement, après `git pull` et `npx expo start -c`)

1. « Mon entreprise » → TVA : après un refus, le bloc « Vous êtes sûr de ce
   numéro ? » apparaît SOUS le bouton VIES, qui ne bouge pas ; la case se
   coche au pouce ; le bouton, case décochée, dit pourquoi.
2. Après la déclaration : la phrase est en vert ; la ligne « Votre
   entreprise » perd un point ; « Faire contrôler de nouveau par VIES »
   refusé → la déclaration reste ; « Retirer cette déclaration » en deux
   appuis.
3. Un devis à un client particulier : la proposition se lit, « Oui, à titre
   privé » s'enregistre, le point « Dites à quel titre… » s'éteint ; **rien
   ne saute sous le doigt** dans le bloc.
4. Changer de client : la question revient.
5. La SCI de votre carnet : la feuille commence par « À titre privé… » puis
   « Pour une association, une copropriété ou une société civile » ; la
   réponse qui retire des mentions est en dernier.
6. « Le chantier » → « Oui » à la première question : la confirmation se lit
   en entier, les deux boutons au pouce ; « confirmé le … » ; revenir à
   « Non ».
7. Au régime réel, « Oui » à la question TVA + une ligne à 10 % : le point
   sur la ligne, et ses deux boutons y mènent.
8. La ligne « Pour le remettre » garde sa hauteur (≈ 110 points sur votre
   iPhone 16), la rangée « Le chantier » aussi.
9. VoiceOver : la case dit « case à cocher », cochée ou non ; la feuille des
   quatre réponses se parcourt dans l'ordre, la réponse choisie annoncée.

---

## 7. Ce que 2b-2 ne fait PAS

- **2b-3** : l'urgence par ligne, la décennale, l'attestation ; la garde
  d'urgence prendra `OP028` ; le motif « acompte à la signature » devra lire
  `chantier_neuf_conso`.
- **2b-4** : devis payant ou gratuit, déchets, arrêté de 2017, RGE ; l'adresse
  du client pour les services à la personne.
- **2c** : numéro, PDF, aperçu, remise ; **figer sur chaque devis remis le
  n° de TVA, sa source (annuaire, VIES, déclaration), la date ET le texte
  coché** (décision du 09/11 au soir ; droit M10, base B1) ; **figer la
  réponse VALABLE « à quel titre »** (une copie calculée à la remise, jamais
  redérivée de `client_id`, qu'une cascade peut vider — base I4) et le
  chantier, avec la date ; la certification du taux réduit ; l'impression de
  la rétractation selon la réponse (J9) ; le moment de la signature ; le tri
  des devis remis ; une nouvelle version redemande-t-elle la confirmation du
  chantier neuf ?
- **Après 2c, un lot à part** : la signature par le client dans Opus.
- **Dans `A-FAIRE`** (« Après l'étape 2b-2 ») : la déclaration quand VIES
  bloque Opus ; la révision par un humain des refus de VIES (ouverte tant que
  J1 n'a pas répondu) ; un historique des déclarations ; le retrait d'une
  déclaration par l'administration ; la course entre un contrôle reconnu et
  une déclaration du même compte (base M6) ; un refus retenu qui n'a pas pu
  s'écrire (base M7) ; le motif pour un logement achevé depuis moins de deux
  ans (`neuf.md` P4) ; l'avis « chantier neuf (droits du client) mais pas
  (TVA), avec un taux réduit » (`neuf.md` P5) ; le filtrage exact pour un
  petit professionnel sur un chantier neuf ; la phrase de `conso_mediateur`
  (« démarché » → les mots de L. 221-3, droit M7) ; un bouton « Ouvrir sa
  fiche » sous l'avis du SIRET (écran E-M9) ; les trois phrases de motif de
  plus de 200 caractères dont la consigne passe derrière « Lire la suite » ;
  l'imprécision de `AIDE_TAUX_REDUIT` à 5,5 % (`neuf.md` J-d) ; la
  ré-acceptation des CGU (toujours absente, alors que `VERSION` change encore).

---

## Annexe A — Le contrat (texte exact ; apostrophe typographique ’ ; guillemets « » avec des espaces ordinaires, comme dans le code)

### A.1 Les deux motifs du devis (49.9 = `MOTIFS_DEVIS`, octet pour octet)

| rang | clé | condition | nature | phrase |
|---|---|---|---|---|
| 1 | `devis_pour_qui` (si P1 = oui) | un client, et pas de réponse valable ; jamais avec `devis_client` | `regle_opus` | Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le devis. Opus le demande pour tous vos devis. |
| 3 | `devis_taux_reduit_neuf` | UNE LIGNE PAR LIGNE FAUTIVE : régime `reel`, `chantier_neuf_tva is true`, `type in ('poste','option')`, taux 550 ou 1000 | `prudence` (jusqu'au lot 3) | Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez répondu que ces travaux font partie d’un chantier qui crée un bâtiment neuf. |

149 et 169 caractères (ÉTABLI : mesurés avec `node`). Aucun article cité, aucun pourcentage (les
articles passent au CIBS le 01/01/2027) : les références vivent dans le
commentaire SQL, avec « CIBS non lu, à relire avant le 01/01/2027 » et
« d'autres 5,5 % (CGI 278-0 bis N et P, non lus) : d'où « prudence » ».

### A.2 La phrase de `conso_tva_intra` (46 = `MOTIFS` d'`emetteur.js`)

> Pour un devis à un particulier : vous avez déclaré le régime réel, mais Opus n’a aucun numéro de TVA intracommunautaire pour votre entreprise : l’annuaire des entreprises (liste de la DGFiP) ne lui en a transmis aucun, VIES n’en a reconnu aucun, et vous n’en avez déclaré aucun sur l’honneur. La loi demande de le communiquer au client (code de la consommation, R. 111-2) ; Opus l’imprime sur le devis. Si vous êtes en réalité en franchise en base de TVA, choisissez-la dans « TVA ». Sinon, écrivez votre numéro dans « Votre entreprise » : Opus le fait contrôler par VIES, le service de la Commission européenne. S’il le refuse alors que vous êtes sûr de ce numéro, vous pourrez le déclarer sur l’honneur ; votre service des impôts des entreprises peut dire pourquoi VIES le refuse, et l’activer.

Si P5 = oui, « S’il le refuse alors que » devient « S’il le refuse, ou ne
répond pas à trois contrôles en plus d’une heure, alors que ».

### A.3 « À quel titre ? »

**Sous-titre du bloc** : « À quel titre ? »
**Sans proposition** : « À quel titre ce client commande-t-il ? » — bouton « Répondre ».
**Proposition** (fiche `particulier` lue) : « Au carnet : particulier. Commande-t-il à titre privé ? » — « Autre réponse » (gauche) · « Oui, à titre privé » (droite).
**Réponse valable** : « Commande : » + le résumé — « Changer ».
**Suffixes** : « — enregistrement… » ; « — pas enregistré ».
**Titre de la feuille** : « À quel titre ce client commande-t-il ? »

| ordre | valeur | rangée de la feuille | aide sous la rangée | résumé (après « Commande : ») |
|---|---|---|---|---|
| 1 | `consommateur` | À titre privé, pour lui-même | — | à titre privé |
| 2 | `non_professionnel` | Pour une association, une copropriété ou une société civile | Sans activité professionnelle : une SCI familiale, un syndicat de copropriétaires (même représenté par un syndic professionnel), une association. Opus leur compte, par prudence, les mentions dues à un particulier. | pour une association, une copropriété ou une société civile |
| 3 | `professionnel_hors_activite` | Pour son entreprise de 5 salariés au plus, hors de son activité principale | Par exemple, une boulangerie qui fait refaire sa vitrine. Quand le devis est signé hors de vos locaux, la loi la protège comme un particulier (sauf pour un bâtiment neuf ou une transformation importante) ; Opus lui compte, par prudence, toutes les mentions dues à un particulier. | pour son entreprise (5 salariés au plus), hors de son activité principale |
| 4 | `professionnel` | Pour son entreprise, dans son activité principale, ou une entreprise de plus de 5 salariés | Par exemple, un autre artisan qui vous sous-traite une partie de son chantier, ou un commerce de plus de 5 salariés. La plupart des mentions dues à un particulier ne sont alors plus comptées. Dans le doute, choisissez une autre réponse : c’est la plus sûre. | pour son entreprise, dans son activité principale (ou plus de 5 salariés) |

« 5 salariés » : la séquence de l'espace insécable entre le chiffre et le mot,
dans le JS.

**`phraseDesMentionsParticulier(reponseVue)`** (sous « Mentions dues à un
particulier ») :

- vide ou inconnue : « Opus ne sait pas encore pour qui le client commande : dans le doute, il compte ce qu’on doit à un particulier. » (inchangée)
- `consommateur` : « Ce client commande à titre privé : la loi demande de lui communiquer ces informations, et Opus les imprime sur le devis. »
- `non_professionnel` : « Une association, une copropriété ou une société civile sans activité professionnelle : la loi ne demande peut-être pas ces mentions pour elle ; Opus les compte, par prudence. »
- `professionnel_hors_activite` : « Ce client commande pour son entreprise de 5 salariés au plus, hors de son activité principale : quand le devis est signé hors de vos locaux, la loi lui doit ces mentions comme à un particulier (sauf pour un bâtiment neuf ou une transformation importante). Opus les compte toutes, par prudence. »
- `professionnel` : « Ce client commande pour son entreprise : Opus ne garde que l’adresse de votre établissement ou de votre siège, par prudence — la loi la demande peut-être sur tous vos devis. »

**Les avis** (jamais bloquants ; réponse VUE `professionnel` ou
`professionnel_hors_activite`) :

| clé | quand | phrase |
|---|---|---|
| `avis_siret_client` | fiche `entreprise` sans SIRET | Ce client commande pour son entreprise : ajoutez son SIRET à sa fiche, il vous servira pour la facture. |
| `avis_fiche_particulier` | fiche `particulier` | Ce client commande pour son entreprise, mais votre carnet le range parmi les particuliers : passez sa fiche en « Entreprise » pour y écrire son SIRET. |

Type de fiche inconnu : aucun avis.

### A.4 « Le chantier »

**La rangée** : titre « Le chantier » ; résumés :
- les deux réponses à « Non » ou vides : « Chantier ordinaire »
- Q1 « Oui » : « Bâtiment neuf ou transformation importante, confirmé le JJ/MM/AAAA »
- Q2 « Oui » : « Crée un bâtiment neuf : taux normal de TVA »
- les deux : « Bâtiment neuf, confirmé le JJ/MM/AAAA ; taux normal de TVA »
- suffixes « — enregistrement… » ; « — pas enregistré ».

**La carte** — titre « Le chantier » ; introduction : « Deux questions indépendantes : on peut répondre « Oui » à l’une et « Non » à l’autre. »

**Question 1** — sous-titre « Pour les droits de votre client » (cachée pour une réponse `professionnel`)
- Question : « Ce devis porte-t-il sur la construction d’un bâtiment neuf, ou sur la transformation importante d’un bâtiment existant ? »
- Pastilles : « Non » · « Oui » ; réponse « Oui » : « Oui — confirmé le JJ/MM/AAAA ».
- Aide : « Ces chantiers échappent aux règles du devis signé hors de vos locaux : 14 jours pour se rétracter, formulaire de rétractation, aucun paiement avant le 8e jour. Une réparation, un entretien ou une rénovation ordinaire n’en font pas partie. Si vous ne faites qu’une partie des travaux d’un bâtiment neuf (l’électricité, la plomberie…), la loi ne dit pas clairement que votre devis en fait partie. Dans le doute, gardez « Non » : c’est le cas le plus sûr. »
- Feuille de confirmation (J7), titre « Bâtiment neuf ou transformation importante » :
  > Dans ce cas, le devis n’aura pas de formulaire de rétractation, ne laissera pas 14 jours au client pour changer d’avis, et la règle du 8e jour ne s’appliquera pas.
  >
  > Si ce n’est pas vraiment le cas, c’est vous qui prenez le risque : le client garde le droit de se rétracter pendant douze mois de plus ; un paiement reçu avant le 8e jour permet d’annuler le contrat ; et la loi punit ces manquements jusqu’à deux ans d’emprisonnement et 150 000 € d’amende.
  >
  > La loi ne définit pas la « transformation importante », et ne dit pas clairement qu’un devis pour une partie seulement des travaux d’un bâtiment neuf en fait partie. Dans le doute, gardez « Non ».

  Boutons : « Garder « Non » » · « Je confirme ». (« 14 jours », « 150 000 € » :
  la séquence de l'espace insécable dans le JS. Sources : L. 221-2 12°,
  L. 221-10, L. 221-20, L. 242-1, L. 242-5, L. 242-7.)

**Question 2** — sous-titre « Pour la TVA » (régime réel lu, ou valeur vraie)
- Question : « Ces travaux font-ils partie d’un chantier qui crée un bâtiment neuf ? »
- Pastilles : « Non (par défaut) » tant que la valeur est vide, puis « Non » · « Oui ».
- Aide : « C’est le cas si vos travaux font partie, même pour un seul corps d’état, d’un chantier qui construit un bâtiment ou le surélève, qui refait la majorité de ses fondations, de sa structure ou de ses façades (hors ravalement), ou la plus grande partie de chacun des éléments de son second œuvre, ou qui augmente sa surface de plancher de plus de 10 % — en comptant tous les travaux faits sur deux ans, par vous ou par d’autres. La TVA est alors au taux normal. Ce sont les travaux qui comptent, pas l’âge du bâtiment — mais le taux réduit demande, en plus, un logement achevé depuis plus de deux ans. » (« 10 % » : la séquence de l'espace insécable dans le JS.)

### A.5 La TVA — l'écran et `messageTva`

- `DECLARATION_TVA` (la case ; la liste fermée du SQL) : « Je certifie sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à mon entreprise. »
- Titre du bloc : « Vous êtes sûr de ce numéro ? »
- Explication : « Votre espace professionnel sur impots.gouv.fr le montre, ou un courrier de votre service des impôts ? Vous pouvez alors le déclarer sur l’honneur : Opus l’imprimera sur vos devis. Cette déclaration vous engage ; Opus la garde avec sa date, et vous pourrez la retirer. »
- Si une déclaration existe pour un autre numéro, ajouter : « Elle remplacera votre déclaration du JJ/MM/AAAA pour le numéro {numéro}. »
- Bouton : « Déclarer ce numéro sur l’honneur » ; pendant l'envoi : « Enregistrement de votre déclaration… ».
- Texte d'accueil au réel, sans numéro (`SaisieTva.js` l. 146-149), ajouter : « S’il le refuse alors que vous êtes sûr de votre numéro, vous pourrez le déclarer sur l’honneur. »
- Note d'une déclaration : « Déclaré sur l’honneur par vous le JJ/MM/AAAA : VIES ne l’avait pas reconnu. Il s’imprime sur vos devis, sous votre responsabilité. » — boutons « Faire contrôler de nouveau par VIES » · « Écrire un autre numéro » · « Retirer cette déclaration » (second appui : « Confirmer : retirer la déclaration »).
- Aide de la section TVA (`FicheEmetteur.js`) : « Numéro de TVA intracommunautaire {numéro}, déclaré sur l’honneur par vous le JJ/MM/AAAA : VIES ne l’avait pas reconnu. Il s’imprimera sur vos devis, quel que soit votre régime ; vous pouvez retirer votre déclaration dans « Votre entreprise ». »
- Messages d'occupation de « Mon entreprise » : « Enregistrement de votre déclaration en cours : attendez la réponse. » ; « Retrait de votre déclaration en cours : attendez la réponse. »
- Note de démonstration : « Démonstration : une clé de deux chiffres juste est reconnue ; une clé en lettres qui commence par Z trouve VIES saturé ; toute autre clé en lettres est refusée, et la déclaration sur l’honneur vous est alors proposée. »

| issue | phrase |
|---|---|
| `declare` | Votre déclaration est enregistrée : ce numéro s’imprimera sur vos devis. VIES ne le reconnaît pas aujourd’hui ; si votre service des impôts le corrige ou l’active, faites-le contrôler de nouveau. |
| `sans_engagement` | Cochez la déclaration pour enregistrer ce numéro. |
| `texte_perime` | Le texte de la déclaration a changé depuis cette version d’Opus : mettez l’application à jour, puis relisez-le avant de cocher. Rien n’a été enregistré. |
| `non_refuse` | Opus n’a pas de refus récent de VIES pour ce numéro : faites-le contrôler de nouveau. S’il le refuse, la déclaration vous sera proposée. |
| `deja_reconnu` | VIES a reconnu le numéro {numéro} de votre entreprise le JJ/MM/AAAA : c’est lui qui s’imprime sur vos devis. S’il n’est plus valable, faites-le contrôler de nouveau. |
| `retire` | Votre déclaration est retirée : ce numéro ne s’imprimera plus sur vos devis. |
| `rien_a_retirer` | Il n’y a plus de déclaration à retirer : elle a déjà été retirée, ou VIES a reconnu votre numéro entre-temps. |
| `refuse`, une déclaration de ce numéro reste (`declare_le`) | VIES ne reconnaît pas ce numéro. Votre déclaration sur l’honneur du JJ/MM/AAAA reste enregistrée : il continue de s’imprimer sur vos devis. Si vous savez qu’il est faux, retirez votre déclaration. |
| `refuse`, `peutDeclarer` | VIES ne reconnaît pas ce numéro aujourd’hui. Un numéro refusé peut n’être pas attribué, ou pas encore actif : votre service des impôts des entreprises peut dire pourquoi, et l’activer. Si vous êtes en franchise en base de TVA, choisissez-la dans « TVA ». Sinon, tant que VIES ne le reconnaît pas, Opus ne l’imprime sur vos devis que si vous le déclarez sur l’honneur, plus bas. |
| `refuse` retenu, `peutDeclarer` | VIES a refusé ce numéro il y a moins de trois heures : Opus ne le lui redemandera pas avant HH h MM. Un numéro refusé peut n’être pas attribué… (la même suite que la ligne précédente) |
| `refuse`, sans déclaration possible (une preuve `vies` d'un autre numéro) | la phrase d'aujourd'hui, où « Un numéro refusé n’est pas attribué, ou pas actif ; » devient « Un numéro refusé peut n’être pas attribué, ou pas encore actif : » |
| `indisponible`, `bloque`, `lent`, `reseau`, quand `peutDeclarer` (P5 = non) | la phrase d'aujourd'hui, puis : « La déclaration sur l’honneur n’est proposée qu’après un refus de VIES : réessayez dans quelques minutes. » (pour `bloque` : « La déclaration sur l’honneur n’est proposée qu’après une réponse de VIES. ») |
| idem, P5 = oui, `declarable` absent | la phrase d'aujourd'hui, puis : « Si VIES ne répond toujours pas à trois contrôles, en plus d’une heure, Opus vous proposera de déclarer ce numéro sur l’honneur. » (`bloque` : comme P5 = non) |
| `indisponible` avec `declarable: true` (P5 = oui) | la phrase d'aujourd'hui, puis : « VIES n’a pas répondu à trois contrôles en plus d’une heure : si vous êtes sûr de ce numéro, vous pouvez le déclarer sur l’honneur, plus bas. » |

### A.6 Les phrases du devis qui changent

- `PAS_ENCORE_VERIFIE` : « Pas encore vérifié : le moment de la signature, l’urgence, la garantie décennale, si le devis lui-même est payant, les déchets de chantier, le label RGE pour des travaux d’énergie, et les conditions du taux réduit de TVA (l’ancienneté du logement, la certification du client). »
- `ECHEANCE_ACOMPTE` : « Devis signé hors de vos locaux (chez le client, sur le chantier) par un particulier, ou par une entreprise de 5 salariés au plus pour des travaux hors de son activité principale : vous ne pouvez recevoir aucun paiement avant le 8e jour après la signature — pas même un chèque à encaisser plus tard. Exceptions : des travaux d’entretien ou de réparation urgents qu’il vous a expressément demandés chez lui, et seulement pour les pièces et travaux strictement nécessaires à l’urgence ; et la construction d’un bâtiment neuf ou la transformation importante d’un bâtiment existant, à indiquer dans « Le chantier » (Code de la consommation, art. L. 221-10, L. 221-2 et L. 221-3). Opus ne sait pas encore où ce devis sera signé : comptez ce délai. » — cachée pour une réponse `professionnel`.
- `ECHEANCE_ACOMPTE_CHANTIER_NEUF` : « Vous avez indiqué le JJ/MM/AAAA que ce devis porte sur la construction d’un bâtiment neuf ou la transformation importante d’un bâtiment existant : la règle du 8e jour ne s’applique pas à ces chantiers. Si ce n’est pas vraiment le cas, revenez à « Non » dans « Le chantier » : un paiement reçu trop tôt permettrait au client d’annuler le contrat. » (date pas encore relue : « Vous venez d’indiquer que ce devis… »)
- `ECHEANCE_ACOMPTE_PRUDENCE` (réponse `non_professionnel`) : « Pour une association, une copropriété ou une société civile sans activité professionnelle, la loi ne pose peut-être pas cette règle ; Opus la compte, par prudence : ne recevez aucun paiement avant le 8e jour après la signature. »
- `AIDE_NATURE_ACOMPTE_PRO` (réponse `professionnel`, à la place de `AIDE_NATURE_ACOMPTE`) : « Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui rendant le double. Un acompte engage les deux. Écrivez lequel des deux vous demandez. »
- Dans le JS, « 5 salariés », « 14 jours », « L. 221-10 », « L. 221-2 » et « L. 221-3 » portent la séquence de l'espace insécable, comme aujourd'hui ; « 8e jour » non.
- Phrase de `devis_pour_qui_check` (`erreurs.js`) : « Cette réponse à « À quel titre ? » n’est pas connue d’Opus : rien n’a été enregistré. Mettez l’application à jour, puis réessayez. »

### A.7 Les textes légaux (à relire au mot près avant de les poser)

- **Sources** : « … Un numéro de TVA que cette API ne publie pas, écrit par l’entreprise elle-même, est gardé si VIES, le service de la Commission européenne qui interroge l’administration fiscale de chaque pays, le reconnaît, et la date de ce contrôle l’accompagne ; sinon, seulement si l’entreprise déclare sur l’honneur, après un refus de VIES, qu’il est celui que l’administration fiscale lui a attribué, et la date de cette déclaration l’accompagne. … » (P5 = oui : « après un refus de VIES, ou après trois contrôles sans réponse, ».)
- **Ce que nous collectons** : « … sinon, celui que vous écrivez vous-même, et la date à laquelle VIES, le service de la Commission européenne, l’a reconnu — ou, s’il le refuse, votre déclaration sur l’honneur, son texte et sa date. … » et, pour les devis : « … leur objet, le lieu et le délai des travaux, une éventuelle retenue de garantie, leur réduction, leur acompte et sa nature, leur durée de validité, à quel titre le client commande, si les travaux portent sur un bâtiment neuf ou une transformation importante (et la date à laquelle vous l’avez confirmé), et s’ils font partie d’un chantier qui crée un bâtiment neuf, pour la TVA, leurs lignes, … »
- **Pourquoi** (remplace la phrase sur VIES, droit B2) : « Faire contrôler par VIES le numéro de TVA que vous écrivez, et le garder : exécution du contrat — c’est ce qui permet de l’imprimer sur vos devis — et intérêt légitime à ce qu’un devis ne porte pas un numéro que ni l’administration ne reconnaît, ni l’entreprise n’a déclaré sur l’honneur comme le sien. Garder votre déclaration sur l’honneur, son texte et sa date : exécution du contrat — c’est ce qui permet d’imprimer ce numéro sur vos devis — et intérêt légitime à garder la trace de votre engagement. »
- **Une décision automatique** (remplace la partie TVA, de « Le numéro de TVA que vous écrivez » à « ce numéro n’est alors pas demandé ») : « Le numéro de TVA que vous écrivez suit une autre règle, et c’est une règle d’Opus : Opus le fait contrôler par VIES, le service de la Commission européenne qui interroge l’administration fiscale française. S’il le reconnaît, Opus l’imprime sur vos devis. S’il le refuse, vous pouvez déclarer sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à votre entreprise : Opus garde cette déclaration, son texte et sa date, et imprime alors ce numéro sur vos devis. Cette déclaration vous engage. Opus contrôle la forme du numéro et qu’il désigne bien votre entreprise, mais pas qu’il vous a été attribué ; et personne chez Opus ne revoit les refus de VIES. Vous pouvez retirer votre déclaration à tout moment. Tant que vous n’avez ni numéro reconnu ni déclaration, au régime réel de TVA, « Mon entreprise » vous signale qu’il manque une information pour vos devis à des particuliers, et, quand Opus permettra de remettre des devis, il ne vous laissera pas en remettre un à un particulier, ni à un client qu’Opus traite comme tel — une association, une copropriété, une société civile, ou une entreprise de 5 salariés au plus pour des travaux hors de son activité principale —, tant qu’elle manque. Votre service des impôts des entreprises peut activer ou corriger votre numéro auprès de l’administration fiscale, et vous pouvez le faire contrôler de nouveau, quelques heures après un refus. Si vous relevez en réalité de la franchise en base de TVA, choisissez-la dans « Mon entreprise » : ce numéro n’est alors pas demandé. » (P5 = oui : « S’il le refuse, ou s’il ne répond pas à trois contrôles en plus d’une heure, vous pouvez… ». La partie SIRET, qui dit « peut toujours être revue par un humain », et la partie badge restent.)
- **Combien de temps** : « Le numéro de TVA que VIES a reconnu, et la date de ce contrôle, restent attachés à votre compte et partent avec lui ; de même votre déclaration sur l’honneur, son texte et sa date. Elle est effacée si vous la retirez, ou remplacée si un autre numéro prend sa place — un numéro que vous déclarez, ou que VIES reconnaît ; si VIES reconnaît ensuite ce même numéro, elle reste jointe à sa preuve, et reprend effet s’il le refuse de nouveau. » (P5 = oui, dans la phrase des compteurs : « … et retient quelques heures qu’un numéro vient d’être refusé, et un jour que VIES n’a pas répondu pour lui, sous une empreinte… ».)
- **CGU « Ce qui est interdit »** : P4.

---

## Annexe B — Les pièges, en une liste

1. **Le retrait de la fonction Edge après un refus efface aujourd'hui toute
   preuve du numéro** (`index.ts` l. 353, mesuré) : `.neq('source',
   'declaration')`, et la renaissance d'une déclaration jointe à une preuve
   `vies`.
2. **L'upsert VIES par-dessus une déclaration** : le déclencheur garde la
   déclaration pour le même numéro, la vide pour un autre (sinon 23514 →
   HTTP 500, mesuré).
3. **Dans une fonction `security definer`, `current_user` vaut le
   propriétaire** — d'où la voie Edge ; et dans la garde I1, la lecture
   d'`auth.users` est imbriquée sous `current_user <> 'service_role'`.
4. **« certifi… » est interdit** dans `messageTva`, `MOTIFS` et tous les
   textes légaux ; « vérifi… » dans `SaisieTva.js` et `tva.js`.
5. **Une colonne hors du `grant` fait refuser tout l'en-tête** : la base
   d'abord, puis `git pull`.
6. **`rowToClient` invente « particulier »** : jamais pour décider d'une
   proposition.
7. **La partie « Votre entreprise » dépend désormais du devis** : relire les
   deux parties quand la réponse VUE change ; la phrase de la sous-partie
   vient de la base, jamais de l'écran.
8. **Une contrainte qui nomme `client_id` est interdite** (D4) ; la base ne
   mute rien de la réponse.
9. **Les rangs de l'entreprise ont des trous** ; le miroir filtre APRÈS le
   calcul du rang.
10. **Le corps de `tient_le_devis` porte des séquences de l'espace
    insécable** : règle de transport ; `motifs_refus_remise` n'a aucune
    barre oblique inverse.
11. **Relire les octets** (`od -c`) après avoir écrit une barre oblique
    inverse : l'outil d'édition l'a déjà changée (critique base M2 : trois
    endroits du v1 abîmés ainsi).
12. **`npm run verifier` ne joue aucun SQL** ; `generer-cas-remise
    --verifier` et `mesure-devis` se lancent à la main.
13. **`mesure-devis`** : serveur relancé avec `-c`, le module servi vérifié.
14. **Un état « en cours » ne se mémorise pas** : il se calcule depuis la
    file, sinon il survit à un échec.
15. **`PAIRES_DEVIS[0]` est la paire de la réduction** : toute paire nouvelle
    s'ajoute en fin.
16. **`DECLARATION_TVA` a des apostrophes typographiques, PLAN des droites** :
    comparer après normalisation, jamais « corriger » la constante.

---

## Annexe C — Critique → décision

« Vérifié » = le constat a été relu dans le code ou les textes cités avant
d'être tranché. « Reporté » = retenu, mais noté dans `A-FAIRE` (§7) plutôt que
construit.

### C.1 Droit (`critique/droit.md`)

| id | vérifié | décision | ce qui change |
|---|---|---|---|
| B1 | oui (`AIDE_TAUX_REDUIT`, `devis.js` l. 4531-4534 : « achevé depuis plus de deux ans ») | retenu | aide de Q2 réécrite (A.4) ; le motif « logement de moins de deux ans » reporté |
| B2 | oui (`legal.js` l. 1613-1617) | retenu | phrase de « Pourquoi » réécrite entière (A.7) |
| B3 | oui (L. 221-3 : « activité principale ») | retenu | aide et ordre de la feuille (A.3), rangée `professionnel` en dernier avec « Dans le doute… » |
| B4 | oui (`ECHEANCE_ACOMPTE` : « Seule exception ») | retenu | « Ces chantiers… », confirmation sans « et dans ce cas seulement », `ECHEANCE_ACOMPTE` avec « Exceptions : … » (A.4, A.6) |
| I1 | oui (X257 : « la moitié pour chacun », « hors ravalement ») | retenu | aide de Q2 (A.4) ; J11 |
| I2 | oui | retenu | aide et confirmation de Q1 (A.4) |
| I3 | oui (`schema.sql` l. 11630, l. 11640 ; R. 123-237 ouvert dans `A-FAIRE`) | retenu (décision) | le filtre garde `conso_adresse_*` (§2.5) ; J3 |
| I4 | oui (natures l. 14675-14678) | retenu (décision) | « prudence » pour `non_professionnel` (et les adresses gardées pour `professionnel`), `conso_tva_intra` reste « regle_opus » (décision 4) |
| I5 | oui | retenu | §1.4 point 4 ; `ECHEANCE_ACOMPTE_PRUDENCE` (A.6) |
| I6 | oui (`PAS_ENCORE_VERIFIE`) | retenu | sept faits, « les conditions du taux réduit de TVA » (A.6) |
| I7 | oui | retenu | « la règle du 8e jour ne s’appliquera pas », plus de droit affirmé ; J7 |
| I8 | oui (PLAN : « 5,5 % aussi pour les bornes … 278-0 bis N et P ») | retenu (décision) | nature `prudence` jusqu'au lot 3 ; J8 |
| I9 | oui (`CLAUDE.md`, section 48) | retenu | message `declare` (A.5) ; doctrine de `CLAUDE.md` réécrite (§4) ; J2 |
| I10 | oui | retenu | « Une décision automatique » nomme les clients traités comme des particuliers (A.7) |
| M1 | oui | retenu | « sauf pour un bâtiment neuf… » (A.3) |
| M2 | oui | retenu | phrase `consommateur` (A.3) |
| M3 | oui | retenu | « jusqu’à deux ans » (A.4) |
| M4 | oui | retenu | « (hors ravalement) » (A.4) |
| M5 | oui | retenu | « S’il le refuse… », « quelques heures après un refus » (A.7) |
| M6 | oui | retenu | « Opus contrôle la forme du numéro … mais pas qu’il vous a été attribué » (A.7) |
| M7 | oui | reporté | phrase de `conso_mediateur` dans `A-FAIRE` : la changer ajoute une phrase épinglée de plus pour un mot |
| M8 | — | résolu par la décision 4 | « Règle d'Opus » gardée ; P3 retirée |
| M9 | oui (`AIDE_NATURE_ACOMPTE` : « laisse au client 14 jours ») | retenu | `AIDE_NATURE_ACOMPTE_PRO` (A.6) |
| M10 | — | retenu (décision 2) | 2c fige aussi le texte coché (§7) |
| M11 | — | retenu | J2 |

### C.2 Base (`critique/base.md`)

| id | vérifié | décision | ce qui change |
|---|---|---|---|
| B1 | oui (mesuré par la critique ; textes A.7 du v1) | retenu, options (a) + (b) (décision 2) | déclencheur §2.7 (même numéro : gardée) ; « Combien de temps » dit exactement ce que fait la base ; 2c fige le texte (§7) |
| I1 | oui (`schema.sql` l. 12463-12468 : la garde n'existe que pour `essai`) | retenu (décision) | garde 23514 dans `tient_la_preuve_tva` (§2.7), aucun OP |
| I2 | oui (`numeroTvaImprime` ne lit pas le régime) | retenu (décision) | action `retirer` (§2.10), bouton en deux appuis (§3.7), textes |
| I3 | oui | retenu (décision) | `texte` envoyé, `texte_perime` (§2.10) |
| I4 | oui | retenu | règle écrite une fois (`v_valable`), commentaire de colonne (§2.1, §2.5) ; la copie figée en 2c (§7) |
| I5 | oui (`mes_donnees` l. 17175-17176, `to_jsonb`) | retenu (décision) | `reconnu_le := declare_le` ; l'export retire `reconnu_le` et `vies_le` d'une déclaration ; commentaires (§2.6, §2.9) |
| M1 | oui (`tva.md` §2 A bis porte sur l'ancien déclencheur) | retenu | la raison retirée (§1.2) |
| M2 | oui | retenu | ce v2 n'écrit aucune barre oblique inverse |
| M3 | oui (PLAN : apostrophes droites) | retenu | comparaison normalisée (§5.4, annexe B.16) |
| M4 | oui | retenu | `deja_reconnu` dit la date (A.5) |
| M5 | oui | retenu | redéclarer le même numéro n'écrit rien (§2.10) |
| M6 | oui | reporté | `A-FAIRE` |
| M7 | oui (`index.ts` l. 358-361) | retenu en partie | la phrase `non_refuse` ne contredit plus l'écran ; le reste reporté |
| M8 | oui | retenu | `pourQuiValable` gardé contre le vide ; un cas de `cas-remise` (§3.1, §5.3) |
| M9 | oui (`api.js` l. 2177-2186) | retenu | 42703 sur `declare_le` → relecture sans elle (§2.11, §3.3) |
| M10 | oui | retenu | deux tableaux aux clauses identiques, et un essai qui les fait alterner (§2.5) |

### C.3 Écran (`critique/ecran.md`)

| id | vérifié | décision | ce qui change |
|---|---|---|---|
| E-B1 | oui (`tva.js` l. 431-446) | retenu | phrases `refuse` selon `peutDeclarer` et `declare_le` (A.5) ; contrôle |
| E-B2 | oui (`SaisieDevisScreen.js` l. 763-857 ; `ceQueDitLaCarte`) | retenu | §3.8 : en route et en échec calculés à chaque rendu |
| E-I1 | oui (nombres de lignes estimés par la critique) | retenu (décision) | gabarits, deux moitiés, gauche sans écriture (§3.4) |
| E-I2 | oui (`SaisieTva.js` l. 154-161 avant l. 172-227) | retenu | bloc sous le bouton VIES ; case décochée (§3.7) |
| E-I3 | oui (l. 51, l. 118, l. 156) | retenu | tableau des issues (§3.7) |
| E-I4 | oui | retenu | `peutDeclarer` (§3.7) ; « Faire contrôler de nouveau » sans retaper |
| E-I5 | oui (`PourRemettre.js` l. 420 ; `titresDesParties`) | retenu | `liste.reponseVue` (§3.6) |
| E-I6 | oui (`SEUIL_LIRE_LA_SUITE = 200` ; mesuré : `devis_client` 233, `devis_lieu` 203, `devis_validite` 216) | retenu en partie | les deux phrases nouvelles ≤ 200, consigne d'abord, second bouton ; « toutes les phrases » REJETÉ : trois phrases existantes le dépassent, reporté |
| E-I7 | oui | retenu (décision) | une rangée + une carte, avant « Conditions » (§3.5) ; l'option « dans Conditions » écartée |
| E-I8 | oui | retenu | « Ces travaux font-ils partie d’un chantier qui crée un bâtiment neuf ? », deux sous-titres, l'introduction (A.4) |
| E-I9 | oui (`demo.js` : « SCI des Verlusses », `type: 'entreprise'`) | retenu (décision) | ordre protecteur (A.3) ; `mesure-devis` avec la SCI |
| E-I10 | oui (`EnteteDevis.js` l. 190 ; `ChoixClientDevis.js` l. 134) | retenu | « À quel titre ? » partout ; bloc après les boutons du client |
| E-I11 | oui (`SaisieDevisScreen.js` l. 560-563) | retenu (décision) | `feuille.type` `pour_qui` et `chantier_neuf` ; aucune `FeuilleBas` dans l'en-tête |
| E-I12 | oui | retenu (décision) | phrases A.5 selon P5 ; P5 posée |
| E-M1 | oui | retenu | « (J4) » retiré du texte affiché |
| E-M2 | oui | retenu | la rangée n'existe que si une question est montrée ; Q2 montrée si vraie |
| E-M3 | oui (`NOMS_ENTETE`) | retenu | §3.4, §3.5 |
| E-M4 | oui | retenu | `selected`, bouton « Répondre » (§3.1, §3.4) |
| E-M5 | oui | retenu | « Commande-t-il à titre privé ? », « Oui, à titre privé » |
| E-M6 | oui | retenu | §1.4 point 6 ; note de démonstration (A.5) |
| E-M7 | oui (`PAIRES_DEVIS[0]` = la réduction, mesuré) | retenu | paire en fin (§3.1) |
| E-M8 | oui | retenu | `devisRef.current.clientId` (§3.4) |
| E-M9 | oui | reporté | `A-FAIRE` |
| E-M10 | oui | retenu | « Non (par défaut) » (A.4) |
