# Opus-Project — règles du projet

Réseau social des professionnels du bâtiment. React Native + Expo (SDK 57),
JavaScript, Supabase. Le propriétaire du projet **débute en développement** :
tout ce qui est écrit pour lui — messages d'erreur, README, commentaires —
doit être en **français** et expliquer le pourquoi, pas seulement le comment.

## La règle qui a déjà coûté cher

**Le mode démo masque toutes les erreurs de base de données.**

Sans fichier `.env`, `src/lib/api.js` remplace chaque écriture par `noop`.
Un écran peut donc paraître parfait dans les tests pendant que la base
refuserait l'enregistrement.

Conséquence, sans exception :

> Toute écriture nouvelle ou modifiée doit être **insérée pour de vrai dans
> PostgreSQL** avant d'être annoncée comme fonctionnelle.

C'est précisément ce qui a manqué le jour où le format `montage` a été ajouté
à l'application sans être ajouté à la contrainte `posts_type_check` : la base
refusait chaque montage, et les essais en mode démo n'y voyaient rien.

### L'application peut prendre de l'avance sur la base

Écrire `schema.sql` ne l'applique nulle part. Le propriétaire doit le rejouer
dans Supabase → SQL Editor, et il ne le fait pas forcément : six commits ont
ainsi tourné contre une base qui ignorait `metiers`, `budget`, `annonces_pro`
et `metier_demandes`. L'enregistrement du profil échouait en silence, la Place
des pros restait vide.

**Après toute modification de `schema.sql`, vérifier l'état RÉEL avec le
connecteur Supabase** — une requête sur `information_schema` suffit — et
appliquer la migration soi-même plutôt que de compter sur un copier-coller.

Pour reproduire fidèlement une panne, la bonne base de départ n'est pas
`schema.sql` d'aujourd'hui mais **celle de la version que le propriétaire a
réellement appliquée** (`git show <commit>:supabase/schema.sql`).

### Le piège Metro qui a coûté une heure : asynchrone + ternaire

Cette forme **fait échouer la construction**, sans indiquer ni la ligne ni la
cause :

```js
export const x = !hasSupabase
  ? async (options = {}) => { … }   // <- paramètre par défaut ET corps en bloc
  : async (options = {}) => { … };
```

    SyntaxError: src/lib/api.js: Property id of VariableDeclarator expected
    node to be of a type ["LVal","VoidPattern"] but instead got
    "AssignmentExpression"

Le même fichier passe pourtant **avec Babel seul**, y compris avec le
préréglage d'Expo et le greffon `react-native-worklets` : l'erreur ne sort
que de Metro. Trouvé par dichotomie — `async (o = {}) => (expression)`
construit, `async (o = {}) => { bloc }` dans la PREMIÈRE branche d'un
ternaire, non.

**La parade : deux fonctions nommées, et le choix à la fin.**

```js
async function xDemo(options = {}) { … }
async function xSupabase(options = {}) { … }
export const x = hasSupabase ? xSupabase : xDemo;
```

C'est de toute façon plus lisible. Le reste du fichier garde sa forme
`!hasSupabase ? noop : async () => {…}` — elle n'a pas de paramètre par
défaut, donc elle ne déclenche rien.

### `npm audit fix --force` DÉTRUIRAIT le projet

Constaté le 30/09/2026. `npm install` affiche « 11 vulnerabilities » et
propose deux commandes. La seconde est un piège :

```
npm audit fix --force
→ Will install expo@46.0.21, which is a breaking change
→ added 471 packages, removed 57 packages
```

**Expo 57 redescendrait en 46.** C'est npm qui « corrige » une faille en
ramenant la dépendance à une version antérieure : il ne sait pas qu'Expo 46
ne fait plus tourner ce projet.

Ce que disent réellement ces alertes, une fois les doublons écartés — il
n'y a que DEUX causes, pas onze :

| paquet | d'où il vient | ce qu'il sert |
|---|---|---|
| `brace-expansion` | expo → @expo/fingerprint → minimatch | lire des motifs de fichiers |
| `uuid` | expo → @expo/config-plugins → **xcode** | générer un projet iOS natif |

Les deux sont **des dépendances d'Expo lui-même**, utilisées par les outils
qui tournent sur l'ordinateur pendant `npm start`. **Aucune ne part dans
l'application installée sur le téléphone.** Et `xcode` ne sert qu'au
`prebuild`, que ce projet ne fait jamais puisqu'il tourne dans Expo Go.

> **`npm audit fix` tout court : oui.** Vérifié — il n'a touché qu'une
> ligne du verrou (`brace-expansion` 5.0.9 → 5.0.12), n'a pas modifié
> `package.json`, a supprimé la seule alerte « high », et
> `npx expo install --check` répond toujours « up to date ».
>
> **`npm audit fix --force` : jamais.** Les dix alertes « moderate » qui
> restent ne se corrigent qu'en attendant qu'Expo mette à jour `xcode`.

### Les versions de paquets Expo se désalignent toutes seules

`npm install` d'un nouveau paquet peut laisser les autres en arrière.
`npx expo install --check` le dit, `--fix` le répare. Un `expo-image-picker`
en retard sur la version attendue par Expo Go casse le choix des photos sans
qu'aucune ligne de code n'ait changé. **À lancer après chaque ajout de
dépendance.**

### En particulier : les contraintes `check (... in (...))`

`schema.sql` en contient une dizaine (types de publication, statuts de devis,
métiers d'urgence, statuts de vérification…). **Toute nouvelle valeur envoyée
par l'application doit être ajoutée à la contrainte correspondante**, et sur
une base déjà en place il faut la refaire explicitement :

```sql
alter table public.x drop constraint if exists x_champ_check;
alter table public.x add constraint x_champ_check check (champ in (...));
```

`alter table ... add column if not exists` ne touche pas aux contraintes.

## Ce qu'il reste à faire

`docs/A-FAIRE.md` tient la liste, par ordre de priorité. **À relire au début
d'une session qui parle de la suite du projet**, et à mettre à jour quand un
point est traité.

### Le cahier des charges du propriétaire (remis le 29/09/2026)

`docs/CAHIER-DES-CHARGES.md` — sa vision complète, en 28 sections et
12 phases : logiciel de gestion du bâtiment piloté par un agent IA, dont le
réseau social est le module 9. L'original PDF est à côté et **fait foi**.

`docs/LECTURE-CAHIER-DES-CHARGES.md` — mon analyse, à ne pas confondre avec
le document. **À lire avant de construire quoi que ce soit de nouveau.**
Trois points en sortent, à ne pas redécouvrir :

1. **Un compte = un artisan aujourd'hui.** Il n'existe ni entreprise, ni
   salarié, ni rôle. Le cahier des charges en a besoin à cinq endroits, et le
   jour où ça changera, **toutes les règles RLS seront à réécrire**. En
   attendant : ne rien construire qui enfonce cette hypothèse.
2. **Le côté particulier n'apparaît NULLE PART** dans le cahier des charges
   (demandes de travaux, SOS, profil public particulier). Le propriétaire a
   tranché le 29/09/2026 : **c'est un oubli du document, on les garde.**
   Conséquence à retenir : le cahier des charges décrit le côté PRO, ce n'est
   pas une description exhaustive d'Opus — ne jamais déduire qu'une
   fonctionnalité absente du document est abandonnée, demander.
3. **Ne plus ajouter d'action IA « à la main »** dans la fonction Edge `ai`.
   La prochaine se construit avec le journal d'audit et les permissions du
   §21, ou elle sera à refaire.

### Le référentiel des métiers — fait le 30/09/2026

`docs/DEMANDE-METIERS.md` — le texte du propriétaire, qui fait foi.
`docs/RAPPORT-METIERS.md` — ce qui a été construit, et ce qui reste.

**Il n'y a plus qu'une source : `src/data/catalogue-metiers.js`.**
15 catégories, 92 métiers, 124 spécialités. Le SQL du catalogue est
**engendré** depuis ce fichier (`npm run generer-catalogue`), et
`npm run verifier-metiers` refuse de passer s'ils ont divergé.

> **Une fiche enregistre `macon`, jamais « Maçon ».** Le nom ne s'obtient
> que par `nomMetier(cle)` — écrire la clé à l'écran ressemble à une faute
> de frappe, donc personne ne la signale. `captures-metiers.mjs` parcourt
> trois écrans et vérifie qu'aucune clé ne s'affiche.

Les trois décisions du propriétaire, prises le 30/09/2026 :

1. **Spécialités** : les deux. La liste du catalogue d'abord, et le texte
   libre pour ce qu'aucune liste n'avait prévu.
2. **Rangement** : `metiers text[]` reste — passer à des tables de liaison
   aurait voulu dire réécrire toutes les règles RLS. C'est le CATALOGUE qui
   est sorti dans une vraie table.
3. **Qui peut s'inscrire** : tout l'écosystème, avec des pièces
   justificatives **par catégorie** — un avocat n'a pas d'assurance
   décennale, et son badge « vérifié » ne voudrait rien dire.

Trois pièges rencontrés en le construisant, à ne pas redécouvrir :

- **La contrainte ne vérifie PAS `actif`.** Désactiver un métier (§18 de la
  demande) empêcherait sinon l'artisan concerné d'enregistrer son téléphone
  ou ses horaires. On le retire de ce qui est PROPOSÉ, on ne casse pas son
  compte.
- **Elle n'accepte que `parent is null`.** Une spécialité rangée dans
  `metiers` consommerait un des quatre emplacements, ce que le §9 interdit.
- **Le verrou des métiers d'un profil vérifié n'avait pas d'échappatoire.**
  `tient_les_metiers()` refusait la migration elle-même, lancée depuis
  l'éditeur SQL. Il suit désormais la règle déjà tenue par
  `tient_le_profil_pro()` : `auth.uid() = new.id` reconnaît le
  professionnel, et `auth.uid()` vide laisse passer l'administration.
  C'est aussi par là que passera le back-office.

Les trois points bloquants — signalement et blocage, suppression de compte,
textes légaux — sont **faits** (21/09/2026).

### Le propriétaire n'a PAS de société ni de SIRET (constaté le 29/09/2026)

Ne jamais lui écrire des mentions légales de société : ce serait faux, et une
mention légale fausse engage sa responsabilité. `src/data/legal.js` porte un
champ **`STATUT`** (`essai` · `particulier` · `micro` · `societe`) qui décide
de ce que la loi exige et de ce que les écrans affichent. Il vaut `'essai'` :
l'application n'est pas ouverte au public, il n'y a donc rien à publier.

`npm run verifier-legal` refuse de passer si le statut change sans que les
champs correspondants soient remplis. **À lancer avant toute mise en ligne.**

L'autre geste qui n'appartient qu'à lui : activer la protection contre les
mots de passe compromis dans Supabase → Authentication → Policies.

## Modération : ce qui ne se discute plus

Une règle a été ajoutée au projet le jour où le blocage a été construit, et
elle vaut pour tout ce qui suivra :

> **Un blocage est symétrique, et il est tenu par la BASE.**
> Si A bloque B, aucun des deux ne voit plus les contenus de l'autre et aucun
> des deux ne peut plus écrire à l'autre. Filtrer côté écran ne protège
> personne : un client modifié verrait tout.

Deux pièges rencontrés, à ne pas redécouvrir :

1. **Une règle RLS qui appelle une fonction interdite à l'appelant ÉCHOUE**,
   elle ne filtre pas. « permission denied for function ». Vérifié sur
   PostgreSQL. `est_masque()` doit donc rester exécutable par
   `authenticated`.

   **Et cela vaut AUSSI pour les contraintes `check`** — reconstaté le
   30/09/2026 avec `horaires_valides()`, révoquée « par prudence » parce
   qu'elle ne sert qu'à une contrainte. Résultat : plus aucun horaire ne
   s'enregistrait. Une contrainte s'exécute avec les droits de CELUI QUI
   ÉCRIT, pas avec ceux du propriétaire de la table.

   > **Toute fonction appelée par une policy ou une contrainte reste
   > exécutable par `authenticated`.** Ce n'est pas un relâchement : une
   > fonction qui ne lit aucune table et n'est pas `security definer` ne
   > donne accès à rien.
2. Supabase signale alors, à juste titre, les fonctions `security definer`
   appelables **sans être connecté**. D'où deux politiques de lecture par
   table de contenu : la vraie règle `to authenticated`, et la lecture
   publique `to anon` qui n'appelle pas la fonction. Un visiteur n'a bloqué
   personne : il n'a rien à masquer.

### Une règle RLS filtre des LIGNES, jamais des COLONNES

Constaté le 29/09/2026, sur la vraie base : `public.users` est lisible par
tout le monde (`for select using (true)`) parce que le fil affiche des noms
et des photos. La même autorisation laissait lire **l'adresse e-mail, le
téléphone et les coordonnées GPS** de chacun, avec la clé publiable, sans
même avoir de compte — alors que l'écran promet au particulier : « il ne
s'affiche nulle part ».

Ce qui protège une colonne, ce sont les **droits de colonne** (`grant
select (col)`), pas la politique RLS. Et deux pièges :

1. **`revoke select (colonne)` ne retire RIEN** tant que le rôle possède le
   droit de lire la table entière — ce que Supabase accorde d'office. Il
   faut `revoke select on <table>`, **puis** rendre colonne par colonne.
   Le premier essai est passé sans erreur en ne protégeant rien.
2. **`select *` cesse alors de fonctionner** pour ces rôles, et c'est voulu.
   Pour lire SA PROPRE ligne entière, une fonction `security definer` avec
   `where id = auth.uid()` — c'est ce que fait `mon_compte()`.
   Attention à toute fonction `security invoker` qui fait `to_jsonb(u)` :
   elle lit toutes les colonnes et échoue. `mes_donnees()` (l'export RGPD)
   est passée par `mon_compte()` pour cette raison.

Et l'ordre du fichier compte : une fonction SQL est contrôlée à sa création,
donc `mon_compte()` est déclarée **avant** `mes_donnees()`, pas dans la
section qui l'explique.

### Le badge ne se décerne pas soi-même

Même journée, même famille de défaut : la règle d'écriture d'un profil pro
était « chacun sa fiche », toutes colonnes confondues. Un client modifié
pouvait donc s'envoyer `kbis_valide = true, assurance_valide = true`, et le
déclencheur en tirait consciencieusement `verifie = true`.

Le déclencheur `tient_le_profil_pro()` remet les colonnes de vérification à
leur ancienne valeur **dès que c'est le professionnel lui-même qui écrit**.
On le reconnaît à `auth.uid() = new.id` ; depuis l'éditeur SQL ou une Edge
Function, `auth.uid()` est `null` et le verrou laisse passer.

> **Toute colonne qu'un humain doit valider se protège par un déclencheur.**
> Aujourd'hui : `verifie`, `kbis_valide`, `assurance_valide`, `rge`,
> `verification_note`.

### Un commentaire auquel on a répondu ne se récrit plus

Ajouté le 30/09/2026, à la demande du propriétaire, et c'est la même famille
que les deux précédentes : ce qui engage quelqu'un d'AUTRE se ferme.

Pouvoir corriger son texte pour toujours permet de réécrire une conversation
entière — j'écris « ce prix me paraît trop bas », on me répond « d'accord »,
je remplace ma phrase, et la réponse cautionne ce que son auteur n'a jamais
lu. La mention « · modifié » dit QUE le texte a bougé, jamais CE QUI a bougé.

Interdire toute correction ne réglait rien non plus : supprimer un
commentaire emporte ses réponses (`on delete cascade`), donc réparer une
faute de frappe aurait détruit la discussion. D'où la règle tenue par la
base :

> **Le texte d'un commentaire est libre tant que personne n'a écrit après
> lui dans le même fil, et figé pour toujours ensuite.** Code d'erreur
> `OP001`, section 20.1 bis de `schema.sql`.

Deux détails à ne pas redécouvrir :

1. **Le fil n'a que deux niveaux, donc une réponse n'a jamais d'enfant.**
   Regarder par `parent_id` laisserait toutes les réponses modifiables à
   vie. On raisonne par FIL : racine = `coalesce(parent_id, id)`, et on
   cherche un message plus récent dans le même fil.
2. **La fonction est `security definer`, et il le faut.** La politique de
   lecture masque les commentaires des personnes bloquées : avec les droits
   de l'appelant, **bloquer celui qui a répondu aurait ROUVERT le texte**.
   Vérifié sur PostgreSQL — la réponse devient bien invisible à l'auteur, et
   le verrou tient quand même.

La publication, elle, reste corrigeable : sa légende n'est pas un tour de
parole.

Et une règle RGPD qui a la même force :

> **Ce qui concerne des TIERS s'anonymise, il ne se supprime pas.**
> Avis, commentaires, signalements : `on delete set null` plus un drapeau
> `auteur_supprime`. Effacer un avis parce que son auteur s'en va ferait
> remonter la note d'un artisan qui n'a rien demandé.

Les listes de motifs et de cibles sont contrôlées par la base :
`npm run verifier-moderation`.

## Où je tourne, et ce que le propriétaire a réellement

Les sessions de travail s'exécutent **dans le cloud**, dans un conteneur qui a
cloné le dépôt — pas sur l'ordinateur du propriétaire. Celui-ci travaille
**depuis son navigateur**, avec **PowerShell** pour lancer l'application, et
**n'a pas la commande `claude`** installée.

Conséquence : ne jamais lui donner une instruction de ligne de commande sans
avoir vérifié qu'elle s'applique à SON poste, et ne jamais supposer qu'une
configuration faite chez lui change quelque chose ici. Une erreur déjà commise
deux fois de suite.

Ce qui fonctionne pour lui : les connecteurs de **claude.ai** (Paramètres →
Connecteurs). Le connecteur **Supabase** y est installé : il donne accès à la
vraie base du projet — schéma, contraintes, données, fichiers du stockage,
journaux et alertes de sécurité. **S'en servir pour vérifier** plutôt que de
lui faire coller des résultats de requêtes.

## Comment vérifier

```bash
# 1. le SQL, sur un vrai PostgreSQL, DEUX FOIS (il doit être rejouable)
psql ... -f supabase/schema.sql      # puis une seconde fois : aucune erreur

# 2. insérer réellement la ligne que l'application produira

# 3. l'application, dans un navigateur
npx expo export --platform android   # le bundle doit passer
npx expo start --web                 # puis Playwright + /opt/pw-browsers
```

Les captures d'écran valent mieux qu'une affirmation. Ce qui n'a pas pu être
vérifié ici (appareil photo, lecture vidéo réelle, notifications push) doit
être **dit explicitement** dans la réponse et dans le message de commit.

### Les gestes : `PanResponder` ne voit rien au-dessus d'une vue native

`VideoView` (expo-video), comme toute vue native, reçoit la touche **avant**
JavaScript. Un `PanResponder` posé autour ne reçoit donc jamais le geste : le
glissement du fil vidéo n'a jamais fonctionné pour cette seule raison, alors
qu'il marchait au-dessus des dégradés de démonstration — d'où l'impression
d'un bug capricieux.

Pour tout geste : **`react-native-gesture-handler`**, qui arbitre côté natif,
avec `GestureHandlerRootView` à la racine (`App.js`). Et `pointerEvents="none"`
sur les `VideoView`, qui n'ont de toute façon aucune commande.

Pour départager un geste horizontal d'une liste qui défile verticalement :
`activeOffsetX` (px avant de prendre la main) et `failOffsetY` (px verticaux
qui rendent la main). Au moindre doute, c'est le défilement qui doit gagner.

Le SENS attendu, celui de TikTok et d'Instagram : le doigt part à **gauche**
pour découvrir la page de l'artisan, à **droite** pour revenir au fil. On
pousse le contenu de côté pour voir ce qu'il y a derrière.

Et un écran qui arrive doit être posé **juste à côté**, comme la page suivante
d'un carrousel, avec son contenu calé contre le bord par lequel il entre.
Centré, ce contenu reste caché par la vidéo pendant tout le geste : on ne voit
qu'une bande noire, et le glissement paraît vide.

### Une FlatList monte DIX éléments d'un coup

Constaté sur iPhone le 29/09/2026, et impossible à voir ici : au démarrage,
« le clic marche mais plus rien ne défile », pendant quelques secondes, puis
tout revient. Ce n'est pas le défilement qui est cassé — c'est le premier
rendu qui bloque le téléphone.

`initialNumToRender` vaut **10** par défaut. Dans le fil vidéo, cela faisait
dix diapositives plein écran, donc **dix lecteurs vidéo** créés ensemble — et
`VideoMedia` charge la vidéo dès le montage, même en pause. Dans le fil
classique, 5,8 écrans de contenu montés avant le premier affichage, photos
comprises.

> **Toute liste longue règle `initialNumToRender`, `maxToRenderPerBatch` et
> `windowSize`.** Pour un fil façon TikTok : `windowSize={3}` — la
> précédente, celle qu'on regarde, la suivante.

Même principe pour un carrousel : les emplacements restent tous là (sinon il
ne sait plus où s'arrêter), mais on ne **monte** que la photo affichée et ses
voisines.

Et le corollaire : un écran qui répond aux appuis n'est pas un écran prêt.
Le navigateur de test, lui, ne montre rien de tout cela — il a la mémoire et
le processeur d'un ordinateur. Ce qui se mesure ici, c'est le **nombre de
nœuds et d'écrans de contenu montés** ; c'est un bon indicateur indirect.

### Un champ de saisie ne re-rend que LUI

Constaté sur iPhone le 29/09/2026 : « dans Découvrir, on ne peut pas écrire
dans le champ de l'assistant IA ». Au navigateur, il se remplissait
parfaitement. La différence : le processeur.

On peut la reproduire — **Playwright sait brider le processeur** :

```js
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
```

Ce que cela a donné, en millisecondes par lettre :

| | avant | après |
|---|---|---|
| Assistant IA | **219** | 26 |
| Découvrir, recherche | 74 | 21 |
| Place des pros | 93 | 29 |

Deux causes, et la seconde est la moins évidente :

1. **L'état de saisie vivait trop haut.** `aiQuery`, `search` et
   `filterMetier` étaient dans `OpusApp` : chaque lettre re-rendait TOUS les
   écrans. Descendus dans l'écran : 219 → 152 ms. Mieux, toujours
   inutilisable.
2. **Un écran entier se re-rend pour une lettre.** Il faut que le champ soit
   dans SON PROPRE composant, avec son texte. C'est ce qui fait passer de
   152 à 26 ms.

> **Un champ de recherche = un composant, avec son texte à lui.** Le
> filtrage part quand la frappe retombe (`useRechercheDifferee`,
> `src/lib/frappe.js`), jamais à chaque lettre.

Et le piège rencontré en corrigeant : poser le différé **dans l'écran** ne
sert à rien — l'écran se redessine quand même, et le minuteur en plus coûte
du temps. Mesuré : 93 ms avant, **180 ms** avec le différé seul, 29 ms une
fois le champ isolé. Ce qui compte, c'est **où vit le texte**.

### La carte : une image, pas une bibliothèque de cartographie

Ajoutée le 30/09/2026. `react-native-maps` existe et fonctionne dans Expo
Go (vérifié dans les docs du SDK 57) — il n'a pourtant pas été pris, et il
faut savoir pourquoi avant de le proposer à nouveau :

> **Une carte qu'on peut agrandir finit par montrer la rue.** Beaucoup
> d'artisans déclarent l'adresse de leur MAISON. « Se déplace jusqu'à
> 30 km » ne dit pas où ils habitent ; une carte zoomable, si.

`src/lib/tuiles.js` fabrique donc le damier d'images à la main, avec un
`ZOOM_MAX` qui est **un verrou, pas un réglage** — et un point au centre,
jamais une épingle. Trois bénéfices en plus : aucune dépendance (donc aucun
risque de devoir quitter Expo Go), le même rendu au navigateur et sur le
téléphone (donc ça se vérifie ici), et des calculs purs contrôlés par
`npm run verifier-carte`.

Le piège que ces calculs contiennent : **le cosinus de la latitude**. La
projection Web Mercator étire les distances vers les pôles, donc un rayon
de 30 km sans ce cosinus serait juste à l'équateur et faux partout en
France. Et le zoom s'arrondit **vers le bas**, sinon le cercle déborde du
cadre une fois sur deux.

Les fonds viennent de la **Géoplateforme de l'IGN** (`data.geopf.fr`) :
données publiques, sans clé depuis la bascule des géoservices. La mention
« © IGN » sur la carte est la condition d'usage — ne pas la retirer.

Et pour modifier le rayon : **un curseur, pas le bord du cercle.** Sur un
téléphone, viser un trait de 2 px pendant que la carte interprète le doigt
comme un déplacement, c'est le même piège que le glissement du fil vidéo.

#### Les tuiles ne partent pas depuis le conteneur de travail

Le navigateur de test n'a aucun accès direct à l'extérieur : tout passe par
le mandataire de l'agent, qui n'accepte que des tunnels HTTPS. Sans rien
faire, **les tuiles ne partent jamais et la carte reste grise** — ce qui
ressemble beaucoup à un bug du code. Lancer Chromium AVEC le mandataire ne
marche pas davantage : son option de contournement pour `localhost` est
ignorée, et c'est alors le serveur Expo qu'on n'atteint plus.

La seule voie qui marche, et c'est celle de `scripts/captures-carte.mjs` :
laisser le navigateur tranquille et **intercepter les seules adresses de
l'IGN** (`page.route`), qu'on va chercher avec `curl`. Prévoir des essais
répétés : le mandataire coupe environ une connexion sur cinq — vérifié en
appelant la même adresse cinq fois, quatre 200 et un échec.

### Ce qui se vérifie au navigateur, et ce qui ne s'y vérifie pas

Playwright reproduit **les gestes à la souris** : un glissement latéral, un
appui long suivi d'un déplacement, tout cela se teste et doit être testé —
c'est ainsi qu'a été trouvé le point de départ qui se recalculait à chaque
mouvement et faisait filer la photo hors de l'écran.

Ce qu'il ne reproduit pas : le **défilement au doigt** (sur ordinateur, une
zone défilante répond à la molette, pas au glissement). L'arbitrage entre un
glissement horizontal et un défilement vertical ne peut donc **pas** être
vérifié ici. À dire explicitement.

### Ce que le navigateur de test ne sait PAS faire

Le Chromium fourni avec Playwright est une version allégée, **sans les codecs
propriétaires**. Vérifié : `canPlayType` renvoie « rien » pour
`video/quicktime` ET pour `video/mp4; codecs=avc1`, et « maybe » seulement
pour WebM.

Conséquence : **aucune vidéo du projet ne se lit dans ce navigateur.** Un
lecteur y reste à `readyState 0`, et les erreurs « play() interrupted by
pause() » qui en découlent sont des artefacts du test, pas des défauts du
code. Ne pas chercher à les corriger.

Ce qu'on peut y vérifier malgré tout : qu'un lecteur est bien monté, quelle
source il porte, et combien il y en a. C'est déjà beaucoup. La fluidité
réelle, elle, ne se juge que sur le téléphone.

## Principes tenus depuis le début

- **Les secrets ne vivent jamais dans l'application.** La clé Anthropic est
  dans une Edge Function Supabase. Même règle pour toute clé à venir.
- **Les règles métier sont tenues par la base, pas par l'écran.** Badge
  vérifié, partenariats consentis, profondeur des commentaires, notifications :
  des triggers et des règles RLS, pour qu'un client modifié ne puisse pas les
  contourner.
- **Les documents (Kbis, assurance) restent privés** dans l'espace `documents`
  de Supabase Storage, protégé par RLS. Ne jamais les déplacer ailleurs.
- **`schema.sql` est rejouable**, toujours : `drop policy if exists` avant
  chaque policy, `add column if not exists`, aucune donnée perdue.
- **Le fil d'actualité est réservé aux professionnels.** Les particuliers
  aiment, commentent, partagent, publient des demandes — mais ne publient pas.

## Identité visuelle — ne pas réinterpréter

```
--ink: #1A1B19   --bg: #E7E4DC   --surface: #FFFFFF   --line: #CFC9BB
--accent: #E85C1F   --accent-2: #1B4B6B   --muted: #726E63
```

Titres et boutons en **Oswald**, textes en **Inter**. La bande de chantier
diagonale
(`repeating-linear-gradient(135deg, #E85C1F 0 10px, #1A1B19 10px 20px)`,
5–6 px) est la signature de l'application.

### Les bords : une règle, pas un goût

La règle « angles vifs partout sauf les avatars » a été précisée avec le
propriétaire, parce qu'elle empêchait une chose qu'il voulait — des boutons
plus arrondis — sans protéger ce qu'elle servait vraiment à protéger.

> **Angle vif = la STRUCTURE.** Cartes, champs de saisie, blocs, sections,
> bandeaux, listes. Tout ce qui PORTE l'information.
>
> **Arrondi = ce qui FLOTTE au-dessus, et sur quoi on appuie.** Boutons,
> puces de filtre, pastilles, étiquettes posées sur une image, menus
> surgissants. Avatars toujours ronds.

Ce n'est pas un assouplissement : c'est ce qui rend l'interface lisible au
doigt. Un bord arrondi dit « je suis détaché du fond, appuie sur moi » ; un
bord vif dit « je suis le fond, lis-moi ». Arrondir une carte ou un champ
reste interdit — c'est là que se perdrait l'identité.

Les valeurs sont dans `src/theme.js` (`R.vif`, `R.doux`, `R.gelule`) : ne pas
écrire un rayon en dur.

### Les échelles : `src/theme.js` fait foi

Un relevé sur `src/` avait trouvé **20 tailles de police**, **24 valeurs
d'espacement** (dont 97 usages sur des nombres impairs), **14 rayons** et
**5 opacités d'ombre utilisées chacune une seule fois**.

`theme.js` porte désormais `T` (8 tailles), `interligne()`, `S` (grille de
4 px), `R` (3 rayons) et `SH` (3 ombres). **Toute nouvelle valeur passe par
ces échelles.** Les fichiers déjà écrits migrent au fur et à mesure : une
valeur en dur qui traîne encore continue de fonctionner, elle n'est pas une
urgence.

## Dépendances : vérifier avant de proposer

Deux paquets ont déjà été écartés après vérification sur npm :
`ffmpeg-kit-react-native` (déprécié, abandonné en janvier 2025) et
`react-native-video-processing` (aucune version depuis 2022). Toujours
regarder la date de la dernière publication avant de conseiller un paquet.

Et se rappeler qu'un **module natif impose un development build** : il ne
fonctionne pas dans Expo Go, ce qui est aujourd'hui le seul moyen de test du
propriétaire.
