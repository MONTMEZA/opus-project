/**
 * LA LOUPE DU FIL — un filtre DUR, et tenu par la BASE.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Deux défauts, et le second était déjà là avant qu'on ajoute le premier.
 *
 *   1. le fil n'avait AUCUN filtre. `select * from posts order by
 *      created_at desc limit 20`. À mille artisans, un particulier de
 *      Marseille regarde les chantiers de Lille ;
 *   2. `feedAbonnements` filtrait À L'ÉCRAN, sur les vingt publications
 *      déjà téléchargées. Avec trois abonnements et seize publications,
 *      personne ne le voit. Avec mille artisans, les vingt dernières
 *      publications de toute la France n'en contiennent AUCUNE : l'onglet
 *      affiche une page vide, et la suivante aussi.
 *
 * Les deux partent ensemble, sinon on obtient le pire des deux : un filtre
 * appliqué dans la base ET un filtre appliqué sur son résultat.
 *
 * CE QUE CE CONTRÔLE FAIT TOURNER
 * -------------------------------
 * `correspond()` vit dans `src/lib/filtre-fil.js`, QUI NE CHARGE RIEN DE
 * REACT NATIVE — sixième application de la leçon de
 * `cloudinary-adresses.js`. Les cas ci-dessous sont les mêmes que ceux de
 * `supabase/essais-section-33.sql` : les deux écritures de la règle (SQL
 * pour la vraie base, JavaScript pour le mode démonstration) sont éprouvées
 * sur le même jeu.
 *
 *   npm run verifier-filtre
 */
import { readFileSync } from 'node:fs';

const {
  FILTRE_VIDE, filtreActif, nombreDeReglages, resumeFiltre, argumentsDuFil,
  correspond,
} = await import('../src/lib/filtre-fil.js');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const sqlNu = (c) => c.replace(/^\s*--.*$/gm, '');

/* ------------------------------------------------------------------ *
 *  Le jeu d'essai — le MÊME que `essais-section-33.sql`.
 *  Lambesc (43,65 / 5,26) et Lille (50,63 / 3,06) : 800 km.
 * ------------------------------------------------------------------ */
const MACON = {
  id: 1, metier: 'macon', metiers: ['macon'], verifie: true,
  latitude: 43.6508, longitude: 5.2636,
  reviews: [{ delais: 4, qualite: 4, tarif: 4 }],
};
const COUVREUR = {
  id: 2, metier: 'couvreur', metiers: ['couvreur'], verifie: false,
  latitude: 50.6292, longitude: 3.0573,
  reviews: [],                       // AUCUN avis : le piège de la note
};
const SANS_LIEU = {
  id: 3, metier: 'macon', metiers: ['macon'], verifie: true,
  latitude: null, longitude: null, reviews: [{ delais: 5, qualite: 5, tarif: 5 }],
};

const P_MACON   = { id: 'p1', type: 'post', format: 'photo', proId: 1 };
const P_VIDEO   = { id: 'p2', type: 'post', format: 'video', proId: 1 };
const P_COUVREUR = { id: 'p3', type: 'post', format: 'photo', proId: 2 };
const P_SANS_LIEU = { id: 'p4', type: 'post', format: 'photo', proId: 3 };
const PUB       = { id: 'ad1', type: 'ad' };

const FICHES = { 1: MACON, 2: COUVREUR, 3: SANS_LIEU };
const garde = (posts, f, opts) => posts.filter(
  (p) => correspond(p, FICHES[p.proId], f, opts)).map((p) => p.id);

const TOUT = [P_MACON, P_VIDEO, P_COUVREUR, P_SANS_LIEU, PUB];
const SECTEUR_LAMBESC = {
  centre: 'ville', ville: 'Lambesc (13)',
  latitude: 43.6508, longitude: 5.2636, rayonKm: 20,
};

console.log('\nSans filtre, le fil montre tout');
{
  verifier('les cinq passent', garde(TOUT, FILTRE_VIDE).length === 5);
  verifier('FILTRE_VIDE n’est pas « actif »', !filtreActif(FILTRE_VIDE));
  verifier('…et ne se résume pas', resumeFiltre(FILTRE_VIDE) === '');
}

console.log('\nTout filtre retire les PUBLICITÉS');
{
  const avecMetier = garde(TOUT, { metier: 'macon' });
  verifier('par métier', !avecMetier.includes('ad1') && avecMetier.includes('p1'),
    'une publicité n’a ni auteur, ni métier, ni lieu, ni badge : elle ne peut '
    + 'satisfaire aucun critère. Demander « les maçons » et recevoir une '
    + 'publicité est exactement ce qui fait perdre confiance dans un fil');
  verifier('par secteur', !garde(TOUT, { secteur: SECTEUR_LAMBESC }).includes('ad1'));
  verifier('par badge', !garde(TOUT, { verifies: true }).includes('ad1'));
  verifier('par note', !garde(TOUT, { noteMin: 3 }).includes('ad1'));
  verifier('…mais elle revient dès qu’on enlève le filtre',
    garde(TOUT, FILTRE_VIDE).includes('ad1'));
}

console.log('\nPar métier');
{
  const r = garde(TOUT, { metier: 'macon' });
  verifier('les deux publications du maçon', r.includes('p1') && r.includes('p2'));
  verifier('…et celle de l’autre maçon', r.includes('p4'));
  verifier('pas le couvreur', !r.includes('p3'));
}

console.log('\nPar secteur — et « pas de coordonnées » veut dire « on ne sait pas où »');
{
  const r = garde(TOUT, { secteur: SECTEUR_LAMBESC });
  verifier('Lambesc à 20 km : les deux du maçon', r.includes('p1') && r.includes('p2'));
  verifier('Lille sort', !r.includes('p3'));
  verifier('l’artisan SANS coordonnées sort aussi', !r.includes('p4'),
    'prétendre qu’il est à 10 km serait inventer. Même règle que les annonces, '
    + 'et ce n’est PAS la règle des dates : « pas de dates » veut dire '
    + '« disponible n’importe quand », « pas de coordonnées » veut dire « on ne '
    + 'sait pas où »');
  const large = garde(TOUT, { secteur: { ...SECTEUR_LAMBESC, rayonKm: 900 } });
  verifier('à 900 km, Lille entre', large.includes('p3'));
  verifier('…et celui sans coordonnées, toujours pas', !large.includes('p4'));
}

console.log('\nLe piège de la note : sans avis, on est écarté');
{
  const r = garde(TOUT, { noteMin: 3 });
  verifier('le maçon noté 4 reste', r.includes('p1'));
  verifier('le couvreur SANS avis sort', !r.includes('p3'),
    'mesuré le 05/10/2026 sur la vraie base : 4 artisans sur 7 n’ont aucun '
    + 'avis. Un filtre sur la note les écarte tous, donc tous les nouveaux '
    + 'inscrits, pour toujours — et l’ÉCRAN doit le dire');
  verifier('à 5/5, le maçon à 4 sort aussi', !garde(TOUT, { noteMin: 5 }).includes('p1'));
}

console.log('\nPar badge');
{
  const r = garde(TOUT, { verifies: true });
  verifier('le maçon vérifié reste', r.includes('p1'));
  verifier('le couvreur non vérifié sort', !r.includes('p3'));
}

console.log('\nVidéos et abonnements : les mêmes filtres, pas des exceptions');
{
  const v = garde(TOUT, FILTRE_VIDE, { videos: true });
  verifier('« Vidéos » ne garde que le plein écran', v.length === 1 && v[0] === 'p2');
  verifier('…et pas la publicité, même si elle portait une vidéo', !v.includes('ad1'));

  const a = garde(TOUT, FILTRE_VIDE, { abonnements: new Set([1]) });
  verifier('« Abonnements » garde les miens', a.includes('p1') && a.includes('p2'));
  verifier('…pas les autres', !a.includes('p3'));
  verifier('…et GARDE les publicités', a.includes('ad1'),
    'une publicité est le contrat passé avec l’annonceur : elle ne dépend de '
    + 'personne. La retirer reviendrait à ne la montrer qu’à ceux qui ne '
    + 'suivent personne');
}

console.log('\nPlusieurs filtres ensemble');
{
  const f = { metier: 'macon', secteur: SECTEUR_LAMBESC, verifies: true, noteMin: 3 };
  verifier('les deux du maçon de Lambesc', garde(TOUT, f).length === 2);
  verifier('…et rien à Lille',
    garde(TOUT, { ...f, secteur: { ...SECTEUR_LAMBESC, latitude: 50.6292, longitude: 3.0573 } })
      .length === 0);
}

console.log('\nCe que le filtre DIT de lui-même');
{
  const f = { metier: 'macon', secteur: SECTEUR_LAMBESC, noteMin: 4, verifies: true };
  verifier('il est actif', filtreActif(f));
  verifier('il compte ses réglages', nombreDeReglages(f) === 4);
  verifier('il se NOMME en entier',
    resumeFiltre(f) === 'Maçon · 20 km autour de Lambesc (13) · 4/5 et plus · vérifiés',
    `obtenu : « ${resumeFiltre(f)} » — « 4 filtres » ne dirait pas lesquels, `
    + 'et il faudrait rouvrir la feuille pour le savoir');
  verifier('la demi-note s’écrit à la française',
    resumeFiltre({ noteMin: 4.5 }) === '4,5/5 et plus');
  verifier('un secteur SANS rayon ne compte pas',
    !filtreActif({ secteur: { ville: 'Lambesc (13)', latitude: 43, longitude: 5 } }),
    'sans rayon il n’y a pas de cercle : rien n’est filtré, et la loupe ne '
    + 'doit pas s’allumer pour rien');
}

console.log('\nUne seule fabrique d’arguments pour la base');
{
  const a = argumentsDuFil(
    { metier: 'macon', secteur: SECTEUR_LAMBESC, noteMin: 4, verifies: true },
    { abonnements: true, videos: true });
  verifier('tout y est',
    a.metier === 'macon' && a.rayonKm === 20 && a.latitude === 43.6508
    && a.noteMin === 4 && a.verifies === true
    && a.abonnements === true && a.videos === true);
  const vide = argumentsDuFil(FILTRE_VIDE);
  verifier('et sans filtre, tout est nul ou faux',
    vide.metier === null && vide.latitude === null && vide.rayonKm === null
    && vide.noteMin === null && vide.verifies === false
    && vide.abonnements === false && vide.videos === false);
  verifier('un secteur sans rayon n’envoie PAS de coordonnées',
    argumentsDuFil({ secteur: { latitude: 43, longitude: 5 } }).latitude === null,
    'des coordonnées sans rayon feraient filtrer sur un cercle de 0 km');
}

/* ================================================================== *
 *  Ce qui ne se fait tourner nulle part : la base et les écrans.
 * ================================================================== */
const sql  = sqlNu(lire('supabase/schema.sql'));
const api  = sansCommentaires(lire('src/lib/api.js'));
const app  = sansCommentaires(lire('src/OpusApp.js'));
const barre = sansCommentaires(lire('src/components/TopBar.js'));
const fil  = sansCommentaires(lire('src/screens/HomeScreen.js'));

console.log('\nLa base fait le travail');
{
  const i = sql.indexOf('create or replace function public.fil_filtre(');
  const fn = i === -1 ? '' : sql.slice(i, sql.indexOf('$$;', i));

  verifier('fil_filtre existe', i !== -1);
  verifier('elle est `security invoker`', /security invoker/.test(fn),
    'une fonction `security definer` rendrait les publications des personnes '
    + 'qu’on a BLOQUÉES — et personne ne s’en apercevrait, puisqu’elle '
    + 'rendrait des publications parfaitement normales');
  verifier('la limite est plafonnée',
    /least\(coalesce\(p_limite, 20\), 50\)/.test(fn),
    'un client modifié peut demander 100 000 : c’est le fil, pas un export');
  verifier('la note exige des avis', /coalesce\(pp\.avis_count, 0\) > 0/.test(fn));
  verifier('le secteur exige des coordonnées',
    /p\.latitude is not null and p\.longitude is not null/.test(fn));
  verifier('la distance passe par distance_km', /public\.distance_km\(/.test(fn),
    'recopier la haversine ici en ferait une seconde vérité');
}

console.log('\nL’application ne refiltre RIEN');
{
  verifier('plus de filtrage des abonnements à l’écran',
    !/followingIds\.has\(p\.proId\)/.test(app),
    'c’est le défaut qui rend l’onglet « Abonnements » vide dès qu’il y a du monde');
  verifier('plus de filtrage des vidéos à l’écran',
    !/FORMATS_VIDEO\.has\(p\.format\)\s*\)/.test(app));
  verifier('une seule porte change ce qu’on voit',
    /const changerCeQuOnVoit = async/.test(app));
  verifier('…et les trois chemins y passent',
    /changerCeQuOnVoit\(\{ mode \}\)/.test(app)
    && /changerCeQuOnVoit\(\{ tab \}\)/.test(app)
    && /changerCeQuOnVoit\(\{ filtre \}\)/.test(app));
  verifier('la pagination emporte le filtre',
    /curseur: dernier\.curseur,\s*filtre: argumentsDuFil\(/.test(app),
    'sans lui, la page 2 d’un fil filtré rend tout autre chose que la page 1');
  verifier('…et le « tirer pour rafraîchir » aussi',
    /chargerPageFil\(\{\s*filtre: argumentsDuFil\(filtreFil/.test(app));
}

console.log('\nLe métier ne survit pas, le secteur si');
{
  verifier('seul le secteur est enregistré',
    /AsyncStorage\.setItem\(CLE_SECTEUR, JSON\.stringify\(secteur\)\)/.test(app),
    'c’est la réponse exacte à « si un jour il a besoin d’un couvreur il faut '
    + 'pas qu’il soit bloqué que sur des maçons »');
  verifier('…et jamais le filtre entier',
    !/setItem\(CLE_SECTEUR, JSON\.stringify\(filtre\)/.test(app));
  verifier('un secteur retiré efface la trace',
    /AsyncStorage\.removeItem\(CLE_SECTEUR\)/.test(app),
    'sinon il reviendrait tout seul au lancement suivant');
}

console.log('\nUn filtre dur se VOIT');
{
  verifier('la loupe est dans la barre du haut', /onLoupe/.test(barre));
  verifier('…et elle n’apparaît que sur le fil',
    /onLoupe=\{screen === 'home'/.test(app),
    'ailleurs, elle ouvrirait une feuille qui ne change rien à ce qu’on regarde');
  verifier('elle change d’état quand un filtre est posé',
    /filtreActif \? C\.accentTexte : C\.ink/.test(barre));
  verifier('…avec `C.accentTexte` et non `C.accent`',
    !/color=\{filtreActif \? C\.accent :/.test(barre),
    'une icône sur le fond clair de la barre est un élément graphique : il lui '
    + 'faut 3 : 1, et l’orange de signature n’y donne que 2,76');
  verifier('la ligne de rappel NOMME le réglage',
    /function RappelFiltre/.test(fil) && /\{resume\}/.test(fil));
  verifier('…elle s’enlève d’un appui', /accessibilityLabel="Enlever le filtre"/.test(fil));
  verifier('…et elle n’existe pas sans filtre',
    /if \(!resume\) return null;/.test(fil),
    'une ligne vide en permanence mangerait 44 px du fil pour ne rien dire');
  verifier('la liste vide ne donne plus tort à l’application',
    /Aucune publication pour « \$\{resumeFiltre\}/.test(fil),
    '« Suis des professionnels pour voir leurs publications ici » devant un '
    + 'filtre qui écarte tout fait conclure qu’Opus est désert');
}

console.log('\nLe mode démonstration fait VIVRE le mécanisme');
{
  verifier('la page de démonstration applique le filtre',
    /correspond\(p, demoPros\[p\.proId\], f/.test(api),
    'une loupe qui ne filtrerait rien sans fichier `.env` ne se vérifierait '
    + 'pas ici — et c’est la règle du 01/10');
  verifier('les abonnements de démonstration sont à UN endroit',
    (api.match(/ABONNEMENTS_DEMO/g) || []).length >= 3);
  verifier('le chargement initial passe par fil_filtre, lui aussi',
    /supabase\.rpc\('fil_filtre', \{ p_limite: TAILLE_PAGE_FIL \}\)/.test(api),
    'deux requêtes pour la même liste finiraient par ne plus rendre la même '
    + 'chose, et la première page du fil ne ressemblerait plus aux suivantes');
}

console.log('');
if (echecs) {
  console.error(`${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('Tout est bon.\n');
