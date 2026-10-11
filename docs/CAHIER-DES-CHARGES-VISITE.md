# Cahier des charges — Visite intelligente & préparation assistée des devis

**CE DOCUMENT EST LE TEXTE DU PROPRIÉTAIRE, ET IL FAIT FOI.** Remis le
11/10/2026, en Word. L'original est à côté
(`CDC_Opus_Visite_Intelligente_Preparation_Devis_v1.docx`) : en cas de
doute, c'est lui qu'il faut ouvrir. Ce fichier n'en est que la conversion
en Markdown, pour qu'il soit lisible et cherchable dans le dépôt.

> **IL NE SE CONSTRUIT PAS ENCORE.** Sa section 22 est formelle :
> « NE COMMENCE PAS PAR CODER. Lire ce cahier des charges en entier.
> Auditer l'architecture Opus actuelle. […] ATTENDRE VALIDATION DU PLAN
> avant toute modification importante. » Le propriétaire l'a confirmé en
> le remettant : « garde-le en mémoire pour quand tu en auras besoin ».
>
> Ce qu'il change DÈS MAINTENANT, et qui est écrit en section 19 : le
> module **Devis** (module 2 de `docs/A-FAIRE.md`) doit être construit de
> façon à accepter **une source manuelle OU une visite validée**, sans
> jamais rendre la visite obligatoire. C'est une contrainte de conception
> à tenir le jour où les devis seront posés, pas un travail en plus
> aujourd'hui.

---
OPUS-PROJECT
CAHIER DES CHARGES
Visite intelligente & préparation assistée des devis
Spécification fonctionnelle et architecturale destinée à Claude Code

> **RÈGLE ABSOLUE : cette évolution doit compléter Opus sans casser, remplacer ou dégrader les fonctionnalités, données, design et parcours déjà existants. Claude Code doit auditer l'existant avant toute modification et présenter un plan d'intégration AVANT de coder.**

Version 1.0 — Octobre 2026

## 1. Mission de la fonctionnalité
Créer dans Opus un parcours professionnel permettant à un artisan ou une entreprise de préparer un devis dès la visite chez le client. Opus doit centraliser les informations observées et échangées pendant le rendez-vous, les transformer en un dossier de visite structuré, faire confirmer les informations par le professionnel, puis réutiliser uniquement les éléments validés pour accélérer la création du devis.

> **La valeur du système dépend directement de sa fiabilité. Une transcription approximative, des éléments oubliés ou une IA qui transforme une hypothèse en fait certain rendraient la fonctionnalité inutilisable. La conception doit donc privilégier exactitude, traçabilité, confirmation et abstention en cas de doute.**


## 2. Périmètre et séparation des modules

| Module | Rôle | Dépendance obligatoire ? |
|---|---|---|
| Client / CRM Opus | Fiche client, coordonnées autorisées, historique et relation avec le professionnel. | Oui pour rattacher une visite, mais le client peut être créé manuellement. |
| QR Opus | Facilite l'identification/mise en relation entre comptes et la création d'une fiche client. | NON. Un devis et une visite doivent fonctionner sans QR. |
| Visite intelligente | Capture notes, photos, mesures, documents, voix et éventuellement conversation complète. | NON pour créer un devis classique. C'est une source enrichie pour le devis. |
| Devis | Document commercial créé et validé par le professionnel. | Peut être créé manuellement ou à partir d'une visite. |
| IA Opus | Transcription, extraction, synthèse, détection d'incertitudes et propositions. | Assistance uniquement ; ne valide jamais le devis à la place du professionnel. |


> **IMPORTANT : ne jamais concevoir le QR comme une condition d'accès au devis. Ne jamais stocker la visite comme un simple champ du devis. Client, visite et devis sont des objets distincts reliables entre eux.**


## 3. Parcours utilisateur cible
- Le professionnel sélectionne un client existant, crée un client manuellement ou l'identifie via QR Opus.
- Il choisit « Nouvelle visite / Préparer un devis ».
- Opus crée immédiatement un dossier de visite indépendant avec date, professionnel, client, adresse de chantier et statut.
- Pendant la visite, le professionnel choisit librement ses modes de saisie : texte, dictée, photos commentées, mesures, documents ou enregistrement complet autorisé.
- Les données sont sauvegardées progressivement pour éviter toute perte.
- À la fin, l'IA traite les contenus et construit un compte rendu structuré.
- Un moteur de contrôle compare le compte rendu aux sources de la visite et signale oublis, contradictions et ambiguïtés.
- Le professionnel voit une synthèse courte : éléments confirmés, éléments proposés par l'IA, éléments à confirmer et éléments non compris.
- Le professionnel corrige, complète et valide le dossier de visite.
- Une fois validé, Opus peut proposer de créer un devis à partir des éléments confirmés.
- Le professionnel reste libre de modifier les prestations, quantités, prix, TVA, remises, options et conditions avant envoi.
- Le devis final n'est jamais envoyé automatiquement par l'IA.

## 4. Création et structure d'un dossier de visite
Une visite doit exister indépendamment du devis et pouvoir être rattachée à un client, un prospect, un chantier futur ou plusieurs devis.
- Identifiant unique de visite.
- Professionnel / entreprise et utilisateur ayant réalisé la visite.
- Client ou prospect associé.
- Adresse du chantier distincte de l'adresse personnelle si nécessaire.
- Date/heure de début et fin.
- Objet de la visite.
- Métiers/lot(s) concernés.
- Statut : brouillon, en cours, analyse IA, à vérifier, validée, archivée.
- Notes écrites.
- Notes vocales/dictées.
- Photos et commentaires associés.
- Mesures et unités.
- Documents importés.
- Audio complet facultatif + statut de consentement.
- Transcription et segments horodatés.
- Éléments structurés détectés.
- Questions à confirmer.
- Compte rendu final validé.
- Liens vers devis créés depuis cette visite.
- Historique des modifications et validations.

## 5. Modes de saisie pendant la visite

### 5.1 Notes écrites
Toujours disponibles. L'artisan doit pouvoir prendre des notes discrètement sans parler devant le client. Autosave obligatoire.

### 5.2 Dictée / note vocale courte
Bouton micro permettant de dicter une note. Opus transcrit, conserve le texte et peut conserver l'audio selon la politique de conservation. Le professionnel peut corriger la transcription.

### 5.3 Photos commentées
- Prise de photo directement depuis la visite ou ajout depuis la galerie.
- Commentaire texte ou vocal attaché à la photo.
- Association facultative à une pièce, zone, ouvrage ou futur poste de travaux.
- Possibilité de marquer une photo comme importante.
- Conserver l'ordre temporel et le contexte de capture.

### 5.4 Mesures
Saisie simple et rapide : longueur, largeur, hauteur, surface, volume, quantité et unité. Prévoir plusieurs mesures par zone et un commentaire.

### 5.5 Documents
Ajout de plans, diagnostics, ancien devis, référence produit, photo de document ou autre pièce utile. Le document reste rattaché à la visite/client.

### 5.6 Enregistrement complet du rendez-vous
Option facultative, jamais activée par défaut. Avant démarrage, l'interface doit informer clairement le professionnel qu'il doit obtenir l'accord du client. L'état du consentement doit être enregistré. Prévoir arrêt/reprise et indicateur d'enregistrement visible.

> **Ne pas implémenter un enregistrement clandestin ou automatique. Les règles juridiques exactes de consentement, conservation et suppression devront être validées avant mise en production.**


## 6. Pipeline IA obligatoire
L'analyse ne doit PAS être un unique prompt « résume cette conversation ». Prévoir un pipeline contrôlable et testable.

| Étape | Fonction | Sortie attendue |
|---|---|---|
| 1. Ingestion | Collecter texte, audio, photos, mesures et documents. | Sources de visite identifiées et horodatées. |
| 2. Transcription | Transcrire l'audio avec ponctuation et timestamps. | Transcription consultable/corrigeable. |
| 3. Diarisation | Distinguer les interlocuteurs lorsque techniquement fiable. | Segments Artisan / Client / Inconnu avec confiance. |
| 4. Extraction | Identifier demandes, ouvrages, pièces, matériaux, quantités, contraintes, décisions, options. | Objets structurés + liens vers preuves. |
| 5. Classification | Séparer demandé / proposé / accepté / refusé / option / à confirmer / hors périmètre. | Statut par élément. |
| 6. Détection d'ambiguïtés | Repérer les formulations incertaines ou contradictoires. | Questions courtes à poser au pro. |
| 7. Contrôle | Comparer l'extraction aux sources originales et rechercher les omissions. | Liste d'éléments potentiellement oubliés/contradictoires. |
| 8. Synthèse | Créer un compte rendu de visite lisible. | Résumé structuré. |
| 9. Validation humaine | Le professionnel corrige et confirme. | Dossier validé. |
| 10. Préparation devis | Transformer uniquement les éléments admissibles/confirmés en propositions de postes. | Brouillon de prestations, jamais devis envoyé. |


## 7. Statuts de confiance des informations

| Statut | Sens | Peut alimenter automatiquement une proposition de devis ? |
|---|---|---|
| CONFIRMÉ | Saisi/confirmé explicitement par le professionnel ou validé lors de la revue. | Oui. |
| DÉTECTÉ PAR IA | L'IA pense avoir identifié l'information mais elle n'a pas encore été confirmée. | Non, tant que non validé. |
| À CONFIRMER | Information plausible mais ambiguë/incomplète/contradictoire. | Non. |
| NON COMPRIS | Le système ne peut pas interpréter de manière fiable. | Non. |
| REFUSÉ / HORS PÉRIMÈTRE | Évoqué mais explicitement exclu, abandonné ou non retenu. | Non et ne doit pas réapparaître comme prestation. |


> **RÈGLE PRODUIT : l'IA Opus ne doit jamais transformer une information incertaine en information certaine. En cas de doute, elle demande confirmation ou s'abstient.**


## 8. Compréhension des décisions pendant une conversation
Le système doit comprendre que la conversation évolue. La dernière décision explicite peut annuler une idée précédente.

| Conversation | Comportement attendu |
|---|---|
| « On change les fenêtres... finalement non, on les garde. » | Fenêtres = REFUSÉ / HORS PÉRIMÈTRE, pas « remplacement fenêtres ». |
| « Peut-être refaire la terrasse plus tard. » | Option / projet futur, pas prestation confirmée. |
| « Quatre prises ici et deux dans la chambre. » | 6 prises, localisées si le contexte permet de le déterminer. |
| « Les spots, on les garde. » | Conservation des spots ; ne pas proposer remplacement. |
| « Faites le tour de la fenêtre comme on a dit. » | Si le contenu de « comme on a dit » n'est pas résolu avec certitude : À CONFIRMER. |


## 9. Écran de fin de visite / revue obligatoire
La revue doit être rapide, mobile-first et exploitable en moins de quelques minutes.
Exemple d'organisation :
✓ Travaux confirmés
◐ Éléments détectés par l'IA
⚠ Informations à confirmer
? Éléments non compris
⊘ Éléments exclus / non retenus

Chaque carte doit permettre : confirmer, modifier, supprimer/exclure, rattacher à une pièce/zone, ajouter une quantité, ajouter un commentaire et ouvrir la preuve/source.
- Afficher le nombre de photos, notes, mesures et documents capturés.
- Afficher les questions restantes avant validation.
- Permettre de revenir à un segment de transcription ou à une photo justifiant un élément.
- Ne jamais masquer silencieusement un élément détecté mais non compris.
- Bouton final « Valider le compte rendu de visite ».

## 10. Compte rendu de visite
Après validation, Opus génère un rapport structuré modifiable comprenant au minimum :
- Objet et contexte de la visite.
- Demande principale du client.
- Travaux retenus par pièce/zone/lot.
- Éléments existants à conserver.
- Déposes/remplacements envisagés.
- Mesures et quantités relevées.
- Matériaux/produits évoqués.
- Contraintes d'accès, état existant et points de vigilance.
- Options éventuelles.
- Éléments explicitement exclus.
- Informations restant à confirmer.
- Photos/documents associés.
- Notes internes du professionnel non destinées au client, séparées des informations partageables.

## 11. Passage de la visite vers le devis
Depuis une visite validée, le professionnel peut cliquer « Préparer un devis ». Opus propose alors des postes de prestations à partir des informations confirmées. La proposition doit rester un brouillon éditable.
- Créer des groupes de postes par lot, pièce ou phase lorsque pertinent.
- Proposer descriptions et quantités lorsque les données sont suffisantes.
- Signaler clairement les quantités calculées/estimées par l'IA.
- Ne jamais inventer un prix, taux de TVA, marge ou référence produit si aucune règle/source configurée ne permet de le faire.
- Permettre au professionnel d'ajouter, fusionner, supprimer et réordonner les postes.
- Conserver le lien entre un poste proposé et les éléments de visite qui l'ont généré.
- Le professionnel valide le devis complet avant tout envoi au client.

## 12. QR Opus — intégration prévue mais module indépendant
Le QR fait partie de l'écosystème Opus mais ne doit pas être développé comme une sous-fonction du devis. L'architecture du client/CRM doit simplement permettre qu'une relation créée via QR soit immédiatement utilisable par le module visite.

| QR | Comportement cible |
|---|---|
| QR professionnel | Le particulier ouvre le profil professionnel Opus et peut initier une mise en relation/demande. |
| QR particulier | Le professionnel scanne ; le particulier autorise le partage des informations nécessaires ; Opus crée/reconnaît la fiche client et la relation. |
| Sécurité | Le QR ne contient pas les coordonnées personnelles en clair. Utiliser identifiant/token sécurisé, expiration/rotation si nécessaire et autorisations serveur. |
| Sans QR | Création manuelle d'un client/prospect toujours possible. |


## 13. Architecture de données recommandée
Claude doit adapter les noms au schéma Opus existant après audit. Ne pas créer de doublons si des entités équivalentes existent déjà.

| Entité logique | Responsabilité |
|---|---|
| Client / Customer | Profil CRM du client côté professionnel ; peut être relié à un compte particulier Opus. |
| ClientLink / Relationship | Relation explicite entre professionnel et particulier, origine manuelle/QR/demande. |
| SiteVisit | Dossier de visite. |
| VisitNote | Note texte ou note transcrite. |
| VisitMedia | Photo/audio/fichier avec type, ordre, métadonnées et lien storage. |
| VisitMeasurement | Mesure structurée + unité + zone. |
| VisitTranscript | Transcription versionnée, segments, speakers, timestamps. |
| VisitFinding | Élément détecté : travaux, décision, contrainte, matériau, quantité, exclusion, etc. |
| FindingEvidence | Lien entre un finding et ses preuves : transcript segment, photo, note, mesure, document. |
| VisitQuestion | Question/ambiguïté à confirmer. |
| VisitConsent | Consentements liés à l'enregistrement et traitements associés. |
| VisitReport | Compte rendu versionné et état de validation. |
| Quote / Estimate | Devis existant ou futur du module devis. |
| QuoteSourceLink | Lien entre ligne de devis et finding(s) de visite. |


## 14. UX mobile et résilience terrain
- Concevoir d'abord pour smartphone : gros boutons, peu de saisie, accès rapide caméra/micro.
- Autosave fréquent et indicateur de sauvegarde.
- Prévoir réseau faible/intermittent : file d'upload et reprise automatique lorsque possible.
- Ne pas perdre une visite si l'app est fermée ou si un upload échoue.
- Compresser intelligemment les médias sans détruire la qualité nécessaire.
- Afficher clairement quand une transcription/analyse est encore en cours.
- Le professionnel doit pouvoir continuer à utiliser le dossier pendant le traitement IA.

## 15. Confidentialité, sécurité et conformité
- Contrôle d'accès strict : une entreprise ne voit que ses clients/visites autorisés.
- Storage privé avec URLs temporaires/signées selon architecture existante.
- Chiffrement en transit et protections offertes par l'infrastructure pour les données au repos.
- Aucune clé fournisseur IA secrète dans le frontend.
- Limiter les données envoyées au modèle au strict nécessaire.
- Journaliser les traitements sensibles sans enregistrer inutilement le contenu privé dans les logs.
- Prévoir suppression/archivage des audios selon politique de conservation.
- Prévoir suppression/export des données selon les obligations applicables.
- Séparer notes internes professionnelles et informations destinées au client.
- Faire valider juridiquement le parcours d'enregistrement de conversation avant production.

## 16. Fiabilité IA — critères indispensables
La fonctionnalité ne doit pas être déclarée prête parce qu'une démo fonctionne. Elle doit passer une batterie de tests représentatifs.
- Accent régional, bruit de chantier, interruptions et chevauchement de voix.
- Conversation longue avec changements d'avis.
- Nombres, dimensions, unités, quantités et références produits.
- Plusieurs pièces et plusieurs métiers dans une même visite.
- Éléments évoqués puis explicitement annulés.
- Options et demandes futures à ne pas intégrer au devis principal.
- Informations contradictoires entre voix, note et photo.
- Termes métier et vocabulaire BTP.
- Audio incomplet ou de mauvaise qualité.
- Photos sans contexte.
- Absence de données : l'IA doit s'abstenir plutôt qu'inventer.

> **Avant production, définir des seuils de qualité mesurables avec un jeu d'évaluation versionné. Une erreur critique est notamment : ajouter une prestation explicitement refusée, perdre une prestation confirmée importante, modifier une quantité claire, ou présenter comme certaine une information ambiguë.**


## 17. Jeu de tests métier à construire
Créer des scénarios de visites simulées et, plus tard, des tests réels autorisés. Chaque scénario possède une « vérité attendue ».

| Catégorie | Exemple de vérité attendue |
|---|---|
| Annulation | Une prestation évoquée puis annulée doit être exclue. |
| Option | Une option doit rester optionnelle et ne pas être intégrée au total principal sans choix du pro. |
| Quantité | « 4 ici + 2 chambre » doit produire 6 avec contexte correct. |
| Conservation | Un équipement à conserver ne doit pas être proposé au remplacement. |
| Ambiguïté | Une demande floue doit générer une question, pas une invention. |
| Omission | Le contrôleur doit signaler un élément clair présent dans la transcription mais absent de l'extraction. |
| Contradiction | Le système doit signaler deux dimensions incompatibles plutôt que choisir arbitrairement. |
| Bruit / mauvaise transcription | Confiance faible + confirmation demandée. |


## 18. Stratégie modèles IA
- Ne pas coupler le module devis directement à un modèle unique.
- Créer une couche de service IA interne à Opus avec interfaces stables.
- Pouvoir utiliser un modèle pour transcription et un autre pour extraction/contrôle.
- Conserver modèle/version/prompt/version de schéma utilisés pour une analyse afin de pouvoir auditer les résultats.
- Utiliser des sorties structurées validées par schéma lorsque possible.
- Prévoir retries contrôlés, timeouts, gestion des erreurs et fallback.
- Ne jamais masquer une panne IA en générant silencieusement des données fictives.
- Prévoir coût/token/durée par analyse pour piloter l'économie de la fonction.

> **ÉVOLUTIVITÉ FUTURE : une infrastructure IA/BTP externe pourra un jour être connectée par API. Elle n'est PAS à construire dans cette tâche. Ne pas développer ni supposer BTP Intelligence ou une autre application future.**


## 19. Ce qui doit être construit maintenant vs préparé

| Priorité | À faire |
|---|---|
| MAINTENANT — architecture | Audit Opus, modèle Client↔Visite↔Devis, stockage média, notes, mesures, findings, statuts de confiance, liens sources, services IA modulaires, permissions, feature flags. |
| MAINTENANT — module devis | Construire le devis de façon à accepter une source manuelle ou une visite validée sans rendre la visite obligatoire. |
| MAINTENANT si compatible planning | Création de visite, notes texte, photos, mesures, compte rendu manuel/assisté minimal. |
| PHASE SUIVANTE | Dictée avancée, enregistrement complet, diarisation, pipeline multi-étapes, contrôle IA, questions automatiques. |
| PLUS TARD | Analyse vision poussée, intégration moteur BTP externe, apprentissage métier avancé, automatisations supplémentaires. |


## 20. Règles anti-régression Opus
- Audit en lecture seule avant modification.
- Inventorier les tables, services, composants et flux devis/client déjà existants.
- Réutiliser l'existant lorsqu'il est sain ; ne pas recréer un deuxième CRM ou un deuxième module devis.
- Toute migration DB doit être additive par défaut.
- Sauvegarde et plan de rollback avant migration sensible.
- Feature flag pour activer/désactiver la visite intelligente.
- Si l'IA tombe, le devis manuel et le CRM continuent de fonctionner.
- Ne pas changer le design global d'Opus sans demande explicite.
- Préserver compatibilité desktop/mobile existante.
- Tests de non-régression avant fusion en production.

## 21. Critères d'acceptation fonctionnels

| Test | Résultat attendu |
|---|---|
| Devis sans visite | Un pro peut créer et envoyer un devis sans QR ni visite. |
| Visite sans devis | Une visite peut être enregistrée et archivée sans créer de devis. |
| Client manuel | Un client peut être créé sans compte Opus et sans QR. |
| Sources multiples | Une visite accepte texte, photo, mesure, document et voix selon capacités activées. |
| Traçabilité | Un élément IA peut indiquer d'où il provient. |
| Incertitude | Un élément ambigu n'est pas converti automatiquement en prestation confirmée. |
| Validation | Le pro peut corriger chaque élément avant génération du brouillon de devis. |
| Exclusion | Un élément refusé ne réapparaît pas dans le devis. |
| Résilience | Une panne IA n'empêche pas la création manuelle d'un devis. |
| Sécurité | Aucun média client n'est public par défaut. |


## 22. Instructions de démarrage à Claude Code

> **CLAUDE CODE : NE COMMENCE PAS PAR CODER.**

- Lire ce cahier des charges en entier.
- Auditer l'architecture Opus actuelle : stack, base, auth, CRM/client, devis, storage, IA existante, composants UI et conventions.
- Identifier ce qui existe déjà et ce qui manque. Ne pas supposer les noms de tables proposés ici.
- Vérifier qu'aucune proposition ne contredit le cahier des charges Opus déjà implémenté.
- Présenter un schéma de flux Client → Visite → Findings/Validation → Devis.
- Présenter les changements de données nécessaires, en privilégiant des migrations additives.
- Présenter la stratégie de stockage média et sécurité.
- Présenter la couche de service IA et les frontières entre transcription, extraction, contrôle et devis.
- Présenter ce qui sera développé maintenant et ce qui restera préparé pour une phase suivante.
- Lister les risques de régression et la stratégie de tests/rollback.
- ATTENDRE VALIDATION DU PLAN avant toute modification importante.
- Après validation, implémenter par petites étapes testables et commiter/loguer clairement les changements.

## 23. Résultat final attendu
À terme, un professionnel doit pouvoir entrer chez un client avec Opus, créer/retrouver sa fiche, documenter la visite de la manière qui lui convient, laisser Opus transformer ces informations en compte rendu fiable, vérifier rapidement ce qui a été compris, puis préparer un devis beaucoup plus vite sans perdre le contrôle.

> **EXPÉRIENCE CIBLE : « Je fais ma visite normalement. Je prends quelques photos, j'écris ou je parle seulement si je veux. Opus organise ce que j'ai relevé, me montre ce qu'il a compris et ce qu'il n'a pas compris. Je valide. Quand je prépare mon devis, le travail de mémoire et de retranscription est déjà fait. »**

