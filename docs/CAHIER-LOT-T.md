# Lot T du module devis : les tarifs réunis — devis, fiche et SOS

> **Archivé le 20/10/2026, après la construction.** Ce cahier a guidé le
> lot T ; il est versé ici tel qu'il a servi, pour qu'on sache plus tard
> POURQUOI chaque choix a été fait. Trois choses à savoir en le lisant :
>
> - les fichiers qu'il cite sans chemin du dépôt (`relecture-base.md`,
>   `releve-sos.md`, `modele-cahier-0a.md`, `cahier-lotT-v1.md`…) étaient des
>   documents de travail de la session : ils ne sont PAS dans le dépôt ;
> - les numéros de ligne (`schema.sql:…`, `api.js:…`) sont ceux d'AVANT le
>   lot : le code a bougé depuis ;
> - **ce qui a été réellement construit, les écarts avec ce cahier, et ce qui
>   a été vérifié sur la vraie base** sont dans CLAUDE.md, section « Les
>   tarifs réunis — lot T ». En cas de désaccord, c'est CLAUDE.md et le code
>   qui disent vrai.

> **Ce document est un cahier de réalisation, pas du code.** Rien n'a été modifié dans le dépôt. C'est la **version finale** : la version 2 (`cahier-lotT.md`), qui remplaçait la version 1 (`cahier-lotT-v1.md`) après trois relectures adverses (`relecture-base.md`, `relecture-application.md`, `relecture-droit.md`, dans ce même dossier de travail), **plus les quatre réponses du propriétaire du 19/10/2026** (§10, consignées dans `docs/PLAN-DEVIS.md` §10.14). Seuls les passages que ces réponses touchent ont changé. Ce que les relectures ont changé, et ce qui a été écarté avec sa raison, est au §11.
>
> **Sources lues** : les trois relevés du 19/10/2026 (`releve-sos.md`, `releve-tarifs-devis.md`, `releve-droit-plan.md`), le cahier du 0a (`modele-cahier-0a.md`), les trois relectures, et le dépôt au commit `be4b530`. `supabase/schema.sql` n'a pas changé depuis `d0560e8` : c'est la version que la vraie base a reçue. Les références `fichier:ligne` reprises de la version 1 ont été relues pour elle ; **toutes celles qui portent une correction de cette version ont été relues pour elle** (liste au §11.1). Une affirmation que je n'ai pas pu vérifier porte « non vérifié ». Le droit n'est cité qu'à travers ce que le dépôt en cite : **aucun texte n'a été relu sur Légifrance** (`docs/PLAN-DEVIS.md:3313`, et le point 11 de `PLAN-DEVIS.md:3341`).
>
> **Mesures du 19/10/2026 sur la vraie base**, en lecture seule, par comptages et sur la forme (aucun prix, aucun nom, aucune fiche client lus) :
> - PostgreSQL **17.6** ; 15 comptes, 8 fiches, 21 publications, 1 entreprise active ; **8 fiches sur 8 localisées** ;
> - `tarifs_pro` : **0 ligne**, trois colonnes (`pro_id`, `frais_deplacement_centimes`, `frais_deplacement_texte`), une seule politique (`"mes tarifs"`) ; `emetteur` : 1 ligne (le propriétaire a essayé « Mon entreprise » dans Expo Go) ;
> - `sos_availability` : **1 ligne**, active, `metier_key = 'electricite'`, `0 / 0 / 0`, rayon 20, délai 45, sur le compte du propriétaire — administrateur, sans entreprise rattachée, dont **aucun des quatre métiers n'est un métier d'urgence** ; **aucun déclencheur** sur la table ; contraintes `check` : seulement `sos_availability_majoration_check` et `sos_availability_metier_key_check` ; **0 ligne** hors des bornes 1-200 km et 5-600 min ;
> - `sos_requests` : **0 ligne** ;
> - **2 fiches** portent un métier d'urgence, aucune n'en porte deux, aucune n'a d'entreprise rattachée ;
> - colonnes de `sos_availability` identiques au dépôt ; droits de table `anon=arwdDxtm`, `authenticated=arwdDxtm` ;
> - `artisans_urgence(text, double precision, double precision)` : `TABLE(professional_id uuid, entreprise text, metier text, ville text, avatar_url text, verifie boolean, deplacement numeric, horaire numeric, majoration integer, delai_minutes integer, distance double precision)`, `language sql stable`, **sans** `security definer`, exécutable aujourd'hui par `anon` et `authenticated` (un DROIT mesuré : l'application ne l'appelle jamais sans session, §2.5) ;
> - `est_masque(uuid)` : exécutable par `authenticated`, **pas** par `anon` ;
> - **`users.cgu_version`** : `2026-09-29` × 2, `2026-10-15` × 2, **`null` × 11** ; **aucun compte n'a accepté `2026-10-18`**, la version qui porte l'engagement du 18/10 ;
> - **6 particuliers**, dont 2 localisés, **les 2 à moins de 40 km d'Aix-en-Provence** ; **0 compte et 0 fiche à moins de 60 km de Brest** (et de Lille, et de Strasbourg) ;
> - noms libres : les colonnes `taux_horaire_centimes`, `majoration_pct`, `decompte_temps_texte`, `prix_devis_centimes`, `affiche`, `affiche_le` ; les contraintes `tarif_taux_horaire_check`, `tarif_majoration_check`, `tarif_decompte_texte_check`, `tarif_devis_check`, `tarif_affiche_check`, `sos_rayon_check`, `sos_delai_check` ; les fonctions `metier_du_sos`, `tient_les_tarifs_publics`, `refuse_les_colonnes_mortes_du_sos` et leurs déclencheurs ; la politique `"tarifs affiches"` ; le code `OP012` (le schéma s'arrête à `OP011`). **À refaire juste avant d'appliquer** : une base change.
>
> **Ce que le propriétaire a déjà décidé, et qui n'est pas remis en question ici** :
> - « **au choix de l'artisan** » : un interrupteur « afficher mes tarifs sur ma fiche », **éteint par défaut** (`docs/PLAN-DEVIS.md:3358`) ;
> - **UNE seule liste** de tarifs pour le devis et le SOS (`PLAN-DEVIS.md:3358`) ;
> - le `0` du SOS devient `null` : **un `null` n'est pas un `0`** (`PLAN-DEVIS.md:3358`) ;
> - ce lot vient **juste après le 0a, avant le lot 2** (`PLAN-DEVIS.md:3438`) ;
> - l'**engagement écrit** sur la lecture des prix (`PLAN-DEVIS.md:3439`, `docs/DONNEES-DES-ARTISANS.md:767-774`) — « aucun écran d'Opus ne montre les prix d'un artisan à un autre » **reste vrai tel quel** : les tarifs affichés ne vont qu'aux particuliers (réponse du 19/10, question 2) ; l'engagement de l'éditeur de ne pas les consulter avec les outils de l'hébergeur porte sur ceux que l'artisan n'affiche pas ;
> - le libellé « **Déplacement offert** » (`PLAN-DEVIS.md:3441`) ;
> - **les quatre réponses du 19/10/2026** (§10.1, `PLAN-DEVIS.md` §10.14) : répondre aux urgences **exige** d'afficher ses tarifs ; les tarifs affichés ne sont lus **que par les particuliers** ; l'avis d'un avocat est un **simple rappel** ; les forfaits, **plus tard** ; la majoration, **comme aujourd'hui**. Le lot T **remplace** le lot 6 conditionnel, et l'ordre du devis devient **T → 1 → P → S → 2** (`PLAN-DEVIS.md` §10.14). L'audit de l'addendum QR (`docs/AUDIT-ADDENDUM-QR.md`) ne demande rien à ce lot : **aucune colonne** pour le QR, la relation ni le Dossier Travaux.
>
> **Les quatre réponses sont arrivées** (§10). Elles étaient attendues avant l'étape 2 (le schéma, les textes opposables, la vraie base) : la question 1 décidait si des données deviennent publiques, et le plan exige qu'une telle réponse précède le lot (`PLAN-DEVIS.md:3237`). Plus rien n'attend.

---

## 0. En une page : ce qui est tranché ici, et pourquoi

### 0.1 Le tableau

| question | tranché | pourquoi, en une ligne |
|---|---|---|
| où vivent les tarifs | **dans `tarifs_pro`**, une ligne par entreprise, qui reçoit **cinq colonnes déclarées** et **une date posée par la base** | une seule liste (3358) ; une règle RLS filtre des LIGNES (`schema.sql:9787-9792`) : la table est faite pour devenir lisible ligne par ligne |
| ce que contient la liste | frais de déplacement (existants), **taux horaire**, **décompte du temps**, **majoration de nuit et de week-end**, **prix du devis**. Pas de forfaits (**question 3 : « plus tard »**, 19/10) | ce que le plan range dans « Ses tarifs » (`PLAN-DEVIS.md:664`) et dans les art. 2-3 de l'arrêté (`:2794`) ; chaque colonne a un lecteur dès la livraison |
| les états d'une valeur | **trois partout** : `null` = non déclaré ; `0` = un choix (« Déplacement offert », « Je ne majore pas », « Mes devis sont gratuits »), **écrit par un interrupteur seulement** ; un montant. **Un taux horaire n'a pas de 0** | la règle du §2.0 du plan (`PLAN-DEVIS.md:239-260`), déjà tenue pour les frais (`emetteur.js:421-436`) |
| HT ou TTC | **TTC**, pour les cinq valeurs : c'est ce que paie le client, et c'est ce qu'il lit sur la fiche et dans le SOS. L'étiquette de chaque champ le dit. **Le devis**, lui, décidera au lot 2 comment il imprime ce montant (HT sur une ligne au régime réel) | le mot du plan (`PLAN-DEVIS.md:664`, « taux horaire TTC ») ; un même nombre ne peut pas être TTC sur la fiche et d'une unité inconnue dans le formulaire. Point de juriste ouvert (§1.2) |
| qui publie | **l'artisan seul**, par l'interrupteur « Afficher mes tarifs sur ma fiche » ; **jamais une migration** ; la **base date** chaque mise en ligne (`affiche_le`) | « au choix de l'artisan » (3358) ; les dates qui engagent sont posées par la base (CLAUDE.md, lot 0a) |
| **qui lit une ligne affichée** | **les particuliers connectés seulement** (réponse du 19/10, question 2) : une politique `for select to authenticated using (affiche is true and not public.est_un_pro() and not public.est_masque(pro_id))`. Le titulaire lit **toujours** sa propre ligne (`"mes tarifs"`) ; **aucun autre artisan** ne lit celle d'un autre, l'administration non plus (le compte du propriétaire est un compte pro). **Aucun droit pour `anon`** : la section 46.5 (« `anon` n'a rien », `schema.sql:10325-10333`) reste vraie | l'engagement du 18/10, « aucun écran ne montre les prix d'un artisan à un autre », reste vrai **tel quel** ; l'application n'ouvre aucun écran sans session (`OpusApp.js:3391-3405`, `:425-431`, `api.js:103-109`) : un droit `anon` n'aurait aucun lecteur, et ouvrirait l'extraction en masse des tarifs par une seule requête sans compte. **Une barrière, pas un verrou** : un artisan peut ouvrir un second compte particulier avec une autre adresse ; Opus ne vérifie pas l'identité des particuliers, et les textes le disent (§5.9) |
| le SOS et l'interrupteur | **répondre aux urgences exige des tarifs affichés** : `artisans_urgence` ne rend qu'un artisan dont la ligne a `affiche is true` | **question 1 : « Oui, c'est obligatoire »** (19/10). La phrase du 17/10 reste vraie ; avec « Non, il apparaît sans prix », un particulier en urgence aurait choisi sans aucun prix (§0.2-1) |
| un artisan aux tarifs incomplets | **absent du SOS** : il faut un montant de déplacement (ou « offert »), un taux horaire et une majoration (ou « je ne majore pas ») ; son réglage lui dit ce qui manque | sans ces trois nombres, aucune estimation n'est calculable. Tranché avec la **question 1** (19/10) |
| ce qu'il faut pour **afficher** | **au moins un tarif** : des frais (montant, conditions ou « offert »), un taux horaire ou un prix de devis | un bloc affiché n'est jamais vide ; mais un dépanneur au forfait doit pouvoir afficher ses frais et son prix de devis sans taux horaire. Ce n'est plus une règle plus stricte que la loi |
| un métier d'urgence qui n'est plus sur la fiche | **absent du SOS**, par la base ; la ligne orpheline du propriétaire est **éteinte** au rattrapage, par la règle générale (§10.2) | la promesse de `urgences.js:78-79` n'était tenue par rien ; l'application ne pouvait plus éteindre cette ligne |
| `rayon_km` et `delai_minutes` | **bornés par la base** : 1 à 200 km, 5 à 600 minutes | `"ma dispo sos"` est `for all` (`schema.sql:1207-1209`) : un client modifié qui écrit 100 000 km apparaît dans la recherche de tous les particuliers |
| `artisans_urgence()` | **même signature, même type de retour** ; elle **déménage en section 47**, lit `tarifs_pro`, et n'est plus exécutable que par `authenticated` | une fonction appelée par l'application ne change jamais de signature ; une fonction SQL est contrôlée à sa CRÉATION (`schema.sql:10507-10509`) |
| ce que la carte SOS montre de plus | **le prix du devis, le décompte du temps et les conditions de déplacement**, lus par une seconde requête sur les lignes affichées | le particulier choisit sur la carte (`SosScreen.js:239-257`) ; la signature figée d'`artisans_urgence` ne peut pas les transporter |
| la nuit dans l'estimation | **jugée à l'heure d'arrivée** (maintenant + délai annoncé) pour « Tout de suite » ; pour « Dans la journée » et « Demain », estimation **non majorée** et la carte dit « +40 % si l'intervention a lieu la nuit ou le week-end » | aujourd'hui, « Demain » choisi à 21 h affiche une estimation majorée pour une intervention de jour (`SosScreen.js:41`) |
| le rattrapage | **une seule fois** (gardé par l'absence de la colonne) : copie des valeurs SOS strictement positives et dans les bornes, **sans jamais écraser** une valeur déclarée, **sans jamais allumer `affiche`** ; colonnes mortes remises à 0 ; extinction des lignes orphelines ; **un compteur de ce qui n'a pas été copié** | sur la vraie base : rien n'est copié (la seule ligne vaut 0/0/0), une ligne est éteinte. §2.2 |
| les colonnes `sos_availability.deplacement`, `.horaire`, `.majoration` | **mortes** : plus lues ni écrites par l'application, remises à 0, et **une écriture non nulle est REFUSÉE** par un déclencheur (`OP012`) dont le corps supporte l'absence des colonnes | elles restent lisibles de tous (`"lecture dispo sos"`) ; un refus qui DIT pourquoi vaut mieux qu'une remise à 0 silencieuse (l'icône « preview » du propriétaire écrit encore ces colonnes, `docs/A-FAIRE.md:1733-1737`) |
| qui écrit les tarifs | **une seule porte : « Mon entreprise »**. Le réglage SOS de « Modifier mon profil » les **montre** et **y renvoie** | deux formulaires pour les mêmes chiffres finiraient par diverger |
| la fiche publique | un bloc **« Ses tarifs »**, juste après la fiche de contact, seulement si les tarifs sont affichés **et que celui qui regarde est un particulier connecté** ; à un autre artisan, **aucun bloc** ; sur sa propre page, **« Mes tarifs »**, avec une phrase qui dit **qui les voit** ; la majoration y est un **pourcentage**, sans les heures qu'Opus utilise pour ses estimations | même composant, même ORDRE des deux côtés (la règle de la section 36) ; un bloc « aucun tarif » ou « prix non communiqués » montré à un artisan serait faux ; une fiche ne prête pas à l'artisan une convention d'Opus |
| les textes légaux | « **Vos tarifs et vos prix** » et « **Ce que nous collectons** » réécrits : les tarifs affichés sont lus **par les particuliers qui ont un compte**, ni par les autres artisans, ni par l'éditeur dans l'application, et **la limite** (un second compte particulier) est dite ; l'engagement de l'éditeur de ne pas consulter porte sur les tarifs **non affichés** ; la majoration est dite **pour ce qu'elle sert** (l'estimation des urgences) ; `VERSION` change. **L'avis d'un avocat est un simple rappel** (`docs/A-FAIRE.md:1759-1762`, déjà inscrit) : rien dans le code, aucun contrôle bloquant | §5.9 ; réponses du 19/10 |
| l'export RGPD | **deux clés de plus** : `ma_disponibilite_urgences` et **`urgences`** (des deux côtés, comme `'devis'` et `'rappels'`) | `mes_donnees()` exporte déjà les demandes de devis et de rappel des deux côtés (`schema.sql:10544-10547`) |
| les contrôles « tarifs privés » | **réécrits en PROPRIÉTÉS** | §6 |
| le numéro de section | **47**, après le dernier objet de la 46 (`schema.sql:10493-10497`), avant le séparateur de la section 42 (`schema.sql:10499`) | 42 (export) et 43 (balayage) restent les deux derniers blocs |
| un module natif | **aucun** | tout se recharge par Metro |

### 0.2 Les contradictions trouvées

1. **La décision du 17/10 tient dans une phrase qui peut devenir fausse** (`PLAN-DEVIS.md:3358`) : « tant qu'il est éteint, les tarifs ne servent qu'aux devis » ET « une seule liste avec le SOS ». Le SOS montre ses tarifs aux particuliers. Pour un artisan qui répond aux urgences interrupteur éteint, la première moitié devient fausse. **Deux réponses la gardent vraie** : « Oui, c'est obligatoire » (répondre aux urgences exige d'afficher ses tarifs) et « Non, il apparaît sans prix » (« prix non communiqués »). Une troisième, « Urgences seulement », rend les tarifs visibles dans le SOS seulement, et rend fausse la première moitié. **Ce cahier construit « Oui, c'est obligatoire »**, parce qu'avec « sans prix » un particulier en urgence choisit sans aucun prix — le cas que le plan désigne comme le plus exposé (64 % d'anomalies dans le dépannage, `PLAN-DEVIS.md:696` ; l'abus de faiblesse en situation d'urgence, `:2908`). C'était un **arbitrage**, pas une nécessité logique : **le propriétaire l'a confirmé le 19/10** (question 1 : « Oui, c'est obligatoire »).
2. **« Au choix de l'artisan » (17/10) et l'engagement du 18/10.** `DONNEES-DES-ARTISANS.md:767-770` dit « aucun écran d'Opus ne montre les prix d'un artisan à un autre, administrateur compris ». Lisible par tous les comptes connectés, comme le prévoyait la version 2, un tarif affiché aurait été lu par les autres artisans — et par le propriétaire, qui est du métier (§5.2, `:745-758`). **Réponse du 19/10 (question 2) : les tarifs affichés ne sont lus que par les particuliers.** La politique de lecture exige `not public.est_un_pro()` (§2.5) : aucun artisan ne lit les tarifs d'un autre par l'application, l'administration non plus — le compte du propriétaire est un compte pro. L'engagement du 18/10 reste donc vrai **tel quel**, et l'engagement de l'éditeur de ne pas consulter les prix avec les outils de l'hébergeur porte, lui, sur ceux que l'artisan n'affiche pas (les autres, tout particulier les lit). **Ce que la base ne peut pas empêcher, et que les textes disent** : un artisan peut ouvrir un second compte, en particulier, avec une autre adresse e-mail ; Opus ne vérifie pas l'identité des particuliers. C'est une **barrière, pas un verrou**. Le dépôt pose le cadre de cette prudence sans trancher ce cas précis : un marché étroit (8 fiches, presque toutes dans le 13) où même un agrégat révèle qui s'écarte (`DONNEES-DES-ARTISANS.md:800-805`, §5.3), et une plateforme qui centralise des demandes doit être conçue pour ne pas permettre l'échange d'informations tarifaires entre acteurs (`:834-838`, §5.4, avis 25-A-13 §93 — le passage vise les prix proposés sur une même demande ; des tarifs que l'arrêté de 2017 demande d'afficher n'y sont pas traités). « Qui peut lire quoi » est une décision du propriétaire (`:918-922`, décision 3) : elle est prise. **L'avis d'un avocat sur ce point est un simple rappel** (réponse du 19/10), déjà inscrit dans `docs/A-FAIRE.md:1759-1762` parmi les questions au juriste : rien dans `legal.js`, aucun contrôle bloquant dans `verifier-legal`.
3. **Le 18/10, des trois règles plus strictes que la loi proposées par le cahier du 0a, le propriétaire n'a gardé que la relecture annuelle du SIRET** (`PLAN-DEVIS.md:3440` ; `modele-cahier-0a.md:174-177`). La déclaration des frais de déplacement pour tout devis, choix antérieur du plan (`PLAN-DEVIS.md:2884-2886`), est restée. Exiger des tarifs complets pour apparaître dans le SOS n'est pas une mention légale imposée à un devis : c'est la condition pour qu'une estimation existe. Elle était incluse dans la question 1 ; la réponse « Oui, c'est obligatoire » (19/10) la garde.
4. **Le code ne sait pas faire « une nouvelle acceptation »**, alors que `legal.js:41-42` l'affirme. `cgu_version` n'est écrite qu'à l'inscription (`api.js:239`) et au passage en compte pro (`api.js:3912`, `OpusApp.js:2245`) ; rien ne compare la version acceptée à `VERSION`. **Mesuré** : aucun compte n'a accepté `2026-10-18`, et **11 comptes sur 15 n'ont aucune version enregistrée** ; restreindre l'engagement ne modifie donc aucun contrat accepté. Ce lot change `VERSION` et ne peut pas faire ré-accepter les comptes existants. Ce qui le rend honnête : **la seule publicité nouvelle passe par un geste explicite**, l'interrupteur, avec la phrase sous les yeux, et **la base date ce geste** (`affiche_le`). Le mécanisme de ré-acceptation va dans `docs/A-FAIRE.md`, à construire **avant** que `STATUT` quitte `'essai'`, et il couvrira les 11 comptes sans version.

Deux écarts avec l'esquisse du 0a (§1.4.3), qui ne sont pas des contradictions du propriétaire :
- son point 7 (« Tarifs non renseignés » dans le SOS) devenait l'option « Non, il apparaît sans prix » de la question 1, écartée le 19/10 ;
- son point 2 rendait la « condition SOS » optionnelle dans la politique ; ici elle **n'existe pas** : la politique ne lit qu'une colonne de sa propre ligne.

La condition du 0a « aucun vrai prix d'un autre artisan » (cahier 0a §0) est levée par la réponse du 18/10 (`PLAN-DEVIS.md:3439`) : le frère saisira les siens lui-même. S'il les affiche, seuls les particuliers les liront (réponse du 19/10).

---

## 1. Le périmètre exact

### 1.1 Ce qui entre dans ce lot

| quoi | où | lecteurs dès la livraison |
|---|---|---|
| `tarifs_pro.taux_horaire_centimes` (`null` / de 1 à 1 000 € TTC de l'heure) | section 47 | SOS, bloc de la fiche, « Mon entreprise », export |
| `tarifs_pro.majoration_pct` (`null` / `0` = « Je ne majore pas » / 1 à 200 %) | section 47 | SOS, bloc de la fiche, « Mon entreprise », export |
| `tarifs_pro.decompte_temps_texte` (≤ 200 caractères) | section 47 | carte SOS, bloc de la fiche, « Mon entreprise », export ; **copié par l'instantané du lot 2** (`PLAN-DEVIS.md:1091`) |
| `tarifs_pro.prix_devis_centimes` (`null` / `0` = « Mes devis sont gratuits » / jusqu'à 1 000 € TTC) | section 47 | carte SOS, bloc de la fiche, « Mon entreprise », export ; valeur proposée par le lot 1 (cahier 0a §1.3) |
| `tarifs_pro.affiche` (`boolean default false`) | section 47 | la politique de lecture, `artisans_urgence`, le bloc de la fiche, le réglage SOS, « Mon entreprise » |
| `tarifs_pro.affiche_le` (`timestamptz`, posée par la base) | section 47 | « Mon entreprise » (« Affichés depuis le … »), export |
| la lecture d'une ligne affichée par les **particuliers** connectés, et par eux seuls | section 47 | `artisans_urgence`, la fiche d'un artisan vue par un particulier, le complément de la carte SOS |
| `artisans_urgence()` lit `tarifs_pro` | section 47 | `SosScreen` |
| `metier_du_sos()` | section 47 | `artisans_urgence`, le rattrapage |
| `sos_rayon_check`, `sos_delai_check` | section 47 | le réglage SOS (phrases de refus) |
| le refus des colonnes mortes (`OP012`) | section 47 | une version ancienne de l'application, qui l'affiche telle quelle (`erreurs.js`, codes `OP`) |
| le rattrapage | section 47 | — |
| l'export de `sos_availability` et de `sos_requests` | section 42 | l'artisan et le particulier (article 15) |
| la section « Vos tarifs » et la section « Afficher mes tarifs » de « Mon entreprise » | `FicheEmetteur.js`, `MonEntreprise.js` | — |
| le réglage SOS de « Modifier mon profil », réécrit | `ProfilEditScreen.js` | — |
| le bloc « Ses tarifs » (pour un particulier), « Mes tarifs » (pour le titulaire, avec la phrase qui dit qui les voit) | `TarifsPublics.js`, `ProfilProScreen.js`, `ProfilOwnScreen.js` | — |
| l'écran SOS, réécrit sur les centimes, l'heure d'arrivée et la liste visible | `SosScreen.js`, `src/lib/tarifs.js` | — |
| « TTC » dans les deux annonces de la fourchette | `OpusApp.js`, `DemandesRecuesScreen.js` | — |
| les textes opposables | `legal.js` | — |

### 1.2 Ce qui n'y entre pas, avec sa destination et sa raison

| quoi | où | pourquoi |
|---|---|---|
| des **forfaits** (« ouverture de porte : 90 € ») | **plus tard** (question 3, 19/10) : le lot qui les lira | une liste, donc une table fille ; l'estimation SOS ne saurait pas encore quel forfait s'applique à quel problème. Sans forfaits, un dépanneur au forfait peut afficher ses frais et son prix de devis, mais **n'apparaît pas dans les urgences** sans taux horaire |
| un tarif **par métier d'urgence** | jamais sans demande | mesuré : 0 fiche porte deux métiers d'urgence ; la liste unique interdit deux taux différents, et c'est assumé (cahier 0a §1.4.1) |
| **HT ou TTC au sens du droit**, et l'unité **imprimée sur le devis** (`enteteImprime`, `emetteur.js:1266-1275`, qui imprime aujourd'hui « Frais de déplacement : 35,00 € » sans unité) | lot 2, avec un juriste | ce lot fixe l'unité du NOMBRE rangé (TTC) ; le lot 2 décidera comment le devis l'imprime (HT sur une ligne au régime réel, mention pour un franchisé). L'aperçu de l'en-tête n'indique pas d'unité : il n'est pas faux, il est incomplet, et le lot 2 le dit. **Inscrit dans `A-FAIRE.md`** |
| l'**estimation calculée selon le décompte déclaré** (« toute heure commencée est due ») | — | le décompte est un texte libre ; la carte l'affiche et dit que l'estimation repose sur des durées moyennes d'Opus |
| une **garantie** qu'aucun artisan ne lira jamais un tarif affiché | impossible, et jamais promise | la base ferme l'application aux comptes pro (`not est_un_pro()`, §2.5), mais **Opus ne vérifie pas l'identité des particuliers** : un artisan peut ouvrir un second compte particulier avec une autre adresse. Une barrière, pas un verrou — les textes le disent (§5.9) |
| l'**avis d'un avocat** sur des tarifs affichés dans un petit marché | `A-FAIRE.md:1759-1762`, **déjà inscrit** | un **simple rappel** (réponse du 19/10) : rien dans `legal.js`, aucun contrôle bloquant dans `verifier-legal` |
| la lecture de `sos_availability` par `anon` (`"lecture dispo sos"`, `using (true)`) | `A-FAIRE.md` | elle ne porte plus aucun tarif (les colonnes mortes valent 0) ; la refermer aux connectés est une question de cohérence, pas de ce lot |
| `"ma dispo sos"` écrite `auth.uid() = …` à la main (`schema.sql:1208-1209`) | jamais | « les 56 règles existantes ne bougent pas » (CLAUDE.md) |
| un **mécanisme de ré-acceptation** des conditions | `A-FAIRE.md`, avant la sortie de `'essai'` | §0.2-4 ; il couvrira les 11 comptes sans version |
| le motif de `verifier-etats` qui ne voit pas `e.message ||` (`verifier-etats.mjs:96`) | `A-FAIRE.md` | élargi, il rougirait sur huit autres endroits hors de ce lot (relevé au §11.3) ; ce lot corrige seulement `SosScreen.js:56` et le contrôle le tient par une vérification ciblée |
| le **retrait** des colonnes mortes de `sos_availability` | `A-FAIRE.md`, un lot de nettoyage | il doit se faire dans `schema.sql` (section 10) ET sur la vraie base ensemble ; le connecteur refuse `drop column` (CLAUDE.md, mesuré le 17/10). D'ici là elles valent 0 et toute écriture non nulle est refusée |
| un **prix conseillé**, une moyenne, une médiane, « votre tarif face aux autres » | **jamais** | `DONNEES-DES-ARTISANS.md:758-765`, `:808-832` ; un contrôle le tient (§6.1-25) |

### 1.3 Ce que le lot 1 attend de ce lot, sans le construire

- **Le taux horaire existe, en centimes, TTC, à trois états.** Le lot 1 le **copie** à l'ajout d'une ligne de main-d'œuvre horaire, comme une valeur proposée et modifiable — jamais un lien (`PLAN-DEVIS.md:3100`, `:3131`). Un devis figé ne relit jamais `tarifs_pro`.
- **Au régime réel, la ligne est en HT** : le lot 1 proposera `round(taux_ttc / (1 + taux_tva_de_la_ligne))`, arrondi au centime, **et le dira** sous le champ. En franchise, le montant est le même. Ce lot ne pose **aucune** colonne HT.
- **`prix_devis_centimes`** est la valeur proposée du « caractère payant du devis » (cahier 0a §1.3).
- **`decompte_temps_texte`** entre dans l'instantané du lot 2 (`PLAN-DEVIS.md:1091`). **La majoration n'y entre pas** : la liste copiée (`PLAN-DEVIS.md:1087-1094`) ne la contient pas, et les textes le disent (§5.9).
- **Le prix de référence par poste (lot P) n'entre JAMAIS dans `tarifs_pro`**, qui devient lisible ligne par ligne (`PLAN-DEVIS.md:3121`, `:3129` ; `schema.sql:10066`). Le contrôle tient la liste FERMÉE des colonnes de `tarifs_pro` (§6.1-B).

### 1.4 Les règles plus strictes que la loi, dites comme telles

1. **Frais de déplacement déclarés pour tout devis**, même « offert » — tenue par le 0a (motif `frais_deplacement`, `schema.sql:9812-9813`), restée le 18/10. Inchangée.
2. **Pour apparaître dans le SOS : tarifs affichés, montant de déplacement (ou offert), taux horaire, majoration (ou « je ne majore pas »).** Présentée comme une **condition de fonctionnement** : l'écran ne dit jamais « la loi l'exige ». La phrase : « Un particulier voit vos tarifs avant de vous choisir : sans eux, Opus ne peut pas calculer d'estimation. » Confirmée par le propriétaire le 19/10 (question 1).

La règle de la version 1 « afficher exige un taux horaire et des frais » est **retirée** : elle fermait l'affichage aux dépanneurs au forfait. Afficher n'exige plus qu'**au moins un tarif** (§2.3), ce qui garantit seulement qu'un bloc affiché n'est jamais vide.

---
## 2. Le schéma : section 47 de `supabase/schema.sql`

### 2.0 Place, en-tête, et ce que la section ne pose pas

- **Place :** après `comment on function public.emetteur_incomplet(uuid) is …` (`schema.sql:10493-10497`), avant la ligne `-- ----` qui précède `--  42. L'EXPORT RGPD` (`schema.sql:10499-10500`). L'export (42) et le balayage (43) restent les deux derniers blocs.
- **Titre :** `--  47. LES TARIFS RÉUNIS — devis, fiche et SOS (lot T) (JJ/MM/2026)`.
- **L'en-tête dit, en français :**
  - ce qu'elle pose : six colonnes de `tarifs_pro` (cinq déclarées, une date posée par la base), cinq contraintes sur `tarifs_pro` et deux sur `sos_availability`, deux déclencheurs (le nettoyage des tarifs et la date d'affichage ; le refus des colonnes mortes du SOS), une politique de **lecture** pour les particuliers connectés, `metier_du_sos()`, `artisans_urgence()` déménagée et réécrite, un rattrapage qui ne tourne qu'une fois, et des droits retirés sur `sos_availability` ;
  - **les décisions qui la gouvernent** : « au choix de l'artisan » ; **répondre aux urgences exige d'afficher ses tarifs** (question 1, 19/10) ; **les tarifs affichés ne sont lus que par les particuliers** (question 2, 19/10) ;
  - **la règle de `tarifs_pro`, inchangée et devenue réelle** : on n'y range jamais rien qui doive rester privé, car une ligne affichée est lisible **toutes colonnes comprises** par tout particulier connecté (`schema.sql:10066-10068`) ;
  - **qui lit** : les particuliers connectés seulement — ni un autre artisan, ni l'administration ; le titulaire lit toujours sa propre ligne ; `anon` n'a toujours rien (46.5) ; et **la limite, dite telle quelle** : un artisan peut ouvrir un second compte particulier avec une autre adresse, Opus ne vérifie pas l'identité des particuliers — une barrière, pas un verrou ;
  - ce qu'elle ne pose pas, et pourquoi (le §1.2 en résumé) ;
  - **les colonnes mortes** de `sos_availability`, et pourquoi elles restent, à 0, protégées par un refus.
- **Rien de nouveau n'est `not null`.** La règle du 0a (`schema.sql:9829-9836`) tient.
- **Aucune contrainte en ligne** ; toutes nommées en `_check`.

### 2.1 `public.metier_du_sos(p_cle text)` — 47.1

```sql
create or replace function public.metier_du_sos(p_cle text)
returns text
language sql
immutable
set search_path = public
as $$
  select case p_cle
    when 'plomberie'   then 'plombier'
    when 'electricite' then 'electricien'
    when 'serrurerie'  then 'serrurier'
    when 'chauffage'   then 'chauffagiste'
  end
$$;

revoke all on function public.metier_du_sos(text) from public, anon;
grant execute on function public.metier_du_sos(text) to authenticated;
```

- **Elle naît AVANT le rattrapage**, qui l'appelle (47.2).
- **Les quatre paires sont celles de `METIERS_SOS`** (`urgences.js:15-20`), et les quatre clés celles de `sos_availability_metier_key_check` (`schema.sql:839-840`). Le contrôle compare les trois (§6.1-C). Aucun métier d'urgence n'a d'héritier dans le catalogue (`catalogue-metiers.js:109`, seule ligne `herite`, pour `macon`).
- **`authenticated` seulement** : `artisans_urgence` est `security invoker` et n'est plus appelée que par un compte connecté (47.6). `revoke … from public, anon` : PostgreSQL accorde `execute` à PUBLIC sur toute fonction neuve, et Supabase l'accorde en plus directement à `anon` (CLAUDE.md, section 38 ; `schema.sql:10617-10618` fait de même pour `mes_donnees`).

### 2.2 Les colonnes, et le rattrapage, qui ne tournent qu'UNE fois — 47.2

**Pourquoi « une fois ».** `schema.sql` se rejoue — par `psql` en essai, et par le propriétaire dans l'éditeur SQL. Un rattrapage rejoué ressusciterait un taux horaire que l'artisan a retiré. La garde est l'absence de la colonne : elle n'est vraie qu'au premier passage.

```sql
do $tarifs_47$
declare
  nb_copiees      int := 0;
  nb_non_copiees  int := 0;
  nb_eteintes     int := 0;
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'tarifs_pro'
                and column_name = 'taux_horaire_centimes') then
    return;   -- déjà fait : rejouer ne refait RIEN
  end if;

  /* `if not exists` sur CHACUNE : une base où une seule des autres existe
     déjà (un brouillon, un essai interrompu) ne fait pas échouer le bloc,
     donc tout le schéma sous ON_ERROR_STOP. La garde du rattrapage, elle,
     reste sur `taux_horaire_centimes`. */
  alter table public.tarifs_pro
    add column if not exists taux_horaire_centimes bigint,
    add column if not exists majoration_pct        integer,
    add column if not exists decompte_temps_texte  text,
    add column if not exists prix_devis_centimes   bigint,
    add column if not exists affiche               boolean default false,
    add column if not exists affiche_le            timestamptz;

  -- (a) ce qui se copie : la ligne SOS la plus parlante de chaque artisan,
  --     et seulement des valeurs STRICTEMENT positives et dans les bornes
  --     des contraintes de 47.3 (posées APRÈS ce bloc).
  create temporary table sos_a_copier on commit drop as
  select distinct on (sa.professional_id)
         sa.professional_id as pro_id,
         case when sa.deplacement > 0 and sa.deplacement <= 10000
              then round(sa.deplacement * 100)::bigint end as frais,
         case when sa.horaire >= 1 and sa.horaire <= 1000
              then round(sa.horaire * 100)::bigint end     as taux,
         case when sa.majoration between 1 and 200
              then sa.majoration end                         as maj
    from public.sos_availability sa
   order by sa.professional_id, sa.actif desc, sa.updated_at desc;

  insert into public.tarifs_pro as t
         (pro_id, frais_deplacement_centimes, taux_horaire_centimes, majoration_pct)
  select pro_id, frais, taux, maj from sos_a_copier
   where frais is not null or taux is not null or maj is not null
  on conflict (pro_id) do update set
    frais_deplacement_centimes = case
      when t.frais_deplacement_centimes is null and t.frais_deplacement_texte is null
      then excluded.frais_deplacement_centimes
      else t.frais_deplacement_centimes end,
    taux_horaire_centimes = coalesce(t.taux_horaire_centimes, excluded.taux_horaire_centimes),
    majoration_pct        = coalesce(t.majoration_pct, excluded.majoration_pct);
  get diagnostics nb_copiees = row_count;

  -- (b) ce qui n'est PAS arrivé, compté : toute ligne SOS dont une valeur non
  --     nulle ne se retrouve pas telle quelle dans tarifs_pro — conflit avec
  --     une valeur déjà déclarée, conditions seules, hors bornes, négative, ou
  --     ligne non retenue par `distinct on`. Un compte, jamais une valeur.
  select count(*) into nb_non_copiees
    from public.sos_availability sa
    left join public.tarifs_pro t on t.pro_id = sa.professional_id
   where (sa.deplacement <> 0
          and t.frais_deplacement_centimes is distinct from round(sa.deplacement * 100)::bigint)
      or (sa.horaire <> 0
          and t.taux_horaire_centimes is distinct from round(sa.horaire * 100)::bigint)
      or (sa.majoration <> 0 and t.majoration_pct is distinct from sa.majoration);

  -- (c) les colonnes MORTES ne gardent rien : elles restent lisibles de tous
  --     (« lecture dispo sos »). AVANT l'extinction (d), pour qu'aucune ligne
  --     ne soit jamais réécrite avec un chiffre non nul.
  update public.sos_availability
     set deplacement = 0, horaire = 0, majoration = 0
   where deplacement <> 0 or horaire <> 0 or majoration <> 0;

  -- (d) on n'est disponible en urgence que sur un métier de SA fiche
  update public.sos_availability sa
     set actif = false
   where sa.actif
     and not exists (select 1 from public.professional_profiles pp
                      where pp.id = sa.professional_id
                        and pp.metiers @> array[public.metier_du_sos(sa.metier_key)]);
  get diagnostics nb_eteintes = row_count;

  raise notice 'Section 47 : % ligne(s) de tarifs créées ou complétées ; % ligne(s) SOS dont une valeur n''a pas été copiée ; % ligne(s) SOS éteinte(s).',
               nb_copiees, nb_non_copiees, nb_eteintes;
end
$tarifs_47$;
```

Ce que chaque choix veut dire, et que le commentaire SQL redit :

| règle | raison |
|---|---|
| **seul ce qui est strictement positif est copié** | un `0` du SOS ne prouve rien : le formulaire écrivait `0` pour un champ vide (`ProfilEditScreen.js:145-147`, `Number(x) \|\| 0`). Décision du 17/10 : il devient `null` |
| **une valeur déjà déclarée n'est jamais écrasée** | une valeur de `tarifs_pro` a été déclarée avec les trois états ; une valeur SOS, peut-être avec un `0` silencieux. Sur la vraie base : `tarifs_pro` est vide |
| **des frais déjà déclarés en conditions seules ne reçoivent pas de montant** | « 45 € » collé à « gratuit jusqu'à 20 km, puis 0,50 €/km » donnerait une phrase que l'artisan n'a jamais écrite |
| **un seul compteur de ce qui n'est pas arrivé (b)** | la version 1 comptait des « conflits » et des « hors bornes », et laissait sans compte la ligne non retenue et la valeur négative. Une comparaison ligne à ligne compte tout, et ne rend qu'un nombre |
| **`affiche` n'est JAMAIS allumé** | rendre public est un geste de l'artisan. Sur la vraie base : 0 artisan concerné |
| **les bornes** | celles des contraintes de 47.3, écrites une seconde fois ICI parce que les contraintes n'existent pas encore. Le contrôle compare les deux (§6.1-C) |
| **`distinct on (…) order by actif desc, updated_at desc`** | la clé `(professional_id, metier_key)` permet plusieurs lignes ; `tarifs_pro` n'en a qu'une |
| **l'extinction (d) après la remise à 0 (c)** | le déclencheur de 47.7 refuse toute écriture non nulle dans les colonnes mortes ; il naît après ce bloc, mais l'ordre (c) puis (d) ne dépend pas de cette coïncidence |
| **la `NOTICE`** | lisible dans `psql` (essais §7.2) ; **non vérifié** qu'`apply_migration` la rende : sur la vraie base, la preuve est un relevé de forme avant et après (§8.2) |

**Le piège qui guette ce bloc : un corps plpgsql n'est planifié qu'à l'exécution.** L'`insert` nomme des colonnes qui n'existent qu'après l'`alter table` du même bloc ; l'essai de migration (§7.2) le **prouve**. Si PostgreSQL le refusait (non vérifié sur 17.6), la parade est de passer l'`insert` et le `select count(*)` par `execute`.

### 2.3 Les contraintes — 47.3

Toutes posées **après** le bloc de 47.2, sous la forme du fichier (`drop constraint if exists` puis `add constraint`), toutes en `_check`.

| table | nom | règle | pourquoi |
|---|---|---|---|
| `tarifs_pro` | `tarif_taux_horaire_check` | `taux_horaire_centimes is null or taux_horaire_centimes between 100 and 100000` | de 1 € à 1 000 € TTC de l'heure ; **pas de 0** : la borne basse garantit qu'une estimation ne vaut jamais « 0 – 0 € » |
| `tarifs_pro` | `tarif_majoration_check` | `majoration_pct is null or majoration_pct between 0 and 200` | les bornes de `sos_availability_majoration_check` (`schema.sql:844-845`) ; `0` écrit par l'interrupteur seulement |
| `tarifs_pro` | `tarif_devis_check` | `prix_devis_centimes is null or prix_devis_centimes between 0 and 100000` | `0` = « Mes devis sont gratuits », par l'interrupteur seulement |
| `tarifs_pro` | `tarif_decompte_texte_check` | `decompte_temps_texte is null or char_length(decompte_temps_texte) <= 200` | `LONGUEUR_MAX`, comparée par le contrôle |
| `tarifs_pro` | `tarif_affiche_check` | `affiche is not true or frais_deplacement_centimes is not null or frais_deplacement_texte is not null or taux_horaire_centimes is not null or prix_devis_centimes is not null` | **un bloc affiché n'est jamais vide** ; au moins UN prix (des frais, un taux ou un prix de devis). La majoration et le décompte modifient un taux : seuls, ils ne disent pas un prix |
| `sos_availability` | `sos_rayon_check` | `rayon_km between 1 and 200` | un rayon de 100 000 km ferait apparaître l'artisan dans la recherche de tous les particuliers |
| `sos_availability` | `sos_delai_check` | `delai_minutes between 5 and 600` | « ~0 min » ou un délai négatif s'afficherait devant une urgence (`SosScreen.js:227`) |

`tarif_affiche_check` **refuse**, il ne vide rien : tout retirer pendant que les tarifs sont affichés est refusé, avec une phrase qui dit d'éteindre d'abord l'interrupteur (§3). PostgreSQL vérifie les contraintes d'une table dans l'ordre alphabétique de leur nom (`emetteur.js:646-649`) : `tarif_affiche_check` passe en premier.

Les deux contraintes du SOS : la seule ligne réelle vaut 20 / 45 et **0 ligne** est hors bornes (mesuré). Dans la migration, elles sont posées sous condition (`pg_constraint`) : si une ligne violait la règle, l'ordre échouerait **bruyamment**, et c'est voulu — on ne corrige pas en silence le rayon de quelqu'un.

`comment on table public.tarifs_pro` **reste en section 46** (`schema.sql:10104-10109`), avec un texte corrigé : « Les tarifs d'un artisan, toutes taxes comprises : frais de déplacement, taux horaire et son décompte, majoration de nuit et de week-end, prix du devis (null = non déclaré ; 0 = un choix, écrit par un interrupteur). PRIVÉE tant que `affiche` est faux ; lisible LIGNE PAR LIGNE par les particuliers connectés — jamais par un autre compte pro — quand l'artisan l'allume, et `affiche_le` date ce geste : on n'y range jamais rien qui doive rester privé. Sections 46 et 47. » Une seule écriture, et la migration envoie la même.

### 2.4 Le déclencheur des tarifs — 47.4

```sql
create or replace function public.tient_les_tarifs_publics()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.decompte_temps_texte := nullif(btrim(coalesce(new.decompte_temps_texte, ''), E' \t\r\n'), '');
  new.affiche := coalesce(new.affiche, false);
  /* LA DATE DU GESTE, posée par la base, jamais par le téléphone : une date
     envoyée par le client est remplacée. Elle naît quand `affiche` passe à
     vrai, se garde tant qu'il le reste, et s'efface quand il s'éteint. */
  if not new.affiche then
    new.affiche_le := null;
  elsif tg_op = 'UPDATE' and old.affiche is true then
    new.affiche_le := old.affiche_le;
  else
    new.affiche_le := clock_timestamp();
  end if;
  return new;
end;
$$;

create or replace trigger trg_tient_les_tarifs_publics
  before insert or update on public.tarifs_pro
  for each row execute function public.tient_les_tarifs_publics();
```

- **Il ne se greffe pas sur `tient_les_tarifs()`** (`schema.sql:10262-10276`) : un corps plpgsql n'est analysé qu'à l'exécution, et les colonnes qu'il nommerait naissent plus bas (la leçon de la section 40). Les deux déclencheurs gardent des colonnes **disjointes**.
- **Il n'éteint jamais `affiche`** quand la ligne devient vide : la contrainte refuse.
- **`clock_timestamp()`**, pas `now()` : la leçon du journal d'administration (section 25).
- **Pourquoi cette date** : la seule justification de l'absence de ré-acceptation des conditions est que la publicité passe par un geste explicite (§0.2-4). Sans date, rien en base ne dirait quand ce geste a eu lieu. Elle est lisible comme le reste de la ligne quand elle est affichée — une date de mise en ligne ne révèle rien d'autre.
- Il rend `trigger` : le balayage de la section 43 lui retire `execute` (`schema.sql:10669-10683`).

### 2.5 Qui lit, qui écrit — 47.5

```sql
/* L'ÉCRITURE NE CHANGE PAS : "mes tarifs" (section 46.5) reste la seule
   politique qui permet insert, update ou delete. Celle-ci est `for select`
   et ne s'ajoute qu'à la LECTURE, en OU avec "mes tarifs" — c'est par
   "mes tarifs" que le titulaire lit TOUJOURS sa propre ligne, affichée ou
   non, bien qu'il soit un compte pro.

   LES PARTICULIERS SEULEMENT — décision du propriétaire du 19/10/2026.
   Les tarifs affichés servent au particulier qui choisit un artisan : sur
   sa fiche, et dans l'estimation du bouton SOS. Un autre artisan n'en a
   pas besoin, et sur un marché étroit il y lirait les prix de ses
   concurrents. `not est_un_pro()` le lui refuse, administrateur compris :
   le compte du propriétaire est un compte pro. L'engagement du 18/10,
   « aucun écran ne montre les prix d'un artisan à un autre », reste vrai.
   Un compte particulier « en attente » (porte de secours SIRET) n'a pas
   de fiche : c'est un particulier, il lit.

   UNE BARRIÈRE, PAS UN VERROU — et les textes opposables le disent : un
   artisan peut ouvrir un second compte, en particulier, avec une autre
   adresse e-mail. Opus ne vérifie pas l'identité des particuliers, et
   cette politique ne prétend pas le faire.

   `est_un_pro()` et `est_masque()` sont appelées par une politique : elles
   RESTENT exécutables par `authenticated` (une politique qui appelle une
   fonction interdite à l'appelant échoue au lieu de filtrer). On ne
   révoque rien ici.

   LES COMPTES CONNECTÉS SEULEMENT. Aucun écran d'Opus ne s'ouvre sans
   session : un droit pour `anon` n'aurait aucun lecteur, et rendrait les
   tarifs de tous les artisans qui les affichent à une seule requête sans
   compte. La 46.5 (« `anon` n'a rien ») reste vraie : aucun `grant` ici. */
drop policy if exists "tarifs affiches" on public.tarifs_pro;
create policy "tarifs affiches" on public.tarifs_pro
  for select to authenticated
  using (affiche is true and not public.est_un_pro() and not public.est_masque(pro_id));
```

- **`est_un_pro` et `est_masque` sont déjà gardiennes** (la première réserve la Place des pros et la lecture des demandes aux professionnels, la seconde filtre `posts`, `comments`, `reviews`…), toutes deux exécutables par `authenticated` : `verifier-portes` relève les fonctions appelées dans les politiques et refuse qu'on leur retire ce droit (`verifier-portes.mjs:123-171`). `est_un_pro` est `security invoker` et ne lit que `professional_profiles`, déjà en lecture publique : elle ne donne accès à rien. **Mesuré le 19/10 sur PostgreSQL 16**, schéma du dépôt rejoué deux fois : `has_function_privilege('authenticated', …, 'execute')` vaut `t` pour les deux.
- **Ce que voit qui, ligne par ligne** — mesuré le 19/10 sur PostgreSQL 16, avec cette politique posée sur le schéma du dépôt (essai jetable du dossier de travail, `essai-politique-particuliers.sql`) :

  | | ligne non affichée | ligne affichée |
  |---|---|---|
  | le titulaire | sa ligne (`"mes tarifs"`) | sa ligne (`"mes tarifs"`) |
  | un particulier connecté, compte « en attente » compris | rien | la ligne, sauf blocage dans un sens ou dans l'autre |
  | **un autre artisan** | rien | **rien** |
  | un visiteur sans compte | **permission denied** (inchangé) | **permission denied** (inchangé) |
  | **l'administration** (le compte du propriétaire est un compte pro) | rien (aucune politique `est_admin`) | **rien** — mesuré avec un compte pro inscrit dans `administrateurs` |

- **Le titulaire voit sa ligne non affichée** : tout lecteur public filtre `affiche is true` **explicitement** (`artisans_urgence`, la fiche d'un artisan, le complément de la carte SOS). D'où la règle des essais : **toute lecture publique s'éprouve avec un PARTICULIER**, jamais avec l'artisan ; **et toute non-lecture par un concurrent, avec un AUTRE artisan** (B), après que le particulier a lu 1 dans la même transaction.
- **`for all`, quatre portes** : la politique d'écriture reste `"mes tarifs"`, qui exige `est_mon_entreprise(pro_id)`. Un particulier peut désormais LIRE une ligne affichée ; un `update` ou un `delete` de sa part touche **0 ligne**, et un `insert … on conflict` est refusé par le `with check`. L'essai le prouve **sur une ligne affichée, avec le particulier qui la lit** (§7.1, cas 6) — mesuré le 19/10 : `UPDATE 0`, `DELETE 0`, `new row violates row-level security policy for table "tarifs_pro"`, taux intact.

### 2.6 `artisans_urgence()` — 47.6, et pourquoi elle déménage

**Elle quitte la section 14** (`schema.sql:1698-1725`) : une fonction `language sql` est contrôlée à sa création, et elle nomme désormais `tarifs_pro`, née en section 46. À sa place, un commentaire d'une ligne : « `artisans_urgence()` vit en section 47 : elle lit `tarifs_pro`. » Le `foreach` de la section 11 bis perd sa ligne `'public.artisans_urgence(text, double precision, double precision)'` (`schema.sql:1277`), et le commentaire de `schema.sql:1241-1243` est corrigé (« ses droits sont posés avec elle, section 47 »).

```sql
/* LA SIGNATURE ET LE TYPE DE RETOUR NE CHANGENT PAS, colonne pour colonne :
   l'application l'appelle — y compris l'icône « preview » figée du 17/10,
   qui lit encore `deplacement`, `horaire`, `majoration` —, et le connecteur
   refuse le `drop function` qu'un changement de type exigerait. Les tarifs
   viennent de `tarifs_pro`, en centimes, rendus en EUROS avec deux décimales.

   SECURITY INVOKER, et c'est ce qui tient la décision du 19/10 : elle lit
   `tarifs_pro` à travers « tarifs affiches ». Un particulier y trouve les
   artisans qui affichent leurs tarifs ; un artisan n'y trouve aucun autre
   artisan — au plus lui-même, par « mes tarifs ». */
drop function if exists public.artisans_urgence(text, double precision, double precision);

create or replace function public.artisans_urgence(
  p_metier_key text, p_lat double precision, p_lon double precision
) returns table (
  professional_id uuid, entreprise text, metier text, ville text,
  avatar_url text, verifie boolean,
  deplacement numeric, horaire numeric, majoration int, delai_minutes int,
  distance double precision
)
language sql stable set search_path = public as $$
  select
    pp.id, pp.entreprise, pp.metier, pp.ville,
    pp.avatar_url, pp.verifie,
    round(t.frais_deplacement_centimes::numeric / 100, 2),
    round(t.taux_horaire_centimes::numeric / 100, 2),
    t.majoration_pct,
    sa.delai_minutes,
    public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) as distance
  from public.sos_availability sa
  join public.professional_profiles pp on pp.id = sa.professional_id
  join public.tarifs_pro t            on t.pro_id = sa.professional_id
  where sa.actif
    and sa.metier_key = p_metier_key
    and pp.metiers @> array[public.metier_du_sos(sa.metier_key)]
    and t.affiche is true
    and t.frais_deplacement_centimes is not null
    and t.taux_horaire_centimes is not null
    and t.majoration_pct is not null
    and public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) is not null
    and public.distance_km(p_lat, p_lon, pp.latitude, pp.longitude) <= sa.rayon_km
  order by distance asc
$$;

revoke all on function public.artisans_urgence(text, double precision, double precision)
  from public, anon;
grant execute on function public.artisans_urgence(text, double precision, double precision)
  to authenticated;
```

Ce qui a été pesé :

- **`join`, pas `left join`** : un artisan sans ligne de tarifs n'a rien à montrer ; avec un `left join`, ses `null` deviendraient des `0` par `Number(null)` (`api.js:2686-2687`).
- **`t.affiche is true` écrit dans la fonction** : le titulaire lit sa propre ligne non affichée (§2.5).
- **Les trois `is not null`** : la condition de la question 1. Des conditions seules ne donnent pas d'estimation.
- **`security invoker`, toujours** : elle lit à travers la politique de 47.5. Un particulier qui a bloqué un artisan (ou qui a été bloqué) ne le voit plus dans la recherche, sans une ligne de plus. Deux contrôles refusent `security definer` (`verifier-emetteur.mjs:1085`, `verifier-legal.mjs:595`) — **et c'est aussi ce qui tient la réponse du 19/10** : en `security definer`, elle rendrait les tarifs affichés à n'importe quel compte, artisans compris.
- **Appelée par un artisan, elle ne rend aucun autre artisan** : la politique de 47.5 lui refuse leurs lignes de tarifs, et le `join` les écarte. Elle ne peut rendre que **lui-même**, par `"mes tarifs"`, s'il affiche ses tarifs, s'il est disponible sur ce métier et dans le rayon du point demandé — son propre prix, rien d'autre. **Mesuré le 19/10** sur PostgreSQL 16, avec une copie réduite de la fonction posée sur le schéma du dépôt : un particulier `1`, un autre artisan (administrateur) `0`, le titulaire `1` (lui-même). Le bouton SOS n'est de toute façon montré qu'aux comptes qui ne publient pas (`BottomNav.js:50-52`, `canPublish`).
- **Plus d'`anon`** : le droit mesuré n'avait aucun appelant (§0.1). Un `anon` qui l'appellerait tomberait d'ailleurs sur `permission denied for table tarifs_pro`. La fonction n'est appelée que depuis l'écran SOS, réservé aux comptes qui ne publient pas (`BottomNav.js:50-52`), donc connectés.
- **Les types** : `round(numeric, 2)` rend un `numeric`, `majoration_pct` est un `integer` : identique au type mesuré. Les noms des paramètres aussi — `create or replace` refuse de les changer.
- **Le `drop function if exists` reste dans `schema.sql`**, pour une base ancienne ; **il n'est PAS dans la migration**, où `create or replace` suffit (type identique, mesuré).

### 2.7 `sos_availability` : colonnes mortes, droits — 47.7

```sql
/* LES COLONNES MORTES N'ACCEPTENT QUE 0, et c'est un REFUS qui le dit.
   Une version ancienne de l'application (l'icône « preview » du 17/10
   écrit encore ces trois colonnes) ou un client modifié y écrirait des
   chiffres, lisibles de tous par « lecture dispo sos » : un tarif public
   que personne n'a choisi d'afficher. Les remettre à 0 en silence ferait
   dire « enregistré » à cette version pendant que rien n'est gardé : un
   travail qui n'a pas pu se faire ressemblerait à un travail fait.

   LE CORPS LIT LA LIGNE PAR `to_jsonb(new)`, pas `new.deplacement` : une
   fonction plpgsql ne crée aucune dépendance sur une colonne, et le jour où
   ces colonnes seront retirées, `new.deplacement` ferait échouer TOUTE
   écriture sur la table. Une clé absente rend `null`, donc rien à refuser. */
create or replace function public.refuse_les_colonnes_mortes_du_sos()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  ligne jsonb := to_jsonb(new);
begin
  if coalesce((ligne ->> 'deplacement')::numeric, 0) <> 0
     or coalesce((ligne ->> 'horaire')::numeric, 0) <> 0
     or coalesce((ligne ->> 'majoration')::numeric, 0) <> 0 then
    raise exception using
      errcode = 'OP012',
      message = 'Vos tarifs d’urgence ne se règlent plus ici : mettez à jour l’application Opus, '
             || 'puis réglez-les dans « Mon entreprise ». Votre disponibilité n’a pas été enregistrée.';
  end if;
  return new;
end;
$$;

create or replace trigger trg_refuse_les_colonnes_mortes_du_sos
  before insert or update on public.sos_availability
  for each row execute function public.refuse_les_colonnes_mortes_du_sos();

/* Les commentaires de colonne, SOUS CONDITION : un `comment on column`
   sur une colonne absente échouerait, et le schéma ne se rejouerait plus
   sur une base où elles auront été retirées. */
do $mortes_47$
declare
  c text;
begin
  foreach c in array array['deplacement', 'horaire', 'majoration'] loop
    if exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'sos_availability'
                  and column_name = c) then
      execute format('comment on column public.sos_availability.%I is %L', c,
        'MORTE depuis la section 47 (lot T) : ni lue ni écrite par l’application. Les tarifs vivent dans '
        || 'tarifs_pro. Toujours 0 ; toute autre valeur est refusée (OP012, refuse_les_colonnes_mortes_du_sos).');
    end if;
  end loop;
end
$mortes_47$;

revoke insert, update, delete, truncate on public.sos_availability from anon;
revoke truncate on public.sos_availability from authenticated;
```

- **Pourquoi `OP012` et pas une contrainte** : une contrainte rendrait `23514` sur un nom que l'ancienne application ne connaît pas, et elle afficherait la piste fausse « `schema.sql` n'a pas été rejoué ». Un code `OP` est rendu **tel quel** par `messageClair` (`erreurs.js:274-283`) — et ce passage existe depuis le 16/10 (`git log -S` : commit `23b6742`), donc **dans l'icône « preview » du 17/10** : la phrase française arrive à l'écran de l'ancienne version. Code libre : le schéma s'arrête à `OP011` (relevé par `grep`). `OP003` reste réservé au devis remis.
- **Ce que la nouvelle application envoie** : jamais ces colonnes. Une ligne neuve prend leur défaut (0) ; un `upsert` ne réécrit que les colonnes envoyées, qui valent 0 depuis le rattrapage. Le déclencheur ne mord donc que sur une version ancienne ou un client modifié.
- **Ce que l'ancienne version envoie** : `Number(x) || 0` (`ProfilEditScreen.js:145-147`). Champs vides → 0 → accepté ; chiffres tapés → refusés, avec la phrase. Et l'application n'écrit le SOS que pour un artisan qui a un métier d'urgence (`ProfilEditScreen.js:141`) : le compte du propriétaire n'en a aucun (mesuré).
- **Pourquoi elles restent** : le connecteur refuse `drop column` (CLAUDE.md, mesuré le 17/10). Leur retrait est un lot de nettoyage (§1.2), qui touchera la section 10 du fichier ET la vraie base ensemble. **Aucune ligne n'est demandée au propriétaire dans ce lot**, et le corps tolérant rend l'ordre indifférent le jour où ce sera fait.
- **Les droits** : `anon` garde `select` (`"lecture dispo sos"`) et perd le reste ; `authenticated` perd `truncate`, que la RLS ne filtre pas (`schema.sql:10325-10330`).
- **`updated_at`** : aucun lecteur. L'application cesse de l'envoyer depuis l'horloge du téléphone (§4.4) ; la colonne garde son défaut à l'insertion.

### 2.8 L'export RGPD — section 42, `mes_donnees()` réécrite en entier

Deux clés de plus, après `'mes_tarifs'` (`schema.sql:10592-10593`) :

```sql
    /* MA DISPONIBILITÉ AUX URGENCES (section 10) — l'article 15 : mon métier
       d'urgence, mon rayon, mon délai, et trois colonnes mortes, toujours à 0.
       Mes TARIFS sont dans `mes_tarifs`, colonnes nouvelles comprises. */
    'ma_disponibilite_urgences',
                 coalesce((select jsonb_agg(to_jsonb(x) order by x.metier_key)
                             from public.sos_availability x
                            where x.professional_id = auth.uid()), '[]'::jsonb),
    /* MES URGENCES, des deux côtés — comme 'devis' et 'rappels' plus haut :
       pour le particulier, c'est SA demande (adresse, détails, coordonnées) ;
       pour l'artisan, ce qu'on lui a adressé. Elles manquaient depuis le
       premier jour. */
    'urgences',  coalesce((select jsonb_agg(to_jsonb(x)) from public.sos_requests x
                            where x.client_id = auth.uid() or x.professional_id = auth.uid()), '[]'::jsonb),
```

- Le précédent : `'devis'` et `'rappels'` exportent déjà les deux côtés, nom et téléphone du client compris (`schema.sql:10544-10547`). `sos_requests` n'a **aucun droit de colonne** (relevé : aucun `grant select (` sur elle) : `to_jsonb(x)` ne tombe pas dans le piège de `mon_compte()`.
- `mes_donnees()` reste la dernière fonction du fichier (`verifier-emetteur.mjs:1242-1245`), `security invoker`, ses droits inchangés (`schema.sql:10617-10618`).

### 2.9 Le balayage (section 43)

Inchangé et dernier. Il couvre `tient_les_tarifs_publics()` et `refuse_les_colonnes_mortes_du_sos()`. `metier_du_sos` et `artisans_urgence` ne rendent pas `trigger`.

### 2.10 Ce qui se rejoue sur la VRAIE base, sans un ordre qui commence par `drop` ou `delete`

Un fichier de travail du dossier temporaire, **jamais commité**, passé par `apply_migration`, dans cet ordre :

1. `metier_du_sos` + `revoke` / `grant` ;
2. **le bloc `do $tarifs_47$` tel quel** (colonnes + rattrapage) ;
3. les sept contraintes **sous condition** : `if not exists (select 1 from pg_constraint where conname = '…' and conrelid = '…'::regclass) then execute 'alter table … add constraint … check (…)'; end if;` ;
4. `tient_les_tarifs_publics` + `create or replace trigger` ;
5. la politique **sous condition** (`pg_policies`) ; **aucun `grant`** ;
6. `artisans_urgence` **sans** le `drop function`, puis `revoke` / `grant` ;
7. le `comment on table` corrigé, `refuse_les_colonnes_mortes_du_sos` et son déclencheur, le bloc `$mortes_47$`, les deux `revoke` sur `sos_availability` ;
8. **`mes_donnees()` en entier** (le défaut du lot H) ;
9. **le bloc `do $portes$` du balayage**, rejoué.

Aucune politique existante n'est modifiée. On ne contourne pas le garde-fou : il n'y a rien à supprimer.

**L'ordre de mise en service** : la base d'abord, l'application ensuite. Une application à jour devant une base ancienne lirait des colonnes absentes : « Mon entreprise » échouerait. Une application ancienne devant la base nouvelle **lit** le SOS juste (même signature) ; son réglage SOS se voit **refuser** des chiffres, avec la phrase `OP012`. Cette version ancienne vit plus que quelques minutes : c'est l'icône « preview » du propriétaire (`A-FAIRE.md:1733-1737`). On le lui dit (§10.2).

---

## 3. `src/lib/erreurs.js` : les phrases

Dans `MESSAGES_CONTRAINTE` (`erreurs.js:65`), après `tarif_frais_texte_check` (`erreurs.js:100`) :

| contrainte | message (minuscule initiale, point final) |
|---|---|
| `tarif_affiche_check` | pour afficher vos tarifs, déclarez au moins vos frais de déplacement, votre taux horaire ou le prix de vos devis. Pour tout retirer, éteignez d’abord « Afficher mes tarifs sur ma fiche ». |
| `tarif_taux_horaire_check` | un taux horaire s’écrit comme un montant entre 1 € et 1 000 € TTC de l’heure. Si vous ne travaillez qu’au forfait, laissez-le vide. |
| `tarif_majoration_check` | la majoration de nuit et de week-end s’écrit en pourcentage, entre 0 et 200 %. |
| `tarif_devis_check` | le prix d’un devis s’écrit comme un montant entre 0 et 1 000 € TTC. |
| `tarif_decompte_texte_check` | `TEXTE_TROP_LONG` (`erreurs.js:63`) |
| `sos_rayon_check` | votre rayon d’intervention s’écrit en kilomètres, entre 1 et 200. |
| `sos_delai_check` | votre délai d’arrivée habituel s’écrit en minutes, entre 5 et 600. |

`OP012` n'a pas de phrase ici : un code `OP` porte la sienne (`erreurs.js:274-283`). Le contrôle exige que **chaque contrainte de `tarifs_pro` et de `sos_availability` relevée dans le schéma** ait sa phrase sans la piste « schema.sql » (§6.2), les deux anciennes du SOS comprises : `sos_availability_majoration_check` et `sos_availability_metier_key_check` n'en ont aucune aujourd'hui (relevé par `grep` sur `erreurs.js`), ce lot leur en donne une (« la majoration s’écrit en pourcentage, entre 0 et 200 %. » ; « ce métier n’a pas d’urgence dans Opus : choisissez plomberie, électricité, serrurerie ou chauffage. »).

---

## 4. Le calcul pur, et l'API

### 4.1 `src/lib/emetteur.js` — ce qui change (le formulaire et ses miroirs)

| export | changement |
|---|---|
| `COLONNES_ECRITES.tarifs_pro` (`emetteur.js:83`) | `['frais_deplacement_centimes', 'frais_deplacement_texte', 'taux_horaire_centimes', 'majoration_pct', 'decompte_temps_texte', 'prix_devis_centimes', 'affiche']`. **Commentaire au-dessus** : « Chaque colonne de cette liste devient lisible par tous les particuliers connectés pour l'artisan qui affiche ses tarifs. Un prix interne (marge, prix d'achat, prix de référence du lot P) n'y entre JAMAIS. `affiche_le` n'y est pas : c'est la base qui la pose. » |
| `CHOIX_DU_FORMULAIRE` (`emetteur.js:126`) | `+ 'majoration', 'devis'` : six choix, **tous à `null` au départ** |
| `etatInitialFormulaire(emetteur, tarifs)` (`emetteur.js:141`) | deux choix de plus, **rien de pré-coché** : `majoration` = `'aucune'` si `majoration_pct === 0`, `'taux'` si `> 0`, sinon `null` ; `devis` = `'gratuit'` si `prix_devis_centimes === 0`, `'payant'` si `> 0`, sinon `null`. **`affiche` n'est PAS un choix** : c'est un interrupteur, éteint par défaut (décision du 17/10), lu sur la ligne chargée — exactement comme « en liquidation » et « locataire-gérant » (`emetteur.js:134-135`, le commentaire de la fonction le dit) |
| `LONGUEUR_MAX.tarifs_pro` (`emetteur.js:197`) | `+ decompte_temps_texte: 200` |
| `MESSAGE_TAUX_ZERO` (nouveau) | « 0 € de l’heure n’est pas un taux : si vous ne travaillez qu’au forfait, laissez le champ vide. » |
| `MESSAGE_MAJORATION_ZERO` (nouveau) | « Pour dire que vous ne majorez pas, touchez « Je ne majore pas la nuit ni le week-end ». » |
| `MESSAGE_DEVIS_ZERO` (nouveau) | « Pour dire que vos devis sont gratuits, touchez « Mes devis sont gratuits ». » |
| `pourcentDepuisSaisie(texte)` (nouveau) | `'40'`, `'40 %'`, `' 40 '` → `{ ok: true, valeur: 40 }` ; `''` → `{ ok: true, valeur: null }` ; tout autre texte → `{ ok: false, message: 'Écrivez un pourcentage en chiffres, par exemple 40.' }`. Pas de flottant |
| `tarifsDepuisFormulaire({ frais, taux, decompte, majoration, devis, affiche })` (nouveau) | rend `{ ok, champ, valeurs, message }`. **Compose `fraisDepuisFormulaire(frais)`** (`emetteur.js:421-436`) sans la réécrire. Puis : `taux` par `versCentimes` (`emetteur.js:369-394`), **0 refusé** avec `MESSAGE_TAUX_ZERO` ; `majoration.aucune === true` → `0`, sinon `pourcentDepuisSaisie(majoration.pct)`, **0 tapé refusé** ; `devis.gratuit === true` → `0`, sinon `versCentimes(devis.montant)`, **0 tapé refusé** ; `decompte` passé tel quel (le déclencheur rogne) ; `affiche` → `affiche === true`. **Les trois interrupteurs sont les SEULS endroits qui écrivent un 0** |
| `nettoyerTarifs(t)` (`emetteur.js:524-529`) | + rognage de `decompte_temps_texte` ; `affiche` → `t.affiche === true` ; toute clé numérique `undefined` → `null`. **Miroir de `tient_les_tarifs()` ET de `tient_les_tarifs_publics()`** (sans la date, qu'aucun miroir ne pose) |
| `CONTRAINTES.tarifs_pro` (`emetteur.js:635-643`) | + `tarif_affiche_check`, `tarif_taux_horaire_check`, `tarif_majoration_check`, `tarif_devis_check`, `tarif_decompte_texte_check`, avec **les bornes exactes de 47.3** ; et **`tarif_frais_texte_check` ne regarde plus que `frais_deplacement_texte`** : il appelle aujourd'hui `tropLong(t, LONGUEUR_MAX.tarifs_pro)` (`emetteur.js:640`), qui vérifierait aussi le décompte sous le mauvais nom |
| `enteteImprime` (`emetteur.js:1165`) | **inchangé** (lot 2, §1.2) |

### 4.2 `src/lib/tarifs.js` — nouveau, le côté PUBLIC des tarifs

Il n'importe que `./emetteur.js` et `../data/urgences.js`, avec l'extension `.js` : `node` doit pouvoir l'ouvrir, parce que `verifier-tarifs` le **fait tourner**. Jamais `erreurs.js`, `theme.js` ni rien qui charge React Native.

| export | rôle |
|---|---|
| `HEURES_MAJOREES` | `'de 20 h à 7 h, le samedi et le dimanche'` — **ce que calcule `estNuitOuWeekend`** (`urgences.js:98-103`). Utilisée **seulement** dans l'aide du formulaire (« Opus l'applique… ») : la fiche publique ne la montre pas |
| `QUI_VOIT_LES_TARIFS` | **nouveau** (réponse du 19/10) : `'Visibles des particuliers connectés seulement : un autre artisan ne les voit pas depuis son compte.'` — **la seule écriture** de cette phrase, lue par l'aide de « Afficher mes tarifs sur ma fiche » (§5.1), par « Mes tarifs » sur sa propre page et par l'aperçu de « Mon entreprise » (§5.4). « depuis son compte » n'est pas une précaution de style : c'est la limite du second compte particulier, que la phrase ne doit pas nier |
| `metierDuSos(cle)` | miroir de `metier_du_sos()` |
| `metierSosDeLaFiche(metiers)` | **déménagé** de `ProfilEditScreen.js:41-48` (`metierSosDe`), pour qu'`OpusApp` et l'écran n'en aient qu'une |
| `pretPourLeSos(t)` | `{ pret, manque }`, `manque` ⊂ `['affiche', 'deplacement', 'taux', 'majoration']` dans cet ordre. **Miroir des quatre conditions DE TARIFS** du `where` d'`artisans_urgence` — pas de tout le `where` : la ligne active enregistrée, le métier sur la fiche et les coordonnées sont l'affaire d'`etatReglageSos`. `t` nul → les quatre |
| `MANQUES_SOS` | `{ affiche: 'vos tarifs ne sont pas affichés', deplacement: 'un montant de frais de déplacement, ou « Je ne facture pas de frais de déplacement » — des conditions seules ne permettent pas de calculer une estimation', taux: 'votre taux horaire', majoration: 'votre majoration de nuit et de week-end, ou « Je ne majore pas la nuit ni le week-end »' }` |
| `eurosCourts(c)` | `4500` → `'45 €'`, `4550` → `'45,50 €'`, `0` → `'0 €'`, `null`/non entier → `null`. Espaces insécables, comme `centimesLisibles` (`emetteur.js:397-404`) |
| `depuisLaRecherche(ligne)` | une ligne d'`artisans_urgence` → `{ frais_deplacement_centimes, taux_horaire_centimes, majoration_pct, affiche: true }`, par `versCentimes(String(x))` — **jamais `x * 100`** (`emetteur.js:361-363`). **`null`** si un des trois manque, est illisible, ou si le taux vaut moins de 100 centimes (une base pas encore migrée rendrait `0.00 / 0.00 / 0`) |
| `majorationSos({ creneau, maintenant, delaiMin })` | **nouveau** : `'oui'` / `'non'` / `'selon_heure'`. `'immediat'` → `estNuitOuWeekend(new Date(maintenant + delaiMin × 60 000))` : la nuit se juge à l'**heure d'arrivée**, pas à celle de la recherche ; `'journee'` et `'demain'` → `'selon_heure'` : l'heure de l'intervention n'est pas connue |
| `estimationSos(t, probleme, majoration)` | `{ min, max, majore }` en **euros entiers**, ou **`null`** si `t` n'est pas `pretPourLeSos`, si `probleme` manque, ou si `max <= 0`. `majore` = `majoration === 'oui' && pct > 0` — **jamais vrai pour un artisan qui ne majore pas**. Calcul : `coef = majore ? 100 + pct : 100` ; `min = Math.round((dep + taux × hMin) × coef / 10000)` ; idem `max`. **La majoration porte sur le déplacement ET les heures**, comme aujourd'hui (`urgences.js:89-93`) — question 4, réponse du 19/10 : « Comme aujourd'hui ». Avec un taux ≥ 100 centimes et une durée ≥ 0,5 h (`urgences.js:37-42`), `min ≥ 1` : « 0 – 0 € » ne peut plus sortir |
| `detailSos(t, majoration)` | la ligne de détail : `Déplacement offert` si `dep === 0`, sinon `Déplacement 45 €` ; puis ` · 62 €/h` ; puis, selon la majoration : `'oui'` et `pct > 0` → ` · +40 % la nuit et le week-end, déplacement compris` ; `'oui'` ou `'selon_heure'` et `pct === 0` → ` · sans majoration la nuit ni le week-end` ; `'selon_heure'` et `pct > 0` → ` · +40 % si l’intervention a lieu la nuit ou le week-end` ; `'non'` → rien. Jamais `null`, `NaN`, `undefined` ni « +0 % ». **La branche « (conditions sur sa fiche) » de la version 1 est retirée** : les conditions arrivent par `conditionsSos` |
| `conditionsSos(t)` | **nouveau** : les lignes de complément de la carte, **seulement celles qui sont déclarées** : `Devis : gratuit` / `Devis : 30 € TTC` ; `Temps : <décompte>` ; `Déplacement : <conditions>`. Rend `[]` si rien n'est déclaré |
| `noteSos(t, majore)` | **nouveau** : `Estimation avant diagnostic, sur des durées moyennes` + ` · majoration de nuit incluse` si `majore` + ` · hors prix du devis` si `prix_devis_centimes > 0` |
| `lignesTarifs(t)` | les lignes du bloc de la fiche, **seulement celles qui sont déclarées**, dans cet ordre : `{ cle: 'taux', libelle: 'Taux horaire', valeur: '62,00 € TTC de l’heure' }` ; `{ cle: 'decompte', libelle: 'Décompte du temps', valeur: <texte> }` ; déplacement : `{ libelle: null, valeur: 'Déplacement offert' }` si 0, `{ libelle: 'Déplacement', valeur: '45,00 € TTC' }` (+ ` — <conditions>`), ou `{ libelle: 'Déplacement', valeur: <conditions> }` ; majoration : `{ libelle: 'Majoration de nuit et de week-end', valeur: '+40 %' }` ou `'Aucune'` — **sans les heures d'Opus, sans « déplacement compris »** : l'artisan n'a déclaré qu'un pourcentage ; devis : `'Gratuit'` ou `'30,00 € TTC'`. Les montants passent par `centimesLisibles` |
| `reglageInitialSos(sos, metiers)` | **nouveau** (relecture application, B1) : `{ lisible, ligne, actif, rayon, delai, autresActives }`. `sos` nul ou `{ echec: true }` → `lisible: false`, `actif: false`, `rayon: '20'`, `delai: '45'`. Sinon `ligne` = la ligne de `sos.lignes` dont `metierKey` est celui de `metierSosDeLaFiche(metiers)` (les métiers **initiaux**) ; `actif = !!(ligne && ligne.actif)` ; `rayon = String(ligne ? ligne.rayonKm : 20)`, idem le délai ; `autresActives` = les clés des lignes actives d'un AUTRE métier |
| `etatReglageSos({ sos, sosMetier, interrupteur, enregistre, tarifs, aDesCoordonnees })` | **nouveau** (relecture application, I9) : `{ cle, phrase, manque, aEteindre }`, **une seule écriture de la phrase**, appelée par `ProfilEditScreen` et par `MonEntreprise`. Priorités, **dans cet ordre** : `sos.echec` → `tarifs.echec` → orpheline (aucun métier d'urgence sur la fiche, une ligne active) → pas de métier d'urgence → interrupteur éteint → sans coordonnées → non affichés → incomplets → prêt. « Prêt » se dit au **présent** si `enregistre` (la ligne active du métier est en base) et au **futur** sinon (« En enregistrant, vous apparaîtrez… »). `aEteindre` = les autres lignes actives que l'enregistrement éteindra (§5.2) |
| `reglageSosDepuisSaisie({ actif, rayon, delai, ligne })` | `{ ok, valeurs: { rayonKm, delaiMinutes }, champ, message }`. **Interrupteur éteint : rien n'est validé**, les valeurs de `ligne` (ou 20 / 45) sont renvoyées telles quelles — un champ que l'on ne voit plus ne peut pas bloquer l'enregistrement du profil. Allumé : entiers seulement, 1 à 200 km, 5 à 600 minutes (les bornes de 47.3) ; vide → refus |
| `artisansDisponiblesDemo(metierKey, { sos, tarifs, pros })` | le miroir de démonstration d'`artisans_urgence` : les lignes de `sos` actives sur `metierKey`, dont le métier est sur la fiche (`pros[id].metiers` ou, à défaut, `[pros[id].metier]` — les fiches 2, 6, 7 et 8 n'ont que `metier`, `demo.js:56-140`), dont `tarifs[String(proId)]` est `pretPourLeSos`, triées par distance. Rend la forme de `chercherArtisansUrgence` (§4.4) |

**`estimation()` et `artisansDisponibles()` quittent `src/data/urgences.js`** (`urgences.js:87-96`, `:109-113`). `urgences.js` garde `METIERS_SOS`, `PROBLEMES`, `CRENEAUX_SOS`, `SOS_ARTISANS` **sans ses trois chiffres** (gardés : `proId`, `metierKey`, `distanceKm`, `delaiMin`, `actif`), et `estNuitOuWeekend`. Son en-tête (`urgences.js:1-12`) est réécrit. Il reste **sans aucun import** (`verifier-metiers.mjs:177`).

### 4.3 Les données de démonstration

**`src/data/tarifs-demo.js`** (nouveau, sans import) : `TARIFS_DEMO`, objet gelé indexé par **chaîne** (`'2'`, `'4'`…), qui fait **vivre chaque cas** :

| fiche | état | ce qu'on voit |
|---|---|---|
| 4 (plombier) | affichés, 45 € / 62 €/h / 40 %, décompte « Toute heure commencée est due », devis gratuit | SOS (avec « Temps : … » et « Devis : gratuit ») et fiche |
| 2 (électricienne) | affichés, 39 € / 58 €/h / 35 %, **devis 30 €** | SOS avec « Devis : 30 € TTC » et « hors prix du devis » |
| 6 (serrurier) | affichés, **déplacement offert** / 70 €/h / 50 % | « Déplacement offert » |
| 7 (chauffagiste) | affichés, 49 € / 65 €/h / **0 %** | « sans majoration la nuit ni le week-end », **et pas « majoration incluse »** |
| 8 (plombière) | **non affichés**, 35 € / 55 €/h / 25 % | **absente du SOS** et aucun bloc sur sa fiche |

**Le réglage SOS en démonstration** (relecture application, I10) : `mesSos` de la fiche 1 (maçon et carreleur, `demo.js:29-30`, celle du compte de démonstration, `api.js:3765-3767`) vaut `{ lignes: [{ metierKey: 'electricite', actif: true, rayonKm: 20, delaiMinutes: 45 }] }` — **l'état exact de la vraie base** : une ligne orpheline. Le cas « orpheline » se voit à l'ouverture ; ajouter « électricien » aux métiers fait apparaître les autres états. La fiche 1 garde `tarifs: null` (`emetteur-demo.js`) : on y essaie le formulaire de zéro.

### 4.4 `src/lib/api.js`

**La fonction de démarrage s'appelle `loadAll()`** (`api.js:583`) — la version 1 la nommait `chargerTout`, qui n'existe pas.

| endroit | changement |
|---|---|
| `loadAll`, la lecture SOS (`api.js:704`) | `supabase.from('sos_availability').select('metier_key, actif, rayon_km, delai_minutes').eq('professional_id', uid)` — **un tableau**, plus `maybeSingle()` |
| `loadAll`, les erreurs (`api.js:717-718`) | inchangé pour les trois qui bloquent ; **la lecture SOS est LUE** : en échec, `mesSos = { echec: true }` — jamais `null`, qui voudrait dire « rien d'enregistré » |
| `loadAll`, la conversion (`api.js:807-816`) | `mesSos` = `{ lignes: [{ metierKey, actif, rayonKm, delaiMinutes }] }` ; plus aucun `deplacement`, `horaire`, `majoration` |
| `loadAll`, la démonstration (`api.js:634`) | `mesSos` : la ligne orpheline de §4.3 |
| **`mesTarifs()`** (nouveau) | `supabase.from('tarifs_pro').select('*').eq('pro_id', currentUserId).maybeSingle()` → la ligne ou `null` ; une erreur est **levée**. Appelée par `OpusApp` dans le bloc **réservé aux comptes pro** (§5.5), **pas** dans `loadAll` : un particulier n'a pas de tarifs, et la lecture ne part pas pour lui. Démonstration : `ficheEmetteurDemo(moiEnDemo()).tarifs` |
| **`tarifsAffichesDe(proId)`** (nouveau) | `supabase.from('tarifs_pro').select('*').eq('pro_id', proId).eq('affiche', true).maybeSingle()` → la ligne ou `null`. **`.eq('affiche', true)` est obligatoire** : le titulaire lirait sinon sa ligne non affichée. Filtrée par la politique de 47.5 : **un compte pro reçoit `null`** — et `OpusApp` ne l'appelle de toute façon que pour un particulier (§5.5), ce qui garde la démonstration honnête. Démonstration : `TARIFS_DEMO[String(proId)]` s'il est affiché, sinon `null` |
| `profilProDeSupabase(id)` (`api.js:924-960`) | **inchangé** : les tarifs n'y passent pas (la version 1 y ajoutait une quatrième lecture, que `viewProfile` ne relance plus après la première ouverture, `OpusApp.js:1318-1322`) |
| `updateSosAvailability(sos)` (`api.js:2444-2458`) | nouvelle forme `{ metierKey \| null, actif, rayonKm, delaiMinutes }`. (1) si `metierKey` : `upsert({ professional_id: currentUserId, metier_key, actif, rayon_km, delai_minutes }, { onConflict: 'professional_id,metier_key' })` — **plus de tarifs, plus d'`updated_at` venu du téléphone** ; (2) **toujours** : `update({ actif: false }).eq('professional_id', currentUserId)` restreint à `metier_key <> metierKey` (ou à toutes les lignes si `metierKey` est `null`). Reste `!hasSupabase ? noop : async (sos) => {…}` : pas de paramètre par défaut |
| `chercherArtisansUrgence` (`api.js:2674-2693`) | rend **`{ artisans, nonAffichables }`**. (1) l'appel `rpc('artisans_urgence')` inchangé ; (2) chaque ligne → `tarifs = depuisLaRecherche(a)` ; une ligne illisible est **comptée** dans `nonAffichables`, pas jetée en silence ; (3) **si la base a rendu des lignes et qu'aucune n'est lisible**, il **lève** `new Error('Des artisans sont disponibles, mais leurs tarifs n’ont pas pu être lus. Réessayez dans un instant.')` ; (4) **une seconde lecture**, sur les seuls identifiants rendus : `supabase.from('tarifs_pro').select('pro_id, frais_deplacement_texte, decompte_temps_texte, prix_devis_centimes').in('pro_id', ids).eq('affiche', true)` — filtrée par la politique de 47.5 ; ses trois valeurs rejoignent `tarifs` ; en échec, chaque artisan porte `complements: 'echec'` et la carte le dit (§5.3), l'estimation reste. Chaque artisan : `{ proId, metierKey, tarifs, complements, delaiMin: a.delai_minutes, distanceKm: a.distance }`. Plus aucun `Number(a.deplacement)` |
| `createSosRequest` (`api.js:2709-2728`) | inchangé : `prix_min` / `prix_max` restent des euros entiers |
| `monEmetteur`, `enregistrerEmetteur` (`api.js:1904-1970`) | inchangés dans leur code : `pourLaBase('tarifs_pro', …)` et `COLONNES_ECRITES` portent les colonnes nouvelles, et retirent `affiche_le` |

**Ce qui ne doit jamais apparaître** dans `api.js` : un `from('tarifs_pro')` qui ne désigne ni `currentUserId` ni `.eq('affiche', true)`, ou qui écrit sans `currentUserId` (§6.3-7).

---
## 5. Les écrans

### 5.1 « Mon entreprise » : les sections « Vos tarifs » et « Afficher mes tarifs »

**Une seule porte d'écriture des tarifs.** La section 11 de `FicheEmetteur.js` (`FicheEmetteur.js:958-1026`, ancre `frais`) devient **« Vos tarifs »** ; l'ancre reste `frais` (`SECTION_DU_MOTIF` y envoie déjà le motif `frais_deplacement`). **Une section 12 nouvelle, « Afficher mes tarifs », ancre `affiche`**, porte l'interrupteur : la rangée « Afficher mes tarifs » du réglage SOS y mène directement, au lieu du haut d'une section de cinq blocs (relecture application, m18).

**« Vos tarifs »**, dans l'ordre, chaque bloc avec son petit titre (`s.label`) :

1. **Frais de déplacement** — l'existant (`FicheEmetteur.js:961-1005`). L'étiquette du montant devient « Montant TTC » et son `accessibilityLabel` « Frais de déplacement, en euros toutes taxes comprises ».
2. **Taux horaire** — `ChampLocal`, `keyboardType="decimal-pad"`, **sans `returnKeyType`**, étiquette « Taux horaire TTC », placeholder « En euros de l’heure, par exemple 62 », refus de « 0 » à la sortie du champ (`onBlur`, comme `FicheEmetteur.js:985-992`) avec `MESSAGE_TAUX_ZERO`.
3. **Décompte du temps** — `ChampLocal` multiligne, `maxLength={LONGUEUR_MAX.tarifs_pro.decompte_temps_texte}`, placeholder « Par exemple : toute heure commencée est due ; au quart d’heure après la première heure ». Aide : « Comment vous comptez le temps passé : il accompagne votre taux horaire. »
4. **Majoration de nuit et de week-end** — `Interrupteur` « Je ne majore pas la nuit ni le week-end » (choix `majoration: 'aucune'`) ; sinon un champ pourcentage `number-pad`, sans `returnKeyType`, « 0 » refusé. Aide, toujours visible : « Elle ne sert qu’à l’estimation des urgences. Opus l’applique `HEURES_MAJOREES`, au déplacement comme aux heures. Votre fiche n’affiche que le pourcentage. »
5. **Prix du devis** — `Interrupteur` « Mes devis sont gratuits » (choix `devis: 'gratuit'`) ; sinon « Prix du devis TTC » en `decimal-pad`, « 0 » refusé.
6. **La phrase de l'arrêté**, qui remplace `FicheEmetteur.js:1021-1025` : « Si vous faites du dépannage, de la réparation ou de l’entretien, l’arrêté du 24 janvier 2017 (art. 3) demande que vos tarifs soient accessibles sur tout espace en ligne consacré à votre activité, même si votre site les affiche déjà. On ne sait pas encore si votre fiche Opus en est un. Vos tarifs n’y apparaissent que si vous choisissez de les afficher. » — **aucune appréciation de « prudence »** : la formule du plan « le moins prudent côté conformité » (`PLAN-DEVIS.md:2633-2638`) qualifiait le défaut d'Opus avant la réponse du 17/10, pas le choix d'un artisan ; « tout espace » est la citation que le plan donne de l'art. 3 (`PLAN-DEVIS.md:590-592`), plus large que « vos pages en ligne » ; « même si votre site les affiche déjà » est la lecture du plan (`:2988`). **La citation n'a pas été relue sur Légifrance** : le point 11 de `PLAN-DEVIS.md:3341` le demande ; le propriétaire n'a pas recopié les art. 2 et 3 (19/10), donc **la phrase reste sans guillemets** et le point reste ouvert.

**Les trois phrases de `FicheEmetteur.js:1013-1020` disparaissent** (« Ces frais-ci, ceux de vos devis, ne sont montrés à personne… », « se règlent encore à part… », « Ceux-là s’affichent aux particuliers… ») : elles décrivaient l'écart que ce lot ferme. Leur commentaire (`:1007-1012`) aussi.

**« Afficher mes tarifs »** (section 12) : un `Interrupteur` « Afficher mes tarifs sur ma fiche » (`accessibilityRole="switch"`, `minHeight` de `s.option`). Son aide, selon l'état :
- **éteint** : « Vos tarifs ne s’affichent nulle part. Tant qu’ils sont cachés, ils ne servent qu’à préparer vos devis, et vous n’apparaissez pas dans les urgences. »
- **allumé** : « Vos tarifs s’affichent sur votre fiche et servent, si vous répondez aux urgences, à l’estimation du bouton SOS. » + `QUI_VOIT_LES_TARIFS` (« Visibles des particuliers connectés seulement : un autre artisan ne les voit pas depuis son compte. ») + « Vous pouvez les retirer à tout moment. » — la phrase du milieu vient de `tarifs.js`, jamais réécrite à la main (réponse du 19/10) ;
- et, s'ils sont affichés en base : « Affichés depuis le {dateFrancaise(affiche_le)}. »

Toucher l'interrupteur **ne fait que changer l'état du formulaire** ; c'est « Enregistrer » qui écrit, et `validerTarifs` refuse **avant l'envoi** une ligne affichée vide (`tarif_affiche_check`, même phrase qu'en base).

**Le câblage du formulaire** (relecture application, I12) :
- `etatDepuis()` (`FicheEmetteur.js:120-129`) prépare `textes.taux_montant`, `textes.decompte`, `textes.majoration_pct`, `textes.devis_montant` — **le 0 ne s'écrit jamais dans un champ** ; et rend `afficheTarifs: t.affiche === true`, **à côté de** `enLiquidation` et `locataireGerant`, pas dans `choix` ;
- `memeEtat()` (`FicheEmetteur.js:146-155`) compare `!!x.afficheTarifs`, comme les deux drapeaux : allumer puis éteindre ne fait pas apparaître de fausse bande « Quitter sans enregistrer » ;
- `lireTextes()` (`FicheEmetteur.js:297-312`) lit les quatre champs nouveaux, comme il lit `frais_montant` : sans eux, `aDesChangements()` ne verrait pas un taux tapé, et fermer la fenêtre perdrait la saisie sans prévenir ;
- `SECTION_DU_CHAMP` (`FicheEmetteur.js:73-99`) : `taux_horaire_centimes`, `majoration_pct`, `decompte_temps_texte`, `prix_devis_centimes` → `'frais'` ; `affiche` → `'affiche'` ; un refus fait défiler jusqu'au champ (`MonEntreprise.js:304-313`) ;
- `sous()` et `erreurFrais` (`FicheEmetteur.js:281`, `:410-415`) deviennent `erreursLocales`, un objet par champ (frais, taux, majoration, devis), posé par les `onBlur` ;
- `lirePourEnregistrer` (`FicheEmetteur.js:339-391`) appelle **`tarifsDepuisFormulaire`** au lieu de `fraisDepuisFormulaire`, et rend `tarifs: t.valeurs` avec **toutes** les colonnes écrites.

**`MonEntreprise.js`** :
- `enregistrer` (`MonEntreprise.js:325-375`) : la règle « UNE LIGNE DE TARIFS VIDE NE S'ÉCRIT PAS » (`:341-348`) s'étend : vide = les six valeurs `null` **et** `affiche` faux. L'échec `e.etape === 'tarifs'` dit « … mais pas vos tarifs » (`:367-369`).
- **`onTarifs(t)`** (prop nouvelle) est appelée **après toute lecture réussie** (`lireFiche`, `:75-84`) **et** après un enregistrement : `OpusApp` garde ainsi `mesTarifs` à jour, et un réglage SOS qui disait « vos tarifs n’ont pas pu être lus » se corrige dès que « Mon entreprise » les a lus (relecture application, I8-b).
- **Le mode `lecture`** gagne un bloc « **Vos tarifs** », après l'aperçu de l'en-tête et avant le bouton principal, **gardé par `donnees.etat === 'pret'`**, comme l'aperçu (`:538-545`) — sinon une lecture en cours ou en échec (`tarifs: null`, `:70`, `:81`) s'afficherait « Non affichés » (relecture application, I8-a) :
  - l'état : « Affichés sur votre fiche depuis le … » ou « Non affichés : tant qu’ils sont cachés, ils ne servent qu’à préparer vos devis. » ;
  - si au moins une ligne est déclarée : `<TarifsPublics>` en aperçu, titré « Ce que voient les particuliers » (affichés) ou « Ce que verraient les particuliers » (non affichés), avec `quiLesVoit={QUI_VOIT_LES_TARIFS}` — **on montre avant de publier, et à qui**. « vos clients » est retiré : un client professionnel ne les voit pas (réponse du 19/10) ;
  - si un métier d'urgence ou une ligne orpheline existe : la phrase d'`etatReglageSos` reçue d'`OpusApp` (prop `etatSos`) ;
  - une rangée appuyable « Modifier mes tarifs », `minHeight: TOUCHE`, qui passe en `edition` sur l'ancre `frais`.

### 5.2 « Modifier mon profil » : le réglage SOS montre, et renvoie

Le bloc `ProfilEditScreen.js:626-686` est réécrit. **Il n'écrit plus aucun tarif.** Les états `deplacement`, `horaire`, `majoration` (`:97-99`) disparaissent.

**L'état de départ** (relecture application, B1) — c'est le point qui aurait éteint le SOS de tout artisan qui enregistre son profil :

```js
const depart = reglageInitialSos(sos, profil.metiers || []);
const [sosActif, setSosActif] = useState(depart.actif);
const [rayonKm, setRayonKm] = useState(depart.rayon);
const [delaiMinutes, setDelaiMinutes] = useState(depart.delai);
```

`useState(!!(sos && sos.actif))` (`ProfilEditScreen.js:96`) et ses deux voisins (`:100-101`) lisaient la forme d'aujourd'hui ; avec `{ lignes }`, ils rendraient l'interrupteur éteint et le rayon à 20 — et `enregistrer` enverrait `actif: false`. Changer sa présentation aurait suffi à se retirer du SOS, sans un mot.

Props nouvelles : `tarifs` (= `mesTarifs`), `aDesCoordonnees` ; `sos` change de forme (`{ lignes } | { echec: true }`). `onOuvrirEntreprise` reçoit une ancre : `OpusApp` passe `(section) => ouvrirMonEntreprise(section)` (`ouvrirMonEntreprise` ignore ce qui n'est pas une chaîne, `OpusApp.js:2214-2218`).

**La ligne d'état** est `etatReglageSos({ sos, sosMetier: metierSosDeLaFiche(metiers), interrupteur: sosActif, enregistre: !!(depart.ligne && depart.ligne.actif && depart.ligne.metierKey === sosMetier.key), tarifs, aDesCoordonnees })` :

| état (dans l'ordre des priorités) | ce qui s'affiche |
|---|---|
| `sos.echec` | « Vos réglages d’urgence n’ont pas pu être lus. Ils ne seront pas modifiés par cet enregistrement : réessayez plus tard. » ; l'interrupteur est désactivé ; l'enregistrement envoie `sos: null` |
| `tarifs.echec` | « Vos tarifs n’ont pas pu être lus : on ne peut pas dire si vous apparaissez dans les urgences. » + rangée « Ouvrir mes tarifs » |
| orpheline | « Vous répondiez aux urgences « {label} », mais ce métier n’est plus sur votre fiche : vous n’y apparaissez plus. En enregistrant, cette disponibilité sera désactivée. » ; l'enregistrement envoie `sos: { metierKey: null, … }` |
| pas de métier d'urgence | la phrase actuelle (`:678-680`) |
| interrupteur éteint | l'interrupteur et sa phrase actuelle (`:635-645`) |
| sans coordonnées | « Vous n’apparaîtrez pas dans les urgences : votre fiche n’a pas de position. Ouvrez votre ville dans ce formulaire et choisissez-la dans la liste. » (0 cas aujourd'hui, mesuré ; `completerLieu()` peut échouer en silence) |
| non affichés | « Vous n’apparaîtrez pas dans les urgences : vos tarifs ne sont pas affichés. Un particulier voit vos tarifs avant de vous choisir ; sans eux, Opus ne peut pas calculer d’estimation. » + rangée « Afficher mes tarifs » (ancre `affiche`) |
| incomplets | « Vous n’apparaîtrez pas dans les urgences : il manque » + la liste de `MANQUES_SOS` + rangée « Compléter mes tarifs » (ancre `frais`) |
| prêt, enregistré | « Vous apparaissez dans les urgences « {label} » autour de chez vous, avec ces tarifs : » + `lignesTarifs(tarifs)` + rangée « Modifier mes tarifs » |
| prêt, pas encore enregistré | « En enregistrant, vous apparaîtrez dans les urgences « {label} », avec ces tarifs : » + les mêmes lignes |

Et, sous la ligne d'état, si `aEteindre` n'est pas vide (relecture application, m17) : « En enregistrant, votre disponibilité « {label} » sera désactivée : Opus ne gère qu’un métier d’urgence à la fois. » — le cas d'un plombier-chauffagiste (fiche 4 de démonstration, `demo.js:90-91`) dont une ligne « chauffage » serait active.

- **L'interrupteur reste libre** : on peut l'allumer avant d'avoir affiché ses tarifs ; la ligne d'état dit la vérité.
- **Les rangées** ouvrent `onOuvrirEntreprise('frais')` ou `('affiche')` : la fenêtre monte par-dessus, et `mesTarifs`, mis à jour par `onTarifs`, redessine la ligne d'état. Chaque rangée : `minHeight: TOUCHE` (`:329-342`), jamais `BtnMini`.
- **Rayon et délai** : champs `number-pad` sans `returnKeyType`, lus par `reglageSosDepuisSaisie` **seulement si l'interrupteur est allumé** (relecture application, m16) ; un refus appelle `onErreur(message)` et n'enregistre rien.
- L'avertissement (`:665-672`) devient (relecture droit, I11) : « Ces tarifs servent à calculer une estimation affichée au particulier avant votre déplacement. Ce n’est pas un devis : après diagnostic, pour un dépannage, une réparation ou un entretien, un devis écrit reste dû dès le premier euro. » (`PLAN-DEVIS.md:325-328`, rangé parmi ce qui est « SÛR »).
- **`enregistrer`** (`:120-153`) envoie `sos: { metierKey: sosMetier ? sosMetier.key : null, actif: sosMetier ? sosActif : false, rayonKm, delaiMinutes }` — sauf `sos.echec` (`null`), ou ni métier d'urgence ni ligne active (`null`).
- L'en-tête du fichier (`:1-7`) est corrigé.

### 5.3 L'écran SOS

`SosScreen.js` :
- **l'erreur** (`:56`) : `setErreur(messageClair(e, "La recherche d'artisans"))` — aujourd'hui `e.message` brut, donc l'anglais de PostgREST à l'écran d'un particulier (relecture application, I5) ;
- **le résultat** (`:49-54`) : `setArtisans(r.artisans)`, `setNonAffichables(r.nonAffichables)` ;
- **la liste VISIBLE est calculée avant le rendu** (relecture application, I4) : `visibles = artisans` dont la fiche est connue (`pros[a.proId]`) et dont `estimationSos(a.tarifs, probleme, majorationSos({ creneau, maintenant, delaiMin: a.delaiMin }))` n'est pas `null`. **L'état vide** (`:268-273`) porte sur `visibles` **et** sur le nombre rendu par la base : la base n'a rien rendu → la phrase actuelle ; la base a rendu des artisans mais aucun n'est visible → « Des artisans sont disponibles, mais leur fiche n’a pas pu être affichée. Réessayez. » ; certains seulement → les cartes, plus une ligne « {n} artisan(s) disponible(s) n’ont pas pu être affichés. » ;
- **le bandeau** (`:79-83`) ne dépend plus de l'heure de la recherche : « Les prix affichés sont des estimations avant diagnostic, toutes taxes comprises. » — la majoration se dit **sur chaque carte**, artisan par artisan, à son heure d'arrivée ; `const majore = estNuitOuWeekend()` (`:41`) disparaît ;
- **la fourchette** (`:234`) : `{prix.min} – {prix.max} € TTC` ;
- **la note** (`:235-237`) : `noteSos(a.tarifs, prix.majore)` — « majoration de nuit incluse » n'apparaît jamais pour un artisan à 0 % (relecture application, I3) ;
- **le détail** (`:260-263`) : `detailSos(a.tarifs, majoration)` ;
- **le complément** (relecture droit, I7) : les lignes de `conditionsSos(a.tarifs)` sous le détail ; si `a.complements === 'echec'` : « Prix du devis et conditions non lus : demandez-les-lui quand il vous appelle. » ;
- `onEnvoyer` : `prixMin: prix.min, prixMax: prix.max` (`:254-255`) — pour « Dans la journée » et « Demain », l'estimation **non majorée**, que la carte a montrée.

Les imports (`:20-22`) : `METIERS_SOS, PROBLEMES, CRENEAUX_SOS` de `../data/urgences` ; `estimationSos, detailSos, conditionsSos, noteSos, majorationSos` de `../lib/tarifs` ; `messageClair` de `../lib/erreurs`.

**Jamais « null € », jamais « 0 – 0 € », jamais « +0 % », jamais « majoration incluse » à 0 %** : le contrôle fait tourner les fonctions sur tous les cas (§6.1-A).

### 5.4 La fiche publique : `src/components/TarifsPublics.js`

- Props : `tarifs`, `titre`, et **`quiLesVoit`** (facultative, nouvelle : une phrase en `C.muted` sous le titre ; seuls « Mes tarifs » et l'aperçu de « Mon entreprise » la passent, toujours avec `QUI_VOIT_LES_TARIFS`). **Ne rend rien si `lignesTarifs(tarifs)` est vide.** **Il ne teste PAS `affiche`** (relecture application, I2) : il sert aussi d'aperçu dans « Mon entreprise » (« Ce que verraient les particuliers »), précisément quand les tarifs ne sont pas affichés. **Il ne teste pas non plus qui regarde** : la garde vit chez les appelants — dans la base d'abord (§2.5), puis dans `OpusApp` (§5.5) et dans les deux écrans.
- Rendu : `SectionLabel` (titre), une `CARTE` (angle vif), une rangée par ligne — libellé en `C.muted`, valeur en `C.ink` — et en pied, en `C.muted` : « Tarifs déclarés par l’artisan, toutes taxes comprises. Le prix d’un chantier se fixe sur devis. » — vrai, puisque le bloc ne montre plus les heures d'Opus.
- Tailles : `T`, `S`, `R` de `theme.js` ; aucun nombre en dur.
- **`ProfilProScreen.js`** : `{tarifs && tarifs.affiche === true && <TarifsPublics tarifs={tarifs} titre="Ses tarifs" />}` juste après `<FicheContactPro pro={pro} />` (`ProfilProScreen.js:251`), avant « Ses chantiers ». `tarifs` est une prop nouvelle, remplie par `OpusApp` (§5.5) **pour un particulier seulement**.
- **Le bloc « Ses tarifs » n'apparaît qu'à un PARTICULIER connecté** (réponse du 19/10). À un autre artisan, **aucun bloc** : surtout pas « aucun tarif » ni « prix non communiqués », qui seraient faux — l'artisan a peut-être des tarifs affichés, ils ne sont simplement pas pour lui. `ProfilProScreen` reçoit alors `tarifs={null}` et ne rend rien ; il n'a aucun texte de remplacement à écrire.
- **`ProfilOwnScreen.js`** : la même ligne, titre « Mes tarifs », juste après `<FicheContactPro pro={me} … />` (`ProfilOwnScreen.js:255`), avec `tarifs={mesTarifs}` — **la même source** que le réglage SOS et que « Mon entreprise » (relecture application, I7) — **et `quiLesVoit={QUI_VOIT_LES_TARIFS}`** : sur sa propre page, l'artisan voit ses tarifs ; il doit lire, juste dessous, que ses confrères ne les voient pas. Sans cette phrase, « l'artisan voit sa page comme ses clients » lui ferait croire que tout le monde voit ce bloc.

### 5.5 `OpusApp.js`

- `const [mesTarifs, setMesTarifs] = useState(null);` et `const [tarifsAffiches, setTarifsAffiches] = useState({});` déclarés **avant** leur premier usage, à côté de `mesSos` (`OpusApp.js:309`).
- **`mesTarifs` se lit dans le bloc réservé aux comptes pro** de `start()` (`OpusApp.js:474-500`, à côté de `chargerProfilPro` de soi-même) : `try { setMesTarifs(await api.mesTarifs()); } catch (e) { setMesTarifs({ echec: true }); }`. Un particulier ne la lance pas. Démarrage d'un compte pro : **une requête de plus** ; d'un particulier : aucune (`loadAll` reste à 24, `OpusApp.js:261`).
- **Les tarifs d'un autre artisan se lisent comme ses chantiers** (relecture application, I6) : `chargerTarifsDuPro(proId)` est appelée dans `viewProfile` **avant la sortie anticipée** (`OpusApp.js:1316`, à côté de `chargerChantiersDuPro`), **à chaque ouverture** de la fiche. Succès : `tarifsAffiches[proId]` = la ligne ou `null`. Échec : la clé est **retirée** — aucun bloc, et jamais un ancien tarif. Sans cela, `portfolioCharge` (`:1318-1322`) empêchait toute relecture : un artisan qui éteint ses tarifs serait resté affiché, pour la session, sur l'écran de qui avait déjà ouvert sa fiche, pendant que la carte SOS, relue à chaque recherche, disait le contraire.
- **Et seulement pour un particulier** (réponse du 19/10) : l'appel est gardé par `if (userType === 'particulier')`. La base ne rend rien à un compte pro (§2.5) : une requête dont la réponse est connue d'avance ne part pas, et la démonstration — où le compte de démonstration peut être pro (fiche 1) — ne montre pas à un artisan ce que la vraie base lui refuserait.
- `<ProfilProScreen … tarifs={userType === 'particulier' ? tarifsAffiches[viewedProId] : null} />` : un particulier qui **devient pro dans la session** (`devenirPro` redémarre par `start('pro')`, sans remonter `OpusApp`, `OpusApp.js:2244-2246`) ne garde pas à l'écran les tarifs qu'il a lus en particulier. `<ProfilOwnScreen … tarifs={mesTarifs} />`.
- `<MonEntreprise … etatSos={…} onTarifs={setMesTarifs} />` (`OpusApp.js:4115-4135`). `etatSos` = `etatReglageSos({ sos: mesSos, sosMetier: metierSosDeLaFiche(fiche.metiers), interrupteur: <ligne active du métier en base>, enregistre: true, tarifs: mesTarifs, aDesCoordonnees })`, ou `null` si ni métier d'urgence ni ligne orpheline. Si `mesSos.echec`, la phrase le dit — rien n'est affirmé (relecture application, I8-c).
- `<ProfilEditScreen … sos={mesSos} tarifs={mesTarifs} aDesCoordonnees={…} onOuvrirEntreprise={(section) => ouvrirMonEntreprise(section)} />` (`OpusApp.js:3825-3844`).
- `chercherArtisansUrgence` (`OpusApp.js:2932-2941`) : en démonstration, `artisansDisponiblesDemo(metierKey, { sos: SOS_ARTISANS, tarifs: TARIFS_DEMO, pros })` ; l'import de `OpusApp.js:60` change.
- `envoyerSos` (`OpusApp.js:2966-2970`) : « Estimation {min}–{max} € TTC. » (relecture application, m15) ; la phrase « Vous serez prévenu dès qu'il répond » reste, `verifier-demandes.mjs:104-106` l'exige.
- `enregistrerProfil` (`OpusApp.js:2499-2515`) : `if (sos) setMesSos(sos)` devient `setMesSos` de la forme `{ lignes }` recalculée — la ligne enregistrée, les autres éteintes.

### 5.6 `DemandesRecuesScreen.js`

`Estimation {d.prixMin}–{d.prixMax} € TTC` (`DemandesRecuesScreen.js:391-393`) : la même fourchette, la même unité.

### 5.7 Le mode démonstration

- **SOS** : plomberie → **un** artisan (la fiche 8 n'affiche pas) ; serrurerie → « Déplacement offert » ; chauffage → « sans majoration la nuit ni le week-end » et jamais « majoration incluse » ; électricité → « Devis : 30 € TTC » et « hors prix du devis » ; « Demain » → « +40 % si l’intervention a lieu la nuit ou le week-end ».
- **Fiches, vues en particulier** (« JE SUIS UN PARTICULIER » à l'accueil, `OnboardingScreen.js:49-51`) : 2, 4, 6, 7 portent « Ses tarifs » ; 8 non ; aucune ne montre « de 20 h à 7 h ». **Vues en professionnel** : **aucune** ne porte de bloc, et rien ne le remplace (réponse du 19/10).
- **« Mon profil » en professionnel** (fiche 1) : « Mes tarifs » n'apparaît qu'une fois des tarifs affichés, avec la phrase « Visibles des particuliers connectés seulement… ».
- **« Mon entreprise »** (fiche 1) : « Vos tarifs » vide ; afficher sans aucun tarif est refusé avec la phrase de `tarif_affiche_check` ; afficher avec le seul prix du devis passe.
- **« Modifier mon profil »** (fiche 1) : l'état « orpheline » (Électricité) dès l'ouverture ; ajouter « électricien » aux métiers fait passer à « non affichés ».

### 5.8 Le mode démonstration ne doit pas mentir sur la base

La bande de démonstration reste visible. Les phrases d'enregistrement de « Mon entreprise » disent déjà « rien n’est écrit en base » (`MonEntreprise.js:318`).

### 5.9 Les textes opposables (`src/data/legal.js`)

**`VERSION`** (`legal.js:32`) : la date de livraison (≥ `'2026-10-19'`), avec un commentaire au-dessus de celui du 18/10 : des tarifs peuvent devenir lisibles par les particuliers qui ont un compte, au choix de l'artisan, et par eux seuls ; répondre aux urgences demande de les afficher ; la base date ce geste ; la limite du second compte particulier est dite ; l'engagement de l'éditeur de ne pas consulter porte sur les tarifs non affichés ; la majoration est dite pour ce qu'elle sert ; la collecte s'allonge (taux, décompte, majoration, prix du devis ; disponibilité aux urgences). Et la limite de ce changement : **aucun écran ne fait ré-accepter un compte existant** (§0.2-4) — 11 comptes n'ont aucune version, aucun n'a accepté celle du 18/10.

**L'avis d'un avocat** sur des tarifs affichés dans un petit marché (`DONNEES-DES-ARTISANS.md` §5.3-5.4) est un **simple rappel** (réponse du 19/10), déjà inscrit dans `docs/A-FAIRE.md:1759-1762` parmi les questions au juriste. **Rien dans `legal.js`** — aucun champ d'`EDITEUR` à ce sujet —, et **aucun contrôle de `verifier-legal`** ne fait de cet avis une condition de la sortie de `'essai'`.

**CGU, « Vos tarifs et vos prix »** (`legal.js:545-556`), nouveau texte (relecture droit, I9 ; relecture base, 1 ; réponses du 19/10) :

> Les tarifs que vous enregistrez dans « Mon entreprise » ne sont utilisés que par vous tant que vous ne choisissez pas de les afficher : vos frais de déplacement, votre taux horaire et son décompte, et le prix de vos devis serviront à préparer vos devis ; votre majoration de nuit et de week-end ne sert qu’à l’estimation des urgences, donc seulement si vous les affichez. Si vous touchez « Afficher mes tarifs sur ma fiche », ils deviennent lisibles par les particuliers qui ont un compte Opus : ils s’affichent sur votre fiche et, si vous répondez aux urgences, servent à l’estimation que le bouton SOS montre aux particuliers. Ils ne s’affichent pas aux autres artisans, ni dans l’espace d’administration : l’éditeur d’Opus ne les voit pas non plus dans l’application, son compte étant professionnel. C’est une barrière, pas un verrou : Opus ne vérifie pas l’identité des particuliers, et quelqu’un qui ouvre un compte particulier avec une autre adresse e-mail, un artisan compris, peut les lire. Répondre aux urgences demande de les afficher. Opus enregistre la date à laquelle vous les affichez. Vous pouvez cesser de les afficher à tout moment. Les tarifs que vous n’affichez pas, et les autres prix que vous enregistrez pour vos devis, ne sont montrés à personne d’autre que vous par aucun écran d’Opus : ni à un autre artisan, ni à un particulier, ni à un visiteur, ni dans l’espace d’administration. Vos devis portent ceux qui leur servent, pour le client à qui vous les adressez. La base de données le garantit pour les autres utilisateurs. L’éditeur d’Opus, qui administre cette base, pourrait techniquement les lire avec les outils d’administration de l’hébergeur : il s’engage à ne pas consulter ceux que vous n’affichez pas. C’est un engagement, pas une impossibilité technique, et aucun journal n’enregistre une telle lecture. Pour faire fonctionner le service, il peut compter les lignes ou vérifier la structure de la base sans lire vos prix. Seule une obligation légale pourrait l’amener à les communiquer.

Ce qui a changé, dit dans le commentaire au-dessus (`legal.js:520-544`) :
- « ne sont montrés à personne d’autre que vous » ne vise plus que **ce qui n'est pas affiché** — et la liste nomme désormais « ni à un particulier », puisque les tarifs affichés, eux, vont aux particuliers ;
- **les lecteurs des tarifs affichés sont les particuliers qui ont un compte, et eux seuls** (réponse du 19/10) : ni les autres artisans, ni l'espace d'administration, ni l'éditeur dans l'application. L'engagement du 18/10, « aucun écran ne montre les prix d'un artisan à un autre », reste vrai **tel quel** ;
- **la limite est dite, dans le texte opposable lui-même** : Opus ne vérifie pas l'identité des particuliers, et un second compte particulier lit ce qu'un particulier lit. Une barrière, pas un verrou — l'écrire autrement serait faux, et un texte opposable qui ment engage son auteur ;
- l'engagement de l'éditeur de ne pas consulter porte sur **ceux que vous n’affichez pas**, **inchangé** (réponse du 19/10) : il protège ce que personne d'autre ne lit ; les tarifs affichés, tout particulier qui a un compte les lit déjà ;
- « personnes sans compte » **n'y est pas** : aucun visiteur ne lit une ligne de tarifs (§2.5) ;
- la majoration n'est plus rangée parmi ce qui « sert aux devis » : aucun devis ne la porte (`PLAN-DEVIS.md:1087-1094`) ;
- la phrase « Répondre aux urgences demande de les afficher » **suit la réponse du 19/10 à la question 1** (« Oui, c'est obligatoire ») ;
- rien d'autre n'est promis.

**Politique de confidentialité, « Ce que nous collectons »** (`legal.js:674-681`), la fin du paragraphe devient :

> Si vous êtes professionnel, pour vos devis : votre immatriculation, votre capital, vos assurances et leurs attestations, votre médiateur, vos garanties, vos conditions de paiement, d’exécution et de réclamation, et vos tarifs (frais de déplacement, taux horaire et son décompte, majoration de nuit et de week-end, prix du devis). Aucun écran d’Opus ne les montre à quelqu’un d’autre que vous, sauf vos tarifs si vous choisissez de les afficher : ils deviennent alors lisibles par les particuliers qui ont un compte Opus, et par eux seuls — ni par les autres artisans, ni dans l’espace d’administration —, et la date à laquelle vous les affichez est enregistrée. Opus ne vérifie pas l’identité des particuliers : quelqu’un qui ouvre un compte particulier, un artisan compris, peut les lire. Les attestations jointes, comme vos autres documents professionnels, sont aussi lisibles par l’administration d’Opus. Si vous répondez aux urgences : votre métier d’urgence, votre rayon d’intervention et votre délai d’arrivée habituel, lisibles par tous ; ce délai s’affiche avec vos tarifs aux personnes qui cherchent une urgence près de chez elles. Pour vos tarifs et vos prix, l’éditeur prend en plus un engagement écrit dans les conditions d’utilisation (« Vos tarifs et vos prix »).

La dernière phrase est gardée **mot pour mot** (`verifier-legal.mjs:489-491`). La disponibilité aux urgences était lisible de tous depuis le premier jour et **n'était dite nulle part** : ce lot le répare.

---
## 6. Les contrôles

Tous **retirent les commentaires d'abord**, visent des **propriétés**, et s'éprouvent **en cassant ce qu'ils surveillent** (§6.4). Ce qui ne se voit que dans un catalogue PostgreSQL se vérifie dans l'essai SQL (§7), pas par une expression régulière sur le texte.

### 6.1 Nouveau : `npm run verifier-tarifs` (`scripts/verifier-tarifs.mjs`)

Il entre dans `package.json` ; `npm run verifier` le découvre seul. Il importe `src/lib/tarifs.js`, `src/lib/emetteur.js`, `src/data/urgences.js`, `src/data/tarifs-demo.js` : **s'il plante, c'est un échec**.

**A. Ce qu'il FAIT TOURNER**
1. `estimationSos` sur **chaque problème de `PROBLEMES`**, avec `'oui'`, `'non'` et `'selon_heure'`, et : un tarif complet ; un déplacement offert ; une majoration à 0 ; le taux minimal (100 centimes) et un déplacement offert → **`min >= 1` partout** ; un tarif sans taux, sans majoration, sans déplacement, non affiché → `null` ; `probleme` absent → `null`. Le cas de `urgences.js:72` (4500 / 6200 / 40, `h: [1, 2]`) rend **107 – 169** avec `'non'` et `'selon_heure'`, **150 – 237** avec `'oui'` — les nombres de la version actuelle : **le calcul n'a pas changé, seule son unité a changé**. **Majoration à 0 avec `'oui'` → `majore` FAUX** (relecture application, I3).
2. `majorationSos` : `'immediat'`, un mardi à 19 h 40, délai 25 → `'oui'` (arrivée 20 h 05) ; délai 15 → `'non'` (19 h 55) ; un mardi à 6 h 40, délai 25 → `'non'` (7 h 05) ; `'journee'` et `'demain'` → `'selon_heure'` quelle que soit l'heure (relecture droit, m18).
3. `detailSos` sur les mêmes cas : aucune sortie ne contient `null`, `undefined`, `NaN`, `+0 %` ; « Déplacement offert » pour 0 ; « déplacement compris » seulement avec `'oui'` et `pct > 0` ; « si l’intervention a lieu la nuit ou le week-end » seulement avec `'selon_heure'` et `pct > 0` ; rien avec `'non'`.
4. `noteSos` et `conditionsSos` : « majoration de nuit incluse » seulement si `majore` ; « hors prix du devis » seulement si `prix_devis_centimes > 0` ; `conditionsSos` rend `[]` pour un tarif sans texte ni devis, et ne contient jamais `null`.
5. `depuisLaRecherche` : `{ deplacement: 45, horaire: 62, majoration: 40 }` → `4500 / 6200 / 40` ; `'35.10'` → `3510` (et non `3509`) ; `0 / 0 / 0` → **`null`** ; une clé absente → `null`.
6. `lignesTarifs` : les cinq lignes pour un tarif complet ; **une seule ligne « Déplacement offert »** sans libellé pour 0 ; conditions seules ; rien pour un tarif vide ; **aucune ligne ne contient « 20 h », « week-end » dans sa VALEUR, ni « déplacement compris »** (relecture droit, I6) ; chaque montant finit par « TTC » ou « TTC de l’heure ».
7. `pretPourLeSos` : les seize combinaisons des quatre conditions ; `manque` dans l'ordre.
8. **`reglageInitialSos`** (relecture application, B1) : une ligne active du métier de la fiche, rayon 35 → `actif: true`, `rayon: '35'` ; `{ echec: true }` → `lisible: false`, `actif: false` ; `null` → idem ; une ligne active d'un AUTRE métier → `actif: false` et `autresActives` la nomme.
9. **`etatReglageSos`** (relecture application, I9) : chaque état du tableau de §5.2, **et les priorités** : `sos.echec` ET `tarifs.echec` → `sos.echec` ; `tarifs.echec` ET non affichés → `tarifs.echec` (jamais « non affichés ») ; orpheline ET pas de coordonnées → orpheline ; prêt non enregistré → la phrase au futur ; prêt enregistré → au présent.
10. `reglageSosDepuisSaisie` : interrupteur allumé, `'0'` refusé pour les deux (et **pas** changé en 20 ou 45) ; `''` refusé ; `'20'` / `'45'` acceptés ; `'2,5'` refusé ; **interrupteur éteint, rayon vide → accepté**, avec les valeurs de la ligne (relecture application, m16).
11. `tarifsDepuisFormulaire` : les trois interrupteurs écrivent 0 ; « 0 » tapé dans le taux, la majoration, le devis est refusé avec SA phrase ; `'62,50'` → `6250` ; `'40 %'` → `40` ; l'interrupteur des frais l'emporte sur un montant tapé.
12. `validerTarifs` : `affiche: true` et rien d'autre → `tarif_affiche_check` ; `affiche: true` avec le **seul prix du devis** → **passe** (relecture droit, I5) ; `affiche: true` avec la seule majoration → refusé ; taux `99` → `tarif_taux_horaire_check` ; majoration `201` → `tarif_majoration_check` ; un décompte de 201 caractères → `tarif_decompte_texte_check`, **et pas** `tarif_frais_texte_check` (relecture application, I13).
13. `estNuitOuWeekend` contre `HEURES_MAJOREES` : 19 h 59 un mardi → faux ; 20 h → vrai ; 6 h 59 → vrai ; 7 h → faux ; samedi midi → vrai.
14. **La démonstration** : `artisansDisponiblesDemo('plomberie', …)` rend **un** artisan (fiche 4) ; `'serrurerie'` rend un déplacement 0 ; une fiche dont le métier ne correspond pas est écartée ; aucune clé de `TARIFS_DEMO` n'est un nombre ; `mesSos` de démonstration contient la ligne orpheline `electricite` et `etatReglageSos` la classe « orpheline ».

**B. La liste fermée des colonnes de `tarifs_pro`**
15. Les colonnes de la table, relevées dans **toutes** les formes du fichier (le `create table` de la section 46 et les `add column [if not exists]` du bloc de la section 47, tous types confondus) = `COLONNES_ECRITES.tarifs_pro` ∪ `{pro_id, affiche_le}`. **Une colonne de plus sans toucher la liste — ou l'inverse — rougit** : « Toute colonne de `tarifs_pro` devient lisible par tous les particuliers connectés pour l'artisan qui affiche ses tarifs. » `affiche_le` est la seule colonne posée par la base, et le contrôle vérifie qu'elle n'est **pas** dans `COLONNES_ECRITES`.
16. Aucune de ces colonnes ne porte un nom de prix interne : `/(marge|achat|reference|cout_revient|debourse)/` refusé.

**C. SQL ↔ JavaScript**
17. Les quatre paires de `metier_du_sos()` = celles de `METIERS_SOS` = les quatre clés de `sos_availability_metier_key_check`.
18. Le `where` d'`artisans_urgence`, isolé, contient `sa.actif`, `t.affiche is true`, les trois `is not null` et `pp.metiers @> array[public.metier_du_sos(sa.metier_key)]` ; et `pretPourLeSos` teste exactement les mêmes quatre colonnes de tarifs (liste comparée).
19. Les bornes du rattrapage correspondent aux contraintes de 47.3 (converties en centimes).
20. Les bornes des contraintes de `tarifs_pro` = celles des miroirs `CONTRAINTES.tarifs_pro` ; celles de `sos_rayon_check` et `sos_delai_check` = celles de `reglageSosDepuisSaisie`.

**D. Les propriétés du schéma, lues dans le texte**
21. La section 47 est après le dernier objet de la 46 et avant `42. L'EXPORT RGPD` ; aucun `create trigger` après `do $portes$`.
22. `artisans_urgence` : **définie une seule fois, en section 47** ; `language sql stable`, **aucun `security definer`** ; son `returns table (…)`, normalisé, est **exactement** celui du dépôt d'aujourd'hui (`schema.sql:1706-1711`) — la comparaison au résultat mesuré (`integer` au lieu de `int`) est faite par l'essai (§7.1, cas 9) ; un `join public.tarifs_pro`, **pas un `left join`** ; juste après elle, `revoke all … from public, anon` et `grant execute … to authenticated` **seulement**. Même vérification pour `metier_du_sos`.
23. Le `foreach` de la section 11 bis ne nomme plus `artisans_urgence`.
24. Le bloc `do $tarifs_47$` commence par la garde « la colonne existe déjà → `return` », **avant** son `alter table` ; chaque `add column` porte `if not exists` (relecture base, 7) ; il ne contient **aucun** `affiche = true` ni `set affiche` ; son `insert` a un `on conflict … do update` dont chaque colonne passe par `coalesce(t.…` ou par le `case` des frais ; la remise à 0 des colonnes mortes vient **avant** l'extinction.
25. **Aucun agrégat sur les tarifs de plusieurs artisans** : aucune fonction qui nomme `tarifs_pro` ne contient, en **mot entier**, `\m(avg|sum|min|max|stddev|median)\s*\(` ni `percentile_` ni `group by` (relecture base, 10 : `min(` en sous-chaîne aurait accusé `est_admin(`).
26. `mes_donnees()` contient `'ma_disponibilite_urgences'` avec `x.professional_id = auth.uid()` **et** `'urgences'` avec `x.client_id = auth.uid() or x.professional_id = auth.uid()` (relecture droit, I10).
27. `sos_availability` : `revoke insert, update, delete, truncate … from anon` et `revoke truncate … from authenticated` ; `sos_rayon_check` et `sos_delai_check` posées ; `refuse_les_colonnes_mortes_du_sos` lit la ligne par `to_jsonb(new)` et **ne contient pas** `new.deplacement`, `new.horaire` ni `new.majoration` (le corps tolérant, relecture base, 2) ; elle lève `OP012` ; son déclencheur est `before insert or update on public.sos_availability` ; les `comment on column … sos_availability` sont **à l'intérieur** d'un bloc `do` qui teste l'existence de la colonne.
28. `tient_les_tarifs_publics` pose `affiche_le` par `clock_timestamp()` dans la branche « vient d'être allumé », la garde dans la branche « reste allumé », la vide dans la branche « éteint » — les trois branches, chacune isolée (la faute du lot I : une vérification « quelque part dans la fonction » laisse passer une branche cassée).
29. **Aucun `grant` à `anon` sur `tarifs_pro`**, et aucune politique `to anon` ni `to public` sur elle.
29 bis. **Les tarifs affichés ne vont qu'aux particuliers** (réponse du 19/10) — une propriété, relevée sur **toutes** les politiques de `tarifs_pro` du fichier, commentaires retirés : (a) `"mes tarifs"` est la seule qui nomme `est_mon_entreprise`, et la seule qui n'est pas `for select` ; (b) **toute autre** politique est `for select to authenticated`, et son `using`, normalisé (espaces, parenthèses extérieures), est **exactement** la conjonction des trois termes `affiche is true`, `not public.est_un_pro()`, `not public.est_masque(pro_id)` — dans n'importe quel ordre, **aucun `or`**, aucun autre terme ; (c) il en existe **une et une seule**. Une seconde politique `using (affiche is true)` à côté de la bonne ouvrirait les lignes affichées aux artisans, puisque les politiques `select` s'additionnent en OU : elle est refusée par (c) et par (b). Et le message dit pourquoi : « Les tarifs affichés ne sont lus que par les particuliers (décision du 19/10) : une politique qui ne dit pas `not est_un_pro()` les ouvre aux autres artisans. » Le droit d'`est_un_pro` et d'`est_masque` pour `authenticated` est déjà tenu par `verifier-portes` (fonctions appelées dans une politique) ; l'essai le relève dans le catalogue (§7.1, cas 9).

**E. Les propriétés de l'application**
30. `api.js` : aucun `Number(a.deplacement)` ; `chercherArtisansUrgence` passe par `depuisLaRecherche`, **compte** les lignes illisibles et **lève** quand aucune n'est lisible ; sa seconde lecture porte `.eq('affiche', true)` ; `updateSosAvailability` n'envoie ni `deplacement`, ni `horaire`, ni `majoration`, ni `updated_at`, et contient l'extinction des autres lignes ; la lecture SOS de `loadAll` n'a pas de `maybeSingle()` ; **aucun `from('sos_availability').select(` ne nomme `deplacement`, `horaire`, `majoration` ni `'*'`** (relecture application, m19) ; `mesTarifs` n'est pas appelée dans `loadAll`.
31. `SosScreen.js` n'importe plus `estimation` ni `estNuitOuWeekend` ; il appelle `estimationSos`, `detailSos`, `conditionsSos`, `noteSos`, `majorationSos` ; son `setErreur` passe par `messageClair` ; l'état vide porte sur la liste VISIBLE ; aucun gabarit `{a.deplacement}`.
32. `ProfilEditScreen.js` : plus d'état `deplacement`, `horaire`, `majoration` ; **plus de `sos.actif`, `sos.rayonKm`, `sos.delaiMinutes`** — l'état de départ vient de `reglageInitialSos` ; aucun `Number(…) || 20` ni `|| 45` ; la ligne d'état vient d'`etatReglageSos` ; les rangées ont `minHeight: TOUCHE` ; l'avertissement contient « un devis écrit reste dû dès le premier euro » (relecture droit, I11).
33. `MonEntreprise.js` appelle `etatReglageSos` **ou** reçoit sa sortie — jamais une phrase d'état écrite à la main ; son bloc « Vos tarifs » est gardé par `donnees.etat === 'pret'` ; `onTarifs` est appelée après la lecture ET après l'enregistrement.
34. `TarifsPublics.js` ne contient pas `affiche` ; **les deux appelants publics** (`ProfilProScreen.js`, `ProfilOwnScreen.js`) le gardent par `affiche === true`, **juste après `FicheContactPro`** ; `ProfilOwnScreen.js` lui passe `quiLesVoit={QUI_VOIT_LES_TARIFS}`, importée de `tarifs.js` ; **aucun fichier de `src/` hors de `tarifs.js` n'écrit la phrase** « Visibles des particuliers connectés » à la main ; et **aucun écran n'affiche un texte de remplacement** quand `tarifs` est vide (« aucun tarif », « prix non communiqués », « tarifs non renseignés » refusés dans `ProfilProScreen.js` et `TarifsPublics.js`).
35. `OpusApp.js` : `chargerTarifsDuPro` est appelée dans `viewProfile` **avant** `if (connu && connu.portfolioCharge) return;` **et sous la garde `userType === 'particulier'`** ; `ProfilProScreen` reçoit `tarifs` sous la même garde (sinon `null`) ; `ProfilOwnScreen` reçoit `mesTarifs` ; `api.mesTarifs` n'est appelée que dans la branche `type === 'pro'`.
36. `FicheEmetteur.js` : les quatre `Interrupteur` ; la section `affiche`, dont l'aide « allumé » lit `QUI_VOIT_LES_TARIFS` et **ne contient ni « toute personne qui a un compte », ni « y compris » suivi, dans la même phrase, de « artisan »** ; `tarifsDepuisFormulaire` dans `lirePourEnregistrer` ; `lireTextes` lit `taux_montant`, `decompte`, `majoration_pct`, `devis_montant` ; `SECTION_DU_CHAMP` connaît les cinq colonnes ; aucun pavé numérique avec `returnKeyType` ; la phrase de l'arrêté contient « On ne sait pas encore si votre fiche Opus en est un. » et **ne contient ni « prudent » ni « pages en ligne »** (relecture droit, I8) ; aucune des trois phrases retirées.
37. Aucun écran n'écrit `taux_horaire_centimes: 0`, `majoration_pct: 0` ou `prix_devis_centimes: 0` hors de `tarifsDepuisFormulaire`.
38. « TTC » suit la fourchette dans `OpusApp.js` (bandeau d'envoi) et dans `DemandesRecuesScreen.js`.

### 6.2 `scripts/verifier-emetteur.mjs` — ce qui change, et pourquoi

Chaque changement porte un commentaire qui dit **pourquoi la règle a changé**.

| ligne | aujourd'hui | devient |
|---|---|---|
| 94 | `duLot.length === 20` | « chaque contrainte `_check` des trois tables, **relevée dans le schéma**, a sa phrase » ; garde contre la cécité : `>= 25` |
| 519 | `noms.length === 20` | égalité d'ensembles miroir ↔ phrases, `>= 25` |
| 605-607 | `etatInitialFormulaire(null)` : les QUATRE choix de `CHOIX_DU_FORMULAIRE`, tous `null` | les **six** choix, tous `null` ; et `affiche` n'est **pas** une clé de `choix` (c'est un interrupteur, comme `enLiquidation`) |
| 675 | « Frais de déplacement : 35,00 € — au-delà de 20 km » | **inchangé** : `enteteImprime` ne change pas (§1.2) |
| 918-920 | `FIN_46` = le plus proche de « 42. » ou « 43. » | `FIN_46` = **le prochain en-tête de section numérotée** (`/^--  \d+\. /m` après `TETE_46`) ; et un `SECTION_47` découpé de la même façon |
| 934 | `contrainte()` ne lit que `SECTION_46` | `contrainte()` lit `SECTION_46 + SECTION_47` : `tarif_decompte_texte_check` vit en 47 |
| 990 | les `add constraint` de `SECTION_46` = miroir, 20 | les `add constraint` **des trois tables** (`alter table public.(emetteur\|emetteur_assurances\|tarifs_pro) add constraint`), relevés dans les sections 46 et 47 = miroir, `>= 25` |
| 998 | le nombre de `check (` de `SECTION_46` = le nombre de noms | le nombre de `check (` compté **dans ces mêmes ordres `add constraint`**, pas dans toute la section : la 47 porte aussi `sos_rayon_check` et `sos_delai_check`, qui ne sont pas des trois tables |
| 1009-1013 | `LONGUEUR_MAX` comparée aux seules longueurs de `tarif_frais_texte_check` | comparée aux longueurs relevées dans **toutes** les contraintes des trois tables, où qu'elles soient : `decompte_temps_texte: 200` vient de `tarif_decompte_texte_check` |
| 1029 | colonnes du seul `create table`, six types | **déplacé dans `verifier-tarifs`** pour `tarifs_pro` (§6.1-B) ; gardé pour `emetteur` et `emetteur_assurances` |
| 1045 | `tarifs_pro` : UNE politique `for all` | `emetteur`, `emetteur_assurances` : inchangé. `tarifs_pro` : **UNE seule politique qui n'est pas `for select`** — `"mes tarifs"`, `for all to authenticated`, `est_mon_entreprise(pro_id)` ×2, aucun `auth.uid()` ; **et toute autre politique est `for select to authenticated`, avec un `using` qui est exactement la conjonction de `affiche is true`, `not public.est_un_pro()` et `not public.est_masque(pro_id)`, sans aucun `or`** — la même propriété que `verifier-tarifs` 6.1-29 bis, écrite des deux côtés parce que les deux contrôles relisent ces politiques ; aucune `to anon`, `to public`, `est_admin(` |
| 1054-1058 | `revoke all … from anon` et **aucun** `grant … to anon` dans tout le schéma | **inchangé** pour les trois tables : `anon` n'a rien (§2.5) |
| 1071-1087 | une liste FERMÉE pour les trois tables | deux listes : `emetteur`, `emetteur_assurances` — `tient_l_emetteur`, `tient_l_assurance`, `emetteur_incomplet`, `mes_donnees` ; `tarifs_pro` — `tient_les_tarifs`, `emetteur_incomplet`, `mes_donnees`, **`artisans_urgence`** ; pour les deux, **aucune `security definer`**, aucune vue |
| 1094-1095 | rien n'est `not null` hors des clés, lu dans le `create table` | étendu aux `add column` de la section 47 |
| 1248-1268 | « aucun fichier du lot ne nomme `sos_availability` » | **retiré**, avec la raison : il protégeait un état transitoire que ce lot ferme. Sa relève est dans `verifier-tarifs` (§6.1-27, -30) |
| 1337 | `set local role anon; select count(*) from public.<t>;` pour les trois tables, ERREUR attendue | **inchangé** |
| 1596-1612 | les trois phrases de « l'écart » et « Opus ne les y affiche pas encore. » | **remplacées** : la phrase de l'arrêté de §5.1 ; les quatre interrupteurs ; aucune des trois anciennes phrases |
| sabotage 44 (cahier 0a) | « un fichier du lot qui nomme `sos_availability` » | retiré, comme la vérification |

### 6.3 `scripts/verifier-legal.mjs` — ce qui change, en propriété

1. **`VERSION`** (`:441-444`) : `>= ` la date de livraison du lot.
2. **L'engagement** (`:445-449`) : la section contient « s’engage à ne pas consulter ceux que vous n’affichez pas » et « outils d’administration ».
3. **`:450-473`** (pas une impossibilité technique ; aucun journal) : **inchangés**.
4. **LE TEXTE SUIT LE SCHÉMA** : *si* `schema.sql` contient une politique `for select` sur `tarifs_pro` qui n'est pas `"mes tarifs"`, *alors* « Vos tarifs et vos prix » contient « Afficher mes tarifs sur ma fiche », « Opus enregistre la date » ET l'engagement restreint aux tarifs non affichés ; **et réciproquement**. *Si* cette politique exige `not public.est_un_pro()`, *alors* la section contient « les particuliers qui ont un compte Opus », « Ils ne s’affichent pas aux autres artisans », « pas un verrou » et « Opus ne vérifie pas l’identité des particuliers » — **la limite du second compte est exigée dans le texte opposable, pas seulement permise** ; **et réciproquement** (un texte qui promet « les particuliers seulement » devant une politique qui ne l'exige pas rougit). La phrase « Répondre aux urgences demande de les afficher » est exigée *si et seulement si* le `where` d'`artisans_urgence` contient `t.affiche is true`.
5. **La section ne contient ni « sans compte » ni « visiteur » comme lecteur des tarifs affichés, ni « toute personne qui a un compte », ni « y compris » suivi, dans la même phrase, de « artisan » ou de « l’éditeur »** (réponse du 19/10 : ni les autres artisans, ni l'éditeur par l'application ; ce sont les deux formes de la version 2, celles qui reviendraient par mégarde — et viser la forme plutôt que la phrase exacte attrape aussi ses variantes), et ne range pas la majoration parmi ce qui sert aux devis (le mot « majoration » doit être suivi, dans la même phrase, de « estimation des urgences »).
6. **`:501-509` (`PERMIS`)** : **retirée**, avec la raison : elle restait verte pendant que `SosScreen.js:261` affichait des tarifs publics sans nommer `tarifs_pro`. Ce qui garde la pièce : la base (les politiques, §6.2), l'API (point 7) et le texte (point 4).
7. **`:511-515`** : tout `from('tarifs_pro')…;` de `api.js` **soit** contient `currentUserId`, **soit** contient `.eq('affiche', true)` et ne contient ni `upsert`, ni `insert`, ni `update`, ni `delete` ; au moins cinq appels (lecture et écriture de « Mon entreprise », `mesTarifs`, `tarifsAffichesDe`, le complément du SOS).
8. **`:546-599`** : `PRIVEES` coupé en deux comme au §6.2 ; `artisans_urgence` admise pour `tarifs_pro` seulement ; aucune `security definer` ; aucune vue.
9. **`:600-606`** (aucune fonction Edge ne nomme ces tables) : inchangé.
10. **`:489-491`** : inchangé ; **nouveau** : la même section contient « Si vous répondez aux urgences », « lisibles par les particuliers qui ont un compte Opus » et « Opus ne vérifie pas l’identité des particuliers » ; elle **ne contient pas** « lisibles par toute personne qui a un compte Opus ».
11. **L'avis d'un avocat : rien.** Décision du 19/10 : c'est un simple rappel de `docs/A-FAIRE.md`. `verifier-legal` **n'ajoute aucune condition** à la sortie de `'essai'` pour les tarifs, et `EDITEUR` ne gagne aucun champ à ce sujet. Les conditions existantes de la sortie de `'essai'` (`contratSousTraitance`, `emailReleve`, `identiteRemiseALHebergeur`…) ne bougent pas.

### 6.4 Les sabotages à faire subir

**En vérifiant à chaque fois que le sabotage a bien été POSÉ** (diff non vide), puis en remettant le code. Chacun doit être refusé **par la bonne vérification**.

1. `left join public.tarifs_pro` dans `artisans_urgence` ;
2. `t.affiche is true` retiré de `artisans_urgence` ;
3. `t.majoration_pct is not null` retiré ;
4. `pp.metiers @> …` retiré ;
5. `artisans_urgence` en `security definer` ;
6. `majoration int` changé en `majoration integer, extra text` dans `returns table` ;
7. `artisans_urgence` remise en section 14 ;
8. `'public.artisans_urgence(…)'` remis dans le `foreach` de 11 bis ;
9. `grant execute on function public.artisans_urgence(…) to anon` remis ;
10. une politique `"tarifs affiches visiteur" … to anon using (affiche is true)` ajoutée ;
11. `grant select on public.tarifs_pro to anon` ajouté ;
12. la politique `"tarifs affiches"` perd `affiche is true` ;
13. une politique `for update to authenticated using (affiche is true)` ajoutée ;
14. une colonne `marge_centimes bigint` ajoutée au bloc 47 sans toucher `COLONNES_ECRITES` ;
15. puis la même ajoutée aussi à `COLONNES_ECRITES` (le motif de 6.1-16 doit la refuser) ;
16. `affiche_le` ajoutée à `COLONNES_ECRITES` ;
17. la branche « reste allumé » de `tient_les_tarifs_publics` qui repose `clock_timestamp()` ;
18. la garde « la colonne existe → `return` » retirée du bloc `$tarifs_47$` ;
19. un `add column` sans `if not exists` ;
20. `affiche = true` posé par le rattrapage ;
21. `taux_horaire_centimes = excluded.taux_horaire_centimes` sans `coalesce` ;
22. la borne du rattrapage `horaire >= 1` changée en `horaire > 0` ;
23. `tarif_taux_horaire_check` à `between 0 and 100000` ;
24. `tarif_affiche_check` retirée ;
25. `tarif_affiche_check` qui exige un taux horaire (la règle de la version 1) — la vérification 6.1-12 doit rougir sur « le seul prix du devis passe » ;
26. `sos_rayon_check` retirée ;
27. une fonction `moyenne_des_taux()` qui fait `avg(taux_horaire_centimes)` sur `tarifs_pro` ;
28. une fonction qui nomme `tarifs_pro` et appelle `public.est_admin()` — **ne doit PAS rougir** sur la vérification d'agrégat (6.1-25) ; elle rougit sur la liste fermée ;
29. `'ma_disponibilite_urgences'` retirée de `mes_donnees()` ;
30. `'urgences'` retirée de `mes_donnees()` ;
31. le `revoke truncate on public.sos_availability from authenticated` retiré ;
32. `refuse_les_colonnes_mortes_du_sos` réécrite avec `if new.deplacement <> 0` (corps non tolérant) ;
33. le déclencheur `trg_refuse_les_colonnes_mortes_du_sos` retiré ;
34. un `comment on column public.sos_availability.deplacement` posé hors du bloc conditionnel ;
35. la remise à 0 des colonnes mortes placée après l'extinction ;
36. `metier_du_sos('chauffage')` → `'plombier'` ;
37. `estimationSos` sans la majoration sur le déplacement — **doit rougir** : le propriétaire a répondu « Comme aujourd'hui » (question 4, 19/10), le calcul ne change pas ;
38. `estimationSos` qui rend `majore: majoration === 'oui'` sans tester `pct > 0` ;
39. `majorationSos` qui juge l'immédiat à l'heure de la recherche (sans le délai) ;
40. `estimationSos` qui rend `{ min: 0, max: 0 }` au lieu de `null` ;
41. `detailSos` qui écrit `+${pct} %` même pour 0 ;
42. `lignesTarifs` qui remet `HEURES_MAJOREES` dans la ligne de majoration ;
43. `depuisLaRecherche` qui fait `Number(x) * 100` ;
44. `chercherArtisansUrgence` qui filtre les lignes illisibles sans les compter ni lever ;
45. la seconde lecture du SOS sans `.eq('affiche', true)` ;
46. `updateSosAvailability` qui renvoie `deplacement` ;
47. `updateSosAvailability` sans l'extinction des autres lignes ;
48. `useState(!!(sos && sos.actif))` remis dans `ProfilEditScreen.js` ;
49. `etatReglageSos` avec `tarifs.echec` évalué APRÈS « non affichés » ;
50. `reglageSosDepuisSaisie` qui valide le rayon interrupteur éteint ;
51. `Number(rayonKm) || 20` remis ;
52. l'avertissement SOS qui redit « vous restez libre de chiffrer sur place après diagnostic » sans la phrase du devis ;
53. `TarifsPublics` qui teste `affiche` (l'aperçu « Ce que verraient les particuliers » redevient vide) ;
54. `ProfilProScreen` qui rend `TarifsPublics` sans garde `affiche === true` ;
55. `TarifsPublics` placé après les réalisations dans `ProfilOwnScreen.js` seulement ;
56. `chargerTarifsDuPro` déplacée après la sortie anticipée de `viewProfile` ;
57. `ProfilOwnScreen` alimenté par une lecture de `chargerProfilPro` au lieu de `mesTarifs` ;
58. `api.mesTarifs` appelée dans `loadAll` ;
59. le bloc « Vos tarifs » de `MonEntreprise` sans la garde `donnees.etat === 'pret'` ;
60. `lireTextes` sans `taux_montant` ;
61. `memeEtat` sans `afficheTarifs` normalisé (allumer puis éteindre → fausse bande) ;
62. `SosScreen` qui affiche `e.message` brut ;
63. un écran qui écrit `majoration_pct: 0` ;
64. `HEURES_MAJOREES` changée en « de 21 h à 7 h » ;
65. la phrase de l'arrêté qui redit « pas le plus prudent face à cette règle » ;
66. « il s’engage à ne pas les consulter » (l'ancienne formule) ;
67. la politique `"tarifs affiches"` supprimée **et** la phrase « Répondre aux urgences demande de les afficher » gardée ;
68. « personnes sans compte » remis dans la clause ;
69. la formule de la version 2 remise dans la clause : les tarifs affichés « lisibles par toute personne qui a un compte Opus », les autres artisans et l'éditeur comptés parmi leurs lecteurs (6.3-4 et 6.3-5) ;
70. `TARIFS_DEMO` indexé par des nombres ;
71. `estimation` remise dans `urgences.js` et importée par `SosScreen.js` ;
72. `urgences.js` qui importe `../lib/tarifs.js` ;
73. un commentaire `-- join public.tarifs_pro` laissé dans une version `left join`.

Et ceux de la réponse du 19/10 (« les particuliers seulement ») :

74. `not public.est_un_pro()` retiré de la politique `"tarifs affiches"` — refusé par 6.1-29 bis, par 6.2 (ligne 1045), et par 6.3-4 (le texte promet « les particuliers » devant une politique qui ne l'exige plus) ;
75. une **seconde** politique `"tarifs affiches pros" on public.tarifs_pro for select to authenticated using (affiche is true)` ajoutée **à côté** de la bonne, laissée intacte — refusée par 6.1-29 bis (c) : les politiques `select` s'additionnent, elle rouvrirait les lignes affichées aux artisans ;
76. `not public.est_masque(pro_id)` retiré de la politique ;
77. `chargerTarifsDuPro(proId)` appelée sans la garde `userType === 'particulier'` (6.1-35) ;
78. `<ProfilProScreen … tarifs={tarifsAffiches[viewedProId]} />` sans la garde — le particulier devenu pro dans la session garderait l'ancien bloc (6.1-35) ;
79. « Mes tarifs » sans `quiLesVoit`, ou la phrase « Visibles des particuliers connectés… » réécrite à la main dans `ProfilOwnScreen.js` (6.1-34) ;
80. `ProfilProScreen` qui affiche « Prix non communiqués » quand `tarifs` est vide (6.1-34) ;
81. « pas un verrou » et « Opus ne vérifie pas l’identité des particuliers » retirés de la clause — la limite du second compte n'est plus dite (6.3-4).

**Les quatre-vingt-un doivent être refusés**, et le vingt-huitième **ne doit pas l'être par la vérification d'agrégat** (une vérification qui accuse du code juste ne vaut pas mieux qu'une qui laisse passer du code faux).

---
## 7. Les essais SQL

### 7.1 `supabase/essais-section-47.sql`

**En-tête :** lancé après `local-prelude.sql` puis `schema.sql` rejoué **deux fois**, avec `psql -v ON_ERROR_STOP=0`. Trois règles, écrites en tête du fichier :

1. **Chaque cas est dans son propre `begin … rollback`, et construit son propre état** (`execute tarifs_a; execute sos_a;` puis, s'il le faut, `update … set affiche = true` en superutilisateur). **Aucun cas ne dépend d'un autre** : c'est le modèle de `essais-section-46.sql` (`:711-736`), et c'est ce qui garantit qu'un cas « sur une ligne affichée » l'est vraiment (relecture base, 4-b).
2. **Chaque « 0 » est précédé, dans la même transaction, du « 1 » qui le rend crédible** : la donnée existe, puis le particulier la voit, puis on bloque, on exclut ou on écrit, et on lit 0 (CLAUDE.md, section 29 ; relecture base, 4-a).
3. **Chaque ordre qui doit échouer est le DERNIER de sa transaction.** Aucun cas RLS dans un bloc `do`. `set local role` et `set local request.jwt.claim.sub`, chacun dans son propre ordre. **Toute lecture publique s'éprouve avec un PARTICULIER**, jamais avec l'artisan ; **et toute non-lecture par un concurrent s'éprouve avec B, un AUTRE artisan, après que P a lu 1 dans la même transaction** (réponse du 19/10).

**Préparation**, sur le modèle de `essais-section-46.sql` (lignes 1-110) :
- `\set` A, B, P en `'''a4700000-0000-4000-8000-0000000000xx'''`, **sans commentaire à droite** (`\set` avale la ligne) ;
- ménage de tête `delete from auth.users where id::text like 'a4700000-%';` (en local, sous `psql`) ;
- preuves `source 'registre'`, SIRET **fictifs à clé juste, vérifiés inconnus du répertoire Sirene**, propres à ce fichier ;
- A : pro, `metiers {plombier}`, latitude/longitude posées ; B : pro concurrent, `metiers {electricien}` — **l'artisan qui ne doit RIEN lire** des tarifs de A ; P : particulier, à 5 km de A — **celui qui lit** ;
- `prepare tarifs_a` : `insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, taux_horaire_centimes, majoration_pct, affiche) values (:A, 4500, 6200, 40, false)` ; `prepare affiche_a` : `update public.tarifs_pro set affiche = true where pro_id = :A` ; `prepare sos_a` : ligne `plomberie`, active, rayon 20, délai 45.

| cas | ce qu'il fait, dans sa transaction | attendu |
|---|---|---|
| **0** | **la donnée existe, et elle est affichée** : `execute tarifs_a; execute affiche_a; execute sos_a;` puis compte, en superutilisateur, les lignes de A, celles dont `affiche is true`, et la ligne SOS | `tarifs_attendu_1`, `affichee_attendu_1`, `sos_attendu_1` — sans ce cas, le « 0 » de B aux cas 5, 5 bis et 8 ter serait le bon résultat pour la mauvaise raison |
| 1 | `information_schema.columns` | les six colonnes, `is_nullable = 'YES'`, `affiche` par défaut `false` |
| 2 | superutilisateur, une transaction par refus : taux `0` ; taux `99` ; majoration `201` ; devis `-1` ; décompte de 201 caractères ; `affiche true` sans aucun tarif ; `affiche true` avec la seule majoration | `tarif_taux_horaire_check` ×2, `tarif_majoration_check`, `tarif_devis_check`, `tarif_decompte_texte_check`, `tarif_affiche_check` ×2 |
| 2 bis | `affiche true` avec des **conditions seules** ; avec le **seul prix du devis à 0** ; avec un taux seul | `INSERT 0 1` ×3 (relecture droit, I5) |
| 2 ter | `sos_availability` : rayon `0` ; rayon `201` ; délai `4` ; délai `601` (une transaction chacun) | `sos_rayon_check` ×2, `sos_delai_check` ×2 (relecture base, 3) |
| 3 | décompte `E'  \n '` ; décompte `'  au quart d’heure  '` ; `affiche` envoyé `null` | `null` ; rogné ; `false` |
| 3 bis | **la date du geste** (relecture base, 5) : avec le jeton de A, `insert into public.tarifs_pro (pro_id, taux_horaire_centimes, affiche, affiche_le) values (:A, 6200, true, '2001-01-01')` puis relit ; `update … set taux_horaire_centimes = 6300` puis relit ; `update … set affiche = false` puis relit ; `update … set affiche = true` | `affiche_le` d'aujourd'hui (pas 2001) ; **la même** après la mise à jour du taux ; `null` ; une date neuve |
| 4 | **ligne non affichée** : `execute tarifs_a` ; A lit `1` (la donnée existe) ; P lit ; B lit | `a_attendu_1`, `p_attendu_0`, `b_attendu_0` |
| 4 bis | `anon` lit `tarifs_pro` (dernier ordre) | `permission denied for table tarifs_pro` — **inchangé** |
| 5 | **ligne affichée, qui la lit** (réponse du 19/10) : `execute tarifs_a; execute affiche_a;` ; **P lit** (le « 1 » qui rend crédible) ; **B lit** ; A lit | `p_attendu_1`, **`b_attendu_0`**, `a_attendu_1` (le titulaire, par `"mes tarifs"`) |
| 5 bis | **l'administration ne lit pas** : même état ; superutilisateur inscrit B dans `public.administrateurs` ; P lit ; avec le jeton de B, `select public.est_admin()` puis B relit | `p_attendu_1`, `b_est_admin_attendu_t`, **`b_admin_attendu_0`** |
| 5 ter | **un particulier « en attente » lit** (porte de secours SIRET) : même état ; superutilisateur pose pour P une ligne `demandes_pro` (`siret` fictif, `motif 'introuvable'`, statut `nouvelle`) ; P relit | `p_en_attente_attendu_1` — une demande en attente ne fait pas un compte pro |
| 6 | `execute tarifs_a; execute affiche_a;` ; **P lit 1** ; puis, **avec le jeton de P** — celui qui LIT la ligne, donc celui qu'il faut éprouver : `update … set taux_horaire_centimes = 100 where pro_id = :A` ; `delete … where pro_id = :A` ; superutilisateur relit ; puis P `insert … (pro_id) values (:A) on conflict (pro_id) do update set taux_horaire_centimes = 100` (dernier) | `p_attendu_1`, `UPDATE 0`, `DELETE 0`, `taux_intact_attendu_6200`, ERROR RLS `"tarifs_pro"` — **mesuré le 19/10** sur l'essai jetable : ces cinq résultats exactement |
| 7 | `execute tarifs_a; execute affiche_a; execute sos_a;` ; **P lit 1 ligne de tarifs et `artisans_urgence('plomberie', <près de A>)` rend 1** ; superutilisateur pose un blocage P → A ; P relit les deux | `p_avant_attendu_1`, `p_sos_avant_attendu_1`, puis `p_bloque_attendu_0`, `p_sos_bloque_attendu_0` |
| 7 bis | même chose, blocage **A → P** (l'autre sens) | `1`, `1`, puis `0`, `0` |
| 8 | `execute tarifs_a; execute affiche_a; execute sos_a;` ; **P** appelle `artisans_urgence` | `1` ligne ; `deplacement = 45.00`, `horaire = 62.00`, `majoration = 40`, `delai_minutes = 45` ; `pg_typeof(deplacement) = numeric` |
| 8 bis | `set local role anon` ; `artisans_urgence(…)` (dernier) | `permission denied for function artisans_urgence` |
| 8 ter | **la recherche appelée par un artisan** (réponse du 19/10) : `execute tarifs_a; execute affiche_a; execute sos_a;` ; avec le jeton de P, `artisans_urgence('plomberie', <près de A>)` ; avec celui de B, la même ; avec celui de A, la même | `p_sos_attendu_1`, **`b_sos_attendu_0`**, `a_sos_lui_meme_attendu_1` — un artisan n'y trouve aucun autre artisan ; le titulaire s'y trouve lui-même, par `"mes tarifs"`, et c'est son propre prix. **Mesuré le 19/10** avec une copie réduite de la fonction : `1`, `0`, `1` |
| 9 | le catalogue : `pg_get_function_result('public.artisans_urgence(text, double precision, double precision)'::regprocedure)` ; `prosecdef` ; `proargnames` ; `has_function_privilege` pour `anon` et `authenticated`, sur `artisans_urgence` et `metier_du_sos` ; `proacl::text !~ '(^\{\|,)=X'` ; **`has_function_privilege('authenticated', …, 'execute')` sur `public.est_un_pro()` et `public.est_masque(uuid)`** — les deux fonctions de la politique | la chaîne **exacte** mesurée le 19/10 ; `f` ; les noms inchangés ; `f`, `t`, `f`, `t` ; `t` ; **`t`, `t`** (mesuré le 19/10 sur le schéma du dépôt) |
| 10 | **les exclusions**, une transaction chacune, et dans chacune **P voit d'abord 1**, puis on change UNE chose et P relit : `affiche false` ; frais en conditions seules ; majoration `null` ; `metiers` de A changés en `{macon}` ; SOS `actif false` ; appel depuis un point à 30 km de A. Et une de plus : `affiche false`, **appel par A lui-même** | `1` puis `0` à chaque fois — **y compris pour A** (le piège du titulaire) |
| 10 bis | déplacement offert (`0`) | `1` ligne, `deplacement = 0.00` |
| 11 | `metier_du_sos` sur les quatre clés et sur `'menuiserie'` | les quatre métiers ; `null` |
| 12 | `execute tarifs_a; execute sos_a;` ; une `sos_requests` de P vers A ; `mes_donnees()` avec le jeton de A, puis de P, puis de B | A : `mes_tarifs` contient les six clés nouvelles, `ma_disponibilite_urgences` de longueur 1, `urgences` de longueur 1 ; P : `urgences` de longueur 1 ; B : `mes_tarifs` nul, deux tableaux vides (relecture droit, I10) |
| 13 | les droits : `has_table_privilege` sur `tarifs_pro` pour `anon` (`select`, `insert`, `update`, `delete`, `truncate`) ; `authenticated` `truncate` ; sur `sos_availability` : `anon` `select`/`insert`/`update`/`delete`/`truncate`, `authenticated` `truncate` | `f f f f f` ; `f` ; `t f f f f` ; `f` |
| 14 | **le relevé du catalogue** : fonctions de `public` dont `prosrc ~ '\mtarifs_pro\M'` ; celles dont `prosrc ~ '\m(emetteur_assurances\|emetteur)\M'` ; `security definer` parmi elles ; vues | `artisans_urgence, emetteur_incomplet, mes_donnees` ; `emetteur_incomplet, mes_donnees` ; `0` ; `0` |
| 15 | `pg_policies` sur `tarifs_pro` : nom, commande, rôles, `qual` | deux : `mes tarifs` (`ALL`, `{authenticated}`) ; `tarifs affiches` (`SELECT`, `{authenticated}`, `((affiche IS TRUE) AND (NOT est_un_pro()) AND (NOT est_masque(pro_id)))`) — **la chaîne relevée le 19/10** sur PostgreSQL 16 |
| 16 | `execute tarifs_a; execute sos_a;` ; superutilisateur `delete from auth.users where id = :A` | `tarifs_pro` et `sos_availability` de A : `0`, `0` (la cascade) |
| 17 | contraintes de `tarifs_pro` et de `sos_availability` : non suffixées `_check`, en `_check[0-9]+` | `0`, `0` ; et le nombre total sur `tarifs_pro` : `8` |
| 18 | **aucun agrégat** : aucune fonction de `public` dont `prosrc` contient `tarifs_pro` et `\m(avg\|sum\|min\|max\|stddev\|median)\s*\(` ou `percentile_` | `0` |
| 19 | **les colonnes mortes** (relecture base, 11 ; relecture droit, m14), avec le jeton de A, une transaction chacun : `execute sos_a` puis `update … set deplacement = 45, horaire = 62, majoration = 40 where professional_id = :A` (dernier) ; `insert` d'une ligne `serrurerie` à `45 / 62 / 40` (dernier) ; `insert` d'une ligne `serrurerie` à `0 / 0 / 0` puis relit | **`OP012`**, message complet ; **`OP012`** ; `INSERT 0 1` et `0 / 0 / 0` |
| 20 | **aucune fonction ne lit les colonnes mortes** (relecture base, 10) : fonctions de `public` dont `prosrc` nomme `sos_availability` et contient `\m(deplacement\|horaire\|majoration)\M` | `refuse_les_colonnes_mortes_du_sos` seulement |

### 7.2 Le rattrapage : `supabase/essais-section-47-rattrapage.sql`, et la procédure qui le fait tourner

Le rattrapage ne tourne **qu'une fois** : il s'éprouve sur **la base que le propriétaire a réellement** (CLAUDE.md : `git show <commit>:supabase/schema.sql`).

**Procédure** (écrite dans l'en-tête du fichier) :
1. PostgreSQL 16 neuf, `local-prelude.sql` ;
2. `git show d0560e8:supabase/schema.sql`, **deux fois** ;
3. **la première moitié** du fichier : les données « d'avant », en superutilisateur :
   - R1 : pro plombier, SOS `45.00 / 62.00 / 40` actif, **aucune** ligne `tarifs_pro` ;
   - R2 : pro maçon, SOS `electricite` `0 / 0 / 0` actif (**la ligne du propriétaire**, reproduite) ;
   - R3 : pro plombier, SOS `35.00 / 55.00 / 25` actif, `tarifs_pro` frais `3000` déjà déclarés ;
   - R4 : pro serrurier, SOS `20000.00 / 0.50 / 0` actif (hors bornes) ;
   - R5 : pro chauffagiste, SOS `45.00 / 60.00 / 30` actif, `tarifs_pro` en **conditions seules** ;
   - R6 : pro plombier, **deux** lignes SOS (`plomberie` actif `40/50/20`, `chauffage` inactif `99/99/99`) ;
4. le **nouveau** `schema.sql` ; noter la `NOTICE` ;
5. **la seconde moitié** : les vérifications ;
6. le nouveau `schema.sql` **encore** ; la seconde moitié **encore** — mêmes résultats ;
7. **le retrait des colonnes mortes, simulé** : `alter table public.sos_availability drop column deplacement, drop column horaire, drop column majoration;` puis le nouveau `schema.sql` **deux fois** — aucune erreur (les commentaires sont conditionnels) ; puis une écriture sur `sos_availability` (`update … set actif = true`) — **passe** (le corps tolérant) ; puis `artisans_urgence` — rend les mêmes lignes (elle ne lit pas ces colonnes).

| ligne | attendu après |
|---|---|
| R1 | `4500 / 6200 / 40`, `affiche false`, `affiche_le null`, SOS toujours actif |
| R2 | **aucune** ligne `tarifs_pro` ; SOS `actif false` |
| R3 | frais **`3000`** (le devis gagne), taux `5500`, majoration `25` |
| R4 | aucune ligne `tarifs_pro` |
| R5 | frais `null` + conditions **intactes**, taux `6000`, majoration `30` |
| R6 | la ligne **active** est copiée (`4000 / 5000 / 20`) |
| la notice | **`4 ligne(s) de tarifs créées ou complétées ; 4 ligne(s) SOS dont une valeur n'a pas été copiée ; 1 ligne(s) SOS éteinte(s).`** — copiées : R1, R3, R5, R6 ; non copiées : R3 (le devis gagne), R4 (hors bornes), R5 (conditions seules), la ligne `chauffage` de R6 (non retenue) ; éteinte : R2. (La version 1 attendait « 1 conflit » : sa requête comptait aussi R5, mesuré par la relecture base sur des valeurs littérales — 2 en réalité.) |
| les colonnes mortes | les **sept** lignes SOS valent `0 / 0 / 0` : **six** ont été remises à 0, celle de R2 l'était déjà |
| `artisans_urgence` pour R1, par un particulier | **dans une transaction annulée** : `update … set affiche = true where pro_id = R1` puis **1** ligne (la donnée est là, et lisible) ; **hors de cette transaction** : **0** — le rattrapage n'a rien publié (relecture base, 4) |
| après rejouage | identique, aucune notice |

**Après les deux essais, rejouer les 21 autres fichiers d'essais** sur une base neuve au nouveau schéma (CLAUDE.md, section 44). Seuls changent des numéros de ligne, **et les attendus de l'essai 46 du §7.3** ; tout autre écart est un défaut.

### 7.3 `supabase/essais-section-46.sql` — ce qui change, et pourquoi

Le fichier dit, en tête de chaque cas touché : « attendu changé par la section 47 (lot T) : … ».

| cas | aujourd'hui | devient |
|---|---|---|
| 24 c (`:797-802`) | `set local role anon; select count(*) from public.tarifs_pro;` → **ERREUR attendue** | **inchangé** : `anon` n'a toujours aucun droit sur la table, et l'erreur ne dépend pas des données |
| 26 (`:843-846`) | `anon_select_attendu_f` pour les trois tables | **inchangé** |
| 26 bis (`:858-872`) | liste fermée de cinq, `les_nomment_attendu_2` | la liste fermée **plus `artisans_urgence`**, et l'attendu par ENSEMBLE (`string_agg(… order by …)`) : `artisans_urgence, emetteur_incomplet, mes_donnees` |
| 29 (`:917-928`) | `contraintes_check_attendu_20` | `contraintes_check_attendu_25` (20 + 5) |

---
## 8. La vérification sur la vraie base, au navigateur, et sur l'iPhone

### 8.1 Avant d'écrire une ligne (lecture seule, comptages de forme)

- **Refaire les mesures de l'en-tête** : noms libres, `tarifs_pro` à 0 ligne, la ligne SOS (forme seulement), `artisans_urgence` (résultat exact), 15 / 8 / 21, les lignes SOS hors des bornes de rayon et de délai (doit valoir 0), le nombre de comptes et de fiches à moins de 60 km de Brest (doit valoir 0).
- **Si `tarifs_pro` a des lignes** : ne compter que des **présences** — combien ont un montant de frais, combien un texte sans montant (`is not null`). **Jamais une comparaison de montants** : avec un ou deux artisans, « en conflit avec le SOS » dirait quelque chose du prix privé d'une personne identifiable, et la clause ne permet que de « compter les lignes ou vérifier la structure de la base sans lire vos prix » (`legal.js:553-555` ; relecture droit, m16).

### 8.2 La migration, simulée puis appliquée

1. Le §7.2 a déjà joué la base « d'avant » + le nouveau schéma. On refait la même chose avec **le fichier de migration** du §2.10 à la place du nouveau schéma, deux fois.
2. Un second PostgreSQL neuf, avec le nouveau `schema.sql`, deux fois.
3. **Comparer l'empreinte du catalogue** (fonctions — `md5` du corps sans `\r` —, `prosecdef`, `proconfig`, `proacl` ; contraintes ; `pg_policies` ; déclencheurs ; colonnes, types, défauts ; droits de table ; commentaires). **Identiques**, aux deux écarts connus du 0a près.
4. **Un relevé de forme AVANT** (relecture base, 8 — qu'`apply_migration` rende la `NOTICE` n'est pas vérifié) : nombre de lignes de `tarifs_pro` ; nombre de lignes SOS actives ; nombre de lignes SOS dont une des trois colonnes est non nulle ; `actif` sur la ligne du propriétaire.
5. Appliquer par `apply_migration`.
6. **Le même relevé APRÈS**, plus : les six colonnes, les huit contraintes de `tarifs_pro` et les deux nouvelles de `sos_availability`, les deux politiques de `tarifs_pro` (la seconde avec le `qual` **exact** du cas 15, `not est_un_pro()` compris), les deux déclencheurs, `artisans_urgence` (résultat **exact**, `prosecdef false`, `anon` sans `execute`), `metier_du_sos`, `anon` sans aucun droit sur `tarifs_pro`, les trois commentaires `MORTE`, `mes_donnees` contient `ma_disponibilite_urgences` et `urgences`. Attendu : `tarifs_pro` toujours à **0 ligne**, **0** ligne SOS active, **0** ligne aux colonnes non nulles, la ligne du propriétaire `actif false`.
7. **Un lot dont la moitié base n'est pas appliquée n'est pas fini.**

### 8.3 Les comptes jetables

- A (pro, **plombier**), B (pro concurrent, électricien — **l'artisan jetable qui ne doit RIEN lire** des tarifs de A), P (particulier — **le particulier jetable qui les lit**), **tous placés à Brest** — mesuré : aucun compte ni aucune fiche réels à moins de 60 km. Placés à Aix-en-Provence comme le prévoyait la version 1, A aurait été visible, pendant l'essai, des **deux** particuliers réels localisés, tous deux à moins de 40 km d'Aix : l'un d'eux aurait pu lui envoyer une vraie urgence, qui aurait disparu au ménage (`sos_requests.professional_id … on delete cascade`, `schema.sql:857` ; relecture base, 12).
- Adresses `tarifs-a-<horodatage>@exemple-opus.test` et suivantes, **une preuve `essai` pour chaque adresse EXACTE** de pro, posée par le connecteur avant l'inscription ; **SIRET fictifs à clé juste, vérifiés inconnus du répertoire Sirene** (relecture droit, m15 : la formule « libres de toute entreprise active » de la version 1 aurait laissé passer le numéro d'une vraie entreprise fermée, que CLAUDE.md interdit). Inscription par `curl` `POST /auth/v1/signup`.
- **Ni le compte de l'entreprise du frère, ni le compte du propriétaire ne servent à cet essai.**
- Ménage : par le chemin de l'application (`token`, `preparer_suppression_compte`, `/functions/v1/compte`) ; base revenue à ses comptages ; **puis `sos_requests` relue : 0 ligne hors des comptes jetables** (donc 0 ligne en tout aujourd'hui).

### 8.4 Au navigateur, sur la vraie base

1. `npx expo start --web -c`, `.env` présent.
2. Playwright : relais Supabase **et** Base Adresse ; **`**/rpc/enregistrer_vues` neutralisé avant toute connexion** ; `**/functions/v1/siret` intercepté.
3. Relevés :

| geste | attendu |
|---|---|
| A ouvre « Mon entreprise », mode lecture | bloc « Vos tarifs » : « Non affichés : tant qu’ils sont cachés, ils ne servent qu’à préparer vos devis. » ; **pendant la lecture, aucun bloc** |
| A, section « Vos tarifs » | les champs et trois interrupteurs, chacun ≥ 44 de haut ; les champs numériques sans touche retour |
| A tape un taux, puis ferme la fenêtre | la bande « Quitter sans enregistrer » apparaît |
| A allume puis éteint « Afficher », ferme | **aucune** bande |
| A allume « Afficher » | sous l'interrupteur : « Visibles des particuliers connectés seulement : un autre artisan ne les voit pas depuis son compte. » |
| A tape « 0 » dans le taux | refus en ligne, **aucune requête** |
| A allume « Afficher » sans aucun tarif, enregistre | refus avant l'envoi, la phrase de `tarif_affiche_check`, la fenêtre défile jusqu'à la section `affiche` ; **aucune requête** |
| A remplit 45 / 62,50 / 40 / décompte / devis gratuit, affiche, enregistre | `POST /rest/v1/tarifs_pro → 201` ; **relever le statut** ; « Affichés depuis le {aujourd'hui} » |
| rechargement complet | tout revient de la base ; aperçu « Ce que voient les particuliers » ; « Mes tarifs » sur « Mon profil », **avec la phrase « Visibles des particuliers connectés seulement… » juste sous le titre** |
| A, « Modifier mon profil » : métier plombier, « Je réponds aux urgences » éteint | l'interrupteur et sa phrase |
| A allume | « En enregistrant, vous apparaîtrez dans les urgences « Plomberie »… » (le futur) |
| A enregistre | `POST /rest/v1/sos_availability → 201`, puis `PATCH … actif=false` (les autres lignes) ; puis, en rouvrant, la ligne au présent |
| A change sa présentation et enregistre | **l'interrupteur reste allumé**, la ligne SOS reste `actif true` en base (relecture application, B1) |
| P, écran SOS, Plomberie, « Fuite d’eau », « Tout de suite », adresse choisie dans les suggestions, de jour | `POST /rest/v1/rpc/artisans_urgence → 200` puis `GET /rest/v1/tarifs_pro?…affiche=eq.true → 200` ; **1 carte** : `108 – 170 € TTC`, détail « Déplacement 45 € · 62,50 €/h », « Devis : gratuit », « Temps : … » |
| de nuit (`page.clock` à 22 h) | `151 – 238 € TTC`, « majoration de nuit incluse », « +40 % la nuit et le week-end, déplacement compris » |
| « Demain », de nuit | `108 – 170 € TTC`, « +40 % si l’intervention a lieu la nuit ou le week-end » |
| P ouvre la fiche de A | `GET /rest/v1/tarifs_pro?…affiche=eq.true → 200`, une ligne ; « Ses tarifs », cinq lignes, juste après le contact ; la majoration se lit « +40 % », **sans heures** |
| **B** ouvre la fiche de A | **aucun bloc** — ni « aucun tarif », ni « prix non communiqués » : le contact, puis directement « Ses chantiers » ; et **aucune requête `GET /rest/v1/tarifs_pro`** ne part (la lecture n'est lancée que pour un particulier) |
| A éteint « Afficher », enregistre ; P **rouvre** la fiche de A, sans recharger | **aucun bloc** — la lecture part à chaque ouverture (relecture application, I6) |
| P cherche de nouveau | **0 carte**, « Aucun artisan disponible… » ; le réglage SOS de A : « Vous n’apparaîtrez pas dans les urgences : vos tarifs ne sont pas affichés… » |
| A rallume, met la majoration à « Je ne majore pas » ; P cherche de nuit | « sans majoration la nuit ni le week-end », et **pas** « majoration incluse » |
| A choisit « Je ne facture pas de frais de déplacement » ; P rouvre la fiche | la carte dit « Déplacement offert » ; la fiche, une seule ligne « Déplacement offert » |
| route `**/rpc/artisans_urgence` coupée | « La recherche d’artisans : pas de connexion… » en français, **jamais** l'anglais de PostgREST |
| P « Choisir » | `POST /rest/v1/sos_requests → 201` ; `prix_min`/`prix_max` relus en base **égaux** à la carte ; le bandeau dit « … € TTC » |

4. **Par `curl`, avec la seule clé publiable** (`anon`) : `GET /rest/v1/tarifs_pro?pro_id=eq.<A>` → **401 · 42501**, que A affiche ou non ; `POST /rest/v1/rpc/artisans_urgence` → **401 · 42501**.
5. **Avec le jeton de B, l'artisan** : `GET /rest/v1/tarifs_pro?pro_id=eq.<A>` → **`[]`, que A affiche ou non** — relevé **juste après** que P a lu la ligne affichée, pour que ce `[]` soit crédible ; `POST /rest/v1/rpc/artisans_urgence` depuis un point proche de A → **`[]`** (relevé juste après que P y a trouvé A).
5 bis. **Avec le jeton de P, le particulier** : `GET` de la ligne de A → `[]` quand il n'affiche pas, une ligne quand il affiche ; `PATCH /rest/v1/tarifs_pro?pro_id=eq.<A>` → `204` et **rien de changé** (relu par A) ; `DELETE` → idem ; `POST … Prefer: resolution=merge-duplicates` au nom de A → **403**. C'est P qu'il faut éprouver en écriture : c'est lui qui LIT la ligne.
6. **Avec le jeton de A** : `PATCH /rest/v1/sos_availability?… {"horaire": 62}` → **400 · OP012**, message complet (ce que ferait l'ancienne application) ; `PATCH … {"rayon_km": 100000}` → **400 · `sos_rayon_check`**.
7. **Avec le jeton de P, après un blocage de A par P** : la fiche de A ne montre plus le bloc ; `rpc/artisans_urgence` ne rend plus A. Blocage retiré avant la suite.
8. `rpc/mes_donnees` avec A : `mes_tarifs` porte les six clés nouvelles (`affiche_le` comprise), `ma_disponibilite_urgences` une ligne, `urgences` une ligne ; avec P : `urgences` une ligne.
9. Suppression des trois comptes par le chemin de l'application ; `tarifs_pro`, `sos_availability` et `sos_requests` sans ligne de ces comptes.

### 8.5 En démonstration (sans `.env`)

Les cas du §5.7, un par un, avec captures dans `captures/` : un seul plombier ; « Déplacement offert » ; « sans majoration » de nuit et pas « majoration incluse » ; « Devis : 30 € TTC » ; « Demain » ; **en particulier**, « Ses tarifs » sur 2, 4, 6, 7 et pas sur 8, sans heures ; **en professionnel**, aucun bloc sur aucune fiche ; « Mon entreprise » refuse d'afficher sans aucun tarif, accepte avec le seul prix du devis ; « Mes tarifs » et sa phrase « Visibles des particuliers connectés seulement… » ; « Modifier mon profil » montre l'orpheline.

### 8.6 L'essai humain sur l'iPhone

**Dans Expo Go, ou dans un build reconstruit — jamais dans l'icône « preview » du 17/10**, qui contient le code d'avant le lot (`A-FAIRE.md:1733-1737`).

**Sur le propre compte du propriétaire**, avec des valeurs **fictives** marquées « essai » dans le décompte, puis remises à vide **et l'interrupteur éteint** : une ligne affichée est lisible par tous les particuliers connectés pendant ce temps-là (deux particuliers réels sont localisés, mesuré).

Son compte n'a **aucun métier d'urgence** (mesuré) et ne peut pas ouvrir l'écran SOS, réservé aux comptes qui ne publient pas (`BottomNav.js:50-52`). **La carte SOS au doigt ne se vérifie donc qu'avec un compte particulier** : on lui demande, au moment de l'essai, s'il en a un sur son téléphone ; sinon, elle n'aura été vérifiée qu'au navigateur, et on le dit.

Cinq questions écrites à l'avance :
1. La virgule du pavé décimal passe-t-elle pour le taux horaire (« 62,50 ») ?
2. Le champ actif remonte-t-il au-dessus du clavier dans « Vos tarifs », tout en bas ?
3. Les interrupteurs se touchent-ils sans viser ?
4. « Mes tarifs » apparaît-il sur « Mon profil » après l'enregistrement, et disparaît-il quand il éteint ?
5. Les phrases sous « Afficher mes tarifs sur ma fiche » se comprennent-elles sans relire ?

---

## 9. Les pièges, l'ordre de construction, les fichiers

### 9.1 Les pièges de CLAUDE.md qui s'appliquent ici

1. **Le mode démo masque les erreurs de base** : chaque écriture du lot est insérée **pour de vrai** sur la vraie base (§8.4).
2. **L'application en avance sur la base** : migration appliquée et relue dans le même lot, **la base d'abord** (§2.10).
3. **Une règle RLS filtre des lignes, jamais des colonnes** : publier une ligne publie toutes ses colonnes, d'où la liste fermée (§6.1-B).
4. **Un droit sans lecteur est une porte** : aucun écran sans session, donc aucun droit `anon` sur les tarifs (§2.5) — la leçon de la section 18.2.
5. **Toute fonction appelée par une politique reste exécutable par `authenticated`** : `est_un_pro` et `est_masque` le sont, `verifier-portes` le tient, et ce lot ne révoque rien.
6. **`for all`, quatre portes** : la lecture s'ajoute par une politique `for select` ; l'écriture reste à `"mes tarifs"`, et l'essai le prouve **sur une ligne affichée** (cas 6).
7. **Le titulaire voit sa propre ligne** : tout lecteur public filtre `affiche is true` ; on éprouve la lecture avec un particulier, la non-lecture avec un autre artisan ; et `artisans_urgence` appelée par le titulaire le rend lui-même (cas 8 ter) — ce n'est pas une fuite, c'est son prix.
8. **Un essai RLS dans un `do` ne prouve rien ; sans jeton non plus ; un « 0 » n'a de sens qu'après le « 1 » dans la même transaction ; un cas ne dépend jamais d'un autre** (§7.1).
9. **Une fonction appelée par l'application ne change jamais de signature** : `artisans_urgence` garde ses onze colonnes ; l'ancienne application les lit encore.
10. **Une fonction SQL est contrôlée à sa création** : `artisans_urgence` déménage ; `metier_du_sos` naît avant le rattrapage.
11. **Un corps plpgsql n'est planifié qu'à l'exécution, et ne crée aucune dépendance sur une colonne** : le déclencheur des colonnes mortes lit `to_jsonb(new)` ; l'`insert` du rattrapage est prouvé par l'essai.
12. **Les droits d'une fonction** : `revoke … from public, anon` puis `grant` explicite, **juste après** elle.
13. **Le connecteur refuse tout ordre qui COMMENCE par `drop` ou `delete`** : contraintes et politique créées sous condition ; aucun `drop function` dans la migration ; colonnes mortes laissées en place.
14. **`schema.sql` reste rejouable** — même après le retrait futur des colonnes mortes (commentaires conditionnels, corps tolérant, essai §7.2-7).
15. **Aucune contrainte anonyme**, toutes en `_check`, chacune avec sa phrase.
16. **`mes_donnees()` reste la dernière fonction, et la migration l'emporte en entier.**
17. **Le balayage reste le dernier bloc.**
18. **Un `null` n'est pas un `0`** ; seul un interrupteur écrit 0 ; **aucune base ne vide un texte en silence**, et **aucune base ne remet un chiffre à 0 en silence** : `OP012` refuse.
19. **Les dates qui engagent sont posées par la base** : `affiche_le`, `clock_timestamp()`.
20. **`Number(null) === 0`** ; **pas de flottant pour un montant**.
21. **`===` entre un nombre et une chaîne** : `TARIFS_DEMO` indexé par chaîne.
22. **Une `const` lue avant sa déclaration = écran blanc** : `mesTarifs`, `tarifsAffiches`.
23. **Le piège Metro asynchrone + ternaire** ; **`await import(…)` interdit** ; aucun paquet nouveau.
24. **`npx expo export` peut rendre 0 en échouant** : lire sa sortie, iOS puis Android, puis démarrer au navigateur.
25. **Un calcul pur vit dans un fichier qui ne charge pas React Native** : `tarifs.js` ; `urgences.js` reste sans import.
26. **Une fonction que personne n'appelle est le « bouton §18 »**.
27. **Deux portes, le même travail ; une vérité, une formule** : `etatReglageSos` sert les deux écrans ; `mesTarifs` sert les trois.
28. **L'artisan voit sa page comme ses clients** : même composant, même ordre, même garde — plus la phrase qui lui dit **qui** les voit, parce que ses confrères, eux, ne voient pas ce bloc.
29. **Un travail qui n'a pas pu se faire ne ressemble jamais à un travail fait** : échecs de lecture dits ; rejets du SOS comptés ; la liste visible décide de l'état vide.
30. **`hitSlop` est ignoré au navigateur** : `minHeight: TOUCHE` partout.
31. **Les pavés numériques n'ont pas de touche retour.**
32. **Le clavier** : la section « Vos tarifs » est en bas d'un `ScrollView {...CLAVIER}` déjà en place.
33. **Les cliquets** (`verifier-echelles`, `verifier-atelier`) sont à zéro de marge.
34. **Le vocabulaire** : « TTC » à côté de chaque montant affiché ; une règle d'Opus se dit comme un choix ; une convention d'Opus (les heures de nuit) ne s'attribue pas à l'artisan.
35. **Un contrôle vise une propriété, retire les commentaires, s'éprouve en cassant** — et ne vise pas une sous-chaîne qui accuserait du code juste (`min(`).
36. **Pour la vraie base** : `-c`, `enregistrer_vues` neutralisé, preuve `essai` pour l'adresse exacte, `siret` intercepté, SIRET fictifs inconnus du répertoire, comptes loin des vrais utilisateurs, suppression par l'application.
37. **Pas de prix conseillé, pas d'agrégat.**
38. **Une colonne morte d'une table publique n'est pas une colonne inoffensive.**
39. **Une barrière n'est pas un verrou** : `not est_un_pro()` ferme l'application aux comptes pro, pas un second compte particulier ouvert par un artisan. Aucun texte, aucun écran, aucun commentaire ne promet plus que la barrière (réponse du 19/10).
40. **Les politiques `select` s'additionnent en OU** : une seconde politique plus large, posée « à côté », rouvre ce que la première ferme. D'où une seule politique de lecture publique sur `tarifs_pro`, tenue par le contrôle (6.1-29 bis).

### 9.2 L'ordre de construction

| étape | ce qu'on fait | comment on le vérifie |
|---|---|---|
| **0** | refaire les mesures de §8.1. **Fait le 19/10** : les quatre questions sont posées et répondues (§10.1) ; le propriétaire **n'a pas recopié** les art. 2 et 3 de l'arrêté du 24/01/2017 depuis Légifrance (point 11 de `PLAN-DEVIS.md:3341`) — la phrase de §5.1 reste donc sans guillemets et le point reste ouvert | noms libres ; comptages notés |
| **1** | `erreurs.js` ; `emetteur.js` ; `tarifs.js` (avec `QUI_VOIT_LES_TARIFS`), `tarifs-demo.js` ; `urgences.js` allégé ; `verifier-tarifs`, parties A, B, E-37 | 6.1-1 à 14 ; `verifier-emetteur`, `-metiers`, `-clients` verts ; sabotages 37-43, 49-50, 64, 70-72 |
| — | **les quatre réponses sont là** (19/10, §10.1) | plus rien n'attend |
| **2** | section 47 (politique `not est_un_pro()` comprise), section 14 vidée, 11 bis corrigée, commentaires de la 46, `mes_donnees()` ; les deux essais, l'essai 46 mis à jour ; parties C et D de `verifier-tarifs` (29 bis comprise) ; `verifier-emetteur` et `verifier-legal` réécrits (§6.2, §6.3, sauf le texte) | schéma deux fois sur une base neuve ; **les cas lus un par un** (5, 5 bis, 5 ter, 8 ter compris) ; la procédure du §7.2, retrait simulé compris ; les 21 autres fichiers rejoués ; `verifier-portes`, `-pro`, `-chantier`, `-clients` verts ; sabotages 1-36, 73-76 |
| **3** | `api.js` | 6.1-30 ; `npm run lint` ; `verifier-atelier` ; sabotages 44-47, 58 |
| **4** | les écrans, `OpusApp` ; `legal.js` (`VERSION`, deux textes) ; la partie texte de `verifier-legal` | sabotages 48, 51-57, 59-63, 65-69, 77-81 ; `npm run verifier` en entier (**codes de sortie**) ; `npx expo export` iOS puis Android, **sortie lue** |
| **5** | le navigateur en démonstration (§8.5) | les captures |
| **6** | migration simulée, empreinte, relevé avant, application, relevé après, navigateur et `curl` sur la vraie base, suppression (§8.2 à §8.4) | les tableaux de §8.4 remplis avec les nombres **relevés** |
| **7** | **les documents** (§9.3) ; **message de commit** qui dit ce qui n'a pas été vérifié (§8.6) | puis les cinq questions de §8.6 au propriétaire |

### 9.3 Les fichiers touchés

- **Créés :** `src/lib/tarifs.js`, `src/data/tarifs-demo.js`, `src/components/TarifsPublics.js`, `supabase/essais-section-47.sql`, `supabase/essais-section-47-rattrapage.sql`, `scripts/verifier-tarifs.mjs`.
- **Modifiés :**
  - `supabase/schema.sql` (sections 11 bis, 14, commentaires de la 46, 47 nouvelle, 42) ;
  - `src/lib/erreurs.js`, `src/lib/emetteur.js`, `src/lib/api.js`, `src/data/urgences.js`, `src/data/legal.js`, `src/OpusApp.js` ;
  - `src/components/FicheEmetteur.js`, `src/components/MonEntreprise.js` ;
  - `src/screens/ProfilEditScreen.js`, `src/screens/SosScreen.js`, `src/screens/ProfilProScreen.js`, `src/screens/ProfilOwnScreen.js`, `src/screens/DemandesRecuesScreen.js` ;
  - `supabase/essais-section-46.sql` ;
  - `scripts/verifier-emetteur.mjs`, `scripts/verifier-legal.mjs`, `package.json` ;
  - **les documents** (relecture droit, I4) :
    - `CLAUDE.md` : une section « Les tarifs réunis — lot T » (le titulaire voit sa ligne ; **les tarifs affichés ne sont lus que par les particuliers, par `not est_un_pro()`, et c'est une barrière, pas un verrou** ; `affiche` jamais allumé par une migration, et daté par la base ; aucun droit `anon` ; le rattrapage une fois ; les colonnes mortes et `OP012` ; `artisans_urgence` en section 47 ; le démarrage d'un pro à une requête de plus ; le texte suit le schéma). **La phrase du 18/10 de `CLAUDE.md:7288` ne change pas** : elle reste vraie telle quelle (réponse du 19/10) ;
    - `docs/PLAN-DEVIS.md` : la phrase de `:3439` **ne change pas** non plus — le §10.14 le dit déjà, avec les réponses du 19/10 ; le lot T s'y coche quand il est livré ;
    - `docs/DONNEES-DES-ARTISANS.md:767-774` : la phrase **ne change pas** ; un renvoi vers ce lot, qui dit que les tarifs affichés vont aux seuls particuliers, avec la limite du second compte ;
    - `docs/COMPARATEUR-MATERIAUX.md:441` : **inchangé** (la phrase reste vraie, et « il vaut aussi pour les prix d'achat » aussi : un prix d'achat ne s'affiche jamais) ;
    - `docs/A-FAIRE.md` : lot T coché ; la ré-acceptation des conditions avant la sortie de `'essai'`, pour les 11 comptes sans version et les 4 qui en ont une ancienne ; **l'avis d'un avocat : rien à ajouter** — il y est déjà, comme simple rappel (`:1759-1762`, réponse du 19/10) ; au juriste : HT/TTC et l'unité imprimée sur le devis, l'art. 3 et la fiche Opus, **une majoration de nuit est-elle un « taux horaire » au sens des art. 2-3**, **des durées-types d'Opus appliquées au taux de chacun font-elles un indicateur « normatif »** (`DONNEES-DES-ARTISANS.md:817-818` ; relecture droit, m17) ; les forfaits (« plus tard », 19/10 : le lot qui les lira) ; le retrait des colonnes mortes, fichier et vraie base ensemble ; la lecture `anon` de `sos_availability` ; le motif de `verifier-etats` à élargir, avec la liste des huit endroits (§11.3) ; l'identité du build de développement (déjà inscrite).
- **Inchangés, et c'est voulu :** `ApercuEntete.js` et `enteteImprime` (lot 2) ; `emetteur_incomplet()` (aucun motif nouveau : un devis peut se faire au forfait, sans taux horaire).
- **Jamais commité :** le fichier de migration du dossier temporaire.

---
## 10. Les réponses du propriétaire (19/10/2026)

Quatre questions lui ont été posées, et seulement celles que ni le droit ni une décision déjà prise ne tranchaient. **Les quatre réponses sont arrivées le 19/10** ; elles sont consignées dans `docs/PLAN-DEVIS.md` §10.14, et ce cahier les applique partout. Là où elles contredisaient la version 2, **elles priment**.

### 10.1 Les quatre réponses, et ce qu'elles ont changé dans ce cahier

| question | réponse | ce qu'elle a changé |
|---|---|---|
| **1** — Pour répondre aux urgences, un artisan doit-il afficher ses tarifs ? | **« Oui, c'est obligatoire »** | rien dans la construction : c'est la version que la v2 construisait (`artisans_urgence` exige `t.affiche is true` et les trois `is not null`). La phrase « Répondre aux urgences demande de les afficher » entre dans la CGU (§5.9, 6.3-4). Les options « sans prix » et « urgences seulement » sont écartées, avec ce qu'elles auraient demandé (une carte « prix non communiqués », une politique à deux portes) |
| **2** — Les tarifs affichés, lisibles par qui ? | **« Les particuliers seulement »**. Le propriétaire a demandé : « on peut laisser lire les tarifs que par un particulier et non par les autres pros ? », puis l'a confirmé, **informé de la limite** : un artisan peut ouvrir un second compte particulier avec une autre adresse. **Et l'avis d'un avocat est un simple rappel**, pas un blocage | **la politique de lecture** gagne `not public.est_un_pro()` (§2.5) ; le tableau « ce que voit qui » : un autre artisan et l'administration ne lisent plus une ligne affichée ; `artisans_urgence` appelée par un artisan ne rend aucun autre artisan (§2.6) ; **la fiche publique** : « Ses tarifs » pour un particulier seulement, aucun bloc pour un autre artisan, « Mes tarifs » et la phrase `QUI_VOIT_LES_TARIFS` chez le titulaire (§4.2, §5.1, §5.4, §5.5, §5.7) ; **les textes opposables** réécrits, la limite dite telle quelle (§5.9) ; **l'avis d'un avocat ne conditionne plus rien** : il quitte §5.9, §6.3-11, le sabotage 69 et l'étape 4 de l'ordre de construction, et n'est plus que le rappel de `A-FAIRE.md:1759-1762` ; un contrôle nouveau (6.1-29 bis) et la ligne 1045 de `verifier-emetteur` réécrite ; les essais 0, 5, 5 bis, 5 ter, 6, 8 ter, 9 et 15 (§7.1) ; la vraie base, avec un artisan jetable qui ne lit pas et un particulier jetable qui lit (§8.3, §8.4) ; les pièges 39 et 40 (§9.1). **L'engagement du 18/10 reste vrai tel quel** : les quatre documents qui le portent ne changent pas (§9.3) |
| **3** — Les forfaits d'un dépanneur dès maintenant ? | **« Plus tard »** | rien : c'est la version construite, aucune table de forfaits. Un dépanneur au forfait peut afficher ses frais et le prix de ses devis, mais n'apparaît pas dans les urgences sans taux horaire |
| **4** — La majoration de nuit et de week-end dans l'estimation des urgences ? | **« Comme aujourd'hui »** | rien : de 20 h à 7 h et le week-end, sur le déplacement comme sur les heures (`estimationSos`, §4.2) ; le sabotage 37 doit rougir |

**Ce que les réponses ne demandent PAS à ce lot** : le lot T **remplace** le lot 6 conditionnel, et l'ordre du devis devient **T → 1 → P → S → 2** (`PLAN-DEVIS.md` §10.14). L'audit de l'addendum QR (`docs/AUDIT-ADDENDUM-QR.md`) ne demande rien au lot T : **aucune colonne** n'est créée pour le QR, la relation ni le Dossier Travaux.

### 10.2 Ce qu'on lui dit, sans le lui demander

1. **Votre ligne d'urgence « Électricité », à 0 €, sera éteinte.** Elle est active sur un métier qui n'est plus sur votre fiche, et l'application ne vous montrait plus rien pour l'éteindre. La règle vaut pour tous : on n'est disponible en urgence que sur un métier de sa fiche. Sur la vraie base, la vôtre est la seule concernée. Vous la rallumerez le jour où un de vos métiers sera d'urgence.
2. **N'ouvrez plus l'icône Opus « preview » de votre iPhone** tant qu'elle n'est pas reconstruite : elle contient le code du 17/10. Après ce lot, si elle essayait d'enregistrer des tarifs d'urgence, la base refuserait avec une phrase qui demande de mettre l'application à jour. Essayez dans Expo Go.
3. **Les articles 2 et 3 de l'arrêté du 24 janvier 2017** (le point 11 de la liste du plan) : vous ne les avez pas recopiés depuis Légifrance (19/10). La phrase de « Mon entreprise » qui cite cet arrêté reste donc **sans guillemets**, et le point reste ouvert.
4. **Les tarifs se déclarent toutes taxes comprises** : c'est ce que paie le client, et ce qu'il lit. La façon dont le devis l'imprimera se décidera au lot 2, avec un juriste.
5. **Au moment de l'essai sur l'iPhone** : avez-vous un compte particulier sur votre téléphone ? Sans lui, la carte SOS ne se vérifie qu'au navigateur, et on le dira.

---
## 11. Ce que les relectures ont changé

Chaque constat a été **revérifié** sur le dépôt (`be4b530`) ou sur la vraie base (lecture seule) avant d'être appliqué ou écarté. Les lignes relues pour cette version : `OpusApp.js:261`, `:309`, `:420-500`, `:1295-1330`, `:2205-2225`, `:2495-2520`, `:2925-2975`, `:3388-3408`, `:3822-3848`, `:4110-4140` ; `api.js:100-112`, `:583`, `:585-640`, `:698-722`, `:800-820`, `:918-985`, `:2438-2462`, `:2668-2732`, `:3760-3770` ; `SosScreen.js:1-100`, `:195-285` ; `urgences.js` en entier ; `ProfilEditScreen.js:36-160`, `:620-690` ; `FicheEmetteur.js:70-160`, `:275-420`, `:955-1030` ; `MonEntreprise.js:60-92`, `:160-182`, `:298-380`, `:520-560` ; `emetteur.js:75-90`, `:120-205`, `:630-650`, `:1264-1278` ; `erreurs.js:55-120`, `:270-300` ; `demo.js:24-140` ; `DemandesRecuesScreen.js:386-396` ; `BottomNav.js:48-53` ; `ProfilProScreen.js:249-253` ; `ProfilOwnScreen.js:253-257` ; `schema.sql:830-876`, `:1200-1212`, `:1950-1958`, `:6725-6735`, `:8620-8642`, `:10318-10336`, `:10505-10620` ; `essais-section-46.sql:98-106`, `:236-250`, `:705-740`, `:790-930` ; `verifier-emetteur.mjs:85-100`, `:512-522`, `:600-678`, `:915-1015`, `:1050-1060`, `:1238-1270` ; `verifier-etats.mjs:85-110` ; `verifier-legal.mjs:486-516` ; `verifier-demandes.mjs:100-108` ; `PLAN-DEVIS.md:322-330`, `:585-595`, `:660-668`, `:692-698`, `:1085-1095`, `:2600-2640`, `:2790-2797`, `:2833-2837`, `:2878-2890`, `:2905-2910`, `:2984-2992`, `:3232-3240`, `:3336-3362`, `:3430-3448` ; `DONNEES-DES-ARTISANS.md:740-840`, `:905-930` ; `CLAUDE.md:7284-7292` ; `COMPARATEUR-MATERIAUX.md:436-445` ; `A-FAIRE.md:38-55`, `:1728-1740`.

### 11.1 Appliqué

| constat | correction | où |
|---|---|---|
| **base 1** — un droit `anon` sur les tarifs sans aucun lecteur, justifié par un appel qui n'existe pas | lecture réservée aux comptes connectés (puis, le 19/10, aux seuls **particuliers** connectés : §2.5, §10.1) ; aucun `grant` à `anon` ; `artisans_urgence` et `metier_du_sos` retirées à `anon` ; la 46.5, l'essai 46 (24 c, 26) et `verifier-emetteur:1054` ne bougent plus ; la CGU ne parle plus de « personnes sans compte ». **Pas de question** : la 46.5 l'avait tranché par écrit, et aucun écran ne s'ouvre sans session | §0.1, 2.1, 2.5, 2.6, 5.9, 6.1-29, 6.2, 6.3-5, 7.1 (4 bis, 8 bis, 9, 13, 15), 7.3, 8.4-4 |
| **base 2** — le retrait des colonnes mortes cassait l'écriture SOS et le rejouage | appliqué **autrement** : corps du déclencheur par `to_jsonb(new)` (tolérant à l'absence des colonnes), commentaires de colonne sous condition, **aucune ligne demandée au propriétaire dans ce lot**, retrait simulé dans l'essai du rattrapage | §1.2, 2.7, 6.1-27, 7.2-7, sabotages 32-34 |
| **base 3** — `rayon_km` et `delai_minutes` sans borne nuisent aux particuliers | `sos_rayon_check` (1-200), `sos_delai_check` (5-600), leurs phrases, deux cas de refus ; mesuré : 0 ligne hors bornes | §2.3, 3, 6.1-20, -27, 7.1 (2 ter), 8.4-6, sabotage 26 |
| **base 4** — des « 0 » sans « 1 » ; un état partagé entre cas | chaque cas dans son `begin … rollback`, qui construit son état et prouve le positif d'abord ; au §7.2, le « 1 » de R1 dans une transaction annulée | §7.1 (règles, cas 6, 7, 7 bis, 10), 7.2 |
| **base 5** — aucune trace en base du geste « Afficher » | `affiche_le`, posée par le déclencheur, `clock_timestamp()`, une date du client ignorée ; un lecteur (« Affichés depuis le… ») et la CGU | §2.2, 2.4, 4.1, 5.1, 5.9, 6.1-15, -28, 7.1 (3 bis), sabotages 16-17 |
| **base 6** — attendus du rattrapage faux, valeurs perdues sans compte | un seul compteur de ce qui n'est pas arrivé ; attendus 4 / 4 / 1 ; sept lignes SOS, six remises à 0 | §2.2, 7.2 |
| **base 7** — `add column` sans `if not exists` | `if not exists` sur chacune | §2.2, 6.1-24, sabotage 19 |
| **base 8** — la `NOTICE` non éprouvée sur la vraie base | relevé de forme avant et après la migration | §2.2, 8.2-4, -6 |
| **base 10**, **application m19** — deux contrôles de syntaxe | aucun agrégat en mot entier ; colonnes mortes relevées dans `pg_proc` ; aucun `select` JS de ces colonnes | §6.1-25, -30, 7.1 (18, 20), sabotage 28 |
| **base 11** — le cas 19 n'éprouvait que l'`update` | `insert` et `update`, refusés ; un `insert` à 0 accepté | §7.1 (19) |
| **base 12** — l'artisan jetable à Aix, près de deux vrais particuliers | les comptes jetables à Brest (mesuré : 0 compte à 60 km) ; `sos_requests` relue après le ménage | §8.1, 8.3 |
| **application B1** — « Modifier mon profil » éteignait le SOS | `reglageInitialSos`, fonction pure, que le contrôle fait tourner | §4.2, 5.2, 6.1-8, -32, sabotage 48 |
| **application I2** — l'aperçu « Ce que verraient vos clients » toujours vide | la garde `affiche` passe chez les deux appelants publics | §5.4, 6.1-34, sabotages 53-54 |
| **application I3** — « majoration incluse » à 0 % | `majore` exige `pct > 0` ; le bandeau ne parle plus de majoration | §4.2, 5.3, 6.1-1, sabotage 38 |
| **application I4** — un rejet ressemblait à « aucun artisan » | les rejets sont comptés ; tous rejetés → une erreur en français ; l'état vide porte sur la liste visible | §4.4, 5.3, 6.1-30, -31, sabotage 44 |
| **application I6** — la fiche d'un autre gardait ses anciens tarifs | `tarifsAffichesDe`, lue à chaque ouverture, avant la sortie anticipée de `viewProfile` ; `profilProDeSupabase` inchangé | §4.4, 5.5, 6.1-35, 8.4, sabotage 56 |
| **application I7** — deux sources pour sa propre page ; compte de requêtes faux ; lecture pour un particulier | une source, `mesTarifs`, lue dans la branche pro seulement ; `loadAll` reste à 24 | §4.4, 5.4, 5.5, 6.1-30, -35, sabotages 57-58 |
| **application I8** — « Non affichés » pendant une lecture ; lecture fraîche perdue ; `urgence.actif` sans règle | bloc gardé par `'pret'` ; `onTarifs` après toute lecture ; `etatSos` calculé par `etatReglageSos`, et rien d'affirmé si `mesSos` est en échec | §5.1, 5.5, 6.1-33, sabotage 59 |
| **application I9** — la ligne d'état n'était pas un miroir, et ses priorités n'étaient pas écrites | `etatReglageSos`, priorités écrites, partagée par les deux écrans. **Ordre adapté** : « pas encore enregistré » n'est pas un état avant les autres, c'est le **temps** de la phrase « prêt » — sinon un artisan sans tarifs lirait « En enregistrant, vous apparaîtrez » | §4.2, 5.2, 6.1-9, sabotage 49 |
| **application I10** — la démonstration ne montrait aucun état du réglage | la fiche 1 reçoit la ligne orpheline de la vraie base | §4.3, 5.7, 6.1-14 |
| **application I11** — « (conditions sur sa fiche) » ne pouvait rien savoir | branche retirée ; les conditions arrivent par la seconde lecture du SOS (avec le devis et le décompte, relecture droit I7) | §4.2, 4.4, 5.3 |
| **application I12** — `lireTextes`, `SECTION_DU_CHAMP`, les erreurs en ligne, la fausse bande | câblés ; **adapté** : `affiche` sort des `choix` et devient un interrupteur comme `enLiquidation`, ce qui règle `memeEtat` à la racine | §5.1, 6.1-36, sabotages 60-61 |
| **application I13** — trois vérifications de `verifier-emetteur` rougiraient | les trois lignes au tableau, avec leur raison ; `majoration` et `devis` dans `CHOIX_DU_FORMULAIRE` (**pas** `affiche`, voir I12) ; le miroir de `tarif_frais_texte_check` restreint | §4.1, 6.2 |
| **application m15** — « TTC » manquait à deux affichages | ajouté ; la phrase exigée par `verifier-demandes` gardée | §5.5, 5.6, 6.1-38 |
| **application m16** — un champ caché bloquait l'enregistrement | rayon et délai validés seulement interrupteur allumé | §4.2, 5.2, 6.1-10, sabotage 50 |
| **application m17** — une seconde disponibilité s'éteignait sans un mot | `aEteindre` et sa phrase | §4.2, 5.2 |
| **application m18** — « Afficher mes tarifs » n'amenait pas à l'interrupteur | une section 12, ancre `affiche` | §5.1, 5.2 |
| **droit I1** — « la seule option qui rend vraies les deux moitiés » | « Oui, c'est obligatoire » et « Non, il apparaît sans prix » la rendent vraie ; la première recommandée pour sa vraie raison | §0.1, 0.2-1, question 1 |
| **droit I2** — construire sans réponse à une question public/privé | les quatre réponses avant l'étape 2 ; l'étape 1 seule peut partir | en-tête, §9.2 |
| **droit I4** — l'engagement restreint, quatre documents disent le contraire | les quatre documents au §9.3 ; la confirmation dans la question 2. **Réglé autrement le 19/10** : les tarifs affichés ne vont qu'aux particuliers, l'engagement n'est plus restreint, et les quatre documents restent vrais tels quels | §9.3, question 2, §10.1 |
| **droit I5** — un artisan au forfait ne pouvait rien afficher | `tarif_affiche_check` n'exige plus qu'**un** tarif ; la condition « complet » reste dans `artisans_urgence`. **Pas de question** pour cette règle (elle cesse de restreindre le choix de l'artisan) ; les forfaits eux-mêmes deviennent la question 3 | §0.1, 1.2, 1.4, 2.3, 3, 6.1-12, 7.1 (2 bis), sabotage 25, question 3 |
| **droit I6** — la fiche prêtait à l'artisan les heures d'Opus | la fiche ne montre que le pourcentage ; les heures ne vivent que dans l'aide du formulaire, attribuées à Opus ; « déplacement compris » seulement sur la carte SOS, qui est une estimation d'Opus. **Pas de question sur les heures** : elles entrent dans l'option « au choix de l'artisan » de la question 4 | §4.2, 5.1, 5.4, 6.1-6, sabotage 42, question 4 |
| **droit I7** — le prix du devis et le décompte manquaient au moment du choix | seconde lecture publique ; « Devis : … », « Temps : … », « hors prix du devis », « sur des durées moyennes » | §1.2, 4.2, 4.4, 5.3 |
| **droit I8** — la phrase de l'art. 3 | « tout espace en ligne consacré à votre activité, même si votre site les affiche déjà » ; « On ne sait pas encore… » ; plus aucun conseil de « prudence » ; la copie depuis Légifrance demandée à l'étape 0 | §5.1, 6.1-36, 9.2, sabotage 65 |
| **droit I9** — la CGU annonçait un usage de la majoration qui n'existe pas | la majoration ne sert qu'à l'estimation des urgences, et le texte le dit | §5.9, 6.3-5 |
| **droit I10** — les urgences hors de l'export | clé `urgences`, des deux côtés, comme `'devis'` et `'rappels'` | §2.8, 6.1-26, 7.1 (12), sabotage 30 |
| **droit I11** — l'aide SOS ne disait pas que le devis reste dû | « un devis écrit reste dû dès le premier euro » | §5.2, 6.1-32, sabotage 52 |
| **droit m12** — la décision du 18/10 élargie | « des trois règles proposées par le cahier du 0a » | §0.2-3 |
| **droit m13** — aucune acceptation de `2026-10-18` | mesuré et écrit ; la ré-acceptation couvrira les 11 comptes sans version | en-tête, §0.2-4, 9.3 |
| **droit m14** — l'ancienne application, et ses tarifs remis à 0 en silence | **refus** `OP012` au lieu d'une remise à 0 ; vérifié que l'icône « preview » rend les codes `OP` tels quels (passage présent depuis le 16/10) ; le propriétaire est prévenu | §2.7, 2.10, 8.6, 10.2-2, sabotages 32-33 |
| **droit m15** — un SIRET de vraie entreprise fermée possible au §8.3 | « fictifs à clé juste, vérifiés inconnus du répertoire Sirene » | §8.3 |
| **droit m16** — un comptage comparait des prix privés | présences seulement au §8.1 ; la `NOTICE` du rattrapage ne rend qu'un nombre, calculé dans la base | §2.2, 8.1 |
| **droit m17** — deux points de juriste perdus | ajoutés à `A-FAIRE.md` | §9.3 |
| **droit m18** — la nuit jugée à l'heure de la recherche | `majorationSos` : l'heure d'arrivée pour « Tout de suite » ; « +X % si… » pour « Dans la journée » et « Demain » | §0.1, 4.2, 5.3, 6.1-2, sabotage 39 |

### 11.2 Écartés, ou appliqués en partie

1. **Base 9 — « l'essai 46, cas 24 c, lit un 0 sur une table vide ».** **Sans objet**, et pour une raison vérifiée : le cas 24 c n'est plus réécrit. `anon` n'ayant toujours aucun droit sur `tarifs_pro` (base 1), il garde son **ERREUR attendue**, et « permission denied for table » ne dépend pas des données. Le constat était juste pour la version 1.
2. **Application I5 — « élargir le motif de `verifier-etats` à `e\.message\s*\|\|` ».** **En partie.** `SosScreen.js:56` passe par `messageClair`, et `verifier-tarifs` le tient (6.1-31). Le motif, élargi, rougirait aussi sur **huit autres endroits** hors de ce lot (§11.3) : les corriger ici étendrait le lot à six fichiers sans rapport avec les tarifs. Inscrit dans `A-FAIRE.md`, avec la liste.
3. **Application I14 — « « Montant TTC » tranche l'unité des frais du devis » [question proposée].** **En partie, sans question.** Ce lot décide l'unité du **nombre rangé** — TTC, le mot du plan (`PLAN-DEVIS.md:664`), et la seule unité qu'un particulier puisse lire sur une fiche et une carte SOS. Il ne touche pas l'**impression** du devis : `enteteImprime` (`emetteur.js:1266-1275`) écrit « 35,00 € » sans unité, ce qui n'est pas faux, et le lot 2 décidera avec un juriste comment l'imprimer (HT sur une ligne au régime réel ; mention pour un franchisé). Demander au propriétaire de trancher un point de droit fiscal ne serait pas lui rendre service.
4. **Droit I3 — « le dépôt traite exactement ce cas ».** **Appliqué en partie.** Les §5.3 et §5.4 de `DONNEES-DES-ARTISANS.md` sont cités, et « aucun document du dépôt » est retiré. Mais le passage de l'avis 25-A-13 (`:834-838`) vise **les prix proposés par d'autres sur une même demande** ; des tarifs que l'arrêté de 2017 demande d'afficher publiquement n'y sont pas traités, et le cahier le dit plutôt que de lui faire dire plus. Le reste du constat est réglé par la réponse du 19/10 à la question 2 : les tarifs affichés ne vont qu'aux particuliers, et l'avis d'un avocat est un simple rappel de `A-FAIRE.md:1759-1762`, sans rien dans le code (§10.1).
5. **Base 1, droit I5, droit I6 [questions proposées].** **Non posées** : la base 1 est tranchée par la 46.5 et par l'absence de tout écran sans session ; la correction du droit I5 cesse de restreindre le choix de l'artisan, il n'y a plus rien à lui demander ; les heures du droit I6 sont l'option « au choix de l'artisan » de la question 4. Le droit I4 n'est pas une question à part : sa confirmation est dans la question 2.
6. **Les questions 2 à 5 de la version 1, et la question pratique.** L'ancienne question 2 (le contenu de la liste) **se réduit aux forfaits** (question 3) : le reste est déjà dans le plan (« Ses tarifs », `PLAN-DEVIS.md:664`), et chaque colonne a un lecteur. La question 5 (« votre ligne « Électricité », on l'éteint ? ») devient une **information** (§10.2-1) : c'est la règle générale, la ligne est invisible dans les deux cas, et la poser ne change pas le travail. L'ancienne question 3 (tarifs incomplets) est **fondue dans la question 1**, dont l'option « sans prix » la règle aussi. L'ancienne question 4 reste (question 4), élargie aux heures. La question pratique du compte particulier reste au §8.6 et au §10.2-5.

### 11.3 Trouvé en préparant cette version

- **`chargerTout` n'existe pas** : la fonction de démarrage est `loadAll()` (`api.js:583`, relevé par `grep` : 0 occurrence de `chargerTout` dans `src/` et `scripts/`). La version 1 la nommait partout ainsi.
- **Le passage des codes `OP` est dans l'icône « preview »** : `if (/^OP\d{3}$/.test(code) && brut) return brut;` (`erreurs.js:282-283`) est arrivé le 16/10 (commit `23b6742`), la « preview » est du 17/10. C'est ce qui rend le refus `OP012` lisible par l'ancienne version, et ce qui le fait préférer à une contrainte.
- **Les huit endroits que le motif de `verifier-etats` ne voit pas** (forme `e.message ||` dans un `setErreur` ou un `onErreur`) : `FicheAssurance.js:162`, `PlaceProScreen.js:220`, `ProfilEditScreen.js:116`, `:507`, `:520`, `:568`, `CreerScreen.js:145`, `DemandesScreen.js:193` (plus `SosScreen.js:56`, corrigé ici). Certains affichent un message d'Opus déjà en français (le choix d'une image) ; d'autres peuvent afficher l'anglais de la base : à trier.
- **L'option « attendre l'avocat » ne peut pas garder l'ancienne `artisans_urgence`** : une fois les colonnes mortes remises à 0, elle afficherait « 0 – 0 € » pour tous. L'option a été écartée le 19/10 (§10.1).
- **La fiche du compte de démonstration n'a aucun métier d'urgence** (`demo.js:29-30`) : c'est ce qui rendait le réglage SOS invisible sans `.env` ; la ligne orpheline de §4.3 le corrige sans toucher aux métiers.
