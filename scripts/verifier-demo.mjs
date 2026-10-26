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
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';

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

  /* Et une notification qui VISE une demande nomme le client de CETTE
     demande. « Vous avez accepté un rappel » nommait Julie M., alors que le
     rappel visé était celui de Sophie B. — le contrôle d'au-dessus ne le
     voyait pas : Julie est bien une cliente, simplement pas celle-là
     (relevé le 26/10/2026). */
  const demandesParId = new Map(demo.initialDemandesRecues.map((d) => [d.id, d]));
  const deTravers = demo.initialNotifications.filter((n) => {
    const cible = n.devisId || n.rappelId || n.sosId;
    if (!cible) return false;
    const d = demandesParId.get(cible);
    return !d || d.clientId !== n.acteurId || d.nom !== n.acteurNom;
  });
  verifier('une notification qui vise une demande nomme le client de cette demande',
    deTravers.length === 0, deTravers.map((n) => `notification ${n.id} (${n.acteurNom})`).join(', '));
}

/* DÉFAUT D11 DU TOURNAGE, tranché par le propriétaire le 26/10/2026 : le
   compte de démonstration — maçon et carreleur — recevait une urgence de
   PLOMBERIE. La base ne propose une urgence qu'à un artisan dont la fiche
   porte le métier : aucun maçon ne reçoit une fuite d'eau. L'urgence est
   devenue une ANCIENNE urgence d'électricité, du temps où ce compte était
   électricien — il en garde la ligne d'urgence (`MES_SOS_DEMO`). */
console.log('\nLes urgences reçues tiennent debout');
{
  const { MES_SOS_DEMO } = await import('../src/data/tarifs-demo.js');
  const { METIERS_SOS } = await import('../src/data/urgences.js');
  const { dateDeDemandeDemo } = await import('../src/data/devis-demo.js');
  const clesSos = new Set(METIERS_SOS.map((m) => m.key));
  const mesLignes = new Set(MES_SOS_DEMO.lignes.map((l) => l.metierKey));
  const urgences = demo.initialDemandesRecues.filter((d) => d.genre === 'sos');
  verifier('il y a au moins une urgence reçue en démonstration', urgences.length > 0);
  const horsCles = urgences.filter((d) => !clesSos.has(d.metier));
  verifier('une urgence porte une clé d’URGENCE (« electricite »), pas une clé du catalogue',
    horsCles.length === 0, horsCles.map((d) => `${d.id} : ${d.metier}`).join(', '));
  const sansLigne = urgences.filter((d) => !mesLignes.has(d.metier));
  verifier('une urgence reçue est d’un métier pour lequel le compte a une ligne d’urgence',
    sansLigne.length === 0, sansLigne.map((d) => `${d.id} : ${d.metier}`).join(', '));
  const plomberie = urgences.filter((d) => d.metier === 'plomberie');
  verifier('le maçon de démonstration ne reçoit plus de fuite d’eau', plomberie.length === 0);

  /* L'ANCIENNETÉ EST ÉCRITE DEUX FOIS : en texte dans `demo.js`
     (« Il y a 21 j ») et en durée dans `devis-demo.js`, qui date « depuis
     une demande du … ». Les deux doivent dire la même chose — on lit le
     texte comme un intervalle, sans réécrire la fonction qui le fabrique. */
  const intervalle = (quand) => {
    const MIN = 60_000; const H = 60 * MIN; const J = 24 * H;
    let m;
    if ((m = /^Il y a (\d+) min$/.exec(quand))) return [Number(m[1]) * MIN, (Number(m[1]) + 1) * MIN];
    if ((m = /^Il y a (\d+) h$/.exec(quand))) return [Number(m[1]) * H, (Number(m[1]) + 1) * H];
    if (quand === 'Hier') return [J, 2 * J];
    if ((m = /^Il y a (\d+) j$/.exec(quand))) return [Number(m[1]) * J, (Number(m[1]) + 1) * J];
    return null;
  };
  const maintenant = new Date('2026-10-26T12:00:00Z');
  const discordantes = demo.initialDemandesRecues.filter((d) => {
    const iso = dateDeDemandeDemo(d.id, maintenant);
    const borne = intervalle(d.quand);
    if (!iso || !borne) return true;
    const ecart = maintenant.getTime() - new Date(iso).getTime();
    return ecart < borne[0] || ecart >= borne[1];
  });
  verifier('l’ancienneté écrite (« Il y a 21 j ») et la date calculée disent la même chose',
    discordantes.length === 0, discordantes.map((d) => `${d.id} : « ${d.quand} »`).join(', '));
}

console.log('\nDe vraies photos, libres de droit, à la place des dégradés');
{
  const DEGRADE = /^#[0-9a-f]{6},#[0-9a-f]{6}$/i;
  const medias = [];
  Object.values(pros).forEach((p) => (p.portfolio || []).forEach((m) => medias.push(['portfolio', p.entreprise, m])));
  demo.initialPosts.forEach((p) => {
    if (p.media) medias.push(['publication', p.id, p.media]);
    (p.medias || []).forEach((m) => medias.push(['publication', p.id, m]));
  });
  demo.initialChantiers.forEach((c) => medias.push(['chantier', c.id, c.couverture]));
  demo.initialDemandes.forEach((d) => { if (d.media) medias.push(['demande', d.id, d.media]); });
  demo.initialAnnonces.forEach((a) => { if (a.media) medias.push(['annonce', a.id, a.media]); });

  const degrades = medias.filter(([, , m]) => typeof m === 'string' && DEGRADE.test(m));
  verifier('plus aucun dégradé de couleur à la place d’une photo',
    degrades.length === 0, degrades.map(([t, id]) => `${t} ${id}`).join(', '));

  const cles = new Set(medias.map(([, , m]) => m)
    .filter((m) => typeof m === 'string' && m.startsWith('demo:'))
    .map((m) => m.slice(5)));

  /* La table des photos, lue comme du texte : `cle: require('…/fichier.jpg')`. */
  const table = sansCommentaires(lire('src/data/photos-demo.js'));
  const entrees = [...table.matchAll(/'([a-z0-9-]+)':\s*require\('\.\.\/\.\.\/assets\/demo\/([a-z0-9-]+\.jpg)'\)/g)]
    .map(([, cle, fichier]) => ({ cle, fichier }));
  const connues = new Set(entrees.map((e) => e.cle));
  const manquantes = [...cles].filter((c) => !connues.has(c));
  verifier('chaque photo nommée dans les données existe dans la table des photos',
    cles.size > 0 && manquantes.length === 0, manquantes.join(', '));

  const inutiles = entrees.filter((e) => !cles.has(e.cle));
  verifier('…et la table ne garde aucune photo que personne n’affiche',
    inutiles.length === 0,
    'une photo inutile alourdit l’application pour rien : ' + inutiles.map((e) => e.cle).join(', '));

  const dossier = 'assets/demo';
  const surDisque = existsSync(dossier) ? readdirSync(dossier).filter((f) => f.endsWith('.jpg')) : [];
  const absents = entrees.filter((e) => !surDisque.includes(e.fichier));
  verifier('chaque fichier de la table est bien dans assets/demo',
    absents.length === 0, absents.map((e) => e.fichier).join(', '));
  const orphelins = surDisque.filter((f) => !entrees.some((e) => e.fichier === f));
  verifier('…et assets/demo ne contient aucun fichier que la table ne nomme pas',
    orphelins.length === 0, orphelins.join(', '));

  /* Une photo de démonstration voyage DANS l'application : chacune est
     réduite à 1080 px et pèse moins de 260 Ko, et l'ensemble reste borné. */
  const poids = surDisque.map((f) => [f, statSync(`${dossier}/${f}`).size]);
  const lourdes = poids.filter(([, o]) => o > 260 * 1024);
  verifier('chaque photo pèse moins de 260 Ko',
    lourdes.length === 0, lourdes.map(([f, o]) => `${f} : ${Math.round(o / 1024)} Ko`).join(', '));
  const total = poids.reduce((t, [, o]) => t + o, 0);
  verifier('l’ensemble des photos pèse moins de 6 Mo',
    total <= 6 * 1024 * 1024, `${(total / 1024 / 1024).toFixed(1)} Mo`);

  /* LA LICENCE EST ÉCRITE À CÔTÉ DE CHAQUE PHOTO. Seules deux sont admises :
     CC0 (l'auteur renonce à ses droits) et le domaine public. Toute autre —
     même CC-BY — exigerait de citer l'auteur dans l'application et dans
     chaque publicité, ce que personne ne pensera à faire. */
  const licences = existsSync(`${dossier}/LICENCES.md`) ? lire(`${dossier}/LICENCES.md`) : '';
  const sansLicence = surDisque.filter((f) => {
    /* Son TITRE, et pas la première mention du nom : l'introduction en
       cite un, et le bloc lu aurait alors été celui de quelqu'un d'autre. */
    const i = licences.indexOf(`### \`${f}\``);
    if (i < 0) return true;
    /* Le bloc entier, jusqu'au titre suivant : une fenêtre de taille fixe
       perdait la ligne « Licence » derrière une description longue. */
    const bloc = licences.slice(i).split(/\n### /)[0];
    return !/Licence : (CC0 1\.0|domaine public)/.test(bloc) || !/Source : https:\/\//.test(bloc);
  });
  verifier('chaque photo a sa licence (CC0 ou domaine public) et sa source dans LICENCES.md',
    surDisque.length > 0 && sansLicence.length === 0, sansLicence.join(', '));
  verifier('LICENCES.md n’admet aucune autre licence',
    licences.length > 0 && !/Licence : (?!CC0 1\.0|domaine public)/.test(licences));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La démonstration ne prête un nom, un numéro ou une photo à personne, et elle ne se dément pas.\n');
