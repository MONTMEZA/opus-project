# Ma lecture du cahier des charges

Écrit le 29/09/2026, après lecture des 28 sections de
`docs/CAHIER-DES-CHARGES.md`. **Ce fichier est mon analyse, pas la parole du
propriétaire** — le document de référence, c'est l'autre.

Objet : ce que ce cahier des charges change, ou ne change pas, à la façon de
terminer la première brique (réseau social + profil pro).

---

## En une phrase

Le cahier des charges décrit un **logiciel de gestion d'entreprise du
bâtiment piloté par un agent IA**, dont le réseau social n'est qu'un module.
Ce qui est construit aujourd'hui correspond à la **phase 9 sur 12** de la
propre liste du propriétaire (§27).

Ce n'est pas un reproche à l'ordre choisi : le réseau social est ce qui peut
attirer les premiers artisans, et sans artisans le reste ne sert à rien. Mais
il faut le dire clairement : **« finir la brique 1 » ne veut pas dire « les
fondations sont posées »**. Les fondations, ce sont les phases 1 et 2, et
elles ne sont pas commencées.

---

## 1. Ce que ça ne change PAS

L'ordre arrêté pour terminer la brique 1 reste le bon :

1. photos redimensionnées avant envoi ;
2. pagination du fil ;
3. temps réel + messages lus ;
4. profil pro complet ;
5. finitions.

Mieux : le §22 dit exactement la même chose que le point 2, appliqué à l'IA —
« Le système doit éviter d'envoyer inutilement toute la base de données au
modèle. » Aujourd'hui, `loadAll()` envoie toute la base **au téléphone**.
C'est le même défaut, et le corriger maintenant sert les deux.

---

## 2. Ce que ça change, concrètement, tout de suite

### Une seule migration du profil au lieu de trois

Le §6 énumère ce que doit porter le profil public. En le croisant avec ce qui
manque aujourd'hui :

| §6 demande | État | Décision |
| --- | --- | --- |
| Logo / photo | ✅ existe | — |
| Présentation | ✅ existe | — |
| Métiers **et spécialités** | ⚠️ métiers seuls | **ajouter `specialites`** |
| Zone d'intervention | ❌ SOS seulement | **ajouter** |
| Expérience | ✅ existe | — |
| Certifications et documents vérifiés | ⚠️ `rge` en base, jamais utilisé | **exploiter** |
| Réalisations, avis, publications | ✅ existent | — |
| Disponibilités / « Prendre rendez-vous » | ❌ | phase 5 — ne rien construire |
| Recrutement | ❌ | phase 10 — ne rien construire |
| Bouton privé « Mon Dashboard » | ❌ | phase 2 — prévoir la place, pas l'écran |

Et le téléphone, absent du §6 mais indispensable à un annuaire
professionnel : aujourd'hui le champ n'existe que du côté particulier.

**Donc : une migration unique** — `specialites`, `zone_km`, exploitation de
`rge`, `telephone` côté pro. C'est précisément ce que permet d'avoir reçu le
cahier des charges avant de commencer.

### Ne plus ajouter d'actions IA « à la main »

La fonction Edge `ai` porte aujourd'hui quatre actions écrites au fil de
l'eau (`match`, `summary`, `bio`, `ameliorer`). Le §4 (niveaux d'autonomie),
le §21 (journal d'audit des actions IA) et le §22 (récupération contextuelle)
décrivent une architecture que ces quatre actions ne respectent pas.

Il n'y a rien à refaire aujourd'hui — elles fonctionnent. Mais **ne plus en
ajouter une cinquième sur le même modèle** : la prochaine action IA se
construit avec le journal et les permissions, ou elle sera à refaire.

---

## 3. Les trois écarts structurels, par ordre de coût

### 3.1 « Une entreprise » n'existe pas dans le modèle actuel — LE point dur

Aujourd'hui : `professional_profiles.id` **est** `users.id` **est**
`auth.uid()`. Un compte = un artisan. Il n'y a ni entreprise, ni salarié, ni
rôle.

Le cahier des charges en a besoin à cinq endroits :

- §5 « Entreprise / compte professionnel », « Utilisateur / salariés / rôles » ;
- §11 « Planning des salariés / équipes » ;
- §21 « Système de permissions par utilisateur, entreprise et rôle » ;
- §23 « Isolation des données entre entreprises » ;
- §4 « selon les permissions de l'utilisateur ».

Concrètement, il faudra une table `entreprises`, une table
`membres (utilisateur, entreprise, rôle)`, et **tout ce qui est aujourd'hui
rattaché à l'artisan devra être rattaché à l'entreprise** : publications,
devis, chantiers, clients, documents.

**Conséquence qu'il faut regarder en face : toutes les règles RLS écrites la
semaine dernière seraient à réécrire.** Elles disent `auth.uid() = author_id` ;
elles devront dire « l'appelant est membre de l'entreprise propriétaire, avec
un rôle qui l'autorise ».

Ce n'est pas un travail de la brique 1 — c'est la **phase 1 de sa propre
liste**. Mais deux choses sont vraies en même temps :

- le coût de ce changement **augmente avec chaque module construit** : le
  faire avant devis/chantiers/factures coûte une journée, le faire après en
  coûte plusieurs ;
- aujourd'hui il y a **11 comptes et 13 publications** à migrer. C'est le
  moment le moins cher de toute la vie du projet.

**Règle à tenir en attendant** : ne rien construire de nouveau qui enfonce
l'hypothèse « un compte = un artisan ».

### 3.2 Le côté PARTICULIER n'apparaît nulle part dans le cahier des charges

Ni dans les 28 sections, ni dans les 12 phases. Le document est
**intégralement tourné vers le professionnel** : les seuls « clients » qu'il
mentionne sont des fiches dans le CRM de l'artisan (§5, §9), pas des
utilisateurs de l'application.

Or ce qui existe aujourd'hui côté particulier n'est pas rien :

- les **demandes de travaux** (`demandes`, `demande_reponses`) et leur écran ;
- le **SOS urgence** (`sos_availability`, `sos_requests`, `SosScreen`) ;
- le **profil public d'un particulier** ;
- les **avis**, qui sont écrits par des particuliers — et qui, eux, sont bien
  au §6.

**RÉPONSE DU PROPRIÉTAIRE, 29/09/2026 : « on les garde, c'est un oubli ».**

Le cahier des charges décrit la partie professionnelle, mais les particuliers
restent dans Opus. `DemandesScreen`, `SosScreen` et le profil public
particulier sont donc à terminer et à optimiser **au même titre que le reste
de la brique 1**.

À retenir pour la suite : le cahier des charges est un document sur le côté
PRO, pas une description exhaustive d'Opus. Ne pas en déduire qu'une
fonctionnalité absente du document est abandonnée — demander.

### 3.3 Le Dashboard de la phase 2 n'a presque pas de données à montrer

Le §8 demande CA, devis en attente, factures impayées, chantiers actifs,
marge. **Rien de tout cela n'existera avant la phase 4.** Un « dashboard de
base » construit aujourd'hui ne pourrait montrer que : publications, vues,
abonnés, avis reçus, demandes reçues.

Ce n'est pas inutile — mais il faut le nommer autrement que « Dashboard »,
sinon il décevra, et il faut le construire **après** la brique 1, pas dedans.

---

### 3.4 Le dossier de sous-traitance n'est PAS dans le Dashboard

Question du propriétaire, le 04/10/2026 : « le dossier de sous-traitance et
autres devraient se trouver dans le futur Dashboard qu'on doit créer, comme
indiqué dans le cahier des charges ? »

**Non — et le document le dit lui-même, en toutes lettres.**

> §8 : « Le Dashboard est le cockpit de l'entreprise. Il ne doit pas
> remplacer l'Agent : le Dashboard **montre visuellement** les données ;
> l'Agent permet de les interroger et d'agir dessus. »

Le Dashboard est un endroit où l'on REGARDE. Tout ce qu'il énumère — CA,
devis en attente, factures impayées, chantiers actifs, graphiques — sont
des **vues** sur des données qui vivent ailleurs. Le §8.2 est encore plus
net : « Les graphiques sont alimentés automatiquement par la base de
données. L'artisan ne doit pas saisir manuellement les statistiques. »

**Le dossier de sous-traitance appartient au CHANTIER (§12).** Deux
preuves, dans le document :

1. la liste du §12 — « Un chantier doit devenir un **dossier central** qui
   rassemble toutes les informations utiles » — contient *client, adresse,
   devis lié, montant, acompte, dates, avancement, prestations, matériaux,
   plans, photos/vidéos, temps passé, équipe, **sous-traitants**, dépenses,
   factures, documents, marge, historique des décisions, rapport final* ;
2. le §18 « Sous-traitance entre professionnels » **commence** par
   « Création d'un **dossier chantier** ».

Autrement dit : on ne sous-traite pas dans l'abstrait. On sous-traite un
morceau d'un chantier qu'on a. Et la deuxième ligne du §18 — « photos,
plans, description vocale, prestations, prix et délais » — est
mot pour mot ce que le chantier porte déjà.

> **Construire un « dossier de sous-traitance » avant le chantier
> fabriquerait un cinquième objet flottant**, avec ses photos, ses plans,
> ses prix et ses dates à ressaisir à la main. C'est précisément ce que le
> §28 interdit : « si elle oblige l'artisan à remplir plusieurs écrans
> alors qu'Opus possède déjà l'information, l'expérience doit être
> simplifiée. »

**Le partage du travail, à retenir :**

| | |
|---|---|
| **Place des pros** (fait) | la porte d'entrée — on se rencontre |
| **Chantier** (§12, phase 6) | le dossier — qui fait quoi, à quel prix, avec quels plans |
| **Dashboard** (§8, phase 2) | la vue — « 3 chantiers actifs », « une réponse attend » |
| **Agent** (§19-21) | l'action — « décale Martin à jeudi » |

#### Et le chantier est le premier objet qui force la question « entreprise »

C'est le lien avec le §3.1 ci-dessus, et il faut le voir venir : la liste du
§12 contient **« Équipe »** et **« Sous-traitants »**. Aujourd'hui, dans
Opus, tout appartient à une PERSONNE — un compte, une fiche, des
publications. Un chantier avec une équipe, non.

> **Avant la première ligne de code d'un chantier, il faut trancher : un
> chantier appartient-il à un artisan, ou à une entreprise ?** Si c'est à
> une entreprise, toutes les règles RLS sont à réécrire — ce que ce
> document signale depuis le 29/09 comme LE point dur.

Le cahier des charges a d'ailleurs tranché : sa **phase 1** est
« Base de données + authentification + **entreprises + rôles** ».

---

## 4. Ce qui n'est PAS perdu

Rien de ce qui a été construit n'est à jeter, et deux morceaux tombent même
pile :

- la **Place des pros** correspond au §18 (sous-traitance entre
  professionnels, phase 10) — déjà à moitié construite ;
- le type d'annonce **fournisseur** correspond au §14 (phase 8) ;
- le **signalement, le blocage et les droits RGPD** sont exigés par le §23 ;
- le **badge vérifié** est le « Certifications et documents vérifiés » du §6 ;
- l'**IA qui améliore un texte** est le §19.

---

## 5. Ce que je dois signaler, et qui n'est pas dans le document

### La facturation (§10) est un module RÉGLEMENTÉ, pas un écran

Une facture émise en France porte des mentions obligatoires, une
**numérotation séquentielle et inaltérable**, et des obligations de
conservation. Surtout : la **facturation électronique entre entreprises**
devient obligatoire par paliers, et une facture devra transiter par une
plateforme agréée.

Le calendrier de cette réforme a déjà été repoussé plusieurs fois :
**à vérifier au moment de construire le module**, pas aujourd'hui. Mais il
faut le savoir maintenant, parce que ça change la nature du module : ce n'est
pas « un écran de plus », c'est un sujet de conformité.

### Les DTU et les normes (§16) ne se recopient pas

Le propriétaire a lui-même écrit la bonne réserve (« lorsque leur utilisation
et leur accès sont légalement/licenciablement disponibles »). À tenir : les
DTU sont des documents payants de l'AFNOR et du CSTB. On peut **y renvoyer et
les citer**, on ne peut pas les recopier dans une base de connaissances.

### Le coût de l'IA devient un coût PAR ARTISAN ET PAR MOIS

Aujourd'hui, l'IA est appelée quand quelqu'un appuie sur un bouton. Un agent
personnel qui lit les données à chaque question, c'est un coût récurrent par
utilisateur. À chiffrer **avant la phase 3**, pas après : c'est ce qui décide
du prix de l'abonnement, donc du modèle économique.

Le §22 (n'envoyer que le contexte nécessaire) n'est pas qu'une question de
propreté — c'est directement ce qui fait la différence entre une facture
tenable et une facture qui ne l'est pas.

---

## 6. Ce que j'attends comme réponse

1. ~~Les particuliers : on les garde ?~~ **Répondu le 29/09/2026 : oui**,
   c'était un oubli du document. Ils sont dans la brique 1.
2. **Le multi-entreprise (3.1)** : ma lecture est qu'il appartient à la
   phase 1 et pas à la brique 1 — donc **pas maintenant**, conformément à la
   consigne « finir l'existant d'abord ». À corriger si c'est faux.
