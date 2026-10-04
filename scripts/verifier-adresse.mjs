/**
 * Vérifie que la recherche de villes et d'adresses fonctionne VRAIMENT.
 *
 * Ce test interroge la Base Adresse Nationale pour de bon. Il existe parce
 * qu'une version précédente envoyait un paramètre `type=address` que l'API
 * refuse (HTTP 400) : l'application n'affichait plus aucune suggestion, sans
 * le moindre message, et un test à réponse simulée n'y voyait que du feu.
 *
 *   node scripts/verifier-adresse.mjs
 */
const {
  chercher, distanceKm, libelleDistance,
  dansSecteur, decouperAffichage, RAYONS_KM,
} = await import('../src/lib/adresse.js');

const CAS = [
  { titre: 'Ville — Marseille',            texte: 'marseille',                         type: 'municipality', attendu: 'Marseille' },
  { titre: 'Ville — Aix-en-Provence',      texte: 'aix-en-provence',                   type: 'municipality', attendu: 'Aix-en-Provence' },
  { titre: 'Ville — accent et tiret',      texte: 'saint-étienne',                     type: 'municipality', attendu: 'Saint-Étienne' },
  { titre: 'Adresse — rue et numéro',      texte: '12 rue de la republique marseille', type: 'address',      attendu: '13001' },
  { titre: 'Adresse — avenue',             texte: '5 avenue du prado marseille',       type: 'address',      attendu: '13006' },
  { titre: 'Moins de 3 lettres',           texte: 'ma',                                type: 'municipality', vide: true },
];

let echecs = 0;

for (const cas of CAS) {
  const resultats = await chercher(cas.texte, { type: cas.type });

  if (cas.vide) {
    const ok = resultats.length === 0;
    if (!ok) echecs += 1;
    console.log(`${ok ? '  OK  ' : 'ECHEC '} ${cas.titre} — aucun appel attendu, ${resultats.length} résultat(s)`);
    continue;
  }

  const premier = resultats[0];
  const trouve = resultats.some(
    (r) => `${r.label} ${r.ville} ${r.codePostal}`.includes(cas.attendu),
  );
  const coords = premier && typeof premier.latitude === 'number' && typeof premier.longitude === 'number';

  if (!trouve || !coords) echecs += 1;
  console.log(
    `${trouve && coords ? '  OK  ' : 'ECHEC '} ${cas.titre} — ${resultats.length} résultat(s)`
    + (premier ? ` | ${premier.label} | ${premier.codePostal} | ${coords ? 'coordonnées présentes' : 'COORDONNÉES MANQUANTES'}` : ''),
  );
}

// La distance sert à trier les artisans lors d'une urgence.
const d = distanceKm(43.282, 5.405, 43.541, 5.406);
const okDistance = d > 25 && d < 32;
if (!okDistance) echecs += 1;
console.log(`${okDistance ? '  OK  ' : 'ECHEC '} Distance Marseille → Aix = ${d} km (attendu entre 25 et 32)`);

/* --------------------------------------------------------------------------
   La distance ÉCRITE, et le « · 0 km » qui ne voulait rien dire.

   Quand l'artisan et le chantier sont dans la même commune, la distance
   vaut zéro. C'est juste, et personne ne comprend « zéro kilomètre » : ce
   qu'on veut savoir à cet instant, c'est « c'est chez moi » ou « c'est
   loin ». Trois paliers, et pas un de plus.
   -------------------------------------------------------------------------- */
const CAS_DISTANCE = [
  [0, 'dans votre commune'],
  [0.4, 'dans votre commune'],
  [0.999, 'dans votre commune'],
  [1, 'à 1 km'],
  [3.2, 'à 3 km'],
  [3.3, 'à 3,5 km'],
  [9.9, 'à 10 km'],
  [12.4, 'à 12 km'],
  [150, 'à 150 km'],
];
for (const [km, attendu] of CAS_DISTANCE) {
  const obtenu = libelleDistance(km);
  const ok = obtenu === attendu;
  if (!ok) echecs += 1;
  console.log(`${ok ? '  OK  ' : 'ECHEC '} ${km} km s'écrit « ${obtenu} »`
    + (ok ? '' : ` — attendu « ${attendu} »`));
}
for (const [titre, valeur] of [['inconnue', null], ['undefined', undefined], ['absurde', 'abc']]) {
  const ok = libelleDistance(valeur) === null;
  if (!ok) echecs += 1;
  console.log(`${ok ? '  OK  ' : 'ECHEC '} distance ${titre} : on n'affiche rien`);
}
{
  /* Le piège de ce contrôle, rencontré en l'écrivant : « à 150 km »
     CONTIENT la suite de caractères « 0 km ». Ce qu'on veut interdire,
     c'est la distance nulle écrite en toutes lettres — donc le libellé
     ENTIER, pas un morceau. */
  const zero = CAS_DISTANCE.every(([km]) => libelleDistance(km) !== 'à 0 km');
  if (!zero) echecs += 1;
  console.log(`${zero ? '  OK  ' : 'ECHEC '} « à 0 km » ne s'écrit jamais`);
}

/* ==========================================================================
   LE SECTEUR — « une bétonnière à Paris n'intéresse pas Marseille »
   --------------------------------------------------------------------------
   Demandé par le propriétaire le 04/10/2026. Et le vrai piège de ce filtre
   n'est pas le calcul de distance, qui est éprouvé au-dessus : c'est le cas
   SANS COORDONNÉES, qui ressemble au cas « sans dates » et n'a rien à voir.

     - « pas de dates »       = disponible n'importe quand  → ça passe
     - « pas de coordonnées » = on ne sait pas où           → ça sort

   Se tromper de règle là-dessus ne lèverait aucune erreur : la liste
   contiendrait simplement des annonces qui n'ont rien à y faire, et
   personne ne saurait dire pourquoi.
   ========================================================================== */
{
  const LAMBESC = { latitude: 43.648937, longitude: 5.258868 };
  const PELISSANNE = [43.628277, 5.159767];   // ~9 km
  const MARSEILLE = [43.282, 5.405];          // ~41 km
  const LILLE = [50.630951, 3.045391];        // ~800 km

  const cas = [
    ['sans secteur, tout passe', [null, null, null], true],
    ['la commune voisine, à 25 km', [...PELISSANNE, { ...LAMBESC, rayonKm: 25 }], true],
    ['Marseille, à 25 km : non', [...MARSEILLE, { ...LAMBESC, rayonKm: 25 }], false],
    ['Marseille, à 50 km : oui', [...MARSEILLE, { ...LAMBESC, rayonKm: 50 }], true],
    ['Lille, à 200 km : non', [...LILLE, { ...LAMBESC, rayonKm: 200 }], false],
    /* LE CAS QUI COMPTE. */
    ['sans coordonnées, l’annonce SORT', [null, null, { ...LAMBESC, rayonKm: 50 }], false],
    ['…et un secteur sans centre ne filtre rien',
      [43.0, 5.0, { latitude: null, longitude: null, rayonKm: 50 }], true],
  ];
  for (const [titre, [la, lo, sect], attendu] of cas) {
    const ok = dansSecteur(la, lo, sect) === attendu;
    if (!ok) echecs += 1;
    console.log(`${ok ? '  OK  ' : 'ECHEC '} ${titre}`);
  }

  /* LE NUMÉRO ENTRE PARENTHÈSES DÉPARTAGE : il y a une Sainte-Marie dans
     quinze départements. Le perdre placerait un artisan à six cents
     kilomètres de chez lui, sans la moindre alerte. */
  const decoupes = [
    ['Lambesc (13)', 'Lambesc', '13'],
    ['Aix-en-Provence (13)', 'Aix-en-Provence', '13'],
    ['Ajaccio (2A)', 'Ajaccio', '2A'],
    ['Marseille', 'Marseille', null],
    ['', '', null],
  ];
  for (const [brut, nom, dep] of decoupes) {
    const d = decouperAffichage(brut);
    const ok = d.nom === nom && d.departement === dep;
    if (!ok) echecs += 1;
    console.log(`${ok ? '  OK  ' : 'ECHEC '} « ${brut} » → ${d.nom} / ${d.departement}`);
  }

  const rayonsOk = RAYONS_KM.length >= 3 && RAYONS_KM.every((k) => Number.isInteger(k) && k > 0)
    && RAYONS_KM.every((k, i) => i === 0 || k > RAYONS_KM[i - 1]);
  if (!rayonsOk) echecs += 1;
  console.log(`${rayonsOk ? '  OK  ' : 'ECHEC '} les rayons sont croissants : ${RAYONS_KM.join(', ')} km`);
}

console.log(echecs === 0 ? '\nTout est bon.' : `\n${echecs} vérification(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
