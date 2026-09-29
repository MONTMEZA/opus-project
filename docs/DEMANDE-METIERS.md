# Demande du propriétaire — système centralisé des métiers BTP

> Reçue le **29/09/2026**. Ce fichier est le texte du propriétaire, **tel
> qu'il l'a écrit**. Il fait foi.
>
> Mon audit, les trois décisions à prendre avant de coder et le moment où ce
> chantier s'ouvre sont dans **`docs/A-FAIRE.md`, section 2.0** — à lire
> avec ce document, jamais à sa place.

---

## MODIFICATION IMPORTANTE À APPLIQUER À OPUS-PROJECT — SYSTÈME CENTRALISÉ DES MÉTIERS BTP

Je veux modifier et améliorer la manière dont les métiers sont gérés dans toute l'application Opus-Project.

**IMPORTANT :** Avant toute modification, analyse l'architecture actuelle du projet et réutilise au maximum les composants, données et design existants.

Ne casse aucune fonctionnalité existante.
Ne modifie pas inutilement le design général actuel.
La modification doit être propre, centralisée, réutilisable et évolutive.

### 1. RÈGLE PRINCIPALE : 4 MÉTIERS MAXIMUM PAR PROFESSIONNEL

Chaque compte PROFESSIONNEL Opus-Project doit pouvoir sélectionner :
MINIMUM 1 métier principal, MAXIMUM 4 métiers actifs simultanément.

Exemple — Entreprise Dupont. Métiers : Maçon, Carreleur, Façadier, Terrassier.
Affichage : `4 / 4 métiers sélectionnés`

Le professionnel ne doit JAMAIS pouvoir enregistrer un cinquième métier.

Cette règle doit être contrôlée dans l'interface utilisateur, dans les
formulaires, dans la logique métier, côté serveur/backend, et au niveau de la
base de données si cela est pertinent.

Il ne faut donc pas uniquement bloquer visuellement le cinquième métier. La
règle « maximum 4 » doit être réellement sécurisée.

### 2. LES MÉTIERS RESTENT MODIFIABLES

Le professionnel doit pouvoir modifier ses métiers ultérieurement.

Créer dans *Profil professionnel → Modifier mon profil → Métiers et
spécialités* une interface permettant d'ajouter un métier, d'en supprimer un,
d'en remplacer un, et de modifier ses spécialités. Mais toujours avec
MAXIMUM 4 MÉTIERS ACTIFS.

À 4, le bouton d'ajout doit être désactivé ou les autres résultats non
sélectionnables, avec un message clair :

> « Vous pouvez sélectionner jusqu'à 4 métiers maximum. Supprimez un métier
> pour en sélectionner un autre. »

### 3. SUPPRIMER LES GRANDES GRILLES DE CASES MÉTIERS

Je ne veux plus avoir partout dans l'application de grandes listes ou grilles
de boutons du type `[ Maçon ] [ Plombier ] [ Électricien ] …`. Cela devient
rapidement illisible lorsque le catalogue contient beaucoup de professions.

À la place, créer un composant moderne et réutilisable de sélection de métier.

### 4. CRÉER UN « METIER SELECTOR » GLOBAL

Créer un composant central réutilisable dans toute l'application — par
exemple `TradeSelector`, ou un nom cohérent avec l'architecture existante.

Interface : `Métier  [ 🔍 Rechercher un métier... ▾ ]`

Lorsque l'utilisateur clique : ouvrir un menu déroulant / bottom sheet /
modal moderne selon ce qui correspond le mieux au design actuel d'Opus.

En mobile, privilégier une expérience confortable avec : champ de recherche,
résultats instantanés, catégories, scroll fluide, sélection simple.

### 5. RECHERCHE INSTANTANÉE

L'utilisateur ne doit pas être obligé de parcourir toute la liste.

- « maç » → Maçon, Maçonnerie générale, Maçon du patrimoine…
- « archi » → Architecte, Architecte d'intérieur, Architecte paysagiste…
- « avocat » → Avocat en droit de la construction, Avocat en droit immobilier…

La recherche doit être rapide, tolérante aux majuscules/minuscules,
idéalement tolérante aux accents, et facile à utiliser sur mobile.

### 6. CRÉER UN RÉFÉRENTIEL CENTRAL DES MÉTIERS

Je veux UNE SEULE SOURCE DE VÉRITÉ pour les métiers dans Opus-Project. Ne pas
coder manuellement des listes différentes de métiers dans chaque écran.

Chaque métier devrait au minimum posséder : `id`, `name`, `slug`,
`category`, description éventuelle, `is_active`, `sort_order` éventuel.
Prévoir éventuellement `synonyms` et `keywords` pour améliorer la recherche.

```json
{
  "name": "Maçon",
  "slug": "macon",
  "category": "Gros œuvre",
  "keywords": ["maçonnerie", "béton", "construction"]
}
```

Toutes les fonctionnalités d'Opus doivent utiliser ce même référentiel.

### 7. LE RÉFÉRENTIEL DOIT COUVRIR TOUT L'ÉCOSYSTÈME BTP

Opus-Project ne doit pas considérer le BTP comme uniquement les artisans de
chantier. Je veux intégrer progressivement TOUT l'écosystème professionnel lié
au bâtiment et à la construction. Créer des catégories cohérentes.

Exemples de catégories : GROS ŒUVRE · SECOND ŒUVRE · TOITURE / CHARPENTE /
ÉTANCHÉITÉ · PLOMBERIE / CHAUFFAGE / CVC · ÉLECTRICITÉ / DOMOTIQUE / ÉNERGIE ·
MENUISERIE / SERRURERIE · REVÊTEMENTS / FINITIONS · ISOLATION / FAÇADE ·
TERRASSEMENT / VRD / ASSAINISSEMENT · TRAVAUX EXTÉRIEURS / PAYSAGE ·
PISCINE / SPA · DÉMOLITION / DÉSAMIANTAGE · ÉNERGIES RENOUVELABLES ·
CONSTRUCTION / ENTREPRISE GÉNÉRALE · ARCHITECTURE / CONCEPTION ·
MAÎTRISE D'ŒUVRE · BUREAUX D'ÉTUDES / INGÉNIERIE · GÉOMÈTRES / TOPOGRAPHIE ·
DIAGNOSTICS IMMOBILIERS · CONTRÔLE / EXPERTISE / SÉCURITÉ ·
ÉCONOMIE DE LA CONSTRUCTION · IMMOBILIER LIÉ À LA CONSTRUCTION ·
JURIDIQUE SPÉCIALISÉ BTP · ASSURANCE / COURTAGE CONSTRUCTION ·
FINANCEMENT PROFESSIONNEL / CONSTRUCTION · CONSEIL / SERVICES SPÉCIALISÉS BTP

### 8. EXEMPLES DE MÉTIERS À INTÉGRER

Le référentiel doit être beaucoup plus complet que cette liste, mais voici des
exemples permettant de comprendre le niveau attendu :

Maçon · Maçonnerie générale · Coffreur-bancheur · Ferrailleur · Terrassier ·
Entreprise de démolition · Canalisateur · Entreprise VRD · Assainissement

Couvreur · Zingueur · Charpentier · Étancheur · Bardeur

Plombier · Chauffagiste · Climaticien · Frigoriste

Électricien · Électricien bâtiment · Domoticien · Installateur
photovoltaïque · Installateur de bornes de recharge

Plaquiste · Plâtrier · Peintre en bâtiment · Carreleur · Solier · Parqueteur

Menuisier · Menuisier aluminium · Menuisier PVC · Menuisier bois · Serrurier ·
Métallier · Vitrier

Façadier · Enduiseur · Entreprise d'isolation · Isolation thermique extérieure

Paysagiste · Maçon paysagiste · Pisciniste

Constructeur de maisons · Entreprise générale du bâtiment ·
Contractant général

Architecte · Architecte d'intérieur · Architecte paysagiste

Maître d'œuvre · Assistant à maîtrise d'ouvrage

Économiste de la construction · Métreur

Dessinateur-projeteur · BIM Manager · Modeleur BIM

Ingénieur structure · Ingénieur bâtiment · Ingénieur génie civil

Bureau d'études structure · thermique · fluides · acoustique · environnement ·
géotechnique

Géotechnicien · Géomètre-expert · Topographe

Diagnostiqueur immobilier · Expert bâtiment · Expert construction ·
Bureau de contrôle · Coordonnateur SPS

Avocat en droit de la construction · Avocat en droit immobilier

Expert-comptable spécialisé BTP

Courtier en assurance construction · Courtier en financement

Consultant BTP

Cette liste est illustrative. Je veux que tu construises un référentiel
structuré et extensible permettant d'ajouter facilement de nouvelles
professions sans modifier toute l'application.

### 9. DIFFÉRENCIER MÉTIER ET SPÉCIALITÉ

C'est extrêmement important. Ne pas considérer chaque compétence comme un
métier différent.

MÉTIER : Maçon → SPÉCIALITÉS : construction maison, rénovation, extension,
fondations, dalle béton, béton armé, ouverture de mur porteur, mur de
soutènement, maçonnerie pierre, rénovation ancienne.

MÉTIER : Couvreur → SPÉCIALITÉS : toiture tuile, ardoise, zinc, rénovation
toiture, recherche de fuite, isolation toiture, fenêtre de toit.

Le professionnel peut avoir maximum 4 MÉTIERS. En revanche, les spécialités
sont rattachées aux métiers et **ne doivent pas consommer les 4 emplacements
de métiers**.

### 10. STRUCTURE DE DONNÉES MÉTIER / SPÉCIALITÉ

Prévoir une architecture propre du type :

- `trades` — id, name, slug, category_id, description, is_active
- `trade_categories` — id, name, slug, sort_order
- `specialties` — id, trade_id, name, slug, is_active
- `professional_trades` — professional_id, trade_id, éventuellement
  is_primary, created_at
- `professional_specialties` — professional_id, specialty_id, created_at

Adapter évidemment ces noms au schéma existant s'il existe déjà une
architecture équivalente. NE PAS créer de tables en doublon inutilement.

### 11. MÉTIER PRINCIPAL

Parmi les maximum 4 métiers sélectionnés, permettre éventuellement de définir
1 MÉTIER PRINCIPAL. Il pourra être utilisé pour l'affichage du profil, les
résultats de recherche, les recommandations, certaines catégories, le
référencement interne. Mais les 4 métiers doivent rester visibles sur le
profil professionnel lorsque cela est pertinent.

### 12. UTILISER CE SYSTÈME PARTOUT DANS OPUS

C'est une règle globale. Partout où Opus demande un métier, utiliser le même
composant et le même référentiel :

- inscription professionnelle — « Quels sont vos métiers ? » (maximum 4) ;
- modification du profil — « Mes métiers » (maximum 4) ;
- recherche d'un professionnel — « Métier recherché » ;
- demande de devis — « De quel professionnel avez-vous besoin ? » ;
- recherche de partenaire — « Quel type de partenaire recherchez-vous ? » ;
- appels d'offres — « Métiers concernés » ;
- publicité — « Métiers ciblés » ;
- disponibilités — « Métier recherché » ;
- réseau professionnel — « Je recherche… ».

Et toutes les futures fonctionnalités qui nécessiteront un métier devront
utiliser ce même système.

### 13. RECHERCHE PAR SPÉCIALITÉ

La recherche Opus doit également comprendre les spécialités.

Un particulier recherche « mur de soutènement » : même si ce n'est pas un
métier, Opus doit retrouver les professionnels ayant le métier *Maçon* et la
spécialité *Mur de soutènement*.

Recherche « recherche de fuite toiture » → retrouver les couvreurs ayant cette
spécialité.

### 14. PROFIL PROFESSIONNEL

Sur le profil d'une entreprise, afficher élégamment les métiers :

> **DUPONT CONSTRUCTION**
> Maçon • Carreleur • Façadier • Terrassier

Puis éventuellement les spécialités. Ne pas afficher une énorme liste qui
surcharge le profil. Prévoir « Voir toutes les spécialités » si nécessaire.

### 15. UX DU SÉLECTEUR

```
Vos métiers

[ Maçon × ] [ Carreleur × ]

2 / 4 sélectionnés

[ 🔍 Ajouter un métier... ]
```

Lors du clic : un champ de recherche, les métiers récemment recherchés, puis
les catégories (GROS ŒUVRE, TOITURE, CONCEPTION…). Lorsque l'utilisateur tape
du texte, les catégories peuvent disparaître pour afficher directement les
résultats pertinents.

### 16. NE PAS AFFICHER LES CATÉGORIES PARTOUT

Les catégories servent principalement à organiser le référentiel.
L'utilisateur doit pouvoir simplement taper « plombier » et sélectionner
Plombier. Il ne doit pas être obligé de comprendre notre classification
interne.

### 17. PRÉPARER L'INTERNATIONALISATION

Ne pas concevoir le système d'une manière qui empêcherait
l'internationalisation future. Prévoir une architecture permettant
ultérieurement : `country_code`, `locale`, traductions, métiers disponibles
selon pays. Mais pour le moment, FRANCE / `fr-FR` reste la référence
principale.

### 18. ADMINISTRATION DU RÉFÉRENTIEL

Préparer la possibilité pour un administrateur Opus d'ajouter, modifier ou
désactiver un métier, de changer sa catégorie, d'ajouter ou modifier une
spécialité, d'ajouter des synonymes.

**IMPORTANT :** si un métier n'est plus proposé, privilégier sa
**désactivation** plutôt que sa suppression brutale si des comptes
professionnels y sont déjà rattachés.

### 19. MIGRATION DE L'EXISTANT

Avant de modifier le code : analyser comment les métiers sont actuellement
stockés ; identifier tous les écrans utilisant des listes de métiers ;
identifier les données déjà existantes ; proposer la migration la plus sûre ;
réutiliser les données existantes lorsque possible ; ne supprimer aucune
donnée utilisateur ; ne casser aucun profil existant ; ne pas remplacer
inutilement des composants fonctionnels.

Si des comptes possèdent déjà des métiers, migrer leurs sélections vers le
nouveau référentiel. Si une ambiguïté existe dans une donnée, ne pas la
supprimer silencieusement.

### 20. TESTS OBLIGATOIRES

1. Un professionnel sélectionne 1 métier → accepté.
2. Il sélectionne 4 métiers → accepté.
3. Il tente d'en sélectionner un cinquième → refusé.
4. Il supprime un des 4 métiers → il peut en ajouter un autre.
5. Il ferme puis rouvre l'application → ses métiers sont correctement
   sauvegardés.
6. Un particulier recherche « Maçon » → les professionnels concernés
   apparaissent.
7. Recherche « mur de soutènement » → les maçons ayant cette spécialité
   apparaissent.
8. Recherche « architecte » → les professions correspondantes apparaissent.
9. Recherche « avocat construction » → l'avocat spécialisé apparaît.
10. Une tentative de contournement côté API/backend pour enregistrer 5
    métiers → doit également être refusée.

### 21. CONSIGNE FINALE

Commence par AUDITER l'existant avant de coder. Je ne veux pas que cette
modification casse le design ou les fonctionnalités déjà créées.

Ensuite : identifier tous les endroits concernés ; expliquer brièvement ce qui
va être modifié ; créer le référentiel central ; créer le composant de
sélection réutilisable ; appliquer la limite stricte de 4 métiers ; créer la
relation métiers → spécialités ; remplacer progressivement les anciennes
sélections de métiers ; adapter la recherche ; vérifier la migration des
données existantes ; lancer les tests ; vérifier qu'aucune régression n'a été
introduite.

**IMPORTANT :** Ne refais pas toute l'application. Ne modifie pas les éléments
qui ne sont pas concernés. Conserve le design Opus existant et améliore
uniquement l'expérience nécessaire.

À la fin, donne-moi un rapport indiquant : fichiers modifiés ; composants
créés ; tables/modifications DB ; migrations effectuées ; nombre de métiers
intégrés ; nombre de spécialités intégrées ; endroits de l'application
utilisant le nouveau TradeSelector ; tests effectués ; éventuelles limitations
restantes.
