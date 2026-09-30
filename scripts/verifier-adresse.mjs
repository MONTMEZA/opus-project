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
const { chercher, distanceKm, libelleDistance } = await import('../src/lib/adresse.js');

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

console.log(echecs === 0 ? '\nTout est bon.' : `\n${echecs} vérification(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
