# Le parrainage dans Opus — PLAN, rien n'est construit (03/11/2026)

> **Statut : une PROPOSITION, en attente de votre accord.** Aucune ligne de
> code, aucune table, aucune écriture dans Supabase. Vous l'avez demandé ainsi :
> « Avant de coder, propose-moi un plan et attends mon accord. »
>
> Ce plan est la **version 2**. La première a été relue par quatre relecteurs
> (la base, le droit, la technique du téléphone et du site, la cohérence) :
> **68 remarques**, chacune contre-examinée par un second relecteur chargé de
> la réfuter. Ce qu'elles ont changé est résumé au §1.

## Votre demande, et vos réponses

Votre demande du 03/11/2026, pour l'essentiel :

- chaque pro a un code personnel et un lien (`opus-project.com/i/CODE`) ;
- un bouton « Inviter un collègue » ouvre le menu de partage du téléphone,
  avec un message court et le lien : **c'est l'artisan qui choisit
  l'application et qui envoie** ;
- **ne jamais lire les contacts du téléphone, ne jamais envoyer d'invitation
  automatiquement** ;
- à l'inscription, le code du parrain est enregistré ;
- le code est le même que celui de la future liste d'attente de la page
  d'accueil, pour garder les parrainages faits avant le lancement ;
- **aucune récompense chiffrée affichée** : les paliers seront décidés après
  la création de la société ;
- chaque écriture vérifiée pour de vrai dans Supabase.

Vos réponses du même jour :

1. la liste d'attente n'existe pas encore → **Opus fabrique les codes**, la
   page d'accueil reprendra les mêmes ;
2. un filleul compte dès que **son entreprise est trouvée au répertoire
   Sirene** (pas besoin du badge) ;
3. **tout le monde** peut inviter (pros et particuliers) ; seul un filleul pro
   avec son entreprise compte ;
4. le parrain voit **le nombre et les noms d'entreprise** de ses filleuls.

Relevé avant d'écrire : rien de tout cela n'existe, ni dans le dépôt ni dans
la vraie base (requête sur la FORME seulement).

---

## 1. Ce que la relecture a changé — les dix points qui comptent

1. **Le lien ne mène nulle part aujourd'hui.** Mesuré le 03/11 :
   `https://opus-project.com/` répond **403 (interdit)** — l'hébergement IONOS
   est vide —, `…/i/K7PQ4MB` est **redirigé** vers `…/K7PQ4MB`, et l'adresse
   que les iPhone lisent pour ouvrir une application
   (`/.well-known/apple-app-site-association`) répond **300**. Et Opus n'est
   sur aucun magasin : la personne invitée ne pourrait rien installer.
   → **Le bouton « Inviter » ne sort pas avant que le lien mène quelque
   part** (§6).
2. **Le code ne passe PAS par le déclencheur d'inscription.** Une erreur à cet
   endroit peut faire échouer **toutes** les inscriptions (« Database error
   saving new user »), et un code rangé dans les données d'inscription y reste
   pour toujours, hors de l'export RGPD — c'est déjà le cas du SIRET. Le code
   tapé est envoyé **juste après** la création du compte, par une fonction à
   part. Une inscription ne peut plus échouer à cause d'un code.
3. **Le code a un signe de contrôle**, comme la clé d'un SIRET : une faute de
   frappe se voit **avant** l'envoi, sans rien demander à la base. Et
   l'alphabet compte 30 signes, pas 31 (§2).
4. **« Compter » se décide sur une entreprise ACTIVE, trouvée au répertoire,
   et la date est gardée.** La v1 disait « entreprise rattachée » : ce n'est
   pas la même chose (une entreprise peut avoir été ouverte à la main par
   l'administration, ou être un compte d'essai), et « une entreprise ne compte
   qu'une fois » n'est vrai qu'à un instant donné (§4).
5. **La liste d'attente ne rattache JAMAIS un code par la seule adresse
   e-mail.** La confirmation par e-mail est coupée sur le projet : n'importe
   qui pourrait créer un compte avec l'adresse d'un inscrit et récupérer son
   code et les noms de ses filleuls (§5).
6. **Pas de bouton « Copier »** : il demanderait un module natif, donc une
   reconstruction de l'application. Le code se sélectionne au doigt, et le
   menu de partage du téléphone propose déjà « Copier ».
7. **La personne invitée est prévenue**, sous le champ du code, de ce que son
   parrain verra. Et elle peut **retirer** ce lien depuis son profil : c'est
   son droit d'opposition (RGPD, art. 21).
8. **Un blocage cache le nom** : un filleul qui a bloqué son parrain reste
   compté, sans nom.
9. **Chaque promesse est tenue par la base ou par un contrôle**, et le tableau
   de l'annexe dit lequel (§A.6).
10. **La page d'accueil est une mise en ligne publique** : avant qu'elle
    recueille une seule adresse, il faut un éditeur nommé, une boîte aux
    lettres qui existe, un fournisseur d'e-mails déclaré et ses propres
    mentions légales (§5).

---

## 2. Le code

- **Un code par compte**, pro ou particulier, **fabriqué par la base**, jamais
  par le téléphone. Il naît la première fois qu'on ouvre « Inviter », pas à
  l'inscription : rien de ce qui touche au parrainage ne peut faire échouer la
  création d'un compte.
- **7 signes : 6 tirés au hasard et 1 signe de contrôle**, dans un alphabet de
  **30 signes** sans ceux qu'on confond (`2-9`, et `A-Z` sans `I`, `L`, `O`,
  `U`) : environ **729 millions** de codes. Affiché en deux groupes :
  **`K7P-Q4MB`**. Les espaces, les tirets et les minuscules ne comptent pas à
  la saisie ; un `O`, un `0`, un `I`, un `1` ou un `L` tapé est signalé tout
  de suite (« un code Opus n'en contient pas »).
- **Il ne change jamais et n'est jamais redonné à quelqu'un d'autre**, même
  après la suppression du compte : un code qui circule encore dans de vieux
  messages ne doit pas mener à une autre personne. Il ne reste alors que le
  code et sa date, sans compte — comme un SIREN réservé.
- Un code dont le compte est parti **n'accepte plus aucun filleul**, avec la
  même réponse qu'un code inconnu.

## 3. Ce que vous verrez, une fois construit

**Sur le profil** : « Inviter un collègue » pour un pro, « Inviter un
artisan » pour un particulier. L'écran montre :

- le code en grand (`K7P-Q4MB`), sélectionnable ;
- **« Partager »**, qui ouvre le menu de partage du téléphone (SMS, WhatsApp,
  e-mail…) — rien ne part sans que vous choisissiez ;
- le décompte : **« 3 entreprises inscrites avec votre code »**, avec leurs
  noms, et **« 1 personne inscrite, sans entreprise »**, sans nom ;
- **aucun montant, aucun palier, aucune barre de progression.**

**Le message proposé**, modifiable dans l'application que vous choisissez, au
vouvoiement neutre et sans promesse :

> Opus, l'application des pros du bâtiment. Code d'invitation : K7P-Q4MB
> https://opus-project.com/i/K7PQ4MB

L'adresse est toujours **seule sur la dernière ligne** : c'est ainsi qu'elle
reste cliquable partout (sur Android, une adresse passée à part est perdue ;
sur iPhone, elle part deux fois). Opus **ne sait pas** si le message a été
envoyé, et ne le compte pas.

**À l'inscription** : une ligne repliée « J'ai un code d'invitation », qui
déplie un champ **facultatif**, avec cette phrase dessous :

> Facultatif. La personne dont c'est le code verra que vous vous êtes
> inscrit et, si vous êtes professionnel, le nom de votre entreprise tel
> qu'il s'affiche sur votre fiche.

Un code inconnu **n'empêche jamais l'inscription** : le compte est créé, et
Opus dit une fois « code non reconnu », avec la possibilité de le corriger.

**Pendant 7 jours** après la création du compte, quelqu'un qui a oublié son
code peut l'ajouter depuis son profil — une seule fois. Il peut aussi
**retirer** le lien à tout moment ; un lien retiré ne se remplace pas par un
autre.

**Ce qui ne se fera jamais** : lire les contacts du téléphone, lire le
presse-papiers, envoyer une invitation à la place de l'artisan, compter les
messages envoyés, nommer le parrain sur la page publique d'un code. Un
contrôle le tiendra (§A.6).

## 4. Quand un filleul « compte »

- **Il compte quand son compte porte une entreprise ACTIVE trouvée au
  répertoire Sirene** — à l'inscription pro, ou plus tard par « Passer en
  compte professionnel ».
- **La base note la date** du premier jour où il compte, **une fois pour
  toutes**. Si son entreprise lui est retirée plus tard, il reste compté :
  sinon le parrain verrait son compteur baisser et apprendrait une décision
  de l'administration qui ne le regarde pas.
- Un compte d'essai (`…@exemple-opus.test`) ne compte que pour un autre compte
  d'essai : les essais sur la vraie base ne gonfleront jamais le compteur d'un
  vrai compte.
- **Un seul niveau** : le filleul d'un filleul n'est rien pour le premier
  parrain.
- **Vocabulaire** (règle du projet) : jamais « vérifié » pour ce niveau — ce
  mot appartient au badge. On dit « inscrite avec son entreprise ».
- **Ce qui ne protège rien tant qu'il n'y a rien à gagner** — et qu'il faudra
  régler AVANT toute récompense : un SIRET est public, n'importe qui peut taper
  celui d'une entreprise réelle (de l'ordre de 480 faux filleuls par jour et
  par connexion, mesuré sur les limites de la fonction `siret`) ; et une même
  entreprise, partie puis revenue sous un autre compte, peut compter pour un
  second parrain. Aujourd'hui, ça ne coûte rien ; avec une récompense, si.

## 5. La page `opus-project.com/i/CODE` et la liste d'attente

**La page `/i/CODE`** :

- « Vous avez été invité sur Opus », le code en grand, et — tant qu'Opus n'est
  sur aucun magasin — **l'inscription à la liste d'attente** ; ensuite, les
  liens des magasins ;
- elle n'affiche le code **que s'il a la forme d'un code Opus** (signe de
  contrôle compris), sinon une page générique : sans ça, n'importe qui
  ferait afficher n'importe quel texte « en grand » sous le nom d'Opus ;
- elle **ne demande jamais à la base** si le code existe (sinon, n'importe qui
  pourrait essayer des codes à la chaîne) ;
- **aucun cookie, aucune mesure d'audience**, et jamais le nom du parrain.

**La liste d'attente** :

- la même réponse quoi qu'il arrive : « Si l'adresse est valable, un e-mail
  vient de partir » — elle ne dit ni si l'adresse est déjà inscrite, ni si un
  code de parrain existe ;
- **une confirmation par e-mail** (case non cochée, lien de désinscription,
  aucun pixel de suivi) ; une entrée non confirmée est effacée au bout de
  7 jours et ne compte pour personne ; le code n'est fabriqué qu'à la
  confirmation ;
- un inscrit de la liste n'est montré à son parrain **que par un nombre**
  (« 2 personnes sur la liste d'attente »), jamais par son adresse ;
- **à l'ouverture, son code ne passe à son compte que si l'adresse est
  PROUVÉE** : soit la confirmation par e-mail de Supabase est activée (elle
  doit l'être de toute façon avant d'ouvrir au public), soit un lien envoyé à
  l'adresse de la liste est touché depuis le compte. Jamais par la seule
  égalité des adresses.

**Ce qu'il faut AVANT de recueillir une seule adresse** — c'est la première
collecte publique d'Opus, et la loi demande que le responsable soit nommé
« au moment où les données sont obtenues » (RGPD, art. 13) :

1. décider **qui est l'éditeur** (vous, votre SARL, ou la future société) et le
   publier ; si la future société reprend les adresses, l'écrire sur le
   formulaire ;
2. créer la **boîte aux lettres** sur `opus-project.com` (rien à configurer :
   le domaine porte déjà le courrier d'IONOS) ;
3. choisir le **fournisseur d'envoi d'e-mails** (il devient un sous-traitant,
   avec son contrat) et le régler dans Supabase ;
4. les **mentions légales et la politique de confidentialité du site** ;
5. régler l'hébergement : la page ne doit pas être redirigée (c'est le cas
   aujourd'hui) ;
6. décider du **plan Supabase** : un projet gratuit peut se mettre en pause, et
   la page doit alors dire honnêtement « inscription momentanément
   indisponible ».

**Le lien qui ouvre directement l'application** (« lien universel ») vient
plus tard, avec la première version publiée sur les magasins et le QR
professionnel de l'addendum, en une seule reconstruction. **Le code tapé à la
main reste le chemin principal, partout et pour toujours** : sur iPhone, rien
ne transmet un code à une application installée APRÈS le clic sans pister
l'appareil, ce que la CNIL et Apple interdisent sans consentement.

## 6. L'ordre

- **Maintenant** : ce plan, et le **format du code figé** (§2). Si la page
  d'accueil se fait ailleurs avant le reste, elle ne doit proposer **aucun
  code**, sinon ils ne seront pas les mêmes.
- **Le devis reste la priorité** (lots 2a, 2b, 2c, puis 3 à 5).
- **Lot R1 — dans Opus** : la base, le champ à l'inscription, l'écran
  « Inviter », les textes. **Il ne sort qu'avec R2**, ou au moment de la
  publication sur les magasins : avant, le lien partagé mènerait à une page
  interdite et vers une application qu'on ne peut pas installer.
- **Lot R2 — la page `/i/CODE` et la liste d'attente**, avec ses six
  préalables (§5).
- **Lot R3 — les liens universels**, avec la première version publiée et le QR
  professionnel.

Chaque lot suit la méthode habituelle : cahier, relecture adverse, base d'essai
rejouée deux fois, contrôles éprouvés en cassant, migration simulée, **votre
accord**, puis la vraie base, et un essai par le chemin de l'application avec
des comptes jetables supprimés ensuite.

## 7. Les récompenses — plus tard, et ce qu'il faudra respecter

Rien de ceci n'est construit ni promis. Ce sont les garde-fous à tenir le jour
où vous déciderez des paliers, **à faire relire par un juriste avant toute
annonce** :

- **la vente « à la boule de neige » est un délit** (code de la consommation,
  L. 121-15 : deux ans de prison, 300 000 € d'amende) : il vise toute promesse
  de service gratuit ou moins cher « en subordonnant » à des inscriptions,
  **même sur un seul niveau**. Donc : avoir un code et inviter ne demande ni
  paiement ni abonnement ; une récompense **par filleul qui UTILISE Opus**
  (pas pour une simple inscription), plafonnée ; jamais un service rendu
  gratuit à condition d'avoir recruté ; jamais rien sur les filleuls des
  filleuls ;
- de préférence **un avoir sur Opus** plutôt que de l'argent (l'argent devrait
  être déclaré chaque année à l'administration fiscale, et justifié en
  comptabilité) ;
- **un règlement accepté par le parrain** (case non cochée, datée par la
  base) : Opus ne sait pas encore faire ré-accepter des conditions, donc une
  nouvelle version des CGU ne suffirait pas ;
- un **journal des récompenses accordées**, à part, qui survit au départ du
  filleul ;
- le message prérempli dira alors que le parrain y gagne quelque chose.

## 8. Questions encore ouvertes

Posées à la remise de ce plan :

1. **La page d'accueil : quand, et avec quel outil ?** Je propose qu'elle vive
   dans le dépôt d'Opus (un dossier `site/`), pour que les contrôles relisent
   ses textes comme ceux de l'application.
2. **Un filleul qui supprime son compte** : il disparaît du compteur (proposé —
   rien n'est dû aujourd'hui, et on ne garde pas ce qui ne sert plus) ou il
   reste compté sans nom ?
3. **Une entreprise ouverte à la main par l'administration** (le répertoire ne
   la montrait pas, un humain a vérifié les pièces) : compte-t-elle ?
4. **Les mots à l'écran** : « Inviter un collègue » et « code d'invitation »
   (proposé : « parrainage » laisse attendre une récompense que vous ne voulez
   pas encore afficher), ou « parrainage » ?

Et pour plus tard :

- combien de temps garder l'adresse d'une personne de la liste d'attente qui ne
  crée jamais de compte (au plus trois ans, selon la CNIL) ;
- quand un code vient de la liste d'attente et qu'un AUTRE est tapé à
  l'inscription, lequel gagne ;
- le nom affiché dans le message : « Opus » ou « Opus-Project ».

---

## Annexe — pour le lot qui le construira

Le cahier de R1, écrit au moment de construire, fixera les colonnes. Ce qui
suit fixe les **règles** et les **pièges déjà mesurés**.

### A.1 La base

- **Deux tables PRIVÉES** : `codes_parrainage` (le code en clé primaire, le
  compte en `on delete set null`, la date, `libere_le` posé par la base quand
  le compte part, `essai`) et `parrainages` (le filleul en clé primaire,
  `on delete cascade` ; le code ; `enregistre_le` ; `compte_le`, posée une
  fois pour toutes ; `essai`). RLS active, **`revoke all … from anon`** et
  **`revoke insert, update … from authenticated`** : une table neuve de
  `public` naît avec INSERT, UPDATE et DELETE pour les deux rôles, et le
  balayage de la section 42 bis ne retire que TRUNCATE, REFERENCES, TRIGGER.
  Une seule politique de lecture chacune, « ma ligne » ; le parrain ne lit
  **jamais** les lignes de ses filleuls (il en apprendrait l'identifiant, et
  `profil_public()` rend la ville d'un particulier à un pro).
- **Retirer le lien** : une politique `for delete` limitée à sa propre ligne,
  comme le retrait d'un avis (section 52). Aucun corps de fonction ne contient
  d'ordre de suppression : le connecteur refuse une migration qui en porte un.
- **Le hasard** vient de `gen_random_uuid()` (cœur de PostgreSQL, identique en
  local et sur Supabase), **en écartant les octets fixes d'un UUID v4**, avec
  un tirage par rejet (un octet ne sert que s'il est < 240 = 8 × 30). **Jamais
  `random()`, jamais `gen_random_bytes` sans schéma** : sur Supabase, pgcrypto
  vit dans `extensions`, en local dans `public` — un appel non qualifié marche
  dans tous les essais locaux et casse en production seulement (mesuré le
  03/11). Une collision recommence (`on conflict do nothing`), dix fois au
  plus, puis une erreur nommée que l'essai provoque exprès.
- **Le signe de contrôle** : Luhn « mod N » à 30 signes (le principe de la clé
  du SIRET), écrit une fois dans `src/lib/code-invitation.js` (qui n'importe
  rien), recopié dans la fonction SQL et dans la page, et comparé par un
  contrôle sur un fichier de cas joué des deux côtés — la leçon de la clé de
  rapprochement du lot P.
- **`enregistrer_mon_parrain(code)`** : `security definer`, filleul =
  `auth.uid()` et **aucun autre paramètre** ; code borné (32 signes) puis
  normalisé ; refusé si un parrain est déjà posé, si le compte a plus de
  7 jours (**`auth.users.created_at`** : `public.users.created_at` se repose
  quand un client recrée sa ligne après `preparer_suppression_compte()`), si
  c'est son propre code, si c'est le code d'un de ses filleuls (pas de cycle),
  si le code est libéré ; **la même réponse** pour tous ces refus ; les essais
  comptés, réussis ou non (5 par 24 h et par compte), et « une seule fois »
  tenue même après un retrait. Elle ne rend **jamais** le nom du parrain.
- **`mes_filleuls()`** : `security definer`, `stable`, `revoke` de PUBLIC et
  d'`anon`, ajoutée aux listes fermées (`DEFINER_ATTENDUES`, essai 49 cas 27b)
  avec sa raison. Elle rend le nombre qui compte (`compte_le is not null`), le
  nombre des autres, et les noms de **`professional_profiles.entreprise`**
  (jamais l'identité du répertoire, qui est privée) ; un filleul que
  `est_masque()` cache est compté sans nom.
- **`compte_le`** est posée par un déclencheur sur `entreprise_registre`
  (identité active, source `registre`, ou `essai` entre deux comptes d'essai),
  par `clock_timestamp()`, et jamais remise à vide.
- **L'export RGPD** : `mon_code_de_parrainage` et `mon_parrainage` (le code
  que j'ai tapé, sa date — pas l'identité du parrain) ; `mes_filleuls` passe
  par `mes_donnees_sans_masquage()` avec les bornes de la section 53 (des
  tiers remplissent cette liste) et rend des noms et des dates, jamais un
  identifiant.
- Le prélude local reçoit `auth.users.created_at` (et
  `email_confirmed_at`, `is_anonymous`) par `add column if not exists` ; le
  code n'est jamais fabriqué pour un compte anonyme.

### A.2 L'application

- Le champ du code : après le mot de passe, avant la case des CGU ;
  `autoCapitalize="characters"`, `autoCorrect={false}`, `spellCheck={false}`,
  `autoComplete="off"`, `maxLength` 10 ; contrôle de forme local avant tout
  envoi.
- Le code tapé part **après** `signUp`, par `enregistrer_mon_parrain()`. Si la
  confirmation par e-mail est un jour activée, il attend sur le téléphone la
  première connexion, puis s'efface — dit dans « Cookies et traceurs », comme
  le message d'une demande pro.
- `Share.share({ message }, { subject, dialogTitle })`, l'adresse en dernière
  ligne, **aucun champ `url`**, et le résultat jamais lu comme un envoi. Le
  message est construit depuis `DOMAINE` (`src/data/legal.js`), jamais écrit
  en dur.
- Trois états pour le décompte : chargement, « Lecture impossible » avec
  « Réessayer », prêt.
- **Aucun module natif en R1.** Un vrai bouton « Copier » attendra
  `expo-clipboard`, installé et construit AVANT le code qui l'importe, avec une
  reconstruction déjà prévue (celle du PDF du lot 2c, ou R3).

### A.3 La page et la liste d'attente (R2)

- Une fonction Edge sans compte : toutes les issues en HTTP 200, CORS limité à
  `https://opus-project.com`, limites sur l'empreinte HMAC de l'adresse IP et
  de l'adresse e-mail (le modèle de la fonction `siret`), aucune lecture d'un
  code de parrain avant la confirmation.
- L'hébergement : `/i/*` et `/.well-known/*` servis sans redirection (le
  serveur d'aujourd'hui redirige `/i/…` et répond 300 sur `/.well-known/…`),
  `apple-app-site-association` en JSON.
- Avant R2 : relire sur Légifrance l'article de la LCEN qui fixe les mentions
  d'identification de l'éditeur (la loi SREN l'a peut-être déplacé) et
  corriger `legal.js` s'il le faut.

### A.4 Les textes

- **Politique de confidentialité** : ce qui est gardé (le code tapé, sa date,
  qui a invité qui), **pourquoi** — montrer au parrain le résultat de ses
  invitations et, **si Opus crée un jour des récompenses**, pouvoir compter
  les invitations faites avant (à annoncer dès la première collecte : une
  finalité se fixe à la collecte) —, sur quelle base (intérêt légitime),
  combien de temps, l'export, le retrait du lien (opposition).
- **« Ce que les autres voient de vous »** : votre parrain voit le nom de votre
  fiche, ou « une personne » si vous êtes particulier.
- **« Ce que nous ne collectons pas »** : « Opus ne lit jamais les contacts de
  votre téléphone. »
- **CGU** : le parrainage n'ouvre aucun droit tant qu'un règlement n'existe
  pas. `VERSION` change.
- Au registre des traitements : la liste d'attente et le parrainage.

### A.5 Les essais sur la vraie base

Parrain et filleuls sont tous des **comptes jetables**, à SIRET fictifs et
preuves `essai` ; **jamais le code d'un vrai compte**, en particulier pas le
vôtre. La suppression par le chemin de l'application emporte les parrainages
(clé `on delete cascade`). Les codes, eux, restent — c'est la règle — marqués
`essai`, donc exclus de tout décompte réel. Les inscriptions passent par
`/auth/v1/signup` et au navigateur, `enregistrer_vues` neutralisé.

### A.6 Chaque promesse, et ce qui la tient

| promesse | tenue par |
|---|---|
| le code ne change jamais, n'est jamais redonné | clé primaire, aucun droit d'écriture client, `libere_le` ; essai : 401/403 sur les trois verbes |
| un code n'empêche jamais l'inscription | le déclencheur d'inscription n'est PAS touché ; essai par `/auth/v1/signup` |
| aucun essai de code sans compte | aucune fonction exécutable par `anon` (`has_function_privilege`), une page qui ne demande rien à la base |
| un seul parrain, jamais soi-même, pas de cycle | clé primaire + `enregistrer_mon_parrain()` ; essai |
| le parrain ne voit que des noms de fiche et des nombres | `mes_filleuls()` seule porte, listes fermées, essai qui relit ce qu'elle rend |
| un blocage cache le nom | `est_masque()` dans `mes_filleuls()` et dans l'export ; essai |
| aucun contact lu, aucun envoi automatique, aucun presse-papiers lu | une garde de `verifier-legal` sur le modèle de celle de la position : refuse `expo-contacts`, `react-native-contacts`, `expo-sms`, `READ_CONTACTS`, `NSContactsUsageDescription`, toute lecture du presse-papiers, les adresses `sms:`, et toute fonction Edge qui enverrait une invitation |
| aucun montant, aucun « gagnez », jamais « vérifié » pour ce niveau | une constante du message et des textes relus par un contrôle (« gratuit », « gagnez », « offert », un montant en euros refusés) |
| le format est le même partout | `code-invitation.js` comparé à la fonction SQL et à la page sur un fichier de cas |

Un contrôle nouveau, `npm run verifier-parrainage`, fera tourner le module pur
sur le fichier de cas, et chaque contrôle sera éprouvé en cassant ce qu'il
surveille.
