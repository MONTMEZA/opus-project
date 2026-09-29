# Ce qu'il faut tester, un point à la fois

Tout ce qui a été construit depuis le début de cette série de séances est
ici, dans l'ordre où je te conseille de l'essayer. **Un point, une réponse.**
Si un point ne va pas, arrête-toi là et dis-le-moi : c'est plus rapide que de
tout essayer puis de chercher lequel a cassé.

Chaque point est écrit pareil :

- **Tu fais** — les gestes, dans l'ordre.
- **Tu dois voir** — ce qui prouve que ça marche.
- **Si ça ne va pas** — ce que je dois savoir pour corriger.

---

## Avant de commencer

Dans **PowerShell**, dans le dossier du projet :

```powershell
git pull
npm install
npm start -- --clear
```

- `git pull` récupère le code ; `npm install` télécharge les bibliothèques
  dont la liste a changé. Les deux, toujours.
- `-- --clear` vide la mémoire d'Expo. À faire cette fois-ci : beaucoup de
  fichiers ont bougé.
- Un QR code s'affiche : **Expo Go** sur le téléphone, même Wi-Fi que
  l'ordinateur. Si le Wi-Fi refuse, `npx expo start --tunnel`.

> **Tu n'as rien à faire dans Supabase.** Les deux migrations de cette séance
> (le profil pro, et la fermeture des colonnes sensibles) ont été appliquées
> à la vraie base depuis ici, et relues après coup. `supabase/schema.sql` est
> à jour et rejouable, mais tu n'as pas à le recoller.

### Deux modes, et il faut les distinguer

| | sans fichier `.env` | avec `.env` |
|---|---|---|
| Données | les 5 artisans de démonstration, en mémoire | la vraie base Supabase |
| Écriture | **rien n'est enregistré** | tout est enregistré |

Le mode démonstration est pratique pour regarder les écrans. Mais **il ne
prouve rien sur la base** : un écran peut y paraître parfait pendant que la
base refuserait l'enregistrement. Les points marqués 🔵 se testent en mode
démonstration ; les points marqués 🟠 **exigent le `.env`**, sinon ils ne
testent rien.

⚠️ **Un point important depuis cette séance** : l'application lit maintenant
sa propre fiche autrement (voir le point 12). Si tu ouvres une **ancienne**
version dans Expo Go — un lien gardé dans l'historique, par exemple — la
connexion échouera. Repars toujours du QR code que `npm start` vient
d'afficher.

---

## 1. 🔵 Le carrousel de photos

**Tu fais** — Ouvre le fil. Trouve une publication qui porte **plusieurs**
photos. Glisse le doigt de droite à gauche **sur la photo**.

**Tu dois voir** — Les photos défilent une par une, en s'arrêtant nettes sur
chacune. En haut à droite, un compteur `2/4`. En bas, des points ; celui de
la photo affichée est orange.

**Si ça ne va pas** — Dis-moi si c'est le glissement qui ne prend pas, ou la
photo qui s'arrête entre deux.

> Ce qui ne se teste que là : sur ordinateur, une zone qui défile répond à la
> molette, pas au doigt. L'arbitrage entre « je fais défiler le fil
> verticalement » et « je fais défiler les photos horizontalement » ne peut
> **pas** être vérifié ailleurs que sur le téléphone. C'est le point le plus
> important de cette liste.

---

## 2. 🔵 La barre du bas, et les bords

**Tu fais** — Regarde la barre du bas. Puis promène-toi : fil, Découvrir,
Messages, Profil.

**Tu dois voir** —
- À la place de l'icône « Profil », **ta photo de profil** dans une petite
  pastille ronde, entourée d'orange quand tu es sur cet onglet.
- Les **boutons** et les **puces de filtre** sont arrondis ; les **cartes**,
  les **champs de saisie** et les **bandeaux** gardent des angles vifs.

**Si ça ne va pas** — Une carte arrondie ou un bouton carré : dis-moi lequel,
et sur quel écran.

> La règle : *angle vif = ce qui PORTE l'information ; arrondi = ce qui
> FLOTTE au-dessus et sur quoi on appuie.* Les avatars restent ronds.

---

## 3. 🔵 La Place des pros : chercher par mot-clé

**Tu fais** — Côté professionnel, ouvre la **Place des pros**. Dans la barre
de recherche, tape `placo`. Puis efface, et tape `BA13`. Puis `plaque de
plâtre`. Puis `nacelle`, et `PEMP`.

**Tu dois voir** — Les **mêmes** annonces pour `placo`, `BA13` et `plaque de
plâtre` : ce sont trois noms de la même chose, et la recherche le sait. Pareil
pour `nacelle` et `PEMP`.

**Tu fais encore** — Tape `maçon` **sans** la cédille : `macon`.

**Tu dois voir** — Les mêmes résultats. Les accents sont ignorés des deux
côtés.

**Si ça ne va pas** — Donne-moi le mot tapé et ce qui sort (ou ne sort pas).

---

## 4. 🟠 Le fil par pages de vingt

**Tu fais** — Ouvre le fil. Descends jusqu'en bas, plusieurs fois.

**Tu dois voir** — Le fil se prolonge tout seul quand tu approches de la fin.
Pas de saut, pas de publication en double, pas de publication sautée.

**Tu fais encore** — Tire l'écran **vers le bas** depuis le haut du fil.

**Tu dois voir** — Un rond qui tourne, puis le fil revient au début, à jour.

**Si ça ne va pas** — Dis-moi surtout si tu vois **deux fois la même
publication**, ou si le fil s'arrête alors qu'il devrait continuer.

> Avant, l'application téléchargeait **toute** la base à l'ouverture. Sur un
> téléphone en 4G, c'était la principale raison de l'attente au démarrage.

---

## 5. 🔵 Les commentaires ne se chargent qu'à l'ouverture

**Tu fais** — Sur une publication, appuie sur l'icône des commentaires.

**Tu dois voir** — Brièvement « Chargement des commentaires… », puis les
commentaires. Le **nombre** affiché à côté de l'icône, lui, était déjà juste
avant l'ouverture.

**Si ça ne va pas** — Dis-moi si le nombre affiché et le nombre de
commentaires réellement affichés diffèrent.

---

## 6. 🟠 Un commentaire ne se supprime que par son auteur

**Tu fais** — Avec ton compte, écris un commentaire sous n'importe quelle
publication. Regarde la ligne sous ton commentaire.

**Tu dois voir** — Un petit lien « **Supprimer** » sous **ton** commentaire,
et sous aucun autre. Il demande confirmation avant d'effacer — et prévient
que les réponses partiront aussi, s'il y en a. Y compris sous **ta propre
publication** : l'auteur de la publication ne peut pas effacer le commentaire
de quelqu'un d'autre.

**Si ça ne va pas** — Dis-moi qui pouvait supprimer quoi.

> C'était ta demande, et c'est la base qui la tient : même une application
> modifiée se ferait refuser.

---

## 7. 🟠 Les photos réduites avant l'envoi

**Tu fais** — Publie quelque chose avec **une photo prise à l'instant** avec
l'appareil photo du téléphone (pas une capture d'écran : elles sont déjà
légères). Attends la fin de l'envoi, puis ouvre la publication.

**Tu dois voir** — L'envoi nettement plus rapide qu'avant, et la photo
**nette** à l'écran.

**Si ça ne va pas** — Si la photo paraît floue ou pixelisée, dis-le-moi : la
réduction est réglée à 1600 px de large, c'est un réglage.

> Mesuré ici sur une photo de 12 Mpx : **2,65 Mo → 232 Ko**, soit −91,5 %.
> Une publication de six photos : 15,9 Mo → 1,36 Mo. C'est ton forfait, et
> celui de ceux qui te lisent.
>
> ⚠️ **L'appareil photo ne peut pas être testé ici** : il n'y en a pas dans la
> machine où je travaille. Ce point n'a été vérifié que sur des fichiers
> d'image, pas sur le vrai geste « prendre une photo ». C'est celui-là qu'il
> faut essayer.

---

## 8. 🟠 La messagerie : le nom et la photo

**Tu fais** — Connecte-toi sur un compte **particulier**. Écris un message à
un artisan. Reviens à la liste des conversations.

**Tu dois voir** — Le **nom** de l'artisan (ou de son entreprise) et sa
**photo de profil**, pas le mot « Contact ».

**Si ça ne va pas** — C'était le défaut que tu avais signalé ; dis-moi ce qui
s'affiche exactement.

---

## 9. 🟠 La messagerie en temps réel, et les non-lus

Ce point demande **deux appareils** (ou un téléphone et le navigateur de
l'ordinateur avec `npm start` puis touche `w`), et **deux comptes**.

**Tu fais** — Ouvre la liste des conversations sur l'appareil A. Depuis
l'appareil B, envoie un message à A.

**Tu dois voir** — Sur A, **sans rien toucher** : le message arrive, et une
pastille chiffrée apparaît.

**Tu fais encore** — Sur A, ouvre la conversation, puis reviens en arrière.

**Tu dois voir** — La pastille a disparu. Elle ne revient pas si tu quittes et
reviens.

**Si ça ne va pas** — Dis-moi le délai avant l'arrivée du message, et si la
pastille tombe bien.

> Mesuré ici avec un compte jetable : **301 ms** entre l'écriture en base et
> l'arrivée dans le client.

---

## 10. 🟠 Signaler et bloquer

**Tu fais** — Sur le profil d'un artisan, appuie sur « Signaler ou bloquer ce
profil ». Choisis un motif, envoie. Puis, sur le même profil, **bloque-le**.

**Tu dois voir** — Ses publications disparaissent du fil, et tu ne peux plus
lui écrire. Dans « Confidentialité et sécurité », il apparaît dans la liste
des personnes bloquées, et tu peux l'en retirer.

**Si ça ne va pas** — Dis-moi si un contenu de la personne bloquée reste
visible quelque part.

> **Un blocage est symétrique, et il est tenu par la base.** Si A bloque B,
> aucun des deux ne voit plus l'autre. Filtrer côté écran ne protégerait
> personne : une application modifiée verrait tout.

---

## 11. 🟠 Le compte : données, textes légaux, suppression

**Tu fais** — Profil → **Confidentialité et sécurité**. Regarde les quatre
choses : personnes bloquées, signalements déposés, textes légaux
(mentions, CGU, confidentialité), et « Récupérer mes données ».

**Tu dois voir** — Un fichier proposé au téléchargement, qui contient
**quatorze rubriques** : ton compte, ta fiche pro, tes publications, tes
commentaires, tes avis, tes demandes, tes annonces, tes devis, tes rappels,
tes messages, tes abonnements, les personnes bloquées, tes signalements, et
la date de l'export.

**Tu fais ensuite** — Lis les **mentions légales**.

**Tu dois voir** — Qu'elles ne t'inventent **aucune société** : le statut du
projet est « essai », l'application n'est pas ouverte au public, il n'y a donc
rien à publier. C'est volontaire — une mention légale fausse engagerait ta
responsabilité.

**Ne teste la suppression de compte qu'avec un compte jetable**, pas avec le
tien : elle est définitive, c'est le but.

**Si ça ne va pas** — Dis-moi quelle rubrique manque dans l'export.

---

## 12. 🟠 Ton numéro de téléphone n'est plus lisible par tout le monde

C'est la faille trouvée aujourd'hui, et c'est le seul point que tu ne peux pas
« voir » : ce qui a changé, c'est ce qui **n'est plus possible**.

**Tu fais** — Connecte-toi avec un compte **particulier**, va dans « Modifier
mon profil », renseigne ton téléphone, enregistre. Ressors de l'écran, reviens.

**Tu dois voir** — Ton numéro **toujours là**, et pré-rempli quand tu demandes
un devis à un artisan.

**Si ça ne va pas** — Si l'application refuse d'ouvrir la session ou perd ton
numéro, dis-le-moi immédiatement : c'est le seul risque de cette correction.

> Ce qui fuyait : `public.users` est lisible par tout le monde — le fil
> affiche des noms et des photos, c'est normal. Mais une règle de sécurité
> filtre des **lignes**, jamais des **colonnes** : la même autorisation
> laissait lire l'**adresse e-mail**, le **téléphone** et les **coordonnées
> GPS** de chacun, avec la clé qui est dans toutes les applications
> installées, **sans même avoir de compte**. Vérifié sur ta vraie base : onze
> comptes, cinq adresses e-mail, deux numéros. Et l'écran promettait
> l'inverse : « Il ne s'affiche nulle part. »
>
> C'est fermé. Vérifié après coup, depuis un client anonyme : les noms se
> lisent encore, les quatre colonnes sensibles renvoient « permission
> denied ».

---

## 13. 🟠 Le profil pro : téléphone, zone, spécialités

**Tu fais** — Connecte-toi côté **professionnel**, « Modifier mon profil ».
Descends après « Années d'expérience ».

**Tu dois voir** — Trois nouveaux champs :
- **Téléphone**, avec la mention qu'il **s'affiche** sur ta fiche (celui d'un
  artisan est public, c'est le but ; celui d'un particulier ne l'est pas) ;
- **Zone d'intervention (km)**, pour les chantiers ordinaires — à ne pas
  confondre avec le rayon SOS plus bas, qui ne vaut que pour les urgences ;
- **Vos spécialités** : tu tapes un mot, tu appuies sur « Ajouter », il
  devient une pastille bleue avec une croix pour l'enlever.

**Tu fais** — Ajoute `enduit à la chaux`, puis essaie d'ajouter le même une
deuxième fois. Essaie d'en mettre **treize**.

**Tu dois voir** — Le doublon ignoré, et un message au treizième : douze au
maximum. (La base le refuse aussi, indépendamment de l'écran.)

**Tu fais** — Enregistre, puis va voir **ta propre fiche**.

**Tu dois voir** — Un bloc « **Contact et déplacement** » : ton téléphone en
orange, « se déplace jusqu'à N km », et tes spécialités en pastilles. Si tu
n'as rien rempli, une invitation à le faire.

**Tu fais enfin** — Depuis un compte **particulier**, ouvre la fiche de cet
artisan et appuie sur le **numéro de téléphone**.

**Tu dois voir** — Le composeur du téléphone s'ouvrir avec le numéro.

**Si ça ne va pas** — ⚠️ **Ce dernier geste n'a pas pu être vérifié ici** : il
n'y a pas de téléphone dans la machine où je travaille. C'est le point de
cette liste dont je suis le moins sûr.

---

## 14. 🔵 La recherche trouve un artisan par sa spécialité

**Tu fais** — Côté particulier, onglet **Découvrir**. Tape `enduit chaux`.

**Tu dois voir** — Le maçon (Belaïd Maçonnerie en mode démonstration), et
**pas** le carreleur. Puis tape `douche italienne` : le carreleur, et pas le
maçon.

**Si ça ne va pas** — Donne-moi le mot tapé et ce qui sort.

> C'est tout l'intérêt des spécialités : personne ne cherche « Maçon », on
> cherche « mur en pierre ». `metiers` est une liste fermée de douze entrées,
> les spécialités sont du texte libre — et la recherche les lit maintenant
> avec le même moteur que la Place des pros (accents, synonymes de chantier).

---

## 15. 🔵 La certification RGE

**Tu fais** — Ouvre la fiche d'un artisan, bloc « Informations vérifiées ».

**Tu dois voir** — Trois lignes, et la troisième est « Certification RGE » :
- **vert** « Certifié · exp. 09/2027 » quand tu l'as contrôlée depuis
  Supabase ;
- **bleu** « Déclarée · en cours de vérification » quand l'artisan l'a dite
  sans qu'elle ait été regardée ;
- **gris** « Non communiquée » quand il n'en a pas.

**Tu dois surtout voir** — que le gris est bien **gris**, et non rouge, alors
que l'assurance manquante, elle, est rouge. Un carreleur n'a aucune raison
d'être RGE : il ne doit pas en paraître moins sérieux.

**Tu fais** — Côté professionnel, « Modifier mon profil » → « Documents
justificatifs » → active **Certification RGE**.

**Tu dois voir** — Un numéro de qualification, une date de validité, et le
choix d'une attestation. Envoie : la fiche repasse en « en attente ».

**Tu dois voir aussi** — Que le label **ne s'allume pas** pour autant. C'est
toi qui le bascules depuis Supabase, comme pour le Kbis.

---

## 16. 🟠 La note d'un artisan est la même partout

**Tu fais** — Repère la note d'un artisan dans une **liste** (Découvrir, Place
des pros), puis ouvre **sa fiche**.

**Tu dois voir** — Le **même** chiffre aux deux endroits.

**Si ça ne va pas** — Donne-moi les deux chiffres et le nom de l'artisan.

> Deux sources : dans les listes, la note vient d'un calcul tenu par la base ;
> sur la fiche, les avis sont chargés et la moyenne est recalculée. Elles
> doivent coïncider. Un piège traité au passage : PostgreSQL renvoie ces
> nombres sous forme de **chaînes**, et `'4.50' + '4.00'` donne « 4.504.00 »
> en JavaScript, pas 8,5.

---

## Ce que je n'ai PAS pu vérifier, et qu'il faut donc regarder

Je le redis à part, parce que c'est ce qui compte le plus :

1. **L'appareil photo** — il n'y en a pas ici. Le choix d'une photo, sa
   réduction et son envoi n'ont été vérifiés que sur des fichiers.
2. **La lecture d'une vraie vidéo** — le navigateur de test est une version
   allégée, sans les codecs propriétaires : `video/mp4` ne s'y lit pas du
   tout. Je peux vérifier qu'un lecteur est monté et quelle source il porte,
   pas qu'une vidéo est fluide.
3. **L'arbitrage glissement horizontal / défilement vertical** — sur
   ordinateur, une zone défilante répond à la molette, pas au doigt. Point 1
   de cette liste.
4. **L'appel depuis une fiche** (`tel:`) — pas de téléphone ici. Point 13.
5. **Les notifications poussées** — elles ne sont pas encore branchées.

---

## Les deux gestes qui n'appartiennent qu'à toi

Ni moi ni personne d'autre ne peut les faire à ta place.

1. **Activer la protection contre les mots de passe compromis** :
   Supabase → Authentication → Policies. C'est la seule alerte de sécurité
   qui reste sur ton projet. Elle compare le mot de passe choisi à la liste
   publique des fuites connues.
2. **Remplir `src/data/legal.js` le jour où tu ouvres au public.** Le champ
   `STATUT` y vaut `'essai'`. Le jour où tu passes en `micro` ou `societe`,
   `npm run verifier-legal` refusera de passer tant que le SIRET et l'adresse
   ne seront pas là. À lancer **avant toute mise en ligne**.
