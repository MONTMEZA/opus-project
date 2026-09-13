/**
 * DONNÉES DE DÉMONSTRATION
 * Copie fidèle des données du prototype opus-project.jsx.
 * Elles servent de jeu d'essai quand Supabase n'est pas encore configuré,
 * et de seed pour la base (voir supabase/seed.sql).
 */

export const METIERS = [
  'Maçon', 'Électricien', 'Plombier', 'Charpentier', 'Peintre',
  'Carreleur', 'Couvreur', 'Menuisier', 'Plaquiste', 'Terrassier',
];

export const proProfiles = {
  1: { id: 1, nom: 'Karim Belaïd', entreprise: 'Belaïd Maçonnerie', metier: 'Maçon',
       ville: 'Marseille (13)', verifie: true, exp: 9,
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
       ville: 'Lyon (69)', verifie: true, exp: 6,
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
       ville: 'Toulouse (31)', verifie: false, exp: 4,
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
       ville: 'Marseille (13)', verifie: true, exp: 12,
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
  5: { id: 5, nom: 'Élodie Faure', entreprise: 'Faure Charpente', metier: 'Charpentier',
       ville: 'Aix-en-Provence (13)', verifie: true, exp: 8,
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

export const initialPosts = [
  { id: 1, type: 'post', proId: 1, time: 'Il y a 2 h',
    texte: "Fondations coulées ce matin, dalle prévue vendredi. Chantier villa R+1.",
    media: '#3a3a38,#8a8578', likes: 214, liked: false,
    comments: [{ id: 1, auteur: 'Julie M.', texte: 'Superbe avancée, bravo !' }] },
  { id: 2, type: 'post', proId: 2, time: 'Il y a 4 h',
    texte: "Tableau électrique aux normes NF C 15-100, mise en service demain matin.",
    media: '#1b4b6b,#4d7f9e', likes: 132, liked: false, comments: [] },
  { id: 'ad1', type: 'ad', annonceur: 'BricoPro Matériaux',
    accroche: "-15% sur les sacs de ciment ce mois-ci pour les pros inscrits.",
    cta: "Voir l'offre", media: '#2b2b2b,#555555' },
  { id: 3, type: 'post', proId: 3, time: 'Hier',
    texte: "Pose grand format 120x60 en salle de bain, jointoiement fini cette semaine. Rendu au top.",
    media: '#6b4226,#b98255', likes: 341, liked: false,
    comments: [{ id: 2, auteur: 'Antoine R.', texte: 'Magnifique travail, vous intervenez sur Toulouse centre ?' }] },
  { id: 4, type: 'post', proId: 4, time: 'Hier',
    texte: "Remplacement chaudière + purge complète du circuit. Client satisfait, garantie 2 ans.",
    media: '#1b4b6b,#2f4b3a', likes: 87, liked: false, comments: [] },
  { id: 'ad2', type: 'ad', annonceur: 'AssurBTP',
    accroche: "Assurance décennale dès 39€/mois pour les artisans du bâtiment.",
    cta: 'En savoir plus', media: '#111111,#3a3a38' },
  { id: 5, type: 'post', proId: 5, time: 'Il y a 2 j',
    texte: "Charpente traditionnelle posée en 3 jours, ossature chêne massif.",
    media: '#4b4b2f,#9a9a5a', likes: 176, liked: false, comments: [] },
];

export const initialConversations = [
  { id: 1, proId: 4, messages: [{ from: 'pro', texte: 'Je passe lundi matin pour le devis.', heure: '09:12' }] },
  { id: 2, proId: 2, messages: [{ from: 'pro', texte: 'Photos du tableau envoyées ✅', heure: 'hier' }] },
];

export const initialNotifications = [
  { id: 1, texte: 'Sophie Renaud a aimé votre publication', lue: false },
  { id: 2, texte: 'Nouveau commentaire de Julie M.', lue: false },
  { id: 3, texte: 'Marc Dubreuil vous suit désormais', lue: true },
  { id: 4, texte: 'Votre publication a été enregistrée par 3 personnes', lue: true },
];

/** Dégradés utilisés pour illustrer une nouvelle publication. */
export const POST_GRADIENTS = [
  '#3a3a38,#8a8578', '#1b4b6b,#4d7f9e', '#6b4226,#b98255', '#4b4b2f,#9a9a5a',
];
