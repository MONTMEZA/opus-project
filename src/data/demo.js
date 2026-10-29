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


/* LES FICHES NE PORTENT PLUS DE `siret` (15/10/2026, section 45). Les huit
   numéros qui étaient ici étaient INVENTÉS, et plus rien ne les lisait :
   l'entreprise d'un professionnel vit désormais à part, rattachée par la
   base après une consultation du répertoire Sirene. En démonstration, elle
   vient de `siret-demo.js`, dont les numéros sont fictifs (cinq zéros en
   tête) — un vrai SIRET affiché en exemple serait l'usurpation que ce lot
   ferme. */
export const proProfiles = {
  1: { id: 1, nom: 'Karim Ferlane', entreprise: 'Maçonnerie Ferlane', metier: 'macon',
       metiers: ['macon', 'carreleur'],
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 9,
       followers: 1240,
       horaires: {
         lun: [['08:00', '12:00'], ['14:00', '18:00']],
         mar: [['08:00', '12:00'], ['14:00', '18:00']],
         mer: [['08:00', '12:00'], ['14:00', '18:00']],
         jeu: [['08:00', '12:00'], ['14:00', '18:00']],
         ven: [['08:00', '12:00'], ['14:00', '17:00']],
         sam: [['09:00', '12:00']],
         dim: [],
       },
       telephone: '04 65 71 01 01', zoneKm: 40,
       specialites: ['Mur en pierre', 'Enduit à la chaux', 'Ouverture de mur porteur', 'Dalle béton'],
       rgeDeclare: true, rgeExpire: '09/2027',
       bio: "Entreprise familiale spécialisée dans la maçonnerie générale et la rénovation depuis 2015.",
       partners: [2, 4],
       assurance: { valide: true, expire: '12/2026' },
       kbis: { valide: true, maj: '03/2026' },
       rge: true,
       portfolio: ['demo:chantier-fondations', 'demo:chantier-ferraillage', 'demo:macon-mur-pierre', 'demo:chantier-terrassement', 'demo:macon-coffrage'],
       reviews: [
         { id: 1, auteur: 'Julie M.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 4, commentaire: "Chantier livré dans les temps, très bon relationnel, travail soigné." },
         { id: 2, auteur: 'Thomas B.', verifie: true, date: 'Août 2026', delais: 4, qualite: 5, tarif: 4, commentaire: "Fondations nickel, un léger retard sur la fin mais bien communiqué." },
         { id: 3, auteur: 'Nadia K.', verifie: true, date: 'Juil. 2026', delais: 5, qualite: 4, tarif: 3, commentaire: "Bon travail dans l'ensemble, tarif un peu élevé par rapport au devis initial." },
       ] },
  2: { id: 2, nom: 'Sophie Belvanne', entreprise: 'Belvanne Élec', metier: 'electricien',
       ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357, verifie: true, exp: 6,
       followers: 860,
       horaires: {
         lun: [['07:30', '17:30']], mar: [['07:30', '17:30']],
         mer: [['07:30', '17:30']], jeu: [['07:30', '17:30']],
         ven: [['07:30', '16:00']], sam: [], dim: [],
       },
       telephone: '04 65 71 01 02', zoneKm: 30,
       specialites: ['Mise aux normes NF C 15-100', 'Borne de recharge', 'Tableau électrique'],
       rgeDeclare: true, rgeExpire: '03/2028',
       bio: "Installations électriques neuves et rénovation, mise aux normes NF C 15-100.",
       partners: [1],
       assurance: { valide: true, expire: '09/2027' },
       kbis: { valide: true, maj: '01/2026' },
       rge: true,
       portfolio: ['demo:electricite-tableau', 'demo:electricite-testeur'],
       reviews: [
         { id: 1, auteur: 'Marc L.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 5, commentaire: "Impeccable du devis à la mise en service, je recommande." },
       ] },
  3: { id: 3, nom: 'Yanis Coulvane', entreprise: 'Coulvane Carrelage', metier: 'carreleur',
       ville: 'Toulouse (31)', latitude: 43.6045, longitude: 1.4442, verifie: false, exp: 4,
       followers: 410,
       telephone: '05 36 49 01 03', zoneKm: 25,
       specialites: ["Douche à l'italienne", 'Carrelage grand format', 'Faïence salle de bain'],
       bio: "Pose de carrelage grand format, faïence, douches à l'italienne.",
       partners: [],
       assurance: { valide: false, expire: null },
       kbis: { valide: true, maj: '11/2025' },
       rge: false,
       portfolio: ['demo:carrelage-grand-format', 'demo:carrelage-pose'],
       reviews: [
         { id: 1, auteur: 'Antoine R.', verifie: true, date: 'Août 2026', delais: 3, qualite: 4, tarif: 5, commentaire: "Très bon rapport qualité-prix, quelques jours de retard sur le planning." },
       ] },
  4: { id: 4, nom: 'Marc Valsanne', entreprise: 'Valsanne Plomberie', metier: 'plombier',
       metiers: ['plombier', 'chauffagiste'],
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 12,
       followers: 990,
       bio: "Plomberie générale, chauffage, dépannage rapide sur Marseille et alentours.",
       partners: [1],
       assurance: { valide: true, expire: '06/2027' },
       kbis: { valide: true, maj: '02/2026' },
       rge: false,
       portfolio: ['demo:chauffage-chaudiere', 'demo:plomberie-cuivre', 'demo:chauffage-radiateur'],
       reviews: [
         { id: 1, auteur: 'Claire D.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 4, tarif: 4, commentaire: "Intervention rapide pour une urgence, très professionnel." },
         { id: 2, auteur: 'Hugo P.', verifie: true, date: 'Juin 2026', delais: 4, qualite: 5, tarif: 3, commentaire: "Excellent travail sur le remplacement de chaudière, prix un peu haut." },
       ] },
  8: { id: 8, nom: 'Léa Lissagne', entreprise: 'Lissagne Plomberie', metier: 'plombier',
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 5,
       followers: 380,
       bio: "Dépannage, sanitaire et rénovation de salle de bain. Devis gratuit sous 24 h.",
       partners: [],
       assurance: { valide: true, expire: '03/2027' },
       kbis: { valide: true, maj: '06/2026' },
       rge: false,
       portfolio: ['demo:plomberie-cuivre', 'demo:chauffage-radiateur'],
       reviews: [
         { id: 1, auteur: 'Samir T.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 4, tarif: 5, commentaire: "Fuite réparée en une heure, tarif annoncé respecté." },
       ] },
  6: { id: 6, nom: 'Driss Quintavel', entreprise: 'Quintavel Serrurerie', metier: 'serrurier',
       ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698, verifie: true, exp: 7,
       followers: 540,
       bio: "Ouverture de porte, changement de serrure, blindage. Interventions d'urgence 7j/7.",
       partners: [],
       assurance: { valide: true, expire: '08/2027' },
       kbis: { valide: true, maj: '04/2026' },
       rge: false,
       portfolio: ['demo:serrurerie-porte'],
       reviews: [
         { id: 1, auteur: 'Léa V.', verifie: true, date: 'Sept. 2026', delais: 5, qualite: 5, tarif: 4, commentaire: "Porte claquée un dimanche soir, arrivé en 25 minutes, aucune dégradation." },
       ] },
  7: { id: 7, nom: 'Pierre Arnevin', entreprise: 'Arnevin Chauffage', metier: 'chauffagiste',
       ville: 'Aix-en-Provence (13)', latitude: 43.5297, longitude: 5.4474, verifie: true, exp: 15,
       followers: 720,
       bio: "Chaudières gaz et fioul, pompes à chaleur, dépannage et entretien annuel.",
       partners: [4],
       assurance: { valide: true, expire: '11/2026' },
       kbis: { valide: true, maj: '05/2026' },
       rge: true,
       portfolio: ['demo:chauffage-radiateur', 'demo:chauffage-chaudiere'],
       reviews: [
         { id: 1, auteur: 'Farid B.', verifie: true, date: 'Août 2026', delais: 4, qualite: 5, tarif: 4, commentaire: "Chaudière relancée le jour même, explications claires sur l'entretien." },
       ] },
  5: { id: 5, nom: 'Élodie Mérivel', entreprise: 'Charpentes Mérivel', metier: 'charpentier',
       ville: 'Aix-en-Provence (13)', latitude: 43.5297, longitude: 5.4474, verifie: true, exp: 8,
       followers: 320,
       bio: "Charpente traditionnelle et ossature bois, du neuf à la rénovation.",
       partners: [1],
       assurance: { valide: true, expire: '04/2027' },
       kbis: { valide: true, maj: '05/2026' },
       rge: true,
       portfolio: ['demo:toiture-tuiles-posees', 'demo:toiture-chevrons', 'demo:charpente-traditionnelle'],
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
  const n = (pro && pro.avisCount) || 0;

  /* On recalcule depuis les avis CHARGÉS — c'est ce qui fait bouger la note
     tout de suite après qu'on a publié le sien —, mais seulement s'ils sont
     TOUS là (relecture du 26/10). La lecture cache à quelqu'un les avis
     d'une personne qu'il a bloquée : recalculée sur ce qui reste, la note
     de la fiche différait de celle des listes, et un avis qui existe ne
     comptait plus dans la note affichée. Il en manque : la note de la base. */
  if (rs.length > 0 && rs.length >= n) {
    const sum = (k) => rs.reduce((a, r) => a + r[k], 0) / rs.length;
    const delais = sum('delais'), qualite = sum('qualite'), tarif = sum('tarif');
    return { delais, qualite, tarif, global: (delais + qualite + tarif) / 3, count: rs.length };
  }

  if (n === 0) return { delais: 0, qualite: 0, tarif: 0, global: 0, count: 0 };

  const delais = Number(pro.noteDelais) || 0;
  const qualite = Number(pro.noteQualite) || 0;
  const tarif = Number(pro.noteTarif) || 0;
  return { delais, qualite, tarif, global: (delais + qualite + tarif) / 3, count: n };
}

/**
 * La fiche d'un artisan juste après qu'on a publié SON avis (lot S-b,
 * seconde relecture du 27/10). L'avis entre dans la liste, ET le nombre
 * d'avis et les trois moyennes de la base bougent avec lui — sans quoi :
 *   - un avis masqué (on a bloqué son auteur) plus le sien faisaient
 *     « tous les avis sont là » par compensation, et la note retombait sur
 *     les seuls avis visibles, avec un compte faux ;
 *   - deux avis masqués plus le sien laissaient la note de la base,
 *     PÉRIMÉE : elle ne bougeait pas après la publication.
 * Ici chaque moyenne vaut (ancienne × n + nouvelle) / (n + 1). Les listes
 * (Découvrir, SOS), qui lisent la note de la base, la voient aussi.
 */
export function avecAvisPublie(pro, avis) {
  const n = (pro && pro.avisCount) || 0;
  const moyenne = (ancienne, nouvelle) => ((Number(ancienne) || 0) * n + nouvelle) / (n + 1);
  return {
    ...pro,
    reviews: [avis, ...((pro && pro.reviews) || [])],
    avisCount: n + 1,
    noteDelais: moyenne(pro && pro.noteDelais, avis.delais),
    noteQualite: moyenne(pro && pro.noteQualite, avis.qualite),
    noteTarif: moyenne(pro && pro.noteTarif, avis.tarif),
  };
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
    texte: "Dalle coulée ce matin à la pompe, sur le treillis posé hier. Chantier villa R+1.",
    media: 'demo:chantier-fondations', likes: 214, vues: 3120, liked: false,
    comments: [
      { id: 1, auteurId: 'u-julie', auteur: 'Julie M.', auteurType: 'particulier',
        texte: 'Superbe avancée, bravo !', time: 'Il y a 1 h',
        reponses: [
          { id: 11, auteurId: 1, auteur: 'Maçonnerie Ferlane', auteurType: 'pro',
            texte: 'Merci Julie ! On attaque les murs la semaine prochaine.', time: 'Il y a 45 min',
            reponses: [] },
          { id: 12, auteurId: 'u-julie', auteur: 'Julie M.', auteurType: 'particulier',
            texte: '@Maçonnerie Ferlane hâte de voir le résultat.', time: 'Il y a 30 min',
            reponses: [] },
        ] },
    ] },
  { id: 2, type: 'post', format: 'video', proId: 6, time: 'Il y a 4 h',
    texte: "Deux cylindres changés sur une porte ancienne en chêne. Clés remises au client le jour même.",
    media: 'demo:serrurerie-porte', likes: 132, vues: 1870, liked: false, comments: [] },
  { id: 'ad1', type: 'ad', annonceur: 'Estelvin Matériaux',
    accroche: "Carrelage, ciment, plaques de plâtre, outillage : retrait au dépôt dès 7 h.",
    cta: 'Découvrir', media: 'demo:carrelage-pose' },
  { id: 3, type: 'post', format: 'video', proId: 3, time: 'Hier',
    texte: "Pose grand format 120x60 en salle de bain, jointoiement fini cette semaine. Rendu au top.",
    media: 'demo:carrelage-grand-format', likes: 341, vues: 5240, liked: false,
    comments: [
      { id: 2, auteurId: 'demo-antoine', auteur: 'Antoine R.', auteurType: 'particulier',
        texte: 'Magnifique travail, vous intervenez sur Toulouse centre ?',
        time: 'Il y a 3 h', reponses: [] },
    ] },
  /* Plusieurs photos : c'est CE post qui montre le carrousel en mode démo.
     Un chantier ne se raconte pas en une image — ici la chaudière posée,
     puis le plancher chauffant dont on a purgé le circuit. */
  { id: 4, type: 'post', format: 'photo', proId: 4, time: 'Hier',
    texte: "Remplacement chaudière et purge complète du circuit, plancher chauffant compris. Client satisfait, garantie 2 ans.",
    media: 'demo:chauffage-chaudiere',
    medias: ['demo:chauffage-chaudiere', 'demo:chauffage-radiateur'],
    likes: 87, vues: 940, liked: false, comments: [] },
  { id: 'ad2', type: 'ad', annonceur: 'Roucanne Assurances',
    accroche: "Votre décennale et votre RC pro, avec l’attestation en ligne.",
    cta: 'En savoir plus', media: 'demo:macon-coffrage' },
  { id: 6, type: 'post', format: 'montage', proId: 2, time: 'Il y a 1 j',
    texte: "Chantier en deux temps : les borniers câblés et repérés, puis le contrôle avant la mise en service.",
    media: 'demo:electricite-tableau',
    medias: ['demo:electricite-tableau', 'demo:electricite-testeur'],
    musique: null, likes: 96, vues: 1310, liked: false, comments: [] },
  { id: 5, type: 'post', format: 'avantapres', proId: 5, time: 'Il y a 2 j',
    chantierId: 'ch-toiture', publieLe: ilYA(2 * 24),
    texte: "Couverture terminée : tuiles posées, faîtage scellé, gouttières en zinc reposées.",
    /* Un avant/après porte DEUX photos : l'application refuse d'en publier
       un avec une seule (relevé le 26/10). `media` reste l'après, c'est la
       couverture du chantier. */
    media: 'demo:toiture-tuiles-posees',
    medias: ['demo:toiture-ancienne', 'demo:toiture-tuiles-posees'],
    likes: 176, vues: 2080, liked: false, comments: [] },

  /* LE CHANTIER DU PRO DE DÉMONSTRATION — deux étapes de plus, pour qu'il
     en ait TROIS. En dessous de trois, la place du récit ne s'affiche pas,
     et c'est la seule fiche qu'on puisse ouvrir en tant qu'auteur sans
     fichier `.env` : sans ces deux lignes, ce bloc n'était visible nulle
     part. Les textes sont ceux qu'un MAÇON écrirait, puisque c'est son
     métier — « terrassement », « élévation des murs ». */
  { id: 13, type: 'post', format: 'photo', proId: 1, time: 'Il y a 3 j',
    chantierId: 'ch-villa', publieLe: ilYA(3 * 24),
    texte: "Terrassement terminé. Le sol est bon, pas besoin de reprise en sous-œuvre.",
    media: 'demo:chantier-terrassement', likes: 63, vues: 940, liked: false, comments: [] },
  { id: 14, type: 'post', format: 'photo', proId: 1, time: 'Il y a 1 j',
    chantierId: 'ch-villa', publieLe: ilYA(24),
    texte: "Semelles filantes ferraillées et coffrées. On coule dès que le contrôle est passé.",
    media: 'demo:chantier-ferraillage', likes: 88, vues: 1180, liked: false, comments: [] },

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
    media: 'demo:toiture-ancienne', likes: 54, vues: 810, liked: false, comments: [] },
  /* DEUX photos sur une seule étape : sans ça, le carrousel du dossier ne
     se vérifie nulle part — c'est exactement le défaut que le propriétaire
     a trouvé sur son iPhone le 06/10/2026. */
  { id: 11, type: 'post', format: 'photo', proId: 5, time: 'Il y a 5 j',
    chantierId: 'ch-toiture', publieLe: ilYA(5 * 24),
    texte: "Pose des chevrons neufs en douglas. La charpente était saine, on a gardé les pannes.",
    media: 'demo:toiture-chevrons',
    medias: ['demo:toiture-chevrons', 'demo:charpente-traditionnelle'],
    likes: 71, vues: 1040, liked: false, comments: [] },
  { id: 12, type: 'post', format: 'photo', proId: 5, time: 'Il y a 4 j',
    chantierId: 'ch-toiture', publieLe: ilYA(4 * 24),
    texte: "Écran sous-toiture et liteaux. C'est lui qui protège de la condensation.",
    media: 'demo:toiture-ecran-liteaux', likes: 48, vues: 760, liked: false, comments: [] },

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
  { id: 7, type: 'post', format: 'video', proId: 4, time: 'Il y a 3 j',
    conseil: true,
    texte: "Avant de braser un raccord cuivre, videz complètement la "
      + "canalisation : une seule goutte d'eau suffit à empêcher la brasure "
      + "de prendre. La fuite, elle, attend la remise en eau.",
    media: 'demo:plomberie-cuivre', likes: 418, vues: 7650, liked: false, comments: [] },
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
  /* CELUI-CI PORTE UN RÉCIT (section 39), et c'est ce qui rend le lot I
     visible sans fichier `.env` : la génération, elle, passe par la
     fonction Edge et ne peut pas tourner en démonstration. Sans ce texte,
     l'affichage d'un récit publié ne se vérifierait nulle part ici.

     Il n'est assemblé QUE des quatre étapes ci-dessous — c'est exactement
     ce que la consigne serveur impose à l'agent, et un exemple qui
     inventerait donnerait une fausse idée de ce que fait l'outil.

     Sa date est POSTÉRIEURE à la dernière étape : c'est le cas normal.
     Celui du récit périmé se voit en publiant une étape de plus, et il est
     éprouvé par le contrôle, qui fait tourner `recitPerime()`. */
  { id: 'ch-toiture', proId: 5, titre: 'Toiture Charleval', ville: 'Charleval (13)',
    statut: 'termine', nbPublications: 4, couverture: 'demo:toiture-tuiles-posees',
    debut: ilYA(6 * 24), fin: ilYA(2 * 24),
    recit: "Nous avons commencé par déposer l'ancienne couverture, en mettant "
      + 'de côté les tuiles réutilisables. La charpente était saine : nous '
      + 'avons gardé les pannes et posé des chevrons neufs en douglas. '
      + "L'écran sous-toiture et les liteaux ont été mis en place ensuite — "
      + "c'est lui qui protège de la condensation. Pour finir, les tuiles "
      + 'ont été posées, le faîtage scellé et les gouttières en zinc '
      + 'reposées.',
    recitEcritLe: ilYA(2 * 24 - 1) },
  { id: 'ch-villa', proId: 1, titre: 'Villa R+1 Marseille', ville: 'Marseille (13)',
    statut: 'en_cours', nbPublications: 3, couverture: 'demo:chantier-fondations',
    debut: ilYA(3 * 24), fin: ilYA(2) },
];

/* ====================================================================== */
/*  LE CARNET DE CLIENTS (section 41)                                      */
/*                                                                         */
/*  TROIS FICHES, et chacune fait vivre un mécanisme qui ne se verrait      */
/*  nulle part ailleurs sans fichier `.env` :                              */
/*                                                                         */
/*    - un PARTICULIER, sans SIRET — le cas le plus fréquent ;             */
/*    - une ENTREPRISE avec son SIRET, parce que c'est lui qui devra        */
/*      figurer sur une facture adressée à un professionnel ;              */
/*    - une fiche ARCHIVÉE, sinon la pastille « Archivés » afficherait      */
/*      toujours « (0) » et personne ne saurait à quoi elle sert.          */
/*                                                                         */
/*  `proId` vaut 1 : c'est `Object.keys(proProfiles)[0]`, c'est-à-dire      */
/*  « moi » en démonstration. Et les comparaisons passent par `String()`    */
/*  des deux côtés — un nombre ici, une chaîne là, c'est le piège des      */
/*  trois `===` du lot E.                                                  */
/* ====================================================================== */
export const initialClients = [
  { id: 'cl-martin', proId: 1, type: 'particulier', nom: 'Mme Martin',
    siret: null, telephone: '06 39 98 02 01', email: null,
    adresse: '4 rue des Lilas', codePostal: '13350', ville: 'Charleval',
    notes: 'Portail à gauche, le chien aboie mais il est gentil.',
    archive: false, creeLe: ilYA(30 * 24), modifieLe: ilYA(30 * 24) },
  { id: 'cl-moulin', proId: 1, type: 'entreprise', nom: 'SCI des Verlusses',
    siret: '00000490300019', telephone: '04 65 71 02 02',
    email: 'contact@sci-verlusses.example',
    adresse: '12 chemin des Verlusses', codePostal: '13410', ville: 'Lambesc',
    notes: null, archive: false, creeLe: ilYA(12 * 24), modifieLe: ilYA(5 * 24) },
  { id: 'cl-ancien', proId: 1, type: 'particulier', nom: 'M. Rossi',
    siret: null, telephone: null, email: null,
    adresse: null, codePostal: '13090', ville: 'Aix-en-Provence',
    notes: 'Chantier terminé en 2024, plus de nouvelles.',
    archive: true, creeLe: ilYA(400 * 24), modifieLe: ilYA(200 * 24) },
];

export const initialConversations = [
  { id: 1, proId: 4, messages: [{ from: 'pro', texte: 'Je passe lundi matin pour le devis.', heure: '09:12' }] },
  { id: 2, proId: 2, messages: [{ from: 'pro', texte: 'Photos du tableau envoyées ✅', heure: 'hier' }] },
];

/* LES NOTIFICATIONS DE DÉMONSTRATION PORTENT LEUR CIBLE, et c'est ce qui
   rend le lot 37 vérifiable sans fichier `.env`.

   Avant, deux sur quatre n'avaient qu'un `postId` et les deux autres
   étaient des `info` sans destination. Le routage par type ne s'éprouvait
   donc nulle part ici — et c'est exactement le défaut que ce fichier a déjà
   eu deux fois : les demandes sans date de dépôt (04/10), et les conseils
   sans `media` (05/10).

   `acteurNom` est écrit À LA MAIN, parce qu'en démonstration il n'y a pas
   de jointure pour l'apporter. C'est lui qui donne les INITIALES de
   l'avatar — le rond beige vide que le propriétaire a vu venait
   précisément de son absence sur la vraie base. */
export const initialNotifications = [
  { id: 1, type: 'commentaire', texte: 'Julie M. a commenté votre publication',
    acteurId: 'u-julie', acteurNom: 'Julie M.',
    postId: 1, commentId: 1, lue: false, time: 'Il y a 1 h' },
  { id: 2, type: 'reponse', texte: 'Julie M. a répondu à votre commentaire',
    acteurId: 'u-julie', acteurNom: 'Julie M.',
    postId: 1, commentId: 11, lue: false, time: 'Il y a 30 min' },
  /* Une réponse à une annonce : le cas que le propriétaire a nommé le
     06/10/2026 — « on clique dessus, rien ne se passe ». `a3` est une
     annonce du pro de démonstration, donc la feuille de ses réponses
     s'ouvre vraiment. */
  { id: 5, type: 'annonce', texte: 'Belvanne Élec a répondu à « 300 parpaings creux, jamais utilisés »',
    acteurId: 2, acteurNom: 'Belvanne Élec',
    annonceId: 'a3', lue: false, time: 'Il y a 2 h' },
  /* Une demande de devis EN ATTENTE : elle ouvre la pastille « À traiter ».
     Écrite par la base AU DÉPÔT de la demande : même ancienneté qu'elle
     (« Il y a 3 h » contre « Il y a 2 h » jusqu'au 26/10/2026). */
  { id: 6, type: 'devis', texte: 'Marc Dumont vous demande un devis',
    acteurId: 'u-marc', acteurNom: 'Marc Dumont',
    devisId: 'dr-devis-1', lue: false, time: 'Il y a 2 h' },
  /* L'arrivée d'un rappel que le compte a ACCEPTÉ depuis : la toucher ouvre
     « En cours », et pas « À traiter ». C'est tout l'intérêt de viser la
     demande et pas la page — c'est là que vit le numéro de téléphone du
     client.
     Jusqu'au 26/10/2026, c'était un `rappel_accepte` « Vous avez accepté un
     rappel » : la base n'envoie JAMAIS ce type à l'artisan — elle l'envoie
     au CLIENT, au nom de l'artisan (`notifie_demande()`). Le texte est donc
     mot pour mot celui que la base écrit à l'arrivée d'un rappel. Depuis le
     lot S-b (26/10/2026), la base écrit « X attend votre appel » : une
     tournure qui n'accorde rien, au lieu de « rappelé » pour tout le monde.
     `verifier-demo` compare chaque notification au modèle de la base pour
     son type — modèle qu'il LIT dans `schema.sql`. */
  { id: 7, type: 'rappel', texte: 'Sophie B. attend votre appel',
    acteurId: 'u-sophie', acteurNom: 'Sophie B.',
    rappelId: 'dr-rappel-1', lue: true, time: 'Hier' },
  /* Et une qui mène à SA PROPRE FICHE. */
  { id: 8, type: 'partenaire_demande', texte: 'Coulvane Carrelage vous propose un partenariat',
    acteurId: 3, acteurNom: 'Coulvane Carrelage', lue: false, time: 'Il y a 5 h' },
  { id: 3, type: 'info', texte: 'Marc Dumont vous suit désormais',
    acteurId: 'u-marc', acteurNom: 'Marc Dumont', lue: true, time: 'Hier' },
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
    media: 'demo:demande-salle-de-bain', time: 'Il y a 3 h', deposeeLe: ilYA(3), statut: 'ouverte', reponses: 2,
    budget: '2000_5000', urgence: 'ce_mois', latitude: 43.6045, longitude: 1.4442 },
  { id: 2, auteurId: 'p-hugo', auteur: 'Hugo P.', metier: 'peintre-en-batiment', ville: 'Marseille (13)',
    texte: "Deux chambres à repeindre, environ 30 m² au total. J'ai commencé la première, je n'ai pas le temps de finir.",
    media: 'demo:peinture-mur', time: 'Hier', deposeeLe: ilYA(26), statut: 'ouverte', reponses: 5,
    budget: '500_2000', urgence: 'quand_possible', latitude: 43.2965, longitude: 5.3698 },
  { id: 3, auteurId: 'p-nadia', auteur: 'Nadia K.', metier: 'macon', ville: 'Aix-en-Provence (13)',
    texte: "Fissure en escalier sur la façade, elle s'agrandit depuis l'hiver. J'aimerais un avis avant qu'elle n'empire.",
    media: 'demo:demande-fissure', time: 'Il y a 2 j', deposeeLe: ilYA(50), statut: 'ouverte', reponses: 1,
    budget: 'a_chiffrer', urgence: 'urgent', latitude: 43.5297, longitude: 5.4474 },
  /* UNE DEMANDE REFERMÉE PAR SON AUTEUR APRÈS LE CHARGEMENT (lot S-b,
     seconde relecture du 27/10) : la liste l'affiche encore ouverte, et
     « Répondre » reçoit le refus neutre de la base (`REPONSE_FERMEE`) — la
     carte quitte alors la liste. `fermeeApresChargement` n'est lu que par
     la réponse de démonstration, jamais par la liste. */
  { id: 4, auteurId: 'p-lucas', auteur: 'Lucas B.', metier: 'menuisier', ville: 'Lyon (69)',
    texte: "Porte d'entrée à remplacer, l'ancienne ferme mal et laisse passer le froid.",
    media: null, time: 'Il y a 5 j', deposeeLe: ilYA(120), statut: 'ouverte', reponses: 3,
    budget: '500_2000', urgence: 'ce_mois', latitude: 45.764, longitude: 4.8357,
    fermeeApresChargement: true },
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
    titre: '300 parpaings creux, jamais utilisés',
    texte: "Surplus d'un chantier annulé. Sur palettes, stockés à l'abri. À prendre sur place.",
    ville: 'Marseille (13)', latitude: 43.2965, longitude: 5.3698,
    prix: 180, unite: 'total', media: 'demo:macon-parpaings', time: 'Il y a 2 j', reponses: 1 },
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

  /* Volontairement posée par un artisan NON vérifié (Coulvane Carrelage) : c'est
     ce qui permet de voir le filtre « vérifiés uniquement » faire son
     travail dès le premier lancement. */
  { id: 'a5', type: 'entraide', auteurId: 3,
    titre: 'Coup de main lundi matin',
    texte: "Monter une poutre IPN de 5 m au premier étage. Une heure à deux, je rends la pareille.",
    ville: 'Lyon (69)', latitude: 45.764, longitude: 4.8357,
    dateDebut: '2026-10-06', time: 'Il y a 5 h', reponses: 4 },
];

/**
 * LES RÉPONSES AUX ANNONCES DU PRO DE DÉMONSTRATION (a3 et a4).
 *
 * Ajoutées le 26/10/2026 : la cloche disait « Belvanne Élec a répondu à… »,
 * et la feuille qu'elle ouvrait répondait « Personne n'a encore répondu ».
 * Même chose pour « 2 réponses » sur la nacelle. Une démonstration qui se
 * dément elle-même fait croire à un défaut. Le nombre de chaque liste DOIT
 * égaler le compteur `reponses` de l'annonce : `verifier-place` le recompte.
 *
 * Seules les annonces du compte de démonstration en ont : c'est la seule
 * personne qui puisse les lire (section 29.2 — le détail des réponses n'est
 * lisible que par l'auteur de l'annonce).
 */
export const initialReponsesAnnonces = {
  a3: [
    { id: 'ra3-1', proId: 2, time: 'Il y a 2 h',
      message: "Bonjour, je monte un local technique au fond de mon terrain : les 300 m'intéressent. Je peux passer les voir jeudi ?" },
  ],
  a4: [
    { id: 'ra4-1', proId: 4, time: 'Hier',
      message: "Elle serait libre mardi et mercredi prochains ? C'est pour un ravalement à Marseille." },
    { id: 'ra4-2', proId: 7, time: 'Il y a 2 j',
      message: 'Je la prendrais une journée début novembre. Vous livrez sur Aix ?' },
  ],
};

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
  /* UNE URGENCE D'ÉLECTRICITÉ, ANCIENNE — décidé par le propriétaire le
     26/10/2026 (défaut D11 du tournage). Elle était de PLOMBERIE, reçue il
     y a douze minutes : or le compte de démonstration est maçon et
     carreleur, et la base ne propose une urgence qu'à un artisan dont la
     FICHE porte le métier (`artisans_urgence`). Aucun maçon ne peut
     recevoir une fuite d'eau.
     Ce compte a, en revanche, une ligne d'urgence « Électricité » restée
     active (`MES_SOS_DEMO`, tarifs-demo.js — l'état exact de la vraie base
     au 19/10) : il a été électricien. L'urgence date donc de CETTE
     époque-là, il y a trois semaines, et l'histoire tient debout. Son
     ancienneté en date vit dans `devis-demo.js` (`ANCIENNETE_DEMANDES`),
     et les deux doivent dire la même chose : `verifier-demo` les compare. */
  {
    id: 'dr-sos-1', genre: 'sos', statut: 'envoyee',
    clientId: 'u-julie', nom: 'Julie M.', telephone: '06 39 98 03 01',
    metier: 'electricite', titre: 'Plus de courant dans la cuisine',
    /* `details` est ce que `mes_demandes_recues()` rend : ce que la
       personne a écrit, puis l'adresse rangée par l'écran SOS. */
    details: 'Le disjoncteur saute dès qu’on branche le four · Lambesc (13)',
    /* Ce que `sos_requests` range à part (et que « Faire un devis » relit) :
       le texte ÉCRIT, et une COMMUNE choisie dans la liste — la forme que
       l'écran SOS range depuis le 29/10/2026 (`adresseDUrgence`), jamais
       une rue : la démonstration ne prête l'adresse de personne. */
    detailsEcrits: 'Le disjoncteur saute dès qu’on branche le four',
    adresse: 'Lambesc (13)', codePostal: '13410',
    ville: null, budget: null, creneau: 'immediat',
    prixMin: 90, prixMax: 180, avatarUrl: null, quand: 'Il y a 21 j',
  },
  {
    id: 'dr-devis-1', genre: 'devis', statut: 'en_attente',
    clientId: 'u-marc', nom: 'Marc Dumont', telephone: '06 39 98 03 02',
    metier: 'macon', titre: 'Ouverture de mur porteur, 3 m de portée',
    details: null, ville: 'Lambesc (13)', budget: '5000_15000',
    creneau: null, prixMin: null, prixMax: null, avatarUrl: null,
    quand: 'Il y a 2 h',
  },
  {
    id: 'dr-rappel-1', genre: 'rappel', statut: 'accepte',
    clientId: 'u-sophie', nom: 'Sophie B.', telephone: '06 39 98 03 03',
    metier: null, titre: null, details: null, ville: null, budget: null,
    creneau: 'Matin', prixMin: null, prixMax: null, avatarUrl: null,
    quand: 'Hier',
  },
];
