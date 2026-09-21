# Ce qu'il reste à faire avant qu'Opus-Project puisse être publié

Établi le 21/09/2026, après un audit complet de l'application.
Ce fichier est la mémoire du projet entre deux sessions : **à relire et à
tenir à jour**, pas à laisser vieillir dans un coin.

L'ordre compte. Les trois premiers points ne sont pas des améliorations :
ce sont des conditions pour ouvrir l'application à de vrais utilisateurs.

---

## 1. Bloquant — sans ça, on ne publie pas

### 1.1 Signalement et blocage

**Absent aujourd'hui.** Aucun moyen de signaler une publication, un
commentaire, un message ou un profil. Aucun moyen de bloquer quelqu'un.

C'est le manque le plus sérieux. Une plateforme ouverte au public sans
modération reçoit, tôt ou tard, du contenu qu'il faut pouvoir retirer — et
Apple comme Google refusent les applications à contenu utilisateur qui n'ont
ni signalement ni blocage.

Ce que ça demande :
- table `signalements` (qui, quoi, motif, statut) avec RLS ;
- table `blocages` (qui bloque qui), et le filtrage qui va avec dans le fil,
  les commentaires et les messages ;
- un bouton de signalement sur chaque contenu ;
- un délai d'examen annoncé, et tenu.

### 1.2 Suppression de compte

**Absente aujourd'hui.** Obligation RGPD, et exigence des deux magasins
d'applications.

Attention au détail qui coince : supprimer le compte ne doit pas faire
disparaître les avis laissés CHEZ D'AUTRES artisans, sinon on efface
l'historique de quelqu'un qui n'a rien demandé. Il faut anonymiser, pas
supprimer, ce qui concerne des tiers.

### 1.3 Mentions légales, CGU, politique de confidentialité

**Absentes aujourd'hui.** Obligatoires en France pour une plateforme de mise
en relation, et demandées à la soumission sur les stores.

À couvrir en particulier : le statut d'hébergeur, le traitement des données
personnelles (documents Kbis et assurance compris), et le fait que l'IA
intervient dans la rédaction des textes.

---

## 2. Important — la plateforme ne tient pas à l'échelle sans ça

### 2.1 Un back-office, même minimal

Aujourd'hui, valider un Kbis ou trancher une demande de changement de métier
se fait **à la main, dans le tableau de bord Supabase**. Ça va pour dix
artisans. Pas pour cent.

Le minimum : une liste des vérifications en attente, une liste des demandes
de métiers, une liste des signalements — et trois boutons.

### 2.2 Notifications push

La base les enregistre déjà (table `notifications`, alimentée par des
triggers), mais rien n'arrive sur l'écran verrouillé.

**Demande un development build** : les notifications push ne fonctionnent pas
dans Expo Go. C'est donc aussi le moment de quitter Expo Go, ce qui change la
façon de tester.

### 2.3 Rejouer `schema.sql` ne doit plus être manuel

C'est ce qui a cassé l'application le 21/09 : six commits d'avance de
l'application sur la base. Voir la règle dans `CLAUDE.md`.

Piste : des migrations numérotées plutôt qu'un fichier unique à rejouer, ou
au minimum un script qui compare `information_schema` à ce que le code attend.

---

## 3. Confort et croissance

- **Éditeur de montage** — découpe, transitions, texte. Pistes étudiées :
  Shotstack Studio (gratuit, JavaScript navigateur) et Banuba / IMG.LY (sur
  devis, development build obligatoire).
- **Publicités** — la base sait les stocker (`posts.is_ad`), les cartes
  existent dans le fil, mais rien ne les alimente.
- **Recherche par carte** — les coordonnées GPS sont déjà là, elles ne
  servent qu'au tri par distance.
- **Côté particulier** — reste plus pauvre que le côté pro.

---

## 4. Réglages à faire dans les tableaux de bord

| Où | Quoi | État |
| --- | --- | --- |
| Supabase → Authentication → Policies | Activer la protection contre les mots de passe compromis | ⏳ à faire |
| Anthropic → Settings → Limits | Poser un plafond de dépense | ⏳ conseillé |
| Cloudinary | Plan gratuit : 25 crédits/mois, à surveiller | ⏳ à surveiller |

---

## 5. Points de vigilance

- **Un profil incomplet en base** (`d23e1784-…`) : un compte porte un nom mais
  pas d'entreprise, sans doute une inscription interrompue. À nettoyer, et à
  empêcher : la fiche professionnelle devrait être créée en même temps que le
  compte, ou pas du tout.
- **Aucun test automatique d'interface.** Sept scripts de vérification
  (`npm run verifier-*`) couvrent le SQL, les listes et les formats, mais
  aucun ne rejoue les écrans. Les tests Playwright sont écrits à la main à
  chaque fois.
