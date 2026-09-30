/**
 * La carte de la zone d'intervention — vérifier les calculs, pas l'image.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Une carte fausse ne se voit pas. Un cercle de 30 km dessiné à la taille
 * d'un cercle de 20 km reste un joli rond : rien ne signale l'erreur, et
 * l'artisan annonce une zone qu'il ne couvre pas.
 *
 * Trois pièges y sont piégés :
 *
 * 1. **Le cosinus de la latitude.** La projection Web Mercator étire les
 *    distances vers les pôles. Sans lui, un rayon serait juste à
 *    l'équateur et faux partout en France — et d'autant plus faux qu'on
 *    monte vers Lille.
 * 2. **L'arrondi du zoom.** Vers le haut, le cercle déborde du cadre une
 *    fois sur deux. Vers le bas, il rentre toujours.
 * 3. **Le verrou de zoom.** `ZOOM_MAX` protège l'adresse du domicile : une
 *    carte qu'on peut agrandir finit par montrer la rue. Si quelqu'un le
 *    relève un jour sans y penser, ce contrôle le dira.
 *
 * node scripts/verifier-carte.mjs
 */
import {
  metresParPixel, zoomPour, tuileX, tuileY, grilleTuiles, diametrePx,
  urlTuile, TAILLE_TUILE, ZOOM_MIN, ZOOM_MAX,
} from '../src/lib/tuiles.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Quelques villes, pour avoir de vraies latitudes françaises. */
const LYON = { lat: 45.7578, lon: 4.8320 };
const LILLE = { lat: 50.6292, lon: 3.0573 };
const AJACCIO = { lat: 41.9192, lon: 8.7386 };

console.log('\nLe cosinus de la latitude — le piège invisible');
{
  const aLyon = metresParPixel(LYON.lat, 10);
  const aLille = metresParPixel(LILLE.lat, 10);
  const aLEquateur = metresParPixel(0, 10);
  verifier('un pixel vaut MOINS de mètres à Lille qu’à Lyon',
    aLille < aLyon, `Lille ${aLille.toFixed(2)} / Lyon ${aLyon.toFixed(2)}`);
  verifier('… et moins à Lyon qu’à l’équateur',
    aLyon < aLEquateur, `Lyon ${aLyon.toFixed(2)} / équateur ${aLEquateur.toFixed(2)}`);
  /* Valeur de référence connue : 152,87 m/px au niveau 10, à l'équateur. */
  verifier('au niveau 10, à l’équateur : environ 152,9 m par pixel',
    Math.abs(aLEquateur - 152.87) < 0.1, aLEquateur.toFixed(3));
  verifier('chaque niveau de zoom divise la distance par deux',
    Math.abs(metresParPixel(LYON.lat, 11) * 2 - aLyon) < 1e-9);
}

console.log('\nLe cercle rentre dans le cadre — à toutes les tailles');
{
  const largeur = 350;
  /* Le rayon minimum et le rayon maximum acceptés par la base
     (contrainte pro_zone_km_check : de 1 à 300 km). */
  for (const rayon of [1, 5, 10, 20, 30, 50, 100, 200, 300]) {
    const z = zoomPour(LYON.lat, rayon, largeur);
    const d = diametrePx(LYON.lat, rayon, z);
    verifier(`${rayon} km : le cercle (${Math.round(d)} px) tient dans ${largeur} px`,
      d <= largeur, `zoom ${z}, diamètre ${d.toFixed(0)} px`);
  }
}

console.log('\n… y compris à Lille et en Corse');
{
  for (const { nom, ville } of [{ nom: 'Lille', ville: LILLE }, { nom: 'Ajaccio', ville: AJACCIO }]) {
    let pire = 0;
    for (const rayon of [1, 15, 30, 80, 300]) {
      const z = zoomPour(ville.lat, rayon, 350);
      pire = Math.max(pire, diametrePx(ville.lat, rayon, z));
    }
    verifier(`${nom} : le plus gros cercle fait ${Math.round(pire)} px sur 350`,
      pire <= 350, `${pire.toFixed(0)} px`);
  }
}

console.log('\nLe verrou de zoom — ce qui protège l’adresse du domicile');
{
  verifier('le zoom ne dépasse JAMAIS 12',
    [0.5, 1, 2, 3].every((r) => zoomPour(LYON.lat, r, 350) <= ZOOM_MAX));
  verifier('… et ne descend jamais sous 4',
    zoomPour(LYON.lat, 5000, 350) >= ZOOM_MIN);
  /* À 12, une tuile couvre encore plusieurs kilomètres : on voit les
     villages, pas les rues nommées. C'est ce chiffre qu'il faut regarder
     si quelqu'un veut un jour relever ZOOM_MAX. */
  const couverture = (metresParPixel(LYON.lat, ZOOM_MAX) * TAILLE_TUILE) / 1000;
  verifier(`une tuile couvre encore ${couverture.toFixed(1)} km au zoom maximum`,
    couverture > 5, `${couverture.toFixed(2)} km`);
}

console.log('\nLe centre tombe bien AU MILIEU du cadre');
{
  const largeur = 350;
  const hauteur = 180;
  const zoom = 10;
  const tuiles = grilleTuiles({
    latitude: LYON.lat, longitude: LYON.lon, zoom, largeur, hauteur,
  });
  verifier('des tuiles sont produites', tuiles.length > 0, `${tuiles.length}`);

  /* Où se trouve le centre géographique dans le cadre ? On refait le
     calcul à l'envers depuis la première tuile posée. */
  const centreX = tuileX(LYON.lon, zoom) * TAILLE_TUILE;
  const centreY = tuileY(LYON.lat, zoom) * TAILLE_TUILE;
  const premiere = tuiles[0];
  const [, tx, ty] = premiere.cle.split('-').map(Number);
  const origineX = tx * TAILLE_TUILE - premiere.left;
  const origineY = ty * TAILLE_TUILE - premiere.top;
  verifier('le centre est à mi-largeur',
    Math.abs((centreX - origineX) - largeur / 2) < 0.001,
    (centreX - origineX).toFixed(2));
  verifier('le centre est à mi-hauteur',
    Math.abs((centreY - origineY) - hauteur / 2) < 0.001,
    (centreY - origineY).toFixed(2));
}

console.log('\nLe damier couvre tout le cadre, sans trou');
{
  const largeur = 350;
  const hauteur = 180;
  const tuiles = grilleTuiles({
    latitude: LYON.lat, longitude: LYON.lon, zoom: 9, largeur, hauteur,
  });
  const gauche = Math.min(...tuiles.map((t) => t.left));
  const droite = Math.max(...tuiles.map((t) => t.left + TAILLE_TUILE));
  const haut = Math.min(...tuiles.map((t) => t.top));
  const bas = Math.max(...tuiles.map((t) => t.top + TAILLE_TUILE));
  verifier('rien ne manque à gauche ni en haut', gauche <= 0 && haut <= 0,
    `gauche ${gauche.toFixed(1)}, haut ${haut.toFixed(1)}`);
  verifier('rien ne manque à droite ni en bas', droite >= largeur && bas >= hauteur,
    `droite ${droite.toFixed(1)}, bas ${bas.toFixed(1)}`);
  verifier('pas plus de 12 images demandées', tuiles.length <= 12, `${tuiles.length}`);
  verifier('aucune tuile en double',
    new Set(tuiles.map((t) => t.cle)).size === tuiles.length);
}

console.log('\nLes bords du monde ne sont pas demandés');
{
  /* Au zoom 4, le monde fait 16 tuiles de côté. Un point à l'extrême
     ouest ne doit pas faire réclamer la colonne « -1 », qui n'existe pas :
     le serveur répondrait par une erreur et l'écran garderait un trou. */
  const tuiles = grilleTuiles({
    latitude: 0, longitude: -179.9, zoom: 4, largeur: 350, hauteur: 180,
  });
  verifier('aucun numéro de tuile négatif ou hors du monde',
    tuiles.every((t) => {
      const [z, x, y] = t.cle.split('-').map(Number);
      return x >= 0 && y >= 0 && x < 2 ** z && y < 2 ** z;
    }), JSON.stringify(tuiles.map((t) => t.cle)));
}

console.log('\nL’adresse des images');
{
  const url = urlTuile(262, 182, 9);
  verifier('elle part chez la Géoplateforme de l’IGN',
    url.startsWith('https://data.geopf.fr/wmts?'), url.slice(0, 40));
  verifier('elle porte le plan IGN ordinaire',
    url.includes('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'));
  verifier('elle ne porte AUCUNE clé ni jeton',
    !/apikey|api_key|token|key=/i.test(url), url);
  verifier('les trois coordonnées y sont',
    url.includes('TILEMATRIX=9') && url.includes('TILECOL=262') && url.includes('TILEROW=182'));
}

console.log('\nCe qui n’est pas renseigné ne fabrique pas de carte fausse');
{
  verifier('largeur nulle → aucune tuile',
    grilleTuiles({ latitude: 45, longitude: 5, zoom: 9, largeur: 0, hauteur: 180 }).length === 0);
  verifier('rayon nul → on ne descend pas à un zoom absurde',
    zoomPour(LYON.lat, 0, 350) === ZOOM_MAX);
  verifier('rayon négatif → pareil',
    zoomPour(LYON.lat, -10, 350) === ZOOM_MAX);
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La carte dit la vérité.\n');
