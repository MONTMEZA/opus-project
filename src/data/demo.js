/**
 * DONNÉES DE DÉMONSTRATION
 * Copie fidèle des données du prototype opus-project.jsx.
 * Elles servent de jeu d'essai quand Supabase n'est pas encore configuré,
 * et de seed pour la base (voir supabase/seed.sql).
 */

/* UNE DATE RELATIVE, ET ELLE EST DÉCLARÉE TOUT EN HAUT.
   Elle vivait au milieu du fichier, juste au-dessus de son premier
   appelant. Le 05/10/2026, en posant les chantiers de démonstration plus
   haut, elle devenait lue AVANT sa déclaration — c'est-à-dire un
   `ReferenceError` au chargement du module, donc un écran blanc. Ce projet
   l'a déjà connu deux fois (`noop`, puis les trois voyants), et les deux
   fois ni le linter ni `expo export` n'avaient rien dit.

   Une fonction utilitaire se déclare en haut : il n'y a alors plus de
   « plus haut » possible. */
const ilYA = (heures) => new Date(Date.now() - heures * 3600e3).toISOString();


export const proProfiles = {
  1: { id: 1, nom: 'Karim Belaïd', entreprise: 'Belaïd Maçonnerie', metier: 'macon',
       metiers: ['macon', 'carreleur'],
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 9,
       siret: '812 345 678 00019', followers: 1240,
       horaires: {
         lun: [['08:00', '12:00'], ['14:00', '18:00']],
         mar: [['08:00', '12:00'], ['14:00', '18:00']],
         mer: [['08:00', '12:00'], ['14:00', '18:00']],
         jeu: [['08:00', '12:00'], ['14:00', '18:00']],
         ven: [['08:00', '12:00'], ['14:00', '17:00']],
         sam: [['09:00', '12:00']],
         dim: [],
       },
       telephone: '04 91 00 12 34', zoneKm: 40,
       specialites: ['Mur en pierre', 'Enduit à la chaux', 'Ouverture de mur porteur', 'Dalle béton'],
       rgeDeclare: true, rgeExpire: '09/2027',
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
  2: { id: 2, nom: 'Sophie Renaud', entreprise: 'Renaud Élec', metier: 'electricien',
       ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357, verifie: true, exp: 6,
       siret: '798 221 044 00027', followers: 860,
       horaires: {
         lun: [['07:30', '17:30']], mar: [['07:30', '17:30']],
         mer: [['07:30', '17:30']], jeu: [['07:30', '17:30']],
         ven: [['07:30', '16:00']], sam: [], dim: [],
       },
       telephone: '04 78 55 09 09', zoneKm: 30,
       specialites: ['Mise aux normes NF C 15-100', 'Borne de recharge', 'Tableau électrique'],
       rgeDeclare: true, rgeExpire: '03/2028',
       bio: "Installations électriques neuves et rénovation, mise aux normes NF C 15-100.",
       partners: [1],
       assurance: { valide: true, expire: '09/2027' },
       kbis: { valide: true, maj: '01/2026' },
       rge: true,
       portfolio: ['#1b4b6b,#4d7f9e', '#3a3a38,#8a8578', '#4b4b2f,#9a9a5a'],
       reviews: [
         { id: 1, auteur: 'Marc L.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 5, commentaire: "Impeccable du devis à la mise en service, je recommande." },
       ] },
  3: { id: 3, nom: 'Yanis Cortez', entreprise: 'YC Carrelage', metier: 'carreleur',
       ville: 'Toulouse (31)', latitude: 43.6045, longitude: 1.4442, verifie: false, exp: 4,
       siret: '889 112 004 00013', followers: 410,
       telephone: '05 61 22 33 44', zoneKm: 25,
       specialites: ["Douche à l'italienne", 'Carrelage grand format', 'Faïence salle de bain'],
       bio: "Pose de carrelage grand format, faïence, douches à l'italienne.",
       partners: [],
       assurance: { valide: false, expire: null },
       kbis: { valide: true, maj: '11/2025' },
       rge: false,
       portfolio: ['#6b4226,#b98255', '#5a3a3a,#a87a7a'],
       reviews: [
         { id: 1, auteur: 'Antoine R.', verifie: true, date: 'Août 2026', delais: 3, qualite: 4, tarif: 5, commentaire: "Très bon rapport qualité-prix, quelques jours de retard sur le planning." },
       ] },
  4: { id: 4, nom: 'Marc Dubreuil', entreprise: 'Dubreuil Plomberie', metier: 'plombier',
       metiers: ['plombier', 'chauffagiste'],
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
  8: { id: 8, nom: 'Léa Sanchez', entreprise: 'Sanchez Plomberie', metier: 'plombier',
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
  6: { id: 6, nom: 'Driss Amrani', entreprise: 'Amrani Serrurerie', metier: 'serrurier',
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
  7: { id: 7, nom: 'Pierre Nogaret', entreprise: 'Nogaret Chauffage', metier: 'chauffagiste',
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
  5: { id: 5, nom: 'Élodie Faure', entreprise: 'Faure Charpente', metier: 'charpentier',
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
/**
 * La note d'un artisan.
 *
 * DEUX SOURCES, ET L'ORDRE COMPTE
 *   - si les AVIS sont chargés, on les calcule. C'est ce qui fait que la
 *     note bouge tout de suite quand on en publie un ;
 *   - sinon, on prend la moyenne tenue par la base (`note_delais`,
 *     `note_qualite`, `note_tarif`, `avis_count`), mise à jour par un
 *     trigger à chaque avis ajouté, modifié ou supprimé.
 *
 * Pourquoi cette seconde source existe : les listes (Découvrir, SOS, le fil)
 * affichent une note pour chaque artisan. Les calculer à partir des avis
 * obligeait à télécharger TOUS les avis de TOUS les artisans à chaque
 * ouverture de l'application — dix mille lignes pour dix étoiles.
 */
export function avgReviews(pro) {
  const rs = (pro && pro.reviews) || [];

  if (rs.length > 0) {
    const sum = (k) => rs.reduce((a, r) => a + r[k], 0) / rs.length;
    const delais = sum('delais'), qualite = sum('qualite'), tarif = sum('tarif');
    return { delais, qualite, tarif, global: (delais + qualite + tarif) / 3, count: rs.length };
  }

  const n = (pro && pro.avisCount) || 0;
  if (n === 0) return { delais: 0, qualite: 0, tarif: 0, global: 0, count: 0 };

  const delais = Number(pro.noteDelais) || 0;
  const qualite = Number(pro.noteQualite) || 0;
  const tarif = Number(pro.noteTarif) || 0;
  return { delais, qualite, tarif, global: (delais + qualite + tarif) / 3, count: n };
}

// « format » dit ce qu'on regarde (photo, vidéo…) ; « type » dit s'il s'agit
// d'une publication ou d'une publicité. Le fil des vidéos ne retient que les
// publications dont le format est 'video'.
/* LES VUES DE DÉMONSTRATION — ajoutées le 05/10/2026 avec la section 35.
   Elles sont une quinzaine de fois plus nombreuses que les j'aime, parce
   que c'est l'ordre de grandeur réel : on regarde beaucoup, on aime peu.
   Des chiffres du même ordre que les j'aime auraient donné une fausse idée
   de ce que le compteur raconte.

   ELLES NE MONTENT PAS EN MODE DÉMONSTRATION, et c'est voulu :
   `api.enregistrerVues` y est un `noop`, puisqu'il n'y a pas de base. Un
   compteur qui grimperait sans que rien ne soit enregistré serait
   exactement le mensonge que la bande noire « MODE DÉMONSTRATION » sert à
   éviter. L'incrément se vérifie sur la vraie base, et nulle part ailleurs. */
export const initialPosts = [
  { id: 1, type: 'post', format: 'photo', proId: 1, time: 'Il y a 2 h',
    chantierId: 'ch-villa', publieLe: ilYA(2),
    texte: "Fondations coulées ce matin, dalle prévue vendredi. Chantier villa R+1.",
    media: '#3a3a38,#8a8578', likes: 214, vues: 3120, liked: false,
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
    media: '#1b4b6b,#4d7f9e', likes: 132, vues: 1870, liked: false, comments: [] },
  { id: 'ad1', type: 'ad', annonceur: 'BricoPro Matériaux',
    accroche: "-15% sur les sacs de ciment ce mois-ci pour les pros inscrits.",
    cta: "Voir l'offre", media: '#2b2b2b,#555555' },
  { id: 3, type: 'post', format: 'video', proId: 3, time: 'Hier',
    texte: "Pose grand format 120x60 en salle de bain, jointoiement fini cette semaine. Rendu au top.",
    media: '#6b4226,#b98255', likes: 341, vues: 5240, liked: false,
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
    likes: 87, vues: 940, liked: false, comments: [] },
  { id: 'ad2', type: 'ad', annonceur: 'AssurBTP',
    accroche: "Assurance décennale dès 39€/mois pour les artisans du bâtiment.",
    cta: 'En savoir plus', media: '#111111,#3a3a38' },
  { id: 6, type: 'post', format: 'montage', proId: 2, time: 'Il y a 1 j',
    texte: "Chantier en trois temps : saignées, passage des gaines, tableau fini.",
    media: '#2f4b3a,#6a9a7a',
    medias: ['#2f4b3a,#6a9a7a', '#1b4b6b,#4d7f9e', '#4b4b2f,#9a9a5a'],
    musique: null, likes: 96, vues: 1310, liked: false, comments: [] },
  { id: 5, type: 'post', format: 'avantapres', proId: 5, time: 'Il y a 2 j',
    chantierId: 'ch-toiture', publieLe: ilYA(2 * 24),
    texte: "Charpente traditionnelle posée en 3 jours, ossature chêne massif.",
    media: '#4b4b2f,#9a9a5a', likes: 176, vues: 2080, liked: false, comments: [] },

  /* LE CHANTIER DU PRO DE DÉMONSTRATION — deux étapes de plus, pour qu'il
     en ait TROIS. En dessous de trois, la place du récit ne s'affiche pas,
     et c'est la seule fiche qu'on puisse ouvrir en tant qu'auteur sans
     fichier `.env` : sans ces deux lignes, ce bloc n'était visible nulle
     part. Les textes sont ceux qu'un MAÇON écrirait, puisque c'est son
     métier — « terrassement », « élévation des murs ». */
  { id: 13, type: 'post', format: 'photo', proId: 1, time: 'Il y a 3 j',
    chantierId: 'ch-villa', publieLe: ilYA(3 * 24),
    texte: "Terrassement terminé. Le sol est bon, pas besoin de reprise en sous-œuvre.",
    media: '#6b4226,#b98255', likes: 63, vues: 940, liked: false, comments: [] },
  { id: 14, type: 'post', format: 'photo', proId: 1, time: 'Il y a 1 j',
    chantierId: 'ch-villa', publieLe: ilYA(24),
    texte: "Semelles filantes ferraillées et coffrées. On coule dès que le contrôle est passé.",
    media: '#3a3a38,#8a8578', likes: 88, vues: 1180, liked: false, comments: [] },

  /* UN CHANTIER RACONTÉ EN QUATRE ÉTAPES — ajouté le 05/10/2026 avec la
     section 36. Sans lui, ni la bande de la fiche, ni la page du chantier,
     ni la ligne sous une publication ne se vérifieraient ici : la vraie
     base n'en contient aucun, et on ne livre pas un écran qu'on n'a
     jamais vu.

     Les textes sont CEUX QU'UN COUVREUR ÉCRIRAIT — « dépose de la
     couverture », « pose des chevrons ». C'est exactement la matière dont
     l'histoire écrite aura besoin plus tard : des étapes nommées, dans
     l'ordre. Un « Ggggggg » ne raconterait rien. */
  { id: 10, type: 'post', format: 'photo', proId: 5, time: 'Il y a 6 j',
    chantierId: 'ch-toiture', publieLe: ilYA(6 * 24),
    texte: "Dépose de l'ancienne couverture. Les tuiles réutilisables sont mises de côté.",
    media: '#6b4226,#b98255', likes: 54, vues: 810, liked: false, comments: [] },
  /* DEUX photos sur une seule étape : sans ça, le carrousel du dossier ne
     se vérifie nulle part — c'est exactement le défaut que le propriétaire
     a trouvé sur son iPhone le 06/10/2026. */
  { id: 11, type: 'post', format: 'photo', proId: 5, time: 'Il y a 5 j',
    chantierId: 'ch-toiture', publieLe: ilYA(5 * 24),
    texte: "Pose des chevrons neufs en douglas. La charpente était saine, on a gardé les pannes.",
    media: '#4b4b2f,#9a9a5a',
    medias: ['#4b4b2f,#9a9a5a', '#6b4226,#b98255'],
    likes: 71, vues: 1040, liked: false, comments: [] },
  { id: 12, type: 'post', format: 'photo', proId: 5, time: 'Il y a 4 j',
    chantierId: 'ch-toiture', publieLe: ilYA(4 * 24),
    texte: "Écran sous-toiture et liteaux. C'est lui qui protège de la condensation.",
    media: '#2f4b3a,#6a9a7a', likes: 48, vues: 760, liked: false, comments: [] },

  /* DEUX CONSEILS, ET LES DEUX CAS QUI COMPTENT — ajoutés le 05/10/2026
     avec l'étiquette (section 34). Sans eux, ni le bandeau du fil, ni le
     bloc « Ses conseils », ni le repère de son ne se vérifieraient ici :
     la vraie base en contient ZÉRO, et on ne livre pas un écran qu'on n'a
     jamais vu.

     Le premier est une VIDÉO : c'est le cas qui porte une voix off, donc
     celui qui doit afficher « Conseil — touchez pour écouter ». Le second
     est un TEXTE sans image — le format que le propriétaire a demandé de
     garder, et dont personne ne s'était jamais servi : c'est lui qui a
     révélé que la carte affichait alors un carré de dégradé vide. */
  { id: 7, type: 'post', format: 'video', proId: 2, time: 'Il y a 3 j',
    conseil: true,
    texte: "Avant de percer un mur, coupez au disjoncteur ET vérifiez au "
      + "détecteur de tension. Une gaine passe rarement là où on l'imagine : "
      + "sur une rénovation, je trouve encore des fils sans gaine du tout.",
    media: '#1b4b6b,#4d7f9e', likes: 418, vues: 7650, liked: false, comments: [] },
  { id: 8, type: 'post', format: 'texte', proId: 1, time: 'Il y a 4 j',
    conseil: true,
    texte: "On ne coule pas une dalle en dessous de 5 °C : le béton ne prend "
      + "pas, il gèle. Et au-dessus de 30 °C, il faut l'arroser pendant trois "
      + "jours sinon il fissure. Le thermomètre fait partie des outils.",
    media: null, likes: 263, vues: 4410, liked: false, comments: [] },
];

/**
 * LES CHANTIERS DE DÉMONSTRATION (section 36).
 *
 * `nbPublications` et `couverture` sont RECOPIÉS ici alors qu'en base ils
 * sont tenus par un déclencheur. C'est volontaire et c'est borné : en mode
 * démonstration il n'y a pas de base pour les calculer, et une bande qui
 * afficherait « 0 publication » ne montrerait pas ce qu'on veut vérifier.
 * `npm run verifier-chantier` recompte depuis `initialPosts` et refuse
 * qu'ils divergent — sinon ces deux nombres deviendraient faux au premier
 * exemple ajouté.
 */
export const initialChantiers = [
  { id: 'ch-toiture', proId: 5, titre: 'Toiture Charleval', ville: 'Charleval (13)',
    statut: 'termine', nbPublications: 4, couverture: '#4b4b2f,#9a9a5a',
    debut: ilYA(6 * 24), fin: ilYA(2 * 24) },
  { id: 'ch-villa', proId: 1, titre: 'Villa R+1 Marseille', ville: 'Marseille (13)',
    statut: 'en_cours', nbPublications: 3, couverture: '#3a3a38,#8a8578',
    debut: ilYA(3 * 24), fin: ilYA(2) },
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
/* LES DATES DE DÉPÔT SONT CALCULÉES, pas écrites en dur : c'est elles qui
   décident de ce qui porte « Nouveau », et une date figée dans le fichier
   serait « nouvelle » le premier jour puis plus jamais. Le mode démo doit
   montrer le mécanisme, sinon personne ne le voit jamais fonctionner —
   celui qui lance Opus sans fichier `.env` n'a que lui. */

export const initialDemandes = [
  { id: 1, auteurId: 'p-camille', auteur: 'Camille R.', metier: 'carreleur', ville: 'Toulouse (31)',
    texte: "Salle de bain de 6 m² à carreler entièrement, murs et sol. Faïence déjà achetée.",
    media: '#6b4226,#b98255', time: 'Il y a 3 h', deposeeLe: ilYA(3), statut: 'ouverte', reponses: 2,
    budget: '2000_5000', urgence: 'ce_mois', latitude: 43.6045, longitude: 1.4442 },
  { id: 2, auteurId: 'p-hugo', auteur: 'Hugo P.', metier: 'peintre-en-batiment', ville: 'Marseille (13)',
    texte: "Deux chambres à repeindre, environ 30 m² au total. Murs en bon état.",
    media: null, time: 'Hier', deposeeLe: ilYA(26), statut: 'ouverte', reponses: 5,
    budget: '500_2000', urgence: 'quand_possible', latitude: 43.2965, longitude: 5.3698 },
  { id: 3, auteurId: 'p-nadia', auteur: 'Nadia K.', metier: 'macon', ville: 'Aix-en-Provence (13)',
    texte: "Mur de clôture de 12 m à monter en parpaing, avec un portail à sceller.",
    media: '#3a3a38,#8a8578', time: 'Il y a 2 j', deposeeLe: ilYA(50), statut: 'ouverte', reponses: 1,
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
    metier: 'plaquiste', ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357,
    dateDebut: '2026-10-12', dateFin: '2026-10-20', time: 'Il y a 4 h', reponses: 3 },
  { id: 'a2', type: 'sous_traitance_offre', auteurId: 4,
    titre: 'Équipe de deux disponible fin octobre',
    texte: "Plomberie et chauffage, rénovation comme neuf. Nous intervenons sur tout le département.",
    metier: 'plombier', ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698,
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

/**
 * Trois demandes reçues, pour que l'écran « Pour moi » montre quelque chose
 * sans base de données.
 *
 * ELLES SONT ICI POUR UNE RAISON PRÉCISE, et pas pour faire joli : l'écran
 * qu'on vient d'écrire est celui qui n'existait pas. Sans jeu d'essai, on ne
 * voit ni le bandeau de couleur, ni le bouton « Appeler », ni ce que devient
 * une demande acceptée — et c'est exactement le genre d'écran qu'on croit
 * fini parce qu'il est vide.
 *
 * Le téléphone qui s'affiche est celui que le client a ÉCRIT dans son
 * formulaire. Jamais celui de son compte.
 */
export const initialDemandesRecues = [
  {
    id: 'dr-sos-1', genre: 'sos', statut: 'envoyee',
    clientId: 'u-julie', nom: 'Julie M.', telephone: '06 11 22 33 44',
    metier: 'plomberie', titre: 'Fuite sous l’évier',
    details: 'Ça coule depuis ce matin · 12 rue des Lices, Lambesc',
    ville: null, budget: null, creneau: 'immediat',
    prixMin: 90, prixMax: 180, avatarUrl: null, quand: 'Il y a 12 min',
  },
  {
    id: 'dr-devis-1', genre: 'devis', statut: 'en_attente',
    clientId: 'u-marc', nom: 'Marc Dumont', telephone: '06 55 44 33 22',
    metier: 'macon', titre: 'Ouverture de mur porteur, 3 m de portée',
    details: null, ville: 'Lambesc (13)', budget: '5000_15000',
    creneau: null, prixMin: null, prixMax: null, avatarUrl: null,
    quand: 'Il y a 2 h',
  },
  {
    id: 'dr-rappel-1', genre: 'rappel', statut: 'accepte',
    clientId: 'u-sophie', nom: 'Sophie B.', telephone: '06 77 88 99 00',
    metier: null, titre: null, details: null, ville: null, budget: null,
    creneau: 'Matin', prixMin: null, prixMax: null, avatarUrl: null,
    quand: 'Hier',
  },
];
