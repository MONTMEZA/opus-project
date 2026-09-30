# Le référentiel des métiers — rapport

> Demandé dans `docs/DEMANDE-METIERS.md`, §21 : « à la fin, donne-moi un
> rapport ». Le voici. Construit le **30/09/2026**, après les trois
> décisions prises avec le propriétaire le même jour.

---

## Les trois décisions, et ce qu'elles ont changé

**1. Les spécialités : liste OU texte libre ? → Les deux.**
Le catalogue porte 124 spécialités rattachées à leur métier. Le champ de
texte libre ajouté le 29/09/2026 reste : aucune liste ne prévoit tout, et
c'est souvent ce qui n'était pas prévu qui distingue un artisan.

**2. `metiers text[]` ou des tables de liaison ? → Le tableau reste.**
Le document proposait `professional_trades` et `professional_specialties`.
Passer aux tables aurait voulu dire réécrire les règles RLS, les index, la
recherche, le tri des demandes et la Place des pros — pour un gain qui
n'arrive que le jour où un métier portera des données propres.

Ce qui est sorti dans une vraie table, c'est le **catalogue**. C'est lui le
problème, pas le rattachement : la contrainte `pro_metiers_check` recopiait
les douze noms à la main.

**3. Qui peut s'inscrire ? → Tout l'écosystème.**
Avec la conséquence à traiter : un avocat n'a pas d'assurance décennale, et
le badge « vérifié » ne veut rien dire pour lui. Les pièces justificatives
par catégorie **restent à construire** (voir « Ce qui reste » plus bas).

---

## Ce qui a été construit

### Le catalogue

| | |
|---|---|
| Catégories | **15** |
| Métiers | **92** |
| Spécialités | **124** |

**Une seule source : `src/data/catalogue-metiers.js`.** Le SQL du catalogue
n'est pas écrit à la main — il est **engendré** depuis ce fichier par
`npm run generer-catalogue`, qui réécrit la section 21.1 de `schema.sql`
entre deux repères. Deux choses engendrées l'une de l'autre ne divergent
pas ; c'est tout l'intérêt, puisque la divergence est précisément ce qui
avait fait refuser les montages en silence.

Les quinze catégories couvrent l'écosystème demandé au §7 : gros œuvre,
toiture, plomberie-CVC, électricité, menuiserie, finitions, isolation et
façade, terrassement-VRD, extérieur, démolition, construction, architecture
et maîtrise d'œuvre, bureaux d'études, géomètres et diagnostics, conseil et
juridique.

### La clé, pas le nom

Une fiche enregistre `macon`, jamais « Maçon ». Le jour où le libellé
changera, aucune ligne de la base n'aura à être réécrite — et une clé sans
accent ni majuscule ne se compare jamais de travers.

Le nom ne s'obtient que par `nomMetier(cle)`. Écrire la clé à l'écran
ressemblerait à une faute de frappe, donc personne ne le signalerait :
`scripts/captures-metiers.mjs` parcourt trois écrans et vérifie qu'aucune
clé ne s'affiche.

### Le sélecteur

`src/components/SelecteurMetiers.js`, et son champ `ChampMetier`. Un panneau
plein écran, pas un menu déroulant : sur un téléphone, un menu déroulant
classique fait quatre lignes de haut, se rate au doigt et cache ce qu'on
lisait.

Deux chemins, et c'est voulu :

- **on sait** — on tape « plomb », on voit Plombier, on appuie. Les
  catégories ne s'affichent même pas (§16 : personne ne doit avoir à
  comprendre notre classement) ;
- **on ne sait pas** — les catégories se déplient, et on découvre
  qu'« Économiste de la construction » existe.

La recherche voit aussi les **spécialités** (§13) : « mur de soutènement »
rend **Maçon**.

---

## Fichiers

### Créés

| Fichier | Ce qu'il fait |
|---|---|
| `src/data/catalogue-metiers.js` | le référentiel — la seule source |
| `src/components/SelecteurMetiers.js` | le panneau et le champ `ChampMetier` |
| `src/lib/texte.js` | `normaliser()`, sortie de `recherche.js` |
| `scripts/generer-catalogue.mjs` | engendre le SQL depuis le catalogue |
| `scripts/captures-metiers.mjs` | captures, mesure de frappe, chasse aux clés |

### Modifiés

`src/lib/metiers.js` (recherche, `nomMetier`, `motsDuMetier`,
`specialitesProposees`), `src/lib/recherche.js`, `src/lib/presentation.js`,
`src/lib/api.js`, `src/components/ChoixMetiers.js`,
`src/components/QuoteModal.js`, `src/components/PostCard.js`,
`src/components/VideoSlide.js`, `src/components/icons.js`,
`src/screens/DecouvrirScreen.js`, `src/screens/PlaceProScreen.js`,
`src/screens/CreerScreen.js`, `src/screens/DemandesScreen.js`,
`src/screens/AuthScreen.js`, `src/screens/ProfilEditScreen.js`,
`src/screens/ProfilPublicScreen.js`, `src/screens/MessagesScreen.js`,
`src/OpusApp.js`, `src/data/demo.js`, `src/data/urgences.js`,
`scripts/verifier-metiers.mjs`, `scripts/verifier-presentation.mjs`.

### Supprimé

`METIERS` dans `src/data/demo.js` — les douze chaînes qui étaient la
moitié du problème.

---

## Base de données

**Tables créées** — `metiers_categories` et `metiers_catalogue`
(`cle`, `nom`, `categorie`, `parent`, `synonymes`, `actif`, `ordre`,
`locale`). Une spécialité est une ligne dont `parent` désigne son métier :
deux tables auraient obligé à écrire deux fois chaque requête, pour une
hiérarchie qui n'a que deux niveaux.

Lecture publique (l'inscription demande un métier **avant** qu'un compte
existe), **aucune politique d'écriture** : seul l'administrateur y touche.

**Fonctions** — `metiers_connus(text[])` (la contrainte),
`metier_depuis_ancien_nom(text)` (la migration).

**Contrainte** — `pro_metiers_check` ne recopie plus rien : elle interroge
le catalogue. Deux choses qu'elle ne fait **pas**, et c'est voulu :

1. elle ne vérifie pas `actif` — désactiver un métier (§18) empêcherait
   sinon l'artisan concerné d'enregistrer son téléphone ou ses horaires ;
2. elle n'accepte que `parent is null` — une spécialité rangée comme métier
   consommerait un des quatre emplacements, ce que le §9 interdit.

**Migration** — 26 lignes converties sur la vraie base, réparties sur
`professional_profiles` (métiers **et** métier principal), `posts`,
`demandes`, `quote_requests`, `annonces_pro`, `metier_demandes`. Sept
valeurs distinctes, toutes reconnues, **aucune perdue**. Un seul libellé
change au passage : « Peintre » devient « Peintre en bâtiment ».

Vérifiée pour de vrai, et pas seulement sur le schéma d'aujourd'hui : une
base reconstruite depuis la version **d'avant** (`git show HEAD:…`),
remplie de fiches à l'ancienne, puis passée sous le nouveau schéma.

**Un défaut trouvé au passage, et corrigé** — `tient_les_metiers()`
refusait la migration elle-même sur les fiches vérifiées. Le verrou
s'appliquait à tout le monde, y compris à l'éditeur SQL. Il suit désormais
la règle déjà tenue par `tient_le_profil_pro()` : `auth.uid() = new.id`
reconnaît le professionnel lui-même, et `auth.uid()` vide laisse passer
l'administration. Ce n'est pas un relâchement — la règle RLS « chacun sa
fiche » exige `auth.uid() = id` pour qu'une mise à jour touche une ligne.
C'est aussi par là que passera le back-office qui validera `metier_demandes`.

---

## Les dix tests du §20

| | Test | Où c'est vérifié |
|---|---|---|
| 1 | 1 métier → accepté | PostgreSQL, essai 1 |
| 2 | 4 métiers → accepté | PostgreSQL, essai 2 · vraie base |
| 3 | un cinquième → refusé | PostgreSQL, essai 3 · vraie base |
| 4 | en supprimer un, en ajouter un autre | `ChoixMetiers`, capture 1 |
| 5 | fermer et rouvrir : les métiers sont là | **à faire sur le téléphone** |
| 6 | recherche « Maçon » | `verifier-metiers`, 3 contrôles |
| 7 | recherche « mur de soutènement » | `verifier-metiers` · capture 5 |
| 8 | recherche « architecte » | `verifier-metiers` |
| 9 | recherche « avocat construction » | `verifier-metiers` (et PAS l'avocat immobilier) |
| 10 | contournement par l'API → refusé | PostgreSQL essais 3-6 · vraie base |

Le test 5 est le seul qui ne puisse pas être fait ici : il demande de fermer
l'application et de la rouvrir sur un vrai téléphone.

**En plus des dix** : `npm run verifier-metiers` tient 40 contrôles — la
cohérence du catalogue (clés en double, clés accentuées, spécialité
orpheline, catégorie vide), l'accord entre le SQL engendré et le
JavaScript, la table de migration des deux côtés, et le fait qu'aucun
fichier ne compare plus un libellé de métier.

---

## Ce qui reste

1. **Les spécialités proposées selon les métiers choisis**, et la file
   d'attente pour celles écrites à la main. Le catalogue les porte déjà et
   `specialitesProposees()` sait les rendre ; c'est l'écran qui manque.
2. **Les pièces justificatives par catégorie** (décision 3). Aujourd'hui,
   un avocat qui s'inscrit se voit demander une assurance décennale qu'il
   n'a pas. À construire avec le back-office.
3. **L'administration du référentiel** (§18) : ajouter, renommer,
   désactiver un métier. La base est prête — `actif`, et aucune politique
   d'écriture. C'est la section 2.1 de `docs/A-FAIRE.md`.
4. **L'internationalisation** (§17) : la colonne `locale` existe et vaut
   `fr-FR`. Ajouter une langue voudra dire ajouter des lignes, pas
   réécrire le schéma. Rien d'autre n'est fait, et rien d'autre n'est
   nécessaire aujourd'hui.

---

## Ce qui n'a pas pu être vérifié ici

- **Le rendu et la fluidité sur iPhone.** La frappe dans le sélecteur a été
  mesurée au navigateur avec le processeur bridé six fois : **64 ms par
  lettre**, contre **67 ms** pour la recherche de la Place des pros mesurée
  juste après, de la même façon. Ce qui compte est la comparaison, pas le
  chiffre : le sélecteur n'est pas plus lourd qu'un champ déjà en service.
  Ces millisecondes ne se comparent pas à celles d'une autre session — la
  façon de mesurer change le résultat.
- **Le défilement au doigt** dans une liste de 92 lignes. Sur ordinateur,
  une zone défilante répond à la molette, pas au glissement.
