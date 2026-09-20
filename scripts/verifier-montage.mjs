/**
 * Vérifie la fabrication des adresses de montage Cloudinary.
 *
 * Ces adresses sont de longues chaînes où l'ordre des morceaux compte : une
 * barre oblique oubliée, et Cloudinary renvoie une erreur au lieu d'une
 * vidéo. Ce script compare la chaîne produite à la chaîne attendue.
 *
 *   node scripts/verifier-montage.mjs
 *
 * Il ne remplace pas l'essai réel : une adresse bien formée peut malgré tout
 * être refusée par le compte. Le vrai contrôle, c'est de l'ouvrir.
 */
process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo-opus';

const { urlMontage, urlVideo, urlVignette } = await import('../src/lib/cloudinary.js');

const B = 'https://res.cloudinary.com/demo-opus/video/upload';
const C = 'c_fill,h_1280,w_720';
let echecs = 0;

function verifier(intitule, obtenu, attendu) {
  const ok = obtenu === attendu;
  if (!ok) echecs += 1;
  console.log(`${ok ? '  ok  ' : ' ECHEC'} ${intitule}`);
  if (!ok) {
    console.log(`        attendu : ${attendu}`);
    console.log(`        obtenu  : ${obtenu}`);
  }
}

// Un seul clip : pas d'assemblage, juste le cadrage.
verifier(
  'un clip seul',
  urlMontage(['opus/u1/a']),
  `${B}/${C}/opus/u1/a.mp4`,
);

// Trois clips : chaque clip suivant est collé avec fl_splice, et les barres
// obliques de son identifiant deviennent des deux-points.
verifier(
  'trois clips collés',
  urlMontage(['opus/u1/a', 'opus/u1/b', 'opus/u1/c']),
  `${B}/${C}`
  + `/fl_splice,l_video:opus:u1:b/${C}/fl_layer_apply`
  + `/fl_splice,l_video:opus:u1:c/${C}/fl_layer_apply`
  + '/opus/u1/a.mp4',
);

// Avec musique : le son des clips est coupé (ac_none) avant la superposition.
verifier(
  'deux clips et une musique',
  urlMontage(['opus/u1/a', 'opus/u1/b'], { musique: 'opus/u1/son' }),
  `${B}/${C}`
  + `/fl_splice,l_video:opus:u1:b/${C}/fl_layer_apply`
  + '/ac_none/l_audio:opus:u1:son/fl_layer_apply'
  + '/opus/u1/a.mp4',
);

verifier('un clip isolé', urlVideo('opus/u1/a'), `${B}/${C}/opus/u1/a.mp4`);
verifier('vignette', urlVignette('opus/u1/a'), `${B}/so_2,${C}/opus/u1/a.jpg`);

// Sans identifiant, pas d'adresse inventée.
verifier('liste vide', urlMontage([]), null);
verifier('identifiant manquant', urlVideo(null), null);

console.log(echecs === 0
  ? '\nToutes les adresses sont conformes.'
  : `\n${echecs} adresse(s) incorrecte(s).`);
process.exit(echecs === 0 ? 0 : 1);
