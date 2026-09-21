/**
 * DONNÉES DE DÉMONSTRATION
 * Copie fidèle des données du prototype opus-project.jsx.
 * Elles servent de jeu d'essai quand Supabase n'est pas encore configuré,
 * et de seed pour la base (voir supabase/seed.sql).
 */

export const METIERS = [
  'Maçon', 'Électricien', 'Plombier', 'Charpentier', 'Peintre',
  'Carreleur', 'Couvreur', 'Menuisier', 'Plaquiste', 'Terrassier',
  'Serrurier', 'Chauffagiste',
];

export const proProfiles = {
  1: { id: 1, nom: 'Karim Belaïd', entreprise: 'Belaïd Maçonnerie', metier: 'Maçon',
       metiers: ['Maçon', 'Carreleur'],
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 9,
       siret: '812 345 678 00019', followers: 1240,
       bio: "Entreprise familiale spécialisée dans la maçonnerie générale et la rénovation depuis 2015.",
       partners: [2, 4],
       assurance: { valide: true, expire: '12/2026' },
       kbis: { valide: true, maj: '03/2026' },
       rge: true,
       portfolio: ['#3a3a38,#8a8578', '#6b4226,#b98255', '#1b4b6b,#4d7f9e', '#4b4b2f,#9a9a5a', '#5a3a3a,#a87a7a', '#2f4b3a,#6a9a7a'],
       reviews: [
         { id: 1, auteur: 'Julie M.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 4, commentaire: "Chantier livré dans les temps, très bon relationnel, travail soigné." },
         { id: 2, auteur: 'Thomas B.', verifie: true, date: 'Août 2026', delais: 4, qualite: 5, tarif: 4, commentaire: "Fondations nickel, un léger retard sur la fin mais bien communiqué." },
         { id: 3, auteur: 'Nadia K.', verifie: true, date: 'Juil. 2026', delais: 5, qualite: 4, tarif: 3, commentaire: "Bon travail dans l'ensemble, tarif un peu élevé par rapport au devis initial." },
       ] },
  2: { id: 2, nom: 'Sophie Renaud', entreprise: 'Renaud Élec', metier: 'Électricien',
       ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357, verifie: true, exp: 6,
       siret: '798 221 044 00027', followers: 860,
       bio: "Installations électriques neuves et rénovation, mise aux normes NF C 15-100.",
       partners: [1],
       assurance: { valide: true, expire: '09/2027' },
       kbis: { valide: true, maj: '01/2026' },
       rge: true,
       portfolio: ['#1b4b6b,#4d7f9e', '#3a3a38,#8a8578', '#4b4b2f,#9a9a5a'],
       reviews: [
         { id: 1, auteur: 'Marc L.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 5, commentaire: "Impeccable du devis à la mise en service, je recommande." },
       ] },
  3: { id: 3, nom: 'Yanis Cortez', entreprise: 'YC Carrelage', metier: 'Carreleur',
       ville: 'Toulouse (31)', latitude: 43.6045, longitude: 1.4442, verifie: false, exp: 4,
       siret: '889 112 004 00013', followers: 410,
       bio: "Pose de carrelage grand format, faïence, douches à l'italienne.",
       partners: [],
       assurance: { valide: false, expire: null },
       kbis: { valide: true, maj: '11/2025' },
       rge: false,
       portfolio: ['#6b4226,#b98255', '#5a3a3a,#a87a7a'],
       reviews: [
         { id: 1, auteur: 'Antoine R.', verifie: true, date: 'Août 2026', delais: 3, qualite: 4, tarif: 5, commentaire: "Très bon rapport qualité-prix, quelques jours de retard sur le planning." },
       ] },
  4: { id: 4, nom: 'Marc Dubreuil', entreprise: 'Dubreuil Plomberie', metier: 'Plombier',
       metiers: ['Plombier', 'Chauffagiste'],
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 12,
       siret: '701 998 332 00041', followers: 990,
       bio: "Plomberie générale, chauffage, dépannage rapide sur Marseille et alentours.",
       partners: [1],
       assurance: { valide: true, expire: '06/2027' },
       kbis: { valide: true, maj: '02/2026' },
       rge: false,
       portfolio: ['#1b4b6b,#4d7f9e', '#2f4b3a,#6a9a7a', '#3a3a38,#8a8578'],
       reviews: [
         { id: 1, auteur: 'Claire D.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 4, tarif: 4, commentaire: "Intervention rapide pour une urgence, très professionnel." },
         { id: 2, auteur: 'Hugo P.', verifie: true, date: 'Juin 2026', delais: 4, qualite: 5, tarif: 3, commentaire: "Excellent travail sur le remplacement de chaudière, prix un peu haut." },
       ] },
  8: { id: 8, nom: 'Léa Sanchez', entreprise: 'Sanchez Plomberie', metier: 'Plombier',
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 5,
       siret: '901 447 226 00014', followers: 380,
       bio: "Dépannage, sanitaire et rénovation de salle de bain. Devis gratuit sous 24 h.",
       partners: [],
       assurance: { valide: true, expire: '03/2027' },
       kbis: { valide: true, maj: '06/2026' },
       rge: false,
       portfolio: ['#1b4b6b,#4d7f9e', '#6b4226,#b98255'],
       reviews: [
         { id: 1, auteur: 'Samir T.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 4, tarif: 5, commentaire: "Fuite réparée en une heure, tarif annoncé respecté." },
       ] },
  6: { id: 6, nom: 'Driss Amrani', entreprise: 'Amrani Serrurerie', metier: 'Serrurier',
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 7,
       siret: '823 554 119 00022', followers: 540,
       bio: "Ouverture de porte, changement de serrure, blindage. Interventions d'urgence 7j/7.",
       partners: [],
       assurance: { valide: true, expire: '08/2027' },
       kbis: { valide: true, maj: '04/2026' },
       rge: false,
       portfolio: ['#3a3a38,#8a8578', '#5a3a3a,#a87a7a'],
       reviews: [
         { id: 1, auteur: 'Léa V.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 4, commentaire: "Porte claquée un dimanche soir, arrivé en 25 minutes, aucune dégradation." },
       ] },
  7: { id: 7, nom: 'Pierre Nogaret', entreprise: 'Nogaret Chauffage', metier: 'Chauffagiste',
       ville: 'Aix-en-Provence (13)', latitude: 43.5297, longitude: 5.4474, verifie: true, exp: 15,
       siret: '654 220 887 00031', followers: 720,
       bio: "Chaudières gaz et fioul, pompes à chaleur, dépannage et entretien annuel.",
       partners: [4],
       assurance: { valide: true, expire: '11/2026' },
       kbis: { valide: true, maj: '05/2026' },
       rge: true,
       portfolio: ['#1b4b6b,#4d7f9e', '#2f4b3a,#6a9a7a'],
       reviews: [
         { id: 1, auteur: 'Farid B.', verifie: true, date: 'Août 2026', delais: 4, qualite: 5, tarif: 4, commentaire: "Chaudière relancée le jour même, explications claires sur l'entretien." },
       ] },
  5: { id: 5, nom: 'Élodie Faure', entreprise: 'Faure Charpente', metier: 'Charpentier',
       ville: 'Aix-en-Provence (13)', latitude: 43.5297, longitude: 5.4474, verifie: true, exp: 8,
       siret: '845 667 210 00018', followers: 320,
       bio: "Charpente traditionnelle et ossature bois, du neuf à la rénovation.",
       partners: [1],
       assurance: { valide: true, expire: '04/2027' },
       kbis: { valide: false, maj: null },
       rge: true,
       portfolio: ['#4b4b2f,#9a9a5a', '#6b4226,#b98255'],
       reviews: [] },
};

/**
 * Moyenne des avis sur 3 critères :
 * respect des délais, qualité du travail, rapport qualité-prix.
 */
export function avgReviews(pro) {
  const rs = (pro && pro.reviews) || [];
  if (rs.length === 0) return { delais: 0, qualite: 0, tarif: 0, global: 0, count: 0 };
  const sum = (k) => rs.reduce((a, r) => a + r[k], 0) / rs.length;
  const delais = sum('delais'), qualite = sum('qualite'), tarif = sum('tarif');
  return { delais, qualite, tarif, global: (delais + qualite + tarif) / 3, count: rs.length };
}

// « format » dit ce qu'on regarde (photo, vidéo…) ; « type » dit s'il s'agit
// d'une publication ou d'une publicité. Le fil des vidéos ne retient que les
// publications dont le format est 'video'.
export const initialPosts = [
  { id: 1, type: 'post', format: 'photo', proId: 1, time: 'Il y a 2 h',
    texte: "Fondations coulées ce matin, dalle prévue vendredi. Chantier villa R+1.",
    media: '#3a3a38,#8a8578', likes: 214, liked: false,
    comments: [
      { id: 1, auteurId: 'demo-julie', auteur: 'Julie M.', auteurType: 'particulier',
        texte: 'Superbe avancée, bravo !', time: 'Il y a 1 h',
        reponses: [
          { id: 11, auteurId: 1, auteur: 'Belaïd Maçonnerie', auteurType: 'pro',
            texte: 'Merci Julie ! La dalle est prévue vendredi.', time: 'Il y a 45 min',
            reponses: [] },
          { id: 12, auteurId: 'demo-julie', auteur: 'Julie M.', auteurType: 'particulier',
            texte: '@Belaïd Maçonnerie hâte de voir le résultat.', time: 'Il y a 30 min',
            reponses: [] },
        ] },
    ] },
  { id: 2, type: 'post', format: 'video', proId: 2, time: 'Il y a 4 h',
    texte: "Tableau électrique aux normes NF C 15-100, mise en service demain matin.",
    media: '#1b4b6b,#4d7f9e', likes: 132, liked: false, comments: [] },
  { id: 'ad1', type: 'ad', annonceur: 'BricoPro Matériaux',
    accroche: "-15% sur les sacs de ciment ce mois-ci pour les pros inscrits.",
    cta: "Voir l'offre", media: '#2b2b2b,#555555' },
  { id: 3, type: 'post', format: 'video', proId: 3, time: 'Hier',
    texte: "Pose grand format 120x60 en salle de bain, jointoiement fini cette semaine. Rendu au top.",
    media: '#6b4226,#b98255', likes: 341, liked: false,
    comments: [
      { id: 2, auteurId: 'demo-antoine', auteur: 'Antoine R.', auteurType: 'particulier',
        texte: 'Magnifique travail, vous intervenez sur Toulouse centre ?',
        time: 'Il y a 3 h', reponses: [] },
    ] },
  /* Plusieurs photos : c'est CE post qui montre le carrousel en mode démo.
     Un chantier ne se raconte pas en une image — ici la chaudière posée, le
     circuit purgé, le raccordement, le tableau de commande. */
  { id: 4, type: 'post', format: 'photo', proId: 4, time: 'Hier',
    texte: "Remplacement chaudière + purge complète du circuit. Client satisfait, garantie 2 ans.",
    media: '#1b4b6b,#2f4b3a',
    medias: ['#1b4b6b,#2f4b3a', '#3a3a38,#8a8578', '#6b4226,#b98255', '#2f4b3a,#6a9a7a'],
    likes: 87, liked: false, comments: [] },
  { id: 'ad2', type: 'ad', annonceur: 'AssurBTP',
    accroche: "Assurance décennale dès 39€/mois pour les artisans du bâtiment.",
    cta: 'En savoir plus', media: '#111111,#3a3a38' },
  { id: 6, type: 'post', format: 'montage', proId: 2, time: 'Il y a 1 j',
    texte: "Chantier en trois temps : saignées, passage des gaines, tableau fini.",
    media: '#2f4b3a,#6a9a7a',
    medias: ['#2f4b3a,#6a9a7a', '#1b4b6b,#4d7f9e', '#4b4b2f,#9a9a5a'],
    musique: null, likes: 96, liked: false, comments: [] },
  { id: 5, type: 'post', format: 'avantapres', proId: 5, time: 'Il y a 2 j',
    texte: "Charpente traditionnelle posée en 3 jours, ossature chêne massif.",
    media: '#4b4b2f,#9a9a5a', likes: 176, liked: false, comments: [] },
];

export const initialConversations = [
  { id: 1, proId: 4, messages: [{ from: 'pro', texte: 'Je passe lundi matin pour le devis.', heure: '09:12' }] },
  { id: 2, proId: 2, messages: [{ from: 'pro', texte: 'Photos du tableau envoyées ✅', heure: 'hier' }] },
];

export const initialNotifications = [
  { id: 1, type: 'commentaire', texte: 'Julie M. a commenté votre publication',
    acteurId: 'demo-julie', postId: 1, lue: false, time: 'Il y a 1 h' },
  { id: 2, type: 'reponse', texte: 'Julie M. a répondu à votre commentaire',
    acteurId: 'demo-julie', postId: 1, lue: false, time: 'Il y a 30 min' },
  { id: 3, type: 'info', texte: 'Marc Dubreuil vous suit désormais', lue: true, time: 'Hier' },
  { id: 4, type: 'info', texte: 'Votre publication a été enregistrée par 3 personnes',
    lue: true, time: 'Il y a 2 j' },
];

/**
 * Demandes de travaux publiées par des particuliers.
 * Volontairement SÉPARÉES du fil d'actualité : le fil reste une vitrine
 * professionnelle, les demandes vivent dans leur propre espace.
 */
export const initialDemandes = [
  { id: 1, auteurId: 'p-camille', auteur: 'Camille R.', metier: 'Carreleur', ville: 'Toulouse (31)',
    texte: "Salle de bain de 6 m² à carreler entièrement, murs et sol. Faïence déjà achetée.",
    media: '#6b4226,#b98255', time: 'Il y a 3 h', reponses: 2,
    budget: '2000_5000', urgence: 'ce_mois', latitude: 43.6045, longitude: 1.4442 },
  { id: 2, auteurId: 'p-hugo', auteur: 'Hugo P.', metier: 'Peintre', ville: 'Marseille (13)',
    texte: "Deux chambres à repeindre, environ 30 m² au total. Murs en bon état.",
    media: null, time: 'Hier', reponses: 5,
    budget: '500_2000', urgence: 'quand_possible', latitude: 43.2965, longitude: 5.3698 },
  { id: 3, auteurId: 'p-nadia', auteur: 'Nadia K.', metier: 'Maçon', ville: 'Aix-en-Provence (13)',
    texte: "Mur de clôture de 12 m à monter en parpaing, avec un portail à sceller.",
    media: '#3a3a38,#8a8578', time: 'Il y a 2 j', reponses: 1,
    budget: 'a_chiffrer', urgence: 'urgent', latitude: 43.5297, longitude: 5.4474 },
];

/**
 * Quelques annonces entre professionnels, pour que la Place des pros ne soit
 * pas vide au premier lancement. Les identifiants d'auteur renvoient aux
 * profils de démonstration ci-dessus.
 */
export const initialAnnonces = [
  { id: 'a1', type: 'sous_traitance_cherche', auteurId: 2,
    titre: 'Plaquiste recherché — chantier de 180 m²',
    texte: "Cloisons et faux plafonds sur un plateau de bureaux. Matériel fourni, accès facile, parking sur place.",
    metier: 'Plaquiste', ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357,
    dateDebut: '2026-10-12', dateFin: '2026-10-20', time: 'Il y a 4 h', reponses: 3 },
  { id: 'a2', type: 'sous_traitance_offre', auteurId: 4,
    titre: 'Équipe de deux disponible fin octobre',
    texte: "Plomberie et chauffage, rénovation comme neuf. Nous intervenons sur tout le département.",
    metier: 'Plombier', ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698,
    dateDebut: '2026-10-23', dateFin: '2026-10-31', time: 'Hier', reponses: 1 },
  { id: 'a3', type: 'materiel_vente', auteurId: 1,
    titre: '40 m² de tuiles canal, jamais posées',
    texte: "Surplus d'un chantier annulé. Palettes complètes, stockées à l'abri. À prendre sur place.",
    ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698,
    prix: 180, unite: 'total', media: '#6b4226,#b98255', time: 'Il y a 2 j', reponses: 0 },
  { id: 'a4', type: 'materiel_location', auteurId: 1,
    titre: 'Nacelle 12 m — disponible en semaine',
    texte: "Nacelle articulée, contrôle technique à jour. Livraison possible dans un rayon de 30 km.",
    ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698,
    prix: 95, unite: 'jour', time: 'Il y a 3 j', reponses: 2 },
  /* --- Les fournisseurs ---
     Ces annonces existent surtout pour que la recherche par mots-clés ait de
     quoi trouver dès le premier lancement : tapez « placo », « BA13 » ou
     « nacelle » dans la Place des pros.

     ATTENTION, limite assumée de cette première version : il n'existe pas
     encore de TYPE DE COMPTE « fournisseur ». Ces annonces sont donc portées
     par des comptes professionnels ordinaires, et l'encart d'auteur affiche
     un métier d'artisan. C'est le prochain vrai chantier de cette page —
     voir docs/A-FAIRE.md. */
  { id: 'a6', type: 'fournisseur', auteurId: 2,
    titre: 'Placo BA13 hydrofuge — palette complète',
    texte: "Nouvelle gamme hydrofuge pour pièces humides. 60 plaques par palette, livraison sous 48 h sur Lyon et sa couronne.",
    ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357,
    prix: 380, unite: 'total', time: 'Il y a 1 j', reponses: 2 },
  { id: 'a7', type: 'fournisseur', auteurId: 5,
    titre: 'Déstockage laine de roche — fin de série',
    texte: "Isolation semi-rigide 100 mm, lot de fin de série. Quantités limitées, retrait à l'entrepôt.",
    ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357,
    prix: 12, unite: 'total', time: 'Il y a 2 j', reponses: 0 },

  /* Volontairement posée par un artisan NON vérifié (YC Carrelage) : c'est
     ce qui permet de voir le filtre « vérifiés uniquement » faire son
     travail dès le premier lancement. */
  { id: 'a5', type: 'entraide', auteurId: 3,
    titre: 'Coup de main lundi matin',
    texte: "Monter une poutre IPN de 5 m au premier étage. Une heure à deux, je rends la pareille.",
    ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357,
    dateDebut: '2026-10-06', time: 'Il y a 5 h', reponses: 4 },
];

/** Dégradés utilisés pour illustrer une nouvelle publication. */
export const POST_GRADIENTS = [
  '#3a3a38,#8a8578', '#1b4b6b,#4d7f9e', '#6b4226,#b98255', '#4b4b2f,#9a9a5a',
];
