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
  formater, estUneAdresse, completerLieu,
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

/* ==========================================================================
   CE QUE L'API REND VRAIMENT, FIGÉ — et pourquoi un appel réel ne suffit pas
   --------------------------------------------------------------------------
   Les deux sont nécessaires, et ils n'attrapent pas la même faute :

     - l'APPEL RÉEL, au-dessus, attrape un paramètre que l'API refuse. Une
       version précédente envoyait `type=address`, la BAN répondait 400, et
       plus aucune suggestion ne s'affichait — sans le moindre message ;
     - le JEU FIGÉ, ici, attrape un `properties.type` qu'on aurait mal
       interprété. Il tourne hors réseau, donc même quand le mandataire du
       conteneur coupe la connexion (environ une sur cinq).

   LES QUATRE RÉPONSES CI-DESSOUS SONT RÉELLES, relevées le 11/10/2026 sur
   api-adresse.data.gouv.fr. La plus importante est la première :

     **LA BASE ADRESSE NE RÉPOND JAMAIS « INTROUVABLE ». ELLE REND UNE
     AUTRE ADRESSE.** Il n'existe aucune « rue des Lilas » à Charleval, et
     `q=4 rue des lilas charleval` rend « 4 Rue des Acacias 13350
     Charleval » — parfaitement formée, sans erreur, sans signal. Le seul
     indicateur est le score : la MÊME ligne vaut 0,954 quand la requête
     correspond, et 0,590 quand c'est un repli.

   D'où la règle que l'écran tient : **on ne remplit jamais un champ depuis
   `resultats[0]`.** Une suggestion se CHOISIT, et la liste l'affiche en
   entier — on lit « Acacias », et on sait.
   ========================================================================== */
{
  const REELS = [
    {
      titre: 'un NUMÉRO — `name` porte le numéro ET la rue',
      feature: {
        properties: {
          id: '13024_0130_00004', type: 'housenumber', score: 0.5901,
          name: '4 Rue des Acacias', housenumber: '4', street: 'Rue des Acacias',
          postcode: '13350', city: 'Charleval', citycode: '13024',
          label: '4 Rue des Acacias 13350 Charleval',
          context: "13, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur",
        },
        geometry: { type: 'Point', coordinates: [5.244597, 43.726057] },
      },
      attendu: { genre: 'housenumber', rue: '4 Rue des Acacias', ville: 'Charleval', codePostal: '13350', adresse: true },
    },
    {
      titre: 'une RUE sans numéro',
      feature: {
        properties: {
          id: '13024_0245', type: 'street', score: 0.5683,
          name: 'Rue des Roses', street: 'Rue des Roses',
          postcode: '13350', city: 'Charleval', citycode: '13024',
          label: 'Rue des Roses 13350 Charleval',
          context: "13, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur",
        },
        geometry: { type: 'Point', coordinates: [5.2441, 43.7262] },
      },
      attendu: { genre: 'street', rue: 'Rue des Roses', ville: 'Charleval', codePostal: '13350', adresse: true },
    },
    {
      titre: 'une COMMUNE — `name` est le nom de la VILLE, pas une rue',
      feature: {
        properties: {
          id: '13024', type: 'municipality', score: 0.9399,
          name: 'Charleval', postcode: '13350', city: 'Charleval', citycode: '13024',
          label: 'Charleval', population: 2800,
          context: "13, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur",
        },
        geometry: { type: 'Point', coordinates: [5.2446, 43.7141] },
      },
      attendu: { genre: 'municipality', rue: null, ville: 'Charleval', codePostal: '13350', adresse: false },
    },
    {
      titre: 'un LIEU-DIT — le QUATRIÈME type, et sa ville n’a aucun rapport',
      feature: {
        properties: {
          id: '83067_xxxx', type: 'locality', score: 0.9452,
          name: 'Paris', postcode: '83590', city: 'Gonfaron', citycode: '83067',
          label: 'Paris 83590 Gonfaron',
          context: '83, Var, Provence-Alpes-Côte d’Azur',
        },
        geometry: { type: 'Point', coordinates: [6.2924, 43.3217] },
      },
      attendu: { genre: 'locality', rue: null, ville: 'Gonfaron', codePostal: '83590', adresse: false },
    },
  ];

  for (const cas of REELS) {
    const l = formater(cas.feature);
    const a = cas.attendu;
    const ok = l.genre === a.genre && l.rue === a.rue && l.ville === a.ville
      && l.codePostal === a.codePostal && estUneAdresse(l) === a.adresse
      /* [LONGITUDE, LATITUDE] : l'ordre GeoJSON, l'inverse de l'ordre
         parlé. Les échanger place le point en Somalie sans lever
         d'erreur. */
      && l.latitude === cas.feature.geometry.coordinates[1]
      && l.longitude === cas.feature.geometry.coordinates[0];
    if (!ok) echecs += 1;
    console.log(`${ok ? '  OK  ' : 'ECHEC '} ${cas.titre} → genre ${l.genre}, rue ${JSON.stringify(l.rue)}, `
      + `${l.codePostal} ${l.ville}${estUneAdresse(l) ? ', ligne d’adresse' : ', PAS une ligne d’adresse'}`);
  }

  /* ET LE PSEUDO-TYPE QUI A FAILLI CASSER LE SOS.
     `'rue'` écarte les communes, parce que le code postal d'une commune est
     le plus petit de cette commune (Paris → 75001) et qu'il finirait sur
     une facture. Mais `'address'` DOIT les garder : l'écran SOS envoie les
     coordonnées de la suggestion choisie directement à la recherche
     d'artisans disponibles, et ce chemin n'appelle pas `completerLieu()`.
     Les lui retirer aurait laissé quelqu'un taper sa ville sans aucune
     suggestion, donc sans coordonnées, donc sans artisan — à minuit. */
  const enAdresse = await chercher('charleval', { type: 'address' });
  const enRue = await chercher('charleval', { type: 'rue' });

  const sosOk = enAdresse.some((l) => l.genre === 'municipality');
  if (!sosOk) echecs += 1;
  console.log(`${sosOk ? '  OK  ' : 'ECHEC '} le SOS garde les communes — `
    + `${enAdresse.length} suggestion(s), genres : ${[...new Set(enAdresse.map((l) => l.genre))].join(', ') || 'aucun'}`);

  const rueOk = enRue.length > 0 && enRue.every(estUneAdresse);
  if (!rueOk) echecs += 1;
  console.log(`${rueOk ? '  OK  ' : 'ECHEC '} une ligne d’adresse n’offre qu’un numéro ou une rue — `
    + `${enRue.length} suggestion(s), genres : ${[...new Set(enRue.map((l) => l.genre))].join(', ') || 'aucun'}`);

  /* Un repli qui ne secourt rien est pire que pas de repli : `estUneAdresse`
     doit tenir devant ce qu'on ne lui a pas promis. */
  const robuste = estUneAdresse(null) === false && estUneAdresse(undefined) === false
    && estUneAdresse({}) === false;
  if (!robuste) echecs += 1;
  console.log(`${robuste ? '  OK  ' : 'ECHEC '} …et rien d’autre n’est pris pour une adresse`);
}

/* ==========================================================================
   LE CODE INSEE DÉPARTAGE — 15/10/2026 (lot SIRET)
   --------------------------------------------------------------------------
   L'inscription professionnelle préremplit la ville depuis le répertoire
   Sirene, qui donne le CODE INSEE de la commune. `completerLieu` s'en sert :
   il demande à l'API de filtrer sur ce code (`citycode`), et n'accepte
   qu'un résultat qui le porte.

   DEUX FAÇONS DE L'ÉPROUVER, et il faut les deux — la leçon déjà écrite
   plus haut pour `formater` :
     - une réponse SIMULÉE, hors réseau, qui place le BON résultat en
       SECOND : un code qui prendrait `resultats[0]` serait attrapé, et ça
       tourne même quand le mandataire coupe la connexion ;
     - l'appel RÉEL, qui attrape un paramètre que l'API refuserait. C'est
       exactement la panne du `type=address` : HTTP 400, aucune suggestion,
       aucun message — et un test simulé n'y voyait que du feu.
   ========================================================================== */
{
  const vraiFetch = globalThis.fetch;
  const appels = [];
  const commune = (nom, citycode, postcode, lon, lat) => ({
    properties: { type: 'municipality', name: nom, city: nom, citycode, postcode, label: nom },
    geometry: { type: 'Point', coordinates: [lon, lat] },
  });
  /* Deux « Sainte-Marie » dans le même département : le seul départage
     possible est le code INSEE. Le bon résultat est rangé EN SECOND. */
  const REPONSES = {
    avecCode: [commune('Sainte-Marie', '97418', '97438', 55.548, -20.896),
      commune('Sainte-Marie', '97419', '97438', 55.501, -20.912)],
    sansCode: [commune('Lambesc', '13050', '13410', 5.258868, 43.648937)],
  };
  globalThis.fetch = async (url) => {
    appels.push(String(url));
    const u = new URL(String(url));
    const liste = u.searchParams.get('citycode') ? REPONSES.avecCode : REPONSES.sansCode;
    return { ok: true, status: 200, json: async () => ({ features: liste }) };
  };
  try {
    const lieu = await completerLieu({ affichage: 'Sainte-Marie (974)', codeInsee: '97419' });
    const ok1 = appels.length === 1 && /[?&]citycode=97419(&|$)/.test(appels[0]);
    if (!ok1) echecs += 1;
    console.log(`${ok1 ? '  OK  ' : 'ECHEC '} le code INSEE part en filtre (citycode) — ${appels[0] || 'aucun appel'}`);

    const ok2 = lieu.codeInsee === '97419' && lieu.longitude === 55.501;
    if (!ok2) echecs += 1;
    console.log(`${ok2 ? '  OK  ' : 'ECHEC '} …et c'est le résultat qui PORTE ce code qui est retenu, pas le premier`
      + ` — ${lieu.codeInsee} / ${lieu.longitude}`);

    appels.length = 0;
    const sans = await completerLieu({ affichage: 'Lambesc (13)' });
    const ok3 = appels.length === 1 && !/citycode=/.test(appels[0]) && sans.latitude === 43.648937;
    if (!ok3) echecs += 1;
    console.log(`${ok3 ? '  OK  ' : 'ECHEC '} sans code INSEE, la règle du département reste celle d'avant`);

    appels.length = 0;
    const deja = await completerLieu({ affichage: 'Lambesc (13)', codeInsee: '13050', latitude: 1, longitude: 2 });
    const ok4 = appels.length === 0 && deja.latitude === 1;
    if (!ok4) echecs += 1;
    console.log(`${ok4 ? '  OK  ' : 'ECHEC '} un lieu qui a déjà ses coordonnées n'est pas retouché`);

    appels.length = 0;
    const faux = await completerLieu({ affichage: 'Lambesc (13)', codeInsee: '2C999' });
    const ok5 = appels.length === 1 && !/citycode=/.test(appels[0]);
    if (!ok5) echecs += 1;
    console.log(`${ok5 ? '  OK  ' : 'ECHEC '} un code qui n'en est pas un n'est jamais envoyé — ${faux.latitude}`);
  } finally {
    globalThis.fetch = vraiFetch;
  }

  /* L'APPEL RÉEL. Lambesc a le code INSEE 13050 (et le code postal 13410 :
     les deux ne se confondent pas, c'est tout le piège). */
  const reel = await completerLieu({ affichage: 'Lambesc (13)', codeInsee: '13050' });
  const okReel = reel.codeInsee === '13050'
    && typeof reel.latitude === 'number' && Math.abs(reel.latitude - 43.65) < 0.1;
  if (!okReel) echecs += 1;
  console.log(`${okReel ? '  OK  ' : 'ECHEC '} l'API accepte le filtre, pour de vrai — `
    + `${reel.codeInsee || '?'} ${reel.latitude ?? 'sans coordonnées'} / ${reel.longitude ?? ''}`);
}

console.log(echecs === 0 ? '\nTout est bon.' : `\n${echecs} vérification(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
