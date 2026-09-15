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
const { chercher, distanceKm } = await import('../src/lib/adresse.js');

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

console.log(echecs === 0 ? '\nTout est bon.' : `\n${echecs} vérification(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
