# Cahier des charges Opus — document du propriétaire

> **Ce texte n'est pas de moi.** C'est le cahier des charges écrit par le
> propriétaire du projet, remis le 29/09/2026 sous forme de PDF. L'original
> est conservé à côté : `docs/OPUS-cahier-des-charges.pdf`. En cas de doute
> sur une formulation, **c'est le PDF qui fait foi** — cette transcription a
> été extraite automatiquement, et l'extraction a perdu les puces, les
> « œ » et les flèches, que j'ai remis à la main.
>
> Ma lecture de ce document — ce qu'il change pour l'existant, ce qu'il
> contredit, et les questions qu'il laisse ouvertes — est dans
> `docs/LECTURE-CAHIER-DES-CHARGES.md`. **Ne pas confondre les deux.**

---

OPUS — CAHIER DES CHARGES COMPLET
POUR CLAUDE CODE
Version de référence fonctionnelle
Document destiné à guider la conception et le développement de la plateforme Opus. Ce document décrit ce que le
produit doit faire, comment les modules doivent communiquer et quelle philosophie d'utilisation doit être respectée.
Principe fondamental : Opus doit être très complet techniquement, mais extrêmement simple pour l'artisan.
L'artisan ne doit pas avoir à apprendre un logiciel complexe : il peut cliquer, écrire ou parler à son agent IA.

## 1. Vision générale
Opus est une plateforme numérique dédiée au BTP qui réunit réseau professionnel, profil public, acquisition de
clients, gestion d'entreprise, gestion de chantiers, devis, facturation, agenda, recrutement, fournisseurs,
connaissances techniques et intelligence artificielle.
Le cœur du produit est une base de données centrale. Toutes les informations utiles sont reliées entre elles. L'agent
IA personnel de chaque professionnel peut exploiter ces données et effectuer des actions autorisées.
- Un compte professionnel crée automatiquement son propre agent IA.
- L'agent apprend le fonctionnement de l'entreprise à partir des données validées par l'artisan.
- Les données ne doivent pas être dupliquées inutilement entre modules : une information source doit pouvoir
alimenter plusieurs fonctionnalités.
- L'utilisateur garde toujours le contrôle des actions sensibles.
- Voix et texte sont deux interfaces équivalentes ; le mode manuel reste toujours disponible.

## 2. Philosophie UX : la complexité doit être cachée
L'interface doit être compréhensible par un artisan qui n'est pas informaticien. L'application peut être très
sophistiquée en arrière-plan, mais l'utilisateur doit voir peu d'actions principales.
- Accueil simple avec accès à l'Agent, Planning, Devis, Factures, Chantiers, Clients et Dashboard.
- Bouton d'accès permanent à l'Agent Opus.
- Dans chaque module, un accès contextuel à l'Agent.
- L'utilisateur peut parler, écrire ou utiliser les écrans classiques.
- Les suggestions de l'IA ne doivent pas être insistantes.
- Les notifications doivent être classées par importance.
- Les actions irréversibles ou engageantes demandent une validation selon les permissions de l'utilisateur.

## 3. Agent IA personnel de l'artisan
À la création d'un compte professionnel, Opus crée automatiquement un agent associé à ce compte. Il ne s'agit pas
d'un simple chatbot : il constitue la couche d'intelligence permettant de rechercher dans les données, comprendre le
contexte, proposer des actions et exécuter uniquement les actions autorisées.

### 3.1 Interfaces
- Voix : conversation naturelle.
- Texte : conversation naturelle.

- Actions manuelles : formulaires, boutons, calendrier, tableaux.
- Le même agent et la même base de données sont utilisés par les trois modes.

### 3.2 Mémoire métier
- Prestations et spécialités.
- Prix habituels et unités.
- Formulations utilisées par l'artisan.
- Frais fixes et variables.
- Équipe et rôles.
- Horaires et disponibilités.
- Fournisseurs préférés.
- Délais moyens observés.
- Habitudes de travail.
- Historique des chantiers et résultats.

### 3.3 Exemples
- « Fais-moi un devis pour Martin : 35 m² de placo. »
- « Ajoute un rendez-vous jeudi à 14 h pendant une heure. »
- « Décale le rendez-vous Martin à vendredi matin. »
- « Fais-moi la facture du chantier Dupont. »
- « Prépare un post avec les photos du chantier terminé. »
- « Combien m'a coûté le chantier Dupont ? »
- « Quels devis dois-je relancer ? »
- « Quelle est la réglementation applicable à cette question ? »

## 4. Permissions et autonomie
L'agent doit fonctionner avec des niveaux d'autonomie configurables. L'utilisateur peut choisir ce que l'IA peut faire
seule et ce qui nécessite toujours une confirmation.
Action
Préparer
Exécuter sans confirmation
Devis
Oui
Selon réglage
Facture
Oui
Selon réglage
Publication
Oui
Selon réglage
Modification profil
Oui
Selon réglage
Planning
Oui
Selon réglage
Commande / dépense
Oui
Validation obligatoire par défaut
Contrat / engagement important
Oui
Validation obligatoire par défaut
L'IA ne doit jamais harceler l'artisan avec des suggestions répétitives. Les suggestions doivent être utiles, regroupées
et désactivables.

## 5. Base de données centrale

La base de données doit être conçue comme le socle du système. Les modules doivent référencer les mêmes objets
métier plutôt que créer des copies indépendantes.
- Entreprise / compte professionnel.
- Utilisateur / salariés / rôles.
- Agent IA et préférences d'autonomie.
- Clients.
- Contacts.
- Devis.
- Lignes de devis / prestations.
- Factures / paiements / acomptes.
- Chantiers.
- Tâches / étapes / avancement.
- Planning / rendez-vous / indisponibilités.
- Photos / vidéos / documents.
- Fournisseurs.
- Produits et références matériaux.
- Historique des prix.
- Dépenses / justificatifs.
- Publications / médias.
- Avis / réalisations.
- Candidatures / recrutement.
- Connaissances BTP et sources.
- Journal d'activité et historique des actions IA.

## 6. Profil public professionnel
Chaque artisan ou entreprise possède une page publique Opus. L'IA peut l'organiser et la mettre à jour, mais
l'utilisateur décide des informations publiées.
- Logo / photo.
- Présentation.
- Métiers et spécialités.
- Zone d'intervention.
- Expérience.
- Certifications et documents vérifiés.
- Réalisations.
- Avis.
- Disponibilités.
- Recrutement.
- Publications.

- Boutons « Demander un devis », « Contacter » et éventuellement « Prendre rendez-vous ».
- Bouton privé « Mon Dashboard » visible uniquement par le propriétaire / personnes autorisées.
L'IA peut proposer de modifier le profil à partir des nouvelles informations de l'entreprise, sans publication
automatique si l'utilisateur n'a pas accordé cette permission.

## 7. Réseau social BTP
- Fil de contenu BTP.
- Photos et vidéos de chantier.
- Posts courts et formats vidéo.
- Musique, sous-titres et modèles lorsque les droits et intégrations le permettent.
- Publications de fabricants, fournisseurs et acteurs du BTP.
- Publications de recrutement avec badge visible.
- Découverte d'artisans et d'entreprises.
- Réalisations reliées aux chantiers terminés.
- Partage et interactions selon les fonctionnalités retenues.
L'agent peut préparer un post à partir de photos et du contexte du chantier, proposer texte, titre et hashtags, puis
demander validation avant publication selon les réglages.

## 8. Dashboard privé
Le Dashboard est le cockpit de l'entreprise. Il ne doit pas remplacer l'Agent : le Dashboard montre visuellement les
données ; l'Agent permet de les interroger et d'agir dessus.

### 8.1 Accueil
- CA.
- Devis en attente.
- Factures impayées.
- Chantiers actifs.
- Prochains rendez-vous.
- Alertes IA.
- Actions importantes du jour.
- Résumé hebdomadaire.

### 8.2 Graphiques
- CA mensuel / annuel.
- Évolution du CA.
- Nombre de devis.
- Taux de transformation.
- Valeur moyenne des chantiers.
- Nombre de chantiers.
- Marge estimée / réelle selon les données disponibles.

- Factures encaissées.
- Factures en retard.
- Nombre de clients.
Les graphiques sont alimentés automatiquement par la base de données. L'artisan ne doit pas saisir manuellement
les statistiques. L'Agent peut expliquer les variations.

## 9. Devis
- Création manuelle ou par IA.
- Création vocale ou écrite.
- Clients, prestations, quantités, unités, prix, TVA, conditions.
- Utilisation de l'historique des prix et habitudes de l'artisan.
- Modification par conversation.
- Statuts : brouillon, envoyé, accepté, refusé, expiré.
- Validation avant envoi selon permissions.
- Transformation d'un devis accepté en chantier.

## 10. Facturation
- Création depuis un devis ou manuellement.
- Acomptes.
- Paiements.
- Solde.
- Statut payé / en attente / en retard.
- Préparation de relances.
- Historique complet.
- Recherche vocale et textuelle.
- Validation des envois selon permissions.

## 11. Agenda et rendez-vous : logique type Doctolib adaptée au
BTP
Le planning doit être aussi simple qu'un agenda grand public, mais tenir compte des contraintes BTP.
- Rendez-vous clients.
- Visites de chantier.
- Chantiers.
- Durées estimées.
- Déplacements.
- Horaires de travail.
- Congés et indisponibilités.
- Planning des salariés / équipes.

- Créneaux proposés depuis le profil public si l'artisan active la prise de rendez-vous.
- Détection de conflits.
- Proposition automatique de nouveaux créneaux.
- Modification vocale ou écrite.
Exemple : « Martin est décalé à jeudi 14 h. » L'IA vérifie les conflits, modifie le rendez-vous et met à jour les éléments
liés.

## 12. Gestion des chantiers
Un chantier doit devenir un dossier central qui rassemble toutes les informations utiles.
- Client.
- Adresse.
- Devis lié.
- Montant.
- Acompte.
- Dates.
- Avancement.
- Prestations.
- Matériaux.
- Plans.
- Photos / vidéos.
- Temps passé.
- Équipe.
- Sous-traitants.
- Dépenses.
- Factures.
- Documents.
- Marge.
- Historique des décisions.
- Rapport final.
Les photos et commentaires de progression doivent pouvoir être ajoutés rapidement par téléphone, y compris par
voix.

## 13. Documents et comptabilité préparatoire
- Photo d'une facture fournisseur, ticket ou justificatif.
- OCR automatique.
- Extraction fournisseur, date, montant, TVA, catégorie et chantier potentiel.
- Proposition de classement par l'IA.
- Validation humaine lorsque nécessaire.

- Détection de doublons, documents illisibles ou informations manquantes.
- Classement des documents.
- Préparation d'un dossier comptable structuré.
- Conservation de l'original et traçabilité des modifications.
Opus doit être présenté comme un outil d'assistance à la gestion et de préparation comptable, pas comme un
remplacement automatique de l'expert-comptable.

## 14. Base fournisseurs et apprentissage des prix
Les factures fournisseurs peuvent alimenter, après traitement et selon les droits/consentements applicables, une
base de prix utile à l'artisan.
- Fournisseur.
- Référence exacte.
- Produit.
- Catégorie normalisée.
- Unité.
- Conditionnement.
- Quantité.
- Prix HT.
- TVA.
- Date d'achat.
- Localisation / agence lorsque pertinente.
- Conditions particulières si disponibles.
Il faut distinguer « Mes prix réellement payés », « Prix fournisseurs disponibles » et « Prix observés dans mes
documents ». Un ancien prix ne doit jamais être présenté comme un prix actuel sans indication de date.

## 15. Comparateur matériaux
Lorsqu'un artisan prépare un devis, l'Agent peut lire les besoins matériaux et rechercher dans les données
disponibles les options pertinentes.
Exemple : 800 blocs béton, ciment, mortier, etc. L'IA peut proposer les fournisseurs dont les prix récents sont connus
et calculer une estimation de coût. Les prix externes ou anciens doivent être datés et présentés comme à vérifier.

## 16. Connaissances BTP
Créer une base de connaissances BTP versionnée et sourcée.
- Réglementation française.
- Normes et DTU lorsque leur utilisation et leur accès sont légalement/licenciablement disponibles.
- Documentation fabricants.
- Fiches techniques.
- Préconisations de pose.
- Sécurité.

- Actualités professionnelles vérifiées.
- Évolutions réglementaires.
Chaque connaissance doit conserver sa source, sa date, sa version et son niveau de confiance. L'Agent doit citer ou
identifier la source lorsqu'une réponse technique importante en dépend.
Pour les sujets à enjeu structurel, sécurité ou conformité, l'Agent doit distinguer information générale, estimation
indicative et validation professionnelle nécessaire. Il ne doit pas présenter un calcul indicatif comme une étude
technique.

## 17. Recrutement
- Création de posts de recrutement.
- Badge « Recrutement ».
- Offre liée à une entreprise.
- Profils candidats.
- Disponibilité.
- Métier / compétences / zone.
- Recherche et filtrage.
- Correspondance IA entre besoin et profil.
- Résumé des candidatures.
- Validation humaine des décisions importantes.

## 18. Sous-traitance entre professionnels
- Création d'un dossier chantier.
- Photos, plans, description vocale, prestations, prix et délais.
- Recherche de professionnels correspondants.
- Réponse des intéressés.
- Préparation d'un contrat de sous-traitance à partir des informations existantes.
- Signature.
- Suivi des acomptes / paiements.
- Photos d'avancement.
- Commentaires.
- Archivage à la fin du chantier.

## 19. IA de communication et gestion du profil
- Créer une publication.
- Préparer une vidéo courte à partir de contenus disponibles lorsque les outils le permettent.
- Mettre en avant une réalisation.
- Actualiser les spécialités.
- Améliorer la présentation du profil.
- Proposer une publication de recrutement.

- Préparer des réponses aux demandes reçues.
- Le propriétaire conserve la possibilité de valider avant publication ou envoi.

## 20. Intelligence cumulative
L'architecture doit permettre aux données validées de nourrir progressivement les fonctions futures.
Exemple de chaîne : Devis accepté → chantier créé → planning → matériaux → dépenses → heures → facture →
encaissement → marge → photos → réalisation → publication → avis → statistiques.
L'Agent peut ensuite utiliser cet historique pour donner des informations utiles, par exemple comparer temps estimé
et temps réel ou signaler une évolution des coûts. Les analyses doivent rester traçables et basées sur les données
réellement disponibles.

## 21. Architecture technique à respecter
Claude Code doit concevoir l'application avec une architecture modulaire, mais une source de vérité centrale.
- Modèle de données relationnel cohérent avec identifiants stables.
- API/service central permettant aux modules et à l'Agent d'accéder aux mêmes données.
- Journal d'activité et audit des actions de l'IA.
- Système de permissions par utilisateur, entreprise et rôle.
- Historique des modifications importantes.
- Séparation claire entre données privées de l'entreprise et informations publiques.
- Stockage sécurisé des documents et médias.
- Recherche plein texte et recherche sémantique pour l'Agent.
- Base de connaissances séparée des données métier de l'artisan.
- Architecture permettant d'ajouter de nouveaux modules sans réécrire le cœur.

## 22. Contexte de l'Agent
L'Agent doit recevoir uniquement le contexte nécessaire à la demande. Exemple : depuis un chantier, il doit pouvoir
accéder au chantier, au client, au devis lié, au planning et aux documents pertinents.
Le système doit éviter d'envoyer inutilement toute la base de données au modèle. Il faut mettre en place récupération
contextuelle, permissions et journalisation.

## 23. Sécurité et contrôle
- Authentification robuste.
- Gestion des rôles.
- Isolation des données entre entreprises.
- Contrôle d'accès à chaque objet.
- Journal des actions IA.
- Confirmation des actions sensibles.
- Possibilité de consulter l'historique des modifications.
- Protection des données personnelles.

- Consentement lorsque des données sont utilisées à des fins autres que le fonctionnement du compte.
- Séparation claire entre données personnelles, données d'entreprise, données publiques et données agrégées.

## 24. Principes de conception à ne jamais perdre
- SIMPLICITÉ : une fonctionnalité complexe doit être simple à utiliser.
- CONTEXTE : l'Agent doit comprendre où se trouve l'utilisateur et ce qu'il regarde.
- UNIQUE SOURCE DE VÉRITÉ : éviter les doubles saisies.
- CHOIX : voix, texte ou interface manuelle.
- CONTRÔLE : l'artisan décide du niveau d'autonomie de l'IA.
- DISCRÉTION : pas de suggestions incessantes.
- TRANSPARENCE : l'IA indique lorsqu'une information est estimée, ancienne ou incertaine.
- TRAÇABILITÉ : les actions importantes sont enregistrées.
- ÉVOLUTIVITÉ : le système doit pouvoir accueillir de nouveaux modules.
- RÉUTILISATION : une donnée validée doit pouvoir servir plusieurs fonctionnalités.

## 25. Exemple d'expérience complète
Étape 1 : l'artisan reçoit une demande client.
Il écrit : « Nouveau client Martin. Il veut refaire 40 m² de terrasse. Rendez-vous mardi à 10 h. »
Opus crée le client, le rendez-vous et une demande de chantier potentielle.
Étape 2 : après la visite, l'artisan dit : « Prépare le devis : dépose de l'ancienne terrasse, préparation, lambourdes et
lames bois. »
L'Agent utilise les informations du client, les habitudes de prix et les données matériaux disponibles pour préparer le
devis.
Étape 3 : le devis est accepté.
Opus crée le chantier, les tâches, les besoins matériaux et les éléments de planning.
Étape 4 : l'artisan photographie les factures fournisseurs.
L'OCR extrait les informations, propose leur classement et enrichit l'historique des prix après validation.
Étape 5 : le chantier avance.
L'artisan ajoute photos et commentaires. Le temps réel est enregistré.
Étape 6 : fin du chantier.
L'Agent prépare la facture, le dossier final et propose une publication de réalisation.
Étape 7 : Dashboard.
Les données alimentent automatiquement CA, coûts, marge disponible, temps passé et statistiques.
Étape 8 : l'Agent répond.
L'artisan peut demander : « Combien m'a rapporté ce chantier et combien de temps j'ai réellement passé dessus ? »

## 26. Ce que Claude Code doit produire
- Commencer par analyser le projet existant avant de réécrire inutilement les écrans déjà créés.

- Définir le modèle de données central.
- Définir les relations entre les objets.
- Définir les permissions.
- Définir l'architecture de l'Agent.
- Créer une interface Agent globale et contextuelle.
- Créer le Dashboard.
- Créer le profil professionnel public et sa partie privée.
- Créer les modules devis, factures, clients, chantiers, planning et documents.
- Prévoir les points d'intégration pour OCR, recherche documentaire, connaissances BTP, fournisseurs et IA.
- Construire les fonctionnalités progressivement et tester chaque flux de bout en bout.
- Ne pas créer artificiellement des données ou des prix réels.
- Préserver la possibilité de faire manuellement toutes les actions importantes.
- Prévoir une architecture évolutive pour les futures fonctionnalités Opus.

## 27. Priorité de développement
Phase
Objectif
1
Base de données + authentification + entreprises + rôles
2
Profil professionnel + Dashboard de base
3
Agent IA texte + contexte + permissions
4
Clients + devis + factures
5
Planning + rendez-vous
6
Chantiers + documents + photos
7
OCR justificatifs + dépenses
8
Fournisseurs + historique des prix
9
Réseau social + publications + réalisations
10
Recrutement + sous-traitance
11
Base de connaissances BTP + sources
12
Optimisation, automatisations et fonctionnalités avancées

## 28. Règle finale pour le développement
Ne pas chercher à faire un logiciel où l'utilisateur doit comprendre la structure interne. Construire un système
puissant derrière une expérience extrêmement simple.
Le test de chaque fonctionnalité doit être : « Est-ce qu'un artisan peut comprendre ce qu'il doit faire en quelques
secondes ? Peut-il simplement le dire à l'Agent ? Peut-il reprendre la main manuellement ? Les données créées
sont-elles réutilisables ailleurs ? »
Si la réponse est oui, la fonctionnalité respecte la philosophie Opus. Si elle oblige l'artisan à remplir plusieurs écrans
alors qu'Opus possède déjà l'information, l'expérience doit être simplifiée.
Document de cadrage fonctionnel — à utiliser comme référence produit et technique. Les choix techniques précis (stack, base de données,
hébergement, modèles IA, services externes) doivent être décidés après inspection du code existant et des contraintes réelles du projet.
