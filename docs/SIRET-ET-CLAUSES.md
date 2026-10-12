# Le SIRET qui remplit la fiche, et les clauses qu'on coche

> Deux idées du propriétaire, remises le 12/10/2026 :
>
> 1. **« quand un artisan crée son compte et qu'il rentre son numéro de SIRET, on
>    pourrait aller rechercher toutes ces infos — TVA intracommunautaire, adresse
>    du siège, année de création, nom commercial, statut SARL SAS micro — comme ça
>    pour le devis on sait déjà si une TVA doit être applicable »** ;
> 2. **« pour les mentions non obligatoires, on les propose et l'artisan les coche
>    s'il veut les voir sur son devis. Par exemple une phrase qui explique qu'en
>    rénovation des travaux supplémentaires peuvent se cacher après démolition. Et
>    s'il clique sur la petite loupe il peut la lire, et un petit texte lui
>    explique à quoi elle sert. »**
>
> Puis, le même jour, **une troisième décision qui prolonge la première et la
> durcit** : *« si le numéro de SIRET ne correspond à rien, on ne peut pas lui
> créer de compte — c'est ce qui va dire qu'Opus valide ses artisans »*. Elle est
> traitée au **§8**, et elle rebouche un trou qui est OUVERT aujourd'hui : sur
> les cinq fiches de la vraie base qui portent un SIRET, **aucune ne désigne une
> entreprise réelle**, et trois portent le badge « vérifié ».
>
> Ce document est la réponse : trois recherches, une contre-expertise chargée de
> les réfuter, et mes propres mesures. **Aucun code n'a été écrit.** Il complète
> `docs/PLAN-DEVIS.md`, qu'il amende sur deux points nommés au §6, et le §8 en
> déplace le lot 0.

---

# Vos deux idées — ce qu'elles donnent vraiment

*12/10/2026. Réponse à votre message sur le SIRET et sur les mentions à cocher.
Aucune ligne de code n'a été écrite : on cherche et on conçoit.*

---

## Oui, j'ai compris — et je vous les relis en une phrase chacune

**Idée 1.** Quand un artisan s'inscrit et tape son SIRET, Opus va chercher tout
seul ce qu'on sait déjà de son entreprise — nom, adresse, forme, année, numéro de
TVA — pour qu'il n'ait pas à le retaper, et pour que le devis soit déjà renseigné.

**Idée 2.** Sur le devis, les mentions qui ne sont pas obligatoires sont
**proposées** sous forme de cases à cocher, l'artisan choisit celles qu'il veut
voir imprimer, et une petite loupe à côté de chaque ligne ouvre le texte complet
plus une explication de ce à quoi il sert.

**Les deux sont bonnes.** Et chacune se trompe sur un point précis — pas sur le
principe. Dans les deux cas c'est la mesure qui le dit, pas mon avis.

---

## 1. IDÉE 1 — ce que le SIRET donne vraiment

L'API publique s'appelle **Recherche d'entreprises** (`recherche-entreprises.api.gouv.fr`).
Elle répond **sans clé, gratuitement**, et j'ai vérifié qu'elle répond depuis
cette machine. Voici vos six demandes, une par une.

| Ce que vous avez demandé | Ce que l'API rend | Verdict |
|---|---|---|
| **Numéro de TVA intracommunautaire** | `tva` — une **liste** des numéros **actifs**, source DGFiP | **oui, mais pas toujours** : mesuré par moi sur 100 entrepreneurs individuels du bâtiment, **15 % en ont un, 85 % n'en ont pas**. Sur les sociétés (SARL, SAS) : 23 sur 25. Et **il ne dit pas si vous facturez la TVA** — voir le §2, c'est le point important |
| **Adresse du siège** | `siege.adresse`, `code_postal`, `libelle_commune` | **oui**, directement utilisable |
| **Année de création** | `date_creation` | **oui — mais il y a DEUX dates**, et il faut prendre la bonne. Voir ci-dessous |
| **Nom commercial** | `siege.nom_commercial`, puis `nom_raison_sociale`, puis `nom_complet` | **oui**, en essayant dans cet ordre. Voir ci-dessous : le dernier est piégeux |
| **Statut SARL / SAS** | `nature_juridique` — un **code à quatre chiffres** (`5499` = SARL, `5710` = SAS) | **oui, mais il faut traduire le code nous-mêmes.** Il n'existe aucune API pour obtenir le libellé |
| **Statut micro-entrepreneur** | *rien* | **NON. Ça n'existe pas dans la donnée.** Un micro-entrepreneur et un entrepreneur individuel au régime normal portent **le même code `1000`**, dont le libellé officiel est « Entrepreneur individuel » |

### Les deux dates de création — le piège le plus silencieux

J'ai mesuré sur une vraie entreprise : `date_creation` = **2022-04-04** (la
société), `siege.date_creation` = **2023-10-19** (son établissement actuel). Une
des recherches a trouvé un écart de **27 ans** sur une autre entreprise.

> **L'année de création est celle de l'entreprise, jamais celle du siège.**
> Prendre la mauvaise afficherait « depuis 2017 » sur la vitrine publique d'une
> entreprise de 1990. Aucune erreur, aucun écran cassé — juste un chiffre faux
> sur la page que ses clients regardent.

### Le nom : ne jamais prendre `nom_complet` tel quel

Mesuré : l'API rend **`LSR MACONNERIE (LSR MACONNERIE)`** — elle recolle le
sigle entre parenthèses. Et pour un entrepreneur individuel, `nom_complet` est le
nom **de la personne**. Le ranger dans le champ « entreprise », qui est public,
publierait un nom de famille sans que personne ne l'ait demandé.

### Et quatre choses que vous n'avez PAS demandées, qu'on obtient en prime

1. **Les coordonnées GPS du siège** (`siege.latitude`, `siege.longitude`). Mesuré :
   `'43.714137021'`, `'5.1924550145'`. **C'est le cadeau de ce lot**, et il
   referme un trou connu depuis le 05/10 : aujourd'hui un artisan qui vient de
   s'inscrire n'apparaît dans **aucune recherche par secteur** tant qu'il n'a pas
   ouvert « Modifier mon profil » une fois. Avec le SIRET, il y apparaît tout de
   suite — et sans appeler la Base Adresse Nationale. La protection existe déjà :
   `coord_ou_null()` (section 32) refuse en silence tout ce qui n'est pas une
   coordonnée.
2. **L'activité principale** (le code NAF) et **l'état administratif** (active
   ou cessée).
3. **`est_rge` et `est_qualiopi`** — des drapeaux de certification, source ADEME.
4. **La dénomination légale et la forme juridique**, c'est-à-dire ce qu'un devis
   doit imprimer en en-tête et qui n'existe nulle part dans Opus aujourd'hui.

### Le RGE : je l'écarte, et c'est volontaire

C'est tentant : `est_rge` existe, il suffirait de poser le badge. **Non.**

> Aujourd'hui le RGE est **déclaré par l'artisan et contrôlé par un humain**
> (section 17.2). Le décerner depuis un fichier, ce serait **le badge qui se
> décerne tout seul** — la règle du 29/09 en pire. Et ce n'est même pas
> exploitable : le champ `liste_rge` rend des codes du genre `8621T16D113`, et une
> des recherches a trouvé un établissement qui en porte dans un **format
> totalement différent** (`["41", "43"]`).

La vraie valeur de ce champ est l'inverse : un **indice pour vous, dans
l'administration**, qui aide à contrôler une déclaration avant de poser le badge.

### Trois autres champs écartés, avec leur raison

| Champ | Pourquoi on ne le range pas |
|---|---|
| `categorie_entreprise` | C'est une **taille** (PME / ETI / GE), pas un statut. Il vaut « PME » aussi bien pour une SARL à trois établissements que pour un maçon tout seul. Afficher « PME » à quelqu'un qui travaille seul est faux, et il le verra |
| `dirigeants` | Il rend **nom, prénom et mois de naissance** de personnes physiques, sans qu'on les demande. C'est de la donnée personnelle sur des tiers, exactement la prémisse du carnet de clients. On peut même l'éviter à la source : `minimal=True&include=siege,complements,tva`. **Ce qu'on n'écrit pas ne peut pas fuir** |
| Le libellé automatique de la forme juridique | 260 codes dans un fichier Excel de 2022, aucune API. Une des recherches a tenté l'extraction automatique : elle a **dérivé et perdu le code 5499**, celui que l'API renvoie le plus souvent. Il faut un petit tableau écrit à la main, limité aux formes qu'un artisan peut avoir, chaque libellé vérifié un par un — sur le modèle de `catalogue-metiers.js`. Et un code inconnu s'affiche tel quel (« Forme juridique 5560 ») plutôt que de laisser un blanc |

### Les trois cas où ça ne trouve rien — et ce n'est PAS une erreur

C'est le point qui décide de l'écran. La documentation de l'API le dit mot pour
mot : **« ne sont pas accessibles dans l'API : les entreprises non-diffusibles »**.

| Cause | Fréquence | Ce qu'on fait |
|---|---|---|
| L'entreprise a demandé à ne pas être diffusée | elle est **absente**, pas masquée | on saisit à la main, **et on continue** |
| L'immatriculation est trop récente (quelques jours) | c'est précisément quelqu'un qui s'inscrit | idem |
| Faute de frappe | — | idem |

Et un quatrième cas, plus retors : la diffusion **partielle**. Mesuré par moi
(1 siège sur 100) et par une des recherches (2 sur 125) : l'adresse, le code
postal et la latitude valent alors tous les trois la **chaîne de caractères**
`[NON-DIFFUSIBLE]`. Un préremplissage naïf écrirait ça dans la case adresse d'un
devis.

> **« Introuvable » est un cas NORMAL de l'écran, avec une phrase qui l'explique,
> jamais un refus.** Un artisan non diffusible a parfaitement le droit de
> s'inscrire. C'est la règle de `completerLieu()` : **l'échec ne bloque rien.**

### Les conditions d'usage, et une obligation

- **7 appels par seconde** par adresse IP, 30 par réseau. En cas de dépassement :
  `HTTP 429` avec un en-tête `Retry-After` **qu'il faut lire** (et non une reprise
  à l'aveugle : la règle d'`avecReprise()` est qu'on ne retente pas quand le
  serveur a répondu). Un appel à l'inscription ne pose aucun problème.
- La documentation **recommande un `User-Agent` explicite** nommant Opus.
- **Licence Ouverte 2.0 : il faut citer la source ET la date de mise à jour.**
  Comme le « © IGN » de la carte, en un peu plus exigeant. L'API rend
  `date_mise_a_jour_insee` pour ça.
- Et l'écran ne doit **jamais** laisser croire que l'État valide l'artisan : la
  licence dit elle-même que la mention « ne confère aucun caractère officiel ».
  C'est de la donnée reprise, pas un agrément.

---

## 2. LE SEUL POINT OÙ VOUS VOUS TROMPEZ — et il faut le dire avant de construire

Vous écrivez : « comme ça pour le devis on sait déjà si une TVA doit être
applicable ».

**Non. Et c'est la seule phrase de votre message que je corrige.**

### D'abord, une correction qui me concerne

On m'avait transmis que le numéro de TVA rendu par l'API était **calculé** depuis
le SIREN par une formule, donc présent pour tout le monde. **C'était faux, et je
l'ai mesuré moi-même** avant d'écrire cette page : le champ est une **liste des
numéros actifs, source DGFiP**, et sur 100 entrepreneurs individuels du bâtiment,
**85 n'en ont aucun**.

Les chiffres des deux chercheurs divergeaient (8 % contre 15 %) ; ma mesure sur
100 lignes donne **15 %**. Le sens est le même dans les trois cas, la magnitude
exacte reste incertaine — donc **aucune règle ne doit être réglée sur ce
pourcentage**.

### Ensuite, pourquoi votre conclusion ne tient pas quand même

Deux raisons indépendantes, et chacune suffit.

**1. Le régime fiscal n'est dans aucune donnée publique.** Ni dans les 90 champs
de cette API, ni dans SIRENE, ni dans l'API Entreprise (qui est réservée aux
administrations). « Franchise en base » ou « régime réel » **ne se lit nulle
part**.

**2. Avoir un numéro ne veut pas dire facturer la TVA.** Le BOFiP est formel : un
artisan en franchise en base **doit demander un numéro** dès qu'il achète dans un
autre pays de l'Union. Donc un micro-entrepreneur qui a acheté une machine en
Allemagne **a un numéro** — et il ne facture pas la TVA.

> **Le signal est à sens unique, et c'est tout ce qu'on peut en faire :**
>
> | | ce qu'on peut en déduire |
> |---|---|
> | **pas de numéro** | très probablement pas assujetti → on **propose** « franchise en base », à confirmer d'un appui |
> | **un numéro** | **on ne sait pas** → on ne propose rien, on demande |
>
> Préremplir « TVA applicable » parce que le numéro existe vous ferait facturer
> 20 % que vous devriez reverser **sans les avoir encaissés.**

Et la forme juridique ne le dit pas davantage : mesuré dans les deux sens, 15 %
des entrepreneurs individuels ont un numéro et environ 2 sociétés sur 25 n'en ont
pas. **« Micro-entrepreneur donc franchise » est faux.**

> **Le régime de TVA reste une DÉCLARATION que vous seul pouvez faire**, posée une
> fois dans votre fiche, figée sur chaque devis à sa date. L'API peut la
> **proposer** ; elle ne peut pas la **décider**. C'est « le badge ne se décerne
> pas soi-même », appliqué à une donnée fiscale.

### Ce qui RESTE possible, et qui est déjà beaucoup

1. **Imprimer le numéro quand l'API le rend** — et **jamais un numéro calculé.**
   Les chiffres d'un numéro français sont effectivement calculables depuis le
   SIREN, et c'est un piège : une des recherches a fabriqué les numéros de quatre
   entreprises qui n'en ont pas, puis les a soumis au service officiel européen.
   **Les quatre ont répondu « INVALIDE ».** Un numéro calculé est **bien formé et
   faux** : l'imprimer sur le devis de quelqu'un qui n'est pas assujetti, sur un
   document qui dit par ailleurs « TVA non applicable », c'est une mention légale
   fausse. Exactement ce que ce projet interdit depuis le 29/09.
2. **Pré-cocher la question du régime**, avec sa proposition visible et
   modifiable. C'est mieux qu'une question nue, et c'est honnête.
3. **Vérifier un numéro quand on en a besoin**, par le service officiel européen
   **VIES** (`ec.europa.eu/taxation_customs/vies`), gratuit et sans clé. Avec une
   précaution qui n'est pas évidente : le premier appel d'une des recherches a
   répondu « invalide » **alors que rien n'avait été vérifié** — c'était une
   limite de débit. Il faut donc **trois états, pas deux** : vérifié, refusé, et
   **« je n'ai pas pu vérifier »**. Un travail qui n'a pas pu se faire ne doit
   jamais ressembler à un travail fait.

   À savoir avant de s'y fier : les appels ont dû être espacés de 8 à 12 secondes
   pour obtenir des réponses, et **aucune documentation ne chiffre la limite**. Ce
   n'est donc pas pour l'inscription. C'est un lot à part, plus tard, si jamais.

### Et une échéance qu'il faut connaître : dans 81 jours

La phrase à imprimer quand on n'est pas assujetti est aujourd'hui
**« TVA non applicable, art. 293 B du CGI »**. Elle **change le 1er janvier
2027** : la TVA a été recodifiée dans un nouveau code (le CIBS), avec tolérance
des anciennes références sur les factures jusqu'au **31 décembre 2027**.

Ce qui a été vérifié : la version consolidée du CIBS au **10 octobre 2026 — il y
a deux jours** — renvoie **encore** au 293 B, donc le changement n'est pas en
vigueur. Un report du 1er septembre 2026 au 1er janvier 2027 a été publié le
28 juillet 2026.

**Ce qui reste incertain, et que je ne comblerai pas** : le numéro exact du
nouvel article. Deux sources donnent `L. 223-3`, une troisième `L. 233-3`, et le
texte officiel n'a pas pu être lu (le PDF du Journal officiel n'a aucune couche de
texte). **À vérifier depuis votre navigateur avant qu'une ligne ne s'imprime.**

> **Et c'est l'argument décisif de la conception des deux idées : ces textes
> vieillissent.** Chaque mention et chaque clause porte **sa référence légale et
> sa date**, jamais un texte écrit en dur une fois pour toutes — sur le modèle du
> `STATUT` de `src/data/legal.js`.

---

## 3. IDÉE 2 — le mécanisme est bon. La vraie question est : QUI ÉCRIT LES PHRASES

Votre mécanisme est juste : proposer, cocher, expliquer. Je le garde presque tel
quel. Mais votre message mélange **trois choses** qui n'ont pas du tout le même
risque, et il faut les séparer avant tout le reste.

### (a) Les mentions OBLIGATOIRES — elles ne se cochent pas

Vous dites « pour celles qui ne sont pas obligatoires ». Parfait — à condition de
savoir lesquelles le sont, et ce n'est pas ce que racontent les sites.

> **Une case à cocher sur une obligation est un piège.** Elle offre de décocher
> ce qui expose à une sanction. Et le pire est qu'elle **rassure** : on voit la
> ligne, on la croit traitée.

Donc : les obligatoires **s'affichent, s'expliquent par la même loupe, et ne se
décochent pas**. Le meilleur message d'erreur est celui qu'on ne peut plus
déclencher.

Et deux corrections mesurées, contre ce qu'écrivent la plupart des guides :

**Le seuil de 150 € n'existe plus.** Il venait d'un arrêté de 1990, abrogé. Depuis
le **1er avril 2017**, le devis détaillé est dû pour **toute prestation** de
dépannage, réparation et entretien du bâtiment, **quel que soit le montant**,
urgence comprise. Le chiffre de 1 500 € qu'on lit aussi n'a **aucun fondement
trouvé**.

**L'attestation d'assurance décennale ne s'écrit pas : elle se JOINT.** C'est la
trouvaille la plus utile de cette recherche, et elle est passée inaperçue de tout
le monde — y compris du modèle de votre fédération.

| | |
|---|---|
| Ce que disent tous les guides | « indiquez sur le devis le nom de l'assureur, ses coordonnées et la couverture géographique » |
| Ce que dit le texte | le Code de l'artisanat impose bien ces trois mentions… **et exclut expressément** les professionnels soumis à l'assurance construction |
| Autrement dit | pour un **maçon, couvreur, électricien, plombier** — donc pour vous — l'obligation est **ailleurs** : le Code des assurances exige une **attestation d'assurance JOINTE aux devis et factures**, selon un modèle fixé par arrêté |

Les deux obligations sont **exclusives, pas cumulatives**. Et la référence que
citent encore les guides et le modèle CAPEB (l'article 22-2 de la loi de 1996) est
**abrogée depuis le 1er juillet 2023**.

> **Conséquence de conception que personne n'avait vue : le devis doit pouvoir
> porter une PIÈCE JOINTE, pas une case à cocher.** Ce n'est pas une ligne de
> catalogue, c'est un fichier. Et Opus a déjà tout ce qu'il faut : l'espace privé
> `documents` porte déjà le Kbis et l'assurance, la fonction de ménage de compte
> le nettoie déjà, et la messagerie sait déjà joindre un PDF. Un lot « mentions »
> qui ne livrerait que du texte laisserait **l'obligation la plus simple non
> tenue**.

**Attention à la source de tout ce paragraphe.** Légifrance répond systématiquement
**403** depuis cette machine (testé en boucle). Tous les textes ci-dessus
viennent de **codes.droit.org**, qui publie les codes consolidés en PDF — éditions
du 10 et du 22 septembre/octobre 2026, extraites et lues. **C'est une reproduction
mécanique datée, pas la source officielle.** Vous y accédez depuis votre
navigateur : à recouper avant qu'une ligne ne s'imprime sur un document signé.

### (b) Les INFORMATIONS que vous choisissez d'ajouter — aucun risque, et c'est là qu'il faut commencer

Délai d'exécution, durée de validité du devis, modalités de paiement que vous
pratiquez, acompte, ce que votre prix comprend ou non.

Ce ne sont pas des clauses : ce sont des **faits sur votre entreprise**. Elles
n'engagent personne d'autre que vous, elles ne peuvent pas être « abusives », et
elles sont exactement ce que le client cherche quand il compare deux devis. **La
case à cocher est parfaite ici, sans aucune réserve.**

Un seul routage, et il est **juridiquement fondé** et pas seulement pratique : les
pénalités de retard « de plein droit » et l'indemnité de **40 €** pour frais de
recouvrement sont du droit **entre professionnels**. Un client particulier **ne
les doit pas**. Le modèle CAPEB le dit lui-même en conditionnant les 40 € à
« si le client est un professionnel ». Et le Code de commerce autorise
expressément des conditions **différenciées selon les catégories d'acheteurs**.

> Opus sait déjà à qui le devis s'adresse : le carnet de clients porte le type
> (`particulier` / `entreprise`) depuis le 11/10. **C'est un routage, pas une
> clause — ça, Opus peut le tenir.**

### (c) Les CLAUSES qui engagent votre client — licite, sous cinq conditions

C'est là que le dossier a le plus bougé, et le verdict est **oui**, contre ce que
j'aurais répondu hier.

Ce qui l'autorise est une décision de justice que la recherche a sortie du
document du Conseil national des barreaux lui-même. La **Cour d'appel de Paris, le
6 novembre 2018**, a jugé qu'un site mettant à disposition des modèles classés
parmi lesquels l'utilisateur **choisit seul** celui qui convient à son cas fournit
une **« bibliothèque documentaire »** — « un peu comme le faisaient auparavant les
utilisateurs de recueils de modèles de lettres » — et **non** une assistance
juridique réservée aux avocats.

**C'est mot pour mot votre idée 2.** Et le Conseil national des barreaux reconnaît
lui-même les « modèles d'actes *statiques* proposés traditionnellement par les
éditeurs juridiques ».

Ce qui n'est pas autorisé est ce qu'un juge appelle **analyser votre situation
pour y appliquer la règle de droit** — c'est-à-dire la **personnalisation**. Et la
sanction n'est pas une amende administrative : c'est un **délit**, un an
d'emprisonnement et 15 000 €, et il viserait **vous**, l'éditeur.

**Les cinq conditions, et aucune n'est négociable :**

1. **Le catalogue est identique pour tout le monde.** Aucune entrée « recommandé
   pour votre métier », aucun tri selon le chantier, le client ou le montant. **La
   personnalisation est le critère du délit**, pas le fait de fournir un texte.
2. **L'artisan choisit, et peut modifier le texte.** C'est lui qui fait le travail
   de choix — c'est précisément ce que le juge a retenu.
3. **Aucune promesse de conformité.** Un concurrent annonce « 19 mentions légales
   automatiques » et « vos devis sont en conformité avec toutes les obligations
   légales » — sans un seul avertissement. **Ce n'est pas imitable ici** : cette
   société a un conseil juridique et une assurance ; vous avez `STATUT = 'essai'`,
   pas de société et pas de SIRET. Écrire « vos devis sont conformes » serait la
   fausse mention légale que ce projet refuse depuis le 29/09.
4. **L'agent IA n'approche pas les clauses. Ligne rouge, pas réglage.** Une clause
   composée par un modèle à partir du chantier décrit, c'est exactement l'analyse
   personnalisée que la justice réserve — et le Conseil national des barreaux
   présente lui-même les rédactions automatisées comme une question **ouverte**.
   Tant que personne n'a tranché, la seule position défendable est l'abstention.
   C'est aussi la règle du projet : « ne plus ajouter d'action IA à la main ».
5. **Un drapeau qu'un humain seul peut lever** — `EDITEUR.clausesRelues`, sur le
   modèle exact de `contratSousTraitance`. Tant qu'il est à `false`, la
   bibliothèque ne propose rien hors démonstration.

Et la raison du cinquième, qui est la vraie : **le risque principal n'est pas le
monopole des avocats, c'est une clause fausse recopiée sur mille devis.** Aucune
source ne vous en exonère, et la case à cocher déplace l'adoption vers l'artisan
sans effacer la rédaction par l'éditeur.

> **Avec la leçon qui va avec, déjà payée le 11/10 :** on ne vérifie **jamais** la
> prudence en cherchant une phrase de prudence dans les textes. Le premier jet de
> `verifier-legal` passait au vert parce que le texte que je venais d'écrire
> contenait les mots cherchés. Aucun programme ne peut savoir si un catalogue
> juridique est juste.

### Ce qu'on ÉCARTE, avec la raison

| Écarté | Pourquoi |
|---|---|
| Recopier les textes CAPEB, FFB ou la norme NF P 03-001 | **Droit d'auteur.** Le silence n'est pas une permission, et la norme est **vendue** par l'AFNOR. Opus peut **nommer** ces documents et dire ce qu'ils sont — ça, c'est de l'information. Pas les copier. Il faut écrire et demander |
| Attendre des clauses officielles gratuites | **Elles n'existent pas pour votre métier.** L'État décrète des clauses types **une seule fois**, pour la construction de maisons individuelles sur plan. La norme privée est payante, le document des marchés publics ne concerne que la commande publique, et ni la DGCCRF ni l'Institut national de la consommation ne publient de modèle de devis. **Pour la rénovation, les sources officielles disponibles disent ce qu'il ne faut PAS écrire, pas ce qu'il faut écrire** |
| « Nos conditions générales sont disponibles dans l'application » | Une clause rangée **ailleurs** que sur le document signé est présumée abusive **de façon irréfragable**, sauf si l'autre document est expressément visé **et** a été remis avant la signature. C'est faisable, mais ce n'est pas « disponible dans l'application » |
| Une pastille unique « conditions de paiement » | Elle serait **fausse pour la clientèle majoritaire** (voir le routage par type de client ci-dessus) |
| Les pénalités de retard chiffrées qui circulent sur les sites du bâtiment (« 1/1000e par jour plafonné à 5 % ») | Elles viennent de la norme privée payante et **ne valent rien si le devis ne la vise pas** |

---

## 4. VOTRE EXEMPLE, traité pour de vrai

> « En rénovation, une phrase qui explique que des travaux supplémentaires
> peuvent se cacher sur le chantier après démolition. »

### Votre besoin est juste, et il a un nom

Un client qui découvre un surcoût se fâche, et le prévenir est honnête. **Ce n'est
pas une intuition isolée** : votre fédération a écrit exactement cette clause.
Le modèle public de conditions générales de la CAPEB porte **18 articles**, et son
**article 5** dit précisément ce que vous décrivez — avec le mot du métier,
« sujétions imprévues ». **Je ne la recopie pas ici, et elle ne doit pas être
recopiée dans Opus** : c'est un document d'une fédération, destiné à ses
adhérents.

### Mais la FORME que vous imaginez ne tient pas

Une clause par laquelle le client **accepterait d'avance** un surcoût non chiffré
est, dans le Code de la consommation, une clause qui **réserve au professionnel le
droit de modifier unilatéralement le prix**. C'est le 3° de la **liste noire** :

- **irréfragablement présumée abusive**, donc interdite — aucune preuve contraire
  n'est recevable ;
- aucune exception ne couvre les travaux (la seule dérogation existante vise les
  valeurs mobilières, les devises et les services financiers) ;
- **l'amende ne demande ni plainte, ni préjudice, ni procès : la seule PRÉSENCE de
  la clause suffit.** **15 000 € pour une personne physique**, 75 000 € pour une
  société, depuis le 28 mai 2022 — et jusqu'à **4 % du chiffre d'affaires** pour
  les infractions de grande ampleur.

Un micro-entrepreneur est une personne physique : c'est **15 000 €**.

### Et elle ne vous protégerait même pas

C'est l'argument qui compte, et il est plus fort que le risque. Deux droits
différents disent la même chose :

- l'organisme officiel compétent — la **Commission des clauses abusives** —
  recommande depuis 1980 d'éliminer les clauses majorant le prix pour travaux
  supplémentaires, **sauf par voie d'avenants librement acceptés** par le client ;
- et le Code civil, pour les marchés à forfait, exige une **autorisation écrite
  préalable**. Les quelques assouplissements admis par la justice reposent tous sur
  un comportement **postérieur** aux travaux (un paiement sans réserve, un décompte
  validé) — **jamais sur une clause signée avant**.

> **Donc la clause que vous imaginez serait à la fois interdite ET inutile.** Ce
> qui vous protège, c'est l'avenant signé. **C'est une fonctionnalité, pas une
> phrase.**

### Ce qui tient, et qui rend le même service — en mieux

Deux choses, et c'est la deuxième qui vous protège :

1. **Une phrase purement informative**, qui prévient le client que la démolition
   peut révéler l'imprévu et **annonce la procédure** : un avenant proposé, aucun
   travail exécuté avant son accord. C'est honnête, c'est de l'information, et
   c'est la forme qu'a retenue votre fédération.
2. **L'AVENANT lui-même** : un devis rattaché au premier, avec son propre numéro,
   son propre instantané figé, et resigné. Le plan du devis sait déjà le faire — il
   pose déjà « pour corriger un devis remis, on en émet un nouveau ».

> **Et c'est pour ça que les deux ne se séparent pas.** Une clause qui annonce une
> procédure que l'application ne sait pas exécuter, c'est le « X est prévenu » du
> 01/10 : une promesse que rien ne tient. **Soit les deux dans le même lot, soit
> une phrase qui ne promet que ce qu'Opus sait faire.** C'est la question 2 du §7.

### Un mot que je ne mettrais pas sur un devis sans l'avoir fait trancher

« Sujétions imprévues » est un terme de **droit public**, forgé pour les marchés
de travaux publics. La CAPEB l'emploie dans un contrat privé. Personne n'a pu
établir ce qu'un juge en fait face à un consommateur. **La parade est simple :
décrire le fait** (« ce que la démolition révèle ») plutôt qu'invoquer la
catégorie juridique.

### Et un risque beaucoup plus cher, que votre exemple fait apparaître par ricochet

En vérifiant tout ceci, la recherche a lu la liste **exhaustive** des cas où le
droit de rétractation de 14 jours ne s'applique pas. **Treize cas, et seuls deux
peuvent servir à un artisan** : la prestation pleinement exécutée avec accord
exprès et renoncement reconnu, et **les travaux d'urgence au domicile
expressément sollicités**.

- **Bonne nouvelle, et personne ne l'avait vue : le SOS d'Opus tombe dans le
  deuxième cas.** C'est exactement « travaux de réparation à réaliser en urgence
  au domicile et expressément sollicités ».
- **Mauvaise nouvelle : un devis de rénovation signé chez le client, non.**
  L'argument « c'est du sur-mesure, donc pas de rétractation » qu'on lit partout
  est **faux pour des travaux** : l'exception du sur-mesure vise des **biens**, pas
  des prestations.
- Et **le modèle CAPEB n'en dit pas un mot** : zéro occurrence de « rétractation »,
  de « 14 jours » ou de « hors établissement » dans tout le document.

> **Un modèle de fédération n'est donc pas un refuge.** Le recopier aurait importé
> ce trou-là dans mille devis. C'est la confirmation la plus nette que la
> bibliothèque ne peut pas être un copier-coller, d'où qu'il vienne.

---

## 5. LA LOUPE — gardez-la, elle est bonne. Mais changez le dessin

### Pourquoi l'idée est juste

Elle règle un défaut dont ce projet a déjà payé le prix deux fois : **une cible
qui ne s'explique pas ne se touche pas.** La poignée des commentaires était
dessinée et ne se tirait pas — « on tire, rien ne se passe, et on en conclut que
l'application est cassée ». Les cases vides du calendrier sont vraiment vides
pour la même raison.

Ici c'est le même défaut appliqué à une décision : une case à cocher dont on ne
sait pas ce qu'elle fait **se coche sans être lue**. Et une clause cochée sans
être lue est **pire qu'une clause absente**, parce qu'on se croit protégé par une
phrase qu'on n'a jamais vue.

> **Votre loupe est de la pédagogie au moment où elle sert, pour quelqu'un qui n'a
> pas de juriste.** C'est la meilleure partie de l'idée 2.

### Le dessin : pas une loupe, un « i »

C'est le seul endroit où je ne suivrais pas votre formulation, et la raison est
mesurée : **la loupe est déjà prise dans Opus.** `Search` ouvre la recherche du
fil, elle **filtre**, et elle devient orange avec un point quand un filtre est
actif. Deux loupes qui disent deux choses différentes, c'est « deux formules pour
une seule vérité » — le défaut des voyants du 04/10, appliqué à un dessin.

`src/components/icons.js` exporte déjà **`Info`** (ligne 105) et **aucun écran ne
l'utilise comme icône** — vérifié. C'est lui. *(Un piège à ne pas redécouvrir :
`DemandesRecuesScreen.js` contient déjà un composant local appelé `Info`. La
collision est réelle si on importe l'icône là.)*

### La cible

| | |
|---|---|
| la rangée entière | `minHeight: TOUCHE` (44 points) — **et pas `paddingVertical`** : React Native aplatit les styles par précision, la forme longue l'emporte. C'est le défaut du `padding: 0` du 02/10, et celui de la ligne de chantier passée de 332 × 24 à **332 × 44** |
| l'icône | une boîte de **44 × 44 pleine**, **voisine de la case et jamais dedans** — « un bouton ne se met pas dans un bouton », le navigateur le refuse en toutes lettres |
| `hitSlop` | **non.** `react-native-web` l'ignore, donc **ça ne se vérifie pas ici**. Le projet a déjà deux cibles dont il faut écrire « ça se touche bien mais ça ne se mesure pas » (`BtnMini` à 80 × 36, `PillToggle` à 73 × 38). Pas une troisième |

### Ce qui s'ouvre : rien. Ça se DÉPLIE en place

**Pas de feuille du bas**, et pas pour la raison du clavier — il n'y a rien à
écrire. Parce que ce bloc vivra **dans un formulaire de devis déjà ouvert**, donc
deux fenêtres empilées. Et ça, c'est littéralement le défaut qui vous a fait dire
« je suis bloqué » le 04/10 : deux `Modal` superposées laissent sur iPhone un
voile invisible qui avale les touches.

Trois bénéfices à déplier en place, et aucun n'est esthétique :

1. **la case reste sous vos yeux pendant que vous lisez à quoi elle sert.** Une
   fenêtre recouvre justement la chose qu'on décide — la fenêtre de l'agent a déjà
   payé ce prix le 07/10 ;
2. aucune seconde fenêtre ;
3. trois phrases ne justifient pas 80 % d'écran qu'il faut refermer pour cocher.

*(Le dépliement est une animation **au doigt**, donc permise dans une liste, comme
`DoubleAppui`. Mais sans animation de sortie : « jamais d'`exiting` sur un élément
démontable en masse ».)*

### Ce que le petit texte explique — quatre choses, toujours les mêmes

1. **À quoi ça sert**, en une phrase, en français, sans jargon.
2. **Ce que la loi exige ou interdit sur ce sujet**, avec sa **citation exacte** et
   sa **référence datée**.
3. **Ce que la Commission des clauses abusives recommande d'éviter**, quand elle
   s'est prononcée. *(Attention : ce ne sont pas des règles — le Conseil d'État l'a
   jugé. Opus peut s'en servir pour **avertir**, jamais pour garantir qu'une clause
   est conforme. Et sa recommandation sur les travaux supplémentaires vise la
   construction de maisons sur plan : la transposer à la rénovation est une
   **analogie**, à annoncer comme telle.)*
4. **Où aller chercher le texte** : votre fédération, votre assureur, un avocat.

Et le champ `source` de chaque entrée dit **d'où vient sa formulation**. Sans lui,
personne ne pourra dire dans six mois si une phrase vient d'une fédération ou de
moi.

### Sur « proposées à chaque nouveau devis » — la seule autre partie que je discute

Dix devis par semaine, dix fois la même liste : **au troisième on coche sans
lire.** Et on est revenu au défaut que la loupe devait régler.

La fenêtre de nommage de l'agent a déjà tranché ce dilemme le 07/10, mais **sa
solution ne se transpose pas** : un compteur à trois ferait **disparaître les
clauses au quatrième devis**. Ce qui se transpose, c'est le mécanisme :

> **On ne mémorise pas la réponse, on mémorise l'HABITUDE.** Les clauses du devis
> précédent sont **déjà cochées** au suivant ; l'écran ne pose plus de question, il
> **montre un état**. Au vingtième devis : une ligne, « 4 clauses sur votre devis ·
> Modifier ». Zéro question.

C'est ce que fait le seul logiciel du marché qui ait résolu ce point (Henrri, avec
ses modèles de conditions de paiement enregistrés, dont un par défaut). Et ça
permet de garder l'explication **visible la première fois** sans qu'elle devienne
du bruit.

Deux détails qui ne sont pas des détails :

- **la mémoire vit en base, sur votre fiche d'entreprise, pas sur le téléphone.**
  En mémoire locale elle repartirait à zéro au prochain démarrage — c'est
  exactement le point orange des Demandes, corrigé le 04/10 ;
- **une clause ajoutée au catalogue plus tard** se signale **une fois**, par un
  trait orange au bord de sa rangée, comme le « Nouveau » des Demandes — « le neuf
  se marque au BORD, pas au fond : un fond teinté derrière le texte le rendrait
  moins lisible, et c'est le texte qu'on vient lire ». Et **jamais** par une
  fenêtre.

### Et le bloc est REPLIÉ par défaut — c'est de la géométrie, pas du goût

Une rangée fait 44 points plus son séparateur, soit environ 48 px. Donc :

| | hauteur | sur un écran de 844 |
|---|---|---|
| 8 clauses dépliées | **384 px** | **45 %** |
| les 18 thèmes du modèle CAPEB | **864 px** | **plus d'un écran entier** |

**45 %, c'est exactement l'encombrement que la page Demandes a mis une journée à
perdre** (sa première demande commençait vers 380 px sur 844), et que la Place des
pros a ramené de 233 à 104 px en quatre pastilles.

Donc : **replié par défaut, après les lignes et avant le total**, et la ligne
repliée dit son **état** et non son nom — « 4 clauses sur votre devis · Modifier ».
C'est la leçon des quatre pastilles : « chacune affiche son CHOIX à la place de son
nom ». Déplié, c'est groupé par thème, **un groupe à la fois tenu par une chaîne**
et non par trois booléens (avec trois booléens, deux peuvent être vrais ensemble —
et deux fenêtres empilées, on connaît la suite).

*Ce que je n'ai pas : le nombre de clauses au-delà duquel plus personne ne lit. Je
ne l'ai pas mesuré et je ne vais pas l'inventer. Ce que la géométrie dit, en
revanche, est au-dessus.*

### Les deux choses à écarter sur cet écran

- **Les pastilles** : elles marchent pour quatre axes à un choix, pas pour dix-huit
  objets oui/non. Ce serait la rangée de neuf puces que le lot « dates » a
  supprimée.
- **Une page à part** : une clause qu'on oublie d'enlever part **imprimée sur un
  contrat signé**. C'est la règle du 04/10 — « un filtre qu'on ne voit pas est un
  filtre qu'on oublie d'enlever », avec un enjeu bien plus lourd.

---

## 6. CE QUE ÇA CHANGE AU PLAN DU DEVIS, lot par lot

### L'idée 1 réduit le lot 0 — mais moins que vous ne l'espérez, et il faut le dire

Le lot 0 (« Mon entreprise ») compte **une trentaine de colonnes et autant de
champs**. Voici ce que le SIRET remplit :

| Rempli par le SIRET | Pas rempli par le SIRET |
|---|---|
| adresse de rue · code postal · ville | assureur (4 champs) |
| dénomination légale · nom commercial | médiateur (3 champs) |
| forme juridique | garanties légales · service après-vente |
| année de création | conditions générales · droit applicable · juridiction |
| n° de TVA *(quand il existe)* | frais de déplacement · taux horaire |
| **+ latitude / longitude**, qu'on ne tape jamais | logo · modèle · durée de validité · devis payant |
| | **régime de TVA** |

> **Environ 7 champs sur une trentaine, plus deux qui ne se tapent pas.**
> C'est réel, et c'est utile : ce sont les champs qu'on tape **sans réfléchir** et
> qu'on écrit **avec des fautes**. Mais ce sont aussi **les plus faciles**. Les
> champs qui BLOQUENT un devis — l'assureur, le médiateur, les garanties — ne sont
> dans aucune donnée publique.

**Conséquence : l'idée 1 ne change PAS la recommandation de couper le lot 0 en
deux.** Elle rend la première moitié beaucoup plus rapide à remplir, ce qui est
exactement là où elle sert.

### Est-ce qu'elle change une des sept questions ? Une seule, et pas en la supprimant

**La question 1 (« franchise en base ou régime réel ? ») reste posée.** Elle
change seulement de forme : au lieu d'une question nue, elle arrive **pré-cochée
avec une proposition visible** quand l'API ne rend aucun numéro de TVA. Vous
confirmez d'un appui au lieu de choisir à froid.

C'est tout. Les six autres ne bougent pas — et en particulier la **question 6**
(vos tarifs publics), qui décide s'il faut **scinder la table** : posée maintenant
elle est gratuite, posée après le lot 0 c'est un déménagement de colonnes.

**Et l'idée 1 ajoute une ligne à un lot déjà prévu.** Le lot 0 doit de toute façon
poser une contrainte sur le SIRET : aujourd'hui `professional_profiles.siret` est
déclaré **sans aucune contrainte**, personne ne le valide ni ne le nettoie dans
tout `src/`, et les données de démonstration le stockent **avec des espaces**.
C'est la clé de recherche de toute l'idée 1 : **elle passe d'abord**, avec un nom
de contrainte terminé par `_check` pour que `src/lib/erreurs.js` sache en tirer un
message en français.

### L'idée 2 est un lot à part — et il se range APRÈS le lot 2

Pourquoi pas avant : **les clauses s'impriment sur un document.** Tant que le
document n'existe pas (lot 2), une bibliothèque de clauses est une colonne que
personne ne lit — le défaut du 04/10.

**Mais il y a une chose à décider MAINTENANT, et c'est technique.** Le §3.4 du
plan pose que l'instantané figé du devis range chaque mention **dans une colonne
nommée, et jamais dans un `jsonb`** — « dans un `jsonb`, une clé manquante ne lève
RIEN ». Si on ajoute les clauses après coup, il faudra ajouter des colonnes à un
instantané **déjà figé sur des devis remis**.

> **La parade : décider la FORME maintenant, construire plus tard.** Les clauses
> retenues partent dans une **table fille** (`devis_clauses` : clé, version, titre,
> **texte entier**), une ligne par clause, jamais une colonne de l'instantané et
> jamais une référence vers le fichier. Il n'y a rien à migrer le jour où le lot
> arrive — et le §3.4 doit le dire dès sa validation.

Et la réponse à votre question implicite sur les corrections : **corriger le texte
d'une clause dans le fichier ne change AUCUN devis déjà remis**, puisque chaque
devis porte le texte entier. Exactement comme le taux de TVA figé à la date de
signature. La `version` ne sert pas à retrouver le texte ; elle sert à répondre à
**« quels devis portent l'ancienne formulation ? »** le jour où une clause se
révèle mauvaise. C'est son seul service, et il suffit à la justifier.

### Le point dur : l'idée 2 AMENDE le plan que vous devez valider

Le §2.0 dit, mot pour mot : « **Opus ne compose AUCUN de ces textes** […] **il ne
propose aucune formule à cocher.** »

Ce n'est pas une contradiction, c'est un **périmètre** : ce paragraphe parle des
mentions **obligatoires** (garanties légales, service après-vente, conditions
générales, droit applicable, juridiction). Vous parlez explicitement de « celles
qui ne sont pas obligatoires ». Deux objets, deux risques :

| | coût d'une erreur |
|---|---|
| une mention **obligatoire** absente ou fausse | une **sanction**, dont un palier pénal |
| une clause **facultative** mal rédigée | un contrat qui ne protège pas, voire une clause réputée non écrite — **et une amende si elle est en liste noire** |

> **Donc la bibliothèque ne contient que du facultatif, et ce n'est pas une
> intention : c'est un contrôle.** Chaque entrée porte un champ `obligatoire` qui
> doit **toujours** valoir `false`, et un contrôle refuse qu'une mention
> obligatoire y entre. Sinon quelqu'un y rangera « garanties légales » dans six
> mois et le §2.0 sera contourné **sans bruit** — comme les politiques créées à
> deux endroits de `schema.sql`.

**Le plan doit donc être amendé sur ce point avant d'être validé**, et le fichier
du catalogue suit le modèle de `pieces-justificatives.js` (un routage en
JavaScript, **sans table, sans SQL engendré**) et **n'importe rien** — pour qu'un
contrôle puisse le faire tourner. C'est la douzième application de la leçon de
`cloudinary-adresses.js`.

### L'ordre que je propose

1. **Le SIRET validé et normalisé** (contrainte + nettoyage) — prérequis de tout.
2. **L'idée 1**, dans la première moitié du lot 0 : recherche au moment
   d'enregistrer, filtre du `[NON-DIFFUSIBLE]`, « introuvable » traité comme
   normal, l'échec qui ne bloque rien.
3. Le reste du module devis, tel que le plan le découpe.
4. **L'idée 2**, après le lot 2, et **jamais avant que le plan soit validé** —
   puisqu'elle en amende le §2.0.

---

## 7. CE QU'IL FAUT VOUS DEMANDER — trois choses

### 1. Êtes-vous adhérent à la CAPEB (ou à la FFB) ?

**C'est la question la plus importante des trois, et elle ne dépend pas de moi.**

Si oui, vous avez accès au modèle **à jour** et à un **service juridique
départemental** qui rédige ce genre de clauses. Cela transformerait le lot : les
textes viendraient de **votre fédération**, et le champ `source` le dirait. C'est
de très loin la meilleure issue.

> **Par défaut (si non, ou sans réponse)** : la bibliothèque reste un **catalogue
> de SUJETS** — ce que la loi exige, ce qu'elle interdit, ce que la Commission
> recommande d'éviter, et **où aller chercher le texte**. Vous collez vos propres
> phrases, Opus les imprime sans les écrire. `EDITEUR.clausesRelues` reste à
> `false`, donc rien ne se propose hors démonstration.

### 2. L'avenant : dans le même lot que les clauses, ou pas de clause du tout ?

La clause utile sur les travaux supplémentaires **renvoie à un avenant écrit signé
avant exécution** — c'est ce qui la distingue d'une phrase décorative, et c'est ce
qui vous protège vraiment. Or Opus n'a aujourd'hui **ni avenant ni signature**.

> **Par défaut : les deux ensemble.** Une clause qui annonce une procédure que
> l'application ne sait pas exécuter, c'est le « X est prévenu » du 01/10 : un
> bandeau qui promet, et rien derrière. Si c'est trop gros, alors on ne propose
> pour ce sujet **qu'une phrase purement informative**, qui ne promet aucune
> procédure.

### 3. Le numéro de TVA doit-il s'imprimer sur vos devis ?

Ce n'est pas la même question que la question 1 du plan (votre régime). Celle-ci
porte sur une **case du document**, et elle décide si Opus a besoin d'une
vérification VIES un jour ou jamais.

> **Par défaut : on imprime le numéro UNIQUEMENT si l'API le rend**, jamais un
> numéro calculé, et le champ reste **modifiable à la main** — la liste DGFiP est
> à J+1, donc une entreprise qui vient d'obtenir son numéro peut ne pas y être
> encore. **Pas de VIES dans ce lot** : les limites de débit ne sont pas
> documentées et les appels ont dû être espacés de 8 à 12 secondes. Ce serait un
> lot à part, plus tard, s'il sert.

---

## Et trois choses que je ne sais pas, et que je préfère dire

1. **Qui porte la responsabilité d'un préremplissage faux, ou d'une clause fournie
   par Opus que vous cochez et qui vous vaut une amende.** Aucune jurisprudence
   trouvée — seulement le cadre général : le devis signé vaut contrat, et les
   mentions incombent à celui qui l'émet. **Je ne construirai pas un raisonnement
   juridique sur des blogs d'éditeurs concurrents.** C'est une question pour un
   avocat.

   Ce qui en découle de pratique, en revanche, tient en une ligne et vaut quoi
   qu'en dise le droit : **Opus ne coche jamais à votre place, et tout champ
   prérempli doit se voir comme prérempli et pouvoir être corrigé.**

2. **Le schéma exact d'Opus n'a jamais été jugé.** Les deux décisions qui
   autorisent la bibliothèque concernent des modèles fournis à des
   **consommateurs** pour leur propre litige. Ici, un **professionnel** reçoit le
   texte d'un contrat qu'il fait signer à un tiers. Le raisonnement du juge porte
   sur **qui fait le travail de choix**, pas sur la qualité du destinataire — donc
   il se transpose. **Ce n'est pas démontré.** Et je n'ai pas vérifié si cette
   décision de 2018 a été frappée de pourvoi.

3. **Légifrance refuse l'accès depuis cette machine** (403, en boucle, par deux
   chemins différents). Tous les textes cités ici viennent de reproductions
   consolidées datées et du document du Conseil national des barreaux, extraits et
   lus. **Vous y accédez depuis votre navigateur.** Avant qu'une seule citation ne
   s'affiche dans Opus, elle doit être recopiée **mot pour mot** depuis la source
   officielle — une citation approximative dans un fichier qui parle de clauses
   abusives serait l'ironie la plus coûteuse de ce projet.

Et deux mesures qui n'ont pas abouti, pour ne pas les redécouvrir : le cas des
**départements et territoires d'outre-mer** (où l'absence de numéro de TVA a une
**troisième** signification — un régime territorial différent, et non la franchise)
et celui des **codes de forme juridique retirés** de la nomenclature (un artisan
installé en 2015 peut porter un code que la liste de 2022 ne sait plus nommer, d'où
le repli « code inconnu »). Les deux ont été coupés par le mandataire du conteneur,
qui interrompt environ une connexion sur deux vers ces services.

---

# 8. LA DÉCISION DU 12/10/2026 — le SIRET devient la CONDITION d'inscription

Vos mots, et je les garde entiers parce que c'est une décision de produit, pas
une préférence d'écran :

> « non je ne suis pas aderent. je comprend quand tu dit que je n'est pas de
> siret etc mais il faut créé opus dans le sens ou tous les artisans qui vont
> s'inscrire serons eux bien imatriculer (est justement en allant recuperer leur
> inforamation sur leur societe et la condition pour s'inscrire en tant que
> profesionel, si le numero de siret ne corepond a rien on ne peut pas lui créé
> de compte c'est ce qui va dire que opus valide cest artisan. quand on recupere
> les information je veut que sa remplis automatiquement tous les champs ou les
> information sont demander il ne peut pa modifer sont numero de siret etc est
> avec le code ape on peut deja bloquer le metier principal de l'artisan »

Quatre décisions là-dedans. **Trois sont bonnes et je les construis telles
quelles. La quatrième — l'APE qui bloque le métier — enfermerait de vrais
artisans hors de leur propre métier**, et c'est mesuré plus bas, pas supposé.

## 8.1 Votre décision ne prépare pas l'avenir : elle rebouche un trou OUVERT

C'est le point que je n'avais pas vu avant de le mesurer, et il change
l'urgence du lot. Relevé sur VOTRE base le 12/10 :

| | |
|---|---|
| fiches professionnelles | **7** |
| qui portent un SIRET | **7** (dont 2 une chaîne **vide**, pas `null`) |
| donc avec un SIRET écrit | **5** |
| …dont le SIREN existe dans SIRENE | **0 sur 5** |
| …qui portent le badge **vérifié** | **3** |

Les cinq ont été croisés un par un avec le registre, puis une seconde fois sur
le SIREN seul (les neuf premiers chiffres) au cas où seul l'établissement
aurait été faux. **Dix recherches, zéro résultat.** Et pour prouver que ce zéro
n'est pas une panne du conteneur, le même protocole, dans la même minute, sur
un SIRET réel : **1 résultat**.

L'un des cinq est `812 345 678 00019`. Comptez les chiffres : 8-1-2-3-4-5-6-7-8.

> **Opus affiche donc aujourd'hui trois badges « vérifié » — qui attestent une
> ENTREPRISE, c'est écrit dans CLAUDE.md — sur des numéros qui ne désignent
> aucune entreprise.** C'est exactement le défaut que ce projet traque depuis
> le 01/10 : une promesse que rien ne tient. Le badge dit « nous avons
> contrôlé », et rien n'a jamais été contrôlé.

Ce sont des fiches de mise au point, pas des artisans qui vous ont menti —
elles ont été créées pendant le développement. Mais elles prouvent la chose
qui compte : **le champ SIRET est aujourd'hui un champ de texte libre, et rien
dans Opus ne le confronte à quoi que ce soit.** Le premier artisan qui tape
quatorze chiffres au hasard obtient la même fiche qu'un artisan immatriculé.

Et la colonne elle-même est en l'état :

| | |
|---|---|
| format rangé | `123 456 789 00012` — **17 caractères, espaces comprises** |
| contrainte en base | **aucune** sur le SIRET de `professional_profiles` |
| chaînes vides | **2**, là où le reste du projet range `null` |

À comparer avec le carnet de clients, écrit la veille : `client_siret_check`
impose quatorze chiffres, et le déclencheur retire les espaces avant de ranger.
**La fiche de l'artisan est moins exigeante sur son propre SIRET que sur celui
de ses clients.**

## 8.2 « si le numéro ne correspond à rien, on ne peut pas lui créer de compte »

Buildable, et la recherche est **exacte** — mesuré :

| | |
|---|---|
| recherche sur un SIRET à 14 chiffres | **`total_results: 1`** |
| l'établissement rendu | celui du SIRET demandé, et lui seul |
| le service | `recherche-entreprises.api.gouv.fr`, **ouvert, sans clé** |

Donc le mécanisme est franc : quatorze chiffres entrent, une entreprise sort,
ou rien ne sort. Pas d'approximation, pas de score à interpréter — contrairement
à la Base Adresse, qui rend « 4 Rue des Acacias » quand on lui demande « 4 rue
des Lilas » (section 4 du plan devis).

**Mais « correspond à rien » a trois formes, et une seule est celle que vous
avez en tête.**

### Forme 1 — le numéro ne désigne aucune entreprise. On refuse.

C'est votre cas, et il ne pose aucun problème.

### Forme 2 — le numéro désigne une entreprise RADIÉE. Il FAUT la refuser aussi.

Et ça, il faut le savoir, parce que l'API ne le fait pas pour vous :

| | |
|---|---|
| entreprises **cessées** en 43.99C que l'API rend volontiers | **plus de 10 000** |
| la plus ancienne vue dans l'échantillon | cessée, créée en **2011** |
| le champ qui le dit | `etat_administratif` = `C` au lieu de `A` |

> **Un SIRET radié en 2011 passerait votre condition.** Il « correspond » à
> quelque chose : à une entreprise qui n'existe plus. Sans le test de
> `etat_administratif`, Opus décernerait son badge le plus fort à une
> entreprise fermée depuis quinze ans — et le ferait avec la bonne foi d'un
> contrôle réussi.

C'est une ligne de code. Mais c'est une ligne qu'on n'écrit pas si on ne sait
pas que le registre garde ses morts.

### Forme 3 — l'entreprise existe, est active, et le registre REFUSE de la décrire

C'est le cas qui me gêne, et **je n'ai pas réussi à en fabriquer un** : sur les
cinquante entreprises interrogées, y compris en demandant explicitement les non
diffusibles et en me limitant aux entrepreneurs individuels — qui sont
justement votre population —, **les cinquante sont diffusibles**
(`statut_diffusion: 'O'`).

> Donc je ne peux pas vous dire ce qu'Opus verrait d'une entreprise non
> diffusible. Ce que je sais, c'est que le droit permet à une personne physique
> de demander à ne pas être diffusée, et que le champ existe dans l'API — donc
> le cas existe. **Un artisan parfaitement immatriculé, qui a exercé ce droit,
> se verrait refuser son compte**, et le message d'erreur lui dirait que son
> numéro ne correspond à rien. Ce serait faux, et il n'aurait aucun recours.

La parade ne coûte rien et ne dépend pas de la mesure : **le refus doit nommer
sa cause**. « Ce numéro ne figure pas au registre » et « ce numéro existe mais
le registre ne le publie pas » ne sont pas la même phrase, et la seconde doit
offrir une porte — un envoi de Kbis à la main, qui est de toute façon la file
du back-office déjà construite en section 25.

### Et une quatrième forme, que je n'ai pas pu mesurer du tout

**Le délai.** Un artisan qui s'immatricule un lundi apparaît-il dans l'API le
mardi ? J'ai essayé de le mesurer et **les filtres de date de l'API sont
ignorés** : en demandant les entreprises créées après le 01/09/2026, elle m'a
rendu des entreprises de 1990. Je n'ai donc aucun chiffre.

> **Pourquoi ça compte quand même** : le moment où un artisan cherche un outil
> de gestion, c'est la semaine où il s'installe. Si le registre met trois
> semaines, Opus refuse ses inscrits les plus motivés, à l'heure exacte où ils
> sont motivés. La porte du Kbis à la main est la même que pour la forme 3 —
> **une seule porte pour les deux**, et c'est une raison de plus de la poser.

## 8.3 « ça remplit automatiquement tous les champs » — oui, et sept champs arrivent

Mesuré sur une entreprise réelle de maçonnerie, les champs qui remplissent
vraiment un formulaire :

| le champ Opus | ce que le registre donne | relevé |
|---|---|---|
| entreprise | `nom_raison_sociale` | `LSR MACONNERIE` |
| forme juridique | `nature_juridique` | `5499` → un **code**, pas un nom |
| adresse du siège | `siege` | complète, avec la commune |
| ville + code postal | `siege.libelle_commune` | `MALLEMORT` |
| année de création | `date_creation` | `2022-04-04` |
| TVA intracommunautaire | `tva` | `["FR29912517935"]` |
| code APE | `activite_principale` | `43.99C` |

Trois choses à savoir avant de brancher ça sur un formulaire, et les trois sont
déjà dans les sections 1 et 2 de ce document — je les rappelle parce que votre
décision les rend obligatoires plutôt qu'optionnelles :

1. **`nature_juridique` est un code numérique**, pas « SARL ». Il faut la table
   de correspondance, et elle doit avoir un repli — un artisan installé en 2015
   peut porter un code que la nomenclature d'aujourd'hui ne nomme plus.
2. **`tva` est une LISTE, et elle peut être vide** — 5 entreprises sur 25 n'ont
   aucun numéro. C'est la correction que je vous ai dû en section 2 : j'avais
   écrit que ce numéro était calculé donc toujours présent, et c'était faux.
   Une liste vide **ne prouve pas** la franchise de TVA, elle ne prouve rien.
3. **Pour un entrepreneur individuel, le nom de l'entreprise est le nom de la
   personne.** Mesuré : `nom_complet` = `DAMIEN CHEMIN`. C'est juste
   légalement, mais ça veut dire que le champ « entreprise » d'Opus affichera
   un nom civil, et qu'il ne faut pas s'en étonner.

## 8.4 « il ne peut pas modifier son numéro de SIRET » — oui pour le SIRET, NON pour le reste

Votre instinct est juste, et il tient à une propriété du SIRET que les autres
champs n'ont pas :

> **Un SIRET ne change jamais.** Il est attribué une fois, il meurt avec
> l'établissement. Le figer, c'est figer un fait.
>
> **L'adresse du siège, elle, change.** Un artisan déménage. Et une adresse
> figée se retrouverait imprimée sur un devis, c'est-à-dire sur un document qui
> engage — avec la mauvaise adresse, verrouillée, sans moyen de la corriger.

C'est la même distinction que le projet tient déjà pour le badge : `verifie`,
`kbis_valide`, `assurance_valide` sont verrouillés par un déclencheur parce
qu'un humain les valide ; le téléphone et l'e-mail professionnel sont libres
parce qu'ils appartiennent à l'artisan.

| champ | verrouillé ? | pourquoi |
|---|---|---|
| **SIRET** | **oui, pour toujours** | ne change jamais ; c'est la preuve |
| forme juridique | oui | change par un acte, pas par une humeur |
| année de création | oui | c'est une date passée |
| TVA intracommunautaire | oui | attribué par la DGFiP |
| **adresse du siège** | **non** — préremplie, corrigeable | elle part sur un devis |
| **nom commercial** | **non** | « LSR MACONNERIE » au registre, « LSR » sur le camion |
| **métiers** | **non** — voir 8.5 | |

Et le verrou se tient par un **déclencheur**, pas par l'écran : c'est la règle
du projet depuis le 29/09 — « toute colonne qu'un humain doit valider se
protège par un déclencheur ». Un écran qui grise un champ ne protège rien, la
clé publiable est dans le paquet de l'application.

## 8.5 LE SEUL POINT QUE JE REFUSE : l'APE ne peut PAS bloquer le métier

Vous écrivez « avec le code ape on peut deja bloquer le metier principal de
l'artisan ». **Le mot « bloquer » est celui qui fait tout le mal** — et voici
ce que j'ai mesuré avant de vous répondre.

### Un seul code APE couvre des métiers qui n'ont rien à voir

`43.99C`, le code de l'entreprise de maçonnerie que j'ai prise en exemple.
Vingt-cinq entreprises qui le portent, prises dans le registre :

```
SPIE BATIGNOLLES NORD                    → entreprise générale
RAMERY GENIE CIVIL                       → génie civil
ALTRAD COFFRAGE ET ETAIEMENT             → coffrage
ALUMINIUM BOIS PVC MENUISERIE DUNOISE    → MENUISERIE
CHARPENTIER P M                          → charpente
TECHNISOL                                → sols
LSR MACONNERIE                           → maçonnerie
```

> **Une menuiserie et un terrassier partagent le code d'un maçon.** Bloquer le
> métier sur ce code, c'est écrire « maçon » sur la fiche d'`ALUMINIUM BOIS PVC
> MENUISERIE DUNOISE` et lui interdire de le corriger. Le catalogue d'Opus
> compte **six métiers** dans la seule catégorie gros œuvre — `macon`,
> `maconnerie-generale`, `macon-patrimoine`, `coffreur-bancheur`,
> `ferrailleur`, `tailleur-pierre` — et ce code ne sait pas les distinguer.

### Et pour certains métiers, le code est carrément dispersé

Mesuré en interrogeant le registre sur huit métiers, puis en comptant les codes
APE distincts des vingt-cinq premières entreprises de chaque réponse :

| métier cherché | codes APE distincts sur 25 entreprises | le plus fréquent |
|---|---|---|
| architecte | **1** | 71.11Z × 25 |
| électricien | 4 | 43.21A × 22 |
| carreleur | 4 | 43.33Z × 21 |
| plaquiste | 5 | 43.31Z × 21 |
| plombier | 6 | 43.22A × 19 |
| menuisier | 7 | 43.32A × 13 |
| **peintre** | **19** | 46.73B × 4 |
| **couvreur** | **18** | 43.91B × 4 |

(Le protocole a un biais que je dois dire : une recherche sur le mot
« couvreur » attrape aussi des sociétés civiles immobilières dont le gérant
s'appelle Couvreur. Mais le biais ne sauve pas la conclusion : même en
cherchant « couvreur », le code de la couverture n'arrive qu'en tête avec
4 occurrences sur 25.)

> Pour un architecte, l'APE est une preuve. **Pour un couvreur, c'est une
> rumeur.** Et c'est la moitié de votre population.

### Trois raisons de plus, qui ne dépendent d'aucune mesure

1. **Une entreprise a UN code APE. Opus autorise QUATRE métiers.** C'est écrit
   dans le catalogue depuis le premier jour, et c'est juste : un maçon qui pose
   aussi du carrelage est un cas normal, pas une fraude. Bloquer sur l'APE
   ramène quatre à un.
2. **L'APE est DÉCLARATIF.** Il est posé à l'immatriculation, d'après ce que
   l'artisan a décrit ce jour-là, et il ne se met presque jamais à jour. Un
   couvreur qui s'est installé comme auto-entrepreneur en peinture en 2019 et
   qui fait des toitures depuis 2021 porte encore 43.34Z. Il n'a rien fait de
   mal ; le registre est en retard, c'est tout.
3. **Votre propre catalogue le dit déjà.** Les quinze catégories comptent
   `conseil`, `etudes`, `mesure`, `conception` — 34 métiers sur 92 qui ne sont
   pas du bâtiment au sens de la section F. Un courtier en assurance
   construction est en 66.22Z. Si l'APE décide, il n'entre pas.

### CE QUI MARCHE, et qui vous donne ce que vous cherchez

Vous cherchez à ce qu'Opus ne soit pas rempli de gens qui se déclarent n'importe
quoi. Le SIRET valide fait déjà **tout ce travail** : il prouve qu'il y a une
entreprise réelle, active, immatriculée, derrière le compte. L'APE n'y ajoute
rien sur ce plan.

> **L'APE PROPOSE le métier, il ne le bloque pas.** Le sélecteur s'ouvre avec
> `macon` déjà coché quand le code est 43.99C, avec la phrase « d'après votre
> code d'activité — corrigez si ce n'est pas le bon ». L'artisan décoche en un
> geste.
>
> Vous gagnez ce que vous voulez vraiment : **un formulaire déjà rempli**, et
> dans la grande majorité des cas (électricien, plombier, carreleur, plaquiste,
> architecte) la proposition sera juste du premier coup. Et vous ne payez pas
> le prix que le blocage coûterait : **un couvreur qui ne peut pas déclarer
> qu'il est couvreur abandonne l'inscription, et ne revient pas.**

Et il reste une chose que l'APE sait faire sans risque, parce qu'elle ne ferme
aucune porte : **compter**. Le jour où une fiche déclare `avocat` avec un code
APE de maçonnerie, ça n'empêche rien, mais ça s'inscrit dans la file du
back-office — à côté des Kbis. Un humain regarde. C'est exactement le niveau de
confiance que mérite un champ déclaratif.

## 8.6 Ce que ça fait au badge « vérifié » — deux niveaux, pas un

Attention à ne pas écraser un mécanisme déjà construit. Aujourd'hui, `verifie`
se déduit de `kbis_valide AND assurance_valide`, et un humain valide les deux
pièces depuis le back-office. La règle du projet est formelle : **« le badge ne
se décerne pas soi-même »**.

Votre condition d'inscription ne remplace pas ça — et il ne faut surtout pas
qu'elle le remplace :

| | ce que ça prouve | qui le vérifie |
|---|---|---|
| **SIRET valide** (nouveau) | l'entreprise existe et est active | **la machine**, à l'inscription |
| **badge vérifié** (existant) | les pièces ont été lues | **un humain**, après |

> Un SIRET actif ne dit **rien** de l'assurance décennale. Et c'est la décennale
> qui protège le client — c'est tout le sens du travail du 04/10 sur les pièces
> justificatives par catégorie. Fusionner les deux niveaux donnerait un badge
> « vérifié » à toute entreprise immatriculée, **c'est-à-dire à un maçon sans
> assurance**.

Ce que la condition change, en revanche, et c'est un vrai gain : **le
back-office n'aura plus à vérifier que l'entreprise existe** — c'est fait. Il
ne lui restera que la question qu'une machine ne sait pas trancher : est-ce que
cette attestation d'assurance est authentique et à jour.

## 8.7 Et les sept fiches qui sont déjà là

Il n'y a pas de rattrapage possible, et c'est la même règle que
`completerLieu()` : **on ne devine pas à la place de quelqu'un.** Les cinq
SIRET inventés ne peuvent pas être corrigés par Opus — personne ne sait quel
était le vrai.

Ce qui peut se faire, et qui est honnête :

1. **la condition s'applique aux inscriptions NOUVELLES.** Les comptes
   existants continuent de fonctionner ;
2. **les trois badges décernés sur un SIRET inexistant sont un vrai problème,
   et il vous appartient** — ce sont des fiches de votre base. Soit elles sont
   de mise au point et elles partent, soit elles sont réelles et le badge doit
   être retiré jusqu'à contrôle. Je ne peux pas trancher ça : le connecteur
   refuse les suppressions, et surtout ce n'est pas ma décision ;
3. **un artisan existant qui enregistre son profil passe par la vérification**
   — comme `completerLieu()` qui complète les coordonnées à l'enregistrement.
   La base se corrige d'elle-même, au rythme où les gens s'en servent.

## 8.8 Les quatre questions que cette décision ouvre

1. **Un particulier s'inscrit-il toujours sans rien ?** Oui je suppose — la
   condition ne vise que l'inscription « en tant que professionnel », c'est vos
   mots. Mais il faut le confirmer : aujourd'hui le choix du type de compte est
   un simple bouton, et rien n'empêche un artisan de cocher « particulier »
   pour éviter le contrôle. Il n'aurait alors pas le droit de publier — donc ça
   se tient.

2. **Que fait Opus si le registre est INJOIGNABLE ? — TRANCHÉ le 12/10 :**

   > « on refuse on demande de reessayer ou de contacter la plateforme »

   C'est le bon choix, et il faut dire pourquoi, parce qu'il **renverse une
   règle du projet**. Partout ailleurs, « l'échec ne bloque rien » : le vibreur
   absent n'empêche pas de publier, la Base Adresse muette n'empêche pas de
   créer un compte, un réseau coupé n'empêche pas de poser une annonce.

   > **Ici l'échec DOIT bloquer, et c'est la seule exception du projet.** Une
   > condition qui s'efface quand le service est en panne n'est pas une
   > condition : c'est une porte qu'il suffit d'attendre. Et comme elle
   > s'effacerait **en silence**, personne ne saurait quels comptes sont
   > passés par là.

   Deux conséquences qu'il faut construire avec, et pas découvrir après :

   **(a) Le message ne doit JAMAIS accuser son numéro.** « Ce numéro ne
   correspond à rien » alors que c'est le service public qui est tombé est un
   mensonge, et il est cher : l'artisan croit que son entreprise n'est pas
   enregistrée. Les six issues d'une saisie de SIRET — mal formé, inexistant,
   cessé, non diffusible, registre injoignable, tout va bien — doivent donner
   **six messages différents**, et c'est exactement la discipline du 01/10
   (« un travail qui n'a pas pu se faire ne doit jamais ressembler à un travail
   fait »).

   **(b) « Contacter la plateforme » doit mener quelque part.** Mesuré le jour
   même : `src/data/legal.js` porte `EDITEUR.email = 'contact@opus-project.fr'`,
   avec ce commentaire écrit le 21/09 — *« À VÉRIFIER : cette adresse doit
   exister et être relevée. »* Vérifié en interrogeant le DNS :

   | | |
   |---|---|
   | le domaine `opus-project.fr` existe | **oui** |
   | il porte un enregistrement de courrier (MX) | **oui** — `mail.opus-project.fr` |
   | la boîte `contact@` est-elle **relevée** | **je ne peux pas le savoir** |

   Donc la porte existe techniquement. **La seule chose qui manque est de
   savoir si vous lisez cette boîte**, et c'est la question que je vous pose
   plus bas — parce qu'un refus d'inscription qui renvoie vers une adresse
   morte fait perdre un artisan sans qu'il puisse rien tenter.

   Et un refus n'est pas un cul-de-sac : il doit **laisser une trace** dans la
   file du back-office déjà construite en section 25, avec le numéro saisi et
   la raison du refus. Sinon « contactez-nous » oblige l'artisan à tout
   réexpliquer, et vous à le croire sur parole.

3. **Un artisan qui change d'entreprise** (il ferme son auto-entreprise, il
   crée une SARL) a un NOUVEAU SIRET. Avec un SIRET verrouillé à vie, il doit
   créer un second compte et perd ses avis, ses publications, ses chantiers.
   Le vrai geste est un changement de SIRET **par le back-office**, avec
   contrôle — mais ce n'est pas le lot d'aujourd'hui, et il faut savoir qu'on
   le laisse de côté.

4. **Est-ce que je construis ça avant les devis, ou après ?** Mon avis : **avant
   l'écran du devis, et c'est même le nouveau lot 0.** Parce que les sept
   champs qu'il remplit sont exactement ceux dont le devis a besoin pour
   s'imprimer — la raison sociale, la forme juridique, le SIRET, l'adresse, la
   TVA. Les faire taper à la main dans l'écran du devis, puis les remplacer
   trois lots plus tard, c'est écrire deux fois le même écran.

5. **LA QUESTION QUI BLOQUE, et elle est à vous seul : relevez-vous
   `contact@opus-project.fr` ?** Le domaine existe et route le courrier
   (mesuré), mais je ne peux pas savoir si quelqu'un lit cette boîte. Dès que
   le registre sera une condition d'inscription, cette adresse devient **la
   seule porte de secours** d'un artisan immatriculé qu'Opus refuse — parce que
   sa société n'est pas diffusible, parce qu'elle vient d'être créée, ou parce
   que le service public est en panne. Trois réponses possibles, et chacune
   mène à un écran différent :
   - **oui, je la relève** → le message dit « écrivez-nous à cette adresse » ;
   - **non, mais je peux** → à faire avant de livrer le lot ;
   - **non, et je ne veux pas** → alors la porte de secours doit vivre DANS
     Opus : un formulaire qui dépose la demande dans la file du back-office,
     avec le numéro saisi. C'est plus de travail, mais ça ne dépend d'aucune
     boîte aux lettres.
