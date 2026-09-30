# Ce qu'il faut tester, un point à la fois

Tout ce qui a été construit depuis le début de cette série de séances est
ici, dans l'ordre où je te conseille de l'essayer. **Un point, une réponse.**
Si un point ne va pas, arrête-toi là et dis-le-moi : c'est plus rapide que de
tout essayer puis de chercher lequel a cassé.

---

## ✅ Résultat des essais du 29/09/2026 — tout passe

Les seize points ont été essayés sur iPhone, avec la vraie base. Quatre
défauts sont sortis, tous corrigés et vérifiés :

| Ce qui a été vu | Ce que c'était vraiment |
|---|---|
| « Le clic marche mais plus rien ne défile », quelques secondes au démarrage | Dix éléments montés d'un coup, dont dix lecteurs vidéo qui se téléchargeaient ensemble |
| « On ne peut pas écrire » dans l'assistant IA | 219 ms par lettre : chaque touche re-rendait toute l'application |
| Les propositions de l'IA restaient après avoir vidé le champ, et se mêlaient aux résultats de la recherche | Rien ne les effaçait, et rien ne disait où s'arrêtait une liste et où commençait l'autre |
| « Enregistrement impossible » sur la photo de profil | Le message ne disait ni l'étape ni la cause — il s'affichait trois secondes avec une **coche verte** |

La photo de profil s'enregistre depuis : relevé sur la base, 83 Ko en JPEG
dans l'espace `avatars`, et la fiche pointe dessus. **Je ne sais pas ce qui
l'a débloquée** — aucune des corrections de la journée ne touchait à
l'envoi. La piste la plus probable est un ancien paquet resté en mémoire
avant le `npm start -- --clear`. Si cela revient, le message rouge nommera
désormais l'étape exacte.

Ce qui reste à faire est dans `docs/A-FAIRE.md`.

---

## ✅ Essais du 30/09/2026 — rien à signaler

Les points **1 à 25** ont été repassés sur iPhone, avec la vraie base :
tout fonctionne. **Aucun défaut relevé.**

Ce qui avait été ajouté dans la journée et qui est donc confirmé sur le
téléphone :

- le commentaire qui **se ferme dès qu'on y a répondu** (point 18) ;
- les commentaires **sans cadre gris**, avec le filet des réponses
  (point 22) ;
- la **carte de la zone d'intervention** et son curseur (point 23) — y
  compris le chargement des fonds de carte, que je ne pouvais pas juger
  depuis le conteneur ;
- le **référentiel des métiers** et son sélecteur (points 24 et 25) — dont
  le test 5 du §20 de la demande, *fermer l'application et la rouvrir*, qui
  ne pouvait se faire que là. Les 92 métiers, la recherche par spécialité,
  la limite de quatre : tout tient sur le téléphone.

Et la migration des métiers est confirmée côté utilisateur : aucun profil
n'a perdu son métier, et aucune clé technique (`macon`) ne s'affiche à la
place d'un nom.

---

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

## 17. 🔵 Les horaires d'ouverture

**Tu fais** — Ouvre la fiche d'un artisan, bloc « Contact et déplacement ».

**Tu dois voir** — Une ligne « Horaires » avec **une seule phrase** :
« Ouvert · ferme à 18 h », ou « Fermé · rouvre à 14 h », ou « Fermé · ouvre
demain à 8 h ». Verte si c'est ouvert, grise sinon.

**Tu fais** — Appuie sur cette ligne.

**Tu dois voir** — La semaine se déplier, **regroupée** : « Lundi au jeudi »,
« Vendredi », « Samedi », « Dimanche — Fermé ». Pas sept lignes identiques.

**Tu fais** — Côté professionnel, « Modifier mon profil » → « Horaires
d'ouverture » → appuie sur **Semaine type**.

**Tu dois voir** — Les sept jours remplis d'un coup : 8 h-12 h et 14 h-18 h
du lundi au vendredi, samedi matin, dimanche fermé. Il ne te reste qu'à
corriger ce qui diffère.

**Tu fais** — Efface une heure et tape `0730`.

**Tu dois voir** — « 07:30 ». Et si tu tapes seulement `830` puis que tu
touches ailleurs, ça devient « 08:30 ».

> **Le point qui compte** : la coupure de midi. À 12 h 30, la fiche doit dire
> « rouvre à 14 h » — pas « ouvre demain ». Sans ça, on dirait « ouvert de
> 8 h à 18 h » à quelqu'un qui tombera sur un répondeur, ce qui est pire que
> pas d'horaires du tout.

---

## 18. 🟠 Corriger son texte

**Tu fais** — Écris un commentaire, puis regarde la ligne en dessous.

**Tu dois voir** — « Répondre · **Modifier** · Supprimer » — et **Modifier
n'apparaît que sur le tien**.

**Tu fais** — Appuie sur Modifier, change le texte, Enregistrer.

**Tu dois voir** — Le texte corrigé sur place, et la mention
« **· modifié** » à côté de l'heure.

**Tu fais** — Demande à quelqu'un de **répondre** à ce commentaire (ou
réponds-y depuis un autre compte), puis regarde à nouveau ta ligne.

**Tu dois voir** — **Modifier a disparu.** Il reste « Répondre ·
Supprimer ». C'est voulu, depuis le 30/09/2026 : un commentaire auquel on a
répondu ne se récrit plus, sinon la réponse cautionnerait une phrase que son
auteur n'a jamais lue. Et ce n'est pas l'écran qui le tient — la base refuse
l'écriture, même si le bouton revenait.

**Tu dois voir aussi** — Sur la **dernière** réponse d'un fil, Modifier est
toujours là : personne n'a encore écrit après elle.

**Tu fais** — Côté professionnel : Profil → « Mes publications » →
**Modifier** sur une publication.

**Tu dois voir** — Un champ avec le texte actuel, et l'avertissement que les
**photos ne changent pas** : corriger l'image d'une publication que des gens
ont déjà aimée en ferait autre chose.

> Ce que tu ne peux pas voir, et qui est le plus important : un client
> modifié ne peut plus s'écrire « 9 999 j'aime », ni antidater sa
> publication de dix ans pour rester en tête du fil pour toujours. C'était
> possible jusqu'au 30/09/2026.

---

## 19. 🟠 Tout marquer comme lu

**Tu fais** — Appuie sur la cloche, en haut à droite.

**Tu dois voir** — « N non lues » et un bouton « **Tout marquer comme lu** ».

**Tu fais** — Appuie dessus.

**Tu dois voir** — Les points orange disparaître, le bouton s'en aller, et la
**pastille de la cloche** tomber.

---

## 20. 🔵 L'écran de chargement

**Tu fais** — Ferme complètement l'application et rouvre-la.

**Tu dois voir** — Pendant le chargement, la **forme du fil** : des cartes
grises qui battent doucement, avec leurs avatars ronds. Pas un rond qui
tourne au milieu d'un écran vide.

**Si ça ne va pas** — Si tu ne le vois pas, ce n'est pas forcément un défaut :
ça veut dire que le chargement est trop rapide pour qu'on ait le temps. C'est
plutôt bon signe.

---

## 21. 🔵 L'accessibilité — à essayer une fois

**Tu fais** — Réglages de l'iPhone → Accessibilité → VoiceOver → active-le.
Puis ouvre Opus et balaie l'écran vers la droite, élément par élément.

**Tu dois entendre** — Ce que fait chaque bouton, pas ce qu'il montre :
« J'aime cette publication, 214 j'aime », « Masquer cette publication »,
« Accueil, sélectionné ». Plus jamais « bouton » tout court.

**Pour revenir** — Triple-appui sur le bouton latéral, ou redemande à Siri.

> C'est le point que je n'ai **pas** pu vérifier : j'ai relevé ce qui SERAIT
> annoncé (40 éléments sur le fil, aucun sans nom), pas comment ça s'entend.
> Si une étiquette te paraît maladroite à l'oreille, dis-le-moi.

---

## 22. 🔵 Les commentaires, redessinés

**Tu fais** — Ouvre les commentaires d'une publication qui en a plusieurs,
et déplie les réponses.

**Tu dois voir** — **Plus de rectangle gris** autour de chaque commentaire :
le nom en gras, l'heure à côté, le texte juste en dessous, à même le fond.
Et pour les réponses, un **filet vertical fin** à gauche qui dit « ceci
répond à ce qui est au-dessus ».

**Ce qu'il faut regarder** — Le texte est un peu plus gros qu'avant (13 px
au lieu de 12,5) et la largeur utile a gagné une vingtaine de pixels par
niveau, puisque le cadre ne la mange plus. Sur un long commentaire avec
réponses, c'est là que ça se voit.

---

## 23. 🟠 La carte de la zone d'intervention

**Tu fais** — Profil → « Modifier mon profil » → descends jusqu'à **Zone
d'intervention**.

**Tu dois voir** — Une petite carte, ta commune au centre, un cercle orange
autour, et un curseur en dessous. **Fais-le glisser** : le cercle grandit et
rétrécit en direct, et le chiffre à droite suit.

**Tu dois voir aussi** — Que la carte **ne s'agrandit pas**. Elle ne se
pince pas, elle ne se déplace pas, et elle ne descend jamais jusqu'aux noms
de rue. C'est voulu : beaucoup d'artisans déclarent l'adresse de leur
maison, et une carte zoomable la donnerait à tout le monde. Il n'y a pas
d'épingle non plus, juste un point — « c'est par là », pas « il habite
ici ».

**Tu fais** — Enregistre, puis va voir ta fiche comme la voit un client
(côté particulier : Découvrir → un artisan → Profil).

**Tu dois voir** — La même carte, sans curseur, sous la ligne « Se déplace
jusqu'à X km ». Le chiffre reste : il se lit et se compare. La carte, elle,
répond à la seule question qui compte — « est-ce qu'il vient jusque chez
moi ? »

**Si la carte reste grise** — C'est le réseau, pas l'application : les fonds
de carte viennent de la Géoplateforme de l'IGN (données publiques, sans
compte ni clé). Réessaie avec une meilleure connexion. Les images se gardent
ensuite sur le téléphone, donc la deuxième fois est instantanée.

**Si aucune carte n'apparaît dans « Modifier mon profil »** — C'est que ta
ville n'a pas de coordonnées : rouvre le champ **Ville** et choisis-la dans
la liste qui s'ouvre, au lieu de la taper entièrement. C'est la liste qui
donne le point de départ.

---

## 24. 🟠 Le sélecteur de métier — il remplace toutes les grilles

**Tu fais** — Profil → « Modifier mon profil » → **Vos métiers** → bouton
« **+ Ajouter un métier** ».

**Tu dois voir** — Un panneau plein écran avec un champ de recherche en
haut, et **quinze catégories repliées** en dessous (Gros œuvre, Toiture,
Plomberie…), chacune avec son nombre de métiers à droite.

**Tu fais** — Appuie sur une catégorie, par exemple « Bureaux d'études et
ingénierie ».

**Tu dois voir** — Elle se déplie : Ingénieur structure, Ingénieur bâtiment,
Bureau d'études thermique… Le chevron passe au orange.

**Tu fais** — Maintenant tape « **plomb** » dans le champ.

**Tu dois voir** — Les catégories disparaissent, et trois résultats
apparaissent : **Plombier** en premier, puis Bureau d'études fluides et
Diagnostiqueur immobilier (à cause du diagnostic plomb). Sous chaque nom,
ses spécialités en petit — c'est ce qui permet de reconnaître le bon quand
deux se ressemblent.

**Tu fais** — Efface, et tape « **mur de souten** ».

**Tu dois voir** — **Maçon**. Ce n'est pas un métier qu'on a tapé, c'est ce
qu'un maçon fait. C'est le point le plus important du sélecteur : un client
décrit son chantier avec ses mots à lui, pas avec les nôtres.

**Essaie aussi** — « placo » → Plaquiste. « ba13 » → Plaquiste. « parpaing »
→ Maçon. « clim » → Climaticien. « velux » → Couvreur. « archi » → les trois
architectes. « avocat construction » → l'avocat en droit de la construction,
et **pas** celui en droit immobilier.

**Tu fais** — Choisis un métier, puis rouvre le panneau.

**Tu dois voir** — Le métier déjà choisi porte une **coche verte** et n'est
plus sélectionnable. À quatre métiers, le bouton « Ajouter » s'éteint et la
phrase apparaît : « Vous pouvez sélectionner jusqu'à 4 métiers maximum.
Supprimez un métier pour en sélectionner un autre. »

**Ce qui compte et que tu ne verras pas** — Un téléphone modifié qui tente
d'enregistrer cinq métiers, ou de faire passer une spécialité pour un
métier, est refusé **par la base**. Vérifié sur ta vraie base.

---

## 25. 🟠 Les métiers, partout ailleurs

Le même sélecteur remplace les grilles de puces à **six autres endroits**.
Vérifie qu'aucun ne montre une clé technique (`macon`) à la place d'un nom
(« Maçon ») :

- **Découvrir** (côté particulier) → « Filtrer par métier… » ;
- **Place des pros** → le filtre, et « Métier concerné » quand tu publies ;
- **Publier** → « Métier » ;
- **Demandes** → « Métier recherché », et le filtre ;
- **Demander un devis** sur la fiche d'un artisan → « Métier concerné ».

**Dans chacun**, « Tous les métiers » en haut du panneau remet le filtre à
zéro.

**Si tu vois un mot bizarre** comme `peintre-en-batiment` ou `macon` affiché
quelque part : dis-le-moi, c'est un oubli de traduction. J'ai vérifié trois
écrans automatiquement, pas les vingt.

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
5. **VoiceOver** — le relevé dit ce qui serait annoncé, pas comment ça
   s'entend. Point 21.
6. **Les notifications poussées** — elles ne sont pas encore branchées.

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
