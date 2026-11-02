# Le lot S — les cahiers, archivés tels qu'ils ont servi (02/11/2026)

Le lot S (la sécurité, avant le lot 2 du devis) est **terminé le 02/11/2026** :
ses quatre sous-lots sont appliqués sur la vraie base et essayés sur l'iPhone
du propriétaire.

| sous-lot | ce qu'il ferme | appliqué | dans CLAUDE.md |
|---|---|---|---|
| S-a | le stockage, le badge suspendu | 26/10 | « Le stockage et le badge suspendu — lot S-a » |
| S-b | les demandes, le blocage, les partenariats, les réponses | 29/10 | « Les demandes, le blocage, les partenariats, les réponses — lot S-b » |
| S-c | les compteurs, les dates, la remise en avant | 30/10 | « Les compteurs, les dates et la remise en avant — lot S-c » |
| S-d | ce que chacun lit des autres (M1d puis M2) | 02/11 | « Ce que chacun lit des autres — lot S-d » (étapes M1d et M2) |

**Ce document n'est pas la référence.** Ce sont des cahiers de travail : ils
disent ce qui était prévu et pourquoi, au moment où ils ont été écrits. Le
code a changé depuis, par les relectures adverses de chaque sous-lot. En cas
de désaccord, **ce sont les sections de CLAUDE.md et le code qui disent
vrai**. Les chemins `scratchpad/…` qu'ils citent étaient le dossier de
travail des sessions : ils n'existent plus.

Trois cahiers, dans l'ordre :

1. le cahier général du lot S (v2, 25/10), qui découpe le lot en quatre et
   porte les décisions D1 à D7, suivi de ces décisions mot pour mot ;
2. le cahier du sous-lot S-c (v2, 30/10), suivi de ses décisions ;
3. le cahier du sous-lot S-d (v2, 30/10).

Le sous-lot S-a et le sous-lot S-b ont été construits sur le cahier général.

---

# Lot S — cahier v2 (25/10/2026)

Réécrit après la relecture du cahier v1 par quatre critiques (base, écrans,
droit, complétude), soit **76 constats**, presque tous mesurés sur des clones
de `lots_base`. Les rapports :
`scratchpad/lotS/critique-v1/rapport-{base,ecran,droit,completude}.txt` ;
leurs essais : `scratchpad/lotS/critique-v1/<lentille>/`. L'annexe A dit, pour
chaque constat, ce que v2 en fait.

**Ce qui change le plus par rapport à v1 :**
1. **Le lot est découpé en quatre sous-lots** (S-a, S-b, S-c, S-d), chacun
   avec SA migration, SA simulation par empreinte, SES essais, SON accord du
   propriétaire et SON commit. v1 était une transaction d'environ 70 objets sur
   27 tables (compté par la critique « complétude ») : trop gros pour être relu,
   et un seul ordre refusé par le connecteur annulait tout.
2. **R-B est étendue à tout ce qu'une personne bloquée pouvait encore écrire
   sur l'autre** : avis, commentaires, j'aime, abonnements, réponses aux
   annonces. Deux critiques l'ont mesuré séparément (l'avis 1/5 invisible pour
   l'artisan, qui fait tomber sa note).
3. **Les dates se figent aussi à la modification**, pas seulement à la création
   (deux critiques séparément : une demande se re-date en 2099 par un UPDATE).
4. **Une demande ne naît plus « acceptée »** : un particulier insérait sa
   demande au statut `accepte` et obtenait un avis « client vérifié » sans que
   l'artisan ait rien fait (mesuré).
5. **Les textes légaux** : cinq phrases fausses sur Cloudinary (et non une),
   « Bloquer quelqu'un » à réécrire, et quatre sections nouvelles (les avis,
   l'ordre du fil, ce que les autres voient de vous, le badge suspendu).
6. **Six décisions de plus** pour le propriétaire (§0 bis).

Tout ce qui n'a pas changé depuis v1 garde sa forme et ses preuves ; ce
document le redit en entier pour être lu seul.

---

## 0. Les décisions du propriétaire (25/10), mot pour mot

| # | question | réponse |
|---|---|---|
| D1 | Périmètre | « Oui, tout dans le lot S (Recommandé) » — les 4 défauts du 19/10 **et** les trous de triche |
| D2 | Blocage des échanges en cours | « Rien ne disparaît, plus rien de neuf (Recommandé) » — l'artisan garde ce qu'il a reçu (et le téléphone), ne peut plus accepter, répondre ni faire un nouveau devis ; plus aucune notification de la personne bloquée |
| D3 | Ville et code postal d'un PARTICULIER | « Les artisans connectés seulement » |
| D4 | Kbis ou attestation remplacés par un artisan vérifié | « Badge suspendu jusqu'à ta revue (Recommandé) » |
| D5 | Stockage | « Oui, ses photos publiques (Recommandé) » |
| D6 | Nombre de réponses à une demande | « Oui, le nombre seulement (Recommandé) » |
| D7 | « Remettre en tête du fil » | « Gratuit 1×/semaine, payant plus tard (Recommandé) » — « Il remonte VRAIMENT la publication, au plus une fois par semaine. » |
| D8 | Le frère utilise-t-il Opus ? | « Non, pas encore » |

Choix annoncés par défaut, sans objection : partenariats, j'aime et
abonnements plus lisibles sans compte ; une demande reçue ne change que par les
gestes de l'écran ; phrase des CGU sur Cloudinary corrigée maintenant,
effacement réel plus tard ; classe de blancs dans un lot B juste après S.

## 0 bis. Les questions nouvelles (à poser AVANT de construire S-b et S-c)

| # | question | recommandation | sous-lot |
|---|---|---|---|
| Q1 | Après un blocage, la personne bloquée reçoit-elle encore le REFUS de sa demande (ou de son urgence) ? D2 dit « aucune notification **de** la personne bloquée » ; v1 taisait les deux sens. Mesuré : l'artisan bloque, refuse l'urgence, le client attend sans jamais rien savoir (il n'a aucun écran « mes demandes envoyées »). | **Oui** : on ne tait que les notifications que le destinataire reçoit de quelqu'un qu'IL a bloqué (lecture littérale de D2). Un refus envoyé par celui qui bloque passe. | S-b |
| Q2 | Les avis et le blocage : (1) plus aucun NOUVEL avis entre deux personnes bloquées, dans un sens comme dans l'autre ; (2) un artisan lit TOUJOURS les avis qui le concernent, même écrits par quelqu'un qu'il a bloqué (sinon il ne peut ni les voir, ni les signaler, alors qu'ils comptent dans sa note). | **Oui aux deux.** Un avis déjà écrit reste. | S-b |
| Q3 | La remontée gratuite : en plus de « une fois par semaine pour chaque publication », une limite PAR ARTISAN ? Mesuré : jusqu'à 13 publications par auteur, pour une première page de fil de 20 : un seul artisan peut occuper l'ouverture du fil. | **Oui : 3 remontées par artisan et par semaine**, en plus de la règle par publication. Changer la règle plus tard reviendrait à changer une promesse écrite. | S-c |
| Q4 | D4 et le renouvellement annuel de l'assurance décennale : l'artisan honnête qui envoie sa nouvelle attestation perd son badge jusqu'à ta revue, pendant que celui qui garde l'ancienne, expirée, le garde. | **Garder D4 tel quel** (la revue est rapide, la fiche apparaît en tête de ta file), et l'écran le dit avant l'envoi. Variante possible : pour l'assurance seulement, le badge reste mais la fiche entre dans la file. | S-a |
| Q5 | Le nom d'entreprise d'une fiche vérifiée reste modifiable par l'artisan, sans revue : un badge « vérifié » à côté d'un nom choisi librement. | **Plus tard (A-FAIRE)**, avec le SIRET à l'inscription qui fixe déjà l'identité sur les devis ; à trancher si tu préfères que changer le nom suspende aussi le badge. | — |
| Q6 | Les j'aime et les abonnements : lisibles par soi seulement, ou par tous les connectés ? L'écran ne lit jamais que les siens. | **Soi seulement** (le nombre reste public). | S-d |

À présenter aussi, sans question : les **3 fiches vérifiées sans aucun fichier**
sur la vraie base (restes du jeu de démonstration du 14/09) — leur badge sera
suspendu à leur premier envoi, ce qui est cohérent avec D4 ; la **limite de D2
pour les devis** (un blocage ne suit pas une fiche du carnet de clients : un
artisan bloqué peut toujours faire un devis à « Mme X » depuis son carnet, la
base ne sait pas que c'est la même personne) ; l'**avatar d'un compte
disparu**, à retirer maintenant par le tableau de bord.

---

## 1. Les règles transversales, écrites UNE fois

### R-A. « Une colonne que la base tient ne s'écrit pas depuis le client »

Le test est **`current_user in ('authenticated', 'anon')`**, jamais
`auth.uid() is not null` seul (mesuré deux fois : l'essai 49 cas 14 bis et les
recalculs `security definer`). `auth.uid() = new.id` garde son sens en plus pour
« le titulaire lui-même ». Les déclencheurs qui portent R-A sont `security
invoker`.

**Exception, dite** : un déclencheur qui doit voir un blocage posé PAR L'AUTRE
(`tient_le_lien_du_devis`) est `security definer` — sous les droits de
l'artisan, la politique « mes blocages » ne lui montre que SES blocages
(mesuré : le blocage posé par le client était invisible et le devis était
créé). Il ne porte pas R-A : son test ne dépend pas de qui écrit. Aucune
fonction d'aide sur les blocages ne devient appelable par un client.

**Remise silencieuse ou refus ?**
- remise silencieuse pour ce qu'aucune version de l'application n'envoie et qui
  ne trompe personne (compteurs, dates, `email`) ;
- refus avec un code OP et une phrase pour ce que l'application envoie, ou
  enverra un jour (transitions de demande, blocage, clé déplacée, remontée trop
  tôt, **et la trace d'acceptation des CGU** : si le futur lot de
  ré-acceptation l'écrivait par une simple mise à jour, une remise silencieuse
  ferait semblant d'enregistrer une trace légale — critique droit).

### R-B. Le blocage : « clore oui, ouvrir non »

- **rien ne disparaît** de ce qui existait avant le blocage ;
- **plus rien de neuf** entre les deux, **dans les deux sens** : pas
  d'acceptation, pas de réponse (à une demande ni à une annonce), pas de
  nouveau devis rattaché, pas de demande ni d'acceptation de partenariat, pas
  d'avis, pas de commentaire, pas de j'aime, pas d'abonnement ;
- **clore reste permis** : refuser une demande, la marquer terminée, refuser ou
  retirer un partenariat ;
- **les notifications** : selon Q1 (recommandé : taire seulement ce que le
  destinataire reçoit de quelqu'un qu'IL a bloqué) ; **jamais** les
  notifications de l'administration ni celles qui lui sont adressées (liste
  fermée de types — mesuré : l'unique blocage de la vraie base est posé par
  l'administrateur, et `notifie_demande_pro` met le demandeur en `acteur_id`).

**Comment c'est tenu** :
- les politiques d'écriture vérifient que la cible est LISIBLE : la RLS de
  `posts`, `annonces_pro` et `demandes` écarte déjà les personnes masquées, donc
  `post_id in (select id from posts)` (commentaires, j'aime),
  `annonce_id in (select id from annonces_pro)` (réponses aux annonces),
  `demande_id in (select id from demandes where …)` (réponses aux demandes) ;
  `not est_masque(x)` pour les abonnements, les avis et les partenariats ;
  `to authenticated` partout où `est_masque` entre dans une politique (le piège
  documenté : appelée par `anon`, elle fait échouer la requête) ;
- les déclencheurs portent **OP020** là où l'écran a besoin d'une phrase :
  acceptation d'une demande, nouveau lien de devis, demande et acceptation de
  partenariat.

**Les phrases d'OP020 ne nomment jamais un blocage** (critique droit : un
artisan connaît SES blocages ; si on lui dit « bloqué » alors qu'il n'a bloqué
personne, il sait que le client l'a bloqué — un client qui garde peut-être le
besoin de se protéger). Elles disent ce qui reste possible :
- demande : « Vous ne pouvez plus accepter cette demande. Vous pouvez encore la
  refuser ou la marquer terminée. »
- devis : « Vous ne pouvez plus rattacher un nouveau devis à cette demande. Un
  devis déjà commencé reste modifiable. »
- partenariat : « Vous ne pouvez pas proposer ce partenariat. » et « Vous ne
  pouvez plus accepter ce partenariat. Vous pouvez encore le refuser. »
Les refus qui passent par une politique (avis, commentaire, réponse) sortent en
42501 avec la phrase générique d'`erreurs.js` : l'écran ne propose de toute
façon pas ces gestes vers une personne masquée.

**L'écran** : un OP020 reçu ferme la carte sur place pour la session
(« Accepter » retiré, « Refuser » gardé) ; il ne revient pas en arrière vers un
état qui reproposerait le même bouton (critique écrans). `mes_demandes_recues()`
ne change PAS de type de retour (`drop function` refusé par le connecteur,
mesuré).

### R-C. L'ordre du fichier (nouvelle, critique base et complétude)

Une fonction écrite en **langage SQL** est contrôlée à sa création : elle vient
APRÈS chaque colonne, table et fonction qu'elle nomme. Concrètement :
`posts.remonte_le` naît dans la section des publications, avant `fil_filtre`
(section 33) ; `profil_public` (SQL, appelle `est_un_pro`) vient après la
section 44. Le rejeu double sur une base neuve le prouve à chaque sous-lot.

---

## 2. Les codes d'erreur

OP001 à OP018 sont pris (OP003 réservé). Le lot pose :

| code | sens | où | phrase |
|---|---|---|---|
| **OP019** | une demande reçue ne change que par son statut et par les transitions de l'écran | `tient_la_demande()` | fixe, et une variante qui dit l'état réel quand la demande a déjà changé ailleurs (« Cette demande a déjà été acceptée : vous pouvez la marquer terminée. ») |
| **OP020** | action nouvelle refusée sous blocage | demande, devis, partenariat | les quatre phrases de R-B |
| **OP021** | une réponse ne change ni de demande, ni d'annonce, ni d'auteur | `tient_la_reponse()` | fixe |
| **OP022** | remontée refusée | `remonter_publication()` | message SANS date ; l'instant de la prochaine fois part dans le `hint` en ISO ; l'écran le met en forme à l'heure du téléphone, jour ET heure (`dateFrancaise`) : « Vous pourrez la remettre en tête à partir du 01/11/2026 à 21 h 14. » |
| **OP023** | la trace d'acceptation des CGU ne s'écrit que par la base | `tient_le_compte()` | « La version acceptée des conditions ne s'enregistre que par l'écran d'acceptation. » |

`erreurs.js` porte chaque phrase ; le contrôle compare le texte de la base et
celui de l'écran, et pour OP022 un GABARIT (le texte hors date), vérifié dans
trois fuseaux (comme `verifier-tarifs` 49).

---

## 3. Les sous-lots

Chaque sous-lot suit la même suite : schéma et essais en local → application
et textes → contrôles éprouvés en cassant → relectures adverses → migration
construite en PRENANT les objets dans `schema.sql`, simulée sur une imitation
de la vraie base, empreinte comparée → **accord du propriétaire** → application
sur la vraie base → essai par le chemin de l'application avec des comptes
jetables → documentation → commit → push. **L'application d'un sous-lot n'est
poussée qu'APRÈS sa migration appliquée et relevée** (critique complétude : un
`git pull` trop tôt affichait « 0 réponse » partout et une fiche publique en
échec, sans erreur).

### S-a. Le stockage et le badge (prérequis du lot 2)

**S1 — le stockage (D5)**, inchangé depuis v1 dans son principe :
```sql
alter policy "remplacement de mes fichiers" on storage.objects
  to authenticated using (false) with check (false);
alter policy "suppression de mes fichiers" on storage.objects
  to authenticated
  using (bucket_id in ('avatars','bannieres','publications')
         and (storage.foldername(name))[1] = auth.uid()::text);
alter policy "lecture publique des medias" on storage.objects
  using (bucket_id in ('avatars','bannieres','publications')
         and (storage.foldername(name))[1] = auth.uid()::text);
```
- Application : `upsert: false`, sans `x-upsert` ; **la phrase du 409 vit AVANT
  la branche 23505 d'`erreurs.js`** (sinon un fichier en double répond « cet
  enregistrement… depuis un autre appareil », mesuré), reconnue par « resource
  already exists » et le statut 409 ;
- le prélude local imite la production (`storage.foldername`, index unique
  `(bucket_id, name)`) ;
- **repli si le connecteur refuse `alter policy … on storage.objects`**
  (jamais essayé) : le texte exact est remis au propriétaire pour l'éditeur SQL,
  sans être recopié à la main ;
- gestes du propriétaire : couper le protocole S3 ; retirer l'avatar du compte
  disparu ; plus tard, les 33 fichiers orphelins.

**S2 — le badge suspendu (D4)**, dans `tient_le_profil_pro()`, branche UPDATE
titulaire, après la remise des colonnes de vérification :
- **la règle porte sur la PIÈCE VALIDÉE** : une pièce validée dont le chemin
  change — **y compris depuis vide** — est suspendue (`kbis_url` →
  `kbis_valide := false`, `kbis_maj := null` ; `assurance_url` →
  `assurance_valide := false`, `assurance_expire := null`). Mesuré : 3 fiches de
  la vraie base sont « vérifiées » sans aucun fichier ;
- si une pièce a été suspendue : `verifie := false`, `verifie_le := null`,
  **`badge_suspendu_le := clock_timestamp()`** (colonne nouvelle), et le statut
  suit la règle de `synchronise_verification` (`en_attente` s'il reste un
  chemin, `non_soumis` sinon — mesuré : un Kbis retiré sortait « en attente »
  sans aucune pièce) ;
- **le verrou des métiers tient pendant la suspension** (critique écrans,
  mesuré : sans cela, l'artisan suspendu change de métier librement, et la
  revalidation de la pièce lui rend le badge avec un métier jamais contrôlé —
  un « avocat » qui devient « maçon » sans décennale) : `tient_les_metiers`
  refuse si `old.verifie or old.badge_suspendu_le is not null` ;
- `badge_suspendu_le` revient à vide quand le badge est rendu
  (`synchronise_verification`) ou refusé (`admin_refuser_pro`), et le titulaire
  ne l'écrit pas (`tient_le_profil_pro` la remet) ;
- une **notification** posée par la base au moment de la suspension (« Votre
  badge est suspendu le temps que l'administration examine votre nouvelle
  pièce. ») ; nouveau type `verification_suspendue`, qui mène au profil ;
- la file `admin_file_verifications` montre « badge suspendu » ;
- le RGE n'est pas touché (défaut antérieur, A-FAIRE : un pro vérifié qui
  envoie son RGE n'est jamais revu).

Écran : avant l'envoi d'une pièce d'existence ou d'assurance par un pro dont le
badge est accordé — **jamais pour un envoi RGE seul** — « Envoyer une nouvelle
pièce suspend votre badge jusqu'à ce que l'administration l'ait regardée. » ;
après l'envoi, l'état local suit (`verifie: false`, la pièce à `valide: false`),
pour ne pas afficher « À jour » à côté de « En attente » ; le statut
`en_attente` n'est envoyé que pour une pièce d'existence ou d'assurance ;
« Modifier mon profil » garde le sélecteur de métiers verrouillé pendant la
suspension.

Textes : CGU « Le badge vérifié » et politique « Une décision automatique… »
(les phrases du rapport droit, constat 9) ; la phrase sur le renouvellement
dépend de Q4.

### S-b. Les demandes, le blocage, les partenariats, les réponses

**S6 — les demandes reçues** : `tient_la_demande()` (R-A, BEFORE UPDATE sur les
trois tables) — tout figé sauf le statut, transitions exactement celles de
l'écran, OP019 ; OP020 sur l'acceptation sous blocage. **Et à la création** :
« creation devis » et « creation rappel » exigent `statut = 'en_attente'`,
« creation sos » `statut = 'envoyee'` (mesuré : sans cela, un particulier
insérait sa demande « acceptée » et obtenait « client vérifié » ; corrigé, les
27 essais restent identiques).

**Le lien de devis** : `tient_le_lien_du_devis()` en **security definer** (R-A,
exception), BEFORE INSERT OR UPDATE OF `quote_request_id`, `sos_request_id` :
un nouveau lien vers la demande d'une personne en blocage avec `devis.pro_id`
(dans un sens ou dans l'autre) → OP020 ; un lien déjà posé reste ; une cascade
met le lien à vide et n'est pas concernée. Écran : la vérification se fait à
l'appui sur « Faire un devis » / « Nouveau devis », AVANT d'ouvrir la saisie ;
un OP020 (ou OP013) sur l'insertion du devis est définitif — pas de
« Réessayer », une phrase qui dit quoi faire ; la démonstration refuse pareil.

**Le silence des notifications** : `tait_les_notifications_bloquees()`
(definer, BEFORE INSERT sur `notifications`, `return null`), selon Q1, avec la
liste fermée des types d'administration jamais tus. Mesuré : aucune des dix
fonctions qui écrivent une notification n'utilise RETURNING, FOUND ou
ROW_COUNT ; les cinq `notifie_*` posent `acteur_id`, les cinq `admin_*` non.
L'essai 51 énumère les types tus et ceux qui ne le sont pas. La phrase de v1
« toutes les notifications sont écrites par des fonctions de la base » était
fausse (un client écrit dans SA cloche) : retirée.

Écran : « Le client est prévenu » ne s'affiche que quand c'est vrai (bandeau
générique « Demande refusée. » si la notification peut être tue) ; après OP019,
on relit « Pour moi » au lieu de revenir à l'état d'avant ; un OP020 ferme la
carte (R-B).

**S6 bis — R-B étendue (mesuré par deux critiques)** : avis, commentaires,
j'aime, abonnements, réponses aux annonces — les politiques d'écriture de R-B.
Et selon Q2 : « lecture reviews » `using (not est_masque(author_id) or
professional_id = auth.uid())` — l'artisan lit les avis qui le concernent.

**S3 — les partenariats** : l'option B du rapport, ajustée :
1. « lecture partenaires » (anon) `using (false)` + `revoke all … from anon` ;
2. « lecture partenariats » to authenticated : les deux parties lisent tout ce
   qui les concerne ; un tiers lit un partenariat accepté si aucune des deux
   parties ne lui est masquée ;
3. « je demande » with check (… `statut = 'en_attente'` et `not
   est_masque(partner_id)`) **et OP020 levé AVANT par `tient_le_partenariat`
   dès l'INSERT** (mesuré : un BEFORE ROW lève avant le with check à
   l'insertion) ;
4. « je reponds » using (`partner_id = moi` et `en_attente`) ; à l'UPDATE, la
   clause USING filtre AVANT le déclencheur : accepter une demande déjà refusée
   rend « 0 ligne », sans erreur (l'écran ne le propose pas) ;
5. « je romps » : le demandeur ne supprime plus un refus ;
6. droits de colonne (`repondu_le` GARDÉ au droit UPDATE : l'application
   l'envoie, le déclencheur pose la vraie date) ; une clé changée répond 42501
   (OP021 y est inatteignable, il reste en seconde ligne) ;
7. défaut `statut = 'en_attente'` ;
8. `tient_le_partenariat()` : dates, OP020, `repondu_le` ;
9. « vous propose un partenariat » au plus une fois par paire et par 24 h.
Les politiques déménagent après `est_masque` (section 13.1), « lecture
partenaires » n'est créée qu'à un endroit. Écran : les candidats écartent
toute paire qui a déjà une ligne, quel que soit son statut ; les deux 23505
reçoivent une phrase qui ne laisse pas croire à une demande en attente.

**S4 — les réponses aux demandes, la partie M1** : `demandes.nb_reponses`, son
déclencheur definer, sa garde R-A, son rattrapage qui RECALCULE ;
`tient_la_reponse()` (clés figées, OP021) sur `demande_reponses` et
`annonce_reponses` ; « mes reponses » : seulement à une demande ouverte,
lisible, et pas la sienne ; « lecture reponses visiteur » `using (false)` +
`revoke all … from anon`. La fermeture de « lecture reponses » aux connectés
est dans S-d (M2).

Écran (dans S-b) : `api.js` lit `d.nb_reponses` (et affiche « — » si la
colonne manque, au lieu de « 0 ») ; la requête sans filtre disparaît ;
`repondreADemande` est appelé à chaque « Répondre », même si la conversation
existe, son refus est affiché, et le compteur local ne monte qu'après un
succès (mesuré : l'erreur était avalée et l'écran disait « Vous avez
répondu »).

Textes de S-b : « Bloquer quelqu'un » réécrit (la phrase du rapport droit,
constat 3, ajustée à Q1) ; une section « Les avis » (ce que veut dire « client
vérifié » : une demande de devis, de rappel ou d'urgence ACCEPTÉE par
l'artisan, rien de plus ; les autres avis ne sont pas contrôlés ; le
professionnel peut signaler un avis) ; « Combien de temps » : une demande de
partenariat refusée reste enregistrée tant que les deux comptes existent, pour
ne pas être renvoyée en boucle (intérêt légitime).

### S-c. La triche sur les compteurs et les dates, la remontée

**O1 — la réputation** (déclencheur à part de `tient_le_profil_pro`) :
`avis_count`, les trois notes, `followers_count`, `created_at`.
**O2** : `revoke update` sur `post_likes` et `follows`.
**O3 — à la création** : `posts` (compteurs à 0, `remonte_le` vide, **et
`is_ad := false`, `annonceur`, `accroche`, `cta` à vide** — mesuré : un artisan
se faisait passer pour une publicité et entrait dans le fil « Abonnements » de
tout le monde) ; `annonces_pro.nb_reponses` ; `chantiers` (`nb_publications`,
`couverture`, `debut`, `fin`).

**T1 — les dates, à la création ET à la modification** : `pose_la_date()`
(R-A), BEFORE INSERT OR UPDATE : `now()` à l'insertion, `old.created_at` en
modification. **Un seul propriétaire par table** :
- la liste est CALCULÉE depuis le catalogue (`created_at` inscriptible par le
  client et une politique d'insertion ou de modification) et le contrôle refuse
  toute table qui n'est ni dans la liste ni exclue avec sa raison ;
- `tient_le_partenariat` et `tient_la_reponse` ne posent PAS la date
  (`pose_la_date` est son seul propriétaire) ;
- les trois demandes reçues : `pose_la_date` à l'insertion seulement — à la
  modification, OP019 doit refuser un `created_at` changé, pas le remettre en
  silence ;
- exclues, avec leur raison : `post_vues` (défaut `clock_timestamp()`, n'écrit
  que ses propres vues), `devis`, `base_postes`, `emetteur_assurances` (leur
  déclencheur pose déjà la date — à vérifier dans l'essai), `clients` (privé,
  ne trompe que soi — à confirmer par la critique de S-c) ;
- posts et commentaires : `tient_le_texte` gèle déjà la date en modification,
  `pose_la_date` la pose à l'insertion.

**Le compte** : `tient_le_compte()` BEFORE INSERT OR UPDATE — à l'insertion par
le client (la seconde porte de la section 44 : ligne recréée après
`preparer_suppression_compte`), `cgu_version` et `cgu_acceptees_le` à vide,
`created_at := now()`, `email := null` ; en modification, OP023 pour les CGU,
remise silencieuse pour `created_at` et `email`.

**`tient_le_texte()`** reçoit R-A en plus de son test actuel (sinon
`remonter_publication`, definer mais avec `auth.uid()` = l'auteur, verrait sa
date remise — c'est ce qui fait échouer le bouton d'aujourd'hui).

**S8 — la remontée (D7, Q3)** :
- `posts.remonte_le` (dans la section des publications, R-C) ;
- **`idx_posts_fil_remonte` sur `((coalesce(remonte_le, created_at)) desc, id
  desc)`** (mesuré : sans lui, un parcours complet et `est_masque` sur chaque
  ligne, 1,1 s sur 100 000 publications contre moins de 10 ms ; avec, 0,2 à
  6 ms) ; `idx_posts_fil` reste (portfolio, conseils) ;
- `remonter_publication(p_id)` (definer, `clock_timestamp()`) : l'auteur seul,
  pas une publicité, 7 jours depuis la dernière remontée ou la publication, et
  selon Q3 au plus N par artisan sur 7 jours glissants ; OP022 avec l'instant
  dans le `hint` ;
- `fil_filtre` : même signature, tri et curseur par la clé de remontée ; tant
  que personne n'a remonté, ordre identique à aujourd'hui ;
- **défaut ancien gardé, et dit** : le curseur `p_avant` est strict sur une
  seule clé, sans `id` ; trois publications de même date perdent la troisième
  en page 2 (mesuré). La signature ne peut pas changer ; une vraie correction
  demanderait une nouvelle fonction (A-FAIRE). La remontée, en
  `clock_timestamp()`, ne crée pas d'égalité.

Écran (critique écrans, mesuré : 20 publications sur 40 perdues sinon) : la clé
de pagination change à TROIS endroits — `rowToPost.curseur = remonte_le ||
created_at` (chaîne d'origine, jamais repassée par `new Date`), `decouperPage`
(une fonction `cleDeTri` dans `page-fil.js`, qui n'importe rien) et la
simulation de `verifier-fil` (qui rejoue une publication remontée à la
jonction) ; **« Mes publications » lit SES publications** (requête paginée,
sans le filtre du fil — aujourd'hui il ne voit que ce que le fil a chargé, donc
jamais les anciennes publications, justement celles qui ont besoin de
remonter) ; après une remontée, on recharge la première page au lieu
d'insérer la carte à la main ; la carte garde sa date de publication (plus de
« À l'instant ») ; le bouton a un rôle, une étiquette, et affiche la date de la
dernière remontée ; la démonstration applique la règle et OP022.

Textes de S-c : une section « L'ordre du fil » (de la plus récente à la plus
ancienne, la remontée gratuite et sa règle, aucun paiement ne change
aujourd'hui le classement, les publicités portent « Sponsorisé ») ; A-FAIRE
reçoit les prérequis du payant (L. 111-7, règlement 2019/1150, mention
« Sponsorisé » sur chaque publication remontée contre paiement, historique des
remontées : une seule colonne ne dit pas laquelle a été payée).

### S-d. Les lectures, les droits, l'export

**S5 — `users` (D3)**, en trois temps :
- **M1d** : `profil_public(p_id)` (SQL, definer, après la section 44 — R-C) :
  `id, nom, avatar_url, type`, et `ville` seulement si `p_id = auth.uid()` ou
  (`est_un_pro()` **et `not est_masque(p_id)`** — mesuré : sinon l'artisan
  bloqué lit toujours la ville) ; anon ne lit plus rien de `users` ;
- **A-d** : `chargerProfilPublic` → `rpc('profil_public')` ; **« Voir le
  profil » d'un client dans « Pour moi » ouvre enfin la fiche d'un
  particulier** (aujourd'hui il passe par la page PRO et affiche un écran vide :
  c'est pourtant la seule raison d'être de D3) ;
- **M2** : `revoke select (ville, code_postal, avatar_seed, created_at,
  cgu_version, cgu_acceptees_le) … from authenticated`. Condition : le
  propriétaire a fait `git pull` PUIS `npx expo start -c`, et les journaux
  PostgREST le montrent (`rpc/profil_public` présent, plus de lecture de
  `users.ville`, agent Expo/CFNetwork). Essai après M2 : un particulier
  enregistre son profil et ses coordonnées → 204 (`return=minimal`).
Dans `schema.sql`, la boucle de 18.1 devient une liste blanche par rôle.

**S4 — la fermeture de « lecture reponses »** (M2, même condition) : l'auteur
de la demande et le pro qui a répondu ; l'auteur garde la lecture des réponses
d'un pro qu'il a bloqué (rien ne disparaît).

**Q6 — j'aime et abonnements** : lisibles par soi seulement (recommandé) ou par
les connectés ; une section de l'essai et une vérification de
`verifier-moderation` dans les deux cas.

**S9 — les droits de table hors RLS** : le balayage (TRUNCATE, REFERENCES,
TRIGGER ; MAINTAIN seulement si PG 17) et `alter default privileges for role
postgres`. Mesuré sur PG 16 : juste pour `postgres` ; une table créée par un
autre propriétaire (imitation de `supabase_admin`) garde TRUNCATE — dit, et
dans A-FAIRE. Les deux ordres « supposés » pour le connecteur (`alter default
privileges`, `revoke maintain`) sont envoyés à part, pour qu'un refus n'annule
pas le reste.

**S10 — l'export RGPD, UNE réécriture**, prise dans `schema.sql`, dernière
fonction du fichier. Clés, chacune avec son filtre :
`mes_j_aime`, `publications_enregistrees`, `partenariats` (les deux sens),
`reponses_que_j_ai_ecrites` (demandes et annonces, `professional_id = moi`),
`reponses_recues_a_mes_demandes`, `reponses_recues_a_mes_annonces`,
`mes_demandes_de_metier`, `mes_specialites_proposees`, `mes_notifications`,
`messages_recus` (conversations où je suis partie, envoyés par l'autre),
`decisions_de_l_administration` (action, date, motif, **sans** l'identité de
l'administrateur).
**Règle écrite en tête de la fonction et tenue par l'essai** : l'export rend ce
que la personne peut déjà lire sur elle dans Opus, et rien de ce que la base
lui cache — jamais les blocages subis, jamais les signalements visant ses
contenus, jamais qui l'aime ou la suit, jamais l'identité d'un administrateur.

**Avant `mes_notifications`, les noms des comptes partis** (critique droit,
mesuré) : le texte d'une notification porte le nom de son acteur, et
`acteur_id` est `on delete set null` — le nom d'un compte supprimé restait
écrit chez les autres et serait exporté. La notification part avec son acteur
(`acteur_id` en `on delete cascade` ; `alter table … drop constraint if exists`
passe par le connecteur, mesuré le 03/10). Les notifications d'administration
n'ont pas d'acteur et ne sont pas touchées. 0 cas sur la vraie base
aujourd'hui.

**Hygiène** : « proposer une specialite » exige `statut = 'en_attente'`
(mesuré : une spécialité s'insérait directement « ajoutée » et sautait la
file) ; les politiques créées deux fois que le lot touche n'ont plus qu'une
création ; les **neuf** autres (et non sept) vont dans A-FAIRE, nommées.

Textes de S-d (publiés avec M2, le même jour, parce qu'ils décrivent M2) :
une section « Ce que les autres voient de vous » (phrase du rapport droit,
constat 7, ajustée à Q6) ; sous le champ « Ville » d'un particulier : « Elle ne
s'affiche qu'aux professionnels connectés, sur votre profil. » ; la liste de ce
qui est collecté complétée (j'aime, abonnements, enregistrements, vues,
blocages, signalements, partenariats, réponses, notifications) ; « tout ce que
nous avons » remplacé par « les données qu'Opus conserve à votre sujet dans sa
base ; vos photos et vidéos y figurent par leur adresse » ; la phrase
« Sécurité » (« une version modifiée de l'application ne permettrait pas d'y
accéder davantage ») remplacée par celle du rapport droit, constat 14.

### Les textes Cloudinary (dans S-a, parce qu'ils sont faux aujourd'hui)

Cinq passages, et non un : « Fermer son compte » (`legal.js:812`), « Combien de
temps » (1227-1229), « À qui vos données sont transmises » (« transitent » →
« hébergent »), « Où vos données sont hébergées » (les vidéos sont chez
Cloudinary, pays à relever par le propriétaire dans sa console), « Propriété
intellectuelle » (supprimer une publication ne retire pas ses fichiers), et
l'**écran de suppression de compte** (`ConfidentialiteScreen.js:367-369`). La
vérité est écrite UNE fois, dans une constante exportée de `legal.js`
(`CE_QUI_RESTE_EN_LIGNE`), avec **`parEcrit()`** (et non `ligneContact()`, qui
glisse « Contact : … » au milieu d'une phrase et laisse croire qu'un moyen
existe) : sans adresse, la phrase dit qu'aucun moyen n'existe encore et que
c'est à corriger avant l'ouverture au public. `verifier-legal` exige la
constante dans `legal.js` ET dans l'écran, refuse « effacé(e)s » sans elle tant
que la fonction `compte` ne touche pas Cloudinary, refuse « transit » à côté de
« Cloudinary », et un drapeau humain `EFFACEMENT_CLOUDINARY` bloque la sortie de
`STATUT = 'essai'`.

---

## 4. Ce qui n'est PAS dans le lot S (A-FAIRE, avec leur source)

- la classe de blancs (CB4) et la famille 46 — **lot B, juste après S** ;
- `verification_note` lisible sans compte (prérequis de la mise en ligne) ;
  types de fichiers des espaces publics ; effacement réel chez Cloudinary ;
  statuts `fermee`/`pourvue` (section 30) ; un pro qui publie une demande ;
  le RGE d'un pro vérifié jamais revu ;
- l'écran des partenariats (annuler, retirer, refus visible) ;
- pagination du ménage de compte au-delà de 1 000 fichiers ; la fonction
  `compte` appelée sans `preparer_suppression_compte()` ;
- les pièces jointes de l'AUTRE participant, orphelines quand un compte part ;
  retirer soi-même un justificatif envoyé par erreur ;
- l'avis « client vérifié » perdu quand son auteur part (à mesurer) ;
- la fonction `cloudinary` qui rend les NOMS des secrets quand la configuration
  manque ;
- la vitrine sans compte incohérente (commentaire lisible, nom de l'auteur non)
  avant la page web du QR professionnel ;
- un index `demandes(client_id)` pour la nouvelle politique « lecture
  reponses » (à mesurer avec beaucoup de demandes) ;
- les privilèges par défaut de `supabase_admin` (S9 ne les touche pas) ;
- S1-C (retirer TEMPORARY) écarté : non mesuré, droit de base géré par
  Supabase ;
- le curseur de `fil_filtre` sans `id` (égalités) ;
- les neuf politiques créées deux fois que le lot ne touche pas ;
- `adresseTemporaire()` sans appelant ;
- la remontée payante et ses prérequis ;
- la mise au privé des photos de demande et d'annonce (R24) ;
- la seconde moitié de R29 (un connecté liste tous les comptes) ;
- Q5 si le propriétaire choisit « plus tard » ;
- la réponse de l'administration à quelqu'un qui l'a bloquée (la messagerie ne
  le permet plus, alors que la politique promet une réponse « par la
  messagerie ») ;
- les trois politiques mortes laissées par le connecteur sur la vraie base
  (`remplacement de mes fichiers`, `lecture partenaires`, `lecture reponses
  visiteur`, toutes `using (false)`) : à retirer par le propriétaire dans
  l'éditeur SQL (A-FAIRE §1.0, comme `entreprise_registre.gele`).

---

## 5. Les phases, sous-lot par sous-lot

Le téléphone du propriétaire porte le build de développement ; le code
JavaScript vient de Metro ; aucun module natif dans ce lot ; le frère n'utilise
pas Opus. L'ordre, pour chaque sous-lot :

1. migration appliquée (accord) et relevée ;
2. **puis seulement** l'application poussée, le message de commit le dit ;
3. pour S-d : `git pull` + `npx expo start -c` par le propriétaire, constat
   dans les journaux, puis M2 et ses textes le même jour.

| sous-lot | migration | compatible avec l'application d'avant ? | application |
|---|---|---|---|
| S-a | 3 `alter policy` du stockage ; `tient_le_profil_pro`, `tient_les_metiers`, `synchronise_verification`, `admin_refuser_pro`, `admin_file_verifications` ; colonne `badge_suspendu_le` ; type de notification | oui (chemins neufs ; l'écran n'envoie que des chemins) | sans upsert, phrase 409, avertissement et état local du badge, métiers verrouillés pendant la suspension, textes Cloudinary et badge |
| S-b | `tient_la_demande`, statuts à la création, `tient_le_lien_du_devis`, silence des notifications, politiques R-B, avis lisibles par l'artisan, partenariats, compteur des réponses et `tient_la_reponse` | oui (seul le statut est envoyé ; chemins d'écriture inchangés) | OP019/OP020, carte fermée, devis vérifié avant la saisie, « prévenu » vrai, `nb_reponses`, `repondreADemande` honnête, candidats partenaires, textes « Bloquer », « Les avis », « Combien de temps » |
| S-c | compteurs, dates INSERT+UPDATE, publicité forgée, `tient_le_compte`, `tient_le_texte`, `remonte_le`, index, `remonter_publication`, `fil_filtre` | oui (personne n'a de `remonte_le` ; l'application n'envoie ni compteur ni date) | la remontée, la pagination aux trois endroits, « Mes publications » propre, texte « L'ordre du fil » |
| S-d | `profil_public`, anon fermé sur `users`, j'aime et abonnements, balayage S9 (et ses deux ordres supposés à part), `mes_donnees`, acteur en cascade, spécialités | oui | `profil_public`, « Voir le profil » d'un client |
| M2 | colonnes de `users` fermées aux connectés ; « lecture reponses » fermée | **non** : il faut A-d et A-b sur le téléphone | textes « Ce que les autres voient de vous », publiés le même jour |

**La migration de chaque sous-lot** est construite en prenant les objets dans
`schema.sql` à SON commit ; aucun ordre ne commence par `drop`, `delete` ou
`truncate` ; chaque nouvelle fonction de déclencheur porte son propre `revoke
execute … from public, anon, authenticated` ; `lock_timeout 5s` ; les verrous
des tables les plus lues (`posts`, `storage.objects`) sont pris en dernier ; la
simulation part d'une imitation de la vraie base (le `schema.sql` du commit
précédent) et l'empreinte obtenue est comparée à une base neuve au `schema.sql`
du sous-lot — **sauf pour S-d, dont l'état M1 diffère de `schema.sql` final sur
une liste FERMÉE d'objets** (la boucle 18.1 pour `authenticated`, « lecture
reponses »), contrôlée ; deux empreintes attendues : M1d, puis M2. Les restes
attendus sur la vraie base (politiques mortes) sont listés d'avance.

---

## 6. Les données de production touchées

Aucune donnée récrite, sauf des compteurs recalculés (`demandes.nb_reponses`,
1 réponse). La valeur par défaut de `professional_partners.statut` change. Les
5 écarts d'abonnés (jeu de démonstration du 14/09) ne sont pas corrigés et sont
présentés au propriétaire. La paire bloquée qui a une demande de partenariat
en attente reste telle quelle (R-B) ; son acceptation sera refusée. **Les 3
fiches vérifiées sans fichier** (démonstration du 14/09, aucune connexion
depuis 30 jours) verront leur badge suspendu à leur premier envoi.

---

## 7. Comment on vérifie

### 7.1 Essais SQL

Un fichier par sous-lot (`essais-section-51a.sql` … `51d`), chacun joué deux
fois sur une base neuve, `set local role` hors de tout bloc `do`, un cas 0 qui
prouve la donnée, chaque refus rattaché à son annonce. En plus de la couverture
de v1, les cas trouvés par la critique : le blocage posé PAR LE CLIENT (lien de
devis) ; une demande insérée « acceptée » ; un avis, un commentaire, un j'aime,
un abonnement, une réponse à une annonce sous blocage, dans les deux sens ; un
avis antérieur au blocage lisible par l'artisan (Q2) ; la date re-écrite par
une modification ; la publicité forgée ; la ligne `users` recréée ;
`badge_suspendu_le` et le verrou des métiers pendant la suspension ; la fiche
« vérifiée sans fichier » à son premier envoi ; le Kbis retiré → `non_soumis` ;
la notification d'administration jamais tue ; la liste des types tus ; le plan
de `fil_filtre` sur un jeu gonflé, qui doit nommer `idx_posts_fil_remonte` ;
des égalités de clé de tri, résultat attendu écrit ; une notification qui part
avec son acteur ; l'export d'un compte bloqué, sans trace du blocage.

**Les 27 autres fichiers** rejoués à chaque sous-lot et comparés au relevé
d'avant (`scratchpad/lotS/avant/essais/`, pris le 25/10 sur `e9b6e27`). Écarts
attendus à la fin du lot, mesurés par la critique : essai 43, 39 → 51 ou 52
fonctions de déclencheur (le nombre exact une fois les fonctions arrêtées) ;
essai 49, 27b 24 → 26, 27c 27 → 30, **27f et la section 31** (le déclencheur
de plus sur `devis`, avec sa raison) ; essai 50 13i 26 | 30 ;
`essais-suppression-compte` (anon ne lit plus le nom) ; identifiants et heures
dans 36, 38, 39, 45.

### 7.2 Contrôles

Comme v1 (nouveaux `verifier-stockage` et `verifier-partenariats` ;
`verifier-demandes`, `verifier-compte`, `verifier-portes`, `verifier-place`,
`verifier-fil`, `verifier-moderation`, `verifier-legal`, `verifier-devis`
étendus), plus :
- `verifier-stockage` voit aussi le chemin HTTP direct du téléphone (toute
  adresse `/storage/v1/object` appelée en POST, jamais vers move ou copy) ;
- `verifier-demandes` : statut initial exigé à la création ; aucun « prévenu »
  affirmé sur un chemin où la notification peut être tue ; aucun `catch` vide
  autour de `repondreADemande` ;
- `verifier-moderation` : R-B sur les cinq écritures ; les phrases d'OP020 ne
  contiennent ni « bloqu » ni « masqu » ; la liste fermée des notifications
  d'administration jamais tues ;
- `verifier-fil` : la clé de tri aux trois endroits, pagination rejouée avec
  une publication remontée à la jonction ;
- `verifier-portes` : la liste de `pose_la_date` calculée et comparée ; R-C
  (une fonction SQL après ce qu'elle nomme) au moins pour `fil_filtre` et
  `profil_public` ;
- `verifier-legal` : la constante Cloudinary, « Bloquer quelqu'un », « Les
  avis », « L'ordre du fil », « Ce que les autres voient de vous », chaque clé
  de `mes_donnees` nommée dans la liste de ce qui est collecté ;
- **la démonstration fait vivre chaque mécanisme** (critique écrans) : la
  remontée et OP022, `profil_public` (ville si l'utilisateur est pro), les
  transitions et OP020 dans `repondreDemandeDemo` avec les blocages de
  démonstration, les partenariats ; un contrôle le vérifie.
Chaque contrôle est éprouvé en cassant ce qu'il surveille.

### 7.3 Sur la vraie base et sur l'iPhone

Comme v1, sous-lot par sous-lot, avec en plus : prouver R1 par une vraie
écriture AVANT S-a (accord) ; « Voir le profil » d'un client vu par un pro
(ville) et par un particulier ; un particulier qui enregistre son profil après
M2 ; compter les 401 et 403 dans les journaux après chaque migration.

---

## Annexe A — les 76 constats et ce que v2 en fait

**Base (18)** — lien de devis aveugle au blocage du client → R-A exception,
definer, S-b · dates en modification → T1 INSERT+UPDATE · publicité forgée →
O3 · notification d'administration tue → R-B, liste fermée · « premier envoi ne
change rien » faux → S2 sur la pièce validée, §6 · index perdu → S8 ·
`remonte_le` après `fil_filtre` → R-C · OP020 par politique → R-B (déclencheur
à l'insertion des partenariats, 42501 ailleurs) · avis du bloqué → S6 bis, Q2 ·
`users` recréée → `tient_le_compte` INSERT · ville au pro bloqué →
`profil_public` · Kbis retiré → `non_soumis` · égalités de pagination → S8,
dit · écarts d'essais → §7.1 · corrections jouées ensemble sans casse → gardé ·
`return null` sans casse → gardé, liste dans l'essai · S9 sur PG 16 → gardé,
exception dite · nom d'entreprise libre → Q5.

**Écrans (20)** — métiers déverrouillés pendant la suspension →
`badge_suspendu_le` · pagination aux trois endroits → S8 · « Mes publications »
→ S8 · « prévenu » faux → S6 · « Accepter » qui échoue → R-B · devis refusé
après la première ligne → S6 · `repondreADemande` avalé → S4 · OP022 et le
fuseau → §2 · aucun refus en démonstration → §7.2 · « Voir le profil » vide →
S5 · état local après l'envoi, fiches sans pièce → S2 · trois passages
Cloudinary → textes · carnet qui contourne D2 → §0 bis · 409 avalé par la
branche 23505 → S1 · OP020 par politique → R-B · `republierPublication` → S8 ·
OP019 et l'état périmé → §2, S6 · candidats partenaires → S3 · chemin HTTP du
stockage → §7.2 · condition de M2 (`-c`, profil d'un particulier) → S5, §5.

**Droit (19)** — cinq phrases Cloudinary → textes · `ligneContact()` →
`parEcrit()` · « Bloquer quelqu'un » → S-b · silence au-delà de D2 → Q1 ·
administration tue → R-B · avis du bloqué → Q2 · noms dans les notifications
→ S10 · export incomplet et sans règle → S10 · OP020 qui trahit le blocage →
R-B · phrases de visibilité → S-d · « client vérifié » non défini → « Les
avis » · suspension non annoncée, renouvellement → S2, Q4 · ordre du fil →
« L'ordre du fil » · OP022 et la date → §2 · « Sécurité » → S-d · partenariat
refusé gardé → S-b · textes en avance sur M2 → §5 · CGU figées en silence →
OP023 · « ce que nous collectons » → S-d.

**Complétude (19)** — demande insérée « acceptée » → S6 · le bloqué écrit sur
le bloqueur → S6 bis · réponses aux annonces → R-B · dates en modification →
T1 · ordre de `fil_filtre` → R-C · M1 hors de `schema.sql` → §5 (liste fermée,
deux empreintes) · A avant M1 → §5 · écarts de l'essai 49 → §7.1 · lien de
devis contradictoire → R-A exception · index → S8 · `users` recréée →
`tient_le_compte` · date posée deux fois, `post_vues` → T1 · politiques en
double (9) → S-d, §4 · fiches sans fichier → §6 · j'aime et abonnements au-delà
de l'annonce → Q6 · dix défauts sans destination → §4 · lot trop gros →
sous-lots · restes et repli du connecteur → S1, §4, §5 · le cahier rejoué sans
casse → gardé.


---

# Lot S — décisions du propriétaire (25/10/2026)

Posées par AskUserQuestion, réponses mot pour mot :

1. Périmètre : « Oui, tout dans le lot S (Recommandé) » — les 4 défauts du 19/10 + les trous de triche (faux avis/notes/abonnés, compteurs d'autrui, dates forgées, demande récrite).
2. Blocage des échanges en cours : « Rien ne disparaît, plus rien de neuf (Recommandé) » — l'artisan garde ce qu'il a reçu (et le téléphone), ne peut plus accepter, répondre ni faire un nouveau devis ; plus aucune notification de la personne bloquée.
3. Ville et code postal d'un PARTICULIER : « Les artisans connectés seulement » (option C, pas la recommandée).
4. Kbis/attestation remplacés par un artisan déjà vérifié : « Badge suspendu jusqu'à ta revue (Recommandé) ».
5. Stockage : « Oui, ses photos publiques (Recommandé) » — personne ne remplace ; chacun retire SES photos publiques (avatars, bannieres, publications) ; jamais pièces jointes, documents, devis.
6. Nombre de réponses aux demandes : « Oui, le nombre seulement (Recommandé) ».
7. « Remettre en tête du fil » : d'abord une idée du propriétaire (« le faire payer comme leboncoin… 10 € pour remonter tous les jours pendant une semaine, tu me diras ce que tu en penses »), puis, après mon avis (paiement Apple, vendeur SARL, CGV, ouverture au public, mention « Sponsorisé ») : « Gratuit 1×/semaine, payant plus tard (Recommandé) ».
8. Le frère : « Non, pas encore » (n'utilise pas Opus).

Choix annoncés par défaut, sans objection demandée explicitement (dis-moi si l'un ne te va pas) :
- partenariats, j'aime et abonnements : plus lisibles sans compte ;
- une demande reçue ne change que par les gestes de l'écran (accepter, refuser, terminer) ;
- phrase des CGU sur les vidéos Cloudinary corrigée maintenant, effacement dans un lot à part ;
- classe de blancs : lot à part juste après S, avant le lot 2.

Déjà acquis : son iPhone porte le build de DÉVELOPPEMENT (reconstruit le 25/10), le code JS arrive par Metro (git pull + npx expo start) — aucune reconstruction nécessaire pour ce lot s'il n'ajoute pas de module natif.

## Décisions du 25/10, après le cahier v2 (AskUserQuestion), mot pour mot

- Q1 (refus notifié à la personne bloquée) : « Oui, le refus passe (Recommandé) » — on ne tait que les notifications que le destinataire reçoit de quelqu'un qu'IL a bloqué.
- Q2 (avis et blocage) : « Oui aux deux (Recommandé) » — plus de nouvel avis sous blocage, dans les deux sens ; l'artisan lit toujours les avis qui le concernent.
- Q3 (remontée) : « 3 par artisan et par semaine (Recommandé) », en plus de « une fois par semaine pour chaque publication ».
- Q4 (assurance et badge suspendu) : « Garder la règle (Recommandé) ».

Annoncés par défaut, sans objection demandée explicitement :
- Q5 : le nom d'entreprise d'une fiche vérifiée reste modifiable sans revue → A-FAIRE.
- Q6 : j'aime et abonnements lisibles par soi seulement (les nombres restent publics).
- Découpage du lot en quatre sous-lots S-a, S-b, S-c, S-d, chacun avec sa migration et l'accord du propriétaire.


---

# Lot S-c — cahier v2 (30/10/2026)

Remplace le v1 (`cahier-sc-v1.md`) là où il le contredit ; le reste du v1 tient.
Sources : les trois critiques (`critique/critique-{base,ecran,textes}.md`), le
prototype (`critique/base/prototype.sql`) et ses amendements A1-A3, et les
quatre réponses du propriétaire du 29/10 (`decisions-sc.md`).

## 1. Décisions (remplace v1 §1 et §9)

| | décision | source |
|---|---|---|
| Q1 avis | **figé, mais retirable** : un bouton « Retirer mon avis » sur la fiche de l'artisan ; on peut ensuite en écrire un autre ; un avis ne se modifie jamais | propriétaire, 29/10 |
| Q2 remontée | la carte garde sa date de publication **et porte une mention discrète « Remise en avant »** | propriétaire, 29/10 |
| Q3 onglet | **« Tout »** — seul le libellé de `TABS` change, la clé `'pourvous'` reste, le badge « Pour vous » des Demandes reste | propriétaire, 29/10 |
| Q4 démo vraie base | **on n'y touche pas** ; les textes écrits pour ne pas être démentis par ces lignes (« exemples placés par l'éditeur pendant l'essai », abonnés jamais dits « calculés ») ; à régler avant l'ouverture | propriétaire, 29/10 |
| D7, Q3 (25/10) | gratuite ; une fois tous les 7 jours par publication, dont la première une semaine après la publication ; 3 par artisan sur 7 jours glissants, publications supprimées comprises | 25/10 |
| annoncé | pas de compteur « il vous reste N » : la base répond, avec la date ; raison VRAIE : une seule écriture de la règle que l'écran ne peut pas tenir (la règle par artisan dépend d'un historique que l'écran ne lit pas en entier) | |
| annoncé | une publication de moins de 7 jours ne se remonte pas : sa publication compte comme son premier passage en haut, et la règle est la même pour toutes | |
| annoncé | la phrase « Sécurité » est corrigée (fausse aujourd'hui) | |
| annoncé | « Comment le fil est ordonné » se DÉPLIE sur place (constante de `legal.js`) dans la feuille de la loupe ET sur la ligne « Filtre : … » du fil | critiques écran 8, textes 7 |

## 2. La base — section 51 c (changements par rapport au prototype)

1. **`pose_la_date()`** — un déclencheur PAR TABLE : `trg_pose_la_date_<table>`
   (même préfixe : l'ordre alphabétique parmi les déclencheurs de la table
   ne change pas). Modes : INSERT seulement sur `posts`, `comments`, les
   trois demandes reçues, les deux réponses, `messages`, `post_vues`,
   **`reviews`** (l'UPDATE est fermé par le droit) ; INSERT OR UPDATE sur
   `annonces_pro`, `demandes`, `chantiers`, `professional_profiles`, `users`.
   La branche INSERT de `professional_profiles` est morte pour un client
   (OP010 passe avant) : dit dans le commentaire et l'essai.
2. **La trace des CGU** — `cree_fiche_utilisateur()` et `devenir_pro()` ne
   gardent une version que si elle a la forme `AAAA-MM-JJ` et n'est pas dans
   le futur (`<= current_date + 1`), sinon `null` ; jamais un refus (section
   31). Limite dite : la base ne connaît pas la version COURANTE.
3. **`tient_le_compte()`** et OP023 comme le prototype (UPDATE par le client :
   refus si `cgu_version`, `cgu_acceptees_le` ou `email` changent ; INSERT par
   le client : vidés).
4. **Publicités** — `post_publicite_sans_auteur_check check (not is_ad or
   author_id is null)` AJOUTÉE sous condition dans un `do`, sans aucun
   `drop` (A1) ; l'ancienne `post_a_un_auteur_ou_est_une_pub` reste. Et
   `fil_filtre` retire les publicités des filtres métier et distance (A3).
5. **`remontees`** — `revoke insert, update, delete, truncate … from anon,
   authenticated` en plus de `revoke all … from anon` (A2).
6. **`remonter_publication`** — VOLATILE (le défaut de plpgsql, et le
   contrôle exige qu'aucun `stable`/`immutable` n'y soit) ; verrou
   `pg_advisory_xact_lock(hashtextextended('remontee:' || moi::text, 0))`
   AVANT la première lecture de `remontees` ; `hint` ARRONDI à la seconde
   supérieure (`date_trunc('second', x) + (x > date_trunc('second', x))::int *
   interval '1 second'`, puis `to_char(… at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`)
   — l'écran arrondit ensuite à la minute supérieure ; `auth.uid()` vide →
   42501 ; égalité stricte des deux instants → `publication`.
7. **`idx_posts_auteur` n'est PAS créé** : « Mes publications » se lit par
   `author_id = moi order by created_at desc, id desc limit 21` et
   `idx_posts_auteur` changerait le plan de l'essai 34 sans besoin mesuré
   (un artisan a quelques centaines de publications au plus). `idx_posts_fil`
   reste : `pageFilSupabase` (fil sans filtre ? à vérifier à la construction)
   et l'application d'avant le lisent ; s'il ne sert plus, le dire dans
   A-FAIRE plutôt que de le supprimer (le connecteur refuse `drop index`).
8. **Les files** — droits de colonne à l'INSERT (prototype). L'essai 27 cas 6
   est réécrit (la demande insérée en `postgres`, puis l'appel de
   l'administrateur en `authenticated`).
9. **Les avis** — `revoke update on public.reviews from anon,
   authenticated` ; `tient_l_avis_neuf` (INSERT) ; la suppression de SON
   avis reste ouverte (« mes reviews », `using (auth.uid() = author_id)` :
   un blocage ne l'empêche pas — R-B « clore oui »). La note se recalcule
   (`trg_notes_pro` AFTER DELETE). L'essai 51b F6 est réécrit : son refus
   vient de S-c (42501), et un cas garde le blocage sur l'INSERT.
10. **Propriétaire par couple (colonne, verbe, rôle)**, pas par colonne : le
    contrôle tient la liste `PROPRIETAIRES` (colonne, table, verbe, fonction).
11. **Ordre de la migration** : tout ce qui ne verrouille pas `posts` d'abord
    (fonctions sur les autres tables, files, avis, users, chantiers), puis
    `posts` (colonne, contrainte, déclencheurs, index), puis `remontees`
    (sa clé verrouille `posts`), puis `fil_filtre`, `remonter_publication`,
    `mes_donnees`, puis le balayage de la section 43.

## 3. L'application (changements par rapport au v1 §3)

1. **`rowToPost`** expose `publieLe: p.created_at` ; `recit.js` lit
   `p.publieLe` et plus jamais `p.curseur` (critique écran 1, BLOQUANT) ;
   `verifier-recit` le fait tourner sur une étape remontée.
2. **`remontee.js`** (pur, aucun import qui charge React Native) :
   `REGLE_REMONTEE = { jours: 7, parArtisan: 3 }`, `phraseDuRefus(e,
   maintenant)` qui rend `null` si ce n'est pas un OP022 lisible, arrondit à
   la minute supérieure, refuse un `hint` sans fuseau explicite, dit « dans un
   instant » si l'instant est passé ou à moins d'une minute ; la règle pour la
   démonstration (`decisionDemo(...)`). `erreurs.js` reste sans import : il
   garde le repli générique (la phrase de la base) et connaît OP023 et
   `reviews_professional_id_author_id_key` (« Vous avez déjà laissé un avis à
   cet artisan »). `republierPublication` appelle `phraseDuRefus` AVANT
   `messageClair`.
3. **Clé de tri du fil** : `cleDeTri` (snake_case) dans `page-fil.js` pour la
   vraie base ; une clé à part pour la démonstration (`remonteLe ||
   publieLe`, départage `String(id)`), appliquée aux deux portes par UNE
   fonction.
4. **« Mes publications »** : `api.mesPublications({ avant })` rend `{ posts,
   fin, curseur }` où `curseur` est le `created_at` BRUT de la dernière ligne
   gardée ; `nbMesPublications()` ; « j'aime » lus pour la page ; l'état de
   l'écran garde CE curseur. Le titre affiche le total (`nbMesPublications`)
   ou rien ; la note de la règle dans `ListHeaderComponent` ; cibles 44 ;
   rôle/étiquette pour la zone qui ouvre et les quatre boutons ; le refus
   OP022 gardé SOUS la carte (« Possible à partir du … ») ; `extraData` ;
   rangée mémorisée ajoutée à `verifier-listes`. Pas de `setState` dans un
   effet (cliquet du linter) : chargement par une fonction appelée à
   l'ouverture (par `OpusApp`).
5. **Une seule fonction** `appliquerAMaPublication(id, changement)` touche le
   fil, « Mes publications », « Mes conseils » et le chantier ouvert ; le
   compteur relu après publier, supprimer et à l'ouverture du profil ; un
   compteur illisible n'affiche rien.
6. **La page d'une publication ne dépend plus du fil** :
   `publicationOuverte` (l'objet), `originePublication` (`'notifications' |
   'mesPublications'`) décide du retour ; elle charge SES commentaires ;
   rien n'est inséré dans `posts` ; le texte « depuis que la notification est
   arrivée » rendu neutre ; une vidéo ouverte depuis « Mes publications »
   garde le comportement d'aujourd'hui (fil vidéo plein écran).
7. **Le bandeau de succès** se décide sur la page RECHARGÉE (deux phrases,
   jamais « en tête ») ; un rechargement qui échoue dit que la remontée a eu
   lieu.
8. **La carte** porte « Remise en avant » quand `remonteLe` est posé (Q2) ;
   `time` reste sur `created_at`. Fil classique et fil vidéo.
9. **L'onglet « Tout »** (Q3).
10. **« Retirer mon avis »** (Q1) : sur la fiche, à la place de « Laisser un
    avis » quand un de mes avis est dans la liste (`r.mien`, calculé par
    `rowToReview` avec `author_id === currentUserId`) ; confirmation ; `api.
    retirerAvis(id)` (`delete … eq('id', id).eq('author_id', moi)`, lit
    `{ error }` et le nombre de lignes) ; la note se relit. Démonstration :
    retenu en mémoire.
11. **La démonstration** : `publieLe` sur chaque publication ET publicité ;
    `time` calculé par `relativeTime(publieLe)` (et `verifier-demo` étendu) ;
    trois publications de plus de 7 jours sur la fiche 1 (photos déjà au
    catalogue, légendes vraies) ; `REMONTEES_DEMO` ; créations, corrections,
    suppressions et remontées retenues en mémoire.

## 4. Les textes

Ceux de `critique-textes.md` §B, avec : Q1-A (« son auteur peut le retirer,
depuis la fiche de l'artisan, puis en écrire un autre »), Q2-B (la mention
reste dans la phrase), Q3-B (« l'onglet « Tout » »), Q4-A (la phrase
« exemples placés par l'éditeur pendant l'essai »). « au moment où il l'a
écrit ou modifié » → « au moment où il l'a écrit ». Finalité de la remontée
dans « Pourquoi ». `VERSION` = date du commit qui publie les textes, avec son
bloc d'historique. La purge de l'historique au-delà de 7 jours va dans
A-FAIRE ; aucune justification par une remontée payante.

## 5. Les contrôles

`verifier-remontee` (nouveau) et les mises à jour de `verifier-fil`,
`verifier-portes`, `verifier-compte`, `verifier-legal`, `verifier-listes`,
`verifier-recit`, `verifier-notifications` (retour de la page), `verifier-vues`
et `verifier-conseil` (la variable `p`), `verifier-demo`, chacune avec sa
raison. Règles : FAIRE TOURNER ce qui décide (phrase OP022, clé de tri,
pagination de « Mes publications », règle de démo, `etapesPourLeRecit`) ;
formes ENTIÈRES pour `remonter_publication` (ordre verrou → lecture) ; R-A
acceptée sous ses deux écritures justes ; « À l'instant » borné au corps de
`republierPublication`.

## 6. Essais

`essais-section-51c.sql` (v1 §6) + les sept fichiers dont l'écart est attendu
(27, 34 si l'index change — non, il ne change pas —, 43, 49, 50, 51b, 38
bruit). Course et mesure à part.

## 7. Migration et vraie base

v1 §7 + ordre du §2.11 ci-dessus ; essai sur la vraie base par le chemin de
l'application (comptes jetables à Brest, `enregistrer_vues` neutralisé) avec
l'aller-retour du `hint` par PostgREST ; prévenir le propriétaire qu'une
remontée sur son compte principal est RÉELLE.


---

# Lot S-c — décisions du propriétaire (29-30/10/2026), mot pour mot (AskUserQuestion)

- Avis : « Figé, mais retirable (Recommandé) » — un bouton « Retirer mon avis » sur la fiche de l'artisan ; le client peut ensuite en écrire un nouveau ; l'avis ne se modifie jamais.
- Remontée : « Une mention « Remise en avant » (Recommandé) » — la carte garde sa vraie date de publication, plus une mention discrète « Remise en avant ».
- Onglet : « Renommer en « Tout » (Recommandé) » — seul le libellé change ; le badge « Pour vous » des Demandes reste.
- Démo vraie base : « On n'y touche pas (Recommandé) » — rien ne change sur ces lignes ; les textes écrits pour ne pas être démentis par elles ; à régler avant l'ouverture.


---

# Lot S-d — les lectures, les droits, l'export — cahier v2 (30/10/2026)

Réécrit après la critique adverse du v1 (workflow `wwa2dpv52`, quatre
lentilles et un contradicteur : 51 constats, 44 confirmés, 7 en partie) et
quatre reproductions faites moi-même (`lotS/sd/repro/`). Les réponses du
propriétaire du 30/10 sont en tête. Ce qui a changé depuis le v1 est marqué
**[v2]**.

## 0. Décisions

| | décision | date |
|---|---|---|
| D2 | « Rien ne disparaît, plus rien de neuf » | 25/10 |
| D3 | ville d'un PARTICULIER : « les artisans connectés seulement » — dans Opus un compte pro = un artisan = une entreprise, donc **tout compte pro** ; son code postal : à personne par son profil | 25/10 |
| Q1 | **fermer les colonnes privées des fiches pro** | 30/10 |
| Q2 | **les notifications d'un compte supprimé partent avec lui** | 30/10 |
| Q3 | **écrire à un particulier depuis sa fiche : les pros seulement — et la base le tient** | 30/10 |
| Q6 | **j'aime et abonnements : soi seulement**, les nombres restent publics | 30/10 |
| — | démo de la vraie base : on n'y touche pas | 29/10 |

Décidé par moi, avec la raison, à dire dans le compte rendu :
- **la note d'un signalement est INTERNE** : l'écran d'administration la
  présente ainsi (« la seule chose qu'on voudra relire dans six mois »),
  contrairement à la note d'une décision pro (« La personne la lira »). Elle
  est fermée à l'auteur du signalement et hors de son export **[v2, EXP-1]** ;
- **`sos_availability` fermée aux visiteurs** (A-FAIRE l.1932) : aucun écran
  ne la lit sans compte **[v2, LEC-1]** ;
- **52.8 (droits de colonne en ÉCRITURE sur `users`)** : non. Le déclencheur
  `tient_le_compte()` refuse déjà avec OP023 et un message ; des droits de
  colonne répondraient 42501, sans phrase **[v2, APP-9]**.

## 1. Relevés de la vraie base (30/10, forme seulement)

v1 §1, plus :
- **aucune entrée GLOBALE de droits par défaut** (`defaclnamespace = 0`) :
  le `revoke` « in schema public » suffit **[v2, MIG-2/BASE-6, mesuré]** ;
- `pg_default_acl` de `supabase_admin` sur `public` : `arwdDxtm` à `anon` et
  `authenticated` (hors de portée de `postgres`, A-FAIRE) ;
- une politique morte `lecture reponses visiteur` (`to anon using (false)`)
  existe sur la vraie base seulement ; elle ne donne rien ;
- conversations : 5, **0 dont le `professional_id` n'a pas de fiche** — la
  règle Q3 ne heurte aucune ligne ; messages 11 ; notifications 20 ;
  signalements avec note : 0 ;
- index absents : `messages(sender_id)`, `demandes(client_id)`,
  `demande_reponses(professional_id)`, `notifications(acteur_id)`.

## 2. Reproduit avant d'écrire ce cahier (`lotS/sd/repro/`)

| | mesuré |
|---|---|
| R1 `revoke all on follows from anon` | `fil_filtre()` en visiteur : **permission denied for table follows**. Garder `select` à `anon` + politique `to authenticated` : **1 ligne, sans erreur** |
| R2 A bloque P ; l'export de P | ses PROPRES messages envoyés : **1 → 0**, toujours 1 en base |
| R3 300 000 messages de A dans la conversation de P | l'export ACTUEL : **2,35 s** (la politique paie `est_masque` par ligne) ; les reçus sous RLS 5,7 s ; tous sans RLS > 8 s (150 Mo) ; **bornés à 5 000 : 0,19 s** |
| R4 P (particulier) puis Q (particulier) | **deux conversations** entre les mêmes personnes, chacun « professionnel » de l'autre |

## 3. La base

Tout ce qui est nouveau vit dans une **section 53** (« Lot S-d »), placée
après la section 52 et **avant `mes_donnees()`** — la dernière fonction du
fichier, et un corps SQL est contrôlé à sa création **[v2, BASE-9]**. Les
réécritures sur place sont dites.

### 3.1 `users` — D3

**M1d** :
- `profil_public(p_id uuid)` (v1 §3.1, mesuré juste dans les 8 cas) :
  `returns table (id, nom, avatar_url, type, ville)`, `ville` seulement pour
  soi ou pour un pro non masqué. Section 53.
- 18.1 réécrite SUR PLACE : `revoke all on public.users from anon` (lecture
  ET écriture) ; la boucle n'accorde plus rien à `anon`. Le `revoke delete
  on public.users from anon, authenticated` reste écrit mot pour mot
  (`verifier-portes`).
- « lecture users » `to authenticated` (création unique, sur place).

**M2** — 18.1 devient une LISTE BLANCHE, sans boucle :
`revoke select on public.users from anon, authenticated;`
`grant select (id, type, nom, avatar_url) on public.users to authenticated;`
Ces quatre colonnes existent dès la section 13 : la liste blanche peut vivre
en 18.1. Une colonne ajoutée plus bas naît FERMÉE — et l'état ne dépend plus
du nombre de rejeux (aujourd'hui, une colonne ajoutée après 18.1 n'est
ouverte qu'au SECOND rejeu).

### 3.2 `professional_profiles` — Q1

Fermées : `badge_suspendu_le, verification_note, demandes_vues_le,
agent_propositions, siret, rge_numero, code_insee, created_at`. Les 38 autres
restent (y compris `agent_nom`, public et assumé, et l'état des pièces).

**M1d** (section 53) : `ma_fiche_pro()` (definer, `setof
professional_profiles`, `id = auth.uid()`) ; `admin_etat_des_fiches(p_ids
uuid[])` (definer, `admin_exige_droit()` d'abord, rend `id,
badge_suspendu_le`) ; `mes_donnees` lit `fiche_professionnelle` par
`ma_fiche_pro()`.

**M2** (section 53, APRÈS le dernier `add column` d'une colonne PUBLIQUE de
la table, `agent_nom`, section 40) : `revoke select … from anon,
authenticated`, `grant select (<38>) … to anon, authenticated`.

### 3.3 `post_likes`, `follows` — Q6 (M1d) **[v2, BASE-1 / R1]**

- « lecture likes » `to authenticated using (auth.uid() = user_id)`,
  « lecture follows » `to authenticated using (auth.uid() = follower_id)`.
- `anon` **garde SELECT** (la politique lui rend 0 ligne) : `fil_filtre()`
  est invoker, ouverte aux visiteurs, et nomme `follows` — PostgreSQL vérifie
  le droit de chaque table nommée au plan, même dans une branche jamais
  évaluée. On retire à `anon` `insert, update, delete` seulement.
- 51d : un visiteur appelle `fil_filtre()` sans erreur ; et un relevé croisé
  « fonctions invoker exécutables par `anon` × tables nommées que `anon` ne
  peut pas lire » rend **0 ligne**.

### 3.4 `demande_reponses` — S4 (M1d)

v1 §3.4, plus : la politique vaut **dans les deux sens** — l'auteur lit la
réponse d'un pro qu'il a bloqué ET celle d'un pro qui l'a bloqué ; le pro
bloqueur ne voit plus la demande **[v2, BASE-5]**. Index
`idx_demandes_client (client_id)` et `idx_demande_reponses_pro
(professional_id)` **[v2, LEC-2]**. Les réponses aux ANNONCES ne changent pas
à l'écran (v1) ; l'export, lui, les rend toutes (§3.7).

### 3.5 Droits de table hors RLS — S9

- Bloc `do $droits$` juste avant `do $portes$` : `revoke truncate,
  references, trigger` à `anon, authenticated` sur chaque table de `public`,
  et `alter default privileges for role postgres in schema public revoke
  truncate, references, trigger on tables from anon, authenticated`.
- **MAINTAIN** (PostgreSQL 17 seulement) : la branche `server_version_num >=
  170000` reste dans `schema.sql`, mais elle n'a jamais tourné ici (PG 16).
  Elle ne part donc PAS dans la migration : un appel à part, avec
  `alter default privileges`, pour qu'un refus n'annule rien d'autre ;
  éprouvée sur la vraie base par relevé seulement **[v2, BASE-7]**.

### 3.6 `signalements` — `traite_par` et `note` (M1d) **[v2, EXP-1]**

`revoke select … from anon, authenticated`, puis `grant select (id,
auteur_id, cible_type, cible_id, cible_auteur_id, motif, details, statut,
created_at, traite_at, extrait…)` — toutes sauf `traite_par` et `note`.
L'application ne lit que `id, cible_type, motif, statut, created_at`.

### 3.7 L'export — S10 (M1d)

**La règle, en tête de la fonction** **[v2, DROIT-8]** : l'export rend les
données qui concernent la personne, sauf une LISTE FERMÉE d'exclusions,
chacune avec sa raison :
1. l'identité de qui la suit (un pro en a le nombre sur sa fiche) ;
2. l'identité de qui l'a bloquée, et même le fait d'être bloqué ;
3. l'identité de qui a signalé un de ses contenus, et ce qu'il a écrit ;
4. l'identité de l'administrateur qui a décidé (CJUE C-579/21) ;
5. la note interne d'un signalement ;
6. les fichiers eux-mêmes (rendus par leur adresse) ;
7. les fiches de carnet et les devis qu'un artisan tient sur elle : ce sont
   les données de l'artisan, à qui elle s'adresse.

**Une fonction `mes_donnees_sans_masquage()`** (definer, `jsonb`, section 53,
`authenticated` seul, listes 27b et 13i) **[v2, DROIT-9, EXP-2, BASE-3,
DROIT-10, DROIT-11]** rend ce que la RLS cacherait à tort à la personne :
`conversations` (les siennes, l'autre partie par son identifiant),
`messages` (ses messages envoyés, sans masquage), `messages_recus`,
`reponses_recues_a_mes_annonces`, `signalements_visant_mes_contenus`
(`cible_type, motif, extrait, statut, created_at` — ni auteur ni détails),
`decisions_de_l_administration` (journal, sans `admin_id`, sans les
signalements), `metadonnees_d_inscription` (`raw_user_meta_data`).

**Ce que d'autres remplissent est BORNÉ** **[v2, EXP-3, R3]** :
`messages_recus` et `mes_notifications` aux 5 000 plus récents ; une clé
`limites_de_l_export` dit, pour chaque clé bornée, le total et le nombre
rendu. 51d mesure l'export avec 300 000 messages reçus sous 8 s.

**Clés ajoutées** (RLS suffisante) : `mes_j_aime`, `publications_enregistrees`,
`partenariats`, `reponses_que_j_ai_ecrites`, `reponses_recues_a_mes_demandes`,
`avis_recus`, `mes_demandes_de_metier`, `mes_specialites_proposees`,
`mes_notifications` (bornée). `signalements_deposes` : liste de colonnes,
sans `traite_par` ni `note`.

**Structure** **[v2, BASE-8]** : `jsonb_build_object(…) || jsonb_build_object(…)`
— un objet est plafonné à 50 clés (100 arguments) ; l'export en aura une
cinquantaine. Le contrôle compte les clés par objet (≤ 45).

### 3.8 Notifications d'un compte supprimé — Q2 (M1d)

`notifications_acteur_id_fkey` → `on delete cascade`, plus
`idx_notifications_acteur`. Mesuré par le critique : rien d'autre ne part.

### 3.9 Une conversation se crée avec un PRO — Q3 (M1d) **[v2, APP-3, R4]**

« creation conversation » (section 18, réécrite sur place) : en plus du
blocage, `exists (select 1 from public.professional_profiles p where p.id =
conversations.professional_id)`. Un pro écrit à un particulier, un
particulier à un pro, un pro à un pro : inchangés. Un particulier à un
particulier : refusé, donc plus de seconde conversation inversée.

### 3.10 `sos_availability` fermée aux visiteurs (M1d) **[v2, LEC-1]**

« lecture dispo sos » `to authenticated using (true)`. `artisans_urgence`
(invoker, `authenticated`) et la lecture de ses propres lignes : inchangés.

### 3.11 Index (M1d)

`messages(sender_id)` (l'export et la cascade d'un compte), plus ceux de 3.4
et 3.8.

## 4. L'application — commit 1, avec M1d

- `chargerProfilPublic` → `rpc('profil_public')` ; les demandes seulement si
  je suis pro, **ouvertes**, 20 au plus **[v2, APP-4]**.
- `voirPersonne(id)` : une porte pour « toucher un nom » ; décide par
  `pros[id]`, puis par le `type` rendu par `profil_public` **[v2, APP-6]** ;
  **le retour ramène à l'écran d'origine** (« Pour moi » ou le fil).
- `ProfilPublicScreen` : rôle par `type` ; « Ses demandes en cours » pour un
  pro seulement ; « Aucune demande en cours à afficher » — jamais « n'a
  publié aucune demande » ; « Envoyer un message » pour un pro, jamais sur
  soi ; **« Signaler » (cible `profil`)** **[v2, DROIT-17 d]**.
- Q1 : `COLONNES_PRO_LISTE` sans les colonnes fermées ; `loadAll` lit
  `rpc('ma_fiche_pro')` — **lecture OBLIGATOIRE pour un pro**, comme la liste
  des fiches **[v2, APP-1]** ; `submitDocuments` n'envoie le RGE que s'il a
  changé ; `profilProDeSupabase` sans `*` ; `nommerAgent`,
  `noterRefusAgent` sans relecture d'une colonne fermée ; la file de
  l'administration par `admin_etat_des_fiches`.
- « Abonnés » : `followers − (suivi au chargement) + (suivi maintenant)`
  **[v2, APP-5, mesuré 1 en base, 2 affiché]**.
- Déconnexion : `opus.fil.secteur` et `opus.demandePro.message` effacés —
  ils passaient au compte suivant **[v2, DROIT-17 c]**.
- Démonstration : `profil_public` a son pendant — la ville si celui qui
  regarde est pro, sinon rien ; un contrôle le fait tourner **[v2, APP-7,
  DEMO-1]**.
- Commentaires devenus faux corrigés dans le commit qui les rend faux
  **[v2, APP-9]**.

## 5. Les textes **[v2, DROIT-13 : deux lots]**

**Commit 1 (avec M1d), `VERSION` = sa date** — ce qui ne dépend pas de M2,
dont ce qui est déjà faux :
- l'export : la phrase « tout ce que nous avons » remplacée par la règle et
  la liste fermée (§3.7), et la borne des 5 000 ;
- « Ce que nous collectons » en deux parties : ce que vous nous donnez ; ce
  que d'autres écrivent sur vous (avis, messages reçus, signalements,
  décisions — art. 14, avec la source) **[DROIT-19]** ;
- sous le téléphone d'un particulier : « Il ne s'affiche pas sur votre
  profil. Il est transmis aux artisans à qui vous demandez un devis, un
  rappel ou une urgence, qui peuvent le garder dans leur carnet. » ;
- « On ne demande jamais votre adresse » corrigé (une urgence la demande) ;
- les éléments gardés sur le téléphone : la liste vraie, et leur effacement
  à la déconnexion ;
- « Signaler » sur chaque profil : vrai après A-d ;
- les justificatifs : l'ÉTAT des pièces s'affiche (reçu, à jour avec sa
  date, refusé), jamais le document ni le motif **[DROIT-6]** ;
- Anthropic, action par action (résumé des avis sans le nom des auteurs,
  recherche, récit) **[DROIT-15]** ;
- les signalements : la durée d'un an n'est tenue par rien — le texte dit
  la vérité, et la purge entre à A-FAIRE avant l'ouverture **[DROIT-16]** ;
- « conservées tant que votre compte existe » : le départ d'un autre retire
  de votre compte vos conversations avec lui et les notifications qui le
  nomment **[DROIT-12, Q2]** ;
- la disponibilité aux urgences : lue par les utilisateurs connectés, état
  actif compris ;
- un particulier n'écrit qu'aux professionnels (Q3), là où les CGU parlent
  de la messagerie.

**Commit 2 (avec M2), `VERSION` = sa date** :
- **« Ce que les autres voient de vous »**, construite TABLE PAR TABLE sur
  les politiques réelles, avec la charpente de « Vos tarifs et vos prix »
  (« parmi les utilisateurs d'Opus… », puis l'éditeur et l'administration)
  **[DROIT-1 à 5, TXT-1, BASE-4]** : sans compte, un visiteur ne voit aucun
  PARTICULIER (ni nom, ni photo, ni ville) ; il voit les fiches pro, les
  publications, les chantiers, les commentaires et les avis (sans le nom de
  leurs auteurs) ; connecté : nom, photo, type ; la ville d'un particulier
  par son profil aux pros seulement ; ses DEMANDES (texte, commune, code
  postal, photos) à tous les pros, même refermées ; une demande de devis,
  de rappel ou d'urgence : l'artisan visé ; j'aime, abonnements,
  enregistrements : vous seul, seuls les nombres de j'aime et d'abonnés
  d'un pro sont publics ; la réponse à une demande : les deux parties, dans
  les deux sens d'un blocage ; la fiche pro, y compris le nom de votre
  agent ; l'administration voit la ville d'un particulier qui demande un
  compte pro ; passer pro rend votre commune publique ;
- sous « Ville » : « Votre profil ne la montre qu'aux professionnels
  connectés. La commune d'une demande que vous publiez est lue par tous les
  professionnels. » ;
- l'ancien SIRET « reste lisible par l'interface publique » → « n'est plus
  lisible que par vous et l'administration » **[DROIT-7]**.

`verifier-legal` : refuse une `VERSION` postérieure au lendemain
**[DROIT-14]** ; compare chaque table lisible par `anon`/`authenticated` à
une mention de la section (commit 2).

## 6. L'ordre — deux étapes **[v2, MIG-1, MIG-3, APP-2]**

`schema.sql` dit TOUJOURS l'état de la vraie base :
- **commit 1 = `schema.sql` à l'état M1d** (`users` sans `anon`, mais
  `authenticated` lit encore ses colonnes ; `professional_profiles` encore
  ouverte) ; essai 51d partie 1 ;
- **commit 2 = l'état M2** (les deux listes blanches) ; essai 51d partie 2.

1. M1d construite depuis le `schema.sql` du commit 1 ; simulée sur une
   imitation (`git show 0b01d1b:supabase/schema.sql`, deux rejeux) ;
   empreinte = base neuve au `schema.sql` du commit 1. **Accord** ;
   appliquée ; relevée ; puis MAINTAIN et droits par défaut à part. Décompte
   des 401/403 dans les journaux avant et après.
2. Commit 1 envoyé.
3. **Le propriétaire** : `git pull`, `npx expo start -c`, puis trois gestes
   nommés : ouvrir Opus (sa fiche pro lit `ma_fiche_pro`), « Voir le
   profil » d'un client dans « Pour moi », toucher le nom d'un
   commentateur. Et on lui demande si Opus est installé ailleurs.
4. Constat dans les journaux : `rpc/ma_fiche_pro` ET `rpc/profil_public`
   depuis son téléphone, et plus aucune lecture de `verification_note`,
   `rge_numero`, `agent_propositions` ou `users?select=…ville` après sa mise
   à jour.
5. M2 et **son ordre de retour** (des `grant` qui rendent les colonnes),
   éprouvé en local AVANT l'accord. **Accord** ; appliquée ; relevée ;
   décompte 401/403.
6. Commit 2 envoyé ; `git pull` (rien à reconstruire).

## 7. Les preuves

**`supabase/essais-section-51d.sql`** (partie 1 au commit 1, partie 2 au
commit 2), cas 0 qui prouve la donnée, `set local role` hors de tout `do`.
Tout v1 §7, plus : `fil_filtre()` en visiteur ; le relevé croisé ; la
conversation particulier→particulier refusée, les trois autres permises ;
l'export sous blocage (ses messages, les réponses à ses annonces) ;
l'export avec 300 000 messages reçus sous 8 s ; `limites_de_l_export` ;
la note et `traite_par` fermées ; `sos_availability` en visiteur.

**Les 30 autres essais** : écarts attendus **49 (27b), 50 (13i) et
`essais-suppression-compte`**, et rien d'autre — 43 ne bouge pas
**[v2, BASE-2, ESS-1]**. 51d est la SEULE garde de ces fermetures
(`npm run verifier` ne joue aucun SQL, A-FAIRE §2.3).

**Contrôles** : `verifier-lectures.mjs` (nouveau) ; mis à jour, sans perdre ce
qu'ils tiennent **[v2, APP-8]** : `verifier-stockage` (361-365),
`verifier-agent-nom` (207, 214-215), `verifier-portes` (le `revoke delete`
mot pour mot), `verifier-moderation` (aucun `alter policy` dans
`schema.sql`, listes fermées), `verifier-legal`, `verifier-devis`
(`mes_donnees` dernière, rien que des `revoke` après `$portes$`). Chacun
éprouvé en cassant ce qu'il surveille.

**Vraie base** : v1 §7, plus la conversation particulier→particulier
refusée et l'export d'un compte bloqué.

## 8. Hors de S-d (A-FAIRE)

v1 §8, moins ce que le v2 a pris (les messages masqués de l'export,
`sos_availability`), plus : la purge des signalements (avant l'ouverture) ;
un export en FICHIER par une fonction Edge, sans borne (avant
l'ouverture) ; l'extrait d'un contenu signalé qui survit à la suppression
du compte ; les droits par défaut de `supabase_admin` ; 52.8 (raison §0).
