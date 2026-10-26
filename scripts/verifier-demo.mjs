/**
 * LA DÉMONSTRATION NE MENT PAS — ni sur les gens, ni sur elle-même.
 *
 * POURQUOI CE CONTRÔLE EXISTE — 26/10/2026
 * ---------------------------------------
 * Les vidéos et les captures PUBLICITAIRES d'Opus se tournent en mode
 * démonstration. Relevé au tournage du 25/10, puis vérifié deux fois :
 *
 *   - cinq artisans de démonstration portaient le nom d'une VRAIE entreprise
 *     du même métier (« Faure Charpente », société active en charpente) ; les
 *     deux publicités, le nom d'une enseigne de négoce et celui d'un courtier,
 *     avec une offre chiffrée inventée ;
 *   - tous les numéros de téléphone tombaient dans des tranches ATTRIBUÉES à
 *     un opérateur — ils pouvaient appartenir à quelqu'un ;
 *   - la démonstration se démentait : un badge « vérifié » sur une fiche à qui
 *     il manquait une pièce, une notification au nom d'un autre artisan, une
 *     réponse annoncée que la feuille ne montrait pas ;
 *   - et à la place des photos, des dégradés de couleur.
 *
 * Ce fichier FAIT TOURNER les données (il les importe), il ne les relit pas.
 * Les photos, elles, sont vérifiées par leurs FICHIERS : présence, poids,
 * licence écrite à côté. `photos-demo.js` charge les images par `require`,
 * que `node` ne sait pas ouvrir : on lit donc sa table comme du texte.
 *
 * Ce que ce contrôle NE PEUT PAS dire : qu'un nom inventé n'existe dans aucun
 * registre de MARQUES (la base de l'INPI ne s'interroge pas sans compte), ni
 * qu'une photo ne montre personne. Les deux ont été vérifiés à la main, et
 * `assets/demo/LICENCES.md` dit comment.
 *
 *   npm run verifier-demo
 */
import { readFileSync, existsSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const demo = await import('../src/data/demo.js');
const pros = demo.proProfiles;

console.log('\nLes noms sont inventés, et le restent');
{
  /* Les anciens noms, retrouvés dans l'annuaire Sirene (entreprises réelles
     du même métier, ou enseignes connues). Ils ne doivent JAMAIS revenir. */
  const INTERDITS = [
    'Belaïd Maçonnerie', 'BELAID MACONNERIE', 'Renaud Élec', 'YC Carrelage',
    'Dubreuil Plomberie', 'Faure Charpente', 'Amrani Serrurerie',
    'Nogaret Chauffage', 'Sanchez Plomberie', 'BricoPro', 'AssurBTP',
    'Bâti Démo', 'BATI DEMO',
  ];
  const fichiers = [
    'src/data/demo.js', 'src/data/siret-demo.js', 'src/data/tarifs-demo.js',
    'src/data/devis-demo.js', 'src/data/emetteur-demo.js', 'supabase/seed.sql',
  ].filter(existsSync);
  const trouves = [];
  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    INTERDITS.forEach((n) => { if (c.includes(n)) trouves.push(`${f} : « ${n} »`); });
  });
  verifier('aucun ancien nom d’entreprise réelle ne revient dans les données',
    trouves.length === 0, trouves.join('\n      '));

  const nomsPros = new Set(Object.values(pros).map((p) => p.nom));
  const clients = [
    ...demo.initialDemandesRecues.map((d) => d.nom),
    ...demo.initialDemandes.map((d) => d.auteur),
  ].filter(Boolean);
  const confondus = clients.filter((n) => nomsPros.has(n));
  verifier('aucun particulier ne porte le nom d’un artisan de la démonstration',
    confondus.length === 0, confondus.join(', '));
}

console.log('\nLes numéros sont ceux que l’Arcep réserve à la fiction');
{
  /* Plan national de numérotation, décision Arcep n° 2018-0881, art. 2.5.12 :
     six racines réservées aux œuvres audiovisuelles, jamais attribuées. */
  const FICTION = ['01 99 00', '02 61 91', '03 53 01', '04 65 71', '05 36 49', '06 39 98'];
  const NUMERO = /\b0[1-9](?: \d\d){4}\b/g;
  const fichiers = [
    'src/data/demo.js', 'src/data/emetteur-demo.js', 'src/data/tarifs-demo.js',
    'src/data/devis-demo.js', 'src/screens/ProfilEditScreen.js',
    'src/components/FicheClient.js', 'src/components/FicheEmetteur.js',
  ].filter(existsSync);
  const hors = [];
  let vus = 0;
  fichiers.forEach((f) => {
    (sansCommentaires(lire(f)).match(NUMERO) || []).forEach((n) => {
      vus += 1;
      if (!FICTION.some((r) => n.startsWith(r))) hors.push(`${f} : ${n}`);
    });
  });
  verifier('chaque numéro affiché commence par une racine de fiction',
    vus > 0 && hors.length === 0, hors.join('\n      '));
}

console.log('\nLa démonstration ne se dément pas');
{
  /* La base pose `verifie = kbis_valide AND assurance_valide`
     (synchronise_verification) : une fiche vérifiée sans une de ses pièces
     n'existe pas — la démonstration ne doit pas la montrer. */
  const faux = Object.values(pros).filter((p) =>
    !!p.verifie !== !!(p.kbis && p.kbis.valide && p.assurance && p.assurance.valide));
  verifier('un badge « vérifié » n’existe qu’avec ses deux pièces validées',
    faux.length === 0, faux.map((p) => p.entreprise).join(', '));

  /* Une notification nomme celui qui a agi : l'artisan dont l'identifiant
     est donné, ou le client de la demande qu'elle vise. */
  const clientsParId = new Map(demo.initialDemandesRecues.map((d) => [d.clientId, d.nom]));
  const menteuses = demo.initialNotifications.filter((n) => {
    if (typeof n.acteurId === 'number') {
      return !pros[n.acteurId] || pros[n.acteurId].entreprise !== n.acteurNom;
    }
    if (clientsParId.has(n.acteurId)) return clientsParId.get(n.acteurId) !== n.acteurNom;
    return false;
  });
  verifier('chaque notification porte le nom de celui qui a vraiment agi',
    menteuses.length === 0, menteuses.map((n) => `notification ${n.id} (${n.acteurNom})`).join(', '));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La démonstration ne prête un nom ou un numéro à personne, et elle ne se dément pas.\n');
