> **Cahier de l'étape 2b-6 du module devis — le label RGE.**
>
> **Archivé le 24/11/2026, à la fin de l'étape 2b-6.** Ce cahier (v2, 24/11 :
> le v1 du 23/11 revu après ses quatre critiques adverses, avec en tête les
> réponses du propriétaire du 23/11 — Q5, P1, P3 — et du 24/11 — P11 à P14)
> a guidé l'étape ; il est versé ici TEL QU'IL A SERVI, sans une retouche,
> sous le trait qui suit cet en-tête. **En cas de désaccord, la section « Le
> label RGE, les signes de qualité, les sous-traitants — étape 2b-6 » de
> CLAUDE.md et le code disent vrai.** Ce qui a changé depuis sa rédaction :
>
> - **Les trois défauts graves de la relecture adverse unique, corrigés dans
>   le commit `c3e3801`** :
>   - **l'ordre de l'annexe A.3 (DROIT6-1)** : l'amende du label (« Pour un
>     client qui commande à titre privé, sans ces informations, le contrat
>     est nul, et votre entreprise s’expose à une amende administrative
>     pouvant aller jusqu’à 15 000 €, 75 000 € pour une société. ») n'est
>     plus à la fin de la carte : elle vient sous « Votre label RGE », juste
>     après la porte « Mes signes de qualité », AVANT « Sous-traitance ». À
>     la fin, sous « Sous-traitance », viennent l'aide puis la nullité
>     (« Pour un client qui commande à titre privé, sans ces informations, le
>     contrat est nul. »). L'ordre de A.3 et de §3.8 attribuait l'amende à la
>     sous-traitance, quand L. 242-51 ne punit d'une amende que le manquement
>     à L. 224-114 (le label). Les mots ne changent pas (P14) ; dans le code,
>     les espaces des montants et devant « € » sont insécables ;
>   - **trois aides bornées au client qui commande à titre privé
>     (DROIT6-5)** — l'aide de la sous-traitance (A.3) : « Pour un client qui
>     commande à titre privé, la loi demande de nommer, avant la signature,
>     chaque entreprise qui fera une partie des travaux de ce devis, et de
>     dire si elle détient un label RGE. » ; « Joindre le certificat »
>     (A.5) : « Le certificat ou la décision que l’organisme vous a remis.
>     Pour un client qui commande à titre privé, la loi demande de le joindre
>     au devis ; une page de l’annuaire RGE n’est pas délivrée par l’organisme
>     et n’en tient pas lieu. » ; « Joindre son justificatif » (A.5) : « Le
>     certificat que son organisme lui a remis, et qu’il vous a transmis. Pour
>     un client qui commande à titre privé, la loi demande de le fournir avec
>     le devis. » (le cahier écrivait « à votre client avec le devis ») ;
>   - **le câblage du §3.7 bis ne suffisait pas (ÉCRAN-1)** : `recevoirEmetteur`
>     en objet ne couvrait que la lecture faite À L'OUVERTURE de « Mon
>     entreprise ». Les six écritures de `MonEntreprise.js` (un lieu, un
>     signe, un sous-traitant, enregistrés ou retirés) font désormais
>     remonter la NOUVELLE liste à la saisie, avant la relecture.
> - **D'autres corrections de la relecture, dans le même commit** :
>   - l'aide de la liste (A.3) : « Cochez ce que ce devis comporte dans un
>     logement, même fait par un sous-traitant, même une petite partie : un
>     doublage isolé, une VMC, une fenêtre. Les deux dernières lignes sont
>     comptées par prudence. Dans le doute, cochez : c’est le cas le plus
>     sûr. » (DROIT6-11 : le cahier disait « ce que vous ferez ») ;
>   - l'aide de la case « Je ne détiens pas de label RGE pour ces travaux »
>     (A.3) gagne une seconde phrase, « Ce que cela change pour ses aides,
>     Opus ne l’écrit pas encore. », et, sous « Non » d'un sous-traitant, un
>     texte que A.5 n'a pas (`nonAide`) : « Le devis le dira à votre client.
>     Ce que cela change pour ses aides, Opus ne l’écrit pas encore. »
>     (DROIT6-8) ;
>   - la phrase de `emetteur_label_complet_check` (A.7) finit par « … : c’est
>     ce qu’Opus range pour vos devis. Le numéro du certificat, lui, est
>     facultatif. » (DROIT6-7 : « c’est ce que le devis doit porter » disait
>     un choix d'Opus comme une obligation) ;
>   - les textes légaux (§4) : « Vos documents professionnels » dit en deux
>     phrases la finalité des pièces du profil (le badge, une demande
>     d'ouverture de compte professionnel) et celle des pièces de « Mon
>     entreprise » (accompagner les devis) (DROIT6-4) ; la phrase sur les
>     sous-traitants de « Les clients que vous enregistrez » a deux formes,
>     une par branche, et dit elle-même ce qui vaut (DROIT6-11) ;
>     `VERSION = '2026-11-24'` ;
>   - les cases « Je ne détiens pas… » portent chacune leur nom pour
>     VoiceOver (« … — <le travail> », ÉCRAN-2) ; un intitulé tapé passe par
>     une fonction de remplacement, jamais par la chaîne de `replace`
>     (ÉCRAN-3).
> - **Les décisions du propriétaire du 24/11 après la relecture (commit
>   `b919d13`), telles qu'elles sont dans le code** :
>   - sous « Aucun de ces travaux » (A.3, DROIT6-3) : « Même alors, si une
>     autre entreprise fait une partie de travaux d’économies d’énergie ou
>     d’énergie renouvelable de ce devis, écrivez-le sur le devis, par
>     exemple dans une réserve : la loi peut le demander. » ;
>   - la seconde phrase de l'avis du label (A.6, DROIT6-6) : « Si ce devis
>     est signé, ou ses travaux réalisés, après cette date sans que vous
>     l’ayez renouvelé, votre client peut perdre des aides : renouvelez-le à
>     temps. » La règle qui le fait sonner (`finDuLabel`) ne change pas ;
>   - une clé de plus à A.5, `retirerCoute` des signes de qualité (ÉCRAN-6),
>     au second appui de « Retirer ce signe de qualité », à l'écran et dans le
>     nom du bouton : « Les brouillons dont il était le seul à porter des
>     travaux pourront vous redemander si vous détenez un label pour ces
>     travaux. » — **« pourront »**, décidé le 24/11 au soir après l'épreuve
>     ÉPR-1 (commit `e1338f0`) ; la version de `b919d13` disait « vous
>     redemanderont », fausse pour un brouillon qui portait déjà « Je ne
>     détiens pas de label » pour ce travail, ou dont le client commande pour
>     son entreprise ;
>   - la carte « Énergie et label RGE », qui n'a aucun champ à taper, dit au
>     repos **« Chaque choix s’enregistre aussitôt. »** (ÉCRAN-4,
>     `CARTE_AU_REPOS_SANS_CHAMP`) ; « Conditions » et « Déchets » gardent
>     « Chaque champ s’enregistre quand vous le quittez. » ;
>   - **« N travaux couverts »** (ÉCRAN-7, réponse « 3 travaux couverts ») :
>     la rangée d'un signe dans « Mon entreprise » dit, sous l'intitulé,
>     « 1 travail couvert » ou « N travaux couverts »
>     (`travauxCouvertsDuLabel`), et rien pour une liste vide ou une clé
>     inconnue — une ligne que A.5 n'a pas.
> - **DROIT6-2 n'est pas construit** (« Plus tard ») : la phrase de
>   `devis_energie_mentions` (A.1) dit encore « la loi » pour le label du
>   photovoltaïque ou du désembouage quand la sous-traitance manque aussi.
> - **Des textes que A.5 n'écrit pas**, composés par la construction et figés
>   tels quels par `verifier-emetteur` : dix-sept, dans les deux objets
>   (« … n’ont pas pu être lus. Ce n’est pas que vous n’en avez aucun : … » en
>   édition, « Modifier … », « Modifier mes … », « Déclarer mes … »,
>   « … joint », « Voir le … », « Enregistrer … », les placeholders « Le nom
>   de l’entreprise » et « Quatorze chiffres », et « Les brouillons qui le
>   citent le perdront. » au retrait d'un sous-traitant) ; « Vous n’avez
>   encore aucun sous-traitant. » vient de A.3.
> - **Des écarts dits par la construction, où le code fait foi** : les
>   exemples des catégories commencent par une majuscule, et « (prudence) »
>   de leur colonne est une note du cahier, pas un texte affiché ;
>   `finDuLabel` rend `{ fin, intitule }` ; `sousTraitantsApresAppui` rend
>   `{ sousTraitants, plafond }` ; `validerSousTraitant` prend une option
>   `{ cleSiret }` ; un signe sans date est « expiré » (la base n'en range
>   aucun) ; `sousTraitantComplet` ne juge pas l'identité (la base la
>   garantit) ; le label et la sous-traitance ne se montrent qu'avec un
>   travail coché ; « Pour les droits de votre client » est écrit une fois,
>   avant la question ; les flèches « année » sont sur leur propre rangée ;
>   les travaux du cinquième devis de démonstration sont rangés dans l'ordre
>   du décret ; des fonctions que le cahier ne nomme pas
>   (`annonceDesTravaux`, `phraseDuTravail`, `introductionDeLEnergie`,
>   `declarationMontree`, `rubriqueDeLEnergieDuPoint`,
>   `GABARITS_DE_L_ENERGIE`) ; trois gardes « certifi » de `verifier-legal` et
>   de `verifier-tva` récrites pour permettre « certificat(s) », et rien
>   d'autre ; le cas 23 de l'essai 49-conditions ne porte pas
>   `cout_devis_centimes` (31 colonnes, à décider) ; les essais se jouent
>   depuis la RACINE du dépôt ; `verifier-devis` compte 708 vérifications,
>   `verifier-emetteur` 351, `verifier-legal` 291 ; `generer-cas-remise`
>   237 cas ; l'essai 46 rend 45 erreurs, le 49-remise 53 et 472 valeurs ;
>   `mesure-devis` 1 157 mesures au passage complet de la construction.
> - **Sa migration (§6)** : le texte complet faisait 60 728 octets, 61 185
>   sous forme gardée en un bloc, au-dessus du plus gros envoi déjà passé
>   (60 145) ; elle est partie en DEUX parties gardées, la seconde
>   commençant par une garde d'ordre qui refuse tout si la première manque.
>   Les verrous diffèrent : une écriture de fiche pro bloque la partie 1 ;
>   une lecture ou une écriture de devis, la partie 2. Elle est appliquée
>   depuis le 24/11/2026 à 21 h 40 et 21 h 44 (heure de Paris), et **l'appel
>   MAINTAIN n'a pas été nécessaire** (`*_maintain_a_retirer = f`).
> - **Son essai sur la vraie base (§7)** : « puis une date passée » — avec
>   une déclaration posée juste avant pour le même travail, le point NE
>   revient PAS : la déclaration reprend effet (49.4 septies, le cas rare
>   écrit et voulu) ; l'essai a ajouté un pas. Et le SIRET « 000 480 090
>   00013 » qu'il impose n'est aucun des deux SIRET fictifs qu'il impose
>   aussi (ses chiffres font `00048009000013`) : cherché dans le répertoire
>   Sirene avant l'envoi, 0 résultat.
> - **« Pour le propriétaire aujourd'hui »** (§0, §1.4) : ses trois
>   brouillons ont bien gagné le point « Par prudence » (relevé : 3 avant,
>   3 après).
> - **Les fichiers qu'il cite** (`lot2b6/comprendre/…`, `lot2b6/critique/…`,
>   `lot2b6/essai-v2/…`, le dossier de travail qu'il nomme) et les noms des
>   constats de ses critiques (`DROIT-…`, `BASE-…`, `ÉCRAN-…`, `CTL-…`)
>   étaient des documents de travail de la session : ils ne sont pas dans le
>   dépôt. Ses numéros de ligne datent de `c753b2a`.
> - **Vérifié avant la copie** : il ne contient aucune donnée personnelle du
>   propriétaire (ni nom, ni SIREN, ni numéro de TVA, ni adresse e-mail), et
>   aucune barre oblique inverse ni caractère invisible ; rien n'a donc été
>   remplacé.

---

# Étape 2b-6 du module devis — le label RGE — cahier v2 (24/11/2026)

Écrit le 24/11/2026 sur `HEAD c753b2a` (`supabase/schema.sql` md5
`0a9599698954c1cbdc99abcdf88d28c1`, 18 617 lignes, inchangé depuis le v1),
après le cahier v1 (23/11) et ses quatre critiques adverses (droit, base,
écran, contrôles), chacune contre-examinée par un contradicteur
(`lot2b6/critique/`, huit rapports lus en entier). **66 constats, aucun
réfuté, aucun bloquant** ; ce qu'ils changent est dit à l'annexe C, constat
par constat. **Rien du dépôt n'a été modifié.** Une base PostgreSQL 16
locale, `cahier_2b6_v2`, a servi à rejouer le rang 14 tel que ce v2
l'écrit (§2.9, annexe B.3), puis a été supprimée (vérifiée absente).

Étiquettes : **ÉTABLI** (lu à la ligne, ou mesuré), **DÉDUIT**,
**À VÉRIFIER**, **(J)** au juriste, **(P)** au propriétaire. Une décision du
propriétaire écrite ici ne se discute plus ; un choix technique (T) se
défend.

> ### Ce qui change depuis le v1
>
> 1. **La déclaration « je ne détiens pas de label » devient une LISTE de
>    travaux**, `devis.energie_sans_label text[]`, et non plus un booléen.
>    Le booléen s'étendait tout seul : à un travail ajouté après coup, à un
>    label expiré, à un label retiré (BASE-1, ÉCRAN-1, mesuré trois fois).
>    Une case par travail non couvert, qui nomme ce travail ; une
>    catégorie n'est « dite sans label » que si l'artisan l'a cochée.
> 2. **Quatre états par travail coché**, et non deux : couvert ; porté par
>    un label valable SANS certificat (la déclaration n'éteint plus le
>    point : DROIT-1, BASE-2, ÉCRAN-2, mesuré) ; porté par un label
>    expiré (la déclaration reste possible) ; porté par aucun label.
> 3. **Les deux lignes de prudence parlent « Par prudence »**, même à
>    titre privé, quand ce sont elles seules qui manquent (DROIT-2,
>    mesuré).
> 4. **Les mots de la liste suivent le décret** : le 3° et le 4° (bois),
>    le 7°, le 11°, le 17° (« offre globale »), et le désembouage
>    remplace « entretien d'un chauffage », avec sa clé (`desembouage`)
>    (DROIT-3, 4, 5, 14) ; les exemples quittent les libellés (ÉCRAN-8).
>    Les dix-neuf clés vivent dans un fichier de données pur,
>    `src/data/travaux-energie.js` (CTL-9).
> 5. **La sous-traitance vise le contrat entier** (« des travaux de ce
>    devis », DROIT-7), et les trois phrases du point tiennent sous
>    200 caractères (188, 187, 194, mesuré).
> 6. **« Aucun de ces travaux » passe EN TÊTE**, sous la question, avant
>    les dix-neuf cases (ÉCRAN-3 : elles font au moins 908 points).
> 7. **Le câblage est écrit** (§3.7 bis) : `recevoirEmetteur` et
>    `surEmetteur` prennent un objet, sinon la liste des labels resterait
>    l'ANCIENNE après un passage par « Mon entreprise » (ÉCRAN-4).
> 8. **Les questions au propriétaire passent de huit à QUATRE** (§1.3) :
>    où vit la déclaration (DROIT-12), la liste (P9, DROIT-2, 3, 6), le
>    justificatif d'un sous-traitant (P4, DROIT-11, CTL-13), les deux
>    phrases qui engagent (P6, P7, DROIT-9, DROIT-16). Les autres (P2, P5,
>    P8, P10) sont tranchées ici, et dites (§1.2).
> 9. **Le rang 14 est réécrit et rejoué** : 58 cas justes sur 58, et cinq
>    sabotages qui rougissent exactement là où on les attend (§2.9).
> 10. **Les contrôles gagnent ce qui les rendait aveugles** : les listes de
>     FICHIERS (CTL-3), des propriétés « tables de la section 46 » (CTL-11),
>     la forme des contraintes de la section 46 (CTL-7), la garde du badge
>     côté JavaScript (CTL-5), les gardes du générateur de 2b-4 et 2b-5
>     (CTL-2), un SIRET de démonstration à cinq zéros (CTL-4).

## Les réponses du propriétaire (23/11/2026) — elles font foi

| question | réponse, mot pour mot | ce qu'elle construit |
|---|---|---|
| Q5 (posée avec 2b-4, tranchée le 23/11) | « Deux questions par devis » | une question sur les travaux et une sur la sous-traitance, montrées seulement pour un client qui commande à titre privé, pour une association, une copropriété ou une société civile, et, par prudence, quand « À quel titre ? » est vide ; le label de l'artisan rangé UNE fois dans « Mon entreprise » (ses catégories, son justificatif dans `documents`, sa date de fin) ; jamais le badge public `rge`, ni `rge_declare`, `rge_expire`, `rge_url`, `rge_numero` ; un point au rang 14 de `motifs_refus_remise` ; la garde : jamais le RGE comme condition d'un taux de TVA |
| P1 (le soir) | « Une liste à cocher » | la question des travaux est une LISTE fermée de catégories, en mots d'artisan, plus « Aucun de ces travaux » (exclusive) ; le label de « Mon entreprise » porte ses catégories, avec les MÊMES clés. La composition exacte de la liste reste une question : P12 (§1.3) |
| P3 (le soir) | « Rangés une fois » | une liste « Mes sous-traitants » dans « Mon entreprise » (identité, SIRET, label ou non et pour quels travaux), cochée sur le devis comme les lieux de dépôt : un `uuid[]` SANS clé étrangère, filtré par `pro_id`, jamais un lien vers un compte Opus, jamais `professional_partners` |

**Le « oui ou non » de Q5 est rouvert, et posé** (P11) : Q5 le rangeait
« une fois dans « Mon entreprise » » ; ce v2 recommande de le dire PAR
DEVIS, travail par travail, parce que la loi le veut par contrat et que la
forme « une fois » transforme un label oublié en « ne détient pas »
imprimé (DROIT-12, BASE-1). Une décision écrite ne se change pas sans
demander.

Donc, partout dans ce cahier, si les quatre recommandations sont
retenues : **deux tables privées** nouvelles en section 46, **quatre
colonnes** sur `devis` (49.4 septies), **trois contraintes** nouvelles sur
`devis` (29 contraintes `check` sur la table au lieu de 26), **neuf** sur
les deux tables, **trois clés** au rang 14 (`CONTRAT_B2` 19 → 22 clés,
13 → 14 rangs), **dix-neuf catégories**, **aucune** fonction
`security definer`, **aucun** code `OP` (`OP028` reste libre), **aucun**
module natif, **aucun** rattrapage de données. Ce que change chaque autre
réponse est écrit sous sa question.

## Les réponses du propriétaire (24/11/2026) — elles font foi

Posées le 24/11 avec les mots du §1.3, en plus court. Les QUATRE
recommandations sont retenues : tout ce que ce cahier écrit « si les quatre
recommandations sont retenues » vaut ; les variantes écartées (P11 = 2,
P12 = 2 ou 3, P13 = 2, P14 = 2 ou 3) ne se construisent PAS.

| question | réponse, mot pour mot | ce qu'elle construit |
|---|---|---|
| P11 — « Je n'ai pas de label pour ces travaux » : où le dire ? | « Sur chaque devis » | `devis.energie_sans_label text[]`, une case par travail coché que ses labels ne couvrent pas ; aucune colonne sur `emetteur` |
| P12 — la liste des travaux | « Les 17, plus ces 2 » | dix-neuf clés : les dix-sept du décret, `photovoltaique` et `desembouage`, ces deux-là « Par prudence » quand elles seules manquent ; la phrase sous « Aucun de ces travaux » sur la sous-traitance d'AUTRES travaux d'économies d'énergie |
| P13 — le justificatif d'un sous-traitant | « Oui, dans Opus » | la colonne du justificatif sur `emetteur_sous_traitants`, dans `documents`, exigée pour qu'un sous-traitant qui a un label soit complet ; les textes et le formulaire disent que l'administration le lit et qu'il reste jusqu'à la suppression du compte |
| P14 — deux phrases qui engagent | « Les deux » | la phrase de l'amende dans la carte (et celle, sans montant, de la sous-traitance), et la phrase des conditions d'utilisation, toutes deux telles que §1.3 les écrit (la question posée disait « une amende » : le texte construit est celui du cahier, « une amende administrative ») |

---

## 0. En une page

**Ce que la loi demande** (C. conso. L. 224-114, L. 224-115, L. 242-51 ;
décret n° 2014-812 ; ÉTABLI, inchangés au 23/11/2026,
`comprendre/droit.md` §2) : quand un professionnel propose à un
**consommateur** des travaux « afférents à des logements en vue de la
réalisation d'économies d'énergie ou de la production d'énergie
renouvelable et pour lesquels l'octroi d'aides financières est subordonné
à la détention d'un label ou d'un signe de qualité », le contrat dit :

1. **s'il détient ou non** un signe de qualité, « pour les catégories de
   travaux concernés », avec le justificatif, annexé au contrat et fourni
   avant la signature ;
2. s'il n'en détient pas, **les conséquences** sur les aides auxquelles le
   client peut prétendre ;
3. **s'il fait réaliser une partie ou la totalité** de l'exécution du
   contrat par un sous-traitant : l'identité de chacun, et son signe de
   qualité quand une aide en exige un. Cette obligation-là ne pose pas la
   condition d'aide (`conso-L224-115.txt:5`, ÉTABLI) : son champ est plus
   large que le label (P12).

Sans ces informations, le contrat conclu avec un consommateur est **nul**
(les deux articles, `conso-L242-51.txt:9`) ; pour la première, l'entreprise
s'expose en plus à une **amende administrative** jusqu'à 15 000 € (personne
physique) ou 75 000 € (personne morale). La loi ne vise ni une entreprise,
ni, par la lettre, une association, une copropriété ou une société civile
(Opus les traite par prudence, comme depuis 2b-2, et le DIT : DROIT-9).

**Ce que 2b-6 construit** :

| où | quoi |
|---|---|
| « Mon entreprise » | deux sections nouvelles après « Vos lieux de dépôt des déchets » : « Vos signes de qualité (label RGE) » (organisme, intitulé, numéro facultatif, travaux couverts, date de fin, certificat dans `documents`) et « Vos sous-traitants » (nom ou raison sociale, SIRET, label ou non, travaux couverts, date, justificatif) ; chacune sa liste et son formulaire plein écran |
| la base | deux tables privées, `emetteur_labels` (46.2 ter) et `emetteur_sous_traitants` (46.2 quater) ; quatre colonnes sur `devis`, nullables, sans défaut ; trois contraintes ; un rang 14 dans `motifs_refus_remise`, trois clés, une au plus par devis ; deux clés de plus dans l'export |
| la saisie | une rangée « Énergie (label RGE) » entre « Déchets » et « Conditions », qui ne saute jamais, et qui ouvre une carte plein écran : « Aucun de ces travaux » en tête, puis les travaux, puis le label travail par travail, puis la sous-traitance |
| « Pour le remettre » | un point au rang 14, une clé au plus, un bouton qui ouvre la carte ; un avis jumeau de celui de l'attestation décennale quand un label finit avant la fin de validité du devis |

**Ce que 2b-6 ne construit pas** : rien n'est imprimé, numéroté ni remis
(2c), ni la phrase des conséquences (une exception à la doctrine « Opus ne
compose aucune conclusion de droit », à décider avant 2c : §8), ni
l'annexe du justificatif ; ni la certification « entreprise principale »
de 2027 (il faudra une colonne de nature), ni l'« attestation chantier » ;
aucune lecture de l'annuaire RGE de l'ADEME ; le badge public
« Certification RGE » n'est pas touché ; rien sur la prospection
(L. 223-8) ni sur la publicité (L. 122-26) (§8).

**Pour le propriétaire aujourd'hui** (DÉDUIT de la règle, À VÉRIFIER par la
forme avant de le lui écrire) : ses trois brouillons gagneront le point
« Par prudence » (la question des travaux naît vide) ; un appui sur « Aucun
de ces travaux », maintenant en tête de la carte, l'éteint, devis par
devis.

---

## 1. Les décisions, et ce qui reste à demander

### 1.1 Déjà décidé (ÉTABLI)

- **Q5, P1, P3 (23/11)** : le tableau ci-dessus.
- **Accélérer (08/11)** : une relecture adverse unique ; seul un défaut qui
  perd des données, affiche quelque chose de faux ou touche à la sécurité
  relance un tour ; le reste va dans `docs/A-FAIRE.md`.
- **Sept règles d'Opus** ; 2b-6 n'en crée aucune : les trois clés du rang 14
  sont « La loi » ou « Par prudence ».
- **« Opus propose, l'artisan confirme »** : rien n'est coché, choisi ni
  rempli sans un appui — ni une catégorie de travaux (pas d'après le métier,
  ni les lignes, ni la base de postes, ni l'origine du devis, ni son objet :
  D4-c), ni la déclaration, ni un sous-traitant (même s'il n'y en a qu'un),
  ni la réponse à la sous-traitance.
- **Une déclaration ne vaut que pour ce qu'elle nomme** : la leçon de
  `pour_qui_client` (2b-2), étendue à la déclaration (BASE-1).
- **Un fait de 2b naît vide** ; le vide vaut le cas le plus protecteur ;
  aucune contrainte ne lie deux faits.
- **Jamais de tableau vide en base** (la leçon de 2b-5) ; « rien de dit »
  s'écrit vide de valeur ; « aucun de ces travaux » est une valeur à elle.
- **Une phrase de motif fait au plus 200 caractères**, et une prudence qui
  cite la loi dit « Opus ne sait pas encore » (`verifier-devis.mjs:11764-11772`,
  `:9110`, ÉTABLI).
- **Rang 14 pour 2b-6 ; `OP028` libre.**

### 1.2 Ce que ce cahier tranche lui-même (choix techniques)

Les numéros du v1 sont gardés ; une décision changée dit « (v2) ».

| n° | décision | raison |
|---|---|---|
| T1 | **Le label vit dans une table privée de la section 46, `emetteur_labels` (46.2 ter)**, une ligne par signe de qualité ; préfixe des contraintes `emetteur_label_` ; jamais une colonne de `professional_profiles` ni d'`emetteur` | une entreprise peut détenir deux signes chez deux organismes, avec deux dates de fin (`droit.md` §4.b) ; ce qui peut un jour devenir public PAR LIGNE ne vit pas dans `emetteur`. Le nom ne contient pas le mot `emetteur` : il entre en le décidant dans les listes du §2.8 |
| T2 (v2) | **« Je ne détiens pas de label » est une LISTE de clés PAR DEVIS** (`devis.energie_sans_label text[]`), si P11 = 1. Elle ne compte que pour un travail coché qui n'est couvert par aucun label ET qui n'est porté par aucun label valable sans certificat. Aucune colonne sur `emetteur`, rien dans `emetteur_incomplet()` | la loi parle des « catégories de travaux concernés » par CE contrat ; une liste dit exactement ce que 2c imprimera ; un booléen s'étendait sans un appui (BASE-1, mesuré : P1b, P1c, P1d, E3). Sous P11 = 2, voir P11 |
| T3 (v2) | **Les quatre colonnes de `devis`** (49.4 septies), nullables, sans défaut, dans les deux `grant` de 49.7 à la suite des colonnes des déchets : `energie_travaux text[]`, `energie_sans_label text[]`, `energie_sous_traitance boolean`, `energie_sous_traitants uuid[]` ; côté JavaScript `energieTravaux`, `energieSansLabel`, `energieSousTraitance`, `energieSousTraitants`. Aucun nom ne contient `rge` | « RGE » est une appellation, pas une donnée ; mesuré : aucune colonne ni constante du dépôt ne commence par `energie` |
| T4 | **Le vide de la question des travaux est un motif « Par prudence »** (`devis_energie`) ; jamais une catégorie déduite | conception de 2b-4 §8.2 et Q5 ; chaque brouillon neuf gagne un point (« 6 points » devient « 7 points » dans `mesure-devis`), les trois brouillons du propriétaire aussi |
| T5 (v2) | **Le rang 14 a TROIS clés, une au plus**, dans cet ordre : `devis_energie` (prudence : la liste est vide) ; puis, si une rubrique manque, `devis_energie_mentions` (la loi) ou `devis_energie_mentions_prudence` (prudence). **La loi** : le client commande à titre privé ET ce qui manque touche un travail du décret (1° à 17°) ou la sous-traitance. **Par prudence** : une association, une copropriété, une société civile, une réponse « à quel titre » vide, OU, à titre privé, quand seules les deux lignes de prudence manquent de label. **Une rubrique manque** quand un travail coché n'est pas couvert et n'est pas déclaré ; quand il est porté par un label valable sans certificat (déclaré ou non) ; quand la sous-traitance est sans réponse ; quand elle est « Oui » et qu'aucun sous-traitant choisi n'existe chez l'entreprise, ou qu'un des choisis est incomplet. **Rien** sous « Aucun de ces travaux » ni pour les deux réponses « entreprise » | `verifier-devis` lit UNE nature par clé dans le corps : la nature se choisit par la clé. La règle des trois natures (`devis.js:3942-3943`) veut « Par prudence » quand Opus ne sait pas si le travail est visé (DROIT-2, mesuré : X et Y) ; la sous-traitance, elle, n'a pas la condition d'aide, d'où « La loi » même pour le photovoltaïque (DÉDUIT). 22 clés, 14 rangs, 513 motifs au plus |
| T6 | **Qui voit la question, et quand le rang 14 parle** : `v_valable is null or v_valable in ('consommateur', 'non_professionnel')`, jamais `not in (…)` | L. 224-114 vit dans la section 21 du chapitre IV ; L. 221-3 n'étend aux petites entreprises hors de leur activité principale que les sections 2, 3 et 6 (`conso-L221-3.txt:5`, ÉTABLI) : les deux réponses « entreprise » sortent. Une réponse cachée garde sa valeur, sans effet. **Et l'aide de « À quel titre ? » le dit** (T27) |
| T7 (v2) | **La date de fin d'un label est OBLIGATOIRE** (`emetteur_label_complet_check`). Un label couvre un travail quand il le porte, que son certificat est joint (chemin écrit, après le rognage du déclencheur) et que sa date de fin est au moins le jour de PARIS. L'écran juge au jour du téléphone (les deux horloges connues, 2b-4 M1) | une qualification a une « date d'échéance de la période de qualification » (`arrete-2015-12-01-complet.txt:169`) ; les certifications aussi (`:649` pour le 17°, `:902`), ÉTABLI ; aucune durée n'est fixée pour une qualification (`droit.md` §3.6, À VÉRIFIER). L'aide du champ dit quoi faire sans date lisible (A.5). La citation du v1 (`:649` seul) visait la certification du 17° (DROIT-15) |
| T8 | **Une carte à part**, « Énergie et label RGE », ouverte par sa propre rangée ; « Le chantier » ne bouge pas | dix-neuf cases, des déclarations, une question et une liste de sous-traitants ne tiennent pas dans une carte de pastilles |
| T9 | **La garde TVA est tenue par le CODE et par des contrôles** (§2.6) | Q5 |
| T10 (v2) | **Le vocabulaire** : « signe de qualité (label RGE) », « vous détenez », « vous déclarez » ; jamais « certifié », « agréé » (même pour nommer un organisme), « vérifié », « garanti », « Reconnu garant de l'environnement ». **La règle porte sur les CONSTANTES des textes de 2b-6** (le modèle `textesDechets`), pas sur les fichiers entiers : « certifi » en mot entier (jamais « certificat », « certification »), « agré » en racine, « garanti » en mot entier, la frontière de mot écrite pour les lettres accentuées (CTL-6) | L. 121-4 4° rend dangereux « agréé » dit d'un professionnel. La fiche publique garde son « Certification RGE » : deux vocabulaires coexisteront (T29) |
| T11 | **Le certificat de l'artisan** : dans `documents`, un seul niveau sous le dossier du compte, un nom de fichier propre qui n'est JAMAIS `rge` (CTL-5) ; aucune reprise du fichier du profil | un fichier de profil sert au badge |
| T12 (v2) | **« Pas encore vérifié »** : « le label RGE pour des travaux d'énergie » SORT ; entre « si les labels RGE déclarés, les vôtres et ceux de vos sous-traitants, existent, couvrent ces travaux et sont toujours en vigueur ». Toujours sept faits, trois copies | Opus constate une catégorie, un chemin et une date ; il ne vérifie ni l'existence, ni que le certificat nomme ces travaux, ni le retrait par l'organisme (DROIT-10). La raison du v1 (« la liste rend la couverture vérifiable ») était fausse |
| T13 | **L'export** : deux clés dans le second objet de `mes_donnees()`, `mes_signes_de_qualite` et `mes_sous_traitants`, triées `created_at, id` ; les quatre colonnes voyagent avec `devis_emis` | le modèle de `mes_lieux_de_depot` |
| T14 (v2) | **La démonstration** (§3.9) : « Muret de clôture » et « Terrasse en bois » répondent « Aucun de ces travaux » ; « Sol du séjour » reste vide (`devis_energie`) ; « Rénovation salle de bains » coche la ventilation, non couverte (`devis_energie_mentions_prudence`, sa réponse « à quel titre » étant vide) ; un **cinquième devis**, « Isolation des combles et des murs », à titre privé, complet aux rangs 1 à 13 : `devis_energie_mentions` et l'avis du label. Les labels et les sous-traitants de démonstration vivent DANS la fiche, comme les lieux (ÉCRAN-9). La fiche n° 1 garde son badge `rge` | chaque clé doit vivre sans `.env` ; c'est aussi la condition des mesures des quatre états (ÉCRAN-5) |
| T15 | **La classe de blancs n'est pas consolidée** : quatre copies de plus, en `chr(n)`, EN LIGNE : **seize copies dans huit fonctions**. Et une PETITE classe (`chr(32)`, `chr(9)`, `chr(13)`, `chr(10)`) pour les deux chemins, sur le modèle de `tient_l_assurance()` (BASE-6) | le choix de 2b-5 ; consolider réécrirait cinq fonctions de quatre lots finis, et c'est une refonte (tranché ici : P8 du v1, voir plus bas). À vérifier à la construction : que le §17 de `verifier-devis` reconnaît la petite classe (le précédent du code postal des lieux) |
| T16 | **Aucune fonction `security definer`, aucun code `OP`, aucun module natif** | les listes fermées 31 / 32 des essais ne bougent pas |
| T17 (v2) | **La migration** : le modèle de 2b-5 (§6) ; **les verrous sont MESURÉS** (BASE-12) : ACCESS EXCLUSIVE sur `devis`, qui bloque aussi les LECTURES (« Mes devis » attend), SHARE ROW EXCLUSIVE sur `professional_profiles`, ACCESS SHARE sur environ 35 tables (`mes_donnees()`) : Opus fermé | `critique/base-essais/verrous.sql`, rejoué par la contradiction |
| T18 (v2) | **Dix-neuf clés, plus `aucun`** ; `fenetres` pas `menuiseries` (une sorte de déchets) ; **`desembouage` pas `entretien_chauffage`** (une clé ne dit pas autre chose que sa ligne : DROIT-3) | deux sens pour une même clé tromperaient tout `grep` et tout contrôle |
| T19 | **Le SIRET d'un sous-traitant est obligatoire** (14 chiffres), nettoyé par le déclencheur ; l'écran refuse en plus une clé fausse (`cleSiretValide`), la base non (l'exception de La Poste). Tranché ici (P10 du v1) | la seule identité que les textes nomment (le modèle des certificats d'économies d'énergie) ; un sous-traitant d'un autre pays de l'Union, sans SIRET, ne peut pas être rangé : à `docs/A-FAIRE.md` et J39 (c) |
| T20 (v2) | **Un sous-traitant est COMPLET** quand son identité est écrite et que la question de son label a une réponse : « Non », ou « Oui » avec des travaux couverts, une date de fin au moins égale au jour de Paris et son justificatif joint (si P13 = 1). **TOUS les choisis doivent être complets.** La date se juge `(fin >= jour) is not true`, jamais `fin < jour` : une date vide ne doit jamais compter « valable » (CTL-7, mesuré) | L. 224-115 II nomme « ces sous-traitants », chacun |
| T21 | **Le rang 14 ne demande pas qu'un sous-traitant couvre les travaux du devis** ; il demande qu'on sache s'il a un label, et lequel. Les mots `label_categories`, `raison_sociale`, `siret`, `organisme`, `intitule`, `reference` entrent dans les mots interdits du cas 14 c, en le décidant (BASE-10) | Opus ne sait pas qui fait quoi ; J39 (a) |
| T22 (v2) | **Les lectures du rang 14** : UNE mention de chaque table nouvelle (une jointure groupée pour les labels, qui rend les quatre états d'un coup), colonnes nommées, filtrée `pro_id = v_pro`, faite seulement quand le rang peut parler ; les sous-traitants DISTINCTS ; un identifiant orphelin ou d'une autre entreprise ne compte jamais | la barrière que 2c gardera quand la remise appellera la liste depuis une fonction `security definer` (mesuré : la contre-épreuve) |
| T23 | **Aucune paire d'écriture** (`PAIRES_DEVIS`) pour l'énergie : « Aucun de ces travaux » ne vide ni les déclarations ni les sous-traitants ; décocher un travail ne retire pas sa clé de la liste des déclarations ; « Non » à la sous-traitance ne vide pas les sous-traitants choisis ; tout reste gardé, sans effet | rien ne s'efface sans le doigt de l'artisan sur CETTE rubrique (ÉCRAN-1 : la paire proposée est écartée) |
| T24 (v2) | **Les deux listes de « Mon entreprise » arrivent par la lecture unique** et par la remontée de « Mon entreprise » (§3.7 bis) ; une table absente rend `null`, jamais `[]` ; quatre états par `etatDesLieux(etatRegime, liste)`, qui dépend AUSSI du régime (c'est lui qui dit « échec ») : elle n'est juste que si les deux listes voyagent avec le régime | ÉCRAN-10 : la phrase du v1 (« elle ne dépend que de la liste ») était fausse |
| T25 | **La rangée a huit résumés × trois états = 24 gabarits**, et ne saute jamais (A.4) | la règle « garder la grande place » ; le plus long fait 53 caractères, moins que ceux des déchets (57) |
| T26 (v2) | **Une seule fonction rend l'état d'un travail** : `etatsDesTravaux(devis, labels, { proId, jour })` (couvert, sans certificat, expiré, absent, avec l'intitulé et la fin), lue par le miroir, la rangée, la carte et l'avis. Et `etatDuLabel` (`emetteur.js`), qui dit l'état d'une LIGNE dans « Mon entreprise », est faite tourner d'accord avec elle sur un même jeu (CTL-8) | le modèle de `rubriquesDesDechets` ; le défaut E1 de 2b-3 (une rangée « Valable » sous un point qui demande le certificat) |
| T27 (nouveau) | **Les aides de « À quel titre ? » changent** : sous « À titre privé, pour lui-même », « Y compris un artisan ou un commerçant pour son propre logement. » (DROIT-19) ; sous la petite entreprise, « … les mentions dues à un particulier, sauf celles du label RGE, que la loi ne lui étend pas. » (DROIT-8). La copie de `verifier-devis:11450` suit ; le bloc « À quel titre ? » est remesuré | sans cela, l'écran dirait « toutes les mentions », faux dès 2b-6, et un contrôle le protégerait (mesuré : cas Z, rien au rang 14) |
| T28 (nouveau) | **Les clés vivent dans `src/data/travaux-energie.js`**, qui n'importe rien : `TRAVAUX_ENERGIE` (clé, libellé, exemples, aide, numéro du décret, domaine de l'ADEME, prudence), importé par `devis.js` et `emetteur.js`. Les deux gardes d'import se récrivent EN LE DÉCIDANT (`devis.js` passe à six importations, un `permis` de plus pour `emetteur.js`) | `devis.js` et `emetteur.js` ne s'importent pas (CTL-9) ; la règle « une seule source » du catalogue des métiers |
| T29 (nouveau) | **La « Certification RGE » de « Modifier mon profil » reste à part**, et une phrase de la section des signes de qualité le dit : « rien ne s’affiche sur votre fiche publique ». Tranché ici (P5 du v1) | ne rien toucher au badge (Q5) ; ses quatre défauts connus et les trois fiches de l'ancienne démonstration sont dits au propriétaire (§1.4) |
| T30 (nouveau) | **Le calendrier gagne deux flèches « année »**, de 44 points, derrière une prop (`annees`), pour les deux formulaires nouveaux seulement ; le calcul dans `formats.js`, que `verifier-annonces` fait tourner | une date de fin à quatre ans demandait une quarantaine d'appuis (ÉCRAN-6) ; des pastilles « dans 1 an » ressembleraient à un choix |
| T31 (nouveau) | **L'avis du label suit l'écran** (le modèle de l'attestation, jamais la liste sûre), avec la réponse `pourQuiValable` de l'écran ; la fin qui parle est le MINIMUM, sur les travaux cochés, de la fin la plus TARDIVE qui couvre chacun ; l'intitulé nommé est celui de ce label | ÉCRAN-7 : le v1 se contredisait, et « la plus proche » faisait sonner un avis faux quand deux labels couvrent le même travail |

**Les questions du v1 tranchées ici** (pour ne pas en poser plus de
quatre) :

| v1 | ce qui est décidé | pourquoi |
|---|---|---|
| P2 (les mots de la sous-traitance) | « Une autre entreprise fera-t-elle une partie, ou la totalité, des travaux de ce devis ? » | la loi dit « partiellement ou totalement l'exécution du contrat » (DROIT-7) : seuls les mots changent |
| P5 (le badge du profil) | T29 | Q5 interdit déjà de le lire ; le toucher est hors de 2b-6 |
| P8 (les espaces invisibles) | T15 : quatre copies maintenant ; un regroupement plus tard, dans un lot à part, avec son accord | le choix de 2b-5 ; une refonte se demande à part |
| P10 (le SIRET d'un sous-traitant) | T19 : obligatoire | la seule identité que les textes nomment |
| P4, P6, P7, P9 | devenues P13, P14 et P12, avec les corrections des critiques | elles changent ce que l'artisan fait ou ce qu'Opus écrit dans un texte qui engage |

### 1.3 Les questions au propriétaire — quatre

Elles comptent avant de construire : chacune change la base, ce que
l'artisan fait sur ses devis, ou un texte qui engage. La réponse
recommandée vient en premier.

**P11 — « Je n’ai pas de label pour ces travaux » : où le dire ?**

> Quand un devis porte sur de l’isolation, une pompe à chaleur, une
> fenêtre…, la loi demande de dire au client, sur ce devis, si vous avez
> un label RGE pour CES travaux-là. Si vous en avez un, vous le rangez une
> fois dans « Mon entreprise », et Opus le retrouve tout seul. La question
> porte sur l’autre cas : quand vous n’en avez pas.

1. **Sur chaque devis, travail par travail (recommandé).** Dans la carte
   « Énergie », sous chaque travail coché qu’aucun de vos labels ne
   couvre, une case : « Je ne détiens pas de label RGE pour ces travaux ».
   *Ce que ça change :* un appui de plus sur un devis concerné. Si vous
   cochez ensuite un autre travail, ou si un label expire ou disparaît de
   « Mon entreprise », Opus vous le redemande : rien n’est dit à votre
   place.
2. **Une fois pour toutes, dans « Mon entreprise »** : « Je n’ai pas de
   label pour : … » (une liste de travaux). *Ce que ça change :* rien à
   faire sur chaque devis ; mais un label oublié dans « Mon entreprise »
   deviendrait « ne détient pas de label » sur vos devis, et cette liste
   doit être tenue à jour à chaque nouveau label. Côté technique : une
   colonne de plus sur la fiche de votre entreprise, et la colonne
   `energie_sans_label` du devis ne naît pas.

C’est vous qui aviez dit, le 23/11, « dans « Mon entreprise », votre label
(oui ou non) ». La recommandation change la moitié « non » : la loi le
demande contrat par contrat, « pour les catégories de travaux concernés ».

**P12 — La liste des travaux à cocher.**

> La liste suit les dix-sept travaux du décret qui ouvrent les aides
> (isolation, chauffage, fenêtres, ventilation…). Deux travaux sont
> douteux : on ne sait pas si la loi les vise.

1. **Les dix-sept du décret, plus deux lignes « par prudence » : les
   panneaux solaires photovoltaïques, et le désembouage d’un chauffage
   central à eau (recommandé).** *Ce que ça change :* dix-neuf cases. Pour
   ces deux lignes seules, le point dit « Par prudence », jamais « La
   loi ». Le signe en cause pour le désembouage est une qualification
   d’entretien, pas un label RGE au sens strict : Opus le range quand même
   dans vos signes de qualité. Et sous « Aucun de ces travaux », une phrase
   dit que si une autre entreprise fait une partie d’AUTRES travaux
   d’économies d’énergie, il faut le dire au client (la loi est plus large
   pour la sous-traitance).
2. **Les dix-sept seulement.** *Ce que ça change :* un électricien qui pose
   des panneaux, ou un chauffagiste qui désembue, ne verra pas la question ;
   s’il fallait les dire, le contrat pourrait être nul.
3. **Les dix-neuf, plus trois lignes qui ne demandent QUE la
   sous-traitance** : « Calorifugeage d’un réseau de chauffage ou d’eau
   chaude », « Régulation ou robinets thermostatiques posés seuls »,
   « Raccordement à un réseau de chaleur ». *Ce que ça change :* vingt-deux
   cases ; ces trois lignes ne demandent jamais de label (aucune aide ne
   l’exige), seulement qui fera les travaux. Plus protecteur, plus long à
   lire.

*À savoir :* la liste vit dans la base. L’allonger plus tard demandera une
migration, comme pour les déchets.

**P13 — Le justificatif d’un sous-traitant, rangé dans Opus ?**

1. **Oui, dans votre espace privé, comme vos attestations (recommandé).**
   Il est alors exigé pour qu’un sous-traitant qui a un label soit
   « complet ». *Ce que ça change :* comme vos autres documents, il est
   lisible par l’administration d’Opus ; et il reste dans votre espace
   jusqu’à la suppression de votre compte, MÊME si vous retirez ce
   sous-traitant (Opus ne retire aucun fichier de votre espace privé). Les
   textes et le formulaire le diront.
2. **Non, pas avant que les devis puissent être envoyés** (étape 2c) : Opus
   note seulement s’il a un label, pour quels travaux et jusqu’à quand.
   *Ce que ça change :* la case « Joindre son justificatif » n’existe pas ;
   il faudra le joindre à la main en 2c. Côté technique : la colonne du
   justificatif ne naît pas maintenant.

**P14 — Deux phrases qui engagent, écrites par Opus.**

> (a) Dans la carte « Énergie » : « Pour un client qui commande à titre
> privé, sans ces informations, le contrat est nul, et votre entreprise
> s’expose à une amende administrative pouvant aller jusqu’à 15 000 €,
> 75 000 € pour une société. » (et, pour la sous-traitance : « Pour un
> client qui commande à titre privé, sans ces informations, le contrat est
> nul. »)
>
> (b) Dans les conditions d’utilisation, « Ce qui est interdit » : « Déclarer
> dans « Mon entreprise » un signe de qualité que son entreprise ne détient
> pas, ou pour des travaux qu’il ne couvre pas : le compte peut être
> fermé. » (sur le modèle de la phrase du numéro de TVA que vous avez
> choisie le 09/11 : elle dit ce qu’Opus peut faire, rien de ce qu’un juge
> déciderait).

1. **Les deux (recommandé).** *Ce que ça change :* la quatrième phrase
   d’Opus qui écrit « € » (après celles des déchets ; la phrase de la
   sous-traitance n’en a pas) ;
   la version des conditions d’utilisation change de toute façon.
2. **La phrase de la carte seulement.**
3. **Aucune** : la carte dit seulement ce que la loi demande.

### 1.4 À dire au propriétaire, pas à lui demander

- **Ses trois brouillons gagneront probablement le point « Par
  prudence »** : à relever par la FORME (combien ont une réponse « à quel
  titre » qui vise la loi, ou aucune) avant de le lui écrire. Un seul
  porte aujourd'hui « gratuit » (le geste de 2b-4) ; les deux autres
  attendent encore leur réponse.
- **Un client qui commande « pour son entreprise » ne verra pas la
  question** : la loi ne le vise pas. Un artisan ou un commerçant qui fait
  faire des travaux CHEZ LUI commande « à titre privé » : l'écran le dira
  désormais (T27).
- **Le certificat qu'il joint est lisible par l'administration d'Opus**,
  comme ses attestations (la politique « lecture des documents par l
  administration », `schema.sql:5432-5435`) ; les textes le diront aussi
  pour les certificats et les justificatifs.
- **Un sous-traitant est une autre entreprise** : son nom, son SIRET et son
  justificatif sont des données d'un tiers, que l'artisan range sous sa
  responsabilité (le modèle du carnet de clients) ; ils partent avec son
  compte, pas avec la fiche du sous-traitant.
- **La « Certification RGE » de « Modifier mon profil » ne bouge pas**
  (T29). À savoir : le badge a quatre défauts connus (il ne s'éteint ni au
  retrait, ni à la date passée, ni au remplacement de la pièce ; un pro
  vérifié n'est jamais revu), et **trois fiches de l'ancienne
  démonstration, dans la vraie base, affichent « Certification RGE » sans
  aucune pièce** (`comprendre/vraie-base.md`). Il a décidé le 26/10 de ne
  pas toucher à ces fiches ; on ne revient pas dessus, on le lui rappelle
  (DROIT-21). Hors de 2b-6, à `docs/A-FAIRE.md`.
- **Hors du devis, deux règles voisines** : la prospection par message pour
  des travaux d'énergie est interdite (L. 223-8, J46) ; la publicité de
  rénovation énergétique doit nommer France Rénov' (L. 122-26, J47). Opus
  ne fait ni l'une ni l'autre aujourd'hui.
- **Le 01/01/2027 (dans 38 jours)**, une entreprise qui fait réaliser des
  travaux aidés en sous-traitance devra elle-même détenir une
  certification « entreprise principale » ; elle se rangera dans ses
  signes de qualité, mais il faudra une colonne de NATURE (qualification,
  certification, entreprise principale), par une migration (DROIT-18) ; **le
  01/03/2027** naît l'« attestation chantier ». Rien n'est construit ici.
- **Si le frère fait des travaux d'énergie**, la question le concernera
  avant lui (À VÉRIFIER par la forme : les clés de métier de sa fiche,
  jamais un nom).

### 1.5 Au juriste (n'empêche pas de construire : rien ne sort avant 2c)

Les questions **J37 à J48** (cahier 2b-4 §1.5), telles que `droit.md` §7.1
les met à jour, restent ouvertes ; les plus déterminantes :

- **J37** le déclencheur : la catégorie de travaux, ou une aide envisagée ?
  Quelles aides comptent (décret n° 2014-812, fiches CEE, délibérations de
  l'Anah, obligation d'achat du photovoltaïque) ? Les parties communes d'un
  immeuble d'habitation sont-elles « afférentes à des logements » ?
- **J39** (a) hors d'une aide, l'identité seule des sous-traitants se
  dit-elle ? (b) une sous-traitance décidée APRÈS la signature rend-elle le
  contrat nul ? (c) raison sociale et SIRET suffisent-ils, et quelle
  identité pour un sous-traitant établi dans un autre pays de l'Union, sans
  SIRET ? **(d) la sous-traitance d'une partie qui n'est pas un travail
  d'énergie, dans un contrat qui en comporte (DROIT-7).**
- **J40** la nullité : relative ou absolue, restitutions, après les travaux.
- **J41** association, SCI, syndicat de copropriétaires ; l'entrepreneur
  individuel chez lui ; le bailleur personne physique.
- **J43** la phrase des conséquences ; « ne pourront pas ouvrir droit »
  quand le client n'y est pas éligible.
- **J44** l'obligation d'achat du photovoltaïque, une « aide financière » ?
- **J45** un justificatif d'organisme « conventionné et accrédité » ;
  l'attestation chantier de 2027.
- **J38, J42, J46, J47, J48** inchangées ; **J61 à J67** (`droit.md` §7.2) ;
  **J68 à J70** (complétude) ; **J71** (un artisan labellisé qui sous-traite
  la même catégorie à un non-labellisé).

Ce v2 en ajoute **quatre** (DROIT-22) :

- **J72** Le champ de L. 224-115 I (sans condition d'aide) : quels travaux
  « en vue de la réalisation d'économies d'énergie » hors du décret
  (calorifugeage, régulation posée seule, raccordement à un réseau de
  chaleur) ? L'audit énergétique de la prime est-il une prestation visée
  par L. 224-114 (décret n° 2022-780, absent de la copie) ? (DROIT-6, P12)
- **J73** Le 17° : un devis qui réunit plusieurs catégories, chacune
  réalisée par une entreprise qualifiée pour elle, doit-il dire quelque
  chose du signe « offre globale » ? (DROIT-5)
- **J74** Le désembouage : la qualification d'entretien exigée par la fiche
  BAR-SE-108 est-elle « un label ou un signe de qualité » au sens de
  L. 224-114 ? (DROIT-3, P12)
- **J75** La phrase des conséquences : Opus peut-il la composer, ou
  doit-elle être écrite par l'artisan, qui seul connaît la situation de
  son client ? (DROIT-13, avec J43)

---

## 2. La base

Tout ce qui suit a été joué sur une base PostgreSQL 16 neuve,
`cahier_2b6_v2` (`local-prelude.sql` puis `schema.sql`, 0 erreur), puis les
objets de 2b-6 tels qu'écrits ici (0 erreur), puis la base supprimée
(ÉTABLI, §2.9 et annexe B). Le texte SQL est celui qui a tourné,
commentaires retirés ; la construction l'écrira dans `schema.sql` avec ses
commentaires, ses `drop … if exists` et sa place. Il est écrit pour
P11 = 1, P12 = 1, P13 = 1 ; les autres réponses sont dites à la fin de
chaque sous-section.

### 2.1 Les signes de qualité (section 46.2 ter, après 46.2 bis)

```sql
create table if not exists public.emetteur_labels (
  id                   uuid primary key default gen_random_uuid(),
  pro_id               uuid not null references public.professional_profiles(id) on delete cascade,
  organisme            text,
  intitule             text,
  reference            text,
  categories           text[],
  valide_jusquau       date,
  justificatif_chemin  text,
  created_at           timestamptz default clock_timestamp()
);
create index if not exists idx_emetteur_labels_pro on public.emetteur_labels (pro_id);
alter table public.emetteur_labels enable row level security;
```

Les quatre contraintes, dans l'ordre alphabétique de leurs noms (celui où
PostgreSQL nomme la première qu'une ligne viole, et que `premierRefus`
suit déjà) :

```sql
alter table public.emetteur_labels add constraint emetteur_label_categories_check
  check (categories is null or case
    when array_ndims(categories) = 1 and array_lower(categories, 1) = 1
    then cardinality(categories) between 1 and 19
         and categories <@ array['chaudiere', 'solaire_thermique', 'bois_chaudiere', 'bois_poele', 'pac_chauffage',
                                 'pac_eau_chaude', 'emetteurs_electriques', 'ventilation', 'fenetres', 'fenetres_toit',
                                 'isolation_interieur', 'isolation_exterieur', 'isolation_toiture', 'isolation_combles',
                                 'isolation_plancher', 'geothermie', 'renovation_ensemble', 'photovoltaique',
                                 'desembouage']
         and array_position(categories, null) is null
    else false end);
alter table public.emetteur_labels add constraint emetteur_label_chemin_check
  check (justificatif_chemin is null or justificatif_chemin ~ ('^' || pro_id::text || '/[^/]+$'));
alter table public.emetteur_labels add constraint emetteur_label_complet_check
  check (organisme is not null and intitule is not null and categories is not null and valide_jusquau is not null);
alter table public.emetteur_labels add constraint emetteur_label_longueurs_check
  check (coalesce(char_length(organisme), 0) <= 120
         and coalesce(char_length(intitule), 0) <= 120
         and coalesce(char_length(reference), 0) <= 60);
```

- **`aucun` n'est pas une catégorie d'un label** : il n'existe que sur le
  devis.
- **Une ligne peut exister sans certificat** : elle ne couvre rien, et elle
  EMPÊCHE la déclaration de taire le point pour les travaux qu'elle porte,
  tant qu'elle est valable (§2.4).
- **L'organisme est un texte libre**, pas une liste fermée (J69) ; le texte
  du placeholder ne nomme aucun organisme (A.5).
- **Une date de fin n'a pas de borne** : `'infinity'` est accepté, comme
  pour les assurances ; seul un client modifié l'écrit, et
  `dateFrancaise('infinity')` rend `null` (mesuré par la contradiction
  « base ») : rien d'étrange ne s'affiche. Une borne commune aux deux
  tables, si 2c imprime ces dates : à `docs/A-FAIRE.md` (BASE-11).

Le déclencheur, `security invoker`, créé avant le balayage de la section 43
(qui lui retire `execute`) ; son corps ne nomme aucune table. Le chemin est
rogné par la PETITE classe (BASE-6, le modèle de `tient_l_assurance()`) :
un chemin suivi d'une espace ne compte pas « joint » pour une autre forme,
et une chaîne vide devient vide de valeur au lieu d'un refus mal dit
(mesuré, k09 et k10 de l'annexe B.3).

```sql
create or replace function public.tient_le_label()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.organisme := nullif(btrim(coalesce(new.organisme, ''), ' ' || chr(9) || chr(13) || chr(10) || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279)), '');
  new.intitule := nullif(btrim(coalesce(new.intitule, ''), ' ' || chr(9) || chr(13) || chr(10) || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279)), '');
  new.justificatif_chemin := nullif(btrim(coalesce(new.justificatif_chemin, ''), ' ' || chr(9) || chr(13) || chr(10)), '');
  new.reference := nullif(btrim(coalesce(new.reference, ''), ' ' || chr(9) || chr(13) || chr(10) || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279)), '');
  if tg_op = 'UPDATE' then new.created_at := old.created_at; else new.created_at := clock_timestamp(); end if;
  return new;
end;
$$;
create or replace trigger trg_tient_le_label before insert or update on public.emetteur_labels
  for each row execute function public.tient_le_label();
create policy "mes labels" on public.emetteur_labels for all to authenticated
  using (public.est_mon_entreprise(pro_id)) with check (public.est_mon_entreprise(pro_id));
revoke all on public.emetteur_labels from anon;
revoke truncate, references, trigger on public.emetteur_labels from authenticated;
```

`for all`, et c'est juste ici (la règle du carnet de clients) : supprimer
un de ses signes de qualité ne détruit rien qui engage un tiers ; c'est le
devis remis (2c) qui figera ce qu'il a imprimé.

**Sous P12 = 2** : les deux clés de prudence sortent de cette contrainte,
bornée à 17. **Sous P12 = 3** : rien ne change ici (les trois lignes
« sous-traitance seulement » ne sont jamais la catégorie d'un label).

### 2.2 Les sous-traitants (section 46.2 quater)

```sql
create table if not exists public.emetteur_sous_traitants (
  id                         uuid primary key default gen_random_uuid(),
  pro_id                     uuid not null references public.professional_profiles(id) on delete cascade,
  raison_sociale             text,
  siret                      text,
  label_detient              boolean,
  label_categories           text[],
  label_valide_jusquau       date,
  label_justificatif_chemin  text,
  created_at                 timestamptz default clock_timestamp()
);
create index if not exists idx_emetteur_sous_traitants_pro on public.emetteur_sous_traitants (pro_id);
alter table public.emetteur_sous_traitants enable row level security;
alter table public.emetteur_sous_traitants add constraint emetteur_sous_traitant_categories_check
  check (label_categories is null or case
    when array_ndims(label_categories) = 1 and array_lower(label_categories, 1) = 1
    then cardinality(label_categories) between 1 and 19
         and label_categories <@ array[… les dix-neuf clés, dans le même ordre que 2.1 …]
         and array_position(label_categories, null) is null
    else false end);
alter table public.emetteur_sous_traitants add constraint emetteur_sous_traitant_chemin_check
  check (label_justificatif_chemin is null or label_justificatif_chemin ~ ('^' || pro_id::text || '/[^/]+$'));
alter table public.emetteur_sous_traitants add constraint emetteur_sous_traitant_complet_check
  check (raison_sociale is not null and siret is not null
         and (label_detient is true) = (label_categories is not null and label_valide_jusquau is not null));
alter table public.emetteur_sous_traitants add constraint emetteur_sous_traitant_longueurs_check
  check (coalesce(char_length(raison_sociale), 0) <= 120);
alter table public.emetteur_sous_traitants add constraint emetteur_sous_traitant_siret_check
  check (siret is null or siret ~ '^[0-9]{14}$');
```

(La liste des dix-neuf clés s'écrit en toutes lettres dans les contraintes :
une fonction appelée par une contrainte en ferait une gardienne, que
`verifier-portes` exigerait exécutable par `authenticated` — la raison
écrite pour `emetteur_lieu_type_check`. Ces listes SQL sont COMPARÉES à
`TRAVAUX_ENERGIE` par deux contrôles : §5.3, BASE-8.)

- **`label_detient` a trois états** : vide (pas encore dit, le
  sous-traitant est incomplet), faux, vrai (catégories et date exigées par
  la croisée).
- **La croisée est la SECONDE barrière** de « jamais labellisé sans
  date » ; la première est la forme `is not true` du rang 14 (CTL-7, T20).
  Les neuf contraintes de la section 46 nouvelles sont comparées ENTIÈRES
  par `verifier-emetteur` (une `FORMES_46`, le modèle de `FORMES_2A`) :
  relâcher la croisée rougit.
- **Le justificatif est rangé dans le dossier de l'ARTISAN**
  (`^<pro_id>/…`) : c'est lui qui l'envoie, et le ménage de compte
  l'emporte avec les siens.

Le déclencheur, `security invoker`, ne nomme aucune table :

```sql
create or replace function public.tient_le_sous_traitant()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.raison_sociale := nullif(btrim(coalesce(new.raison_sociale, ''), ' ' || chr(9) || chr(13) || chr(10) || chr(160) || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279)), '');
  new.label_justificatif_chemin := nullif(btrim(coalesce(new.label_justificatif_chemin, ''), ' ' || chr(9) || chr(13) || chr(10)), '');
  new.siret := nullif(regexp_replace(coalesce(new.siret, ''), '[^0-9]', '', 'g'), '');
  if new.label_detient is not true then
    new.label_categories := null;
    new.label_valide_jusquau := null;
    new.label_justificatif_chemin := null;
  end if;
  if tg_op = 'UPDATE' then new.created_at := old.created_at; else new.created_at := clock_timestamp(); end if;
  return new;
end;
$$;
create or replace trigger trg_tient_le_sous_traitant before insert or update on public.emetteur_sous_traitants
  for each row execute function public.tient_le_sous_traitant();
create policy "mes sous traitants" on public.emetteur_sous_traitants for all to authenticated
  using (public.est_mon_entreprise(pro_id)) with check (public.est_mon_entreprise(pro_id));
revoke all on public.emetteur_sous_traitants from anon;
revoke truncate, references, trigger on public.emetteur_sous_traitants from authenticated;
```

**Le déclencheur efface les champs du label quand la réponse n'est pas
« Oui », et c'est gardé** (BASE-7, la correction retenue) : garder ces
valeurs sous « Non » casserait la croisée, s'écarterait du modèle de tout
le projet (le libellé d'un lieu hors « autre ») et garderait sans usage des
données d'une autre entreprise. **Le formulaire le dit AVANT
d'enregistrer** (A.5 : « En enregistrant, son label et son justificatif
seront retirés de cette fiche. »). Le fichier retiré de la ligne RESTE
dans `documents` (aucun client ne retire un fichier de `documents`,
lot S-a) : c'est le document d'un TIERS orphelin ; la ligne de
`docs/A-FAIRE.md` sur les attestations remplacées le dira.

**Pourquoi pas `professional_partners`** (P3) : un partenariat relie deux
COMPTES Opus, avec consentement ; un sous-traitant est une entreprise, qui
n'a souvent pas de compte, et que l'artisan nomme seul. Aucun lien vers un
compte.

**Sous P13 = 2** : la colonne `label_justificatif_chemin`, sa contrainte et
sa ligne du déclencheur ne naissent PAS (une colonne sans écrivain est le
« bouton §18 », CTL-13 ; un `add column if not exists` en 2c ne refait
rien), et la condition sur le justificatif part du rang 14.

### 2.3 Les colonnes de `devis` (49.4 septies), nullables, SANS défaut

```sql
alter table public.devis add column if not exists energie_travaux text[];
alter table public.devis add column if not exists energie_sans_label text[];
alter table public.devis add column if not exists energie_sous_traitance boolean;
alter table public.devis add column if not exists energie_sous_traitants uuid[];
```

| colonne | vide | valeurs |
|---|---|---|
| `energie_travaux` | rien de dit : motif `devis_energie` (prudence) | `{aucun}` seul, ou de 1 à 19 catégories (jamais `aucun` avec une autre) |
| `energie_sans_label` | aucun travail déclaré sans label | de 1 à 19 clés (jamais `aucun`) : les travaux pour lesquels l'artisan déclare, sur CE devis, ne pas détenir de label |
| `energie_sous_traitance` | rien de dit : la rubrique manque | faux (« Non »), vrai (« Oui ») |
| `energie_sous_traitants` | aucun choisi | de 1 à 10 identifiants, sans élément vide ; sans clé étrangère |

Trois contraintes, dans 49.5, sur la forme exacte des déchets :

```sql
alter table public.devis add constraint devis_energie_sans_label_check
  check (energie_sans_label is null or case
    when array_ndims(energie_sans_label) = 1 and array_lower(energie_sans_label, 1) = 1
    then cardinality(energie_sans_label) between 1 and 19
         and energie_sans_label <@ array[… les dix-neuf clés …]
         and array_position(energie_sans_label, null) is null
    else false end);
alter table public.devis add constraint devis_energie_sous_traitants_check
  check (energie_sous_traitants is null or case
    when array_ndims(energie_sous_traitants) = 1 and array_lower(energie_sous_traitants, 1) = 1
    then cardinality(energie_sous_traitants) between 1 and 10
         and array_position(energie_sous_traitants, null) is null
    else false end);
alter table public.devis add constraint devis_energie_travaux_check
  check (energie_travaux is null or case
    when array_ndims(energie_travaux) = 1 and array_lower(energie_travaux, 1) = 1
    then cardinality(energie_travaux) between 1 and 19
         and energie_travaux <@ array['aucun', … les dix-neuf clés …]
         and (cardinality(energie_travaux) = 1 or not ('aucun' = any (energie_travaux)))
    else false end);
```

Mesuré (annexe B.2 et B.3) : un tableau vide, `aucun` mêlé ou dans la
déclaration, une clé inconnue (`menuiseries`, et l'ancienne
`entretien_chauffage`), deux dimensions, un indice bas de 0, un élément
vide, onze sous-traitants : **23514, chacun sous le nom de sa contrainte**.
**29 contraintes `check` sur `devis`** après l'ajout (26 avant).

**Une clé restée dans la déclaration pour un travail DÉCOCHÉ** (BASE-1,
tranché ici) : elle reste, sans effet (T23) ; si le travail est coché de
nouveau, il revient déclaré — et sa case se montre COCHÉE sous lui : c'est
visible, et c'était un appui sur ce devis (mesuré, V11).

**Le cas rare, écrit et non corrigé** (ÉCRAN-1) : un travail déclaré, puis
couvert par un label ajouté, puis ce label expire : la déclaration reprend
effet. C'est juste au fond (un label à date passée n'est plus détenu), et
l'avis du label aura prévenu avant l'échéance (T31).

**Le contrat de `energie_sous_traitants`, écrit dans le commentaire de
49.4 septies et dans A-FAIRE pour 2c** : un identifiant ne prouve aucune
appartenance ; tout lecteur filtre par `pro_id` ; la remise copiera les
sous-traitants DISTINCTS, dans l'ordre, et figera leur identité, leur
label, leur justificatif tels qu'ils étaient (J70).

**49.7** : les quatre colonnes entrent dans le `grant insert (…)` et le
`grant update (…)`, juste après `dechets_cout_centimes` et avant
`generation`. Sans elles, la requête entière rendrait 42501.

**Sous P11 = 2** : `energie_sans_label` ne naît pas sur `devis` ; une
colonne `emetteur.travaux_sans_label text[]` naît à sa place (la première
`alter table public.emetteur add column` depuis le lot 0a), et le rang 14
la lit dans la même lecture que l'entreprise. **Sous P12 = 3** :
`energie_travaux` accepte trois clés de plus (borne 22).

### 2.4 Le rang 14 dans `motifs_refus_remise()` (49.9)

Signature inchangée ; trois ajouts, et rien d'autre ne bouge.

**Les déclarations**, après `v_lieux_existants` :

```sql
  v_energie         text[];
  v_energie_sans    text[];
  v_energie_st      boolean;
  v_energie_st_ids  uuid[];
  v_label_loi       bigint := 0;
  v_label_prudence  bigint := 0;
  v_st_choisis      bigint := 0;
  v_st_incomplets   bigint := 0;
  v_st_manque       boolean := false;
```

**L'étape 1** lit les quatre colonnes à la suite de `d.dechets_cout_centimes`
(et range dans `v_energie, v_energie_sans, v_energie_st, v_energie_st_ids`).

**L'étape 3 quater**, juste avant « 4. Les motifs du devis » : UNE mention
de chaque table, et la jointure groupée rend les quatre états d'un coup.

```sql
  if (v_valable is null or v_valable in ('consommateur', 'non_professionnel'))
     and v_energie is not null and v_energie <> array['aucun']::text[] then
    select count(*) filter (where not c.prudence), count(*) filter (where c.prudence)
      into v_label_loi, v_label_prudence
      from (select u.cle,
                   u.cle = any (array['photovoltaique', 'desembouage']) as prudence,
                   bool_or(g.justificatif_chemin is not null and g.valide_jusquau >= v_jour) as couverte,
                   bool_or(g.justificatif_chemin is null and g.valide_jusquau >= v_jour) as sans_certificat
              from unnest(v_energie) as u(cle)
              left join public.emetteur_labels g
                on g.pro_id = v_pro and u.cle = any (g.categories)
             group by u.cle) c
     where c.couverte is not true
       and (c.sans_certificat is true or (c.cle = any (v_energie_sans)) is not true);
    if v_energie_st is null then
      v_st_manque := true;
    elsif v_energie_st then
      select count(distinct s.id),
             count(distinct s.id) filter (where s.label_detient is null
                                            or (s.label_detient is true
                                                and ((s.label_valide_jusquau >= v_jour) is not true
                                                     or s.label_justificatif_chemin is null)))
        into v_st_choisis, v_st_incomplets
        from public.emetteur_sous_traitants s
       where s.pro_id = v_pro and s.id = any (v_energie_st_ids);
      v_st_manque := v_st_choisis = 0 or v_st_incomplets > 0;
    end if;
  end if;
```

**Le bloc du rang 14**, entre la fin du rang 13 et « 5. Les motifs de
l'entreprise » :

```sql
  if v_valable is null or v_valable in ('consommateur', 'non_professionnel') then
    if v_energie is null then
      rang := 14; cle := 'devis_energie'; nature := 'prudence';
      phrase := '… A.1 …';
      return next;
    elsif v_label_loi > 0 or v_label_prudence > 0 or v_st_manque then
      if v_valable = 'consommateur' and (v_label_loi > 0 or v_st_manque) then
        rang := 14; cle := 'devis_energie_mentions'; nature := 'loi';
        phrase := '… A.1 …';
      else
        rang := 14; cle := 'devis_energie_mentions_prudence'; nature := 'prudence';
        phrase := '… A.1 …';
      end if;
      return next;
    end if;
  end if;
```

Ce que la forme garantit, et que l'annexe B mesure :

- **« Aucun » se tait sans être nommé dans le bloc** : sous `{aucun}`, la
  lecture 3 quater ne tourne pas, les trois compteurs restent à zéro et
  faux (mesuré, 01 et 26) ;
- **`(c.cle = any (v_energie_sans)) is not true`**, jamais `not (…)` : une
  déclaration vide de valeur ferait sinon taire le point (mesuré : le
  sabotage fait rougir onze cas, dont V18) ;
- **un label valable sans certificat garde le point, déclaration ou non**
  (V01, V04, V05) ; **un second label complet le couvre** (V06) ; **un
  label expiré est déclarable** (V02, V03) ;
- **la déclaration ne vaut que pour les travaux qu'elle nomme** (V07, V08,
  V10) ; un label retiré fait revenir le point (V09) ;
- **les deux lignes de prudence seules rendent `…_prudence`, à titre
  privé** (V12, V13, V16) ; la sous-traitance qui manque rend « La loi »
  même pour elles (V14) ;
- **`(s.label_valide_jusquau >= v_jour) is not true`** : un sous-traitant
  labellisé sans date compte incomplet même si la croisée tombe (V22) ;
- **`v_valable is null or … in (…)`** : la réponse vide parle (31), les
  deux réponses « entreprise » se taisent (29, 30, 34) ;
- **les sous-traitants DISTINCTS** (25) ; **tous complets** (21) ;
- **un label ou un sous-traitant d'une AUTRE entreprise ne compte jamais**,
  sous la RLS (13, 22, V20) comme dans une enveloppe `security definer`
  (14, 23, V21). **La contre-épreuve** : `g.pro_id = v_pro` et
  `s.pro_id = v_pro` retirés, les cas 14 et 23 basculent, et SEULS eux.

**La porte étroite (cas 14 c de l'essai 49-remise)** : le corps nomme,
mesuré, exactement `devis, devis_lignes, emetteur, emetteur_assurances,
emetteur_incomplet, emetteur_labels, emetteur_lieux_depot,
emetteur_sous_traitants, est_mon_entreprise`. Les mots interdits gagnent,
EN LE DÉCIDANT, `rge`, `rge_declare`, `rge_expire`, `rge_url`,
`rge_numero` (Q5), et `label_categories`, `raison_sociale`, `siret`,
`organisme`, `intitule`, `reference` (T21, BASE-10) — une ceinture de
plus : `FORME_MOTIFS_REFUS_REMISE` et la lecture à la lettre de
`verifier-emetteur` tiennent déjà T21.

**`v_jour`** est celui du rang 11, `(now() at time zone 'Europe/Paris')::date`.

**Sous P12 = 2** : la liste de prudence disparaît du corps (et
`v_label_prudence` avec elle). **Sous P12 = 3** : la jointure écarte les
trois clés « sous-traitance seulement » (`where u.cle <> all (array[…])`).
**Sous P11 = 2** : `v_energie_sans` est lu dans `emetteur`.

### 2.5 L'export (section 42)

Deux clés de plus dans le second objet de `mes_donnees()`, après
`mes_lieux_de_depot`, sur sa forme exacte :

```sql
    'mes_signes_de_qualite',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at, x.id)
                             from public.emetteur_labels x where x.pro_id = auth.uid()), '[]'::jsonb),
    'mes_sous_traitants',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at, x.id)
                             from public.emetteur_sous_traitants x where x.pro_id = auth.uid()), '[]'::jsonb),
```

Les sous-traitants sont des données sur des tiers, rangées par l'artisan :
elles reviennent à l'artisan qui demande SES données, jamais au
sous-traitant. `verifier-lectures` gagne leur forme, l'essai 51d J1 et
J1 quater leur présence (49 → 51 clés).

### 2.6 La garde TVA (T9)

Écrite en commentaire de 49.4 septies, et tenue par quatre contrôles :

1. **le corps de `motifs_refus_remise`** : le rang 3 et sa lecture des
   lignes ne nomment aucune colonne `energie_` ; le bloc du rang 14 et la
   lecture 3 quater ne nomment ni `devis_tva`, ni `taux_tva_centiemes`, ni
   `regime_tva` (le contrôle coupe le bloc 14 et y compte zéro) ;
2. **`recalcule_devis()` et `tient_la_ligne_de_devis()`** ne nomment aucune
   colonne `energie_`, aucune des deux tables nouvelles ;
3. **côté JavaScript, par les SIGNATURES** (CTL-17) : `tauxProposes(etatRegime)`
   et `cleDuTauxDeLaLigne(l, regime, chantierNeufTva = null)` gardent leur
   signature exacte, et leurs appelants (`devis.js` et la saisie) ne leur
   passent ni le devis ni un champ `energie…` ; une garde du texte de leur
   corps en plus ;
4. **le rang 3 du miroir** vit dans `motifsDeRemise`, qui a le devis : c'est
   la parité avec la base, dont la forme est figée, qui le garde.

Le droit le confirme : aucune condition de qualification pour le 10 % et le
5,5 % de rénovation énergétique ; seuls le photovoltaïque et les bornes ont
la leur, et c'est le lot TVA (`droit.md` §4.h).

### 2.7 Ce qui ne change pas

`tient_le_devis` (sa forme entière est figée), `recalcule_devis`, les
totaux, `devis_tva`, `emetteur_incomplet()` (aucun motif d'entreprise pour
le label), les rangs 1 à 13, `est_mon_entreprise`, le badge `rge` et ses
colonnes, `professional_partners`, la fonction Edge `compte` (le
certificat et le justificatif sont un niveau sous le dossier du compte :
elle les emporte déjà, DÉDUIT de 2b-3), `PretAEmettre.js` (il dit « vos
informations d'entreprise sont complètes » d'après `emetteur_incomplet()`
seul : le même écart accepté qu'au rang 11).

### 2.8 Les listes fermées de TABLES (le piège du « mot entier »)

Le trait de soulignement est une lettre de mot : `emetteur_labels` et
`emetteur_sous_traitants` ne contiennent pas le mot `emetteur`, et passent
au travers de toute expression qui le cherche entier. Chacun de ces
endroits les nomme, EN LE DÉCIDANT (lignes : `methode.md` §3 et les
critiques, ÉTABLI) :

| n° | où | ce qui change |
|---|---|---|
| 1 | `verifier-emetteur` `TABLES_46` (`:1303`) | six tables au lieu de quatre |
| 2 | …les alternations des contraintes (`:1285`, `:1441`, `:1477`) et l'objet des longueurs (`:1475`) | les deux tables ; neuf contraintes de plus |
| 3 | …`TABLES_ICI` (`:1504`), `COLONNES_PRO`, `FORMES_DECLENCHEURS`, la liste des déclencheurs avant le balayage (`:1345`), la liste des fonctions invoker (`:1872`) | `trg_tient_le_label`, `trg_tient_le_sous_traitant`, leurs fonctions, leurs `pro_id` |
| 4 | …la chaîne exacte des `not null` (`:1711`) | quatre `pro_id` au lieu de deux |
| 5 | …`PRIVEES` (`:1620`) et une entrée dans `LISTES` (`:1621-1628`) | les deux tables |
| 6 | …`QUATRE` du cas 26 bis (`:1986`) et « RLS sur … » (`:2006`) | SIX |
| 7 | `verifier-legal` `PRIVEES` (`:815`), `LISTES` (`:846-873`), `PRIVEES_EDGE` (`:1019`) | les deux tables |
| 8 | …`CLASSEMENT` (`:2472`) | deux lignes « soi », comme `emetteur_lieux_depot` |
| 9 | `verifier-tarifs` `TROIS` et `QUATRE` (`:1643-1644`) | CINQ et SIX |
| 10 | `verifier-remontee` `EXCLUES` (`:723`) et la raison en 52.1 | les deux tables (leur déclencheur pose la date) |
| 11 | `verifier-lectures` la forme des clés d'export (`:1435-1436`) | deux formes de plus |
| 12 | `verifier-postes` et `verifier-emetteur` la forme de `monEmetteurSupabase` et de `monRegimeEtSaDate` | sept lectures, six champs |
| 13 | `essais-section-46.sql` les quatre alternations du cas 26 bis (`:977-991`), la liste d'`information_schema` du cas 30 (`:1073`, deux `id` et deux `pro_id` de plus) | les deux tables |
| 14 | `essais-section-47.sql` les trois alternations du cas 14 (`:771-776`) | les deux tables |
| 15 | `essais-section-49-remise.sql` la liste exacte du cas 14 c (`:1252`) et ses mots interdits | le §2.4 |
| 16 | `essais-section-51d.sql` (J1, et J1 quater `nb_cles_attendu_49` → 51) et `essais-suppression-compte.sql` (`:110-131`) | les deux clés d'export ; un label et un sous-traitant posés, puis 0 de chacun après le départ du compte |
| 17 (v2) | `essais-section-46.sql` cas 26 (`:905-930`) : les fonctions de déclencheur et les tables, sur le modèle des lignes des lieux (`lieux_references_attendu_f`, `lieux_trigger_attendu_f`, `lieux_rls_attendu_t`) ; et deux listes fermées par table, `nomment_les_labels` et `nomment_les_sous_traitants` (`mes_donnees, motifs_refus_remise`), sur le modèle de `nomment_les_lieux` (`:996-1001`) | BASE-4, CTL-14 |
| 18 (v2) | `essais-section-46.sql` cas 29 (`:1059-1062`) : deux `regclass` de plus ; `contraintes_check_attendu_29` → 38 | BASE-4 |
| 19 (v2) | `essais-section-49-conditions.sql` cas 23 (27 → 31 lignes) et sa copie `DEFAUTS_ATTENDUS` de `verifier-devis` (`:4871-4891`, 19 lignes aujourd'hui) : **décidé, elle rattrape aussi les huit colonnes de 2b-5** et passe à 31, la copie exacte du cas 23 ; la forme exacte de ce cas, copiée à `verifier-devis:5052`, suit | BASE-4 |
| 20 (v2) | `essais-section-49.sql` cas 2 : 42 → 45 contraintes, et son `echo` qui les énumère ; `verifier-emetteur` `ATTENDUES` (`:1998-2001`) : les refus nouveaux de l'essai 46 | CTL-14 |

Et deux PROPRIÉTÉS, pour que l'oubli rougisse de lui-même (CTL-11, la
portée corrigée par la contradiction) :

- **`verifier-emetteur`** : les tables créées dans les sections 46 et 47
  sont EXACTEMENT `TABLES_46` (vrai aujourd'hui : quatre `create table`,
  les quatre de la liste, mesuré) ; et les listes des cas 26, 29 et 30 de
  l'essai 46 sont relues contre `TABLES_46`, comme le cas 26 bis l'est déjà
  (`:1986-1997`) ;
- **`verifier-legal`** : chaque table créée dans la SECTION 46 est vue par
  `PRIVEES`, par au moins une entrée de `LISTES`, et par `PRIVEES_EDGE`
  (vrai aujourd'hui pour les quatre). La portée est la section, pas le
  classement : `clients` et `preuves_tva` sont rangés « soi » ailleurs, et
  la fonction `tva` nomme `preuves_tva` par construction.

La leçon B48/B49 de 2b-5, rejouée : **chaque liste s'éprouve en retirant
une des deux tables** ; avec les deux propriétés, ce retrait rougit
partout (et la moitié `verifier-legal` du sabotage S17 du v1, qui passait
au vert — rejoué par la contradiction —, est refusée).

### 2.8 bis Les listes fermées de FICHIERS et de fonctions (CTL-3)

Les règles d'écran lisent des listes de fichiers écrites en dur : un
fichier nouveau qui n'y est pas n'est jamais lu, et rien ne le signale
(rejoué par la contradiction : trois fichiers plantés de huit défauts, dix
contrôles, 0 « ✘ »). Les contrôles par `git ls-files` (`verifier-echelles`,
`-cibles`, `-feuilles`, `-retour`, `-imports`) voient les fichiers
nouveaux d'eux-mêmes.

| où | ce qui y entre |
|---|---|
| `verifier-devis` `FICHIERS_DU_MODULE` (`:1208-1214`, « un an » sans opposition) | `EnergieDevis.js` |
| …les deux listes de « rien ne manque » (`:10547-10548`, `:10565-10566`) | `EnergieDevis.js` |
| `verifier-emetteur` `ECRANS` (`:2232-2233`, « neuf composants ») | `FicheLabel.js`, `FicheSousTraitant.js` : « onze composants » |
| …« aucun pavé numérique n'annonce une touche retour » (`:2331`) | `FicheSousTraitant.js` (le SIRET) |
| …« « Suivant » amène au champ d'après » (`:2345`) | les deux formulaires |
| …« rien n'est coché d'office » (`:2426-2443`) | les deux formulaires (dix-neuf catégories ; « Détient-il un label RGE ? ») |
| …« les choix sont des rangées `Option`, jamais `PillToggle` » (`:2444`) | `FicheSousTraitant.js` (le « Non » · « Oui » est une rangée `Option` : §3.6) |
| …les exports d'`api.js` après `const noop` (`:2091-2101`, « neuf exports ») | les six écritures nouvelles : quinze |
| `verifier-etats` `DEVIS` (`:571-573`, « vérifié » interdit, « registre » réservé) | les trois fichiers nouveaux |
| `verifier-demo` (`:59-62`, `:87-91`) | les deux formulaires, pour la seule règle des organismes (§3.9, CTL-4) |

### 2.9 Les essais locaux (`cahier_2b6_v1` le 23/11, `cahier_2b6_v2` le 24/11)

**Le v1** (annexe B.1 et B.2) : 36 cas du rang 14 et 27 essais de
contraintes, tous justes, sur le corps du v1 ; la contre-épreuve du filtre
`pro_id` faisait basculer exactement les cas 14 et 23.

**Le v2** (annexe B.3), sur PostgreSQL 16 : `local-prelude.sql` (code 0),
`schema.sql` (0 erreur), les objets des §2.1 à 2.3 tels qu'écrits ici
(0 erreur), la fonction du §2.4 fabriquée par un script depuis la fonction
de `schema.sql` (trois remplacements, chacun trouvé une seule fois ;
21 267 caractères, une mention de chaque table nouvelle, aucune barre
oblique inverse), puis le balayage de la section 43 rejoué. Le décor est
celui de l'essai 49-remise (comptes `a4900000-…`, SIRET fictifs), le devis
complet aux rangs 1 à 13 (franchise, déchets « Non », prix du devis
gratuit, à titre privé). Chaque cas dans sa sous-transaction.

| | résultat |
|---|---|
| les 36 cas du v1, la déclaration écrite en liste | **36 justes** |
| 22 cas nouveaux (V01 à V22 : les quatre états, les trois chemins de BASE-1, la prudence de DROIT-2, CTL-7) | **22 justes** |
| contre-épreuve : le filtre `pro_id` retiré des deux lectures | **2 faux, exactement 14 et 23** |
| sabotage : `not (c.cle = any (…))` au lieu de `is not true` | 11 faux (dont V18, la déclaration vide de valeur) |
| sabotage : `label_valide_jusquau < v_jour` (CTL-7) | 1 faux : V22 |
| sabotage : la condition « sans certificat » retirée | 2 faux : V01, V04 |
| sabotage : la nature suit le seul client | 3 faux : V12, V13, V16 |
| dix essais de contraintes et de déclencheur (k01 à k10) | 5 refus sous `devis_energie_sans_label_check`, l'ancienne clé refusée, `desembouage` accepté, le chemin rogné, la chaîne vide devenue vide de valeur |
| la base | **supprimée** (`dropdb`), vérifiée absente |

Fichiers (hors du dépôt) : `lot2b6/essai-v2/objets.sql`, `fabriquer.py`,
`fonction.sql`, `phrases.mjs`, `decor.sql`, `cas.sql`, `contraintes.sql`,
`textes.mjs`, `s-*.sql`, `cas.res`.

---

## 3. Le calcul (JavaScript) et l'écran

### 3.1 Les catégories (`src/data/travaux-energie.js`, nouveau, n'importe rien)

Dix-neuf catégories, l'ordre du décret, puis les deux lignes « par
prudence » (P12 = 1). Le **libellé** est court : c'est lui que 2c
imprimera, « pour les catégories de travaux concernés » ; les
**exemples** passent en aide de la case, à l'écran seulement (le modèle de
`FLUX_DECHETS`, ÉCRAN-8). Le numéro du décret et le domaine de l'ADEME sont
rangés avec chaque clé, jamais affichés. Les mots suivent le décret
(`decret-2014-812-complet.txt:7-39`, ÉTABLI) ; ils sont proposés
(DÉDUIT), corrigés par la critique « droit » (DROIT-4, 5, 14), mesurés par
`node` (A.2).

| clé | libellé | exemples (aide) | décret |
|---|---|---|---|
| `chaudiere` | Chaudière à haute performance (condensation, micro-cogénération gaz) et sa régulation | — | 1° |
| `solaire_thermique` | Chauffage ou eau chaude par capteurs solaires | — | 2° |
| `bois_chaudiere` | Chaudière ou poêle hydraulique au bois ou à la biomasse (relié au chauffage central ou à l’eau chaude) | — | 3° |
| `bois_poele` | Poêle, insert ou cuisinière au bois ou à la biomasse, non relié au chauffage central ni à l’eau chaude | — | 4° |
| `pac_chauffage` | Pompe à chaleur pour le chauffage | — | 5° |
| `pac_eau_chaude` | Chauffe-eau thermodynamique (pompe à chaleur pour l’eau chaude) | — | 6° |
| `emetteurs_electriques` | Radiateurs ou autres émetteurs électriques, et leur régulation | plancher chauffant électrique, panneau rayonnant | 7° |
| `ventilation` | Ventilation mécanique | VMC simple ou double flux | 8° |
| `fenetres` | Fenêtres, portes-fenêtres, volets isolants, porte d’entrée sur l’extérieur | — | 9° |
| `fenetres_toit` | Fenêtres de toit | — | 10° |
| `isolation_interieur` | Isolation par l’intérieur des murs, des rampants de toiture ou des plafonds sous combles | doublage ou faux plafond isolé compris | 11° |
| `isolation_exterieur` | Isolation des murs par l’extérieur | — | 12° |
| `isolation_toiture` | Isolation d’une toiture-terrasse, ou d’une toiture par l’extérieur | — | 13° |
| `isolation_combles` | Isolation des combles perdus | — | 14° |
| `isolation_plancher` | Isolation d’un plancher bas sur local non chauffé | cave, garage, vide sanitaire | 15° |
| `geothermie` | Sonde géothermique d’une pompe à chaleur | forage | 16° |
| `renovation_ensemble` | Rénovation énergétique en « offre globale » (conception, coordination et suivi de tout le projet) | aide : « Ne cochez pas cette ligne parce que le devis réunit plusieurs des travaux ci-dessus : cochez chacun d’eux. » | 17° |
| `photovoltaique` | Panneaux solaires photovoltaïques | — (prudence) | hors décret, J44 |
| `desembouage` | Désembouage d’un chauffage central à eau | hors installation chauffée par une pompe à chaleur (prudence) | hors décret, fiche CEE BAR-SE-108, J74 |

- **Le 17° est une certification « offre globale »**, pas « plusieurs de
  ces travaux » : les fiches CEE de rénovation d'ampleur exigent le signe
  de chaque catégorie, du 1° au 16°, jamais le 17°
  (`arrete-2014-12-22-cee-fiches-complet.txt:2861`, `:3212`, `:3547`,
  ÉTABLI par la contradiction « droit ») ; avec les mots du v1 et « Dans le
  doute, cochez », un artisan couvert catégorie par catégorie aurait dû
  déclarer ne pas détenir le 17° (DROIT-5, J73).
- **Le 3° couvre le 4°, le 5° couvre le 6°**, dans un seul sens
  (`arrete-2015-12-01-complet.txt:143`, ÉTABLI) : ce n'est PAS une règle
  d'Opus ; c'est une phrase de l'aide du formulaire du label, qui dit de
  cocher aussi les deux (A.5). Un poêle hydraulique est au 3° (DROIT-4).
- **Les bornes de recharge n'y sont pas** (ni économies d'énergie, ni
  production renouvelable) : à poser avec J37.
- **Sous P12 = 3**, trois lignes de plus, marquées « sous-traitance
  seulement » (`calorifugeage`, `regulation`, `reseau_chaleur`).

### 3.2 `src/lib/devis.js`

Importe une sixième fois : `TRAVAUX_ENERGIE` de `../data/travaux-energie.js`
(T28 ; la garde « exactement cinq importations », `verifier-devis:1480-1492`,
est récrite en le décidant).

Fonctions pures nouvelles, que `verifier-devis` fera tourner :

- `ENERGIE_AUCUN = 'aucun'`, `SOUS_TRAITANTS_MAX = 10`, `CLES_PRUDENCE` (les
  deux clés de prudence, lues dans `TRAVAUX_ENERGIE`) ;
- `travauxApresAppui(valeur, cle)` : la case cochée ou décochée, l'ordre
  canonique, `aucun` exclusif dans les deux sens ; la dernière case
  décochée rend VIDE DE VALEUR, jamais `[]` ; ne touche JAMAIS la liste des
  déclarations (T23) ;
- `sansLabelApresAppui(liste, cle)` : ajoute ou retire UNE clé, l'ordre
  canonique, vide de valeur à la dernière (BASE-1, ÉCRAN-1) ;
- `sousTraitantsApresAppui(choix, lus, id)` : sur une liste LUE, dans son
  ordre, orphelins sans effet, le plafond compté sur la liste REBÂTIE (la
  leçon du onzième lieu) ;
- `etatsDesTravaux(devis, labels, { proId, jour })` → pour chaque travail
  coché : `{ cle, etat, intitule, fin }`, où `etat` vaut `couvert` (la fin
  la plus TARDIVE des labels qui le couvrent), `sans_certificat`, `expire`
  ou `absent` ; un label d'une autre entreprise ne compte pas ; un label
  expiré ET sans certificat compte `expire` (T26, ÉCRAN-2) ; `null` si la
  liste n'est pas lue ;
- `sousTraitantComplet(st, { proId, jour, justificatifExige })`, avec la
  date jugée « pas `fin >= jour` » (T20) ;
- `rubriquesDeLEnergie(devis, labels, sousTraitants, jour)` →
  `{ travaux, label, sousTraitance }`, chacune vrai, faux ou vide de valeur
  (inconnue : une liste n'est pas lue), et `labelLoi` / `labelPrudence` ;
  elle lit `etatsDesTravaux` ; c'est la SEULE écriture de la règle ;
- `motifDeLEnergie(devis, labels, sousTraitants, jour, valable)` → la clé,
  ou `null` ; appelée par `motifsDeRemise` après le rang 13 ;
- `resumeDeLEnergie({ devis, labels, sousTraitants, enRoute, enEchec,
  refuse })` et `GABARITS_DE_L_ENERGIE` (24, A.4) ;
- `finDuLabel({ devis, labels, jour, valable })` : le jumeau de
  `finDeLAttestation` ; la fin qui parle est le MINIMUM, sur les travaux
  cochés, de la fin la plus tardive qui couvre chacun ; elle se tait sous
  « Aucun », pour une réponse « entreprise » (celle de l'ÉCRAN,
  `pourQuiValable`), ou si la liste manque (T31) ;
- `etatInitialEnergie(devis)` : la signature exacte `(devis)` ; ne lit QUE
  les quatre champs du devis, jamais `source`, `quoteRequestId`,
  `sosRequestId` ni `objet` (CTL-10) ;
- `CHAMPS_DE_L_ENERGIE` (le jumeau de `CHAMPS_DES_DECHETS`) et
  `RUBRIQUE_DE_L_ENERGIE` (une table À PART : `RUBRIQUE_DU_CHAMP` doit
  rester EXACTEMENT celle des déchets, vérifications « l » et « l bis ») ;
- `LE_LABEL` : les textes de la carte, de la rangée, du point (A.3, A.4),
  et, si P14 = 1 ou 2, `AMENDE_DU_LABEL`, `AMENDE_DE_LA_SOUS_TRAITANCE`.

Changements en place :

- `MOTIFS_DEVIS` : trois entrées au rang 14 (A.1) ;
- `motifsDeRemise` : deux paramètres de plus, `labels` et `sousTraitants`
  (défaut `undefined`, non lus) ;
- `ENDROIT_DU_MOTIF` et `actionDuPoint` : les trois clés ouvrent la carte,
  `devis_energie` sur la question des travaux, les deux autres sur la
  première rubrique qui manque ; un seul bouton, « Compléter : énergie et
  label RGE » ;
- `AVIS_DU_DEVIS` gagne `avis_label_echeance` (A.6), et `avisDuDevis`
  l'appelle UNE fois, SANS la liste sûre (T31) ;
- `PAS_ENCORE_VERIFIE` : A.8 ;
- `REPONSES_A_QUEL_TITRE` : les deux aides de T27 (A.9) ;
- `NOM_DES_SECTIONS` : `labels: 'Vos signes de qualité (label RGE)'`,
  `sousTraitants: 'Vos sous-traitants'` ;
- `CHAMPS_DEVIS`, `rowToDevis`, `devisVersBase` : les quatre champs
  (`rowToDevis` les connaît AVANT la régénération de `cas-remise.json`, la
  leçon de 2b-4) ; `CONTRAINTES` et `ECHEC_PAR_CONTRAINTE` : les trois
  contraintes (A.7) ;
- `BLANCS` et la liste `copies` de §17 : seize copies (T15).

### 3.3 `src/lib/emetteur.js`

Sur le modèle exact des lieux : `COLONNES_ECRITES.emetteur_labels`,
`COLONNES_ECRITES.emetteur_sous_traitants`, `LONGUEUR_MAX` (120, 120, 60 ;
120), `nettoyerLabel`, `validerLabel`, `nettoyerSousTraitant` (le chemin
rogné par la petite classe, comme la base : BASE-6), `validerSousTraitant`
(le SIRET nettoyé PUIS `cleSiretValide`), `CONTRAINTES` (les neuf : le
miroir des contraintes de catégories lit `TRAVAUX_ENERGIE`, importé de
`../data/travaux-energie.js` — un `permis` de plus, T28),
`etatDuLabel(label, jour)` (valable, certificat non joint, fin de validité
dépassée) et `etatDuSousTraitant(st, jour)` (A.5). `premierRefus` suit
l'ordre alphabétique des noms. `emetteur.js` n'importe toujours pas
`devis.js`.

**`etatDuLabel` et `etatsDesTravaux` disent la même chose** (T26, CTL-8) :
un contrôle les fait tourner sur un même jeu (un chemin vide, fait de
blancs, suivi d'une espace, dans le dossier d'un autre ; une fin d'hier, du
jour, de demain ; le label d'une autre entreprise) et exige le même
verdict ; de même `etatDuSousTraitant` et `sousTraitantComplet`. Le modèle
est `attestationJointe` et `cheminEcrit` (2b-3).

### 3.4 `file-ecriture.js`, `meme-valeur.js`, et l'égalité stricte

Les TROIS tableaux du devis (`energieTravaux`, `energieSansLabel`,
`energieSousTraitants`) passent par `memeValeur`, comme ceux des déchets.
La propriété de `verifier-devis` qui refuse un `Object.is` hors de
`memeValeur` est ÉTENDUE (ÉCRAN-12) : dans les cartes (`DechetsDevis.js`,
`EnergieDevis.js`) et dans la saisie, aucun `Object.is` ET aucune égalité
stricte (le triple égal, ou sa négation) dont un côté est un champ tableau
du devis (`dechetsFlux`, `dechetsSurPlace`, `dechetsLieux`,
`energieTravaux`, `energieSansLabel`, `energieSousTraitants`) ; prouvée par
un sabotage de chaque forme. Aujourd'hui `DechetsDevis.js` ne compare que
des valeurs simples : la règle passe déjà.

### 3.5 `src/lib/api.js`

- `monEmetteurSupabase` : sept lectures dans le même `Promise.all` (fiche,
  assurances, tarifs, lieux, labels, sous-traitants, preuve TVA en dernier) ;
  une table absente rend `null` (`tableAbsente`) ;
- `monRegimeEtSaDate` : `{ ...regimeEtSaDate(f), assurances, lieux, labels,
  sousTraitants }` ;
- six écritures, sur le modèle d'`enregistrerLieuDepot` : créer, modifier,
  retirer un label ; de même un sous-traitant ; le fichier par
  `envoyerFichier` dans `documents`, `upsert: false`, un nom qui n'est
  jamais `rge` ; jamais `submitDocuments` ni `envoyerDocuments`, qui sont
  les portes du badge (CTL-5) ;
- `motifsRefusRemiseDemo` passe les labels et les sous-traitants de la
  fiche de démonstration au miroir, à côté des assurances et des lieux.

### 3.6 « Mon entreprise »

Deux sections nouvelles après « Vos lieux de dépôt des déchets »
(`MonEntreprise.js`, `FicheEmetteur.js`), chacune : un titre, une phrase,
une rangée par ligne (son intitulé ou son nom ; dessous, son état),
« Ajouter … », et un formulaire plein écran :

- `FicheLabel.js` (sur le modèle de `FicheAssurance.js`) : organisme,
  intitulé, numéro facultatif, travaux couverts (dix-neuf `Interrupteur`,
  rien de coché, les exemples en aide), date de fin (le calendrier, avec les
  flèches « année », T30), « Joindre le certificat » (Photothèque, Appareil
  photo, Fichiers), « Retirer ce signe de qualité » en deux appuis ;
- `FicheSousTraitant.js` (sur le modèle de `FicheLieuDepot.js`) : nom ou
  raison sociale, SIRET (pavé numérique, sans touche retour), « Détient-il
  un label RGE ? » en deux rangées `Option` (« Non » · « Oui », rien de
  choisi), sous « Oui » les travaux couverts, la date et « Joindre son
  justificatif » (P13 = 1) ; sous « Non », les champs du label se taisent
  mais restent dans le formulaire jusqu'à l'enregistrement, et si un label
  était rangé, la phrase de A.5 le dit (ÉCRAN-13, BASE-7) ; l'aide sur les
  données d'un tiers ;
- en lecture, deux blocs les montrent ; l'en-tête imprimé ne les imprime
  pas ;
- `NOM_DES_SECTIONS` les nomme : la porte de la carte y mène, en édition,
  SUR la section.

Le calendrier (`Calendrier.js`) gagne la prop `annees` (T30) ; les autres
écrans ne changent pas.

**Le badge public n'est pas touché** : « Modifier mon profil » garde sa
« Certification RGE » (T29). `verifier-profil` et `cas-badge.json` ne
bougent pas.

### 3.7 La saisie et la rangée

Une rangée « Énergie (label RGE) » entre « Déchets » et « Conditions », qui
ouvre la carte. Elle reste à sa place pour un client « entreprise », avec
« Sans objet pour ce client » (elle ne saute pas). Huit résumés (A.4) ×
trois suffixes = 24 gabarits, en couches. Tant qu'une liste concernée
n'est pas lue, le résumé dit « Labels ou sous-traitants non lus ».

### 3.7 bis Le câblage (ÉCRAN-4)

Chacun de ces fils a coûté un défaut en 2b-5, ou porte un contrôle à la
lettre :

1. **`recevoirEmetteur` (OpusApp) et `lireFiche` (MonEntreprise)** : la
   lecture de « Mon entreprise » remonte AUSSI les labels et les
   sous-traitants, avec le régime et les lieux. `recevoirEmetteur` et
   `surEmetteur` prennent un OBJET, `{ lieux, labels, sousTraitants }`,
   chaque clé posée seulement si elle est un tableau ou `null`. Sans cela,
   la liste ne resterait pas seulement muette : `lireRegime` GARDE les
   listes pendant une relecture, donc la carte montrerait l'ANCIENNE liste,
   et dirait « Aucun de vos signes de qualité ne porte ces travaux » d'un
   label qu'on vient de ranger (DÉDUIT par la contradiction : afficher
   faux). Les contrôles qui l'exigent à la lettre se récrivent EN LE
   DÉCIDANT : `verifier-emetteur:2792`, `:2793`, `:2795` ;
   `verifier-postes:2507` ; `mesure-devis:9181` ;
2. **la signature de la saisie** : `labels` et `sousTraitants` entrent dans
   les props ; `verifier-devis:14223` (« `lieux, onRelireRegime` » côte à
   côte) se récrit ;
3. **`RUBRIQUE_DE_L_ENERGIE` à part** (§3.2) ;
4. **la garde de sortie et « Corriger »** : les noms des quatre champs dans
   `NOMS_ENTETE` (par cohérence : la carte n'a aucun champ TAPÉ, donc
   aucun refus de l'écran à nommer ; un nom absent ferait dire la clé
   brute, mesuré par la contradiction « contrôles ») ; `CHAMPS_DE_L_ENERGIE`
   pour `etatDesChampsDuDevis` dans `majAttente` (un septième appel) ; une
   branche dans `corrigerEntete` ; `enregistrerCarte` SORT tout de suite
   pour la carte de l'énergie (elle écrit à l'appui), sinon elle tombe sur
   `refCarte`, la carte d'une ligne (`SaisieDevisScreen.js:1491-1492`) ;
   `agirSurLePoint`, `poserRetour(CARTE_POUR_REMETTRE)` ; une valeur de plus
   de l'état unique `carte` ; deux props de `BasDuDevis` ; `ouvrirEnergie`
   sur le modèle d'`ouvrirDechets` ;
5. **`OpusApp`** : deux états (`mesLabels`, `mesSousTraitants`) sur les
   trois règles de `mesLieux` (`undefined` au départ, posés par la réponse,
   remis à `undefined` sur un échec), passés à la saisie sans défaut ;
6. **`MonEntreprise`** : deux modes de plus (sept), deux drapeaux d'envoi
   lus par `fermer`, deux gardes de retrait, `aDesChangements` et
   `FICHE_EN_LECTURE` (`labels: null, sousTraitants: null`) ;
7. **la démonstration du miroir** : `motifsRefusRemiseDemo` (§3.5).

### 3.8 La carte (`EnergieDevis.js`, nouveau, sur le modèle de `DechetsDevis.js`)

Plein écran, la croix en haut, `{...CLAVIER}` (aucun champ tapé). Dans
l'ORDRE :

1. **L'introduction** (A.3) ; pour une association, une copropriété, une
   société civile, ou une réponse « à quel titre » vide, la phrase de
   prudence (DROIT-9) ; pour un client « entreprise », la seule phrase « Ce
   client commande pour son entreprise… » ; rien d'autre ne s'affiche, rien
   n'est effacé.
2. **La question et « Aucun de ces travaux » EN TÊTE** (ÉCRAN-3) : la
   pastille et sa phrase juste sous la question, avant les cases ; puis les
   dix-neuf cases (`Interrupteur`, les exemples en aide). Toucher « Aucun »
   décoche des cases posées DESSOUS et l'annonce ; toucher une case retire
   « Aucun ». Les sections suivantes tombent dessous : rien au-dessus ne
   bouge. (Dix-neuf cases font au moins 908 points, plus qu'un écran
   d'iPhone 16 : sans ce déplacement, la réponse la plus fréquente était
   hors de l'écran à l'ouverture.)
3. **Votre label RGE** (dès qu'une case est cochée), sous-titre « Pour les
   droits de votre client » : pour CHAQUE travail coché, une phrase selon
   son état (`etatsDesTravaux`, A.3) ; sous un travail `expire` ou `absent`,
   la case « Je ne détiens pas de label RGE pour ces travaux » ; sous un
   travail `sans_certificat`, aucune case (la phrase dit de joindre le
   certificat, ou de retirer le signe) ; une case déjà COCHÉE reste montrée
   tant que son travail est coché, quel que soit l'état (pour pouvoir la
   décocher) ; la porte « Mes signes de qualité ». **Sur une liste en
   lecture ou en échec, ni les phrases d'état ni une case non cochée ne se
   montrent** : on ne sait pas ce qui est couvert ; une case cochée, si
   (ses travaux viennent du devis) (ÉCRAN-10).
4. **Sous-traitance** (dès qu'une case est cochée) : la question,
   « Non » · « Oui », rien de choisi ; sous « Oui », une case par
   sous-traitant rangé (son nom ; en aide, son SIRET formaté puis son état
   — ÉCRAN-11 : deux homonymes ne se confondent plus) ; la porte « Mes
   sous-traitants » ; la phrase du plafond juste sous les cases ; les
   quatre états de la liste.
5. **L'aide de la loi et l'amende** (P14).

Trois règles de 2b-5, reprises telles quelles : **rien n'est coché
d'office** (`useState(() => etatInitialEnergie(devis))`, puis
`useRef(initial)`, `poser(` seulement depuis un appui, aucun `useEffect` ;
et `etatInitialEnergie` FAIT TOURNER sur un devis venu d'une urgence, dont
l'objet nomme un des travaux, chez un artisan dont un label couvre une
catégorie : rien de coché — CTL-10) ; **un identifiant ne s'efface que sous
le doigt, sur une liste LUE** ; **la carte s'ouvre sur la question** (vide)
**ou sur la première rubrique qui manque**.

### 3.9 La démonstration (T14)

- **Dans la fiche de démonstration, comme les lieux** (`fabriquerEmetteurDemo`,
  `copieEmetteur`, le défaut de `ficheEmetteurDemo`) : c'est la condition
  des mesures des quatre états (ÉCRAN-5, ÉCRAN-9). Un signe de qualité
  INVENTÉ — organisme « Qualifications de démonstration », intitulé « Label
  de démonstration — isolation des murs », catégorie `isolation_exterieur`,
  fin dans 45 jours (calculée), certificat joint (un chemin de
  démonstration) ; un sous-traitant INVENTÉ — « Isolations de
  démonstration », **SIRET fictif `00000496000019`** (cinq zéros en tête,
  clé juste par `cleSiretValide`, distinct de tous les SIRET de
  `siret-demo.js`, de `demo.js` et des essais SQL), qui ne détient pas de
  label. Cherchés dans le répertoire Sirene par `curl`
  (`recherche-entreprises.api.gouv.fr`) : « Isolations de demonstration »
  et « Qualifications de demonstration » : 0 résultat (23/11 et 24/11) ; le
  SIREN `000004960` : 0 résultat (24/11, trois essais justes sur quatre, le
  quatrième coupé par le mandataire). ÉTABLI. Le SIRET du v1
  (`00004999000013`) avait QUATRE zéros : il enfreignait la règle de
  `SIRETS_DEMO` (`verifier-etats.mjs:369-393`) et ressemblait aux SIRET des
  essais (CTL-4).
- `devis-demo.js` : « Muret » et « Terrasse » : `energieTravaux: ['aucun']` ;
  « Sol du séjour » : vide ; « Rénovation salle de bains » :
  `['ventilation']`, rien d'autre ; le cinquième, « **Isolation des combles
  et des murs** » (l'objet dit les deux : ÉCRAN-9), à titre privé, complet
  aux rangs 1 à 13, ses déchets REMPLIS (jamais « Non » : la vérification
  « o » de `verifier-devis` l'exige), plus ancien que « Muret » ou l'ordre
  de `mesure-devis` récrit : `['isolation_combles', 'isolation_exterieur']`,
  aucune déclaration, sous-traitance vide. **Ses lignes n'emploient aucun
  mot des cas de la mémoire des prix** (« chape », « seuil »… :
  `verifier-postes.mjs:745-759`, `:894-906`).
- **La fiche n° 1 garde `rge: true`** : l'épreuve, à l'ÉCRAN (la carte et
  la rangée), que le point sort malgré le badge — le miroir, lui, ne reçoit
  jamais la fiche (CTL-5) ; côté code, la garde est la propriété du §5.3.
- **Le « À VÉRIFIER » du v1 sur `.slice(0, 5)` est levé** : c'est
  `deLaDemande`, les brouillons rouverts depuis UNE demande
  (`devis-demo.js:1165-1169`) ; « Mes devis » en rend 201. Les vraies
  dépendances : `mesure-devis.mjs:1195` et `:1196-1198` (quatre cartes,
  rangées par position) et la vérification « o » de `verifier-devis`
  (ÉCRAN-9, CTL-16).
- **Une règle nouvelle de `verifier-demo`** : aucune marque d'organisme ni de
  signe de qualité connue (la liste, arrêtée avec J69 : Qualibat,
  Qualit’EnR, QualiPAC, QualiSol, QualiBois, QualiPV, Qualifelec, Certibat,
  Cequami, Cerqual, Afnor, Eco Artisan, « Pros de la performance
  énergétique », Promotelec), portée ÉTROITE : les fichiers de
  démonstration et les deux formulaires seulement
  (`catalogue-metiers.js:1008` porte déjà « Certification Qualibat et
  RGE », une spécialité du référentiel) ; et le contrôle de `SIRETS_DEMO`
  s'étend à `emetteur-demo.js` (CTL-4).

---

## 4. Les textes légaux (`src/data/legal.js`)

- **`VERSION`** passe de `'2026-11-21'` à la date du commit de 2b-6 (la date
  se tient au commit), avec son bloc d'historique.
- **« Ce que nous collectons »** : dans la phrase de « Mon entreprise »,
  après les lieux de dépôt, « vos signes de qualité (label RGE :
  l’organisme, l’intitulé, le numéro, les travaux couverts, la date de fin
  et le certificat), vos sous-traitants (nom ou raison sociale, numéro
  SIRET, s’ils détiennent un label RGE, pour quels travaux, jusqu’à quand,
  et leur justificatif) » ; dans la phrase des devis, après les déchets,
  « les travaux d’économies d’énergie ou d’énergie renouvelable qu’ils
  comportent, ceux pour lesquels vous déclarez ne pas détenir de label RGE,
  et si une autre entreprise fera une partie ou la totalité de leurs
  travaux, et laquelle ». `verifier-legal` relit chaque colonne des deux
  tables et des quatre colonnes dans le schéma (le modèle de la
  vérification des lieux) ; `FRAGMENT_LIEUX` reste intact.
- **« Vos documents professionnels »** (`legal.js:1855-1863`) : la liste des
  pièces gagne « les certificats de vos signes de qualité et les
  justificatifs de vos sous-traitants », et leur finalité, « vos devis »
  (DROIT-11). **La conservation** (`:2160-2180`) gagne : « Un certificat, un
  justificatif ou une attestation retiré d’une fiche reste dans votre espace
  privé jusqu’à la suppression de votre compte. » (vrai aussi des
  attestations remplacées, que les textes taisaient).
- **Les documents lisibles par l'administration** : la phrase qui le dit des
  attestations jointes (`:1730-1731`) le dit aussi des certificats et des
  justificatifs.
- **« Les clients que vous enregistrez »** : les DEUX branches (avec et sans
  contrat de sous-traitance) gagnent « Il en va de même de vos
  sous-traitants : leur nom, leur numéro SIRET et leur justificatif
  concernent une autre entreprise, qui n’a souvent pas de compte Opus. »
  **Cette phrase vient APRÈS la garantie « … ni dans l’espace
  d’administration »** (`:2034-2040`) et n'en relève pas : la garantie reste
  limitée au carnet et aux devis, et le texte le dit, parce qu'elle serait
  fausse pour le justificatif d'un sous-traitant, lisible par
  l'administration comme toute pièce de `documents` (DROIT-11, le risque vu
  par la contradiction). La phrase « le seul artisan qui y tient un carnet ou
  y prépare des devis est l’auteur de l’application lui-même » est relue sur
  la vraie base par la forme APRÈS la migration (BASE-9 : la troisième
  table n'existe pas avant).
- **P14, si 1** : dans « Ce qui est interdit », « Déclarer dans « Mon
  entreprise » un signe de qualité que son entreprise ne détient pas, ou
  pour des travaux qu’il ne couvre pas : le compte peut être fermé. »
  (156 caractères, le modèle de la phrase du n° de TVA,
  `legal.js:1383-1388`).
- **La garde `avecRge`** (`verifier-legal:3125-3127`) est RÉCRITE en le
  décidant : « RGE » se lit dans « Ce que les autres voient de vous » (la
  fiche publique) et dans « Ce que nous collectons » (les deux fragments
  ci-dessus) — et nulle part ailleurs ; la phrase de P14 ne contient pas
  « RGE » et ne l'exige pas (CTL-15). Aucun texte ne dit « certifié RGE »,
  « agréé », « Reconnu garant ».
- **Les deux gardes de 2b-4 et 2b-5, pour le label** (CTL-15) : « Une
  décision automatique » ne parle ni du label, ni d'un signe de qualité, ni
  d'un sous-traitant ; aucun texte ne promet que le label s'imprimera (rien
  ne sort avant 2c).

---

## 5. Les contrôles et les essais

### 5.1 Les nombres de référence (ÉTABLI, `methode-controles.tsv`, 23/11)

56 contrôles, 4 711 vérifications, code 0. `verifier-devis` 655,
`verifier-emetteur` 310, `verifier-legal` 268, `verifier-postes` 271,
`verifier-lectures` 183, `verifier-tarifs` 179, `verifier-remontee` 116,
`verifier-etats` 101, `verifier-demo` 30. Cliquets : `fontSize` 18/18,
`borderRadius` 21/21, espacements 342/353, `lineHeight` 53/56, linter
32/32 (zéro valeur en dur, zéro problème de linter par fichier nouveau :
les modèles copiés n'en ont aucun, mesuré par la critique « écran »).
`cas-remise.json` : 184 cas. `mesure-devis` : 1 050 mesures au dernier
passage complet.

### 5.2 Ce qui rougit en ajoutant la base, et où (à adapter EN LE DÉCIDANT)

Mesuré par la critique « base » sur une copie du dépôt au schéma de ce
cahier : `verifier-devis` 15 échecs, `verifier-legal` 2, `verifier-emetteur`
1, `verifier-lectures` 1, `verifier-remontee` 1 ; les 51 autres restent
verts.

| où | aujourd'hui | après 2b-6 |
|---|---|---|
| `verifier-devis` `CONTRAT_B2` (`:9052-9060`) | 19 clés, 13 rangs | 22 clés, 14 rangs |
| …`motifsSql.length === 19` (`:9066`) et `motifsJs.length === 19` (`:9125`) | 19 | 22 |
| …`Object.keys(D.MOTIFS_DEVIS).length === 19` (`:11776`) | 19 | 22 |
| …les longueurs des phrases (le modèle de `PHRASE_DECHETS.length === 199`) | — | 188, 187, 194 (A.1) |
| …`FORME_MOTIFS_REFUS_REMISE` (le corps entier) | rangs 1 à 13 | le corps du §2.4 |
| …`PAS_ENCORE_VERIFIE` et sa copie (`:9210`, `:9332`) | « le label RGE pour des travaux d’énergie » | A.8 |
| …`AVIS_DU_DEVIS` et sa copie (`:9293`) | huit avis | neuf |
| …§16 (contraintes `check` de `devis`) et `CONTRAINTES_ATTENDUES` | 26 ; 42 | 29 ; 45 |
| …§17 (la classe de blancs, « DOUZE ») | douze copies, six fonctions | seize, huit (T15) ; la petite classe des chemins reconnue |
| …`FERMEE.devis` (BASE-3) | 44 colonnes | 48 |
| …`AJOUTS_PERMIS` (BASE-3) | 2a, 2b-2… 2b-5 | « … et les quatre de 2b-6 (49.4 septies) » |
| …les formes d'`alter` permises (BASE-3) | vingt-sept colonnes | trente et une |
| …les six `grant` exacts, et la liste fermée des `grant` / `revoke` (BASE-3) | sans les colonnes `energie_` | avec les quatre |
| …« chaque colonne a un ÉCRIVAIN / un LECTEUR » (BASE-3) | 72 | 76 ; repassent d'elles-mêmes avec `devisVersBase` et `rowToDevis` (§3.2) |
| …la copie de l'aide de la petite entreprise (`:11450`) (DROIT-8) | « toutes les mentions dues à un particulier » | A.9 |
| …`DEFAUTS_ATTENDUS` (`:4871-4891`) et la forme copiée du cas 23 (`:5052`) | 19 lignes | 31 (§2.8 n° 19) |
| …la section 40 (invariants de la démonstration) et « m », « o » | quatre devis | cinq devis ; chaque clé du rang 14 se voit ; chaque devis écrit ses déchets |
| …chaque devis « complet » écrit à la main (13, `dechetsConcerne: false`) | — | `energieTravaux: ['aucun']` en plus |
| `mesure-devis` `PAS_ENCORE_2B5` | l'ancienne phrase | A.8 |
| …« ce devis — 6 points » | client, poste, lieu, validité, prix du devis, déchets | « 7 points » : … et énergie |
| …« Mes devis », `:1195` (quatre cartes) et `:1196-1198` (leur ordre) ; « quatre devis à la fin » | 4 | 5 |
| …`surEmetteur` à deux arguments (`:9181`) | lieux | l'objet de §3.7 bis |
| `generer-cas-remise` `COMPLET` | répond « Non » aux déchets | répond aussi « Aucun » à l'énergie ; §5.5 |
| `essais-section-49-remise.sql` | 38 erreurs annoncées, 364 | §5.4, recompté |
| `essais-section-49.sql` cas 1 et cas 2 ; `essais-section-49-conditions.sql` cas 18 et 23 | 44 colonnes, 42 contraintes ; 51 colonnes dans les droits, 27 défauts | 48, 45 ; 55, 31 |
| `verifier-legal` `NOMMEES_DEVIS` (`:2738-2826`), `CLASSEMENT`, la garde `avecRge` | — | §2.8, §4 |
| `verifier-emetteur` le compte des `check (` de la section 46 | — | neuf de plus |
| `verifier-lectures` `EMPREINTES.mes_donnees` ; `verifier-remontee` `EXCLUES` | — | §2.5, §2.8 |

### 5.2 bis Ce que l'écran fait rougir (ÉCRAN-4, CTL-12)

| où | ce qui change |
|---|---|
| `verifier-emetteur:2792`, `:2793`, `:2795` (la signature `(emetteur, lieux)` et l'appel de `surEmetteur`) ; `verifier-postes:2507` (le bloc de `recevoirEmetteur` cherché par sa chaîne exacte) | l'objet `{ lieux, labels, sousTraitants }` (§3.7 bis, point 1) |
| `verifier-devis:14223` (« `lieux, onRelireRegime` » côte à côte) | les props `labels`, `sousTraitants` |
| `verifier-devis` « l » et « l bis » (`RUBRIQUE_DU_CHAMP` exactement les huit des déchets) | inchangée : `RUBRIQUE_DE_L_ENERGIE` à part |
| …l'état de la saisie écrit à la lettre (`:11007`), « SIX appels » à `etatDesChampsDuDevis` (`:11237-11241`) | `etatEnergie`, un septième appel |
| …« `devis.js` n'écrit jamais « € » », trois exceptions (`:1526-1536`) | quatre, si P14 = 1 ou 2 (l’amende du label ; celle de la sous-traitance n’écrit pas « € ») |
| …les bornes de `devis.js` comparées au SQL (`:3845-3857`), écrites en dur | `SOUS_TRAITANTS_MAX` et le nombre de catégories y entrent |
| …les importations de `devis.js` (`:1480-1492`) ; `verifier-emetteur` `permis` (`:290-296`) | `../data/travaux-energie.js` (T28) |
| `verifier-emetteur` « neuf exports » (`:2091-2101`), « neuf composants » (`:2233`), le retrait en deux appuis (`:2519`), le formulaire et le `maxLength` de SA colonne (`:2676-2711`), le mode `lieu` de `MonEntreprise` (`:2710`) | les deux formulaires, les six exports |

### 5.3 Ce qui s'ajoute (estimation DÉDUITE)

`verifier-devis` +60 à +80 ; `verifier-emetteur` +40 à +55 ;
`verifier-legal` +15 à +20 ; `verifier-demo` +3 à +5 ; `verifier-etats`
+2 ; `verifier-lectures` +2 ; `verifier-postes` 0 à +1 ; total **≈ +120 à
+165** dans `npm run verifier`.

Les vérifications qui comptent le plus, chacune avec la propriété qu'elle
tient :

1. le miroir sur la sortie de la base (`cas-remise.json`, §5.5) ;
2. `etatsDesTravaux` et `rubriquesDeLEnergie` seules écritures de la règle
   (aucune autre fonction ne compare un label à un travail) ;
3. **`etatDuLabel` d'accord avec `etatsDesTravaux`, `etatDuSousTraitant`
   avec `sousTraitantComplet`**, faits tourner sur un même jeu (CTL-8) ;
4. **les listes de clés** : `devis_energie_travaux_check` (`aucun` en tête,
   puis les clés), `devis_energie_sans_label_check`,
   `emetteur_label_categories_check`, `emetteur_sous_traitant_categories_check`
   et la liste de prudence du corps comparées à `TRAVAUX_ENERGIE`, contenu
   ET ordre ; chacune éprouvée en retirant une clé d'elle seule
   (BASE-8 : le modèle de `verifier-devis:3874-3877` et de
   `verifier-emetteur:1879-1890`) ;
5. **`FORMES_46`** : les neuf contraintes nouvelles de la section 46
   comparées entières, espaces réduits (CTL-7) ;
6. la garde TVA (§2.6), dans le corps SQL, par les signatures et dans le
   JavaScript ;
7. **la garde du badge côté JavaScript** (CTL-5) : aucun des trois fichiers
   nouveaux, ni le corps de `etatsDesTravaux`, `rubriquesDeLEnergie`,
   `motifDeLEnergie`, `etatInitialEnergie`, `etatDuLabel`,
   `etatDuSousTraitant` et des six écritures d'`api.js`, ne nomme un
   identifiant du badge (`rge`, `rgeDeclare`, `rgeExpire`, `rgePath`,
   `rgeNumero`), ni `submitDocuments`, ni `envoyerDocuments` ; l'envoi du
   certificat porte un nom qui n'est pas `rge` ;
8. **le vocabulaire** (T10, CTL-6) : sur les CONSTANTES des textes de 2b-6
   (la carte, les deux sections, les deux formulaires, les phrases du rang
   14, les amendes, les libellés et exemples des dix-neuf catégories) ;
9. rien de coché d'office (§3.8), avec l'origine et l'objet PRÉSENTS
   (CTL-10), la signature exacte et la forme exacte de la carte ;
10. les listes de tables et de fichiers (§2.8, §2.8 bis), et les deux
    propriétés « section 46 » (CTL-11) ;
11. la forme de la lecture unique (`monEmetteurSupabase`, une lecture par
    table, jamais deux) et de la remontée de « Mon entreprise » (§3.7 bis) ;
12. `etatDesLieux` appelée pour les deux listes, jamais une autre écriture
    des quatre états ;
13. le plafond des sous-traitants sur la liste REBÂTIE ;
14. les amendes mot pour mot (P14), avec des espaces insécables entre les
    chiffres et devant « € », et l'amende ABSENTE de la phrase de la
    sous-traitance (DROIT-23) ;
15. l'aide de la petite entreprise et celle de « à titre privé » mot pour
    mot (T27).

### 5.4 Les essais (joués deux fois, à la main)

- **`essais-section-46.sql`** : les deux tables (RLS, droits, déclencheurs,
  le rognage du chemin, ménage de compte), sur le modèle du cas 22 quater ;
  les cas 26, 26 bis, 29, 30 et les deux listes `nomment_les_…` (§2.8).
- **`essais-section-49-remise.sql`** (CTL-1, le modèle que l'archive de
  2b-5 corrigeait déjà, `docs/CAHIER-LOT-2B-5.md:94-95`) :
  - le décor `devis_complet` reçoit `energie_travaux` à `{aucun}` ;
  - le cas 10 (« LES NEUF RANGS », son devis inséré à la main) reçoit
    `{aucun}` aussi ;
  - les trois devis D4-c des cas 13, 23 et de la preuve du cas 26 restent
    SANS réponse, et `devis_energie` entre dans leurs listes attendues (la
    preuve D4-c couvre le motif nouveau contre l'origine) ;
  - le cas 24 devient « LES QUATORZE RANGS À LA FOIS », 14 lignes ;
  - **les cas nouveaux sont le 27** : les 58 cas de l'annexe B.1 et B.3 (la
    forme `prepare … execute`, `set local role` dans son propre ordre,
    jamais dans un `do`), dont les enveloppes `security definer` des cas 14,
    23, V21 ; les refus des trois contraintes ; **« LE COMPTE » devient le
    28** ;
  - dans `verifier-devis`, l'expression des variables passe à
    `e(?:1[2589]|2[567])`, les variables nouvelles entrent dans
    `declarees`, l'en-tête et le compte annoncé changent ensemble ;
  - le cas 14 c : la liste du §2.4 et ses mots interdits.
- **`essais-section-49.sql`**, **`-conditions`**, **`-rattrapage`** : les
  comptes de colonnes et de contraintes (§5.2).
- **`essais-section-51d.sql`** (J1, J1 quater) et
  **`essais-suppression-compte.sql`** : les deux clés d'export ; un label et
  un sous-traitant partent avec le compte.
- **`essais-section-43.sql`** : les deux fonctions de déclencheur non
  exécutables.

### 5.5 La parité (`generer-cas-remise`)

Les gardes que 2b-4 et 2b-5 ont dû écrire après coup, écrites d'avance
(CTL-2) :

- (a) **les 184 cas d'avant gardent leur numéro, ET aucun ne porte le rang
  14** (sans elle, un `COMPLET` qui oublierait « Aucun » ferait gagner
  `devis_energie` à tous, des DEUX côtés, et la parité resterait verte : la
  leçon S5 de 2b-4) ;
- (b) une clé au plus au rang 14, chacune avec sa nature ;
- (c) le triplet D4-c : un devis NEUF VIDE SANS RÉPONSE AUX TRAVAUX, trois
  origines, la même liste, `devis_energie` compris ;
- (d) la couverture, lue sur la ligne brute : le label de B SEUL (le point
  reste), le sous-traitant de B SEUL, un sous-traitant orphelin seul, un
  label sans certificat (déclaré ou non), un label expiré déclaré, « Aucun »
  avec des déclarations et des sous-traitants restés (rien), « Non » avec
  des identifiants (rien), chacune des deux réponses « entreprise » avec un
  travail (rien), une réponse vide (la prudence), une ligne de prudence
  seule (la prudence à titre privé), **une déclaration vide de valeur avec
  un travail non couvert** (la forme `is not true`), **un sous-traitant
  labellisé sans date n'existe pas en base** (la croisée) — donc ce cas-là
  vit dans l'essai seul ;
- (e) le format : deux champs `labels` et `sousTraitants` (toutes les
  lignes, A et B, posées en superutilisateur AVANT `set local role`, le
  modèle des lieux), le texte `LISEZ_MOI`, et `rowToDevis` qui connaît les
  quatre champs AVANT la régénération ;
- **les dates des labels et des sous-traitants sont 2001 ou 2999
  seulement** (BASE-5, la garde des assurances, `generer-cas-remise.mjs:855-862`) :
  le miroir de `npm run verifier` rejoue le fichier au jour du téléphone, et
  une date proche le ferait rougir dès le lendemain, sur GitHub aussi. **Les
  cas « au jour de Paris »** (07, 08, V02, V03, V08 et leurs jumeaux pour un
  sous-traitant) **restent dans l'essai 49-remise seul.**

`COMPLET` répond « Aucun » ; ≈ 40 cas nouveaux (DÉDUIT) ; `--verifier` :
0 écart, à la main.

### 5.6 `mesure-devis` (au navigateur, en démonstration)

Dix à douze sections (≈ 120 à 150 mesures, DÉDUIT) :

- la rangée à 393 et à 320 points dans ses huit résumés (elle ne saute
  pas) ;
- la carte qui s'ouvre sur la question pour « Sol du séjour », sur le label
  pour « Isolation des combles et des murs » ;
- **« Aucun de ces travaux » DANS l'écran visible à l'ouverture**, à 393 et
  à 320 (ÉCRAN-3) ; « Aucun » qui retire et s'annonce ;
- les quatre phrases d'état d'un travail ; la case de déclaration sous un
  travail absent ou expiré, jamais sous un travail sans certificat ; la case
  cochée qui éteint le point, puis un travail ajouté qui le rallume ;
- « Oui » à la sous-traitance, le sous-traitant coché (son SIRET en aide),
  le point qui s'éteint ; le onzième refusé, sa phrase sous les cases ;
- **les quatre états des DEUX listes** (en échec, en lecture : rien n'est
  dit, aucune case non cochée ; vide ; lue) **et la lecture tardive de
  « Mon entreprise »**, le modèle des sections `:9022` et `:9116-9190` des
  lieux, avec deux crochets de démonstration à côté de `__opusLieux` (une
  ligne de label se reconnaît à `categories`, un sous-traitant à
  `label_detient`) (ÉCRAN-5) ;
- les deux portes vers « Mon entreprise », et le retour ; les deux
  formulaires (le SIRET à clé fausse refusé, les flèches « année », le
  certificat ; « Non » qui annonce le retrait du label) ;
- l'avis du label ; « Pas encore vérifié » ;
- **le bloc « À quel titre ? » remesuré** avec ses deux aides nouvelles
  (T27 ; 120 points dans ses sept états à 393 aujourd'hui) ;
- aucune cible sous 44 points en édition ; un client « entreprise » :
  « Sans objet pour ce client ».

### 5.7 Les sabotages (chacun refusé par le contrôle nommé)

| n° | le défaut posé | refusé par |
|---|---|---|
| S1 | `not in` au lieu de `in` dans la condition du rang 14 | `verifier-devis` (forme) ; `cas-remise --verifier` ; essai cas 29 |
| S2 | `not (c.cle = any (v_energie_sans))` au lieu de `is not true` | forme ; parité (la garde de couverture) ; essai (mesuré : 11 cas, dont V18) |
| S3 | le filtre `g.pro_id = v_pro` retiré | essai cas 14 (l'enveloppe) ; `verifier-emetteur` (lecture à la lettre) |
| S4 | le filtre `s.pro_id = v_pro` retiré | essai cas 23 ; `verifier-emetteur` |
| S5 | `count(s.id)` au lieu de `count(distinct s.id)` | essai cas 25 ; parité |
| S6 | « au moins un complet » au lieu de « tous complets » | essai cas 21 ; parité |
| S7 | `g.justificatif_chemin is not null` retiré de « couverte » | essai cas 06 ; parité |
| S8 | `>=` devient `>` sur la date du label | essai cas 08 ; parité |
| S9 | `professionnel_hors_activite` ajouté à la liste du rang 14 | essai cas 30 ; parité ; forme |
| S10 | le rang 14 lit `taux_tva_centiemes` (ou `devis_tva`) | `verifier-devis` (garde TVA) ; essai cas 14 c |
| S11 | `cleDuTauxDeLaLigne` reçoit le devis, ou lit `energieTravaux` | `verifier-devis` (signatures et appelants, CTL-17) |
| S12 | le rang 14 lit `professional_profiles.rge` | essai cas 14 c (mot interdit) ; `verifier-devis` |
| S13 | `devis_energie_travaux_check` accepte le tableau vide | essai c01 ; `verifier-devis` §16 (forme) |
| S14 | `aucun` accepté avec une autre clé | essai c02 ; `verifier-devis` |
| S15 | `devis_energie_sans_label_check` accepte `aucun` ou le tableau vide | essai k01, k02 ; `verifier-devis` |
| S16 | une valeur par défaut sur `energie_travaux` | `verifier-devis` (aucun `default` sur `devis`) ; relevé APRÈS |
| S17 | `emetteur_labels` retirée de `PRIVEES` (`verifier-legal`) ou du cas 26 bis | les deux propriétés « section 46 » (CTL-11) ; `verifier-emetteur` (relit les alternations) |
| S18 | la politique « mes labels » écrite `using (true)` | essai 46 ; `verifier-emetteur` |
| S19 | `revoke all … from anon` retiré d'une des deux tables | essai 46 ; `verifier-emetteur` ; `verifier-legal` |
| S20 | le déclencheur des sous-traitants n'efface plus le label sous « Non » | essai 46 ; `verifier-emetteur` (forme) |
| S21 | le déclencheur ne pose plus `created_at` | essai 46 ; `verifier-emetteur` |
| S22 | `etatInitialEnergie` coche d'après `devis.source` (ou l'objet) | `verifier-devis` (fait tourner avec l'origine et l'objet présents, CTL-10) |
| S23 | un `poser(` dans un `useEffect` de `EnergieDevis.js` | `verifier-devis` (forme de la carte) ; `mesure-devis` |
| S24 | `travauxApresAppui` rend `[]` à la dernière case | `verifier-devis` (fait tourner) |
| S25 | le plafond compté sur ce que la carte garde (orphelins compris) | `verifier-devis` (fait tourner) |
| S26 | une deuxième écriture de l'état d'un travail dans `EnergieDevis.js` | `verifier-devis` (seule écriture) |
| S27 | « agréé » dans une constante des textes de « Mon entreprise » | `verifier-devis` (vocabulaire) |
| S28 | `PAS_ENCORE_VERIFIE` garde l'ancien fait | `verifier-devis` (copie) ; `mesure-devis` |
| S29 (v2) | l'avis du label ATTEND la liste sûre | `verifier-devis` (avis faits tourner « même liste en lecture », le D11b de 2b-4) |
| S30 | `monEmetteurSupabase` lit les labels deux fois | `verifier-emetteur` ; `verifier-postes` |
| S31 | une table absente rend `[]` | `verifier-postes` (injecte `tableAbsente`) |
| S32 | `mes_sous_traitants` absente de l'export | `verifier-lectures` ; essai 51d |
| S33 | « Ce que nous collectons » ne nomme plus le SIRET d'un sous-traitant | `verifier-legal` (colonnes relues) |
| S34 | la garde `avecRge` supprimée | `verifier-legal` (récrite, pas retirée) |
| S35 | `AMENDE_DU_LABEL` sans espaces insécables | `verifier-devis` |
| S36 (v2) | « Qualibat » dans `emetteur-demo.js` ; puis un SIRET de sous-traitant à QUATRE zéros | `verifier-demo` (la règle des organismes) ; `verifier-etats` (`SIRETS_DEMO` étendu) |
| S37 | l'amende recopiée dans la phrase de la sous-traitance | `verifier-devis` (mot pour mot, DROIT-23) |
| S38 | la condition « sans certificat » retirée du corps | essai V01, V04 (mesuré) ; parité |
| S39 | `s.label_valide_jusquau < v_jour` au lieu de `is not true` | essai V22 (mesuré) ; forme |
| S40 | la croisée des sous-traitants relâchée (`or label_detient is null`) | `verifier-emetteur` (`FORMES_46`) |
| S41 | la nature suit le seul client (les lignes de prudence en « La loi ») | essai V12, V13, V16 (mesuré) ; parité |
| S42 | `etatDuLabel` oublie le chemin | `verifier-emetteur` (accord avec `etatsDesTravaux`, CTL-8) |
| S43 | la carte affiche « Couvert » d'après `pro.rge` | `verifier-devis` (garde du badge, CTL-5) |
| S44 | `EnergieDevis.js` absent de `FICHIERS_DU_MODULE`, et « un an » sans opposition dans la carte | la liste relue ; la règle de « un an » |
| S45 | le SIRET sur pavé numérique avec une touche retour | `verifier-emetteur` (§2.8 bis) |
| S46 | « vérifié » ou « registre » dans un formulaire | `verifier-etats` (`DEVIS` étendu) |
| S47 | `COMPLET` sans « Aucun » dans le générateur | la garde (a) du générateur |
| S48 | le miroir oublie `proId` pour un label | la garde (d) ; parité |
| S49 | le miroir lit l'origine au rang 14 | la garde (c) ; parité |
| S50 | un champ de l'énergie retiré de `NOMS_ENTETE` | `verifier-devis` (« l » de l'énergie) |
| S51 | un résumé de la rangée hors de `GABARITS_DE_L_ENERGIE` | `verifier-devis` |
| S52 | toucher « Aucun » ne retire pas les cases | `verifier-devis` (fait tourner) ; `mesure-devis` |
| S53 | `recevoirEmetteur` ne pose que les lieux | `verifier-emetteur` (l'objet) ; `mesure-devis` (lecture tardive) |
| S54 | une égalité stricte sur `energieSansLabel` dans la carte | `verifier-devis` (ÉCRAN-12) |
| S55 | une clé retirée d'une seule des cinq listes de clés | `verifier-devis` ou `verifier-emetteur` (BASE-8) |

---

## 6. La migration

Construite par un script (le modèle de `lot2b5/migration/construire.py`)
qui PREND chaque morceau dans le `schema.sql` de l'arbre ; **l'imitation
est le `schema.sql` de `c753b2a`**, identique octet pour octet à celui de
`66b2e9b` (md5 `0a9599698954c1cbdc99abcdf88d28c1`), ce que porte la vraie
base depuis 2b-5.

Elle porte, dans l'ordre :

1. `set local lock_timeout = '5s'` en tête ;
2. les sections 46.2 ter et 46.2 quater : les deux tables, leurs index, la
   RLS, les neuf contraintes **sous condition** (`pg_constraint`, `conname`
   ET `conrelid`) dans des blocs `do`, les deux fonctions et leurs
   déclencheurs (`create or replace trigger`), les deux politiques **sous
   condition** (`pg_policies`), les `revoke` en toutes lettres, les
   commentaires ;
3. les quatre colonnes de `devis`, sans défaut, et leurs commentaires ;
4. les trois contraintes de `devis`, sous condition ;
5. le `revoke all … from anon, authenticated` de 49.7 et ses six `grant`,
   rejoués ;
6. `motifs_refus_remise` remplacée, même signature, ses droits et son
   commentaire ;
7. `mes_donnees()` remplacée, même signature, ses droits ;
8. le balayage de la section 43, en DERNIER.

Aucun ordre qui commence par `drop`, `delete` ou `truncate` (corps
compris) ; les « drop » permis sont AU MILIEU d'un ordre. Aucune barre
oblique inverse ; aucun `begin`/`commit` ; aucun rattrapage : les colonnes
naissent vides, c'est-à-dire dans le cas le plus protecteur.

**La taille** (BASE-12) : la migration approchée de la critique « base »
pèse 54 016 octets SANS les commentaires nouveaux ; avec eux et la forme
gardée, **58 à 60 Ko, DÉDUIT**, à mesurer sur la migration construite. Le
plus gros envoi déjà passé en un appel fait 60 145 octets (2b-2) : ce n'est
pas une limite connue, seulement le plus gros essayé. Si elle le dépasse,
le dire avant de l'envoyer.

**Forme gardée** : un `do` qui compare le md5 du texte REÇU (après la règle
du transport du connecteur) à celui du fichier simulé et n'exécute rien
s'il diffère ; dix sabotages de la garde refusés ; la contre-épreuve (un
`default` glissé, md5 recalculé) passe la garde, et c'est le relevé APRÈS
qui la voit.

**Simulée** deux fois sur une imitation AVEC DONNÉES : empreinte étroite et
large identiques à une base NEUVE au schéma de l'arbre, l'ordre physique
des colonnes identique, **aucune ligne réécrite** (`ctid:xmin`,
`relfilenode`), les essais identiques. Un second regard indépendant refait
la preuve.

**Verrous, MESURÉS** (BASE-12, rejoué par la contradiction sur une imitation
neuve) : ACCESS EXCLUSIVE sur `devis` (une LECTURE de devis attend aussi :
« Mes devis » reste en chargement), SHARE ROW EXCLUSIVE sur
`professional_profiles` (les deux clés étrangères : toute écriture d'une
fiche attend), ACCESS SHARE sur environ 35 tables (`mes_donnees()`). Une
écriture de fiche en cours fait échouer la migration en 5 s (55P03, rien
d'appliqué) : **Opus fermé**. Non mesuré sur PostgreSQL 17.

**Sur la vraie base** : relevé AVANT par `SupabaseLecture` (0 requête
active, 0 transaction ouverte, 0 session illisible, le rôle qui voit toutes
les sessions ; les deux tables absentes, 44 colonnes sur `devis`, les md5
de `motifs_refus_remise` et de `mes_donnees` ; le nombre de `pro_id`
distincts dans `clients` et `devis`) ; relevé COMPLÉMENTAIRE avant ET après
(comptes, `max(modifie_le)`, `max(generation)`, md5 des `id:xmin`,
`relfilenode`, ACL) ; la migration par `apply_migration`, Opus fermé, avec
l'accord du propriétaire ; relevé APRÈS identique à la simulation au
caractère près, **et `pro_id` distincts dans `emetteur_sous_traitants`
(attendu 0)** (BASE-9). **MAINTAIN** : un second appel prêt, idempotent,
envoyé SEULEMENT si le relevé après le demande (en 2b-5, il ne l'a pas
demandé). **Puis les conseillers de sécurité et de performance de
Supabase** (`get_advisors`), relus : aucune alerte nouvelle sur les deux
tables.

Ensuite : `git pull`, `npx expo start -c` ; aucun module natif ; les
avertissements « NE PAS FAIRE git pull » des commits sont levés dans
CLAUDE.md.

---

## 7. L'essai sur la vraie base, et les questions pour l'iPhone

**Par `curl` seulement**, la clé publiable et le jeton de chaque compte :
deux artisans jetables (`…@exemple-opus.test`) à Brest, sur les deux
preuves SIRET d'essai déjà en base (**SIRET fictifs `00004800900013` et
`00004802500019`** ; jamais le SIRET d'une vraie entreprise), un
particulier ; le régime réel déclaré avant le premier poste ; chaque
écriture avec un numéro croissant ; `enregistrer_vues` jamais appelée ;
aucun jeton journalisé.

À chaque pas, la liste de la base comparée au miroir `motifsDeRemise`
nourri de ce que l'application lit. Le parcours : la question vide
(`devis_energie`) ; « Aucun » ; un travail, rien d'autre (`…_mentions`) ;
un label sans certificat, puis la déclaration (le point RESTE), puis une
vraie PDF envoyée dans `documents` (le point part), puis une date passée,
puis la date du jour de Paris ; la déclaration d'un travail, puis un
second travail coché (le point revient) ; le photovoltaïque seul
(`…_prudence`) ; la sous-traitance « Oui » sans choix, puis un
sous-traitant sans réponse, puis « Non » ; le sous-traitant de B dans le
devis de A (accepté, jamais compté) ; une association (`…_prudence`) ; un
client « pour son entreprise » (rien) ; chaque contrainte refusée sous son
nom, l'horloge et les colonnes relues identiques après ; B lit, modifie,
supprime les deux tables de A (`[]`, 204 et 0 ligne, 403 au nom de A) ; un
visiteur (401) ; l'export (les deux clés, rien de l'autre) ; un SIRET
« 000 480 090 00013 » rangé sans espaces ; un chemin suivi d'une espace,
rangé rogné. Le ménage par le chemin de l'application, le certificat et le
justificatif retirés de `documents` ; puis un SECOND agent contrôle le
compte rendu contre le journal.

**Les questions pour l'iPhone** (le build de développement, son compte
principal) :

1. la carte : « Aucun de ces travaux » visible à l'ouverture, en tête ;
   dix-neuf cases au pouce, lisibles à 320 points ;
2. la rangée « Énergie (label RGE) » qui ne saute pas ;
3. la case « Je ne détiens pas de label RGE pour ces travaux » sous le bon
   travail ;
4. le formulaire d'un signe de qualité : le calendrier et ses flèches
   « année », « Joindre le certificat » par la Photothèque, l'Appareil photo
   et Fichiers ;
5. le formulaire d'un sous-traitant : le pavé numérique du SIRET, une clé
   fausse refusée, la phrase sous « Non » ;
6. les deux portes vers « Mon entreprise », et le retour : la liste à jour
   tout de suite ;
7. VoiceOver : les cases (« coché » en français ?), l'annonce de « Aucun »,
   la phrase du plafond ;
8. ses trois brouillons : le point « Par prudence », éteint par « Aucun ».

---

## 8. Ce que 2b-6 ne fait PAS

- **Rien n'est imprimé, numéroté ni remis** : la phrase « détient un signe
  de qualité… délivré par… », l'annexe du certificat et des justificatifs,
  l'identité des sous-traitants sur le document — tout cela est 2c, et se
  relit au juriste.
- **La phrase des conséquences** (L. 224-114 I) est une conclusion de droit
  qui dépend de la situation du client. La doctrine du plan est « Opus ne
  compose aucune de ces mentions » (`docs/PLAN-DEVIS.md:230`), étendue en
  2b-5 à « aucune phrase qui tire une conclusion de droit »
  (`docs/CAHIER-LOT-2B-5.md:280`). Elle a déjà une exception prévue pour 2c
  (la certification du taux réduit). **Celle-ci en serait une autre, ou un
  texte que l'artisan écrit : à décider avec le propriétaire avant 2c, avec
  J43 et J75** (DROIT-13). L'aide de la déclaration ne promet donc rien de
  plus que « le devis le dira à votre client ».
- **2027** : la certification « entreprise principale » (01/01/2027) se
  rangera dans `emetteur_labels` avec ses catégories (du 1° au 15°,
  `arrete-2015-12-01-complet.txt:694`), mais il faudra une **colonne de
  nature** (qualification, certification, entreprise principale), par une
  migration ; l'« attestation chantier » (01/03/2027) demandera un
  justificatif propre à un devis. À `docs/A-FAIRE.md` avec la date et J66
  (DROIT-18).
- **L'avis d'échéance n'existe que pour le label de l'artisan** : un avis
  jumeau pour le label d'un sous-traitant choisi, à `docs/A-FAIRE.md`
  (DROIT-20).
- **L'annuaire RGE de l'ADEME** n'est pas lu (une fonction Edge et
  l'ouverture de `data.ademe.fr` ; un lot à part).
- **Le badge public** « Certification RGE » et ses quatre défauts connus : à
  A-FAIRE, hors de 2b-6.
- **L. 223-8** (la prospection) et **L. 122-26** (la publicité) : hors du
  devis.
- **Aucune proposition tirée des lignes** (« laine de verre 200 mm » ne
  coche rien) ; aucun avis de contradiction entre les lignes et la liste.
- **Aucune consolidation** de la classe de blancs (T15).
- **À `docs/A-FAIRE.md`, en plus** : la borne commune des dates de fin
  (labels, sous-traitants, assurances : BASE-11) ; l'état « Expirée le
  {date} » des assurances, ambigu d'un jour comme l'était celui du v1
  (DROIT-16, à ne pas copier) ; le fichier d'un tiers orphelin dans
  `documents` après un « Non » ou un retrait (BASE-7) ; le sous-traitant
  de l'Union sans SIRET (T19).

---

## Annexe A — Les textes (apostrophe ’ ; guillemets « » ; longueurs en caractères, mesurées par `node` le 24/11, `lot2b6/essai-v2/textes.mjs` et `phrases.mjs`)

### A.1 Les motifs du rang 14

| clé | nature | longueur | phrase |
|---|---|---|---|
| `devis_energie` | prudence | 188 | Dites quels travaux d’énergie de la liste ce devis comporte, ou « Aucun de ces travaux ». La loi demande alors si vous détenez un label RGE ; Opus ne sait pas encore si ce devis en relève. |
| `devis_energie_mentions` | loi | 187 | Dites si vous détenez un label RGE pour les travaux d’énergie cochés, et si un sous-traitant fera tout ou partie de ce devis : la loi le demande pour un client qui commande à titre privé. |
| `devis_energie_mentions_prudence` | prudence | 194 | Dites si vous détenez un label RGE pour les travaux cochés, et si un sous-traitant fera tout ou partie de ce devis. La loi le demande à titre privé ; Opus ne sait pas encore si elle vise ce cas. |

Mesuré : moins de 200 caractères (la borne de `verifier-devis:11764-11772`),
aucun chiffre, aucun « € », aucune apostrophe droite, aucune espace
insécable, un point final ; les deux prudences disent « Opus ne sait pas
encore » (`:9110`). La première dit « si vous détenez », jamais « votre
label » (la loi dit « s'il détient ou non » : DROIT-17). « Ce cas » couvre
à la fois le client et les deux lignes de prudence (DROIT-2). « Avec son
label », pour les sous-traitants, va dans la carte, pas dans le motif. Le
bouton : « Compléter : énergie et label RGE » (32).

### A.2 Les catégories

Le tableau du §3.1. Libellés : de 16 (« Fenêtres de toit ») à 102 (le 3° et
le 4°) ; le 11° passe de 104 à 88 (ses exemples quittent le libellé) ; la
pastille « Aucun de ces travaux » (20). La ligne la plus longue est à
mesurer à 320 points (DROIT-14).

### A.3 La carte « Énergie et label RGE »

| texte | longueur |
|---|---|
| titre : « Énergie et label RGE » | 20 |
| introduction : « Pour des travaux d’économies d’énergie ou d’énergie renouvelable chez un client qui commande à titre privé, la loi demande de dire sur le devis si vous détenez un label RGE, et qui fera les travaux. » | 198 |
| pour une association, une copropriété, une société civile : « Pour une association, une copropriété ou une société civile, la loi ne prévoit peut-être pas ces mentions ; Opus les demande, par prudence. » | 139 |
| pour une réponse « à quel titre » vide : « Tant que vous n’avez pas dit à quel titre ce client commande, Opus les demande, par prudence. » | 93 |
| pour un client « entreprise » : « Ce client commande pour son entreprise : la loi ne demande pas ces mentions. Ce que vous avez déjà écrit est gardé. » | ≈ 115 |
| sous-titre : « Pour les droits de votre client » (DROIT-9 : jamais « Pour la loi », qui ne vise qu'à titre privé) | 32 |
| question : « Quels travaux d’économies d’énergie ou d’énergie renouvelable ce devis comporte-t-il ? » | 86 |
| la pastille, EN TÊTE : « Aucun de ces travaux » ; dessous : « Seulement si ce devis ne comporte aucun des travaux ci-dessous. » | 20 ; 63 |
| et, si P12 = 1, sous la pastille : « Même alors, si une autre entreprise fait une partie de travaux d’économies d’énergie de ce devis, dites-le à votre client : la loi peut le demander. » | 148 |
| aide de la liste : « Cochez ce que vous ferez dans un logement, même une petite partie : un doublage isolé, une VMC, une fenêtre. Les deux dernières lignes sont comptées par prudence. Dans le doute, cochez : c’est le cas le plus sûr. » | 212 |
| aide du 17° : « Ne cochez pas cette ligne parce que le devis réunit plusieurs des travaux ci-dessus : cochez chacun d’eux. » | 106 |
| annonce : « Les travaux cochés ont été retirés. » | 35 |
| sous-titre : « Votre label RGE » | 15 |
| couvert : « Déclaré dans « Mon entreprise » : {intitule}, valable jusqu’au {fin} » (DROIT-16 : jamais « Couvert par », qui affirme ce qu'Opus ne vérifie pas) | 68 sans ses trous |
| sans certificat : « Votre signe de qualité « {intitule} » porte ces travaux, mais son certificat n’est pas joint : joignez-le dans « Mon entreprise », ou retirez-le si vous ne le détenez plus. » | 172 |
| expiré : « Votre signe de qualité « {intitule} » portait ces travaux jusqu’au {fin} : renouvelez-le dans « Mon entreprise » si vous le détenez encore. » | 139 |
| absent : « Aucun de vos signes de qualité ne porte ces travaux. » | 52 |
| la case, sous un travail expiré ou absent : « Je ne détiens pas de label RGE pour ces travaux » | 47 |
| son aide : « Cochez seulement si c’est vrai : le devis le dira à votre client. » (DROIT-13 : sans promesse sur les aides) | 65 |
| « Vos signes de qualité n’ont pas pu être lus. » · « Réessayer » | 44 |
| « Vous n’avez déclaré aucun signe de qualité. » | 43 |
| porte : « Mes signes de qualité » | 21 |
| sous-titre : « Sous-traitance » | 14 |
| question : « Une autre entreprise fera-t-elle une partie, ou la totalité, des travaux de ce devis ? » — « Non » · « Oui » | 86 |
| « Laquelle, ou lesquelles ? » | 25 |
| une case : le nom ; en aide, le SIRET formaté (`formaterSiret`) puis l'état (A.5) | — |
| « Vos sous-traitants n’ont pas pu être lus. » · « Réessayer » | 41 |
| « Vous n’avez encore aucun sous-traitant. » · « Ajouter un sous-traitant » | 39 |
| porte : « Mes sous-traitants » | 18 |
| plafond : « Dix sous-traitants au plus par devis : décochez-en un pour en choisir un autre. » | 79 |
| aide : « La loi demande de nommer, avant la signature, chaque entreprise qui fera une partie des travaux de ce devis, et de dire si elle détient un label RGE. » | 149 |
| amende du label (P14 = 1 ou 2) : « Pour un client qui commande à titre privé, sans ces informations, le contrat est nul, et votre entreprise s’expose à une amende administrative pouvant aller jusqu’à 15 000 €, 75 000 € pour une société. » | 201 |
| amende de la sous-traitance (P14 = 1 ou 2) : « Pour un client qui commande à titre privé, sans ces informations, le contrat est nul. » (jamais d'amende : la loi n'en prévoit pas, DROIT-23) | 85 |

Dans le code, les espaces entre « 15 » et « 000 », « 75 » et « 000 », et
devant « € », sont INSÉCABLES (la règle d'`AMENDE_DES_DECHETS`). La borne
de 200 caractères ne vaut que pour les phrases du point, pas pour l'aide.

### A.4 La rangée « Énergie (label RGE) »

Titre « Énergie (label RGE) » (19), que le résumé ne répète pas. Huit
résumés :

| résumé | quand |
|---|---|
| « Sans objet pour ce client » | une réponse « entreprise » |
| « Aucun de ces travaux » | `{aucun}` |
| « Travaux d’énergie : à dire » | la liste vide |
| « Label et sous-traitance : dits » | rien ne manque |
| « À compléter : label » | |
| « À compléter : sous-traitance » | |
| « À compléter : label, sous-traitance » | |
| « Labels ou sous-traitants non lus » | une liste concernée pas lue |

× trois suffixes (rien, « — enregistrement… », « — pas enregistré ») =
24 gabarits ; le plus long, 53 caractères (moins que ceux des déchets, 57).

### A.5 « Mon entreprise » et les formulaires

| texte | longueur |
|---|---|
| section : « Vos signes de qualité (label RGE) » | 33 |
| sa phrase : « Les signes de qualité que vous détenez, avec leur certificat. Opus s’en sert pour vos devis de travaux d’économies d’énergie ; rien ne s’affiche sur votre fiche publique. » | 170 |
| vide : « Vous n’avez déclaré aucun signe de qualité. Vos devis de travaux d’économies d’énergie vous le demanderont. » | ≈ 108 |
| « Ajouter un signe de qualité » | 27 |
| états : « Valable jusqu’au {fin} » · « Certificat non joint · valable jusqu’au {fin} » · « Fin de validité dépassée (valable jusqu’au {fin}) » (DROIT-16 : « Expiré depuis le » se trompait d'un jour) | 22 · 45 · 47 |
| formulaire : « Un signe de qualité (label RGE) » | 31 |
| « Organisme qui l’a délivré » (placeholder « Nom de l’organisme ») | 25 (18) |
| « Intitulé » (placeholder « Tel qu’il figure sur votre certificat ») | 8 (37) |
| « Numéro du certificat (facultatif) » | 33 |
| « Travaux couverts », et son aide : « Cochez les travaux que votre certificat nomme. Une qualification pour un appareil au bois relié au chauffage central vaut aussi pour un poêle ou un insert indépendant, et une pompe à chaleur de chauffage pour un chauffe-eau thermodynamique : cochez-les aussi. » (DROIT-4) | 16, 259 |
| « Valable jusqu’au », et son aide : « La date de fin de validité écrite sur votre certificat ; sans date, demandez-la à l’organisme. » (DROIT-15) | 16, 94 |
| « Joindre le certificat », et son aide : « Le certificat ou la décision que l’organisme vous a remis. La loi demande de le joindre au devis ; une page de l’annuaire RGE n’est pas délivrée par l’organisme et n’en tient pas lieu. » (DROIT-16) | 21, 184 |
| « Afficher un signe de qualité sans l’avoir obtenu est une pratique commerciale trompeuse : ne déclarez que ceux que vous détenez, pour les travaux qu’ils couvrent. » (DROIT-16 : les mots de L. 121-4 2°) | 162 |
| « Retirer ce signe de qualité » | 27 |
| section : « Vos sous-traitants » | 18 |
| sa phrase : « Les entreprises qui font une partie, ou la totalité, de vos travaux. Rangées ici une fois, elles se choisissent ensuite dans vos devis de travaux d’économies d’énergie. » (ÉCRAN-13 : rien n'est imprimé avant 2c ; DROIT-17 : « ou la totalité ») | 168 |
| « Ajouter un sous-traitant » | 24 |
| états : « Détient un label RGE · valable jusqu’au {fin} » · « Label RGE déclaré · justificatif non joint » · « Label RGE : fin de validité dépassée (valable jusqu’au {fin}) » · « Ne détient pas de label RGE » · « Label RGE : à dire » | — · ≈ 42 · — · 27 · 18 |
| formulaire : « Un sous-traitant » ; « Nom ou raison sociale » ; « Numéro SIRET » | 16 ; 21 ; 12 |
| clé fausse : « Ce numéro SIRET n’est pas valable : relisez ses quatorze chiffres. » (CTL-6 : sans « vérifi ») | 66 |
| « Détient-il un label RGE ? » — deux rangées `Option`, « Non » · « Oui » | 25 |
| sous « Non », si un label était rangé : « En enregistrant, son label et son justificatif seront retirés de cette fiche. » (BASE-7, ÉCRAN-13) | 77 |
| « Joindre son justificatif » (P13 = 1), et son aide : « Le certificat que son organisme lui a remis, et qu’il vous a transmis. La loi demande de le fournir à votre client avec le devis. » (DROIT-16 : « fournir », pas « joindre ») | ≈ 24, 129 |
| aide des données d'un tiers : « Ces informations concernent une autre entreprise : ne rangez que ce qui sert à vos devis. Retirer un sous-traitant ne retire pas son justificatif de votre espace : il part avec votre compte. » (DROIT-11) | 190 |
| « Retirer ce sous-traitant » | 24 |

### A.6 L'avis du label (`avis_label_echeance`)

« Votre signe de qualité « {intitule} » est valable jusqu’au {fin}. Si ce
devis est signé après cette date sans que vous l’ayez renouvelé, votre
client peut perdre des aides : renouvelez-le à temps. » (196 sans ses
trous). La fin et l'intitulé : T31.

### A.7 Les refus de la base

`MESSAGES_CONTRAINTE` (`src/lib/erreurs.js`), une minuscule en tête :

| contrainte | phrase |
|---|---|
| `emetteur_label_categories_check` | ces travaux ne correspondent pas à la liste d’Opus : mettez Opus à jour. |
| `emetteur_label_chemin_check` | ce certificat n’est pas rangé dans votre espace : envoyez-le depuis ce formulaire. |
| `emetteur_label_complet_check` | un signe de qualité s’écrit avec l’organisme qui l’a délivré, son intitulé, les travaux qu’il couvre et sa date de fin : c’est ce que le devis doit porter. Le numéro du certificat, lui, est facultatif. |
| `emetteur_label_longueurs_check` | `TEXTE_TROP_LONG` |
| `emetteur_sous_traitant_categories_check` | ces travaux ne correspondent pas à la liste d’Opus : mettez Opus à jour. |
| `emetteur_sous_traitant_chemin_check` | ce justificatif n’est pas rangé dans votre espace : envoyez-le depuis ce formulaire. |
| `emetteur_sous_traitant_complet_check` | un sous-traitant s’écrit avec son nom ou sa raison sociale et son numéro SIRET ; s’il détient un label RGE, avec les travaux qu’il couvre et sa date de fin. |
| `emetteur_sous_traitant_longueurs_check` | `TEXTE_TROP_LONG` |
| `emetteur_sous_traitant_siret_check` | un numéro SIRET fait quatorze chiffres. |
| `devis_energie_travaux_check` | les travaux d’énergie cochés ne correspondent pas à la liste d’Opus : mettez Opus à jour. |
| `devis_energie_sans_label_check` | les travaux déclarés sans label ne correspondent pas à la liste d’Opus : mettez Opus à jour. |
| `devis_energie_sous_traitants_check` | les sous-traitants de ce devis ne sont pas valables (dix au plus) : mettez Opus à jour. |

`ECHEC_PAR_CONTRAINTE` : « Les travaux d’énergie n’ont pas pu être
enregistrés. » ; « Votre déclaration sur le label RGE n’a pas pu être
enregistrée. » ; « Les sous-traitants de ce devis n’ont pas pu être
enregistrés. »

### A.8 « Pas encore vérifié » (sept faits)

« Pas encore vérifié : le moment de la signature, si une ligne marquée
« réparation urgente » l’est vraiment, si ce devis relève des services à la
personne, si les labels RGE déclarés, les vôtres et ceux de vos
sous-traitants, existent, couvrent ces travaux et sont toujours en vigueur,
les conditions du taux réduit de TVA (l’ancienneté du logement, la
certification du client), si votre attestation décennale couvre ces travaux
(ses activités, la date où le chantier s’ouvrira), et si vos lieux de dépôt
acceptent ces déchets. » (526 caractères ; trois copies : `devis.js`,
`verifier-devis`, `mesure-devis`.)

### A.9 Les aides de « À quel titre ? » (T27)

| réponse | aide |
|---|---|
| « À titre privé, pour lui-même » | « Y compris un artisan ou un commerçant pour son propre logement. » (63 ; aujourd'hui `aide: null`) |
| « Pour son entreprise de 5 salariés au plus, hors de son activité principale » | « Par exemple, une boulangerie qui fait refaire sa vitrine. Quand le devis est signé hors de vos locaux, la loi la protège comme un particulier (sauf pour un bâtiment neuf ou une transformation importante) ; Opus lui compte, par prudence, les mentions dues à un particulier, sauf celles du label RGE, que la loi ne lui étend pas. » (327 ; 279 aujourd'hui) |

Les deux autres aides ne changent pas : « Opus leur compte, par prudence,
les mentions dues à un particulier » reste vrai pour une association, et
« Dans le doute, choisissez une autre réponse » reste vrai (une autre
comprend « à titre privé »).

---

## Annexe B — Les mesures des essais locaux

### B.1 Le rang 14, les 36 cas du v1 (`cahier_2b6_v1`, 23/11 ; rejoués le 24/11 sur le corps du v2, la déclaration écrite en liste)

Le devis D de A est complet aux rangs 1 à 13 et commande à titre privé ;
chaque cas part de lui. « — » : aucun motif du devis. Une « déclaration »
est, dans le v2, la liste des travaux cochés du cas. **36 justes sur les
deux corps.**

| n° | situation | lu |
|---|---|---|
| 00 | travaux vides | 14 `devis_energie` (prudence) |
| 01 | `{aucun}` | — |
| 02 | combles, rien d'autre | 14 `devis_energie_mentions` (loi) |
| 03 | combles, déclaration, sous-traitance « Non » | — |
| 04 | combles, déclaration, sous-traitance vide | mentions |
| 05 | un label qui couvre les combles, certificat joint, valable ; « Non » | — |
| 06 | le même, sans certificat | mentions |
| 07 | le même, fini hier (jour de Paris) | mentions |
| 08 | le même, fini AUJOURD'HUI (jour de Paris) | — |
| 09 | un label d'une autre catégorie | mentions |
| 10 | deux catégories, l'une couverte ; la déclaration | — |
| 11 | …sans la déclaration | mentions |
| 12 | deux labels, chacun couvre une des deux | — |
| 13 | le label de B couvre les combles (sous la RLS) | mentions |
| 14 | …dans une enveloppe `security definer` | mentions |
| 15 | sous-traitance « Oui », aucun choisi | mentions |
| 16 | un sous-traitant complet, sans label | — |
| 17 | un sous-traitant sans réponse sur son label | mentions |
| 18 | un sous-traitant labellisé, valable, justificatif joint | — |
| 19 | …son label expiré | mentions |
| 20 | …sans justificatif | mentions |
| 21 | un complet et un incomplet | mentions |
| 22 | le sous-traitant de B (RLS) | mentions |
| 23 | …(enveloppe `security definer`) | mentions |
| 24 | un identifiant inventé | mentions |
| 25 | le même complet choisi deux fois | — |
| 26 | sous-traitance « Non », un identifiant resté | — |
| 27 | association, travaux vides | 14 `devis_energie` (prudence) |
| 28 | association, combles, rien | 14 `…_mentions_prudence` |
| 29 | « pour son entreprise », travaux vides | — |
| 30 | petite entreprise hors de son activité, combles | — |
| 31 | « à quel titre » vide, combles | 1 `devis_pour_qui`, 14 `…_mentions_prudence` |
| 32 | la réponse donnée pour un autre client | 1 `devis_pour_qui`, 14 `devis_energie` |
| 33 | sans client | 1 `devis_client`, 14 `devis_energie` |
| 34 | « pour son entreprise », combles, rien | — |
| 35 | tout couvert, et la déclaration posée quand même | — |

### B.2 Les contraintes (`cahier_2b6_v1`, 27 essais, tous justes)

`energie_travaux` : le tableau vide, `{aucun, chaudiere}`, `{menuiseries}`,
deux dimensions, un indice bas de 0, un élément vide → 23514
`devis_energie_travaux_check` ; les dix-neuf clés acceptées.
`energie_sous_traitants` : vide, onze, un identifiant vide → 23514
`devis_energie_sous_traitants_check` ; dix acceptés. Les labels :
catégories vides, `{aucun}` → `emetteur_label_categories_check` ; un
chemin dans le dossier de B, à deux niveaux → `…_chemin_check` ; sans date,
un organisme de blancs → `…_complet_check` ; 121 et 61 caractères →
`…_longueurs_check` ; complet sans certificat : accepté. Les
sous-traitants : trois chiffres → `…_siret_check` ; sans SIRET, « Oui » sans
date → `…_complet_check` ; un justificatif hors du dossier →
`…_chemin_check` ; 121 caractères → `…_longueurs_check` ; sans réponse sur
le label : accepté. (L'essai c08 du v1, « la déclaration faux », est
remplacé par k01 à k06.)

### B.3 Le v2 (`cahier_2b6_v2`, 24/11)

22 cas nouveaux, tous justes :

| n° | situation | lu |
|---|---|---|
| V01 | 06 bis : label valable SANS certificat, et la déclaration | 14 mentions (loi) : le point reste |
| V02 | 07 bis : label expiré hier, et la déclaration | — |
| V03 | label expiré ET sans certificat, déclaration | — |
| V04 | ventilation non portée + combles sans certificat, les deux déclarés | mentions |
| V05 | ventilation déclarée + combles sans certificat non déclarés | mentions |
| V06 | un label sans certificat, mais un second label complet couvre | — |
| V07 | (P1b) combles déclarés, fenêtres ajoutées | mentions |
| V08 | (P1c) l'extérieur couvert puis expiré, combles seuls déclarés | mentions |
| V09 | (P1d) tout était couvert, label retiré, aucune déclaration | mentions |
| V10 | (E3) ventilation déclarée, puis ventilation et combles cochés | mentions |
| V11 | une clé déclarée pour un travail décoché, sans effet | — |
| V12 | (X) photovoltaïque seul, sous-traitance « Non » | 14 `…_mentions_prudence` |
| V13 | (Y) désembouage seul, « Non » | 14 `…_mentions_prudence` |
| V14 | photovoltaïque, sous-traitance vide | 14 mentions (loi) |
| V15 | photovoltaïque et combles, rien | mentions (loi) |
| V16 | photovoltaïque et combles, combles déclarés | `…_mentions_prudence` |
| V17 | photovoltaïque déclaré, « Non » | — |
| V18 | déclaration vide de valeur, combles non couverts | mentions |
| V19 | association, photovoltaïque | `…_mentions_prudence` |
| V20 | un label sans certificat de B seulement, combles déclarés (RLS) | — |
| V21 | …dans une enveloppe `security definer` | — |
| V22 | (CTL-7) sous-traitant labellisé SANS date, la croisée retirée dans la transaction | mentions |

La contre-épreuve et les quatre sabotages : §2.9. Les contraintes :

| n° | essai | lu |
|---|---|---|
| k01 | `energie_sans_label` vide (`'{}'`) | 23514 `devis_energie_sans_label_check` |
| k02 | `{aucun}` | idem |
| k03 | `{menuiseries}` | idem |
| k04 | un élément vide | idem |
| k05 | deux dimensions | idem |
| k06 | trois clés, dont les deux de prudence | accepté |
| k07 | `energie_travaux` `{entretien_chauffage}` (l'ancienne clé) | 23514 `devis_energie_travaux_check` |
| k08 | `{desembouage}` | accepté |
| k09 | un chemin de certificat suivi d'une espace | accepté, rangé rogné |
| k10 | un chemin de certificat vide | accepté, rangé vide de valeur |

---

## Annexe C — Critique → décision

« ret. » = retenu par la contradiction, « part. » = en partie. Aucun
constat n'est réfuté. La colonne « v2 » dit où le constat est traité, et
avec quelle correction (celle du contradicteur quand elle diffère de celle
du critique).

| constat | verdict | v2 |
|---|---|---|
| DROIT-1 déclaration et label sans certificat | ret., important | T2, T5, §2.4 (le compte « sans certificat »), A.3 (quatre phrases, la sortie « retirez-le »), V01, V03, V04 |
| DROIT-2 « La loi » pour des lignes de prudence | ret., mineur | T5 (la nature par la clé), A.1 (la phrase de 194), P12, V12, V13, V16 |
| DROIT-3 le désembouage | ret., important | T18 (`desembouage`), §3.1, P12 (« pas un label RGE au sens strict »), J74 |
| DROIT-4 le 3° et le 4° | ret., important | §3.1 (les mots de 102 caractères), A.5 (l'aide) |
| DROIT-5 le 17° | ret., important | §3.1 (« offre globale », l'aide), J73 |
| DROIT-6 la sous-traitance plus large | part., important | P12 (options 1 et 3 : lignes NOMMÉES, pas une ligne fourre-tout), A.3 (la phrase sous « Aucun »), J72 |
| DROIT-7 « de ces travaux » | ret., important | §1.2 (P2 tranchée), A.1, A.3, §4 |
| DROIT-8 l'aide de la petite entreprise | ret., important | T27, A.9, §5.2, §5.6 (remesure) |
| DROIT-9 la carte pour une association | ret., important | §3.8, A.3 (deux phrases de prudence, le sous-titre), P14 (les amendes précédées de « Pour un client qui commande à titre privé, ») |
| DROIT-10 « Pas encore vérifié » | ret., important | T12, A.8 |
| DROIT-11 le justificatif d'un tiers | part., important | P13 (les deux conséquences), A.5 (l'aide), §4 (documents, conservation, la garantie limitée) ; D8 non invoqué |
| DROIT-12 T2 change Q5 | ret., important | P11 (posée), en tête |
| DROIT-13 la phrase des conséquences | ret., mineur | §8 (l'exception à décider), A.3 (l'aide sans promesse), J75 |
| DROIT-14 le 7° et le 11° | ret., mineur | §3.1, A.2 (à mesurer à 320) |
| DROIT-15 la citation de l'échéance | ret., mineur | T7, A.5 (l'aide de la date) |
| DROIT-16 quatre phrases | part., mineur | A.3 (« Déclaré dans »), A.5 (états, certificat, justificatif, L. 121-4 2°), P14 (b) sur le modèle TVA, §8 (l'état des assurances à A-FAIRE) |
| DROIT-17 les phrases du point | part., mineur | A.1 (188, 187, 194), A.3 (la question à 86), A.5 (« ou la totalité ») |
| DROIT-18 2027 | part., mineur | §1.4, §8 (une colonne de nature, par une migration) |
| DROIT-19 l'entrepreneur chez lui | ret., mineur | T27, A.9 ; le bailleur à J41 |
| DROIT-20 l'avis du sous-traitant | ret., mineur | §8 (A-FAIRE) |
| DROIT-21 les trois fiches publiques | ret., mineur | §1.4 |
| DROIT-22 questions au juriste | ret., mineur | §1.5 (J39 (c), (d), J72 à J75) |
| DROIT-23 l'amende de la sous-traitance | ret., mineur | §5.3 n° 14, S37 |
| BASE-1 la déclaration s'étend | ret., important | T2, T3 (`text[]`), §2.3, §2.4 (`is not true`), V07 à V11, V18 ; la clé d'un travail décoché tranchée (§2.3) |
| BASE-2 la déclaration tait un label détenu | ret., important | §2.4, A.3, V01, V06 |
| BASE-3 sept vérifications oubliées | part., mineur | §5.2 (cinq listes ; écrivain et lecteur repassent seuls) |
| BASE-4 listes d'essais aveugles | part., mineur | §2.8 n° 17 à 19 ; relecture contre `TABLES_46` |
| BASE-5 parité et jour de Paris | ret., mineur | §5.5 (2001 ou 2999) |
| BASE-6 le chemin non rogné | ret., mineur | T15, §2.1, §2.2, §3.3, k09, k10 |
| BASE-7 « Non » efface le justificatif | part., mineur | §2.2 (l'effacement gardé), A.5 (la phrase), §8 (A-FAIRE) ; garder les valeurs : écarté |
| BASE-8 les listes de clés | ret., mineur | §5.3 n° 4, S55 |
| BASE-9 un relevé avant sur une table absente | ret., mineur | §4, §6 (relevé APRÈS) |
| BASE-10 la porte étroite | part., mineur | T21, §2.4 (mots interdits, une ceinture) |
| BASE-11 la date sans borne | part., mineur | §2.1, §8 (A-FAIRE) ; la borne 2000-2100 écartée |
| BASE-12 verrous et taille | part., mineur | T17, §6 (mesurés ; la taille DÉDUITE) |
| ÉCRAN-1 = BASE-1 | ret., important | comme BASE-1 ; la paire et le témoin écartés ; §3.8 (une case par travail) |
| ÉCRAN-2 quatre états | part., important | T26, §3.2 (`etatsDesTravaux`), A.3 ; un label expiré reste déclarable |
| ÉCRAN-3 « Aucun » sous dix-neuf cases | ret., important | §3.8, A.3, §5.6 |
| ÉCRAN-4 le câblage | ret., important | §3.7 bis, §5.2 bis |
| ÉCRAN-5 les quatre états mesurés | ret., important | §5.6, §3.9 (les listes dans la fiche) |
| ÉCRAN-6 le calendrier | ret., mineur | T30 |
| ÉCRAN-7 l'avis du label | ret., mineur | T31, S29 récrit |
| ÉCRAN-8 libellés et exemples | ret., mineur | §3.1 |
| ÉCRAN-9 la démonstration | ret., mineur | §3.9 |
| ÉCRAN-10 `etatDesLieux` et la case non lue | ret., mineur | T24, §3.8 |
| ÉCRAN-11 les cases des sous-traitants | ret., mineur | §3.8, A.3 |
| ÉCRAN-12 l'égalité stricte | part., mineur | §3.4, S54 |
| ÉCRAN-13 deux textes | ret., mineur | A.5, §3.6 |
| CTL-1 l'essai 49-remise | ret., mineur | §5.4 (cas 10, 13, 23, 24, 26 ; 27 et 28) |
| CTL-2 les gardes du générateur | ret., important | §5.5 (a) à (e) |
| CTL-3 les listes de fichiers | ret., important | §2.8 bis, S44 à S46 |
| CTL-4 organismes et SIRET de démonstration | part., important | §3.9 (`00000496000019`, la règle étroite), S36 |
| CTL-5 le badge côté JavaScript | ret., important | §3.5, §5.3 n° 7, S43 |
| CTL-6 le vocabulaire | ret., mineur | T10, A.5 (« relisez ») |
| CTL-7 le sous-traitant sans date | ret., important | T20, §2.2, §2.4, `FORMES_46`, V22, S39, S40 |
| CTL-8 deux écritures de l'état | ret., important | T26, §3.3, §5.3 n° 3, S42 |
| CTL-9 la place des clés | ret., mineur | T28 |
| CTL-10 rien coché d'office | part., important | §3.2, §3.8 (l'origine et l'objet présents), S22 |
| CTL-11 les listes de tables | part., important | §2.8 (deux propriétés, portée « section 46 »), S17 |
| CTL-12 ce que l'écran fait rougir | part., mineur | §5.2 bis, S50 ; « « undefined » » écarté (la clé brute) |
| CTL-13 la colonne sans écrivain | ret., mineur | P13, §2.2 |
| CTL-14 deux sorties d'essai | ret., mineur | §2.8 n° 17 et 20 |
| CTL-15 `avecRge` et deux gardes | ret., mineur | §4 |
| CTL-16 le `.slice` | ret., mineur | §3.9 |
| CTL-17 la garde TVA côté JavaScript | ret., mineur | §2.6 n° 3, S11 |
| CTL-18 les sabotages | ret., mineur | §5.7 (S37 à S55 ; S36 et S22 récrits) |
