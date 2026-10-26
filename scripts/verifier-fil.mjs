/**
 * LE FIL CLASSIQUE NE FAIT PAS DE TRAVAIL POUR RIEN EN DÉFILANT.
 *
 * D'OÙ IL VIENT — 15/10/2026
 * --------------------------
 * Le propriétaire, sur son iPhone : « petits blocages » en faisant défiler
 * le fil. Rien n'a été vu sur le téléphone ; tout ce qui suit a été établi
 * dans le source et mesuré au navigateur, sur une copie jetable du projet
 * gonflée à quatre-vingt-dix publications :
 *
 *   1. en REMONTANT, une carte qui renaissait repartait du cadre carré
 *      alors que sa place gardait la hauteur d'un portrait — le contenu
 *      reculait, puis revenait quand la photo répondait ;
 *   2. un carrousel montait ses photos dans des emplacements de 1 pt, que
 *      le téléphone chargeait et redessinait pour rien ;
 *   3. chaque carte qui franchissait le seuil de visibilité redessinait
 *      l'écran, la liste, et la carte elle-même en entier ;
 *   4. deux listes des formats vidéo, identiques, dont une seule aurait
 *      reçu un format ajouté ;
 *   5. avec exactement vingt publications en base, le bas du fil partait
 *      chercher une page VIDE.
 *
 * Rien de tout cela ne lève d'erreur. Une carte qui se redessine pour rien,
 * une page vide qu'on va chercher, une photo chargée deux fois : ça marche,
 * c'est juste plus lent — et ça ne se voit que sur le téléphone. D'où ce
 * contrôle, qui empêche d'y revenir sans le voir.
 *
 * Ce qu'il FAIT TOURNER : la mémoire des cadres et le découpage d'une page,
 * qui vivent dans des fichiers qui n'importent rien. Ce qu'il ne peut que
 * RELIRE : les composants, que `node` ne sait pas ouvrir. La fluidité, elle,
 * ne se juge que sur l'iPhone.
 *
 *   npm run verifier-fil
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* On retire les commentaires avant de lire : un commentaire qui EXPLIQUE un
   défaut contient le texte du défaut. C'est arrivé quatre fois dans ce
   projet (`verifier-listes`, `verifier-imports`, `verifier-retour`,
   `verifier-acces`) — on ne l'attend pas une cinquième. Les commentaires
   JSX `{/* … *\/}` partent avec, puisqu'ils contiennent un bloc. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/** Le corps d'un appel, de la parenthèse ouvrante à sa fermante. */
const corpsDe = (texte, debut) => {
  const ouvre = texte.indexOf('(', debut);
  if (ouvre < 0) return '';
  let profondeur = 0;
  for (let i = ouvre; i < texte.length; i += 1) {
    if (texte[i] === '(') profondeur += 1;
    else if (texte[i] === ')') {
      profondeur -= 1;
      if (profondeur === 0) return texte.slice(ouvre + 1, i);
    }
  }
  return '';
};

/* ================================================================== */
console.log('\n1. Une photo déjà mesurée ne repart pas du carré');
{
  const mod = await import('../src/lib/cadres-connus.js').catch((e) => ({ erreur: e }));
  const { retenirCadre, cadreConnu, CADRES_RETENUS_MAX } = mod;
  const { PLUS_HAUT, PLUS_LARGE } = await import('../src/lib/cadre.js').catch(() => ({}));
  if (!retenirCadre || !cadreConnu) {
    verifier('`cadres-connus.js` s’ouvre sous node', false,
      `${mod.erreur ? mod.erreur.message : 'retenirCadre / cadreConnu absents'} — un fichier `
      + 'qui importe React Native ne peut plus être FAIT TOURNER');
  } else {
    /* Des adresses UNIQUES : la table vit le temps du processus, et un
       essai qui retrouverait l'adresse d'un autre passerait pour la
       mauvaise raison. */
    const n = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adr = (k) => `https://essai.opus.test/${n}/${k}.jpg`;

    verifier('une adresse jamais vue n’a pas de cadre',
      cadreConnu(adr('inconnue')) === null,
      'sinon une carte naîtrait dans le cadre d’une autre photo');

    const rendu = retenirCadre(adr('portrait'), 1600 / 2134);
    verifier('retenir rend le cadre BORNÉ, comme `cadrePhoto`',
      Math.abs(rendu - PLUS_HAUT) < 1e-9, `rendu : ${rendu}`);
    verifier('…et on le relit sous la MÊME adresse',
      cadreConnu(adr('portrait')) === rendu, `relu : ${cadreConnu(adr('portrait'))}`);
    verifier('…et sous celle-là seulement',
      cadreConnu(`${adr('portrait')}?v=2`) === null && cadreConnu(adr('Portrait')) === null,
      'la clé est l’adresse EXACTE : une autre adresse est une autre photo');

    retenirCadre(adr('change'), 0.75);
    retenirCadre(adr('change'), 1.5);
    verifier('une nouvelle mesure remplace l’ancienne',
      cadreConnu(adr('change')) === 1.5,
      '`onLoad` reste la source de vérité : ce qui est retenu n’est qu’un point de départ');

    const absurdes = [0, -1, NaN, undefined, null, '1,5'];
    const rendus = absurdes.map((r, i) => retenirCadre(adr(`absurde-${i}`), r));
    verifier('un rapport absurde rend le carré…',
      rendus.every((r) => r === 1), `rendus : ${rendus.join(', ')}`);
    verifier('…et n’est PAS retenu',
      absurdes.every((_, i) => cadreConnu(adr(`absurde-${i}`)) === null),
      'ce n’est pas une mesure : la retenir ferait naître la carte suivante au carré pour de bon');

    let leve = null;
    try {
      [undefined, null, '', 42, { uri: 'x' }].forEach((cle) => {
        retenirCadre(cle, 0.75);
        if (cadreConnu(cle) !== null) throw new Error(`clé ${String(cle)} retenue`);
      });
    } catch (e) { leve = e; }
    verifier('une clé qui n’est pas une adresse ne casse rien et n’est pas retenue',
      leve === null, leve ? leve.message : '');

    const valeurs = [0.1, 0.5, 0.8, 1, 1.3, 1.6, 3, 1e9].map((r, i) => retenirCadre(adr(`borne-${i}`), r));
    verifier('ce qui est retenu reste entre les deux bornes',
      valeurs.every((v) => v >= PLUS_HAUT - 1e-9 && v <= PLUS_LARGE + 1e-9),
      `valeurs : ${valeurs.join(', ')}`);

    /* LE PLAFOND, et QUI part quand il est atteint. */
    verifier('la table a un plafond raisonnable',
      Number.isInteger(CADRES_RETENUS_MAX) && CADRES_RETENUS_MAX >= 100 && CADRES_RETENUS_MAX <= 5000,
      `CADRES_RETENUS_MAX = ${CADRES_RETENUS_MAX}`);
    if (Number.isInteger(CADRES_RETENUS_MAX)) {
      const m = `${n}-plafond`;
      const a = (k) => `https://essai.opus.test/${m}/${k}.jpg`;
      /* `revue`, puis de quoi remplir la table tout juste : `revue` est
         alors la plus ancienne, et tout ce que les essais du dessus avaient
         posé est parti. */
      retenirCadre(a('revue'), 0.8);
      for (let k = 0; k < CADRES_RETENUS_MAX - 1; k += 1) retenirCadre(a(k), 1);
      /* On la REVOIT : elle doit passer en fin de file, et c'est la
         suivante qui partira à la prochaine photo. */
      retenirCadre(a('revue'), 0.8);
      retenirCadre(a('derniere'), 1.2);
      verifier('au plafond, c’est la plus anciennement vue qui part',
        cadreConnu(a(0)) === null && cadreConnu(a(1)) === 1,
        `a(0) : ${cadreConnu(a(0))}, a(1) : ${cadreConnu(a(1))}`);
      verifier('…pas celle qu’on vient de revoir',
        cadreConnu(a('revue')) === 0.8 && cadreConnu(a('derniere')) === 1.2);
      for (let k = 0; k < 3 * CADRES_RETENUS_MAX; k += 1) retenirCadre(a(`flot-${k}`), 1);
      const encore = Array.from({ length: CADRES_RETENUS_MAX }, (_, k) => a(`flot-${3 * CADRES_RETENUS_MAX - 1 - k}`))
        .filter((x) => cadreConnu(x) !== null).length;
      verifier('…et la table ne dépasse jamais le plafond',
        encore === CADRES_RETENUS_MAX && cadreConnu(a(`flot-${2 * CADRES_RETENUS_MAX - 1}`)) === null,
        `${encore} des ${CADRES_RETENUS_MAX} dernières retrouvées`);
    }
  }

  /* `cadre.js` est IMPORTÉ sous node par `verifier-listes`, et il est « du
     calcul, et rien d'autre ». Une table posée là vivrait le temps d'un
     contrôle et changerait les résultats d'un essai à l'autre. */
  const cadre = sansCommentaires(lire('src/lib/cadre.js'));
  verifier('`cadre.js` reste du calcul : aucune table, aucune variable',
    !/new Map|new Set|\blet\b|\bvar\b|^import /m.test(cadre),
    'la mémoire vit dans `cadres-connus.js`');
  verifier('…et le carré reste le défaut de `cadrePhoto`',
    /if \(!\(rapport > 0\)\) return 1;/.test(cadre),
    'passer le défaut à 0,8 ferait faire le saut INVERSE aux photos carrées et en paysage');

  const memoire = sansCommentaires(lire('src/lib/cadres-connus.js'));
  const imports = memoire.match(/^import [\s\S]*? from '([^']+)';/gm) || [];
  verifier('`cadres-connus.js` n’importe que `cadre.js`',
    imports.length === 1 && /from '\.\/cadre\.js'/.test(imports[0]),
    imports.join(' | '));

  /* LA CLÉ. Le carrousel doit relire et retenir sous LA MÊME adresse — et
     c'est celle de la photo qui donne le cadre. `onRatio` ne transmet que
     le rapport : une fermeture sur la mauvaise adresse rangerait un cadre
     faux, sans aucune erreur. */
  const car = sansCommentaires(lire('src/components/Carrousel.js'));
  const initial = car.match(/useState\(\(\) => cadreConnu\(([^)]+)\) \?\? aspectRatio\)/);
  verifier('le carrousel PART du cadre connu, le carré seulement à défaut',
    !!initial, 'useState(() => cadreConnu(medias[0]) ?? aspectRatio)');
  const debutMesurer = car.indexOf('const mesurer = ');
  const mesurer = debutMesurer >= 0 ? car.slice(debutMesurer, car.indexOf('};', debutMesurer)) : '';
  const retenu = mesurer.match(/retenirCadre\(([^,]+), r\)/);
  const alias = car.match(/const (\w+) = medias\[0\];/);
  const cle = (x) => (alias && x === alias[1] ? 'medias[0]' : x);
  verifier('…et la mesure est retenue avant de poser le cadre',
    !!retenu && mesurer.indexOf('retenirCadre(') < mesurer.indexOf('setCadre('),
    'sans `retenirCadre` dans `mesurer`, la carte remontée repartirait du carré pour toujours');
  verifier('…sous la MÊME clé qu’on relit, et c’est la première photo',
    !!initial && !!retenu && cle(initial[1].trim()) === 'medias[0]' && cle(retenu[1].trim()) === 'medias[0]',
    `relu sous ${initial && initial[1]}, retenu sous ${retenu && retenu[1]}`);
  verifier('…et seule la première photo donne le cadre',
    /media=\{medias\[0\]\}[\s\S]{0,120}onRatio=\{mesurer\}/.test(car)
    && /onRatio=\{i === 0 \? mesurer : undefined\}/.test(car)
    && (car.match(/onRatio=\{/g) || []).length === 2,
    'une autre photo qui appellerait `mesurer` rangerait SA forme sous l’adresse de la première');
}

/* ================================================================== */
console.log('\n2. Un carrousel ne monte pas ses photos dans 1 pt');
{
  const car = sansCommentaires(lire('src/components/Carrousel.js'));
  const boucle = car.slice(car.indexOf('{medias.map((m, i) =>'), car.indexOf('</ScrollView>'));
  verifier('les emplacements gardent leur largeur de repli',
    /style=\{\{ width: largeur \|\| 1, height: '100%' \}\}/.test(boucle),
    'sans largeur, le défilement ne saurait plus où s’arrêter');
  const garde = boucle.slice(0, boucle.indexOf('<Media'));
  verifier('…mais la photo n’y est montée qu’une fois la largeur CONNUE',
    /largeur > 0 &&/.test(garde) && boucle.includes('<Media'),
    'montée dans 1 pt, expo-image la charge et la redessine pour rien, puis recommence à la vraie taille');
  verifier('la largeur vient de `onLayout`, jamais de la fenêtre',
    /onLayout=\{\(e\) => setLargeur\(e\.nativeEvent\.layout\.width\)\}/.test(car)
    && !/useWindowDimensions|Dimensions\.get/.test(car),
    'le carrousel sert aussi dans un chantier et une annonce, qui n’ont pas la largeur de l’écran');
}

/* ================================================================== */
console.log('\n3. Une seule liste des formats vidéo');
{
  const carte = sansCommentaires(lire('src/components/PostCard.js'));
  verifier('`PostCard` n’a plus sa propre liste',
    !/new Set\(\[[^\]]*'video'/.test(carte) && !/EST_VIDEO/.test(carte),
    'deux listes identiques : un format ajouté à une seule ne jouerait jamais dans le fil');
  verifier('…elle lit `FORMATS_VIDEO` de `formats-publication.js`',
    /import \{[^}]*\bFORMATS_VIDEO\b[^}]*\} from '\.\.\/lib\/formats-publication'/.test(carte)
    && /FORMATS_VIDEO\.has\(post\.format\)/.test(carte));
  const accueil = sansCommentaires(lire('src/screens/HomeScreen.js'));
  /* Et nulle part ailleurs. La relecture du 17/10/2026 en a trouvé DEUX
     autres copies identiques — dans le bloc des conseils, et dans le filtre
     du fil, commentée « la même liste ». Une liste recopiée finit par
     diverger : on cherche donc la FORME d'une liste de formats vidéo dans
     tout `src/`, et on n'en tolère qu'une. */
  const copies = [];
  const parcourir = (dossier) => {
    for (const nom of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = `${dossier}/${nom.name}`;
      if (nom.isDirectory()) parcourir(chemin);
      else if (/\.js$/.test(nom.name)
        && /new Set\(\[\s*'(video|montage)'/.test(sansCommentaires(readFileSync(chemin, 'utf8')))) {
        copies.push(chemin.replace(/^.*?\/src\//, 'src/'));
      }
    }
  };
  parcourir(new URL('../src', import.meta.url).pathname);
  verifier('une SEULE liste des formats vidéo dans tout `src/`',
    copies.length === 1 && copies[0] === 'src/lib/formats-publication.js',
    `listes trouvées : ${copies.join(', ') || 'aucune'}`);

  verifier('`HomeScreen` décide quelle carte joue avec la MÊME liste',
    /import \{[^}]*\bFORMATS_VIDEO\b[^}]*\} from '\.\.\/lib\/formats-publication'/.test(accueil)
    && /FORMATS_VIDEO\.has\(v\.item\.format\)/.test(accueil)
    && !/new Set\(\[[^\]]*'video'/.test(accueil));
}

/* ================================================================== */
console.log('\n4. Faire défiler des photos ne redessine pas le fil');
{
  const accueil = sansCommentaires(lire('src/screens/HomeScreen.js'));
  const debut = accueil.indexOf('const surVisibilite = useRef(');
  const rappel = debut >= 0 ? corpsDe(accueil, debut + 'const surVisibilite = useRef'.length) : '';
  verifier('le rappel de visibilité existe, et il reste FIGÉ',
    !!rappel && /onViewableItemsChanged=\{surVisibilite\.current\}/.test(accueil),
    'une `FlatList` refuse qu’on change `onViewableItemsChanged` en cours de route');

  const etats = rappel.match(/\bset[A-Z]\w*\(/g) || [];
  verifier('le rappel ne pose qu’UN état : les vidéos à l’écran',
    etats.length === 1 && etats[0] === 'setVideosVisibles(',
    `états posés : ${etats.join(', ') || 'aucun'} — l’ensemble complet redessinait l’écran à chaque seuil franchi`);
  verifier('…et seulement quand leur clé CHANGE',
    /if \(cle === cleVideos\.current\) return;\s*cleVideos\.current = cle;\s*setVideosVisibles\(/.test(rappel),
    'un nouvel ensemble est un nouvel objet pour React : sans la clé, il redessinerait à chaque fois');
  /* La CHAÎNE entière, et pas seulement la présence du filtre : une clé ou
     un état calculés sur TOUTES les cartes laissaient le filtre en place, et
     ce contrôle passait au vert pendant que le fil redevenait aussi lent
     qu'avant (deux sabotages passés, relecture du 17/10/2026). */
  verifier('…et cet ensemble ne contient que des VIDÉOS, de la liste à l’état',
    /const videos = viewableItems\s*\.filter\(\(v\) => FORMATS_VIDEO\.has\(v\.item\.format\)\)\s*\.map\(\(v\) => v\.item\.id\);/.test(rappel)
    && /const cle = videos\.join\('\|'\);/.test(rappel)
    && /setVideosVisibles\(new Set\(videos\)\)/.test(rappel),
    'la clé et l’état doivent DÉRIVER de la liste des vidéos, pas de toutes les cartes');
  verifier('`actif` ne dépend que des vidéos à l’écran',
    /actif=\{videosVisibles\.has\(p\.id\)\}/.test(accueil) && !/\bsetVisibles\b/.test(accueil),
    '`actif` ne sert qu’à une vidéo ; sur une photo, il faisait céder la mémorisation de la carte');

  /* LES VUES (section 35) — c'est ici que le risque est, et il est
     SILENCIEUX : un rappel qui ne signale plus rien arrête le compteur sans
     une erreur. Le signal doit partir AVANT la sortie anticipée, sinon il
     ne partirait que lorsque les vidéos à l'écran changent, c'est-à-dire
     presque jamais. */
  const signal = rappel.indexOf('signalerCeQuiEstAffiche.current()');
  const sortie = rappel.search(/\breturn\b/);
  verifier('le rappel signale ce qui est à l’écran, À CHAQUE changement',
    signal >= 0 && (sortie < 0 || signal < sortie),
    'placé après le `return`, le compteur de vues s’arrêterait en silence');
  verifier('…et l’ensemble complet vit dans une référence',
    /visibles\.current = new Set\(viewableItems\.map\(\(v\) => v\.item\.id\)\);/.test(rappel)
    && rappel.indexOf('visibles.current =') < signal);

  const fn = accueil.indexOf('const signalerCeQuiEstAffiche = useRef(');
  const corps = fn >= 0 ? corpsDe(accueil, fn + 'const signalerCeQuiEstAffiche = useRef'.length) : '';
  verifier('une seule écriture de « ce qui peut compter une vue »',
    /signalerVues\(vuesPossibles\(posts\.filter\(\(p\) => visibles\.current\.has\(p\.id\)\), moiId\)\)/.test(corps)
    && /= lecture\.current;/.test(corps)
    && (accueil.match(/vuesPossibles\(posts\.filter/g) || []).length === 1,
    'le rappel et l’effet passent par la même fonction');
  verifier('…qui se tait dans le fil Vidéos, comme avant',
    /if \(feedMode === 'video'\) return;/.test(corps),
    'le fil vidéo a sa propre règle : la diapositive à l’écran');

  /* La référence que lit le rappel est écrite dans un EFFET, jamais pendant
     le rendu — et cet effet RESIGNALE quand la liste change sous un écran
     immobile. */
  const ecritures = accueil.match(/lecture\.current = /g) || [];
  const effet = accueil.match(/useEffect\(\(\) => \{\s*lecture\.current = \{[\s\S]*?\};\s*signalerCeQuiEstAffiche\.current\(\);\s*\}, \[([^\]]*)\]\);/);
  const deps = effet ? effet[1].split(',').map((x) => x.trim()) : [];
  verifier('la référence s’écrit dans un effet, et nulle part ailleurs',
    ecritures.length === 1 && !!effet,
    'écrite pendant le rendu, le linter de React la refuse — et deux rendus laisseraient deux valeurs');
  verifier('…qui resignale quand la liste, le compte ou le mode changent',
    ['posts', 'moiId', 'feedMode'].every((d) => deps.includes(d)),
    `dépendances : ${deps.join(', ')} — une page qui arrive sous un écran immobile doit pouvoir compter`);
}

/* ================================================================== */
console.log('\n5. Le bas du fil ne va pas chercher une page vide');
{
  const { decouperPage, finDemo } = await import('../src/lib/page-fil.js').catch(() => ({}));
  if (!decouperPage || !finDemo) {
    verifier('`page-fil.js` s’ouvre sous node', false, 'src/lib/page-fil.js');
  } else {
    const L = (k) => Array.from({ length: k }, (_, i) => ({ id: i }));
    const cas = [
      [21, 20, false], [20, 20, true], [19, 19, true], [0, 0, true], [25, 20, false],
    ];
    cas.forEach(([recues, gardees, fin]) => {
      const r = decouperPage(L(recues), 20);
      verifier(`${recues} lignes reçues → ${gardees} gardées, ${fin ? 'c’est la fin' : 'il y a une suite'}`,
        r.lignes.length === gardees && r.fin === fin
        && r.lignes.every((x, i) => x.id === i),
        JSON.stringify({ gardees: r.lignes.length, fin: r.fin }));
    });
    const vide = decouperPage(null, 20);
    verifier('une réponse absente est la fin, sans planter',
      Array.isArray(vide.lignes) && vide.lignes.length === 0 && vide.fin === true);

    /* L'ÉGALITÉ D'HEURE à la jonction. La page suivante demande « plus
       ancien que la dernière gardée » : une ligne à la même heure n'y
       arriverait jamais. On REJOUE la pagination entière, comme le ferait
       `fil_filtre`, et on compte ce qui arrive à l'écran. */
    const filtre = (toutes, avant, n) => toutes
      .filter((l) => avant == null || l.created_at < avant).slice(0, n);
    const parcourir = (toutes) => {
      const vu = [];
      let avant = null;
      for (let tour = 0; tour < 20; tour += 1) {
        const r = decouperPage(filtre(toutes, avant, 21), 20);
        const connus = new Set(vu.map((l) => l.id));
        vu.push(...r.lignes.filter((l) => !connus.has(l.id)));
        if (r.fin || r.lignes.length === 0) break;
        avant = r.lignes[r.lignes.length - 1].created_at;
      }
      return vu;
    };
    const heure = (k) => `2026-10-17T12:00:${String(59 - k).padStart(2, '0')}+00:00`;
    const egalite = Array.from({ length: 23 }, (_, k) => ({
      id: k, created_at: heure(k === 20 ? 19 : k),   // rangs 20 et 21 à la même heure
    }));
    const vus = parcourir(egalite);
    verifier('deux publications à la même heure, à cheval sur deux pages : aucune ne se perd',
      vus.length === 23 && new Set(vus.map((l) => l.id)).size === 23,
      `${vus.length} affichées sur 23`);
    const premiere = decouperPage(filtre(egalite, null, 21), 20);
    verifier('…parce que la page ne coupe JAMAIS un groupe à égalité',
      premiere.lignes.length === 19 && premiere.fin === false,
      JSON.stringify({ gardees: premiere.lignes.length, fin: premiere.fin }));
    const memeHeure = Array.from({ length: 21 }, (_, k) => ({ id: k, created_at: heure(0) }));
    verifier('…sauf une page ENTIÈRE à la même heure, gardée plutôt que vidée',
      decouperPage(memeHeure, 20).lignes.length === 20);
    const distinctes = Array.from({ length: 41 }, (_, k) => ({ id: k, created_at: heure(k) }));
    verifier('41 publications à des heures distinctes : toutes, en trois pages, sans page vide',
      parcourir(distinctes).length === 41);

    [[0, 0, true], [0, 19, true], [0, 20, true], [0, 21, false],
      [20, 40, true], [20, 41, false]].forEach(([depart, total, fin]) => {
      verifier(`démonstration : depuis ${depart}, ${total} publications → ${fin ? 'fin' : 'suite'}`,
        finDemo(depart, 20, total) === fin);
    });
  }

  const api = sansCommentaires(lire('src/lib/api.js'));
  const taille = Number((api.match(/export const TAILLE_PAGE_FIL = (\d+);/) || [])[1]);
  const appels = [];
  let i = api.indexOf("rpc('fil_filtre'");
  while (i >= 0) { appels.push(corpsDe(api, i)); i = api.indexOf("rpc('fil_filtre'", i + 1); }
  verifier('les DEUX portes du fil demandent une ligne de plus que la page',
    appels.length === 2 && appels.every((a) => /p_limite: TAILLE_PAGE_FIL \+ 1\b/.test(a)),
    `${appels.length} appel(s) à fil_filtre — le chargement et la page suivante doivent répondre pareil`);
  verifier('…et en déduisent la fin par la ligne de trop',
    (api.match(/decouperPage\([^,]+, TAILLE_PAGE_FIL\)/g) || []).length === 2
    && !/< TAILLE_PAGE_FIL\b/.test(api),
    '« moins de vingt » répond non quand il y en a exactement vingt');
  verifier('la démonstration répond par `finDemo`, aux DEUX endroits, et nulle part autrement',
    (api.match(/finDemo\(\w+, TAILLE_PAGE_FIL, [\w.]+\)/g) || []).length === 2
    && !/[<>]=? *TAILLE_PAGE_FIL\b|TAILLE_PAGE_FIL *[<>]=?/.test(api.replace(/TAILLE_PAGE_FIL \+ 1/g, '')),
    'deux formules de fin finiraient par répondre différemment');
  /* Une PUBLICITÉ a un curseur : sans lui, une page qui finit sur elle fait
     croire au bout du fil (relevé sur la vraie base le 17/10/2026). */
  const pub = api.slice(api.indexOf('if (p.is_ad) {'), api.indexOf('if (p.is_ad) {') + 400);
  verifier('une publicité porte un curseur, comme une publication',
    /curseur: p\.created_at/.test(pub),
    'sans lui, `chargerPlusDeFil` pose « fin » dès qu’une page se termine sur une publicité');

  /* `fil_filtre()` doit pouvoir rendre cette ligne de trop. Si un jour la
     page passe à cinquante, le plafond de la base la mangerait sans un
     mot, et `fin` redeviendrait faux. */
  const schema = lire('supabase/schema.sql');
  const debutFn = schema.indexOf('create or replace function public.fil_filtre(');
  const finFn = schema.indexOf('$$;', debutFn);
  const plafond = Number(((debutFn >= 0 ? schema.slice(debutFn, finFn) : '')
    .match(/limit least\(coalesce\(p_limite, \d+\), (\d+)\)/) || [])[1]);
  verifier(`la base laisse passer ${taille + 1} lignes (plafond : ${plafond})`,
    Number.isInteger(taille) && Number.isInteger(plafond) && plafond >= taille + 1,
    'au-delà du plafond, la ligne de trop n’arrive jamais, et le fil se croit fini');

  const app = sansCommentaires(lire('src/OpusApp.js'));
  const debutPlus = app.indexOf('const chargerPlusDeFil = async');
  const plus = debutPlus >= 0 ? app.slice(debutPlus, app.indexOf('\n  };', debutPlus)) : '';
  verifier('une page qui n’apporte rien laisse la liste telle quelle',
    /return neuves\.length \? \[\.\.\.ps, \.\.\.neuves\] : ps;/.test(plus),
    'une copie de la même liste redessine chaque carte montée, en bas du fil, pour rien');
  verifier('…et « Chargement… » dépend toujours de `chargePage`',
    /setChargePage\(true\)/.test(plus) && /setChargePage\(false\)/.test(plus)
    && /chargement=\{chargePage\}/.test(sansCommentaires(lire('src/screens/HomeScreen.js'))),
    'un verrou en référence ferait taire le pied du fil pendant qu’une page arrive');
}

/* ================================================================== */
/* LES SACCADES PENDANT L'ÉLAN — 17/10/2026                           */
/* Le build « preview » (la vraie vitesse) les a confirmées sur        */
/* l'iPhone 16 : le doigt posé ne saccade pas, l'élan si. Cause lue    */
/* dans le code natif : chaque carte montée PENDANT l'élan fait du     */
/* travail lourd sur le fil principal (réduction de photos, lecteur    */
/* vidéo), et la liste en montait trop, par paquets, et à contresens.  */
/* ================================================================== */

/** Tous les fichiers JavaScript de `src/`. */
const fichiersSrc = (dossier = 'src') => readdirSync(dossier).flatMap((n) => {
  const chemin = path.join(dossier, n);
  if (statSync(chemin).isDirectory()) return fichiersSrc(chemin);
  return chemin.endsWith('.js') ? [chemin] : [];
});

/** La balise ouvrante d'un élément JSX, accolades équilibrées. */
const baliseOuvrante = (texte, debut) => {
  let profondeur = 0;
  for (let i = debut; i < texte.length; i += 1) {
    const c = texte[i];
    if (c === '{') profondeur += 1;
    else if (c === '}') profondeur -= 1;
    else if (c === '>' && profondeur === 0 && texte[i - 1] !== '=') return texte.slice(debut, i + 1);
  }
  return '';
};

/** L'expression entre accolades qui suit `attribut=`. */
const valeurAttribut = (balise, attribut) => {
  const i = balise.search(new RegExp(`\\b${attribut}=\\{`));
  if (i < 0) return null;
  const ouvre = balise.indexOf('{', i);
  let profondeur = 0;
  for (let j = ouvre; j < balise.length; j += 1) {
    if (balise[j] === '{') profondeur += 1;
    else if (balise[j] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return balise.slice(ouvre + 1, j);
    }
  }
  return null;
};

/** Le corps `{ … }` d'un style nommé dans le `StyleSheet.create` du fichier. */
const styleNomme = (texte, nom) => {
  const debut = texte.search(new RegExp(`\\n\\s*${nom}:\\s*\\{`));
  if (debut < 0) return null;
  const ouvre = texte.indexOf('{', debut);
  let profondeur = 0;
  for (let j = ouvre; j < texte.length; j += 1) {
    if (texte[j] === '{') profondeur += 1;
    else if (texte[j] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return texte.slice(ouvre, j + 1);
    }
  }
  return null;
};

console.log('\n6. Les cartes du fil sont contiguës, et la liste avance d’une carte à la fois');
{
  /* 6a. Un `gap` dans le conteneur d'une liste laisse des TROUS entre les
     cellules mesurées, et le fenêtrage de React Native tombe dedans : il
     monte alors des cartes déjà dépassées, à contresens de l'élan. Pour
     TOUTES les listes du projet, pas seulement le fil. */
  let listes = 0;
  const fautifs = [];
  const aveugles = [];
  for (const f of fichiersSrc()) {
    const texte = sansCommentaires(lire(f));
    const re = /<(FlatList|SectionList|VirtualizedList)\b/g;
    let m;
    while ((m = re.exec(texte))) {
      const balise = baliseOuvrante(texte, m.index);
      const expr = valeurAttribut(balise, 'contentContainerStyle');
      if (expr == null) continue;
      listes += 1;
      const morceaux = [];
      const refs = [...expr.matchAll(/\b(?:s|styles)\.(\w+)/g)].map((r) => r[1]);
      for (const nom of refs) {
        const corps = styleNomme(texte, nom);
        if (corps == null) aveugles.push(`${f} : style « ${nom} » introuvable`);
        else morceaux.push(corps);
      }
      morceaux.push(expr.replace(/\b(?:s|styles)\.\w+/g, ''));
      if (!refs.length && !/\{/.test(expr)) aveugles.push(`${f} : contentContainerStyle={${expr.trim()}} non résolu`);
      if (morceaux.some((c) => /\b(gap|rowGap|columnGap)\s*:/.test(c))) fautifs.push(f);
    }
  }
  verifier(`des listes à contenu stylé ont été trouvées (${listes})`, listes >= 2,
    'aucune liste trouvée : le contrôle est devenu aveugle, il ne vérifie plus rien');
  verifier('…et toutes leurs styles ont été RÉSOLUS', aveugles.length === 0,
    `${aveugles.join(' ; ')} — un contrôle qui ne trouve pas sa cible ne passe jamais au vert.`);
  verifier('aucune n’espace ses cellules par un `gap` (le séparateur va DANS la cellule)',
    fautifs.length === 0, `trouvé dans : ${fautifs.join(', ')}`);

  /* 6b. Le séparateur du fil : déclaré au niveau du module, jamais en
     fonction fléchée — un type neuf à chaque rendu remonterait tout. */
  const home = sansCommentaires(lire('src/screens/HomeScreen.js'));
  /* La liste du fil CLASSIQUE se reconnaît à son pied, `BasDuFil`, qui
     n'appartient qu'à elle — pas à son style, qu'on doit pouvoir changer
     sans que tout ce qui suit perde sa cible. */
  const iClassique = home.indexOf('<BasDuFil');
  const debutListe = iClassique >= 0 ? home.lastIndexOf('<FlatList', iClassique) : -1;
  const balise = debutListe >= 0 ? baliseOuvrante(home, debutListe) : '';
  verifier('le fil classique a un séparateur `Intervalle`',
    /ItemSeparatorComponent=\{Intervalle\}/.test(balise));
  verifier('…déclaré au niveau du module', /^function Intervalle\(\)/m.test(home));
  verifier('…qui porte les 10 pt d’avant', /intervalle:\s*\{\s*height:\s*S\.md - 2\s*\}/.test(home));
  /* TOUTES les listes du projet : un séparateur écrit en fonction fléchée
     est un TYPE de composant neuf à chaque rendu, et React démonte puis
     remonte tous les séparateurs. Cinq listes le faisaient encore jusqu'au
     17/10 (Place des pros, Demandes, Clients, Chantier, réponses aux
     annonces). Et le nom passé doit être une fonction du MODULE : un nom
     déclaré dans le composant serait le même défaut sous un autre habit. */
  const flechees = [];
  const nonModule = [];
  let separateurs = 0;
  for (const f of fichiersSrc()) {
    const texte = sansCommentaires(lire(f));
    for (const m of texte.matchAll(/ItemSeparatorComponent=\{([^}]*)\}/g)) {
      separateurs += 1;
      const expr = m[1].trim();
      if (!/^[A-Z]\w*$/.test(expr)) { flechees.push(`${f} : ${expr.slice(0, 30)}`); continue; }
      if (!new RegExp(`^function ${expr}\\(`, 'm').test(texte)) nonModule.push(`${f} : ${expr}`);
    }
  }
  verifier(`des séparateurs de liste ont été trouvés (${separateurs})`, separateurs >= 7,
    'moins de sept : le contrôle a perdu sa cible, il ne vérifie plus rien');
  verifier('aucun n’est écrit en fonction fléchée', flechees.length === 0,
    `trouvé dans : ${flechees.join(' ; ')}`);
  verifier('…et chacun est une fonction déclarée au niveau du MODULE', nonModule.length === 0,
    `trouvé dans : ${nonModule.join(' ; ')}`);
  verifier('…et le bord sous l’en-tête et au-dessus du pied est reproduit',
    /ListHeaderComponentStyle=\{s\.enteteListe\}/.test(balise) && /ListFooterComponentStyle=\{s\.piedListe\}/.test(balise));

  /* 6d. Les réglages exacts. */
  const reglage = (nom) => (balise.match(new RegExp(`\\b${nom}=\\{([^}]*)\\}`)) || [])[1];
  verifier('deux cartes au premier affichage', reglage('initialNumToRender') === '2');
  verifier('UNE carte par montage (`maxToRenderPerBatch={1}`)', reglage('maxToRenderPerBatch') === '1',
    'trois cartes dans le même montage, c’est trois fois le travail dans la même image : l’élan saccade.');
  verifier('…toutes les 50 ms', reglage('updateCellsBatchingPeriod') === '50');
  verifier('`windowSize` reste à 5', reglage('windowSize') === '5',
    'chaque photo du fil garde son image ENTIÈRE (pleineResolution) : une fenêtre plus large en tiendrait davantage en mémoire, sans réduire les montages d’un fil long.');
  verifier('`removeClippedSubviews` écrit FAUX en toutes lettres', reglage('removeClippedSubviews') === 'false');

  /* 6c. FAIRE TOURNER le vrai fenêtrage de React Native, transpilé en
     mémoire depuis node_modules, sur vingt cartes aux hauteurs de la vraie
     base. Deux exigences pendant un balayage aller-retour : jamais plus de
     cartes neuves par pas que `maxToRenderPerBatch`, et jamais une carte
     DÉJÀ DÉPASSÉE remontée à contresens de l'élan. Et l'auto-épreuve : le
     même balayage avec un trou de 10 pt DOIT voir le défaut. */
  let lance = false;
  try {
    const req = createRequire(path.resolve('package.json'));
    const babel = req('@babel/core');
    const NM = path.resolve('node_modules');
    const drapeau = (/fixVirtualizeListCollapseWindowSize: Getter<boolean> = createJavaScriptFlagGetter\('fixVirtualizeListCollapseWindowSize', (true|false)\)/
      .exec(lire(`${NM}/react-native/src/private/featureflags/ReactNativeFeatureFlags.js`)) || [])[1];
    if (drapeau == null) throw new Error('drapeau fixVirtualizeListCollapseWindowSize introuvable');
    const greffons = ['babel-plugin-syntax-hermes-parser', '@babel/plugin-transform-flow-strip-types',
      '@babel/plugin-transform-modules-commonjs'].map((g) => req.resolve(g));
    const modules = {};
    const charger = (nom) => {
      if (modules[nom]) return modules[nom].exports;
      const { code } = babel.transformSync(
        lire(`${NM}/@react-native/virtualized-lists/Lists/${nom}.js`),
        { filename: `${nom}.js`, babelrc: false, configFile: false, plugins: greffons },
      );
      const module = { exports: {} };
      modules[nom] = module;
      const exiger = (q) => {
        if (q === 'react-native/src/private/featureflags/ReactNativeFeatureFlags') {
          return { fixVirtualizeListCollapseWindowSize: () => drapeau === 'true' };
        }
        if (q === 'invariant') return req('invariant');
        if (q.startsWith('./')) return charger(q.slice(2));
        throw new Error(`module inattendu : ${q}`);
      };
      new Function('exports', 'require', 'module', code)(module.exports, exiger, module);
      return module.exports;
    };
    const { computeWindowedRenderLimits } = charger('VirtualizeUtils');
    const Mesures = charger('ListMetricsAggregator').default;
    lance = true;

    const lot = Number(reglage('maxToRenderPerBatch'));
    const fenetre = Number(reglage('windowSize'));
    const gapFil = /\bgap\s*:/.test(styleNomme(home, 'classicContent') || '') ? 10 : 0;
    const hauteurs = [613, 631, 613, 631, 569, 551, 551, 461, 444, 533, 533, 444, 324, 462, 462, 260, 260, 462, 462, 462];
    const balayer = ({ trou, separateur }) => {
      const donnees = hauteurs.map((_, i) => ({ id: `p${i}` }));
      const props = {
        data: donnees, getItemCount: (d) => d.length, getItem: (d, i) => d[i], keyExtractor: (p) => p.id,
      };
      const mesures = new Mesures();
      let y = 12;
      donnees.forEach((p, i) => {
        const h = hauteurs[i] + (i < hauteurs.length - 1 ? separateur : 0);
        mesures.notifyCellLayout({
          cellIndex: i, cellKey: p.id, orientation: { horizontal: false, rtl: false },
          layout: { x: 0, y, width: 356, height: h },
        });
        y += h + trou;
      });
      const visible = 590;
      const fautes = [];
      let prec = { first: 0, last: 1 };
      const pas = (offset, velocity) => computeWindowedRenderLimits(props, lot, fenetre, prec, mesures, {
        offset, velocity, visibleLength: visible, dt: 16, zoomScale: 1,
      });
      const passe = (de, a, saut) => {
        for (let o = de; saut > 0 ? o <= a : o >= a; o += saut) {
          const n = pas(o, saut / 33);
          const neuves = Math.max(0, prec.first - n.first) + Math.max(0, n.last - prec.last);
          const aContresens = saut > 0 ? n.first < prec.first : n.last > prec.last;
          if (neuves > lot || aContresens) fautes.push(`${o} pt : [${prec.first},${prec.last}]→[${n.first},${n.last}]`);
          prec = n;
        }
      };
      for (const saut of [33, 66, 132]) {
        for (let k = 0; k < 30; k += 1) prec = pas(0, 0);
        passe(0, y - visible, saut);
        passe(y - visible, 0, -saut);
      }
      return fautes;
    };
    const reel = balayer({ trou: gapFil, separateur: gapFil ? 0 : 10 });
    verifier(`le vrai fenêtrage, réglages lus (lot ${lot}, fenêtre ${fenetre}) : aucune carte à contresens, au plus ${lot} par pas`,
      reel.length === 0, `${reel.length} faute(s), dont ${reel.slice(0, 3).join(' | ')}`);
    const epreuve = balayer({ trou: 10, separateur: 0 });
    verifier('…et ce balayage SAIT voir le défaut (auto-épreuve avec un trou de 10 pt)', epreuve.length > 0,
      'avec un trou, il devrait trouver des cartes montées à contresens : le contrôle ne sait plus voir ce qu’il surveille.');
  } catch (e) {
    verifier(lance ? 'le balayage du fenêtrage s’est déroulé' : 'le fenêtrage de React Native a pu être chargé', false,
      `${e.message} — le contrôle N’A PAS PU SE LANCER, ce n’est pas un succès. Il transpile `
      + '@react-native/virtualized-lists avec @babel/core et trois greffons, dépendances d’Expo : '
      + 'après une mise à jour, vérifier qu’ils existent toujours dans node_modules.');
  }
}

console.log('\n7. Une photo du fil n’est plus réduite par le processeur (iPhone)');
{
  const media = sansCommentaires(lire('src/components/Media.js'));
  verifier('`Media` accepte `pleineResolution`, faux par défaut', /pleineResolution = false/.test(media));
  verifier('…et la passe à expo-image, sur iPhone SEULEMENT',
    /allowDownscaling=\{Platform\.OS !== 'ios' \|\| !pleineResolution\}/.test(media),
    'sur Android, Glide réduit hors du fil principal : rien à gagner, de la mémoire à perdre. Et l’inverse (`={pleineResolution}`) réduirait justement les photos du fil.');
  verifier('…sans perdre le cache disque ni la clé de recyclage',
    /cachePolicy="memory-disk"/.test(media) && /recyclingKey=\{media\}/.test(media));

  const carrousel = sansCommentaires(lire('src/components/Carrousel.js'));
  const balisesMedia = [...carrousel.matchAll(/<Media\b/g)].map((m) => baliseOuvrante(carrousel, m.index));
  verifier('le Carrousel la transmet à ses DEUX photos (seule, et en série)',
    balisesMedia.length === 2 && balisesMedia.every((b) => /pleineResolution=\{pleineResolution\}/.test(b)),
    `${balisesMedia.length} balise(s) <Media> trouvée(s)`);
  verifier('…fausse par défaut : le chantier et la Place des pros gardent la réduction',
    /pleineResolution = false/.test(carrousel));

  const passeurs = fichiersSrc()
    .filter((f) => !['src/components/Media.js', 'src/components/Carrousel.js'].includes(f))
    .filter((f) => /\bpleineResolution\b/.test(sansCommentaires(lire(f))));
  verifier('seule la carte du FIL la demande', passeurs.length === 1 && passeurs[0] === 'src/components/PostCard.js',
    `trouvé dans : ${passeurs.join(', ') || '(aucun)'} — une image entière pour une petite case de grille, c’est de la mémoire pour rien.`);
  verifier('`enforceEarlyResizing` n’apparaît nulle part',
    fichiersSrc().every((f) => !/enforceEarlyResizing/.test(sansCommentaires(lire(f)))),
    'sa miniature TIENT dans le cadre : une photo verticale serait agrandie de 42 %, floue — et rangée sous la clé de l’original.');

  const natif = process.env.EXPO_IMAGE_IOS || 'node_modules/expo-image/ios';
  verifier('la bibliothèque honore toujours la propriété (code natif lu)',
    /Prop\("allowDownscaling"\)/.test(lire(`${natif}/ImageModule.swift`))
    && /if allowDownscaling && shouldDownscale\(/.test(lire(`${natif}/ImageView.swift`)),
    'une mise à jour d’expo-image qui renommerait la propriété la rendrait muette, sans aucune erreur.');
}

console.log('\n8. Aucun lecteur vidéo ne naît pendant un élan');
{
  const media = sansCommentaires(lire('src/components/Media.js'));
  const appels = media.match(/useVideoPlayer\(/g) || [];
  const debutLecteur = media.indexOf('function LecteurVideo(');
  const corpsLecteur = debutLecteur >= 0 ? media.slice(debutLecteur, media.indexOf('\n}\n', debutLecteur)) : '';
  verifier('`useVideoPlayer` n’est appelé qu’une fois, dans `LecteurVideo`',
    appels.length === 1 && /useVideoPlayer\(/.test(corpsLecteur));
  verifier('…qui garde `pointerEvents="none"` sur la vue native',
    /<VideoView[\s\S]*?pointerEvents="none"[\s\S]*?\/>/.test(corpsLecteur),
    'sans lui, la vue native garde la touche : plus de double-appui pour aimer, plus d’appui pour le plein écran.');
  const debutVideo = media.indexOf('function VideoMedia(');
  const corpsVideo = debutVideo >= 0 ? media.slice(debutVideo, debutLecteur) : '';
  verifier('le lecteur n’est rendu qu’une fois ARMÉ', /\{arme && \(\s*<LecteurVideo/.test(corpsVideo));
  verifier('…armé tout de suite sans compteur, sinon au premier arrêt APRÈS le montage',
    /const differe = repos !== undefined;/.test(corpsVideo)
    && /const \[reposAuMontage\] = useState\(repos\);/.test(corpsVideo)
    && /const arme = !differe \|\| repos !== reposAuMontage;/.test(corpsVideo),
    'un lecteur qu’on désarme est détruit puis recréé : la vidéo repart du début à chaque passage (en-tête de Media.js).');
  verifier('l’affiche ne passe jamais par <Media> (elle serait prise pour une vidéo)',
    !/<Media\b/.test(corpsVideo));

  const types = lire('src/lib/types-media.js');
  const imports = [...types.matchAll(/^import .* from '([^']+)';/gm)].map((m) => m[1]);
  verifier('`types-media.js` n’importe que `cloudinary-adresses.js`',
    imports.length === 1 && imports[0] === './cloudinary-adresses.js');
  const { estVideo, afficheVideo } = await import(path.resolve('src/lib/types-media.js'));
  const cloud = 'https://res.cloudinary.com/opus/video/upload/c_fill,h_1280,w_720/clip.mp4';
  const supa = 'https://x.supabase.co/storage/v1/object/public/publications/u/clip.mov';
  verifier('une vidéo Cloudinary a pour affiche une IMAGE de la 2e seconde',
    afficheVideo(cloud) === 'https://res.cloudinary.com/opus/video/upload/so_2,c_fill,h_1280,w_720/clip.jpg');
  verifier('…qui n’est PAS prise pour une vidéo (le défaut des grilles du portfolio)',
    estVideo(afficheVideo(cloud)) === false && estVideo(cloud) === true);
  verifier('une vidéo rangée chez Supabase n’a pas d’affiche (et pas le clip à sa place)',
    afficheVideo(supa) === null && estVideo(supa) === true);
  verifier('ni ce qui n’est pas une adresse', afficheVideo(42) === null && afficheVideo(null) === null
    && estVideo('#1b4b6b,#4d7f9e') === false);

  const home = sansCommentaires(lire('src/screens/HomeScreen.js'));
  const setters = home.match(/setRepos\(/g) || [];
  const debutArmer = home.indexOf('const armerRepos = useCallback(');
  const armer = debutArmer >= 0 ? home.slice(debutArmer, home.indexOf('}, []);', debutArmer)) : '';
  verifier('le compteur d’arrêts ne fait que MONTER, dans `armerRepos` seulement',
    setters.length === 1 && /setRepos\(\(n\) => n \+ 1\)/.test(armer),
    'un compteur qui redescendrait pourrait retrouver la valeur d’un montage et désarmer un lecteur.');
  verifier('…et l’attente est remise à zéro AVANT d’être reposée',
    armer.indexOf('clearTimeout') >= 0 && armer.indexOf('clearTimeout') < armer.indexOf('setTimeout'),
    'sans elle, un minuteur posé en début d’élan partirait EN PLEIN élan.');
  verifier('…armée par chaque défilement et chaque fin d’élan',
    /onScroll=\{armerRepos\}/.test(home) && /onMomentumScrollEnd=\{armerRepos\}/.test(home));
  verifier('…et quand la liste change sous un fil immobile',
    /useEffect\(\(\) => \{ armerRepos\(\); \}, \[posts, feedMode, armerRepos\]\);/.test(home),
    'sans lui, une vidéo visible dès l’ouverture attendrait qu’on fasse défiler pour naître.');
  verifier('le compteur ne va qu’aux cartes VIDÉO (les photos gardent leur mémorisation)',
    /repos=\{FORMATS_VIDEO\.has\(p\.format\) \? repos : undefined\}/.test(home));

  const carte = sansCommentaires(lire('src/components/PostCard.js'));
  verifier('la carte transmet le compteur et l’affiche à sa vidéo',
    /repos=\{repos\}/.test(carte) && /affiche=\{repos !== undefined \? afficheVideo\(post\.media\) : null\}/.test(carte));
  verifier('…et n’a PAS de compteur par défaut (la page d’une publication joue tout de suite)',
    /^\s*repos,$/m.test(carte) && !/repos = /.test(carte));
  verifier('`PublicationScreen` ne passe pas de compteur',
    !/\brepos=/.test(sansCommentaires(lire('src/screens/PublicationScreen.js'))));

  /* La visionneuse plein écran : sans réglage, une liste monte DIX
     éléments d'un coup — dix lecteurs vidéo nés ensemble à l'ouverture
     d'un portfolio. Trois pages au plus, et le même compteur d'arrêts que
     le fil. */
  const vis = sansCommentaires(lire('src/components/Visionneuse.js'));
  const iListe = vis.indexOf('<FlatList');
  const baliseVis = iListe >= 0 ? baliseOuvrante(vis, iListe) : '';
  verifier('la visionneuse ne monte que trois pages (la précédente, l’affichée, la suivante)',
    valeurAttribut(baliseVis, 'initialNumToRender') === '1'
    && valeurAttribut(baliseVis, 'maxToRenderPerBatch') === '1'
    && valeurAttribut(baliseVis, 'windowSize') === '3',
    'sans ces trois réglages, ouvrir un portfolio de dix vidéos crée dix lecteurs ensemble.');
  const settersVis = vis.match(/setRepos\(/g) || [];
  const dArmerVis = vis.indexOf('const armerRepos = useCallback(');
  const armerVis = dArmerVis >= 0 ? vis.slice(dArmerVis, vis.indexOf('}, []);', dArmerVis)) : '';
  verifier('…son compteur d’arrêts ne fait que MONTER, dans `armerRepos` seulement',
    settersVis.length === 1 && /setRepos\(\(n\) => n \+ 1\)/.test(armerVis)
    && armerVis.indexOf('clearTimeout') >= 0 && armerVis.indexOf('clearTimeout') < armerVis.indexOf('setTimeout'));
  verifier('…armé par chaque mouvement, chaque page où l’on se pose, et l’ouverture',
    valeurAttribut(baliseVis, 'onScroll') === 'armerRepos'
    && /onMomentumScrollEnd=\{\(e\) => \{[\s\S]*?armerRepos\(\);[\s\S]*?\}\}/.test(baliseVis)
    && /useEffect\(\(\) => \{\s*armerRepos\(\);/.test(vis),
    'sans l’ouverture, la vidéo affichée attendrait qu’on fasse glisser pour naître.');
  /* Les vignettes : une vidéo rangée chez Supabase n'a pas d'image
     d'aperçu, `apercuDe()` rend la vidéo elle-même, et `Media` créait un
     lecteur par case de la grille (2 sur 58 médias de portfolio de la vraie
     base, le 17/10). Une seule porte, `Vignette`, qui fige le compteur. */
  const vignette = sansCommentaires(lire('src/components/Vignette.js'));
  verifier('`Vignette` fige le compteur d’arrêts des vidéos sans aperçu (le lecteur ne naît jamais)',
    /const JAMAIS = 0;/.test(vignette)
    && /const image = apercuDe\(media\);/.test(vignette)
    && /repos=\{estVideo\(image\) \? JAMAIS : undefined\}/.test(vignette)
    && !/JAMAIS\s*(\+\+|\+=|=[^=])/.test(vignette.replace('const JAMAIS = 0;', '')),
    'un compteur qui bougerait armerait un lecteur dans chaque case de la grille.');
  const directes = fichiersSrc().filter((f) => f !== 'src/components/Vignette.js'
    && /<Media\b[^>]*media=\{apercuDe\(/.test(sansCommentaires(lire(f))));
  verifier('aucun écran ne passe `apercuDe()` à `<Media>` lui-même (une vignette passe par `Vignette`)',
    directes.length === 0, `trouvé dans : ${directes.join(', ')}`);
  const utilisatrices = fichiersSrc().filter((f) => /<Vignette\b/.test(sansCommentaires(lire(f))));
  verifier(`…et les cinq vignettes du projet l’utilisent (${utilisatrices.length})`, utilisatrices.length >= 5,
    `seulement : ${utilisatrices.join(', ')}`);

  verifier('…et il ne va qu’aux VIDÉOS, avec leur affiche',
    /repos=\{estVideo\(item\) \? repos : undefined\}/.test(vis)
    && /affiche=\{estVideo\(item\) \? afficheVideo\(item\) : null\}/.test(vis));
}

/* RELEVÉ AU TOURNAGE DU 25/10/2026, confirmé deux fois : la barre d'actions
   vivait DANS le geste du double appui, parce qu'elle est posée sur la photo.
   « Commentaires » d'une vidéo ouvrait le panneau puis le lecteur 0,2 s plus
   tard ; deux appuis sur « Partager » aimaient. Un parent reçoit aussi les
   appuis de ses enfants : aucun bouton ne vit dans le geste. */
console.log('\nAucun bouton ne vit dans le geste du double appui');
{
  const carte = sansCommentaires(lire('src/components/PostCard.js'));
  const i = carte.indexOf('<DoubleAppui');
  const j = carte.indexOf('</DoubleAppui>');
  const dedans = i >= 0 && j > i ? carte.slice(i, j) : '';
  verifier('le geste n’enveloppe que le média : ni Pressable ni bouton entre ses balises',
    dedans.length > 0 && !/<Pressable|<BtnMini|onPress=/.test(dedans));
  verifier('…et la barre d’actions est posée APRÈS lui, en sœur',
    j > 0 && carte.indexOf('barreSurPhoto', j) > j);
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le fil ne refait rien pour rien. Ce que le doigt RESSENT, lui, ne se '
  + 'juge que sur l’iPhone.\n');
