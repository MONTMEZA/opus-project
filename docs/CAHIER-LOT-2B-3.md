> **Cahier de l'étape 2b-3 du module devis — la réparation urgente, la
> garantie décennale et son attestation, et le moment où l'acompte est
> payé.**
>
> **Archivé le 13/11/2026, à la fin de l'étape 2b-3.** Ce cahier (v3, 12/11
> au soir : le v2 plus les réponses du propriétaire à P1, P2 et P3) a guidé
> l'étape ; il est versé ici TEL QU'IL A SERVI, sans une retouche, sous le
> trait qui suit cet en-tête. **En cas de désaccord, la section « La
> réparation urgente, la décennale, le moment du paiement — étape 2b-3 » de
> CLAUDE.md et le code disent vrai.** Ce qui a changé depuis sa rédaction :
>
> - **R1, le défaut grave de la relecture adverse du 13/11, et la décision
>   du propriétaire le même jour : un bâtiment neuf ne permet plus « à la
>   signature ».** Ce cahier le permet (son §0, son §1.2, P2 au §1.3, le
>   point 5 du §2.5 et l'annexe A.1 : `chantier_neuf_conso is not true` au
>   rang 10). Or, pour la construction d'un logement, le code de la
>   construction peut laisser au client dix jours pour se rétracter, et
>   interdire tout paiement, ou engagement de payer, avant (L. 271-1 et
>   L. 271-2, lus dans le dump LEGI local, en vigueur). Le rang 10 ne lit
>   plus `chantier_neuf_conso` ; la ligne « pourquoi » gagne une cause,
>   `chantier_neuf`, juste après « pas de réponse » ; l'aide et la
>   confirmation de la première question de « Le chantier » (2b-2) le disent
>   aussi. Trois formulations ont été retouchées le même jour, relues contre
>   les articles : « à compter du lendemain de la première présentation »,
>   « tout paiement ou engagement de payer », « bien plus pour une société ».
>   `supabase/cas-remise.json` compte 125 cas (le cas 93 change, les cas 123
>   à 125 s'ajoutent). Ce que R1 ne règle pas — un neuf dont toutes les
>   lignes sont urgentes, un neuf « pour son entreprise », l'échéance à
>   écrire sur ces devis — est au juriste : `docs/A-FAIRE.md`, « Après
>   l'étape 2b-3 ».
> - **R2 et R3, décidées le 13/11** : l'aide de l'urgence (annexe A.2,
>   `AIDE_URGENCE`) dit « Seulement le strict nécessaire pour répondre à
>   l’urgence, dans un entretien ou une réparation que votre client vous a
>   expressément demandés, chez lui : … » ; l'amende (A.2, et la confirmation
>   de 2b-2) gagne « bien plus pour une société, et une interdiction
>   d’exercer ».
> - **E1, le défaut grave de l'écran** : une décennale déclarée sans fichier
>   disait « Valable jusqu’au … » dans « Mon entreprise » → Assurances, là où
>   mène le bouton du point « La loi ». Elle dit « Attestation non jointe ·
>   valable jusqu’au … » : la ligne d'état a six formes, pas les trois de
>   son §3.2.
> - **Des écarts dits par la construction, où le code fait foi** : la
>   décennale valable de l'essai 49-remise est posée dans son décor commun ;
>   le rang 11 s'écrit avec `is not true` et `is true`, jamais `not x` ; le
>   cas 20 de l'essai gagne une pièce dans un devis tout urgent (267 valeurs,
>   pas 266) ; le jour du téléphone s'appelle `jourDuTelephone()` ;
>   `lireConditions` n'écrit l'échéance que si le choix la porte ;
>   l'invariant de fin de `mesure-devis` (« quatre devis à la fin », §3.10 et
>   §5.5) ne pouvait pas tenir, et il dit « les sections 2b-3 ne laissent
>   aucun brouillon » ; les sabotages S5 et S26 (§5.6) n'étaient pas vus par
>   ce qu'il dit (le bilan de l'essai 49 est désormais un nombre jugé, et un
>   contrôle `node` tient S26) ; S50 n'est pas une vérification du dépôt.
> - **Les fichiers qu'il cite** (`critique/…`, `comprendre/…`,
>   `lot2b/textes/…`, `longueurs-v2.mjs`…) et les noms de constats (`E-I…`,
>   `B1`, `M…`, `D…`, `J-…`) étaient des documents de travail de la session :
>   ils ne sont pas dans le dépôt. Ses numéros de ligne datent de `c0403bf`.
> - **Vérifié avant la copie** : il ne contient aucune donnée personnelle du
>   propriétaire (ni nom, ni SIREN, ni numéro de TVA, ni adresse e-mail), et
>   aucune barre oblique inverse ni caractère invisible ; rien n'a donc été
>   remplacé.

---

# Étape 2b-3 du module devis — « les lignes » : la réparation urgente, la garantie décennale et son attestation, et le moment où l'acompte est payé — cahier v3 (12/11/2026)

> **CAHIER v3 = v2 + les réponses du propriétaire (12/11/2026, au soir),
> toutes les trois RECOMMANDÉES** :
> - **P1 = A** — une question par devis dans « Le chantier » (« Ces travaux
>   peuvent-ils engager votre garantie décennale ? »), vide = « Oui » par
>   prudence, et la remise est REFUSÉE sans attestation valable. Les
>   paragraphes « Si P1 = C » (§2.8, §3.11) ne se construisent PAS ; les
>   paragraphes « si P1 = A » se construisent.
> - **P2 = oui** — « Quand le client paie-t-il cette somme ? » dans
>   « Conditions » (« Dès le 8e jour » par défaut · « À la signature »), le
>   motif `devis_acompte_signature` et la ligne « pourquoi ». Les
>   paragraphes « si P2 = oui » se construisent.
> - **P3 = oui, ces mots** — les textes de l'annexe A.2, tels quels.
>
> Plus rien n'attend le propriétaire avant la migration (son accord, Opus
> fermé). Relevé sur `c0403bf` (HEAD du
> 12/11/2026 ; `supabase/schema.sql` y a le md5
> `3efa04f605793a2ade338eab68e5906e`, le même qu'à `6710ff3` : c'est
> l'imitation de la vraie base pour la migration — ÉTABLI, `md5sum` refait
> pour ce v2). **Le CODE fait foi.**
>
> Sources : le cahier v1 (`…/lot2b3/cahier/cahier-v1.md`) et ses trois
> critiques adverses (`…/lot2b3/critique/droit.md`, `base.md`, `ecran.md`),
> **chaque constat vérifié dans le code, les textes ou le schéma avant d'être
> accepté** (annexe C) ; les quatre relevés du 12/11 (`…/lot2b3/comprendre/`) ;
> les textes de loi recopiés le **04/11/2026** depuis l'open data LEGI de la
> DILA (`…/scratchpad/lot2b/textes/`, ligne 11 de chaque fichier : « Lu le :
> 2026-11-04 … en vigueur au 2026-11-04 ») — Légifrance répond 403 au
> conteneur, **rien n'a été relu ailleurs, et ce qui suit vaut à la date de
> ces copies** ; un relevé de FORME de la vraie base refait le 12/11 pour ce
> v2 par `SupabaseLecture` (des comptes, rien d'autre).
>
> **ÉTABLI** = lu dans le code, dans un texte recopié, ou mesuré par une
> requête de forme (la source est citée) ; **DÉDUIT** = raisonné, pas
> mesuré ; **À VÉRIFIER** = ni lu ni mesuré. **(P)** = au propriétaire ;
> **(J)** = au juriste. Nature d'un motif : **la loi** (un texte l'impose
> dans ce cas) · **par prudence** (Opus ne connaît pas le cas, il compte le
> plus protecteur) · **règle d'Opus** (plus stricte que la loi, choisie par le
> propriétaire) ; un **avis** ne bloque rien ; une **aide** est sous un champ.
>
> Méthode **« Accélérer »** (décision du 08/11) : une seule relecture adverse
> par étape, sur le CODE construit ; seul un défaut qui perd des données,
> affiche quelque chose de faux ou touche à la sécurité relance un tour.
>
> Ce document ne contient aucune barre oblique inverse : là où le code porte
> la séquence d'échappement d'une espace insécable, il le dit en mots (annexe
> B, point 14).

## Ce qui a changé depuis le v1

Les trois critiques ont relevé **4 bloquants** (D1 et D2 en droit, B1 en
base, E-B1 à l'écran), **20 importants, 37 mineurs et 4 essais manquants**
(plus un « appui » de la critique écran sur deux constats de droit).
**Tous ont été reproduits** dans le code, les textes ou le schéma ; **aucun
n'est réfuté sur les faits** ; un seul est écarté (M12 de la base, une
amélioration qui ferait une seconde règle). Le détail, constat par constat :
annexe C. Les changements qui comptent :

1. **Le point « attestation » a désormais TROIS formes, pas deux** (B1 base,
   D7 droit). « La loi » ne s'affiche plus quand l'attestation EST jointe et
   que seule sa date de fin manque dans Opus : la loi demande de joindre
   l'attestation, pas de recopier sa date. Nouvelle clé
   `devis_attestation_date`, **par prudence** ; `devis_attestation` (la loi)
   garde « aucune attestation jointe, ou une date dépassée » ; `devis_decennale`
   (par prudence) garde « pas de réponse ». Toujours UNE au plus par devis
   (§2.5, A.1). `CONTRAT_B2` : **16 clés sur 11 rangs**.
2. **Les textes de l'urgence disent le vrai prix d'une erreur** (D1, D2, D3,
   D12, M1, M2 droit) : « douze mois de plus » et le pénal, comme la phrase
   approuvée le 09/11 (`devis.js` l. 5077-5079) — le v1 n'en avait pris que
   la moitié rassurante (« le client garde ses 14 jours ») ; « expressément »
   entre dans l'étiquette ; la ligne posée sur un devis venu d'une urgence ne
   dit plus « marquez chaque ligne » mais « ne marquez une ligne que si… » ;
   l'aide ne promet plus « pas de délai de rétractation » à tout client, seulement
   « s'il commande à titre privé ». P3 décrit désormais les mots exacts.
3. **« Quand l'acompte est-il payé ? » est câblée par la voie de la carte
   « Conditions »** (E-B1 écran, le bloquant de l'écran) : `etatInitialConditions`
   lit l'échéance, `lireConditions` l'écrit, « Corriger » la rouvre ; sinon
   rouvrir puis fermer la carte effaçait « À la signature » en silence. La
   question est **toujours montrée** (E-I2 : rien ne saute sous « Validité »),
   sous un énoncé neutre (« Quand le client paie-t-il cette somme ? ») et des
   pastilles courtes (« Dès le 8e jour (par défaut) », M2 écran).
4. **L'écran DIT pourquoi « À la signature » est refusé** (E-I7 écran, D4 droit) :
   une ligne sous les pastilles, quand « À la signature » est choisi et que la
   règle ne le permet pas — pas de réponse « à quel titre », une entreprise
   (prudence), une option, une ligne non marquée. C'est aussi ce qui règle la
   contradiction entre l'aide du 8e jour (qui cite l'exception d'urgence) et le
   point qui la refuse à une petite entreprise.
5. **La phrase du point de l'acompte ne présente plus un choix d'Opus comme la
   loi** (D5) : « ce devis pourrait n'autoriser aucun paiement avant ».
6. **La branche « urgence » des aides de l'acompte est écrite** (D8) : pour un
   particulier, l'aide de la nature d'aujourd'hui ; pour une association, la
   version « entreprise » (sans rétractation).
7. **« Le chantier »** : Q3 met « Non » à gauche comme Q1 et Q2 (E-I3) ; la
   carte s'ouvre SUR la question visée quand on vient d'un point (E-I1) ; Q3
   entre dans `CHAMPS_DU_CHANTIER` et a son état « enregistrement… / pas
   enregistré » (E-I6) ; le résumé dit « ; décennale : non » au lieu d'une
   phrase qui faisait passer la rangée à trois lignes à 320 points (M1 écran).
8. **Plus de second bouton qui pousse vers « Non »** (E-I4) : le point
   `devis_attestation` (l'artisan a déjà dit « Oui ») n'en a plus ; le point
   `devis_decennale` a « Répondre dans « Le chantier » », ouvert sur Q3, et sa
   phrase dit exactement ce qui éteint le point.
9. **L'aide de Q3 ne dit plus « quel que soit le client »** (D6) : faux pour le
   sous-traitant (C. civ. 1792-1 1°). Elle dit « et pas seulement pour un
   particulier », et que la loi ne la demande peut-être pas en sous-traitance
   ni pour certains ouvrages exclus (L. 243-1-1 I). Même correction dans l'avis
   existant `decennale_sans_attestation`. « Qui ne touche à aucun ouvrage »
   devient « qui ne crée ni ne refait aucun ouvrage » (M6 droit).
10. **La date de l'attestation a sa propre ligne** dans la rangée d'une
    assurance (E-I5) : ajoutée au bout d'un texte coupé à deux lignes, elle
    disparaissait sous « … » à 320 points, et la mesure prévue (`innerText`)
    serait passée au vert.
11. **`PAS_ENCORE_VERIFIE` garde l'urgence** (D9) : « si une ligne marquée
    « réparation urgente » l'est vraiment » — Opus ne vérifie aucune de ses six
    conditions.
12. **L'avis des modalités « à la signature » dit de RETIRER la formule** (D10,
    M4 droit), et la liste de 2c gagne ce que le v1 oubliait (D11) : la règle
    des 7 jours vise TOUT paiement (le solde d'un dépannage du jour) ; la
    demande expresse écrite pour commencer une ligne non urgente ; la prudence
    « petite entreprise » vaut aussi pour l'information sur la rétractation ;
    et la remise de 2c doit lire l'attestation SOUS VERROU (I3 base).
13. **Les essais gardent leur sens** (I1 base) : les fiches d'essai
    (`essais-section-49-remise.sql`, `generer-cas-remise.mjs`) reçoivent par
    défaut une décennale valable (fichier, `2999-12-31`), pour que **les 85
    cas existants et leurs 28 « rien ne manque » ne changent pas**. Le
    sabotage « lecture de l'attestation sans `a.pro_id = v_pro` » se joue par
    une enveloppe `security definer` (I2 base), sinon la RLS le cache.
14. **Des corrections de faits** : 23502 est traduit en français
    (`erreurs.js` l. 928-934, M1 base) ; le joueur des cas d'argent porte 69
    cas, pas 44 (M2) ; S38 est vu par `FORMES_CALCUL.recalcule_devis`, pas par
    le cas 27 a (M3) ; S21 était une mutation équivalente (M4) ; l'essai
    49-conditions compte des LIGNES de colonnes, 39 → 42 (M7) ; la contrainte
    posée sous condition vise SA table (`conrelid`, M6).
15. **Trois questions au propriétaire, réécrites pour lui** (en français
    simple, sans mot technique) ; la liste du juriste passe de J11 à J14
    (M5 droit).

### Ce qui change par rapport à la description d'origine (`docs/CAHIER-LOT-2B-1.md` §5)

La description de 2b-1 était une PROPOSITION « à relire au début de chaque
étape » (`docs/CAHIER-LOT-2B-1.md` l. 11-12, ÉTABLI). Relue contre les
textes, le code et la vraie base, elle change sur sept points :

1. **La garantie décennale se dit par DEVIS, pas par ligne** (recommandation,
   P1) : la loi joint l'attestation « aux devis et factures » (L. 243-2 al. 2,
   `assur-L243-2.txt` l. 14), pas à une ligne ; et une case par ligne éteinte
   par défaut serait la réponse la MOINS protectrice appliquée d'office —
   l'inverse de la règle 1 de 2b-1. Une troisième question entre dans « Le
   chantier ». La case par ligne reste une réponse possible (P1, C), décrite
   au §2.8 et au §3.11.
2. **Le point de l'attestation a trois formes** : `devis_attestation` (la loi)
   quand l'artisan a répondu « Oui » et qu'aucune attestation n'est jointe
   (ou seulement une attestation dont la date est passée) ;
   `devis_attestation_date` (par prudence) quand une attestation est jointe
   mais sans date de fin écrite dans Opus ; `devis_decennale` (par prudence)
   quand il n'a rien répondu. « Valable » = un fichier joint ET une date de
   fin écrite, pas dépassée à l'heure de Paris.
3. **Le motif « acompte à la signature » a enfin un fait à lire** : une
   question « Quand le client paie-t-il cette somme ? » dans « Conditions »
   (recommandation, P2). Sans elle, la description d'origine (« son motif :
   la conséquence sur l'acompte ») n'avait rien sur quoi s'appuyer : aucune
   colonne d'échéance n'existe (ÉTABLI, aucune occurrence de « echeance »
   dans `schema.sql`).
4. **`devis_ligne_forme_check` n'est PAS étendue** : une contrainte neuve,
   `devis_ligne_urgence_check` (« seul un poste »), couvre à la fois l'option,
   le titre et la réserve, avec sa propre phrase. Étendre la première ne
   ferait que doubler la règle, et la base nommerait alors `forme_check` —
   avant `urgence` dans l'ordre alphabétique — dont la phrase ne parle pas
   d'urgence (§1.2).
5. **Aucun code `OP028`** : la « garde d'urgence » à laquelle il était
   réservé gardait « l'urgence seulement sur un devis venu d'une urgence »,
   règle abandonnée (une urgence ne dépend jamais de l'origine,
   `docs/PLAN-DEVIS.md` l. 3203). Ce que 2b-3 refuse s'écrit en contrainte
   `_check` ou en motif. `OP028` reste libre.
6. **L'urgence n'a ni date ni feuille de confirmation** : un interrupteur, une
   aide fixe, et sous lui, une fois allumé, le prix d'une erreur. La preuve
   qui compte en droit est la sollicitation expresse du CLIENT (L. 221-28 8°,
   L. 221-10 4°), pas le geste de l'artisan : une date posée par la base
   n'aurait aucun lecteur.
7. **L'urgence n'est plus « proposée » sur un devis venu d'une urgence**
   (la description disait « proposée sur une ligne neuve ») : elle naît éteinte
   partout, et une LIGNE DE TEXTE rappelle les conditions. « Proposer » une
   case qui retire un droit, c'est déjà pousser à la cocher.

---

## 0. En une page

**Ce que 2b-3 fait** — trois faits, tous dans un brouillon :

| | ce que l'artisan voit | ce que la base garde |
|---|---|---|
| **A. La réparation urgente** | dans la carte d'un POSTE, après « Offert » : « Pour les droits de votre client », un interrupteur « Réparation urgente expressément demandée par le client », éteint par défaut, son aide fixe ; allumé, une phrase de plus dessous (ce que coûte une erreur). Sur un devis venu d'une urgence, une ligne fixe au-dessus rappelle de ne marquer que le strict nécessaire — rien n'est jamais allumé sans appui. Dans la liste : « · réparation urgente » | `devis_lignes.urgence` (booléen, faux par défaut) |
| **B. La garantie décennale** (si P1 = A) | une troisième question dans « Le chantier » : « Ces travaux peuvent-ils engager votre garantie décennale ? » — « Non » · « Oui (par défaut) » ; sans réponse, Opus compte « Oui » | `devis.engage_decennale` (vide, vrai ou faux) |
| **C. Quand l'acompte est payé** (si P2 = oui) | dans « Conditions », sous « Acompte ou arrhes ? », toujours montrée : « Quand le client paie-t-il cette somme ? » — « Dès le 8e jour (par défaut) » · « À la signature » ; si « À la signature » n'est pas permis, une ligne dessous dit pourquoi | `devis.acompte_a_la_signature` (vide, vrai ou faux) |

Et dans « Ce qu'il manque pour remettre ce devis », **quatre clés
nouvelles sur deux rangs**, signature de `motifs_refus_remise` inchangée :

| rang | clé | nature | quand |
|---|---|---|---|
| 10 | `devis_acompte_signature` | par prudence | « À la signature » choisi, un acompte demandé, et la règle de §1.2 ne le permet pas |
| 11 | `devis_attestation` | la loi | « Oui » à la question décennale, et aucune décennale avec un fichier joint — ou seulement des décennales dont la date de fin est passée |
| 11 | `devis_attestation_date` | par prudence | « Oui », une décennale avec un fichier joint mais SANS date de fin, et aucune valable |
| 11 | `devis_decennale` | par prudence | pas de réponse à la question décennale, et aucune attestation décennale valable |

Au rang 11, **une clé au plus** (elles s'excluent, comme le rang 1).

Pour le propriétaire, AUJOURD'HUI : **rien ne change** sur ses trois
brouillons — son attestation décennale est jointe, datée et valable (relevé
de forme refait le 12/11 : 1 décennale, fichier, date ≥ jour de Paris).
**Mais elle se termine dans 31 à 60 jours** (même relevé) : ce jour-là, ses
brouillons sans réponse « Non » gagneront le point « Joignez … votre
attestation décennale et sa date de fin » s'il ne la renouvelle pas dans
« Mon entreprise » (§1.4).

**Ce que 2b-3 ne fait PAS** : rien n'est remis, imprimé ni numéroté (2c) ;
l'attestation n'est ni jointe ni figée (2c) ; la mention « pas de droit de
rétractation » des lignes urgentes s'imprimera en 2c (L. 221-5 10°) ; aucune
fonction `security definer`, aucun déclencheur, aucun code `OP` nouveaux ;
aucun module natif, aucune reconstruction.

**L'ordre de livraison** : la base (migration gardée par son md5, Opus fermé)
→ `git pull`. Les commits de l'étape portent « NE PAS FAIRE `git pull` AVANT
LA MIGRATION 2b-3 » : une application nouvelle face à l'ancienne base
enverrait `urgence` à chaque création de ligne (et les deux colonnes du
devis), et ces écritures seraient refusées (§2.7).

**Trois questions au propriétaire (§1.3)**, chacune avec ma recommandation.

---

## 1. Les décisions, et ce qui reste à demander

### 1.1 Ce qui est déjà décidé (ÉTABLI)

| décision | source | ce qu'elle impose ici |
|---|---|---|
| quatre étapes, 2b-3 = « urgence, peut engager ma garantie décennale, l'attestation » (05/11) | `docs/CAHIER-LOT-2B-1.md` l. 82, l. 96 et §5 | le découpage ; PAS la forme (« par ligne ou par devis, et le défaut » restait une question de l'étape, §5) |
| « un fait de 2b naît VIDE ; le vide est un motif, ou le cas le plus protecteur » | `docs/CAHIER-LOT-2B-1.md` l. 61-66 | l'urgence naît éteinte (éteinte = protecteur) ; la décennale naît vide et vaut « Oui » (protecteur) ; l'échéance naît vide et vaut « dès le 8e jour » (protecteur) |
| trois natures, l'écran dit laquelle ; « chaque fait naît avec son lecteur » | `docs/CAHIER-LOT-2B-1.md` l. 67-74 ; commentaire 49.9, `schema.sql` l. 14615-14665 | chacun des trois faits a un motif ET un lecteur à l'écran ; un cas où Opus ne sait pas se dit « par prudence » |
| la règle de la base s'écrit UNE fois ; signature de `motifs_refus_remise` définitive | `docs/PLAN-DEVIS.md` l. 3195-3201 ; `schema.sql` l. 14832-14834 et commentaire « POURQUOI UNE TABLE » | `create or replace` ; des clés de plus, jamais un paramètre de plus |
| D3, D4 (a, b, c) : aucune contrainte « origine ⇒ lien » ; aucun motif ne nomme une origine | `docs/PLAN-DEVIS.md` l. 3510-3511 ; `scripts/verifier-devis.mjs` l. 3346-3442 | ni contrainte ni motif ne lisent `source` ou `sos_request_id` ; seul l'ÉCRAN peut tenir compte de l'origine, pour aider |
| le lien SOS « n'est jamais exigé pour marquer une ligne urgente : une urgence peut arriver par téléphone » | `docs/PLAN-DEVIS.md` l. 3203 | aucune condition d'origine |
| urgence par LIGNE, devis « mixte » permis | `docs/PLAN-DEVIS.md` l. 2876 ; `docs/CAHIER-LOT-2A.md` l. 545-555 | un marqueur sur `poste` ; « à la signature » seulement si TOUTES les lignes chiffrées le sont |
| le marqueur décennal se nomme par sa conséquence, « jamais « construction » seul » | `docs/CAHIER-LOT-2A.md` l. 556-557 | « … engager votre garantie décennale » |
| « Opus propose, l'artisan confirme » ; aucune question sur le moment de la signature : le cas le plus protecteur vaut pour tous les devis (09/11) | `docs/PLAN-DEVIS.md` l. 3898-3900 | rien n'est allumé ni choisi sans appui ; l'échéance par défaut est le 8e jour ; `PAS_ENCORE_VERIFIE` garde « le moment de la signature » |
| « AUCUNE ASSURANCE N'EST EXIGÉE en général » (18/10) — sans rien trancher sur le refus de remise sans attestation | `schema.sql` l. 11177-11179 ; `docs/CAHIER-LOT-2B-1.md` l. 158-162 (« elle se décidera en 2b-3 ») | une assurance reste facultative dans « Mon entreprise » ; le refus de remise est la question P1 |
| « garder la grande place » (D-A bis, 06/11) | `docs/CAHIER-LOT-2B-1.md` §0.1 bis | les gabarits de la ligne « Pour le remettre » ne changent pas (510 motifs au plus, trois chiffres) ; la rangée « Le chantier » garde une hauteur fixe |
| « Accélérer » (08/11) | `CLAUDE.md`, 2b-1 | une seule relecture adverse, du code |

### 1.2 Ce que ce cahier tranche lui-même (choix techniques)

| choix | raison | écarté |
|---|---|---|
| **l'urgence : `devis_lignes.urgence boolean not null default false`** | « éteint » est le cas protecteur (il RETIRE des droits au client) : aucun « vide » à interpréter ; même forme que `offert`, `main_oeuvre`, `fourniture_non_comprise` (`schema.sql` l. 12998-13000) ; ajoutée à défaut constant, elle n'écrit aucune ligne existante (DÉDUIT, PostgreSQL ≥ 11 ; la vraie base est en 17) | une colonne nullable (« pas dit ») : un motif par ligne chiffrée ferait jusqu'à 500 motifs de plus — les gabarits passeraient à quatre chiffres (`docs/A-FAIRE.md`, « Les gabarits de la ligne ont des bornes ») |
| **`devis_ligne_urgence_check` : `type = 'poste' or not urgence`** ; `devis_ligne_forme_check` inchangée | une seule écriture de la règle ; sa phrase dit « seul un poste… » ; ordre alphabétique : `unite` < `urgence`, elle vient en dernier (`CONTRAINTES_LIGNE`, `devis.js` l. 157-168) | étendre `forme_check` : la base la nommerait d'abord, avec une phrase qui ne parle pas d'urgence |
| **pas d'urgence sur une option** | « strictement nécessaires pour répondre à l'urgence » (L. 221-28 8°, `conso-L221-28.txt` l. 21) s'accorde mal avec un travail que le client peut refuser ; marquer une option retirerait la rétractation d'un travail facultatif — le sens qui expose (DÉDUIT) ; au juriste (J7) | — |
| **l'urgence : ni date, ni feuille de confirmation** | la condition légale est la sollicitation expresse DU CLIENT (L. 221-28 8°, L. 221-10 4°), pas le geste de l'artisan : une date posée par la base n'aurait aucun lecteur (« bouton §18 ») ; une feuille par ligne serait touchée sans être lue au troisième poste (le chantier neuf, lui, est UNE question par devis) | le modèle du « Oui » au chantier neuf (date + confirmation) ; à dire (§1.4) |
| **l'urgence n'est JAMAIS reprise** : ni de la ligne précédente, ni d'une proposition de la base de postes ou de la mémoire, ni de l'origine du devis | elle retire des protections ; rien de pré-coché qui retire une protection (décisions du 21/10, du 03/11, du 09/11) | la proposition « allumée » de `docs/CAHIER-LOT-2A.md` l. 547, et « proposée » de la description d'origine |
| **sur un devis venu d'une urgence, une LIGNE DE TEXTE fixe** au-dessus de l'interrupteur, qui LIMITE (« ne marquez une ligne que si… »), jamais la case cochée | « proposer n'est pas allumer » ; une demande SOS ne prouve ni l'urgence au sens de la loi, ni le domicile, ni la qualité de consommateur — le créneau « Demain » s'y présente comme « Ça peut attendre la nuit » (`src/data/urgences.js` l. 74, ÉTABLI) ; la carte reçoit une VALEUR (`depuisUneUrgence`), la base ne lit pas l'origine (D4-c) | « marquez chaque ligne… » (v1, D2) ; un avis « devis venu d'une urgence sans ligne marquée » : il pousserait à marquer |
| **l'étiquette dit « expressément »** : « Réparation urgente expressément demandée par le client » | la loi dit « expressément sollicités par lui » ; le projet a déjà corrigé cette faute au lot 2a (TC-8, `devis.js` l. 2140-2146 : sans ce mot, un dépannage proposé par l'artisan et accepté a été « demandé », pas « expressément sollicité ») | « … demandée par le client » (v1, D3) |
| **`urgence` entre dans `ligneVierge`** | comme les trois autres interrupteurs (`devis.js` l. 1217-1223) : une ligne où l'on n'a touché que lui ne disparaît pas sans un mot, elle reste « incomplète » et la garde de sortie le dit | — |
| **« · réparation urgente » dans la liste du devis** | la liste est « l'écran qu'on montre à un client » (réponse Q3 a du 23/10, `devis.js` l. 1231-1255) ; l'urgence S'IMPRIMERA en 2c (« pas de droit de rétractation pour ces lignes ») : la montrer n'en dit pas plus que le devis remis | à dire (§1.4) |
| **la décennale (si P1 = A) : `devis.engage_decennale boolean`, nullable, sans défaut ; vide = « Oui » par prudence** | la règle 1 ; la loi attache l'attestation au DEVIS (L. 243-2 al. 2) ; une case oubliée ne retire jamais l'exigence | une case par ligne éteinte par défaut (P1, C) |
| **la question décennale dans la carte « Le chantier »**, sans confirmation | une carte qui existe, avec ses gabarits et sa file d'écriture ; pas de confirmation parce que la réponse se dit PAR DEVIS (un appui par devis, pas par ligne), que son défaut est le cas protecteur, et que la loi ne punit pas l'attestation non jointe (L. 243-3 ne vise que L. 241-1 à L. 242-1 — archive LEGI du 13/07/2025, `droit.md` §3.6) ; mais « Non » prive le client de l'attestation que la loi lui doit : l'aide dit « Dans le doute, gardez « Oui » » | une rangée de plus ; l'en-tête (décision de 2b-2 : jamais de question dans l'en-tête) ; la justification du v1 (« Non retire une exigence, pas un droit du client »), inexacte (M11 droit) |
| **dans « Le chantier », « Non » à gauche dans les TROIS questions** | Q1 et Q2 mettent « Non » à gauche (`ChantierDevis.js` l. 102-115, l. 124-136, ÉTABLI) ; un pouce qui vise « Oui » à droite par habitude toucherait « Non » à Q3 — la réponse qui retire l'exigence, sans confirmation | « Oui (par défaut) » à gauche (v1, E-I3) |
| **« attestation valable » = une assurance `nature = 'decennale'`, un `attestation_chemin`, ET une `valide_jusquau` au moins égale au jour de PARIS** | une attestation porte toujours sa période de validité (A. 243-3 1° e, `assur-A243-3.txt` l. 19) ; la garantie vise les chantiers OUVERTS pendant cette période (2° a) ; un devis pas encore signé ouvrira son chantier après aujourd'hui : une date passée ne couvre pas ce chantier (DÉDUIT) ; la vraie base est en UTC (relevé du 12/11 : `TimeZone = UTC`), d'où `(now() at time zone 'Europe/Paris')::date`, jamais `current_date` | une date vide comptée valable ; la date d'ouverture du chantier, que la loi regarde mais qu'Opus ignore : c'est l'avis de 2b-4 (« expire avant le début ») et J2 |
| **trois formes au rang 11** : `devis_attestation` (la loi : rien de joint, ou seulement des dates passées), `devis_attestation_date` (prudence : joint, mais sans date dans Opus), `devis_decennale` (prudence : pas de réponse) | « une nature est une phrase affichée » : la loi demande de JOINDRE l'attestation, pas de recopier sa date dans un logiciel ; quand le fichier est joint sans date, c'est Opus qui ne sait pas lire sa date — le modèle du rang 3 coupé en deux clés à 2b-1 (TXT-1, `schema.sql` l. 14740-14757) | une seule clé `loi` (v1, B1 base et D7 droit) |
| **la lecture de l'attestation DANS `motifs_refus_remise`**, une seule, colonnes nommées, filtrée par `pro_id = v_pro` | aucune fonction nouvelle à exposer ni à mettre dans trois listes fermées ; la « porte étroite » de `verifier-emetteur` (l. 1331-1345) se réécrit EN LE DÉCIDANT | une petite fonction `security invoker` qui rendrait un booléen : un appel RPC de plus, ouvert à tout compte connecté |
| **l'échéance (si P2 = oui) : `devis.acompte_a_la_signature boolean`, nullable, sans défaut ; vide ou faux = dès le 8e jour** | la règle 1 (vide = le cas protecteur, sans motif) ; elle n'entre dans aucune paire (`PAIRES_DEVIS`) : elle ne viole aucune contrainte seule | une colonne `text` d'échéance (une seule alternative aujourd'hui) |
| **l'échéance passe par la voie unique de la carte « Conditions »** (`etatInitialConditions` → `choisir` → `lireConditions`) ; un acompte retiré GARDE l'échéance (à l'inverse de la nature) | la carte n'a qu'une voie d'écriture, qui relit TOUT et envoie ce qui diffère de l'en-tête (`ConditionsDevis.js` l. 113-151, `devis.js` l. 3083-3208, `SaisieDevisScreen.js` l. 1199-1206, ÉTABLI) : un choix non initialisé partait `null` à la fermeture (E-B1) | une écriture à côté de `lireConditions` |
| **la question de l'échéance est TOUJOURS montrée**, comme « Acompte ou arrhes ? » | montrée seulement avec un acompte, elle naissait sous la pastille touchée et poussait « Validité » d'environ 90 points (E-I2, DÉDUIT par mesure de police) ; sans acompte, le motif ne sort pas : la montrer ne coûte rien | la question conditionnelle (v1) |
| **le motif de l'acompte est « par prudence », une seule nature, et sa phrase dit « pourrait »** | la règle du 8e jour n'est la loi que hors établissement (L. 221-10 est dans la « Section 3 … hors établissement », `conso-L221-10.txt` l. 3) ; Opus ne demande pas où le devis est signé (09/11) ; et « toutes les lignes, options comprises » ou « jamais pour une entreprise » sont des choix d'Opus : la phrase ne les présente pas comme la loi (D5) | deux natures selon la réponse : une clé à deux natures casse la lecture des phrases de `verifier-devis` (l. 8454-8455) |
| **« toutes les lignes chiffrées » = tous les `poste` ET toutes les `option`, offertes comprises ; aucune ligne chiffrée = « pas toutes »** | une option acceptée entre au contrat, et ne peut pas être urgente : un devis à option n'est jamais « tout urgent » ; une ligne offerte reste une prestation du contrat (DÉDUIT) ; plus strict que la loi dans sa forme « toutes », à dire (§1.4) ; au juriste (J5) | les postes seulement |
| **pour un client « entreprise de 5 salariés au plus, hors de son activité principale », ou sans réponse, l'urgence ne lève pas le 8e jour** | « au domicile du consommateur » ne se transpose pas évidemment à une entreprise (J6) ; sans réponse : le cas le plus protecteur | — |
| **le motif, l'aide et la ligne « pourquoi » lisent la MÊME règle** (`signaturePermise`, une fonction pure ; `pourquoiPasALaSignature`, une autre, qui dit la première cause) | sinon l'aide dit « permis » au-dessus d'un point qui refuse ; c'est aussi la note de `docs/A-FAIRE.md` l. 3575-3576 (« devra lire `chantier_neuf_conso` ») ; et un refus sans cause ferait chercher « quelle ligne marquer » (E-I7) | une branche d'aide de plus pour la petite entreprise (D4) : la ligne « pourquoi » dit la même chose, au bon moment |
| **aucun code `OP` ; `OP028` reste libre** | ce que 2b-3 refuse est soit une contrainte (23514, traduite par son nom en `_check`), soit un motif ; la phrase d'`docs/A-FAIRE.md` l. 3265 (« si la garde d'urgence naît ») était la bonne, celle de l. 3575 se réécrit | une garde dans `recalcule_devis` |
| **aucune date, aucun déclencheur modifié** : `tient_le_devis`, `recalcule_devis`, `tient_la_ligne_de_devis` inchangées | un marqueur ne change aucun montant ; ne pas toucher `tient_le_devis` (comparée ENTIÈRE) ni `tient_la_ligne_de_devis` (son corps repasserait par le transport du connecteur) | — |
| **pas d'avis nouveau** (« l'urgence ne change rien pour ce client », « une réparation urgente sur un bâtiment neuf ») | « Accélérer » : utiles, pas nécessaires ; notés dans `A-FAIRE` (§7) | — |
| **`urgence` est envoyée à la création comme les trois autres booléens** (dans `booleens` de `ligneVersBase`) | une création part ENTIÈRE (`api.js` l. 3030-3041) ; une liste « seulement si vrai » ferait une seconde règle pour une seule colonne ; l'ordre « la base, puis `git pull` » est dit dans chaque commit | n'envoyer `urgence` que vraie (M12 base) |

### 1.3 Les questions au propriétaire — le moins possible

Chacune est écrite pour lui, en clair, avec ce que je recommande. (Le texte
envoyé au propriétaire est celui de la réponse structurée ; il dit la même
chose.)

**P1 — La garantie décennale : comment Opus sait-il qu'un devis la concerne,
et que se passe-t-il sans attestation ?**

> Quand des travaux peuvent engager votre garantie décennale — construire,
> refaire une toiture, couler une dalle… —, la loi demande de **joindre
> l'attestation de votre assurance décennale au devis**, et pas seulement
> pour un particulier (code des assurances, L. 243-2). Opus doit savoir
> quels devis sont concernés, et que faire si votre attestation (le fichier
> et sa date de fin) n'est pas dans « Mon entreprise ».

- **A — Recommandé : une question par devis, dans « Le chantier »** —
  « Ces travaux peuvent-ils engager votre garantie décennale ? », « Non » ou
  « Oui ». **Sans réponse, Opus compte « Oui », par prudence.** Si c'est
  « Oui » (ou rien) et que votre attestation n'est pas dans « Mon
  entreprise », ou qu'elle est périmée, le devis ne pourra pas être remis, et
  « Pour le remettre » dira quoi faire. Avec votre attestation actuelle, rien
  ne change sur vos devis ; pour un dépannage qui ne crée ni ne refait
  d'ouvrage, un appui sur « Non ». Raisons : la loi attache l'attestation au
  devis, pas à une ligne ; un appui par devis au lieu d'un par ligne ; un
  oubli ne retire jamais l'exigence.
- **B — La même question, mais Opus ne fait que PRÉVENIR** (rien ne bloque).
  Un devis pourrait partir sans l'attestation que la loi demande.
- **C — Une case par ligne** (« Peut engager ma garantie décennale », sur un
  poste ou une option), éteinte sur la première ligne, reprise par la ligne
  suivante du même type ; une ligne cochée sans attestation empêche la
  remise. Plus fin et plus long à remplir ; et une case oubliée sur tout le
  devis retire l'exigence sans que rien ne le signale.

**P2 — Le paiement « à la signature » : voulez-vous pouvoir le choisir sur un
devis ?**

> Aujourd'hui, Opus compte partout que le client paie l'acompte **au plus
> tôt le 8e jour** après avoir signé : c'est le cas le plus sûr, que vous
> avez gardé pour tous les devis le 09/11. Pour un devis signé chez un
> particulier, la loi interdit de recevoir un paiement avant (code de la
> consommation, L. 221-10 ; jusqu'à deux ans de prison et 150 000 € d'amende
> pour l'avoir exigé, L. 242-7). **Opus permettrait « à la signature »** dans
> trois cas : un client qui commande pour son entreprise, dans son activité
> principale (ou une entreprise de plus de 5 salariés) ; un bâtiment neuf ou
> une transformation importante (« Le chantier ») ; et des réparations
> urgentes que le client vous a expressément demandées chez lui — **toutes**
> les lignes chiffrées du devis, et seulement pour un client qui commande à
> titre privé.

- **Oui — recommandé** : dans « Conditions », sous « Acompte ou arrhes ? »,
  « Quand le client paie-t-il cette somme ? » — « Dès le 8e jour » (par
  défaut) · « À la signature ». Choisir « À la signature » hors des trois cas
  donne un point à corriger dans « Pour le remettre », et une phrase dit
  pourquoi juste sous le choix. C'est ce qui donne un sens au marqueur
  d'urgence avant 2c, et tient la promesse déjà écrite dans « Mon
  entreprise » : « L'acompte et sa date se fixeront sur chaque devis »
  (`schema.sql` l. 11658, ÉTABLI).
- **Non** : rien en 2b-3 ; le devis imprimé en 2c dira « au plus tôt le 8e
  jour ». Le marqueur d'urgence n'a alors pour lecteurs que la liste du devis,
  l'aide de l'acompte et, en 2c, la mention imprimée.

**P3 — La réparation urgente : avec ces mots ?**

> Dans la carte d'un poste, après « Offert » :
> - sous-titre « Pour les droits de votre client » ;
> - interrupteur « Réparation urgente expressément demandée par le client »,
>   éteint par défaut, avec l'aide : « Seulement le strict nécessaire d'un
>   entretien ou d'une réparation urgents que votre client vous a
>   expressément demandés, chez lui : s'il commande à titre privé, il n'aura
>   pas de droit de rétractation pour cette ligne. » ;
> - allumé, dessous : « Si ce n'est pas vraiment le cas, c'est vous qui
>   prenez le risque : le client peut se rétracter jusqu'à douze mois de
>   plus, sans forcément vous devoir les travaux déjà faits ; un paiement
>   reçu avant le 8e jour permet d'annuler le contrat, et l'exiger ou le
>   recevoir est puni jusqu'à deux ans d'emprisonnement et 150 000 €
>   d'amende. Profiter de l'urgence pour faire signer davantage peut être un
>   abus de faiblesse (code de la consommation, L. 121-9). » ;
> - sur un devis venu d'une demande d'urgence, au-dessus, toujours la même
>   ligne : « Ce devis vient d'une demande d'urgence : ne marquez une ligne
>   que si elle remplit les conditions ci-dessous, et seulement le strict
>   nécessaire. »
>
> Elle n'existe pas sur une option, ni sur un titre. Elle n'est jamais
> allumée à votre place. Pas de confirmation à chaque ligne.

- **Recommandé : oui, ces mots.** Ils seront relus par un juriste avant que
  le premier devis soit remis (J10).
- Autre réponse : changer un mot (seuls les textes bougent).

**Ce qui n'est PAS demandé** (tranché au §1.2 par des décisions existantes) :
l'urgence sur une option (non, par prudence, au juriste) ; le devis mixte (le
plan) ; l'urgence allumée d'office (jamais) ; la date de l'urgence (aucun
lecteur) ; une attestation sans date de fin (non valable, par prudence) ; les
deux avis reportés (§7).

### 1.4 À dire au propriétaire, pas à lui demander

1. **Votre attestation décennale** est jointe, datée et valable aujourd'hui
   (relevé de forme du 12/11) : avec P1 = A, aucun de vos trois brouillons ne
   gagne de point. **Elle se termine dans 31 à 60 jours** (même relevé : la
   date tombe entre les deux bornes ; aucune décennale sous 31 jours). Ce
   jour-là, vos brouillons sans réponse « Non » gagneront « Joignez … votre
   attestation décennale et sa date de fin » : mettez la nouvelle dans « Mon
   entreprise » → Assurances, avec sa date de fin.
2. **Un de vos brouillons est valable plus de 30 jours** (même relevé) :
   remis aujourd'hui, il pourrait être accepté, et son chantier ouvert, après
   la fin de votre attestation actuelle. La loi regarde la date d'ouverture
   du chantier (A. 243-3) : c'est une question au juriste (J2), et un avis
   prévu en 2b-4.
3. **La date de fin devient nécessaire** pour vos devis : une attestation
   jointe sans date dit « Écrivez … la date de fin » (elle est écrite sur
   l'attestation, A. 243-3). Le champ « Valable jusqu'au » le dira.
4. **« Réparation urgente » se voit dans la liste du devis** (« · réparation
   urgente ») : un client qui regarde votre écran le lira. Il le lira de toute
   façon sur le devis remis, en 2c (« pas de droit de rétractation pour ces
   lignes »).
5. **« À la signature » n'est permis par l'urgence que si TOUTES les lignes
   chiffrées sont marquées urgentes** (options et lignes offertes comprises),
   et seulement pour un client qui commande à titre privé : c'est plus strict
   que la loi, qui ne retire peut-être le 8e jour que pour la part urgente —
   mais il faudrait couper l'acompte en deux, et la question est chez le
   juriste (J5, J6). L'écran dit, sous le choix, ce qui l'empêche.
6. **Un marquage faux vous expose, vous** : le client peut se rétracter
   pendant un an de plus (L. 221-20) et, faute de sa demande écrite de
   commencer, ne rien devoir pour les travaux faits (L. 221-25) ; le contrat
   peut être annulé (L. 242-1) ; deux ans et 150 000 € pour un paiement exigé
   trop tôt (L. 242-7). C'est pourquoi rien n'est jamais allumé à votre place,
   et qu'aucun bouton d'Opus ne vous propose de marquer une ligne « urgente »
   pour lever un point.
7. **Vos modalités de paiement**, dans « Mon entreprise », parlent peut-être
   d'un paiement à la signature : elles s'imprimeront sur TOUS vos devis. Un
   avis vous dit déjà de faire attention ; il dira désormais de **retirer
   cette formule** et de choisir, dans les conditions de chaque devis, quand
   le client paie. Ce que l'impression fera de ce texte libre se décide avant
   2c (§7).
8. **La démonstration** : sa décennale reçoit une attestation jointe (fictive)
   pour garder « Ce devis : rien ne manque » sur le « Muret de clôture » ; les
   points de la décennale s'y voient en effaçant la date de fin, ou en
   retirant l'assurance, dans « Mon entreprise » → Assurances (§3.10).

### 1.5 Au juriste (n'empêche pas de construire : rien ne sort avant 2c)

- **J1 (Q-J11, J-A1)** — L. 243-2 al. 2 : l'attestation est-elle due sur TOUS
  les devis d'une personne soumise à L. 241-1 (lecture large, appuyée par
  C. artisanat L. 132-1 al. 2, qui raisonne en personnes,
  `artisanat-L132-1.txt` l. 14), ou seulement sur ceux dont les travaux
  peuvent engager sa décennale (lecture étroite, appuyée par « à l'ouverture
  de tout chantier », L. 241-1 al. 2, `assur-L241-1.txt` l. 14) ? Opus
  applique l'étroite, avec « Oui » par défaut. L'aide dit « « Non » pour un
  dépannage ou un entretien qui ne crée ni ne refait aucun ouvrage » : à
  valider.
- **J2 (J-A2)** — La date qui compte est l'ouverture du chantier (A. 243-3
  2° a ; annexe I à A. 243-1) : refuser la remise sur « valable aujourd'hui »
  suffit-il ? Une attestation dont la date est passée (rangée sous « la
  loi ») est-elle bien insuffisante pour un chantier qui n'est pas ouvert ?
  Et un devis valable plus longtemps que l'attestation ?
- **J3 (J-A3)** — Le sous-traitant (non « lié au maître de l'ouvrage »,
  C. civ. 1792-1 1°, `civil-1792-1.txt` l. 13) : dispensé de joindre son
  attestation à son devis à l'entreprise principale ? L'aide le dit comme une
  question ouverte (« ne la demande peut-être pas »), rien de plus.
- **J4 (J-A4)** — Les travaux sur un existant et les éléments d'équipement
  ajoutés (jurisprudence récente, non recopiée) : l'exemple « une toiture …
  même sur un bâtiment existant » de l'aide est-il juste, et suffisant ?
  L. 243-1-1 II écarte les DOMMAGES aux ouvrages existants de l'assurance
  obligatoire, pas les travaux faits sur eux (`assur-L243-1-1.txt` l. 16).
- **J5 (J-U1, J-U5, J-U10)** — Sur un devis mixte, peut-on recevoir tout de
  suite le prix des seules lignes urgentes ? Une ligne offerte non urgente,
  une option, empêchent-elles « à la signature » ? **Et la ligne de
  déplacement d'une intervention urgente est-elle « strictement
  nécessaire » ?** Sinon un devis de dépannage ordinaire n'est jamais « tout
  urgent » (Directive 2011/83, art. 16 h, non recopiée.)
- **J6 (J-U3)** — L'exception d'urgence (« au domicile du consommateur »)
  s'étend-elle au petit professionnel de L. 221-3 (`conso-L221-3.txt`
  l. 13) ? Et, sinon, l'information « vous ne bénéficiez pas du droit de
  rétractation » de 2c le priverait-elle d'une information due ?
- **J7 (J-U7)** — Une option peut-elle être « strictement nécessaire pour
  répondre à l'urgence » ?
- **J8 (J-U2, J-U4)** — « À réaliser en urgence » (un créneau « demain ») ;
  « au domicile » (résidence secondaire, logement loué) ; « expressément
  sollicités par lui » (le locataire appelle, le propriétaire paie).
- **J9 (J-U6, J-U8, J-U9, pour 2c)** — Un devis tout urgent : le formulaire
  est-il dû, et trompeur à côté de « vous ne bénéficiez pas du droit de
  rétractation » ? Le texte exact de L. 221-5 10° pour des lignes désignées ;
  imprimer « à votre demande du … » sans que ce soit un « artifice »
  (L. 121-8).
- **J10 (J-U11, J-U12)** — Le texte libre des modalités de paiement
  (« acompte à la signature ») imprimé sur un devis hors établissement :
  est-ce « exiger » au sens de L. 242-7 (« Le fait d'exiger ou d'obtenir »,
  `conso-L242-7.txt` l. 13), même si la case dit « dès le 8e jour » ? Et les
  textes de l'urgence (A.2), relus mot pour mot — dont « sans forcément vous
  devoir les travaux déjà faits », DÉDUIT de L. 221-25 al. 3.
- **J11 (J-A5, J-A7)** — La sanction de l'attestation non jointe : aucune dans
  les textes recopiés (L. 243-3 punit L. 241-1 à L. 242-1, pas L. 243-2 ;
  lu dans l'archive LEGI du 13/07/2025) ; « jointes » : un PDF figé au jour de
  la remise suffit-il (2c) ?
- **J12 (J-A6, nouveau)** — Une attestation « par opération » d'un autre
  chantier, ou dont les activités ne couvrent pas les travaux (A. 243-3 2° b) :
  Opus ne lit pas l'attestation ; ce qu'il en dit (« valable ») ne porte que
  sur la date (`PAS_ENCORE_VERIFIE` le dit).
- **J13 (J-A8, J-A9, nouveau)** — Un client professionnel maître d'ouvrage
  (un promoteur, une SCI) : l'attestation jointe suffit-elle, ou faut-il en
  plus les mentions de R. 111-2 9° (`conso-R111-2.txt` l. 22) ?
- **J14 (nouveau)** — Les régimes de paiement du code de la construction
  (contrat de construction de maison individuelle, L. 231-1 ; L. 232-1 — non
  recopiés, À VÉRIFIER) : « Oui » au chantier neuf permet « à la signature »
  dans Opus ; ces textes l'encadrent-ils ? (J7 de 2b-2 l'avait laissé
  ouvert.)

---

## 2. La base

Tout dans la section **49** de `schema.sql` (les colonnes en 49.3 et
49.4 quater, la contrainte en 49.5, les droits en 49.7, la fonction en
49.9) : `verifier-devis` la découpe du titre « 49. LE CHIFFRAGE » au
suivant.

### 2.1 Les colonnes

```sql
-- 49.3 (la ligne)
alter table public.devis_lignes add column if not exists urgence boolean not null default false;

-- 49.4 quater (le devis) — si P1 = A, et si P2 = oui
alter table public.devis add column if not exists engage_decennale       boolean;
alter table public.devis add column if not exists acompte_a_la_signature boolean;
```

- `urgence` : **not null default false** (§1.2), sur `devis_lignes`. ÉTABLI :
  la règle « aucune colonne `not null` autre que `pro_id` et `client_id` »
  vise `devis` (`docs/PLAN-DEVIS.md` l. 3203) ; `devis_lignes` porte déjà
  trois booléens `not null default false`.
- `engage_decennale`, `acompte_a_la_signature` : **nullables, sans défaut**
  (un fait de 2b naît vide). La base les lit par `is true`, `is not false`,
  `is null`, jamais par `not x` (la leçon du lot 0a : `not null` vaut
  `null`).
- **Noms** : `urgence` ne gêne pas D4-c, qui ne refuse que `'urgence'` ENTRE
  APOSTROPHES DROITES (une valeur de `devis.source`, `verifier-devis.mjs`
  l. 3418-3419, ÉTABLI) ; `engage_decennale` évite « decennale » seul, qu'un
  contrôle de texte confondrait avec `emetteur_assurances.nature =
  'decennale'` (DÉDUIT).
- **Commentaires de colonne** : `urgence` — « Posé par l'artisan, ligne par
  ligne, sur un POSTE seulement : des travaux d'entretien ou de réparation
  urgents, expressément demandés par le client chez lui, dans la limite du
  strict nécessaire (C. conso. L. 221-28 8°, L. 221-10 4°). Jamais déduit de
  l'origine du devis. Ne sert JAMAIS de critère de TVA : les « travaux
  d'urgence » du taux à 10 % sont une autre notion (module facture). » (M7
  droit) ; `engage_decennale` — « La réponse à « Ces travaux peuvent-ils
  engager votre garantie décennale ? ». Vide = pas dit : Opus compte « Oui »
  (prudence). » ; `acompte_a_la_signature` — « Vrai : l'artisan demande
  l'acompte à la signature. Vide ou faux : dès le 8e jour après la
  signature. »

### 2.2 La contrainte (49.5)

```sql
-- posée sous condition dans la migration :
--   if not exists (select 1 from pg_constraint
--                   where conname = 'devis_ligne_urgence_check'
--                     and conrelid = 'public.devis_lignes'::regclass) then …
alter table public.devis_lignes add constraint devis_ligne_urgence_check
  check (type = 'poste' or not urgence);
```

- **La seule.** Elle couvre l'option, le titre (`zone`, `piece`) et la
  réserve. Nom en `_check` pour `messageClair()` (`erreurs.js` lit le nom par
  son suffixe) ; rangée EN DERNIER dans `CONTRAINTES_LIGNE` (alphabétique :
  `devis_ligne_unite_check` < `devis_ligne_urgence_check`) ; sa phrase dans
  `erreurs.js` (annexe A.5).
- **La condition vise SA table** (`conrelid`) : un nom de contrainte n'est
  unique que par table ; sans lui, une contrainte homonyme ailleurs ferait
  sauter la création (M6 base). `urgence` est `not null` : `not urgence`
  n'est jamais `null`.
- `devis_ligne_forme_check` **ne change pas** (§1.2) ; elle reste comparée au
  caractère près à la vraie base.
- Les 11 lignes de la vraie base la passent : la colonne naît fausse partout
  (DÉDUIT du défaut ; relevé du 12/11 : 11 lignes, 0 option).
- **Aucune contrainte ne lie deux faits** (urgence ⇒ acompte, décennale ⇒
  attestation) : « une règle qui lie deux colonnes d'un brouillon écrit champ
  par champ refuserait la saisie à mi-chemin » (`schema.sql` l. 13277-13285).
  Ce sont des MOTIFS. **Aucune contrainte ne nomme `client_id`** (D4).

### 2.3 Les droits (49.7)

`urgence` entre dans `grant insert (…)` ET `grant update (…)` de
`devis_lignes` ; `engage_decennale` et `acompte_a_la_signature` dans les deux
listes de `devis`. Une colonne envoyée hors de la liste fait refuser la
requête ENTIÈRE (42501, `schema.sql` l. 14538-14541). **La migration rejoue
le bloc 49.7 entier** (`revoke all … from anon, authenticated`, puis les
`grant`), comme au lot 2a et à 2b-2 ; ÉTABLI : les seuls `grant` sur ces
trois tables sont `schema.sql` l. 14544-14566.

### 2.4 Les déclencheurs

**Aucun ne change, aucun ne naît** (§1.2). DÉDUIT : `trg_recalcule_devis` n'a
pas de filtre de colonnes (`schema.sql` l. 14095-14097) — basculer `urgence`
refait le recalcul et juge l'horloge ; la file numérote déjà toute écriture
(OP015 sinon). Une écriture d'en-tête (`engage_decennale`,
`acompte_a_la_signature`) passe par `tient_le_devis`, qui exige que l'horloge
monte : la file le fait déjà. L'essai 49 (cas 27 f, « exactement cinq
déclencheurs sur les trois tables ») reste vrai (relevé du 12/11 : 5).

### 2.5 `motifs_refus_remise()` (49.9) — quatre clés sur deux rangs

Signature, type de retour, `plpgsql stable security invoker set
search_path = public`, droits : **inchangés** (`create or replace`). `now()`
est `stable` : la fonction le reste. Ce qui change (esquisse ; les noms
`v_…` existants sont gardés) :

1. **déclarations** :
   ```sql
   v_neuf_conso     boolean;
   v_decennale      boolean;   -- d.engage_decennale : vide = pas dit, compté « oui »
   v_signature      boolean;   -- d.acompte_a_la_signature
   v_tout_urgent    boolean;
   v_jour           date := (now() at time zone 'Europe/Paris')::date;
   v_dec_sans_date  boolean := false;   -- une décennale jointe SANS date de fin
   v_att_valable    boolean := false;   -- une décennale jointe, valable au jour de Paris
   ```
2. **la lecture nommée du devis** gagne `d.chantier_neuf_conso,
   d.engage_decennale, d.acompte_a_la_signature` (jamais `select *`) ;
3. **les lignes, toujours lues UNE fois** : un agrégat de plus dans le même
   `select` :
   ```sql
   coalesce(bool_and(l.urgence) filter (where l.type in ('poste', 'option')), false)
   ```
   → `v_tout_urgent`. Zéro ligne chiffrée : `bool_and` sur rien vaut `null`,
   `coalesce` le rend faux (« pas toutes ») ;
4. **l'attestation, lue seulement si la réponse n'est pas « Non »** :
   ```sql
   if v_decennale is not false then
     select coalesce(bool_or(a.valide_jusquau is null), false),
            coalesce(bool_or(a.valide_jusquau >= v_jour), false)
       into v_dec_sans_date, v_att_valable
       from public.emetteur_assurances a
      where a.pro_id = v_pro and a.nature = 'decennale' and a.attestation_chemin is not null;
   end if;
   ```
   une date vide rend `null` dans le second agrégat, que `bool_or` ignore :
   non valable ; aucune ligne : `null`, puis faux ; plusieurs décennales :
   une seule valable suffit ; une `rc_pro` ou une `autre` ne compte jamais.
   **`a.pro_id = v_pro` est la SEULE barrière quand la fonction sera appelée
   par la remise de 2c, en `security definer`** (la RLS ne filtre plus) :
   aujourd'hui la RLS (« mes assurances », `schema.sql` l. 11516-11519)
   filtre aussi — c'est pourquoi l'essai le prouve par une enveloppe
   `security definer` (§5.2, I2 base). `v_pro` est déjà vérifié par la garde
   OP027. `emetteur_assurance_chemin_check` exige un chemin
   `<pro_id>/<fichier>` : un chemin non nul n'est jamais vide (ÉTABLI,
   `schema.sql` l. 11228-11229) — mais il dit qu'un chemin est ÉCRIT, pas
   qu'un fichier existe (M9 base, pour 2c) ;
5. **rang 10, après les rangs 7 à 9** :
   ```sql
   if v_signature is true
      and (v_acompte_pct is not null or v_acompte_eur is not null)
      and v_valable is distinct from 'professionnel'
      and v_neuf_conso is not true
      and (v_tout_urgent and v_valable in ('consommateur', 'non_professionnel')) is not true then
     rang := 10; cle := 'devis_acompte_signature'; nature := 'prudence';
     phrase := '…';                      -- annexe A.1
     return next;
   end if;
   ```
   **`is not true`, et pas `not (…)`** : sans réponse, `v_valable in (…)`
   vaut `null`, `v_tout_urgent and null` vaut `null` si tout est urgent, et
   `not null` aussi — le motif ne sortirait pas pour un devis sans réponse,
   tout urgent : le cas qu'il doit garder (annexe B, point 3 ; vérifié à la
   main par la critique base) ;
6. **rang 11, juste avant les motifs de l'entreprise** (exclusifs, le modèle
   du rang 1) :
   ```sql
   if v_decennale is not false and not v_att_valable then
     if v_decennale is null then
       rang := 11; cle := 'devis_decennale'; nature := 'prudence'; phrase := '…'; return next;
     elsif v_dec_sans_date then
       rang := 11; cle := 'devis_attestation_date'; nature := 'prudence'; phrase := '…'; return next;
     else
       rang := 11; cle := 'devis_attestation'; nature := 'loi'; phrase := '…'; return next;
     end if;
   end if;
   ```
   `ligne_id` vide, comme les rangs 4 à 9 : la faute se corrige dans
   « Mon entreprise » ou « Le chantier », pas dans une ligne. Une décennale
   sans date À CÔTÉ d'une décennale à date passée donne la forme
   « prudence » : Opus ne sait pas si celle sans date est en cours ;
7. **ce qui reste vrai** : la fonction ne lit ni `source`, ni
   `sos_request_id`, ni `quote_request_id`, ni les tables d'origine, ni
   `clients` (D4-c, l'essai 14 c) ; `v_tout_urgent` lit un FAIT DE LIGNE posé
   par l'artisan, jamais l'origine — deux devis aux lignes identiques, l'un
   venu d'une urgence, rendent la même liste ; **le mot `source` n'apparaît
   nulle part dans le corps, commentaires compris** (« ressource » non
   plus) ; **aucune barre oblique inverse, aucune espace insécable** ; les
   phrases en caractères (apostrophe ’) ; chaque branche porte sa nature
   LITTÉRALE (`nature := 'prudence';`), pour l'expression de lecture de
   `verifier-devis` (l. 8454-8455) ;
8. **les bornes** : 500 lignes au rang 3, plus les rangs 1, 2, 4 à 11 = **510
   motifs au plus** pour le devis (508 avant) ; le rang 11 n'en sort qu'un ;
   toujours trois chiffres : les gabarits de la ligne « Pour le remettre » ne
   changent pas (DÉDUIT, `docs/A-FAIRE.md`, « Les gabarits … ont des
   bornes ») ;
9. **le commentaire de 49.9** : « OP027 change de sens … si elle naît en
   2b-3, elle prendra OP028 » (`schema.sql` l. 14702-14705) devient « La
   garde d'urgence n'est pas née : `OP028` reste libre » ; les sept règles
   d'Opus restent sept — aucune nouvelle ; et **« CE QU'ELLE NE FAIT PAS :
   VERROUILLER » gagne une phrase** (I3 base) : « Depuis 2b-3, la liste
   dépend aussi d'une ligne d'`emetteur_assurances` et du JOUR : la remise de
   2c lira l'attestation qu'elle fige sous verrou (`for share` sur la ligne
   choisie), dans la même transaction que le statut, et recalculera la liste
   au moment de la remise » — rien à construire en 2b-3.

`CONTRAT_B2` passe de **12 clés sur 9 rangs à 16 clés sur 11 rangs**.

### 2.6 Ce qui ne change pas, et pourquoi (DÉDUIT, à relever)

- **`emetteur_incomplet()`** : elle ne lit pas `emetteur_assurances`, et ne
  doit pas : le motif dépend d'un DEVIS (la réponse), ce qu'elle ignore par
  construction.
- **`emetteur_assurances`** : aucune colonne, contrainte ni droit. Pas de date
  de DÉBUT (l'attestation en porte une, Opus ne la demande pas :
  `PAS_ENCORE_VERIFIE` le dit, annexe A.6).
- **`mes_donnees()`** : `'devis_lignes'` et `'devis_emis'` exportent
  `to_jsonb` de chaque ligne (`schema.sql` l. 17557-17564) : les colonnes
  nouvelles y entrent seules ; l'empreinte de `mes_donnees` dans
  `verifier-lectures` ne bouge pas.
- **Les listes fermées des essais 46 et 47, et de `verifier-legal`** :
  inchangées — ÉTABLI par la critique base (`essais-section-46.sql`
  l. 921-935, `essais-section-47.sql` l. 757-761 et `verifier-legal.mjs`
  l. 828-829 admettent déjà `motifs_refus_remise` parmi les lecteurs de
  `emetteur_assurances|emetteur`) ; `verifier-devis` l. 5039-5043 (« une
  mention de `emetteur` ») reste vert : `emetteur_assurances` ne répond pas à la
  recherche du mot entier « emetteur » (le `_` est un caractère de mot). **Mais leurs COMMENTAIRES
  disent « le seul régime »** (`essais-section-46.sql` l. 910-919,
  `essais-section-47.sql` l. 757-758, `verifier-emetteur.mjs` l. 1298-1307,
  `verifier-legal.mjs` l. 813-822, `verifier-devis.mjs` l. 5016-5026) : ils se
  réécrivent dans le même commit que la porte étroite, avec la raison (M13
  base).
- **Les codes** : aucun nouveau (§1.2). `estUnRefusDefinitif({ code: 'OP028' })
  === false` (`verifier-devis.mjs` l. 8667) reste vraie.
- **Rattrapage** : aucun. Les colonnes du devis naissent vides ; celle de la
  ligne à défaut constant n'écrit aucune ligne existante, donc aucune
  horloge ne monte et aucune `modifie_le` ne bouge (DÉDUIT ; un `alter table
  … add column` ne réveille jamais un déclencheur de ligne) — **relevé après
  la migration** (§2.7, point 5).

### 2.7 La migration, et l'ordre

1. **Construite par un script** qui PREND chaque objet dans `schema.sql` (sur
   le modèle de 2a et 2b-2) ; imitation : `git show
   6710ff3:supabase/schema.sql` (md5 `3efa04f6…`, égal au HEAD). Elle
   emporte : les trois colonnes ; `devis_ligne_urgence_check` sous condition
   (`pg_constraint`, avec `conrelid`, bloc `do`) ; le bloc 49.7 entier ;
   `create or replace function motifs_refus_remise` ; les commentaires des
   colonnes et de la fonction ; le balayage de la section 43 (par habitude :
   rien de nouveau ne rend `trigger`).
2. **Aucun ordre qui commence par `drop`, `delete` ou `truncate`** (le script
   le compte) ; `set local lock_timeout = '5s'` ; **Opus fermé** (`add column`
   prend un verrou exclusif bref sur `devis_lignes` et `devis`), zéro requête
   active relevée avant ; renvoyée telle quelle sur 40P01 ou 55P03.
3. **Transport** : le corps de `motifs_refus_remise` n'a aucune barre oblique
   inverse ; aucun autre corps n'est réécrit. La règle du transport (une
   barre non échappée devant `u` et quatre chiffres hexadécimaux devient le
   caractère) reste appliquée par le script, par habitude.
4. **Simulée deux fois** sur l'imitation : empreinte du catalogue égale à
   celle d'une base neuve au schéma du jour, aux écarts connus près (MAINTAIN,
   oid de `plpgsql`, ordre physique des colonnes, `entreprise_registre.gele`,
   `admin_basculer_metier`, « lecture demandes visiteur », l'U+00A0 de
   `emetteur_denomination_ei_check`).
5. **Envoyée GARDÉE** (un bloc `do` qui compare le md5 du texte reçu et
   n'exécute rien s'il diffère), avec l'accord du propriétaire ; relevé AVANT
   par `SupabaseLecture` (colonnes de `devis` : 33, de `devis_lignes` : 17,
   aucune des trois colonnes, ÉTABLI le 12/11 ; md5 du corps de
   `motifs_refus_remise` = `6c11a3b5e78f76efa660ee482090a8d4`, ÉTABLI par la
   critique base ; **`max(modifie_le)` et `max(generation)` de `devis` et
   `devis_lignes`**), APRÈS (colonnes 35 et 18, défauts, la contrainte par
   `pg_get_constraintdef`, les droits par `has_column_privilege` —
   `information_schema.column_privileges` rend VIDE au rôle de lecture —, le
   md5 du corps égal à la simulation, **les deux maximums inchangés**).
   PostgREST recharge son cache seul (deux déclencheurs d'événement `pgrst`
   sur la vraie base, ÉTABLI par la critique base).
6. **Puis `git pull`.** Dans l'autre sens, une application nouvelle face à
   l'ancienne base enverrait `urgence` à CHAQUE création de ligne (elle est
   dans `booleens`) → PostgREST `PGRST204` (colonne inconnue) : chaque ligne
   neuve tomberait. Une application ANCIENNE face à la nouvelle base n'envoie
   pas les colonnes : `urgence` vaut faux, les deux autres restent vides
   (« Oui » compté pour la décennale, 8e jour pour l'acompte) — incomplet,
   jamais faux ; une clé inconnue de l'ancienne application (les quatre
   nouvelles) s'affiche sans bouton (`endroitDuMotif`, `devis.js`
   l. 3906-3929, ÉTABLI).

### 2.8 Si P1 = C (une case par ligne) — ce qui change dans la base

- au lieu de `devis.engage_decennale` :
  `devis_lignes.engage_decennale boolean not null default false` ;
- une contrainte de plus, `devis_ligne_decennale_check check (type in
  ('poste', 'option') or not engage_decennale)` (alphabétique : avant
  `designation` ; à ranger EN TÊTE de `CONTRAINTES_LIGNE`) ;
- l'agrégat `coalesce(bool_or(l.engage_decennale) filter (where l.type in
  ('poste', 'option')), false)` → `v_decennale`, booléen sans vide ;
- deux clés au rang 11, `devis_attestation` (la loi) et
  `devis_attestation_date` (prudence) — `devis_decennale` n'existe pas (le
  vide n'existe pas) ; `CONTRAT_B2` : 15 clés sur 11 rangs ;
- `ENDROIT_DU_MOTIF` des deux : `{ endroit: 'entreprise', section:
  'assurances' }`, sans second bouton ;
- **les deux pièges de `urgence`, en double** (M8 base) : la colonne entre dans
  `booleens` de `ligneVersBase` (`api.js` l. 3036) et dans le
  `jsonb_build_object` du joueur des cas d'argent (`essais-section-49.sql`
  l. 1379-1381).

---

## 3. Le calcul (JavaScript) et l'écran

### 3.1 `src/lib/devis.js`

- **`CHAMPS_LIGNE`** gagne `urgence` (12 → 13 ; `verifier-devis.mjs` l. 7273
  dit « 12 » et « chacun des douze ») ; **`CHAMPS_DEVIS`** gagne
  `engageDecennale` et `acompteALaSignature` — hors de `PAIRES_DEVIS`
  (`PAIRES_DEVIS[0]` reste la paire de la réduction).
- `nettoyerLigne` passe `urgence` par `vrai()` ; `REGLES_LIGNE` gagne
  `devis_ligne_urgence_check` ; **`CONTRAINTES_LIGNE`** la range en dernier ;
  `validerLigne` la teste dans cet ordre ; son champ fautif est `urgence`.
- **`ligneVierge`** gagne `!vrai(l.urgence)` (§1.2).
- **L'urgence n'est JAMAIS posée sans appui** : `ligneNeuve`
  (`SaisieDevisScreen.js` l. 195-204) la met à faux ;
  `valeursDeLaProposition`, `valeursDeLaSuggestion`, `posteDepuisLaLigne` ne
  la connaissent pas (un contrôle le tient) ; la base de postes (lot P) n'en
  range aucune.
- **`PROPRIETES_DE_LA_RANGEE`** gagne `urgence` (14 → 15 ;
  `verifier-postes.mjs` l. 2786 compte) ; `proprietesDeLaRangee` rend
  `urgence: !!l.urgence`. Le nom ne contient pas « réf » (règle Q3 a).
- **`MOTIFS_DEVIS`** : quatre clés (annexe A.1), phrases à l'octet de la base,
  **chacune de 200 caractères au plus et d'une seule phrase**
  (`premierePhrase(…).suite === false`), consigne d'abord.
- **`motifsDeRemise({ devis, lignes, regime, motifsEmetteur, assurances = [],
  jour = jourLocal() })`** : même ordre que la base. **`jour` a un défaut**,
  le jour du téléphone (M10 écran) : sans lui, un appelant qui l'oublie
  comparerait à `undefined` et aucune attestation ne serait jamais valable.
  Quatre fonctions pures, écrites UNE fois :
  - `toutUrgent(lignes)` : les lignes `poste` et `option` ; vrai si et
    seulement s'il y en a au moins une et que TOUTES portent `urgence ===
    true` ;
  - `signaturePermise({ reponse, chantierNeufConso, toutUrgent })` : `reponse
    === 'professionnel' || chantierNeufConso === true || (toutUrgent &&
    (reponse === 'consommateur' || reponse === 'non_professionnel'))` ;
  - `pourquoiPasALaSignature({ reponse, chantierNeufConso, lignes })` :
    `null` quand `signaturePermise` est vraie, sinon LA première cause, dans
    cet ordre — pas de réponse « à quel titre » ; `professionnel_hors_activite` ;
    aucune ligne chiffrée marquée ; une option ; la première ligne non marquée,
    nommée par sa désignation (annexe A.4) — jamais une invitation à marquer
    (E-I7, D4) ;
  - `etatDeLAttestation(assurances, jour)` → `'valable' | 'sans_date' |
    'absente'` : `valable` s'il existe une assurance `nature === 'decennale'`,
    un `attestation_chemin` non vide et une `valide_jusquau` dont les dix
    premiers caractères sont `>= jour` ; sinon `sans_date` s'il en existe une
    jointe sans date ; sinon `absente` (aucune jointe, ou seulement des dates
    passées) — **comparées comme des CHAÎNES « AAAA-MM-JJ »**, jamais par
    `new Date(…)` (la leçon des dates de la Place des pros). Le rang 11 :
    réponse vide → `devis_decennale` ; « Oui » et `sans_date` →
    `devis_attestation_date` ; « Oui » et `absente` → `devis_attestation`.
- **`ENDROIT_DU_MOTIF`** : `devis_acompte_signature → { endroit: 'conditions',
  champ: 'echeance' }` ; `devis_attestation` et `devis_attestation_date →
  { endroit: 'entreprise', section: 'assurances' }` — **sans second bouton**
  (E-I4 : l'artisan a déjà dit « Oui ») ; `devis_decennale → { endroit:
  'entreprise', section: 'assurances', aussi: 'chantier' }`.
- **`secondeActionDuPoint`** lit la clé du point : `devis_decennale` →
  « Répondre dans « Le chantier » », qui ouvre la carte SUR Q3 ;
  `devis_taux_reduit_neuf` → « Revoir « Le chantier » », qui l'ouvre SUR Q2.
  Une table, `QUESTION_DU_CHANTIER = { devis_taux_reduit_neuf: 'q2',
  devis_decennale: 'q3' }`, écrite une fois (E-I1, E-I4).
- **`actionDuPoint`** : `champ === 'echeance'` → « Choisir le moment du
  paiement ». **Aucune entrée dans `CHAMP_DU_MOTIF`** pour les trois clés du
  rang 11 : aucun motif de l'entreprise ne mène à la section « Assurances »
  (ÉTABLI : `emetteur_incomplet()` ne lit pas les assurances), et les trois
  clés s'excluent ; l'étiquette parlée « Compléter dans « Mon entreprise » :
  Assurances » suffit (la règle « une étiquette par motif, hors des deux
  paires d'adresses » de `verifier-devis` reste intacte).
- **`aidesDeLAcompte({ reponse, chantierNeufConso, chantierNeufConsoLe,
  toutUrgent = false })`** — dans cet ordre (D8) :
  1. `professionnel` → `{ nature: AIDE_NATURE_ACOMPTE_PRO, echeance: null }`
     (inchangé) ;
  2. `chantierNeufConso === true` → l'aide du chantier neuf (inchangée) ;
  3. **nouveau** : tout urgent ET `consommateur` → `{ nature:
     AIDE_NATURE_ACOMPTE, echeance: ECHEANCE_ACOMPTE_URGENCE }` ;
  4. **nouveau** : tout urgent ET `non_professionnel` → `{ nature:
     AIDE_NATURE_ACOMPTE_PRO, echeance: ECHEANCE_ACOMPTE_URGENCE }` — ni
     « rendez-lui tout », ni « 14 jours », pour des lignes qui n'ont pas de
     rétractation ;
  5. `non_professionnel` → **`AIDE_NATURE_ACOMPTE_PRUDENCE`** (T7, ci-dessous)
     et `ECHEANCE_ACOMPTE_PRUDENCE` ;
  6. sinon `ECHEANCE_ACOMPTE` (la petite entreprise et la réponse vide
     comprises : la ligne « pourquoi » dit la prudence d'Opus quand
     « À la signature » est choisi).
  Un contrôle FAIT TOURNER les trois fonctions sur toutes les combinaisons :
  l'aide dit « ne s'applique pas » (`ECHEANCE_ACOMPTE_URGENCE`, l'aide du
  chantier neuf ou `null`) si et seulement si `signaturePermise` est vraie,
  et `pourquoiPasALaSignature` est `null` si et seulement si elle l'est.
- **T7, au passage** (`docs/A-FAIRE.md` l. 3497-3500 : l'aide de la nature
  affirme 14 jours de rétractation pour une association) : la fonction est
  touchée de toute façon ; une constante, `AIDE_NATURE_ACOMPTE_PRUDENCE`
  (annexe A.4), et une comparaison.
- **Les textes de la ligne urgente** : `LIBELLE_URGENCE`, `AIDE_URGENCE`,
  `URGENCE_SI_ALLUMEE`, `DEPUIS_UNE_URGENCE`, `DETAIL_URGENCE`
  (« réparation urgente ») — constantes, comparées par leur VALEUR (le modèle
  d'`AIDE_RETENUE`) ; dans l'interrupteur, exactement `aide={AIDE_URGENCE}`.
- **`LE_CHANTIER`** gagne `q3` (annexe A.3) ; `introduction` change ;
  **`questionsDuChantier`** rend `{ q1, q2, q3: true, rangee: true }` ;
  **`CHAMPS_DU_CHANTIER` devient `['chantierNeufConso', 'chantierNeufTva',
  'engageDecennale']`** (E-I6) ; **`pastillesDeLaQuestionDecennale(valeur)`**
  rend `['Non', 'Oui (par défaut)']` tant que la valeur est vide, puis
  `['Non', 'Oui']` — « Non » à gauche, comme Q1 et Q2 (E-I3) ;
  **`resumeDuChantier`** ajoute la partie de Q3 (annexe A.3) et, quand Q1 et
  Q2 sont toutes deux cachées, ne dit QUE la partie de Q3 (M1 écran) ; les
  gabarits de la rangée (`GABARITS_DU_CHANTIER`, tous les résumés, suffixes
  compris) s'étendent.
- **`PAS_ENCORE_VERIFIE`** (annexe A.6) : « la garantie décennale » sort
  (elle est désormais lue par le rang 11) ; **« l'urgence » reste**, sous la
  forme « si une ligne marquée « réparation urgente » l'est vraiment » (D9 :
  Opus ne vérifie aucune de ses conditions, et ne la lit pas du tout si
  P2 = non) ; « si votre attestation décennale couvre ces travaux (ses
  activités, la date où le chantier s'ouvrira) » en plus.
- **`phraseEchecDuDevis`** (E2, `docs/A-FAIRE.md` l. 3435-3439) : la bande
  d'échec de l'en-tête nomme aussi « À quel titre ? » et « Le chantier »
  (annexe A.6) — 2b-3 ajoute deux colonnes d'en-tête, et la phrase
  deviendrait plus incomplète encore. « Incomplète, pas contraire » : corrigée
  parce que la fonction est touchée de toute façon.
- `NOMS_ENTETE` : `engageDecennale` → « Le chantier » ;
  `acompteALaSignature` → « Conditions ».
- **`ECHEANCE_ACOMPTE`** ne change pas : elle dit déjà l'exception d'urgence
  en entier (`devis.js` l. 2203-2210, ÉTABLI) ; la prudence d'Opus pour une
  entreprise est dite par la ligne « pourquoi », au moment où elle compte.

**La carte « Conditions » — la voie de l'échéance** (E-B1, le bloquant de
l'écran ; `devis.js` l. 3083-3208, ÉTABLI) :

- **`etatInitialConditions`** gagne `echeance` : `true` si
  `acompteALaSignature === true`, `false` s'il vaut `false`, `null` sinon ; et,
  dans `garde` (« Corriger »), `if (garde.echeance === null || typeof
  garde.echeance === 'boolean') etat.echeance = garde.echeance` ;
- **`lireConditions`** écrit `changements.acompteALaSignature = c.echeance`,
  **toujours, que l'acompte soit là ou non** : un acompte retiré GARDE
  l'échéance (à l'inverse de la nature, `devis.js` l. 3183-3184), et la
  saisie n'envoie que ce qui DIFFÈRE de l'en-tête (`SaisieDevisScreen.js`
  l. 1199-1206) : rouvrir puis fermer la carte n'écrit rien ;
- **`resumeDesConditions`** dit « Acompte 30 % à la signature » quand
  `acompteALaSignature === true` et qu'un acompte est posé (M6 écran) — la
  rangée a deux lignes (`SaisieDevisScreen.js` l. 527), sinon ce choix ne se
  verrait qu'en ouvrant la carte.

### 3.2 `src/lib/emetteur.js` et `src/lib/erreurs.js`

- **`etatDeLAssurance(a, jour)`** (pure, à côté d'`avisEmetteur`) : « Valable
  jusqu'au JJ/MM/AAAA » ; « Sans date de fin » ; « Expirée le JJ/MM/AAAA ».
  Comparée au jour LOCAL (`jourLocal`, l. 1551-1555). **Affichée sur SA ligne**
  dans la rangée de l'assurance (§3.9), jamais au bout du texte coupé à deux
  lignes (E-I5).
- L'avis **`sans_assurance`** (l. 1581-1588), l'avis **`a_la_signature`**
  (l. 1627-1633) et l'avis **`decennale_sans_attestation`** (l. 1595-1605 :
  « quel que soit le client » devient « et pas seulement pour un
  particulier », D6) se réécrivent (annexe A.6).
- L'en-tête du fichier (l. 38-41, « la décennale jointe pour un ouvrage
  relève des lots 1 et 2 ») : « relève de l'étape 2b-3 » (commentaire).
- `erreurs.js` : la phrase de `devis_ligne_urgence_check` (annexe A.5).

**Deux jours, deux horloges, et c'est dit** (M14 base, M3 écran) : la base
juge l'attestation au jour de PARIS, « Mon entreprise » au jour du TÉLÉPHONE.
Outre-mer, entre minuit à Paris et minuit local, la rangée peut dire « Valable
jusqu'au [aujourd'hui] » sous un point qui la dit périmée, quelques heures.
Rare (aucun artisan d'outre-mer aujourd'hui) ; noté dans `A-FAIRE`, avec
la piste (compter le jour de Paris des deux côtés — `Intl` avec un fuseau sous
Hermes : À VÉRIFIER).

### 3.3 `src/lib/api.js`, la file, la démonstration des données

- **`ligneVersBase`** : la colonne `urgence` dans sa liste fermée, ET dans
  **`booleens`** (l. 3036) — sans elle, une création envoie `urgence: null`,
  refusée par `not null` (23502 ; `erreurs.js` l. 928-934 le traduit : « une
  information obligatoire manque (« urgence ») … c'est un défaut d'Opus » —
  en français, mais un refus) ; `rowToLigne` lit `urgence === true`.
- **`devisVersBase`** envoie les deux colonnes accordées ; `rowToDevis` les
  lit (`chantierNeufConso` y est déjà, `devis.js` l. 1801).
- **`motifsRefusRemiseDemo`** (l. 3425-3435) passe aussi
  `ficheEmetteurDemo(moi).assurances` (le jour prend son défaut).
- **La file** : une écriture de marqueur est une écriture de ligne — numéro
  neuf, `update` jamais `upsert`, une ligne par ordre (49.5 bis). Rien de
  nouveau : `file-ecriture.js` travaille sur `CHAMPS_LIGNE`. Point 18 :
  allumer l'urgence d'une ligne EN ÉCHEC change quelque chose, c'est un nouveau
  geste. La file n'est pas gardée d'un lancement à l'autre (ÉTABLI par la
  critique écran) : aucune ligne « ancienne » sans `urgence` ne revient.
- **`devis-demo.js`** : chaque ligne dit `urgence: false` (une clé absente se
  lit `null`, et `renvoyerLaLigne` compare `?? null` : `false` contre `null`
  ferait croire à un changement) ; `creerBaseDevisDemo` refuse l'urgence hors
  d'un poste, comme la base ; « Sol du séjour » : `engageDecennale: true` (si
  P1 = A).
- **`emetteur-demo.js`** : la décennale de démonstration reçoit
  `attestation_chemin: '<PRO_DEMO_EMETTEUR>/attestation-assurance-demo.pdf'`
  (la forme d'`envoyerAttestationDemo`, `api.js` l. 2475-2478, et de
  `emetteur_assurance_chemin_check`) ; sa date (+ 200 jours) ne change pas.
  `motifsEmetteur()` de cette fiche ne change pas (il ne lit pas les
  assurances), donc `verifier-emetteur` non plus sur ce point (À VÉRIFIER en
  le relançant).

### 3.4 L'écran — la carte d'une ligne (`CarteLigne.js`)

**Place** : sur un POSTE seulement, APRÈS les trois interrupteurs du prix
(`CarteLigne.js` l. 484-515), avant « Monter / Descendre » :

```
Main-d’œuvre · Fourniture non comprise · Offert      (existants)

[Ce devis vient d’une demande d’urgence : …]         ← devis venu d’une urgence, FIXE
Pour les droits de votre client                      ← sous-titre (= LE_CHANTIER.q1.sousTitre)
[ ] Réparation urgente expressément demandée…        ← Interrupteur, aide FIXE
    {sous('urgence')}
    [allumé : URGENCE_SI_ALLUMEE]                    ← un Text à part, SOUS la rangée
Monter · Descendre
Retirer cette ligne
```

- **La brique `Interrupteur`** (`ui.js` l. 867-889) : 44 points par sa BOÎTE,
  rôle `switch`, aide lue par VoiceOver avec le libellé — exactement celle
  d'« Offert ». Pas de pastilles, pas de feuille.
- **L'aide ne change JAMAIS avec l'état** : elle vit dans la rangée touchée ;
  si elle changeait, la rangée changerait de hauteur sous le doigt. Ce qui
  dépend de l'état va DESSOUS, dans un `Text` à part. Mesuré par la critique
  écran (avances de police) : l'aide fixe garde son nombre de lignes à
  l'allumage (la bordure passe de 1 à 2 points, le comportement d'« Offert ») —
  à remesurer avec le libellé et l'aide du v2, plus longs.
- **En dernier** : le texte « allumé » ne pousse que « Monter / Descendre /
  Retirer », jamais une autre cible.
- **VoiceOver l'entend** (M4 écran) : à l'allumage, `retour.annoncer
  (URGENCE_SI_ALLUMEE)`, une fois — `accessibilityLiveRegion` n'existe que sur
  Android.
- **La ligne « Ce devis vient d'une demande d'urgence … »** : un `Text`, pas
  un bouton ; posée quel que soit l'état de l'interrupteur (rien ne bouge à
  l'appui) ; elle LIMITE (« ne marquez une ligne que si… »), elle n'ordonne
  pas de marquer (D2) ; la saisie passe à la carte UNE valeur,
  `depuisUneUrgence` (`devis.source === 'urgence'` ; la source ne se récrit
  jamais, D3) — la carte ne reçoit pas le devis. Sur une option, rien.
- **Un appui enregistre** : `enregistrer({ urgence: !ligne.urgence })`, qui
  relit tous les champs : un prix tapé sans quitter le champ part avec
  l'appui (`CarteLigne.js` l. 154-183). Mais le clavier ouvert sur le prix
  cache l'interrupteur, et y arriver en glissant ferme le clavier
  (`keyboardDismissMode="on-drag"`, `CarteLigne.js` l. 305) et enregistre le
  prix par `onBlur` (M5 écran) : le chemin réel est « prix tapé, glisser,
  allumer ».
- **Deux appuis dans la même image** lisent tous deux l'ancienne valeur :
  comportement EXISTANT d'« Offert » ; pour l'urgence, deux appuis rapides
  donneraient « allumé ». Dit, pas construit (« Accélérer », §7).

### 3.5 L'écran — la liste du devis (`SaisieDevisScreen.js`)

- La rangée d'un poste urgent dit « · réparation urgente » dans sa ligne de
  détail grise (`SaisieDevisScreen.js` l. 308-323), APRÈS « · fourniture non
  comprise » et **AVANT le total** — `rangees()` de `mesure-devis` lit le
  total en FIN de texte (`mesure-devis.mjs` l. 703-713) ; pour une ligne sans
  quantité, la phrase seule (comme « Fourniture non comprise »).
- Son étiquette parlée : `` `${designation}, réparation urgente, ouvrir` ``
  (seulement si elle l'est) ; `ouvrirRangee(debut)` reste juste (préfixe).
- La rangée ne reçoit QUE ce que rend `proprietesDeLaRangee` (règle Q3 a,
  tenue par `verifier-postes`).
- Les options : rien (pas d'urgence ; si P1 = C, « · garantie décennale »).

### 3.6 L'écran — « Le chantier » : une troisième question (si P1 = A)

- **La rangée** existe désormais toujours (Q3 est toujours montrée ; aujourd'hui
  elle disparaît pour une réponse `professionnel` en franchise, `devis.js`
  l. 5114-5118 — une amélioration). Son résumé gagne la partie de Q3 (annexe
  A.3) ; ses gabarits invisibles (TOUS les résumés possibles, suffixes
  « — enregistrement… » et « — pas enregistré » compris) s'étendent : sa
  hauteur reste fixe dans tous ses états. Le suffixe court (« ; décennale :
  non ») la garde à deux lignes à 320 points (le suffixe du v1 la passait à
  trois, M1 écran, DÉDUIT par mesure de police — à mesurer).
- **La carte** : l'introduction change (A.3) ; **Q3** vient APRÈS Q1 et Q2,
  sous « Pour votre assurance » : la question, deux pastilles — « Non » ·
  « Oui (par défaut) » tant que la valeur est vide, puis « Non » · « Oui »
  (« Non » À GAUCHE, comme Q1 et Q2, E-I3) —, sa ligne d'état, l'aide. Un appui
  écrit `engageDecennale` par la file de l'en-tête ; **aucune confirmation**
  (§1.2).
- **Son état « enregistrement… / pas enregistré »** se CALCULE à chaque rendu
  depuis la file (règle de 2b-2) : `etatQ3: etatDesChampsDuDevis(entrees,
  ['engageDecennale'])` à côté de `etatQ1` et `etatQ2` (`SaisieDevisScreen.js`
  l. 815-817), et `ChantierDevis` reçoit `etats={{ q1, q2, q3 }}` (l. 2466) ;
  la rangée lit `CHAMPS_DU_CHANTIER`, qui gagne `engageDecennale` (E-I6) —
  sinon une réponse refusée laisserait « ; décennale : non » dans la rangée et
  « Non » choisi dans la carte, sans « pas enregistré », pendant que la base
  compte « Oui ».
- **La carte s'ouvre SUR la question visée** quand on vient d'un point (E-I1) :
  `ChantierDevis` reçoit `questionInitiale` (`'q2'` ou `'q3'`, de
  `secondeActionDuPoint`) et pose l'ancre UNE fois à la mise en page, le modèle
  de `champInitial` et `ancre()` de « Conditions » (`ConditionsDevis.js`
  l. 96-105). Sans elle, Q3 commencerait vers y ≈ 690 à 393 points et ≈ 770 à
  320, sous deux aides longues (DÉDUIT par mesure de police, critique écran) :
  sous le pli sur les trois tailles. Ouverte depuis sa rangée, la carte
  s'ouvre en haut, comme aujourd'hui.
- **« Répondre dans « Le chantier » »** (second bouton de `devis_decennale`)
  y mène sur Q3, « ‹ Liste » ramène à la carte « Pour le remettre » ;
  `devis_taux_reduit_neuf` garde « Revoir « Le chantier » », ouvert sur Q2.

### 3.7 L'écran — « Conditions » : quand le client paie (si P2 = oui)

- **Place** : TOUJOURS montrée, comme « Acompte ou arrhes ? » (E-I2) : après
  ses pastilles, sa ligne fautive et l'aide de la nature (`aides.nature`),
  l'étiquette « Quand le client paie-t-il cette somme ? »
  (`onLayout={ancre('echeance')}`), deux **pastilles** — « Dès le 8e jour
  (par défaut) » · « À la signature » tant que la valeur est vide, puis
  « Dès le 8e jour » · « À la signature » (courtes : les libellés du v1
  tenaient à 1,2 point près sur une rangée à 320, M2 écran) —, puis **la ligne
  « pourquoi »** quand elle a lieu, puis l'aide de l'échéance (`aides.echeance`),
  **qui ne bouge pas** : elle reste où elle est aujourd'hui, juste après.
  **Des pastilles, pas un second interrupteur** : `verifier-devis.mjs`
  l. 6265-6271 exige UN seul interrupteur dans `ConditionsDevis.js` (la
  retenue).
- Un appui fait `choisir({ echeance: true | false }, 'echeance')` — la voie
  unique de la carte (§3.1) ; rien n'est choisi sans appui ; `ConditionsDevis`
  reçoit deux valeurs de plus, `toutUrgent` et `lignes` (pour la ligne
  « pourquoi »), calculées par la saisie, comme `reponseATitre`.
- **La ligne « pourquoi »** (`pourquoiPasALaSignature`, annexe A.4) : sous les
  pastilles, seulement quand « À la signature » est choisi, qu'un acompte est
  posé ET que la règle ne le permet pas. Elle naît sous la pastille touchée
  (« ce qui dépend de l'état va dessous ») : la pastille ne bouge pas.
- **Jamais un bouton qui propose de « marquer les lignes urgentes »** pour
  lever le point ou l'aide (annexe B, point 6).
- Sans acompte, le motif ne sort pas, et la ligne « pourquoi » non plus ;
  l'ancre `echeance` existe toujours (M7 écran : une question qui naissait avec
  l'acompte faisait défiler la carte toute seule la première fois).
- **L'aide et le motif ne lisent pas les mêmes lignes** (M15 base) : l'aide
  et la ligne « pourquoi » lisent les lignes de l'ÉCRAN (une marque pas
  encore enregistrée y compte), le motif celles de la BASE. Transitoire, et
  « Non enregistrée » se voit sur la ligne ; dit, comme pour la réponse « à
  quel titre » de 2b-2.

### 3.8 L'écran — « Pour le remettre » (`PourRemettre.js`)

- `devis_acompte_signature` → « Choisir le moment du paiement » : ferme la
  carte « Pour le remettre », ouvre « Conditions » SUR l'échéance
  (`ouvrirConditionsSur('echeance')`), « ‹ Liste » y ramène ;
- `devis_attestation`, `devis_attestation_date`, `devis_decennale` →
  « Compléter dans « Mon entreprise » » (dit : « … : Assurances »), puis
  `onMonEntreprise('assurances')` — aucun écran nouveau ; **seul
  `devis_decennale` a un second bouton**, « Répondre dans « Le chantier » »
  (E-I4). Ils comptent dans « ce devis — N points » : la réponse est du devis,
  l'attestation de l'entreprise ; le bouton dit où aller ;
- **la fermeture de « Mon entreprise » relit les DEUX parties** (REL-2 de
  2b-1, ÉTABLI) : l'attestation devient le SECOND fait de l'entreprise que
  lit la partie « devis » (après le régime de TVA). Seul « Mon entreprise »
  écrit `emetteur_assurances` ;
- **« Mon entreprise » s'ouvre sur la section Assurances, pas sur la date** :
  dans la fiche d'une assurance, « Valable jusqu'au » vient après cinq champs
  (`FicheAssurance.js` l. 254), et le calendrier avance d'un mois par appui
  (M8 écran). L'ouvrir sur la date est noté dans `A-FAIRE`, pas construit ;
- **les gabarits de la ligne du haut ne changent pas** (510 motifs, trois
  chiffres) ; « garder la grande place » tient.

### 3.9 L'écran — « Mon entreprise » → Assurances

- La rangée d'une assurance (`FicheEmetteur.js` l. 835-855) garde son texte
  coupé à deux lignes (`numberOfLines={2}`, l. 849) et **gagne une ligne à
  part, sans coupe, pour l'état** (`etatDeLAssurance`, §3.2) : ajoutée au bout
  du texte coupé, la date tombait sous « … » à 320 points pour la décennale de
  démonstration (« Assureur de démonstration », « France métropolitaine »),
  DÉDUIT par mesure de police (E-I5). Le propriétaire n'est pas touché (un
  texte court, relevé de forme), mais un assureur au nom long l'aurait été.
- Les textes « Opus n'en exige aucune » (`FicheAssurance.js` l. 173,
  `FicheEmetteur.js` l. 830-831, `emetteur.js` l. 1584) deviennent faux si P1 =
  A ou C : ils se réécrivent (annexe A.6) ; `verifier-emetteur` l. 2053-2054
  (« l'écran d'une assurance dit qu'Opus n'en exige aucune ») change avec eux,
  EN LE DÉCIDANT. Ils évitent « la loi l'exige » et « au moins une
  assurance », que `verifier-emetteur` refuse (l. 2044-2047).
- L'aide de « Valable jusqu'au » (`FicheAssurance.js` l. 254-258) ne change
  **que pour une décennale** (M9 écran) : sous une RC pro, « votre décennale en
  a besoin » ne s'appliquerait pas (annexe A.6).
- Rien d'autre : la fiche, l'envoi du fichier, « Reprendre l'attestation
  envoyée pour le badge », « Effacer la date », « Retirer cette assurance »
  existent (lot 0a).

### 3.10 La démonstration

- **La décennale de démonstration reçoit une attestation fictive** (§3.3) :
  sans elle, avec P1 = A, les quatre devis (tous vides ou « Oui ») gagneraient
  un point, et les invariants tomberaient — « Ce devis : rien ne manque » sur
  le « Muret de clôture », exactement deux points sur la « Terrasse en bois »
  (`devis-demo.js`, l. 205-255 ; `mesure-devis` les tient). Répondre « Non »
  pour un muret ou une terrasse les garderait aussi, mais ce serait écrire,
  dans la démonstration, une réponse que l'aide de Q3 contredit.
- **Les trois points de la décennale se voient** dans « Mon entreprise » →
  Assurances : « Effacer la date » (`FicheAssurance.js` l. 260-262) donne
  `devis_attestation_date` sur « Sol du séjour » (`engageDecennale: true`) et
  `devis_decennale` sur les devis sans réponse ; « Retirer cette assurance »
  (l. 326-331) donne `devis_attestation` sur « Sol du séjour ». La remettre
  les éteint. L'avis `decennale_sans_attestation` ne se voit plus par défaut
  (il n'était tenu par aucune mesure) ; `verifier-emetteur` le tient sur des
  données de synthèse.
- **L'urgence** : par le chemin qui existe (« Pour moi » → l'urgence de
  démonstration acceptée → « Faire un devis » → « + Poste »,
  `mesure-devis.mjs` l. 3310-3337) : la ligne « Ce devis vient d'une demande
  d'urgence … », l'interrupteur éteint, puis allumé, le texte dessous, la
  rangée « · réparation urgente ».
- **L'échéance** : sur ce brouillon, un acompte, « À la signature » → le
  point, et la ligne « pourquoi » (« Dites d'abord à quel titre… ») ; la
  cliente « à titre privé » et toutes ses lignes urgentes → le point et la
  ligne s'éteignent, l'aide de l'urgence s'affiche ; une option ajoutée → la
  ligne « Une option n'est jamais une réparation urgente… ». Puis « Supprimer
  ce brouillon » (sinon les sections suivantes trouvent cinq devis).
- **Pas de cinquième devis semé** (`mesure-devis` en attend quatre).

### 3.11 Si P1 = C (une case par ligne) — ce qui change à l'écran

- dans la carte d'un poste ET d'une option, AVANT le bloc de l'urgence :
  « Pour votre assurance », interrupteur « Peut engager ma garantie
  décennale », aide fixe ; la carte d'une option a quatre interrupteurs ;
- une ligne neuve reprend la case de la dernière ligne DU MÊME TYPE
  (`decennalePour`, sur le modèle de `tauxPour`, `SaisieDevisScreen.js`
  l. 1157-1164) ; la case n'entre PAS dans `ligneVierge` (sinon une ligne
  neuve marquée par la reprise resterait « incomplète » à la fermeture) ;
- la rangée et l'option disent « · garantie décennale » ; la question Q3 de
  « Le chantier » n'existe pas (ni `etatQ3`, ni `questionInitiale: 'q3'`) ;
  la démonstration marque la chape de « Sol du séjour » et garde la décennale
  SANS fichier (les autres devis n'ont aucune ligne marquée : leurs
  invariants tiennent).

---

## 4. Les textes légaux (`src/data/legal.js`)

`VERSION` passe à la date du commit, avec **son bloc d'historique** : une
donnée nouvelle collectée pour les devis — si leurs travaux peuvent engager la
garantie décennale, quand l'acompte ou les arrhes sont payés, quelles lignes
sont des réparations urgentes expressément demandées par le client ; et la
limite connue : aucun écran ne fait encore ré-accepter un compte existant.

| passage | ce qui manque | réécriture |
|---|---|---|
| « Ce que nous collectons », la phrase des devis (`legal.js` l. 1521-1530) | les trois faits | annexe A.7 ; toujours AVANT la base de postes (`verifier-legal` découpe la phrase à partir de « devis en préparation ») |

Rien d'autre : aucune décision automatique nouvelle (un motif n'en est pas
une : il dit à l'artisan ce qui manque à son propre devis) ; aucun texte ne
promet quoi que ce soit sur l'urgence ou l'attestation (rien ne sort avant
2c). **Les empreintes sha256 des sections** que garde `verifier-legal` se
recalculent dans le même commit, avec leur raison. `verifier-legal` admet déjà
`motifs_refus_remise` parmi les lecteurs d'`emetteur_assurances` (l. 828-829,
ÉTABLI par la critique base : le « À VÉRIFIER » du v1 est levé).

**Pour 2c, pas maintenant** (M10 droit) : une phrase des conditions
d'utilisation sur le modèle de P4 (« Déclarer sur l'honneur un numéro de
TVA… », `legal.js` l. 1290-1292) — marquer « réparation urgente », répondre
« Non » à la décennale ou « Oui » au chantier neuf engage l'artisan, Opus ne
le vérifie pas. La clause générale existe (`legal.js` l. 1351) ; à juger avec
le juriste.

---

## 5. Les contrôles et les essais

### 5.1 Le relevé « avant », d'abord

Refaire le relevé des **34** fichiers d'essais sur HEAD avant d'écrire une
ligne. La référence écrite au 10/11 (`docs/A-FAIRE.md`, « Contrôles et
méthode ») : essai 48 — 22 erreurs, 78 justes ; 49-remise — 13 et 188 ;
49-conditions — 27 et 40 ; essai 49 — 79 erreurs (son commentaire dit 73,
corrigé au passage) ; `generer-cas-remise --verifier` — 85 cas ;
`mesure-devis` — 788 mesures ; 56 contrôles. Colonnes de `devis` : 33, de
`devis_lignes` : 17 (ÉTABLI, relevé de la vraie base du 12/11, refait pour ce
v2).

### 5.2 Les essais SQL (joués deux fois, à la main : `npm run verifier` n'en joue aucun)

**D'abord, que les cas existants gardent leur sens** (I1 base, ÉTABLI : ni
`essais-section-49-remise.sql` ni `generer-cas-remise.mjs` n'insèrent une
assurance ; 61 `execute motifs(`, dont 28 attendent « — ») : avec P1 = A, une
réponse vide compte « Oui », et TOUS ces cas gagneraient `devis_decennale`.
**La fiche d'essai A reçoit donc par défaut une décennale valable** (un
`attestation_chemin` de la forme `<pro_id>/attestation.pdf`, `valide_jusquau
= '2999-12-31'`), posée par une procédure préparée appelée partout où
`fiche_a` l'est ; les cas de la décennale la retirent ou en posent une autre,
dans leur transaction. **Les attendus existants ne changent pas** ; seuls des
cas s'ajoutent.

| fichier | ce qui change |
|---|---|
| `essais-section-49-remise.sql` | la décennale par défaut (ci-dessus) ; cas nouveaux : **l'urgence** — un poste urgent accepté, une option urgente refusée (`devis_ligne_urgence_check`), un titre et une réserve urgents refusés (la MÊME contrainte, pas `forme_check`) ; **un poste urgent changé en option par `update`** → `devis_ligne_urgence_check` (23514 : l'application ne change jamais un type, un client modifié le peut, `type` étant dans `grant update`) ; **un titre urgent ET mal formé** (une quantité sur une zone) → c'est `devis_ligne_forme_check` qui est nommée (la preuve, côté base, de l'ordre de `CONTRAINTES_LIGNE`) ; **l'acompte** — « à la signature » + acompte + client à titre privé + une ligne non urgente → `devis_acompte_signature` ; toutes les lignes urgentes → rien ; une option en plus → le motif revient ; une ligne offerte non urgente → le motif ; réponse `professionnel` → rien ; `chantier_neuf_conso` vrai → rien ; réponse vide ET tout urgent → **le motif** (la garde du `is not true`) ; `professionnel_hors_activite` et tout urgent → le motif ; `non_professionnel` et tout urgent → rien ; « à la signature » SANS acompte → rien ; zéro ligne chiffrée → le motif (et `devis_lignes`) ; **la décennale** — réponse vide, aucune assurance → `devis_decennale` ; « Oui », aucune assurance → `devis_attestation` (`loi`) ; « Oui », une décennale jointe SANS date → `devis_attestation_date` (`prudence`) ; « Oui », une décennale jointe à date d'hier (Paris) → `devis_attestation` ; « Oui », une sans date ET une à date passée → `devis_attestation_date` ; « Oui », une décennale SANS fichier, date valable → `devis_attestation` ; réponse vide et une jointe sans date → `devis_decennale` (jamais deux clés) ; « Non » → rien ; une `rc_pro` valable seule → le motif ; date du jour (Paris) → rien, **l'assurance et l'appel dans la MÊME transaction** (un `now()` constant : sinon l'essai peut échouer à minuit pile) ; deux décennales dont une valable → rien ; **le jour de Paris éprouvé, pas lu** (M5 base) : `set local timezone = 'Pacific/Kiritimati'` (UTC+14) avant d'appeler la fonction sur une décennale « valable jusqu'au jour de Paris » → rien ne sort (avec `current_date`, le motif sortirait) ; **la décennale d'une AUTRE entreprise, appelée par l'ENVELOPPE `security definer` du cas 12 f** (créée et retirée dans la transaction ; I2 base) : A sans décennale, B avec une décennale valable, l'enveloppe appelée sur le devis de A rend `devis_attestation` ou `devis_decennale` — joué par `set local role authenticated`, la RLS cacherait l'assurance de B et l'essai passerait au vert sans le filtre `a.pro_id = v_pro` ; **D4-c** — deux devis aux lignes identiques, l'un `source = 'urgence'` avec `sos_request_id`, rendent la même liste ; **14 c** — « nomme exactement » gagne `emetteur_assurances` ; `chantier_neuf_conso` sort des mots interdits (raison : le motif de l'acompte le lit ; la PROPRIÉTÉ reste jouée, l. 1213-1214 : `chantier_neuf_conso = true` ne fait pas sortir `devis_taux_reduit_neuf`) ; `source` et les autres restent interdits ; le compte d'erreurs et de valeurs |
| `essais-section-49.sql` | colonnes (`devis` 33 → 35, `devis_lignes` 17 → 18), `check_attendu_33` → 34, droits ; le **joueur des cas d'argent** (l. 1379-1381) ajoute `'urgence', false` à son `jsonb_build_object` — sinon `jsonb_populate_record` met `null`, et `not null` refuse **tous les cas joués** (69 cas d'argent dans `cas-devis.json` depuis le lot 2a, M2 base) ; 27 a, 27 b (31 / 32), 27 f **inchangés** ; le commentaire « 73 refus » → 79 |
| `essais-section-49-conditions.sql` | le cas 18 liste une ligne par COLONNE (`tab, col, ins, upd`, l. 595-631, ÉTABLI) : **trois lignes de plus** — `('devis','engage_decennale',true,true)`, `('devis','acompte_a_la_signature',true,true)`, `('devis_lignes','urgence',true,true)` — et `colonnes_trouvees_attendu_t` passe de **39 à 42** (M7 base) ; défauts (`null`, nullable ; `urgence` faux, `not null`) |
| `essais-section-46.sql` | **inchangé** : sa liste fermée contient déjà `motifs_refus_remise` (l. 921-935, ÉTABLI) — son commentaire « le seul régime » (l. 910-919) se réécrit (M13 base) |
| `essais-section-47.sql` | liste inchangée (l. 757-761) ; commentaire réécrit (l. 757-758) |
| `essais-section-43.sql`, `-50`, `-51d` | inchangés — à relever |

Puis les 34 fichiers rejoués et comparés au relevé « avant » : seuls des
écarts attendus et expliqués.

### 5.3 La parité base ↔ téléphone (`scripts/generer-cas-remise.mjs`)

- **le format des cas** gagne `assurances` : **les lignes telles que
  l'application les passe**, en `snake_case` (`nature`, `attestation_chemin`
  réel ou `null`, `valide_jusquau` ; la forme d'`emetteur-demo.js` l. 89-101),
  jamais un booléen « présence » que l'application ne donne pas au miroir
  (M10 base) ; les lignes gagnent `urgence` ; le devis gagne `engageDecennale`
  et `acompteALaSignature` (`chantierNeufConso` y est déjà) ;
- **la recopie de `rowToLigne`** (l. 430-448) gagne `urgence` ; l'insertion
  des lignes (liste de colonnes explicite, l. 385-390) aussi ;
- **`ENTREPRISES`** (l. 105-140, aucune assurance aujourd'hui, ÉTABLI) :
  **chaque entrée existante reçoit la décennale valable par défaut** (sauf
  `vide`, au choix) — **les 85 attendus existants ne changent pas**, et le
  générateur ne refuse pas de lui-même (`:476-483`, « aucun cas où
  `devis_lieu` est le seul motif », « aucun cas où rien ne manque ») ; des
  entrées NOUVELLES portent les variantes : aucune assurance ; jointe sans
  date ; sans fichier ; date passée ; `rc_pro` seule ; deux décennales dont
  une valable ; une sans date et une passée ;
- **les dates sont FIXES et lointaines** : `2001-01-01` (passée) et
  `2999-12-31` (valable). **Aucune date relative** : le fichier engendré
  vieillirait. Le script REFUSE une `valide_jusquau` entre 2002 et 2998 ; **et
  `verifier-devis`, qui lit `cas-remise.json` à chaque `npm run verifier`, la
  refuse aussi** (M11 base) : un fichier corrigé à la main ne vieillit pas sans
  que rien ne rougisse ;
- **`CLES_DU_DEVIS`** gagne les quatre clés : chacune doit être, dans au moins
  un cas, le SEUL motif de rang < 100 ; plus des couvertures : la réponse vide
  ET tout urgent ; l'option qui empêche « tout urgent » ; une sans date à côté
  d'une passée ;
- **`--verifier`, à la main** — le seul garde-fou de la base contre le
  fichier ; `verifier-devis`, celui du miroir contre le fichier ;
  `cas-remise.json` se régénère et se commite.

### 5.4 Les contrôles `node`

| contrôle | ce qui change |
|---|---|
| `verifier-devis` | `COLONNES_LIGNE`, `DROITS_DE_COLONNE` (l. 2897-2907) et leur comparaison à `ligneVersBase` FAITE TOURNER — `booleens` connaît `urgence` ; `FERMEE.devis_lignes` et `FERMEE.devis` ; `AJOUTS_PERMIS` gagne `AJOUTS_2B3` ; `CONTRAINTES_LIGNE` et sa comparaison au SQL ; `FORME_MOTIFS_REFUS_REMISE` (la fonction ENTIÈRE, l. 8413) ; `CONTRAT_B2` : **16 clés sur 11 rangs** (P1 = C : 15 clés ; P2 = non : 15 clés sur 10 rangs, le rang 10 vide ; les deux : 14 sur 10) ; les phrases ≤ 200, une phrase chacune ; une nature LITTÉRALE par branche ; D4-c inchangé (`'urgence'` entre apostrophes droites toujours refusé) ; `CHAMPS_LIGNE` : 13 (« chacun des treize ») ; `CHAMPS_DEVIS` : + 2 ; F « qui lit, qui écrit » : `urgence` écrit par l'interrupteur, lu par la rangée, l'aide, la ligne « pourquoi » et le motif ; `engageDecennale` écrit par Q3, lu par le motif et le résumé ; `acompteALaSignature` écrit par les pastilles, lu par le motif, le résumé des conditions et la ligne « pourquoi » ; `ligneVierge` connaît `urgence` ; **l'urgence n'est jamais posée** par `ligneNeuve`, `valeursDeLaProposition`, `valeursDeLaSuggestion`, `posteDepuisLaLigne` ; la carte reçoit `depuisUneUrgence` et ne lit pas `source` ; les aides par leur VALEUR (`AIDES_DE_DROIT_ATTENDUES`), `aide={AIDE_URGENCE}` exactement ; **`aidesDeLAcompte` ↔ `signaturePermise` ↔ `pourquoiPasALaSignature` sur toutes les combinaisons** (§3.1) ; **`etatInitialConditions` / `lireConditions` FAITES TOURNER** (E-B1) : un devis à « À la signature », carte ouverte puis fermée sans geste → `acompteALaSignature` vaut toujours vrai dans `changements` (donc aucune différence, aucune écriture) ; rouverte par « Corriger » → `echeance` vaut vrai ; acompte vidé → l'échéance GARDÉE ; `PAS_ENCORE_VERIFIE` (l. 8582 et 8648) : contient « réparation urgente », ne contient plus « la garantie décennale » ; `LE_CHANTIER` (introduction, q3) ; **`CHAMPS_DU_CHANTIER` égale aux trois champs des questions** (E-I6) ; **l'ordre des pastilles de Q1, Q2, Q3 est le même, « Non » d'abord** (E-I3) ; `ENDROIT_DU_MOTIF` complet (l. 8920-8927) ; **`secondeActionDuPoint` : aucun second bouton sur `devis_attestation` ni `devis_attestation_date`**, « Répondre dans « Le chantier » » et `q3` sur `devis_decennale`, « Revoir » et `q2` sur `devis_taux_reduit_neuf` (E-I4) ; `CHAMP_DU_MOTIF` sans entrée pour les clés du rang 11 ; `phraseEchecDuDevis` (deux comparaisons) ; `resumeDesConditions` dit « à la signature » ; **aucun bouton** de `PourRemettre`, `ConditionsDevis` ou des aides ne propose de marquer une ligne « urgente » ; « un seul interrupteur dans `ConditionsDevis.js` » inchangé ; `estUnRefusDefinitif({ code: 'OP028' }) === false` inchangé ; **`motifsDeRemise` appelé sans `jour`** rend la même chose qu'avec `jourLocal()`, **joué dans trois fuseaux** (Paris, Antilles, Kiritimati, la leçon de la vérification 49 de `verifier-tarifs`) ; `cas-remise.json` sans date entre 2002 et 2998 (M11 base) |
| `verifier-emetteur` | **la porte étroite** de `motifs_refus_remise` (l. 1331-1345) se réécrit EN LE DÉCIDANT : toujours UNE mention d'`emetteur` (le régime) ; et désormais UNE lecture d'`emetteur_assurances`, colonnes nommées (`valide_jusquau`, `nature`, `attestation_chemin`), filtrée par `a.pro_id = v_pro` ; jamais `tarifs_pro` ; son commentaire (l. 1298-1307) dit la raison ; `etatDeLAssurance` FAITE TOURNER (date future, du jour, passée, vide) ; « Opus n'en exige aucune » (l. 2053-2054) → la phrase nouvelle ; l'avis `a_la_signature` ; l'avis `decennale_sans_attestation` (« et pas seulement pour un particulier ») ; l'aide de « Valable jusqu'au » conditionnée à la nature |
| `verifier-postes` | `PROPRIETES_DE_LA_RANGEE` : 15 (l. 2786) ; aucune clé ne contient « réf » |
| `verifier-legal` | `VERSION` et son bloc ; la phrase des devis ; les empreintes ; son commentaire « le seul régime » (l. 813-822) |
| `verifier-lectures`, `verifier-portes`, `verifier-remontee` | inchangés — à relever, pas à supposer |

### 5.5 `mesure-devis` (pas dans `npm run verifier` ; serveur relancé avec `-c`, module servi vérifié)

1. **La carte d'un poste, à 393 et à 320** : quatre interrupteurs
   (`getByRole('switch')`, l'ordre Main-d'œuvre, Fourniture, Offert, urgence),
   chacun ≥ 44 × 44 par sa BOÎTE ; le sous-titre ; aucun débordement ; la
   phrase « trois interrupteurs » (l. 1305-1306) devient « quatre ».
2. **Une option** : trois interrupteurs ; **une pièce, une zone, une
   réserve** : aucun interrupteur d'urgence.
3. **Rien ne saute sous le doigt** : toucher l'urgence → son `y` inchangé,
   hauteur + 2 au plus ; le texte « Si ce n'est pas vraiment le cas… »
   apparaît SOUS la rangée, puis disparaît à l'extinction.
4. **L'écriture** : un appui = une écriture qui porte la marque ; un prix tapé,
   puis l'appui → l'écriture porte les deux.
5. **La liste** : « · réparation urgente » avant le total ; `rangees()` lit
   toujours son total ; l'étiquette parlée contient la marque.
6. **Une ligne neuve où l'on n'a touché que l'urgence**, carte fermée : elle
   reste « incomplète » (pas de disparition muette).
7. **Le devis venu d'une urgence** : la ligne « Ce devis vient d'une demande
   d'urgence … » au-dessus de l'interrupteur, ÉTEINT ; absente sur un devis
   ouvert à la main et sur une option.
8. **« Le chantier »** : Q3, « Non » · « Oui (par défaut) » ; **le `x` de
   « Non » est le même dans les trois questions** ; la hauteur de la rangée
   ÉGALE dans tous ses états à 320 et 393 ; un appui « Non » → le résumé ;
   **ouverte par « Répondre dans « Le chantier » », Q3 est dans la fenêtre**
   à 320 et à 393 (son `y` mesuré).
9. **« Pour le remettre »** : effacer la date de la décennale de démonstration
   → `devis_attestation_date` (« Par prudence ») sur « Sol du séjour »,
   `devis_decennale` sur un devis sans réponse ; retirer l'assurance →
   `devis_attestation` (« La loi ») sur « Sol du séjour » ; « Compléter dans
   « Mon entreprise » » (≥ 44, `jugerLaCarte`) → « Mon entreprise » sur
   Assurances ; remettre l'assurance, fermer : UNE relecture, le point éteint,
   la hauteur de la ligne du haut inchangée (110 à 393) ; **aucun second
   bouton sur `devis_attestation` et `devis_attestation_date`**.
10. **La rangée d'une assurance, à 320** : la ligne d'état « Valable jusqu'au
    … » / « Sans date de fin » mesurée par sa BOÎTE (hauteur > 0, son bas dans
    la boîte de la rangée), **jamais par `innerText`**, qui lit aussi le texte
    rogné par `WebkitLineClamp` (E-I5).
11. **« Conditions »** : la question TOUJOURS là, acompte ou non ; **l'`y` de
    « Validité de l'offre » égal avant et après le premier enregistrement de
    l'acompte** (E-I2) ; les deux pastilles sur UNE rangée à 320, rien de
    choisi d'office ; « À la signature » → le point et la ligne « pourquoi »
    (« Dites d'abord à quel titre… »), la pastille touchée à son `y` ;
    « Choisir le moment du paiement » ouvre « Conditions » SUR l'échéance ;
    toutes les lignes urgentes + « à titre privé » → le point et la ligne
    s'éteignent, l'aide de l'urgence ; une option ajoutée → la ligne « Une
    option… » et le point reviennent ; **fermer puis rouvrir la carte : « À la
    signature » toujours choisi, et aucune écriture d'en-tête au départ**
    (E-B1).
12. **La garde de sortie** : un marqueur touché puis la barre du bas, la garde
    attend l'écriture.
13. **Les invariants** : « Muret de clôture » — « Ce devis : rien ne
    manque » ; « Terrasse en bois » — exactement deux points ; quatre devis à
    la fin.

### 5.6 Les sabotages à poser (un banc, sur une copie)

Chacun doit être refusé par la vérification qui le vise.

| # | défaut remis | doit être vu par |
|---|---|---|
| S1 | `devis_ligne_urgence_check` permet l'option | essai 49-remise |
| S2 | l'urgence d'un titre passe (contrainte retirée, `forme_check` seule) | essai 49-remise, `verifier-devis` (`CONTRAINTES_LIGNE`) |
| S3 | `urgence` hors de `grant insert` (ou d'`update`) | essai 49-conditions (42 colonnes), `verifier-devis` |
| S4 | `urgence` absente de `booleens` | `verifier-devis` (la traduction FAITE TOURNER) |
| S5 | le joueur des cas d'argent sans `'urgence', false` | essai 49 (tous les cas joués refusés) |
| S6 | le motif de l'acompte écrit `not (v_tout_urgent and …)` | essai 49-remise (vide et tout urgent), `cas-remise --verifier` |
| S7 | « toutes les lignes » ne compte que les postes | essai, `cas-remise` |
| S8 | le motif de l'acompte oublie `chantier_neuf_conso`, ou la réponse `professionnel` | essai, `cas-remise` |
| S9 | l'urgence lève le 8e jour pour `professionnel_hors_activite` | essai, `cas-remise` |
| S10 | le motif sort sans acompte demandé | essai |
| S11 | le motif de l'acompte en `loi` | `CONTRAT_B2` |
| S12 | une attestation sans date comptée valable | essai, `cas-remise` |
| S13 | `current_date` au lieu du jour de Paris | essai (le cas Kiritimati), forme de 49.9 (`verifier-devis`) |
| S14 | la lecture de l'attestation sans `a.pro_id = v_pro` | essai (l'enveloppe `security definer`), `verifier-emetteur` (porte étroite) |
| S15 | une `rc_pro` comptée | essai, `cas-remise` |
| S16 | `devis_decennale` sort aussi pour « Non » | essai, `cas-remise` |
| S17 | `devis_attestation` en `prudence`, `devis_attestation_date` ou `devis_decennale` en `loi` | `CONTRAT_B2` |
| S18 | une seconde lecture d'`emetteur` (le nom de l'entreprise) | `verifier-emetteur` (porte étroite) |
| S19 | le motif lit `source` ou `sos_request_id` (« pour proposer ») | D4-c de `verifier-devis`, essai 14 c |
| S20 | `'urgence'` écrit entre apostrophes dans le corps | D4-c |
| S21 | un appelant calcule le jour par `new Date().toISOString().slice(0, 10)` (le jour UTC) — **remplace le S21 du v1**, `new Date(…)` sur deux dates « AAAA-MM-JJ » étant une mutation équivalente (M4 base) | `verifier-devis` (appel sans `jour`, trois fuseaux) |
| S22 | `ligneNeuve` reprend l'urgence de la ligne précédente | `verifier-devis` |
| S23 | `valeursDeLaProposition` porte `urgence` | `verifier-devis` |
| S24 | la carte allume l'urgence quand `depuisUneUrgence` | `verifier-devis`, `mesure-devis` (7) |
| S25 | l'aide de l'urgence change avec l'état (dans la rangée) | `verifier-devis`, `mesure-devis` (3) |
| S26 | « · réparation urgente » après le total | `mesure-devis` (5) |
| S27 | la rangée reçoit `urgence` hors de `proprietesDeLaRangee` | `verifier-postes` |
| S28 | `aidesDeLAcompte` dit « permis » quand `signaturePermise` est fausse (ou l'inverse) | `verifier-devis` |
| S29 | un bouton « Marquer les lignes urgentes » dans `PourRemettre` ou `ConditionsDevis` | `verifier-devis` |
| S30 | un second `Interrupteur` dans `ConditionsDevis.js` | `verifier-devis` |
| S31 | `PAS_ENCORE_VERIFIE` sans « réparation urgente », ou avec encore « la garantie décennale » | `verifier-devis` |
| S32 | « Opus n'en exige aucune » remis seul | `verifier-emetteur` |
| S33 | l'avis `a_la_signature` promet encore « Chaque devis dira… », ou ne dit pas de retirer la formule | `verifier-emetteur` |
| S34 | `urgence` absente de `ligneVierge` | `verifier-devis`, `mesure-devis` (6) |
| S35 | un `cas-remise.json` avec une date relative (2026-12-01) | `generer-cas-remise` (refus) ET `verifier-devis` |
| S36 | Q3 écrit « Oui » sans appui, ou une confirmation demandée pour « Non » | `verifier-devis` |
| S37 | la hauteur de la rangée « Le chantier » change d'un état à l'autre | `mesure-devis` (8) |
| S38 | `OP028` levé dans `recalcule_devis` | **`FORMES_CALCUL.recalcule_devis`** de `verifier-devis` (l. 3757-3767, la forme entière ; M3 base — ni l. 8667, qui teste le classificateur JS, ni le cas 27 a) |
| S39 | `etatInitialConditions` sans la ligne de l'échéance (E-B1) | `verifier-devis` (carte ouverte puis fermée), `mesure-devis` (11) |
| S40 | `lireConditions` vide l'échéance avec l'acompte, comme la nature (E-B1) | `verifier-devis` |
| S41 | `engageDecennale` retiré de `CHAMPS_DU_CHANTIER` (E-I6) | `verifier-devis` |
| S42 | Q3 met « Oui » à gauche (E-I3) | `verifier-devis`, `mesure-devis` (8) |
| S43 | un second bouton sur `devis_attestation` (E-I4) | `verifier-devis` |
| S44 | la clé `devis_attestation_date` fondue dans `devis_attestation` (une décennale jointe sans date rend « la loi », B1/D7) | essai, `cas-remise`, `CONTRAT_B2` |
| S45 | `ChantierDevis` ignore `questionInitiale` (E-I1) | `mesure-devis` (8) |
| S46 | l'état de l'assurance ajouté au bout du texte coupé (E-I5) | `mesure-devis` (10), par la boîte |
| S47 | `pourquoiPasALaSignature` rend une cause quand `signaturePermise` est vraie, ou `null` quand elle est fausse | `verifier-devis` |
| S48 | `LIBELLE_URGENCE` sans « expressément », ou `DEPUIS_UNE_URGENCE` qui dit « marquez chaque ligne », ou `URGENCE_SI_ALLUMEE` qui dit « garde ses 14 jours » (D1, D2, D3) | `verifier-devis` (`AIDES_DE_DROIT_ATTENDUES`) |
| S49 | l'aide de Q3 dit « quel que soit le client » (D6) | `verifier-devis` (`LE_CHANTIER`) |
| S50 | la contrainte posée sous condition sans `conrelid` (M6 base) | lecture de la migration (le script la compte), pas un contrôle du dépôt : à dire |

---

## 6. L'essai sur la vraie base, et les questions pour l'iPhone

### 6.1 Sur la vraie base, par le chemin de l'application

Après la migration (accord). Deux artisans jetables **à Brest**,
`…@exemple-opus.test`, SIRET fictifs à clé juste et inconnus du répertoire
(les deux preuves SIRET `essai` déjà en base, réutilisées, avec l'accord du
propriétaire) ; `enregistrer_vues` neutralisé ; **le régime de TVA déclaré
AVANT le premier poste** (la leçon de 2b-1 : sinon `devis_ligne_forme_check`
refuse le poste) ; une attestation : un petit PDF envoyé dans `documents`,
comme au lot 0a ; supprimés ensuite par `preparer_suppression_compte` +
`/functions/v1/compte` ; le `.env` retiré dans une commande à part ; un
serveur arrêté par son numéro, jamais `pkill -f`. Le compte du propriétaire
n'est jamais touché.

| | attendu |
|---|---|
| A, un poste à `urgence = true` · une option à `urgence = true` · une pièce | 201 · **400 · `devis_ligne_urgence_check`** · idem pour la pièce |
| A change le type d'un poste urgent en option | **400 · `devis_ligne_urgence_check`** |
| A envoie `urgence: null` à la création | 400 (23502) — l'application ne le fait jamais (`booleens`) |
| A, sans assurance, devis sans réponse décennale | `devis_decennale`, `prudence` |
| …« Oui » | `devis_attestation`, `loi` ; « Non » → absent |
| A déclare une décennale avec fichier et date dans un an | absent ; date effacée → `devis_attestation_date` (`prudence`) ; réponse retirée → `devis_decennale` |
| A, une `rc_pro` valable seule | le motif reste |
| B lit l'assurance de A · appelle `motifs_refus_remise` sur le devis de A | `[]` · OP027 |
| acompte 30 %, nature, « à la signature », client à titre privé, une ligne non urgente | `devis_acompte_signature`, `prudence` |
| …toutes les lignes urgentes | absent ; une option ajoutée → présent |
| …réponse `professionnel` · `chantier_neuf_conso` vrai | absent · absent |
| …réponse retirée (client changé), tout urgent | présent (la garde du `is not true`) |
| A écrit `acompte_a_la_signature` et `engage_decennale` d'un appui | 204 ; un visiteur : 401 |
| l'export RGPD de A | les trois colonnes dans `devis_emis` et `devis_lignes` |
| à CHAQUE pas, la liste de la base contre `motifsDeRemise` (avec les assurances et le jour) | identique au caractère près |

**Non couverts sur la vraie base, et dits** : l'urgence sur un devis venu
d'une VRAIE urgence (aucune urgence en base ; le marqueur ne dépend pas du
lien, `docs/PLAN-DEVIS.md` l. 3203 : un devis « manuel » suffit) ; le passage
de minuit à Paris (tenu par l'essai, Kiritimati, et `verifier-devis`) ;
l'écran, qui ne tourne qu'en démonstration.

### 6.2 Les questions pour l'iPhone (build de développement, après `git pull` et `npx expo start -c`)

1. La carte d'un poste : « Réparation urgente expressément demandée par le
   client » au pouce ; l'aide se lit ; allumée, le texte apparaît DESSOUS et
   rien ne saute ; la ligne dans la liste dit « · réparation urgente ».
2. Un prix tapé, puis glisser jusqu'à l'interrupteur (le clavier se ferme) et
   l'allumer : le prix ET la marque sont dans la rangée (M5 écran).
3. Un devis venu d'une urgence (« Pour moi ») : la phrase « Ce devis vient
   d'une demande d'urgence … » est là, l'interrupteur éteint.
4. « Le chantier » → « Ces travaux peuvent-ils engager votre garantie
   décennale ? » : « Non » · « Oui (par défaut) », « Non » au même endroit
   que dans les deux autres questions ; un appui suffit ; la rangée garde sa
   hauteur. Et depuis « Pour le remettre », « Répondre dans « Le chantier » »
   arrive SUR la question.
5. « Conditions » : « Quand le client paie-t-il cette somme ? » ; « À la
   signature » → la phrase « pourquoi » dessous, le point dans « Pour le
   remettre », son bouton rouvre « Conditions » sur la question ; fermer puis
   rouvrir la carte : « À la signature » est toujours choisi.
6. « Mon entreprise » → Assurances : votre décennale dit « Valable jusqu'au … »
   sur sa propre ligne.
7. La ligne « Pour le remettre » garde ≈ 110 points sur votre iPhone 16.
8. VoiceOver : l'interrupteur dit « commutateur », activé ou non, avec son
   aide ; à l'allumage, le texte du risque est annoncé ; la rangée d'un poste
   urgent le dit.

---

## 7. Ce que 2b-3 ne fait PAS

- **2b-4** : devis payant ou gratuit, déchets, champ de l'arrêté de 2017,
  RGE ; l'avis « l'attestation expire avant le début des travaux »
  (`docs/CAHIER-LOT-2B-1.md` §6, point 5 ; le devis n'a pas de date de début) ;
  l'avis du franchisé au-delà du seuil.
- **2c** : numéro, PDF, aperçu, remise ; **joindre l'attestation et la
  FIGER** (une copie ou une désignation, D12 ; `schema.sql` l. 11181-11185) —
  **et vérifier que l'objet existe dans `documents`** avant de le joindre (un
  chemin écrit ne prouve pas un fichier, M9 base) ; **la remise lit
  l'attestation qu'elle fige SOUS VERROU** (`for share` sur la ligne
  d'`emetteur_assurances` choisie), dans la même transaction que le statut,
  et recalcule la liste au moment de la remise (I3 base : la liste dépend
  désormais d'une table de plus et du JOUR) ; imprimer « vous ne bénéficiez
  pas du droit de rétractation » pour les lignes urgentes (L. 221-5 10°, J9)
  — **seulement pour un client qui commande à titre privé** : pour une petite
  entreprise, la prudence d'Opus (J6) vaut aussi pour cette information,
  sinon elle serait privée d'une information due (L. 221-20 ; D11 droit) ; le
  formulaire dès qu'une ligne ne l'est pas ; **la demande EXPRESSE du client,
  sur papier ou support durable, pour commencer une ligne non urgente d'un
  devis mixte avant 14 jours** (L. 221-25 al. 1, `conso-L221-25.txt` l. 13 :
  sans elle, rien n'est dû s'il se rétracte, l. 15 ; D11 droit) ;
  l'échéance imprimée ; **la règle des 7 jours vise TOUT paiement, pas
  l'acompte** (« aucun paiement … sous quelque forme que ce soit »,
  `conso-L221-10.txt` l. 13) : le solde payé à la fin d'un dépannage NON
  urgent fait sous 7 jours n'est signalé par rien, et 2c imprimera un « reste
  à payer » sans échéance — **une question au propriétaire avant 2c** (une
  échéance du solde, ou une règle dérivée ; D11 droit) ; **le texte libre des
  modalités qui parle d'un paiement à la signature** : ne pas l'imprimer sur
  un devis dont l'échéance est « dès le 8e jour », ou en faire un point —
  **décision avant 2c** (P-U5 de l'analyse, D10 droit, J10) ; **figer** les
  marqueurs, la réponse décennale et l'échéance ; la remise refusée par la
  MÊME liste ; une phrase des conditions d'utilisation sur les déclarations de
  l'artisan (M10 droit, §4).
- **Le module facture** : la liste officielle des travaux d'urgence à 10 %
  (`docs/PLAN-DEVIS.md` l. 2911) — jamais le marqueur de 2b-3 (M7 droit) ;
  l'attestation qui couvre l'ouverture réelle du chantier.
- **Jamais ici** : une contrainte ou un motif qui lie l'urgence à l'origine
  du devis (D3, D4-c) ; un marqueur dans la base de postes (lot P : sa clé
  est la phrase, l'unité et la fourniture) ; le SOS, le QR, le Dossier
  Travaux ; un module natif.
- **Dans `A-FAIRE`** (« Après l'étape 2b-3 ») : les deux avis
  (« l'urgence ne change rien pour ce client », « une réparation urgente sur
  un bâtiment neuf ») ; deux appuis rapides sur un interrupteur (une
  référence, le modèle `enCours` de `FicheAssurance.js` l. 73-81) ; le
  paiement en deux temps d'un devis mixte (J5) ; la phrase « garde
  d'urgence » d'`A-FAIRE` l. 3575 réécrite (« OP028 reste libre ») ; deux
  jours, deux horloges (M14 base, M3 écran) ; « Mon entreprise » ouvert SUR la
  date de l'attestation (M8 écran) ; les lignes d'état de Q1 et Q2 qui
  poussent Q3 d'environ 24 points (existant depuis 2b-2, M11 écran) ; un
  métier non soumis à la décennale (catégorie « conseil ») devra répondre
  « Non » à chaque devis (M6 droit) — jamais déduire la réponse du métier
  (`docs/PLAN-DEVIS.md` l. 2867) ; BANC7-X1, E4 et « Poste suivant » restent
  où ils sont ; la ré-acceptation des CGU (toujours absente, alors que
  `VERSION` change encore) ; la phrase L. 243-2 de `docs/PLAN-DEVIS.md`
  l. 2871 (« face à un consommateur ») et le classement de `PLAN` l. 2892 (le
  refus sans attestation « plus strict que la loi » : vrai du déclencheur, pas
  de l'obligation), à corriger dans la documentation de fin d'étape.

---

## Annexe A — Le contrat (texte exact ; apostrophe typographique ’ ; guillemets « » avec des espaces ordinaires, comme dans le code)

Longueurs mesurées avec `node` (`…/lot2b3/cahier/longueurs-v2.mjs`, ÉTABLI,
espaces ordinaires — le code met l'espace insécable là où il est dit).

### A.1 Les quatre motifs du devis (49.9 = `MOTIFS_DEVIS`, octet pour octet)

| rang | clé | condition | nature | phrase | car. |
|---|---|---|---|---|---|
| 10 | `devis_acompte_signature` | `acompte_a_la_signature is true`, un acompte demandé (% ou €), réponse valable ≠ `professionnel`, `chantier_neuf_conso is not true`, et PAS (toutes les lignes chiffrées urgentes ET réponse `consommateur` ou `non_professionnel`) | `prudence` | Choisissez « Dès le 8e jour » pour l’acompte ou les arrhes : signé chez le client, ce devis pourrait n’autoriser aucun paiement avant, et Opus ne sait pas où il le sera. | 169 |
| 11 | `devis_attestation` | `engage_decennale is true`, aucune décennale de l'entreprise avec un fichier et une `valide_jusquau` ≥ jour de Paris, et aucune décennale jointe SANS date | `loi` | Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin : la loi demande de la joindre à ce devis, puisque ses travaux peuvent engager cette garantie. | 172 |
| 11 | `devis_attestation_date` | `engage_decennale is true`, aucune décennale valable, et au moins une décennale jointe SANS date de fin | `prudence` | Écrivez dans « Mon entreprise » la date de fin de votre attestation décennale : sans elle, Opus ne sait pas si l’attestation jointe est encore valable. | 151 |
| 11 | `devis_decennale` | `engage_decennale` vide, aucune décennale valable ; jamais avec les deux autres | `prudence` | Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin, ou répondez « Non » dans « Le chantier » si ces travaux ne peuvent pas engager votre décennale. | 174 |

Une seule phrase chacune ; aucun mot « source » ; aucune valeur entre
apostrophes droites ; **aucun article cité** : la phrase de la base et celle
du miroir sont égales à l'octet, et un article porterait dans le JS la
séquence de l'espace insécable que le corps SQL n'a pas le droit de contenir
(essai 49-remise, 14 c : ni `chr(160)` ni `chr(8239)`). C'est la règle de
toutes les phrases de `MOTIFS_DEVIS` aujourd'hui (ÉTABLI, `devis.js`
l. 3516-3594). Les références vivent dans le commentaire SQL : L. 221-10
al. 1 et 4°, L. 242-7 pour le rang 10 ; L. 243-2 al. 2, A. 243-3 1° e et 2° a
pour le rang 11. « La loi » du rang 11 ne porte que sur le geste de JOINDRE
(D7). « Dès le 8e jour » est le libellé de la pastille (A.4) : s'il change à
la réponse P2, la phrase change avec lui.

### A.2 La ligne urgente (`devis.js`)

- `LIBELLE_URGENCE` : « Réparation urgente expressément demandée par le
  client » (54)
- sous-titre : `LE_CHANTIER.q1.sousTitre` — « Pour les droits de votre client »
- `AIDE_URGENCE` (dans l'interrupteur, FIXE) : « Seulement le strict
  nécessaire d’un entretien ou d’une réparation urgents que votre client vous
  a expressément demandés, chez lui : s’il commande à titre privé, il n’aura
  pas de droit de rétractation pour cette ligne. » (217)
- `URGENCE_SI_ALLUMEE` (dessous, allumée seulement ; annoncée à VoiceOver à
  l'allumage) : « Si ce n’est pas vraiment le cas, c’est vous qui prenez le
  risque : le client peut se rétracter jusqu’à douze mois de plus, sans
  forcément vous devoir les travaux déjà faits ; un paiement reçu avant le 8e
  jour permet d’annuler le contrat, et l’exiger ou le recevoir est puni
  jusqu’à deux ans d’emprisonnement et 150 000 € d’amende. Profiter de
  l’urgence pour faire signer davantage peut être un abus de faiblesse (code
  de la consommation, L. 121-9). » (448 ; « 150 000 € » et « L. 121-9 » : la
  séquence de l'espace insécable dans le JS)
- `DEPUIS_UNE_URGENCE` : « Ce devis vient d’une demande d’urgence : ne
  marquez une ligne que si elle remplit les conditions ci-dessous, et
  seulement le strict nécessaire. » (143)
- `DETAIL_URGENCE` (la liste) : « réparation urgente »
- Sources : L. 221-28 8° (`conso-L221-28.txt` l. 21), L. 221-10 4° (l. 18),
  L. 221-20 (« prolongé de douze mois », l. 13), L. 221-25 al. 3 (« Aucune
  somme n'est due … si sa demande expresse n'a pas été recueillie », l. 15 —
  d'où « sans forcément », DÉDUIT pour une ligne faussement urgente),
  L. 242-1, L. 242-7 (« Le fait d'exiger ou d'obtenir », l. 13), L. 121-9 5°
  (`conso-L121-9.txt` l. 13 et 18 : l'infraction est d'ABUSER de la faiblesse ;
  le 5° n'en décrit que la circonstance, d'où « peut être »). La structure
  suit la confirmation du chantier neuf approuvée le 09/11 (`devis.js`
  l. 5077-5079 : « c'est vous qui prenez le risque … douze mois de plus … deux
  ans d'emprisonnement et 150 000 € d'amende »). Au juriste (J10).

### A.3 « Le chantier » (si P1 = A)

- `introduction` : « Ces questions sont indépendantes : on peut répondre
  « Oui » à l’une et « Non » à une autre. » (91 ; remplace « Deux questions
  indépendantes : … »)
- **Q3** — sous-titre « Pour votre assurance » ; question « Ces travaux
  peuvent-ils engager votre garantie décennale ? » (58) ; pastilles « Non » ·
  « Oui (par défaut) » tant que la valeur est vide, puis « Non » · « Oui » ;
  aide : « « Oui » si ces travaux construisent ou refont un ouvrage, ou un
  élément qui fait corps avec lui — un mur, une dalle, une charpente, une
  toiture… —, même sur un bâtiment existant : la loi demande alors de joindre
  votre attestation décennale au devis, et pas seulement pour un particulier
  (code des assurances, L. 243-2). « Non » pour un dépannage ou un entretien
  qui ne crée ni ne refait aucun ouvrage. En sous-traitance, ou pour certains
  ouvrages que la loi exclut (voirie, réseaux…), elle ne la demande
  peut-être pas. Dans le doute, gardez « Oui » : c’est le cas le plus sûr. »
  (576 ; sources : C. civ. 1792, 1792-1 1°, 1792-2 ; L. 243-2 al. 2,
  `assur-L243-2.txt` l. 14 ; L. 243-1-1 I, `assur-L243-1-1.txt` l. 14-15 ;
  « Non » : lecture étroite, J1 ; « même sur un bâtiment existant » : J4 ;
  sous-traitance : J3)
- **Résumés de la rangée** : la partie de Q1/Q2 d'aujourd'hui, puis — Q3
  vide : rien ; « Oui » : « ; décennale : oui » ; « Non » : « ; décennale :
  non » ; puis les suffixes « — enregistrement… » et « — pas enregistré ».
  Quand Q1 et Q2 sont toutes deux cachées (réponse `professionnel` en
  franchise) : « Décennale : oui (par défaut) », « Décennale : oui »,
  « Décennale : non ». Le plus long gabarit : « Bâtiment neuf, confirmé le
  JJ/MM/AAAA ; taux normal de TVA ; décennale : non — pas enregistré » (93,
  contre 106 au v1).

### A.4 « Conditions » et les aides de l'acompte

- étiquette : « Quand le client paie-t-il cette somme ? » (39)
- pastilles : « Dès le 8e jour (par défaut) » · « À la signature » (valeur
  vide), puis « Dès le 8e jour » · « À la signature »
- `ECHEANCE_ACOMPTE_URGENCE` (permis par l'urgence) : « Toutes les lignes
  chiffrées de ce devis sont marquées « réparation urgente » : pour elles, la
  règle du 8e jour ne s’applique pas. Si une ligne ne l’est pas vraiment,
  retirez sa marque : un paiement reçu trop tôt permettrait au client
  d’annuler le contrat. » (255)
- `AIDE_NATURE_ACOMPTE_PRUDENCE` (T7, réponse `non_professionnel`, sans
  urgence) : « Des arrhes : chacun peut renoncer — le client en les perdant,
  vous en lui rendant le double. Un acompte engage les deux. Pour une
  association, une copropriété ou une société civile, la loi ne prévoit
  peut-être pas de délai de rétractation ; Opus le compte, par prudence : si
  le client se rétracte, rendez-lui tout ce qu’il a versé. » (331)
- **la ligne « pourquoi »** (`pourquoiPasALaSignature`, la première cause dans
  cet ordre) :
  - pas de réponse « à quel titre » : « Dites d’abord à quel titre ce client
    commande : sans réponse, Opus compte le 8e jour. » (85)
  - `professionnel_hors_activite` : « Pour une entreprise, Opus n’applique pas
    l’exception des réparations urgentes, par prudence : la loi la prévoit au
    domicile d’un particulier. » (141)
  - aucune ligne chiffrée marquée : « Aucune ligne chiffrée de ce devis n’est
    marquée « réparation urgente ». » (71)
  - une option : « Une option n’est jamais une réparation urgente : tant que
    ce devis en porte une, comptez le 8e jour. » (100)
  - une ligne non marquée : « La ligne « <désignation> » n’est pas marquée
    « réparation urgente ». » ; sans désignation : « Une ligne de ce devis
    n’est pas marquée « réparation urgente ». »
- `actionDuPoint`, champ `echeance` : « Choisir le moment du paiement »
- résumé des conditions : « Acompte 30 % à la signature » (« Arrhes … »,
  « Acompte ou arrhes … » selon la nature, `libelleAcompte`)

### A.5 La phrase de `devis_ligne_urgence_check` (`erreurs.js`)

« Seul un poste peut être marqué « réparation urgente » — ni une option, ni
un titre, ni une réserve. Rien n’a été enregistré. » (124)

### A.6 Les phrases qui changent

- `PAS_ENCORE_VERIFIE` : « Pas encore vérifié : le moment de la signature, si
  une ligne marquée « réparation urgente » l’est vraiment, si le devis
  lui-même est payant, les déchets de chantier, le label RGE pour des travaux
  d’énergie, les conditions du taux réduit de TVA (l’ancienneté du logement,
  la certification du client), et si votre attestation décennale couvre ces
  travaux (ses activités, la date où le chantier s’ouvrira). » (403 ;
  aujourd'hui 276 ; si P2 = non, « l’urgence » reste telle quelle)
- avis `sans_assurance` (`emetteur.js` l. 1581-1588) : « Aucune assurance
  déclarée. Opus n’en exige aucune pour votre fiche ; mais un devis dont les
  travaux peuvent engager votre garantie décennale ne se remettra qu’avec son
  attestation, et pour un devis à un particulier, la loi demande de lui
  communiquer l’assurance de responsabilité professionnelle que vous avez
  souscrite (code de la consommation, R. 111-2) : si vous en avez une,
  déclarez-la, Opus l’imprimera sur vos devis. » (423 ; « assurance de
  responsabilité professionnelle » : les mots de R. 111-2 9°,
  `conso-R111-2.txt` l. 22 ; un futur, rien ne s'imprime avant 2c — M9 droit ;
  si P1 = B : « … engager votre garantie décennale vous signalera son
  attestation, et … »)
- `FicheEmetteur.js` l. 830-831 : « Aucune assurance déclarée. Opus n’en exige
  aucune pour votre fiche ; mais un devis dont les travaux peuvent engager
  votre garantie décennale demande son attestation : déclarez celles que vous
  avez souscrites, elles s’imprimeront sur vos devis. » (243)
- `FicheAssurance.js` l. 173 : « Opus n’en exige aucune pour votre fiche ;
  mais un devis dont les travaux peuvent engager votre garantie décennale
  demande son attestation, avec sa date de fin. Pour un devis à un
  particulier, la loi demande de lui communiquer l’assurance de
  responsabilité professionnelle que vous avez souscrite (code de la
  consommation, R. 111-2) : déclarez celles que vous avez, Opus les imprimera
  sur vos devis. » (398)
- `FicheAssurance.js` l. 257, sans date, **pour une décennale seulement** :
  « Nécessaire pour vos devis dont les travaux peuvent engager votre
  décennale. Touchez le dernier jour de validité de votre attestation. »
  (133) ; pour une autre nature, inchangé : « Facultatif. Touchez le dernier
  jour de validité de votre attestation. »
- avis `decennale_sans_attestation` (`emetteur.js` l. 1600-1604) : « Votre
  décennale{ (assureur)} n’a pas d’attestation jointe. Pour des travaux qui
  peuvent engager votre décennale, son attestation est jointe au devis, et
  pas seulement pour un particulier (code des assurances, L. 243-2) : chaque
  devis le demandera selon ses travaux. » (252 sans le nom de l'assureur ;
  D6 : « quel que soit le client » était faux pour le sous-traitant)
- avis `a_la_signature` (`emetteur.js` l. 1627-1633) : « Vos modalités de
  paiement parlent d’un paiement à la signature (ou à la commande). Elles
  s’imprimeront sur tous vos devis. Pour un devis à un particulier ou à une
  petite entreprise, signé hors de vos locaux (chez lui, sur le chantier, ou
  dans vos locaux juste après l’avoir rencontré ailleurs), la loi interdit de
  recevoir un paiement avant le 8e jour, sauf exceptions (code de la
  consommation, L. 221-10) : retirez cette formule de vos modalités, et dites,
  dans les conditions de chaque devis, quand le client paie. » (516 ; L. 221-1
  I 2° b pour « juste après », `conso-L221-1.txt` l. 17 ; L. 221-3 pour la
  petite entreprise ; si P2 = non : « … L. 221-10). Opus ne sait pas encore où
  chaque devis sera signé : retirez cette formule de vos modalités. »)
- `phraseEchecDuDevis` (`devis.js` l. 2346) : « L’en-tête du devis n’a pas
  pu être enregistré : l’objet, le lieu, le délai ou les conditions. »
  devient « L’en-tête du devis n’a pas pu être enregistré : l’objet, le
  lieu, le délai, « À quel titre ? », « Le chantier » ou les conditions. »
  (E2 : « À quel titre ? » manquait déjà depuis 2b-2 ; les autres branches de
  la fonction sont à relever avant de l'écrire).

### A.7 Les textes légaux

« Ce que nous collectons », la phrase des devis : « … et s’ils font partie
d’un chantier qui crée un bâtiment neuf, pour la TVA, si leurs travaux peuvent
engager votre garantie décennale, quand l’acompte ou les arrhes sont payés,
leurs lignes — et, pour chacune, si c’est une réparation urgente
expressément demandée par le client —, leurs prix et leurs totaux, … » (si
P1 = C : « leurs lignes — et, pour chacune, si elle peut engager votre
garantie décennale et si c’est une réparation urgente expressément demandée
par le client — » ; si P2 = non : sans « quand l’acompte ou les arrhes sont
payés »).

---

## Annexe B — Les pièges, en une liste

1. **Un droit de colonne oublié refuse la requête ENTIÈRE** (42501) : les
   deux listes (insert ET update) de 49.7, et `verifier-devis` qui compare à
   `ligneVersBase`.
2. **`ligneVersBase` envoie `null` pour une colonne qu'il ne sait pas
   booléenne** : `urgence` dans `booleens`, sinon 23502 (traduit en français,
   mais refusé) ; et le joueur des cas d'argent de l'essai 49
   (`jsonb_populate_record` met `null`).
3. **`not (x)` quand `x` peut être `null`** : la condition entière vaut
   `null`, et le motif ne sort pas — exactement pour le devis sans réponse,
   tout urgent. `is not true`, partout (la leçon du lot 0a).
4. **Le jour se compte à Paris** : `(now() at time zone 'Europe/Paris')::date`
   en base (UTC sur la vraie base) ; le miroir compare des CHAÎNES au jour
   local, et `jour` a un défaut ; une attestation « valable jusqu'au 18 »
   l'est tout le 18. Un appelant ne calcule JAMAIS le jour par
   `toISOString()` (le jour UTC).
5. **Jamais une date relative dans `cas-remise.json`** : 2001 et 2999 — le
   générateur ET `verifier-devis` le refusent.
6. **Jamais un bouton « marquer urgent »** pour lever un point ou une aide :
   un marquage faux, c'est la nullité, douze mois de rétractation de plus, et
   deux ans d'emprisonnement pour un paiement exigé trop tôt. La ligne
   « pourquoi » dit la cause, elle ne propose jamais le geste.
7. **L'urgence n'est jamais pré-cochée** : ni par l'origine, ni par la ligne
   précédente, ni par la base de postes, ni par la mémoire. Et le texte posé
   sur un devis venu d'une urgence LIMITE, il n'ordonne pas.
8. **Une aide qui change avec l'état fait sauter la rangée touchée** : tout ce
   qui dépend de l'état va SOUS la rangée, dans un `Text` à part ; l'urgence
   en dernier. Même règle pour la ligne « pourquoi » sous les pastilles.
9. **`rangees()` lit le total en fin de texte** : la marque avant le total.
10. **Le mot `source` est interdit PARTOUT dans le corps de
    `motifs_refus_remise`** (commentaires et phrases compris, « ressource »
    aussi), et `'urgence'` entre apostrophes droites ; une nature LITTÉRALE
    par branche ; `plpgsql`, jamais `begin atomic` ; ni `select *`, ni
    `%rowtype`, ni `to_jsonb`.
11. **La porte étroite de `verifier-emetteur` rougira** (« jamais
    `emetteur_assurances` ») : elle se réécrit EN LE DÉCIDANT, avec la
    raison, et reste ÉTROITE (une lecture, colonnes nommées, `pro_id =
    v_pro`) ; les commentaires « le seul régime » de cinq fichiers aussi.
12. **Les textes épinglés mot pour mot** (`PAS_ENCORE_VERIFIE`, « Opus n'en
    exige aucune », les avis `a_la_signature` et `decennale_sans_attestation`,
    `LE_CHANTIER`, `phraseEchecDuDevis`, `ECHEANCE_ACOMPTE` et ses variantes)
    changent avec leur contrôle, dans le même commit.
13. **La démonstration et ses invariants** : la décennale de démonstration
    avec un fichier, sinon « Muret : rien ne manque » tombe ; une section de
    `mesure-devis` qui écrit dans le brouillon venu de l'urgence le fait
    entrer en base — le supprimer avant les sections suivantes. **Et les
    fiches d'essai (SQL et parité) avec une décennale valable par défaut**,
    sinon les 85 cas et les 28 « rien ne manque » changent tous.
14. **Relire les OCTETS** (`od -c`) après avoir écrit une barre oblique
    inverse : l'outil d'édition et le connecteur changent la séquence de
    l'espace insécable en caractère invisible. Ce cahier n'en contient
    aucune ; `motifs_refus_remise` non plus.
15. **`npm run verifier` ne joue aucun SQL** ; `generer-cas-remise --verifier`
    et `mesure-devis` se lancent à la main ; `cas-remise --verifier` ne voit
    pas le miroir, `verifier-devis` ne voit pas la base.
16. **`mesure-devis`** : serveur relancé avec `-c`, le module servi vérifié ;
    un serveur s'arrête par son numéro, jamais `pkill -f` (il a tué le
    terminal deux fois).
17. **La base d'abord, puis `git pull`** : une colonne inconnue fait tomber
    chaque création de ligne (PGRST204).
18. **« Mon entreprise » est la seule porte de l'attestation** : un geste qui
    l'écrirait ailleurs devrait relire les deux parties de la liste.
19. **Le vocabulaire** : une attestation est « déclarée », « jointe »,
    « valable » — jamais « vérifiée » (le mot appartient au badge) ; jamais
    « la loi l'exige », jamais « au moins une assurance » (`verifier-emetteur`
    les refuse).
20. **N'écrire jamais « la rénovation n'est pas concernée »** : L. 243-1-1 II
    écarte les DOMMAGES aux ouvrages existants de l'assurance obligatoire, pas
    les travaux faits sur eux.
21. **Une carte qui n'a qu'une voie d'écriture** (« Conditions ») : tout choix
    nouveau passe par `etatInitialConditions` ET `lireConditions` ET la garde
    de « Corriger » ; un choix non initialisé part `null` à la fermeture, en
    silence (E-B1).
22. **Une nature est une phrase affichée** : « La loi » ne s'écrit que là où
    un texte l'impose DANS CE CAS ; une ignorance d'Opus (une date non saisie,
    un lieu de signature inconnu) est une prudence (B1, D7, D5).
23. **Un essai de sécurité joué sous la RLS ne voit pas un filtre manquant**
    que la RLS couvre déjà : le filtre `pro_id = v_pro` s'éprouve par une
    enveloppe `security definer` (I2).
24. **Une donnée ajoutée au bout d'un texte coupé à deux lignes disparaît
    sous « … »**, et `innerText` la lit quand même : une ligne à part, mesurée
    par sa boîte (E-I5).
25. **Une rangée de pastilles « Oui / Non » garde le même ordre dans toute la
    carte** : le pouce vise par habitude (E-I3).

---

## Annexe C — Critique → décision

Chaque constat des trois critiques (`…/lot2b3/critique/droit.md`, `base.md`,
`ecran.md`) a été **reproduit avant d'être accepté** : dans le code
(`fichier:ligne` relus), dans les textes recopiés le 04/11, dans le schéma, ou
par un relevé de forme de la vraie base (refait le 12/11 : `devis` 33
colonnes, `devis_lignes` 17, aucune des trois colonnes, 3 devis, 11 lignes,
0 option, 1 devis avec acompte, 1 devis valable plus de 30 jours, 1 décennale
jointe et valable, échéance entre 31 et 60 jours, serveur en UTC). Les mesures
de largeur de police de la critique écran sont DÉDUITES (avances de glyphes,
sans le moteur d'iOS) : acceptées comme plausibles, et **chacune devient une
mesure de `mesure-devis`** plutôt qu'une affirmation.

**Vérifié** = reproduit ; **en partie** = le fait est vrai, la portée ou la
correction diffère ; **réfuté** = faux. Aucun constat n'est réfuté sur les
faits.

### C.1 Critique « droit »

| # | constat | vérification | décision |
|---|---|---|---|
| D1 | `URGENCE_SI_ALLUMEE` dit « garde ses 14 jours » ; le vrai prix est 12 mois, des travaux non dus, le pénal | **vérifié** : `devis.js` l. 5077-5079 (« douze mois de plus … deux ans … 150 000 € ») ; `conso-L221-20.txt` l. 13 ; `conso-L221-25.txt` l. 15 ; `conso-L242-7.txt` l. 13 | texte réécrit (A.2), « sans forcément » pour les travaux non dus (DÉDUIT de L. 221-25 al. 3) ; S48 |
| D2 | `DEPUIS_UNE_URGENCE` ordonne « marquez chaque ligne », P3 décrit « ne marquer que » | **vérifié** : les deux lignes du v1 ; `urgences.js` l. 64-66 et 74 (« Ça peut attendre la nuit ») | texte qui limite (A.2) ; P3 recopie les mots exacts ; S48 |
| D3 | l'étiquette perd « expressément » | **vérifié** : `devis.js` l. 2140-2146 (TC-8 du lot 2a) | « Réparation urgente expressément demandée par le client » |
| D4 | l'aide du 8e jour offre l'exception d'urgence au petit pro que le rang 10 refuse | **vérifié** : `ECHEANCE_ACOMPTE`, `devis.js` l. 2203-2210, s'adresse à la petite entreprise et cite l'exception | **en partie** sur la correction : la ligne « pourquoi » (§3.7, A.4) dit la prudence d'Opus au moment du choix, au lieu d'une branche d'aide de plus ; le contrôle croise aide, motif et cause (§3.1) |
| D5 | la phrase du rang 10 affirme la loi dans des cas qui sont une règle d'Opus | **vérifié** : §1.2 du v1 dit lui-même « plus strict que la loi » | « pourrait n'autoriser aucun paiement » (A.1) |
| D6 | « quel que soit le client » faux pour le sous-traitant | **vérifié** : `civil-1792-1.txt` l. 13 ; l'avis existant `emetteur.js` l. 1600-1604 dit la même chose | « et pas seulement pour un particulier » dans l'aide de Q3, P1 et l'avis existant ; la sous-traitance dite comme une question ouverte (J3) ; S49 |
| D7 | `devis_attestation` « la loi » quand seule la date manque | **vérifié** : `assur-A243-3.txt` l. 19 (la date est SUR l'attestation) | clé `devis_attestation_date` (prudence) ; la phrase de `devis_attestation` ne fait porter « la loi » que sur le geste de joindre ; S44 |
| D8 | branche urgence de `aidesDeLAcompte` : nature non écrite | **vérifié** : « nature: … » au v1 | écrite : `AIDE_NATURE_ACOMPTE` pour un particulier, `AIDE_NATURE_ACOMPTE_PRO` pour une association (§3.1) |
| D9 | `PAS_ENCORE_VERIFIE` sans « l'urgence » laisse croire qu'Opus la vérifie | **vérifié** : `devis.js` l. 4138-4143 borne « rien ne manque » | « si une ligne marquée « réparation urgente » l'est vraiment » (A.6) ; S31 |
| D10 | les modalités libres « à la signature » : rien de décidé, rien pour 2c | **vérifié** : `emetteur.js` l. 1627-1633 ; L. 242-7 « exiger ou obtenir » | l'avis dit de retirer la formule (A.6) ; décision avant 2c (§7) ; J10 |
| D11 | la liste de 2c oublie : tout paiement, la demande expresse d'un devis mixte, la prudence petit pro pour l'information | **vérifié** : `conso-L221-10.txt` l. 13 ; `conso-L221-25.txt` l. 13 et 15 ; `conso-L221-3.txt` l. 13 | ajoutés à §7 (2c), avec une question au propriétaire avant 2c sur le solde |
| D12 | `AIDE_URGENCE` affirme « pas de délai de rétractation » pour tout client | **vérifié** : le v1 ; prudence du v1 pour le petit pro (§1.2) | « s'il commande à titre privé, il n'aura pas de droit de rétractation » (A.2) |
| DM1 | « ce serait un abus de faiblesse » catégorique | **vérifié** : `conso-L121-9.txt` l. 13 | « peut être » |
| DM2 | `AIDE_URGENCE` : pronoms avant l'antécédent, accord avec « le nécessaire » | **vérifié** (lecture) | réécrite (« que votre client vous a expressément demandés ») |
| DM3 | P2 : « La loi permet … dans trois cas » ; P1 présente la lecture étroite comme la loi | **vérifié** : L. 221-3 ne vise que ≤ 5 salariés | « Opus permettrait … dans trois cas », « (ou une entreprise de plus de 5 salariés) » ; P1 : « la loi demande … quand des travaux peuvent l'engager » + J1 |
| DM4 | avis `a_la_signature` : « pour un particulier » manquant, « hors de vos locaux » simplifié ; justification du v1 trop forte | **vérifié** : `conso-L221-1.txt` l. 17 (2° b) | avis réécrit (A.6) ; la justification du v1 retirée du §1.4 |
| DM5 | questions au juriste manquantes (J-A6, J-A8, J-A9, CCH, ligne de déplacement) | **vérifié** : absentes du v1 | J12, J13, J14 ; la ligne de déplacement dans J5 |
| DM6 | « qui ne touche à aucun ouvrage » ; métiers « conseil » ; ouvrages exclus | **vérifié** : `assur-L243-1-1.txt` l. 14-15 | « qui ne crée ni ne refait aucun ouvrage » ; « certains ouvrages que la loi exclut » dans l'aide ; les métiers « conseil » dans `A-FAIRE` (jamais déduire du métier) |
| DM7 | l'urgence de la consommation n'est pas celle de la TVA à 10 % | **vérifié** (deux régimes distincts, `docs/PLAN-DEVIS.md` l. 2911) | une phrase dans le commentaire de colonne (§2.1) |
| DM8 | pastille « Au plus tôt le 8e jour » sans « après la signature » | **vérifié** | **en partie** : la critique écran (M2) montre que la pastille est déjà trop large ; « après la signature » reste dans l'aide (`ECHEANCE_ACOMPTE`), la pastille devient « Dès le 8e jour » |
| DM9 | « assurances professionnelles » vs R. 111-2 9° ; « Opus le fait » au présent | **vérifié** : `conso-R111-2.txt` l. 22 | « l'assurance de responsabilité professionnelle », futur (A.6) |
| DM10 | une phrase des CGU sur les déclarations de l'artisan, pour 2c | **vérifié** : `legal.js` l. 1290-1292 (modèle P4) | §4 et §7 (2c), avec le juriste |
| DM11 | « Non retire une exigence, pas un droit du client » inexact | **vérifié** : L. 243-2 crée une obligation envers le client | justification réécrite (§1.2) |

### C.2 Critique « base »

| # | constat | vérification | décision |
|---|---|---|---|
| B1 | « La loi » sur un point dont un cas est une prudence (date non écrite) | **vérifié** : l'esquisse du v1 ne lit qu'un booléen (`v_att_valable`) | trois clés au rang 11 (§2.5) ; expirée gardée en « loi » (DÉDUIT : une date passée ne couvre pas un chantier qui ouvrira après ; J2) |
| I1 | les 85 cas et l'essai 49-remise changent tous sans décennale par défaut | **vérifié** : aucune assurance dans `generer-cas-remise.mjs` ni l'essai (`grep`) ; `cas-remise.json` : 85 cas ; 61 `execute motifs(` | décennale valable par défaut dans les fiches d'essai ; attendus existants inchangés (§5.2, §5.3) |
| I2 | S14 invisible sous la RLS | **vérifié** : `security invoker` + « mes assurances » (`schema.sql` l. 11516-11519) ; enveloppe du cas 12 f (`essais-section-49-remise.sql` l. 823-850) | le cas joué par l'enveloppe `security definer` (§5.2) |
| I3 | la remise de 2c gagne une table et une dépendance au jour à verrouiller | **vérifié** : commentaire « CE QU'ELLE NE FAIT PAS : VERROUILLER » (`schema.sql` l. 14597-14608) | une phrase dans ce commentaire (§2.5, point 9) et dans §7 (2c) |
| BM1 | 23502 n'arrive pas en anglais | **vérifié** : `erreurs.js` l. 928-934 | phrase corrigée (§3.3, annexe B) |
| BM2 | « 44 cas » du joueur | **vérifié** : `cas-devis.json` → 69 | « tous les cas joués » |
| BM3 | S38 vu par `FORMES_CALCUL`, pas par l. 8667 ni 27 a | **vérifié** : `verifier-devis.mjs` l. 3757-3767 et l. 8667 | colonne corrigée |
| BM4 | S21 est une mutation équivalente | **vérifié** (raisonnement : deux « AAAA-MM-JJ » lues par `new Date` sont deux minuits UTC) | S21 remplacé par l'appelant au jour UTC ; appel sans `jour` dans trois fuseaux |
| BM5 | S13 tenu par la forme seule | **vérifié** (un serveur d'essai à l'heure de Paris rendrait `current_date` juste) | cas Kiritimati dans l'essai |
| BM6 | condition sans `conrelid` | **vérifié** (unicité par table) | `conrelid` (§2.2) |
| BM7 | 49-conditions compte des lignes de colonnes, 39 → 42 | **vérifié** : l. 595-631 | trois lignes, 42 (§5.2) |
| BM8 | §2.8 (P1 = C) sans les deux pièges `not null` | **vérifié** | ajoutés (§2.8) |
| BM9 | « valable » = un chemin écrit, pas un fichier présent | **vérifié** : `schema.sql` l. 11228-11229 (forme du chemin seulement) | dit (§2.5) ; vérifier l'objet en 2c (§7) |
| BM10 | le format des cas doit être celui de l'application | **vérifié** : `emetteur-demo.js` l. 89-101 (`snake_case`) | lignes en `snake_case`, chemin réel ou `null` (§5.3) |
| BM11 | S35 refusé seulement à la génération | **vérifié** : `verifier-devis` lit le fichier à chaque passage | `verifier-devis` refuse aussi une date entre 2002 et 2998 |
| BM12 | n'envoyer `urgence` à la création que si vraie, pour borner la fenêtre « nouvelle application, ancienne base » | **vérifié** (le fait) | **écarté** : une seconde règle pour une colonne ; la création part entière ; l'ordre « base puis `git pull` » est dit dans chaque commit (§1.2) |
| BM13 | les commentaires « le seul régime » deviennent faux | **vérifié** : cinq fichiers, lignes citées | réécrits dans le même commit (§2.6) |
| BM14 | deux jours, deux horloges (Paris / téléphone) | **vérifié** : `emetteur.js` l. 1551-1555 (jour local) contre le jour de Paris de la base | dit (§3.2), `A-FAIRE` |
| BM15 | l'aide lit les lignes de l'écran, le motif celles de la base | **vérifié** (lecture) | dit (§3.7) |
| BE1 | essai : poste urgent passé en option par `update` | **vérifié** : `type` dans `grant update` (`schema.sql` l. 14562-14565) | cas ajouté (§5.2) ; aussi sur la vraie base (§6.1) |
| BE2 | essai : titre urgent ET mal formé | **vérifié** (l'ordre de nommage) | cas ajouté |
| BE3 | relevé après migration : `max(modifie_le)`, `max(generation)` | **vérifié** (le v1 disait « à relever » sans le prévoir) | ajouté au relevé AVANT et APRÈS (§2.7) |
| BE4 | le cas « date du jour » dans la même transaction | **vérifié** (`now()` constant par transaction) | dit (§5.2) |

### C.3 Critique « écran »

| # | constat | vérification | décision |
|---|---|---|---|
| E-B1 | l'échéance : la voie de la carte non dite ; fermer efface « À la signature » | **vérifié** : `ConditionsDevis.js` l. 113-151, `devis.js` l. 3083-3208, `SaisieDevisScreen.js` l. 1199-1206 et 1290-1294 | `etatInitialConditions` / `lireConditions` / garde de « Corriger » ; l'acompte retiré garde l'échéance ; contrôle et S39, S40 |
| E-I1 | Q3 sous le pli à l'ouverture depuis un point | **vérifié** : `ChantierDevis.js` l. 93 (pas d'ancre) ; `SaisieDevisScreen.js` l. 1410 | `questionInitiale` et ancre (§3.6) ; mesure (§5.5, 8) ; S45 |
| E-I2 | la question de l'échéance fait sauter « Validité » | **vérifié** : `ConditionsDevis.js` l. 307-322 (l'aide du 8e jour toujours là) ; ~90 points DÉDUIT | question toujours montrée, l'aide ne déménage pas (§3.7) ; mesure de l'`y` de « Validité » |
| E-I3 | Q3 met « Oui » à gauche, Q1 et Q2 « Non » | **vérifié** : `ChantierDevis.js` l. 102-136 | « Non » à gauche partout ; S42 |
| E-I4 | le second bouton pousse vers « Non » ; « ou répondez » promet trop | **vérifié** (seul « Non » éteint le point dans « Le chantier ») | pas de second bouton sur `devis_attestation` et `devis_attestation_date` ; « Répondre dans « Le chantier » » sur `devis_decennale`, phrase qui dit ce qui éteint ; S43 |
| E-I5 | la date de l'attestation coupée par `numberOfLines={2}` ; `innerText` passerait au vert | **vérifié** : `FicheEmetteur.js` l. 849 ; coupe à 320 DÉDUITE par mesure de police | ligne à part ; mesure par la boîte ; S46 |
| E-I6 | `CHAMPS_DU_CHANTIER` et `etats.q3` non dits | **vérifié** : `devis.js` l. 4961 ; `SaisieDevisScreen.js` l. 815-817, 2466 | ajoutés (§3.1, §3.6) ; S41 |
| E-I7 | « À la signature » refusé sans dire pourquoi | **vérifié** : `AIDE_ACOMPTE` (`devis.js` l. 2269) et `ECHEANCE_ACOMPTE` affichées au-dessus | `pourquoiPasALaSignature` et sa ligne (§3.1, §3.7, A.4) ; S47 |
| EM1 | la rangée « Le chantier » grandit d'une ligne ; « Chantier ordinaire » quand Q1/Q2 cachées | **vérifié** (106 → 93 caractères mesurés pour le gabarit le plus long ; les lignes, DÉDUIT) | suffixe court ; résumé de Q3 seule (A.3) ; mesure |
| EM2 | les pastilles de l'échéance tiennent à 1,2 point près | **en partie** (mesure de police DÉDUITE ; 50 → 42 caractères mesurés) | « Dès le 8e jour (par défaut) » ; mesure à 320 (§5.5, 11) |
| EM3 | jour du téléphone contre jour de Paris | **vérifié** (= BM14) | dit, `A-FAIRE` |
| EM4 | VoiceOver n'entend pas le risque | **vérifié** : `retour.annoncer` existe (`retour.js` l. 132) | annonce à l'allumage (§3.4) |
| EM5 | la question 2 de l'iPhone ne se pose pas ainsi | **vérifié** : `CarteLigne.js` l. 305 (`on-drag`) | question réécrite (§6.2) |
| EM6 | `resumeDesConditions` ne dit pas l'échéance | **vérifié** : `devis.js` l. 2784-2798 | « … à la signature » (§3.1) |
| EM7 | l'ancre `echeance` n'existe qu'avec un acompte | **vérifié** (conséquence de la question conditionnelle) | réglé par la question toujours montrée |
| EM8 | « Mon entreprise » s'ouvre loin de la date | **vérifié** : `FicheAssurance.js` l. 254 | dit, `A-FAIRE` (« Accélérer ») |
| EM9 | l'aide « sans date » parle de la décennale sous toutes les natures | **vérifié** : `FicheAssurance.js` l. 254-258 | conditionnée à `nature === 'decennale'` (A.6) |
| EM10 | `motifsDeRemise({ jour })` sans défaut | **vérifié** (lecture) | défaut `jourLocal()` (§3.1) |
| EM11 | les lignes d'état de Q1 et Q2 poussent Q3 | **vérifié** : `ChantierDevis.js` l. 116, 137 | existant depuis 2b-2 ; `A-FAIRE` |
| (appui) | D2 et D3 appuyés par l'écran (la phrase sur chaque poste, le libellé lu en premier par VoiceOver) | **vérifié** | pris avec D2 et D3 |

### C.4 Ce que je n'ai pas vérifié moi-même

- Les hauteurs et coupures de ligne (critique écran) : calculées par des
  avances de police, sans le moteur d'iOS ; elles deviennent des mesures de
  `mesure-devis` (§5.5) avant d'être tenues pour vraies.
- Rien n'a tourné : ni l'application, ni un essai SQL, ni `mesure-devis` (la
  consigne de cette relecture : lecture seule). Les points DÉDUITS de
  PostgreSQL (logique à trois valeurs, ordre des contraintes, défaut constant)
  le restent jusqu'à l'essai.
- Les textes : les copies LEGI du 04/11/2026 seulement ; ni Légifrance, ni la
  directive 2011/83, ni la jurisprudence, ni le code de la construction
  (J14).
